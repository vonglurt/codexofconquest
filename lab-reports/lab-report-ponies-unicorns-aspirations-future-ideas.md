<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->

# Lab Report — Ponies, Unicorns, and Aspirations: Companion Products Beyond the Build

### Post-Game Aspirations and Companion Product Concepts for roll2hit.com

**Original date:** 2026-05-24 · born `1d1b064` 18:47:49, §VI appended `13bb222` 18:54:19
**Original status:** 💭 ASPIRATIONAL — no Layer number, no insertion spec, no HTML changes implied
**Verified:** 2026-08-12 (§DOC-02ae) against `roll2hit-v3.html` @ 38,712 lines · `sources/5thOrgan.html` · `worldbuilder.html`
**Verification verdict:** **3 of 5 concepts SHIPPED, two of them within five days.** The document's own scheduling claim — *"None of these can be started in the current session"* — was falsified **33 minutes later** by a commit in the same session. Every *transcribable* number in it is exact; every *illustrative* field name in it is invented.

---

## Abstract

This report is the project's roadmap-of-aspirations: four companion products imagined for the day the game itself is finished — a **Dungeon Master's Companion Guide**, a **Fishing Guide**, a **Mission Explorer** (a debug-annotated data browser), and a **Polyphonic Pipe Organ Synthesizer** (72 sine oscillators, no samples, no audio files). A fifth idea appears in a single paragraph of §V, almost as an aside: ship the Fishing Guide as a *readable item inside the game* rather than as a document.

Re-measured 80 days later, the register reads: **Mission Explorer SHIPPED** (as `worldbuilder.html`, five days later, inverted on all three of its stated design axes) · **Organ SHIPPED** (as `sources/5thOrgan.html`, thirty-three minutes later) · **Fishing Guide SHIPPED — but as the aside, not the document** (`FISHING_GUIDE_TEXT`, a `type:'readable'` item that unlocks zone DCs) · **DM's Guide NOT SHIPPED** · **Fishing Guide as a standalone document NOT SHIPPED**.

The finding that generalises: the report ranked these by **effort and prerequisite**, and that ranking predicted nothing. What predicted everything is the **medium of the deliverable**. The three concepts that shipped are the three whose output is code or data. The two that did not are the two whose output is prose. This repository converts a specification into an implementation reliably and quickly; it has never once converted a specification into a book.

---

## I. Intent, Inspiration, and What Each Concept Buys the Player

The document was written at a moment of confidence: the world had reached 76 nodes and 370 monsters, the architecture felt settled, and the natural next question was *what is this thing for, beyond itself?* Each of the four answers is a different theory of that question, and each has a distinct effect on playability.

**A. The DM's Companion Guide — playability by *transposition*.**
roll2hit is a solo experience. The Guide's premise is that the HTML file is already an adventure module and only lacks the layer a human Dungeon Master needs to run it for a table: hidden agendas, favor thresholds stated plainly, monster flavour, ending conditions. The playability gain is not to the solo player at all — it converts a single-player program into a multiplayer evening. *"The game's HTML file is the adventure module. The DM's Guide is the thing that tells the DM what everything means."*

**B. The Fishing Guide — playability by *legibility*.**
The fishing sub-game has a rank-20 species pool, a Hooked condition, zone DCs and a predator layer. None of that is discoverable by playing; a player casts, something happens, and the model stays invisible. The Guide's premise is that a systems-dense minigame needs a reference or it reads as randomness. **This is the concept whose implementation the report itself improved in passing** (see §V and Finding 3).

**C. The Mission Explorer — playability by *authorability*.**
The stated target user is *"a DM, a modder, or a curious developer who wants to understand the architecture without reading 14,377 lines of source."* The playability argument is second-order but the strongest of the four: a world this size is only extendable if its data is browsable, and every hour a content author spends grepping is an hour not spent writing a quest. The report's own framing of the requirement is quoted from the user verbatim: *"give all the debug information about the variable name, about the data type, about its index and position where we can reference it to change it."*

**D. The Pipe Organ — playability by *atmosphere*, under an architectural constraint.**
The game ships as one static HTML file with no build step and no assets. That forbids music — every conventional soundtrack is a file. The organ dissolves the contradiction: an additive synthesiser's score is an array of integers and its instrument is arithmetic, so **a pipe organ is the only music design that survives this repository's invariants**. The intended payoff is background music *"like a player piano, in the background, as the game is played"* — a continuous, non-looping-sounding presence during travel and combat.

That last sentence is the origin of **§AUDIO-01**: the synthesiser was built and the embedding never was. The game is silent to this day.

---

## II. Method

Per the §DOC-02 program: batch census of every named identifier before reading the prose; `git log -S` on every dead symbol to separate **RETIRED** from **NOT SHIPPED**; the earliest surviving build `32c10c5` (2026-05-24, 14,377 lines) as the reference for claims about the past; sibling reports as a cross-check; and a reachability closure on every surface claimed playable.

Two program instruments carried this pass in particular:

- **Instrument 12 (copy-vs-illustration).** A passage the author could *copy* is reliable; a passage they *composed to illustrate a point* is not — regardless of whether it looks like a table.
- **Instrument 7 (the corpus).** Three siblings adjudicate parts of this document that it cannot adjudicate about itself: **§DOC-02m** (`lab-report-fish-with-dnd.md`) owns the fishing measurements, **§DOC-02ad** (`lab-report-Polyphonic-Organ-Synth.md`) owns the synthesiser, and **§DOC-02i** independently verified this report's world constants at the archive.

---

## III. Census

**World constants cited in §I.A — all exact at the archive build `32c10c5`** (independently confirmed by §DOC-02i, which measured the same seven constants for a different report on the same tree):

| Constant | As written (2026-05-24) | At archive | At HEAD (2026-08-12) |
|---|---|---|---|
| Nodes | 76 | 76 ✅ | **416** |
| Acts | 8 | 8 ✅ | 8 ✅ |
| Named NPCs | 6 | 6 ✅ (`const NPC_DIALOGUES = {@10396`) | **204 profiles / 213 dialogues** |
| Monsters | 370 | 370 ✅ | **398** |
| Terrains | (66, §III.B) | 66 ✅ | **111** |
| Froberger journal entries | 41 | 41 ✅ | **41** — unmoved in 80 days |
| Codex Shards | 7 | 7 ✅ | 7 ✅ (`SHARD_GOAL = 7@36175`) |
| `_S_DEFAULTS()` fields | 107 (§III.B) | 107 ✅ | 104 of 107 survive |
| HTML source lines | 14,377 | 14,377 ✅ | **38,712** |

**Nine of nine exact.** No design document in this corpus has done better on figures it measured itself.

**§I.B's twenty named NPCs — 19 of 20 resolve (95 %).** Yael, Brynn, Quill, Pachelbel, Weckmann, Auros, Sweelinck, Muffat, Mordus, Draketide, Izador, Rennau, Vonn, Solvak, Yva, Isolde Voss, Benedikt Rasp, Jimmy Two-Tails and the Warden are all live. **`Leeuwenhoek` has 0 occurrences in `roll2hit-v3.html` and 0 commits in its entire history** — the name exists only in the planning documents of the period. A cast list that is 95 % real and 5 % aspirational is exactly what an aspirational document should look like; the point of recording it is that *nothing in the prose distinguishes the nineteen from the one*.

**§III's ASCII detail-panel mock-ups — 0 of 14 field names correct.** See Finding 4.

---

## IV. Spec → Shipped Delta Table

| # | Claim / concept | Section | Verdict | Evidence |
|---|---|---|---|---|
| 1 | DM's Companion Guide, 80–120 pp | §I | **NOT SHIPPED** | no `roll2hit-gm-guide` artefact; 0 occurrences repo-wide |
| 2 | Fishing Guide, standalone 20–30 pp document | §II | **NOT SHIPPED** | superseded by row 3 |
| 3 | Fishing Guide **as an in-game readable item** | §V | ✅ **SHIPPED** | `name:'Fishing Guide', icon:'📖', type:'readable'@13819` · `const FISHING_GUIDE_TEXT =@26659` |
| 4 | …and it gates a mechanic, not just flavour | — | ✅ **exceeded** | `const hasGuide = (S_story.inventory@30406` reveals zone DCs |
| 5 | Mission Explorer, a second HTML data browser | §III | ✅ **SHIPPED** `2d42ea2`, 2026-05-29 | `worldbuilder.html`, 10,685 lines, 17 tabs |
| 6 | …read-only; C/U/D "intentionally excluded" | §III.D | ⚠️ **INVERTED** | 29 `POST` · 32 `PUT` · 4 `DELETE` call sites |
| 7 | …cost: must externalize the data constants | §III.E | ❌ **cost never paid** | `<script src=` = **0** in `roll2hit-v3.html`; the one-file invariant held |
| 8 | …fallback: FileReader drag-and-drop | §III.E | **NOT SHIPPED** | shipped answer is a third option: server-side parse via `wbapi-core.js` |
| 9 | …debug metadata (JS path · type · index) | §III.C | **NOT SHIPPED** → **§DX-02ao** | no detail view emits a reference path, a data type or an array position |
| 10 | …Export as JSON, the "middle path" | §III.D | ✅ **SHIPPED + exceeded** | `worldbuilder.html:/api/export/all?format=json@2616`, `Export JS`, `Export Patched` |
| 11 | …State Flag Browser ("which quest sets it") | §III.B | ◐ **HALF SHIPPED** | `worldbuilder.html:this._flagToQuests[f].writes.push(id)@1695` indexes reads/writes — **over `QUEST_DB` source only**, so the "which render functions read it" half is absent |
| 12 | Yugurt Lake at nodes `YL`, `YC` | §II.1 | ✅ **RIGHT WHEN WRITTEN**, renamed since | archive `YL:{num:75, yugurt_lake}` → `BOO:{ num:75, code:'BOO'@8782`; `YC:{num:76}` → `SSJ:{ num:76, code:'SSJ'@8786` — `num`, terrain and label all preserved |
| 13 | 20-rank fish pool | §II.2 | ✅ **exact** | `const FISH_POOL = [@26504`, 20 entries; plus `const NIGHT_FISH_POOL = [@26526` (5, §XLVIII) |
| 14 | The Hooked condition | §II.1 | ✅ SHIPPED | `condition:'Hooked'` in the catch resolver |
| 15 | 2d20 cast roll table | §II.1 | **RETIRED**, not never-shipped | archive carries the *"🎣 Cast Line (2d20)"* button; Layer 47 replaced it with a four-phase Catch system (§DOC-02m) |
| 16 | `BAIT_FISH_POOL` apex predators | §II.3 | **NOT SHIPPED under that name** | 0 commits ever; apex predator shipped as `name:'Horned Shark'@5511` in `yugurt_lake:      { label:'Yugurt Lake'@6283` |
| 17 | "Master of Yugurt" tournament, five rounds | §II.4 | ✅ **SHIPPED, six** | `title:'Master of Yugurt'@26719`; `const TOUR_TITLES = {@26722` names six ranks |
| 18 | The Fisherman: *"no quest, no connection to the main arc"* | §II.5 | ⚠️ **REVERSED** | he gives the rod, keeps a free-sleep cabin, and is named in Yael's Level-1 tutorial monologue |
| 19 | Organ: 12 voices × 6 harmonics = 72 oscillators | §VI.B/H | ✅ **exact** | `sources/5thOrgan.html:const N_HARM   = 6;@142` · `sources/5thOrgan.html:const MAX_VOX  = 12;@143` |
| 20 | Organ: `f = 440 × 2^((n−69)/12)` | §VI.C | ✅ **byte-exact** | `sources/5thOrgan.html:function midiHz(m)@185` |
| 21 | Organ: stop mixer `1.000 … 0.167` | §VI.C | ✅ **byte-exact** | `sources/5thOrgan.html:drawbars:  [1.000, 0.500@161` |
| 22 | Organ: stop analogies 8′/4′/2⅔′/2′/1⅗′/1⅓′ | §VI.B | ✅ **became the UI** | `sources/5thOrgan.html:const DBAR_LABELS = [@359` |
| 23 | Organ: 10 ms attack, 200 ms release | §VI.G | ✅ **byte-exact** | `sources/5thOrgan.html:attackMs:  10,@163` · `sources/5thOrgan.html:releaseMs: 200,@164` |
| 24 | Organ: Beethoven demo, 8 events | §VI.E | ✅ **byte-exact**, 4 of 5 fields | `sources/5thOrgan.html:const MOTIF = [@147` — every beat, note, duration and velocity identical; only `ch` dropped |
| 25 | Organ: MIDI input, *"the standard and the right choice"* | §VI.D | **NOT SHIPPED** | `requestMIDIAccess` = 0; the string `MIDI` = 0 |
| 26 | Organ: JSON tablature *format* + parser | §VI.D | **NOT SHIPPED as a format** | 0 `JSON.parse`; the data shipped, the file format did not |
| 27 | Organ: manual I / manual II / pedal channels | §VI.D | **NOT SHIPPED** | single manual |
| 28 | Organ: meantone / Pythagorean temperament | §VI.G | **NOT SHIPPED** | 0 occurrences |
| 29 | Organ: delivered as `roll2hit-organ.html` | §VI.G | **renamed** | shipped as `sources/5thOrgan.html` |
| 30 | Organ: *"in the background, as the game is played"* | §VI.A | **NOT SHIPPED** → **§AUDIO-01** | `roll2hit-v3.html` has 0 `AudioContext` / 0 `<audio>` / 0 `iframe` |
| 31 | *"None of these can be started in the current session"* | §IV | ❌ **falsified in 33 minutes** | see Finding 1 |

---

## V. Finding 1 — The Thirty-Three Minute Falsification

The document ends its priorities section with a flat scheduling claim: ***"None of these can be started in the current session. The DM's Guide requires a complete game. The Fishing Guide requires §XII. The Mission Explorer requires an architectural decision about the one-file constraint."*** Git disagrees, on the same evening, in the same working session:

| Time (2026-05-24) | Commit | Event |
|---|---|---|
| 18:47:49 | `1d1b064` | Report born with §I–§V, including *"None of these can be started in the current session."* |
| 18:54:19 | `13bb222` | **§VI — the organ — appended to the same file.** A fifth concept, six minutes later. |
| 19:20:35 | `030c446` | **`5thOrgan.html` shipped**, complete with drawbars, ADSR, oscilloscope, voice stealing and its own IEEE design report. |

Thirty-three minutes from *"none of these can be started"* to a working polyphonic synthesiser with a companion lab report. The document then absorbed the news about itself: the closing status block — *"**Implementation status (2026-05-24):** ✅ Implemented"* — sits eleven lines below the sentence it refutes, and **both are still in the file**.

This is not an error to correct; it is the most useful thing the document records. ***A roadmap's estimate of its own tractability is a claim like any other, and it is the claim most likely to be wrong within the hour.*** The sentence was true about the DM's Guide, true about the Fishing Guide, true about the Explorer's architectural question — and the author, five minutes after writing it, found a fifth idea it was not true about and simply built the thing.

The five-day figure for the Explorer is the same result at a coarser resolution: `worldbuilder.html` is born on 2026-05-29 (`2d42ea2`, *"Working on worldbuilder to further the abstractions"*), and the *"architectural decision"* it was blocked on was never made — it was **dissolved** (Finding 3).

---

## VI. Finding 2 — The Medium Predicted Shipping; the Effort Ranking Predicted Nothing

§IV's priorities table is the document's central analytical artifact. Scored at 80 days:

| Product | Stated prerequisite | Stated effort | Outcome |
|---|---|---|---|
| DM's Companion Guide | game content-complete | HIGH | **not shipped** |
| Fishing Guide (document) | §XII Fishing Overhaul | MEDIUM | **not shipped** — §XII shipped, the document did not |
| Mission Explorer | architectural decision on data externalization | HIGH | **shipped in 5 days**, decision dissolved |
| *(Organ — added after the table, never entered in it)* | — | — | **shipped in 33 minutes** |
| *(Fishing Guide as an item — §V aside, never entered in it)* | — | — | **shipped** |

The effort column ranked the Explorer HIGH and the Fishing Guide MEDIUM; the HIGH one shipped and the MEDIUM one did not. The prerequisite column blocked the Explorer on a decision that turned out not to need making, and blocked the Fishing Guide on §XII, which shipped — and the document still did not follow.

**The variable that separates the shipped from the unshipped is what the deliverable is made of.** Explorer → code. Organ → code. Fishing Guide as an item → a `readText` string and an inventory object, i.e. game data. DM's Guide → 80–120 pages of prose. Fishing Guide as a document → 20–30 pages of prose. **Three for three on code; zero for two on prose.**

> **26th INSTRUMENT (new this pass): in a roadmap document, the DELIVERABLE'S MEDIUM predicts shipping far better than its stated effort or prerequisite.** A repository with an authoring pipeline converts a specification into an implementation on the day it is written; the same repository has no pipeline that converts a specification into a book, so the prose deliverable waits on a resource nobody scheduled. When a plan mixes both media, rank by medium first and read the effort column second.

The corollary is a practical one for this project: **the DM's Guide and the Fishing Guide are more likely to ship as game surfaces than as documents.** §V already proved the pattern once. The Explorer's NPC and Quest tabs are two-thirds of the DM's Guide's Part II and Part IV, rendered from live data rather than transcribed — and a transcription would have rotted, as this corpus has now measured a dozen times.

---

## VII. Finding 3 — The Explorer Shipped, Inverted on All Three of Its Design Axes

`worldbuilder.html` (10,685 lines, 17 tabs: Map · Bestiary · Loot · NPCs · Quests · Dice Lab · CRUD · API · Audit · Stats · Endpoints · Builder · Wizard · Editor · Mission · Walk · Mesh) is unmistakably the Mission Explorer. `worldbuilder.html:data-tab="bestiary"@403` is §III.B's Monster Explorer; the NPCs, Quests and Mission tabs are its NPC, Quest and Mission-Arc browsers. And on each of the three axes the report reasoned about explicitly, the shipped answer is the opposite of the specified one.

**Axis 1 — Read vs. Write.** §III.D excludes Create/Update/Delete for three stated reasons: *"the HTML is the source of truth"*, *"a write interface would need validation, undo, and conflict resolution"*, *"read-only is safe and useful; writable is risky and complex."* HEAD ships **29 `POST` · 32 `PUT` · 4 `DELETE`** call sites. The objection was not overruled — it was **answered by building the thing it asked for**: WBAPI validates (a bad monster body is rejected 422 with the field list and nothing is written) and excises at source level with verify-or-revert. *The report was right that writes need validation. It was wrong that this meant not writing.*

**Axis 2 — Where the data comes from.** §III.E enumerates exactly two options: externalize the constants into `roll2hit-data.js` (*"a significant change to the 'one file' architecture"*), or a FileReader drag-and-drop that `eval()`s the constants from the dropped file. Neither shipped. The shipped mechanism is a **third option the document does not consider**: a local server parses the HTML *as text* and serves structured data over REST, so the browser never needs the constants at all. `roll2hit-v3.html` contains **zero** `<script src=` tags — **the architectural cost the report priced was never paid, and the decision it was blocked on was never made.**

> This is the 22nd instrument in its cleanest positive form: *enumerate the space the chooser actually chooses from.* The report enumerated two options and the winner was outside the enumeration. A two-option table reads as exhaustive precisely because it is a table.

**Axis 3 — Debug metadata.** This is the one axis where the report is right and HEAD is not. §III.C quotes the user's own requirement verbatim and specifies three things per field: **JavaScript reference path** (`MONSTER_POOL["goblin_scout"].ac`), **data type**, and **position** (array index / object key / line number). No detail view in `worldbuilder.html` emits any of the three. What shipped instead answers the *"reference it to change it"* half by a different route: the Wizard and Builder tabs emit the **API call** that mutates the record. That is arguably better for authoring and strictly worse for understanding — you learn how to change the value without ever learning where it lives. → **§DX-02ao**.

A fourth, gentler result: §III.B's **State Flag Browser** is half-built and nobody noticed. `worldbuilder.html:this._flagToQuests[f].writes.push(id)@1695` maintains a per-flag reader/writer index — precisely §III.B's *"which quest/arc sets it"* row — but its scan universe is the `QUEST_DB` source text only, so the *"which render functions read it"* row is structurally absent. **That is the same blind spot `check:deadconsts` (§DX-02n) keeps rediscovering from the other side**, and this is prior art for it: the census already exists, it is simply pointed at one section of the file.

---

## VIII. Finding 4 — Instrument 12, and the Mock-Ups Are Illustrations

§III.B's four ASCII detail panels are the document's most concrete-looking passages: box-drawn, monospaced, field-by-field, with JavaScript paths in the right-hand column. They are also the least accurate thing in it. **Not one field name in them is real.**

| Mock-up field | As written | Live | Verdict |
|---|---|---|---|
| Damage dice | `.die`, `.dieCount`, `.mod` | `dmgDie` · `dmgCount` · `dmgFlat` | wrong ×3 |
| Tier value | `low` | one of `trivial\|easy\|medium\|hard\|deadly` | not in the vocabulary |
| Monster key | `goblin_scout` | — | **0 commits ever** |
| Terrain roster | `street_rat`, `pickpocket` | — | **0 commits ever** |
| Terrain flag | `WORLD_DB[…].epic` | — | `epic:` = 0 occurrences |
| Favor field | `S_story.fav_yael` (int 0–2) | `npcFavorability` | **0 commits ever** |
| Quest key | `quest_yael_escort` | — | **0 commits ever** |
| Complete flag | `yaelEscortDone` | — | **0 commits ever** |
| Hunt weight | `HUNTING_GROUNDS["alley"]` | tombstone comment only | deleted by §TIMELESS-01 |
| Node code | `CI (City Intersection)` | `LHR`, City Streets | the §AUDIT-03m class |
| XP formula | `floor(AC * HP * 0.1) = 9` | `floor(0.1 × AC × maxHP)` | ✅ **correct** |

**Two survivors, and both are the two the author could copy**: `yaelEscortUsed` is live (13 occurrences) because it is a real `_S_DEFAULTS()` field, and the XP formula is right because it is a real formula. Everything invented to make a box look populated is invented wrong.

This is instrument 12 in a form worth keeping, because it defeats the older instrument-9 heuristic completely: these panels *cite JavaScript paths, array indices and data types* — every surface signal of a copied passage — and they were composed. ***The tell is not whether a passage looks like data. It is whether the data was there to be copied when the passage was written.*** In May 2026 the Explorer did not exist, so there was no detail panel to transcribe; the author drew what one would look like, and drawing requires names.

---

## IX. Section VI — The Organ: Near-Total Spec Fidelity, and the One Thing That Did Not Ship

§VI is the highest-fidelity specification in this corpus. Every quantity it states is in the shipped synthesiser, unchanged, 80 days later:

- `sources/5thOrgan.html:const N_HARM   = 6;@142` and `sources/5thOrgan.html:const MAX_VOX  = 12;@143` → **72 oscillators**, exactly §VI.H's budget.
- `sources/5thOrgan.html:function midiHz(m)@185` is `440 * Math.pow(2, (m - 69) / 12)` — §VI.C byte-for-byte.
- `sources/5thOrgan.html:drawbars:  [1.000, 0.500@161` — all six values are §VI.C's `stopMixer` literally.
- `sources/5thOrgan.html:const DBAR_LABELS = [@359` — `H1 8′ · H2 4′ · H3 2⅔′ · H4 2′ · H5 1⅗′ · H6 1⅓′`, which is §VI.B's *"Pipe organ stop analogy"* column promoted into the user interface.
- `sources/5thOrgan.html:attackMs:  10,@163` / `sources/5thOrgan.html:releaseMs: 200,@164` — §VI.G's envelope, to the millisecond.
- `sources/5thOrgan.html:const MOTIF = [@147` — all eight Beethoven events identical to §VI.E's JSON in beat, note, duration and velocity; only `ch` was dropped, the manual assignment having no consumer in a single-manual instrument.

**What did not ship is the entire input layer.** §VI.D argues at length that MIDI is *"the standard and the right choice"* and specifies channel assignments for Manual I, Manual II and Pedal; `requestMIDIAccess` has **0** occurrences and the string `MIDI` appears **0** times in the shipped file. The JSON tablature offered as the *fallback* (*"if not MIDI"*) also did not ship as a **format** — there is no parser, no `resolution` key, no `duration` key, no `JSON.parse`. What shipped is the tablature's **content** as a hardcoded positional array. So of the two input paths the report ranked, the winner is the one it ranked last and did not name: *embed the sequence and skip the file format entirely.*

**One footnote the sibling report needs.** §DOC-02ad found that the shipped organ's default registration is a **Flute** (≈1/n², within 0.8 %) while both the synth's report and its preset table call it a **Principal** — and filed §DX-02am. This document is the innocent half of that defect and explains it. §VI.C specifies `1/n` as the *whole* amplitude law, which is correct: at the time of writing there was no falloff control, and `1/n` genuinely is a principal stop. The synthesiser later added `sources/5thOrgan.html:falloffDB: 6,@162` — an independently correct 6 dB/octave term — **on top of** drawbars that already carried the 1/n taper, and the product is 1/n².

> ***DURABLE: a parameter added on top of a completed specification silently re-signs every default written against it.*** Neither document is wrong on its own; the defect exists only in the space between them, which is why instrument 7 (read the corpus, not the report) is the only thing that could find it.

**And the thing that never happened at all.** §VI.A is explicit that this is a *game* feature — *"driven by a sequencer that reads a note file and plays it like a player piano — in the background, as the game is played"* — and the synth's own conclusion says it is *"ready for embedding as an iframe."* `roll2hit-v3.html` has **0** occurrences of `AudioContext`, `createOscillator`, `new Audio`, `<audio>` or `iframe`; its 119 uses of *"sound"* and 21 of *"music"* are all narrative prose. The instrument was built, the score was written, the file was filed under `sources/` with the authoring tools, and **the game has never made a sound**. That is §AUDIO-01, and this paragraph is its originating requirement.

---

## X. Concept Register (all five, scored)

| # | Concept | Register verdict | Shipped as |
|---|---|---|---|
| 1 | DM's Companion Guide | ❌ not shipped in 80 days | — (partly superseded: the Explorer's NPC/Quest/Mission tabs render Parts II and IV from live data) |
| 2 | Fishing Guide (document) | ❌ not shipped in 80 days | — |
| 3 | Mission Explorer | ✅ shipped +5 days, inverted on 3 axes | `worldbuilder.html` |
| 4 | Pipe Organ Synthesizer | ✅ shipped +33 minutes | `sources/5thOrgan.html` — **not embedded** (§AUDIO-01) |
| 5 | Fishing Guide **as an in-game item** (§V aside) | ✅ shipped | `const FISHING_GUIDE_TEXT =@26659` |

**Three of five, and the ranking got them in the wrong order.** The one-paragraph aside outperformed the section it was an aside to. The concept given the most pages (the DM's Guide, six subsections and a nine-row field table) is the one with the least code behind it — which is not a coincidence but the same finding again: **pages are what you produce when the deliverable is pages.**

There is one honest bright spot in the register's own reasoning, and it deserves saying. §I.A's argument for why a Guide is *possible* — *"the world is rich enough to support a tabletop session"* — has only got stronger: 76 → 416 nodes, 6 → 204 NPC profiles, and `function _missionComplete() {@23648` still counts exactly the twelve narrative bits the DM's Guide Part IV proposed to explain. The premise held. The medium did not.

**One caution for whoever eventually writes Part V.** The report specifies documenting *"all four endings … with the specific score conditions that trigger each."* At HEAD, **three of those four conditions cannot fire**: `_curseScore()` has a closed form of `20 + 2 × (EB bosses defeated)` and a floor of 20, because its `ebReturnDone` term is written only by a beat reachable through a quest id `QUEST_DB` does not hold (**§EPIC-01**, **§ENDING-01**). A DM's Guide written today would document three endings the game cannot reach. ***The Guide's stated prerequisite was "the game must be content-complete"; the real prerequisite is a two-site rename.***

---

## XI. Defects Filed and Cross-References

**New this pass:**

- **§DX-02ao (🟡, small design call)** — *the Explorer's debug-metadata requirement never shipped.* §III.C is a verbatim user requirement — variable name, data type, index/position, *"where we can reference it to change it"* — and no `worldbuilder.html` detail view emits a JavaScript reference path, a data-type annotation or an array position. The Wizard/Builder tabs answer the *mutation* half by emitting the API call, so the gap is specifically **comprehension**, not authoring. Design call is on form only (an always-on metadata column · a "dev mode" toggle · a click-to-copy path chip).
- **§DX-02ap (🟢, no design call)** — *the authoring tool teaches raw `curl`.* `worldbuilder.html:Full curl sequence (run in order)@7929` renders a runnable `curl -s -X POST …/node|/monster|/quest` sequence for the author to copy, which is the exact shape prompt.md §3 and CONTRIBUTING Hazard #7 forbid (*"all world-building goes through `./api.sh`"*). It is invisible to every gate: §DX-02l-FU's detector was narrowed to *"a line an author can copy and run"* — which these are — but scans `.md` files only, and `worldbuilder.html` is not in its universe. Fix: emit `./api.sh post node code=… label=…` equivalents beside (or instead of) the curl block. The **Endpoints** tab's curl examples are correct as-is; that tab is an HTTP reference, not an authoring path.
- **§DX-02n +1 (prior art, not a new member)** — `worldbuilder.html:this._flagToQuests[f].writes.push(id)@1695` already implements the reader/writer census `check:deadconsts` has been specified to need, over `QUEST_DB` source text. Whoever builds the gate should start here and widen the scan universe to the whole file rather than start over.

**Corroborated, not re-filed** (existing-work-first):

- **§AUDIO-01** — this document's §VI.A is its originating requirement; the *"background music as the game is played"* framing is quoted here verbatim and remains the strongest argument for the row.
- **§DX-02am** — explained, not duplicated: see §IX.
- **§FISH-01** — `LYR:{ num:41, code:'LYR'@8723` (act 7) is declared 59 lines before `BOO:{ num:75, code:'BOO'@8782` (act 3) and both occupy cell `2,194`, so `isFishingLake:true@8782` never reads at a node the player can stand on. This report's §II and §V both describe a sub-game that is currently unreachable by walking. Owned by §DOC-02m; re-derived independently here.
- **§EPIC-01 / §ENDING-01** — the real blocker on the DM's Guide Part V (see §X).
- **§AUDIT-03u** — Yael's Level-1 monologue still says *"the known world has forty-two nodes."* It is also, pleasingly, where she sends the player to the lake: *"Go north to Yugurt, to the cabin, and find the old man who keeps it — they call him the Fisherman. He hands the rod to anyone who will use it, free, and asks nothing back."* Which is the exact contradiction of §II.5's *"just a man who fishes"* — the Fisherman became load-bearing.

---

## XII. Preserved Aspirational Content — NOT SHIPPED, kept

Per program policy, an unshipped claim is marked and kept, never deleted. The following are the document's live proposals and remain valid asks:

**The DM's Companion Guide (§I).** Six parts: *The World Before the Players Arrive* (the 49-day countdown, act-by-act state, the Froberger backstory told plainly, the Scholar Kings' suppression policy as narrative) · *NPC Profiles, full spoilers* — one page each, nine fields: name/node · public face · hidden truth · agenda · favorability gates · all quotes verbatim by state with DM context · Froberger connection · quest chain beat-by-beat · improvisation notes · *Monster Manual* — all monsters by terrain and tier with stat block, loot, flavour, encounter feel · *Mission Architecture* — the twelve `_missionComplete()` bits, side quests, Epic Battleground quests with their wound/opening/warning/negotiate/return lines, the Curse of Knowledge formula explained plainly · *The Endings* — all four plus the §XVII fifth, with what to say to the table after each, and how to run NG+ ("everything is remembered") · *DM Tooling* — difficulty scaling, homebrew NPCs on the `NPC_DIALOGUES` shape, running without a computer, and the "Quest −1" invitation (what Level 21 means, and how a DM writes it). Format: 80–120 pp, or a second HTML file under the same one-file philosophy.

**The Fishing Guide as a document (§II).** Five sections: the Yugurt Lake system · the rank 1–20 fish table · predator encounters and bait tiers · the Master of Yugurt tournament · fishing as world lore. Substantially superseded — the mechanics now live in `mechanics-combat.md` and in the in-game readable — but the *lore* section (why the Void Tide changes what lives in the water) has no home yet.

**Mission Explorer, unbuilt parts.** The debug-metadata layer (§DX-02ao) · the State Flag Browser's engine-side reader column · per-field line-number references into the HTML.

**Organ, unbuilt parts.** Web MIDI live keyboard input (`navigator.requestMIDIAccess()`) with Manual I / Manual II / Pedal on channels 1–3, the pedal restricted to fundamental + 2nd harmonic · a parsed JSON tablature file format · meantone and Pythagorean temperaments for period-accurate beating · voice-stealing warnings when a composition exceeds 12 simultaneous notes · **embedding the organ in the game** (§AUDIO-01).

---

## XIII. Conclusion

The document set out to record ideas *"so they are not lost, not so they are acted on immediately"* — and then two of them were acted on immediately, one of them within the same session, six minutes after the sentence saying none could be.

What survives re-measurement is not the roadmap but the taste behind it. Every number the author measured is exact, eighty days and 5.5× the file later. The physics of the organ is right, the harmonic table became a user interface, and the demo motif is byte-identical. The one-paragraph aside about shipping a guide as an in-game item turned out to be the most implementable idea in the file. And the two things it got wrong — the effort ranking and the mock-up field names — are wrong in the same way and for the same reason: **they describe things that did not exist yet, and description without a source to copy from is invention.**

For a document whose title promises ponies and unicorns, the accuracy rate on the things it could check is remarkable, and the failure rate on the things it could not is total. *That is the whole method of this program in one file.*

---

**Anchors used in this report** resolve against `roll2hit-v3.html` (38,712 lines), `sources/5thOrgan.html` (448 lines) and `worldbuilder.html` (10,685 lines) as of 2026-08-12. Legacy node codes (`YL`, `YC`, `CI`, `SL`, `CQ`, `VS`) are preserved as written — `lab-reports/` is a HISTORY corpus under `scripts/legacy-codes.js`; annotate, never rewrite.

---

*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
