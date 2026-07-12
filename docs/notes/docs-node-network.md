<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# roll2hit.com — Node Network Technical Reference

**File:** `roll2hit-v3.html`  
**Last updated:** 2026-07-07 §MESH-02 (connection center + operator endpoints, §12)  
**Node count:** 422 named nodes with grid coordinates (reachable via `cellMove`). The 268 zombie J-stubs with no `r,c` were purged in §CELL-05b.

---

## 1. Grid System

All nodes have a grid coordinate `{r, c}` stored in `NODE_COORDS`. The grid is at least 16 rows × 200 columns (expanded by the 1367 import; the 1367 region extends to c ≈ 428).

```
r = 1 (north) → 500 max (south)
c = 1 (west)  → 500 max (east)
```

Grid coordinates serve two purposes:
1. **Minimap rendering** — `_renderMiniMap()` and `_renderMapGrid()` place node cells at `(r, c)`.
2. **Cell-based navigation** — `CELL_GRID["r,c"]` maps each coordinate to a node code. `cellMove(dir)` reads this to find the destination.

The reverse grid lookup:
```js
// Built once at startup — "r,c" → node code
const CELL_GRID = (() => {
  const g = {};
  for (const code of Object.keys(NODE_MAP)) {
    const coord = NODE_COORDS[code] || { r: NODE_MAP[code].r, c: NODE_MAP[code].c };
    if (coord && coord.r != null && coord.c != null)
      g[`${coord.r},${coord.c}`] = code;
  }
  return g;
})();
```

---

## 2. Node Types

| Type | Count | Code pattern | `junction` | `isEpicBattleground` | `isFishingLake` |
|------|-------|-------------|------------|----------------------|-----------------|
| Story nodes (main arc) | ~78 | CI, SL, IN … CO | — | — | — |
| Named junction nodes | 10 | J1–J7, J13, WRO, RD | — | — | — |
| Epic Battleground | 20 | E* (EF, EH … EG) | — | `true` | — |
| Fishing lake | 2 | YL, YC | — | — | `true` |
| DeFi Land (special Act I) | 3 | DF, HM, GL | — | — | — |
| Mountain pass (hunt) | 1 | MT | — | — | — |
| Ally Cat Arc | 1 | CQ | — | — | — |

> **§CELL-05 + §CELL-05b:** §CELL-05 bulk-deleted `junction:true` nodes. 268 J-stubs with `junction:false` and no `r,c` were purged in §CELL-05b. J13 (The Western Sea Road) and WRO (Midlands Road Fork) had real narrative text and were promoted to named midlands nodes.

### Act grouping

| Act | Nodes | Theme |
|-----|-------|-------|
| I | CI SL CQ IN TV BA CR CY DF HM GL | Birka city |
| II | DK MQ SF MS AL | Saltwick / Tilbury |
| III | MI FO HL SW HS BE MT YL YC | The Wilds |
| IV | OC IS AT SC FL DS | The Deep / Ocean |
| V | SE BK GC PC MC CA VC | Ashcrag / Visby |
| VI | DE DC JU BQ SQ OU | Desert & Weimar |
| VII | GA KT OP HC AR | Mythic |
| VIII | CO | Finale |

---

## 3. Node Record Schema (NODE_MAP)

Each node is a self-describing record. **All N, S, E, W, SW, spire, and portal direction fields were stripped** (§CELL-01 + §CELL-13) — exits are derived at runtime from `CELL_GRID` adjacency only. No stored edge data of any kind.

```js
NodeCode: {
  num:   <int>,          // display number (01–78)
  code:  '<str>',        // 2–3 char code
  name:  '<terrain>',    // WORLD_DB terrain key
  label: '<str>',        // display name
  act:   <1–8>,
  // Content:
  text:  '<str>',        // story text
  npc:   '<str>|null',
  battle:{ label, key, count }|null,
  loot:  '<str>|null',
  sleep: <bool>,
  sleepCost: <int>,      // gp cost (0 = free)
  // Flags:
  junction: true,        // J-nodes and RD (boilerplate entries removed in §CELL-05; remaining are promoted named nodes)
  isEpicBattleground: true,
  isFishingLake: true,
  bossKey: '<str>',      // epic nodes only
}
```

Exits are derived at runtime:
```js
// "What nodes border this cell?" — computed in cellMove, not stored
const N = CELL_GRID[`${node.r - 1},${node.c}`] ?? null;
const S = CELL_GRID[`${node.r + 1},${node.c}`] ?? null;
const E = CELL_GRID[`${node.r},${node.c + 1}`] ?? null;
const W = CELL_GRID[`${node.r},${node.c - 1}`] ?? null;
```

The WBAPI server exposes these as `derived_exits` on `GET /api/node/:code`.

---

## 4. Navigation System — cellMove (§CELL-03, ✅ active)

Navigation is **MUD-style cell grid**: pressing N/E/S/W always moves exactly one cell. There is no corridor dialog, no Manhattan-distance gating, and no Hunt/Warp overlay on normal movement.

### Movement flow

```
Player presses N/E/S/W
  │
  ├─ cellMove(dir) — thin caller (halts auto-travel first if the input isn't the travel loop's)
  │   ├─ Mover.move(_moverWorld(), {r,c}, dir)   ← shared mover.js kernel (§WALK-2):
  │   │     band bounds 0 ≤ r < 90 · E/W wrap at the antimeridian · sea/IMPASSABLE_CELLS
  │   │     refusal reasons are exactly 'oob' | 'sea' — NO gate locks, NO quest checks
  │   │     (Free-Movement Policy, CONTRIBUTING.md §I)
  │   ├─ blocked → storyBlock('No path leads that way.')
  │   ├─ destCode = res.destCodes[0]
  │   │
  │   ├─ named node → _setActivePath(); currentCode = destCode; storyRender(node)
  │   └─ empty cell → _enterEmptyCell(nr, nc)   (currentCode unchanged)
  │
  ├─ S_story.playerR / playerC updated; visitedCells["r,c"] = true (timeless — no clock advance)
  └─ mpBeacon() — presence beacon, no-op unless 🌐 connected
```

### Empty cell traversal (§CELL-04, ✅ active)

When the player steps on a cell with no named node:

1. `describeCell(_roomWorld(), {r,c})` (§NAV-01c ROOMS:CORE) — renders the room: deterministic terrain prose (hash-keyed variants, no `Math.random`), region-name title, 🪧 road signage toward the next settlement, nearest-landmark line. Terrain precedence inside: `SEA_LANES → 'ocean'` ▸ `ROAD_CELLS → 'road'` (encounter rate 0) ▸ majority-of-named-neighbors (`_inferTerrain`) ▸ `'midlands'`.
2. Exits — the d-pad/exit panel shows signage per direction (`E→ road — toward Visby (4)`; blocked directions labelled, e.g. "open sea").
3. Random encounter — rolls against `TERRAIN_ENCOUNTER_RATE[room.terrain]`; if triggered, `_weightedMonsterPick(terrain)` starts the battle after 300 ms and `_encounterQueued` halts any auto-travel.
4. All three map panels + the GLOBE canvas refresh (§NAV-01e).

```js
const TERRAIN_ENCOUNTER_RATE = {
  midlands:0.15, forest:0.25, highlands:0.20, swamp:0.30, desert:0.20,
  jungle:0.30, hag_swamp:0.35, ocean:0.10, beach:0.10, road:0, junction:0,
  city:0.05, city_slums:0.10, alley:0.15, _default:0.15
};
```

### State fields

| Field | Type | Description |
|-------|------|-------------|
| `S_story.playerR` | number | Current grid row |
| `S_story.playerC` | number | Current grid column |
| `S_story.visitedCells` | `{[key:string]:true}` | All `"r,c"` cells ever stepped on |

`storyRender()` syncs `playerR`/`playerC` from `NODE_COORDS` on every named-node entry, so saves from before §CELL-03 are automatically corrected on first render.

### Gate locks — ❌ removed

No gate locks exist. `GATE_LOCKS` greps to 0 in the current file and `cellMove` has no gate branch — movement is refused only for `'oob'`/`'sea'` (Free-Movement Policy, CONTRIBUTING.md §I). Story gating happens at the mission-listing level (quest `gate`/`activateCond` in `storyCheckQuests`), never at a road.

---

## 5. Minimap Rendering (§CELL-10, ✅ active)

Three map views exist in the game:

| View | Function | Grid | Center |
|------|----------|------|--------|
| HUD mini-map | `_renderMiniMap()` | 11×17 at 8px cells | `playerR, playerC` |
| Full world map | `_renderWorldMiniMap()` | 41×61 at 3px cells | whole world view |
| Map sheet | `_renderMapGrid()` | 11×11 at 44px cells | `playerR, playerC` |

All three center on `S_story.playerR / playerC` (the actual cell, updated in `cellMove`). If the player is on an empty cell the maps still center correctly.

**Cell rendering logic (HUD minimap):**

| Cell type | Display | CSS class |
|-----------|---------|-----------|
| Player position | `@` | `mmc-player` |
| Named node (visited/trail) | 2-char code | `mmc-visited` / `mmc-trail` |
| Named node (unvisited) | `?` | `mmc-node` |
| Epic battleground | code or `?` | `mmc-epic` / `mmc-epic-unvis` |
| Visited empty cell | terrain glyph (·♣▲≈∴~░♠⌂─│) | `mmc-empty-visited` |
| Unvisited within 3 cells | `·` | `mmc-partial` |
| Full fog | (blank) | `mmc-fog-cell` |

`_MMC_TERRAIN_GLYPHS` constant maps terrain key → glyph. `_inferTerrain(r,c)` derives terrain from named neighbors.

`_renderMiniMap()` is called from `storyRender()` (named-node entry) and `_enterEmptyCell()` (empty-cell step).

---

## 6. Corridor Travel System — REMOVED (§CELL-05)

The corridor system (`storyMove_LEGACY`, `storyCorridorTravel`, `CORRIDOR_CELLS`, `CORRIDOR_TERRAIN`, corridor overlay HTML/CSS) was fully removed in §CELL-05. `cellMove` is the sole navigation function.

See `spec-corridors.md` for the archived spec.

---

## 6. Junction Highway System — REMOVED (§CELL-05)

All 21,046 boilerplate J##### junction nodes were bulk-deleted via `POST /api/admin/delete-junctions`. J13 (The Western Sea Road, r=131 c=146) and WRO (Midlands Road Fork, r=39 c=188) had real narrative text and were promoted to `name:'midlands'` nodes without the junction flag.

Remaining named nodes with J-prefix (J1–J7, RD) have no `junction` flag and serve as ordinary named story locations at their grid coordinates.

```
J1  (5,12)   Midlands Road Fork
J2  (10,4)   Southern Road Cross
J3  (9,3)    Coastal Fork
J4  (12,8)   Deep Road Split
J5  (1,10)   Arctic Overpass
J6  (5,5)    Western Wilds Crossroads
J7  (1,22)   Sky Gate Spur
J13 (131,146) The Western Sea Road
RD  (5,6)    Roadside Clearing
WRO (39,188) Midlands Road Fork
```

---

## 7. Dead-End Nodes

These nodes have only one cardinal grid neighbor (plus any epic/portal extras). Exits are derived from `CELL_GRID` at runtime.

| Code | Label | Single adjacent node |
|------|-------|---------------------|
| CQ | The Cat Quarter | W → SL |
| HM | Frequency Row | W → DF |
| GL | Old Guard's Corner | E → DF |
| SF | The Map Shop | W → MQ |
| MS | Aboard the Tilbury Star | W → DK |
| YC | Yugurt Cabin | N → YL |
| OU | The Observatory Outhouse | W → BQ |
| GA | Greek Agora | N → KT |
| CO | Cosmic Realm | S → CI (game finale) |

Epic Battleground nodes (E*) all have exactly one grid neighbor — their parent node.

---

## 8. Jump-Travel Removal (§CELL-13, 2026-06-15 · ✅ re-applied 2026-07-03)

> **History:** a snapshot rollback had partially reverted this removal — `storyPortal()`, `storyUseTransmort()`, `storySetHearthHome()`/`hearthHome`, and the spire special-exit block resurfaced in code (found 2026-07-03 during the §NAV-01 docs sync; same rollback era as §DATA-01). On the user's directive ("jump travel is not present") the removal was **re-applied 2026-07-03**: all functions, the vendor Transmort stock, the inventory Use button, the HEARTH inn chip, map-legend/`_mapIcon` entries, `hearthHome` state defaults, and the portal/hearth CSS are gone — grep-verified 0 live references. Gates: `check:walk` 6/6 · navigation/autosave/fishing 48/48. Old saves: a carried `hearthHome` field is ignored; Transmort Scrolls become inert quest items.

All non-cell-grid travel mechanisms were removed. Navigation is strictly one adjacent cell per move.

| Removed | What it did | Replacement |
|---------|-------------|-------------|
| `storyPortal()` + `node.portal` | Instant OU→GA teleport | Walk the grid (OU and GA are navigable by cell path) |
| `storyUseTransmort()` + transmort scroll | Jump to hearth home inn | Walk or use waypoint BFS |
| `storySetHearthHome()` + `S_story.hearthHome` | Marked a home inn for transmort | Removed — `checkpointNode` (death respawn) is the only warp left |
| `node.spire` field + spire exit in sidebar | Extra non-NSEW portal exit | Removed |
| N/S/E/W edge fields on all nodes | Legacy explicit edge data (~1,800 lines) | Already unused; now fully stripped |

`SW` and `spire` direction fields were stripped in §CELL-01. DS → ED and HC → EK are co-located in CELL_GRID at adjacent cells.

---

## 9. Waypoint & BFS Pathfinding (§CELL-09, ✅ active)

`_bfsGridPath(fromCode, toCode)` walks `CELL_GRID` one cell at a time using standard BFS. It returns a path of `{r, c, code}` steps from the player's current position to the target node. No stored edge data is used.

```js
// First step direction toward a waypoint — startR/startC optional for empty-cell accuracy
function _bfsGridDir(fromCode, toCode, startR, startC) {
  const path = _bfsGridPath(fromCode, toCode, startR, startC);
  if (!path.length) return null;
  const startCoord = (startR != null && startC != null)
    ? { r: startR, c: startC }
    : NODE_COORDS[fromCode] || { r: S_story.playerR, c: S_story.playerC };
  const dr = path[0].r - startCoord.r;
  const dc = path[0].c - startCoord.c;
  return dr < 0 ? 'N' : dr > 0 ? 'S' : dc > 0 ? 'E' : 'W';
}
```

Both `_updateExitLinks()` and `storyWaypoint()` pass `(pr, pc)` — the actual player grid position — as `startR/startC` (helper: `_playerPos()`, §NAV-01a). This ensures waypoint directions are correct when the player is standing on an unnamed empty cell (where `currentCode` still points to the last named node). Since §NAV-01a, BFS uses kernel-identical passability: band clamp `0≤r<90` and E/W wrap with antimeridian direction adjust — not the pre-§WALK 500×500 bounds.

**Auto-travel (§NAV-01d/e):** the WP button no longer nudges one step — it toggles a travel loop. `_roadGridPath(_playerPos(), toCode)` runs a road-weighted Dijkstra (road/sea-lane cells cost 1, open land 2 — routes prefer the §NAV-01b road net), and `_travelTick()` executes one `cellMove` per ~120 ms until: an encounter roll fires (`_encounterQueued`), the player arrives, any user input lands, or a step is blocked. Shift+WP keeps the old single-step nudge. Quest "📍 Navigate →" (`storySetWaypoint`) starts travel directly; journal and Navigate button show `(n steps, NE)` readouts and a waypoint ★ is drawn on the minimap and both world canvases.

**Empty-cell encounters:** `_enterEmptyCell` always rolls once at the terrain's `TERRAIN_ENCOUNTER_RATE` (no Hunt-Mode toggle — `S_story.huntMode` and the guaranteed-encounter `effectiveRate = 1.0` path were removed in §TIMELESS-01). On a hit, `_weightedMonsterPick(terrain)` selects the monster; the old quest-stalked `_stalkedMonsterPick` is gone. Named-node battles are unchanged.

---

## 10. Grid Coordinate Table (core 78 story/junction nodes)

```
Code  r   c   Label
----  --  --  -----
CI    5   16  City Streets — Birka
SL    4   16  Birka Slums
CQ    4   17  The Cat Quarter
IN    5   17  The First Inn
TV    6   17  Birka Tavern
BA    6   15  The Rough Bar
CR    7   15  The Birka Crypt
CY    7   16  Neon Undercity
DK    8   15  Harbor Docks — Tilbury
MQ    8   16  Tilbury Market Quarter
SF    8   17  The Map Shop
MS    8   19  Aboard the Tilbury Star
AL    9   15  Visby Approach Alley
MI    5    8  Plains & Midlands
FO    5    3  Aldric's Forest
HL    4    3  Irish Highlands
SW    6    3  Murky Swamp
HS    7    3  The Crones' Domain
BE   12    2  Tropical Beach
OC   13    1  Aboard the Cerulean Debt
IS   13    3  Island Shore
AT   14    2  Atlantis — Sunken City
SC   12    1  Sea Cavern
FL   11    2  Freshwater Lake & River
DS   14    4  Deep Sea Trench
SE   10   13  Visby Sewers
BK   10   14  Broken Tooth Tavern
GC   10   15  Goblin Warrens
PC   10   16  Pirate Cave
MC   11   12  Monster Den
CA   10   12  Scholar Kings' Underground Road
VC   11   11  Vampire Castle Ruins
DE   10    5  Desert Wastes
DC   10    7  Izador's Desert Caravan
JU   10    2  Dense Jungle
BQ    3    4  Blacksmith Quarter — Weimar
SQ    3    3  Scholar's Quarter — Weimar
OU    3    5  The Observatory Outhouse
GA    3   20  Greek Agora
KT    2   21  Camelot — Arthurian Road
OP    2   23  Oriental Dragon Palace
HC    1   17  Sky Road — Heavenly Clouds
AR    2    3  Arctic Wastes — Detour
CO    1   18  Cosmic Realm — The Convergence
J1    5   12  Midlands Road Fork
J2   10    4  Southern Road Cross
J3    9    3  Coastal Fork
J4   12    8  Deep Road Split
J5    1   10  Arctic Overpass
J6    5    5  Western Wilds Crossroads
J7    1   22  Sky Gate Spur
RD    5    6  Roadside Clearing
MT    4    5  The Mountain Pass — High Crest
EF    5    2  Thornwood Maw (Epic)
EH    4    2  Loch of the Drowned King (Epic)
ES    6    2  Sunken Altar (Epic)
EW    7    4  Hag Mother's Cradle (Epic)
EB   12    3  Wreck of the Unbroken (Epic)
EO   15    4  Leviathan's Eye (Epic)
EI   13    4  Isle of the Wyrm Crown (Epic)
EA   15    2  Abyssal Scriptorium (Epic)
EC   11    1  Scholar Kings' Forge (Epic)
EL   11    3  Sunken God's Throne (Epic)
ED   15    3  Trench Titan (Epic)
EM    6    8  Noonwraith Queen's Field (Epic)
EE   11    5  Pharaoh's Vault (Epic)
EV   10    8  Djinn Lord's Palace (Epic)
EJ   10    1  Canopy Cathedral (Epic)
ET    4    6  Peak of the Eldest (Epic)
ER    1    3  Frost Warden's Throne (Epic)
EK    1   16  Shattered Seraph's Spire (Epic)
EP   11   16  Admiral's Last Cove (Epic)
EG   11   14  Void Shaman's Sanctum (Epic)
YL    6    5  Yugurt Lake
YC    7    5  Yugurt Cabin
DF    3   16  The Unbanked Quarter
HM    3   17  Frequency Row
GL    3   15  Old Guard's Corner
```

---

## 11. Adding New Nodes — Checklist

1. Pick a code (2–3 chars, unique in NODE_MAP).
2. Choose grid `(r,c)` — ensure no existing `NODE_COORDS` entry uses that cell.
3. Add to `NODE_MAP` with `act`, `name` (WORLD_DB terrain key), `label`, `text`, etc. **Do not add N/S/E/W fields** — exits are derived from grid adjacency.
4. Add to `NODE_COORDS`.
5. `CELL_GRID` is rebuilt automatically at startup — no manual addition needed.
6. Update docs: `story.md`, `maps.md`, `BACKLOG.md`.

Preferred path: use `POST /api/node` via WBAPI (rejects duplicate coordinates and rejects N/S/E/W fields).

---

## 12. Multiplayer Mesh (§MESH-01, ✅ Incs a–e 2026-07-02 · §MESH-02 connection center 2026-07-07)

Server-to-server presence replication over the node network. Player-facing view: `mechanics.md` "Multiplayer — Mesh Presence"; endpoint quick reference: `wbapi-help.md`; design: `lab-reports/lab-report-mesh-multiuser.md` + `lab-reports/lab-report-mesh-sync-architecture.md`. All state is server-side (no game-file changes beyond `ENGINE_VER`/`WORLD_NAME` consts and the opt-in `MP` client module); since 2026-07-06 (§MESH-01-REVIEW) the mesh kernel — ACL, ingress rate limit, gossip, tracker/federation/bootstrap — lives in `mesh.js`, a factory `require()`d by `wbapi-server.js`, which keeps sessions, SSE fanout, the ledger, and all HTTP routes.

### Sessions and the beacon/move dichotomy

- `SESSIONS` (in-memory, 30 min idle TTL) hold `(r, c)` positions validated against the mover world. Per-session SSE streams (`GET /api/session/events`) carry cell-scoped `player_arrived` / `player_left` / `chat` and the worldwide display-layer exception `player_moved`.
- **`POST /api/session/pos`** — browser-client beacon: passability-validated, display-only, **rolls nothing**; returns `nearby` + `world[]`. **`POST /api/session/move`** — headless MUD clients only: performs the §WALK-5 instanced encounter roll.
- **§NAV-01f room parity** — every look surface (`start`/`move`/`look`/`pos`, all via the shared `buildLook`) carries `room`: the L4 room object from the shared `rooms.js` kernel (icon/title/sub/terrain/prose/exits/signposts/landmarks), byte-equal to the SP client's `describeCell` for the same cell (mud-harness section [M] asserts this against an independently built client-mirror world).
- Every presence surface is **pid-keyed** (`<serverId8>:<sessionId8>`), never name-keyed.

### Replication (single-writer gossip)

- Each server is the **single writer** of its own sessions; peers hold read-only replicas (`MESH.remote`). No relay: gossip payloads carry only the sender's own event log tail (≤100) + full snapshot; the mesh becomes fully connected via PEX instead.
- Rounds every `MESH_GOSSIP_MS` (2 s prod) to ≤3 random peers. Receivers dedup with a per-origin **version vector**; fresh events (≤10 s, `MESH_FANOUT_MAX_AGE`) fan out to local SSE, replays advance the vv silently. Per-origin **snapshots** are the anti-entropy floor — event loss can delay but never corrupt state. Origins silent > 90 s (`MESH_ORIGIN_TTL`) expire.
- **Compatibility gate before everything**: `(proto, engineVer, worldHash)` must match exactly (else 409). `worldHash` = SHA-256/16 over the 8 spatial/mechanical collection source spans + `ENGINE_VER`; narrative tables deliberately unhashed (see `mechanics.md`). Then **ACL** (`mesh-acl.json`, hot-reloaded on mtime: block/allow serverIds/ips/worldHashes, `mode:'allowlist'` for private meshes; applied to ingress → 403, dial-out, and response ingest — one blocklist entry is a full bidirectional partition, which is exactly how the partition-heal harness simulates splits). Start from the committed template `mesh-acl.json.example` (§MESH-01-FU 11 — valid JSON verbatim, `"//"`-keys as comments); a file that exists but fails to parse **fails open** with a loud console warning.

### Rendezvous, bootstrap, reachability

- **Tracker** = a role of the same binary (`--tracker-mode` / `./wbapi-toggle.sh tracker [port]`): rendezvous only, never a relay — serves only ping/manifest/tracker routes (410 otherwise). Announce table groups by full compatibility identity, so incompatible worlds are segregated, never mixed. Trackers federate manually (`--tracker-peer` / `TRACKER_PEERS`, `ageMs` clock-skew-safe younger-wins merge) — or via `tracker <url>` lines in `peers.txt`/`BOOTSTRAP_URLS`, which in tracker mode feed federation instead of announcing (§MESH-01-FU 12; `mesh/status → federationPeers`). The announce table persists to `tracker-cache.json` (`TRACKER_CACHE_FILE`/`TRACKER_PERSIST_MS`), records re-aged by downtime on load, so a quick tracker restart serves peers immediately while a long outage honestly expires them.
- **Bootstrap ladder**: `--peer` flags → `MESH_PEERS` env → `peers-cache.json` → `peers.txt` (incl. `tracker <url>` lines) → `TRACKER_URL` / `BOOTSTRAP_URLS` (plain-text peer lists over HTTP).
- **Reachability**: binds `127.0.0.1` by default; a real LAN/WAN mesh needs `--bind 0.0.0.0` + `--advertise <lan-ip>:<port>`, warned loudly at startup and surfaced in `GET /api/mesh/status.reachability`.

### Where remote players surface

`look.players` / `who.remotes` / `pos.nearby` + `world[]` (all carry `server` + `pid`), SSE events with `remote: true`, and the worldbuilder 🌐 Mesh tab (`GET /api/mesh/status`: identity, peers w/ liveness, remote players, "information passed" packet ring). CLI parity (§MESH-01-FU 10): `./api.sh mesh status` / `mesh peers` / `mesh tracker [url]` — same data, terminal-first, `--json` for tooling (see `wbapi-help.md` §Mesh API). Chat backlog (§MESH-01-FU 13): every look surface carries `chat` — the last ~10 lines said at that cell (local + origin-tagged cross-server); the client replays them once per connect/resume, so a joiner has the conversation context the SSE stream started too late to deliver.

### Sentry bots (§MESH-01h)

- **`POST /api/sentry/deploy`** (`{node}` or `{r,c}`) / **`/recall`** (`{sentryId}`) / **`GET /api/sentry/list`** — a sentry is a **`bot:true` session** stationed at a junction. Being a session, it rides every presence surface for free: co-present players see it in `look.players` / `who` / `player_arrived` tagged **`kind:'sentry'`**. Two ways it differs from a player session: `sessionPrune` **skips bots** (never idle-expires — recall is the only removal), and it never rolls encounters (never calls `/session/move`).
- **Encounter suppression** — `/session/move` nulls the freshly-rolled `s.encounter` when a sentry occupies the destination cell (RNG stream still advances, so the instanced trace stays deterministic; only the result is voided). The response carries `sentryGuard: <name>` when it fired.
- **Auto-assist + economy are client-side** — the browser reads the co-present sentry off presence to add an extra attacker die (`_sentryStrike`) and suppress its own `_enterEmptyCell` roll (`_partyEncounterRate → 0`). The player bankrolls their own posts (`S_story.sentries`: upfront cost + a daily upkeep on rest, recalled if unpaid) — the server only hosts the bot.

### Connection center + operator endpoints (§MESH-02)

The game's Map sheet carries the multiplayer UI as sub-tabs (🗺 Map · 🌐 Connect · 🔭 Discover · 🛡 Lists) — player-facing walkthrough: `mechanics.md §Multiplayer` "Connection center"; design + locked decisions (D2/D3/D4/D6/D7): `lab-reports/lab-report-mesh02-connections-ui.md`. Server surfaces added for it: **`GET/PUT /api/mesh/acl`** (validated merge-write ACL editor over `MESH_ACL_FILE`, comment keys preserved, hot-reload) · **`GET /api/mesh/blocklist`** (403 until the `shareBlocklist` opt-in; publishes the three block* lists only — peers preview and merge manually, never automatically) · **`POST /api/mesh/connect`** (runtime peer/tracker dial, same shapes as `--peer`/`TRACKER_URL`, dials in the same request, outbound ACL-gated) · **`GET /api/session/chat[?limit=&r=&c=]`** (global chat-history ring for the 💬 panel) · footprints on `buildLook` (§MESH-02j — per-cell `[{pid,name,agoMs}]`, ≤8/cell, 30-min TTL, display-only). CLI parity (§MESH-02g): `./api.sh mesh acl|blocklist|connect` — see `wbapi-help.md §Mesh API`. Everything here is connection/display layer: the mover reads none of it.

**Test gates:** `npm run test:mud` — 270 checks, sections [A]–[R] (incl. [R] §MESH-02a ACL editor + blocklist share flip) (incl. [P] rate limiting, the `./api.sh mesh` CLI wrappers, and [Q] §MESH-01-FU 11–13 ACL template / tracker cache+bootstrap / chat backlog) + [H] §MESH-01h sentry cases (deploy→presence, deterministic encounter suppression, recall→leave, prune-immunity), including the Inc (e) partition-heal harness (3 servers + tracker: convergence, exactly-once across partitions via ACL-file split/heal, stale-replica availability, snapshot re-convergence, incompat-refusal + world-group segregation). Playwright: `multiplayer-presence.test.js` 7/7, `mesh-sentry.test.js` 7/7 (client half), `mesh-copresence-buff.test.js` 6/6, `mesh-hireling-guide.test.js` 6/6, `worldbuilder-mesh.test.js` + mesh tab 4/4, `mesh-connections-ui.test.js` 8/8 (§MESH-02f — hermetic connection-center UI, `:1367` route-blocked).

---

## 13. Navigable World — §NAV-01 Layer Stack (✅ closed 2026-07-03)

> Full diagnosis, data shapes, and increment record: `lab-reports/lab-report-nav01-navigable-world.md`. Player-facing surfaces: `maps.md` "ROAD NET & ROOM LAYER"; mechanics: `mechanics.md` "Roads, Rooms & Auto-Travel".

§NAV-01 turned the geometrically correct §WALK world (median named cell 33 blind steps from start, every empty cell identical, every step an encounter roll) into a navigable MUD: rooms + exits + descriptions + safe highways + auto-travel. Nine layers, each reading only the layers below it:

| Layer | Contents | Status |
|-------|----------|--------|
| **L0 GEOMETRY** | `GEO_PROJ` 90×360 equirect 1°, `mover.js` kernel | **FROZEN** — untouched by §NAV-01 |
| **L1 PASSABILITY** | `SEA_RUNS`→`IMPASSABLE_CELLS` · `SEA_LANES` land bridges | **FROZEN** |
| **L2 TERRAIN FIELD** | `_inferTerrain` / server `terrainAt` / `WORLD_DB` / encounter rates; precedence `SEA_LANES→ocean` ▸ `ROAD_CELLS→road` ▸ neighbors ▸ `midlands` | extended (road override) |
| **L3 ROAD GRAPH** | `ROAD_RUNS` RLE fungal net — 400 cells (1.4% of passable), 88 junctions, built by `scripts/build-roads.js` (MST + trunk-reuse Dijkstra), pins in `roads-pins.json`, verified by `check:roads` R1–R4 | NEW (§NAV-01b/h) |
| **L4 ROOMS** | `describeCell(world,pos)` → `{icon,title,sub,prose,exits,signposts}` — ROOMS:CORE in `rooms.js`, inlined byte-identically into the HTML (`check:roomsparity`), `require()`d by the server | NEW (§NAV-01c) |
| **L5 ROUTING & TRAVEL** | pos-origin geo-BFS (wrap + band clamp) · road-weighted `_roadGridPath` · `_travelTick` auto-travel loop with 4 interrupt classes | NEW (§NAV-01a/d) |
| **L6 QUEST WAYFINDING** | Navigate → waypoint, `(n steps, NE)` readouts, arrival detection | NEW (§NAV-01d/e) |
| **L7 PRESENTATION** | exits signage, minimap roads + waypoint ★, map tab 15×21 + amenities, WORLD/GLOBE canvases | NEW (§NAV-01e + map suite) |
| **L8 MUD SERVER** | `session/start\|move\|look\|pos` all carry the same L4 `room` via shared `buildLook` — byte-equal to the SP client (mud-harness [M]) | NEW (§NAV-01f) |

**Authoring (worldbuilder.html):** §NAV-01g drag-&-lock cities (marker drag / lat-lon → `PUT /api/coords`; 🔒 lock persists into `roads-pins.json.locked`, geo-seed never moves locked cities) · §NAV-01h road-net editor (ROAD_RUNS chain-link overlay; vertex drag → pin; ✚ intersection / ┬ T-junction palette; 🔗 link toggle; 🗑 delete; **♻ Reweave Net** = `PUT /api/roads` → `build-roads.js --apply` → `check:roads`, red check rolls the game file back). CLI: `./api.sh roads | reweave`.

**Guard-rails:** mover.js untouched (refusals stay exactly `'oob'`/`'sea'`) · roads are terrain, never permissions · no stored node-to-node edge lists · never hand-edit `ROAD_RUNS` — always ♻ Reweave.

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
