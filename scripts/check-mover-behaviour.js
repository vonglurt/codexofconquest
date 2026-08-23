#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §WALK-2 — behavioural walk-parity: replay the REAL geo-grid (CELL_GRID +
// IMPASSABLE_CELLS extracted from index.html) through both the OLD inline
// cellMove decision logic and the NEW shared mover.js kernel, and assert they
// agree on (ok, destCode) for every interior cell × every direction.
//
// Expected (and reported, not failed) divergence: the N/S band edges (geo clamp
// at rows 0 / 89 vs the old `r<1` block) and E↔W wrap at cols 0 / 359 — all of
// which are open ocean with no named node or content (nodes occupy rows 2..73,
// cols 154..249), so no destCode decision differs there.
'use strict';
const fs = require('fs');
const path = require('path');
const { move } = require('../js/mover.js');

const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function literal(name) {
  const re = new RegExp(`const\\s+${name}\\s*=\\s*(\\{[\\s\\S]*?\\});`);
  const m = src.match(re);
  if (!m) throw new Error(`could not extract ${name}`);
  return eval('(' + m[1] + ')'); // trusted local source
}

// Rebuild the exact world the game builds at load.
const NODE_COORDS = literal('NODE_COORDS');
const SEA_RUNS = literal('SEA_RUNS');

const CELL_GRID = {};
for (const code of Object.keys(NODE_COORDS)) {
  const { r, c } = NODE_COORDS[code];
  if (r != null && c != null) (CELL_GRID[`${r},${c}`] ??= []).push(code);
}
const IMPASSABLE = new Set();
for (const [r, runs] of Object.entries(SEA_RUNS))
  for (const [a, b] of runs) for (let c = a; c <= b; c++) IMPASSABLE.add(`${r},${c}`);

const cellCode = (key) => CELL_GRID[key]?.[0] || null;
const world = {
  proj: { ROWS: 90, COLS: 360 },
  impassable: IMPASSABLE,
  cellCodes: (r, c) => CELL_GRID[`${r},${c}`] || [],
};

// OLD decision logic, verbatim from pre-§WALK-2 cellMove.
const DELTAS = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };
function oldMove(pr, pc, dir) {
  const [dr, dc] = DELTAS[dir];
  const nr = pr + dr, nc = pc + dc;
  if (nr < 1 || nc < 1 || nr > 500 || nc > 500 || IMPASSABLE.has(`${nr},${nc}`)) return { ok: false };
  return { ok: true, destCode: cellCode(`${nr},${nc}`) };
}

// Sweep the active window (rows 0..89, cols 140..255 — the populated band).
const DIRS = ['N', 'S', 'E', 'W'];
let checked = 0, agree = 0, edgeOnly = 0, mismatches = [];
for (let r = 0; r <= 89; r++) {
  for (let c = 140; c <= 255; c++) {
    for (const dir of DIRS) {
      checked++;
      const o = oldMove(r, c, dir);
      const n = move(world, { r, c }, dir);
      const oOk = o.ok, nOk = n.ok;
      const oDest = o.ok ? (o.destCode || null) : null;
      const nDest = n.ok ? (n.destCodes[0] || null) : null;
      if (oOk === nOk && oDest === nDest) { agree++; continue; }
      // Tolerated divergence: only at the geo band edges / wrap, and only when no
      // named destination is involved on either side (pure empty-ocean fringe).
      const atEdge = (r === 0 || r === 89 || c === 0 || c === 359 ||
                      (dir === 'N' && r <= 1) || (dir === 'S' && r >= 88));
      if (atEdge && !oDest && !nDest) { edgeOnly++; continue; }
      mismatches.push({ r, c, dir, old: o, new: { ok: nOk, dest: nDest } });
    }
  }
}

console.log(`checked ${checked} (cell × dir) decisions`);
console.log(`  agree exactly:        ${agree}`);
console.log(`  edge/wrap fringe only: ${edgeOnly} (empty ocean, no named dest — geo clamp/wrap vs old r<1 block)`);
console.log(`  content mismatches:    ${mismatches.length}`);
if (mismatches.length) {
  console.error('✗ behavioural parity FAILED — content-affecting divergence:');
  for (const m of mismatches.slice(0, 20)) console.error('   ', JSON.stringify(m));
  process.exit(1);
}
console.log('✓ behavioural parity: new kernel reproduces every content-affecting cellMove decision');
process.exit(0);
