# Lab Report — §EDITOR-01-D-FU (a): the visual drag-reorder chain editor

**Original status:** DESIGN LOCKED → implementing · **Original date:** 2026-06-27 (mtime `2026-06-27 16:56:37 -0700`)
**Ship record:** lock `2430dd0` → inc2 factory `78ca3ae` → inc3 Quest Creator `0198149` → inc4 CRUD form `c2e6892` (closes (a)) · item (b) closed same evening by `de64c16`
**Verified:** 2026-08-17 (§DOC-02br) against HEAD and against the reference build `2430dd0` (`worldbuilder.html` 10,266 lines)
**Verdict:** **SHIPPED IN FULL — 4 of 4 increments in order, in 10 h 11 m.** Every one of the report's **12 line citations is byte-exact**, and §3's integration recipe was executed line for line. Two findings: the "nothing changes on the server" claim is true of the path it measured and false of the one it did not (§7), and the widget's single stated reason to exist has **zero live users** ten weeks on (§11).

---

## Abstract

§EDITOR-01-D made quest rewards *declarative*: an `itemChain` array of `grant` / `take` / `grantBit` / `takeBit` steps, applied on completion by `function _applyItemChain(q)@26169`. It shipped that field with a **textarea** and a pipe grammar — `grant|name|icon|type|sell|desc`, one step per line. This report locked the replacement: `buildChainEditor(host, opts)`, a **factory** (not a singleton) returning an independent instance per mount, rendering one `.chain-row` per step with a kind `<select>`, per-kind field inputs, ▲/▼ reorder, native drag, and a remove button — wired into both authoring surfaces that carry the field.

The design is correct and it shipped essentially verbatim. Reordering became a button instead of a cut-and-paste; positional fields became named ones; and the `once` idempotency flag, which the pipe grammar **cannot express at all**, gained a checkbox. The report's discipline is worth naming: it made ▲/▼ the canonical reorder path and demoted native drag to a progressive enhancement *specifically so its tests would never depend on drag* — a prediction that held, though it contradicts its own increment plan (§9).

Two things the report could not see from where it stood. First, it declared that nothing in the server changes; that was true of the CRUD form's `PUT` (which patches arrays generically and never names the field) and false of the Quest Creator's **POST Quest** button, whose destination silently discarded `itemChain` for **6 days 4 hours** afterward. Second, the feature's headline justification — expressibility of `once` — has never been exercised: `once:false` appears **0 times** in the shipped game, as do the `grantBit` and `takeBit` kinds the selector offers.

---

## 1. Intent, inspiration, and what it buys the player

**The inspiration is the reward that reads like prose.** When a quest ends, something should change in the player's hands — a Friendship Bead from a grateful cat-keeper, a Watchmaker's tome that quietly raises a death save, a smelted ingot that replaces the ore you carried in. Before §EDITOR-01-D those payoffs lived inside hand-written handler closures and a 61-branch `if (id === 'quest_…')` ladder, which meant *every new reward was a code change*. §EDITOR-01-D made them data. **This report is about whether a human can actually author that data.**

That distinction is the whole point, and it is not cosmetic. A grammar nobody can type is a grammar nobody uses, and content that is expensive to author does not get made. The pipe grammar was compact and genuinely hostile:

- **Positional fields fail silently.** `grant|Bead||misc||A token` — miscount the empties by one and `sell` becomes `desc`. Nothing throws; the item just arrives wrong.
- **No affordance per kind.** Every step is one undifferentiated line, so nothing tells the author that `take` has an `all` flag and `grantBit` does not.
- **Reorder means retyping.** Chain order is execution order — take the ore *before* granting the ingot — and the only way to change it was to cut a line and paste it elsewhere.
- **`once` was inexpressible.** The runtime honours a per-step `once` flag; `parseItemChainText` never sets it. The most subtle property in the grammar had no syntax.

**What the widget adds, stated as the delta an author feels:** the kind selector *is* the documentation (pick `take` and the fields become `name` + `all`); a mis-ordered chain is two clicks from correct; and a blank required field drops its row instead of writing a nameless item. It is a small tool whose value is measured in the content that now exists because writing it stopped being fiddly.

**Measured at HEAD, ten weeks on.** The game holds **2,853 quests**, of which **27 carry an `itemChain`**, totalling **32 steps** — **29 `grant`, 3 `take`**. Seventeen of those steps carry a rich item field (`bonus`, `readText`, `passive`, weapon stats) that the scalar pipe grammar could never have held; they are reachable only through the per-row **advanced-JSON** input this widget grew four hours later (§6, delta 2). And **29 of 29 grants set `silent:true`**, which is the detail that matters for the player: a migrated reward keeps its hand-written narrative line instead of stacking a generic *"🪵 X obtained."* on top of it. **The prose won.**

**The honest counterweight, in the same breath.** The widget's stated headline gap — `once` — has **0 uses** in the shipped game, and `git log -S "once:false"` returns no commit that ever wrote one into `roll2hit-v3.html`. Two of the four kinds the selector offers, `grantBit` and `takeBit`, likewise have **0 live steps**; their only occurrences in the game file are in the applier's own `switch` and its comments, one of which calls `takeBit` *"the sole author path"* for retiring a mission bit — a sole author path with no authors. **Half the locked vocabulary and the one superset feature are unexercised.** The realised value is concentrated entirely in `grant`, and it is real there.

---

## 2. Method

Verification ran read-only; `roll2hit-v3.html` was not modified.

1. **Reference build.** The lock commit `2430dd0` itself — it touched only this report and `plan.md`, so its `worldbuilder.html` (10,266 lines) is the file the author was reading. All 12 citations were resolved there, not at HEAD.
2. **Instrument 84 first.** `git diff 2430dd0 HEAD` on this path, to separate prediction from post-hoc correction.
3. **`git log -S` with no pathspec** on each named symbol, to separate *retired* from *never shipped*.
4. **The report's own acceptance tests were run**, not merely cited — and the failures re-created in isolation before any code was blamed (§10).
5. **Census through `wbapi-core`'s parser**, never a line regex.
6. **The save paths traced end to end**, client button → server serializer (§7).

**One methodological note about this file.** Its mtime is **24 seconds after** inc4's ship commit, and the diff against the lock is exactly one hunk: the `**Status:**` line, rewritten from *"DESIGN LOCKED → implementing"* to the closed ship record. **Everything below that line is the original prediction, unamended.** That makes this the cleanest instrument-84 result in the corpus so far — the body is a pure forecast, and every score below is a score on a forecast rather than on a description written with hindsight.

---

## 3. The gap, re-measured

> The pipe grammar is compact but **lossy to author**… The `once` idempotency flag is **not expressible at all** in the text grammar.

**HOLDS, verbatim.** `parseItemChainText` at the reference build reads six positional fields for `grant` and never mentions `once`; the runtime defaults it true. The report's diagnosis of the positional hazard is likewise exact.

**And one limitation it did *not* claim, worth recording because a sibling report did.** The pipe grammar's obvious weakness — a literal `|` inside `desc` — is not actually a defect: `desc` is the **last** field, and the parser re-joins the tail (`if (p[5]) step.desc = p.slice(5).join('|')`). Put the free-text field last and the escaping problem stops existing. This report does not overclaim it, which is the correct call.

---

## 4. The locked design, condensed

| Element | Locked shape |
|---|---|
| **Factory** | `buildChainEditor(host, opts)` beside the codec; window-bridged for the CRUD IIFE; returns an **instance**, never a singleton |
| **Instance API** | `getSteps()` (live DOM-order read) · `setSteps(arr)` · `.el` |
| **Row** | `⠿` grip (`draggable=true` on the row) · kind `<select>` · fields container re-rendered on kind change, each input `data-cf="<field>"` · ▲ ▼ · ✕ |
| **Kinds** | `grant` (name\* icon type sell desc **once**) · `take` (name\* all) · `grantBit` (flag\* label) · `takeBit` (flag\*) |
| **Drop rule** | a row whose required field is blank is dropped, mirroring the codec's `.filter(Boolean)` |
| **`once`** | emit `once:false` **only when unchecked** — omission means `true`, keeping serialized JSON minimal |
| **`sell`** | `+value \|\| 0`, only when non-empty |
| **Reorder** | ▲/▼ canonical and testable; **drag additive** — "if it regresses, ▲/▼ still fully drive the feature" |
| **Codec** | `parseItemChainText` / `itemChainToText` **kept** as the canonical Step[] ⇄ text mapping, plus a new parity assertion so widget and grammar cannot silently diverge |

The parity clause is the load-bearing one: `buildChainEditor({initial: parseItemChainText(text)}).getSteps()` ≡ `parseItemChainText(text)`, with the widget a strict superset. It shipped as a test (§10).

---

## 5. Line citations — 12 of 12 byte-exact

Resolved at `2430dd0`. This ties the corpus record, and it is arguably stronger than the tie: **every citation is the exact insertion point rather than a function declaration**, which is what a design lock is for.

| # | Report's claim | Line | Found there |
|---|---|---|---|
| 1 | `#ed-itemChain` textarea | 8942 | `<textarea class="fi" id="ed-itemChain" …>` ✓ |
| 2 | consumed in `edBuildQuestObj` | 9277 | `const ic = parseItemChainText(edVal('ed-itemChain'));` ✓ |
| 3 | CRUD field entry | 6040 | `{ key:'itemChain', … arr:'itemchain', ta:true, … }` ✓ |
| 4 | generic textarea branch in `renderDetailForm` | 6243 | `if (f.ta) {` ✓ — the exact branch to special-case *before* |
| 5 | parsed back in `collectFormData` | 6285 | `if (f.arr) { const a = textToArr(f.arr, v); if (a.length) …` ✓ — the exact `if (a.length)` guard §3.2 promises to match |
| 6 | `textToArr` itemchain branch | 6141 | `if (kind === 'itemchain') return window.parseItemChainText(txt);` ✓ |
| 7 | `arrToText` itemchain branch | 6131 | `if (kind === 'itemchain') return window.itemChainToText(val);` ✓ |
| 8 | "after `itemChainToText`, ~9142" | 9142 | the **closing brace** of `itemChainToText` (9127–9142) ✓ |
| 9 | `edAddBitCard`'s `renderFields` | 9079 | `function renderFields(kind) {` ✓ |
| 10 | codec's `sell` handling | 9109 | `if (p[4] !== undefined && p[4] !== '') step.sell = +p[4] \|\| 0;` ✓ |
| 11 | `edApplyPreset` blank-loop | 9473 | `…,'ed-xpAward','ed-itemChain']) {` ✓ |
| 12 | live-preview `liveIds` | 9531 | `…,'ed-passText','ed-itemChain'];` ✓ |

Citation 8 deserves its own note: it is the only one the author hedged with a `~`, and it is exact. A report's own `~` usually marks the boundary between what was copied and what was recalled; here the recall was right.

---

## 6. Spec → shipped

| # | Locked | Shipped | Verdict |
|---|---|---|---|
| 1 | factory beside the codec, window-bridged | `worldbuilder.html:function buildChainEditor(host, opts)@8569` · `worldbuilder.html:window.buildChainEditor = buildChainEditor@8700` | ✅ verbatim |
| 2 | four kinds, fields as tabled | `worldbuilder.html:const CHAIN_KINDS = {@8557` — all four kinds, all fields, `once` `{chk:true,def:true}` | ✅ **+ superset**: a `silent` checkbox and a per-row **advanced-JSON** input carrying 13 rich fields (`worldbuilder.html:const GRANT_RICH = [@8567`), both added 3 h 10 m later by FU(b1) `7fc0d8e` |
| 3 | `once:false` only when unchecked | `worldbuilder.html:if (get('once') === false) step.once = false;@8666` | ✅ exact |
| 4 | `sell` = `+v \|\| 0` when non-empty | `const sell = get('sell'); if (sell !== '') step.sell = +sell \|\| 0;` | ✅ exact — matches codec 9109 as promised |
| 5 | blank required field drops the row | `readRow` returns `null`; `worldbuilder.html:.map(readRow).filter(Boolean)@8692` | ✅ exact |
| 6 | instance API `getSteps` / `setSteps` / `el` | all three | ✅ **+ `addStep(s)`**, a fourth method not in the lock |
| 7 | Quest Creator markup swap | `worldbuilder.html:id="ed-itemChain-editor"@8320`; header kept, grammar hint rewritten as a per-kind legend | ✅ exactly as §3.1 |
| 8 | instance at IIFE init with `onChange: edSchedule` | `worldbuilder.html:const edChain = buildChainEditor(EG('ed-itemChain-editor')@9110` | ✅ **verbatim, character for character** |
| 9 | build / reset / `liveIds` | `worldbuilder.html:const ic = edChain.getSteps();@8879`; `edChain.setSteps([])` in the reset path; `'ed-itemChain'` removed from both id lists | ✅ all four edits |
| 10 | CRUD render special-case *before* the textarea branch | `worldbuilder.html:wrap._chainEd = window.buildChainEditor(wrap, { initial });@6313`, ahead of `if (f.ta)` | ✅ exact |
| 11 | CRUD collect reads the stashed instance, keeps `if (a.length)` | `worldbuilder.html:const ed = w && w._chainEd;@6359` | ✅ — **refinement**: located via a `[data-chain-field]` selector, because `collectFormData` has no `wrap` in scope |
| 12 | codec kept + parity assertion | both codec functions live; parity test shipped | ✅ |
| 13 | drag: "`dragstart` stamps the row index" | a `.chain-drag` **CSS class**, with indices read from the live DOM at drop | ⚠ **different encoding, better** — an index stamped at dragstart goes stale if rows change under it |
| 14 | ▲/▼ "**disabled** at the ends" | never disabled; they no-op (`if (p) { … }`) | ❌ **NOT SHIPPED** — the affordance is a dead click rather than a greyed control |
| 15 | — | `worldbuilder.html:window.__edChain = edChain;@9111` | ➕ test hook, not in the lock |

**Increment plan: 4 of 4, in order, each with the tests it promised.** Lock `2430dd0` 06:45:23 → factory `78ca3ae` 06:48:37 (**+3 m 14 s**) → Quest Creator `0198149` 16:39:08 → CRUD `c2e6892` 16:56:13. **Spec → closed: 10 h 11 m.** The lock-to-runtime gap of **three minutes** is the fastest in the corpus; *"DESIGN LOCKED → implementing"* was accurate for slightly longer than it takes to read the report.

---

## 7. The finding — "nothing changes on the server" was true of one path and false of the other

> Nothing in `roll2hit-v3.html` / `wbapi-core.js` / `wbapi-server.js` changes. — §preamble
> **No data-shape change** → no `check-itemchain.js` change, no server change, no migration. — §6

**The `check-itemchain.js` half is exactly right,** and the boundary is drawn precisely where it belongs: none of the three item-(a) commits touched that gate. It changed only in item **(b)** (`5454543`, `7fc0d8e`) — the migration this report explicitly fenced out of scope.

**The server half is the interesting one.** At the reference build, the string `itemChain` occurs **zero times in the entire 9,379-line server**. Two save paths lead out of the two surfaces this report wires:

- **CRUD form → `PUT`.** The dispatch is *generic*: `typeof value === 'string'` → `editField`, else `Array.isArray(value) || number || boolean` → `editStructuredField`, which patches `_rawSrc` at source level. An array field round-trips **without the server ever naming it.** The claim is true here, and this is precisely why the author could believe it.
- **Quest Creator → `POST`.** `worldbuilder.html:async function edPostQuest()@9094` calls `WBAPI.quests.create(q)` → `POST /api/quest` → `serializeQuestLiteral`, whose four field lists at that build are `STR`, `NUM`, `BOOL`, `FN` — **and `itemChain` is in none of them.** Every chain authored through the new widget and posted with that button was serialized away in silence.

The repo says so in its own words. The fix arrived at §ARCH-01 Wave 8b, `11af1e5` (2026-07-03 20:57), which added `js/wbapi-server.js:const JSONF = ['gate','bits','completion','itemChain'@1710` and recorded in its commit subject: *"all silently dropped before — API-posted UQF quests arrived stripped dead."* **Exposure window: 6 d 4 h 18 m** from inc3.

Three things keep this fair to the author. The defect **predates this report** — the old textarea fed the same `edBuildQuestObj` into the same POST button, so the widget neither caused nor worsened it. The report's *wiring* is complete: because §3.1 changed the shared builder, the widget's output does reach `edPostQuest` correctly. And the loss is at the destination, not the plumbing.

**But the sentence is still the shape that keeps failing.** §3.1 enumerates four consumers of the widget's output — Build, Reset, Export, and the export serializer — and the one it does not enumerate is the only one that leaves the browser. This is the **third consecutive increment** in this program to find *"no server change required"* stated correctly about a measured path and wrongly about an unmeasured one; §EDITOR-01-D and §EDITOR-02 were both bitten by this same route in the same week. ***"No change required" is a claim about a path, and it obliges you to walk that path to its end.***

---

## 8. Risk register — 2 of 2 held, and both were tested

| Risk | Mitigation | At HEAD |
|---|---|---|
| **"the singleton trap"** — two live instances | factory returns per-mount instances; no `window.chainEditor` global | ✅ holds, **and has its own test**: *"factory returns independent instances (no shared singleton state)"* |
| **drag flakiness in Playwright** | ▲/▼ canonical; "tests never depend on native drag" | ✅ holds — no shipped test touches drag |
| *scope:* item (b) untouched | — | ✅ (b) closed separately the same evening, `de64c16` |
| *scope:* no data-shape change | — | ✅ no migration; gate untouched by (a) |

A register that names two risks, mitigates both **in the design rather than in prose**, and ships a test for one of them is the strongest result this program has scored on a register. The pattern worth copying: each mitigation is structural — *return an instance*, *make the boring control canonical* — so the risk is retired by construction rather than by vigilance.

---

## 9. The report contradicts itself about drag, and HEAD sides with §6

§5's Inc-2 test plan promises *"▲/▼ **and drag** reorder"* tests. §6 promises the opposite: *"tests never depend on native drag."* Ten weeks on, `worldbuilder-chain-editor.test.js` holds ten tests and **none exercises drag** — §6 won.

This is the healthy outcome of an internal disagreement, and it is worth recording rather than tidying away: **the increment plan was written optimistically and the risk register was written honestly, and the risk register is the one that governed.** Native HTML5 drag-and-drop is notoriously unreliable under automation; a test suite that depended on it would be a flake generator guarding a progressive enhancement. The feature is fully driven by ▲/▼, exactly as designed — so the untested surface is, by construction, the one whose failure costs nothing.

---

## 10. Acceptance tests — run, not cited

`worldbuilder-chain-editor.test.js` (added by inc2, **10 tests**) implements the Inc-2 plan point for point: four-kind round-trip, `once` superset, ▲/▼ reorder, required-field drop, and the §4 **codec-parity** assertion — plus four later tests for the FU(b1) rich fields and the singleton risk.

**Result: 22 passed / 4 failed** across the three specs this report touches. All ten chain-editor tests and the whole Quest Creator spec pass. **All four failures are in `worldbuilder-crud-arrays.test.js` — the known pre-existing §DX-02d baseline red** (4/6, proven pre-existing by a `git stash` run at HEAD on 2026-07-29). Running the file alone reproduces the identical four.

**Three of those four are this report's own Inc-4 acceptance tests** — the ones §5 designated to close item (a) — so the discipline of re-creating the scenario in isolation before blaming the code applies with full force. Doing so **exonerates the widget completely.** Every failure aborts in the shared `renderEntity` helper at `page.click('.crud-type-btn[data-ctype="quest"]')` with `<div id="welcome-screen"> intercepts pointer events` — a page overlay swallowing the click, reached **before any chain-editor code runs**, which is why the non-chain array test at `:68` fails identically. Driving the same three assertions past the overlay in a scratch spec passes all of them:

- an entity seeded with three steps renders **3 rows in DOM order**;
- `collectFormData()` returns `Alpha → Beta(all:true) → gamma`;
- ▲ on row 2 yields `Beta → Alpha → gamma` **through `collectFormData`**, not merely in the DOM;
- an entity with no `itemChain` mounts an empty widget and the key is **omitted** from the collect.

**The Inc-4 contract holds in full. The red is the harness, and its root cause was not previously recorded** — §DX-02d has carried these four since 2026-07-29 as "either fix them or document them," with no diagnosis. That diagnosis is now filed (§13).

Gates green at HEAD: `check:itemchain` **29/29** · `check:laddermigration` **148/148**.

---

## 11. HEAD census

Through `wbapi-core`'s parser over 2,853 quests:

| Measure | HEAD |
|---|---|
| Quests carrying `itemChain` | **27** |
| Total steps | **32** |
| By kind | `grant` **29** · `take` **3** · `grantBit` **0** · `takeBit` **0** |
| Steps with a rich field | **17** (`readText` 7 · `description` 5 · `bonus` 3 · weapon stats · `heal` · `passive` · `uses`) |
| `silent:true` grants | **29 of 29** |
| `once:false` anywhere in the game | **0** |
| `take` steps using `all:true` | **3 of 3** |

Two of these deserve reading together. **`once:false` at zero** means the one capability that justified replacing the textarea has never been used — the widget's real-world win was ergonomic (named fields, clickable order, a discoverable per-kind schema), not expressive. And **all three `take` steps use `all:true`**, which is the exact code path §EDITOR-01-D's own report shipped a bug in — `S_story.inventory = inv.filter(…)` **reassigned** the array, orphaning a cached reference so a later grant in the same chain vanished. It was repaired 25 hours later in `5454543`. Every live `take` in the game exercises the branch that was broken.

---

## 12. Conclusion

**A design lock that scored 12 of 12 on its pointers, executed 4 of 4 increments in ten hours, and had its runtime three minutes after it was written.** §3's integration recipe reads like a diff because that is what it became: the instance line, the build line, the reset call, both id-list deletions and both CRUD special-cases all shipped character-for-character. The widget is unchanged and green ten weeks later, and the codec it deliberately kept still guards the boundary it was kept to guard.

The two lessons are about the shape of the blind spots, not the quality of the work:

1. **A negative claim about a subsystem is only as good as the paths you walked.** *"Nothing on the server changes"* was true of `PUT`, which is generic over arrays, and false of `POST`, which enumerates fields — and the report's own integration section lists every consumer of the widget's output except the one that crosses the network.
2. **Ship the affordance, then check whether anyone uses it.** `once` was the gap that motivated the feature and has zero instances; `grantBit`/`takeBit` are offered by the selector and used by nothing. The widget earned its place regardless — on the 29 `grant` steps and the 17 rich fields that only exist because authoring them became cheap — but it earned it for reasons other than the one on the tin.

The most quietly instructive line in the report is the one about drag: *"if it regresses, ▲/▼ still fully drive the feature."* An author who writes that sentence before writing the code has already decided which half of the feature is allowed to be fragile — and ten weeks of green tests are the dividend.

---

## 13. Backlog filed by this verification

- **§DX-02d (existing row, extended)** — the four carried `worldbuilder-crud-arrays` reds now have a **root cause and a proof**: every one aborts in the shared `renderEntity` helper at `page.click('.crud-type-btn[data-ctype="quest"]')` because `#welcome-screen` intercepts pointer events; the assertions themselves all pass when driven past the overlay. Three of the four are §EDITOR-01-D-FU(a) Inc-4's acceptance tests and the widget is **not** implicated.
- **§DX-02ch (new)** — the Quest Creator's **POST Quest** button dropped `itemChain` for 6 d 4 h (§7); the class is closed at HEAD by `JSONF`, but no gate asserts that the POST field list and the authoring surface stay in step.
- **§DX-02ce (existing row)** — this report's line 5 carried the stale **58**-branch ladder figure; annotated below.

---

## 14. Annotations (HISTORY doc — annotate, never rewrite)

- **"the 58-branch reward-ladder migration" (§scope).** The ladder held **61** branches, at the reference build and at every commit that day; **58 was never true**. It was re-measured correctly at 61 by this report's own sibling lock (`27956e4`) just **8 min 24 s** after this file was committed — the shortest gap in the corpus between an error and its available correction, and it still propagated no further — and the structure has been at **0** since §ARCH-01 W7c (`a79c76a`, 2026-07-03) folded it into per-quest UQF `onComplete` chains. Owned by **§DX-02ce**; `npm run check:laddermigration` reports `0 ladder branches` at HEAD.
- **`wbapi-core.js` / `wbapi-server.js` (§preamble).** Both were at the **repo root** on 2026-06-27; the `js/` prefix arrived with `cc35c08` (2026-07-09). The unprefixed paths are correct for their day.
- **Bare line numbers** (8942, 9277, 6040, …) are against `worldbuilder.html` at `2430dd0` (10,266 lines) and do not resolve at HEAD. All 12 were verified at that build (§5).
