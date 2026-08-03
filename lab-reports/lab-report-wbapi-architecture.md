<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# WBAPI Architecture Report
## Roll2Hit World Builder API — Internal Design, Buffer Model, and Single-File Source of Truth

**Author:** paul@roll2hit.com  
**System:** `wbapi-server.js` + `wbapi-core.js`  
**Game file:** `roll2hit-v3.html` (1,794,283 bytes)  
**Server:** Node.js HTTP, port 1367  
**Date:** 2026-05-30  
**Classification:** Internal Engineering Reference

---

## Abstract

This report describes the complete architecture of the WBAPI (World Builder API) system for the Roll2Hit D&D 5e single-file game engine. The system provides a local REST API that reads and writes game data embedded as JavaScript literals inside a single HTML file. No database, no ORM, no build step. The HTML file is simultaneously the game runtime, the data store, and the source of truth. This report covers: the parsing pipeline from raw HTML to live in-memory objects; the internal buffer model and when mutations reach disk; the request-to-persistence lifecycle; the write-back serialization strategy; the nonce/lock system; and the intended use case for each design decision. Function call traces are provided for representative operations.

---

## 1. System Overview

### 1.1 The Single-File Constraint

`roll2hit-v3.html` is a complete D&D 5e combat assistant that runs entirely in a browser. It contains:

- ~1.75 MB of HTML, CSS, and JavaScript
- All game data embedded as JavaScript object literals inside `<script>` tags
- No external data files, no server required for the game itself
- 144 map nodes, 213 quests, 392 monsters, 107 terrains, 25 fish, 8 lake-magic items

The constraint is intentional: one file, zero dependencies, drag-and-drop into any browser. This is the deployment model.

The WBAPI does not change this. It is a **development-time tool only** — a local REST server that lets a developer (or AI agent) read and write the embedded game data programmatically, without hand-editing 1.75 MB of JavaScript.

### 1.2 Component Map

```
┌──────────────────────────────────────────────────────────────────┐
│                         Developer / AI Agent                     │
│                    curl / worldbuilder.html UI                   │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTP/1.1 on localhost:1367
┌─────────────────────────────▼────────────────────────────────────┐
│                      wbapi-server.js                             │
│   Node.js http.createServer — single process, event-loop serial  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Request Router — path/method dispatch, CORS, logging    │    │
│  └────────────────────┬─────────────────────────────────────┘    │
│                       │ delegates to                             │
│  ┌────────────────────▼─────────────────────────────────────┐    │
│  │               wbapi-core.js  (WBAPI singleton)           │    │
│  │                                                          │    │
│  │  _rawSrc: string      ← the entire HTML, in RAM         │    │
│  │  nodeMap: {}          ← parsed NODE_MAP                 │    │
│  │  questDb: {}          ← parsed QUEST_DB                 │    │
│  │  monsterPool: {}      ← parsed MONSTER_POOL             │    │
│  │  worldDb: {}          ← parsed WORLD_DB                 │    │
│  │  birkaNpcs: {}        ← parsed BIRKA_NPC_PROFILES       │    │
│  │  fishPool: []         ← parsed FISH_POOL                │    │
│  │  nightFishPool: []    ← parsed NIGHT_FISH_POOL          │    │
│  │  lakeMagicDb: {}      ← parsed LAKE_MAGIC_DB            │    │
│  │  + five index maps    ← built from above                │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────┬────────────────────────────────────┘
                              │ fs.readFileSync / fs.writeFileSync
┌─────────────────────────────▼────────────────────────────────────┐
│                      roll2hit-v3.html                            │
│              The single file. Source of truth.                   │
│              Also: roll2hit-v3-YYYYMMDD-HHMMSS.html  (backups)  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. The Parsing Pipeline — HTML to Live Objects

### 2.1 Anchor Markers

Game data sections inside `roll2hit-v3.html` are delimited by comment anchors embedded in the `<script>` tag:

```javascript
// ◆◆◆ WORLDBUILDER:QUEST_DB:START ◆◆◆
const QUEST_DB = {
  quest_wis_01: { type: 'story', title: 'The Hermit', activateNode: 'WS', ... },
  quest_1367_a_najera: { type: 'combat', title: 'The Free Company', ... },
  // ...
};
// ◆◆◆ WORLDBUILDER:QUEST_DB:END ◆◆◆
```

The markers use the Unicode diamond character `◆` to prevent accidental collision with any game content string. There are nine such sections: `MONSTER_POOL`, `MONSTER_DROPS`, `WORLD_DB`, `NODE_MAP`, `NODE_COORDS`, `BIRKA_NPC`, `FISH_DB`, `LAKE_MAGIC`, `QUEST_DB`.

### 2.2 `extrSection(src, name)` — Section Extraction

**Signature:** `extrSection(src: string, name: string): string | null`

**Trace:**
```
extrSection("...html...", "QUEST_DB")
  → S = "// ◆◆◆ WORLDBUILDER:QUEST_DB:START ◆◆◆"
  → E = "// ◆◆◆ WORLDBUILDER:QUEST_DB:END ◆◆◆"
  → a = src.indexOf(S)          // character offset of start marker
  → b = src.indexOf(E)          // character offset of end marker
  → return src.slice(a + S.length, b).trim()
  // Result: the raw JS text between the markers, no markers included
```

This is pure string slicing — no regex, no DOM. It runs on raw UTF-8 bytes. O(n) in file size, executed once per section per load.

### 2.3 `extractObj(block, name)` — Brace-Counting Parser

**Signature:** `extractObj(block: string, name: string): string | null`

The extracted section text still contains a JavaScript variable declaration (`const QUEST_DB = { ... }`). `extractObj` locates the opening brace of the object literal and walks character-by-character using a depth counter to find the matching closing brace. This is the critical parser.

**Why not JSON.parse or regex?** The object literals are JavaScript, not JSON. They contain:
- Unquoted keys (`quest_wis_01:` not `"quest_wis_01":`)
- Template literals with embedded expressions
- Arrow functions and full function bodies (`onActivate: (S) => { ... }`)
- Single-line and multi-line comments
- Trailing commas

None of these are valid JSON. A regex cannot reliably match nested braces. The solution is a hand-written character-state machine.

**State machine internals:**

```
States:
  inStr = null           — normal code
  inStr = '"'            — inside double-quoted string
  inStr = "'"            — inside single-quoted string
  inStr = '`'            — inside template literal
  (implicit)             — inside // comment (skip to \n)
  (implicit)             — inside /* */ comment (skip to */)

Transitions:
  null + '"' | "'" | '`'  → enter string (inStr = c)
  string + '\\'           → skip next char (escape)
  string + same-quote     → exit string (inStr = null)
  null + '//'             → skip to newline
  null + '/*'             → skip to '*/'
  null + '{'              → depth++
  null + '}'              → depth--; if depth===0 → return slice
```

**Result:** a string containing exactly `{ key: value, key: value, ... }` — the raw JavaScript object literal text, function bodies and all.

### 2.4 `removeFns(src)` — Function Body Erasure

**Signature:** `removeFns(src: string): string`

Before evaluating sections that contain function bodies (QUEST_DB, BIRKA_NPC), the raw text passes through `removeFns`. This replaces every function value with `null`, preserving the object structure but removing executable code.

**Why:** Node.js evaluates the object literal using `new Function('return (' + obj + ')')()`. If function bodies are present, they may reference browser globals (`document`, `window`, `S_story`) that do not exist in Node.js. The game runs in a browser; the API runs in Node.js. The data fields are what matter — function bodies are game logic, not data.

**What gets replaced:**
```javascript
// Before removeFns:
quest_wis_01: {
  title: 'The Hermit',
  onActivate: (S) => { S_story.hermit_met = true; return true; },
  onComplete: function(S) { S.xp += 50; }
}

// After removeFns:
quest_wis_01: {
  title: 'The Hermit',
  onActivate: null,
  onComplete: null
}
```

The parser detects function values by scanning forward from `:` for the patterns `(args) =>` or `function`. It then brace-counts the function body using the same state machine as `extractObj` and replaces the entire body with `null`.

**Critical property:** `removeFns` is itself comment-aware and string-aware. If a string contains the text `"onActivate: () => {"`, it will not be treated as a function. This is necessary because quest `desc` fields often contain code-like prose.

### 2.5 Four Parse Strategies

Different sections use different parse strategies based on their content:

| Function | Used for | Strategy |
|---|---|---|
| `parseSimple(block, name)` | NODE_MAP, NODE_COORDS, MONSTER_POOL, MONSTER_DROPS, LAKE_MAGIC_DB | `extractObj` → `new Function('return (' + obj + ')')()` — raw eval, no sanitization |
| `parseArr(block, name)` | FISH_POOL, NIGHT_FISH_POOL | `extractArr` → `new Function('return ' + arr)()` — array literal eval |
| `parseWithP(block, name, P)` | WORLD_DB | `extractObj` → `new Function('P', 'return (' + obj + ')')(Pp)` — eval with Proxy argument |
| `parseSanitized(block, name)` | QUEST_DB, BIRKA_NPC_PROFILES | `extractObj` → `removeFns` → `new Function('return (' + cleaned + ')')()` |

`parseWithP` is used for WORLD_DB because terrain entries reference monster objects directly: `monsters: [P.goblin, P.skeleton]`. The `P` variable is a Proxy over the already-parsed `monsterPool` object — so terrain entries get live monster references during parse without requiring a second pass.

**Trace for WORLD_DB parse:**
```
parseWithP(worldDbSection, "WORLD_DB", monsterPoolProxy)
  → obj = extractObj(worldDbSection, "WORLD_DB")
     // Returns: "{ forest: { label: 'Forest', monsters: [P.goblin, ...] }, ... }"
  → Pp = new Proxy(monsterPool, { get: (t,k) => t[k] || {key: String(k)} })
     // Pp.goblin → monsterPool.goblin  (or synthetic stub if missing)
  → new Function('P', 'return (' + obj + ')')(Pp)
     // Evaluates the terrain object with P bound to the proxy
     // P.goblin resolves live to the goblin monster entry
  → returns worldDb: { forest: { label: 'Forest', monsters: [{name:'Goblin',...}] } }
```

### 2.6 Load Sequence

**`WBAPI.load(filePath)`** — called once at server startup, and once after every `POST /api/save`.

**Full call trace:**

```
WBAPI.load("roll2hit-v3.html")
  1. fs.readFileSync("roll2hit-v3.html", 'utf8')
     → src: string (1,794,283 chars)
     → this._rawSrc = src          ← THE BUFFER. Everything lives here.
     → this._srcPath = absolute path

  2. extrSection(src, 'MONSTER_POOL')  → raw monster section text
     parseSimple(...)                  → this.monsterPool = { goblin: {...}, ... }

  3. parseSimple(extrSection(src,'MONSTER_DROPS'), ...)
     → this.monsterDrops = { goblin: { gold: 2, ... }, ... }

  4. Pp = new Proxy(this.monsterPool, ...)   ← monster lookup proxy

  5. parseWithP(extrSection(src,'WORLD_DB'), 'WORLD_DB', Pp)
     → this.worldDb = { forest: { monsters: [P.goblin, ...] }, ... }

  6. parseSimple(extrSection(src,'NODE_MAP'), 'NODE_MAP')
     → this.nodeMap = { CY: { name: 'Neon Undercity', act: 1, ... }, ... }

  7. parseSimple(extrSection(src,'NODE_COORDS'), 'NODE_COORDS')
     → this.nodeCoords = { CY: { x: 42, y: 17 }, ... }

  8. parseSanitized(extrSection(src,'BIRKA_NPC'), 'BIRKA_NPC_PROFILES')
     → this.birkaNpcs = { yael: { name: 'Yael', node: 'BK', ... }, ... }

  9. fishSrc = extrSection(src,'FISH_DB')
     parseArr(fishSrc, 'FISH_POOL')      → this.fishPool = [{...}, ...]
     parseArr(fishSrc, 'NIGHT_FISH_POOL') → this.nightFishPool = [{...}, ...]

 10. parseSimple(extrSection(src,'LAKE_MAGIC'), 'LAKE_MAGIC_DB')
     → this.lakeMagicDb = { dream_lure: {...}, ... }

 11. qSrc = extrSection(src, 'QUEST_DB')
     this._rawQuestSrc = qSrc           ← preserved for flag analysis
     parseSanitized(qSrc, 'QUEST_DB')   → this.questDb = { quest_wis_01: {...}, ... }

 12. this._buildIndexes()
     → this._terrainToMonsters: { forest: ['goblin','wolf',...], ... }
     → this._monsterToTerrains: { goblin: ['forest','cave',...], ... }
     → this._questsByNode:      { CY: ['quest_wis_01',...], ... }
     → this._questFlags:        { quest_wis_01: { reads: Set, writes: Set }, ... }
     → this._flagToQuests:      { hermit_met: { reads:[], writes:['quest_wis_01'] }, ... }
     → this._questArcs:         { quest_wis: ['quest_wis_01','quest_wis_02'], ... }

 13. this.loaded = true
```

Total wall time: typically 80–200ms for a 1.75 MB file on a modern M-series Mac.

---

## 3. The Internal Buffer Model

### 3.1 `_rawSrc` — The Primary Buffer

The most important internal field is `_rawSrc: string`. It is the **entire HTML file held in RAM as a JavaScript string**. It is set once on load and mutated surgically on every write operation.

`_rawSrc` is the source of truth for write-back. When `POST /api/save` is called, `_rawSrc` is written verbatim to disk. If `_rawSrc` is correct, the file is correct. If it diverges from the parsed object state, the save will produce an incorrect file.

**The invariant the system maintains:** After any write mutation, both `_rawSrc` AND the relevant parsed object (e.g., `questDb`) must be updated atomically. A mutation that updates only the object but not `_rawSrc` will be lost on save.

### 3.2 Two Mutation Paths

**Path A — In-place string patch (field edits):**

Used for `PUT /api/{quest|node|npc|monster}/{id}` — editing a single field on an existing entity.

```
editField('quest', 'quest_wis_01', 'title', 'The New Title')
  1. extrSection(this._rawSrc, 'QUEST_DB') → sectionText
  2. patchStringField(sectionText, 'quest_wis_01', 'title', 'The New Title')
     → regex: /quest_wis_01[\s\S]*?\btitle\s*:\s*(["`'])(.*?)\1/
     → replaces: title: "The Hermit"  →  title: "The New Title"
     → returns: patched sectionText
  3. respliceSection(this._rawSrc, 'QUEST_DB', patched)
     → finds START/END markers in _rawSrc
     → returns: _rawSrc with the QUEST_DB section replaced in-place
     → this._rawSrc = result
  4. this.questDb['quest_wis_01'].title = 'The New Title'
     → both buffer and object updated
```

**Why in-place patch?** Full re-serialization of the QUEST_DB object would destroy all function bodies (since they were nulled during parse). The in-place patch touches only the one field that changed, leaving all function bodies intact in `_rawSrc`.

**Path B — Full section re-serialization (add/delete):**

Used for `POST /api/quest`, `DELETE /api/quest/{id}`, etc. — structural changes to the collection.

```
POST /api/quest (adding quest_1367_a_najera)
  1. Append to this.questDb: this.questDb['quest_1367_a_najera'] = { type:'combat', ... }
  2. Serialize entire questDb to JS object literal string:
     newContent = "const QUEST_DB = {\n" + entries.map(serialize).join(',\n') + "\n};"
  3. respliceSection(this._rawSrc, 'QUEST_DB', newContent)
     → this._rawSrc updated with new QUEST_DB section
```

New quests added via the API have no function bodies (they are data-only at creation time), so re-serialization is safe. If a quest has a function body it was patched in manually — in that case, PUT field edits use Path A to preserve it.

### 3.3 Index State

Five in-memory indexes are derived from the parsed data:

| Index | Type | Derived from |
|---|---|---|
| `_terrainToMonsters` | `{ terrainKey: [monsterKey] }` | worldDb.monsters arrays |
| `_monsterToTerrains` | `{ monsterKey: [terrainKey] }` | worldDb.monsters arrays |
| `_questsByNode` | `{ nodeCode: [questId] }` | questDb.activateNode, .waypointNode |
| `_questFlags` | `{ questId: { reads: Set, writes: Set } }` | `_rawQuestSrc` regex scan |
| `_questArcs` | `{ arcPrefix: [questId] }` | questId naming convention |

`_questFlags` is built by scanning `_rawQuestSrc` — the raw text of the QUEST_DB section, before function removal. It uses regex to find all reads and writes to `S_story.*` flags inside function bodies. This is the dependency graph for quest chain analysis.

`_buildIndexes()` is called after every structural mutation (add/delete), not after field edits.

---

## 4. The Request-to-Persistence Lifecycle

### 4.1 Do We Wait the Full Round Trip?

**No.** Mutations are applied to in-memory state (`questDb`, `nodeMap`, `_rawSrc`) immediately and synchronously within the request handler. The HTTP response is sent as soon as the in-memory mutation succeeds. The file is **not touched** until `POST /api/save` is called explicitly.

This is the intentional design. It separates concern:

```
POST /api/quest   →  mutation applied to RAM   →  200 response
                     (disk unchanged)

POST /api/save    →  _rawSrc written to timestamped backup
                  →  backup copied to roll2hit-v3.html
                  →  server exits with code 67
                  →  toggle script relaunches
                  →  WBAPI.load("roll2hit-v3.html") on startup
                  →  fresh parse from disk
```

**Implication:** Unsaved mutations exist only in RAM. If the server is killed between a mutation and a save, those mutations are lost. This is a feature, not a bug — it provides a discard mechanism. If you make bad mutations, kill the server without saving.

### 4.2 The Save-Restart Cycle

> **Annotation (§DX-02k, 2026-08-03) — historical, do not follow verbatim.** Two things drifted from this trace. (1) The exit-67 relaunch is gone: writes hot-reload in place (`saveAndRestart`/`saveAndVerify`). (2) `WBAPI.save()` **no longer takes no argument** — the `getStampedName()` fallback resolved a bare filename against the process CWD, so *every* write left a ~5.4 MB dated file there. `POST /api/save` still stamps, via `WBAPI.saveStamped()` (beside the source file); the per-write path is `saveGameFile()` — temp + atomic rename, nothing left behind. The step-2 note below that copy-then-rename "is atomic on most filesystems" was the right instinct applied to the wrong step; it is now the actual mechanism.

`POST /api/save` performs the following sequence:

```
1. WBAPI.save()
   → getStampedName() → "roll2hit-v3-20260530-004556.html"
   → fs.writeFileSync(stampedPath, this._rawSrc, 'utf8')
   → return { ok: true, path: stampedPath }

2. fs.copyFileSync(stampedPath, GAME_FILE)
   → GAME_FILE = "/path/to/roll2hit-v3.html"
   → atomic on most filesystems (copy-then-rename at OS level)

3. res.writeHead(200); res.end(JSON.stringify({...}))
   → response sent to client

4. setTimeout(() => process.exit(67), 120)
   → 120ms delay allows TCP write buffer to flush
   → process exits with code 67

5. wbapi-toggle.sh restart loop catches exit code 67
   → echo "[wbapi-toggle] ↺  Server requested restart — relaunching…"
   → sleep 0.3
   → node wbapi-server.js  (new process)

6. New process startup:
   → WBAPI.load(GAME_FILE)
   → Reads the freshly written roll2hit-v3.html
   → Full parse pipeline (see Section 2.6)
   → Server ready in ~200ms
```

**Why exit 67 instead of in-process reload?**

In-process reload (`WBAPI.load()` on the running process) leaves stale references from the old parse in any closures that captured them. It also does not reset the nonce registry, the request router, or any module-level state. Exit 67 gives a clean slate — Node.js's module cache is cleared, all globals are reset, and the new process reads exactly what is on disk.

### 4.3 Concurrency Model

Node.js is single-threaded. The event loop processes one request at a time. There is no possibility of two handlers running concurrently in the same process. This means:

- No mutex needed around `_rawSrc` mutations
- No race condition between read and write handlers
- Two simultaneous curl commands queue in the OS TCP stack and are processed sequentially

The nonce system is therefore **not a concurrency lock**. It is an *intent gate* — a two-step protocol that forces the caller to explicitly declare their intent before a destructive operation (DELETE) proceeds. The nonce TTL (5 minutes) is a timeout on declared intent, not a lock timeout.

---

## 5. The Node.js Program — No DOM Required

### 5.1 The Browser-Node Boundary

`roll2hit-v3.html` is designed to run in a browser. It references:
- `document`, `window`, `localStorage` — browser DOM
- `S_story`, `S_player`, `S_world` — global game state objects
- Arrow functions and closures that capture these globals
- `fetch()`, `AudioContext`, `Canvas` — browser APIs

None of these exist in Node.js. The WBAPI runs in Node.js and never loads the HTML into a browser context. It does not use `jsdom`, `puppeteer`, or any headless browser.

**How this is possible:** The game data — nodes, quests, monsters, terrains — is pure data. Object literals with string fields, number fields, and function bodies. The function bodies reference browser globals, but the WBAPI only needs the data fields. `removeFns` strips the function bodies before evaluation. The remaining object literal contains only pure data values that are valid JavaScript in any runtime.

**What the WBAPI actually evaluates:**

```javascript
// What's in the file (simplified):
const QUEST_DB = {
  quest_wis_01: {
    title: 'The Hermit',
    type: 'story',
    activateNode: 'WS',
    onActivate: (S) => { S_story.hermit_met = true; },  // browser fn
  }
}

// What removeFns produces:
const QUEST_DB = {
  quest_wis_01: {
    title: 'The Hermit',
    type: 'story',
    activateNode: 'WS',
    onActivate: null,   // stripped
  }
}

// What new Function evaluates:
{ quest_wis_01: { title: 'The Hermit', type: 'story', activateNode: 'WS', onActivate: null } }
// Pure data. No browser globals touched.
```

### 5.2 `new Function(...)` as a Safe Evaluator

The parser uses `new Function('return (' + obj + ')')()` rather than `eval(obj)`. The distinction:

- `eval()` runs in the caller's scope — it can access all local variables
- `new Function()` runs in the global scope — it cannot access local variables

This means the parsed object literal can only access Node.js globals (`Math`, `JSON`, `Array`, `Object`, etc.). It cannot accidentally capture a parser-local variable. This is the safer choice for evaluating untrusted-ish content.

**The one exception:** `parseWithP` passes `P` as an argument: `new Function('P', 'return (' + obj + ')')(Pp)`. This explicitly injects the monster proxy into the evaluation scope so terrain entries can reference `P.goblin`. The injection is deliberate and the only external binding.

### 5.3 Function Call Stack for a Typical GET Request

**`GET /api/quest/quest_1367_a_najera`**

```
http.createServer callback
  → request handler (async function)
  → cors(res)                           // set CORS headers
  → url.pathname → "/api/quest/quest_1367_a_najera"
  → parts = ['quest', 'quest_1367_a_najera']
  → parts[0] === 'quest' && parts[1]    // route match
  → WBAPI.questDb['quest_1367_a_najera'] // O(1) hash lookup
  → nodeConnections(id)
       WBAPI.quests.chain(id)
         WBAPI._questFlags[id]          // pre-built index
         → upstream: [...], downstream: [...]
       WBAPI.nodeMap[q.activateNode]    // O(1) hash lookup
  → logRow(...) × 4                    // structured log
  → logResponse(...)                   // log + terminal print
  → json(res, 200, { entity, connections, _meta })
       JSON.stringify(body)
       logBody('out', body)             // file log (+ console if VERBOSE)
       res.writeHead(200, headers)
       res.end(jsonString)
```

No disk access. No parsing. Pure in-memory lookups against pre-built indexes. Response time: 0–2ms.

### 5.4 Function Call Stack for a Mutation + Save

**`POST /api/quest` followed by `POST /api/save`**

```
── POST /api/quest ──────────────────────────────────────────────────
readBody(req)
  → Promise: buffer chunks → concat → JSON.parse → logBody('in', ...)
  → body = { id:'quest_1367_c_ottoman', type:'skill_check', title:'...', ... }

WBAPI.questDb[body.id] = { ...body }    // in-memory add

serialize questDb to string
  → Object.entries(WBAPI.questDb).map(([id, q]) => `  ${id}: ${JSON.stringify(q, null, 4)}`)
  → newSection = "const QUEST_DB = {\n" + entries + "\n};"

respliceSection(this._rawSrc, 'QUEST_DB', newSection)
  → finds START marker at offset X
  → finds END marker at offset Y
  → returns: _rawSrc.slice(0,X+S.length) + '\n' + newSection + '\n' + _rawSrc.slice(Y)
  → this._rawSrc = result     ← buffer updated

WBAPI._buildIndexes()          ← indexes rebuilt from new state

json(res, 201, { ok:true, id, ... })   ← response sent

── POST /api/save ───────────────────────────────────────────────────
WBAPI.save()
  → getStampedName()  → "roll2hit-v3-20260530-004556.html"
  → fs.writeFileSync(stampedPath, this._rawSrc, 'utf8')
       ← _rawSrc (the buffer) written to disk verbatim
  → { ok:true, path: stampedPath }

fs.copyFileSync(stampedPath, GAME_FILE)
  → GAME_FILE overwritten with identical content

res.writeHead(200); res.end(JSON.stringify({...}))
  → { ok:true, backup:'...', primary:'roll2hit-v3.html', note:'restarting' }

setTimeout(() => process.exit(67), 120)

── wbapi-toggle.sh restart loop ─────────────────────────────────────
catches exit code 67
→ sleep 0.3
→ node wbapi-server.js

── New process: WBAPI.load("roll2hit-v3.html") ──────────────────────
fs.readFileSync("roll2hit-v3.html")
  → full parse pipeline (Section 2.6)
  → questDb now includes quest_1367_c_ottoman
  → this.loaded = true
```

---

## 6. Write-Back Integrity

### 6.1 The Patcher's Contract

`patchStringField` operates on the raw text of a section (not the full file). It uses a single regex to find and replace a field value:

```javascript
const re = new RegExp(
  `(${entryKey}\\s*:[\\s\\S]*?\\b${field}\\s*:\\s*)(["\`'])(.*?)\\2`,
  'm'
);
```

This works reliably for string fields. It does **not** work for number, boolean, or object-valued fields — those require Path B (full section re-serialization). The current API uses Path A only for string fields on existing entities, and Path B for all structural changes (add/delete/reorder).

### 6.2 What Is Verified

The system does not perform a round-trip parse of the backup before promoting it. Verification is implicit:

- `_rawSrc` is the authoritative buffer. If all mutations correctly updated both `_rawSrc` and the object collections, the buffer is correct.
- The `POST /api/save` flow writes `_rawSrc` to the timestamped backup and then to the primary file.
- The server restart re-parses from disk. If the save produced an unparseable file, the server will fail to start — the terminal shows a parse error, and the developer has the timestamped backup to roll back to.

This is defense-in-depth through restart rather than pre-validation. It is simpler and more reliable than a child-process validation step, because the real test is whether the live server can load the file.

### 6.3 Backup Strategy

Every `POST /api/save` produces a timestamped backup at `roll2hit-v3-YYYYMMDD-HHMMSS.html`. These are identical to the primary file at the moment of save. They accumulate in the working directory and are not automatically pruned. They serve as a manual rollback mechanism: if a bad save corrupts the primary file, copy the most recent valid backup over it and restart.

---

## 7. Intended Use Cases

### 7.1 Primary: AI-Assisted World Building

The WBAPI was designed for AI agent use. Use `./api.sh` (the HTTP wrapper) for all agent and day-to-day work — it handles nonces, retry, and queuing automatically. An AI agent (such as Claude Code) can:

```bash
# Discover what exists
./api.sh list node
./api.sh audit

# Read an entity + its connections
./api.sh get quest quest_wis_01
./api.sh location CY                    # composite: node + terrain + NPCs + quests

# NPC investigation — who has quests, who doesn't
./api.sh list npc --node CY             # NPCs at a specific node
./api.sh audit | jq '.warnings[] | select(.field=="quests")'  # NPCs with no quests

# Monster investigation
./api.sh list monster --terrain dungeon
./api.sh get monster goblin

# Create an entity (NPC field required on quests)
./api.sh post quest id=quest_1367_a_najera type=combat npc=aldric \
  title="The Free Company" activateNode=NAJ

# Update fields
./api.sh put quest quest_1367_a_najera passText="The company disperses."

# Chain and audit before save
./api.sh chain quest_1367_a_najera
./api.sh audit
```

This eliminates the need for the AI to hand-edit 1.75 MB of JavaScript — a task prone to bracket errors, Unicode corruption, and accidental function body deletion.

### 7.2 Secondary: worldbuilder.html UI

The `worldbuilder.html` file provides a browser-based UI for the same API. It uses the same REST endpoints, renders the data in a split-panel layout, and provides forms for creating/editing entities. It reads `GET /api/source` to load the game file and `POST /api/save` to persist. It is a frontend to the same backend, not a separate system.

### 7.3 Tertiary: Export Pipeline

`GET /api/export/{collection}?format=json|js|module` allows export of individual data sections as standalone files. This supports:
- Importing into other tools
- Version-controlling data separately from game logic
- Seeding a test environment with live data

---

## 8. Live System State at Time of Report

```
Server:    http://localhost:1367/api
Process:   Node.js (single instance, event loop)
File:      roll2hit-v3.html (1,794,283 bytes)
Nodes:     144
Quests:    213  (211 original + 2 added this session: A, B)
Monsters:  392
Fish:      25
LakeMagic: 8
Audit:     11 errors, 35 warnings (integrity check, not parse errors)
```

The 11 audit errors are data integrity warnings (e.g., quests referencing node codes that do not exist in NODE_MAP), not parser failures. The server loads and runs correctly regardless of audit errors.

---

## 9. Summary of Design Principles

| Principle | Implementation |
|---|---|
| Single source of truth | `_rawSrc` is the file in RAM. Everything is derived from it or will be written back to it. |
| No DOM required | `removeFns` strips browser-dependent function bodies before `new Function()` evaluation. |
| Write-on-save only | Mutations are RAM-only until explicit `POST /api/save`. Disk is not touched per-request. |
| Restart as reload | Exit 67 + restart loop is the reload mechanism. Clean process = clean module cache = clean state. |
| In-place patch for edits | Field edits use regex replacement on raw source text to preserve unrelated content (especially function bodies). |
| Re-serialization for structure | Add/delete operations re-serialize the affected section entirely, which is safe because new entities have no function bodies. |
| No concurrent writers | Single Node.js process serializes all requests via the event loop. No mutex needed. |
| Nonce as intent gate | Nonce is not a concurrency lock. It forces a two-step protocol on destructive operations. |
| Backup accumulation | Every save produces a timestamped backup. Rollback is manual: copy backup, restart. |

---

**Filed:** 2026-05-30  
**Cross-references:** `lab-report-wbapi-evolution.md` · `wbapi-core.js` · `wbapi-server.js` · `plan.md §ARCH-01`  
**Port 1367:** Matches canonical game year.

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
