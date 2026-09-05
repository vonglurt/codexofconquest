<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report Synthesis — Part 7: Writing & Design Philosophy

### Cross-Reference of Eight Craft-and-Philosophy Reports Against `play.html`

**Original date:** 2026-06-16 14:18 · **Stated baseline:** 33,721 lines · **Source reports:** 8
**Reference build:** `89fa13b` (2026-06-16 12:20) — **exactly 33,721 lines**, the build this report was written against
**Verified against HEAD:** 2026-08-14 (§DOC-02bh) — `play.html` @ 38,712 lines, 59 days later
**Series:** the closing part of the seven-part synthesis (64 reports)

> **HISTORY DOCUMENT.** This is the synthesis as believed on 2026-06-16, re-measured, not a
> description of the current engine. Claims that did not ship, or that were wrong when written, are
> marked **NOT SHIPPED** / **WRONG AT BIRTH** and **kept** — a silently deleted claim reads like one
> that held. Its node codes are the retired space; per §AUDIT-03m `docs/lab-reports/` is HISTORY —
> **annotate, never rewrite**.

---

## Abstract

Part 7 closes the synthesis series by asking of eight craft reports — narrative architecture, the
Pinker style guide, the Void Shaman, the Wisdom arc, the design-process meta-report, the aspirations
register, the organ synthesiser, and the Birka founding document — *what was documented, what is the
current code, and what still applies as working design knowledge.*

**Verification result: its pointers are near-perfect and its verdicts are wrong about the game.**
**18 of 18 line citations resolve correctly** against its own baseline build (16 land on the exact
named symbol; 2 are range endpoints inside the block they cite), **24 of 25 named engine symbols
resolve at HEAD**, the six Birka dialogue tiers are **19 lines each (5/5/5/4) — byte-exact for all
six NPCs**, and every quoted passage it copied from the file is verbatim 59 days on.

**And of the five arcs it pronounces "fully live," four cannot be reached in play.** All eight
source reports have since been verified individually (§DOC-02d · p · x · ad · ae · al · ao · as), and
those records converge: the Void Shaman's entry flag has never had a settable writer; the Wisdom
arc's hub is the 5th of 5 occupants of one cell; the Curse Score is pinned at a floor of 20 by a
2026-05-29 rename; and the organ shipped as a file the game has never once played. Part 7 grepped
for symbols, found them, and never asked whether a player could arrive.

***A symbol census measures the file. Only reachability measures the game.***

**Keywords:** synthesis verification, reachability vs. existence, design-record drift, house style,
inherited conclusions

---

## I. Intent, Inspiration, and What This Buys the Player

**The inspiration.** By 2026-06-16 the repository had 64 lab reports and one 33,721-line HTML file,
and the two had stopped being able to see each other. The synthesis series was written against a
specific fear, and it is the same fear that produced this verification program two months later:
*a design corpus decays into fiction faster than the code it describes decays into bugs, because
nothing ever fails when a document is wrong.* Parts 1–6 covered architecture, combat, world,
monsters, NPCs and quests. Part 7 was reserved for the layer none of those could hold — the
**writing standards and the design philosophy**, the knowledge that has no data structure.

**Why the game needed it.** codexofconquest's central mechanic is not combat; it is *noticing*. The Void is
sealed by seven Shards, but the ending is selected by the player's side-content behaviour, and the
Curse of Knowledge — Froberger's isolation, not his malice — is what the whole arc is about. That
theme lives entirely in prose. There is no `curseOfKnowledge` field. If the writing standard drifts,
the game does not throw an error; it just stops meaning anything. Part 7's job was to be the place a
future author looks before writing a node description, an NPC line, or a journal entry.

**What it adds to play, concretely.** Four things, and the verification pass confirms three of them
are load-bearing at HEAD:

1. **A test a writer can actually run** — *can a stranger who has never played D&D see this place?*
   It rules out the category noun ("crypt", "undercity") without sensory grounding. §DOC-02al
   measured the result: node text carrying a concrete number rose from **28 % to 62 %** and tripled
   in length. The standard was adopted.
2. **A rule for characterisation** — intelligence is shown through the specific detail only a
   perceptive person would notice, never through a narrator's label. Muffat does not get called
   "precise"; she says *"He lasted thirty-eight months."*
3. **A design goal stated as a number** — **five names**. Not XP, not gold: five people in Birka
   whose loss the player can feel when the Void arrives. Every relationship system in the game
   descends from that sentence, and it scaled from 6 NPCs to **204 profiles / 213 dialogues**.
4. **An epistemic architecture** — decisions in one place, reasoning in another, implementation in a
   third. This is the part that has moved (§IV, Report 5), but the principle it encodes is now
   binding repository policy.

**The design conviction underneath all four.** The antagonists in this game are not malicious; they
are misdirected. The Warden spent eleven years faithfully executing a mandate corrupted by a
verb-tense error in its seventeenth hand-copy. The correct answer to him is a document, not a sword.
That is the most precise statement of the project's moral architecture the corpus contains, and Part
7 is where it was written down.

---

## II. Method

1. **Symbol census first.** Every engine identifier Part 7 names, batched through one `grep -c`
   loop before reading a line of prose (§DOC-02b).
2. **Citation adjudication against the birth build, not HEAD** (instrument 8). The report states a
   33,721-line baseline; `89fa13b` (2026-06-16 12:20) is **exactly 33,721 lines**, so every line
   number is checkable as written rather than merely as drifted.
3. **`git log -S` on every symbol the census marks dead** (instrument 4) — the only way to separate
   RETIRED from NEVER SHIPPED.
4. **Sources before HEAD** (instrument 53). All eight source reports were verified and rewritten by
   §DOC-02 between 2026-08-11 and 2026-08-13. A synthesis inherits *conclusions* while re-checking
   only *pointers*, so each of Part 7's verdicts was tested against its source's **verification
   record**, not against its source's original text.
5. **Reachability before correctness** (instrument 54). For every "fully live" verdict, ask whether
   a player can arrive — the writer of the flag, the primacy of the cell, the existence of the node.

---

## III. Citation audit — the pointers are sound

Eighteen anchors, resolved in `89fa13b`:

| Cited | Claim | Result |
|-------|-------|--------|
| 4,853 | `void_shaman` statline | **EXACT** — `ac:15, hp:65` as stated |
| 5,786 | `void_shaman` in `epic_goblin_cave` | **EXACT** |
| 9,148–9,152 | the six Birka NPCs in `NPC_DIALOGUES` | **EXACT** — `yael`/`brynn`/`quill`/`pachelbel`/`crov`; the range is off by one entry (six NPCs span 9,148–9,153) |
| 11,612 | `roenAlchemistMet` | **EXACT** |
| 11,647 | `quest_wis_01` | **EXACT** |
| 20,810 | `const BIRKA_NPC_PROFILES` | **EXACT** |
| 21,231 | the three shaman flags | **EXACT** — all three on one line |
| 23,215–23,224 | combat path + Warden's Token | **EXACT as a range** (23,215 is `vshamanDefeated = true`, the block's first line) |
| 23,216 / 26,536 | two of three `wardensLegacyKnown` writers | **EXACT** |
| 23,224 | Warden's post-combat line | **EXACT and byte-verbatim** |
| 28,269 | the GVA guard | **EXACT** — `node.code === 'GVA' && …` |
| 28,285–28,288 | persuasion path | **EXACT as a range** |

**Symbol census:** 24 of 25 named engine identifiers resolve at HEAD. Every quoted line of dialogue,
item description and journal text is byte-verbatim at 59 days. This is among the cleanest
transcription records in the §DOC-02 corpus.

> The one exception is instructive. **`cookApologized` has 0 occurrences at HEAD, 0 in the baseline,
> and 0 commits in the file's entire history** — **NOT SHIPPED**, written from intent. It appears in
> a *summary* sentence ("the Cook's non-convergent prior is `cookApologized: false` permanently"),
> never in an inventory. Instrument 10 again: a report's inventory earns trust and its summary does
> not, one page later, same hand, same day.

---

## IV. Per-report delta table

| # | Source report | Part 7's verdict | Measured at HEAD | Status |
|---|---------------|------------------|------------------|--------|
| 1 | `game-story-codex-of-conquest` | "The narrative architecture is fully live" | Architecture live; `storyCheckVictory@28356` does read `_missionComplete@23696` and `_curseScore@28174`. **But §EPIC-01 severed the `returned` writer on 2026-05-29 — the score is pinned at a floor of 20 and neither payoff can be reached** (§DOC-02p) | ⚠ **LIVE BUT UNREACHABLE** |
| 2 | `story-codoex-curse-of-knowedge` *(the filename's two typos are real and still on disk)* | "The sensory standard is the current style of all node text" | The **principles** shipped and are measurable (28 % → 62 % concrete numbers). The **prose** did not: **1 of ~26 specimens survives** (§DOC-02al) | ✅ principle · ❌ examples |
| 3 | `void-shaman` | "Yes — fully live; encounter node changed from report" | 20/20 identifiers resolve, dialogue byte-verbatim — **and the arc has been unreachable since the hour it shipped: `vsShamanKnown` has never had a settable writer** (§DOC-02ao) | ⚠ **LIVE BUT UNREACHABLE** |
| 4 | `wisdom-arc` | "Yes — fully live" | 8 quests, 8 flags, 5/6 DC pairs byte-exact — **and 8 of 8 are dead: the hub `VS` is the 5th of 5 occupants of cell `12,198`, so `storyRender` never reaches it** (§DOC-02as) | ⚠ **LIVE BUT UNREACHABLE** |
| 5 | `meta-process-loop-expansion` | "The methodology is the live project process" | True, and stronger than claimed — **6 of its 10 recommendations are binding rules in `CONTRIBUTING.md`/`prompt.md`** (§DOC-02x). But **`plan.md` no longer exists at the repo root** (split into CONTRIBUTING.md + BACKLOG.md, `5e48dd7`, 2026-07-09), so the three-place architecture it states is now four-place | ✅ with one retired term |
| 6 | `ponies-unicorns-aspirations` | "Organ built; Mission Explorer partial; Guide and Fishing unbuilt" | **3 of 5 shipped, not 2.** The Fishing Guide shipped — as the *aside*, `FISHING_GUIDE_TEXT`, a `type:'readable'` item, not the document (§DOC-02ae). DM's Guide **NOT SHIPPED**, correctly reported | ◑ under-counted |
| 7 | `Polyphonic-Organ-Synth` | "`5thOrgan.html` exists… No discrepancy between report and live file has been identified" | The maths verify: 12 voices × 6 harmonics = 72 oscillators; `src/sources/5thOrgan.html:drawbars:  [1.000, 0.500@161` is the 1/n law; `falloffDB:6`; round offset 14 sixteenths. **But the file is `src/sources/5thOrgan.html`** (moved by `5e48dd7`), the literal `ls` path in the report fails, and §DOC-02ad found **four composed errors** the "no discrepancy" sentence overrode | ◑ **no-discrepancy claim withdrawn** |
| 8 | `birka-beginner-arc` | "All six NPCs live; profiles expanded substantially" | **The strongest row.** All six live; the 2-samples-per-NPC founding doc became **19 lines each (5 impartial / 5 questActive / 5 friendly / 4 dearFriend) — byte-exact for all six**; the system grew to 204 profiles / 213 dialogues. **All 8 node codes are dead as written and five were born dead** — no `NODE_MAP` entry for `CI`/`IN`/`TV`/`BA`/`CY` ever existed (§DOC-02d) | ✅ inventory · ❌ codes |

**Live identity of the six.** The report's `Couperin` is engine key **`quill`** (Bard Tomas Couperin,
`MHQ`) and its `Weckmann` is **`crov`** (Pit Master Weckmann, `HKG`); the sixth is **`auros`**
(Commander Seraphine Bruhns, `HKG`), *not* `bruhns`. The report's own Couperin/Quill inconsistency
minted two keys for one character — the defect §AUDIT-03n later spent a whole row repairing.

| Report's code | Live node |
|---|---|
| Yael (CI) | `LHR` |
| Brynn (IN) | `TLL` |
| Couperin (TV) → `quill` | `MHQ` |
| Pachelbel (BA) | `LLA` |
| Weckmann (CY) → `crov` | `HKG` |
| Auros/Bruhns (CY) → `auros` | `HKG` |

---

## V. Three composed errors, all wrong at birth

The pattern is instrument 9's, sharpened: **what the author could copy is exact; what the author
reconstructed is where the errors are.** All three below were falsifiable from the report's own
baseline build on the day it was written.

**V-A. The inverted correction — the report's single loudest finding.** Part 7 states, three times,
that *"The encounter node is GVA, not MT… GVA (some cave node in the world graph), not MT (Mountain
Pass). The MT node was used for `vaLastWardVisited` — the Void Archaeology tunnel."*

In `89fa13b`, on the same page as the guard it cites correctly:

```js
GVA:{ num:50, code:'GVA', name:'mountains', label:'The Mountain Pass — High Crest', act:3, … }
```

**`GVA` *is* the Mountain Pass.** `MT` was not a `NODE_MAP` key in the baseline and is not one at
HEAD — it is the retired code for this very node, and the arc was never relocated. Worse, the
invented distinction is refuted by a line eight above the one the report quotes: `vaLastWardVisited`
is written inside `node.code === 'GVA' && S_story.vaLogFound@31897`. The tunnel and the
Warden are the same place. The report read a code off a guard, could not place it, supplied "some
cave node," and then promoted the guess to a **"What still applies"** bullet. *A correction is the
most dangerous sentence in a design document: it is the one a later reader will not re-check.*

**V-B. A quotation that was never in the file.** *"Weckmann's lost fighter Bruna: live —* ***"Bruna
was twenty-three"*** *in dearFriend dialogue (line 9,152 area)."* The string has **0 occurrences at
HEAD, 0 in the baseline, and 0 commits ever**. `crov`'s dearFriend tier does not mention Bruna at
all. Bruna herself is real and live in four other places — an ending line, a favor line, and the pit
ledger (*"Bruna — pushed too far."*). The character shipped; the sentence attributed to her did not.
The citation is correct and the content behind it is invented, which is the failure mode a line
number is least able to protect against.

**V-C. Right quest, wrong quest.** *"`quest_wis_01` confirmed live at line 11,647. Activation at MME
(node code, not DK) with `wisHookReceived && saltwickAccessed`."* The line number is exact. In the
baseline and at HEAD, `quest_wis_01` activates at **`LCY`** with `gate:{ flags:['wisHookReceived'] }`.
**`MME` and the two-flag gate belong to `quest_wis_02`**, the next entry in the file. The report then
hedged — *"Node location may differ from report's DK assignment"* — which reads as caution about the
source report but was in fact covering its own transposition.

---

## VI. The finding that outranks the rest — existence is not reachability

Part 7 opens five entries with **"Still active: Yes — fully live."** Every symbol behind those words
is real. Four of the five arcs cannot be played:

- **The Void Shaman.** `vsShamanKnown` is set by `quest_vs_warden`'s prerequisite chain and has
  never had a reachable writer. Of eleven authored surfaces, three render, and all three arrived by
  accident in an unrelated data-audit commit. The one way to meet The Warden today is as an unnamed
  wandering monster in `epic_goblin_cave` — the encounter the report correctly noted as *separate*
  from the scripted scene is the only one that exists. (§DOC-02ao)
- **The Wisdom arc.** `VS` was not a `NODE_MAP` key the night it shipped, was re-minted three days
  later by an unrelated import, and is the 5th of 5 occupants of cell `12,198`. Three quests are
  dead by node and five by flag. Live and unplayable for 77 days. (§DOC-02as)
- **The Curse Score ending.** `_curseScore()`'s `returned` term lost its writer to a 2026-05-29
  rename (§EPIC-01), pinning the score at a floor of 20. Part 7's closing thesis — *"The story ends
  when they come back"* — names precisely the ending that has been unwinnable since (§ENDING-01(b)).
- **The organ.** `src/sources/5thOrgan.html` works exactly as specified. `play.html` contains
  **zero Web Audio**. The game has been silent since the day the synthesiser shipped (§AUDIO-01).

The fifth — Birka's six NPCs — is reachable, and it is also the only entry whose verdict rests on a
**counted inventory** rather than on a symbol lookup. That is not a coincidence.

**What generalises.** A synthesis inherits its sources' conclusions while re-checking only their
pointers, so a source that was wrong about *reach* stays wrong in the summary and gains a citation on
the way. The cheapest correction available to Part 7 would have cost one question per entry: *who
writes this flag?* Four of five answers were "nobody," and all four were answerable from lines
already on its screen.

> **A second, smaller instance of the same blindness.** Part 7 cites Yael's impartial dialogue as
> the exemplar of the sensory standard — *"not functional exposition… a person doing a specific
> thing at a specific moment."* The line at `9,148` in its own baseline reads: *"Check your MAP. The
> known world has forty-two nodes… Open your QUEST LOG when you arrive somewhere new… Watch your
> HP."* It is a tutorial infodump, it has been byte-identical since the initial commit `32c10c5`,
> and it is the clearest violation in the file of the standard it was cited to prove. (The "forty-two
> nodes" against a live 416 is already filed as **§AUDIT-03u**.)

---

## VII. What still applies — the durable design knowledge

These survive verification and are the reason this document is kept.

- **The five-step arc is backward-designed from Step 3.** New main-quest content that does not
  connect to the Void/Shard mechanic does not belong in the main quest.
- **The three movements govern any new Froberger entry.** M1 specific sensory detail · M2 short
  sentences · M3 no people's names. Entry 41 is the deliberate exception — he is writing to whoever
  comes after. Any added entry must know which movement it belongs to.
- **Can a stranger see this place?** If the answer needs a category noun without sensory grounding,
  revise. Measured effect at HEAD: 62 % of node text carries a concrete number.
- **Characters reveal intelligence through specificity, not labels.** Don't call an NPC perceptive —
  have them notice the thing only a perceptive person notices.
- **The Void is a conqueror, not a fog.** It advances, retreats, sends scouts. The Shards are not
  artifacts but *surrender documents*: seven scholar-kings who said *we will not let this world fall*.
- **Five names.** Every narrative addition must give the player a reason to care about a specific
  person. The Void conquers by making people abstractions; the game fights it by making them names.
- **Every NPC has a wound the player can see and cannot fix.** Yael can't prove who organised the
  riot; Brynn can't stop being tired. These are conditions to witness, not quests to solve. The
  quest resolves a symptom; the wound remains — and the founding wounds from 2026-05-22 are still
  visible in the live dearFriend tiers.
- **The item description is the arc's entire premise.** *"Recopied seventeen times. The seventeenth
  copy has a small error in the verb tense that changed everything."* Verified byte-exact at both
  `25,387` and `31,716`. Don't add an explanation scene — the token does it.
- **The antagonist is wrong, not evil.** Verified byte-verbatim at `25,393`: *"If I'm wrong, then I
  needed to be stopped. That's — that's actually fine."* The correction is evidence, not combat.
- **The lab-report gate is binary.** New `S_story` fields or `QUEST_DB` shapes → write the report and
  lock the data shape first. CSS and layout changes skip it. This is now `prompt.md` §2 step 3.
- **`src/sources/5thOrgan.html` is the model for any standalone tool.** One file, no build step, no
  external assets, Web API only. An additive organ is the only music architecture that survives this
  repository's single-file invariant — which is why the shape was chosen and why §AUDIO-01 is still
  worth doing.

**One rule has moved.** *"Decisions belong in plan.md; reasoning belongs in lab reports; the shift
register holds only current working state."* `plan.md` was split on 2026-07-09 (`5e48dd7`). The live
form: **policy → `CONTRIBUTING.md` · outstanding work → `BACKLOG.md` · reasoning → `docs/lab-reports/` ·
implementation → `play.html` · closed work → `plan-archive.md`.** The principle is unchanged
and is now enforced; only the filename retired.

---

## VIII. Series index, corrected

| Part | Title | Reports | Key finding, as re-measured |
|------|-------|---------|------------------------------|
| 1 | Architecture & Systems | 12 | WBAPI at `:1367` live; QuestRuntime shipped (§ARCH-01, all ~2,853 quests UQF-1.0); §CELL replaced J-nodes |
| 2 | Combat & Mechanics | 7 | "Monster drop nerf NOT implemented" **still holds** — `battKillEvent@7060` writes `MONSTER_DROPS[key]` unconditionally, no probability gate |
| 3 | World & Navigation | 13 | ⚠ **"126 `NODE_MAP` + 411 `NODE_COORDS`" — 411 is byte-exact, 126 is a census artifact.** The baseline held **409** nodes; a `CODE:{` pattern matches **127** of them and misses the **282** written `CODE: {`. Live: **416 / 416**. The mismatch was its own tell — a world cannot have 411 coordinates for 126 places. Same artifact as §DOC-02bd |
| 4 | Monsters & Fishing | 2 | `BAIT_TABLES` ≠ `BAIT_FISH_POOL`; `LAKE_MAGIC_DB` live — but the fishing economy is unreachable (§FISH-01) |
| 5 | NPC & Narrative | 8 | `NPC_DIALOGUES` + `BIRKA_NPC_PROFILES` dual structure live and scaled to 204/213; La Riva = `AMS` ✓ |
| 6 | Quest Arcs | 14 | Cat Quarter = `CDG` ✓ · Weimar = `NUE` ✓ (`label:"Scholar's Quarter — Weimar"`) · `_rollCeremonia` live ✓ |
| 7 | Writing & Philosophy | 8 | ❌ **"Void Shaman at GVA not MT"** — inverted; `GVA` *is* the Mountain Pass · ✓ the organ exists, at `src/sources/5thOrgan.html` · ✓ methodology documented |

**Total synthesised: 64** — corroborated by `7d3615a` *"archive 64 reports to docs/lab-reports/"*, and the
part sums check (12+7+13+2+8+14+8). The directory now holds **107**.

**One claim in the Purpose is no longer true.** *"Reports are in `docs/lab-reports/` untouched."* All
eight sources have since been re-measured and rewritten by §DOC-02, and this file is the ninth.

---

## IX. Defects and disposition

Nothing in this pass required a new BACKLOG row. Every engine defect it surfaced was already filed,
which is itself the finding — the residue this synthesis sits on is known and tracked:

| Finding | Row | Note |
|---|---|---|
| Yael's tutorial: *"forty-two nodes"* vs. a live 416, unchanged since `32c10c5` | **§AUDIT-03u** | already filed; the first instruction a new player reads |
| *"the stone alignment from the DF node"* in the Warden's arrival text | **§AUDIT-03s** | 6th of 6 known player-facing dead-code strings |
| `const JOURNAL_ENTRIES@22452` — 5 authored quotes, 1 occurrence, **0 readers**, and it numbers the same texts differently from the live journal (its `LCY:{num:7}` holds Muffat, who is Entry **14**) | **§DX-02n** (l) | a dead const that reads as the numbering authority |
| Unseeded `Math.random()` into persisted state across the drop and lake-magic channels | **§DX-02m** | `_pickDrop(table)@7053` already named |
| Curse Score floor of 20 → both endings unreachable | **§EPIC-01**, **§ENDING-01(b)** | highest player impact in the queue |
| `VS` cell-primacy loss → 8 Wisdom quests dark | **§DX-02w** | `check:cellprimacy` is the gate that would catch it |
| The game is silent — organ built, never embedded | **§AUDIO-01** | Report 7's own stated purpose, unbuilt |

---

## X. Conclusion

Part 7 is the most accurate report in the §DOC-02 corpus about the *contents of a file* and one of
the least accurate about the *state of a game*. Eighteen citations resolve, twenty-four of
twenty-five symbols live, every quoted string verbatim after fifty-nine days — and four of five arcs
it certified as "fully live" have never been reachable by a player. The three sentences it composed
rather than copied are each refuted by a line already on its own screen: the Mountain Pass is named
in `GVA`'s own `label`, `quest_wis_01`'s `activateNode` is on the line it cites, and the Bruna
quotation was never anywhere.

The design knowledge in §VII is the part that earned its keep. Five names, the three movements, the
stranger's test, the wound that cannot be fixed, the antagonist who is wrong rather than evil — all
of it held, and most of it is measurable at HEAD. What did not hold is the verdict column, and the
reason is a single missing question.

*Froberger's failure was that he knew everything and could give it to no one. A synthesis that
confirms a symbol exists, and never asks whether anyone can reach it, has reproduced his mistake in
the documentation layer. Entry 42 is still blank.*

---

*Verified 2026-08-14 · §DOC-02bh · Synthesis series Parts 1–7 complete · © 2026 Paul Richeson — MIT License.*
