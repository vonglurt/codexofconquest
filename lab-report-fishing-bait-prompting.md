# Lab Report — The Yugurt Lake Fishing & Bait Sub-System: Design, Directive, and Prompt Architecture
### IEEE-Format Academic Review of a Conversational Game Design Protocol  
**Author:** roll2hit.com Development Session, 2026-05-24  
**Codebase:** `roll2hit-v3.html` — 14,377-line single-file browser RPG  
**License:** MIT — roll2hit.com — Copyright (c) 2026 — Free to use, modify, and share.

---

## Abstract

This report documents the complete design of the Yugurt Lake Fishing and Bait Sub-System (plan.md Sections XII-A through XII-Y, Layer 47 PLANNED) as specified for the `roll2hit-v3.html` single-file D&D 5e RPG. It also documents, with academic rigor, the conversational prompting methodology used to produce that design — analyzing how a human collaborator directed an AI assistant through a structured planning protocol defined in `index.md` and enforced by a persistent memory directive.

The central argument: **`plan.md` is not a planning document. It is a structured prompt.** The directive in `index.md` is not a style guide. It is a protocol that makes the human's conversational inputs machine-parseable. The fishing system's design emerged from a sequence of well-typed commands — data dumps, constraint declarations, formula definitions, and isolation directives — that the directive transformed from raw conversation into durable game specification.

The report additionally documents the global monster drop nerf (weapon bonus floor shifted from `[0,+3]` to `[−3,0]`), the Luck stat's full integration across all fishing phases, and the replacement of random magic loot as the primary gear vector with a skill-and-stat-gated fishing economy.

---

## I. The Directive — `index.md` as Protocol Header

### A. Origin and Structure

Before any fishing mechanics were designed, the session established a governing directive, added permanently to the top of `index.md`:

> **Adding to the project = Planning.**  
> Write a new section to `plan.md`. Assign a Layer number. Describe the feature as a PLANNED stub. Mark it `⚠️ PLANNED`. Add PLANNED stubs to the appropriate markdown docs. Do **not** touch `roll2hit-v3.html`.
>
> **Implementing = Writing code + syncing markdown.**  
> Write JavaScript/HTML to `roll2hit-v3.html`. Then sync every markdown doc that describes what you changed. Both steps must happen.

This directive imposes a two-phase workflow on all project additions:

```
Phase 1 — PLANNING:
  human prompt → plan.md section → PLANNED stubs in story.md / world.md / mechanics.md

Phase 2 — IMPLEMENTATION (separate session):
  plan.md section → HTML code → markdown sync
```

The fishing system, in its current state, exists entirely in Phase 1. Sections XII-A through XII-Y in `plan.md` constitute a complete specification. Nothing has been written to `roll2hit-v3.html`. This is not a failure of progress — it is the directive being followed correctly.

### B. Why the Directive Exists

We have reasonable entry points to edit the HTML code, or to plan it thoughtfully and impliment the HTML. 
The directive enforces a **two-way sync rule**: every item in the markdown must trace to HTML, and everything in HTML must have a home doc. The directive makes this rule operational by defining what each class of work requires before it can be called complete.

### C. The Directive as Type System

A type system prevents a program from passing a string where an integer is required. The directive functions as a type system for project contributions:

| Input | Type | Valid Phase | Required Output |
|-------|------|------------|----------------|
| New game concept | `PLANNED` | Phase 1 only | `plan.md` section + stubs in relevant docs |
| Code change | `IMPLEMENTED` | Phase 2 only | HTML edit + sync to all affected `.md` files |
| Documentation fix | `SYNC` | Either | Edit `.md` only; no HTML touch |

Violating the type system — writing code without syncing docs, or writing docs without code backing — produces the orphaning failures described above. The fishing system is cleanly typed: it is `PLANNED` throughout, with no code yet written.

---

## II. The Fishing & Bait Sub-System — Complete Design Summary

### A. Architectural Position

The fishing sub-system sits at the intersection of three existing systems:

```
MONSTER_POOL ──────────────────────────────────────────────────────┐
  (predator fish: fish_01–fish_20, existing Layer 37)              │
                                                                    ▼
LUCK STAT (Layer 48, getLuck()) ────────────────────► FISHING ENGINE (Layer 47)
  geometric mean of STR×DEX×CON×INT×WIS×CHA                       │
  floor((Luck−10)/2) = Luck Modifier                               │
                                                                    ▼
BAIT_FISH_POOL ◄──────────────────────────────────────── TACKLE BOX
  (new: 20 freshwater species, never in MONSTER_POOL)    S_story.tacklebox{}
```

The engine is isolated: it is only active at nodes where `isFishingLake:true` (currently only YL, node 75). No regular weapons work here. No regular monsters appear here. XP still accumulates. Level-up is possible from fishing alone.

### B. The Three Territory Zones

Yugurt Lake is stratified. Zone access is gated by tackle box contents, not by player choice:

| Zone | Bait Tiers Required | Predator Rank Pool | DC to Find Bait | Design Role |
|------|--------------------|--------------------|----------------|------------|
| **Shore** | None (bare hook allowed) | 1–7 | DC 8 | Entry zone; tutorial |
| **Reeds** | Tier 2 in tackle box | 8–14 | DC 12 | Mid-game; conditions begin |
| **Deep** | Tier 4 in tackle box | 15–20 | DC 16 | Endgame; deadly predators |

The progression is self-enforcing: you cannot access the Reeds until you have fished the Shore long enough to collect Tier 2 bait. The lake teaches itself.

### C. Bait Fish Pool — 20 Freshwater Species, 5 Tiers

Bait fish are a separate constant, `BAIT_FISH_POOL`, deliberately excluded from `MONSTER_POOL`. This prevents them from appearing in corridor encounters, which would be incoherent — a Fathead Minnow does not ambush players on the road to Tilbury.

**Bait fish are ammunition, not enemies.** They have no counterattack. One hit catches them. Their XP is awarded on catch, not on "kill."

| Tier | Bait Bonus | Species (4 per tier) | AC | HP | XP | Zone |
|------|-----------|---------------------|----|----|-----|------|
| 1 | +1 | Fathead Minnow, Bluntnose Minnow, Bridle Shiner, Swallowtail Shiner | 3–4 | 2–3 | 5 | Shore |
| 2 | +2 | Golden Shiner, Comely Shiner, Satinfin Shiner, Ironcolor Shiner | 4–5 | 4–5 | 10 | Shore |
| 3 | +3 | Creek Chub, Common Shiner, Spotfin Shiner, Spottail Shiner | 5–6 | 6–7 | 15 | Reeds |
| 4 | +4 | Gizzard Shad, Alewife, White Sucker, Banded Killifish | 6–7 | 8–10 | 20 | Reeds |
| 5 | +5 | Tadpole Madtom, Margined Madtom, Mummichog, Blacknose Dace | 7–8 | 11–12 | 25 | Deep |

The 20 freshwater species were sourced directly from a user-provided naturalist list and converted into game objects during this session — a direct data-dump-to-spec pipeline documented in Section IV.

### D. The Tackle Box — Arrows for the Fishing Rod

The Fishing Rod is a weapon class that accepts only one type of ammunition: bait fish. The Tackle Box is the quiver.

```js
// _S_DEFAULTS() additions:
equippedBait: null,             // { key, name, icon, tier, bonus, count }
tacklebox: {},                  // { [slug]: count }
tackleboxZoneUnlocks: { shore:true, reeds:false, deep:false },
fishingCatchLog: [],            // last 20 catches
baitFishingActive: false        // suppresses node re-render during bait combat
```

Auto-cycle behavior mirrors the existing arrow/quiver pattern: when equipped bait depletes to 0, the system scans `tacklebox` for the next highest-tier bait and auto-equips it, notifying the player. If no bait remains anywhere, the cast proceeds with Bare Hook (−3 to Catch Roll, Luck Mod only on Type Roll).

### E. The Predator Attraction Formula

```
predatorRank = clamp(2d20 + baitBonus + Luck Mod, 1, 20)
```

The formula has three components:
- **2d20:** base randomness, range 2–40 before clamping
- **baitBonus:** +0 (bare hook) to +5 (Tier 5 bait) — the tackle box's mechanical contribution
- **Luck Mod:** floor((Luck−10)/2) — the character's ambient statistical fortune

At endgame (Level 20, all stats maximized, Luck ≈ 17, Luck Mod +3) with Tier 5 bait (+5), average 2d20 roll of 21 yields `21 + 5 + 3 = 29`, clamped to 20. **A maximally-built character fishing the Deep zone with Tier 5 bait reliably encounters Rank 20 predators.** This is a design target, not a side effect.

### F. Predator Combat — Conditions by Rank

Predator fish fight back. High-rank predators inflict conditions that persist for the duration of the fishing encounter and clear automatically at its end:

| Rank | Condition Stack | CON Save DC | Notes |
|------|----------------|------------|-------|
| 1–7 | None | — | Shore predators; clean fight |
| 8–10 | Poisoned | 12 | Disadvantage on attacks next round |
| 11–13 | Poisoned + Restrained | 14 | Cannot flee while Restrained |
| 14–16 | Poisoned + Blinded | 16 | Player attacks at Disadvantage |
| 17–19 | Poisoned + Paralyzed | 18 | Lose bonus action; enemy attacks at Advantage |
| 20 | Poison + Paralyzed + Cursed | 20 | All saves at Disadvantage (Yugurt's Dread) |

The Luck Modifier adds to death saves during fishing encounters — the only place in the base game where Luck directly modifies a survival roll.

### G. Magic Weapon Drops — Fishing as the Gear Economy

Every defeated predator fish drops a magic weapon. The quality formula:

```
weaponMagicBonus = floor(fish.ac / 4) + max(0, Luck Mod)
```

| Fish AC | Base | +Luck Mod 0 | +Luck Mod 1 | +Luck Mod 2 | +Luck Mod 3 |
|---------|------|------------|------------|------------|------------|
| 5–7 | +1 | +1 | +2 | +2 | +3 |
| 8–10 | +2 | +2 | +3 | +3 | +4 |
| 14–16 | +3 | +3 | +4 | +4 | +5 |
| 20 | +5 | +5 | +6 | +6 | +6 (cap) |

### H. The Global Monster Drop Nerf

To make fishing the exclusive magic loot vector, `_rollMonsterWeaponDrop()` changes by one line:

```js
// BEFORE (Layer 25 implementation):
const magicBonus = Math.floor(Math.random() * 4);      // 0 to +3

// AFTER (Layer 47 implementation):
const magicBonus = Math.floor(Math.random() * 4) - 3;  // −3 to 0
```

Monster drops become degraded gear: Rusted (−3), Chipped (−2), Worn (−1), Salvaged (0). Still equippable. Still sellable for scrap gold. But no longer a source of power. The only way to acquire a magic weapon with a positive bonus is to fish for it — which requires the Fishing Rod, bait, Luck, and willingness to fight something large enough to inflict Paralysis.

---

## III. Luck — The Seventh Stat as the Fishing Economy's Central Variable

### A. Formula

```
Luck = ⌈(STR × DEX × CON × INT × WIS × CHA)^(1/6)⌉
Luck Modifier = floor((Luck − 10) / 2)
```

Luck is computed on demand by `getLuck()`. It is never stored in `S_story`. It is derived — a read-only composite of the six ability scores. Neglecting any one stat collapses Luck disproportionately (geometric mean's punishment for outliers).

### B. Complete Fishing Integration

| Phase | Luck Mod Role |
|-------|--------------|
| Bait zone DC | Subtracted: effective DC = zoneDC − Luck Mod |
| Bait catch roll | Added: d20 + Luck Mod vs bait fish AC |
| Predator type roll | Added: 2d20 + baitBonus + Luck Mod |
| Predator hit roll | Added: d20 + atkBonus + Luck Mod vs fish AC |
| Death save (fishing) | Added: d20 + Luck Mod |
| Weapon drop quality | Added: floor(ac/4) + max(0, Luck Mod) |
| Tournament tiebreaker | Higher Luck Mod wins; coin flip on equal |

Luck is the common factor in every fishing roll. A character who invested across all six stats is not just stronger — they are luckier, and in this sub-game, luckier is the only currency that matters.

---

## IV. Prompt Analysis — How the Design Was Built

### A. Overview

The fishing and bait system was not designed in a single prompt. It was built through a structured sequence of conversational turns, each of a recognizable type. This section catalogs those types, with examples from the session, and analyzes how the directive in `index.md` shaped their interpretation.

The session produced Sections XII-A through XII-Y across multiple "continue" cycles and three large content-dump prompts. The total planning output is approximately 300 lines of structured specification in `plan.md`.

### B. Command Taxonomy

#### Type 1 — The Increment Trigger: `"continue"`

The simplest command. Advances the assistant to the next queued item in the sync pass or planning queue. Requires no content. Relies entirely on prior context and the established queue.

```
User: continue
System: [executes next item in SP2 queue]
User: continue
System: [executes the item after that]
```

This type accounted for approximately 60% of user turns in this session. It is the heartbeat of the protocol — a clock tick that advances the queue one position. Its power lies in what it does NOT require the user to say: they do not re-specify the task, re-explain the context, or remind the assistant of the queue. The plan.md queue carries that state.

**Directive implication:** The increment trigger only works because plan.md contains an explicit numbered queue with status columns. The directive mandates this structure. Without the queue, "continue" is ambiguous. With it, "continue" is unambiguous.

#### Type 2 — The Data Dump: Raw Lists → Specification

The user provided two raw lists of bait fish species (20 freshwater, 20 ocean) and directed their conversion:

```
User: add to the plan.md more bait fish... Here is a list of 20 common 
      freshwater baitfish species: [20 species names] here is a list of 
      20 common ocean baitfish species: [20 species names]
```

No stats were provided. No tier structure was specified. The conversion task was: take naturalist taxonomy, impose game-mechanical structure (AC, HP, XP, tier, bonus), assign zones, and write it to plan.md as a spec table.

This command type relies on the assistant's ability to synthesize domain knowledge (D&D 5e creature stat conventions) with the project's existing patterns (the existing predator fish stat table in `lab-report-fish-with-dnd.md`) to produce consistent output.

**Directive implication:** The directive says "Adding to the project = Planning." The data dump was correctly routed to `plan.md` as a new PLANNED section (XII-R), not to `roll2hit-v3.html`. The directive prevented premature implementation.

#### Type 3 — The Constraint Declaration

The user declared global constraints that required changes to existing systems:

```
User: Stop all magic drops from enemies, they all drop used weapons, 
      with bad stats. Change the range from 0 to +3 to -3 to 0 by 
      default on monster drops.
```

This is a global mechanical constraint, not a feature addition. It changes the behavior of an existing function (`_rollMonsterWeaponDrop()`). The constraint was:
1. Named precisely ("0 to +3" → "−3 to 0")
2. Given rationale (fishing should be the only magic gear source)
3. Scoped explicitly ("by default on monster drops")

The correct response was to document this as a planned change to an existing function (XII-V), not to implement it. The directive enforced this.

**Directive implication:** Even destructive changes (nerfing an existing system) go through the Planning phase first. The constraint is documented in XII-V with the exact one-line code change ready for implementation. The change is specified; it is not yet made.

#### Type 4 — The Formula Definition

The user defined the Luck stat through a mathematical description:

```
User: create the concept of luck. It is the general geometric average 
      of all the skills... we multiply and take the 6th root... 
      It is the Ceiling Integer, no decimals... Luck Modifier +1 every 
      two levels over 10.
```

This is a formula stated in plain language. The conversion task was: extract the mathematical definition (`Math.ceil(Math.pow(str*dex*con*int*wis*cha, 1/6))`), handle edge cases (product ≤ 0), and document the modifier table. The formula was written into Section XIII of `plan.md` and stubbed into `mechanics.md` and `world.md`.

**Directive implication:** The formula was added as a PLANNED stub across three docs. The `getLuck()` function was specified in plan.md but not written into HTML.

#### Type 5 — The Isolation Directive

```
User: Keep these isolated yet combined. Two mechanics that work with 
      each other.
```

This is an architectural constraint, not a content directive. It specifies the relationship between two sub-systems (bait fishing and predator fishing) without specifying their implementation. The resolution: `BAIT_FISH_POOL` is separate from `MONSTER_POOL`; bait fish never appear in corridors; the Fishing Rod is only active at `isFishingLake:true` nodes; fishing XP still flows into the same level-up system.

The isolation is mechanical. The combination is economic: the bait → predator → magic weapon pipeline is the integration point.

#### Type 6 — The Structural Command

```
User: make sure the directive is top of the index.md. Restate the 
      directive in the index.md to understand that adding to the 
      project means planning. Implementing means writing code and 
      syncing markdown.
```

This command restructured the index document itself. It is a meta-command — it operates on the project's governance layer, not on game content. The output was a new top-level section in `index.md` with three subsections: Adding vs Implementing, the Two-Way Sync Rule, and Session Format.

**Directive implication:** The structural command produced the directive that now governs all future work. It was itself a planning act — writing the rules for how planning will be done.

#### Type 7 — The Synthesis Command (This Report)

```
User: recap via a academic university computer science geek professor 
      IEEE lab-report titled with super summary of fishing and bait... 
      Focus on the index and the new directive. Then do a big dump 
      reviewing my prompts to you...
```

This command produces a document that is simultaneously:
- A technical summary (the fishing system)
- A process document (the directive)
- A meta-analysis (the prompts themselves)

It is the most complex command type because it requires the assistant to be both the analyst and the subject of analysis. The output (this document) is a lab report about its own creation process.

### C. The Prompting Pattern — Observed Structure

Across the session, the user's prompts followed a consistent structural pattern:

```
[ANCHOR]  → What existing context to operate within
[ACTION]  → What to do (add / change / define / recap)
[CONTENT] → The raw material (species lists, formulas, constraints)
[SCOPE]   → What to touch and what not to ("write only to plan.md")
[FORMAT]  → The output shape ("lab-report", "table", "flowchart")
```

Not every prompt contained all five elements. The increment trigger ("continue") contains only an implicit ANCHOR (the current queue position) and an implicit ACTION (advance). The data dump prompt contained ANCHOR, ACTION, CONTENT, and SCOPE but left FORMAT implicit (the assistant inferred a spec table from the project's existing patterns).

The directive in `index.md` serves as a permanent SCOPE definition that applies to every prompt, reducing the amount the user must specify per turn.

### D. What "Planning the Plan" Means

The session established a recursive structure:

```
Level 0 — The Game:  roll2hit-v3.html (what gets implemented)
Level 1 — The Plan:  plan.md (what will be implemented, in structured spec form)
Level 2 — The Prompt: conversational input (what tells the plan what to contain)
Level 3 — The Directive: index.md §Project Directive (what tells the prompt how to operate)
```

The user's question — "this is about planning the plan about the writeup into plan.md being written into a prompt following the directive mentioned in index.md" — describes Level 2 operating on Level 1 according to the rules of Level 3 to eventually produce Level 0.

Each "continue" tick, each data dump, each formula definition was Level 2 input that built Level 1 content. The directive at Level 3 ensured that Level 1 content is always in a form that can safely be promoted to Level 0 without chaos.

The fishing system, as it stands, is a complete Level 1 artifact: 40 implementation steps, 20 bait fish species with full stats, 20 predator ranks with condition tables, a magic weapon formula, a global nerf specification, and a Luck integration table. All that remains is the Level 0 promotion — writing it to HTML and syncing all markdown.

---

## V. Integration Considerations — The Full Stack

### A. What Fishing Touches (and What It Doesn't)

The fishing sub-system was designed with deliberate isolation:

| System | Affected | Notes |
|--------|---------|-------|
| `MONSTER_POOL` | No (read) | Predator fish already in pool; bait fish go to separate `BAIT_FISH_POOL` |
| `_rollMonsterWeaponDrop()` | Yes | One-line change: bonus floor shifts from 0 to −3 |
| `_S_DEFAULTS()` | Yes | 4 new fields: `tacklebox`, `tackleboxZoneUnlocks`, `fishingCatchLog`, `baitFishingActive` |
| `storyFishing()` | Yes | Major rewrite: route to bait-fishing or predator-fishing based on player action |
| `QUEST_DB` | Yes | Q-FISH-00 through Q-FISH-05, Q-TOUR-01 through Q-TOUR-06 |
| `NPC_DIALOGUES` | Partial | The Fisherman + 5 tournament NPCs at YC; tournament dialogue trees |
| `getLuck()` | New function | No storage; computed on demand; affects 7 fishing roll points |
| `WEAPON_ITEMS` | Read | Random weapon type for magic drop; degraded prefix added by drop function |
| Battle Mode (`S`) | No | Fishing runs in Story Mode overlay; never touches `S` directly |
| Corridor encounters | No | `BAIT_FISH_POOL` deliberately excluded from `WORLD_DB` |

### B. Leveling Through Fishing

XP from bait fish (5–25 per catch) and predator fish (AC × maxHP, same formula as regular combat) flows through the standard `_checkLevelUp()` path unchanged. A player who fishes exclusively from Level 1 can reach Level 20. The gear reward path (magic weapons from predators) replaces the corridor loot path, not the XP path.

This creates a valid alternative play style: a pacifist fisher who avoids all corridor combat, levels through fishing, and equips magic weapons from predator fish. The system supports this without special cases — it falls naturally from the existing XP formula applied to fishing encounters.

### C. The Luck Feedback Loop

Leveling from fishing improves ability scores (through ASI at Levels 4, 6, 8, 12, 14, 16, 19), which improves Luck (geometric mean of all six scores), which improves all fishing rolls, which yields higher-rank predators, which drops better weapons, which enables more successful fishing.

This feedback loop is bounded by Level 20 and the Rank 20 predator ceiling. It is not exploitable beyond the intended endgame state (Luck ≈ 17, Mod +3, consistently fishing Rank 20 with Tier 5 bait).

---

## VI. Conclusion

### A. The Fishing System as a Design Achievement

The Yugurt Lake Fishing and Bait Sub-System represents a significant mechanical addition to `roll2hit-v3.html` — one that:
1. Provides an alternative path to Level 20 through a skill-gated mini-game
2. Replaces a degenerate loot mechanic (random magic drops from corridors) with a meaningful one
3. Integrates the Luck stat across 7 distinct roll points, making it the central variable of the sub-game
4. Creates a three-zone biome with natural progression gating
5. Isolates fishing mechanically (Fishing Rod only at `isFishingLake` nodes) while combining it economically (XP, gear, and level-up all shared)

None of this code exists yet. All of it is specified.

### B. The Directive as a Design Achievement

The `index.md` directive — "Adding = Planning; Implementing = Code + Sync" — is itself the session's most consequential output. It defines a typed workflow that prevents the two failure modes (orphaned implementation, orphaned documentation) that plagued earlier layers. Every future session begins by reading it.

The directive was produced by a structural command (Type 6), added to the governance layer of the project (not to game content), and is now enforced by persistent memory. It will apply to the Cat Arc, the Torment Nexus, and every layer beyond Layer 48.

### C. The Plan as a Prompt

`plan.md` is 2,500+ lines of structured game specification. It was built, section by section, through a sequence of typed conversational commands: increment triggers, data dumps, constraint declarations, formula definitions, isolation directives, and synthesis commands. The directive in `index.md` is the parser that makes those commands unambiguous.

The fishing system is a prompt. It is written in the syntax of `plan.md`. When a future session opens that file and reads Section XII, it is reading a set of instructions that are complete enough to execute directly into `roll2hit-v3.html` without further clarification. That is what a plan is supposed to be. That is what this one is.

The lake is ready. The fish are waiting. The sign still says YUGURT.

---

## Appendix A — Bait Fish Complete Reference

| # | Species | Slug | Tier | Bonus | AC | HP | XP | Zone |
|---|---------|------|------|-------|----|----|-----|------|
| 1 | Fathead Minnow | `fathead_minnow` | 1 | +1 | 3 | 2 | 5 | Shore |
| 2 | Bluntnose Minnow | `bluntnose_minnow` | 1 | +1 | 3 | 2 | 5 | Shore |
| 3 | Bridle Shiner | `bridle_shiner` | 1 | +1 | 4 | 3 | 5 | Shore |
| 4 | Swallowtail Shiner | `swallowtail_shiner` | 1 | +1 | 4 | 3 | 5 | Shore |
| 5 | Golden Shiner | `golden_shiner` | 2 | +2 | 4 | 4 | 10 | Shore |
| 6 | Comely Shiner | `comely_shiner` | 2 | +2 | 5 | 4 | 10 | Shore |
| 7 | Satinfin Shiner | `satinfin_shiner` | 2 | +2 | 5 | 5 | 10 | Shore |
| 8 | Ironcolor Shiner | `ironcolor_shiner` | 2 | +2 | 5 | 5 | 10 | Shore |
| 9 | Creek Chub | `creek_chub` | 3 | +3 | 5 | 6 | 15 | Reeds |
| 10 | Common Shiner | `common_shiner` | 3 | +3 | 6 | 6 | 15 | Reeds |
| 11 | Spotfin Shiner | `spotfin_shiner` | 3 | +3 | 6 | 7 | 15 | Reeds |
| 12 | Spottail Shiner | `spottail_shiner` | 3 | +3 | 6 | 7 | 15 | Reeds |
| 13 | Gizzard Shad | `gizzard_shad` | 4 | +4 | 6 | 8 | 20 | Reeds |
| 14 | Alewife (landlocked) | `alewife` | 4 | +4 | 7 | 9 | 20 | Reeds |
| 15 | White Sucker | `white_sucker` | 4 | +4 | 7 | 9 | 20 | Reeds |
| 16 | Banded Killifish | `banded_killifish` | 4 | +4 | 7 | 10 | 20 | Reeds |
| 17 | Tadpole Madtom | `tadpole_madtom` | 5 | +5 | 7 | 11 | 25 | Deep |
| 18 | Margined Madtom | `margined_madtom` | 5 | +5 | 8 | 11 | 25 | Deep |
| 19 | Mummichog | `mummichog` | 5 | +5 | 8 | 12 | 25 | Deep |
| 20 | Blacknose Dace | `blacknose_dace` | 5 | +5 | 8 | 12 | 25 | Deep |

---

## Appendix B — Luck Modifier Reference (Default Starting Scores)

Starting scores: STR:16, DEX:12, CON:14, INT:10, WIS:12, CHA:8

```
Luck = ⌈(16 × 12 × 14 × 10 × 12 × 8)^(1/6)⌉
     = ⌈(25,804,800)^(1/6)⌉
     = ⌈11.54⌉
     = 12

Luck Modifier = floor((12 − 10) / 2) = +1
```

At Level 1, the player begins fishing with Luck Mod +1. Every ASI that improves any ability score improves Luck. A Level 20 character with all ASIs allocated optimally achieves Luck ≈ 17, Mod +3, which averages Rank 20 predators with Tier 5 bait. The sub-game is balanced to this ceiling.

---

## Appendix C — Implementation Checklist Summary (XII-Y Steps 27–40)

| # | Task | Function/Const | Status |
|---|------|---------------|--------|
| 27 | Add `BAIT_FISH_POOL` const | new const | ⚠️ PLANNED |
| 28 | Add 4 new fields to `_S_DEFAULTS()` | `_S_DEFAULTS()` | ⚠️ PLANNED |
| 29 | Bait fishing sub-loop (zone → DC → catch) | `storyFishing()` | ⚠️ PLANNED |
| 30 | Zone unlock logic | `_checkTackleboxZoneUnlocks()` | ⚠️ PLANNED |
| 31 | Revised type roll formula | `storyFishing()` | ⚠️ PLANNED |
| 32 | Condition table by predator rank | `_overlayPlayerAttack()` | ⚠️ PLANNED |
| 33 | `_fishingMagicWeaponDrop(fishAc)` | new function | ⚠️ PLANNED |
| 34 | Degraded weapon prefix array | `_rollMonsterWeaponDrop()` | ⚠️ PLANNED |
| 35 | Monster drop nerf (−3 to 0) | `_rollMonsterWeaponDrop()` | ⚠️ PLANNED |
| 36 | Tackle box panel in fishing modal | `storyFishing()` DOM | ⚠️ PLANNED |
| 37 | Zone selector UI | `storyFishing()` DOM | ⚠️ PLANNED |
| 38 | Catch log display | `storyFishing()` DOM | ⚠️ PLANNED |
| 39 | Zone unlock auto-check | `_checkTackleboxZoneUnlocks()` | ⚠️ PLANNED |
| 40 | Route bait vs predator in `storyFishing()` | `storyFishing()` | ⚠️ PLANNED |

---

*End of report.*

**MIT License — roll2hit.com — Copyright (c) 2026 — Free to use, modify, and share.**
