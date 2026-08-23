<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# On the Asymptotic Kindness of Quest Graphs: Prosocial Mechanics as the Dominant Resolution Path

**IEEE Transactions on Interactive Narrative Systems and Applied Whimsy** · Vol. 7, No. 3, 2026
**Original manuscript:** 2026-05-28 · **Verification pass:** 2026-08-12 (§DOC-02r)

> **STATUS — VERIFIED WITH MAJOR DELTAS.** This is a HISTORY document. The 2026-05-28 text has
> been re-measured claim-by-claim against live `roll2hit-v3.html` and rewritten short. Claims that
> did not ship are marked **NOT SHIPPED** and **kept** — a silently deleted claim reads as one that
> held. The design thesis survives. **The content it is a thesis about largely does not reach the
> player:** 28 of the 51 quests in the six analysed arc families cannot be activated by any route.

---

## Abstract

The original manuscript argued that this game encodes a quantitative preference for prosocial
resolution: understanding is cheaper than fighting, kindness cascades, and combat remains available
as a fallback rather than as the default verb. Re-measured at 76 days, **the thesis is correct and
the arithmetic is close** — mean skill-check DC across the six arcs is 12.08 (σ = 1.00) against a
mean monster AC of 13.23, and the six behavioural-law mappings, the four-token state machine and the
three-arc organism connector are all present under their originally specified names.

Two findings dominate. **First**, cell co-location (§AUDIT-03x) has stranded 17 of the 51 arc quests
on non-primary nodes, and single-writer entry flags carry that failure downstream to **28 of 51
(55 %)** — including the entire §WISDOM-01 arc (8/8), the entire §WHODUNIT-01 arc (4/4) and the
entire §HUNT-01 arc (4/4). Sections VI, VII, IX and X of the original manuscript describe content no
player can reach. **Second**, the manuscript's hardest and most rhetorically load-bearing check —
W6, "accept the shadow", DC 14 WIS — **is not a roll**; it is a button that always succeeds, and the
engine's own portfolio string has advertised the non-existent DC for the same 76 days.

**Index Terms:** prosocial game mechanics, quest state machines, cell primacy, reachability
analysis, token automata, d20 uniform distribution, spec-to-shipped verification.

---

## I. Method and Provenance

Eighteen-instrument §DOC-02 protocol. The material points for this report:

1. **The archive cannot adjudicate this report.** The earliest surviving build, `32c10c5`
   (2026-05-24), contains **none** of the six arcs — `quest_spark_01`, `quest_wis_06`,
   `quest_bilge_02`, `quest_alch_04` and `wisPage6_shadow` all return 0 there. Per instrument 18,
   the reference is the **feature's own birth commit**: `e339aeb` (2026-05-28 21:25,
   *"§WISDOM-01: The Book of Human Nature"*), which introduced all six families in one commit.
2. **The report carries census figures from two different builds hours apart.** Measured across the
   2026-05-28 commit sequence:

   | Build | Time | `QUEST_DB` entries | `NODE_MAP` entries | Lines |
   |---|---|---|---|---|
   | `7bc1986` | 15:25 | 157 | — | 22,192 |
   | `2a11971` | 16:04 | 160 | 138 | 22,351 |
   | `e339aeb` | 21:25 | **210** | **145** | **24,124** |

   The abstract's *"approximately 159 implemented quests"* is exact at 15:25–16:04; *"approximately
   150 world nodes"* and *"approximately 24,000 lines"* are exact only at 21:25. **The quest count
   was taken before the §WISDOM-01 commit that shipped the arc Sections VI, VII and XII analyse.**
   The counting regex was validated against `npm run stats` at HEAD (2,853 — exact match) before
   any delta was derived from it (instrument 14).
3. Reachability was computed from `const CELL_GRID = (() => {@9852` over `NODE_COORDS`, with
   `S_story.currentCode` assigned at exactly two sites (`S_story.currentCode = destCode;@28373`,
   `S_story.checkpointNode || 'LHR'@26009`), then closed transitively over single-writer gate flags.
   `function _uqfActivateAtNode(node) {@30137` keys on `node.code`.

---

## II. As-Built Inventory

| Structure | Shipped as | Status |
|---|---|---|
| §SPARK-01 cat chain | `quest_spark_01: { id:'quest_spark_01'@12340` … `_05`; root gate `{}` at `LCY` | 5 quests live |
| §SPARK-01 SEA | `quest_sea_01`–`_03`; `Warmth Eel: progenitor organism@12518` (CR 4, non-aggressive) | 3 quests live |
| §NAVAL-01 | `quest_sb_01` / `_fight` / `_parley` / `_examine`, role enum `sbChosenRole` | 4 quests live |
| §PORT-01 | `quest_df_01`–`_02`, `quest_sk_01` / `_hull` / `_02` | 5 quests live |
| §HUNT-01 | `quest_hunt_01`–`_04`; entry flag `S_story.huntHookReceived = true;@33235` | 4 quests live |
| §HUNT-02 | `quest_hunt2_01`–`_04` | 4 quests live |
| §SPARK-02 | `quest_spark2_01`–`_05`; 4-token chain | 5 quests live |
| §WHODUNIT-01 | `quest_bilge_01`–`_04`; combat fallback `completion:{ battles:['MS_BILGE'] }` | 4 quests live |
| §ALCHEMY-01 | `quest_alch_01`–`_07`, strict linear flag relay | 7 quests live |
| §WISDOM-01 | `quest_wis_00`–`_07`; hub `_runNodeHook('wis-vs-hub', node)@36029` | 8 quests live |
| Token objects | `name:"Smalt's Trust"@12354` · `name:"Bram's Fish Scale"@13021` · `name:"Oat's Harbor Bead"@33824` · `name:'Dunfall Drift Spore'@13073` · `name:'Highland Letter of Clearance'@33803` | all 5 live |
| Arc monsters | `shadow:          { key:'shadow'@5438` (ac 12) · `night_hag:       { key:'night_hag'@5503` · `sea_spawn:           { key:'sea_spawn'@5556` · `drowner:          { key:'drowner'@5606` | all 4 live |

**Census: 51 arc quests, all present under their originally specified ids. Zero identifier rot.**
This is among the strongest name-survival results in the §DOC-02 corpus — and it is precisely why a
symbol census alone would have declared this report clean.

---

## III. Spec → Shipped Delta Table

| # | Original claim | Shipped | Verdict |
|---|---|---|---|
| 1 | Table I: 13 of 14 prosocial DC rows | All 13 exact in stat, skill and DC | ✅ EXACT |
| 2 | Table I row 14 — §WISDOM-01 W6, "Accept the shadow", WIS **DC 14** | `quest_wis_06` is `type:'side'`, `bits:[]`; the accept path is a button (`Accept the reflection (receive the shadow@33489`) that always succeeds | ❌ **NOT SHIPPED — born so** (absent at `e339aeb` too) |
| 3 | Table IV: 6 behavioural laws → DC/stat mappings | W1 WIS 13 · W2 WIS 12 · W3 INT 11 · W4 INT 12 · W5 WIS 12 all exact | ✅ 5/6 EXACT (W6 = row 2) |
| 4 | Table II: 4-token automaton, creator and destroyer per token | 8 of 8 cells correct; each destroy and the next create are **adjacent statements in one handler**, so the mutual-exclusion claim holds by construction | ✅ EXACT (token names abbreviated: shipped names carry owner prefixes) |
| 5 | Table V: monster roles and encounter counts | drowner ×3 · night_hag ×1 · sea_spawn ×2 · Warmth Eel CR 4 non-aggressive, no statline | ✅ EXACT |
| 6 | §III-C: one organism spans §SPARK-01, §SPARK-02, §ALCHEMY-01 | Confirmed at all three sites (tick glow; `Dunfall Drift Spore` *"related to Warmth Eel bioluminescence"*; the loch-shore finder stone) | ✅ EXACT |
| 7 | §III-A: §WISDOM-01 reads `roenAlchemistMet` and `sbResolved` as activation conditions "for two of its six fragment quests" | `quest_wis_05` gates `roenAlchemistMet`; `quest_wis_03` gates `sbResolved`. Exactly two, exactly those | ✅ EXACT |
| 8 | §IV-B cascade: `smaltBefriended` → `_02` → `pipMet` → `_03` → `_04` → `_05` → `aldousConfessed` | Gate chain confirmed — **and understated**: `gate:{ flags:['whodunitSolved','wrenpemburyInconsistencyNoticed'] }@12461` makes the final link a **cross-arc join**, the report's own best example of its §III-A thesis | ✅ + correction |
| 9 | §IV-A: fighting the cat is the alternative path — "CR 0, trivially won", "the cat moves. That's it." | **There is no cat combat.** No `MONSTER_POOL` key, no `node.battle`, no battle id. The EV comparison has no second term | ❌ **NOT SHIPPED** |
| 10 | §II-A: "DC 10 — the lowest difficulty class in the entire system" | True at `e339aeb` (min = 10). HEAD has four `dc:8` | ⚠️ STALE (right when written) |
| 11 | §II-A: monster AC "ranging from 11 (shadow, easy tier) to 20 (elite tier)" | shadow is **ac:12** (`key:'shadow',          name:'Shadow'@5438`, identical at birth); max AC is **22**; there is no `elite` tier — the vocabulary is trivial/easy/medium/hard/deadly (§DX-02g) | ❌ **3 errors, all wrong when written** — and footnote 2, two lines later, states AC 12 correctly |
| 12 | §II-A: mean prosocial DC **11.9** (σ = 1.1) | Over the report's own 14 rows: 11.86, σ 0.99. Over **all 24** skill checks actually shipped in the six arcs: **12.08, σ 1.00** | ⚠️ ARITHMETIC OK, SAMPLE SELECTIVE — the selection omits both real DC 14s and includes the one DC 14 that does not exist |
| 13 | §IV-C: "Bram is a harbor seal, four hundred pounds… seals are fundamentally agreeable" presented as a corpus quotation | `The dock cat is Bram.@13010` — byte-identical at birth and HEAD. Bram is a **cat**. The single `harbor seal` string in the file is a **wax seal impression** on a port document | ❌ **FABRICATED QUOTATION** |
| 14 | §X: "The cook has never apologized. Ord has not asked for one." — quoted twice as corpus text | Live string: `Ord the passenger is owed an apology@33628` *"…the cook has declined to give."* The first half is a paraphrase; **the second half has no source in the file** | ❌ PARAPHRASE + fabrication |
| 15 | Theorem 5: "The flag `cookApologized` remains false" | `cookApologized`: 0 occurrences, **0 commits in the file's entire history**. An undeclared flag is absent, not false | ❌ **NOT SHIPPED** (the observation about the *design* is correct; the identifier is invented) |
| 16 | §IX-A: Inspector's contradiction — *"My wife Elspeth — we relocated from Saltwick six months ago."* | `Elspeth`: 0 occurrences, **0 commits ever**. The sibling quote, `the late Admiral Pembury`, is verbatim | ❌ **FABRICATED QUOTATION** |
| 17 | §IX-A: scene note *"No combat. No roll required."* | No such string; `No roll required` = 0 hits | ❌ NOT SHIPPED (as a quotation) |
| 18 | §XI-B: §WORLDBUILDER-01 and §EDITOR-01 tools are "the inevitable consequence" | Both shipped — the authoring server (`src/js/wbapi-server.js`, `./api.sh`) and §EDITOR-01 (28 references, `itemChain` widgets). The tag `§WORLDBUILDER-01` was never minted | ✅ **PREDICTION VINDICATED** (different name) |
| 19 | §XIII recommendation: the third §SPARK instance | `SPARK-03`: 0 occurrences, 0 commits | ❌ NOT SHIPPED |
| 20 | §XIII recommendation: §HUNT-03 "spare the monster" option | `HUNT-03`: 0 occurrences, 0 commits | ❌ NOT SHIPPED |
| 21 | §XIII recommendation: the Keel thread, "partially advanced by §WISDOM-01 W3" | `quest_wis_03` exists and gates on `sbResolved` as specified — **and is unreachable** (§IV) | ⚠️ SHIPPED BUT DARK |
| 22 | Nine of the ten Appendix A quotations | Verbatim in the live corpus | ✅ EXACT |

**Instrument 12 (copy-vs-compose) at its cleanest.** Every table in this report is exact or nearly
so; every error sits in a passage the author had to *compose* — an EV argument (row 9), a range
sentence (row 11), a rhetorical quotation (rows 13, 14, 16, 17), a named flag standing in for a
design observation (row 15). The report's DC and monster tables were transcribed; its prose was
recalled.

---

## IV. FINDING 1 — 28 of 51 arc quests cannot be reached

`CELL_GRID` maps each grid cell to an **array** of co-located nodes, and only `list[0]` can ever
become `S_story.currentCode`. Six of the nineteen nodes these arcs activate on are not `list[0]`:

| Node | Cell | Blocked by | Cell size |
|---|---|---|---|
| `SEN` | 18,180 | **`LCY`** | 3 |
| `VS` (`VS: { num:279@9088`) | 12,198 | `VBY` | 5 |
| `ATH` | 32,203 | `SEA` | 17 |
| `HFT` | 10,191 | `ALF` | 6 |
| `VAW` | 10,191 | `ALF` | 6 |
| `BK` | 10,197 | `LHR` | 2 |

**17 quests activate on those six nodes.** The other 11 losses are transitive: each of these arcs is
entered through a **single-writer flag**, and that one writer sits inside a blocked node's
`storyRender` block or inside a blocked quest.

| Flag | Sole writer | Enclosing guard | Consequence |
|---|---|---|---|
| `wisHookReceived` | `S_story.wisHookReceived = true;@33520` | `if (node.code === 'VS' && S_story.personalLegendComplete) {@33454` | **All 8 §WISDOM-01 quests dead** — `wis_01`/`_02`/`_03` sit on *live* nodes and can still never open |
| `visbyUnderground` | `S_story.visbyUnderground = true;@33439` | `node.code === 'VS'` | `activateNode:'VS', gate:{ flags:['visbyUnderground'] }@13479` — W6 dead a second way |
| `huntHookReceived` | `S_story.huntHookReceived = true;@33235` | `if (node.code === 'HFT' && !S_story.huntHookReceived) {@33224` | **All 4 §HUNT-01 quests dead** |
| `whodunitSolved` | `S_story.whodunitSolved = true;@12436` | inside `quest_spark_04` (`activateNode:'SEN'`) | `quest_spark_05` dead; **the Aldous confession branch `S_story.whodunitSolved && S_story.wrenpemburyInconsistencyNoticed && !S_story.aldousConfessed@33582` never fires** |
| `roenAtSea` | `S_story.roenAtSea = true;@33390` | `node.code === 'SEN'` | `activateNode:'PDL', gate:{ flags:['roenAtSea'] }@13251` and the whole §ALCHEMY relay below it dead |
| `seaStrangenessNoticed` | `set:['seaStrangenessNoticed']@12491` | inside `quest_sea_01` (`SEN`) | `quest_sea_02` → `warmthEelFound` → `quest_sea_03` dead |

**Per-family outcome:**

| Family | Unreachable | Cause |
|---|---|---|
| §WISDOM-01 | **8 of 8** | 5 by node (`VS`×3, `BK`, `ATH`), 3 by `wisHookReceived` |
| §WHODUNIT-01 | **4 of 4** | all on `SEN` |
| §HUNT-01 | **4 of 4** | 2 by node (`HFT`, `VAW`), 2 by `huntHookReceived` |
| §ALCHEMY-01 | **5 of 7** | relay severed at `alch_03` (`SEN`) |
| §SPARK-01 SEA | **3 of 3** | relay severed at `sea_01` (`SEN`) |
| §SPARK-01 | **3 of 5** | `_03`/`_04` on `SEN`; `_05` by `whodunitSolved` |
| §VS | 1 of 2 | `vs_01` on `VS` |
| §SPARK-02 · §HUNT-02 · §NAVAL-01 · §PORT-01 | **0 of 18** | intact |
| **Total** | **28 of 51 (55 %)** | |

Three consequences worth naming:

- **The blocking node is the paper's own root.** `LCY` — where the DC 10 cat check lives, the
  single example the whole thesis is built on — is `list[0]` in cell 18,180 and therefore the node
  that suppresses `SEN`, where the cascade's next three links sit. The cascade is killed by its own
  first step.
- **§IX-A's "most important check in the arc" cannot occur.** The manuscript calls the Inspector's
  unforced confession *"the entire arc in one mechanic"*; its guard reads `whodunitSolved`, whose
  only writer is stranded.
- **It reads as thin content, not as a bug.** Every blocked node still renders its text, NPC and
  battle when the player stands in the cell; only the *co-located* node's surfaces are withheld,
  silently. Nothing errors. This is the §AUDIT-03x signature.

**This is engine-rot, not report-rot.** Every one of the 51 quests was authored correctly and none
of the flags was misspelled. §WALK/§NAV-01's 90×360 migration co-located the nodes afterwards.

---

## V. FINDING 2 — the hardest check in the arc is not a check

`quest_wis_06` is `type:'side'` with `bits:[]`. Both W6 paths are `storyRender` buttons: **Accept**
grants `wisPage6_shadow`, a Shadow Shard and +350 XP unconditionally; **Fight** launches
`label:'Shadow — The Mirror Construct'@33506` (`key:'shadow'`, ac 12), whose defeat sets the same
flag. There is no `skill_check` bit and no d20 anywhere in the block.

The engine nevertheless advertises the DC. Roen's portfolio line enumerates the six fragments and
ends: **`W6 here (WIS 14 or combat)@33512`**. Its first five entries — W1 WIS 13, W2 WIS 12, W3 INT
11, W4 INT 12, W5 WIS 12 — are all **exact against the shipped bits**. The sixth is the only one
with nothing behind it.

Both facts are present at `e339aeb`: **born broken, 76 days live.** This is the §AUDIT-03v/w class
(a player-facing string naming a mechanic with no implementation), and its sharpest instance yet —
the string is *correct five times over* before it lies once, which is exactly what makes it
credible.

**The effect on the manuscript's own argument cuts both ways.** §VII's psychological hierarchy
(*"it is easier to notice things about other people than about yourself"*) rests on W6 being the
arc's most expensive roll; it is in fact its only free one. But §XIII's Theorem 1 is *strengthened*:
accepting the shadow has P(success) = 1.0 against a combat path at AC 12, so the prosocial branch is
not merely EV-dominant, it is strictly dominant. **The engine argues the report's thesis harder than
the report does, and by breaking the report's evidence for it.**

---

## VI. Theses Re-Scored

| # | Theorem | Verdict |
|---|---|---|
| 1 | **Prosocial Dominance** — EV(prosocial) > EV(combat) | ✅ **Holds, on corrected numbers.** Mean arc DC 12.08 vs mean `MONSTER_POOL` AC 13.23 (n = 398). The claimed 6:1 §SPARK cascade multiplier is unmeasurable as stated (there is no combat branch to divide by, delta 9) but the cascade itself is real and 6 links deep |
| 2 | **Token Automaton Equivalence** | ✅ **Exact.** Four tokens, mutual exclusion enforced by adjacent create/destroy statements. **The only theorem whose subject a player can currently reach** — §SPARK-02 is one of the four intact families |
| 3 | **Bioluminescent Spanning Tree** | ✅ **Exact.** One organism, three arcs, confirmed at all three sites |
| 4 | **Wrong Theory as Prior** | ✅ Structurally exact. The Elder Fisherwoman is `ninety-one` as stated; the three-tier moral progression is present in the shipped text. §HUNT-01 and §WHODUNIT-01 are both unreachable (§IV) |
| 5 | **Cook Non-Convergence** | ⚠️ **Right about the design, wrong about the artefact.** No flag closes the beat — correct. `cookApologized` never existed, and the string that carries the beat is on a dead node |
| 6 | **Kolmogorov Template Compression** | ✅ **Vindicated by outcome.** Both predicted authoring tools shipped, and the corpus went 210 → 2,853 quests (13.6×) on the template grammar the report identified. Note the template similarity is *greater* than the report claims: §SPARK-01 and §SPARK-02 both centre on a **cat** (delta 13) |

---

## VII. Design Intent, Inspiration, and What This Adds to the Game

**The intention.** Most RPG loops make violence the default verb because it is the only verb with a
resolution system behind it. These six arcs were built to give *noticing* the same machinery combat
already had: a stat, a skill, a DC, a pass branch, a fail branch, a reward and a permanent record.
Once perception has a d20 behind it, "understand the situation" stops being flavour text and becomes
a move the player can be good at.

**The inspiration.** Three sources, all legible in the shipped data. Robert Greene's *The Laws of
Human Nature* and *The 48 Laws of Power* supply the six §WISDOM-01 fragments, each shipped as a
quest whose `desc` states the law *before* the check is offered — the law is the instruction set,
the check is its execution, the knowledge entry is the proof. Bayesian belief updating supplies the
§HUNT and §WHODUNIT wrong-theory NPCs: each holds a prior that is *reasonable given their evidence*
and is corrected, not punished. Self-determination theory supplies the companion structure — Roen is
never befriended through a gift mechanic; the player joins an observation already in progress.

**What it adds to playability.**

1. **A second full resolution system, at no extra UI cost.** Every prosocial beat reuses the
   Ceremonia Roll (`d20 + abilityMod + profBonus ≥ DC`). A player who invested in WIS or INT
   discovers those points now buy content, not just saves.
2. **Failure that does not end the run.** A failed Ceremonia Roll returns `failText` and, on
   `retryable:true` quests, the beat stays open. Contrast a lost fight. This is what makes the
   prosocial branch feel *safe to try*, which is the mechanical precondition for it being tried.
3. **Cascades instead of drops.** One DC 10 check at `LCY` opens a six-link chain terminating in a
   credential usable at other ports. Combat pays in gold and XP; noticing pays in *access*. That is
   the single strongest playability argument in the original manuscript and it survives verification.
4. **Combat kept, never mandated.** §WHODUNIT-01 completes on `battles:['MS_BILGE']` as a fallback
   with reduced narrative information; W6 closes on either branch. The design withholds
   *understanding* from the violent path, never *progress* — it declines to moralise, which is why
   it reads as a preference rather than a scolding.
5. **Cross-arc memory as free content.** `quest_wis_03` and `quest_wis_05` gate on flags set by
   §NAVAL-01 and §ALCHEMY-01. A returning player's earlier kindness is still on the ledger.

**And this is exactly why Finding 1 matters.** Of those five, only (1) and (2) currently reach a
player in full. The cascade (3) breaks at link three; the cross-arc memory (5) is written but never
read, because both source arcs terminate before setting their flags. **§AUDIT-03x is not a
housekeeping defect here — it is the difference between the game this report describes and the game
that is running.** The repair is node ordering, not content: every quest, string, token and DC
needed already exists and is correct.

---

## VIII. Risk and Recommendation Register — Outcome

| Item | Origin | Outcome at HEAD |
|---|---|---|
| Third §SPARK instance | §XIII | ❌ Never built (0 commits) |
| §HUNT-03 "spare the monster" option | §XIII | ❌ Never built (0 commits) |
| Keel thread advanced by W3 | §XIII | ⚠️ Built exactly as specified; unreachable |
| §EDITOR-01 / worldbuilder tooling | §XI-B | ✅ Shipped (WBAPI + §EDITOR-01) |

Two of four recommendations were never actioned; one was actioned and is dark; one was a prediction
rather than a request and came true. **No risk in the original manuscript anticipated the failure
that actually occurred** — reachability was not in its threat model, because at `e339aeb` every node
in these arcs was still its own cell.

---

## IX. Defects Filed

| Row | Defect |
|---|---|
| **§AUDIT-03x extended** | 28 of 51 quests across §SPARK-01, §SPARK-01 SEA, §HUNT-01, §WHODUNIT-01, §ALCHEMY-01 and §WISDOM-01 unreachable via `SEN`←`LCY`, `VS`←`VBY`, `ATH`←`SEA`, `HFT`/`VAW`←`ALF`, `BK`←`LHR`. **Largest single-family casualty measured in the program.** New sub-class: a **single-writer entry flag inside a blocked node's block** propagates the failure to quests on live nodes |
| **§AUDIT-03ad (NEW, 🟢 no design call)** | `W6 here (WIS 14 or combat)@33512` advertises a DC that has never existed. Fix is either a `skill_check` bit or a two-word string edit — **but the string's other five DCs are exact, so the detector wanted is "a DC named in prose with no matching `dc:` in the quest it names"** |
| **§AUDIT-03s extended** | `Ord the passenger is owed an apology@33628` — the §WHODUNIT-01 resolution line renders only at non-primary `SEN` |
| **§DX-02w (NEW)** | An `activateNode` whose node is non-primary is unreportable by every existing gate: `check:noderegs` proves the code *resolves*, and it does. Wants a `check:cellprimacy` phase failing on any `activateNode`/`waypointNode` that is not `list[0]`, with explicit classification for deliberate co-location |

---

## X. Corpus Notes for the §DOC-02 Program

- **19th instrument — a 100 % symbol census can accompany a 55 % dead feature.** Every identifier in
  this report resolves; nothing is misspelled, renamed or retired. Reachability is orthogonal to
  existence, and only a *closure over gate flags* finds it. Run the closure whenever a report
  describes a multi-quest chain.
- **Instrument 18 refined:** a same-day report can carry figures from **two different builds**. Date
  a report's census against the commit *sequence*, not the day.
- **Instrument 12 refined:** the strongest predictor of a fabricated quotation here was a passage
  where the author needed a *contrast* — Bram had to differ from Smalt (both are cats), the
  Inspector needed a second inconsistency, the Cook needed a symmetrical non-demand. **Composition
  under rhetorical pressure invents evidence; transcription does not.**
- The verbatim §SPARK-02 token table, the six-law mapping and the monster typology were **kept**
  rather than deleted: unlike §DOC-02h's precedent, these tables assert *relationships between*
  live structures (create/destroy pairing, law→DC mapping) that no single constant records. There is
  no source of truth to defer to.

---

## References

[1] J. Nash, "Equilibrium Points in N-Person Games," *PNAS*, vol. 36, no. 1, pp. 48–49, 1950.
[2] E. G. Coffman and M. J. Elphick, "Token Ring Protocol for Mutual Exclusion," *IEEE Trans. Computers*, vol. 27, no. 1, pp. 78–84, 1978.
[3] E. L. Deci and R. M. Ryan, *Intrinsic Motivation and Self-Determination in Human Behavior*. New York: Plenum, 1985.
[4] R. Greene, *The Laws of Human Nature*, 2018; *The 48 Laws of Power*, 1998. (Source of the six §WISDOM-01 fragments.)
[5] D. Fudenberg and J. Tirole, *Game Theory*. MIT Press, 1991. (Ch. 5, asymmetric patience — the §WISDOM-01 W4 stalemate.)
[6] A. N. Kolmogorov, "Three Approaches to the Quantitative Definition of Information," *Problems of Information Transmission*, vol. 1, no. 1, pp. 1–7, 1965.
[7] M. Fowler, *Refactoring: Improving the Design of Existing Code*. Addison-Wesley, 1999. (Rule of Three.)
[8] B. Williams, "Ethical Consistency," *Proc. Aristotelian Society*, Supp. vol. 39, pp. 103–124, 1965. (Moral residue — the Cook.)

---

**Manuscript received:** 2026-05-28 · **Verified and rewritten:** 2026-08-12 (§DOC-02r)
**Reference build:** `e339aeb` (2026-05-28 21:25) · **Measured against:** HEAD, 38,712 lines
**Source of truth:** `roll2hit-v3.html`. Where this document and the file disagree, the file is right.

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
