// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
'use strict';
// §AUDIT-03e — the NODE_MAP `code` backfill.
//
// 287 of 416 authored NODE_MAP entries omit the redundant `code:` field, but every runtime
// consumer reads `node.code`. At a code-less node that was `undefined`, so all 287 SHARED the
// single `undefined` slot in every per-node state map (`visited`, `defeatedBattles`,
// `sleptAtNodes`, the corpse record) and every `NODE_DIALOGUE`/`VENDOR_NODES`/`_bfsGridPath`
// lookup missed. The fix backfills `code = key` right after the NODE_MAP section.
//
// This suite pins: (1) the identity premise that makes the backfill safe, (2) the shared-slot
// regressions — which a single-node load CANNOT see, they need two arrivals in one session,
// (3) the revived NPC dialogues, and (4) the deliberate §AUDIT-03d activation seam, so that
// removing it is a decision someone makes rather than an accident.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { seedAndLoad, dismissContinue } = require('./helpers');

// The §KG Soviet corridor + §MATH station nodes — the backfilled entries that carry real content.
const KG_NPC_NODES = ['SPB', 'KMS', 'ZVD', 'FBR', 'TVR'];

test.describe('§AUDIT-03e — NODE_MAP code backfill', () => {

  test('premise: every entry\'s code equals its key, and the backfilled set is exactly the ones that omitted it', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const keys = Object.keys(NODE_MAP);
      return {
        total: keys.length,
        mismatched: keys.filter(k => NODE_MAP[k].code !== k),
        missing: keys.filter(k => !NODE_MAP[k].code),
        backfilled: NODE_CODE_BACKFILLED.size,
        backfilledAllExist: [...NODE_CODE_BACKFILLED].every(k => !!NODE_MAP[k]),
      };
    });
    // The identity that makes `code = key` provably behaviour-preserving for the 129 authored ones.
    expect(r.mismatched, 'no NODE_MAP entry may have code !== key').toEqual([]);
    expect(r.missing, 'after the backfill no entry may lack a code').toEqual([]);
    expect(r.total).toBe(416);
    expect(r.backfilled, '287 entries omitted `code:` in source').toBe(287);
    expect(r.backfilledAllExist).toBe(true);
  });

  test('shared-slot regression: two backfilled nodes each pay exploration XP and each record their own visited flag', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // Two backfilled nodes with no loot, so the grant is isolated from inventory effects.
      const [a, b] = [...NODE_CODE_BACKFILLED].filter(k => !NODE_MAP[k].loot && !NODE_MAP[k].junction).slice(0, 2);
      S_story.visited = {}; S_story.xp = 0; S_story.level = 1; S_story.explorationXp = 0;
      storyCollectLoot(NODE_MAP[a]);
      const afterFirst = S_story.xp;
      storyCollectLoot(NODE_MAP[b]);          // a DIFFERENT node — must pay again
      const afterSecond = S_story.xp;
      return { a, b, EXPLORE_XP, afterFirst, afterSecond,
               visitedKeys: Object.keys(S_story.visited).sort(),
               undefinedSlot: Object.prototype.hasOwnProperty.call(S_story.visited, 'undefined') };
    });
    expect(r.a).not.toBe(r.b);
    expect(r.afterFirst, 'first backfilled node pays EXPLORE_XP').toBe(r.EXPLORE_XP);
    // Before the backfill both wrote visited[undefined], so the second arrival read as already
    // visited and paid NOTHING — 286 of the 287 nodes could never grant exploration XP.
    expect(r.afterSecond, 'the SECOND backfilled node must pay too').toBe(r.EXPLORE_XP * 2);
    expect(r.visitedKeys, 'each node records its own visited key').toEqual([r.a, r.b].sort());
    expect(r.undefinedSlot, 'nothing may land in the shared `undefined` slot').toBe(false);
  });

  test('shared-slot regression: defeating a battle at one backfilled node does not mark the others defeated', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const withBattle = [...NODE_CODE_BACKFILLED].filter(k => NODE_MAP[k].battle);
      S_story.defeatedBattles = {};
      S_story.defeatedBattles[NODE_MAP[withBattle[0]].code] = true;   // "win" the first one
      return { withBattle,
               first: !!S_story.defeatedBattles[NODE_MAP[withBattle[0]].code],
               others: withBattle.slice(1).map(k => !!S_story.defeatedBattles[NODE_MAP[k].code]) };
    });
    expect(r.withBattle.length, 'the backfilled set carries real encounters').toBeGreaterThanOrEqual(6);
    expect(r.first).toBe(true);
    // Before the backfill every one of these keyed on `undefined`, so one win locked out the rest.
    expect(r.others.some(Boolean), 'no other backfilled battle may read as already defeated').toBe(false);
  });

  test('revival: the §KG corridor NPCs are talkable — NPC_DIALOGUE resolves and the Talk button enables', async ({ page }) => {
    for (const code of KG_NPC_NODES) {
      const pageErrors = [];
      page.on('pageerror', e => pageErrors.push(String(e)));
      await seedAndLoad(page, { currentCode: code, checkpointNode: code, visited: {} });
      await dismissContinue(page);
      const r = await page.evaluate(c => ({
        hasInlineNpc: !!NODE_MAP[c].npc,
        dialogueResolves: !!NPC_DIALOGUE[NODE_MAP[c].code],
        talkDisabled: document.getElementById('btn-dpad-npc').disabled,
      }), code);
      expect(r.hasInlineNpc, `${code} declares an inline npc`).toBe(true);
      // Before the backfill NPC_DIALOGUE[undefined] was undefined, so these five NPCs — Volkov,
      // Roshkova, Grimka, Iosif, Lena — had never been talkable in live play.
      expect(r.dialogueResolves, `${code} NPC_DIALOGUE resolves`).toBe(true);
      expect(r.talkDisabled, `${code} Talk button is enabled`).toBe(false);
      expect(pageErrors, `${code} renders without page errors`).toEqual([]);
    }
  });

  test('§AUDIT-03d seam: WM holds its 151 objective-less vignettes instead of firing them on arrival', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'WM', checkpointNode: 'WM', visited: {}, quests: {} });
    await dismissContinue(page);
    await page.waitForTimeout(900);   // let any delayed onActivate narration land
    const r = await page.evaluate(() => ({
      activated: Object.keys(S_story.quests || {}),
      pendingAtWM: Object.values(QUEST_DB).filter(q => q && q.activateNode === 'WM' && q.type !== 'epic').length,
      seamApplies: NODE_CODE_BACKFILLED.has('WM'),
    }));
    expect(r.seamApplies, 'WM is a backfilled node').toBe(true);
    expect(r.pendingAtWM, 'WM really is the mass-activation hot spot').toBeGreaterThan(300);
    // Held deliberately: these carry a vacuous `gate:{}` AND no `completion` — the §AUDIT-03d
    // imported-chain class, where act4/act5 finales would fire ahead of their own act1. Staging
    // them is 03d's design call; when it lands, delete the seam and this expectation together.
    expect(r.activated, 'no objective-less vignette activates on arrival at WM').toEqual([]);
  });

  test('the seam frees authored arcs: §MATH-01 and §KG chain heads activate on arrival for the first time', async ({ page }) => {
    // Both arcs were shipped believing they worked; their nodes were code-less, so arrival
    // activation never ran. A real `completion` clause is what distinguishes them from the
    // objective-less §AUDIT-03d vignettes the seam holds.
    for (const [node, quest] of [['EHZ', 'quest_math_02'], ['SPB', 'quest_kg_01']]) {
      await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: {}, quests: {} });
      await dismissContinue(page);
      const r = await page.evaluate(q => ({
        status: (S_story.quests || {})[q],
        hasCompletion: !!QUEST_DB[q].completion,
        activeCount: Object.keys(S_story.quests || {}).length,
      }), quest);
      expect(r.hasCompletion, `${quest} carries a real completion clause`).toBe(true);
      expect(r.status, `${quest} activates on arrival at ${node}`).toBe('active');
      expect(r.activeCount, `${node} does not dump a wall of quests`).toBeLessThanOrEqual(3);
    }
  });

  test('source guard: the backfill is a runtime normalisation, not 287 authored fields, and the ending map is pinned', async () => {
    const src = fs.readFileSync(path.join(__dirname, '../../roll2hit-v3.html'), 'utf8');
    const nodeMapSrc = src.slice(src.indexOf('WORLDBUILDER:NODE_MAP:START'), src.indexOf('WORLDBUILDER:NODE_MAP:END'));
    const authored = (nodeMapSrc.match(/\bcode:\s*['"]/g) || []).length;
    expect(authored, 'the data section keeps its 129 authored code fields — the fix is one loader line').toBe(129);
    expect(src).toContain('const NODE_CODE_BACKFILLED = new Set(Object.keys(NODE_MAP).filter(k => !NODE_MAP[k].code));');
    // _renderFinalMap must NOT widen from 129 to all 416 cells (9-col grid → ~47 rows). §AUDIT-03e-FU.
    expect(src).toContain('.filter(k => NODE_MAP[k] && !NODE_CODE_BACKFILLED.has(k));');
  });
});
