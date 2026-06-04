<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report: From grep to WBAPI — The Evolution of Roll2Hit World Data Access

**Author:** Claude (Sonnet 4.6) + PaulRicheson@Roll2Hit.com  
**Date:** 2026-05-29  
**Classification:** Architecture / Developer Tooling / Data Access Evolution  
**Audience:** CS/EE background; familiar with shell scripting, Node.js, REST APIs  

---

## Abstract

This report documents the complete arc of how `roll2hit-v3.html` — a single-file browser game — evolved to support structured world data access and mutation from external developer tooling. The journey passed through six distinct phases: raw `grep`, stream editing with `sed`, Perl one-liners, Python AST attempts, bare Node.js extraction, a full JavaScript parser running inside Node, and finally `wbapi-server.js`: a local REST API that parses the HTML's embedded `<script>` block, reconstructs all game arrays in memory, and writes mutations back into the HTML file in-place. The report documents the design constraints that drove each phase transition, the architecture of the final WBAPI system including its NONCE-based write-protection model, and a complete alphabetical reference of all read-only and write endpoints drawn from the live help system.

---

## I. The Constraint: One File, No Build Step

The foundational constraint of this project is stated in `plan.md §I`:

> *The entire game — all data, all logic, all UI — is fully playable in a browser with only `roll2hit-v3.html`. No Node, no server, no dependencies.*

This is not an aesthetic preference. It is a functional requirement: the game must be giveable as a single file. A friend, a player, a future archaeologist must be able to open it in a browser and play. There is no build step, no `npm install`, no template language, no `<link>` to an external stylesheet, no `<script src="...">`. Every monster, every terrain entry, every quest, every NPC, every fish in the lake, every lake magic item lives as a JavaScript object literal inside one `<script>` tag in one HTML file.

This constraint is unusually strict. Most games of comparable complexity would have a database, a build pipeline, or at minimum a JSON asset bundle. Roll2Hit chose the single-file path deliberately, modelling itself after the demoscene tradition and single-file tools like `htmx.org` — where the artifact *is* the thing, not a build artifact that refers to the thing.

The problem this creates for a developer is: **how do you add monsters, quests, and terrain entries to a 300 KB JavaScript literal inside an HTML file without making a typo that silently corrupts the game?**

---

## II. The Six Phases of Data Access Evolution

### Phase 1 — grep (direct text search)

The first approach to finding data in the HTML was `grep`. When the worldbuilder needed to know "does monster key `dock_rat` already exist?", the answer was:

```bash
grep -n "dock_rat" roll2hit-v3.html
```

This worked for existence checks. It completely failed for structure. A grep result shows you a line; it does not tell you whether that line is inside `MONSTER_POOL`, inside a comment, inside a quest description that happens to mention the monster, or inside the worldbuilder anchor block. Grep treats the file as a bag of lines. The file is not a bag of lines — it is a JavaScript AST serialized as text.

The first generation of worldbuilder tooling was entirely grep-based: the worldbuilder anchor markers (`// ◆◆◆ WORLDBUILDER:WORLD_DB:START ◆◆◆`) were added precisely to give grep a bounded region to search. This worked for terrain entries. It completely failed for quests and monsters, which live in different sections with no clean line-addressable boundary.

**Why it broke:** Multi-line objects. A monster entry spans 1–3 lines and may not have a predictable line pattern. A quest entry spans 5–15 lines. grep is line-addressed. The game is not.

---

### Phase 2 — sed (stream editing)

The next phase used `sed` for insertion. The pattern:

```bash
# Insert a new terrain entry before the WORLD_DB closing anchor
sed -i '' "/◆◆◆ WORLDBUILDER:WORLD_DB:END ◆◆◆/i\\
  new_terrain: { monsters:[P.goblin], label:'New Terrain', icon:'🌿' },
" roll2hit-v3.html
```

This worked for append-only operations on sections with anchors. The worldbuilder anchor system — `◆◆◆ WORLDBUILDER:section:START ◆◆◆` / `:END` — was designed to support exactly this pattern. Sed could insert before the `:END` line reliably.

**Why it broke:** Brace counting. A JavaScript object literal is not line-addressed. The `:END` anchor sits before the closing `};` of the WORLD_DB object, but the closing brace of a terrain entry must be balanced. Sed cannot count braces. A malformed insertion (missing trailing comma, unbalanced brace) would break the entire `<script>` block silently — the browser would see a JS syntax error and the game would not load at all. Worse, `sed -i` modifies in-place with no undo.

---

### Phase 3 — Perl (regex with state)

Perl one-liners attempted to do what sed could not: track brace depth.

```perl
perl -0777 -i -pe '
  s/(◆◆◆ WORLDBUILDER:MONSTER_POOL:START ◆◆◆.*?)(  ◆◆◆ WORLDBUILDER:MONSTER_POOL:END ◆◆◆)/
    $1  dock_rat: { name:"Dock Rat", ac:11, hp:4, atk:2, dmg:3, xp:10, tier:1 },\n$2/s
' roll2hit-v3.html
```

The `-0777` flag slurps the entire file as a single string, enabling the `/s` (single-line dot-matches-newline) modifier. This finally enabled multi-line regex matching.

**Why it broke:** Perl regex over 300 KB of JavaScript is fragile. The MONSTER_POOL `START`/`END` markers are reliable anchors, but the regex must match everything between them — which is a 2000-line JavaScript object. Any monster entry containing a regex metacharacter in a description field (parentheses, brackets, dots, pipes) would break the match. More fundamentally: Perl regex is not a JavaScript parser. It cannot understand string escaping, template literals, or nested object syntax.

---

### Phase 4 — Python (structured parsing attempt)

Python's `re` module with `DOTALL` and the `ast` module (for JSON-like literals) were the next attempt. The idea: extract the `<script>` block with regex, then parse the JavaScript object literals as if they were Python dicts.

```python
import re, json
with open('roll2hit-v3.html') as f:
    src = f.read()
script = re.search(r'<script>(.*?)</script>', src, re.DOTALL).group(1)
# Extract MONSTER_POOL block
mp_block = re.search(r'MONSTER_POOL\s*=\s*\{(.*?)\n\}', script, re.DOTALL).group(1)
```

**Why it broke:** JavaScript object literal syntax is not valid JSON. Property keys are unquoted (`ac:11` not `"ac":11`). Values may be references to other variables (`monsters:[P.goblin]` where `P` is a Proxy object). Template literals, arrow functions, spread operators, and regular expression literals appear throughout the codebase. `ast.literal_eval` chokes immediately. Even `json.loads` after naive key-quoting fails on the Proxy references. Python has no JavaScript runtime.

---

### Phase 5 — Bare Node.js (eval fragment)

Node.js can execute JavaScript. The attempt: extract the `<script>` block, stub out browser globals, and `eval()` the object literal.

```javascript
const src = fs.readFileSync('roll2hit-v3.html', 'utf8');
const script = src.match(/<script>([\s\S]*?)<\/script>/)[1];
// Stub browser globals
const document = { getElementById: () => null, ... };
const window = {};
// Eval and extract
eval(script);
console.log(Object.keys(MONSTER_POOL).length);
```

**Why it broke:** The game's `<script>` block is not a module — it is a browser-context script. It calls `document.getElementById`, `window.addEventListener`, reads `localStorage`, creates DOM elements with `document.createElement`, registers event listeners, and executes initialization logic on load. A bare Node.js `eval` with stubbed `document` fails immediately when the game's init code touches any DOM method that the stub doesn't implement. The stub needs to be as complete as a real browser DOM.

More subtly: `eval()` of a 300 KB script in global scope mixes all the game's internal variables into the Node.js module scope, creating naming collisions with Node built-ins (`Buffer`, `process`, `require`).

---

### Phase 6 — JavaScript Parser in Node (wbapi-core.js)

The final approach abandoned `eval()` entirely. Instead of executing the JavaScript, the parser *reads* it as structured text, using comment-aware brace counting to extract each data section as a raw string, then evaluates only the pure data literals — not the procedural code.

The key insight: the data arrays (`MONSTER_POOL`, `QUEST_DB`, `NODE_MAP`, `WORLD_DB`) are all declared as `const NAME = { ... };` at the top level. They are **pure data objects** — no function calls in their values, no DOM references, no side effects. The `P.monster_key` references in `WORLD_DB.monsters` arrays are a special case: `P` is a Proxy, so `P.dock_rat` evaluates to the string `"dock_rat"`. The parser handles this by pre-evaluating the Proxy pattern separately.

The parsing pipeline in `wbapi-core.js`:

```javascript
// 1. Extract <script> tag text (one regex, no eval)
const scriptText = html.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/)[1];

// 2. Locate each section by anchor markers
//    ◆◆◆ WORLDBUILDER:MONSTER_POOL:START ◆◆◆
//    ◆◆◆ WORLDBUILDER:MONSTER_POOL:END ◆◆◆

// 3. Comment-aware brace counting to find the object boundary
//    (skips braces inside // comments and /* */ blocks and strings)

// 4. Extract the raw object literal text for each section

// 5. Evaluate only the pure data literal in a minimal sandbox
//    with P = new Proxy({}, { get: (_, k) => k }) 
//    to resolve monster key references

// 6. Populate WBAPI.monsterPool, WBAPI.questDb, WBAPI.nodeMap, etc.
```

The comment-aware brace counter is the core innovation. JavaScript comments can contain unbalanced braces (`// this object { is not closed`). A naive brace counter would miscount and extract the wrong range. The counter maintains state: inside a string, inside a `//` comment, inside a `/* */` block comment, or in regular code — and only counts braces in the last state.

This approach is safe for two reasons:

1. **Only pure data is evaluated.** The procedural game code (event listeners, render functions, battle logic) is never executed. The parser never calls `eval()` on anything that touches the DOM.

2. **The HTML file is never corrupted by the parse step.** The parser is read-only. Writes are handled by a separate serializer that reconstructs each modified section as text and splices it back into the HTML via string replacement at the anchor positions.

---

## III. The WBAPI Architecture

The final system has three components:

```
roll2hit-v3.html          — single source of truth (game + all data)
wbapi-core.js             — parser + serializer (reads and writes the HTML)
wbapi-server.js           — HTTP server (REST API over wbapi-core)
wbapi-toggle.sh           — process manager (start/stop/fg/restart)
worldbuilder.html         — developer UI (reads API, ✦ Wizard tab)
```

### The HTML as Database

`roll2hit-v3.html` behaves as a document database with a peculiar storage format: JavaScript object literals embedded in a `<script>` tag. The "schema" is the shape of each object. The "records" are the keys. The "tables" are the named constants:

| Constant | Records | Analogous to |
|----------|---------|--------------|
| `NODE_MAP` | 144 nodes | `nodes` table |
| `QUEST_DB` | 211 quests | `quests` table |
| `MONSTER_POOL` | 392 monsters | `monsters` table |
| `WORLD_DB` | 107 terrains | `terrains` table |
| `BIRKA_NPCS` | 6 NPCs | `npcs` table |
| `FISH_POOL` / `NIGHT_FISH_POOL` | ~40 fish | `fish` table |
| `LAKE_MAGIC_DB` | ~20 items | `lake_magic` table |

The "primary key" for each table is the object key: node code (`CY`, `BK`), snake\_case monster key (`goblin`, `dock_rat`), quest ID (`quest_wis_01`). All cross-references are by key string.

The WBAPI server loads this database into memory on startup, serves reads from memory, and writes by mutating memory then serializing back to the file. This is the same pattern used by SQLite's WAL mode: reads are cheap and concurrent; writes serialize through a single process.

### Worldbuilder Anchor Markers

Every major data section in the HTML has paired anchor markers:

```javascript
// ◆◆◆ WORLDBUILDER:MONSTER_POOL:START ◆◆◆
const MONSTER_POOL = {
  goblin: { name:'Goblin', ac:13, hp:7, atk:4, dmg:5, xp:50, tier:1 },
  // ... 391 more entries ...
};
// ◆◆◆ WORLDBUILDER:MONSTER_POOL:END ◆◆◆
```

The `◆◆◆` character (U+25C6 BLACK DIAMOND) was chosen because it cannot appear in any JavaScript identifier, string template, or operator. It is unambiguously a marker. The markers survive minification (as long as whitespace is not stripped from comments). They also make grep usable as a last resort: even if the WBAPI server is unavailable, a developer can `grep -n "◆◆◆" roll2hit-v3.html` to find every section boundary.

The serializer uses these anchors as splice targets. A terrain write, for example:

1. Finds `// ◆◆◆ WORLDBUILDER:WORLD_DB:START ◆◆◆` in the HTML text
2. Finds the matching `:END` anchor
3. Reconstructs the entire `WORLD_DB = { ... }` block from in-memory state
4. Replaces the text between the anchors with the reconstructed block
5. Writes the complete modified HTML back to disk

This means every save is a full-section rewrite — not a surgical line edit. This is safe: the serializer always regenerates from the authoritative in-memory state, so there is no possibility of a partial write leaving the section in an inconsistent state.

---

## IV. Single-Writer Model and NONCE Protection

### Why Single Writer

The WBAPI server enforces **one writer at a time** by design. This is not a limitation — it is a deliberate architectural decision. The rationale:

The game world is not a high-frequency write workload. Terrain entries, monsters, and quests are added by one developer working at one terminal. The expected write rate is: several writes per session, a few sessions per week. There is no need for optimistic locking, conflict resolution, or distributed consensus. A single Node.js process owning the in-memory state and serializing writes sequentially is both correct and sufficient.

If two developers were simultaneously editing `roll2hit-v3.html` — one via curl, one via text editor — their writes would race and one would overwrite the other's changes. The WBAPI server prevents this not by locking the file (the OS advisory lock system is not reliable across processes) but by being **the only writer**. Any developer who needs to edit the world should go through the API. Direct text editor edits to the HTML's data sections are discouraged during an active server session.

After editing, the developer runs `POST /api/restart`. The server serializes the current in-memory state, writes it to disk, exits with code 67, and `wbapi-toggle.sh` relaunches it — loading the fresh HTML from disk. This is the "commit and restart" pattern: it ensures the on-disk state and the in-memory state are always synchronized.

### The NONCE System

Write protection is enforced by a two-step nonce protocol:

**Step A — Request a nonce:**
```bash
NONCE=$(curl -s -XPOST http://localhost:1367/api/nonce \
  -H 'Content-Type: application/json' \
  -d '{"type":"quest","id":"quest_chest_01"}' | jq -r .nonce)
```

The server generates a 16-character random token, stores it in memory with its `{type, id}` pair and a 5-minute expiry, and returns it. The token is single-use and tied to exactly one entity.

**Step B — Send the write with the nonce header:**
```bash
curl -XPOST http://localhost:1367/api/quest \
  -H 'Content-Type: application/json' \
  -H "X-Nonce: $NONCE" \
  -d '{"id":"quest_chest_01","title":"The Sealed Chest",...}'
```

The server validates that the nonce is unexpired, matches the `{type, id}` in the request, and has not been used before. Only then does it execute the write.

**Why this matters:** Writes to `roll2hit-v3.html` are permanent and not easily undone (git is the undo). The nonce forces a two-step review: the developer must explicitly state their intent (the nonce request) before the write executes. It also prevents accidental writes from mis-typed curl commands, browser tab replays, or automation scripts that have stale data. It is not a cryptographic security mechanism — it is a **confirmation handshake** for high-value irreversible operations.

DELETE operations always require a nonce. POST operations for create endpoints (terrain, monster, quest, node) accept nonces optionally. PUT operations for field updates do not require nonces by default, since individual field updates are lower risk than full create/delete operations.

---

## V. Read-Only Endpoints (Alphabetical)

All read-only endpoints are `GET` requests. They have no side effects. They read from the in-memory state, not from disk. They can be called concurrently without concern. No nonce is required.

---

### GET /api/audit

Integrity scan over all in-memory collections. Returns a structured report of findings grouped by severity:

| Severity | Meaning |
|----------|---------|
| `error` | Broken reference — will cause a runtime bug in the game |
| `warning` | Style issue or probable mistake — game still loads |
| `suggestion` | Improvement opportunity — not required |
| `parse` | Section could not be parsed — data may be missing |

Common errors: `quest.activateNode` pointing to a nonexistent node code; `WORLD_DB` terrain `monsters` array referencing a nonexistent `MONSTER_POOL` key; `quest.chain` pointing to a nonexistent quest ID; NPC `node` field pointing to a nonexistent node code.

Workflow: run audit → read errors → create missing entities or fix broken keys → run audit again until errors reach zero.

```bash
curl http://localhost:1367/api/audit
curl http://localhost:1367/api/audit | jq '.errors'
```

---

### GET /api/export/{collection}

Dumps a complete in-memory collection as a downloadable artifact. Useful for backups, offline analysis, or feeding data into other tools.

**Collections:** `node_map`, `quest_db`, `monster_pool`, `world_db`, `fish_pool`, `lake_magic`, `all`

**Formats** (via `?format=` query param):

| Format | Output |
|--------|--------|
| `json` (default) | Standard JSON |
| `js` | Assignment: `const QUEST_DB = {...};` |
| `module` | CommonJS: `module.exports = {...};` |

```bash
curl 'http://localhost:1367/api/export/quest_db?format=json' -o quests.json
curl 'http://localhost:1367/api/export/monster_pool?format=js' -o monsters.js
curl 'http://localhost:1367/api/export/all?format=module' -o game-data.js
```

The `module` format produces a file that can be `require()`'d by any Node.js script, enabling offline analysis of the full game dataset without a running server.

---

### GET /api/fish[/{key}][?rank=&night=]

Fish pool entries. Without parameters, returns all day fish. With `?night=1`, returns night fish. With `?rank=3`, returns fish of rank 3 or higher. With a key, returns a single fish entry.

```bash
curl http://localhost:1367/api/fish
curl 'http://localhost:1367/api/fish?night=1&rank=4'
curl http://localhost:1367/api/fish/silver_pike
```

---

### GET /api/flags

Lists all `_S_DEFAULTS` flags — the boolean and numeric game state defaults. Returns each flag's name, default value, and comment. Useful for auditing which game features are enabled by default and what their initial state is.

```bash
curl http://localhost:1367/api/flags
```

---

### GET /api/help[/{topic}]

The built-in help system — a man-page style reference served as plain text. Without a topic, returns the index of all available topics. With a topic, returns a detailed reference for that topic.

**Topics:** `overview`, `modes`, `nonce`, `read`, `write`, `quest`, `node`, `monster`, `terrain`, `mission_bit`, `export`, `wizard`, `audit`, `curl`

```bash
curl http://localhost:1367/api/help
curl http://localhost:1367/api/help/modes
curl http://localhost:1367/api/help/nonce
curl http://localhost:1367/api/help/wizard
curl http://localhost:1367/api/help/curl   # full cheat sheet
```

The help system makes the API self-documenting. A developer who has never used the API before can start with `curl http://localhost:1367/api/help` and navigate to any topic without consulting external documentation.

---

### GET /api/lake-magic[/{key}][?effect=&minRank=]

Lake magic item list or single entry. Filter by `effect` substring or `minRank` numeric threshold.

```bash
curl http://localhost:1367/api/lake-magic
curl 'http://localhost:1367/api/lake-magic?minRank=3'
curl http://localhost:1367/api/lake-magic/rod_of_fortune
```

---

### GET /api/list/{type}

Returns a flat list of all entities of a given type. Supports filtering via query parameters.

**Types:** `node`, `quest`, `monster`, `npc`, `terrain`, `fish`, `lake-magic`

**Filters:**
- `?node=CY` — quests or monsters at a specific node
- `?terrain=forest` — monsters in a specific terrain
- `?type=combat` — quests of a specific type

```bash
curl http://localhost:1367/api/list/node
curl http://localhost:1367/api/list/quest
curl http://localhost:1367/api/list/monster
curl 'http://localhost:1367/api/list/quest?node=CY'
curl 'http://localhost:1367/api/list/monster?terrain=coastal_market'
```

---

### GET /api/location/{code}

Composite view of a location. Returns the node, all quests with `activateNode === code`, all NPCs assigned to the node, and all monsters reachable via the node's terrain. Useful for understanding the full player experience at a given map position.

```bash
curl http://localhost:1367/api/location/CY
curl http://localhost:1367/api/location/BK
```

---

### GET /api/{node|quest|monster|npc|terrain}/{id}

Full entity detail with cross-references. In addition to the entity's own fields, the response includes:

- For **nodes**: linked quests, linked NPCs, monsters from terrain
- For **quests**: upstream/downstream chain, linked NPC, linked nodes
- For **monsters**: terrains that reference this monster, monster drop table
- For **terrain**: monster list, nodes that use this terrain

```bash
curl http://localhost:1367/api/node/CY
curl http://localhost:1367/api/quest/quest_wis_01
curl http://localhost:1367/api/monster/goblin
curl http://localhost:1367/api/terrain/forest
curl http://localhost:1367/api/npc/aldric
```

---

### GET /api/ping

Health check. Returns counts of all loaded collections. The canonical first call to verify the server is running and the game file is loaded.

```bash
curl http://localhost:1367/api/ping
# → {"ok":true,"loaded":true,"file":"roll2hit-v3.html",
#    "nodes":144,"quests":211,"monsters":392,"fish":40,"lakeMagic":20}
```

---

### GET /api/quest/{id}/chain

Returns the upstream and downstream quest chain for a given quest ID. Upstream = prerequisites that must be complete before this quest unlocks. Downstream = quests that unlock when this quest passes.

```bash
curl http://localhost:1367/api/quest/quest_wis_01/chain
```

---

### GET /api/schema[/{type}]

Returns the canonical field schema for a given entity type, including field names, types, whether they are required, and brief descriptions. Without a type, returns schemas for all entity types.

```bash
curl http://localhost:1367/api/schema
curl http://localhost:1367/api/schema/quest
curl http://localhost:1367/api/schema/monster
```

---

### GET /api/source

Returns the raw HTML source of `roll2hit-v3.html`. Pipe to a file to create a backup or to inspect the raw text.

```bash
curl http://localhost:1367/api/source -o backup-$(date +%Y%m%d).html
```

This endpoint is also how `worldbuilder.html` loads the game file when connected to the server — it fetches the source, parses it client-side using the same anchor-marker approach, and populates its in-browser WBAPI instance.

---

## VI. Write Endpoints (Alphabetical)

All write endpoints mutate in-memory state. **Changes are not persisted to disk until `POST /api/save` is called.** The recommended pattern: create/update → verify with a GET → save → restart.

DELETE operations require a nonce. See `GET /api/help/nonce` for the two-step protocol.

---

### DELETE /api/{node|quest|monster|npc}/{id}

Deletes an entity permanently from the in-memory state. Requires an `X-Nonce` header obtained from `POST /api/nonce`. The server checks for dependencies before deleting: a node that has quests or NPCs attached will return `409 Conflict` until those dependents are moved or deleted first.

```bash
NONCE=$(curl -s -XPOST http://localhost:1367/api/nonce \
  -H 'Content-Type: application/json' \
  -d '{"type":"node","id":"XX"}' | jq -r .nonce)
curl -XDELETE http://localhost:1367/api/node/XX -H "X-Nonce: $NONCE"
```

---

### POST /api/fish

Creates a new fish entry in `FISH_POOL` (or `NIGHT_FISH_POOL` if `isNight:true`).

```bash
curl -XPOST http://localhost:1367/api/fish \
  -H 'Content-Type: application/json' \
  -d '{"key":"silver_pike","name":"Silver Pike","rank":4,"desc":"A gleaming predator.","isNight":false}'
```

---

### POST /api/flags

Adds a new flag to `_S_DEFAULTS` — the game state initialization block. Flags are boolean or numeric values that initialize a new player's state.

```bash
curl -XPOST http://localhost:1367/api/flags \
  -H 'Content-Type: application/json' \
  -d '{"name":"questChestDelivered","defaultValue":false,"comment":"sealed chest delivery quest"}'
```

---

### POST /api/lake-magic

Creates a new lake magic item.

```bash
curl -XPOST http://localhost:1367/api/lake-magic \
  -H 'Content-Type: application/json' \
  -d '{"key":"rod_of_fortune","name":"Rod of Fortune","effect":"luck+2","rank":3}'
```

---

### POST /api/monster

Creates a new monster entry in `MONSTER_POOL`. The key must be unique and snake\_case. The monster is available in terrain arrays immediately after creation but must be added to a terrain via `PUT /api/terrain/{key}`.

```bash
curl -XPOST http://localhost:1367/api/monster \
  -H 'Content-Type: application/json' \
  -d '{"key":"dock_rat","name":"Dock Rat","ac":11,"hp":4,"atk":2,"dmg":3,"xp":10,"tier":1,"cr":"1/8","desc":"A mangy rodent the size of a small dog."}'
```

---

### POST /api/monster/{key}/fork

Creates a new monster by copying an existing one with optional field overrides. Useful for creating variants (e.g., an elite version of an existing enemy).

```bash
curl -XPOST http://localhost:1367/api/monster/goblin/fork \
  -H 'Content-Type: application/json' \
  -d '{"newKey":"goblin_champion","overrides":{"name":"Goblin Champion","ac":15,"hp":18,"xp":150,"tier":2}}'
```

---

### POST /api/monster/{key}/rename

Updates the `name` display field of an existing monster without changing its key. Useful when a monster's display name needs correction without breaking all terrain references (which use the key, not the name).

```bash
curl -XPOST http://localhost:1367/api/monster/dock_rat/rename \
  -H 'Content-Type: application/json' \
  -d '{"name":"Harbour Rat"}'
```

---

### POST /api/node

Creates a new map node. The `code` field is the primary key (2–3 uppercase chars). The `name` field is a terrain key from `WORLD_DB`.

```bash
curl -XPOST http://localhost:1367/api/node \
  -H 'Content-Type: application/json' \
  -d '{"code":"FD","label":"Fog Docks","act":1,"name":"coastal_market","desc":"Fog-shrouded docks where sailors speak in whispers."}'
```

---

### POST /api/node/{code}/move

Renames a node's code (primary key). Updates all references in `QUEST_DB` and `BIRKA_NPCS` automatically.

```bash
curl -XPOST http://localhost:1367/api/node/XX/move \
  -H 'Content-Type: application/json' \
  -d '{"newCode":"FD"}'
```

---

### POST /api/nonce

Requests a write-protection token. Required before any DELETE operation; recommended for destructive POSTs.

```bash
curl -XPOST http://localhost:1367/api/nonce \
  -H 'Content-Type: application/json' \
  -d '{"type":"quest","id":"quest_chest_01"}'
# → {"nonce":"ab12cd34ef56gh78","expires":300}
```

---

### POST /api/quest

Creates a new quest entry in `QUEST_DB`. `id`, `type`, `title`, and `activateNode` are required. `startText`, `failText`, and `passText` carry the narrative. `retryable:true` with `retryGateDays:0` enables hourly retry. `missionBitKey` links a mission-bit token item that the player carries.

```bash
curl -XPOST http://localhost:1367/api/quest \
  -H 'Content-Type: application/json' \
  -d '{
    "id":"quest_chest_01",
    "type":"mission_bit",
    "title":"The Sealed Chest",
    "activateNode":"FD",
    "startText":"The merchant presses a locked chest into your hands at dawn.",
    "failText":"The docks are crawling with guards tonight. You slip away.",
    "passText":"The temple priest accepts the chest without a word.",
    "retryable":true,
    "retryGateDays":0,
    "missionBitKey":"sealed_merchant_chest"
  }'
```

---

### POST /api/reload

Re-parses `roll2hit-v3.html` from disk, discarding all in-memory edits. Use this to reset the server state if you made changes directly to the HTML and want the server to pick them up without restarting the process.

```bash
curl -XPOST http://localhost:1367/api/reload
```

---

### POST /api/restart

Saves all in-memory edits to `roll2hit-v3.html`, then exits with code 67. The `wbapi-toggle.sh` restart loop catches code 67 and relaunches the server automatically. The result: a clean restart with the freshly-saved HTML as the source.

```bash
curl -XPOST http://localhost:1367/api/restart
# Server relaunches automatically via wbapi-toggle.sh
```

---

### POST /api/save

Serializes all in-memory edits to `roll2hit-v3.html`. This is the write-commit step. Always call after any create/update/delete operation.

```bash
curl -XPOST http://localhost:1367/api/save
```

---

### POST /api/terrain

Creates a new terrain entry in `WORLD_DB`. The `monsters` array contains `MONSTER_POOL` keys (not names). The server validates that each key exists in `MONSTER_POOL` before writing.

```bash
curl -XPOST http://localhost:1367/api/terrain \
  -H 'Content-Type: application/json' \
  -d '{"key":"fog_docks","label":"Fog Docks","icon":"🌫","monsters":["dock_rat","drowned_sailor"]}'
```

---

### POST /api/terrain/{key}/swap

Renames a monster key within a terrain's `monsters` array. Used when a monster key is being renamed and all terrain references must be updated.

```bash
curl -XPOST http://localhost:1367/api/terrain/coastal_market/swap \
  -H 'Content-Type: application/json' \
  -d '{"oldKey":"dock_rat","newKey":"harbour_rat"}'
```

---

### PUT /api/{node|quest|monster|npc}/{id}

Updates individual fields of an existing entity. Only the fields included in the body are modified; all other fields are preserved.

```bash
curl -XPUT http://localhost:1367/api/node/FD \
  -H 'Content-Type: application/json' \
  -d '{"label":"The Sunken Docks","desc":"Updated description."}'

curl -XPUT http://localhost:1367/api/quest/quest_chest_01 \
  -H 'Content-Type: application/json' \
  -d '{"failText":"The tide is wrong tonight. You wait for morning."}'

curl -XPUT http://localhost:1367/api/monster/dock_rat \
  -H 'Content-Type: application/json' \
  -d '{"hp":6,"xp":12}'
```

---

### PUT /api/terrain/{key}

Updates a terrain's `label`, `icon`, or `monsters` array. Setting `monsters` replaces the entire array; partial updates are not supported (send the complete desired list).

```bash
curl -XPUT http://localhost:1367/api/terrain/fog_docks \
  -H 'Content-Type: application/json' \
  -d '{"monsters":["dock_rat","drowned_sailor","harbour_smuggler"]}'
```

---

## VII. Design Analysis: Why This Architecture Is Correct For This Problem

The WBAPI architecture optimizes for a specific set of constraints that are uncommon in production software but common in solo/small-team game development:

| Constraint | Consequence | WBAPI Response |
|-----------|-------------|----------------|
| Single-file HTML must stay playable | Cannot move data out of HTML | Parser reads data in-place; serializer writes back in-place |
| No build step | Data is JavaScript literals, not JSON | Comment-aware brace-count parser; Proxy trick for `P.*` references |
| One developer writing world data | No concurrency needed | Single Node.js process owns all in-memory state |
| Writes are high-value and infrequent | Mistakes are costly | NONCE handshake; dependency checks before DELETE |
| Developer must understand state before writing | Blind writes are dangerous | Comprehensive GET read API; audit endpoint; help system |
| Server may be restarted mid-session | State must survive restart | All state is in the HTML file; restart re-parses from disk |

The anti-patterns this architecture deliberately avoids:

- **External database:** Would break the single-file constraint. The HTML file would no longer be self-contained.
- **LESS/Sass-style template pipeline:** Would require a build step. The game is no longer giveable as a source file.
- **JSON sidecar files:** Splits the truth. The browser game and the API would need synchronization logic. Two sources of truth means two sources of bugs.
- **Direct text editor edits during an active server session:** Creates a write race. The developer edits the file; the server's in-memory state is now stale; `POST /api/save` would overwrite the editor changes.

The single-file HTML is the discipline. The WBAPI is the tooling that lets a developer maintain that discipline without handwriting JSON into a 300 KB `<script>` block.

---

## VIII. The Wizard Tab

The `worldbuilder.html` ✦ Wizard tab is the GUI expression of the API-first workflow documented in `plan.md §I`:

1. **Vignette** — write the story in plain English; the wizard extracts suggested IDs
2. **Token** — name the mission-bit inventory item the player will carry
3. **Location** — look up an existing node code or define a new node
4. **Monster** — look up an existing monster key or define a new monster
5. **Quest Arc** — write BEFORE / FAIL / PASS narrative text; set `retryable` flag
6. **Review & Create** — see the generated JS literals and curl commands; fire API calls in sequence

The wizard does not introduce any capability that the curl endpoints do not already have. It is a front-end wrapper that enforces the correct creation order (terrain → node → monster → quest → save) and surfaces the JSON payloads alongside the narrative context. The "curl commands" panel in the Review step shows exactly what the wizard will POST — a developer can copy those commands and use them directly without the GUI.

---

## IX. Conclusion

The evolution from `grep` to WBAPI is a story about matching the tool to the constraint. Each phase failed not because it was a bad tool, but because it was the wrong tool for the specific combination of constraints: JavaScript object literal syntax, DOM-dependent initialization code, the single-file requirement, and the need for safe in-place writes.

The final architecture is unusual: a REST API that treats an HTML file as its database, reads it by parsing a `<script>` tag, and writes to it by string-splicing at anchor markers. But it is unusual in the same way that the single-file HTML constraint is unusual — it is the right answer for this specific problem.

The NONCE system enforces the discipline that the single-writer model requires. The anchor markers make the HTML parseable without a full JavaScript engine. The help system makes the API self-documenting. And `POST /api/save` + `POST /api/restart` is the commit/reset cycle that keeps the in-memory state synchronized with the file that is the source of truth.

The game is always in a state where it can be opened in a browser and played. The API exists to help a developer maintain that state safely. Those two sentences describe the entire design.

---

**Filed:** 2026-05-29  
**Cross-references:** `plan.md §I` (Directive / API-First Policy) · `plan.md §WBAPI-01` · `wbapi-server.js` · `wbapi-core.js` · `wbapi-toggle.sh` · `worldbuilder.html` · `lab-report-meta-process-loop-expansion.md`

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
