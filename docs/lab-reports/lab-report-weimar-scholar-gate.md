<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — Layer 51: Weimar Scholar Gate

**IEEE-Format Post-Mortem** · **Original date:** 2026-05-25 · **Layer:** 51 · **Section:** §XVI
**Ship commit:** `194a810` · **Codebase:** `play.html` — single-file browser RPG

> **VERIFIED 2026-08-13 (§DOC-02ar).** Re-measured claim-by-claim against HEAD (38,712 lines ·
> 416 nodes · 2,853 quests) and against the arc's own ship tree. This is a **HISTORY** document:
> claims that did not ship are marked **NOT SHIPPED** and kept, never deleted — a silently removed
> claim reads as one that held. Original line numbers are retained only where quoted; live
> pointers are `` `symbol@line` `` anchors.

---

## Abstract

Layer 51 turns the Scholar's Quarter from a shard pickup into the game's only piece of
*institutional* history: a four-quest arc that answers who Froberger was, why his access was
revoked, and who preceded him. It introduces two named NPCs (Archivist Isolde Voss, ex-Scholar
Benedikt Rasp), one monster (`scholars_guard`), a new item class (**tomes** — the first carried
objects that grant permanent combat bonuses), a three-document archive interface, and a day-gated
reading circle. The reveal — the First Researcher's name — is the declared prerequisite for
Layer 52 (Void Archaeology).

**Verification result.** The report is, by identifier census, **the most accurate document the
program has measured: 42 of 42 named identifiers resolve at HEAD (100 %)**, every statline, bonus,
flag, formula and quoted line byte-exact across 80 days and the §ARCH-01 format migration. **And
the arc has never been completable past its second quest.** Two independent, mutually-hidden
defects — a state field that was mistyped in the implementation and named *correctly* in this
report, and a completion condition that is its own effect — stop the chain at 2 of 4, strand both
later tomes, and make the arc's climax (`Marta Eilene Vass`) a string that has never rendered.

> ***The lesson of this increment, and it retires the comfortable version of the census: a census
> proves a name exists. It cannot prove the engine reads the name the spec wrote.***

---

## I. Design Intent — and what it buys the player

Retained from the original, condensed. This section is *why the layer exists*; it verified sound
and is the part worth keeping intact.

### A. The Weimar gap

The Scholar's Quarter existed as a passive story node: Archivus Ptolemy Sweelinck, the Weimar
Fragment (Shard #7), ambient lore about old books. Froberger's journal cites the Scholar Kings
constantly; the place they ran had no mechanical payoff and no reason to revisit.

The Scholar Gate makes it the locus of Froberger's *institutional* history. The player arrives for
a shard and leaves with a bureaucratic answer to a mythic question: **the Void did not kill
Froberger — a committee revoked his access and left him in the field without backing.** That is
the arc's argument, and it is the reason the layer is filed under investigation rather than combat.

**Playability contribution.** The arc adds a *research* verb to a game whose other verbs are walk,
fight and talk. Its currency is reading order, not damage: three documents that each withhold
something, a trust gate measured in days rather than gold, and a name you have to earn twice.
It also gives Weimar a second visit — a node that previously emptied on first arrival.

### B. Tomes — the first passive-bonus item class

Inventory had relics, consumables and key items; nothing carried gave a standing numerical
benefit. Tomes are readable items with `type:'tome'` and a `bonus` object touching three combat
systems. The mechanic pays quest completion in **lasting capability** rather than gold or a
one-shot.

Each bonus was chosen to match its book:

| Tome | Bonus | Its own line |
|---|---|---|
| Froberger's Field Notes | +1 death save | *"The pressure is survivable if you know it's coming."* |
| Scholar Kings' History | +2 initiative | *"First knowledge, then decision, then action."* |
| Benedikt's Annotated Copy | +1 atk while a quest is active | *"He was right about this one too." — B. Rasp* |

**Playability contribution.** A death-save bonus is the only stat in the game that pays out at the
moment the player is least able to act, and it arrives from a *book*. That is the whole design
thesis of the layer in one item: scholarship as survivability.

### C. The First Researcher problem

Document 1 (the revocation letter) says what happened to Froberger. Document 2 (the field report)
shows what the institution dismissed. Document 3 — the personnel file — is **redacted**. The
researcher who came before Froberger, who built the containment structure, has no name on the page.

Earning it takes Benedikt's trust across three reading-circle sessions, then `quest_wm_04`, then a
return to the archive to see `[REDACTED]` become **Marta Eilene Vass**. That unredaction is the
arc's narrative climax and the stated entry condition for §XVII.

---

## II. Verification Method

1. **Batch census first.** Every identifier the report names, through one `grep -c` loop, before
   reading a line of the source. Partition into live / dead before forming any thesis.
2. **`git log -S <symbol>` on every dead or suspicious name**, to separate RETIRED (shipped, later
   removed) from NOT SHIPPED (never existed).
3. **Archive read.** `git show 194a810:play.html` — the arc's own ship tree — because HEAD
   cannot adjudicate a claim about the day the report was written.
4. **Writer/reader split.** For every state flag: who writes it, who reads it, and can the writer
   ever run. This is the instrument that found both defects; the census alone found neither.
5. **Reachability.** Cell primacy for the arc's node, computed from `NODE_COORDS` against
   `NODE_MAP` declaration order (§AUDIT-03x).
6. **Node codes by `num`.** A retired two-letter code is matched to its live node through the
   `num` field, not through a hand-maintained legend.

---

## III. As-Built Inventory — verified at HEAD

### A. Monster, drop, terrain — 3 of 3 byte-exact

```js
scholars_guard: { key:'scholars_guard', name:"Scholar's Guard", ac:14, hp:45,
                  atk:5, dmgDie:8, dmgCount:1, dmgFlat:3, tier:'medium' }
```

`` `key:'scholars_guard'@5406` `` — all eight fields exact as specified. Drop
`` `icon:'🔏', sell:20@5848` `` → *Scholar Kings' Seal*, exact. Terrain
`` `P.bone_naga, P.scholars_guard@6291` `` — present in `scholars_qtr` alongside the homunculi,
mages, liches and library ghosts the report names. **Expansion:** it later joined a second pool
(`workshop`), which the report predates.

### B. `_tomeBonuses()` — function and all three call sites live

`` `function _tomeBonuses()@23408` `` is byte-identical to the report's listing modulo the
whitespace of two `if` bodies. All three integration points survive:

| System | Live anchor | Shipped expression |
|---|---|---|
| Initiative | `` `const _tomeInit = _tomeBonuses().initiative@7439` `` | `d20 + dexMod + tome initiative` |
| Death saves | `` `_tomeBonuses().deathSave + _kingsSealBonus@7503` `` | exactly as specified, including the Corelli seal addend |
| Attack | `` `_tomeBonuses().atk + _lakeMagicBonuses().atk@25032` `` | as specified, plus a §DROP-03 addend added later |

The `atkWhileQuestActive` gate (contribute only while some quest is `'active'`) is intact.
**But see Finding 2:** the only tome carrying that bonus is the one the player cannot obtain, so
`_tomeBonuses().atk` is structurally always `0` at every call site.

### C. State — 9 of 9 flags under their specified names

`` `wmDoc1Read: false@23130` `` through `` `wmFirstResearcherKnown: false@23132` ``, plus
`archiveLetterObtained` in the same section. Not one was renamed by §ARCH-01 or §VM-01.

### D. Archive interface

`` `const WM_ARCHIVE_DOCS = [@27789` `` — three documents, keys and titles as specified, both
signature lines verbatim: *"Signed: Archivist I. Voss"* and Froberger's margin note
*"I talked to the shepherd. He was describing a Void pressure event. They wrote this before they
knew. So did I."*

`` `function _storyWmArchiveModal(wrap)@27811` `` — toggle-style, read/unread colour coding
(green + ✓ / amber + Read) exactly as described; §VM-01-G2 converted it from an HTML string to DOM
nodes with **no behavioural change**. The 4th document (§XVII's Constructor's Log, gated on
`vaAllMarksFound`) is present and correct — the report's best architectural call, verified.

The launcher is now a registry entry: `` `id:'nue-lower-archive', nodes:['NUE']@34174` `` →
`` `function _nodeHookNueLowerArchive(node)@32966` ``, still gated on `wmLowerArchiveUnlocked`.
Button label shipped as `📚 Lower Archive`, not the report's `[Open Archive]` (cosmetic).

### E. Quest chain — 4 of 4 live as UQF-1.0, plus a fifth the report predates

| Quest | Gate at HEAD | Completion at HEAD | Verdict |
|---|---|---|---|
| `quest_wm_01` | open | `` `itemsAll:[{ name:"Scholar Kings' Seal", min:3 }]@11071` `` under `{any}` with the letter flag | **exact** — both paths, as specified |
| `quest_wm_02` | `questsDone:['quest_wm_01']` | all three doc-read flags | **exact** |
| `quest_wm_03` | `flags:['wmArchiveComplete']` | `flags:['wmBenediktCircleComplete']` | **blocked** → Finding 1 |
| `quest_wm_04` | `` `gate:{ flags:['wmBenediktCircleComplete'] }@11106` `` | `` `completion:{ flags:['wmFirstResearcherKnown'] }@11106` `` | **impossible** → Finding 2 |
| `quest_wm_05` | — | `flags:['wmGurtFileRead']` | *added later (§L), outside this report* |

All three tome grants are exact: `` `bonus:{deathSave:1}@11088` ``,
`` `bonus:{initiative:2}@11098` ``, `` `bonus:{atkWhileQuestActive:1}@11108` ``, all
`sell:0` (unsellable, as designed). `quest_wm_04`'s `+300gp` is present.

### F. The two access paths — verified end to end

The alternative to grinding guards is Yael's letter, and it shipped precisely as §III.A describes:
`` `yealFav >= 1@32272` `` → `` `S_story.archiveLetterObtained = true;@32280` ``, at the Blue
Shutters Archive, on the starting node. **A design decision that survived 80 days and a world
migration without a single edit.**

### G. Geography

The node is `` `NUE:{ num:35, code:'NUE'@8705` `` — same `num`, same `name:'scholars_qtr'`, same
`` `label:"Scholar's Quarter — Weimar"@8705` ``, same `act:6` as the report's `SQ`. **The node
survived; only the key was renamed.**

**Reachability: clean.** `` `NUE:{r:20,c:191}@9615` `` is the **sole occupant of its cell**, so it
is `list[0]`, it can become `currentCode`, and all five `activateNode:'NUE'` quests activate on
arrival — `` `activateNode:'NUE', // §VM-01-G3@11079` ``. Unlike §CROWN-01, **this arc is not a
§AUDIT-03x casualty.** It fails in the completion grammar, not in the geography, which is why no
map-level instrument could see it.

---

## IV. Spec → Shipped Delta Table

Two-way: **HEAD is not the reference.** Where the spec is right and the engine is wrong, that is an
engine defect, not report rot.

| # | Report claim | Measured at HEAD | Verdict |
|---|---|---|---|
| 1 | `wmSessionsDays` "tracks **`gameDay`** values" | code reads `S_story.dayCounter`, a field that does not exist | **ENGINE DEFECT — the report is right** (§AUDIT-03at) |
| 2 | `quest_wm_04` completes on `wmFirstResearcherKnown` | true — and that flag's only writer is `quest_wm_04`'s own `onComplete` | **ENGINE DEFECT — circular** (§AUDIT-03au) |
| 3 | "Benedikt → **Dear Friend** on quest_wm_03" (stated 3×) | `` `npc:"benedikt_rasp", set:1@11097` ``; Dear Friend begins at 2 (`` `fav >= 2 ? p.dearFriend@23714` ``) | **NOT SHIPPED** (§AUDIT-03ar) |
| 4 | Isolde "Key line **at Dear Friend**" | she has no `dearFriend` pool at all; that line is her `friendly` tier, and `` `npc:"isolde_voss", set:1@11087` `` is her ceiling | **MISATTRIBUTED — internally consistent, so harmless** |
| 5 | Isolde "Begins Neutral" | base tier is named `impartial` | cosmetic |
| 6 | §IV: "no UI showing Sessions attended: 2/3" | `` `reading circle (' + sessions.length@34728` `` renders `(N/3)`, and `` `The circle meets again tomorrow.@34727` `` disables the button — **both in the ship commit** | **WRONG WHEN WRITTEN** |
| 7 | §IV: Benedikt callback in §XXI is "a long gap" | `` `_npcFavor('benedikt_rasp') >= 2@34914` `` — not a gap, an **unreachable** branch (delta 3) | **understated** |
| 8 | §IV: "no notification prompt" for the unredaction | correct; and the `` `Read (unredacted)' : '📄 Read'@27852` `` label is itself unreachable (Finding 2c) | **correct, and worse than stated** |
| 9 | Node `SQ`; letter obtained at `CI` | 0 of 2 codes resolve as written; **2 of 2 resolve by `num`** — `SQ`(35)→`NUE`, `CI`(1)→`LHR` | renamed, not lost |
| 10 | `[Open Archive]` button | ships as `📚 Lower Archive` | cosmetic |
| 11 | `quest_wm_01`'s NPC | carries `npc:"archivus_sweelinck"` while its own disposition quotes Isolde | authoring metadata only (§AUDIT-03b) — inert |
| 12 | *(new, not in report)* | node label says **Weimar**; four player-facing strings on the same node say **Nuremberg** | **§AUDIT-03av** |

Everything not listed above measured **exact**: 8/8 monster fields, the drop, the terrain pool,
9/9 flags, 3/3 tome bonuses, 3/3 integration points, both access paths, the reading-circle rule,
the four-document architecture, and every quoted line of Isolde's and Benedikt's dialogue.

---

## V. Findings

### Finding 1 — the reading circle can never reach three sessions (§AUDIT-03at)

```js
const today = S_story.dayCounter || 0;              // @34741
const alreadyToday = sessions.includes(today);      // @34742
```

**`S_story.dayCounter` occurs exactly once in 38,712 lines — that read — and has exactly one
commit in the file's entire history: `194a810`, the commit that shipped this layer.** It was never
declared in `_S_DEFAULTS()`, never written, and does not exist in the earliest surviving build. The
game's real clock is `S_story.day` (`` `S_story.day + '/49'@36087` ``) and `S_story.gameDay`
(22 sites) — **and this report names `gameDay`, correctly, twice.**

So `today` is `0` on every render, forever. The first click runs
`` `S_story.wmSessionsDays.push(today);@34734` `` and thereafter `sessions.includes(0)` is
permanently true. The button locks at 1/3 reading *"📖 The circle meets again tomorrow."* — a
promise made by a clock that does not tick. `` `if (n >= 3) S_story.wmBenediktCircleComplete = true;@34742` ``
never fires.

**Blast radius:** `quest_wm_03` never completes (no Scholar Kings' History, no favor grant, no
`wmDoc3Unredacted`); `quest_wm_04` never even *activates*, since its gate is that same flag. **The
arc stops at 2 of 4.** It is a nine-character fix — `dayCounter` → `gameDay` — and it is the
highest-value single-token repair the verification program has found.

> ***The delta table earns its keep here: the spec named the right field and the implementation
> mistyped it. Read against HEAD alone, the code looks self-consistent and the report looks stale.
> It is the other way around.***

### Finding 2 — `quest_wm_04` is its own precondition (§AUDIT-03au)

```js
completion:{ flags:['wmFirstResearcherKnown'] }                      // @11106
onComplete:[ { kind:'flag_write', set:['wmFirstResearcherKnown'] },  // @11107
             { kind:'reward', gold:300 }, … ]
```

`wmFirstResearcherKnown` has **one writer in the whole file: that `onComplete`.** Every other
occurrence is a read. And the engine states its own contract in a comment beside the evaluator —
*"the declarative completion gate is the ONLY completion path."* The quest completes iff the flag
is set; the flag is set iff the quest completes.

**Born that way.** At the ship tree the shape was `completeFn:() => !!(S_story.wmFirstResearcherKnown)`
with the flag set inside the same quest's reward block. §ARCH-01 W7c then transcribed the loop
faithfully into UQF. *A faithful migration of a broken contract produces a broken contract that now
looks modern.*

**The intended writer is written down** — in this quest's own hint:
`` `hint:'Return to the lower archive and read the unredacted personnel file.'@11110` ``. Reading
the unredacted file should set the flag. It never did.

Three consequences:

- **(a)** Benedikt's Annotated Copy is never granted, so the `atkWhileQuestActive` mechanic — an
  entire designed bonus class — has never contributed to a single attack roll; and +300gp is never
  paid.
- **(b)** `` `S_story.wmDoc3Unredacted && S_story.wmFirstResearcherKnown@27843` `` guards the
  substitution, so **`Marta Eilene Vass` — one occurrence in the file, at
  `` `Marta Eilene Vass — First Tier@27844` `` — has never rendered.** The arc's declared climax is
  a string in a dead branch. And `` `const _vaReady = (S_story.ngPlusRun || 0) >= 1@31626` ``
  requires the same flag, so Layer 52 inherits the block.
- **(c)** The `` `Read (unredacted)' : '📄 Read'@27852` `` label is computed only in the branch
  where the body is null — and `wmDoc3Unredacted` forces the body non-null. **The label is
  unreachable by construction**, at the ship tree and at HEAD.

**A second wall behind the first.** New Game+ restores six fields
(`` `const savedNgRun@24026` `` and its neighbours) and resets the rest from `_S_DEFAULTS()`.
`wmFirstResearcherKnown` is not among the six — while `_vaReady` demands `ngPlusRun >= 1` **and**
that flag. So even a repaired `quest_wm_04` would have its result erased by the exact transition
§XVII requires. *Two gates in series, each individually sufficient to close the door.*

### Finding 3 — the tome the arc is named for, and the two that arrive

Of three specified tomes, **one is obtainable.** Froberger's Field Notes (`quest_wm_02`, +1 death
save) is reachable and works — and it is load-bearing elsewhere: the engine reads it as a key
substitute (*"Antecedent Seal or Froberger's Field Notes"*) and as a callback in another arc's
narration. The +2 initiative and +1 atk tomes are behind Finding 1 and Finding 2 respectively.

### Finding 4 — one node, two cities (§AUDIT-03av)

The node's label is *Scholar's Quarter — **Weimar***, and the file says Weimar 517 times. It says
**Nuremberg** five times, and four of those attach to this node — including the Warrant's Board
rumor that recruits the player into the arc:
`` `Isolde in Nuremberg is short three of them@11084` ``, and an NPC whose occupation is
`` `occupation:"secondary acquisitions, Nuremberg archive"@22954` ``. The player reads *Weimar* in
the header and *Nuremberg* on the board that sent them there. `NUE` is Nuremberg's airport code;
the content is Weimar's. Not a dead code — a live node with **two mutually exclusive place names in
player-facing strings**, which no existing gate can see.

---

## VI. Post-Mortem Register — the report's own verdicts, re-scored

**What worked — upheld.** The three-document structure (bureaucratic record → dismissed evidence →
redacted name) is intact and reads as designed. The Isolde/Benedikt split — institution reckoning
with itself vs. the outsider who did the work anyway — is carried entirely by dialogue that
survives verbatim. And the 4th-document call was right: the archive is one interface that grows
across two layers, and §XVII plugs into it without a second UI.

**What could be better — 1 of 3 upheld.**

| Original bullet | Re-scored |
|---|---|
| "the reading circle mechanic is invisible" | **WRONG WHEN WRITTEN** — the `(N/3)` counter and the day-lock message shipped in the same commit |
| "no notification prompt" for the unredaction | **UPHELD, and understated** — there is nothing to notify about (Finding 2) |
| "the gap to the §XXI Benedikt callback is long" | **UNDERSTATED** — the callback is unreachable at any favor the arc can produce |

> ***A post-mortem is a claim like any other. This one named the exact flag in the exact sentence
> that contains its own disproof — "it sets on quest_wm_04 completion, not on re-reading Document
> 3" — and filed it as a backtracking annoyance. When a note tells you a flag's only writer, go
> read what gates that writer.***

---

## VII. Playability assessment

**What the layer promises the player:** a second reason to return to Weimar; a research verb;
three permanent bonuses earned by reading; a trust gate paid in days rather than gold; and a name
at the end of it that reframes the whole Froberger myth.

**What the layer currently delivers:** the first two quests. The player fights guards or arrives
with Yael's letter, unlocks the archive, reads three documents, receives the death-save tome — a
genuinely good ninety minutes — and then meets a button that says the circle meets again tomorrow
and always will. Benedikt never becomes anyone. The redacted name stays redacted.

**Cost to close the gap:** Finding 1 is one identifier. Finding 2 is one bit moved to the archive
read handler. Finding 3 resolves itself once those land, and §AUDIT-03ar (`set:1` → `set:2`) then
becomes live rather than inert. **Four small edits restore two quests, two tomes, an NPC
relationship tier, a named reveal, and the entry condition for an entire later layer** — the best
content-per-edit ratio the verification program has measured.

---

## VIII. Defects filed

| Row | Severity | Summary |
|---|---|---|
| **§AUDIT-03at** | 🟢 no design call | `S_story.dayCounter` (1 occurrence, 1 commit, 0 writers, ever) → `gameDay`; unblocks `quest_wm_03` and `quest_wm_04` |
| **§AUDIT-03au** | 🟢 no design call | `quest_wm_04`'s completion is its own effect; plus NG+ wipes the flag `_vaReady` requires; plus a dead button label |
| **§AUDIT-03av** | 🟡 small design call | `NUE` carries a Weimar label and four Nuremberg player-facing strings |
| §AUDIT-03ar | *corroborated* | this report **specifies** Dear Friend in three places, so it is a spec→shipped delta, not an ambiguity — and the row's premise needs one correction: `quest_wm_03`'s `onComplete` never runs, so Benedikt's favor is **0**, not 1. The fix is inert until §AUDIT-03at lands |
| §AUDIT-03b | *corroborated* | `quest_wm_01`'s `npc:` stamp names Sweelinck while its own text quotes Isolde — authoring metadata, inert |

---

## IX. Provenance

Original file-reference table (lines 4623 · 5049 · 5411 · 7657 · 7674 · 7979 · 8428 · 8452 · 6154 ·
6218 · 9881 · 12359 · 12381 · 13064 · 14325) is **superseded** — the file has grown from ~14 k to
38,712 lines. Every pointer in this document is a live `` `symbol@line` `` anchor instead. The
original directive lived in `plan.md` §XVI, now split into `CONTRIBUTING.md` + `BACKLOG.md`;
closed design text migrated to `plan-archive.md`. Home doc: `story.md` §Layer 51 (✅ Implemented)
and `world.md` §Weimar Scholar Gate. Cross-reference: `lab-report-ng-plus-remembrance.md` §II.B
(`wmFirstResearcherKnown` as the Entry 42 prerequisite — see Finding 2b before relying on it).

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
