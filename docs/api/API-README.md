<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# CodexOfConquest World Builder — API Reference

**Architecture**: `./bin/api` → WBAPI server (localhost:1367) → `play.html`

---

## Directive: Always Use ./bin/api

> **Use `./bin/api` for all world-building operations. Never use raw curl.**
>
> `./bin/api` handles nonces, retries, error formatting, and pipe-safe JSON automatically.
> Raw curl bypasses these protections and is error-prone.
>
> **If you need a feature that ./bin/api does not yet support, request an API refactor —
> do not fall back to curl. Open an issue describing the operation needed and it will
> be added as a named command.**

The WBAPI server is an internal tool. Its HTTP endpoints exist to support `./bin/api`.
Treat endpoint URLs as implementation details, not as a user interface.

---

## Starting the Server

```bash
./bin/wbapi start     # start it (its own window on macOS; one-shot — no self-restart)
./bin/wbapi status    # is it answering, and on which port
./bin/wbapi restart   # restart after server-code changes
./bin/wbapi stop      # shut down, leaving the snapshot monitor alone
```

Verify it's up:

```bash
./bin/api ping
```

---

## Node Network — Verify, Validate, Maintain

The node network is the skeleton of the game world. Every session should begin and end
with a network health check. Broken edges silently disconnect navigation.

```bash
# Health snapshot — run this first, every session
./bin/api worldmap --regions            # visual: which zones have cities
./bin/api worldmap                      # full world map

# Check connectivity
./bin/api broken                        # list all broken edges (diagonal, gap > 4)
# → target: 0 broken edges

# Check reachability (all nodes walkable from hub)
./bin/api reachability                  # percentage reachable from LHR
# → target: 100% reachable

# Inspect a specific node's connections
./bin/api worldmap --city LHR          # visual + connection status
./bin/api get node LHR                 # full field dump

# Repair
./bin/api reweave                      # rebuild the road net (build-roads.js --apply + check:roads)
./bin/api cluster-bridge --execute     # bridge remaining isolated clusters
./bin/api highway LHR CON --execute    # build full highway between two cities
```

> **Maintain the network**: after every node creation, connection change, or coordinate
> update, run `./bin/api broken` and `./bin/api reachability` to confirm no regressions.

---

## The Common Cycle — Search → Inspect → Edit

Never guess an ID. Always search first.

```bash
# Quests
./bin/api list quest --q "keyword"
./bin/api get quest shk6_act1
./bin/api put quest shk6_act1 desc="Updated description"

# Nodes
./bin/api list node --q "birka"
./bin/api list node --terrain crypt --act 1
./bin/api location LHR                  # composite: node + terrain + coords + links + counts
./bin/api location LHR --with all       # …and the quest/monster/npc bodies (§DX-02kn)
./bin/api get node LHR
./bin/api put node LHR label="New Label"

# NPCs
./bin/api list npc --q "egil"
./bin/api get npc egil_thorvaldsen
./bin/api put npc egil_thorvaldsen occupation="wool factor"

# Monsters
./bin/api list monster --tier easy
./bin/api get monster goblin

# Terrains
./bin/api list terrain --q "forest"
./bin/api get terrain dark_forest
```

---

## Commands — Quick Reference

### Server

```bash
./bin/api ping                          # health check + entity counts
./bin/api count                         # breakdown stats for all collections
./bin/api count nodes                   # node count only
./bin/api count coords                  # coordinate coverage stats
```

### Read

```bash
./bin/api get node LHR                  # single entity with full detail
./bin/api get quest shk6_act1
./bin/api get monster goblin
./bin/api get npc egil_thorvaldsen
./bin/api get terrain dark_forest

./bin/api list node                     # all nodes
./bin/api list node --act 1 --terrain city
./bin/api list node --q "birka"
./bin/api list node --no-coords         # nodes without coordinates
./bin/api list node --has-quests true
./bin/api list node --junction true
./bin/api list quest --q "wolsey"
./bin/api list quest --node LHR --type side
./bin/api list quest --arc shk
./bin/api list monster --tier hard --has-drop true
./bin/api list monster --no-terrain     # unassigned monsters
./bin/api list npc --occupation "innkeeper"
./bin/api list ids node                 # IDs only (fast)
./bin/api list ids quest

./bin/api location LHR                  # composite node view (bodies are --with, §DX-02kn)
./bin/api chain quest_anath             # upstream/downstream quest chain
./bin/api context LHR                   # a node's questline + traps in one call (§EDITOR-04)
./bin/api context --arc quest_kg        # the same for an arc

./bin/api loot-drop                     # every drop table (§DX-02ab)
./bin/api loot-drop --fishing           # lake magic + fish trophies only
./bin/api loot-drop --terrain forest    # one terrain's monsters
./bin/api loot-drop --monster wolf
./bin/api loot-drop --bonus -2          # one weapon-quality band
./bin/api loot-drop --name minnow       # substring, monster or drop name
```

A pool fish carries both a `MONSTER_POOL` statline and a `MONSTER_DROPS` trophy, so
all 25 used to appear twice in an unfiltered call. They are emitted once now, by the
fishing section, carrying the monster fields too — 432 rows → **407**, 0 duplicates.
`--fishing` (33) and `--fishing=false` (399) are unchanged.

### Write — Nodes

```bash
# Create
./bin/api post node code=NEW name=city label="New City" act=1

# Edit fields
./bin/api put node LHR label="Updated Label"
./bin/api put node LHR N=BMA S=KRN E=TLL W=WRO
echo '{"label":"...","text":"..."}' | ./bin/api put node LHR

# Delete (only if not referenced) — source-level + verified, cascades NODE_COORDS (§DX-01d/i)
./bin/api del node OLD_CODE
```

### Write — Quests

```bash
./bin/api post quest id=new_q_01 title="Title" type=side activateNode=LHR
./bin/api put quest new_q_01 desc="Description" passText="You succeeded."
./bin/api del quest old_quest
```

### Write — Other Entities

```bash
./bin/api put monster goblin hp=10 ac=15
./bin/api put npc egil_thorvaldsen occupation="merchant"
./bin/api put terrain dark_forest label="Dark Forest" icon="🌲"
./bin/api put terrain dark_forest monsters=wolf,dire_wolf,worg   # §DX-02h — WHOLE roster, not a delta
```

**A monster's trophy drop is its own verb, not a field on the monster.** `drop` lives in `MONSTER_DROPS`, a separate section keyed by the same monster key — `put monster … drop=…` writes it onto the `MONSTER_POOL` row where nothing reads it (§DX-02gy).

```bash
./bin/api drop desert_wanderer name="Sun-Bleached Waterskin" sell=16 icon="🧪"
./bin/api drop desert_wanderer name="Waterskin" sell=18 --update   # replace an existing drop
```

The monster must exist first; a second `drop` without `--update` is refused with a 409. The verb persists on success — the drop routes are the only writes that do not autosave on their own (§DX-02gz). List the gap with `./bin/api list monster --has-drop false`.

### Export / Import

```bash
./bin/api export node_map               # full node_map as JSON
./bin/api export quest_db
./bin/api export all                    # all 15 collections, 5,158 records (§DX-02fo, §DX-02km)
./bin/api export node_coords            # 416 {code:{r,c}} — the seed export needs these
./bin/api export npc_profiles           # 204 BIRKA_NPC_PROFILES
./bin/api export npc_dialogue           # 74 NPC_DIALOGUE — the node-keyed Talk voices
./bin/api export npc_dialogues          # 214 NPC_DIALOGUES — the npc-keyed favor profiles
./bin/api export node_map --format js   # as JS constant
./bin/api import book.json             # bulk import nodes + quest cycles
```

### `location` depth (§DX-02kn)

`location` is the orientation call — *where am I, what is here, what connects to it* —
and it used to inline every related entity in full. At `NUE` that was **327,226 bytes**,
81 % of it 177 complete quest bodies, to learn a two-number coordinate.

The four entity collections — `quests`, `waypointQuests`, `monsters`, `npcs` — are
**opt-in**, and `terrain.monsters` (the same roster resolved through the `P.<key>` proxy
into full statblocks) travels with `monsters`:

```bash
./bin/api location NUE                 # 2,233 B — node, terrain, coords, links, counts, pointers
./bin/api location NUE --with quests   # + the quest bodies
./bin/api location NUE --with all      # the old shape, byte for byte
./bin/api list quest --node NUE        # quest summaries — a tenth of --with quests
```

Measured over **all 416 nodes**: worst case **327,226 → 3,781 B**, median **1,069 B**,
and **0 nodes over 4,000 B** where 282 were. `counts` is identical in both shapes, and an
unrecognised `?with=` value is a 422 rather than a silent full response. `tests/help-behaviour.mjs`
asserts all of that against a throwaway server on every run.

### The node Talk registry (§DX-02km)

`NPC_DIALOGUE` is keyed by **node code** and holds the line the Talk button renders at
that place. It is the sibling of `NPC_DIALOGUES` (plural), which is keyed by **NPC key**
and holds the favor-tier profiles — the two are not interchangeable, and the engine's own
comment beside the plural says so.

```bash
./bin/api list ids npcdialogue            # the 74 keyed nodes
./bin/api get npcdialogue EHZ             # one entry + the node it renders at
./bin/api get npcdialogue HAJ --fns       # a closure entry, as {__fn:'<source>'}
./bin/api put npcdialogue EHZ name='…' quote='"…"'
```

**`quoteFn` is readable and not writable.** 41 of the 74 entries render through a closure
instead of a string, and fourteen distinct `S_story` flags are written from inside them.
`editField` patches string literals, so a write over `quoteFn` has no quoted value to
replace. Since **§DX-02kp** that is routed to the structured writer, which counts the
entry's closures either side of the patch and refuses one that would drop any — so the
write is rejected rather than appending a second `quoteFn:` that wins by last-key. The
verb does not offer `quoteFn` at all; edit a closure by hand with the server stopped, the
way engine JS is edited.

### Audit

```bash
./bin/api audit                         # integrity scan
./bin/api audit --map                   # map conformity check
```

### Dated backups (§DX-02k / §DX-02l)

Writes persist on their own (temp + atomic rename) — `save` is the *deliberate*
dated snapshot the `milepoints/patches` chain is built from.

```bash
./bin/api save                          # dated backup beside the game file, then overwrite + reload
./bin/api snapshots                     # list them (they are gitignored — nothing else will)
./bin/api snapshots --sweep             # delete the ones ./archive-snapshots.sh already patched
./bin/api snapshots --sweep --force     # …and discard the unarchived ones too
```

### NPC Dialogue

```bash
./bin/api speak egil_thorvaldsen "What do you trade?"
./bin/api speak egil_thorvaldsen "Tell me more." --state friendly
```

### Multiplayer Mesh (§MESH-01) — read-only

```bash
./bin/api mesh status                   # identity · world hash · ACL/rate · peers · players  [--json]
./bin/api mesh peers                    # gossip peer table + remote players  [--json]
./bin/api mesh tracker                  # server browser via configured tracker(s)
./bin/api mesh tracker lan-host:1368    # ...or an explicit tracker  [--json]
```

---

## Map and Coordinate Commands

### Visualisation

```bash
./bin/api worldmap                      # full world map (76 geo-cities, lat/lon oriented)
./bin/api worldmap --latlon             # with lat/lon column
./bin/api worldmap --regions            # 6×6 region grid overview (A1–F6)
./bin/api worldmap --region B2          # zoom into region (Britain + N France)
./bin/api worldmap --region C3          # zoom into region (Italy + Greece)
./bin/api worldmap --city LHR           # city-level map: connections, terrain, status
./bin/api worldmap --search "forest"   # search nodes by label/terrain/battle
./bin/api worldmap --monster skeleton  # hunt map: all nodes with that battle
./bin/api worldmap --route LHR --to CON  # navigation: BFS path A→B
```

### Coordinate Management

```bash
./bin/api geo-seed                      # preview geo-seeded coords (dry-run)
./bin/api geo-seed --execute            # apply real lat/lon seeds to 76 cities
./bin/api move LHR 12 18               # move a node's coordinates
./bin/api move LHR 12 18 --swap        # swap coordinates with occupier
```

### Network Wiring

**Connection rules (enforced everywhere):**
- Max 4 connections per node
- Degree-3 rule: if inserting into a deg=3 node, spawn a junction first (preserves the last slot)
- A→B is really A-mesh→B-mesh: use `smart-connect` to find the best insertion points in each city's surrounding mesh
- Dead ends (deg=1) should be extended with a junction when the area allows it

```bash
# Preferred: mesh-aware connect (finds best insertion points in each city's mesh)
./bin/api smart-connect LHR CON           # dry-run: shows insertion plan
./bin/api smart-connect LHR CON --execute # applies first wiring step
./bin/api smart-connect LHR CON --radius 8  # search deeper into mesh

# Find open attachment points near a city (where to add new content)
./bin/api find-open-location LHR          # lists open nodes near Birka
./bin/api find-open-location LHR --radius 10

# Direct wire (use when you know exactly where to connect)
./bin/api connect WOR E SAL               # warns on deg=3/4; use --force to override
./bin/api junction LHR S --execute        # spawn single junction node
./bin/api junction LHR S --label "Crossroads" --terrain city --execute
./bin/api highway LHR CON --execute       # full junction highway A→B
./bin/api highway WOR REG --step 4 --execute
```

### Validation

```bash
./bin/api broken                        # nodes with no occupied neighbour cell
./bin/api reachability                  # % reachable from hub node
./bin/api reweave                       # rebuild the road net
./bin/api cluster-bridge --execute      # bridge remaining isolated clusters
```

> **Retired (§DX-02kx):** `fix-diagonal`, `fix-all-broken` and `fix-bidirectional` are gone.
> All three iterated the `N`/`S`/`E`/`W` node pointers §CELL-01 stripped to zero, so each printed a
> `✓` over an empty input set — measured 2026-09-14, `./bin/api fix-all-broken` found **0 broken edges**
> while `./bin/api broken` found **93 isolated cells**. The CLI now exits non-zero naming the replacement.
> The census is `./bin/api broken`; the repair is `./bin/api reweave` and `./bin/api cluster-bridge`.

> **Retired (§WALK-3):** `reweave-all`, `fill-gap`, and `rip-and-connect`
> are gone — junction stubs were removed (§WALK-1/§WALK-1.5) and empty land cells are
> now freely walkable, so there is no gap to fill or mesh to reweave. The CLI commands
> return "Unknown command" and the endpoints return HTTP 410. To check connectivity use
> `./bin/api reachability` (read-only land-flood); to bridge isolated clusters use
> `./bin/api cluster-bridge`.

> **Requesting new features**: if a map or graph operation is not listed above,
> request an API refactor rather than reaching for raw curl. Describe the operation
> (e.g. "swap two nodes' coordinates", "list all nodes within 4 hops of LHR") and
> it will be added as a named `./bin/api` command.

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
./bin/api geo-seed --execute            # anchor 76 cities to real lat/lon
node layout-solve.js --apply           # propagate all nodes from geo anchors

# 2. Build the highway between major cities
./bin/api highway LHR CON --execute    # Birka → Constantinople
./bin/api highway KOL REG --execute    # Cologne → Regensburg
./bin/api highway REG VEN --execute    # Regensburg → Venice
# ... continue for all inter-cluster routes

# 3. Verify connectivity
./bin/api reachability                  # target: 100%
./bin/api worldmap --route LHR --to SAM  # test Birka → Samarkand

# 4. Repair remaining isolation
./bin/api broken                        # identify remaining issues
./bin/api reweave                       # rebuild the road net

# 5. Place sub-locations near quest cities
./bin/api list node --no-coords        # find unplaced nodes
./bin/api list quest --node <CODE>     # find what quests a node serves
./bin/api move <NODE> <r> <c>          # place it near its quest city
./bin/api connect <CITY> S <NODE>      # wire it in

# 6. Final validation
./bin/api broken                        # target: 0 broken edges
./bin/api reachability                  # target: 100%
./bin/api audit --map                   # full integrity scan
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

These endpoints exist to support `./bin/api`. You should not need to call them directly.
If you find yourself reaching for curl to hit one of these, request a `./bin/api` wrapper instead.

| Endpoint | Supporting `./bin/api` command |
|---|---|
| `GET /api/ping` | `./bin/api ping` |
| `GET /api/{type}/{id}[?fns=1]` | `./bin/api get <type> <id> [--fns]` — `fns` carries function values as `{__fn:'<source>'}` instead of `null`, which is the shape `PUT` accepts back (§DX-02iv) |
| `GET /api/list/{type}` | `./bin/api list <type> [filters]` |
| `POST /api/{type}` | `./bin/api post <type> [fields]` |
| `PUT /api/{type}/{id}` | `./bin/api put <type> <id> [fields]` |
| `DELETE /api/{type}/{id}` | `./bin/api del <type> <id>` — source-level, saved + re-parsed, returns `deleteVerified` (§DX-01d/i) |
| `GET /api/coords` | `./bin/api count coords` |
| `GET /api/graph/broken` | `./bin/api broken` *(needs wrapper — request refactor)* |
| `GET /api/graph/reachability` | `./bin/api reachability` *(needs wrapper — request refactor)* |
| `POST /api/graph/spawn-junction` | `./bin/api junction <from> <dir>` |
| `POST /api/graph/move` | `./bin/api move <code> <r> <c>` |
| `GET /api/layout/worldmap` | `./bin/api worldmap` |
| `POST /api/layout/geo-seed` | `./bin/api geo-seed` |
| `POST /api/layout/apply` | `node layout-solve.js --apply` |
| `GET /api/export/{collection}` | `./bin/api export <collection>` |
| `POST /api/import/book` | `./bin/api import <file.json>` |
| `GET /api/audit` | `./bin/api audit` |
| `GET /api/audit/map` | `./bin/api audit --map` |
| `POST /api/audit/map/fix` | *(no wrapper — `fix-bidirectional` retired §DX-02kx)* |
| `POST /api/save` | `./bin/api save` — dated backup beside the game file, then overwrite + reload (§DX-02l) |
| `GET /api/snapshots` | `./bin/api snapshots` — list those dated backups (gitignored; nothing else reports them) |
| `DELETE /api/snapshots` | `./bin/api snapshots --sweep [--force]` — deletes only snapshots already in the `milepoints/patches` chain unless forced |

---

## Logs

```bash
tail -f milepoints/wbapi-server.log    # live server log
./bin/api ping                          # quick health check
./bin/wbapi status                     # is it answering, and on which port
```
