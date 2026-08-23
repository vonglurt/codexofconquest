#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
//
// scripts/stats.js — live entity counts for index.html  (§DX-01g)
//
// The orientation docs (prompt.md §0, index.md's doc-health badge) cite the
// game's headline totals — nodes, monsters, quests, acts, line count, byte size.
// Hardcoded, those figures rot silently, and no reader can cheaply verify them:
// grepping `key:'` mixes items+nodes+monsters, `id:'…'` under-counts, and
// `schema:'UQF-1.0'` over-counts. This prints the REAL numbers straight from the
// canonical WBAPI parse — the same `wbapi-core` extractor the :1367 server and
// every `scripts/check-*.js` use — so a doc that preaches "confirm from the live
// file" can point HERE as the single source instead of hardcoding stale counts.
//
// Usage:  npm run stats            (or: node scripts/stats.js)
//         npm run stats -- --json  (machine-readable object)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const WBAPI = require(path.join(ROOT, 'js', 'wbapi-core.js'));

WBAPI.load(HTML);

const src = fs.readFileSync(HTML, 'utf8');
const bytes = fs.statSync(HTML).size;
const lines = (src.match(/\n/g) || []).length; // == `wc -l`

// Acts: there is no ACTS constant — "act" is a per-node field. The canonical
// act count is the highest act number any node carries (values run 0..N; the
// hub/prologue nodes sit at act 0, and some carry no act at all → skipped).
const acts = Object.values(WBAPI.nodeMap)
  .map(n => n && n.act)
  .filter(a => Number.isFinite(a));
const maxAct = acts.length ? Math.max(...acts) : 0;

const verMatch = src.match(/ENGINE_VER\s*=\s*'([^']*)'/);

const stats = {
  engineVer:    verMatch ? verMatch[1] : '(unknown)',
  nodes:        Object.keys(WBAPI.nodeMap).length,      // NODE_MAP
  monsters:     Object.keys(WBAPI.monsterPool).length,  // MONSTER_POOL
  terrains:     Object.keys(WBAPI.worldDb).length,      // WORLD_DB
  quests:       Object.keys(WBAPI.questDb).length,      // QUEST_DB (UQF-1.0)
  npcProfiles:  Object.keys(WBAPI.birkaNpcs).length,    // BIRKA_NPC_PROFILES
  npcDialogues: Object.keys(WBAPI.npcDialogues).length, // NPC_DIALOGUES
  acts:         maxAct,
  lines,
  bytes,
  megabytes:    +(bytes / 1e6).toFixed(2),
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(stats, null, 2));
  process.exit(0);
}

const row = (label, val) => console.log('  ' + String(label).padEnd(24) + val);
console.log(`\nindex.html — live entity counts  (${stats.engineVer})`);
console.log('  ' + '─'.repeat(46));
row('nodes (NODE_MAP)',        stats.nodes);
row('monsters (MONSTER_POOL)', stats.monsters);
row('terrains (WORLD_DB)',     stats.terrains);
row('quests (QUEST_DB)',       stats.quests.toLocaleString());
row('NPC profiles',            stats.npcProfiles);
row('NPC dialogues',           stats.npcDialogues);
row('acts (max node.act)',     stats.acts);
row('lines',                   stats.lines.toLocaleString());
row('size',                    `${stats.megabytes} MB  (${stats.bytes.toLocaleString()} bytes)`);
console.log('');
