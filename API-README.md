# Roll2Hit World Builder API — Full Reference

**Architecture**: Browser UI → Node.js REST server → `roll2hit-v3.html` (game file)  
**Server port**: `localhost:3001`  
**Game file**: `roll2hit-v3.html` (1.7 MB, ~11,530 lines)

---

## Quick Start

### Prerequisites

```bash
brew install node        # Node.js via Homebrew on macOS
```

### Start the server

```bash
# From the roll2hit directory:
./start-wbapi.sh                  # uses roll2hit-v3.html in same dir
./start-wbapi.sh my-save.html     # different game file
PORT=3002 ./start-wbapi.sh        # different port
```

The script:
- Verifies Node.js and the game file exist
- Starts `wbapi-server.js` with verbose logging
- Captures all output to `wbapi-server.log`
- **Restarts automatically** if the server crashes
- Press `Ctrl+C` to stop cleanly

Once running:
```
════════════════════════════════════════════════════════════════
  WBAPI Server  —  http://localhost:3001/api
════════════════════════════════════════════════════════════════
  Game file: roll2hit-v3.html
  Log file:  wbapi-server.log
```

### Connect the browser UI

1. Open `worldbuilder.html` in your browser
2. Click **📂 Load roll2hit-v3.html** and select the game file
3. The topbar shows **● Server** (green) if the server is running, **○ Browser only** if not
4. All PUT/DELETE operations now write to disk automatically

---

## Verbose Logging

The server logs two streams — visible in your terminal and in `wbapi-server.log`:

| Tag | Meaning |
|---|---|
| `[REQUEST]` | Incoming HTTP method, URL, and request body from the browser |
| `[LOGIC]`   | Internal decisions: key resolution, routing strategy, blockers found |
| `[RESPONSE]`| Outgoing HTTP status code and result summary |
| `[LOAD]`    | Game file parse events with entity counts |
| `[INFO]`    | Server lifecycle (start, restart) |
| `[ERROR]`   | Exceptions and server-side failures |

**Example log for a monster PUT:**
```
2026-05-29 16:42:11 [REQUEST ] PUT /api/monster/commoner
2026-05-29 16:42:11 [REQUEST ] Body: {"ac":15,"hp":8}
2026-05-29 16:42:11 [LOGIC   ] Key resolved: "commoner" → "commoner" (type=monster)
2026-05-29 16:42:11 [LOGIC   ] Field "ac" is number → ns.put (in-memory)
2026-05-29 16:42:11 [LOGIC   ] Field "hp" is number → ns.put (in-memory)
            └─ 200 monster:commoner — 2 fields: ac=ok, hp=ok
```

**Example log for a blocked DELETE:**
```
2026-05-29 16:43:05 [REQUEST ] DELETE /api/node/CY
2026-05-29 16:43:05 [LOGIC   ] DELETE blocked — nested content: {"quests":["quest_antecedent_01",...],"npcs":["crov"]}
            └─ 409 DELETE blocked for node:CY
```

---

## Response Envelope

Every `GET`, `PUT`, and `DELETE` response wraps the entity in a connection-aware envelope:

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

The `_meta.canDelete` flag tells the UI whether to show a Delete button or a "blocked" warning — no second request needed.

---

## Endpoints

### GET /api/ping
Health check. Use this to detect if the server is running.

```bash
curl http://localhost:3001/api/ping
```
```json
{
  "ok": true,
  "loaded": true,
  "file": "roll2hit-v3.html",
  "nodes": 144,
  "quests": 210,
  "monsters": 392
}
```

---

### GET /api/{type}/{id}

Fetch a single entity with full connection envelope.

`type` = `node` | `quest` | `monster` | `npc`

**GET /api/monster/commoner**
```json
{
  "entity": { "name": "Commoner", "ac": 10, "hp": 4, "atk": 0, "tier": "trivial" },
  "connections": {
    "terrains": [
      { "key": "market_quarter", "label": "Market Quarter",
        "nodes": [{ "code": "CI", "label": "City Streets — Birka" }] }
    ],
    "drop": null
  },
  "_meta": { "canDelete": false, "blockedBy": { "terrains": ["market_quarter", "...19 more"] } }
}
```

**GET /api/node/CY**
```json
{
  "entity": { "label": "Neon Undercity", "name": "cyberpunk_streets", "act": 3 },
  "connections": {
    "terrain": "cyberpunk_streets",
    "monsters": [{ "key": "street_thug", "name": "Street Thug", "tier": "medium" }],
    "quests":   [{ "id": "quest_antecedent_01", "title": "The Question", "type": "side" }],
    "npcs":     [],
    "linkedNodes": { "N": "BI", "S": null, "E": null, "W": null }
  },
  "_meta": { "canDelete": false, "blockedBy": { "quests": ["quest_antecedent_01"], "npcs": [] } }
}
```

---

### GET /api/location/{code}

Composite view: node + terrain + all monsters/quests/NPCs at that location.

```bash
curl http://localhost:3001/api/location/CI
```
```json
{
  "node": { "label": "City Streets — Birka", "name": "city", "act": 1 },
  "terrain": { "label": "City", "icon": "🏙", "monsters": [...] },
  "monsters": [ { "key": "commoner", "name": "Commoner", "ac": 10, ... } ],
  "quests":   [ { "id": "quest_wis_01", "title": "...", "type": "side" } ],
  "npcs":     [ { "key": "yael", "name": "Yael" } ]
}
```

---

### GET /api/list/{type}

Returns lightweight list with `_meta.canDelete` per item.

`type` = `node` | `quest` | `monster` | `npc` | `terrain`

**Query parameters:**
| Param | Applies to | Example |
|---|---|---|
| `?node=CY` | quest, npc | quests/npcs at that node |
| `?terrain=market_quarter` | monster | monsters in terrain |
| `?type=skill_check` | quest | filter by quest type |
| `?arc=quest_wis` | quest | filter by arc prefix |

```bash
curl 'http://localhost:3001/api/list/quest?node=CY'
curl 'http://localhost:3001/api/list/monster?terrain=market_quarter'
```

---

### PUT /api/{type}/{id}

Update one or more fields. Body is a JSON object of `{field: value}` pairs.

- **String fields** are patched directly into `_rawSrc` (preserves function bodies in quest JS)
- **Number/boolean fields** are applied in-memory

```bash
# Edit monster stats
curl -X PUT http://localhost:3001/api/monster/commoner \
  -H 'Content-Type: application/json' \
  -d '{"ac": 15, "hp": 8}'

# Edit quest text
curl -X PUT http://localhost:3001/api/quest/quest_wis_01 \
  -H 'Content-Type: application/json' \
  -d '{"passText": "You recalled the ancient text.", "xpAward": 150}'

# Edit node label
curl -X PUT http://localhost:3001/api/node/CY \
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
  "entity": { "name": "Commoner", "ac": 15, "hp": 8, "..." },
  "connections": { "..." },
  "_meta": { "canDelete": false, "blockedBy": { "terrains": [...] } }
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

### DELETE /api/{type}/{id}

Delete an entity. Returns **HTTP 409** if nested content blocks deletion.

```bash
curl -X DELETE http://localhost:3001/api/monster/rabid_monkey
```

**200 — deleted:**
```json
{ "ok": true, "key": "rabid_monkey", "wasEntity": { "name": "Rabid Monkey", "..." } }
```

**409 — blocked:**
```json
{
  "ok": false,
  "error": "Delete blocked — nested content exists",
  "blockedBy": { "terrains": ["market_quarter", "city_ruins"] },
  "connections": { "terrains": [{ "key": "market_quarter", "nodes": [...] }] }
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

### POST /api/monster/{id}/rename

Change a monster's display name globally (key is unchanged).

```bash
curl -X POST http://localhost:3001/api/monster/commoner/rename \
  -H 'Content-Type: application/json' \
  -d '{"name": "Rabid Monkey"}'
```
```json
{ "ok": true, "key": "commoner", "from": "Commoner", "to": "Rabid Monkey", "terrains": [...20...] }
```

---

### POST /api/monster/{id}/fork

Create a new monster as a copy of an existing one (for terrain-specific variants).

```bash
curl -X POST http://localhost:3001/api/monster/commoner/fork \
  -H 'Content-Type: application/json' \
  -d '{"newKey": "rabid_monkey", "overrides": {"name": "Rabid Monkey", "hp": 8}}'
```

Then optionally replace in a specific terrain only:

```bash
curl -X POST http://localhost:3001/api/terrain/market_quarter/swap \
  -H 'Content-Type: application/json' \
  -d '{"oldKey": "commoner", "newKey": "rabid_monkey"}'
```

---

### POST /api/node/{id}/move

Rename a node code and rewrite all quest/NPC references automatically.

```bash
curl -X POST http://localhost:3001/api/node/CY/move \
  -H 'Content-Type: application/json' \
  -d '{"newCode": "CY2"}'
```
```json
{ "ok": true, "from": "CY", "to": "CY2", "questsUpdated": 3, "npcsUpdated": 0 }
```

---

### POST /api/save

Write all pending changes to a new timestamped HTML file. Original is never overwritten.

```bash
curl -X POST http://localhost:3001/api/save -H 'Content-Type: application/json' -d '{}'
```
```json
{ "ok": true, "path": "/Users/user/code/roll2hit.com/roll2hit-v3-20260529-162839.html" }
```

Use `outputPath` to specify a custom save location:
```bash
curl -X POST http://localhost:3001/api/save \
  -H 'Content-Type: application/json' \
  -d '{"outputPath": "/Users/user/Desktop/my-world.html"}'
```

---

### POST /api/reload

Re-read the game file from disk (picks up changes made by a previous session).

```bash
curl -X POST http://localhost:3001/api/reload -H 'Content-Type: application/json' -d '{}'
```

---

## CRUD Detail View — How the Browser UI Works

The World Builder browser uses a **diff-tracking detail view** pattern:

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
                       Change indicators clear

4. Click Save       → POST /api/save
                       Timestamped HTML written to disk
                       Button shows "✓ Saved" briefly
```

The diff accumulates across multiple edits before saving — you can change 10 fields, click PUT once, then click Save once. Each PUT call is atomic: all named fields in the request body are applied together.

**Editable fields by entity type:**

| Monster | Quest | Node | NPC |
|---|---|---|---|
| name | title | label | name |
| ac | type | act | occupation |
| hp | hint/hook | battle | node |
| atk | passText | npc | greeting |
| dmgCount | failText | desc | neutral.dialogue |
| dmgDie | rewardText | locked | friendly.dialogue |
| dmgFlat | activateNode | N/S/E/W links | dearFriend.dialogue |
| tier | waypointNode | | |
| xp | npc | | |
| morale | checkDC/Stat/Skill | | |
| | xpAward | | |
| | reward | | |

---

## Multi-Edit Session Workflow

**Important:** Every `POST /api/save` writes the current in-memory state of `_rawSrc`. If you want multiple edits to accumulate in a single file, chain all PUTs before saving:

```javascript
// Wrong: two independent sessions, two output files
fetch('/api/monster/commoner', { method:'PUT', body: JSON.stringify({name:'Rabid Monkey'}) })
  .then(() => fetch('/api/save', { method:'POST', body:'{}' }))
// then separately:
fetch('/api/monster/npc_merchant', { method:'PUT', body: JSON.stringify({name:'Badger'}) })
  .then(() => fetch('/api/save', { method:'POST', body:'{}' }))

// Correct: both PUTs before one save
Promise.all([
  fetch('/api/monster/commoner',     { method:'PUT', body: JSON.stringify({name:'Rabid Monkey'}) }),
  fetch('/api/monster/npc_merchant', { method:'PUT', body: JSON.stringify({name:'Badger'}) }),
]).then(() => fetch('/api/save', { method:'POST', body:'{}' }))
```

Or use `POST /api/reload` to load the output of a previous session so changes accumulate:

```bash
# Session 1: rename Commoner
curl -X PUT .../api/monster/commoner -d '{"name":"Rabid Monkey"}'
curl -X POST .../api/save   # → roll2hit-v3-20260529-162643.html

# Session 2: load previous output, add another rename
curl -X POST .../api/reload  # reloads original roll2hit-v3.html
# ... actually load the timestamped file via ROLL2HIT_FILE env var
ROLL2HIT_FILE=roll2hit-v3-20260529-162643.html ./start-wbapi.sh
curl -X PUT .../api/monster/npc_merchant -d '{"name":"Badger"}'
curl -X POST .../api/save   # → roll2hit-v3-20260529-162839.html  (has BOTH renames)
```

---

## Field Strategies

The server applies two strategies for each PUT field:

| Strategy | Used for | How |
|---|---|---|
| `editField` | String fields | Regex find-and-replace in `_rawSrc` between `◆◆◆ WBAPI:SECTION:START/END ◆◆◆` anchors |
| `put` | Number / boolean fields | In-memory object merge; serialized to `_rawSrc` on `save()` |

**Why strings use `editField`:** Quest fields like `passText` can contain JavaScript function bodies (`completeFn: (S) => { S.gold += 100 }`). `editField` patches only the named string field in the raw HTML, preserving all surrounding code. Numeric fields (AC, HP, XP) don't have this constraint and update cleanly in memory.

---

## Error Codes

| HTTP | Meaning |
|---|---|
| 200 | Success |
| 201 | Created (fork) |
| 207 | Multi-status (partial PUT success — check `fields[].ok`) |
| 400 | Bad request (missing field, invalid JSON, unknown type) |
| 404 | Entity not found |
| 405 | Method not allowed |
| 409 | Conflict — nested content blocks DELETE, or node code already exists |
| 500 | Unhandled server exception |

---

## Data Architecture Reference

`roll2hit-v3.html` is a single-file game. All data lives in `<script>` blocks, bounded by 14 anchor comments:

```
// ◆◆◆ WORLDBUILDER:{SECTION}:START ◆◆◆
// ◆◆◆ WORLDBUILDER:{SECTION}:END ◆◆◆
```

| Section | Contents | Notes |
|---|---|---|
| MONSTER_POOL | 392 monsters | `{ key: { name, ac, hp, atk, dmgDie, tier, ... } }` |
| MONSTER_DROPS | 392 drop tables | `{ key: { icon, name, sell } }` |
| WORLD_DB | 69 terrain types | Uses `P.monsterKey` refs, parsed with P proxy |
| NODE_MAP | 144 world nodes | `{ code: { label, name(=terrain), act, battle, npc, N,S,E,W } }` |
| NODE_COORDS | 144 canvas coords | `{ code: { x, y } }` |
| QUEST_DB | 210 quests | Contains JS closures — parsed with `removeFns` sanitizer |
| BIRKA_NPC | 6 named NPCs | Full dialogue trees, contains JS closures |

The server never executes the full game file. It reads it as text, slices sections by anchor comments, and evaluates each section in isolation with appropriate guards.
