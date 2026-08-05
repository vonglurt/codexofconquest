// §VM-01-G-FU-e — the §LXX family (CAN/DA2/DA3/DSJ/DSF): four blocks to NODE_HOOKS verbatim
// (every button lives inside .sweelinck-variant chrome — the WG0 embedded-button rule — and the
// DA2 gate additionally writes a NUMERIC abilityScores.int += 1, the HCA class), the stack's
// three button-less surfaces (DA2/DA3 done states + the DSF no-iodine note) to NODE_PANELS,
// and ONE verb: DSF's smelt button is the family's only BARE D1 button (the inline block
// inserted the <button> directly afterend with no panel wrapper), so it is a NODE_VERBS entry
// with fn-valued bits (the charged-preferred salt pick — the G4c precedent).
//
// MEASURED ON HEAD and preserved (filed §LXX-01-FU, the §SPARK-01-FU Aldous class):
// quest_sunken_02 / quest_depth_01 / quest_forge_02 each auto-complete on the same arrival
// that draws these buttons and duplicate the button's whole payout — the click after
// auto-completion pays AGAIN (DA2: a second permanent INT +1 and +500gp; DA3: +500 XP and a
// duplicate knowledge entry; DSF: a second Sea Element and +400gp). quest_ca_01 at CAN is the
// same pair done RIGHT (button writes flag + knowledge, quest pays) — the la_riva/hg1 shape.
//
// POSITIVE CONTROL: the registry/source tests and the recovered-narrative test fail at HEAD.
// Every other behaviour test passes BOTH ways by design — the blocks moved verbatim (25-combo
// golden: 20/25 byte-identical; 1 id-only with every bounding box equal; 4 the same recovered-
// narrative delta with state and sibling DOM byte-equal).
'use strict';
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { SEED_STATE, dismissContinue } = require('./helpers');

const HTML = fs.readFileSync(path.join(__dirname, '..', '..', 'roll2hit-v3.html'), 'utf8');

async function at(page, code, overrides = {}) {
  const state = Object.assign({}, SEED_STATE, {
    currentCode: code, checkpointNode: code, visited: { [code]: true }, visitedCells: {},
    rngState: 424242, inventory: [], quests: {},
  }, overrides);
  await page.addInitScript(s => {
    localStorage.clear();
    localStorage.setItem('r2h_autosave', JSON.stringify(s));
  }, state);
  await page.goto('/roll2hit-v3.html');
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
    await page.goto('/roll2hit-v3.html');
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
    await page.goto('/roll2hit-v3.html');
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

  test('the smelt verb is a bare label verb with fn-valued bits in a dispatched group', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const v = NODE_VERBS.find(x => x.id === 'lxx-dsf-smelt');
      const bits = typeof v.bits === 'function'
        ? v.bits({ inventory: [{ name: 'Charged Iodine Salt' }, { name: 'Iodine Salt' }] }) : null;
      const bitsPlain = typeof v.bits === 'function'
        ? v.bits({ inventory: [{ name: 'Iodine Salt' }] }) : null;
      return {
        group: v.group, nodes: (v.nodes || []).join(','), label: v.label,
        btnStyle: v.btnStyle, ambient: !!v.ambient, bitsFn: typeof v.bits === 'function',
        kinds: bits && bits.map(b => b.kind),
        pickBoth: bits && bits[0].name,
        pickPlain: bitsPlain && bitsPlain[0].name,
      };
    });
    expect(r.group).toBe('lxx-dsf-smelt');
    expect(r.nodes).toBe('DSF');
    expect(r.label).toBe('🔱 Smelt the Sea Element');
    expect(r.btnStyle, 'the inline button\'s own 4px spacing').toBe('margin-top:4px;');
    expect(r.ambient, 'label-only: the verb IS its button, no wrapper').toBe(false);
    expect(r.bitsFn).toBe(true);
    expect(r.kinds).toEqual(['item_remove', 'flag_write', 'reward', 'narrative']);
    expect(r.pickBoth, 'charged is consumed first when both are held').toBe('Charged Iodine Salt');
    expect(r.pickPlain).toBe('Iodine Salt');
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

  test('DA2 §LXX-01-FU pin: quest_sunken_02 auto-completes on the qualifying arrival and the still-rendered button pays a SECOND permanent INT point', async ({ page }) => {
    await at(page, 'DA2', { inscriptionRead: true, inventory: [ELEMENT] });
    let r = await page.evaluate(() => ({
      gold: S_story.gold, int: S_story.abilityScores.int, inv: S_story.inventory.length,
      q: S_story.quests.quest_sunken_02, gate: !!S_story.tideGateOpened,
    }));
    // the arrival: activation + completion in ONE pass (the G-FU-a glut lesson), the element
    // consumed and the gate opened by the QUEST — while the fresh gate button is still drawn
    expect(r.q).toBe('complete');
    expect(r.gate).toBe(true);
    expect(r.gold, 'SEED 500 + the quest\'s 500').toBe(1000);
    expect(r.int, 'SEED 12 + the quest\'s +1').toBe(13);
    expect(r.inv).toBe(0);
    const btn = await sibs(page);
    expect(btn[0], 'the fresh button is still on the page').toContain('Place the Sea Element');
    await clickSib(page, 'Place the Sea Element');
    await page.waitForTimeout(150);
    r = await page.evaluate(() => ({ gold: S_story.gold, int: S_story.abilityScores.int }));
    // the double-pay, preserved as measured (filed §LXX-01-FU): a second +500gp and a second
    // PERMANENT stat point. When the content fix lands, THIS assertion is the one it flips.
    expect(r.gold).toBe(1500);
    expect(r.int).toBe(14);
  });

  test('DA3: fresh + done states; the click writes flag, knowledge and +500 XP', async ({ page }) => {
    await at(page, 'DA3');
    let s = await sibs(page);
    expect(s[0]).toContain('The tidal configuration of the Antecedent is active');
    await clickSib(page, 'Acknowledge the closing');
    await page.waitForTimeout(150);
    const r = await page.evaluate(() => ({
      xp: S_story.xp, kn: S_story.knowledge.length, flag: !!S_story.antecedentDepthMet,
    }));
    expect(r.flag).toBe(true);
    expect(r.kn).toBe(1);
    expect(r.xp).toBe(500);
    await at(page, 'DA3', { antecedentDepthMet: true });
    s = await sibs(page);
    expect(s.length).toBe(1);
    expect(s[0], 'done state — the NODE_PANELS entry').toContain('Both chains closed');
    expect(s[0]).not.toContain('id=');
  });

  test('DA3 §LXX-01-FU pin: quest_depth_01 completes on bare arrival and the click duplicates knowledge + XP', async ({ page }) => {
    await at(page, 'DA3', { quests: { quest_depth_01: 'active' }, tideGateOpened: true });
    let r = await page.evaluate(() => ({
      xp: S_story.xp, kn: S_story.knowledge.length, q: S_story.quests.quest_depth_01,
    }));
    expect(r.q).toBe('complete');
    expect(r.xp, 'the quest\'s xpAward').toBe(500);
    expect(r.kn).toBe(1);
    await clickSib(page, 'Acknowledge the closing');
    await page.waitForTimeout(150);
    r = await page.evaluate(() => ({ xp: S_story.xp, kn: S_story.knowledge.length }));
    expect(r.xp, 'the double-pay, preserved as measured').toBe(1000);
    expect(r.kn, 'the knowledge entry is duplicated').toBe(2);
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

  test('DSF: the smelt pays exactly once and prefers the charged salt', async ({ page }) => {
    await at(page, 'DSF', { forgeActivated: true, inventory: [IODINE, CHARGED], quests: { quest_forge_02: 'complete' } });
    await clickSib(page, 'Smelt the Sea Element');
    await page.waitForTimeout(150);
    const r = await page.evaluate(() => ({
      gold: S_story.gold, inv: S_story.inventory.map(i => i.name),
      flag: !!S_story.seaElementCrafted,
    }));
    expect(r.flag).toBe(true);
    expect(r.gold, 'SEED 500 + 400, once').toBe(900);
    expect(r.inv, 'charged consumed, plain kept, the Element granted').toEqual(['Iodine Salt', 'Sea Element']);
  });

  test('DSF §LXX-01-FU pin: quest_forge_02 auto-completes on arrival-with-iodine and the still-rendered button smelts a SECOND Sea Element', async ({ page }) => {
    await at(page, 'DSF', { forgeActivated: true, inventory: [IODINE] });
    let r = await page.evaluate(() => ({
      gold: S_story.gold, inv: S_story.inventory.map(i => i.name), q: S_story.quests.quest_forge_02,
    }));
    expect(r.q).toBe('complete');
    expect(r.gold).toBe(900);
    expect(r.inv).toEqual(['Sea Element']);
    await clickSib(page, 'Smelt the Sea Element');
    await page.waitForTimeout(150);
    r = await page.evaluate(() => ({ gold: S_story.gold, inv: S_story.inventory.map(i => i.name) }));
    expect(r.gold, 'the double-pay, preserved as measured').toBe(1300);
    expect(r.inv).toEqual(['Sea Element', 'Sea Element']);
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
