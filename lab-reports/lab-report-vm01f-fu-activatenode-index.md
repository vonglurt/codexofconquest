<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §VM-01-F-FU: The `activateNode` Index

**Increment:** §VM-01-F-FU · **Status:** ✅ SHIPPED (Option A), `549d6b4` 2026-07-22 15:41 · **Design locked:** same day
**Parent:** §VM-01-F finding #9 — the byproduct F built, reverted, and deferred here
**Policy:** Host/Script Separation (CONTRIBUTING.md §VM-01); Lab Report Policy — pre-implementation design review
**Verified against HEAD 2026-08-22** (§DOC-02cr) — see §9. Ship-day figures re-measured in a browser on a rebuilt ship-day tree.

---

## Abstract

Arriving somewhere in *The Shattered Codex* asked the engine a question about **every quest in the game**:
`storyCheckQuests` opened each arrival by walking all 2,853 `QUEST_DB` entries to find the handful that post at
the node under the player's feet. This increment replaced that walk with a lazily-built `activateNode → [quests]`
`Map`, and spent its entire design budget not on the index — which is fifteen obvious lines — but on the one
question that had already sunk the first attempt: **when do you throw the cache away?** The answer chosen was the
cheapest possible contract, a rebuild triggered by `QUEST_DB`'s own entry count, which requires nothing of anyone
who mutates the database. The code shipped **byte-identical to the block locked in this report**, and is still
byte-identical at HEAD a month later. Re-measurement corrects the report's cost model: the speedup is a measured
**3.6×**, not the asymptotic collapse its `O(2,850) → O(1)` framing promised, because the size guard it chose is
itself Θ(n) and is now **the entire remaining cost of the call**.

---

## 1. Purpose, Intention, and What It Buys the Player

**The shape of the problem.** Story Mode is a node graph. Every arrival, every resolved event, every battle end
funnels through `storyRender`, and the first thing `storyRender` does about quests is ask *"what becomes available
here?"* The engine answered by reading the whole quest database — 2,853 entries — and rejecting 2,842 of them on a
string compare. The node in hand offers a handful; the engine was auditioning the entire cast.

**Why it matters for playability.** Honestly: at 2,853 quests this was never a stutter a player could feel. The
measured cost is **0.4 ms per arrival** (§3), well under a frame. The payoff is not latency today — it is that
**arrival cost stopped scaling with corpus size**. A narrative RPG grows by adding quests; an engine whose
per-arrival work is proportional to the total quest count taxes every future authoring increment, and taxes it
invisibly, so nobody notices until walking the map feels wrong and nobody knows which of a thousand additions did
it. Indexing is how you keep *"add a quest"* a free action.

**And there is a second payoff nobody planned for, which arrived a month later.** §VM-01-G3 needed to run the
activation pass **before** `storyRender`'s render body, so per-node UI keyed on `active` status could see
same-arrival activations. It extracted the loop into `function _uqfActivateAtNode(node)@30137` and called it
**twice per arrival** — once early, once from `storyCheckQuests` — relying on idempotence. That refactor is
comfortable only because the pass is cheap. **A cheap operation can be called from two places; an O(n) one cannot.**
The index did not make the game faster in a way a player can perceive; it made the *engine* editable in a way its
authors could act on, and someone did, without ever having to think about it.

**Where the design came from.** Nowhere clever — the idiom already existed in the file, twice, and the second
instance had left a note for whoever came next:

> *"Lazy + cached like `_questNodes()`; QUEST_DB is static at runtime."* — `function _gateFlagSet()@26133`

Both precedents build once and never rebuild, banking on that second clause. **That clause is what §VM-01-F
tripped over**, and closing the gap it hides is the whole content of this increment.

---

## 2. The Finding, and Why §VM-01-F Reverted It

`storyCheckQuests` opened with a full-corpus scan (ship-day build, `storyCheckQuests` at 29624, loop at 29627):

```js
  Object.values(QUEST_DB).forEach(q => {
    if (q.type === 'epic') return;
    if (!S_story.quests[q.id] && q.activateNode === node.code) {
      if (q.activateCond && !q.activateCond()) return;
      if (q.schema === 'UQF-1.0' && !QuestRuntime.canActivate(q.id)) return;   // §ARCH-01 Phase 2 — declarative gate
      S_story.quests[q.id] = 'active';
      msgs.push('📋 ' + q.title);
    }
  });
```

`§VM-01-F` built the obvious built-once index for this and **reverted it the same afternoon**, because
*"QUEST_DB is static at runtime"* is true of the shipped game and false of everything that authors it. Three
consumers mutate the database after first render:

| # | Injector | What it does | Real? |
|---|---|---|---|
| 1 | **The test harness** | `tests/integration/quest-runtime-uqf.test.js` injects `QUEST_DB.__uqf_gate` after the first render, calls `storyCheckQuests` twice (gate closed, then open), then deletes it | ✅ live — this is the exact test the built-once cache broke |
| 2 | **The worldbuilder** | emits an `applyPatch(NODE_MAP, QUEST_DB, …)` script that adds, modifies and **deletes** `QUEST_DB` keys | ✅ live — but see §9 C4: it is a *separate page emitting a patch*, not an in-page editor |
| 3 | **A future §MESH-delivered quest** | same shape, over the peer mesh | ⏳ speculative |

`QUEST_DB` is declared `const QUEST_DB = {@10615`, and reassigning it in the running game throws a `TypeError` —
verified live. So the *binding* is frozen and the *object* is not, which is precisely the gap: a cache keyed on
"the const never changes" is keyed on the wrong noun.

**So this increment is entirely about the invalidation strategy, not the index shape.**

---

## 3. Method — Measuring the Corpus the Index Indexes

Ship-day build reconstructed with `git archive 549d6b4`, served, and measured in Chromium; figures are the median
of three runs of 1,000 iterations each. `QUEST_DB` census taken twice, once by `js/wbapi-core.js` over the source
text and once by `Object.keys` in the running game — both give 2,853.

| Property | Ship-day (`549d6b4`) | HEAD (2026-08-22) |
|---|---:|---:|
| `QUEST_DB` entries | **2,853** | 2,853 |
| Excluded — `type:'epic'` | 40 | 40 |
| Excluded — no `activateNode` | 10 | 9 |
| **Quests in the index** | **2,803** | 2,804 |
| Distinct `activateNode` buckets | **348** | 348 |
| Bucket size — median | **3** | 3 |
| Bucket size — mean | **8.05** | 8.06 |
| Bucket size — max (`WM`) | **312** | 312 |
| Singleton buckets | 87 | — |

**The report's central intuition is right, with one loud exception it never named.** *"A handful, not thousands"*
is a median of **3**. But `WM` holds **312 quests — 11% of the whole corpus in one bucket**, and there the index
is a 9× cut, not a thousand-fold one. The `WM` archive is the game's densest single location; any claim about
"the node in hand" should be read as a claim about the median node.

**Timing, ship-day build, milliseconds per activation pass:**

| Path | LHR (11 quests) | Note |
|---|---:|---|
| Old scan — `Object.values(QUEST_DB).forEach` | **0.398** | what shipped before |
| Shipped `_questsByNode` path | **0.110** | **3.6× faster** |
| The size guard alone — `Object.keys(QUEST_DB).length` | **0.111** | ⚠️ **100.5% of the shipped path** |
| Hypothetical guard-free `Map.get` + iterate | **0.0003** | the win that was available |

The third row is the finding. **The size guard is not a small tax on an O(1) lookup; it is the entire cost of the
call, to three significant digits.** The bucket work is 0.0003 ms — three hundred times below the guard. Option A
banked a 3.6× improvement out of a 1,300× one available. §4 argues that this was still the right trade, but the
report's own framing never let it see the price it paid.

---

## 4. The Design Call — Option A, Locked

| # | Strategy | Injector cooperation | Verdict |
|---|---|---|---|
| **A** | **Size-guarded rebuild** — cache `Object.keys(QUEST_DB).length`; rebuild when it differs. Θ(n) per call, but no per-quest predicate. | **None** | ✅ **CHOSEN** |
| B | Mutation-versioned cache — injectors bump a counter. | Every injector must cooperate | ✗ invasive; forces adapting a shipped test |
| C | Documented frozen-DB contract — injectors call a reset fn. | Every injector must cooperate | ✗ same, plus it is a convention, not a mechanism |

**Rationale, as locked:**

- **Zero injector cooperation.** The shipped harness test passes **unmodified**. This is the §VM-01-A lesson the
  project keeps re-learning from the wrong end — *adapting the test to the engine change* is how you launder a
  regression into a green suite — and Option A sidesteps it entirely. Runtime injection stops being a test-only
  affordance and becomes a **supported contract**.
- **No cache to invalidate.** There is no version to bump and no reset to remember; correctness is a pure function
  of the live count. This is the property the F spec actually wanted, and B and C do not have it.
- **A net win even with a Θ(n) guard.** True, and the report said so — but it undersold and mis-sized itself in the
  same paragraph. **Undersold:** it called `Object.keys` and `Object.values` *"the same array allocation"*; measured,
  `Object.keys` is roughly **half** the cost (0.111 vs 0.291 ms), because it allocates key references rather than
  value references. **Mis-sized:** it then claimed the common path does *"only an O(1) `Map.get`"*, which is exactly
  the thing the guard makes untrue. See §9 C1.

**The accepted limitation, restated honestly.** A *simultaneous* add-one-and-remove-one that leaves the count
unchanged leaves a stale index. The report calls this impossible in practice — *"never happens with a const DB, and
no test performs it."* Both halves are true. **But the second named injector is the one that can produce it**: one
worldbuilder session that retires a quest and adds another emits `delete QUEST_DB['a'];` and `QUEST_DB['b'] = {…};`
in a single `applyPatch` call, and the count never moves. The limitation is real, not hypothetical; it is simply
outside the shipped game. Filed as **§DX-02eb**.

---

## 5. The Change as Shipped

**New helper**, placed immediately after `function _questNodes()` — same file region, same idiom.
**This block shipped byte-identical to the design lock, and is byte-identical at HEAD:**

```js
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

**Rewire** — the activation loop only. The completion loop below it already iterates the small `S_story.quests`
set, not `QUEST_DB`, and was untouched:

```js
  _questsByNode(node.code).forEach(q => {
    if (!S_story.quests[q.id]) {
      if (q.activateCond && !q.activateCond()) return;
      if (q.schema === 'UQF-1.0' && !QuestRuntime.canActivate(q.id)) return;   // §ARCH-01 Phase 2 — declarative gate
      S_story.quests[q.id] = 'active';
      msgs.push('📋 ' + q.title);
    }
  });
```

**Diff as shipped:** `roll2hit-v3.html` **+33 / −4** — net **+29**, which is exactly the file's line delta
(37,783 → 37,812) — plus 95 new test lines. Four files touched, two HTML hunks. No kernel, no parity fence, no
`js/quest.js` mirror.

## 6. Behavioural Equivalence

The old guard was `q.type !== 'epic' && !S_story.quests[q.id] && q.activateNode === node.code`, then two
conditional gates. The index pre-applies `type !== 'epic'` and buckets by `activateNode`, so
`_questsByNode(node.code)` returns exactly `{q : q.type !== 'epic' && q.activateNode === node.code}` in
`Object.values` order — insertion order, because the builder pushes in that order. The remaining
`!S_story.quests[q.id]` + `activateCond` + `canActivate` checks are unchanged and evaluated in identical order.
**The set of quests activated and the order of the `📋` messages are identical.** No-op on every real code path.

## 7. Tests

`tests/integration/uqf-activatenode-index.test.js`, 4 cases — the plan and the shipped file agree item for item:

1. **Correctness** — `_questsByNode(code)` equals a brute-force `Object.values(QUEST_DB).filter(…)` over the live
   corpus, for the **6 busiest** `activateNode`s (each asserted to hold >1 quest, so the comparison is non-trivial).
2. **Staleness fixed** — inject a quest at `DK` after first render; assert the index finds it, that
   `storyCheckQuests` actually activates it end-to-end, and that deleting it drops it again.
3. **Order parity** — two quests injected at one fresh node emit `['📋 Alpha', '📋 Beta']` in insertion order.
4. **Exclusions** — an `type:'epic'` quest and an `activateNode`-less quest never appear in any bucket.

Plus the load-bearing one, which is not in this file at all: **the harness injection test passes unmodified.**
That is the definitive proof the invalidation works, and it is proof precisely *because* nobody touched it.

---

## 8. Verification — As Shipped, Re-Measured on the Rebuilt Tree

Ship-day tree reconstructed from `549d6b4` with the repo's own `node_modules`; each gate run as it ran that day.

| Check | Reported | Re-measured on the rebuilt tree | |
|---|---|---|---|
| `uqf-activatenode-index.test.js` | 4/4 green | 4/4 (also **4/4 at HEAD**) | ✅ |
| Harness injection regression | passes unmodified | passes; unmodified in the ship diff; **passes at HEAD** | ✅ |
| `check:questparity` | byte-identical | QUEST:CORE **21,909 identical, parent ≡ ship** — "no kernel edit" directly verified | ✅ (unit: C8) |
| `check:duelparity` | green | DUEL:CORE 7,987 identical | ✅ |
| `check:roomsparity` | green | ROOMS:CORE 10,836 identical | ✅ |
| `check:parity` (mover) | green | MOVER:CORE 1,847 identical | ✅ |
| `check:gateast` | green | 72 assertions, 25 leaf terms | ✅ |
| `check:rng` | green | 6,000 duel draws, one seeded stream | ✅ |
| `check:questgraph` | green | 0 residual nondeterminism, 0 prober gaps | ✅ |
| `check:invariants` | red — J14/J15 baseline | **reproduced exactly**: I1 + I2, `J14→junction`, `J15→junction` | ✅ (see C6) |
| `check:roads` | red — R2/R3 baseline | **reproduced exactly**: R3 cell 10,207 sea; R2 settlements 7,217 / 8,217 / 9,217 | ✅ (see C6) |
| `quest-runtime-uqf` | 0 NEW, 18 ≡ 18 | arithmetic sound; the *baseline* died the same afternoon (C7). **303/303 green at HEAD** | ⚠️ |

## 9. Verification of This Report (§DOC-02cr, 2026-08-22)

Anchors were measured on the **parent** build `a6b648a` (37,783 lines) and pinned with `git show`. The report has
not been edited since it shipped.

**Confirmed exactly (12).** **All 6 line-number anchors resolve on the pinned parent build** — `storyCheckQuests`
29624 · the scan 29627 · the completion loop 29645 · `_questNodes` 36094 · `_gateFlagSet` 25714 · the harness test
257 — an offset-zero, 6-of-6 block · the §5 code block is **byte-identical** to the shipped helper at ship *and*
at HEAD · the §2 scan excerpt is the shipped 9 lines, dedented, with one trailing comment elided · the
`_gateFlagSet` comment is quoted verbatim · *"the idiom already exists twice in the file"* — **exactly two** such
lazy caches on the parent build · `QUEST_DB` is a real `const` (reassignment throws) while its object is mutable ·
`storyRender` does call `storyCheckQuests` (1,490-line function; the call is inside it) · the scope fence held
perfectly — 4 files, 2 HTML hunks, +33/−4, and net +29 matches the file's own line delta · the shipped test file
matches the §7 plan item for item · `js/quest.js` untouched.

**Corrections (9).**

| # | § | The report says | Measured | Verdict |
|---|---|---|---|---|
| C1 | 1, 3 | The scan becomes *"an O(1) `Map.get`"*; the common path does *"only an O(1) `Map.get`"* | The shipped call is still **Θ(n)**: the size guard measures **0.111 ms** and the whole call measures **0.110 ms**. Measured speedup **3.6×**, not asymptotic; a guard-free index would be **1,300×** | **Decision right, cost model falsified** |
| C2 | 1, 4, 5 | *"all ~2,850 quests"*, repeated 6× | **2,853** exactly, ship-day and HEAD. The index holds **2,803** — 40 epics and 10 `activateNode`-less entries are excluded | Rounding, but the indexed figure is 50 lower |
| C3 | 1 | *"the node in hand offers a handful, not thousands"* | Median **3**, mean **8.05** — right, and now quantified. But **WM holds 312**, 11% of the corpus in one bucket, where the cut is 9× | **True at the median, unstated at the max** |
| C4 | 2 | *"The worldbuilder editor — injects/edits quests live into the running page"* | It is a **separate page**. It parses the game's source, records a diff, and emits an `applyPatch(NODE_MAP, QUEST_DB, …)` **text blob** a human pastes or re-inlines. It never writes into a running game itself | Mechanism wrong; the add/delete shape is right |
| C5 | 4 | The count-preserving swap *"never occurs"* | The injector in C4 is exactly the one that **can** emit it — one session that deletes one quest and adds another produces a count-preserving patch. Outside the shipped game, but not impossible | **Understated** → §DX-02eb |
| C6 | 6 | *"`npm run check:walk` — all four parity fences green"* | `check:walk` ran **10** gates that day and **three** parity fences; `check:duelparity` existed but was not in the walk. All four *are* green on the rebuilt tree | **Fact right, attribution wrong** |
| C7 | 6 | *"only the two documented **pre-existing** baselines red"* | Both reproduced exactly — and both were **retired six days later** by `fa8f9e4` (§DX-01a, 2026-07-28). `check:walk` is 16 gates and fully green at HEAD | Red confirmed; **"pre-existing" had a 6-day shelf life** |
| C8 | 6 | *"0 NEW by git-stash-diff"* against an 18-fail baseline | Arithmetic sound. The baseline died **3 h 17 min later the same afternoon** — `bd951d7`: *"17 stale tests, not server clobber"*, 17 → 1. It had already moved twice that day: §VM-01-F recorded **17** at 13:34, this increment **18** at 15:41, then **1** at 18:58 | **Verdict stands; the baseline was three values in five hours** |
| C9 | 5 | QUEST:CORE *"21,909 bytes"* | 21,909 **UTF-16 code units** = **22,135 UTF-8 bytes**; the gate prints `a.length` and calls it bytes. The substance — parent ≡ ship, identical — is directly verified | Figure right, **unit mislabelled by the tool** (§DX-02dz) |

**Not verifiable (1).** §2's *"the only new red it created"*, describing the reverted §VM-01-F attempt: that attempt
was never committed, so no diff can be measured. §VM-01-F's own commit message corroborates the failure **shape**
(*"a built-once cache goes stale for a quest injected after first render"*) but not the count. Kept as recorded.

**Drift since ship (not errors).** `storyCheckQuests` 29624 → **30166** · `_questsByNode` 36103 → **37015** · file
37,812 → **38,712** lines · QUEST:CORE 21,909 → **25,030** chars · lazy caches in the file 2 → **4** · direct
callers of `storyCheckQuests` 5 → **4** · index population 2,803 → **2,804**, buckets unchanged at **348**.

**The one structural change.** §VM-01-G3 **extracted the activation loop** out of `storyCheckQuests` into
`function _uqfActivateAtNode(node)@30137`, carrying this increment's comment with it verbatim, and now calls it
**twice per arrival** — from `function storyRender(node, prefix)@34567` before the render body, and again from
`function storyCheckQuests(node)@30166`. The pass is idempotent, so this is correct; but it means **the size guard
now runs twice per arrival**, ~0.22 ms of Θ(n) work to look up a median of 3 quests. Filed as **§DX-02ea**.

---

## 10. Follow-On Rows Filed by This Verification

- **§DX-02ea** 🟢 — the size guard is now the whole per-render cost of `_questsByNode` (0.111 ms of a 0.110 ms
  call), and §VM-01-G3 doubled how often it runs. Hoisting revalidation to once per `storyRender` keeps Option A's
  zero-cooperation contract and recovers most of the 1,300× the guard currently forfeits.
- **§DX-02eb** 🟡 — the count-preserving swap this report calls impossible is exactly what one worldbuilder
  `applyPatch` with a paired delete and add produces. Authoring-surface only; the shipped game is unaffected.

**Cited, deliberately not re-filed** (instrument 7): **§DX-02cl** — `_questNodes()` still has no invalidation, and
the row filed against it names *this* helper as the reference implementation to copy. §NAV-01 asked for that guard
on 2026-07-03; it has now been open for over a month with the answer sitting thirteen lines below it in the same
file. · **§DX-02dz** (C9, the parity gate's "bytes") · **§DX-02bd** — note the **name collision**:
`js/wbapi-core.js:_questsByNode: {}@707` is a *different object* in a *different program* (an authoring-time map of
node code → quest **ids**, built across several node fields), and the defect filed against that name is not about
this helper.

## 11. Anchors (HEAD, 2026-08-22)

`const QUEST_DB = {@10615` · `function _gateFlagSet()@26133` · `function _uqfActivateAtNode(node)@30137` ·
`function storyCheckQuests(node)@30166` · `function storyRender(node, prefix)@34567` ·
`function _questNodes()@36995` · `let _questsByNodeIndex = null@37014` · `function _questsByNode(nodeCode)@37015` ·
`function _boardBounties(node, limit)@37183` · `js/wbapi-core.js:_questsByNode: {}@707` ·
`scripts/check-quest-parity.js:quest parity: QUEST:CORE identical@25` ·
`worldbuilder.html:function applyPatch(NODE_MAP, QUEST_DB@2473`.

*Ship-day anchors, superseded but recorded — all six verified to resolve on the pinned parent build `a6b648a`:
`storyCheckQuests` 29624 · activation scan 29627 · completion loop 29645 · `_questNodes` 36094 · `_gateFlagSet`
25714 · harness injection test 257. On the ship build itself `_questNodes` sits at 36096 and `_questsByNode` at
36103 — the report's numbers are parent-build numbers, stale in the child by the change's own net insertion.*
