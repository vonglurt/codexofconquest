// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §VM-01-G-FU-d — the harbor chains (§SPARK-01/02 · §WHODUNIT-01 · §NAVAL-01 · §PORT-01/02 at
// LCY/SEN/GCI/DNF/MME): six blocks to NODE_HOOKS verbatim, the stack's only button-less block
// (the SEN Clot/Warmth panel) to NODE_PANELS ×3 states, ZERO verbs. The §11 slice plan's "GCI
// intercept = D3 concurrent menu" is corrected by measurement: two of its three role buttons
// write a STRING enum (sbChosenRole) and flag_write is boolean-only — the HCA class — so the
// block stays a hook and the D3 conversion is filed, not defaulted. The MME hull repair is the
// plan shape that HELD: the seventh hand-written gold site now pays through the `cost` leaf via
// _uqfRunChain (the junction-vignette consumer shape).
//
// The slice carried ONE content fix, the G-FU-a Glut's Gift class: the LCY writ beat was
// circular-dead since it shipped — the panel's insertion guard required kingsWritSeen, whose
// only writer was the Inspector button INSIDE that panel. quest_spark_01 (gate:{}) let the arc
// skip the beat, so the counterfeit-writ scene and item were unreachable while the confrontation
// still listed "the three claims" as if the player had seen the first one.
//
// §SPARK-01-FU — MEASURED 2026-08-05, FIXED 2026-08-06: the Scene-5 confrontation double-paid
// on the G-FU-d build (the inline button AND quest_spark_05's onComplete each paid +400gp/
// +400 XP and each granted a Letter of True Passage). The fix is the la_riva/hg1 shape: the
// button writes only aldousConfessed; the quest — whose completion was already keyed on that
// flag — is the single payer. The confrontation test below pins the single-pay contract.
//
// POSITIVE CONTROL: the registry/source tests and the two fix tests fail at HEAD. Every other
// behaviour test passes BOTH ways by design — the blocks moved verbatim (49-combo golden:
// 46/49 byte-identical, the 3 deltas exactly the writ fix ×2 and the cost-leaf refusal channel).
'use strict';
const { test, expect } = require('@playwright/test');
const { SEED_STATE, dismissContinue } = require('./helpers');

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

const clickIn = (page, panelId, text) =>
  page.locator('#' + panelId + ' button', { hasText: text }).first().evaluate(el => el.click());

test.describe('§VM-01-G-FU-d — registry + source shape', () => {
  test('the six harbor hooks sit as a contiguous registry run with callable fns', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      const first = NODE_HOOKS.findIndex(h => h.id === 'spark-lcy-harmony');
      const run = first === -1 ? [] : NODE_HOOKS.slice(first, first + 6);
      return {
        ids: run.map(h => h.id),
        nodes: run.map(h => (h.nodes || []).join(',')),
        fns: run.every(h => typeof h.fn === 'function'),
        anchors: run.every(h => h.anchor === undefined),
      };
    });
    expect(r.ids).toEqual(['spark-lcy-harmony', 'whodunit-sen-bilge', 'naval-gci-intercept',
      'port-dnf-access', 'spark-dnf-harmony', 'port-mme-saltwick']);
    expect(r.nodes).toEqual(['LCY', 'SEN', 'GCI', 'DNF', 'DNF', 'MME']);
    expect(r.fns).toBe(true);
    expect(r.anchors, 'story-text-box-anchored, not npc-row').toBe(true);
  });

  test('the SEN Clot/Warmth panel sits in NODE_PANELS: three entries share one DOM id with exclusive whens', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      const ms = NODE_PANELS.filter(p => p.id === 'story-spark-ms');
      const states = [{}, { pipMet: true }, { pipMet: true, bioluminescentParasiteFound: true },
        { pipMet: true, bioluminescentParasiteFound: true, whodunitSolved: true },
        { pipMet: true, whodunitSolved: true }];
      return {
        count: ms.length,
        nodes: ms.every(p => p.nodes.join(',') === 'SEN'),
        exclusive: states.every(s => ms.filter(p => p.when(s)).length <= 1),
        gated: ms.every(p => !p.when({})),
      };
    });
    expect(r.count, 'one entry per chrome state').toBe(3);
    expect(r.nodes).toBe(true);
    expect(r.exclusive, 'the DUS else-leg rule: entries sharing a DOM id never co-render').toBe(true);
    expect(r.gated, 'nothing renders before pipMet — the block\'s own outer gate').toBe(true);
  });

  test('the seven block bodies are gone from storyRender; dispatch calls sit in their place', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      const src = storyRender.toString();
      return {
        calls: ['spark-lcy-harmony', 'whodunit-sen-bilge', 'naval-gci-intercept',
          'port-dnf-access', 'spark-dnf-harmony', 'port-mme-saltwick']
          .filter(id => src.indexOf("_runNodeHook('" + id + "'") === -1),
        // signature locals from each former inline body must no longer appear in storyRender
        residue: ['_spkDiv', '_inspBtn', '_pipBtn', '_aldBtn', '_msDiv', '_wdDiv', '_wdBtn',
          '_wdHookBtn', '_sbDiv', '_btnParley', '_btnExamine', '_btnFight', '_fightBtn2',
          '_dfDiv', '_dfBtn', '_spk2Div', '_fehnBtn', '_oatBtn', '_fehnHookBtn',
          '_skDiv', '_skBtn', '_skBtn2', '_hullDiv', '_hullBtn']
          .filter(sig => src.indexOf(sig) !== -1),
      };
    });
    expect(r.calls, 'every harbor hook has its in-place dispatch call').toEqual([]);
    expect(r.residue, 'no former block body remains inline in storyRender').toEqual([]);
  });
});

test.describe('§VM-01-G-FU-d — the LCY writ-beat fix (red on HEAD: the beat was circular-dead)', () => {
  test('LCY fresh: the Inspector panel renders with the writ button INSIDE — the beat the guard strangled', async ({ page }) => {
    await at(page, 'LCY');
    const r = await page.evaluate(() => {
      const p = document.getElementById('story-spark-dk');
      return { text: p ? p.textContent : '', btnInside: !!(p && p.querySelector('button')) };
    });
    expect(r.text).toContain('Inspector Aldous Wren-Pembury. He is waiting for you to solve his problem');
    expect(r.btnInside, 'the button lives INSIDE the panel — the embedded-button shape that keeps this a hook').toBe(true);
  });

  test('clicking the writ button grants the counterfeit writ ONCE; the re-render keeps the scene but not the button', async ({ page }) => {
    await at(page, 'LCY');
    await clickIn(page, 'story-spark-dk', 'Speak to Inspector Wren-Pembury');
    const r = await page.evaluate(() => ({
      writs: (S_story.inventory || []).filter(i => i.name === "King's Writ (Counterfeit)").length,
      seen: !!S_story.kingsWritSeen,
      panel: (document.getElementById('story-spark-dk') || {}).textContent || '',
      btnLeft: !!document.querySelector('#story-spark-dk button'),
    }));
    expect(r.writs).toBe(1);
    expect(r.seen).toBe(true);
    expect(r.panel, 'the scene text survives its own re-render').toContain('waiting for you to solve his problem');
    expect(r.btnLeft, 'no second writ: the beat\'s own flag gates its button').toBe(false);
  });
});

test.describe('§VM-01-G-FU-d — the MME hull repair pays through the `cost` leaf', () => {
  test('short of coin: Dorit refuses through the house storyBlock shake and nothing is spent', async ({ page }) => {
    await at(page, 'MME', { saltwickAccessed: true, gold: 100 });
    await clickIn(page, 'story-sk-hull', 'Commission hull repair');
    const r = await page.evaluate(() => ({
      gold: S_story.gold, repaired: !!S_story.shipRepaired,
      msg: (document.getElementById('story-move-msg') || {}).textContent || '',
      cls: (document.getElementById('story-move-msg') || {}).className || '',
      btnEnabled: !document.querySelector('#story-sk-hull button').disabled,
    }));
    expect(r.gold, 'refuse-at-click: no part-payment').toBe(100);
    expect(r.repaired).toBe(false);
    expect(r.msg).toContain('Short. Come back when the purse is right');
    expect(r.cls, 'the cost leaf refuses through storyBlock — the house shake every gold site uses').toContain('msg-shake');
    expect(r.btnEnabled, 'a refused verb stays clickable — the price is stated, not withheld').toBe(true);
  });

  test('with the purse right: the leaf takes exactly 200gp and the verbatim body does the rest', async ({ page }) => {
    await at(page, 'MME', { saltwickAccessed: true, gold: 500 });
    await clickIn(page, 'story-sk-hull', 'Commission hull repair');
    const r = await page.evaluate(() => ({
      gold: S_story.gold, repaired: !!S_story.shipRepaired,
      done: ((document.getElementById('story-sk-hull') || {}).textContent || ''),
    }));
    expect(r.gold).toBe(300);
    expect(r.repaired).toBe(true);
    expect(r.done, 'the re-render shows the repaired state').toContain('Hull repaired. The Tilbury Star runs clean');
  });
});

test.describe('§VM-01-G-FU-d — §SPARK-01/§WHODUNIT-01 at LCY/SEN behave as the blocks did', () => {
  test('LCY Pip beat: +150 XP once, Smalt\'s Trust consumed, the bead granted, the inconsistency noted', async ({ page }) => {
    await at(page, 'LCY', { smaltBefriended: true,
      inventory: [{ name: "Smalt's Trust", icon: '🐟', type: 'misc', sell: 5 }] });
    await clickIn(page, 'story-spark-dk', 'Follow Smalt south');
    const r = await page.evaluate(() => ({
      xp: S_story.xp, pip: !!S_story.pipMet, noticed: !!S_story.wrenpemburyInconsistencyNoticed,
      inv: (S_story.inventory || []).map(i => i.name),
    }));
    // 150 from the block + 150 from quest_spark_02 (The Overture), which completes on pipMet
    // in the same render — measured at HEAD, byte-identical in the golden.
    expect(r.xp).toBe(300);
    expect(r.pip).toBe(true);
    expect(r.noticed).toBe(true);
    expect(r.inv).toContain("Pip's Friendship Bead");
    expect(r.inv).not.toContain("Smalt's Trust");
  });

  test('LCY confrontation §SPARK-01-FU FIX: +400gp/+400 XP once, the writ torn, ONE Letter of True Passage', async ({ page }) => {
    await at(page, 'LCY', { smaltBefriended: true, pipMet: true, whodunitSolved: true,
      wrenpemburyInconsistencyNoticed: true,
      inventory: [{ name: "King's Writ (Counterfeit)", icon: '📋', type: 'misc', sell: 0 }] });
    await clickIn(page, 'story-spark-dk', 'Confront Aldous');
    const r = await page.evaluate(() => ({
      gold: S_story.gold, xp: S_story.xp, done: !!S_story.harmonyChainComplete,
      conf: !!S_story.aldousConfessed,
      inv: (S_story.inventory || []).map(i => i.name),
    }));
    // §SPARK-01-FU FIX — the button writes only aldousConfessed; quest_spark_05 completes on
    // it in the same render and its onComplete is the single payer (+400gp/+400 XP, the writ
    // item_remove, ONE Letter, harmonyChainComplete). The extra +150 XP is quest_spark_02
    // completing on pipMet in this fresh-quests state, as before. On the double-pay build
    // this click paid +800gp/950 XP and granted TWO Letters.
    expect(r.conf).toBe(true);
    expect(r.gold).toBe(SEED_STATE.gold + 400);
    expect(r.xp).toBe(550);
    expect(r.done, 'harmonyChainComplete now written by the quest').toBe(true);
    expect(r.inv.filter(n => n === 'Letter of True Passage').length, 'the quest grants exactly one').toBe(1);
    expect(r.inv).not.toContain("King's Writ (Counterfeit)");
  });

  test('SEN: the Clot panel multiplexes its three states from the NODE_PANELS table', async ({ page }) => {
    await at(page, 'SEN');
    await expect(page.locator('#story-spark-ms')).toHaveCount(0);
    await at(page, 'SEN', { pipMet: true });
    await expect(page.locator('#story-spark-ms')).toContainText('Pip is in your pack. On its left ear: Clot');
    await at(page, 'SEN', { pipMet: true, bioluminescentParasiteFound: true });
    await expect(page.locator('#story-spark-ms')).toContainText('The Warmth is identified');
    await at(page, 'SEN', { pipMet: true, bioluminescentParasiteFound: true, whodunitSolved: true });
    const solved = await page.evaluate(() => {
      const p = document.getElementById('story-spark-ms');
      return { text: p.textContent, chrome: p.style.borderLeftColor };
    });
    expect(solved.text).toContain('Mystery solved. The Warmth bloomed in the perfume vats');
    expect(solved.chrome, 'the solved chrome is the block\'s own override, serialized').toBe('rgb(42, 90, 42)');
  });

  test('SEN stack: the bilge panel renders ABOVE the Clot panel — the inline LIFO, preserved across the split homes', async ({ page }) => {
    await at(page, 'SEN', { pipMet: true, saltwickAccessed: true });
    const r = await page.evaluate(() => {
      const sibs = [];
      let el = document.getElementById('story-text-box').nextElementSibling;
      while (el && sibs.length < 20) { sibs.push(el.id || ''); el = el.nextElementSibling; }
      return { iWd: sibs.indexOf('story-whodunit2-ms'), iMs: sibs.indexOf('story-spark-ms') };
    });
    expect(r.iWd, 'bilge panel present').toBeGreaterThanOrEqual(0);
    expect(r.iMs, 'Clot panel present').toBeGreaterThanOrEqual(0);
    expect(r.iWd < r.iMs, 'the hook (inserted later) stacks above the panels-phase entry, as inline').toBe(true);
  });

  test('SEN bilge: investigate pays +50 XP; the witness state\'s battle button fires MS_BILGE through the staged beat', async ({ page }) => {
    await at(page, 'SEN', { saltwickAccessed: true });
    await clickIn(page, 'story-whodunit2-ms', 'Investigate the missing cargo');
    const hook = await page.evaluate(() => ({ xp: S_story.xp, hooked: !!S_story.whodunit2HookReceived }));
    expect(hook.xp).toBe(50);
    expect(hook.hooked).toBe(true);
    await at(page, 'SEN', { saltwickAccessed: true, whodunit2WitnessRead: true });
    await clickIn(page, 'story-whodunit2-ms', 'Descend to the bilge');
    await page.waitForTimeout(600); // the hook keeps the block's own 400ms staged beat verbatim
    const r = await page.evaluate(() => ({
      overlay: document.getElementById('story-prebatt-overlay').classList.contains('visible'),
      code: _preBattNode && _preBattNode.code,
      key: _preBattNode && _preBattNode.battle && _preBattNode.battle.key,
      count: _preBattNode && _preBattNode.battle && _preBattNode.battle.count,
    }));
    expect(r.overlay).toBe(true);
    expect(r.code, 'the synthetic defeatedBattles key').toBe('MS_BILGE');
    expect(r.key).toBe('sea_spawn');
    expect(r.count).toBe(2);
  });
});

test.describe('§VM-01-G-FU-d — §NAVAL-01 at GCI behaves as the block did', () => {
  test('the role menu: three buttons INSIDE one panel; parley writes the STRING role — the measured reason this is a hook, not D3 verbs', async ({ page }) => {
    await at(page, 'GCI');
    const fresh = await page.evaluate(() => {
      const p = document.getElementById('story-sb-intercept');
      return { btns: p ? p.querySelectorAll('button').length : 0, text: p ? p.textContent : '' };
    });
    expect(fresh.btns, 'a concurrent menu, all three roles visible at once').toBe(3);
    expect(fresh.text).toContain('Three options. Choose your role.');
    await clickIn(page, 'story-sb-intercept', 'speak to their captain');
    const r = await page.evaluate(() => ({ seen: !!S_story.sbApproachSeen, role: S_story.sbChosenRole }));
    expect(r.seen).toBe(true);
    expect(r.role, 'a string enum no boolean flag_write expresses').toBe('parley');
  });

  test('the fight leg: the staged SB_PRIVATEER beat; the three resolved texts multiplex', async ({ page }) => {
    await at(page, 'GCI', { sbApproachSeen: true, sbChosenRole: 'fight' });
    await clickIn(page, 'story-sb-intercept', 'clear the privateer crew');
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => ({
      overlay: document.getElementById('story-prebatt-overlay').classList.contains('visible'),
      code: _preBattNode && _preBattNode.code,
    }));
    expect(r.overlay).toBe(true);
    expect(r.code).toBe('SB_PRIVATEER');
    await at(page, 'GCI', { sbResolved: true, sbParleySucceeded: true });
    await expect(page.locator('#story-sb-intercept')).toContainText('took the eighty gold and stood down');
    await at(page, 'GCI', { sbResolved: true, sbPapersRead: true });
    await expect(page.locator('#story-sb-intercept')).toContainText('The Eastern Reach seal date gave her away');
    await at(page, 'GCI', { defeatedBattles: { SB_PRIVATEER: true } });
    await expect(page.locator('#story-sb-intercept')).toContainText('The privateer crew is cleared');
  });
});

test.describe('§VM-01-G-FU-d — §PORT-01/02 + §SPARK-02 at DNF/MME behave as the blocks did', () => {
  test('DNF: the kelpie-gated entry pays +100 XP; the harmony chain stacks ABOVE the access panel', async ({ page }) => {
    await at(page, 'DNF');
    await expect(page.locator('#story-df-access')).toContainText('The doors in Dunfall are barred');
    await at(page, 'DNF', { defeatedBattles: { KIR: true } });
    await clickIn(page, 'story-df-access', 'Enter Dunfall');
    const r = await page.evaluate(() => ({ xp: S_story.xp, open: !!S_story.dunfallAccessed }));
    expect(r.xp).toBe(100);
    expect(r.open).toBe(true);
    await at(page, 'DNF', { dunfallAccessed: true });
    const order = await page.evaluate(() => {
      const sibs = [];
      let el = document.getElementById('story-text-box').nextElementSibling;
      while (el && sibs.length < 20) { sibs.push(el.id || ''); el = el.nextElementSibling; }
      return { iSpark: sibs.indexOf('story-spark2-df'), iAccess: sibs.indexOf('story-df-access') };
    });
    expect(order.iSpark).toBeGreaterThanOrEqual(0);
    expect(order.iAccess).toBeGreaterThanOrEqual(0);
    expect(order.iSpark < order.iAccess, 'in-place dispatch preserves the original LIFO stacking').toBe(true);
  });

  test('DNF confrontation: +400gp/+400 XP, the spore released, the Highland Letter of Clearance written', async ({ page }) => {
    await at(page, 'DNF', { dunfallAccessed: true, brimFound: true,
      inventory: [{ name: 'Dunfall Drift Spore', icon: '✨', type: 'misc', sell: 0 }] });
    await clickIn(page, 'story-spark2-df', 'Confront Commissioner Fehn');
    const r = await page.evaluate(() => ({
      gold: S_story.gold, xp: S_story.xp, done: !!S_story.dunfallHarmonyComplete,
      inv: (S_story.inventory || []).map(i => i.name),
    }));
    expect(r.gold).toBe(SEED_STATE.gold + 400);
    expect(r.xp).toBe(400);
    expect(r.done).toBe(true);
    expect(r.inv).toContain('Highland Letter of Clearance');
    expect(r.inv).not.toContain('Dunfall Drift Spore');
  });

  test('MME: the credential states multiplex; the hull panel renders ABOVE the access panel (the source comment says below; the DOM says above — pinned as measured)', async ({ page }) => {
    await at(page, 'MME');
    await expect(page.locator('#story-sk-access')).toContainText('The dock gate is closed. Saltwick runs on vouches');
    await expect(page.locator('#story-sk-hull')).toHaveCount(0);
    await at(page, 'MME', { aldousConfessed: true });
    await clickIn(page, 'story-sk-access', "Aldous's letter");
    const r = await page.evaluate(() => ({ xp: S_story.xp, open: !!S_story.saltwickAccessed }));
    expect(r.xp).toBe(150);
    expect(r.open).toBe(true);
    await at(page, 'MME', { saltwickAccessed: true });
    const order = await page.evaluate(() => {
      const sibs = [];
      let el = document.getElementById('story-text-box').nextElementSibling;
      while (el && sibs.length < 20) { sibs.push(el.id || ''); el = el.nextElementSibling; }
      return { iHull: sibs.indexOf('story-sk-hull'), iAccess: sibs.indexOf('story-sk-access') };
    });
    expect(order.iHull).toBeGreaterThanOrEqual(0);
    expect(order.iAccess).toBeGreaterThanOrEqual(0);
    expect(order.iHull < order.iAccess, 'last insert = top: the hull panel sits above the access panel, as inline').toBe(true);
  });
});
