<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — Companion Narrative Arcs, Layers 70 · 72 · 74

## §XXXV The First Inn Light · §XXXVII Commander Bruhns's CO Scene · §XXXIX Yael's Named Report

**Original:** CodexOfConquest.com design session, 2026-05-25 · **Verified against HEAD:** 2026-08-12 (§DOC-02y)
**Ship commit:** `43610d3` (2026-05-25 07:06) *"Layers 63–74: complete Tier 1 implementation"*
**Report's own tree:** `585be8f`…`0a131f5` (2026-05-25 13:12–13:35) — all four cited line numbers exact
**License:** MIT — CodexOfConquest.com — Copyright (c) 2026 Paul Richeson

---

## Abstract

Three companion arcs, each a scene-const plus a render patch: no new nodes, monsters, items or
gameplay systems. Brynn keeps a lamp burning at the inn for travellers who have not come back. Bruhns
tells the player, before the last fight, that she is no longer sure she believed the right people.
Yael says she filed a report under her own name and then goes back on patrol. The editorial objective
is stated plainly and it is the reason the layers exist: **let the three structurally most important
NPCs close their arcs on their own terms rather than the player's.**

Verification finds an unusually faithful implementation with an unusually consequential margin.
**All four scene consts, all five new state flags and all three trigger predicates are live and
verbatim at HEAD after seventy-nine days and a total world-coordinate migration.** Three named
identifiers, however, have **zero commits in the file's entire history** — one of them in the report's
opening sentence — and one of the four surfaces is unreachable.

The finding that outranks the rest is not about this report at all. Chasing its four dead node codes
through the archive closes an open sweep: **the engine's own comment claims eight node codes "never
existed," and seven of them are real `NODE_MAP` entries in the earliest surviving build — while the
comment transcribes their labels off the very entries it denies.**

---

## I. Intent, Inspiration, and What It Adds

### A. The gap it was written against

Before Layer 70 the game resolved companion relationships through favor scores, and favor bought
things: dialogue variants, escort availability, a farewell line in Act VIII. Every one of those is a
*reward*. None of them is a scene in which the companion has an interior life the player did not
purchase. A relationship system that only ever pays out teaches the player that the characters are
vending machines with good dialogue.

### B. The design constraint, and why it produced better writing

Structural minimalism, self-imposed: no new nodes, no combat-table edits, no `MONSTER_POOL` /
`WORLD_DB` schema changes. Narrative weight has to come entirely from scene-const strings injected
into existing render paths at precisely conditioned moments. The constraint is the craft — with no
mechanism to hide behind, a companion speaks only when the game has genuinely earned the speech, and
the condition *is* the design.

### C. What it buys the player

1. **It converts a number into a person.** Favor stops being a gate and starts being a threshold
   somebody crosses toward you. The lamp is the clearest case: it costs nothing, unlocks nothing, and
   is the only artifact in the inn that exists because of you.
2. **It makes the last boss a conversation.** Bruhns is Auros. The CO fight is a confrontation with
   the NPC whose favor the player has been building for eight acts, and Layer 72 is the difference
   between a health bar and someone saying *"I signed on because I believed them. I'm not sure any
   more"* and then raising her weapon anyway.
3. **It models consequence the player cannot buy off.** Yael's report is already filed when she tells
   you. Both player replies set the same flag and change nothing, deliberately — *"the player is
   responding to a fact, not making a decision that determines an outcome."* In a game whose every
   other surface is a lever, one scene that is not a lever is worth a great deal.
4. **It leaves residue.** The lamp line, the patrol ambient, the epilogue rows: small permanent traces
   that a player either notices or does not. The report calls that asymmetry the point, and it is.

> The design's own summary is the best line in it: *"The arcs close because the characters close them.
> The player witnesses."* Seventy-nine days later, three of the four surfaces that carry that sentence
> still render.

---

## II. Method

Instruments from the §DOC-02 program: **4/8/18** (`git log -S` on every dead name; the archive
`32c10c5` predates the feature by nine hours, so the birth commit `43610d3` is the reference);
**12** (score copied passages apart from composed ones); **10** (a post-mortem's self-description is a
claim); **13** (score a reversal against the report's thesis, not its spec); **19** (a reachability
closure over cell primacy and gate flags, not a symbol census); **21** (read the diff, not the subject
line — and its corollary, that a dead node code is usually a *retirement*).

Line-number dating was done by walking the 2026-05-25/27 commit series for the tree whose four cited
consts land on the cited lines.

---

## III. As-Built Inventory

**Scene consts — 4 of 4 live**

`const BRYNN_KEEPER_STORY = {@27171` (10 keys: 2 beats, prompt, 2 choices, 4 farewells) ·
`const BRUHNS_CO_SCENE = {@28203` (3 variants) · `const YAEL_NAMED_REPORT_SCENE = {@28189` (setup,
decision, 2 choices) · `const YAEL_PATROL_NODES = [@27869` (pre-existing, L45-G; the addendum entry
added here).

**State flags — 5 of 5 live under their specified names, in the specified order, one contiguous block**

`brynnKeeperStoryTold: false, brynnLightChoiceMade: false, brynnLightKept: false,@23150` ·
`bruhnsCoSceneDelivered: false,@23151` · `yaelNamedReportDelivered: false,@23152`.

**Trigger predicates — 3 of 3 verbatim**

| Layer | HEAD | Report §2.1/§3.1/§4.1 |
|---|---|---|
| 70 Beat 1 | `if (node.code === 'TLL' && _npcFavor('brynn') >= 1@33030` + `actNumber >= 2` + `!brynnKeeperStoryTold` | identical |
| 70 Beat 2 | `if (node.code === 'TLL' && _npcFavor('brynn') >= 2@33055` + `brynnKeeperStoryTold` + `!brynnLightChoiceMade` | identical |
| 74 | `if (node.code === 'LHR' && _npcFavor('yael') >= 2@32704` + `actNumber >= 6` + `yaelEscortUsed` + `!yaelNamedReportDelivered` | identical |

**Never shipped — 3 identifiers, 0 commits ever**

| Name | Where the report puts it | What actually happened |
|---|---|---|
| `fav_brynn` | **the opening sentence** of §1, as one of three favor accessors | the accessor is `_npcFavor('brynn')`; this field has never existed |
| `TC_BRYNN_LAMP` | §2.1, the Town Crier integration | the **feature shipped** under `brynnKeeperStoryTold:      'The lamp at the First Inn@26909`, reached through `qOrder = @26999` |
| `NODE_ARRIVAL_QUOTES` | §3.1, the named injection point | no such const has ever existed |

**Node codes — 0 of 4 resolve.** `IN`→`TLL` · `CO`→`TLS` · `CI`→`LHR` · `SW`→`MSY`. All four are
**renames**, verified by a `num` + terrain-key + label triple-match against the archive (§V-A). Note
that `CI` is now live as a *different* node (Chancery Court, `num:429`) — §AUDIT-03m's "worse than
dead" class, so an existence check passes while the sentence stays wrong.

---

## IV. Spec → Shipped Delta Table

| # | Claim | Measured at HEAD | Verdict |
|---|---|---|---|
| 1 | `BRYNN_KEEPER_STORY` + 3 flags | live, all keys present | ✅ EXACT |
| 2 | `BRUHNS_CO_SCENE` 3 variants; theory addendum *appends*, does not replace | `coSceneText += '\n\n' + BRUHNS_CO_SCENE.dearFriendWithTheory` — exactly as specified | ✅ EXACT |
| 3 | `YAEL_NAMED_REPORT_SCENE` + trigger triple | verbatim | ✅ EXACT |
| 4 | Bruhns variant gate `_npcFavor('bruhns')` | **0 occurrences**; HEAD reads `const fav = _npcFavor('auros');@35197` | ⚠️ REPAIRED BY §AUDIT-03n (§V-C) |
| 5 | Beat 2 `keep`/`rest` set `brynnLightKept` | live, both branches | ✅ EXACT |
| 6 | Four-branch Act VIII farewell, **"one inert branch, unreachable by design"** | a **three-flag priority chain, zero inert branches**, whose first branch is a catch-up delivery | ❌ **REVERSED — and better** (§V-D) |
| 7 | Yael choice labels "Affirm" / "Acknowledge risk" | shipped as `📋 I'll hold it.` / `🗂 Three copies is enough.` (`choiceHold`/`choiceThree`); structure identical, both set the flag, neither branches | ⚠️ PARAPHRASE |
| 8 | SW patrol addendum gated on `yaelNamedReportDelivered` | shipped: `nodeSlug:'MSY'@27870` — **and cannot render** (§V-B) | ⛔ STRANDED |
| 9 | §XXXVI epilogue line, *"intentionally passive voice… Yael's name is not in the epilogue text"* | *"Yael kept three copies of the second report. She knows exactly where each one is."* — active voice, her name first | ❌ SELF-DESCRIPTION WRONG |
| 10 | Cross-dependency `s29LineDelivered`, one-directional and read-only | correct: written once at `S_story.s29LineDelivered = true;@32885`, read once here | ✅ EXACT |
| 11 | `yaelEscortUsed` set by the escort mechanic | one writer, `S_story.yaelEscortUsed = true;@23835` | ✅ EXACT |
| 12 | §6: *"the implementation cost is eight state flags"* | the tables list **five**; eight only if `yaelEscortUsed`, `s29LineDelivered` and `fav_brynn` are counted — and the last has never existed | ❌ ARITHMETIC |
| 13 | Four cited line numbers (L11573 · L12611 · L12625 · L12306) and the flag block (L8419–8421) | **all exact**, window `585be8f`…`0a131f5` | ✅ EXACT |
| 14 | *(engine-side)* `YAEL_NAMED_REPORT_SCENE`'s own `// → doc:` comment | says **"fav >= 2 Act IV+"**; the guard says `>= 6` | ❌ COMMENT/CODE |
| 15 | *(engine-side)* the setup string | *"watching the market corner from the **CI** door"* — a dead code in a **player-facing string** | ❌ §AUDIT-03s |

---

## V. Findings

### A. Eight "never existed" claims, seven false — and the sweep §AUDIT-03af asked for, closed

Chasing this report's four dead node codes into the archive lands on an engine comment. `const birkaNpcs@35347`
remaps five Birka NPC codes and justifies itself like this:

> *"§PLAY-01-G: dead pre-§WALK sublocation codes remapped to real nodes, each proved by its NPC's
> quest activateNode — IN→TLL (brynn/**"The First Inn"**), TV→MHQ (quill/**"Birka Tavern"**),
> BA→LLA (pachelbel/**"The Rough Bar"**), CY→HKG (crov Weckmann + auros Bruhns/**"Neon Undercity"**).
> LHR was the §PLAY-01-D CI→LHR fix. **No NODE_MAP entry ever existed for CI/IN/TV/BA/CY**, so these
> cards previously rendered nowhere."*

and two lines later, for §NPC-01-SF4: *"No NODE_MAP entry ever existed for CQ/SQ/GC either."*

**Eight claims. At `32c10c5` (2026-05-24, the earliest surviving build) seven are false:**

| Code | Archive `32c10c5` | Remap target at HEAD | Rename correct? |
|---|---|---|---|
| `CI` | `num:1, name:'city', "City Streets — Birka", act:1` | `LHR` `num:1, 'city', "City Streets — Birka"` | ✅ |
| `IN` | `num:2, name:'inn', "The First Inn", act:1` | `TLL` `num:2, 'inn', 'The First Inn'` | ✅ |
| `TV` | `num:3, name:'tavern', "Birka Tavern", act:1` | `MHQ` `num:3, 'tavern', 'Birka Tavern'` | ✅ |
| `BA` | `num:4, name:'bar', "The Rough Bar", act:1` | `LLA` `num:4, 'bar', 'The Rough Bar'` | ✅ |
| `CY` | `num:6, name:'cyberpunk_streets', "Neon Undercity"` | `HKG` `num:6, same, same` | ✅ |
| `SQ` | `num:35, name:'scholars_qtr', "Scholar's Quarter — Weimar"` | `NUE` `num:35, same, same` | ✅ |
| `GC` | `num:26, name:'goblin_cave', "Goblin Warrens"` | `TRD` `num:26, same, same` | ✅ |
| `CQ` | **absent** — the one true claim | `CDG` | ✅ |

**The comment transcribes the labels off the very `NODE_MAP` entries it says never existed.** *"The
First Inn," "Birka Tavern," "The Rough Bar," "Neon Undercity"* are copied, character for character,
from records the same sentence denies. The author was reading the archive's data while writing a
sentence about its absence — self-refutation inside one comment, which is §DOC-02q's rule appearing in
engine source rather than in prose.

**And this report is a same-week witness.** It was written 2026-05-25, describes scenes "anchored to
the IN node" and "the CI node," and those scenes shipped and rendered.

**The verdict is the opposite of §DOC-02u's, and that is the useful part.** Every one of the seven is
a **rename**: `num`, terrain key and label match on all three fields, exactly as §DOC-02f found for
`CI`/`LHR` alone. The false premise produced seven correct answers, because the author was silently
matching on labels. But §DOC-02u measured the same "born dead" standard licensing a *wrong* answer —
`LJ3`, a retired node holding §SIREN-01's hardest battle, remapped onto the fog bank it existed to
point at. **So: fix the comments, keep the remaps.** → **§AUDIT-03af scoped and answered.**

> ***The durable form: a migration comment's "never existed" is the least reliable sentence in a
> codebase, because it is the one claim the migrator had no reason to check — the remap already
> worked. Its danger is not the sentence; it is the STANDARD it establishes for the next remap, which
> may not have a label to match on.***

### B. The patrol addendum shipped, was remapped correctly, and cannot render — §AUDIT-03x extended

`{ condition: () => !!(S_story.yaelNamedReportDelivered), nodeSlug:'MSY'@27874` — *"The second report
is filed. I'm not watching to see if it disappears."* The SW→MSY remap is right and the gate is right.

`MSY:{r:25,c:206},@9685` puts it in a cell with **twelve** occupants, and `const CELL_GRID = (() => {@9865`
builds each cell in `NODE_MAP` declaration order with only `list[0]` able to become `currentCode`.
`WG0` is first. MSY is **ninth**. The render test is `yaelPatrol.nodeSlug === node.code`, so it never
passes.

**Cell `25,206` is the largest single casualty site the program has measured, and it is worse than
recorded.** §DOC-02h scored it for §CROWN-01 and stranded seven swamp nodes there. The full occupant
list is `WG0 · HW1 · HJ1 · HG1 · HJ2 · HN1 · HJ3 · HCA · MSY · SDQ · OTP · DBN` — **11 of 12
stranded**, and the last four belong to three unrelated tracks: **MSY** (this arc's patrol beat),
`SDQ:{ num:16@8677` (The Crones' Domain), `OTP:{ num:62@8774` (Trench Titan, an **§EPIC-01**
battleground) and `DBN` (Danube Ferry Crossing).

> ***A cell-primacy casualty is not an arc-level event. One cell can take content from four
> independent tracks, so scoring §AUDIT-03x arc by arc systematically undercounts it — the unit of
> damage is the CELL, not the feature.*** Closure totals reproduced exactly: **416 nodes / 244 cells**
> (instrument 14).

### C. This report is the primary source that made §AUDIT-03n's repair correct, and nothing connected them

§3.1 carries a flat statement of fact:

> *"Character note from plan.md: Commander Seraphine Bruhns and Commander Auros are the same
> character. The CO boss fight is a confrontation with the NPC the player has been building favor with
> across the arc."*

That sentence is precisely what justifies HEAD's `const fav = _npcFavor('auros');@35197`. The report's
own spec says `_npcFavor('bruhns')`, which has **0 occurrences** at HEAD — it was one of §AUDIT-03n's
five gate sites keyed to a surname the favor ledger never writes, each guarding a whole scene. Without
the repair, `fav` is `0` and neither variant fires: **Bruhns says nothing at the last fight, for every
player, forever.**

§AUDIT-03n found it sixty-four days later, from two `npcOrder` lists that disagreed. The identity was
sitting in a lab report the whole time, in English, in a paragraph headed *"Character note."*

> ***A corpus can hold the answer to a defect in prose and no gate can read prose. That is the argument
> for the delta table this program produces — not because the prose is unreliable, but because it is
> unindexed.***

### D. The farewell table shipped as a different, better shape — instrument 13

The report describes a four-branch table resolved by `(brynnKeeperStoryTold, brynnLightKept)`, with the
fourth row an unreachable fallback, and defends keeping it: *"The dead branch costs nothing."*

HEAD ships a **three-flag priority chain with no dead branch at all**: `!storyTold` → `!choiceMade` →
`lightKept` → `else`. And the first branch is not a default. It is a **catch-up delivery**:

> `farewellNoStory:  '"There's a lamp in the corner that's been burning since your first night. I wanted you to know that."'`

`lampLine = BRYNN_KEEPER_STORY.farewellNoStory;@27027` is immediately followed by
`S_story.brynnKeeperStoryTold = true`, so a player who never found Beat 1 still gets the lamp told to
them at the door in Act VIII, and the epilogue row keyed on that flag then reads truthfully rather than
inventing a conversation. Scored against the report's own thesis — *the arcs close because the
characters close them* — the shipped design serves it better than the spec, which would have left the
inattentive player with nothing.

**One shape worth noting rather than filing loudly:** that write happens inside a `text: () => {…}`
getter — a *render* path mutating a *progression* flag that two downstream consumers read (the Town
Crier's `qOrder = @26999`, and the epilogue). It is safe today only because `_renderNpcCard` latches
`act8FarewellBrynn` **before** calling `beat.text()`. Remove that latch, or call the getter twice for a
preview, and the branch silently advances. → a small §DX row.

### E. What held, and where it did not — instrument 12, fifteenth consecutive confirmation

Everything **transcribable** is exact: four consts, five flags, three trigger predicates, the
append-not-replace semantics of the theory addendum, the one-directional cross-dependency, four line
numbers. Everything **composed** carries the errors: three identifiers with zero commits ever, a flag
count that only reaches eight by including one of them, two paraphrased choice labels, and a
post-mortem paragraph praising the passive voice of a line that is active and starts with Yael's name.

The `TC_BRYNN_LAMP` case is the corpus's recurring pattern in miniature: **the feature shipped and the
name did not.** The Town Crier does reference the lamp — through
`brynnKeeperStoryTold:      'The lamp at the First Inn@26909` — exactly as designed, under no name at
all. A reader grepping the const would conclude the integration was never built.

### F. Reachability closure (instrument 19)

| Surface | Node | Cell | Verdict |
|---|---|---|---|
| Brynn Beats 1–2 + ambient | `TLL` | `10,204` — alone | ✅ REACHABLE |
| Yael Named Report | `LHR` | `10,197` — `list[0]`, `BK` behind it | ✅ REACHABLE |
| Bruhns CO scene | `TLS` | `26,181` — alone | ✅ REACHABLE |
| Yael patrol addendum | `MSY` | `25,206` — **9th of 12** | ⛔ UNREACHABLE |

Gate flags close cleanly: `yaelEscortUsed` has one writer at a live button; `s29LineDelivered` has one
writer inside the `HKG` npc-row block, itself gated on `frobergerLastEntryRead && _npcFavor('auros') >= 2`.
Three of four surfaces render. **The arc layer is in far better shape than most content the program has
measured** — and note *why*: it added no nodes, so the migration that stranded eleven nodes in one cell
had almost nothing of this layer to catch. *Structural minimalism turned out to be a survival trait.*

---

## VI. Defects Filed

- **§AUDIT-03af (existing, SCOPED AND ANSWERED)** — the sweep it requested is done. `const birkaNpcs@35347`
  and the §NPC-01-SF4 note make **eight** "no NODE_MAP entry ever existed" claims; **seven are false**
  against `32c10c5` (only `CQ` holds). All seven remaps are nonetheless **correct renames**
  (`num` + terrain key + label match). **Fix the comments; keep the remaps** — the opposite verdict to
  §DOC-02u's `LJ3`, where the same standard licensed a wrong answer. Replace *"never existed"* with
  *"retired by §WALK/§NAV-01; the node survived under a new key, `num` preserved."*
- **§AUDIT-03x (existing, EXTENDED — and a change of unit)** — cell `25,206` strands **11 of 12**
  occupants, not the 7 §DOC-02h attributed to §CROWN-01. The other four are `MSY` (this arc), `SDQ`,
  `OTP` (an §EPIC-01 battleground) and `DBN`, from three unrelated tracks. **Score §AUDIT-03x by CELL,
  not by arc**; the per-arc method undercounts by construction.
- **§DX-02ae (NEW, 🟢 no design call)** — `ACT8_FAREWELL_BEATS.brynn.text` is a `text: () => {…}`
  getter that writes `S_story.brynnKeeperStoryTold = true`. A render accessor mutating progression
  state, read downstream by the Town Crier and the epilogue; correct today only because
  `_renderNpcCard` latches its once-flag before invoking the getter. Move the write to the call site,
  beside the latch. Also in the same row: `YAEL_NAMED_REPORT_SCENE`'s own `// → doc:` comment says
  *"fav >= 2 Act IV+"* while the guard reads `>= 6`.
- **§AUDIT-03s (existing, +2 player-facing hits)** — `YAEL_NAMED_REPORT_SCENE.setup` says *"watching
  the market corner from the **CI** door"*, and `const S29_AUROS_THEORY@27184`'s header comment says
  *"fires at **CY**"*. `CI` is the worse of the two: it resolves to a **different live node**, so every
  existence check passes while the sentence is wrong.
- **§AUDIT-03z (b) (existing, independently re-confirmed)** — `S29_AUROS_THEORY`'s comment still states
  the trigger as `fav_auros >= 2`, a field with exactly one occurrence in 38,712 lines: that comment.
  The live guard is `_npcFavor('auros') >= 2`. Reached here from a different direction, 
  which is corroboration rather than a duplicate.
- **Not filed:** the three zero-commit identifiers are recorded **NOT SHIPPED and kept** in §III. They
  are report-side, not engine-side, and one of them (`TC_BRYNN_LAMP`) names a feature that shipped.

---

## VII. File References

| Anchor | Content |
|---|---|
| `const BRYNN_KEEPER_STORY = {@27171` · `farewellNoStory:@27177` | Layer 70, and the catch-up branch |
| `brynnKeeperStoryTold: false, brynnLightChoiceMade: false, brynnLightKept: false,@23150` | the three flags, one line, specified order |
| `if (node.code === 'TLL' && _npcFavor('brynn') >= 1@33030` · `if (node.code === 'TLL' && _npcFavor('brynn') >= 2@33055` | Beats 1 and 2, verbatim triggers |
| `lampLine = BRYNN_KEEPER_STORY.farewellNoStory;@27027` · `qOrder = @26999` · `brynnKeeperStoryTold:      'The lamp at the First Inn@26909` | §V-D and the Town Crier that shipped without `TC_BRYNN_LAMP` |
| `const BRUHNS_CO_SCENE = {@28203` · `bruhnsCoSceneDelivered: false,@23151` | Layer 72 |
| `if (node.code === 'TLS' && !S_story.defeatedBattles@35196` · `const fav = _npcFavor('auros');@35197` | the §AUDIT-03n repair this report justifies (§V-C) |
| `const S29_AUROS_THEORY@27184` · `S_story.s29LineDelivered = true;@32885` | the one cross-dependency |
| `const YAEL_NAMED_REPORT_SCENE = {@28189` · `yaelNamedReportDelivered: false,@23152` | Layer 74 |
| `if (node.code === 'LHR' && _npcFavor('yael') >= 2@32704` · `S_story.yaelEscortUsed = true;@23835` | the trigger triple and its one writer |
| `const YAEL_PATROL_NODES = [@27869` · `nodeSlug:'MSY'@27870` · `MSY:{r:25,c:206},@9685` · `const CELL_GRID = (() => {@9865` | the stranded addendum (§V-B) |
| `SDQ:{ num:16@8677` · `OTP:{ num:62@8774` | cell `25,206`'s other tracks |
| `cond: () => !!(S_story.yaelNamedReportDelivered)@28257` · `Yael kept three copies@28258` | the epilogue row, active voice |
| `const birkaNpcs@35347` | the eight "never existed" claims (§V-A) |
| `32c10c5` · `43610d3` · `585be8f`…`0a131f5` | archive · ship commit · the report's own tree |

---

## VIII. Conclusion, Re-Scored

The original conclusion holds and can be stated more precisely than it was. *"No nodes, monsters, or
items were added. The single-file architecture was not structurally modified."* — true, and it turned
out to be the layer's insurance policy. Three of four surfaces still render at HEAD after a coordinate
migration that stranded eleven nodes in a single cell, and the one casualty is the only surface that
depends on standing somewhere specific.

The implementation cost was five state flags, not eight, and four scene consts rather than three. The
three identifiers the report names that the file has never held cost nothing at runtime and one full
audit row at reading time, because the Town Crier integration looks unbuilt to anyone who greps for it.

And the sentence that turned out to matter most was not in the specification at all. It is in §3.1,
under a heading that reads *"Character note"*: **Bruhns and Auros are the same person.** A gate found
that sixty-four days later by noticing two lists disagreed. The report had simply said so.

> *"The arcs close because the characters close them. The player witnesses."* Three of them still do.
> Yael, characteristically, is the one standing in a field where nobody can see her — which is either
> a coordinate bug or the most on-theme casualty in the corpus, and this verification declines to
> choose.

---

**Filed:** 2026-05-25 · **Verified:** 2026-08-12
**Cross-references:** `world.md` §The First Inn Light · §Yael's Named Report Scene · `story.md`
§Commander Bruhns CO Scene · `plan-archive.md` §XXXII · BACKLOG §AUDIT-03af / §AUDIT-03x / §AUDIT-03n

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
