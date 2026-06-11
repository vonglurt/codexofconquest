<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# roll2hit.com — Node Network Technical Reference

**File:** `roll2hit-v3.html`  
**Last updated:** 2026-05-25  
**Node count:** 78 (42 story + 8 junction + 20 epic + 8 special/lake)

---

## 1. Grid System

All nodes have a grid coordinate `{r, c}` stored in `NODE_COORDS`. The grid is 16 rows × 26 columns.

```
r = 1 (north) → 16 (south)
c = 1 (west)  → 26 (east)
```

Grid coordinates serve two purposes:
1. **Minimap rendering** — the `_renderMiniMap()` and `_renderWorldMiniMap()` functions place node cells at `(r, c)`.
2. **Corridor travel trigger** — `storyMove()` computes Manhattan distance between `fromCoord` and `toCoord`. If `distance >= 3`, the Time-Warp Footpath overlay appears before travel.

Grid distance formula:
```js
Math.abs(fromCoord.r - toCoord.r) + Math.abs(fromCoord.c - toCoord.c)
```

---

## 2. Node Types

| Type | Count | Code pattern | `junction` | `isEpicBattleground` | `isFishingLake` |
|------|-------|-------------|------------|----------------------|-----------------|
| Story nodes (main arc) | 42 | CI, SL, IN … CO | — | — | — |
| Junction nodes (highway) | 8 | J1–J7, RD | `true` | — | — |
| Epic Battleground | 20 | E* (EF, EH … EG) | — | `true` | — |
| Fishing lake | 2 | YL, YC | — | — | `true` |
| DeFi Land (special Act I) | 3 | DF, HM, GL | — | — | — |
| Mountain pass (hunt) | 1 | MT | — | — | — |
| Ally Cat Arc | 1 | CQ | — | — | — |

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

Each node has a direction map:

```js
NodeCode: {
  num:   <int>,          // display number (01–78)
  code:  '<str>',        // 2–3 char code
  name:  '<terrain>',    // WORLD_DB terrain key
  label: '<str>',        // display name
  act:   <1–8>,
  N:     '<code>|null',  // north exit
  S:     '<code>|null',  // south exit
  E:     '<code>|null',  // east exit
  W:     '<code>|null',  // west exit
  // Optional extra directions:
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

Direction values are logical compass labels (what the player presses). They do **not** have to align exactly with the grid direction — they only need the grid distance to stay `< 3` to avoid triggering corridor travel.

---

## 4. Corridor Travel System (Time-Warp Footpath)

When a move has `grid distance >= 3`, the **corridor overlay** appears before travel.

### Trigger

```js
// storyMove() — L9-G
const dist = Math.abs(from.r - to.r) + Math.abs(from.c - to.c);
if (dist >= 3) {
  _showCorridorPrompt(fromCode, destCode, dir);
  return;
}
```

### Overlay flow

1. `_showCorridorPrompt(fromCode, destCode, dir)` — populates overlay with From/To/Road and encounter %.
2. Player chooses:
   - **⚡ Warp** — instant travel, no encounter.
   - **🎯 Hunt** — rolls for encounter in corridor terrain.
   - **✕ Cancel** — returns to current node, no travel.
3. Warp/Hunt calls `storyCorridorTravel(fromCode, destCode, dir)` with `S_story.huntMode` set accordingly.

### Corridor terrain lookup

Terrain for a corridor pair is in `CORRIDOR_TERRAIN`:
```js
const CORRIDOR_TERRAIN = {
  'CI-J1': 'midlands',
  'DK-OC': 'ocean',
  // etc.
}
// fallback: 'midlands'
```

### Corridor connections (distance ≥ 3)

These always show the overlay:

| From | Dir | To | Dist | Terrain |
|------|-----|----|------|---------|
| DK | W | OC | 19 | ocean |
| OC | N | DK | 19 | ocean |
| JU | N | BQ | 9 | jungle |
| BQ | S | JU | 9 | jungle |
| AR | E | J5 | 8 | arctic |
| J5 | W | AR | 8 | arctic |
| SE | W | J4 | 7 | ocean |
| VC | E | DE | 7 | desert |
| HC | W | J5 | 7 | arctic |
| J4 | E | SE | 7 | ocean |
| J5 | E | HC | 7 | arctic |
| MI | N | HL | 6 | highlands |
| HL | E | MI | 6 | highlands |
| DS | E | J4 | 6 | ocean |
| CO | S | CI | 6 | midlands |
| DC | N | JU | 5 | jungle |
| KT | N | HC | 5 | heavenly_clouds |
| HC | S | KT | 5 | heavenly_clouds |
| HC | E | J7 | 5 | heavenly_clouds |
| CI | W | J1 | 4 | midlands |
| MS | W | DK | 4 | ocean |
| MI | E | J1 | 4 | midlands |
| BE | N | J3 | 4 | forest |
| OC | S | DS | 4 | ocean |
| DS | W | OC | 4 | ocean |
| GC | S | MC | 4 | goblin_cave |
| J1 | E | CI | 4 | midlands |
| J1 | W | MI | 4 | midlands |
| J3 | S | BE | 4 | forest |
| CI | S | CR | 3 | city |
| AL | S | SE | 3 | alley |

---

## 5. Junction Highway System

Junction nodes (J1–J7, RD) are waypoints connecting distant regions. They have no NPCs, battles, or loot — pure routing nodes marked `junction: true`.

### Highway map (west → east along row 5)

```
[EF] ─ FO ─ J6 ─ RD ─ MI ─ J1 ─ CI
              │         │
             YL        EM (S epic)
              │
             YC
```

**J1** `Midlands Road Fork` at (5,12):
- E → CI (City Streets — Birka) [corridor, 4]
- W → MI (Plains & Midlands) [corridor, 4]

**J6** `Western Wilds Crossroads` at (5,5):
- N → MT (Mountain Pass)
- S → YL (Yugurt Lake)
- E → RD (Roadside Clearing)
- W → FO (Aldric's Forest) [direct, 2]

**RD** `Roadside Clearing` at (5,6):
- E → MI (Plains & Midlands) [direct, 2]
- W → J6 [direct, 1]

### Coastal junction

**J3** `Coastal Fork` at (9,3):
- N → HS (Crones' Domain) [direct, 2]
- S → BE (Tropical Beach) [corridor, 4]

### Ocean-to-Ashcrag junction

**J4** `Deep Road Split` at (12,8):
- E → SE (Visby Sewers) [corridor, 7]
- W → DS (Deep Sea Trench) [corridor, 6]

### Sky road junctions

**J5** `Arctic Overpass` at (1,10):
- E → HC (Sky Road) [corridor, 7]
- W → AR (Arctic Wastes) [corridor, 8]

**J7** `Sky Gate Spur` at (1,22):
- N → HC (Sky Road) [corridor, 5]
- E → OP (Oriental Dragon Palace) [direct, 2]

### Southern desert junction

**J2** `Southern Road Cross` at (10,4):
- E → DE (Desert Wastes) [direct, 1]
- W → JU (Dense Jungle) [direct, 2]

---

## 6. Dead-End Nodes

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

## 7. Special Exits

Two nodes have non-NSEW extra exits handled by the `EXTRA_DIRS` block in `_updateExitLinks()`:

| Code | Extra dir | Dest | Note |
|------|-----------|------|------|
| DS | SW | ED (Trench Titan — Epic) | 5th exit |
| HC | spire | EK (Shattered Seraph's Spire — Epic) | 5th exit |

These show below the main NSEW exit list in the UI.

**Portal exits** (not NSEW):

| Code | Portal | Dest |
|------|--------|------|
| OU | portal | GA (Greek Agora) | instant, no encounter |

---

## 8. Waypoint & BFS Pathfinding

The `storyWaypoint()` and `_bfsPath()` functions implement BFS over `NODE_MAP` N/S/E/W edges to find shortest hop count between any two nodes. The UI shows the next step direction with a `▶ WP` tag on the correct exit.

`_bfsPath(from, to)` returns an array of `{dir, code}` steps.

Active waypoint: `S_story.waypoint` (node code string or null).

---

## 9. Grid Coordinate Table (all 78 nodes)

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

## 10. Adding New Nodes — Checklist

1. Pick a code (2–3 chars, unique in NODE_MAP).
2. Choose grid `(r,c)` — aim for Manhattan distance ≤ 2 from each connected neighbor. Distance ≥ 3 triggers corridor overlay; ≥ 6 is a major inter-region connection.
3. Add to `NODE_MAP` with `act`, `N/S/E/W`, `name` (WORLD_DB terrain key), `label`, `text`, etc.
4. Add to `NODE_COORDS`.
5. Wire reverse connections: if `A.N = 'B'` add `B.S = 'A'` unless the connection is one-way (like epic battlegrounds).
6. If the connection crosses a region (distance ≥ 3), add `CORRIDOR_TERRAIN['A-B'] = 'terrain'`.
7. If a junction is needed, pick a J-code (next available after J7) and place it between.
8. Update docs: `story.md`, `maps.md`, `plan.md`.

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
