#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §WALK-4 Inc 1 — terrain-field invariant proof (CI-gated, no server needed).
//
// Parses the committed play.html (same approach as check-mover-*.js) and
// proves the three field invariants from the lab report §5/§6:
//
//   I1 (totality):      terrainAt is defined for every named cell — every
//                       NODE_MAP[code].name resolves to a WORLD_DB terrain, and
//                       the universal `midlands` fallback exists (so inferred
//                       neighbour terrain is always defined too).
//   I2 (no stubs):      no `junction:true` node and no `junction:` WORLD_DB entry
//                       (junctions were bulk-deleted in §WALK-1/§CELL-05).
//   I3 (reachability):  every named node is reachable from hub LHR by a
//                       4-connected LAND walk (E↔W wrap, N/S clamp) over the
//                       passable terrain field — i.e. unreachable===0 and the
//                       map is a single component. Replicates the server's
//                       GET /api/graph/reachability flood exactly.
//
// Exit 0 if all hold; exit 1 (with detail) on any violation.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8');
const HUB = process.argv[2] || 'LHR';

// ── Safe literal extraction (NODE_COORDS / SEA_RUNS are plain data, no refs) ──
function literal(name) {
  const re = new RegExp(`const\\s+${name}\\s*=\\s*(\\{[\\s\\S]*?\\});`);
  const m = src.match(re);
  if (!m) throw new Error(`could not extract ${name}`);
  return eval('(' + m[1] + ')'); // trusted local source
}

const NODE_COORDS = literal('NODE_COORDS');
const SEA_RUNS = literal('SEA_RUNS');

// ── Build the impassable (sea) set — identical to client + server ────────────
const IMPASSABLE = new Set();
for (const [r, runs] of Object.entries(SEA_RUNS))
  for (const [a, b] of runs) for (let c = a; c <= b; c++) IMPASSABLE.add(`${r},${c}`);

const fails = [];

// ════════════════════════════════════════════════════════════════════════════
// I3 — reachability (the core proof)
// ════════════════════════════════════════════════════════════════════════════
const ROWS = 90, COLS = 360;
const MOVES4 = [[-1, 0], [1, 0], [0, 1], [0, -1]];
const passable = (r, c) => r >= 0 && r < ROWS && !IMPASSABLE.has(`${r},${c}`);

function floodCells(r0, c0) {
  const seen = new Set();
  if (!passable(r0, c0)) return seen;
  seen.add(`${r0},${c0}`);
  const stack = [[r0, c0]];
  while (stack.length) {
    const [r, c] = stack.pop();
    for (const [dr, dc] of MOVES4) {
      const nr = r + dr, nc = ((c + dc) % COLS + COLS) % COLS; // wrap E↔W
      const k = `${nr},${nc}`;
      if (seen.has(k) || !passable(nr, nc)) continue;
      seen.add(k); stack.push([nr, nc]);
    }
  }
  return seen;
}

const allCodes = Object.keys(NODE_COORDS).filter(c => {
  const co = NODE_COORDS[c];
  return co && co.r != null && co.c != null;
});

const hubCoord = NODE_COORDS[HUB];
if (!hubCoord) { fails.push(`I3: hub '${HUB}' has no coordinates`); }

let reachableCount = 0, unreachable = [], componentCount = 0;
if (hubCoord) {
  const hubCells = floodCells(hubCoord.r, hubCoord.c);
  const inHub = (code) => { const co = NODE_COORDS[code]; return co && hubCells.has(`${co.r},${co.c}`); };
  for (const code of allCodes) {
    if (inHub(code)) reachableCount++;
    else unreachable.push(code);
  }
  // components = distinct passable-land regions containing ≥1 named node
  const seenRegion = new Set();
  for (const code of allCodes) {
    const co = NODE_COORDS[code];
    if (!passable(co.r, co.c)) { continue; }
    if (seenRegion.has(`${co.r},${co.c}`)) continue;
    componentCount++;
    for (const k of floodCells(co.r, co.c)) seenRegion.add(k);
  }
  if (unreachable.length !== 0)
    fails.push(`I3: ${unreachable.length} unreachable node(s) from ${HUB}: ${unreachable.slice(0, 15).join(', ')}${unreachable.length > 15 ? ' …' : ''}`);
  if (componentCount !== 1)
    fails.push(`I3: map has ${componentCount} land components (expected 1)`);
}

// ════════════════════════════════════════════════════════════════════════════
// I2 — no routing stubs (junctions)
// ════════════════════════════════════════════════════════════════════════════
const junctionTrue = (src.match(/\bjunction\s*:\s*true\b/g) || []).length;
if (junctionTrue !== 0) fails.push(`I2: found ${junctionTrue} 'junction:true' occurrence(s) in source`);

// WORLD_DB slice (brace-matched) — assert no junction terrain entry + collect keys
// Line-based slice: from `const NAME = {` to the first line that closes the
// object (`};` at column 0–1). Robust against apostrophes/escaped quotes in the
// narrative text — top-level entries close with `  },` (comma), and nested
// objects are inline, so only the object terminator sits alone as `};`.
const SRC_LINES = src.split('\n');
function sliceObject(constName) {
  const startIdx = SRC_LINES.findIndex(l => l.startsWith(`const ${constName} = {`));
  if (startIdx < 0) throw new Error(`could not locate ${constName}`);
  for (let i = startIdx + 1; i < SRC_LINES.length; i++) {
    if (/^ ?};/.test(SRC_LINES[i])) return SRC_LINES.slice(startIdx, i + 1).join('\n');
  }
  throw new Error(`unterminated ${constName}`);
}

const worldBody = sliceObject('WORLD_DB');
// top-level terrain keys: `^  key:` at 2-space indent inside the object
const terrainKeys = new Set();
for (const line of worldBody.split('\n')) {
  const m = line.match(/^ {2}([A-Za-z_][A-Za-z0-9_]*)\s*:/);
  if (m) terrainKeys.add(m[1]);
}
if (terrainKeys.has('junction')) fails.push(`I2: WORLD_DB still has a 'junction' terrain entry`);

// ════════════════════════════════════════════════════════════════════════════
// I1 — terrain totality
// ════════════════════════════════════════════════════════════════════════════
if (!terrainKeys.has('midlands'))
  fails.push(`I1: WORLD_DB is missing the universal 'midlands' fallback terrain`);

// node → terrain: each NODE_MAP entry opens `  CODE:{ … name:'terrain' …` on one line
const nodeMapBody = sliceObject('NODE_MAP');
const nodeTerrains = {};
for (const line of nodeMapBody.split('\n')) {
  const m = line.match(/^ {2}([A-Za-z0-9_]{2,8})\s*:\s*\{.*?\bname\s*:\s*['"]([^'"]+)['"]/);
  if (m) nodeTerrains[m[1]] = m[2];
}
const missingTerrain = [];
for (const [code, terrain] of Object.entries(nodeTerrains)) {
  if (!terrainKeys.has(terrain)) missingTerrain.push(`${code}→${terrain}`);
}
if (missingTerrain.length)
  fails.push(`I1: ${missingTerrain.length} node(s) reference a terrain absent from WORLD_DB: ${missingTerrain.slice(0, 15).join(', ')}`);

// sanity: we actually parsed the node→terrain map (catch a silently-broken regex)
if (Object.keys(nodeTerrains).length < allCodes.length * 0.9)
  fails.push(`I1: only parsed ${Object.keys(nodeTerrains).length} node terrains for ${allCodes.length} coord'd nodes — regex likely stale, re-check NODE_MAP format`);

// ── Report ───────────────────────────────────────────────────────────────────
console.log('§WALK-4 terrain-field invariant proof');
console.log(`  hub=${HUB}  nodes=${allCodes.length}  sea-cells=${IMPASSABLE.size}  terrains=${terrainKeys.size}`);
console.log(`  I3  reachable=${reachableCount}/${allCodes.length}  unreachable=${unreachable.length}  components=${componentCount}`);
console.log(`  I2  junction:true=${junctionTrue}  WORLD_DB.junction=${terrainKeys.has('junction')}`);
console.log(`  I1  node-terrains=${Object.keys(nodeTerrains).length}  missing-in-WORLD_DB=${missingTerrain.length}  midlands=${terrainKeys.has('midlands')}`);

if (fails.length) {
  console.error('\n✗ INVARIANT VIOLATIONS:');
  for (const f of fails) console.error('   ✗ ' + f);
  process.exit(1);
}
console.log('\n✓ I1 + I2 + I3 hold — terrain field is total, stub-free, and fully reachable from ' + HUB);
process.exit(0);
