<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report — World Builder API (WBAPI)
**Date:** 2026-05-29  
**Source of truth:** `roll2hit-v3.html` (1.7 MB, ~11,530 lines)

---

## What Was Built

Three artifacts that form a complete read/write data layer over the game file:

| File | Role |
|---|---|
| `worldbuilder.html` | Browser UI — Map, Bestiary, NPCs, Quests, Dice Lab, **API tab** |
| `wbapi-core.js` | Node.js module — full parse + CRUD + save/export/sync |
| `api.sh` / `api/wb.js` | **Primary CLI** — queued HTTP wrapper, auto-nonce, retry, `--ai` Claude assist |
| `wbapi-cli.js` | Low-level CLI — direct in-process WBAPI (use `api.sh` for day-to-day work) |
| `wbapi-help.md` | Field reference + command cheatsheet |

---

## How the Game File Is Structured

`roll2hit-v3.html` is a single-file game. All game data lives inside `<script>` tags as JavaScript object literals. WBAPI reads it as **text** — never executes the whole file.

**14 anchor comments** were added to mark 7 data sections:

```
◆◆◆ WORLDBUILDER:{SECTION}:START ◆◆◆
◆◆◆ WORLDBUILDER:{SECTION}:END ◆◆◆
```

| Section | Lines | Contents |
|---|---|---|
| MONSTER_POOL | 4868–5700 (832 lines) | 392 monster entries |
| MONSTER_DROPS | 5303–5699 (396 lines) | loot tables (nested inside MONSTER_POOL) |
| WORLD_DB | 5708–5791 (83 lines) | 69 terrain types, each with a monster list |
| NODE_MAP | 7582–7883 (301 lines) | 144 world nodes |
| NODE_COORDS | 7888–7959 (71 lines) | canvas x/y for each node |
| QUEST_DB | 8483–10597 (2114 lines) | 210 quests |
| BIRKA_NPC | 11472–11530 (58 lines) | 6 named NPCs with full dialogue trees |

---

## Import: How Data Is Loaded

### Three parsers, one pipeline

Because the data sections contain different challenges (external references, function bodies), three specialised parsers are used:

```
raw HTML text
     │
     ▼
extrSection(src, 'SECTION_NAME')   ← slice between anchors
     │
     ▼
extractObj(block, varName)          ← comment-aware balanced-brace extractor
     │                                 (skips // and /* */ before counting braces)
     ▼
┌──────────────────────────────────────────────────────────┐
│  parseSimple      → new Function('return (' + obj + ')')  │  MONSTER_POOL, NODE_MAP, NODE_COORDS
│  parseWithP       → new Function('P', 'return (...')(Pp)  │  WORLD_DB  (uses P.monsterKey refs)
│  parseSanitized   → removeFns(obj) then eval             │  QUEST_DB, BIRKA_NPC  (strips fn bodies)
└──────────────────────────────────────────────────────────┘
     │
     ▼
_buildIndexes()   ← wires up 4 lookup maps
```

**Why `extractObj` needs comment awareness:**  
`NODE_COORDS` contains `/* Paul's Journeys */` — the apostrophe was being read as a JS string delimiter, throwing off the brace counter. The fix: skip `//` and `/* */` blocks before testing for string quotes or braces.

**Why WORLD_DB needs a P proxy:**  
Entries reference monster keys as `P.commoner`, `P.goblin`, etc. where `P = MONSTER_POOL`. In an isolated `new Function()` scope `P` is undefined — a `Proxy` stub is passed in that returns `{key:'k'}` for any unknown key.

**Why QUEST_DB needs `removeFns`:**  
Quests embed JavaScript closures (`activateCond: (S) => S_story.flag`, `completeFn: (S) => { S.gold += 100 }`). These can't be eval'd safely in the worldbuilder context. `removeFns` is a character-by-character scanner that replaces `: (args) => expr` and `: function() { block }` values with `: null`, preserving all other fields.

### Import methods

**Browser (worldbuilder.html):**
```javascript
// User selects file via <input type="file">
const reader = new FileReader();
reader.onload = e => WBAPI.load(e.target.result);  // passes raw text
reader.readAsText(file);
```

**Node.js (wbapi-core.js):**
```javascript
const WBAPI = require('./wbapi-core');
WBAPI.load('./roll2hit-v3.html');   // path → fs.readFileSync internally
```

**CLI (primary — via WBAPI HTTP server):**
```bash
./api.sh list node          # list all nodes via HTTP API
./api.sh ping               # confirm server is running
```

**CLI (low-level — direct in-process, no server required):**
```bash
# ROLL2HIT_FILE env var sets the source (default: ./roll2hit-v3.html)
node wbapi-cli.js list node
```

---

## The Live Dataset (from `roll2hit-v3.html`)

| Entity | Count |
|---|---|
| World nodes | 144 |
| Quests | 210 |
| Monsters | 392 |
| Named NPCs (BIRKA) | 6 |
| Terrain types | 69 |
| Quest arcs | 108 |
| Terrain ↔ monster links | 711 |
| Quest flag dependency links | 141 |

**Monster distribution by tier:**

| Tier | Count |
|---|---|
| trivial | 30 |
| easy | 56 |
| medium | 148 |
| hard | 123 |
| deadly | 33 |

**Quest distribution by type:**

| Type | Count |
|---|---|
| side | 104 |
| skill_check | 59 |
| epic | 40 |
| main | 7 |

**Largest quest arcs:**

| Arc | Quests |
|---|---|
| quest (misc) | 24 |
| quest_wis | 8 |
| mq | 7 |
| quest_alch | 7 |
| quest_whisper | 6 |

---

## Query API

All reads are non-destructive. No write to disk occurs until `save()` is called.

### GET — single entity

```javascript
WBAPI.nodes.get('CY')           // by node code
WBAPI.nodes.get('Neon Undercity')  // by label (display name)
WBAPI.quests.get('quest_antecedent_01')
WBAPI.quests.get('The Question')   // by title
WBAPI.monsters.get('commoner')
WBAPI.npcs.get('yael')
```

`_findKey` searches: `key` → `label` → `name` → `title` (in that order).

### location.get — composite view

```javascript
WBAPI.location.get('CI')
// returns:
{
  node:     { label: "City Streets — Birka", act: 1, ... },
  terrainKey: "city",
  terrain:  { monsters: [...], ... },
  monsters: [ /* 28 entries */ ],    // via _terrainToMonsters index
  quests:   [ /* 6 entries */ ],     // via _questsByNode index
  npcs:     [ /* 2 entries */ ]      // via birkaNpcs + inline node.npc
}
```

`node.name` is the terrain key. `node.label` is the display name. This caused a bug during testing (`node.terrain` was undefined) — fixed by using `node.name` for the WORLD_DB lookup.

### LIST — filtered collections

```javascript
WBAPI.quests.byNode('CY')            // 3 quests at Neon Undercity
WBAPI.quests.byType('skill_check')   // 59 quests
WBAPI.monsters.byTerrain('market_quarter')  // 16 monsters
WBAPI.npcs.byNode('CI')              // 2 NPCs at City Streets
WBAPI.nodes.byAct(1)
WBAPI.worlds.monsterList('market_quarter')  // ['commoner','npc_merchant',...]
```

### Quest chain tracing

```javascript
WBAPI.quests.chain('quest_governor_cyprus')
// { upstream: [23 quests], downstream: [32 quests] }
```

The chain is built from `_flagToQuests` — a map of `S_story.flagName → { reads:[questIds], writes:[questIds] }` extracted by regex from the raw QUEST_DB source text (not the sanitized eval'd version).

`quest_governor_cyprus` is the largest hub: 23 quests must complete before it activates, and it unlocks 32 downstream quests.

---

## Patch API

All mutations update in-memory data AND patch `_rawSrc` (the loaded HTML text) using targeted find-and-replace. Function bodies in QUEST_DB are preserved because the patch operates on the raw source, not the sanitized eval'd object.

### editField — targeted string replacement

```javascript
WBAPI.editField('quest', 'quest_wis_01', 'passText', 'You recalled the text.')
WBAPI.editField('monster', 'commoner', 'name', 'Rabid Monkey')
```

`patchStringField(sectionSrc, entryKey, field, newValue)` uses:
```
(entryKey[\s\S]*?\bfield\s*:\s*)(["'`])(.*?)\2
```
Finds the field by key context + field name, replaces the quoted string value in-place.

### PUT — merge object fields

```javascript
WBAPI.quests.put('quest_wis_01', { passText: 'New text', gold: 75 })
WBAPI.nodes.put('CY', { name: 'cyberpunk_streets_v2' })
```

Merges into in-memory data. Recorded in `DIFF` for patch export. Does not patch `_rawSrc` (use `editField` for source-level changes, `put` for in-memory-only).

### monsters.rename — global display name change

```javascript
WBAPI.monsters.rename('commoner', 'Rabid Monkey')
// { ok:true, key:'commoner', from:'Commoner', to:'Rabid Monkey', terrains:[20 terrains] }

WBAPI.monsters.rename('npc_merchant', 'Badger')
// { ok:true, key:'npc_merchant', from:'NPC Merchant', to:'Badger', terrains:['market_quarter','desert_caravan'] }
```

Wraps `editField` — patches the `name:` field of the monster's MONSTER_POOL entry in `_rawSrc` directly.  
`key` is unchanged (`commoner` stays `commoner` internally). All 20 terrain references continue to work — only the display name seen by the player changes.

### monsters.fork + worlds.swapMonster — terrain-specific variant

For when you want a renamed/restatted version in one terrain only, without affecting other terrains:

```javascript
// Create rabid_monkey as a copy of commoner with different name
WBAPI.monsters.fork('commoner', 'rabid_monkey', { name: 'Rabid Monkey' })

// Replace commoner with rabid_monkey only in market_quarter
WBAPI.worlds.swapMonster('market_quarter', 'commoner', 'rabid_monkey')
```

### DELETE with cascade protection

```javascript
WBAPI.nodes.delete('CY')
// { ok:false, blockedBy: { quests:['quest_antecedent_01',...], npcs:['crov','auros','_inline_CY'] } }

WBAPI.quests.delete('quest_governor_cyprus')
// { ok:false, blockedBy: { downstream:[32 quest ids] } }
```

| Entity | Blocked by |
|---|---|
| node | any quest with `activateNode`/`waypointNode` = this node, or any NPC at this node |
| quest | any quest that reads a flag this quest writes |
| monster | any terrain whose monster list includes this key |
| npc | any quest that references this NPC key in raw source |

### MOVE — rename a node code

```javascript
// Renames CY → CY2, re-links all quest refs and NPC node refs automatically
WBAPI.nodes  // (via low-level CLI: node wbapi-cli.js move node CY CY2)
```

---

## Export

### Save — timestamped HTML

```javascript
WBAPI.save()
// writes: roll2hit-v3-YYYYMMDD-HHMMSS.html
// { ok:true, path:'/Users/.../roll2hit-v3-20260529-162839.html' }
```

The original file is **never modified**. Every `save()` call produces a new timestamped copy. This is by design — full audit trail, zero destructive writes.

**Important workflow note:** Each `load()` reads the original file fresh. If you chain multiple edits they must happen in one session before calling `save()`. Loading the timestamped output of a previous session correctly picks up prior changes:

```bash
# Wrong (each save is independent — renames don't accumulate):
./api.sh put monster commoner name="Rabid Monkey"
./api.sh put monster npc_merchant name="Badger"
# (auto-save fires after each PUT; prefer batching in a single session)

# Right (both edits in one session):
node -e "
  const W = require('./wbapi-core');
  W.load('./roll2hit-v3.html');
  W.monsters.rename('commoner', 'Rabid Monkey');
  W.monsters.rename('npc_merchant', 'Badger');
  console.log(W.save());
"
```

### Export — world/ folder structure

```bash
./api.sh export quest_db --out world/quests.json    # single collection via API
node wbapi-cli.js export ./world                     # full folder tree (low-level)
```

Writes the full game data as editable files:
```
world/
  CI/
    node.json
    npcs/
      yael/
        npc.json
        quests/
          quest_wis_01/
            meta.json
            title.txt
            hook.txt
            passText.txt
            failText.txt
monsters/
  commoner.json     ← { name:"Rabid Monkey", ac:10, hp:4, ... }
  npc_merchant.json ← { name:"Badger", ac:10, hp:9, ... }
```

### Sync — folder → game file

```bash
# Edit world/CI/npcs/yael/quests/quest_wis_01/passText.txt in any editor
node wbapi-cli.js sync ./world     # low-level folder sync
# → applies all .txt / .json changes, auto-saves timestamped HTML

# Or update a single field via API:
./api.sh put quest quest_wis_01 passText="$(cat ./edits/pass.txt)"
```

### JSON patch

```javascript
DIFF.json()
// Returns structured diff object:
{
  timestamp: "2026-05-29T...",
  NODE_MAP: { added:{}, modified:{}, deleted:[] },
  QUEST_DB: { added:{}, modified:{}, deleted:[] },
  MONSTER_POOL: { added:{}, modified:{ commoner:{name:'Rabid Monkey'} }, deleted:[] },
  BIRKA_NPC: { ... }
}
```

---

## CLI Quick Reference

**Primary: `./api.sh` (HTTP wrapper — use this for all day-to-day work)**
```bash
# Investigate
./api.sh ping                                      # server alive?
./api.sh location CI                               # composite node view
./api.sh get quest "quest_wis_01"                  # fetch quest + connections
./api.sh list quest --node CY                      # quests at node CY
./api.sh list npc --node CY                        # NPCs at node CY
./api.sh list monster --terrain market_quarter     # monsters by terrain
./api.sh chain quest_governor_cyprus               # quest dependency chain
./api.sh audit                                     # integrity scan (errors/warnings)

# Create / edit (NPC required on all quests)
./api.sh post quest id=quest_foo npc=yael type=side activateNode=CY title="Quest Title"
./api.sh put quest quest_wis_01 passText="You recalled the text."
./api.sh put monster commoner name="Rabid Monkey"
./api.sh del quest quest_old_01                    # nonce auto-handled

# Export
./api.sh export quest_db --out world/quests.json
./api.sh export monster_pool --format json --out world/monsters.json

# AI assist
./api.sh --ai "what NPCs have no quests?"
./api.sh --ai "show me the quest chain for the Froberger arc"
```

**Low-level: `node wbapi-cli.js` (direct in-process, no server required)**
```bash
node wbapi-cli.js get location CI
node wbapi-cli.js list quests --node CY
node wbapi-cli.js edit quest quest_wis_01 passText --file ./edits/pass.txt
node wbapi-cli.js move node CY CY2
node wbapi-cli.js export ./world
node wbapi-cli.js sync ./world
node wbapi-cli.js save
```

---

## Browser API Tab (worldbuilder.html)

The **⚙ API** tab exposes the same operations in the UI:

- **GET** — type + ID/name → prints full JSON result
- **PUT** — field + inline value or multi-line textarea (pre-fill with "Load current value →")
- **DELETE** — shows current entity, then shows blockers or confirms deletion
- **MOVE node** — old code → new code, re-links all references
- **Schema reference** — inline field tables for node / quest / npc / monster
- **Pre-fill** — switching to the API tab auto-fills the ID from the last selected map node

---

## Bugs Found During Testing

| Bug | Root cause | Fix |
|---|---|---|
| `NODE_COORDS` brace count off by 1 | `/* Paul's Journeys */` apostrophe treated as JS string delimiter | Added `//` and `/* */` skip branches to `extractObj` before string/brace logic |
| `location.get` returned `terrain:null` | Used `node.terrain` (undefined) — node's terrain key is stored in `node.name` | Changed to `node.name` for WORLD_DB lookup |
| GET by display name failed for nodes | `_findKey` searched `name`+`title` only — nodes use `label` for display | Added `label` to the search order: `label → name → title` |

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
