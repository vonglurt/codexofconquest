<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Quest Data–Code Separation: Enforcing the Boundary in a Single-File Engine

**Technical Report TR-2026-ARCH02** · roll2hit.com · MIT License · Paul Richeson

> **HISTORY DOCUMENT — verified against HEAD 2026-08-13 (§DOC-02ba).** Written
> 2026-06-16 12:17, shipped 2 m 53 s later as `89fa13b` (12:20:47), and **deleted
> 4 h 10 m after that** by `120d617` (16:31:20), a 22-bullet feature commit that does
> not mention it. Claims are annotated, never deleted.
> **Verdict: the diagnosis outlived the remedy.** Every defect this report identified was
> real and precisely measured. The architecture it built lasted one afternoon. Two years
> of engine time later the *problem statement* is still live — 121 inline quest closures
> in 2026-06, **124** at HEAD — while the *goal* was reached by a different route
> (§ARCH-01 UQF) that independently re-derived this report's central compromise, the
> named escape hatch, and named it `_legacy_fn`.

---

## Abstract

Roll2Hit.com is a single-file browser D&D 5e engine whose entire world — nodes, monsters,
quests, dialogue — lives in JavaScript object literals in one HTML file. That design makes
the boundary between *data* and *code* a matter of discipline rather than of language: an
object literal will happily hold an arrow function, and `QUEST_DB` held 127 of them.

This report characterised four defects (executable code inside quest data, quest strings
reaching `innerHTML`, an NPC renderer reading the wrong field, and a duplicated node code)
and shipped a three-part remedy: `QUEST_EFFECTS` (declarative outcome descriptors),
`QUEST_HOOKS` (named engine functions), and `applyQuestEffects` (a single ten-case
dispatcher).

Re-measured against HEAD and against the archive at its own birth commit: **the report's
data claims verify almost perfectly and its narrative claims do not.** The `ZRH` collision
table is byte-exact. The `92 onPass / 35 onFail` census is exact. The `// 89 entries` and
`// 91 entries total` inventory comments are exact. But the section that quotes a console
log quotes a line the engine never emitted; the section that claims *every* NPC rendered
blank measures **41 of 64**; and the report's own showcase example — a five-descriptor
declarative `quest_df_02` — is not what shipped. In the code that shipped, **107 of 122
effect descriptors were `{e:'hook'}`**: the declarative layer was 12.3 % declarative.

---

## 1. Purpose, and What the Feature Buys the Player

> *"A data object that contains executable functions is not data. It is a program
> pretending to be data."* — the original report's opening line, which remains the best
> one-sentence statement of the problem this repository has.

The architectural case is about auditability and serialization. **The playability case is
much more concrete, and the report undersells it: at the moment this work began, most of
the game's cast was mute.**

`storyShowNpc` — the function behind every NPC button in Story Mode — read `d.quote`, a
static string field. At the parent commit `NPC_DIALOGUE` held **64 entries: 41 carried
`quoteFn` (a function returning the line), 23 carried a static `quote:`**. So the NPC card
opened, showed the name, and showed **nothing at all for 64 % of the cast** — and worked
perfectly for the other 36 %, which is exactly why nobody caught it. A surface that is
broken for everyone gets fixed on day one. A surface that is broken for two thirds of its
cases looks like content that has not been written yet.

The second consequence is the one that matters for progression. Thirteen of those 41
`quoteFn` bodies **write story state as a side effect of being read** — the line the NPC
speaks and the flag their speaking sets are the same expression. With `quoteFn` never
called, **13 distinct flags could never be set by anything**:

`anathSightRestored` · `antecedentMet` · `barnachFoundPaul` · `barnachVouchedHR` ·
`commissionReceived` · `corinthLettersWritten` · `innmotherNamed` · `littorialComplete` ·
`lyraConverted` · `romeArrestBegun` · `silarJoined` · `solmFound` · `timaelaJoined`

The report names one of these (`anathSightRestored`, the Damascus blind-days exit) and
treats it as *the* bug. It is one of thirteen. `commissionReceived` gates the Saul→Paul
name-change panel at `HTY` (§FUTURE-01); `silarJoined` and `timaelaJoined` are companion
recruitments; `romeArrestBegun` opens the final act's frame. **One wrong field name held
the entire §LIX–§LXIV corridor shut.**

That is what this pass bought the player: not an architecture, but a cast that talks and
a story that advances. The architecture was gone by dinner. The one-line fix at
`d.quoteFn ? d.quoteFn() : d.quote@30234` is still there, two months later, and is the
single most durable thing this report produced.

---

## 2. Method

Three sources, because HEAD alone cannot adjudicate a claim about an afternoon in June:

1. **The archive at the birth commit.** `git show 89fa13b:roll2hit-v3.html` and its parent
   `89fa13b^` were extracted to disk and diffed directly. Every "what was wrong" claim was
   measured against the *parent*; every "what was built" claim against the *birth*.
2. **`git log -S <symbol> -- roll2hit-v3.html`** on every symbol the census marked dead, to
   separate **RETIRED** (shipped, later removed) from **NOT SHIPPED** (never existed).
3. **HEAD**, at `r2h-3.104.0`, 38,7xx lines, for what survives and what the successor did.

Object-literal entry counts were taken by brace-matching each object out of the file and
counting keys at depth 1, not by grepping the key name. Line numbers in the original are
superseded by `symbol@line` anchors, which name a verbatim symbol first and a line second.

---

## 3. Verification Summary

| § | Claim | Verdict | Measured |
|---|---|---|---|
| 1 | `QUEST_DB` held **92 `onPass`** and **35 `onFail`** | ✅ **exact** | 92 / 35 at `89fa13b^` |
| 1 | "127 anonymous arrow functions" | ⚠️ **86 + 35 = 121** | 6 of the 92 `onPass` are `null` |
| 1 | "…buried in a **20,000-line** object literal" | ❌ **overstated ~2×** | `QUEST_DB` was **10,686** lines |
| 2 | Quest text reached `innerHTML` | ✅ **exact** | code block byte-identical at parent |
| 2 | "audit confirmed zero current violations" | ✅ **still true at HEAD** | 0 `label:` / `title:` contain `<` |
| 3 | `storyShowNpc` read `d.quote`; NPCs store `quoteFn` | ✅ **exact** | both code blocks byte-identical |
| 3 | "**every** NPC showed blank text" | ❌ **41 of 64 (64 %)** | 23 entries carried a static `quote:` |
| 3 | Damascus arc blocked; `quoteFn` sole writer | ✅ **confirmed** | 1 writer, 3 readers at parent |
| 3 | Console log *"BLOCKED: DAM blind-days gate…"* | ❌ **NOT SHIPPED** | `BLOCKED` appears **0×** in the file |
| 4 | `ZRH` defined twice in `NODE_MAP` + `NPC_DIALOGUE` | ✅ **byte-exact** | all four rows of the table verified |
| 4 | Dunfall renamed `DFL`, placed at **(83,223)** | ✅ **exact** | `DFL:{r:83,c:223}`, `KIR` at `r:84` |
| 4 | "All **11** quests with `activateNode:'ZRH'`" | ⚠️ **11 is right, the field is not** | 7 `activateNode` + 4 `waypointNode` |
| 4 | gate check + **three** `node.code` panels updated | ⚠️ **3 sites, not 4** | 1 `destCode` gate + 2 `node.code` |
| 5 | One `passText` was a function; converted | ✅ **exact**, and ❌ **reverted** | 1→0 at birth; **1 at HEAD, byte-identical** |
| B | `QUEST_EFFECTS` — `// … 89 entries` | ✅ **exact** | 89 top-level keys |
| B | `QUEST_HOOKS` — `// … 91 entries total` | ✅ **exact** | 91 top-level keys |
| B | Effect registry is **10 types**, exhaustive | ⚠️ **10 implemented, 4 used** | `hook` 107 · `flag` 13 · `mbit` 1 · `hp-min` 1 |
| B | `quest_df_02` shown as 5 inline descriptors | ❌ **not as shipped** | shipped as `[{e:'hook'}]`; the 5 live in the hook |
| N | "**77** inline effects and **89** hooks" | ❌ **89 effects / 91 hooks** | the two objects are transposed |
| N | The `skipBlock` extraction parser bug | ⚪ **unverifiable** | no artifact anywhere in the repo |
| F | "Lab report count: 64" | ✅ **exact** | `7d3615a` archived **64** reports |

---

## 4. The Shortest Shelf-Life This Program Has Measured

| Event | Commit | Time | Δ |
|---|---|---|---|
| Report written (mtime) | — | 12:17:54 | — |
| Architecture shipped | `89fa13b` | 12:20:47 | **+2 m 53 s** |
| Architecture deleted | `120d617` | 16:31:20 | **+4 h 10 m 33 s** |

`89fa13b` is titled *"feat(data): enforce data-code boundary across quest system
(§DATA-01)"* — note the tag, because **the report headers itself §ARCH-02 and its commit
says §DATA-01**; `index.md` carries both, three references each, and they are the same
work.

`120d617` is titled *"feat: UI overhaul, gate removal, node-to-node travel, geo-seed +
reweave"*. Its message runs to 22 bullets across UI, Navigation, World and Docs. **It does
not mention `QUEST_EFFECTS`, `QUEST_HOOKS`, `applyQuestEffects`, `DFL`, §DATA-01 or
§ARCH-02 anywhere**, and its shortstat is `1,092 insertions / 1,427 deletions` on a file
the separation pass had just *grown*. This is the signature of a stale working copy
written over the tree, not of a decision — which is what §DATA-01-REVERTED concluded
independently on 2026-06-27, eleven days later, when the `ZRH` duplicate resurfaced in
play and someone went looking for the fix that had removed it.

**The methodological point:** a report can be entirely correct and still describe a state
of the world that lasted one afternoon. Verifying it against HEAD alone would score it
near zero and learn nothing. The verdict *"deleted by accident, four hours later, inside
an unrelated commit"* is only reachable by reading the death commit's **message** against
its **diff**.

---

## 5. The NPC Bug: Right Diagnosis, Invented Evidence

The causal chain in §3 is correct in every structural particular. At the parent commit,
`NPC_DIALOGUE.DAM.quoteFn` is the **only** writer of `S_story.anathSightRestored` — and it
writes it from inside the expression that returns Anath's line, an IIFE embedded in a
ternary. Three consumers read it: a quest `completeFn`, an `activateNode` condition, and
the movement block that holds the player at Damascus. Read-only-never-written; permanently
`false`; the arc shut.

At HEAD the same pattern stands, load-bearing, at `DAM: { name:'Anath'@22510` — still the
sole writer, now feeding `quest_anath`'s completion, one UQF gate, and the block at line
36289. The fix survives at `d.quoteFn ? d.quoteFn() : d.quote@30234`, simplified from the
report's `typeof … === 'function'` form.

**What does not verify is the evidence.** The report states:

> The console logs showed: `BLOCKED: DAM blind-days gate {saulConverted: true,
> anathSightRestored: false, blindDaysKS: 12}`

The string `BLOCKED` **does not occur anywhere in `roll2hit-v3.html` at the parent commit**,
and there is no `console.*` call in the blind-days handler at all. The handler is a
`storyMsg` on a `>= 3` day counter — the prose reads *"Day N of three"* — so the quoted
`blindDaysKS: 12` is not merely unlogged, it is a value the surrounding fiction does not
use. The report's adjacent prose (*"`blindDaysKS` could reach 100"*) is consistent with the
fabricated log rather than with the code.

This is §DOC-02f's ninth instrument in its cleanest form. **In one document, one author,
one afternoon: the tables have a zero error rate and the traces do not.** The `ZRH`
collision table is byte-exact across four rows. The `92/35` census is exact. The two
inventory comments are exact. The single passage presented as a *runtime observation* is
the only one with no referent, because a table gets pasted and an observation gets
remembered.

**And the blast radius runs the other way.** The report claims *every* NPC and measures
41 of 64; it claims *one arc* and the true figure is **13 flags**. Both errors are in the
same section. The overstatement is what makes the finding sound urgent; the understatement
is what would have made it accurate.

---

## 6. The `ZRH` Collision — Verified Byte-Exact

The one section that needs no annotation. At `89fa13b^`, `ZRH` was defined twice in
`NODE_MAP` and twice in `NPC_DIALOGUE`, and the report's table reproduces all four
verbatim:

| | First (shadowed) | Second (active) |
|---|---|---|
| `NODE_MAP` | `num:143` Dunfall — The Loch Harbor, `act:3`, `highlands` | `num:72` The Unbanked Quarter, `act:1`, `defi_land` |
| `NPC_DIALOGUE` | Mairén Fionn (`quoteFn` → `dfBarterLearned`) | Grimshaw (static `quote:`) |

JavaScript object-literal semantics: **the second wins silently.** Mairén Fionn was
unreachable; the `KIR → ZRH` gate routed to the wrong continent.

The repair was complete and lossless: **17 `'ZRH'` references at the parent → 2 at birth
+ 15 `'DFL'`**, conserving exactly. Placement verified — `DFL:{r:83,c:223}` against
`KIR:{r:84,c:223}`, one row north in the pre-§WALK-1.5 500×500 space, precisely as
described.

Two small corrections. The "11 quests" figure is **right in total and wrong in field**:
7 are `activateNode:'ZRH'` and 4 are `waypointNode:'ZRH'`. And "gate check and three
`node.code` UI panels" is **3 sites, not 4** — one `destCode === 'DFL'` gate and two
`node.code === 'DFL'` panels.

**At HEAD the node is `DNF:{r:17,c:171}@9529`, not `DFL`.** The rename was re-done from
scratch on 2026-06-27 by §CELL-14-FU, under a different code, in the 90×360 projection —
because `120d617` had taken `DFL` with it. *The bug was found twice and fixed twice, and
the second fix is the one in the game.*

---

## 7. The Declarative Layer That Was 88 % Indirection

This is the report's largest unannotated gap, and it is visible only in the shipped data.

`QUEST_EFFECTS` opens with a worked example presenting `quest_df_02` as five declarative
descriptors — `flag`, `gold`, `xp`, `item`, `msg`. **That is not what shipped.** At the
birth commit the entry reads, in full:

```js
quest_df_02: {
  onPass: [{e:'hook',name:"quest_df_02_onPass"}],
  onFail: [{e:'hook',name:"quest_df_02_onFail"}],
},
```

The five effects exist — verbatim, imperatively — inside `quest_df_02_onPass` in
`QUEST_HOOKS`, as `S_story.dfBarterLearned = true; S_story.gold = … + 100; …`. The example
in the report is the *aspiration*; the file holds the *hook*.

Counted across the whole shipped object, the descriptor population at `89fa13b` is:

| Descriptor | Count | Share |
|---|---|---|
| `{e:'hook'}` | **107** | **87.7 %** |
| `{e:'flag'}` | 13 | 10.7 % |
| `{e:'mbit'}` | 1 | 0.8 % |
| `{e:'hp-min'}` | 1 | 0.8 % |
| **total** | **122** | |

**Six of the ten registry types — `xp`, `gold`, `msg`, `item`, `item-swap`, `knowledge` —
have zero call sites in the data they were built for.** `applyQuestEffects` implements all
ten (verified: exactly 10 `case` labels); the data declares four. The report's claim that
*"the registry is exhaustive — a quest outcome can only do these ten things"* is true of
the interpreter and vacuous in practice, because 88 % of outcomes take the tenth case and
run arbitrary code.

The §"Non-Obvious Decisions" defence — *"Why 77 inline effects and 89 hooks, not more
inline?"* — is the sentence that gives it away. The measured figures are **89 effects
entries and 91 hooks**, so the prose has transposed the two objects and lost two from each,
one page after the inventory comments that state both correctly. This is the tenth
instrument: **a report's inventory earns trust and its summary does not, even one page
later, same hand, same day.**

To be fair to the pass: moving 121 closures out of a 10,686-line quest table and giving
each one a **name** is real work with real value, and the report says so. What it does not
say is that the result is *indirection*, not *declaration*. `QUEST_DB` became serializable;
`QUEST_HOOKS` did not, and `QUEST_HOOKS` is where the behaviour went.

---

## 8. What §ARCH-01 Did Instead — and the Hook, Renamed

§DATA-01 was formally closed on 2026-07-06 as **superseded, not restored** — the user's
call, on the grounds that reviving `QUEST_EFFECTS` beside UQF would create a second,
competing effects system. §ARCH-01 reached the same goal by a wider route: **all ~2,850
quests are `schema:'UQF-1.0'`, `onPass`/`onFail` are `[{kind:…}]` descriptor arrays, and
`QuestRuntime` is the sole execution surface.**

The comparison is the interesting part, because §ARCH-01 independently re-derived this
report's central compromise:

| | §ARCH-02 `89fa13b` | §ARCH-01 UQF @ HEAD |
|---|---|---|
| Descriptor key | `{e:'…'}` | `{kind:'…'}` |
| Registry size | 10 types (4 used) | **15 types (15 used)** |
| Total descriptors | 122 | **5,638** |
| Escape hatch | `{e:'hook', name}` | `{kind:'_legacy_fn', fn}` |
| Escape-hatch share | **107 / 122 = 87.7 %** | **124 / 5,638 = 2.2 %** |
| Declarative share | **12.3 %** | **97.8 %** |
| Machine-checked? | no | **yes — `check:questgraph`** |

Two honest observations about that right-hand column.

**First, the escape hatch still holds inline anonymous functions, and it is still inside
`QUEST_DB`.** All 124 `_legacy_fn` descriptors live between `const QUEST_DB = {@10615` and
its closing brace; **all 124 are anonymous arrows** (118 zero-argument, 6 taking `S`), and
**41 of the zero-argument ones name `S_story` directly** — closures over live game state,
which is the precise construct §1 of this report condemned. **The headline number did not
improve — it rose: 121 inline closures at `89fa13b^` → 124 at HEAD.** What changed is that each now
carries a `kind` tag identifying it as legacy and a comment saying why it resisted
decomposition. `JSON.stringify(QUEST_DB)` still silently drops 124 quest outcomes, so the
report's serializability argument remains unsatisfied — for 4.3 % of quests instead of
100 %.

**Second, `hp-min` — the one purely declarative example the report showcased — regressed.**
The report's `quest_stoning_lystra: { onFail: [{ e:'hp-min', value:1 }] }` is at HEAD:

```js
onFail:[{ kind:'_legacy_fn', fn:() => { S_story.hp = Math.min(S_story.hp || 1, 1); } },
        { kind:'mission_bit', flag:'stoningEvent', label:'Lystra Stoning' }] }],
```

with a comment above it explaining the reason — the closure must run *before* the mission
bit to mirror legacy ordering, and the descriptor list had no way to say that. **The effect
DSL lacked a sequencing primitive, so a one-field descriptor became a closure again.** That
is the same pressure the original report identified when it declined to convert conditional
handlers, arriving at the same answer from the other direction.

**Third, and this is the genuine advance:** the auditability goal was met by neither
report's method. `scripts/check-questgraph.js` — in `check:walk` — does not remove the
closures and does not trust them. It **extracts each `_legacy_fn` source from the raw
`QUEST_DB` region and executes it against a scratch state, twice per seed, taking the state
diff as the write-set** and a divergent diff as residual nondeterminism. Live result:
**2,853 quests analysed, prober-gaps 0, residual nondeterminism 0.** The report's complaint
was *"no tool can enumerate what a quest outcome does without executing it."* The answer the
repository settled on is: **then execute it — deterministically, sandboxed, in CI.**

---

## 9. The One Line It Removed That Came Back

§5 of the report singles out a single `passText` written as a function and converts it to a
static string. Verified: `passText:(` goes **1 → 0** across `89fa13b`, and `passText:'`
goes 83 → 84. Exactly one conversion, exactly as described.

At HEAD there is **1 `passText:(`**, and it is **byte-identical** to the one that was
removed — same text, same Prior Carrier conditional, the Codex finale. It is now
documented as intentional (§DATA-01-REVERTED, 2026-07-06: *"one state-conditional
`passText:()` remains by design"*).

Worth noting that the report's stated rationale for converting it was wrong on its own
terms. It reasons that this is *"the final quest, where the Prior Carrier encounter is
always complete before reaching it"* — and then substitutes the **long** branch as the
static text. If the encounter were always complete, the conditional would be dead code and
the substitution harmless. It is not dead code: the branch is live at HEAD, and flattening
it would have shown every player the Prior Carrier line whether or not they met them.

**So of five defects, the smallest one is the only one whose repair was both undone and
subsequently ruled against on the merits.** *The single line the report picked out as the
purest example of code hiding in a text field is the one line of the whole pass that is
still there.*

---

## 10. Rendering: What Shipped, What Survives, What Was Missed

The `innerHTML` → `textContent` conversion is verified at the birth commit: the quest panel
at parent line 26700 became DOM construction with `_titleSpan.textContent = q.title`, and
the badge — code-generated, not data — kept `insertAdjacentHTML`. That reasoning is sound
and the distinction is the right one.

It survives at HEAD as `titleRow.className = 'quest-title'@30769`, but by a **second**
implementation: `120d617` took this with everything else, and the textContent renderer was
rebuilt on 2026-07-06 as the last live residual of §DATA-01. The report's §2 audit result
also still holds — **0 `label:` and 0 `title:` values in the file contain `<`**.

**What the report missed, and still misses:** the quest panel has two sibling renderers in
the same function that were left on string-concatenated `innerHTML`, and both interpolate
**data-originated** strings, not code-generated ones:

- `<span>Hunt: '@30805` — interpolates `customWp.label` twice and `dest.label` from
  `NODE_MAP`. Node labels are authorable through the WBAPI worldbuilder.
- `<span>🦴 Your body at '@30824` — interpolates `q.nodeName` from
  `S_story.corpsesQuests`, which is **persisted in the player's save file** and read back
  on load.

The corpse renderer is the more interesting of the two, because it takes the string from a
place further outside the bundle than `QUEST_DB` ever was. The report's own §2 argument
applies to both without modification: *the guarantee should not depend on the current
content of the data.* Filed as **§DX-02bt**.

A related nuisance worth naming while in the file: `const NPC_DIALOGUES = {@10396` and
`const NPC_DIALOGUE = {@22444` are two distinct live objects one character apart, with 5
and 9 readers respectively. `storyShowNpc` reads the singular.

---

## 11. Findings Filed

- **§DX-02bs** 🟢 — `check:questgraph`'s host-flag-writer scan does not know the `once:`
  idiom. `if (p.once) st[p.once] = true;@31599` is a real writer for 5 flags; one of them,
  `saulConverted`, is gate-read and is therefore reported in the gate's `written-by-nothing`
  list as a soft-lock that does not exist. A gate reporting 50 candidates with a known
  blind spot understates its own confidence.
- **§DX-02bt** 🟡 — two quest-panel renderers still concatenate data-originated strings
  into `innerHTML` (`<span>Hunt: '@30805`, `<span>🦴 Your body at '@30824`); `q.nodeName`
  arrives from the save file. This is this report's §2 thesis, unfinished. Includes the
  `NPC_DIALOGUE`/`NPC_DIALOGUES` near-name collision as a sub-item.
- **§DX-02bu** 🟢 — doc correction: the BACKLOG's §DATA-01-REVERTED row asserts UQF has
  *"zero functions (all `[{kind:…}]` descriptor arrays)"*. There are **124 `_legacy_fn`
  descriptors carrying inline arrow functions**, all inside `QUEST_DB`. The claim was false
  when written. (§DOC-02b's *"16 `_legacyFn` left"* is a different symbol — the camelCase
  kernel identifier, 17 occurrences — and is not in conflict.)

**Corpus cross-reference (unfiled, for whoever revisits §DOC-02az):** `120d617`'s message
claims *"Remove all **10** movement gate-locks from cellMove"* at 16:31 on 2026-06-16;
§DOC-02az records **eight** locks, removed by `1872896` at 17:37 the same day. Two commits,
two counts, one hour apart.

---

## 12. Known Limitations of the Original

1. **It cannot see its own deletion.** No report can. The four-hour shelf life is only
   recoverable from `git log -S` plus the death commit's message.
2. **It quotes a runtime observation it did not observe.** One fabricated console line in
   an otherwise byte-accurate document — and it is in the section that carries the headline.
3. **It presents an aspirational example as shipped code.** The `quest_df_02` block is what
   the architecture was *for*; the file holds `[{e:'hook'}]`.
4. **It never counts its own output.** Had it tabulated the 122 descriptors it emitted, the
   87.7 % hook share would have been unmissable — and the honest conclusion (*"this is a
   naming pass, not a declaration pass"*) was available on the day.
5. **Its parser bug is unfalsifiable.** The `skipBlock` extraction tool left no artifact
   anywhere in the repository. The account is plausible and specific; it is also the only
   record, and nothing can check it. *A report is the only witness to its own throwaway
   tools.*

---

*Original: 2026-06-16 12:17, §ARCH-02 / §DATA-01, lab report count 64 (`7d3615a`).
Verified and rewritten 2026-08-13 under §DOC-02ba. 211 → 439 lines — the only report in
this program to grow, because the original was thin and the verification is the deliverable.*
