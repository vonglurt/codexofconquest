<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->

# Lab Report — Story × Codex of Conquest × The Curse of Knowledge
### Applying Steven Pinker's *Sense of Style* to roll2hit Story Design

**Date:** 2026-05-22 · **Source material:** `story.md`, `spec-world.md`, `monsters.md`
**Framework:** David Perell interview with Steven Pinker
**Category:** Narrative Craft · Prose Specification · Pre-Implementation Style Guide
**Verification:** §DOC-02al, 2026-08-12 — re-measured against live `roll2hit-v3.html` (38,712 lines) and `story.md`, 82 days on.

---

## Abstract

A writing-craft review of the game's narrative layer, applying four Pinker principles — the curse of
knowledge, mental imagery over abstraction, the example/generalization pendulum, and empathy — to produce
concrete replacement prose: seven rewritten NPC dialogue hooks with profile expansions, two revised terrain
descriptions, three new journal entries, eight act epigraphs, an eight-line incidental quote table, and a
retitle of the game's central premise from *The Shattered Codex* to **Codex of Conquest**.

**Verification result.** This is the third report in the program to specify **voice** rather than tokens,
and it splits more cleanly than either predecessor. **Its drafts died and its ideas shipped.** Of roughly
26 distinctive prose specimens it authored, **one** survives — and that one changed speaker, channel and
one clause on the way. Every passage it quoted as *already existing* and recommended keeping survives.
Meanwhile the prescribed **style** became the house style, measurably: node text carrying a concrete
number rose from 28 % to 62 % and tripled in length; the report's retitle is the first line on the
starting node; and the phrase in its own subtitle is the emotional thesis of the journal's final entry.

***A style guide is obeyed by its principles and ignored by its examples.***

---

## I. Intention and Inspiration

### I-A. The diagnosis

Pinker's sharpest observation about bad writing: the writer forgets what it is *not* to know something.
A molecular biologist stands on a TED stage and addresses a room of designers as though they had been in
the same lab for six years. Within four seconds everyone is lost, and the biologist is the last to notice.

The report's claim is that `story.md` was structurally excellent and locally abstract — that it told the
DM what happens instead of letting the player feel what it is like to be there. It named things ("crypt,"
"shadowy underbelly") instead of showing them. Three corrective principles follow: understanding is a
*mental image*, not a string of words (say "bunny rabbit," not "stimulus"); examples without
generalizations are adrift and generalizations without examples are empty, so good prose swings between
them; and empathy is cultivated by specific detail, not asserted.

### I-B. Why this helps the *game*

roll2hit is read-and-click. A player spends most of a session looking at a node description and a mission
card — there is no camera, no score, no animation carrying mood. **The prose is the entire audiovisual
budget.** A node that says *"the crypt has old tombs"* gives the player nothing to stand in; a node that
says the dust has settled perfectly *until the second room, where it is gone entirely* gives them a place
and a reason to be uneasy in it, at identical rendering cost.

The second contribution is retention across a 49-day doom clock. A player returns to a node many times.
Category text ("the tavern is rowdy") is exhausted on first read; concrete text ("someone has thrown a
stool into the fireplace and it's slowly catching") survives re-reading because the detail is doing the
work rather than the label. The report's checklist (§VII) is, in effect, a spec for **re-readable node
text** — which is the only kind this game can afford.

The third is the emotional architecture the retitle exists to serve. *The Shattered Codex* frames the game
as retrieval — a fetch quest in ancient paper. **Codex of Conquest** reframes the Void as a *conqueror*
that advances where defenders are thin, and the seven Shards as surrender documents signed by seven
scholar-kings who refused to let the world forget itself. The player is not collecting artifacts; they are
inheriting a debt. That single reframing is what turns a shard count into a covenant, and it is the one
proposal in this report that shipped fastest and furthest.

---

## II. Method

Four Pinker principles applied to six surfaces: terrain description, character dialogue, character
interiority ("profile expansion"), the courier's journal, act-opening epigraphs, and incidental one-line
quotes. Each proposal is stated as **current version → revised version**, with a short rationale.

**Verification method.** Prose cannot be scored by symbol census, so this pass measures three things
separately: (1) **names**, which are engine identifiers and can be counted; (2) **verbatim survival** of
each authored specimen, greped against both `roll2hit-v3.html` and `story.md`, the report's stated target;
and (3) **style adoption**, measured as the share of `NODE_MAP` text fields carrying a concrete numeral,
at the earliest surviving build (`32c10c5`, 2026-05-24 — two days *after* this report) versus HEAD.

---

## III. Verification — As-Built Delta Table

| # | Claim / proposal | Measured | Verdict |
|---|-----------------|----------|---------|
| 1 | Retitle to **Codex of Conquest** | live as the **starting node's tagline** — `story-ci-tagline@31319` on `LHR`, *"LETS GO — Codex of Conquest: Curse of Knowledge"* — present already at `32c10c5` | ✅ **shipped, fastest** |
| 2 | Magistra Elara **Voss** | **0 occurrences, 0 commits ever**; engine ships `LCY: { name:'Magistra Elara Muffat'@22464` — the name the report's *own body* uses | ❌ **never shipped** (Finding 2) |
| 3 | Archivus Ptolemy **Crane** | **0 occurrences, 0 commits ever**; engine ships **Sweelinck** (632 hits) — the name the report's *own body* uses | ❌ **never shipped** (Finding 2) |
| 4 | §IV *"**Finn's** Journal"* | **0 occurrences, 0 commits ever**; engine ships `const FROBERGER_JOURNAL@27184` — the name the report's *own body* uses | ❌ **never shipped** (Finding 2) |
| 5 | Aldric · Draketide · Kael Mordus · Izador al-Rashun · Kassiphane | all live (11 · 18 · 6 · 16 · 6 hits) | ✅ 5/5 |
| 6 | Trade Seal · Grove Token · Cipher Scrap · Sand Cipher · Olympian Key | all live (10 · 2 · 3 · 3 · 2) | ✅ 5/5 |
| 7 | "Warrant coin" | 0 | ❌ |
| 8 | 7 revised dialogue hooks | **0 of 7** survive verbatim in engine or `story.md` | ❌ (Finding 1) |
| 9 | 7 profile expansions | **0 of 7** | ❌ (Finding 1) |
| 10 | 3 new journal entries (3, 19, 28) | all three slots **exist and carry entirely different text at different nodes** (`KRN`, `MSY`, `FEZ`) | ❌ 0/3 |
| 11 | 8 act epigraphs | **0 of 8**; the pre-existing one-line epigraphs survive unchanged and were already present at `32c10c5` | ❌ 0/8 |
| 12 | 8-line incidental quote table | **0 of 8** | ❌ |
| 13 | Revised premise passage | 0 | ❌ |
| 14 | *"thirty-eight months"* (Muffat revision) | **live** — but inside `entryNum:14, nodeCode:'LCY'@27198` as **reported speech in the journal**, one clause dropped | ⚠️ **shipped, transposed** (Finding 3) |
| 15 | Entry 41, quoted as "current" and praised | byte-exact at `NUE: { num:41@22429` — inside `const JOURNAL_ENTRIES@22424`, which the engine's own comment calls **dead code**, **0 readers** | ⚠️ **preserved, unreachable** (Finding 4) |
| 16 | *"I wrote that riddle door when I still had good knees"* — called "the best line in the document," marked **keep** | live, as `NUE`'s **node text**, not as dialogue (`label:"Scholar's Quarter — Weimar"@8705`) | ✅ kept, re-channelled |
| 17 | Prescribed style (concrete detail over category) | node text with a concrete numeral **28 % → 62 %**; mean length **166 → 572 chars** | ✅ **adopted** (Finding 5) |

**Prose census: 1 of ~26 authored specimens survives (4 %) — and it changed speaker and channel.
Name census: 8 of 11 named identifiers resolve (73 %); all 3 failures are the report's own section
headings, each contradicted by its own body.**

---

## IV. Findings

### Finding 1 — The drafts died

Seven rewritten dialogue hooks, seven profile expansions, three journal entries, eight epigraphs, eight
quote-table lines, one revised premise. Tested as distinctive verbatim fragments against both the engine
and `story.md`: *"the last ones matter most"*, *"It never stopped the dreams"*, *"a wound that healed
badly"*, *"I knew someone would come"*, *"the score resets"*, *"I grew it by looking away"*, *"two
centuries rethinking the word 'elegant'"*, *"it cannot hold two questions simultaneously"*, *"seventeen
drafts"*, *"An eleven-year wait … It's a Tuesday"*, *"He planted. I'm climbing."*, *"harbor gulls have
learned that calling draws competition"*, *"the horizon is always the same distance away"*. **Zero hits,
in either file.**

This is the §DOC-02aj result reproduced on a third report and by a different route. There the finding was
that a spec's *tokens* survived and its *voice* did not. Here the report specified nothing but voice — no
ids, no flags, no node codes — so there was no token layer to survive, and the survival rate is the voice
rate: near zero.

### Finding 2 — Three name splits, and in all three the heading lost to the body

The report names three characters twice, and each time the two names sit in the same section:

| § heading says | § body says | Engine ships | Heading's history |
|---|---|---|---|
| Magistra Elara **Voss** | *"**Muffat** has had three couriers in six years"* | `Magistra Elara Muffat` | **0 commits ever** |
| Archivus Ptolemy **Crane** | *"**Sweelinck** is ninety-two years old"* | `Ptolemy Sweelinck` (632 hits) | **0 commits ever** |
| §IV — **Finn's** Journal | *"**Froberger's** journal is the document's most underused resource"* | `FROBERGER_JOURNAL` | **0 commits ever** |

A fourth is inherited rather than minted: *"Commander Auros"* (§II) is `name:'Commander Seraphine Bruhns'`
in the engine — the split that cost **§AUDIT-03n** a whole row, with 21 unreachable registry entries and
the *stranger* epilogue rendering at any favor.

§DOC-02d's 5th instrument holds — *a design doc that uses two names for one character mints two keys* —
but this report sharpens it with a **direction**. In all three cases the heading is the invented name and
the body is the real one, and the body won every time. The reason is mechanical: a heading is written
once, in the planning voice, before the section exists; the body is written while thinking about the
character, and thinking about the character means using the name the world already calls them. ***The
invented name is a symptom of the section not being written yet.***

Unlike §AUDIT-03n's, these three cost nothing — none reached the engine, so there is no second key to
repair. That is the difference between a name split in a *specification* (which the implementer silently
corrects) and one in a *character profile* that ships (which becomes the schema).

### Finding 3 — The one surviving specimen changed speaker, channel and a clause

The report's revised Muffat dialogue:

> *"He was careful. Couriers who are careful last three years on this route; the ones who aren't last three
> weeks. He lasted thirty-eight months."*

HEAD, at `entryNum:14, nodeCode:'LCY'@27198`:

> *"Magistra Muffat said: He was careful. Couriers who are careful last three years on this route. He
> lasted thirty-eight months."*

Word-for-word, minus the clause *"the ones who aren't last three weeks"* — and **relocated from Muffat's
mouth into the courier's journal as reported speech**, prefixed with *"Magistra Muffat said:"*. The line
the report wrote to be *heard* is at HEAD something the player *reads about having been said*.

This is §DOC-02aj's transposition mechanism in a second form. There a spec's second-person player-as-Paul
was re-voiced as third-person Paul-and-companion. Here direct dialogue was re-voiced as journal reportage.
Both times the words survived and the **channel** did not, and both times the channel change is what makes
a verbatim grep report zero. ***Search for the sentence, not for the speaker — and when a specimen goes
missing, check whether it merely changed mouths.***

### Finding 4 — The passage it praised is preserved exactly, in dead code

The report quotes Entry 41 as its exemplar of what the journal already does well, and analyses it at
length — *"the line 'I didn't tell him I don't have a sibling' is devastating because…"*

That entry is at HEAD, byte-exact, at `NUE: { num:41@22429`. It sits inside
`const JOURNAL_ENTRIES@22424`, whose own declaration comment reads:

> `// dead code — 5 node-specific Froberger quotes (entries 7/14/23/31/41); superseded by FROBERGER_JOURNAL delivery system`

**One occurrence in 38,712 lines — its declaration. Zero readers.** No player can reach it.

The live entry 41 (`entryNum:41, nodeCode:'TLS'@27225`) is a complete rewrite. It keeps exactly one thing
from the passage the report praised — the clause *"Your sibling will find seven"* — and rebuilds the rest
around a new thesis:

> *"The curse is not gathering the Shards. The curse is knowing, every time, that you are the only one who
> will — and being right about that, and still not knowing whether being right about it is the same as it
> being true."*

**That is this report's own subtitle.** *The Curse of Knowledge* enters as a diagnosis of the author's
prose and exits as the courier's diagnosis of himself. The report's critical *reading* of entry 41
outlived entry 41's own sentences: the engine discarded the wording, kept the clause the report singled
out, and rewrote the entry around the frame the report brought to it.

`FROBERGER_JOURNAL` remains **41 entries** — the constant §DOC-02i measured as the only one in the program
that had not moved in 79 days. At 82 days it still has not.

### Finding 5 — The style shipped, and it is measurable

Node text scored at the earliest surviving build versus HEAD, same extraction on both sides:

| | `32c10c5` (2026-05-24) | HEAD (2026-08-12) |
|---|---|---|
| Nodes with text (sampled by one declaration shape) | 50 | 167 |
| Mean length | **166 chars** | **572 chars** (3.4×) |
| Share containing a concrete numeral | **28 %** | **62 %** |

The report's fourth checklist question is *"Is there a specific detail that makes the general true? Not
'Froberger was careful' but 'Froberger lasted thirty-eight months.'"* The concrete-numeral share is a
crude proxy for exactly that move, and it more than doubled. The qualitative evidence is stronger than
the proxy — the node text written afterward reads like the report's own revisions:

> `label:"Scholar's Quarter — Weimar"@8705` — *"The reading room is lit by twelve candles and one scholar
> who fell asleep at his desk three days ago and has not been disturbed."*
> `label:"Aldric's Forest"@8659` — *"The crow marks begin at the forest edge: carved into bark every 200 paces, roughly at eye
> height, facing the path."*

Twelve candles, three days, 200 paces, eye height. This is the prescribed method, executed on nodes the
report never mentioned, in sentences it did not write.

**Stated honestly: this is correlation, not proof.** No pre-report build survives — the archive postdates
the report by two days — so the style cannot be measured before its publication, and node text also grew
for reasons this report had nothing to do with. What can be said without hedging is that **the game's
starting node carries this report's title and subtitle**, and that the writing which followed obeys its
rules while quoting none of its sentences.

***Sixth-and-final finding, stated as an instrument: a style guide is obeyed by its PRINCIPLES and ignored
by its EXAMPLES.*** The examples are the author's voice and the implementer already has one; the
principles are portable and cost nothing to adopt. A prose spec that measures its own success by verbatim
adoption will conclude it failed, and will be wrong.

---

## V. What Did Not Ship, and Is Kept

Per program policy, a claim that did not ship is recorded rather than deleted.

- **NOT SHIPPED** — 7 revised dialogue hooks; 7 profile expansions (Muffat's three couriers, Aldric's
  forty years, Draketide's survived hanging, Mordus's three unmet children, Izador's six students,
  Kassiphane's eighty years without hope, Sweelinck's eighteen drafts); 3 journal entries; 8 act
  epigraphs; the 8-line quote table; the revised premise passage; the riddle-door answer *"the world."*
- **NEVER SHIPPED** — the names *Elara Voss*, *Ptolemy Crane*, *Finn* (0 commits ever, all three).
- **SHIPPED** — the retitle; *"thirty-eight months"* (transposed); the style.

The profile expansions are the largest unshipped surface and the one worth re-reading before any future
NPC pass: they are the only place in the corpus where these seven characters have interior lives written
down. Nothing in the engine contradicts them; they were simply never drawn on.

---

## VI. Defects Filed

| Row | Severity | Summary |
|-----|----------|---------|
| **§AUDIT-03am** | 🟡 | The starting node's tagline reads *"Codex of Conquest: Curse of Knowledge"* — the second half is a writing-craft diagnosis, not a story title, and it is the first line every new player reads. `index.md`/`README` call the game *The Shattered Codex*. Design call: pick one. |
| **§DX-02n** (+1) | 🟢 | `const JOURNAL_ENTRIES@22424` — 1 occurrence, 0 readers, self-labelled dead; holds the only copy of five authored Froberger quotes. Delete, or re-home the five texts into `FROBERGER_JOURNAL`. |

---

## VII. Appendix — Narration Checklist (retained; this is the part that shipped)

Before narrating a node, ask:

1. **Can the player see it?** One color, one smell, one sound that is wrong or right. Not *"the tavern is
   rowdy"* but *"someone has thrown a stool into the fireplace and it's slowly catching."*
2. **Can the player feel it?** One physical sensation — cold stone through boot leather, sticky dock
   planking, the way desert heat changes your breathing.
3. **Does the NPC reveal their thinking?** Don't describe a character as calculating. Let them calculate,
   out loud, in front of the player.
4. **Is there a specific detail that makes the general true?** Not *"Froberger was careful"* but
   *"Froberger lasted thirty-eight months."*
5. **Is the emotional import clear without being stated?** Write the detail that makes the moment matter
   and trust the player to feel it.

---

## VIII. Conclusion

The report set out to fix a prose problem and wrote 26 replacement passages. One survives, in another
character's mouth, in another channel, one clause shorter. By the measure the report would have chosen for
itself, it failed almost completely.

By any measure that matters, it did not. Its retitle is the first thing a player sees. Its subtitle is the
thesis of the journal's last entry. Its checklist is visibly the rule the game's node text has followed
since — twelve candles, 200 paces, three days — across a hundred and seventeen nodes it never named. The
sentences it wrote were treated as what they were: illustrations, not content.

That is the correct outcome, and it is worth saying plainly because the opposite conclusion is so easy to
reach from a grep. A style guide whose examples ship verbatim has not taught anyone to write; it has
supplied copy. This one taught, and the evidence is that the game now writes in its manner without
quoting it.

> *"The Void conquers by making things forget they matter."*

That line did not ship either. The game just went ahead and remembered.

---

*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
