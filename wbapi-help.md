<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Roll2Hit World Builder — Quick Reference

## Directive

> **Always use `./api.sh`. Never use raw curl.**
> If a feature is missing from `./api.sh`, request an API refactor — do not reach for curl.
> Verify, validate, and maintain the node network after every change.

---

## Start the server

```bash
./wbapi-toggle.sh start      # background (one-shot — the server never self-restarts)
./wbapi-toggle.sh status     # PID + port
./wbapi-toggle.sh restart    # after server-code changes
./wbapi-toggle.sh tracker    # §MESH tracker role on :1368 (rendezvous only)
./api.sh ping                # verify it's up
```

---

## Network health — run every session

```bash
./api.sh worldmap --regions     # visual overview: which zones have cities
./api.sh broken                 # broken edges (target: 0)
./api.sh reachability           # % reachable from hub (target: 100%)
./api.sh worldmap --city LHR   # inspect a specific node's connections
```

---

## Search → Inspect → Edit

```bash
# Find
./api.sh list node --q "birka"
./api.sh list quest --node LHR --type side
./api.sh list monster --tier hard
./api.sh list npc --occupation "merchant"

# Inspect
./api.sh get node LHR           # full node detail
./api.sh location LHR           # composite: node + quests + NPCs + monsters
./api.sh get quest shk6_act1
./api.sh chain quest_anath      # upstream/downstream quest chain

# Edit
./api.sh put node LHR label="New Label" N=BMA S=KRN
./api.sh put quest shk6_act1 desc="..." passText="..."
./api.sh put npc egil_thorvaldsen occupation="wool factor"

# Create / Delete
./api.sh post node code=NEW name=city label="New City" act=1
./api.sh del node OLD_CODE
```

---

## Map commands

```bash
./api.sh worldmap                          # world map (76 cities)
./api.sh worldmap --regions                # 6×6 region grid
./api.sh worldmap --region B2             # zoom into region
./api.sh worldmap --city LHR             # city map + connection status
./api.sh worldmap --search "forest"      # search by label/terrain/battle
./api.sh worldmap --monster skeleton     # monster-hunt map
./api.sh worldmap --route LHR --to CON  # BFS navigation A→B
```

---

## Coordinate wiring

```bash
./api.sh geo-seed --execute              # anchor cities to lat/lon
node layout-solve.js --apply             # propagate all nodes

./api.sh connect WOR E SAL              # wire two nodes
./api.sh highway LHR CON --execute      # full junction highway
./api.sh junction LHR S --execute       # single junction node
./api.sh fill-gap WOR E SAL --execute   # junction chain for gap > 4
./api.sh move LHR 12 18 --swap          # move/swap coordinates

./api.sh fix-diagonal LHR S --execute   # fix one broken edge
./api.sh fix-all-broken --execute       # batch-fix all broken edges
```

---

## Export / Import / Audit

```bash
./api.sh export node_map                 # export as JSON
./api.sh export all --format js
./api.sh import book.json               # bulk import
./api.sh audit --map                    # full integrity scan
```

---

---

## Session API — MUD multi-player (§CELL-07)

In-memory session layer. Multiple players, each with their own (r,c) position.
Sessions expire after 30 minutes of idle.

```bash
# Start a session (spawns at LHR)
curl -XPOST http://localhost:1367/api/session/start -d '{"name":"PlayerName"}'
# → { sessionId, r, c, node, desc, exits, _hint }

# Look at your current cell
curl http://localhost:1367/api/session/look?sessionId=<id>
# → { r, c, node, desc, exits, players: [{id, name}, ...] }

# Move one step (headless MUD clients — rolls the instanced encounter)
curl -XPOST http://localhost:1367/api/session/move -d '{"sessionId":"<id>","dir":"N"}'
# → { r, c, node, desc, exits, players, encounter }  — 409 if no exit in that direction

# Position beacon (browser clients — display-only, validated, NEVER rolls; §MESH-01a)
curl -XPOST http://localhost:1367/api/session/pos -d '{"sessionId":"<id>","r":10,"c":197}'
# → { ok, moved, pid, name, players, nearby, world }  — ok:false reason sea|oob on bad cells

# Say something to players in the same cell
curl -XPOST http://localhost:1367/api/session/say -d '{"sessionId":"<id>","msg":"Hello!"}'

# Subscribe to real-time events (SSE)
curl -N http://localhost:1367/api/session/events?sessionId=<id>
# → event: connected / event: player_arrived / event: chat  (keepalive every 15s)

# List all active sessions
curl http://localhost:1367/api/session/who

# End your session
curl -XPOST http://localhost:1367/api/session/end -d '{"sessionId":"<id>"}'
```

SSE events: `connected`, `player_arrived` / `player_left` / `chat` (cell-scoped),
`player_moved` (worldwide, display layer). All carry `pid` (`<serverId8>:<sessionId8>`);
remote-server events add `remote: true` + `server`.

---

## Mesh API — server-to-server presence (§MESH-01)

Full reference: `docs-node-network.md §12` + `lab-reports/lab-report-mesh-sync-architecture.md`.
(`./api.sh mesh` CLI wrappers are planned — FU 10; until then these are the raw endpoints.)

```bash
# Start / wire up (see also "Start the server" above)
./wbapi-toggle.sh start                  # game server :1367 (loads .env — TRACKER_URL etc.)
./wbapi-toggle.sh tracker [port]         # tracker role :1368 — rendezvous ONLY, never a relay
node wbapi-server.js --peer host:1367 --bind 0.0.0.0 --advertise <lan-ip>:1367 --name "Hub"
# Bootstrap ladder: --peer → MESH_PEERS → peers-cache.json → peers.txt → TRACKER_URL/BOOTSTRAP_URLS

# Identity + world manifest (what forks a swarm: proto + engineVer + worldHash)
curl http://localhost:1367/api/manifest
# → { proto, engineVer, worldName, worldTag, worldHash, parts: {8 collection hashes} }

# One-call mesh status (worldbuilder 🌐 Mesh tab source; also served in tracker-mode)
curl http://localhost:1367/api/mesh/status
# → { serverId, addr, reachability{warnings}, acl, peers[], remotePlayers[],
#     trackerGroups[], traffic[] ("information passed" packet ring) }

# Gossip ingress (servers call this on each other — shown for debugging only)
curl -XPOST http://localhost:1367/api/mesh/gossip -d '{...meshPayload}'
# → 200 (merged, reply payload) | 409 incompatible world | 403 ACL refused

# Tracker (rendezvous)
curl -XPOST http://localhost:1368/api/tracker/announce -d '{...manifest+addr}'
curl http://localhost:1368/api/tracker/peers                       # all world groups
curl "http://localhost:1368/api/tracker/peers?wh=<hash>&format=txt"  # peers.txt bootstrap format
curl -XPOST http://localhost:1368/api/tracker/sync -d '{...}'      # federation (tracker↔tracker)

# World download + mod inspection (tracker-mode refuses with 410)
curl -O http://localhost:1367/api/world/download   # game file + X-R2H-* identity headers
node scripts/world-diff.js mine.html theirs.html   # per-collection mod set; LOUD if CODE differs
```

**ACL:** `mesh-acl.json` at repo root (or `MESH_ACL_FILE`), hot-reloaded on mtime —
`{blockServerIds|blockIps|blockWorldHashes: [...]}` or `{"mode":"allowlist", allowServerIds: [...]}`.
Applies to gossip ingress (403), dial-out, and tracker merges.

**Test gate:** `npm run test:mud` — 98 checks incl. the [L] partition-heal harness.

---

## Cell grid queries (§CELL-08)

Exits are **derived from cell adjacency**, not stored. Use cell/grid endpoints
to inspect the grid without scanning NODE_MAP manually.

```bash
./api.sh cell 5 16               # node at (r,c): code, terrain, exits
./api.sh cell 5 16 neighbors     # N/E/S/W neighbor detail

./api.sh grid heatmap            # all cells with adjacency heat (0–4)
./api.sh grid reachability       # reachable vs unreachable from LHR
./api.sh grid reachability --hub CY   # use a different hub
./api.sh grid region --r1=0 --c1=0 --r2=10 --c2=20  # bounding box
```

**Node create/update rules (§CELL-08 enforcement):**
- `POST /api/node` rejects N, E, S, W fields — place node at (r,c) instead
- `PUT /api/node/:code` rejects N, E, S, W, junction fields — use `PUT /api/coords/:code`

---

## Need a feature curl can do but api.sh can't?

Describe the operation and request an API refactor. It will be added as a named
`./api.sh` command. Do not use raw curl as a workaround — it bypasses nonces,
retry logic, and pipe-safe error handling.

Full reference: **API-README.md**

---

## Arc Insertion Workflow

The canonical workflow for adding any quest chain via the API. Steps are invariant; content changes.

### A. The Seven-Step Arc Insertion Protocol

```bash
# Step 0: confirm node exists and terrain is correct
./api.sh location {startNode}

# Step 1: register new flags in _S_DEFAULTS (manual edit in roll2hit-v3.html)

# Step 2: inspect quest schema
./api.sh get quest --schema

# Step 3: create one quest
./api.sh post quest id=quest_{arc}_{nn} type=side npc={npc_key} activateNode={code} title="..."

# Step 4: verify quest readable
./api.sh get quest quest_{arc}_{nn}

# Step 5: patch text fields
./api.sh put quest quest_{arc}_{nn} passText="..." failText="..."

# Step 6: repeat steps 3–5 for each quest in chain

# Step 7: verify dependency graph
./api.sh chain quest_{arc}_{nn}

# Step 8: run audit — must be clean before save
./api.sh audit

# Step 9: commit to timestamped HTML
```

**One session per arc.** All POSTs and PUTs must happen in a single server session before Step 8.

### B. Mission Type → Field Templates

**`talk_chain`** (NPC conversation, no roll):
```json
{ "id":"quest_{arc}_{nn}", "type":"side", "title":"...", "desc":"...", "hint":"...",
  "activateNode":"{code}", "activateCond":"{priorFlag}", "checkPassFlag":"{arcFlag}", "xpAward":100 }
```

**`skill_check`**:
```json
{ "id":"quest_{arc}_{nn}", "type":"skill_check", "title":"...", "desc":"...", "hint":"...",
  "activateNode":"{code}", "activateCond":"{priorFlag}", "checkAbility":"{str|dex|con|int|wis|cha}",
  "checkLabel":"{Skill}", "checkDC":12, "retryable":false, "xpAward":150,
  "passText":"...", "failText":"...", "checkPassFlag":"{arcFlag}", "disposition":"..." }
```

**`escort`** (companion travel):
```json
{ "id":"quest_{arc}_{nn}", "type":"side", "title":"...", "desc":"...",
  "hint":"Reach {dest} with {npc}.", "activateNode":"{start}", "waypointNode":"{dest}",
  "activateCond":"{priorFlag}", "checkPassFlag":"{arcFlag}", "xpAward":150 }
```

**`collect`** (item delivery):
```json
{ "id":"quest_{arc}_{nn}", "type":"side", "title":"...", "desc":"...",
  "hint":"Bring {item} to {npc} at {code}.", "activateNode":"{code}", "waypointNode":"{dest}",
  "activateCond":"{priorFlag}", "completeItems":["{item}"], "checkPassFlag":"{arcFlag}", "xpAward":150 }
```

### C. Pre-flight Checklist

Before `POST /api/save`:

1. All `activateCond` flags exist in `_S_DEFAULTS`
2. All `checkPassFlag` values are unique across QUEST_DB
3. All `activateNode` and `waypointNode` codes exist in NODE_MAP
4. Chain is connected: `./api.sh chain {firstQuestId}` shows all expected quests downstream

---

## Quest Operand Reference

The 12 operand kinds for quest `bits[]` arrays. Used when creating new quests via ✏ Editor or API.

| Kind | Required fields | Optional fields |
|------|----------------|----------------|
| `talk_at` | `node` | `npcKey`, `objectKey`, `requiresItem`, `dialogue` |
| `skill_check` | `ability`, `dc`, `label`, `passText`, `failText` | `retryable`, `passFlag` |
| `navigate` | `fromNode`, `toNode` | `hint` |
| `kill_at` | `node`, `monsterKey` | `count`, `killFlag` |
| `escort` | `npcKey`, `fromNode`, `toNode` | `partySlot`, `combatRisk`, `failFlag` |
| `talk_party` | `npcKey` | `partySlot`, `talkFlag`, `dialogue` |
| `deliver` | `item`, `toNode` | `fromNode`, `recipient`, `consumeOnDeliver` |
| `collect_item` | `item` | `icon`, `sell`, `unique` |
| `consume_item` | `item` | `failText` |
| `investigate` | `node`, `target` | `skillCheck`, `reveals`, `investigateFlag` |
| `flag_gate` | `requires` OR `requiresAny` | `blocks` |
| `choice` | `prompt`, `options[]` | — |

**Composition rule:** every quest must end with `collect_item`, `flag_write`, or `choice`. See `WBAPI.quests.advise(id)` for live checks.

---

## §AUDIT-02 — NPC/Quest Connection Gap

**Finding 1:** ~985 quests have no `npc` field. Root cause: book-import scripts created quest stubs without populating `npc`. Before fixing, determine: do the book-arc nodes already have NPCs in BIRKA_NPC who should own these quests?

**Fix workflow when ready:**
```bash
./api.sh location LHR     # shows NPCs at that node
./api.sh list npc --node LHR
./api.sh list quest --node LHR --raw | jq '.[].id' | xargs -I{} ./api.sh put quest {} npc=yael
./api.sh audit --raw | jq '.errors | length'
```

**Finding 2:** 13 NPCs have no quests:
- Core Birka 6 (yael/brynn/quill/pachelbel/crov/auros) — deeply characterised; waiting for real quest arcs to be written
- Book-import stubs (ser_bardo, ser_taddeo, etc.) — quests exist but have no `npc` field pointing back; fix by wiring existing quests → NPC
