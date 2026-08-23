<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Roll2Hit World Builder — API Reference

**Architecture**: `./api.sh` → WBAPI server (localhost:1367) → `index.html`

---

## Directive: Always Use ./api.sh

> **Use `./api.sh` for all world-building operations. Never use raw curl.**
>
> `./api.sh` handles nonces, retries, error formatting, and pipe-safe JSON automatically.
> Raw curl bypasses these protections and is error-prone.
>
> **If you need a feature that ./api.sh does not yet support, request an API refactor —
> do not fall back to curl. Open an issue describing the operation needed and it will
> be added as a named command.**

The WBAPI server is an internal tool. Its HTTP endpoints exist to support `./api.sh`.
Treat endpoint URLs as implementation details, not as a user interface.

---

## Starting the Server

```bash
./wbapi-toggle.sh start     # background (auto-restart loop)
./wbapi-toggle.sh status    # check PID and port
./wbapi-toggle.sh restart   # restart after server-code changes
./wbapi-toggle.sh stop      # shut down
```

Verify it's up:

```bash
./api.sh ping
```

---

## Node Network — Verify, Validate, Maintain

The node network is the skeleton of the game world. Every session should begin and end
with a network health check. Broken edges silently disconnect navigation.

```bash
# Health snapshot — run this first, every session
./api.sh worldmap --regions            # visual: which zones have cities
./api.sh worldmap                      # full world map

# Check connectivity
./api.sh broken                        # list all broken edges (diagonal, gap > 4)
# → target: 0 broken edges

# Check reachability (all nodes walkable from hub)
./api.sh reachability                  # percentage reachable from LHR
# → target: 100% reachable

# Inspect a specific node's connections
./api.sh worldmap --city LHR          # visual + connection status
./api.sh get node LHR                 # full field dump

# Fix broken edges
./api.sh fix-diagonal LHR S           # fix one diagonal edge
./api.sh fix-all-broken --execute     # batch-fix all broken edges
./api.sh highway LHR CON --execute    # build full highway between two cities
```

> **Maintain the network**: after every node creation, connection change, or coordinate
> update, run `./api.sh broken` and `./api.sh reachability` to confirm no regressions.

---

## The Common Cycle — Search → Inspect → Edit

Never guess an ID. Always search first.

```bash
# Quests
./api.sh list quest --q "keyword"
./api.sh get quest shk6_act1
./api.sh put quest shk6_act1 desc="Updated description"

# Nodes
./api.sh list node --q "birka"
./api.sh list node --terrain crypt --act 1
./api.sh location LHR                  # composite: node + quests + NPCs + monsters
./api.sh get node LHR
./api.sh put node LHR label="New Label"

# NPCs
./api.sh list npc --q "egil"
./api.sh get npc egil_thorvaldsen
./api.sh put npc egil_thorvaldsen occupation="wool factor"

# Monsters
./api.sh list monster --tier easy
./api.sh get monster goblin

# Terrains
./api.sh list terrain --q "forest"
./api.sh get terrain dark_forest
```

---

## Commands — Quick Reference

### Server

```bash
./api.sh ping                          # health check + entity counts
./api.sh count                         # breakdown stats for all collections
./api.sh count nodes                   # node count only
./api.sh count coords                  # coordinate coverage stats
```

### Read

```bash
./api.sh get node LHR                  # single entity with full detail
./api.sh get quest shk6_act1
./api.sh get monster goblin
./api.sh get npc egil_thorvaldsen
./api.sh get terrain dark_forest

./api.sh list node                     # all nodes
./api.sh list node --act 1 --terrain city
./api.sh list node --q "birka"
./api.sh list node --no-coords         # nodes without coordinates
./api.sh list node --has-quests true
./api.sh list node --junction true
./api.sh list quest --q "wolsey"
./api.sh list quest --node LHR --type side
./api.sh list quest --arc shk
./api.sh list monster --tier hard --has-drop true
./api.sh list monster --no-terrain     # unassigned monsters
./api.sh list npc --occupation "innkeeper"
./api.sh list ids node                 # IDs only (fast)
./api.sh list ids quest

./api.sh location LHR                  # composite node view
./api.sh chain quest_anath             # upstream/downstream quest chain
```

### Write — Nodes

```bash
# Create
./api.sh post node code=NEW name=city label="New City" act=1

# Edit fields
./api.sh put node LHR label="Updated Label"
./api.sh put node LHR N=BMA S=KRN E=TLL W=WRO
echo '{"label":"...","text":"..."}' | ./api.sh put node LHR

# Delete (only if not referenced) — source-level + verified, cascades NODE_COORDS (§DX-01d/i)
./api.sh del node OLD_CODE
```

### Write — Quests

```bash
./api.sh post quest id=new_q_01 title="Title" type=side activateNode=LHR
./api.sh put quest new_q_01 desc="Description" passText="You succeeded."
./api.sh del quest old_quest
```

### Write — Other Entities

```bash
./api.sh put monster goblin hp=10 ac=15
./api.sh put npc egil_thorvaldsen occupation="merchant"
./api.sh put terrain dark_forest label="Dark Forest" icon="🌲"
./api.sh put terrain dark_forest monsters=wolf,dire_wolf,worg   # §DX-02h — WHOLE roster, not a delta
```

### Export / Import

```bash
./api.sh export node_map               # full node_map as JSON
./api.sh export quest_db
./api.sh export all                    # all collections
./api.sh export node_map --format js   # as JS constant
./api.sh import book.json             # bulk import nodes + quest cycles
```

### Audit

```bash
./api.sh audit                         # integrity scan
./api.sh audit --map                   # map conformity check
```

### Dated backups (§DX-02k / §DX-02l)

Writes persist on their own (temp + atomic rename) — `save` is the *deliberate*
dated snapshot the `milepoints/patches` chain is built from.

```bash
./api.sh save                          # dated backup beside the game file, then overwrite + reload
./api.sh snapshots                     # list them (they are gitignored — nothing else will)
./api.sh snapshots --sweep             # delete the ones ./archive-snapshots.sh already patched
./api.sh snapshots --sweep --force     # …and discard the unarchived ones too
```

### NPC Dialogue

```bash
./api.sh speak egil_thorvaldsen "What do you trade?"
./api.sh speak egil_thorvaldsen "Tell me more." --state friendly
```

### Multiplayer Mesh (§MESH-01) — read-only

```bash
./api.sh mesh status                   # identity · world hash · ACL/rate · peers · players  [--json]
./api.sh mesh peers                    # gossip peer table + remote players  [--json]
./api.sh mesh tracker                  # server browser via configured tracker(s)
./api.sh mesh tracker lan-host:1368    # ...or an explicit tracker  [--json]
```

---

## Map and Coordinate Commands

### Visualisation

```bash
./api.sh worldmap                      # full world map (76 geo-cities, lat/lon oriented)
./api.sh worldmap --latlon             # with lat/lon column
./api.sh worldmap --regions            # 6×6 region grid overview (A1–F6)
./api.sh worldmap --region B2          # zoom into region (Britain + N France)
./api.sh worldmap --region C3          # zoom into region (Italy + Greece)
./api.sh worldmap --city LHR           # city-level map: connections, terrain, status
./api.sh worldmap --search "forest"   # search nodes by label/terrain/battle
./api.sh worldmap --monster skeleton  # hunt map: all nodes with that battle
./api.sh worldmap --route LHR --to CON  # navigation: BFS path A→B
```

### Coordinate Management

```bash
./api.sh geo-seed                      # preview geo-seeded coords (dry-run)
./api.sh geo-seed --execute            # apply real lat/lon seeds to 76 cities
./api.sh move LHR 12 18               # move a node's coordinates
./api.sh move LHR 12 18 --swap        # swap coordinates with occupier
```

### Network Wiring

**Connection rules (enforced everywhere):**
- Max 4 connections per node
- Degree-3 rule: if inserting into a deg=3 node, spawn a junction first (preserves the last slot)
- A→B is really A-mesh→B-mesh: use `smart-connect` to find the best insertion points in each city's surrounding mesh
- Dead ends (deg=1) should be extended with a junction when the area allows it

```bash
# Preferred: mesh-aware connect (finds best insertion points in each city's mesh)
./api.sh smart-connect LHR CON           # dry-run: shows insertion plan
./api.sh smart-connect LHR CON --execute # applies first wiring step
./api.sh smart-connect LHR CON --radius 8  # search deeper into mesh

# Find open attachment points near a city (where to add new content)
./api.sh find-open-location LHR          # lists open nodes near Birka
./api.sh find-open-location LHR --radius 10

# Direct wire (use when you know exactly where to connect)
./api.sh connect WOR E SAL               # warns on deg=3/4; use --force to override
./api.sh junction LHR S --execute        # spawn single junction node
./api.sh junction LHR S --label "Crossroads" --terrain city --execute
./api.sh highway LHR CON --execute       # full junction highway A→B
./api.sh highway WOR REG --step 4 --execute
```

### Validation

```bash
./api.sh broken                        # all broken edges (diagonal, gap > 4)
./api.sh reachability                  # % reachable from hub node
./api.sh fix-diagonal LHR S           # preview fix for one broken edge
./api.sh fix-diagonal LHR S --execute # apply fix
./api.sh fix-all-broken               # preview all fixes
./api.sh fix-all-broken --execute --limit 50  # apply batch
./api.sh fix-bidirectional            # preview one-way link violations
./api.sh fix-bidirectional --execute  # fix all one-way links (A→B but B doesn't point back)
```

> **Retired (§WALK-3):** `reweave` / `reweave-all`, `fill-gap`, and `rip-and-connect`
> are gone — junction stubs were removed (§WALK-1/§WALK-1.5) and empty land cells are
> now freely walkable, so there is no gap to fill or mesh to reweave. The CLI commands
> return "Unknown command" and the endpoints return HTTP 410. To check connectivity use
> `./api.sh reachability` (read-only land-flood); to bridge isolated clusters use
> `./api.sh cluster-bridge`.

> **Requesting new features**: if a map or graph operation is not listed above,
> request an API refactor rather than reaching for raw curl. Describe the operation
> (e.g. "swap two nodes' coordinates", "list all nodes within 4 hops of LHR") and
> it will be added as a named `./api.sh` command.

---

## Session API — MUD Multi-Player (§CELL-07)

The session layer adds in-memory player state. Sessions are ephemeral (no disk
persistence in Phase 1) and expire after 30 minutes of idle.

### Session lifecycle

```bash
# 1. Start — spawns at LHR (City Streets — Birka)
curl -XPOST http://localhost:1367/api/session/start \
  -H 'Content-Type: application/json' \
  -d '{"name":"PlayerName"}'
# → { sessionId, name, r, c, node, desc, exits, players, _hint }

# 2. Look at your current cell
curl "http://localhost:1367/api/session/look?sessionId=<id>"
# → { r, c, node:{code,label,terrain,act}, desc, exits:{N,E,S,W}, players:[{id,name}] }

# 3. Move one step in a direction
curl -XPOST http://localhost:1367/api/session/move \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"<id>","dir":"N"}'
# → 200 same as look on success; 409 if no exit in that direction

# 4. Say something to players in the same cell
curl -XPOST http://localhost:1367/api/session/say \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"<id>","msg":"Hello!"}'
# → { ok, broadcast:{name,msg,r,c}, recipientCount }

# 5. End the session
curl -XPOST http://localhost:1367/api/session/end \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"<id>"}'
# → { ok, ended: sessionId }
```

### Presence queries

```bash
# List all active sessions (all players, positions visible)
curl http://localhost:1367/api/session/who
# → { count, sessions:[{id,name,r,c,nodeCode,state,lastSeen}] }
```

### Real-time events (SSE)

Subscribe to a Server-Sent Events stream for real-time updates:

```bash
curl -N "http://localhost:1367/api/session/events?sessionId=<id>"
```

Event types:
| Event | When fired | Data |
|---|---|---|
| `connected` | Immediately on subscribe | `{sessionId, name, r, c}` |
| `player_arrived` | Another player enters your cell | `{name, from:{r,c}, to:{r,c}, node}` |
| `chat` | Someone says in your cell | `{name, sessionId, msg, r, c}` |

Keepalive comments (`: keepalive`) are sent every 15 seconds to prevent proxy timeout.

### Server Internals

| Endpoint | Purpose |
|---|---|
| `POST /api/session/start` | Create session, spawn at LHR |
| `POST /api/session/move` | Move one cell in N/E/S/W direction |
| `GET /api/session/look?sessionId=` | See current cell, exits, co-present players |
| `GET /api/session/who` | All active sessions |
| `POST /api/session/say` | Broadcast chat to same-cell players via SSE |
| `POST /api/session/end` | Remove session, close SSE stream |
| `GET /api/session/events?sessionId=` | SSE subscription endpoint |

---

## World Construction Procedure

The correct order for building or repairing the world coordinate mesh:

```bash
# 1. Reset to geographic foundation
./api.sh geo-seed --execute            # anchor 76 cities to real lat/lon
node layout-solve.js --apply           # propagate all nodes from geo anchors

# 2. Build the highway between major cities
./api.sh highway LHR CON --execute    # Birka → Constantinople
./api.sh highway KOL REG --execute    # Cologne → Regensburg
./api.sh highway REG VEN --execute    # Regensburg → Venice
# ... continue for all inter-cluster routes

# 3. Verify connectivity
./api.sh reachability                  # target: 100%
./api.sh worldmap --route LHR --to SAM  # test Birka → Samarkand

# 4. Fix remaining broken edges
./api.sh broken                        # identify remaining issues
./api.sh fix-all-broken --execute      # auto-fix where possible

# 5. Place sub-locations near quest cities
./api.sh list node --no-coords        # find unplaced nodes
./api.sh list quest --node <CODE>     # find what quests a node serves
./api.sh move <NODE> <r> <c>          # place it near its quest city
./api.sh connect <CITY> S <NODE>      # wire it in

# 6. Final validation
./api.sh broken                        # target: 0 broken edges
./api.sh reachability                  # target: 100%
./api.sh audit --map                   # full integrity scan
```

---

## Response Envelope

All `GET /api/{type}/{id}` responses wrap the entity:

```json
{
  "entity":      { "...all fields..." },
  "connections": { "...related data..." },
  "_meta":       { "canDelete": true, "blockedBy": null }
}
```

`_meta.canDelete` — if `false`, the entity is referenced by other records and cannot be deleted safely. Resolve references first.

---

## Server Internals (Reference Only)

These endpoints exist to support `./api.sh`. You should not need to call them directly.
If you find yourself reaching for curl to hit one of these, request an api.sh wrapper instead.

| Endpoint | Supporting api.sh command |
|---|---|
| `GET /api/ping` | `./api.sh ping` |
| `GET /api/{type}/{id}` | `./api.sh get <type> <id>` |
| `GET /api/list/{type}` | `./api.sh list <type> [filters]` |
| `POST /api/{type}` | `./api.sh post <type> [fields]` |
| `PUT /api/{type}/{id}` | `./api.sh put <type> <id> [fields]` |
| `DELETE /api/{type}/{id}` | `./api.sh del <type> <id>` — source-level, saved + re-parsed, returns `deleteVerified` (§DX-01d/i) |
| `GET /api/coords` | `./api.sh count coords` |
| `GET /api/graph/broken` | `./api.sh broken` *(needs wrapper — request refactor)* |
| `GET /api/graph/reachability` | `./api.sh reachability` *(needs wrapper — request refactor)* |
| `POST /api/graph/spawn-junction` | `./api.sh junction <from> <dir>` |
| `POST /api/graph/move` | `./api.sh move <code> <r> <c>` |
| `GET /api/layout/worldmap` | `./api.sh worldmap` |
| `POST /api/layout/geo-seed` | `./api.sh geo-seed` |
| `POST /api/layout/apply` | `node layout-solve.js --apply` |
| `GET /api/export/{collection}` | `./api.sh export <collection>` |
| `POST /api/import/book` | `./api.sh import <file.json>` |
| `GET /api/audit` | `./api.sh audit` |
| `GET /api/audit/map` | `./api.sh audit --map` |
| `POST /api/audit/map/fix` | `./api.sh fix-bidirectional --execute` |
| `POST /api/save` | `./api.sh save` — dated backup beside the game file, then overwrite + reload (§DX-02l) |
| `GET /api/snapshots` | `./api.sh snapshots` — list those dated backups (gitignored; nothing else reports them) |
| `DELETE /api/snapshots` | `./api.sh snapshots --sweep [--force]` — deletes only snapshots already in the `milepoints/patches` chain unless forced |

---

## Logs

```bash
tail -f milepoints/wbapi-server.log    # live server log
./api.sh ping                          # quick health check
./wbapi-toggle.sh status               # PID and port
```
