<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report — Layer 49: Quest -1 "The Open Door" + World Creator Wizard

**IEEE-Format Post-Mortem**  
**Date:** 2026-05-25  
**Layer:** 49  
**Section:** §XIV  
**Status:** ✅ Implemented  
**Codebase:** `roll2hit-v3.html` — single-file browser RPG

---

## Abstract

This report documents the design intent, implementation architecture, and philosophical rationale of Layer 49 — "Quest -1: The Open Door" — and its companion concept, the World Creator Wizard. Quest -1 is a post-endgame disclosure that fires at the CO (Cosmic Realm) node when the player reaches Level 20. It breaks the fourth wall deliberately: the game acknowledges that Level 21 does not exist, then hands the player a grep reference sheet and an MIT License notice. The World Creator Wizard, documented in `plan.md §XIV` and partially implemented as a console-completion path, is the mechanism by which a post-Level-20 player becomes the next designer. This layer encodes the project's core philosophy: the game is a learning artifact, not a product, and its completion is an invitation to author.

---

## I. Design Intent

### A. The Level 20 Problem

`roll2hit-v3.html` is a D&D 5e Fighter Champion progression capped at Level 20. The `XP_LEVELS` array has 20 entries. `FIGHTER_FEATURES` has entries for L2–L20. There is no L21 state, no L21 XP threshold, and no `FIGHTER_FEATURES[21]`. A player who reaches L20 has exhausted the progression system.

The naive response — a "You Win" screen — was rejected. The game already has a victory screen (`storyCheckVictory`) for the CO encounter. A second congratulatory message for reaching L20 separately from the story ending would be redundant and anticlimactic.

The chosen response: acknowledge the boundary, explain what it is made of, and make the boundary itself the invitation.

### B. The World Creator Philosophy

The project is MIT-licensed, single-file, and fully readable. Every const, every function, every quest completion condition is visible in plain JavaScript with no build step. The game has been built incrementally through a conversational protocol (`plan.md` as directive, lab reports as memory). A player who has completed the game is, by definition, someone who understands how the world works narratively. The question is whether they understand how it works technically.

Quest -1 answers: here is how to find out. The "World Creator Wizard" is not a wizard in the UI sense — it is the set of terminal commands and console paths that let a post-game player extend the world.

---

## II. Implementation Architecture

### A. Trigger Condition

**File:** `roll2hit-v3.html` line 14732  
**Node:** CO (Cosmic Realm — The Convergence)  
**Condition:** `node.code === 'CO' && S_story.level >= 20 && !S_story.questMinusOne`

The flag `questMinusOne` (boolean, default `false`, defined in `_S_DEFAULTS()` at line 8423) prevents the disclosure from firing more than once per run. On NG+, `priorQuestMinusOne` (line 8426) preserves the first-run flag across the reset, enabling the NG+ remembrance quest `quest_ng_02` to reference it.

### B. Disclosure Content

The disclosure renders as a `sweelinck-variant` div (olive-green border, same styling as narrative variant text) inserted after the story text box. Content (line 14736–14768):

1. **State acknowledgment** — "You are Level 20. There is no Level 21 in this build."
2. **Source disclosure** — exact line count, `MONSTER_POOL` size, `WORLD_DB` size, MIT License reference.
3. **The door metaphor** — "Level 21 is undefined. That is not a bug. That is the door."
4. **World Creator commands** — three grep commands the player can run immediately:
   ```
   grep -n "MONSTER_POOL" roll2hit-v3.html
   grep -c "key:\'" roll2hit-v3.html
   grep -n "^const QUEST_DB" roll2hit-v3.html
   ```
5. **Console completion path** — `S_story.questMinusOne = true; storyAutoSave();` — the player types this in the browser console. The game explicitly states "The game will not know whether you earned it. That is also intentional."
6. **Attribution** — "— Froberger's margin note, Entry 42 (not yet written)" — a forward reference to the NG+ Entry 42 mechanic (Layer 50).

### C. State Flags

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `questMinusOne` | boolean | `false` | Prevents repeat firing in current run |
| `priorQuestMinusOne` | boolean | `false` | Preserved across NG+ reset; gates `quest_ng_02` |

**NG+ preservation** (line 8902–8910): `storyNewGamePlus()` captures `questMinusOne` into `savedPriorQuestMinus1` before calling `_S_DEFAULTS()`, then writes it to `priorQuestMinusOne` after reset. This allows the NG+ remembrance layer to activate `quest_ng_02` ("Entry 42") for players who completed Quest -1 in a prior run.

**NG+ cross-reference** (line 14261): `quest_ng_02` activates automatically at CI in NG+ if `priorQuestMinusOne` is true — the game knows you found the door once and asks you to write the next entry.

---

## III. World Creator Wizard (Partial Implementation)

### A. Scope as Documented in §XIV

The full World Creator Wizard spec in `plan.md §XIV` describes:
- A terminal-style modal at the CO node post-L20
- A step-by-step onboarding for adding a new monster (`MONSTER_POOL` entry), new node (`NODE_MAP` + `NODE_COORDS`), and new quest (`QUEST_DB`)
- A verification loop using grep to confirm correct addition
- An MIT fork-starter script

### B. What Was Implemented

The implemented Layer 49 delivers the **disclosure phase** of the World Creator Wizard: the player is told what the codebase contains and given the grep reference. The **interactive wizard UI** (modal with guided steps) was not implemented — the game instead relies on `plan.md §XIV` as the documentation and on the player's browser console as the implementation environment.

This was an intentional scoping decision: an interactive wizard inside the game would be fragile (coupling the game's UI to its own source code), whereas the grep commands and plan.md directions are durable and honest about requiring external tools.

### C. Design Verdict

The console-completion path (`S_story.questMinusOne = true`) is the correct implementation for this mechanic. It requires the player to open the browser console — itself a step toward developer tools. The act of completing the quest is the first act of the World Creator pattern.

---

## IV. Post-Mortem Notes

### What Worked

- The `sweelinck-variant` styling (olive border, narrative tone) makes the disclosure feel like a discovered document rather than a UI element. The tonal consistency with the Froberger journal system is correct.
- The forward reference to "Entry 42 (not yet written)" creates a bridge to Layer 50's NG+ remembrance system. The two layers form a deliberate pair: Quest -1 opens the door, Entry 42 asks what you found behind it.
- Preserving `priorQuestMinusOne` across NG+ resets is mechanically clean and philosophically consistent — the game remembers that you were the player who reached the boundary.

### What Could Be Better

- The disclosure fires regardless of whether the player has completed the CO story encounter. A Level 20 player who reaches CO before defeating Commander Auros would see the developer disclosure before the narrative climax, breaking the story sequence. A guard condition checking `S_story.defeatedBattles['CO']` would be appropriate.
- The grep commands assume the player has the source file on disk. A browser-based player (who loaded the game from a URL) cannot run grep. An in-browser equivalent — e.g., a button that opens the source in a new tab — would be more universally accessible.
- "The markdown files in this directory keep the documentation synchronized" is true for the developer but invisible to the player. Linking to the GitHub repository URL would make this concrete.

---

## V. File References

| File | Location | Content |
|------|----------|---------|
| `roll2hit-v3.html` | Line 8423 | `questMinusOne: false` in `_S_DEFAULTS()` |
| `roll2hit-v3.html` | Line 8426 | `priorQuestMinusOne: false` in `_S_DEFAULTS()` |
| `roll2hit-v3.html` | Lines 8902–8910 | NG+ preservation of `questMinusOne` → `priorQuestMinusOne` |
| `roll2hit-v3.html` | Lines 14731–14770 | Quest -1 disclosure block at CO node |
| `roll2hit-v3.html` | Line 14261 | `quest_ng_02` activation on `priorQuestMinusOne` |
| `plan.md` | §XIV | Full World Creator Wizard spec |
| `lab-report-ng-plus-remembrance.md` | — | Layer 50 post-mortem — Entry 42 and quest_ng_02 cross-reference |

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
