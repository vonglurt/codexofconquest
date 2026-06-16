<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# MegaReWeave — Procedure & Configuration Guide

**Command:** `./api.sh reweave --execute`
**Endpoint:** `POST /api/graph/reweave-all` (streaming, no timeout)

---

## What it does

MegaReWeave is a single server-side loop that repairs and builds the full world node network in seven phases, streaming verbose progress as it runs. No timeout — the connection stays open until every phase completes.

| Phase | Name | What happens |
|-------|------|-------------|
| P0 | Geo-seed | Locks all 76+ GEO2 cities to Mercator lat/lon grid coordinates. This is the stable foundation — run every time before building highways. |
| P1 | Rip-and-connect | Relocates stray (unreachable) nodes near their quest cities. Runs up to `maxRip` passes, stops when strays=0. |
| P2 | Priority highways | Builds explicit L-shaped junction chains between named city pairs in order. Add new pairs here for one-off connections. |
| P3 | City mesh MST | Greedy minimum-spanning-tree: connects every GEO2 city to the reachable mesh in nearest-first order. Stops when all GEO2 cities are reachable or limit hit. |
| P4 | Fix-all-broken | Repairs diagonal and gap edges. Stops when broken count plateaus for 2 consecutive passes (prevents runaway cascade). |
| P5 | Fix-bidirectional | One pass: clears diagonal exits, wires one-way A→B links back to B→A. |
| P6 | Derelict cleanup | Deletes junction nodes with no quests/NPCs and degree ≤ 1 (dead-end scaffolding from prior repair passes). Loops until none remain or limit hit. |
| P7 | Wither | Snail-traverses every quest path (BFS from hub to each `activateNode`/`waypointNode`). Junctions not on any quest desire path AND not structural bridges are deleted. Multi-pass until stable. Skip with `--no-wither`. |
| P8 | Final check | Reports reachability %, broken edge count, unreachable node count. Declares MAP IS STABLE when 100% reachable and 0 broken. |

---

## Running it

```bash
# Dry-run (reports only, no writes)
./api.sh reweave

# Full execute
./api.sh reweave --execute

# With custom limits (default: maxRip=5, maxFix=5, step=4)
./api.sh reweave --execute --max-rip 3 --max-fix 3

# Skip geo-seed (if cities are already locked)
./api.sh reweave --execute --no-geo-seed

# Skip city mesh phase
./api.sh reweave --execute --no-city-mesh

# Skip derelict cleanup
./api.sh reweave --execute --no-derelict
```

---

## Adding a new city (lat/lon)

Edit the `GEO2` table in `wbapi-server.js` inside the `reweave-all` handler (search for `const GEO2`). Add one line:

```javascript
const GEO2 = {
  // ... existing entries ...
  NEW:{lat:48.8,lon:2.3},   // e.g. Paris (already FRK, this is hypothetical)
};
```

- `lat` — geographic latitude (positive = north, negative = south)
- `lon` — geographic longitude (positive = east, negative = west)
- The node code must already exist in `NODE_MAP`
- Grid formula: `r = gridMin + (maxLat - lat) / range * gridSize` (north = low row)
- Default bounds: lat −8→68, lon −25→72, grid 8→500

After adding, run `./api.sh reweave --execute` and Phase 0 will place the city at its correct Mercator position.

---

## Adding a priority highway

Edit the `PRIORITY_HIGHWAYS` array in `api/wb.js` (search for `PRIORITY_HIGHWAYS`):

```javascript
const PRIORITY_HIGHWAYS = [
  { from:'MLN', to:'TRB', note:'Fix MLN south — Mombasa to Black Sea coast' },
  { from:'CVP', to:'SAM', note:'Iberia to Central Asia' },
  { from:'HHL', to:'GEDI', note:'Iceland to Horn of Africa' },
  { from:'HEO', to:'TUNPAR', note:'Denmark to unknown' },
  // Add here:
  { from:'ROM', to:'CON', note:'Rome to Constantinople spine' },
];
```

Highways run in Phase 2, before the city mesh. Use them for:
- Critical long-distance connections that the MST might miss
- Fixing known geographic misplacements
- Named trade routes that should be explicit in the world

Each highway is an L-shaped junction chain (longer axis first, then turn).

---

## Wither phase (P7)

The Wither phase simulates a **snail** walking every quest's desire path and then prunes any junction that no quest ever used.

**Algorithm:**

1. Collect every `activateNode` and `waypointNode` across all quests.
2. BFS shortest path from the hub to each quest node. Every junction the snail walks through gets its traversal count incremented.
3. Any junction with traversal count = 0 is a **wither candidate** (unused by any quest path).
4. **Bridge check**: for each candidate, temporarily remove it from the graph and BFS from the hub. If every named (non-junction) node is still reachable, the candidate is not a structural bridge and is safe to delete. If removing it would disconnect a named node, it is kept.
5. All safe candidates are deleted: neighbors unwired, node removed from `NODE_MAP`, coordinates removed.
6. Repeat (multi-pass) until no unused non-bridge junctions remain — typically 2–5 passes.

**What it guarantees:**

- All named nodes remain reachable after withering (bridge check enforces this).
- All quest paths remain traversable (junctions on quest desire paths are kept).
- Unused parallel paths — extra junction chains built by rip-and-connect or highways that no quest actually uses — are pruned.
- Territory junctions have no gameplay value (they can be recreated); the bridge check is the only invariant that matters.

**Flags:**

```bash
./api.sh reweave --execute              # wither is ON by default
./api.sh reweave --execute --no-wither  # skip P7
```

**Dry-run** reports `junctions tracked=N  unused=K` without deleting anything.

---

## Derelict junctions

A **derelict** junction is one that:
1. Has `junction: true` in NODE_MAP (created by automated repair tools)
2. Is NOT referenced by any quest (`activateNode`, `waypointNode`)
3. Has NO NPC stationed there
4. Has degree ≤ 1 (dead-end or fully disconnected)

These accumulate from fix-all-broken and rip-and-connect passes when nodes are relocated and their old scaffolding is left behind.

**Phase 6 cleanup runs in a loop** — each pass removes degree-0 and degree-1 derelicts, which may expose more derelicts in the next pass (e.g., a degree-2 junction whose one neighbor was just deleted becomes degree-1). Up to 20 passes, stops when none remain.

Degree-2+ derelicts (nodes in the middle of a path) are **not** auto-deleted. They may be legitimate infrastructure. Use `./api.sh audit --map` to review them manually.

---

## Getting to a stable map

A stable map is: **100% reachable AND 0 broken edges**.

Typical iteration path:
1. **First run** after geo-seed: expect many broken edges from city relocations. Reachability may drop initially as junctions are moved off their old positions.
2. **Second run**: rip-and-connect + city MST will start to settle. Broken edges decrease.
3. **Third run**: fix-all-broken plateau detection should kick in earlier. Derelicts start getting cleaned.
4. **Stable**: broken edges reach cosmetic-only levels (diagonal = visual, no gameplay impact). Reachability 100%.

**If reachability drops after geo-seed**: this is expected. The old junction scaffolding is misaligned. Run again — Phase 3 will rebuild city connections on the new coordinates.

**If broken count keeps rising**: fix-all-broken is in a cascade (each fix spawns a new junction that's immediately off-axis). The plateau detection (2 consecutive non-improving passes) will stop it. The derelict cleanup in Phase 6 then removes the orphaned scaffolding.

---

## Loop limits reference

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `--max-rip` | 5 | Max rip-and-connect passes |
| `--max-fix` | 5 | Max fix-all-broken passes |
| `--step` | 4 | Junction spacing (grid cells) |
| `--limit` | 100 | Max nodes per rip-and-connect pass |
| `--radius` | 6 | BFS radius for city-search in rip-and-connect |
| `--no-wither` | (off) | Skip Phase 7 wither entirely |
| MAX_MESH | 76+ | City MST loop limit (auto: city count + 10) |
| MAX_CLEANUP | 20 | Derelict cleanup loop limit |
| MAX_WITHER | 20 | Wither multi-pass limit |

All limits prevent runaway. The streaming connection has no timeout — the server sends a line for every operation so the client never goes silent.

---

## See also

- `API-README.md §Validation` — individual repair commands
- `docs-node-network.md` — node network architecture
- `lab-report-node-network-reconnection.md` — history of the 89%→100% repair session
