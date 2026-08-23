<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Worldbuilder Grid UI — Design Decisions & Usage Guide

**Roll2Hit World Builder — Engineering Report**
*2026-06-09*

---

## Overview

The Grid Tools tab (`🔲 Grid`) is the primary interface for world map maintenance.
It exposes the coordinate mesh directly — nodes at their actual (r,c) positions,
edges colored by health, and a full action panel for inserting, fixing, and
navigating the network without leaving the browser.

---

## 1. Design Decisions

### 1.1 Why Cell Grid, Not Force-Directed

The existing **Map** tab uses a force-directed layout seeded from NODE_COORDS.
Force-directed layouts are good for *understanding connectivity* but bad for
*understanding coordinate problems*, because they move nodes to improve visual
clarity regardless of their actual grid positions.

The **Grid** tab renders every node at its true `NODE_COORDS` position.
This makes two things immediately visible:
- **Broken edges** (diagonal lines) show up as diagonal strokes between dots
  that should be on the same row or column — impossible to miss
- **Dense clusters** show up as overlapping circles, immediately revealing
  coordinate collisions or over-packed city districts

**Rule**: Use Map tab for narrative/quest context. Use Grid tab for coordinate work.

### 1.2 Degree Color Coding

| Color | Degree | Meaning | Action |
|-------|--------|---------|--------|
| 🟢 Green | 0–2 | Open — accepts new connection directly | Connect or extend |
| 🟡 Yellow | 3 | One slot left — junction-first rule applies | Spawn junction, then connect |
| 🔴 Red | 4 | Full — no direct insertion possible | Use smart-connect to find mesh entry |
| Orange halo | any | Unreachable from hub | Needs rip-and-connect |

**Rationale**: The color tells you exactly what action to take without counting connections manually.
City interiors may legitimately reach red (4 connections). Road junctions should
stay at green/yellow. Dead ends (degree 1) are green but represent routing dead ends.

### 1.3 Edge Colors

| Color | Style | Meaning |
|-------|-------|---------|
| 🔵 Blue | Solid | Axis-aligned, gap ≤ 4 — valid traversal |
| 🔴 Red | Dashed | Broken — diagonal, or gap > 4 |

A red dashed edge means `_buildNodeExits()` will NOT find this connection at runtime.
The player cannot walk it even though NODE_MAP declares it.

### 1.4 Not-on-Grid Sidebar

Nodes without NODE_COORDS are invisible on the game map but still have quests,
NPCs, and connections. They are shown in the **Not on Grid** sidebar. Clicking
one jumps to it in the Map tab for closer inspection. Running
`./api.sh rip-and-connect --execute` relocates them automatically.

### 1.5 Drag-to-Move

Fixing broken edges requires moving nodes to axis-aligned positions. The canonical
workflow was: look up coordinates, calculate the correct value, type a curl command.
Drag-to-move replaces this with: grab the circle, drag it onto the correct row/column,
release. The canvas snaps to integer grid coordinates and calls `POST /api/graph/move`
automatically.

**Snap rules during drag:**
- Hold **Shift** to snap to the same row as the drag origin (force axis-aligned E/W move)
- Hold **Alt** to snap to the same column (force axis-aligned N/S move)
- Default: snap to nearest integer (r, c)

### 1.6 Auto-Junction at Degree 3

When adding a new connection to a node that already has 3 connections:
- **Old behavior**: fill the 4th slot (node becomes full/red; no capacity left)
- **New behavior**: auto-create a junction node first, then connect to the junction

The junction inherits terrain from the source node and gets a signpost label.
The source node remains at degree 3 (yellow), preserving routing capacity.

This is enforced in the API (`PUT /api/node` with any directional field on a deg=3 node)
and in the Grid UI's "Add direction" buttons.

### 1.7 "Add Direction" Quick Create

Clicking `[→ N]` / `[→ E]` / `[→ S]` / `[→ W]` on a selected node opens an
inline creation form with:
- Coordinates pre-filled (current node position ± 1 in the chosen direction)
- Terrain inherited from parent
- Act inherited from parent
- Auto-junction warning if parent is at deg=3

This removes the need to calculate coordinates or remember field names for simple
insertions.

---

## 2. The Insertion & Map Fix Workflow

### Step 1 — Open Grid Tab and Refresh

```
🔲 Grid → [⟳ Refresh]
```
Read the health bar:
- **510/597 reachable (85%)** → identify the gap
- **213 broken edges** → red dashed lines on the canvas
- **87 without coords** → sidebar count

### Step 2 — Quick Filter to Focus

Use the filter bar:
- **[Broken]** — highlights only nodes involved in broken edges
- **[Stray]** — highlights unreachable nodes (orange halo)
- **[Deg-4]** — highlights full nodes that block insertion
- **[Dead Ends]** — highlights degree-1 nodes that should be extended

### Step 3 — Drag Broken Nodes to Axis

For each red dashed edge:
1. Click one endpoint to select it (detail panel shows the broken connections)
2. Note which direction it should align: same row (E/W) or same column (N/S)
3. Hold **Shift** (row lock) or **Alt** (col lock) and drag to the correct position
4. Release — `POST /api/graph/move` fires automatically
5. Edge redraws blue ✓

### Step 4 — Add Missing Connections

For isolated nodes (orange halo):
1. Select the nearest well-connected reachable node
2. Click `[Find Open Slots]` — the sidebar shows open attachment points
3. Use `[Smart Connect ▼]` form to auto-route from the isolated node's nearest city

### Step 5 — Add New Content Near a City

1. Select the target city in the canvas (e.g. LHR)
2. Click `[→ S]` in the direction panel
3. Fill in: Label, Terrain, Act
4. If LHR is at deg=3, the form shows:
   > *Junction will be created first — your node attaches to the junction*
5. Click `[Create & Connect]`

The server creates: `LHR → J{next} → new-node`, all properly wired and coordinated.

### Step 6 — Auto-Fix Remaining Issues

```
[Fix All Broken]  →  runs ./api.sh fix-all-broken --execute
[Rip+Connect]     →  runs ./api.sh rip-and-connect --execute --limit 50
```

### Step 7 — Validate

After each batch:
```
[⟳ Refresh]  →  re-runs BFS + broken-edge check, updates health bar
```
Target: all green. **100% reachable. 0 broken edges.**

---

## 3. Power User Section — Reference

### Quick Query Buttons

| Button | What it shows |
|--------|--------------|
| `[All]` | Full grid, no filter |
| `[Broken Edges]` | Highlight nodes with ≥1 broken edge |
| `[Stray / Unreachable]` | Highlight nodes not reachable from hub |
| `[Deg-4 Full]` | Highlight nodes with 4 connections (routing blocked) |
| `[Dead Ends]` | Highlight degree-1 nodes (one connection only) |
| `[No Coords]` | Nodes from sidebar, flash on canvas if nearby |
| `[Find Open near {sel}]` | Run find-open-location BFS from selected node |

### Smart Connect Form

```
From: [LHR]  To: [CON]  Radius: [6]  [→ Connect Mesh]
```
Finds insertion points in each city's mesh, shows the plan, applies it.

### Highway Builder

```
From: [KOL]  To: [REG]  Step: [4]  [Build Highway ▶]
```
Creates the full junction chain: horizontal leg → elbow → vertical leg.

### Rip and Connect

```
Limit: [50]  [Execute Rip+Connect]
```
Auto-relocates stray nodes near their most quest-associated city.

### Drag Interaction Details

| Gesture | Effect |
|---------|--------|
| Click node | Select, show detail panel |
| Drag node | Move to new coordinates (snaps to integer grid) |
| Shift+Drag | Lock to same row (axis-aligned E/W move) |
| Alt+Drag | Lock to same column (axis-aligned N/S move) |
| Scroll | Zoom in/out (scale 4–30 px/unit) |
| Click empty cell | Deselect |
| Right-click node | Context menu: Fix Broken, Add Direction, Delete |

### Keyboard Shortcuts (while Grid tab active)

| Key | Action |
|-----|--------|
| `R` | Refresh health |
| `F` | Fit to window (auto-scale) |
| `B` | Toggle broken-only filter |
| `S` | Toggle stray-only filter |
| `Esc` | Deselect |
| `Delete` | Delete selected node (with confirmation) |
| `N` / `E` / `S` / `W` | Open "Add direction" form for selected node |

---

## 4. API Changes

### Auto-Junction Rule (enforced server-side)

`PUT /api/node/{code} {"N":"target"}` where `code` has deg=3:

**Old behavior**: sets `code.N = target`, deg becomes 4.

**New behavior**: 
1. Creates junction `J{next}` at `(code.r - 1, code.c)` (1 step in direction)
2. Sets `code.N = J{next}`, `J{next}.S = code`
3. Sets `J{next}.N = target`, `target.S = J{next}`
4. Returns `{ ok, autoJunction: J{next}, chain: "code → J{next} → target" }`

Override with `{"N":"target","autoJunction":false}` to bypass.

### New Endpoints Used by Grid UI

| UI Action | API Call |
|-----------|---------|
| Drag-to-move | `POST /api/graph/move {code, r, c}` |
| Add direction + create | `POST /api/node {code, name, label, act, r, c, [dir]: parentCode}` |
| Find open slots | `GET /api/graph/find-open-location/{code}?radius=8` |
| Smart connect | `POST /api/graph/smart-connect {from, to, meshRadius}` |
| Fix all broken | `POST /api/graph/fix-all-broken` (new wrapper endpoint) |
| Rip+connect | `POST /api/graph/rip-and-connect {dryRun, limit}` |
| Auto geo-seed | `POST /api/layout/geo-seed {dryRun}` |

---

## 5. Future Considerations

### District Map (Level 1.5)
A medium zoom between region (lat/lon) and city (game units).
Shows 20–50 game-unit radius around a city: junctions, sub-districts, roads.
Command: `./api.sh worldmap --district LHR`

### Connection Validation On-Draw
When drawing a new edge via UI, preview the resulting edge in real time:
- Blue preview = will be valid
- Orange preview = will need elbow junction
- Red preview = target node is full (deg=4)

### Route Highlight
Click two nodes, press `[R]` → highlight the BFS path between them.
Shows hop count, terrain types, battles along route.

### Undo / Redo
Each move/wire action is recorded. `Ctrl+Z` calls `POST /api/graph/move`
with the previous coordinates. Critical for bulk drag sessions.
