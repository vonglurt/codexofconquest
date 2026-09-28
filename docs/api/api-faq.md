<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# WBAPI FAQ — Reading the Map and Editing One Record

> **Philosophy:** One record at a time. No mass edits. No mass deletes. Every change is:
> 1. **Find** the specific record
> 2. **Read** its current state
> 3. **Plan** the minimal edit
> 4. **Apply** with a single targeted call
> 5. **Verify** the result

> **The map is a cell grid.** A node's position is its `{r,c}` in `NODE_COORDS`, and two places connect when their cells are neighbours (§CELL-01). Nodes carry no `N`/`E`/`S`/`W` links, and junction nodes are gone (§CELL-05). Until §DX-02ky-FU2 this FAQ was mostly written against that edge model: the walk-the-loop procedure, junction planning, cluster separation, and three endpoints it announced that were never built (`graph/path`, `graph/link`, `graph/corner-junction`). Those parts are removed. The last full version is `6449ca7:docs/api/api-faq.md`.

---

## Part 1 — Reading and Finding

### 1.1 Get one node completely

```bash
./bin/api get node BK
# Returns: label, terrain, act, text, quests, monsters, NPCs, coords (if set)
```

### 1.2 Find the nodes near a node

```bash
curl "http://localhost:1367/api/coords/near/BK?radius=8"
# Returns: all nodes within 8 cells of BK, sorted by distance; radius=0 gives BK's own cell
```

### 1.3 Find all nodes in an act

```bash
curl "http://localhost:1367/api/list/node?act=1"
```

### 1.4 Find all nodes using a terrain type

```bash
./bin/api list node --terrain beach
```

### 1.5 Validate one node's cell

```bash
./bin/api validate BK
# Returns: its cell, whether a player can arrive there, and its occupied neighbour cells (see §3.1)
```

### 1.6 Find every isolated cell

```bash
./bin/api broken
# Returns: every node whose grid cell touches no occupied neighbour cell (see §3.2)
```

### 1.7 Check what the hub can reach

```bash
./bin/api reachability
# Cell-grid BFS from the hub (§CELL-06)
```

---

## Part 2 — Editing One Record at a Time

### 2.1 Move one node's coordinates (absolute)

```bash
curl -XPUT http://localhost:1367/api/coords/SHW \
  -H 'Content-Type: application/json' \
  -d '{"r":16,"c":178}'
```

### 2.2 Nudge one node's coordinates (relative)

```bash
curl -XPOST http://localhost:1367/api/coords/SHW/nudge \
  -H 'Content-Type: application/json' \
  -d '{"dr":-4,"dc":0}'
# Moves SHW 4 rows north of wherever it is. 409 if another node holds the target cell.
# Returns: {ok:true, code:"SHW", before:{r,c}, after:{r,c}, dr, dc}
```

### 2.3 Swap two nodes' coordinates

```bash
curl -XPOST http://localhost:1367/api/coords/swap \
  -H 'Content-Type: application/json' \
  -d '{"a":"SHW","b":"FRO"}'
# Returns: {ok:true, swapped:[{code, before, after}, …], verify:["GET /api/graph/validate/SHW", …]}
```

### 2.4 Edit one node field

```bash
./bin/api put node SHW label="Sherwood Forest — Locksley Camp"
./bin/api put node SHW name=forest      # terrain
./bin/api put node SHW act=2
```

A node create or `put` carrying `N`/`E`/`S`/`W` is refused: exits come from the grid.

---

## Part 3 — Graph Endpoints

### 3.1 `GET /api/graph/validate/{code}` — One Node's Cell

Returns the node's cell, whether it is that cell's primary (the only node a player can arrive at, §AUDIT-03x), and which of its four neighbour cells are occupied. `heat` counts them, and `isolated` is `heat: 0`, the per-node view of §3.2. Until §DX-02ky-FU it checked the node's own `N`/`E`/`S`/`W` links, which §CELL-01 stripped. A request passing one of the edge model's query parameters gets it back in `retiredParams`.

```bash
curl "http://localhost:1367/api/graph/validate/BK"
./bin/api validate BK
```

```json
{
  "ok": true, "code": "BK", "label": "Birka Shore — Northern Longship Landing",
  "cell": { "r": 10, "c": 197, "primary": "LHR", "isPrimary": false, "sharedWith": ["LHR"] },
  "neighbours": { "N": null, "S": null, "E": "BMA", "W": null },
  "heat": 1, "isolated": false, "arrivable": false
}
```

---

### 3.2 `GET /api/graph/broken` — Isolated Cells

Returns every node whose grid cell has no occupied cell among its four neighbours: the census `./bin/api broken` prints, read from the same cells `GET /api/grid/heatmap` serves (`heat: 0`). Until §DX-02ky it walked the `N`/`S`/`E`/`W` fields §CELL-01 stripped from every node, and answered `broken: 0`.

**Request:**
```bash
curl "http://localhost:1367/api/graph/broken"
```

The edge model's query parameters are ignored. A request that passes one gets them back in `retiredParams`, with a `note`.

**Response:**
```json
{
  "ok": true,
  "broken": 93,
  "cells": [
    { "r": 2, "c": 194, "code": "LYR", "terrain": "arctic", "heat": 0 },
    …
  ]
}
```

**Practical usage:**

```bash
# How many isolated cells
curl -s 'http://localhost:1367/api/graph/broken' | jq .broken

# Their codes and cells
curl -s 'http://localhost:1367/api/graph/broken' | jq -r '.cells[] | "\(.code) \(.r),\(.c)"'
```

A fix is a re-anchored lat/lon or a carved sea-lane (§WALK-1.5); confirm it with `./bin/api reachability`.

---

---

## Part 4 — Count Endpoints (`/api/count/*`)

These endpoints were added to give fast breakdowns without loading every entity. All are read-only GET requests.

### 4.1 Master count (all collections)

```bash
./bin/api count
# or:
curl -s http://localhost:1367/api/count | jq
```

Returns:
```json
{
  "totals": { "nodes": 241, "quests": 312, "monsters": 216, "terrains": 69, "npcs": 9, "coords": 189 },
  "byAct": { "1":42, "2":31, "3":28, "4":38, "5":22 },
  "byType": { "main":7, "side":48, "combat":130, "skill_check":12, "mission_bit":115 },
  "byTier": { "trivial":18, "easy":64, "medium":48, "hard":30, "boss":56 }
}
```

### 4.2 Node breakdown

```bash
./bin/api count nodes
# or:
curl -s http://localhost:1367/api/count/nodes | jq
```

Returns: `total`, `byAct`, `byTerrain`, `junctionCount`, `nodesWithCoords`, `nodesWithoutCoordsList`.

```bash
# How many nodes have no coordinates?
curl -s http://localhost:1367/api/count/coords | jq '{total, nodesWithoutCoords: (.total - .inNodeMap), nodesWithoutCoordsList}'
```

### 4.3 Quest breakdown

```bash
./bin/api count quests
```

Returns: `total`, `byType`, `topArcs` (top 10 arcs by quest count), `topNodes` (top 10 activateNodes by quest count).

```bash
# Which arc has the most quests?
curl -s http://localhost:1367/api/count/quests | jq '.topArcs[0]'
```

### 4.4 Monster breakdown

```bash
./bin/api count monsters
```

Returns: `total`, `byTier`, `withDrops`, `withoutDrops`, `withTerrain`, `withoutTerrain`.

```bash
# How many monsters lack a drop?
curl -s http://localhost:1367/api/count/monsters | jq '{withDrops, withoutDrops}'
```

### 4.5 NPC breakdown

```bash
./bin/api count npcs
```

Returns: `total`, `byNode` (count per node), `questCounts` (how many quests reference each NPC key).

### 4.6 Terrain breakdown

```bash
./bin/api count terrains
```

Returns: `total`, `withMonsters`, `emptyTerrains`, `usedByNodes`, `unusedByNodes`.

```bash
# Which terrains have no monsters assigned?
curl -s http://localhost:1367/api/count/terrains | jq '.emptyTerrains'
```

### 4.7 Coord coverage

```bash
./bin/api count coords
```

Returns: `total`, `inNodeMap`, `orphanCoords`, `nodesWithoutCoordsList`.

```bash
# Full list of nodes still needing coordinates
curl -s http://localhost:1367/api/count/coords | jq '.nodesWithoutCoordsList'
```

---

## Part 5 — Enhanced List Filters

All filters apply to `GET /api/list/{type}`. Use `./bin/api list <type> --flag value` in the CLI or `curl` with query params.

### 5.1 New node filters

```bash
# Nodes with no coordinates yet
./bin/api list node --no-coords
curl -s 'http://localhost:1367/api/list/node?no_coords=true' | jq '[.[] | .id]'

# Nodes with at least one quest
./bin/api list node --has-quests true
curl -s 'http://localhost:1367/api/list/node?has_quests=true' | jq '[.[] | {id, label}]'

# Nodes with NO quests (good for finding dead nodes)
curl -s 'http://localhost:1367/api/list/node?has_quests=false' | jq '[.[] | .id]'

# Text search across label and ID
./bin/api list node --q birka
curl -s 'http://localhost:1367/api/list/node?q=crypt' | jq '[.[] | {id, label}]'

# Combine: act 1 forest nodes with quests
curl -s 'http://localhost:1367/api/list/node?act=1&terrain=forest&has_quests=true' | jq '[.[] | .id]'

# Return IDs only (compact)
./bin/api list node --no-coords --ids
curl -s 'http://localhost:1367/api/list/node?no_coords=true&ids=true' | jq '.ids'
```

### 5.2 New quest filters

```bash
# Quests assigned to a specific NPC
./bin/api list quest --npc yael
curl -s 'http://localhost:1367/api/list/quest?npc=yael' | jq '[.[] | {id, title}]'

# Quests that reference a monster (e.g. goblin in desc/battle)
./bin/api list quest --monster goblin
curl -s 'http://localhost:1367/api/list/quest?monster=goblin' | jq '[.[] | {id, title}]'

# Quests with an NPC assigned
./bin/api list quest --has-npc true
curl -s 'http://localhost:1367/api/list/quest?has_npc=true' | jq 'length'

# Quests WITHOUT an NPC
./bin/api list quest --has-npc false

# Quests that have a completeFn (complex completion logic)
./bin/api list quest --complete true
curl -s 'http://localhost:1367/api/list/quest?complete=true' | jq '[.[] | .id]'

# Filter by arc prefix
./bin/api list quest --arc mq_
./bin/api list quest --arc quest_wis
curl -s 'http://localhost:1367/api/list/quest?arc=sq_' | jq '[.[] | .id]'

# Combine: side quests at LHR with NPC
curl -s 'http://localhost:1367/api/list/quest?node=LHR&type=side&has_npc=true' | jq '[.[] | {id, title, npc}]'
```

### 5.3 New monster filters

```bash
# Monsters with loot drops
./bin/api list monster --has-drop true
curl -s 'http://localhost:1367/api/list/monster?has_drop=true' | jq '[.[] | {key, name}]'

# Monsters NOT in any terrain (orphan monsters)
./bin/api list monster --no-terrain
curl -s 'http://localhost:1367/api/list/monster?no_terrain=true' | jq '[.[] | .key]'

# Combine: easy tier without drops
curl -s 'http://localhost:1367/api/list/monster?tier=easy&has_drop=false' | jq '[.[] | .key]'
```

### 5.4 IDs-only for any type

```bash
./bin/api list ids node
./bin/api list ids quest
./bin/api list ids monster
./bin/api list ids npc
./bin/api list ids terrain

# Equivalent curl forms:
curl -s 'http://localhost:1367/api/list/ids/node'    | jq '.ids | length'
curl -s 'http://localhost:1367/api/list/ids/quest'   | jq '.ids[]' | head -10
curl -s 'http://localhost:1367/api/list/ids/terrain' | jq '.ids'

# IDs from any filtered list (add ?ids=true)
curl -s 'http://localhost:1367/api/list/node?act=1&ids=true'           | jq '.ids'
curl -s 'http://localhost:1367/api/list/quest?type=main&ids=true'      | jq '.ids'
curl -s 'http://localhost:1367/api/list/monster?tier=deadly&ids=true'    | jq '.ids'
```

### 5.5 List index

```bash
./bin/api list
# or:
curl -s http://localhost:1367/api/list | jq
```

Returns every available list route with counts, available filters, and example params.

---

## Part 6 — Location List Form

`GET /api/location` without an ID now lists all locations.

### 6.1 List all locations

```bash
./bin/api location
curl -s http://localhost:1367/api/location | jq 'length'
```

Each entry: `{ code, label, terrain, act, counts:{quests, npcs, monsters, linkedNodes} }`.

### 6.2 Filter locations

```bash
# Act 1 locations only
./bin/api location --act 1
curl -s 'http://localhost:1367/api/location?act=1' | jq '[.[] | {code, label, counts}]'

# Locations with quests in act 3
curl -s 'http://localhost:1367/api/location?act=3&has_quests=true' | jq '[.[] | .code]'

# Forest terrain locations
./bin/api location --terrain forest
curl -s 'http://localhost:1367/api/location?terrain=crypt' | jq '[.[] | {code, label}]'

# Text search
./bin/api location --q birka
curl -s 'http://localhost:1367/api/location?q=tavern' | jq '[.[] | {code, label}]'

# IDs only
curl -s 'http://localhost:1367/api/location?ids=true' | jq '.ids | length'
```

---

## Part 7 — Verbose 404 Responses

When you request an entity with an unknown ID, the server now returns the count and all valid IDs for that type.

### 7.1 Unknown node

```bash
curl -s http://localhost:1367/api/node/BADCODE | jq
```
```json
{
  "error": "node \"BADCODE\" not found",
  "type": "node",
  "hint": "GET /api/location lists all locations",
  "count": 241,
  "allNodeCodes": ["LHR","BMA","TLL","MHQ","LLA","KRN","BK","FRO","SDQ","TRD","…"]
}
```

### 7.2 Unknown quest

```bash
curl -s http://localhost:1367/api/quest/badquest | jq '{error, count}'
```

### 7.3 Unknown monster

```bash
curl -s http://localhost:1367/api/monster/badkey | jq '{error, count, allKeys:.allIds[:5]}'
```

### 7.4 Practical use: autocomplete / discover IDs

```bash
# Get all valid node codes to pick from
curl -s 'http://localhost:1367/api/list/ids/node' | jq -r '.ids | sort[]'

# Get all valid monster keys
curl -s 'http://localhost:1367/api/list/ids/monster' | jq -r '.ids | sort[]' | grep "shadow\|wraith\|ghost"
```

---

## Part 8 — Enhanced GET Detail Fields

### 8.1 Node detail (new fields)

```bash
curl -s http://localhost:1367/api/node/LHR | jq '.connections'
```

New in connections envelope:
- `coords` — `{r, c}` grid position if set
- `links` — full target node objects for each N/E/S/W direction
- `questCount` / `questIds[]` — count and IDs of quests at this node
- `npcCount` — named NPC count

### 8.2 Quest detail (new fields)

```bash
curl -s http://localhost:1367/api/quest/mq_1 | jq '.entity'
```

New in entity: all schema fields now explicit (null if unset, not omitted):
- `nodeDetails` — full node object for `activateNode`
- `npcDetails` — full NPC object if `npc` key is set
- Every optional field (`rewardText`, `xpAward`, `checkDC`, etc.) shown as null rather than absent

```bash
# Find all quests with no passText
curl -s http://localhost:1367/api/list/quest | python3 -c "
import json,sys
qs = json.load(sys.stdin)
for q in qs:
  if q.get('passText') is None: print(q['id'])
"
```

### 8.3 Monster detail (new fields)

```bash
curl -s http://localhost:1367/api/monster/goblin | jq '{drop:.connections.drop, questCount:.connections.questCount, terrains:[.connections.terrains[].key]}'
```

### 8.4 NPC detail (new fields)

```bash
curl -s http://localhost:1367/api/npc/yael | jq '{nodeDetails:.connections.nodeDetails, questCount:.connections.questCount}'
```
