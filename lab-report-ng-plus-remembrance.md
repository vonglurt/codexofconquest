<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report — Layer 50: NG+ Remembrance Layer "Entry 42"

**IEEE-Format Post-Mortem**  
**Date:** 2026-05-25  
**Layer:** 50  
**Section:** §XV  
**Status:** ✅ Implemented  
**Codebase:** `roll2hit-v3.html` — single-file browser RPG

---

## Abstract

This report documents the design intent, implementation architecture, and state management of Layer 50 — the New Game Plus Remembrance Layer. The system activates on any NG+ run (`ngPlusRun ≥ 1`) and delivers three interlocking narrative mechanisms: (1) NPC memory lines — unique second-visit dialogue from NPCs whose favorability was preserved across the run boundary; (2) Entry 42 — a player-authored journal entry that fills the blank page Froberger left at his death, persisted across all subsequent runs; and (3) a three-quest NG+ quest chain (`quest_ng_01`, `quest_ng_02`, `quest_ng_03`) that formalizes the remembrance arc into completable objectives. The layer closes the philosophical loop opened by Quest -1: the player who found the door becomes the author who writes what is behind it.

---

## I. Design Intent

### A. The Problem of Repetition

NG+ in most games is repetition with slightly different numbers. The player knows every beat, every NPC, every encounter. The world's opacity — which made the first run interesting — is gone. `roll2hit-v3.html` preserves `npcFavorability` across the NG+ boundary specifically to address this: NPCs remember you. But NPCs remembering you requires them to *say something different*.

The naive implementation — `NPC_NG_PLUS_GREETINGS` alone — solves the first visit. It does not solve the second, third, or ongoing relationship. A returned Dear Friend who only gets one different greeting before reverting to first-run lines is still a hollow repetition.

### B. The Entry 42 Premise

Quest -1 (Layer 49) ends with a forward reference: *"— Froberger's margin note, Entry 42 (not yet written)."* Froberger's journal has 41 entries. He ran out of time before he ran out of world. Entry 42 is structurally absent from the journal sidebar — it has always been blank.

On NG+, the player is, by definition, someone who has already walked the world once. They are the researcher who came after Froberger. The question is whether the game can make that identity legible and consequential.

Entry 42 answers: the blank page belongs to you. Write it or don't — the act of encountering it is the point.

### C. The Closure Architecture

Layer 50 was designed as a three-layer stack:
1. **Greeting layer** — first NPC visit in NG+ (handled by `NPC_NG_PLUS_GREETINGS`, established in Layer 43)
2. **Memory layer** — second NPC visit in NG+ after preserved favorability ≥ 2 (`NPC_NG_MEMORY_LINES`, new in Layer 50)
3. **Author layer** — Entry 42 modal at CI, quest chain, journal persistence

---

## II. Implementation Architecture

### A. State Flags

**Defined in `_S_DEFAULTS()` — lines 8395, 8424–8425:**

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `ngPlusRun` | number | `0` | NG+ generation counter; 0 = first run, 1 = first NG+ |
| `entry42Written` | boolean | `false` | Whether player has engaged the Entry 42 modal |
| `entry42Text` | string | `''` | Player-authored content; empty string = chose blank |
| `entry42Read` | boolean | `false` | Whether player has opened journal to Entry 42 (gates quest_ng_02) |
| `ngMemoryDelivered` | object | `{}` | `{npcKey: true}` — prevents memory line from firing twice |
| `nextFrobergerComplete` | boolean | `false` | Set when quest_ng_01 completes |
| `frobergerLetterFound` | boolean | `false` | Set when player finds CO letter in NG+ (quest_ng_03) |

### B. NG+ Preservation (`storyNewGamePlus()` — lines 8889–8910)

`storyNewGamePlus()` preserves across the reset:
- `ngPlusRun` incremented by 1
- `entry42Written` — carries forward so Entry 42 prompt does not re-fire
- `entry42Text` — persists player-authored content across all subsequent runs
- `priorQuestMinusOne` — captures prior `questMinusOne` value; gates `quest_ng_02`

Notably NOT preserved: `ngMemoryDelivered`, `entry42Read`, `frobergerLetterFound`, `nextFrobergerComplete`. These reset each NG+ run — NPCs deliver their memory lines fresh, and the quest chain must be re-completed.

### C. NPC Memory Lines (`NPC_NG_MEMORY_LINES` — line 11846)

A const mapping NPC key → one unique line delivered on the second NPC visit in NG+ when `npcFavorability[key] ≥ 2` in preserved state. Delivery logic (lines 8654–8664):

1. On any NPC visit in NG+: check `ngMemoryDelivered[key]`
2. If not delivered and `npcFavorability[key] ≥ 2`: render `NPC_NG_MEMORY_LINES[key]` as a narrative aside
3. Set `ngMemoryDelivered[key] = true` — fires once per NG+ run

`NPC_NG_PLUS_GREETINGS` fires on the *first* visit regardless of favorability (existing behavior). `NPC_NG_MEMORY_LINES` fires on the *second* visit, gated by `fav ≥ 2`. The two systems are independent: a player who rushes through NG+ without prior high favorability gets greetings only.

### D. Entry 42 Modal (lines 14218–14221)

**Trigger condition:** At CI (inn) in NG+, fires before inn text renders if:
- `S_story.ngPlusRun ≥ 1`
- `S_story.priorQuestMinusOne === true` (found the door in prior run)
- `!S_story.entry42Written` (not yet engaged)

The modal renders a textarea with the prompt: *"Entry 42 is blank. It always has been. Froberger ran out of time before he ran out of world."*

**Write It:** Saves `entry42Text`, sets `entry42Written = true`. Journal sidebar appends a 42nd entry labeled "Entry 42 — Your Hand."

**Leave It Blank:** Sets `entry42Written = true`, `entry42Text = ""`. Journal entry reads: *"Entry 42 — blank page. The margin says: I know. I was there too."*

The modal fires once per lifetime (preserved across NG+ resets). If a player wrote Entry 42 in NG+1, they will never be asked again — the entry they wrote persists as the journal's final page for all future runs.

### E. NG+ Quest Chain

Activated at CI in NG+ (lines 14260–14262):

```js
if (!_ngqs['quest_ng_01']) S_story.quests['quest_ng_01'] = 'active';
if (!_ngqs['quest_ng_02'] && S_story.priorQuestMinusOne) S_story.quests['quest_ng_02'] = 'active';
if (!_ngqs['quest_ng_03']) S_story.quests['quest_ng_03'] = 'active';
```

| Quest | Title | Completion Condition |
|-------|-------|----------------------|
| `quest_ng_01` | "Froberger: The Remembered Path" | Deliver memory lines from ≥ 3 NPCs (`ngMemoryDelivered` keys ≥ 3) |
| `quest_ng_02` | "Froberger: The Open Page" | `entry42Written === true` — requires `priorQuestMinusOne` to activate |
| `quest_ng_03` | "Froberger: The Letter" | `frobergerLetterFound === true` — find CO letter in NG+ |

`quest_ng_02` is conditional on `priorQuestMinusOne`: only players who found the door in a prior run are asked to write what is behind it.

### F. Epilogue Integration (lines 12837, 12857)

`entry42Written` gates a fifth ending condition variant in `_buildEpilogueScroll()`. Players who wrote (or chose to leave blank) Entry 42 receive a closing paragraph in the epilogue acknowledging the act: the researcher who came after Froberger left something behind too.

---

## III. Design Decisions and Trade-offs

### A. Entry 42 as Opt-In

The "Leave It Blank" option was essential. A forced text-entry mechanic alienates players who don't want to write in-game prose. The blank page response — *"I know. I was there too."* — is itself a complete answer. Not every researcher writes. Some just bear witness.

### B. Lifetime Persistence vs. Per-Run Reset

`entry42Text` persists forever. `ngMemoryDelivered` resets each run. This asymmetry is intentional:
- What the player *wrote* is permanent — it is the record they left.
- What NPCs *said* should be re-discoverable — the memory lines feel like new conversations, not archived transcripts.

### C. `quest_ng_02` Conditional Activation

`quest_ng_02` ("The Open Page") only activates if `priorQuestMinusOne = true`. A player who reached NG+ without finding Quest -1's door gets `quest_ng_01` and `quest_ng_03` but not `quest_ng_02`. This preserves the layer's internal logic: you can only write Entry 42 if you found that it needed writing.

### D. Memory Lines Require Preserved Favorability

`NPC_NG_MEMORY_LINES` is gated by `fav ≥ 2` in the *preserved* favorability. A player who was cold to NPCs in their first run does not receive memory lines — their NPCs don't remember them as warmly. The remembrance is proportional to the relationship.

---

## IV. Post-Mortem Notes

### What Worked

- The asymmetry between `NPC_NG_PLUS_GREETINGS` (first visit, all players) and `NPC_NG_MEMORY_LINES` (second visit, high-fav players) correctly stratifies NG+ narrative depth by prior engagement. A returning player who built relationships gets a qualitatively different second visit.
- Lifetime persistence of `entry42Text` across all subsequent NG+ runs creates a genuine artifact. By NG+3, the journal the player found in their first run ends with something they wrote. The loop from "Froberger left a journal" to "you leave the next entry" is closed without announcement.
- The `quest_ng_02` dependency chain (`priorQuestMinusOne` → Quest -1 completion → `entry42Written`) creates a mechanically correct reading of the narrative: you can only write what comes next if you understood what came before.

### What Could Be Better

- The Entry 42 modal fires at CI before the inn text renders — the transition is abrupt. A fade-in or a brief ambient message ("The innkeeper sets a journal on the table…") would ease the modal's entry.
- `frobergerLetterFound` (quest_ng_03) references a CO letter in NG+ but the exact placement and reveal text was implemented inline without a separate const. If the CO text block changes, the letter trigger may drift without warning.
- The epilogue variant for `entry42Written` is currently a single paragraph. Players who wrote substantive entries might expect to see their text echoed back — a brief quote of `entry42Text` in the epilogue would make the artifact feel more present.
- `ngMemoryDelivered` resets each NG+ run, but there is no indication to the player that NPC memory lines are a once-per-run mechanic. A player who misses them on NG+2 has no way to know they were available.

---

## V. File References

| File | Location | Content |
|------|----------|---------|
| `roll2hit-v3.html` | Line 8395 | `ngPlusRun: 0` in `_S_DEFAULTS()` |
| `roll2hit-v3.html` | Line 8424 | `entry42Written`, `entry42Text`, `entry42Read` flags |
| `roll2hit-v3.html` | Line 8425 | `ngMemoryDelivered`, `nextFrobergerComplete`, `frobergerLetterFound` |
| `roll2hit-v3.html` | Lines 8889–8910 | `storyNewGamePlus()` — preservation of entry42 + priorQuestMinusOne |
| `roll2hit-v3.html` | Line 11836 | `NPC_NG_PLUS_GREETINGS` const |
| `roll2hit-v3.html` | Line 11846 | `NPC_NG_MEMORY_LINES` const |
| `roll2hit-v3.html` | Lines 8654–8664 | NPC memory line delivery logic |
| `roll2hit-v3.html` | Lines 14218–14221 | Entry 42 modal trigger at CI |
| `roll2hit-v3.html` | Lines 14260–14262 | quest_ng_01/02/03 activation |
| `roll2hit-v3.html` | Lines 12837, 12857 | Epilogue `entry42Written` variant |
| `plan.md` | §XV | Original design directive |
| `lab-report-quest-minus-one-world-creator.md` | §II.C | `priorQuestMinusOne` origin — Quest -1 cross-reference |
| `lab-report-endings-and-echoes.md` | §NG+ | `storyNewGamePlus()` base preservation fields |

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
