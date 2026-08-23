// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §VM-01-G-FU-e — the §LXX family (CAN/DA2/DA3/DSJ/DSF): four blocks to NODE_HOOKS verbatim
// (every button lives inside .sweelinck-variant chrome — the WG0 embedded-button rule — and the
// DA2 gate additionally writes a NUMERIC abilityScores.int += 1, the HCA class), the stack's
// three button-less surfaces (DA2/DA3 done states + the DSF no-iodine note) to NODE_PANELS,
// and ONE verb: DSF's smelt button is the family's only BARE D1 button (the inline block
// inserted the <button> directly afterend with no panel wrapper), so it is a NODE_VERBS entry.
//
// §LXX-01-FU (the §SPARK-01-FU Aldous class) — MEASURED 2026-08-05, FIXED 2026-08-06:
// quest_sunken_02 / quest_depth_01 / quest_forge_02 each auto-completed on the same arrival
// that draws these buttons and duplicated the button's whole payout — the click after
// auto-completion paid AGAIN (DA2: a second permanent INT +1 and +500gp; DA3: +500 XP and a
// duplicate knowledge entry; DSF: a second Sea Element and +400gp). The fix is the
// quest_ca_01 / la_riva / hg1 shape: each button/verb writes ONLY its flag, each quest's
// completion is keyed on that flag, and the quest's onComplete is the single payer — with the
// DA2/DA3 handlers' Station 7 prose (never readable on the double-pay build: destroyed by its
// own bare storyRender, §BOARD-01-FU6 class) moved into the quests' narrative bits. The three
// "§LXX-01-FU FIX" tests below pin the single-pay contract; they fail on the double-pay build.
//
// POSITIVE CONTROL (G-FU-e, historical): the registry/source tests and the recovered-narrative
// test failed on pre-migration HEAD; the verbatim-surface tests passed both ways (25-combo
// golden: 20/25 byte-identical; 1 id-only with every bounding box equal; 4 the same recovered-
// narrative delta with state and sibling DOM byte-equal).
'use strict';
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { SEED_STATE, dismissContinue } = require('./helpers');

const HTML = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');

async function at(page, code, overrides = {}) {
  const state = Object.assign({}, SEED_STATE, {
    currentCode: code, checkpointNode: code, visited: { [code]: true }, visitedCells: {},
    rngState: 424242, inventory: [], quests: {},
  }, overrides);
  await page.addInitScript(s => {
    localStorage.clear();
    localStorage.setItem('r2h_autosave', JSON.stringify(s));
  }, state);
  await page.goto('/index.html');
  await dismissContinue(page);
}

const clickSib = (page, txt) => page.evaluate(t => {
  let el = document.getElementById('story-text-box').nextElementSibling;
  while (el && el.id !== 'story-info-row') {
    if (el.tagName === 'BUTTON' && el.textContent.includes(t)) { el.click(); return true; }
    const b = Array.from(el.querySelectorAll('button')).find(x => x.textContent.includes(t));
    if (b) { b.click(); return true; }
    el = el.nextElementSibling;
  }
  return false;
}, txt);

const sibs = page => page.evaluate(() => {
  const out = [];
  let el = document.getElementById('story-text-box').nextElementSibling;
  while (el && el.id !== 'story-info-row') { out.push(el.outerHTML); el = el.nextElementSibling; }
  return out;
});

const IODINE = { name: 'Iodine Salt', icon: '🧂', type: 'item', sell: 5, desc: 'Reduced from kelp ash.' };
const CHARGED = { name: 'Charged Iodine Salt', icon: '⚡', type: 'item', sell: 20, desc: 'Charged in the noon heat.' };
const ELEMENT = { name: 'Sea Element', icon: '🔱', type: 'weapon', atkBonus: 2, dmgDie: 8, dmgCount: 1,
  dmgFlat: 0, minLevel: 1, sell: 500, desc: 'Atlantean alloy. Holds the tide\'s force in the metal. +2 ATK, 1d8 damage.' };

// ── Registry + source shape (these fail at HEAD) ────────────────────────────────────────────

test.describe('§VM-01-G-FU-e — registry + source shape', () => {
  test('the four §LXX hooks sit as a contiguous registry run with callable fns', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      const first = NODE_HOOKS.findIndex(h => h.id === 'lxx-can-doc');
      const run = first === -1 ? [] : NODE_HOOKS.slice(first, first + 4);
      return {
        ids: run.map(h => h.id),
        nodes: run.map(h => (h.nodes || []).join(',')),
        fns: run.every(h => typeof h.fn === 'function'),
        anchors: run.every(h => h.anchor === undefined),
      };
    });
    expect(r.ids).toEqual(['lxx-can-doc', 'lxx-da2-gate', 'lxx-da3-depth', 'lxx-dsj-eels']);
    expect(r.nodes).toEqual(['CAN', 'DA2', 'DA3', 'DSJ']);
    expect(r.fns).toBe(true);
    expect(r.anchors, 'story-text-box-anchored, not npc-row').toBe(true);
  });

  test('the three button-less surfaces sit in NODE_PANELS; the DSF pair is mutually exclusive', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      const da2 = NODE_PANELS.filter(p => (p.nodes || []).join(',') === 'DA2');
      const da3 = NODE_PANELS.filter(p => (p.nodes || []).join(',') === 'DA3');
      const dsf = NODE_PANELS.filter(p => p.id === 'story-dsf-smelt');
      const verb = NODE_VERBS.find(v => v.id === 'lxx-dsf-smelt');
      const salt = { forgeActivated: true, inventory: [{ name: 'Iodine Salt' }] };
      const dry = { forgeActivated: true, inventory: [] };
      return {
        da2: da2.map(p => ({ hasId: !!p.id, when: p.when({ tideGateOpened: true }) && !p.when({}) })),
        da3: da3.map(p => ({ hasId: !!p.id, when: p.when({ antecedentDepthMet: true }) && !p.when({}) })),
        dsfCount: dsf.length,
        // the note and the verb share a state axis (iodine held) and never co-render
        exclusive: verb && !dsf[0].when(salt) && dsf[0].when(dry)
                   && verb.when(salt) && !verb.when(dry),
      };
    });
    // the inline done divs were id-less; the panel entries stay id-less (an id-less entry is
    // legal — the G-FU-b HFT precedent)
    expect(r.da2).toEqual([{ hasId: false, when: true }]);
    expect(r.da3).toEqual([{ hasId: false, when: true }]);
    expect(r.dsfCount, 'the note keeps the shared story-dsf-smelt id').toBe(1);
    expect(r.exclusive, 'note renders exactly when the verb does not (the iodine test)').toBe(true);
  });

  test('the smelt verb is a bare label verb whose bits are flag + narrative only — quest_forge_02 is the payer', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      const v = NODE_VERBS.find(x => x.id === 'lxx-dsf-smelt');
      const q = QUEST_DB.quest_forge_02;
      return {
        group: v.group, nodes: (v.nodes || []).join(','), label: v.label,
        btnStyle: v.btnStyle, ambient: !!v.ambient,
        kinds: (typeof v.bits === 'function' ? v.bits({}) : v.bits).map(b => b.kind),
        completion: JSON.stringify(q.completion),
        payKinds: q.onComplete.map(b => b.kind),
      };
    });
    expect(r.group).toBe('lxx-dsf-smelt');
    expect(r.nodes).toBe('DSF');
    expect(r.label).toBe('🔱 Smelt the Sea Element');
    expect(r.btnStyle, 'the inline button\'s own 4px spacing').toBe('margin-top:4px;');
    expect(r.ambient, 'label-only: the verb IS its button, no wrapper').toBe(false);
    // §LXX-01-FU FIX — the verb writes only the flag (+ the recovered narrative);
    // quest_forge_02 completes on that flag and its onComplete owns the charged-preferred
    // salt pick (the _legacy_fn) and the single pay.
    expect(r.kinds).toEqual(['flag_write', 'narrative']);
    expect(r.completion).toBe('{"flags":["seaElementCrafted"]}');
    expect(r.payKinds).toEqual(['_legacy_fn', 'flag_write', 'reward', 'narrative']);
  });

  test('the five block bodies are gone from storyRender; dispatch calls sit in their place', async () => {
    // the four hook bodies moved VERBATIM, so their identifiers live exactly once — in the hook
    // fn, which sits before the registry declaration (storyRender is after it)
    const registryAt = HTML.indexOf('const NODE_HOOKS = [');
    for (const moved of ['_canBtn', '_gateBtn', '_depthBtn', '_eelsBtn']) {
      const hits = HTML.split(moved + ' =').length - 1;
      expect(hits, moved + ' is created exactly once — in its hook').toBe(1);
      expect(HTML.indexOf(moved + ' ='), moved + ' lives before the registry, not in storyRender')
        .toBeLessThan(registryAt);
    }
    // the smelt button/note dissolved into the verb + panel entries — no handler left behind
    for (const gone of ['_smeltBtn', '_smeltNote']) {
      expect(HTML.includes(gone), gone + ' should have left the file with its block').toBe(false);
    }
    expect(HTML).toContain("_runNodeHook('lxx-can-doc', node)");
    expect(HTML).toContain("_runNodeHook('lxx-da2-gate', node)");
    expect(HTML).toContain("_runNodeHook('lxx-da3-depth', node)");
    expect(HTML).toContain("_runNodeHook('lxx-dsj-eels', node)");
    expect(HTML).toContain("_renderNodeVerbs(node, S_story, 'lxx-dsf-smelt')");
  });
});

// ── Behaviour — verbatim surfaces (these pass BOTH ways; a no-op's behaviour tests must not
//    depend on the change) ──────────────────────────────────────────────────────────────────

test.describe('§VM-01-G-FU-e — behaviour, unchanged by design', () => {
  test('CAN: fresh renders the document panel + button; read state renders nothing', async ({ page }) => {
    await at(page, 'CAN');
    const fresh = await sibs(page);
    expect(fresh.length).toBe(1);
    expect(fresh[0]).toContain('The document in the output tray');
    expect(fresh[0]).toContain('Read the post-event document');
    await at(page, 'CAN', { conclaveResponseRead: true });
    expect((await sibs(page)).length).toBe(0);
  });

  test('CAN: the read button is the la_riva shape done right — flag + knowledge from the button, gold from the quest, paid exactly once', async ({ page }) => {
    await at(page, 'CAN', { quests: { quest_ca_01: 'active' }, tideGateOpened: true, cycle4NoteRead: true });
    await clickSib(page, 'Read the post-event document');
    await page.waitForTimeout(150);
    const r = await page.evaluate(() => ({
      gold: S_story.gold, kn: S_story.knowledge.length, flag: !!S_story.conclaveResponseRead,
      q: S_story.quests.quest_ca_01,
    }));
    expect(r.flag).toBe(true);
    expect(r.kn).toBe(1);
    expect(r.gold, 'SEED 500 + the quest\'s 300, once').toBe(800);
    expect(r.q).toBe('complete');
  });

  test('DA2: the three fresh states and the done panel', async ({ page }) => {
    await at(page, 'DA2');
    let s = await sibs(page);
    expect(s.length).toBe(1);
    expect(s[0], 'no inscription yet').toContain('the sequence is not yet clear');
    await at(page, 'DA2', { inscriptionRead: true });
    s = await sibs(page);
    expect(s[0], 'inscription read, no element').toContain('requires the Sea Element');
    await at(page, 'DA2', { tideGateOpened: true });
    s = await sibs(page);
    expect(s.length).toBe(1);
    expect(s[0], 'done state — the NODE_PANELS entry').toContain('The Gate is open');
    expect(s[0], 'inline done div was id-less').not.toContain('id=');
  });

  test('DA2 §LXX-01-FU FIX: the qualifying arrival only activates; the click pays the INT point, the gold and the element exactly once', async ({ page }) => {
    await at(page, 'DA2', { inscriptionRead: true, inventory: [ELEMENT] });
    let r = await page.evaluate(() => ({
      gold: S_story.gold, int: S_story.abilityScores.int, inv: S_story.inventory.length,
      q: S_story.quests.quest_sunken_02, gate: !!S_story.tideGateOpened,
    }));
    // the arrival now only ACTIVATES the pair — completion is keyed on the button's flag
    // (the quest_ca_01 shape), so nothing is paid before the player acts. On the double-pay
    // build this arrival completed the quest, consumed the element and paid INT 12→13.
    expect(r.q).toBe('active');
    expect(r.gate).toBe(false);
    expect(r.gold, 'SEED 500, untouched').toBe(500);
    expect(r.int, 'SEED 12, untouched').toBe(12);
    expect(r.inv, 'the element still held').toBe(1);
    const btn = await sibs(page);
    expect(btn[0], 'the gate button is drawn').toContain('Place the Sea Element');
    await clickSib(page, 'Place the Sea Element');
    await page.waitForTimeout(150);
    r = await page.evaluate(() => ({
      gold: S_story.gold, int: S_story.abilityScores.int, inv: S_story.inventory.length,
      q: S_story.quests.quest_sunken_02, gate: !!S_story.tideGateOpened,
    }));
    // the click writes the flag; the quest completes on it in the same render and pays ONCE
    expect(r.q).toBe('complete');
    expect(r.gate).toBe(true);
    expect(r.gold, 'the quest\'s +500, once').toBe(1000);
    expect(r.int, 'ONE permanent INT point').toBe(13);
    expect(r.inv, 'the element consumed by the quest').toBe(0);
  });

  test('DA3: fresh + done states; the click writes ONLY the flag — with no quest active, nothing pays', async ({ page }) => {
    await at(page, 'DA3');
    let s = await sibs(page);
    expect(s[0]).toContain('The tidal configuration of the Antecedent is active');
    await clickSib(page, 'Acknowledge the closing');
    await page.waitForTimeout(150);
    const r = await page.evaluate(() => ({
      xp: S_story.xp, kn: (S_story.knowledge || []).length, flag: !!S_story.antecedentDepthMet,
    }));
    // §LXX-01-FU FIX — the button is a flag writer (the la_riva/hg1 shape); knowledge and
    // XP come only from quest_depth_01's onComplete, absent in this questless state
    expect(r.flag).toBe(true);
    expect(r.kn, 'the button no longer grants knowledge — the quest does').toBe(0);
    expect(r.xp, 'the button no longer pays — the quest does').toBe(0);
    await at(page, 'DA3', { antecedentDepthMet: true });
    s = await sibs(page);
    expect(s.length).toBe(1);
    expect(s[0], 'done state — the NODE_PANELS entry').toContain('Both chains closed');
    expect(s[0]).not.toContain('id=');
  });

  test('DA3 §LXX-01-FU FIX: bare arrival pays nothing; the click completes the quest and pays knowledge + 500 XP once', async ({ page }) => {
    await at(page, 'DA3', { quests: { quest_depth_01: 'active' }, tideGateOpened: true });
    let r = await page.evaluate(() => ({
      xp: S_story.xp, kn: (S_story.knowledge || []).length, q: S_story.quests.quest_depth_01,
    }));
    // the old completion ({ atNode:'DA3' }) completed HERE, before the player acted
    expect(r.q).toBe('active');
    expect(r.xp).toBe(0);
    expect(r.kn).toBe(0);
    await clickSib(page, 'Acknowledge the closing');
    await page.waitForTimeout(150);
    r = await page.evaluate(() => ({
      xp: S_story.xp, kn: S_story.knowledge.length, q: S_story.quests.quest_depth_01,
    }));
    expect(r.q).toBe('complete');
    expect(r.xp, 'the quest\'s xpAward, once').toBe(500);
    expect(r.kn, 'ONE Constructor Design entry').toBe(1);
  });

  test('DSJ: the channel panel stages the synthetic DSJ_EELS battle 400ms after the click', async ({ page }) => {
    await at(page, 'DSJ');
    const s = await sibs(page);
    expect(s[0]).toContain('The channel is held by two Giant Eels');
    await clickSib(page, 'Clear the channel');
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => ({
      code: _preBattNode && _preBattNode.code,
      label: _preBattNode && _preBattNode.battle.label,
      key: _preBattNode && _preBattNode.battle.key,
      count: _preBattNode && _preBattNode.battle.count,
    }));
    expect(r.code, 'a defeatedBattles key, not a place — classified in SYNTHETIC_BATTLE_CODES').toBe('DSJ_EELS');
    expect(r.label).toBe('Giant Eel × 2 — The Kelp Channel');
    expect(r.key).toBe('giant_eel');
    expect(r.count).toBe(2);
    // and the defeated state renders nothing
    await at(page, 'DSJ', { defeatedBattles: { DSJ_EELS: true } });
    expect((await sibs(page)).length).toBe(0);
  });

  test('DSF: inactive renders nothing; active-without-iodine renders the note; active-with-iodine renders the bare button', async ({ page }) => {
    await at(page, 'DSF');
    expect((await sibs(page)).length).toBe(0);
    await at(page, 'DSF', { forgeActivated: true });
    let s = await sibs(page);
    expect(s.length).toBe(1);
    expect(s[0]).toContain('The process requires Iodine Salt');
    // the counterfactual solo state (quest already complete) isolates the button itself
    await at(page, 'DSF', { forgeActivated: true, inventory: [IODINE], quests: { quest_forge_02: 'complete' } });
    s = await sibs(page);
    expect(s.length).toBe(1);
    expect(s[0], 'a BARE button — no wrapper div, the flex column stretches it').toMatch(/^<button/);
    expect(s[0]).toContain('Smelt the Sea Element');
  });

  test('DSF: the smelt pays exactly once via the quest and prefers the charged salt', async ({ page }) => {
    // fresh quests: the arrival activates quest_forge_02 (gate: forgeActivated), the click
    // completes it — the quest's _legacy_fn owns the charged-preferred pick now
    await at(page, 'DSF', { forgeActivated: true, inventory: [IODINE, CHARGED] });
    await clickSib(page, 'Smelt the Sea Element');
    await page.waitForTimeout(150);
    const r = await page.evaluate(() => ({
      gold: S_story.gold, inv: S_story.inventory.map(i => i.name),
      flag: !!S_story.seaElementCrafted, q: S_story.quests.quest_forge_02,
    }));
    expect(r.flag).toBe(true);
    expect(r.q).toBe('complete');
    expect(r.gold, 'SEED 500 + 400, once').toBe(900);
    expect(r.inv, 'charged consumed, plain kept, the Element granted').toEqual(['Iodine Salt', 'Sea Element']);
  });

  test('DSF §LXX-01-FU FIX: arrival-with-iodine only activates; the click smelts exactly ONE Sea Element', async ({ page }) => {
    await at(page, 'DSF', { forgeActivated: true, inventory: [IODINE] });
    let r = await page.evaluate(() => ({
      gold: S_story.gold, inv: S_story.inventory.map(i => i.name), q: S_story.quests.quest_forge_02,
    }));
    // the arrival now only ACTIVATES (completion is keyed on the verb's flag — the ca_01
    // shape). On the double-pay build this arrival smelted the first Element by itself.
    expect(r.q).toBe('active');
    expect(r.gold).toBe(500);
    expect(r.inv).toEqual(['Iodine Salt']);
    await clickSib(page, 'Smelt the Sea Element');
    await page.waitForTimeout(150);
    r = await page.evaluate(() => ({
      gold: S_story.gold, inv: S_story.inventory.map(i => i.name), q: S_story.quests.quest_forge_02,
    }));
    expect(r.q).toBe('complete');
    expect(r.gold, 'paid once').toBe(900);
    expect(r.inv, 'ONE Sea Element; the salt consumed by the quest').toEqual(['Sea Element']);
  });
});

// ── The one named delta (this fails at HEAD) ────────────────────────────────────────────────

test.describe('§VM-01-G-FU-e — the recovered narrative', () => {
  test('the smelt line is readable after the click — inline, its own bare re-render destroyed it', async ({ page }) => {
    await at(page, 'DSF', { forgeActivated: true, inventory: [IODINE], quests: { quest_forge_02: 'complete' } });
    await clickSib(page, 'Smelt the Sea Element');
    await page.waitForTimeout(150);
    const msg = await page.evaluate(() => document.getElementById('story-move-msg').textContent);
    // §BOARD-01-FU6 class, fourth recovered narrative: the verb driver re-renders with the
    // chain's narrative as storyRender's prefix, so the line survives its own re-render.
    expect(msg).toContain('The iodine goes into the forge first');
    expect(msg).toContain('Sea Element: +2 ATK, 1d8. +400gp.');
  });
});
