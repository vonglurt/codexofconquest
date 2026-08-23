#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §WALK-5 Inc 1 — server↔client terrain/encounter PARITY guard (CI-gated).
//
// The server keeps NO copy of the terrain-encounter data — getMoverWorld() parses
// the client literals (TERRAIN_ENCOUNTER_RATE, SEA_LANES) out of the game source at
// runtime, and terrainAt() reimplements the client's _inferTerrain() algorithm. Two
// ways that can silently drift:
//   (1) the client literal is renamed/reformatted so a server parse-regex no longer
//       matches → the server falls back to {_default:0.15} / an empty lane set;
//   (2) _inferTerrain() (HTML) and terrainAt() (server) are edited apart so the same
//       cell infers different terrain → different encounter table on SP vs MP.
//
// This guard catches both by running the REAL source on each side (extracted + eval'd
// in a sandbox, the same way check-mover-*.js replays the kernel — no replicas):
//   A. RATE/LANE round-trip — the server's exact parse-regexes applied to the current
//      game source must reproduce the client literals exactly (keys+values / set).
//   B. ALGORITHM parity — client _inferTerrain() and server terrainAt() must agree on
//      the inferred terrain for every cell in the populated band.
//
// Exit 0 if both hold; exit 1 (with detail) on any divergence.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GAME = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const SERVER = fs.readFileSync(path.join(ROOT, 'js', 'wbapi-server.js'), 'utf8');

const fails = [];

// ── helpers ──────────────────────────────────────────────────────────────────
// Brace-match a `const NAME = {…};` object literal (data only, no string-braces).
function objLiteral(srcText, name) {
  const re = new RegExp(`const\\s+${name}\\s*=\\s*(\\{[\\s\\S]*?\\});`);
  const m = srcText.match(re);
  if (!m) throw new Error(`could not extract object ${name}`);
  return eval('(' + m[1] + ')'); // trusted local source
}
// Extract a named `function NAME(…){…}` by brace-counting. Template-literal `${…}`
// interpolations are brace-balanced, so a naive counter still finds the true close.
function extractFn(srcText, name) {
  const start = srcText.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`could not find function ${name}`);
  const braceStart = srcText.indexOf('{', start);
  let depth = 0;
  for (let i = braceStart; i < srcText.length; i++) {
    if (srcText[i] === '{') depth++;
    else if (srcText[i] === '}' && --depth === 0) return srcText.slice(start, i + 1);
  }
  throw new Error(`unterminated function ${name}`);
}

// ── shared world data, built offline exactly as the game/server build it ──────
const NODE_COORDS = objLiteral(GAME, 'NODE_COORDS');

// Line-slice the NODE_MAP object body (start `const NODE_MAP = {` → first `};` line)
// so the node→terrain regex can't pick up like-shaped lines from MONSTER_POOL / NPC
// defs elsewhere in the file (a boss keyed by a real node's short code would otherwise
// overwrite that node's terrain). Same approach as scripts/check-invariants.js.
function sliceObject(srcText, constName) {
  const lines = srcText.split('\n');
  const start = lines.findIndex(l => l.startsWith(`const ${constName} = {`));
  if (start < 0) throw new Error(`could not locate ${constName}`);
  for (let i = start + 1; i < lines.length; i++)
    if (/^ ?};/.test(lines[i])) return lines.slice(start, i + 1).join('\n');
  throw new Error(`unterminated ${constName}`);
}

// node → terrain name (same NODE_MAP line-regex as scripts/check-invariants.js),
// scoped to the NODE_MAP slice so only real nodes contribute.
const nodeName = {};
for (const line of sliceObject(GAME, 'NODE_MAP').split('\n')) {
  const m = line.match(/^ {2}([A-Za-z0-9_]{2,8})\s*:\s*\{.*?\bname\s*:\s*['"]([^'"]+)['"]/);
  if (m) nodeName[m[1]] = m[2];
}
const NODE_MAP = {};
for (const [code, name] of Object.entries(nodeName)) NODE_MAP[code] = { name };

// first-wins cell grid (NODE_COORDS key order) — client CELL_GRID == server localeGrid
const CELL_GRID = {};
for (const code of Object.keys(NODE_COORDS)) {
  const { r, c } = NODE_COORDS[code];
  if (r != null && c != null) (CELL_GRID[`${r},${c}`] ??= []).push(code);
}
const cellCode = (key) => (CELL_GRID[key] ? CELL_GRID[key][0] : null);

// ── A. RATE table round-trip ──────────────────────────────────────────────────
// client truth (brace-matched literal) vs server's exact parse-regex on same source
const clientRates = objLiteral(GAME, 'TERRAIN_ENCOUNTER_RATE');
let serverRates = null;
{
  const m = GAME.match(/const\s+TERRAIN_ENCOUNTER_RATE\s*=\s*(\{[\s\S]*?\});/); // verbatim from wbapi-server.js
  if (m) { try { serverRates = (new Function('return ' + m[1]))(); } catch {} }
}
if (!serverRates) {
  fails.push('A: server TERRAIN_ENCOUNTER_RATE regex matched nothing — table would fall back to {_default:0.15}');
} else {
  const ck = Object.keys(clientRates).sort(), sk = Object.keys(serverRates).sort();
  if (ck.join(',') !== sk.join(','))
    fails.push(`A: rate-table keys differ — client[${ck.length}] vs server[${sk.length}]`);
  for (const k of ck)
    if (clientRates[k] !== serverRates[k])
      fails.push(`A: rate '${k}' client=${clientRates[k]} server=${serverRates[k]}`);
  if (!('_default' in serverRates)) fails.push('A: server rate table lost its _default');
}

// ── A2. SEA_LANES round-trip ──────────────────────────────────────────────────
function evalSet(expr) { return new Set((new Function('return ' + expr))()); }
let clientLanes = null, serverLanes = null;
{
  const cm = GAME.match(/const\s+SEA_LANES\s*=\s*(new Set\([\s\S]*?\))\s*;/);
  if (cm) clientLanes = evalSet(cm[1]);
  const sm = GAME.match(/const\s+SEA_LANES\s*=\s*new Set\(\s*(\[[\s\S]*?\])\s*\)\s*;/); // verbatim from wbapi-server.js
  if (sm) serverLanes = new Set((new Function('return ' + sm[1]))());
}
if (!clientLanes) fails.push('A2: could not read client SEA_LANES literal');
if (!serverLanes) {
  fails.push('A2: server SEA_LANES regex matched nothing — lane set would be empty');
} else if (clientLanes) {
  if (clientLanes.size !== serverLanes.size)
    fails.push(`A2: SEA_LANES size differs — client ${clientLanes.size} vs server ${serverLanes.size}`);
  for (const k of clientLanes) if (!serverLanes.has(k)) { fails.push(`A2: server SEA_LANES missing ${k}`); break; }
}

// ── A3. ROAD_RUNS round-trip (§NAV-01b) ──────────────────────────────────────
// client truth = the generated RLE literal expanded exactly as the game IIFE does;
// server truth = wbapi-server getRoadCells()'s exact parse-regex on the same source.
function expandRuns(runs) {
  const s = new Set();
  for (const [r, rr] of Object.entries(runs))
    for (const [a, b] of rr) for (let c = a; c <= b; c++) s.add(`${r},${c}`);
  return s;
}
let clientRoads = null, serverRoads = null;
try { clientRoads = expandRuns(objLiteral(GAME, 'ROAD_RUNS')); } catch {}
{
  const sm = GAME.match(/const\s+ROAD_RUNS\s*=\s*(\{[\s\S]*?\});/); // verbatim from wbapi-server.js
  if (sm) { try { serverRoads = expandRuns((new Function('return ' + sm[1]))()); } catch {} }
}
if (!clientRoads) fails.push('A3: could not read client ROAD_RUNS literal');
if (!serverRoads) {
  fails.push('A3: server ROAD_RUNS regex matched nothing — road set would be empty');
} else if (clientRoads) {
  if (clientRoads.size !== serverRoads.size)
    fails.push(`A3: ROAD_RUNS size differs — client ${clientRoads.size} vs server ${serverRoads.size}`);
  for (const k of clientRoads) if (!serverRoads.has(k)) { fails.push(`A3: server ROAD_CELLS missing ${k}`); break; }
}

// ── B. ALGORITHM parity — run BOTH real source functions over the band ────────
// _inferTerrain (HTML) closes over module-scope SEA_LANES / ROAD_CELLS / NODE_MAP / cellCode.
const SEA_LANES = clientLanes || new Set();
const ROAD_CELLS = clientRoads || new Set();
const clientInfer = eval('(' + extractFn(GAME, '_inferTerrain') + ')');
// terrainAt (server) closes over these IIFE-scope deps (getSeaLanes/getRoadCells/
// getLocaleGrid/WBAPI/MOVES4) via direct eval — same shapes the live server hands it.
const serverTerrainAt = (function () {
  const getSeaLanes = () => (serverLanes || SEA_LANES);
  const getRoadCells = () => (serverRoads || ROAD_CELLS);
  const getLocaleGrid = () => CELL_GRID;
  const WBAPI = { nodeMap: NODE_MAP };
  const MOVES4 = [[-1, 0], [1, 0], [0, 1], [0, -1]];
  return eval('(' + extractFn(SERVER, 'terrainAt') + ')');
})();

// Sweep the populated band (rows 0..89 × cols 140..255 — covers every named node,
// its inference neighbours, and all 59 sea-lane cells).
let checked = 0, agree = 0;
const diffs = [];
for (let r = 0; r <= 89; r++) {
  for (let c = 140; c <= 255; c++) {
    checked++;
    const a = clientInfer(r, c), b = serverTerrainAt(r, c);
    if (a === b) { agree++; continue; }
    diffs.push({ r, c, client: a, server: b });
  }
}
if (diffs.length) {
  fails.push(`B: ${diffs.length} cell(s) infer different terrain client vs server`);
  for (const d of diffs.slice(0, 15)) fails.push(`   (${d.r},${d.c}) client='${d.client}' server='${d.server}'`);
}

// ── report ─────────────────────────────────────────────────────────────────────
console.log('§WALK-5 server↔client terrain/encounter parity');
console.log(`  A   rate-table keys=${Object.keys(clientRates).length}  (client==server: ${!fails.some(f => f.startsWith('A:'))})`);
console.log(`  A2  SEA_LANES cells=${clientLanes ? clientLanes.size : '?'}  (client==server: ${!fails.some(f => f.startsWith('A2:'))})`);
console.log(`  A3  ROAD_CELLS cells=${clientRoads ? clientRoads.size : '?'}  (client==server: ${!fails.some(f => f.startsWith('A3:'))})`);
console.log(`  B   terrainAt agree=${agree}/${checked}  diffs=${diffs.length}`);

if (fails.length) {
  console.error('\n✗ TERRAIN PARITY VIOLATIONS:');
  for (const f of fails) console.error('   ✗ ' + f);
  process.exit(1);
}
console.log('\n✓ server getMoverWorld() terrain+encounter inputs match the client byte-for-behaviour');
process.exit(0);
