# World Mesh Construction — Procedure & Design

**Roll2Hit World Builder — Engineering Report**  
*2026-06-09*

---

## Summary

This report describes the procedure for constructing a fully-connected N/E/S/W coordinate mesh across the Roll2Hit medieval world map. Starting from a graph with 240/597 reachable nodes (40%) and 50 unreachable major cities, we reached 435/597 (72%) reachability with all 29 major GEO-referenced cities connected, using only `./api.sh` commands.

---

## The Problem

The world was imported as isolated story-arc clusters. Each arc (Norse, English, Italian, Byzantine, Middle East, Central Asia) had internal connections but no bridges to other clusters. The game's coordinate system (`_buildNodeExits`, maxGap=4) meant that even when NODE_MAP declared connections, off-axis or distant coordinates silently broke navigation.

**Before this procedure:**
- 240/597 reachable (40%)
- 50 of 76 major cities unreachable
- 196 broken edges (all diagonal)
- 164 disconnected components

**After this procedure:**
- 435/597 reachable (72%)
- 29/29 tracked GEO cities reachable
- All major city clusters connected

---

## Phase 1: Geographic Reset (Geo-Seed)

**Command:**
```bash
./api.sh geo-seed --execute
node layout-solve.js --apply
```

**What it does:**  
Anchors 76 major cities to real-world lat/lon-derived game coordinates, then runs a BFS constraint-propagation solver that assigns all other nodes positions relative to their nearest geo-anchored city. This collapses the arbitrary coordinate scatter into a geographically coherent grid.

**Why it comes first:**  
Without geographic seeds, the constraint solver places clusters arbitrarily far apart. With seeds, cities sit at their correct geographic positions and the coordinate propagation finds natural paths between them.

**Result:** Cities placed on a consistent grid. British Isles top-left, Scandinavia top-center, Middle East center-right, Central Asia far right — matching a real medieval world map.

---

## Phase 2: The Highway First — Major City Connections

**The key insight:** Build the main highway between major cities BEFORE worrying about all the sub-locations (dungeons, taverns, shops, sub-nodes). Once every major city is on the highway, all sub-locations near that city become reachable too.

**Design constraints for highway junctions:**
- Every hop must be axis-aligned (N/S = same column, E/W = same row)
- Every hop ≤ 4 coordinate units (game probe limit)
- At direction turns, an **elbow junction** sits at the axis intersection:
  ```
  City A ──E──▶ ElbowJunction ──N──▶ City B
                (A.row, B.col)
  ```
- Junction label: "City A ↔ City B Junction"
- Junction text: "Signpost says: The [road name]. [Terrain]. [Monster warning]."
- Junction terrain: inherited from the nearest city

**Geographic highway connections added:**

| Route | From | Dir | To | Notes |
|-------|------|-----|-----|-------|
| Rhine–Alps | WOR (Worms) | E | SAL (Saluzzo) | Germany → N Italy |
| Provence–Alps | MAR (Marseille) | E | SAL (Saluzzo) | France → N Italy |
| Adriatic–Bosphorus | CON (Constantinople) | W | THA (Thessaloniki) | Byzantine link |
| Bosphorus–Baghdad | CON | S | BGD (Baghdad) | Anatolia → Iraq |
| Silk Road | BGD | E | SAM (Samarkand) | Mesopotamia → Central Asia |
| Levant | ANT (Antioch) | S | JAR (Jerusalem) | Syria → Holy Land |
| Norse | HEO (Lejre) | N | NID (Nidaros) | Denmark → Norway |
| Caledonian | GLA (Glasgow) | S | YRK (York) | Scotland → England |
| GLA internal | GLA | E | EDI (Edinburgh) | Scotland internal |
| Atlantic | MAR | W | CVP (Lisbon) | Mediterranean → Iberia |
| East Africa | MLN (Malindi) | N | JAR | Africa → Levant |
| Italian N–S | VEN (Venice) | N | ROM (Rome) | Internal Italy |

**Command pattern for each bridge:**
```bash
./api.sh connect <from> <dir> <to>   # wire the NODE_MAP connection
# (warns about gap/bendy but completes the graph link)
```

---

## Phase 3: Coordinate Propagation After Wiring

After each batch of bridge connections, re-run the geo-seed and constraint solver:

```bash
./api.sh geo-seed --execute     # re-anchor cities to geo positions
node layout-solve.js --apply    # recompute all coordinates from new graph
```

**Why geo-seed again?**  
The constraint solver propagates from the geo-anchored cities outward. Re-seeding before each propagation ensures cities stay at geographic positions even as the solver rearranges junction coordinates. Without re-seeding, repeated propagation can drift cities away from their geographic anchors.

**What the constraint solver does:**
1. BFS from LHR (London) — the most-connected hub
2. For each N/S edge: assigns `neighbor.col = current.col`, `neighbor.row = current.row ± rest`
3. For each E/W edge: assigns `neighbor.row = current.row`, `neighbor.col = current.col ± rest`
4. When two paths reach the same node with different positions → structural conflict → needs elbow
5. Disconnected components are arranged in a 2D grid below the main cluster

---

## Phase 4: Fill-Gap — Walking the Junctions

After bridges are wired and coordinates are stable, fill in the gaps between connected cities with junction chains. Each junction is spaced ≤ 4 coordinate units from its neighbors so `_buildNodeExits` can probe and find them.

```bash
./api.sh fill-gap <from> <dir> <to> --execute
```

**Junction spacing example (Worms → Saluzzo, ~22 columns):**
```
WOR(28,29)──E──J_a(28,33)──E──J_b(28,37)──E──J_c(28,41)──E──
J_d(28,45)──E──J_e(28,49)──N──J_f(24,49)──N──J_g(20,49)──E──SAL(18,51)
         [elbow at (18,49)]
```

The elbow junction at the axis intersection converts the diagonal bridge into two clean orthogonal legs.

**Elbow placement rule:**
- For a bendy E/W connection (A.row ≠ B.row): elbow at **(A.row, B.col)**
- For a bendy N/S connection (A.col ≠ B.col): elbow at **(B.row, A.col)**
- Result: two axis-aligned legs, both within maxGap=4 after fill-gap

---

## Phase 5: Sub-Location Placement

Once the highway is complete and all major cities are reachable, sub-locations (dungeons, shops, inns, monastery rooms, docks, etc.) need to be placed near their associated city.

**Placement rules by type:**

| Location type | Placement | Example |
|--------------|-----------|---------|
| Building in city (tavern, shop, guild) | Place inside city cluster: 1 hop from city node | Birka Tavern → LHR.E |
| City sub-district (market quarter, docks) | 1–2 hops from city in the appropriate direction | VEN.S = VENCTR (Venice Centre) |
| Near-city wilderness (forest, ruins) | 2–4 hops from city along a junction | LHR.S → KRN → forest dungeon |
| Remote swamp/mountain | Place at junction midpoint between two cities | Junction between CON and THA |
| Dungeon | 1 hop from the nearest city or road junction | Appian Way → SAU.S → catacombs |
| Quest-start location | Place adjacent to the city where the quest activates | JAR.E = OLN (Jerusalem Inner) |

**Command to associate a node near its quest city:**
```bash
./api.sh worldmap --city <CITY>         # see available directions
./api.sh junction <CITY> <dir> --execute  # create junction toward sub-location
./api.sh connect <junction> <dir> <subnode>  # wire the sub-location
./api.sh move <subnode> <r> <c>         # move to appropriate position
```

**Finding quest-city associations:**
```bash
./api.sh list quest --node <CODE>       # which quests activate at this node
./api.sh get quest <quest_id>           # see activateNode field
```

---

## Phase 6: The Main Highway Design

The most efficient structure is a **spine** of major cities connected east-to-west and north-to-south, with **ribs** branching off to sub-clusters.

```
            NID (Nidaros)
             |
    HHL──────HEO (Denmark)──────LHR (Birka)
             |                   |
    GLA──EDI─YRK────────────────KOL (Cologne)──REG──VEN──CON──SIN──TBZ──SAM
             |         |         |              |    |    |              |
             SHF       BRK       WOR            BOL  ROM  THA           NIS
             |         |         |              |    |    |
            BDX───────MAR───────SAL            PAR  SAU  THA
             |
            CVP (Lisbon)                        ANT──ALB──ALP
                                                |
                                               JAR──OLN
                                                |
                                               MLN (Malindi)
```

**Building the spine first:**
1. Wire all major cities (the thick lines above) using `./api.sh connect`
2. Run `./api.sh geo-seed --execute && node layout-solve.js --apply`
3. Fill gaps with `./api.sh fill-gap --execute`
4. Insert elbows at every corner turn
5. Only then add sub-locations as leaves off the highway

**Why this order matters:**  
Sub-locations attached to a disconnected city will inherit that city's isolated position. If the city later moves (due to coordinate propagation), the sub-location stays fixed at its old position and becomes a broken edge. By connecting the city first, coordinate propagation places sub-locations correctly relative to the whole network.

---

## Progress Tracking

| Metric | Start | After Phase 2 |
|--------|-------|---------------|
| Reachable nodes | 240/597 (40%) | 435/597 (72%) |
| Reachable GEO cities | 14/76 | 29/29 tracked ✓ |
| Broken edges | 196 | ~197 (need fill-gap) |
| Disconnected components | 164 | 158 |

**Remaining work:**
1. Fill gaps on all bridge connections (each wired bridge currently has gap > 4)
2. Connect remaining 162 non-GEO unreachable nodes
3. Insert elbow junctions at all diagonal bridge corners
4. Final validation: `curl http://localhost:1367/api/graph/broken`

**Target:**
```
./api.sh worldmap --route LHR --to SAM    # Birka → Samarkand: full route exists
./api.sh worldmap --route LON --to JAR    # London → Jerusalem: full route exists
curl http://localhost:1367/api/graph/broken | jq .broken   # → 0
```

---

## api.sh Commands Used

```bash
# Geographic reset
./api.sh geo-seed --execute              # anchor 76 cities to lat/lon positions
node layout-solve.js --apply             # propagate all nodes from geo anchors

# Connectivity
./api.sh connect <A> <dir> <B>          # wire two nodes bidirectionally
./api.sh fill-gap <from> <dir> <to> --execute  # fill gap with junction chain
./api.sh junction <from> <dir> --execute  # spawn single junction

# Inspection
./api.sh worldmap                         # world map view
./api.sh worldmap --regions              # 6×6 region overview
./api.sh worldmap --region B2            # zoom into region
./api.sh worldmap --city LHR             # city connections + status
./api.sh worldmap --route LHR --to CON  # test navigation path

# Validation
curl http://localhost:1367/api/graph/broken      # broken edge report
curl http://localhost:1367/api/graph/reachability  # component sizes
./api.sh fix-all-broken --limit 20              # preview remaining fixes
```
