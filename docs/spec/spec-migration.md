<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Extending a Browser-Based Combat Tracker Into a Full Narrative Game Engine: A Layered Migration Architecture

**Technical Migration Report — CodexOfConquest.com / The Shattered Codex**
**Classification:** Software Architecture · Single-File Web Application · Incremental Feature Integration
**Document Version:** 2.0 · Layers 0–8 Complete

---

## Abstract

This report documents the architectural migration of `play.html` — a self-contained, browser-based combat tracker — into a two-mode narrative game engine capable of supporting a 42-node story world, persistent inventory, quest journaling, and a pre-battle condition item selection system. The migration was executed in eight discrete vertical layers, each adding one complete interaction type without disturbing prior functionality. The source system (Layer 0) consisted of a fully operational dice-rolling and initiative-tracking engine with 329 monsters in a static `MONSTER_POOL` object. The completed system (Layers 0–8) comprises a MUD-style N/E/S/W node navigation shell, a live inventory system, a quest journal, Froberger's journal read-aloud modals, a pre-battle condition item selection overlay, inn-based sleep and time pressure mechanics, full localStorage save/load with checkpoint respawn, main quest gate locks, a combat drop and vendor economy (MONSTER_DROPS, 4-tier potions, Hearth Home, Transmort Scroll), a flee mechanic, and an 11×11 dynamic map overlay. The entire implementation is constrained to a single HTML file with no external dependencies, no build step, and no CDN references. The file reached approximately 6,100 lines at Layer 8 completion.

---

## I. Introduction

### I-A. Motivation

The CodexOfConquest.com combat tracker was designed as a DM-assist tool: a fast, opinionated interface for tracking initiative, attack rolls, damage, conditions, and death saves during combat. Its architecture — a single HTML file, all JavaScript and CSS inlined, no runtime dependencies — made it deployable by simply opening a file in a browser.

This architecture, while restrictive, proved to be a design constraint with significant advantages. The file is fully portable, version-controllable as a single artifact, and auditable in its entirety without a build system. The decision was made to extend the file rather than decompose it, preserving these properties while adding a full narrative game layer above the existing battle engine.

### I-B. World Context

The narrative layer implements *The Shattered Codex*, a solo adventure framed as a quest to recover seven Codex Shards scattered across a 42-node island world before the 49th day. The story is initiated by the death of Froberger — the player's sibling-figure — who was a courier carrying a map toward a scholar named Sweelinck in the mountain city of Weimar. He found six of the seven Shards. The seventh requires the player to retrace his path, form the same alliances, and reach the Cosmic Realm above Birka before the Void breaks through.

The world contains four hub towns — Birka (the metropolis), Tilbury (the merchant harbor), Visby (the enemy stronghold), and Weimar (the scholars' city) — connected by a graph of 42 terrain nodes across 8 narrative acts. The story is not linear: players may navigate in any topologically valid direction, but key items gate transitions between acts, and a 49-day survival pressure creates pacing constraints.

### I-C. Scope of This Report

This report covers the architectural decisions, data structure designs, state machine specifications, and implementation procedures for all eight migration layers. Layer 0 (the existing combat tracker) is treated as a fixed substrate that must not be modified. Layers 1–4 are documented in full detail. Layers 5–8 are summarized in Section X with key functions and state additions. The objective of each layer is stated and its integration with adjacent layers analyzed.

---

## II. Pre-Migration System Characterization (Layer 0)

### II-A. Existing Architecture

Prior to migration, `play.html` comprised approximately 3,500 lines implementing the following subsystems:

- **Initiative tracker** — drag-reorderable combatant list with HP bars, condition chips, and death save pips
- **Attack roller** — configurable ATK bonus, damage dice, crit threshold, and modifiers (ADV/DIS, half cover, flanking)
- **Monster preset loader** — `loadEnemyPreset(preset)` ingests a `MONSTER_POOL` entry and populates the opponent zone
- **Terrain filter** — `WORLD_DB` maps 40 terrain types to valid monster subsets for random encounter generation
- **Statistics panel** — roll history, hit/miss rates, damage histograms

The critical integration surface for the migration is `loadEnemyPreset(mp)`. This function is the boundary between Story Mode and Battle Mode. Any monster in `MONSTER_POOL` can be loaded into the combat tracker by passing its key. This function was not modified during the migration.

### II-B. Data Model Constraints

The existing system maintained no persistent state between page loads and no navigation concept. All interactivity was event-driven against a flat DOM with no framework. The migration was required to preserve this event-driven model.

### II-C. Identified Extension Point

The header DOM element — `<div id="header">` — was identified as the appropriate location for a Story Mode toggle button, given that it is always visible and owns no functionality that would conflict with a new control. The main body container (`<div id="main-body">`) was identified as the element to hide when Story Mode is active, with a new sibling panel (`<div id="story-panel">`) shown in its place.

---

## III. Target Architecture Design

### III-A. Two-Mode Engine Model

The migrated system implements exactly two top-level modes. The boundary between them is explicit, intentional, and user-controlled:

```
┌──────────────────────────────────────────────┐
│                STORY MODE                    │
│  Navigate 42 nodes · Collect loot            │
│  Manage inventory · Read Froberger's journal      │
│  Track quests · Sleep at inns                │
└──────────────┬───────────────────────────────┘
               │  storyPreBattle(node)
               ▼
┌──────────────────────────────────────────────┐
│              PRE_BATT OVERLAY                │
│  Select condition items from inventory       │
│  Preview condition effects                   │
│  Confirm → consume items + load enemy        │
└──────────────┬───────────────────────────────┘
               │  storyCommitBattle()
               ▼
┌──────────────────────────────────────────────┐
│               BATTLE MODE                    │
│  codexofconquest combat tracker (Layer 0)           │
│  Initiative · Rolls · Death saves            │
└──────────────┬───────────────────────────────┘
               │  storyEnter() + pendingBattle set
               ▼
┌──────────────────────────────────────────────┐
│            OUTCOME MODAL                     │
│  Input HP remaining · Victory or Retreat     │
│  Apply to S_story · Mark battle defeated     │
└──────────────┘
```

**Figure 1.** Two-mode game engine control flow, Layers 1–4.

### III-B. Single-State Object Pattern

All runtime game state is held in one mutable object, `S_story`, defined at module scope. This pattern was chosen because it:

1. Provides a single serialization target for Layer 6 (save/load, not yet implemented)
2. Makes state readable from any function without parameter passing
3. Mirrors the flat-state model already used by the Layer 0 battle tracker

```javascript
let S_story = {
  active: false,         // Story Mode visible flag
  currentCode: 'CI',     // Current node (2-letter key into NODE_MAP)
  hp: 30, hpMax: 30,
  gold: 50,
  day: 1,                // Story day counter (max 49)
  shards: 0,             // Codex Shards collected (max 7)
  voidPressure: 0,       // Void pressure scale (0–10)
  log: [],               // Travel history (last 12 node codes)
  inventory: [],         // Array of {name, code, icon, type}
  visited: {},           // {nodeCode: true} — prevents duplicate loot
  quests: {},            // {questId: 'active'|'complete'}
  journalRead: {},       // {nodeCode: true} — prevents duplicate modals
  defeatedBattles: {},   // {nodeCode: true} — suppresses repeat PRE_BATT
  pendingBattle: null    // Set during battle; triggers outcome modal on return
};
```

**Listing 1.** `S_story` — the complete runtime state object after Layer 4.

---

## IV. State Machine Specification

### IV-A. Implemented States

The following states are fully implemented after Layer 4:

| State | UI Element | Entry Trigger | Exit Trigger |
|---|---|---|---|
| `INACTIVE` | `#main-body` visible | Page load | `storyEnter()` |
| `EXPLORE` | `#story-panel` visible | `storyEnter()` | `storyExit()` or `storyPreBattle()` |
| `INVENTORY` | `#story-inv-overlay` over `#story-center` | 'I' key / button | 'I' / Escape / navigation |
| `QUEST` | `#story-quest-overlay` over `#story-center` | 'Q' key / button | 'Q' / Escape / navigation |
| `JOURNAL` | `#story-journal-modal` fixed overlay | Auto on node arrival | 'J' / Escape / Continue button |
| `PRE_BATT` | `#story-prebatt-overlay` over `#story-center` | `storyPreBattle(node)` | Start Battle / Cancel |
| `BATTLE` | `#main-body` visible (tracker) | `storyCommitBattle()` | `storyEnter()` |
| `OUTCOME` | `#story-outcome-modal` fixed overlay | `storyEnter()` + `pendingBattle` set | Victory / Retreat buttons |

**Table 1.** Implemented game states and their DOM mappings.

### IV-B. Additional States (Layers 5–8) — ✅ IMPLEMENTED

All states specified in `spec-engine.md` are now implemented:

| State | Layer | Status | DOM Element |
|---|---|---|---|
| `SLEEP` | 5 | ✅ | `#story-sleep-overlay` over `#story-center` |
| `GAME_OVER` | 5 | ✅ | `#story-gameover-modal` fixed overlay |
| `VOID_TIDE` | 5 | ✅ | `#story-void-modal` fixed overlay |
| `CONTINUE` | 6 | ✅ | `#story-continue-modal` fixed overlay (on page load) |
| `VICTORY` | 7 | ✅ | `#story-victory-modal` fixed overlay |
| `VENDOR` | 8 | ✅ | `#story-vendor-overlay` over `#story-center` |
| `MAP` | 8+ | ✅ | `#story-map-overlay` fixed full-screen overlay |
| `DIALOGUE` | 8 | N/A | NPCs rendered as static chip text (design spec unchanged) |

### IV-C. State Transition Diagram

```
               ┌─────────────────────────────────┐
               │                                 │
         ┌─────▼──────┐     storyExit()    ┌────▼──────────┐
         │  INACTIVE  │◄───────────────────│    EXPLORE    │
         └─────┬──────┘                    └──┬──┬──┬──┬───┘
               │ storyEnter()                 │  │  │  │
               └──────────────────────────────┘  │  │  │
                                              [I] │  │  │ [B/chip]
                                      ┌──────────┘  │  │
                                      ▼             │  │
                                 INVENTORY          │  │
                                      ▲         [Q] │  │
                                      └─────────────┘  │
                                                  QUEST │
                                                        │
                                                   PRE_BATT
                                                        │
                                               storyCommitBattle()
                                                        │
                                                    BATTLE
                                                        │
                                               storyEnter() +
                                               pendingBattle set
                                                        │
                                                   OUTCOME
                                                        │
                                               storyApplyOutcome()
                                                        │
                                                  EXPLORE ◄─┘
```

**Figure 2.** Implemented state transition diagram. Journal modal is orthogonal — it fires atop EXPLORE state and does not interrupt navigation.

### IV-D. Escape Key Priority Chain

The Escape key implements a layered dismissal hierarchy that matches user expectations for modal UI. After all 8 layers, the full chain is:

```
Escape pressed →
  1. MAP overlay visible?       → dismiss → stop
  2. VICTORY modal visible?     → dismiss → stop
  3. GAME_OVER modal visible?   → dismiss → stop
  4. CONTINUE modal visible?    → dismiss → stop
  5. VOID_TIDE modal visible?   → dismiss → stop
  6. OUTCOME modal visible?     → dismiss → stop
  7. JOURNAL modal visible?     → dismiss → stop
  8. SLEEP overlay visible?     → dismiss → stop
  9. PRE_BATT overlay visible?  → dismiss → stop
 10. INVENTORY overlay visible? → dismiss → stop
 11. QUEST overlay visible?     → dismiss → stop
 12. VENDOR overlay visible?    → dismiss → stop
 13. (none of the above)        → storyExit() → INACTIVE
```

This ensures that dismissing a deeper overlay never accidentally exits Story Mode entirely.

---

## V. World Graph: NODE_MAP

### V-A. Graph Design

The 42-node story world is encoded as `NODE_MAP`, a JavaScript object keyed by 2-letter terrain code. Each node is a vertex in a directed graph where edges are the four cardinal directions (N, E, S, W). The graph is not a regular grid — topological adjacency in `NODE_MAP` does not imply geographic proximity in the `maps.md` grid. Navigation follows the graph; the grid is for visual reference only.

```javascript
// Structural schema of a single NODE_MAP entry
{
  num:    13,              // Story node number (1–42)
  code:   'FO',           // Primary key
  name:   'forest',       // Terrain type (matches WORLD_DB terrain)
  label:  "Aldric's Forest",
  act:    3,              // Narrative act (1–8)
  N:      'HL',           // Edge to Highlands (null if no exit)
  S:      'SW',           // Edge to Swamp
  E:      'MI',           // Edge to Midlands
  W:      null,           // No western exit
  text:   "...",          // Node description (DM read-aloud)
  npc:    'Brother Aldric',
  battle: { label: 'Leshen', key: 'leshen', count: 1 },
  loot:   'Earthbind Root ×2 · Grove Token (Shard #2)',
  sleep:  false,
  portal: null            // Set to destination code if this is a portal node
}
```

**Listing 2.** NODE_MAP entry schema (Node 13, Forest).

### V-B. Special Node Types

Four node categories require handling beyond standard navigation:

| Category | Nodes | Handling |
|---|---|---|
| **Inn nodes** | 5 (IN, MS, FL, PC, BQ, SQ, VC) | `sleep: true`, `sleepCost` gold value; Layer 5 will implement the rest mechanic |
| **Portal nodes** | 1 (OU → GA) | `portal` property set; `storyPortal()` function bypasses directional movement |
| **Shard nodes** | 7 (DK, FO, AT, GC, DC, OP, SQ) | Loot string contains `(Shard #N)` pattern; `_itemType()` detects and increments `S_story.shards` |
| **Journal nodes** | 5 (DK, HL, HS, DC, SQ) | `JOURNAL_ENTRIES` keyed by node code; modal fires once per playthrough |

### V-C. Geographic Layout

The world is an island. The full map occupies a 26×16 named grid (columns C01–C26, rows R01–R16). Water cells are marked `WW` and are impassable on foot. Node placement follows geographic logic:

- **Northwest:** Weimar mountains (SQ, BQ, OU), Arctic wastes (AR), Sky road (HC, CO)
- **Northeast:** Birka (CI, IN, TV, BA, CR, CY) and Tilbury (DK, MQ, SF, MS, AL)
- **Center-west:** Wilds (FO, SW, HS, HL, MI)
- **South:** Coastal arc (BE, SC, OC, IS, AT, DS, FL)
- **Southeast:** Visby (SE, BK, GC, PC, MC, CA, VC)
- **Southwest:** Desert and Jungle (DE, DC, JU)
- **Far east:** Mythic Circuit (GA, KT, OP) — reached by portal OU→GA or sky road

---

## VI. Layer Implementation Procedures

### VI-A. Layer 1 — Navigation Shell

**Objective:** Implement a text UI showing current node description with N/E/S/W movement between all 42 nodes.

**Implementation approach:** Three additions to `play.html`: a CSS block, an HTML panel, and a JavaScript block. The HTML panel uses a two-column flex layout: a left sidebar (180px fixed width, dark panel background) containing the act badge, travel log, and character status; and a flex-1 center column containing the node header, story text box, info chips, and D-pad control cluster.

**Key functions introduced:**

| Function | Responsibility |
|---|---|
| `storyEnter()` | Hide `#main-body`, show `#story-panel`, set `active: true`, render current node |
| `storyExit()` | Restore `#main-body`, hide all overlays, set `active: false` |
| `storyToggle()` | Toggle between Story and Battle modes |
| `storyMove(dir)` | Look up `NODE_MAP[currentCode][dir]`, push log, update `currentCode`, call `storyRender()` |
| `storyPortal()` | Direct teleport using `node.portal` code, bypasses directional logic |
| `storyRender(node, prefix)` | Re-render all DOM elements for the given node; composes notifications at end |
| `storyMsg(txt)` | Write to `#story-move-msg` — the notification line below the D-pad |

**Keyboard surface:** Arrow keys and WASD for movement, B for battle, I for inventory, Q for quests, J to dismiss journal, Escape for layered dismissal (Section IV-D).

**D-pad behavior:** Each directional button's `disabled` state is set per-render based on whether the node has a corresponding edge. The center ⚔ button is disabled when the node has no battle entry or the battle has been defeated.

### VI-B. Layer 2 — Character and Inventory

**Objective:** Collect node loot on first visit; display a persistent inventory accessible from any node.

**Loot collection model:** Loot is static — each node's `loot` string is defined at worldbuild time. On first arrival at a node, `storyCollectLoot(node)` splits the loot string on ` · ` and pushes each item into `S_story.inventory`. The `visited` flag prevents duplicate collection on revisits. The function returns a notification string rather than calling `storyMsg()` directly, allowing the caller (`storyRender`) to compose notifications from multiple sources.

**Item categorization:** `_itemIcon(name)` and `_itemType(name)` classify each item by keyword matching against the item name string. The `shard` type triggers an increment of `S_story.shards`. The `key` type receives gold-border treatment in the inventory UI.

```
_itemType detection logic:
  ∀ name:
    if name ∈ {shard #, (shard, tidal rune, grove token, ...} → 'shard'
    if name ∈ {key, pass, token, seal, warrant, favour}       → 'key'
    default                                                   → 'item'
```

**Figure 3.** Item type classification decision tree (simplified).

**UI pattern — overlay:** The inventory panel is an `absolutely`-positioned div (`inset: 0`) inside `#story-center` with `z-index: 10`. This allows it to cover the node content without affecting the left sidebar. The same overlay pattern is reused for Layer 3 (quest log) and Layer 4 (pre-battle). All three overlays are mutually exclusive — opening one closes the others.

**Loot chip state:** When revisiting a collected node, the LOOT info chip displays a `✅` icon and a dimmed border (`loot-collected` CSS class) instead of the default green chip. This provides clear visual feedback that the inventory has already been updated.

### VI-C. Layer 3 — Quest Journal

**Objective:** Auto-activate quests on NPC encounters; auto-complete quests when required items are collected; display Froberger's journal entries as modal interrupts at five key nodes.

**Quest data model:** `QUEST_DB` is a static object of nine quest entries (seven main, two side). Each entry specifies:

```javascript
{
  id:            'mq_2',
  type:          'main',
  title:         'Find Brother Aldric',
  desc:          '...',              // Quest log description
  hint:          '...',              // Active quest hint text
  activateNode:  'DK',              // Node code that activates this quest
  completeItems: ['Grove Token (Shard #2)']  // Any matching inventory item
}
```

**Listing 3.** QUEST_DB entry schema.

**Activation rule:** `storyCheckQuests(node)` is called at the end of every `storyRender()` call, after loot has been collected. It iterates `QUEST_DB` and activates any quest whose `activateNode` matches the current node and which is not already tracked in `S_story.quests`.

**Completion rule:** In the same function pass, all active quests are checked against `S_story.inventory` using substring matching (`inv.name.includes(ci)` or `ci.includes(inv.name)`). This tolerates the loot string suffixes (e.g., `×2`, `(5gp/2)`, `(chart room)`) without requiring exact matching. Completed quests are marked in `S_story.quests` and a notification string is returned.

**Notification composition:** Both loot and quest notifications are returned as strings and composed by `storyRender()`:

```javascript
const lootMsg  = storyCollectLoot(node);       // "📦 Found: Earthbind Root ×2 · ..."
const questMsgs = storyCheckQuests(node);      // ["📋 Find Brother Aldric", "✓ Disappeared Merchants"]
const parts = [prefix, lootMsg, ...questMsgs].filter(Boolean);
storyMsg(parts.join('  ·  '));
```

**Listing 4.** Notification composition at the end of `storyRender()`.

**Froberger's journal modal:** `JOURNAL_ENTRIES` maps five node codes (DK, HL, HS, DC, SQ) to journal entry objects with entry number, text, and an optional `mustRead` flag. On first arrival at these nodes, `storyCheckJournal(node)` fires a fixed-position modal overlay with gold border, entry number header, italic journal text, and a `Continue →` dismiss button. The modal uses `position: fixed` to cover the entire viewport, including the left sidebar. Node SQ (Entry 41) sets the `mustRead` flag, which adds a callout line: *"Sweelinck knew you were coming before Froberger died."* This entry is marked in the design specification as mandatory to read aloud.

### VI-D. Layer 4 — Battle Integration

**Objective:** Insert a pre-battle condition item selection screen between the narrative and combat layers; implement battle outcome recording; suppress repeat battles at defeated nodes.

**Condition item registry:** `CONDITION_ITEMS` is a static array of 12 entries mapping item name keywords to status conditions:

| Match Keyword | Condition | Mechanical Effect |
|---|---|---|
| Earthbind Root | Prone | ADV on all attacks; target speed 0 |
| Binding Web | Restrained | ADV on attacks vs target |
| Smoke Bomb / Flash Powder | Blinded | ADV; target has DIS on attacks |
| Signal Jammer | Jammed | Target loses coordination; no reactions |
| EMP Grenade | EMP Stunned | Incapacitated 1 round; loses action/reaction |
| Void Virus | Corrupted | DIS on saves; vulnerability to necrotic |
| Snare Trap | Grappled | ADV on attacks; target speed 0 |
| Neurotoxin | Paralyzed | ADV + auto-crit on melee; fails STR/DEX saves |
| Thunderstone | Stunned | ADV on attacks; fails STR/DEX saves; speed 0 |
| Basilisk Eye | Petrified | ADV + auto-crit; DIS on attacks vs you |
| Feint Scroll | Dodge | +1 AC; impose DIS on one enemy attack roll |

**Table 2.** Condition items and their mechanical effects in the combat tracker.

**Pre-battle flow:** `storyPreBattle(node)` replaces the former direct call to `storyStartBattle()`. It:

1. Verifies the node has an undefeated battle
2. Closes all other overlays
3. Builds `_availableConds` — a filtered view of `CONDITION_ITEMS` where each entry's `match` keyword appears in at least one inventory item name
4. Renders the PRE_BATT overlay with toggleable condition chips

Item selection is stored in `_selectedConds` (a `Set` of array indices into `_availableConds`), a module-level temporary variable that is reset each time the overlay opens. Selected items display a `☑` checkbox; unselected show `☐`.

**Commit and consume:** `storyCommitBattle()` performs four operations atomically:

1. Removes each selected condition item from `S_story.inventory` (first matching `indexOf` by keyword)
2. Sets `S_story.pendingBattle = { nodeCode, name, label }`
3. Calls `loadEnemyPreset(MONSTER_POOL[node.battle.key])` — the Layer 0 integration surface
4. Calls `storyExit()` — hides Story Mode, reveals the combat tracker

**Outcome recording:** When the player returns to Story Mode (`storyEnter()` called), the presence of `S_story.pendingBattle` causes `storyShowOutcome()` to fire before normal rendering completes. The outcome modal presents:

- Enemy and node name (from `pendingBattle`)
- A numeric HP input pre-filled with `S_story.hp`
- Two buttons: **Victory** (marks `defeatedBattles[nodeCode] = true`, applies HP) and **Retreat** (applies HP only)

After either button, `storyApplyOutcome(won)` clears `pendingBattle`, updates `S_story.hp`, calls `storyUpdateStatus()`, and re-renders the current node.

**Defeated node rendering:** In `storyRender()`, the BATTLE info chip checks `S_story.defeatedBattles[node.code]` before rendering. Defeated nodes show a dimmed `✓ Defeated` chip with no click handler. The center ⚔ button is disabled. This prevents accidental repeat-battle triggers.

---

## VII. Integrated Control Flow Analysis

### VII-A. The storyRender() Orchestration Function

`storyRender(node, prefix)` is the central synchronization point of the narrative layer. Every node transition — whether by directional movement, portal, or game entry — passes through this function. Its responsibilities have grown with each layer:

```
storyRender(node, prefix):
  ├─ storyCollectLoot(node)          ← Layer 2: first-visit loot
  ├─ close all overlays              ← Layers 2, 3, 4
  ├─ update act badge                ← Layer 1
  ├─ update node header              ← Layer 1
  ├─ update story text box           ← Layer 1
  ├─ rebuild info chips              ← Layers 1, 2, 4
  │   ├─ NPC chip (if npc)
  │   ├─ LOOT chip (if loot, not VICTORY/Portal)  ← Layer 2: collected state
  │   ├─ BATTLE chip (if battle)     ← Layer 4: defeated state check
  │   ├─ INN chip (if sleep)
  │   └─ PORTAL chip (if portal)
  ├─ update D-pad disabled states    ← Layer 1, Layer 4
  ├─ rebuild travel log              ← Layer 1
  ├─ storyUpdateStatus()             ← Layers 1, 2, 3 (HP, gold, day, shards, void, items, quests)
  ├─ storyCheckQuests(node)          ← Layer 3: activate + complete
  ├─ storyMsg(composed notifications) ← Layers 2, 3, 4
  └─ storyCheckJournal(node)         ← Layer 3: modal interrupt
```

**Figure 4.** Execution order within `storyRender()` after Layer 4.

The order is intentional: loot must be collected before quests are checked for completion; quests must be checked before the notification is composed; the journal modal fires last because it may be visually covered by other notifications temporarily.

### VII-B. Layer-to-Layer Data Dependencies

The four layers are not fully independent — each consumes state produced by prior layers:

```
Layer 1 produces:  S_story.currentCode, S_story.log
Layer 2 consumes:  S_story.currentCode
Layer 2 produces:  S_story.inventory[], S_story.visited{}, S_story.shards
Layer 3 consumes:  S_story.inventory[] (quest completion matching)
Layer 3 produces:  S_story.quests{}, S_story.journalRead{}
Layer 4 consumes:  S_story.inventory[] (condition item filtering + consumption)
Layer 4 produces:  S_story.defeatedBattles{}, S_story.pendingBattle
```

**Figure 5.** Inter-layer data dependency graph.

This dependency ordering validates the layer implementation sequence. Inverting Layers 2 and 3 would have produced a quest completion system with no inventory to check against. Inverting Layers 3 and 4 would have required the pre-battle system to operate without quest context.

### VII-C. The Battle Bridge

The integration between Story Mode and the existing combat tracker uses `loadEnemyPreset(mp)` as the sole API surface. The bridge is asymmetric: Story Mode can push state into Battle Mode (via `loadEnemyPreset`), but Battle Mode cannot push state back into Story Mode. The outcome is therefore captured by user input in the outcome modal rather than by programmatic event.

This asymmetry was addressed in Layers 5–8 using a shared module-level staging pattern rather than `CustomEvent`. The implemented bridge uses two fields:

- `S._pendingDrop` — set by `battKillEvent()` in Battle Mode when opponent HP reaches 0; consumed by `storyApplyOutcome(won)` in Story Mode.
- `S_story.pendingBattle` — set by `storyCommitBattle()` before entering Battle Mode; cleared by `storyApplyOutcome()` after outcome is recorded.

The `battle_output` contract from `spec-engine.md` is satisfied through user input (HP entry in the outcome modal) plus automatic drop staging, rather than through programmatic event emission. This preserves the zero-dependency constraint while achieving equivalent semantic result.

**Listing 5.** Implemented battle bridge — `battKillEvent()` stages the drop; `storyApplyOutcome(true)` transfers it to inventory.

---

## VIII. Architectural Decisions and Rationale

### VIII-A. Single HTML File Constraint

The constraint of maintaining a single-file application without external dependencies was respected throughout all four layers. The rationale is deployability: the file opens in any browser with no server, no npm install, no network access. This constraint excluded several conventional options (ES modules, component frameworks, CSS preprocessors) but produced a codebase that is fully legible as a sequential artifact and testable by opening one file.

### VIII-B. Absolute-Positioned Overlay Pattern

Rather than routing between separate page views or modifying the DOM structure on each state change, all secondary states (inventory, quests, pre-battle) use `position: absolute; inset: 0` within `#story-center`. This approach:

- Requires no layout recalculation on panel entry/exit
- Preserves the sidebar (left panel) during overlay display
- Allows natural Escape-key dismissal without routing complexity
- Reuses the same visual container for all overlay types

The journal and outcome modals use `position: fixed` instead, as they must cover the full viewport (including the sidebar) to indicate a full interrupt of game flow.

### VIII-C. Keyword-Based Item Matching

Item names in `S_story.inventory` are populated directly from the `NODE_MAP` loot strings without parsing or normalization. This produces names like `"Earthbind Root ×2"` and `"Flash Powder (5gp/2)"`. Both `CONDITION_ITEMS` matching and quest `completeItems` matching use substring tests (`str.includes(keyword)`) rather than exact equality. This is a deliberate tradeoff: it introduces theoretical false-positive risk in exchange for zero normalization overhead and full tolerance of loot string decorators.

### VIII-D. Notification Composition via Return Values

Layers 2 and 3 introduced the requirement that multiple notification strings be composed into a single `storyMsg()` call. The design decision was to have `storyCollectLoot()` and `storyCheckQuests()` return strings rather than call `storyMsg()` directly. This gives `storyRender()` full control over notification formatting and prevents later-called functions from overwriting earlier messages. The `prefix` parameter on `storyRender()` supports caller-injected context (e.g., `"⚡ Portal activated!"` from `storyPortal()`).

---

## IX. Validation and Test Paths

### IX-A. Layer 1 Test Path

Navigate all 42 nodes using keyboard input (Arrow keys / WASD). Verify: travel log updates, D-pad buttons correctly disabled for null exits, act badge changes at act boundaries, portal activation at OU→GA.

### IX-B. Layer 2 Test Path

Walk CI → IN → DK. Verify: 3 loot collections (Bloodstained Map; Merchant Ledger + Froberger's Journal; Trade Seal + Smoke Bomb). Open inventory (I). Verify 5 items listed with correct icons. Verify `✅` chip on revisit to CI. Verify shards counter increments after DK.

### IX-C. Layer 3 Test Path

Continue to DK. Verify: quest `mq_2` (`Find Brother Aldric`) activates; Froberger's Journal Entry 7 modal fires; `sq_1` (`The Disappeared Merchants`) active. Continue to FO. Collect Grove Token. Verify `mq_2` and `sq_1` both complete in quest log. Navigate to HL. Verify Entry 14 modal fires. Navigate to SQ. Verify Entry 41 modal fires with `mustRead` callout.

### IX-D. Layer 4 Test Path

From FO (with Earthbind Root in inventory): click BATTLE chip. Verify PRE_BATT overlay shows Earthbind Root → PRONE. Select it. Click Start Battle. Verify: Earthbind Root removed from inventory, combat tracker appears. Click "🗺 Story". Verify outcome modal appears with correct enemy name. Enter HP. Click Victory. Verify: FO battle chip shows `✓ Defeated`, HP updated in sidebar, shards count unchanged.

---

## X. Layers 5–8 — ✅ All Implemented

### X-A. Layer 5 — Sleep + Time Pressure

`S_story` additions: `sleptAtNodes{}`, `countedMissedInns{}`, `missedSleeps`, `battleDis`. Inn overlay (`#story-sleep-overlay`) shows HP restore preview, cost, and day advance before confirming. `storySleep(node)` advances `S_story.day`, restores HP to max, updates `checkpointNode`. Void Tide modal fires at days 20, 30, 40, 49 via `storyCheckVoidTide()`. Missing sleep sets `battleDis += 2`, shown as DIS chips in PRE_BATT.

### X-B. Layer 6 — Save / Load

`storyAutoSave()` writes `S_story` to `coc_autosave` on every `storyRender()` call. `storySaveCheckpoint()` writes to `coc_checkpoint` on inn sleep. `storyCheckContinue()` runs before `storyRender()` on `storyEnter()`: if autosave exists, shows Continue modal (Day/location/items); if autosave HP=0, shows GAME_OVER modal directly. `storyRespawnFromCheckpoint()` loads checkpoint save and teleports to last inn at ½ HP. `_S_DEFAULTS()` factory function returns fresh state for `storyNewGame()`.

Key design constraint: `storyCheckContinue()` must run and return `true` before any `storyRender()` call on first entry, or `storyRender()`'s own `storyAutoSave()` would overwrite the existing save.

### X-C. Layer 7 — Main Quest Gate Locks

`GATE_LOCKS` array of four `{from, to, item, msg}` objects: CR→CY (Crypt Key), SC→FL (Sea Cave Key), AL→SE (Conclave Pass), VC→DE (Toll Token). Checked in `storyMove()` before position update. Shard gate: destination CO requires `S_story.shards >= 7`. Victory modal at CO populated by `storyCheckVictory(node)` with Day/HP/Gold/Items/Quests stats.

> **§DX-02hh — RETIRED, kept as history.** This is the Layer 7 migration record, and none of it is live: `GATE_LOCKS` has **0 occurrences** in `play.html` since `5123f5a`, `storyMove` is `storyMove_LEGACY` and is called by nothing, and CR/CY/SC/FL/AL/SE/VC/DE/CO are pre-§CELL-01 node codes. Item-locked edges were retired by the Free-Movement policy; the shard requirement survives as node data (`NODE_MAP.TLS.finalBattle:{minLevel:20,minShards:7}`), not as a movement check. Live description: `spec-engine.md` §Gate Locks.

### X-D. Layer 8 — Combat Drops + Vendor Economy

**MONSTER_DROPS:** Every `MONSTER_POOL` key has a drop entry (name, icon, sell value by category: beasts → fangs/claws/pelts; humanoids → weapons; undead → bone/dust; constructs → cores/gears; etc.). Drop staged by `battKillEvent()` into `S._pendingDrop` on opponent HP = 0 (`_killFired` flag prevents double-fire). Victory banner (`#battle-victory-banner`) shows drop text in Battle Mode.

**Vendor system:** `VENDOR_NODES = new Set(['BA','MQ','SF','IS','BK'])`. Vendor chip rendered at these nodes. `storyShowVendor()` opens overlay with sell-all trophies and buy section. `POTION_TIERS` object: Minor (10HP/50gp), Healing (25HP/150gp), Greater (50HP/400gp), Superior (100HP/1000gp), Transmort Scroll (200gp). Exponential pricing matches HP scaling across tiers.

**Hearth Home:** `S_story.hearthHome` (default `'CI'`). `storySetHearthHome(nodeCode)` updates at any inn. `storyUseTransmort()` consumes Transmort Scroll from inventory and calls `storyRender()` at home node.

**Flee mechanic:** `storyRunAway()` triggered by `#flee-btn` in Battle Mode header. Enemy rolls one free attack (d20 + ATK vs player AC); if hit and auto-damage ON, damage applied. After 800ms, `storyEnter()` called. `S_story.pendingBattle` cleared — no victory credit, no drops. *Battle Mode mechanic only.*

**Sidequests:** `sq_battling` (`dropsCollected >= 3`) and `sq_leveling` (`defeatedBattles count >= 5`) use `completeFn` callbacks checked in `storyCheckQuests()`.

**Map overlay (Layer 8+):** `NODE_COORDS` lookup (42 nodes, Row/Col from `maps.md`). `storyMapToggle()` opens `#story-map-overlay` fixed full-screen. 11×11 viewport centered on player; breadcrumb trail (last 20 log entries); exit arrows per direction; one-way wall detection via `_MAP_OPP` reverse-connection check. `[M]` key shortcut.

---

## XI. Conclusion

The migration of `play.html` from a pure combat tracker to a two-mode narrative game engine demonstrates that incremental vertical-slice architecture is viable within a single-file, zero-dependency web application. Each of the four completed layers delivered a testable, usable feature set without regressing prior layers. The constraint of a single HTML file, rather than limiting design, enforced a discipline of minimalism: each addition required explicit justification against the single-file deployment property.

The central architectural insight is the separation of narrative state (`S_story`) from presentation logic (`storyRender()` and its overlay pattern) and from the existing battle engine (`loadEnemyPreset()`). These three concerns are loosely coupled through a small, stable API surface. This coupling structure directly determines the feasibility of the remaining four layers: they require new state fields and new UI elements, but they do not require modification of the battle engine or the layer architecture established here.

The world of *The Shattered Codex* — 42 nodes, 8 acts, 49 days, 7 Shards, and a dead courier named Froberger — is fully playable. All player systems are implemented.

---

## References

[1] *play.html* — CodexOfConquest.com combat tracker, Layer 0 substrate. Single-file browser application, ~3,500 lines at Layer 0 baseline. Extended to ~6,100 lines after Layer 8 completion.

[2] *spec-engine.md* — Design specification document: data schemas, state machine, navigation model, loot tables, PRE_BATT interface contract, iteration layer plan. Authored concurrent with Layer 0 review.

[3] *story.md* — Narrative design document: 42 node story beats, 8 epic NPCs, all quest arcs, Froberger's journal entries, condition item discovery scenes, survival pressure callouts. Source of `NODE_MAP` text content and `JOURNAL_ENTRIES`.

[4] *maps.md* — Island world grid map (26×16, C01–C26 × R01–R16), complete legend, node network travel connections, sleep nodes, four towns reference. Source of `NODE_MAP` directional edges.

[5] *world.md* — World lore, faction profiles, condition item descriptions, NPC profiles, `MONSTER_POOL` cross-reference. Source of `CONDITION_ITEMS` effect text.

[6] Wizards of the Coast, *D&D 5th Edition: Systems Reference Document 5.1*. Conditions reference: Prone, Restrained, Blinded, Paralyzed, Stunned, Grappled, Petrified, Incapacitated. Advantage/Disadvantage mechanic on d20 rolls.

[7] R. C. Martin, *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall, 2017. Vertical slice architecture principle: deliver complete, testable features layer by layer rather than horizontal layer by layer.

[8] MUD (Multi-User Dungeon) navigation convention — N/E/S/W directional movement with textual node descriptions. Originating in *Zork* (Infocom, 1977) and formalized in MUD1 (Roy Trubshaw / Richard Bartle, University of Essex, 1978).

---

*Document prepared for software architecture review.*
*System: CodexOfConquest.com / The Shattered Codex · Layers 0–8 complete*
*Single-file HTML application · ~6,100 lines · No external dependencies · No build step*


---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../../LICENSE) for full text.*
