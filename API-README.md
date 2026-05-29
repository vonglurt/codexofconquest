<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

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

## Use Case: Implementing a Quest Chain One Story at a Time

> **Scenario:** You are writing the Paul arc — a 12-quest escort chain across 13 nodes. Each quest has a different mechanic (STR check, WIS check, side event, skill block). You want to implement it one quest at a time, verify each one with a GET, then save the game file. This is the API-driven authoring workflow.

---

### Step 0 — Verify the starting node exists

Before adding any quests, confirm the target node is in the game and has the terrain you expect:

```bash
curl http://localhost:3001/api/location/KS
```

```json
{
  "entity": { "node": { "code": "KS", "label": "Damascus — Lower City", "act": 4, "name": "damascus" } },
  "connections": { "quests": [...], "npcs": [...], "monsters": [...] },
  "_meta": { "canDelete": false }
}
```

If the node doesn't exist yet, add it first:

```bash
curl -X PUT http://localhost:3001/api/node/KS \
  -H 'Content-Type: application/json' \
  -d '{"label":"Damascus — Lower City","name":"damascus","act":4}'
```

---

### Step 1 — Add a state flag

The first quest needs a completion flag. Add it to `_S_DEFAULTS` in the game file manually (WBAPI does not yet write `_S_DEFAULTS` — this is the one field that stays a direct edit). Flag naming convention: `camelCase`, scoped to the arc, descriptive.

```
escapedDamascus: false,   // added to _S_DEFAULTS manually
```

After adding the flag, reload the server:
```bash
# Restart wbapi-server.js against the updated game file
ROLL2HIT_FILE=roll2hit-v3.html ./start-wbapi.sh
```

---

### Step 2 — Inspect the schema before writing the quest

```bash
curl http://localhost:3001/api/schema/quest
```

Returns the canonical field list for quest objects — required fields, editable fields, types. Use this to avoid typos in field names before writing the quest object.

```json
{
  "_section": "QUEST_DB",
  "fields": {
    "id":           { "type": "string",   "required": true  },
    "type":         { "type": "string",   "required": true,  "values": ["side","skill_check","epic","main"] },
    "title":        { "type": "string",   "required": true,  "editable": true },
    "desc":         { "type": "string",   "required": true,  "editable": true },
    "hint":         { "type": "string",   "required": true,  "editable": true },
    "activateNode": { "type": "string",   "required": true                    },
    "checkAbility": { "type": "string",   "required": false, "note": "skill_check only" },
    "checkDC":      { "type": "number",   "required": false, "note": "skill_check only" },
    ...
  }
}
```

---

### Step 3 — Add the first quest

The basket escape quest. This is a skill_check (STR Athletics DC 12) at node KS. The `POST /api/quest` endpoint creates a new quest object in `QUEST_DB`:

```bash
curl -X POST http://localhost:3001/api/quest \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "quest_basket_damascus",
    "type": "skill_check",
    "title": "Over the Wall",
    "desc": "The magistrate has issued a detention order. The gate is watched. The wall is not. The rope is knotted cloth — seven knots, tested against the window frame.",
    "hint": "Lower him over the wall. Hold the rope.",
    "activateNode": "KS",
    "activateCond": "anathSightRestored",
    "checkAbility": "str",
    "checkLabel": "Athletics",
    "checkDC": 12,
    "retryable": true,
    "retryGateDays": 1,
    "xpAward": 150,
    "checkPassFlag": "escapedDamascus",
    "vignetteText": "He gets in. He does not speak. You hold the rope.",
    "passText": "Down. Controlled. The gate guard does not turn. The facts are accurate. They do not include the knots.",
    "failText": "The rope shifts. You pull back. The window remains. Tomorrow.",
    "disposition": "Through a window in the wall his disciples lowered him in a basket."
  }'
```

Response:

```json
{ "ok": true, "key": "quest_basket_damascus", "action": "created" }
```

---

### Step 4 — Verify the quest is readable

```bash
curl http://localhost:3001/api/quest/quest_basket_damascus
```

Returns the full quest object. Check that `activateNode`, `checkAbility`, `checkDC`, and `checkPassFlag` are all set correctly before proceeding.

---

### Step 5 — Edit quest text without rewriting the whole quest

Once a quest exists, individual fields can be patched:

```bash
curl -X PUT http://localhost:3001/api/quest/quest_basket_damascus \
  -H 'Content-Type: application/json' \
  -d '{"passText": "Down. Controlled. The last three feet you lower slowly because you can hear him breathing. He lands and crouches and then he is moving. The gate guard does not turn."}'
```

```json
{
  "ok": true,
  "key": "quest_basket_damascus",
  "fields": [{ "field": "passText", "strategy": "editField", "ok": true }]
}
```

The `editField` strategy patches only the `passText` value in `_rawSrc` — the surrounding quest object (including function bodies in other fields) is untouched.

---

### Step 6 — Repeat for each quest in the chain

Each quest is one `POST /api/quest` call. The chain order is:

```
quest_basket_damascus  →  quest_anath  →  quest_barnach_vouches  →  quest_ezzir
→  quest_governor_cyprus  →  quest_lame_lystra  →  quest_stoning_lystra
→  quest_prison_phillam  →  quest_areopagus  →  quest_ephesus_riot
→  quest_corinth_letters  →  quest_rome_arrest
```

Each quest's `activateCond` references the `checkPassFlag` of the preceding quest. The chain is verified after each addition with `GET /api/quest/{id}`.

---

### Step 7 — Verify the full chain with `chain`

After adding all quests, run the chain query to confirm the dependency graph is correct:

```bash
curl http://localhost:3001/api/quest/quest_anath/chain
```

```json
{
  "upstream": ["quest_basket_damascus"],
  "downstream": ["quest_barnach_vouches", "quest_hellenists_jerusalem"]
}
```

If any quest appears in the wrong position, or a flag name is misspelled (which severs the chain), it will show up here as a disconnection.

---

### Step 8 — Save to a timestamped file

```bash
curl -X POST http://localhost:3001/api/save -H 'Content-Type: application/json' -d '{}'
```

```json
{ "ok": true, "path": "/Users/.../roll2hit-v3-20260529-143012.html" }
```

Load the timestamped file to verify it renders correctly in the browser. The chain is now committed. The next session loads the timestamped file and continues from there.

---

### Pattern Summary — One Quest at a Time

| Step | API call | What it verifies |
|------|----------|-----------------|
| 0 | `GET /location/{nodeCode}` | Node exists; terrain is correct |
| 1 | Edit `_S_DEFAULTS` manually | State flag is registered |
| 2 | `GET /schema/quest` | Field names before writing |
| 3 | `POST /api/quest` | Quest created in QUEST_DB |
| 4 | `GET /api/quest/{id}` | Quest is readable; all fields set |
| 5 | `PUT /api/quest/{id}` | Patch text fields without full rewrite |
| 6 | Repeat 3–5 | Add each quest in the chain |
| 7 | `GET /api/quest/{id}/chain` | Dependency graph is connected |
| 8 | `POST /api/save` | Commit to timestamped HTML |

---

## Use Case: Generic Mission Builder — Starting Location → Mission Type → Skill Check

> **Scenario:** You want to create a repeatable pattern for new quest arcs. Starting at a node, you choose a sequence of mission types (hunt, escort, skill_check, collect, talk_chain). Each type has a canonical set of required fields and a matching skill check stat. The API validates each mission against the pattern before inserting it.

---

### Query 1 — What missions currently exist at a node?

```bash
curl http://localhost:3001/api/location/LT
```

The `connections.quests` array in the response shows every quest whose `activateNode` or `waypointNode` is `LT`. Before adding a new quest, confirm:
- No other quest uses the same `checkPassFlag` you plan to use
- The activation chain does not orphan an existing quest

---

### Query 2 — What mission types are valid here?

Use the schema to get the canonical mission type list:

```bash
curl http://localhost:3001/api/schema/quest | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['fields']['type']['values'])"
```

```
["side", "skill_check", "epic", "main"]
```

The operational class taxonomy (from `§WORLDBUILDER-02-B`) maps these to richer types:

| API `type` | Operational class | Canonical stat | DC range |
|-----------|------------------|----------------|----------|
| `skill_check` | `hunt` | STR Athletics | 10–14 |
| `skill_check` | `escort` | STR Athletics | 12–15 |
| `skill_check` | `skill_check` | WIS/INT/CHA | 10–15 |
| `skill_check` | `investigation` | INT Investigation | 12–16 |
| `skill_check` | `survival` | CON Endurance | 12–16 |
| `side` | `talk_chain` | No roll | — |
| `side` | `collect` | No roll | — |
| `side` | `lore_collect` | No roll | — |
| `epic` | `epic` | Multiple | Varies |
| `main` | `gate_pass` | No roll | — |

---

### Query 3 — Build a three-quest escort chain at PL

A three-quest escort chain at Philippi: meet the contact, secure the prison, depart.

**Mission 1: meet the contact (talk_chain / side)**
```bash
curl -X POST http://localhost:3001/api/quest \
  -d '{"id":"quest_pl_01","type":"side","title":"The Bridge Meeting","activateNode":"PL","checkPassFlag":"plContactMet","desc":"..."}'
```

**Mission 2: secure the prison (skill_check / escort, WIS DC 12)**
```bash
curl -X POST http://localhost:3001/api/quest \
  -d '{"id":"quest_pl_02","type":"skill_check","title":"Seven Stairs, Then Five","activateNode":"PL","activateCond":"plContactMet","checkAbility":"wis","checkLabel":"Insight","checkDC":12,"checkPassFlag":"plPrisonSecured","desc":"..."}'
```

**Mission 3: depart (gate_pass / side)**
```bash
curl -X POST http://localhost:3001/api/quest \
  -d '{"id":"quest_pl_03","type":"side","title":"The Road East","activateNode":"PL","activateCond":"plPrisonSecured","checkPassFlag":"plDeparted","desc":"..."}'
```

Then verify the chain:
```bash
curl http://localhost:3001/api/quest/quest_pl_01/chain
# upstream: [], downstream: [quest_pl_02, quest_pl_03]
```

---

### Query 4 — Validate before saving

After building the chain, run a GET on each quest and confirm:
1. All `activateCond` flags exist in `_S_DEFAULTS` (manual check — WBAPI cannot query `_S_DEFAULTS` yet)
2. All `checkPassFlag` values are unique (the server does not enforce this; check with `GET /api/quest/{flagName}` — if it returns a quest, the flag is taken)
3. All `activateNode` values exist: `GET /api/node/{code}`

These three checks are the pre-flight for any quest chain. After passing, `POST /api/save`.

---

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
