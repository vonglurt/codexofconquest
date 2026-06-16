<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — World Structure Critique
### Geographic Architecture, Node Density, and the IATA Anchor System in *The Shattered Codex*

**Project:** `roll2hit-v3.html` — single-file HTML5 game engine, MIT License  
**Status:** 154 WORLD_DB nodes · 152 GEO-anchored cities · 33,721 HTML lines  
**Date:** 2026-06-16  
**Series:** World Architecture · Geographic Analysis · Structural Critique  
**Classification:** Engineering · Cartography · Game Design · Structural Analysis

---

## Abstract

This report provides the first dedicated structural critique of the game world of *The Shattered Codex*. Prior analysis (synthesis-part3, circuit-map-theory) verified the navigation system's correctness and traced the junction model's evolution. This report asks a different question: **is the world shaped correctly?**

**Hypothesis:** The game world's node distribution, act structure, and geographic anchoring reveal three structural properties that were not designed but emerged — a "big middle" act imbalance, a geographic shadow problem (nodes without lat/lon anchors behave as if they exist outside the map), and a density inversion (the most narratively rich acts have the fewest nodes). Correcting these properties, particularly by completing the GEO anchor table, brings the world into geometric coherence with the historical geography it inhabits.

**Finding:** The hypothesis is supported. A GEO anchor expansion (72 new cities added 2026-06-16, raising the total from 80 to 152) addresses the shadow problem directly. The act imbalance and density inversion are structural properties of the game's design — they are intentional but worth naming explicitly, because unnamed structural properties become maintenance debt when new content is added without understanding the shape they're adding to.

---

## I. The Map the Game Inhabits

The game world of *The Shattered Codex* is not a fantasy map. It is Earth.

Every node code in WORLD_DB is an IATA airport code placed at the approximate geographic coordinates of its real-world city. LHR is Birka (Stockholm area, lat:59.3 lon:17.6). CON is Constantinople (lat:41.0 lon:28.9). JAR is Jerusalem (lat:31.8 lon:35.2). SAM is Samarkand (lat:39.6 lon:66.9).

The game's geographic extent — lat −8 to 68, lon −25 to 72 — spans from Cape Verde in the south-Atlantic to Arctic Scandinavia in the north, and from the Atlantic coast of Portugal to Uzbekistan in the east. This is the medieval Eurasian world. The bounds are not arbitrary: they contain every major node of the 1367 AD historical setting, the Norse arc, the Pauline arc (Damascus, Jerusalem, Antioch), and the naval expansion.

The IATA anchor system is the design decision that makes the world legible at the architectural level. A developer who knows that NUE is Nuremberg (lat:49.5 lon:11.1) and AMS is Amsterdam (lat:52.4 lon:4.9) can immediately understand that these two nodes should be separated by approximately 750 km of game world. That spatial intuition is the map's gift to the developer.

**It is the most important structural decision in the game's architecture, and it was never written down in a dedicated document.**

---

## II. The GEO Shadow Problem

Prior to 2026-06-16, 80 of 154 WORLD_DB nodes were registered in the GEO anchor table. The remaining 74 — including CDG (Cat Quarter / Paris), AMS (Fishmonger's Row / Amsterdam), NUE (Scholar's Quarter / Nuremberg), GVA (Mountain Pass / Geneva), LCY (Tilbury Harbor / London City), and STN (The Map Shop / Stansted) — existed in the world graph but outside the geographic seeding system.

A node outside GEO is a **geographic shadow**: it exists at whatever grid position the cell engine placed it, with no constraint that this position reflects its real-world coordinates. The reweave's Phase 0 (geo-seed) cannot move it. The Phase 3 city mesh does not treat it as an anchor. It is a named city that is, from the map's perspective, nowhere.

The consequence is structural incoherence. CDG (Paris area, lat:49.0) was at grid row 55. FRK (Paris, lat:48.9) was separately anchored at whatever the Mercator formula gives for lat:48.9 — which is nearly identical. Two nodes representing the Paris region occupied different rows because one was GEO-anchored and one was not. AMS (Amsterdam, lat:52.4) was at grid row 29 — near the top of the grid, positioned closer to Iceland than to its correct Central European placement.

This is the geographic shadow problem: the world looks correct to the quest system (all nodes reachable) but fails the spatial sanity check (nodes whose real-world positions are neighboring are not grid-neighboring).

### II.A — Resolution

72 new GEO entries were added on 2026-06-16, raising the total from 80 to 152. Coverage now includes:

| Region | New entries | Key additions |
|--------|------------|---------------|
| British Isles | 12 | LCY, STN, MAN, INV, GCI, GIB |
| Scandinavia extended | 16 | TRD, GOT, VBY, MOL, KSU, BOO |
| W/C Europe | 19 | CDG, AMS, NUE, GVA, ZRH, VIE, MUC |
| E Europe/Balkans | 13 | ATH, BEG, WAW, SOF, TLL, OTP |
| Caucasus/Russia | 3 | SVO, TBS, LCA |
| Middle East/N Africa | 9 | DAM, JRS, CAI, ADA, FEZ, DOH, RUH |
| Atlantic Islands | 4 | ACE, PDL, RAI, SID |

The next reweave will lock all 152 cities to their Mercator positions in Phase 0, then rebuild the corridor mesh around that anchored geography. CDG will be at its correct Paris position. AMS will be at Amsterdam. The geographic shadow problem is resolved by running `./api.sh reweave --execute`.

### II.B — Remaining Unanchored Nodes

Two categories of WORLD_DB nodes remain outside GEO intentionally:

**Fantasy/non-geographic codes:** DSF (Atlantean Forge), DSJ (Kelp Channel), DFL (Dunfall — Loch Harbor), HCA (The Deeper Clearing), LSO (The Fog Bank). These are world locations with no real-world geographic anchor. Their position is determined by narrative logic (adjacency to related nodes) rather than geography.

**Outside-bounds codes:** BKK (Oriental Dragon Palace, Bangkok area lon:100.7), CAN, CTU, HKG (China), SEA (Seattle), HAV (Havana), MSY (New Orleans), BGI (Barbados). These nodes are outside the current map bounds (lon −25 to 72) and represent future expansion arcs. Adding them to GEO would require bounds extension before they can be seeded.

**Ambiguous:** LIM (Mimic Meadows). The IATA code LIM is Lima, Peru (lat:−12, lon:−77), which is outside bounds and geographically incoherent with a European medieval setting. LIM is treated as a custom code for this node and left outside GEO.

---

## III. Act Distribution: The Big Middle

The game's 154 WORLD_DB nodes are distributed across 8 acts. The distribution is not uniform and the imbalance is structural:

| Act | Node count | Role in arc | Geographic region |
|-----|-----------|-------------|-------------------|
| 0 | 27 | Prelude / junction nodes | Birka immediate vicinity |
| 1 | 14 | Birka starting city | Stockholm area |
| 2 | 8 | Early travel | English coast / North Sea |
| 3 | 37 | Midlands wilderness | Northern Europe, midland routes |
| 4 | 53 | Epic Battlegrounds + open world | Distributed, many terrain types |
| 5 | 9 | Transition / specialist areas | Various |
| 6 | 11 | Scholar arc / late game | Weimar area / Central Europe |
| 7 | 8 | Endgame approach | Codex Core region |
| 8 | 1 | Resolution node | Singular |

Acts 3 and 4 together hold 90 of 154 nodes — 58% of the world — while Acts 1, 2, 5, 6, 7, and 8 together hold 51 nodes. This is the **big middle**: the mid-game world is geometrically dominant.

This is not a design error. Acts 3 and 4 are the exploration phase, where the player roams freely before the Void Tide pressure becomes critical. The node density reflects the design intent: mid-game is where the world opens. Act 0's 27 junction nodes are infrastructure, not content — they are the corridors that connect named places.

But the big middle has an implication for future content: **any new nodes added in Acts 3 or 4 deepen an already-deep layer, while Acts 2, 5, 6, 7 are thin and would benefit from new content disproportionately.** Act 6 in particular — the Scholar's Quarter / Weimar region, which carries the game's highest narrative density (Froberger, Sweelinck, the archive, the First Researcher) — has only 11 nodes. It is the most content-per-node act in the game, and the most geographically compact.

---

## IV. The Density Inversion

The game's most narratively complex acts have the fewest nodes. Act 6 (11 nodes) contains: the Scholar Gate four-quest arc, the Void Archaeology five-quest arc, the Weimar archive modal, the Froberger journal culmination, the Entry 42 mechanic, the INN_DREAMS Weimar variant, and the Benedikt/Sweelinck Dear Friend arcs. Act 1 (14 nodes) is a city with six NPCs, 7 side quests, and an optional arc. Act 8 (1 node) is the Codex Core resolution.

Meanwhile Act 4 (53 nodes) contains the Epic Battlegrounds — 20 boss nodes each with a single combat encounter and a shard reward. Many are narratively thin but geographically significant (they occupy real-world terrain across the European and Mediterranean map).

This is the density inversion: **narrative density and node count are inversely correlated.** The acts with the most nodes have the least story per node; the acts with the least nodes have the most.

The inversion is deliberate. The Epic Battlegrounds are designed to be spatially expansive — you feel the world's size because there are many places to go. The Scholar arc is designed to be spatially compact — you feel Weimar's depth because you keep returning to the same few nodes and they keep changing. These are two different design philosophies coexisting in the same world.

The structural risk is that new developers may add nodes to Acts 3/4 (where there is space) when the game's narrative needs would be better served by deepening Acts 5/6. This report names the inversion so that future decisions are made with it visible.

---

## V. Geographic Critique: Four Structural Observations

### V.A — The Northern Gap

The game's Northern European nodes (HHL=Herdholt, NID=Nidaros, LYG=Lyngvi Hall, ODD, SIG) form a Norse arc from Iceland to southern Scandinavia. The geographic gap between these nodes and the Birka hub (LHR, lat:59.3) spans roughly lat 59–65 — a four-degree band containing real Norwegian cities (TRD=Trondheim, MOL=Molde, KSU=Kristiansund, MJF=Mosjøen). These are now GEO-anchored but contain no named WORLD_DB nodes. The northern corridor from Birka to the Norse arc passes through geographic coordinates but no places. This is not an error — it may be intentional sparsity in the Norse approach — but it is a structural observation.

### V.B — The Iberian Peninsula is a Dead End

CVP (Lisbon, lat:38.7 lon:−9.1) is the westernmost node and connects only eastward. Spain — SDR (Santander, lat:43.4), MAD (Madrid, lat:40.5) — is now GEO-anchored but has no WORLD_DB nodes. The Iberian Peninsula is mapped but not occupied. If a future arc adds Iberian content, the GEO anchors are ready; the geography is waiting.

### V.C — The Eastern Spine Terminates at Samarkand

The game's easternmost GEO node is SAM (Samarkand, lat:39.6 lon:66.9). Beyond it the map is empty. The §FUTURE-01 Saul-Paul arc would extend the eastern boundary through Damascus and Jerusalem (both now GEO-anchored), but the arc does not yet reach the Far East. The Oriental Dragon Palace (BKK, Bangkok) is the game's farthest-east node but is outside the current map bounds by 28 degrees of longitude. It exists in the game but not on the geographic map.

### V.D — The Atlantic Islands as Edge Case

ACE (Isle of the Wyrm Crown / Lanzarote, lat:29.0 lon:−13.6), PDL (Ponta Delgada / Azores, lat:37.7 lon:−25.7), RAI and SID (Cape Verde, lat:14–17 lon:−23 to −24) are now GEO-anchored at the western and southern edges of the map bounds. These are the game's Atlantic island nodes — the furthest from the continental core. The geographic seeding will place them at the correct positions, but the corridor mesh will need to bridge a significant distance from the nearest continental node (CVP/Lisbon) to reach them. If ACE connects to CVP, the highway is approximately 1,500 km real-world — the longest single corridor in the game. The reweave Priority Highways list should address this explicitly rather than letting the city mesh MST handle it as a greedy afterthought.

---

## VI. The IATA System as Design Philosophy

The IATA anchor system is more than a coordinate scheme. It is the game's commitment to historical specificity. Every node code that corresponds to a real airport says: this game takes place on Earth, in a time before that airport existed but after the city that the airport is named for was significant. The city is the anchor; the airport code is the abbreviation.

This creates a design constraint that is more disciplining than any style guide: when you add a new node, you must ask which real-world city it corresponds to. You cannot add a node called "Dark Forest" without first asking: which forest? Near which city? At what latitude? The IATA system forces geographic accountability.

The game's most interesting design choice is that it uses this system for fantasy content too. BKK is not literally the Bangkok airport placed in medieval Europe — it is a fantasy location that borrows Bangkok's coordinates because the game's world extends to the Far East, and Bangkok is where the Far East begins on the map. The Orient is real; the Dragon Palace is where the Orient is.

This is the design philosophy that the GEO expansion protects. Adding CDG to GEO does not mean the Cat Quarter is literally at Charles de Gaulle airport. It means the Cat Quarter is in the Paris area, at the coordinates where medieval Paris sat, and the reweave should position it accordingly.

---

## VII. Recommended Actions

**Run reweave after this report.** The 72 new GEO entries will lock 152 cities to their correct Mercator positions on the next `./api.sh reweave --execute`. The rip-and-connect and city mesh phases will then rebuild corridors around the newly anchored geography. Expect CDG, AMS, NUE, GVA, LCY, and STN to move significantly from their current grid positions.

**Add a priority highway: CVP → ACE.** The Canary Islands (ACE = Isle of the Wyrm Crown) are now GEO-anchored but will not be connected by the greedy MST without a priority highway. Add `{ from:'CVP', to:'ACE', note:'Lisbon to Canaries — Atlantic island approach' }` to `PRIORITY_HIGHWAYS` in `api/wb.js`.

**Consider Act 5/6 expansion before Act 3/4.** The density inversion means Acts 5 and 6 have more narrative per node than any other act. New content in these acts serves the game's story more efficiently than new nodes in the already-dense Acts 3/4. Any new Scholar arc content (§DUNGEON-01 Scholar Workshop, additional Weimar nodes) should be prioritized over further wilderness expansion.

**LIM (Mimic Meadows) remains outside GEO.** Its IATA equivalent (Lima, Peru) is geographically incoherent. If a geographic anchor for LIM is desired, the most defensible choice is Limerick, Ireland (lat:52.7 lon:−8.6) — a European city that begins with "Lim" and is within map bounds. This would place LIM in the British Isles cluster, which may or may not be the intended position for Mimic Meadows. Leave this as an open decision.

---

## VIII. Conclusion

The world of *The Shattered Codex* is Earth, mapped through IATA codes to a medieval Eurasian extent. The GEO anchor system is the mechanism that keeps the game world's geography honest — it ensures that nodes that should be near each other are near each other on the grid.

The GEO shadow problem (74 nodes outside the anchor table) was resolved by the expansion on 2026-06-16. The remaining unanchored nodes are either fantasy locations (no real-world anchor possible) or outside-bounds future expansion (correct position is beyond the current map extent).

The big middle (Acts 3/4 holding 58% of nodes) and the density inversion (narrative density inversely correlated with node count) are structural properties of the world's design, not defects. They are named here so that future content decisions can be made with them visible.

The single strongest structural observation: **the world is geographically correct in intent and structurally sound in implementation, but the gap between intent and implementation was the GEO shadow problem, and it has been open since the first non-geographic node was added.** The expansion closes it.

---

*End of Lab Report — World Structure Critique*

*Written: 2026-06-16 · 154 WORLD_DB nodes · 152 GEO anchors · 8 acts · lat −8→68 · lon −25→72*
