#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com
// §NAV-01b — road-net invariant guard (CI-gated, stdlib-only, read-only).
//
//   R1  every settlement cell (distinct occupied CELL_GRID cell) touches the road
//       network: it is on/adjacent to a road cell OR adjacent to another settlement
//       (dense city clusters need no tarmac between touching cells) OR adjacent to
//       a SEA_LANE (island crossings ride the carved channels, which stay ocean).
//   R2  the road network is ONE component when stitched through settlement and
//       sea-lane cells (road∪settlement∪lane graph reaches all settlements+roads).
//   R3  roads never overlap sea (ROAD∩IMPASSABLE=∅), sea-lanes (lanes stay ocean),
//       or named cells (settlements are not road terrain).
//   R4  road fraction sanity: |ROAD| < 10% of passable band cells.
//
// Exit 0 if all hold; exit 1 with detail otherwise.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GAME = fs.readFileSync(path.join(ROOT, 'roll2hit-v3.html'), 'utf8');
const ROWS = 90, COLS = 360;
const fails = [];

function objLiteral(name) {
  const m = GAME.match(new RegExp(`const\\s+${name}\\s*=\\s*(\\{[\\s\\S]*?\\});`));
  if (!m) throw new Error(`could not extract ${name}`);
  return eval('(' + m[1] + ')'); // trusted local source
}
function expandRuns(runs) {
  const s = new Set();
  for (const [r, rr] of Object.entries(runs))
    for (const [a, b] of rr) for (let c = a; c <= b; c++) s.add(`${r},${c}`);
  return s;
}

const roads = expandRuns(objLiteral('ROAD_RUNS'));
const sea = expandRuns(objLiteral('SEA_RUNS'));
const laneM = GAME.match(/const\s+SEA_LANES\s*=\s*new Set\(\s*(\[[\s\S]*?\])\s*\)\s*;/);
const lanes = new Set(laneM ? (new Function('return ' + laneM[1]))() : []);
const impassable = new Set(sea);
for (const k of lanes) impassable.delete(k);

const ncStart = GAME.indexOf('const NODE_COORDS');
const ncSeg = GAME.slice(ncStart, GAME.indexOf('};', ncStart));
const settlements = new Set();
for (const m of ncSeg.matchAll(/[A-Za-z0-9_]+\s*:\s*\{\s*r\s*:\s*(\d+)\s*,\s*c\s*:\s*(\d+)/g))
  settlements.add(`${m[1]},${m[2]}`);

function* neigh(k) {
  const ci = k.indexOf(','), r = +k.slice(0, ci), c = +k.slice(ci + 1);
  if (r > 0) yield `${r - 1},${c}`;
  if (r < ROWS - 1) yield `${r + 1},${c}`;
  yield `${r},${(c + 1) % COLS}`;
  yield `${r},${(c + COLS - 1) % COLS}`;
}

// R3 — overlaps
for (const k of roads) {
  if (impassable.has(k)) { fails.push(`R3: road cell ${k} is impassable sea`); break; }
}
for (const k of roads) {
  if (lanes.has(k)) { fails.push(`R3: road cell ${k} overlaps a SEA_LANE (lanes stay ocean)`); break; }
}
for (const k of roads) {
  if (settlements.has(k)) { fails.push(`R3: road cell ${k} overlaps a settlement cell`); break; }
}

// R1 — every settlement touches the net (roads, a neighbouring settlement, or a lane)
let r1Bad = 0;
for (const s of settlements) {
  let ok = roads.has(s);
  for (const n of neigh(s)) if (roads.has(n) || settlements.has(n) || lanes.has(n)) ok = true;
  if (!ok) { r1Bad++; if (r1Bad <= 5) fails.push(`R1: settlement ${s} touches no road, lane, or adjacent settlement`); }
}
if (r1Bad > 5) fails.push(`R1: …and ${r1Bad - 5} more`);

// R2 — single component over road∪settlement∪lane, reaching all settlements + roads
const nodes = new Set([...roads, ...settlements, ...lanes]);
const seen = new Set();
const start = settlements.values().next().value;
let frontier = [start]; seen.add(start);
while (frontier.length) {
  const next = [];
  for (const k of frontier)
    for (const n of neigh(k))
      if (nodes.has(n) && !seen.has(n)) { seen.add(n); next.push(n); }
  frontier = next;
}
let unreached = 0;
for (const s of settlements) if (!seen.has(s)) { unreached++; if (unreached <= 5) fails.push(`R2: settlement ${s} not on the road component`); }
if (unreached > 5) fails.push(`R2: …and ${unreached - 5} more`);
const roadUnreached = [...roads].filter(k => !seen.has(k)).length;
if (roadUnreached) fails.push(`R2: ${roadUnreached} road cell(s) disconnected from the main component`);

// R4 — fraction sanity
const passable = ROWS * COLS - impassable.size;
const frac = roads.size / passable;
if (frac >= 0.10) fails.push(`R4: road fraction ${(frac * 100).toFixed(1)}% ≥ 10% of passable`);

console.log('§NAV-01b road-net invariants');
console.log(`  R1  settlements touching net: ${settlements.size - r1Bad}/${settlements.size}`);
console.log(`  R2  single component: settlements ${settlements.size - unreached}/${settlements.size} · stray road cells ${roadUnreached}`);
console.log(`  R3  overlaps (sea/lane/settlement): ${fails.filter(f => f.startsWith('R3')).length}`);
console.log(`  R4  road cells ${roads.size} = ${(frac * 100).toFixed(1)}% of ${passable} passable`);

if (fails.length) {
  console.error('\n✗ ROAD INVARIANT VIOLATIONS:');
  for (const f of fails) console.error('   ✗ ' + f);
  process.exit(1);
}
console.log('\n✓ road net connects every settlement, overlaps nothing, stays lean');
process.exit(0);
