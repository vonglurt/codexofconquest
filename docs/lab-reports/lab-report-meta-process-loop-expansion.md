<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — The Meta Process: Prompt-Loop Expansion and Design Iteration

**Original:** CodexOfConquest.com design session, 2026-05-26 · **Verified against HEAD:** 2026-08-12 (§DOC-02x)
**Own commit:** `8abc606` (2026-05-26 19:57) — 19,378 lines · HEAD 38,712
**Classification:** Design methodology / process engineering
**License:** MIT — CodexOfConquest.com — Copyright (c) 2026

---

## Abstract

This is the second report in the corpus whose subject is the **repository rather than the game** (after
`lab-report-documentation-system-design.md`, §DOC-02i). It describes the prompt → expansion → lab-report
→ integration pipeline as a *recursive list-unrolling loop* driven at human pace — one "continue," one
level of descent — documents ten instances of that loop in the 2026-05 design history, and closes with
ten recommendations for future sessions.

Verification finds something no other report in the program has produced: **it is the traceable ancestor
of the repository's current operating manual.** Six of its ten recommendations are binding rules in
`CONTRIBUTING.md` and `prompt.md` seventy-eight days later — including the one sentence that governs the
increment now rewriting it. Its factual claims hold at a high rate (18 of 20 identifiers, 6 of 6 lab-report
filenames, all three SP4 counts exact **at its own commit**), and its errors cluster where the program has
learned to expect them: node codes, a status block, and one recommendation the document itself refutes
nine lines later.

Its one measurable failure is also its most useful: recommendation 8 asserts a bijection between
`quest.md` and `QUEST_DB`. That bijection is now **5.2 % true**.

---

## I. Intent, Inspiration, and What It Buys the Player

### A. The problem it was written against

A single-file game grown by conversation has one characteristic failure: the specification races ahead of
the implementation, field names drift between the two, and by the time anyone builds the thing, the
document describing it is fiction. The author names the mechanism precisely — the prompt history is a
**shift register**, and every new input pushes an earlier decision one place closer to the overflow
boundary. When it overflows you do not get an error; you get a confident, wrong memory.

### B. The design goal

Decide, once, *what belongs where*: **decisions in the plan, reasoning in lab reports, and only current
working state in the register.** Then put a gate between speculation and commitment — the lab report —
so that no HTML edit begins until the data shapes are frozen in a file that survives the overflow.

### C. Why "one continue, one level"

The loop resembles an AST expansion: parse a token into a tree, traverse depth-first, expand each leaf
before continuing. The distinguishing feature the author identifies is that **the traversal is
human-paced.** The user says "continue"; the assistant descends exactly one level. This is not a
politeness convention — it is the mechanism that keeps the specification and the user's mental model at
the same depth, so that neither has to be reconciled to the other later.

### D. What it adds to the game

The process is not a feature a player can see, and it would be dishonest to pretend otherwise. Its
contribution is measurable at one remove, and it is large:

1. **Arcs ship with their data shapes intact.** The lab-report gate is why §CROWN-01's nine-node swamp
   arc could be measured at ~600 transcribed facts with **zero** transcription errors (§DOC-02h), and why
   §SIREN-01's five quests survived a total format migration **25 of 25 fields byte-exact** (§DOC-02u). A
   game with 2,853 quests that mostly agree with their own documentation is what this gate buys.
2. **The world is finishable rather than merely large.** "One increment per continue" is the reason the
   repository holds 416 nodes and 8 acts instead of forty half-built systems. Depth on one row beats
   breadth across four, because only a *finished* row survives a context switch.
3. **A cold session can pick the work up.** Every hand-off contract in the repo — the §RESUME log, the
   memory files, the numbered next steps — descends from §3.3 of this document.

> **And the honest limit, which is the most useful sentence this report can offer the project today.**
> The gate verifies that **what was specced got written**. Nothing in the loop verifies that **what was
> written can be reached.** Every large casualty the §DOC-02 program has measured — §AUDIT-03x's 774
> unreachable quests, §CROWN-01's 24 of 34, §DOC-02r's 28 of 51, §SIREN-01's 6 of 6 nodes and 5 of 5
> quests — passed this loop cleanly, because a symbol census and a data-shape freeze are both blind to
> cell primacy and gate-flag closure. *The pipeline was designed to stop the spec racing ahead of the
> code. It has no instrument for the code racing ahead of the world.*

---

## II. Method

Instruments from the §DOC-02 program applied here:

- **11 — a report about a CORPUS can only be judged at the size the corpus was.** Measurements are taken
  at `8abc606`, the report's own commit, not only at HEAD. This is what vindicated its `// → doc:` count.
- **4 / 8** — `git log -S` on every dead symbol, to separate RETIRED from NEVER SHIPPED.
- **12 / 15** — score copied passages apart from composed ones.
- **14** — check a census regex against a gate that already counts the same set. Fired twice this pass
  (see §V-C), both times on this author's side of the ledger.
- **A recommendation register**, per §DOC-02i — the highest-value section for any report ending in
  recommendations.

---

## III. As-Built Inventory

**Live under the specified name (18 of 20 identifiers, 90 %)**

`const ROMANCE_QUOTES = [@22380` (21 entries) · `const NPC_ROMANCE_PREAMBLES = {@27481` ·
`const NPC_ROMANCE_VIGNETTES = {@27491` · `const NPC_NG_MEMORY_LINES = {@27326` ·
`function _mkSection(id, icon, label) {@35303` · `_mkCard` · `_rollCeremonia` ·
`battleDis: 0,@23021` · `hoursElapsed: 0, hoursSinceSlept: 0,@23092` · `skillCheckAttempts: {},@23150` ·
`romanceQuotesDelivered: [], npcRomanceVignetteDelivered: {},@23099` · `ngMemoryDelivered` ·
`priorQuestMinusOne` · `ngPlusRun` · `nexusQ01` · `nexusQ02` · `VOID_TIDE_EVENTS` · `storyConfirmSleep`.

**Dead (2)**

| Symbol | Verdict | Evidence |
|---|---|---|
| `storyQuestHunt(id, forceKey)` | **RETIRED — correct when written** | born `e594848` (2026-05-25, the day before), deleted `7952752` §TIMELESS-01 |
| `the_cat_king` | **NEVER SHIPPED** | **0 commits ever**; the monster shipped as `cat_king:         { key:'cat_king',@5404` |

**Monster keys — 8 of 9 exact.** `stray_alley_cat` · `fluffy_cat` · `beefy_tom` · `honcho_cat_m` ·
`honcho_cat_f` · `taz_devil` · `fat_merchant_cat` · `corrupted_cat` all live; only the Cat-King carries a
spurious `the_` prefix the file has never held.

**Node codes — 0 of 6 resolve.** `CQ`→`CDG` · `CY`→`HKG` · `SW`→`MSY` · `CO`→`TLS` · `FR`→`AMS` ·
`MM`→`LIM:{ num:81, code:'LIM', name:'mimic_meadow'@8815`. The corpus rule applies: *a node code in a
design doc is a citation, not an identifier.* **But two of the six are invisible to the gate that exists
to annotate them** — see §V-D.

**Documents — 6 of 6 named lab reports exist.** `la-riva-grief-arc` · `kenickie-chronicle` ·
`sp4-documentation-sync-pass` · `ng-plus-remembrance` · `ceremonia-roll-skill-checks` ·
`dungeon-ten-themes`. Recommendation 2's *"no orphaned lab reports"* verified at 6 of 6 then and
**107 of 107 filenames** now.

**Dead cross-references (6).** `plan.md §I`, `§0`, `§DESIGN-03-G`, `§DUNGEON-01-G`, `§DUNGEON-02` — the
file was split into `CONTRIBUTING.md` + `BACKLOG.md` at `5e48dd7`. Same fate as §DOC-02i's subject; the
content migrated to `plan-archive.md`, which `quest.md` correctly points at.

---

## IV. Spec → Shipped Delta Table

| # | Claim | Measured at HEAD (or as noted) | Verdict |
|---|---|---|---|
| 1 | SP4: "94 consts annotated with `// → doc:`" | **94 at `8abc606`**; 93 at HEAD | ✅ **EXACT at its own commit** |
| 2 | SP4: "20 stale PLANNED markers" | exact — `9684ff6`'s own message | ✅ EXACT |
| 3 | SP4: "5 mismatched `// → doc:` targets" | exact — `ded062e`'s own message | ✅ EXACT |
| 4 | `ROMANCE_QUOTES`, 21 entries, "15 % per sleep, Act III+" | `Math.random() < 0.15`, `actNumber >= 3`, and the engine comment **byte-identical** | ✅ EXACT |
| 5 | §DESIGN-02 P3 fixed `battleDis` never applying | live at `// P3 exhaustion: battleDis charges@25047`, still naming P3 | ✅ SHIPPED |
| 6 | 5 section types: LOCATION / ENCOUNTER / STALK / SOCIAL / VENDOR | **1 of 5 names survives** (`Encounter`); 9 sections at HEAD; STALK deleted by §TIMELESS-01; SOCIAL + VENDOR re-expressed as `NODE_HOOKS`/`NODE_VERBS` (§VM-01-G) | ⚠️ EXPANDED + RENAMED |
| 7 | `storyRenderSections()` | survives **only inside an HTML comment**, `<!-- storyRenderSections() writes .story-section divs here -->@4278`; 1 commit ever | ❌ DEAD POINTER |
| 8 | Instance 6 §DESIGN-03 — "Integration: **PLANNED**" | 9 skill-check quests specified → **2,634 `skill_check` bits** live | ❌ **STALE — SHIPPED** |
| 9 | Instance 7 §DUNGEON-01 — "Integration: **PLANNED**" | both P3+ nodes live (`SZG` 80, `LIM` 81); 26/26 state fields (§DOC-02k) | ❌ **STALE — SHIPPED** |
| 10 | Instance 8 §DUNGEON-02 — "Integration: **PLANNED**" | **40 of 50** five-act ids live (8 of 10 chains) | ❌ **STALE — SHIPPED** |
| 11 | Instance 1 §GR — "all flags, NPC keys, quest IDs appear verbatim in HTML" | confirmed independently by §DOC-02s: **43 of 46 identifiers, every quoted string verbatim** | ✅ EXACT |
| 12 | Instance 10 §XV — `ngMemoryDelivered[key]`, `priorQuestMinusOne`, `ngPlusRun ≥ 1` | all three live | ✅ EXACT |
| 13 | Rec. 2 — lab-report naming convention | **107 of 107 files comply**; adopted verbatim into CONTRIBUTING's Lab Report Policy | ✅ **ADOPTED** |
| 14 | Rec. 8 — "`quest.md` … canonical source of truth for quest IDs" | **148 of 2,853 (5.2 %)** | 🔴 SEE §V-A |
| 15 | Rec. 6 — parallel expansion, "expand all N in a single pass" | **reversed**; contradicts §IV and rec. 9 | 🔴 SEE §V-B |
| 16 | Rec. 9 — the "continue" discipline | `prompt.md` §0: *"Work is one increment per 'continue.'"* | ✅ **ADOPTED VERBATIM** |
| 17 | Rec. 10 — anti-scope-creep gate | CONTRIBUTING § Lab Report Policy trigger table | ✅ **ADOPTED** |
| 18 | Rec. 5 — memory file after every session | `MEMORY.md` + `project_*.md`; `prompt.md` §2 step 10 | ✅ **ADOPTED** |
| 19 | Rec. 4 — compress rationale to a summary + a table | **the §DOC-02 program's own rewrite spec**, 78 days later | ✅ **ADOPTED** |
| 20 | Rec. 7 item 5 — `// → doc:` annotation per new const | superseded by §DX-01e `symbol@line` anchors; the doc half had **0 commits ever** (§DOC-02i) | ⚠️ SUPERSEDED |
| 21 | Rec. 1 — template-first, and Rec. 3 — state-field freeze | *"template"* and *"freeze"* have **0 occurrences** in CONTRIBUTING.md and prompt.md | ⚠️ NOT ADOPTED (kept) |

---

## V. Findings

### A. The one bijection it asserts is 5.2 % true — §DX-02ad

Recommendation 8: *"`quest.md` … Keep it current: every new quest added to HTML should have a
corresponding entry. The register is the canonical source of truth for quest IDs, locations, and act
structure."* The document itself opens by claiming the scope out loud: *"Location-organized register of
**all quests** — implemented, planned, and specced."*

Measured through the canonical `wbapi-core` parse — the same extractor `:1367` and every `check-*.js` use:

| Population | In `QUEST_DB` | Named in `quest.md` | Coverage |
|---|---|---|---|
| `quest_*` (hand-authored family) | 298 | 145 | **48.7 %** |
| 56 other id families (`ada` 235, `ath` 120, `lis` 95, `zth` 80, `blq` 60, …) | 2,555 | 3 | **0.1 %** |
| **Total** | **2,853** | **148** | **5.2 %** |

This is §DOC-02i's FC01 class in a second subject: a bijection that shipped, was declared canonical, and
quietly stopped being true — and recommendation 8 is where the claim was written down. The mechanism is
the same one §DOC-02i named: **a check that depends on a human running it reports green when nobody
ran it.**

**But the reverse direction is spotless, and that is why nobody has caught it.** Thirteen quest-shaped
tokens in `quest.md` fail to resolve in `QUEST_DB`; on inspection **not one is a dead row.** Ten are
deliberate annotations of the form `` `quest_d0207_a1–a5` *(design: quest_cy_madness_gate)* `` — the live
id first, the design-era name preserved beside it — which is recommendation 3's own deprecation-note
discipline actually practised, and the reason §DOC-02k could score §DUNGEON-01 rather than guess at it.
The remaining three are prose fragments.

> ***So the register is wrong only by omission and never by assertion. Everything it says is true;
> it says it about one quest in nineteen.*** That is the hardest kind of staleness to notice, because
> every spot-check passes. → **§DX-02ad**: `check:questindex`, a two-way `comm` over the parser's own
> key list — the cheapest possible gate, in the family §DOC-02i proposed for docs.

### B. The report refutes itself, and the repository picked the right half — a new instrument

§IV states the governing principle: *"the assistant expands exactly one item per continue. This is the
**human-paced depth-first traversal**: it prevents the assistant from racing ahead of the user's mental
model."* Recommendation 9 restates it as a rule. Recommendation 6, three items earlier, says the opposite:

> *"When expanding N items using a fixed template, write the template first, then expand all N items in
> a single pass (not N separate passes)."*

Both cannot be policy. The repository chose 9 and hardened it twice — `prompt.md` §0 (*"Work is one
increment per 'continue'"*) and §2 step 9 (*"Single agent, no fan-out… every step stays visible in the
main conversation"*). Recommendation 6's efficiency argument is real but it optimises the wrong quantity:
it saves assistant passes and spends user comprehension, which is exactly the cost §IV was written to
avoid.

> ***23rd instrument: a recommendation list is not a coherent object. Two adjacent items can contradict
> each other, and the tiebreak is the document's own stated THESIS — not its ordering, not its
> emphasis, and not which one sounds more efficient.*** Instrument 13 said a design doc's reversal is a
> claim like any other; this is its sibling — **a design doc's recommendation is a claim about the
> document it is attached to, and it can be wrong about that.**

### C. Two census errors, both mine — instrument 14, twice in one pass

A first extraction counted QUEST_DB by grepping `^  quest_` and returned **298**, against `npm run
stats`' **2,853**. The regex assumed one naming family; the file holds **57 id prefixes**, and
`quest_*` is 10 % of the population. Any coverage figure derived from the first number would have been
off by an order of magnitude *in the report's favour*.

A second scan flagged 13 `quest.md` rows as dead; ten were deliberate `*(design: …)*` annotations. Filing
that would have manufactured a defect out of the register's single best practice.

> ***Both errors point the same way: the instrument that catches them is comparing your count against a
> gate that already counts the same set, before deriving any delta from it. `npm run stats` and
> `check:dupkeys` exist for exactly this, and neither costs a minute.***

### D. `FR` and `MM` are both outside the LEGACY CODE MAP — §AUDIT-03q's blind spot, second and third instance

Four of this report's six node codes (`CQ`, `CY`, `SW`, `CO`) are in `docs/maps/node-index.md`'s LEGACY
CODE MAP and are therefore annotatable by `check:legacycodes`. **`FR` and `MM` have zero occurrences in
that file.** `FR` (Fishmonger's Row → `AMS`) was recorded by §DOC-02s; **`MM` (Mimic Meadows → `LIM`) is
new**, and this report is one of its citation sources.

The cause is structural and was stated when the gate was built: the map is generated from `maps.md`'s
historical legend, so a code the legend never listed is absent from the map, and a detector driven by the
map cannot see it. Two codes in one short report suggests the residue is larger than two.

### E. Two more unseeded rolls into persisted state — §DX-02m

Instance 4's romance layer delivers through `storyConfirmSleep`, and both of its branches draw the
**unseeded** stream while writing `_S_DEFAULTS()` fields:
`romanceQuotesDelivered: [], npcRomanceVignetteDelivered: {},@23099`, written at
`Math.random() < 0.15` and at
`S_story.npcRomanceVignetteDelivered = { ..._vDelivered, [_vKey]: true };@36333`. Same shape as §DOC-02m's
fishing cluster and §DOC-02n's death saves: **the UQF quest path is seeded and every hand-authored
surface that rolls its own dice is not.** Cosmetic in effect — a flavour line either appears or does not
— but it is persisted state, so a seeded replay diverges.

### F. What held, and where the errors sat

Everything **copied** is exact: three SP4 counts lifted from commit messages, the 15 %/Act-III romance
rule byte-identical to the engine comment, all four `_S_DEFAULTS()` field names, all six lab-report
filenames, eight of nine monster keys. Everything **narrated about status** is stale: three
"Integration: PLANNED" rows that had all shipped, five section names of which one survives, one dead
pointer left in the markup. Instrument 12 holds for the fourteenth consecutive report — and note *which*
narration failed. The author was accurate about the past (what happened in each of ten sessions) and
wrong about the future (what would happen to it). **A status block is a prediction wearing a
measurement's clothes.**

---

## VI. Recommendation Register

Ten recommendations, scored against `CONTRIBUTING.md` and `prompt.md` at HEAD. **This is the strongest
register the program has measured** — §DOC-02i's subject went 3 of 5, with two closed without shipping.

| # | Recommendation | Outcome after 78 days |
|---|---|---|
| 1 | Template-first for ≥ 5 instances | ⚠️ **NOT ADOPTED** — no such rule exists |
| 2 | `lab-report-<slug>.md`, no orphans | ✅ **ADOPTED VERBATIM** — CONTRIBUTING § Lab Report Policy; 107/107 comply |
| 3 | State-field freeze | ⚠️ **NOT POLICY — enforced by physics.** `_S_DEFAULTS()` fields persist to `localStorage`, so a rename breaks saves (§DOC-02u's `littorialComplete`, misspelling and all) |
| 4 | Compress rationale to a summary + a table | ✅ **ADOPTED AS A PROGRAM** — §DOC-02, user directive 2026-08-11 |
| 5 | Memory file after every session | ✅ **ADOPTED** — `MEMORY.md` + `project_*.md`; `prompt.md` §2 step 10 |
| 6 | Parallel expansion in a single pass | ❌ **DELIBERATELY REVERSED** — and the document argues against it (§V-B) |
| 7 | Integration-readiness checklist (5 items) | ⚠️ **PARTIAL** — `_S_DEFAULTS()` single-source is a rule; the `// → doc:` item was superseded by `symbol@line` anchors |
| 8 | `quest.md` as living register | ⚠️ **DOCUMENT ADOPTED, CLAIM 5.2 % TRUE** (§V-A) |
| 9 | The "continue" discipline | ✅ **ADOPTED VERBATIM** — `prompt.md` §0, and it governs this increment |
| 10 | Anti-scope-creep lab-report gate | ✅ **ADOPTED** — CONTRIBUTING's trigger table, one row per condition it named |

**Six adopted, one reversed, one superseded in part, two never taken up.**

---

## VII. Defects Filed

- **§DX-02ad (NEW, 🟢 no design call)** — `check:questindex`. `quest.md` claims to register *all* quests
  and names **148 of 2,853**; the 56 non-`quest_*` id families hold 2,555 entries of which 3 are named.
  Reverse direction is clean (0 dead rows). Gate shape: a two-way `comm` between `WBAPI` parser keys and
  the ids `quest.md` cites, with an explicit `NOT_A_QUEST_ID` list for the `*(design: …)*` aliases and an
  explicit **generated-family exemption list**, so the register is scored against the population it is
  actually meant to cover. The exemption must be written down rather than inferred — the §AUDIT-03j
  house rule, for the same reason: a percentage heuristic is blind to a family that is *entirely*
  generated.
- **§AUDIT-03q blind spot, +1 code (existing rows, extended)** — `MM` (Mimic Meadows → `LIM`) joins `FR`
  as a legacy code absent from `docs/maps/node-index.md`'s LEGACY CODE MAP, so `check:legacycodes` cannot
  annotate it. Two in one short report; the residue is worth a sweep of `plan-archive.md` for two-letter
  codes that resolve in neither registry.
- **§DX-02m (existing, +2 named instances)** — `romanceQuotesDelivered` and
  `npcRomanceVignetteDelivered` are `_S_DEFAULTS()` fields written from `Math.random()` inside
  `storyConfirmSleep`. Cosmetic in effect, persisted in fact.
- **§AUDIT-03s family (existing, +1)** — `<!-- storyRenderSections() writes .story-section divs here -->@4278`
  names a function with one commit ever and no definition at HEAD. Invisible to every gate:
  `check:noderegs` phase 6 is comment-aware *by design*, and `check:anchors` scans `.md` files, not
  markup. One-line fix, but the class is the point.
- **Explicitly NOT filed** — the thirteen unresolvable `quest.md` ids. Ten are deliberate design-name
  annotations and filing them would have penalised the register's best practice (§V-C).

---

## VIII. File References

| Anchor | Content |
|---|---|
| `const ROMANCE_QUOTES = [@22380` · `// ROMANCE_QUOTES: 15% per sleep, Act III+, no repeat@36314` | Instance 4, verbatim |
| `const NPC_ROMANCE_PREAMBLES = {@27481` · `const NPC_ROMANCE_VIGNETTES = {@27491` | the romance consts |
| `romanceQuotesDelivered: [], npcRomanceVignetteDelivered: {},@23099` · `S_story.npcRomanceVignetteDelivered = { ..._vDelivered, [_vKey]: true };@36333` | §DX-02m (§V-E) |
| `const NPC_NG_MEMORY_LINES = {@27326` | Instance 10 |
| `function _mkSection(id, icon, label) {@35303` · `<!-- storyRenderSections() writes .story-section divs here -->@4278` | Instance 3 — helper live, host a dead pointer |
| `battleDis: 0,@23021` · `// P3 exhaustion: battleDis charges@25047` | Instance 3's bug fix, still live |
| `hoursElapsed: 0, hoursSinceSlept: 0,@23092` · `skillCheckAttempts: {},@23150` | the two fields §3.1 names |
| `cat_king:         { key:'cat_king',@5404` | Instance 5 — the Cat-King, without the `the_` |
| `LIM:{ num:81, code:'LIM', name:'mimic_meadow'@8815` | `MM` resolved (§V-D) |
| `8abc606` · `9684ff6` · `ded062e` · `213d14b` · `7952752` · `5e48dd7` | own commit · SP4 · SP4 validation · §DESIGN-02 · §TIMELESS-01 · the `plan.md` split |

---

## IX. Conclusion, Re-Scored

The original conclusion reads: *"The improvement is not structural — the loop is correct — it is
disciplinary: freeze field names in lab reports, not in planning passes."*

Seventy-eight days of measurement say the first half is right and the second half aimed one system too
low. **The loop is correct and the discipline largely arrived** — six of ten recommendations are rules
now, and field-name drift turned out to be self-limiting, because `localStorage` refuses to forget a
field name once a save has held it. What the loop still cannot see is the thing that has cost this
project the most content: **a quest can be specced correctly, written correctly, migrated correctly, and
still be unreachable**, and no gate in the pipeline this report describes looks at reachability at all.

The next recommendation, in the document's own idiom, would be recommendation 11: *any expansion that
places content on a node must close over cell primacy and gate flags before the lab report is signed.*
That is §DX-02w, and it is open.

> *"The thing you build should be giveable. The process you use to build it should be documentable.
> This report is the documentation."* — the original, and it earned the sentence. This verification is
> the same claim run one loop further: **the process that documented the game is now itself under
> measurement, by a program this document recommended in item 4.** The register got audited by its own
> proposal. That is either very good engineering or a joke the repository is telling at its own expense,
> and after seventy-eight days it is difficult to tell the two apart.

---

**Filed:** 2026-05-26 · **Verified:** 2026-08-12
**Cross-references:** `CONTRIBUTING.md` § Lab Report Policy · `prompt.md` §0, §2 · `quest.md` ·
`plan-archive.md` §DESIGN-03 / §DUNGEON-01 / §DUNGEON-02 / §GR · `lab-report-documentation-system-design.md`

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
