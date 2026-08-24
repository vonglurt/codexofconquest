<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report Synthesis — Part 6: Quest Arcs

**Cross-reference of fourteen quest-arc lab reports against `play.html`**
**Written:** 2026-06-16 · **Stated baseline:** 33,721 lines · **Source reports:** 14
**Verified:** 2026-08-14 (§DOC-02bg) · **Reference build:** `89fa13b` (2026-06-16 12:20:47, 33,721 lines — *the stated baseline is exact*) · **HEAD:** 38,712 lines

> **Status of this document.** HISTORY. The 2026-06-16 text is preserved in substance; verification
> findings are marked inline. Per §DOC-02 policy a claim that did not hold is **kept and marked**,
> never deleted — a silently removed claim reads as one that held. Line numbers are the
> **reference build's** unless tagged `@` (HEAD anchor, §DX-01e form).

---

## Abstract

Fourteen arc reports written 2026-05-21 → 2026-05-28 are read against the build of the day and
answered on three questions: what was specified, what the code holds, what survives as working
design knowledge. **Verification result: 59 of 62 line citations are exact at the reference build,
every monster statline and quest-flag table is byte-correct, and five node-code corrections the
document makes are all right — while it names two functions that have never existed, six node codes
that resolve to nothing or to somewhere else, and celebrates one ending that has never been
winnable.** Every miss is answerable from a line the document itself cites, usually within four
lines. The pattern has a single cause, identified in §IV.6: **the author read the engine's section
comments, which are written in the retired node vocabulary, instead of the guards directly beneath
them.**

---

## I. Intent and playability rationale

The fourteen arcs exist to answer one design problem: **a 416-node world is a map, not a game,
unless the places have reasons.** Each arc is a reason.

| Arc family | Playability function it serves |
|---|---|
| Weimar Scholar Gate · Void Archaeology · Quest -1 · Entry 42 (§XVI/§XVII/§XIV/§XV) | **Deferred payoff.** A four-link chain that only resolves on a second run, so knowing the world becomes a mechanic rather than a nostalgia. |
| Ally Cat · Kenickie's Market (§IX/§XL) | **Relational economy.** The discount is earned by loyalty, not gold — the first surface where a relationship outranks a currency. |
| Tilbury Harbor · Visby Underground (§XIX/§XX) | **Order-independent synthesis.** Two self-contained arcs that reward, but never require, being done in sequence. |
| Three Crowns of the Swamp (§CROWN-01) | **Non-combat depth.** Nine nodes and twenty-four missions resolved almost entirely by skill check. |
| The Four Courts of the Littoral Sea (§SIREN-01) | **Failure as content.** Missed checks accumulate into a record the arc-close reads aloud without judging. |
| Saul/Paul (§FUTURE-01) · Dungeon Themes (§DUNGEON-01/02) | **Register discipline.** Voice rules and theme locks that keep a very large content surface sounding like one game. |
| Endings & Echoes (§Layer 43) | **The ledger.** The victory screen names the people you were warm to; that is the score. |

The through-line is the **Ceremonia Roll** — `d20 + abilityMod + profBonus ≥ DC`. Its adoption is
what let the world grow content without growing combat, and §IV records that it is the one thesis in
this document that fully survived contact with two more months of engine.

---

## II. Method

1. Reconstruct the build the document was written against (`git show 89fa13b:play.html`);
   confirm the stated line count. **33,721 — exact.**
2. Batch-census every backticked identifier (177 tokens) against the reference build **and** HEAD in
   one pass, before reading a line of prose.
3. Resolve every line citation against the reference build, not HEAD.
4. Run `git log -S` on every symbol the census scores dead, to separate **RETIRED** from
   **NEVER SHIPPED** (§DOC-02c, instrument 4).
5. Test every **negative** — *"not confirmed"*, *"unconfirmed"*, *"may use a different code"*.
   An absence claim the author never ran is the cheapest thing in a document to check and the most
   expensive to leave wrong (§DOC-02bf, instrument 55).
6. Check each claim against its **source report's** verification record, not only against HEAD — this
   is a synthesis, and a synthesis inherits conclusions while re-checking only pointers
   (§DOC-02be, instrument 53).
7. Run reachability against the document's **subject**, not just its symbols (instrument 54).

---

## III. Verification summary

| Evidence class | Score |
|---|---|
| Stated baseline (33,721 lines) | **exact** |
| Line citations resolved at the reference build | **59 / 62 (95 %)** |
| Monster statlines, flag tables, quest-declaration lines | **exact, no error found** |
| Node-code corrections the document *makes* | **5 / 5 correct** (CQ→CDG · SQ→NUE · SF→STN · `quest_tl_01`→LCY · MM→LIM) |
| Node codes the document *asserts* as live | **6 wrong** (CO · CI · GC · LA · LC · SQ-in-Report-2) |
| Named functions | **2 of ~20 never existed** (`_trackStat`, and `quest_mimic_colony` as an id) |
| Self-taken censuses | **Crown coordinates 5/6; Crown quest count 18 vs a live 24** |
| Unverified negatives | **3 of 3 answerable, all from lines the document itself cites** |

**The shape of the error is consistent and worth stating once:** everything the author could *copy*
is right; everything the author *named from memory* is wrong. This is §DOC-02f's ninth instrument
holding at its cleanest — and §IV.6 explains why the memory was so plausible.

---

## IV. Principal findings

### 1. `_trackStat()` has never existed. The function is `_statTally(key, n)`.

The §XLII table row reads *"`_trackStat()` dual increment | 21,909–21,912 | Live."* **The line range
is exactly right** — it is the body of `_statTally` — and the symbol has **0 commits in the file's
entire history**. `git log -S "_trackStat"` returns nothing; `_statTally(key, n)@23916` has sixteen
live call sites.

The cost is not the table row. It is the durable rule three paragraphs later:

> *"`_trackStat(field, n)` is the only write path. Never mutate `careerStats[field]` or
> `runStats[field]` directly — `_trackStat` ensures they stay in sync."*

**The rule is correct and the function it names cannot be found.** An author who follows it greps,
gets nothing, and concludes the ledger has no write path. Corrected form is in §VI.

> *A pointer can be exact while the symbol standing at it was supplied by memory. Verifying a line
> number is not verifying the name beside it.*

### 2. `quest_mimic_colony` is a design name, not an implemented id — and `quest.md` already said so.

The table row reads *"Mimic Colony (P2) | `quest_mimic_colony` | **Confirmed** via `§D02-08`
reference at line 19,767."* Line 19,767 is a **comment**:

```js
// ── §D02-08 — "The Dropped Coin" (Node MM — Mimic Meadows) ──
quest_d0208_a1: { id:'quest_d0208_a1', type:'skill_check', title:'Act I — The Coin', …
```

`quest_mimic_colony`: **0 commits ever**. The real arc is `quest_d0208_a1: { id:'quest_d0208_a1'@21830` through `a5` — five acts,
beginning on the line immediately below the one cited as confirmation. `quest.md:391` has carried
the correct mapping the whole time: `` `quest_d0208_a1–a5` *(design: quest_mimic_colony)* ``.
**The maintained home doc was right and the synthesis was not** — worth recording, because the usual
direction of this program's findings is the reverse.

### 3. `CO` is not a node, has never been a node, and the endgame is `TLS`.

The document names `CO` six times as a live location: the fifth ending variant (Report 2), *"At CO
node"* and *"before the CO story encounter"* (Report 4), *"`codexCoreChosen` gates CO pre-boss
content"* and *"before the Auros fight"* (Report 11). `grep -E "^  CO ?: *\{"` returns **0** at the
reference build and at HEAD.

Every one of those scenes guards on `TLS` (Cosmic Realm — The Convergence, `num:42`, act 8), and the
refutation is **inside a line the document itself cites**: it gives 19,703 and 19,707 for
`codexCoreChosen`, and 19,707 reads

```js
activateNode:'TLS', activateCond:() => !!S_story.codexCoreChosen,
```

Not near the citation — *in* it. `defeatedBattles['TLS']` appears ten times in the same block;
`defeatedBattles['CO']`, the key Report 4 builds its bug claim on, appears **zero** times ever.

### 4. Three unverified negatives, all answerable, all from lines already on the page.

| The hedge | The answer | Where the answer was |
|---|---|---|
| *"The Scholar's Workshop node (report called it `SW`) may use a different code — node code unconfirmed from this grep set."* | **`SZG`** — `SZG:{ num:80, code:'SZG', name:'workshop'@8811` | **Four lines above `LIM@8815`**, which the very next table row cites correctly |
| *"Node SW for the Workshop may use a different code — check live HTML before referencing."* (repeated in the Summary) | same | same |
| *"Bug noted in report not confirmed fixed… No confirming grep found for a fix."* | **The bug is real and still live at HEAD** — the panel is `nodes:['TLS']` with `when:st => (st.level || 1) >= 20 && !st.questMinusOne@31384` and carries no battle term. But the key is `defeatedBattles['TLS']`, not `['CO']` | ten lines away, in the same block |

The third is the interesting one: the negative is **right about the defect and wrong about the
key**, which is the precise failure a single grep would have caught. The hedge — *"no confirming
grep found"* — is honest. None was run.

> *A negative costs one grep. If the report did not run it, the verifier must. And proximity is not
> protection: citing a line and searching a region are different acts.*

### 5. "Covenant Keeper (True)" has never been winnable — and this is the first document to celebrate it.

The gate is transcribed **faithfully**:

```js
const _isTrue = missionDone && curse <= -6
  && (S_story.pitTrainingWins || 0) >= 5
  && Object.keys(S_story.ebNegotiatedPayments || {}).length >= 5;
```

Three of four terms are satisfiable — `pitTrainingWins` has a live writer, and 20 EB codes make
`>= 5` negotiations reachable. The fourth is arithmetic:
`_curseScore()@28192` returns `(startedNotReturned × 3) + (neverStarted × 1) − (allComplete ? 5 : 0)`
over 20 codes, so its **best possible value is −5** and its realistic floor is **20** (the
`ebReturnDone` term has no reachable writer — §EPIC-01). `curse <= -6` is unsatisfiable at every
value the function can return. **§ENDING-01 (b) already owns and dates this**; it is corroborated
here, not re-filed.

Two things this pass adds. **(a)** The cited line is wrong: *"Line 25,935 confirms this"* — 25,935
is inside the Sweelinck question ladder; `_isTrue` is at **25,885–25,888**, fifty lines up. **(b)**
The consumer-side observation: eighteen days after the break, an author read a correct expression,
transcribed it correctly, and reported it as *"implemented beyond Layer 43 spec."* **Nothing in an
expression ever says whether its terms can be reached.**

The neighbouring claim, by contrast, is **exact**: *"Standard Covenant Keeper only needs `>= 3` for
the `_missionComplete()` bit"* — `crovPitTrainingWins: (S_story.pitTrainingWins || 0) >= 3`.

### 6. Why six node codes went wrong: the engine's comments are written in the retired vocabulary.

Every missed code was available in a guard the author had open. They were not read, because the
**section comment above the guard says something else**:

```js
// ── Layer 50: §XV Entry 42 — blank journal page at CI (qualifying NG+ run) ──
if (node.code === 'LHR' && (S_story.ngPlusRun || 0) >= 1 && S_story.priorQuestMinusOne …
```

The document says *"Entry 42 modal at CI."* So does the comment. The code says `LHR`.
**22 engine comments** name a retired code (`CI`/`SQ`/`CO`/`CQ`/`SF`/`GC`/`MM`) as the location of a
live scene. `CI` is the worst of them, because it is **live as a different node** — Chancery Court,
`num:429` — so an existence check passes while the sentence stays wrong. The engine even ships the
correct mapping, once, at `35,140–35,144`: *"CQ→CDG … SQ→NUE … GC→TRD. No NODE_MAP entry ever
existed for CQ/SQ/GC either."* Thirty comments never got the memo. **→ §AUDIT-03ba (new).**

Full correction set:

| Document says | Live | Evidence |
|---|---|---|
| Entry 42 modal at **CI** | **LHR** | `node.code === 'LHR'@34618`; the bit is even named `returnedToCI` and reads `visited['LHR']@23662` |
| Fifth ending / Quest -1 / Codex Core at **CO** | **TLS** | `nodes:['TLS']@31383`; `activateNode:'TLS'` at cited 19,707 |
| Yva at **GC** | **TRD** | `yva: { meta: { name:"Yva"@10414` |
| Lady Aurel at **LA**, Lady Calice at **LC** *(both hedged "or equivalent")* | **LC1**, **LC2** | `LC1:{ num:112@8531`, `LC2:{ num:114@8535` — the declaration lines **one above** the cited text lines |
| Benedikt's four-author synthesis at **SQ** (Report 2) | **NUE** | `node.code === 'NUE'@31687` — **and Report 1 of this same document corrects SQ→NUE correctly** |
| Scholar's Workshop **SW** *(hedged)* | **SZG** | `SZG:{ num:80@8811` |

Report 2 repeating `SQ` two pages after Report 1 fixes it is instrument 53's failure mode inside a
single file: the pointer was re-checked, the sentence was inherited.

### 7. Two self-taken censuses are wrong; every transcribed one is right.

- **`INN | The Innmother's Hall | r:128, live ✓`** — `128` is the node's **`num:`** field, read out
  of `INN:{ num:128, code:'INN', … }` and filed under a coordinate heading. Real position:
  `INN:{r:44,c:223}`. The table's own shape flags it — it is the only one of six rows with no `c:`
  value. The other five are **exact**: WG0 `r:132,c:225` · HW1 `r:110,c:224` · HG1 `r:41,c:223` ·
  HN1 `r:42,c:223` · HCA `r:25,c:211`.
- **"18 quests (6 per Crone)"** — live count is **24**. Six creature missions
  (`quest_whisper_kelpie`, `quest_whisper_witch`, `quest_glut_mudcrab`, `quest_glut_octopus`,
  `quest_wane_demon`, `quest_wane_spawn`) sit alongside the eighteen and are not counted. An
  expansion, not rot.
- **"the 500×500 world grid"** (twice) — **no such constant exists**, at the reference build or at
  HEAD. Observed extent then was `r ≤ 186, c ≤ 228`; the §WALK-1.5 window at HEAD is rows 0–85,
  cols 140–255. *The rule the number was attached to is correct and is kept in §VI — only the
  literal is unsourced.*

### 8. Entry 42 has a fourth gate the document does not mention.

Reported conditions: `ngPlusRun >= 1`, `priorQuestMinusOne`, `!entry42Written`. The live guard adds
`const _e42Dear = ['yael','brynn','quill','pachelbel','crov','auros']@34620` filtered to
`_npcFavor(k) >= 2`, then `if (_e42Dear >= 3)`. A player who reaches NG+ having been warm to two
people never sees the page and is never told why. **§AUDIT-03ah already owns this** (filed
2026-08-12) — corroborated, not re-filed. The key list also confirms the sixth Birka key is
**`auros`**, and Weckmann's is **`crov`**.

---

## V. Arc register

| # | Source report | Verdict | Delta |
|---|---|---|---|
| 1 | Weimar Scholar Gate (§XVI) | **Live** | SQ→**NUE** correctly caught. `_tomeBonuses()@23408`, `wmSessionsDays`, `wmDoc3Unredacted` all exact. `WM_ARCHIVE_DOCS@27788`'s own doc comment still says *"⚠️ PLANNED"* for a shipped surface. |
| 2 | Void Archaeology (§XVII) | **Live, unreachable without console** | All 9 `va*` flags at 21,225 exact. Fires at **NUE**, not SQ; fifth ending at **TLS**, not CO. See §VII. |
| 3 | NG+ Remembrance (§XV) | **Live** | The `_STAT_ZERO()` initialisation delta the document flags is **real and correctly stated** — `_S_DEFAULTS()` inlines the zero objects at 21,237–21,238; the factory is a reset tool. Good catch. Entry 42 is at **LHR**, and has a 4th gate (§IV.8). |
| 4 | Quest -1 (§XIV) | **Live at TLS** | Node wrong. Flagged bug **confirmed still live at HEAD**. Its player-facing text carries four stale literals — **§AUDIT-03u already extended**. |
| 5 | Ally Cat (§IX) | **Live** | CQ→**CDG** correctly caught. *"Taz Devil only in random pool"* — exact, `P.taz_devil` is in the `cat_quarter` pool. §DOC-02a found the Honcho **merge mechanic has no code at all**; this document repeats it as shipped. |
| 6 | Kenickie Chronicle (§XL/§XLII) | **Live** | `_trackStat` → **`_statTally`** (§IV.1). Both ledgers, the factory, the respawn survival copy: all exact. |
| 7 | Endings & Echoes (Layer 43) | **Live, one variant unwinnable** | Nine of nine symbol citations exact. "Covenant Keeper (True)" — §IV.5. |
| 8 | Tilbury + Visby (§XIX/§XX) | **Live** | Rennau **STN** and `quest_tl_01`→**LCY** both correctly caught; **Yva GC→TRD missed**. Profile range 9,162–9,164 is off by one at the tail (9,163 is Vonn; Yva is 9,165). |
| 9 | Ceremonia Roll (§DESIGN-03) | **Live and universal** | `_rollCeremonia@7024` exact. The strongest survival in the set — see §VI. |
| 10 | Three Crowns (§CROWN-01) | **Live** | All 9 nodes live incl. HJ1/HJ2/HJ3. Coordinates 5/6; quest count 18 vs **24**. |
| 11 | Dungeon Themes (§DUNGEON-01/02) | **Live** | MM→**LIM** correctly caught; **SW→SZG left unresolved** though it sits 4 lines away. `quest_mimic_colony` fabricated (§IV.2). |
| 12·13 | Saul/Paul (§FUTURE-01) | **Live** | Nine quest ids exact. `KHR@9133` correctly identified as a code shift. Correctly classed as reference material, not spec. |
| 14 | Littoral Courts (§SIREN-01) | **Live** | Every quest line exact, and `checkFailFlag:'betrayalThought'` at 10,254 (reference build — §ARCH-01's UQF migration retired the field; 0 at HEAD). Node codes **LC1/LC2**, not LA/LC. |

---

## VI. Durable design knowledge — corrected and kept

These are the load-bearing rules. Corrections are marked; everything unmarked verified exact.

- **`_statTally(key, n)` is the only write path for the Chronicle.** *(was: `_trackStat`)* Never
  mutate `careerStats[field]` or `runStats[field]` directly. `runStats` = what this run cost;
  `careerStats` = who you are across everything. **Do not merge them.**
- **`_STAT_ZERO()` is a reset tool, not an initialiser.** `_S_DEFAULTS()` inlines the zeroes; the
  factory is called at respawn and NG+. Same effect, different path — and the difference matters the
  day someone adds an eleventh field.
- **The Ceremonia Roll is the universal non-combat resolver.** `type:'skill_check'` +
  `_rollCeremonia()` across Saul/Paul, the Littoral Courts, all 24 Crown missions and the dungeon
  themes. *Amendment: the report's companion rule — "`completeFn` and `killGoals` are incompatible
  with `skill_check`" — is superseded by §ARCH-01. All ~2,850 quests are UQF-1.0 and completion is
  `QuestRuntime`'s; author new quests as UQF only.*
- **Crown coordinates are world coordinates.** New nodes on the chain go in `NODE_COORDS` at real
  world positions, never local offsets. *(The "500×500" figure is unsourced — use
  `docs/maps/node-index.md`, never a remembered extent.)*
- **Crown nodes have no battles; junction nodes do.** HW1/HG1/HN1 are battle-free; HJ1/HJ2/HJ3 carry
  the bosses. Still true.
- **`innmotherKindness` never decrements.** Failure does not reduce it — accumulated kindness is
  permanent within a run. Gate at `>= 5@11720`, naming at `>= 7@22585`.
- **The betrayal mechanic is an accumulator, not a branch.** `betrayalThought`/`Word`/`Deed`
  accumulate across failed checks and the arc-close witnesses them without judging.
- **`vsShamanKnown` sets at debt settlement, not at shaman defeat.** The player learns the shaman
  exists through Yva's testimony. Don't change the order. *"Fifty gold is a reasonable price for
  information that could get me killed."*
- **Market access is relational, not economic.** Kenickie's discount is gated on `quest_cat_05`. No
  amount of gold buys past a loyalty gate.
- **`atkWhileQuestActive` is condition-gated** — `if (item.bonus.atkWhileQuestActive &&
  hasActiveQuest)@21495`. Benedikt's Annotated Copy pays nothing once every quest is done.
- **`entry42Written` persists across all NG+ runs; `ngMemoryDelivered` resets each run.** What the
  player wrote, or chose not to write, is permanent.
- **The NG+ comprehension gate is by design, not difficulty.** A first-run player at the DF stone
  alignment sees a math puzzle; a returning player who knows who placed it sees a 200-year-old plan.
- **The 8 Paul voice rules remain the authoring standard.** Body is specific. Suffering is
  enumerated, not dramatised. The conversion scene is external — no interiority.
- **Don't add a Level 21 progression tier.** *"Level 21 is undefined. That is not a bug. That is the
  door."* The boundary is the invitation, and the game meaning it is the whole point:
  *"The game will not know whether you earned it. That is also intentional."*

---

## VII. Reachability of the subject (instrument 54)

The Summary's title — *"What Is Structurally True Right Now"* — is a claim about the **world**, not
the file. Run against the world, one chain does not hold.

`S_story.questMinusOne` has exactly **one** occurrence outside its default, at both builds, and it
is **inside a string literal**: the console instruction the disclosure prints. **No code anywhere
sets it.** That is deliberate and the document defends it well. But the consequences are not stated:

```
questMinusOne  ──(console only)──▶  priorQuestMinusOne  ──▶  Entry 42 panel (+ 3 Dear Friends)
   ──▶  entry42Written  ──▶  quest_va_04 / vaArchitectureKnown  ──▶  fifth ending
```

So **§XVII Void Archaeology in full — four quests, nine flags, the Constructor's Log, the MT tunnel,
Benedikt's *"Four links is a chain. A chain holds."* — plus the fifth ending variant, is reachable
only by a player who opens a browser console and types a JavaScript assignment.**

This matters more than it looks, because of §ENDING-01: with `_curseScore()` floored at 20, every
`curse <= 0` branch is dead and Sweelinck's last question collapses to *"Were you alone by choice?"*
— **unless** the fifth variant fires, which is checked first. **The console-gated deep-lore chain is
currently the only route to any ending question other than the bleakest one.** That is not an
argument against the console door; it is an argument that §EPIC-01 and §ENDING-01 are the highest
player-impact rows on the board, which is where the backlog already ranks them.

---

## VIII. Defects filed

| Row | Substance |
|---|---|
| **§AUDIT-03ba** *(new, 🟢)* | 22 engine comments name a retired node code as a live scene's location while the guard beneath uses the live code. Invisible to `check:legacycodes` (scans `*.md`) and to `check:noderegs` phase 6 (comment-aware **by design**, §AUDIT-03f). This document is the proof of harm: six wrong codes, every one traceable to the comment above the guard. |
| §AUDIT-03ah | Corroborated — Entry 42's fourth gate (`_e42Dear >= 3`). Not re-filed. |
| §AUDIT-03u | Corroborated — the Quest -1 disclosure's four stale literals (*"16,024 lines"* vs 38,712; *"MONSTER_POOL has 423 entries"* vs 398; *"WORLD_DB has 67 terrain entries"* vs 111; `plan.md §XIV`, deleted 2026-07-09). Already extended with exactly these. Not re-filed. |
| §ENDING-01 (b) | Corroborated — "Covenant Keeper (True)" born-unwinnable. Not re-filed. |
| §EPIC-01 / §ENDING-01 | Corroborated — the `ebReturnDone` writer, and the ending collapse it causes. Not re-filed. |
| §AUDIT-03s | Related class; the comment surface is broader and gets its own row above. |

---

## IX. Conclusion

**As an inventory this document is strong: 95 % of its pointers land, and every table of statlines,
flags and quest declarations is exact.** As a naming authority it is not — two functions that never
existed, six node codes that resolve elsewhere, one ending praised as shipped that arithmetic
forbids. The two halves have one boundary between them, and it is not table-versus-prose: **it is
whether the author could copy the thing or had to remember it.**

The specific mechanism is worth carrying forward, because it is cheap to defend against.
`grep`ping a *region* and citing a *line* feel like the same act and are not. This author cited
`19,707` — a line that reads `activateNode:'TLS'` — and wrote *"CO"* in the sentence beside it,
because the comment four lines up said CO. The engine's comments are a fossil vocabulary, and a
documentation author reads comments. That is §AUDIT-03ba, and it is the finding this pass exists to
produce.

What survives untouched is the design knowledge in §VI: the relational economy, the failure
accumulator, the deferred payoff, and the Ceremonia Roll that made a non-combat world affordable.
Two months and 5,000 lines later, **those all still describe the game that is running.**

---

*Synthesis Part 6 of 7 · Verified under §DOC-02bg, 2026-08-14 · 470 → 368 lines*
