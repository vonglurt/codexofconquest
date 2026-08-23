#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// Copyright (c) 2026 Paul Richeson <paulr@sdf.org> — CodexOfConquest.com
// layout-spring.js — spring-based N/E/S/W grid layout engine for roll2hit WBAPI
//
// The game's _buildNodeExits() probes up to 4 cells per direction.
// Two connected nodes MUST be 1–4 coordinate units apart on the correct axis,
// and 0 units off-axis. This tool finds positions satisfying those rules.
//
// Usage:
//   node layout-spring.js [--port 1367] [--iters 800] [--apply] [--elbow] [--help]

'use strict';
const http = require('http');

// ─── Physics constants ────────────────────────────────────────────────────────
// k       = axial spring stiffness (enforces rest length along connection axis)
// align_k = lateral stiffness (keeps nodes on the same row/col as their partner)
// rest    = target coordinate distance in units of STEP
//
// Hard traversal rule from _buildNodeExits: probe d = 1..4 in cardinal direction.
// Axis distance must be in [1, MAX_GAP]; cross-axis must be 0.
//
// STEP (set by --step N, auto-detected if omitted):
//   City rest    = 1 × STEP
//   Junction rest = 2 × STEP
//   Recommended: STEP=1 for compact fresh layout; STEP=4 for preserving existing scale.
const SPRING_BASE = {
  city:     { restSteps: 1, k: 6.0, align_k: 30.0 },
  airport:  { restSteps: 1, k: 4.0, align_k: 20.0 },
  site:     { restSteps: 1, k: 3.0, align_k: 16.0 },
  junction: { restSteps: 2, k: 1.2, align_k:  8.0 },
  default:  { restSteps: 1, k: 2.5, align_k: 12.0 },
};

const GRID_MIN  = 4;
const GRID_MAX  = 508; // 0–512 bounds with margin

// Direction metadata: axis='r'|'c', sign=+1|-1, opp=opposite direction
const DIR = {
  N: { dr: -1, dc:  0, axis: 'r', sign: -1, opp: 'S' },
  S: { dr: +1, dc:  0, axis: 'r', sign: +1, opp: 'N' },
  E: { dr:  0, dc: +1, axis: 'c', sign: +1, opp: 'W' },
  W: { dr:  0, dc: -1, axis: 'c', sign: -1, opp: 'E' },
};

// ─── Help ─────────────────────────────────────────────────────────────────────
const HELP = `
╔══════════════════════════════════════════════════════════════════════════════╗
║         layout-spring.js — Spring Layout Engine for WBAPI Nodes            ║
║         Fixes: off-axis (bendy) + gap-too-large + collision issues         ║
╚══════════════════════════════════════════════════════════════════════════════╝

USAGE
  node layout-spring.js [options]

OPTIONS
  --port N    WBAPI port (default: 1367)
  --iters N   Simulation iterations (default: 800)
  --step N    Base grid unit. city rest=1×step, junction rest=2×step.
              Default: auto-detected from median existing edge distance.
              Use --step 1 for compact fresh layout; --step 4 to match
              existing coordinate scale (preserves general positions).
  --fresh     Ignore existing coordinates entirely; start BFS from (256,256).
              Without --fresh the simulation seeds from existing coords —
              useful for fixing bendy/off-axis edges while keeping positions.
  --apply     POST proposed coords to /api/layout/apply after simulation
  --elbow     Suggest elbow junction nodes for bendy connections
  --help      Show this help

GAME RULE (from _buildNodeExits in play.html)
  For every node, the game probes 1..4 coordinate cells in each cardinal
  direction. A connection is live only when a neighbour is found in [1,4].
  TWO CONSTRAINTS per edge:
    1. Axis distance:  1 ≤ |Δrow| (N/S) or |Δcol| (E/W) ≤ 4
    2. Cross distance: |Δcol| (N/S) = 0  or  |Δrow| (E/W) = 0  (must be axis-aligned)

SPRING PARAMETERS
  Type        Rest  k(axial)  align_k(lateral)  Character
  ──────────  ────  ────────  ────────────────  ────────────────────
  city          1    6.0         30.0            Dense cluster
  airport       1    4.0         20.0            Medium-dense
  site          1    3.0         16.0            Medium
  junction      2    1.2          8.0            Spread out, 1 gap between
  (default)     1    2.5         12.0            Fallback

  Edge between two different types: max(rest), avg(k), avg(align_k).
  Example: city→junction → rest=2, k=3.6, align_k=19.0

WHAT IT DOES
  1. Fetch all nodes + existing coords from WBAPI.
  2. BFS-place nodes that have no coords, using rest lengths for initial gaps.
  3. Spring simulation (N iterations):
       • Axial spring  — pulls axis-distance toward rest length
       • Lateral spring — very strong, pulls nodes onto the same row/col
       • Direction guard — prevents direction inversions (N flipping south, etc.)
       • Boundary force — keeps all nodes within 4..508
  4. Snap positions to nearest integer.
  5. Detect issues:
       BENDY_EW    E/W connection where |rowA − rowB| > 0
       BENDY_NS    N/S connection where |colA − colB| > 0
       RANGE_VIOL  |axis distance| outside [1, 4]
       COLLISION   Two nodes at the same (r, c)
       ORPHAN      Node with zero connections
  6. Suggest elbow junction nodes (--elbow) to resolve BENDY connections.

═══════════════════════════════════════════════════════════════════════════════
4 × 4 MESH EXAMPLE — mixed city (C) and junction (J) nodes
═══════════════════════════════════════════════════════════════════════════════

  Node map (N/E/S/W connections):

    C00: E=J01, S=J10
    J01: W=C00, E=C02, S=J11
    C02: W=J01, S=J12
    J10: N=C00, E=J11, S=C20
    J11: N=J01, W=J10, E=J12, S=J21   ← centre junction, all 4 sides used
    J12: N=C02, W=J11, S=C22
    C20: N=J10, E=J21
    J21: N=J11, W=C20, E=C22
    C22: N=J12, W=J21

  After spring simulation (city rest=1, junction rest=2):

         col: 100  102  104
    row 100:  C00──J01──C02
               │    │    │
    row 102:  J10──J11──J12
               │    │    │
    row 104:  C20──J21──C22

  Coordinate table:
    C00 (100,100)   J01 (100,102)   C02 (100,104)
    J10 (102,100)   J11 (102,102)   J12 (102,104)
    C20 (104,100)   J21 (104,102)   C22 (104,104)

  Every edge uses rest=max(city=1,junction=2)=2. All axis-distances = 2.
  Game probe d=1..4 finds neighbour at d=2. ✓  All axis-aligned. ✓

  Spring forces that produced this layout:
    C00–J01  (city→junction, E): axial pulls Δcol toward 2; lateral pulls Δrow toward 0
    J10–J11  (junction→junction, E): axial pulls Δcol toward 2; lateral pulls Δrow toward 0
    C00–J10  (city→junction, S): axial pulls Δrow toward 2; lateral pulls Δcol toward 0

═══════════════════════════════════════════════════════════════════════════════
ELBOW INSERTION — fixing bendy connections
═══════════════════════════════════════════════════════════════════════════════

  A bendy E/W connection (A.E = B but A.row ≠ B.row):

    A (r=10, c=20) ──E──→ B (r=14, c=28)   ← B.row ≠ A.row: off-axis

  Insert elbow junction at the axis intersection (A.row, B.col):

    ELB (r=10, c=28)
    A.E   = ELB   (gap: |28−20| = 8 → may still need fill-gap)
    ELB.W = A
    ELB.S = B     (since B.row > ELB.row)
    B.N   = ELB

  Result:  A ──E──→ ELB ──S──→ B   (two axis-aligned legs) ✓

  A bendy N/S connection (A.N = B but A.col ≠ B.col):

    A (r=30, c=20) ──N──→ B (r=24, c=26)   ← B.col ≠ A.col

  Insert elbow at (B.row, A.col):

    ELB (r=24, c=20)
    A.N   = ELB
    ELB.S = A
    ELB.E = B     (since B.col > ELB.col)
    B.W   = ELB

  Result:  A ──N──→ ELB ──E──→ B ✓

═══════════════════════════════════════════════════════════════════════════════
PROBLEMATIC NODE CLASSES
═══════════════════════════════════════════════════════════════════════════════

  The following node configurations are structurally problematic — they cannot
  be resolved by the spring simulation alone and require manual intervention:

  1. FOUR-WAY CORNER
     A node has, say, both a N/S connection AND an E/W connection, but the
     simulation cannot find an intersection that satisfies both. Symptom:
     both connections are bendy. Fix: move the node to the exact intersection
     of the row of its E/W partner and the col of its N/S partner.
     Diagnostic endpoint: GET /api/graph/validate/{code}

  2. OVERCONSTRAINED CLUSTER
     A city cluster densely connected where multiple city-rest-1 springs
     conflict (e.g. triangle A─B─C─A). No flat grid satisfies all three
     in one row/col. Fix: break one connection and route via a junction.

  3. DISCONNECTED COMPONENT
     A set of nodes with no path to the main connected component. The
     simulation cannot place them relative to the main cluster. These appear
     as a separate block in the lower-right of the output. Fix: wire at least
     one node of the component to the main graph.

  4. SELF-REFERENCING OR CIRCULAR DIRECTION
     A.N = B and B.S = C (not A). The spring pulls A and B into alignment,
     but B's south connection to C fights B's north constraint from A.
     Fix: audit with GET /api/graph/validate/{nodeCode} for each.

OUTPUT JSON FIELDS
  placed   — {CODE: {r, c}} proposed coordinates for every node
  issues   — list of detected problems (see types above)
  elbows   — elbow junction specs (only if --elbow flag given)
  stats    — summary counts

APPLY WORKFLOW
  # 1. Preview
  node layout-spring.js | jq .stats

  # 2. Check issues
  node layout-spring.js | jq '.issues[] | select(.type == "BENDY_EW")'

  # 3. Apply coordinates
  node layout-spring.js --apply

  # 4. Apply + suggest elbows
  node layout-spring.js --apply --elbow

  # 5. Check remaining broken edges after apply
  curl http://localhost:1367/api/graph/broken | jq .categories
`;

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function apiGet(port, path) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Bad JSON from GET ${path}: ${data.slice(0, 100)}`)); }
      });
    }).on('error', reject);
  });
}

function apiPost(port, path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({
      host: '127.0.0.1', port, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { reject(new Error(`Bad JSON from POST ${path}`)); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ─── Auto-detect step from existing edge distances ────────────────────────────
function detectStep(nodeMap, coordData) {
  const dists = [];
  const seen = new Set();
  for (const [code, n] of Object.entries(nodeMap)) {
    for (const dir of ['N','E','S','W']) {
      const tgt = n[dir]; if (!tgt) continue;
      const key = [code, tgt].sort().join('|');
      if (seen.has(key)) continue; seen.add(key);
      const ca = coordData[code], cb = coordData[tgt];
      if (!ca || !cb) continue;
      const d = DIR[dir];
      const axisDist = d.axis === 'r' ? Math.abs(cb.r - ca.r) : Math.abs(cb.c - ca.c);
      if (axisDist > 0) dists.push(axisDist);
    }
  }
  if (!dists.length) return 1;
  dists.sort((a, b) => a - b);
  const median = dists[Math.floor(dists.length / 2)];
  // Round to nearest power-of-two-friendly value
  if (median <= 1) return 1;
  if (median <= 2) return 2;
  if (median <= 4) return 4;
  if (median <= 8) return 8;
  return Math.round(median);
}

// ─── Spring edge parameters ───────────────────────────────────────────────────
let STEP = 1; // set in main()
let MAX_GAP = 4;

function edgeParams(typeA, typeB) {
  const a = SPRING_BASE[typeA] || SPRING_BASE.default;
  const b = SPRING_BASE[typeB] || SPRING_BASE.default;
  return {
    rest:    Math.max(a.restSteps, b.restSteps) * STEP,
    k:       (a.k + b.k) / 2,
    align_k: (a.align_k + b.align_k) / 2,
  };
}

// ─── Build edge list ──────────────────────────────────────────────────────────
// Returns [{aC, bC, dir, sp}] without duplicates.
function buildEdges(nodeMap) {
  const edges = [], seen = new Set();
  for (const [aC, n] of Object.entries(nodeMap)) {
    for (const dir of ['N', 'E', 'S', 'W']) {
      const bC = n[dir]; if (!bC || !nodeMap[bC]) continue;
      const key = [aC, bC].sort().join('|');
      if (seen.has(key)) continue; seen.add(key);
      edges.push({ aC, bC, dir, sp: edgeParams(n.name || 'default', nodeMap[bC]?.name || 'default') });
    }
  }
  return edges;
}

// ─── Initial placement (BFS) ──────────────────────────────────────────────────
function initialPlace(nodeMap, existingCoords) {
  const pos = {};
  const occupied = new Set();

  // Seed from existing coordinates
  for (const [code, rc] of Object.entries(existingCoords)) {
    if (nodeMap[code]) {
      pos[code] = { r: rc.r, c: rc.c };
      occupied.add(`${rc.r},${rc.c}`);
    }
  }

  // Pick root: most-connected node among those already placed, else most-connected overall
  const allCodes = Object.keys(nodeMap);
  const degree = code => ['N', 'E', 'S', 'W'].filter(d => nodeMap[code]?.[d] && nodeMap[nodeMap[code][d]]).length;

  let roots = allCodes.filter(c => pos[c]);
  if (!roots.length) {
    const root = allCodes.reduce((b, c) => degree(c) > degree(b) ? c : b, allCodes[0]);
    pos[root] = { r: 100, c: 100 };
    occupied.add('100,100');
    roots = [root];
  }

  const queue = [...roots];
  while (queue.length) {
    const code = queue.shift();
    const ca = pos[code];
    const n = nodeMap[code];
    for (const dir of ['N', 'E', 'S', 'W']) {
      const tgt = n[dir]; if (!tgt || !nodeMap[tgt] || pos[tgt]) continue;
      const d = DIR[dir];
      const sp = edgeParams(n.name || 'default', nodeMap[tgt]?.name || 'default');
      let r = ca.r + d.dr * sp.rest;
      let c = ca.c + d.dc * sp.rest;
      // Slide along axis to avoid collision
      for (let tries = 0; tries < 32 && occupied.has(`${r},${c}`); tries++) {
        r += d.dr; c += d.dc;
      }
      // Clamp to grid
      r = Math.max(GRID_MIN, Math.min(GRID_MAX, r));
      c = Math.max(GRID_MIN, Math.min(GRID_MAX, c));
      pos[tgt] = { r, c };
      occupied.add(`${r},${c}`);
      queue.push(tgt);
    }
  }

  // Park any unreached nodes (disconnected components) below the main cluster
  const maxR = Object.values(pos).reduce((m, p) => Math.max(m, p.r), 100);
  let orphanR = maxR + 20, orphanC = GRID_MIN;
  for (const code of allCodes) {
    if (pos[code]) continue;
    while (occupied.has(`${orphanR},${orphanC}`)) orphanC += 2;
    pos[code] = { r: orphanR, c: orphanC };
    occupied.add(`${orphanR},${orphanC}`);
    orphanC += 2;
  }

  return pos;
}

// ─── Spatial hash for efficient repulsion ────────────────────────────────────
// Divides the grid into cells of size CELL, returns the set of neighbours
// of each node within radius 2*CELL.
function buildSpatialHash(codes, fpos, cellSize) {
  const grid = new Map();
  for (const code of codes) {
    const p = fpos[code];
    const gx = Math.floor(p.r / cellSize);
    const gy = Math.floor(p.c / cellSize);
    const key = `${gx},${gy}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(code);
  }
  return grid;
}

// ─── Spring simulation ────────────────────────────────────────────────────────
function simulate(nodeMap, edges, pos, iters) {
  const fpos = {};
  const vel  = {};
  for (const code of Object.keys(nodeMap)) {
    fpos[code] = { r: pos[code].r, c: pos[code].c };
    vel[code]  = { dr: 0, dc: 0 };
  }

  const DT      = 0.12;
  const DAMPING = 0.80;

  for (let iter = 0; iter < iters; iter++) {
    // Cooling: reduce forces in later iterations to settle positions
    const cool = 1 - 0.6 * (iter / iters);

    const forces = {};
    for (const code of Object.keys(nodeMap)) forces[code] = { fr: 0, fc: 0 };

    for (const { aC, bC, dir, sp } of edges) {
      if (!fpos[aC] || !fpos[bC]) continue;
      const pa = fpos[aC], pb = fpos[bC];
      const d  = DIR[dir];
      const dr = pb.r - pa.r;
      const dc = pb.c - pa.c;

      if (d.axis === 'r') {
        // N or S: axial spring acts on row-distance; lateral on col-distance
        const targetDr = d.sign * sp.rest;
        const axialF   = sp.k       * (dr - targetDr) * cool;
        const lateralF = sp.align_k * dc              * cool;
        forces[aC].fr += axialF;    forces[bC].fr -= axialF;
        forces[aC].fc += lateralF;  forces[bC].fc -= lateralF;
        // Direction guard: if B ended up on the wrong side of A, push hard
        if (d.sign < 0 && dr >= 0) { forces[bC].fr -= sp.k * 8 * cool; }
        if (d.sign > 0 && dr <= 0) { forces[bC].fr += sp.k * 8 * cool; }
      } else {
        // E or W: axial on col-distance; lateral on row-distance
        const targetDc = d.sign * sp.rest;
        const axialF   = sp.k       * (dc - targetDc) * cool;
        const lateralF = sp.align_k * dr              * cool;
        forces[aC].fc += axialF;    forces[bC].fc -= axialF;
        forces[aC].fr += lateralF;  forces[bC].fr -= lateralF;
        if (d.sign > 0 && dc <= 0) { forces[bC].fc += sp.k * 8 * cool; }
        if (d.sign < 0 && dc >= 0) { forces[bC].fc -= sp.k * 8 * cool; }
      }
    }

    // Short-range repulsion: prevents exact collisions between non-connected nodes.
    // Radius just slightly above 1 so neighbouring cells stay distinct; very weak
    // so it doesn't overpower the axis-alignment springs.
    const REP_RADIUS = 1.2;
    const REP_K      = 1.5 * cool;
    const CELL_SIZE  = REP_RADIUS * 2;
    const codes = Object.keys(nodeMap);
    const grid  = buildSpatialHash(codes, fpos, CELL_SIZE);
    const connectedPairs = new Set(edges.map(({ aC, bC }) => [aC, bC].sort().join('|')));

    for (const [aC, pa] of Object.entries(fpos)) {
      if (!nodeMap[aC]) continue;
      const gx = Math.floor(pa.r / CELL_SIZE);
      const gy = Math.floor(pa.c / CELL_SIZE);
      // Check 3×3 neighbourhood of grid cells
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const neighbours = grid.get(`${gx + dx},${gy + dy}`);
          if (!neighbours) continue;
          for (const bC of neighbours) {
            if (bC <= aC) continue; // each pair once
            if (connectedPairs.has([aC, bC].sort().join('|'))) continue; // springs handle these
            const pb = fpos[bC];
            const dr = pa.r - pb.r, dc = pa.c - pb.c;
            const dist = Math.sqrt(dr * dr + dc * dc) || 0.01;
            if (dist >= REP_RADIUS) continue;
            const repF = REP_K * (REP_RADIUS - dist) / dist;
            forces[aC].fr += repF * dr; forces[bC].fr -= repF * dr;
            forces[aC].fc += repF * dc; forces[bC].fc -= repF * dc;
          }
        }
      }
    }

    // Boundary containment
    for (const code of Object.keys(nodeMap)) {
      const p = fpos[code], f = forces[code];
      if (p.r < GRID_MIN) f.fr += 15 * (GRID_MIN - p.r);
      if (p.r > GRID_MAX) f.fr -= 15 * (p.r - GRID_MAX);
      if (p.c < GRID_MIN) f.fc += 15 * (GRID_MIN - p.c);
      if (p.c > GRID_MAX) f.fc -= 15 * (p.c - GRID_MAX);
    }

    // Euler integration with damping
    for (const code of Object.keys(nodeMap)) {
      const v = vel[code], f = forces[code], p = fpos[code];
      v.dr = (v.dr + f.fr * DT) * DAMPING;
      v.dc = (v.dc + f.fc * DT) * DAMPING;
      p.r += v.dr * DT;
      p.c += v.dc * DT;
    }
  }

  // Snap to integers
  const snapped = {};
  for (const code of Object.keys(nodeMap)) {
    snapped[code] = { r: Math.round(fpos[code].r), c: Math.round(fpos[code].c) };
  }

  // Post-pass: resolve collisions by nudging the less-connected node
  // Sorted by degree ascending so low-degree nodes move first (spring nodes stay)
  const degree = code => ['N','E','S','W'].filter(d => nodeMap[code]?.[d] && nodeMap[nodeMap[code][d]]).length;
  const codesByDeg = Object.keys(nodeMap).slice().sort((a, b) => degree(a) - degree(b));
  const nudgeDirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]];
  for (let pass = 0; pass < 10; pass++) {
    const posKey = new Map(Object.entries(snapped).map(([c, p]) => [`${p.r},${p.c}`, c]));
    let moved = 0;
    for (const code of codesByDeg) {
      const p = snapped[code];
      const key = `${p.r},${p.c}`;
      const occupier = posKey.get(key);
      if (!occupier || occupier === code) continue;
      // Nudge this node in the first free direction
      for (const [dr, dc] of nudgeDirs) {
        const nr = p.r + dr, nc = p.c + dc;
        const nk = `${nr},${nc}`;
        if (!posKey.has(nk) && nr >= GRID_MIN && nr <= GRID_MAX && nc >= GRID_MIN && nc <= GRID_MAX) {
          posKey.delete(key);
          snapped[code] = { r: nr, c: nc };
          posKey.set(nk, code);
          moved++;
          break;
        }
      }
    }
    if (moved === 0) break;
  }

  return snapped;
}

// ─── Issue detection ──────────────────────────────────────────────────────────
function detectIssues(nodeMap, edges, pos) {
  const issues = [];
  const seen = new Set();

  // Collisions: two nodes at same coordinate
  const posMap = {};
  for (const [code, p] of Object.entries(pos)) {
    const key = `${p.r},${p.c}`;
    if (posMap[key]) {
      issues.push({ type: 'COLLISION', nodes: [code, posMap[key]], at: p });
    } else {
      posMap[key] = code;
    }
  }

  // Orphans: node with no connections at all
  for (const [code, n] of Object.entries(nodeMap)) {
    if (!n.N && !n.E && !n.S && !n.W) {
      issues.push({ type: 'ORPHAN', node: code });
    }
  }

  // Edge-level issues
  for (const { aC, bC, dir } of edges) {
    const key = [aC, bC].sort().join('|');
    if (seen.has(key)) continue; seen.add(key);

    if (!pos[aC] || !pos[bC]) {
      issues.push({ type: 'MISSING_COORDS', edge: `${aC}.${dir}→${bC}` });
      continue;
    }

    const pa = pos[aC], pb = pos[bC];
    const d = DIR[dir];

    if (d.axis === 'r') {
      const colOff  = Math.abs(pb.c - pa.c);
      const rowDist = Math.abs(pb.r - pa.r);
      if (colOff > 0) {
        issues.push({ type: 'BENDY_NS', edge: `${aC}.${dir}→${bC}`, colMismatch: colOff, from: pa, to: pb });
      }
      if (rowDist < 1 || rowDist > MAX_GAP) {
        issues.push({ type: 'RANGE_VIOL', edge: `${aC}.${dir}→${bC}`, dist: rowDist, allowed: [1, MAX_GAP], from: pa, to: pb });
      }
    } else {
      const rowOff  = Math.abs(pb.r - pa.r);
      const colDist = Math.abs(pb.c - pa.c);
      if (rowOff > 0) {
        issues.push({ type: 'BENDY_EW', edge: `${aC}.${dir}→${bC}`, rowMismatch: rowOff, from: pa, to: pb });
      }
      if (colDist < 1 || colDist > MAX_GAP) {
        issues.push({ type: 'RANGE_VIOL', edge: `${aC}.${dir}→${bC}`, dist: colDist, allowed: [1, MAX_GAP], from: pa, to: pb });
      }
    }
  }

  return issues;
}

// ─── Elbow junction suggestions ───────────────────────────────────────────────
// For each BENDY edge, propose an elbow junction at the axis intersection.
// The elbow makes two axis-aligned legs out of one diagonal connection.
function suggestElbows(issues, pos, port) {
  const elbows = [];
  let idx = 1;

  for (const issue of issues) {
    if (issue.type !== 'BENDY_EW' && issue.type !== 'BENDY_NS') continue;
    const m = issue.edge.match(/^(\w+)\.([NESW])→(\w+)$/);
    if (!m) continue;
    const [, aC, dir, bC] = m;
    const pa = issue.from, pb = issue.to;
    let elbR, elbC, vertOrHoriz;

    if (issue.type === 'BENDY_EW') {
      // E/W connection, row mismatch → elbow at (pa.r, pb.c)
      elbR = pa.r; elbC = pb.c;
      vertOrHoriz = pb.r < elbR ? 'N' : 'S';
    } else {
      // N/S connection, col mismatch → elbow at (pb.r, pa.c)
      elbR = pb.r; elbC = pa.c;
      vertOrHoriz = pb.c > elbC ? 'E' : 'W';
    }

    const code = `ELB${String(idx++).padStart(3, '0')}`;
    const backDir = DIR[dir].opp;

    elbows.push({
      code,
      r: elbR, c: elbC,
      type: 'junction',
      // Wiring: elbow connects back to A on the reverse axis, forward to B on the perpendicular
      connect: {
        [backDir]:      aC,
        [vertOrHoriz]:  bC,
      },
      // What to patch in A and B
      patch: {
        [aC]: { field: dir,                          value: code },
        [bC]: { field: DIR[vertOrHoriz].opp,         value: code },
      },
      axisGapA: issue.type === 'BENDY_EW' ? Math.abs(elbC - pa.c) : Math.abs(elbR - pa.r),
      axisGapB: issue.type === 'BENDY_EW' ? Math.abs(elbR - pb.r) : Math.abs(elbC - pb.c),
      // Convenience: ready-to-run API commands
      apiCmds: [
        `# Create elbow junction`,
        `curl -sX POST http://127.0.0.1:${port}/api/node \\`,
        `  -H 'Content-Type: application/json' \\`,
        `  -d '{"code":"${code}","name":"junction","label":"Elbow","junction":true,"${backDir}":"${aC}","${vertOrHoriz}":"${bC}","r":${elbR},"c":${elbC}}'`,
        `# Patch source node ${aC}: ${dir} → ${code}`,
        `curl -sX PUT http://127.0.0.1:${port}/api/node/${aC} \\`,
        `  -H 'Content-Type: application/json' \\`,
        `  -d '{"${dir}":"${code}"}'`,
        `# Patch target node ${bC}: ${DIR[vertOrHoriz].opp} → ${code}`,
        `curl -sX PUT http://127.0.0.1:${port}/api/node/${bC} \\`,
        `  -H 'Content-Type: application/json' \\`,
        `  -d '{"${DIR[vertOrHoriz].opp}":"${code}"}'`,
      ],
      warnings: [
        ...(Math.abs(elbC - pa.c) > MAX_GAP || Math.abs(elbR - pa.r) > MAX_GAP
          ? [`A→ELB leg distance ${issue.type === 'BENDY_EW' ? Math.abs(elbC - pa.c) : Math.abs(elbR - pa.r)} > ${MAX_GAP}: use fill-gap after inserting`]
          : []),
        ...(Math.abs(elbR - pb.r) > MAX_GAP || Math.abs(elbC - pb.c) > MAX_GAP
          ? [`ELB→B leg distance ${issue.type === 'BENDY_EW' ? Math.abs(elbR - pb.r) : Math.abs(elbC - pb.c)} > ${MAX_GAP}: use fill-gap after inserting`]
          : []),
      ],
    });
  }

  return elbows;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) { console.log(HELP); process.exit(0); }

  const getNum = (flag, def) => { const i = argv.indexOf(flag); return i >= 0 && argv[i+1] ? +argv[i+1] : def; };
  const port  = getNum('--port',  1367);
  const iters = getNum('--iters', 800);
  const stepArg = getNum('--step', null);  // null = auto-detect
  const apply = argv.includes('--apply');
  const elbow = argv.includes('--elbow');
  const fresh = argv.includes('--fresh');

  const log = (...a) => process.stderr.write(`[layout-spring] ${a.join(' ')}\n`);

  // 1. Fetch from WBAPI
  let nodeMapData, coordData;
  try {
    const [exportRes, coordRes] = await Promise.all([
      apiGet(port, '/api/export/node_map?format=json'),
      apiGet(port, '/api/coords'),
    ]);
    nodeMapData = exportRes.data || {};
    coordData   = coordRes.coords || {};
  } catch (e) {
    log(`ERROR fetching from WBAPI: ${e.message}`);
    log('Is WBAPI running? Try: node src/js/wbapi-server.js');
    process.exit(1);
  }

  const allCodes = Object.keys(nodeMapData);
  log(`Loaded ${allCodes.length} nodes, ${Object.keys(coordData).length} with existing coords`);

  // Determine step size (rest lengths scale with step; MAX_GAP is always 4)
  STEP = stepArg !== null ? stepArg : (fresh ? 1 : detectStep(nodeMapData, coordData));
  MAX_GAP = 4; // _buildNodeExits probes exactly 1..4, never more
  log(`step=${STEP} maxGap=${MAX_GAP} fresh=${fresh} (note: junction rest=${STEP * 2} — connections > 4 need fill-gap)`);

  // Warn about missing node references
  const missing = [];
  for (const [code, n] of Object.entries(nodeMapData)) {
    for (const dir of ['N','E','S','W']) {
      const ref = n[dir];
      if (ref && !nodeMapData[ref]) missing.push(`${code}.${dir}→"${ref}"`);
    }
  }
  if (missing.length) {
    log(`WARNING: ${missing.length} dangling references (node referenced but not in NODE_MAP):`);
    missing.slice(0, 8).forEach(m => log(`  ${m}`));
    if (missing.length > 8) log(`  ...and ${missing.length - 8} more`);
  }

  // 2. Build edges
  const edges = buildEdges(nodeMapData);
  log(`${edges.length} edges`);

  // 3. Initial placement
  log('Initial BFS placement...');
  const seedCoords = fresh ? {} : coordData;
  const initPos = initialPlace(nodeMapData, seedCoords);

  // 4. Simulation
  log(`Running ${iters} iterations...`);
  const finalPos = simulate(nodeMapData, edges, initPos, iters);

  // 5. Issues
  const issues = detectIssues(nodeMapData, edges, finalPos);

  // 6. Elbows (optional)
  const elbows = elbow ? suggestElbows(issues, finalPos, port) : [];

  // 7. Output
  const countByType = t => issues.filter(i => i.type === t).length;
  const stats = {
    nodes:           allCodes.length,
    edges:           edges.length,
    iters,
    step:            STEP,
    maxGap:          MAX_GAP,
    fresh,
    missingRefs:     missing.length,
    orphans:         countByType('ORPHAN'),
    collisions:      countByType('COLLISION'),
    bendy_ew:        countByType('BENDY_EW'),
    bendy_ns:        countByType('BENDY_NS'),
    range_violations:countByType('RANGE_VIOL'),
    elbows_proposed: elbows.length,
  };

  const output = { ok: true, stats, issues, elbows, placed: finalPos };
  process.stdout.write(JSON.stringify(output, null, 2) + '\n');

  // 8. Apply (optional)
  if (apply) {
    log(`Applying ${allCodes.length} coords via POST /api/layout/apply ...`);
    try {
      const r = await apiPost(port, '/api/layout/apply', { coords: finalPos });
      log(`Apply: HTTP ${r.status} — ${r.body?.ok ? 'OK' : JSON.stringify(r.body).slice(0, 120)}`);
    } catch (e) {
      log(`Apply failed: ${e.message}`);
    }
  }

  // 9. Summary to stderr
  log('─'.repeat(60));
  log(`RESULT: ${stats.bendy_ew} BENDY_EW  ${stats.bendy_ns} BENDY_NS  ${stats.range_violations} RANGE_VIOL  ${stats.collisions} COLLISION`);
  if (elbows.length) {
    log(`${elbows.length} elbow junctions proposed. To create:`);
    elbows.forEach(e => { e.apiCmds.forEach(cmd => log(`  ${cmd}`)); });
  }
  if (!apply) log('Dry run — use --apply to write coords, --elbow for junction suggestions');
}

main().catch(e => {
  process.stderr.write(`[layout-spring] Fatal: ${e.message}\n${e.stack}\n`);
  process.exit(1);
});
