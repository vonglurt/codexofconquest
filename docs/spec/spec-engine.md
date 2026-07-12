<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# GAME ENGINE — Step 2: Design Specification
### roll2hit.com — The Shattered Codex

> **What this document is:** The design blueprint for the playable game layer. **All Layers 0–45 are now implemented in `roll2hit-v3.html`.** This document covers Layers 0–37 in detail. Layers 38–45 (Epic Battlegrounds, Covenant Endings, NG+, Living World, Web of Connections) are documented in their respective lab reports — see `index.md`. Sections marked IMPLEMENTED reflect the actual code; any design details that changed during implementation are noted inline.
>
> **Existing markdowns referenced:**
> - `roll2hit-v3.html` — single-file game (~14,377 lines, 515 div pairs, no external deps)
> - `story.md` — 76 nodes, 8 acts, all NPCs, all quests, all items, all battles
> - `maps.md` — grid coordinates, node network, travel connections
> - `world.md` — conditions, factions, Froberger's journal, loot context
> - `monsters.md` — full MONSTER_POOL (370 entries) with stats

---

## PART ONE — ARCHITECTURE OVERVIEW

### Two-Mode Game Engine

The game has exactly two modes. Switching between them is explicit and intentional — it is the core gameplay loop.

```
┌─────────────────────────────────────────────────┐
│                  STORY MODE                     │
│  Navigate nodes · Talk to NPCs · Use items      │
│  Collect loot · Read journal · Manage inventory │
│  Check quests · Sleep at inns · Progress story  │
└──────────────┬──────────────────────────────────┘
               │  🎲 START BATTLE trigger
               ▼
┌─────────────────────────────────────────────────┐
│                  BATTLE MODE                    │
│  Initiative · Attack rolls · Damage · Conditions│
│  Death saves · Win/Lose states · Loot drop      │
│  (Implemented in roll2hit-v3.html)              │
└──────────────┬──────────────────────────────────┘
               │  🎲 END BATTLE trigger
               ▼
         Back to STORY MODE
         (with outcome applied)
```

**Story Mode** is a text/UI overlay that runs on top of — or alongside — the existing roll2hit.com combat tracker. When a battle node is entered, the DM calls `🎲 START BATTLE` and the combat tracker takes over. When the battle ends, its outcome (win/lose, loot, HP remaining) is returned to Story Mode.

---

## PART TWO — STATE MACHINE

### Game States

```
                        ┌──────────┐
                        │  START   │ ← New game or load save
                        └────┬─────┘
                             │
                        ┌────▼─────┐
                   ┌───►│ EXPLORE  │◄──────────────┐
                   │    └────┬─────┘               │
                   │         │ enter battle node    │
              rest │    ┌────▼─────┐               │ battle ends
            + heal │    │ PRE_BATT │               │
                   │    └────┬─────┘               │
                   │         │ START BATTLE         │
                   │    ┌────▼─────┐               │
                   │    │  BATTLE  │───────────────►│
                   │    └──────────┘  (roll2hit)
                   │
              ┌────┴─────┐
              │   SLEEP  │ ← triggered at inn nodes
              └──────────┘
                   │
              ┌────▼─────┐
              │ DIALOGUE │ ← NPC interaction, quest accept
              └──────────┘
                   │
              ┌────▼─────┐
              │INVENTORY │ ← use item, equip, examine
              └──────────┘
                   │
              ┌────▼─────┐
              │  QUEST   │ ← check active quests, read journal
              └──────────┘
                   ▼
         ┌────────────────┐   ┌──────────┐   ┌─────────────┐
         │  VICTORY       │   │ GAME_OVER│   │ VOID DEFEAT │
         │ (Codex sealed) │   │ (HP = 0) │   │ Day49/Pres10│
         └────────────────┘   └──────────┘   └─────────────┘
```

### State Transition Rules

| From | To | Trigger |
|------|----|---------|
| EXPLORE | PRE_BATT | Player enters a node with `battle: true` |
| PRE_BATT | BATTLE | DM calls 🎲 START BATTLE (or auto-trigger) |
| BATTLE | EXPLORE | 🎲 END BATTLE + outcome applied |
| EXPLORE | SLEEP | Player arrives at inn node + pays cost |
| SLEEP | EXPLORE | Morning — HP restored, day counter advances |
| EXPLORE | DIALOGUE | Player interacts with NPC at current node |
| DIALOGUE | EXPLORE | Dialogue complete or player exits |
| EXPLORE | INVENTORY | Player opens inventory (any time) |
| EXPLORE | QUEST | Player opens quest log (any time) |
| Any → GAME_OVER | HP drops to 0 in battle; respawn at checkpoint available |
| SLEEP → VOID_DEFEAT | Day ≥ 49 with fewer than 7 shards; triggers Time Defeat |
| Any → VOID_DEFEAT | voidPressure reaches 10 (7 tide events + 3 exhaustion cycles) |
| CO (Node 42) → VICTORY | All 7 Shards collected + reached CO node |

---

## PART THREE — DATA SCHEMAS

### 3.1 — Character Sheet

```json
{
  "character": {
    "name": "string",
    "class": "string",              // adventurer / fighter / rogue / etc.
    "hp": {
      "current": 30,
      "max": 30
    },
    "gold": 150,
    "day": 1,                       // current story day (max 49)
    "voidPressure": 0,              // 0-10 scale, increases if deadlines missed
    "currentNode": "CI",            // 2-letter node code from maps.md
    "conditions": [],               // active conditions on player
    "equipment": {
      "weapon": "sword",
      "armor": "leather",
      "accessory": null
    },
    "stats": {
      "attack": 4,                  // flat attack bonus (matches ATK in monster_pool format)
      "dmgDie": 6,
      "dmgCount": 1,
      "dmgFlat": 2,
      "ac": 13
    }
  }
}
```

### 3.2 — Inventory Item

```json
{
  "item": {
    "id": "earthbind_root",
    "name": "Earthbind Root",
    "type": "condition_item",       // condition_item | quest_item | shard | supply | equipment | key | loot
    "condition": "prone",           // for condition_items: which condition it inflicts
    "uses": 2,                      // -1 = infinite
    "usable_in": ["pre_battle"],    // when it can be used: pre_battle | explore | dialogue
    "description": "Throw at feet before battle. Target is Prone — melee ADV, half move to stand.",
    "source_node": "FO",
    "acquired": false,
    "icon": "🌿"
  }
}
```

**Item types:**
- `condition_item` — used in PRE_BATT state to apply a condition (all 13 listed in world.md)
- `quest_item` — triggers quest state changes when examined or presented to an NPC
- `shard` — Codex Shards #1–7; presented at CO(42) to win
- `supply` — consumable supply packs (travel speed, HP regen)
- `equipment` — weapon/armor, improves character stats
- `key` — opens locked passages (Crypt Key, Sea Cave Key, etc.)
- `loot` — monetary or flavor loot from battles

### 3.3 — Inventory Container

```json
{
  "inventory": {
    "items": [ /* array of item objects */ ],
    "gold": 50,
    "maxSlots": 20,
    "shards": {
      "found": [1, 2],              // shard numbers collected
      "total": 7
    },
    "conditionItems": {
      "prone":         { "id": "earthbind_root",    "uses": 2, "held": true },
      "restrained":    { "id": "crones_web",         "uses": 1, "held": false },
      "blinded":       { "id": "flash_powder",       "uses": 2, "held": false },
      "paralyzed":     { "id": "neurotoxin_dip",     "uses": 1, "held": false },
      "stunned":       { "id": "thunderstone",       "uses": 2, "held": false },
      "grappled":      { "id": "snare_trap",         "uses": 1, "held": false },
      "petrified":     { "id": "basilisk_flask",     "uses": 1, "held": false },
      "jammed":        { "id": "signal_jammer",      "uses": 3, "held": false },
      "emp_stunned":   { "id": "emp_grenade",        "uses": 1, "held": false },
      "corrupted":     { "id": "void_virus",         "uses": 1, "held": false },
      "dodge_counter": { "id": "feint_scroll",       "uses": 1, "held": false },
      "cover_counter": { "id": "smoke_bomb",         "uses": 3, "held": false }
    }
  }
}
```

### 3.4 — Quest Entry

```json
{
  "quest": {
    "id": "find_shard_2",
    "name": "The Leshen's Grove",
    "status": "active",            // inactive | active | complete | failed
    "given_by": "Brother Aldric",
    "given_at_node": "FO",
    "objective": "Retrieve Shard #2 from the leshen's grove",
    "hint": "Aldric's Ward gives ADV on initiative. Use the Earthbind Root on the Leshen.",
    "reward": {
      "item": "grove_token",
      "gold": 0,
      "shard": 2
    },
    "completion_condition": {
      "type": "item_acquired",
      "item_id": "grove_token"
    },
    "journal_entries": [
      "Aldric sent me into the grove. He seems unsurprised this turned out to be my problem.",
      "The leshen guards the buried Shard. It won't give it up willingly."
    ]
  }
}
```

### 3.5 — Node Definition

```json
{
  "node": {
    "id": "FO",
    "number": 13,
    "name": "forest",
    "act": 3,
    "label": "Forest / Trees — Aldric's Territory",
    "coords": { "row": 5, "col": 3 },
    "connections": {
      "N": "HL",
      "E": "MI",
      "S": "SW",
      "W": null
    },
    "has_battle": true,
    "battle": {
      "enemies": [{ "key": "leshen", "count": 1 }],
      "trigger": "mandatory",      // mandatory | optional | hunt
      "optional_skip": false
    },
    "has_npc": true,
    "npc": "brother_aldric",
    "loot": [
      { "item_id": "earthbind_root", "count": 2, "source": "npc_gift" },
      { "item_id": "grove_token", "count": 1, "source": "quest_reward" }
    ],
    "sleep_available": false,
    "sleep_cost": 0,
    "story_text": "Ancient trees. Crow-marked trunks every 200 paces. A fire in the distance.",
    "exit_condition": "grove_token in inventory",
    "froberger_journal_entry": null,
    "condition_item_here": "earthbind_root",
    "void_pressure_event": false
  }
}
```

### 3.6 — Game Save State

```json
{
  "save": {
    "version": 1,
    "timestamp": "ISO8601",
    "character": { /* character schema */ },
    "inventory": { /* inventory schema */ },
    "quests": [ /* array of quest objects */ ],
    "visitedNodes": ["CI", "IN", "TV", "BA", "CR", "CY", "DK", "MQ", "FO"],
    "completedBattles": ["CR", "FO"],
    "flags": {
      "froberger_journal_found": true,
      "aldric_met": true,
      "voss_met": true,
      "auros_met": true,
      "void_tide_warnings": 1,
      "days_without_sleep": 0,
      "sleep_count": 2
    },
    "storyDay": 12,
    "currentAct": 3
  }
}
```

---

## PART FOUR — NAVIGATION SYSTEM

### Movement Model — MUD Cell Grid (§CELL-03, ✅ active)

Navigation is pure coordinate-based: pressing N/E/S/W always moves exactly **one grid cell**. There is no node-exit lookup, no corridor dialog, and no distance gating.

```javascript
// cellMove(dir) — the active movement handler
function cellMove(dir) {
  const DELTAS = { N:[-1,0], S:[1,0], E:[0,1], W:[0,-1] };
  const [dr, dc] = DELTAS[dir];
  const nr = S_story.playerR + dr;
  const nc = S_story.playerC + dc;

  // Bounds check (grid 1–300)
  if (nr < 1 || nc < 1 || nr > 300 || nc > 300) {
    storyMsg('You reach the edge of the known world.'); return;
  }
  if (IMPASSABLE_CELLS.has(`${nr},${nc}`)) {
    storyMsg('The sea is impassable on foot.'); return;
  }

  // Gate-lock checks (see cellMove in HTML for all 9 gates)
  const destCode = CELL_GRID[`${nr},${nc}`];
  // ... gate checks using destCode vs S_story.currentCode ...

  S_story.playerR = nr; S_story.playerC = nc;
  S_story.visitedCells[`${nr},${nc}`] = true;

  if (destCode && NODE_MAP[destCode]) {
    storyRender(NODE_MAP[destCode]);      // named node
  } else {
    _enterEmptyCell(nr, nc);             // open terrain
  }
}
```

**Key data structures:**

| Constant | Purpose |
|---|---|
| `CELL_GRID` | `"r,c"` → node code — built at startup from NODE_COORDS |
| `IMPASSABLE_CELLS` | `Set<"r,c">` — water/edge cells (populated in §CELL-10) |
| `TERRAIN_ENCOUNTER_RATE` | per-terrain encounter probability on empty cells |

**Empty cell traversal (`_enterEmptyCell`):**

When the player steps on a cell with no named node, `_inferTerrain(r,c)` polls the four cardinal neighbors in `CELL_GRID` and returns the majority terrain. The cell panel shows terrain name, coordinates, and an exit compass. A random encounter rolls against `TERRAIN_ENCOUNTER_RATE[terrain]`.

### Portal Nodes

Node OU → GA is a portal — instant, non-directional. Handled by `storyPortal()`, bypasses `cellMove` entirely.

### Gate Locks

Gate locks are checked inside `cellMove` using `destCode` (the node at the target cell). They are identical to the old `storyMove` checks:

| From | To (destCode) | Condition |
|------|--------------|-----------|
| any | TLS | shards < 7 |
| DAM | any | saulConverted → blind days / escapedDamascus gates |
| HTY | CI2 | commissionReceived |
| JRS | ADA | barnachVouchedHR + hellenistsThreaten |
| NUE | CAN | tideGateOpened |
| HCA | DS0 | defeatedBattles['HCA_BOSS'] |
| KIR | ZRH | defeatedBattles['KIR'] |
| WRO | BNX | huntHook2Received |
| ALF | VAW | lakeLairLocated |
| DA2 | DA3 | tideGateOpened |

### Time Cost

- Every `cellMove` call advances `hoursElapsed` and `hoursSinceSlept` by 1.
- Missing sleep at end of day: `voidPressure += 1`, DIS on next 2 battles.

### Legacy: storyMove_LEGACY

The old node-graph movement function (`storyMove`) has been renamed `storyMove_LEGACY`. It is retained until §CELL-05 removes all junction nodes. It is **not called** by any UI element — all D-pad buttons, keyboard handler, waypoint walker, and exit chips call `cellMove`.

---

## PART FIVE — LOOT SYSTEM

### Loot Tables (Static — All Locations Defined at Worldbuild Time)

Loot is fixed to story nodes — it does not randomize. The player always finds what the story says they find. Variation comes from whether they explored the node or not.

```
NODE LOOT MASTER TABLE:
Node  Code  Item(s)                              Type
────  ────  ──────────────────────────────────── ────────────
 1   CI    bloodstained_map                     quest_item
 2   IN    merchant_ledger, froberger_journal         quest_item
 3   TV    cipher_scrap                          quest_item
 4   BA    conclave_pass (buy, 15gp)             key
 5   CR    crypt_key, void_scratch_note          quest_item
 6   CY    signal_jammer, emp_grenade            condition_item
 7   DK    trade_seal (shard #1), smoke_bomb     shard + condition
 8   MQ    supply_pack, fragment_rubbing, flash_powder  supply + condition
 9   SF    real_map                              quest_item
10   MS    cargo_manifest                        quest_item
11   AL    [no loot — checkpoint]
12   MI    abandoned_pack                        quest_item
13   FO    aldric_ward, earthbind_root(×2), grove_token  shard + condition
14   HL    highland_horse, snare_trap            equipment + condition
15   SW    runed_stone                           quest_item
16   HS    sea_cave_key, crones_web              key + condition
17   BE    signal_torch                          quest_item
18   OC    feint_scroll                          condition_item
19   IS    kassiphanes_letter                    quest_item
20   AT    atlantis_fragment, tidal_rune(shard#3)  shard
21   SC    scholar_king_marker                   quest_item
22   FL    river_blessing (shrine gift)          consumable
23   DS    [no loot — combat only]
24   SE    [no loot — guide cost 3gp]
25   BK    [no loot — talk to Mordus]
26   GC    crimson_warrant (shard #4), void_virus  shard + condition
27   PC    treasure_crate (25gp), nautical_chart  gold + quest
28   MC    abandoned_scholar_pack               quest_item
29   CA    catacomb_map                          quest_item
30   VC    toll_token                            key
31   DE    desert_crossroads_marker             quest_item
32   DC    sand_cipher (shard #5), djinn_circle_location  shard
33   JU    ancient_road_marker, neurotoxin_dip   condition_item
34   BQ    thunderstone(×2), emp_grenade_v2      condition_item
35   SQ    highspire_fragment (shard #7)         shard
36   OU    portal_key                            key
37   GA    olympian_key (shard #6 location), basilisk_flask  shard + condition
38   KT    knights_favour                        equipment
39   OP    codex_shard_6                         shard
40   HC    [no loot — sky road transit]
41   AR    [no loot — detour only]
42   CO    codex_cradle (already there)          quest_item
```

### Battle Loot Drops

After a battle at any node, additional loot may drop. Roll drop table for the defeated enemy:

```json
{
  "drop_table": {
    "leshen":        { "gold": "1d6", "item": null,         "rate": 1.0 },
    "leshen":        { "gold": "1d6", "item": "monster_claw","rate": 0.3 },
    "void_shaman":   { "gold": "2d6", "item": "void_virus",  "rate": 1.0 },
    "dragon_turtle": { "gold": "3d8", "item": "dragon_scale","rate": 0.5 },
    "void_warlord":  { "gold": "10d10","item": "void_crown", "rate": 1.0 }
  }
}
```

Battle loot is ADDITIVE to static node loot — both can be collected after a fight.

---

## PART SIX — QUEST SYSTEM

### Quest Structure

Quests have three layers:
1. **Main Quest** — Collect all 7 Shards. Always active. Cannot be abandoned.
2. **Node Quests** — Triggered at specific nodes by NPCs or discoveries. Short objectives.
3. **Side Observations** — Froberger's journal entries. No objective, just world-building.

### Main Quest Gates

The main quest unlocks acts sequentially via item possession:

| Gate | Required Item | Unlocks |
|------|--------------|---------|
| Act I → II | bloodstained_map | Exit Birka toward Tilbury |
| Act II → III | trade_seal (shard 1) | Access midlands road |
| Act III → IV | grove_token (shard 2) + sea_cave_key | Sea arc |
| Act IV → V | tidal_rune (shard 3) | Return to land, Visby |
| Act V → VI | crimson_warrant (shard 4) | Desert road east |
| Act VI → VII | sand_cipher (shard 5) | Oracle audience |
| Act VII → VIII | all 6 shards + highspire_fragment (7) | Cosmic Realm |
| Final → Victory | all 7 shards at CO | Codex reforging |

### Active Quest Snippets (Quest Journal Items)

Quest journal entries are stored as `quest_item` type inventory objects. They have text content and serve as quest progress markers. Examples:

```
Item: "Muffat's Briefing"      → Acquired at DK(7) → Activates "Find Aldric" quest
Item: "Aldric's Task"         → Acquired at FO(13) → Activates "Retrieve Shard #2" quest
Item: "Kassiphane's Letter"   → Acquired at IS(19) → Activates "Visit Oracle" quest
Item: "Sweelinck's Letter"        → Acquired at SQ(35) → Activates "Deliver to Auros" quest
Item: "Froberger's Journal"        → Acquired at IN(2)  → Unlocks all 5 read-aloud entries
```

Quest items are never consumed — they remain in inventory as log entries.

---

## PART SEVEN — BATTLE MODE INTERFACE

### Pre-Battle State (PRE_BATT)

Before `🎲 START BATTLE`, Story Mode enters PRE_BATT:
1. Show enemy description (name, description from story)
2. Prompt: **"Use a Condition Item? [Y/N]"**
3. If Y: Show available condition items in inventory
4. Player selects item → condition applied to enemy before battle
5. Show condition effect summary: "Target enters battle as **Prone**. Your melee attacks have **ADV**."
6. Load enemy stats from MONSTER_POOL into the roll2hit combat tracker
7. Set ADV/DIS flags in tracker based on applied condition
8. Hand off to Battle Mode (roll2hit-v3.html takes over)

### Battle Mode Input/Output Contract

**Input to Battle Mode:**
```json
{
  "battle_input": {
    "player_hp": 28,
    "player_ac": 13,
    "player_atk": 4,
    "player_dmg": "1d6+2",
    "enemies": [
      { "key": "leshen", "name": "Leshen", "ac": 14, "hp": 65, "atk": 5,
        "dmg": "2d8+3", "condition": "prone", "adv_on_player": false }
    ],
    "player_adv": true,
    "source_node": "FO"
  }
}
```

**Output from Battle Mode:**
```json
{
  "battle_output": {
    "outcome": "win",               // win | lose | flee
    "player_hp_remaining": 14,
    "enemies_defeated": ["leshen"],
    "rounds": 4,
    "loot_drop": { "gold": 5, "item": null }
  }
}
```

### Win/Lose Outcomes

| Outcome | Story Effect |
|---------|-------------|
| **Win** | Normal story progression. Node loot available. |
| **Lose** | Per story: most nodes have a lose path. Player falls back to adjacent node, loses supplies or HP penalty. Story does NOT end on a single loss. |
| **Lose at HP=0** | GAME_OVER state — load from last inn (sleep save point) |
| **Flee** | Cost: 1 supply. Return to previous node. |

The **inn system** acts as a checkpoint save: when the player sleeps at an inn, `save.checkpointNode` is updated. Death respawns at the last inn with half HP.

---

## PART EIGHT — CONDITION ITEMS IN PRE-BATT

The 12 condition items (from world.md and conditions in roll2hit-v3.html) map directly to the existing CONDITION_ADV system in the combat tracker:

```
Condition Item          → roll2hit Condition Code   → Effect in tracker
────────────────────    ────────────────────────    ─────────────────────
Earthbind Root          → prone                     → ATK has ADV
Crone's Binding Web     → restrained                → ATK has ADV + enemy DIS
Flash Powder            → blinded                   → ATK has ADV + enemy DIS
Neurotoxin Blade Dip    → paralyzed                 → ADV + auto-crit melee
Thunderstone            → stunned                   → ADV + auto-hit
Highland Snare Trap     → grappled                  → ADV (if cornered)
Basilisk Eye Flask      → petrified                 → ADV + auto-crit (1 round)
Signal Jammer           → jammed                    → enemy DIS for 2 rounds
EMP Pulse Grenade       → emp_stunned               → enemy incapacitated 1 round
Void Virus Canister     → corrupted                 → enemy wastes 1 action
Feint Scroll            → [removes dodge DIS]       → clears enemy Dodge
Smoke Bomb              → [removes cover DIS]       → clears Half Cover
```

The PRE_BATT screen presents only the condition items the player currently holds in inventory.

---

## PART NINE — ITERATION LAYERS

The game is designed to be built in vertical slices. Each layer adds one complete interaction type. Nothing is mocked — each layer is real and usable.

### Layer 0 — ✅ IMPLEMENTED
- Combat tracker (`roll2hit-v3.html`): attack rolls, damage, conditions, death saves, monster presets, terrain-filtered monster selection
- All 370 monsters in `MONSTER_POOL`
- 46 base + 20 epic = 66 terrains in `WORLD_DB`

### Layer 1 — ✅ IMPLEMENTED (§CELL-03 supersedes navigation)
- `NODE_MAP` (76+ nodes) with `N/S/E/W` connections from maps.md
- `storyMove(direction)` (now renamed `storyMove_LEGACY`) — node-graph navigation
- **§CELL-03:** `cellMove(dir)` replaces `storyMove` — one grid cell per keypress, `CELL_GRID` lookup, `_enterEmptyCell` for open terrain
- D-pad buttons (N/E/S/W) + keyboard arrows/WASD → `cellMove`
- Node header, story text box, exits shown as available/blocked

### Layer 2 — ✅ IMPLEMENTED
- `S_story` state: HP, gold, day, shards, voidPressure, inventory array, visited set
- Static loot rendered as chips on first visit; items added to inventory on click
- Inventory overlay (`[I]` key): shows all items with Use/Drink buttons
- 4-column left sidebar: Act badge, travel log, character stats, action buttons

### Layer 3 — ✅ IMPLEMENTED
- `QUEST_DB` with main quests and sidequests; `completeFn` for programmatic completion
- NPC activation at keyed nodes auto-starts quests on first visit
- Froberger's journal entries surfaced via journal modal at journal-loot nodes
- Quest overlay (`[Q]` key): active and completed quest lists

### Layer 4 — ✅ IMPLEMENTED
- PRE_BATT overlay: condition item selection before battle starts
- `S_story.pendingBattle` carries enemy preset into Battle Mode
- Battle outcome modal on return: enter remaining HP → apply to story HP
- GAME_OVER modal on HP=0 with respawn or new game options

### Layer 5 — ✅ IMPLEMENTED
- `S_story.day` counter (max 49) and `voidPressure` (0–10) scale
- Inn nodes: sleep overlay shows HP restore preview, cost, day advance; updates `checkpointNode`
- Void Tide modal fired at day thresholds (20, 30, 40, 49)
- Missing sleep tracking: `battleDis` flag adds DIS to next 2 battles after skipping an inn

### Layer 6 — ✅ IMPLEMENTED
- `storyAutoSave()` — writes `S_story` to `r2h_autosave` on every node render
- `storySaveCheckpoint()` — writes to `r2h_checkpoint` on inn sleep
- Continue modal on load: shows Day/location/item count from autosave
- Respawn from checkpoint: full HP restore at last inn node
- `storyCheckContinue()` runs before `storyRender()` to prevent autosave overwrite

### Layer 7 — ✅ IMPLEMENTED
- `GATE_LOCKS` array: CR→CY (Crypt Key), SC→FL (Sea Cave Key), AL→SE (Conclave Pass), VC→DE (Toll Token)
- Shard gate: CO requires all 7 shards
- `storyMove()` checks gate locks and displays blocked message with required item name
- Victory modal at CO: shows day/HP/gold/items/quests stats on Codex reforging

### Layer 8 — ✅ IMPLEMENTED (scope expanded beyond original "Polish" plan)
**Original plan:** Froberger's journal read-alouds, survival pressure callouts, NPC dialogue.  
**Actual implementation — all of the above plus:**
- `MONSTER_DROPS`: every monster in MONSTER_POOL has a drop (name, icon, sell value). Drop staged on kill via `battKillEvent()` → transferred to inventory on Victory outcome.
- **Victory banner** (`#battle-victory-banner`): fixed bottom bar in Battle Mode showing enemy name + drop on kill.
- **Flee / Run Away** (`🏃 Flee` button in Battle Mode header): enemy gets one free attack, then player auto-returns to Story Mode. `S_story.pendingBattle` cleared — no credit, no drops. *This is a Battle Mode mechanic, not Story Mode.*
- **Vendor system** at 5 nodes (BA, MQ, SF, IS, BK): sell trophies, buy potions, buy Transmort Scrolls.
- **POTION_TIERS**: 4 healing tiers (Minor/Healing/Greater/Superior: 10/25/50/100 HP, costs 50/150/400/1000gp) + Transmort Scroll (200gp). Exponentially priced to match HP scaling across levels 1–20.
- **Hearth Home**: any inn can be set as home base (`S_story.hearthHome`). Default: CI.
- **Transmort Scroll**: consumes item, teleports player to Hearth Home, triggers normal node render.
- **Sidequests**: `sq_battling` (collect 3 drops) and `sq_leveling` (win 5 battles) using `completeFn` for automatic tracking.

### Layer 9 — ✅ IMPLEMENTED (corridor system superseded by §CELL)
- **Circuit corridors**: `CORRIDOR_CELLS` computed grid; key `"r,c"` → `{dirs, glyph, terrain, edges}` — still rendered on minimap
- **Junction nodes J1–J7 + MT**: 8 named navigation nodes; thousands of auto-generated J##### nodes — to be removed in §CELL-05
- `buildCorridorMap()`, `storyCorridorTravel()`, `_setActivePath()` — retained for minimap wire-glyph rendering; corridor travel dialog is no longer shown
- **§CELL-02:** `CELL_GRID` + `IMPASSABLE_CELLS` — reverse grid lookup
- **§CELL-03:** `cellMove(dir)` — one cell per keypress, replaces corridor/node-graph navigation
- **§CELL-04:** `_inferTerrain()`, `_enterEmptyCell()`, `TERRAIN_ENCOUNTER_RATE` — open cell traversal with random encounters

### Layer 10 — ⊘ REMOVED (§TIMELESS-01)
- The Hunt/Stalk layer was removed in §TIMELESS-01. Gone: `HUNTING_GROUNDS`, the 🎯 STALK d-pad chip, `storyStalk()` / `_stalkedMonsterPick()` / `_getQuestTargetKeys()`, and the stalk modal (terrain name + quest targets + Wait/Abandon flow).
- Replacement: empty-cell movement rolls a single `TERRAIN_ENCOUNTER_RATE` encounter via `_weightedMonsterPick()` (§CELL-04 / FL9). The MT node remains as an ordinary `mountains`-terrain location. See `lab-reports/lab-report-timeless-movement-hunt-removal.md`.

### Layer 11 — ✅ IMPLEMENTED
- **Story Battle Focus System**: `#story-battle-overlay` full-screen takeover during combat
- Initiative rolls with tier modifiers: trivial −2, easy 0, medium +1, hard +3, deadly +5
- Pre-battle 3-tab overlay: Fight / Condition / Stealth
- Enemy auto-turn fires 1.2s after player action resolves
- Victory overlay (`#story-victory-overlay`) with XP, HP recovered, gold, drops

### Layer 12 — ✅ IMPLEMENTED
- **Dynamic XP**: `XP = AC × maxHP` replaces flat tier values
- **Heal on kill**: `floor(0.1 × AC × maxHP)` applied immediately on kill
- **Gold drop**: same formula as heal — tougher enemies pay more
- **d20 loot table** (`LOOT_TABLE`): 8 Minor / 2 Spell Scroll / 5 Healing / 3 Greater / 2 Superior — rolled automatically on kill

### Layer 13 — ✅ IMPLEMENTED
- **Short rests**: 3 charges/day; rest button always enabled (`btn-dpad-rest`); 0 rests → auto-BFS to nearest inn and sets `S_story.waypoint`
- **Boyscout Token**: first short rest at any node pushes `{name:'Necklace Token', icon:'🏕', type:'token'}` to inventory; tracked per node in `S_story.shortRestedAtNodes: {}`
- **Dice-based inn sleep**: `storyConfirmSleep()` rolls d10s + CON mod; first sleep at a node = 2 rolls (Boyscout Night), revisit = 1 roll; minimum 50% hpMax; resets short rests to 3

### Layer 14 — ✅ IMPLEMENTED
- **Overlay separation**: `#story-battle-overlay` hides main-body; `#practice-badge` in non-story mode
- **⚙ God Mode button**: toggle in battle overlay header; reveals Advanced/Refocus panels
- **Advanced/Refocus symmetric toggle**: one button opens, same area closes

### Layer 15 — ✅ IMPLEMENTED
- **Story death saves**: `_storyEnterDeathSaves()`, `_storyRollDeathSave()` — 3 successes survive, 3 failures die
- **Corpse quests**: `S_story.corpsesQuests` tracks nodes where player fell; NPC quests reference them
- **`#sbo-death-save-panel`**: integrated into battle overlay, not a separate modal
- `STARTER_DAGGER` const: Rusted Dagger spawned in inventory at new game start

### Layer 16 — ✅ IMPLEMENTED
- **Condition rounds**: `conditionRoundsLeft` counts down each enemy turn; condition icon clears at 0
- **DIS display**: `#sbo-dis-badge` with `has-dis` CSS class on overlay when player has disadvantage
- **Spell Scrolls** in LOOT_TABLE (2/20 = 10%); use in bonus phase queues ADV on next attack
- **`_renderSboSpells()`**: spell row in battle overlay

### Layer 17 — ✅ IMPLEMENTED
- **1.5 AP action economy**: main action (1.0 AP) + bonus action (0.5 AP) per round
- **Shield mechanic**: `SHIELD_ITEMS` (Buckler +1 AC / Heater Shield +2 AC); equip as bonus action
- **`_calcPlayerAc()`**: computes player AC including base + shield + level bonus
- **Wimper (pass)**: passes current phase only (not whole turn); opens bonus phase safely
- **Flee ⚠ / Flee ✓**: mutual attacks if fleeing in main phase; clean exit in bonus phase
- **`usedMainAttack` / `usedBonusAction`**: track AP consumption per round

### Layer 18 — ✅ IMPLEMENTED
- **Character levels 1–10**: `XP_LEVELS` thresholds; `_LEVEL_REWARDS` HP/ATK/AC gains
- **`_checkLevelUp()`**: recursive; fires on every XP award in `_storyBattleVictory()`
- **`S_story.level / atkBonus / acBonus`**: persistent across the run
- **CONDITION_GOLD ×100**: conditions now 1,000–5,000gp — decisive mid-game tactical tools
- **Flashbang** (`COMBAT_ITEMS`): 150gp, guaranteed ADV on next attack, costs bonus action
- **`usedRealAttack`** flag: gates offhand — requires a real attack (not wimper) this round

### Layer 19 — ✅ IMPLEMENTED
- **Starting kit**: 2× Minor Healing Potion + Rusted Dagger at new game start; gold 150gp
- **Condition hint**: "Conditions unlock as you earn gold. Cheapest: Feint Scroll at 1,000 gp."
- **Safe retreat**: pre-battle cancel renamed "← Retreat (safe)" with tooltip
- **Stealth description**: "roughly 25–80% chance" added to tab
- **Wimper redesign**: passes only the current phase (main OR bonus), not both
- **AP hint row**: "Attack · or Pass to open bonus (heal / flee)"
- **`usedRealAttack`** flag: offhand requires real attack (not wimper); resets each round
- **Enemy threat badge** (`#prebatt-threat`): tier label + AC/HP/ATK from `MONSTER_POOL`

### Layer 20 — ✅ IMPLEMENTED
- **`story-defeat-modal`**: distinct from combat-death gameover; shared by two defeat types
- **`storyVoidDefeat(type)`**: `'time'` (Day 49 sleep) and `'void'` (pressure 10); shows run stats
- **Day-49 defeat**: `storySleep()` on day ≥ 49 calls `storyVoidDefeat('time')` and returns immediately
- **Void pressure defeat**: each exhaustion cycle (2 missed inns) adds +1 voidPressure; at 10 → defeat
- **Enhanced victory**: `vic-level`, `vic-xp`, `vic-battles` added to Codex-reforged modal
- **No respawn** from void/time defeat — only New Game; combat death retains checkpoint respawn

### Layer 21 — ✅ IMPLEMENTED
- **Fighter level-up system**: `FIGHTER_FEATURES` (20 entries), `_ASI_TABLE`, `_LEVEL_GOLD_GIFT`, `_LEVEL_SHIELD_GIFT`
- **`_showLevelUpModal()`**: interactive HP roll (`🎲 Roll d10`), ASI 2-point player allocation, feature grant
- **`S_story.abilityScores`**: `{str, dex, con, int, wis, cha}` — persistent; affects attack, AC, healing

### Layer 22 — ✅ IMPLEMENTED
- **`SHIELD_ITEMS`** 6 tiers (acBonus +1–+6, minLevel 1/1/5/10/15/20); **`DAGGER_ITEMS`** 4 offhand daggers (+1/+2/+3/+4, minLevel 5/10/15/20) — each with `tier` + `minLevel` fields
- **`_rollWeaponDrop()`**: 12% chance per battle; gives lowest eligible dagger player doesn't own
- **`storyRenderInventory()`**: Weapons section for `type:'weapon'`; equip/unequip handlers

### Layer 23 — ✅ IMPLEMENTED
- **`_notoriety()`**: `level × 3 + floor(battlesWon / 2)`; shown in status panel as `#s-notoriety`
- **`_notorietyWeights(n)`**: bracket table → `{trivial, easy, medium, hard, deadly}` weights
- **`_weightedMonsterPick`**: uses notoriety weights for tier expansion. *(`_stalkedMonsterPick` + its ×6 quest boost and the `10 + notoriety×1.5 + questCount×4` corridor encounter formula were removed in §TIMELESS-01.)*

### Layer 24 — ✅ IMPLEMENTED
- **`WEAPON_ITEMS`**: 70 entries (14 base × 5 magic tiers); `{tier, name, icon, type:'mainweapon', die, count, magicBonus, minLevel}`
- **`equippedMainWeapon`**: synced into `S.weapon` (die/count/magicBonus) on `_showBattleOverlay()`; restored on exit
- **`_rollMainWeaponDrop()`**: 15% per battle; picks random eligible weapon not already owned

### Layer 25 — ✅ IMPLEMENTED
- **d100 unified drop table**: `_rollD100Loot()` with 3-reroll fallback; replaces 3 separate drop calls
- **`_magicTierAllowed(magicBonus)`**: gates drops + vendor by `level >= magicBonus × 5`
- **`XP_LEVELS`**: rebalanced 20-level array (max 195,000 XP)

### Layer 26 — ✅ IMPLEMENTED
- **Offhand slot exclusivity**: equipping a dagger displaces shield to inventory; equipping a shield displaces dagger

### Layer 27 — ✅ IMPLEMENTED
- **`_autoSellDuplicates()`**: on vendor open (once per node), identifies inferior items by category, sells them, adds gold
- **`storySellEquipment()`**: explicit sell button (`⚔ Sell Equipment`) in vendor panel

### Layer 28 — ✅ IMPLEMENTED
- **`BOSS_COMMANDER_AUROS`**: AC22 / HP300 / ATK+12 / 3d8+6; triggered via `storyPreFinalBattle()` at CO node
- **`storyCheckVictory()`**: gated behind defeating boss — pulsing chip at CO node signals it's available

### Layer 29 — ✅ IMPLEMENTED
- **HP roll ceremony**: player clicks `🎲 Roll d10`; result revealed interactively in level-up modal
- **ASI stat choice**: player allocates 2 stat points to any ability score (no random table)
- **Superior Critical**: Lv15 crits on 18–20; Lv20 crits on 17–20 in `_storyPlayerAttack()`
- **Action Surge**: `⚡ Surge` button in battle (Lv2+, once per short rest); resets main action for +1.5 AP

### Layer 30 — ✅ IMPLEMENTED
- **`_renderWorldMiniMap()`**: iterates 14×23 `NODE_COORDS` grid; gold=current, green=visited, dim=unvisited, near-black=empty
- **Corridor cells**: glyphs + `cx-*` border classes for directional connectors; sealed-square grid (9×9 cells, `gap:1px`)

### Layer 31 — ✅ IMPLEMENTED
- **`_bfsPath(fromCode, toCode)`**: BFS through NODE_MAP N/S/E/W links; returns `[{from, dir, to}]` step array
- **WAYPOINT button**: replaces NEW GAME in story left panel; shows hop count or "Here:" when at destination
- **`storyWaypoint()`**: moves one BFS step toward waypoint; opens quest panel if at waypoint or none set
- **`storySetWaypoint(code)`**: sets `S_story.waypoint`; custom terrain quest via `storyCreateCustomQuest()`

### Layer 32 — ✅ IMPLEMENTED
- **7×7 local mini-map** (`#mini-map-grid`): restored parallel to world map; 184×182px matching world map dimensions

### Layer 33 — ✅ IMPLEMENTED
- **`#story-nsew`**: exit block right of world map; `#exit-N/E/W/S` lines show direction + node label + terrain
- **`_terrainLabel(nodeName)`**: looks up `WORLD_DB[name].label`; also used in node title (`"05 · The Birka Crypt · Crypt"`)

### Layer 34 — ✅ IMPLEMENTED
- **12 vermin monsters**: trivial/easy tier (AC ≤ 5, HP 2–20) in `MONSTER_POOL` for `city_slums` terrain
- **`city_slums` terrain** in `WORLD_DB`; **SL node** (num:51, `N:'SL'` from CI) in `NODE_MAP`; `SL:{r:4,c:16}` in `NODE_COORDS`
- **`HUNTING_GROUNDS`** *(later removed §TIMELESS-01)*: `city_slums: { displayName:'The Vermin Pit' }` added; vermin added to `city` terrain too

### Layer 35 — ✅ IMPLEMENTED
- **Victory banner auto-dismiss**: 1.4s fade when `S_story.active`; auto-calls `storyEnter()` to return to story
- **Terrain in node title**: `_terrainLabel()` in `storyRender()` — `"05 · The Birka Crypt · Crypt"`

### Layer 36 — ✅ IMPLEMENTED
- **`FIGHTER_FEATURES`**: 20-entry array with feature name, icon, tattoo name, rest gate, shortRest/longRest/asi/bonusHpRoll flags
- **Tattoo system**: each level-up pushes `{type:'tattoo', lvl, name, icon, feature, …}` to `S_story.tattoos[]`
- **Bonus HP roll levels (7, 10, 13, 18)**: second `🎲 Roll d10` in level-up modal; result stored in tattoo item
- **Extra Attack I/II/III (Lv 5/11/20)**: `_extraAttackCount()` → 1–4 rolls per main action; each fully resolved
- **Indomitable I (Lv 9)**: `S_story.indomitableCharges`; failed death save → reroll, decrement charge; resets on long rest
- **Action Surge charges**: `S_story.surgeCharges` (replaces boolean); Lv17 grants 2 charges/short rest
- **Character sheet overlay** (`#story-char-overlay`): `👤 Character` button → `storyCharToggle()`; renders via `storyRenderCharSheet()`
- **`progRows()` loop**: generates `.cs-prog-row` + `.cs-tattoo-row` pairs for levels 1–20 interleaved; earned rows use earned styling, future rows use `.upcoming` muted styling
- **`storyCharToggle()` auto-sync**: on open when `S_story.active`, syncs `char-level`, `char-ac`, `char-maxhp`, `ab-str`…`ab-cha` simulator inputs from `S_story`, then calls `syncCharFromUI()`

### Layer 37 — ✅ IMPLEMENTED
- **D-pad 3×3 grid**: NW=🧙 NPC, N=↑, NE=⚔ Battle, W=←, Center=🗡 Stalk, E=→, SW=🛌 Rest, S=↓, SE=⏳ Wait *(§TIMELESS-01: the Center Stalk button is now an inert spacer and the SE Wait button + `storyQuickWait` were removed — encounters roll automatically on empty-cell movement)*
- **Starting kit**: `STARTER_POINTY_STICK` (1d4 main weapon) + `STARTER_FLINT_DAGGER` (atkBonus:−3 offhand) equipped at new game; 2× Minor Healing Potion + Rusted Dagger in inventory
- **Boyscout Token**: first short rest at any node → `{name:'Necklace Token', icon:'🏕', type:'token'}` added to inventory; tracked in `S_story.shortRestedAtNodes: {}`
- **Auto-inn waypoint**: `storyShortRest()` on 0 charges → BFS finds nearest `sleep:true` node, auto-sets `S_story.waypoint` + calls `_updateWaypointBtn()`
- **`storyQuickWait(nodeCode)`** *(removed §TIMELESS-01)*: was the SE button; `_weightedMonsterPick()` picked a random terrain encounter. Empty-cell movement now rolls that encounter automatically.
- **CatNabbing Eagle**: renamed from Catnapping Eagle (key: `catnabbing_eagle`) in MONSTER_POOL + city_slums terrain

---

## PART TEN — OVERHEAD VIEW DESIGN

The game is presented as a **top-down overhead map** with direct N/E/S/W movement — the same mechanical paradigm as classic MUD games or Zork-era text adventures, but with a visual map layer.

### View Modes

```
┌─────────────────────────────────────────────────────────────────┐
│ STORY MODE — OVERHEAD VIEW                                       │
├──────────────────────────┬──────────────────────────────────────┤
│  MAP PANEL               │  NODE PANEL                          │
│  (mini-map from maps.md) │  Node Name: FOREST                   │
│                          │  Node #13 — Act III                  │
│  [AR]                    │                                      │
│  [SQ][BQ][OU]            │  "Ancient trees. Crow-marked trunks  │
│  [HL]                    │   every 200 paces. Then a fire."     │
│  [FO] ← YOU              │                                      │
│  [SW]                    │  Exits: N(Highlands) E(Midlands)     │
│                          │         S(Swamp)                     │
│                          │                                      │
├──────────────────────────┤  NPC: Brother Aldric                 │
│  CHARACTER               │  🎲 BATTLE AVAILABLE (Leshen)        │
│  HP: 28/30               │  🌿 LOOT: Earthbind Root (×2)        │
│  Gold: 35gp              │                                      │
│  Day: 10/49              │  [Move] [Talk] [Battle] [Loot]       │
│  Shards: 1/7             │  [N]    [E]    [S]      [W]          │
└──────────────────────────┴──────────────────────────────────────┘
```

### HUD Always-Visible Elements
- Current node name + number
- HP bar (current/max)
- Gold
- Day counter (X/49)
- Shard progress (X/7)
- Void Pressure indicator (0-10)
- Active conditions on player

### Battle Mode Takeover
When a battle is triggered, the roll2hit.com combat tracker replaces the Story Mode view entirely (full-screen takeover). On `🎲 END BATTLE`, story view returns with outcome applied.

---

## PART ELEVEN — D-PAD, CHARACTER SHEET & KEY FUNCTIONS

### D-Pad 3×3 Layout

The story navigation control is a 3×3 grid of buttons. Corner buttons are `.dpad-corner` (34×34px, secondary styling); cardinal buttons are `.dpad-btn` (standard); center is `.dpad-center` (48×48px, primary styling).

```
┌──────────┬──────────┬──────────┐
│ 🧙 NPC   │  ↑ N     │ ⚔ Battle │  ← NW corner / N cardinal / NE corner
│btn-dpad- │ btn-N    │btn-battle│
│npc       │          │          │
├──────────┼──────────┼──────────┤
│ ← W      │ (spacer) │  E →     │  ← W cardinal / Center inert spacer / E cardinal
│ btn-W    │dpad-     │ btn-E    │
│          │center-   │          │
│          │spacer    │          │
├──────────┼──────────┼──────────┤
│ 🛌 Rest  │  ↓ S     │  (none)  │  ← SW corner / S cardinal / SE empty
│btn-dpad- │ btn-S    │          │
│rest      │          │          │
└──────────┴──────────┴──────────┘
```

> *(§TIMELESS-01: the Center button — formerly 🗡 Stalk / 🎯 Hunt-toggle (`btn-dpad-stalk` / `#btn-hunt-toggle`) — is now an inert `dpad-center-spacer` that keeps the 3×3 grid shape, and the SE ⏳ Wait button (`btn-dpad-wait`) was removed. Encounters roll automatically on empty-cell movement.)*

**Disable logic** (applied in `storyRender()` on every node render):

| Button | Enabled when |
|--------|-------------|
| `btn-dpad-npc` | `node.npc && NPC_DIALOGUE[node.code]` |
| `btn-battle` | `node.battle && !S_story.defeatedBattles[node.code]` |
| `btn-dpad-rest` | always (0 rests triggers auto-inn quest instead of refusing) |

*(§TIMELESS-01 removed the `btn-dpad-stalk` and `btn-dpad-wait` rows — both were gated on the now-deleted `HUNTING_GROUNDS`.)*

### CSS Classes — D-Pad & Character Sheet

```css
/* D-pad corner buttons */
.dpad-corner {
  width: 34px; height: 34px; font-size: 13px; padding: 0; border-radius: 4px;
  background: #180a04; border-color: #3d1510; color: #b07040;
}
.dpad-corner:hover:not(:disabled) { background: #2a1208; border-color: #E76219; color: #FEA712; }
.dpad-corner:disabled { opacity: 0.18; cursor: default; }

/* D-pad center — inert spacer since §TIMELESS-01 (was the Stalk/Hunt button).
   .dpad-center + its hover/active rules were removed; the center is now an empty
   <span class="dpad-center-spacer"></span> that just holds the 3×3 grid shape. */
.dpad-center-spacer { display: block; }

/* Character sheet — feature row (one per level) */
.cs-prog-row { display:flex; align-items:center; gap:4px; font-size:11px; padding:2px 0; color:#FDDCA9; }
.cs-prog-row.upcoming { color:#3d2010; }

/* Character sheet — tattoo sub-row (indented below each feature row) */
.cs-tattoo-row { display:flex; align-items:center; gap:4px; font-size:10px; padding:1px 0 3px 14px;
  border-left:2px solid #562717; margin-left:14px; color:#b07040; }
.cs-tattoo-row.upcoming { color:#2a1208; border-left-color:#2a1208; }
```

### Key Functions Reference

| Function | Location | Purpose |
|----------|----------|---------|
| `cellMove(dir)` | story mode | **Primary movement handler** — moves one grid cell per call; gate checks; CELL_GRID lookup; calls storyRender or _enterEmptyCell |
| `_enterEmptyCell(r, c)` | story mode | Renders an unnamed cell — infers terrain, shows exits, rolls random encounter |
| `_inferTerrain(r, c)` | story mode | Returns majority terrain name from CELL_GRID cardinal neighbors; fallback 'midlands' |
| `storyMove_LEGACY(dir)` | story mode | Old node-graph navigator — retained until §CELL-05; **not called by any UI element** |
| `storyShortRest(nodeCode)` | story mode | Heals, grants Boyscout Token on first visit, or auto-sets inn waypoint on 0 charges |
| `storyConfirmSleep(nodeCode)` | story mode | Dice-based HP heal (2×d10+CON first sleep, 1×d10+CON revisit); min 50% hpMax |
| `storyCharToggle()` | story mode | Opens/closes `#story-char-overlay`; syncs simulator inputs from `S_story` on open |
| `storyRenderCharSheet()` | story mode | Renders stat header, ability grid, equipment strip, and `progRows()` interleaved feature/tattoo list |
| `progRows()` | inner of `storyRenderCharSheet` | Loops levels 1–20; generates `.cs-prog-row` + `.cs-tattoo-row` pairs; earned vs `.upcoming` |
| `storyShowNpc(nodeCode)` | story mode | Opens NPC dialogue overlay from `NPC_DIALOGUE[nodeCode]` |
| `_bfsPath(from, to)` | utility | BFS step array for waypoint navigation and auto-inn search (uses NODE_MAP N/S/E/W — §CELL-06 will rewrite to use CELL_GRID) |
| `_weightedMonsterPick(terrain)` | battle | Picks random monster weighted by `_notorietyWeights()`; called by `_enterEmptyCell` on empty-cell encounter rolls |
| `_extraAttackCount()` | battle | Returns 1/2/3/4 attack rolls per main action based on level (Lv1/5/11/20) |
| `_notoriety()` | utility | `level × 3 + floor(battlesWon / 2)` — scales encounter difficulty dynamically |

---

## APPENDIX — FILE REFERENCE

| File | Purpose | Role in Engine |
|------|---------|----------------|
| `roll2hit-v3.html` | Combat tracker | Battle Mode (already implemented) |
| `story.md` | Story document | Source for node text, NPC dialogue, quest descriptions |
| `maps.md` | Grid map + node network | `NODE_MAP` data, travel connections, coordinates |
| `world.md` | World lore, conditions, Froberger | Condition item descriptions, NPC profiles |
| `monsters.md` | Monster stats reference | Verified against `MONSTER_POOL` in HTML |

### Current State
All 37 layers are implemented in `roll2hit-v3.html` (~143,000 lines). The single-file, no-CDN architecture is complete. Story Mode and Battle Mode share a single mutable `S_story` state object. Layers 21–37 added the Fighter level-up system (tattoos, Extra Attack, Action Surge, Indomitable), d100 unified loot, notoriety scaling, world minimap, waypoint BFS, city slums node, and the d-pad 3×3 grid with Boyscout Token camping mechanics and character sheet overlay.

**§CELL migration (in progress — 2026-06-13):**
- §CELL-02 ✅ `CELL_GRID` + `IMPASSABLE_CELLS` added
- §CELL-03 ✅ `cellMove()` replaces `storyMove` — MUD cell grid navigation live
- §CELL-04 ✅ `_enterEmptyCell()` / `_inferTerrain()` / `TERRAIN_ENCOUNTER_RATE` — open terrain traversal
- §CELL-01, §CELL-05 through §CELL-11 planned — see `plan-archive.md §CELL`


---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
