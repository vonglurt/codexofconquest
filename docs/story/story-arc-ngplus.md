<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Story Arc — NG+ Remembrance (§XV)

**Arc type:** New Game Plus layer — persists across run boundaries  
**Section:** §XV  
**Lab report:** `lab-report-ng-plus-remembrance.md`  
**Status:** Implemented (Layer 50)

---

## Overview

§XV is the New Game Plus Remembrance Layer — a three-mechanism stack that activates on any NG+ run and delivers narrative depth proportional to prior engagement. It is built on a structural question: what does the game say to someone who has already walked the world once?

The answer operates at three layers:

1. **Greeting layer** — `NPC_NG_PLUS_GREETINGS`: first NPC visit in NG+ (established in Layer 43, not new to §XV)
2. **Memory layer** — `NPC_NG_MEMORY_LINES`: preserved favorability ≥ 2 (new in Layer 50). **As designed this fired on the SECOND NG+ visit; as built it fires on the first** — `S_story[ngGreetedKey] = true;@23731` is written by the greeting branch and read eleven lines later by the memory branch in the same synchronous pass, so the latch is always already set (§DX-02aj, measured §DOC-02aa).
3. **Author layer** — the Entry 42 **panel** at `LHR` (historical `CI`), quest chain, journal persistence

The section closes the philosophical loop opened by Quest -1 (§XIV): the player who found the door becomes the author who writes what is behind it.

---

## Prerequisites

| Condition | Source | Purpose |
|-----------|--------|---------|
| `ngPlusRun >= 1` | `storyNewGamePlus()` on first NG+ reset | Entire §XV layer active |
| `priorQuestMinusOne` | Captures `questMinusOne` before NG+ reset | Gates `quest_ng_02` — writing Entry 42 |
| 3+ Dear Friends (fav ≥ 2 preserved) | `npcFavorability` preserved across reset | Gates `quest_ng_01` completion, the memory lines **and the Entry 42 panel itself** (`if (_e42Dear >= 3) {@34640`) |

`quest_ng_02` ("The Open Page") only activates if `priorQuestMinusOne` is true — only players who found Quest -1's door in a prior run are asked to write what is behind it. A player who reached NG+ without finding the door gets `quest_ng_01` and `quest_ng_03` but not `quest_ng_02`. This preserves the layer's internal logic: you can only write Entry 42 if you found that it needed writing.

---

## Entry 42 Panel

**It is a panel, not a modal.** The block builds a `.sweelinck-variant` div and inserts it with `insertAdjacentElement('afterend')` below the story text box; there is no overlay and never was.

### Trigger Condition

At `LHR` (historical `CI`) — **City Streets — Birka**, *not* the inn (`TLL` is *The First Inn*) — in NG+, all **four** must hold:
- `S_story.ngPlusRun >= 1`
- `S_story.priorQuestMinusOne === true` (found the door in prior run)
- `!S_story.entry42Written` (not yet engaged)
- **`_e42Dear >= 3`** — at least three of `yael`/`brynn`/`quill`/`pachelbel`/`crov`/`auros` at fav ≥ 2 (`const _e42Dear = ['yael','brynn','quill','pachelbel','crov','auros']@34638`). Undocumented until §DOC-02aa; it is also the gate on the game's **fifth ending**, since `vaArchitectureKnown` requires `entry42Written`. Below the threshold the panel renders nothing and says nothing — §AUDIT-03ah.

### Panel Text

Textarea placeholder: *"Write Entry 42, or leave this blank."*, under the line *"The page is blank. His handwriting fills forty-one entries. This one — the last — is empty. He left it for someone else. You are the someone else."*

> **NOT SHIPPED (kept).** The spec's prompt *"Entry 42 is blank. It always has been. Froberger ran out of time before he ran out of world."*, the journal label *"Entry 42 — Your Hand"*, and the blank-page line *"The margin says: I know. I was there too."* have **0 commits in the file's history**. The shipped equivalents are above and below.

Two response options:

**Write It:** Saves `entry42Text` from the textarea, sets `entry42Written = true`. The journal sidebar appends a 42nd entry headed `Entry 42 ✦ — <span style="color:#f0c070">by you</span>@30682`.

**Leave It Blank:** Sets `entry42Written = true`, `entry42Text = ""`. The journal body reads *"[left blank]"*, and the panel answers `📖 You left Entry 42 blank. Some things need not be written to be true.@34660`

### Lifetime Persistence

The panel fires once per lifetime. If a player wrote Entry 42 in NG+1, they will never be asked again — the entry they wrote persists as the journal's final page for all future runs. `entry42Text` is preserved across all subsequent NG+ resets. `entry42Written` is also preserved, preventing re-fire.

The "Leave It Blank" option was essential. A forced text-entry mechanic alienates players who don't want to write in-game prose. The blank-page response — *"Some things need not be written to be true."* — is itself a complete answer. Not every researcher writes. Some just bear witness.

---

## NPC Memory Lines (`NPC_NG_MEMORY_LINES`)

### What They Are

A const mapping NPC key → one unique line delivered in NG+ when `npcFavorability[key] >= 2` in the preserved state. **Designed for the second visit; delivered on the first** — see the delivery note below.

### Delivery Logic

1. On any NPC visit in NG+: check `ngMemoryDelivered[key]`
2. If not delivered and `npcFavorability[key] >= 2`: render `NPC_NG_MEMORY_LINES[key]` as a narrative aside
3. Set `ngMemoryDelivered[key] = true` — fires once per NG+ run

`NPC_NG_PLUS_GREETINGS` fires on the first visit regardless of favorability. `NPC_NG_MEMORY_LINES` was specified to fire on the **second** visit, gated by fav ≥ 2 — **and never has.** The memory branch requires `S_story[ngGreetedKey]`, which the greeting branch sets `S_story[ngGreetedKey] = true;@23731` eleven lines earlier **in the same render pass**, so both land together: the greeting in the card, the memory line 800 ms later via `setTimeout(() => storyMsg(NPC_NG_MEMORY_LINES[key]), 800);@23738`. The corollary is the live hazard: an NPC given a memory line but **no** greeting entry can never deliver it, because nothing else writes the latch. That was the state of `quill`/`crov`/`auros` from 2026-05-25 until §AUDIT-03n re-keyed `NPC_NG_PLUS_GREETINGS` off the profiles' surnames on 2026-07-31 — three of six memory lines unreachable for 67 days. → §DX-02aj. The favor stratification itself is real and works: a player who rushes NG+ without prior high favorability gets greetings only.

Memory lines are proportional to prior relationship. A player who was cold to NPCs in their first run does not receive memory lines — their NPCs don't remember them as warmly.

Dear Friends eligible for memory lines: `yael`, `brynn`, `quill`, `pachelbel`, `crov`, `auros`.

### Reset Behavior

`ngMemoryDelivered` resets each NG+ run — NPCs deliver their memory lines fresh on each new run. This asymmetry is intentional: what the player wrote (Entry 42) is permanent; what NPCs said is re-discoverable. Memory lines feel like new conversations, not archived transcripts.

---

## Quest Chain

Activated at `LHR` (historical `CI`) in NG+. **The inline `storyRender` activation block shown in earlier revisions of this doc no longer exists** — §VM-01-G3 (`c9f3946`) replaced it with declarative UQF gates, and all three carry `activateNode:'LHR'`, `onActivate:null` (silent, as the block always was) and `boardExempt:true` (a personal remembrance is not Warrant work):

```js
quest_ng_01: gate:{ countMin:[{ path:'ngPlusRun', min:1 }] }
quest_ng_02: gate:{ countMin:[{ path:'ngPlusRun', min:1 }], flags:['priorQuestMinusOne'] }
quest_ng_03: gate:{ countMin:[{ path:'ngPlusRun', min:1 }] }
```

| Quest | Title | Completion Condition | Reward |
|-------|-------|----------------------|--------|
| `quest_ng_01` | "Froberger: The Remembered Path" | `ngMemoryDelivered` keys ≥ 3 (3 Dear Friend NPCs visited) | 500gp |
| `quest_ng_02` | "Froberger: The Open Page" | `entry42Written === true` | The act itself (no gold reward) |
| `quest_ng_03` | "Froberger: The Letter" | `frobergerLetterFound === true` | 300gp + `frobergerLetterFound = true` |

### Quest Descriptions

**quest_ng_01 — "The Remembered Path":** Revisit 3 Dear Friends. Tracked via `ngMemoryDelivered` — each Dear Friend NPC (fav ≥ 2) whose card renders in NG+ counts toward the three required. Reward: 500gp. **NOT SHIPPED (kept):** earlier revisions said it sets `nextFrobergerComplete = true`; nothing in the file's history has ever assigned that field (§DX-02n).

**quest_ng_02 — "The Open Page":** Write Entry 42 at `LHR` (historical `CI`). Its shipped hint — `hint:'Visit the City Inn to find the open page.',@11051` — names the wrong place: `LHR` is City Streets, the inn is `TLL` (§AUDIT-03s). Only activated if `priorQuestMinusOne`. Reward is the act itself — writing in the blank page is its own completion. No gold. The mechanic does not require substantive prose; choosing "Leave It Blank" completes the quest.

**quest_ng_03 — "The Letter":** Find Froberger's sealed letter at `TLS` (historical `CO`). Only available in NG+; not present in a first run. One "Take the letter." button on `TLS` (historical `CO`) visit when `!frobergerLetterFound`. Sets `frobergerLetterFound = true`. Reward: 300gp.

---

## Froberger's Sealed Letter at `TLS` (historical `CO`)

Rendered on `TLS` (historical `CO`) visit in NG+ when `!frobergerLetterFound`. The letter is not available in a first run — it exists only in NG+ as a final artifact from Froberger.

Button: "Take the letter." Sets `frobergerLetterFound = true`, completes quest_ng_03, grants 300gp.

The letter is a readable item. Its presence at `TLS` (historical `CO`) — the arc's closing node — positions it as a valediction: something Froberger left for whoever came after him. The player who completes quest_ng_03 is the person Froberger addressed.

---

## State Flags

| Flag | Type | Default | Preserved Across NG+ | Purpose |
|------|------|---------|----------------------|---------|
| `ngPlusRun` | number | `0` | Yes (incremented) | NG+ generation counter; 0 = first run |
| `entry42Written` | boolean | `false` | Yes | Whether player has engaged the Entry 42 modal |
| `entry42Text` | string | `''` | Yes | Player-authored content; empty string = chose blank |
| `entry42Read` | boolean | `false` | No | Set by the journal renderer (`S_story.entry42Read = true;@30676`) and **read by nothing** — write-only, §DX-02n. It does *not* gate `quest_ng_02`; that gates on `entry42Written`. |
| `ngMemoryDelivered` | object | `{}` | No | `{npcKey: true}` — prevents memory line from firing twice per run |
| `nextFrobergerComplete` | boolean | `false` | No | **DEAD** — 1 occurrence in the whole file (its own declaration), 0 assignments in history. §DX-02n. |
| `frobergerLetterFound` | boolean | `false` | No | Set when player finds `TLS` (historical `CO`) letter in NG+ |
| `priorQuestMinusOne` | boolean | captured | Yes | Captures `questMinusOne` value before NG+ reset |

**What survives reset:** `ngPlusRun` (incremented), `entry42Written`, `entry42Text`, `priorQuestMinusOne`.

**What resets each run:** `ngMemoryDelivered`, `entry42Read`, `frobergerLetterFound`, `nextFrobergerComplete`. NPCs deliver their memory lines fresh; the quest chain must be re-completed.

---

## NG+ Preservation in `storyNewGamePlus()`

`storyNewGamePlus()` performs the following at NG+ reset:
- `ngPlusRun` incremented by 1
- `entry42Written` preserved — Entry 42 prompt does not re-fire
- `entry42Text` preserved — player-authored content persists across all subsequent runs
- `priorQuestMinusOne` set — captures prior `questMinusOne` value; gates `quest_ng_02`
- `npcFavorability` preserved — NPCs remember the relationship level

Not preserved: `ngMemoryDelivered`, `entry42Read`, `frobergerLetterFound`, `nextFrobergerComplete`.

---

## Epilogue Integration

`entry42Written` is one of three flags on the **fifth ending** — `vaArchitectureKnown && entry42Written && ngPlusRun >= 1` (`// Layer 52: §XVII — fifth ending: vaArchitectureKnown overrides all other questions@28268`). It overrides Sweelinck's last question with *"What was inside the cage?"* and appends the four-authors addendum to the victory screen. **Correction (§DOC-02aa):** earlier revisions placed this in `_buildEpilogueScroll()`; `function _buildEpilogueScroll() {@28120` carries no `entry42` term and never did — the sites are in the victory-screen renderer below it.

---

## Structural Link to §XVII: `entry42Written` as Arc Gate

The `entry42Written` flag is required for §XVII (Void Archaeology) to be completable. Specifically:

- `quest_va_04` cannot complete without `entry42Written`
- When `vaLastWardVisited` is true and `entry42Written` is true, Benedikt delivers the four-author chain synthesis at `NUE` (historical `SQ`)
- Without `entry42Written`, the chain has only three links and Benedikt does not speak
- `vaArchitectureKnown` cannot be set

This is the structural link between §XV and §XVII. §XV is not a standalone NG+ layer — it is the authorship prerequisite for the investigation arc's close.

The dependency chain reads: `priorQuestMinusOne` (§XIV Quest -1) → `entry42Written` (§XV) → `vaArchitectureKnown` (§XVII). Three arcs, three acts of authorship, one chain.

---

## The Benedikt Four-Author Chain Speech

Delivered at `NUE` (historical `SQ`) when `vaLastWardVisited && entry42Written && !vaArchitectureKnown` (this speech is the §XVII arc close, but `entry42Written` from §XV is the enabling condition):

> **Benedikt:** "She built it. You closed it. Froberger found the mechanism. You followed him. Entry 42 is the fourth link. Four links is a chain. A chain holds. That is the only kind of answer this work produces — not a solution, a chain."

The four authors named:

1. **The First Researcher (Marta Eilene Vass)** — built the cage; wrote the Constructor's Log; left no name in the official record
2. **Froberger** — found the mechanism; documented it in his field notes; died for it
3. **The player** — activated the sealing mechanism at `ZRH` (historical `DF`) (the Defiant Fields battle); closed the cage without knowing it
4. **Entry 42** — the player's own written entry; the fourth link that makes it a chain

The chain only has four links if the player wrote (or chose to leave blank) Entry 42. `vaArchitectureKnown` only sets when `entry42Written` is true. A player who skipped Entry 42 cannot receive this synthesis. The arc requires self-authorship to close.

---

## Intersection Points (Cross-Reference Table)

| Node | §XV Role | Connected Arc | Connection |
|------|----------|---------------|------------|
| `LHR` (historical `CI`) | Entry 42 modal trigger; quest_ng_01/02/03 activation | §XVII | `vaCI` investigation mark also at `LHR` (historical `CI`); both occur in NG+ |
| `NUE` (historical `SQ`) | `entry42Written` required for quest_va_04 | §XVI + §XVII | Benedikt Rasp (§XVI Dear Friend) delivers four-author chain; `entry42Written` enables it |
| `TLS` (historical `CO`) | Froberger's sealed letter (quest_ng_03) | §XIV | `TLS` (historical `CO`) is also the Quest -1 Level 20 trigger node; farewell arc node in §XXV |
| Any node (Dear Friends) | NPC memory lines (second visit, fav ≥ 2) | §XXV | Act VIII farewell beats also fire at NPC nodes by favorability |

---

## Design Trade-offs

### Entry 42 as Opt-In

Both "Write It" and "Leave It Blank" set `entry42Written = true`. The opt-in is the encounter itself, not the prose. This correctly positions the act as: whether or not you wrote something, you stood in front of the blank page. That is the authorship the arc requires.

### Lifetime Persistence of `entry42Text`

The player's written entry (or the blank marker) persists across all subsequent NG+ runs. By NG+3, the journal the player found in their first run ends with something they wrote. The loop from "Froberger left a journal" to "you leave the next entry" is closed without announcement.

### `quest_ng_02` Conditional Activation

A player who reached NG+ without finding Quest -1's door is not asked to write Entry 42. This preserves the layer's internal logic: `quest_ng_02` ("The Open Page") presupposes understanding of what the page is. The prerequisite dependency chain exists because the authorship only makes sense in sequence.

---

## File References

| File | Location | Content |
|------|----------|---------|
| `play.html` | Line 8395 | `ngPlusRun: 0` in `_S_DEFAULTS()` |
| `play.html` | Lines 8424–8425 | `entry42Written`, `entry42Text`, `entry42Read`, `ngMemoryDelivered`, `nextFrobergerComplete`, `frobergerLetterFound` |
| `play.html` | Lines 8889–8910 | `storyNewGamePlus()` — preservation logic |
| `play.html` | Line 11836 | `NPC_NG_PLUS_GREETINGS` const |
| `play.html` | Line 11846 | `NPC_NG_MEMORY_LINES` const |
| `play.html` | Lines 8654–8664 | NPC memory line delivery logic |
| `play.html` | Lines 14218–14221 | Entry 42 modal trigger at `LHR` (historical `CI`) |
| `play.html` | Lines 14260–14262 | quest_ng_01/02/03 activation |
| `play.html` | Lines 12837, 12857 | Epilogue `entry42Written` variant |
| `lab-report-ng-plus-remembrance.md` | All | §XV full implementation record |
| `lab-report-void-archaeology.md` | §II.B | `entry42Written` as required gate for `vaArchitectureKnown` |
| `lab-report-quest-minus-one-world-creator.md` | §II.C | `priorQuestMinusOne` origin — Quest -1 cross-reference |
| `lab-report-endings-and-echoes.md` | §NG+ | `storyNewGamePlus()` base preservation fields |

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../../LICENSE) for full text.*
