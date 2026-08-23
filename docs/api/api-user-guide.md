<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Roll2Hit WBAPI — User Guide

> **This guide uses `./api.sh`** — a thin wrapper around `api/wb.js` that delegates every call to the server at `localhost:1367`. All examples use real data from the live game file.

---

## Quick Start

```bash
# 1. Start the server
./wbapi-toggle.sh start

# 2. Confirm it's alive
./api.sh ping

# 3. Read anything safely — no writes yet
./api.sh get node LHR
```

---

## Table of Contents

1. [Server Lifecycle](#1-server-lifecycle)
2. [Health & Status: ping](#2-health--status-ping)
3. [Reading One Entity: get](#3-reading-one-entity-get)
4. [Listing Collections: list](#4-listing-collections-list)
5. [Composite View: location](#5-composite-view-location)
6. [Quest Dependency Chain: chain](#6-quest-dependency-chain-chain)
7. [Integrity Audit: audit](#7-integrity-audit-audit)
8. [Editing Fields: put](#8-editing-fields-put)
9. [Creating Entities: post](#9-creating-entities-post)
10. [Deleting Entities: del](#10-deleting-entities-del)
11. [Exporting Data: export](#11-exporting-data-export)
12. [NPC Voiced Dialogue: speak](#12-npc-voiced-dialogue-speak)
13. [Bulk Import: import](#13-bulk-import-import)
14. [AI Assist: ai / --ai](#14-ai-assist-ai----ai)
15. [Nonce Token (manual flow): nonce](#15-nonce-token-manual-flow-nonce)
16. [Global Flags](#16-global-flags)
17. [Coordinate & Graph Endpoints (curl-direct)](#17-coordinate--graph-endpoints-curl-direct)
18. [Full Command Reference Card](#18-full-command-reference-card)

---

## 1. Server Lifecycle

The server reads `index.html` into memory. Every write mutates in-memory objects and then persists to disk automatically — a temp file beside `index.html`, renamed into place (atomic, so a reader never sees a half-written game file). `POST /api/save` is a *different* thing: it writes a **dated snapshot** next to the game file and copies it over, which is what `monitor-snapshots.py` / `archive-snapshots.sh` turn into the `milepoints/patches` chain. You do not need it to persist a write. *(§DX-02k, 2026-08-03 — before that fix every write went through the snapshot path and left the ~5.4 MB file behind, once per PUT.)*

```bash
# Start
./wbapi-toggle.sh start

# Stop
./wbapi-toggle.sh stop

# Restart (reload file from disk)
./wbapi-toggle.sh restart

# Direct reload without restart
curl -s -XPOST http://localhost:1367/api/reload | jq
```

**Default port:** `1367` (the canonical game year, 1367 AD).

---

## 2. Health & Status: ping

```bash
./api.sh ping
```

**What it returns:**
```json
{
  "ok": true,
  "loaded": true,
  "file": "index.html",
  "nodes": 241,
  "quests": 312,
  "monsters": 216,
  "fish": 45,
  "lakeMagic": 12
}
```

If the server is down, `ping` exits with a clear error and start instructions.

---

## 3. Reading One Entity: get

```
./api.sh get <type> <id>
```

**Types:** `node`  `quest`  `monster`  `npc`  `terrain`

### 3.1 Get a node

```bash
./api.sh get node LHR
```

Returns the full node with its connections, terrain, quests, NPCs, and coordinates:

```json
{
  "entity": {
    "code": "LHR",
    "name": "city",
    "label": "City Streets — Birka",
    "act": 1,
    "N": "BMA",
    "S": "KRN",
    "E": "TLL",
    "W": "WRO",
    "text": "The courier is already dead...",
    "npc": "City Guard Captain",
    "battle": null,
    "loot": "Bloodstained Map",
    "sleep": false
  },
  "connections": {
    "N": { "code": "BMA", "label": "Birka Slums", "act": 1 },
    "S": { "code": "KRN", "label": "The Birka Crypt", "act": 1 },
    "E": { "code": "TLL", "label": "The First Inn", "act": 1 },
    "W": { "code": "WRO", "label": "..." }
  }
}
```

More nodes to explore:
```bash
./api.sh get node TLL       # The First Inn — has sleep + NPC Brynn
./api.sh get node KRN       # The Birka Crypt — has battle
./api.sh get node BK        # Birka Shore — Northern Longship Landing
./api.sh get node FRO       # Aldric's Forest — act 3
./api.sh get node TRD       # Goblin Warrens — act 5
./api.sh get node SDQ       # The Crones' Domain — act 3
```

### 3.2 Get a quest

```bash
./api.sh get quest mq_1
```

```json
{
  "entity": {
    "id": "mq_1",
    "type": "main",
    "title": "Follow the Bloodstained Map",
    "desc": "A dying courier pressed a map into your hands...",
    "hint": "Seek Magistra Muffat at the Tilbury docks.",
    "passText": "Muffat takes the map and unfolds it on the dock counter...",
    "failText": "The docks are empty at this hour...",
    "activateNode": "LHR",
    "waypointNode": "LCY",
    "npc": "yael",
    "completeItems": ["Trade Seal (Shard #1)"]
  }
}
```

More quest examples:
```bash
./api.sh get quest mq_2          # Find Brother Aldric
./api.sh get quest mq_3          # The Sea Road South
./api.sh get quest sq_1          # Side: The Disappeared Merchants
./api.sh get quest sq_2          # Side: Kelpie in the Loch
./api.sh get quest quest_wis_01  # Skill check quest
```

### 3.3 Get a monster

```bash
./api.sh get monster goblin
```

```json
{
  "entity": {
    "key": "goblin",
    "name": "Goblin",
    "ac": 15,
    "hp": 7,
    "atk": 4,
    "dmgDie": 6,
    "dmgCount": 1,
    "dmgFlat": 2,
    "tier": "easy"
  },
  "connections": {
    "terrains": ["goblin_cave", "midlands", "forest"]
  }
}
```

More monster examples:
```bash
./api.sh get monster skeleton   # ac:13 hp:13 tier:easy
./api.sh get monster shadow     # ac:12 hp:16 tier:easy
./api.sh get monster bandit     # ac:12 hp:11 tier:easy
./api.sh get monster wolf       # ac:13 hp:11 tier:easy
./api.sh get monster leshen     # boss-tier forest creature
```

### 3.4 Get a terrain

```bash
./api.sh get terrain city
```

Returns the terrain definition with all associated monster keys and every node that uses this terrain:

```json
{
  "entity": {
    "key": "city",
    "label": "City Streets",
    "icon": "🏙",
    "monsters": ["commoner", "kobold", "bandit", "spy", "shadow", "thug", ...]
  },
  "connections": {
    "monsters": [
      { "key": "commoner", "name": "Commoner", "tier": "trivial" },
      { "key": "shadow",   "name": "Shadow",   "tier": "easy" }
    ],
    "nodes": [
      { "code": "LHR", "label": "City Streets — Birka", "act": 1 }
    ]
  }
}
```

More terrain examples:
```bash
./api.sh get terrain forest       # 🌲 Forest / Trees
./api.sh get terrain crypt        # ⚰ Crypt
./api.sh get terrain inn          # 🛏 Inn — Night
./api.sh get terrain tavern       # 🍷 Tavern — Common Room
./api.sh get terrain bar          # 🍺 Tavern Brawl
./api.sh get terrain goblin_cave  # 👺 Goblin Warrens
./api.sh get terrain hag_swamp    # 🧙 Hag's Domain
```

### 3.5 Get an NPC

```bash
./api.sh get npc yael
./api.sh get npc brynn
./api.sh get npc archivus_sweelinck
```

---

## 4. Listing Collections: list

```
./api.sh list <type> [filters...]
```

### 4.1 List all types (index)

```bash
./api.sh list
```

Returns available list routes with counts and filter options.

### 4.2 List all nodes

```bash
./api.sh list node
```

Returns summary rows: `{ id, label, terrain, act, coords, connections, _meta }`.

#### Filter by act

```bash
./api.sh list node --act 1     # Act 1 nodes (Birka arc)
./api.sh list node --act 3     # Act 3 nodes
./api.sh list node --act 4     # Act 4 nodes (Paul's journeys)
./api.sh list node --act 5     # Act 5 nodes
```

Wait — act is a URL query param, not a `--flag`. Use the underlying list filter syntax:

```bash
# act filter via query string (use curl or wb with explicit url)
curl -s 'http://localhost:1367/api/list/node?act=1' | jq '.[0:3]'
curl -s 'http://localhost:1367/api/list/node?act=3' | jq 'length'
```

#### Filter by terrain

```bash
# via curl (most flexible for list filters)
curl -s 'http://localhost:1367/api/list/node?terrain=forest'       | jq '[.[] | .id]'
curl -s 'http://localhost:1367/api/list/node?terrain=crypt'        | jq '[.[] | .id]'
curl -s 'http://localhost:1367/api/list/node?terrain=goblin_cave'  | jq '[.[] | .id]'
curl -s 'http://localhost:1367/api/list/node?terrain=inn'          | jq '[.[] | .id]'
```

#### Nodes missing coordinates

```bash
curl -s 'http://localhost:1367/api/list/node?no_coords=true' | jq '[.[] | .id]'
```

#### Nodes that have quests

```bash
curl -s 'http://localhost:1367/api/list/node?has_quests=true'  | jq '[.[] | {id, label, quests: ._meta.quests}]'
curl -s 'http://localhost:1367/api/list/node?has_quests=false' | jq 'length'
```

#### Junction nodes only

```bash
curl -s 'http://localhost:1367/api/list/node?junction=true'  | jq '[.[] | .id]'
curl -s 'http://localhost:1367/api/list/node?junction=false' | jq 'length'  # named nodes only
```

#### Text search in label

```bash
curl -s 'http://localhost:1367/api/list/node?q=birka'  | jq '[.[] | {id, label}]'
curl -s 'http://localhost:1367/api/list/node?q=forest' | jq '[.[] | {id, label}]'
```

#### IDs only (compact array)

```bash
curl -s 'http://localhost:1367/api/list/node?ids=true'    | jq '.ids[]'
curl -s 'http://localhost:1367/api/list/ids/node'         | jq '.ids | length'
```

#### Combine filters

```bash
curl -s 'http://localhost:1367/api/list/node?act=1&terrain=city' | jq '[.[] | .id]'
curl -s 'http://localhost:1367/api/list/node?has_quests=true&terrain=forest' | jq '[.[] | {id,label}]'
```

### 4.3 List quests

```bash
./api.sh list quest
```

#### Filter by node (quests that activate at or waypoint through a node)

```bash
curl -s 'http://localhost:1367/api/list/quest?node=LHR' | jq '[.[] | {id, title, type}]'
curl -s 'http://localhost:1367/api/list/quest?node=BK'  | jq '[.[] | {id, title}]'
curl -s 'http://localhost:1367/api/list/quest?node=TRD' | jq '[.[] | {id, title}]'
```

#### Filter by type

```bash
curl -s 'http://localhost:1367/api/list/quest?type=main'        | jq '[.[] | .id]'
curl -s 'http://localhost:1367/api/list/quest?type=side'        | jq '[.[] | .id]'
curl -s 'http://localhost:1367/api/list/quest?type=combat'      | jq '[.[] | .id]'
curl -s 'http://localhost:1367/api/list/quest?type=skill_check' | jq '[.[] | .id]'
curl -s 'http://localhost:1367/api/list/quest?type=mission_bit' | jq '[.[] | .id]'
```

#### Filter by arc prefix

```bash
curl -s 'http://localhost:1367/api/list/quest?arc=mq_'   | jq '[.[] | .id]'  # main quests
curl -s 'http://localhost:1367/api/list/quest?arc=sq_'   | jq '[.[] | .id]'  # side quests
curl -s 'http://localhost:1367/api/list/quest?arc=quest_wis' | jq '[.[] | .id]'
```

#### Text search

```bash
curl -s 'http://localhost:1367/api/list/quest?q=shard'  | jq '[.[] | {id, title}]'
curl -s 'http://localhost:1367/api/list/quest?q=goblin' | jq '[.[] | {id, title}]'
```

#### IDs only

```bash
curl -s 'http://localhost:1367/api/list/ids/quest' | jq '.ids | length'
```

### 4.4 List monsters

```bash
./api.sh list monster
```

#### Filter by terrain

```bash
curl -s 'http://localhost:1367/api/list/monster?terrain=forest'      | jq '[.[] | {key, name, tier}]'
curl -s 'http://localhost:1367/api/list/monster?terrain=crypt'       | jq '[.[] | {key, name}]'
curl -s 'http://localhost:1367/api/list/monster?terrain=goblin_cave' | jq '[.[] | {key, name}]'
```

#### Filter by tier

```bash
curl -s 'http://localhost:1367/api/list/monster?tier=trivial' | jq 'length'
curl -s 'http://localhost:1367/api/list/monster?tier=easy'    | jq '[.[] | .key]'
curl -s 'http://localhost:1367/api/list/monster?tier=medium'  | jq '[.[] | .key]'
curl -s 'http://localhost:1367/api/list/monster?tier=hard'    | jq '[.[] | .key]'
curl -s 'http://localhost:1367/api/list/monster?tier=deadly'    | jq '[.[] | .key]'
```

#### Text search

```bash
curl -s 'http://localhost:1367/api/list/monster?q=vampire'  | jq '[.[] | {key, name, tier}]'
curl -s 'http://localhost:1367/api/list/monster?q=dragon'   | jq '[.[] | {key, name, tier}]'
```

#### IDs only

```bash
curl -s 'http://localhost:1367/api/list/ids/monster' | jq '.ids[]' | sort
```

### 4.5 List NPCs

```bash
./api.sh list npc
```

#### Filter by node

```bash
curl -s 'http://localhost:1367/api/list/npc?node=LHR' | jq '[.[] | {key, name}]'
curl -s 'http://localhost:1367/api/list/npc?node=TLL' | jq '.'
```

#### Filter by occupation

```bash
curl -s 'http://localhost:1367/api/list/npc?occupation=innkeeper' | jq '[.[] | {key, name, node}]'
curl -s 'http://localhost:1367/api/list/npc?occupation=merchant'  | jq '[.[] | {key, name}]'
```

#### Text search

```bash
curl -s 'http://localhost:1367/api/list/npc?q=brynn' | jq '.'
```

### 4.6 List terrains

```bash
./api.sh list terrain
```

#### Text search

```bash
curl -s 'http://localhost:1367/api/list/terrain?q=city'  | jq '[.[] | {key, label}]'
curl -s 'http://localhost:1367/api/list/terrain?q=swamp' | jq '[.[] | {key, label}]'
```

#### All terrain keys

```bash
curl -s 'http://localhost:1367/api/list/ids/terrain' | jq '.ids[]'
```

---

## 5. Composite View: location

`location` combines node data, monsters, quests, and NPCs in one call — the canonical view for a node from the game engine's perspective.

```bash
./api.sh location LHR   # City Streets — Birka
./api.sh location TLL   # The First Inn
./api.sh location KRN   # The Birka Crypt
./api.sh location BK    # Birka Shore
./api.sh location FRO   # Aldric's Forest
./api.sh location TRD   # Goblin Warrens
```

Sample output for `./api.sh location KRN`:
```json
{
  "code": "KRN",
  "label": "The Birka Crypt",
  "terrain": "crypt",
  "act": 1,
  "connections": { "N": "LLA", "S": "HKG" },
  "monsters": [
    { "key": "skeleton", "name": "Skeleton", "tier": "easy" },
    { "key": "shadow",   "name": "Shadow",   "tier": "easy" },
    { "key": "ghoul",    "name": "Ghoul",    "tier": "medium" }
  ],
  "quests": [
    { "id": "sq_crypt_01", "title": "The Crypt Key", "type": "side" }
  ],
  "npcs": []
}
```

---

## 6. Quest Dependency Chain: chain

Shows all quests that depend on (or are depended on by) a given quest. Use this before deleting a quest to check whether anything downstream will break.

```bash
./api.sh chain mq_1
./api.sh chain mq_3
./api.sh chain sq_1
./api.sh chain quest_wis_01
```

Sample output:
```json
{
  "id": "mq_1",
  "upstream": [],
  "downstream": [
    { "id": "mq_2", "title": "Find Brother Aldric", "type": "main" }
  ],
  "canDelete": false
}
```

---

## 7. Integrity Audit: audit

### Full integrity scan

```bash
./api.sh audit
```

Returns a structured list of errors, warnings, and suggestions across all quest and node data.

### Map audit (bidirectional link check)

```bash
./api.sh audit --map
```

Checks every N/E/S/W link: if node A has `E=B`, then B must have `W=A`. Reports every mismatch with the exact fix command.

### Plain text output

```bash
./api.sh audit --map --text
```

Human-readable format. Pipe to `grep` for quick scanning:

```bash
./api.sh audit --map --text | grep ERROR
./api.sh audit --text | grep "missing"
```

### First failing item (guided fix)

```bash
curl -s 'http://localhost:1367/api/next-error' | jq
```

Returns one error at a time with context and a suggested fix command. Useful for systematic repair loops:

```bash
curl -s 'http://localhost:1367/api/next-error'              | jq '.fix'  # first error
curl -s 'http://localhost:1367/api/next-error?skip=1'       | jq '.fix'  # second error
curl -s 'http://localhost:1367/api/next-error?severity=error' | jq '.'   # errors only
```

---

## 8. Editing Fields: put

```
./api.sh put <type> <id> [k=v ...]
```

The `put` command issues a `PUT /api/{type}/{id}` with the fields you specify. **No nonce required** — put uses a lighter confirmation model.

### 8.1 Edit a node field

```bash
# Change a node's label
./api.sh put node LHR label="City Streets — Birka (Updated)"

# Change terrain (must be a valid terrain key)
./api.sh put node LHR name=city_slums

# Change act number
./api.sh put node LHR act=2

# Set a directional connection
./api.sh put node LHR N=BMA
./api.sh put node LHR W=WRO

# Clear a directional connection (null)
./api.sh put node LHR W=null

# Set sleep flag and cost
./api.sh put node TLL sleep=true sleepCost=5

# Add/change NPC string
./api.sh put node LHR npc="City Guard Captain"
```

### 8.2 Edit a quest field

```bash
# Update pass text
./api.sh put quest mq_1 passText="Muffat takes the map and nods slowly."

# Update fail text
./api.sh put quest mq_1 failText="The docks are empty. Come back."

# Update hint
./api.sh put quest mq_1 hint="Check the Tilbury docks first."

# Change waypoint node
./api.sh put quest mq_2 waypointNode=FRO

# Change the NPC
./api.sh put quest sq_1 npc=brynn
```

### 8.3 Edit a monster field

```bash
# Adjust stats
./api.sh put monster goblin hp=10
./api.sh put monster goblin ac=14
./api.sh put monster goblin atk=5

# Change tier
./api.sh put monster goblin tier=medium

# Change name
./api.sh put monster goblin name="Goblin Scout"
```

### 8.4 Pipe JSON body

For multi-field updates, pipe a JSON object instead of k=v pairs:

```bash
echo '{"passText":"You recalled the text.","failText":"Try again."}' \
  | ./api.sh put quest quest_wis_01

echo '{"label":"City Streets — Birka","act":1}' \
  | ./api.sh put node LHR

echo '{"hp":20,"ac":16,"tier":"medium"}' \
  | ./api.sh put monster skeleton
```

### 8.5 Write to a file

```bash
./api.sh put node LHR label="Updated" --out /tmp/lhr-put-result.json
cat /tmp/lhr-put-result.json
```

---

## 9. Creating Entities: post

```
./api.sh post <type> [k=v ...]
```

The `post` command issues a `POST /api/{type}` with a nonce auto-handled. If you supply an `id`/`code`/`key` field, the nonce is acquired automatically before the create call.

### 9.1 Create a node

```bash
./api.sh post node \
  code=MM \
  name=mimic_meadows \
  label="Mimic Meadows" \
  act=3 \
  battle=true
```

With directional connections:

```bash
./api.sh post node \
  code=SW \
  name=scholars_qtr \
  label="Scholar Workshop" \
  act=3 \
  N=CY \
  W=BK
```

With sleep:

```bash
./api.sh post node \
  code=NEW_INN \
  name=inn \
  label="The Silver Lantern Inn" \
  act=2 \
  sleep=true \
  sleepCost=8 \
  npc="Innkeeper Gert"
```

### 9.2 Create a quest

Minimum required fields: `id`, `type`, `title`, `activateNode`.

```bash
./api.sh post quest \
  id=sq_birka_rat \
  type=combat \
  title="The Rat Problem" \
  desc="Brynn wants the cellar cleared." \
  hint="Head to the cellar beneath the inn." \
  passText="The cellar is quiet now." \
  failText="The rats are still down there." \
  activateNode=TLL \
  waypointNode=TLL \
  npc=brynn
```

Side quest with item reward:

```bash
./api.sh post quest \
  id=sq_crypt_candle \
  type=side \
  title="The Black Candle" \
  desc="Something lit that candle. Nothing should be down here." \
  hint="Search the crypt's second chamber." \
  passText="The candle burns out. The source was simpler than it looked." \
  failText="The candle is still burning." \
  activateNode=KRN \
  waypointNode=KRN
```

Skill check quest:

```bash
./api.sh post quest \
  id=quest_int_01 \
  type=skill_check \
  title="Decipher the Cipher" \
  desc="The cipher is in three parts. Each part is a different kind of wrong." \
  hint="The answer is in the structure, not the content." \
  passText="The cipher resolves into coordinates. You recognize the docks." \
  failText="The cipher is still locked. Try again." \
  activateNode=MHQ \
  waypointNode=LCY
```

### 9.3 Create a monster

```bash
./api.sh post monster \
  key=bog_crawler \
  name="Bog Crawler" \
  ac=11 \
  hp=18 \
  atk=4 \
  dmgDie=6 \
  dmgCount=1 \
  dmgFlat=2 \
  tier=easy
```

Boss-tier example:

```bash
./api.sh post monster \
  key=swamp_sovereign \
  name="Swamp Sovereign" \
  ac=16 \
  hp=120 \
  atk=8 \
  dmgDie=10 \
  dmgCount=2 \
  dmgFlat=5 \
  tier=deadly
```

> **All nine fields are required, and `tier` is one of `trivial | easy | medium | hard | deadly`** — there is no `boss` tier, and no `dmg` / `xp` field (damage is `dmgCount·d(dmgDie) + dmgFlat`; battle XP is computed from AC·maxHP, never stored). A body that misses a field or names a retired one is rejected **422 with the offending fields listed, and nothing is written** (§DX-01c). The new monster starts in **no terrain** — place it with `./api.sh put terrain <terrainKey> monsters=[…]`.

### 9.4 Create a terrain

```bash
./api.sh post terrain \
  key=temple_ruins \
  label="Temple Ruins" \
  icon=🏛
```

After creating the terrain, set its roster with `put terrain … monsters=` (§DX-02h — before
2026-08-03 this section told you to add monsters "via `put`" while the endpoint accepted only
`label`/`icon`, and every terrain PUT reported success without writing anything to disk):

```bash
./api.sh get terrain temple_ruins                       # read the CURRENT roster first
./api.sh put terrain temple_ruins label="Temple Ruins — Fallen Columns"
./api.sh put terrain temple_ruins monsters=skeleton,ghast,wight
```

⚠️ **`monsters` replaces the whole roster, it does not append** — read, append, write back.
Unknown monster keys are refused `422` with **nothing written**; duplicates are allowed but
warned. Never hand-edit the array: it holds code identifiers (`P.skeleton`), and a
JSON-string array re-parses cleanly while silently breaking the encounter picker.

### 9.5 Pipe JSON body

For complex creates, pipe a full JSON object:

```bash
cat <<'EOF' | ./api.sh post node
{
  "code": "EHZ",
  "name": "void",
  "label": "Event Horizon Zone",
  "act": 5,
  "text": "The edge of the map. The boundary is not spatial.",
  "battle": true
}
EOF
```

```bash
cat <<'EOF' | ./api.sh post quest
{
  "id": "quest_math_01",
  "type": "side",
  "title": "The Counting Problem",
  "desc": "The mathematician at the Event Horizon wants an exact count.",
  "hint": "Count carefully. Zero matters.",
  "passText": "The count is correct. The boundary shifts.",
  "failText": "The count was off. The boundary holds.",
  "activateNode": "EHZ",
  "waypointNode": "EHZ"
}
EOF
```

---

## 10. Deleting Entities: del

```
./api.sh del <type> <id>
```

The `del` command auto-acquires a nonce before issuing the DELETE. **Before deleting**, run `chain` (for quests) or check `_meta.canDelete` (for nodes) to confirm nothing depends on it.

**Deletes are source-level and verified (§DX-01d/i, 2026-07-30).** The entry line is excised from its data section, the file is saved and re-parsed, and the response carries `deleteVerified:true` only once the entry is confirmed absent from the reloaded collections. Before that fix, every `del` — node, quest, monster, npc — dropped the entry from the *in-memory model only*: it printed `✓ deleted`, and the entry came straight back on the next parse.

Three behaviors worth knowing:

| Behavior | What it means |
|---|---|
| **Cascades** | Deleting a node also removes its `NODE_COORDS` row; deleting a monster also removes its `MONSTER_DROPS` trophy entry — so no orphan is left for `./api.sh audit` to report. |
| **Verify-or-revert** | If excising the entry would alter *any* other entry in the section, nothing is written and the delete fails loudly. A refused delete leaves the source byte-identical. |
| **Guards unchanged** | A node with quests/NPCs, or a quest with downstream dependents, is still blocked — `409` with `blockedBy`. |

### 10.1 Delete a quest

```bash
# Check first
./api.sh chain sq_birka_rat

# Delete if canDelete is true
./api.sh del quest sq_birka_rat
```

### 10.2 Delete a node

```bash
# Check first — must have no quests and no named NPCs
./api.sh location MM

# Delete
./api.sh del node MM
```

### 10.3 Delete a monster

```bash
./api.sh del monster bog_crawler
```

### 10.4 Manual nonce + curl (for complex scripts)

When scripting multi-step operations and you need fine-grained control:

```bash
# Step 1: Get a nonce
NONCE=$(curl -s -XPOST http://localhost:1367/api/nonce \
  -H 'Content-Type: application/json' \
  -d '{"type":"quest","id":"sq_birka_rat"}' | jq -r .nonce)

# Step 2: Delete
curl -s -XDELETE http://localhost:1367/api/quest/sq_birka_rat \
  -H "X-Nonce: $NONCE" | jq
```

---

## 11. Exporting Data: export

```
./api.sh export <collection> [--format json|js|module] [--out file]
```

**Collections:** `node_map`  `quest_db`  `monster_pool`  `world_db`  `all`

### 11.1 Export as JSON (default)

```bash
./api.sh export node_map    | jq 'keys | length'  # count nodes
./api.sh export quest_db    | jq 'keys | length'  # count quests
./api.sh export monster_pool | jq 'keys | length' # count monsters
./api.sh export world_db    | jq 'keys'           # list terrain keys
```

### 11.2 Export as JS literal

```bash
./api.sh export node_map   --format js
./api.sh export quest_db   --format js
```

Output is a JS `const NODE_MAP = {...}` assignment suitable for embedding.

### 11.3 Export as ESM module

```bash
./api.sh export node_map   --format module
./api.sh export quest_db   --format module
```

Output is `export const NODE_MAP = {...}` for use in modern JS projects.

### 11.4 Write export to file

```bash
./api.sh export quest_db   --out world/quests.json
./api.sh export node_map   --out world/nodes.json
./api.sh export monster_pool --out world/monsters.json

# All collections to one file
./api.sh export all --format json --out world/full-export.json
```

### 11.5 Backup before large edits

```bash
./api.sh export node_map --out backup-nodes-$(date +%Y%m%d).json
./api.sh export quest_db --out backup-quests-$(date +%Y%m%d).json
```

---

## 12. NPC Voiced Dialogue: speak

```
./api.sh speak <npc-id> "<prompt>" [--state neutral|friendly|dearFriend] [--model <model>]
```

Generates voiced NPC dialogue using Claude. Requires `ANTHROPIC_API_KEY` to be set.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### 12.1 Basic speak

```bash
./api.sh speak yael "Good afternoon."
./api.sh speak brynn "Do you have a room available?"
./api.sh speak archivus_sweelinck "I have all seven shards."
```

### 12.2 With relationship state

```bash
# Neutral — first meeting
./api.sh speak yael "What happened here?" --state neutral

# Friendly — after helping
./api.sh speak yael "I cleared the crypt." --state friendly

# Dear friend — deep trust established
./api.sh speak yael "Tell me what you know about the Void." --state dearFriend
```

### 12.3 With a different model

```bash
./api.sh speak brynn "What can you tell me about Froberger?" --model claude-haiku-4-5-20251001
./api.sh speak yael "I need your help." --model claude-sonnet-4-6
```

### 12.4 Capture reply

```bash
./api.sh speak yael "What is happening in this city?" --state friendly \
  | tee /tmp/yael-reply.txt
```

Sample output:
```
Yael  [friendly]
The lower districts have been sealed three consecutive nights. The
rationale field on the notice board is blank. That blank field is
the most important thing on that board.
```

---

## 13. Bulk Import: import

```
./api.sh import <file.json>
```

Import format: a JSON object with a `nodes` array and `cycles` array (each cycle has `acts` with quests).

### 13.1 Import from file

```bash
./api.sh import import_cdg.json
./api.sh import import_vie.json
./api.sh import import_rkv.json
```

### 13.2 Import from stdin (pipe)

```bash
cat import_cdg.json | ./api.sh import
```

### 13.3 Import with output capture

```bash
./api.sh import import_cdg.json --out /tmp/cdg-import-result.json
cat /tmp/cdg-import-result.json | jq '{created: .nodesCreated, skipped: .nodesSkipped}'
```

### 13.4 Sample import file structure

```json
{
  "book": "CDG",
  "nodes": [
    {
      "code": "CDG",
      "name": "airport",
      "label": "Charles de Gaulle Airport",
      "act": 2,
      "text": "The terminal is...",
      "battle": null,
      "sleep": true,
      "sleepCost": 6
    }
  ],
  "cycles": [
    {
      "cycle": 8,
      "acts": [
        {
          "id": "quest_cdg_01",
          "type": "side",
          "title": "The Delayed Flight",
          "activateNode": "CDG",
          "waypointNode": "CDG",
          "desc": "...",
          "passText": "...",
          "failText": "..."
        }
      ]
    }
  ]
}
```

---

## 14. AI Assist: ai / --ai

### 14.1 `ai` subcommand

```bash
./api.sh ai "how do I link two nodes?"
./api.sh ai "what monsters appear in dungeon terrain?"
./api.sh ai "how do I add a quest that requires two items to complete?"
./api.sh ai "what is the difference between activateNode and waypointNode?"
./api.sh ai "how do I create a junction between KRN and HKG?"
```

### 14.2 `--ai` shorthand (no subcommand needed)

```bash
./api.sh --ai "how do I wire two nodes bidirectionally?"
./api.sh --ai "show me how to bulk-export and then re-import node_map"
./api.sh --ai "what curl command fills a gap between two nodes?"
```

The AI assistant is Claude Haiku, tuned with the full WBAPI cheat sheet. It replies in 1–3 lines leading with a concrete `wb` command.

**Requires:** `ANTHROPIC_API_KEY` set in environment.

---

## 15. Nonce Token (manual flow): nonce

For scripting complex write sequences where you want the nonce separately:

```bash
# Print a nonce (then use it yourself)
./api.sh nonce quest sq_new_01
# → prints: ab12cd34ef56gh78

# Capture and use
NONCE=$(./api.sh nonce node NEW_NODE)
curl -s -XPOST http://localhost:1367/api/node \
  -H 'Content-Type: application/json' \
  -H "X-Nonce: $NONCE" \
  -d '{"code":"NEW_NODE","name":"city","label":"New City Node","act":1}'
```

**Note:** In normal use, `./api.sh post` and `./api.sh del` acquire nonces automatically. Only use `nonce` directly when scripting raw curl calls or when you need the token for your own orchestration.

**Nonce expiry:** 5 minutes. If the write fails with 401, get a new nonce and retry.

---

## 16. Global Flags

All these flags work on any `./api.sh` command:

### `--server <url>` — Override API base URL

```bash
./api.sh ping --server http://localhost:1367        # default
./api.sh ping --server http://192.168.1.10:1367     # remote dev machine
./api.sh get node LHR --server http://localhost:9999
```

Also settable via environment:
```bash
export WBAPI_URL=http://localhost:1367
./api.sh ping   # picks up from env
```

### `--out <file>` — Write output to file

```bash
./api.sh get node LHR --out /tmp/lhr.json
./api.sh list quest --out /tmp/quests.json
./api.sh export quest_db --out backup/quests-$(date +%Y%m%d).json
```

### `--raw` — Compact JSON (no pretty-print)

```bash
./api.sh get node LHR --raw             # single-line JSON
./api.sh list quest --raw | wc -c       # byte size
./api.sh list node --raw | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d))"
```

### `--retry <n>` — Max retries on 5xx or connection error

```bash
./api.sh put quest mq_1 passText="Updated." --retry 5
./api.sh import big-import.json --retry 2
```

Default: 3. Exponential backoff: 1s → 2s → 4s → 8s (capped).

### `--timeout <ms>` — Per-request timeout in milliseconds

```bash
./api.sh export monster_pool --timeout 30000   # 30s for large export
./api.sh import import_vie.json --timeout 15000
```

Default: 10000 (10s).

---

## 17. Coordinate & Graph Endpoints (curl-direct)

These endpoints exist on the server but are not wrapped by `./api.sh` subcommands. Use `curl` directly. All are part of the same `localhost:1367` server.

### 17.1 Read all coordinates

```bash
curl -s http://localhost:1367/api/coords | jq 'keys | length'
curl -s http://localhost:1367/api/coords | jq '.coords.LHR'     # → {"r":120,"c":144}
curl -s http://localhost:1367/api/coords | jq '.coords.BK'      # → {"r":104,"c":172}
```

### 17.2 Nodes near a position

```bash
curl -s 'http://localhost:1367/api/coords/near/BK?radius=8'   | jq '[.nearby[] | .code]'
curl -s 'http://localhost:1367/api/coords/near/LHR?radius=16' | jq '.nearby | length'
curl -s 'http://localhost:1367/api/coords/near/FRO?radius=4'  | jq '.available[:3]'  # free slots
```

### 17.3 Validate one node's connections

```bash
curl -s 'http://localhost:1367/api/graph/validate/LHR?maxGap=4' | jq
curl -s 'http://localhost:1367/api/graph/validate/BK?maxGap=4'  | jq '.connections'
curl -s 'http://localhost:1367/api/graph/validate/KRN?maxGap=4' | jq '.diagnosis'
```

Returns per-direction status: `ok`, `gap_too_large`, `off_axis`, `unset`, `missing_coords`.

### 17.4 All broken edges from a root

```bash
curl -s 'http://localhost:1367/api/graph/broken?maxGap=4&root=BK' | jq '{broken, categories}'
curl -s 'http://localhost:1367/api/graph/broken?maxGap=4&root=LHR' \
  | jq '[.edges[] | {from, dir, to, type}]'
```

### 17.5 Walkable path between two nodes

```bash
curl -s 'http://localhost:1367/api/graph/path/LHR/FRO?maxGap=4' | jq '{reachable, walkablePath}'
curl -s 'http://localhost:1367/api/graph/path/BK/TRD?maxGap=4'  | jq '{reachable, fix}'
```

### 17.6 Move a node's coordinates (absolute)

```bash
curl -s -XPUT http://localhost:1367/api/coords/LHR \
  -H 'Content-Type: application/json' \
  -d '{"r":120,"c":144}' | jq
```

Returns 409 if the slot is already occupied.

### 17.7 Nudge a node (relative move)

```bash
# Move BK 4 rows north
curl -s -XPOST http://localhost:1367/api/coords/BK/nudge \
  -H 'Content-Type: application/json' \
  -d '{"dr":-4,"dc":0}' | jq

# Move KRN 8 columns east
curl -s -XPOST http://localhost:1367/api/coords/KRN/nudge \
  -H 'Content-Type: application/json' \
  -d '{"dr":0,"dc":8}' | jq
```

### 17.8 Swap two nodes' positions

```bash
curl -s -XPOST http://localhost:1367/api/coords/swap \
  -H 'Content-Type: application/json' \
  -d '{"a":"J52","b":"LHR"}' | jq
```

### 17.9 Wire both ends of a connection

Sets `A.dir = B` and `B.opposite = A` atomically. Fails if either slot is already occupied.

```bash
curl -s -XPOST http://localhost:1367/api/graph/link \
  -H 'Content-Type: application/json' \
  -d '{"a":"LHR","aDir":"N","b":"BMA"}' | jq

curl -s -XPOST http://localhost:1367/api/graph/link \
  -H 'Content-Type: application/json' \
  -d '{"a":"KRN","aDir":"S","b":"HKG"}' | jq
```

Error if already set:
```json
{ "ok": false, "error": "LHR.N already set to 'BMA' — clear it first with wb put node LHR N=null" }
```

### 17.10 Plan a junction chain (dry run)

```bash
curl -s -XPOST http://localhost:1367/api/graph/fill-gap \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "KRN",
    "dir": "S",
    "to": "HKG",
    "maxGap": 4,
    "step": 4,
    "terrain": "inherit",
    "dryRun": true
  }' | jq '{junctionsNeeded, plan, conflicts}'
```

Execute after reviewing the plan (remove `"dryRun": true`):
```bash
curl -s -XPOST http://localhost:1367/api/graph/fill-gap \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "KRN",
    "dir": "S",
    "to": "HKG",
    "maxGap": 4,
    "step": 4,
    "terrain": "inherit",
    "resolveConflicts": "shift"
  }' | jq
```

### 17.11 Fix a diagonal connection (corner junction)

When two nodes connect diagonally (different row AND column), place a corner junction at the axis intersection:

```bash
curl -s -XPOST http://localhost:1367/api/graph/corner-junction \
  -H 'Content-Type: application/json' \
  -d '{
    "nodeA": "ROT",
    "dirA": "E",
    "nodeB": "NRG",
    "dirB": "N",
    "sharedTarget": "SHW"
  }' | jq
```

### 17.12 Layout solver

```bash
# Propose a layout from a root node outward
curl -s 'http://localhost:1367/api/layout/solve?root=LHR&step=8' | jq '{placed: (.coords | keys | length), orphans}'

# Apply the proposed layout
LAYOUT=$(curl -s 'http://localhost:1367/api/layout/solve?root=LHR&step=8')
echo $LAYOUT | jq '.coords' > /tmp/proposed-layout.json

curl -s -XPOST http://localhost:1367/api/layout/apply \
  -H 'Content-Type: application/json' \
  -d "{\"coords\": $(cat /tmp/proposed-layout.json)}" | jq
```

### 17.13 Save to disk — the deliberate dated backup

```bash
./api.sh save            # POST /api/save — dated backup beside the game file, then overwrite + reload
./api.sh snapshots       # list those dated backups (they are gitignored — nothing else will tell you)
./api.sh snapshots --sweep [--force]
```

Every write already persists on its own (temp beside `index.html` + atomic rename, §DX-02k) — you do **not** need `save` after a `put`/`post`/`del`. What `save` gives you is the *dated snapshot* the `milepoints/patches` chain is built from.

Disposal keeps history by default: `./archive-snapshots.sh` turns each snapshot into a patch and then removes the file, so `--sweep` deletes only snapshots that chain already holds; `--force` discards the rest. *(§DX-02l, 2026-08-03 — before that this section printed a raw `curl`, which is precisely what §3's golden rule says never to fall back to.)*

### 17.14 Help topics (server-side man pages)

```bash
curl -s 'http://localhost:1367/api/help'           | jq '.topics'
curl -s 'http://localhost:1367/api/help/modes'     | jq -r '.text'
curl -s 'http://localhost:1367/api/help/nonce'     | jq -r '.text'
curl -s 'http://localhost:1367/api/help/quest'     | jq -r '.text'
curl -s 'http://localhost:1367/api/help/node'      | jq -r '.text'
curl -s 'http://localhost:1367/api/help/wizard'    | jq -r '.text'
curl -s 'http://localhost:1367/api/help/coords'    | jq -r '.text'
curl -s 'http://localhost:1367/api/help/import'    | jq -r '.text'
curl -s 'http://localhost:1367/api/help/curl'      | jq -r '.text'
```

Plain text format (no jq needed):
```bash
curl -s 'http://localhost:1367/api/help/wizard?format=text'
curl -s 'http://localhost:1367/api/help/curl?format=text'
```

---

## 18. Full Command Reference Card

```
═══════════════════════════════════════════════════════════════════
  ./api.sh COMMANDS
═══════════════════════════════════════════════════════════════════

ping                                 Server health + data counts
get   <type> <id>                    Full entity + connections
list  <type>                         Collection summary (curl for filters)
location <code>                      Composite node view
chain <quest-id>                     Quest dependency chain
audit [--map] [--text]               Integrity scan
put   <type> <id> [k=v ...]          Update fields (pipe JSON OK)
post  <type> [k=v ...]               Create entity (nonce auto)
del   <type> <id>                    Delete entity (nonce auto)
speak <npc-id> "<prompt>"            Claude-voiced NPC reply
import <file.json>                   Bulk import nodes + quests
export <collection>                  Dump collection JSON/JS/module
nonce <type> <id>                    Print a fresh nonce token
ai "<question>"                      Ask Claude about the API

TYPES:  node  quest  monster  npc  terrain

═══════════════════════════════════════════════════════════════════
  GLOBAL FLAGS  (work on every command)
═══════════════════════════════════════════════════════════════════

--server <url>      Override base URL  (env: WBAPI_URL)
--out <file>        Write output to file
--raw               Compact JSON, no pretty-print
--retry <n>         Max retries on 5xx / connection error  (default: 3)
--timeout <ms>      Per-request timeout  (default: 10000)
--ai "<prompt>"     Shorthand: ask Claude without a subcommand

═══════════════════════════════════════════════════════════════════
  COLLECTIONS (for export)
═══════════════════════════════════════════════════════════════════

node_map            All NODE_MAP entries
quest_db            All QUEST_DB entries
monster_pool        All MONSTER_POOL entries
world_db            All WORLD_DB terrain entries
all                 Full combined export

═══════════════════════════════════════════════════════════════════
  LIST FILTERS (use curl for these — not ./api.sh flags)
═══════════════════════════════════════════════════════════════════

/api/list/node?act=1
/api/list/node?terrain=forest
/api/list/node?q=birka
/api/list/node?no_coords=true
/api/list/node?has_quests=true
/api/list/node?junction=true
/api/list/node?ids=true

/api/list/quest?node=LHR
/api/list/quest?type=main
/api/list/quest?arc=mq_
/api/list/quest?q=shard

/api/list/monster?terrain=crypt
/api/list/monster?tier=easy
/api/list/monster?q=vampire

/api/list/npc?node=TLL
/api/list/npc?occupation=innkeeper

/api/list/terrain?q=city

/api/list/ids/node               → { ids: [...] }
/api/list/ids/quest
/api/list/ids/monster
/api/list/ids/terrain

═══════════════════════════════════════════════════════════════════
  COORD + GRAPH (curl only)
═══════════════════════════════════════════════════════════════════

GET  /api/coords                              All coordinates
GET  /api/coords/near/{code}?radius=N         Nearby search
GET  /api/graph/validate/{code}?maxGap=4      Connection check
GET  /api/graph/broken?maxGap=4&root=BK       All broken edges
GET  /api/graph/path/{from}/{to}?maxGap=4     Walkable path

PUT  /api/coords/{code}  {"r":N,"c":N}        Set absolute position
POST /api/coords/{code}/nudge {"dr":N,"dc":N} Move relative
POST /api/coords/swap {"a":"X","b":"Y"}        Swap two nodes

POST /api/graph/link   {"a","aDir","b"}        Wire both link ends
POST /api/graph/junction {...}                 Create one junction
POST /api/graph/corner-junction {...}          Fix diagonal connection
POST /api/graph/fill-gap {..., dryRun:true}    Plan junction chain
POST /api/graph/fill-gap {..., dryRun:false}   Execute junction chain

GET  /api/layout/solve?root=LHR&step=8        Propose layout
POST /api/layout/apply {"coords":{...}}        Apply layout

POST /api/save                                 Dated snapshot + copy (writes already persist)  → ./api.sh save
GET  /api/snapshots                            List the dated snapshots + total size          → ./api.sh snapshots
DELETE /api/snapshots[?force=true]             Sweep them (nonce; archived-only unless force)  → ./api.sh snapshots --sweep
POST /api/reload                               Re-read from disk
GET  /api/next-error?skip=N&severity=error     First failing item
GET  /api/help/{topic}                         Server man pages

═══════════════════════════════════════════════════════════════════
  REAL DATA CHEAT SHEET
═══════════════════════════════════════════════════════════════════

NODES (sample)
  LHR  City Streets — Birka      city         act 1
  BMA  Birka Slums                city_slums   act 1
  TLL  The First Inn              inn          act 1  sleep=5gp
  MHQ  Birka Tavern               tavern       act 1
  LLA  The Rough Bar              bar          act 1
  KRN  The Birka Crypt            crypt        act 1
  BK   Birka Shore (Longship)     beach        act 1
  FRO  Aldric's Forest            forest       act 3
  SDQ  The Crones' Domain         hag_swamp    act 3
  TRD  Goblin Warrens             goblin_cave  act 5

QUESTS (sample)
  mq_1   Follow the Bloodstained Map   main  activates:LHR
  mq_2   Find Brother Aldric           main  activates:LCY
  mq_3   The Sea Road South            main  activates:SDQ
  mq_7   The Reckoning                 main  activates:NUE
  sq_1   The Disappeared Merchants     side  activates:TLL
  sq_2   Kelpie in the Loch            side  activates:KIR
  quest_wis_01  (wisdom skill check)   skill_check

MONSTERS (sample)
  goblin    ac:15 hp:7  atk:4 1d6+2  tier:easy
  skeleton  ac:13 hp:13 atk:4 1d6+2  tier:easy
  shadow    ac:12 hp:16 atk:4 2d6+2  tier:easy
  bandit    ac:12 hp:11 atk:3 1d6+1  tier:easy
  wolf      ac:13 hp:11 atk:4 2d4+2  tier:easy
  leshen    (forest boss)             tier:boss

TERRAINS (sample)
  city         🏙  City Streets
  city_slums   🏚  City Slums
  inn          🛏  Inn — Night
  tavern       🍷  Tavern — Common Room
  bar          🍺  Tavern Brawl
  crypt        ⚰  Crypt
  forest       🌲  Forest / Trees
  goblin_cave  👺  Goblin Warrens
  hag_swamp    🧙  Hag's Domain
```

---

## Appendix A — One-Liner Recipes

```bash
# Is the server up?
./api.sh ping

# Quick node look
./api.sh get node LHR | jq .entity

# All quests at a node
curl -s 'http://localhost:1367/api/list/quest?node=LHR' | jq '[.[] | {id,title}]'

# All forest nodes
curl -s 'http://localhost:1367/api/list/node?terrain=forest' | jq '[.[] | .id]'

# Nodes without coordinates
curl -s 'http://localhost:1367/api/list/node?no_coords=true' | jq '[.[] | .id]'

# Count total quests
curl -s 'http://localhost:1367/api/list/ids/quest' | jq '.count'

# All dungeon monsters (easy tier)
curl -s 'http://localhost:1367/api/list/monster?tier=easy' | jq '[.[] | .key]'

# What's at grid position (104, 172)?
curl -s http://localhost:1367/api/coords | \
  jq '[to_entries[] | select(.value.r==104 and .value.c==172) | .key]'

# Can BK reach TRD (walkable path)?
curl -s 'http://localhost:1367/api/graph/path/BK/TRD?maxGap=4' | jq '{reachable,fix}'

# How many broken edges from BK?
curl -s 'http://localhost:1367/api/graph/broken?maxGap=4&root=BK' | jq '{broken,categories}'

# Export node IDs to a shell array
NODES=($(curl -s 'http://localhost:1367/api/list/ids/node' | jq -r '.ids[]'))
echo "Total: ${#NODES[@]}"

# Audit map and show only errors
./api.sh audit --map --text | grep -E "ERROR|WARN"

# Update a quest passText from a heredoc
./api.sh put quest mq_1 passText="$(cat <<'EOF'
Muffat takes the map and unfolds it on the dock counter. She does
not ask how you came by it. She asks if you have time.
EOF
)"

# Back up then edit
./api.sh export node_map --out /tmp/backup-nodes.json && \
  ./api.sh put node LHR label="City Streets — Birka"

# Full workflow: create node → add quest → verify → save
./api.sh post node code=TEST name=city label="Test Node" act=1
./api.sh post quest id=quest_test_01 type=side title="Test Quest" \
  activateNode=TEST desc="test" passText="pass" failText="fail"
./api.sh location TEST
./api.sh save                      # optional: a dated backup (the writes above already persisted)
```

---

## Appendix B — Workflow: Full Node + Quest Creation

```bash
# 1. Check the area
./api.sh get node KRN
curl -s 'http://localhost:1367/api/coords/near/KRN?radius=12' | jq '.nearby[:5]'

# 2. Create the node
./api.sh post node \
  code=VAULT \
  name=crypt \
  label="The Sealed Vault" \
  act=2 \
  N=KRN

# 3. Wire the reverse link
./api.sh put node KRN S=VAULT

# Or do both ends at once via graph/link:
curl -s -XPOST http://localhost:1367/api/graph/link \
  -H 'Content-Type: application/json' \
  -d '{"a":"KRN","aDir":"S","b":"VAULT"}' | jq

# 4. Set coordinates
curl -s -XPUT http://localhost:1367/api/coords/VAULT \
  -H 'Content-Type: application/json' \
  -d '{"r":124,"c":136}' | jq

# 5. Validate the connection
curl -s 'http://localhost:1367/api/graph/validate/VAULT?maxGap=4' | jq

# 6. Add a quest
./api.sh post quest \
  id=quest_vault_01 \
  type=combat \
  title="The Vault Guardian" \
  desc="The sealed vault has not been opened in a generation. Something sealed it from the inside." \
  hint="Find the vault key in the crypt above." \
  passText="The guardian falls. The vault opens. Whatever was sealed here is now yours to decide." \
  failText="The guardian is still standing. The vault remains sealed." \
  activateNode=VAULT \
  waypointNode=VAULT

# 7. Composite view
./api.sh location VAULT

# 8. Audit
./api.sh audit --map

# 9. Dated backup (the writes above already reached disk)
./api.sh save
```

---

## Appendix C — Environment Variables

| Variable | Default | Description |
|---|---|---|
| `WBAPI_URL` | `http://localhost:1367` | Override server base URL |
| `ANTHROPIC_API_KEY` | — | Required for `wb speak` and `wb ai` |
