<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — The roll2hit.com Documentation System

### Design, Purpose, and Synchronization Architecture — with a 2026-08-11 verification pass

**Original date:** 2026-05-24 (added at `59a9e0d`)
**Verified:** 2026-08-11 (§DOC-02i) against `roll2hit-v3.html` @ HEAD **and** against the archive build `32c10c5` (2026-05-24)
**Subject as written:** `plan.md` as master planning document; the repo's Markdown corpus
**Subject at HEAD:** `plan.md` no longer exists — split into `CONTRIBUTING.md` + `BACKLOG.md` at `5e48dd7` (2026-07-09)

---

## Abstract

This report argued that the roll2hit.com documentation corpus is itself software: it has a schema
(`index.md` as manifest), a source of truth (`roll2hit-v3.html`), a spec layer (`plan.md`), and a test
protocol (the sync pass). It specified a **two-way synchronization rule** — every doc item traces to the
HTML, every HTML item has a home doc — and proposed it as a bijection to be driven to closure by
successive sync passes.

The 2026-08-11 verification finds the **thesis intact and the instrument that was supposed to enforce it
broken**. Of the report's seven design constants, all seven were exact against the build it was written
against; six have since moved and one (`FROBERGER_JOURNAL`, 41 entries) has not moved in 79 days. Of its
five recommendations, three shipped, one shipped in one direction only, and one is closed by this pass.
The `_S_DEFAULTS()` contract survived at **104 of 107 fields** — the highest structural survival the
§DOC-02 program has measured.

The central finding is that **the bijection shipped and stopped being true.** `index.md`'s Doc Health
Badge — this report's own FC01 — reports `85` lab reports on disk when there are `107`, `36,933` HTML
lines when there are `38,712`, and marks every row `✅`. Its lab-report list is broken in both
directions: 26 files on disk are unindexed and 6 index rows name files deleted at `120d617`. The same
failure is visible on **day one**: the report cites "23 lab reports" because `index.md` said 23 while 22
existed on disk. *A bijection guarantees a link, not a truth* — demonstrated at HEAD by
`S29_AUROS_THEORY`, where the FC05 pointer resolves correctly to `world.md` and both ends name a state
field that has never existed.

---

## I. Method

Ten instruments, per the §DOC-02 house method:

1. Batch `grep -c` of every named symbol before reading the report body.
2. `git log -S "<symbol>" -- roll2hit-v3.html` on every symbol the census marks dead — separates
   **RETIRED** (shipped, later removed) from **NOT SHIPPED** (never existed under that name).
3. Archive read (`git show 32c10c5:roll2hit-v3.html`) — HEAD cannot adjudicate a claim about the past.
4. Sibling cross-check against `lab-report-architecture-full.md` (§DOC-02b) and
   `lab-report-birka-beginner-arc.md` (§DOC-02d).
5. Delta table run **both ways** — a specified behaviour absent from HEAD is engine-rot, not report-rot.
6. Corpus reconstruction at the report's own commit (`59a9e0d`) rather than at HEAD, so "wrong when
   written" is distinguishable from "wrong now".

The report is unusual in the corpus: its subject is the repo, not the game. Where a claim is about a
document rather than about `roll2hit-v3.html`, the document is the measurement target and this is stated.

---

## II. Census

| Class | Named | Resolve at HEAD | Rate |
|---|---|---|---|
| HTML data-structure consts (§III-C) | 11 | 10 | 91% |
| State fields named in prose (§VII-E) | 21 | 17 | 81% |
| Functions | 3 | 3 | 100% |
| Documents named in the role tables (§VI) | 14 | 13 (12 relocated) | 93% |
| Design constants (§II-C) | 7 | 7 exact **at the archive build**, 1 unchanged at HEAD | — |
| Recommendations FC01–FC05 | 5 | 3 shipped · 1 half-shipped · 1 closed by this pass | — |

`CORRIDOR_CELLS@—` is the only dead const: deleted with the Layer-9 corridor layer (§CELL-05 /
§CELL-11A / §CELL-14), 3 commits in history — **RETIRED, not never-shipped**. Its home doc
`docs/spec/spec-corridors.md` survives with a `⚠️ SUPERSEDED` banner, which is the correct handling.

---

## III. Design Constants — the delta table, both ways

The report's §II-C table gave seven canonical numbers with a verification recipe. Measured against the
build it was written against (`32c10c5`, 2026-05-24, `roll2hit-v3.html` at exactly **14,377 lines** —
the report's own figure, exact) and against HEAD:

| Constant | Report | Archive 2026-05-24 | HEAD 2026-08-11 | Verdict |
|---|---|---|---|---|
| HTML lines | 14,377 | **14,377** | 38,712 | ✅ exact when written · 2.69× |
| Monsters (`const MONSTER_POOL = {@5355`) | 370 | **370** | 398 | ✅ exact when written |
| `WORLD_DB` terrains (`const WORLD_DB = {@6279`) | 66 (46 base + 20 epic) | **66** | 111 | ✅ exact when written |
| Story nodes (`const NODE_MAP = {@8425`) | 76 | **76** | 416 | ✅ exact when written · 5.5× |
| State fields (`const _S_DEFAULTS = () => ({@23062`) | 107 | **107** | 318 | ✅ exact when written |
| Froberger entries (`const FROBERGER_JOURNAL = [@27184`) | 41 | **41** | **41** | ✅ **unchanged in 79 days** |
| Named Birka NPCs (`const NPC_DIALOGUES = {@10396`) | 6 | **6** | 204 profiles / 213 dialogues | ✅ exact when written |
| Acts (`node.act`) | 8 | **1–8** | **0–8 plus `NaN`** | ⚠️ see below |

**Zero transcription errors across seven constants.** This is instrument 9's gradient in its cleanest
form: everything the author could copy is exact.

Two qualifications the table itself invites:

- **The stated recipe does not reproduce the stated number unscoped.** §II-C gives
  `grep -c "key:'"` as the source for 370. At the archive build that grep returns **462** across the
  whole file and **370** only within the `MONSTER_POOL` block; at HEAD, **568** and **398**. The recipe
  is correct as a block-scoped count and wrong as written. `npm run stats` (§DX-01g) is the live
  replacement and parses the data sections with the same `wbapi-core` the `:1367` server uses.
- **"Acts 8" has become wrong in two directions.** HEAD carries `act:0` (absent from the archive) and
  `act:NaN` on 36 of 416 nodes — the latter already filed as **§AUDIT-03t** by §DOC-02c, where
  `node.act || 1` silently act-gates them as Act 1 and `ACT_NAMES[NaN]` renders the literal string
  *"undefined"* in the act badge.

**`_S_DEFAULTS()` survival — the strongest structural result in the program.** Of the 107 depth-1 fields
present at the archive build, **104 are still declared at HEAD**. Only three were removed:
`hearthHome` and `lastCorridorCells` (§CELL-13 jump-travel removal / the corridor layer) and
`voidSignClicked`. The report's §VII-E claim that `_S_DEFAULTS()` is the durable spine of session
continuity is the one architectural prediction it made that can be checked numerically, and it holds at
97%.

*(Method note, a small correction to a sibling: §DOC-02b records HEAD's field count as 193. That is a
count of **lines that begin a top-level field**; 87 of those lines declare more than one. The depth-1
key count is **318**. Both are defensible; they are not the same measurement, and the archive figure of
107 is a depth-1 count, so 318 is the like-for-like comparison.)*

---

## IV. Recommendations — outcome register (§VIII-A)

The report ranked five open documentation items. Their fate is the most useful thing in it:

| Item | Recommendation | Outcome |
|---|---|---|
| **FC05** | Two-way link convention: `// → doc: file.md §Section` in the HTML; `> HTML source: CONST ~line N` in the docs | **HALF SHIPPED.** The HTML half is live: **93** `// → doc:` pointers, on `MONSTER_POOL`, `WORLD_DB`, `NODE_MAP`, `NPC_DIALOGUES`, `QUEST_DB`, `FIGHTER_FEATURES`, `CONDITION_ITEMS`, `EPIC_BOSS_POOL`, `FROBERGER_JOURNAL` and 84 more; **48** top-level CAPS consts still lack one. The doc half has **0 commits ever** and exactly one occurrence in the repo — inside this report. **NOT SHIPPED — superseded** by §DX-01e's `` `symbol@line` `` anchors, which are gate-enforced (`check:anchors`, gate #15) and therefore strictly better than the prose convention proposed here |
| **FC02** | `froberger-journal-all-entries.txt` entry-by-entry compare against the HTML — "the count is verified (41 entries); the content comparison has not been done" | **CLOSED BY THIS PASS — and it found two defects.** 39 of 41 entries are verbatim after quote/whitespace normalisation. Entries **17** and **29** are entirely different text in the two artifacts (§V, Finding 3) |
| **FC01** | Doc Health badge in `index.md` | **SHIPPED** — `index.md` §"Doc Health Badge". **And it is the subject of Finding 1** |
| **FC03** | Split `mechanics.md` into combat + economy | **SHIPPED** — `docs/mechanics/mechanics-combat.md` + `docs/mechanics/mechanics-economy.md` |
| **FC04** | Re-verify function names in `lab-report-architecture-full.md` every 10 layers | **NOT SHIPPED as a cadence — superseded in kind.** No periodic re-verification ran; the §DOC-02 program (2026-08-11) is doing it once, exhaustively. §DOC-02b measured that report at 180 of 197 symbols resolving |

`index.md` line 751 records *"FC01–FC05 documentation queue — ✅ All complete 2026-05-25"*, and the badge
row reads *"FC items pending: 0 (FC01–FC08 all ✅)"*. **FC05's doc half and FC04's cadence were closed
without shipping.** Both were superseded by better mechanisms, so the outcome is right and the
bookkeeping is wrong — which is the same failure mode as Finding 1, one level up.

---

## V. Findings

### Finding 1 — The Doc Health Badge reports ✅ on every stale row *(→ §DX-02s)*

FC01 shipped the badge to make documentation drift visible at a glance. At HEAD it is drifted, and every
row is marked `✅`:

| Badge row | Badge says | Live | Drift |
|---|---|---|---|
| HTML line count | 36,933 | 38,712 | **+1,779** |
| Lab reports on disk | 85 | 107 | **+22** |
| Lab reports in index | 85 | 87 unique filenames referenced | **+2, and wrong in both directions** |
| Live entity counts | 38,106 lines (2026-07-29) | 38,712 | +606 |

The lab-report row is the load-bearing one, because the index is the corpus manifest this report
designates as the schema:

- **26 reports on disk are absent from `index.md`** — the whole `vm01*` series (a–g4), the `play-01*`
  series, `warrants-board`, `void-tide-bounties`, `death-loot-grave`, `javascript-mud`, `npc-card-map`,
  and others.
- **6 index rows name files that do not exist**: `lab-report-api-01-02-mechanics-combat-review.md`,
  `lab-report-loot-drop-weapon-economy.md`, `lab-report-plan-cleanup-v13.md`,
  `lab-report-plan-cleanup-v17.md`, `lab-report-plan-cleanup-world-builder-arc.md`,
  `lab-report-timeline-history-completed.md`. All six were deleted in a single commit, **`120d617`**,
  and the index kept their rows.

`index.md` carries its own repair instruction directly beneath the badge — *"Update this table at the
start of each session: recount lab reports with `ls lab-reports/lab-report-*.md | wc -l`"* — so the
drift is not a missing procedure. It is a manual procedure that was not run, wearing a green checkmark.
**Every one of these rows is mechanically computable** (`wc -l`, `ls | wc -l`, a two-way `comm` against
the index's own references), which makes this the cheapest possible gate and the reason it is filed as
one.

**The same failure is present on day one.** At `59a9e0d` — the commit that added this report — the repo
held **22** lab reports and `index.md` referenced **23**. This report says "23" twice (§VI-C and the
§VII-A diagram) because it counted the manifest rather than the disk. The corpus figure it gives, **37
Markdown documents**, is *exact* at that same commit. The report was precise about the number it
measured and wrong about the number it inherited.

### Finding 2 — A bijection guarantees a link, not a truth *(→ §AUDIT-03z (b))*

FC05's shipped half works exactly as specified. `const S29_AUROS_THEORY =@27050` carries
`// → doc: world.md §S29`, and `world.md` §S29 exists and describes the scene. The pointer is correct.

Both ends state the trigger as `frobergerLastEntryRead && fav_auros >= 2`. **`fav_auros` occurs exactly
once in 38,712 lines — in that comment.** It is not a `_S_DEFAULTS()` field and nothing reads it. The
live guard reads the favor ledger: `s29LineDelivered) {@32669` gates on `_npcFavor('auros') >= 2`.
`world.md` repeats `fav_auros >= 2` at three separate lines, having inherited it from the comment the
pointer connects it to.

The same comment names the node as **`CY`**, which is not a `NODE_MAP` key (`CY`→`HKG`, the §AUDIT-03p
born-dead class documented in the engine's own `birkaNpcs` source note and in §DOC-02d). `world.md`
annotates this correctly — *"at `HKG` (historical `CY`)"* — so the doc is right about the place and
wrong about the field, and the engine comment is wrong about both.

Neither error is visible to any gate. `check:legacycodes` (gate #16) scans `*.md`, so an engine comment
is out of scope; `check:noderegs` phase 6 is comment-aware **by design** (the §AUDIT-03f lesson) and
therefore skips it; and no gate validates a state-field name appearing in prose. This is
**§AUDIT-03s's class** — dead references outside `.md` — with a new member: a field name that never
existed, propagated across the FC05 link into the maintained doc.

### Finding 3 — FC02, closed after 79 days: two journal entries diverge *(→ §AUDIT-03z (a))*

The HTML's `FROBERGER_JOURNAL` and its declared home doc `sources/froberger-journal-all-entries.txt`
agree on **39 of 41** entries, verbatim. Two do not:

| # | HTML (`FROBERGER_JOURNAL`) | `froberger-journal-all-entries.txt` |
|---|---|---|
| 17 | node `MAN` — *"The woman at the archive disagreed with my taxonomy of the eastern war…"* | `[Midlands — MI]` — *"The midland family fed me and gave me the grain-store loft…"* |
| 29 | node `PDL` — *"There is a question I should have asked before she left…"* | `[Island Settlement — IS]` — *"The island has seven families and one boat…"* |

These are not typographical drifts; they are different entries. The `.txt` retains superseded text.

The file is additionally **invisible to every gate in the repo**. `scripts/legacy-codes.js` drives gate
#16 from an explicit `SWEEP` list of eleven `.md` paths, with `HISTORY_DIRS` covering `lab-reports/`,
`archive/`, `docs/spec/` and others; the string `.txt` does not appear in the script. So all **41** entry
headers still carry retired 26×16 codes (`CI`, `TV`, `CR`, `BA`, `SE`, `SL`, `MI`, `IS`, …) while the
HTML uses the live ones (`LHR`, `MHQ`, `KRN`, `LLA`, `SFT`, `BMA`, `MAN`, `PDL`), and nothing reports it.
This file is not history: the HTML names it as a home doc in its own FC05 pointer,
`const FROBERGER_JOURNAL = [@27184`.

*(Corroboration for §DOC-02d: the header remap `CI→LHR`, `TV→MHQ`, `CR→KRN`, `BA→LLA`, `SL→BMA` is
exactly the list the engine's `birkaNpcs` note records, recovered here independently from the journal.)*

### Finding 4 — Two favor mechanisms, one gate grammar *(→ §DX-02s (b))*

§VII-E specifies Category D as *"one int per named NPC — `fav_yael`, `fav_brynn`"*. Neither field exists
and **neither has any commit in the file's history** (instrument 2): **NOT SHIPPED**. The favor system
shipped as a map, `npcFavorability`, written by `_setNpcFavor` and read by the gate grammar at
`if (g.favorMin)@22064` — a different *shape*, not merely different names. §DOC-02d traced the naming
half of this to `lab-report-birka-beginner-arc.md`.

But the `fav_<npc>` shape is not absent — it is live for exactly one character.
`fav_corelli: 0@23143` is a real `_S_DEFAULTS()` field, read at two sites and written at
`S_story.fav_corelli = Math.min@31792` as `min(3, corelli_purchase_count)` (§DOC-02g verified this
mechanism at 19 of 20 identifiers). It is a private scalar: **`favorMin` cannot see it**, so no quest
gate can ever depend on Corelli's favor without a `_legacy_fn` closure — invariant-#4 pressure with a
declarative alternative already in the grammar. The report's Category D therefore describes a shape that
half-exists, for one NPC, unreachable from the gate language.

### Finding 5 — A dead fallback for a field that never existed *(→ §DX-02n)*

The activation-gate reader contains `st.visited || st.visitedNodes@22055`. `visitedNodes` occurs
**once** in the file — in that expression — has **one commit ever**, and is not a `_S_DEFAULTS()` field
in the archive build or at HEAD. The live field is `visited`. The right-hand branch is unreachable and
always was: defensive code written for a field that was never declared. Same class as the §DX-02n
members, and a further widening of `check:deadconsts` — after top-level consts, quest-entry fields,
parameters and inventory item objects, this is a **dead alternative in a fallback chain**.

---

## VI. Document Roles — delta table

The report's §VI role tables are the part that aged fastest, because `5e48dd7` (2026-07-09) reorganised
the repo root. Every file survives; twelve moved.

| Report's file | HEAD | Role delta |
|---|---|---|
| `plan.md` | **retired** → `CONTRIBUTING.md` (rules) + `BACKLOG.md` (work) at `5e48dd7` | The one document the report is *about*. `1367-sources/plan.md` is a different, still-live importer tracker |
| `index.md` | `index.md` | Role unchanged: manifest + cross-reference + Doc Health Badge (Finding 1) |
| `world.md` · `story.md` · `mechanics.md` · `monsters.md` · `maps.md` | root, unchanged | `mechanics.md` split per FC03; `maps.md`'s 26×16 tables quarantined by §AUDIT-03l with an explicit historical banner |
| `combat.md` | `docs/spec/combat.md` | relocated |
| `spec-engine.md` · `spec-world.md` · `spec-combat.md` · `spec-migration.md` | `docs/spec/` | relocated; `docs/spec/` is a `HISTORY_DIR` for gate #16 |
| `spec-corridors.md` | `docs/spec/spec-corridors.md` | **⚠️ SUPERSEDED banner** — correct handling of a doc whose subsystem was deleted |
| `froberger-journal-all-entries.txt` | `sources/` | relocated; gate-invisible (Finding 3) |

Three prose claims in those tables are now false and are kept here as measured deltas:
`maps.md` — *"26×16 grid layout… all 76 node coordinates"* → the live projection is **90×360**
(§WALK-1.5) and `docs/maps/node-index.md` (`npm run nodes`, gate #12) is where a node code is looked up;
`story.md` — *"all 76 nodes… all 120 quotes"* → 416 nodes, 213 dialogues, and `story.md`'s own "42 story
nodes" is a curated narrative-beat count deliberately left alone by the 2026-07-09 sync pass;
`monsters.md` — *"all 370 entries… all 66 terrain coverage tables"* → 398 and 111.

**Vocabulary deltas.** §III-B's `Layer N` version system survives only as historical labelling (14 uses
in `BACKLOG.md`; `index.md` still reads "Layers 0–104"); the live identifier is the `§XXX-NN` section tag
(58 distinct in `BACKLOG.md`). §III-D's `SP2` sync-pass vocabulary has **0 occurrences in any live doc**
— **RETIRED**. §III-E's narrative vocabulary survives intact: `_curseScore()` is live at three call
sites, `VOID_TIDE_EVENTS` and `entry42Text` are live fields, and favorability shipped as **four** tiers
(`impartial · questActive · friendly · dearFriend`) — which resolves this report's own internal
contradiction, where §III-E calls it *"four-state"* and then lists three, in favour of the number.

**One policy has been reversed in practice.** §VI-C states that lab reports *"are not updated after the
fact — an implementation note is prepended if shipped code diverges."* `CONTRIBUTING.md` upholds the
narrow half (bare numbers and anchors in history are annotated, never rewritten), but the §DOC-02
program rewrites report *prose* against measurement, keeping every unshipped claim marked **NOT
SHIPPED** rather than prepending a note. This document is an instance of the reversal.

---

## VII. What survived

Stated plainly, because the failures above are louder than the successes:

- **The two-way sync rule shipped and is enforced.** Not as the prose convention FC05 specified, but as
  93 machine-readable `// → doc:` pointers in one direction and gate-enforced `` `symbol@line` ``
  anchors (§DX-01e, gate #15) in the other. The report's argument — that the link must live in *both*
  artifacts — is the argument the repo eventually implemented.
- **"Documentation as software with a test suite" is now literal.** The report proposed sync passes as
  the test protocol. HEAD runs **16 CI gates** (`npm run check:walk`), of which at least five —
  `check:anchors`, `check:nodeindex`, `check:legacycodes`, `check:noderegs`, `check:npcregs` — are
  doc/reference consistency checks in exactly this report's spirit.
- **The state contract held at 97%** — 104 of 107 `_S_DEFAULTS()` fields, across a 2.69× file growth and
  the §ARCH-01 format migration.
- **The PLANNED-asymmetry rule survives verbatim** as `⚠️ PLANNED` in `BACKLOG.md`, with the
  strengthened form in `prompt.md` §2: *"New scoped work is a spec, not code."*
- **The five-phase decomposition (Spec → Stub → Code → Sync → Commit) is recognisably `prompt.md` §2's
  ten-step loop**, with grep-before-building, the lab-report gate, verification, and the §RESUME
  handoff added — every addition a phase the original framework had no slot for.

The one thesis the evidence contradicts is §IV-D and §VIII-D: that the master document is a *resumable
state machine* whose maintenance is guaranteed by its own usefulness. The badge in Finding 1 is the
counterexample. Manual state that must be re-derived by hand at the start of every session is
re-derived until it isn't, and then it reports `✅`. **The maintainable form of this report's thesis is
that every claim a document makes about a countable thing should be recomputed by a gate, not by a
reader.**

---

## VIII. Defects filed

| Row | Premise | Design call |
|---|---|---|
| **§DX-02s (a)** | `check:docindex` — recompute the Doc Health Badge's mechanical rows (HTML line count, lab reports on disk, index↔disk set difference both ways) and fail on drift. 26 unindexed files, 6 phantom rows, 1,779 lines of line-count drift, all rows `✅` | No |
| **§DX-02s (b)** | Two favor storage shapes; `favorMin` reads `npcFavorability` only, so `fav_corelli` is unreachable from the gate grammar. Either fold it into the ledger or widen the grammar — invariant #4 says widen | Small |
| **§AUDIT-03z (a)** | `sources/froberger-journal-all-entries.txt` is a live home doc invisible to every gate: 41 retired 26×16 codes in its headers, and entries **17** and **29** carry superseded text. Widen gate #16's `SWEEP` to non-`.md` live docs | No |
| **§AUDIT-03z (b)** | `fav_auros` — a field that never existed — is stated as the S29 trigger in an engine comment and in `world.md` ×3, reached across a correct FC05 pointer. §AUDIT-03s's class: dead references outside `.md`. The live guard is `_npcFavor('auros') >= 2` | No |
| **§DX-02n** | The `st.visited` / `st.visitedNodes` fallback in the activation gate reader (anchored in §V Finding 5) — dead alternative in a fallback chain; `visitedNodes` was never a field. Widens `check:deadconsts` a fourth time | No |

Pre-existing rows this pass corroborates: **§AUDIT-03t** (`act:NaN`, §III), **§AUDIT-03s** (dead codes
outside `.md`, Finding 2), **§DX-02n** (Finding 5).

---

## IX. Conclusions

1. **Every number this report measured was exact; the one number it inherited was wrong.** Seven design
   constants and the 14,377-line file size are exact against the build it was written against. The
   "23 lab reports" figure — copied from `index.md`, which said 23 when 22 existed — is the single
   transcription error, and it is the one figure that came from another document. This is instrument 9's
   gradient with an unusually clean edge: the author's own measurements held, the citation did not.

2. **The instrument built to detect staleness became the stalest artifact in the corpus.** FC01's badge
   is off by 22 reports and 1,779 lines and displays `✅` on every row, with its own repair procedure
   printed directly beneath it. A check that depends on a human running it is a check that reports
   green when nobody ran it.

3. **A bijection is a link, not a truth.** FC05's shipped half connects `S29_AUROS_THEORY` to `world.md`
   §S29 perfectly, and both ends name a state field that has never existed in 38,712 lines. Two-way
   sync guarantees that a claim has an address, not that it is correct.

4. **Superseding is not the same as closing.** FC04 and FC05's doc half were marked `✅ All complete
   2026-05-25` and neither shipped; both were replaced by better mechanisms (the §DOC-02 program;
   `symbol@line` anchors). The outcomes were right and the register was wrong — the same defect as (2),
   one level up, and the reason the §DOC-02 method marks an unshipped claim **NOT SHIPPED** and keeps it.

5. **The thesis is sound and the repo has already ratified it.** "Maintain documentation as you would
   maintain code" was the report's only real recommendation. What the intervening 79 days added is the
   part it could not have known to specify: *code is maintained by tests that run without being asked.*

---

## X. References

| Reference | Description |
|---|---|
| `roll2hit-v3.html` | Primary source — 38,712 lines at HEAD; 14,377 at `32c10c5` |
| `32c10c5` (2026-05-24) | Earliest surviving build; the archive baseline for §III |
| `59a9e0d` (2026-05-24) | The commit that added this report; corpus baseline for Finding 1 |
| `120d617` | Deleted the six lab reports `index.md` still lists |
| `5e48dd7` (2026-07-09) | Split `plan.md` → `CONTRIBUTING.md` + `BACKLOG.md`; repo-root reorganisation |
| `CONTRIBUTING.md` · `BACKLOG.md` · `prompt.md` | The successors to `plan.md` §I / §V / the work loop |
| `index.md` | Manifest, cross-reference table, Doc Health Badge — Finding 1 |
| `scripts/legacy-codes.js` | Gate #16; its `SWEEP` list is the subject of §AUDIT-03z (a) |
| `lab-report-architecture-full.md` (§DOC-02b) | Sibling; FC04's re-verification target |
| `lab-report-birka-beginner-arc.md` (§DOC-02d) | Sibling; the naming half of Finding 4 |
| `lab-report-corelli-merchant.md` (§DOC-02g) | Sibling; verified the `fav_corelli` mechanism |
| IEEE Std 830-1998 | *IEEE Recommended Practice for Software Requirements Specifications* |

---

*Verification status: ✅ §DOC-02i, 2026-08-11 — 619 → 290 lines. Seven design constants re-measured
against the archive and HEAD; five recommendations adjudicated; FC02 closed by measurement; five defects
filed. Claims that did not ship are marked **NOT SHIPPED** and kept.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
