// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §VM-01-G-FU-b — the §HUNT-01/02 stack: four panel blocks to NODE_HOOKS verbatim (G2's method)
// and the three pure-text panels (HFT done, KSU hull ×2 states, ALF trail ×2 states) to
// NODE_PANELS. The plan's "2 combat verbs" (BN hag, LD drowners) corrected by measurement the
// same way WG0/HCA did in G-FU-a: both battle buttons live INSIDE .sweelinck-variant chrome, so
// they stay hooks until the G4c-FU ask-2 panel-chrome question is answered. WRO's done panel
// stays in its hook rather than NODE_PANELS for a measured stacking reason: the junction
// vignette + Corelli button co-render at WRO and _renderNodePanels runs EARLIER than both
// inserts, so the panel table would re-stack it below them (pinned by the LIFO test here).
//
// POSITIVE CONTROL: the registry/source tests fail at HEAD. Every behaviour test passes BOTH
// ways by design — the whole stack moved verbatim (22-combo golden: 22/22 byte-identical incl.
// bboxes and click outcomes), and a test that only passes after the change could not prove that
// (G2's honest shape).
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

test.describe('§VM-01-G-FU-b — registry + source shape', () => {
  test('the four hunt hooks sit as a contiguous registry run with callable fns', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      // §VM-01-G-FU-c appended the alch/wisdom hooks after these (their stack sits below the
      // hunt region in source order), so the pin is the contiguous run, no longer the tail —
      // the same adjustment G-FU-a made to the npc-row pin when the crown stack landed below it.
      const first = NODE_HOOKS.findIndex(h => h.id === 'hunt-wro-relay');
      const tail = first === -1 ? [] : NODE_HOOKS.slice(first, first + 4);
      return {
        ids: tail.map(h => h.id),
        nodes: tail.map(h => (h.nodes || []).join(',')),
        fns: tail.every(h => typeof h.fn === 'function'),
        anchors: tail.every(h => h.anchor === undefined),
      };
    });
    expect(r.ids).toEqual(['hunt-wro-relay', 'hunt-bnx-bend', 'hunt-hft-elder', 'hunt-vaw-den']);
    expect(r.nodes).toEqual(['WRO', 'BNX', 'HFT', 'VAW']);
    expect(r.fns).toBe(true);
    expect(r.anchors, 'story-text-box-anchored, not npc-row').toBe(true);
  });

  test('the five hunt panels sit in NODE_PANELS: per-state entries share one DOM id with exclusive whens', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      const lh = NODE_PANELS.filter(p => p.id === 'story-hunt-lh');
      const ln = NODE_PANELS.filter(p => p.id === 'story-hunt-ln');
      const hftDone = NODE_PANELS.filter(p => (p.nodes || []).indexOf('HFT') !== -1);
      const excl = (pair, states) => states.every(s =>
        pair.filter(p => p.when(s)).length <= 1);
      return {
        lh: lh.length, ln: ln.length, hftDone: hftDone.length,
        hftDoneIdless: hftDone.every(p => p.id === undefined),
        lhNodes: lh.every(p => p.nodes.join(',') === 'KSU'),
        lnNodes: ln.every(p => p.nodes.join(',') === 'ALF'),
        // the DUS else-leg rule: entries sharing a DOM id must never co-render
        lhExclusive: excl(lh, [{}, { huntHookReceived: true }, { huntHookReceived: true, lakeClueFound: true }]),
        lnExclusive: excl(ln, [{}, { lakeClueFound: true }, { lakeClueFound: true, lakeLairLocated: true }]),
      };
    });
    expect(r.lh, 'KSU hull panel: one entry per chrome state').toBe(2);
    expect(r.ln, 'ALF trail panel: one entry per chrome state').toBe(2);
    expect(r.hftDone, 'HFT done panel migrated').toBe(1);
    expect(r.hftDoneIdless, 'the inline done div carried no id; neither does the entry').toBe(true);
    expect(r.lhNodes).toBe(true);
    expect(r.lnNodes).toBe(true);
    expect(r.lhExclusive).toBe(true);
    expect(r.lnExclusive).toBe(true);
  });

  test('the six block bodies are gone from storyRender; dispatch calls sit in their place', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      const src = storyRender.toString();
      return {
        calls: ['hunt-wro-relay', 'hunt-bnx-bend', 'hunt-hft-elder', 'hunt-vaw-den']
          .filter(id => src.indexOf("_runNodeHook('" + id + "'") === -1),
        // signature locals from each former inline body must no longer appear in storyRender
        residue: ['_j1Div', '_j1Btn', '_j1DoneDiv', '_bnDiv', '_bnBtn', '_lsDiv', '_lsBtn',
                  '_lsDoneDiv', '_lhDiv', '_lnDiv', '_ldDiv', '_ldBtn']
          .filter(sig => src.indexOf(sig) !== -1),
      };
    });
    expect(r.calls, 'every hunt hook has its in-place dispatch call').toEqual([]);
    expect(r.residue, 'no former block body remains inline in storyRender').toEqual([]);
  });
});

test.describe('§VM-01-G-FU-b — §HUNT-02 relay road (WRO/BNX) behaves as the blocks did', () => {
  test('WRO fresh: Tessie panel renders with its button INSIDE; the follow-up pays +50 XP once and lists the quests', async ({ page }) => {
    await at(page, 'WRO');
    const before = await page.evaluate(() => {
      const p = document.getElementById('story-hunt2-j1');
      return { text: p ? p.textContent : '', btnInside: !!(p && p.querySelector('button')) };
    });
    expect(before.text).toContain('At the crossroads stone: Tessie, moving east, stops');
    expect(before.btnInside, 'the button lives INSIDE the panel — the shape that keeps this a hook').toBe(true);
    await clickIn(page, 'story-hunt2-j1', 'Follow up on the relay road warning');
    const after = await page.evaluate(() => ({
      xp: S_story.xp, hooked: !!S_story.huntHook2Received,
      panel: !!document.getElementById('story-hunt2-j1'),
    }));
    expect(after.xp).toBe(50);
    expect(after.hooked).toBe(true);
    expect(after.panel, 'the hook panel does not survive its own re-render').toBe(false);
  });

  test('WRO done: the done panel stacks ABOVE the junction vignette — the measured reason it stays in the hook, not NODE_PANELS', async ({ page }) => {
    await at(page, 'WRO', { huntHook2Received: true, hagDefeated2: true });
    const r = await page.evaluate(() => {
      const sibs = [];
      let el = document.getElementById('story-text-box').nextElementSibling;
      while (el && sibs.length < 20) { sibs.push(el.textContent.slice(0, 60)); el = el.nextElementSibling; }
      return {
        iDone: sibs.findIndex(t => t.indexOf('The relay road is clear') !== -1),
        iVig: sibs.findIndex(t => t.indexOf('Tessie') !== -1 || t.indexOf('road is quiet') !== -1),
      };
    });
    expect(r.iDone, 'done panel present').toBeGreaterThanOrEqual(0);
    expect(r.iVig, 'junction vignette co-renders at WRO').toBeGreaterThanOrEqual(0);
    expect(r.iDone < r.iVig, 'in-place dispatch preserves the original LIFO stacking').toBe(true);
  });

  test('BNX: the four bend states multiplex exactly as the else-chain did', async ({ page }) => {
    await at(page, 'BNX');
    await expect(page.locator('#story-hunt2-bn')).toContainText('Hoof marks end 200 paces');
    await at(page, 'BNX', { bendRoadClue: true });
    await expect(page.locator('#story-hunt2-bn')).toContainText('INT Investigation DC 13');
    await at(page, 'BNX', { bendRoadClue: true, bendLairFound: true });
    const lair = await page.evaluate(() => {
      const p = document.getElementById('story-hunt2-bn');
      return { text: p.textContent, btnInside: !!p.querySelector('button'),
               chrome: p.style.borderLeftColor };
    });
    expect(lair.text).toContain('Night hag confirmed');
    expect(lair.btnInside).toBe(true);
    expect(lair.chrome).toBe('rgb(106, 58, 42)');
    await at(page, 'BNX', { defeatedBattles: { BN_NIGHTHAG: true } });
    await expect(page.locator('#story-hunt2-bn')).toContainText('The sleeping post is empty');
    expect(await page.evaluate(() => !!document.querySelector('#story-hunt2-bn button')),
      'the done state offers no button').toBe(false);
  });

  test('BNX fight: the staged 400ms pre-battle fires under the synthetic BN_NIGHTHAG code', async ({ page }) => {
    await at(page, 'BNX', { bendRoadClue: true, bendLairFound: true });
    await clickIn(page, 'story-hunt2-bn', 'Drive the Night Hag out');
    await page.waitForTimeout(600); // the hook keeps the block's own staged beat verbatim
    const r = await page.evaluate(() => ({
      overlay: document.getElementById('story-prebatt-overlay').classList.contains('visible'),
      code: _preBattNode && _preBattNode.code,
      key: _preBattNode && _preBattNode.battle && _preBattNode.battle.key,
      msg: (document.getElementById('story-move-msg') || {}).textContent || '',
    }));
    expect(r.overlay).toBe(true);
    expect(r.code, 'the synthetic defeatedBattles key').toBe('BN_NIGHTHAG');
    expect(r.key).toBe('night_hag');
    expect(r.msg).toContain('At dusk the sleeping post moves');
  });
});

test.describe('§VM-01-G-FU-b — §HUNT-01 lake arc (HFT/KSU/ALF/VAW) behaves as the blocks did', () => {
  test('HFT: the Elder Fisherwoman hook pays +100 XP once; hooked renders nothing; done renders the id-less panel', async ({ page }) => {
    await at(page, 'HFT');
    await expect(page.locator('#story-hunt-ls')).toContainText('ninety-one years on this lake');
    await clickIn(page, 'story-hunt-ls', 'Speak to the Elder Fisherwoman');
    const r = await page.evaluate(() => ({ xp: S_story.xp, hooked: !!S_story.huntHookReceived }));
    expect(r.xp).toBe(100);
    expect(r.hooked).toBe(true);
    await at(page, 'HFT', { huntHookReceived: true });
    await expect(page.locator('#story-hunt-ls')).toHaveCount(0);
    await at(page, 'HFT', { huntHookReceived: true, drownersDefeated: true });
    await expect(page.locator('#story-center')).toContainText('The den is cleared. The Elder Fisherwoman knows');
  });

  test('KSU: the hull panel gates on the hook and swaps chrome with the clue', async ({ page }) => {
    await at(page, 'KSU');
    await expect(page.locator('#story-hunt-lh')).toHaveCount(0);
    await at(page, 'KSU', { huntHookReceived: true });
    const fresh = await page.evaluate(() => {
      const p = document.getElementById('story-hunt-lh');
      return { text: p.textContent, chrome: p.style.borderLeftColor };
    });
    expect(fresh.text).toContain('INT Investigation DC 12');
    expect(fresh.chrome).toBe('rgb(42, 74, 90)');
    await at(page, 'KSU', { huntHookReceived: true, lakeClueFound: true });
    const done = await page.evaluate(() => {
      const p = document.getElementById('story-hunt-lh');
      return { text: p.textContent, chrome: p.style.borderLeftColor };
    });
    expect(done.text).toContain('Hull examined. The marks are physical');
    expect(done.chrome, 'the done-state chrome is the block\'s own override, serialized').toBe('rgb(58, 90, 42)');
  });

  test('ALF: the trail panel gates on the clue and swaps chrome once the den is located', async ({ page }) => {
    await at(page, 'ALF');
    await expect(page.locator('#story-hunt-ln')).toHaveCount(0);
    await at(page, 'ALF', { lakeClueFound: true });
    await expect(page.locator('#story-hunt-ln')).toContainText('WIS Perception DC 13');
    await at(page, 'ALF', { lakeClueFound: true, lakeLairLocated: true });
    const done = await page.evaluate(() => {
      const p = document.getElementById('story-hunt-ln');
      return { text: p.textContent, chrome: p.style.borderLeftColor };
    });
    expect(done.text).toContain('They denned at the shelf collapse');
    expect(done.chrome).toBe('rgb(58, 90, 42)');
  });

  test('VAW: the den button fires LD_DROWNERS ×3 through the staged beat; cleared renders the ✅ state', async ({ page }) => {
    await at(page, 'VAW');
    const fresh = await page.evaluate(() => {
      const p = document.getElementById('story-hunt-ld');
      return { text: p.textContent, btnInside: !!p.querySelector('button') };
    });
    expect(fresh.text).toContain('Three drowners are at the base of the collapse');
    expect(fresh.btnInside).toBe(true);
    await clickIn(page, 'story-hunt-ld', 'Enter the den');
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => ({
      overlay: document.getElementById('story-prebatt-overlay').classList.contains('visible'),
      code: _preBattNode && _preBattNode.code,
      key: _preBattNode && _preBattNode.battle && _preBattNode.battle.key,
      count: _preBattNode && _preBattNode.battle && _preBattNode.battle.count,
    }));
    expect(r.overlay).toBe(true);
    expect(r.code).toBe('LD_DROWNERS');
    expect(r.key).toBe('drowner');
    expect(r.count).toBe(3);
    await at(page, 'VAW', { defeatedBattles: { LD_DROWNERS: true } });
    await expect(page.locator('#story-hunt-ld')).toContainText('Den cleared. The shelf collapse is quiet');
    expect(await page.evaluate(() => !!document.querySelector('#story-hunt-ld button'))).toBe(false);
  });
});
