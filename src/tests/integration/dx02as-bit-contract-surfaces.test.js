// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02as — every key BIT_CONTRACTS accepts is either consumed or refused. A contract
// field that validates green and does nothing is a bit an author can write and the
// game will silently ignore.
//
// Pure-node (no browser): QUEST:CORE is byte-identical in src/js/quest.js and play.html
// (check:quest-parity), so the module is the kernel the game runs.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const { createQuestRuntime, validateQuest, BIT_CONTRACTS } = require(path.join(ROOT, 'src', 'js', 'quest.js'));
const WBAPI = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));

const uqf = bits => ({ id: 'x', schema: 'UQF-1.0', bits });

// Keys no authored bit carries today, each with the reader that makes it live.
const RESERVED = {
  'skill_check.adv':  '_rollSkill draws a second d20 and keeps the higher/lower',
  'cost.resource':    'the cost handler debits a named resource (§VM-01-G4a)',
  'cost.count':       'the cost handler debits more than one of the resource',
  'combat.count':     'the combat handler passes it to storyPreBattle',
  'favor.cap':        'the favor handler clamps an add at it',
  'item_check.name':  'ctx._itemCheck, read by a host resuming a choice (uqf-coroutine test 5)',
  'item_check.count': 'ctx._itemCheck, read by a host resuming a choice (uqf-coroutine test 5)',
};
// Keys the kernel handler does not read because the host does.
const HOST_READ = {
  'skill_check.skill': '_resolveQuestUQF prints it as the roll card label',
};

function authoredKeys() {
  const START = '// ◆◆◆ QUEST:CORE:START ◆◆◆', END = '// ◆◆◆ QUEST:CORE:END ◆◆◆';
  let src = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8');
  src = src.slice(0, src.indexOf(START)) + src.slice(src.indexOf(END));
  const re = new RegExp(`\\{\\s*kind\\s*:\\s*['"](${Object.keys(BIT_CONTRACTS).join('|')})['"]`, 'g');
  const used = {};
  let m, bits = 0;
  while ((m = re.exec(src))) {
    let depth = 0, i = m.index, quote = null;
    for (; i < src.length; i++) {
      const c = src[i];
      if (quote) { if (c === '\\') { i++; continue; } if (c === quote) quote = null; continue; }
      if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
      if (c === '{') depth++;
      else if (c === '}' && --depth === 0) break;
    }
    bits++;
    const set = used[m[1]] || (used[m[1]] = new Set());
    for (const k of WBAPI._sectionTopKeys(src.slice(m.index, i + 1))) set.add(k);
  }
  return { used, bits };
}

function runtime(draws) {
  let n = 0;
  const state = { abilityScores: { dex: 10 }, level: 1 };
  const rt = createQuestRuntime({ getState: () => state, effects: { rng: () => draws[n++] } });
  return { rt, drawn: () => n };
}

test.describe('§DX-02as — BIT_CONTRACTS accepts only what something reads', () => {
  test('unlock.npcs no longer satisfies the validator on its own', () => {
    expect(validateQuest(uqf([{ kind: 'unlock', npcs: ['x'] }])).valid).toBe(false);
    expect(validateQuest(uqf([{ kind: 'unlock', quests: ['q'] }])).valid).toBe(true);
  });

  test('a template-only narrative bit is refused', () => {
    expect(validateQuest(uqf([{ kind: 'narrative', template: 'x' }])).valid).toBe(false);
    expect(validateQuest(uqf([{ kind: 'narrative', msg: 'x' }])).valid).toBe(true);
  });

  test('skill_check.adv takes adv / dis / norm and nothing else', () => {
    const sc = adv => uqf([{ kind: 'skill_check', stat: 'DEX', dc: 10, onPass: [], adv }]);
    for (const a of [undefined, 'adv', 'dis', 'norm']) expect(validateQuest(sc(a)).valid, String(a)).toBe(true);
    expect(validateQuest(sc('advantage')).valid).toBe(false);
  });

  test('advantage keeps the higher d20, disadvantage the lower, and a plain roll draws once', () => {
    // 0.1 → 2, 0.9 → 18 on Math.ceil(rng * 20)
    const adv = runtime([0.1, 0.9]);
    const a = adv.rt._rollSkill('DEX', 'adv');
    expect([a.d20, a.rolls, adv.drawn()]).toEqual([18, [2, 18], 2]);
    const dis = runtime([0.1, 0.9]);
    const d = dis.rt._rollSkill('DEX', 'dis');
    expect([d.d20, d.rolls, dis.drawn()]).toEqual([2, [2, 18], 2]);
    for (const none of [undefined, 'norm']) {
      const plain = runtime([0.1, 0.9]);
      const p = plain.rt._rollSkill('DEX', none);
      expect([p.d20, p.rolls, plain.drawn()]).toEqual([2, [2], 1]);
    }
  });

  test('every contract key is read by its handler or its host', () => {
    const { rt } = runtime([0.5]);
    const unread = [];
    for (const [kind, c] of Object.entries(BIT_CONTRACTS)) {
      let body = String(rt.HANDLERS[kind] || '');
      if (kind === 'skill_check') body += String(rt.resolveSkillCheck) + String(rt._rollSkill);
      for (const f of [...c.required, ...c.optional]) {
        if (!new RegExp(`\\.${f}\\b`).test(body) && !HOST_READ[`${kind}.${f}`]) unread.push(`${kind}.${f}`);
      }
    }
    expect(unread).toEqual([]);
  });

  test('every contract key is authored somewhere, or reserved with its reader named', () => {
    const { used, bits } = authoredKeys();
    expect(bits).toBeGreaterThan(5000);
    const unauthored = [], stale = [];
    for (const [kind, c] of Object.entries(BIT_CONTRACTS)) {
      for (const f of [...c.required, ...c.optional]) {
        const id = `${kind}.${f}`, has = (used[kind] || new Set()).has(f);
        if (!has && !RESERVED[id]) unauthored.push(id);
        if (has && RESERVED[id]) stale.push(id);
      }
    }
    expect(unauthored, 'authored by nothing and not reserved').toEqual([]);
    expect(stale, 'reserved but now authored — drop the reservation').toEqual([]);
  });
});
