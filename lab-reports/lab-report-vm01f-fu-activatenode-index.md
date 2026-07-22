<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §VM-01-F-FU: the `activateNode` index (retire `storyCheckQuests`' per-render linear scan)

> **Status:** design LOCKED 2026-07-22. Child follow-on of §VM-01-F (finding #9, the byproduct the F increment reverted-and-deferred because a built-once cache went stale under runtime `QUEST_DB` injection). 🟢 **LOOP** — clear next step, one design call to lock (the invalidation strategy). No kernel edit, no parity fence, no `js/quest.js` mirror: this is **host render-path code**, not a quest kernel bit.

## 1. The finding (verbatim from §VM-01-F / BACKLOG)

`storyCheckQuests` (`roll2hit-v3.html:29624`) activates quests at the current node with a **per-render linear scan of all ~2,850 quests**:

```js
Object.values(QUEST_DB).forEach(q => {
  if (q.type === 'epic') return;
  if (!S_story.quests[q.id] && q.activateNode === node.code) {
    if (q.activateCond && !q.activateCond()) return;
    if (q.schema === 'UQF-1.0' && !QuestRuntime.canActivate(q.id)) return;
    S_story.quests[q.id] = 'active';
    msgs.push('📋 ' + q.title);
  }
});
```

`storyRender` calls `storyCheckQuests` on **every** arrival / resolution / battle end, so this `Object.values(QUEST_DB)` allocation + 2,850-element `.forEach` callback runs on every render. The overwhelming majority of those 2,850 iterations are rejected by the `q.activateNode === node.code` string compare — the node in hand offers a handful of quests, not thousands.

The idiom to reach for already exists twice in the file:
- `_questNodes()` (`36094`) — `let _questNodeSet = null` built-once `Set` of nodes that offer ≥1 quest.
- `_gateFlagSet()` (`25714`) — `let _gateFlagCache = null` built-once `Set` of gate-load-bearing flags. Its own comment: *"Lazy + cached like `_questNodes()`; QUEST_DB is static at runtime."*

An `activateNode → [quests]` index built the same way turns the O(2,850) scan into an O(1) `Map.get(node.code)` returning only the quests that could post at this node.

## 2. Why §VM-01-F reverted it — the exact staleness bug

Both existing caches (`_questNodes`, `_gateFlagSet`) are **built once and never invalidated** — they bank on *"QUEST_DB is static at runtime."* In the **shipped game that is true**: `QUEST_DB` is an immutable `const` and no quest is ever added at runtime. But three consumers mutate it after the first render:

1. **The test harness** — `quest-runtime-uqf.test.js:257` injects `QUEST_DB.__uqf_gate` at runtime, calls `storyCheckQuests` twice (gate closed → open), then `delete`s it. A built-once index built during page-load never contains `__uqf_gate`, so the injected quest never activates → `after` is `undefined`, not `'active'` → **test fails**. This is the exact regression the F attempt produced (the *only* new red it created) and why finding #9 was reverted and deferred here.
2. **The worldbuilder editor** — injects/edits quests live into the running page.
3. **A future §MESH-delivered quest** — same shape.

So the increment is **entirely about the invalidation strategy**, not the index shape.

## 3. The design call — LOCKED

The three options the BACKLOG row names:

| # | Strategy | Injector cooperation | Verdict |
|---|----------|----------------------|---------|
| **A** | **Size-guarded rebuild** — cache `Object.keys(QUEST_DB).length`; rebuild whenever it differs. O(n) `.length` per render, but **no per-quest predicate**. | **None** — any add/remove that changes the entry count is caught automatically. | ✅ **CHOSEN** |
| B | Mutation-versioned cache — injectors bump a version counter. | Every injector (harness, editor, MESH) must cooperate. | ✗ invasive; would force adapting `:257`. |
| C | Documented "frozen-DB; injectors must reset" — injectors call a reset fn. | Injectors must cooperate. | ✗ would force adapting the shipped `:257` test to the engine. |

**Chosen: A, the size-guarded rebuild.** Rationale:

- **Zero injector cooperation.** The size-guard catches every runtime add/remove transparently, so the `:257` test passes **unmodified** — no "adapt the test to the engine change" (the recurring §VM-01-A lesson we avoid here entirely). Runtime injection becomes a **supported contract**, not a test-only affordance.
- **Still a net win even with an O(n) guard.** `Object.keys(QUEST_DB).length` is one native array allocation; the scan it replaces was `Object.values(QUEST_DB).forEach(cb)` — the *same* array allocation **plus** 2,850 JS-level callback invocations (property reads + a string compare each). We shed the 2,850 callbacks and, on the common path (count unchanged, always so in production), do only an O(1) `Map.get`.
- **No cache to invalidate** — the exact property the F spec wanted. There is no version to bump, no reset to remember; correctness is a pure function of the live count.

**Known, documented limitation (accepted):** a *simultaneous* add-one-and-remove-one that leaves the count unchanged would leave a stale index. This never occurs in the shipped game (frozen `const`) and no test performs such a swap; it is called out in the code comment. If a real swap-injector ever appears, it upgrades to a version bump — but that is not today's contract.

## 4. The change (host code — no kernel, no parity fence)

**New helper** beside `_questNodes()` (`36094`), same file region, same idiom:

```js
// §VM-01-F-FU — activateNode → [quests] index, retiring storyCheckQuests' per-render
// linear scan over all ~2,850 quests. Excludes epics (activated explicitly) and quests
// with no activateNode, mirroring the scan's own filters. Size-guarded: a rebuild fires
// whenever QUEST_DB's entry count changes. The shipped game's QUEST_DB is a frozen const
// so this never fires there; the test harness / worldbuilder editor / a future §MESH
// quest inject at runtime, and the size-guard catches every such add/remove with no
// injector cooperation — no cache to invalidate. (A simultaneous add-one/remove-one that
// keeps the count fixed would go stale; that never happens with a const DB and no test
// performs it.) Insertion order preserved (push in Object.values order) so multi-quest
// nodes activate in the same order as the old scan — msgs output stays byte-identical.
let _questsByNodeIndex = null, _questsByNodeCount = -1;
function _questsByNode(nodeCode) {
  const n = Object.keys(QUEST_DB).length;
  if (!_questsByNodeIndex || n !== _questsByNodeCount) {
    _questsByNodeIndex = new Map();
    for (const q of Object.values(QUEST_DB)) {
      if (!q || q.type === 'epic' || !q.activateNode) continue;
      let arr = _questsByNodeIndex.get(q.activateNode);
      if (!arr) _questsByNodeIndex.set(q.activateNode, arr = []);
      arr.push(q);
    }
    _questsByNodeCount = n;
  }
  return _questsByNodeIndex.get(nodeCode) || [];
}
```

**Rewire** the `storyCheckQuests` activation loop only (the completion loop at `29645` already iterates the small `S_story.quests` set, not `QUEST_DB` — untouched):

```js
_questsByNode(node.code).forEach(q => {
  if (!S_story.quests[q.id]) {   // epic + node filters already applied by the index
    if (q.activateCond && !q.activateCond()) return;
    if (q.schema === 'UQF-1.0' && !QuestRuntime.canActivate(q.id)) return;
    S_story.quests[q.id] = 'active';
    msgs.push('📋 ' + q.title);
  }
});
```

**Behavioural equivalence proof.** The old scan's guard is `q.type !== 'epic' && !S_story.quests[q.id] && q.activateNode === node.code`, then the two conditional gates. The index pre-applies `type !== 'epic'` and buckets by `activateNode`, so `_questsByNode(node.code)` returns exactly `{q : q.type !== 'epic' && q.activateNode === node.code}` in `Object.values` order; the remaining `!S_story.quests[q.id]` + `activateCond` + `canActivate` checks are unchanged and evaluated in the identical order. The set of quests activated, and the order of the `📋` messages, is identical. **No-op on every real code path.**

## 5. Test plan

New `tests/integration/uqf-activatenode-index.test.js`:

1. **Correctness** — `_questsByNode(code)` returns exactly the non-epic quests whose `activateNode === code`, matching a brute-force `Object.values(QUEST_DB).filter(...)` over the live corpus for several real nodes.
2. **Staleness fixed (the F regression, explicit)** — inject a quest at a node after first render, assert `_questsByNode` includes it *and* `storyCheckQuests` activates it; delete it, assert the index drops it.
3. **Order/no-op parity** — inject two quests at one fresh node, assert `storyCheckQuests` emits their `📋` messages in `Object.values` (insertion) order.
4. **Epic + no-activateNode excluded** — an `type:'epic'` quest and an `activateNode`-less quest never appear in `_questsByNode`.

Existing regression guard: **`quest-runtime-uqf.test.js:257` passes unmodified** — the definitive proof the invalidation works.

## 6. Gates

- `node --check` / inline-script parse clean.
- `quest-runtime-uqf` — **0 NEW** by git-stash-diff (the with-change failing set === the stashed-HEAD baseline).
- New `uqf-activatenode-index.test.js` green.
- `uqf-coroutine` / `uqf-env` / `uqf-quest-core` / `rng-seed` / `uqf-gate-ast` / `uqf-softlock` / `warrants-board` green.
- `npm run check:walk` — all four parity fences green (**0 sentinels changed**; this increment touches no kernel), `check:questparity` byte-identical, only the two documented pre-existing baselines red (`check:invariants` J14/J15, `check:roads` R2/R3).

## 7. Scope fence

Touches `storyCheckQuests`' activation loop + one new host helper. Does **not** touch: any `QUEST:CORE` / `MOVER` / `ROOMS` / `DUEL` kernel, `js/quest.js`, the completion loop, `_questNodes()` / `_gateFlagSet()` (left as-is — no test asserts runtime-injection against them), or the §BOARD-01 `_boardBounties` selector. No new `Math.random()`, no movement gate, no save-migration.
