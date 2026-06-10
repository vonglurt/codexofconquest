# Lab Report — Highway Mesh-Entry Selection & Same-Component Skip

## Problem

`buildHighway(fromCode, toCode)` had two wasteful behaviors:

### 1. Over-building when a route already existed

Phase 2 (priority highways) and Phase 3 (city mesh MST) called `buildHighway` without first checking whether the two nodes were already reachable from each other. If a prior highway or the P1 rip-and-connect pass had already joined the two components, `buildHighway` would still walk a full corridor and create a duplicate parallel route — redundant junctions on top of an existing path.

### 2. Routing deep into the mesh instead of to its border

`buildHighway(from, to)` routed all the way to `toCode` itself — which may sit deep inside an established mesh, potentially many grid cells from the nearest edge of that mesh. This forced unnecessarily long corridors and created far more junctions than needed. The same waste applied to `fromCode`: if `from` was a city surrounded by existing connections, the build should start from the border of its component, not from the city center.

**Example:** If `BGD` (Baghdad) has a 15-cell mesh to its west, and we're approaching from the west, the old code would route all the way to Baghdad's grid coordinates. The new code finds the westernmost cell already connected to Baghdad — say a junction 3 cells away — and routes there instead, saving 12 junction creations.

## Fix

### Same-component skip guard

At the top of `buildHighway`, before any corridor work, BFS `fromCode`'s connected component and check if `toCode` is already reachable. If yes, return immediately with `shape:'already-connected'` and `skipped:true` — no junctions created, no writes.

```
[highway] SKIP: LHR already reaches TRB (same component, 847 nodes)  no new junctions needed
```

### Mesh-entry selection (closest-pair routing)

BFS both `fromCode`'s and `toCode`'s connected components, collecting all nodes with grid coordinates. Find the pair `(actualFrom, actualTo)` — one from each component — with the minimum Manhattan distance. Build the corridor between those two cells instead of between the original named codes.

The trace now spells out the decision:

```
[highway] LHR(net=312)→BGD(net=28)  direct-dist=87
[highway] mesh-entry reroute: LHR→J4421  BGD→J18203  dist=12  saved=75
corridor(E): J4421(44,18)→J18203(44,30)
```

Or when already optimal:

```
[highway] CVP(net=1)→SAM(net=1)  direct-dist=144
[highway] mesh-entry: direct pair already optimal  dist=144
```

## Implementation

`wbapi-server.js` — `buildHighway` function, inside the `reweave-all` handler:

1. **Same-component check** — `bfsReach(fromCode).has(toCode)` → early return if true
2. **`netNodes(hub)`** — BFS hub, filter nodes with coords, return `{code,r,c}` array
3. **Closest-pair loop** — O(|fromNet| × |toNet|), finds `actualFrom`/`actualTo` with minimum Manhattan distance
4. **`fc`/`tc`** now set from `actualFrom`/`actualTo` coords, not original codes
5. All `walkLeg` calls, corridor emits, and final `editField` wires use `actualFrom`/`actualTo`
6. Return value still carries original `from:fromCode, to:toCode` for caller bookkeeping

## Trace output added

Every `buildHighway` call now emits:
- Network sizes for both nodes
- Direct distance between the original codes
- Whether a reroute happened and how much distance was saved (or that the direct pair was optimal)
- A SKIP line when the component check fires

Callers (P2, P3) already emit their own `highway: X→Y` line before calling `buildHighway`, so the trace reads as a clean decision chain.

## Performance note

The O(n²) closest-pair loop runs against both networks. Post-nuke, networks are small (the graph has 440 named nodes and freshly-built junctions). For a large established mesh (thousands of nodes) this could be slow — cap with `netNodes` taking at most the 200 nearest-by-grid-coord nodes if needed in a future pass.
