<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — Codex of Conquest: The Curse of Knowledge
### Narrative Architecture for the Full Story Arc — Specification and Post-Ship Verification

**Original date:** 2026-05-22 · **Verified against HEAD:** 2026-08-12 (§DOC-02p)
**Subject:** `play.html` — story-mode narrative layer (Layer 40)
**Frameworks applied at authoring time:** D&D 5-step quest template (Tales Arcane) · one-shot
modular pacing · Steven Pinker's *Curse of Knowledge* as writing principle **and** theme · the
Epic Battlegrounds as the testing ground.

> **Status.** This is a HISTORY document. The 2026-05-22 specification is preserved; every claim
> has been re-measured against the live file and the earliest surviving build (`32c10c5`,
> 2026-05-24). Claims that did not ship are marked **NOT SHIPPED** and **kept** — a silently
> deleted claim reads as one that held.

---

## ABSTRACT

The report specifies a narrative layer in which the player's *side-content behaviour* — not their
combat record — selects the ending. A derived **Curse Score** counts Epic Battleground contracts
started but never returned to; **Froberger's Journal** delivers the theme as collectible fragments;
**Sweelinck** reflects the score back at the player mid-run; and the victory screen prints a
two-column **record** rather than a grade.

Verification result: **10 of 11 named identifiers are live under their originally specified names
(91 %)**, the Curse Score formula shipped **byte-exact**, **17 of 17** quoted journal entries are
byte-identical after 82 days, **29 of 29 node codes were right when written** (and 0 of 29 resolve
today, all cleanly renamed), and **12 of 12** Epic Battleground NPC classifications — name, code and
category — are exact.

**And the arc cannot reach either of its payoffs.** The Curse Score's `returned` term depends on a
writer that a 2026-05-29 rename severed (§EPIC-01), pinning the score at a floor of 20. The
specification is one of the most faithfully implemented in the corpus, and the ending it was written
to produce has been unreachable for 75 days.

---

## I. DESIGN INTENT AND THE PLAYABILITY ARGUMENT

**The inspiration.** Pinker's Curse of Knowledge: once you know a thing, you cannot recover what it
was like not to know it. The report extends it — *once you can fix the world, you can no longer
remember being helpless in it.* That is Froberger's arc: he gathered the Shards first, understood
everything, tried explaining, was not heard, and so stopped telling and started fixing. He became
the only one who could. The curse is not that he became evil; it is that he became **alone**.

**Why this is a game feature and not just prose.** The arc exists to solve a concrete playability
problem: the twenty Epic Battlegrounds are modular dead-ends that a player can skip entirely, so
they carry no weight unless something in the game *notices*. Gating them is forbidden — invariant #1
holds the world freely traversable, and invariant #2 keeps a quest `gate` a listing decision, never
a movement one. The Curse Score is the permitted alternative: **the game observes rather than
blocks.** Concretely, the layer adds four things to play.

1. **It gives optional content stakes without gating it.** A player who completes zero Epic
   Battlegrounds still finishes the game — the victory check tests only the final battle
   (`function storyCheckVictory(node) {@28207` returns unless `defeatedBattles['TLS']`). What
   changes is what the last screen is able to say about them.
2. **It converts completionism into characterisation.** The score does not count kills. It counts
   contracts *started and abandoned* at triple weight — walking away from someone who asked is worse
   than never meeting them. That is a legible moral rule a player can learn from one playthrough and
   act on in the next.
3. **It gives the journal a mechanical reason to be read.** Reading is otherwise unrewarded, so the
   engine attaches consequences: `brynnsJournalRead: !!(S_story.journalEntriesRead@23651` unlocks a
   Brynn beat from Entry 7, and a half-journal milestone (nine entries) is one of the twelve mission
   bits. The fragments are placed at nodes the route already crosses, so the reward for slowing down
   is content, not a detour.
4. **It makes the ending a record, not a verdict.** `vic-returns').textContent@28223` prints
   *People Returned To* beside *Shards Gathered* — the design's central claim is that the dramatic
   event happens once while the restored world is what the covenant was *for*.

**The mid-run feedback loop matters most.** An ending computed from twenty invisible decisions would
be an ambush. `id:'story-sweelinck-variant'@31373` renders a bracketed Sweelinck line at the
Scholar's Quarter and the Cosmic Realm, so the player is told, in character, which entry of
Froberger's journal they are currently living in — early enough to change course. **This is the
whole feature: the game shows you the shape you are making while you can still make a different
one.**

---

## II. METHOD

Per the §DOC-02 house method, in order:

1. **Batch census.** Every identifier the report names, through one `grep -c` sweep, before reading
   a line of the source — the document is partitioned into live and dead claims first.
2. **Instrument 4 (`git log -S`).** Applied to every dead symbol, to separate **RETIRED** (shipped,
   later removed) from **NOT SHIPPED** (never existed under that name).
3. **Instrument 8 (the archive).** `git show 32c10c5:play.html` — HEAD cannot adjudicate a
   claim about 2026-05-22. Run **before** writing any code-is-dead row: a dead node code is evidence
   of a rename until proven otherwise.
4. **Instrument 12 (copy-vs-compose).** Passages the author could **copy** are scored separately
   from passages they had to **compose**; form (table vs prose) predicts nothing.
5. **Instrument 14 (census cross-check).** Every derived total checked against a gate that already
   counts the same set — `check:dupkeys` reports `NODE_MAP=416`, and the reachability walk here
   reproduces 416/416 before any delta is trusted.
6. **Instrument 17 (payoff reachability).** Where the thesis names a payoff, the payoff's
   *reachability* is traced, not merely its symbols. Every symbol in this report's §VI resolves.

---

## III. AS-BUILT INVENTORY

| Specified artefact | Shipped as | Verdict |
|---|---|---|
| Curse Score, derived on demand | `function _curseScore() {@28191` | **Byte-exact to the spec formula** |
| `S_story.journalEntriesRead: []` | `journalEntriesRead: [], ebReturnsCompleted: {},@23086` | Exact name, 5 readers |
| `S_story.ebReturnsCompleted: {}` | same line | Exact name, **0 readers** (§DX-02n) |
| `S_story.curseScore: 0` (spec: *never stored*) | an undeclared stored field, 0 readers | **Contradicted — see F3** |
| `FROBERGER_JOURNAL` | `const FROBERGER_JOURNAL = [@27184` | Exact name; 4/4 field names; **41** entries |
| `SWEELINCK_DIALOGUE_VARIANTS` | `const SWEELINCK_DIALOGUE_VARIANTS = [@27229` | Exact name; 4 specified brackets + 1 |
| Ending variants in the victory sequence | `function storyCheckVictory(node) {@28207` | Live; **four** branches, not two |
| Collectible pickup on node arrival | `function storyCheckJournal(node) {@30209`, called at `storyCheckJournal(node);@36047` | Live; toast **byte-exact** |
| Epic Battleground register | `const EB_NPC_DIALOGUE = {@26299` · `const _EB_CODES = [@28030` | 20 entries, `category` field as classified |
| Covenant Standing ladder | `const COVENANT_STANDING_LABELS = [@27356` | Live, 5 brackets — **not in the spec** |

**The formula, transcribed and shipped.** The report's §VI pseudocode is
`(ebQuestsStartedButNeverReturned × 3) + (ebQuestsNeverStarted × 1) − (allReturnBeatsCompleted ? 5 : 0)`.
The engine computes `(startedNotReturned * 3) + (neverStarted * 1) - (allComplete ? 5 : 0)` with
`const allComplete = returnsComplete === 20;@28203`, and its "started" test reads exactly the two
state containers §X specified: `const started = !!(S_story.quests[primaryId])@28197` or a defeated
battle. Both stated thresholds shipped as written — `curse <= 0` selects a Covenant ending,
`curse >= 15` the Cursed one. **Term for term, threshold for threshold, this specification is the
function.**

---

## IV. SPEC → SHIPPED DELTA TABLE

Read in both directions: a row can fail because the report was wrong, or because the engine dropped
something the report specified.

| # | Report claim | Measured at HEAD | Verdict |
|---|---|---|---|
| 1 | Curse Score formula + both thresholds | Identical, and byte-identical at the archive | **SHIPPED exact** |
| 2 | Curse score is *derived, never stored* | `_curseScore()` derives it — **and** a stored `S_story.curseScore` exists with 0 readers | **Contradicted — F3** |
| 3 | `FROBERGER_JOURNAL` is a **17-entry** object | A **41-entry array**; field names `entryNum`/`nodeCode`/`readAloud`/`text` all exact | Expanded; shape exact |
| 4 | The journal has **forty-two** entries | 41 at the archive and 41 at HEAD; the report's own Entry 41 text says *"I wrote it in forty-one entries"* | **Wrong when written — F6** |
| 5 | 5 read-aloud entries (7/14/23/31/41) | All five carry `readAloud:true`; the engine ships **10** | Expanded, superset |
| 6 | 12 collectible entries | All 12 present, `readAloud:false` | **SHIPPED exact** |
| 7 | 17 quoted entry texts | **17 of 17 byte-identical** (modulo markdown italics) | **SHIPPED exact** |
| 8 | 17 journal node codes | **17 of 17 correct at the archive**; 0 resolve today | Renamed, not wrong |
| 9 | Toast *"📖 Froberger's Journal — Entry [N] found"* | `Journal — Entry ' + entry.entryNum + ' found.@30223` | **SHIPPED exact** |
| 10 | Entry 41 sets a terminal flag (implied by *"the spine"*) | `S_story.frobergerLastEntryRead = true;@30215` | Shipped, unspecified |
| 11 | 4 Sweelinck variants by bracket (≤3 / 4–9 / 10–14 / ≥15) | All four brackets exact; texts 3/4 byte-exact, the 4th differs by one word (*"Long pause"* → *"A long pause"*) | **SHIPPED exact** |
| 12 | Variant selected in `storyRender()` at SQ/CO | `id:'story-sweelinck-variant'@31373`, `nodes:['NUE','TLS']` — SQ→NUE, CO→TLS | **SHIPPED exact** |
| 13 | Sweelinck is at *"SQ (Node 35)"* in Act VI | `NUE:{ num:35@8705`, `act:6` | **`num` and act exact** |
| 14 | **Two** ending variants | **Four** branches, plus a fifth NG+ question override | Expanded |
| 15 | Victory screen shows *Shards Gathered* + *People Returned To* | `vic-shards` prints `7 / 7`; `vic-returns').textContent@28223` prints `N / 20` | **SHIPPED exact** |
| 16 | Ending injected into `story-defeat-modal` | Injected into `victory-ending`; `story-defeat-modal` is the **death** modal | Wrong element |
| 17 | 12 EB NPCs classified A/B/C with codes | **12 of 12** name + code + `category` exact at the archive | **SHIPPED exact** |
| 18 | Mordus pays 400gp; Izador 350gp | `paymentFloor:400` / `paymentFloor:350` | **SHIPPED exact** |
| 19 | 9 quoted NPC lines | **7 verbatim**; Rona's condensed; **Aldous's has no source** | Mostly exact — F6 |
| 20 | *"Kazrath's journal mentions Birka twice"* (§IV) | `mentions Birka. Twice.@26496` — correct | **SHIPPED exact** |
| 21 | *"mentions Birka forty times"* (Entry 26) | `mentions Birka forty times.@27210` — also correct | **Engine self-contradiction — F5** |
| 22 | Journal Entry 1 quoted as *"The Codex is broken…"* | 0 occurrences, **0 commits ever**; live Entry 1 is the gate-officer entry | **NOT SHIPPED — F6** |
| 23 | Epic boss: deadly tier, DANGER:EPIC banner, NPC warning verbatim | Banner revealed at `_epBanner.style.display = '';@24708`, printing `d.warning` + the NPC name | **SHIPPED exact** |
| 24 | A player completing zero EBs still finishes | Victory tests only `defeatedBattles['TLS']` | **SHIPPED exact** |
| 25 | The Covenant Ending is reachable | `curse` has a floor of **20** | **UNREACHABLE — F1** |
| 26 | *"All 20 returns always yields the Covenant Ending"* | Arithmetically true (−5), operationally impossible | **UNREACHABLE — F1** |
| 27 | The four Sweelinck brackets grade the mid-run | Only the `≥15` bracket can match | **3 of 4 dead — F2** |
| 28 | The world-building quest = the sum of 20 return beats | No return beat has a reachable writer | **UNREACHABLE — F1** |

---

## V. FINDINGS

### F1 — The specification shipped, and both of its payoffs are unreachable (→ §ENDING-01, §EPIC-01)

`function _curseScore() {@28191` is byte-identical between the archive and HEAD. It never changed,
never failed and never threw. It simply stopped being able to return a low number.

Its `returned` term reads `S_story.ebReturnDone`, whose only writer sits inside
`_storyEbReturnBeat(ebCode) {@30358` — the function §EPIC-01 proved unreachable, because seven code
sites *compute* epic quest ids from node codes that `c1d5a94` (2026-05-29) renamed without renaming
the forty `QUEST_DB` ids. With `returnsComplete` pinned at 0 and the all-complete bonus never paid,
the score has a closed form: **`20 + 2 × (EB bosses defeated)`, range 20–60, floor 20.**

Consequences for this report's design, all measured:

- **The Covenant Ending — the one that reads back the name of every person the player helped — is
  dead.** So are the Standard Covenant and Mixed branches. `Sweelinck sets the journal on the
  table@28258` fires 100 % of the time; the arc can produce only its failure ending.
- **§V's thesis is dead with it.** *"The EB return beats are the real victory"* — none of the twenty
  beats can fire, so `vic-returns').textContent@28223` prints **0 / 20** for every player who has
  ever reached the Cosmic Realm.
- **Two of the twelve mission bits are permanently false:** `allEbReturns: Object.keys(NPC_DIALOGUES)@23656`
  and `noHighCurse: _curseScore() < 10@23660`, so the ≥8-of-12 ending threshold effectively runs
  against 10.

**Verdict: engine-rot, dated.** At `32c10c5` the ids resolved and every branch here was reachable.
This report described a working system.

### F2 — The mid-run feedback loop collapsed the same way, on two surfaces the ending row did not count

The score floor propagates past the ending screen into two graded ladders that render *during* play:

- **`SWEELINCK_DIALOGUE_VARIANTS` — 3 of 4 dead.** The selector matches `cs >= v.minScore && cs <= v.maxScore`
  and the score cannot fall below 20, so only the `minScore:15` variant is ever selected. The three
  graded lines this report wrote — the whole point of §VIII — never render. The one escape is the
  Birka override (`_birkaVar || SWEELINCK_DIALOGUE_VARIANTS.find@31377`), which fires on three
  friendships regardless of score and was already present at the archive.
- **`const COVENANT_STANDING_LABELS = [@27356` — 4 of 5 dead.** Its brackets are −6 / 0 / 7 / 14 / ∞,
  so every player is a **"Wanderer"** — *"The Void will open again. Not your fault. Not entirely."*
  This one is on the **character sheet**, visible for the whole run, not only at the end.

**This is the widest consequence measured for §ENDING-01 so far, and it inverts the feature's
purpose.** §I above argues the loop exists so the ending is not an ambush; in the shipped game the
player is told from the first reading that they are already lost, and nothing they do moves it.

### F3 — `S_story.curseScore`: a promise that names a real variable and moves a different one

`cc-destroy-btn` offers *"⚡ Destroy the housing — STR Ceremonia Roll DC 15 (bypass Auros,
+curseScore)"* (`⚡ Destroy the housing — STR Ceremonia Roll DC 15@31825`) and, on success, writes
`S_story.curseScore = (S_story.curseScore || 0) + 5;@31846` and prints *"[curseScore +5]"*.

`_curseScore()` recomputes from `_EB_CODES` on every call and **never reads that field**. The field
has three occurrences in 38,712 lines — a button label, its own self-referencing write, and a
message string — and is not declared in `_S_DEFAULTS()`, so it is an undeclared persisted field as
well as a dead one. The advertised penalty for the game's sharpest moral shortcut costs the player
**nothing**.

This is the §AUDIT-03v/w cluster's **ninth instance and its worst shape yet**: the previous eight
promise a mechanic that does not exist. This one names a mechanic that **does** exist, under its
real identifier, and writes to a shadow of it. A reader grepping `curseScore` finds a writer, a
reader and a label and concludes the loop is closed.

### F4 — Four of this report's twelve collectible entries cannot be picked up (→ §AUDIT-03x)

`function storyCheckJournal(node) {@30209` matches `e.nodeCode === node.code`, and only a cell's
primary node can become `currentCode` (`const CELL_GRID = (() => {@9852`,
`S_story.currentCode = destCode;@28373`). Walking all 41 entries against cell primacy:

**35 of 41 reachable; 6 blocked** — Entry 10 (`SEN`, behind `LCY`), 16 (`SDQ`, behind `WG0`),
19 (`MSY`, behind `WG0`), 21 (`NAS`, behind `VBY`), 24 (`BHD`, behind `HOR`), 37 (`HER`, behind
`SEA`).

**Four of the six are collectibles this report specifies** — the Proprietor Dusk entry (10), the
Crone Wane entry (16), the Luc entry (19) and the Oracle entry (37). Entry 16 is one of the two
§VII names as the arc's *"warning the player can use"*, so half of that section's evidence is
unreadable in the shipped game. All ten `readAloud` entries — the spine — are reachable, which is
why the loss is invisible: the story still plays, and only the optional layer thins out.

`journalHalf` (nine entries) remains attainable at 35 reachable, so no mission bit is lost here.
This is a new §AUDIT-03x casualty class: **collectible narrative**, not quests.

### F5 — The engine states two different counts of the same document, and the report faithfully quotes both

Kazrath's journal *"mentions Birka. Twice."* in Mordus's negotiation line
(`mentions Birka. Twice.@26496`) and *"mentions Birka forty times"* in Froberger's Entry 26
(`mentions Birka forty times.@27210`). **Both strings are present at the archive**, so this was born
contradictory on or before 2026-05-22, and both surfaces are reachable — `negotiateLine` is read at
three sites in the negotiation panel, and Entry 26 sits on `TRD`, a primary node.

The report is not wrong here; it transcribed each number from its own source. The document is the
evidence that the engine disagrees with itself about a plot-bearing detail.

### F6 — What the author could copy is exact; what they composed is not (instrument 12)

The gradient is the sharpest in the corpus for a *narrative* document, because the transcribed
material is unusually large:

| Passage class | Facts checked | Errors |
|---|---|---|
| Journal entry texts (§III) | 17 entries, full body | **0** |
| Journal node codes (§III) | 17 codes vs the archive | **0** |
| EB NPC name/code/category (§IV) | 36 (12 × 3) | **0** |
| Payment floors quoted (§IV) | 2 | **0** |
| Curse Score formula + thresholds (§VI) | 5 terms | **0** |
| Sweelinck variant texts (§VIII) | 4 | 1 word |
| **Quoted NPC one-liners (§IV tables)** | 9 | **2** (1 condensed, 1 with no source) |
| **Framing narrative (§I, §II)** | 2 counted claims | **2** |

The two framing errors are both **NOT SHIPPED** by instrument 4:

- **The Entry 1 epigraph** — *"The Codex is broken. The Shards are scattered. Someone will come.
  Someone always does."* — has **0 commits ever**. The engine's Entry 1 is the gate-officer entry
  and always was. The report's opening beat quotes a journal entry that has never existed.
- **"The journal has forty-two entries"** is wrong against 41 at both the archive and HEAD — and the
  report **refutes itself**: the Entry 41 text it transcribes verbatim reads *"I wrote it in
  forty-one entries."* Its own movement boundaries (1–14 / 15–28 / 29–41) also assume 41.

The Aldous quote — *"My accountant told me to stop ordering boats"* — appears in no field of the
`EL` record at the archive; the shipped `wound` says *"His accountant has stopped arguing."* Rona's
is a tightened version of a longer live `opening`. Both misses are in the **gloss** columns of §IV's
tables, alongside seven quotes that are verbatim.

***The corpus rule this confirms, from a new direction: a miscounted journal in a summary sentence
is the same error the sibling report `lab-report-friendships-with-magic.md` made in the same week —
both documents transcribe the journal perfectly and both miscount it in prose the author wrote from
memory.***

---

## VI. VERDICT

**As a specification: near-perfect.** 91 % of named identifiers live under their original names; the
central formula, both thresholds, all four dialogue brackets, the toast string, the node number, the
banner behaviour and 17 full journal entries all shipped exactly. The one field-shape divergence —
a 41-entry array where the report promised a 17-entry object — is an expansion in the report's own
direction.

**As a description of the shipped game: it describes a system that no longer runs.** The design's
two payoffs — the Covenant Ending and the twenty return beats that constitute the "world-building
quest" — are both downstream of one 2026-05-29 rename. The feature is not mis-built; it is
disconnected, and every symbol in it resolves, which is why no gate and no census can see it.

**Sections deleted in this pass, with the measurement that justified it.** The 17 verbatim journal
entries (§III of the original) were removed: `const FROBERGER_JOURNAL = [@27184` is the single
source of truth, all 17 were measured byte-identical, and a second copy can only rot. The same
applies to the four Sweelinck variant texts and the two ending texts. This is the §DOC-02h house
move, and its §DOC-02n precondition is satisfied here — the live constant exists and is
authoritative. *Nothing was deleted without first measuring that it was actually transcribed.*

---

## VII. DEFECTS FILED

| Row | Premise | Design call? |
|---|---|---|
| **§ENDING-01** (extended) | The score floor kills 3 of 4 `SWEELINCK_DIALOGUE_VARIANTS` and 4 of 5 `COVENANT_STANDING_LABELS`, and prints `0 / 20` returns on the victory screen — mid-run surfaces, not just the ending | No — released by §EPIC-01 |
| **§EPIC-01** (confirmed) | The origin of F1; this report is the specification the rename disconnected | No |
| **§AUDIT-03ac** (NEW) | `S_story.curseScore` — a player-facing *"+curseScore +5"* penalty writing an undeclared field with 0 readers, shadowing the real `_curseScore()` | No |
| **§AUDIT-03x** (extended) | 6 of 41 journal entries sit on non-primary nodes, 4 of them this report's own collectibles | Existing call |
| **§DX-02n** (extended) | `const JOURNAL_ENTRIES = {@22424` — 5 authored texts, 1 occurrence, 0 readers; plus `S_story.curseScore` | No |
| **§EPIC-04** (NEW) | Kazrath's journal *"Twice"* vs *"forty times"* — two reachable surfaces, born contradictory | Small — which count is canon |

---

*End of report. Verified 2026-08-12 under §DOC-02p.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
