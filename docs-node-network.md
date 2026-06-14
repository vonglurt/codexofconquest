<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# roll2hit.com — Node Network Technical Reference

**File:** `roll2hit-v3.html`  
**Last updated:** 2026-06-13  
**Node count:** ~449 named nodes + thousands of auto-generated J##### junction nodes (to be removed in §CELL-05)

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
| Named junction nodes | 8 | J1–J7, RD | `true` | — | — |
| Auto-generated junction nodes | thousands | J##### | `true` | — | — |
| Epic Battleground | 20 | E* (EF, EH … EG) | — | `true` | — |
| Fishing lake | 2 | YL, YC | — | — | `true` |
| DeFi Land (special Act I) | 3 | DF, HM, GL | — | — | — |
| Mountain pass (hunt) | 1 | MT | — | — | — |
| Ally Cat Arc | 1 | CQ | — | — | — |

> **§CELL-05 note:** All J##### auto-generated junction nodes will be bulk-deleted via a WBAPI endpoint. Named J1–J7 nodes will be reviewed individually — some become traversable empty cells, some may be kept as named nodes.

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

## 3. Connection Object (NODE_MAP)

Each node has a direction map. The N/S/E/W fields are **read-only legacy data** — `cellMove` does not use them for navigation. They are retained for BFS pathfinding (`_bfsPath`) and will be stripped in §CELL-01.

```js
NodeCode: {
  num:   <int>,          // display number (01–78)
  code:  '<str>',        // 2–3 char code
  name:  '<terrain>',    // WORLD_DB terrain key
  label: '<str>',        // display name
  act:   <1–8>,
  N:     '<code>|null',  // north exit (legacy — used by _bfsPath only)
  S:     '<code>|null',  // south exit
  E:     '<code>|null',  // east exit
  W:     '<code>|null',  // west exit
  // Optional extra directions (legacy):
  SW:    '<code>',       // only on DS → epic trench
  spire: '<code>',       // only on HC → epic spire
  // Content:
  text:  '<str>',        // story text
  npc:   '<str>|null',
  battle:{ label, key, count }|null,
  loot:  '<str>|null',
  sleep: <bool>,
  sleepCost: <int>,      // gp cost (0 = free)
  // Flags:
  junction: true,        // J-nodes and RD
  isEpicBattleground: true,
  isFishingLake: true,
  bossKey: '<str>',      // epic nodes only
  portal: '<code>',      // OU → GA
}
```

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

## 5. Corridor Travel System — SUPERSEDED

> The old corridor system (`storyMove` / `storyCorridorTravel` / Manhattan-distance trigger) is **no longer the active navigation path**. `storyMove` was renamed `storyMove_LEGACY` and is retained only until §CELL-05 removes all junction nodes.
>
> See `spec-corridors.md` for the full historical spec.

The corridor overlay (`#story-corridor-overlay`), `buildCorridorMap()`, `CORRIDOR_CELLS`, and `CORRIDOR_TERRAIN` remain in the HTML for minimap wire-glyph rendering. They will be removed in §CELL-05.

---

## 6. Junction Highway System — to be removed in §CELL-05

Named junction nodes (J1–J7, RD) are waypoints that existed to break up long corridor segments. In the cell-grid system, players walk through the cells they occupy as ordinary empty cells. Auto-generated J##### nodes (created by the junction reweave operations) number in the thousands and will be bulk-deleted.

### Named junction coords (for reference until §CELL-05)

```
J1  (5,12)   Midlands Road Fork
J2  (10,4)   Southern Road Cross
J3  (9,3)    Coastal Fork
J4  (12,8)   Deep Road Split
J5  (1,10)   Arctic Overpass
J6  (5,5)    Western Wilds Crossroads
J7  (1,22)   Sky Gate Spur
RD  (5,6)    Roadside Clearing
```

---

## 7. Dead-End Nodes

These nodes have only one NSEW exit (plus any epic/portal extras):

| Code | Label | Single exit |
|------|-------|-------------|
| CQ | The Cat Quarter | W → SL |
| HM | Frequency Row | W → DF |
| GL | Old Guard's Corner | E → DF |
| SF | The Map Shop | W → MQ |
| MS | Aboard the Tilbury Star | W → DK |
| YC | Yugurt Cabin | N → YL |
| OU | The Observatory Outhouse | W → BQ (has portal → GA) |
| GA | Greek Agora | N → KT |
| CO | Cosmic Realm | S → CI (game finale) |

Epic Battleground nodes (E*) all have exactly one exit back to their parent node.

---

## 8. Special Exits

Two nodes have non-NSEW extra exits handled by the `EXTRA_DIRS` block in `_updateExitLinks()`:

| Code | Extra dir | Dest | Note |
|------|-----------|------|------|
| DS | SW | ED (Trench Titan — Epic) | 5th exit |
| HC | spire | EK (Shattered Seraph's Spire — Epic) | 5th exit |

**Portal exits** (not NSEW):

| Code | Portal | Dest |
|------|--------|------|
| OU | portal | GA (Greek Agora) — instant, no encounter |

---

## 9. Waypoint & BFS Pathfinding

`storyWaypoint()` and `_bfsPath()` implement BFS over `NODE_MAP` N/S/E/W edges to find the shortest hop count between any two named nodes. Each step calls `cellMove(dir)`, which moves one cell at a time.

`_bfsPath(from, to)` returns an array of `{dir, code}` steps.

Active waypoint: `S_story.waypoint` (node code string or null).

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
3. Add to `NODE_MAP` with `act`, `name` (WORLD_DB terrain key), `label`, `text`, etc. N/S/E/W fields are legacy and only needed for `_bfsPath` to work before §CELL-01.
4. Add to `NODE_COORDS`.
5. Wire reverse connections for BFS: if `A.N = 'B'` add `B.S = 'A'`.
6. `CELL_GRID` is built automatically at startup — no manual addition needed.
7. Update docs: `story.md`, `maps.md`, `plan.md`.

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
