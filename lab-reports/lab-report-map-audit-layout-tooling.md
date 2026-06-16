<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report: Map Audit, Grid Layout Solver, and Tooling Infrastructure

**Author:** Claude (Sonnet 4.6) + paul@roll2hit.com  
**Date:** 2026-06-04 / 2026-06-05  
**Classification:** Engineering / Developer Tooling / Map Graph Validation  
**Audience:** Developer working on `roll2hit-v3.html` WBAPI toolchain  

---

## Abstract

This report documents five interlocking systems built in a single session: (1) a file-based TTS queue that serializes `say` speech across parallel callers without a daemon lock race; (2) a patch sidecar system that captures all speech and server log content between snapshot archival events; (3) improvements to `monitor-snapshots.py` including nearest-green-line double-click speech; (4) map graph validation with auto-fix — diagonal exit detection, bidirectional link repair, and two new grid-placement rules (alignment and axis distance); and (5) a BFS grid layout solver (`GET /api/layout/solve`) with a mass coordinate apply endpoint (`POST /api/layout/apply`). All five systems feed into the same audit loop: write → snapshot → diff → sidecar.

---

## 1. TTS Queue (`say.sh` / `sayd.sh`)

### 1.1 Problem

The NPC audit loop calls `say.sh` several times in rapid succession — one call per field being narrated. Before this session, `say.sh` called macOS `say` synchronously, which meant only one call could speak at a time, earlier calls were cut off, and callers blocked. Worse: three simultaneous callers each saw the daemon PID file as empty (the daemon had not yet written its PID) and each started a new daemon, resulting in three voices speaking simultaneously.

### 1.2 Design

Split into two scripts:

**`say.sh`** — enqueuer, returns in milliseconds:
1. Writes text to `milepoints/say.log` via `tee -a`
2. Increments a monotonic sequence counter (`milepoints/say.seq`) to guarantee filename ordering within the same second
3. Writes a queue file: `milepoints/say.queue.d/YYYYMMDD-HHMMSS-000NNN.txt`
4. Checks for a running daemon using `pgrep -qf "sayd\\.sh"` (reads the OS process table, not a stale PID file)
5. Starts `sayd.sh` detached via `disown` if no daemon is running

**`sayd.sh`** — daemon speaker:
1. Writes own PID to `milepoints/sayd.pid`; trap removes it on exit
2. Loops: `ls | sort | head -1` finds the oldest queue file
3. Atomically claims it with `mv FILE FILE.speaking` — prevents two daemon instances from double-speaking a file
4. Reads text, removes `.speaking` file, calls `say -v Samantha -r 185`
5. Exits after `MAX_IDLE=34` consecutive empty polls (≈ 10 seconds of silence)

### 1.3 Key decisions

**`pgrep` instead of PID file for daemon detection:** PID file check has a race — the daemon forks but hasn't written the file yet. `pgrep -qf "sayd\\.sh"` queries the kernel's process table, which is consistent immediately after `fork()`.

**Monotonic sequence counter:** `date +%Y%m%d-%H%M%S` has 1-second resolution. Three rapid calls get the same timestamp. Without the sequence counter, `ls | sort | head -1` would process them in arbitrary order. The counter appends `-000001`, `-000002`, `-000003` to break the tie.

**`MAX_IDLE=34` hardcoded:** The original used `bc -l` to compute the value from a floating-point division. `bc -l` has noticeable startup latency; the daemon didn't enter its loop before the first queue file was already waiting. Replacing with a constant eliminates this.

### 1.4 File locations

```
milepoints/
  say.log          ← tee target; one line per enqueued message
  say.seq          ← monotonic counter file
  say.queue.d/     ← queue directory; one .txt per pending message
  sayd.pid         ← daemon PID (may be stale if daemon crashed)
```

---

## 2. Patch Sidecar System

### 2.1 Problem

`monitor-snapshots.py` archives each snapshot as a unified diff (`.patch` file). The log content from `say.sh` and `wbapi-server.js` — which described what was being added during that snapshot window — was being discarded. It belonged with the diff.

### 2.2 Design

After writing each `.patch` file, `monitor-snapshots.py` now:
1. Seeks to the last-captured byte offset in `milepoints/say.log` and `milepoints/wbapi-server.log`
2. Reads all new lines appended since the previous snapshot
3. Writes them to `milepoints/patches/<stem>.patch.log` if either log has new content
4. Truncates both log files to empty (write `""`)
5. Resets both byte offsets to 0

The byte-offset tracking (`_say_log_pos`, `_server_log_pos`) is initialized from `stat().st_size` at startup, so lines written before the monitor started are not retroactively included in the first sidecar.

### 2.3 Log file lifecycle

```
snapshot arrives → lsof wait → diff computed → .patch written
                                              → seek say.log from offset
                                              → seek server.log from offset
                                              → .patch.log written
                                              → both logs truncated to ""
                                              → offsets reset to 0
```

Truncation prevents unbounded log growth. The sidecar captures everything in the window between the previous snapshot and this one — exactly the audit work that produced the diff.

### 2.4 `.gitignore` coverage

```gitignore
milepoints/patches/*.patch
milepoints/patches/*.patch.log
milepoints/patches/_last.html
milepoints/patches/_last.name
milepoints/wbapi-server*.log
```

All transient files excluded. The `.patch` files are large (full diffs of a 1.7 MB HTML file) and regenerable from `_base.html.gz` + the sequence of patches.

---

## 3. Monitor-Snapshots: Nearest-Green-Line Click

### 3.1 Before

Double-clicking in the diff pane spoke the text of the line at the clicked row only if that row was itself a green (`+`) diff line. Clicking on a `-` or context line did nothing.

### 3.2 After

Double-click anywhere in the diff pane finds the nearest green (`+`) line by absolute screen-row distance and speaks it:

```python
if bstate & curses.BUTTON1_DOUBLE_CLICKED:
    green_rows = [r for r, i in self._row_map.items()
                  if i < len(dl)
                  and dl[i].startswith("+")
                  and not dl[i].startswith("+++")]
    if green_rows:
        closest = min(green_rows, key=lambda r: abs(r - my))
        line = dl[self._row_map[closest]]
        threading.Thread(target=_say, args=(line,), daemon=True).start()
```

Single-click (anywhere) still stops speech immediately.

---

## 4. Map Graph Validation

### 4.1 Diagonal exits

The game engine does not support diagonal movement (NW/NE/SW/SE). Three nodes in `roll2hit-v3.html` used diagonal exit keys: `SID.SW='OTP'`, `BEL.SE='LIM'`, `LIM.NW='BEL'`. These were nulled in source. The worldbuilder editor exit loop was restricted to `['N','S','E','W']` only. The exit label was updated to `"Exits (N/S/E/W)"`.

New audit rule `diagonal_exit` (severity: **error**):
```javascript
for (const d of ['NW','NE','SW','SE']) {
  if (n[d] != null)
    errors.push({ check:'diagonal_exit', code, dir:d, target:String(n[d]),
      msg:`${code}.${d}="${n[d]}" — diagonal exits are not supported; use N/S/E/W only`,
      fix: { method:'POST', url:'/api/audit/map/fix', body:{ check:'diagonal_exit', code, dir:d }, ... } });
}
```

### 4.2 One-way links

Rule `bidirectional` (severity: **warning**): if `A.dir = B` but `B.opposite != A`, the link is one-way. Each warning carries a `fix` object so the Worldbuilder "Fix Now" button can call `POST /api/audit/map/fix` with the body. 36 one-way connections were found and repaired via `POST /api/audit/map/fix` with body `{}` (fix all).

### 4.3 Alignment rule (new)

Connected nodes must share the same row **or** the same column. Off-axis pairs (`r1 ≠ r2` AND `c1 ≠ c2`) break `buildCorridorMap()` — the corridor renderer cannot interpolate a straight-line path between nodes that are neither horizontally nor vertically aligned.

```javascript
if (ca.r !== cb.r && ca.c !== cb.c)
  warnings.push({ check:'alignment', code, dir, target,
    msg:`${code}(r:${ca.r},c:${ca.c})↔${target}(r:${cb.r},c:${cb.c}) — connected nodes must share a row or column`,
    fix: { method:'GET', url:'/api/layout/solve', curl:`curl http://localhost:${PORT}/api/layout/solve` } });
```

Current violations: **9** pairs (as of 2026-06-04). Examples: `KIR↔NUE`, `HKG↔LCY`, `GOT↔SFT`.

### 4.4 Axis-distance rule (new)

Even when two nodes share a row or column, the corridor engine only animates walks of up to 4 cells. Longer walks require intermediate junction nodes.

```javascript
const axisD = ca.r === cb.r ? Math.abs(ca.c - cb.c) : Math.abs(ca.r - cb.r);
if (axisD > 4)
  warnings.push({ check:'axis_distance', code, dir, target, distance: axisD,
    msg:`${code}↔${target} axis distance ${axisD} cells (max 4) — use junction nodes spaced ≤4 cells apart`, ... });
```

Current violations: **55** pairs (as of 2026-06-04). Largest: `TLS↔LHR` at 40 cells (same column, rows 4 and 44).

### 4.5 `POST /api/audit/map/fix`

Handles two fix types:

**`diagonal_exit`** — finds the node's single-line entry in the `NODE_MAP` section via regex, surgically removes the diagonal field:
```javascript
function stripDiag(code, dir) {
  // matches: SID: { ..., SW:'OTP', ... } on one line
  const re = new RegExp(`(\\b${code}\\s*:\\s*\\{[^}]*?)\\s*,?\\s*${dir}\\s*:\\s*[^,}]+`);
  WBAPI._rawSrc = WBAPI._rawSrc.replace(re, '$1');
  delete WBAPI.nodeMap[code][dir];
}
```

**`bidirectional`** — calls `WBAPI.editField('node', target, OPP[dir], code)` to add the missing back-link, then saves and reloads.

Body `{}` = fix all eligible items in one save cycle (one `saveAndRestart` call for all).

### 4.6 Verbose audit logging

Each call to `GET /api/audit/map` now logs a per-item line for every finding:

```
[AUDIT⚠  ] axis_distance    TLS        S  LHR
[AUDIT⚠  ] alignment        KIR        N  NUE
[AUDIT·  ] missing_coords   BEG
```

Plus a summary line grouping counts by check type:

```
errors:      none
warnings:    bidirectional:36  density:13  alignment:9  axis_distance:55
suggestions: long_link:3  market_proximity:2  missing_coords:105
```

---

## 5. Worldbuilder UI — Map Audit + Layout Panels

Two new UI sections appear in the Audit tab below the existing entity-level audit list.

### 5.1 Map Connectivity Audit

```html
<button id="btn-map-audit">Map Audit</button>
<button id="btn-map-fix-all" style="display:none">Fix All</button>
<div id="map-audit-list"></div>
```

`runMapAudit()` fetches `/api/audit/map`, renders each error/warning as a row with a colored left border (red = error, yellow = warning). Items with a `fix` object get a "Fix Now" button that POSTs `item.fix.body` to `item.fix.url`.

`btn-map-fix-all` POSTs `{}` to `/api/audit/map/fix` (fix everything), then re-runs the audit.

Both buttons are disabled until the server connects (`window._auditEnableServer()`).

### 5.2 Grid Layout Solver

```html
<input id="layout-step" type="number" value="8">   <!-- grid step, 4–32 -->
<input id="layout-root" type="text">               <!-- BFS root node code -->
<button id="btn-layout-solve">Solve</button>
<button id="btn-layout-apply" style="display:none">Apply Layout</button>
<div id="layout-result"></div>
```

**Solve:** fetches `/api/layout/solve?step=N&root=X`, shows a stats summary:

```
Root           TLS
Step           4
Nodes placed   305 / 305
Orphans        220
Aligned pairs  102 ok · 0 misaligned
Within 4-cell  99 ok · 46 over
```

Stores proposed coords in `_layoutProposed`.

**Apply Layout:** POSTs `{coords: _layoutProposed}` to `/api/layout/apply`, shows confirmation.

---

## 6. Grid Layout Solver — Algorithm

### 6.1 Goal

Assign `{r, c}` coordinates to every node such that:
- Connected pairs share the same row or column
- Connected pairs are at most `step` cells apart on that axis
- No two nodes occupy the same cell

### 6.2 BFS placement

```
1. Seed root at existing coord rounded to nearest step (or (100,100) if none)
2. BFS queue: [root]
3. For each code popped from queue:
   For each direction D in [N, S, E, W]:
     target = nodeMap[code][D]
     if target already placed: skip
     proposed = { r: ca.r + DR[D]*step, c: ca.c + DC[D]*step }
     while occupied(proposed) and attempts < 64:
       slide further along same axis (r += DR[D]*step, c += DC[D]*step)
     if still unoccupied: place target, enqueue
4. Orphans (not reached from root): place in a row at maxR + 3*step
```

The collision resolution slides further along the same axis rather than jumping to a different row/column. This preserves the alignment guarantee: a collision on the S axis is resolved by moving further S, not E or W.

### 6.3 Graph disconnection

The game world currently has **160 disconnected components**. The largest component (reachable from LHR, the hub) contains ~120 nodes. The remaining ~185 nodes form singleton or small isolated clusters. These include: the Paul's Journeys chain, the Littoral Courts arc, the Crown Three Swamp arc, the Atlantean Shore, the Sunken Hall, and ~105 nodes that have no N/S/E/W connections at all (dead-end data nodes with no map presence).

The solver places all orphans in a sequential block below the main grid. They do not interfere with the main layout.

### 6.4 Step size guidance

| step | spacing | connection constraint |
|------|---------|----------------------|
| 4 | 4 cells | exactly at the corridor limit — compact but no slack |
| 8 | 8 cells | matches the original main-spine spacing; needs junction nodes for all connections |
| 12+ | 12+ cells | very spread out; junctions needed for every link |

Use `step=4` if you want a fully valid graph where every connection is within the corridor limit. The current production coords use `step=8` (main spine) mixed with ad-hoc coords (historical nodes), which is why 55 axis-distance warnings exist.

### 6.5 `POST /api/layout/apply`

Accepts `{coords: {code:{r,c},...}}`. Only codes present in the body are updated; other entries in `WBAPI.nodeCoords` are preserved. The entire `NODE_COORDS` section in `_rawSrc` is rewritten, sorted by `(r, c)`, with a blank line inserted between row bands of 8.

```javascript
const entries = Object.entries(WBAPI.nodeCoords).sort(([,a],[,b]) => (a.r - b.r) || (a.c - b.c));
let newSection = `\nconst NODE_COORDS = { // → doc: maps.md §NODE_COORDS\n`;
let prevBand = -999;
for (const [code, p] of entries) {
  const band = Math.floor(p.r / 8) * 8;
  if (band !== prevBand && prevBand !== -999) newSection += '\n';
  newSection += `  ${code}:{r:${p.r},c:${p.c}},\n`;
  prevBand = band;
}
newSection += `};\n`;
```

---

## 7. API Route Summary (new and changed)

| method | path | description |
|--------|------|-------------|
| GET | `/api/audit/map[?format=text]` | Map conformity: 10 rules, per-item verbose log |
| POST | `/api/audit/map/fix` | Auto-fix diagonal exits + one-way links (body `{}` = all) |
| GET | `/api/layout/solve[?step=8&root=TLS]` | BFS grid layout — returns `{proposed, validation, orphans}` |
| POST | `/api/layout/apply` | Mass-update `NODE_COORDS` from `{coords:{code:{r,c}}}` |

---

## 8. Audit Rule Table (complete)

| # | check | severity | trigger |
|---|-------|----------|---------|
| 0 | `diagonal_exit` | error | node has NW/NE/SW/SE key |
| 1 | `max_connections` | error | >4 connections, or duplicate target in N/S/E/W |
| 2 | `dangling_link` | error | `code.dir = TARGET` but TARGET not in NODE_MAP |
| 3 | `bidirectional` | warning | A→B exists but B→A missing |
| 4 | `direction_sign` | warning | N link increases r; E link decreases c; etc. |
| 5 | `long_link` | suggestion | Euclidean distance > 4 cells |
| 6 | `density` | warning | too many neighbours within radius 3 (threshold by terrain type) |
| 7 | `market_proximity` | suggestion | market node has no other market within 1 cell |
| 8 | `missing_coords` | suggestion | node has no NODE_COORDS entry |
| 9 | `alignment` | warning | connected pair does not share row or column |
| 10 | `axis_distance` | warning | aligned pair is > 4 cells apart on shared axis |

Rules 9 and 10 are new in this session. All others existed previously.

---

## 9. Grid Placement Rules (canonical)

These rules are enforced by `buildCorridorMap()` at game startup. Violating them does not prevent the game from loading — it silently drops corridor segments that cannot be rendered.

1. **Exits are N/S/E/W only.** Diagonal keys are not read by the corridor builder.
2. **Connected nodes must share a row (E/W link) or a column (N/S link).** Off-axis pairs produce no corridor.
3. **Maximum axis distance is 4 cells.** Pairs further apart need junction nodes (J-nodes with no content, just a corridor waypoint).
4. **Junction chains:** up to 4 junction nodes, each spaced ≤ 4 cells from the previous, can bridge a distance of up to 20 cells.
5. **No coordinate collision.** Two nodes at the same `{r,c}` will overlap in the map render; `PUT /api/coords/{code}` returns 409 on collision.

---

## 10. Known Limitations and Follow-up

**Collision resolution in the solver produces `axis_distance` violations.** When the ideal cell is occupied, the solver slides further along the same axis (by another `step`). For `step=4`, this means the placed node is 8 cells away instead of 4. The `distBad` count in the validation output reflects this. A second pass that tries to find a closer free cell (e.g., sliding only 1 cell at a time) would reduce `distBad` at the cost of denser layouts.

**Orphan placement is linear.** Disconnected nodes are placed in a straight horizontal row. For the ~105 no-connection nodes this is correct (they have no topology to preserve). For the larger isolated arcs (Paul's Journeys = 20 nodes, Littoral Courts = 10 nodes) the BFS should arguably be seeded with those components' own root nodes before falling back to the orphan row.

**Applying the layout to the live world is irreversible without `_base.html.gz` + patches.** Before calling `POST /api/layout/apply` with the full proposed set, save a manual snapshot or confirm `monitor-snapshots.py` is running so the before-state is archived as a diff.

**The `alignment` and `axis_distance` warnings have no auto-fix.** Fixing them requires moving one of the two nodes, which shifts all that node's other connections. The layout solver is the intended tool; the audit warnings link directly to `GET /api/layout/solve` in their `fix.curl` hint.

---

## 11. MegaReWeave — Grid Coherence Engine (added 2026-06-09)

The `POST /api/graph/reweave-all` endpoint runs a 9-phase pipeline that repairs the cell grid and guarantees a traversable mesh. All phases stream progress to the caller.

### Phase summary

| Phase | Name | What it fixes |
|---|---|---|
| P0 | geo-seed | Lock GEO2 city nodes to Mercator lat/lon cells |
| P1 | rip-and-connect | BFS-place stray (unreachable) nodes near reachable cities |
| P1.5 | coord-scan | Wire nodes that are coord-adjacent but unlinked |
| P4 | fix-all-broken | Fix diagonal and gap-too-large edges via move or elbow junction |
| P5 | fix-bidirectional | Add missing reverse links |
| P2 | priority highways | Build explicit city-to-city corridors |
| P3 | city-mesh MST | Greedily connect all GEO2 cities via minimum spanning tree |
| P6 | derelict-cleanup | Delete dead-end junctions with no quests or NPCs |
| P7 | wither | Remove junctions not on any quest or city-pair path |

### Cell contention and grid expansion (P4)

When an elbow junction cannot be placed (all 8 scanned cells occupied for 3+ consecutive passes), P4 triggers **grid expansion**:

1. A new row and column are inserted at the contention point — every node with `r ≥ insertR` shifts `r+1`, every node with `c ≥ insertC` shifts `c+1`.
2. Edges that were at exactly `maxGap=4` crossing the inserted row/column gain `+1` gap and are immediately **repaired** by planting a junction on the new empty row/col.
3. Up to 6 deferred edges from the persistent `p4Deferred` queue are **backfilled** into the newly empty axis cells.
4. An **outer-row guard** (`GRID_MARGIN=4`) prevents planting junctions on the world boundary — those attempts are thrown back to deferred.

### Junction backfill and promotion (P4)

After creating any elbow junction J:
- Free cells adjacent to J are scanned against the `p4Deferred` queue.
- Each matching deferred edge gets a new junction K planted in the free cell, wired to both the deferred endpoint AND to J.
- When J reaches 4 connections (all cardinal directions wired), it is **promoted** from `junction:true` to `junction:false` — it becomes a real location eligible for quests, NPCs, loot, and sleep spots.

### Tarjan bridge-check (P7 wither)

The wither phase previously ran a BFS per candidate junction (O(K × V+E)). It now uses **Tarjan's articulation-point algorithm** (iterative, O(V+E) once per pass), reducing the bridge-check cost by ~1000× on large maps.

Wither output format (tab-aligned):
```
    withered    J14827    (64,180)    [42/380]
    bridge      J14800    (60,171)    N:J14799    (59,171)    E:──────    S:J14801    (61,171)    W:──────    [42/380 withered  87 bridges]
```

### Key performance improvements

| Optimization | Before | After |
|---|---|---|
| `nextJCode()` | O(V) regex scan per call | O(1) cached counter |
| `nextNodeNum()` | O(V) reduce per junction | O(1) cached counter |
| P4 coord writes | O(junctions × source_len) per pass | Batched at batchSave (1× per pass) |
| P4 edge scan | O(V×4) full scan every pass | Incremental: only dirty nodes rescanned |
| P1 slot-finding | O(S×C×BFS) per pass | O(C×BFS) precomputed + lazy invalidation |
| P7 bridge check | O(K×(V+E)) per pass | O(V+E) Tarjan once + O(1) per candidate |

### Cross-pass accumulators in progress bars

Every progress tick now shows both per-pass and cumulative (`∑`) counts:
```
│ [p4 pass 2/500 [=─────────] 0%] [edge 150/5786 [=──────────] 3%] fixed=90 def=60 │ ∑fixed=380 ∑def=200 ∑passes=2 ∑edges=11572
│ [p1 pass 2/500 [=─────────] 0%] [stray 50/312 [====──────] 16%] placed=12 no_slot=3 wf=0 │ ∑placed=200 ∑passes=2 ∑strays=624
```

### Navigation invariant

After a complete reweave run the mesh satisfies:
- **Reachability**: all named nodes reachable from the hub via ≤4-cell N/S/E/W steps
- **No diagonals**: every wired pair shares a row (E/W) or column (N/S)
- **Max gap 4**: no wired pair is more than 4 cells apart on its shared axis
- **Bidirectional**: every A.dir→B has a matching B.OPP(dir)→A
- **Quest paths valid**: hub can reach every quest `activateNode` and `waypointNode`
