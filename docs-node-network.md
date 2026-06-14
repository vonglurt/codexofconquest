<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# roll2hit.com — Node Network Technical Reference

**File:** `roll2hit-v3.html`  
**Last updated:** 2026-06-15  
**Node count:** 687 nodes (J##### junction nodes bulk-deleted in §CELL-05)

---

## 1. Grid System

All nodes have a grid coordinate `{r, c}` stored in `NODE_COORDS`. The grid is at least 16 rows × 200 columns (expanded by the 1367 import; the 1367 region extends to c ≈ 428).

```
r = 1 (north) → 300 max (south)
c = 1 (west)  → 300 max (east)
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

> **§CELL-05 complete:** All 21,046 boilerplate junction nodes were bulk-deleted. J13 (The Western Sea Road) and WRO (Midlands Road Fork) had real narrative text and were promoted to named midlands nodes.

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

Each node is a self-describing record. **N, S, E, W, SW, and spire direction fields were stripped in §CELL-01** — exits are derived at runtime from `CELL_GRID` adjacency, not stored data.

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
  junction: true,        // J-nodes and RD (to be removed in §CELL-05)
  isEpicBattleground: true,
  isFishingLake: true,
  bossKey: '<str>',      // epic nodes only
  portal: '<code>',      // OU → GA (distinct mechanic, not a nav edge)
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
  ├─ cellMove(dir) called
  │   ├─ Compute (nr, nc) = (playerR ± 1, playerC ± 1)
  │   ├─ Bounds check: nr/nc must be 1–300
  │   ├─ IMPASSABLE_CELLS check (water — populated in §CELL-10)
  │   ├─ Gate-lock checks (TLS shards, Damascus gate, etc.)
  │   ├─ destCode = CELL_GRID["nr,nc"]
  │   │
  │   ├─ destCode found in NODE_MAP → storyRender(NODE_MAP[destCode])
  │   └─ destCode not found → _enterEmptyCell(nr, nc)
  │
  └─ S_story.playerR / playerC updated; visitedCells["r,c"] = true
```

### Empty cell traversal (§CELL-04, ✅ active)

When the player steps on a cell with no named node:

1. `_inferTerrain(r, c)` — polls the four cardinal neighbors in `CELL_GRID`; returns the majority terrain (`NODE_MAP[code].name`), fallback `'midlands'`.
2. Exits list — all four cardinal directions are shown with labels if a named node is adjacent.
3. Random encounter — rolls against `TERRAIN_ENCOUNTER_RATE[terrain]`; if triggered, picks a monster from `WORLD_DB[terrain].monsters` and calls `_startStoryBattle`.

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

### Gate locks

All gate-lock checks from the old `storyMove` are preserved verbatim in `cellMove`, using `destCode` (from `CELL_GRID`) rather than `node[dir]`. See `cellMove()` in the HTML (~143404).

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
| OU | The Observatory Outhouse | W → BQ (has portal → GA) |
| GA | Greek Agora | N → KT |
| CO | Cosmic Realm | S → CI (game finale) |

Epic Battleground nodes (E*) all have exactly one grid neighbor — their parent node.

---

## 8. Special Exits

`SW` and `spire` direction fields were stripped in §CELL-01. DS → ED and HC → EK are now co-located in CELL_GRID at adjacent cells; no stored edge is needed.

**Portal exits** (stored as `portal` field — distinct mechanic, not a nav edge):

| Code | Portal | Dest |
|------|--------|------|
| OU | portal | GA (Greek Agora) — instant warp, no encounter |

The `portal` field was preserved during §CELL-01 stripping because it drives `storyPortal()`, which is a teleport mechanic, not a grid movement.

---

## 9. Waypoint & BFS Pathfinding (§CELL-09, ✅ active)

`_bfsGridPath(fromCode, toCode)` walks `CELL_GRID` one cell at a time using standard BFS. It returns a path of `{r, c, code}` steps from the player's current position to the target node. No stored edge data is used.

```js
// First step direction toward a waypoint
function _bfsGridDir(fromCode, toCode) {
  const path = _bfsGridPath(fromCode, toCode);
  if (!path.length) return null;
  const startCoord = NODE_COORDS[fromCode] || { r: S_story.playerR, c: S_story.playerC };
  const dr = path[0].r - startCoord.r;
  const dc = path[0].c - startCoord.c;
  return dr < 0 ? 'N' : dr > 0 ? 'S' : dc > 0 ? 'E' : 'W';
}
```

`storyWaypoint()` calls `_bfsGridDir` and then `cellMove(dir)` to auto-step toward the objective. The dpad buttons are highlighted with `.dpad-wp` for the waypoint direction in `_updateExitLinks()`.

**Hunt Mode:** When `S_story.huntMode` is true, `_enterEmptyCell` rolls at `effectiveRate = 1.0` (guaranteed encounter). Named-node encounters are unchanged. The quest-stalked monster selection (`_stalkedMonsterPick`) is still used for node battles.

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
6. Update docs: `story.md`, `maps.md`, `plan.md`.

Preferred path: use `POST /api/node` via WBAPI (rejects duplicate coordinates and rejects N/S/E/W fields).

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
