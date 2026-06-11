#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com
/**
 * parse-nodes.js — roll2hit.com NODE_MAP parser
 *
 * Reads roll2hit-v3.html, extracts NODE_MAP and NODE_COORDS,
 * and outputs structured records in multiple formats.
 *
 * Usage:
 *   node parse-nodes.js [options]
 *
 * Options:
 *   --format=table     Pretty ASCII table (default)
 *   --format=csv       CSV rows
 *   --format=json      JSON array
 *   --format=oracle    Oracle INSERT statements
 *   --format=sql       Generic SQL INSERT statements
 *   --filter=act:3     Filter by field value (act, type, code)
 *   --corridors        Show corridor connection report
 */

const fs   = require('fs');
const path = require('path');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const getArg  = (name, def) => { const a = args.find(a => a.startsWith(`--${name}=`)); return a ? a.split('=')[1] : def; };
const hasFlag = name => args.includes(`--${name}`);

const format       = getArg('format', 'table');
const filterRaw    = getArg('filter', null);
const showCorridors = hasFlag('corridors');

const HTML_FILE = path.join(__dirname, 'roll2hit-v3.html');

// ── Parse HTML source ─────────────────────────────────────────────────────────
const src = fs.readFileSync(HTML_FILE, 'utf8');

// Extract NODE_MAP block (from "const NODE_MAP = {" to matching closing "};")
function extractBlock(source, startPattern) {
  const startIdx = source.indexOf(startPattern);
  if (startIdx < 0) throw new Error(`Pattern not found: ${startPattern}`);
  let depth = 0, i = startIdx, start = -1;
  while (i < source.length) {
    if (source[i] === '{') { if (depth === 0) start = i; depth++; }
    else if (source[i] === '}') { depth--; if (depth === 0) return source.slice(start, i + 1); }
    i++;
  }
  throw new Error(`Block not closed for: ${startPattern}`);
}

function safeEval(code) {
  // Replace JS-only syntax so JSON.parse can handle it where possible.
  // We use the Function constructor trick to eval in a clean scope.
  try {
    // eslint-disable-next-line no-new-func
    return new Function(`return (${code})`)();
  } catch (e) {
    throw new Error(`Eval failed: ${e.message}\n${code.slice(0, 200)}`);
  }
}

// Pull NODE_MAP and NODE_COORDS
const nodeMapSrc   = extractBlock(src, 'const NODE_MAP = {');
const nodeCoordSrc = extractBlock(src, 'const NODE_COORDS = {');

const NODE_MAP    = safeEval(nodeMapSrc);
const NODE_COORDS = safeEval(nodeCoordSrc);

// ── Build record array ────────────────────────────────────────────────────────
const DIST_THRESHOLD = 3; // matches roll2hit-v3.html

function nodeType(node) {
  if (node.isEpicBattleground) return 'epic';
  if (node.junction)           return 'junction';
  if (node.isFishingLake)      return 'fishing';
  if (node.portal)             return 'portal';
  return 'story';
}

function gridDist(a, b) {
  const ca = NODE_COORDS[a], cb = NODE_COORDS[b];
  if (!ca || !cb) return null;
  return Math.abs(ca.r - cb.r) + Math.abs(ca.c - cb.c);
}

const records = Object.values(NODE_MAP).map(node => {
  const coords = NODE_COORDS[node.code] || {};
  const exits = ['N','S','E','W'].filter(d => node[d]).map(d => `${d}:${node[d]}`);
  const extra = ['SW','SE','NW','NE','spire'].filter(d => node[d]).map(d => `${d}:${node[d]}`);

  return {
    num:        node.num,
    code:       node.code,
    label:      node.label,
    act:        node.act,
    type:       nodeType(node),
    terrain:    node.name,
    r:          coords.r   ?? null,
    c:          coords.c   ?? null,
    n_exit:     node.N     ?? null,
    s_exit:     node.S     ?? null,
    e_exit:     node.E     ?? null,
    w_exit:     node.W     ?? null,
    extra_exits: extra.join(' ') || null,
    has_npc:    !!node.npc,
    has_battle: !!node.battle,
    has_loot:   !!node.loot,
    sleep:      !!node.sleep,
    sleep_cost: node.sleepCost ?? null,
    boss_key:   node.bossKey   ?? null,
    portal:     node.portal    ?? null,
    exits_count: exits.length + extra.length,
    exits_str:  [...exits, ...extra].join(',') || '(none)',
  };
});

// ── Apply filter ──────────────────────────────────────────────────────────────
let filtered = records;
if (filterRaw) {
  const [key, val] = filterRaw.split(':');
  filtered = records.filter(r => String(r[key]) === val);
}

// ── Corridor report ───────────────────────────────────────────────────────────
function corridorReport() {
  const rows = [];
  Object.values(NODE_MAP).forEach(node => {
    ['N','S','E','W','SW','SE','NW','NE','spire'].forEach(dir => {
      const dest = node[dir];
      if (!dest || !NODE_MAP[dest]) return;
      const dist = gridDist(node.code, dest);
      if (dist !== null && dist >= DIST_THRESHOLD) {
        rows.push({ from: node.code, dir, to: dest, dist, from_label: node.label.split(' — ')[0], to_label: NODE_MAP[dest].label.split(' — ')[0] });
      }
    });
  });
  rows.sort((a,b) => b.dist - a.dist);
  console.log(`CORRIDOR CONNECTIONS (grid dist >= ${DIST_THRESHOLD})\n`);
  console.log('FROM  DIR  TO    DIST  FROM_LABEL → TO_LABEL');
  console.log('----  ---  ----  ----  ----------------------------------------');
  rows.forEach(r => {
    console.log(`${r.from.padEnd(4)}  ${r.dir.padEnd(3)}  ${r.to.padEnd(4)}  ${String(r.dist).padStart(4)}  ${r.from_label} → ${r.to_label}`);
  });
  console.log(`\nTotal corridor edges: ${rows.length}`);
}

// ── Output formats ────────────────────────────────────────────────────────────
const COLS = ['num','code','label','act','type','terrain','r','c','n_exit','s_exit','e_exit','w_exit','extra_exits','exits_count','exits_str','has_npc','has_battle','has_loot','sleep','sleep_cost','boss_key','portal'];

function fmtTable(rows) {
  const SHORT_COLS = ['num','code','label','act','type','r','c','n_exit','s_exit','e_exit','w_exit','exits_count'];
  const widths = {};
  SHORT_COLS.forEach(c => widths[c] = c.length);
  rows.forEach(r => SHORT_COLS.forEach(c => { widths[c] = Math.max(widths[c], String(r[c] ?? '').length); }));
  const sep = SHORT_COLS.map(c => '-'.repeat(widths[c])).join('  ');
  const hdr = SHORT_COLS.map(c => c.toUpperCase().padEnd(widths[c])).join('  ');
  console.log(hdr);
  console.log(sep);
  rows.forEach(r => {
    console.log(SHORT_COLS.map(c => String(r[c] ?? '').padEnd(widths[c])).join('  '));
  });
  console.log(`\n${rows.length} node(s).`);
}

function fmtCsv(rows) {
  console.log(COLS.join(','));
  rows.forEach(r => {
    console.log(COLS.map(c => {
      const v = String(r[c] ?? '');
      return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g,'""')}"` : v;
    }).join(','));
  });
}

function fmtJson(rows) {
  console.log(JSON.stringify(rows, null, 2));
}

function fmtOracle(rows) {
  // Oracle-style INSERT for a hypothetical NODES table
  console.log('-- Oracle SQL: roll2hit NODES table');
  console.log('-- Generated: ' + new Date().toISOString());
  console.log('TRUNCATE TABLE roll2hit_nodes;');
  console.log();
  rows.forEach(r => {
    const vals = [
      r.num,
      `'${r.code}'`,
      `'${(r.label || '').replace(/'/g,"''")}'`,
      r.act,
      `'${r.type}'`,
      `'${r.terrain || ''}'`,
      r.r ?? 'NULL',
      r.c ?? 'NULL',
      r.n_exit ? `'${r.n_exit}'` : 'NULL',
      r.s_exit ? `'${r.s_exit}'` : 'NULL',
      r.e_exit ? `'${r.e_exit}'` : 'NULL',
      r.w_exit ? `'${r.w_exit}'` : 'NULL',
      r.extra_exits ? `'${r.extra_exits}'` : 'NULL',
      r.exits_count,
      r.has_npc ? 1 : 0,
      r.has_battle ? 1 : 0,
      r.has_loot ? 1 : 0,
      r.sleep ? 1 : 0,
      r.sleep_cost ?? 'NULL',
      r.boss_key ? `'${r.boss_key}'` : 'NULL',
      r.portal ? `'${r.portal}'` : 'NULL',
    ].join(', ');
    console.log(`INSERT INTO roll2hit_nodes (num, code, label, act, type, terrain, grid_r, grid_c, n_exit, s_exit, e_exit, w_exit, extra_exits, exits_count, has_npc, has_battle, has_loot, can_sleep, sleep_cost, boss_key, portal_dest) VALUES (${vals});`);
  });
  console.log('\nCOMMIT;');
}

function fmtSql(rows) {
  console.log('-- SQL INSERT: roll2hit NODES');
  console.log('-- Generated: ' + new Date().toISOString());
  rows.forEach(r => {
    const vals = [
      r.num,
      `'${r.code}'`,
      `'${(r.label || '').replace(/'/g,"''")}'`,
      r.act,
      `'${r.type}'`,
      `'${r.terrain || ''}'`,
      r.r ?? 'NULL', r.c ?? 'NULL',
      r.n_exit ? `'${r.n_exit}'` : 'NULL',
      r.s_exit ? `'${r.s_exit}'` : 'NULL',
      r.e_exit ? `'${r.e_exit}'` : 'NULL',
      r.w_exit ? `'${r.w_exit}'` : 'NULL',
      r.exits_count,
      r.has_npc ? 1 : 0, r.has_battle ? 1 : 0, r.has_loot ? 1 : 0,
      r.sleep ? 1 : 0,
    ].join(', ');
    console.log(`INSERT INTO nodes VALUES (${vals});`);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
if (showCorridors) {
  corridorReport();
} else {
  switch (format) {
    case 'csv':    fmtCsv(filtered);    break;
    case 'json':   fmtJson(filtered);   break;
    case 'oracle': fmtOracle(filtered); break;
    case 'sql':    fmtSql(filtered);    break;
    default:       fmtTable(filtered);  break;
  }
}
