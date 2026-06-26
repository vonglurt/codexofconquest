# Lab Report — §WALK-1.5-FU(c): grid resolution for dense regions

**Status:** ✅ DECIDED 2026-06-26 — **Option A chosen** (drop 0.25°; de-pile via 1° redistribution). No resolution change will be implemented. (c) is closed as "covered by (a)+(b)"; (b) is unblocked. Report retained as the rationale.
**Date:** 2026-06-26
**Context:** §WALK-1.5 projected all 409 nodes onto a 1° equirectangular grid (`row=floor(70−lat)`, `col=floor(lon+180) mod 360`). Follow-up (c) asked whether to re-project dense regions at 0.25° so co-located nodes stop sharing a cell. User's initial direction (AskUserQuestion, 2026-06-26): "adopt 0.25° for dense regions." This report tests whether 0.25° actually achieves that, and at what cost.

## 1. The premise being tested

Claim: "co-located nodes pile onto shared 1° cells; a finer 0.25° grid would separate them."

This is only true for nodes whose **true lat/lon genuinely differ by <1° but ≥0.25°** (real places that 1° binning merged). It is **false** for nodes that co-locate because they share *one anchor's exact lat/lon* — the offEarth/satellite/anchor-chaining nodes (whole fantasy sub-realms) and the "interior" nodes that were all stamped with their frame city's coordinates. Finer bins don't separate identical coordinates.

## 2. Measured reality (current live `roll2hit-v3.html`)

- 409 nodes occupy **215 cells**; **66 cells are shared** (≥2 nodes), holding **260 nodes**.
- Re-binning every node's *true* lat/lon (GEO2 155 + gazetteer realPlaces + anchors-with-coords; 345 nodes have own coords, 64 are coordless chained) at 0.25°:

| Outcome at 0.25° | shared cells |
|---|---|
| **fully** separated (every node its own bin) | **17** |
| partially separated (some split, rest still piled) | 21 |
| **unchanged** (all same bin / no own coords) | **28** |

- The big piles barely move — they are anchor-chaining artifacts, not rounding collisions:

| cell | nodes | distinct 0.25° bins | still piled at 0.25° | cause |
|---|---|---|---|---|
| 19,191 Weimar | 21 | 2 | 21 | interiors stamped with WM's 50.98/11.33 |
| 32,203 Atlantis | 17 | 1 | 16 | 16 offEarth chain to ATH (no own coords) |
| 18,177 | 13 | 3 | 12 | mostly anchor-stamped |
| 26,191 Florence | 13 | 2 | 12 | 9 coordless satellites → FLR |
| 25,206 hag arc | 12 | 2 | 11 | 6 offEarth → SDQ |

## 3. Cost of going 0.25°

- Content bbox 72 rows × 96 cols at 1° = 6,912 cells → **288 × 384 = 110,592 cells at 0.25° (16×)**.
- Movement is one-cell N/E/S/W (§CELL-03/§WALK-2) and **timeless** (§TIMELESS-01). At 0.25°, the same journey is **~4× the steps** along each axis → ~4× keypresses and **~4× the per-step encounter rolls** (`TERRAIN_ENCOUNTER_RATE`, e.g. midlands 0.15) unless rates are rescaled. This materially changes combat density and pacing.
- Touches the locked §WALK coordinate system: geo-seed projection (`wbapi-server.js`), the `CELL_GRID` IIFE + its read sites (`roll2hit-v3.html`), `SEA_RUNS`/`SEA_LANES` regen at 0.25° (the Natural Earth raster + the 59 hand-carved lanes all rescale), and the mover's geo wrap/clamp constants. SEA_LANES would need re-carving at 4× width or they pinch to sub-cell.

## 4. The actual lever for each pile type

- **Anchor-chained piles (the big ones, most of the 260):** resolution does nothing. The fix is **distinct coordinates** — i.e. items (a) [done for the 4 realms] and **(b) Weimar redistribution**. These are content/data moves at *any* resolution.
- **Genuine sub-degree real clusters (~17 cells, mostly 2–5 European cities — London LGW/AST/LON/LDN/BRK; English midlands 16,178; Pisa suburbs 26,190; etc.):** 0.25° separates them with honest geography (≤28 km error). A 1°-offset alternative (push each to an adjacent free 1° cell) separates them too but **misplaces them by ~110 km**, and they're already handled cost-free by the locale-list sub-location picker.

## 5. Options

**A. Redistribute-only, keep 1° (recommended).** Skip the resolution change. Fix the piles where they actually live — via distinct-coordinate assignment (a, done) and (b) Weimar redistribution. Leave the ~17 genuine European clusters as locale-lists (already zero-cost to the player) or micro-offset the handful that matter. No map blow-up, no step/encounter inflation, no SEA_MASK regen, no spec amendment. Resolves the *intent* of (c) (de-pile dense regions) by the correct mechanism.

**B. Global 0.25°.** Honest geography for the ~17 genuine clusters, but 16× cells, ~4× steps/encounter rolls (needs rate rebalancing), full SEA_MASK + lane re-carve — and **still requires (a)/(b) redistribution** because it does nothing for the anchor-chained piles. High cost, narrow benefit.

**C. Hybrid 0.25° in dense regions only.** Non-uniform grid breaks the mover's single-uniform-terrain-field invariant (`move(world,pos,dir)` assumes a fixed step size); region-aware step sizes are a large kernel complication fighting the §WALK design. Not recommended.

## 6. Recommendation

Reframe (c). The piles the user wants gone are **not** a resolution problem — 0.25° leaves the 21-node Weimar and 17-node Atlantis piles intact while quadrupling traversal cost. Recommend **Option A**: drop the 0.25° re-projection, and treat "de-pile dense regions" as fully covered by the redistribution work (a + b). If honest separation of the genuine European city-clusters is wanted later, micro-offset those specific ~17 cells at 1° (or revisit 0.25° as a dedicated, rebalanced project). **Surface this to the user before doing (b), since it removes the (b)-blocked-on-(c) dependency.**
