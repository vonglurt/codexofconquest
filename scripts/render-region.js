#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §DX-02a — read-only ASCII visualizer for a world-grid window (promoted from
// the §DX-01a debugging session, where it made the road/sea defects one glance).
// Legend: ~ sea · = lane · # road · X road-on-sea (R3 violation!) · @ settlement · . land
// Usage: node scripts/render-region.js [r0 r1 c0 c1]   (default 5 17 200 222)
'use strict';
const fs = require('fs');
const path = require('path');
const GAME = fs.readFileSync(path.join(path.resolve(__dirname, '..'), 'roll2hit-v3.html'), 'utf8');
function objLiteral(name) {
  const m = GAME.match(new RegExp(`const\\s+${name}\\s*=\\s*(\\{[\\s\\S]*?\\});`));
  return eval('(' + m[1] + ')');
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
const ncStart = GAME.indexOf('const NODE_COORDS');
const ncSeg = GAME.slice(ncStart, GAME.indexOf('};', ncStart));
const settle = new Map();
for (const m of ncSeg.matchAll(/([A-Za-z0-9_]+)\s*:\s*\{\s*r\s*:\s*(\d+)\s*,\s*c\s*:\s*(\d+)/g)) {
  const k = `${m[2]},${m[3]}`;
  settle.set(k, (settle.get(k) ? settle.get(k) + '+' : '') + m[1]);
}
const R0 = +(process.argv[2] || 5), R1 = +(process.argv[3] || 17), C0 = +(process.argv[4] || 200), C1 = +(process.argv[5] || 222);
let hdr = '     ';
for (let c = C0; c <= C1; c++) hdr += String(c % 10);
console.log(hdr);
for (let r = R0; r <= R1; r++) {
  let line = String(r).padStart(3) + ': ';
  for (let c = C0; c <= C1; c++) {
    const k = `${r},${c}`;
    let ch = '.';
    if (sea.has(k)) ch = lanes.has(k) ? '=' : '~';
    if (roads.has(k)) ch = sea.has(k) && !lanes.has(k) ? 'X' : '#';
    if (settle.has(k)) ch = '@';
    line += ch;
  }
  console.log(line);
}
console.log('\nsettlements in window:');
for (const [k, v] of settle) {
  const [r, c] = k.split(',').map(Number);
  if (r >= R0 && r <= R1 && c >= C0 && c <= C1) console.log(' ', k, v);
}
