# Roll2Hit — The Shattered Codex: Document Overview
**Project:** roll2hit-v3.html — single-file combat tracker + narrative game engine  
**Status:** Layers 0–45 implemented. 14,377 lines · 76 nodes · 370 monsters. Last updated 2026-05-24.

---

## Project Directive — How This Project Works

> Read this section at the start of every session. It overrides default behavior.

### Adding vs. Implementing

**Adding to the project = Planning.**  
Write a new section to `plan.md`. Assign a Layer number. Describe the feature as a PLANNED stub. Mark it `⚠️ PLANNED`. Add PLANNED stubs to the appropriate markdown docs (`story.md`, `world.md`, `maps.md`). Do **not** touch `roll2hit-v3.html`. Nothing is "added" until it is planned in writing.

**Implementing = Writing code + syncing markdown.**  
Write JavaScript/HTML to `roll2hit-v3.html`. Then sync every markdown doc that describes what you changed. Both steps must happen. A code change without a doc sync is incomplete. A doc sync without a code change is planning, not implementing.

### Two-Way Sync Rule

Every item in the markdown docs must trace back to `roll2hit-v3.html` (source of truth).  
Everything in `roll2hit-v3.html` must have a home doc.  
On each sync pass: verify world map consistency across `maps.md`, `story.md`, `world.md`, `spec-world.md`, and `spec-engine.md`.

### Lab Report Rule

Write a new `lab-report-<title>.md` when any of the following is true:

| Trigger | Examples |
|---------|---------|
| Major collection added or redesigned | New monster group, terrain cluster, NPC faction, item economy |
| Large redesign touching multiple systems | Weapon drop overhaul, Luck Stat, fishing bait sub-system |
| New narrative theme or arc | New quest chain spanning 3+ nodes, new named faction, new NPC arc |
| Design review before implementation | IEEE-format spec locking data shapes and flow before any HTML edit |
| Session postmortem with non-obvious decisions | Choices that won't be recoverable from code or core docs alone |

Do **not** write a lab report for: a single monster/quest addition (sync core docs), a value correction (add implementation note to existing report), or small additions that fit in an existing doc section.

When a lab report is written, **git add and commit it with the related doc changes in the same commit.** A lab report that isn't committed is a planning note, not a record.

### Session Format

One increment per "continue." Say "continue" to advance. Each increment ends with a confirmation before the next begins.

### Cross-Reference

Keep a running cross-reference table in `plan.md` (Section XI) so future passes can find where each item lives.

---

## The Game in One Paragraph

Roll2Hit is a single-file HTML application with no external dependencies. It runs as a combat dice tracker (Battle Mode) and a 76-node narrative adventure game (Story Mode). The two modes share a single mutable state object (`S_story`). The narrative game — *The Shattered Codex* — is a solo journey across 8 acts and 76 locations to collect 7 Codex Shards and seal the Void before Day 49. Combat uses the existing dice engine; story progression uses a 3×3 d-pad grid with directional navigation, stalk/wait/rest/NPC corner buttons, a Boyscout Token rest mechanic (dice-based sleep healing with first-night double rolls and Necklace Token collectibles), an inventory system, quest tracking, gate locks, a vendor economy, save/load, and a Void Tide survival clock. The player is a Level 1–20 Fighter Champion starting with a Pointy Stick and Flint Dagger, earning tattoos at each level-up visible in the interleaved character sheet.

---

## Document Index

> **How to use this index:**  
> — **Core Reference**: open in every coding session  
> — **Spec / Plan**: consult when implementing a specific layer  
> — **Story / World**: consult when editing node text, NPC dialogue, or lore  
> — **Lab Report — Implemented**: archive & rationale; safe to skip in coding sessions  
> — **Lab Report — Design Spec**: future work; not yet in code  

---

### Core Reference

#### `index.md` — This File
**Purpose:** Central index and session review plan.  
**Scope:** Cross-document consistency guide. Does not contain game rules or code specs.  
**Update frequency:** Every session.

---

#### `mechanics.md` — Player-Facing Rules Reference
**Purpose:** Operational guide for all implemented game mechanics: combat flow, action economy (1.5 AP), weapon drops, vendor system, 4-tier healing potions, Hearth Home, Transmort Scroll, sidequests, short rests, condition costs, shields, spell scrolls, Flashbang, safe flee/wimper, defeat screens, starting kit.  
**Scope:** Battle Mode + Story Mode rules. Primary player and DM reference.  
**Status:** ✅ REVIEWED 2026-05-22. Updated with Layers 21–45: Fighter Champion system, NPC favorability, Epic Battlegrounds, NG+, d100 loot, S-suggestion systems. 14,377-line codebase.

---

#### `combat.md` — Combat System Reference
**Purpose:** Quick-reference for the battle engine flow — D-pad entry, pre-battle screen, initiative, overlay, Layers 11–17 (battle), 21 (level-up), 23 (notoriety), 36–37 (features, Boyscout).  
**Scope:** Battle Mode only. Synced to ~10,200-line codebase as of 2026-05-21.  
**Status:** ✅ Reference document. Accurate for Layers 0–37. Fighter features, Boyscout Token, d-pad grid all covered.

---

### Spec & Plan Documents *(coding guides — consult when implementing)*

#### `plan.md` — Layer 9–45 Implementation Plans
**Purpose:** Full implementation plans and archives for all layers. Layers 0–45 complete. No pending layers remain.  
**Scope:** Layers 9–45. Single source of truth for what is planned and what is done.  
**Status:** ✅ Layers 0–45 all marked ✅. Updated 2026-05-22.

---

#### `spec-engine.md` — Narrative Engine Design Specification
**Purpose:** Design blueprint for the full Story Mode layer: two-mode engine, schemas (NODE_MAP, QUEST_DB, CONDITION_ITEMS), state machine, navigation, loot/quest/battle interface, and the 8-layer implementation plan plus Layers 9–20 addendum.  
**Scope:** Layers 1–20. Primary design spec for the game engine.  
**Status:** ✅ REVIEWED. All Layers 0–20 marked IMPLEMENTED.

---

#### `spec-corridors.md` — Layer 9 Function-Level Spec
**Purpose:** Function signatures, data structure definitions, and pseudo-code for every new function in Layer 9 (circuit corridors, junction nodes, Hunt/Warp dialog, fog-of-war, active path highlight).  
**Scope:** Layer 9 only.  
**Status:** ✅ COMPLETE. All L9-A through L9-H marked ✅.

---

#### `spec-world.md` — Phase 3 World Engine Architecture
**Purpose:** Architecture spec for Phase 3: terrain-stratified monster catalog, cascading dropdown world selector UI. Phase 3 targets: 329 monsters across 42 geographic terrains. Current state: 370 monsters across 66 terrains (46 base + 20 epic) — see `monsters.md` for live counts.  
**Scope:** `WORLD_DB` + `MONSTER_POOL` data layer.  
**Status:** ✅ REVIEWED. Count corrected 120→329, terrains 16→42. Phase 3 snapshot — live counts in `monsters.md`.

---

#### `spec-combat.md` — Base Combat Tracker Plan *(historical)*
**Purpose:** Original Phase 0/Phase 2 specification: 4-quadrant → 3-column arena layout, advantage/disadvantage model, history cards, config panel. Foundation that all later layers build on.  
**Scope:** Battle Mode only. Historical document.  
**Status:** ✅ All steps S0–S11 complete. No review needed.

---

#### `spec-migration.md` — IEEE Technical Migration Report
**Purpose:** Formal academic-style post-implementation report documenting the architectural migration from standalone combat tracker to narrative game engine. Covers Layers 0–8 in depth; Layers 5–8 as implemented summaries. Design decisions, state machine diagrams, control flow analysis, validation test paths.  
**Scope:** Layers 0–8.  
**Status:** ✅ REVIEWED v2.0. Sections IV-B, IV-D, VII-C, X, conclusion, and footer updated.

---

### Story, World & Geography *(consult when editing nodes, NPCs, or lore)*

#### `maps.md` — World Map & Node Network
**Purpose:** Geographic reference: 26×16 grid system, all 76 node codes with coordinates, full N/E/S/W connection network, 8 inn nodes, locked passages, portal node, four towns, and GATE LOCKS table. Includes: CIRCUIT CORRIDORS section (CORRIDOR_CELLS, active path highlight), DF/HM/GL defi_land cluster (nodes 72–74), all 20 Epic Battleground dead-ends (EF–EW, nodes 52–71), and CO (The Convergence, node 76).  
**Scope:** Navigation and geography only.  
**Status:** ✅ REVIEWED 2026-05-24. Junction nodes J1–J7 and MT added. Gate locks verified against `GATE_LOCKS` array in code. 76-node count confirmed.

---

#### `story.md` — Full Campaign Narrative
**Purpose:** Complete node-by-node story across 8 acts; all 20 Epic Battleground quest dialogues (Q52–Q71, 5 fields each); NPC dialogue profiles; endings (Covenant Keeper, Groundhog Day, Cursed Seal); NG+ system. Source material for node text, NPC dialogue, battle triggers, item discovery scenes, and condition item introductions.  
**Scope:** Narrative content. NODE_MAP text fields in code are drawn from this document.  
**Status:** ✅ All 76 nodes covered. All 8 acts complete. EB dialogues Q52–Q71 added 2026-05-24.  
**Note:** Node text in code is abbreviated vs. full prose here — expected.

---

#### `world.md` — DM Manual
**Purpose:** Backstage campaign manual: world history, four ruling factions, 7 epic NPC profiles with dialogue hooks, 13 condition items (mechanics + story introduction), updated Survival Pressure table (exhaustion→voidPressure, void tide events, defeat conditions at 10), and quest motivation architecture.  
**Scope:** Thematic and NPC/condition reference. Not a rules document.  
**Status:** ✅ REVIEWED. Survival Pressure rewritten with actual mechanics through Layer 20.

---

#### `monsters.md` — Monster Reference Table
**Purpose:** Complete reference table of 370 monsters by challenge tier (Trivial → Deadly) and source pool. Stat blocks: AC, HP, ATK, damage dice. Includes Yugurt Lake fish pool (fish_01–fish_20) and DeFi Land creatures (9 entries including WAGMI).  
**Scope:** Monster data only.  
**Status:** ✅ REVIEWED 2026-05-24. All 370 keys verified against MONSTER_POOL. All 8 source pools documented.

---

### Content Files *(raw source material — not coding references)*

#### `froberger-journal-all-entries.txt` — All 41 Journal Entries
**Purpose:** Plain-text source for the complete `FROBERGER_JOURNAL` const — all 41 entries verbatim: 10 read-aloud entries (Entry 1 at CI, Entries 2–9 at act-opening nodes, Entry 10 at CO) and 31 collectible entries found at specific nodes throughout the world. Canonical text for every journal entry; use as reference when editing `FROBERGER_JOURNAL` in HTML.  
**Status:** ✅ Verified 2026-05-24 (S23) — all 41 entries match HTML const exactly.

---

### UX & Walkthroughs

#### `ux-first-battles.md` — First Battles & First Level-Up
**Purpose:** Player experience analysis of starting state (Level 1, 30 HP, Pointy Stick, 150gp), first safe battles in Birka Slums, Boyscout Token collectible, safe flee via wimper→bonus, and first level-up.  
**Scope:** Post-Layer 37 UX walkthrough. Table of all 10 UX fixes applied.  
**Status:** ✅ Written 2026-05-21. Accurate for Layers 0–37.

---

### Lab Reports — Implemented *(retrospective/archive — reference only, safe to skip in coding sessions)*

#### `lab-report-plan-cleanup-v13.md` — Layers 9–13 Spec Archive
**Purpose:** Archives 1,223 lines of implementation spec from `plan.md` after Layers 9–13 completion. Change record, spec archive, and verification manifest that all specs are reflected in live code (7,465 lines at time of writing).

#### `lab-report-plan-cleanup-v17.md` — Layers 14–17 Spec Archive
**Purpose:** Archives 1,358 lines of compacted specs from Layers 14–17. Verifies all features against `roll2hit-v3.html` (8,110 lines at time of writing). Includes 6 post-implementation bug corrections.

#### `lab-report-prompt-migration-arena-to-prototype.md` — Arena → Prototype Retrospective
**Purpose:** Grand retrospective of Roll2Hit's transformation from dice roller to 42-node adventure. Introduces "specification gravity" — interlocking docs that prevent feature bloat. Layers 0–13 timeline.

#### `lab-report-circuit-map-theory.md` — CS Theory: Corridor System
**Purpose:** Academic/philosophical treatment of the sparse node mesh model, junction concept, TSP framing, data architecture, and full Hunt/Warp execution traces. Reference — not a coding guide.

#### `lab-report-battleground-circuit-path-quest.md` — Battleground Architecture
**Purpose:** IEEE-style report on the discrete 42-node terrain world, Stalk mechanics, quest-coupled guaranteed encounters, XP methodology. Describes the "lost in a field" UX solution.

#### `lab-report-drop-rates-balance-and-health.md` — Drop Rate & Health Economy
**Purpose:** Drop rate formula (`reward = floor(0.1 × AC × maxHP)`), health economy balancing, rest mechanics, Necklace of Knowledge, Cooperative DM Principle. Ensures net-positive resource flow for engaged play.

#### `lab-report-leveling-flashbang-condition-economy.md` — Layer 18: Leveling & Condition Economy
**Purpose:** Ten-level progression (XP_LEVELS, `_checkLevelUp`, rewards), Flashbang item, CONDITION_GOLD ×100 repricing, 0.5-action bonus phase. Layer 18 implemented and verified (8,236 lines at time of writing).

#### `lab-report-veldris-beginner-arc.md` — Birka Beginner Arc *(Layer 41)*
**Purpose:** Act I Birka arc with six quests across five NPCs (Yael, Brynn, Quill, Pachelbel, Weckmann) using Tales Arcane template. Emotional attachment to Birka before main quest becomes meaningful.  
**Status:** ✅ Done — Layer 41 implemented. All L41 steps ✅. VELDRIS_NPC_PROFILES, npcFavorability, 7 Birka quests, Rough Whiskey, Yael escort, drunk pit fight, Sweelinck Birka variant live in code.

#### `lab-report-npc-dialogue-system.md` — 4-State Dialogue System *(Layer 42)*
**Purpose:** Four dialogue states per NPC (Impartial → Quest-Active → Friendly → Dear Friend). Occupation as philosophical lens. Friendship deepens specificity. Groundhog Day epilogue mechanic.  
**Status:** ✅ Done — Layer 42 implemented. All L42 steps ✅. NPC_DIALOGUES, _getNPCDialogue(), _missionComplete(), Covenant Keeper/Groundhog Day endings live in code.

#### `lab-report-architecture-full.md` — Full Architectural Review *(IEEE format)*
**Purpose:** Complete CS academic-style architectural review of the entire roll2hit-v3.html codebase. Every function named. All subsystems analyzed with execution flow charts: Battle Mode engine, Story Mode navigation, combat bridge, loot pipeline, quest/narrative chain, NPC dialogue priority, stalk/corridor system, rest/save/persistence, DOM render architecture, mechanics deep dive (action economy, Fighter Champion, notoriety, Void Tide, curse score, NG+).  
**Status:** ✅ Written 2026-05-22, updated 2026-05-24 — full 14,377-line codebase audit.

---

#### `lab-report-friendships-with-magic.md` — Session Postmortem: Eight Hours in the Loop
**Purpose:** Post-implementation audit for Layers 41–42, plus documentation of 5 new systems: waypoint exit highlighting (green BFS row), Hunt Mode persistent toggle (replaces corridor modal), EB negotiation CHA check DC 17 with gut-punch fail, guaranteed monster weapon drops (Finders Keepers, auto-equip), roll line shown on both pass and fail. Contains the project's philosophical thesis — "Friendships with Magic."  
**Status:** ✅ Written 2026-05-22 — accurate for 12,637-line codebase, Layers 0–42.

---

#### `lab-report-fish-with-dnd.md` — Yugurt Lake & Fishing System *(Layer 37)*
**Purpose:** Predator fish encounter system — Yugurt Lake as a combat-dressed-as-fishing mechanic. 20 Rank fish (Needle Minnow AC5/HP4 through Yugurt's Dread AC20/HP220/4d12+9), 2d20 cast roll, guaranteed fight at every rank, no patience mechanic. Full stat block table. Mechanical design rationale: the rod is bait; the fish are what answer.  
**Status:** ✅ Implemented — `storyFishing()`, `_startFishBattle()`, Fishing Rod item, Hooked condition, and fish_01–fish_20 MONSTER_POOL entries all live in HTML.

---

#### `lab-report-fishing-bait-prompting.md` — Fishing & Bait Overhaul Design *(Layer 47 PLANNED)*
**Purpose:** IEEE-format academic lab report documenting the complete Yugurt Lake Fishing & Bait Sub-System design (plan.md §XII-A through §XII-Y). Covers: 20 freshwater bait fish species (5 tiers), Tackle Box mechanic, 3-zone biome (Shore/Reeds/Deep), predator attraction formula, predator condition table by rank, magic weapon drop formula, global monster drop nerf (−3 to 0), Luck Modifier integration across all 7 fishing roll points. Also documents the `index.md` Project Directive and performs a full prompt taxonomy analysis of the session that produced this design (6 command types: increment trigger, data dump, constraint declaration, formula definition, isolation directive, synthesis command).  
**Status:** ⚠️ PLANNED — design complete in plan.md §XII. No HTML implementation yet. This report is the design rationale and planning artifact for Layer 47.

---

#### `lab-report-timeline-history-completed.md` — Development Timeline & History *(Archive)*
**Purpose:** Complete extracted history of Roll2Hit's implementation: 46 named development layers (Layers 0–45), 32 global constants, 55 runtime state fields, 11 archived lab reports, 60 fulfilled feature suggestions, and the full Baroque organ composer naming migration. Source of truth for "how we got here."  
**Status:** ✅ Archive — extracted from plan.md 2026-05-22. All layers complete. Not a coding reference; read for historical context only.

---

### Lab Reports — Design Specs *(not yet in code — future layers)*

> **These files describe planned features.** They are safe to read for design intent but do NOT reflect the current codebase. Before implementing any of these, verify the relevant section of `plan.md` and `spec-engine.md` for layer assignment.

#### `lab-report-world-creator.md` — Fork, Extend, and Quest -1 *(Layer 49 PLANNED — not yet written)*
**Purpose:** Full walkthrough of the World Creator Wizard: adding one monster, one quest, one mission bit using grep/sed with count verification. Shell session transcript showing before/insert/after/sync. Philosophy: the player who opens the console is the next developer. MIT License as game mechanic. Quest -1: The Open Door (triggers at Level 20).  
**Status:** ⚠️ PLANNED — design complete in `plan.md` §XIV. Lab report not yet written. Quest -1 text is in `plan.md` §XIV-B; shell tooling is in §XIV-D; story/mechanics integration is in §XIV-F.

---

#### `lab-report-loot-drop-weapon-economy.md` — Loot System Redesign *(proposal)*
**Purpose:** Identifies four issues in current loot: XP thresholds unattainable (~680k max unreachable), no unified drop table, unenforced magic tier gates, incomplete item categories. Proposes compressed XP scaling, d100 loot table, tier enforcement, corrected offhand slot rules.  
**Status:** ⚠️ DESIGN PROPOSAL — not yet implemented. Creates known conflicts (see below).

#### `lab-report-epic-battlegrounds.md` — Epic Battlegrounds *(20 new nodes)*
**Purpose:** 20 dead-end nodes for outdoor terrain bosses paired with NPC quests. Each terrain type gains one Epic Battleground: named NPC, warning, negotiation phase, return quest.

#### `lab-report-endings-and-echoes.md` — Covenant Arc Endings *(Layer 43)*
**Purpose:** Ending sequence mechanics: Covenant Ceremony animation, dynamic NPC epilogue sequences, Cursed Seal echo (Groundhog Day mechanic), "who did you help" consequence tracking.  
**Status:** ✅ Written 2026-05-22 — Layer 43 complete. All L43-A through L43-W implemented. Source for all const content and NG+ systems.

#### `lab-report-game-story-codex-of-conquest.md` — Codex of Conquest Narrative Arc *(future)*
**Purpose:** D&D 5-step quest template for Froberger's arc. Pinker's "Curse of Knowledge" as both theme and structure. Player choices about helping NPCs define the ending.

#### `lab-report-story-codoex-curse-of-knowedge.md` — Pinker Framework Application *(writing guide)*
**Purpose:** Applies Pinker's writing principles (curse of knowledge, mental imagery, example-generalization pendulum, empathy) to terrain descriptions and character dialogue for emotional depth.

#### `lab-report-living-world.md` — Off-Screen World Progression *(Layer 44)*
**Purpose:** World state progression triggered by story milestones (not real-time). NPCs persist independently of player action. Gigault as an example NPC who exists but is never interactable.  
**Status:** ✅ Done — Layer 44 implemented. Gigault stall, world progression events, minimap warmth, NPC farewells, Act III desaturation, Brynn maintenance/ledger, Deacon's Code, Void's First Sign, final map render all live.

#### `lab-report-web-of-connections.md` — NPC Cross-Relationships *(Layer 45)*
**Purpose:** NPCs have pre-existing relationships, debts, and histories with each other and with Froberger. Players discover connections gradually — the world predates their arrival.  
**Status:** ✅ Done — Layer 45 implemented. FROBERGER_TRACES (6 NPCs), NPC_CROSS_REFS (17 lines across 6 NPCs), Nivers ("Evening."), Yael patrol nodes, Weckmann training log, Room 6, cross-item triggers all live.

---

## Town Cross-Reference

> All four towns use their **real names** in every doc, consistent with `roll2hit-v3.html` `NODE_MAP` labels and `ACT_NAMES`. No aliases.

| Town | Act | Inn node | Key terrains | Ruling faction | Epic NPC |
|---|---|---|---|---|---|
| **Birka** | I & VIII | `IN` — The First Inn | city, city_slums, tavern, bar, crypt, cyberpunk_streets | High Council of Birka | Commander Seraphine Bruhns |
| **Tilbury** | II | `SF` — Storefront Inn | docks, market_quarter, storefront, merchant_ship | The Merchant's Conclave | Magistra Elara Muffat |
| **Visby** | V | `IS` — Smuggler's Safe House | alley, sewers, goblin_cave, pirate_cave, bar | The Crimson Warrant | Warlord Kael Mordus |
| **Weimar** | VI | `SQ` — Scholar's Quarter (free) | scholars_qtr, blacksmith_qtr, mountains, outhouse, arctic | The Ivory Circle | Archivus Ptolemy Sweelinck |

> **Note on `VELDRIS_NPC_PROFILES`:** This is the actual JavaScript constant name in `roll2hit-v3.html` (line ~7290). It is a code identifier, not a town name — preserve it as-is in all code references.

---

## Known Cross-Document Conflicts

| Issue | Files | Status |
|---|---|---|
| ~~Flee is a Battle mechanic~~ | `mechanics.md` §Flee | ✅ Fixed — Flee under Battle Mode section |
| ~~Layers 5–8 show PLANNED~~ | `spec-engine.md` | ✅ Fixed — all layers marked IMPLEMENTED |
| ~~Monster count discrepancy~~ | `spec-world.md`, `monsters.md` | ✅ Fixed — actual count 329; header corrected |
| ~~Layer 8 scope expansion~~ | `spec-engine.md` | ✅ Fixed — Layer 8 updated with full scope |
| ~~Layer 9 in progress~~ | `plan.md`, `spec-corridors.md` | ✅ Complete — L9-A through L9-H all implemented |
| ~~`maps.md` missing J1–J7/MT~~ | `maps.md`, `plan.md` | ✅ Fixed — added to grid, legend, node network, coordinate index |
| ~~XP thresholds & loot table~~ | `lab-report-loot-drop-weapon-economy.md` | ✅ Resolved — Layer 25 implemented d100 loot table, tier gates, rebalanced XP (max 195k); proposal is now historical |
| `spec-migration.md` Layers 5–8 | `spec-migration.md` | ✅ Done — Section X converted to implemented summaries |
| ~~Town lore names vs real names~~ | all docs | ✅ Fixed 2026-05-24 — lore names purged; Birka/Tilbury/Visby/Weimar only |

---

## Correction: Flee / Run Away — Battle Mechanic

The Flee mechanic is **not a Story Mode mechanic**. It belongs entirely in Battle Mode.

**Correct description:**  
When a player in Battle Mode does not want their HP to hit 0, they click the **🏃 Flee** button in the battle header. The enemy takes one free attack roll. If it hits (and Auto-Damage is ON), damage is applied to the player's Battle Mode HP. After 0.8 seconds, the player is returned to Story Mode. The pending battle is cleared — no victory credit, no drops, no outcome modal. The battle chip on the node remains active.

This flow is: **Battle Mode → flee action → enemy attack → automatic return to Story Mode (world view).**  
It is NOT initiated from Story Mode. It is NOT a navigation action.

---

## Review Plan

> All files through session 2026-05-21 are reviewed (rows 1–30 below). New files added 2026-05-22 are **PENDING** — these are design-spec lab reports and need layer assignment before they affect the codebase.

| # | File | Priority | Status |
|---|---|---|---|
| 1 | `mechanics.md` | HIGH | ✅ Done — Flee reclassified; potion table, action economy, Layer 20 state fields verified |
| 2 | `spec-engine.md` | HIGH | ✅ Done — All layers marked IMPLEMENTED; Layers 9–20 addendum added |
| 3 | `spec-migration.md` | MEDIUM | ✅ Done — Layers 5–8 added to Section X; IV-B, IV-D, VII-C, conclusion, footer updated |
| 4 | `maps.md` | LOW | ✅ Done — GATE LOCKS section added; CIRCUIT CORRIDORS section added |
| 5 | `monsters.md` | LOW | ✅ Done — 329 keys verified; header updated; all IP references cleaned |
| 6 | `spec-world.md` | LOW | ✅ Done — count 120→329, terrains 16→42, file size updated |
| 7 | `world.md` | LOW | ✅ Done — Survival Pressure rewritten with actual mechanics |
| 8 | `story.md` | LOW | ✅ Done — 76 nodes across 8 acts (42 story + 20 EBs + 7 junctions + SL/MT/DF/HM/GL/CO + YL/YC); PLANNED: NODE 77 CQ |
| 9 | `spec-combat.md` | INFO | Historical only; no changes needed |
| 10 | `plan.md` (L9–10) | HIGH | ✅ Done — L9-A through L9-H + L10-A through L10-F all marked ✅ |
| 11 | `spec-corridors.md` | HIGH | ✅ Done — all L9 steps marked ✅ |
| 12 | `lab-report-circuit-map-theory.md` | LOW | ✅ Written — reference only; no code changes |
| 13 | `lab-report-battleground-circuit-path-quest.md` | LOW | ✅ Written — IEEE report on Stalk/XP methodology |
| 14 | `plan.md` (L11) | HIGH | ✅ Done — L11-A through L11-H all marked ✅ |
| 15 | `plan.md` (L12) | HIGH | ✅ Done — L12-A through L12-E all marked ✅ |
| 16 | `lab-report-drop-rates-balance-and-health.md` | LOW | ✅ Written — drop rate calibration, Cooperative DM Principle |
| 17 | `plan.md` (L13) | HIGH | ✅ Done — L13-A through L13-G all marked ✅ |
| 18 | `lab-report-plan-cleanup-v13.md` | LOW | ✅ Written — spec archive Layers 9–13; verification manifest |
| 19 | `lab-report-prompt-migration-arena-to-prototype.md` | LOW | ✅ Written — Arena→Prototype retrospective |
| 20 | `plan.md` (L16) | HIGH | ✅ Done — condition countdown, DIS badge, Spell Scrolls, skill check mechanic |
| 21 | `plan.md` (L17) | HIGH | ✅ Done — 1.5 AP economy, shield, wimper, flee rework, inventory ordering, spell expiry |
| 22 | `lab-report-plan-cleanup-v17.md` | LOW | ✅ Written — spec archive Layers 14–17; 6 bug corrections; plan.md compacted |
| 23 | `lab-report-leveling-flashbang-condition-economy.md` | LOW | ✅ Written — Layer 18: leveling, Flashbang, CONDITION_GOLD ×100 |
| 24 | `plan.md` (L19) | HIGH | ✅ Done — L19-A through L19-K: starting kit, wimper redesign, safe flee, threat badge |
| 25 | `ux-first-battles.md` | LOW | ✅ Written — first 3 battles traced; all 10 UX fixes documented |
| 26 | `plan.md` (L20) | HIGH | ✅ Done — storyVoidDefeat, Day-49 defeat, void pressure, enhanced victory stats |
| 27 | `mechanics.md` (full review) | HIGH | ✅ Updated 2026-05-22 — Layers 21–45: NPC favorability, EB system, NG+, S-suggestions, state fields |
| 28 | `spec-engine.md` (full review) | HIGH | ✅ Updated — Layers 9–20 in Part Nine; state machine updated |
| 29 | `world.md` (Birka Six + survival pressure) | MEDIUM | ✅ Updated 2026-05-22 — Birka Six NPCs section added; favorability/traces/cross-refs documented |
| 30 | `maps.md` (corridor + EB nodes) | LOW | ✅ Updated — CIRCUIT CORRIDORS + 20 EB nodes in legend |
| 31 | `combat.md` | MEDIUM | ✅ Reference document — accurate for Layers 0–37 |
| 32 | `lab-report-loot-drop-weapon-economy.md` | LOW | ✅ Superseded — loot system (L25) fully implemented. Document is historical proposal. |
| 33 | `lab-report-npc-dialogue-system.md` | LOW | ✅ Done — Layer 42 implemented; NPC_DIALOGUES + _getNPCDialogue + _missionComplete + 4-state endings live |
| 34 | `lab-report-veldris-beginner-arc.md` | LOW | ✅ Done — Layer 41 implemented; 6 NPCs + 7 quests + Rough Whiskey + Yael escort live |
| 35 | `lab-report-epic-battlegrounds.md` | LOW | ✅ Done — Layer 39 implemented; 20 EB nodes live in code |
| 36 | `lab-report-endings-and-echoes.md` | LOW | ✅ Done — Layer 43 implemented; all L43-A through L43-W ✅; NG+, epilogues, parchment note, covenant ceremony live |
| 37 | `lab-report-game-story-codex-of-conquest.md` | LOW | ✅ Done — Layer 40 implemented; FROBERGER_JOURNAL + curse arc live |
| 38 | `lab-report-story-codoex-curse-of-knowedge.md` | LOW | ✅ Writing framework — used as style reference; no direct code changes |
| 39 | `lab-report-living-world.md` | LOW | ✅ Done — Layer 44 implemented: Gigault stall, world progression, NPC farewells, Act III desaturation |
| 40 | `lab-report-web-of-connections.md` | LOW | ✅ Done — Layer 45 implemented: FROBERGER_TRACES, NPC_CROSS_REFS, Room 6, cross-item triggers |
| 41 | `lab-report-friendships-with-magic.md` | LOW | ✅ Written 2026-05-22 — session postmortem L41–42; 5 new systems |
| 42 | `plan.md` (L41–45) | HIGH | ✅ Done — all layers L41–L45 complete; verbose specs archived; plan.md cleaned up |
| 43 | `lab-report-architecture-full.md` | HIGH | ✅ Written 2026-05-22 — full IEEE architectural review; every function, all flow charts, all subsystems |
| 44 | `world.md` — CI connections + SL dead-end + defi_land cluster | HIGH | ✅ Fixed 2026-05-24 (S01/S03) — CI N/S/E/W corrected; SL dead-end claim removed; DF/HM/GL nodes 72–74 documented with NODE_MAP text, NPC, battle, terrain |
| 45 | `maps.md` — DF/HM/GL grid + legend + node network + coordinate index | HIGH | ✅ Fixed 2026-05-24 (S02) — R03 grid updated; 3 legend rows added; SL→DF connection added; coordinate index entries added |
| 46 | `story.md` — EB_NPC_DIALOGUE all 20 entries (Q52–Q71) | HIGH | ✅ Added 2026-05-24 (S05/S06) — all 5 fields per entry (wound/opening/warning/negotiate/return) verbatim from HTML; dual-role NPCs cross-referenced (Q59 Draketide, Q65 Izador, Q71 Mordus) |
| 47 | `maps.md` — F1 Navigation Engine function reference | MEDIUM | ✅ Added 2026-05-24 (S08) — FL1/FL9/FL12 flowcharts with named milepoints; 23-function table; map data structure summary |
| 48 | `story.md` — F2 Story Engine function reference | MEDIUM | ✅ Added 2026-05-24 (S09) — FL3/FL7/FL8 flowcharts with named milepoints; 27-function table; CS architecture note |
| 49 | `world.md` — F3 World Engine function reference | MEDIUM | ✅ Added 2026-05-24 (S10) — FL4/FL7/FL8/FL15 flowcharts with named milepoints; 28-function table; void pressure + save/load architecture |
| 50 | `mechanics.md` — F4 Mechanics Engine function reference | MEDIUM | ✅ Added 2026-05-24 (S11) — FL2/FL5/FL6/FL10 flowcharts with named milepoints; 25-function table; loot pipeline + level-up + vendor economy |
| 51 | `monsters.md` — F5 Monster Engine function reference | MEDIUM | ✅ Added 2026-05-24 (S12) — FL9/FL13/FL14 flowcharts with named milepoints; 15-function table; notoriety weights + stalk ×6 boost + fishing 2d20 |
| 52 | `combat.md` — F6 Combat Engine function reference | MEDIUM | ✅ Added 2026-05-24 (S13) — FL2/FL6/FL11 flowcharts with named milepoints; 32-function table; Story↔Battle bridge; death save corpse quest |
| 53 | `index.md` — Town Cross-Reference table | MEDIUM | ✅ Added 2026-05-24 (S14) — Birka/Tilbury/Visby/Weimar with acts, inn nodes, terrains, factions, Epic NPCs |
| 54 | All docs — lore name purge (Veldris/Saltwick/Ashcrag/Highspire) | HIGH | ✅ Fixed 2026-05-24 — 15 instances replaced across story.md (10), maps.md (1), index.md (2 sections), plan.md (4); zero instances remain in any .md file |

**Session format:** Say "continue" to move to the next file. Each review will be: read the relevant section → compare to code → edit the markdown → confirm before next.

---

*Last updated: 2026-05-24*  
*Codebase: roll2hit-v3.html · 14,377 lines · Layers 0–45 complete · 76 nodes · 370 monsters (46 base + 20 epic terrains)*  
*All core docs reviewed and synced 2026-05-22. All layers implemented and verified. Plan.md cleaned.*  
*2026-05-24 sync pass (SP1): world map consistency verified; DF/HM/GL nodes documented; 20 EB dialogues added to story.md; F1–F6 function reference sections added to all six sync files; town names unified (Birka/Tilbury/Visby/Weimar); lore names purged; froberger-journal-all-entries.txt verified (41 entries); fish+timeline lab reports indexed; WAGMI monster added to DeFi Land.*  
*2026-05-24 sync pass (SP2): YL/YC nodes added to maps.md (grid + legend + network); Cat Arc PLANNED stubs added to maps.md, world.md, story.md; Torment Nexus PLANNED stubs added to world.md, story.md; Fishing Overhaul (Section XII) + Luck Stat (Section XIII) planned in plan.md; lab-report-architecture-full.md updated (76 nodes, 370 monsters, 14,377 lines); Project Directive added to top of index.md (Adding = Planning; Implementing = Code + Sync). SP2 lab report verification pass complete: all 13 lab reports verified or annotated; MONSTER_POOL count corrected 341→370; WORLD_DB terrains corrected 42→66; NPC_CROSS_REFS corrected 14→17; world.md Birka quest IDs corrected (5 wrong IDs fixed); curse score formula corrected in lab-report-architecture-full.md; _missionComplete() design/implementation divergence noted in lab-report-npc-dialogue-system.md. World Creator Wizard (§XIV) and Quest -1: The Open Door planned — Level 21 undefined; shell tooling documented; MIT fork invitation formalized.*  
*Layer 43: Endings & Echoes — covenant ceremony, epilogue scroll, parchment note, NG+ system ("Sweelinck is waiting."), covenant standing*  
*Layer 44: Living World — Gigault stall, world progression events, minimap warmth, NPC farewells, Act III desaturation, Brynn maintenance/ledger, quiet return receipts, Deacon's Code, Void's First Sign, final map render*  
*Layer 45: Web of Connections — FROBERGER_TRACES (6 NPCs), NPC_CROSS_REFS (17 cross-reference lines), Nivers ("Evening."), Yael patrol nodes, Weckmann training log, Room 6, cross-item triggers (Note×Bruhns, Whiskey×Brynn), Fighter's Token*

---

MIT License — roll2hit.com — Copyright (c) 2026 — Free to use, modify, and share.
