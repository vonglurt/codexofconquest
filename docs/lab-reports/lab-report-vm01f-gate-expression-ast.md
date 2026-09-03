<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
<!-- §VM-01-F child lab report — design LOCKED before the HTML edit (CONTRIBUTING.md Lab Report Policy), committed with the ship. -->
<!-- Parent structural read: lab-report-javascript-mud.md. Prior increments: -vm01a-execbits-coroutine.md, -vm01b-client-rng-seed.md, -vm01c-env-state-passing.md, -vm01d-quest-core-parity.md. -->
<!-- VERIFIED 2026-08-22 (§DOC-02cs). The 2026-07-22 design text is preserved; every measured claim now carries a ledger row. Claims that did not ship are marked NOT SHIPPED and kept. -->

# Lab Report — §VM-01-F · *Teach the gate to say `or`*: expression AST + compile-once

**Track:** §VM-01 — The Quest VM → *No Word for Wait* · **Increment:** F (independent of A–E)
**Status:** SHIPPED `c6be7f8` · 2026-07-22 13:34 · pinned parent `4f56816b`
**Verified:** 2026-08-22 (§DOC-02cs) — 31 days after ship, against a rebuilt ship-day tree and against HEAD
**Backlog classification:** 🟡 LOOP — design pre-decided in BACKLOG §VM-01-F and CONTRIBUTING's Host/Script Separation Policy. No blocking ASK.

---

## 1. Abstract

`canComplete`'s own comment was candid about the ceiling: `flags` are AND, while `flagsAny` + `battles` + `questsComplete` + `items` + `itemsMinAny` form **a single OR-group** — a shape that models *"AND(pages) ∧ (flag OR battle)"* and only that shape, *"without a boolean-expression language."* When a quest needed an OR the fixed group could not express, the language grew a **term**: `itemsMinAny` was added for exactly one quest (`quest_wm_01` — *"the archive letter OR ≥3 Scholar Kings' Seals"*). CONTRIBUTING had already written the diagnosis: *"A term added per quest is the language asking for an expression evaluator (§VM-01-F)."*

This increment adds that evaluator **as data, not a parser**. A gate node may be a boolean combinator — `{all:[…]}` / `{any:[…]}` / `{not:…}` — over child nodes whose leaves are the existing gate terms, evaluated exactly as before. It is backward compatible **by construction**: a bare gate object (no `all`/`any`/`not` key) is an implicit `all` over its own terms, so every pre-existing gate compiles to the function it already was. Each gate compiles to a closure once, memoised in a `WeakMap` keyed by the immutable authored object, so the tree is walked at first evaluation and never again. Then `itemsMinAny` — the single-use term the policy called out — is **deleted**, and `quest_wm_01` is re-expressed in the grammar.

**What a month of hindsight adds.** The `or` word shipped, is fenced by two provers, and has had **exactly one user for 31 days**. The increment's durable product turned out not to be the combinator at all: it was the extraction of the term logic into a standalone pure `_matchActivationLeaf(g, st)`, plus a differential harness that proves any change to it. **Twenty-four hours later, §BOARD-01-VOID-GATE used precisely that surface** to add a `dayMin`/`dayMax` leaf, retire the last three `activateCond` closures in the game, and take `quest-runtime-uqf` from 302/1 to 303/0. The gate learned to say `or`; the first thing it actually said was *"after day 21."*

## 2. Method

The AST is a **three-combinator tree over the existing leaf evaluators**. The kernel already contained the two leaf evaluators — the bodies of `canActivate` (the activation terms) and `canComplete` (the completion terms, including the OR-group). This increment (a) extracts each body verbatim into a pure `_matchActivationLeaf(g, st)` / `_matchCompletionLeaf(g, st)`; (b) adds `_compileGate(node, mode)`, which recognises `all`/`any`/`not` and recurses, bottoming out at the mode's leaf matcher; (c) has `canActivate`/`canComplete` compile-once-and-call. A bare gate hits neither combinator branch, so it *is* a single leaf, dispatched straight to the unchanged matcher. That is why the existing corpus is a provable no-op: for a bare gate, `_compileGate` produces `st => _matchActivationLeaf(g, st)` — the current function, wearing a closure.

The proof obligation is two-part: **differential** — for every real gate × a state matrix, the compiled predicate agrees with an independently written reference interpreter; and **regression** — `quest-runtime-uqf` produces zero new failures, since bare-gate behaviour is unchanged and the one re-authored gate is behaviourally equivalent.

## 3. Concepts added — three combinators, zero new leaf terms, one deleted

| Thing | Where | What |
|---|---|---|
| `{all:[…]}` | kernel `_compileGate` | every child node must pass (∧) |
| `{any:[…]}` | kernel `_compileGate` | at least one child node must pass (∨) |
| `{not:…}` | kernel `_compileGate` | the child node must fail (¬) |
| `_matchActivationLeaf` / `_matchCompletionLeaf` | kernel | the pre-F term logic, extracted verbatim — the AST leaves |
| `_gateCache` (WeakMap) + `_gatePred` | kernel scope | compiled-predicate memo, keyed by the gate object (immutable key → never invalidated) |
| ~~`_activateIndex` (Map), host, lazy~~ | — | **NOT SHIPPED.** Built and reverted this increment (§4.5). The name never existed in code; the follow-on shipped it as `function _questsByNode(nodeCode)@36998`. |

**Deleted:** the `itemsMinAny` completion term — single-use, superseded by `itemsAll` under `{any}`. **No new leaf term**: the point of the increment is that new OR shapes go in the grammar, not the vocabulary.

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

**Verified byte-identical to `function _compileGate(node, mode)@22157` at the ship commit and at HEAD** — 31 days and one migration front later, not a character has moved.

### 4.2 The leaves — the current bodies, extracted verbatim

`_matchActivationLeaf(g, st)` is the pre-F `canActivate` body from the first term check through the final `return true`, unchanged and only relocated. `_matchCompletionLeaf(g, st)` is the pre-F `canComplete` body, unchanged **except** that the `itemsMinAny` OR-entry is removed (§4.4). The gate-level early-outs (`if (!g || g._legacyFn) return true`; `if (!q.completion) return false`) stay in the methods above the compile call — they are quest-level concerns, not leaf terms.

**Verified mechanically** (whitespace-normalised diff, parent `4f56816b` → ship `c6be7f8`): the activation leaf is **identical, zero deltas**. The completion leaf's only code deltas are the two lines the report names — the `.concat((g.itemsMinAny || […]))` OR entry and the `+ (g.itemsMinAny||[]).length` addend in `orCount` — plus five deleted comment lines describing the removed term and two added ones on `itemsAll`. **No unintended logic drift in either leaf.** This is the rare case where *"extracted verbatim"* means what it says.

### 4.3 Compile-once — memoise the closure, don't interpret per render

The design lock specified an inline `_gateCache.get(g)` in each method. **What shipped hoisted the memo into a named helper**, and the verdict (§11) records the shipped form:

```js
const _gateCache = new WeakMap();                 // kernel scope, shared by every runtime
function _gatePred(node, mode) {
  let f = _gateCache.get(node);
  if (!f) { f = _compileGate(node, mode); _gateCache.set(node, f); }
  return f;
}
// …and each method becomes one line of gate evaluation:
canActivate(questId) { … if (!g || g._legacyFn) return true;
  return _gatePred(g, 'activate')(S()); }         // §VM-01-C/D seam: state resolved at CALL time
```

The WeakMap is keyed by the **gate object itself** (`q.gate` / `q.completion`), which is immutable authored data — so the cache is correct forever and needs no invalidation. `S()` is still called per evaluation, so §VM-01-C's per-call `{state:scratch}` seam and §VM-01-D's call-time `getState()` both survive. The compiled closure takes `st` as a parameter and closes over **nothing** runtime-specific, which is what makes a single kernel-scope cache safe to share between the live runtime and a headless scratch runtime — and the full-corpus differential (§9) exercises exactly that sharing, 5,996 times.

### 4.4 Delete `itemsMinAny`; re-express `quest_wm_01` in the grammar

```js
// before: completion:{ flagsAny:['archiveLetterObtained'], itemsMinAny:[{ name:"Scholar Kings' Seal", min:3 }] }
// after:
completion:{ any:[ { flagsAny:['archiveLetterObtained'] }, { itemsAll:[{ name:"Scholar Kings' Seal", min:3 }] } ] },
```

`itemsAll` already matched exact-name/≥min in AND position; `{any}` lifts it into OR position. The two forms are provably equivalent — old = `flag OR (≥3 seals)`; new = `{any:[(flag), (≥3 seals)]}` = `flag OR (≥3 seals)` — and the differential asserts it over an inventory/flag matrix. **Waypoint safety:** the host waypoint reader does `q.completion.atNode`, now `undefined` for an AST completion, and falls back to `q.waypointNode`, which `quest_wm_01` carries (`'NUE'`); no regression.

Both lines verified byte-exact against `completion:{ any:[ { flagsAny:['archiveLetterObtained']@11071` (ship and HEAD) and against the parent build's pre-F line. The fallback path is `q.waypointNode || (q.completion && q.completion.atNode)@28804`, unchanged.

### 4.5 The byproduct — the `activateNode` index — **DEFERRED, and the deferral was honoured in 2 h 07 min**

The lazy `activateNode → [quests]` index that would retire the parent report's finding #9 was built and then **reverted** in this increment. The `quest-runtime-uqf` regression surfaced a real staleness: the index is first built during initial page render, and a test that **injects a synthetic quest into `QUEST_DB` at runtime** then finds the cache already frozen without it. In the shipped game `QUEST_DB` is an immutable `const`, so the index would be correct there — but the harness (and any future runtime-injection consumer) mutates it, so a built-once index is **not transparent**. That is precisely the *"cache to invalidate"* the spec set out to avoid; doing it correctly is its own small increment.

**Verified.** The regression is `quest-runtime-uqf.test.js:257` at the pinned parent, *"storyCheckQuests honors a UQF declarative gate on activation"*, and it injects `QUEST_DB.__uqf_gate` at runtime — the line number is exact and the mechanism is exactly as described. The HTML diff carries **three hunks and none of them touch `function storyCheckQuests(node, indexFresh)@30168`**, so §10's *"byte-identical"* claim is confirmed at the diff level. **§VM-01-F-FU shipped the index at `549d6b4`, 2 h 07 min later**, and its inlined comment names this report by §ID: *"This is why §VM-01-F reverted the built-once version."* A deferral that leaves its §ID in the destination file is a real deferral; this is the fastest one in the §VM-01 track.

## 5. Why this answers the parent report's open questions

The parent structural read (`lab-report-javascript-mud.md`, `c22f4f0`, the same morning) lists two blockers:

- **The `or` word.** Its finding 7: *"the gate language has no boolean nesting, by explicit choice… each new OR shape has historically meant a new term (`itemsMinAny` was added for exactly one quest). Worth watching: a term added per quest is the language telling you it wants an expression evaluator."* The AST is the boolean nesting; deleting `itemsMinAny` is the demonstration that the vocabulary can shrink instead of grow. **Verified quotation** — and the introducing commit `f8691c1` (§ARCH-01 Wave 7d) independently corroborates *"added for exactly one quest"* in its own message.
- **Finding #9.** *"`storyCheckQuests` linearly scans all 2,850 quests on every render."* The report's own recommendation was **not to index**: *"leave it, note it… premature indexing would add a cache to invalidate."* The compile-once framing answers the objection for gates — the memo keys on immutable authored data, so there is nothing to invalidate. **Verified quotation**, and §4.5 records that the *index* half of the answer did not survive contact with the harness.

**Citation correction (verified 2026-08-22).** This section credited the parent report with citing **CEL / JSONLogic** as prior art. `lab-report-javascript-mud.md` never mentions either, at ship-day or now. The prior art is real and it *is* this increment's — it comes from the §VM-01 **track preamble** in BACKLOG.md: *"CEL / JSONLogic for Inc F (expression-AST-as-data, no parser needed)."* §VM-01-A's own report says so in a parenthesis: *"(CEL / JSONLogic are Inc F's expression-AST reference, not Inc A's.)"* **The claim is true; the citation pointed one file to the left.**

It also sets up **§VM-01-G**, whose argument is *"when the data language lacks a shape, the file grows imperative code instead of vocabulary."* F is that thesis applied one layer up. §12 measures how much of G's per-node imperative logic actually became data.

## 6. Design decisions — LOCKED (veto-flagged)

### 6.1 One combinator layer, two leaf matchers. (flagged for veto)
Activation and completion have different leaf vocabularies but the same boolean algebra. `_compileGate(node, mode)` shares the combinator layer and dispatches leaves by `mode`. **Rejected axis:** an AST for activation only — which leaves `quest_wm_01` (a *completion* OR) unmigratable, i.e. fails the increment's one concrete deliverable.

### 6.2 Bare gate = implicit `all` — byte-identical, no migration. (flagged for veto)
A gate with no combinator key is a single leaf, dispatched to the unchanged matcher. **Rejected axis:** requiring every gate to be wrapped in `{all:[…]}` — a corpus-wide data migration with no behavioural gain and a large no-op-proof surface. *Held: the corpus was never touched, and the differential proves the equivalence rather than asserting it.*

### 6.3 Compile-once via a kernel-scope WeakMap — not an eager load pass. (flagged for veto)
Memoised lazily, keyed by the immutable gate object. This keeps the compiler **inside the parity-fenced kernel** and matches the file's own lazy-built-once idiom (`function _questNodes()@36978`, `let _gateFlagCache = null@26134`). An eager "walk `QUEST_DB` at load" pass would have to live in the host and either call into the kernel or duplicate compile logic. Runtime effect is identical. **Rejected axes:** interpret-per-render; eager host pass.

### 6.4 The `activateNode` index — DEFERRED to a follow-on. (decided during implementation)
Originally locked as in-scope. Implementation plus the regression showed a built-once index is not transparent under runtime `QUEST_DB` mutation (§4.5). Rather than reintroduce the cache the spec wanted to avoid, the index was removed from F. **Rejected axis:** *"ship the index with a size-guard now — a size-guard rebuild costs an `Object.keys().length` per render."*

> **This rejected axis is the most valuable sentence in the report, and it was overruled 127 minutes later.** §VM-01-F-FU shipped exactly the size guard F priced and declined. Benchmarked on the rebuilt ship-day tree (Chromium, median of 3 × 1,000 iterations, ms per activation pass at LHR): old scan **0.398** · shipped guarded path **0.110** · **`Object.keys(QUEST_DB).length` alone 0.111** · guard-free `Map.get` **0.0003**. The guard is **100 % of the surviving cost** and the shipped path is still Θ(2,853). F named the price in one clause, deferred on exactly that ground, and the follow-on paid it without re-measuring. Filed as **§DX-02ea**. *When a design lock rejects an option on cost, write the cost down — the next increment will need it and will not re-derive it.*

### 6.5 Delete `itemsMinAny`; `itemsAll` under `{any}` replaces it. (flagged for veto)
It existed only to reach exact-name/≥min matching **in OR position**; `{any}` now provides OR position. One term does the work. **Rejected axis:** keep it for back-compat — it had exactly one user, migrated in the same commit. *Held permanently: `itemsMinAny` occurs **0** times in the live corpus at ship and at HEAD, recursively scanned.*

## 7. Anchors

Measured on the **pinned parent build** `4f56816b` (the file as it stood when the design was locked), re-verified 2026-08-22.

| Symbol | `src/js/quest.js` | `play.html` (parent) | verdict |
|---|---|---|---|
| `QUEST:CORE:START` / `END` | 31 / 323 | 21706 / 21998 | ✅ ✅ |
| `canActivate` | 122 | ~21786 | ✅ / ❌ **21797** |
| `canComplete` | 177 | ~21850 | ✅ / ⚠ **21852** (21850 is its comment, cited exactly in §1) |
| `itemsMinAny` OR-entry / `orCount` | 198 / 199 | 21873 / 21874 | ✅ ✅ ✅ ✅ |
| `itemsAll` matcher | 221 | ~21876 | ✅ / ❌ **21896** |
| `*execBits` | 235 | — | ✅ |
| `storyCheckQuests` scan | — | 29590 / 29593 | ✅ ✅ |
| lazy-index idiom | — | 36063 | ✅ (the line is `_questNodeSet.add`, inside `_questNodes()`; §6.3 names it correctly) |
| `_gateFlagSet` | — | 25680 | ✅ (and `_gateFlagCache` 25679, cited in §6.3) |
| `q.completion.atNode` waypoint reader | — | 28281 | ✅ |
| `quest_wm_01` def / completion | — | 10942 / 10945 | ✅ ✅ |

**18 of 21 exact; the three misses are exactly the three the author marked `~`.** Every unhedged number is right to the line; every tilde is a confession. The worst, `itemsAll` at `~21876` (actual 21896), is repeated verbatim in §4.4 — and 21876 in the parent is a live `g.notFlags` line, so an existence check passes while the pointer is wrong. *A tilde in an anchor table is not rounding; it is the author telling you which number he did not paste.*

At HEAD the same symbols live at `function _matchActivationLeaf(g, st)@22049`, `function _matchCompletionLeaf(g, st)@22108`, `function _gatePred(node, mode)@22168`, `const _gateCache = new WeakMap()@22167`, `function _gateFlagSet()@26135`.

## 8. Invariants preserved

- **Host/Script Separation — advanced.** A new OR shape goes in the grammar, never a new single-use term; the increment *deletes* vocabulary. The compiler stays inside the parity-fenced kernel. ✅ *and see §12 for how the pressure re-expressed itself.*
- **Parity fence.** Kernel edits are inside `QUEST:CORE`; `src/js/quest.js` is edited then re-inlined byte-for-byte. ✅ **`check:questparity` identical at ship** — and only `src/js/quest.js` is touched among the four kernels, so `MOVER`/`ROOMS`/`DUEL:CORE` are untouched by construction. All four fences verified green on the rebuilt ship-day tree.
- **§VM-01-A coroutine** — `execBits` untouched: gates are evaluated, not executed. ✅
- **§VM-01-B seeded rng** — untouched; `check:rng` green on the rebuilt tree. ✅
- **§VM-01-C `_ENV` / §VM-01-D `getState()`** — the compiled predicate takes `st` as a parameter and both methods still call `S()` at evaluation time. ✅
- **Free-Movement / Mission-Gating** — no movement code; gate *logic* is relocated, not changed. ✅
- **Known latent (documented, not triggered).** `function _gateFlagSet()@26135` structurally walks `q.gate.flags/flagsAny/notFlags` and would not see flags nested under an AST *activation* gate. F introduces none, so it is not triggered; when activation gates adopt the AST, that walker must recurse.
  > **Verified 2026-08-22 and still latent — because nobody ever authored one.** AST activation gates: **0 at ship, 0 at HEAD**. `_gateFlagSet` is still non-recursive at HEAD. The report calls the fix *"tracked as a §VM-01-F follow-on"*; **no such row was ever filed**, in BACKLOG.md or plan-archive.md. Filed now as **§DX-02ed**. *A report can diagnose a latent defect perfectly, name the fix, and still be the only place it is written down.*

## 9. Test plan (as shipped) — and what re-running it found

**`src/scripts/check-gate-parity.js`** (headless, `require('../js/quest.js')`, wired into `check:walk` as `check:gateast`). `QUEST_DB` is not node-requireable, so the node check proves **kernel logic** against an **independently written reference interpreter** over: an AST-algebra truth table (`all`/`any`/`not`/nested/De Morgan/vacuous); every leaf term, activation and completion, with a passing and a failing state; and the `quest_wm_01` migration — OLD `{flagsAny, itemsMinAny}` under a reference with the deleted term restored, versus NEW `{any:[flagsAny, itemsAll]}` under the kernel. **72 assertions.**

> **Re-run on the rebuilt ship-day tree: `✓ 72 assertions — AST algebra, 25 leaf terms, quest_wm_01 migration`. Exact.** The report's own checker reproduces its own headline number a month later. At HEAD it prints **76 / 27 terms** — see §12 for why those two numbers moved together.

**`src/tests/integration/uqf-gate-ast.test.js`** (Playwright, real live `QUEST_DB`): (1) a **full-corpus differential** — every live gate and completion × a state matrix (empty + a best-effort satisfier), compiled kernel versus an independent in-page reference interpreter; (2) **`quest_wm_01` live**, plus a recursive scan proving no live gate still carries `itemsMinAny`.

> **Both pass at HEAD, 2/2, 31 days after ship.** The acceptance behaviour was re-proved in the browser at **both** builds — 0 seals `false`, 2 seals `false`, 3 seals `true`, letter alone `true`, letter+1 seal `true`. Identical at ship-day and at HEAD.
>
> **The differential is twice the size the report claims.** §9/§11 describe *"~2,800 gate evals + ~250 completion evals"* and *"~3,000 evals"*. Instrumented, the test performs **5,618 gate evaluations and 378 completion evaluations — 5,996 in all**, because each of 2,809 non-legacy gates and 189 completions is run against **two** states, which the report's own sentence says. It counted objects and called them evals, and the completion figure (~250) matches neither the object count (189) nor the eval count (378). *This is a report underselling its own proof by 2×, which is the rarer direction and worth saying out loud.*

**Adapted regression callers.** `quest-runtime-uqf.test.js` had two tests asserting the deleted `itemsMinAny` shape; both were rewritten to the grammar with the same truth table. ✅ verified: the file is **303 cases at the parent and 303 at the ship** — the +22/−14 diff is entirely in-place rewriting, so *0 NEW* is a claim about the same 303-case suite.

**Regression discipline.** Full `quest-runtime-uqf` via git-stash-diff: the with-change failing **set** is byte-for-byte the stashed baseline (**17 = 17**, *never an absolute count*).

## 10. Scope fence — what Inc F does not do

- **No new leaf gate term** — the increment *removes* one. New shapes are grammar, not vocabulary. ✅ *(at ship; §12 records what happened next)*
- **No `execBits` / handler / opcode change.** ✅
- **No eager compile-at-load pass** — compilation is lazy and memoised. ✅
- **No AST *activation* gate authored** — only `quest_wm_01`'s completion migrates. ✅ *and still true at HEAD: 0 AST activation gates in 2,823 gate-bearing quests.*
- **No host-render-path change at all** — the index was reverted; `storyCheckQuests` is untouched. ✅ **verified at the diff level: 3 HTML hunks, none in the render path.**
- **No `storyRender` change** — that is §VM-01-G. **No `_legacy_fn` change** — that is §VM-01-E's blocker. **No new `S_story` field, no save-migration, no seeded-rng change, no kernel-fence change.** ✅

## 11. Verdict — SHIPPED (`c6be7f8`, 2026-07-22 13:34)

The gate is a compiled boolean tree. `_compileGate` recognises `{all}`/`{any}`/`{not}` and recurses; a bare gate bottoms out at the pre-F term bodies, extracted verbatim, so the existing corpus is byte-identical. `_gatePred` memoises the compiled closure in a `WeakMap` keyed by the immutable gate object, and each method's gate evaluation is one line, preserving §VM-01-C/D's call-time state resolution. The single-use `itemsMinAny` term is deleted and `quest_wm_01`'s completion is re-expressed in the grammar. Kernel edits are inside `QUEST:CORE`; `src/js/quest.js` is re-inlined byte-identically.

**The one finding:** the `activateNode` index proved not transparent under runtime `QUEST_DB` injection — a built-once cache is stale for a quest added after the first render. It was reverted and deferred (§4.5/§6.4). F ships as a pure kernel-grammar change with no host-render-path edit.

**Tests:** `check-gate-parity.js` 72 assertions green · `uqf-gate-ast.test.js` 2/2 · two `quest-runtime-uqf` tests adapted · `quest-runtime-uqf` **0 NEW** by stash-diff (17 = 17) · `uqf-coroutine` 5/5 · `uqf-env` 5/5 · `uqf-quest-core` 7/7 · `rng-seed` 5/5 · `warrants-board` 25/25 · `uqf-gate-ast` 2/2 — **49 in one run**.

**Invariants:** all four parity fences green with 0 sentinels changed · `check:rng` green · `node --check src/js/quest.js` clean · only the two pre-existing `check:walk` baselines red.

> *"Deferred (not committed) until the user says commit."* — the closing line of the design lock, preserved in a file that is part of commit `c6be7f8`. The lock and the ship arrived in the same breath; this sentence is the last frame of the before.

---

## 12. Verification ledger — measured 2026-08-22 (§DOC-02cs)

Method: ship-day tree rebuilt from `c6be7f8` and parent tree from `4f56816b` (`git archive … | tar -x`, `node_modules` symlinked), so the report's own checkers run as they ran that day; corpus figures parsed in Chromium from the live `QUEST_DB` at **both** builds; anchors resolved against the pinned parent.

| # | Claim | Verdict | Measured |
|---|---|---|---|
| 1 | `_compileGate` §4.1 code block | ✅ **byte-identical** | at ship **and** at HEAD |
| 2 | Activation leaf "extracted verbatim" | ✅ **zero deltas** | whitespace-normalised parent→ship diff |
| 3 | Completion leaf "unchanged except `itemsMinAny`" | ✅ exact | only the 2 named code lines + 7 comment lines |
| 4 | `quest_wm_01` before/after code | ✅ byte-exact | modulo the report's line wrap |
| 5 | `itemsMinAny` deleted corpus-wide | ✅ **0 at ship, 0 at HEAD** | recursive scan of every gate + completion |
| 6 | `itemsMinAny` "added for exactly one quest" | ✅ corroborated | `f8691c1`'s own commit message says so |
| 7 | No AST activation gate authored | ✅ **0 at ship, 0 at HEAD** | 2,823 gate-bearing quests |
| 8 | `storyCheckQuests` untouched | ✅ | 3 HTML hunks, none in the render path |
| 9 | Scope: 4 files, kernel-only in the HTML | ✅ | HTML +130/−96 = **net +34 = the file's own delta** (37,749 → 37,783) |
| 10 | `check:questparity` "21,909 bytes" | ⚠ **figure exact, unit wrong** | 21,909 UTF-16 **code units** = **22,135** UTF-8 bytes → §DX-02dz, 4th instance. **This report is where 21,909 entered the record** (parent measured 20,179) |
| 11 | `check-gate-parity.js` 72 assertions | ✅ **exact** | re-run on the rebuilt tree: `✓ 72 assertions — 25 leaf terms` |
| 12 | `uqf-gate-ast.test.js` 2/2 | ✅ | **2/2 at HEAD**, 31 days on |
| 13 | Acceptance: letter OR 3 seals | ✅ | browser, both builds: 0 `false` · 2 `false` · 3 `true` · letter `true` · letter+1 `true` |
| 14 | §9 per-file counts 5/5/7/5/25/2 = 49 | ✅ **all six exact** | counted at the ship commit |
| 15 | `quest-runtime-uqf` "0 NEW" | ✅ | **303 cases at parent and at ship** — the diff is in-place rewriting |
| 16 | Two pre-existing `check:walk` reds | ✅ **reproduced exactly** | I1/I2 `J14→junction`, `J15→junction`; R3 cell 10,207 sea; R2 settlements 7,217 / 8,217 / 9,217 |
| 17 | The regression at `quest-runtime-uqf.test.js:257` | ✅ **exact at the parent** | *"storyCheckQuests honors a UQF declarative gate on activation"*, injects `QUEST_DB.__uqf_gate` |
| 18 | Anchors | **18 of 21 exact** | the 3 misses are exactly the 3 marked `~` (§7) |
| 19 | *"all 2,803 existing UQF gates"* | ❌ **wrong figure, inherited** | see below |
| 20 | *"~2,850 quests"* | ⚠ **2,853** | browser and text agree at ship and HEAD |
| 21 | *"~14/~11 gate terms"* (§1) | ⚠ **15 / 11** | 15 activation, 11 completion pre-F (10 after the delete) |
| 22 | *"`canActivate`/`canComplete` are two lines each"* | ⚠ | 5 and 3 lines; the **gate evaluation** is one line each |
| 23 | *"all four parity fences green"* via `check:walk` | ⚠ **fact right, attribution wrong** | see below |
| 24 | *"prior art the report cites: CEL / JSONLogic"* | ❌ **misattributed** | the parent report never mentions either; the source is BACKLOG's §VM-01 preamble (§5) |
| 25 | `_activateIndex` (§3 inventory row) | ❌ **NOT SHIPPED** | zero commits in any code file, ever; the follow-on shipped `_questsByNode` |
| 26 | *"~3,000 evals"* in the differential | ⚠ **5,996** | 5,618 gate + 378 completion — undersold 2× (§9) |
| 27 | The `_gateFlagSet` follow-on *"tracked"* | ❌ **never filed** | no row in BACKLOG.md or plan-archive.md → §DX-02ed |
| 28 | *"pre-existing baseline"* (17 fails) | ⚠ **shelf life 5 h 24 min** | see below |

### 12.1 The 2,803 — a single-quote grep, inherited from a sibling three hours old

The figure appears three times (§1, §6.2, §11) as *"all 2,803 existing UQF gates."* Measured at the ship build, in the browser and in the text, agreeing exactly:

| quantity | value |
|---|---:|
| quests in `QUEST_DB` | **2,853** |
| carrying a `gate` object | **2,823** |
| **non-legacy gate objects — the actual no-op-proof scope** | **2,809** |
| of which the gate is a literal `{}` | **1,136** |
| `gate:{_legacyFn:true}` | **14** |
| `schema:'UQF-1.0'` — **single-quoted only** | **2,803** |
| `schema:"UQF-1.0"` — double-quoted | **20** |

**2,803 is `grep -c "schema:'UQF-1.0'"` minus its one comment hit — a line census blind to the twenty double-quoted entries.** It is not a gate count at all; it came from the parent structural read, published at 10:34 that morning (*"2,850 `QUEST_DB` entries, of which 2,803 carry `schema:'UQF-1.0'`"*), and was inherited three hours later re-labelled as gates. §DOC-02cj had already scored the parent's copy as stale; this is the same number's second life. *A number crossing a document boundary changes what it counts, and nobody re-measures a figure a sibling report already printed.*

Two footnotes worth keeping. **1,136 of the 2,809 gates — 40 % — are the empty object `{}`**, which passes unconditionally; the no-op proof is genuinely corpus-wide but its median case is trivial, and the report never says so. And 2,803 is *also*, by coincidence, the exact size of the `activateNode` index the follow-on shipped (2,853 − 40 epic − 10 without `activateNode`) — a red herring, now defused: the provenance is the grep.

### 12.2 A `check:walk` claim is a claim about that day's `check:walk` — and it uncovered a live hole

§9 and §11 both say *"`check:walk`: all four parity fences green (`MOVER`/`ROOMS`/`DUEL`/`QUEST`)."* Read from `git show c6be7f8:package.json`, `check:walk` that day ran **9 gates and three parity fences**. `check:duelparity` existed as a script and **was not in the chain.** All four *are* green on the rebuilt tree, verified — so the fact is right and the attribution is wrong. (This increment is also what took the walk from 8 gates to 9, by adding `check:gateast`.)

> **And the hole is still open at HEAD.** `check:walk` now runs 16 gates; `check:duelparity` is in none of them, and `.github/workflows/walk-invariants.yml` runs `check:walk` plus four standalone gates, none of which is it. **`DUEL:CORE` — one of the four parity fences CONTRIBUTING names as a hard invariant — has no automated coverage anywhere.** It is green today (7,987 code units), which is luck, not a fence. Filed as **§DX-02ec**, one word in a chain. *Verify a "the gates are green" line against the gate list of that day, and the audit sometimes hands you a defect from this one.*

### 12.3 The baseline was a claim, and it had 5 h 24 min to live — plus one real red pointing straight at F's own thesis

The verdict reasons through *"the with-change failing set is byte-for-byte the stashed-HEAD baseline (17 = 17)."* The **set** discipline is right, and the arithmetic survives: 303 cases at both builds. But *"pre-existing baseline"* is a shelf-life claim.

- **13:34** — F ships, recording 17 = 17.
- **15:41** — §VM-01-F-FU ships, recording 18 ≡ 18. (Same doomed baseline, one increment later.)
- **18:58** — `bd951d7` retires it: *"it was 17 stale tests, not server clobber (17→1)."* **5 h 24 min after F.**
- **2026-07-23 13:28** — `37f8ccb` (§BOARD-01-VOID-GATE) fixes the surviving 1 and the suite is **303/0**.

**Six §VM-01 reports (A, B, C, E, F, F-FU) all cite this same baseline; not one re-measured it.** And the sting is in the last line: the single genuine failure inside F's *"pre-existing environment"* was `quest-runtime-uqf.test.js:8519`, *"no legacy residue"* — three Void-tide quests day-gated by per-quest `activateCond` closures, i.e. **a Host/Script Separation violation, the exact invariant this increment exists to advance.** F treated it as weather. It was the next job, and F's own machinery did it a day later.

### 12.4 What happened to *"no new leaf term, ever again"* — the vocabulary grew in the dimension the grammar cannot compose

| | at ship `c6be7f8` | at HEAD |
|---|---:|---:|
| activation leaf terms | **15** | **17** |
| completion leaf terms | **10** | **10** |
| `check:gateast` assertions / terms | **72 / 25** | **76 / 27** |
| gates using `{all}`/`{any}`/`{not}` | **1** | **1** |
| `gate:{_legacyFn:true}` | **14** | **14** |

The two new terms are **`dayMin` / `dayMax`**, added by `37f8ccb` the next day. The kernel comment states the reason plainly: *"a clock gate the grammar can now express, so no per-quest `_legacy_fn`."*

**They are not an OR shape — they are a comparison shape, and `{all}`/`{any}`/`{not}` cannot make one.** The combinators *compose* predicates; they cannot *create* one. So the term-per-quest pressure CONTRIBUTING diagnosed did not stop; it moved one axis over, from OR-position to comparison-position, where the grammar still has nothing to say. The evidence that this is systemic rather than a single lapse is `is not expressible in canActivate@13974`, still in the file: *"lxvii67's `faith_folk>=1` gate is not expressible in `canActivate`'s term set ⇒ `gate:{_legacyFn:true}`"* — and 14 quests still ride that escape hatch, unchanged for a month. `dayMin`/`dayMax` is a `counterMin` for one hard-coded counter. **This measurement is appended to §DX-02dy**, whose proposed fix is the general leaf; two special-cased comparison terms shipping within a day of the grammar landing is the strongest available argument for it.

> **The instrument.** *A grammar that composes leaves does not stop the vocabulary growing — it only stops it growing along the axis it composes.* Score a *"no new terms"* promise by counting the leaf terms a month later **and asking what shape the new ones are**. F deleted one OR-position term and gained two comparison-position terms in 30 days, and both facts are correct at once.

---

## 13. What it bought the player

The honest first answer is *nothing directly*. `quest_wm_01` — Isolde's Revocation Record at the Weimar archive — completes on the archive letter **or** three Scholar Kings' Seals, before and after, to the same truth table. The player cannot see a combinator. The increment is a no-op by design and says so.

The real answer arrived **twenty-four hours later**, and it is the second time this program has found the same shape: *when asked what a refactor bought the player, look for the change it made affordable, not for the feature it shipped.*

Before F, the term logic lived as a hundred-line straight run inside a method. Adding a term meant editing a method, re-inlining a kernel, and hoping. After F, it lived in a pure `function _matchActivationLeaf(g, st)@22049` — one argument in, one boolean out — with a headless reference interpreter, a full-corpus differential over ~6,000 evaluations, and a gate already wired into `check:walk`. The distance from *"the grammar can't say this"* to *"the grammar says this and is proved to still be right about everything else"* fell from a scary afternoon to a single commit.

The very next day, §BOARD-01-VOID-GATE walked that distance. Three Void-tide combat quests — the Warrant Board's endgame bounties — opened on day 21, 35 and 42 through hand-written `activateCond` closures: invisible to the quest graph, invisible to the soft-lock prover, and the last surviving *"legacy residue"* failure in the suite. The fix was to widen the grammar, not to write another closure: `dayMin`/`dayMax` went into the leaf, the three closures were deleted, both reference interpreters were extended in lockstep, and the commit records the result — *"`check:questgraph`: day-window is monotone-satisfiable."*

**That last clause is the player-facing part.** The doom clock stopped being a private opinion held by three arrow functions and became a fact the soft-lock prover can reason about — so the tool that guarantees the world is finishable can now see that the Void tide rises on day 21, and that a player who arrives on day 43 has not been quietly locked out. A quest window nobody could verify became a quest window the build verifies on every run.

That is the shape of the whole increment. F's headline — *"teach the gate to say `or`"* — has one speaker after a month. F's actual gift was a clean seam and a prover, and the game spent it within a day on a sentence F never anticipated. **Vocabulary is what a language ships with; a seam is what lets it learn a word tomorrow.**

## 14. Defects filed

| § | Sev | Summary |
|---|---|---|
| **§DX-02ec** | 🟢 NEW | `check:duelparity` is in `package.json` and in neither `check:walk` nor CI — `DUEL:CORE`, a named hard invariant, has no automated parity fence (§12.2) |
| **§DX-02ed** | 🟢 NEW | `function _gateFlagSet()@26135` does not recurse `{all}`/`{any}`/`{not}`; latent since 2026-07-22, named here as a follow-on and never filed (§8) |
| §DX-02dy | 🟡 | *appended*: `dayMin`/`dayMax` is the grammar growing a comparison term because it has none — the corroborating measurement for the general `counterMin` leaf (§12.4) |
| §DX-02ea | 🟢 | *cited*: the size guard this report priced and declined, shipped 127 minutes later and never re-measured (§6.4) |
| §DX-02dz | 🟢 | *cited*: `check:questparity`'s "bytes" are UTF-16 code units — 4th instance, and this report is where 21,909 entered the record (§12, row 10) |

---

*Verified 2026-08-22 · §DOC-02cs · 179 → 316 lines. Design text of 2026-07-22 preserved; every measured claim carries a ledger row. Claims that did not ship are marked NOT SHIPPED and kept.*
