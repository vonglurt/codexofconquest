<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# WBAPI FAQ — Map Editing, Coordinate Surgery, and Junction Planning

> **Philosophy:** One record at a time. No mass edits. No mass deletes. Every change is:
> 1. **Find** the specific record
> 2. **Read** its current state
> 3. **Plan** the minimal edit
> 4. **Apply** with a single targeted call
> 5. **Verify** the result

---

## Part 1 — Reading and Finding

### 1.1 Get one node completely

```bash
wb get node BK
# Returns: label, terrain, N/E/S/W links, act, quests, monsters, NPCs, coords (if set)
```

### 1.2 Get coordinates for one node

```bash
curl http://localhost:1367/api/coords/near/BK?radius=0
# Returns: BK's r,c and any nodes within radius=0
# To just get BK coords: parse entity.r and entity.c from wb get node BK
```

### 1.3 Find all nodes near a position

```bash
curl "http://localhost:1367/api/coords/near/BK?radius=8"
# Returns: all nodes within 8 cells of BK, sorted by distance
# Use to check: is the slot I want to use occupied?
```

### 1.4 Find all nodes with no coordinates

```bash
curl http://localhost:1367/api/coords | python3 -c "
import json, sys, subprocess
coords = json.load(sys.stdin)['coords']
result = subprocess.run(['node','api/wb.js','list','node','--raw'], capture_output=True, text=True)
all_nodes = [n['id'] for n in json.loads(result.stdout)]
missing = [n for n in all_nodes if n not in coords]
print(f'Missing coords: {len(missing)}')
for n in missing[:20]: print(f'  {n}')
"
```

### 1.5 Find all nodes in an act

```bash
wb list node | grep '"act":1'
# Or:
curl "http://localhost:1367/api/list/node?act=1"
```

### 1.6 Find all nodes using a terrain type

```bash
wb list node --terrain beach
```

### 1.7 Find bidirectional link errors

```bash
wb audit --map
# Returns: all N/E/S/W links where A.dir→B but B.opp_dir≠A
# Each error shows exact fix command
```

### 1.8 Validate one node's connections

```bash
curl "http://localhost:1367/api/graph/validate/BK"
# NEW ENDPOINT (see Part 3)
# Returns: for each direction, gap distance, alignment status, fix suggestion
```

### 1.9 Find all broken walkability edges

```bash
curl "http://localhost:1367/api/graph/broken?maxGap=4"
# NEW ENDPOINT (see Part 3)
# Returns: all connected pairs where gap > maxGap or off-axis
```

### 1.10 Trace a walkable path between two nodes

```bash
curl "http://localhost:1367/api/graph/path/BK/TL"
# NEW ENDPOINT (see Part 3)
# Returns: step-by-step walkable path, or "not reachable" with nearest reachable ancestor
```

---

## Part 2 — Editing One Record at a Time

### 2.1 Move one node's coordinates (absolute)

```bash
curl -XPUT http://localhost:1367/api/coords/SHW \
  -H 'Content-Type: application/json' \
  -d '{"r":104,"c":136}'
# Checks collision first — returns 409 if slot occupied
# Returns: {ok:true, code:"SHW", prev:{r:104,c:144}, coords:{r:104,c:136}}
```

### 2.2 Nudge one node's coordinates (relative)

```bash
curl -XPOST http://localhost:1367/api/coords/SHW/nudge \
  -H 'Content-Type: application/json' \
  -d '{"dr":-4,"dc":0}'
# NEW ENDPOINT — moves SHW 4 rows north from wherever it currently is
# Checks collision. Returns new coords.
```

### 2.3 Swap two nodes' coordinates

```bash
curl -XPOST http://localhost:1367/api/coords/swap \
  -H 'Content-Type: application/json' \
  -d '{"a":"J52","b":"SHW"}'
# NEW ENDPOINT — atomically swaps positions of J52 and SHW
# Useful when a junction occupies the slot a real node needs
```

### 2.4 Edit one node field (label, text, terrain, act, N/E/S/W)

```bash
# Change a directional link:
wb put node SHW W=ROT
wb put node ROT E=SHW

# Change label:
wb put node SHW label="Sherwood Forest — Main Junction"

# Change terrain:
wb put node SHW name=forest

# Change act number:
wb put node SHW act=2
```

### 2.5 Clear one directional link

```bash
wb put node SHW W=null
# Removes the W connection from SHW
```

### 2.6 Wire one directional link (both ends at once)

```bash
curl -XPOST http://localhost:1367/api/graph/link \
  -H 'Content-Type: application/json' \
  -d '{"a":"SHW","aDir":"W","b":"ROT"}'
# NEW ENDPOINT — sets SHW.W=ROT and ROT.E=SHW in one call
# Returns error if either slot is already occupied
```

---

## Part 3 — Graph & Coordinate Endpoints

> All endpoints below are live. Every broken connection now returns a `moveSuggestion` block with ranked placement candidates — see §3.9 for the algorithm.

### 3.1 `GET /api/graph/validate/{code}` — Single Node Walkability Check

Checks each N/E/S/W connection against grid rules (gap ≤ maxGap, same axis). Every broken connection returns a `moveSuggestion` with up to 7 ranked candidate positions for the node that needs to move.

**Request:**
```bash
curl "http://localhost:1367/api/graph/validate/SHW?maxGap=4"
```

**Connection status values:**

| Status | Meaning |
|---|---|
| `ok` | Aligned, within maxGap |
| `unset` | No connection in this direction |
| `src_no_coords` | This node has no coordinates |
| `tgt_no_coords` | Target has no coordinates — `moveSuggestion` tells where to place it |
| `off_axis` | Source and target are on different rows and columns — needs axis alignment |
| `gap_too_large` | Correct axis but gap > maxGap — needs junction(s) between them |
| `diagonal_and_gap` | Both off-axis and too far |
| `wrong_direction` | Target is in the opposite direction — check coord swap |

**Response (with moveSuggestion):**
```json
{
  "code": "SHW",
  "coords": {"r": 104, "c": 144},
  "maxGap": 4,
  "connections": {
    "N": { "target": null, "status": "unset" },
    "E": { "target": null, "status": "unset" },
    "S": { "target": null, "status": "unset" },
    "W": {
      "target": "ROT",
      "targetCoords": {"r": 104, "c": 132},
      "gap": 12,
      "axisOffset": 0,
      "status": "gap_too_large",
      "fix": "POST /api/graph/fill-gap {\"from\":\"SHW\",\"dir\":\"W\",\"to\":\"ROT\",\"maxGap\":4}",
      "moveSuggestion": {
        "node": "(junction)",
        "note": "Gap=12 — insert a junction between \"SHW\" and \"ROT\"",
        "recommended": {"r": 104, "c": 136, "reason": "midpoint between source and destination", "free": true,
          "moveCmd": "curl -s -XPOST http://localhost:1367/api/node -H 'Content-Type: application/json' -d '{\"code\":\"J_new\",\"name\":\"junction\",\"label\":\"Junction\",\"act\":1}' && curl -s -XPUT http://localhost:1367/api/coords/J_new -H 'Content-Type: application/json' -d '{\"r\":104,\"c\":136}'"},
        "candidates": [
          {"r":104,"c":136,"reason":"midpoint between source and destination",           "free":true,  "occupiedBy":null},
          {"r":104,"c":144,"reason":"source row, mid-column",                            "free":false, "occupiedBy":"SHW"},
          {"r":104,"c":132,"reason":"source column, mid-row",                            "free":false, "occupiedBy":"ROT"},
          {"r":104,"c":138,"reason":"destination row, mid-column",                       "free":true,  "occupiedBy":null},
          {"r":104,"c":132,"reason":"destination column, mid-row",                       "free":false, "occupiedBy":"ROT"},
          {"r":104,"c":132,"reason":"source row, destination column",                    "free":false, "occupiedBy":"ROT"},
          {"r":104,"c":144,"reason":"destination row, source column",                    "free":false, "occupiedBy":"SHW"}
        ]
      }
    }
  },
  "also_target_of": [
    {
      "from": "NRG", "fromDir": "N", "fromCoords": {"r": 112, "c": 136},
      "gap": 8, "axisOffset": 8,
      "status": "off_axis",
      "moveSuggestion": {
        "node": "SHW",
        "note": "\"SHW\" is off from \"NRG\"'s N connection — move it between them",
        "recommended": {"r": 108, "c": 136, "reason": "midpoint between source and destination", "free": true,
          "moveCmd": "curl -s -XPUT http://localhost:1367/api/coords/SHW -H 'Content-Type: application/json' -d '{\"r\":108,\"c\":136}'"},
        "candidates": [
          {"r":108,"c":136,"reason":"midpoint between source and destination","free":true},
          {"r":112,"c":140,"reason":"source row, mid-column",                  "free":true},
          {"r":108,"c":136,"reason":"source column, mid-row",                  "free":true},
          {"r":104,"c":140,"reason":"destination row, mid-column",             "free":true},
          {"r":108,"c":144,"reason":"destination column, mid-row",             "free":false,"occupiedBy":"SHW"},
          {"r":112,"c":144,"reason":"source row, destination column",          "free":true},
          {"r":104,"c":136,"reason":"destination row, source column",          "free":true}
        ]
      }
    }
  ],
  "diagnosis": "CORNER NODE — must sit at axis intersection: r=104 c=136",
  "fixCommand": "PUT /api/coords/SHW {\"r\":104,\"c\":136}"
}
```

**Practical usage:**

```bash
# Check a node
curl "http://localhost:1367/api/graph/validate/BK?maxGap=4"

# Get just the diagnosis
curl -s "http://localhost:1367/api/graph/validate/SHW?maxGap=4" | jq '.diagnosis'

# Get the first free candidate for every broken connection
curl -s "http://localhost:1367/api/graph/validate/BK?maxGap=4" | jq '
  .connections | to_entries[]
  | select(.value.status != "ok" and .value.status != "unset")
  | {dir: .key, status: .value.status,
     move: (.value.moveSuggestion.candidates // [] | map(select(.free)) | .[0])}'

# Get the ready-to-run moveCmd for the recommended position
curl -s "http://localhost:1367/api/graph/validate/SHW?maxGap=4" | jq '
  [.connections[].moveSuggestion, .also_target_of[].moveSuggestion]
  | map(select(. != null)) | .[].recommended.moveCmd'
```

---

### 3.2 `GET /api/graph/broken?maxGap=4` — All Broken Edges

Returns every connected pair that violates walkability rules. Each edge includes a `moveSuggestion` with ranked candidates for where to move the off-axis or unpositioned node.

**Request:**
```bash
curl "http://localhost:1367/api/graph/broken?maxGap=4&root=BK"
```

**Query params:**

| Param | Default | Description |
|---|---|---|
| `maxGap` | 4 | Maximum allowed distance between connected nodes |
| `root` | (all) | Only report edges reachable from this node |

**Edge types:**

| Type | Fix strategy |
|---|---|
| `diagonal` | Move destination onto source's row or column — use `moveSuggestion` |
| `diagonal_and_gap` | Move destination closer AND onto axis — use `moveSuggestion` |
| `gap_too_large` | Insert junction(s) between them — use `moveSuggestion` |
| `missing_coords` | One node has no position — use `moveSuggestion` to place it |

**Response:**
```json
{
  "ok": true,
  "maxGap": 4,
  "totalChecked": 401,
  "broken": 13,
  "categories": {"diagonal": 2, "gap_too_large": 9, "missing_coords": 2},
  "edges": [
    {
      "from": "NRG", "fromCoords": {"r":112,"c":136},
      "dir": "N",
      "to": "SHW", "toCoords": {"r":104,"c":144},
      "gap": 8, "axisOffset": 8, "type": "diagonal",
      "fix": "corner_junction",
      "moveSuggestion": {
        "node": "SHW",
        "note": "\"SHW\" is off-axis — move it onto the correct axis of \"NRG\"",
        "recommended": {"r":104,"c":136,"reason":"midpoint between source and destination","free":true,
          "moveCmd":"curl -s -XPUT http://localhost:1367/api/coords/SHW -H 'Content-Type: application/json' -d '{\"r\":104,\"c\":136}'"},
        "candidates": [
          {"r":104,"c":136,"reason":"midpoint between source and destination","free":true},
          {"r":112,"c":140,"reason":"source row, mid-column",                  "free":true},
          {"r":108,"c":136,"reason":"source column, mid-row",                  "free":true},
          {"r":104,"c":140,"reason":"destination row, mid-column",             "free":true},
          {"r":108,"c":144,"reason":"destination column, mid-row",             "free":false,"occupiedBy":"J88"},
          {"r":112,"c":144,"reason":"source row, destination column",          "free":true},
          {"r":104,"c":136,"reason":"destination row, source column",          "free":true}
        ]
      }
    },
    {
      "from": "ROT", "fromCoords": {"r":104,"c":132},
      "dir": "E",
      "to": "SHW", "toCoords": {"r":104,"c":144},
      "gap": 12, "axisOffset": 0, "type": "gap_too_large",
      "junctionsNeeded": 2,
      "fix": "fill_gap",
      "moveSuggestion": {
        "node": "(new junction)",
        "note": "Gap=12 between \"ROT\" and \"SHW\" — insert 2 junction(s) between them",
        "recommended": {"r":104,"c":136,"reason":"midpoint between source and destination","free":true,
          "moveCmd":"curl -s -XPOST http://localhost:1367/api/node ... && curl -s -XPUT http://localhost:1367/api/coords/J_new ..."},
        "candidates": [
          {"r":104,"c":136,"reason":"midpoint between source and destination","free":true},
          {"r":104,"c":132,"reason":"source column, mid-row",                  "free":false,"occupiedBy":"ROT"},
          {"r":104,"c":140,"reason":"destination column, mid-row",             "free":true},
          {"r":104,"c":136,"reason":"source row, destination column",          "free":true},
          {"r":104,"c":132,"reason":"destination row, source column",          "free":false,"occupiedBy":"ROT"}
        ]
      }
    },
    {
      "from": "YRK", "dir": "S", "to": "ZRH",
      "type": "missing_coords",
      "missingCoords": "ZRH",
      "moveSuggestion": {
        "node": "ZRH",
        "note": "\"ZRH\" has no coordinates — place it between the connected nodes",
        "recommended": {"r":116,"c":136,"reason":"3 steps S from neighbor \"YRK\"","free":true,
          "moveCmd":"curl -s -XPUT http://localhost:1367/api/coords/ZRH -H 'Content-Type: application/json' -d '{\"r\":116,\"c\":136}'"},
        "candidates": [
          {"r":116,"c":136,"reason":"3 steps S from neighbor \"YRK\"",        "free":true},
          {"r":112,"c":136,"reason":"midpoint 1.5 steps S from \"YRK\"",      "free":true},
          {"r":116,"c":136,"reason":"2 steps S from \"YRK\"",                 "free":true}
        ]
      }
    }
  ]
}
```

**Practical usage:**

```bash
# Count broken edges from the main hub
curl -s 'http://localhost:1367/api/graph/broken?maxGap=4&root=BK' | jq '{broken, categories}'

# Get the recommended moveCmd for every broken edge
curl -s 'http://localhost:1367/api/graph/broken?maxGap=4&root=BK' | jq \
  '[.edges[] | {from, dir, to, type, cmd: .moveSuggestion.recommended.moveCmd}]'

# Get only edges where the recommended slot is free
curl -s 'http://localhost:1367/api/graph/broken?maxGap=4' | jq \
  '[.edges[] | select(.moveSuggestion.recommended.free == true)
    | {from, to, type, r:.moveSuggestion.recommended.r, c:.moveSuggestion.recommended.c}]'

# Triage by type
curl -s 'http://localhost:1367/api/graph/broken?maxGap=4' | jq \
  '[.edges[] | select(.type=="diagonal") | {from, dir, to, cmd:.moveSuggestion.recommended.moveCmd}]'

# Find all nodes with missing coordinates and where to put them
curl -s 'http://localhost:1367/api/graph/broken?maxGap=4' | jq \
  '[.edges[] | select(.type=="missing_coords") | {missing:.missingCoords, place:.moveSuggestion.recommended | {r,c,reason,free}}]'
```

---

### 3.3 `POST /api/graph/corner-junction` — Auto-fix Diagonal Connection

When two nodes connect diagonally (e.g., ROT→E→SHW and NRG→N→SHW, but SHW is in the wrong position), this endpoint creates a junction at the **axis intersection** and re-wires appropriately.

**Use case:** `NRG(112,136) -N-> SHW(104,144)` is diagonal. SHW also receives `ROT(104,132) -E->`. The correct position for SHW is `(104,136)` — same row as ROT, same column as NRG. But if that slot is occupied, this endpoint creates an intermediate corner junction.

**Request:**
```json
POST /api/graph/corner-junction
{
  "nodeA": "ROT",
  "dirA": "E",
  "nodeB": "NRG",
  "dirB": "N",
  "sharedTarget": "SHW"
}
```

**What it does:**
1. Finds the axis intersection: `r=ROT.r=104`, `c=NRG.c=136` → corner at `(104,136)`
2. Checks if `(104,136)` is free:
   - If free AND `SHW` is at wrong position: moves `SHW` to `(104,136)` ✓
   - If free AND `SHW` doesn't exist yet: creates `SHW` there ✓
   - If occupied by another node (e.g., `J52`): tries `(104,136±step)` or reports conflict
3. Places a junction at `(104, 132+step)` on ROT's east axis if gap > maxGap
4. Places a junction at `(108, 136)` on NRG's north axis if gap > maxGap

**Response:**
```json
{
  "ok": true,
  "action": "moved_node",
  "node": "SHW",
  "from": {"r": 104, "c": 144},
  "to": {"r": 104, "c": 136},
  "displaced": null,
  "additionalJunctions": [],
  "verify": "GET /api/graph/validate/SHW"
}
```

Or if slot occupied:
```json
{
  "ok": false,
  "conflict": "J52 at (104,136)",
  "options": [
    {
      "action": "swap",
      "command": "POST /api/coords/swap {\"a\":\"J52\",\"b\":\"SHW\"}",
      "note": "Then verify J52's connections still work at (104,144)"
    },
    {
      "action": "move_j52_first",
      "command": "PUT /api/coords/J52 {\"r\":104,\"c\":150}",
      "note": "J52 connects N→YRK(98,150) S→EMT(104,150) — col 150 is correct for J52"
    }
  ]
}
```

---

### 3.4 `POST /api/graph/fill-gap` — Long Gap Junction Plan

When two directly-connected nodes are more than 4 cells apart on the same axis, this generates a **plan** for inserting junction nodes to make the path walkable. Does NOT execute — returns a plan for review.

**Request:**
```json
POST /api/graph/fill-gap
{
  "from": "KLN",
  "dir": "E",
  "to": "TPR",
  "maxGap": 4,
  "step": 4,
  "terrain": "inherit",
  "dryRun": true
}
```

**What it calculates:**
- `KLN(100,132) -E-> TPR(100,172)`: gap = 40
- Needs `40/4 - 1 = 9` intermediate junctions
- Plans positions: `(100,136), (100,140), (100,144), (100,148), (100,152), (100,156), (100,160), (100,164), (100,168)`
- Checks each slot for collision
- Finds which terrain to inherit from `KLN` (or specifies explicitly)

**Response (dryRun=true):**
```json
{
  "ok": true,
  "dryRun": true,
  "from": "KLN", "to": "TPR",
  "dir": "E", "gap": 40,
  "maxGap": 4, "step": 4,
  "junctionsNeeded": 9,
  "terrain": "junction (inherited from KLN: forest)",
  "plan": [
    {"code":"J_new_1","r":100,"c":136,"slot":"free"},
    {"code":"J_new_2","r":100,"c":140,"slot":"free"},
    {"code":"J_new_3","r":100,"c":144,"slot":"free"},
    {"code":"J_new_4","r":100,"c":148,"slot":"OCCUPIED by J55"},
    {"code":"J_new_5","r":100,"c":152,"slot":"free"},
    {"code":"J_new_6","r":100,"c":156,"slot":"free"},
    {"code":"J_new_7","r":100,"c":160,"slot":"free"},
    {"code":"J_new_8","r":100,"c":164,"slot":"free"},
    {"code":"J_new_9","r":100,"c":168,"slot":"OCCUPIED by J56"}
  ],
  "conflicts": [
    {"slot":[100,148],"occupant":"J55","suggestion":"move J55 to (100,147) or (101,148)"},
    {"slot":[100,168],"occupant":"J56","suggestion":"move J56 to (100,167) or (101,168)"}
  ],
  "wireChain": "KLN.E→J_new_1→J_new_2→...→J_new_9→TPR.W",
  "executeCommand": "POST /api/graph/fill-gap (without dryRun:true)"
}
```

**Execute (after reviewing plan):**
```json
POST /api/graph/fill-gap
{
  "from": "KLN",
  "dir": "E",
  "to": "TPR",
  "maxGap": 4,
  "step": 4,
  "terrain": "inherit",
  "dryRun": false,
  "resolveConflicts": "shift"
}
```
`resolveConflicts: "shift"` — if a slot is occupied, shift the junction ±1 cell perpendicular (acceptable small deviation) rather than failing. Or `"abort"` to stop at first conflict.

---

### 3.5 `POST /api/coords/{code}/nudge` — Relative Coordinate Move

Move a node by a relative offset without needing to know its current position first.

**Request:**
```bash
curl -XPOST http://localhost:1367/api/coords/J52/nudge \
  -H 'Content-Type: application/json' \
  -d '{"dr":0,"dc":14}'
# Moves J52 14 columns east (from c=136 to c=150)
```

**Response:**
```json
{
  "ok": true,
  "code": "J52",
  "before": {"r": 104, "c": 136},
  "after": {"r": 104, "c": 150},
  "collision": null,
  "connectionsAffected": [
    {"dir":"N","target":"YRK","gapBefore":6,"gapAfter":6,"alignBefore":"off-axis","alignAfter":"aligned"},
    {"dir":"S","target":"EMT","gapBefore":0,"gapAfter":0,"alignBefore":"same-cell","alignAfter":"aligned"}
  ]
}
```

---

### 3.6 `POST /api/coords/swap` — Swap Two Nodes' Positions

Atomically exchange coordinates of two nodes. Used when a junction occupies the slot that a real node needs.

**Request:**
```bash
curl -XPOST http://localhost:1367/api/coords/swap \
  -H 'Content-Type: application/json' \
  -d '{"a":"J52","b":"SHW"}'
```

**Response:**
```json
{
  "ok": true,
  "swapped": [
    {"code":"J52","before":{"r":104,"c":136},"after":{"r":104,"c":144}},
    {"code":"SHW","before":{"r":104,"c":144},"after":{"r":104,"c":136}}
  ],
  "connectionsCheck": {
    "J52": {"N":"gap changed 6→8 (warn)","S":"gap unchanged 0"},
    "SHW": {"W":"gap changed 12→4 (fixed)","N_from_NRG":"offset changed 8→0 (fixed)"}
  },
  "verify": [
    "GET /api/graph/validate/J52",
    "GET /api/graph/validate/SHW"
  ]
}
```

---

### 3.7 `POST /api/graph/link` — Wire Both Ends of a Connection

Sets `A.dir = B` and `B.opposite = A` in one atomic operation.

**Request:**
```bash
curl -XPOST http://localhost:1367/api/graph/link \
  -H 'Content-Type: application/json' \
  -d '{"a":"SHW","aDir":"W","b":"ROT"}'
# Sets SHW.W=ROT and ROT.E=SHW
```

**Error if slot occupied:**
```json
{
  "ok": false,
  "error": "ROT.E already set to 'NGM' — clear it first with wb put node ROT E=null"
}
```

---

### 3.8 `GET /api/graph/path/{from}/{to}` — Walkable Path Query

Find whether two nodes are connected by a walkable path (gap ≤ maxGap, same-axis only).

**Request:**
```
GET /api/graph/path/BK/TL?maxGap=4
```

**Response:**
```json
{
  "ok": true,
  "from": "BK", "to": "TL",
  "reachable": false,
  "nearestReachableAncestor": {
    "code": "J75",
    "hops": 8,
    "distanceToTarget": 3,
    "blockingEdge": {"from":"J75","dir":"S","to":"ORL","gap":8,"type":"gap_too_large"}
  },
  "walkablePath": ["BK","J56","J57","NIL","J59","J60","J61","J75"],
  "fix": "POST /api/graph/fill-gap {\"from\":\"J75\",\"dir\":\"S\",\"to\":\"ORL\"}"
}
```

---

## Part 4 — The Walk-the-Loop Procedure

**Goal:** Starting from BK, traverse every N/E/S/W connection, verify it is walkable, fix it if not.

### Step 0: Establish the start

```bash
wb get node BK
# Confirm: BK has S→BLT and W→J56. Note coords.
curl "http://localhost:1367/api/graph/validate/BK?maxGap=4"
# See which directions are OK, which need work.
```

### Step 1: Find all broken edges from BK's reachable subgraph

```bash
curl "http://localhost:1367/api/graph/broken?maxGap=4&root=BK" > broken.json
cat broken.json | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f'{d[\"broken\"]} broken edges')
for e in d['edges']:
    print(f'  {e[\"from\"]}-{e[\"dir\"]}->{e[\"to\"]}  type={e[\"type\"]}  fix={e[\"fix\"]}')
"
```

### Step 2: Triage the broken edges

**Priority order:**
1. **Off-axis (diagonal)** — fix first, because they prevent the whole subgraph from being connected
2. **Missing coords** — can't validate without coordinates
3. **Large gaps (>12)** — longest paths are hardest to fix; plan junction chains
4. **Small gaps (5–8)** — quick fixes: move node 1–2 cells closer

### Step 3: Fix one diagonal connection

```bash
# Identify it:
#   NRG(112,136) -N-> SHW(104,144)  — diagonal (offset=8)
#   ROT(104,132) -E-> SHW(104,144)  — gap=12 (but same row)
# SHW is a CORNER NODE. Both connections converge on SHW.

# Step 3a: Check what's at the needed position (104,136)
curl "http://localhost:1367/api/coords/near/BK?radius=30" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); [print(n) for n in d['nearby'] if n['r']==104 and n['c']==136]"

# Step 3b: If J52 is at (104,136), move J52 first
curl "http://localhost:1367/api/graph/validate/J52?maxGap=4"
# J52 connects N→YRK(98,150) S→EMT(104,150) — it BELONGS at c=150, not c=136
# Move J52 to its correct column:
curl -XPOST http://localhost:1367/api/coords/J52/nudge -d '{"dr":0,"dc":14}'

# Step 3c: Now move SHW to the correct intersection
curl -XPUT http://localhost:1367/api/coords/SHW -d '{"r":104,"c":136}'

# Step 3d: Verify
curl "http://localhost:1367/api/graph/validate/SHW?maxGap=4"
```

### Step 4: Fix a small gap (gap=8, needs 1 junction)

**Example:** `LDN(120,144) -S-> LON(128,144)` gap=8

```bash
# Step 4a: Check what's between them
curl "http://localhost:1367/api/coords/near/LDN?radius=10" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); [print(n) for n in d['nearby'] if n['r']==124 and n['c']==144]"
# If (124,144) is free:

# Step 4b: Create junction at midpoint
curl -XPOST http://localhost:1367/api/graph/junction -d '{
  "anchor": "LDN",
  "anchorDir": "S",
  "clusterEntry": "LON",
  "clusterDir": "S"
}'
# This creates J_new at (124,144), wires LDN.S→J_new and J_new.S→LON

# Step 4c: Verify
curl "http://localhost:1367/api/graph/validate/LDN?maxGap=4"
curl "http://localhost:1367/api/graph/validate/LON?maxGap=4"
```

### Step 5: Fix a large gap (gap=40, needs 9 junctions)

**Example:** `KLN(100,132) -E-> TPR(100,172)` gap=40

```bash
# Step 5a: Plan the junction chain (dry run)
curl -XPOST http://localhost:1367/api/graph/fill-gap -d '{
  "from": "KLN",
  "dir": "E",
  "to": "TPR",
  "maxGap": 4,
  "step": 4,
  "terrain": "inherit",
  "dryRun": true
}'
# Review the plan — check for conflicts

# Step 5b: If conflicts, resolve one at a time
# e.g., if (100,148) is occupied by J55, move J55 first:
curl "http://localhost:1367/api/graph/validate/J55?maxGap=4"
curl -XPOST http://localhost:1367/api/coords/J55/nudge -d '{"dr":1,"dc":0}'
# Now (100,148) is free

# Step 5c: Execute the fill-gap
curl -XPOST http://localhost:1367/api/graph/fill-gap -d '{
  "from": "KLN",
  "dir": "E",
  "to": "TPR",
  "maxGap": 4,
  "step": 4,
  "terrain": "inherit",
  "dryRun": false
}'

# Step 5d: Verify the new chain
curl "http://localhost:1367/api/graph/path/KLN/TPR?maxGap=4"
```

### Step 6: Re-check reachability

```bash
curl "http://localhost:1367/api/graph/broken?maxGap=4&root=BK" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(f'{d[\"broken\"]} remaining')"
```

---

## Part 5 — Use Cases: Finding, Filtering, Selecting

### Find by position

```bash
# All nodes in a row:
curl http://localhost:1367/api/coords | python3 -c "
import json,sys; c=json.load(sys.stdin)['coords']
for k,v in c.items():
    if v['r'] == 104: print(k, v)
"

# All nodes in a column:
for k,v in c.items():
    if v['c'] == 136: print(k, v)

# All nodes in a rectangle:
for k,v in c.items():
    if 100<=v['r']<=120 and 128<=v['c']<=152: print(k,v)
```

### Find by connection pattern

```bash
# All junction nodes (code starts with J):
wb list node --raw | python3 -c "
import json,sys; nodes=json.load(sys.stdin)
junctions = [n for n in nodes if n['id'].startswith('J')]
print(f'{len(junctions)} junction nodes')
"

# All corner junctions (2 directions on different axes):
wb list node --raw | python3 -c "
import json,sys
nodes = json.load(sys.stdin)
for n in nodes:
    dirs = {d: n.get(d) for d in ['N','E','S','W'] if n.get(d)}
    ns = [d for d in dirs if d in ('N','S')]
    ew = [d for d in dirs if d in ('E','W')]
    if ns and ew and n['id'].startswith('J'):
        print(n['id'], 'corner:', dirs)
"

# Nodes with only 2 connections (dead-end junctions to clean up):
for n in nodes:
    c = sum(1 for d in ['N','E','S','W'] if n.get(d))
    if c == 1 and n['id'].startswith('J'):
        print(n['id'], 'dead end')
```

### Find by act and terrain

```bash
wb list node --raw | python3 -c "
import json, sys
nodes = json.load(sys.stdin)
# Act 1, forest terrain, no coords:
for n in nodes:
    if n.get('act') == 1 and n.get('name') == 'forest':
        print(n['id'], n.get('label',''))
"
```

### Find the nearest free slot to a position

```bash
curl "http://localhost:1367/api/coords/near/SHW?radius=16" | python3 -c "
import json, sys
d = json.load(sys.stdin)
# nearby = occupied slots; available = free slots
print('Occupied nearby:', [(n['code'], n['r'], n['c']) for n in d['nearby'][:5]])
print('Free nearby:', d.get('available', [])[:5])
"
```

---

## Part 6 — Terrain Inheritance Rule

When creating a junction node, the terrain type should match the path it's on. Rules:

1. **`inherit`** (default) — use the source node's terrain
2. **`path`** — force terrain to `road` or `path` (generic walkable)
3. **Explicit** — specify `"terrain":"forest"` directly

```bash
# Junction with inherited terrain:
curl -XPOST http://localhost:1367/api/graph/junction -d '{
  "anchor": "SHW",
  "anchorDir": "E",
  "terrain": "inherit"
}'

# Junction with explicit terrain:
curl -XPOST http://localhost:1367/api/graph/junction -d '{
  "anchor": "SHW",
  "anchorDir": "E",
  "terrain": "city"
}'

# Fill-gap with inherited terrain (all junctions in chain get anchor's terrain):
curl -XPOST http://localhost:1367/api/graph/fill-gap -d '{
  "from": "KLN",
  "dir": "E",
  "to": "TPR",
  "terrain": "inherit",
  "dryRun": false
}'
```

---

## Part 7 — Coordinate Editing Without Full Data Dump

### Edit one coordinate in place (no dump needed)

```bash
# Move by exact position:
wb put node SHW r=104 c=136
# OR using the coords endpoint:
curl -XPUT http://localhost:1367/api/coords/SHW -d '{"r":104,"c":136}'

# Move relatively (NEW):
curl -XPOST http://localhost:1367/api/coords/SHW/nudge -d '{"dr":0,"dc":-8}'

# Swap two nodes:
curl -XPOST http://localhost:1367/api/coords/swap -d '{"a":"J52","b":"SHW"}'
```

### Check before editing

```bash
# Step 1: What's at the target slot?
curl "http://localhost:1367/api/coords/near/SHW?radius=4"

# Step 2: What connects to the node I'm moving?
curl "http://localhost:1367/api/graph/validate/SHW?maxGap=4"

# Step 3: Move it
curl -XPUT http://localhost:1367/api/coords/SHW -d '{"r":104,"c":136}'

# Step 4: Verify
curl "http://localhost:1367/api/graph/validate/SHW?maxGap=4"
```

---

## Part 8 — Dense Cluster Separation

When many nodes are packed too tightly (sub-grid positions, conflicting slots):

### Detect density

```bash
curl http://localhost:1367/api/coords | python3 -c "
import json, sys
coords = json.load(sys.stdin)['coords']
# Find all nodes within 2 cells of each other (too close):
positions = {(v['r'],v['c']): k for k,v in coords.items()}
for (r,c), code in positions.items():
    neighbors = [(r+dr,c+dc) for dr in range(-1,2) for dc in range(-1,2) if (dr,dc)!=(0,0)]
    conflicts = [(positions[n], n) for n in neighbors if n in positions]
    if conflicts:
        print(f'{code}({r},{c}): too close to {conflicts}')
"
```

### Separate dense cluster (one node at a time)

```bash
# Identify which node in the cluster can move without breaking connections:
curl "http://localhost:1367/api/graph/validate/PROBLEMATIC_NODE?maxGap=4"
# If all its connections have gap>=1 and alignment is OK after move:
curl -XPOST http://localhost:1367/api/coords/PROBLEMATIC_NODE/nudge -d '{"dr":4,"dc":0}'
# Verify:
curl "http://localhost:1367/api/graph/validate/PROBLEMATIC_NODE?maxGap=4"
```

---

## Part 9 — Precise One-at-a-Time Edit Protocol

**Never:** Mass-update all broken nodes at once
**Always:** Fix → verify → proceed

### The exact sequence for every fix:

```
1. IDENTIFY:  curl "http://localhost:1367/api/graph/validate/{code}?maxGap=4"
2. PLAN:      Determine: move node? create junction? swap positions?
3. CHECK:     curl "http://localhost:1367/api/coords/near/{code}?radius=8"
              (Is the target slot free?)
4. APPLY:     One of:
                - curl -XPUT http://localhost:1367/api/coords/{code} -d '{"r":R,"c":C}'
                - curl -XPOST http://localhost:1367/api/coords/{code}/nudge -d '{"dr":DR,"dc":DC}'
                - curl -XPOST http://localhost:1367/api/coords/swap -d '{"a":"X","b":"Y"}'
                - curl -XPOST http://localhost:1367/api/graph/junction -d '{...}'
                - curl -XPOST http://localhost:1367/api/graph/fill-gap -d '{...}'
5. VERIFY:    curl "http://localhost:1367/api/graph/validate/{code}?maxGap=4"
6. NEXT:      Move to next broken edge
```

### Rules:
- Fix ONE edge per operation cycle
- Always verify after each fix
- If verification shows a new problem, address it before moving on
- Never delete a node without checking it has no quests, NPCs, or connections
- Never move a node more than 4 cells without re-checking all its connections

---

## Part 10 — Full API Reference Card

```
═══════════════════════════════════════════════════════════
  READ
═══════════════════════════════════════════════════════════
GET  /api/node/{code}                    — full node data
GET  /api/list/node                      — all nodes
GET  /api/list/node?act=N                — filter by act
GET  /api/list/node?terrain=X            — filter by terrain
GET  /api/coords                         — all coordinates
GET  /api/coords/near/{code}?radius=N    — proximity search
GET  /api/graph/validate/{code}?maxGap=N — connection check (NEW)
GET  /api/graph/broken?maxGap=N&root=X  — all broken edges (NEW)
GET  /api/graph/path/{from}/{to}         — walkable path (NEW)
GET  /api/audit/map                      — bidirectional audit

═══════════════════════════════════════════════════════════
  COORDINATE EDIT
═══════════════════════════════════════════════════════════
PUT  /api/coords/{code}  {"r":N,"c":N}         — set absolute
POST /api/coords/{code}/nudge {"dr":N,"dc":N}  — move relative (NEW)
POST /api/coords/swap {"a":"X","b":"Y"}         — swap two (NEW)

═══════════════════════════════════════════════════════════
  NODE EDIT
═══════════════════════════════════════════════════════════
PUT  /api/node/{code}  field=value              — edit field
POST /api/graph/link {"a":"X","aDir":"N","b":"Y"} — wire both ends (NEW)

═══════════════════════════════════════════════════════════
  JUNCTION CREATION
═══════════════════════════════════════════════════════════
POST /api/graph/junction          — create 1 junction
POST /api/graph/corner-junction   — fix diagonal (NEW)
POST /api/graph/fill-gap          — plan/create junction chain (NEW)

═══════════════════════════════════════════════════════════
  LAYOUT
═══════════════════════════════════════════════════════════
GET  /api/layout/solve?step=N&root=X    — propose layout
POST /api/layout/apply {"coords":{...}} — bulk apply

═══════════════════════════════════════════════════════════
  SYSTEM
═══════════════════════════════════════════════════════════
POST /api/save     — write to disk
POST /api/reload   — re-read from disk
wb ping            — health check
```

---

## Part 11 — Quick Recipes

### "Is this node walkable from BK?"
```bash
curl "http://localhost:1367/api/graph/path/BK/SHW?maxGap=4"
```

### "What's at grid position (104, 136)?"
```bash
curl http://localhost:1367/api/coords | python3 -c "
import json,sys; c=json.load(sys.stdin)['coords']
hit = {k:v for k,v in c.items() if v['r']==104 and v['c']==136}
print(hit)
"
```

### "Move SHW 4 cells west, check if slot is free first"
```bash
curl "http://localhost:1367/api/coords/near/SHW?radius=4"
# Confirm (104,140) is listed as 'available', then:
curl -XPUT http://localhost:1367/api/coords/SHW -d '{"r":104,"c":140}'
```

### "Find all nodes that need a junction to reach their N/S/E/W neighbor"
```bash
curl "http://localhost:1367/api/graph/broken?maxGap=4&root=BK" | \
  python3 -c "import json,sys; d=json.load(sys.stdin);
[print(e['from'],e['dir'],e['to'],'gap',e['gap']) for e in d['edges'] if e['type']=='gap_too_large']"
```

### "Create a junction between two nodes 8 apart (N→S)"
```bash
# LDN(120,144) -S-> LON(128,144), gap=8
curl -XPOST http://localhost:1367/api/graph/junction -d '{
  "anchor": "LDN",
  "anchorDir": "S",
  "clusterEntry": "LON",
  "clusterDir": "S",
  "terrain": "inherit"
}'
# Creates junction at (124,144), wires LDN.S→J_new→S→LON
```

### "Fix a corner node (receives connections from two different axes)"
```bash
# SHW receives E from ROT(104,132) and N from NRG(112,136)
# SHW must be at (104,136) — the axis intersection
curl -XPOST http://localhost:1367/api/graph/corner-junction -d '{
  "nodeA": "ROT", "dirA": "E",
  "nodeB": "NRG", "dirB": "N",
  "sharedTarget": "SHW"
}'
```

### "Plan a 40-cell junction chain without executing"
```bash
curl -XPOST http://localhost:1367/api/graph/fill-gap -d '{
  "from":"KLN","dir":"E","to":"TPR",
  "maxGap":4,"step":4,"terrain":"inherit","dryRun":true
}'
```

### "Swap J52 and SHW because J52 is sitting in SHW's correct slot"
```bash
curl -XPOST http://localhost:1367/api/coords/swap -d '{"a":"J52","b":"SHW"}'
# Then verify both:
curl "http://localhost:1367/api/graph/validate/J52?maxGap=4"
curl "http://localhost:1367/api/graph/validate/SHW?maxGap=4"
```

---

## Part 12 — Count Endpoints (`/api/count/*`)

These endpoints were added to give fast breakdowns without loading every entity. All are read-only GET requests.

### 12.1 Master count (all collections)

```bash
./api.sh count
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

### 12.2 Node breakdown

```bash
./api.sh count nodes
# or:
curl -s http://localhost:1367/api/count/nodes | jq
```

Returns: `total`, `byAct`, `byTerrain`, `junctionCount`, `nodesWithCoords`, `nodesWithoutCoordsList`.

```bash
# How many nodes have no coordinates?
curl -s http://localhost:1367/api/count/coords | jq '{total, nodesWithoutCoords: (.total - .inNodeMap), nodesWithoutCoordsList}'
```

### 12.3 Quest breakdown

```bash
./api.sh count quests
```

Returns: `total`, `byType`, `topArcs` (top 10 arcs by quest count), `topNodes` (top 10 activateNodes by quest count).

```bash
# Which arc has the most quests?
curl -s http://localhost:1367/api/count/quests | jq '.topArcs[0]'
```

### 12.4 Monster breakdown

```bash
./api.sh count monsters
```

Returns: `total`, `byTier`, `withDrops`, `withoutDrops`, `withTerrain`, `withoutTerrain`.

```bash
# How many monsters lack a drop?
curl -s http://localhost:1367/api/count/monsters | jq '{withDrops, withoutDrops}'
```

### 12.5 NPC breakdown

```bash
./api.sh count npcs
```

Returns: `total`, `byNode` (count per node), `questCounts` (how many quests reference each NPC key).

### 12.6 Terrain breakdown

```bash
./api.sh count terrains
```

Returns: `total`, `withMonsters`, `emptyTerrains`, `usedByNodes`, `unusedByNodes`.

```bash
# Which terrains have no monsters assigned?
curl -s http://localhost:1367/api/count/terrains | jq '.emptyTerrains'
```

### 12.7 Coord coverage

```bash
./api.sh count coords
```

Returns: `total`, `inNodeMap`, `orphanCoords`, `nodesWithoutCoordsList`.

```bash
# Full list of nodes still needing coordinates
curl -s http://localhost:1367/api/count/coords | jq '.nodesWithoutCoordsList'
```

---

## Part 13 — Enhanced List Filters

All filters apply to `GET /api/list/{type}`. Use `./api.sh list <type> --flag value` in the CLI or `curl` with query params.

### 13.1 New node filters

```bash
# Nodes with no coordinates yet
./api.sh list node --no-coords
curl -s 'http://localhost:1367/api/list/node?no_coords=true' | jq '[.[] | .id]'

# Nodes with at least one quest
./api.sh list node --has-quests true
curl -s 'http://localhost:1367/api/list/node?has_quests=true' | jq '[.[] | {id, label}]'

# Nodes with NO quests (good for finding dead nodes)
curl -s 'http://localhost:1367/api/list/node?has_quests=false&junction=false' | jq '[.[] | .id]'

# Only junction nodes (J* codes)
./api.sh list node --junction true
curl -s 'http://localhost:1367/api/list/node?junction=true' | jq 'length'

# Only named nodes (not junctions)
curl -s 'http://localhost:1367/api/list/node?junction=false' | jq 'length'

# Text search across label and ID
./api.sh list node --q birka
curl -s 'http://localhost:1367/api/list/node?q=crypt' | jq '[.[] | {id, label}]'

# Combine: act 1 forest nodes with quests
curl -s 'http://localhost:1367/api/list/node?act=1&terrain=forest&has_quests=true' | jq '[.[] | .id]'

# Return IDs only (compact)
./api.sh list node --no-coords --ids
curl -s 'http://localhost:1367/api/list/node?no_coords=true&ids=true' | jq '.ids'
```

### 13.2 New quest filters

```bash
# Quests assigned to a specific NPC
./api.sh list quest --npc yael
curl -s 'http://localhost:1367/api/list/quest?npc=yael' | jq '[.[] | {id, title}]'

# Quests that reference a monster (e.g. goblin in desc/battle)
./api.sh list quest --monster goblin
curl -s 'http://localhost:1367/api/list/quest?monster=goblin' | jq '[.[] | {id, title}]'

# Quests with an NPC assigned
./api.sh list quest --has-npc true
curl -s 'http://localhost:1367/api/list/quest?has_npc=true' | jq 'length'

# Quests WITHOUT an NPC
./api.sh list quest --has-npc false

# Quests that have a completeFn (complex completion logic)
./api.sh list quest --complete true
curl -s 'http://localhost:1367/api/list/quest?complete=true' | jq '[.[] | .id]'

# Filter by arc prefix
./api.sh list quest --arc mq_
./api.sh list quest --arc quest_wis
curl -s 'http://localhost:1367/api/list/quest?arc=sq_' | jq '[.[] | .id]'

# Combine: side quests at LHR with NPC
curl -s 'http://localhost:1367/api/list/quest?node=LHR&type=side&has_npc=true' | jq '[.[] | {id, title, npc}]'
```

### 13.3 New monster filters

```bash
# Monsters with loot drops
./api.sh list monster --has-drop true
curl -s 'http://localhost:1367/api/list/monster?has_drop=true' | jq '[.[] | {key, name}]'

# Monsters NOT in any terrain (orphan monsters)
./api.sh list monster --no-terrain
curl -s 'http://localhost:1367/api/list/monster?no_terrain=true' | jq '[.[] | .key]'

# Combine: easy tier without drops
curl -s 'http://localhost:1367/api/list/monster?tier=easy&has_drop=false' | jq '[.[] | .key]'
```

### 13.4 IDs-only for any type

```bash
./api.sh list ids node
./api.sh list ids quest
./api.sh list ids monster
./api.sh list ids npc
./api.sh list ids terrain

# Equivalent curl forms:
curl -s 'http://localhost:1367/api/list/ids/node'    | jq '.ids | length'
curl -s 'http://localhost:1367/api/list/ids/quest'   | jq '.ids[]' | head -10
curl -s 'http://localhost:1367/api/list/ids/terrain' | jq '.ids'

# IDs from any filtered list (add ?ids=true)
curl -s 'http://localhost:1367/api/list/node?act=1&ids=true'           | jq '.ids'
curl -s 'http://localhost:1367/api/list/quest?type=main&ids=true'      | jq '.ids'
curl -s 'http://localhost:1367/api/list/monster?tier=deadly&ids=true'    | jq '.ids'
```

### 13.5 List index

```bash
./api.sh list
# or:
curl -s http://localhost:1367/api/list | jq
```

Returns every available list route with counts, available filters, and example params.

---

## Part 14 — Location List Form

`GET /api/location` without an ID now lists all locations.

### 14.1 List all locations

```bash
./api.sh location
curl -s http://localhost:1367/api/location | jq 'length'
```

Each entry: `{ code, label, terrain, act, counts:{quests, npcs, monsters, linkedNodes} }`.

### 14.2 Filter locations

```bash
# Act 1 locations only
./api.sh location --act 1
curl -s 'http://localhost:1367/api/location?act=1' | jq '[.[] | {code, label, counts}]'

# Locations with quests in act 3
curl -s 'http://localhost:1367/api/location?act=3&has_quests=true' | jq '[.[] | .code]'

# Forest terrain locations
./api.sh location --terrain forest
curl -s 'http://localhost:1367/api/location?terrain=crypt' | jq '[.[] | {code, label}]'

# Text search
./api.sh location --q birka
curl -s 'http://localhost:1367/api/location?q=tavern' | jq '[.[] | {code, label}]'

# IDs only
curl -s 'http://localhost:1367/api/location?ids=true' | jq '.ids | length'
```

---

## Part 15 — Verbose 404 Responses

When you request an entity with an unknown ID, the server now returns the count and all valid IDs for that type.

### 15.1 Unknown node

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

### 15.2 Unknown quest

```bash
curl -s http://localhost:1367/api/quest/badquest | jq '{error, count}'
```

### 15.3 Unknown monster

```bash
curl -s http://localhost:1367/api/monster/badkey | jq '{error, count, allKeys:.allIds[:5]}'
```

### 15.4 Practical use: autocomplete / discover IDs

```bash
# Get all valid node codes to pick from
curl -s 'http://localhost:1367/api/list/ids/node' | jq -r '.ids | sort[]'

# Get all valid monster keys
curl -s 'http://localhost:1367/api/list/ids/monster' | jq -r '.ids | sort[]' | grep "shadow\|wraith\|ghost"
```

---

## Part 16 — Enhanced GET Detail Fields

### 16.1 Node detail (new fields)

```bash
curl -s http://localhost:1367/api/node/LHR | jq '.connections'
```

New in connections envelope:
- `coords` — `{r, c}` grid position if set
- `links` — full target node objects for each N/E/S/W direction
- `questCount` / `questIds[]` — count and IDs of quests at this node
- `npcCount` — named NPC count

### 16.2 Quest detail (new fields)

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

### 16.3 Monster detail (new fields)

```bash
curl -s http://localhost:1367/api/monster/goblin | jq '{drop:.connections.drop, questCount:.connections.questCount, terrains:[.connections.terrains[].key]}'
```

### 16.4 NPC detail (new fields)

```bash
curl -s http://localhost:1367/api/npc/yael | jq '{nodeDetails:.connections.nodeDetails, questCount:.connections.questCount}'
```
