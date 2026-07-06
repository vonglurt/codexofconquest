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
# → { sessionId, r, c, node, desc, exits, room, _hint }

# Look at your current cell
curl http://localhost:1367/api/session/look?sessionId=<id>
# → { r, c, node, desc, exits, players: [{id, name}, ...], room }

# Move one step (headless MUD clients — rolls the instanced encounter)
curl -XPOST http://localhost:1367/api/session/move -d '{"sessionId":"<id>","dir":"N"}'
# → { r, c, node, desc, exits, players, room, encounter }  — 409 if no exit in that direction

# Position beacon (browser clients — display-only, validated, NEVER rolls; §MESH-01a)
curl -XPOST http://localhost:1367/api/session/pos -d '{"sessionId":"<id>","r":10,"c":197}'
# → { ok, moved, pid, name, players, nearby, world, room }  — ok:false reason sea|oob on bad cells

# room (§NAV-01f) — the MUD room object from the shared rooms.js kernel, byte-equal to
# the SP client's describeCell for the same cell (asserted by mud-harness section [M]):
# { icon, title, sub, terrain, prose, exits:[{dir,kind,label,hint,steps}], signposts, landmarks }

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
remote-server events add `remote: true` + `server`. Sentry-bot arrivals/leaves add
`kind: "sentry"` so clients can tell a garrison from a player.

```bash
# Sentry bots (§MESH-01h) — server-owned guards stationed at a junction. They
# ride presence for free (co-present players see them in look/who, kind:'sentry'),
# suppress the encounter roll in their cell, and auto-assist battles there.
curl -XPOST http://localhost:1367/api/sentry/deploy -d '{"node":"LHR","dailyFee":20}'
curl -XPOST http://localhost:1367/api/sentry/deploy -d '{"r":63,"c":224}'   # unnamed junction cell
curl http://localhost:1367/api/sentry/list
curl -XPOST http://localhost:1367/api/sentry/recall -d '{"sentryId":"<id>"}'
```

A sentry is a `bot:true` session: it never idle-expires (the prune sweep skips
bots) and is removed only by `recall`. In the browser game the sentries you post
are bankrolled from your own gold (an upfront cost + a daily upkeep drawn on rest,
recalled if unpaid — see mechanics.md §Multiplayer); the server just hosts the
bot's presence + suppression.

```bash
# No-dupe economy ledger (§MESH-01i) — durable per-player hash chains persisted
# to ledger/<serverId>.jsonl (fsync on append, no TTL — unlike presence, these
# are permanent economy facts). Only MINTED items are tradeable: bytes without
# lineage are worthless in trade. Design: lab-report-mesh-multiuser.md §6.1–6.2.
curl -XPOST http://localhost:1367/api/ledger/mint \
  -d '{"sessionId":"<id>","item":{"key":"sword_iron","name":"Iron Sword"}}'
# → { mintId: ["<serverId>", seq], event }  — stamp mintId onto the item

curl "http://localhost:1367/api/ledger/owner?mintId=<serverId>:<seq>"
# → { owner, hops, tipHash, voided:[…] }  — pure fn of the merged chains:
#   longest valid transfer path from the mint; double-spends resolve by
#   LOWEST event hash, losers voided — every server reaches the same verdict.

# Two-phase trade — propose/cancel are ephemeral; accept appends ONE co-signed
# event into BOTH players' chains (the counterparty session must accept):
curl -XPOST http://localhost:1367/api/trade/propose \
  -d '{"sessionId":"<idA>","to":"<pidB>","give":["<mintId>"],"want":[]}'   # → {tradeId, ttlMs:60000}
curl -XPOST http://localhost:1367/api/trade/accept -d '{"tradeId":"<t>","sessionId":"<idB>"}'
curl -XPOST http://localhost:1367/api/trade/cancel -d '{"tradeId":"<t>"}'

# CROSS-ORIGIN trades (§MESH-01i last rung) — when `to` belongs to another
# origin, the same three calls work unchanged: your server pulls the peer's
# ledger frontier, relays the offer over POST /api/trade/relay (server↔server
# only — compat + ACL gated like gossip), the accept relays back, and the
# PROPOSER's origin authors the one event carrying BOTH origins' HMAC sigs.
# Requires the two servers to be mutually dialable mesh peers; a counterparty
# on a never-gossiped origin is refused with reason "peer-unreachable".

# Consensual PvP duels (§MESH-01j) — commit-reveal, DUEL:CORE pure resolver
# (duel.js, inlined byte-identical in the game; npm run check:duelparity),
# outcome event (kind:'duel') into BOTH players' chains. Same-origin v1.
curl -XPOST http://localhost:1367/api/duel/challenge \
  -d '{"sessionId":"<idA>","to":"<ledgerPidB>"}'          # → {duelId, ttlMs:30000}; refused on pvp:off,
                                                          #   different cells, or a cross-origin pid
curl -XPOST http://localhost:1367/api/duel/accept \
  -d '{"duelId":"<d>","sessionId":"<id>","commit":"<sha256(nonce‖sha256(canonical(statBlock)))>"}'
  # the CHALLENGED player commits first (their accept), the challenger second
curl -XPOST http://localhost:1367/api/duel/reveal \
  -d '{"duelId":"<d>","sessionId":"<id>","nonce":"<hex>","statBlock":{...}}'
  # reveal must hash to the commit; statBlock must pass DUEL.checkBounds
  # (impossible stats rejected). Second reveal → duelSeed =
  # sha256(nonceA‖nonceB‖duelId) → DUEL.run → ONE dual-chain event; the
  # transcript is NOT stored — replay DUEL.run(statA, statB, duelSeed) to verify.
curl "http://localhost:1367/api/duel/list?pid=<pid>"      # pending duels
# SSE to both parties: duel_challenged / duel_accepted / duel_commit_ready /
# duel_completed / duel_cancelled. Walking off the duel cell after committing
# forfeits (the step itself always succeeds — Free-Movement).

curl http://localhost:1367/api/ledger/chain?pid=<pid>    # a player's hash chain
curl "http://localhost:1367/api/ledger/owned?pid=<pid>"  # everything a pid owns now
# → { items: [{mintId, mintKey, item, tipHash}] }  — the trade UI's read surface
#   (slice 2b: lists a counterparty's tradeable items + resolves received names)
curl http://localhost:1367/api/ledger/status             # seq / events / origins / pending trades
```

The counterparty is notified over their session SSE stream (`trade_proposed`,
`trade_completed`, `trade_cancelled`) — on THEIR OWN server when the trade is
cross-origin. The in-game client (slice 2b) rides exactly these surfaces:
co-present `players[]` entries carry `ledgerPid` (the ⇄ trade-target picker —
REMOTE entries too, their durable `p8` rides the presence snapshot),
`session/pos` echoes your own `ledgerPid` on resume,
and loot acquired while connected is minted + stamped automatically (🔗 in the
inventory).

**Durable player identity (slice 2, lab report §6.4).** Sessions idle-expire in
30 min, but ledger chains are permanent — so `session/start` takes an optional
`playerKey` (32 hex chars the client generates ONCE and keeps in the save file):

```bash
curl -XPOST http://localhost:1367/api/session/start \
  -d '{"name":"Ann","playerKey":"<32-hex-from-the-save-file>"}'
# → { pid, ledgerPid, … }  — ledgerPid = origin8:sha256(playerKey)[0:8] is what
#   chains key on; a NEW session with the same key resumes the same chain.
```

The raw key is never stored (`ledger/players.json` keeps the full sha256 for
collision detection); presence stays session-keyed. Keyless sessions still mint,
but their chains strand when the session dies.

**Cross-mesh replication (slice 2).** The ledger rides a parallel durable gossip
channel: every presence gossip payload advertises `ledgerVV` (the per-origin
event frontier), and a mismatch triggers anti-entropy — pull what the peer holds
above our vv (`POST /api/ledger/sync`, compat + ACL gated like presence gossip)
and push what we hold above theirs (`POST /api/ledger/ingest`: shape + hash
recompute + per-origin HMAC self-consistency, version-vector dedup). No TTL, no
age cap — a late-joining server back-fills the full history, and the pure
fork-choice yields the identical dupe-void verdict on every server. Cross-ORIGIN
co-signed trades (parties on different servers) are the remaining §MESH-01i rung.

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
# → 200 (merged, reply payload) | 409 incompatible world | 403 ACL refused | 429 rate limited

# Tracker (rendezvous)
curl -XPOST http://localhost:1368/api/tracker/announce -d '{...manifest+addr}'
curl http://localhost:1368/api/tracker/peers                       # all world groups
curl "http://localhost:1368/api/tracker/peers?wh=<hash>&format=txt"  # peers.txt bootstrap format
scripts/publish-bootstrap.sh http://tracker:1368 [--wh h] > bootstrap.txt  # snapshot + manual-publish howto (never auto-publishes)
curl -XPOST http://localhost:1368/api/tracker/sync -d '{...}'      # federation (tracker↔tracker)

# World download + mod inspection (tracker-mode refuses with 410)
curl -O http://localhost:1367/api/world/download   # game file + X-R2H-* identity headers
node scripts/world-diff.js mine.html theirs.html   # per-collection mod set; LOUD if CODE differs
```

**ACL:** `mesh-acl.json` at repo root (or `MESH_ACL_FILE`), hot-reloaded on mtime —
`{blockServerIds|blockIps|blockWorldHashes: [...]}` or `{"mode":"allowlist", allowServerIds: [...]}`.
Applies to gossip ingress (403), dial-out, and tracker merges.

**Rate limiting (§MESH-01-FU 8):** the unauthenticated server↔server POSTs
(`mesh/gossip`, `tracker/announce`, `tracker/sync`, `ledger/sync`,
`ledger/ingest`, `trade/relay`) sit behind a per-IP token bucket checked
*before* the JSON body is read — a flood gets a flat `429 {reason:'rate'}` at
near-zero cost, while GETs and client-facing routes (sessions, mint, trade
propose/accept) are never metered. Tune with `MESH_RATE_LIMIT` (tokens/s
sustained, default 30; `0` disables) and `MESH_RATE_BURST` (bucket size,
default 120); a healthy peer spends ~0.5 token/s, so the defaults leave ~60×
headroom. Current config is surfaced in `GET /api/mesh/status → rate`, and
the traffic ring logs one `rate` row per flood.

**Test gate:** `npm run test:mud` — 235 checks incl. the [L] partition-heal harness and [P] rate limiting.

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

**Worldbuilder drag-&-lock cities (§NAV-01g):**
- `GET /api/roads/pins` — `roads-pins.json` as `{pins, links, locked}` (empty defaults if the file is absent)
- `PUT /api/roads/lock` — body `{code, locked:boolean}`; 🔒 locked cities keep their coords through `POST /api/layout/geo-seed` (reported as `lockedKept`). Drag-drop and lat/lon placement in the worldbuilder Walk tab go through `PUT /api/coords/:code`.

**Worldbuilder road-net editor (§NAV-01h):**
- `GET /api/roads` — the full net for the overlay: parsed `ROAD_RUNS` (`runs` RLE + `cells`/`junctions` census) merged with the pins file (`pins`, `links`, `locked`)
- `PUT /api/roads/pins` — body `{pins:[{r,c}], links:[["r,c","r,c"]]}`; replaces the authored net (`locked` preserved). Endpoints must be a pin cell or a settlement cell; pins are rejected on sea and on settlement cells. Saving does **not** touch the game file.
- `PUT /api/roads` — **Reweave Net**: runs `scripts/build-roads.js --apply` (patches the `◆ §NAV-01b` ROAD_RUNS block in-place), then `scripts/check-roads.js` (R1–R4). A red check **rolls the game file back** — the on-disk game always passes `check:roads`. One reweave at a time (409 while busy).
- CLI: `./api.sh roads [pins] [--json]` · `./api.sh reweave`

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
