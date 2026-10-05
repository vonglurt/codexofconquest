// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §VM-01-G2b — the npc-row hooks: the Birka-region blocks G2 deferred.
//
// G2 extracted the 7 Class-E blocks that append to #story-text-box. The 29 blocks in the
// Birka region append to `npcRowDiv` — a LOCAL of storyRender — which is the "ctx-argument
// design" G2 recorded as the blocker. The measured answer is that `npcRowDiv` is the ONLY
// storyRender local any of the 29 blocks reads, so the whole contract is `{ npcRowDiv }`.
// Bodies moved byte-for-byte (not re-indented); proven a no-op at ship time by a 17-combo
// golden-DOM/state diff — 16 identical, and the 17th (HKG) differs between two runs of the
// SAME code because the CY Madness Gate draws `Math.random()`, filed as §DX-02m.
'use strict';
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

const IDS = ['birka-varga-watch', 'birka-pachelbel-ledger', 'birka-quill-couperin-farewell',
  'birka-gigault-stall', 'birka-deacon-code', 'birka-brynn-maintenance', 'birka-night-ambient',
  'birka-nivers-passes', 'birka-blue-shutters', 'birka-froberger-memorial', 'birka-no-fishing-sign',
  'birka-s54-joint-witness', 'birka-yael-named-report', 'birka-yael-patrol-line',
  'birka-cy-madness-gate', 'birka-cy-maintenance-plate', 'birka-cy-ngplus-line',
  'birka-s6-joint-conversation', 'birka-weckmann-log', 'birka-brynn-heartwood-letter',
  'birka-brynn-regulars', 'birka-s49-entry41', 'birka-room6', 'birka-lamp-inquiry',
  'birka-lamp-choice', 'birka-quill-brynn-song', 'birka-quill-ngplus-song', 'birka-rod-shop',
  'birka-quill-ambient-song'];

async function renderAt(page, code, ov = {}) {
  await seedAndLoad(page, Object.assign({ currentCode: code, checkpointNode: code,
    visited: {}, rngState: 424242 }, ov));
  await dismissContinue(page);
}

test.describe('§VM-01-G2b — npc-row hooks', () => {
  test('registry: 29 npc-row entries in former source order, all anchor-tagged and callable', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const row = NODE_HOOKS.filter(h => h.anchor === 'npc-row');
      return {
        ids: row.map(h => h.id),
        allFns: row.every(h => typeof h.fn === 'function'),
        // the npc-row block is CONTIGUOUS — the registry's ordering convention is "former
        // storyRender source position": the Birka region sits after every G2 block, and
        // §VM-01-G-FU-a's crown hooks (WG0 trial, HCA Leviathan) sit after IT, because the
        // §CROWN-01 stack accreted below the npc-row region in storyRender source order.
        contiguousTail: (() => {
          const first = NODE_HOOKS.findIndex(h => h.anchor === 'npc-row');
          return NODE_HOOKS.slice(first, first + row.length).every(h => h.anchor === 'npc-row');
        })(),
        uniqueIds: new Set(NODE_HOOKS.map(h => h.id)).size === NODE_HOOKS.length,
      };
    });
    expect(r.ids).toEqual(IDS);
    expect(r.allFns).toBe(true);
    expect(r.contiguousTail).toBe(true);
    expect(r.uniqueIds).toBe(true);
  });

  test('the ctx contract is honoured: a hook appends into the element it is HANDED, not a global', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      // dispatch the stall hook against a synthetic anchor — if the body had been rewritten to
      // reach for document.getElementById('story-npc-cards-row') this would render nothing
      const live = document.getElementById('story-npc-cards-row');
      const liveBefore = live ? live.children.length : -1;
      const el = document.createElement('div');
      _runNodeHook('birka-gigault-stall', NODE_MAP['LHR'], { npcRowDiv: el });
      return { appended: el.children.length, liveBefore, liveAfter: live ? live.children.length : -1 };
    });
    expect(r.appended, 'the hook rendered into the caller-supplied anchor').toBeGreaterThan(0);
    expect(r.liveAfter, 'and nothing leaked into the real row on the page').toBe(r.liveBefore);
  });

  test('ctx is required only where it is used: 21 hooks destructure npcRowDiv, 8 take (node) alone', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const row = NODE_HOOKS.filter(h => h.anchor === 'npc-row');
      const withCtx = row.filter(h => /^function [\w$]+\(node, \{ npcRowDiv \}\)/.test(h.fn.toString()));
      const bare = row.filter(h => /^function [\w$]+\(node\)/.test(h.fn.toString()));
      return {
        withCtx: withCtx.length, bare: bare.length, total: row.length,
        // a bare hook must not mention npcRowDiv at all — that would be a ReferenceError waiting
        bareClean: bare.every(h => h.fn.toString().indexOf('npcRowDiv') === -1),
      };
    });
    expect(r.withCtx).toBe(21);
    expect(r.bare).toBe(8);
    expect(r.withCtx + r.bare).toBe(r.total);
    expect(r.bareClean, 'a hook that takes no ctx never names the anchor').toBe(true);
  });

  test('live surfaces still render (one probe per node in the region)', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));

    await renderAt(page, 'LLA', { npcFavorability: { pachelbel: 3 } });
    await expect(page.locator('#story-npc-cards-row')).toContainText('watching the door');
    await expect(page.locator('#story-npc-cards-row')).toContainText('📋 The code on the wall.');
    await expect(page.locator('#story-npc-cards-row')).toContainText('📒 Read the ledger.');

    await renderAt(page, 'TLL', { gameDay: 2, storyAct: 4, npcFavorability: { brynn: 1 } });
    await expect(page.locator('#story-npc-cards-row')).toContainText('📒 The ledger.');

    await renderAt(page, 'TLL', { gameDay: 3, storyAct: 6, npcFavorability: { brynn: 3 },
      brynnKeeperStoryTold: true, frobergerLastEntryRead: true });
    await expect(page.locator('#story-npc-cards-row')).toContainText('🕯 Let it keep burning.');

    await renderAt(page, 'LHR', {});
    await expect(page.locator('#story-npc-cards-row')).toContainText('🔵 The blue-shuttered building on Scholar\'s Row.');
    await expect(page.locator('#story-npc-cards-row')).toContainText('⛪ Examine the memorial.');
    await expect(page.locator('#story-npc-cards-row')).toContainText('NO FISHING');

    await renderAt(page, 'HKG', { cyMadnessRoll: 'clear' });
    await expect(page.locator('#story-cy-plate')).toBeVisible();
    await expect(page.locator('#story-npc-cards-row')).toContainText('📓 The training log.');

    await renderAt(page, 'SSJ', { gold: 500 });
    await expect(page.locator('#story-npc-cards-row')).toContainText('🎣 Browse Rods');

    expect(pageErrors).toEqual([]);
  });

  test('flag-only hooks still fire their side effects (the 8 that render no DOM here)', async ({ page }) => {
    await renderAt(page, 'HKG', { ngPlusRun: 1 });
    expect(await page.evaluate(() => S_story.cyNgPlusLineDelivered), 'CY NG+ line').toBe(true);

    await renderAt(page, 'MHQ', { npcFavorability: { quill: 3, brynn: 3 } });
    expect(await page.evaluate(() => S_story.s54QuillBrynnDelivered), "Quill plays Brynn's song").toBe(true);
  });

  test('in-place dispatch preserves append order inside the row (source order = child order)', async ({ page }) => {
    await renderAt(page, 'LLA', { s8VargaWatches: 1 });
    const r = await page.evaluate(() => {
      const kids = [...document.getElementById('story-npc-cards-row').children].map(e => e.textContent);
      return {
        iVarga: kids.findIndex(t => t.indexOf('corner table') !== -1),
        iDeacon: kids.findIndex(t => t.indexOf('The code on the wall') !== -1),
      };
    });
    expect(r.iVarga).toBeGreaterThanOrEqual(0);
    expect(r.iDeacon).toBeGreaterThan(r.iVarga);       // deacon-code block follows the Varga block in source
  });

  test('§DX-02es: the Gigault bread stall stands in the LHR market, not in The Rough Bar', async ({ page }) => {
    const stallAt = async code => {
      await renderAt(page, code, { gameDay: 1 });
      return page.evaluate(() => (document.getElementById('story-npc-cards-row') || { textContent: '' })
        .textContent.indexOf("Gigault's bread stall") !== -1);
    };
    expect(await stallAt('LHR')).toBe(true);
    expect(await stallAt('LLA')).toBe(false);
  });

  // §VM-01-G2b-FU / §DX-02ft — these five beats once read `actNumber`, the act of the tile under
  // the player, and every Birka node is act 1, so none could fire. They now read `storyAct`,
  // campaign progress derived from the shards held, which no render overwrites.
  test('§DX-02ft: the five act-gated Birka beats read campaign progress, not the act of the tile', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const ids = ['birka-lamp-inquiry', 'birka-brynn-heartwood-letter', 'birka-yael-named-report',
        'birka-s54-joint-witness', 'birka-quill-couperin-farewell'];
      const out = {};
      for (const id of ids) {
        const src = NODE_HOOKS.find(x => x.id === id).fn.toString();
        out[id] = { storyAct: /\(S_story\.storyAct \|\| 1\) *(===|>=)/.test(src), actNumber: /actNumber/.test(src) };
      }
      out._renderWritesAct = /S_story\.(actNumber|storyAct) *=[^=]/.test(storyRender.toString());
      return out;
    });
    expect(r._renderWritesAct, 'storyRender no longer assigns the act on arrival').toBe(false);
    for (const id of Object.keys(r).filter(k => k[0] !== '_')) {
      expect(r[id].storyAct, id + ' gates on storyAct').toBe(true);
      expect(r[id].actNumber, id + ' no longer reads actNumber').toBe(false);
    }
  });

  test('§DX-02ft: Act VIII opens with the seventh shard, and Brynn\'s farewell fires at TLL', async ({ page }) => {
    await renderAt(page, 'TLL', { shards: 6, npcFavorability: { brynn: 1 } });
    const before = await page.evaluate(() => ({ act: S_story.storyAct, fired: !!S_story.act8FarewellBrynn }));
    expect(before).toEqual({ act: 7, fired: false });

    await renderAt(page, 'TLL', { shards: 7, npcFavorability: { brynn: 1 } });
    const after = await page.evaluate(() => ({
      act: S_story.storyAct, fired: !!S_story.act8FarewellBrynn,
      loaf: S_story.inventory.filter(i => i.name === "Brynn's Loaf").length,
    }));
    expect(after).toEqual({ act: 8, fired: true, loaf: 1 });
  });

  test('source guard: the 29 bodies are gone from storyRender; every dispatch call sits in its place', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(ids => {
      const src = storyRender.toString();
      return {
        missingCalls: ids.filter(id => src.indexOf("_runNodeHook('" + id + "', node, _npcHookCtx)") === -1),
        // one signature string per extracted block must no longer appear inline
        residue: ['watching the door', 'Read the ledger', 'ACT8_FAREWELL_BEATS', '_getGigaultState',
          'The code on the wall', 'BRYNN_MAINTENANCE_TASKS', 'NIGHT_AMBIENT[', "Nivers's been on that corner",
          'blue-shuttered building', 'Examine the memorial', 'NO FISHING', 'S54_JOINT_MOMENT',
          'yaelNamedReportDelivered', '_getYaelLocation', '_CY_MADNESS', 'story-cy-plate',
          'cyNgPlusLineDelivered', 's6JointDelivered', '_buildWeckmannLog', 'BRYNN_HEARTWOOD_SCENE',
          'brynLedgerBalance', 's49BrynnDelivered', 'room6-sub', 'brynnKeeperStoryTold',
          'brynnLightChoiceMade', 's54QuillBrynnDelivered', 'Browse Rods', 's45-ask-quill']
          .filter(sig => src.indexOf(sig) !== -1),
        ctxDeclared: src.indexOf('const _npcHookCtx = { npcRowDiv }') !== -1,
      };
    }, IDS);
    expect(r.missingCalls, 'every npc-row hook has its in-place dispatch call, ctx included').toEqual([]);
    expect(r.residue, 'no former block body remains inline in storyRender').toEqual([]);
    expect(r.ctxDeclared, 'the ctx object is built once, beside the anchor it carries').toBe(true);
  });
});
