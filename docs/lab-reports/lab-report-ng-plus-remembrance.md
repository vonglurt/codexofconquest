<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — Layer 50: NG+ Remembrance, "Entry 42"

**IEEE-format post-mortem · original 2026-05-25 · verified against live `play.html` 2026-08-12 (§DOC-02aa)**
**Section:** §XV · **Ship commit:** `194a810` (2026-05-25 09:10, subject *"css block flex issues"*)
**Home doc:** `docs/story/story-arc-ngplus.md` · **Status:** ✅ shipped; 18/18 identifiers live; 2 inert; 1 behavioural defect

> **Verification note (§DOC-02).** This is a re-measured rewrite. Every claim below was checked against
> HEAD and against the archive; claims that did **not** ship are marked **NOT SHIPPED** and **kept**, not
> deleted. Line numbers are `` `symbol@line` `` anchors (§DX-01e). The original's ~90 lines of restated
> design philosophy were compressed; nothing measured was removed.

---

## Abstract

Layer 50 is the New Game Plus remembrance layer. On any NG+ run (`ngPlusRun ≥ 1`) it delivers three
interlocking mechanisms: **NPC memory lines** — second-order dialogue from characters whose favorability
survived the run boundary; **Entry 42** — a player-authored journal entry that fills the blank page
Froberger left at his death, persisted across every subsequent run; and a **three-quest chain**
(`quest_ng_01/02/03`) that turns the remembrance into completable objectives. The layer closes the loop
Quest −1 opened: *the player who found the door becomes the author who writes what is behind it.*

Verification finds an unusually faithful build — **18 of 18 named identifiers resolve at HEAD**, every state
flag under its specified name, `storyNewGamePlus()`'s preservation set exactly as specified, and **every
surface reachable** — against **one live behavioural defect** (the specified first-visit/second-visit
split has never occurred), **two inert fields**, **one undocumented trigger condition** that the whole
fifth-ending chain hangs from, and **three quoted UI strings that were never written**.

---

## I. Design intent — and what it buys the player

### A. The problem: NG+ is repetition with bigger numbers

The second run through a world is normally the same run with the mystery removed. The player knows every
beat, every encounter, every NPC. `play.html` already preserved `npcFavorability` across the NG+
boundary, so the *data* said the NPCs remembered you. Layer 50 exists because **remembering is only a
mechanic when somebody says something different.**

### B. The Entry 42 premise

Quest −1 (Layer 49) ends on a forward reference: *"— Froberger's margin note, Entry 42 (not yet written)."*
`FROBERGER_JOURNAL` holds 41 entries. He ran out of time before he ran out of world. Entry 42 is
structurally absent from the journal sidebar — it has always been blank, in every run, for every player.

On NG+ the player is by definition the researcher who came after Froberger. The design question is whether
the game can make that identity **legible and consequential**. Entry 42 answers by handing the blank page
over: write it or don't; encountering it is the point.

### C. What this adds to play — the honest accounting

Three concrete contributions, each verified live in §VI:

1. **It converts a relationship ledger into content.** Favorability was already persisted but only ever
   *read* — it changed a badge and a dialogue pool. Layer 50 makes it the admission price to a body of
   text that exists nowhere else. A player who was warm to six people in run 1 gets six lines in run 2
   that a speedrunner never sees. **The reward for kindness is deferred by an entire playthrough**, which
   is the only pacing this game has that a wiki cannot spoil.
2. **It gives NG+ an authored ending, not a rerun.** Entry 42 is a hard precondition for the Void
   Architecture arc: `S_story.vaArchitectureKnown = true;@31689` cannot fire without it, and that flag
   drives the **fifth ending** — Sweelinck's last question becomes *"What was inside the cage?"* and the
   victory screen gains a closing addendum (`// Layer 52: §XVII — fifth ending: vaArchitectureKnown overrides all other questions@28268`).
   A second run therefore has an ending the first run cannot reach.
3. **It is a permanent artifact in a game about impermanence.** `entry42Text` survives every subsequent
   reset. By NG+3 the journal the player found in run 1 ends with something they wrote, rendered under
   `Entry 42 ✦ — <span style="color:#f0c070">by you</span>@30682`. The doom clock erases the world every
   49 days; this is the one line of the world it cannot erase.

### D. The three-layer stack (as designed)

| Layer | Surface | Fires |
|---|---|---|
| Greeting | `NPC_NG_PLUS_GREETINGS` (Layer 43) | first NPC visit in NG+, any favor |
| Memory | `NPC_NG_MEMORY_LINES` (Layer 50) | **second** NPC visit in NG+, preserved fav ≥ 2 |
| Author | Entry 42 panel + quest chain + journal persistence | NG+ arrival at the Birka hub |

**Finding 1 (§V) shows the middle row of this table has never been true.** The stack shipped as two
layers wearing three labels.

---

## II. Method

1. **Symbol census first.** Every identifier the report names, batched through one `grep -c` pass before a
   line of prose was read (§DOC-02 instrument 2).
2. **Archive adjudication.** `git log -S "<symbol>" -- play.html` on every dead name, to separate
   **RETIRED** (shipped, later removed) from **NOT SHIPPED** (never existed). `git show <sha>:file` for
   every claim about the past (instruments 4 and 8).
3. **Dating by the File References table.** The original's ten line numbers were tested against every
   commit of 2026-05-25 (instrument 18). See §IX.
4. **Reachability closure.** Cell primacy for every node the layer touches, plus a single-writer trace on
   every gate flag (instrument 19 / §DX-02w).

---

## III. As-built inventory

### A. State flags — 7 of 7, verbatim, on three contiguous lines

`ngPlusRun: 0,@23090` · `entry42Written: false, entry42Text: '', entry42Read: false,@23124` ·
`ngMemoryDelivered: {}, nextFrobergerComplete: false, frobergerLetterFound: false,@23125` ·
`priorQuestMinusOne: false,@23126`

| Flag | Type | Specified purpose | Verdict |
|---|---|---|---|
| `ngPlusRun` | number | NG+ generation counter | ✅ live, 23 references |
| `entry42Written` | boolean | player engaged the page | ✅ live, load-bearing far beyond spec (§V-E) |
| `entry42Text` | string | authored content; `''` = chose blank | ✅ live |
| `entry42Read` | boolean | *"gates `quest_ng_02`"* | ⚠️ **1 writer, 0 readers** — and it gates nothing (§V-C) |
| `ngMemoryDelivered` | object | `{npcKey:true}`, once per run | ✅ live |
| `nextFrobergerComplete` | boolean | *"set when `quest_ng_01` completes"* | ❌ **DEAD** — 1 occurrence in 38,712 lines, 0 assignments ever (§V-C) |
| `frobergerLetterFound` | boolean | CO letter taken | ✅ live |

### B. NG+ preservation — `function storyNewGamePlus() {@24001`

Preserved across the reset, exactly as specified: `ngPlusRun + 1` · `entry42Written` · `entry42Text` ·
`priorQuestMinusOne`, captured as `const savedPriorQuestMinus1  = !!(S_story.questMinusOne);@24027` and
restored at `S_story.priorQuestMinusOne = savedPriorQuestMinus1;@24035`. **One preserved field the report
omits:** `pitPerks`. Correctly **not** preserved: `ngMemoryDelivered`, `entry42Read`,
`frobergerLetterFound`, `nextFrobergerComplete` — all reset by `Object.assign(S_story, _S_DEFAULTS())`,
so the memory lines and the chain are re-earned each run.

### C. NPC memory lines

`const NPC_NG_PLUS_GREETINGS = {@27314` and `const NPC_NG_MEMORY_LINES = {@27324` — **six keys each, and
at HEAD the same six**: `yael` (LHR) · `brynn` (TLL) · `quill` (MHQ) · `pachelbel` (LLA) · `crov`, `auros`
(HKG). Delivery sits inside `_renderNpcCard`:

```js
if ((S_story.ngPlusRun || 0) > 0 && !S_story[ngGreetedKey] && NPC_NG_PLUS_GREETINGS[key]) {
  displayQuote = NPC_NG_PLUS_GREETINGS[key];
  S_story[ngGreetedKey] = true;                      // ← written here …
}
// Layer 50: §XV — Dear Friend memory line on second NG+ visit
if ((S_story.ngPlusRun || 0) > 0 && S_story[ngGreetedKey] && fav >= 2   // ← … and read here
    && NPC_NG_MEMORY_LINES[key] && !((S_story.ngMemoryDelivered || {})[key])) {
  S_story.ngMemoryDelivered[key] = true;
  setTimeout(() => storyMsg(NPC_NG_MEMORY_LINES[key]), 800);
}
```

`S_story[ngGreetedKey] = true;@23731` · `setTimeout(() => storyMsg(NPC_NG_MEMORY_LINES[key]), 800);@23738`.
**Eleven lines apart, one synchronous pass.** See §V-A.

### D. Entry 42 — a panel, not a modal

`if (node.code === 'LHR' && (S_story.ngPlusRun || 0) >= 1 && S_story.priorQuestMinusOne@34636`, then
`const _e42Dear = ['yael','brynn','quill','pachelbel','crov','auros']@34638` filtered on `_npcFavor(k) >= 2`
and `if (_e42Dear >= 3) {@34640`. It builds a `.sweelinck-variant` div and inserts it with
`insertAdjacentElement('afterend')` after the story text box — an **inline panel**, never an overlay
(§V-D). Two buttons: *"✍️ Write it."* and *"— Leave it blank."* The blank branch is not a null branch;
it is an answer: `📖 You left Entry 42 blank. Some things need not be written to be true.@34660`

### E. The quest chain — `quest_ng_01: { id:'quest_ng_01'@11039` · `quest_ng_02: { id:'quest_ng_02'@11048` · `quest_ng_03: { id:'quest_ng_03'@11057`

All three are UQF-1.0 with declarative gates (`gate:{ countMin:[{ path:'ngPlusRun', min:1 }] }`),
`activateNode:'LHR'`, `onActivate:null` and `boardExempt:true`. The last is a §VM-01-G3 addition the
original could not have known: **a personal remembrance is not Warrant work**, so these three never appear
on the Warrant's Board.

| Quest | Title | Completion (as shipped) | Reward |
|---|---|---|---|
| `quest_ng_01` | Froberger: The Remembered Path | `countMin: ngMemoryDelivered ≥ 3` | 500 gp |
| `quest_ng_02` | Froberger: The Open Page | `flags:['entry42Written']` | the act itself |
| `quest_ng_03` | Froberger: The Letter | `flags:['frobergerLetterFound']` | 300 gp |

`quest_ng_02` additionally gates on `flags:['priorQuestMinusOne']` — *you can only write what comes next if
you understood what came before.*

### F. The letter — `if (node.code === 'TLS' && (S_story.ngPlusRun || 0) >= 1 && !S_story.frobergerLetterFound) {@34940`

A one-button panel at the Cosmic Realm spire, present only in NG+. *"If you are reading this, you completed
the run once already. That means you know how it ends. I am sorry about the ending. You deserved a better
one."* — Froberger, sealed, to a reader he never met. Taking it sets the flag and completes `quest_ng_03`.

---

## IV. Spec → shipped delta table

| # | Spec claim (2026-05-25) | Shipped at HEAD | Verdict |
|---|---|---|---|
| 1 | 7 state flags in `_S_DEFAULTS()` | all 7, specified names, contiguous | ✅ EXACT |
| 2 | `storyNewGamePlus()` preserves 4 fields | preserves those 4 **+ `pitPerks`** | ✅ + undocumented extra |
| 3 | 4 fields deliberately reset | all 4 reset | ✅ EXACT |
| 4 | `NPC_NG_MEMORY_LINES` = 6 keyed lines | 6, byte-identical | ✅ EXACT |
| 5 | Memory line fires on the **second** NG+ visit | fires on the **first**, 800 ms after the greeting | ❌ **NEVER SHIPPED** (§V-A) |
| 6 | Greeting fires first visit, any favor | ✅ — but keyed to *surnames* until §AUDIT-03n | ⚠️ RETIRED defect (§V-A) |
| 7 | Entry 42 trigger = 3 conditions | **4** — plus `_e42Dear >= 3` | ⚠️ **UNDOCUMENTED** (§V-B) |
| 8 | Entry 42 is a **modal** | inline `.sweelinck-variant` panel | ❌ NOT SHIPPED (§V-D) |
| 9 | Prompt: *"Entry 42 is blank. It always has been…"* | *"The page is blank. His handwriting fills forty-one entries…"* | ❌ **0 commits ever** |
| 10 | Journal label *"Entry 42 — Your Hand"* | `Entry 42 ✦ — by you` | ❌ **0 commits ever** |
| 11 | Blank text *"The margin says: I know. I was there too."* | `[left blank]` in italic | ❌ **0 commits ever** |
| 12 | `entry42Text` persists for life | ✅ | ✅ EXACT |
| 13 | 3-quest chain, activation block at CI | ✅ as UQF-1.0; the inline block was replaced by declarative gates (§VM-01-G3, `c9f3946`) | ✅ + migrated |
| 14 | `quest_ng_01` = 3 `ngMemoryDelivered` keys | `countMin: ngMemoryDelivered ≥ 3` | ✅ EXACT |
| 15 | `quest_ng_01` sets `nextFrobergerComplete` | nothing sets it, ever | ❌ **NOT SHIPPED** (§V-C) |
| 16 | `entry42Read` gates `quest_ng_02` | `quest_ng_02` gates on `entry42Written`; `entry42Read` has 0 readers | ❌ **FALSE AS WRITTEN** (§V-C) |
| 17 | Epilogue variant in `_buildEpilogueScroll()` | shipped **at the cited lines**, in the victory renderer, gated on 3 flags | ⚠️ RIGHT PLACE, WRONG FUNCTION (§V-E) |
| 18 | Node **CI** (called *"the inn"*) | `LHR` = **City Streets — Birka**; the inn is `TLL` | ⚠️ dead code + wrong place (§V-F) |
| 19 | Node **CO** | `TLS` = Cosmic Realm — The Convergence | ⚠️ dead code, correct remap |
| 20 | *"three interlocking mechanisms"* | 3 shipped; a 4th grew later (Void Architecture) | ✅ + expansion |

**Score: 11 exact · 3 exact-plus-expansion · 6 deltas, of which 4 were wrong the day they were written.**

---

## V. Findings

### A. The second visit has never happened — and it failed two different ways

`S_story[ngGreetedKey] = true;@23731` is written by the greeting branch and read by the memory branch
**eleven lines later, in the same synchronous call**. There is no `return` between them. Two consequences,
and both were live at birth:

- **Key present in both tables** → the greeting sets the latch, the memory branch immediately sees it set,
  and the memory line lands 800 ms later on the **first** visit. The player gets the *"You again"* greeting
  in the card and the *"You came back to the slums"* aside in the same breath.
- **Key present in `NPC_NG_MEMORY_LINES` only** → the latch is never set and the memory line **never fires
  at all**.

At `e594848` (birth) the second case was real for half the cast: `NPC_NG_PLUS_GREETINGS` was keyed
`couperin` / `weckmann` / `bruhns` while `NPC_NG_MEMORY_LINES` — written in the *same commit, ten lines
below* — was keyed `quill` / `crov` / `auros`. **Three of six memory lines were unreachable for 67 days**,
until §AUDIT-03n re-keyed the greeting table on 2026-07-31; the engine records the repair in its own source
above `SWEELINCK_NAMING_LINES`. During that window `quest_ng_01` needed 3 of the **3** remaining NPCs at
Dear Friend, with zero margin, while its hint offered six.

*Two sibling tables, one commit, one author, ten lines apart, disagreeing on three of six keys.* §DOC-02d
named this report's neighbour the traceable **documentary** origin of §AUDIT-03n; this is the
**engine-side** twin, and it is the cheapest possible reproduction of that whole 21-entry outage.

**At HEAD the keys agree, so all six lines fire — on the first visit.** The specified stratification has
never occurred for any NPC in either era. The report's own §II-C numbered step list (*"1. on any NPC visit
… 2. if not delivered and fav ≥ 2 … 3. set delivered"*) describes the shipped behaviour **correctly** and
never mentions the latch; every prose passage around it (§I-C, §III-D, §IV) asserts the split. Believe the
section that transcribes. → **§DX-02aj**, a two-line fix: hoist the read above the write.

### B. A fourth trigger condition nobody wrote down — and the fifth ending hangs off it

`if (_e42Dear >= 3) {@34640` requires **three preserved Dear Friends** before the Entry 42 panel renders at
all. This was in the birth commit. The report's §II-D enumerates exactly three conditions; the home doc says
*"fires … if all three hold."*

The blast radius is larger than the panel. `entry42Written` is the gate on
`S_story.vaArchitectureKnown = true;@31689`, which is the gate on the **fifth ending**
(`// Layer 52: §XVII — fifth ending: vaArchitectureKnown overrides all other questions@28268`), on the
victory-screen addendum, and on `quest_va_04`. So the game's fifth ending requires three NPC relationships
carried across a run boundary, and **no document, quest hint, or on-screen line says so**. A player at two
Dear Friends walks into Birka on NG+ and simply sees nothing. → **§AUDIT-03ah** (🟡, small design call).

The threshold is *good design* — it makes the deferred-reward thesis of §I-C real rather than rhetorical.
It is only undocumented, and an undocumented threshold with a silent failure mode is indistinguishable
from a bug.

### C. Two inert fields, and one of them is a new dead-code shape

**`nextFrobergerComplete`** occurs **once in 38,712 lines** — its own declaration — and
`git log -S "nextFrobergerComplete ="` returns **0 commits in the file's entire history**. It was never
assigned, at birth or since. The birth-era reward block granted the 500 gp and moved on. Both this report
and `docs/story/story-arc-ngplus.md` state that `quest_ng_01` sets it.

This is a **new member of the `check:deadconsts` family** (§DX-02n, now widened seven ways): every prior
member was write-only or read-only. This one is **neither read nor written** — a `_S_DEFAULTS()` field that
is pure ceremony, and therefore invisible to a reader census *and* a writer census, both of which are
looking for an imbalance. The only detector that sees it is *"occurrence count = 1."*

**`entry42Read`** has one writer — `S_story.entry42Read = true;@30676`, set as a side effect of *rendering*
the journal sidebar — and **zero readers**. The report says it *"gates `quest_ng_02`"*; `quest_ng_02`'s
completion is `flags:['entry42Written']`. A mutation performed by a render path, consumed by nobody: the
inert cousin of §DX-02ae's Act-VIII farewell getter.

### D. The post-mortem apologises for a surface that does not exist

§IV: *"The Entry 42 modal fires at CI before the inn text renders — the transition is abrupt. A fade-in …
would ease the modal's entry."* There is no modal and never was. The block builds a div and calls
`insertAdjacentElement('afterend')` on the story text box — it appears **in** the page, below the text it
was accused of interrupting. §DOC-02g found the identical shape in the Corelli report (a *"modal"* that was
always `storyMsg` + `insertAdjacentElement`). **Second confirmed instance: a report's self-criticism is a
claim like any other, and a post-mortem can be wrong about the very thing it is apologising for.**

### E. The fifth ending: line numbers copied exact, containing function recalled and wrong

§II-F cites *"lines 12837, 12857"* for an `entry42Written` epilogue variant in `_buildEpilogueScroll()`.
Both line numbers are **exact** at the report's tree — and `function _buildEpilogueScroll() {@28120`
contains no `entry42` term at HEAD and contained none then; the function ended 150 lines above the cited
sites. The real host is the victory-screen renderer, and the line directly above the first citation reads
`// Layer 52: §XVII — fifth ending…` — which is where the report's phrase *"a fifth ending condition
variant"* came from. **The author copied the numbers and the label off the screen and supplied the function
name from memory.** Instrument 12 in its purest form: everything transcribable exact, the one composed
token wrong.

The gate is also understated: HEAD requires `vaArchitectureKnown && entry42Written && ngPlusRun >= 1`, a
conjunction of three, not `entry42Written` alone.

### F. `CI` was never the inn, and one player-facing string still says it is

The birth commit reads `node.code === 'CI'`; HEAD reads `'LHR'`. The remap is **correct** — `CI` was
`num:1, name:'city', "City Streets — Birka"`, confirmed against the archive by §DOC-02y's seven-way
`num` + terrain + label triple-match. What the report gets wrong is the *place*: it calls CI *"(inn)"*
throughout, and the inn is `TLL`, *The First Inn*.

That error is still on screen. `hint:'Visit the City Inn to find the open page.',@11051` sends the player to
an inn; the panel renders on the city street. Wrong when written, live for 79 days, and invisible to every
gate — `check:legacycodes` scans `.md`, `check:noderegs` scans references, and neither reads English.
→ **§AUDIT-03s +1.**

### G. One more, found on the way: NG+ draws from `Math.random()`

`S_story.frobergerNoteNode = _ebPool[Math.floor(Math.random() * _ebPool.length)];@23980` (and the twin
inside `storyNewGamePlus`) picks the Epic-Battleground node hiding Froberger's last note from the **unseeded**
stream, in violation of invariant #6 (*"randomness that affects game state must come from the seeded
stream"*). Two sites, one line each. → **§DX-02m +1.**

---

## VI. Reachability closure (instrument 19) — 100 %

The first layer in five §DOC-02 increments with **no casualty at all**.

| Surface | Node | Cell | Primary? | Renders? |
|---|---|---|---|---|
| Entry 42 panel · all 3 quest activations · `yael` | `LHR` | `10,197` | ✅ `list[0]` | ✅ |
| `brynn` | `TLL` | `10,204` | ✅ alone | ✅ |
| `quill` | `MHQ` | `9,199` | ✅ alone | ✅ |
| `pachelbel` | `LLA` | `4,202` | ✅ alone | ✅ |
| `crov`, `auros` | `HKG` | `29,246` | ✅ alone | ✅ |
| Froberger's letter | `TLS` | `26,181` | ✅ alone | ✅ |

Gate flags close cleanly: `entry42Written` — two writers, both buttons on one panel; `frobergerLetterFound`
— the panel button, plus `quest_ng_03`'s own `onComplete` re-asserting its own completion flag (a harmless
§ARCH-01 W7c migration artifact, but worth not copying); `priorQuestMinusOne` — one writer, in
`storyNewGamePlus`. NPC hosts come from
`const birkaNpcs = { LHR:['yael'], TLL:['brynn'], MHQ:['quill'], LLA:['pachelbel'], HKG:['crov','auros']@35139`,
all six curated and none shadowed.

**Note *why* it survived.** `LHR:{r:10,c:197},@9472` shares its cell with `BK:{r:10,c:197},@9471` — the
node §AUDIT-03x measures at **89 stranded quests** — and Layer 50 is on the winning side of that cell only
because `LHR` is declared first in `NODE_MAP`. Everything else survived for the reason §DOC-02y identified
in its sibling: **the layer added no nodes.** It is built entirely from flags, dialogue tables and panels
hung on places that already existed, so the 90×360 world-grid migration had almost nothing of it to catch.
*Structural minimalism keeps turning out to be a survival trait.*

---

## VII. The original's own post-mortem, scored

| # | *"What could be better"* | Verdict |
|---|---|---|
| 1 | Ease the modal's abrupt entry with a fade-in | **VOID** — there is no modal (§V-D) |
| 2 | `frobergerLetterFound`'s CO text is inline with no const, so the trigger may drift | **CORRECT AND STILL OPEN** — the letter is still an inline literal at `@34940`; it survived the CI→LHR / CO→TLS migration only because the node code was updated by hand |
| 3 | Quote `entry42Text` back in the epilogue | **STILL OPEN** — 0 commits ever; the epilogue acknowledges the act, never the text |
| 4 | Nothing tells the player memory lines are once-per-run | **CORRECT, AND WORSE THAN STATED** — nothing tells them the lines exist, and §V-A means they were never a "second visit" reward to miss |

**Register score: 0 of 4 acted on in 79 days.** One is void because it describes a surface that never
existed; the other three were correct, and item 4 was more correct than its author knew. Items 2 and 3
remain good, cheap ideas and are the natural content follow-up to this layer.

---

## VIII. Defects filed from this pass

| Row | Severity | Summary |
|---|---|---|
| **§DX-02aj** (new) | 🟢 | `ngGreetedKey` is written and read in one pass, so the "second NG+ visit" state is unreachable: memory lines fire on visit 1, or (if an NPC has no greeting entry) never. Two-line fix. |
| **§AUDIT-03ah** (new) | 🟡 design call | The Entry 42 panel — and through it the fifth ending — requires 3 preserved Dear Friends, undocumented and silently. Wants a signpost, not a threshold change. |
| **§DX-02n** +2 | 🟢 | `nextFrobergerComplete` (0 reads, 0 writes, **ever** — a new shape for `check:deadconsts`) and `entry42Read` (1 render-side-effect write, 0 reads). |
| **§AUDIT-03s** +1 | 🟢 | `hint:'Visit the City Inn to find the open page.',@11051` names the wrong node; the panel is at City Streets. |
| **§DX-02m** +1 | 🟢 | `frobergerNoteNode` drawn from `Math.random()` at both new-game sites — invariant #6. |

Doc corrections applied in the same increment: `docs/story/story-arc-ngplus.md` (7 rows) and `index.md`
(cross-ref node codes + the `nextFrobergerComplete` state-field row).

---

## IX. File references — re-dated

**All ten rows of the original File References table resolve line-exact at `e594848` … `0a131f5`
(2026-05-25 13:29–13:35).** They resolve at *no other tree*: at the ship commit `194a810` (09:10) not one
of them lands. The report was therefore written from the file, in a **six-minute window**, four hours
after the code shipped — and that window sits inside the same 23-minute afternoon tree that
`lab-report-luck-seventh-stat.md` (§DOC-02w) and `lab-report-narrative-arcs-brynn-bruhns-yael.md`
(§DOC-02y) were independently dated to. **Three lab reports, three unrelated layers, one afternoon's
working copy.**

| Original row | At `e594848` | HEAD line |
|---|---|---|
| 8395 `ngPlusRun: 0` | ✅ exact | 23090 |
| 8424 entry42 flags | ✅ exact | 23124 |
| 8425 ngMemory / nextFroberger / letter | ✅ exact | 23125 |
| 8889–8910 `storyNewGamePlus()` | ✅ exact (8889 = its banner comment) | 24001 |
| 11836 `NPC_NG_PLUS_GREETINGS` | ✅ exact | 27314 |
| 11846 `NPC_NG_MEMORY_LINES` | ✅ exact | 27324 |
| 8654–8664 memory-line delivery | ✅ exact | 23727–23739 |
| 14218–14221 Entry 42 trigger | ✅ exact | 34634–34637 |
| 14260–14262 quest activation | ✅ exact | migrated to quest gates (§VM-01-G3) |
| 12837, 12857 "fifth ending" | ✅ exact — **wrong function named** (§V-E) | 28269, 28289 |

Cross-references: `lab-report-quest-minus-one-world-creator.md` §II.C (`priorQuestMinusOne` origin) ·
`lab-report-endings-and-echoes.md` §NG+ (`storyNewGamePlus()` base preservation) ·
`lab-report-void-archaeology.md` (the Layer-52 arc that consumes `entry42Written`).
`plan.md` §XV — **the original design directive no longer exists**; `plan.md` was split into
`CONTRIBUTING.md` + `BACKLOG.md` at `5e48dd7` (§DOC-02i).

---

## X. Conclusion

Layer 50 is a small feature that was built almost exactly as specified and has aged better than anything
around it: eighteen of eighteen identifiers still resolve, every flag under its original name, every
surface still reachable after a total world-coordinate migration, and the philosophical payload — *the
blank page belongs to you* — intact down to the wording of the button that declines it.

Its one real defect is a flag that is set and read in the same eleven lines, which quietly deleted the
"second visit" from a three-layer design and left a two-layer one wearing three labels. Nobody noticed for
79 days because the failure is invisible from the outside: **the player still gets the line, just sooner
than the design intended, and a line arriving early looks exactly like a line arriving on time.**

The report's own errors follow the corpus rule without a single exception. Every table is exact; every
composed sentence — the trigger list that omits a condition, the function name recalled instead of copied,
three quoted UI strings that were never written, and a post-mortem apologising for a modal that does not
exist — is wrong. *He knew someone would come back a second time with enough of the story to fill it.*
That is also, as it happens, a fair description of this program.

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
