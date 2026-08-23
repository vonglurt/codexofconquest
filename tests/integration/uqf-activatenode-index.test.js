// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §VM-01-F-FU — the activateNode index. storyCheckQuests' per-render O(2,850) scan over
// all of QUEST_DB is replaced by a size-guarded activateNode → [quests] Map (_questsByNode).
// These prove: (1) the index returns exactly the non-epic quests at a node, matching a
// brute-force filter over the live corpus; (2) the F-attempt's staleness bug is fixed — a
// quest injected at runtime is found (and a deleted one is dropped) with no injector
// cooperation, because the size-guard rebuilds when QUEST_DB's entry count changes;
// (3) multi-quest nodes activate in insertion order (msgs byte-identical to the old scan);
// (4) epics and activateNode-less quests are excluded. Design:
// lab-reports/lab-report-vm01f-fu-activatenode-index.md.
const { test, expect } = require('@playwright/test');

test.describe('§VM-01-F-FU — the activateNode index', () => {
  // 1. The index === a brute-force filter over the live corpus, for several real nodes.
  test('_questsByNode returns exactly the non-epic quests whose activateNode matches', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      const brute = (code) => Object.values(QUEST_DB)
        .filter(q => q && q.type !== 'epic' && q.activateNode === code)
        .map(q => q.id).sort();
      const idx = (code) => _questsByNode(code).map(q => q.id).sort();
      // sample the busiest handful of activateNodes so the comparison is non-trivial
      const counts = {};
      for (const q of Object.values(QUEST_DB)) {
        if (q && q.type !== 'epic' && q.activateNode) counts[q.activateNode] = (counts[q.activateNode] || 0) + 1;
      }
      const nodes = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e[0]);
      return nodes.map(code => ({ code, brute: brute(code), idx: idx(code) }));
    });
    expect(r.length).toBeGreaterThan(0);
    for (const { code, brute, idx } of r) {
      expect(idx, `node ${code}`).toEqual(brute);
      expect(idx.length, `node ${code} should offer >1 quest`).toBeGreaterThan(1);
    }
  });

  // 2. THE FIX: a quest injected into QUEST_DB after the first render is found — the
  //    size-guard rebuilds because the entry count changed. This is the exact regression
  //    the §VM-01-F built-once cache produced and that F-FU exists to close.
  test('a runtime-injected quest is picked up (and a deleted one dropped) — no stale cache', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      _questsByNode('DK');                     // prime the index at the base count
      const beforeInject = _questsByNode('DK').some(q => q.id === '__ffu_inject');
      QUEST_DB.__ffu_inject = { id: '__ffu_inject', schema: 'UQF-1.0', title: 'FFU Inject',
        activateNode: 'DK', gate: {}, bits: [{ kind: 'narrative', msg: 'x' }] };
      const afterInject = _questsByNode('DK').some(q => q.id === '__ffu_inject');
      // and storyCheckQuests actually activates it (end-to-end through the rewired loop)
      S_story.quests = {};
      storyCheckQuests({ code: 'DK' });
      const activated = S_story.quests.__ffu_inject;
      delete QUEST_DB.__ffu_inject;
      const afterDelete = _questsByNode('DK').some(q => q.id === '__ffu_inject');
      return { beforeInject, afterInject, activated, afterDelete };
    });
    expect(r.beforeInject).toBe(false);   // not present before injection
    expect(r.afterInject).toBe(true);     // size-guard rebuilt → present
    expect(r.activated).toBe('active');   // storyCheckQuests activated it via the index
    expect(r.afterDelete).toBe(false);    // count dropped → rebuilt without it
  });

  // 3. Order/no-op parity: two quests injected at one fresh node activate — and emit their
  //    📋 messages — in Object.values (insertion) order, exactly as the old linear scan did.
  test('multi-quest node activates in insertion order — msgs stay byte-identical', async ({ page }) => {
    await page.goto('/index.html');
    const msgs = await page.evaluate(() => {
      QUEST_DB.__ffu_a = { id: '__ffu_a', schema: 'UQF-1.0', title: 'Alpha', activateNode: 'ZZZ_FFU', gate: {}, bits: [] };
      QUEST_DB.__ffu_b = { id: '__ffu_b', schema: 'UQF-1.0', title: 'Beta',  activateNode: 'ZZZ_FFU', gate: {}, bits: [] };
      S_story.quests = {};
      const out = storyCheckQuests({ code: 'ZZZ_FFU' });
      delete QUEST_DB.__ffu_a; delete QUEST_DB.__ffu_b;
      return out;
    });
    // insertion order = __ffu_a before __ffu_b
    expect(msgs).toEqual(['📋 Alpha', '📋 Beta']);
  });

  // 4. Epics and activateNode-less quests never appear in the index (mirrors the scan filters).
  test('epic and activateNode-less quests are excluded from the index', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      QUEST_DB.__ffu_epic = { id: '__ffu_epic', schema: 'UQF-1.0', title: 'Epic', type: 'epic', activateNode: 'QQQ_FFU', gate: {}, bits: [] };
      QUEST_DB.__ffu_noact = { id: '__ffu_noact', schema: 'UQF-1.0', title: 'NoNode', gate: {}, bits: [] };
      const atNode = _questsByNode('QQQ_FFU').map(q => q.id);
      // an activateNode-less quest can't be queried by node; confirm it's in no bucket
      let inAnyBucket = false;
      for (const q of Object.values(QUEST_DB)) {
        if (q && q.activateNode && _questsByNode(q.activateNode).some(x => x.id === '__ffu_noact')) inAnyBucket = true;
      }
      delete QUEST_DB.__ffu_epic; delete QUEST_DB.__ffu_noact;
      return { atNode, inAnyBucket };
    });
    expect(r.atNode).not.toContain('__ffu_epic');
    expect(r.inAnyBucket).toBe(false);
  });
});
