<!-- §VM-01-F child lab report — locked BEFORE the HTML edit (CONTRIBUTING.md Lab Report Policy). -->
<!-- Parent structural read: lab-report-javascript-mud.md. Prior increments: -vm01a-execbits-coroutine.md, -vm01b-client-rng-seed.md, -vm01c-env-state-passing.md, -vm01d-quest-core-parity.md. -->

# Lab Report — §VM-01-F · *Teach the gate to say `or`*: expression AST + compile-once

**Track:** §VM-01 — The Quest VM → *No Word for Wait* · **Increment:** F (independent of A–E; A/B/C/D shipped)
**Status:** design LOCKED → SHIPPED (see §11)
**Date:** 2026-07-22
**Backlog classification:** 🟡 **LOOP** — the design is pre-decided (the scope is written in BACKLOG §VM-01-F and CONTRIBUTING's Host/Script Separation Policy names this increment by name). No blocking ASK; the §6 calls are locked + veto-flagged per the increment convention.

---

## 1. Abstract

`canComplete`'s own comment is candid (kernel, ~`21850`): `flags` are AND, while `flagsAny` + `battles` + `questsComplete` + `items` + `itemsMinAny` form **a single OR-group** — a shape that models *"AND(pages) ∧ (flag OR battle)"* **and only that shape**, *"without a boolean-expression language."* When a real quest needed an OR that the fixed group could not express in OR position, the language grew a **term**: `itemsMinAny` was added for exactly one quest (`quest_wm_01` — *"the archive letter OR ≥3 Scholar Kings' Seals"*). CONTRIBUTING already records the diagnosis: *"A term added per quest is the language asking for an expression evaluator (§VM-01-F)."*

This increment adds that evaluator — **as data, not a parser.** A gate node may be a boolean combinator — `{all:[…]}` / `{any:[…]}` / `{not:…}` — over child nodes, whose leaves are the existing ~14/~11 gate terms evaluated exactly as today. It is **backward compatible by construction**: a bare gate object (no `all`/`any`/`not` key) is an implicit `all` over its own terms, so all 2,803 existing UQF gates evaluate **byte-identically**. Each gate compiles to a closure **once** (memoised, never invalidated — the gate structure is immutable), so the boolean tree is walked at load, not per render. Then `itemsMinAny` — the single-use term the policy calls out — is **deleted**, and `quest_wm_01` is re-expressed in the grammar (`{any:[{flagsAny:…},{itemsAll:[{name,min:3}]}]}`), with `itemsAll`'s existing exact-name/min matcher now reachable in OR position via `{any}`.

As a byproduct the file gains a lazy `activateNode → [quests]` index (host side, same idiom as `_questNodeSet`/`_gateFlagCache`), retiring lab-report finding #9 — `storyCheckQuests` linearly scans all ~2,850 quests on every render — **without a cache to invalidate.**

## 2. Method

The AST is a **three-combinator tree over the existing leaf evaluators**. The kernel already contains the two leaf evaluators — the bodies of `canActivate` (the ~15 activation terms) and `canComplete` (the ~11 completion terms, including the OR-group). This increment (a) extracts each body verbatim into a pure `_matchActivationLeaf(g, st)` / `_matchCompletionLeaf(g, st)`; (b) adds a tiny `_compileGate(node, mode)` that recognises `all`/`any`/`not` and recurses, bottoming out at the appropriate leaf matcher; (c) has `canActivate`/`canComplete` compile-once-and-call. A bare gate object hits neither combinator branch, so it *is* a single leaf — dispatched straight to the unchanged matcher. That is why the 2,803 existing gates are a provable no-op: for a bare gate, `_compileGate` produces `st => _matchActivationLeaf(g, st)`, i.e. **the current function**.

The proof obligation is therefore two-part: (1) **differential** — for every real gate × a sampled state matrix, the compiled predicate agrees with a faithful reference copy of the pre-F interpreter (`scripts/check-gate-parity.js`); (2) **regression** — `quest-runtime-uqf` stays the §VM-01 env baseline exactly (0 NEW), since bare-gate behaviour is unchanged and the one re-authored gate (`quest_wm_01`) is behaviourally equivalent.

## 3. Concepts added (three combinators, zero new leaf terms — one deleted)

| Thing | Where | What |
|---|---|---|
| `{all:[…]}` | kernel `_compileGate` | every child node must pass (∧) |
| `{any:[…]}` | kernel `_compileGate` | at least one child node must pass (∨) |
| `{not:…}` | kernel `_compileGate` | the child node must fail (¬) |
| `_matchActivationLeaf` / `_matchCompletionLeaf` | kernel | the pre-F term logic, extracted verbatim (the AST leaves) |
| `_gateCache` (WeakMap) | kernel, block scope | compiled-predicate memo, keyed by the gate/completion object (immutable key → never invalidated) |
| `_activateIndex` (Map) | host, lazy (idiom of `_questNodeSet`) | `nodeCode → quest[]`; retires finding #9's per-render scan |

**Deleted:** the `itemsMinAny` completion term (single-use; superseded by `itemsAll` under `{any}`). **No new leaf term** — the whole point of the increment is that new OR shapes now go in the grammar, not the vocabulary.

## 4. The transformation

### 4.1 The evaluator — a three-line combinator over the leaves

```js
// §VM-01-F — a gate node is a boolean combinator over leaves. A bare object
// (no all/any/not) is a single leaf → the pre-F term logic, byte-identical.
function _compileGate(node, mode) {
  if (node && node.all) { const k = node.all.map(n => _compileGate(n, mode)); return st => k.every(f => f(st)); }
  if (node && node.any) { const k = node.any.map(n => _compileGate(n, mode)); return st => k.some(f => f(st)); }
  if (node && node.not) { const c = _compileGate(node.not, mode);            return st => !c(st); }
  return mode === 'complete' ? (st => _matchCompletionLeaf(node, st)) : (st => _matchActivationLeaf(node, st));
}
```

### 4.2 The leaves — the current bodies, extracted verbatim

`_matchActivationLeaf(g, st)` is the current `canActivate` body from the first term check (`g.flags`) through the final `return true` — **unchanged**, only relocated. `_matchCompletionLeaf(g, st)` is the current `canComplete` body from `g.flags` through the final `return true` — **unchanged except the `itemsMinAny` OR-entry is removed** (§4.4). The gate-level early-outs (`if (!g || g._legacyFn) return true` for activation; `if (!q.completion) return false` for completion) stay in the methods, above the compile call — they are quest-level concerns, not leaf terms.

### 4.3 Compile-once — memoise the closure, don't interpret per render

```js
canActivate(questId) {
  const q = E.getQuest ? E.getQuest(questId) : null;
  if (!q) return false;
  const g = q.gate;
  if (!g || g._legacyFn) return true;                 // legacy quests keep their own activateCond
  let f = _gateCache.get(g); if (!f) { f = _compileGate(g, 'activate'); _gateCache.set(g, f); }
  return f(S());                                       // §VM-01-C seam intact: state resolved at CALL time
}
```
`canComplete` is the mirror (`_gateCache.get(q.completion)`, `mode:'complete'`, `if (!q || !q.completion) return false` first). The WeakMap is keyed by the **gate object** (`q.gate` / `q.completion`), which is immutable authored data — so the cache is correct forever and needs no invalidation. `S()` is still called per evaluation, so §VM-01-C's per-call `{state:scratch}` seam and §VM-01-D's `getState()`-at-call-time both survive untouched (the compiled closure takes `st` as a parameter; it closes over **nothing** runtime-specific, so one predicate is safe to share across the live runtime and a headless scratch runtime).

### 4.4 Delete `itemsMinAny`; re-express `quest_wm_01` in the grammar

The OR-group `.concat((g.itemsMinAny || …))` line and the `+ (g.itemsMinAny||[]).length` in `orCount` are deleted from `_matchCompletionLeaf`. `quest_wm_01.completion` migrates:

```js
// before: completion:{ flagsAny:['archiveLetterObtained'], itemsMinAny:[{ name:"Scholar Kings' Seal", min:3 }] }
// after:
completion:{ any:[ { flagsAny:['archiveLetterObtained'] },
                   { itemsAll:[{ name:"Scholar Kings' Seal", min:3 }] } ] },
```
`itemsAll` already matches exact-name/≥min in AND position (kernel, ~`21876`); `{any}` lifts it into OR position. The two forms are provably equivalent: old = `flag OR (≥3 seals)`; new = `{any:[ (flag), (≥3 seals) ]}` = `flag OR (≥3 seals)`. The differential (§9) asserts this over the state matrix. **Waypoint safety:** the host waypoint reader (`28281`) does `q.completion.atNode` — now `undefined` for this AST completion — and falls back to `q.waypointNode`, which `quest_wm_01` carries (`'NUE'`); no regression.

### 4.5 The byproduct — the `activateNode` index — **DEFERRED (finding, see §6.4)**

The lazy `activateNode → [quests]` index that retires finding #9 was built and then **reverted** this increment. The `quest-runtime-uqf` regression surfaced a real staleness: the index is first built during initial page render (`storyEnter → storyRender → storyCheckQuests`), and a test that **injects a synthetic quest into `QUEST_DB` at runtime** (`quest-runtime-uqf.test.js:257` — "storyCheckQuests honors a UQF declarative gate on activation") then finds the cache already frozen without it. In the shipped game `QUEST_DB` is an immutable `const`, so the index would be correct there — but the harness (and any future runtime-injection consumer: the worldbuilder editor, a §MESH-delivered quest) mutates it, so a built-once index is **not** transparent. That is precisely the "cache to invalidate" the spec set out to avoid; doing it correctly (size-guarded rebuild, or a version counter) is its own small increment. So finding #9 is deferred to a §VM-01-F follow-on, and F ships as a **pure kernel-grammar** change with **zero** host-render-path edits — a cleaner, provably-no-op increment. See §6.4.

## 5. Why this answers the lab report's own open question

The parent structural read (`lab-report-javascript-mud.md`) lists two blockers this increment clears:

- **The `or` word.** *"No boolean nesting → each new OR shape has historically meant a new term; `itemsMinAny` was added for exactly one quest."* The AST is the boolean nesting; deleting `itemsMinAny` and re-authoring `quest_wm_01` is the demonstration that the vocabulary can now shrink instead of grow. Prior art the report cites for exactly this: **CEL / JSONLogic — expression-AST-as-data, no parser.**
- **Finding #9.** *"`storyCheckQuests` linearly scans all 2,850 quests on every render; `storyRender` runs on every arrival, resolution, battle outcome."* The report objected to naive indexing because a cache can go stale; the compile-once framing answers it — the index keys on **immutable** authored data, so there is no cache to invalidate.

It also sets up **§VM-01-G**: G's argument is *"when the data language lacks a shape, the file grows imperative code instead of vocabulary."* F is that thesis applied one layer up (the gate language), and a gate grammar that can say `any`/`not` lets a fraction of G's per-node special cases become data.

## 6. Design decisions — LOCKED (veto-flagged)

### 6.1 One combinator layer, two leaf matchers — **the AST wraps both gate types.** (flagged for veto)
Activation (`q.gate`) and completion (`q.completion`) have different leaf vocabularies but the same boolean algebra. `_compileGate(node, mode)` shares the `all`/`any`/`not` layer and dispatches leaves by `mode`. **Rejected axis:** an AST for activation only — leaves `quest_wm_01` (a *completion* OR) unmigratable, i.e. fails the increment's one concrete deliverable.

### 6.2 Bare gate = implicit `all` — **byte-identical, no migration.** (flagged for veto)
A gate with no `all`/`any`/`not` key is a single leaf, dispatched to the unchanged matcher. All 2,803 existing gates are untouched authored data and evaluate exactly as before. **Rejected axis:** requiring every gate to be wrapped in `{all:[…]}` — a 2,803-quest data migration with no behavioural gain and a large no-op-proof surface.

### 6.3 Compile-once via a block-scoped WeakMap — **not an eager load pass.** (flagged for veto)
The compiled closure is memoised lazily, keyed by the immutable gate object. This keeps the gate compiler **inside the parity-fenced kernel** (it is gate-evaluator logic, not host logic) and matches the file's own lazy-built-once idiom (`_questNodeSet` `36063`, `_gateFlagCache` `25679`). An eager "walk `QUEST_DB` at load and compile everything" pass would have to live in the host and either call into the kernel or duplicate compile logic — worse on both counts. Runtime effect is identical: each gate's tree is walked once, then a closure is called per render. **Rejected axis:** interpret-per-render (violates the spec's "don't interpret per render"); eager host pass (moves kernel logic into the host).

### 6.4 The `activateNode` index (finding #9) — **DEFERRED to a §VM-01-F follow-on.** (decided during implementation)
Originally locked as in-scope (host-side, lazy). Implementation + the `quest-runtime-uqf` regression showed a built-once index is **not** transparent under runtime `QUEST_DB` mutation (§4.5): it goes stale for a quest injected after the initial render, breaking `quest-runtime-uqf.test.js:257` — the only NEW regression the whole increment produced. Rather than reintroduce the "cache to invalidate" the spec explicitly wanted to avoid (a size-guard rebuild costs an `Object.keys().length` per render; a version counter needs a mutation hook `QUEST_DB` does not have), the index is **removed from F** and deferred to its own follow-on, where the invalidation strategy is the whole design question. F keeps its clean-no-op story: **no host-render-path edit**, gate logic only. **Rejected axis:** ship the index with a size-guard now — muddies F's provable no-op with a partial-invalidation heuristic that belongs in its own increment.

### 6.5 Delete `itemsMinAny`; `itemsAll` under `{any}` replaces it. (flagged for veto)
`itemsMinAny` existed only to reach exact-name/≥min matching **in OR position**; `{any:[…]}` now provides OR position, and `itemsAll` already does exact-name/≥min in AND position. One term does the work; the single-use term is deleted. **Rejected axis:** keep `itemsMinAny` for back-compat — it has exactly one user, migrated in the same commit, so there is nothing to keep compatible with.

## 7. Exact anchors (live file, this session — re-grep before editing; they drift each increment)

| Symbol | `js/quest.js` | `roll2hit-v3.html` |
|---|---|---|
| `QUEST:CORE:START` / `END` | `31` / `323` | `21706` / `21998` |
| `canActivate` | `122` | ~`21786`-relative |
| `canComplete` | `177` | ~`21850` |
| `itemsMinAny` OR-entry / orCount | `198` / `199` | `21873` / `21874` |
| `itemsAll` matcher | `221` | ~`21876` |
| `*execBits` | `235` | — |
| `storyCheckQuests` (scan) | — | `29590` / `29593` |
| `_questNodes` (index idiom) | — | `36063` |
| `_gateFlagSet` (activation-gate flag walker) | — | `25680` |
| `q.completion.atNode` waypoint reader | — | `28281` |
| `quest_wm_01` def | — | `10942` / completion `10945` |

## 8. Invariants preserved (all load-bearing — [CONTRIBUTING.md](../CONTRIBUTING.md))

- **Host/Script Separation** — *advanced*: a new OR shape now goes in the grammar (`{any}`), never a new single-use term. The increment *deletes* vocabulary. The gate compiler stays inside the parity-fenced kernel; the index stays host-side.
- **Parity fence** — the kernel edits are inside QUEST:CORE; `js/quest.js` is edited, then re-inlined byte-for-byte and asserted by `check:questparity`. `MOVER`/`ROOMS`/`DUEL:CORE` untouched (0 sentinels).
- **§VM-01-A coroutine** — `execBits` untouched (gates are evaluated, not executed; no handler changes).
- **§VM-01-B seeded rng** — untouched (no roll site changes).
- **§VM-01-C `_ENV` / §VM-01-D `getState()`** — preserved: the compiled predicate takes `st` as a parameter and `canActivate`/`canComplete` still call `S()` at evaluation time, so the scratch-state seam and call-time state resolution both hold.
- **Free-Movement / Mission-Gating** — untouched (no movement code; gate *logic* is relocated, not changed).
- **Known latent (documented, not triggered):** `_gateFlagSet` (`25680`) structurally walks `q.gate.flags/flagsAny/notFlags` and would not see flags nested under a future `{all/any/not}` *activation* gate. F introduces **no** AST activation gate (only a completion one), so it is not triggered; when activation gates adopt the AST, that walker should recurse the tree (tracked as a §VM-01-F follow-on).

## 9. Test plan (as shipped)

**New `scripts/check-gate-parity.js`** (headless, `require('../js/quest.js')`; wired into `npm run check:walk` as `check:gateast`). `QUEST_DB` is not node-requireable without the worldbuilder object pipeline (and stripping the `_legacy_fn` closures), so the node check proves the **kernel logic** against an **independent reference interpreter** (re-implemented from the term semantics, not copied from the kernel), over: (1) a hand-written **AST-algebra truth table** — `all`/`any`/`not`/nested/De Morgan/vacuous — asserting `kernel === expected === reference`; (2) **every leaf term**, activation + completion, with a passing + a failing state; (3) the **`quest_wm_01` migration** — OLD `{flagsAny, itemsMinAny}` under an OLD reference (deleted term restored) === NEW `{any:[flagsAny, itemsAll]}` under the kernel, over an inventory/flag matrix. **72 assertions.**

**New `tests/integration/uqf-gate-ast.test.js`** (Playwright, real live `QUEST_DB` global):
1. **Full-corpus differential** — for **every** live gate/completion × a state matrix (empty + a best-effort satisfier), assert the compiled kernel (`createQuestRuntime` over a scratch state) agrees with an **independent in-page reference interpreter**. ~2,800 gate evals + ~250 completion evals, 0 divergences.
2. **`quest_wm_01` live** — completes on `archiveLetterObtained` OR ≥3 exact-name seals (not on 0/2 seals); and a recursive scan proves **no live gate/completion still carries `itemsMinAny`**.

**Adapted regression callers** (the §VM-01-A lesson: an engine change breaks test files' direct callers). `quest-runtime-uqf.test.js` had two tests asserting the deleted `itemsMinAny` shape — rewritten to the grammar (`{any}` + `itemsAll`), same truth table, so they pass on the new engine.

**Regression:** full `quest-runtime-uqf` (2,850 quests) via the disciplined **git-stash-diff** — the with-change failing SET is byte-for-byte the stashed-HEAD baseline (**0 NEW**), never an absolute count. `uqf-coroutine` / `uqf-env` / `uqf-quest-core` / `rng-seed` / `warrants-board` / `uqf-gate-ast` green (49 in one run). `check:walk`: all four parity fences green (`MOVER`/`ROOMS`/`DUEL`/`QUEST`, 0 sentinels changed), `check:rng` green, new `check:gateast` green; only the two pre-existing baselines (`check:invariants` I1/I2 = J14/J15, `check:roads` R2/R3) red.

## 10. Scope fence — what Inc F does NOT do

- **No new leaf gate term** — the increment *removes* one (`itemsMinAny`). New shapes are grammar, not vocabulary.
- **No `execBits` / handler / opcode change** — gates are evaluated, not executed.
- **No eager compile-at-load pass** — compilation is lazy/memoised (§6.3); no new startup hook.
- **No AST *activation* gate authored** — only `quest_wm_01`'s *completion* migrates; the `_gateFlagSet` follow-on is documented, not needed (§8).
- **No host-render-path change at all** — the `activateNode` index (finding #9) was reverted (§4.5/§6.4); `storyCheckQuests` is byte-identical to HEAD. F is gate *logic* only.
- **No `storyRender` change** — that 4,360-line Layer-4 migration front is §VM-01-G.
- **No `_legacy_fn` change** — that is §VM-01-E's blocker.
- **No new `S_story` field, no save-migration, no seeded-rng change, no kernel-fence change.**

## 11. Verdict — **SHIPPED** (2026-07-22)

The gate is a compiled boolean tree. `_compileGate` recognises `{all}`/`{any}`/`{not}` and recurses; a bare gate bottoms out at `_matchActivationLeaf` / `_matchCompletionLeaf` — the pre-F term bodies, extracted **verbatim** — so all 2,803 existing gates are byte-identical. `_gatePred` memoises the compiled closure in a block-scoped WeakMap keyed by the immutable gate object; `canActivate`/`canComplete` are two lines each (`_gatePred(g, mode)(S())`), preserving §VM-01-C/D's call-time state resolution. The single-use `itemsMinAny` term is **deleted**, and `quest_wm_01`'s completion is re-expressed in the grammar — `{any:[{flagsAny:['archiveLetterObtained']}, {itemsAll:[{name:"Scholar Kings' Seal", min:3}]}]}` — with `itemsAll`'s exact-name/≥min matcher lifted into OR position by `{any}`. The kernel edits are inside QUEST:CORE; `js/quest.js` is edited and re-inlined **byte-identically** (`check:questparity` — 21,909 bytes).

**The one finding:** the `activateNode` index (finding #9) proved **not transparent** under runtime `QUEST_DB` injection (`quest-runtime-uqf.test.js:257`, the only NEW regression the increment produced) — a built-once cache is stale for a quest added after the first render. Rather than reintroduce the "cache to invalidate," the index was **reverted** and deferred to a §VM-01-F follow-on (§4.5/§6.4). F ships as a pure kernel-grammar change with **no host-render-path edit**.

**Tests:**
- **New `scripts/check-gate-parity.js` — 72 assertions green** (headless): AST algebra truth table · every leaf term (activation + completion, pass + fail) · `quest_wm_01` OLD-itemsMinAny ≡ NEW-`{any}`-`itemsAll` over an inventory/flag matrix — all agreeing with an independent reference interpreter. Wired into `check:walk` as `check:gateast`.
- **New `tests/integration/uqf-gate-ast.test.js` — 2/2**: the full-corpus differential (compiled kernel === in-page reference interpreter over every live gate/completion × a state matrix — **~3,000 evals, 0 divergences**) and the live `quest_wm_01` migration (letter OR 3 seals; no live gate carries `itemsMinAny`).
- **Adapted** the two `quest-runtime-uqf.test.js` tests that asserted the deleted `itemsMinAny` shape → rewritten to the grammar, same truth table.
- **Regression `quest-runtime-uqf` — 0 NEW failures** by disciplined git-stash-diff: the with-change failing SET (17) is byte-for-byte the stashed-HEAD baseline (17); the delta was only the two adapted tests (now passing) and the reverted-index test (now passing). Never an absolute count.
- **`uqf-coroutine` 5/5 · `uqf-env` 5/5 · `uqf-quest-core` 7/7 · `rng-seed` 5/5 · `warrants-board` 25/25 · `uqf-gate-ast` 2/2** (49 in one run).

**Invariants:** all four parity fences green — `MOVER`/`ROOMS`/`DUEL`/`QUEST` with **0 sentinels changed** (the QUEST block changed but stays byte-identical across `js/quest.js` and the HTML); `check:rng` green (`_seededNext` untouched); `node --check js/quest.js` clean; inline script parses (the suite loads the page). The only `check:walk` reds are the two pre-existing baselines (`check:invariants` I1/I2 = J14/J15, `check:roads` R2/R3), untouched by a gate-grammar change.

**Outcome:** the gate language can say `or`. A new OR shape goes in the grammar (`{any}`), never a new term — and the vocabulary *shrank* (`itemsMinAny` deleted), the exact inversion of the "term added per quest" pressure CONTRIBUTING's Host/Script Separation Policy names. §VM-01-G inherits a gate grammar expressive enough that a fraction of its per-node imperative special cases become data. Finding #9's index is a scoped follow-on. **Deferred (not committed) until the user says commit, per the standing rule; the F→E plan endorses committing F first.**
