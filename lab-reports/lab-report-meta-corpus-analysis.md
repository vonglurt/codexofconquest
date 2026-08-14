<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — The Corpus as Architecture

### A Meta-Analysis of the Lab-Report Corpus and Its Structural Relationship to `roll2hit-v3.html`

**Project:** `roll2hit-v3.html` — single-file HTML5 game engine, MIT License
**Written:** 2026-06-16 15:05 · **Reference build:** `89fa13b` (12:20:47, **33,721 lines — the stated baseline, exact**)
**Verified:** 2026-08-14 (§DOC-02bi) · **HISTORY document — annotate, never rewrite**
**Series:** Meta-Documentation · Corpus Analysis · Design Philosophy
**Classification:** Engineering · Documentation Science · Self-Reference

---

## Abstract

This report treats the lab-report corpus as a primary data source and asks a structural question:
*what does the distribution of lab-report topics reveal about the game they document?*

**Original hypothesis.** The active lab reports, ordered by conceptual distance from the game's atomic
unit (a single dice roll), exhibit a monotonic gradient from mechanical precision to narrative
ambiguity. That gradient is not accidental: it mirrors the game's own thesis, which holds that
probabilistic systems (the dice) and human-meaning systems (NPC relationships, grief, music) are two
poles of one moral framework. Further, the lab-report method — hypothesis, data, observation,
conclusion — is structurally isomorphic to the game's core loop: form expectation, roll, observe,
update state.

**Original finding.** Supported. The reports cluster into seven concentric layers radiating from the
roll mechanic; the reports that produced the most durable architectural decisions are the ones that
crossed layer boundaries. The single-file constraint is the gravitational field holding the layers in
contact.

**Verification verdict (2026-08-14).** *The thesis survives; the census does not.* Every filename the
report catalogues is real — **65 of 65**, checked against the git tree. Every named character, node
label, ending variant and structural invariant it asserts resolves in the engine. But **the directory
held 71 files when this was written, not 65**; the body's enumeration double-counts three reports and
describes 62 distinct files; five files are named nowhere in the document. The §I.A description of the
game is a **2026-05-24 census pasted into a 2026-06-16 document** — including *"17 journal entries"*,
the number the report's own central argument depends on, whose true value has been **41** since the
earliest surviving build.

***A report about a corpus is the one report that can count its own subject with `ls`. This one
did not.***

---

## I. Purpose: What This Corpus Is For, and What It Buys the Player

This section is restated and expanded during verification, because the original left its own
motivation implicit and it is the most durable thing in the document.

**The problem.** `roll2hit-v3.html` is one file. No server, no npm, no CDN, no build step at play
time — one HTML file you can email. That constraint is a philosophical statement encoded as an
engineering requirement, and it produces a specific fragility: **everything is in one scope, so a
single architectural mistake propagates everywhere and becomes invisible.** There is no module
boundary to catch it and no compiler to complain.

**The instrument.** A lab report is written *during or immediately after* a development session. It
carries a hypothesis, a data section (line numbers, function names, state fields), and a conclusion.
It is not a post-mortem — it is a cognitive scaffold for the next session, the previous researcher's
last act before walking away from the desk.

**How this reaches the player.** The corpus is not decoration on the game; it is load-bearing for
three things a player can feel:

1. **The world stays traversable.** The Layer-2 reports (cell grid, BFS, reachability passes) exist so
   that *no place is unreachable*. A player who walks north and finds a wall they cannot route around
   has hit an architectural failure, and the reachability discipline is what prevents it. Free
   movement is the game's first invariant precisely because the corpus kept proving it.
2. **The promises stay true.** The Layer-0/1 reports turn the Cooperative DM Principle — enemies must
   be beatable, death must be recoverable — into numbers a checker can verify. Without that, the dice
   are just dice. With it, the dice are a promise, and a promise is only worth what an audit says it
   is.
3. **The characters stay legible.** The Layer-3/4 reports define how six NPCs can occupy one
   mechanical system and feel completely different. Favorability is the mechanism; the writing is the
   payload; the report is what stops the two from drifting apart between sessions.

**The in-world mirror.** Froberger, the dead researcher, leaves a journal for whoever comes next. Each
entry says: *here is what I found, here is where I failed, here is what I am leaving for you.* The
structural parallel is the design, not a flourish — and the arithmetic of that parallel is the subject
of §V below.

---

## II. Method (verification pass)

The reference build is `89fa13b` (2026-06-16 12:20:47), the last commit to `roll2hit-v3.html` before
this report's 15:05:14 mtime. It measures **33,721 lines**, exactly as the report states, so every
citation is adjudicated *as written* rather than against a build the author never saw.

The corpus itself is measured at `faddace` (14:19:02), the last commit touching `lab-reports/` before
the same mtime. Corpus claims are checked with `git ls-tree`; game claims with `git show
<commit>:roll2hit-v3.html`; existence-vs-rename with `git log -S`.

---

## III. Verification Summary

| Class | Result |
|---|---|
| Catalogued filenames (Appendix A) | **65 / 65 real** — zero invented names |
| Named characters | **13 / 13 resolve** (Froberger ×113, Sweelinck ×627, Marta Eilene Vass, Jimmy Two-Tails, Sandy Scratchpad, Taz Devil, Cat-King, Connie Tuna, Aldo Sardino, Isolde Voss, Benedikt Rasp, Gigault, Kenickie, Corelli) |
| Node codes asserted | **7 correct, 2 wrong** (see §VI) |
| Ending variants | **4, exact** |
| Appendix B invariants | **4 / 4 true** — attribution wrong (§VII) |
| Corpus census | **wrong in four independent ways** (§IV) |
| Game census (§I.A) | **3 of 6 figures wrong**, all fossils of one older build (§V) |

The split is the corpus's familiar one: **what the author could copy is right; what the author
composed is where the errors are.** The filename list — 65 rows of pure transcription — has a zero
error rate. The sentences describing the object have a 50% error rate.

---

## IV. Finding 1 — The Corpus Census (headline)

The report says **65 active lab reports** in its title, status line, abstract, hypothesis, finding,
§II layer table, conclusion, Appendix A heading and footer. Four different quantities are in play, and
none of them is 65 in the way the document uses it.

| Quantity | Value | Evidence |
|---|---|---|
| Files in `lab-reports/` at 14:19:02 | **71** | `git ls-tree -r faddace -- lab-reports/` |
| Numbered slots in the body (§III–§X) | 65 | `### N.` headers |
| **Distinct files in the body** | **62** | three reports carry two slots each |
| Rows in Appendix A | 65 | all real, none duplicated |
| **Distinct files described anywhere** | **66** | body ∪ appendix |
| **Files named nowhere in the document** | **5** | see below |

**The three double-counted reports** — `kindness-calculus` (slots 22 & 40), `la-riva-grief-arc` (29 &
43), `naval-campaign-layer` (32 & 48) — are honestly labelled *"(Cross-listed)"* in the prose. The
defect is that the **§II layer table then presents its counts as a partition**: 6+5+8+18+7+5+7+9 = 65
only because three reports are counted in two layers. As a taxonomy of 62 files, the table is correct;
as a census of 65, it is circular.

**The five files named nowhere** — and naming every member is the point, because a residue you cannot
enumerate is not a population:

- `lab-report-loot-drop-weapon-economy.md` (Layer 1 — the sibling of the catalogued `loot-drop-system-v2`)
- `lab-report-plan-cleanup-v13.md` (Engine)
- `lab-report-plan-cleanup-v17.md` (Engine)
- `lab-report-plan-cleanup-world-builder-arc.md` (Engine)
- `lab-report-timeline-history-completed.md` (Engine)

**Two smaller asymmetries.** `api-01-02-mechanics-combat-review` appears in the body as slot 6, marked
*"(archived)"* — but the file was present in `lab-reports/` at `7d3615a` and is present at HEAD. It was
never archived; it was **omitted from the appendix**, and the note explains the omission as an event.
In the other direction, `npc-dialogue-system`, `npc-speak-sdk`, `void-shaman` and `web-of-connections`
appear only in Appendix A; the body's closing note at §X admits two of the four.

***A cross-listing is a good idea and a bad unit. The moment a taxonomy lets one item occupy two
slots, its slot count stops being a count of items — and this document then used the slot count as
its title.***

---

## V. Finding 2 — The Object Description Is an Older Build

§I.A describes the game. Measured at this report's own reference build:

| §I.A claim | At `89fa13b` | Verdict |
|---|---|---|
| "A 71-node narrative RPG" | **409** `NODE_MAP` entries | **wrong** — never true (76 → 149 → 409) |
| "~100 quests" | **2,834** `QUEST_DB` entries | **wrong** — 28× low |
| "66 terrain types" | **106** `WORLD_DB` entries | **wrong** — exactly the `32c10c5` (2026-05-24) value |
| "370+ monsters" | **392** `MONSTER_POOL` entries | **true as written** — and 370 is *exactly* the `32c10c5` value |
| "8 acts" | `act:0`–`act:8` | correct |
| "17 journal entries" | **41** | **wrong** — never true (§V.A) |
| Fighter Champion, cap L20 | *"capped at 20"* | correct |
| Four ending variants | `covenant` / `imperfect` / `efficient` / `cursed` | correct |
| Favorability, 6 named characters | the Birka six | correct |

Note the sentence *"370+ monsters across 66 terrain types."* **Both halves are the 2026-05-24 census**
— 370 and 66 are byte-exact at `32c10c5` — and only the `+` keeps the first half true three weeks
later. The paragraph was not measured; it was inherited.

### V.A — Seventeen, Forty-One, and Entry 42

This is the finding worth the whole pass, because the number is load-bearing.

`FROBERGER_JOURNAL@27184` runs `entryNum:1` through `entryNum:41@27225` — **41 entries, unchanged
since `32c10c5`, the earliest surviving build.** The report says 17, twice: once in §I.A and once in
§I.B, where it becomes the document's central structural parallel — *"Froberger left 17 journal
entries. Each entry is a lab report."*

The engine states the true figure in its own prose, three ways:

- Entry 41's text: *"I tried to give this knowledge away. **I wrote it in forty-one entries.**"*
- The journal UI at the baseline: *"Entry 42 is in the journal now. Forty-two entries."*
- The Covenant Keeper epilogue: *"Froberger's last entry was Entry 41@27308 — Come back."*

And the report's own conclusion depends on the correct value. Its closing line is *"Entry 42 — the
blank page — is the player's lab report,"* and slot 65 (`void-archaeology`) builds the thesis on the
player writing the 42nd entry. **41 + 1 = 42 is the arithmetic the argument requires.** At 17, Entry
42 is not the next page; it is nowhere in particular. The document's thesis and its data section
disagree, and the thesis is the half that is right.

*(A near-miss worth recording: `const JOURNAL_ENTRIES@22424` is a **different**, dead structure —
five node-keyed Froberger quotes, superseded by the `FROBERGER_JOURNAL` delivery system and marked
dead in its own header comment. It is not the source of the 17 either; it holds five.)*

---

## VI. Finding 3 — Two Node Codes Read Out of Code Comments → §AUDIT-03ba

Seven of the report's nine node codes are right, including one the sibling synthesis got wrong:
`CDG:{ num:77, code:'CDG', name:'cat_quarter', label:'The Cat Quarter'@8798` (part 6 wrote `CQ`),
`LIM:{ num:81, code:'LIM', name:'mimic_meadow', label:'The Mimic Meadows'@8815`,
`AMS:{ num:79, code:'AMS', name:'ruins', label:"Fishmonger's Row"@8801` (the La Riva grief arc),
`NUE:{ num:35, code:'NUE', name:'scholars_qtr'@8705` (*Scholar's Quarter — Weimar*), plus `TLS`,
`MHQ` and `GVA`.

Two are wrong, and both are wrong the same way.

**`CO` — "Loop Heart".** The string *"Loop Heart"* occurs **exactly once in the entire file**, at both
builds, and it is inside a comment: `(CO — Loop Heart / Codex Core Chamber)@21717`. `CO` was never a
`NODE_MAP` key; every block under that comment guards on `TLS`. The sibling `synthesis-part6` read the
**same comment** 53 minutes earlier and made the same error.

**`CY` — "CY madness".** `CY` is likewise never a `NODE_MAP` key. `// ── Layer 41: Drunk Pit Fight (CY
only)@24686` sits **two lines above** `_pb41.nodeCode === 'HKG'`. `CY` is `HKG:{ num:6,  code:'HKG', name:'cyberpunk_streets', label:'Neon Undercity'@8439`.

The engine settles both, and three more, in exactly one place — `const birkaNpcs@35139`:

> *"dead pre-§WALK sublocation codes remapped to real nodes … IN→TLL … TV→MHQ … BA→LLA … CY→HKG. No
> NODE_MAP entry ever existed for CI/IN/TV/BA/CY."*

**This is §AUDIT-03ba's mechanism reproduced in a second, independent document**, which matters
because it shows the vector is not one author's slip: *a code comment is the only prose the engine
offers, so it is what a documentation author reads — and comments are the one surface every repo
scanner is deliberately blind to.*

**It also extends the filed row.** §AUDIT-03ba censused 22 comments across `CI`/`CO`/`CQ`/`SQ`/`SF`/
`GC`/`MM`. `CY` is not in that list and carries **11 `// ── … ──` section headers** — more than `CI`
(7) or `CO` (8), the two the row leads with. `IN` (8), `BA` (5) and `TV` (1) are the same class. Filed
as an extension; see §X.

---

## VII. Finding 4 — Appendix B Cites the Wrong Sibling

The report attributes four architectural invariants to `synthesis-part7`, twice — in slot 56 and again
in Appendix B's heading.

**`synthesis-part7` contains none of them.** At `faddace` it has zero occurrences of `invariant`,
`idempot`, `BFS` or `boolean`. The four are verbatim from **`synthesis-part5-npc-narrative`, line
273**:

> *"The four architectural patterns are still invariants. `S_story` is truth. Renders are idempotent.
> BFS is one function. Modes are state booleans. Do not deviate."*

**All four verify true** at the reference build, so the content is sound and is retained in Appendix B
below. Only the citation was supplied from memory. This is the cheapest class of error to make and the
most expensive to inherit: a wrong pointer that resolves to a real document sends the next reader to a
file that does not contain the claim, and the claim is correct, so nothing ever forces a re-check.

---

## VIII. Finding 5 — Inherited Conclusions

Every one of the seven Layer-6 reports this document summarises has since been verified under §DOC-02.
Two of the conclusions it inherits are now known wrong **at their source**:

- **Slot 53 (part 4):** *"the global monster drop nerf (−3 to 0) that never shipped."* Inverted. At
  line 22,533 of this report's own reference build, `const deg = Math.floor(Math.random() * 4) - 3;
  // −3 to 0` — the nerf **had shipped**, three lines under a comment saying so. (§DOC-02be.)
- **Slot 55 (part 6) and Appendix A rows 22/54:** *"159 quests are tracked."* The figure is exact for
  the `kindness-calculus` build window (15:25–16:04 on an earlier day) and is repeated here in the
  present tense against a build holding **2,834** quests.

**NOT SHIPPED / NOT RE-VERIFIED, kept as written:** the report's layer-by-layer *"Connection to core
concept"* readings are editorial and are preserved unchanged. They are the document's actual
contribution and no measurement bears on them.

---

## IX. Discussion — What Survives

**The gradient holds.** Layer 0 reports cite probability tables; Layer 4 reports cite Pinker and the
quality of a silence in a dialogue scene. Same document structure, same headers, same
hypothesis-data-conclusion format. The form is constant; the content moves from numbers to meaning.
The single-file constraint forces it — because the dice mechanic and the grief arc live in the same
scope, their documentation coexists in one corpus, and one hand has to hold both ends of the rope.

**The cross-layer reports are the spine.** `luck-seventh-stat` (dice physics × prosocial behaviour),
`kindness-calculus` (quest data × moral philosophy), `friendships-with-magic` (implementation audit ×
philosophical statement), `endings-and-echoes` (completion conditions × meaning). Each forced the
writer to hold a mechanical claim and a narrative claim in the same hand and check they pointed at the
same thing. That is also what playing the game requires.

**The Engine reports are load-bearing silence.** They document tooling and sync passes — work that
shows only in the absence of failure. But a lab report citing `HTML line 8026` is useful only if line
8026 contains what the report says. The Engine reports are the apparatus maintaining that promise, and
this verification pass is the same apparatus running two months later.

**And the apparatus caught its own meta-report.** The document's thesis — that the corpus is the trust
infrastructure — is confirmed by the fact that its census was wrong for two months and the corpus
found it. That is the system working, not failing.

---

## X. Defects Filed

| # | Finding | Disposition |
|---|---|---|
| 1 | Corpus census: 71 files, 65 claimed, 62 enumerated, 5 unnamed | corrected in this document (§IV, Appendix A) |
| 2 | §I.A object description is the 2026-05-24 census | corrected in place (§V) |
| 3 | *"17 journal entries"* — true value 41 since `32c10c5` | corrected (§V.A) |
| 4 | `CO`/`CY` read from code comments | **§AUDIT-03ba EXTENDED** — `CY`/`IN`/`TV`/`BA` added to the census (25 further section-header comments) |
| 5 | Appendix B mis-attributed to part 7 | corrected to part 5 (§VII) |
| 6 | Inherited part-4 and part-6 conclusions | corrected (§VIII) |

No new track was opened: findings 1–3, 5 and 6 are defects *in this document* and are repaired here;
finding 4 belongs to an open row that already names the mechanism.

---

## XI. Conclusion

The corpus is not documentation *of* `roll2hit-v3.html`. It is the mechanism *by which*
`roll2hit-v3.html` was built. The game needed a way to hold design decisions stable across sessions;
the IEEE lab-report format supplied it; the corpus is the accumulated residue.

The stronger hypothesis — that the reports are structurally isomorphic to the game's core loop — also
holds:

1. **Form an expectation** (hypothesis) — the game asks: *what happens if I go north?*
2. **Gather data** (observation) — the game shows you what is there.
3. **Update state** (conclusion) — the game records it in `S_story`.
4. **Prepare the next expectation** — the game advances the day counter.

The lab report is the dice roll of the development process: probabilistic (the hypothesis may be
wrong), consequential (a wrong conclusion produces a bad architectural decision), and **recoverable
(the next report can correct it)**. This pass is that third property being exercised on the report
that proposed it.

The verification adds one clause to the original conclusion. This document argued that the corpus and
the game are both addressed to a future reader who will know more than the writer did. True — and the
reason both work is that the future reader is expected to *check*. Froberger's forty-one entries are
not authoritative because he wrote them; they are useful because the player walks the route and finds
out. A corpus that could not be re-measured would be a claim. One that can is an instrument.

*Entry 42 is still blank. That was always the point.*

---

## Appendix A — Catalog

**71 files present at 2026-06-16 14:19:02.** Rows 1–65 are the original catalog, verified: every
filename is real. `†` marks a cross-listing counted twice by the body's slot numbering. Rows 66–71 are
the files the original document named nowhere; they are added here, not substituted.

| # | Filename | Layer | Primary Connection |
|---|----------|-------|--------------------|
| 1 | ally-cat | 3 | Optional identity arc; prosocial commitment produces NPC title |
| 2 | architecture-full | Engine | Two-engine / single-file foundational spec |
| 3 | battleground-circuit-path-quest | 1 | Quest-terrain coupling; hit that becomes a destination |
| 4 | birka-beginner-arc | 3 | Act I NPC on-ramp; dice are punctuation, NPCs are sentences |
| 5 | cell-map-mud-redesign | 2 | Cell grid replaces named-neighbor; world gets grammar |
| 6 | ceremonia-roll-skill-checks | 3 | Social dice; competence as a roll, not a personality trait |
| 7 | circuit-map-theory | 2 | Failed predecessor to cells; its failure motivated the redesign |
| 8 | corelli-merchant | 3 | Quests that reveal the quest-giver; tutorial for La Riva |
| 9 | crown-three-hags | 3 | Dark mirror of prosocial system; kindness inverted |
| 10 | documentation-system-design | Engine | Docs as software; two-way sync discipline |
| 11 | drop-rates-balance-and-health | 0 | Cooperative DM Principle encoded as formula |
| 12 | dungeon-ten-themes | 3 | Dungeon as diagnostic; ten questions a room can ask |
| 13 | endings-and-echoes | 1 | Completion defined by prior choices, not final roll |
| 14 | epic-battlegrounds | 1 | Hit that becomes geography; probability turns spatial |
| 15 | fish-with-dnd | 0 | Roll in service of patience, not combat |
| 16 | fishing-bait-prompting | 0 | Conditional probability; dice are shapeable |
| 17 | friendships-with-magic | 4 | Core philosophy named; the game defined |
| 18 | game-story-codex-of-conquest | 4 | Narrative architecture; voice and theme unified |
| 19 | highway-mesh-entry | 2 | Every node must justify its existence |
| 20 | junction-reweave-overhaul | 2 | Reachability as freedom |
| 21 | kenickie-chronicle | 3 | Career statistics; the save file's autobiography |
| 22 | kindness-calculus † | 3/4 | 159 quests audited *(exact for its own build; 2,834 here)* |
| 23 | la-riva-grief-arc † | 3/4 | Grief space at `AMS`; rolling cannot fix everything |
| 24 | leveling-flashbang-condition-economy | 0 | Roll's meaning changes as the world does |
| 25 | littoral-courts | 3 | Four Ladies (Aurel/Calice/Mireille/Solen); refuse what you want |
| 26 | living-world | 3 | Off-screen characters; fullness makes choice meaningful |
| 27 | loot-drop-system-v2 | 1 | Three-channel economy; bridge between rolls |
| 28 | luck-seventh-stat | 0 | Dice encode moral system; helping friends improves rolls |
| 29 | map-audit-layout-tooling | 2 | Untrusted world cannot be played; audit is maintenance |
| 30 | mega-reweave | 2 | Full traversal achieved; no terminal geography |
| 31 | meta-process-loop-expansion | Engine | Lab-report method documented; tool documents itself |
| 32 | movement-by-cells | 2 | Navigation as complete specification; BFS invariant |
| 33 | narrative-arcs-brynn-bruhns-yael | 4 | Three voices, one mechanical system; NPC design textbook |
| 34 | naval-campaign-layer † | 3/5 | New geography with distinct physics; world's growing edge |
| 35 | ng-plus-remembrance | 1 | Memory as stat; second roll changed by first |
| 36 | node-network-reconnection | 2 | 100% reachability; world promises no terminal state |
| 37 | npc-dialogue-system | 3 | 6×4×5 architecture; favorability as mechanical language |
| 38 | npc-speak-sdk | 3 | Dynamic dialogue via Claude SDK; NPC voice extended |
| 39 | Polyphonic-Organ-Synth | 4 | One-file music; constraint as generative force |
| 40 | ponies-unicorns-aspirations-future-ideas | 5 | Giveable futures; constraint shapes the dream |
| 41 | prompt-migration-arena-to-prototype | Engine | Spec-first discipline; origin story of documentation |
| 42 | quest-api-architecture | 3 | Quests become declarations, not procedures |
| 43 | quest-data-code-separation | 3 | Data and behavior separated; world readable |
| 44 | quest-minus-one-world-creator | 3 | Post-game transparency; sharing as final mechanic |
| 45 | saul-paul-travel-reference | 5 | Historical grounding for conversion arc |
| 46 | saul-paul-vignette-spec | 5 | Two voices for one person; knowledge as weapon then gift |
| 47 | sp4-documentation-sync-pass | Engine | Docs practice what game preaches; honesty enforced |
| 48 | story-codoex-curse-of-knowedge | 4 | Thesis formalized; intelligence without generosity is void |
| 49 | synthesis-part1-architecture | 6 | Architecture reports verified against live HTML |
| 50 | synthesis-part2-combat-mechanics | 6 | Mechanics reports verified; probability still moral |
| 51 | synthesis-part3-world-navigation | 6 | Navigation reports verified; BFS invariant confirmed |
| 52 | synthesis-part4-monsters-fishing | 6 | Loot vectors verified *(its "nerf never shipped" is inverted — §VIII)* |
| 53 | synthesis-part5-npc-narrative | 6 | NPC system verified; **true source of Appendix B** |
| 54 | synthesis-part6-quest-arcs | 6 | Quest arcs verified; 159 is that report's build, not this one |
| 55 | synthesis-part7-writing-design-philosophy | 6 | Writing philosophy verified across 33,721 lines |
| 56 | tattoo-progression-system | 1 | Death-persistent marks; choices outlast the character |
| 57 | tilbury-visby-arcs | 3 | Investigation as combat alternative; knowing = hitting |
| 58 | void-archaeology | Engine | Entry 42; player becomes the latest researcher |
| 59 | void-shaman | 3 | Warden as a system that outlasted its purpose |
| 60 | wbapi-architecture | Engine | Single source of truth; WBAPI as lens, not substitute |
| 61 | wbapi-evolution | Engine | Tooling grew as world did; intuitive → formal |
| 62 | wbapi | Engine | Maintenance interface; change world without breaking it |
| 63 | web-of-connections | 3 | Froberger's distributed traces; discovery as mechanic |
| 64 | weimar-scholar-gate | 3 | Archive as in-world docs at `NUE`; hoarded knowledge causes Void |
| 65 | wisdom-arc | 5 | Post-victory question; what do you do with what you know |
| **66** | **api-01-02-mechanics-combat-review** | **0** | **Body slot 6 called this "archived"; the file was present then and is present now** |
| **67** | **loot-drop-weapon-economy** | **1** | **Weapon economy; sibling of row 27 — named nowhere in the original** |
| **68** | **plan-cleanup-v13** | **Engine** | **Spec-hygiene pass — named nowhere in the original** |
| **69** | **plan-cleanup-v17** | **Engine** | **Spec-hygiene pass — named nowhere in the original** |
| **70** | **plan-cleanup-world-builder-arc** | **Engine** | **Spec-hygiene pass — named nowhere in the original** |
| **71** | **timeline-history-completed** | **Engine** | **Project chronology — named nowhere in the original** |

---

## Appendix B — The Four Invariants

**Source corrected:** `lab-report-synthesis-part5-npc-narrative.md`, line 273 — *not* part 7, which
contains none of these terms. All four verified at `89fa13b`.

1. **`S_story` is truth.** Every fact about the world lives in the state object; no function holds
   shadow state. ✅
2. **Renders are idempotent.** `storyRender()` can be called any number of times and produces the same
   result from the same state; it destroys and rebuilds its DOM targets. ✅
3. **One BFS.** `function _bfsGridPath@37759` is the single pathfinding primitive;
   `function _bfsGridDir@37803` is a four-line wrapper that calls it and reads the first step. There is
   no second pathfinder. ✅
4. **Modes are booleans.** Battle Mode and Story Mode are not states of a state machine — `S_story.active`
   is set `true`/`false` at six sites. The game is always in both modes, with one suppressed. ✅

These are not about dice or NPCs. They are about what the game **promises**. A game that promises to be
completable must be computable. A game that promises honesty about the world must store truth in one
place. A game that promises the world is traversable must have a single provable path-finder. A game
that promises you can be in two states at once — fighting and choosing, rolling and remembering — must
not resolve that duality into a sequence.

---

*End of Lab Report — The Corpus as Architecture*

*Written 2026-06-16 · 33,721 lines · 71 reports on disk, 65 catalogued, 41 journal entries, 1 blank page left*
*Verified 2026-08-14 (§DOC-02bi) · HISTORY document — claims that did not hold are marked, never deleted*
