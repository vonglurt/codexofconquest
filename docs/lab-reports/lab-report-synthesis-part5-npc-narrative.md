<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report Synthesis — Part 5: NPC & Narrative

**Cross-reference of eight NPC/narrative lab reports against `play.html`**
**Written:** 2026-06-16 · **Reference build:** `89fa13b` (33,721 lines — the stated baseline, exact)
**Verified:** 2026-08-14 (§DOC-02bf) · **Source reports:** 8

---

## Abstract

Eight design reports covering Birka's six-NPC dialogue layer, the Corelli merchant arc, the
La Riva grief arc, the living-world ambient systems, the WBAPI NPC-speak endpoint, and two
philosophical postmortems are read against the engine and reduced to what a future author can
act on. The 2026-06-16 pass established the surviving inventory. This verification pass
re-measured every claim: **46 line citations, 43 exact and 2 landing on the marker comment
immediately above their target**; every transcribed data figure correct. The failures are
concentrated in one place — **three "not confirmed implemented" verdicts, all three wrong**, and
each contradicted by code within five lines of a citation this same document gets right. Four
further corrections follow, including a mission-ledger threshold that is transcribed perfectly and
governs a flag nothing can write.

**Why this layer exists.** The Birka NPC system is the game's answer to a structural problem:
a walking game with reading has no combat pressure to carry its middle hours. The design bet is
that *recurrence* substitutes for escalation — you pass the same six people repeatedly, and what
they say changes because of what you did. Every mechanism catalogued below serves that bet.
The thesis the postmortems name is **Friendships with Magic**: *"magic that is the byproduct of
choosing people over efficiency."*

---

## I. Method

1. Extract the reference build (`git show 89fa13b:play.html`) and resolve every line
   citation against it, not against HEAD (instrument 18 — HEAD cannot adjudicate a claim
   about 2026-06-16).
2. Score each cited symbol again at HEAD to separate **stale** from **wrong when written**.
3. For every claim of the form *"not confirmed implemented"*, run the grep the report did not.
4. For every threshold, identify the flag's **writer** and prove the writer is reachable.
5. Check each source report against its own §DOC-02 verification record before trusting an
   inherited conclusion (instrument 53).

---

## II. As-Built Inventory

Anchors resolve at HEAD unless a reference-build line is named explicitly.

| System | Anchor | Role |
|---|---|---|
| Cycling quote pools | `const NPC_DIALOGUES = {@10410` | 4 states per NPC key |
| Portrait / greeting data | `const BIRKA_NPC_PROFILES = {@22741` | parallel structure, both required |
| State selection | `function _getNPCDialogue(npcKey) {@23582` | `questActive` from `_hasActiveQuestFor` |
| Card renderer | `function _renderNpcCard(key, container) {@23718` | reads both structures |
| Mission ledger | `function _missionComplete() {@23696` | 12 bits, returns `>= 8` |
| Off-screen character | `const PETRA_STALL_STATES = [@27532` · `function _getGigaultState() {@27694` | cycles on `gameDay % 3` |
| Corridor farewells | `const NPC_FAREWELLS = {@27561` · `function _getFarewell(fromCode, toCode) {@27711` | Friendly+ only |
| Act III one-liners | `const NPC_ACT_THREE_LINES = {@27603` | priority injection, additive |
| Node→NPC routing | `const NODE_NPC_KEYS = {@27547` | read by colour *and* farewell |
| Map warmth gradient | `function _getNodeMapColor(nodeSlug) {@27698` | **live** — see §IV-A |
| Final map render | `function _renderFinalMap() {@27746` | **live** — see §IV-A |
| Brynn's chores | `const BRYNN_MAINTENANCE_TASKS = [@27634` | `{label, cost_gold, flag, action, narration}` |
| Romance layer | `const ROMANCE_QUOTES = [@22407` (21) · `const NPC_ROMANCE_PREAMBLES = {@27613` (6) · `const NPC_ROMANCE_VIGNETTES = {@27623` (6) · `const INN_DREAMS = {@27265` | counts verified |
| Preamble delivery | `const _preamble = (fav >= 2 && NPC_ROMANCE_PREAMBLES[key])@23777` | italic line before the card |
| Companion scenes | `const BRYNN_KEEPER_STORY = {@27171` · `const BRUHNS_CO_SCENE = {@28203` · `const YAEL_NAMED_REPORT_SCENE = {@28189` | three arcs, five flags |
| Corelli arc | `const CORELLI_ITEMS = {@26719` · `const CORELLI_APPEARANCES = [@26742` | 5 items, 5 stops |
| Death-save bonus | `const _kingsSealBonus@7514` | `kings_seal` grants +1 |
| La Riva arc | `AMS:{ num:79@8814` · `quest_la_riva_01: { id:'quest_la_riva_01'@13812` · `S_story.frCatKillCount = (S_story.frCatKillCount || 0) + 1;@25422` | node code is `AMS`, never `FR` |
| NPC speak endpoint | `src/js/wbapi-server.js:SPEAK_LOG_FILE@815` | moved from repo root since |

State fields cluster in `_S_DEFAULTS`: `brynThirdStepFixed: false,@23128` · `s29LineDelivered:@23132` ·
`brynnKeeperStoryTold: false,@23150` · `connieMet:@23155` · `fav_corelli: 0,@23176`.

---

## III. Spec → Shipped Delta Table

| # | Claim (2026-06-16) | Verdict | Evidence |
|---|---|---|---|
| 1 | Map warmth gradient "not confirmed implemented" | **WRONG** | live, 2 call sites — §IV-A |
| 2 | Final map render "design-stage" | **WRONG** | live, fires in victory ceremony — §IV-A |
| 3 | Void's First Sign "no confirming grep" | **WRONG at the time**, RETIRED since — §IV-A |
| 4 | Corelli stops shifted to `TL/RD/IS/WM/IN` | **0 of 5** | real sequence `LCY/LDE/BK/NUE/TLL` — §IV-B |
| 5 | Corelli "core mechanics unchanged" | **MISLEADING** | stop 3 unreachable — §IV-B |
| 6 | 12-bit ledger table | **BYTE-EXACT** | all 12 rows, `>= 8` — §IV-C |
| 7 | EB threshold "dropped 20 → 5, a significant relaxation" | **VACUOUS** | bit unsatisfiable at any threshold — §IV-C |
| 8 | Sixth Birka key is `bruhns` | **WRONG** | key is `auros` — §IV-D |
| 9 | "Prompt caching on the system block" | **INHERITED, FALSE** | never wrote a token — §IV-E |
| 10 | Yael scene gate `fav >= 2` ∧ Act VI ∧ `yaelEscortUsed` | **CORRECT** | engine comment and `world.md` are wrong — §IV-F |
| 11 | `WORLD_JOURNAL_STYLE` not a live style block | **CORRECT** | 0 hits at reference and HEAD |
| 12 | `connie_tuna`/`aldo_sardino` not in `BIRKA_NPC_PROFILES` | **TRUE THEN, STALE NOW** | both added, `@22993`/`@22994` |
| 13 | Fishmonger's Row is `AMS`, not `FR` | **CORRECT** | `AMS:{ num:79@8814` |
| 14 | `cookApologized` does not exist | **CORRECT** | 0 hits, reference and HEAD |
| 15 | `_bfsPath` renamed `_bfsGridPath` | **CORRECT** | 0 / 6 hits respectively |
| 16 | Growth 12,637 → 33,721 = 2.67× | **CORRECT** | 2.668 |
| 17 | Romance counts: 21 quotes, 6 preambles, 6 vignettes | **CORRECT** | all three |

---

## IV. Findings

### A. The three unverified negatives — and all three were on screen

The report marks three living-world features unbuilt. Its own hedge is the tell: *"no confirming
grep."* That is accurate. None was run.

**Map warmth gradient.** `function _getNodeMapColor(nodeSlug) {@27698` — reference build line
25,232, which is **four lines** after `_getGigaultState()`, cited correctly on the previous page.
It reads `NODE_NPC_KEYS`, then returns progressively warmer browns at fav ≥ 1 / 2 / 3. Two live
call sites: the minimap render loop (`const warmColor = _getNodeMapColor(code);@37545`, applied to
every visited or trail cell) and `cell.style.background = _getNodeMapColor(slug);@27761`.

**Final map render.** `function _renderFinalMap() {@27746` — reference line 25,275, forty-three
lines from the same neighbourhood — invoked at `_renderFinalMap();@28486`, inside the victory
ceremony, under the comment `// L44-S: final map render before victory modal`.

**Void's First Sign.** At the reference build, lines 32,789–32,800: a real `r === 4 && c === 3`
branch adding a `void-flicker` class in Act I (3 CSS hits), a click handler writing
`S_story.voidSignClicked`, and that field declared in `_S_DEFAULTS` at reference line 21,187 —
**one line below** line 21,186, which the report cites correctly for Brynn's three maintenance
flags. Distinct verdict from the other two: this one was **live when the report denied it and has
since been RETIRED** (`void-flicker` 3 → 0, `voidSignClicked` 2 → 0 at HEAD).

The pattern is the finding. This document's transcribed tables are perfect and its *absence
claims* score zero for three. Citing a line and searching a region are different acts, and
proximity offers no protection: an author reading line 25,228 will not notice line 25,232 unless
they grep for it.

> **Playability note.** These are not incidental. The warmth gradient is the only place the game
> renders friendship *spatially* — the map literally warms where you have been kind. Declaring it
> unbuilt for two months is how a shipped feature goes unmentioned in every doc that follows.

### B. Corelli — 0 of 5 stops, sourced to a comment that is itself wrong

The report states the appearance sequence "shifted to `TL/RD/IS/WM/IN`". At the reference build
`CORELLI_APPEARANCES` holds `LCY / LDE / BK / NUE / TLL`. Zero match.

Two sources are cited. The first is the const's own header comment, which does say
`TL/RD/IS/WM/IN` — and is the wrong authority: §DOC-02g proved from the archive that the original
codes were `DK/RD/BK/SQ/IN` (the report's own list) and that the comment is a migration-era claim
about the past, written from memory rather than from the diff. The second is *"the
`wbapi-server.js` `GET /api/nodes` help text (line 1,467)"*; line 1,467 is a `curl .../api/npc/{id}`
example inside a quest-authoring walkthrough, and the string `TL/RD/IS/WM/IN` occurs **nowhere in
that file**.

The document then supplies a mapping — *"DK→TL, BK→IS (somewhere in act 5), SQ→WM"* — for a
migration that did not occur in the direction stated. `nodeCode:'BK'` sits seven lines below the
comment that was read.

*"Core mechanics unchanged"* is the more expensive sentence. `BK` resolves — to **Birka Shore**
(`num:241`, act 1), not the Broken Tooth Tavern the arc means (§AUDIT-03y). Stop 3 can therefore
never fire, `encoded_letter` has no other grant path, and the retroactive-decode payoff is dead —
the payoff this report's *own* "what still applies" list calls **load-bearing** three lines
earlier. One page, two adjacent bullets, mutually exclusive.

### C. A byte-exact ledger with a row that governs nothing

The 12-bit table was checked row for row against `function _missionComplete() {@23696` and is
**correct in every cell**: all twelve conditions, journal entry 7, `pitTrainingWins >= 3`,
`defeatedBattles['TLS']`, `_lubeckFriends() >= 3`, `_curseScore() < 10`,
`visited['LHR'] && level >= 5`, and the `>= 8` return.

`allEbReturns:@23688` is the exception, and the error is not in the number:

- The bit needs five `ebReturnDone` flags.
- `ebReturnDone` has exactly one writer, `function _storyEbReturnBeat(ebCode) {@30516`.
- Its only caller is the RETURN chip, built from
  `const returnId   = 'quest_' + ebCode.toLowerCase() + '_return';@36073`.
- `ebCode` iterates `const EB_NPC_DIALOGUE = {@26432`, whose keys are three-letter node codes
  (`PRN`, `INV`, `SDR`, …), producing `quest_prn_return`.
- `QUEST_DB` holds twenty return quests keyed by the **legacy two-letter** codes —
  `quest_ef_return`, `quest_eh_return`, … `quest_prn_return` has **0 occurrences at the
  reference build and 0 at HEAD**.

So *"the threshold dropped from 20 to 5 — a significant relaxation"* relaxes a bit that could not
be satisfied at **any** threshold on the day the sentence was written.

**§EPIC-01 already owns the cause** and dates it precisely: `c1d5a94` (2026-05-29) renamed the
`NODE_MAP` and `EB_NPC_DIALOGUE` keys and left the forty `QUEST_DB` ids as `quest_ef_*`. Nothing
here re-dates that. What this document adds is the **consumer side**: eighteen days after the
break, an author reading the same twelve lines saw a threshold and reported a design decision.
The defect is invisible from the ledger — the number is right, the flag is unwritable, and
nothing in the expression says so. The same break costs the warmth gradient of §IV-A its top
tier: `_getNodeMapColor`'s `ebReturned` branch returns a green (`#3a7a5a`) that no save can reach.

### D. The sixth key is `auros`

Report 1 lists the design→live key renames. Three are right (`quill`, `pachelbel`, `crov`); the
fourth is not. `NPC_DIALOGUES` keys read `yael, brynn, quill, pachelbel, crov, **auros**`, and both
`NPC_ROMANCE_PREAMBLES` and `NPC_ROMANCE_VIGNETTES` key `auros:` to match. The *flag* took the
surname (`bruhnsDepthsReported`) and the *scene const* took the surname (`BRUHNS_CO_SCENE`) — the
key did not. §DOC-02ab had already adjudicated this exact split; the synthesis re-derived it and
got it wrong, which is what a cross-reference document is supposed to prevent.

### E. The prompt cache that has never written a token

Report 2's summary repeats *"prompt caching on the system block"* as a working feature, inherited
from its source without test. §DOC-02ac measured it against the endpoint's own log: **20 calls,
`cache_read:0` and `cache_write:0` on every row.** The system block runs 451–546 tokens against
Claude Haiku 4.5's 4,096-token minimum cacheable prefix; below the floor the API caches nothing
and reports nothing. The comment `// Claude SDK — prompt caching on system block` is still in
place at HEAD. Open as **§DX-02ak**.

Two smaller corrections to the same section: the endpoint moved to `src/js/wbapi-server.js` (now at
line 10,595), so the bare `wbapi-server.js:11,408` citation is exact-at-reference and stale-at-HEAD;
and of the three "not implemented" extensions, `worldTruth`/`enemy` is not the small edit it
appears to be — the two registries do not share a state vocabulary (§DX-02al).

### F. Where the report is right and the engine is wrong

The Yael Named Report gate, from the report's "what still applies": `fav >= 2` **and Act VI+** and
`yaelEscortUsed`. The live gate agrees exactly — `yaelNamedReportDelivered) {@32706`, guarded by
`_npcFavor('yael') >= 2 && (S_story.actNumber || 1) >= 6`, at node `LHR`.

Both other sources disagree with the code:

- `const YAEL_NAMED_REPORT_SCENE = {@28189` — its own header comment says *"fav >= 2 Act IV+"*.
- `world.md:617` says the scene fires *"at a `LLA` or `HKG` visit (fav_yael ≥ 2, Act IV+,
  `yaelNamedReportFired` not set)"* — wrong node, wrong act, and `yaelNamedReportFired` is a
  **phantom flag with 0 occurrences in the engine**.

Filed as **§DX-02bx** 🟢. A lab report outscoring both the engine comment and the maintained home
doc is rare enough to record: reports are usually the stale party, and here the archive-facing
document is the only one that kept the number.

---

## V. What Still Applies

- **`NPC_DIALOGUES` and `BIRKA_NPC_PROFILES` are two structures and both are required.** Quote
  pools in the first, portrait/greeting in the second; `_renderNpcCard` reads both. Keys must
  agree — the `auros`/`bruhns` split in §IV-D is what happens when they drift.
- **Visit-count cycling is load-bearing — do not convert to random.** `pool[count % pool.length]`
  guarantees a player sees the whole pool across repeat visits. Randomness would let the sixth
  line never surface, and the sixth line is usually the one that pays off the arc.
- **`NPC_ACT_THREE_LINES` is additive.** It injects with priority once, then the regular cycle
  resumes. Do not let it replace the pool.
- **Occupation is the lens.** Each `meta` carries a `worldTruth` and an `enemy`, surfaced on the
  card at fav ≥ 2. Yael sees suppressed riots; Brynn sees invisible labour; Bruhns sees diagnosis
  as worldview. Flattening these into generic flavour costs the layer its reason to exist.
- **Gigault is the off-screen-character template.** Never interactable, named by friendly NPCs,
  three rotating stall states, no quest hooks. Any new "city person who exists" copies it.
- **Arc triggers are triple-gated and the gates are the point.** Brynn `fav >= 1` ∧ Act II+ ∧
  `!brynnKeeperStoryTold`; Yael `fav >= 2` ∧ **Act VI+** ∧ `yaelEscortUsed`. Collapsing them
  delivers the scene at the wrong emotional moment.
- **Neither Bruhns's confession nor Yael's report branches on player response.** Both are faits
  accomplis; the player witnesses. Adding outcome branches breaks the arcs' shared premise.
- **Bruhns's `dearFriendWithTheory` is the only cross-arc disclosure gate in the game.** It appends
  a confirmatory — not explanatory — line when `s29LineDelivered:@23132` is set. The player must
  have met the theory elsewhere before Bruhns will confirm it. Worth copying; worth not breaking.
- **The vignette principle governs all NPC writing.** *"Never declare the emotion. Name the object.
  Name what the person does with it. The gap is the emotion."* Connie's dear-friend line is the
  whole La Riva Act IV compressed to one sentence: *"The key still opens the lock. I tried it. The
  lock is in the rubble but it opens."*
- **Preambles render at fav ≥ 2 and stay one line.** *"The cup is already on the table."* The
  technique is Chrétien de Troyes by way of `ROMANCE_QUOTES`; lengthening them destroys it.
- **`fav_corelli` is derived from `corelli_purchase_count`, never assigned.** `last_cipher` is free
  at appearance 5 by design — do not price it.
- **Any reference to "the FR node" means `AMS`.**
- **The Cook never apologizes.** `cookApologized` does not exist because it should not exist.
- **Prosocial DCs cluster at 10–14; combat DCs live in monster AC.** The quantitative preference —
  *it is statistically easier to understand the situation than to fight through it* — is design
  intent, not accident.
- **The four architectural invariants hold at 2.67× the file:** `S_story` is truth; renders are
  idempotent; BFS is one function (`_bfsGridPath`); every mode is a boolean in `_S_DEFAULTS`.

---

## VI. Structurally True Right Now

Six Birka NPCs with four dialogue states each, a scene const apiece, and a mission bit apiece.
Three companion arcs live. The romance layer complete. Corelli's five-stop arc live **except stop
three**, which cannot fire. The La Riva chain live at `AMS`. The speak endpoint live, without the
caching its comment claims. The map warms where you were kind, and renders itself one last time
when you win.

`_missionComplete()` needs 8 of 12 bits. One is pinned false by §EPIC-01, one is a tautology at
both call sites, and one is guarded by a comparison that can never be false. The design's stated
slack is therefore narrower than the number suggests — the ending gate is a real mechanism
pointed slightly wrong, and §EPIC-01 is the row that straightens it.

> *"The Void is sealed. The people are here. That is the difference between Froberger's loop and
> yours."* The engine can now transmit that sentence. It cannot yet award it.

---

## VII. Verification Record (§DOC-02bf, 2026-08-14)

- **Reference:** `89fa13b` (2026-06-16 12:20:47, 33,721 lines — exact). File mtime `14:04:08`,
  commit `2d7d625` at `14:04:42`: a **34-second** birth window; `play.html` untouched
  between the two.
- **Citations:** 46 total — 43 exact, 2 landing on the marker/comment line immediately above the
  named construct (`NPC_DIALOGUES` 9,146→9,147; `AMS` 8,028→8,029), 1 pointing at a real line that
  does not contain the claim (`wbapi-server.js` 1,467).
- **Transcribed figures:** 12/12 ledger bits · 21 romance quotes · 6 preambles · 6 vignettes ·
  3 maintenance flags · 5 scene flags · 2.67× growth — **all exact.**
- **Filed:** §DX-02bx 🟢 (Yael act-gate drift, 3 wrong facts across 2 sources).
  **Corroborated without re-filing:** §EPIC-01 (already dates the cause to `c1d5a94`, 2026-05-29,
  and already names `allEbReturns`; this pass adds only the consumer-side reading) · §AUDIT-03y ·
  §DX-02ak · §DX-02al · §DOC-02ab · §XP-01 (independently cites `_getNodeMapColor` as live).
- **Method additions:** instruments 55 (unverified negatives are a third evidence class, and the
  worst) and 56 (a relaxed threshold on an unwritten flag is a change of zero).

*Synthesis Part 5 of 7 · Next: Part 6 — Quest Arcs*
