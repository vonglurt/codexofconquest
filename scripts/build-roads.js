#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com
// §NAV-01b — fungal road-net generator. Reads NODE_COORDS / SEA_RUNS / SEA_LANES
// out of roll2hit-v3.html, connects every settlement cell (distinct occupied
// CELL_GRID cell) with walkable road corridors, and emits a ROAD_RUNS RLE data
// block (same encoding as SEA_RUNS).
//
// Algorithm (deterministic — no Math.random, stable tie-breaks):
//   1. settlement graph: candidate edges from per-settlement BFS over passable
//      cells (radius cap, raised until the graph is connected);
//   2. Kruskal MST guarantees one component + local edges (dist ≤ LOCAL_MAX)
//      add loops between close neighbours;
//   3. corridors carved in edge order by weighted Dijkstra where cells already
//      roaded cost less than virgin ground and settlement cells are cheapest —
//      later corridors REUSE earlier trunks, which is what grows organic
//      highways with intersections and T-junctions ("fungal roads") instead of
//      235² independent spaghetti;
//   4. road set = corridor cells minus settlement cells minus SEA_LANES (lanes
//      stay ocean — crossings keep their texture); emitted as RLE runs.
//
// Usage:  node scripts/build-roads.js          # dry-run: stats only
//         node scripts/build-roads.js --apply  # patch/replace the ROAD_RUNS
//                                              # block in roll2hit-v3.html
// Pins:   roads-pins.json (repo root, optional) — full schema:
//         { pins:[{r,c}], links:[["r,c","r,c"]], locked:["CODE",…] }
//         `links` forces extra corridors here (worldbuilder §NAV-01h authors them);
//         `locked` is consumed by the server's geo-seed (§NAV-01g 🔒 toggle,
//         PUT /api/roads/lock) — locked cities keep their coords, not a road input.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GAME_PATH = path.join(ROOT, 'roll2hit-v3.html');
const GAME = fs.readFileSync(GAME_PATH, 'utf8');
const APPLY = process.argv.includes('--apply');

const ROWS = 90, COLS = 360;
const LOCAL_MAX = 8;          // extra non-MST edges up to this BFS distance (loops)
const CAP_START = 50;         // BFS radius cap; doubled until the MST connects
// Dijkstra step costs (integer): trunk reuse is ~2.5× cheaper than virgin ground,
// towns are the cheapest pass-throughs, sea-lane hops are dearest (prefer land).
const COST = { settlement: 2, road: 4, virgin: 10, lane: 14 };

// ── parse game data ───────────────────────────────────────────────────────────
function braceLiteral(name) {
  const re = new RegExp(`const\\s+${name}\\s*=\\s*(\\{[\\s\\S]*?\\});`);
  const m = GAME.match(re);
  if (!m) throw new Error(`could not extract ${name}`);
  return eval('(' + m[1] + ')'); // trusted local source
}
const SEA_RUNS = braceLiteral('SEA_RUNS');
const laneM = GAME.match(/const\s+SEA_LANES\s*=\s*new Set\(\s*(\[[\s\S]*?\])\s*\)\s*;/);
const SEA_LANES = new Set(laneM ? (new Function('return ' + laneM[1]))() : []);

const ncStart = GAME.indexOf('const NODE_COORDS');
const ncSeg = GAME.slice(ncStart, GAME.indexOf('};', ncStart));
const NODE_COORDS = {};
for (const m of ncSeg.matchAll(/([A-Za-z0-9_]+)\s*:\s*\{\s*r\s*:\s*(\d+)\s*,\s*c\s*:\s*(\d+)/g))
  NODE_COORDS[m[1]] = { r: +m[2], c: +m[3] };

const impassable = new Set();
for (const [r, runs] of Object.entries(SEA_RUNS))
  for (const [a, b] of runs) for (let c = a; c <= b; c++) impassable.add(`${r},${c}`);
for (const k of SEA_LANES) impassable.delete(k);

const settlementSet = new Set();
for (const { r, c } of Object.values(NODE_COORDS)) settlementSet.add(`${r},${c}`);
const settlements = [...settlementSet].sort();
console.log(`nodes=${Object.keys(NODE_COORDS).length} settlements(cells)=${settlements.length} sea=${impassable.size} lanes=${SEA_LANES.size}`);

// ── neighbours (kernel topology: rows clamp, cols wrap) ───────────────────────
function* neigh(r, c) {
  if (r > 0) yield [r - 1, c];
  if (r < ROWS - 1) yield [r + 1, c];
  yield [r, (c + 1) % COLS];
  yield [r, (c + COLS - 1) % COLS];
}

// ── 1. candidate edges via capped BFS from every settlement ──────────────────
function bfsEdges(cap) {
  const edges = new Map(); // "a|b" (a<b) -> dist
  for (const start of settlements) {
    const dist = new Map([[start, 0]]);
    let frontier = [start];
    for (let d = 1; d <= cap && frontier.length; d++) {
      const next = [];
      for (const k of frontier) {
        const ci = k.indexOf(','), r = +k.slice(0, ci), c = +k.slice(ci + 1);
        for (const [nr, nc] of neigh(r, c)) {
          const nk = `${nr},${nc}`;
          if (dist.has(nk) || impassable.has(nk)) continue;
          dist.set(nk, d);
          next.push(nk);
          if (settlementSet.has(nk)) {
            const key = start < nk ? `${start}|${nk}` : `${nk}|${start}`;
            if (!edges.has(key) || edges.get(key) > d) edges.set(key, d);
          }
        }
      }
      frontier = next;
    }
  }
  return edges;
}

// ── 2. Kruskal MST + local loop edges ────────────────────────────────────────
function connect(edges) {
  const parent = new Map(settlements.map(s => [s, s]));
  const find = x => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra === rb) return false; parent.set(ra, rb); return true; };
  const sorted = [...edges.entries()].sort((x, y) => x[1] - y[1] || (x[0] < y[0] ? -1 : 1));
  const picked = [];
  for (const [key, d] of sorted) {
    const [a, b] = key.split('|');
    if (union(a, b)) picked.push({ a, b, d, kind: 'mst' });
    else if (d <= LOCAL_MAX) picked.push({ a, b, d, kind: 'local' });
  }
  const roots = new Set(settlements.map(find));
  return { picked, components: roots.size };
}

let cap = CAP_START, edges, net;
for (;;) {
  edges = bfsEdges(cap);
  net = connect(edges);
  if (net.components === 1 || cap >= 400) break;
  console.log(`  cap=${cap} leaves ${net.components} components — doubling`);
  cap *= 2;
}
if (net.components !== 1) throw new Error(`road graph disconnected (${net.components} components)`);
console.log(`edges: ${net.picked.length} (mst=${net.picked.filter(e => e.kind === 'mst').length}, local=${net.picked.filter(e => e.kind === 'local').length}), BFS cap=${cap}`);

// optional worldbuilder pins (§NAV-01h)
const pinsPath = path.join(ROOT, 'config', 'roads-pins.json');
if (fs.existsSync(pinsPath)) {
  const pins = JSON.parse(fs.readFileSync(pinsPath, 'utf8'));
  for (const [a, b] of (pins.links || [])) net.picked.push({ a, b, d: 0, kind: 'pin' });
  console.log(`pins: +${(pins.links || []).length} forced links from roads-pins.json`);
}

// ── 3. carve corridors (weighted Dijkstra, trunk reuse) ──────────────────────
const roadSet = new Set();
function cellCost(k) {
  if (settlementSet.has(k)) return COST.settlement;
  if (roadSet.has(k)) return COST.road;
  if (SEA_LANES.has(k)) return COST.lane;
  return COST.virgin;
}
function carve(a, b) {
  // deterministic Dijkstra a→b; O(E log E) with a simple sorted-insertion heap
  const dist = new Map([[a, 0]]);
  const prev = new Map();
  const heap = [[0, a]]; // [cost, key], kept sorted ascending (small frontier — fine)
  while (heap.length) {
    heap.sort((x, y) => x[0] - y[0] || (x[1] < y[1] ? -1 : 1));
    const [d, k] = heap.shift();
    if (k === b) break;
    if (d > dist.get(k)) continue;
    const ci = k.indexOf(','), r = +k.slice(0, ci), c = +k.slice(ci + 1);
    for (const [nr, nc] of neigh(r, c)) {
      const nk = `${nr},${nc}`;
      if (impassable.has(nk)) continue;
      const nd = d + cellCost(nk);
      if (nd < (dist.get(nk) ?? Infinity)) { dist.set(nk, nd); prev.set(nk, k); heap.push([nd, nk]); }
    }
  }
  if (!prev.has(b)) return 0;
  let added = 0;
  for (let cur = b; cur !== a; cur = prev.get(cur))
    if (!settlementSet.has(cur) && !roadSet.has(cur)) { roadSet.add(cur); added++; }
  return added;
}
// mst edges first (short → long: trunks grow outward), then local loops, then pins
const order = { mst: 0, local: 1, pin: 2 };
net.picked.sort((x, y) => order[x.kind] - order[y.kind] || x.d - y.d || (x.a < y.a ? -1 : 1));
for (const e of net.picked) carve(e.a, e.b);
for (const k of SEA_LANES) roadSet.delete(k);   // lanes stay ocean

// intersection census (degree ≥ 3 within road∪settlement = crossroads/T-junctions)
let junctions = 0;
for (const k of roadSet) {
  const ci = k.indexOf(','), r = +k.slice(0, ci), c = +k.slice(ci + 1);
  let deg = 0;
  for (const [nr, nc] of neigh(r, c)) { const nk = `${nr},${nc}`; if (roadSet.has(nk) || settlementSet.has(nk)) deg++; }
  if (deg >= 3) junctions++;
}
const passable = ROWS * COLS - impassable.size;
console.log(`road cells=${roadSet.size} (${(roadSet.size / passable * 100).toFixed(1)}% of passable) — intersections/T-junctions=${junctions}`);

// ── 4. RLE encode + emit ──────────────────────────────────────────────────────
const byRow = {};
for (const k of roadSet) {
  const ci = k.indexOf(','), r = +k.slice(0, ci), c = +k.slice(ci + 1);
  (byRow[r] = byRow[r] || []).push(c);
}
const runs = {};
for (const r of Object.keys(byRow).map(Number).sort((a, b) => a - b)) {
  const cols = byRow[r].sort((a, b) => a - b);
  const rr = [];
  let s = cols[0], p = cols[0];
  for (let i = 1; i <= cols.length; i++) {
    if (cols[i] === p + 1) { p = cols[i]; continue; }
    rr.push([s, p]); s = cols[i]; p = cols[i];
  }
  runs[r] = rr;
}
const runsSrc = Object.entries(runs).map(([r, rr]) => `${r}:[${rr.map(([a, b]) => `[${a},${b}]`).join(',')}]`).join(',');

const block = `// ◆ §NAV-01b ROAD_RUNS:START (generated by scripts/build-roads.js — do not hand-edit; re-run with --apply)
// Fungal road net: MST + local-loop corridors between all ${settlements.length} settlement cells; trunk-reuse
// Dijkstra grows shared highways with intersections/T-junctions. ${roadSet.size} road cells, ${junctions} junctions.
// Roads are TERRAIN (encounter rate 0), never permissions — the open field stays walkable (§NAV-01 guard-rail).
const ROAD_RUNS = {${runsSrc}};
const ROAD_CELLS = (() => {
  const s = new Set();
  for (const [r, rr] of Object.entries(ROAD_RUNS))
    for (const [a, b] of rr) for (let c = a; c <= b; c++) s.add(\`\${r},\${c}\`);
  return s;
})();
// ◆ §NAV-01b ROAD_RUNS:END`;

if (!APPLY) {
  console.log('\n(dry-run — pass --apply to patch roll2hit-v3.html)');
  process.exit(0);
}

const START = '// ◆ §NAV-01b ROAD_RUNS:START';
const END = '// ◆ §NAV-01b ROAD_RUNS:END';
let out;
if (GAME.includes(START)) {
  const s = GAME.indexOf(START);
  const e = GAME.indexOf(END) + END.length;
  out = GAME.slice(0, s) + block + GAME.slice(e);
} else {
  const anchor = '\n// §CELL-04: Encounter probability';
  const i = GAME.indexOf(anchor);
  if (i < 0) throw new Error('insertion anchor not found');
  out = GAME.slice(0, i) + '\n\n' + block + GAME.slice(i);
}
fs.writeFileSync(GAME_PATH, out);
console.log(`\n✓ ROAD_RUNS block ${GAME.includes(START) ? 'replaced' : 'inserted'} in roll2hit-v3.html`);
