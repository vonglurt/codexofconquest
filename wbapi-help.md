<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Roll2Hit World Builder API — Reference

## Quick start

```bash
# Query
node wbapi-cli.js get location CY
node wbapi-cli.js list quests --node CY
node wbapi-cli.js get quest quest_wis_01

# Edit inline
node wbapi-cli.js edit quest quest_wis_01 passText "You recalled the words."
node wbapi-cli.js edit node CY name "New Cyrn"

# Edit from file
node wbapi-cli.js edit quest quest_wis_01 passText --file world/CY/npcs/aldric/quests/quest_wis_01/passText.txt

# Rename a node (re-links all quests + npcs automatically)
node wbapi-cli.js move node CY CY2

# Export all content to editable files
node wbapi-cli.js export ./world

# Apply edits back to game file
node wbapi-cli.js sync ./world

# Save timestamped HTML
node wbapi-cli.js save
```

---

## Data schemas

### Node
A location on the world map.

| Field     | Type    | Description |
|-----------|---------|-------------|
| `name`    | string  | Display name shown on map |
| `terrain` | string  | Terrain key — must match a key in WORLD_DB (e.g. `ruins`, `city`, `dungeon`) |
| `act`     | number  | Story act (1–5) |
| `battle`  | boolean | Whether combat can occur here |
| `npc`     | string  | Inline NPC name (for simple NPCs not in BIRKA_NPC_PROFILES) |
| `desc`    | string  | Short description shown in location panel |
| `locked`  | boolean | Hidden from player until unlocked by a quest flag |

**Example node.json:**
```json
{
  "id": "CY",
  "name": "Cyrn",
  "terrain": "ruins",
  "act": 2,
  "battle": true
}
```

---

### Quest
A mission given to the player.

| Field          | Type   | Description |
|----------------|--------|-------------|
| `title`        | string | Display title |
| `type`         | string | `main` / `side` / `skill_check` / `hunt` |
| `hook`         | string | Intro text shown when quest is offered |
| `passText`     | string | Text shown on success |
| `failText`     | string | Text shown on failure |
| `rewardText`   | string | Reward flavour text |
| `npc`          | string | NPC key who gives this quest |
| `activateNode` | string | Node code where quest becomes available |
| `waypointNode` | string | Node code where quest is completed |
| `gold`         | number | Gold reward on pass |
| `xp`           | number | XP reward on pass |
| `dc`           | number | Difficulty class (skill_check type) |
| `stat`         | string | Stat used for skill check (e.g. `wis`, `int`) |

**Text fields** (`title`, `hook`, `passText`, `failText`, `rewardText`) can be edited as plain `.txt` files in the world folder — all formatting is plain text.

**Example meta.json** (non-text fields):
```json
{
  "id": "quest_wis_01",
  "type": "skill_check",
  "npc": "aldric_stonehammer",
  "activateNode": "CY",
  "waypointNode": "CY",
  "dc": 14,
  "stat": "wis",
  "gold": 50,
  "xp": 100
}
```

---

### NPC
A named character at a location.

| Field        | Type   | Description |
|--------------|--------|-------------|
| `name`       | string | Display name |
| `occupation` | string | Role or job title |
| `node`       | string | Node code where NPC lives |
| `greeting`   | string | Default dialogue text |

**Example npc.json:**
```json
{
  "key": "aldric_stonehammer",
  "name": "Aldric Stonehammer",
  "occupation": "Archivist",
  "node": "CY"
}
```

---

### Monster
An enemy encountered in combat.

| Field  | Type   | Description |
|--------|--------|-------------|
| `name` | string | Display name |
| `tier` | number | Difficulty tier 1–5 |
| `hp`   | number | Hit points |
| `ac`   | number | Armor class |
| `cr`   | string | Challenge rating |
| `type` | string | humanoid / beast / undead / construct / … |
| `size` | string | tiny / small / medium / large / huge |
| `drop` | object | `{ gold: N, items: ["item name", …] }` |

---

## Loot Drop System

The game uses three distinct drop channels after every battle. They do not overlap.

### Channel 1 — Monster Trophy (MONSTER_DROPS)
A single themed item keyed per monster. Always drops on kill. Sell-only (no equip). Accessible via `GET /api/drops` or `GET /api/monster/{key}/drop`.

### Channel 2 — Monster Weapon Drop (`_rollMonsterWeaponDrop`)
One base weapon drop per kill. Weapon die ≤ monster's own dmgDie. Quality is rolled on **1d6**:

| d6 | Bonus | Prefix   | Probability |
|----|-------|----------|-------------|
| 1  | −4    | Wrecked  | 1-in-6      |
| 2  | −3    | Rusted   | 1-in-6      |
| 3  | −2    | Chipped  | 1-in-6      |
| 4  | −1    | Worn     | 1-in-6      |
| 5  |  0    | (base)   | 2-in-6      |
| 6  |  0    | (base)   | 2-in-6      |

Monsters **never** drop +1, +2, +3, or +4 weapons. All magic-bonus equipment comes exclusively from fishing.

### Channel 3 — d100 Consumable Table (`_D100_TABLE`)
One roll per battle-end. Potions, scrolls, flashbangs, and gold only. Luck modifier shifts the roll toward better consumables.

| Range | Type                | Weight |
|-------|---------------------|--------|
| 01–35 | Minor Healing Potion| 35     |
| 36–53 | Healing Potion      | 18     |
| 54–67 | Greater Healing Potion | 14  |
| 68–73 | Superior Healing Potion | 6  |
| 74–84 | Spell Scroll        | 11     |
| 85–90 | Flashbang           | 6      |
| 91–100| Gold Cache          | 10     |

Manage via `GET /api/loot` (read) or `PUT /api/loot` (replace table).

### Channel 4 — Fishing / Lake Magic (LAKE_MAGIC_DB)
Magic-enhanced items (+1 to +4 equivalent). Exclusive to high-rank fishing at Yugurt Lake. Stat bonuses scale with player level and luck modifier via `base + floor(level × levelScale) + floor(luck × luckScale)`.

Manage via `GET /api/lake-magic` and `POST /api/lake-magic`.

---

## Unified Loot-Drop Query

```bash
GET /api/loot-drop
```

Returns a combined view of all monster drop entries and fishing magic items in one response.

**Query parameters:**

| Param        | Description |
|--------------|-------------|
| `terrain`    | Filter to monsters in this terrain key (e.g. `dungeon`, `coastal`) |
| `monster`    | Filter to a single monster key (e.g. `goblin`) |
| `fishing`    | `true` = fishing drops only · `false` = monster drops only |
| `bonus`      | Integer — negative filters monster weapon quality; positive filters lake magic base bonus |
| `name`       | Substring search on monster name, trophy name, or magic item name |

**Examples:**

```bash
# All drops for monsters in the dungeon terrain
curl 'http://localhost:1367/api/loot-drop?terrain=dungeon'

# Only fishing drops
curl 'http://localhost:1367/api/loot-drop?fishing=true'

# Lake magic items with base bonus = 2
curl 'http://localhost:1367/api/loot-drop?fishing=true&bonus=2'

# Monster drops where a Chipped (−2) weapon could drop
curl 'http://localhost:1367/api/loot-drop?fishing=false&bonus=-2'

# Name search across all sources
curl 'http://localhost:1367/api/loot-drop?name=spine'

# Single monster full drop profile
curl 'http://localhost:1367/api/loot-drop?monster=ancient_dragon'
```

**Response schema:**

```json
{
  "ok": true,
  "count": N,
  "drops": [
    {
      "source": "monster",
      "monsterKey": "goblin",
      "monsterName": "Goblin",
      "terrains": ["dungeon"],
      "dmgDie": 6,
      "trophy": { "name": "Goblin Ear", "icon": "👂", "sell": 3 },
      "weaponDrop": {
        "rule": "Base weapon ≤ monster dmgDie, quality 1d6",
        "qualityTable": [
          { "roll": "1", "bonus": -4, "prefix": "Wrecked", "probability": "1-in-6 (16.7%)" },
          ...
        ]
      }
    },
    {
      "source": "fishing",
      "subtype": "lake_magic",
      "key": "lake_mag_04",
      "name": "Void-Touched Fin",
      "effect": "atk_bonus",
      "base": 1,
      "levelScale": 0.2,
      "luckScale": 0,
      "minRank": 16,
      "minLevel": 5,
      "bonusFormula": "1 + floor(level×0.2)",
      "fishing": true
    }
  ],
  "_meta": {
    "qualityTable": [...],
    "sources": ["monster", "fishing"],
    "note": "d100 consumable table at GET /api/loot  ·  magic weapons are fishing-only"
  }
}
```

---

## World folder structure

After `node wbapi-cli.js export ./world`, content is laid out as:

```
world/
  {NODE_CODE}/              ← uppercase node code, e.g. CY, FR, MM
    node.json               ← node metadata (non-text)
    npcs/
      {npc_slug}/           ← lowercased NPC name, underscores
        npc.json
        quests/
          {quest_id}/       ← quest ID from game file
            meta.json       ← type, node refs, rewards, dc, stat
            title.txt
            hook.txt
            passText.txt
            failText.txt
            rewardText.txt
    quests/                 ← quests not assigned to a specific NPC
      {quest_id}/
        (same layout)
monsters/
  {monster_key}.json        ← e.g. goblin.json, ancient_dragon.json
```

Edit any `.txt` file in your text editor, then run `sync` to apply. The save is automatic — a timestamped HTML file is written.

---

## Edit workflow

### Single-field inline edit
```bash
node wbapi-cli.js edit quest quest_wis_01 passText "You remember now."
```
Shows old value before replacing. Auto-saves on success.

### Edit from a text file
```bash
# Write your text in an editor, then:
node wbapi-cli.js edit quest quest_wis_01 passText --file ./edits/pass.txt
```

### Bulk edit via folder sync
```bash
# 1. Export to folder
node wbapi-cli.js export ./world

# 2. Edit files in your editor (world/CY/npcs/aldric/quests/quest_wis_01/passText.txt)

# 3. Sync back
node wbapi-cli.js sync ./world
```

### Move / rename a node
```bash
node wbapi-cli.js move node CY CY_OLD
```
Renames the node key in NODE_MAP, updates all quest `activateNode`/`waypointNode` refs, and all NPC `node` refs automatically.

---

## Delete rules

Deletes are blocked unless all sub-content is removed first.

| Deleting   | Blocked if… |
|------------|-------------|
| Node       | Has quests OR npcs referencing it |
| Quest      | Other quests depend on flags it writes |
| Monster    | Still listed in a terrain's monster pool |
| NPC        | Any quest references it |

```bash
# This will show what's blocking the delete:
node wbapi-cli.js delete node CY
# ERROR: BLOCKED — remove sub-content first:
# { quests: ["quest_wis_01", "quest_wis_02"], npcs: ["aldric_stonehammer"] }
```

---

## JavaScript API (in-browser via worldbuilder.html or Node via wbapi-core.js)

```javascript
// Load
WBAPI.load('./roll2hit-v3.html');   // Node
WBAPI.load(fileText);               // browser

// GET
WBAPI.location.get('CY')           // composite: node + terrain + monsters + quests + npcs
WBAPI.nodes.get('CY')
WBAPI.quests.get('quest_wis_01')   // includes .chain { upstream, downstream }
WBAPI.npcs.get('aldric_stonehammer')
WBAPI.monsters.get('goblin')

// LIST
WBAPI.nodes.all()
WBAPI.quests.byNode('CY')
WBAPI.quests.byType('skill_check')
WBAPI.monsters.byTerrain('dungeon')
WBAPI.npcs.byNode('CY')

// PUT (merge fields)
WBAPI.quests.put('quest_wis_01', { passText: 'New text', gold: 75 })
WBAPI.nodes.put('CY', { name: 'New Cyrn' })

// DELETE
WBAPI.nodes.delete('CY')           // returns { ok:false, blockedBy:{...} } if sub-content exists
WBAPI.quests.delete('quest_wis_01')

// Field edit (targeted, preserves function bodies in source)
WBAPI.editField('quest', 'quest_wis_01', 'passText', 'You pass!')

// Save
WBAPI.save()                        // returns { ok:true, path:'roll2hit-20260529-143000.html' }
WBAPI.save('./my-output.html')

// Export / Sync
WBAPI.exportWorld('./world')
WBAPI.syncWorld('./world')
```

---

## Environment variable

```bash
export ROLL2HIT_FILE=/path/to/roll2hit-v3.html
node wbapi-cli.js list nodes
```

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
