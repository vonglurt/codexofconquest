<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Roll2Hit World Builder API — Full Reference

**Architecture**: Browser UI → Node.js REST server → `roll2hit-v3.html` (game file)  
**Server port**: `localhost:1367`  
**Game file**: `roll2hit-v3.html` (single-file game, ~14,900 lines)

---

## Quick Start

### Prerequisites

```bash
brew install node        # Node.js via Homebrew on macOS
```

### Start the server

```bash
# From the roll2hit directory:
./wbapi-toggle.sh start           # run in background (auto-restart loop)
./wbapi-toggle.sh fg              # run in foreground with full log scroll
./wbapi-toggle.sh stop            # kill background instance
./wbapi-toggle.sh status          # show PID and port
./wbapi-toggle.sh restart         # stop + start
```

The server writes all output to `wbapi-server.log`. The restart loop is active: `POST /api/restart` causes the server to exit with code 67, which the toggle script catches and relaunches.

Once running:
```
════════════════════════════════════════════════════════════════
  WBAPI Server  —  http://localhost:1367/api
════════════════════════════════════════════════════════════════
  Game file: roll2hit-v3.html
  Log file:  wbapi-server.log
```

### Connect the browser UI

1. Open `worldbuilder.html` in your browser
2. Click **📂 Load roll2hit-v3.html** and select the game file
3. The topbar shows **● Server** (green) if the server is running
4. All PUT/DELETE operations write to disk automatically via `POST /api/save`

---

## Nonce System — Write Protection

Every write operation (POST create, destructive PUT, DELETE) requires a **nonce** — a single-use token that proves intent and prevents accidental writes.

**Step 1 — request a nonce:**
```bash
NONCE=$(curl -s -X POST http://localhost:1367/api/nonce \
  -H 'Content-Type: application/json' \
  -d '{"type":"quest","id":"quest_new_01"}' | jq -r .nonce)
```

Response: `{ "nonce": "ab12cd34ef56gh78", "expires": 300 }`

- Nonces expire in 5 minutes
- Each nonce is bound to one `{type, id}` pair — reuse is rejected
- `type`: `node | quest | monster | npc | terrain`

**Step 2 — send the write with the nonce header:**
```bash
curl -X POST http://localhost:1367/api/quest \
  -H 'Content-Type: application/json' \
  -H 'X-Nonce: ab12cd34ef56gh78' \
  -d '{"id":"quest_new_01","title":"...","type":"mission_bit","activateNode":"CI"}'
```

DELETE always requires a nonce. POST and PUT for create/update accept nonces; some lower-risk POST endpoints (terrain, monster fork) are nonce-optional.

See: `GET /api/help/nonce` for extended explanation.

---

## Verbose Logging

Two log streams: terminal and `wbapi-server.log`.

| Tag | Meaning |
|---|---|
| `[REQUEST]` | Incoming HTTP method, URL, and request body |
| `[LOGIC]`   | Key resolution, routing strategy, blockers |
| `[RESPONSE]`| HTTP status code and result summary |
| `[LOAD]`    | Game file parse events with entity counts |
| `[INFO]`    | Server lifecycle (start, restart) |
| `[ERROR]`   | Exceptions and server-side failures |

---

## Response Envelope

Every `GET`, `PUT`, and `DELETE` response wraps the entity:

```json
{
  "entity": { "...all fields...": "..." },
  "connections": { "...what links to this...": "..." },
  "_meta": {
    "canDelete": true,
    "blockedBy": null
  }
}
```

`_meta.canDelete` tells the UI whether to show a Delete button or a "blocked" warning.

---

## Endpoints

### GET /api/ping
Health check. Returns counts of all loaded collections.

```bash
curl http://localhost:1367/api/ping
```
```json
{
  "ok": true,
  "loaded": true,
  "file": "roll2hit-v3.html",
  "nodes": 148,
  "quests": 228,
  "monsters": 392,
  "terrains": 107,
  "npcs": 9,
  "fish": 25,
  "lakeMagic": 8
}
```

---

### GET /api/help[/{topic}]

Built-in man-page style reference. Topics:

| Topic | Contents |
|---|---|
| *(none)* / `index` | Topic index |
| `overview` | Architecture and typical workflow |
| `modes` | Read-only vs. guided-write mode |
| `nonce` | Write protection and nonce lifecycle |
| `read` | All safe read-only endpoints |
| `write` | All write endpoints and their requirements |
| `quest` | Quest schema, fields, and lifecycle |
| `node` | Node schema, fields, and connections |
| `monster` | Monster schema and terrain linkage |
| `terrain` | Terrain schema and monster arrays |
| `mission_bit` | Mission-bit token pattern |
| `export` | Exporting arrays as JSON / JS / module |
| `wizard` | Full workflow: terrain → node → monster → quest |
| `audit` | Integrity scan and fixing errors |
| `curl` | curl cheat sheet for every operation |

```bash
curl http://localhost:1367/api/help/quest
curl 'http://localhost:1367/api/help/wizard?format=text'   # plain text output
```

---

### GET /api/source
Returns the raw HTML of `roll2hit-v3.html`. Pipe to a file for a full backup.

```bash
curl http://localhost:1367/api/source -o backup.html
```

---

### GET /api/{type}/{id}

Fetch a single entity with full connection envelope.

`type` = `node` | `quest` | `monster` | `npc` | `terrain`

**GET /api/monster/commoner**
```json
{
  "entity": { "name": "Commoner", "ac": 10, "hp": 4, "atk": 0, "tier": 1 },
  "connections": {
    "terrains": [
      { "key": "market_quarter", "label": "Market Quarter",
        "nodes": [{ "code": "CI", "label": "City Streets — Birka" }] }
    ],
    "drop": null
  },
  "_meta": { "canDelete": false, "blockedBy": { "terrains": ["market_quarter"] } }
}
```

**GET /api/node/CY**
```json
{
  "entity": { "label": "Neon Undercity", "name": "cyberpunk_streets", "act": 3 },
  "connections": {
    "terrain": "cyberpunk_streets",
    "monsters": [{ "key": "street_thug", "name": "Street Thug", "tier": 2 }],
    "quests":   [{ "id": "quest_antecedent_01", "title": "The Question", "type": "side" }],
    "npcs":     [],
    "linkedNodes": { "N": "BI", "S": null, "E": null, "W": null }
  },
  "_meta": { "canDelete": false, "blockedBy": { "quests": ["quest_antecedent_01"] } }
}
```

---

### GET /api/location/{code}

Composite view: node + terrain + all monsters/quests/NPCs at that location.

```bash
curl http://localhost:1367/api/location/CI
```
```json
{
  "node": { "label": "City Streets — Birka", "name": "city", "act": 1 },
  "terrain": { "label": "City", "icon": "🏙", "monsters": [...] },
  "monsters": [ { "key": "commoner", "name": "Commoner", "ac": 10 } ],
  "quests":   [ { "id": "quest_wis_01", "title": "...", "type": "side" } ],
  "npcs":     [ { "key": "yael", "name": "Yael" } ]
}
```

---

### GET /api/quest/{id}/chain

Upstream and downstream dependency graph for a quest.

```bash
curl http://localhost:1367/api/quest/quest_anath/chain
```
```json
{
  "upstream": ["quest_basket_damascus"],
  "downstream": ["quest_barnach_vouches", "quest_hellenists_jerusalem"]
}
```

---

### GET /api/list/{type}

Returns a lightweight list with `_meta.canDelete` per item.

`type` = `node` | `quest` | `monster` | `npc` | `terrain` | `fish` | `lake-magic`

**Query parameters:**
| Param | Applies to | Example |
|---|---|---|
| `?node=CY` | quest, npc | quests/npcs at that node |
| `?terrain=market_quarter` | monster | monsters in terrain |
| `?type=skill_check` | quest | filter by quest type |
| `?arc=quest_wis` | quest | filter by arc prefix |

```bash
curl 'http://localhost:1367/api/list/quest?node=CY'
curl 'http://localhost:1367/api/list/monster?terrain=market_quarter'
curl 'http://localhost:1367/api/list/quest?type=mission_bit'
```

---

### GET /api/schema[/{type}]

Canonical field list for each entity type — required fields, editable fields, types.

```bash
curl http://localhost:1367/api/schema
curl http://localhost:1367/api/schema/quest
```

---

### GET /api/flags

List all `_S_DEFAULTS` state flags and their default values.

```bash
curl http://localhost:1367/api/flags
```
```json
{
  "ok": true,
  "count": 87,
  "flags": {
    "escapedDamascus": false,
    "plContactMet": false,
    "...": "..."
  }
}
```

---

### GET /api/missionbits

List all mission bit tokens extracted from quest source — flags, associated quests, and node references.

```bash
curl http://localhost:1367/api/missionbits
```
```json
{
  "ok": true,
  "count": 14,
  "bits": [
    {
      "flagRef": "sealedChestDone",
      "tokenName": "Sealed Chest Token",
      "event": "pass",
      "questId": "quest_chest_01",
      "questTitle": "The Sealed Chest",
      "questType": "mission_bit",
      "nodeCode": "CI",
      "nodeLabel": "City Streets — Birka",
      "retryable": true
    }
  ]
}
```

---

### GET /api/audit

Integrity scan of all in-memory game data. Returns findings by severity.

```bash
curl http://localhost:1367/api/audit
curl http://localhost:1367/api/audit | jq '.errors'
```

Severity levels:
- `error` — broken reference; will cause bugs at runtime
- `warning` — style issue or likely mistake
- `suggestion` — improvement; not required
- `parse` — section could not be parsed; data may be missing

Common errors: `node quest ref` (quest.activateNode → missing node), `monster key ref` (terrain monster list → missing pool key), `quest chain ref` (quest.chain → missing quest ID).

---

### GET /api/export/{collection}

Dump a full in-memory collection as JSON, JS literal, or CommonJS module.

`collection` = `node_map` | `quest_db` | `monster_pool` | `world_db` | `fish_pool` | `monster_drops` | `condition_items` | `all`

```bash
curl 'http://localhost:1367/api/export/quest_db?format=json' -o quests.json
curl 'http://localhost:1367/api/export/all?format=module' -o game-data.js
```

`format` = `json` (default) | `js` (JS assignment `const X = {...}`) | `module` (CommonJS `module.exports`)

---

### GET /api/fish[/{key}]

Fish pool entries. Optional filters: `?rank=N` · `?night=true|false`

```bash
curl http://localhost:1367/api/fish
curl 'http://localhost:1367/api/fish?night=true&rank=3'
curl http://localhost:1367/api/fish/perch
```

---

### GET /api/drops

Monster drop table entries. Sorted by sell value descending.

```bash
curl http://localhost:1367/api/drops
curl 'http://localhost:1367/api/drops?sell=50'     # drops worth ≥50gp
curl 'http://localhost:1367/api/drops?q=sword'     # name search
```

---

### GET /api/loot

d100 loot table with rollRange annotations, totalWeight, gap, and gap-fill suggestions.

```bash
curl http://localhost:1367/api/loot
```
```json
{
  "ok": true,
  "totalWeight": 97,
  "gap": 3,
  "coverage": "97%",
  "typeBreakdown": { "potion": 30, "scroll": 20, "gold": 47 },
  "suggestions": ["add 3 weight to fill gap"],
  "entries": [...]
}
```

---

### GET /api/lake-magic[/{key}]

Lake magic item list or single entry. Optional filters: `?effect=X` · `?minRank=N`

```bash
curl http://localhost:1367/api/lake-magic
curl 'http://localhost:1367/api/lake-magic?minRank=3'
curl http://localhost:1367/api/lake-magic/ember_shard
```

---

### PUT /api/{type}/{id}

Update one or more fields. Body is a JSON object of `{field: value}` pairs.

- **String fields** are patched directly into `_rawSrc` (preserves function bodies in quest JS)
- **Number/boolean fields** are applied in-memory

```bash
# Edit monster stats
curl -X PUT http://localhost:1367/api/monster/commoner \
  -H 'Content-Type: application/json' \
  -d '{"ac": 15, "hp": 8}'

# Edit quest text
curl -X PUT http://localhost:1367/api/quest/quest_wis_01 \
  -H 'Content-Type: application/json' \
  -d '{"passText": "You recalled the ancient text.", "xpAward": 150}'

# Edit node label
curl -X PUT http://localhost:1367/api/node/CY \
  -H 'Content-Type: application/json' \
  -d '{"label": "Neo Undercity"}'
```

**Response (200 — all fields ok):**
```json
{
  "ok": true,
  "fields": [
    { "field": "ac",  "ok": true, "strategy": "put" },
    { "field": "hp",  "ok": true, "strategy": "put" }
  ],
  "entity": { "name": "Commoner", "ac": 15, "hp": 8 },
  "connections": { "..." },
  "_meta": { "canDelete": false }
}
```

**Response (207 — partial success):**
```json
{
  "ok": false,
  "fields": [
    { "field": "ac",   "ok": true,  "strategy": "put" },
    { "field": "name", "ok": false, "strategy": "editField", "error": "field not found in source" }
  ],
  "failed": ["name"]
}
```

---

### PUT /api/loot
### PUT /api/loot/{index}

Replace the entire d100 loot table or update a single entry by index.

```bash
# Update single entry (index 0)
curl -X PUT http://localhost:1367/api/loot/0 \
  -H 'Content-Type: application/json' \
  -d '{"weight": 15, "_type": "potion"}'

# Full replace
curl -X PUT http://localhost:1367/api/loot \
  -H 'Content-Type: application/json' \
  -d '{"entries": [{"weight":30,"_type":"potion"},{"weight":20,"_type":"scroll"}]}'
```

Valid `_type` values: `potion_minor` · `potion` · `potion_greater` · `potion_superior` · `scroll` · `flashbang` · `dagger` · `mainweapon` · `gold`

---

### DELETE /api/{type}/{id}

Delete an entity. Returns **HTTP 409** if nested content blocks deletion. Requires a nonce.

```bash
NONCE=$(curl -s -X POST http://localhost:1367/api/nonce \
  -H 'Content-Type: application/json' \
  -d '{"type":"monster","id":"rabid_monkey"}' | jq -r .nonce)
curl -X DELETE http://localhost:1367/api/monster/rabid_monkey -H "X-Nonce: $NONCE"
```

**200 — deleted:**
```json
{ "ok": true, "key": "rabid_monkey", "wasEntity": { "name": "Rabid Monkey" } }
```

**409 — blocked:**
```json
{
  "ok": false,
  "error": "Delete blocked — nested content exists",
  "blockedBy": { "terrains": ["market_quarter", "city_ruins"] }
}
```

**Cascade rules:**

| Entity | Blocked by |
|---|---|
| node | quests with `activateNode`/`waypointNode` = this node, or NPCs at this node |
| quest | quests that read a flag this quest writes (downstream chain) |
| monster | any terrain whose monster list includes this key |
| npc | any quest that references this NPC key in raw source |

---

### POST /api/{type} — Create

Add a new entity to its section. All create endpoints require `POST /api/save` afterward.

---

**POST /api/quest**

Required: `id`, `type`, `title`, `activateNode`. All other fields optional.

Valid types: `combat` · `explore` · `trade` · `social` · `mission_bit` · `skill_check`

```bash
curl -X POST http://localhost:1367/api/quest \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "quest_example_01",
    "type": "skill_check",
    "title": "The Locked Door",
    "activateNode": "CY",
    "checkStat": "WIS",
    "checkDC": 12,
    "checkPassFlag": "doorOpened",
    "hint": "The door has not moved in years.",
    "passText": "It opens.",
    "failText": "Not yet.",
    "xpAward": 100
  }'
```

---

**POST /api/node**

Required: `code`, `name` (terrain key), `label`, `act`.

```bash
curl -X POST http://localhost:1367/api/node \
  -H 'Content-Type: application/json' \
  -d '{"code":"SD","name":"coastal_market","label":"Sunken Docks","act":1}'
```

---

**POST /api/monster**

Required: `key`, `name`. Stats default to 0 if omitted.

```bash
curl -X POST http://localhost:1367/api/monster \
  -H 'Content-Type: application/json' \
  -d '{"key":"dock_rat","name":"Dock Rat","ac":11,"hp":4,"atk":2,"dmg":3,"xp":10,"tier":1}'
```

---

**POST /api/terrain**

Required: `key`. `monsters` must be an array of existing MONSTER_POOL keys.

```bash
curl -X POST http://localhost:1367/api/terrain \
  -H 'Content-Type: application/json' \
  -d '{"key":"fog_docks","label":"Fog Docks","icon":"🌫","monsters":["dock_rat"]}'
```

---

**POST /api/npc**

Add a named NPC to `BIRKA_NPC_PROFILES`. Required: `key` (snake_case), `name`, `node`.

```bash
curl -X POST http://localhost:1367/api/npc \
  -H 'Content-Type: application/json' \
  -d '{
    "key": "maret_dockhand",
    "name": "Maret",
    "occupation": "dockhand",
    "node": "SD",
    "neutral": {
      "greeting": "A woman coiling rope at the far end of the dock.",
      "dialogue": "\"Three ships this week. None of them stopped.\""
    }
  }'
```

---

**POST /api/item**

Add an item definition to `ITEM_DB`. Required: `key` (snake_case), `name`, `type`.

Valid types: `weapon` · `amulet` · `consumable` · `readable` · `armor` · `tool` · `mission_bit` · `lake_magic`

```bash
curl -X POST http://localhost:1367/api/item \
  -H 'Content-Type: application/json' \
  -d '{
    "key": "dock_ledger",
    "name": "Dock Ledger — Year 61",
    "icon": "📒",
    "type": "readable",
    "sell": 0,
    "readText": "Every ship. Every cargo. Every captain."
  }'
```

---

**POST /api/fish**

Add a fish entry to the day or night pool.

```bash
curl -X POST http://localhost:1367/api/fish \
  -H 'Content-Type: application/json' \
  -d '{"key":"harbor_eel","name":"Harbor Eel","rank":2,"isNight":true,"desc":"..."}'
```

**POST /api/fish/simulate**

Simulate a fishing roll with given modifiers. Returns a roll result and the fish caught.

```bash
curl -X POST http://localhost:1367/api/fish/simulate \
  -H 'Content-Type: application/json' \
  -d '{"dexMod": 2, "catchMod": 1, "typeMod": 0}'
```

---

**POST /api/lake-magic**

Add a lake magic item to `LAKE_MAGIC_DB`.

```bash
curl -X POST http://localhost:1367/api/lake-magic \
  -H 'Content-Type: application/json' \
  -d '{"key":"tide_ring","name":"Tide Ring","effect":"water_speed","base":2,"levelScale":0.5}'
```

---

**POST /api/flags**

Add a new state flag to `_S_DEFAULTS`. Required: `name` (valid JS identifier), `defaultValue`.

```bash
curl -X POST http://localhost:1367/api/flags \
  -H 'Content-Type: application/json' \
  -d '{"name":"escapedDamascus","defaultValue":false,"comment":"Paul arc — basket escape"}'
```

Response: `{ "ok": true, "name": "escapedDamascus", "defaultValue": false, "note": "POST /api/save to persist." }`

---

### POST /api/monster/{id}/rename

Change a monster's display name globally (key unchanged).

```bash
curl -X POST http://localhost:1367/api/monster/commoner/rename \
  -H 'Content-Type: application/json' \
  -d '{"name": "Market Goer"}'
```
```json
{ "ok": true, "key": "commoner", "from": "Commoner", "to": "Market Goer", "terrains": [20] }
```

---

### POST /api/monster/{id}/fork

Create a new monster as a copy of an existing one.

```bash
curl -X POST http://localhost:1367/api/monster/commoner/fork \
  -H 'Content-Type: application/json' \
  -d '{"newKey": "dock_worker", "overrides": {"name": "Dock Worker", "hp": 8}}'
```

---

### POST /api/terrain/{key}/swap

Replace one monster key with another in a specific terrain only.

```bash
curl -X POST http://localhost:1367/api/terrain/market_quarter/swap \
  -H 'Content-Type: application/json' \
  -d '{"oldKey": "commoner", "newKey": "dock_worker"}'
```

---

### POST /api/node/{id}/move

Rename a node code and rewrite all quest/NPC references automatically.

```bash
curl -X POST http://localhost:1367/api/node/CY/move \
  -H 'Content-Type: application/json' \
  -d '{"newCode": "CY2"}'
```
```json
{ "ok": true, "from": "CY", "to": "CY2", "questsUpdated": 3, "npcsUpdated": 0 }
```

---

### GET /api/coords

Return the full NODE_COORDS map: every node code and its `{r, c}` grid position, plus the current `maxR` and `maxC` bounds.

```bash
curl http://localhost:1367/api/coords
```
```json
{
  "coords": { "WK": {"r":12,"c":112}, "TLS": {"r":4,"c":112}, "CI": {"r":44,"c":80} },
  "maxR": 192,
  "maxC": 240,
  "count": 150
}
```

The worldbuilder renders at `mapScale=18` px/cell. Canvas size auto-computes from `maxR` and `maxC` — no hardcoded pixel dimensions.

---

### GET /api/coords/near/{code}

Find occupied and available grid slots near a node. Use this during import to pick a placement for a new node.

```bash
curl "http://localhost:1367/api/coords/near/WK?radius=8"
```

| Query param | Default | Range | Meaning |
|---|---|---|---|
| `radius` | 8 | 1–32 | Manhattan-distance search radius in cells |

```json
{
  "ok": true,
  "code": "WK",
  "origin": {"r":12,"c":112},
  "radius": 8,
  "nearby": [
    {"code":"TLS","r":4,"c":112,"distance":8}
  ],
  "available": [
    {"r":13,"c":112,"distance":1},
    {"r":12,"c":113,"distance":1}
  ]
}
```

`available` contains up to 40 unoccupied `{r,c}` slots sorted by distance from origin. Pick the closest slot that fits the story geography.

---

### PUT /api/coords/{code}

Set or update the grid coordinates for a node. Returns 409 if the slot is already occupied by a different node.

```bash
# Get nonce first
NONCE=$(curl -s -X POST http://localhost:1367/api/nonce \
  -H 'Content-Type: application/json' \
  -d '{"type":"node","id":"NTN"}' | jq -r .nonce)

curl -X PUT http://localhost:1367/api/coords/NTN \
  -H 'Content-Type: application/json' \
  -H "X-Nonce: $NONCE" \
  -d '{"r":48,"c":116}'
```
```json
{ "ok": true, "code": "NTN", "prev": null, "coords": {"r":48,"c":116}, "note": "POST /api/save to persist." }
```

Coordinates are patched into the `NODE_COORDS` section in memory. Call `POST /api/save` to write to disk.

---

### POST /api/save

Write all pending in-memory changes to a new timestamped HTML file. The original is never overwritten.

```bash
curl -X POST http://localhost:1367/api/save
```
```json
{ "ok": true, "path": "/Users/user/code/roll2hit.com/roll2hit-v3-20260529-162839.html" }
```

Use `outputPath` for a custom save location:
```bash
curl -X POST http://localhost:1367/api/save \
  -H 'Content-Type: application/json' \
  -d '{"outputPath": "/Users/user/Desktop/my-world.html"}'
```

---

### POST /api/reload

Re-read `roll2hit-v3.html` from disk, discarding all pending in-memory edits.

```bash
curl -X POST http://localhost:1367/api/reload
```

---

### POST /api/restart

Save all pending changes, then exit with code 67. The toggle script catches code 67 and relaunches the server automatically. Use this after adding function fields or making structural changes that require a fresh parse.

```bash
curl -X POST http://localhost:1367/api/restart
```

`reload` vs `restart`:
- **reload** — discard in-memory edits; re-parse from disk (no exit)
- **restart** — save current edits; exit + relaunch (picks up structural changes)

---

## CRUD Detail View — How the Browser UI Works

```
1. Load entity      → GET /api/{type}/{id}
                       UI populates form fields with entity data
                       Original values stored for comparison

2. Edit fields      → User changes AC from 10 to 15
                       Field border turns yellow (chg class)
                       Change counter shows "1 field changed"
                       PUT button becomes enabled

3. Click PUT        → PUT /api/monster/commoner  body: {"ac": 15}
                       Server patches _rawSrc, returns updated entity
                       UI re-renders with new originals

4. Click Save       → POST /api/save
                       Timestamped HTML written to disk
```

**Editable fields by entity type:**

| Monster | Quest | Node | NPC |
|---|---|---|---|
| name | title | label | name |
| ac | type | act | occupation |
| hp | hint/hook | battle | node |
| atk | passText/startText | npc | neutral.dialogue |
| dmgCount | failText | desc | friendly.dialogue |
| dmgDie | rewardText | locked | dearFriend.dialogue |
| dmgFlat | activateNode | N/S/E/W links | |
| tier | waypointNode | | |
| xp | npc | | |
| morale | checkDC/Stat | | |
| | xpAward | | |
| | chain | | |
| | missionBitKey | | |

---

## Multi-Edit Session Workflow

Every `POST /api/save` writes the current in-memory state. Chain all PUTs before saving:

```javascript
// Correct: both PUTs before one save
Promise.all([
  fetch('/api/monster/commoner',     { method:'PUT', body: JSON.stringify({name:'Market Goer'}) }),
  fetch('/api/monster/npc_merchant', { method:'PUT', body: JSON.stringify({name:'Badger'}) }),
]).then(() => fetch('/api/save', { method:'POST', body:'{}' }))
```

To accumulate across sessions, load the previous timestamped output:
```bash
ROLL2HIT_FILE=roll2hit-v3-20260529-162643.html ./wbapi-toggle.sh start
```

---

## Use Case: Implementing a Quest Chain One Story at a Time

### Step 0 — Verify the starting node exists

```bash
curl http://localhost:1367/api/location/KS
```

If the node doesn't exist, create it first:
```bash
curl -X POST http://localhost:1367/api/node \
  -H 'Content-Type: application/json' \
  -d '{"code":"KS","label":"Damascus — Lower City","name":"damascus","act":4}'
```

---

### Step 1 — Add a state flag

```bash
curl -X POST http://localhost:1367/api/flags \
  -H 'Content-Type: application/json' \
  -d '{"name":"escapedDamascus","defaultValue":false,"comment":"Paul arc — basket escape"}'
curl -X POST http://localhost:1367/api/save
curl -X POST http://localhost:1367/api/restart
```

---

### Step 2 — Inspect the quest schema

```bash
curl http://localhost:1367/api/schema/quest
```

---

### Step 3 — Add the quest

```bash
NONCE=$(curl -s -X POST http://localhost:1367/api/nonce \
  -H 'Content-Type: application/json' \
  -d '{"type":"quest","id":"quest_basket_damascus"}' | jq -r .nonce)

curl -X POST http://localhost:1367/api/quest \
  -H 'Content-Type: application/json' \
  -H "X-Nonce: $NONCE" \
  -d '{
    "id": "quest_basket_damascus",
    "type": "skill_check",
    "title": "Over the Wall",
    "activateNode": "KS",
    "activateCond": "anathSightRestored",
    "checkStat": "str",
    "checkLabel": "Athletics",
    "checkDC": 12,
    "checkPassFlag": "escapedDamascus",
    "retryable": true,
    "retryGateDays": 1,
    "xpAward": 150,
    "passText": "Down. Controlled. The gate guard does not turn.",
    "failText": "The rope shifts. You pull back. Tomorrow."
  }'
```

---

### Step 4 — Verify

```bash
curl http://localhost:1367/api/quest/quest_basket_damascus
```

---

### Step 5 — Edit text without rewriting the quest

```bash
curl -X PUT http://localhost:1367/api/quest/quest_basket_damascus \
  -H 'Content-Type: application/json' \
  -d '{"passText": "Down. Controlled. The last three feet you lower slowly because you can hear him breathing."}'
```

---

### Step 6 — Verify the full chain

```bash
curl http://localhost:1367/api/quest/quest_anath/chain
# { "upstream": ["quest_basket_damascus"], "downstream": ["quest_barnach_vouches"] }
```

---

### Step 7 — Run audit before saving

```bash
curl http://localhost:1367/api/audit | jq '.errors'
# [] — no errors
```

---

### Step 8 — Save

```bash
curl -X POST http://localhost:1367/api/save
```

---

### Pattern Summary

| Step | API call | What it verifies |
|------|----------|-----------------|
| 0 | `GET /location/{code}` | Node exists; terrain correct |
| 1 | `POST /api/flags` | State flag registered |
| 2 | `GET /schema/quest` | Field names before writing |
| 3 | `POST /api/quest` | Quest created in QUEST_DB |
| 4 | `GET /api/quest/{id}` | Quest is readable; all fields set |
| 5 | `PUT /api/quest/{id}` | Patch text fields without full rewrite |
| 6 | `GET /api/quest/{id}/chain` | Dependency graph connected |
| 7 | `GET /api/audit` | No broken references |
| 8 | `POST /api/save` | Commit to timestamped HTML |

---

## Error Codes

| HTTP | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 207 | Multi-status (partial PUT — check `fields[].ok`) |
| 400 | Bad request (missing field, invalid JSON, unknown type) |
| 404 | Entity not found |
| 405 | Method not allowed |
| 409 | Conflict — nested content blocks DELETE, or entity already exists, or nonce mismatch |
| 500 | Unhandled server exception |

---

## Data Architecture Reference

`roll2hit-v3.html` is a single-file game. All data lives in `<script>` blocks bounded by anchor comments:

```
// ◆◆◆ WORLDBUILDER:{SECTION}:START ◆◆◆
// ◆◆◆ WORLDBUILDER:{SECTION}:END ◆◆◆
```

| Section | Line | Contents |
|---|---|---|
| MONSTER_POOL | 4869 | Monster stat blocks `{ key: { name, ac, hp, atk, … } }` |
| NODE_MAP | 7627 | World nodes `{ code: { label, name(=terrain), act, … } }` |
| QUEST_DB | anchored | Quest objects with JS closures — parsed with `removeFns` sanitizer |
| BIRKA_NPC | 11643 | Named NPC profiles with full dialogue trees |
| FISH_DB | 14818 | Fish pool entries (day + night) |
| LAKE_MAGIC | 14850 | Lake magic item definitions |
| ITEM_DB | 14863 | General items (weapon, amulet, readable, mission_bit, …) |

The server never executes the full game file. It reads it as text, slices sections by anchor comments, and evaluates each section in isolation with appropriate guards.

The strategy for patching string fields (`editField`) patches the named field in raw HTML, preserving surrounding code including JS function bodies in quest objects. Numeric and boolean fields are updated in-memory and serialized on `POST /api/save`.

---

## 1367 Quest Import Workflow

This procedure applies to **all phases of quest book analysis**. The import directive is permanent: once a book's vignette seeds are complete, import via API. The 8 steps below are mandatory and must be followed in order for every quest act.

### Pre-Import (before any API call)

Read the source files to understand story geography. Location information must adhere to the story — do not invent geography.

```
1367-sources/{CODE}-{title}.md   — vignette seeds and UQF quest cycles
1367-sources/index.md            — canonical node list, airport codes, terrain types
```

**Node naming — two tiers:**

**Tier 1 — Cities and towns** (world-map travel destinations): 3-letter IATA airport code of the nearest major airport. If taken, use nearest alternate. If no airport, derive a 3-letter city abbreviation and add to `index.md`.
- Examples: `PSA` (Florence/Tuscany), `NAP` (Naples), `EMA` (Nottingham)

**Tier 2 — Named specific locations** (a market, court, inn, palace, field, guard shack, bakery, forest clearing — any place *within* or *near* a city): 4–6 character descriptive code, format `{CITY}{LOC}`.
- The code must be self-explanatory: city prefix + location type.
- Examples: `BIRGS` (Birka Guard Shack), `PSAGLD` (Florence guild counting house), `NAPCRT` (Naples ecclesiastical court), `SHWFST` (Sherwood Forest), `EMACHT` (Nottingham city gate)
- Record every Tier 2 code in `index.md` with the location's description and story role.

**Rule:** City/town node → 3-letter code. Specific named place inside a city → 4–6 char Tier 2 code. Label must encode the reason the location exists in the story. Verify uniqueness: `GET /api/list/node`.

---

### Step 1 — Verify the primary location

```bash
curl http://localhost:1367/api/location/{code}
```

If the node is missing:
1. Pick the IATA code; confirm it's free with `GET /api/list/node`
2. Find a grid slot: `GET /api/coords/near/{anchor}?radius=8` (use nearest existing node as anchor)
3. Create node with coordinates:
```bash
curl -X POST http://localhost:1367/api/node \
  -H 'Content-Type: application/json' \
  -d '{"code":"EMA","label":"Nottingham — East Midlands","name":"city","act":3,"r":48,"c":116}'
```
4. Confirm: `GET /api/location/{code}` — terrain and label must match the story

---

### Step 2 — Verify the quest NPC exists

```bash
curl http://localhost:1367/api/npc/{npcId}
```

If the NPC is missing, create them with their home node from Step 1:
```bash
curl -X POST http://localhost:1367/api/npc \
  -H 'Content-Type: application/json' \
  -d '{"id":"friar_tuck","name":"Friar Tuck","node":"EMA","role":"quest_giver","text":"A round friar..."}'
```

NPC names and roles come directly from the story source — use the character as written.

---

### Step 3 — Verify NPC is at the location

Confirm the NPC's `node` field matches the node from Step 1. If mismatched:
```bash
curl -X PUT http://localhost:1367/api/npc/friar_tuck \
  -H 'Content-Type: application/json' \
  -d '{"node":"EMA"}'
```

The NPC must be resident at the node where the quest fires before the quest is created.

---

### Step 4 — Verify all other locations the quest touches

Each quest act may reference additional nodes — waypoints, handoff city, destination. For each:
```bash
curl http://localhost:1367/api/location/{code}
```

Add any missing nodes following the Step 1 procedure. **All `activateNode` codes must exist in NODE_MAP before any quest is written.**

---

### Step 5 — Add the quest via NPC

Create the quest entry. The NPC from Step 2 is the narrative anchor; `activateNode` is where the act fires.

```bash
NONCE=$(curl -s -X POST http://localhost:1367/api/nonce \
  -H 'Content-Type: application/json' \
  -d '{"type":"quest","id":"stn_01_act1"}' | jq -r .nonce)

curl -X POST http://localhost:1367/api/quest \
  -H 'Content-Type: application/json' \
  -H "X-Nonce: $NONCE" \
  -d '{
    "id":            "stn_01_act1",
    "type":          "skill_check",
    "title":         "The Merry Men — First Contact",
    "text":          "You arrive at Nottingham gate. Friar Tuck intercepts you...",
    "activateNode":  "EMA",
    "checkStat":     "wis",
    "checkDC":       12,
    "passText":      "The friar nods and leads you into the forest.",
    "failText":      "The friar eyes you suspiciously and sends you away.",
    "checkPassFlag": "stnAct1Done"
  }'
```

Required fields: `id`, `type`, `title`, `text`, `activateNode`, `passText`, `failText`, `checkPassFlag`  
For Act 2+: add `"activateCond": "stnAct1Done"` (previous act's `checkPassFlag`)  
For final act: add `"questComplete": true`

Quest types: `combat | explore | trade | social | mission_bit | skill_check`

---

### Step 6 — Chain via mission bits

Verify state flags exist for each act transition:
```bash
# Create any missing flags
curl -X POST http://localhost:1367/api/flags \
  -H 'Content-Type: application/json' \
  -d '{"name":"stnAct1Done","defaultValue":false}'
```

Verify the full chain resolves end-to-end:
```bash
curl http://localhost:1367/api/quest/stn_01_act1/chain
```

Chain pattern: Act 1 (no `activateCond`) → Act 2 (`activateCond=stnAct1Done`) → ... → Act N (`questComplete:true`)

---

### Step 7 — Validate after insert

```bash
curl http://localhost:1367/api/audit | jq '.errors'
```

The audit checks: all `activateNode` codes exist, all `activateCond` flags exist, all `checkPassFlag` values are unique, all `type` values are valid. **Fix every error before proceeding.**

---

### Step 8 — Review unresolved items, mark done, speak, then repeat

Report any items that could not be imported: missing source data, ambiguous node codes, NPC identity conflicts, unresolvable geography. Ask the user to resolve before continuing.

When all acts of the vignette cycle are imported and audit is clean:
```bash
curl -X POST http://localhost:1367/api/save
```

**If the user confirms the cycle is good:**
1. Mark the vignette cycle as `IMPORTED` in `plan.md §IMPORT-01` Import Queue (change `QUEUED` → `IMPORTED — {date}`)
2. Speak the completion prompt:
```bash
say "Cycle imported. Ready to continue. Say yes to proceed to the next quest."
```
3. Wait for user confirmation, then return to Step 1 for the next act or next vignette cycle.

---

### Placement reference

| Node role | Distance from anchor | Typical terrain |
|---|---|---|
| Same-city node (act 1) | 1–3 cells | city, ruins, monastery |
| Route waypoint (acts 2–3) | 4–8 cells, direction of travel | road, forest, coast |
| Distant endpoint (acts 4–5) | 8+ cells | real geographic match |

The 4x expansion (2026-06-03) left 3 empty grid cells between every adjacent pair of original nodes. There is ample room — use `GET /api/coords/near/{code}` to find unoccupied slots.

See also: `GET /api/help/import`, `GET /api/help/coords`, `1367-sources/plan.md §IMPORT-01`
