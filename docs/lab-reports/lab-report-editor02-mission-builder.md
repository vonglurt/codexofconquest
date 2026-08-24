<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §EDITOR-02: Mission Builder (form-based arc insertion)

**Original status:** DESIGN LOCKED → implementing · **Original date:** 2026-06-26 (mtime `2026-06-26 22:10:21 -0700`; `2026-06-27T05:10:21Z` in UTC)
**Ship record:** lock `bc73932` → inc2 `e2dcd76` → inc3 `584bb27` → inc4 `293808e` (core closed) → FU `96c4258` · `0449472` → UQF re-encode `11af1e5`
**Verified:** 2026-08-17 (§DOC-02bq) against HEAD and against the reference build `6515592` (`bc73932^`)
**Verdict:** **SHIPPED IN FULL — 4 of 4 increments in order, 3 of 3 deferred follow-ups closed.** The model of an arc was right and is now the engine's own. **One locked encoding was wrong the day it was written** and was replaced 6 d 22 h later; see §7.

---

## Abstract

§EDITOR-01 builds one quest per form submission. An *arc* — an ordered chain of quests where step *k* opens because step *k−1* closed — had no authoring surface at all: you filled the single-quest form N times and hand-maintained the flag plumbing between the steps. This report locked a Mission Builder tab for `edit.html`: an in-memory `arcDraft`, a **pure** `buildArcQuests(draft) → questObj[]` compiler that generates the inter-step flags, a Preview Chain that renders the resolved arc *before* anything is written, and a POST All that walks the existing single-quest create path one step at a time.

Every structural claim in this report holds. The compiler, the preview, the sequential post, the stop-on-first-error and the already-posted skip all shipped and are green ten weeks on. The failure is narrow and instructive: the report locked the wiring *encoding* as an arrow-function source string `(s) => s.<flag>`, defended that choice in its risk register, and specified a test to enforce it. The engine calls `q.activateCond()` with **no argument**. The form was inert, the test asserted the defect, and three independent mechanisms in the same toolchain — the server's own serializer, the engine's several hundred hand-authored conditions, and the flag-index regex that defines what "reads a flag" *means* — each already encoded the right answer.

---

## 1. Intent, inspiration, and what it buys the player

**The inspiration is serial storytelling.** A single quest is an errand. An arc is a story: the kindergarten corridor chain, the Watchmaker's tomes, Yael's five acts. What makes an arc feel authored rather than assembled is that step 3 *knows* step 2 happened — the world remembers, and the next door opens because you opened the last one.

**Mechanically that memory is one thing only: a flag written by one quest and read by the next.** So the arc is not a container the engine understands; it is a property of correct wiring. And correct wiring was, before this tab, entirely manual: the author typed `quest_yael_1`, `_2`, `_3`, invented a flag name, wrote it in one quest, re-typed it in the next, and got no feedback if the two spellings diverged. A single mistyped flag produces a chain that never advances — and the failure is *silent*, because a quest that never activates looks exactly like a quest the player hasn't reached yet.

**What the tool adds to playability, stated as the delta an author feels:**

- **Content that would not otherwise be made.** Anything the authoring surface cannot express cheaply does not get written. Arcs were expensive; one-shot errands were cheap; the world drifted toward errands.
- **The chain is visible before it exists.** Preview Chain renders the compiled steps with `↓ reads <flag>` connectors and a per-step validation badge, and a red badge disables POST All. The whole-arc view previously existed only *after* posting all steps.
- **A partial arc is recoverable.** POST All stops at the first error and skips ids already present, so a failed run resumes instead of dying on "already exists." Before, step 3 of 5 failing left a half-built arc in the file and no clean way forward.
- **Flag namespacing removes the commonest silent bug.** Auto flags are `<arcId>_<n>_passed` / `<arcId>_<n>_done`, derived from the id the author already typed.

**Measured at HEAD:** the game holds **2,853 quests**, of which **1,624** carry a declarative `gate`, and **35** multi-step arcs — **24 of the 35 chain through `gate.flags`**, which is precisely the mechanism this report modelled. The §KG corridor chain is the clean example: `quest_kg_01` has `gate:{}`, `quest_kg_02` has `gate:{"flags":["kgEnlisted"]}`, `quest_kg_03` has `gate:{"flags":["kgManifestDelivered"]}` — step 1 open, every later step gated on its predecessor's flag. **That is the shape `buildArcQuests` emits today.** The report's model of an arc became the engine's model of an arc.

**The honest counterweight, and it belongs in the same paragraph.** No arc in the shipped game was authored *through* this tab. At HEAD, `arc:` occurs **0 times** in the quest database and no quest carries an auto-generated `_<n>_passed` / `_<n>_done` producer flag — the live arcs were hand-authored or API-imported with hand-chosen flag names. The tool's realised value so far is prospective (the surface exists and is tested) plus one large second-order win: **being the first consumer that needed a compiled quest to survive a POST is what exposed that the server was silently dropping every structured field on write** (§8).

---

## 2. Method

Verification ran read-only. `play.html` was not modified.

1. **Reference build.** The design lock's parent, `6515592` — `edit.html` 9,962 lines, `wbapi-core.js` 1,325 lines. ⚠ `wbapi-core.js`, `wbapi-server.js` and `wbapi-cli.js` were at the **repo root** on that date; the `src/js/` prefix arrived later, so this report's unprefixed paths are correct for their day.
2. **Every line citation resolved at the reference build**, not at HEAD (§5).
3. **`git log -S` with no pathspec** on each named symbol, to separate *retired* from *never shipped*.
4. **The report's own acceptance test was run**, not merely cited (§11).
5. **Census through the parser**, not a line regex — `wbapi-core`'s quest reader over HEAD.
6. **Corpus grep for every wrong claim**, to measure blast radius rather than the error (§13).

**One methodological note about this file specifically.** Its mtime (22:10:21) is **18 minutes after its own ship commit** and **2 minutes before** inc2. `git diff bc73932 HEAD` on this path shows exactly one hunk: §4's producer-flag bullet, rewritten during implementation to add the consumption-gating refinement. *The report was amended by the increment it authorised* — which is good practice and worth naming, because it means the committed design lock and the file on disk are two different documents, and only a diff tells you which claim was the prediction and which was the correction.

---

## 3. The thesis, re-measured

> There is **no dedicated "arc" runtime object** — an arc is an emergent property of correctly-wired flags. Mission Builder's whole job is to generate those flags correctly.

**HOLDS, and more strongly than the report knew.** At HEAD there is no `QUEST_ARCS`, no `ARC_DB`, no arc structure of any kind; the six matches for `arcs` in the engine are prose about will-o'-wisps and a Warmth Eel. Grouping is derived on demand from the id convention (`src/js/wbapi-core.js:arcs() { return Object.keys(WBAPI._questArcs); }@1096`), and chaining is derived from flag reads versus writes. Not only is there no arc object — the `q.arc` *display* field the compiler sets on every step is carried by **0 of 2,853** quests.

The corollary the report drew from this is the reason the whole design is sound: if an arc is only its wiring, then a tool that generates the wiring correctly *is* an arc builder, and no engine change is needed. That reasoning was correct.

---

## 4. Design as locked (Inc 1)

The tab holds an **arc draft** — a header plus an ordered `steps[]`. **Build Chain** compiles it, **Preview Chain** renders it, **POST All** creates it.

```
arcDraft = { arcId, arcLabel, activateNode, steps:[Step] }
Step     = { type, title, desc, itemChain, activateNode?,
             gateMode:'auto'|'manual'|'none', … type-specific fields }
```

Compile rules as locked: `id = <arcId>_<n>` (1-based) · `arc = arcLabel` · producer flag = `checkPassFlag` (auto `<arcId>_<n>_passed`) for a skill_check, else `<arcId>_<n>_done` materialised as a `grantBit` appended to that step's `itemChain` · `gateMode:'auto'` gates step *k* on step *k−1*'s producer flag, `'manual'` passes the author's own condition through, `'none'` emits nothing. The compile is **pure** — no I/O — so it is headlessly testable and drives both Preview and POST.

**Amended during inc2:** the non-skill `grantBit` is appended **only when a downstream auto-gated step actually consumes it**, so a trailing step gets no stray mission-bit token. This refinement shipped and is asserted by a dedicated test.

---

## 5. As-built inventory

**All 12 line citations in the original resolved at the reference build**, which ties the corpus best for a report with no anchors of its own:

| Cited | Reference build `6515592` | |
|---|---|---|
| `wbapi-core.js:588` | `const arc = id.replace(/_\d+$/, '')…` — arc-prefix strip | ✓ exact |
| `wbapi-core.js:727` | `chain(id) {` | ✓ exact |
| `wbapi-core.js:1195` | the bare-identifier `matchAll` scan in the save guard | ✓ exact |
| `edit.html:146` | `.chain-link{…}` | ✓ exact |
| `edit.html:1653` | the same arc-prefix strip, browser copy | ✓ exact |
| `edit.html:1969` | `if (q.type === 'skill_check' && !q.checkPassFlag)` | ✓ exact; message quoted verbatim from :1970 |
| `edit.html:1996` | `async create(questObj) {` | ✓ exact |
| `edit.html:2002` | the `already exists` guard | ✓ exact |
| `edit.html:2301` | `if (q.checkPassFlag && !allWrittenFlags.has(…))` | ✓ exact; message **paraphrased**, actual text is `flag "X" is never written by any quest` |
| `edit.html:9094` | the item-chain grammar comment block | ~ **section-accurate, not symbol-exact** — `parseItemChainText` is at :9100, the window bridge at :9143 |
| `edit.html:9146` | `function edBuildQuestObj() {` | ✓ exact |
| `edit.html:9395` | `WBAPI._buildIndexes(); renderQuestList();` | ✓ exact |

**Live surface at HEAD** (anchors resolve now):

- Compiler — `edit.html:function buildArcQuests(arcDraft) {@8781`, bridged at `edit.html:window.buildArcQuests = buildArcQuests;@8865`
- Helpers — `edit.html:function edArcProducerFlag(step, i, arcId) {@8764` · `edit.html:function edArcEffectiveGate(step, i) {@8769` · `edit.html:function edArcGateIndex(step, i) {@8776`
- Chain wiring, current encoding — `edit.html:q.gate = { flags: [edArcProducerFlag(steps[p], p, arcId)] };@8813`
- Consumption-gated producer bit — `edit.html:const consumed = steps.some((nx, k) => k > i@8854`
- Draft collection — `edit.html:function mbCollectDraft() {@9331`
- Preview validation — `edit.html:const adv = WBAPI.loaded ? WBAPI.quests.advise(q)@9367`
- Red badge disables POST — `edit.html:MB('mb-post').disabled = anyError || !WBAPI.loaded;@9385`
- POST All — `edit.html:async function mbPostAll() {@9401`

---

## 6. Spec → shipped delta table

| § | Locked | At HEAD | Verdict |
|---|---|---|---|
| 3 | `arcDraft = {arcId, arcLabel, activateNode, steps[]}` | identical, documented verbatim in the compiler header | **SHIPPED** |
| 3 | `Step` fields incl. `onPass`/`onFail`/`completeFn` | those three **never exposed**; the UI never had them | **NOT SHIPPED** (deliberate — dropped from the draft schema at W8b) |
| 3 | `targetMonsterKeys` authored | **derived** from `killGoals`, not typed | **CHANGED — improvement** |
| 3 | — | `hint`, `checkPassFlag` override, `gateAfter` added | **ADDED** |
| 4 | `id = <arcId>_<n>`, `arc = arcLabel` | both emitted | **SHIPPED** |
| 4 | producer flag `<arcId>_<n>_passed` / `_done` | `edit.html:function edArcProducerFlag(step, i, arcId) {@8764`, both forms | **SHIPPED** |
| 4 | `activateCond:(s)=>s.<flag>` arrow-source | **`gate:{flags:[…]}`** | **SUPERSEDED — was inert when written (§7)** |
| 4 | producer `grantBit` unconditional → *(amended)* consumption-gated | consumption-gated, `@8814` | **SHIPPED as amended** |
| 4 | per-step `itemChain` via the shared codec | unchanged | **SHIPPED** |
| 5 | `.chain-link` rows + `↓ reads` connector + `advise` badge; red badge disables POST | all four, `@9327` / `@9345` | **SHIPPED** |
| 6 | sequential create, stop-on-first-error | `edit.html:async function mbPostAll() {@9401`; each create re-indexes so later `advise()` sees earlier steps | **SHIPPED, exceeded** |
| 7 | engine untouched | untouched | **HOLDS** |
| 7 | `wbapi-core.js` untouched | untouched | **HOLDS** |
| 7 | **server untouched** | true as written; **insufficient** — six compiler outputs had no persistence path (§8) | **HOLDS literally, FAILS in effect** |
| 8 | partial POST → already-posted skip | `⊘ skipped (already exists)`, re-runs resume | **SHIPPED** |
| 10 | Inc 2 compiler → Inc 3 tab → Inc 4 POST All | all three, in order | **SHIPPED** |
| 10 | FU: branching, drag-reorder, whole-arc UQF export | `0449472` · `96c4258` · `11af1e5` | **ALL THREE CLOSED** |

**Timeline.** Lock 21:51:55 → compiler **+20 m** → tab UI **+28 m** → core closed next morning **+8 h 43 m**. Both step-level follow-ups closed **+23 h 05 m**; the whole-arc UQF export **+6 d 23 h 06 m**. Four increments, no abandonment, no scope drift.

---

## 7. The headline: a locked encoding that was inert on day one

§4 locked, §8 defended, and §9 specified a test for this string:

> Step *k* gets `activateCond: (s) => s.<prevflag>` — emitted as a real arrow-function source string (the Audit guard at `wbapi-core.js:1195` rejects bare-identifier activateConds, so we MUST emit `(s)=>s.flag`, never the bare name).

It shipped at `edit.html:9196` in `e2dcd76`, and the spec asserted it: `expect(q.activateCond).toMatch(/^\(s\)\s*=>\s*s\./)`. **The test was written to enforce the defect.**

**The engine calls the condition with no argument.** At the reference build, `play.html:25845` reads `if (q.activateCond && !q.activateCond()) return;` — and at HEAD the same line is `if (q.activateCond && !q.activateCond()) return;@30155`, with a second, later call site that at least catches: `ok = q.activateCond(); } catch (e) { ok = false; }@37137`. So `s` is `undefined` and `s.<flag>` is a `TypeError` — thrown, at the reference build, inside the quest sweep with no `try`.

**Three mechanisms in the same toolchain already held the right answer.**

1. **The server's serializer does the conversion for you.** `src/js/wbapi-server.js:const isBareIdent = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(v);@1724` — a plain flag name posted to `/api/quest` is written into the file as `() => !!S_story.<flag>`; anything containing JS syntax passes through **verbatim**. The bare identifier §8 calls forbidden is exactly the required *input*, and the arrow form §8 mandates is exactly what escapes conversion. The server's own CLI help had spelled the recipe out: *`Act 2+: add "activateCond":"stnAct1Done" (prev act checkPassFlag — serialized as () => !!S_story.stnAct1Done)`*.
2. **Every authored condition in the game disagreed.** The reference build's quest database is wall-to-wall `activateCond:() => !!S_story.someFlag` — zero-arg, closing over the global. `activateCond:(s)` has **0** occurrences at HEAD and **0 commits ever** in `play.html`. The counterexamples numbered in the hundreds and sat in the file the report was written against.
3. **The flag index cannot see `s.`** `_questFlags` derives reads and writes by matching `/S_story\.(\w+)/` over each quest's source text. `(s)=>s.quest_yael_1_passed` contains no `S_story.`, so its `reads` set is **empty** — meaning `WBAPI.quests.chain(id)`, the very derivation §2 names as the definition of an arc, would report **no upstream and no downstream** for a chain this compiler built. Preview Chain would draw the `↓ reads <flag>` connector from the compiler's own knowledge and be the only surface in the system that believed the arc existed.

**The mistake underneath is a layer confusion, and it is worth naming precisely.** The guard at `wbapi-core.js:1195` scans `_rawSrc` — the *file already written*. A bare identifier is illegal **there**. The report read a rule about the serializer's *output* and applied it to the serializer's *input*. Satisfying a guard is not the same as being correct; a guard proves only that you avoided the thing the guard was built to catch.

**Severity: real, latent, and never triggered.** `git log -S '(s)=>s.'` on `play.html` returns **no commits, ever**. No arc was authored through the tab into the shipped game before §ARCH-01 Wave 8b (`11af1e5`, 2026-07-03) replaced the emission with `gate:{flags:[…]}`. The dead form was live in the compiler for **6 d 22 h 46 m** and cost the player nothing — caught by a migration rather than by use, which is luck, not process.

*What survives is the design.* Auto-numbered ids, a producer flag per step, gates that read the predecessor's flag, a pure compiler: every one of those is how the tool works today. Only the seven characters between the flag name and the gate were wrong.

---

## 8. The unmeasured path — §7's "no server change" was true and insufficient

The report checked `POST /api/quest` and correctly reported that the route existed and needed no change. It did not check **what the route persists**. At the reference build, `serializeQuestLiteral` wrote a fixed field list: `STR` (17 text fields), `NUM` (4), `BOOL` (1), `FN` (4). Absent from all four lists: **`arc`, `itemChain`, `killGoals`, `targetMonsterKeys`** — and later `gate`, `bits`, `completion`.

`arc` appeared in the reference server only as a query-string *filter*, never as a stored field. So every step this compiler produced would have been written to the file having silently lost its arc label and its entire item chain — the `grantBit` producer flag among them, which is to say **the non-skill chaining mechanism §4 depends on would have evaporated on write.**

The fix landed at W8b: `src/js/wbapi-server.js:const JSONF@1710` now serialises `gate` · `bits` · `completion` · `itemChain` · `targetMonsterKeys` · `killGoals`, and `arc` and `checkSkill` joined the `STR` list. The commit records it plainly — *"all silently dropped before — API-posted UQF quests arrived stripped dead."*

This is the second consecutive report in the §DOC-02 series to be bitten in the same place: §EDITOR-01-D's `itemChain` was dropped by the same POST path for the same seven days. **The lesson generalises: "no change required" is a claim about a path you must therefore measure end to end.** A route that accepts your request and returns 200 has not agreed to remember your fields.

---

## 9. A defect in the convention §1 cites

§1 grounds the id convention on the arc-prefix strip at `wbapi-core.js:588` / `edit.html:1653`, which is still live at `src/js/wbapi-core.js:.replace(/_[a-z]{2}$/, '')@804` and `edit.html:.replace(/_[a-z]{2}$/, '')@1742`:

```js
const arc = id.replace(/_\d+$/, '').replace(/_[a-z]{2}$/, '');
```

The second strip runs on the result of the first. `quest_kg_01` → `quest_kg` → **`quest`**. Any arc whose prefix ends in a two-letter token collapses into a single bucket named `quest`.

**Measured at HEAD: 10 distinct arcs — 35 quests — merged into one bucket** (`_ng` 3 · `_wm` 5 · `_va` 4 · `_tl` 3 · `_ca` 1 · `_sb` 1 · `_df` 2 · `_sk` 2 · `_vs` 3 · `_kg` 11 — the §KG corridor chain included). And the second strip has **zero legitimate targets**: **0** quest ids end in `_xx` directly, so all 35 of its firings are wrong and none is right.

Five live readers consume the grouping, including a "top arcs by size" panel that sorts descending — so the largest "arc" in the authoring tool is a bucket that is not an arc. The doc comment beside the code (`// arcPrefix → [questId] e.g. 'quest_wis' → [...]`) picks the one example whose three-letter suffix happens to survive.

Filed as **§DX-02cf**. Authoring-tool only; the engine never reads `_questArcs`.

---

## 10. Risk register — outcome (3 of 4)

| § | Risk as filed | Outcome |
|---|---|---|
| 8 | Bare-identifier activateCond is save-aborting; the compiler MUST emit the arrow form | ✗ **INVERTED.** The guard is real; the conclusion is backwards — the bare name is the correct POST input and the arrow form is the inert one (§7) |
| 8 | Flag collisions across arcs, namespaced by `arcId` | ✓ holds — `edit.html:function edArcProducerFlag(step, i, arcId) {@8764` namespaces every flag; a shared `arcId` collides ids first and `create` rejects it |
| 8 | Partial POST leaves steps 1..k−1 written | ✓ holds, and the mitigation shipped: `⊘ skipped (already exists)`, so a re-run resumes |
| 8 | Out of scope → §EDITOR-02-FU: branching, drag-reorder, whole-arc UQF export | ✓ all three closed (`0449472` · `96c4258` · `11af1e5`) |

The one that failed is the one the author was most confident about, and it failed **inward** — the risk register looked outward at collisions and partial writes while the defect sat in the sentence directly above it. *A risk you have already reasoned your way past is the one you stop measuring.*

---

## 11. Test plan — outcome

`npm run` → `npx playwright test src/tests/integration/worldbuilder-mission-builder.test.js` — **16/16 passed (5.7 s)** on 2026-08-17, ten weeks after the lock.

| § | Planned | Outcome |
|---|---|---|
| 9.1 | 3-step arc: seq ids + arrow-fn `activateCond` on steps 2/3 | ids ✓; the arrow assertion **retired** — the test now asserts `gate.flags` + UQF bits |
| 9.2 | mixed arc: side step gets `grantBit`, next reads `_2_done` | ✓ |
| 9.3 | `gateMode` `'none'`/`'manual'` pass-through | ✓ |
| 9.4 | Preview disables POST All on an `advise` error | ✓ `@9345` |
| 9.5 | Playwright: 2-step arc → Build → 2 `.chain-link` rows + connector | ✓ |
| 9.6 | POST All stop-on-first-error + already-posted skip | ✓ |
| — | *(added)* trailing step gets no stray `grantBit` · `completion.atNode` arrival beat · WIS 12 defaults · branching `gateAfter` ×2 · reorder · empty/malformed draft no-throw | ✓ 10 further checks |

The spec grew 6 → 16 and, unlike the prose, **it was corrected**: line 17 of the file now carries the tombstone — *"'(s)=>s.flag' strings were dead/crashing at runtime: storyCheckQuests…"*.

---

## 12. Findings filed

**§DX-02cf** 🟢 **NEW** — `_questArcs`' second suffix strip merges 10 arcs / 35 quests into one bucket and has 0 legitimate targets. Delete `.replace(/_[a-z]{2}$/, '')` at `src/js/wbapi-core.js:804` and `edit.html:1702`; both copies must move together.

**§DX-02cg** 🟢 **NEW** — three `plan-archive.md` rows (`:67`, `:103`, `:125`) still teach the dead `activateCond:(s)=>s.<prev flag>` as the locked design, complete with the inverted rationale *"MUST emit arrow-fn source, never bare ident."* Three younger sources carry the correction (`plan-archive.md:483` · `:498` · `lab-report-uqf-migration-playbook.md:107`). The four sites in **this** file were corrected in this pass.

That split — **older prose asserts, newer prose corrects, and nothing reconciles them** — is the same shape found in the immediately preceding increment, where four documents still recorded a branch count that a gate had asserted otherwise for six weeks. *Machines back-propagate; prose has to be pushed.* Here the correction reached the compiler, its comment and its test, and stopped at the edge of the archive.

**Not filed, recorded here:** the `edit.html:9094` pointer is section-accurate rather than symbol-exact, and §1's quotation of the audit message at `:2301` is a paraphrase. Neither misleads.

---

## 13. Verification record

- **Reference build** `6515592` — `edit.html` 9,962 lines, `wbapi-core.js` 1,325 lines, both at the repo root.
- **Citations** 12 of 12 resolve; 11 symbol-exact, 1 section-accurate.
- **Census at HEAD, through the parser:** 2,853 quests · 1,624 with a `gate` · 35 multi-step arcs · 24 chaining on `gate.flags` · 44 surviving `activateCond` · **0** carrying `arc` · **0** carrying an auto producer flag.
- **Negatives, checked with `git log -S` and no pathspec:** `activateCond:(s)` — 0 commits ever · `(s)=>s.` in the engine — 0 commits ever.
- **Acceptance test run:** mission-builder spec **16/16**.
- **`play.html` untouched** — every measurement read-only.

---

*The design was right, the encoding was inert, and the engine had been quietly demonstrating the correct form several hundred times in the same file the whole while. Nothing in this report needed to be discovered — only read.*
