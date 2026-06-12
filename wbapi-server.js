#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Paul Richeson <paul@roll2hit.com> — Roll2Hit.com
// ============================================================
// wbapi-server.js — Roll2Hit World Builder API Server
// MIT License — Copyright (c) 2026 paul@roll2hit.com
// SPDX-License-Identifier: MIT
// ============================================================
'use strict';
// Local REST API for roll2hit-v3.html — reads and writes the HTML file
// directly.  The game is fully self-contained in that one file.
// Toggle: ./wbapi-toggle.sh [start|stop|restart|status]
// curl:   curl http://localhost:1367/api/ping
//
// ── CLI DIRECTIVE ────────────────────────────────────────────
// Prefer api.sh over raw curl for all day-to-day operations.
// api.sh is the official CLI wrapper: it handles nonces, retry/
// backoff, queued requests, and pipe-safe JSON output.
//
//   ./api.sh ping                     health check
//   ./api.sh get quest <id>           fetch any entity
//   ./api.sh list npc --q egil        search by name
//   ./api.sh put quest <id> k=v       patch a field
//   ./api.sh post npc key=x name=y    create an entity
//   ./api.sh import file.json         bulk import (nodes+quests+npcs)
//   ./api.sh audit                    integrity scan
//   ./api.sh --help                   full command reference (always current)
//
// GET /api/help/cli  — runs ./api.sh --help and returns live output.
// ─────────────────────────────────────────────────────────────

const http      = require('http');
const fs        = require('fs');
const path      = require('path');
const crypto    = require('crypto');
const WBAPI     = require('./wbapi-core');
const Anthropic = require('@anthropic-ai/sdk');

// ── Nonce registry (one-time delete tokens, 5-min TTL) ───────────────────────
const NONCES   = new Map(); // token → { type, key, expires }
const NONCE_TTL = 5 * 60 * 1000;

function nonceIssue(type, key) {
  purgeNonces();
  const salt  = crypto.randomBytes(16).toString('hex');
  const token = crypto.createHash('sha512').update(`${type}:${key}:${salt}`).digest('hex').slice(0, 16);
  NONCES.set(token, { type, key, expires: Date.now() + NONCE_TTL });
  return token;
}
function nonceConsume(token, type, key) {
  purgeNonces();
  const rec = NONCES.get(token);
  if (!rec)                                    return { ok:false, error:'Nonce invalid or expired. Request a new one via POST /api/nonce.' };
  if (rec.type !== type || rec.key !== key)    return { ok:false, error:`Nonce was issued for ${rec.type}:${rec.key}, not ${type}:${key}.` };
  NONCES.delete(token);
  return { ok:true };
}
function purgeNonces() {
  const now = Date.now();
  for (const [t, r] of NONCES) if (r.expires < now) NONCES.delete(t);
}

// ── Config ──────────────────────────────────────────────────────────────────
const PORT      = parseInt(process.env.PORT || '1367');
const GAME_FILE = process.env.ROLL2HIT_FILE
  || process.argv.find((a, i) => process.argv[i-1] === '--file')
  || path.join(__dirname, 'roll2hit-v3.html');

// ── Runtime mode config ──────────────────────────────────────────────────────
// Modes: fast (quiet) | debug (verbose) | trace (verbose + full algorithm trace)
// Persisted in milepoints/wbapi-config.json; changed live via POST /api/mode.
// Env vars WBAPI_VERBOSE / WBAPI_TRACE override the config on startup only.
const CONFIG_FILE = path.join(__dirname, 'milepoints', 'wbapi-config.json');
const MODES = {
  fast:  { verbose: false, trace: false },
  debug: { verbose: true,  trace: false },
  trace: { verbose: true,  trace: true  },
};
let VERBOSE     = false;
let TRACE       = false;
let currentMode = 'trace';

function _applyMode(mode, save) {
  if (!MODES[mode]) return false;
  currentMode = mode;
  VERBOSE     = MODES[mode].verbose;
  TRACE       = MODES[mode].trace;
  if (save) {
    try {
      fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({ mode }, null, 2) + '\n');
    } catch (_) {}
  }
  return true;
}

(function _loadConfig() {
  let mode = 'trace'; // default: debug + trace on
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    if (cfg.mode && MODES[cfg.mode]) mode = cfg.mode;
  } catch (_) {}
  // env vars override config for one-off testing
  if      (process.env.WBAPI_TRACE   === '1') mode = 'trace';
  else if (process.env.WBAPI_VERBOSE === '1') mode = 'debug';
  _applyMode(mode, false);
}());

// ── Placeholder node codes that are never valid geographic locations ─────────
const PLACEHOLDER_NODES = new Set(['QUEST','TBD','TODO','UNKNOWN','NONE','XXX','PLACEHOLDER']);

// ── Logging ──────────────────────────────────────────────────────────────────
const LOG_FILE       = path.join(__dirname, 'milepoints', 'wbapi-server.log');
const ERROR_FILE     = path.join(__dirname, 'milepoints', 'wbapi-server.error');
const SPEAK_LOG_FILE = path.join(__dirname, 'milepoints', 'npc-speak.log');
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

function writeError(msg, detail) {
  const ts = new Date().toISOString();
  const body = `${ts}  ${msg}${detail ? '\n' + detail : ''}\n`;
  try { fs.writeFileSync(ERROR_FILE, body); } catch (_) {}
  console.error(`[wbapi-server] ERROR: ${msg}`);
  logStream.write(`${ts} [ERROR   ] ${msg}${detail ? '\n' + detail : ''}\n`);
}
function clearError() {
  try { if (fs.existsSync(ERROR_FILE)) fs.unlinkSync(ERROR_FILE); } catch (_) {}
}

const C = {
  reset:  '\x1b[0m',  bold:    '\x1b[1m',  dim:     '\x1b[2m',
  cyan:   '\x1b[36m', green:   '\x1b[32m', yellow:  '\x1b[33m',
  red:    '\x1b[31m', blue:    '\x1b[34m', magenta: '\x1b[35m',
  white:  '\x1b[37m', orange:  '\x1b[38;5;214m',
};

// Per-request timing
let _t0 = 0;

// Method colors for the header line
const METHOD_C = { GET:C.green, POST:C.blue, PUT:C.yellow, DELETE:C.red, OPTIONS:C.dim };

function _ts() { return new Date().toISOString().slice(0, 23).replace('T', ' '); }

// ── log() — for startup / load / error events (not per-request) ─────────────
function log(level, msg, data) {
  const ts = _ts();
  const levelColors = {
    INFO:  C.blue   + '[INFO]    ' + C.reset,
    ERROR: C.red    + '[ERROR]   ' + C.reset,
    LOAD:  C.magenta+ '[LOAD]    ' + C.reset,
  };
  // In debug/trace (VERBOSE=true): all levels go to console for log↔console parity.
  // In fast mode: LOGIC and REQUEST are file-only to reduce noise.
  const dataStr = data !== undefined ? ' ' + (typeof data === 'string' ? data : JSON.stringify(data)) : '';
  if (VERBOSE || (level !== 'LOGIC' && level !== 'REQUEST')) {
    const prefix = levelColors[level] || `${C.dim}[${level}]${C.reset}`;
    console.log(`${C.dim}${ts}${C.reset} ${prefix} ${msg}${dataStr}`);
  }
  logStream.write(`${ts} [${level.padEnd(8)}] ${msg}${dataStr}\n`);
}

// ── logReq() — prints the ┌─ request breadcrumb header ──────────────────────
function logReq(method, pathname, queryStr) {
  _t0 = Date.now();
  const ts   = _ts();
  const mc   = METHOD_C[method] || C.white;
  const qs   = queryStr ? `${C.dim}?${queryStr}${C.reset}` : '';
  const path = pathname.replace(/^\/api\//, '');
  console.log(`\n${C.dim}${ts}${C.reset}  ${C.bold}${mc}${method.padEnd(6)}${C.reset}  ${C.cyan}${path}${C.reset}${qs}`);
  logStream.write(`\n${ts}  ${method.padEnd(6)}  ${path}${queryStr ? '?'+queryStr : ''}\n`);
}

// ── logRow() — prints a ├─ detail line under the current request ─────────────
function logRow(label, value) {
  const lbl = value !== undefined ? `${C.dim}${label}:${C.reset} ` : '';
  const val = value !== undefined ? String(value) : String(label);
  console.log(`  ${C.dim}├─${C.reset}  ${lbl}${val}`);
  logStream.write(`  ├─  ${value !== undefined ? label + ': ' : ''}${val}\n`);
}

// ── logResponse() — the └─ closing line with elapsed time ───────────────────
function logResponse(_method, _url, status, summary) {
  const elapsed = Date.now() - _t0;
  const col = status < 300 ? C.green : status < 500 ? C.yellow : C.red;
  const timeStr = elapsed < 10 ? `${elapsed}ms` : elapsed < 100 ? `${C.yellow}${elapsed}ms${C.reset}` : `${C.red}${elapsed}ms${C.reset}`;
  console.log(`  ${C.dim}└─${C.reset}  ${col}${C.bold}${status}${C.reset}  ${summary}  ${C.dim}[${timeStr}${C.dim}]${C.reset}`);
  logStream.write(`  └─  ${status}  ${summary}  [${elapsed}ms]\n`);
}

// ── logTrace() — ultra-verbose algorithm decision trace ──────────────────────
// Shows input→decision→output for every significant processing step.
// Always written to log file; also to terminal when TRACE=true.
function logTrace(op, detail) {
  const line = `  ·· [TRACE] ${op}: ${detail}`;
  logStream.write(line + '\n');
  if (TRACE) console.log(`  ${C.dim}··${C.reset} ${C.dim}[TRACE]${C.reset} ${op}${detail ? ': ' + detail : ''}`);
}

// ── logBody() — pretty-print JSON body; always to file, console only in verbose
function logBody(direction, obj) {
  const label = direction === 'in' ? '→ body' : '← resp';
  const lines  = JSON.stringify(obj, null, 2).split('\n');
  const clipped = lines.length > 40;
  const fileLines = clipped ? [...lines.slice(0, 40), `  … ${lines.length - 40} more lines`] : lines;

  // Always write to log file (strip ANSI)
  logStream.write(`  │  ${label}\n`);
  for (const l of fileLines) logStream.write(`  │  ${l}\n`);

  // Console only in verbose mode
  if (!VERBOSE) return;
  const arrow = direction === 'in' ? `${C.blue}→ body${C.reset}` : `${C.green}← resp${C.reset}`;
  console.log(`  ${C.dim}│${C.reset}  ${arrow}`);
  for (const l of lines.slice(0, 40))
    console.log(`  ${C.dim}│${C.reset}  ${C.dim}${l}${C.reset}`);
  if (clipped)
    console.log(`  ${C.dim}│  … ${lines.length - 40} more lines${C.reset}`);
}

// ── sample() — first N items joined, with "+M more" suffix ──────────────────
function sample(arr, n = 4) {
  if (!arr || arr.length === 0) return '(none)';
  const shown = arr.slice(0, n).map(x => (typeof x === 'object' ? (x.id || x.key || x.code || x.name || JSON.stringify(x)) : String(x)));
  return arr.length > n ? shown.join(' · ') + `  ${C.dim}+${arr.length - n} more${C.reset}` : shown.join(' · ');
}

// ── Load ────────────────────────────────────────────────────────────────────
function reload() {
  if (!fs.existsSync(GAME_FILE))
    throw new Error(`Game file not found: ${GAME_FILE}`);
  WBAPI.load(GAME_FILE);
  const stats = {
    nodes:    Object.keys(WBAPI.nodeMap).length,
    quests:   Object.keys(WBAPI.questDb).length,
    monsters: Object.keys(WBAPI.monsterPool).length,
    npcs:     Object.keys(WBAPI.birkaNpcs).length,
    terrains: Object.keys(WBAPI.worldDb).length,
  };
  log('LOAD', `Loaded ${path.basename(GAME_FILE)}`, stats);
}
reload();

// ═══════════════════════════════════════════════════════════════════════════
// Connection enrichment — every GET returns entity + connections + _meta
// ═══════════════════════════════════════════════════════════════════════════
function nodeConnections(key) {
  const node = WBAPI.nodeMap[key]; if (!node) return null;
  const deps = WBAPI._deps.node(key);
  const quests = WBAPI.quests.byNode(key);
  const npcs   = WBAPI.npcs.byNode(key);
  return {
    entity: { ...node, id: key },
    connections: {
      terrain:     node.name || null,
      monsters:    node.name ? WBAPI.monsters.byTerrain(node.name).map(m => ({ key:m.key, name:m.name, tier:m.tier })) : [],
      quests:      quests.map(q => ({ id:q.id, title:q.title, type:q.type })),
      npcs:        npcs.map(n => ({ key:n.key, name:n.name })),
      linkedNodes: { N:node.N||null, S:node.S||null, E:node.E||null, W:node.W||null },
    },
    _meta: {
      canDelete:  deps.quests.length === 0 && deps.npcs.length === 0,
      blockedBy:  (deps.quests.length || deps.npcs.length) ? deps : null,
    },
  };
}

function questConnections(key) {
  const quest = WBAPI.questDb[key]; if (!quest) return null;
  const chain = WBAPI.quests.chain(key);
  const deps  = WBAPI._deps.quest(key);
  return {
    entity: { ...quest, id: key },
    connections: {
      activateNode: quest.activateNode ? { code:quest.activateNode, label:WBAPI.nodeMap[quest.activateNode]?.label } : null,
      waypointNode: quest.waypointNode ? { code:quest.waypointNode, label:WBAPI.nodeMap[quest.waypointNode]?.label } : null,
      npc:          quest.npc ? WBAPI.npcs.get(quest.npc) : null,
      arc:          key.replace(/_\d+$/, '').replace(/_[a-z]{2}$/, ''),
      upstream:     chain.upstream.map(id => ({ id, title:WBAPI.questDb[id]?.title })),
      downstream:   chain.downstream.map(id => ({ id, title:WBAPI.questDb[id]?.title })),
    },
    _meta: {
      canDelete:  deps.downstream.length === 0,
      blockedBy:  deps.downstream.length ? deps : null,
    },
  };
}

function monsterConnections(key) {
  const monster = WBAPI.monsterPool[key]; if (!monster) return null;
  const deps    = WBAPI._deps.monster(key);
  return {
    entity: { ...monster, key },
    connections: {
      terrains: (WBAPI._monsterToTerrains[key] || []).map(tk => ({
        key:   tk,
        label: WBAPI.worldDb[tk]?.label || tk,
        nodes: Object.entries(WBAPI.nodeMap)
          .filter(([,n]) => n.name === tk)
          .map(([code, n]) => ({ code, label:n.label })),
      })),
      drop: WBAPI.monsterDrops[key] || null,
    },
    _meta: {
      canDelete:  deps.terrains.length === 0,
      blockedBy:  deps.terrains.length ? deps : null,
    },
  };
}

function npcConnections(key) {
  const npc  = WBAPI.birkaNpcs[key]; if (!npc) return null;
  const deps = WBAPI._deps.npc(key);
  const nodeData = WBAPI.nodeMap[npc.node] || null;
  const questRefs = WBAPI.quests.all().filter(q => q.npc === key || q.npc === npc.name);
  return {
    entity: { ...npc, key },
    connections: {
      node:    nodeData ? { code:npc.node, label:nodeData.label, terrain:nodeData.name } : null,
      quests:  questRefs.map(q => ({ id:q.id, title:q.title, type:q.type,
        activateNode:q.activateNode, waypointNode:q.waypointNode })),
      nearbyNpcs: WBAPI.npcs.byNode(npc.node).filter(n => n.key !== key).map(n => ({ key:n.key, name:n.name })),
    },
    _meta: {
      canDelete:  deps.quests.length === 0,
      blockedBy:  deps.quests.length ? deps : null,
    },
  };
}

function locationConnections(key) {
  const k = WBAPI._findKey(WBAPI.nodeMap, key); if (!k) return null;
  return WBAPI.location.get(k);
}

// ── Connection dispatcher ────────────────────────────────────────────────────
const CONNECT = { node:nodeConnections, quest:questConnections, monster:monsterConnections, npc:npcConnections };

// ═══════════════════════════════════════════════════════════════════════════
// Schema — canonical field reference derived from roll2hit-v3.html
// ═══════════════════════════════════════════════════════════════════════════
const SCHEMAS = {
  _version: '1.0',
  _source: 'roll2hit-v3.html',
  _anchors: {
    MONSTER_POOL:  '// ◆◆◆ WORLDBUILDER:MONSTER_POOL:START ◆◆◆',
    MONSTER_DROPS: '// ◆◆◆ WORLDBUILDER:MONSTER_DROPS:START ◆◆◆',
    WORLD_DB:      '// ◆◆◆ WORLDBUILDER:WORLD_DB:START ◆◆◆',
    NODE_MAP:      '// ◆◆◆ WORLDBUILDER:NODE_MAP:START ◆◆◆',
    NODE_COORDS:   '// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆',
    QUEST_DB:      '// ◆◆◆ WORLDBUILDER:QUEST_DB:START ◆◆◆',
    BIRKA_NPC:     '// ◆◆◆ WORLDBUILDER:BIRKA_NPC:START ◆◆◆',
  },
  monster: {
    _section: 'MONSTER_POOL',
    _description: 'Combat opponents. Every entry in MONSTER_POOL is a potential encounter. Referenced by WORLD_DB terrain .monsters arrays.',
    fields: {
      key:       { type:'string',   required:true,  editable:false, note:'Internal key — matches the MONSTER_POOL property name. Never change this key directly; use fork+swap for terrain variants.' },
      name:      { type:'string',   required:true,  editable:true,  note:'Display name shown in combat and bestiary. Changing name is safe globally; key is unchanged.' },
      ac:        { type:'number',   required:true,  editable:true,  note:'Armor Class. Determines attack roll needed to hit. Typical range: 5–22.' },
      hp:        { type:'number',   required:true,  editable:true,  note:'Hit Points. Monster health pool. Typical ranges: trivial 4–10, easy 10–30, medium 20–80, hard 50–180, deadly 100–600.' },
      atk:       { type:'number',   required:true,  editable:true,  note:'Attack bonus. Added to d20 roll to hit player. Typical range: 0–17.' },
      dmgDie:    { type:'number',   required:true,  editable:true,  note:'Damage die size. Common values: 3, 4, 6, 8, 10, 12. Formula: dmgCount·d(dmgDie) + dmgFlat.' },
      dmgCount:  { type:'number',   required:true,  editable:true,  note:'Number of damage dice rolled per attack. Usually 1–4.' },
      dmgFlat:   { type:'number',   required:true,  editable:true,  note:'Flat damage bonus added after dice roll. Can be 0.' },
      tier:      { type:'string',   required:true,  editable:true,  values:['trivial','easy','medium','hard','deadly'],
                   note:'Difficulty tier. Controls encounter scaling, XP recommendations, and UI badge color.' },
    },
    related: {
      drop: { section:'MONSTER_DROPS', type:'object', note:'Trophy drop. {icon:string, name:string, sell:number(gp)}. Separate from MONSTER_POOL for cleaner editing.' },
    },
  },
  terrain: {
    _section: 'WORLD_DB',
    _description: 'Terrain types. Define which monsters appear where. Nodes point to terrain via node.name field.',
    fields: {
      label:            { type:'string',  required:true,  editable:true,  note:'Display name shown in game UI and worldbuilder sidebar.' },
      icon:             { type:'string',  required:true,  editable:true,  note:'Emoji icon used in UI. One character.' },
      monsters:         { type:'array',   required:true,  editable:false, note:'Array of P.monsterKey references. Populated via worlds.swapMonster() to avoid breaking P.proxy refs.' },
      isEpicBattleground:{ type:'boolean',required:false, editable:false, note:'If true, monster array is unused — boss loaded from EPIC_BOSS_POOL instead.' },
    },
  },
  node: {
    _section: 'NODE_MAP',
    _description: 'World map nodes. Each node is a location the player can visit. Connected by N/S/E/W cardinal links.',
    fields: {
      code:     { type:'string',  required:true,  editable:false, note:'Node code (CI, CY, etc.). Two-letter identifier. Use MOVE to rename.' },
      num:      { type:'number',  required:true,  editable:false, note:'Sequential number for map ordering. Assigned at creation.' },
      name:     { type:'string',  required:true,  editable:true,  note:'Terrain key. Must match a WORLD_DB key. This is what the game uses to look up which monsters appear here.' },
      label:    { type:'string',  required:true,  editable:true,  note:'Display name shown on the map and in game dialogue.' },
      act:      { type:'number',  required:true,  editable:true,  note:'Story act (1–7). Controls which nodes are visible as the player progresses.' },
      text:     { type:'string',  required:false, editable:true,  note:'Location description text shown when arriving. Flavour prose.' },
      npc:      { type:'string',  required:false, editable:true,  note:'Inline NPC display name at this node. For full NPC profiles, see BIRKA_NPC.' },
      battle:   { type:'object',  required:false, editable:false, note:'Fixed encounter. {label:string, key:monsterKey, count:number}. null = random encounter pool instead.' },
      loot:     { type:'string',  required:false, editable:true,  note:'Loot text shown on encounter completion.' },
      sleep:    { type:'boolean', required:false, editable:true,  note:'If true, player can rest here to restore HP.' },
      sleepCost:{ type:'number',  required:false, editable:true,  note:'Gold cost to sleep. Only present when sleep:true.' },
      N:        { type:'string',  required:false, editable:true,  note:'Adjacent node code to the North. null if no connection.' },
      S:        { type:'string',  required:false, editable:true,  note:'Adjacent node code to the South.' },
      E:        { type:'string',  required:false, editable:true,  note:'Adjacent node code to the East.' },
      W:        { type:'string',  required:false, editable:true,  note:'Adjacent node code to the West.' },
    },
    coordinates: { section:'NODE_COORDS', note:'Canvas x/y stored separately in NODE_COORDS. Updated by the map canvas UI.' },
  },
  quest: {
    _section: 'QUEST_DB',
    _description: 'Quest database. Contains all 210 quests. Function bodies (activateCond, completeFn) are preserved as raw JS — not editable via API. Text fields are fully editable.',
    fields: {
      title:       { type:'string',  required:true,  editable:true,  note:'Display title shown in quest log.' },
      type:        { type:'string',  required:true,  editable:true,
                     values:['side','main','skill_check','hunt','epic','combat','escort','dialogue','hybrid','mission_bit'],
                     note:'Quest type. main: gated by story flags. skill_check: DC roll. hunt: targets specific monsters. epic: dungeon boss chain. combat: direct battle. escort: move NPC. dialogue: NPC conversation. hybrid: mixed mechanic. mission_bit: token-gated.' },
      hook:        { type:'string',  required:false, editable:true,  note:'Alternative name for hint. Intro text.' },
      hint:        { type:'string',  required:false, editable:true,  note:'Intro/hook text shown when quest becomes available.' },
      passText:    { type:'string',  required:false, editable:true,  note:'Success outcome text shown on quest completion.' },
      failText:    { type:'string',  required:false, editable:true,  note:'Failure outcome text.' },
      rewardText:  { type:'string',  required:false, editable:true,  note:'Reward flavour text.' },
      disposition: { type:'string',  required:false, editable:true,  note:'Contextual quote, often from an NPC.' },
      npc:         { type:'string',  required:false, editable:true,  note:'NPC key who gives or is involved in this quest.' },
      activateNode:{ type:'string',  required:false, editable:true,  note:'Node code where quest first becomes available.' },
      waypointNode:{ type:'string',  required:false, editable:true,  note:'Node code where quest objective is located.' },
      xpAward:     { type:'number',  required:false, editable:true,  note:'XP granted on completion.' },
      reward:      { type:'number',  required:false, editable:true,  note:'Gold reward on completion.' },
      checkDC:     { type:'number',  required:false, editable:true,  note:'Difficulty Class for skill_check quests. Player rolls d20+mod vs DC.' },
      checkStat:   { type:'string',  required:false, editable:true,  values:['WIS','INT','CHA','STR','DEX','CON'],
                     note:'Ability score used for the skill check.' },
      checkSkill:  { type:'string',  required:false, editable:true,  note:'Specific skill name for the check (optional).' },
      checkPassFlag:{ type:'string', required:false, editable:true,  note:'Flag name set true on pass. Also triggers _grantMissionBit — creates a mission_bit token in player inventory.' },
      checkFailFlag:{ type:'string', required:false, editable:true,  note:'Flag name set true on fail (for non-retryable quests). Also triggers _grantMissionBit.' },
      bitLabel:    { type:'string',  required:false, editable:true,  note:'Human-readable label for the mission bit token. Defaults to camelCase expansion of checkPassFlag. Token name = bitLabel + " Token".' },
      activateCond:{ type:'function',required:false, editable:false, note:'JS arrow function (S) => bool. Evaluated at runtime to decide if quest is visible. Not editable via API — edit in source.' },
      completeFn:  { type:'function',required:false, editable:false, note:'JS arrow function (S) => {...}. Runs on quest completion to set story flags, grant items, etc. Not editable via API.' },
      onPass:      { type:'function',required:false, editable:false, note:'Alternative to completeFn. Runs on successful skill_check.' },
      onFail:      { type:'function',required:false, editable:false, note:'Runs on failed skill_check.' },
    },
  },
  fish: {
    _section: 'FISH_DB',
    _description: 'Yugurt Lake fish pool — FISH_POOL (ranks 1–20, day) and NIGHT_FISH_POOL (ranks 6–14, nocturnal). Each entry is a combatable creature that drops a MONSTER_DROPS entry matching its key.',
    fields: {
      key:    { type:'string', required:true,  editable:false, note:'Fish key. Matches MONSTER_POOL and MONSTER_DROPS key. Format: fish_01–fish_20 (day) or night_01–night_05 (night).' },
      rank:   { type:'number', required:true,  editable:true,  note:'Rank 1–20. Controls which size tier can catch this fish. Higher rank = harder fight + more valuable drop.' },
      name:   { type:'string', required:true,  editable:true,  note:'Display name shown during fishing reveal.' },
      desc:   { type:'string', required:false, editable:true,  note:'Flavor text shown in the fishing reveal card.' },
      isNight:{ type:'boolean',required:false, editable:false, note:'True for NIGHT_FISH_POOL entries. Not stored on item — derived from which array the fish lives in.' },
    },
    related: {
      drop:    { section:'MONSTER_DROPS', note:'Trophy item dropped on defeat. Must share key with MONSTER_DROPS.' },
      monster: { section:'MONSTER_POOL',  note:'Combat stats. Must share key with MONSTER_POOL.' },
    },
  },
  lake_magic: {
    _section: 'LAKE_MAGIC',
    _description: 'Magic items found via high-rank fishing at Yugurt Lake. Stat bonuses scale with player level and luck modifier using the formula: bonus = base + floor(level × levelScale) + floor(luckMod × luckScale).',
    fields: {
      key:        { type:'string', required:true,  editable:false, note:'Internal key. lake_mag_01 … lake_mag_N.' },
      name:       { type:'string', required:true,  editable:true,  note:'Display name in inventory.' },
      icon:       { type:'string', required:true,  editable:true,  note:'Emoji icon. One character.' },
      desc:       { type:'string', required:false, editable:true,  note:'Flavor/lore text shown in inventory tooltip.' },
      type:       { type:'string', required:true,  editable:false, note:'Always "lake_magic".' },
      sell:       { type:'number', required:true,  editable:true,  note:'Gold value if sold. Usually 0 (not sellable).' },
      effect:     { type:'string', required:true,  editable:true,  values:['ac_bonus','atk_bonus','fishing_dc','first_strike','night_type','all_ability'],
                    note:'What stat this item affects. Determines which game formula reads base+levelScale+luckScale.' },
      base:       { type:'number', required:true,  editable:true,  note:'Flat base bonus before any scaling.' },
      levelScale: { type:'number', required:true,  editable:true,  note:'Bonus per player level. floor(level × levelScale) added to base.' },
      luckScale:  { type:'number', required:true,  editable:true,  note:'Multiplier on luckMod. floor(luckMod × luckScale) added to base.' },
      minRank:    { type:'number', required:true,  editable:true,  note:'Minimum fish rank required to have a chance of finding this item.' },
      minLevel:   { type:'number', required:true,  editable:true,  note:'Minimum player level required to receive this item.' },
    },
  },
  npc: {
    _section: 'BIRKA_NPC',
    _description: 'Named NPC profiles (the Birka Six). Full dialogue trees with favorability levels. Inline NPCs (node.npc strings) are simpler and edited via node.put().',
    fields: {
      key:        { type:'string', required:true,  editable:false, note:'Internal key. Matches the BIRKA_NPC_PROFILES property name.' },
      name:       { type:'string', required:true,  editable:true,  note:'Full display name.' },
      occupation: { type:'string', required:true,  editable:true,  note:'Role shown in NPC list.' },
      node:       { type:'string', required:true,  editable:true,  note:'Node code where NPC is found.' },
      neutral:    { type:'object', required:true,  editable:true,  note:'Dialogue at neutral favorability. {greeting:string, dialogue:string}.' },
      friendly:   { type:'object', required:false, editable:true,  note:'Dialogue at friendly level. {greeting, dialogue, special?}.' },
      dearFriend: { type:'object', required:false, editable:true,  note:'Dialogue at highest favorability. {greeting, dialogue}.' },
    },
  },
};

function resolveId(type, raw) {
  const col = { node:WBAPI.nodeMap, quest:WBAPI.questDb, monster:WBAPI.monsterPool, npc:WBAPI.birkaNpcs }[type];
  if (!col) return raw;
  const resolved = WBAPI._findKey(col, raw) || raw;
  if (resolved !== raw) log('LOGIC', `Key resolved: "${raw}" → "${resolved}" (type=${type})`);
  return resolved;
}

// ═══════════════════════════════════════════════════════════════════════════
// HTTP helpers
// ═══════════════════════════════════════════════════════════════════════════
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Nonce');
}

function json(res, status, body) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  logBody('out', body);
  res.end(JSON.stringify(body, null, 2));
}

// After every successful write: save to disk, hot-reload in memory, respond — no process restart.
function saveAndRestart(res, status, payload) {
  const r = WBAPI.save();
  if (!r.ok) {
    logRow('autoSave', `${C.red}ERROR: ${r.error}${C.reset}`);
    return json(res, 500, { ok:false, error:`save failed: ${r.error}` });
  }
  try {
    fs.copyFileSync(r.path, GAME_FILE);
    logRow('autoSave', r.path);
  } catch(e) {
    return json(res, 500, { ok:false, error:`overwrite failed: ${e.message}`, savePath: r.path });
  }
  try {
    WBAPI.load(GAME_FILE);
    logRow('reload', 'memory refreshed from disk');
  } catch(e) {
    return json(res, 500, { ok:false, error:`reload failed after save: ${e.message}`, savePath: r.path });
  }
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  const out = { ...payload, autoSaved: true, savePath: r.path };
  logBody('out', out);
  res.end(JSON.stringify(out, null, 2));
}

// Save to disk, soft-reload in memory, verify the written entity — no process restart.
// Returns the full HTTP response on the same connection.
// expectedFields: { fieldName: expectedStringValue } — verified against reloaded data.
// connectType/connectKey: optional, recomputed after reload for fresh connection metadata.
function saveAndVerify(res, status, payload, expectedFields, connectType, connectKey) {
  // 1. Save to disk
  const r = WBAPI.save();
  if (!r.ok) {
    logRow('autoSave', `${C.red}ERROR: ${r.error}${C.reset}`);
    return json(res, 500, { ok:false, error:`save failed: ${r.error}` });
  }
  try {
    fs.copyFileSync(r.path, GAME_FILE);
    logRow('autoSave', r.path);
  } catch(e) {
    return json(res, 500, { ok:false, error:`overwrite failed: ${e.message}`, savePath: r.path });
  }

  // 2. Soft reload — re-parse all collections from the saved file (keeps process alive)
  try {
    WBAPI.load(GAME_FILE);
    logRow('reload', 'memory refreshed from disk');
  } catch(e) {
    return json(res, 500, { ok:false, error:`reload failed after save: ${e.message}`, savePath: r.path });
  }

  // 3. Verify written fields by reading them back from the freshly loaded data
  const COL_MAP = { node:WBAPI.nodeMap, quest:WBAPI.questDb, monster:WBAPI.monsterPool, npc:WBAPI.birkaNpcs };
  const col = connectType ? COL_MAP[connectType] : null;
  const entity = col && connectKey ? col[connectKey] : null;

  const verified = [];
  const mismatches = [];
  if (entity && expectedFields) {
    for (const [field, expected] of Object.entries(expectedFields)) {
      const actual = entity[field];
      const ok = actual === expected;
      verified.push({ field, ok, ...(ok ? {} : { expected, actual }) });
      if (!ok) mismatches.push(field);
    }
  }

  const verifyOk = mismatches.length === 0;
  if (verified.length > 0) {
    logRow('verify', verifyOk
      ? `${C.green}✓ ${verified.length} field(s) confirmed on disk${C.reset}`
      : `${C.red}✗ mismatch after reload: ${mismatches.join(', ')}${C.reset}`);
  }

  // 4. Recompute connection metadata from freshly loaded data
  const connections = (connectType && connectKey && CONNECT[connectType])
    ? CONNECT[connectType](connectKey)
    : {};

  cors(res);
  const httpStatus = verifyOk ? status : 422;
  res.writeHead(httpStatus, { 'Content-Type': 'application/json' });
  const out = {
    ...payload,
    ...connections,
    autoSaved: true,
    savePath: r.path,
    ...(verified.length > 0 ? { verified } : {}),
    ...(verifyOk ? {} : { ok:false, error:`field mismatch after reload: ${mismatches.join(', ')}` }),
  };
  logBody('out', out);
  res.end(JSON.stringify(out, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', c => { buf += c; if (buf.length > 1e6) reject(new Error('Body too large')); });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(buf || '{}');
        logBody('in', parsed);
        resolve(parsed);
      } catch(e) { reject(e); }
    });
    req.on('error', reject);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Source mutation helpers  (used by create routes + flag insertion)
// ═══════════════════════════════════════════════════════════════════════════

function insertBeforeSectionClose(section, entry) {
  const endAnchor = `// ◆◆◆ WORLDBUILDER:${section}:END ◆◆◆`;
  const anchorIdx = WBAPI._rawSrc.indexOf(endAnchor);
  if (anchorIdx === -1) return { ok:false, error:`${section} END anchor not found` };
  const closingIdx = WBAPI._rawSrc.lastIndexOf('\n};', anchorIdx);
  if (closingIdx === -1) return { ok:false, error:`${section} closing }; not found` };
  WBAPI._rawSrc = WBAPI._rawSrc.slice(0, closingIdx + 1) + entry + WBAPI._rawSrc.slice(closingIdx + 1);
  return { ok:true };
}

// insertAfterLastParsedNode: inserts a new NODE_MAP entry immediately after the node
// with the highest `num` in the currently-parsed WBAPI.nodeMap.  This keeps new nodes
// inside the portion of the section that parseSimple can evaluate, avoiding the
// "new node invisible after restart" problem caused by malformed multi-line junction
// entries that appear later in the section and break JS evaluation.
// Falls back to insertBeforeSectionClose if no anchor is found.
function insertAfterLastParsedNode(entry) {
  // Find the last node by num in the current in-memory map.
  let lastKey = null, lastNum = -1;
  for (const [k, n] of Object.entries(WBAPI.nodeMap)) {
    const num = n.num || 0;
    if (num > lastNum) { lastNum = num; lastKey = k; }
  }
  if (!lastKey) return insertBeforeSectionClose('NODE_MAP', entry);

  const S = '// ◆◆◆ WORLDBUILDER:NODE_MAP:START ◆◆◆';
  const E = '// ◆◆◆ WORLDBUILDER:NODE_MAP:END ◆◆◆';
  const sStart = WBAPI._rawSrc.indexOf(S) + S.length;
  const eIdx   = WBAPI._rawSrc.indexOf(E);
  if (sStart < S.length || eIdx < 0) return insertBeforeSectionClose('NODE_MAP', entry);
  const sectionSrc = WBAPI._rawSrc.slice(sStart, eIdx);

  // Locate the entry for lastKey using brace-depth tracking.
  const keyRe = new RegExp(`^([ \\t]*)${lastKey}\\s*:\\s*\\{`, 'gm');
  const km = keyRe.exec(sectionSrc);
  if (!km) return insertBeforeSectionClose('NODE_MAP', entry);

  const openEnd = km.index + km[0].length;
  let depth = 1, i = openEnd, inStr = null;
  while (i < sectionSrc.length) {
    const c = sectionSrc[i];
    if (inStr) {
      if (c === '\\' && inStr !== '`') { i += 2; continue; }
      if (c === inStr) inStr = null;
    } else if (c === '/' && sectionSrc[i + 1] === '/') {
      while (i < sectionSrc.length && sectionSrc[i] !== '\n') i++;
      continue;
    } else {
      if (c === '"' || c === "'" || c === '`') inStr = c;
      else if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) break; }
    }
    i++;
  }
  if (depth !== 0) return insertBeforeSectionClose('NODE_MAP', entry);

  // i is at the closing } of the last node entry.  Skip past },\n in the raw source.
  let insertAt = sStart + i + 1; // one past the }
  while (insertAt < WBAPI._rawSrc.length && WBAPI._rawSrc[insertAt] !== '\n') insertAt++;
  if (insertAt < WBAPI._rawSrc.length) insertAt++; // include the \n

  WBAPI._rawSrc = WBAPI._rawSrc.slice(0, insertAt) + entry + WBAPI._rawSrc.slice(insertAt);
  return { ok:true };
}

function serializeQuestLiteral(id, body) {
  const STR  = ['type','title','desc','hint','hook','passText','failText','rewardText',
    'disposition','npc','activateNode','waypointNode','checkAbility','checkLabel',
    'checkStat','checkPassFlag','vignetteText'];
  const NUM  = ['xpAward','reward','checkDC','retryGateDays'];
  const BOOL = ['retryable'];
  const FN   = ['activateCond','completeFn','onPass','onFail'];
  const parts = [`  ${id}: { id:${JSON.stringify(id)}`];
  for (const f of STR)  if (body[f] !== undefined) parts.push(`${f}:${JSON.stringify(body[f])}`);
  for (const f of NUM)  if (body[f] !== undefined) parts.push(`${f}:${Number(body[f])}`);
  for (const f of BOOL) if (body[f] !== undefined) parts.push(`${f}:${!!body[f]}`);
  for (const f of FN) {
    if (typeof body[f] !== 'string') continue;
    const v = body[f].trimStart();
    // Plain flag name (no JS syntax) → wrap as S_story check; already-valid JS passes through
    const isBareIdent = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(v);
    parts.push(`${f}:${isBareIdent ? `() => !!S_story.${v}` : v}`);
  }
  return parts.join(', ') + ' },\n';
}

function serializeNodeLiteral(code, body) {
  const maxNum = Object.values(WBAPI.nodeMap).reduce((m, n) => Math.max(m, n.num || 0), 0);
  const num = body.num !== undefined ? Number(body.num) : maxNum + 1;
  const STR  = ['name','label','text','npc','loot','N','S','E','W'];
  const NUM  = ['act','sleepCost'];
  const BOOL = ['sleep', 'junction'];
  const parts = [`  ${code}: { num:${num}`];
  for (const f of STR)  if (body[f] !== undefined) parts.push(`${f}:${JSON.stringify(body[f])}`);
  for (const f of NUM)  if (body[f] !== undefined) parts.push(`${f}:${Number(body[f])}`);
  for (const f of BOOL) if (body[f] !== undefined) parts.push(`${f}:${!!body[f]}`);
  if (body.battle) parts.push(`battle:${JSON.stringify(body.battle)}`);
  return parts.join(', ') + ' },\n';
}

function serializeTerrainLiteral(key, body) {
  const monsterKeys = Array.isArray(body.monsters) ? body.monsters : [];
  const mStr = monsterKeys.map(mk => `P.${mk}`).join(', ');
  const icon  = body.icon  ? `, icon:${JSON.stringify(body.icon)}`  : '';
  const label = body.label ? `, label:${JSON.stringify(body.label)}` : '';
  return `  ${key}: { monsters:[${mStr}]${label}${icon} },\n`;
}

function serializeMonsterLiteral(key, body) {
  const NUM  = ['ac','hp','atk','dmg','xp','tier'];
  const STR  = ['name','size','type','align','speed','cr','desc'];
  const parts = [`  ${key}: { name:${JSON.stringify(body.name||key)}`];
  for (const f of STR) if (body[f] !== undefined && f !== 'name') parts.push(`${f}:${JSON.stringify(body[f])}`);
  for (const f of NUM) if (body[f] !== undefined) parts.push(`${f}:${Number(body[f])}`);
  if (body.atk_bonus !== undefined) parts.push(`atk_bonus:${Number(body.atk_bonus)}`);
  if (body.dmg_type)  parts.push(`dmg_type:${JSON.stringify(body.dmg_type)}`);
  if (body.drops)     parts.push(`drops:${JSON.stringify(body.drops)}`);
  return parts.join(', ') + ' },\n';
}

function serializeDropLiteral(key, body) {
  return `  ${key}: { icon:${JSON.stringify(body.icon||'📦')}, name:${JSON.stringify(body.name)}, sell:${Number(body.sell||0)} },\n`;
}

function serializeNpcDialogueLiteral(key, body) {
  const parts = [];
  const m = body.meta || {};
  const metaEntries = Object.entries(m).filter(([,v]) => v !== undefined && v !== null && v !== '');
  if (metaEntries.length) {
    const mp = metaEntries.map(([k, v]) => `${k}:${JSON.stringify(v)}`);
    parts.push(`meta: { ${mp.join(', ')} }`);
  }
  for (const arr of ['impartial','questActive','friendly','dearFriend'])
    if (Array.isArray(body[arr]) && body[arr].length) parts.push(`${arr}: ${JSON.stringify(body[arr])}`);
  parts.push(`quote: ${JSON.stringify(body.quote||'')}`);
  return `  ${key}: { ${parts.join(', ')} },\n`;
}

function serializeNpcDialoguesSection() {
  const entries = Object.entries(WBAPI.npcDialogues)
    .map(([k, v]) => serializeNpcDialogueLiteral(k, v))
    .join('');
  return `\nconst NPC_DIALOGUES = { // → doc: story-arc-npc-dialogues.md\n${entries}};\n`;
}

function serializeNpcLiteral(key, body) {
  const tier = (obj, indent) => {
    if (!obj || typeof obj !== 'object') return null;
    const parts = [];
    if (obj.greeting) parts.push(`greeting:${JSON.stringify(obj.greeting)}`);
    if (obj.dialogue) parts.push(`dialogue:${JSON.stringify(obj.dialogue)}`);
    if (obj.special)  parts.push(`special:${JSON.stringify(obj.special)}`);
    return parts.length ? `{ ${parts.join(', ')} }` : null;
  };
  const parts = [`  ${key}: { key:${JSON.stringify(key)}, name:${JSON.stringify(body.name)}`];
  if (body.occupation) parts.push(`occupation:${JSON.stringify(body.occupation)}`);
  if (body.node)       parts.push(`node:${JSON.stringify(body.node)}`);
  const neutral    = tier(body.neutral);
  const friendly   = tier(body.friendly);
  const dearFriend = tier(body.dearFriend);
  if (neutral)    parts.push(`neutral:${neutral}`);
  if (friendly)   parts.push(`friendly:${friendly}`);
  if (dearFriend) parts.push(`dearFriend:${dearFriend}`);
  return parts.join(', ') + ' },\n';
}

function serializeItemLiteral(key, body) {
  const STR  = ['name','icon','type','desc','readText','effect'];
  const NUM  = ['sell','atkBonus','dmgDie','dmgCount','dmgFlat','minLevel','uses','base','levelScale','luckScale','minRank'];
  const BOOL = ['passive'];
  const parts = [`  ${key}: { key:${JSON.stringify(key)}`];
  for (const f of STR)  if (body[f] !== undefined) parts.push(`${f}:${JSON.stringify(body[f])}`);
  for (const f of NUM)  if (body[f] !== undefined) parts.push(`${f}:${Number(body[f])}`);
  for (const f of BOOL) if (body[f] !== undefined) parts.push(`${f}:${!!body[f]}`);
  return parts.join(', ') + ' },\n';
}

function insertBeforeArrayClose(section, entry) {
  const endAnchor = `// ◆◆◆ WORLDBUILDER:${section}:END ◆◆◆`;
  const anchorIdx = WBAPI._rawSrc.indexOf(endAnchor);
  if (anchorIdx === -1) return { ok:false, error:`${section} END anchor not found` };
  const closingIdx = WBAPI._rawSrc.lastIndexOf('\n];', anchorIdx);
  if (closingIdx === -1) return { ok:false, error:`${section} closing ]; not found` };
  WBAPI._rawSrc = WBAPI._rawSrc.slice(0, closingIdx + 1) + entry + WBAPI._rawSrc.slice(closingIdx + 1);
  return { ok:true };
}

function serializeFishEntry(body) {
  const STR  = ['key','name','desc'];
  const NUM  = ['rank'];
  const parts = [];
  for (const f of ['rank','key','name','desc'])
    if (body[f] !== undefined)
      parts.push(`${f}:${typeof body[f]==='number' ? body[f] : JSON.stringify(body[f])}`);
  const pad = body.rank < 10 ? ' ' : '';
  return `  { ${parts.join(', ')} },\n`;
}

function serializeLakeMagicEntry(key, body) {
  const STR  = ['key','name','icon','desc','type','effect'];
  const NUM  = ['sell','base','levelScale','luckScale','minRank','minLevel'];
  const parts = [`  ${key}: { key:${JSON.stringify(key)}`];
  for (const f of STR) if (body[f] !== undefined && f !== 'key') parts.push(`${f}:${JSON.stringify(body[f])}`);
  for (const f of NUM) if (body[f] !== undefined) parts.push(`${f}:${Number(body[f])}`);
  return parts.join(', ') + ' },\n';
}

function replaceSection(section, newContent) {
  const startAnchor = `// ◆◆◆ WORLDBUILDER:${section}:START ◆◆◆`;
  const endAnchor   = `// ◆◆◆ WORLDBUILDER:${section}:END ◆◆◆`;
  const startIdx = WBAPI._rawSrc.indexOf(startAnchor);
  if (startIdx === -1) return { ok:false, error:`${section} START anchor not found` };
  const endIdx = WBAPI._rawSrc.indexOf(endAnchor, startIdx);
  if (endIdx === -1) return { ok:false, error:`${section} END anchor not found` };
  WBAPI._rawSrc = WBAPI._rawSrc.slice(0, startIdx + startAnchor.length) + newContent + WBAPI._rawSrc.slice(endIdx);
  return { ok:true };
}

function serializeD100Table(entries) {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  const rows = entries.map(e => {
    const magic = e._magic !== undefined ? `, _magic:${e._magic}` : '';
    return `  { weight:${e.weight}, _type:${JSON.stringify(e._type)}${magic} },`;
  }).join('\n');
  return `\n// Unified d100 drop table — each entry: { weight, _type, _magic? }\n// _type: 'potion_minor'|'potion'|'potion_greater'|'potion_superior'|'scroll'|'flashbang'|'dagger'|'mainweapon'|'gold'\nconst _D100_TABLE = [ // → doc: mechanics-combat.md §Loot Table\n${rows}\n]; // total weight = ${total}\n`;
}

function lootAnnotate(entries) {
  let cursor = 0;
  return entries.map((e, i) => {
    const from = cursor + 1;
    cursor += e.weight;
    return { index:i, weight:e.weight, _type:e._type, ...(e._magic !== undefined ? { _magic:e._magic } : {}), rollRange:`${from}–${cursor}` };
  });
}

function lootSuggestions(gap) {
  if (gap <= 0) return [];
  const out = [];
  if (gap >= 10) {
    out.push({ weight:gap, _type:'potion_minor', reason:`fills gap to 100 — safe common filler` });
    out.push({ weight:gap, _type:'gold',         reason:`fills gap to 100 — neutral reward` });
    if (gap >= 20) out.push({ weight:Math.floor(gap/2), _type:'potion_minor', reason:`split: +${Math.floor(gap/2)} potions, leave ${gap-Math.floor(gap/2)} for a second entry` });
  } else {
    out.push({ weight:gap, _type:'potion_minor', reason:`fill remaining ${gap} — small gap, potions recommended` });
  }
  return out;
}

function parseSDefaultsBody() {
  // Handles both `function _S_DEFAULTS() { return {...}; }` and `const _S_DEFAULTS = () => ({...})`
  const declIdx = WBAPI._rawSrc.indexOf('_S_DEFAULTS');
  if (declIdx === -1) return { ok:false, error:'_S_DEFAULTS not found in source' };
  // Find the opening { of the returned object (could be `return {` or `=> ({`)
  const openBrace = WBAPI._rawSrc.indexOf('{', declIdx);
  if (openBrace === -1) return { ok:false, error:'Opening brace not found after _S_DEFAULTS' };
  let depth = 1, closeIdx = -1;
  for (let i = openBrace + 1; i < WBAPI._rawSrc.length; i++) {
    const ch = WBAPI._rawSrc[i];
    if (ch === '{') depth++;
    else if (ch === '}') { if (--depth === 0) { closeIdx = i; break; } }
  }
  if (closeIdx === -1) return { ok:false, error:'Could not locate closing brace of _S_DEFAULTS return object' };
  return { ok:true, openBrace, closeIdx, body: WBAPI._rawSrc.slice(openBrace + 1, closeIdx) };
}

// ═══════════════════════════════════════════════════════════════════════════
// Router
// ═══════════════════════════════════════════════════════════════════════════
async function route(req, res) {
  const url    = new URL(req.url, `http://localhost:${PORT}`);
  const parts  = url.pathname.replace(/^\/api\//, '').split('/');
  const method = req.method.toUpperCase();

  // ── OPTIONS preflight ──
  if (method === 'OPTIONS') {
    cors(res); res.writeHead(204); res.end();
    log('LOGIC', 'CORS preflight — 204');
    return;
  }

  const qs = url.search ? url.search.slice(1) : '';
  logReq(method, url.pathname, qs);

  // ── Help ──
  if (parts[0] === 'help' && method === 'GET') {
    const topic = (parts[1] || 'index').toLowerCase().replace(/-/g,'_');
    logRow('topic', topic);
    const b = `http://localhost:${PORT}`;
    const HELP = {
      index: {
        title: 'WBAPI Help Index',
        body: [
          'Roll2Hit World Builder API — man-page style reference.',
          '',
          'TOPICS',
          '  GET /api/help/overview        — what this API is and how it works',
          '  GET /api/help/modes           — read-only vs. guided-write mode',
          '  GET /api/help/nonce           — how write-protection and nonces work',
          '  GET /api/help/read            — all safe read-only endpoints',
          '  GET /api/help/write           — all write endpoints and their requirements',
          '  GET /api/help/quest           — quest schema, fields, and lifecycle',
          '  GET /api/help/node            — node schema, fields, and connections',
          '  GET /api/help/monster         — monster schema and terrain linkage',
          '  GET /api/help/terrain         — terrain schema and monster arrays',
          '  GET /api/help/mission_bit     — mission-bit token pattern for quests',
          '  GET /api/help/export          — exporting arrays as JSON / JS / module',
          '  GET /api/help/wizard          — full workflow: terrain→node→monster→quest',
          '  GET /api/help/audit           — integrity scan and fixing errors',
          '  GET /api/next-error           — first failing validation item with fix action + context',
          '  GET /api/help/coords          — coordinate system, 4x expansion, and node placement',
          '  GET /api/help/import          — 1367 quest import workflow and node placement strategy',
          '  GET /api/help/curl            — curl cheat sheet for every operation',
          '  GET /api/help/cli             — api.sh CLI reference (live: runs ./api.sh --help)',
          '  GET /api/help/workflow        — search→inspect→edit cycle for every entity type',
          '',
          'PREFERRED TOOL — USE ./api.sh, NOT curl',
          '  ./api.sh handles nonces, retry/backoff, pipe-safe JSON, and queued writes.',
          '  Raw curl is a fallback only (graph/coords endpoints not yet wrapped).',
          '  Run:  ./api.sh --help         for the full, always-current command reference.',
          '  Run:  GET /api/help/workflow  for the common search→inspect→edit cycle.',
          '',
          `Server: ${b}`,
          'Source: paul@roll2hit.com — MIT License',
        ].join('\n'),
      },

      overview: {
        title: 'Overview',
        body: [
          'OVERVIEW',
          '  roll2hit-v3.html is the single source of truth for the entire game.',
          '  All data (nodes, quests, monsters, terrain, NPCs, fish, lake magic)',
          '  is stored as JavaScript literals inside that one HTML file.',
          '',
          '  wbapi-server.js reads the HTML text directly and parses it in memory.',
          '  Every write endpoint mutates the in-memory objects, then serialises',
          '  them back into the HTML file via POST /api/save.',
          '',
          '  The game is fully playable in a browser with only roll2hit-v3.html —',
          '  no Node, no server, no dependencies.',
          '',
          'ARCHITECTURE',
          '  Browser ─── roll2hit-v3.html (game engine + all data)',
          '  Dev tool ── worldbuilder.html (reads game via API, never touched by game)',
          '  API server ─ wbapi-server.js  (parses + writes roll2hit-v3.html in-place)',
          '',
          'TYPICAL WORKFLOW',
          '  1. ./wbapi-toggle.sh start',
          `  2. curl ${b}/api/ping             # confirm server is up`,
          `  3. curl ${b}/api/read/node/CY      # read anything safely`,
          '  4. Plan the write; get a nonce',
          `  5. NONCE=$(curl -s -XPOST ${b}/api/nonce \\`,
          `       -H \'Content-Type: application/json\'`,
          `       -d \'{"type":"quest","id":"quest_new_01"}\' | jq -r .nonce)`,
          `  6. curl -XPOST ${b}/api/quest -H "X-Nonce: $NONCE" ...`,
          `  7. curl -XPOST ${b}/api/save`,
          '',
          'See: GET /api/help/modes  |  GET /api/help/curl',
        ].join('\n'),
      },

      modes: {
        title: 'Read-Only vs. Guided-Write Mode',
        body: [
          'MODES',
          '',
          '1. READ-ONLY MODE (safe — no side effects)',
          '   All GET requests. Nothing is written to disk.',
          '   Suitable for exploration, auditing, and automation.',
          '',
          '   Examples:',
          `     curl ${b}/api/ping`,
          `     curl ${b}/api/node/CY`,
          `     curl ${b}/api/quest/quest_wis_01`,
          `     curl ${b}/api/list/monster`,
          `     curl ${b}/api/audit`,
          `     curl ${b}/api/export/quest_db?format=json`,
          '',
          '2. GUIDED-WRITE MODE (requires nonce)',
          '   POST / PUT / DELETE endpoints that mutate roll2hit-v3.html.',
          '   Every write operation is two-step:',
          '',
          '   Step A — request a nonce (expires in 5 minutes):',
          `     curl -s -XPOST ${b}/api/nonce \\`,
          `       -H \'Content-Type: application/json\'`,
          `       -d \'{"type":"quest","id":"quest_new_01"}\'`,
          '     → { "nonce": "ab12cd34ef56gh78", "expires": "60s" }',
          '',
          '   Step B — send the write with the nonce header:',
          `     curl -XPOST ${b}/api/quest \\`,
          '       -H \'Content-Type: application/json\' \\',
          '       -H \'X-Nonce: ab12cd34ef56gh78\' \\',
          '       -d \'{"id":"quest_new_01","title":"...","type":"combat",...}\'',
          '',
          '   Step C — save (always required after any write):',
          `     curl -XPOST ${b}/api/save`,
          '',
          '   NOTE: The nonce is tied to one {type, id} pair. Reuse is rejected.',
          '   DELETE always requires a nonce. POST and PUT accept nonces but some',
          '   POST endpoints (terrain, monster) are currently nonce-optional.',
          '   See: GET /api/help/nonce',
        ].join('\n'),
      },

      nonce: {
        title: 'Nonces — Write Protection',
        body: [
          'NONCE — WRITE PROTECTION',
          '',
          '  A nonce is a single-use 16-character token that proves intent.',
          '  It is required for DELETE and recommended for destructive PUT/POST.',
          '',
          'REQUEST A NONCE',
          `  POST ${b}/api/nonce`,
          '  Body: { "type": "<entity-type>", "id": "<entity-id>" }',
          '',
          '  type: node | quest | monster | npc | terrain',
          '  id:   the exact key/code/id of the entity you intend to modify',
          '',
          '  Response: { "nonce": "ab12cd34ef56gh78", "expires": 300 }',
          '  Nonces expire after 5 minutes. Request a fresh one if needed.',
          '',
          'USING THE NONCE',
          '  Add header:  X-Nonce: <nonce>',
          '  The server validates type+id match before executing the write.',
          '',
          'EXAMPLE — delete a node with nonce',
          `  NONCE=$(curl -s -XPOST ${b}/api/nonce \\`,
          `    -H \'Content-Type: application/json\'`,
          `    -d \'{"type":"node","id":"XX"}\' | jq -r .nonce)`,
          `  curl -XDELETE ${b}/api/node/XX -H "X-Nonce: $NONCE"`,
          '',
          'WHY NONCES?',
          '  Writes are permanent (no undo). The nonce forces a two-step review:',
          '  read first, confirm the target, then write. It also prevents',
          '  accidental writes from mis-typed curl commands or browser tab replays.',
        ].join('\n'),
      },

      read: {
        title: 'Read-Only Endpoints (GET)',
        body: [
          'READ-ONLY ENDPOINTS — All are GET, no nonce required',
          '',
          `GET ${b}/api/ping`,
          '  Health check. Returns counts of all loaded collections.',
          '',
          `GET ${b}/api/source`,
          '  Raw HTML source of roll2hit-v3.html. Pipe to file to download.',
          `  curl ${b}/api/source -o backup.html`,
          '',
          `GET ${b}/api/audit`,
          '  Integrity scan. Returns errors, warnings, suggestions.',
          '  Errors = broken references; warnings = style issues.',
          '',
          `GET ${b}/api/schema[/{type}]`,
          '  Canonical field schema for node, quest, monster, npc, terrain.',
          '',
          `GET ${b}/api/flags`,
          '  List all _S_DEFAULTS flags and their default values.',
          '',
          `GET ${b}/api/list/{type}[?node=&terrain=&type=]`,
          '  type: node | quest | monster | npc | terrain | fish | lake-magic',
          '  Optional filters narrow results.',
          '',
          `GET ${b}/api/{node|quest|monster|npc|terrain}/{id}`,
          '  Full entity detail including cross-references and connections.',
          `  e.g.  curl ${b}/api/quest/quest_wis_01`,
          '',
          `GET ${b}/api/quest/{id}/chain`,
          '  Upstream and downstream quest chain for a quest.',
          '',
          `GET ${b}/api/location/{code}`,
          '  Composite view: node + quests + NPCs + monsters for a location.',
          '',
          `GET ${b}/api/export/{collection}[?format=json|js|module]`,
          '  Dump a full array as JSON, JS literal, or CommonJS module.',
          '  collection: node_map | quest_db | monster_pool | world_db | fish_pool | all',
          `  e.g.  curl '${b}/api/export/quest_db?format=json' -o quests.json`,
          '',
          `GET ${b}/api/fish[/{key}][?rank=&night=]`,
          '  Fish pool entries. Filter by rank or night flag.',
          '',
          `GET ${b}/api/loot`,
          '  d100 consumable table (potions/scrolls/flashbangs/gold) — annotated with rollRange, totalWeight, gap.',
          '  Magic weapons (+1–+4) are fishing-only. Monster weapon quality via d6 (see GET /api/loot-drop).',
          '',
          `GET ${b}/api/loot-drop[?terrain=&monster=&fishing=&bonus=&name=]`,
          '  Unified loot-drop query. Combines monster trophy/weapon drops and fishing magic items.',
          '  fishing=true → fishing drops only (lake magic + fish trophies)',
          '  fishing=false → monster drops only',
          '  terrain=<key> → filter by terrain key (shows monsters in that terrain)',
          '  monster=<key> → filter by monster key',
          '  bonus=<n>     → n≤0 filters monster weapon quality; n>0 filters lake magic base bonus',
          '  name=<q>      → substring search on monster name, trophy name, or magic item name',
          '',
          `GET ${b}/api/lake-magic[/{key}][?effect=&minRank=]`,
          '  Lake magic item list or single entry.',
        ].join('\n'),
      },

      write: {
        title: 'Write Endpoints (POST / PUT / DELETE)',
        body: [
          'WRITE ENDPOINTS — All mutate roll2hit-v3.html. Run POST /api/save after.',
          '',
          'CREATE',
          `  POST ${b}/api/node          body: {code, label, act, name?, desc?, ...}`,
          `  POST ${b}/api/quest         body: {id, type, title, activateNode, startText, ...}`,
          `  POST ${b}/api/monster       body: {key, name, ac, hp, atk, dmg, xp, tier, cr?, desc?}`,
          `  POST ${b}/api/terrain       body: {key, label, icon?, monsters:[key,...]}`,
          `  POST ${b}/api/npc           body: {key, name, node, occupation?, neutral?, friendly?, dearFriend?}`,
          `  POST ${b}/api/item          body: {key, name, type, icon?, sell?, desc?, atkBonus?, passive?, readText?}`,
          `  POST ${b}/api/fish          body: {key, name, rank, desc?, isNight?}`,
          `  POST ${b}/api/lake-magic    body: {key, name, effect, ...}`,
          `  POST ${b}/api/flags         body: {name, defaultValue, comment?}`,
          '',
          'UPDATE',
          `  PUT  ${b}/api/node/{code}   body: {label?, act?, name?, desc?, ...}`,
          `  PUT  ${b}/api/quest/{id}    body: {title?, type?, startText?, failText?, ...}`,
          `  PUT  ${b}/api/monster/{key} body: {name?, ac?, hp?, atk?, dmg?, xp?, tier?}`,
          `  PUT  ${b}/api/terrain/{key} body: {label?, icon?}`,
          `  PUT  ${b}/api/npc/{key}     body: {name?, role?, desc?}`,
          `  PUT  ${b}/api/loot          body: {entries:[{weight,_type,_magic?},...]}  (full replace)`,
          `  PUT  ${b}/api/loot/{index}  body: {weight?,_type?,_magic?}  (single entry)`,
          '',
          'RENAME / FORK',
          `  POST ${b}/api/monster/{key}/rename   body: {name}`,
          `  POST ${b}/api/monster/{key}/fork     body: {newKey, overrides?}`,
          `  POST ${b}/api/terrain/{key}/swap     body: {oldKey, newKey}`,
          `  POST ${b}/api/node/{code}/move       body: {newCode}`,
          '',
          'DELETE (nonce required)',
          `  DELETE ${b}/api/node/{code}      X-Nonce: <token>`,
          `  DELETE ${b}/api/quest/{id}       X-Nonce: <token>`,
          `  DELETE ${b}/api/monster/{key}    X-Nonce: <token>`,
          `  DELETE ${b}/api/npc/{key}        X-Nonce: <token>`,
          '',
          'SYSTEM',
          `  POST ${b}/api/save      — serialise all in-memory edits back to roll2hit-v3.html`,
          `  POST ${b}/api/reload    — re-parse roll2hit-v3.html from disk (auto-reload already active via fs.watch — manual call is redundant)`,
          `  POST ${b}/api/restart   — exit(0); external process handles relaunch`,
          '',
          'See: GET /api/help/nonce  |  GET /api/help/wizard',
        ].join('\n'),
      },

      quest: {
        title: 'Quest Schema',
        body: [
          'QUEST SCHEMA',
          '',
          '  id            string   unique snake_case identifier  (e.g. quest_delivery_01)',
          '  type          string   combat | explore | trade | social | mission_bit | skill_check',
          '  title         string   display title shown to player',
          '  activateNode  string   node code where quest appears on map',
          '  waypointNode  string?  optional destination node',
          '  npc           string?  NPC key who gives the quest',
          '  startText     string   narrative shown when quest is accepted (BEFORE state)',
          '  failText      string?  shown on failure; player retries next hour',
          '  passText      string?  shown on success; world changes',
          '  reqLevel      number?  minimum player level to accept',
          '  reqQuest      string?  prerequisite quest ID that must be complete',
          '  retryable     boolean  true = player may retry (costs 1 hour each attempt)',
          '  retryGateDays number   days to wait before retry (0 = retry same hour)',
          '  missionBitKey string?  mission_bit item key granted at quest start',
          '  chain         string?  quest ID this unlocks on completion',
          '  xp            number?  XP reward on pass',
          '  gold          number?  gold reward on pass',
          '',
          'LIFECYCLE',
          '  LOCKED → AVAILABLE (reqQuest done, reqLevel met, activateNode visited)',
          '  AVAILABLE → ACTIVE (player accepts; if missionBitKey, item is granted)',
          '  ACTIVE → FAIL (attempt fails; retryable quests stay ACTIVE)',
          '  ACTIVE → PASS (attempt succeeds; missionBitKey item is taken)',
          '  PASS → unlocks chain quest if chain is set',
          '',
          'EXAMPLE — create via curl',
          `  curl -XPOST http://localhost:${PORT}/api/quest \\`,
          `    -H \'Content-Type: application/json\' \\`,
          `    -d \'{"id":"quest_chest_01","type":"mission_bit","title":"The Sealed Chest",`,
          `         "activateNode":"BK","startText":"A merchant presses a locked chest...","failText":"The docks are crawling...",`,
          `         "passText":"The temple priest accepts the chest...","retryable":true,"retryGateDays":0,`,
          `         "missionBitKey":"sealed_merchant_chest"}\'`,
          '',
          'See: GET /api/help/mission_bit',
        ].join('\n'),
      },

      node: {
        title: 'Node Schema',
        body: [
          'NODE SCHEMA',
          '',
          '  code    string   2–3 char map code (e.g. BK, CY, FR)',
          '  label   string   display name shown on map',
          '  name    string?  terrain key from WORLD_DB (e.g. coastal_market)',
          '  act     number   story act (1–8)',
          '  desc    string?  narrative description shown when entering',
          '  x, y    number?  map pixel coordinates',
          '  locked  boolean? true = hidden until unlocked',
          '',
          'CONNECTIONS (read-only, derived)',
          '  quests   — quests with activateNode === this code',
          '  npcs     — NPCs assigned to this node',
          '  monsters — monsters in this node\'s terrain',
          '',
          'EXAMPLE — create',
          `  curl -XPOST http://localhost:${PORT}/api/node \\`,
          `    -H \'Content-Type: application/json\' \\`,
          `    -d \'{"code":"SD","label":"Sunken Docks","act":1,"name":"coastal_market",`,
          `         "desc":"Fog-shrouded docks where sailors speak in whispers."}\'`,
        ].join('\n'),
      },

      monster: {
        title: 'Monster Schema',
        body: [
          'MONSTER SCHEMA (MONSTER_POOL)',
          '',
          '  key     string   snake_case identifier (e.g. dock_rat)',
          '  name    string   display name',
          '  ac      number   armour class',
          '  hp      number   hit points',
          '  atk     number   attack bonus',
          '  dmg     number   average damage per hit',
          '  xp      number   XP awarded on defeat',
          '  tier    number   encounter tier 1–5',
          '  cr      string?  challenge rating (e.g. "1/8", "2")',
          '  size    string?  Tiny | Small | Medium | Large | Huge | Gargantuan',
          '  type    string?  beast | undead | humanoid | fiend | ...',
          '  align   string?  e.g. "neutral evil"',
          '  speed   string?  e.g. "30 ft"',
          '  desc    string?  flavour description',
          '',
          'TERRAIN LINKAGE',
          '  Monsters belong to terrains via WORLD_DB entries.',
          '  To add a monster to a terrain after creating it:',
          `  PUT http://localhost:${PORT}/api/terrain/{terrainKey}`,
          '  body: { "monsters": ["existing_key", "new_monster_key"] }',
          '',
          'EXAMPLE',
          `  curl -XPOST http://localhost:${PORT}/api/monster \\`,
          `    -H \'Content-Type: application/json\' \\`,
          `    -d \'{"key":"dock_rat","name":"Dock Rat","ac":11,"hp":4,`,
          `         "atk":2,"dmg":3,"xp":10,"tier":1,"cr":"1/8",`,
          `         "desc":"A mangy rodent the size of a small dog."}\'`,
        ].join('\n'),
      },

      terrain: {
        title: 'Terrain Schema',
        body: [
          'TERRAIN SCHEMA (WORLD_DB)',
          '',
          '  key       string   snake_case identifier (e.g. coastal_market)',
          '  label     string   display name',
          '  icon      string?  emoji or short string shown on map',
          '  monsters  array    list of MONSTER_POOL keys that can spawn here',
          '',
          'NODES ↔ TERRAIN',
          '  A node\'s "name" field is its terrain key.',
          '  Monsters in that terrain can appear when the player is at that node.',
          '',
          'EXAMPLE — create terrain',
          `  curl -XPOST http://localhost:${PORT}/api/terrain \\`,
          `    -H \'Content-Type: application/json\' \\`,
          `    -d \'{"key":"fog_docks","label":"Fog Docks","icon":"🌫","monsters":["dock_rat","drowned_sailor"]}\'`,
          '',
          'EXAMPLE — add a monster to existing terrain',
          `  curl -XPUT http://localhost:${PORT}/api/terrain/coastal_market \\`,
          `    -H \'Content-Type: application/json\' \\`,
          `    -d \'{"monsters":["goblin","dock_rat","coastal_bandit"]}\'`,
        ].join('\n'),
      },

      mission_bit: {
        title: 'Mission Bit Token Pattern',
        body: [
          'MISSION BIT TOKEN',
          '',
          '  A mission bit token is an inventory item of type "mission_bit".',
          '  It represents the physical burden of a quest — the thing the player',
          '  carries. The item is granted when the quest starts and taken when',
          '  the quest passes.',
          '',
          'ITEM SHAPE',
          `  { type: 'mission_bit',`,
          `    id:   'sealed_merchant_chest',`,
          `    name: 'Sealed Merchant Chest',`,
          `    desc: 'A locked chest you were paid to deliver. You dare not look inside.',`,
          `    checkPassFlag: 'sealed_merchant_chest_done' }`,
          '',
          'QUEST WIRING',
          '  Set missionBitKey in the quest to the item\'s id.',
          '  The engine calls _grantMissionBit(player, item) on quest accept',
          '  and _takeMissionBit(player, item) on quest pass.',
          '',
          'RETRY PATTERN',
          '  Most mission_bit quests should be retryable:',
          '  retryable: true, retryGateDays: 0',
          '  → each attempt costs 1 hour; fail text explains the delay.',
          '',
          'FAIL TEXT CONVENTION',
          '  Fail text should describe a plausible in-world reason for delay:',
          '  patrols, weather, a locked gate, a suspicious guard.',
          '  The player keeps the token and tries again next hour.',
          '',
          'See: GET /api/help/quest',
        ].join('\n'),
      },

      coords: {
        title: 'Coordinate System and 4x Expansion',
        body: [
          'COORDINATE SYSTEM',
          '',
          '  NODE_COORDS stores {r, c} (row, column) for each node.',
          '  The worldbuilder renders the map at mapScale px per cell.',
          '  Canvas size auto-computes from max(r) and max(c) in the data.',
          '',
          '4x EXPANSION (applied 2026-06-03)',
          '  All coordinates were multiplied by 4:',
          '    original maxR:48, maxC:60  →  new maxR:192, maxC:240',
          '  Original adjacent nodes are now 4 cells apart.',
          '  3 empty slots exist between every pair of adjacent original nodes.',
          '',
          'ENDPOINTS',
          `  GET  ${b}/api/coords                  — full coordinate map + bounds`,
          `  GET  ${b}/api/coords/near/{code}       — nearby nodes + available slots`,
          `  PUT  ${b}/api/coords/{code}            — body: {r, c}  (updates existing)`,
          '  POST /api/node  body: {code,...,r,c}   — creates node + inserts coords',
          '',
          'PLACEMENT WORKFLOW (inserting between nodes)',
          '  1. GET /api/coords/near/{startingNode}?radius=8',
          '     → returns nearby[] (occupied) and available[] (empty slots)',
          '  2. Choose a slot from available[] that is close to the starting node',
          '     and does not conflict with existing nodes.',
          '  3. POST /api/node with r and c set to the chosen slot.',
          '     → NODE_MAP + NODE_COORDS both updated in one call.',
          '  4. POST /api/save',
          '',
          'COLLISION CHECK',
          '  PUT /api/coords/{code} returns 409 if the target r,c is already occupied.',
          '  POST /api/node with r,c also checks for collisions before writing.',
          '',
          'See: GET /api/help/import',
        ].join('\n'),
      },

      import: {
        title: '1367 Quest Import Workflow — 8-Step Ordered Procedure',
        body: [
          '1367 QUEST IMPORT — ALL PHASES OF QUEST BOOK ANALYSIS',
          'Mandatory ordered procedure. Run once per quest act. Do not skip steps.',
          '',
          'PRE-IMPORT (before any API call)',
          '  Read: 1367-sources/{CODE}-{title}.md  (vignette seeds + UQF cycles)',
          '  Read: 1367-sources/index.md           (canonical nodes, airport codes, terrain)',
          '  Location info MUST match the story. Do not invent geography.',
          '  NODE NAMING — TWO TIERS:',
          '  TIER 1 (city/town): 3-letter IATA airport code of nearest major airport.',
          '    If taken → nearest alternate. No airport → 3-char city abbrev in index.md.',
          '    Examples: PSA (Florence/Pisa), NAP (Naples), EMA (Nottingham)',
          '  TIER 2 (specific place: market, court, inn, palace, field, guard shack...):',
          '    4–6 char code: {CITY}{LOC}. Self-explanatory. Record in index.md.',
          '    Examples: BIRGS (Birka Guard Shack), PSAGLD (Florence guild), NAPCRT (Naples court)',
          '  RULE: City → 3-letter. Named place inside city → 4-6 char Tier 2 code.',
          '  Label must explain WHY the location exists in the story.',
          `  Verify uniqueness: curl ${b}/api/list/node`,
          '',
          'STEP 1 — Verify the primary location',
          `    curl ${b}/api/location/{code}`,
          '  If missing: find slot → create node with r,c coords',
          `    curl '${b}/api/coords/near/{anchor}?radius=8'`,
          `    curl -XPOST ${b}/api/node -d '{"code":"EMA","label":"...","name":"city","r":48,"c":116}'`,
          '  Confirm terrain + label match story before continuing.',
          '',
          'STEP 2 — Verify the quest NPC exists',
          `    curl ${b}/api/npc/{id}`,
          '  If missing: create NPC at the node from Step 1',
          `    curl -XPOST ${b}/api/npc -d '{"id":"friar_tuck","name":"Friar Tuck","node":"EMA",...}'`,
          '  NPC name and role come from the source text — use the character as written.',
          '',
          'STEP 3 — Verify NPC is at the location',
          '  Confirm NPC node field = node from Step 1.',
          `  If wrong: curl -XPUT ${b}/api/npc/{id} -d '{"node":"EMA"}'`,
          '  NPC must be resident at the node where the quest fires.',
          '',
          'STEP 4 — Verify all other locations the quest touches',
          '  Each act may reference waypoints, handoff cities, destinations.',
          `  For each: curl ${b}/api/location/{code}`,
          '  Add missing nodes (Step 1 procedure). ALL activateNode codes must exist first.',
          '',
          'STEP 5 — Add the quest via NPC',
          '  Include all text fields: title, text (arrival/location desc), passText, failText.',
          '  type: combat | explore | trade | social | mission_bit | skill_check',
          `    curl -XPOST ${b}/api/quest -d '{`,
          '      "id":"stn_01_act1","type":"skill_check",',
          '      "title":"...","text":"arrival description...",',
          '      "activateNode":"EMA","checkStat":"wis","checkDC":12,',
          '      "passText":"...","failText":"...","checkPassFlag":"stnAct1Done"',
          '    }\'',
          '  Act 2+: add "activateCond":"stnAct1Done" (prev act checkPassFlag — serialized as () => !!S_story.stnAct1Done)',
          '  Final act: add "questComplete":true',
          '',
          'STEP 6 — Chain via mission bits',
          '  Create missing flags:',
          `    curl -XPOST ${b}/api/flags -d '{"name":"stnAct1Done","defaultValue":false}'`,
          '  Verify chain resolves end-to-end:',
          `    curl ${b}/api/quest/stn_01_act1/chain`,
          '',
          'STEP 7 — Validate after insert',
          `    curl ${b}/api/audit | jq '.errors'`,
          '  Fix ALL errors before proceeding. Clean audit = required before save.',
          '',
          'STEP 8 — Review unresolved items, mark done, speak, then repeat',
          '  Report: missing source data, ambiguous codes, NPC conflicts, unresolvable geography.',
          '  Ask user to resolve before continuing.',
          '  When act complete + audit clean:',
          `    curl -XPOST ${b}/api/save`,
          '  If user confirms good:',
          '    1. Mark vignette IMPORTED in plan.md §IMPORT-01 (QUEUED → IMPORTED — {date})',
          '    2. say "Cycle imported. Ready to continue. Say yes to proceed to the next quest."',
          '    3. Wait for user confirmation, then return to Step 1 for the next act.',
          '',
          'IMPORT QUEUE',
          '  See 1367-sources/plan.md §IMPORT-01 for per-book queue and node lists.',
        ].join('\n'),
      },

      export: {
        title: 'Export Endpoints',
        body: [
          'EXPORT',
          '',
          `GET ${b}/api/export/{collection}[?format=json|js|module]`,
          '',
          '  Dumps a full in-memory collection as a downloadable artifact.',
          '',
          'COLLECTIONS',
          '  node_map     — NODE_MAP object',
          '  quest_db     — QUEST_DB object',
          '  monster_pool — MONSTER_POOL object',
          '  world_db     — WORLD_DB (terrain) object',
          '  fish_pool    — { day: [...], night: [...] }',
          '  lake_magic   — LAKE_MAGIC_DB object',
          '  all          — all of the above in one object',
          '',
          'FORMATS',
          '  json    (default) — standard JSON',
          '  js      — assignment: const QUEST_DB = {...};',
          '  module  — CommonJS: module.exports = {...};',
          '',
          'EXAMPLES',
          `  curl '${b}/api/export/quest_db?format=json' -o quests.json`,
          `  curl '${b}/api/export/monster_pool?format=js' -o monsters.js`,
          `  curl '${b}/api/export/all?format=module' -o game-data.js`,
        ].join('\n'),
      },

      wizard: {
        title: 'Full Creation Workflow',
        body: [
          'FULL CREATION WORKFLOW (terrain → node → monster → quest)',
          '',
          'This is the API-first sequence for adding a new quest with a new',
          'location and a new monster.',
          '',
          `SERVER=http://localhost:${PORT}`,
          '',
          '# 1. Check current state',
          `curl $SERVER/api/ping`,
          `curl $SERVER/api/audit`,
          '',
          '# 2. Create terrain (if new)',
          `curl -XPOST $SERVER/api/terrain \\`,
          `  -H 'Content-Type: application/json' \\`,
          `  -d '{"key":"fog_docks","label":"Fog Docks","icon":"🌫","monsters":[]}'`,
          '',
          '# 3. Create node',
          `curl -XPOST $SERVER/api/node \\`,
          `  -H 'Content-Type: application/json' \\`,
          `  -d '{"code":"FD","label":"Fog Docks","act":1,"name":"fog_docks","desc":"..."}'`,
          '',
          '# 4. Create monster',
          `curl -XPOST $SERVER/api/monster \\`,
          `  -H 'Content-Type: application/json' \\`,
          `  -d '{"key":"dock_rat","name":"Dock Rat","ac":11,"hp":4,"atk":2,"dmg":3,"xp":10,"tier":1}'`,
          '',
          '# 5. Add monster to terrain',
          `curl -XPUT $SERVER/api/terrain/fog_docks \\`,
          `  -H 'Content-Type: application/json' \\`,
          `  -d '{"monsters":["dock_rat"]}'`,
          '',
          '# 6. Create quest with mission bit',
          `curl -XPOST $SERVER/api/quest \\`,
          `  -H 'Content-Type: application/json' \\`,
          `  -d '{"id":"quest_chest_01","type":"mission_bit","title":"The Sealed Chest",`,
          `       "activateNode":"FD","retryable":true,"retryGateDays":0,`,
          `       "missionBitKey":"sealed_chest",`,
          `       "startText":"...","failText":"...","passText":"..."}'`,
          '',
          '# 7. Save to file',
          `curl -XPOST $SERVER/api/save`,
          '',
          '# 8. Restart server to reload',
          `curl -XPOST $SERVER/api/restart`,
          '',
          'TIP: Use worldbuilder.html → ✦ Wizard tab for a guided UI version.',
          'See: GET /api/help/mission_bit  |  GET /api/help/nonce',
        ].join('\n'),
      },

      audit: {
        title: 'Audit — Data Integrity',
        body: [
          'AUDIT',
          '',
          `GET ${b}/api/audit`,
          '',
          '  Scans the in-memory game data for integrity issues.',
          '  Returns a list of findings grouped by severity:',
          '',
          '  error       — broken reference; will cause bugs at runtime',
          '  warning     — style issue or likely mistake; game still works',
          '  suggestion  — improvement; not required',
          '  parse       — section could not be parsed; data may be missing',
          '',
          'COMMON ERRORS',
          '  node quest ref  — quest.activateNode points to a missing node code',
          '  monster key ref — terrain monster list references missing MONSTER_POOL key',
          '  quest chain ref — quest.chain points to a missing quest ID',
          '  npc node ref    — NPC.node points to a missing node code',
          '  quest no npc    — quest.npc is missing (every quest must have an NPC anchor)',
          '',
          'COMMON WARNINGS',
          '  npc no quests   — NPC exists but has no quests (no gameplay function)',
          '  npc no dialogue — NPC has no NPC_DIALOGUES entry',
          '  terrain no mon  — terrain has no monsters defined',
          '',
          'FIXING ERRORS',
          '  1. Run audit to get the error list',
          '  2. For broken references: create the missing entity or fix the key',
          '  3. For typos in existing keys: use /rename or /swap endpoints',
          '  4. Run audit again to confirm errors dropped to zero',
          '',
          `  e.g. ./api.sh audit`,
          `      ./api.sh audit --raw | jq '.errors'`,
        ].join('\n'),
      },

      curl: {
        title: 'curl Cheat Sheet',
        body: [
          `CURL CHEAT SHEET  —  ${b}`,
          '',
          '# Health & info',
          `curl ${b}/api/ping`,
          `curl ${b}/api/audit`,
          `curl ${b}/api/schema`,
          `curl ${b}/api/flags`,
          '',
          '# Read entities',
          `curl ${b}/api/node/CY`,
          `curl ${b}/api/quest/quest_wis_01`,
          `curl ${b}/api/monster/goblin`,
          `curl ${b}/api/terrain/forest`,
          `curl ${b}/api/location/CY`,
          `curl ${b}/api/quest/quest_wis_01/chain`,
          '',
          '# List',
          `curl ${b}/api/list/node`,
          `curl ${b}/api/list/quest`,
          `curl ${b}/api/list/monster`,
          `curl ${b}/api/list/terrain`,
          `curl '${b}/api/list/quest?node=CY'`,
          '',
          '# Export',
          `curl '${b}/api/export/quest_db?format=json'`,
          `curl '${b}/api/export/all?format=module'`,
          '',
          '# Create',
          `curl -XPOST ${b}/api/node    -H 'Content-Type: application/json' -d '{"code":"XX","label":"New Node","act":1}'`,
          `curl -XPOST ${b}/api/quest   -H 'Content-Type: application/json' -d '{"id":"quest_xx_01","type":"combat","title":"...","activateNode":"XX"}'`,
          `curl -XPOST ${b}/api/monster -H 'Content-Type: application/json' -d '{"key":"new_mob","name":"New Mob","ac":12,"hp":6,"atk":3,"dmg":4,"xp":15,"tier":1}'`,
          `curl -XPOST ${b}/api/terrain -H 'Content-Type: application/json' -d '{"key":"new_terrain","label":"New Terrain","monsters":["new_mob"]}'`,
          '',
          '# Update',
          `curl -XPUT ${b}/api/node/XX    -H 'Content-Type: application/json' -d '{"label":"Updated Label"}'`,
          `curl -XPUT ${b}/api/quest/q_01 -H 'Content-Type: application/json' -d '{"failText":"..."}'`,
          '',
          '# Delete (nonce required)',
          `NONCE=$(curl -s -XPOST ${b}/api/nonce -H 'Content-Type: application/json' -d '{"type":"node","id":"XX"}' | jq -r .nonce)`,
          `curl -XDELETE ${b}/api/node/XX -H "X-Nonce: $NONCE"`,
          '',
          '# Save / restart',
          `curl -XPOST ${b}/api/save`,
          `curl -XPOST ${b}/api/restart`,
          '',
          '# Help topics',
          `curl ${b}/api/help`,
          `curl ${b}/api/help/modes`,
          `curl ${b}/api/help/nonce`,
          `curl ${b}/api/help/quest`,
          `curl ${b}/api/help/wizard`,
        ].join('\n'),
      },

      workflow: {
        title: 'api.sh Workflow — Search → Inspect → Edit',
        body: [
          'PREFERRED TOOL',
          '  Always use ./api.sh for day-to-day work. Raw curl is a fallback only.',
          '  api.sh handles nonces, retry/backoff, pipe-safe JSON, and queued writes.',
          '  Run  ./api.sh --help  for the full command reference.',
          '  Run  GET /api/help/cli  for the live api.sh manual from this server.',
          '',
          'THE COMMON CYCLE — search → inspect → edit',
          '  Never guess an ID. Search first, fetch full details, then edit.',
          '',
          '── QUESTS ───────────────────────────────────────────────────────',
          '',
          '  # 1. Find by keyword or filter',
          '  ./api.sh list quest --q "wolsey"',
          '  ./api.sh list quest --arc shk --q "inventory"',
          '  ./api.sh list quest --node BK --type skill_check',
          '',
          '  # 2. Fetch all fields',
          '  ./api.sh get quest shk6_act1',
          '  #  → desc, passText, failText, npc, activateNode, checkDC …',
          '',
          '  # 3. Patch the field(s) you need',
          '  ./api.sh put quest shk6_act1 desc="Egil Thorvaldsen, a Birka wool factor..."',
          '  ./api.sh put quest shk6_act1 npc=egil_thorvaldsen checkDC=14',
          '  # Multi-field via JSON pipe:',
          '  echo \'{"desc":"...","passText":"...","failText":"..."}\' | ./api.sh put quest shk6_act1',
          '',
          '── NODES ────────────────────────────────────────────────────────',
          '',
          '  # 1. Find the node',
          '  ./api.sh list node --q "nuremberg"',
          '  ./api.sh list node --terrain scholars_qtr',
          '',
          '  # 2. Composite view — node + quests + NPCs + monsters',
          '  ./api.sh location NUE',
          '  ./api.sh get node NUE   # → label, terrain, coords, N/E/S/W, quest list',
          '',
          '  # 3. Edit',
          '  ./api.sh put node NUE label="Nuremberg Scholar Quarter"',
          '  ./api.sh put node NUE N=BMA S=KRN',
          '',
          '── NPCs ─────────────────────────────────────────────────────────',
          '',
          '  # 1. Find the NPC',
          '  ./api.sh list npc --q "egil"',
          '  ./api.sh list npc --node BK',
          '  ./api.sh list npc --occupation "clerk"',
          '',
          '  # 2. Fetch details — quests linked, node, occupation',
          '  ./api.sh get npc egil_thorvaldsen',
          '',
          '  # 3. Edit or link a quest',
          '  ./api.sh put npc egil_thorvaldsen occupation="wool factor and Hanseatic broker"',
          '  ./api.sh put quest shk6_act1 npc=egil_thorvaldsen',
          '',
          '── MONSTERS ─────────────────────────────────────────────────────',
          '',
          '  # 1. Find by terrain or keyword',
          '  ./api.sh list monster --terrain crypt',
          '  ./api.sh list monster --q "shadow" --tier easy',
          '',
          '  # 2. Inspect stat block',
          '  ./api.sh get monster shadow',
          '',
          '  # 3. Tune stats',
          '  ./api.sh put monster shadow hp=22 ac=13 tier=medium',
          '',
          '── TERRAIN ──────────────────────────────────────────────────────',
          '',
          '  # 1. Find terrain key (needed when creating nodes)',
          '  ./api.sh list terrain --q "scholar"',
          '  ./api.sh list terrain --ids',
          '',
          '  # 2. See which monsters are assigned',
          '  ./api.sh get terrain scholars_qtr',
          '  ./api.sh list monster --terrain scholars_qtr',
          '',
          '  # 3. Edit',
          '  ./api.sh put terrain scholars_qtr label="Scholar\'s Quarter"',
          '',
          '── CREATE → VERIFY → COMMIT ─────────────────────────────────────',
          '',
          '  ./api.sh post npc key=marta_vby name="Marta" node=VBY occupation="Flemish intake clerk"',
          '  ./api.sh get npc marta_vby                   # confirm it landed',
          '  ./api.sh list quest --arc shk --q "visby"    # find quest ID',
          '  ./api.sh put quest shk6_act2 npc=marta_vby   # link it',
          '  ./api.sh audit --raw | jq \'{errors:.errors|length,warnings:.warnings|length}\'',
          '',
          '── BULK SEARCH WITH jq ──────────────────────────────────────────',
          '',
          '  # Quests missing desc',
          '  ./api.sh export quest_db --raw | jq \'[to_entries[]|select(.value.desc==""or.value.desc==null)|.key]\'',
          '',
          '  # All quests for a specific NPC',
          '  ./api.sh list quest --npc egil_thorvaldsen',
          '',
          '  # Nodes in act 2 with no quests',
          '  ./api.sh list node --act 2 --has-quests false',
          '',
          '  # NPC keys at a node',
          '  ./api.sh list npc --node NUE --ids',
          '',
          'MORE',
          '  ./api.sh --help             full command reference',
          `  GET ${b}/api/help/cli    live ./api.sh --help output from server`,
          `  GET ${b}/api/help/wizard full create workflow`,
          `  GET ${b}/api/help/audit  fixing errors and warnings`,
        ].join('\n'),
      },
    };

    // cli topic — run ./api.sh --help live and return current output
    if (topic === 'cli') {
      const { execFile } = require('child_process');
      const apiSh = path.join(__dirname, 'api.sh');
      return new Promise(resolve => {
        execFile(apiSh, ['--help'], { timeout: 8000 }, (err, stdout, stderr) => {
          const output = (stdout || '') + (stderr || '');
          const title  = 'api.sh CLI Reference';
          logResponse(method, url.pathname, 200, title);
          const plain = (url.searchParams.get('format') || 'text') === 'text';
          if (plain) {
            cors(res);
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            return resolve(res.end(`\n${title}\n${'─'.repeat(title.length)}\n\n${output}\n`));
          }
          resolve(json(res, 200, { topic, title, text: output, live: true, source: './api.sh --help' }));
        });
      });
    }

    const entry = HELP[topic] || HELP['index'];
    const plain = method === 'GET' && (url.searchParams.get('format') || 'text') === 'text';
    logResponse(method, url.pathname, 200, entry.title);
    if (plain) {
      cors(res);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end(`\n${entry.title}\n${'─'.repeat(entry.title.length)}\n\n${entry.body}\n\n`);
    }
    return json(res, 200, { topic, title: entry.title, text: entry.body, topics: Object.keys(HELP) });
  }

  // ── 67 ──
  if (parts[0] === '67') {
    logResponse(method, url.pathname, 200, '⁶⁷');
    return json(res, 200, {
      ok: true,
      year: 1367,
      leet: 1337,
      port: PORT,
      node: 'LXVII67',
      note: '67 > 69. self-serve. double dab. taps chest.',
      faith: 'faith_folk',
      puzzle: 'two must arrive alone and answer the same question without conferring. the jester does not ask it aloud.',
      dab: '⁶⁷',
    });
  }

  // ── Health ──
  if (parts[0] === 'ping') {
    const nNodes = Object.keys(WBAPI.nodeMap).length;
    const nQuests = Object.keys(WBAPI.questDb).length;
    const nMonsters = Object.keys(WBAPI.monsterPool).length;
    const nTerrains = Object.keys(WBAPI.worldDb).length;
    const nFish = WBAPI.fishPool.length + WBAPI.nightFishPool.length;
    const resp = { ok:true, loaded: WBAPI.loaded, file: path.basename(GAME_FILE),
      nodes:nNodes, quests:nQuests, monsters:nMonsters,
      fish:nFish, lakeMagic:Object.keys(WBAPI.lakeMagicDb).length };
    logRow(`${nNodes} nodes  ·  ${nQuests} quests  ·  ${nMonsters} monsters  ·  ${nTerrains} terrains  ·  ${nFish} fish`);
    logResponse(method, url.pathname, 200, 'ok');
    return json(res, 200, resp);
  }

  // ── Mode (fast | debug | trace) ──
  if (parts[0] === 'mode') {
    if (method === 'GET') {
      logResponse(method, url.pathname, 200, `mode=${currentMode}`);
      return json(res, 200, { mode: currentMode, verbose: VERBOSE, trace: TRACE });
    }
    if (method === 'POST') {
      let body;
      try { body = await readBody(req); } catch(e) { return json(res, 400, { error:'Invalid JSON' }); }
      const { mode } = body || {};
      if (!mode) return json(res, 400, { error:'body.mode required  (fast | debug | trace)' });
      if (!_applyMode(mode, true))
        return json(res, 400, { error:`Unknown mode "${mode}". Valid: fast, debug, trace` });
      log('INFO', `Mode changed → ${currentMode}`, { verbose: VERBOSE, trace: TRACE });
      logResponse(method, url.pathname, 200, `mode → ${currentMode}`);
      return json(res, 200, { ok: true, mode: currentMode, verbose: VERBOSE, trace: TRACE });
    }
    return json(res, 405, { error:'GET or POST' });
  }

  // ── Source (raw HTML for worldbuilder "Load from Server") ──
  if (parts[0] === 'source' && method === 'GET') {
    try {
      const src = fs.readFileSync(GAME_FILE, 'utf8');
      const kb = (src.length / 1024).toFixed(1);
      logRow('file', path.basename(GAME_FILE));
      logRow('size', `${kb} KB  ·  ${src.split('\n').length} lines`);
      logResponse(method, url.pathname, 200, `${kb} KB`);
      cors(res);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(src);
    } catch(e) {
      logResponse(method, url.pathname, 500, `read failed: ${e.message}`);
      return json(res, 500, { ok:false, error:e.message });
    }
    return;
  }

  // ── Nonce (one-time delete token) ──
  if (parts[0] === 'nonce') {
    if (method === 'POST') {
      let body;
      try { body = await readBody(req); } catch(e) {
        return json(res, 400, { error:'Invalid JSON' });
      }
      const { type, id } = body || {};
      if (!type || !id) return json(res, 400, { error:'body.type and body.id required' });
      const validTypes = ['node','quest','monster','npc'];
      if (!validTypes.includes(type)) return json(res, 400, { error:`type must be one of: ${validTypes.join(', ')}` });
      const col = { node:WBAPI.nodeMap, quest:WBAPI.questDb, monster:WBAPI.monsterPool, npc:WBAPI.birkaNpcs }[type];
      const resolvedKey = WBAPI._findKey(col, id) || id;
      const token = nonceIssue(type, resolvedKey);
      const expiresAt = new Date(Date.now() + NONCE_TTL).toISOString();
      logRow('type › id', `${type} › ${resolvedKey}`);
      logRow('token', `${token}  (expires in 5 min)`);
      logResponse('POST', '/api/nonce', 200, 'nonce issued');
      return json(res, 200, { nonce: token, type, id: resolvedKey, expiresAt });
    }
    logResponse(method, '/api/nonce', 405, 'POST only');
    return json(res, 405, { error:'POST only' });
  }

  // ── Restart (exits with code 0; external process is responsible for relaunch) ──
  if (parts[0] === 'restart' && method === 'POST') {
    logRow('exit(0)', 'shutting down — external process responsible for relaunch');
    logResponse(method, url.pathname, 200, 'restarting');
    res.writeHead(200, { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' });
    res.end(JSON.stringify({ ok:true, note:'Server shutting down. External process will relaunch.' }));
    server.close(() => { process.exit(0); });
    setTimeout(() => process.exit(0), 500);
    return;
  }

  // ── Reload ──
  if (parts[0] === 'reload' && method === 'POST') {
    try {
      reload();
      const stats = `${Object.keys(WBAPI.nodeMap).length} nodes  ·  ${Object.keys(WBAPI.questDb).length} quests  ·  ${Object.keys(WBAPI.monsterPool).length} monsters`;
      logRow('file', path.basename(GAME_FILE));
      logRow('loaded', stats);
      logResponse(method, url.pathname, 200, 'reload ok');
      return json(res, 200, {
        ok: true,
        note: 'Auto-reload is already active — the server watches roll2hit-v3.html and reloads automatically on any external edit. Manual POST /api/reload is redundant unless the watcher missed an event.',
      });
    } catch(e) {
      log('ERROR', `Reload failed: ${e.message}`);
      logResponse(method, url.pathname, 500, `reload failed: ${e.message}`);
      return json(res, 500, { ok:false, error:e.message });
    }
  }

  // ── Save ──
  if (parts[0] === 'save' && method === 'POST') {
    // 1. Write timestamped backup
    const r = WBAPI.save();
    if (!r.ok) {
      logResponse(method, url.pathname, 500, r.error);
      return json(res, 500, r);
    }
    const backupPath = r.path;
    const kb = (fs.statSync(backupPath).size / 1024).toFixed(1);
    logRow('backup', backupPath);
    logRow('size',   `${kb} KB`);

    // 2. Overwrite the primary game file
    try {
      fs.copyFileSync(backupPath, GAME_FILE);
      logRow('wrote', GAME_FILE);
    } catch (e) {
      logResponse(method, url.pathname, 500, `overwrite failed: ${e.message}`);
      return json(res, 500, { ok:false, error: e.message, backup: backupPath });
    }

    // 3. Hot-reload in memory, then respond — no process restart
    try {
      WBAPI.load(GAME_FILE);
      logRow('reload', 'memory refreshed from disk');
    } catch(e) {
      logResponse(method, url.pathname, 500, `reload failed: ${e.message}`);
      return json(res, 500, { ok:false, error:`reload failed after save: ${e.message}`, backup: backupPath });
    }
    logResponse(method, url.pathname, 200, `saved → reloaded`);
    return json(res, 200, { ok:true, backup: backupPath, primary: GAME_FILE });
  }

  // ── Schema ──
  if (parts[0] === 'schema') {
    const type = parts[1];
    if (type && !SCHEMAS[type]) {
      logResponse(method, url.pathname, 404, `unknown schema type: ${type}`);
      return json(res, 404, { error: `Unknown schema type "${type}". Available: ${Object.keys(SCHEMAS).filter(k=>!k.startsWith('_')).join(', ')}` });
    }
    const result = type ? SCHEMAS[type] : SCHEMAS;
    const fields = type ? Object.keys(result.fields||{}).length : Object.keys(result).filter(k=>!k.startsWith('_')).length;
    logRow('type', type || '(all)');
    logRow('fields', fields);
    logResponse(method, url.pathname, 200, type ? `schema/${type}` : 'all schemas');
    return json(res, 200, result);
  }

  // ── Diff summary ──
  if (parts[0] === 'diff' && method === 'GET') {
    logRow('note', 'Use POST /api/save to write pending changes');
    logResponse(method, url.pathname, 200, 'diff');
    return json(res, 200, { note: 'Use POST /api/save to write all pending changes to disk' });
  }

  // ── Fish (FISH_DB) ────────────────────────────────────────────────────────
  if (parts[0] === 'fish') {
    const fishKey = parts[1];

    if (method === 'GET') {
      if (!fishKey) {
        const rankFilter  = url.searchParams.get('rank');
        const nightFilter = url.searchParams.get('night');
        let day   = WBAPI.fishPool.map(f => ({ ...f, isNight:false }));
        let night = WBAPI.nightFishPool.map(f => ({ ...f, isNight:true }));
        let all   = [...day, ...night];
        if (rankFilter !== null) all = all.filter(f => f.rank === Number(rankFilter));
        if (nightFilter === 'true') all = all.filter(f => f.isNight);
        if (nightFilter === 'false') all = all.filter(f => !f.isNight);
        all.sort((a, b) => a.rank - b.rank || (a.isNight ? 1 : -1));
        const dayN = all.filter(f=>!f.isNight).length, nightN = all.filter(f=>f.isNight).length;
        logRow('total', `${all.length} fish  ·  ${dayN} day  ·  ${nightN} night`);
        if (rankFilter||nightFilter) logRow('filter', [rankFilter&&`rank=${rankFilter}`, nightFilter&&`night=${nightFilter}`].filter(Boolean).join('  '));
        logRow('sample', sample(all.slice(0,4).map(f=>`${f.key}(r${f.rank})`), 4));
        logResponse(method, url.pathname, 200, `${all.length} fish`);
        return json(res, 200, { ok:true, count:all.length, fish: all });
      }
      const found = [...WBAPI.fishPool, ...WBAPI.nightFishPool].find(f => f.key === fishKey);
      if (!found) {
        logResponse(method, url.pathname, 404, `fish "${fishKey}" not found`);
        return json(res, 404, { error:`fish "${fishKey}" not found` });
      }
      const isNight = WBAPI.nightFishPool.some(f => f.key === fishKey);
      const drop    = WBAPI.monsterDrops[fishKey] || null;
      const monster = WBAPI.monsterPool[fishKey]  || null;
      logRow('fish', `${found.name}  ·  rank ${found.rank}  ·  ${isNight ? '🌙 night' : '☀ day'}`);
      if (drop) logRow('drop', drop.name);
      logResponse(method, url.pathname, 200, `fish/${fishKey}`);
      return json(res, 200, { ok:true, fish:{ ...found, isNight },
        connections:{ drop, monster }, _meta:{ canDelete: false } });
    }

    if (method === 'POST' && fishKey === 'simulate') {
      let body;
      try { body = await readBody(req); } catch(e) { return json(res, 400, { error:'Invalid JSON' }); }
      log('REQUEST', 'POST /api/fish/simulate', body);
      const dexMod   = Number(body.dexMod   || 0);
      const catchMod = Number(body.catchMod || 0);
      const typeMod  = Number(body.typeMod  || 0);
      const luckMod  = Number(body.luckMod  || 0);
      const rodBonus = Number(body.rodBonus || 0);
      const d20 = () => Math.ceil(Math.random() * 20);

      // Phase 1 — Cast (DEX)
      const castRoll  = d20();
      const castTotal = castRoll + dexMod;
      const castMod   = castTotal < 12 ? -2 : castTotal >= 17 ? 2 : 0;
      const castDesc  = castTotal < 12 ? 'clumsy(-2)' : castTotal >= 17 ? 'perfect(+2)' : 'clean(0)';

      // Phase 2 — Catch
      const catchRoll  = d20();
      const catchTotal = catchRoll + catchMod + castMod + rodBonus;
      const sizeKey    = catchTotal <= 5 ? null : catchTotal <= 10 ? 'small' : catchTotal <= 16 ? 'medium' : catchTotal <= 19 ? 'large' : catchTotal === 20 ? 'very_large' : 'legendary';
      const sizeLabel  = { small:'Small', medium:'Medium', large:'Large', very_large:'Very Large', legendary:'Legendary' };

      // Phase 3 — Type (only if something bites)
      let typeRoll = null, typeTotal = null, rarity = null, rarityLabel = null;
      let fishEntry = null, monsterEntry = null;
      if (sizeKey) {
        typeRoll  = d20();
        typeTotal = typeRoll + typeMod + luckMod;
        rarity    = typeTotal <= 5 ? 'common' : typeTotal <= 10 ? 'rare' : typeTotal <= 15 ? 'enchanted' : typeTotal <= 18 ? 'golden' : 'legendary';
        rarityLabel = { common:'Common', rare:'Rare', enchanted:'Enchanted', golden:'Golden', legendary:'Legendary' }[rarity];
        const TIER_RANKS = { small:[1,7], medium:[4,12], large:[8,16], very_large:[12,18], legendary:[16,20] };
        const [mn, mx] = TIER_RANKS[sizeKey];
        const eligible = [...WBAPI.fishPool, ...WBAPI.nightFishPool].filter(f => f.rank >= mn && f.rank <= mx);
        if (eligible.length) {
          fishEntry = eligible[Math.floor(Math.random() * eligible.length)];
          monsterEntry = WBAPI.monsterPool[fishEntry.key] || null;
        }
      }

      const result = {
        ok: true,
        phases: {
          cast:  { roll:castRoll,  mod:dexMod,   total:castTotal, castMod, desc:castDesc },
          catch: { roll:catchRoll, mod:catchMod, castMod, rodBonus, total:catchTotal, size:sizeKey, sizeLabel: sizeKey ? sizeLabel[sizeKey] : null },
          type:  sizeKey ? { roll:typeRoll, mod:typeMod, luckMod, total:typeTotal, rarity, rarityLabel } : null,
        },
        fish: fishEntry ? { ...fishEntry, monster:monsterEntry } : null,
        summary: sizeKey
          ? `${sizeLabel[sizeKey]} ${rarityLabel} — ${fishEntry?.name || 'unknown fish'}`
          : 'Nothing bites.',
      };
      logResponse(method, url.pathname, 200, `simulate: ${result.summary}`);
      return json(res, 200, result);
    }

    if (method === 'POST' && !fishKey) {
      let body;
      try { body = await readBody(req); } catch(e) { return json(res, 400, { error:'Invalid JSON' }); }
      log('REQUEST', 'POST /api/fish (create)', body);
      const { key, name, rank } = body;
      if (!key || !name || rank === undefined) {
        logResponse(method, url.pathname, 400, 'fish create: missing required fields');
        return json(res, 400, { error:'Required fields: key, name, rank' });
      }
      const allFish = [...WBAPI.fishPool, ...WBAPI.nightFishPool];
      if (allFish.find(f => f.key === key)) {
        logResponse(method, url.pathname, 409, `fish "${key}" already exists`);
        return json(res, 409, { error:`Fish "${key}" already exists` });
      }
      const isNight = !!body.isNight;
      const entry   = serializeFishEntry(body);
      const arrName = isNight ? 'NIGHT_FISH_POOL' : 'FISH_POOL';
      const ins = insertBeforeArrayClose('FISH_DB', entry);
      if (!ins.ok) { logResponse(method, url.pathname, 500, ins.error); return json(res, 500, ins); }
      const fishObj = { rank:Number(rank), key, name, ...(body.desc ? { desc:body.desc } : {}) };
      if (isNight) WBAPI.nightFishPool.push(fishObj); else WBAPI.fishPool.push(fishObj);
      WBAPI.fishPool.sort((a,b) => a.rank - b.rank);
      log('LOGIC', `Created fish "${key}" rank ${rank} (${isNight ? 'night' : 'day'} pool, inserted into ${arrName})`);
      logResponse(method, url.pathname, 201, `created fish "${key}"`);
      return json(res, 201, { ok:true, key, note:'POST /api/save to persist.', fish:fishObj });
    }
  }

  // ── Drops (MONSTER_DROPS) ────────────────────────────────────────────────
  if (parts[0] === 'drops' && method === 'GET') {
    const sellMin  = url.searchParams.get('sell');
    const nameQ    = (url.searchParams.get('q') || '').toLowerCase();
    let list = Object.entries(WBAPI.monsterDrops).map(([key, d]) => ({ key, ...d }));
    if (sellMin !== null) list = list.filter(d => (d.sell||0) >= Number(sellMin));
    if (nameQ) list = list.filter(d => (d.name||'').toLowerCase().includes(nameQ));
    list.sort((a, b) => (b.sell||0) - (a.sell||0));
    const totalValue = list.reduce((s, d) => s + (d.sell||0), 0);
    logRow('total', `${list.length} drops  ·  total sell value: ${totalValue}gp`);
    if (sellMin||nameQ) logRow('filter', [sellMin&&`sell≥${sellMin}`, nameQ&&`q=${nameQ}`].filter(Boolean).join('  '));
    logRow('sample', sample(list.slice(0,4).map(d=>`${d.key}(${d.sell}gp)`), 4));
    logResponse(method, url.pathname, 200, `${list.length} drops`);
    return json(res, 200, { ok:true, count:list.length, drops: list });
  }

  // ── Loot table (D100_TABLE) ──────────────────────────────────────────────
  if (parts[0] === 'loot') {
    const LOOT_TYPES = ['potion_minor','potion','potion_greater','potion_superior','scroll','flashbang','dagger','mainweapon','gold'];
    const idxPart = parts[1];

    if (method === 'GET') {
      const entries = WBAPI.d100Table || [];
      const totalWeight = entries.reduce((s, e) => s + e.weight, 0);
      const gap = 100 - totalWeight;
      const annotated = lootAnnotate(entries);
      const suggestions = lootSuggestions(gap);
      const typeBreakdown = {};
      entries.forEach(e => { typeBreakdown[e._type] = (typeBreakdown[e._type]||0) + e.weight; });
      logRow('entries', entries.length);
      logRow('totalWeight', `${totalWeight}/100  ·  gap: ${gap}`);
      logRow('types', Object.entries(typeBreakdown).map(([t,w])=>`${t}:${w}`).join('  ·  '));
      if (suggestions.length) logRow('suggestions', `${suggestions.length} gap-fill suggestion${suggestions.length>1?'s':''}`);
      logResponse(method, url.pathname, 200, `loot table  ${totalWeight}/100  ${gap>0?'⚠ gap '+gap:''}`);
      return json(res, 200, { ok:true, totalWeight, gap, coverage:`${totalWeight}%`, entries:annotated, typeBreakdown, suggestions });
    }

    if (method === 'PUT') {
      let body;
      try { body = await readBody(req); } catch(e) { return json(res, 400, { error:'Invalid JSON' }); }

      // PUT /api/loot/:index — update single entry
      if (idxPart !== undefined) {
        const idx = parseInt(idxPart, 10);
        const table = WBAPI.d100Table || [];
        if (isNaN(idx) || idx < 0 || idx >= table.length) {
          logResponse(method, url.pathname, 400, `invalid index "${idxPart}"`);
          return json(res, 400, { error:`Index must be 0–${table.length - 1}` });
        }
        if (body._type && !LOOT_TYPES.includes(body._type)) {
          logResponse(method, url.pathname, 400, `unknown _type "${body._type}"`);
          return json(res, 400, { error:`_type must be one of: ${LOOT_TYPES.join(', ')}` });
        }
        Object.assign(table[idx], body);
        if (body.weight !== undefined) table[idx].weight = Number(body.weight);
        if (body._magic !== undefined) table[idx]._magic = Number(body._magic);
        const total = table.reduce((s, e) => s + e.weight, 0);
        if (total > 100) {
          logResponse(method, url.pathname, 400, `totalWeight ${total} would exceed 100`);
          return json(res, 400, { error:`After update, total weight would be ${total} — exceeds 100` });
        }
        const r = replaceSection('D100_TABLE', serializeD100Table(table));
        if (!r.ok) { logResponse(method, url.pathname, 500, r.error); return json(res, 500, r); }
        logRow('updated', `loot[${idx}]  →  ${JSON.stringify(table[idx])}`);
        logRow('totalWeight', `${total}/100`);
        logResponse(method, url.pathname, 200, `loot[${idx}] updated  ·  ${total}/100`);
        return json(res, 200, { ok:true, index:idx, entry:table[idx], totalWeight:total, note:'POST /api/save to persist.' });
      }

      // PUT /api/loot — full table replacement
      const entries = body.entries;
      if (!Array.isArray(entries)) {
        logResponse(method, url.pathname, 400, 'body.entries must be an array');
        return json(res, 400, { error:'body.entries required — array of { weight, _type, _magic? }' });
      }
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        if (!e._type || !LOOT_TYPES.includes(e._type))
          return json(res, 400, { error:`entries[${i}]._type invalid. Must be one of: ${LOOT_TYPES.join(', ')}` });
        if (typeof e.weight !== 'number' || e.weight <= 0)
          return json(res, 400, { error:`entries[${i}].weight must be a positive number` });
      }
      const totalWeight = entries.reduce((s, e) => s + e.weight, 0);
      if (totalWeight > 100) {
        logResponse(method, url.pathname, 400, `totalWeight ${totalWeight} exceeds 100`);
        return json(res, 400, { error:`Total weight ${totalWeight} exceeds 100. d100 tables must sum to ≤100.` });
      }
      const gap = 100 - totalWeight;
      WBAPI.d100Table = entries.map(e => ({ weight:Number(e.weight), _type:e._type, ...(e._magic !== undefined ? { _magic:Number(e._magic) } : {}) }));
      const r = replaceSection('D100_TABLE', serializeD100Table(WBAPI.d100Table));
      if (!r.ok) { logResponse(method, url.pathname, 500, r.error); return json(res, 500, r); }
      logRow('entries', entries.length);
      logRow('totalWeight', `${totalWeight}/100  ·  gap: ${gap}`);
      logResponse(method, url.pathname, 200, `loot table replaced  ·  ${entries.length} entries  ·  ${totalWeight}/100`);
      return json(res, 200, { ok:true, entries:lootAnnotate(WBAPI.d100Table), totalWeight, gap, suggestions:lootSuggestions(gap), note:'POST /api/save to persist.' });
    }
  }

  // ── Loot-Drop unified query ───────────────────────────────────────────────
  if (parts[0] === 'loot-drop' && method === 'GET') {
    const terrainQ = url.searchParams.get('terrain');
    const monsterQ = url.searchParams.get('monster');
    const fishingQ = url.searchParams.get('fishing');   // 'true' = fishing only
    const bonusQ   = url.searchParams.get('bonus');     // numeric string, e.g. '-2' or '1'
    const nameQ    = (url.searchParams.get('name') || '').toLowerCase();
    const bonusN   = bonusQ !== null ? Number(bonusQ) : null;

    const QUALITY_TABLE = [
      { roll:'1',   bonus:-4, prefix:'Wrecked', probability:'1-in-6 (16.7%)' },
      { roll:'2',   bonus:-3, prefix:'Rusted',  probability:'1-in-6 (16.7%)' },
      { roll:'3',   bonus:-2, prefix:'Chipped', probability:'1-in-6 (16.7%)' },
      { roll:'4',   bonus:-1, prefix:'Worn',    probability:'1-in-6 (16.7%)' },
      { roll:'5–6', bonus:0,  prefix:'(base)',  probability:'2-in-6 (33.3%)' },
    ];

    const showMonsters = fishingQ !== 'true';
    const showFishing  = fishingQ !== 'false';
    const results = [];

    if (showMonsters) {
      let monsterKeys;
      if (terrainQ)       monsterKeys = WBAPI._terrainToMonsters[terrainQ] || [];
      else if (monsterQ)  monsterKeys = [monsterQ];
      else                monsterKeys = Object.keys(WBAPI.monsterDrops);

      for (const key of monsterKeys) {
        const monster = WBAPI.monsterPool[key];
        const rawDrop = WBAPI.monsterDrops[key];
        if (!rawDrop && !monster) continue;
        // bonus filter for monster entries: only applies to negative/zero
        if (bonusN !== null && bonusN > 0) continue;
        // name filter
        const monName   = monster ? monster.name : key;
        const dropNames = Array.isArray(rawDrop) ? rawDrop.map(d => d.name).join(' ') : (rawDrop ? rawDrop.name : '');
        if (nameQ && !monName.toLowerCase().includes(nameQ) && !dropNames.toLowerCase().includes(nameQ)) continue;
        results.push({
          source:      'monster',
          monsterKey:  key,
          monsterName: monName,
          terrains:    WBAPI._monsterToTerrains[key] || [],
          dmgDie:      monster ? (monster.dmgDie || 4) : null,
          trophy:      rawDrop || null,
          weaponDrop:  {
            rule:         'Base weapon ≤ monster dmgDie, quality 1d6: 1→-4(Wrecked), 2→-3(Rusted), 3→-2(Chipped), 4→-1(Worn), 5-6→0(base)',
            qualityTable: bonusN !== null
              ? QUALITY_TABLE.filter(q => q.bonus === bonusN)
              : QUALITY_TABLE,
          },
        });
      }
    }

    if (showFishing) {
      // Lake magic items
      for (const [key, item] of Object.entries(WBAPI.lakeMagicDb)) {
        if (bonusN !== null && bonusN <= 0) continue; // positive bonus = fishing
        if (bonusN !== null && item.base !== bonusN) continue;
        if (nameQ && !(item.name || '').toLowerCase().includes(nameQ)) continue;
        results.push({
          source:     'fishing',
          subtype:    'lake_magic',
          key,
          name:       item.name,
          icon:       item.icon,
          effect:     item.effect,
          base:       item.base,
          levelScale: item.levelScale,
          luckScale:  item.luckScale,
          minRank:    item.minRank,
          minLevel:   item.minLevel,
          desc:       item.desc,
          bonusFormula: `${item.base}${item.levelScale ? ' + floor(level×'+item.levelScale+')' : ''}${item.luckScale ? ' + floor(luck×'+item.luckScale+')' : ''}`,
          fishing:    true,
        });
      }
      // Fish trophies (only when no terrain/monster filter)
      if (!terrainQ && !monsterQ && bonusN === null) {
        const allFish = [...WBAPI.fishPool, ...WBAPI.nightFishPool];
        for (const fish of allFish) {
          const drop = WBAPI.monsterDrops[fish.key];
          if (!drop) continue;
          const isNight = WBAPI.nightFishPool.some(f => f.key === fish.key);
          if (nameQ && !(fish.name||'').toLowerCase().includes(nameQ) && !(drop.name||'').toLowerCase().includes(nameQ)) continue;
          results.push({
            source:   'fishing',
            subtype:  'fish_trophy',
            key:      fish.key,
            name:     fish.name,
            fishRank: fish.rank,
            isNight,
            trophy:   drop,
            fishing:  true,
          });
        }
      }
    }

    const filterDesc = [
      terrainQ  && `terrain=${terrainQ}`,
      monsterQ  && `monster=${monsterQ}`,
      fishingQ  && `fishing=${fishingQ}`,
      bonusQ    && `bonus=${bonusQ}`,
      nameQ     && `name=${nameQ}`,
    ].filter(Boolean).join('  ');
    if (filterDesc) logRow('filters', filterDesc);
    logRow('results', results.length);
    logResponse(method, url.pathname, 200, `${results.length} loot-drop entries`);
    return json(res, 200, {
      ok: true, count: results.length, drops: results,
      _meta: {
        qualityTable:  QUALITY_TABLE,
        sources:       ['monster','fishing'],
        queryParams:   ['terrain','monster','fishing=true|false','bonus=<n>','name=<q>'],
        note:          'd100 consumable table at GET /api/loot  ·  magic weapons are fishing-only',
      },
    });
  }

  // ── Items (ITEM_DB) ──────────────────────────────────────────────────────
  if (parts[0] === 'item') {
    const itemKey = parts[1];

    if (method === 'GET') {
      if (!itemKey) {
        const typeFilter = url.searchParams.get('type');
        let list = Object.values(WBAPI.itemDb);
        if (typeFilter) list = list.filter(i => i.type === typeFilter);
        logRow('total', `${list.length} items${typeFilter ? `  ·  type=${typeFilter}` : ''}`);
        logRow('sample', sample(list.map(i => i.key || i.name), 5));
        logResponse(method, url.pathname, 200, `${list.length} items`);
        return json(res, 200, { ok:true, count:list.length, items: list });
      }
      const item = WBAPI.itemDb[itemKey];
      if (!item) {
        logResponse(method, url.pathname, 404, `item "${itemKey}" not found`);
        return json(res, 404, { error:`item "${itemKey}" not found` });
      }
      logRow('item', `${item.icon||''}  ${item.name}  ·  type: ${item.type||'—'}`);
      logResponse(method, url.pathname, 200, `item/${itemKey}`);
      return json(res, 200, { ok:true, item, _meta:{ canDelete: true } });
    }

    if (method === 'POST' && !itemKey) {
      let body;
      try { body = await readBody(req); } catch(e) { return json(res, 400, { error:'Invalid JSON' }); }
      const { key, name, type } = body;
      if (!key || !name || !type) {
        logResponse(method, url.pathname, 400, 'item create: missing required fields');
        return json(res, 400, { error:'Required fields: key, name, type. Optional: icon, sell, desc, atkBonus, dmgDie, dmgCount, dmgFlat, minLevel, passive, readText, uses' });
      }
      if (!/^[a-z_][a-z0-9_]*$/.test(key)) {
        logResponse(method, url.pathname, 400, `item key "${key}" invalid`);
        return json(res, 400, { error:'key must be snake_case (a-z, 0-9, underscore, no leading digit)' });
      }
      if (WBAPI.itemDb[key]) {
        logResponse(method, url.pathname, 409, `item "${key}" already exists`);
        return json(res, 409, { error:`Item "${key}" already exists` });
      }
      const VALID_TYPES = ['weapon','amulet','consumable','readable','armor','tool','mission_bit','lake_magic'];
      if (!VALID_TYPES.includes(type)) {
        logResponse(method, url.pathname, 400, `unknown item type "${type}"`);
        return json(res, 400, { error:`type must be one of: ${VALID_TYPES.join(', ')}` });
      }
      const defaults = { sell: 0 };
      const itemObj = { key, ...defaults, ...body };
      const entry = serializeItemLiteral(key, itemObj);
      const ins = insertBeforeSectionClose('ITEM_DB', entry);
      if (!ins.ok) { logResponse(method, url.pathname, 500, ins.error); return json(res, 500, ins); }
      WBAPI.itemDb[key] = itemObj;
      logRow('key', key);
      logRow('item', `${body.icon||''}  ${name}  ·  type: ${type}${body.sell !== undefined ? `  ·  sell: ${body.sell}gp` : ''}`);
      logResponse(method, url.pathname, 201, `created item/${key}`);
      return json(res, 201, { ok:true, key, note:'POST /api/save to persist.', item: WBAPI.itemDb[key] });
    }

    if (method === 'PUT' && itemKey) {
      let body;
      try { body = await readBody(req); } catch(e) { return json(res, 400, { error:'Invalid JSON' }); }
      if (!WBAPI.itemDb[itemKey]) {
        logResponse(method, url.pathname, 404, `item "${itemKey}" not found`);
        return json(res, 404, { error:`Item "${itemKey}" not found` });
      }
      Object.assign(WBAPI.itemDb[itemKey], body);
      logRow('updated', `item › ${itemKey}`);
      logResponse(method, url.pathname, 200, `item/${itemKey} updated`);
      return json(res, 200, { ok:true, item: WBAPI.itemDb[itemKey], note:'PUT only updates in-memory. POST /api/save to persist.' });
    }
  }

  // ── Lake Magic Items (LAKE_MAGIC) ─────────────────────────────────────────
  if (parts[0] === 'lake-magic') {
    const magKey = parts[1];

    if (method === 'GET') {
      if (!magKey) {
        const effectFilter = url.searchParams.get('effect');
        const rankFilter   = url.searchParams.get('minRank');
        let list = Object.values(WBAPI.lakeMagicDb);
        if (effectFilter) list = list.filter(m => m.effect === effectFilter);
        if (rankFilter !== null) list = list.filter(m => (m.minRank || 0) <= Number(rankFilter));
        list.sort((a,b) => (a.minRank||0) - (b.minRank||0));
        const effects = [...new Set(list.map(m=>m.effect))].join(' · ');
        logRow('total', `${list.length} lake magic items`);
        logRow('effects', effects || '(none)');
        logRow('sample', sample(list.map(m=>m.key), 4));
        logResponse(method, url.pathname, 200, `${list.length} lake magic items`);
        return json(res, 200, { ok:true, count:list.length, items: list });
      }
      const item = WBAPI.lakeMagicDb[magKey];
      if (!item) {
        logResponse(method, url.pathname, 404, `lake-magic "${magKey}" not found`);
        return json(res, 404, { error:`lake-magic "${magKey}" not found` });
      }
      logRow('item', `${item.name}  ·  effect: ${item.effect}  ·  minRank: ${item.minRank||0}`);
      logResponse(method, url.pathname, 200, `lake-magic/${magKey}`);
      return json(res, 200, { ok:true, item, _meta:{ canDelete: true } });
    }

    if (method === 'POST' && !magKey) {
      let body;
      try { body = await readBody(req); } catch(e) { return json(res, 400, { error:'Invalid JSON' }); }
      log('REQUEST', 'POST /api/lake-magic (create)', body);
      const { key, name, effect } = body;
      if (!key || !name || !effect) {
        logResponse(method, url.pathname, 400, 'lake-magic create: missing required fields');
        return json(res, 400, { error:'Required fields: key, name, effect' });
      }
      if (WBAPI.lakeMagicDb[key]) {
        logResponse(method, url.pathname, 409, `lake-magic "${key}" already exists`);
        return json(res, 409, { error:`Lake magic "${key}" already exists` });
      }
      const entry = serializeLakeMagicEntry(key, { type:'lake_magic', sell:0, base:0, levelScale:0, luckScale:0, minRank:1, minLevel:1, ...body });
      const ins = insertBeforeSectionClose('LAKE_MAGIC', entry);
      if (!ins.ok) { logResponse(method, url.pathname, 500, ins.error); return json(res, 500, ins); }
      WBAPI.lakeMagicDb[key] = { key, type:'lake_magic', sell:0, base:0, levelScale:0, luckScale:0, minRank:1, minLevel:1, ...body };
      logResponse(method, url.pathname, 201, `created lake-magic "${key}"`);
      return json(res, 201, { ok:true, key, note:'POST /api/save to persist.', item: WBAPI.lakeMagicDb[key] });
    }
  }

  // ── Audit: Map conformity (spatial + graph) ──────────────────────────────
  // ── POST /api/audit/map/fix — apply diagonal + one-way fixes ────────────────
  if (parts[0] === 'audit' && parts[1] === 'map' && parts[2] === 'fix' && method === 'POST') {
    let body = {};
    try { body = await readBody(req); } catch(_) {}

    const OPP2  = { N:'S', S:'N', E:'W', W:'E' };
    const DIAG2 = ['NW','NE','SW','SE'];
    const DIRS2 = ['N','S','E','W'];
    const nm    = WBAPI.nodeMap;
    const fixed = [];
    const errs  = [];

    // helper: remove a diagonal exit from _rawSrc (nodes are single-line entries)
    function stripDiag(code, dir) {
      const S = '// ◆◆◆ WORLDBUILDER:NODE_MAP:START ◆◆◆';
      const E = '// ◆◆◆ WORLDBUILDER:NODE_MAP:END ◆◆◆';
      const a = WBAPI._rawSrc.indexOf(S) + S.length;
      const e = WBAPI._rawSrc.indexOf(E);
      if (a < S.length || e < 0) return false;
      const sec  = WBAPI._rawSrc.slice(a, e);
      const lineRe = new RegExp(`^([ \\t]*${code}\\s*:\\s*\\{[^\\n]+)$`, 'm');
      const m = lineRe.exec(sec);
      if (!m) return false;
      const before = m[1];
      const after  = before
        .replace(new RegExp(`,\\s*${dir}\\s*:\\s*'[^']*'`), '')
        .replace(new RegExp(`\\b${dir}\\s*:\\s*'[^']*',?\\s*`), '');
      if (after === before) return false;
      WBAPI._rawSrc = WBAPI._rawSrc.slice(0, a) + sec.replace(before, after) + WBAPI._rawSrc.slice(e);
      delete nm[code][dir];
      return true;
    }

    // which issues to fix
    const specific = body.check && body.code;

    if (!specific || body.check === 'diagonal_exit') {
      const targets = specific
        ? [{ code: body.code, dir: body.dir }]
        : Object.entries(nm).flatMap(([code, n]) =>
            DIAG2.filter(d => n[d] != null).map(d => ({ code, dir:d })));
      for (const { code, dir } of targets) {
        if (nm[code]?.[dir] == null) continue;
        if (stripDiag(code, dir)) fixed.push({ check:'diagonal_exit', code, dir });
        else errs.push({ check:'diagonal_exit', code, dir, error:'source patch failed' });
      }
    }

    if (!specific || body.check === 'bidirectional') {
      const targets = specific
        ? [{ code: body.code, dir: body.dir, target: body.target }]
        : Object.entries(nm).flatMap(([code, n]) =>
            DIRS2.filter(d => n[d] && nm[n[d]] && nm[n[d]][OPP2[d]] !== code)
                 .map(d => ({ code, dir:d, target:n[d] })));
      for (const { code, dir, target } of targets) {
        if (!nm[target]) { errs.push({ check:'bidirectional', code, dir, target, error:'target not in NODE_MAP' }); continue; }
        if (nm[target][OPP2[dir]] === code) continue; // already fixed by a previous iteration
        const r = WBAPI.editField('node', target, OPP2[dir], code);
        if (r.ok) fixed.push({ check:'bidirectional', code, dir, target, set:`${target}.${OPP2[dir]}="${code}"` });
        else errs.push({ check:'bidirectional', code, dir, target, error: r.error });
      }
    }

    if (fixed.length) {
      const stamp = WBAPI.getStampedName();
      const sv    = WBAPI.save(stamp);
      if (!sv.ok) {
        logResponse(method, url.pathname, 500, `fix ok but save failed: ${sv.error}`);
        return json(res, 500, { ok:false, error:`fixes applied but save failed: ${sv.error}`, fixed });
      }
      fs.copyFileSync(sv.path, GAME_FILE);
      await WBAPI.load(GAME_FILE);
      logRow('fixed', fixed.length);
      logRow('saved', stamp);
    }
    logResponse(method, url.pathname, 200, `${fixed.length} fixed  ·  ${errs.length} failed`);
    return json(res, 200, { ok:true, fixed, errors:errs, saved: fixed.length > 0,
      note: fixed.length ? 'Changes saved and reloaded.' : 'Nothing to fix.' });
  }

  if (parts[0] === 'audit' && parts[1] === 'map' && method === 'GET') {
    const OPP   = { N:'S', S:'N', E:'W', W:'E' };
    const DIRS  = ['N','S','E','W'];
    // directional sign: moving in dir D from a node should change coords by (dr, dc)
    const DIR_DELTA = { N:[-1,0], S:[1,0], E:[0,1], W:[0,-1] };
    const DENSITY_THRESH = { road:3, market:8, _default:6 };
    const LONG_LINK_THRESHOLD = 4; // grid cells
    const DENSITY_RADIUS = 3;      // grid cells (Euclidean)

    const coords    = WBAPI.nodeCoords; // {code:{r,c}}
    const nodeMap   = WBAPI.nodeMap;
    const worldDb   = WBAPI.worldDb;

    function dist(a, b) {
      const dr = a.r - b.r, dc = a.c - b.c;
      return Math.sqrt(dr*dr + dc*dc);
    }

    // Terrain category helper
    function terrainCat(code) {
      const terrKey = nodeMap[code]?.name || '';
      const t = worldDb[terrKey];
      if (!t) return '_default';
      const label = (t.label||terrKey).toLowerCase();
      if (label.includes('road') || label.includes('highway') || label.includes('path')) return 'road';
      if (label.includes('market') || label.includes('shop') || label.includes('vendor') || label.includes('bazaar')) return 'market';
      return '_default';
    }

    const errors   = [];
    const warnings = [];
    const suggestions = [];

    const nodeCodesWithCoords = Object.keys(coords).filter(c => nodeMap[c]);
    const allNodeCodes = Object.keys(nodeMap);

    // ── 0. Diagonal exits (NW/NE/SW/SE must be null) ─────────────────────────
    const DIAG_DIRS = ['NW','NE','SW','SE'];
    for (const code of allNodeCodes) {
      const n = nodeMap[code];
      for (const d of DIAG_DIRS) {
        if (n[d] != null)
          errors.push({ check:'diagonal_exit', code, dir:d, target:String(n[d]),
            msg:`${code}.${d}="${n[d]}" — diagonal exits are not supported; use N/S/E/W only`,
            fix:{ method:'POST', url:`/api/audit/map/fix`, body:{ check:'diagonal_exit', code, dir:d },
                  curl:`curl -XPOST http://localhost:${PORT}/api/audit/map/fix -H 'Content-Type: application/json' -d '{"check":"diagonal_exit","code":"${code}","dir":"${d}"}'` } });
      }
    }

    // ── 1. Max-4-connections: no node in more than one direction slot ─────────
    for (const code of allNodeCodes) {
      const n = nodeMap[code];
      const targets = DIRS.map(d => n[d]).filter(Boolean);
      const seen = new Set();
      for (const t of targets) {
        if (seen.has(t))
          errors.push({ check:'max_connections', code, msg:`"${t}" appears in multiple direction slots — duplicate connection` });
        seen.add(t);
      }
      if (targets.length > 4)
        errors.push({ check:'max_connections', code, msg:`${targets.length} connections (max is 4: N/S/E/W)` });
    }

    // ── 2. Bidirectional consistency ─────────────────────────────────────────
    for (const code of allNodeCodes) {
      const n = nodeMap[code];
      for (const dir of DIRS) {
        const target = n[dir];
        if (!target) continue;
        if (!nodeMap[target]) {
          errors.push({ check:'dangling_link', code, dir, target, msg:`${code}.${dir}="${target}" but "${target}" not in NODE_MAP` });
          continue;
        }
        const back = nodeMap[target][OPP[dir]];
        if (back !== code)
          warnings.push({ check:'bidirectional', code, dir, target,
            msg:`${code}.${dir}="${target}" but ${target}.${OPP[dir]}="${back||'(null)'}" — link is one-way`,
            fix:{ method:'POST', url:`/api/audit/map/fix`, body:{ check:'bidirectional', code, dir, target },
                  curl:`curl -XPOST http://localhost:${PORT}/api/audit/map/fix -H 'Content-Type: application/json' -d '{"check":"bidirectional","code":"${code}","dir":"${dir}","target":"${target}"}'` } });
      }
    }

    // ── 3. Direction consistency (N=lower r, S=higher r, E=higher c, W=lower c) ──
    for (const code of nodeCodesWithCoords) {
      const n  = nodeMap[code];
      const ca = coords[code];
      for (const dir of DIRS) {
        const target = n[dir];
        if (!target || !coords[target]) continue;
        const cb = coords[target];
        const [dr, dc] = DIR_DELTA[dir]; // expected sign
        const actualDr = cb.r - ca.r;
        const actualDc = cb.c - ca.c;
        // Check sign: if dr≠0, actualDr should be same sign; if dc≠0, actualDc same sign
        const signOk = dr !== 0
          ? (dr > 0 ? actualDr >= 0 : actualDr <= 0)
          : (dc > 0 ? actualDc >= 0 : actualDc <= 0);
        if (!signOk)
          warnings.push({ check:'direction_sign', code, dir, target,
            msg:`${code}(r=${ca.r},c=${ca.c}).${dir}="${target}"(r=${cb.r},c=${cb.c}) — ${dir} should move ${dr<0||dc<0?'lower':'higher'} ${dr!==0?'r':'c'} but moves opposite` });
      }
    }

    // ── 4. Long-link detection (distance > LONG_LINK_THRESHOLD) + between suggestion ──
    const longLinkSeen = new Set();
    for (const code of nodeCodesWithCoords) {
      const n  = nodeMap[code];
      const ca = coords[code];
      for (const dir of DIRS) {
        const target = n[dir];
        if (!target || !coords[target]) continue;
        const pairKey = [code, target].sort().join(':');
        if (longLinkSeen.has(pairKey)) continue;
        longLinkSeen.add(pairKey);
        const cb = coords[target];
        const d  = dist(ca, cb);
        if (d > LONG_LINK_THRESHOLD) {
          // Build ranked between-placement candidates for an intermediate junction
          const occupied = new Map();
          for (const [c, p] of Object.entries(coords)) occupied.set(`${p.r},${p.c}`, c);
          const snap = v => Math.round(v / 4) * 4;
          const mr = snap((ca.r + cb.r) / 2), mc = snap((ca.c + cb.c) / 2);
          const candidates = [];
          const cSeen = new Set();
          function tryC(r, c, reason) {
            r = snap(r); c = snap(c);
            const k = `${r},${c}`;
            if (cSeen.has(k)) return; cSeen.add(k);
            const occ = occupied.get(k) || null;
            candidates.push({ r, c, reason, free: !occ, occupiedBy: occ,
              moveCmd: `curl -s -XPOST http://localhost:${PORT}/api/node -H 'Content-Type: application/json' -d '{"code":"J??","name":"junction","label":"Junction"}'` +
                       ` && curl -s -XPUT http://localhost:${PORT}/api/coords/J?? -H 'Content-Type: application/json' -d '{"r":${r},"c":${c}}'` });
          }
          tryC(mr, mc,   'midpoint between source and destination');
          tryC(ca.r, mc, 'source row, mid-column');
          tryC(mr, ca.c, 'source column, mid-row');
          tryC(cb.r, mc, 'destination row, mid-column');
          tryC(mr, cb.c, 'destination column, mid-row');
          tryC(ca.r, cb.c,'source row, destination column');
          tryC(cb.r, ca.c,'destination row, source column');
          const best = candidates.find(c => c.free) || candidates[0];
          suggestions.push({ check:'long_link', code, dir, target,
            distance: Math.round(d * 10) / 10,
            msg:`${code}↔${target} distance ${Math.round(d*10)/10} cells (threshold ${LONG_LINK_THRESHOLD}) — insert intermediate node between them`,
            suggestedCoords: best,
            moveSuggestion: { node:'(new junction)', note:`Place a junction between "${code}" and "${target}"`, recommended: best, candidates } });
        }
      }
    }

    // ── 5. Density check (radius 3) ───────────────────────────────────────────
    for (const code of nodeCodesWithCoords) {
      const ca  = coords[code];
      const cat = terrainCat(code);
      const threshold = DENSITY_THRESH[cat] || DENSITY_THRESH._default;
      let count = 0;
      const neighbours = [];
      for (const other of nodeCodesWithCoords) {
        if (other === code) continue;
        if (dist(ca, coords[other]) <= DENSITY_RADIUS) { count++; neighbours.push(other); }
      }
      if (count > threshold)
        warnings.push({ check:'density', code, terrain: nodeMap[code]?.name||'—', category:cat,
          neighbours: count, threshold,
          msg:`${code} has ${count} neighbours within radius ${DENSITY_RADIUS} (${cat} threshold ${threshold}) — cluster too dense` });
    }

    // ── 6. Shop/vendor proximity (market terrain should be within 1 grid cell of another market) ──
    const marketNodes = nodeCodesWithCoords.filter(c => terrainCat(c) === 'market');
    for (const code of marketNodes) {
      const ca = coords[code];
      const nearby = marketNodes.filter(c => c !== code && dist(ca, coords[c]) <= 1);
      if (nearby.length === 0)
        suggestions.push({ check:'market_proximity', code,
          msg:`${code} is a market/shop node but has no other market node within 1 grid cell — vendors should cluster` });
    }

    // ── 7. Nodes with no coords — suggest placement between known neighbors ──────
    for (const code of allNodeCodes) {
      if (coords[code]) continue;
      const n = nodeMap[code] || {};
      // Find the first neighbor that does have coords, use it as the anchor
      const knownNeighbors = DIRS.map(d => ({ dir:d, nb:n[d] }))
        .filter(x => x.nb && coords[x.nb]);
      const occupied = new Map();
      for (const [c, p] of Object.entries(coords)) occupied.set(`${p.r},${p.c}`, c);
      const snap = v => Math.round(v / 4) * 4;
      let moveSuggestion = null;
      if (knownNeighbors.length >= 2) {
        // Two known neighbors — place between them
        const ca = coords[knownNeighbors[0].nb], cb = coords[knownNeighbors[1].nb];
        const mr = snap((ca.r + cb.r) / 2), mc = snap((ca.c + cb.c) / 2);
        const cSeen = new Set(); const candidates = [];
        function tryN(r, c, reason) {
          r = snap(r); c = snap(c); const k = `${r},${c}`;
          if (cSeen.has(k)) return; cSeen.add(k);
          const occ = occupied.get(k) || null;
          candidates.push({ r, c, reason, free: !occ, occupiedBy: occ,
            moveCmd: `curl -s -XPUT http://localhost:${PORT}/api/coords/${code} -H 'Content-Type: application/json' -d '{"r":${r},"c":${c}}'` });
        }
        tryN(mr, mc,   'midpoint between neighbors');
        tryN(ca.r, mc, `neighbor "${knownNeighbors[0].nb}" row, mid-column`);
        tryN(mr, ca.c, `neighbor "${knownNeighbors[0].nb}" column, mid-row`);
        tryN(cb.r, mc, `neighbor "${knownNeighbors[1].nb}" row, mid-column`);
        tryN(mr, cb.c, `neighbor "${knownNeighbors[1].nb}" column, mid-row`);
        tryN(ca.r, cb.c, `neighbor "${knownNeighbors[0].nb}" row, neighbor "${knownNeighbors[1].nb}" column`);
        tryN(cb.r, ca.c, `neighbor "${knownNeighbors[1].nb}" row, neighbor "${knownNeighbors[0].nb}" column`);
        const best = candidates.find(c => c.free) || candidates[0];
        moveSuggestion = { note:`Place "${code}" between its known neighbors`, recommended: best, candidates };
      } else if (knownNeighbors.length === 1) {
        // One known neighbor — project in the connection direction
        const { dir, nb } = knownNeighbors[0];
        const ca = coords[nb];
        const DR = { N:-4, S:4, E:0, W:0 }, DC = { N:0, S:0, E:4, W:-4 };
        const pr = { r: ca.r + DR[dir]*3, c: ca.c + DC[dir]*3 }; // 3 steps out
        const cSeen = new Set(); const candidates = [];
        function tryN2(r, c, reason) {
          r = snap(r); c = snap(c); const k = `${r},${c}`;
          if (cSeen.has(k)) return; cSeen.add(k);
          const occ = occupied.get(k) || null;
          candidates.push({ r, c, reason, free: !occ, occupiedBy: occ,
            moveCmd: `curl -s -XPUT http://localhost:${PORT}/api/coords/${code} -H 'Content-Type: application/json' -d '{"r":${r},"c":${c}}'` });
        }
        const mr = snap((ca.r + pr.r) / 2), mc = snap((ca.c + pr.c) / 2);
        tryN2(pr.r, pr.c,  `3 steps ${dir} from neighbor "${nb}"`);
        tryN2(mr, mc,      `midpoint 1.5 steps ${dir} from "${nb}"`);
        tryN2(ca.r + DR[dir]*2, ca.c + DC[dir]*2, `2 steps ${dir} from "${nb}"`);
        tryN2(ca.r, mc,    `neighbor row, projected mid-column`);
        tryN2(mr, ca.c,    `neighbor column, projected mid-row`);
        const best = candidates.find(c => c.free) || candidates[0];
        moveSuggestion = { note:`Place "${code}" along the ${dir} axis from "${nb}"`, recommended: best, candidates };
      }
      suggestions.push({ check:'missing_coords', code,
        msg:`"${code}" has no entry in NODE_COORDS — won't appear on map canvas`,
        moveSuggestion });
    }

    // ── 8. Alignment: connected pair not on same row or column (diagonal) ──────
    const alignSeen = new Set();
    for (const code of nodeCodesWithCoords) {
      const n  = nodeMap[code];
      const ca = coords[code];
      for (const dir of DIRS) {
        const target = n[dir];
        if (!target || !coords[target]) continue;
        const pairKey = [code, target].sort().join(':');
        if (alignSeen.has(pairKey)) continue;
        alignSeen.add(pairKey);
        const cb = coords[target];
        if (ca.r === cb.r || ca.c === cb.c) continue; // aligned — fine
        // Diagonal: N/S edge means they should share column; E/W edge means they should share row
        const isNS = dir === 'N' || dir === 'S';
        const diagAxis    = isNS ? 'c' : 'r';
        const diagSrcVal  = isNS ? ca.c : ca.r;
        const diagTgtVal  = isNS ? cb.c : cb.r;
        const diagDesc    = `${code} ${diagAxis}=${diagSrcVal}, ${target} ${diagAxis}=${diagTgtVal}`;
        // Suggested fix: move target so it shares the correct axis with source
        const fixCoords   = isNS ? { r: cb.r, c: ca.c } : { r: ca.r, c: cb.c };
        const fixText     = `Move ${target} to (${fixCoords.r},${fixCoords.c})`;
        warnings.push({ check:'alignment', code, dir, target,
          diagDesc, fixCoords, fixText,
          msg:`Diagonal (${diagDesc})`,
          suggestedFix: fixText,
          fix:{ method:'PUT', url:`/api/node/${target}`,
                body:{ r: fixCoords.r, c: fixCoords.c },
                curl:`curl -XPUT http://localhost:${PORT}/api/node/${target} -H 'Content-Type: application/json' -d '{"r":${fixCoords.r},"c":${fixCoords.c}}'` } });
      }
    }

    // ── 9. Axis distance: aligned pair > 4 cells apart ───────────────────────
    const axisSeen = new Set();
    for (const code of nodeCodesWithCoords) {
      const n  = nodeMap[code];
      const ca = coords[code];
      for (const dir of DIRS) {
        const target = n[dir];
        if (!target || !coords[target]) continue;
        const pairKey = [code, target].sort().join(':');
        if (axisSeen.has(pairKey)) continue;
        axisSeen.add(pairKey);
        const cb = coords[target];
        if (ca.r !== cb.r && ca.c !== cb.c) continue; // diagonal handled above
        const axisD = ca.r === cb.r ? Math.abs(ca.c - cb.c) : Math.abs(ca.r - cb.r);
        if (axisD <= 4) continue;
        // Compute intermediate junction positions spaced ≤4 cells apart
        const junctionsNeeded = Math.ceil(axisD / 4) - 1;
        const midpoints = [];
        for (let i = 1; i <= junctionsNeeded; i++) {
          const t = i / (junctionsNeeded + 1);
          midpoints.push({
            r: Math.round(ca.r + (cb.r - ca.r) * t),
            c: Math.round(ca.c + (cb.c - ca.c) * t),
          });
        }
        let fixText;
        if (axisD > 24) {
          fixText = `Gap=${axisD} — dense collision region, needs manual rearrangement`;
        } else if (junctionsNeeded === 1) {
          fixText = `Insert 1 junction at (${midpoints[0].r},${midpoints[0].c})`;
        } else {
          fixText = `Insert ${junctionsNeeded} junctions at ${midpoints.map(p=>`(${p.r},${p.c})`).join(', ')}`;
        }
        warnings.push({ check:'axis_distance', code, dir, target, distance: axisD,
          junctionsNeeded, midpoints, fixText,
          msg:`Gap=${axisD}`,
          suggestedFix: fixText,
          fix:{ method:'POST', url:`/api/node`,
                note:`Create junction node at each: ${midpoints.map(p=>`r=${p.r},c=${p.c}`).join(' | ')}`,
                curl: midpoints.map(p =>
                  `curl -XPOST http://localhost:${PORT}/api/node -H 'Content-Type: application/json' -d '{"code":"J??","name":"junction","label":"Junction","r":${p.r},"c":${p.c}}'`
                ).join('\n') } });
      }
    }

    // ── 10. Corner-node consistency ───────────────────────────────────────────
    // A node with both N/S and E/W connections is a corner/T/cross node.
    // Its coords must sit at the intersection of its two connection axes:
    //   • The N or S neighbour must share the same column as this node.
    //   • The E or W neighbour must share the same row as this node.
    // If either fails, report the misalignment and suggest the correct position.
    for (const code of nodeCodesWithCoords) {
      const n  = nodeMap[code];
      const ca = coords[code];
      const nsDir = ['N','S'].find(d => n[d] && coords[n[d]]);
      const ewDir = ['E','W'].find(d => n[d] && coords[n[d]]);
      if (!nsDir || !ewDir) continue; // not a corner/T node
      const nsTarget = n[nsDir], ewTarget = n[ewDir];
      const cns = coords[nsTarget], cew = coords[ewTarget];
      const nsColOk = cns.c === ca.c;
      const ewRowOk = cew.r === ca.r;
      if (nsColOk && ewRowOk) continue;
      // Compute what this node's correct position should be
      // Correct r = E/W neighbour's row; correct c = N/S neighbour's column
      const correctR = ewRowOk ? ca.r : cew.r;
      const correctC = nsColOk ? ca.c : cns.c;
      const problems = [];
      if (!nsColOk) problems.push(`${nsDir}-neighbour ${nsTarget} at c=${cns.c} ≠ ${code} c=${ca.c} — column mismatch`);
      if (!ewRowOk) problems.push(`${ewDir}-neighbour ${ewTarget} at r=${cew.r} ≠ ${code} r=${ca.r} — row mismatch`);
      warnings.push({ check:'corner_misalign', code,
        nsDir, nsTarget, ewDir, ewTarget,
        currentCoords: { r: ca.r, c: ca.c },
        correctCoords: { r: correctR, c: correctC },
        problems,
        msg:`Corner-node ${code}(${ca.r},${ca.c}): must sit at intersection of ${nsTarget}-column(${cns.c}) × ${ewTarget}-row(${cew.r}) = (${correctR},${correctC})`,
        suggestedFix: `Move ${code} to (${correctR},${correctC})`,
        fix:{ method:'PUT', url:`/api/node/${code}`,
              body:{ r: correctR, c: correctC },
              curl:`curl -XPUT http://localhost:${PORT}/api/node/${code} -H 'Content-Type: application/json' -d '{"r":${correctR},"c":${correctC}}'` } });
    }

    // ── Blocked-edges table ───────────────────────────────────────────────────
    // Collect all edge-level problems into a single ordered list for the table.
    const blockedEdges = [];
    const edgeSeen = new Set();
    for (const w of warnings) {
      if (!['alignment','axis_distance','corner_misalign'].includes(w.check)) continue;
      if (!w.code || !w.dir || !w.target) continue;
      const edgeKey = `${w.code}-${w.dir}→${w.target}`;
      if (edgeSeen.has(edgeKey)) continue;
      edgeSeen.add(edgeKey);
      blockedEdges.push({
        edge:    edgeKey,
        problem: w.msg,
        fix:     w.suggestedFix || '—',
        check:   w.check,
      });
    }

    const summary = { errors: errors.length, warnings: warnings.length, suggestions: suggestions.length,
      nodesChecked: nodeCodesWithCoords.length, totalNodes: allNodeCodes.length,
      blockedEdges: blockedEdges.length };

    // ── verbose audit log ────────────────────────────────────────────────────
    logRow('nodes checked', `${nodeCodesWithCoords.length}/${allNodeCodes.length} have coords`);
    // tally by check type
    const errTally = {}, warnTally = {}, suggTally = {};
    for (const e of errors)   errTally[e.check]  = (errTally[e.check]  || 0) + 1;
    for (const w of warnings) warnTally[w.check] = (warnTally[w.check] || 0) + 1;
    for (const s of suggestions) suggTally[s.check] = (suggTally[s.check] || 0) + 1;
    logRow('errors',      errors.length   ? Object.entries(errTally).map(([k,v])=>`${k}:${v}`).join('  ') : 'none');
    logRow('warnings',    warnings.length ? Object.entries(warnTally).map(([k,v])=>`${k}:${v}`).join('  ') : 'none');
    logRow('suggestions', suggestions.length ? Object.entries(suggTally).map(([k,v])=>`${k}:${v}`).join('  ') : 'none');
    // per-item detail
    for (const e of errors)
      log('AUDIT✗', `${e.check.padEnd(16)} ${(e.code||'').padEnd(10)} ${e.dir?e.dir+' ':''} ${e.target||''}`);
    for (const w of warnings)
      log('AUDIT⚠', `${w.check.padEnd(16)} ${(w.code||'').padEnd(10)} ${w.dir?w.dir+' ':''} ${w.target||''}`);
    for (const s of suggestions)
      log('AUDIT·', `${s.check.padEnd(16)} ${(s.code||'').padEnd(10)}`);
    logResponse(method, url.pathname, 200, `map audit  ${errors.length} errors  ·  ${warnings.length} warnings  ·  ${suggestions.length} suggestions`);

    const fmt = url.searchParams.get('format') || 'json';
    if (fmt === 'text') {
      const b2 = `http://localhost:${PORT}`;
      const ts2 = new Date().toISOString().slice(0,19).replace('T',' ');
      const HR = '─'.repeat(64);
      const lines = [
        '',
        `MAP CONFORMITY REPORT — ${path.basename(GAME_FILE)}`,
        `Generated ${ts2}  ·  ${nodeCodesWithCoords.length}/${allNodeCodes.length} nodes have coords`,
        '',
      ];
      const mapFixHint = (item) => {
        const { check, code, dir, target } = item;
        if (check === 'diagonal_exit')
          return `   → curl -XPOST ${b2}/api/audit/map/fix -H 'Content-Type: application/json' -d '{"check":"diagonal_exit","code":"${code}","dir":"${dir}"}'  # fix now\n` +
                 `     OR fix all: curl -XPOST ${b2}/api/audit/map/fix`;
        if (check === 'dangling_link')
          return `   → curl -XPUT ${b2}/api/node/${code} -H 'Content-Type: application/json' -d '{"${dir}":null}'  # remove broken link\n` +
                 `     OR create the missing node: curl -XPOST ${b2}/api/node -d '{"code":"${target}",...}'`;
        if (check === 'bidirectional' && code && target && dir)
          return `   → curl -XPOST ${b2}/api/audit/map/fix -H 'Content-Type: application/json' -d '{"check":"bidirectional","code":"${code}","dir":"${dir}","target":"${target}"}'  # fix now\n` +
                 `     OR fix all: curl -XPOST ${b2}/api/audit/map/fix`;
        if (check === 'max_connections')
          return `   → curl ${b2}/api/node/${code}  # inspect N/S/E/W links and remove duplicate`;
        if (check === 'long_link' && item.suggestedCoords)
          return `   → Suggested intermediate node: r=${item.suggestedCoords.r}, c=${item.suggestedCoords.c}`;
        if (check === 'missing_coords')
          return `   → Add coords in NODE_COORDS: ${code}: { r:<row>, c:<col> }`;
        if (check === 'alignment' && item.fix?.curl)
          return `   → ${item.fix.curl}`;
        if (check === 'axis_distance' && item.fix?.curl)
          return item.fix.curl.split('\n').map(l => `   → ${l}`).join('\n');
        if (check === 'corner_misalign' && item.fix?.curl)
          return `   → ${item.fix.curl}`;
        if (check === 'alignment' || check === 'axis_distance' || check === 'corner_misalign')
          return `   → curl ${b2}/api/layout/solve              # get proposed grid layout`;
        return '';
      };

      if (errors.length) {
        lines.push(HR);
        lines.push(`  ✗ ERRORS (${errors.length})  — graph is broken`);
        lines.push(HR);
        for (const e of errors) {
          lines.push(`  [FIX]  ${e.check.toUpperCase().padEnd(20)}  ${e.code}${e.dir?'.'+e.dir:''}${e.target?'→'+e.target:''}`);
          lines.push(`         ${e.msg}`);
          const h = mapFixHint(e); if (h) lines.push(h);
          lines.push('');
        }
      }
      if (warnings.length) {
        lines.push(HR);
        lines.push(`  ⚠ WARNINGS (${warnings.length})  — WARNING TODO FIX`);
        lines.push(HR);
        for (const w of warnings) {
          lines.push(`  [WARN]  ${w.check.toUpperCase().padEnd(20)}  ${w.code}${w.dir?'.'+w.dir:''}${w.target?'→'+w.target:''}`);
          lines.push(`          ${w.msg}`);
          const h = mapFixHint(w); if (h) lines.push(h);
          lines.push('');
        }
      }
      if (suggestions.length) {
        lines.push(HR);
        lines.push(`  ℹ SUGGESTIONS (${suggestions.length})  — layout improvements`);
        lines.push(HR);
        for (const s of suggestions) {
          lines.push(`  [INFO]  ${s.check.toUpperCase().padEnd(20)}  ${s.code}${s.dir?'.'+s.dir:''}${s.target?'→'+s.target:''}`);
          lines.push(`          ${s.msg}`);
          const h = mapFixHint(s); if (h) lines.push(h);
          lines.push('');
        }
      }
      // ── Blocked-edges table ──────────────────────────────────────────────────
      if (blockedEdges.length > 0) {
        lines.push(HR);
        lines.push(`  BLOCKED EDGES (${blockedEdges.length})`);
        lines.push(HR);
        // Column widths
        const colEdge    = Math.max(6,  ...blockedEdges.map(e => e.edge.length));
        const colProblem = Math.max(9,  ...blockedEdges.map(e => e.problem.length));
        const colFix     = Math.max(11, ...blockedEdges.map(e => e.fix.length));
        const pad = (s, w) => s.length >= w ? s : s + ' '.repeat(w - s.length);
        const TL='┌', TR='┐', BL='└', BR='┘', H='─', V='│', TM='┬', BM='┴', LM='├', RM='┤', C='┼';
        const rowSep = (l,m,r) =>
          l + H.repeat(colEdge+2) + m + H.repeat(colProblem+2) + m + H.repeat(colFix+2) + r;
        lines.push('  ' + rowSep(TL, TM, TR));
        lines.push(`  ${V} ${pad('Edge', colEdge)} ${V} ${pad('Problem', colProblem)} ${V} ${pad('Fix needed', colFix)} ${V}`);
        lines.push('  ' + rowSep(LM, C, RM));
        for (const be of blockedEdges) {
          lines.push(`  ${V} ${pad(be.edge, colEdge)} ${V} ${pad(be.problem, colProblem)} ${V} ${pad(be.fix, colFix)} ${V}`);
        }
        lines.push('  ' + rowSep(BL, BM, BR));
        lines.push('');
      }

      // ── Corner-node narrative ─────────────────────────────────────────────
      const cornerIssues = warnings.filter(w => w.check === 'corner_misalign');
      if (cornerIssues.length > 0) {
        lines.push(HR);
        lines.push('  CORNER NODE ANALYSIS');
        lines.push(HR);
        for (const ci of cornerIssues) {
          lines.push(`  ${ci.code} (${ci.currentCoords.r},${ci.currentCoords.c}) is a corner node`);
          lines.push(`  Connects: ${ci.nsDir}→${ci.nsTarget}  ×  ${ci.ewDir}→${ci.ewTarget}`);
          for (const p of ci.problems) lines.push(`    ⚠  ${p}`);
          lines.push(`  Correct position: (${ci.correctCoords.r},${ci.correctCoords.c})`);
          lines.push(`  ${ci.suggestedFix}`);
          if (ci.fix?.curl) lines.push(`  → ${ci.fix.curl}`);
          lines.push('');
        }
      }

      lines.push(HR);
      const clean = errors.length === 0 && warnings.length === 0;
      lines.push(`  SUMMARY  ${errors.length} errors  ·  ${warnings.length} warnings  ·  ${suggestions.length} suggestions  ·  ${blockedEdges.length} blocked edges  ·  ${nodeCodesWithCoords.length}/${allNodeCodes.length} nodes positioned`);
      if (clean) lines.push('  MAP GRAPH OK — no structural errors or warnings.');
      lines.push(HR);
      lines.push('');
      cors(res);
      res.writeHead(200, { 'Content-Type':'text/plain; charset=utf-8' });
      return res.end(lines.join('\n'));
    }

    return json(res, 200, { ok:true, errors, warnings, suggestions, blockedEdges, summary });
  }

  // ── Audit/Data/Clean — delete label-explosion J-nodes + orphan coords ───────
  // POST /api/audit/data/clean[?dryRun=true]
  // Removes all J-nodes whose label contains ↔ (explosion artifacts), nulls out
  // any surviving exits that pointed to them, and strips orphaned NODE_COORDS.
  if (parts[0] === 'audit' && parts[1] === 'data' && parts[2] === 'clean' && method === 'POST') {
    let body = {};
    try { body = await readBody(req); } catch(_) {}
    const dryRun = body?.dryRun === true || url.searchParams.get('dryRun') === 'true';

    // 1. Collect explosion J-node codes.
    //    Criterion: J-prefixed code AND label contains ↔.
    //    Authored J-nodes (J10–J13 etc.) never have ↔ in their labels;
    //    ↔ is exclusively the highway-builder separator, so this is safe.
    const toDelete = new Set();
    for (const [code, node] of Object.entries(WBAPI.nodeMap)) {
      if (/^J\d+$/.test(code) && typeof node.label === 'string' && node.label.includes('↔'))
        toDelete.add(code);
    }

    // 2. Find surviving-node exits that will dangle after deletion
    let danglingCount = 0;
    for (const [code, node] of Object.entries(WBAPI.nodeMap)) {
      if (toDelete.has(code)) continue;
      for (const d of ['N','S','E','W']) {
        if (node[d] && toDelete.has(node[d])) danglingCount++;
      }
    }

    // 3. Count orphaned NODE_COORDS (coord entry with no NODE_MAP match, or in toDelete)
    const survivingNodes = new Set(Object.keys(WBAPI.nodeMap).filter(c => !toDelete.has(c)));
    let orphanCoordCount = 0;
    for (const code of Object.keys(WBAPI.nodeCoords)) {
      if (toDelete.has(code) || !survivingNodes.has(code)) orphanCoordCount++;
    }

    if (dryRun) {
      logResponse(method, url.pathname, 200, `dry-run: ${toDelete.size} explosion nodes, ${danglingCount} dangling exits, ${orphanCoordCount} orphan coords`);
      return json(res, 200, { ok:true, dryRun:true,
        explosionNodes: toDelete.size, danglingExits: danglingCount, orphanCoords: orphanCoordCount,
        sampleCodes: [...toDelete].slice(0, 10) });
    }

    // 4. Patch NODE_MAP section in _rawSrc
    const NM_S = '// ◆◆◆ WORLDBUILDER:NODE_MAP:START ◆◆◆';
    const NM_E = '// ◆◆◆ WORLDBUILDER:NODE_MAP:END ◆◆◆';
    const nmStart = WBAPI._rawSrc.indexOf(NM_S) + NM_S.length;
    const nmEnd   = WBAPI._rawSrc.indexOf(NM_E);
    if (nmStart < NM_S.length || nmEnd === -1)
      return json(res, 500, { ok:false, error:'NODE_MAP section markers not found' });

    let nmBlock = WBAPI._rawSrc.slice(nmStart, nmEnd);

    // Remove single-line J-node entries whose label contains ↔
    const removedLines = { n: 0 };
    nmBlock = nmBlock.replace(/^[ \t]+J\d+\s*:\s*\{[^\n]*↔[^\n]*\n/gm, (m) => {
      removedLines.n++;
      return '';
    });

    // Null out all remaining references to deleted codes in one regex pass
    if (toDelete.size > 0) {
      const escaped = [...toDelete].map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const refRe = new RegExp('"(' + escaped.join('|') + ')"', 'g');
      nmBlock = nmBlock.replace(refRe, 'null');
    }

    WBAPI._rawSrc = WBAPI._rawSrc.slice(0, nmStart) + nmBlock + WBAPI._rawSrc.slice(nmEnd);

    // 5. Patch NODE_COORDS section — remove deleted + orphaned entries
    const NC_S = '// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆';
    const NC_E = '// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
    const ncStart = WBAPI._rawSrc.indexOf(NC_S) + NC_S.length;
    const ncEnd   = WBAPI._rawSrc.indexOf(NC_E);
    if (ncStart < NC_S.length || ncEnd === -1)
      return json(res, 500, { ok:false, error:'NODE_COORDS section markers not found' });

    let ncBlock = WBAPI._rawSrc.slice(ncStart, ncEnd);
    let coordsRemoved = 0;
    ncBlock = ncBlock.replace(/^[ \t]+(\w+)\s*:\s*\{r:[^\n]*\},?\n/gm, (match, code) => {
      if (toDelete.has(code) || !survivingNodes.has(code)) { coordsRemoved++; return ''; }
      return match;
    });

    WBAPI._rawSrc = WBAPI._rawSrc.slice(0, ncStart) + ncBlock + WBAPI._rawSrc.slice(ncEnd);

    // 6. Update in-memory objects to match
    for (const code of toDelete) {
      delete WBAPI.nodeMap[code];
      delete WBAPI.nodeCoords[code];
    }
    for (const [code, node] of Object.entries(WBAPI.nodeMap)) {
      for (const d of ['N','S','E','W']) {
        if (node[d] && toDelete.has(node[d])) node[d] = null;
      }
    }
    for (const code of Object.keys(WBAPI.nodeCoords)) {
      if (!WBAPI.nodeMap[code]) delete WBAPI.nodeCoords[code];
    }

    logResponse(method, url.pathname, 200,
      `clean: removed ${removedLines.n} explosion nodes, ${coordsRemoved} orphan coords, ${danglingCount} exits nulled`);
    return saveAndRestart(res, 200, {
      ok: true,
      explosionNodesRemoved: removedLines.n,
      danglingExitsNulled: danglingCount,
      orphanCoordsRemoved: coordsRemoved,
    });
  }

  // ── Audit/Data — deep structural integrity scan ───────────────────────────
  // GET /api/audit/data[?format=text&section=node|quest|monster|terrain|coords]
  // Validates every entity against its schema, detects bloat/explosion artifacts,
  // orphaned coords, duplicate nums, broken exits, and auto-generated junk text.
  if (parts[0] === 'audit' && parts[1] === 'data' && method === 'GET') {
    const sectionFilter = url.searchParams.get('section') || 'all';
    const fmt           = url.searchParams.get('format') || 'json';

    // ── Validators — each returns [{severity, check, key, field, msg}] ────────
    const DIRS = ['N','S','E','W'];
    const findings = [];
    const push = (severity, check, key, field, msg) =>
      findings.push({ severity, check, key, field, msg });

    // ─────────────── NODE_MAP ────────────────────────────────────────────────
    if (sectionFilter === 'all' || sectionFilter === 'node') {
      const nodeKeys    = new Set(Object.keys(WBAPI.nodeMap));
      const terrainKeys = new Set(Object.keys(WBAPI.worldDb));
      const numSeen     = new Map();   // num → first code seen

      for (const [code, node] of Object.entries(WBAPI.nodeMap)) {
        // Required fields
        if (node.num  == null) push('error',   'missing_field',   code, 'num',   'num is required');
        if (!node.name)        push('error',   'missing_field',   code, 'name',  'name (terrain key) is required');
        if (!node.label)       push('error',   'missing_field',   code, 'label', 'label is required');
        if (node.act  == null) push('error',   'missing_field',   code, 'act',   'act is required');

        // code field matches its key
        if (node.code && node.code !== code)
          push('error', 'code_mismatch', code, 'code', `node.code "${node.code}" does not match map key "${code}"`);

        // act in valid range
        if (node.act != null && (node.act < 1 || node.act > 8))
          push('warning', 'invalid_act', code, 'act', `act ${node.act} outside range 1–8`);

        // terrain key exists
        if (node.name && !terrainKeys.has(node.name))
          push('error', 'bad_terrain', code, 'name', `terrain "${node.name}" not in WORLD_DB`);

        // Broken exits
        for (const d of DIRS) {
          if (node[d] && !nodeKeys.has(node[d]))
            push('error', 'broken_exit', code, d, `exit ${d}="${node[d]}" points to non-existent node`);
        }

        // Duplicate num
        if (node.num != null) {
          if (numSeen.has(node.num)) {
            push('warning', 'duplicate_num', code, 'num', `num ${node.num} also used by "${numSeen.get(node.num)}"`);
          } else {
            numSeen.set(node.num, code);
          }
        }

        // Label explosion — J-node with ↔ in label = auto-generated highway artifact
        // (authored J-nodes like J10–J13 never use ↔ in their labels)
        if (/^J\d+$/.test(code) && node.label && node.label.includes('↔'))
          push('warning', 'label_explosion', code, 'label', `label contains ↔ — auto-generated explosion artifact (${node.label.length} chars)`);

        // Auto-generated signpost text
        if (typeof node.text === 'string' && node.text.startsWith('Signpost says:'))
          push('warning', 'autogen_text', code, 'text', `text is auto-generated signpost copy — no authored narrative`);

        // Bloated entry — estimate serialized size
        const entryLen = JSON.stringify(node).length;
        if (entryLen > 10000)
          push('warning', 'bloated_entry', code, '_size', `serialized size ${(entryLen/1024).toFixed(1)} KB — likely explosion artifact`);
        else if (entryLen > 2000)
          push('suggestion', 'large_entry', code, '_size', `serialized size ${(entryLen/1024).toFixed(1)} KB — unusually large for a junction node`);
      }
    }

    // ─────────────── NODE_COORDS ─────────────────────────────────────────────
    if (sectionFilter === 'all' || sectionFilter === 'coords') {
      const nodeKeys = new Set(Object.keys(WBAPI.nodeMap));
      for (const code of Object.keys(WBAPI.nodeCoords)) {
        if (!nodeKeys.has(code))
          push('warning', 'orphan_coords', code, 'r/c', `NODE_COORDS entry "${code}" has no NODE_MAP entry — phantom coordinate`);
      }
      const coordKeys = new Set(Object.keys(WBAPI.nodeCoords));
      for (const code of Object.keys(WBAPI.nodeMap)) {
        if (!coordKeys.has(code))
          push('suggestion', 'missing_coords', code, 'r/c', `node has no NODE_COORDS entry — won't appear on map`);
      }
    }

    // ─────────────── QUEST_DB ────────────────────────────────────────────────
    if (sectionFilter === 'all' || sectionFilter === 'quest') {
      const nodeKeys = new Set(Object.keys(WBAPI.nodeMap));
      const VALID_QUEST_TYPES = new Set(['main','side','combat','fetch','escort','dialogue','skill_check','mission_bit']);
      for (const [id, q] of Object.entries(WBAPI.questDb)) {
        if (!q.title)        push('warning', 'missing_field', id, 'title', 'missing title');
        if (!q.desc)         push('warning', 'missing_field', id, 'desc',  'missing desc');
        if (!q.npc)          push('error',   'missing_field', id, 'npc',   'missing npc — quests must be anchored to an NPC');
        if (!q.type)         push('warning', 'missing_field', id, 'type',  'missing type');
        if (!q.activateNode) push('warning', 'missing_field', id, 'activateNode', 'no activateNode — quest has no entry point');
        if (q.type && !VALID_QUEST_TYPES.has(q.type))
          push('warning', 'invalid_type', id, 'type', `unknown quest type "${q.type}"`);
        if (q.activateNode && !nodeKeys.has(q.activateNode))
          push('error', 'broken_ref', id, 'activateNode', `node "${q.activateNode}" not in NODE_MAP`);
        if (q.waypointNode && !nodeKeys.has(q.waypointNode))
          push('error', 'broken_ref', id, 'waypointNode', `node "${q.waypointNode}" not in NODE_MAP`);
      }
    }

    // ─────────────── MONSTER_POOL ────────────────────────────────────────────
    if (sectionFilter === 'all' || sectionFilter === 'monster') {
      const dropKeys = new Set(Object.keys(WBAPI.monsterDrops));
      for (const [key, m] of Object.entries(WBAPI.monsterPool)) {
        if (!m.name)      push('warning', 'missing_field', key, 'name',  'missing name');
        if (m.ac  == null) push('warning', 'missing_field', key, 'ac',   'missing ac');
        if (m.hp  == null) push('warning', 'missing_field', key, 'hp',   'missing hp');
        if (m.atk == null) push('warning', 'missing_field', key, 'atk',  'missing atk');
        if (m.xp  == null) push('warning', 'missing_field', key, 'xp',   'missing xp');
        if (!dropKeys.has(key))
          push('suggestion', 'no_drops', key, 'drops', 'no MONSTER_DROPS entry — creature drops nothing');
      }
      for (const dk of Object.keys(WBAPI.monsterDrops))
        if (!WBAPI.monsterPool[dk])
          push('error', 'orphan_drop', dk, 'key', 'MONSTER_DROPS entry has no matching MONSTER_POOL entry');
    }

    // ─────────────── WORLD_DB (terrain) ──────────────────────────────────────
    if (sectionFilter === 'all' || sectionFilter === 'terrain') {
      const monsterKeys = new Set(Object.keys(WBAPI.monsterPool));
      for (const [key, t] of Object.entries(WBAPI.worldDb)) {
        if (!t.label) push('warning', 'missing_field', key, 'label', 'terrain missing label');
        if (!t.monsters || !t.monsters.length)
          push('warning', 'empty_monsters', key, 'monsters', 'terrain has no monsters — encounters impossible here');
        for (const m of (t.monsters || [])) {
          const mk = typeof m === 'string' ? m : m?.key;
          if (mk && !monsterKeys.has(mk))
            push('error', 'bad_monster_ref', key, 'monsters', `references monster "${mk}" not in MONSTER_POOL`);
        }
      }
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    const grouped = {};
    for (const f of findings) {
      grouped[f.check] = grouped[f.check] || { errors:0, warnings:0, suggestions:0, items:[] };
      grouped[f.check][f.severity + 's'] = (grouped[f.check][f.severity + 's'] || 0) + 1;
      grouped[f.check].items.push(f);
    }
    const errors      = findings.filter(f => f.severity === 'error');
    const warnings    = findings.filter(f => f.severity === 'warning');
    const suggestions = findings.filter(f => f.severity === 'suggestion');
    const summary = {
      errors: errors.length, warnings: warnings.length, suggestions: suggestions.length,
      total: findings.length,
      byCheck: Object.fromEntries(Object.entries(grouped).map(([k,v]) =>
        [k, { errors:v.errors||0, warnings:v.warnings||0, suggestions:v.suggestions||0 }])),
    };

    logResponse(method, url.pathname, 200,
      `data audit: ${errors.length} errors · ${warnings.length} warnings · ${suggestions.length} suggestions`);

    if (fmt === 'text') {
      const HR = '─'.repeat(64);
      const ts = new Date().toISOString().slice(0,19).replace('T',' ');
      const lines = ['', `DATA INTEGRITY REPORT — ${path.basename(GAME_FILE)}`, `Generated ${ts}`, ''];
      for (const [checkName, group] of Object.entries(grouped)) {
        const total = (group.errors||0) + (group.warnings||0) + (group.suggestions||0);
        const icon = group.errors ? '✗' : group.warnings ? '⚠' : '·';
        lines.push(HR);
        lines.push(`  ${icon} ${checkName.toUpperCase()} (${total})`);
        lines.push(HR);
        for (const f of group.items) {
          lines.push(`  [${f.severity.toUpperCase()}]  ${f.key}.${f.field}`);
          lines.push(`         ${f.msg}`);
          lines.push('');
        }
      }
      lines.push(HR);
      lines.push(`  TOTALS: ${errors.length} errors · ${warnings.length} warnings · ${suggestions.length} suggestions`);
      lines.push(HR, '');
      cors(res);
      res.writeHead(200, { 'Content-Type':'text/plain; charset=utf-8' });
      return res.end(lines.join('\n'));
    }

    return json(res, 200, { ok:true, summary, findings, grouped });
  }

  // ── Audit (data integrity scan) ───────────────────────────────────────────
  if (parts[0] === 'audit' && method === 'GET') {
    const errors = [], warnings = [], suggestions = [], parse = [];

    const monsterKeys  = new Set(Object.keys(WBAPI.monsterPool));
    const dropKeys     = new Set(Object.keys(WBAPI.monsterDrops));
    const nodeKeys     = new Set(Object.keys(WBAPI.nodeMap));
    const terrainKeys  = new Set(Object.keys(WBAPI.worldDb));
    const coordKeys    = new Set(Object.keys(WBAPI.nodeCoords));
    const allFish      = [...WBAPI.fishPool, ...WBAPI.nightFishPool];
    const questNodesReferenced = new Set();

    // Parse health
    [
      ['MONSTER_POOL',  Object.keys(WBAPI.monsterPool),   'monsters'],
      ['MONSTER_DROPS', Object.keys(WBAPI.monsterDrops),  'drops'],
      ['WORLD_DB',      Object.keys(WBAPI.worldDb),       'terrains'],
      ['NODE_MAP',      Object.keys(WBAPI.nodeMap),       'nodes'],
      ['NODE_COORDS',   Object.keys(WBAPI.nodeCoords),    'coords'],
      ['QUEST_DB',      Object.keys(WBAPI.questDb),       'quests'],
      ['BIRKA_NPC',     Object.keys(WBAPI.birkaNpcs),     'npcs'],
      ['FISH_DB',       allFish,                          'fish'],
      ['LAKE_MAGIC',    Object.keys(WBAPI.lakeMagicDb),   'lake magic'],
    ].forEach(([name, val, label]) => {
      const count = val.length;
      parse.push({ section:name, count, ok: count > 0,
        msg: count > 0 ? `${count} ${label} parsed` : `0 ${label} — section empty or failed` });
    });

    // ERRORS
    for (const [tk, terrain] of Object.entries(WBAPI.worldDb))
      for (const m of (terrain.monsters||[])) {
        const mk = typeof m==='string'?m:m?.key;
        if (mk && !monsterKeys.has(mk))
          errors.push({ section:'WORLD_DB', key:tk, field:'monsters', msg:`references monster "${mk}" not in MONSTER_POOL` });
      }
    for (const [code, node] of Object.entries(WBAPI.nodeMap))
      if (node.name && !terrainKeys.has(node.name))
        errors.push({ section:'NODE_MAP', key:code, field:'name', msg:`terrain "${node.name}" not found in WORLD_DB` });
    for (const [id, q] of Object.entries(WBAPI.questDb)) {
      if (q.activateNode) { questNodesReferenced.add(q.activateNode); if (!nodeKeys.has(q.activateNode)) errors.push({ section:'QUEST_DB', key:id, field:'activateNode', msg:`node "${q.activateNode}" not in NODE_MAP` }); }
      if (q.waypointNode) { questNodesReferenced.add(q.waypointNode); if (!nodeKeys.has(q.waypointNode)) errors.push({ section:'QUEST_DB', key:id, field:'waypointNode', msg:`node "${q.waypointNode}" not in NODE_MAP` }); }
    }
    for (const [key, npc] of Object.entries(WBAPI.birkaNpcs))
      if (npc.node && !nodeKeys.has(npc.node))
        errors.push({ section:'BIRKA_NPC', key, field:'node', msg:`node "${npc.node}" not in NODE_MAP` });
    // ERROR — quest missing npc anchor
    for (const [id, q] of Object.entries(WBAPI.questDb))
      if (!q.npc)
        errors.push({ section:'QUEST_DB', key:id, field:'npc', msg:`quest has no npc field — every quest must be anchored to an NPC` });
    for (const dk of dropKeys)
      if (!monsterKeys.has(dk))
        errors.push({ section:'MONSTER_DROPS', key:dk, field:'key', msg:`drop entry has no matching MONSTER_POOL entry` });
    for (const f of allFish)
      if (!monsterKeys.has(f.key))
        errors.push({ section:'FISH_DB', key:f.key, field:'key', msg:`fish "${f.name}" has no MONSTER_POOL entry — combat stats missing` });

    // WARNINGS
    for (const mk of monsterKeys)
      if (!dropKeys.has(mk))
        warnings.push({ section:'MONSTER_POOL', key:mk, field:'drops', msg:`no MONSTER_DROPS entry — creature drops nothing` });
    for (const f of allFish)
      if (!dropKeys.has(f.key))
        warnings.push({ section:'FISH_DB', key:f.key, field:'drops', msg:`fish "${f.name}" has no MONSTER_DROPS entry` });
    for (const [id, q] of Object.entries(WBAPI.questDb)) {
      if (!q.title) warnings.push({ section:'QUEST_DB', key:id, field:'title', msg:`missing title field` });
      if (!q.desc)  warnings.push({ section:'QUEST_DB', key:id, field:'desc',  msg:`missing desc field` });
    }
    for (const [tk, terrain] of Object.entries(WBAPI.worldDb))
      if (!terrain.monsters || !terrain.monsters.length)
        warnings.push({ section:'WORLD_DB', key:tk, field:'monsters', msg:`terrain has no monsters defined` });
    for (const [code, node] of Object.entries(WBAPI.nodeMap))
      if (node.battle && (!node.name || !terrainKeys.has(node.name)))
        warnings.push({ section:'NODE_MAP', key:code, field:'battle', msg:`battle:true but terrain "${node.name||'(none)'}" not in WORLD_DB` });
    for (const [key, item] of Object.entries(WBAPI.lakeMagicDb))
      if (item.minRank > 20)
        warnings.push({ section:'LAKE_MAGIC', key, field:'minRank', msg:`minRank ${item.minRank} exceeds max fish rank (20) — item unreachable` });

    // WARNINGS (continued) — NPCs missing NPC_DIALOGUES entry
    for (const [npcKey, npc] of Object.entries(WBAPI.birkaNpcs))
      if (!WBAPI.npcDialogues[npcKey])
        warnings.push({ section:'BIRKA_NPC', key:npcKey, field:'NPC_DIALOGUES', msg:`"${npc.name||npcKey}" has no NPC_DIALOGUES entry — dialogue card will not render in game` });
    // WARNINGS — NPC with no quests (has no gameplay function)
    // Birka Six NPCs (yael/brynn/quill/pachelbel/crov/auros) have quests in NPC_DIALOGUE, not QUEST_DB
    const _birkaSixExempt = new Set(Object.keys(WBAPI.npcDialogues));
    const _npcQuestKeys = new Set();
    for (const q of Object.values(WBAPI.questDb)) if (q.npc) _npcQuestKeys.add(q.npc);
    for (const [key, npc] of Object.entries(WBAPI.birkaNpcs))
      if (!_npcQuestKeys.has(key) && !_npcQuestKeys.has(npc.name) && !_birkaSixExempt.has(key))
        warnings.push({ section:'BIRKA_NPC', key, field:'quests', msg:`"${npc.name||key}" has no quests — NPC has no gameplay function` });

    // WARNINGS — loot table gap
    const lootTotal = (WBAPI.d100Table||[]).reduce((s,e)=>s+(e.weight||0), 0);
    if (lootTotal === 0)
      warnings.push({ section:'D100_TABLE', key:'_D100_TABLE', field:'weight', msg:`d100 loot table is empty — no loot will drop from encounters` });
    else if (lootTotal < 100)
      warnings.push({ section:'D100_TABLE', key:'_D100_TABLE', field:'weight', msg:`d100 loot table weights sum to ${lootTotal}/100 — ${100-lootTotal} unassigned slots will produce null drops` });

    // SUGGESTIONS
    const usedMonsters = new Set();
    for (const t of Object.values(WBAPI.worldDb))
      for (const m of (t.monsters||[])) usedMonsters.add(typeof m==='string'?m:m?.key);
    for (const mk of monsterKeys)
      if (!usedMonsters.has(mk) && !allFish.some(f=>f.key===mk))
        suggestions.push({ section:'MONSTER_POOL', key:mk, field:'terrains', msg:`not used in any WORLD_DB terrain` });
    for (const code of nodeKeys)
      if (!questNodesReferenced.has(code))
        suggestions.push({ section:'NODE_MAP', key:code, field:'quests', msg:`no quests reference this node` });
    for (const code of nodeKeys)
      if (!coordKeys.has(code))
        suggestions.push({ section:'NODE_COORDS', key:code, field:'coords', msg:`node has no entry in NODE_COORDS — won't appear on map` });

    // SUGGESTIONS — disconnected map graph (BFS from num=1 node)
    const allNodeCodes = Object.keys(WBAPI.nodeMap);
    if (allNodeCodes.length > 0) {
      const startCode = allNodeCodes.find(k => WBAPI.nodeMap[k].num === 1) || allNodeCodes[0];
      const visited = new Set();
      const queue = [startCode];
      while (queue.length) {
        const curr = queue.shift();
        if (visited.has(curr)) continue;
        visited.add(curr);
        const n = WBAPI.nodeMap[curr];
        if (!n) continue;
        for (const dir of ['N','S','E','W']) if (n[dir] && WBAPI.nodeMap[n[dir]]) queue.push(n[dir]);
      }
      for (const code of allNodeCodes)
        if (!visited.has(code))
          suggestions.push({ section:'NODE_MAP', key:code, field:'connectivity', msg:`not reachable via map traversal from "${startCode}" — island node or missing exit link` });
    }

    const summary = { errors: errors.length, warnings: warnings.length, suggestions: suggestions.length };
    const eCol = errors.length   ? C.red    : C.green;
    const wCol = warnings.length ? C.yellow : C.green;
    logRow(`${eCol}${errors.length} errors${C.reset}  ·  ${wCol}${warnings.length} warnings${C.reset}  ·  ${C.dim}${suggestions.length} suggestions${C.reset}`);
    if (errors.length) {
      const freq = {};
      errors.forEach(e => { const k = e.msg.replace(/"[^"]+"/g,'"…"'); freq[k] = (freq[k]||0)+1; });
      const top = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,3)
        .map(([msg,n]) => n>1 ? `${msg} (×${n})` : msg);
      top.forEach((t,i) => logRow(i===0 ? 'top errors' : '', t));
    }
    if (warnings.length) {
      const wfreq = {};
      warnings.forEach(w => { const k = w.msg.replace(/"[^"]+"/g,'"…"'); wfreq[k] = (wfreq[k]||0)+1; });
      const wtop = Object.entries(wfreq).sort((a,b)=>b[1]-a[1]).slice(0,2)
        .map(([msg,n]) => n>1 ? `${msg} (×${n})` : msg);
      wtop.forEach((t,i) => logRow(i===0 ? 'top warnings' : '', t));
    }
    logResponse(method, url.pathname, 200, `${errors.length} errors  ·  ${warnings.length} warnings  ·  ${suggestions.length} suggestions`);

    // TEXT FORMAT — "WARNING TODO FIX" style report
    const fmt = url.searchParams.get('format') || 'json';
    if (fmt === 'text') {
      const b = `http://localhost:${PORT}`;
      const ts2 = new Date().toISOString().slice(0,19).replace('T',' ');
      const fixHint = (item) => {
        const { section, key, field } = item;
        if (section === 'QUEST_DB'   && (field === 'activateNode' || field === 'waypointNode'))
          return `   → curl -XPUT ${b}/api/quest/${key} -H 'Content-Type: application/json' -d '{"${field}":"<valid-node>"}'`;
        if (section === 'NODE_MAP'   && field === 'name')
          return `   → curl -XPUT ${b}/api/node/${key} -H 'Content-Type: application/json' -d '{"name":"<terrain-key>"}'`;
        if (section === 'BIRKA_NPC'  && field === 'node')
          return `   → curl -XPUT ${b}/api/npc/${key} -H 'Content-Type: application/json' -d '{"node":"<valid-node>"}'`;
        if (section === 'BIRKA_NPC'  && field === 'NPC_DIALOGUES')
          return `   → curl -XPOST ${b}/api/npc/${key}/dialogue -H 'Content-Type: application/json' -d '{"quote":"..."}'`;
        if (section === 'MONSTER_DROPS' && field === 'key')
          return `   → curl ${b}/api/monster/${key}  # create monster, or DELETE the orphan drop entry`;
        if (section === 'FISH_DB'    && field === 'key')
          return `   → curl -XPOST ${b}/api/monster -H 'Content-Type: application/json' -d '{"key":"${key}","name":"...","ac":10,"hp":10,"atk":2,"dmg":4,"xp":5,"tier":1}'`;
        if (section === 'MONSTER_POOL' && field === 'drops')
          return `   → curl -XPOST ${b}/api/monster/${key}/drop -H 'Content-Type: application/json' -d '{"name":"${key} remains","sell":0}'`;
        if (section === 'D100_TABLE')
          return `   → curl ${b}/api/loot  (see gap and suggestions)`;
        if (section === 'WORLD_DB'   && field === 'monsters')
          return `   → curl -XPUT ${b}/api/terrain/${key} -H 'Content-Type: application/json' -d '{"monsters":["<key>"]}'`;
        if (section === 'NODE_MAP'   && field === 'connectivity')
          return `   → curl ${b}/api/node/${key}  # check N/S/E/W exit links`;
        return '';
      };
      const HR = '─'.repeat(64);
      const lines = [
        '',
        `VALIDATION REPORT — ${path.basename(GAME_FILE)}`,
        `Generated ${ts2}`,
        '',
      ];
      if (errors.length) {
        lines.push(HR);
        lines.push(`  ✗ ERRORS (${errors.length})  — data is broken; these cause bugs`);
        lines.push(HR);
        for (const e of errors) {
          lines.push(`  [FIX]  ${e.section}  ${e.key}.${e.field}`);
          lines.push(`         ${e.msg}`);
          const h = fixHint(e); if (h) lines.push(h);
          lines.push('');
        }
      }
      if (warnings.length) {
        lines.push(HR);
        lines.push(`  ⚠ WARNINGS (${warnings.length})  — WARNING TODO FIX`);
        lines.push(HR);
        for (const w of warnings) {
          lines.push(`  [WARN]  ${w.section}  ${w.key}.${w.field}`);
          lines.push(`          ${w.msg}`);
          const h = fixHint(w); if (h) lines.push(h);
          lines.push('');
        }
      }
      if (suggestions.length) {
        lines.push(HR);
        lines.push(`  ℹ SUGGESTIONS (${suggestions.length})  — not urgent but worth addressing`);
        lines.push(HR);
        for (const s of suggestions) {
          lines.push(`  [INFO]  ${s.section}  ${s.key}.${s.field}`);
          lines.push(`          ${s.msg}`);
          const h = fixHint(s); if (h) lines.push(h);
          lines.push('');
        }
      }
      lines.push(HR);
      lines.push('  PARSE STATUS');
      lines.push(HR);
      for (const p of parse)
        lines.push(`  ${p.ok ? '✓' : '✗'}  ${p.section.padEnd(22)} ${p.count} entries`);
      lines.push('');
      lines.push(HR);
      const clean = errors.length === 0 && warnings.length === 0;
      lines.push(`  SUMMARY  ${errors.length} errors  ·  ${warnings.length} warnings  ·  ${suggestions.length} suggestions`);
      if (clean) lines.push('  ALL CLEAR — no errors or warnings detected.');
      lines.push(HR);
      lines.push('');
      cors(res);
      res.writeHead(200, { 'Content-Type':'text/plain; charset=utf-8' });
      return res.end(lines.join('\n'));
    }

    return json(res, 200, { ok:true, errors, warnings, suggestions, parse, summary });
  }

  // ── Next Error — single-item focus validator with full debug context ──────
  // GET /api/next-error[?severity=error|warning|suggestion|all][?skip=N][?format=text]
  if (parts[0] === 'next-error' && method === 'GET') {
    const sevFilter = url.searchParams.get('severity') || 'all';
    const skipN     = Math.max(0, parseInt(url.searchParams.get('skip') || '0', 10));
    const fmt       = url.searchParams.get('format') || 'json';
    const b         = `http://localhost:${PORT}`;

    // ── Collect all findings (same checks as /api/audit, plus passText/failText) ──
    const neFindings = [];
    const neAdd = (sev, section, key, field, msg) => neFindings.push({ severity:sev, section, key, field, msg });

    const neMKeys = new Set(Object.keys(WBAPI.monsterPool));
    const neDKeys = new Set(Object.keys(WBAPI.monsterDrops));
    const neNKeys = new Set(Object.keys(WBAPI.nodeMap));
    const neTKeys = new Set(Object.keys(WBAPI.worldDb));
    const neAllFish = [...WBAPI.fishPool, ...WBAPI.nightFishPool];

    // ERRORS
    for (const [tk, terrain] of Object.entries(WBAPI.worldDb))
      for (const m of (terrain.monsters||[])) {
        const mk = typeof m==='string'?m:m?.key;
        if (mk && !neMKeys.has(mk)) neAdd('error','WORLD_DB',tk,'monsters',`references monster "${mk}" not in MONSTER_POOL`);
      }
    for (const [code, node] of Object.entries(WBAPI.nodeMap))
      if (node.name && !neTKeys.has(node.name)) neAdd('error','NODE_MAP',code,'name',`terrain "${node.name}" not found in WORLD_DB`);
    for (const [id, q] of Object.entries(WBAPI.questDb)) {
      if (q.activateNode && PLACEHOLDER_NODES.has(q.activateNode.toUpperCase().trim())) {
        const bookCode = id.match(/^([a-z]{2,4})_/)?.[1]?.toUpperCase() || '';
        const mdHint = bookCode ? `Read 1367-sources/${bookCode}-*.md for the real city/location` : 'Read source book markdown for the real city/location';
        neAdd('error','QUEST_DB',id,'activateNode',`"${q.activateNode}" is a placeholder, not a valid node. ${mdHint}, then verify with GET /api/list/node`);
      } else {
        if (q.activateNode && !neNKeys.has(q.activateNode)) neAdd('error','QUEST_DB',id,'activateNode',`node "${q.activateNode}" not in NODE_MAP`);
      }
      if (q.waypointNode && !neNKeys.has(q.waypointNode)) neAdd('error','QUEST_DB',id,'waypointNode',`node "${q.waypointNode}" not in NODE_MAP`);
    }
    for (const [key, npc] of Object.entries(WBAPI.birkaNpcs))
      if (npc.node && !neNKeys.has(npc.node)) neAdd('error','BIRKA_NPC',key,'node',`node "${npc.node}" not in NODE_MAP`);
    // ERROR — quest missing npc anchor
    for (const [id, q] of Object.entries(WBAPI.questDb))
      if (!q.npc) neAdd('error','QUEST_DB',id,'npc',`quest has no npc field — every quest must be anchored to an NPC`);
    for (const dk of neDKeys)
      if (!neMKeys.has(dk)) neAdd('error','MONSTER_DROPS',dk,'key',`drop entry has no matching MONSTER_POOL entry`);
    for (const f of neAllFish)
      if (!neMKeys.has(f.key)) neAdd('error','FISH_DB',f.key,'key',`fish "${f.name}" has no MONSTER_POOL entry`);

    // WARNINGS
    const NE_VALID_TYPES = new Set(['side','main','skill_check','hunt','epic','combat','escort','dialogue','hybrid','mission_bit']);
    for (const mk of neMKeys)
      if (!neDKeys.has(mk)) neAdd('warning','MONSTER_POOL',mk,'drops',`no MONSTER_DROPS entry — creature drops nothing`);
    for (const f of neAllFish)
      if (!neDKeys.has(f.key)) neAdd('warning','FISH_DB',f.key,'drops',`fish "${f.name}" has no MONSTER_DROPS entry`);
    for (const [id, q] of Object.entries(WBAPI.questDb)) {
      if (!q.title)    neAdd('warning','QUEST_DB',id,'title',   'missing title field');
      if (!q.desc)     neAdd('warning','QUEST_DB',id,'desc',    'missing desc field — quest log renders blank');
      if (!q.passText) neAdd('warning','QUEST_DB',id,'passText','missing passText field — no success message');
      if (!q.failText) neAdd('warning','QUEST_DB',id,'failText','missing failText field — no failure message');
      if (!q.activateNode) neAdd('warning','QUEST_DB',id,'activateNode','missing activateNode — quest never appears on map');
      if (q.type && !NE_VALID_TYPES.has(q.type)) neAdd('warning','QUEST_DB',id,'type',`"${q.type}" is not a recognised quest type — valid: ${[...NE_VALID_TYPES].join(', ')}`);
    }
    for (const [tk, terrain] of Object.entries(WBAPI.worldDb))
      if (!terrain.monsters || !terrain.monsters.length) neAdd('warning','WORLD_DB',tk,'monsters',`terrain has no monsters defined`);
    for (const [npcKey, npc] of Object.entries(WBAPI.birkaNpcs))
      if (!WBAPI.npcDialogues[npcKey]) neAdd('warning','BIRKA_NPC',npcKey,'NPC_DIALOGUES',`"${npc.name||npcKey}" has no NPC_DIALOGUES entry — dialogue card blank in game`);
    // WARNING — NPC with no quests
    // Birka Six NPCs have quests defined in NPC_DIALOGUE (not QUEST_DB); exempt them from this check
    const _birkaSixKeys = new Set(Object.keys(WBAPI.npcDialogues)); // yael/brynn/quill/pachelbel/crov/auros
    const _neNpcQuestKeys = new Set();
    for (const q of Object.values(WBAPI.questDb)) if (q.npc) _neNpcQuestKeys.add(q.npc);
    for (const [key, npc] of Object.entries(WBAPI.birkaNpcs))
      if (!_neNpcQuestKeys.has(key) && !_neNpcQuestKeys.has(npc.name) && !_birkaSixKeys.has(key))
        neAdd('warning','BIRKA_NPC',key,'quests',`"${npc.name||key}" has no quests — NPC has no gameplay function`);

    // SUGGESTIONS
    const neUsed = new Set();
    for (const t of Object.values(WBAPI.worldDb))
      for (const m of (t.monsters||[])) neUsed.add(typeof m==='string'?m:m?.key);
    for (const mk of neMKeys)
      if (!neUsed.has(mk) && !neAllFish.some(f=>f.key===mk)) neAdd('suggestion','MONSTER_POOL',mk,'terrains',`not assigned to any terrain — never appears in combat`);
    for (const code of neNKeys)
      if (!WBAPI.nodeCoords[code]) neAdd('suggestion','NODE_COORDS',code,'coords',`no entry in NODE_COORDS — won't appear on map`);

    // ── Sort: errors first, then warnings, then suggestions ──────────────────
    const SEV_ORD = { error:0, warning:1, suggestion:2 };
    neFindings.sort((a, b_) => SEV_ORD[a.severity] - SEV_ORD[b_.severity]);
    const filtered = sevFilter === 'all' ? neFindings : neFindings.filter(f => f.severity === sevFilter);
    const neCounts = {
      errors:      neFindings.filter(f=>f.severity==='error').length,
      warnings:    neFindings.filter(f=>f.severity==='warning').length,
      suggestions: neFindings.filter(f=>f.severity==='suggestion').length,
      total:       neFindings.length,
    };

    if (filtered.length === 0 || skipN >= filtered.length) {
      logResponse(method, url.pathname, 200, `next-error: clean (severity=${sevFilter})`);
      return json(res, 200, {
        ok: true, found: false, counts: neCounts,
        position: { skip: skipN, ofFiltered: filtered.length },
        message: filtered.length === 0 ? `No findings for severity="${sevFilter}" — all clear!`
          : `skip=${skipN} is past end of ${filtered.length} findings`,
      });
    }

    const neItem = filtered[skipN];

    // ── Build FIX_THIS block ──────────────────────────────────────────────────
    function neBuildFix(item) {
      const { section, key, field, msg } = item;
      const base = `${b}/api`;

      if (section === 'QUEST_DB') {
        const entity = { ...WBAPI.questDb[key], id: key };
        const QUEST_FIELD_HINTS = {
          desc:     { why:'Player-facing description shown in quest log. Quest renders blank without it.', placeholder:'<what this quest is about, 1–2 sentences>' },
          passText: { why:'Text shown to player when quest succeeds / TOKEN received.', placeholder:'<narrative outcome on success>' },
          failText: { why:'Text shown on failure or retry gate. Player needs to know what to do next.', placeholder:'<why it failed and when to retry>' },
          title:    { why:'Display name shown in quest log and map tooltip.', placeholder:'<short quest title>' },
        };
        if (QUEST_FIELD_HINTS[field]) {
          const { why, placeholder } = QUEST_FIELD_HINTS[field];
          const bodyTpl = { [field]: placeholder };
          return { entity, field, why,
            howToFix: {
              method: 'PUT', url: `${base}/quest/${key}`,
              body: bodyTpl,
              curl: `curl -XPUT ${base}/quest/${key} -H 'Content-Type: application/json' -d '${JSON.stringify(bodyTpl)}'`,
            },
          };
        }
        if (field === 'activateNode' || field === 'waypointNode') {
          const bad = entity[field];
          return { entity, field, why: `Node "${bad}" does not exist in NODE_MAP. Quest cannot fire.`,
            howToFix: { options: [
              { label:`Fix: point to a valid node`, method:'PUT', url:`${base}/quest/${key}`,
                body:{ [field]:'<valid-node-code>' },
                curl:`curl -XPUT ${base}/quest/${key} -H 'Content-Type: application/json' -d '{"${field}":"<valid-node-code>"}'  # see GET ${base}/list/node` },
              { label:`Fix: create missing node "${bad}"`, method:'POST', url:`${base}/node`,
                body:{ code:bad, label:'<location name>', act:1, name:'<terrain-key>' },
                curl:`curl -XPOST ${base}/node -H 'Content-Type: application/json' -d '{"code":"${bad}","label":"...","act":1,"name":"..."}'` },
            ]}};
        }
      }

      if (section === 'NODE_MAP' && field === 'name') {
        const entity = { ...WBAPI.nodeMap[key], id: key };
        const bad = entity.name;
        return { entity, field, why:`Terrain "${bad}" not in WORLD_DB. Node has no monster pool.`,
          howToFix: { options: [
            { label:'Fix: point to a valid terrain key', method:'PUT', url:`${base}/node/${key}`,
              body:{ name:'<valid-terrain-key>' },
              curl:`curl -XPUT ${base}/node/${key} -H 'Content-Type: application/json' -d '{"name":"<terrain-key>"}' # see GET ${base}/list/terrain` },
            { label:`Create terrain "${bad}"`, method:'POST', url:`${base}/terrain`,
              body:{ key:bad, label:'<terrain label>', monsters:[] },
              curl:`curl -XPOST ${base}/terrain -H 'Content-Type: application/json' -d '{"key":"${bad}","label":"...","monsters":[]}'` },
          ]}};
      }

      if (section === 'BIRKA_NPC' && field === 'node') {
        const entity = { ...WBAPI.birkaNpcs[key], key };
        return { entity, field, why:`NPC node "${entity.node}" not in NODE_MAP. NPC won't appear.`,
          howToFix: { method:'PUT', url:`${base}/npc/${key}`, body:{ node:'<valid-node-code>' },
            curl:`curl -XPUT ${base}/npc/${key} -H 'Content-Type: application/json' -d '{"node":"<valid-node-code>"}'` }};
      }

      if (section === 'BIRKA_NPC' && field === 'NPC_DIALOGUES') {
        const entity = { ...WBAPI.birkaNpcs[key], key };
        return { entity, field, why:`No NPC_DIALOGUES entry for "${entity.name||key}". Dialogue card blank in game.`,
          howToFix: { method:'POST', url:`${base}/npc/${key}/dialogue`,
            body:{ quote:'<NPC catchphrase or one-liner>', impartial:['<greeting at neutral>'], friendly:['<greeting at friendly>'] },
            curl:`curl -XPOST ${base}/npc/${key}/dialogue -H 'Content-Type: application/json' -d '{"quote":"..."}'` }};
      }

      if (section === 'MONSTER_POOL' && field === 'drops') {
        const entity = { ...WBAPI.monsterPool[key], key };
        return { entity, field, why:`No drop in MONSTER_DROPS for "${key}". Defeating it yields nothing.`,
          howToFix: { method:'POST', url:`${base}/monster/${key}/drop`,
            body:{ name:`${entity.name||key} remains`, sell:0, icon:'💀' },
            curl:`curl -XPOST ${base}/monster/${key}/drop -H 'Content-Type: application/json' -d '{"name":"${entity.name||key} remains","sell":0,"icon":"💀"}'` }};
      }

      if (section === 'MONSTER_DROPS' && field === 'key') {
        const entity = { ...WBAPI.monsterDrops[key], key };
        return { entity, field, why:`Drop entry "${key}" has no matching MONSTER_POOL entry. Drop is orphaned.`,
          howToFix: { options: [
            { label:`Create monster "${key}" in MONSTER_POOL`, method:'POST', url:`${base}/monster`,
              body:{ key, name:key, ac:12, hp:10, atk:2, dmg:4, xp:10, tier:1 },
              curl:`curl -XPOST ${base}/monster -H 'Content-Type: application/json' -d '{"key":"${key}","name":"${key}","ac":12,"hp":10,"atk":2,"dmg":4,"xp":10,"tier":1}'` },
            { label:`Delete orphan drop (requires nonce)`,
              note:`NONCE=$(curl -s -XPOST ${base}/nonce -H 'Content-Type: application/json' -d '{"type":"monster","id":"${key}"}' | jq -r .nonce)  && curl -XDELETE ${base}/drops/${key} -H "X-Nonce: $NONCE"` },
          ]}};
      }

      if (section === 'WORLD_DB' && field === 'monsters') {
        const entity = { ...WBAPI.worldDb[key], key };
        const missing = msg.match(/"([^"]+)" not in MONSTER_POOL/)?.[1];
        const currentList = WBAPI._terrainToMonsters[key] || [];
        return { entity, field, why:msg,
          howToFix: missing ? { options:[
            { label:`Create missing monster "${missing}"`, method:'POST', url:`${base}/monster`,
              body:{ key:missing, name:missing, ac:12, hp:20, atk:3, dmg:6, xp:20, tier:2 },
              curl:`curl -XPOST ${base}/monster -H 'Content-Type: application/json' -d '{"key":"${missing}","name":"${missing}","ac":12,"hp":20,"atk":3,"dmg":6,"xp":20,"tier":2}'` },
            { label:`Remove "${missing}" from terrain`, method:'PUT', url:`${base}/terrain/${key}`,
              body:{ monsters: currentList.filter(m=>m!==missing) },
              curl:`curl -XPUT ${base}/terrain/${key} -H 'Content-Type: application/json' -d '{"monsters":${JSON.stringify(currentList.filter(m=>m!==missing))}}'` },
          ]} : { note:`Inspect terrain "${key}" monster list and remove or create missing entries` }};
      }

      if (section === 'NODE_COORDS' && field === 'coords') {
        const entity = { ...WBAPI.nodeMap[key], id: key };
        return { entity, field, why:`Node "${key}" has no coordinates. Won't appear on world map.`,
          howToFix: {
            method:'PUT', url:`${base}/coords/${key}`,
            body:{ r:'<row>', c:'<col>' },
            curl:`curl -XPUT ${base}/coords/${key} -H 'Content-Type: application/json' -d '{"r":<row>,"c":<col>}'`,
            hint:`Run GET ${base}/coords/near/${key}?radius=8 to find available slots near connected nodes`,
          }};
      }

      if (section === 'MONSTER_POOL' && field === 'terrains') {
        const entity = { ...WBAPI.monsterPool[key], key };
        return { entity, field, why:`Monster "${key}" not in any terrain. It never appears in combat.`,
          howToFix: {
            note:`Choose a terrain, then:`,
            method:'PUT', url:`${base}/terrain/<terrain-key>`,
            body:{ monsters:['...existing...', key] },
            curl:`curl ${base}/list/terrain  # find the right terrain, then PUT its monster list`,
          }};
      }

      // Fallback
      const entity = WBAPI.questDb[key]||WBAPI.nodeMap[key]||WBAPI.monsterPool[key]||WBAPI.birkaNpcs[key]||WBAPI.worldDb[key]||{ key };
      return { entity, field, why:msg, howToFix:{ note:'No automated fix template. Review entity manually.' }};
    }

    // ── Build CONTEXT block ────────────────────────────────────────────────────
    function neBuildContext(item) {
      const { section, key } = item;
      const base = `${b}/api`;
      const ctx = { _label:'Reference only — for context and lookup, not the item being fixed', lookups:[] };

      if (section === 'QUEST_DB') {
        const q = WBAPI.questDb[key]; if (!q) return ctx;
        ctx.lookups.push(`GET ${base}/quest/${key}`);
        if (q.activateNode) {
          const n = WBAPI.nodeMap[q.activateNode];
          ctx.activateNode = n
            ? { code:q.activateNode, label:n.label, terrain:n.name, lookup:`GET ${base}/node/${q.activateNode}` }
            : { code:q.activateNode, status:'NOT IN NODE_MAP' };
          ctx.lookups.push(`GET ${base}/location/${q.activateNode}`);
        }
        if (q.waypointNode) {
          const n = WBAPI.nodeMap[q.waypointNode];
          ctx.waypointNode = n
            ? { code:q.waypointNode, label:n.label, lookup:`GET ${base}/node/${q.waypointNode}` }
            : { code:q.waypointNode, status:'NOT IN NODE_MAP' };
        }
        if (q.npc) {
          const npc = WBAPI.birkaNpcs[q.npc];
          ctx.npc = npc
            ? { key:q.npc, name:npc.name, node:npc.node, lookup:`GET ${base}/npc/${q.npc}` }
            : { key:q.npc, status:'NOT IN BIRKA_NPC' };
        }
        const chain = WBAPI.quests.chain(key);
        if (chain.upstream.length || chain.downstream.length) {
          ctx.chain = {
            upstream:   chain.upstream.map(id => ({ id, title:WBAPI.questDb[id]?.title })),
            downstream: chain.downstream.map(id => ({ id, title:WBAPI.questDb[id]?.title })),
            lookup:`GET ${base}/quest/${key}/chain`,
          };
          ctx.lookups.push(`GET ${base}/quest/${key}/chain`);
        }
        if (q.activateNode) {
          const sameNode = (WBAPI._questsByNode[q.activateNode]||[]).filter(id=>id!==key);
          if (sameNode.length) {
            ctx.otherQuestsAtNode = sameNode.slice(0,5).map(id=>({ id, title:WBAPI.questDb[id]?.title }));
            if (sameNode.length>5) ctx.otherQuestsAtNode.push({ _note:`+${sameNode.length-5} more` });
            ctx.lookups.push(`GET ${base}/list/quest?node=${q.activateNode}`);
          }
        }
      }

      if (section === 'NODE_MAP' || section === 'NODE_COORDS') {
        const n = WBAPI.nodeMap[key]; if (!n) return ctx;
        ctx.lookups.push(`GET ${base}/node/${key}`, `GET ${base}/location/${key}`);
        if (n.name) {
          const t = WBAPI.worldDb[n.name];
          ctx.terrain = t
            ? { key:n.name, label:t.label, monsters:WBAPI._terrainToMonsters[n.name]||[], lookup:`GET ${base}/terrain/${n.name}` }
            : { key:n.name, status:'NOT IN WORLD_DB' };
        }
        const npcs = WBAPI.npcs.byNode(key);
        if (npcs.length) ctx.npcs = npcs.map(np=>({ key:np.key, name:np.name }));
        const qList = WBAPI.quests.byNode(key);
        if (qList.length) {
          ctx.quests = qList.slice(0,5).map(q=>({ id:q.id, title:q.title }));
          if (qList.length>5) ctx.quests.push({ _note:`+${qList.length-5} more` });
          ctx.lookups.push(`GET ${base}/list/quest?node=${key}`);
        }
        if (section === 'NODE_COORDS') {
          const linked = ['N','S','E','W'].map(d=>n[d]).filter(Boolean).filter(c=>WBAPI.nodeCoords[c]);
          if (linked.length) {
            ctx.connectedNodesWithCoords = linked.map(c=>({ code:c, ...WBAPI.nodeCoords[c], label:WBAPI.nodeMap[c]?.label }));
            ctx.lookups.push(`GET ${base}/coords/near/${key}?radius=8`);
          }
        }
      }

      if (section === 'BIRKA_NPC') {
        const npc = WBAPI.birkaNpcs[key]; if (!npc) return ctx;
        ctx.lookups.push(`GET ${base}/npc/${key}`);
        if (npc.node) {
          const n = WBAPI.nodeMap[npc.node];
          ctx.node = n
            ? { code:npc.node, label:n.label, terrain:n.name, lookup:`GET ${base}/node/${npc.node}` }
            : { code:npc.node, status:'NOT IN NODE_MAP' };
          ctx.lookups.push(`GET ${base}/location/${npc.node}`);
        }
        const qRefs = WBAPI.quests.all().filter(q=>q.npc===key||(npc.name&&q.npc===npc.name));
        if (qRefs.length) ctx.quests = qRefs.slice(0,5).map(q=>({ id:q.id, title:q.title }));
      }

      if (section === 'MONSTER_POOL' || section === 'MONSTER_DROPS') {
        ctx.lookups.push(`GET ${base}/monster/${key}`);
        const terrains = WBAPI._monsterToTerrains[key]||[];
        if (terrains.length) ctx.terrains = terrains.map(tk=>({ key:tk, label:WBAPI.worldDb[tk]?.label, lookup:`GET ${base}/terrain/${tk}` }));
        else ctx.terrains = [];
      }

      if (section === 'WORLD_DB') {
        ctx.lookups.push(`GET ${base}/terrain/${key}`, `GET ${base}/list/monster`);
        const usingNodes = Object.entries(WBAPI.nodeMap).filter(([,n])=>n.name===key).map(([code,n])=>({ code, label:n.label }));
        if (usingNodes.length) ctx.nodesUsingTerrain = usingNodes;
      }

      return ctx;
    }

    const fixBlock = neBuildFix(neItem);
    const ctxBlock = neBuildContext(neItem);

    logRow('finding', `[${neItem.severity.toUpperCase()}]  ${neItem.section}  ${neItem.key}.${neItem.field}`);
    logRow('position', `skip=${skipN}  of ${filtered.length} filtered (${neCounts.errors}E ${neCounts.warnings}W ${neCounts.suggestions}S)`);
    logRow('remaining', filtered.length - skipN - 1);
    logResponse(method, url.pathname, 200, `next-error[${skipN}]: ${neItem.severity} — ${neItem.section} ${neItem.key}.${neItem.field}`);

    const nePayload = {
      ok: true,
      found: true,
      counts: neCounts,
      position: {
        skip: skipN,
        ofFiltered: filtered.length,
        remaining: filtered.length - skipN - 1,
        nextUrl: skipN + 1 < filtered.length ? `${b}/api/next-error?skip=${skipN+1}${sevFilter!=='all'?`&severity=${sevFilter}`:''}` : null,
      },
      finding: neItem,
      FIX_THIS: { _label:'★ THIS IS THE ITEM TO FIX', ...fixBlock },
      CONTEXT:  { ...ctxBlock },
    };

    if (fmt === 'text') {
      const HR  = '═'.repeat(66);
      const HR2 = '─'.repeat(66);
      const sev = neItem.severity.toUpperCase();
      const lines = [
        '',
        HR,
        ` NEXT ERROR REPORT — ${path.basename(GAME_FILE)}`,
        ` ${neCounts.errors} error${neCounts.errors!==1?'s':''}  ·  ${neCounts.warnings} warning${neCounts.warnings!==1?'s':''}  ·  ${neCounts.suggestions} suggestion${neCounts.suggestions!==1?'s':''}`,
        HR,
        '',
        ` Item ${skipN + 1} of ${filtered.length}${sevFilter!=='all'?` (severity=${sevFilter})`:''}`,
        '',
        HR2,
        ` ★  FIX THIS`,
        HR2,
        ` [${sev}]  ${neItem.section} › ${neItem.key}.${neItem.field}`,
        ` PROBLEM: ${neItem.msg}`,
        '',
        ` WHY: ${fixBlock.why || neItem.msg}`,
        '',
      ];
      const hf = fixBlock.howToFix;
      if (hf) {
        if (hf.curl) {
          lines.push(` HOW TO FIX:`);
          lines.push(`   ${hf.curl}`);
        } else if (hf.options) {
          lines.push(` HOW TO FIX (choose one):`);
          for (const opt of hf.options) {
            lines.push(`   Option: ${opt.label}`);
            if (opt.curl)  lines.push(`     ${opt.curl}`);
            if (opt.note)  lines.push(`     ${opt.note}`);
          }
        } else if (hf.note) {
          lines.push(` HOW TO FIX: ${hf.note}`);
        }
        if (hf.hint) lines.push(``, ` HINT: ${hf.hint}`);
      }
      lines.push('', HR2, ' ◈  CONTEXT  (reference only — not the item to fix)', HR2);
      const lookup_list = ctxBlock.lookups || [];
      if (ctxBlock.activateNode) lines.push(` activateNode: ${ctxBlock.activateNode.code} — ${ctxBlock.activateNode.label||''}${ctxBlock.activateNode.status?' ['+ctxBlock.activateNode.status+']':''}`);
      if (ctxBlock.waypointNode) lines.push(` waypointNode: ${ctxBlock.waypointNode.code} — ${ctxBlock.waypointNode.label||''}${ctxBlock.waypointNode.status?' ['+ctxBlock.waypointNode.status+']':''}`);
      if (ctxBlock.npc)          lines.push(` npc: ${ctxBlock.npc.name||ctxBlock.npc.key} @ ${ctxBlock.npc.node||''}${ctxBlock.npc.status?' ['+ctxBlock.npc.status+']':''}`);
      if (ctxBlock.node)         lines.push(` node: ${ctxBlock.node.code} — ${ctxBlock.node.label||''}${ctxBlock.node.status?' ['+ctxBlock.node.status+']':''}`);
      if (ctxBlock.terrain)      lines.push(` terrain: ${ctxBlock.terrain.key} — ${ctxBlock.terrain.label||''}`);
      if (ctxBlock.chain) {
        if (ctxBlock.chain.upstream.length)   lines.push(` chain upstream:   ${ctxBlock.chain.upstream.map(q=>`${q.id} "${q.title||''}"`).join(', ')}`);
        if (ctxBlock.chain.downstream.length) lines.push(` chain downstream: ${ctxBlock.chain.downstream.map(q=>`${q.id} "${q.title||''}"`).join(', ')}`);
      }
      if (ctxBlock.connectedNodesWithCoords?.length) lines.push(` connected nodes: ${ctxBlock.connectedNodesWithCoords.map(n=>`${n.code}(r${n.r},c${n.c})`).join(' ')}`);
      if (lookup_list.length) {
        lines.push('', ' LOOKUPS:');
        for (const l of lookup_list) lines.push(`   ${l}`);
      }
      lines.push('', HR);
      if (nePayload.position.nextUrl) {
        lines.push(` NEXT:    curl '${nePayload.position.nextUrl}'`);
        lines.push(` CURRENT: curl '${b}/api/next-error?skip=${skipN}${sevFilter!=='all'?`&severity=${sevFilter}`:''}' `);
      } else {
        lines.push(` END OF LIST — no more findings with severity="${sevFilter}"`);
      }
      lines.push(HR, '');
      cors(res);
      res.writeHead(200, { 'Content-Type':'text/plain; charset=utf-8' });
      return res.end(lines.join('\n'));
    }

    return json(res, 200, nePayload);
  }

  // ── Mission Bits catalog ──────────────────────────────────────────────────
  if (parts[0] === 'missionbits' && method === 'GET') {
    const bits = [];
    const flagRe = /checkPassFlag\s*:\s*'([^']+)'/g;
    const bitLabelRe = /bitLabel\s*:\s*'([^']+)'/;
    const failFlagRe = /checkFailFlag\s*:\s*'([^']+)'/;
    for (const { id: qId, src: qSrc } of WBAPI._splitQuestBlocks(WBAPI._rawQuestSrc)) {
      const passMatch  = flagRe.exec(qSrc); flagRe.lastIndex = 0;
      const failMatch  = failFlagRe.exec(qSrc);
      const labelMatch = bitLabelRe.exec(qSrc);
      if (!passMatch && !failMatch) continue;
      const q = WBAPI.questDb[qId] || {};
      const nodeCode = q.activateNode || q.waypointNode || null;
      const nodeLabel = nodeCode ? (WBAPI.nodeMap[nodeCode]?.label || null) : null;
      const flagName = passMatch ? passMatch[1] : failMatch[1];
      const tokenName = (labelMatch ? labelMatch[1] : flagName
        .replace(/([A-Z])/g, ' $1').trim()) + ' Token';
      bits.push({
        flagRef: flagName,
        tokenName,
        event: passMatch ? 'pass' : 'fail',
        questId: qId,
        questTitle: q.title || null,
        questType: q.type || null,
        nodeCode,
        nodeLabel,
        retryable: q.retryable || false,
      });
    }
    logResponse(method, url.pathname, 200, `${bits.length} mission bits`);
    return json(res, 200, { ok:true, count: bits.length, bits });
  }

  // ── Graph analysis ────────────────────────────────────────────────────────
  // GET /api/graph/reachability            — reachable counts + degree buckets
  // GET /api/graph/connect[?hub=LHR&minHops=8&skip=N&limit=M]
  //                                        — per-cluster connection plan with quests
  if (parts[0] === 'graph') {
    let nm = WBAPI.nodeMap;
    const OPP = { N:'S', S:'N', E:'W', W:'E' };

    // Undirected adjacency: union of both sides of each N/S/E/W edge
    // so BFS treats the graph as undirected even if one side is missing
    const undirAdj = new Map();
    for (const code of Object.keys(nm)) undirAdj.set(code, new Set());
    for (const [code, node] of Object.entries(nm)) {
      for (const d of ['N','S','E','W']) {
        const nb = node[d]; if (!nb || !nm[nb]) continue;
        undirAdj.get(code).add(nb);
        undirAdj.get(nb).add(code);
      }
    }

    // Directed degree: how many N/S/E/W slots are filled on a node (for "how full is it")
    function degree(code) {
      const n = nm[code]; if (!n) return 0;
      return ['N','S','E','W'].filter(d => n[d]).length;
    }
    // Free directions on a node (empty N/S/E/W slots)
    function freeDirs(code) {
      const n = nm[code]; if (!n) return [];
      return ['N','S','E','W'].filter(d => !n[d]);
    }

    // BFS reachability using undirected adjacency
    function bfsReach(start) {
      if (!undirAdj.has(start)) return new Set([start]);
      const visited = new Set([start]);
      const queue   = [start];
      while (queue.length) {
        const cur = queue.shift();
        for (const nb of (undirAdj.get(cur) || [])) {
          if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
        }
      }
      return visited;
    }

    // BFS distance map from a start node (undirected)
    function bfsDist(start) {
      const dist = new Map([[start, 0]]);
      const queue = [start];
      while (queue.length) {
        const cur = queue.shift();
        for (const nb of (undirAdj.get(cur) || [])) {
          if (!dist.has(nb)) { dist.set(nb, dist.get(cur) + 1); queue.push(nb); }
        }
      }
      return dist;
    }

    // Connected components within a subset of node codes (undirected)
    function components(codes) {
      const codeSet = new Set(codes);
      const visited = new Set();
      const clusters = [];
      for (const code of codes) {
        if (visited.has(code)) continue;
        const comp = new Set([code]);
        const q = [code];
        while (q.length) {
          const cur = q.shift();
          for (const nb of (undirAdj.get(cur) || [])) {
            if (codeSet.has(nb) && !comp.has(nb)) { comp.add(nb); q.push(nb); }
          }
        }
        comp.forEach(c => visited.add(c));
        clusters.push([...comp]);
      }
      return clusters;
    }

    // Build quest→node index: node → list of full quest context objects
    function questsByNode() {
      const idx = new Map();
      // Build NPC key→name lookup for quest NPC cross-ref
      const npcNames = Object.fromEntries(
        Object.entries(WBAPI.birkaNpcs || {}).map(([k, n]) => [k, n.name])
      );
      for (const [id, q] of Object.entries(WBAPI.questDb || {})) {
        for (const nodeCode of [q.activateNode, q.waypointNode].filter(Boolean)) {
          if (!idx.has(nodeCode)) idx.set(nodeCode, []);
          // Infer arc/chain from quest id prefix (e.g. "bgw_c1a1" → "bgw")
          const arcMatch = id.match(/^([a-z]+)/);
          const arc = arcMatch ? arcMatch[1] : null;
          idx.get(nodeCode).push({
            id,
            title:        q.title || id,
            type:         q.type  || 'side',
            arc,
            desc:         q.desc  || null,
            hint:         q.hint  || null,
            activateNode: q.activateNode || null,
            activateNodeLabel: q.activateNode ? (nm[q.activateNode]?.label || null) : null,
            waypointNode: q.waypointNode  || null,
            waypointNodeLabel: q.waypointNode  ? (nm[q.waypointNode]?.label  || null) : null,
            reward:       q.reward        || null,
            npcKey:       q.npc           || null,
            npcName:      q.npc ? (npcNames[q.npc] || q.npc) : null,
            role:         nodeCode === q.activateNode ? 'activateNode' : 'waypointNode',
          });
        }
      }
      return idx;
    }

    // NPC → node index
    function npcsByNode() {
      const idx = new Map();
      for (const [key, n] of Object.entries(WBAPI.birkaNpcs || {})) {
        if (!n.node) continue;
        if (!idx.has(n.node)) idx.set(n.node, []);
        idx.get(n.node).push({ key, name: n.name, occupation: n.occupation });
      }
      return idx;
    }

    const hub         = url.searchParams.get('hub') || 'LHR';
    const reachable   = bfsReach(hub);
    const allCodes    = Object.keys(nm);
    const unreachable = allCodes.filter(c => !reachable.has(c));
    const hubDistMap  = bfsDist(hub);

    // ── GET /api/graph/reachability ───────────────────────────────────────
    if (parts[1] === 'reachability' && method === 'GET') {
      const qByNode  = questsByNode();
      const nByNode  = npcsByNode();
      const clusters = components(unreachable);

      return json(res, 200, {
        ok: true,
        hub,
        counts: {
          total: allCodes.length,
          reachable: reachable.size,
          unreachable: unreachable.length,
          clusters: clusters.length,
        },
        reachableByDegree: {
          deg1: allCodes.filter(c => reachable.has(c) && degree(c) === 1),
          deg2: allCodes.filter(c => reachable.has(c) && degree(c) === 2),
          deg3: allCodes.filter(c => reachable.has(c) && degree(c) === 3),
          deg4: allCodes.filter(c => reachable.has(c) && degree(c) === 4),
        },
        unreachableClusters: clusters.map(cluster => ({
          size: cluster.length,
          nodes: cluster,
          missions: cluster.flatMap(c => (qByNode.get(c) || []).map(q => ({ node: c, ...q }))),
          npcs:     cluster.flatMap(c => (nByNode.get(c) || []).map(n => ({ node: c, ...n }))),
        })),
      });
    }

    // ── GET /api/graph/connect ─────────────────────────────────────────────
    // Per-cluster connection plan with tiered anchor suggestions and alignment validation.
    //
    // ANCHOR TIERS:
    //   Tier 1 (deg ≤ 2, 2+ free): connect_direct
    //   Tier 2 (deg = 3, 1 free):  spawn_junction first (POST /api/graph/junction)
    //   Tier 3 (deg = 4):          excluded — too crowded
    //
    // CORRIDOR RENDERING RULES (validate block fields):
    //   alignmentOk      — true if anchor+cluster share same row (E/W) or same col (N/S)
    //   axisDistance     — cells apart on shared axis; must be ≤ 4 for corridor rendering
    //   alignmentIssue   — describes off-axis or axis_distance violation with fix hint
    //   coordFixSuggestion — how to fix: adjust coord, move anchor, or add junction chain
    //
    // FIXING COORDS (when alignmentOk=false or axisDistance>4):
    //   Option A — Adjust cluster coord to share anchor's row/col:
    //     PUT /api/coords/{clusterEntry}  body: {"r":..., "c":...}
    //   Option B — Adjust anchor coord to share cluster's row/col (check impact on other links)
    //   Option C — Route via junction at the row/col intersection:
    //     POST /api/graph/junction with anchor and intermediate junction
    //     Then wire junction to cluster on the aligned axis
    if (parts[1] === 'connect' && method === 'GET') {
      const minHops    = parseInt(url.searchParams.get('minHops') || '8', 10);
      const skip       = parseInt(url.searchParams.get('skip')    || '0', 10);
      const limit      = parseInt(url.searchParams.get('limit')   || '20', 10);
      const spatialR   = parseInt(url.searchParams.get('spatialRadius') || '40', 10);
      const qByNode    = questsByNode();
      const nByNode    = npcsByNode();
      const clusters   = components(unreachable);
      const coords     = WBAPI.nodeCoords; // {code:{r,c}}
      const DIR_DELTA  = { N:[-1,0], S:[1,0], E:[0,1], W:[0,-1] };

      function spatialDist(ca, cb) {
        if (!ca || !cb) return null;
        const dr = ca.r - cb.r, dc = ca.c - cb.c;
        return Math.round(Math.sqrt(dr*dr + dc*dc));
      }

      // Given anchor coords and cluster coords, which cardinal dir from anchor points toward cluster?
      function suggestedDirection(ca, cc) {
        if (!ca || !cc) return null;
        const dr = cc.r - ca.r, dc = cc.c - ca.c;
        if (Math.abs(dr) >= Math.abs(dc)) return dr > 0 ? 'S' : 'N';
        return dc > 0 ? 'E' : 'W';
      }

      // Does the chosen direction agree with the coordinate relationship?
      function dirConsistent(anchorCoords, clusterCoords, dir) {
        if (!anchorCoords || !clusterCoords || !dir) return null;
        const [dr, dc] = DIR_DELTA[dir];
        const actualDr = clusterCoords.r - anchorCoords.r;
        const actualDc = clusterCoords.c - anchorCoords.c;
        if (dr !== 0) return (dr > 0) === (actualDr > 0);
        if (dc !== 0) return (dc > 0) === (actualDc > 0);
        return null;
      }

      // Next J-code (advisory — actual POST /api/graph/junction uses live state)
      function nextJCode() {
        const nums = Object.keys(nm).filter(c => /^J\d+$/.test(c)).map(c => parseInt(c.slice(1), 10));
        return `J${(nums.length ? Math.max(...nums) : 0) + 1}`;
      }

      // Build tiered anchor pools — enriched with coords
      const directPool   = []; // Tier 1: deg ≤ 2 (2+ free dirs)
      const junctionPool = []; // Tier 2: deg = 3 (1 free dir)
      for (const c of allCodes) {
        if (!reachable.has(c)) continue;
        const d  = degree(c);
        const fd = freeDirs(c);
        if (d >= 4 || fd.length === 0) continue;
        const entry = {
          code: c, degree: d, freeDirs: fd,
          distFromHub: hubDistMap.get(c) ?? 0,
          label: nm[c]?.label,
          isJunction: !!(nm[c]?.junction),
          terrain: nm[c]?.name || null,
          coords: coords[c] || null,
        };
        if (d <= 2) directPool.push(entry);
        else        junctionPool.push(entry);
      }
      directPool.sort((a, b) => a.degree !== b.degree ? a.degree - b.degree : b.distFromHub - a.distFromHub);
      junctionPool.sort((a, b) => b.distFromHub - a.distFromHub);

      const minAnchorDist = Math.max(0, minHops - 1);
      function pickBest(pool) {
        const meets = pool.filter(a => a.distFromHub >= minAnchorDist);
        return meets.length ? meets : pool;
      }

      const suggestions = clusters.map((cluster, i) => {
        const missions = cluster.flatMap(c => (qByNode.get(c) || []).map(q => ({ node: c, nodeLabel: nm[c]?.label, ...q })));
        const npcs     = cluster.flatMap(c => (nByNode.get(c) || []).map(n => ({ node: c, nodeLabel: nm[c]?.label, ...n })));
        const clusterEntry       = (missions[0]?.node) || (npcs[0]?.node) || cluster[0];
        const clusterEntryLabel  = nm[clusterEntry]?.label;
        const clusterEntryCoords = coords[clusterEntry] || null;

        // Bounding box of cluster nodes that have coords
        const clusterWithCoords = cluster.filter(c => coords[c]);
        const clusterBounds = clusterWithCoords.length ? {
          minR: Math.min(...clusterWithCoords.map(c => coords[c].r)),
          maxR: Math.max(...clusterWithCoords.map(c => coords[c].r)),
          minC: Math.min(...clusterWithCoords.map(c => coords[c].c)),
          maxC: Math.max(...clusterWithCoords.map(c => coords[c].c)),
          nodesWithCoords:    clusterWithCoords.length,
          nodesWithoutCoords: cluster.length - clusterWithCoords.length,
        } : null;

        // Spatially-ranked anchors: reachable nodes with coords near cluster entry
        const spatialAnchors = clusterEntryCoords
          ? allCodes
              .filter(c => reachable.has(c) && coords[c] && freeDirs(c).length > 0 && degree(c) < 4)
              .map(c => {
                const sd      = spatialDist(coords[c], clusterEntryCoords);
                const fd      = freeDirs(c);
                const sugDir  = suggestedDirection(coords[c], clusterEntryCoords);
                const bestDir = fd.includes(sugDir) ? sugDir : fd[0];
                const isDir   = degree(c) <= 2 ? 'connect_direct' : 'spawn_junction';
                return {
                  code: c, label: nm[c]?.label, degree: degree(c),
                  freeDirs: fd, coords: coords[c], spatialDist: sd,
                  distFromHub: hubDistMap.get(c) ?? 0,
                  isJunction: !!(nm[c]?.junction), terrain: nm[c]?.name || null,
                  suggestedDir: sugDir, bestDir, dirAvailable: fd.includes(sugDir),
                  action: isDir,
                  curl: isDir === 'connect_direct'
                    ? `curl -XPUT http://localhost:1367/api/node/${c} -H 'Content-Type: application/json' -d '{"${bestDir}":"${clusterEntry}"}' && curl -XPUT http://localhost:1367/api/node/${clusterEntry} -H 'Content-Type: application/json' -d '{"${OPP[bestDir]}":"${c}"}'`
                    : `curl -XPOST http://localhost:1367/api/graph/junction -H 'Content-Type: application/json' -d '{"anchor":"${c}","anchorDir":"${bestDir}","clusterEntry":"${clusterEntry}","clusterDir":"${bestDir}"}'`,
                };
              })
              .filter(a => a.spatialDist !== null && a.spatialDist <= spatialR)
              .sort((a, b) => a.spatialDist - b.spatialDist)
              .slice(0, 6)
          : [];

        const bestDirect   = pickBest(directPool);
        const bestJunction = pickBest(junctionPool);

        const directAnchors = bestDirect.slice(0, 3).map(a => {
          const sugDir  = suggestedDirection(a.coords, clusterEntryCoords);
          const bestDir = a.freeDirs.includes(sugDir) ? sugDir : a.freeDirs[0];
          const sd      = spatialDist(a.coords, clusterEntryCoords);
          return {
            code: a.code, label: a.label, degree: a.degree,
            freeDirs: a.freeDirs, distFromHub: a.distFromHub,
            isJunction: a.isJunction, terrain: a.terrain,
            coords: a.coords, spatialDist: sd,
            suggestedDir: sugDir, dirAvailable: a.freeDirs.includes(sugDir),
            action: 'connect_direct',
            hopsToCluster: a.distFromHub + 1,
            meetsMinHops: a.distFromHub + 1 >= minHops,
            curl: `curl -XPUT http://localhost:1367/api/node/${a.code} -H 'Content-Type: application/json' -d '{"${bestDir}":"${clusterEntry}"}' && curl -XPUT http://localhost:1367/api/node/${clusterEntry} -H 'Content-Type: application/json' -d '{"${OPP[bestDir]}":"${a.code}"}'`,
          };
        });

        const jCode = nextJCode();
        const junctionAnchors = bestJunction.slice(0, 2).map(a => {
          const sugDir  = suggestedDirection(a.coords, clusterEntryCoords);
          const bestDir = a.freeDirs.includes(sugDir) ? sugDir : a.freeDirs[0];
          const sd      = spatialDist(a.coords, clusterEntryCoords);
          return {
            code: a.code, label: a.label, degree: a.degree,
            freeDirs: a.freeDirs, distFromHub: a.distFromHub,
            isJunction: a.isJunction, terrain: a.terrain,
            coords: a.coords, spatialDist: sd,
            suggestedDir: sugDir, dirAvailable: a.freeDirs.includes(sugDir),
            action: 'spawn_junction',
            hopsToCluster: a.distFromHub + 2,
            meetsMinHops: a.distFromHub + 2 >= minHops,
            junctionCode: jCode, junctionTerrain: a.terrain,
            curl: `curl -XPOST http://localhost:1367/api/graph/junction -H 'Content-Type: application/json' -d '{"anchor":"${a.code}","anchorDir":"${bestDir}","clusterEntry":"${clusterEntry}","clusterDir":"${bestDir}"}'`,
          };
        });

        // Prefer spatial anchor when it is much closer than graph-theoretic best
        const topSpatial  = spatialAnchors[0] || null;
        const topGraph    = directAnchors[0] || junctionAnchors[0] || null;
        const graphSD     = topGraph ? spatialDist(topGraph.coords, clusterEntryCoords) : null;
        const spatialSD   = topSpatial ? topSpatial.spatialDist : null;
        const useSpatial  = topSpatial && (graphSD === null || spatialSD < (graphSD || Infinity) / 2);
        const bestAnchor  = useSpatial ? topSpatial : topGraph;

        // Full validate block with spatial + graph context
        let validate = null;
        if (bestAnchor) {
          const anchorCoords  = bestAnchor.coords || null;
          const sd            = spatialDist(anchorCoords, clusterEntryCoords);
          const sugDir        = bestAnchor.suggestedDir || bestAnchor.freeDirs?.[0] || null;
          const chosenDir     = bestAnchor.bestDir || bestAnchor.freeDirs?.[0] || sugDir;
          const consistent    = dirConsistent(anchorCoords, clusterEntryCoords, chosenDir);
          const coordWarn     = (!anchorCoords || !clusterEntryCoords)
            ? `Missing coords: ${[!anchorCoords && bestAnchor.code, !clusterEntryCoords && clusterEntry].filter(Boolean).join(', ')} — spatial check skipped`
            : sd > 30
            ? `Spatial gap ${sd} cells between anchor and cluster — consider a closer anchor from spatialAnchors`
            : consistent === false
            ? `Direction ${chosenDir} disagrees with coords (anchor ${anchorCoords.r},${anchorCoords.c} → cluster ${clusterEntryCoords.r},${clusterEntryCoords.c}; expected ${sugDir})`
            : null;

          // ── Alignment analysis (corridor-rendering rules) ───────────────
          // Rule 1: connected nodes must share a row (E/W) or column (N/S)
          // Rule 2: axis distance must be ≤ 4 cells; longer spans need junction chains
          // Rule 3: fix by adjusting one node's coord OR inserting junction nodes on the shared axis
          let alignmentOk = null, axisDistance = null, alignmentIssue = null, coordFixSuggestion = null;
          if (anchorCoords && clusterEntryCoords && chosenDir) {
            const isNS = chosenDir === 'N' || chosenDir === 'S';
            const isEW = chosenDir === 'E' || chosenDir === 'W';
            const sameRow = anchorCoords.r === clusterEntryCoords.r;
            const sameCol = anchorCoords.c === clusterEntryCoords.c;
            alignmentOk = isNS ? sameCol : isEW ? sameRow : null;
            if (alignmentOk) {
              axisDistance = isNS ? Math.abs(clusterEntryCoords.r - anchorCoords.r) : Math.abs(clusterEntryCoords.c - anchorCoords.c);
              if (axisDistance > 4) {
                const jCount = Math.ceil(axisDistance / 4) - 1;
                alignmentIssue = `axis_distance:${axisDistance} — exceeds 4-cell limit; insert ${jCount} junction node(s) spaced 4 cells apart on ${isNS ? 'column' : 'row'} ${isNS ? anchorCoords.c : anchorCoords.r}`;
                const step = 4, jPositions = [];
                const aVal = isNS ? anchorCoords.r : anchorCoords.c;
                const cVal = isNS ? clusterEntryCoords.r : clusterEntryCoords.c;
                const dir1 = cVal > aVal ? step : -step;
                for (let p = aVal + dir1, iter = 0; iter < 20 && Math.abs(p - cVal) > 0; p += dir1, iter++) {
                  if (p === cVal) break;
                  jPositions.push(isNS ? `r:${p},c:${anchorCoords.c}` : `r:${anchorCoords.r},c:${p}`);
                }
                coordFixSuggestion = `Add junction nodes at: ${jPositions.join(' → ')} (POST /api/graph/junction for each)`;
              }
            } else {
              const anchorAxis = isNS ? `col ${anchorCoords.c}` : `row ${anchorCoords.r}`;
              const clusterAxis = isNS ? `col ${clusterEntryCoords.c}` : `row ${clusterEntryCoords.r}`;
              alignmentIssue = `alignment:off_axis — ${isNS ? 'N/S' : 'E/W'} link requires shared ${isNS ? 'column' : 'row'} (anchor ${anchorAxis} ≠ cluster ${clusterAxis})`;
              const targetAxis = isNS ? anchorCoords.c : anchorCoords.r;
              const clusterAxisVal = isNS ? clusterEntryCoords.c : clusterEntryCoords.r;
              coordFixSuggestion = `Fix coords: move ${clusterEntry} ${isNS ? 'column' : 'row'} from ${clusterAxisVal} to ${targetAxis} (PUT /api/coords/${clusterEntry}), OR move ${bestAnchor.code} ${isNS ? 'column' : 'row'} from ${targetAxis} to ${clusterAxisVal}, OR route via junction at (${isNS ? `r:${anchorCoords.r},c:${clusterEntryCoords.c}` : `r:${clusterEntryCoords.r},c:${anchorCoords.c}`}) with two aligned legs`;
            }
          }

          const isJunctionAction = bestAnchor.action === 'spawn_junction' || (bestAnchor.degree != null && bestAnchor.degree >= 3);
          validate = {
            action: isJunctionAction ? 'spawn_junction' : 'connect_direct',
            description: isJunctionAction
              ? `Spawn junction ${bestAnchor.junctionCode || jCode} on ${bestAnchor.code} (${bestAnchor.label}), wire to ${clusterEntry} (${clusterEntryLabel})`
              : `Wire ${bestAnchor.code} (${bestAnchor.label}) → ${clusterEntry} (${clusterEntryLabel}) directly`,
            // Anchor
            anchor: bestAnchor.code, anchorLabel: bestAnchor.label,
            anchorCoords, anchorDeg: bestAnchor.degree,
            anchorFreeDirs: bestAnchor.freeDirs, anchorTerrain: bestAnchor.terrain,
            // Cluster
            clusterEntry, clusterEntryLabel, clusterEntryCoords, clusterBounds,
            // Spatial analysis
            spatialDist: sd, suggestedDir: sugDir, chosenDir,
            dirConsistent: consistent, coordWarning: coordWarn, spatialOk: coordWarn === null,
            // Alignment analysis — corridor rendering rules
            // Rule 1: connected nodes must share row (E/W) or column (N/S) — alignmentOk
            // Rule 2: axis distance must be ≤ 4 cells — axisDistance
            // Rule 3: if off-axis or too far, coordFixSuggestion explains how to fix
            alignmentOk, axisDistance, alignmentIssue, coordFixSuggestion,
            // Nearby reachable anchors ranked by spatial proximity (the list I was searching manually)
            spatialAnchors,
            // Graph analysis
            hops: bestAnchor.hopsToCluster || (bestAnchor.distFromHub + 1),
            meetsMinHops: bestAnchor.meetsMinHops,
            // Execution
            steps: isJunctionAction
              ? [`POST /api/graph/junction  body: {"anchor":"${bestAnchor.code}","anchorDir":"${chosenDir}","clusterEntry":"${clusterEntry}","clusterDir":"${chosenDir}"}`]
              : [
                  `PUT /api/node/${bestAnchor.code}   body: {"${chosenDir}":"${clusterEntry}"}`,
                  `PUT /api/node/${clusterEntry}  body: {"${OPP[chosenDir]}":"${bestAnchor.code}"}`,
                ],
            curl: bestAnchor.curl,
            pickedBy: useSpatial ? 'spatial_proximity' : 'graph_distance',
          };
        }

        return {
          clusterIndex: i, size: cluster.length, nodes: cluster,
          clusterEntry, clusterEntryLabel, clusterEntryCoords, clusterBounds,
          missions, npcs,
          directAnchors, junctionAnchors, spatialAnchors,
          validate,
          note: !bestAnchor
            ? 'No reachable anchors (all deg-4 or full)'
            : (bestAnchor.degree <= 2 || bestAnchor.action === 'connect_direct')
            ? `deg-${bestAnchor.degree} direct anchor — connect with one PUT pair`
            : `deg-${bestAnchor.degree} anchor full — spawn junction first`,
        };
      });

      const page = suggestions.slice(skip, skip + limit);
      return json(res, 200, { ok:true, hub, minHops, spatialRadius: spatialR, total:suggestions.length, skip, limit, results:page, reminder:'Use API only: PUT /api/node/{code}, PUT /api/coords/{code}, POST /api/graph/junction — never edit roll2hit-v3.html directly.' });
    }

    // ── POST /api/graph/junction ───────────────────────────────────────────
    // Creates a junction node on a reachable anchor and optionally wires it
    // to a cluster entry node — all in one step.
    //
    // Body:
    //   anchor       — reachable node code to attach junction to
    //   anchorDir    — N|S|E|W direction on the anchor for the new junction
    //   clusterEntry — (optional) unreachable node to wire the junction toward
    //   clusterDir   — N|S|E|W direction on the junction pointing to clusterEntry
    //   text         — (optional) flavor text for the junction node
    //   act          — (optional) act number (defaults to anchor's act)
    if (parts[1] === 'junction' && method === 'POST') {
      let body;
      try { body = await readBody(req); } catch(e) {
        return json(res, 400, { error:'Invalid JSON' });
      }
      const { anchor, anchorDir, clusterEntry, clusterDir, text, act } = body || {};

      if (!anchor || !anchorDir || !['N','S','E','W'].includes(anchorDir))
        return json(res, 400, { error:'Required: anchor (node code), anchorDir (N|S|E|W)' });

      const anchorNode = nm[anchor];
      if (!anchorNode)
        return json(res, 400, { error:`Anchor node "${anchor}" not in NODE_MAP` });
      if (!reachable.has(anchor))
        return json(res, 400, { error:`Anchor "${anchor}" is not reachable from hub "${hub}"` });
      if (degree(anchor) >= 4)
        return json(res, 400, { error:`Anchor "${anchor}" is full (deg 4) — too crowded to attach a junction` });
      if (anchorNode[anchorDir])
        return json(res, 400, { error:`Anchor "${anchor}.${anchorDir}" is already occupied by "${anchorNode[anchorDir]}"` });

      if (clusterEntry) {
        if (!nm[clusterEntry])
          return json(res, 400, { error:`clusterEntry "${clusterEntry}" not in NODE_MAP` });
        if (reachable.has(clusterEntry))
          return json(res, 400, { error:`clusterEntry "${clusterEntry}" is already reachable` });
        if (!clusterDir || !['N','S','E','W'].includes(clusterDir))
          return json(res, 400, { error:'clusterDir (N|S|E|W) required when clusterEntry is given' });
        if (degree(clusterEntry) >= 4)
          return json(res, 400, { error:`clusterEntry "${clusterEntry}" is full (deg 4)` });
        if (nm[clusterEntry][OPP[clusterDir]])
          return json(res, 400, { error:`clusterEntry "${clusterEntry}.${OPP[clusterDir]}" already occupied by "${nm[clusterEntry][OPP[clusterDir]]}"` });
      }

      // Auto-generate next J-code
      const nums = Object.keys(nm).filter(c => /^J\d+$/.test(c)).map(c => parseInt(c.slice(1), 10));
      const jCode = `J${(nums.length ? Math.max(...nums) : 0) + 1}`;

      const junctionTerrain = anchorNode.name || 'junction';
      const junctionAct     = act !== undefined ? Number(act) : (anchorNode.act || 1);
      const junctionLabel   = `Junction near ${anchorNode.label || anchor}`;
      const junctionText    = text || `The road branches here, a junction between ${anchorNode.label || anchor} and the ${anchorDir.toLowerCase()} path.`;

      // Junction body — pre-wired to anchor and optionally to clusterEntry
      const junctionBody = {
        name:    junctionTerrain,
        label:   junctionLabel,
        text:    junctionText,
        act:     junctionAct,
        junction: true,
        npc:     null,
        battle:  null,
        loot:    null,
        sleep:   false,
        [OPP[anchorDir]]: anchor,
        ...(clusterEntry && clusterDir ? { [clusterDir]: clusterEntry } : {}),
      };

      // Insert into NODE_MAP source
      const jEntry = serializeNodeLiteral(jCode, junctionBody);
      const ins = insertBeforeSectionClose('NODE_MAP', jEntry);
      if (!ins.ok) return json(res, 500, { error:`NODE_MAP insert failed: ${ins.error}` });
      const newNum = Object.values(WBAPI.nodeMap).reduce((m, n) => Math.max(m, n.num || 0), 0) + 1;
      WBAPI.nodeMap[jCode] = { ...junctionBody, num: newNum };

      // Wire anchor → junction
      const r1 = WBAPI.editField('node', anchor, anchorDir, jCode);
      if (!r1.ok) return json(res, 500, { error:`Wire anchor ${anchor}.${anchorDir}=${jCode} failed: ${r1.error}` });

      // Wire clusterEntry back → junction
      let clusterWired = false;
      if (clusterEntry && clusterDir) {
        const r2 = WBAPI.editField('node', clusterEntry, OPP[clusterDir], jCode);
        clusterWired = r2.ok;
        if (!r2.ok) logRow('warn', `clusterEntry wire ${clusterEntry}.${OPP[clusterDir]}=${jCode} failed: ${r2.error}`);
      }

      WBAPI._buildIndexes();
      logRow('junction', `${jCode}  ·  terrain:${junctionTerrain}  ·  act:${junctionAct}`);
      logRow('wires', `${anchor}.${anchorDir}→${jCode}  ${jCode}.${OPP[anchorDir]}→${anchor}${clusterEntry ? `  ${clusterEntry}.${OPP[clusterDir]}→${jCode}  ${jCode}.${clusterDir}→${clusterEntry}` : ''}`);
      logResponse('POST', url.pathname, 201, `junction/${jCode}`);

      return saveAndRestart(res, 201, {
        ok: true,
        junctionCode: jCode,
        junctionTerrain, junctionAct, junctionLabel,
        anchor, anchorDir,
        clusterEntry: clusterEntry || null,
        clusterDir:   clusterDir   || null,
        clusterWired,
        junctionNode: WBAPI.nodeMap[jCode],
        note: `Junction ${jCode} created and wired to ${anchor}.${anchorDir}.${clusterEntry ? ` Cluster entry ${clusterEntry} also wired.` : ''}`,
        reminder: 'Use API only: PUT /api/node/{code}, PUT /api/coords/{code}, POST /api/graph/junction — never edit roll2hit-v3.html directly.',
      });
    }

    // ── suggestBetween — ranked placement candidates for an off/isolated node ──
    // Given source coords ca and destination coords cb (may be null), returns up to 7
    // candidate positions in priority order:
    //   1. True midpoint between source and destination
    //   2. Source row, mid-column
    //   3. Source column, mid-row
    //   4. Destination row, mid-column
    //   5. Destination column, mid-row
    //   6. Source row, destination column  (L-bend via source)
    //   7. Destination row, source column  (L-bend via destination)
    // Each candidate: {r, c, reason, free, occupiedBy}
    // When cb is null (target has no coords), estimates position 4 steps along dir from ca.
    function suggestBetween(ca, cb, dir, allCoords, excludeCode, step, sharedOccupied) {
      const STEP = step || 4;
      // If destination has no coords, project a target in the given direction
      const DR4 = { N:-STEP, S:STEP, E:0, W:0 };
      const DC4 = { N:0, S:0, E:STEP, W:-STEP };
      const projected = cb || { r: ca.r + DR4[dir]*3, c: ca.c + DC4[dir]*3 };

      // sharedOccupied: caller-built map (all coords). Build it once per batch, not per call.
      const occupied = sharedOccupied || (() => {
        const m = new Map();
        for (const [code, pos] of Object.entries(allCoords)) m.set(`${pos.r},${pos.c}`, code);
        return m;
      })();

      // Snap to nearest grid step
      const snap = v => Math.round(v / STEP) * STEP;

      const out = [];
      const seen = new Set();
      function add(r, c, reason) {
        r = snap(r); c = snap(c);
        const key = `${r},${c}`;
        if (seen.has(key)) return;
        seen.add(key);
        const occ = occupied.get(key) || null;
        // treat excludeCode's own position as free (caller may have moved it)
        const isFree = !occ || occ === excludeCode;
        const cmd = excludeCode
          ? `curl -s -XPUT http://localhost:${PORT}/api/coords/${excludeCode} -H 'Content-Type: application/json' -d '{"r":${r},"c":${c}}'`
          : `curl -s -XPOST http://localhost:${PORT}/api/node -H 'Content-Type: application/json' -d '{"code":"J_new","name":"junction","label":"Junction","act":1}' && curl -s -XPUT http://localhost:${PORT}/api/coords/J_new -H 'Content-Type: application/json' -d '{"r":${r},"c":${c}}'`;
        out.push({ r, c, reason, free: isFree, occupiedBy: isFree ? null : occ, moveCmd: cmd });
      }

      const mr = (ca.r + projected.r) / 2;
      const mc = (ca.c + projected.c) / 2;

      add(mr, mc,           'midpoint between source and destination');
      add(ca.r, mc,         'source row, mid-column');
      add(mr,  ca.c,        'source column, mid-row');
      add(projected.r, mc,  'destination row, mid-column');
      add(mr,  projected.c, 'destination column, mid-row');
      add(ca.r, projected.c,'source row, destination column');
      add(projected.r, ca.c,'destination row, source column');

      return out;
    }

    // ── GET /api/graph/validate/{code} ───────────────────────────────────────
    // Check one node's N/E/S/W connections for walkability (gap ≤ maxGap, same axis)
    if (parts[1] === 'validate' && method === 'GET') {
      const code = parts[2];
      const maxGap = Math.max(1, parseInt(url.searchParams.get('maxGap') || '4', 10));
      if (!code || !nm[code]) return json(res, 404, { error:`Node "${code}" not found` });
      const cc = WBAPI.nodeCoords[code];
      const allCoords = WBAPI.nodeCoords;
      const result = { code, coords: cc || null, maxGap, connections: {}, also_target_of: [] };
      const DIRS4 = ['N','E','S','W'];

      for (const d of DIRS4) {
        const tgt = nm[code]?.[d];
        if (!tgt) { result.connections[d] = { target:null, status:'unset' }; continue; }
        const tc = WBAPI.nodeCoords[tgt];
        if (!cc) { result.connections[d] = { target:tgt, status:'src_no_coords' }; continue; }
        if (!tc) {
          // Target has no coordinates at all — suggest where to place it
          const candidates = suggestBetween(cc, null, d, allCoords, tgt);
          const best = candidates.find(c => c.free) || candidates[0];
          result.connections[d] = {
            target: tgt, status: 'tgt_no_coords',
            fix: `PUT /api/coords/${tgt} {"r":${best.r},"c":${best.c}}`,
            moveSuggestion: {
              node: tgt,
              note: `"${tgt}" has no coordinates — place it between "${code}" and the path ahead`,
              candidates,
              recommended: best,
            },
          };
          continue;
        }
        const dr = tc.r - cc.r, dc = tc.c - cc.c;
        const gap  = d in {N:1,S:1} ? Math.abs(dr) : Math.abs(dc);
        const off  = d in {N:1,S:1} ? Math.abs(dc) : Math.abs(dr);
        const goodDir = (d==='N'&&dr<0)||(d==='S'&&dr>0)||(d==='E'&&dc>0)||(d==='W'&&dc<0);
        let status = 'ok', fix = null, moveSuggestion = null;

        if (off > 0 && gap > maxGap) {
          status = 'diagonal_and_gap';
          fix = `corner-junction or move both nodes`;
          // Suggest moving the target to be between source and itself, snapped to axis
          const candidates = suggestBetween(cc, tc, d, allCoords, tgt);
          const best = candidates.find(c => c.free) || candidates[0];
          moveSuggestion = {
            node: tgt,
            note: `"${tgt}" is diagonal AND too far — move it between "${code}" and its current position`,
            candidates,
            recommended: best,
          };
        } else if (off > 0) {
          status = 'off_axis';
          // Axis-align: snap target onto the correct row (E/W) or column (N/S) of source, then check distance
          const axisSnapped = (d==='N'||d==='S') ? { r: tc.r, c: cc.c } : { r: cc.r, c: tc.c };
          const candidates = suggestBetween(cc, axisSnapped, d, allCoords, tgt);
          const best = candidates.find(c => c.free) || candidates[0];
          fix = `Move "${tgt}" onto the same ${(d==='N'||d==='S')?'column':'row'} as "${code}"`;
          moveSuggestion = {
            node: tgt,
            note: `"${tgt}" is off-axis — move it onto the correct ${(d==='N'||d==='S')?'column':'row'} of "${code}"`,
            candidates,
            recommended: best,
          };
        } else if (!goodDir) {
          status = 'wrong_direction';
          fix = `coords reversed — check if ${tgt} is actually ${OPP[d]} of ${code}`;
        } else if (gap > maxGap) {
          status = 'gap_too_large';
          fix = `POST /api/graph/fill-gap {"from":"${code}","dir":"${d}","to":"${tgt}","maxGap":${maxGap}}`;
          // Suggest placing an intermediate junction between them
          const candidates = suggestBetween(cc, tc, d, allCoords, null);
          const best = candidates.find(c => c.free) || candidates[0];
          moveSuggestion = {
            node: '(junction)',
            note: `Gap=${gap} — insert a junction between "${code}" and "${tgt}"`,
            candidates,
            recommended: best,
          };
        }
        result.connections[d] = { target:tgt, targetCoords:tc, gap, axisOffset:off, goodDirection:goodDir, status, fix, moveSuggestion };
      }

      // Check: is this node the target of any off-axis connection?
      for (const [src, dirs] of Object.entries(nm)) {
        if (src === code) continue;
        const sc = WBAPI.nodeCoords[src];
        for (const d of DIRS4) {
          if (dirs[d] !== code) continue;
          if (!sc || !cc) continue;
          const dr = cc.r - sc.r, dc = cc.c - sc.c;
          const gap = d in {N:1,S:1} ? Math.abs(dr) : Math.abs(dc);
          const off = d in {N:1,S:1} ? Math.abs(dc) : Math.abs(dr);
          if (off > 0 || gap > maxGap) {
            const candidates = suggestBetween(sc, cc, d, allCoords, code);
            const best = candidates.find(c => c.free) || candidates[0];
            result.also_target_of.push({
              from:src, fromDir:d, fromCoords:sc, gap, axisOffset:off,
              status: off>0 ? 'off_axis' : 'gap_too_large',
              moveSuggestion: {
                node: code,
                note: `"${code}" is off from "${src}"'s ${d} connection — move it between them`,
                candidates,
                recommended: best,
              },
            });
          }
        }
      }

      // Diagnosis for corner nodes
      const incoming = result.also_target_of;
      const nsIncoming = incoming.filter(x=>x.fromDir in {N:1,S:1});
      const ewIncoming = incoming.filter(x=>x.fromDir in {E:1,W:1});
      if ((nsIncoming.length && ewIncoming.length) || (Object.values(result.connections).some(c=>c.status==='off_axis'))) {
        const rFromEW = cc ? cc.r : '?';
        const cFromNS = nsIncoming[0] ? WBAPI.nodeCoords[nsIncoming[0].from]?.c : '?';
        result.diagnosis = `CORNER NODE — must sit at axis intersection: r=${rFromEW} c=${cFromNS}`;
        if (cc && cFromNS !== '?' && (cc.c !== cFromNS)) {
          const correctPos = { r: rFromEW, c: cFromNS };
          result.fixCommand = `PUT /api/coords/${code} {"r":${rFromEW},"c":${cFromNS}}`;
          // Also check collision at the correct position
          const occAt = Object.entries(allCoords).find(([k,v]) => k !== code && v.r === correctPos.r && v.c === correctPos.c);
          if (occAt) result.fixConflict = `(${rFromEW},${cFromNS}) is occupied by "${occAt[0]}" — swap or move it first`;
        }
      }

      logResponse('GET', url.pathname, 200, `validate/${code}`);
      return json(res, 200, result);
    }

    // ── GET /api/graph/broken ─────────────────────────────────────────────────
    // Find all connected pairs that violate walkability rules
    if (parts[1] === 'broken' && method === 'GET') {
      const maxGap = Math.max(1, parseInt(url.searchParams.get('maxGap') || '4', 10));
      const root   = url.searchParams.get('root') || null;
      const fast   = url.searchParams.get('fast') === 'true'; // skip suggestions, count only
      const DIRS4 = ['N','E','S','W'];
      const allCoords = WBAPI.nodeCoords;
      const edges = [], seen = new Set();
      let totalChecked = 0;

      // Build occupied map once — shared across all suggestBetween calls (O(N) amortised vs O(N) per call)
      const occupiedMap = fast ? null : new Map(Object.entries(allCoords).map(([c,p]) => [`${p.r},${p.c}`, c]));

      for (const [code, dirs] of Object.entries(nm)) {
        const cc = WBAPI.nodeCoords[code];
        for (const d of DIRS4) {
          const tgt = dirs[d]; if (!tgt) continue;
          const key = [code,tgt].sort().join(':');
          if (seen.has(key)) continue; seen.add(key); totalChecked++;
          const tc = WBAPI.nodeCoords[tgt];
          if (!cc || !tc) {
            if (fast) { edges.push({ from:code, dir:d, to:tgt, type:'missing_coords' }); continue; }
            // At least one node is unpositioned — suggest where to put it
            const missingCode = !cc ? code : tgt;
            const knownCoords = !cc ? tc : cc;
            const candidates = knownCoords
              ? suggestBetween(knownCoords, null, d, allCoords, missingCode, undefined, occupiedMap)
              : null;
            const best = candidates ? (candidates.find(c => c.free) || candidates[0]) : null;
            edges.push({
              from:code, dir:d, to:tgt, type:'missing_coords',
              missingCoords: missingCode,
              moveSuggestion: candidates ? {
                node: missingCode,
                note: `"${missingCode}" has no coordinates — place it between the connected nodes`,
                recommended: best,
                candidates,
              } : null,
            });
            continue;
          }
          const dr = tc.r-cc.r, dc = tc.c-cc.c;
          const gap = d in {N:1,S:1} ? Math.abs(dr) : Math.abs(dc);
          const off = d in {N:1,S:1} ? Math.abs(dc) : Math.abs(dr);
          let type = null;
          if (off>0 && gap>maxGap) type = 'diagonal_and_gap';
          else if (off>0)          type = 'diagonal';
          else if (gap>maxGap)     type = 'gap_too_large';
          if (type) {
            if (fast) { edges.push({ from:code, dir:d, to:tgt, type, gap, axisOffset:off }); continue; }
            const juncsNeeded = type==='gap_too_large' ? Math.ceil(gap/maxGap)-1 : null;
            // For diagonal/off-axis: suggest moving the destination to be between source and itself snapped to axis
            // For gap: suggest placing intermediate junction(s) between the two
            const moveTarget = type === 'gap_too_large' ? null : tgt;  // null = new junction
            const axisSnapped = (type !== 'gap_too_large')
              ? ((d==='N'||d==='S') ? { r: tc.r, c: cc.c } : { r: cc.r, c: tc.c })
              : tc;
            const candidates = suggestBetween(cc, axisSnapped, d, allCoords, moveTarget, undefined, occupiedMap);
            const best = candidates.find(c => c.free) || candidates[0];
            const noteMap = {
              diagonal:        `"${tgt}" is off-axis — move it onto the correct axis of "${code}"`,
              diagonal_and_gap:`"${tgt}" is diagonal AND too far — move it between "${code}" and its axis-snapped position`,
              gap_too_large:   `Gap=${gap} between "${code}" and "${tgt}" — insert ${juncsNeeded||1} junction(s) between them`,
            };
            edges.push({
              from:code, fromCoords:cc, dir:d, to:tgt, toCoords:tc,
              gap, axisOffset:off, type,
              junctionsNeeded: juncsNeeded,
              fix: type==='diagonal' ? 'corner_junction' : type==='gap_too_large' ? 'fill_gap' : 'both',
              moveSuggestion: {
                node: moveTarget || '(new junction)',
                note: noteMap[type],
                recommended: best,
                candidates,
              },
            });
          }
        }
      }
      const categories = {};
      for (const e of edges) categories[e.type] = (categories[e.type]||0)+1;
      logResponse('GET', url.pathname, 200, `${edges.length} broken edges`);
      return json(res, 200, { ok:true, maxGap, totalChecked, broken:edges.length, categories, edges });
    }

    // ── POST /api/graph/fill-gap ──────────────────────────────────────────────
    // Plan (or execute) inserting junction chain between two directly-connected nodes
    if (parts[1] === 'fill-gap' && method === 'POST') {
      let body; try { body = await readBody(req); } catch(e) { return json(res,400,{error:'Invalid JSON'}); }
      const { from: src, dir, to: tgt, maxGap=4, step=4, terrain='inherit', dryRun=true } = body||{};
      if (!src||!dir||!tgt) return json(res,400,{error:'Required: from, dir, to'});
      if (!nm[src]||!nm[tgt]) return json(res,400,{error:`Node not found: ${nm[src]?tgt:src}`});
      const sc = WBAPI.nodeCoords[src], tc = WBAPI.nodeCoords[tgt];
      if (!sc) return json(res,400,{error:`${src} has no coordinates`});
      if (!tc) return json(res,400,{error:`${tgt} has no coordinates`});
      const DR4={N:-1,S:1,E:0,W:0}, DC4={N:0,S:0,E:1,W:-1};
      const dr=tc.r-sc.r, dc=tc.c-sc.c;
      const gap = dir in {N:1,S:1} ? Math.abs(dr) : Math.abs(dc);
      const off = dir in {N:1,S:1} ? Math.abs(dc) : Math.abs(dr);
      if (off>0) return json(res,400,{error:`Connection is off-axis (offset=${off}). Use POST /api/graph/corner-junction instead.`});
      if (gap<=maxGap) return json(res,200,{ok:true,message:'Gap is already within limit',gap,maxGap});

      const juncsNeeded = Math.ceil(gap/step)-1;
      const terrainType = terrain==='inherit' ? (nm[src]?.name||'junction') : terrain;
      const occupied = new Map(Object.entries(WBAPI.nodeCoords).map(([c,p])=>[`${p.r},${p.c}`,c]));

      // Generate positions
      const plan = [];
      const nums = Object.keys(nm).filter(c=>/^J\d+$/.test(c)).map(c=>+c.slice(1));
      let nextJ = (nums.length?Math.max(...nums):0)+1;

      for (let i=1; i<=juncsNeeded; i++) {
        const r = sc.r + DR4[dir]*step*i;
        const c = sc.c + DC4[dir]*step*i;
        const key = `${r},${c}`;
        const slot = occupied.get(key);
        const jCode = `J${nextJ++}`;
        plan.push({ code:jCode, r, c, slot: slot ? `OCCUPIED by ${slot}` : 'free', conflict: !!slot });
      }

      const conflicts = plan.filter(p=>p.conflict);
      if (dryRun) {
        return json(res,200,{ ok:true, dryRun:true, from:src, to:tgt, dir, gap, maxGap, step,
          junctionsNeeded:juncsNeeded, terrain:terrainType, plan, conflicts,
          wireChain: `${src}.${dir}→${plan.map(p=>p.code).join('→')}→${tgt}`,
          note: conflicts.length ? `${conflicts.length} slot conflicts — resolve before executing` : 'Ready to execute',
          executeCommand: `POST /api/graph/fill-gap (same body, dryRun:false)` });
      }
      if (conflicts.length) return json(res,409,{ error:`${conflicts.length} slot conflicts`, conflicts,
        suggestion:'Move conflicting nodes first, or use dryRun:true to see the plan' });

      logTrace('fill-gap execute', `from=${src} dir=${dir} to=${tgt} gap=${gap} step=${step} junctions=${juncsNeeded} terrain=${terrainType}`);
      // Execute: create junctions and wire chain
      const created = [];
      let prev = src, prevDir = dir;
      for (const p of plan) {
        logTrace('fill-gap insert', `${p.code} at r=${p.r} c=${p.c}  chain: ${prev}→${p.code}`);
        const jBody = { name:terrainType, label:`Junction near ${nm[prev]?.label||prev}`,
          text:`Junction along ${dir} path.`, act:nm[src]?.act||1, junction:true, npc:null, battle:null, loot:null, sleep:false,
          [OPP[dir]]: prev };
        const jEntry = serializeNodeLiteral(p.code, jBody);
        const ins = insertBeforeSectionClose('NODE_MAP', jEntry);
        if (!ins.ok) return json(res,500,{error:`NODE_MAP insert failed for ${p.code}: ${ins.error}`});
        const newNum = Object.values(WBAPI.nodeMap).reduce((m,n)=>Math.max(m,n.num||0),0)+1;
        WBAPI.nodeMap[p.code] = { ...jBody, num:newNum };
        WBAPI.editField('node', prev, prevDir, p.code);
        // Place coords
        WBAPI.nodeCoords[p.code] = { r:p.r, c:p.c };
        const START2='// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆', END2='// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
        const sI=WBAPI._rawSrc.indexOf(START2)+START2.length, eI=WBAPI._rawSrc.indexOf(END2);
        let sec=WBAPI._rawSrc.slice(sI,eI);
        const cIdx=sec.lastIndexOf('\n};');
        sec=sec.slice(0,cIdx+1)+`  ${p.code}:{r:${p.r},c:${p.c}},\n`+sec.slice(cIdx+1);
        WBAPI._rawSrc=WBAPI._rawSrc.slice(0,sI)+sec+WBAPI._rawSrc.slice(eI);
        occupied.set(`${p.r},${p.c}`, p.code);
        created.push(p.code);
        prev = p.code; prevDir = dir;
      }
      WBAPI.editField('node', prev, dir, tgt);
      WBAPI.editField('node', tgt, OPP[dir], prev);
      WBAPI._buildIndexes();
      logResponse('POST', url.pathname, 201, `fill-gap: ${juncsNeeded} junctions created`);
      return saveAndRestart(res, 201, { ok:true, from:src, to:tgt, dir, gap, junctionsCreated:juncsNeeded, created, wireChain:`${src}→${created.join('→')}→${tgt}` });
    }

    // ── POST /api/coords/{code}/nudge ─────────────────────────────────────────
    // Handled below in the coords block

    // ── POST /api/coords/swap ─────────────────────────────────────────────────
    // Handled below in the coords block

    // ── POST /api/graph/spawn-junction ───────────────────────────────────────
    // Create a new junction node between two existing nodes on a given axis.
    // Body: { from, dir, label?, terrain?, act?, text?, dryRun? }
    //   from    — source node code
    //   dir     — N|S|E|W (direction from `from` toward the new junction)
    //   label   — optional display name (auto-generated if omitted)
    //   terrain — optional terrain type (inherits from `from` if omitted)
    //   act     — optional act number (inherits from `from` if omitted)
    //   text    — signpost description (auto-generated if omitted)
    //   dryRun  — true → return plan without writing
    if (parts[1] === 'spawn-junction' && method === 'POST') {
      let body; try { body = await readBody(req); } catch(e) { return json(res,400,{error:'Invalid JSON'}); }
      const { from: srcCode, dir, label: labelArg, terrain: terrainArg, act: actArg, text: textArg, dryRun=true } = body||{};
      if (!srcCode||!dir) return json(res,400,{error:'Required: from, dir'});
      if (!['N','S','E','W'].includes(dir)) return json(res,400,{error:'dir must be N|S|E|W'});
      const srcNode = nm[srcCode]; if (!srcNode) return json(res,404,{error:`Node not found: ${srcCode}`});
      const srcCoord = WBAPI.nodeCoords[srcCode];
      if (!srcCoord) return json(res,400,{error:`${srcCode} has no coordinates — place it first`});

      // If dir is already occupied, warn
      const existingTgt = srcNode[dir];
      const DR4={N:-1,S:1,E:0,W:0}, DC4={N:0,S:0,E:1,W:-1};

      // Find a free slot in the given direction (1-4 cells out, then further)
      const occupied = new Map(Object.entries(WBAPI.nodeCoords).map(([c,p])=>[`${p.r},${p.c}`,c]));
      let jR = srcCoord.r, jC = srcCoord.c, slotFound=false;
      for (let d=1; d<=8; d++) {
        const nr = srcCoord.r + DR4[dir]*d, nc = srcCoord.c + DC4[dir]*d;
        if (!occupied.has(`${nr},${nc}`)) { jR=nr; jC=nc; slotFound=true; break; }
      }
      if (!slotFound) return json(res,409,{error:`No free cell found in direction ${dir} from ${srcCode} within 8 cells`});

      const terrain    = terrainArg || srcNode.name || 'junction';
      const act        = actArg     != null ? actArg : (srcNode.act||1);
      const srcLabel   = srcNode.label || srcCode;
      const tgtLabel   = existingTgt ? (nm[existingTgt]?.label||existingTgt) : `(${dir} end)`;
      const autoLabel  = labelArg || `${srcLabel} ↔ ${tgtLabel} Junction`;
      const OPP4={N:'S',S:'N',E:'W',W:'E'};
      const signEnv    = {city:'crowded streets',airport:'wind-swept tarmac',junction:'open crossroads',site:'ancient ruins',default:'open road'}[terrain]||'open road';
      const signMonster= {city:'city wolves and pickpockets',airport:'customs wraiths',junction:'highway bandits',site:'site guardians',default:'wandering beasts'}[terrain]||'wandering beasts';
      const autoText   = textArg || `Signpost says: The road between ${srcLabel} and ${tgtLabel}. You stand at a crossroads on ${signEnv}. Beware of ${signMonster} — good hunting grounds nearby.`;

      // Generate a junction code: next Jnn
      const jNums = Object.keys(nm).filter(c=>/^J\d+$/.test(c)).map(c=>+c.slice(1));
      const jCode = `J${(jNums.length?Math.max(...jNums):0)+1}`;

      const plan = {
        code:jCode, r:jR, c:jC, terrain, label:autoLabel, text:autoText, act,
        connects: { [OPP4[dir]]: srcCode, ...(existingTgt ? {[dir]:existingTgt} : {}) },
        patches:  { [srcCode]:{ field:dir, value:jCode }, ...(existingTgt?{[existingTgt]:{field:OPP4[dir],value:jCode}}:{}) },
        gap: Math.abs(DR4[dir]*(jR-srcCoord.r)) || Math.abs(DC4[dir]*(jC-srcCoord.c)),
        needsFillGap: (Math.abs(DR4[dir]*(jR-srcCoord.r))||Math.abs(DC4[dir]*(jC-srcCoord.c))) > 4,
      };

      if (dryRun) {
        logResponse('POST', url.pathname, 200, `spawn-junction dry-run: ${jCode}`);
        return json(res,200,{ok:true,dryRun:true,plan});
      }

      // Execute: create junction node
      const jBody = { name:terrain, label:autoLabel, text:autoText, act, junction:true, npc:null, battle:null, loot:null, sleep:false, ...plan.connects };
      const jEntry = serializeNodeLiteral(jCode, jBody);
      const ins = insertBeforeSectionClose('NODE_MAP', jEntry);
      if (!ins.ok) return json(res,500,{error:`NODE_MAP insert failed: ${ins.error}`});
      const newNum = Object.values(WBAPI.nodeMap).reduce((m,n)=>Math.max(m,n.num||0),0)+1;
      WBAPI.nodeMap[jCode] = { ...jBody, num:newNum };

      // Place coordinates
      WBAPI.nodeCoords[jCode] = { r:jR, c:jC };
      const CS='// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆', CE='// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
      const si=WBAPI._rawSrc.indexOf(CS)+CS.length, ei=WBAPI._rawSrc.indexOf(CE);
      let sec=WBAPI._rawSrc.slice(si,ei);
      const ci=sec.lastIndexOf('\n};');
      sec=sec.slice(0,ci+1)+`  ${jCode}:{r:${jR},c:${jC}},\n`+sec.slice(ci+1);
      WBAPI._rawSrc=WBAPI._rawSrc.slice(0,si)+sec+WBAPI._rawSrc.slice(ei);

      // Patch connecting nodes
      for (const [pCode, {field,value}] of Object.entries(plan.patches)) WBAPI.editField('node',pCode,field,value);
      WBAPI._buildIndexes();
      logResponse('POST', url.pathname, 201, `spawn-junction: ${jCode} at (${jR},${jC})`);
      return saveAndRestart(res,201,{ok:true,code:jCode,r:jR,c:jC,plan});
    }

    // ── POST /api/graph/move ──────────────────────────────────────────────────
    // Move a node to new coordinates, with collision check and optional swap.
    // Body: { code, r, c, swap? }
    //   swap: true → swap coords with whatever is at the destination (if occupied)
    if (parts[1] === 'move' && method === 'POST') {
      let body; try { body = await readBody(req); } catch(e) { return json(res,400,{error:'Invalid JSON'}); }
      const { code, r, c, swap=false } = body||{};
      if (!code||r==null||c==null) return json(res,400,{error:'Required: code, r, c'});
      if (!nm[code]) return json(res,404,{error:`Node not found: ${code}`});
      const destKey = `${r},${c}`;
      const occupier = Object.entries(WBAPI.nodeCoords).find(([k,p])=>k!==code&&p.r===r&&p.c===c)?.[0];
      if (occupier && !swap) return json(res,409,{error:`(${r},${c}) occupied by "${occupier}"`,occupier,tip:'Add "swap":true to swap coordinates'});
      const srcCoord = WBAPI.nodeCoords[code] || null;
      if (occupier && swap && srcCoord) WBAPI.nodeCoords[occupier] = { r:srcCoord.r, c:srcCoord.c };
      WBAPI.nodeCoords[code] = { r, c };
      // Rewrite NODE_COORDS section
      const entries = Object.entries(WBAPI.nodeCoords).sort(([,a],[,b])=>(a.r-b.r)||(a.c-b.c));
      const CS='// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆', CE='// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
      const si=WBAPI._rawSrc.indexOf(CS)+CS.length, ei=WBAPI._rawSrc.indexOf(CE);
      let newSec=`\nconst NODE_COORDS = { // → doc: maps.md §NODE_COORDS\n`;
      let prevBand=-999;
      for (const [ec,ep] of entries) { const band=Math.floor(ep.r/8)*8; if(band!==prevBand&&prevBand!==-999)newSec+='\n'; newSec+=`  ${ec}:{r:${ep.r},c:${ep.c}},\n`; prevBand=band; }
      newSec+=`};\n`;
      WBAPI._rawSrc=WBAPI._rawSrc.slice(0,si)+newSec+WBAPI._rawSrc.slice(ei);
      logResponse('POST', url.pathname, 200, `move: ${code} → (${r},${c})${occupier&&swap?' swapped with '+occupier:''}`);
      return saveAndRestart(res,200,{ok:true,code,from:srcCoord,to:{r,c},...(occupier&&swap?{swapped:{code:occupier,movedTo:srcCoord}}:{})});
    }

    // ── GET /api/graph/find-open-location/{code} ─────────────────────────────
    // Walk the network BFS from {code}. Return nodes that can accept a new
    // neighbour without hitting the 4-connection cap.  Rules:
    //   degree ≤ 2  → directAttach  (connect straight to it)
    //   degree = 3  → junctionNeeded (spawn junction first, then connect)
    //   degree = 4  → skip
    // Dense cells (≥3 of the 4 axis-adjacent grid slots occupied) are skipped.
    // Query params: ?radius=8 (BFS hop limit)
    if (parts[1] === 'find-open-location' && parts[2] && method === 'GET') {
      const DIRS4    = ['N','E','S','W'];
      const startCode = parts[2];
      if (!nm[startCode]) return json(res, 404, { error: `Node "${startCode}" not found` });
      const radius = Math.max(1, Math.min(20, parseInt(url.searchParams.get('radius') || '8', 10)));
      const allCoords = WBAPI.nodeCoords;

      // Degree of a node
      const deg = code => DIRS4.filter(d => nm[code]?.[d] && nm[nm[code][d]]).length;

      // Grid density: count occupied axis-adjacent cells (not diagonals)
      const density = (r, c) => {
        let n = 0;
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          if (allCoords && Object.values(allCoords).some(p => p.r === r+dr && p.c === c+dc)) n++;
        }
        return n;
      };

      const visited = new Set();
      const queue = [{ code: startCode, depth: 0 }];
      const directAttach = [], junctionNeeded = [], deadEnds = [];

      while (queue.length) {
        const { code, depth } = queue.shift();
        if (visited.has(code) || depth > radius) continue;
        visited.add(code);

        const d = deg(code);
        const coord = allCoords[code];
        const dense = coord ? density(coord.r, coord.c) : 0;
        const freeSlots = DIRS4.filter(dir => !nm[code]?.[dir]);
        const entry = { code, degree: d, depth, density: dense,
          coords: coord || null, freeSlots, label: nm[code]?.label };

        if (d === 1 && depth > 0)       deadEnds.push(entry);
        if (d <= 2 && dense < 3)        directAttach.push(entry);
        else if (d === 3 && dense < 3)  junctionNeeded.push(entry);

        for (const dir of DIRS4) {
          const tgt = nm[code]?.[dir];
          if (tgt && nm[tgt] && !visited.has(tgt)) queue.push({ code: tgt, depth: depth + 1 });
        }
      }

      // Sort each list: prefer shallower, then lower density
      const rank = e => e.depth * 10 + e.density;
      directAttach.sort((a, b) => rank(a) - rank(b));
      junctionNeeded.sort((a, b) => rank(a) - rank(b));

      logResponse('GET', url.pathname, 200,
        `find-open-location: ${directAttach.length} direct, ${junctionNeeded.length} junction-needed, ${deadEnds.length} dead-ends`);
      return json(res, 200, {
        ok: true, startCode, radius,
        summary: { directAttach: directAttach.length, junctionNeeded: junctionNeeded.length, deadEnds: deadEnds.length },
        directAttach:    directAttach.slice(0, 10),
        junctionNeeded:  junctionNeeded.slice(0, 10),
        deadEnds:        deadEnds.slice(0, 10),
        advice: directAttach.length
          ? `Best open slot: ${directAttach[0].code} (deg=${directAttach[0].degree}, depth=${directAttach[0].depth})`
          : junctionNeeded.length
          ? `All nearby nodes at deg=3 — spawn junction at ${junctionNeeded[0].code} first`
          : 'Area saturated — try larger radius or different city',
      });
    }

    // ── POST /api/graph/smart-connect ─────────────────────────────────────────
    // Mesh-aware bidirectional connect: A → B is really A-mesh → B-mesh.
    // Algorithm:
    //   1. Walk A's network (BFS, up to meshRadius hops) toward B to find
    //      the nearest node in A's mesh with a free slot.
    //   2. Walk B's network toward A to find the nearest node in B's mesh
    //      with a free slot.
    //   3. If either insertion node has degree=3, spawn a junction there first.
    //   4. Wire the two insertion nodes together (or note gap for fill-gap).
    // Body: { from, to, dir?, meshRadius?, dryRun? }
    if (parts[1] === 'smart-connect' && method === 'POST') {
      const DIRS4 = ['N','E','S','W'];
      let body; try { body = await readBody(req); } catch(e) { return json(res,400,{error:'Invalid JSON'}); }
      const { from: fromCode, to: toCode, meshRadius = 6, dryRun = true } = body || {};
      if (!fromCode || !toCode) return json(res, 400, { error: 'Required: from, to' });
      if (!nm[fromCode]) return json(res, 404, { error: `Node "${fromCode}" not found` });
      if (!nm[toCode])   return json(res, 404, { error: `Node "${toCode}" not found` });

      const allCoords = WBAPI.nodeCoords;
      const deg = code => DIRS4.filter(d => nm[code]?.[d] && nm[nm[code][d]]).length;

      // BFS walk from startCode, scoring each candidate by proximity to targetCoord
      function walkMesh(startCode, targetCode) {
        const targetCoord = allCoords[targetCode];
        const visited = new Set();
        const queue = [{ code: startCode, depth: 0 }];
        const candidates = [];

        while (queue.length) {
          const { code, depth } = queue.shift();
          if (visited.has(code) || depth > meshRadius) continue;
          visited.add(code);

          const d = deg(code);
          const coord = allCoords[code];

          // Distance toward target (Manhattan on grid)
          const dist = (coord && targetCoord)
            ? Math.abs(coord.r - targetCoord.r) + Math.abs(coord.c - targetCoord.c)
            : 999;

          const freeSlots = DIRS4.filter(dir => !nm[code]?.[dir]);

          if (d < 4 && freeSlots.length > 0) {
            candidates.push({
              code, degree: d, depth, dist, freeSlots,
              needsJunction: d === 3,  // would fill 4th slot → spawn junction first
              label: nm[code]?.label,
              coords: coord || null,
            });
          }

          for (const dir of DIRS4) {
            const tgt = nm[code]?.[dir];
            if (tgt && nm[tgt] && !visited.has(tgt)) queue.push({ code: tgt, depth: depth + 1 });
          }
        }

        // Prefer: shallow depth, low dist toward target, lower degree
        candidates.sort((a, b) =>
          (a.depth + a.dist * 0.1 + (a.needsJunction ? 2 : 0)) -
          (b.depth + b.dist * 0.1 + (b.needsJunction ? 2 : 0))
        );
        return candidates.slice(0, 5);
      }

      const fromCandidates = walkMesh(fromCode, toCode);
      const toCandidates   = walkMesh(toCode,   fromCode);

      logTrace('smart-connect', `from=${fromCode}(${fromCandidates.length} candidates) to=${toCode}(${toCandidates.length} candidates) meshRadius=${meshRadius}`);
      if (fromCandidates.length) logTrace('smart-connect insertA', `best=${fromCandidates[0].code} deg=${fromCandidates[0].degree} depth=${fromCandidates[0].depth} dist=${fromCandidates[0].dist}`);
      if (toCandidates.length)   logTrace('smart-connect insertB', `best=${toCandidates[0].code} deg=${toCandidates[0].degree} depth=${toCandidates[0].depth} dist=${toCandidates[0].dist}`);
      if (!fromCandidates.length) return json(res, 409, {
        error: `No open slots found within ${meshRadius} hops of "${fromCode}"`,
        advice: `Run ./api.sh find-open-location ${fromCode} to inspect the mesh`,
      });
      if (!toCandidates.length) return json(res, 409, {
        error: `No open slots found within ${meshRadius} hops of "${toCode}"`,
        advice: `Run ./api.sh find-open-location ${toCode} to inspect the mesh`,
      });

      const insertA = fromCandidates[0];
      const insertB = toCandidates[0];

      // Determine best direction between the two insertion points
      const cA = insertA.coords, cB = insertB.coords;
      let bestDir = 'E';  // fallback
      if (cA && cB) {
        const dr = cB.r - cA.r, dc = cB.c - cA.c;
        if (Math.abs(dc) >= Math.abs(dr)) bestDir = dc >= 0 ? 'E' : 'W';
        else                              bestDir = dr >= 0 ? 'S' : 'N';
        // Prefer a free slot in that direction
        if (!insertA.freeSlots.includes(bestDir)) bestDir = insertA.freeSlots[0] || bestDir;
      }
      const reverseDir = OPP[bestDir];

      const gap = (cA && cB)
        ? Math.abs(['N','S'].includes(bestDir) ? cB.r - cA.r : cB.c - cA.c)
        : null;

      const plan = {
        fromCity:   fromCode,
        toCity:     toCode,
        insertA:    { ...insertA, action: insertA.needsJunction ? 'spawn_junction_then_connect' : 'connect_direct' },
        insertB:    { ...insertB, action: insertB.needsJunction ? 'spawn_junction_then_connect' : 'connect_direct' },
        direction:  bestDir,
        gap,
        needsFillGap: gap !== null && gap > 4,
        dryRun,
      };

      if (dryRun) {
        logResponse('POST', url.pathname, 200, `smart-connect dry-run: ${insertA.code}→${insertB.code}`);
        return json(res, 200, { ok: true, dryRun: true, plan,
          commands: [
            insertA.needsJunction
              ? `./api.sh junction ${insertA.code} ${bestDir} --execute  # spawn junction at deg-3 node`
              : `./api.sh connect ${insertA.code} ${bestDir} ${insertB.code}  # direct connect`,
            ...(plan.needsFillGap ? [`./api.sh fill-gap ${insertA.code} ${bestDir} ${insertB.code} --execute  # bridge gap`] : []),
          ],
        });
      }

      // Execute: connect (possibly via junction) and report
      // (actual write deferred to api.sh commands — this dry-run plan is the primary output)
      logResponse('POST', url.pathname, 200, `smart-connect: plan for ${insertA.code}→${insertB.code}`);
      return json(res, 200, { ok: true, dryRun: false, plan,
        note: 'Execute the commands field to apply. smart-connect returns the plan; use ./api.sh connect + fill-gap to execute.' });
    }

    // ── POST /api/graph/rip-and-connect ──────────────────────────────────────
    // ── POST /api/graph/promote-junction ─────────────────────────────────────
    // Promote a junction node to real content in-place, preserving all N/S/E/W wiring.
    // Body: { code, label, text, name (terrain key), npc?, battle?, loot?, sleep? }
    if (parts[1] === 'promote-junction' && method === 'POST') {
      let body; try { body = await readBody(req); } catch(e) { return json(res,400,{error:'Invalid JSON'}); }
      const { code, label, text, name: terrain, npc=null, battle=null, loot=null, sleep=false, act } = body||{};
      if (!code) return json(res, 400, {error:'Required: code'});
      if (!nm[code]) return json(res, 404, {error:`Node "${code}" not found`});
      const node = nm[code];
      const errors = [];
      // Update all provided content fields via editField (preserves wiring)
      const fields = { label, text, name: terrain };
      if (act !== undefined) fields.act = act;
      fields.junction = null;    // remove junction flag
      fields.npc   = npc;
      fields.sleep = sleep;
      if (battle !== undefined) fields.battle = battle;
      if (loot   !== undefined) fields.loot   = loot;
      for (const [field, value] of Object.entries(fields)) {
        if (value === undefined) continue;
        const r = WBAPI.editField('node', code, field, value);
        if (!r?.ok) errors.push(`${field}: ${r?.error||'failed'}`);
      }
      if (errors.length) {
        logResponse('POST', url.pathname, 207, `promote-junction: ${code} partial (${errors.join(', ')})`);
        return json(res, 207, {ok:false, code, errors, connections:{N:node.N,S:node.S,E:node.E,W:node.W}});
      }
      WBAPI._buildIndexes();
      logResponse('POST', url.pathname, 200, `promote-junction: ${code}`);
      return saveAndRestart(res, 200, {ok:true, code, promoted:{label,text,terrain,npc,battle,loot,sleep}, connections:{N:node.N,S:node.S,E:node.E,W:node.W}});
    }

    // Find all nodes unreachable from the hub (stray/orphan nodes).
    // For each stray, determine the best city to relocate near based on:
    //   1. Quest cross-references (activateNode, waypointNode) — highest weight
    //   2. Graph proximity (how close the stray was to reachable nodes before)
    // Then find an open slot in that city's mesh via find-open-location logic,
    // move the stray's coordinates adjacent to that slot, and wire it in.
    // Body: { dryRun?, limit?, meshRadius? }
    if (parts[1] === 'rip-and-connect' && method === 'POST') {
      const DIRS4 = ['N','E','S','W'];
      let body; try { body = await readBody(req); } catch(e) { body = {}; }
      const { dryRun = true, limit = 50, meshRadius = 6 } = body || {};

      // 1. Find reachable set from hub (LHR or most-connected)
      const allCodes   = Object.keys(nm);
      const hub        = allCodes.reduce((b, c) => {
        const ca = DIRS4.filter(d => nm[c]?.[d] && nm[nm[c][d]]).length;
        const cb = DIRS4.filter(d => nm[b]?.[d] && nm[nm[b][d]]).length;
        return ca > cb ? c : b;
      }, allCodes[0]);

      const reachable = new Set();
      const bfsQ = [hub];
      while (bfsQ.length) {
        const cur = bfsQ.shift();
        if (reachable.has(cur)) continue;
        reachable.add(cur);
        for (const dir of DIRS4) {
          const tgt = nm[cur]?.[dir];
          if (tgt && nm[tgt] && !reachable.has(tgt)) bfsQ.push(tgt);
        }
      }

      const strays = allCodes.filter(c => !reachable.has(c));

      // 2. Build quest cross-reference map: node → [quest ids that reference it]
      const nodeQuestRefs = {};  // node code → count of quest refs
      for (const [qid, q] of Object.entries(WBAPI.questDb || {})) {
        for (const field of ['activateNode', 'waypointNode']) {
          const ref = q[field];
          if (ref && nm[ref]) {
            nodeQuestRefs[ref] = (nodeQuestRefs[ref] || 0) + 1;
          }
        }
      }

      // 3. For each stray, score candidate cities based on quest cross-references
      const reachableCities = allCodes.filter(c => reachable.has(c) && ['city','airport'].includes(nm[c]?.name));
      const reachableArr = [...reachable];

      const deg = code => DIRS4.filter(d => nm[code]?.[d] && nm[nm[code][d]]).length;

      // Find open slot in a city's mesh (simplified inline BFS)
      const findSlot = (cityCode) => {
        const visited = new Set();
        const q = [{code: cityCode, depth: 0}];
        while (q.length) {
          const {code, depth} = q.shift();
          if (visited.has(code) || depth > meshRadius) continue;
          visited.add(code);
          const d = deg(code);
          if (d < 3) return { code, degree: d, freeSlots: DIRS4.filter(dir => !nm[code]?.[dir]), needsJunction: false };
          if (d === 3) return { code, degree: d, freeSlots: DIRS4.filter(dir => !nm[code]?.[dir]), needsJunction: true };
          for (const dir of DIRS4) {
            const tgt = nm[code]?.[dir];
            if (tgt && nm[tgt] && !visited.has(tgt)) q.push({code: tgt, depth: depth + 1});
          }
        }
        return null;
      };

      const allCoords = WBAPI.nodeCoords;
      const occupied  = new Map(Object.entries(allCoords).map(([c,p]) => [`${p.r},${p.c}`, c]));

      const DR4={N:-1,S:1,E:0,W:0}, DC4={N:0,S:0,E:1,W:-1};
      const OPP4={N:'S',S:'N',E:'W',W:'E'};

      const results = { hub, totalStrays: strays.length, processed: 0, placed: [], failed: [], skipped: [] };

      // Track allocated cells even in dry-run so each stray gets a unique slot
      const allocatedCells = new Map(occupied); // copy of occupied

      logTrace('rip-and-connect', `totalStrays=${strays.length} limit=${limit} meshRadius=${meshRadius} dryRun=${dryRun}`);
      for (const stray of strays.slice(0, limit)) {
        logTrace('rip-stray', `processing ${stray} label="${(nm[stray]?.label||'').slice(0,30)}"`);
        // Score each reachable city — shuffle candidates so equal scores spread evenly
        const shuffled = reachableCities.slice().sort(() => Math.random() - 0.5);
        let bestCity = null, bestScore = -1, bestSlot = null, bestDir = null, bestNr = null, bestNc = null;

        for (const city of shuffled) {
          const slot = findSlot(city);
          if (!slot) continue;

          let score = 0;
          // Quest cross-references (strongest signal)
          score += (nodeQuestRefs[stray] || 0) * 5;
          // Geographically close (if both have coords)
          const cs = allCoords[stray], cc = allCoords[city];
          if (cs && cc) {
            const dist = Math.abs(cs.r - cc.r) + Math.abs(cs.c - cc.c);
            score += Math.max(0, 30 - dist);
          }
          // Prefer direct-attach over junction-needed
          score += slot.needsJunction ? 0 : 2;

          // Find a free cell adjacent to slot in one of its free directions
          const slotCoord = allCoords[slot.code];
          if (!slotCoord) continue;
          let foundCell = false;
          for (const dir of slot.freeSlots) {
            const nr = slotCoord.r + DR4[dir], nc = slotCoord.c + DC4[dir];
            if (!allocatedCells.has(`${nr},${nc}`)) {
              if (score > bestScore) {
                bestScore = score; bestCity = city; bestSlot = slot;
                bestDir = dir; bestNr = nr; bestNc = nc;
              }
              foundCell = true; break;
            }
          }
          if (!foundCell) continue;
        }

        if (!bestCity || !bestSlot) {
          results.failed.push({ stray, reason: 'no reachable city with free adjacent cell found' });
          continue;
        }

        logTrace('rip-decision', `${stray}→${bestCity} slot=${bestSlot.code}(deg=${bestSlot.degree}).${bestDir} targetCell=(${bestNr},${bestNc}) score=${bestScore}`);
        const cellKey = `${bestNr},${bestNc}`;
        const plan = {
          stray, bestCity, slotNode: bestSlot.code, slotDeg: bestSlot.degree,
          needsJunction: bestSlot.needsJunction, attachDir: bestDir,
          targetCoord: {r: bestNr, c: bestNc},
          strayLabel: nm[stray]?.label,
        };

        // Reserve this cell immediately (even in dry-run) so next stray doesn't conflict
        allocatedCells.set(cellKey, stray);

        if (dryRun) { results.placed.push({ stray, plan }); continue; }

        // Execute: move stray coordinates, wire to slot
        try {
          // Move stray to the open cell
          WBAPI.nodeCoords[stray] = { r: bestNr, c: bestNc };
          allocatedCells.set(cellKey, stray);

          // Wire stray to slot node
          WBAPI.editField('node', bestSlot.code, bestDir, stray);
          WBAPI.editField('node', stray, OPP4[bestDir], bestSlot.code);

          results.placed.push({ stray, plan, status: 'wired' });
          results.processed++;
        } catch(e) {
          results.failed.push({ stray, plan, reason: e.message });
        }
      }

      if (!dryRun && results.processed > 0) {
        // Rewrite NODE_COORDS and save
        const CS='// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆', CE='// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
        const si=WBAPI._rawSrc.indexOf(CS)+CS.length, ei=WBAPI._rawSrc.indexOf(CE);
        const entries=Object.entries(WBAPI.nodeCoords).sort(([,a],[,b])=>(a.r-b.r)||(a.c-b.c));
        let newSec=`\nconst NODE_COORDS = { // → doc: maps.md §NODE_COORDS\n`;
        let prevBand=-999;
        for (const [ec,ep] of entries){const band=Math.floor(ep.r/8)*8;if(band!==prevBand&&prevBand!==-999)newSec+='\n';newSec+=`  ${ec}:{r:${ep.r},c:${ep.c}},\n`;prevBand=band;}
        newSec+=`};\n`;
        WBAPI._rawSrc=WBAPI._rawSrc.slice(0,si)+newSec+WBAPI._rawSrc.slice(ei);
        WBAPI._buildIndexes();
        logResponse('POST', url.pathname, 201, `rip-and-connect: ${results.processed} placed, ${results.failed.length} failed`);
        return saveAndRestart(res, 201, { ok:true, dryRun:false, ...results });
      }

      logResponse('POST', url.pathname, 200,
        `rip-and-connect dry-run: ${results.placed.length} would place, ${results.failed.length} failed, ${results.skipped.length} skipped`);
      return json(res, 200, { ok:true, dryRun, ...results });
    }

    // ── POST /api/graph/nuke-junctions — P_NUKE: bulk-delete all J#### junctions ──
    // Streaming text/plain, no timeout.
    // Body: { execute? }   default: dry-run (execute=false)
    //
    // Three-phase operation:
    //   Phase 1  Straight-stitch: A-J-B chains → A-B direct, then delete J
    //   Phase 2  L-shaped deferred: collect (neighborA, neighborB) pairs, delete J
    //            (dangling refs cleaned in Phase 3; A* reconnects them later)
    //   Phase 3  Dead-end delete: degree≤1 junctions → outright removal
    //   Phase 4  Dangling cleanup: scan remaining nodes, clear any dir pointing at deleted codes
    //   Phase 5  Bulk source delete: ONE pass over NODE_MAP + NODE_COORDS removing all collected codes
    //   Phase 6  Save, reload, report
    //
    // See: lab-report-junction-reweave-overhaul.md §5
    if (parts[1] === 'nuke-junctions' && method === 'POST') {
      let body; try { body = await readBody(req); } catch(e) { body = {}; }
      const { execute = false } = body || {};

      res.writeHead(200, { 'Content-Type':'text/plain; charset=utf-8', 'Transfer-Encoding':'chunked', 'X-Accel-Buffering':'no' });
      const emit = (msg) => { try { res.write(msg + '\n'); } catch(_) {} logRow('nuke-junctions', msg); };
      const yieldN = () => new Promise(r => setImmediate(r));

      emit(`[nuke-junctions] execute=${execute}  ts=${new Date().toISOString()}`);
      emit(`[nuke-junctions] nodes=${Object.keys(nm).length}`);

      const DIRS4n = ['N','S','E','W'];
      const OPP4n  = {N:'S',S:'N',E:'W',W:'E'};
      const jCodeRe = /^J\d+$/;

      // ── Build protection sets ───────────────────────────────────────────────
      const questRefNodes = new Set();
      for (const q of Object.values(WBAPI.questDb || {}))
        for (const f of ['activateNode','waypointNode']) if (q[f]) questRefNodes.add(q[f]);
      const npcRefNodes = new Set(
        Object.values(WBAPI.birkaNpcs || {}).map(n => n.node).filter(Boolean)
      );
      emit(`[nuke] questRefNodes=${questRefNodes.size}  npcRefNodes=${npcRefNodes.size}`);
      const jQuestBlocked = [...questRefNodes].filter(c => jCodeRe.test(c));
      const jNpcBlocked   = [...npcRefNodes].filter(c => jCodeRe.test(c));
      if (jQuestBlocked.length || jNpcBlocked.length) {
        emit(`[nuke] ⚠ BLOCKED: ${jQuestBlocked.length} J#### have quest refs, ${jNpcBlocked.length} have NPC refs`);
        emit(`[nuke] questBlocked: ${jQuestBlocked.join(', ')}`);
        emit(`[nuke] npcBlocked: ${jNpcBlocked.join(', ')}`);
        emit(`[nuke] Aborting — resolve blocked codes first.`);
        res.end(); return;
      }
      emit(`[nuke] safety check PASSED — 0 J#### have quest/NPC refs`);

      // ── Classify all J#### junctions ───────────────────────────────────────
      const toDelete     = new Set();   // all safe J#### to remove from source
      const stitchOps    = [];          // {jCode, nodeA, dirA, nodeB, dirB}
      const deferredPairs= [];          // {jCode, neighbors:[{code,dir},...]}
      let   deadEndCount = 0;

      for (const [code, node] of Object.entries(nm)) {
        if (!jCodeRe.test(code)) continue;
        if (questRefNodes.has(code) || npcRefNodes.has(code)) {
          logTrace('nuke-skip', `${code} blocked — questRef=${questRefNodes.has(code)} npcRef=${npcRefNodes.has(code)}`);
          continue;
        }
        toDelete.add(code);

        const liveDirs = DIRS4n.filter(d => node[d] && nm[node[d]]);
        const coord = WBAPI.nodeCoords[code];
        const coordStr = coord ? `(${coord.r},${coord.c})` : '(no-coord)';
        const trunc = (s, n=32) => s && s.length > n ? s.slice(0, n) + '…' : (s || '');

        if (liveDirs.length <= 1) {
          deadEndCount++;
          logTrace('nuke-dead-end', `${code} ${coordStr} deg=${liveDirs.length} neighbors=[${liveDirs.map(d=>node[d]).join(',')}] → outright delete`);
        } else if (liveDirs.length === 2 && OPP4n[liveDirs[0]] === liveDirs[1]) {
          const nodeA = node[liveDirs[0]], nodeB = node[liveDirs[1]];
          const labA = trunc(nm[nodeA]?.label || nodeA);
          const labB = trunc(nm[nodeB]?.label || nodeB);
          const isAJct = jCodeRe.test(nodeA), isBJct = jCodeRe.test(nodeB);
          stitchOps.push({ jCode:code, nodeA, dirA:liveDirs[0], nodeB, dirB:liveDirs[1] });
          logTrace('nuke-straight', `${code} ${coordStr} ${liveDirs[0]}↔${liveDirs[1]} → "${labA}"(${nodeA}${isAJct?'/J':''}) ↔ "${labB}"(${nodeB}${isBJct?'/J':''})`);
        } else {
          const nbDesc = liveDirs.map(d => {
            const nb = node[d];
            const lab = trunc(nm[nb]?.label || nb);
            const nbCoord = WBAPI.nodeCoords[nb];
            const nbCoordStr = nbCoord ? `(${nbCoord.r},${nbCoord.c})` : '';
            const isJct = jCodeRe.test(nb);
            return `${d}→"${lab}"(${nb}${isJct?'/J':''})${nbCoordStr}`;
          }).join('  ');
          deferredPairs.push({ jCode:code, neighbors: liveDirs.map(d => ({ code:node[d], dir:d })) });
          logTrace('nuke-lshaped', `${code} ${coordStr} deg=${liveDirs.length} ${nbDesc} → deferred for A*`);
        }
      }

      emit(`[nuke] classified: safe=${toDelete.size}  straight=${stitchOps.length}  L-shaped=${deferredPairs.length}  dead-end=${deadEndCount}`);

      if (!execute) {
        emit(`[nuke] DRY-RUN — no changes written. Re-run with execute:true to apply.`);
        emit(JSON.stringify({ dryRun:true, safeToDelete:toDelete.size, straightStitch:stitchOps.length, lShapedDeferred:deferredPairs.length, deadEndDelete:deadEndCount }));
        res.end(); return;
      }

      // ── Phase 1: straight stitches (in-memory + source via editField) ───────
      emit(`\n[phase-1] applying ${stitchOps.length} straight stitches…`);
      let stitchOk = 0, stitchFail = 0;
      for (let i = 0; i < stitchOps.length; i++) {
        if (i % 500 === 0) { emit(`  [stitch] ${i}/${stitchOps.length}`); await yieldN(); }
        const { jCode, nodeA, dirA, nodeB, dirB } = stitchOps[i];
        if (!nm[nodeA] || !nm[nodeB]) {
          logTrace('nuke-stitch-fail', `${jCode} missing neighbor: nodeA=${nodeA}(${!!nm[nodeA]}) nodeB=${nodeB}(${!!nm[nodeB]})`);
          stitchFail++; continue;
        }
        const r1 = WBAPI.editField('node', nodeA, OPP4n[dirA], nodeB);
        if (!r1?.ok) {
          logTrace('nuke-stitch-fail', `${jCode} editField failed: ${nodeA}.${OPP4n[dirA]}=${nodeB} err=${r1?.error}`);
          stitchFail++; continue;
        }
        const r2 = WBAPI.editField('node', nodeB, OPP4n[dirB], nodeA);
        if (!r2?.ok) {
          logTrace('nuke-stitch-fail', `${jCode} editField rollback: ${nodeB}.${OPP4n[dirB]}=${nodeA} err=${r2?.error}`);
          WBAPI.editField('node', nodeA, OPP4n[dirA], jCode); stitchFail++; continue;
        }
        const labA2 = (nm[nodeA]?.label||nodeA).slice(0,32), labB2 = (nm[nodeB]?.label||nodeB).slice(0,32);
        logTrace('nuke-stitch-ok', `${jCode} → "${labA2}"(${nodeA}) ${OPP4n[dirA]}↔${OPP4n[dirB]} "${labB2}"(${nodeB})`);
        stitchOk++;
      }
      emit(`[phase-1] done: stitched=${stitchOk}  failed=${stitchFail}`);

      // Save stitch results to disk so file monitor sees progress before bulk delete
      if (stitchOk > 0) {
        const stampS = WBAPI.getStampedName();
        const svS = WBAPI.save(stampS);
        if (svS.ok) {
          fs.copyFileSync(svS.path, GAME_FILE);
          WBAPI.load(GAME_FILE);
          nm = WBAPI.nodeMap;
          emit(`[save] phase-1-stitches  nodes=${Object.keys(nm).length}`);
          logTrace('nuke-save', `phase-1 stitches written to ${GAME_FILE}`);
        }
      }

      // ── Phase 5 (bulk): remove all J#### from NODE_MAP source in one pass ───
      emit(`\n[phase-5] bulk source delete of ${toDelete.size} junctions from NODE_MAP…`);
      await yieldN();
      {
        const S = '// ◆◆◆ WORLDBUILDER:NODE_MAP:START ◆◆◆';
        const E = '// ◆◆◆ WORLDBUILDER:NODE_MAP:END ◆◆◆';
        const srcStart = WBAPI._rawSrc.indexOf(S) + S.length;
        const srcEnd   = WBAPI._rawSrc.indexOf(E);
        if (srcStart >= S.length && srcEnd > srcStart) {
          let sec = WBAPI._rawSrc.slice(srcStart, srcEnd);
          const keyRe = /^([ \t]*)(J\d+)\s*:\s*\{/gm;
          const spans = [];
          let m;
          while ((m = keyRe.exec(sec)) !== null) {
            const code = m[2];
            if (!toDelete.has(code)) continue;
            const lineStart = m.index;
            const openEnd   = m.index + m[0].length;
            let depth = 1, i = openEnd, inStr = null;
            while (i < sec.length && depth > 0) {
              const ch = sec[i];
              if (inStr) {
                if (ch === '\\' && inStr !== '`') { i += 2; continue; }
                if (ch === inStr) inStr = null;
              } else if (ch === '/' && sec[i+1] === '/') {
                while (i < sec.length && sec[i] !== '\n') i++;
                continue;
              } else {
                if (ch === '"' || ch === "'" || ch === '`') inStr = ch;
                else if (ch === '{') depth++;
                else if (ch === '}') { depth--; if (depth === 0) break; }
              }
              i++;
            }
            if (depth !== 0) continue;
            let end = i + 1;
            while (end < sec.length && sec[end] !== '\n') end++;
            if (end < sec.length) end++;
            spans.push({ start: lineStart, end });
          }
          emit(`  [source] found ${spans.length} entries to excise`);
          // remove in reverse to preserve offsets
          spans.sort((a, b) => b.start - a.start);
          for (const { start, end } of spans) sec = sec.slice(0, start) + sec.slice(end);
          WBAPI._rawSrc = WBAPI._rawSrc.slice(0, srcStart) + sec + WBAPI._rawSrc.slice(srcEnd);
          emit(`  [source] NODE_MAP section rebuilt (${spans.length} removed)`);
        } else {
          emit(`  [source] ⚠ NODE_MAP section not found — source integrity check failed`);
        }
      }
      await yieldN();

      // ── Phase 5b: remove J#### from NODE_COORDS in one pass ─────────────────
      emit(`[phase-5b] purging J#### from NODE_COORDS…`);
      {
        const S = '// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆';
        const E = '// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
        const srcStart = WBAPI._rawSrc.indexOf(S) + S.length;
        const srcEnd   = WBAPI._rawSrc.indexOf(E);
        if (srcStart >= S.length && srcEnd > srcStart) {
          const sec = WBAPI._rawSrc.slice(srcStart, srcEnd);
          // NODE_COORDS entries are single-line: "  J12345:{r:-13,c:18},\n"
          const cleaned = sec.replace(/^[ \t]*(J\d+)\s*:\{[^\n]*\},?\n/gm, (match, code) =>
            toDelete.has(code) ? '' : match
          );
          const removed = (sec.match(/^[ \t]*(J\d+)/gm) || []).filter(l => {
            const c = l.trim(); return toDelete.has(c);
          }).length;
          WBAPI._rawSrc = WBAPI._rawSrc.slice(0, srcStart) + cleaned + WBAPI._rawSrc.slice(srcEnd);
          emit(`  [source] NODE_COORDS purged (~${removed} entries)`);
        }
      }
      await yieldN();

      // ── Reload in-memory nodeMap and nodeCoords from updated source ──────────
      emit(`[phase-5c] rebuilding in-memory nodeMap from updated source…`);
      {
        const stamp = WBAPI.getStampedName();
        const sv = WBAPI.save(stamp);
        if (!sv.ok) { emit(`[ERROR] save failed: ${sv.error}`); res.end(); return; }
        try { fs.copyFileSync(sv.path, GAME_FILE); } catch(e) { emit(`[ERROR] copy: ${e.message}`); res.end(); return; }
        try { WBAPI.load(GAME_FILE); } catch(e) { emit(`[ERROR] reload: ${e.message}`); res.end(); return; }
        nm = WBAPI.nodeMap;
        emit(`[save] post-nuke-bulk  nodes=${Object.keys(nm).length}`);
      }
      await yieldN();

      // ── Phase 4: dangling direction cleanup ──────────────────────────────────
      emit(`\n[phase-4] cleaning dangling direction refs in ${Object.keys(nm).length} remaining nodes…`);
      let danglingFixed = 0;
      for (const [code, node] of Object.entries(nm)) {
        for (const d of DIRS4n) {
          const tgt = node[d];
          if (tgt && !nm[tgt]) {
            // target was deleted — clear this direction field
            WBAPI.editField('node', code, d, null);
            danglingFixed++;
          }
        }
      }
      emit(`[phase-4] cleared ${danglingFixed} dangling direction fields`);
      if (danglingFixed > 0) {
        const stamp = WBAPI.getStampedName();
        const sv = WBAPI.save(stamp);
        if (sv.ok) { fs.copyFileSync(sv.path, GAME_FILE); WBAPI.load(GAME_FILE); nm = WBAPI.nodeMap; }
        emit(`[save] post-dangling-cleanup  nodes=${Object.keys(nm).length}`);
      }
      await yieldN();

      // ── Final report ─────────────────────────────────────────────────────────
      const remaining    = Object.keys(nm).length;
      const remJunctions = Object.keys(nm).filter(c => jCodeRe.test(c)).length;
      const remNamed     = remaining - remJunctions;
      const deferredList = deferredPairs.map(p => ({
        deleted: p.jCode,
        neighbors: p.neighbors.map(n => n.code),
      }));

      emit(`\n[nuke-junctions] COMPLETE`);
      emit(`  nodes before : ${toDelete.size + remaining}`);
      emit(`  nodes after  : ${remaining}`);
      emit(`  junctions del: ${toDelete.size}`);
      emit(`  remaining J##: ${remJunctions}`);
      emit(`  named nodes  : ${remNamed}`);
      emit(`  deferred pairs: ${deferredPairs.length}  (need A* reconnect)`);
      emit(`  dangling fixed: ${danglingFixed}`);
      emit(JSON.stringify({
        ok:true, execute,
        before: toDelete.size + remaining,
        after:  remaining,
        deletedJunctions: toDelete.size,
        remainingJunctions: remJunctions,
        namedNodes: remNamed,
        stitched: stitchOk,
        deferredPairs: deferredList.length,
        danglingFixed,
        deferredSample: deferredList.slice(0, 20),
      }));
      res.end(); return;
    }

    // ── POST /api/graph/reweave-all — MegaReWeave streaming loop ────────────────
    // Streaming response (chunked text/plain), no timeout.
    // Body: { execute?, geoSeed?, priorityHighways?, cityMesh?, derelictCleanup?,
    //         maxRip?, maxFix?, step?, limit?, meshRadius? }
    //   execute          — false=dry-run (default false)
    //   geoSeed          — apply Mercator lat/lon to GEO2 cities (default true)
    //   priorityHighways — [{from,to,note?}] explicit highways to build first
    //   cityMesh         — greedy MST connecting all GEO2 cities (default true)
    //   derelictCleanup  — remove dead-end no-quest junctions (default true)
    //   maxRip/maxFix    — loop limits (default 5 each)
    //   step             — junction spacing in grid cells (default 4)
    // See: lab-report-mega-reweave.md
    //   Phase 3: always runs once
    if (parts[1] === 'reweave-all' && method === 'POST') {
      // Read body BEFORE starting streaming response
      let body; try { body = await readBody(req); } catch(e) { body = {}; }
      const {
        execute=false, geoSeed=true, priorityHighways=[], cityMesh=true,
        derelictCleanup=true, witherPhase=true,
        maxRip=500, maxFix=500, step=4, limit=10000, meshRadius=600
      } = body||{};

      // ── streaming setup (chunked text/plain, no timeout) ────────────────────
      cors(res);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' });
      const emit = (msg) => { try { res.write(msg + '\n'); } catch(_) {} logRow('reweave', msg); };
      const yieldOnce = () => new Promise(r => setImmediate(r)); // flush HTTP stream + allow event loop
      // progress tick: emits only at start, end, or every tickEvery items
      const BAR_W = 40; // wide bar — assumes 220+ char terminal
      const mkBar = (iter, total) => { const p=total>0?Math.floor(iter/total*BAR_W):0; return '█'.repeat(p)+'░'.repeat(BAR_W-p); };
      const mkPct = (iter, total) => total>0?Math.round(iter/total*100):0;
      const progressLine = (fn, iter, total, extra='') => {
        emit(`  │ [${fn} ${iter}/${total} [${mkBar(iter,total)}] ${String(mkPct(iter,total)).padStart(3)}%]${extra?' '+extra:''}`);
      };
      // nestedProgressLine: shows outer pass context + inner item progress side-by-side
      // outer bar omitted when outerTotal=0 (pass count unknown)
      const nestedProgressLine = (outerFn, outerIter, outerTotal, innerFn, innerIter, innerTotal, extra='') => {
        const outerStr = outerTotal>0
          ? `[${outerFn} ${outerIter}/${outerTotal} [${mkBar(outerIter,outerTotal)}] ${String(mkPct(outerIter,outerTotal)).padStart(3)}%]`
          : `[${outerFn} ${outerIter}]`;
        emit(`  │ ${outerStr} [${innerFn} ${innerIter}/${innerTotal} [${mkBar(innerIter,innerTotal)}] ${String(mkPct(innerIter,innerTotal)).padStart(3)}%]${extra?' '+extra:''}`);
      };
      const sectionBanner = (title) => emit(`\n  ┌${'─'.repeat(80)}\n  │ ${title}\n  └${'─'.repeat(80)}`);
      // ── MegaReWeave overall phase tracker ────────────────────────────────────
      const RW_STEPS = 21; // 12 original + 9 final passes (bidir×5 + xjct×3 + cross×1)
      let rwStep = 0;
      const phaseBanner = (label, detail='') => {
        rwStep++;
        const pct = Math.min(100, Math.round(rwStep/RW_STEPS*100));
        const filled = Math.min(BAR_W, Math.floor(rwStep/RW_STEPS*BAR_W));
        const bar = '█'.repeat(filled) + '░'.repeat(BAR_W - filled);
        emit(`\n  ${'═'.repeat(90)}`);
        emit(`  MegaReWeave [${bar}] ${String(pct).padStart(3)}%  step ${rwStep}/${RW_STEPS}`);
        emit(`  ▶ ${label}${detail?'  '+detail:''}`);
        emit(`  ${'═'.repeat(90)}`);
      };

      // Activate patch queue for the entire reweave — editField queues node writes,
      // flushPatches() materializes them via one batchEditNode call before each save.
      WBAPI.beginPatchQueue();

      // helper: batch-save + reload without ending the HTTP response
      const heapMB = () => { const u = process.memoryUsage(); return `heap=${Math.round(u.heapUsed/1e6)}MB rss=${Math.round(u.rss/1e6)}MB`; };
      const nodeStats = () => {
        const all = Object.keys(nm); const jct = all.filter(c=>!!nm[c]?.junction);
        return `nodes=${all.length}  named=${all.length-jct.length}  junctions=${jct.length}`;
      };
      // phaseTime: call at phase START, returns a closer fn that emits elapsed ms.
      const phaseTime = (label) => {
        const t0 = Date.now();
        return () => emit(`  [${label}] elapsed=${Date.now()-t0}ms`);
      };
      const batchSave = (label) => {
        const fp = WBAPI.flushPatches();
        if (fp.applied || fp.failed)
          emit(`[save:flush] ${fp.applied} patches applied  ${fp.failed} failed  (${fp.cleared} nodes)`);
        const stamp = WBAPI.getStampedName();
        const sv = WBAPI.save(stamp);
        if (!sv.ok) { emit(`[ERROR] save failed (${label}): ${sv.error}`); return false; }
        const fileSizeKB = Math.round((WBAPI._rawSrc?.length||0)/1024);
        try { fs.copyFileSync(sv.path, GAME_FILE); } catch(e) { emit(`[ERROR] copy: ${e.message}`); return false; }
        try { WBAPI.load(GAME_FILE); } catch(e) { emit(`[ERROR] reload: ${e.message}`); return false; }
        emit(`[save] ${label}  ${heapMB()}  file=${fileSizeKB}KB  nodes=${Object.keys(nm).length}`);
        return true;
      };

      // ── shared constants & helpers ───────────────────────────────────────────
      const DIRS4 = ['N','S','E','W'];
      const OPP4  = {N:'S',S:'N',E:'W',W:'E'};
      const DR4   = {N:-1,S:1,E:0,W:0};
      const DC4   = {N:0,S:0,E:1,W:-1};
      const bfsReach = (hub) => {
        const seen=new Set(),q=[hub];
        while(q.length){const c=q.shift();if(seen.has(c))continue;seen.add(c);for(const d of DIRS4){const t=nm[c]?.[d];if(t&&nm[t]&&!seen.has(t))q.push(t);}}
        return seen;
      };
      const getHub = () => Object.keys(nm).reduce((b,c)=>{
        const ca=DIRS4.filter(d=>nm[c]?.[d]&&nm[nm[c][d]]).length;
        const cb=DIRS4.filter(d=>nm[b]?.[d]&&nm[nm[b][d]]).length;
        return ca>cb?c:b;
      }, Object.keys(nm)[0]);
      // clearDir: remove a direction field from a node's source line and in-memory nm
      const clearDir=(nodeCode,dir)=>{
        const S='// ◆◆◆ WORLDBUILDER:NODE_MAP:START ◆◆◆',E='// ◆◆◆ WORLDBUILDER:NODE_MAP:END ◆◆◆';
        const a=WBAPI._rawSrc.indexOf(S)+S.length,e=WBAPI._rawSrc.indexOf(E);if(a<S.length||e<0)return;
        const sec=WBAPI._rawSrc.slice(a,e);
        const re=new RegExp(`^([ \\t]*${nodeCode}\\s*:\\s*\\{[^\\n]+)$`,'m');const m=re.exec(sec);if(!m)return;
        const bef=m[1],aft=bef.replace(new RegExp(`,\\s*${dir}\\s*:\\s*'[^']*'`),'').replace(new RegExp(`\\b${dir}\\s*:\\s*'[^']*',?\\s*`),'');
        if(aft===bef)return;WBAPI._rawSrc=WBAPI._rawSrc.slice(0,a)+sec.replace(bef,aft)+WBAPI._rawSrc.slice(e);delete nm[nodeCode][dir];
      };

      // ── GEO2: city lat/lon table (Rectangular Mercator, same as geo-seed) ──────
      const GEO2 = {
        HHL:{lat:65.0,lon:-22.0},NID:{lat:63.4,lon:10.4},LYG:{lat:62.0,lon:9.0},ODD:{lat:60.0,lon:11.0},
        SIG:{lat:59.5,lon:11.5},LHR:{lat:59.3,lon:17.6},HEO:{lat:55.6,lon:11.9},GLA:{lat:55.9,lon:-4.3},
        EDI:{lat:55.9,lon:-3.2},YRK:{lat:53.9,lon:-1.1},GWN:{lat:53.2,lon:-4.0},MGL:{lat:53.1,lon:-3.8},
        SHF:{lat:52.9,lon:-1.2},HVY:{lat:52.0,lon:-3.0},HFD:{lat:52.1,lon:-2.7},LDN:{lat:51.5,lon:-0.1},
        LON:{lat:51.5,lon:-0.3},BRK:{lat:51.5,lon:-0.2},MSE:{lat:51.3,lon:1.1},ACT:{lat:50.6,lon:-4.7},
        CVP:{lat:38.7,lon:-9.1},BDX:{lat:44.8,lon:-0.6},SRL:{lat:44.7,lon:1.1},FRK:{lat:48.9,lon:2.3},
        MTP:{lat:43.6,lon:3.9},AVG:{lat:43.9,lon:4.8},MAR:{lat:43.3,lon:5.4},KOL:{lat:50.9,lon:6.9},
        WOR:{lat:49.6,lon:8.4},REG:{lat:49.0,lon:12.1},SAL:{lat:44.6,lon:7.5},BDA:{lat:47.5,lon:19.0},
        ETZ:{lat:47.3,lon:19.2},KRK:{lat:50.1,lon:19.9},VEN:{lat:45.4,lon:12.3},FRR:{lat:44.8,lon:11.6},
        BOL:{lat:44.5,lon:11.3},PRA:{lat:43.9,lon:11.1},PIS:{lat:43.8,lon:10.9},PSA:{lat:43.7,lon:10.4},
        AOI:{lat:43.6,lon:13.5},ROM:{lat:41.9,lon:12.5},SAU:{lat:41.8,lon:12.6},BAR:{lat:41.1,lon:16.9},
        PAR:{lat:38.1,lon:13.4},BIS:{lat:47.1,lon:24.5},KLZ:{lat:46.8,lon:23.6},SIB:{lat:45.8,lon:24.2},
        VAR:{lat:43.2,lon:27.9},THA:{lat:40.6,lon:22.9},LMO:{lat:40.5,lon:23.0},PHC:{lat:39.6,lon:19.9},
        ITH:{lat:38.4,lon:20.7},ORC:{lat:38.5,lon:22.9},MYS:{lat:37.1,lon:22.4},MSN:{lat:36.9,lon:21.7},
        CON:{lat:41.0,lon:28.9},VRG:{lat:41.1,lon:28.8},BTR:{lat:41.0,lon:29.1},BUR:{lat:40.2,lon:29.1},
        SIN:{lat:42.0,lon:35.2},TRB:{lat:41.0,lon:39.7},ANT:{lat:36.2,lon:36.2},ALP:{lat:36.2,lon:37.2},
        ALB:{lat:36.4,lon:37.0},JAR:{lat:31.8,lon:35.2},OLN:{lat:31.7,lon:35.3},BGD:{lat:33.3,lon:44.4},
        TUN:{lat:36.8,lon:10.2},MLN:{lat:-3.2,lon:40.1},GNJ:{lat:40.7,lon:46.3},TBZ:{lat:38.1,lon:46.3},
        MRG:{lat:37.4,lon:46.5},NIS:{lat:36.2,lon:58.8},MRV:{lat:37.7,lon:62.2},SAM:{lat:39.6,lon:66.9},
      };

      // ── corridor & highway builder ────────────────────────────────────────────
      // buildHighway: connects fromCode→toCode via one or two straight corridor legs.
      //   • Pure corridor: if one axis dominates (ratio ≥ 5:1 or minor axis ≤ step),
      //     walk a single straight line — no elbow needed.
      //   • L-shape: otherwise walk major axis first, elbow, then minor axis.
      //   walkLeg scans every existing node along the corridor path (at any position,
      //   not just exact step multiples) and merges them in instead of creating new junctions.
      const buildHighway = (fromCode, toCode) => {
        const origFc=WBAPI.nodeCoords[fromCode],origTc=WBAPI.nodeCoords[toCode];
        if(!origFc)return{ok:false,error:`${fromCode} has no coords`};
        if(!origTc)return{ok:false,error:`${toCode} has no coords`};

        // ── mesh-entry selection ─────────────────────────────────────────────────
        // Route between the closest cells across both connected components rather
        // than forcing the corridor all the way to the named node itself.
        // toCode may sit deep inside its mesh; a border cell is much cheaper to reach.
        const mdist=(a,b)=>Math.abs(a.r-b.r)+Math.abs(a.c-b.c);

        // ── same-component check: skip if already connected ──────────────────────
        const fromReach=bfsReach(fromCode);
        if(fromReach.has(toCode)){
          emit(`  [highway] SKIP: ${fromCode} already reaches ${toCode} (same component, ${fromReach.size} nodes)  no new junctions needed`);
          return{ok:true,created:[],from:fromCode,to:toCode,shape:'already-connected',skipped:true};
        }

        // ── mesh-entry selection: O(n) per side, not O(n²) ───────────────────────
        // Find the node in toCode's network closest to origFc (source pos),
        // and the node in fromCode's network closest to origTc (dest pos).
        // Two linear scans — safe on large (15k+) components.
        const toReach=bfsReach(toCode);
        let actualFrom=fromCode,actualTo=toCode;
        let bestToD=mdist(origFc,origTc);
        // skip coord-only stubs (in nodeCoords but not nodeMap) — editField no-ops on them
        for(const c of toReach){const co=WBAPI.nodeCoords[c];if(!co||!nm[c])continue;const d=mdist(origFc,co);if(d<bestToD){bestToD=d;actualTo=c;}}
        const origActualTo=WBAPI.nodeCoords[actualTo];
        let bestFromD=mdist(origFc,origActualTo||origTc);
        for(const c of fromReach){const co=WBAPI.nodeCoords[c];if(!co||!nm[c])continue;const d=mdist(co,origActualTo||origTc);if(d<bestFromD){bestFromD=d;actualFrom=c;}}
        const directDist=mdist(origFc,origTc);
        const meshDist=mdist(WBAPI.nodeCoords[actualFrom]||origFc,WBAPI.nodeCoords[actualTo]||origTc);
        emit(`  [highway] ${fromCode}(net=${fromReach.size})→${toCode}(net=${toReach.size})  direct-dist=${directDist}`);
        if(actualFrom!==fromCode||actualTo!==toCode)
          emit(`  [highway] mesh-entry reroute: ${fromCode}→${actualFrom}  ${toCode}→${actualTo}  dist=${meshDist}  saved=${directDist-meshDist}`);
        else
          emit(`  [highway] mesh-entry: direct pair already optimal  dist=${directDist}`);

        const fc=WBAPI.nodeCoords[actualFrom],tc=WBAPI.nodeCoords[actualTo];
        const dr=tc.r-fc.r,dc=tc.c-fc.c;
        // only nodes with NODE_MAP entries — coord-only stubs would silently reject editField
        const occ=new Map(Object.entries(WBAPI.nodeCoords).filter(([c])=>!!nm[c]).map(([c,p])=>[`${p.r},${p.c}`,c]));
        const created=[];
        const nextJ=()=>{const nums=Object.keys(nm).filter(c=>/^J\d+$/.test(c)).map(c=>+c.slice(1));return`J${(nums.length?Math.max(...nums):0)+1}`;};
        const addJ=(code,r,c,dir,prev)=>{
          // serialize to NODE_MAP source so editField can wire it in future passes
          const jb={name:'junction',label:`Jct ${fromCode}→${toCode}`,text:`Highway junction.`,act:nm[fromCode]?.act||1,junction:true,npc:null,battle:null,loot:null,sleep:false,[OPP4[dir]]:prev};
          const je=serializeNodeLiteral(code,jb);const ins=insertBeforeSectionClose('NODE_MAP',je);if(!ins.ok)return false;
          const nn=Object.values(nm).reduce((m,n)=>Math.max(m,n.num||0),0)+1;
          nm[code]={...jb,num:nn};WBAPI.nodeCoords[code]={r,c};
          // also insert into NODE_COORDS block immediately (rewriteCoords runs later)
          const CS='// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆',CE='// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
          const si=WBAPI._rawSrc.indexOf(CS)+CS.length,ei=WBAPI._rawSrc.indexOf(CE);
          let sec=WBAPI._rawSrc.slice(si,ei);const ci=sec.lastIndexOf('\n};');
          sec=sec.slice(0,ci+1)+`  ${code}:{r:${r},c:${c}},\n`+sec.slice(ci+1);
          WBAPI._rawSrc=WBAPI._rawSrc.slice(0,si)+sec+WBAPI._rawSrc.slice(ei);
          // wire to prev in corridor direction
          WBAPI.editField('node',prev,dir,code);
          occ.set(`${r},${c}`,code);created.push(code);
          // stitch: wire to ALL existing neighbors in all 4 directions (not just corridor dir)
          // this merges the new junction into the surrounding mesh, not just the highway chain
          for(const d of DIRS4){
            if(d===OPP4[dir])continue; // backward in corridor — already wired via prev
            // scan up to step cells in this direction for the nearest existing node
            for(let dist=1;dist<=step;dist++){
              const nr=r+DR4[d]*dist,nc=c+DC4[d]*dist;
              const neighbor=occ.get(`${nr},${nc}`);
              if(!neighbor||!nm[neighbor])break;
              if(neighbor===prev)break;
              // only wire if the neighbor is not already claimed in this direction
              if(!nm[code]?.[d]&&!nm[neighbor]?.[OPP4[d]]){
                WBAPI.editField('node',code,d,neighbor);
                WBAPI.editField('node',neighbor,OPP4[d],code);
                emit(`    stitch ${code}.${d}→${neighbor}`);
              }
              break; // wire to the nearest neighbor only
            }
          }
          return true;
        };
        // walkLeg: walk from (pR,pC) toward (tR,tC) in dir, placing junctions every step cells.
        //   Also scans ALL cells between step positions for existing nodes to reuse.
        const walkLeg=(prev,pR,pC,tR,tC,dir)=>{
          const axis=dir in{N:1,S:1}?'r':'c';
          const target=axis==='r'?tR:tC;
          let cur=prev,curR=pR,curC=pC;
          while(true){
            const remaining=axis==='r'?Math.abs(target-curR):Math.abs(target-curC);
            if(remaining<=step)break; // close enough — final wire handled outside
            // scan between current pos and next step pos for any existing node to merge
            let mergedEarly=false;
            for(let d=1;d<step;d++){
              const nr=curR+DR4[dir]*d,nc=curC+DC4[dir]*d;
              const ex=occ.get(`${nr},${nc}`);
              if(ex&&ex!==cur){
                if(!nm[cur]?.[dir]){const r1=WBAPI.editField('node',cur,dir,ex);const r2=WBAPI.editField('node',ex,OPP4[dir],cur);if(r1?.ok&&r2?.ok)emit(`    merge ${ex}(${nr},${nc})`);}
                cur=ex;curR=nr;curC=nc;mergedEarly=true;break;
              }
            }
            if(mergedEarly)continue;
            // place junction at exact step position
            const nr=curR+DR4[dir]*step,nc=curC+DC4[dir]*step;
            const ex=occ.get(`${nr},${nc}`);
            if(ex&&ex!==cur){
              if(!nm[cur]?.[dir]){WBAPI.editField('node',cur,dir,ex);WBAPI.editField('node',ex,OPP4[dir],cur);}
              cur=ex;curR=nr;curC=nc;
            } else {
              const j=nextJ();if(!addJ(j,nr,nc,dir,cur))return null;
              emit(`    +${j}(${nr},${nc})`);cur=j;curR=nr;curC=nc;
            }
          }
          return{code:cur,r:curR,c:curC};
        };
        // Detect corridor type: pure N/S, pure E/W, or L-shape
        const absDR=Math.abs(dr),absDC=Math.abs(dc);
        const pureNS=absDR>0&&(absDC===0||absDR/Math.max(absDC,1)>=5||absDC<=step);
        const pureEW=absDC>0&&(absDR===0||absDC/Math.max(absDR,1)>=5||absDR<=step);
        if(pureNS){
          const dir=dr>=0?'S':'N';
          emit(`  corridor(${dir}): ${actualFrom}(${fc.r},${fc.c})→${actualTo}(${tc.r},${tc.c})`);
          const e1=walkLeg(actualFrom,fc.r,fc.c,tc.r,tc.c,dir);if(!e1)return{ok:false,error:'corridor failed',created};
          if(e1.code!==actualTo){WBAPI.editField('node',e1.code,dir,actualTo);WBAPI.editField('node',actualTo,OPP4[dir],e1.code);emit(`  wired ${e1.code}.${dir}→${actualTo}`);}
          return{ok:true,created,from:fromCode,to:toCode,shape:'corridor-NS'};
        }
        if(pureEW){
          const dir=dc>=0?'E':'W';
          emit(`  corridor(${dir}): ${actualFrom}(${fc.r},${fc.c})→${actualTo}(${tc.r},${tc.c})`);
          const e1=walkLeg(actualFrom,fc.r,fc.c,tc.r,tc.c,dir);if(!e1)return{ok:false,error:'corridor failed',created};
          if(e1.code!==actualTo){WBAPI.editField('node',e1.code,dir,actualTo);WBAPI.editField('node',actualTo,OPP4[dir],e1.code);emit(`  wired ${e1.code}.${dir}→${actualTo}`);}
          return{ok:true,created,from:fromCode,to:toCode,shape:'corridor-EW'};
        }
        // L-shape: walk dominant axis first, then minor axis
        const goH=absDC>=absDR;
        const L1=goH?(dc>=0?'E':'W'):(dr>=0?'S':'N');
        const L2=goH?(dr>=0?'S':'N'):(dc>=0?'E':'W');
        const eR=goH?fc.r:tc.r,eC=goH?tc.c:fc.c;
        emit(`  leg1(${L1}): ${actualFrom}(${fc.r},${fc.c})→elbow(${eR},${eC})`);
        const e1=walkLeg(actualFrom,fc.r,fc.c,eR,eC,L1);if(!e1)return{ok:false,error:'leg1 failed',created};
        const eKey=`${eR},${eC}`;let elbJ=occ.get(eKey);
        if(!elbJ){elbJ=nextJ();if(!addJ(elbJ,eR,eC,L1,e1.code))return{ok:false,error:'elbow failed',created};emit(`  elbow ${elbJ}(${eR},${eC})`);}
        else{if(!nm[e1.code]?.[L1]){WBAPI.editField('node',e1.code,L1,elbJ);WBAPI.editField('node',elbJ,OPP4[L1],e1.code);}}
        const ec=WBAPI.nodeCoords[elbJ]||{r:eR,c:eC};
        emit(`  leg2(${L2}): elbow→${actualTo}(${tc.r},${tc.c})`);
        const e2=walkLeg(elbJ,ec.r,ec.c,tc.r,tc.c,L2);if(!e2)return{ok:false,error:'leg2 failed',created};
        if(e2.code!==actualTo){WBAPI.editField('node',e2.code,L2,actualTo);WBAPI.editField('node',actualTo,OPP4[L2],e2.code);emit(`  wired ${e2.code}.${L2}→${actualTo}`);}
        return{ok:true,created,from:fromCode,to:toCode,shape:'L-shape'};
      };

      // ── helper: rewrite NODE_COORDS in _rawSrc from current WBAPI.nodeCoords ─
      const rewriteCoords = () => {
        const CS='// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆',CE='// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
        const si=WBAPI._rawSrc.indexOf(CS)+CS.length,ei=WBAPI._rawSrc.indexOf(CE);
        const ents=Object.entries(WBAPI.nodeCoords).sort(([,a],[,b])=>(a.r-b.r)||(a.c-b.c));
        let ns=`\nconst NODE_COORDS = { // → doc: maps.md §NODE_COORDS\n`;let pb=-999;
        for(const[ec,ep]of ents){const band=Math.floor(ep.r/8)*8;if(band!==pb&&pb!==-999)ns+='\n';ns+=`  ${ec}:{r:${ep.r},c:${ep.c}},\n`;pb=band;}
        ns+=`};\n`;WBAPI._rawSrc=WBAPI._rawSrc.slice(0,si)+ns+WBAPI._rawSrc.slice(ei);
      };

      emit(`\n  ${'█'.repeat(62)}`);
      emit(`  ██  MEGAREWEAVE  execute=${execute}  step=${step}  maxRip=${maxRip}  maxFix=${maxFix}  ██`);
      emit(`  ${'█'.repeat(62)}`);
      emit(`  Road: 0/jct-reduce → 1/geo-seed → 2/rip-connect → 3/coord-scan → 4/fix-broken`);
      emit(`        5/fix-bidir → 6/highways → 7/city-mesh → 8/derelict → 9/grid-connect → 10/wither → 11/xjct → final-bridge → bidir → xjct2 → bidir → xjct3 → bidir → cross → bidir → xjct4 → bidir`);

      // ── INIT snapshot ─────────────────────────────────────────────────────
      const rwT0 = Date.now();
      {
        nm = WBAPI.nodeMap;
        const initAll  = Object.keys(nm);
        const initJct  = initAll.filter(c=>!!nm[c]?.junction);
        const initNamed= initAll.length - initJct.length;
        const initCoordCoverage = initAll.filter(c=>!!WBAPI.nodeCoords[c]).length;
        const initReach = bfsReach(getHub());
        const initUnreach = initAll.length - initReach.size;
        const initQuestRefs = new Set();
        for (const q of Object.values(WBAPI.questDb||{}))
          for (const f of ['activateNode','waypointNode']) if (q[f]) initQuestRefs.add(q[f]);
        emit(`[init] ${nodeStats()}  coords=${initCoordCoverage}/${initAll.length}`);
        emit(`[init] reachable=${initReach.size}/${initAll.length}  unreachable=${initUnreach}`);
        emit(`[init] quests=${Object.keys(WBAPI.questDb||{}).length}  quest-ref nodes=${initQuestRefs.size}  npcs=${Object.keys(WBAPI.npcDb||{}).length}`);
        emit(`[init] ${heapMB()}`);
      }

      // ══════════════════════════════════════════════════════════════════════
      // PHASE PRE — junction straight-chain reduction
      // Exhausts all A-J-B straight-line junctions (J with exactly 2 opposite
      // connections and no quest/NPC refs) before any other pass runs.
      // Max 10 passes; stops early when a pass reduces 0.
      // ══════════════════════════════════════════════════════════════════════
      phaseBanner('P_PRE: junction straight-chain reduction', `execute=${execute}`);
      {
        const donePreT = phaseTime('p_pre');
        emit(`  [p_pre start] ${nodeStats()}  ${heapMB()}`);
        const preQRefs = {};
        for (const q of Object.values(WBAPI.questDb||{}))
          for (const f of ['activateNode','waypointNode']) if (q[f]) preQRefs[q[f]] = (preQRefs[q[f]]||0)+1;
        const preNpcNodes = new Set(Object.values(WBAPI.npcDb||{}).map(n=>n.node).filter(Boolean));
        let totalPreReduced = 0;
        for (let pp = 1; pp <= 10; pp++) {
          nm = WBAPI.nodeMap;
          let passReduced = 0;
          const allJ = Object.keys(nm).filter(c => nm[c]?.junction && !preQRefs[c] && !preNpcNodes.has(c));
          sectionBanner(`P_PRE pass ${pp}/10: ${allJ.length} eligible junctions`);
          let prei = 0;
          for (const code of allJ) {
            prei++;
            if (prei%200===0) await yieldOnce();
            const connDirs = DIRS4.filter(d => nm[code]?.[d] && nm[nm[code][d]]);
            if (connDirs.length !== 2) continue;
            const [dirA, dirB] = connDirs;
            if (OPP4[dirA] !== dirB) continue;  // L-shaped — skip
            const nodeA = nm[code][dirA], nodeB = nm[code][dirB];
            if (!nm[nodeA] || !nm[nodeB]) continue;
            const r1 = WBAPI.editField('node', nodeA, OPP4[dirA], nodeB);
            if (!r1?.ok) continue;
            const r2 = WBAPI.editField('node', nodeB, OPP4[dirB], nodeA);
            if (!r2?.ok) { WBAPI.editField('node', nodeA, OPP4[dirA], code); continue; }
            WBAPI.deleteNodeSource(code);
            delete nm[code]; delete WBAPI.nodeCoords[code];
            passReduced++; totalPreReduced++;
            emit(`  [pre-reduce] ${code} stitched ${nodeA}${OPP4[dirA]}↔${nodeB}`);
          }
          emit(`  [p_pre pass ${pp}] reduced=${passReduced}  totalReduced=${totalPreReduced}`);
          if (passReduced === 0) { emit(`[p_pre] converged after ${pp} pass${pp>1?'es':''}`); break; }
          rewriteCoords(); WBAPI._buildIndexes(); batchSave(`p_pre-${pp}`); nm = WBAPI.nodeMap;
          if (pp === 10) emit(`[p_pre] hit max 10 passes`);
        }
        emit(`[p_pre] done: ${totalPreReduced} straight-chain junctions removed`);
        emit(`  [p_pre end] ${nodeStats()}  ${heapMB()}`); donePreT();
        if (totalPreReduced > 0) { rewriteCoords(); WBAPI._buildIndexes(); batchSave('p_pre-final'); nm = WBAPI.nodeMap; }
      }

      // ══════════════════════════════════════════════════════════════════════
      // PHASE 0 — geo-seed: lock all GEO2 cities to Mercator lat/lon
      // ══════════════════════════════════════════════════════════════════════
      phaseBanner('P0: geo-seed', `execute=${execute&&geoSeed}`);
      if(execute&&geoSeed){
        const doneP0 = phaseTime('p0');
        const minLat=-8,maxLat=68,minLon=-25,maxLon=72,gridMin=8,gridMax=500;
        const occ0=new Map();
        let p0New=0,p0Moved=0,p0Skip=0;
        for(const[c,g]of Object.entries(GEO2)){
          if(!nm[c]){emit(`  skip ${c} (not in nodeMap)`);p0Skip++;continue;}
          let r=Math.round(gridMin+(maxLat-g.lat)/(maxLat-minLat)*(gridMax-gridMin));
          let col=Math.round(gridMin+(g.lon-minLon)/(maxLon-minLon)*(gridMax-gridMin));
          r=Math.max(gridMin,Math.min(gridMax,r));col=Math.max(gridMin,Math.min(gridMax,col));
          for(let t=0;occ0.has(`${r},${col}`)&&t<20;t++)col++;
          const had=WBAPI.nodeCoords[c];
          if(!had) p0New++; else if(had.r!==r||had.c!==col) p0Moved++;
          WBAPI.nodeCoords[c]={r,c:col};occ0.set(`${r},${col}`,c);
          emit(`  ${c}→(${r},${col})${had?had.r!==r||had.c!==col?' [moved from ('+had.r+','+had.c+')]':' [unchanged]':' [new]'}`);
        }
        rewriteCoords();batchSave('p0-geo-seed');nm=WBAPI.nodeMap;
        emit(`[p0] done: ${Object.keys(GEO2).filter(c=>nm[c]).length} cities placed  new=${p0New}  moved=${p0Moved}  skipped=${p0Skip}`);
        doneP0();
      }else emit(`[p0] skipped`);

      // ══════════════════════════════════════════════════════════════════════
      // PHASE 1 — rip-and-connect loop
      // ══════════════════════════════════════════════════════════════════════
      phaseBanner('P1: rip-and-connect', `maxRip=${maxRip}  limit=${limit}  execute=${execute}`);
      const doneP1 = phaseTime('p1');
      emit(`  [p1 start] ${nodeStats()}  ${heapMB()}`);
      const deg = code => DIRS4.filter(d => nm[code]?.[d] && nm[nm[code][d]]).length;
      // p1SlotSeen: global set of slot codes already tried — avoids revisiting exhausted slots across passes
      const p1SlotSeen = new Set();
      const findSlot = (cityCode) => {
        const vis=new Set(),q=[{code:cityCode,depth:0}];
        while(q.length){const{code,depth}=q.shift();if(vis.has(code)||depth>2000)continue;vis.add(code);if(!p1SlotSeen.has(code)){const d=deg(code);if(d<3)return{code,degree:d,freeSlots:DIRS4.filter(dir=>!nm[code]?.[dir]),needsJunction:false};if(d===3)return{code,degree:d,freeSlots:DIRS4.filter(dir=>!nm[code]?.[dir]),needsJunction:true};}for(const dir of DIRS4){const t=nm[code]?.[dir];if(t&&nm[t]&&!vis.has(t))q.push({code:t,depth:depth+1});}}return null;
      };

      // Build nodeQuestRefs: stray node code → count of quest activateNode/waypointNode refs
      const nodeQuestRefs = {};
      for (const q of Object.values(WBAPI.questDb || {})) {
        for (const f of ['activateNode','waypointNode']) { if (q[f]) nodeQuestRefs[q[f]] = (nodeQuestRefs[q[f]] || 0) + 1; }
      }

      // ── reductJunctionCheck ───────────────────────────────────────────────────
      // If `code` is a chain junction — exactly 2 connections in opposite cardinal
      // directions, both neighbors are junctions, no quest/NPC content — stitch the
      // two neighbors directly together and delete `code`.
      //
      // A─code─B  →  A─────B   (one fewer node, same connectivity)
      //
      // Returns {reduced:false} if the node cannot be reduced.
      // Returns {reduced:true, nodeA, nodeB, dirA} on success.
      const reductJunctionCheck = (code) => {
        const node = nm[code];
        if (!node?.junction) return {reduced:false};        // only junctions
        if (nodeQuestRefs[code]) return {reduced:false};    // has quest refs
        if (Object.values(WBAPI.npcDb||{}).some(n=>n.node===code)) return {reduced:false};

        // Exactly 2 live connections
        const connDirs = DIRS4.filter(d => nm[code]?.[d] && nm[nm[code][d]]);
        if (connDirs.length !== 2) return {reduced:false};
        const [dirA, dirB] = connDirs;
        if (OPP4[dirA] !== dirB) return {reduced:false};   // L-shaped, not a straight chain

        const nodeA = nm[code][dirA];   // code ─dirA→ nodeA
        const nodeB = nm[code][dirB];   // code ─dirB→ nodeB  (dirB = OPP4[dirA])
        if (!nm[nodeA] || !nm[nodeB]) return {reduced:false};

        // Wire nodeA.OPP4[dirA] = nodeB  (was code, now skips straight to nodeB)
        const r1 = WBAPI.editField('node', nodeA, OPP4[dirA], nodeB);
        if (!r1?.ok) return {reduced:false};

        // Wire nodeB.OPP4[dirB] = nodeA  (was code, now skips straight to nodeA)
        const r2 = WBAPI.editField('node', nodeB, OPP4[dirB], nodeA);
        if (!r2?.ok) {
          WBAPI.editField('node', nodeA, OPP4[dirA], code); // rollback
          return {reduced:false};
        }

        // Remove code from NODE_MAP source (brace-depth aware — handles multi-line entries)
        WBAPI.deleteNodeSource(code);
        delete nm[code];
        delete WBAPI.nodeCoords[code];
        emit(`  [reduce] ${code} removed — stitched ${nodeA}${OPP4[dirA]}↔${nodeB} (was ${dirA}↔${dirB} chain)`);
        return {reduced:true, nodeA, nodeB, dirA};
      };

      const ripPhase = [];
      const p1MoveCounts = new Map();
      const p1Skipped = new Set();
      let p1LastFingerprint = '', p1SameCount = 0;
      // Cross-pass accumulators for P1
      let p1TotalPlaced=0, p1TotalNoSlot=0, p1TotalWireFail=0, p1TotalPasses=0, p1TotalStrays=0;

      for (let pass = 1; pass <= maxRip; pass++) {
        nm = WBAPI.nodeMap; // refresh after each batchSave reload
        const hub1=getHub();const reachable=bfsReach(hub1);
        const allStrays = Object.keys(nm).filter(c => !reachable.has(c));
        const strays = allStrays.filter(c => !p1Skipped.has(c));
        const doneP1pass = phaseTime(`p1-pass-${pass}`);
        emit(`[p1 pass ${pass}] totalStrays=${allStrays.length}  active=${strays.length}  skipped=${p1Skipped.size}`);
        if (!strays.length) { emit(`[p1 pass ${pass}] no active strays — stopping`); break; }

        // Cycle detection: same active stray fingerprint for 3 consecutive passes → stop
        const fingerprint = strays.slice().sort().join(',');
        if(fingerprint===p1LastFingerprint){p1SameCount++;if(p1SameCount>=3){emit(`[p1 pass ${pass}] cycle detected (${p1SameCount} identical passes) — stopping`);break;}}
        else{p1LastFingerprint=fingerprint;p1SameCount=0;}

        const reachableCities = Object.keys(nm).filter(c => reachable.has(c) && ['city','airport'].includes(nm[c]?.name));
        const allCoords = WBAPI.nodeCoords;
        const occupied  = new Map(Object.entries(allCoords).map(([c,p])=>[`${p.r},${p.c}`,c]));
        const allocated = new Map(occupied);

        // Slot cache: precompute findSlot(city) for every reachable city once per pass.
        // When a slot is wired or marked seen, invalidateSlot re-runs BFS only for the
        // cities that pointed to that slot — O(C×V) per pass instead of O(S×C×V).
        const p1SlotCache = new Map();
        const invalidateSlot = (slotCode) => {
          const toRefresh = [];
          for (const [c, s] of p1SlotCache) if (s.code === slotCode) { p1SlotCache.delete(c); toRefresh.push(c); }
          for (const c of toRefresh) { const s = findSlot(c); if (s) p1SlotCache.set(c, s); }
        };
        for (const city of reachableCities) { const s = findSlot(city); if (s) p1SlotCache.set(city, s); }
        emit(`  [p1 pass ${pass}] slot cache: ${p1SlotCache.size}/${reachableCities.length} cities cached`);

        let placed=0, failed=0, wireFailed=0;
        const passLog = [];
        const straysToProcess = strays.slice(0, limit);
        const p1Tick = 1;
        const p1Edits = []; // accumulated node edits — flushed to source via batchEditNode at end
        sectionBanner(`P1 PASS ${pass}/${maxRip}: rip-and-connect — ${straysToProcess.length} strays`);
        let p1i = 0;
        for (const stray of straysToProcess) {
          p1i++;
          if(p1i===1||p1i===straysToProcess.length||p1i%p1Tick===0){
            nestedProgressLine('p1 pass', pass, maxRip, 'stray', p1i, straysToProcess.length,
              `placed=${placed} no_slot=${failed} wf=${wireFailed} │ ∑placed=${p1TotalPlaced+placed} ∑passes=${p1TotalPasses} ∑strays=${p1TotalStrays+p1i}`);
            if(p1i%200===0)await yieldOnce();
          }
          const shuffled = reachableCities.slice().sort(()=>Math.random()-0.5);
          let bestCity=null,bestScore=-1,bestSlot=null,bestDir=null,bestNr=null,bestNc=null;
          for (const city of shuffled) {
            const slot=p1SlotCache.get(city); if(!slot)continue;
            let score=(nodeQuestRefs[stray]||0)*5;
            const cs=allCoords[stray],cc=allCoords[city];
            if(cs&&cc){const dist=Math.abs(cs.r-cc.r)+Math.abs(cs.c-cc.c);score+=Math.max(0,30-dist);}
            score+=slot.needsJunction?0:2;
            const slotCoord=allCoords[slot.code]; if(!slotCoord)continue;
            for(const dir of slot.freeSlots){const nr=slotCoord.r+DR4[dir],nc=slotCoord.c+DC4[dir];if(!allocated.has(`${nr},${nc}`)){if(score>bestScore){bestScore=score;bestCity=city;bestSlot=slot;bestDir=dir;bestNr=nr;bestNc=nc;}break;}}
          }
          if(!bestCity||!bestSlot){failed++;passLog.push({stray,status:'no_slot'});continue;}
          allocated.set(`${bestNr},${bestNc}`,stray);
          if(!execute){passLog.push({stray,city:bestCity,slot:bestSlot.code,dir:bestDir,status:'would_place'});continue;}
          WBAPI.nodeCoords[stray]={r:bestNr,c:bestNc};
          // Update in-memory nodeMap directly (defer source update to batchEditNode after loop)
          if(!nm[bestSlot.code]){wireFailed++;p1SlotSeen.add(bestSlot.code);invalidateSlot(bestSlot.code);continue;}
          nm[bestSlot.code][bestDir] = stray;
          if(nm[stray]) nm[stray][OPP4[bestDir]] = bestSlot.code;
          p1Edits.push({code:bestSlot.code, field:bestDir, value:stray});
          p1Edits.push({code:stray, field:OPP4[bestDir], value:bestSlot.code});
          // wire succeeded — track moves, mark slot as seen (now has fewer free slots)
          const moves=(p1MoveCounts.get(stray)||0)+1;
          p1MoveCounts.set(stray,moves);
          if(moves>=10){
            const rd = reductJunctionCheck(stray);
            if(rd.reduced){
              // Node is gone — refresh slot cache for its former neighbors
              if(rd.nodeA) invalidateSlot(rd.nodeA);
              if(rd.nodeB) invalidateSlot(rd.nodeB);
              p1MoveCounts.delete(stray);
              emit(`  [p1] reduced chain ${stray} after ${moves} oscillations — not skipped`);
            } else {
              p1Skipped.add(stray);
              emit(`  [p1] SKIP ${stray} after ${moves} moves (not reducible)`);
            }
          }
          p1SlotSeen.delete(bestSlot.code);
          invalidateSlot(bestSlot.code); // slot gained a connection — refresh freeSlots for affected cities
          placed++; passLog.push({stray,city:bestCity,slot:bestSlot.code,dir:bestDir,coord:{r:bestNr,c:bestNc},status:'placed',moves});
          emit(`  [p1] ${stray} → ${bestCity} via ${bestSlot.code}.${bestDir} (${bestNr},${bestNc}) moves=${moves}`);
        }
        // Flush all deferred node edits to source in ONE respliceSection call (~100-1000× faster)
        if(execute&&p1Edits.length){const br=WBAPI.batchEditNode(p1Edits);emit(`  [p1] batch flushed: applied=${br.applied} failed=${br.failed}`);}
        p1TotalPlaced+=placed; p1TotalNoSlot+=failed; p1TotalWireFail+=wireFailed; p1TotalPasses++; p1TotalStrays+=p1i;
        emit(`  └── [p1 pass ${pass} summary] placed=${placed} no_slot=${failed} wf=${wireFailed}  │  ∑placed=${p1TotalPlaced} ∑no_slot=${p1TotalNoSlot} ∑wf=${p1TotalWireFail} ∑passes=${p1TotalPasses} ∑strays=${p1TotalStrays}`);
        doneP1pass();
        ripPhase.push({pass,totalStrays:allStrays.length,placed,failed,wireFailed,details:passLog});
        if(execute&&placed>0){
          const CS='// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆',CE='// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
          const si=WBAPI._rawSrc.indexOf(CS)+CS.length,ei=WBAPI._rawSrc.indexOf(CE);
          const ents=Object.entries(WBAPI.nodeCoords).sort(([,a],[,b])=>(a.r-b.r)||(a.c-b.c));
          let ns=`\nconst NODE_COORDS = { // → doc: maps.md §NODE_COORDS\n`;let pb=-999;
          for(const [ec,ep]of ents){const band=Math.floor(ep.r/8)*8;if(band!==pb&&pb!==-999)ns+='\n';ns+=`  ${ec}:{r:${ep.r},c:${ep.c}},\n`;pb=band;}
          ns+=`};\n`;
          WBAPI._rawSrc=WBAPI._rawSrc.slice(0,si)+ns+WBAPI._rawSrc.slice(ei);
          WBAPI._buildIndexes();
          batchSave(`rip-pass-${pass}`);
          nm = WBAPI.nodeMap; // sync after reload
        }
        if(placed===0&&!execute){emit(`[p1 pass ${pass}] dry-run: ${passLog.filter(p=>p.status==='would_place').length} would place`);break;}
        if(execute&&placed===0&&wireFailed===0){emit(`[p1 pass ${pass}] nothing placed — stopping`);break;}
        if(execute&&placed===0&&wireFailed>0){emit(`[p1 pass ${pass}] all ${wireFailed} wires failed — slots exhausted or unreachable`);}
      }
      {
        // Final P1 report: remaining unreachable nodes after all passes
        nm = WBAPI.nodeMap;
        const p1FinalReach = bfsReach(getHub());
        const p1FinalUnreach = Object.keys(nm).filter(c => !p1FinalReach.has(c));
        const p1UnreachNamed = p1FinalUnreach.filter(c => !nm[c]?.junction);
        const p1UnreachJct   = p1FinalUnreach.filter(c => !!nm[c]?.junction);
        if (p1FinalUnreach.length) {
          emit(`[p1 final] still unreachable: ${p1FinalUnreach.length} total  named=${p1UnreachNamed.length}  junctions=${p1UnreachJct.length}`);
          if (p1UnreachNamed.length) emit(`  unreachable named: ${p1UnreachNamed.map(c=>`${c}(${nm[c]?.label||nm[c]?.name||'?'})`).join('  ')}`);
        } else {
          emit(`[p1 final] all nodes reachable ✓`);
        }
        if (p1Skipped.size) {
          const skippedNamed = [...p1Skipped].filter(c=>!nm[c]?.junction);
          if (skippedNamed.length) emit(`[p1 final] permanently skipped named: ${skippedNamed.map(c=>`${c}(${nm[c]?.label||nm[c]?.name||'?'})`).join('  ')}`);
          emit(`[p1 final] skipped set: ${p1Skipped.size} total  named=${skippedNamed.length}`);
        }
        emit(`  [p1 end] ${nodeStats()}  ${heapMB()}`); doneP1();
      }

      // ══════════════════════════════════════════════════════════════════════
      // PHASE 1.5 — coordinate-scan: derive connections from grid positions
      // Coordinates are the truth. If two nodes sit at adjacent or near-adjacent
      // cells (≤ maxGap apart, same axis, no intermediate node), wire them.
      // This makes the grid traversable by cell position, not just by wired links.
      // ══════════════════════════════════════════════════════════════════════
      {
        const scanGap=4; // wire nodes up to this many cells apart in one axis
        phaseBanner('P1.5: coord-scan', `gap=${scanGap}  execute=${execute}`);
        const doneP15 = phaseTime('p1.5');
        nm=WBAPI.nodeMap;
        const cmap=new Map(Object.entries(WBAPI.nodeCoords).map(([c,p])=>[`${p.r},${p.c}`,c]));
        let p15added=0,p15skipped=0;
        const p15Entries=Object.entries(WBAPI.nodeCoords);
        const p15Tick=1;
        sectionBanner(`P1.5: coord-scan — ${p15Entries.length} nodes × 4 dirs`);
        let p15i=0;
        for(const[code,coord]of p15Entries){
          p15i++;
          if(p15i===1||p15i===p15Entries.length||p15i%p15Tick===0){
            progressLine('p1.5 coord-scan', p15i, p15Entries.length, `added=${p15added} skipped=${p15skipped}`);
            if(p15i%200===0)await yieldOnce();
          }
          if(!nm[code])continue;
          for(const dir of DIRS4){
            if(nm[code]?.[dir])continue; // already connected this way
            // find nearest neighbor in this direction within scanGap
            for(let d=1;d<=scanGap;d++){
              const nr=coord.r+DR4[dir]*d,nc=coord.c+DC4[dir]*d;
              const adj=cmap.get(`${nr},${nc}`);
              if(!adj){continue;} // empty cell — keep scanning
              if(!nm[adj]){break;}
              if(nm[adj]?.[OPP4[dir]]){p15skipped++;break;} // neighbor already wired back
              // check no intermediate node between code and adj
              let hasIntermediate=false;
              for(let i=1;i<d;i++){if(cmap.has(`${coord.r+DR4[dir]*i},${coord.c+DC4[dir]*i}`)){hasIntermediate=true;break;}}
              if(hasIntermediate){break;}
              if(execute){
                const r1=WBAPI.editField('node',code,dir,adj);
                const r2=WBAPI.editField('node',adj,OPP4[dir],code);
                if(r1?.ok&&r2?.ok){p15added++;emit(`  [p1.5] ${code}↔${adj} (${dir} gap=${d})`);}
                else{emit(`  [p1.5] FAIL ${code}↔${adj}: ${r1?.error||''} ${r2?.error||''}`);}
              } else {
                p15added++;
              }
              break; // wire to nearest only
            }
          }
        }
        emit(`  └── [p1.5 coord-scan summary] scanned=${p15i}/${p15Entries.length} added=${p15added} skipped=${p15skipped}`);
        emit(`[p1.5] done: ${p15added} connections ${execute?'added':'would add'}  ${p15skipped} skipped`);
        doneP15();
        if(execute&&p15added>0){rewriteCoords();WBAPI._buildIndexes();batchSave('p1.5-coord-scan');nm=WBAPI.nodeMap;}
      }

      // ══════════════════════════════════════════════════════════════════════
      // PHASE P_CLEAN: dangling exit cleanup
      // Null out any N/S/E/W exit that points to a code not in NODE_MAP.
      // Runs before P4 so fix-all-broken doesn't waste passes on dead targets.
      // ══════════════════════════════════════════════════════════════════════
      {
        phaseBanner('P_CLEAN:dangling-exits', `execute=${execute}`);
        const doneClean = phaseTime('p_clean');
        nm = WBAPI.nodeMap;
        const dangling = [];
        for (const [code, node] of Object.entries(nm)) {
          for (const d of DIRS4) {
            const tgt = node[d];
            if (!tgt || nm[tgt]) continue; // null or valid → skip
            dangling.push({ code, dir:d, tgt });
          }
        }
        emit(`  [p_clean] dangling exits found: ${dangling.length}${dangling.length ? '  sample: ' + dangling.slice(0,5).map(x=>`${x.code}.${x.dir}→${x.tgt}`).join('  ') : ' ✓'}`);
        if (execute && dangling.length > 0) {
          let cleaned = 0;
          for (const { code, dir } of dangling) {
            const r = WBAPI.editField('node', code, dir, null);
            if (r.ok) cleaned++;
          }
          emit(`  [p_clean] nulled ${cleaned} dangling exits`);
          if (cleaned > 0) { batchSave('p_clean'); nm = WBAPI.nodeMap; }
        } else if (!execute) {
          emit(`  [p_clean] dry-run — would null ${dangling.length} exits`);
          dangling.slice(0, 20).forEach(x => emit(`    ${x.code}.${x.dir} → ${x.tgt} (missing)`));
        }
        doneClean();
      }

      // ══════════════════════════════════════════════════════════════════════
      // PHASE 4 — fix-all-broken loop
      // ══════════════════════════════════════════════════════════════════════
      phaseBanner('P4: fix-all-broken', `maxFix=${maxFix}  execute=${execute}`);
      const doneP4 = phaseTime('p4');
      emit(`  [p4 start] ${nodeStats()}  ${heapMB()}`);
      const fixPhase = [];
      const DIAG = ['NW','NE','SW','SE'];
      let noImprovePasses = 0, prevBrokenCount = Infinity;

      // Cached junction code counter — initialised once from nm, then O(1) per call.
      // Never reset after batchSave: our counter is always >= the max in the reloaded nm.
      let _jMax = null;
      const nextJCode = () => {
        if (_jMax === null) {
          const nums = Object.keys(nm).filter(c=>/^J\d+$/.test(c)).map(c=>+c.slice(1));
          _jMax = nums.length ? Math.max(...nums) : 0;
        }
        return `J${++_jMax}`;
      };
      // Cached node num counter — same pattern, avoids O(V) reduce per junction.
      let _nmMaxNum = null;
      const nextNodeNum = () => {
        if (_nmMaxNum === null) _nmMaxNum = Object.values(nm).reduce((m,n)=>Math.max(m,n.num||0),0);
        return ++_nmMaxNum;
      };
      const maxGap = 4;

      // ── P4 incremental edge-scan cache ────────────────────────────────────
      // Full scan is O(V×4). Each pass only a small delta of nodes change
      // (moved nodes + newly-created elbows). scanBrokenEdges(nodeFilter) scans
      // just those nodes; the rest of the broken-edge list is kept from last pass.
      const scanBrokenEdges = (nodeFilter = null) => {
        const result = [], seen = new Set();
        const coords = WBAPI.nodeCoords;
        const nodesToScan = nodeFilter ? [...nodeFilter] : Object.keys(nm);
        // Build occupied map once per scan call — shared across all suggestBetween calls
        const occ = new Map(Object.entries(coords).map(([c,p]) => [`${p.r},${p.c}`, c]));
        for (const code of nodesToScan) {
          const dirs = nm[code]; if (!dirs) continue;
          const cc = coords[code];
          for (const d of DIRS4) {
            const tgt = dirs[d]; if (!tgt) continue;
            const key = [code,tgt].sort().join(':'); if (seen.has(key)) continue; seen.add(key);
            const tc = coords[tgt]; if (!cc||!tc) continue;
            const dr=tc.r-cc.r, dc=tc.c-cc.c;
            const gap = d in{N:1,S:1}?Math.abs(dr):Math.abs(dc);
            const off = d in{N:1,S:1}?Math.abs(dc):Math.abs(dr);
            let type=null;
            if(off>0&&gap>maxGap) type='diagonal_and_gap';
            else if(off>0) type='diagonal';
            else if(gap>maxGap) type='gap_too_large';
            if (type) {
              const axisSnapped=(type!=='gap_too_large')?((d==='N'||d==='S')?{r:tc.r,c:cc.c}:{r:cc.r,c:tc.c}):tc;
              const candidates=suggestBetween(cc,axisSnapped,d,coords,type!=='gap_too_large'?tgt:null,undefined,occ);
              const best=candidates.find(c=>c.free)||candidates[0];
              result.push({from:code,dir:d,to:tgt,type,moveSuggestion:{node:type!=='gap_too_large'?tgt:'(new junction)',recommended:best,candidates}});
            }
          }
        }
        return result;
      };
      let p4EdgeCache = null;      // null → full scan needed
      let p4DirtyNodes = new Set(); // nodes modified last pass, edges re-scanned next pass
      let p4Deferred = [];          // {from,dir,to,type,deferredSince} — ages across passes
      // Cross-pass accumulators — show "how many passed around" across all P4 passes
      let p4TotalFixed=0, p4TotalDeferred=0, p4TotalBlocked=0, p4TotalPasses=0, p4TotalEdges=0;

      // promoteJunction: flip junction:true → junction:false so the node becomes a real location
      const promoteJunction = (jCode) => {
        const SM='// ◆◆◆ WORLDBUILDER:NODE_MAP:START ◆◆◆', EM='// ◆◆◆ WORLDBUILDER:NODE_MAP:END ◆◆◆';
        const am=WBAPI._rawSrc.indexOf(SM)+SM.length, em=WBAPI._rawSrc.indexOf(EM);
        if (am>=SM.length && em>=0) {
          const sec=WBAPI._rawSrc.slice(am,em);
          const re=new RegExp(`^([ \\t]*${jCode}\\s*:\\s*\\{[^\\n]+)$`,'m');
          const m=re.exec(sec);
          if (m) {
            const updated=m[1].replace(/\bjunction\s*:\s*true\b/,'junction:false');
            WBAPI._rawSrc=WBAPI._rawSrc.slice(0,am)+sec.replace(m[1],updated)+WBAPI._rawSrc.slice(em);
          }
        }
        if (nm[jCode]) nm[jCode].junction=false;
        p4DirtyNodes.add(jCode);
        emit(`  [p4] promoted ${jCode} → location (4-connected, no longer a placeholder)`);
        return {promoted:true};
      };

      // backfillAroundJunction: after creating elbow J, fill its free adjacent cells
      // with deferred edges from p4Deferred, then check if J earned promotion.
      // Returns {backfilled:N, promoted:bool}
      const backfillAroundJunction = (jCode, occ, pass) => {
        let backfilled = 0;
        const jCoord = WBAPI.nodeCoords[jCode];
        if (!jCoord) return {backfilled:0, promoted:false};

        for (const freeDir of DIRS4) {
          if (nm[jCode]?.[freeDir]) continue; // already wired
          const nr = jCoord.r + DR4[freeDir];
          const nc = jCoord.c + DC4[freeDir];
          if (occ.has(`${nr},${nc}`)) continue; // cell taken

          // Direction K would use to wire back to J
          const backToJ = OPP4[freeDir];

          // Score every deferred candidate: does this cell sit along its path?
          let bestIdx=-1, bestScore=-1;
          for (let i=0; i<p4Deferred.length; i++) {
            const def = p4Deferred[i];
            const fc = WBAPI.nodeCoords[def.from];
            if (!fc || !WBAPI.nodeCoords[def.to]) continue;
            // backToJ must not conflict with def's axis directions
            if (backToJ===def.dir || backToJ===OPP4[def.dir]) continue;
            // (nr,nc) must lie roughly along def.from's def.dir axis
            const onAxis = (def.dir==='N'||def.dir==='S')
              ? Math.abs(nc-fc.c)<=1
              : Math.abs(nr-fc.r)<=1;
            if (!onAxis) continue;
            // must be in the right direction from def.from
            if (def.dir==='N' && nr>=fc.r) continue;
            if (def.dir==='S' && nr<=fc.r) continue;
            if (def.dir==='E' && nc<=fc.c) continue;
            if (def.dir==='W' && nc>=fc.c) continue;
            const dist=Math.abs(nr-fc.r)+Math.abs(nc-fc.c);
            const score=(pass-def.deferredSince)*2 + Math.max(0,20-dist);
            if (score>bestScore) { bestScore=score; bestIdx=i; }
          }
          if (bestIdx===-1) continue;

          const def = p4Deferred.splice(bestIdx,1)[0];
          const kCode = nextJCode();
          const kTerrain = nm[def.from]?.name||'junction';
          const kAct = nm[def.from]?.act||1;
          // use code (not label) for junction endpoints to prevent exponential label growth
          const kLabFrom = nm[def.from]?.junction ? def.from : (nm[def.from]?.label||def.from);
          const kLabTo   = nm[def.to]?.junction   ? def.to   : (nm[def.to]?.label||def.to);
          const kBody = {
            name:kTerrain, label:`${kLabFrom} ↔ ${kLabTo} Junction`,
            text:`A crossroads between ${kLabFrom} and ${kLabTo}.`,
            act:kAct, junction:true, npc:null, battle:null, loot:null, sleep:false,
            [OPP4[def.dir]]:def.from, [def.dir]:def.to, [backToJ]:jCode
          };
          const kEntry=serializeNodeLiteral(kCode,kBody);
          const kIns=insertBeforeSectionClose('NODE_MAP',kEntry);
          if (!kIns.ok) { p4Deferred.splice(bestIdx,0,def); continue; } // restore on failure

          nm[kCode]={...kBody,num:nextNodeNum()};
          WBAPI.nodeCoords[kCode]={r:nr,c:nc}; // batched at batchSave
          // Wire all three nodes
          WBAPI.editField('node',def.from,def.dir,kCode);
          WBAPI.editField('node',def.to,OPP4[def.dir],kCode);
          WBAPI.editField('node',jCode,freeDir,kCode);
          occ.set(`${nr},${nc}`,kCode);
          backfilled++;
          p4DirtyNodes.add(kCode); p4DirtyNodes.add(def.from); p4DirtyNodes.add(def.to);
          emit(`  [p4] backfill ${kCode}@(${nr},${nc}): resolves ${def.from}.${def.dir}→${def.to}  wired J.${freeDir}→${kCode}  age=${pass-def.deferredSince}`);
        }

        // Promotion check: J is 4-connected → no longer a placeholder
        const jDeg = DIRS4.filter(d=>nm[jCode]?.[d]&&nm[nm[jCode][d]]).length;
        if (jDeg>=4 && nm[jCode]?.junction) return {...promoteJunction(jCode), backfilled};
        return {backfilled, promoted:false};
      };

      // expandGrid: when an edge is stuck (aged 3+ passes), expand the grid by inserting
      // a row and column at the contention point, guaranteeing a free cell.
      // Steps: (1) record crossing edges that will gain +1 gap, (2) shift all coords,
      // (3) rebuild occ, (4) repair any newly-broken crossing edges, (5) backfill
      // deferred edges into the new empty row/col, (6) return the free intersection cell.
      const expandGrid = (from, dir, occ) => {
        const fc = WBAPI.nodeCoords[from]; if (!fc) return null;
        const insertR = fc.r + DR4[dir];
        const insertC = fc.c + DC4[dir];
        emit(`  [p4] ⊞ grid expand: inserting row ${insertR} + col ${insertC}  (pressure at ${from}.${dir})`);

        // Collect clean N/S edges at exactly maxGap that cross insertR (will break after +1)
        // Collect clean E/W edges at exactly maxGap that cross insertC
        const crossRow = [], crossCol = [], ceSeen = new Set();
        for (const [code, dirs] of Object.entries(nm)) {
          const cc2 = WBAPI.nodeCoords[code]; if (!cc2) continue;
          for (const d of DIRS4) {
            const tgt = dirs[d]; if (!tgt) continue;
            const tc2 = WBAPI.nodeCoords[tgt]; if (!tc2) continue;
            const key = [code,tgt].sort().join(':'); if (ceSeen.has(key)) continue; ceSeen.add(key);
            const offNS = Math.abs(tc2.c - cc2.c), gapNS = Math.abs(tc2.r - cc2.r);
            const offEW = Math.abs(tc2.r - cc2.r), gapEW = Math.abs(tc2.c - cc2.c);
            if ((d==='N'||d==='S') && offNS===0 && gapNS===maxGap &&
                Math.min(cc2.r,tc2.r)<insertR && Math.max(cc2.r,tc2.r)>=insertR)
              crossRow.push({code,tgt,col:cc2.c});
            if ((d==='E'||d==='W') && offEW===0 && gapEW===maxGap &&
                Math.min(cc2.c,tc2.c)<insertC && Math.max(cc2.c,tc2.c)>=insertC)
              crossCol.push({code,tgt,row:cc2.r});
          }
        }

        // Shift all coords atomically: rows >= insertR shift +1, cols >= insertC shift +1
        for (const code of Object.keys(WBAPI.nodeCoords)) {
          const coord = WBAPI.nodeCoords[code];
          WBAPI.nodeCoords[code] = {
            r: coord.r >= insertR ? coord.r+1 : coord.r,
            c: coord.c >= insertC ? coord.c+1 : coord.c
          };
        }
        // Rebuild occ from new coords (rewriteCoords deferred to end of expandGrid)
        occ.clear();
        for (const [code, coord] of Object.entries(WBAPI.nodeCoords)) occ.set(`${coord.r},${coord.c}`, code);

        // Edge cache is fully stale after a coord shift — force full rescan next pass
        p4EdgeCache = null; p4DirtyNodes = new Set();

        // Helper: insert a repair/backfill junction into NODE_MAP + NODE_COORDS + nm
        // Compute grid bounds once for outer-row guard
        const allCoordVals = Object.values(WBAPI.nodeCoords);
        const gridBoundR = allCoordVals.reduce((m,p)=>Math.max(m,p.r),0);
        const gridBoundC = allCoordVals.reduce((m,p)=>Math.max(m,p.c),0);
        const GRID_MARGIN = 4; // cells to keep clear from edge

        const plantJunction = (jc, r, c, body) => {
          // Outer-row guard: refuse to plant on grid boundary — throw back to deferred
          if (r <= GRID_MARGIN || c <= GRID_MARGIN || r >= gridBoundR - GRID_MARGIN || c >= gridBoundC - GRID_MARGIN) {
            emit(`  [p4] ⊞ outer-row guard: (${r},${c}) is at grid boundary — skipping, re-deferred`);
            return false;
          }
          const entry = serializeNodeLiteral(jc, body);
          if (!insertBeforeSectionClose('NODE_MAP', entry).ok) return false;
          nm[jc] = {...body, num: nextNodeNum()};
          WBAPI.nodeCoords[jc] = {r, c};
          const CS='// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆', CE='// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
          const si=WBAPI._rawSrc.indexOf(CS)+CS.length, ei=WBAPI._rawSrc.indexOf(CE);
          let sec=WBAPI._rawSrc.slice(si,ei);
          sec=sec.slice(0,sec.lastIndexOf('\n};')+1)+`  ${jc}:{r:${r},c:${c}},\n`+sec.slice(sec.lastIndexOf('\n};')+1);
          WBAPI._rawSrc=WBAPI._rawSrc.slice(0,si)+sec+WBAPI._rawSrc.slice(ei);
          occ.set(`${r},${c}`, jc);
          return true;
        };

        // Repair row-crossing edges: place a junction on the empty row insertR
        let repaired = 0;
        for (const {code, tgt, col} of crossRow) {
          const cc2=WBAPI.nodeCoords[code], tc2=WBAPI.nodeCoords[tgt]; if(!cc2||!tc2) continue;
          const upCode = cc2.r < tc2.r ? code : tgt;
          const dnCode = cc2.r < tc2.r ? tgt : code;
          let placed = false;
          for (let dc=0; dc<=maxGap*2 && !placed; dc++) {
            for (const cTry of dc===0?[col]:[col+dc,col-dc]) {
              if (occ.has(`${insertR},${cTry}`)) continue;
              const rCode = nextJCode();
              const rBody = {name:nm[upCode]?.name||'junction',label:'Repair Junction',text:'Grid repair junction.',
                             act:nm[upCode]?.act||1,junction:true,npc:null,battle:null,loot:null,sleep:false,N:upCode,S:dnCode};
              if (!plantJunction(rCode,insertR,cTry,rBody)) break;
              WBAPI.editField('node',upCode,'S',rCode); WBAPI.editField('node',dnCode,'N',rCode);
              emit(`  [p4] ⊞ row-repair ${rCode}@(${insertR},${cTry}) bridges ${upCode}↔${dnCode}`);
              repaired++; placed=true; break;
            }
          }
          if (!placed) emit(`  [p4] ⊞ WARN: row-repair for ${code}↔${tgt} has no free cell on row ${insertR}`);
        }

        // Repair col-crossing edges: place a junction on the empty col insertC
        for (const {code, tgt, row} of crossCol) {
          const cc2=WBAPI.nodeCoords[code], tc2=WBAPI.nodeCoords[tgt]; if(!cc2||!tc2) continue;
          const lCode = cc2.c < tc2.c ? code : tgt;
          const rCode2 = cc2.c < tc2.c ? tgt : code;
          let placed = false;
          for (let dr=0; dr<=maxGap*2 && !placed; dr++) {
            for (const rTry of dr===0?[row]:[row+dr,row-dr]) {
              if (occ.has(`${rTry},${insertC}`)) continue;
              const rcCode = nextJCode();
              const rcBody = {name:nm[lCode]?.name||'junction',label:'Repair Junction',text:'Grid repair junction.',
                              act:nm[lCode]?.act||1,junction:true,npc:null,battle:null,loot:null,sleep:false,W:lCode,E:rCode2};
              if (!plantJunction(rcCode,rTry,insertC,rcBody)) break;
              WBAPI.editField('node',lCode,'E',rcCode); WBAPI.editField('node',rCode2,'W',rcCode);
              emit(`  [p4] ⊞ col-repair ${rcCode}@(${rTry},${insertC}) bridges ${lCode}↔${rCode2}`);
              repaired++; placed=true; break;
            }
          }
        }

        // Backfill deferred edges into the new empty row/col (up to 6)
        let bfCount = 0;
        for (const def of [...p4Deferred]) {
          if (bfCount >= 6) break;
          const df2=WBAPI.nodeCoords[def.from], dt2=WBAPI.nodeCoords[def.to];
          if (!df2||!dt2) continue;
          const useRow = (def.dir==='N'||def.dir==='S') && Math.abs(df2.c-insertC)<=maxGap*2 &&
                         ((def.dir==='N'&&df2.r>insertR)||(def.dir==='S'&&df2.r<insertR));
          const useCol = (def.dir==='E'||def.dir==='W') && Math.abs(df2.r-insertR)<=maxGap*2 &&
                         ((def.dir==='E'&&df2.c<insertC)||(def.dir==='W'&&df2.c>insertC));
          if (!useRow && !useCol) continue;
          const baseR=useRow?insertR:df2.r, baseC=useCol?insertC:df2.c;
          let placed=false;
          for (let dv=0; dv<=maxGap&&!placed; dv++) {
            for (const delta of dv===0?[0]:[-dv,dv]) {
              const cr=baseR+(useCol?delta:0), cc3=baseC+(useRow?delta:0);
              if (occ.has(`${cr},${cc3}`)) continue;
              const bCode=nextJCode();
              const bBody={name:nm[def.from]?.name||'junction',
                label:`${nm[def.from]?.label||def.from} ↔ ${nm[def.to]?.label||def.to} Junction`,
                text:'Grid-expansion junction.',act:nm[def.from]?.act||1,
                junction:true,npc:null,battle:null,loot:null,sleep:false,
                [OPP4[def.dir]]:def.from,[def.dir]:def.to};
              if (!plantJunction(bCode,cr,cc3,bBody)) break;
              WBAPI.editField('node',def.from,def.dir,bCode);
              WBAPI.editField('node',def.to,OPP4[def.dir],bCode);
              const idx=p4Deferred.indexOf(def); if(idx>=0) p4Deferred.splice(idx,1);
              emit(`  [p4] ⊞ axis-backfill ${bCode}@(${cr},${cc3}): resolves ${def.from}.${def.dir}→${def.to}`);
              bfCount++; placed=true; break;
            }
          }
        }

        // Single rewriteCoords covers shift + all planted junctions
        rewriteCoords(); WBAPI._buildIndexes();
        emit(`  [p4] ⊞ expand complete: repaired=${repaired}  axis_backfill=${bfCount}  free=(${insertR},${insertC})`);
        return {r:insertR, c:insertC};
      };

      for (let pass = 1; pass <= maxFix; pass++) {
        // ── edge scan (incremental cache) ─────────────────────────────────────
        let edges;
        if (!p4EdgeCache) {
          edges = scanBrokenEdges();
          p4EdgeCache = edges;
          emit(`  [p4] full scan: ${edges.length} broken edges`);
        } else {
          const keptEdges = p4EdgeCache.filter(e => !p4DirtyNodes.has(e.from) && !p4DirtyNodes.has(e.to));
          const seenInKept = new Set(keptEdges.map(e => [e.from,e.to].sort().join(':')));
          const freshEdges = scanBrokenEdges(p4DirtyNodes).filter(e => !seenInKept.has([e.from,e.to].sort().join(':')));
          edges = [...keptEdges, ...freshEdges];
          p4EdgeCache = edges;
          emit(`  [p4] incremental scan: kept=${keptEdges.length}  nodes_rescanned=${p4DirtyNodes.size}  new=${freshEdges.length}  total=${edges.length}`);
          p4DirtyNodes = new Set();
        }
        const brokenCount=edges.length;
        // Prune deferred queue: drop entries whose edge is no longer broken (resolved last pass)
        if (p4Deferred.length) {
          const edgeKeySet=new Set(edges.map(e=>`${e.from}:${e.dir}:${e.to}`));
          const before=p4Deferred.length;
          p4Deferred=p4Deferred.filter(d=>edgeKeySet.has(`${d.from}:${d.dir}:${d.to}`));
          emit(`  [p4] deferred queue: ${p4Deferred.length} pending${before>p4Deferred.length?'  ('+( before-p4Deferred.length)+' resolved last pass)':''}`);
        }
        // Type breakdown + sample of worst edges
        { const byType={}; for(const e of edges) byType[e.type]=(byType[e.type]||0)+1;
          const btStr=Object.entries(byType).map(([t,n])=>`${t}=${n}`).join('  ');
          emit(`[p4 pass ${pass}] broken=${brokenCount}  prevBroken=${prevBrokenCount===Infinity?'—':prevBrokenCount}  [${btStr}]`);
          if(pass===1){
            const samples=edges.filter(e=>e.type!=='missing_coords').slice(0,5);
            for(const s of samples) emit(`  sample: ${s.from}.${s.dir}→${s.to} [${s.type}]`);
          }
        }

        if(brokenCount===0){emit(`[p4 pass ${pass}] 0 broken — stopping`);fixPhase.push({pass,broken:0,fixed:0,failed:0,status:'clean'});break;}

        // Stopping: if count didn't improve for 2 consecutive passes, stop
        if(brokenCount>=prevBrokenCount){
          noImprovePasses++;
          emit(`[p4 pass ${pass}] no improvement (${prevBrokenCount}→${brokenCount}) consecutiveNoImprove=${noImprovePasses}`);
          if(noImprovePasses>=2){emit(`[p4 pass ${pass}] plateau — stopping fix-all-broken`);fixPhase.push({pass,broken:brokenCount,fixed:0,failed:0,status:'plateau'});break;}
        } else {
          noImprovePasses=0;
        }
        prevBrokenCount=brokenCount;

        if(!execute){fixPhase.push({pass,broken:brokenCount,fixed:0,failed:0,status:'dry-run'});emit(`[p4 pass ${pass}] dry-run — would attempt ${brokenCount} fixes`);continue;}

        let fixed=0,failed=0,deferred=0;
        const passDetails=[];
        const occ=new Map(Object.entries(WBAPI.nodeCoords).map(([c,p])=>[`${p.r},${p.c}`,c]));
        const p4Tick=1;
        sectionBanner(`P4 PASS ${pass}/${maxFix}: fix-all-broken — ${edges.length} broken edges`);
        let p4i=0;
        for(const edge of edges){
          p4i++;
          if(p4i===1||p4i===edges.length||p4i%p4Tick===0){
            nestedProgressLine('p4 pass', pass, maxFix, 'edge', p4i, edges.length,
              `fixed=${fixed} def=${deferred} blk=${failed} │ ∑fixed=${p4TotalFixed+fixed} ∑def=${p4TotalDeferred+deferred} ∑passes=${p4TotalPasses} ∑edges=${p4TotalEdges+p4i}`);
            if(p4i%200===0)await yieldOnce();
          }
          const{from,dir,to,type,moveSuggestion:ms}=edge;
          // Try move first
          if(ms?.recommended&&ms.node&&ms.node!=='(new junction)'){
            const{r,c}=ms.recommended;
            const destKey=`${r},${c}`;
            if(!occ.has(destKey)||occ.get(destKey)===ms.node){
              const old=WBAPI.nodeCoords[ms.node];
              if(old)occ.delete(`${old.r},${old.c}`);
              WBAPI.nodeCoords[ms.node]={r,c};
              occ.set(destKey,ms.node);
              fixed++;
              emit(`  [p4] move ${ms.node} → (${r},${c}) [${type}]`);
              passDetails.push({from,dir,to,type,action:'move',node:ms.node,coord:{r,c}});
              continue;
            }
          }
          // Spawn elbow junction
          const cc=WBAPI.nodeCoords[from];if(!cc){failed++;continue;}
          let jR=cc.r,jC=cc.c,found=false;
          for(let d2=1;d2<=8;d2++){const nr=cc.r+DR4[dir]*d2,nc=cc.c+DC4[dir]*d2;if(!occ.has(`${nr},${nc}`)){jR=nr;jC=nc;found=true;break;}}
          if(!found){
            // Try reducing 'from' if it is a straight chain junction.
            // If 'from' only ties two other junctions (A←from→to), stitching A↔to
            // removes the node entirely and resolves the broken edge without deferring.
            const rdFrom = reductJunctionCheck(from);
            if(rdFrom.reduced){
              p4DirtyNodes.add(rdFrom.nodeA); p4DirtyNodes.add(rdFrom.nodeB);
              // Remove any cache entries involving the now-deleted node
              if(p4EdgeCache) p4EdgeCache=p4EdgeCache.filter(e=>e.from!==from&&e.to!==from);
              // Also remove from deferred queue if it was aging there
              const dIdx=p4Deferred.findIndex(d=>d.from===from||d.to===from);
              if(dIdx>=0) p4Deferred.splice(dIdx,1);
              fixed++;
              passDetails.push({from,dir,to,type,action:'reduced',nodeA:rdFrom.nodeA,nodeB:rdFrom.nodeB});
              continue; // edge is gone — move on
            }
            // Check if this edge is aged (stuck 3+ passes) → try grid expansion
            const existingDef = p4Deferred.find(d=>d.from===from&&d.dir===dir&&d.to===to);
            if (existingDef && pass-existingDef.deferredSince >= 3) {
              emit(`  [p4] ⊞ ${from}.${dir} aged ${pass-existingDef.deferredSince} passes → triggering grid expand`);
              const freeCell = expandGrid(from, dir, occ);
              if (freeCell) {
                jR=freeCell.r; jC=freeCell.c; found=true;
                const idx=p4Deferred.indexOf(existingDef); if(idx>=0) p4Deferred.splice(idx,1);
              }
            }
          }
          if(!found){
            deferred++;
            emit(`  [p4] still searching: ${from}.${dir}→${to} — area packed within 8 cells, will retry next pass`);
            passDetails.push({from,dir,to,type,action:'elbow_deferred',reason:'area_full'});
            if (!p4Deferred.find(d=>d.from===from&&d.dir===dir&&d.to===to)) {
              p4Deferred.push({from,dir,to,type,deferredSince:pass});
            }
            continue;
          }
          const jCode=nextJCode();
          const terrain=nm[from]?.name||'junction';
          const act=nm[from]?.act||1;
          const jBody={name:terrain,label:`${nm[from]?.label||from} ↔ ${nm[to]?.label||to} Junction`,text:`A crossroads on the road between ${nm[from]?.label||from} and ${nm[to]?.label||to}.`,act,junction:true,npc:null,battle:null,loot:null,sleep:false,[OPP4[dir]]:from,[dir]:to};
          const jEntry=serializeNodeLiteral(jCode,jBody);
          const ins=insertBeforeSectionClose('NODE_MAP',jEntry);
          if(!ins.ok){failed++;emit(`  [p4] insert blocked: ${jCode} (${from}.${dir}→${to}) — ${ins.error}`);passDetails.push({from,dir,to,type,action:'elbow_blocked',reason:ins.error});continue;}
          nm[jCode]={...jBody,num:nextNodeNum()};
          WBAPI.nodeCoords[jCode]={r:jR,c:jC}; // _rawSrc coords batched at end-of-pass batchSave
          WBAPI.editField('node',from,dir,jCode);
          WBAPI.editField('node',to,OPP4[dir],jCode);
          occ.set(`${jR},${jC}`,jCode);
          fixed++;
          emit(`  [p4] elbow ${jCode} at (${jR},${jC}) between ${from}.${dir}→${to} [${type}]`);
          passDetails.push({from,dir,to,type,action:'elbow',jCode,coord:{r:jR,c:jC}});
          // Backfill deferred edges into free cells adjacent to this new junction
          if (p4Deferred.length) {
            const bf=backfillAroundJunction(jCode,occ,pass);
            if (bf.backfilled>0) { fixed+=bf.backfilled; deferred=Math.max(0,deferred-bf.backfilled); }
          }
        }

        // Collect nodes modified this pass — only these are re-scanned next pass
        for (const d of passDetails) {
          if (d.action === 'move')  { p4DirtyNodes.add(d.from); p4DirtyNodes.add(d.to); p4DirtyNodes.add(d.node); }
          if (d.action === 'elbow') { p4DirtyNodes.add(d.from); p4DirtyNodes.add(d.to); p4DirtyNodes.add(d.jCode); }
        }
        emit(`  [p4] dirty nodes queued for next scan: ${p4DirtyNodes.size}`);

        // Save + reload once per pass
        // Rewrite NODE_COORDS to reflect all moves in this pass
        if(fixed>0){
          const CS2='// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆',CE2='// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
          const si2=WBAPI._rawSrc.indexOf(CS2)+CS2.length,ei2=WBAPI._rawSrc.indexOf(CE2);
          const ents2=Object.entries(WBAPI.nodeCoords).sort(([,a],[,b])=>(a.r-b.r)||(a.c-b.c));
          let ns2=`\nconst NODE_COORDS = { // → doc: maps.md §NODE_COORDS\n`;let pb2=-999;
          for(const [ec,ep]of ents2){const band=Math.floor(ep.r/8)*8;if(band!==pb2&&pb2!==-999)ns2+='\n';ns2+=`  ${ec}:{r:${ep.r},c:${ep.c}},\n`;pb2=band;}
          ns2+=`};\n`;
          WBAPI._rawSrc=WBAPI._rawSrc.slice(0,si2)+ns2+WBAPI._rawSrc.slice(ei2);
          WBAPI._buildIndexes();
          batchSave(`fix-pass-${pass}`);
          nm = WBAPI.nodeMap; // sync after reload
        }
        p4TotalFixed+=fixed; p4TotalDeferred+=deferred; p4TotalBlocked+=failed; p4TotalPasses++; p4TotalEdges+=edges.length;
        emit(`  └── [p4 pass ${pass} summary] fixed=${fixed} def=${deferred} blk=${failed}  │  ∑fixed=${p4TotalFixed} ∑def=${p4TotalDeferred} ∑edges=${p4TotalEdges} ∑passes=${p4TotalPasses}`);
        fixPhase.push({pass,broken:brokenCount,fixed,failed:failed+deferred,details:passDetails});
        emit(`[p4 pass ${pass}] done: ${fixed} fixed  ${deferred} deferred  ${failed} blocked  brokenAfter=~${brokenCount-fixed+Math.floor(fixed*0.6)}`);
      }
      emit(`  [p4 end] ${nodeStats()}  ${heapMB()}`); doneP4();

      // ══════════════════════════════════════════════════════════════════════
      // PHASE 5 — fix-bidirectional (one pass)
      // ══════════════════════════════════════════════════════════════════════
      phaseBanner('P5: fix-bidirectional', `execute=${execute}`);
      const doneP5 = phaseTime('p5');
      const bidirFixed=[], bidirErrors=[];
      const OPP2b={N:'S',S:'N',E:'W',W:'E'};
      const biTargets=Object.entries(nm).flatMap(([code,n])=>
        ['N','S','E','W'].filter(d=>n[d]&&nm[n[d]]&&nm[n[d]][OPP2b[d]]!==code).map(d=>({code,dir:d,target:n[d]})));
      // breakdown by direction so we know what kind of links dominate
      const biDirCount={N:0,S:0,E:0,W:0};biTargets.forEach(t=>biDirCount[t.dir]++);
      const biJct=biTargets.filter(t=>/^J\d+$/.test(t.code)).length;
      const biNamed=biTargets.length-biJct;
      emit(`[p5] ${biTargets.length} one-way links  N=${biDirCount.N} S=${biDirCount.S} E=${biDirCount.E} W=${biDirCount.W}  named=${biNamed} junction=${biJct}`);
      if(biTargets.length>0)emit(`[p5] sample: ${biTargets.slice(0,3).map(t=>`${t.code}.${t.dir}→${t.target}`).join('  ')}`);
      if(execute){
        // also fix diagonals in audit/map/fix style
        const DIAG2b=['NW','NE','SW','SE'];
        let diagFixed=0;
        // strip diagonals inline
        for(const [code,n] of Object.entries(nm)){
          for(const d of DIAG2b){
            if(n[d]==null)continue;
            const S2='// ◆◆◆ WORLDBUILDER:NODE_MAP:START ◆◆◆',E2='// ◆◆◆ WORLDBUILDER:NODE_MAP:END ◆◆◆';
            const a2=WBAPI._rawSrc.indexOf(S2)+S2.length,e2=WBAPI._rawSrc.indexOf(E2);
            if(a2<S2.length||e2<0)continue;
            const sec2=WBAPI._rawSrc.slice(a2,e2);
            const lineRe2=new RegExp(`^([ \\t]*${code}\\s*:\\s*\\{[^\\n]+)$`,'m');
            const m2=lineRe2.exec(sec2);if(!m2)continue;
            const before2=m2[1];
            const after2=before2.replace(new RegExp(`,\\s*${d}\\s*:\\s*'[^']*'`),'').replace(new RegExp(`\\b${d}\\s*:\\s*'[^']*',?\\s*`),'');
            if(after2===before2)continue;
            WBAPI._rawSrc=WBAPI._rawSrc.slice(0,a2)+sec2.replace(before2,after2)+WBAPI._rawSrc.slice(e2);
            delete nm[code][d];
            bidirFixed.push({check:'diagonal_exit',code,dir:d});
            diagFixed++;
          }
        }
        if(diagFixed>0)emit(`[p5] stripped ${diagFixed} diagonal direction fields`);
        sectionBanner(`P5: fix-bidirectional — ${biTargets.length} one-way links  (diagonal-stripped: ${diagFixed})`);
        emit(`[p5] queuing ${biTargets.length} editField calls — patch queue batches them into one batchSave flush`);
        {const h=process.memoryUsage();emit(`  [p5 pre-fix] heapUsed=${Math.round(h.heapUsed/1e6)}MB  rss=${Math.round(h.rss/1e6)}MB`);}

        let p5i=0;
        for(const{code,dir,target}of biTargets){
          p5i++;
          if(p5i%200===0) await yieldOnce();
          if(!nm[target]){bidirErrors.push({code,dir,target,error:'target not in NODE_MAP'});continue;}
          if(nm[target][OPP2b[dir]]===code)continue;
          const r2=WBAPI.editField('node',target,OPP2b[dir],code);
          if(r2.ok)bidirFixed.push({check:'bidirectional',code,dir,target,set:`${target}.${OPP2b[dir]}="${code}"`});
          else bidirErrors.push({code,dir,target,error:r2.error});
        }
        {const h=process.memoryUsage();emit(`  [p5 post-queue] heapUsed=${Math.round(h.heapUsed/1e6)}MB  rss=${Math.round(h.rss/1e6)}MB  queued=${WBAPI._pendingPatches?.size||0} nodes`);}

        const p5Bidir=bidirFixed.filter(x=>x.check==='bidirectional').length;
        emit(`  └── [p5 fix-bidir summary] processed=${p5i}/${biTargets.length}  bidir-fixed=${p5Bidir}  diag-fixed=${diagFixed}  errors=${bidirErrors.length}`);
        if(bidirErrors.length>0)emit(`  [p5 errors] sample: ${bidirErrors.slice(0,3).map(e=>`${e.code}.${e.dir}→${e.target}: ${e.error}`).join('  ')}`);
        emit(`[p5] saving — flushPatches() will batchEditNode all queued writes in one pass`);
        if(bidirFixed.length){batchSave('fix-bidir');nm=WBAPI.nodeMap;emit(`[p5] save complete — nodeMap reloaded, nodes=${Object.keys(nm).length}`);}
        emit(`[p5] done: ${p5Bidir} bidir-fixed  ${diagFixed} diag-fixed  ${bidirErrors.length} errors  →  next: P2 highways`);
        doneP5();
      } else {
        emit(`[p5] dry-run: ${biTargets.length} would fix`);
      }

      // ══════════════════════════════════════════════════════════════════════
      // PHASE 2 — priority highways
      // ══════════════════════════════════════════════════════════════════════
      phaseBanner('P2: priority highways', `configured=${priorityHighways.length}`);
      { const doneP2=phaseTime('p2');
      if(execute&&priorityHighways.length){
        for(const{from,to,note}of priorityHighways){
          emit(`  highway: ${from}→${to}${note?' ('+note+')':''}`);
          if(!nm[from]){emit(`  SKIP: ${from} not in nodeMap`);continue;}
          if(!nm[to]){emit(`  SKIP: ${to} not in nodeMap`);continue;}
          if(!WBAPI.nodeCoords[from]){emit(`  SKIP: ${from} has no coords (run geo-seed first)`);continue;}
          if(!WBAPI.nodeCoords[to]){emit(`  SKIP: ${to} has no coords`);continue;}
          const r=buildHighway(from,to);
          if(r.ok){rewriteCoords();WBAPI._buildIndexes();batchSave(`p2-hwy-${from}-${to}`);nm=WBAPI.nodeMap;emit(`  done: ${r.created.length} junctions`);}
          else emit(`  FAILED: ${r.error}`);
        }
      }else emit(`[p2] skipped (execute=${execute}, highways=${priorityHighways.length})`);
      doneP2(); }

      // ══════════════════════════════════════════════════════════════════════
      // PHASE 3 — city mesh MST: connect all GEO2 cities greedily
      // ══════════════════════════════════════════════════════════════════════
      phaseBanner('P3: city-mesh MST', `execute=${execute&&cityMesh}`);
      const doneP3 = phaseTime('p3');
      if(execute&&cityMesh){
        let hub3=getHub(),reach3=bfsReach(hub3);
        const geoCities=Object.keys(GEO2).filter(c=>nm[c]&&WBAPI.nodeCoords[c]);
        let unreach=geoCities.filter(c=>!reach3.has(c));
        emit(`  GEO2 cities: ${geoCities.length}  unreachable: ${unreach.length}  hub: ${hub3}`);
        const MAX_MESH=geoCities.length+1000;
        let pass3=0;
        while(unreach.length>0&&pass3<MAX_MESH){
          pass3++;
          let bU=null,bR=null,bD=Infinity;
          for(const u of unreach){
            const uc=WBAPI.nodeCoords[u];if(!uc)continue;
            for(const r of reach3){const rc=WBAPI.nodeCoords[r];if(!rc)continue;const d=Math.abs(uc.r-rc.r)+Math.abs(uc.c-rc.c);if(d<bD){bD=d;bU=u;bR=r;}}
          }
          if(!bU)break;
          emit(`  [mesh ${pass3}] ${bR}(${nm[bR]?.label||''})→${bU}(${nm[bU]?.label||''}) dist=${bD}`);
          const r3=buildHighway(bR,bU);
          if(r3.ok){
            rewriteCoords();WBAPI._buildIndexes();batchSave(`p3-mesh-${pass3}`);nm=WBAPI.nodeMap;
            reach3=bfsReach(getHub());unreach=geoCities.filter(c=>!reach3.has(c));
            emit(`  done: ${r3.created.length} junctions  shape=${r3.shape}  unreachable=${unreach.length}`);
          }else{emit(`  FAILED: ${r3.error} — skipping ${bU}`);unreach=unreach.filter(c=>c!==bU);}
        }
        emit(`[p3] done: ${geoCities.length-unreach.length}/${geoCities.length} GEO2 cities reachable`);
      }else{
        const reach3=bfsReach(getHub());
        const geoCities=Object.keys(GEO2).filter(c=>nm[c]);
        emit(`[p3] dry-run: ${geoCities.filter(c=>!reach3.has(c)).length} GEO2 cities would be connected`);
      }
      doneP3();

      // ══════════════════════════════════════════════════════════════════════
      // PHASE 6 — derelict cleanup (dead-end no-quest junctions)
      // ══════════════════════════════════════════════════════════════════════
      // PHASE 6 — derelict cleanup (dead-end junctions with no quests/NPCs)
      // ══════════════════════════════════════════════════════════════════════
      phaseBanner('P6: derelict-cleanup', `execute=${execute&&derelictCleanup}`);
      const doneP6 = phaseTime('p6'); emit(`  [p6 start] ${nodeStats()}`);

      if(execute&&derelictCleanup){
        const qRefs=new Set();
        for(const q of Object.values(WBAPI.questDb||{})){for(const f of['activateNode','waypointNode'])if(q[f])qRefs.add(q[f]);}
        const npcN=new Set(Object.values(WBAPI.npcDb||{}).map(n=>n.node).filter(Boolean));
        const isDer=code=>{const n=nm[code];return n&&n.junction&&!qRefs.has(code)&&!npcN.has(code);};
        let totalDel=0;
        for(let dp=1;dp<=2000;dp++){
          const degF=code=>DIRS4.filter(d=>nm[code]?.[d]&&nm[nm[code][d]]).length;
          const toDel=Object.keys(nm).filter(c=>isDer(c)&&degF(c)<=1);
          if(!toDel.length)break;
          const p6Tick=1;
          sectionBanner(`P6 PASS ${dp}: derelict-cleanup — ${toDel.length} degree≤1 derelicts  totalDel so far: ${totalDel}`);
          let p6i=0;
          for(const code of toDel){
            p6i++;
            if(p6i===1||p6i===toDel.length||p6i%p6Tick===0){
              nestedProgressLine('p6 pass', dp, 0, 'derelict', p6i, toDel.length, `totalDel=${totalDel}`);
              if(p6i%200===0)await yieldOnce();
            }
            for(const d of DIRS4){const nb=nm[code]?.[d];if(nb&&nm[nb])clearDir(nb,OPP4[d]);}
            WBAPI.deleteNodeSource(code);
            delete nm[code];delete WBAPI.nodeCoords[code];totalDel++;
            emit(`    deleted ${code}`);
          }
          emit(`  └── [p6 pass ${dp} derelict summary] deletedThisPass=${p6i} totalDel=${totalDel}`);
          rewriteCoords();WBAPI._buildIndexes();batchSave(`p6-derelict-${dp}`);nm=WBAPI.nodeMap;
        }
        emit(`[p6] done: ${totalDel} derelict junctions removed`);
      }else{
        const qRefs=new Set();
        for(const q of Object.values(WBAPI.questDb||{})){for(const f of['activateNode','waypointNode'])if(q[f])qRefs.add(q[f]);}
        const npcN=new Set(Object.values(WBAPI.npcDb||{}).map(n=>n.node).filter(Boolean));
        const degF=code=>DIRS4.filter(d=>nm[code]?.[d]&&nm[nm[code][d]]).length;
        const cnt=Object.keys(nm).filter(c=>nm[c]?.junction&&!qRefs.has(c)&&!npcN.has(c)&&degF(c)<=1).length;
        emit(`[p6] dry-run: ${cnt} derelict degree≤1 junctions found`);
      }
      doneP6();

      // ══════════════════════════════════════════════════════════════════════
      // PHASE 6.5 — junction grid-connect
      // For every 2-conn junction that has free cardinal directions, look at the
      // grid cell adjacent in each free direction. If an unoccupied-slot neighbor
      // exists there, wire the connection. Upgrades L-corner junctions into
      // T-intersections or full crossings. Runs up to 5 passes until stable.
      // ══════════════════════════════════════════════════════════════════════
      phaseBanner('P6.5: junction grid-connect', `execute=${execute}`);
      const doneP65 = phaseTime('p6.5');
      {
        const g65QRefs = new Set();
        for (const q of Object.values(WBAPI.questDb||{}))
          for (const f of ['activateNode','waypointNode']) if (q[f]) g65QRefs.add(q[f]);
        const g65NpcNodes = new Set(Object.values(WBAPI.npcDb||{}).map(n=>n.node).filter(Boolean));
        const DELTA = {N:[-1,0], S:[1,0], E:[0,1], W:[0,-1]};
        let totalGridWired = 0;

        emit(`[p6.5 start] ${heapMB()}`);
        for (let gp = 1; gp <= 5; gp++) {
          nm = WBAPI.nodeMap;
          const coords = WBAPI.nodeCoords;
          emit(`[p6.5 gp=${gp} pre-filter] ${heapMB()}`);
          const occ = new Map(Object.entries(coords).map(([c,p]) => [`${p.r},${p.c}`, c]));
          const junctions2 = Object.keys(nm).filter(c => {
            if (!nm[c]?.junction || g65QRefs.has(c) || g65NpcNodes.has(c)) return false;
            return DIRS4.filter(d => nm[c]?.[d] && nm[nm[c][d]]).length === 2;
          });
          emit(`[p6.5 gp=${gp} post-filter] ${heapMB()}  junctions2=${junctions2.length}`);
          if (!junctions2.length) { emit(`[p6.5] converged after ${gp-1} pass${gp>2?'es':''}`); break; }
          sectionBanner(`P6.5 PASS ${gp}/5: grid-connect — ${junctions2.length} 2-conn junctions`);
          await yieldOnce(); emit(`[p6.5 gp=${gp} pre-loop] ${heapMB()}`);
          let passWired = 0, gci = 0;
          try {
          for (const code of junctions2) {
            gci++;
            if (gci%500===0) {
              await yieldOnce();
              progressLine('p6.5 grid-connect', gci, junctions2.length, `wired=${passWired} ∑=${totalGridWired} queued=${WBAPI._pendingPatches?.size||0}`);
            }
            const jCoord = coords[code]; if (!jCoord) continue;
            for (const d of DIRS4.filter(d2 => !nm[code]?.[d2])) {
              const [dr, dc] = DELTA[d];
              const neighbor = occ.get(`${jCoord.r+dr},${jCoord.c+dc}`);
              if (!neighbor || !nm[neighbor] || nm[neighbor][OPP4[d]]) continue;
              if (execute) {
                WBAPI.editField('node', code, d, neighbor);
                WBAPI.editField('node', neighbor, OPP4[d], code);
                passWired++;
              } else passWired++;
            }
          }
          } catch(e65) { emit(`[p6.5 EXCEPTION gci=${gci}] ${e65?.message||e65} ${heapMB()}`); }
          if (!execute) { emit(`  [p6.5 pass ${gp}] would wire=${passWired}`); break; }
          {const h=process.memoryUsage();emit(`  [p6.5 pass ${gp}] wired=${passWired}  total=${totalGridWired+=passWired}  queued=${WBAPI._pendingPatches?.size||0}  heapUsed=${Math.round(h.heapUsed/1e6)}MB`);}
          if (passWired === 0) break;
          emit(`[p6.5 gp=${gp} pre-rewriteCoords] ${heapMB()}`);
          rewriteCoords();
          emit(`[p6.5 gp=${gp} post-rewriteCoords] ${heapMB()}`);
          WBAPI._buildIndexes();
          emit(`[p6.5 gp=${gp} pre-batchSave] ${heapMB()}`);
          batchSave(`p6.5-grid-${gp}`);
          emit(`[p6.5 gp=${gp} post-batchSave] ${heapMB()}`);
          nm = WBAPI.nodeMap;
        }
        emit(`[p6.5] done: ${totalGridWired} grid connections added`);
        doneP65();
      }

      let lastSnailUsage = null; // captured from runSnail(), used for post-reweave heat overlay

      // ══════════════════════════════════════════════════════════════════════
      // PHASE 7 — Wither: snail-traverse all quest paths, remove unused junctions
      // Simulates a snail walking from the hub to every quest's activateNode and
      // waypointNode via BFS shortest paths. Junctions not traversed by any quest
      // path AND not structural bridges (removing them keeps all named nodes
      // reachable) are withered (deleted). Multi-pass until stable.
      // Territory junctions have no gameplay coordinates — they can be recreated.
      // ══════════════════════════════════════════════════════════════════════
      {
        // Collect quest/NPC references — never wither nodes that have content
        const qRefW=new Set();
        for(const q of Object.values(WBAPI.questDb||{})){for(const f of['activateNode','waypointNode'])if(q[f])qRefW.add(q[f]);}
        const npcNodeW=new Set(Object.values(WBAPI.npcDb||{}).map(n=>n.node).filter(Boolean));

        // BFS shortest path from→to; returns array of node codes on the path, or []
        const bfsPath=(from,to)=>{
          if(!nm[from]||!nm[to])return[];
          if(from===to)return[from];
          const prev=new Map([[from,null]]);
          const q=[from];
          while(q.length){
            const cur=q.shift();
            for(const d of DIRS4){
              const next=nm[cur]?.[d];
              if(!next||!nm[next]||prev.has(next))continue;
              prev.set(next,cur);
              if(next===to){const path=[];let n=to;while(n!==null){path.unshift(n);n=prev.get(n);}return path;}
              q.push(next);
            }
          }
          return[];
        };

        // Snail: walk all quest paths + all-pairs GEO2 city routes, count junction traversals
        const runSnail=async ()=>{
          const usage=new Map();
          for(const code of Object.keys(nm))if(nm[code]?.junction&&!qRefW.has(code)&&!npcNodeW.has(code))usage.set(code,0);
          const hub=getHub();
          logTrace('wither-snail','starting traversal hub='+hub+' junctions='+usage.size);

          // Walk 1: hub → every quest activateNode and waypointNode
          const questList=Object.values(WBAPI.questDb||{});
          const w1Tick=1;
          let questPaths=0,questMisses=0,w1i=0;
          const snailMissedNodes = new Set();
          emit(`  [snail] walk1: ${questList.length} quests → hub=${hub}  junctions=${usage.size}  ${heapMB()}`);
          for(const q of questList){
            w1i++;
            if(w1i===1||w1i===questList.length||w1i%w1Tick===0){
              progressLine('snail walk1 quests',w1i,questList.length,`paths=${questPaths} misses=${questMisses}`);
              if(w1i%200===0)await yieldOnce();
            }
            for(const f of['activateNode','waypointNode']){
              const dest=q[f];if(!dest||!nm[dest])continue;
              const path=bfsPath(hub,dest);
              if(!path.length){questMisses++;snailMissedNodes.add(dest);logTrace('wither-snail-miss',`quest ${q.id||'?'} ${f}=${dest} unreachable`);continue;}
              questPaths++;
              for(const node of path){if(usage.has(node))usage.set(node,usage.get(node)+1);}
            }
          }
          emit(`  [snail] walk1 done: paths=${questPaths}  misses=${questMisses}`);
          if(snailMissedNodes.size) emit(`  [snail] walk1 missed nodes (${snailMissedNodes.size}): ${[...snailMissedNodes].map(c=>`${c}(${nm[c]?.label||nm[c]?.name||'?'})`).join('  ')}`);
          logTrace('wither-snail','walk1 quest paths='+questPaths+' misses='+questMisses);

          // Walk 2: all-pairs between GEO2 cities — marks inter-city corridor junctions
          // Optimized: O(C×V) BFS tree precompute + O(C²×L_avg) path trace
          // vs. old O(C²×V) all-pairs BFS. 20-100× faster for large graphs.
          const geoCodes=Object.keys(GEO2).filter(c=>nm[c]);
          const totalPairs=Math.floor(geoCodes.length*(geoCodes.length-1)/2);
          const w2Tick=1;
          let cityPaths=0,cityMisses=0,w2i=0;
          emit(`  [snail] walk2: ${geoCodes.length} cities → ${totalPairs} pairs (BFS-tree method)`);

          // Phase 2a: one BFS per city — build parent trees (O(C×V))
          const cityParent=new Map();
          let w2bfsI=0;
          for(const src of geoCodes){
            w2bfsI++;
            progressLine('snail walk2 bfs',w2bfsI,geoCodes.length,`building parent trees`);
            if(w2bfsI%10===0)await yieldOnce();
            if(!nm[src])continue;
            const parent=new Map([[src,null]]);
            const q=[src];
            while(q.length){
              const cur=q.shift();
              for(const d of DIRS4){
                const next=nm[cur]?.[d];
                if(!next||!nm[next]||parent.has(next))continue;
                parent.set(next,cur);
                q.push(next);
              }
            }
            cityParent.set(src,parent);
          }
          emit(`  [snail] walk2 bfs done: ${cityParent.size}/${geoCodes.length} trees built`);

          // Phase 2b: trace parent trees for all pairs — mark junctions (O(C²×L_avg))
          for(let i=0;i<geoCodes.length;i++){
            const parent=cityParent.get(geoCodes[i]);
            if(!parent)continue;
            for(let j=i+1;j<geoCodes.length;j++){
              w2i++;
              if(w2i===1||w2i===totalPairs||w2i%w2Tick===0){
                progressLine('snail walk2 city-pairs',w2i,totalPairs,`paths=${cityPaths} misses=${cityMisses} used=${[...usage.values()].filter(v=>v>0).length}`);
                if(w2i%200===0)await yieldOnce();
              }
              const t=geoCodes[j];
              if(!parent.has(t)){cityMisses++;logTrace('wither-snail-miss',`city ${geoCodes[i]}→${t} no path`);continue;}
              cityPaths++;
              let cur=t;
              while(cur!==null){
                if(usage.has(cur))usage.set(cur,usage.get(cur)+1);
                cur=parent.get(cur);
              }
            }
          }
          emit(`  [snail] walk2 done: paths=${cityPaths}  misses=${cityMisses}  cities=${geoCodes.length}`);
          logTrace('wither-snail','walk2 city pairs='+cityPaths+' misses='+cityMisses+' cities='+geoCodes.length);

          const used=[...usage.values()].filter(v=>v>0).length;
          const unused=usage.size-used;
          logTrace('wither-snail','done used='+used+' unused='+unused+' total_junctions='+usage.size);
          // Heat distribution summary
          { const vals=[...usage.values()];
            const cold=vals.filter(v=>v===0).length;
            const warm=vals.filter(v=>v>0&&v<=5).length;
            const hot=vals.filter(v=>v>5&&v<=20).length;
            const blazing=vals.filter(v=>v>20).length;
            const top5=[...usage.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);
            emit(`  [snail heat] cold=${cold}  warm(1-5)=${warm}  hot(6-20)=${hot}  blazing(21+)=${blazing}  total=${usage.size}`);
            emit(`  [snail heat] top: ${top5.map(([c,v])=>`${c}×${v}`).join('  ')}`);
          }
          emitHeatReport(usage);
          return usage;
        };

        // emitHeatReport: frequency-distribution + top hotspots from a snail usage map
        const emitHeatReport = (usage) => {
          const entries=[...usage.entries()];
          const total=entries.length;
          const usedCount=[...usage.values()].filter(v=>v>0).length;
          const unusedCount=total-usedCount;
          const BUCKETS=[
            {label:'never walked  (heat=0)    ',min:0,  max:0        },
            {label:'cold          (heat=1-5)   ',min:1,  max:5        },
            {label:'warm          (heat=6-20)  ',min:6,  max:20       },
            {label:'hot           (heat=21-100) ',min:21, max:100      },
            {label:'blazing       (heat=100+)  ',min:101,max:Infinity  },
          ];
          const lines=[];
          const w=(s)=>{emit(s);lines.push(s);};
          w(`  [heat] ═══ heat map distribution ══════════════════════════════════════════════════`);
          for(const{label,min,max}of BUCKETS){
            const n=entries.filter(([,v])=>v>=min&&v<=max).length;
            const pct=total>0?Math.round(n/total*100):0;
            const filled=Math.floor(pct/4),empty=25-filled; // wider bar (25 wide = 4% per block)
            w(`  [heat]   ${label}  ${String(n).padStart(6)}  [${'█'.repeat(filled)}${'░'.repeat(empty)}]  ${String(pct).padStart(3)}%`);
          }
          w(`  [heat]   total: ${total}   used=${usedCount}   unused(wither candidates)=${unusedCount}`);
          // Top 20 hotspot junctions
          const hotspots=entries.filter(([,v])=>v>0).sort(([,a],[,b])=>b-a).slice(0,20);
          if(hotspots.length){
            w(`  [heat] ─── top ${hotspots.length} hotspots ─────────────────────────────────────────────────────`);
            for(const[code,cnt]of hotspots){
              const coord=WBAPI.nodeCoords[code];
              const lbl=nm[code]?.label||'';
              w(`  [heat]   ${code.padEnd(14)}\t(${String(coord?.r??'?').padStart(4)},${String(coord?.c??'?').padStart(4)})\theat=${String(cnt).padStart(6)}\t${lbl}`);
            }
          }
          w(`  [heat] ════════════════════════════════════════════════════════════════════════════`);
          // Write heat map to file in milepoints/
          try {
            const stamp=new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);
            const heatFile=path.join(__dirname,'milepoints',`heatmap-${stamp}.txt`);
            fs.writeFileSync(heatFile, lines.join('\n')+'\n', 'utf8');
            emit(`  [heat] saved → ${path.basename(heatFile)}`);
          } catch(e){ emit(`  [heat] WARN: could not write heatmap file: ${e.message}`); }
        };

        // Tarjan's articulation-point algorithm — O(V+E) once per pass.
        // Returns the set of junction codes that are structural bridges: removing them
        // would disconnect at least one named (non-junction) node from the hub.
        // Uses an explicit stack so large graphs (~15k nodes) don't overflow JS call stack.
        const findUnsafeJunctions = () => {
          const disc = new Map(), low = new Map(), namedBelow = new Map();
          const unsafe = new Set();
          let timer = 0;
          const root = getHub();
          let rootDfsChildren = 0;

          // stack frames: [nodeCode, parentCode, dirIndex]
          const stack = [[root, null, 0]];
          disc.set(root, ++timer); low.set(root, timer);
          namedBelow.set(root, !nm[root]?.junction);

          while (stack.length) {
            const frame = stack[stack.length - 1];
            const v = frame[0], par = frame[1];
            let pushed = false;

            while (frame[2] < DIRS4.length) {
              const d = DIRS4[frame[2]++];
              const u = nm[v]?.[d];
              if (!u || !nm[u] || u === par) continue;
              if (!disc.has(u)) {
                // tree edge — push child frame
                disc.set(u, ++timer); low.set(u, timer);
                namedBelow.set(u, !nm[u]?.junction);
                stack.push([u, v, 0]);
                if (par === null) rootDfsChildren++;
                pushed = true;
                break;
              } else {
                // back edge to ancestor — tighten low
                low.set(v, Math.min(low.get(v), disc.get(u)));
              }
            }

            if (!pushed) {
              // v is fully explored — propagate to parent
              stack.pop();
              if (par !== null) {
                low.set(par, Math.min(low.get(par), low.get(v)));
                const sn = namedBelow.get(v);
                if (sn) namedBelow.set(par, true);
                // v's subtree has no back-edge past par → par is an articulation point.
                // If that subtree contains a named node, par is unsafe to remove.
                if (low.get(v) >= disc.get(par) && nm[par]?.junction && sn) {
                  unsafe.add(par);
                }
              }
            }
          }

          // Root with 2+ DFS-tree children is always an articulation point
          if (nm[root]?.junction && rootDfsChildren > 1) unsafe.add(root);

          logTrace('wither-tarjan', `unsafe=${unsafe.size}  visited=${disc.size}  nodes=${Object.keys(nm).length}`);
          return unsafe;
        };

        // Delete one junction: unwire neighbors then remove from source + nm + coords
        const deleteJunctionW=(code)=>{
          const neighbors=DIRS4.map(d=>nm[code]?.[d]).filter(Boolean);
          logTrace('wither-delete',`${code} neighbors=[${neighbors.join(',')}]`);
          for(const d of DIRS4){const nb=nm[code]?.[d];if(nb&&nm[nb])clearDir(nb,OPP4[d]);}
          const srcRemoved=WBAPI.deleteNodeSource(code);
          if(!srcRemoved) logTrace('wither-delete',`WARNING: ${code} not found in NODE_MAP source — may already be absent`);
          delete nm[code];delete WBAPI.nodeCoords[code];
          logTrace('wither-delete',`${code} removed from nm+coords${srcRemoved?'+source':'(source miss)'}`);
        };

        // Dry-run: report unused count without modifying anything
        const usage0=await runSnail(); lastSnailUsage=usage0;
        const unusedCount0=[...usage0.values()].filter(cnt=>cnt===0).length;
        phaseBanner('P7: wither', `junctions tracked=${usage0.size}  unused=${unusedCount0}  execute=${execute&&witherPhase}`);
        const doneP7 = phaseTime('p7');
        emit(`  [p7 start] ${nodeStats()}  ${heapMB()}`);

        if(execute&&witherPhase){
          let totalWithered=0;const witherLog=[];
          for(let wp=1;wp<=20;wp++){
            nm=WBAPI.nodeMap;
            const usage=await runSnail(); lastSnailUsage=usage;
            const witherCandidates=[...usage.entries()].filter(([c,cnt])=>nm[c]&&cnt===0);
            // Tarjan once per pass — O(V+E) — replaces O(K*(V+E)) per-candidate BFS
            const unsafeJunctions = findUnsafeJunctions();
            sectionBanner(`P7 PASS ${wp}/20: wither — ${witherCandidates.length} candidates  unsafe(bridges)=${unsafeJunctions.size}  safe=${witherCandidates.length-[...witherCandidates].filter(([c])=>unsafeJunctions.has(c)).length}  totalWithered so far: ${totalWithered}`);
            const p7Tick=1;
            let passWithered=0,p7checked=0;
            for(const[code,cnt]of usage){
              if(!nm[code])continue;     // already removed this pass
              if(cnt>0)continue;         // on a quest desire path — keep it
              p7checked++;
              if(p7checked===1||p7checked===witherCandidates.length||p7checked%p7Tick===0){
                nestedProgressLine('p7 pass', wp, 20, 'candidate', p7checked, witherCandidates.length,
                  `withered=${passWithered} totalWithered=${totalWithered} bridges=${unsafeJunctions.size} heat=0`);
                if(p7checked%200===0)await yieldOnce();
              }
              if(unsafeJunctions.has(code)){
                // Unwitherable bridge — tab-aligned NESW columns + coords + heat
                const coord=WBAPI.nodeCoords[code];
                const COL=20;
                const nbCols=DIRS4.map(d=>{
                  const n=nm[code]?.[d];
                  const nc=n?WBAPI.nodeCoords[n]:null;
                  const cell=n?`${d}:${n}\t(${nc?.r??'?'},${nc?.c??'?'})`.padEnd(COL):`${d}:──────`.padEnd(COL);
                  return cell;
                }).join('\t');
                emit(`    bridge\t${code}\t(${coord?.r??'?'},${coord?.c??'?'})\theat=${cnt}\t${nbCols}\t[${totalWithered+passWithered}/${witherCandidates.length} withered  ${unsafeJunctions.size} bridges]`);
                continue;
              }
              const wCoord=WBAPI.nodeCoords[code]; // capture before deletion
              deleteJunctionW(code);
              passWithered++;totalWithered++;witherLog.push(code);
              emit(`    withered\t${code}\t(${wCoord?.r??'?'},${wCoord?.c??'?'})\theat=${cnt}\t[${totalWithered}/${witherCandidates.length}]`);
            }
            emit(`  └── [p7 pass ${wp} wither summary] checked=${p7checked} withered=${passWithered} totalWithered=${totalWithered}`);
            if(passWithered>0){
              rewriteCoords();WBAPI._buildIndexes();batchSave(`p7-wither-${wp}`);nm=WBAPI.nodeMap;
              emit(`[p7 pass ${wp}] withered ${passWithered}`);
            }else{
              emit(`[p7 pass ${wp}] stable — no unused non-bridge junctions remain`);
              break;
            }
          }
          emit(`[p7] done: ${totalWithered} junctions withered`);
          if(witherLog.length)emit(`  removed: ${witherLog.slice(0,60).join(', ')}${witherLog.length>60?` ...+${witherLog.length-60} more`:''}`);
          emit(`  [p7 end] ${nodeStats()}  ${heapMB()}`); doneP7();
        }else if(!witherPhase){
          emit(`[p7] skipped (--no-wither)`); doneP7();
        }else{
          emit(`[p7] dry-run: ${unusedCount0} unused junctions (run --execute to wither)`); doneP7();
        }
      }

      // ══════════════════════════════════════════════════════════════════════
      // PHASE 8 — final check
      // ══════════════════════════════════════════════════════════════════════
      // ── map rendering helpers (used for post-reweave output) ─────────────────
      // renderNodeGrid: game-coordinate (r,c) ASCII map. W×H = terminal chars.
      // bounds: optional {minR,maxR,minC,maxC} for zoom. heatMap: usage Map from snail.
      // opts.junctionMode=true → show junctions as 'j' (pri=2) instead of suppressing/heat.
      const renderNodeGrid = (W, H, title, bounds=null, heatMap=null, opts={}) => {
        const coordEntries = Object.entries(WBAPI.nodeCoords);
        if (!coordEntries.length) return [`(no coordinates for ${title})`];
        let minR,maxR,minC,maxC;
        if (bounds) { ({minR,maxR,minC,maxC}=bounds); }
        else {
          minR=Math.min(...coordEntries.map(([,p])=>p.r));
          maxR=Math.max(...coordEntries.map(([,p])=>p.r));
          minC=Math.min(...coordEntries.map(([,p])=>p.c));
          maxC=Math.max(...coordEntries.map(([,p])=>p.c));
        }
        const spanR=maxR-minR||1, spanC=maxC-minC||1;
        const toRow=r=>Math.min(H-1,Math.max(0,Math.round((r-minR)/spanR*(H-1))));
        const toCol=c=>Math.min(W-1,Math.max(0,Math.round((c-minC)/spanC*(W-1))));
        const grid=Array.from({length:H},()=>Array(W).fill(' '));
        const cellPri=new Map();
        for (const [code,coord] of coordEntries) {
          if(coord.r<minR||coord.r>maxR||coord.c<minC||coord.c>maxC) continue;
          const node=nm[code]; if(!node) continue;
          const tr=toRow(coord.r), tc=toCol(coord.c);
          const isJ=!!node.junction;
          const terrain=node.name||'';
          let pri=isJ?1:3;
          if(terrain==='city'||terrain==='capital') pri=5;
          else if(terrain==='airport') pri=4;
          let display;
          if(isJ){
            if(opts.hideJunctions){ display='·'; /* pri stays 1, named nodes always win */ }
            else if(heatMap){
              const h=heatMap.get(code)||0;
              if(h>100){display='●';pri=3;}
              else if(h>20){display='◉';pri=3;}
              else if(h>5){display='○';pri=2;}
              else if(h>0){display='∘';pri=2;}
              else{display='j';pri=2;}  // cold junction: still show j
            } else{display='j';pri=2;}  // default: show j
          } else { display=code.slice(0,3); }
          const key=`${tr},${tc}`;
          const ex=cellPri.get(key);
          if(!ex||pri>ex.pri) cellPri.set(key,{pri,display});
        }
        for(const[key,{display}]of cellPri){
          const[tr,tc]=key.split(',').map(Number);
          for(let i=0;i<display.length&&tc+i<W;i++) grid[tr][tc+i]=display[i];
        }
        const lines=[];
        const bar='═'.repeat(Math.max(0,W-title.length-7));
        lines.push(`  ╔══ ${title} ══${bar}╗`);
        // col header
        const chdr=Array(W+6).fill(' ');
        for(let tc=0;tc<W;tc+=Math.max(1,Math.floor(W/16))){
          const gameC=Math.round(minC+tc*spanC/(W-1));
          const lbl=String(gameC);
          for(let i=0;i<lbl.length&&6+tc+i<chdr.length;i++) chdr[6+tc+i]=lbl[i];
        }
        lines.push('  c:'+chdr.join(''));
        lines.push('  r: ╔'+'─'.repeat(W)+'╗');
        for(let r=0;r<H;r++){
          const gameR=Math.round(minR+r*spanR/(H-1));
          const tag=String(gameR).padStart(4);
          lines.push(`${tag} ║${grid[r].join('')}║`);
        }
        lines.push('     ╚'+'─'.repeat(W)+'╝');
        lines.push(`     scale: ${spanR} game-rows × ${spanC} game-cols → ${H}×${W} chars  (${(spanR/H).toFixed(1)} rows/char  ${(spanC/W).toFixed(1)} cols/char)`);
        return lines;
      };

      // renderGeoMap: geographic ASCII map using GEO2 lat/lon cities
      const renderGeoMap = (W, H) => {
        const MLAT=68, mLAT=-8, MLON=72, mLON=-25;
        const proj=(lat,lon)=>({r:Math.round((MLAT-lat)/(MLAT-mLAT)*(H-1)),c:Math.round((lon-mLON)/(MLON-mLON)*(W-1))});
        const grid=Array.from({length:H},()=>Array(W).fill(' '));
        for(let lat=mLAT;lat<=MLAT;lat+=15){const{r}=proj(lat,0);if(r>=0&&r<H)for(let c=0;c<W;c++)if(grid[r][c]===' ')grid[r][c]='·';}
        for(let lon=mLON;lon<=MLON;lon+=15){const{c}=proj(0,lon);if(c>=0&&c<W)for(let r=0;r<H;r++)if(grid[r][c]===' ')grid[r][c]='·';}
        for(const[code,geo]of Object.entries(GEO2)){
          const{r,c}=proj(geo.lat,geo.lon);
          if(r<0||r>=H||c<0||c>=W) continue;
          const ch=code.slice(0,3);
          for(let i=0;i<ch.length&&c+i<W;i++) grid[r][c+i]=ch[i];
        }
        const lines=[];
        const lonHdr=Array(W+6).fill(' ');
        lonHdr[0]='N'; lonHdr[1]='\\'; lonHdr[2]='W'; lonHdr[3]=' '; lonHdr[4]=' '; lonHdr[5]=' ';
        for(let lon=mLON;lon<=MLON;lon+=15){const{c}=proj(0,lon);const t=(lon<0?`${-lon}W`:`${lon}E`).padStart(4);for(let i=0;i<t.length&&6+c+i<lonHdr.length;i++)lonHdr[6+c+i]=t[i];}
        lines.push(lonHdr.join(''));
        lines.push('     ╔'+'═'.repeat(W)+'╗');
        for(let r=0;r<H;r++){
          const lat=MLAT-r*(MLAT-mLAT)/(H-1);
          const tag=(lat>=0?`${Math.round(lat)}N`:`${Math.abs(Math.round(lat))}S`).padStart(4);
          const showLat=Math.round(lat)%15===0;
          lines.push(`${tag} ║${grid[r].join('')}║${showLat?' '+tag.trim():''}`);
        }
        lines.push('     ╚'+'═'.repeat(W)+'╝');
        const lonFtr=Array(W+6).fill(' ');
        lonFtr[0]='S'; lonFtr[1]='/'; lonFtr[2]='E';
        for(let lon=mLON;lon<=MLON;lon+=15){const{c}=proj(0,lon);const t=(lon<0?`${-lon}W`:`${lon}E`).padStart(4);for(let i=0;i<t.length&&6+c+i<lonFtr.length;i++)lonFtr[6+c+i]=t[i];}
        lines.push(lonFtr.join(''));
        return lines;
      };

      emit('[p8] final check');
      emit(`  [p8] ${nodeStats()}  ${heapMB()}`);
      const finalReach=bfsReach(getHub());
      const finalTotal=Object.keys(nm).length;
      const finalPct=Math.round(finalReach.size/finalTotal*1000)/10;
      // Broken edge scan with category breakdown
      let finalBroken=0;
      const fBreakCats={missing_coords:0,diagonal:0,gap_too_large:0,diagonal_and_gap:0};
      const fSeen=new Set(),fCoords=WBAPI.nodeCoords;
      for(const[code,dirs]of Object.entries(nm)){
        const cc=fCoords[code];
        for(const d of DIRS4){
          const tgt=dirs[d];if(!tgt)continue;
          const key=[code,tgt].sort().join(':');if(fSeen.has(key))continue;fSeen.add(key);
          const tc=fCoords[tgt];
          if(!cc||!tc){fBreakCats.missing_coords++;finalBroken++;continue;}
          const dr=tc.r-cc.r,dc=tc.c-cc.c;
          const gap=d in{N:1,S:1}?Math.abs(dr):Math.abs(dc);
          const off=d in{N:1,S:1}?Math.abs(dc):Math.abs(dr);
          if(off>0&&gap>4){fBreakCats.diagonal_and_gap++;finalBroken++;}
          else if(off>0){fBreakCats.diagonal++;finalBroken++;}
          else if(gap>4){fBreakCats.gap_too_large++;finalBroken++;}
        }
      }
      // Unreachable node detail
      const p8Unreachable=Object.keys(nm).filter(c=>!finalReach.has(c));
      const p8UnreachNamed=p8Unreachable.filter(c=>!nm[c]?.junction);
      const p8UnreachJct=p8Unreachable.filter(c=>!!nm[c]?.junction);
      emit(`[p8] reachable=${finalReach.size}/${finalTotal}(${finalPct}%)  broken=${finalBroken}  unreachable=${p8Unreachable.length}`);
      emit(`[p8] broken by type: missing_coords=${fBreakCats.missing_coords}  diagonal=${fBreakCats.diagonal}  gap_too_large=${fBreakCats.gap_too_large}  diag_and_gap=${fBreakCats.diagonal_and_gap}`);
      if(p8UnreachNamed.length) emit(`[p8] unreachable named (${p8UnreachNamed.length}): ${p8UnreachNamed.map(c=>`${c}(${nm[c]?.label||nm[c]?.name||'?'})`).join('  ')}`);
      if(p8UnreachJct.length)   emit(`[p8] unreachable junctions: ${p8UnreachJct.length}`);
      emit(finalPct>=100&&finalBroken===0?'[p8] MAP IS STABLE ✓':finalPct>=100?`[p8] reachability 100% ✓ — ${finalBroken} cosmetic broken edges remain`:`[p8] WARNING: ${p8Unreachable.length} nodes unreachable — run reweave again`);

      // ══════════════════════════════════════════════════════════════════════
      // PF — broken-edge auto-repair (post-wither, post-P8 report)
      // A: infer coords for coordless junctions (multi-pass until stable)
      // B: fix gap_too_large by inserting corridor junctions
      // C: fix diagonal / diagonal_and_gap by inserting elbow junctions
      // ══════════════════════════════════════════════════════════════════════
      if (execute && finalBroken > 0) {
        const donePF = phaseTime('pf');
        emit('\n[pf] broken-edge auto-repair');
        nm = WBAPI.nodeMap;
        let pfCoordAssigned = 0, pfGapFixed = 0, pfDiagFixed = 0, pfAnySaved = false;

        // ── PF-A: coord inference ──────────────────────────────────────────
        // Multi-pass: each pass may reveal new coordless nodes whose neighbors
        // just got coords in a previous pass (cascade along junction chains).
        emit('[pf-a] coord inference — assigning coords to coordless junctions');
        for (let pfPass = 1; pfPass <= 20; pfPass++) {
          await yieldOnce();
          const coords = WBAPI.nodeCoords;
          const occ = new Map(Object.entries(coords).map(([c,p])=>[`${p.r},${p.c}`,c]));
          // Collect implied positions: for each node X with coords that points to J without coords
          const implied = new Map(); // code → [{r,c,from,dir}]
          for (const [code, dirs] of Object.entries(nm)) {
            const cc = coords[code]; if (!cc) continue;
            for (const d of DIRS4) {
              const tgt = dirs[d]; if (!tgt || coords[tgt]) continue;
              const nr = cc.r + DR4[d] * step, nc = cc.c + DC4[d] * step;
              if (!implied.has(tgt)) implied.set(tgt, []);
              implied.get(tgt).push({r:nr, c:nc, from:code, dir:d});
            }
          }
          if (!implied.size) { emit(`[pf-a] pass ${pfPass}: no more coordless junctions — stable`); break; }
          let passAssigned = 0;
          for (const [code, cands] of implied) {
            if (coords[code]) continue;
            // Average all implied positions and find nearest free cell
            const avgR = Math.round(cands.reduce((s,p)=>s+p.r,0)/cands.length);
            const avgC = Math.round(cands.reduce((s,p)=>s+p.c,0)/cands.length);
            let placed = false;
            outer: for (let d = 0; d <= 12 && !placed; d++) {
              for (const [dr,dc] of [[0,0],[0,d],[0,-d],[d,0],[-d,0],[d,d],[-d,-d],[d,-d],[-d,d]]) {
                const r=avgR+dr, c=avgC+dc;
                if (r<1||c<1) continue;
                const key=`${r},${c}`;
                if (!occ.has(key)) {
                  coords[code]={r,c}; occ.set(key,code);
                  passAssigned++; pfCoordAssigned++;
                  emit(`  [pf-a] ${code}@(${r},${c}) from ${cands.map(x=>`${x.from}.${x.dir}`).join('+')}`);
                  placed = true; break outer;
                }
              }
            }
            if (!placed) emit(`  [pf-a] SKIP ${code} — no free cell near (${avgR},${avgC})`);
          }
          emit(`[pf-a] pass ${pfPass}: assigned=${passAssigned}  total=${pfCoordAssigned}`);
          if (passAssigned === 0) break;
        }
        if (pfCoordAssigned > 0) { rewriteCoords(); WBAPI._buildIndexes(); pfAnySaved = true; }

        // ── PF-B + PF-C: fix gap_too_large and diagonal ─────────────────────
        // Re-scan now that missing_coords are repaired; address remaining edge types.
        if (execute) {
          nm = WBAPI.nodeMap;
          const pfEdges = scanBrokenEdges().filter(e => e.type !== 'missing_coords');
          const pfByType = {}; for(const e of pfEdges) pfByType[e.type]=(pfByType[e.type]||0)+1;
          emit(`[pf-bc] post-coord-inference scan: ${pfEdges.length} fixable edges  ${Object.entries(pfByType).map(([t,n])=>`${t}=${n}`).join('  ')}`);
          const pfOcc = new Map(Object.entries(WBAPI.nodeCoords).map(([c,p])=>[`${p.r},${p.c}`,c]));

          for (const edge of pfEdges) {
            await yieldOnce();
            const {from, dir, to, type} = edge;
            const fc = WBAPI.nodeCoords[from], tc = WBAPI.nodeCoords[to];
            if (!fc || !tc) continue;

            if (type === 'gap_too_large') {
              // Insert one junction midway, then wire chain
              const midR = Math.round((fc.r + tc.r) / 2);
              const midC = Math.round((fc.c + tc.c) / 2);
              let placed = false;
              for (let d = 0; d <= 8 && !placed; d++) {
                for (const [dr,dc] of [[0,0],[0,d],[0,-d],[d,0],[-d,0]]) {
                  const r=midR+dr, c=midC+dc;
                  const key=`${r},${c}`;
                  if (!pfOcc.has(key)) {
                    const jc = nextJCode();
                    const jBody = {name:'junction',label:`Gap fill ${from}↔${to}`,text:'Gap-repair junction.',
                      act:nm[from]?.act||1,junction:true,npc:null,battle:null,loot:null,sleep:false};
                    const entry = serializeNodeLiteral(jc, jBody);
                    if (!insertBeforeSectionClose('NODE_MAP', entry).ok) break;
                    nm[jc] = {...jBody, num: nextNodeNum()};
                    WBAPI.nodeCoords[jc] = {r, c};
                    pfOcc.set(key, jc);
                    // Wire: from → J → to; clear old direct back-edge on 'to'
                    WBAPI.editField('node', from, dir, jc);
                    WBAPI.editField('node', jc, OPP4[dir], from);
                    WBAPI.editField('node', jc, dir, to);
                    WBAPI.editField('node', to, OPP4[dir], jc);
                    // If 'to' still had a stale back-reference to 'from', it's now overwritten above.
                    emit(`  [pf-b] gap ${from}.${dir}→${to} (gap=${dir in{N:1,S:1}?Math.abs(tc.r-fc.r):Math.abs(tc.c-fc.c)}) → mid junction ${jc}@(${r},${c})`);
                    pfGapFixed++; pfAnySaved = true; placed = true; break;
                  }
                }
              }
              if (!placed) emit(`  [pf-b] SKIP gap ${from}.${dir}→${to} — no free midpoint cell near (${midR},${midC})`);

            } else if (type === 'diagonal' || type === 'diagonal_and_gap') {
              // Insert elbow junction at the corner (same row as from, same col as to OR vice versa)
              const elbowR = fc.r, elbowC = tc.c; // prefer: row of 'from', col of 'to'
              const alt = {r: tc.r, c: fc.c};      // alt: row of 'to', col of 'from'
              let elbCoord = null;
              for (const cand of [{r:elbowR,c:elbowC}, alt]) {
                if (!pfOcc.has(`${cand.r},${cand.c}`)) { elbCoord = cand; break; }
              }
              // Search nearby if both corners occupied
              if (!elbCoord) {
                outer2: for (let d = 1; d <= 8; d++) {
                  for (const cand of [{r:elbowR,c:elbowC}, alt]) {
                    for (const [dr,dc] of [[0,d],[0,-d],[d,0],[-d,0]]) {
                      const r=cand.r+dr, c=cand.c+dc;
                      if (!pfOcc.has(`${r},${c}`)) { elbCoord={r,c}; break outer2; }
                    }
                  }
                }
              }
              if (!elbCoord) { emit(`  [pf-c] SKIP diag ${from}.${dir}→${to} — no elbow cell found`); continue; }
              const jc = nextJCode();
              const jBody = {name:'junction',label:`Elbow ${from}→${to}`,text:'Diagonal-repair elbow.',
                act:nm[from]?.act||1,junction:true,npc:null,battle:null,loot:null,sleep:false};
              const entry = serializeNodeLiteral(jc, jBody);
              if (!insertBeforeSectionClose('NODE_MAP', entry).ok) continue;
              nm[jc] = {...jBody, num: nextNodeNum()};
              WBAPI.nodeCoords[jc] = elbCoord;
              pfOcc.set(`${elbCoord.r},${elbCoord.c}`, jc);
              // Leg 1: from → elbow (cardinal in dir)
              const leg1dir = dir; // N/S/E/W from→elbow
              // Leg 2: elbow → to (perpendicular)
              const leg2dir = (dir==='N'||dir==='S') ? (tc.c>elbCoord.c?'E':'W') : (tc.r>elbCoord.r?'S':'N');
              WBAPI.editField('node', from, leg1dir, jc);         // from → elbow
              WBAPI.editField('node', jc, OPP4[leg1dir], from);  // elbow ← from
              WBAPI.editField('node', jc, leg2dir, to);            // elbow → to
              WBAPI.editField('node', to, OPP4[leg2dir], jc);     // to ← elbow
              // Clear stale back-reference on 'to' if it still pointed directly at 'from'
              if (nm[to]?.[OPP4[dir]] === from) WBAPI.editField('node', to, OPP4[dir], null);
              emit(`  [pf-c] diag ${from}.${dir}→${to} → elbow ${jc}@(${elbCoord.r},${elbCoord.c}) legs=${leg1dir}+${leg2dir}`);
              pfDiagFixed++; pfAnySaved = true;
            }
          }
        }

        if (pfAnySaved) {
          rewriteCoords(); WBAPI._buildIndexes();
          batchSave('pf-edge-repair'); nm = WBAPI.nodeMap;
          // Re-check after repair
          const pfScan2 = scanBrokenEdges();
          const pfCats2 = {}; for(const e of pfScan2) pfCats2[e.type]=(pfCats2[e.type]||0)+1;
          emit(`[pf] after repair: ${pfScan2.length} broken  ${Object.entries(pfCats2).map(([t,n])=>`${t}=${n}`).join('  ')}`);
        }
        emit(`[pf] done: coords-assigned=${pfCoordAssigned}  gap-fixed=${pfGapFixed}  diag-fixed=${pfDiagFixed}`);
        donePF();
      }

      // ══════════════════════════════════════════════════════════════════════
      // P_XJCT — cross-junction fill
      // After wither/snail, scan every axis-aligned edge that jumps over ≥1
      // empty cell.  For each jumped-over cell, check the two perpendicular
      // directions for existing nodes within XJCT_RADIUS cells (clear line of
      // sight required).  Spawn a junction ONLY when at least one such
      // perpendicular neighbour exists — guaranteeing degree ≥ 3 so the new
      // node is not a bare pass-through that wither would remove next run.
      // ══════════════════════════════════════════════════════════════════════
      {
        phaseBanner('P_XJCT: cross-junction fill', `execute=${execute}`);
        const doneXJCT = phaseTime('p_xjct');
        emit(`  [p_xjct start] ${nodeStats()}  ${heapMB()}`);
        nm = WBAPI.nodeMap;

        const XJCT_RADIUS = 3;
        // Build occupancy map: "r,c" → code
        const xjOcc = new Map(
          Object.entries(WBAPI.nodeCoords).map(([c,p]) => [`${p.r},${p.c}`, c])
        );

        // Collect spawn plans: scan every undirected edge once
        const xjPairs = new Set();
        const xjSpawnList = []; // [{pathFrom, pathTo, fwdDir, cells:[{r,c,perpNeighbors}]}]

        for (const [codeA, nodeA] of Object.entries(nm)) {
          for (const fwdDir of DIRS4) {
            const codeB = nodeA[fwdDir];
            if (!codeB || !nm[codeB]) continue;
            const pairKey = [codeA, codeB].sort().join(':');
            if (xjPairs.has(pairKey)) continue;
            xjPairs.add(pairKey);

            const ca = WBAPI.nodeCoords[codeA], cb = WBAPI.nodeCoords[codeB];
            if (!ca || !cb) continue;
            const dr = cb.r - ca.r, dc = cb.c - ca.c;
            if (dr !== 0 && dc !== 0) continue; // diagonal edge — skip
            const isNS = dr !== 0;
            // Skip mislabeled edges: direction label must match geometry
            if ((fwdDir === 'N' || fwdDir === 'S') && !isNS) continue;
            if ((fwdDir === 'E' || fwdDir === 'W') &&  isNS) continue;
            const gap = isNS ? Math.abs(dr) : Math.abs(dc);
            if (gap <= 1) continue; // adjacent cell, nothing to fill

            const stepR = isNS ? Math.sign(dr) : 0;
            const stepC = isNS ? 0 : Math.sign(dc);
            const perpDirs = isNS ? ['E','W'] : ['N','S'];

            const cells = [];
            for (let k = 1; k < gap; k++) {
              const r = ca.r + stepR * k;
              const c = ca.c + stepC * k;
              if (xjOcc.has(`${r},${c}`)) continue; // cell occupied

              // Find perpendicular neighbours with clear line of sight
              const perpNeighbors = [];
              for (const pd of perpDirs) {
                for (let dist = 1; dist <= XJCT_RADIUS; dist++) {
                  const pr = r + DR4[pd] * dist;
                  const pc = c + DC4[pd] * dist;
                  // Clear line-of-sight: intermediate cells must be empty
                  let blocked = false;
                  for (let d2 = 1; d2 < dist; d2++) {
                    if (xjOcc.has(`${r + DR4[pd]*d2},${c + DC4[pd]*d2}`)) {
                      blocked = true; break;
                    }
                  }
                  if (blocked) break; // farther cells also occluded — stop
                  const pCode = xjOcc.get(`${pr},${pc}`);
                  if (pCode && nm[pCode]) {
                    // Neighbour must have its inward slot free
                    if (!nm[pCode][OPP4[pd]]) {
                      perpNeighbors.push({ code: pCode, dir: pd, dist });
                    }
                    break; // nearest node in this direction found; stop
                  }
                }
              }

              if (perpNeighbors.length > 0) {
                cells.push({ r, c, perpNeighbors });
              }
            }

            if (cells.length > 0) {
              xjSpawnList.push({ pathFrom: codeA, pathTo: codeB, fwdDir, cells });
            }
          }
        }

        const xjTotal = xjSpawnList.reduce((s,e) => s + e.cells.length, 0);
        emit(`  [p_xjct] paths with fillable cells: ${xjSpawnList.length}  total cross-junctions: ${xjTotal}`);

        if (!execute) {
          for (const { pathFrom, pathTo, fwdDir, cells } of xjSpawnList.slice(0, 20)) {
            const ca2 = WBAPI.nodeCoords[pathFrom], cb2 = WBAPI.nodeCoords[pathTo];
            const gap2 = fwdDir==='N'||fwdDir==='S' ? Math.abs(cb2.r-ca2.r) : Math.abs(cb2.c-ca2.c);
            emit(`  [dry] ${pathFrom}.${fwdDir}→${pathTo}  gap=${gap2}  ${cells.length} junction(s)`);
            for (const { r, c, perpNeighbors } of cells) {
              emit(`    cell(${r},${c}) perp: ${perpNeighbors.map(n=>`${n.dir}:${n.code}@d${n.dist}`).join(' ')}`);
            }
          }
          if (xjSpawnList.length > 20) emit(`  ... and ${xjSpawnList.length - 20} more paths`);
          emit('[p_xjct] dry-run — add --execute to create junctions');
        } else {
          let xjCreated = 0;
          for (const { pathFrom, pathTo, fwdDir, cells } of xjSpawnList) {
            const bwdDir = OPP4[fwdDir];
            let prevCode = pathFrom;

            for (const { r, c, perpNeighbors } of cells) {
              if (xjOcc.has(`${r},${c}`)) continue; // another path already claimed this cell

              const jCode = nextJCode();
              const jBody = {
                name: 'junction',
                label: `X-jct`,
                text: 'Cross-path junction.',
                act: nm[pathFrom]?.act || 1,
                junction: true,
                npc: null, battle: null, loot: null, sleep: false,
              };
              const entry = serializeNodeLiteral(jCode, jBody);
              if (!insertBeforeSectionClose('NODE_MAP', entry).ok) {
                emit(`  [p_xjct] WARN: insert failed for ${jCode}@(${r},${c})`);
                continue;
              }
              nm[jCode] = { ...jBody, num: nextNodeNum() };
              WBAPI.nodeCoords[jCode] = { r, c };
              xjOcc.set(`${r},${c}`, jCode);

              // Wire path: prevCode →fwdDir→ jCode ←bwdDir← prevCode
              WBAPI.editField('node', prevCode, fwdDir, jCode);
              WBAPI.editField('node', jCode, bwdDir, prevCode);

              // Wire perpendicular neighbours (one per perp direction, max 2)
              const wiredPerp = [];
              for (const { code: pCode, dir: pd } of perpNeighbors.slice(0, 2)) {
                if (!nm[pCode]?.[OPP4[pd]] && !nm[jCode]?.[pd]) {
                  WBAPI.editField('node', jCode, pd, pCode);
                  WBAPI.editField('node', pCode, OPP4[pd], jCode);
                  wiredPerp.push(`${pd}:${pCode}`);
                }
              }

              emit(`  [p_xjct] ${jCode}@(${r},${c}) on ${prevCode}.${fwdDir}→${pathTo}  perp=[${wiredPerp.join(' ')}]`);
              prevCode = jCode;
              xjCreated++;
            }

            // Close the chain: last inserted junction → pathTo
            if (prevCode !== pathFrom) {
              WBAPI.editField('node', prevCode, fwdDir, pathTo);
              WBAPI.editField('node', pathTo, bwdDir, prevCode);
            }
          }

          emit(`  [p_xjct] created ${xjCreated} cross-junctions`);
          if (xjCreated > 0) {
            rewriteCoords();
            WBAPI._buildIndexes();
            batchSave('p_xjct');
            nm = WBAPI.nodeMap;
          }
        }

        emit(`  [p_xjct end] ${nodeStats()}  ${heapMB()}`);
        doneXJCT();
      }

      // ══════════════════════════════════════════════════════════════════════
      // FINAL PASSES: 2 more perpendicular-xjct sweeps + geometric crossover
      // Sequence: bidir → xjct2 → bidir → xjct3 → bidir → cross → bidir
      // ══════════════════════════════════════════════════════════════════════
      {
        const XJCT_R = 3; // perpendicular scan radius (cells)

        // ── inline bidir fix helper ───────────────────────────────────────────
        const runBidirFixPass = async (label) => {
          phaseBanner(`P_BIDIR:${label}`, `execute=${execute}`);
          const doneB = phaseTime(`bidir-${label}`);
          nm = WBAPI.nodeMap;
          const bTgts = Object.entries(nm).flatMap(([code, n]) =>
            DIRS4.filter(d => n[d] && nm[n[d]] && nm[n[d]][OPP4[d]] !== code)
                 .map(d => ({ code, dir:d, target:n[d] })));
          emit(`  [bidir:${label}] ${bTgts.length} one-way links`);
          if (execute && bTgts.length > 0) {
            let fixed = 0;
            for (const { code, dir, target } of bTgts) {
              if (!nm[target]) continue;
              if (nm[target][OPP4[dir]] === code) continue;
              if (WBAPI.editField('node', target, OPP4[dir], code).ok) fixed++;
              if (fixed % 300 === 0) await yieldOnce();
            }
            emit(`  [bidir:${label}] fixed=${fixed}`);
            if (fixed > 0) { batchSave(`bidir-${label}`); nm = WBAPI.nodeMap; }
          }
          doneB();
        };

        // ── perpendicular xjct pass helper ───────────────────────────────────
        const runXjctPass = async (label) => {
          phaseBanner(`P_XJCT:${label}`, `execute=${execute}`);
          const doneX = phaseTime(`xjct-${label}`);
          emit(`  [${label} start] ${nodeStats()}  ${heapMB()}`);
          nm = WBAPI.nodeMap;

          const occ = new Map(Object.entries(WBAPI.nodeCoords).map(([c,p]) => [`${p.r},${p.c}`, c]));
          const pairs = new Set();
          const spawnList = [];

          for (const [codeA, nodeA] of Object.entries(nm)) {
            for (const fwdDir of DIRS4) {
              const codeB = nodeA[fwdDir];
              if (!codeB || !nm[codeB]) continue;
              const pk = [codeA, codeB].sort().join(':');
              if (pairs.has(pk)) continue; pairs.add(pk);
              const ca = WBAPI.nodeCoords[codeA], cb = WBAPI.nodeCoords[codeB];
              if (!ca || !cb) continue;
              const dr = cb.r - ca.r, dc = cb.c - ca.c;
              if (dr !== 0 && dc !== 0) continue;
              const isNS = dr !== 0;
              if ((fwdDir === 'N' || fwdDir === 'S') && !isNS) continue;
              if ((fwdDir === 'E' || fwdDir === 'W') &&  isNS) continue;
              const gap = isNS ? Math.abs(dr) : Math.abs(dc);
              if (gap <= 1) continue;
              const stepR = isNS ? Math.sign(dr) : 0;
              const stepC = isNS ? 0 : Math.sign(dc);
              const perpDirs = isNS ? ['E','W'] : ['N','S'];
              const cells = [];
              for (let k = 1; k < gap; k++) {
                const r = ca.r + stepR * k, c = ca.c + stepC * k;
                if (occ.has(`${r},${c}`)) continue;
                const perpNeighbors = [];
                for (const pd of perpDirs) {
                  for (let dist = 1; dist <= XJCT_R; dist++) {
                    const pr = r + DR4[pd]*dist, pc = c + DC4[pd]*dist;
                    let blocked = false;
                    for (let d2 = 1; d2 < dist; d2++) {
                      if (occ.has(`${r+DR4[pd]*d2},${c+DC4[pd]*d2}`)) { blocked=true; break; }
                    }
                    if (blocked) break;
                    const pCode = occ.get(`${pr},${pc}`);
                    if (pCode && nm[pCode]) {
                      if (!nm[pCode][OPP4[pd]]) perpNeighbors.push({ code:pCode, dir:pd, dist });
                      break;
                    }
                  }
                }
                if (perpNeighbors.length > 0) cells.push({ r, c, perpNeighbors });
              }
              if (cells.length > 0) spawnList.push({ pathFrom:codeA, pathTo:codeB, fwdDir, cells });
            }
          }

          const total = spawnList.reduce((s, e) => s + e.cells.length, 0);
          emit(`  [${label}] paths=${spawnList.length}  junctions=${total}`);
          if (execute && total > 0) {
            let created = 0;
            for (const { pathFrom, pathTo, fwdDir, cells } of spawnList) {
              let prev = pathFrom;
              const bwdDir = OPP4[fwdDir];
              for (const { r, c, perpNeighbors } of cells) {
                if (occ.has(`${r},${c}`)) continue;
                const jCode = nextJCode();
                const jBody = { name:'junction', label:'X-jct', text:'Cross-path junction.',
                  act: nm[pathFrom]?.act||1, junction:true, npc:null, battle:null, loot:null, sleep:false };
                if (!insertBeforeSectionClose('NODE_MAP', serializeNodeLiteral(jCode, jBody)).ok) continue;
                nm[jCode] = { ...jBody, num:nextNodeNum() };
                WBAPI.nodeCoords[jCode] = { r, c };
                occ.set(`${r},${c}`, jCode);
                WBAPI.editField('node', prev, fwdDir, jCode);
                WBAPI.editField('node', jCode, bwdDir, prev);
                for (const { code:pCode, dir:pd } of perpNeighbors.slice(0, 2)) {
                  if (!nm[pCode]?.[OPP4[pd]] && !nm[jCode]?.[pd]) {
                    WBAPI.editField('node', jCode, pd, pCode);
                    WBAPI.editField('node', pCode, OPP4[pd], jCode);
                  }
                }
                prev = jCode; created++;
              }
              if (prev !== pathFrom) {
                WBAPI.editField('node', prev, fwdDir, pathTo);
                WBAPI.editField('node', pathTo, bwdDir, prev);
              }
            }
            emit(`  [${label}] created=${created}`);
            if (created > 0) { rewriteCoords(); WBAPI._buildIndexes(); batchSave(label); nm = WBAPI.nodeMap; }
          }
          emit(`  [${label} end] ${nodeStats()}  ${heapMB()}`);
          doneX();
        };

        // ── sequence ──────────────────────────────────────────────────────────
        await runBidirFixPass('post-xjct1');
        await runXjctPass('p_xjct2');
        await runBidirFixPass('post-xjct2');
        await runXjctPass('p_xjct3');
        await runBidirFixPass('post-xjct3');

        // ── P_CROSS — geometric crossover junction creation ───────────────────
        // Any NS edge and EW edge whose grid lines intersect at an empty cell
        // get a 4-way junction at that cell, wired into both chains.
        {
          phaseBanner('P_CROSS: geometric crossover junctions', `execute=${execute}`);
          const doneCross = phaseTime('p_cross');
          nm = WBAPI.nodeMap;
          const crossOcc = new Map(Object.entries(WBAPI.nodeCoords).map(([c,p]) => [`${p.r},${p.c}`, c]));

          // Collect all direct NS and EW hops (each undirected edge once)
          const nsHops = []; // {nodeTop,nodeBot,col,rTop,rBot}
          const ewHops = []; // {nodeLeft,nodeRight,row,cLeft,cRight}
          const seenPairsC = new Set();
          for (const [code, n] of Object.entries(nm)) {
            const ca = WBAPI.nodeCoords[code]; if (!ca) continue;
            for (const dir of DIRS4) {
              const tgt = n[dir]; if (!tgt || !nm[tgt]) continue;
              const pk = [code, tgt].sort().join(':');
              if (seenPairsC.has(pk)) continue; seenPairsC.add(pk);
              const cb = WBAPI.nodeCoords[tgt]; if (!cb) continue;
              if (dir === 'N' || dir === 'S') {
                if (ca.c !== cb.c) continue; // must be same column
                const rTop=Math.min(ca.r,cb.r), rBot=Math.max(ca.r,cb.r);
                if (rBot-rTop <= 1) continue;
                nsHops.push({ nodeTop:ca.r<cb.r?code:tgt, nodeBot:ca.r<cb.r?tgt:code, col:ca.c, rTop, rBot });
              } else { // E or W
                if (ca.r !== cb.r) continue; // must be same row
                const cLeft=Math.min(ca.c,cb.c), cRight=Math.max(ca.c,cb.c);
                if (cRight-cLeft <= 1) continue;
                ewHops.push({ nodeLeft:ca.c<cb.c?code:tgt, nodeRight:ca.c<cb.c?tgt:code, row:ca.r, cLeft, cRight });
              }
            }
          }
          emit(`  [p_cross] NS hops=${nsHops.length}  EW hops=${ewHops.length}`);

          // Index NS hops by column for fast lookup
          const nsByCol = new Map();
          for (const ns of nsHops) {
            if (!nsByCol.has(ns.col)) nsByCol.set(ns.col, []);
            nsByCol.get(ns.col).push(ns);
          }

          // Find crossings: for each EW hop, walk its column range looking for NS hops
          const crossingsByNS = new Map(); // nsHop → [{row, ewHop}] sorted later
          const crossingsByEW = new Map(); // ewHop → [{col}] sorted later
          const claimedCells  = new Set();

          for (const ew of ewHops) {
            for (let c = ew.cLeft+1; c < ew.cRight; c++) {
              const nsList = nsByCol.get(c); if (!nsList) continue;
              for (const ns of nsList) {
                if (ew.row <= ns.rTop || ew.row >= ns.rBot) continue; // not "between"
                const cellKey = `${ew.row},${c}`;
                if (crossOcc.has(cellKey) || claimedCells.has(cellKey)) continue;
                claimedCells.add(cellKey);
                if (!crossingsByNS.has(ns)) crossingsByNS.set(ns, []);
                crossingsByNS.get(ns).push({ row:ew.row, ew });
                if (!crossingsByEW.has(ew)) crossingsByEW.set(ew, []);
                crossingsByEW.get(ew).push({ col:c });
              }
            }
          }

          const totalCross = claimedCells.size;
          emit(`  [p_cross] crossings found=${totalCross}`);

          if (!execute) {
            for (const [ns, crossings2] of [...crossingsByNS.entries()].slice(0,8)) {
              emit(`  [dry] NS ${ns.nodeTop}→${ns.nodeBot} col=${ns.col}  rows=[${crossings2.map(x=>x.row).join(',')}]`);
            }
            if (crossingsByNS.size > 8) emit(`  ... +${crossingsByNS.size-8} more NS hops`);
            emit('[p_cross] dry-run');
          } else if (totalCross > 0) {
            const crossJunctions = new Map(); // cellKey → jCode

            // Pass 1: create junctions + wire N/S along each NS hop
            for (const [ns, crossings2] of crossingsByNS) {
              const sorted = crossings2.slice().sort((a,b) => a.row - b.row);
              let prev = ns.nodeTop;
              for (const { row } of sorted) {
                const cellKey = `${row},${ns.col}`;
                const jCode = nextJCode();
                const jBody = { name:'junction', label:'Crossover', text:'Geographic crossover junction.',
                  act: nm[ns.nodeTop]?.act||1, junction:true, npc:null, battle:null, loot:null, sleep:false };
                if (!insertBeforeSectionClose('NODE_MAP', serializeNodeLiteral(jCode, jBody)).ok) {
                  emit(`  [p_cross] WARN: insert failed ${jCode}`); continue;
                }
                nm[jCode] = { ...jBody, num:nextNodeNum() };
                WBAPI.nodeCoords[jCode] = { r:row, c:ns.col };
                crossOcc.set(cellKey, jCode);
                crossJunctions.set(cellKey, jCode);
                WBAPI.editField('node', prev, 'S', jCode);
                WBAPI.editField('node', jCode, 'N', prev);
                prev = jCode;
              }
              // Close the NS chain to the bottom node
              WBAPI.editField('node', prev, 'S', ns.nodeBot);
              WBAPI.editField('node', ns.nodeBot, 'N', prev);
            }

            // Pass 2: wire E/W through the crossing junctions along each EW hop
            for (const [ew, crossings2] of crossingsByEW) {
              const sorted = crossings2.slice().sort((a,b) => a.col - b.col);
              let prev = ew.nodeLeft;
              for (const { col } of sorted) {
                const jCode = crossJunctions.get(`${ew.row},${col}`);
                if (!jCode) continue;
                WBAPI.editField('node', prev, 'E', jCode);
                WBAPI.editField('node', jCode, 'W', prev);
                prev = jCode;
              }
              // Close the EW chain to the right node
              WBAPI.editField('node', prev, 'E', ew.nodeRight);
              WBAPI.editField('node', ew.nodeRight, 'W', prev);
            }

            const crossCreated = crossJunctions.size;
            emit(`  [p_cross] created=${crossCreated} crossover junctions`);
            if (crossCreated > 0) { rewriteCoords(); WBAPI._buildIndexes(); batchSave('p_cross'); nm = WBAPI.nodeMap; }
          }
          emit(`  [p_cross end] ${nodeStats()}  ${heapMB()}`);
          doneCross();
        }

        // Post-cross bidir + one more xjct sweep: P_CROSS creates new junctions
        // that open fresh perpendicular opportunities P_XJCT hasn't seen yet.
        await runBidirFixPass('post-cross');
        await runXjctPass('p_xjct4');
        await runBidirFixPass('post-xjct4');
        await runXjctPass('p_xjct5');
        await runBidirFixPass('post-xjct5');
        await runBidirFixPass('final');
      }

      // ══════════════════════════════════════════════════════════════════════
      // POST-REWEAVE MAPS  (wide terminal assumed — 220+ cols)
      // ══════════════════════════════════════════════════════════════════════
      {
        const MW=200, MH=55; // map dimensions (chars)
        const coordEntries=Object.entries(WBAPI.nodeCoords);
        const allR=coordEntries.map(([,p])=>p.r), allC=coordEntries.map(([,p])=>p.c);
        const gMinR=Math.min(...allR), gMaxR=Math.max(...allR);
        const gMinC=Math.min(...allC), gMaxC=Math.max(...allC);
        const gMidR=Math.round((gMinR+gMaxR)/2), gMidC=Math.round((gMinC+gMaxC)/2);

        const allMapLines=[];
        const section=(title)=>{
          const bar='█'.repeat(Math.max(0,MW+6-title.length-4));
          const line=`\n  ██ ${title} ${bar}`;
          emit(line); allMapLines.push(line);
        };
        const emitLines=(lines)=>{for(const l of lines){emit('  '+l);allMapLines.push('  '+l);}};

        const namedCount=Object.keys(nm).filter(c=>!nm[c]?.junction).length;
        const jCount=Object.keys(nm).filter(c=>!!nm[c]?.junction).length;
        const heatLegend=lastSnailUsage?'  ●=100+ ◉=21-100 ○=6-20 ∘=1-5 j=cold':'  (no heat — run --execute)';
        const HJ={hideJunctions:true};
        const northB={minR:gMinR,maxR:gMidR,minC:gMinC,maxC:gMaxC};
        const southB={minR:gMidR,maxR:gMaxR,minC:gMinC,maxC:gMaxC};

        // ── Map 1: Geographic world map (lat/lon) ────────────────────────────
        section(`MAP 1 / 9  ·  GEOGRAPHIC WORLD  (lat/lon projection, GEO2 cities)  ·  ${MW}×${MH}`);
        emitLines(renderGeoMap(MW, MH));

        // ── Map 2: Named + junctions (default) ───────────────────────────────
        section(`MAP 2 / 9  ·  NAMED + JUNCTIONS  (${namedCount} cities · ${jCount} junctions as j)  ·  ${MW}×${MH}`);
        emitLines(renderNodeGrid(MW, MH, 'named + junctions', null, null));

        // ── Map 3: Named nodes only (junctions hidden) ───────────────────────
        section(`MAP 3 / 9  ·  NAMED ONLY  (${namedCount} cities — junctions suppressed)  ·  ${MW}×${MH}`);
        emitLines(renderNodeGrid(MW, MH, 'named only', null, null, HJ));

        // ── Map 4: Heat + junctions (default, j=cold) ────────────────────────
        section(`MAP 4 / 9  ·  HEAT + JUNCTIONS${heatLegend}  ·  ${MW}×${MH}`);
        emitLines(renderNodeGrid(MW, MH, 'heat + junctions', null, lastSnailUsage));

        // ── Map 5: Heat overlay (junctions hidden) ────────────────────────────
        section(`MAP 5 / 9  ·  HEAT ONLY  (junctions suppressed)  ·  ${MW}×${MH}`);
        emitLines(renderNodeGrid(MW, MH, 'heat only', null, lastSnailUsage, HJ));

        // ── Map 6: Zoom North + junctions ────────────────────────────────────
        section(`MAP 6 / 9  ·  ZOOM NORTH + JUNCTIONS  (r=${gMinR}–${gMidR})  ·  ${MW}×${MH}`);
        emitLines(renderNodeGrid(MW, MH, 'north + junctions', northB, lastSnailUsage));

        // ── Map 7: Zoom North — named only ───────────────────────────────────
        section(`MAP 7 / 9  ·  ZOOM NORTH NAMED ONLY  (r=${gMinR}–${gMidR})  ·  ${MW}×${MH}`);
        emitLines(renderNodeGrid(MW, MH, 'north named only', northB, lastSnailUsage, HJ));

        // ── Map 8: Zoom South + junctions ────────────────────────────────────
        section(`MAP 8 / 9  ·  ZOOM SOUTH + JUNCTIONS  (r=${gMidR}–${gMaxR})  ·  ${MW}×${MH}`);
        emitLines(renderNodeGrid(MW, MH, 'south + junctions', southB, lastSnailUsage));

        // ── Map 9: Zoom South — named only ───────────────────────────────────
        section(`MAP 9 / 9  ·  ZOOM SOUTH NAMED ONLY  (r=${gMidR}–${gMaxR})  ·  ${MW}×${MH}`);
        emitLines(renderNodeGrid(MW, MH, 'south named only', southB, lastSnailUsage, HJ));

        // Save all maps to file
        try {
          const stamp=new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);
          const mapsFile=path.join(__dirname,'milepoints',`reweave-maps-${stamp}.txt`);
          fs.writeFileSync(mapsFile, allMapLines.join('\n')+'\n', 'utf8');
          emit(`\n  [maps] saved → ${path.basename(mapsFile)}`);
        } catch(e){ emit(`  [maps] WARN: could not write maps file: ${e.message}`); }
      }

      // ══════════════════════════════════════════════════════════════════════
      // FINAL — connect remaining isolated clusters (post-wither)
      // Runs after P7 wither so new corridors are not immediately removed.
      // On the next reweave the snail will traverse the named cities in each
      // cluster via quest paths, keeping the corridors alive through wither.
      // ══════════════════════════════════════════════════════════════════════
      {
        nm = WBAPI.nodeMap;
        const hubF = getHub();
        const reachF = bfsReach(hubF);
        const unreachF = Object.keys(nm).filter(c => !reachF.has(c));

        if (!unreachF.length) {
          const doneFB = phaseTime('final-bridge');
          emit('\n[final-bridge] all nodes reachable ✓'); doneFB();
        } else {
          // ── connected components of unreachable nodes ──────────────────────
          const unvisF = new Set(unreachF);
          const clustersF = [];
          for (const start of unreachF) {
            if (!unvisF.has(start)) continue;
            const comp = [];
            const bq = [start];
            while (bq.length) {
              const c = bq.shift();
              if (!unvisF.has(c)) continue;
              unvisF.delete(c); comp.push(c);
              for (const d of DIRS4) { const t = nm[c]?.[d]; if (t && nm[t] && unvisF.has(t)) bq.push(t); }
            }
            clustersF.push(comp);
          }
          emit(`\n[final-bridge] ${clustersF.length} isolated cluster${clustersF.length!==1?'s':''} — ${unreachF.length} unreachable nodes`);
          for (const [i, cl] of clustersF.entries()) {
            const named = cl.filter(c => !nm[c]?.junction);
            emit(`  cluster ${i+1}: ${cl.length} nodes  named=[${named.slice(0,6).join(' ')}${named.length>6?` +${named.length-6}`:''}]`);
          }

          if (execute) {
            let fbBridged = 0, fbFailed = 0;
            let reachArr = [...reachF];
            for (let ci = 0; ci < clustersF.length; ci++) {
              await yieldOnce();
              const cluster = clustersF[ci];
              // Nearest (reachable, cluster) pair by Manhattan distance on grid coords.
              let bestDist = Infinity, bestR = null, bestC = null;
              for (const clNode of cluster) {
                const cc = WBAPI.nodeCoords[clNode]; if (!cc) continue;
                for (const rNode of reachArr) {
                  const rc = WBAPI.nodeCoords[rNode]; if (!rc) continue;
                  const d = Math.abs(cc.r-rc.r) + Math.abs(cc.c-rc.c);
                  if (d < bestDist) { bestDist = d; bestR = rNode; bestC = clNode; }
                }
              }
              if (!bestR || !bestC) {
                const named = cluster.filter(c => !nm[c]?.junction);
                emit(`  [final-bridge cluster ${ci+1}] SKIP — no coords  named=[${named.join(' ')||'none'}]`);
                fbFailed++; continue;
              }
              emit(`  [final-bridge cluster ${ci+1}/${clustersF.length}] ${bestR}→${bestC}  dist=${bestDist}  size=${cluster.length}`);
              const res = buildHighway(bestR, bestC);
              if (res.ok && !res.skipped) {
                emit(`  [final-bridge] ✓ connected  junctions=${res.created.length}  shape=${res.shape}`);
                fbBridged++;
                const nr = bfsReach(hubF);
                for (const c of nr) reachF.add(c);
                reachArr = [...reachF];
              } else {
                emit(`  [final-bridge] ✗ ${res.error||'failed'}`);
                fbFailed++;
              }
            }
            const doneFB = phaseTime('final-bridge');
            if (fbBridged) {
              rewriteCoords(); WBAPI._buildIndexes();
              batchSave('final-bridge'); nm = WBAPI.nodeMap;
              const postR = bfsReach(getHub());
              emit(`[final-bridge] done: ${fbBridged} connected  ${fbFailed} failed  → reachable=${postR.size}/${Object.keys(nm).length}`);
            } else {
              emit(`[final-bridge] done: 0 connected  ${fbFailed} failed`);
            }
            doneFB();
          } else {
          const doneFB = phaseTime('final-bridge');
            emit(`[final-bridge] dry-run: ${clustersF.length} clusters identified — re-run with --execute to bridge`);
            doneFB();
          }
        }
      }

      // ── POST-BRIDGE bidir fix — final-bridge may have added new one-way links ──
      {
        phaseBanner('P_BIDIR:post-bridge', `execute=${execute}`);
        const donePostBridge = phaseTime('bidir-post-bridge');
        nm = WBAPI.nodeMap;
        const pbTgts = Object.entries(nm).flatMap(([code, n]) =>
          DIRS4.filter(d => n[d] && nm[n[d]] && nm[n[d]][OPP4[d]] !== code)
               .map(d => ({ code, dir:d, target:n[d] })));
        emit(`  [bidir:post-bridge] ${pbTgts.length} one-way links`);
        if (execute && pbTgts.length > 0) {
          let pbFixed = 0;
          for (const { code, dir, target } of pbTgts) {
            if (!nm[target]) continue;
            if (nm[target][OPP4[dir]] === code) continue;
            if (WBAPI.editField('node', target, OPP4[dir], code).ok) pbFixed++;
            if (pbFixed % 300 === 0) await yieldOnce();
          }
          emit(`  [bidir:post-bridge] fixed=${pbFixed}`);
          if (pbFixed > 0) { batchSave('bidir-post-bridge'); nm = WBAPI.nodeMap; }
        }
        donePostBridge();
      }

      // ── FINAL VALIDATE — comprehensive health check after all passes ────────
      {
        const doneVal = phaseTime('final-validate');
        phaseBanner('P_VALIDATE:final', `execute=${execute}`);
        nm = WBAPI.nodeMap;
        const valCoords = WBAPI.nodeCoords;

        // 1. Reachability
        const valHub   = getHub();
        const valReach = bfsReach(valHub);
        const valTotal = Object.keys(nm).length;
        const valPct   = Math.round(valReach.size / valTotal * 1000) / 10;
        const valUnreach = Object.keys(nm).filter(c => !valReach.has(c));
        const valUnreachNamed = valUnreach.filter(c => !nm[c]?.junction);
        emit(`  [validate] reachability: ${valReach.size}/${valTotal} (${valPct}%)  unreachable=${valUnreach.length} (named=${valUnreachNamed.length})`);
        if (valUnreachNamed.length)
          emit(`  [validate] unreachable named: ${valUnreachNamed.map(c => `${c}(${nm[c]?.label||nm[c]?.name||'?'})`).join('  ')}`);

        // 2. One-way links remaining
        const OPP_V = {N:'S',S:'N',E:'W',W:'E'};
        const oneWay = Object.entries(nm).flatMap(([code, n]) =>
          ['N','S','E','W'].filter(d => n[d] && nm[n[d]] && nm[n[d]][OPP_V[d]] !== code)
                           .map(d => `${code}.${d}→${n[d]}`));
        emit(`  [validate] one-way links: ${oneWay.length}${oneWay.length ? '  sample: ' + oneWay.slice(0,5).join('  ') : ' ✓'}`);

        // 3. Ghost coordinates (in NODE_COORDS but no NODE_MAP entry)
        const ghosts = Object.keys(valCoords).filter(c => !nm[c]);
        emit(`  [validate] ghost coords (no NODE_MAP entry): ${ghosts.length}${ghosts.length ? '  ' + ghosts.slice(0,8).join(' ') : ' ✓'}`);

        // 4. Nodes without coordinates
        const noCoord = Object.keys(nm).filter(c => !valCoords[c]);
        emit(`  [validate] nodes without coords: ${noCoord.length}${noCoord.length ? '  sample: ' + noCoord.slice(0,5).join(' ') : ' ✓'}`);

        // 5. Dead-end junctions (≤1 exit, no quest/npc/battle)
        const deadEnds = Object.entries(nm).filter(([c, n]) => {
          if (!n.junction) return false;
          const exits = ['N','S','E','W'].filter(d => n[d]).length;
          return exits <= 1 && !n.npc && !n.battle && !n.loot;
        });
        emit(`  [validate] dead-end junctions (≤1 exit, no content): ${deadEnds.length}`);

        const stable = valPct >= 100 && oneWay.length === 0 && ghosts.length === 0;
        emit(`  [validate] ${stable ? '✅ MAP FULLY VALIDATED' : '⚠️  issues remain — see above'}`);
        doneVal();
      }

      // ── COORD RESYNC — remove ghost entries, then rewrite NODE_COORDS ────────
      // Ghost = exists in NODE_COORDS but not in NODE_MAP (dangling after node deletes).
      {
        const doneResync = phaseTime('coord-resync');
        phaseBanner('P_RESYNC:coord-cleanup', `execute=${execute}`);
        nm = WBAPI.nodeMap;
        const coords = WBAPI.nodeCoords;
        const ghostKeys = Object.keys(coords).filter(c => !nm[c]);
        emit(`  [coord-resync] ghost coords found: ${ghostKeys.length}${ghostKeys.length ? '  ' + ghostKeys.slice(0,10).join(' ') : ' ✓'}`);
        if (execute && ghostKeys.length > 0) {
          for (const c of ghostKeys) delete coords[c];
          rewriteCoords();
          WBAPI._buildIndexes();
          batchSave('coord-resync');
          emit(`  [coord-resync] removed ${ghostKeys.length} ghost entries → NODE_COORDS rewritten`);
        } else if (!execute) {
          emit(`  [coord-resync] dry-run — would remove ${ghostKeys.length} ghost entries`);
        }
        doneResync();
      }

      // ── FINAL summary ──────────────────────────────────────────────────────
      {
        const elapsedS = ((Date.now()-rwT0)/1000).toFixed(1);
        const finalAll = Object.keys(nm);
        const finalJct = finalAll.filter(c=>!!nm[c]?.junction);
        emit(`\n[reweave-summary] elapsed=${elapsedS}s`);
        emit(`[reweave-summary] ${nodeStats()}`);
        emit(`[reweave-summary] reachable=${finalReach.size}/${finalAll.length}(${finalPct}%)  broken=${finalBroken}`);
        emit(`[reweave-summary] ${heapMB()}`);
      }

      WBAPI.stopPatchQueue();
      logResponse('POST',url.pathname,200,`MegaReWeave done reach=${finalReach.size}/${finalTotal}(${finalPct}%) broken=${finalBroken}`);
      res.end();
      return;
    }

    // ── POST /api/graph/cluster-bridge ──────────────────────────────────────
    // Connects remaining isolated clusters to the main network without running
    // a full reweave.  Safe to run after reweave when a few clusters are left.
    // Body: { execute? }
    if (parts[1] === 'cluster-bridge' && method === 'POST') {
      let cbBody; try { cbBody = await readBody(req); } catch(e) { cbBody = {}; }
      const cbExec = !!(cbBody||{}).execute;

      res.writeHead(200, {'Content-Type':'text/plain; charset=utf-8','Transfer-Encoding':'chunked','X-Accel-Buffering':'no'});
      const emit = s => res.write(s + '\n');

      const nm   = WBAPI.nodeMap;
      const DIRS4= ['N','S','E','W'];

      // undirected adjacency — matches the canonical bfsReach in the graph handler
      const cbAdj = new Map();
      for (const c of Object.keys(nm)) cbAdj.set(c, new Set());
      for (const [c, node] of Object.entries(nm)) {
        for (const d of DIRS4) {
          const nb = node[d]; if (!nb || !nm[nb]) continue;
          cbAdj.get(c).add(nb);
          cbAdj.get(nb).add(c);
        }
      }
      const bfsReach = start => {
        if (!cbAdj.has(start)) return new Set([start]);
        const visited = new Set([start]); const q = [start];
        while (q.length) {
          const c = q.shift();
          for (const nb of cbAdj.get(c)) { if (!visited.has(nb)) { visited.add(nb); q.push(nb); } }
        }
        return visited;
      };

      // find hub — prefer LHR, else largest component
      const getHub = () => {
        if (nm['LHR']) return 'LHR';
        let best='',bestSz=0;
        for (const c of Object.keys(nm)) { const sz=bfsReach(c).size; if(sz>bestSz){bestSz=sz;best=c;} }
        return best;
      };

      const hub    = getHub();
      const reachF = bfsReach(hub);
      const unreachF = Object.keys(nm).filter(c => !reachF.has(c));
      emit(`[cluster-bridge] hub=${hub}  reachable=${reachF.size}/${Object.keys(nm).length}  unreachable=${unreachF.length}`);

      if (!unreachF.length) {
        emit('[cluster-bridge] all nodes reachable ✓');
        res.end(); return;
      }

      // build connected components of unreachable nodes
      const unvisSet = new Set(unreachF);
      const clusters = [];
      for (const start of unreachF) {
        if (!unvisSet.has(start)) continue;
        const comp = []; const bq = [start];
        while (bq.length) {
          const c = bq.shift(); if (!unvisSet.has(c)) continue;
          unvisSet.delete(c); comp.push(c);
          for (const d of DIRS4) { const t = nm[c]?.[d]; if (t && nm[t] && unvisSet.has(t)) bq.push(t); }
        }
        clusters.push(comp);
      }

      emit(`[cluster-bridge] ${clusters.length} isolated cluster${clusters.length!==1?'s':''}`);
      for (const [i,cl] of clusters.entries()) {
        const named = cl.filter(c => !nm[c]?.junction);
        emit(`  cluster ${i+1}: ${cl.length} nodes  named=[${named.slice(0,6).join(' ')}${named.length>6?` +${named.length-6}`:''}]`);
      }

      if (!cbExec) {
        emit(`[cluster-bridge] dry-run: ${clusters.length} clusters — add --execute to bridge`);
        res.end(); return;
      }

      // ── reuse buildHighway from reweave context ───────────────────────────
      // buildHighway is a closure defined inside the reweave-all block and is
      // not accessible here.  Run the full reweave with execute=true instead,
      // or use the streamlined inline bridge below.

      // inline bridge: for each cluster find nearest (reach,cluster) pair and
      // connect via smart-connect endpoint which builds the corridor
      const mdist = (a,b) => Math.abs(a.r-b.r)+Math.abs(a.c-b.c);
      let bridged=0, failed=0;
      let reachArr = [...reachF];

      for (let ci=0; ci<clusters.length; ci++) {
        const cluster = clusters[ci];
        let bestDist=Infinity, bestR=null, bestC=null;
        for (const clNode of cluster) {
          const cc = WBAPI.nodeCoords[clNode]; if(!cc||!nm[clNode]) continue;
          for (const rNode of reachArr) {
            const rc = WBAPI.nodeCoords[rNode]; if(!rc||!nm[rNode]) continue;
            const d = mdist(cc,rc);
            if (d<bestDist) { bestDist=d; bestR=rNode; bestC=clNode; }
          }
        }
        if (!bestR||!bestC) { emit(`  cluster ${ci+1}: SKIP — no coords`); failed++; continue; }
        emit(`  cluster ${ci+1}: ${bestR}→${bestC}  dist=${bestDist}`);

        // Get plan from smart-connect (direction + anchor nodes), then PUT to wire them
        const OPP4cb = {N:'S',S:'N',E:'W',W:'E'};
        const httpReq = (path, method, body) => new Promise(resolve => {
          const s = JSON.stringify(body);
          const opts = {hostname:'localhost',port:PORT,path,method,
                        headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(s)}};
          const r = require('http').request(opts, res2 => {
            let d=''; res2.on('data',c=>d+=c); res2.on('end',()=>{ try{resolve(JSON.parse(d));}catch{resolve({ok:false,raw:d.slice(0,200)});} });
          });
          r.on('error',e=>resolve({ok:false,error:e.message})); r.write(s); r.end();
        });

        const plan = await httpReq('/api/graph/smart-connect','POST',{from:bestR,to:bestC,dryRun:true});
        if (!plan.ok||!plan.plan?.direction) {
          emit(`  ✗ plan failed: ${plan.error||'no direction'}`); failed++; continue;
        }
        const { direction: dir, insertA, insertB } = plan.plan;
        const aCode = insertA.code, bCode = insertB.code;

        // Wire A→dir→B and B→OPP(dir)→A via separate PUTs (bidirectional)
        const putA = await httpReq(`/api/node/${aCode}`,'PUT',{[dir]:bCode});
        const putB = await httpReq(`/api/node/${bCode}`,'PUT',{[OPP4cb[dir]]:aCode});

        if (putA.ok && putB.ok) {
          emit(`  ✓ wired ${aCode}.${dir}↔${bCode}  (${dir}/${OPP4cb[dir]})`);
          bridged++;
          const nr = bfsReach(hub);
          for (const c of nr) reachF.add(c);
          reachArr = [...reachF];
        } else {
          emit(`  ✗ put failed: A=${putA.ok?'ok':putA.error||'fail'}  B=${putB.ok?'ok':putB.error||'fail'}`);
          failed++;
        }
      }

      const postR = bfsReach(hub);
      emit(`[cluster-bridge] done: ${bridged} connected  ${failed} failed  → reachable=${postR.size}/${Object.keys(nm).length}`);
      res.end(); return;
    }

    // ── GET /api/graph/junction-audit ────────────────────────────────────────
    // Reports junction vs. named node breakdown, quest-ref safety check,
    // coordinate coverage, degree distribution, and a P_NUKE dry-run preview.
    // See: lab-report-junction-reweave-overhaul.md §2, §5
    if (parts[1] === 'junction-audit' && method === 'GET') {
      const coords   = WBAPI.nodeCoords || {};
      const DIRS4    = ['N','S','E','W'];
      const OPP4     = {N:'S',S:'N',E:'W',W:'E'};

      // ── Quest and NPC ref sets ────────────────────────────────────────────
      const questRefNodes = new Set();
      for (const q of Object.values(WBAPI.questDb || {}))
        for (const f of ['activateNode','waypointNode']) if (q[f]) questRefNodes.add(q[f]);
      const npcRefNodes = new Set(
        Object.values(WBAPI.birkaNpcs || {}).map(n => n.node).filter(Boolean)
      );

      // ── Classify every node ───────────────────────────────────────────────
      const jCodeRe = /^J\d+$/;
      let jTotal = 0, namedTotal = 0;
      let jWithCoords = 0, namedWithCoords = 0;
      let jReachable = 0, namedReachable = 0;
      const jQuestRefs = [];   // J#### nodes that quests point at (should be 0)
      const jNpcRefs   = [];   // J#### nodes that NPCs are stationed at
      const degDist    = {0:0, 1:0, 2:0, 3:0, 4:0};  // junction degree distribution

      // P_NUKE preview accumulators
      let nukeSafe = 0, nukeQuestBlocked = 0, nukeNpcBlocked = 0;
      let straightStitch = 0, lShapedDeferred = 0, deadEndDelete = 0;

      for (const [code, node] of Object.entries(nm)) {
        const isJ = jCodeRe.test(code);
        const hasCoord = !!coords[code];
        const isReach  = reachable.has(code);

        if (isJ) {
          jTotal++;
          if (hasCoord)  jWithCoords++;
          if (isReach)   jReachable++;
          if (questRefNodes.has(code)) jQuestRefs.push(code);
          if (npcRefNodes.has(code))   jNpcRefs.push(code);

          const deg = degree(code);
          degDist[Math.min(deg, 4)]++;

          // P_NUKE preview classification
          const safe = !questRefNodes.has(code) && !npcRefNodes.has(code);
          if (!safe) {
            if (questRefNodes.has(code)) nukeQuestBlocked++;
            if (npcRefNodes.has(code))   nukeNpcBlocked++;
            continue;
          }
          nukeSafe++;
          const liveDirs = DIRS4.filter(d => node[d] && nm[node[d]]);
          if (liveDirs.length === 0 || liveDirs.length === 1) {
            deadEndDelete++;
          } else if (liveDirs.length === 2 && OPP4[liveDirs[0]] === liveDirs[1]) {
            straightStitch++;
          } else {
            lShapedDeferred++;
          }
        } else {
          namedTotal++;
          if (hasCoord)  namedWithCoords++;
          if (isReach)   namedReachable++;
        }
      }

      // ── Quest nodes that have no r,c (unplaced named) ─────────────────────
      const unplacedQuestNodes = [...questRefNodes].filter(c => nm[c] && !coords[c] && !jCodeRe.test(c));

      return json(res, 200, {
        ok: true,
        summary: {
          total:        jTotal + namedTotal,
          junctionCount: jTotal,
          namedCount:   namedTotal,
          junctionPct:  jTotal ? ((jTotal / (jTotal + namedTotal)) * 100).toFixed(1) + '%' : '0%',
        },
        coordsCoverage: {
          jWithCoords,        jWithoutCoords:    jTotal - jWithCoords,
          namedWithCoords,    namedWithoutCoords: namedTotal - namedWithCoords,
        },
        reachability: {
          jReachable,         jUnreachable:     jTotal - jReachable,
          namedReachable,     namedUnreachable: namedTotal - namedReachable,
        },
        questRefs: {
          totalQuestRefNodes:    questRefNodes.size,
          uniqueNamedQuestNodes: questRefNodes.size - jQuestRefs.length,
          junctionQuestRefs:     jQuestRefs.length,
          junctionQuestRefCodes: jQuestRefs,
          safeToNukeAllJunctions: jQuestRefs.length === 0 && jNpcRefs.length === 0,
        },
        npcRefs: {
          junctionNpcRefs:     jNpcRefs.length,
          junctionNpcRefCodes: jNpcRefs,
        },
        junctionDegreeDist: degDist,
        unplacedQuestNodes: {
          count: unplacedQuestNodes.length,
          codes: unplacedQuestNodes,
        },
        nukePreview: {
          safeToDelete:     nukeSafe,
          blockedByQuest:   nukeQuestBlocked,
          blockedByNpc:     nukeNpcBlocked,
          straightStitch:   straightStitch,
          lShapedDeferred:  lShapedDeferred,
          deadEndDelete:    deadEndDelete,
          note: 'straightStitch = A-J-B chains that collapse to direct edges. lShapedDeferred = pairs handed to A* for path rebuild. deadEndDelete = degree≤1 safe to drop outright.',
        },
      });
    }

    return json(res, 404, { error:'Unknown graph sub-route. Available: GET /api/graph/reachability  GET /api/graph/connect  POST /api/graph/junction  GET /api/graph/validate/{code}  GET /api/graph/broken  POST /api/graph/fill-gap  POST /api/graph/spawn-junction  POST /api/graph/move  GET /api/graph/find-open-location/{code}  POST /api/graph/smart-connect  POST /api/graph/rip-and-connect  POST /api/graph/reweave-all  POST /api/graph/cluster-bridge  GET /api/graph/junction-audit' });
  }

  // ── Coords (NODE_COORDS) ─────────────────────────────────────────────────
  if (parts[0] === 'coords') {
    const coordAction = parts[1]; // undefined | 'near' | <nodeCode>

    // GET /api/coords — full coordinate map
    if (method === 'GET' && !coordAction) {
      const coords = WBAPI.nodeCoords;
      const count = Object.keys(coords).length;
      const maxR = Math.max(...Object.values(coords).map(p=>p.r));
      const maxC = Math.max(...Object.values(coords).map(p=>p.c));
      logRow('entries', count);
      logRow('bounds', `maxR:${maxR}  maxC:${maxC}`);
      logResponse(method, url.pathname, 200, `${count} coord entries`);
      return json(res, 200, { ok:true, count, maxR, maxC, coords });
    }

    // GET /api/coords/near/{code}?radius=N — find occupied and available slots near a node
    if (method === 'GET' && coordAction === 'near') {
      const targetCode = parts[2];
      if (!targetCode) {
        logResponse(method, url.pathname, 400, 'missing node code — GET /api/coords/near/{code}');
        return json(res, 400, { error:'Usage: GET /api/coords/near/{code}' });
      }
      const origin = WBAPI.nodeCoords[targetCode];
      if (!origin) {
        logResponse(method, url.pathname, 404, `no coordinates for node "${targetCode}"`);
        return json(res, 404, { error:`Node "${targetCode}" has no coords in NODE_COORDS` });
      }
      const radius = Math.max(1, Math.min(32, parseInt(url.searchParams.get('radius') || '8', 10)));
      const occupied = new Map(); // 'r,c' → code
      for (const [code, p] of Object.entries(WBAPI.nodeCoords)) {
        occupied.set(`${p.r},${p.c}`, code);
      }
      const nearby = [];
      for (const [code, p] of Object.entries(WBAPI.nodeCoords)) {
        const dr = Math.abs(p.r - origin.r), dc = Math.abs(p.c - origin.c);
        if (dr <= radius && dc <= radius && code !== targetCode) {
          nearby.push({ code, r: p.r, c: p.c, dr, dc,
            label: WBAPI.nodeMap[code]?.label || null,
            terrain: WBAPI.nodeMap[code]?.name || null });
        }
      }
      nearby.sort((a, b) => (a.dr + a.dc) - (b.dr + b.dc));
      // Suggest available slots adjacent to the origin (step=1 cells)
      const available = [];
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          if (dr === 0 && dc === 0) continue;
          const r = origin.r + dr, c = origin.c + dc;
          if (r < 1 || c < 1) continue;
          if (!occupied.has(`${r},${c}`)) available.push({ r, c, dr, dc });
        }
      }
      available.sort((a, b) => (Math.abs(a.dr)+Math.abs(a.dc)) - (Math.abs(b.dr)+Math.abs(b.dc)));
      logRow('origin', `${targetCode}  r:${origin.r}  c:${origin.c}`);
      logRow('radius', radius);
      logRow('nearby nodes', nearby.length);
      logRow('available slots', available.length);
      logResponse(method, url.pathname, 200, `near ${targetCode} — ${nearby.length} nodes, ${available.length} slots`);
      return json(res, 200, {
        ok: true, code: targetCode, origin,
        radius, nearby, available: available.slice(0, 40),
      });
    }

    // PUT /api/coords/{code} — set coordinates for a node
    if (method === 'PUT' && coordAction && coordAction !== 'near') {
      const targetCode = coordAction;
      if (!WBAPI.nodeMap[targetCode]) {
        logResponse(method, url.pathname, 404, `node "${targetCode}" not in NODE_MAP`);
        return json(res, 404, { error:`Node "${targetCode}" not found in NODE_MAP` });
      }
      let body;
      try { body = await readBody(req); } catch(e) {
        return json(res, 400, { error:'Invalid JSON' });
      }
      const r = body.r, c = body.c;
      if (r === undefined || c === undefined || typeof r !== 'number' || typeof c !== 'number') {
        logResponse(method, url.pathname, 400, 'body must have numeric r and c');
        return json(res, 400, { error:'body must contain numeric fields: r (row) and c (column)' });
      }
      // Check for coordinate collision
      const collision = Object.entries(WBAPI.nodeCoords).find(([code, p]) => p.r===r && p.c===c && code!==targetCode);
      if (collision) {
        logResponse(method, url.pathname, 409, `${r},${c} already occupied by ${collision[0]}`);
        return json(res, 409, { error:`Coordinate r:${r} c:${c} already occupied by node "${collision[0]}"` });
      }
      const prev = WBAPI.nodeCoords[targetCode] || null;
      WBAPI.nodeCoords[targetCode] = { r, c };
      // Patch NODE_COORDS section in _rawSrc
      const START = '// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆';
      const END   = '// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
      const sIdx = WBAPI._rawSrc.indexOf(START) + START.length;
      const eIdx = WBAPI._rawSrc.indexOf(END);
      let section = WBAPI._rawSrc.slice(sIdx, eIdx);
      const existingRe = new RegExp(`(\\b${targetCode}:\\s*\\{)[^}]*(\\})`);
      if (existingRe.test(section)) {
        // Update existing entry
        section = section.replace(existingRe, `$1r:${r},c:${c}$2`);
      } else {
        // Append new entry before closing };
        const closeIdx = section.lastIndexOf('\n};');
        section = section.slice(0, closeIdx + 1) + `  ${targetCode}:{r:${r},c:${c}},\n` + section.slice(closeIdx + 1);
      }
      WBAPI._rawSrc = WBAPI._rawSrc.slice(0, sIdx) + section + WBAPI._rawSrc.slice(eIdx);
      logRow('coords', `${targetCode}  ${prev?`r:${prev.r},c:${prev.c} → `:'(new) '}r:${r},c:${c}`);
      logResponse(method, url.pathname, 200, `coords/${targetCode} → r:${r} c:${c}`);
      return saveAndRestart(res, 200, { ok:true, code: targetCode, prev, coords: { r, c }, reminder: 'Use API only: PUT /api/node/{code}, PUT /api/coords/{code}, POST /api/graph/junction — never edit roll2hit-v3.html directly.' });
    }

    // ── POST /api/coords/{code}/nudge — move relatively ──────────────────────
    if (method === 'POST' && parts[2] === 'nudge') {
      const code = parts[1];
      if (!code) return json(res, 400, { error:'Usage: POST /api/coords/{code}/nudge  body: {dr, dc}' });
      let body; try { body = await readBody(req); } catch(e) { return json(res,400,{error:'Invalid JSON'}); }
      const { dr, dc } = body||{};
      if (dr===undefined && dc===undefined) return json(res,400,{error:'body must have dr and/or dc (relative offsets)'});
      const prev = WBAPI.nodeCoords[code];
      if (!prev) return json(res,404,{error:`Node "${code}" has no coordinates. Use PUT /api/coords/${code} to set initial position.`});
      const nr = prev.r + (Number(dr)||0), nc = prev.c + (Number(dc)||0);
      const collision = Object.entries(WBAPI.nodeCoords).find(([c,p])=>p.r===nr&&p.c===nc&&c!==code);
      if (collision) return json(res,409,{error:`r:${nr} c:${nc} already occupied by "${collision[0]}"`});
      WBAPI.nodeCoords[code] = { r:nr, c:nc };
      const START='// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆', END='// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
      const sI=WBAPI._rawSrc.indexOf(START)+START.length, eI=WBAPI._rawSrc.indexOf(END);
      let sec=WBAPI._rawSrc.slice(sI,eI);
      const existRe=new RegExp(`(\\b${code}:\\s*\\{)[^}]*(\\})`);
      if (existRe.test(sec)) sec=sec.replace(existRe,`$1r:${nr},c:${nc}$2`);
      else { const cIdx=sec.lastIndexOf('\n};'); sec=sec.slice(0,cIdx+1)+`  ${code}:{r:${nr},c:${nc}},\n`+sec.slice(cIdx+1); }
      WBAPI._rawSrc=WBAPI._rawSrc.slice(0,sI)+sec+WBAPI._rawSrc.slice(eI);
      logResponse('POST', url.pathname, 200, `nudge ${code}: (${prev.r},${prev.c})→(${nr},${nc})`);
      return saveAndRestart(res, 200, { ok:true, code, before:prev, after:{r:nr,c:nc}, dr:Number(dr)||0, dc:Number(dc)||0 });
    }

    // ── POST /api/coords/swap — atomically exchange two node positions ─────────
    if (method === 'POST' && parts[1] === 'swap') {
      let body; try { body = await readBody(req); } catch(e) { return json(res,400,{error:'Invalid JSON'}); }
      const { a, b } = body||{};
      if (!a||!b) return json(res,400,{error:'body must have: a (code), b (code)'});
      const ac = WBAPI.nodeCoords[a], bc = WBAPI.nodeCoords[b];
      if (!ac) return json(res,404,{error:`"${a}" has no coordinates`});
      if (!bc) return json(res,404,{error:`"${b}" has no coordinates`});
      const writeCoord = (code, r, c) => {
        WBAPI.nodeCoords[code] = { r, c };
        const START='// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆', END='// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
        const sI=WBAPI._rawSrc.indexOf(START)+START.length, eI=WBAPI._rawSrc.indexOf(END);
        let sec=WBAPI._rawSrc.slice(sI,eI);
        const existRe=new RegExp(`(\\b${code}:\\s*\\{)[^}]*(\\})`);
        if (existRe.test(sec)) sec=sec.replace(existRe,`$1r:${r},c:${c}$2`);
        else { const cIdx=sec.lastIndexOf('\n};'); sec=sec.slice(0,cIdx+1)+`  ${code}:{r:${r},c:${c}},\n`+sec.slice(cIdx+1); }
        WBAPI._rawSrc=WBAPI._rawSrc.slice(0,sI)+sec+WBAPI._rawSrc.slice(eI);
      };
      writeCoord(a, bc.r, bc.c);
      writeCoord(b, ac.r, ac.c);
      logResponse('POST', url.pathname, 200, `swap ${a}↔${b}`);
      return saveAndRestart(res, 200, { ok:true, swapped:[
        { code:a, before:ac, after:{r:bc.r,c:bc.c} },
        { code:b, before:bc, after:{r:ac.r,c:ac.c} }
      ], verify:[`GET /api/graph/validate/${a}`,`GET /api/graph/validate/${b}`] });
    }
  }

  // ── Layout solver ─────────────────────────────────────────────────────────
  if (parts[0] === 'layout') {
    const layoutAction = parts[1]; // 'solve' | 'apply'

    // GET /api/layout/solve[?step=8&root=TLS] — BFS grid layout
    if (method === 'GET' && layoutAction === 'solve') {
      const step     = Math.max(4, Math.min(32, parseInt(url.searchParams.get('step') || '8', 10)));
      const rootParam = url.searchParams.get('root') || null;
      const nodeMap  = WBAPI.nodeMap;
      const allCodes = Object.keys(nodeMap);
      const DIRS4    = ['N','S','E','W'];
      const DR4      = { N:-1, S:1, E:0, W:0 };
      const DC4      = { N:0, S:0, E:1, W:-1 };

      // Choose root: param > most-connected node
      let root = (rootParam && nodeMap[rootParam]) ? rootParam : null;
      if (!root) {
        root = allCodes.reduce((best, code) => {
          const ca = DIRS4.filter(d => nodeMap[code]?.[d]).length;
          const cb = DIRS4.filter(d => nodeMap[best]?.[d]).length;
          return ca > cb ? code : best;
        }, allCodes[0]);
      }

      // Seed root at existing coord (rounded to step) or (100, 100)
      const existing = WBAPI.nodeCoords;
      const rootCoord = existing[root] || { r: 100, c: 100 };
      const rootR = Math.round(rootCoord.r / step) * step;
      const rootC = Math.round(rootCoord.c / step) * step;

      const placed   = new Map(); // code → {r,c}
      const occupied = new Set(); // 'r,c' strings

      placed.set(root, { r: rootR, c: rootC });
      occupied.add(`${rootR},${rootC}`);

      const queue = [root];
      while (queue.length) {
        const code = queue.shift();
        const ca   = placed.get(code);
        const n    = nodeMap[code];
        for (const dir of DIRS4) {
          const target = n[dir];
          if (!target || !nodeMap[target] || placed.has(target)) continue;
          let r = ca.r + DR4[dir] * step;
          let c = ca.c + DC4[dir] * step;
          // Resolve collision by sliding further along the same axis
          let attempts = 0;
          while (occupied.has(`${r},${c}`) && attempts < 64) {
            r += DR4[dir] * step;
            c += DC4[dir] * step;
            attempts++;
          }
          if (!occupied.has(`${r},${c}`)) {
            placed.set(target, { r, c });
            occupied.add(`${r},${c}`);
            queue.push(target);
          }
        }
      }

      // Place orphan nodes (disconnected from root) in a row below the grid
      const orphans = allCodes.filter(c => !placed.has(c));
      const maxR    = Math.max(...[...placed.values()].map(p => p.r), rootR);
      let oR = maxR + step * 3;
      let oC = rootC;
      for (const code of orphans) {
        while (occupied.has(`${oR},${oC}`)) oC += step;
        placed.set(code, { r: oR, c: oC });
        occupied.add(`${oR},${oC}`);
        oC += step;
      }

      // Build proposed object and validate alignment + axis distance
      const proposed = {};
      for (const [code, p] of placed) proposed[code] = p;

      let alignOk = 0, alignBad = 0, distOk = 0, distBad = 0;
      const seenV = new Set();
      for (const code of allCodes) {
        const n = nodeMap[code];
        const ca = proposed[code];
        for (const dir of DIRS4) {
          const t = n[dir];
          if (!t || !proposed[t]) continue;
          const pk = [code, t].sort().join(':');
          if (seenV.has(pk)) continue;
          seenV.add(pk);
          const cb = proposed[t];
          if (ca.r === cb.r || ca.c === cb.c) {
            alignOk++;
            const d = ca.r === cb.r ? Math.abs(ca.c - cb.c) : Math.abs(ca.r - cb.r);
            if (d <= 4) distOk++; else distBad++;
          } else {
            alignBad++;
          }
        }
      }

      logRow('layout solve', `root:${root}  step:${step}  placed:${placed.size}  orphans:${orphans.length}`);
      logRow('validation', `alignOk:${alignOk}  alignBad:${alignBad}  distOk:${distOk}  distBad:${distBad}`);
      logResponse(method, url.pathname, 200, `layout solved — ${placed.size} nodes, ${orphans.length} orphans`);
      return json(res, 200, {
        ok: true, root, step,
        total: allCodes.length, placed: placed.size, orphans: orphans.length,
        validation: { alignOk, alignBad, distOk, distBad },
        proposed,
        applyCmd: `curl -XPOST http://localhost:${PORT}/api/layout/apply -H 'Content-Type: application/json' -d '{"coords":<proposed>}'`,
      });
    }

    // POST /api/layout/apply — mass-update NODE_COORDS
    if (method === 'POST' && layoutAction === 'apply') {
      let body;
      try { body = await readBody(req); } catch(e) {
        return json(res, 400, { error:'Invalid JSON' });
      }
      const coordsIn = body.coords;
      if (!coordsIn || typeof coordsIn !== 'object') {
        logResponse(method, url.pathname, 400, 'body.coords must be {code:{r,c}} map');
        return json(res, 400, { error:'body.coords must be a {code:{r,c}} map' });
      }
      const bad = Object.entries(coordsIn).filter(([,p]) => typeof p?.r !== 'number' || typeof p?.c !== 'number').map(([k]) => k);
      if (bad.length) {
        logResponse(method, url.pathname, 400, `invalid coords for ${bad.length} nodes`);
        return json(res, 400, { error:`Invalid coords (must have numeric r,c) for: ${bad.join(', ')}` });
      }

      let updated = 0;
      for (const [code, p] of Object.entries(coordsIn)) {
        WBAPI.nodeCoords[code] = { r: p.r, c: p.c };
        updated++;
      }

      // Rewrite the entire NODE_COORDS section in _rawSrc
      const START_MARK = '// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆';
      const END_MARK   = '// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
      const sIdx = WBAPI._rawSrc.indexOf(START_MARK) + START_MARK.length;
      const eIdx = WBAPI._rawSrc.indexOf(END_MARK);

      // Sort entries by (r, c) for a clean file
      const entries = Object.entries(WBAPI.nodeCoords).sort(([,a],[,b]) => (a.r - b.r) || (a.c - b.c));
      let newSection = `\nconst NODE_COORDS = { // → doc: maps.md §NODE_COORDS\n`;
      let prevBand = -999;
      for (const [code, p] of entries) {
        const band = Math.floor(p.r / 8) * 8;
        if (band !== prevBand && prevBand !== -999) newSection += '\n';
        newSection += `  ${code}:{r:${p.r},c:${p.c}},\n`;
        prevBand = band;
      }
      newSection += `};\n`;

      WBAPI._rawSrc = WBAPI._rawSrc.slice(0, sIdx) + newSection + WBAPI._rawSrc.slice(eIdx);

      logRow('layout apply', `${updated} coords written`);
      logResponse(method, url.pathname, 200, `layout applied: ${updated} coords`);
      return saveAndRestart(res, 200, { ok:true, updated });
    }

    // ── GET /api/layout/worldmap ──────────────────────────────────────────────
    // Return geographic reference data for all major cities.
    // Each entry has lat, lon, region, and current game grid (r,c) if placed.
    if (method === 'GET' && layoutAction === 'worldmap') {
      const nm = WBAPI.nodeMap;
      const GEO = {
        HHL:{lat:65.0,lon:-22.0,label:'Herdholt',region:'Iceland'},
        NID:{lat:63.4,lon:10.4,label:'Nidaros',region:'Norway'},
        LYG:{lat:62.0,lon:9.0,label:'Lyngvi Hall',region:'Norway'},
        ODD:{lat:60.0,lon:11.0,label:"Oddrun's Estate",region:'Norway'},
        SIG:{lat:59.5,lon:11.5,label:"Siggeir's Hall",region:'Scandinavia'},
        LHR:{lat:59.3,lon:17.6,label:'Birka',region:'Sweden'},
        HEO:{lat:55.6,lon:11.9,label:'Lejre',region:'Denmark'},
        GLA:{lat:55.9,lon:-4.3,label:'Glasgow',region:'Scotland'},
        EDI:{lat:55.9,lon:-3.2,label:'Edinburgh',region:'Scotland'},
        YRK:{lat:53.9,lon:-1.1,label:'York',region:'England'},
        GWN:{lat:53.2,lon:-4.0,label:'Gwynedd',region:'Wales'},
        MGL:{lat:53.1,lon:-3.8,label:'Deganwy',region:'Wales'},
        SHF:{lat:52.9,lon:-1.2,label:'Nottingham',region:'England'},
        HVY:{lat:52.0,lon:-3.0,label:"Heveydd's Court",region:'Wales'},
        HFD:{lat:52.1,lon:-2.7,label:'Hereford',region:'England'},
        LDN:{lat:51.5,lon:-0.1,label:'London (White Hill)',region:'England'},
        LON:{lat:51.5,lon:-0.3,label:'London (Chancellor)',region:'England'},
        BRK:{lat:51.5,lon:-0.2,label:'British Royal Court',region:'England'},
        MSE:{lat:51.3,lon:1.1,label:'Canterbury',region:'England'},
        ACT:{lat:50.6,lon:-4.7,label:"Arthur's Court",region:'England'},
        CVP:{lat:38.7,lon:-9.1,label:'Lisbon',region:'Portugal'},
        BDX:{lat:44.8,lon:-0.6,label:'Bordeaux',region:'France'},
        SRL:{lat:44.7,lon:1.1,label:'Beaulieu-en-Périgord',region:'France'},
        FRK:{lat:48.9,lon:2.3,label:'Paris',region:'France'},
        MTP:{lat:43.6,lon:3.9,label:'Montpellier',region:'France'},
        AVG:{lat:43.9,lon:4.8,label:'Avignon',region:'France'},
        MAR:{lat:43.3,lon:5.4,label:'Marseille',region:'France'},
        KOL:{lat:50.9,lon:6.9,label:'Cologne',region:'Germany'},
        WOR:{lat:49.6,lon:8.4,label:'Worms',region:'Germany'},
        REG:{lat:49.0,lon:12.1,label:'Regensburg',region:'Germany'},
        SAL:{lat:44.6,lon:7.5,label:'Saluzzo',region:'N Italy'},
        BDA:{lat:47.5,lon:19.0,label:'Buda',region:'Hungary'},
        ETZ:{lat:47.3,lon:19.2,label:"Etzel's Court",region:'Hungary'},
        KRK:{lat:50.1,lon:19.9,label:'Kraków',region:'Poland'},
        VEN:{lat:45.4,lon:12.3,label:'Venice',region:'Italy'},
        FRR:{lat:44.8,lon:11.6,label:'Ferrara',region:'Italy'},
        BOL:{lat:44.5,lon:11.3,label:'Bologna',region:'Italy'},
        PRA:{lat:43.9,lon:11.1,label:'Prato',region:'Italy'},
        PIS:{lat:43.8,lon:10.9,label:'Pistoia',region:'Italy'},
        PSA:{lat:43.7,lon:10.4,label:'Florence/Pisa Gate',region:'Italy'},
        AOI:{lat:43.6,lon:13.5,label:'Ancona',region:'Italy'},
        ROM:{lat:41.9,lon:12.5,label:'Rome',region:'Italy'},
        SAU:{lat:41.8,lon:12.6,label:'Appian Way',region:'Italy'},
        BAR:{lat:41.1,lon:16.9,label:'Bari',region:'Italy'},
        PAR:{lat:38.1,lon:13.4,label:'Palermo',region:'Sicily'},
        BIS:{lat:47.1,lon:24.5,label:'Bistritz',region:'Romania'},
        KLZ:{lat:46.8,lon:23.6,label:'Klausenburg',region:'Romania'},
        SIB:{lat:45.8,lon:24.2,label:'Sibiu',region:'Romania'},
        VAR:{lat:43.2,lon:27.9,label:'Varna',region:'Bulgaria'},
        THA:{lat:40.6,lon:22.9,label:'Thessaloniki Harbor',region:'Greece'},
        LMO:{lat:40.5,lon:23.0,label:'Thessaloniki Mon.',region:'Greece'},
        PHC:{lat:39.6,lon:19.9,label:'Phaeacia',region:'Greece'},
        ITH:{lat:38.4,lon:20.7,label:'Ithaca',region:'Greece'},
        ORC:{lat:38.5,lon:22.9,label:'Orchomenos',region:'Greece'},
        MYS:{lat:37.1,lon:22.4,label:'Mystras',region:'Greece'},
        MSN:{lat:36.9,lon:21.7,label:'Messenia',region:'Greece'},
        CON:{lat:41.0,lon:28.9,label:'Constantinople',region:'Turkey'},
        VRG:{lat:41.1,lon:28.8,label:'Varangian Barracks',region:'Turkey'},
        BTR:{lat:41.0,lon:29.1,label:'Bosphorus',region:'Turkey'},
        BUR:{lat:40.2,lon:29.1,label:'Bursa',region:'Turkey'},
        SIN:{lat:42.0,lon:35.2,label:'Sinope',region:'Turkey'},
        TRB:{lat:41.0,lon:39.7,label:'Trebizond',region:'Turkey'},
        ANT:{lat:36.2,lon:36.2,label:'Antioch',region:'Turkey/Syria'},
        ALP:{lat:36.2,lon:37.2,label:'Aleppo',region:'Syria'},
        ALB:{lat:36.4,lon:37.0,label:'Aleppo Hills',region:'Syria'},
        JAR:{lat:31.8,lon:35.2,label:'Jerusalem',region:'Palestine'},
        OLN:{lat:31.7,lon:35.3,label:'Jerusalem Inner',region:'Palestine'},
        BGD:{lat:33.3,lon:44.4,label:'Baghdad',region:'Iraq'},
        TUN:{lat:36.8,lon:10.2,label:'Tunis',region:'Tunisia'},
        MLN:{lat:-3.2,lon:40.1,label:'Malindi',region:'Kenya'},
        GNJ:{lat:40.7,lon:46.3,label:'Ganja',region:'Azerbaijan'},
        TBZ:{lat:38.1,lon:46.3,label:'Tabriz',region:'Iran'},
        MRG:{lat:37.4,lon:46.5,label:'Maragha',region:'Iran'},
        NIS:{lat:36.2,lon:58.8,label:'Nishapur',region:'Iran'},
        MRV:{lat:37.7,lon:62.2,label:'Merv',region:'Turkmenistan'},
        SAM:{lat:39.6,lon:66.9,label:'Samarkand',region:'Uzbekistan'},
      };
      const result = {};
      for (const [code, geo] of Object.entries(GEO)) {
        if (!nm[code]) continue;
        result[code] = { ...geo, gameCoords: WBAPI.nodeCoords[code] || null, inNodeMap: true };
      }
      logResponse(method, url.pathname, 200, `worldmap: ${Object.keys(result).length} geo-referenced cities`);
      return json(res, 200, { ok:true, count: Object.keys(result).length, cities: result });
    }

    // ── POST /api/layout/geo-seed ─────────────────────────────────────────────
    // Assign geographic lat/lon-derived game coordinates to known major cities.
    // Body: { dryRun?, minLat?, maxLat?, minLon?, maxLon?, gridMin?, gridMax? }
    if (method === 'POST' && layoutAction === 'geo-seed') {
      const nm = WBAPI.nodeMap;
      let body; try { body = await readBody(req); } catch(e) { body = {}; }
      const { dryRun=true, minLat=-8, maxLat=68, minLon=-25, maxLon=72, gridMin=8, gridMax=500 } = body||{};

      // Reuse the GEO table from the worldmap handler inline (abbreviated for brevity)
      const geoSeed = await (async () => {
        const res2 = { statusCode:200 }; // fake response for inner handler
        // Instead: return the geo table directly
        return null;
      })();

      // Inline geo table (same as worldmap)
      const GEO2 = {
        HHL:{lat:65.0,lon:-22.0},NID:{lat:63.4,lon:10.4},LYG:{lat:62.0,lon:9.0},ODD:{lat:60.0,lon:11.0},
        SIG:{lat:59.5,lon:11.5},LHR:{lat:59.3,lon:17.6},HEO:{lat:55.6,lon:11.9},GLA:{lat:55.9,lon:-4.3},
        EDI:{lat:55.9,lon:-3.2},YRK:{lat:53.9,lon:-1.1},GWN:{lat:53.2,lon:-4.0},MGL:{lat:53.1,lon:-3.8},
        SHF:{lat:52.9,lon:-1.2},HVY:{lat:52.0,lon:-3.0},HFD:{lat:52.1,lon:-2.7},LDN:{lat:51.5,lon:-0.1},
        LON:{lat:51.5,lon:-0.3},BRK:{lat:51.5,lon:-0.2},MSE:{lat:51.3,lon:1.1},ACT:{lat:50.6,lon:-4.7},
        CVP:{lat:38.7,lon:-9.1},BDX:{lat:44.8,lon:-0.6},SRL:{lat:44.7,lon:1.1},FRK:{lat:48.9,lon:2.3},
        MTP:{lat:43.6,lon:3.9},AVG:{lat:43.9,lon:4.8},MAR:{lat:43.3,lon:5.4},KOL:{lat:50.9,lon:6.9},
        WOR:{lat:49.6,lon:8.4},REG:{lat:49.0,lon:12.1},SAL:{lat:44.6,lon:7.5},BDA:{lat:47.5,lon:19.0},
        ETZ:{lat:47.3,lon:19.2},KRK:{lat:50.1,lon:19.9},VEN:{lat:45.4,lon:12.3},FRR:{lat:44.8,lon:11.6},
        BOL:{lat:44.5,lon:11.3},PRA:{lat:43.9,lon:11.1},PIS:{lat:43.8,lon:10.9},PSA:{lat:43.7,lon:10.4},
        AOI:{lat:43.6,lon:13.5},ROM:{lat:41.9,lon:12.5},SAU:{lat:41.8,lon:12.6},BAR:{lat:41.1,lon:16.9},
        PAR:{lat:38.1,lon:13.4},BIS:{lat:47.1,lon:24.5},KLZ:{lat:46.8,lon:23.6},SIB:{lat:45.8,lon:24.2},
        VAR:{lat:43.2,lon:27.9},THA:{lat:40.6,lon:22.9},LMO:{lat:40.5,lon:23.0},PHC:{lat:39.6,lon:19.9},
        ITH:{lat:38.4,lon:20.7},ORC:{lat:38.5,lon:22.9},MYS:{lat:37.1,lon:22.4},MSN:{lat:36.9,lon:21.7},
        CON:{lat:41.0,lon:28.9},VRG:{lat:41.1,lon:28.8},BTR:{lat:41.0,lon:29.1},BUR:{lat:40.2,lon:29.1},
        SIN:{lat:42.0,lon:35.2},TRB:{lat:41.0,lon:39.7},ANT:{lat:36.2,lon:36.2},ALP:{lat:36.2,lon:37.2},
        ALB:{lat:36.4,lon:37.0},JAR:{lat:31.8,lon:35.2},OLN:{lat:31.7,lon:35.3},BGD:{lat:33.3,lon:44.4},
        TUN:{lat:36.8,lon:10.2},MLN:{lat:-3.2,lon:40.1},GNJ:{lat:40.7,lon:46.3},TBZ:{lat:38.1,lon:46.3},
        MRG:{lat:37.4,lon:46.5},NIS:{lat:36.2,lon:58.8},MRV:{lat:37.7,lon:62.2},SAM:{lat:39.6,lon:66.9},
      };

      const coords = {}, seeded = [], skipped = [];
      const occ = new Map();
      for (const [code, geo] of Object.entries(GEO2)) {
        if (!nm[code]) { skipped.push(code); continue; }
        let r = Math.round(gridMin + (maxLat - geo.lat) / (maxLat - minLat) * (gridMax - gridMin));
        let c = Math.round(gridMin + (geo.lon - minLon) / (maxLon - minLon) * (gridMax - gridMin));
        r = Math.max(gridMin, Math.min(gridMax, r));
        c = Math.max(gridMin, Math.min(gridMax, c));
        for (let try_=0; occ.has(`${r},${c}`) && try_<20; try_++) c++;
        coords[code] = {r, c};
        occ.set(`${r},${c}`, code);
        seeded.push(code);
      }

      if (dryRun) {
        logResponse(method, url.pathname, 200, `geo-seed dry-run: ${seeded.length} cities`);
        return json(res, 200, { ok:true, dryRun:true, seeded:seeded.length, skipped, coords });
      }

      // Apply
      for (const [code, p] of Object.entries(coords)) WBAPI.nodeCoords[code] = p;
      const START_M='// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆', END_M='// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
      const sI=WBAPI._rawSrc.indexOf(START_M)+START_M.length, eI=WBAPI._rawSrc.indexOf(END_M);
      const allEntries=Object.entries(WBAPI.nodeCoords).sort(([,a],[,b])=>(a.r-b.r)||(a.c-b.c));
      let newSec=`\nconst NODE_COORDS = { // → doc: maps.md §NODE_COORDS\n`;
      let prevBand=-999;
      for (const [ec,ep] of allEntries){const band=Math.floor(ep.r/8)*8;if(band!==prevBand&&prevBand!==-999)newSec+='\n';newSec+=`  ${ec}:{r:${ep.r},c:${ep.c}},\n`;prevBand=band;}
      newSec+=`};\n`;
      WBAPI._rawSrc=WBAPI._rawSrc.slice(0,sI)+newSec+WBAPI._rawSrc.slice(eI);
      logResponse(method, url.pathname, 200, `geo-seed applied: ${seeded.length} cities`);
      return saveAndRestart(res, 200, { ok:true, dryRun:false, seeded:seeded.length, skipped, coords });
    }

    return json(res, 404, { error:'Unknown layout route. Available: GET /api/layout/solve  POST /api/layout/apply  GET /api/layout/worldmap  POST /api/layout/geo-seed' });
  }

  // ── Flags (_S_DEFAULTS) ───────────────────────────────────────────────────
  if (parts[0] === 'flags') {
    if (method === 'GET') {
      log('LOGIC', 'Parsing _S_DEFAULTS flags from source');
      const parsed = parseSDefaultsBody();
      if (!parsed.ok) {
        logResponse(method, url.pathname, 404, parsed.error);
        return json(res, 404, { error: parsed.error });
      }
      const flags = {};
      const lineRe = /(?:^|,)\s*([a-z_]\w*)\s*:\s*([^,\n/{}[\]]+)/gm;
      let m;
      while ((m = lineRe.exec(parsed.body)) !== null) {
        const [, k, rawVal] = m;
        const t = rawVal.trim();
        if (t === 'true')  flags[k] = true;
        else if (t === 'false') flags[k] = false;
        else if (t === 'null')  flags[k] = null;
        else if (t !== '' && !isNaN(t)) flags[k] = Number(t);
        else flags[k] = t.replace(/^['"]|['"]$/g, '');
      }
      logResponse(method, url.pathname, 200, `${Object.keys(flags).length} flags`);
      return json(res, 200, { ok:true, count:Object.keys(flags).length, flags });
    }

    if (method === 'POST') {
      let body;
      try { body = await readBody(req); } catch(e) {
        return json(res, 400, { error:'Invalid JSON' });
      }
      log('REQUEST', 'POST flags (add flag)', body);
      const { name, defaultValue, comment } = body;
      if (!name || !/^\w+$/.test(name)) {
        logResponse(method, url.pathname, 400, 'name must be a valid JS identifier');
        return json(res, 400, { error:'body.name must be a valid JS identifier' });
      }
      if (defaultValue === undefined) {
        logResponse(method, url.pathname, 400, 'body.defaultValue required');
        return json(res, 400, { error:'body.defaultValue required' });
      }
      const parsed = parseSDefaultsBody();
      if (!parsed.ok) return json(res, 404, { error: parsed.error });
      if (new RegExp(`\\b${name}\\s*:`).test(parsed.body)) {
        logResponse(method, url.pathname, 409, `flag "${name}" already exists`);
        return json(res, 409, { error:`Flag "${name}" already exists in _S_DEFAULTS` });
      }
      const valStr = typeof defaultValue === 'string' ? JSON.stringify(defaultValue) : String(defaultValue);
      const suffix = comment ? ` // ${comment}` : '';
      const newLine = `    ${name}: ${valStr},${suffix}\n`;
      const lineStart = WBAPI._rawSrc.lastIndexOf('\n', parsed.closeIdx - 1);
      WBAPI._rawSrc = WBAPI._rawSrc.slice(0, lineStart + 1) + newLine + WBAPI._rawSrc.slice(lineStart + 1);
      log('LOGIC', `Added flag "${name}" = ${valStr} to _S_DEFAULTS`);
      logResponse('POST', '/api/flags', 201, `flag "${name}" added`);
      return saveAndRestart(res, 201, { ok:true, name, defaultValue });
    }
  }

  // ── List ──────────────────────────────────────────────────────────────────
  if (parts[0] === 'list') {
    const type    = parts[1];
    // All filters
    const nodeQ   = url.searchParams.get('node');
    const terrain = url.searchParams.get('terrain');
    const arc     = url.searchParams.get('arc');
    const qtype   = url.searchParams.get('type');
    const actQ    = url.searchParams.get('act');
    const q       = url.searchParams.get('q');       // label/name text search
    const idsOnly = url.searchParams.get('ids') === 'true'; // return just an array of IDs/keys
    const noCoords= url.searchParams.get('no_coords') === 'true';
    const hasQuests = url.searchParams.get('has_quests');
    const isJunction = url.searchParams.get('junction');
    const tier    = url.searchParams.get('tier');
    const occupation = url.searchParams.get('occupation');

    const filters = [
      nodeQ&&`node=${nodeQ}`, terrain&&`terrain=${terrain}`, arc&&`arc=${arc}`,
      qtype&&`type=${qtype}`, actQ&&`act=${actQ}`, q&&`q=${q}`,
      noCoords&&`no_coords=true`, hasQuests&&`has_quests=${hasQuests}`,
      isJunction&&`junction=${isJunction}`, tier&&`tier=${tier}`, occupation&&`occupation=${occupation}`
    ].filter(Boolean);

    // Helper: build filter hint object shown at top of every list
    const filterHint = (typeName, filterDocs) => ({
      _hint: `Showing ${typeName} — add ?param=value to filter. No filters active. Available filters:`,
      _filters: filterDocs,
      _examples: filterDocs.map(f => `?${f.param}=${f.example}`).slice(0,4),
    });

    // ── /api/list  (no type) — list all available list types ─────────────────
    if (!type) {
      const allTerrains = Object.keys(WBAPI.worldDb);
      const allActs = [...new Set(Object.values(WBAPI.nodeMap).map(n=>n.act).filter(Boolean))].sort((a,b)=>a-b);
      const allQtypes = [...new Set(WBAPI.quests.all().map(q=>q.type).filter(Boolean))];
      return json(res, 200, {
        _hint: 'List index — all available list routes. Add the type to the URL.',
        available: [
          { path:'/api/list/node',    count:WBAPI.nodes.all().length,     filters:'act, terrain, node, q, ids, no_coords, has_quests, junction', acts: allActs },
          { path:'/api/list/quest',   count:WBAPI.quests.all().length,    filters:'node, type, arc, q, ids',    types: allQtypes },
          { path:'/api/list/monster', count:WBAPI.monsters.all().length,  filters:'terrain, tier, q, ids',      tiers:['trivial','easy','medium','hard','boss'] },
          { path:'/api/list/npc',     count:WBAPI.npcs.all().filter(n=>!n._inline).length, filters:'node, occupation, q, ids' },
          { path:'/api/list/terrain', count:Object.keys(WBAPI.worldDb).length, filters:'q, ids', keys: allTerrains },
          { path:'/api/list/ids/node',    note:'Array of node code strings only' },
          { path:'/api/list/ids/quest',   note:'Array of quest id strings only' },
          { path:'/api/list/ids/monster', note:'Array of monster key strings only' },
          { path:'/api/list/ids/npc',     note:'Array of npc key strings only' },
          { path:'/api/list/ids/terrain', note:'Array of terrain key strings only' },
          { path:'/api/graph/broken?maxGap=4',    note:'All edges with gap>4 or off-axis' },
          { path:'/api/graph/validate/{code}',    note:'Single node walkability check' },
          { path:'/api/coords',                   note:'All node coordinates {code:{r,c}}' },
          { path:'/api/coords/near/{code}?radius=8', note:'Nodes near a position' },
        ]
      });
    }

    // ── /api/list/ids/{type} — IDs only ──────────────────────────────────────
    if (type === 'ids') {
      const subtype = parts[2];
      if (!subtype) return json(res,400,{error:'Usage: /api/list/ids/{node|quest|monster|npc|terrain}',available:['node','quest','monster','npc','terrain']});
      if (subtype==='node')    return json(res,200,{ type:'node',    count:WBAPI.nodes.all().length,    ids: WBAPI.nodes.all().map(n=>n.id) });
      if (subtype==='quest')   return json(res,200,{ type:'quest',   count:WBAPI.quests.all().length,   ids: WBAPI.quests.all().map(q=>q.id) });
      if (subtype==='monster') return json(res,200,{ type:'monster', count:WBAPI.monsters.all().length, ids: WBAPI.monsters.all().map(m=>m.key) });
      if (subtype==='npc')     return json(res,200,{ type:'npc',     count:WBAPI.npcs.all().filter(n=>!n._inline).length, ids: WBAPI.npcs.all().filter(n=>!n._inline).map(n=>n.key) });
      if (subtype==='terrain') return json(res,200,{ type:'terrain', count:Object.keys(WBAPI.worldDb).length, ids: Object.keys(WBAPI.worldDb) });
      return json(res,404,{error:`Unknown type: ${subtype}`,available:['node','quest','monster','npc','terrain']});
    }

    if (type === 'node') {
      const total = WBAPI.nodes.all().length;
      let list = WBAPI.nodes.all();
      if (nodeQ)      list = list.filter(n => n.id === nodeQ);
      if (actQ)       list = list.filter(n => String(n.act) === String(actQ));
      if (terrain)    list = list.filter(n => n.name === terrain);
      if (q)          list = list.filter(n => (n.label||'').toLowerCase().includes(q.toLowerCase()) || n.id.toLowerCase().includes(q.toLowerCase()));
      if (noCoords)   list = list.filter(n => !WBAPI.nodeCoords[n.id]);
      if (isJunction==='true')  list = list.filter(n => n.junction || n.id.match(/^J\d+$/));
      if (isJunction==='false') list = list.filter(n => !n.junction && !n.id.match(/^J\d+$/));
      if (hasQuests==='true')   list = list.filter(n => (WBAPI._questsByNode[n.id]||[]).length > 0);
      if (hasQuests==='false')  list = list.filter(n => (WBAPI._questsByNode[n.id]||[]).length === 0);

      const acts = {}; list.forEach(n => { acts[n.act] = (acts[n.act]||0)+1; });
      const terrainCounts = {}; list.forEach(n => { terrainCounts[n.name] = (terrainCounts[n.name]||0)+1; });

      if (idsOnly) return json(res,200,{ count:list.length, ids: list.map(n=>n.id) });

      const out = list.map(n => ({
        id: n.id, label: n.label, terrain: n.name, act: n.act,
        coords: WBAPI.nodeCoords[n.id] || null,
        connections: ['N','E','S','W'].filter(d=>WBAPI.nodeMap[n.id]?.[d]).map(d=>({ dir:d, to:WBAPI.nodeMap[n.id][d] })),
        _meta: { quests: (WBAPI._questsByNode[n.id]||[]).length,
                 npcs:   WBAPI.npcs.byNode(n.id).length,
                 hasCoords: !!WBAPI.nodeCoords[n.id],
                 isJunction: !!(n.junction || n.id.match(/^J\d+$/)),
                 canDelete: !WBAPI._questsByNode[n.id]?.length && !WBAPI.npcs.byNode(n.id).length }
      }));

      const allActs = [...new Set(WBAPI.nodes.all().map(n=>n.act).filter(Boolean))].sort((a,b)=>a-b);
      const allTerrains = [...new Set(WBAPI.nodes.all().map(n=>n.name).filter(Boolean))].sort();

      const hintBlock = filters.length ? null : {
        _hint: `Returning all ${total} nodes. Add filters to narrow results:`,
        _filters: [
          {param:'act',        example: allActs[0]||'1',        desc:'Filter by act number'},
          {param:'terrain',    example: allTerrains[0]||'city', desc:'Filter by terrain key'},
          {param:'q',          example:'birka',                 desc:'Search label/id text (case-insensitive)'},
          {param:'no_coords',  example:'true',                  desc:'Only nodes without coordinates set'},
          {param:'has_quests', example:'true',                  desc:'Only nodes that have quests'},
          {param:'junction',   example:'true',                  desc:'Only junction nodes (J* or junction:true)'},
          {param:'ids',        example:'true',                  desc:'Return only array of ID strings'},
          {param:'node',       example:list[0]?.id||'BK',       desc:'Single node by exact ID'},
        ],
        _actCounts: acts,
        _terrainCounts: terrainCounts,
        _examples: [`?act=1`, `?terrain=${allTerrains[0]||'city'}`, `?q=birka`, `?no_coords=true`, `?ids=true`],
      };

      logRow('total', filters.length ? `${total} total → ${out.length} matched (${filters.join(', ')})` : `${out.length} nodes`);
      logRow('by act', Object.entries(acts).sort((a,b)=>+a[0]-+b[0]).map(([a,n])=>`Act${a}×${n}`).join('  '));
      logResponse(method, url.pathname, 200, `${out.length} nodes`);
      return json(res, 200, hintBlock ? [hintBlock, ...out] : out);
    }

    if (type === 'quest') {
      const total = WBAPI.quests.all().length;
      let list = WBAPI.quests.all();
      if (nodeQ)  list = list.filter(q => q.activateNode===nodeQ || q.waypointNode===nodeQ);
      if (qtype)  list = list.filter(q => q.type === qtype);
      if (arc)    list = list.filter(q => q.id.startsWith(arc));
      if (q)      list = list.filter(qu => (qu.title||'').toLowerCase().includes(q.toLowerCase()) || qu.id.toLowerCase().includes(q.toLowerCase()));
      if (actQ)   list = list.filter(qu => { const n=WBAPI.nodeMap[qu.activateNode]; return n && String(n.act)===String(actQ); });
      const npcQ  = url.searchParams.get('npc');
      const hasNpcQ = url.searchParams.get('has_npc');
      if (npcQ)          list = list.filter(qu => qu.npc === npcQ);
      if (hasNpcQ==='true')  list = list.filter(qu => !!qu.npc);
      if (hasNpcQ==='false') list = list.filter(qu => !qu.npc);
      const completeQ = url.searchParams.get('complete');
      if (completeQ==='true')  list = list.filter(qu => !!qu.questComplete);
      if (completeQ==='false') list = list.filter(qu => !qu.questComplete);
      const monsterQ = url.searchParams.get('monster');
      if (monsterQ) list = list.filter(qu => qu.monster === monsterQ);

      if (idsOnly) return json(res,200,{ count:list.length, ids: list.map(q=>q.id) });

      const out = list.map(q => ({
        id: q.id, title: q.title, type: q.type,
        activateNode: q.activateNode, waypointNode: q.waypointNode, npc: q.npc,
        _meta: { downstream: WBAPI.quests.chain(q.id).downstream.length,
                 canDelete:  WBAPI.quests.chain(q.id).downstream.length === 0 }
      }));
      const types = {}; out.forEach(q => { types[q.type] = (types[q.type]||0)+1; });
      const allQtypes = [...new Set(WBAPI.quests.all().map(q=>q.type).filter(Boolean))];

      const hintBlock = filters.length ? null : {
        _hint: `Returning all ${total} quests. Add filters to narrow results:`,
        _filters: [
          {param:'node',     example:'BK',                  desc:'Quests at this node (activateNode or waypointNode)'},
          {param:'type',     example:allQtypes[0]||'skill_check', desc:`Quest type. All: ${allQtypes.join(', ')}`},
          {param:'arc',      example:'shk',                 desc:'Quest ID prefix e.g. "shk" → shk6_act1, shk6_act2…'},
          {param:'q',        example:'ring',                desc:'Search title/id text (case-insensitive)'},
          {param:'act',      example:'1',                   desc:'Quests whose activateNode is in this act'},
          {param:'npc',      example:'yael',                desc:'Quests assigned to a specific NPC key'},
          {param:'has_npc',  example:'true',                desc:'true = has NPC, false = no NPC'},
          {param:'complete', example:'true',                desc:'true = has questComplete flag set'},
          {param:'monster',  example:'wolf',                desc:'Quests referencing a specific monster key'},
          {param:'ids',      example:'true',                desc:'Return only array of ID strings'},
        ],
        _typeCounts: types,
        _examples: [`?node=BK`, `?type=skill_check`, `?arc=shk`, `?has_npc=true`, `?complete=true`, `?ids=true`],
      };

      logRow('total', filters.length ? `${total} total → ${out.length} matched (${filters.join(', ')})` : `${out.length} quests`);
      logRow('by type', Object.entries(types).map(([t,n])=>`${t}×${n}`).join('  '));
      logResponse(method, url.pathname, 200, `${out.length} quests`);
      return json(res, 200, hintBlock ? [hintBlock, ...out] : out);
    }

    if (type === 'monster') {
      const total = WBAPI.monsters.all().length;
      let list = WBAPI.monsters.all();
      if (terrain) list = list.filter(m => m.terrains.includes(terrain));
      if (tier)    list = list.filter(m => m.tier === tier);
      if (q)       list = list.filter(m => (m.name||'').toLowerCase().includes(q.toLowerCase()) || m.key.toLowerCase().includes(q.toLowerCase()));
      const hasDropQ = url.searchParams.get('has_drop');
      if (hasDropQ==='true')  list = list.filter(m => !!WBAPI.monsterDrops?.[m.key]);
      if (hasDropQ==='false') list = list.filter(m => !WBAPI.monsterDrops?.[m.key]);
      const noTerrainQ = url.searchParams.get('no_terrain');
      if (noTerrainQ==='true') list = list.filter(m => m.terrains.length === 0);

      if (idsOnly) return json(res,200,{ count:list.length, ids: list.map(m=>m.key) });

      const out = list.map(m => ({
        key: m.key, name: m.name, tier: m.tier, terrainCount: m.terrains.length,
        terrains: m.terrains,
        _meta: { hasDrops: !!WBAPI.monsterDrops[m.key], canDelete: m.terrains.length === 0 }
      }));
      const tierCounts = {}; out.forEach(m => { tierCounts[m.tier] = (tierCounts[m.tier]||0)+1; });
      const allTerrains = [...new Set(WBAPI.nodes.all().map(n=>n.name).filter(Boolean))].sort();

      const hintBlock = filters.length ? null : {
        _hint: `Returning all ${total} monsters. Add filters to narrow results:`,
        _filters: [
          {param:'terrain',    example:allTerrains[0]||'forest', desc:'Monsters that appear in this terrain'},
          {param:'tier',       example:'easy',                   desc:'trivial | easy | medium | hard | boss'},
          {param:'q',          example:'wolf',                   desc:'Search name/key text'},
          {param:'has_drop',   example:'true',                   desc:'Only monsters with loot drops'},
          {param:'no_terrain', example:'true',                   desc:'Only monsters not assigned to any terrain'},
          {param:'ids',        example:'true',                   desc:'Return only array of key strings'},
        ],
        _tierCounts: tierCounts,
        _examples: [`?terrain=forest`, `?tier=easy`, `?q=wolf`, `?has_drop=true`, `?ids=true`],
      };

      logRow('total', filters.length ? `${total} total → ${out.length} matched (${filters.join(', ')})` : `${out.length} monsters`);
      logResponse(method, url.pathname, 200, `${out.length} monsters`);
      return json(res, 200, hintBlock ? [hintBlock, ...out] : out);
    }

    if (type === 'npc') {
      let list = WBAPI.npcs.all().filter(n => !n._inline);
      if (nodeQ)      list = list.filter(n => n.node === nodeQ);
      if (q)          list = list.filter(n => (n.name||'').toLowerCase().includes(q.toLowerCase()) || (n.key||'').toLowerCase().includes(q.toLowerCase()));
      if (occupation) list = list.filter(n => (n.occupation||'').toLowerCase().includes(occupation.toLowerCase()));
      if (actQ)       list = list.filter(n => { const nd=WBAPI.nodeMap[n.node]; return nd && String(nd.act)===String(actQ); });

      if (idsOnly) return json(res,200,{ count:list.length, ids: list.map(n=>n.key) });

      const out = list.map(n => ({
        key: n.key, name: n.name, node: n.node, occupation: n.occupation,
        nodeLabel: WBAPI.nodeMap[n.node]?.label || null,
        _meta: { questCount: WBAPI._deps.npc(n.key)?.quests?.length||0, canDelete: !WBAPI._deps.npc(n.key)?.quests?.length }
      }));

      const allOccupations = [...new Set(WBAPI.npcs.all().filter(n=>!n._inline&&n.occupation).map(n=>n.occupation))].sort();
      const allNodeIds = [...new Set(out.map(n=>n.node))].sort();

      const hintBlock = filters.length ? null : {
        _hint: `Returning all ${out.length} NPCs. Add filters to narrow results:`,
        _filters: [
          {param:'node',       example:allNodeIds[0]||'LHR', desc:'NPCs at a specific node'},
          {param:'occupation', example:allOccupations[0]||'merchant', desc:'Filter by occupation (substring match)'},
          {param:'q',          example:'guard',               desc:'Search name/key text'},
          {param:'act',        example:'1',                   desc:'NPCs whose node is in this act'},
          {param:'ids',        example:'true',                desc:'Return only array of key strings'},
        ],
        _occupationSample: allOccupations.slice(0,10),
        _examples: [`?node=${allNodeIds[0]||'LHR'}`, `?occupation=${allOccupations[0]||'merchant'}`, `?q=guard`, `?ids=true`],
      };

      logRow('total', `${out.length} NPCs`);
      logResponse(method, url.pathname, 200, `${out.length} npcs`);
      return json(res, 200, hintBlock ? [hintBlock, ...out] : out);
    }

    if (type === 'terrain') {
      let out = Object.entries(WBAPI.worldDb).map(([k,v]) => ({
        key: k, label: v.label || k, icon: v.icon || '',
        monsterCount: (WBAPI._terrainToMonsters[k]||[]).length,
        nodeCount: Object.values(WBAPI.nodeMap).filter(n=>n.name===k).length,
        monsters: (WBAPI._terrainToMonsters[k]||[]).slice(0,5),
      }));
      if (q) out = out.filter(t => t.key.toLowerCase().includes(q.toLowerCase()) || t.label.toLowerCase().includes(q.toLowerCase()));

      if (idsOnly) return json(res,200,{ count:out.length, ids: out.map(t=>t.key) });

      const noMonsters = out.filter(t=>t.monsterCount===0).length;
      const noNodes    = out.filter(t=>t.nodeCount===0).length;

      const hintBlock = filters.length ? null : {
        _hint: `Returning all ${out.length} terrain types. Add filters to narrow results:`,
        _filters: [
          {param:'q',    example:'forest', desc:'Search key/label text'},
          {param:'ids',  example:'true',   desc:'Return only array of key strings'},
        ],
        _allKeys: out.map(t=>t.key),
        _examples: [`?q=forest`, `?ids=true`],
        _stats: { withMonsters: out.length-noMonsters, withoutMonsters: noMonsters, usedByNodes: out.length-noNodes, unusedByNodes: noNodes },
      };

      logRow('total', `${out.length} terrains`);
      logResponse(method, url.pathname, 200, `${out.length} terrains`);
      return json(res, 200, hintBlock ? [hintBlock, ...out] : out);
    }

    // Unknown type — helpful verbose error showing what IS available
    const availableTypes = ['node','quest','monster','npc','terrain','ids'];
    logResponse(method, url.pathname, 404, `unknown list type: ${type}`);
    return json(res, 404, {
      error: `Unknown list type: "${type}". Available types:`,
      available: availableTypes,
      routes: availableTypes.map(t => `/api/list/${t}`),
      hint: `For just IDs: /api/list/ids/{type}`,
      allNodeIds: WBAPI.nodes.all().map(n=>n.id),
      allTerrainKeys: Object.keys(WBAPI.worldDb),
      allQuestTypes: [...new Set(WBAPI.quests.all().map(q=>q.type).filter(Boolean))],
    });
  }

  // ── Single entity ─────────────────────────────────────────────────────────
  const [type, rawId, action] = parts;

  // ── GET /api/export/:collection ───────────────────────────────────────────
  if (type === 'export' && rawId && method === 'GET') {
    const fmt = url.searchParams.get('format') || 'json';
    const col = rawId;
    const exportMap = {
      node_map:        () => WBAPI.nodeMap,
      quest_db:        () => WBAPI.questDb,
      monster_pool:    () => WBAPI.monsterPool,
      world_db:        () => WBAPI.worldDb,
      fish_pool:       () => ({ day: WBAPI.fishPool, night: WBAPI.nightFishPool }),
      lake_magic:      () => WBAPI.lakeMagicDb,
      monster_drops:   () => WBAPI.monsterDrops || {},
      condition_items: () => WBAPI.conditionItems || {},
      all:             () => ({
        NODE_MAP: WBAPI.nodeMap, QUEST_DB: WBAPI.questDb,
        MONSTER_POOL: WBAPI.monsterPool, WORLD_DB: WBAPI.worldDb,
        FISH_POOL: WBAPI.fishPool, NIGHT_FISH_POOL: WBAPI.nightFishPool,
        LAKE_MAGIC_DB: WBAPI.lakeMagicDb,
      }),
    };
    const getter = exportMap[col];
    if (!getter) {
      const valid = Object.keys(exportMap).join(', ');
      logResponse(method, url.pathname, 404, `unknown collection "${col}"`);
      return json(res, 404, { error:`Unknown collection "${col}". Valid: ${valid}` });
    }
    const data = getter();
    const count = Array.isArray(data) ? data.length : typeof data==='object' ? Object.keys(data).length : 1;
    const rawBytes = JSON.stringify(data).length;
    const kb = (rawBytes / 1024).toFixed(1);
    logRow('collection', `${col}  ·  format: ${fmt}`);
    logRow('size', `${count} records  ·  ~${kb} KB`);
    if (fmt === 'json') {
      logResponse(method, url.pathname, 200, `${col}  ${count} records  ${kb} KB`);
      return json(res, 200, { collection: col, format: 'json', data });
    }
    if (fmt === 'js' || fmt === 'module') {
      const constName = col.replace(/_([a-z])/g, (_,c)=>c.toUpperCase()).replace(/^./, c=>c.toUpperCase());
      const body = JSON.stringify(data, null, 2);
      const src = fmt === 'module'
        ? `// Auto-exported from wbapi-server — ${new Date().toISOString()}\nmodule.exports = ${body};\n`
        : `const ${constName} = ${body};\n`;
      res.writeHead(200, { 'Content-Type':'application/javascript', 'Access-Control-Allow-Origin':'*' });
      res.end(src);
      logResponse(method, url.pathname, 200, `${col}  ${count} records  ${kb} KB  (${fmt})`);
      return;
    }
    logResponse(method, url.pathname, 400, `unknown format "${fmt}"`);
    return json(res, 400, { error:`Unknown format "${fmt}". Valid: json, js, module` });
  }

  // ── POST /api/import/book — bulk import nodes + quest cycles ─────────────
  // Accepts: { book, nodes:[{code,name,label,act,r?,c?,desc?,...}],
  //            cycles:[{num,title,acts:[{id,title,activateNode,desc,passText,failText,
  //                                      checkStat?,checkDC?,checkPassFlag?,activateCond?,
  //                                      questComplete?,monster?,monsterHP?,monsterAC?}]}] }
  // No per-entity nonces required — the import request is its own authorization.
  // Idempotent: existing nodes/quests are silently skipped.
  // One save at the end.
  if (type === 'import' && rawId === 'book' && method === 'POST') {
    let body;
    try { body = await readBody(req); } catch(e) {
      return json(res, 400, { error:'Invalid JSON' });
    }
    const { book, nodes = [], cycles = [], npcs = [] } = body;
    if (!book) return json(res, 400, { error:'Missing required field: book' });

    const results = {
      book,
      nodesCreated: [], nodesSkipped: [],
      questsCreated: [], questsSkipped: [],
      npcsCreated: [], npcsSkipped: [],
      errors: [],
    };

    // 1. Nodes
    for (const nodeBody of nodes) {
      const code = nodeBody.code;
      if (!code) { results.errors.push({ type:'node', error:'missing code' }); continue; }
      if (WBAPI.nodeMap[code]) { results.nodesSkipped.push(code); continue; }
      const missing = ['name','label'].filter(f => !nodeBody[f]);
      if (nodeBody.act === undefined) missing.push('act');
      if (missing.length) { results.errors.push({ type:'node', code, error:`missing: ${missing.join(', ')}` }); continue; }
      const entry = serializeNodeLiteral(code, nodeBody);
      const ins   = insertBeforeSectionClose('NODE_MAP', entry);
      if (!ins.ok) { results.errors.push({ type:'node', code, error: ins.error }); continue; }
      const maxNum = Object.values(WBAPI.nodeMap).reduce((m, n) => Math.max(m, n.num || 0), 0);
      const { code:_c, r:_r, c:_col, ...nodeFields } = nodeBody;
      WBAPI.nodeMap[code] = { ...nodeFields, num: maxNum + 1 };
      if (nodeBody.r !== undefined && nodeBody.c !== undefined) {
        const r = Number(nodeBody.r), c = Number(nodeBody.c);
        const START = '// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆';
        const END   = '// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
        const sIdx  = WBAPI._rawSrc.indexOf(START) + START.length;
        const eIdx  = WBAPI._rawSrc.indexOf(END);
        let section = WBAPI._rawSrc.slice(sIdx, eIdx);
        const closeIdx = section.lastIndexOf('\n};');
        section = section.slice(0, closeIdx + 1) + `  ${code}:{r:${r},c:${c}},\n` + section.slice(closeIdx + 1);
        WBAPI._rawSrc = WBAPI._rawSrc.slice(0, sIdx) + section + WBAPI._rawSrc.slice(eIdx);
        WBAPI.nodeCoords[code] = { r, c };
      }
      results.nodesCreated.push(code);
    }
    WBAPI._buildIndexes();

    // 2. Quests from all cycles
    for (const cycle of cycles) {
      for (const act of (cycle.acts || [])) {
        const id = act.id;
        if (!id) { results.errors.push({ type:'quest', error:'missing id', cycle: cycle.num }); continue; }
        if (WBAPI.questDb[id]) { results.questsSkipped.push(id); continue; }
        const missing = ['title','activateNode','desc','passText','failText'].filter(f => !act[f]);
        if (missing.length) { results.errors.push({ type:'quest', id, error:`missing: ${missing.join(', ')}` }); continue; }
        const questBody = {
          id,
          type: (act.monster && !act.checkStat) ? 'combat' : 'skill_check',
          title:        act.title,
          desc:         act.desc,
          passText:     act.passText,
          failText:     act.failText,
          activateNode: act.activateNode,
          checkStat:    act.checkStat  || null,
          checkDC:      act.checkDC    || 0,
          ...(act.npc           && { npc:           act.npc           }),
          ...(act.checkPassFlag && { checkPassFlag: act.checkPassFlag }),
          ...(act.activateCond  && { activateCond:  act.activateCond  }),
          ...(act.questComplete && { questComplete: true }),
          ...(act.monster       && { monster:       act.monster       }),
          ...(act.monsterHP     && { monsterHP:     act.monsterHP     }),
          ...(act.monsterAC     && { monsterAC:     act.monsterAC     }),
        };
        const entry = serializeQuestLiteral(id, questBody);
        const ins   = insertBeforeSectionClose('QUEST_DB', entry);
        if (!ins.ok) { results.errors.push({ type:'quest', id, error: ins.error }); continue; }
        const FN_FIELDS = ['activateCond','completeFn','onPass','onFail'];
        WBAPI.questDb[id] = Object.fromEntries(Object.entries(questBody).filter(([k]) => !FN_FIELDS.includes(k)));
        results.questsCreated.push(id);
      }
    }
    WBAPI._buildIndexes();

    // 3. NPC dialogue entries (optional — creates NPC_DIALOGUES card for each)
    // Each entry: { key, quote, meta?, impartial?, questActive?, friendly?, dearFriend? }
    for (const npc of npcs) {
      const key = npc.key;
      if (!key) { results.errors.push({ type:'npc', error:'missing key' }); continue; }
      if (WBAPI.npcDialogues[key]) { results.npcsSkipped.push(key); continue; }
      const enriched = {
        meta:       npc.meta       || {},
        impartial:  npc.impartial  || [],
        questActive: npc.questActive || [],
        friendly:   npc.friendly   || [],
        dearFriend: npc.dearFriend || [],
        quote:      npc.quote      || '',
      };
      WBAPI.npcDialogues[key] = enriched;
      const ins = replaceSection('NPC_DIALOGUES', serializeNpcDialoguesSection());
      if (!ins.ok) { results.errors.push({ type:'npc', key, error: ins.error || 'serialize failed' }); WBAPI.npcDialogues[key] = undefined; continue; }
      results.npcsCreated.push(key);
    }

    // 4. Single save
    const saveR = WBAPI.save();
    if (!saveR.ok) return json(res, 500, { ok:false, error:`save failed: ${saveR.error}`, results });
    try { fs.copyFileSync(saveR.path, GAME_FILE); } catch(e) {
      return json(res, 500, { ok:false, error:`overwrite failed: ${e.message}`, results });
    }
    try { WBAPI.load(GAME_FILE); } catch(e) {
      return json(res, 500, { ok:false, error:`reload failed: ${e.message}`, results });
    }

    const total = { nodes: Object.keys(WBAPI.nodeMap).length, quests: Object.keys(WBAPI.questDb).length };
    logResponse(method, url.pathname, 201,
      `${book}: +${results.nodesCreated.length} nodes, +${results.questsCreated.length} quests  (${results.errors.length} errors)`);
    return json(res, 201, { ok: true, ...results, total, saved: saveR.path });
  }

  // ── POST /api/batch/npc — bulk-patch npc field on quests, single save ──────
  // Body: { updates: [{id, npc}, ...] }
  if (type === 'batch' && rawId === 'npc' && method === 'POST') {
    let body;
    try { body = await readBody(req); } catch(e) { return json(res, 400, { error:'Invalid JSON' }); }
    const updates = body.updates || [];
    if (!updates.length) return json(res, 400, { error:'updates array required' });
    const patched = [], skipped = [], errors = [];
    for (const { id, npc } of updates) {
      if (!id || !npc) { errors.push({ id, error:'missing id or npc' }); continue; }
      if (!WBAPI.questDb[id]) { skipped.push(id); continue; }
      WBAPI.questDb[id].npc = npc;
      const r = WBAPI.editField('quest', id, 'npc', npc);
      if (r.ok) patched.push(id);
      else errors.push({ id, error: r.error });
    }
    WBAPI._buildIndexes();
    const saveR = WBAPI.save();
    if (!saveR.ok) return json(res, 500, { ok:false, error:`save failed: ${saveR.error}` });
    try { fs.copyFileSync(saveR.path, GAME_FILE); } catch(e) {
      return json(res, 500, { ok:false, error:`overwrite failed: ${e.message}` });
    }
    try { WBAPI.load(GAME_FILE); } catch(e) {
      return json(res, 500, { ok:false, error:`reload failed: ${e.message}` });
    }
    logResponse(method, url.pathname, 200,
      `batch/npc: ${patched.length} patched  ${skipped.length} skipped  ${errors.length} errors`);
    return json(res, 200, { ok:true, patched: patched.length, skipped: skipped.length, errors, saved: saveR.path });
  }

  // ── POST /api/{quest|node|terrain|monster} (create new entity) ────────────
  if (!rawId && method === 'POST' && (type === 'quest' || type === 'node' || type === 'terrain' || type === 'monster' || type === 'npc')) {
    let body;
    try { body = await readBody(req); } catch(e) {
      return json(res, 400, { error:'Invalid JSON' });
    }
    if (type === 'quest') {
      const { id } = body;
      // Hard required fields
      const hardMissing = ['id','type','title','activateNode'].filter(f => !body[f]);
      if (hardMissing.length) {
        logResponse(method, url.pathname, 400, `missing required fields: ${hardMissing.join(', ')}`);
        return json(res, 400, { ok:false, error:'Missing required fields', missing: hardMissing.map(f => ({ field:f, required:true })) });
      }
      // Placeholder activateNode guard
      if (body.activateNode && PLACEHOLDER_NODES.has(body.activateNode.toUpperCase().trim())) {
        const bookCode = (id || '').match(/^([a-z]{2,4})_/)?.[1]?.toUpperCase() || '';
        const mdHint = bookCode ? `Read 1367-sources/${bookCode}-*.md — find the city/location where this act fires.` : 'Read the source book markdown and find the city where this act fires.';
        logResponse(method, url.pathname, 422, `activateNode "${body.activateNode}" is a placeholder`);
        return json(res, 422, {
          ok: false,
          error: `activateNode "${body.activateNode}" is a placeholder, not a valid node code`,
          hint: `Find the real geographic location for this quest act. ${mdHint} Then check GET /api/list/node for the correct node code.`,
          lookups: [`GET http://localhost:${PORT}/api/list/node`, bookCode ? `1367-sources/${bookCode}-*.md — Quest API Stub section` : ''].filter(Boolean),
        });
      }
      // Incomplete data guard — reject with 422 so importer must supply all fields
      const incomplete = [];
      if (!body.desc) incomplete.push({ field:'desc', msg:'Player-facing quest description text shown in quest log. Quest renders blank without it.' });
      if (!body.passText) incomplete.push({ field:'passText', msg:'Text shown to player on quest success / TOKEN received.' });
      if (!body.failText) incomplete.push({ field:'failText', msg:'Text shown to player on quest failure or retry gate.' });
      if (incomplete.length) {
        logResponse(method, url.pathname, 422, `incomplete quest: missing ${incomplete.map(f=>f.field).join(', ')}`);
        return json(res, 422, {
          ok: false,
          error: 'Quest data incomplete — submission rejected to prevent audit warnings',
          incomplete,
          hint: 'Supply all missing fields and resubmit. See GET /api/schema/quest for field descriptions.',
        });
      }
      if (WBAPI.questDb[id]) {
        logResponse(method, url.pathname, 409, `quest "${id}" already exists`);
        return json(res, 409, { error:`Quest "${id}" already exists` });
      }
      const entry = serializeQuestLiteral(id, body);
      const ins = insertBeforeSectionClose('QUEST_DB', entry);
      if (!ins.ok) { logResponse(method, url.pathname, 500, ins.error); return json(res, 500, ins); }
      const FN_FIELDS = ['activateCond','completeFn','onPass','onFail'];
      WBAPI.questDb[id] = Object.fromEntries(Object.entries(body).filter(([k]) => !FN_FIELDS.includes(k)));
      WBAPI._buildIndexes();
      const hasFns = FN_FIELDS.some(f => body[f] !== undefined);
      logRow('id', id);
      logRow('title', `${body.title}  ·  type: ${body.type}  ·  node: ${body.activateNode}`);
      if (hasFns) logRow('note', 'function fields written to source');
      logResponse(method, url.pathname, 201, `created quest/${id}`);
      return saveAndRestart(res, 201, { ok:true, id, ...questConnections(id) });
    }

    if (type === 'node') {
      const code = body.code;
      if (!code || !body.name || !body.label || body.act === undefined) {
        logResponse(method, url.pathname, 400, 'missing required fields');
        return json(res, 400, { error:'Required fields: code, name, label, act' });
      }
      if (WBAPI.nodeMap[code]) {
        logResponse(method, url.pathname, 409, `node "${code}" already exists`);
        return json(res, 409, { error:`Node "${code}" already exists` });
      }
      const entry = serializeNodeLiteral(code, body);
      const ins = insertAfterLastParsedNode(entry);
      if (!ins.ok) { logResponse(method, url.pathname, 500, ins.error); return json(res, 500, ins); }
      const maxNum = Object.values(WBAPI.nodeMap).reduce((m, n) => Math.max(m, n.num || 0), 0);
      const { code: _code, r: _r, c: _c, ...nodeFields } = body;
      WBAPI.nodeMap[code] = { ...nodeFields, num: body.num !== undefined ? Number(body.num) : maxNum + 1 };
      // If r,c provided, also insert into NODE_COORDS
      let coordNote = '';
      if (body.r !== undefined && body.c !== undefined) {
        const r = Number(body.r), c = Number(body.c);
        const collision = Object.entries(WBAPI.nodeCoords).find(([cd, p]) => p.r===r && p.c===c);
        if (collision) {
          coordNote = ` — coords r:${r},c:${c} conflict with ${collision[0]}; not written`;
        } else {
          WBAPI.nodeCoords[code] = { r, c };
          const START = '// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆';
          const END   = '// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
          const sIdx  = WBAPI._rawSrc.indexOf(START) + START.length;
          const eIdx  = WBAPI._rawSrc.indexOf(END);
          let section = WBAPI._rawSrc.slice(sIdx, eIdx);
          const closeIdx = section.lastIndexOf('\n};');
          section = section.slice(0, closeIdx + 1) + `  ${code}:{r:${r},c:${c}},\n` + section.slice(closeIdx + 1);
          WBAPI._rawSrc = WBAPI._rawSrc.slice(0, sIdx) + section + WBAPI._rawSrc.slice(eIdx);
          coordNote = `  coords: r:${r},c:${c}`;
        }
      } else {
        coordNote = ' — no r,c provided; add coords via PUT /api/coords/{code}';
      }
      WBAPI._buildIndexes();
      logRow('code', code);
      logRow('label', `${body.label}  ·  Act ${body.act}  ·  terrain: ${body.name||'—'}${coordNote}`);
      logTrace('node create', `code=${code} terrain=${body.name} label="${(body.label||'').slice(0,40)}" act=${body.act} coords=${coordNote.trim()} connections=${['N','E','S','W'].filter(d=>body[d]).map(d=>d+'='+body[d]).join(' ')}`);
      logResponse(method, url.pathname, 201, `created node/${code}`);
      return saveAndRestart(res, 201, { ok:true, code, coords: WBAPI.nodeCoords[code] || null, ...nodeConnections(code) });
    }

    if (type === 'terrain') {
      const key = body.key;
      if (!key) {
        logResponse(method, url.pathname, 400, 'terrain create: missing body.key');
        return json(res, 400, { error:'Required fields: key, label, monsters (array of monster keys)' });
      }
      if (WBAPI.worldDb[key]) {
        logResponse(method, url.pathname, 409, `terrain "${key}" already exists`);
        return json(res, 409, { error:`Terrain "${key}" already exists` });
      }
      const monsterKeys = Array.isArray(body.monsters) ? body.monsters : [];
      const badKeys = monsterKeys.filter(mk => !WBAPI.monsterPool[mk]);
      if (badKeys.length) {
        logResponse(method, url.pathname, 400, `unknown monster keys: ${badKeys.join(', ')}`);
        return json(res, 400, { error:`Monster keys not in MONSTER_POOL: ${badKeys.join(', ')}` });
      }
      const entry = serializeTerrainLiteral(key, body);
      const ins = insertBeforeSectionClose('WORLD_DB', entry);
      if (!ins.ok) { logResponse(method, url.pathname, 500, ins.error); return json(res, 500, ins); }
      WBAPI.worldDb[key] = { label: body.label || key, icon: body.icon || '', monsters: monsterKeys };
      WBAPI._buildIndexes();
      logRow('key', `${key}  ·  ${body.icon||''}  ${body.label||key}`);
      logRow('monsters', `${monsterKeys.length}  →  ${sample(monsterKeys, 4)}`);
      logResponse(method, url.pathname, 201, `created terrain/${key}`);
      return saveAndRestart(res, 201, { ok:true, key, entity: WBAPI.worldDb[key], connections: { monsters: monsterKeys } });
    }

    if (type === 'monster') {
      const key = body.key;
      if (!key || !body.name) {
        logResponse(method, url.pathname, 400, 'missing key or name');
        return json(res, 400, { error:'Required fields: key, name. Optional: ac, hp, atk, dmg, xp, tier, desc' });
      }
      if (WBAPI.monsterPool[key]) {
        logResponse(method, url.pathname, 409, `monster "${key}" already exists`);
        return json(res, 409, { error:`Monster "${key}" already exists` });
      }
      const entry = serializeMonsterLiteral(key, body);
      const ins = insertBeforeSectionClose('MONSTER_POOL', entry);
      if (!ins.ok) { logResponse(method, url.pathname, 500, ins.error); return json(res, 500, ins); }
      const { key: _k, ...mFields } = body;
      WBAPI.monsterPool[key] = mFields;
      WBAPI._buildIndexes();
      logRow('key', key);
      logRow('stats', `${body.name}  ·  AC ${body.ac||'?'}  HP ${body.hp||'?'}  ATK +${body.atk||'?'}  tier: ${body.tier||'?'}`);
      logResponse(method, url.pathname, 201, `created monster/${key}`);
      return saveAndRestart(res, 201, { ok:true, key, entity: WBAPI.monsterPool[key] });
    }

    if (type === 'npc') {
      const key = body.key;
      if (!key || !body.name || !body.node) {
        logResponse(method, url.pathname, 400, 'npc create: missing required fields');
        return json(res, 400, { error:'Required fields: key, name, node. Optional: occupation, neutral{greeting,dialogue}, friendly{greeting,dialogue,special}, dearFriend{greeting,dialogue}' });
      }
      if (!/^[a-z_][a-z0-9_]*$/.test(key)) {
        logResponse(method, url.pathname, 400, `npc key "${key}" invalid`);
        return json(res, 400, { error:'key must be snake_case (a-z, 0-9, underscore, no leading digit)' });
      }
      if (WBAPI.birkaNpcs[key]) {
        logResponse(method, url.pathname, 409, `npc "${key}" already exists`);
        return json(res, 409, { error:`NPC "${key}" already exists` });
      }
      if (!WBAPI.nodeMap[body.node]) {
        logResponse(method, url.pathname, 400, `node "${body.node}" not in NODE_MAP`);
        return json(res, 400, { error:`node "${body.node}" not found in NODE_MAP` });
      }
      const entry = serializeNpcLiteral(key, body);
      const ins = insertBeforeSectionClose('BIRKA_NPC', entry);
      if (!ins.ok) { logResponse(method, url.pathname, 500, ins.error); return json(res, 500, ins); }
      const { key: _k, ...npcFields } = body;
      WBAPI.birkaNpcs[key] = npcFields;
      WBAPI._buildIndexes();
      logRow('key', key);
      logRow('npc', `${body.name}  ·  ${body.occupation||'—'}  ·  node: ${body.node}`);
      logResponse(method, url.pathname, 201, `created npc/${key}`);
      return saveAndRestart(res, 201, { ok:true, key, ...npcConnections(key) });
    }
  }

  // ── GET /api/quest?{node|arc|type}= (shorthand filter) ────────────────────
  if (type === 'quest' && !rawId && method === 'GET') {
    const nodeFilter = url.searchParams.get('node');
    const arcFilter  = url.searchParams.get('arc');
    const typeFilter = url.searchParams.get('type');
    if (nodeFilter || arcFilter || typeFilter) {
      let list = WBAPI.quests.all();
      if (nodeFilter) list = list.filter(q => q.activateNode===nodeFilter || q.waypointNode===nodeFilter);
      if (typeFilter) list = list.filter(q => q.type === typeFilter);
      if (arcFilter)  list = list.filter(q => q.id.startsWith(arcFilter));
      const out = list.map(q => ({
        id:q.id, title:q.title, type:q.type,
        activateNode:q.activateNode, waypointNode:q.waypointNode, npc:q.npc,
        _meta:{ downstream:WBAPI.quests.chain(q.id).downstream.length,
                canDelete:WBAPI.quests.chain(q.id).downstream.length === 0 }
      }));
      const filters2 = [nodeFilter&&`node=${nodeFilter}`, arcFilter&&`arc=${arcFilter}`, typeFilter&&`type=${typeFilter}`].filter(Boolean);
      logRow('filter', filters2.join('  '));
      logRow('matched', `${out.length} of ${WBAPI.quests.all().length}`);
      logRow('sample', sample(out, 4));
      logResponse(method, url.pathname, 200, `${out.length} quests`);
      return json(res, 200, out);
    }
  }

  // ── /api/count[/{subtype}] — must be before the !rawId guard ────────────
  if (type === 'count') {
    const subtype = rawId; // undefined = master count
    const allNodes   = WBAPI.nodes.all();
    const allQuests  = WBAPI.quests.all();
    const allMonsters= WBAPI.monsters.all();
    const allNpcs    = WBAPI.npcs.all().filter(n=>!n._inline);
    const allTerrains= Object.keys(WBAPI.worldDb);
    const allCoords  = WBAPI.nodeCoords;
    const countBy = (arr, key) => {
      const out = {};
      arr.forEach(x => { const v = x[key]; if(v!==undefined&&v!==null) out[v]=(out[v]||0)+1; });
      return Object.fromEntries(Object.entries(out).sort((a,b)=>b[1]-a[1]));
    };

    if (!subtype) {
      const nodesByAct = countBy(allNodes.map(n=>({act:n.act})),'act');
      const questsByType = countBy(allQuests.map(q=>({type:q.type})),'type');
      const monsByTier = countBy(allMonsters.map(m=>({tier:m.tier})),'tier');
      const nodesWithCoords  = allNodes.filter(n=>allCoords[n.id]).length;
      const nodesWithQuests  = allNodes.filter(n=>(WBAPI._questsByNode[n.id]||[]).length>0).length;
      const junctions        = allNodes.filter(n=>n.junction||n.id.match(/^J\d+$/)).length;
      return json(res, 200, {
        _hint:'Master counts. Drill into: GET /api/count/nodes | /quests | /monsters | /npcs | /terrains | /coords',
        totals:{ nodes:allNodes.length, quests:allQuests.length, monsters:allMonsters.length,
                 npcs:allNpcs.length, terrains:allTerrains.length,
                 fish:(WBAPI.fishPool?.length||0)+(WBAPI.nightFishPool?.length||0),
                 lakeMagic:Object.keys(WBAPI.lakeMagicDb||{}).length, coords:Object.keys(allCoords).length },
        nodes:{ total:allNodes.length, withCoords:nodesWithCoords, withoutCoords:allNodes.length-nodesWithCoords,
                withQuests:nodesWithQuests, junctions, content:allNodes.length-junctions, byAct:nodesByAct },
        quests:{ total:allQuests.length, byType:questsByType,
                 withNpc:allQuests.filter(q=>q.npc).length, withComplete:allQuests.filter(q=>q.questComplete).length },
        monsters:{ total:allMonsters.length, byTier:monsByTier,
                   withDrops:Object.keys(WBAPI.monsterDrops||{}).length },
        npcs:{ total:allNpcs.length },
        terrains:{ total:allTerrains.length },
        routes:['nodes','quests','monsters','npcs','terrains','coords'].map(t=>`/api/count/${t}`),
      });
    }
    if (subtype==='nodes'||subtype==='node') {
      const byAct=countBy(allNodes.map(n=>({act:n.act})),'act');
      const byTerrain=countBy(allNodes.map(n=>({terrain:n.name})),'terrain');
      const wc=allNodes.filter(n=>allCoords[n.id]).length;
      const noCoords=allNodes.filter(n=>!allCoords[n.id]).map(n=>n.id);
      return json(res,200,{ type:'nodes',total:allNodes.length, byAct, byTerrain,
        withCoords:wc, withoutCoords:allNodes.length-wc,
        withQuests:allNodes.filter(n=>(WBAPI._questsByNode[n.id]||[]).length>0).length,
        withNpcs:allNodes.filter(n=>WBAPI.npcs.byNode(n.id).length>0).length,
        junctions:allNodes.filter(n=>n.junction||n.id.match(/^J\d+$/)).length,
        content:allNodes.filter(n=>!n.junction&&!n.id.match(/^J\d+$/)).length,
        nodesWithoutCoords:noCoords, filters:'GET /api/list/node?act=1&terrain=city&no_coords=true&ids=true' });
    }
    if (subtype==='quests'||subtype==='quest') {
      const byType=countBy(allQuests.map(q=>({type:q.type})),'type');
      const byArc={};
      allQuests.forEach(q=>{const arc=q.id.replace(/_act\d+$/,'').replace(/_\d+$/,'');byArc[arc]=(byArc[arc]||0)+1;});
      const topArcs=Object.fromEntries(Object.entries(byArc).sort((a,b)=>b[1]-a[1]).slice(0,20));
      const byNode=countBy(allQuests.map(q=>({node:q.activateNode})),'node');
      return json(res,200,{ type:'quests',total:allQuests.length, byType, topArcs,
        topNodes:Object.fromEntries(Object.entries(byNode).sort((a,b)=>b[1]-a[1]).slice(0,20)),
        withNpc:allQuests.filter(q=>q.npc).length, withoutNpc:allQuests.filter(q=>!q.npc).length,
        withComplete:allQuests.filter(q=>q.questComplete).length, withPassFlag:allQuests.filter(q=>q.checkPassFlag).length,
        filters:'GET /api/list/quest?type=combat&node=BK&arc=shk&has_npc=true&complete=true&ids=true' });
    }
    if (subtype==='monsters'||subtype==='monster') {
      const byTier=countBy(allMonsters.map(m=>({tier:m.tier})),'tier');
      const withDrops=Object.keys(WBAPI.monsterDrops||{}).length;
      const byTerrain={};
      allMonsters.forEach(m=>m.terrains.forEach(t=>{byTerrain[t]=(byTerrain[t]||0)+1;}));
      return json(res,200,{ type:'monsters',total:allMonsters.length, byTier, withDrops, withoutDrops:allMonsters.length-withDrops,
        withNoTerrain:allMonsters.filter(m=>m.terrains.length===0).length,
        topTerrains:Object.fromEntries(Object.entries(byTerrain).sort((a,b)=>b[1]-a[1]).slice(0,15)),
        filters:'GET /api/list/monster?tier=easy&terrain=forest&has_drop=true&ids=true' });
    }
    if (subtype==='npcs'||subtype==='npc') {
      const byNode=countBy(allNpcs.map(n=>({node:n.node})),'node');
      return json(res,200,{ type:'npcs',total:allNpcs.length,
        withQuests:allNpcs.filter(n=>(WBAPI._deps.npc(n.key)?.quests?.length||0)>0).length,
        topNodes:Object.fromEntries(Object.entries(byNode).sort((a,b)=>b[1]-a[1]).slice(0,10)),
        filters:'GET /api/list/npc?node=BK&occupation=merchant&q=guard&ids=true' });
    }
    if (subtype==='terrains'||subtype==='terrain') {
      const withMon=allTerrains.filter(t=>(WBAPI._terrainToMonsters[t]||[]).length>0).length;
      const withNodes=allTerrains.filter(t=>Object.values(WBAPI.nodeMap).some(n=>n.name===t)).length;
      return json(res,200,{ type:'terrains',total:allTerrains.length,
        withMonsters:withMon, withoutMonsters:allTerrains.length-withMon,
        usedByNodes:withNodes, unusedByNodes:allTerrains.length-withNodes,
        allKeys:allTerrains, filters:'GET /api/list/terrain?q=city&ids=true' });
    }
    if (subtype==='coords') {
      const total=Object.keys(allCoords).length;
      const inMap=allNodes.filter(n=>allCoords[n.id]).length;
      const orphan=Object.keys(allCoords).filter(k=>!WBAPI.nodeMap[k]).length;
      const noCoords=allNodes.filter(n=>!allCoords[n.id]).map(n=>n.id);
      return json(res,200,{ type:'coords',total, inNodeMap:inMap, orphanCoords:orphan,
        nodesWithoutCoords:allNodes.length-inMap, nodesWithoutCoordsList:noCoords.slice(0,50),
        note:noCoords.length>50?`...and ${noCoords.length-50} more`:'all nodes have coords',
        filters:'GET /api/coords | GET /api/list/node?no_coords=true' });
    }
    return json(res,404,{ error:`Unknown count sub-type: "${subtype}"`,
      available:['nodes','quests','monsters','npcs','terrains','coords'],
      routes:['nodes','quests','monsters','npcs','terrains','coords'].map(t=>`/api/count/${t}`),
      masterCount:'/api/count' });
  }

  // location can work without rawId (lists all locations), count is already handled above
  if (!type || (!rawId && type !== 'location')) {
    logResponse(method, url.pathname, 400, 'missing type/id');
    return json(res, 400, { error: 'Path: /api/{type}/{id}', hint:'GET /api/list for all entity types and counts', routeIndex:'/api/list' });
  }

  // ── Location (composite) ──
  if (type === 'location') {
    // /api/location — list all locations with counts (no id needed)
    if (!rawId || rawId === 'list') {
      const allLocs = WBAPI.nodes.all().map(n => {
        const q  = (WBAPI._questsByNode[n.id]||[]).length;
        const np = WBAPI.npcs.byNode(n.id).length;
        const mn = (WBAPI._nodeToMonsters?.[n.id] || (WBAPI._terrainToMonsters[n.name]||[])).length;
        return { code:n.id, label:n.label, terrain:n.name, act:n.act,
                 counts:{ quests:q, npcs:np, monsters:mn },
                 hasCoords:!!WBAPI.nodeCoords[n.id] };
      });
      const actQ = url.searchParams.get('act');
      const terrainQ = url.searchParams.get('terrain');
      const q = url.searchParams.get('q');
      const hasQuestsQ = url.searchParams.get('has_quests');
      let filtered = allLocs;
      if (actQ) filtered = filtered.filter(l=>String(l.act)===String(actQ));
      if (terrainQ) filtered = filtered.filter(l=>l.terrain===terrainQ);
      if (q) filtered = filtered.filter(l=>(l.label||'').toLowerCase().includes(q.toLowerCase())||l.code.toLowerCase().includes(q.toLowerCase()));
      if (hasQuestsQ==='true') filtered = filtered.filter(l=>l.counts.quests>0);
      if (hasQuestsQ==='false') filtered = filtered.filter(l=>l.counts.quests===0);
      const idsOnly = url.searchParams.get('ids')==='true';
      if (idsOnly) return json(res, 200, { count:filtered.length, ids:filtered.map(l=>l.code) });

      const hint = (!actQ&&!terrainQ&&!q&&!hasQuestsQ) ? {
        _hint:`Listing all ${allLocs.length} locations. Filter with: ?act=1 ?terrain=city ?q=birka ?has_quests=true ?ids=true`,
        _filters:[
          {param:'act',        example:'1',      desc:'Act number'},
          {param:'terrain',    example:'city',   desc:'Terrain key'},
          {param:'q',          example:'birka',  desc:'Label/code search'},
          {param:'has_quests', example:'true',   desc:'Only locations with quests'},
          {param:'ids',        example:'true',   desc:'IDs only'},
        ],
      } : null;
      const out = hint ? [hint, ...filtered] : filtered;
      logResponse(method, url.pathname, 200, `${filtered.length} locations`);
      return json(res, 200, out);
    }

    const prof = WBAPI.location.profile(rawId);
    if (prof) {
      const node = WBAPI.nodeMap[rawId] || {};
      const coords = WBAPI.nodeCoords[rawId] || null;
      const links = ['N','E','S','W'].reduce((acc,d) => { if(node[d]) acc[d]=node[d]; return acc; }, {});
      const linkedNodes = Object.entries(links).map(([d,code])=>({
        dir:d, code, label:WBAPI.nodeMap[code]?.label||code, terrain:WBAPI.nodeMap[code]?.name||null,
        coords: WBAPI.nodeCoords[code]||null
      }));
      const out = {
        ...prof,
        coords,
        links: linkedNodes,
        counts: { monsters:prof.monsters?.length||0, quests:prof.quests.length, waypointQuests:prof.waypointQuests.length, npcs:prof.npcs.length, linkedNodes:linkedNodes.length },
        _detail: `Full entity: GET /api/node/${rawId}`,
        _nearby: `Nearby coords: GET /api/coords/near/${rawId}?radius=8`,
        _validate: `Walkability: GET /api/graph/validate/${rawId}`,
      };
      logRow('location', `${rawId}  ·  ${node.label||rawId}  ·  Act ${node.act||'?'}`);
      logRow('connections', `${out.counts.monsters} monsters  ·  ${out.counts.quests} quests  ·  ${out.counts.npcs} NPCs  ·  ${out.counts.linkedNodes} links`);
      logResponse(method, url.pathname, 200, `location/${rawId}`);
      return json(res, 200, out);
    }
    // Verbose 404 — list what's available
    const allIds = WBAPI.nodes.all().map(n=>n.id);
    logResponse(method, url.pathname, 404, `location "${rawId}" not found`);
    return json(res, 404, { error:`Location "${rawId}" not found`, hint:'GET /api/location lists all locations', allNodeCodes:allIds, count:allIds.length });
  }

  // ── Terrain (WORLD_DB) ──
  if (type === 'terrain') {
    const tk = resolveId('terrain', rawId) || rawId;
    const t  = WBAPI.worldDb[tk];
    if (!t) {
      logResponse(method, url.pathname, 404, `terrain "${rawId}" not found`);
      return json(res, 404, { error: `Terrain "${rawId}" not found` });
    }

    if (method === 'GET') {
      const monsterList = (WBAPI._terrainToMonsters[tk]||[]).map(mk => ({
        key: mk, name: WBAPI.monsterPool[mk]?.name||mk, tier: WBAPI.monsterPool[mk]?.tier||'?'
      }));
      const nodes = Object.entries(WBAPI.nodeMap)
        .filter(([,n])=>n.name===tk)
        .map(([code,n])=>({ code, label:n.label, act:n.act }));
      logRow('terrain', `${t.icon||''}  ${t.label||tk}`);
      logRow('monsters', `${monsterList.length}  →  ${sample(monsterList.map(m=>m.name), 4)}`);
      logRow('nodes', nodes.length ? sample(nodes.map(n=>n.code), 6) : '(none)');
      logResponse(method, url.pathname, 200, `terrain/${tk}  ·  ${monsterList.length} monsters  ·  ${nodes.length} nodes`);
      return json(res, 200, {
        entity: { ...t, key:tk },
        connections: { monsters: monsterList, nodes },
        _meta: { canDelete: nodes.length === 0, blockedBy: nodes.length ? { nodes } : null },
      });
    }

    if (method === 'PUT') {
      let body;
      try { body = await readBody(req); } catch(e) {
        return json(res, 400, { error:'Invalid JSON' });
      }
      const allowed = ['label','icon'];
      const results = [];
      for (const [field, value] of Object.entries(body)) {
        if (!allowed.includes(field)) {
          results.push({ field, ok:false, error:`Field "${field}" not directly editable. Editable: ${allowed.join(', ')}` });
          continue;
        }
        if (typeof value === 'string') {
          WBAPI.worldDb[tk][field] = value;
          results.push({ field, ok:true });
        } else {
          results.push({ field, ok:false, error:'Terrain fields must be strings' });
        }
      }
      const allOk = results.every(r=>r.ok);
      logRow('target', `terrain › ${tk}`);
      results.forEach(r => logRow(r.field, r.ok ? `${C.green}✓${C.reset}` : `${C.red}✗ ${r.error}${C.reset}`));
      logResponse(method, url.pathname, allOk ? 200 : 207, `terrain/${tk} updated`);
      return json(res, allOk ? 200 : 207, {
        ok: allOk, fields: results,
        entity: { ...WBAPI.worldDb[tk], key:tk },
      });
    }
  }

  if (!CONNECT[type]) {
    logResponse(method, url.pathname, 400, `Unknown type "${type}"`);
    return json(res, 400, { error: `Unknown type "${type}". Use: node quest monster npc terrain location fish lake-magic count`, availableTypes: ['node','quest','monster','npc','terrain','location','fish','lake-magic','count'], routeIndex: '/api/list' });
  }

  const key = resolveId(type, rawId);

  // ── GET ──
  if (method === 'GET') {

    // GET /api/npc/{id}/speak?prompt=...&state=neutral|friendly|dearFriend
    // Claude SDK — prompt caching on system block, one call per greeting.
    // Falls back to seed replay if ANTHROPIC_API_KEY not set.
    if (type === 'npc' && action === 'speak') {
      const npc = WBAPI.birkaNpcs[key];
      if (!npc) {
        logResponse(method, url.pathname, 404, `npc "${key}" not found`);
        return json(res, 404, { error: `NPC "${key}" not found` });
      }

      const prompt    = url.searchParams.get('prompt') || 'Good afternoon.';
      const state     = url.searchParams.get('state')  || 'neutral';
      const model     = url.searchParams.get('model')  || 'claude-haiku-4-5-20251001';
      const stateData = npc[state] || npc.neutral;

      if (!stateData) {
        logResponse(method, url.pathname, 400, `npc "${key}" has no state data`);
        return json(res, 400, { error: `NPC "${key}" has no state data. Available: ${Object.keys(npc).filter(k => typeof npc[k] === 'object').join(', ')}` });
      }

      const AI_KEY = process.env.ANTHROPIC_API_KEY;

      // ── Stub fallback (no key) ──────────────────────────────────────────────
      if (!AI_KEY) {
        const reply = [stateData.greeting, stateData.dialogue].filter(Boolean).join(' ');
        logResponse(method, url.pathname, 200, `${npc.name} — seed fallback (no API key)`);
        return json(res, 200, {
          npc: key, name: npc.name, state, reply,
          status: 'SEED FALLBACK — set ANTHROPIC_API_KEY in .env for live Claude responses',
          seed: { greeting: stateData.greeting||null, dialogue: stateData.dialogue||null, special: stateData.special||null },
        });
      }

      // ── Claude voiced response ──────────────────────────────────────────────
      const nodeData   = WBAPI.nodeMap[npc.node] || {};
      const nodeLabel  = nodeData.label || npc.node || 'unknown location';
      const nodeDesc   = nodeData.text  || '';

      const stateLines = ['neutral','friendly','dearFriend']
        .filter(s => npc[s])
        .map(s => {
          const d = npc[s];
          const lines = [];
          if (d.greeting) lines.push(`  ${s} greeting: ${d.greeting}`);
          if (d.dialogue) lines.push(`  ${s} dialogue: ${d.dialogue}`);
          return lines.join('\n');
        }).join('\n');

      const systemText =
        `You are ${npc.name}, ${npc.occupation || 'a character'} at ${nodeLabel}.\n\n` +
        (nodeDesc ? `Location — ${nodeLabel}:\n${nodeDesc}\n\n` : '') +
        `Voice examples across relationship states:\n${stateLines}\n\n` +
        `Current relationship state with this player: ${state}.\n` +
        `Respond in one short paragraph or less. Match the register of the ${state} examples exactly — ` +
        `same rhythm, same level of disclosure, same vocabulary. No stage directions. No asterisks.`;

      logRow('npc',    `${npc.name}  ·  state: ${state}  ·  node: ${nodeLabel}  ·  model: ${model}`);
      logRow('prompt', prompt);

      try {
        const client = new Anthropic({ apiKey: AI_KEY });
        const msg = await client.messages.create({
          model,
          max_tokens: 256,
          system: [{ type: 'text', text: systemText, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: prompt }],
        });

        const reply = msg.content?.[0]?.text || '';
        const usage = msg.usage || {};

        // ── Verbose speak log — every Claude response dated and full ───────
        const ts     = new Date().toISOString().replace('T', ' ').slice(0, 23);
        const divider = '─'.repeat(72);
        const logEntry = [
          `\n${divider}`,
          `[${ts}]  NPC: ${key} (${npc.name})  |  node: ${npc.node} (${nodeLabel})`,
          `         state: ${state}  |  model: ${model}`,
          `SYSTEM PROMPT:\n${systemText}`,
          `PROMPT: ${prompt}`,
          `REPLY:\n${reply}`,
          `TOKENS: input:${usage.input_tokens} output:${usage.output_tokens} cache_read:${usage.cache_read_input_tokens||0} cache_write:${usage.cache_creation_input_tokens||0}`,
          divider,
        ].join('\n');
        fs.appendFileSync(SPEAK_LOG_FILE, logEntry + '\n');

        logRow('reply',  reply.slice(0, 100) + (reply.length > 100 ? '…' : ''));
        logRow('tokens', `in:${usage.input_tokens} out:${usage.output_tokens} cache_read:${usage.cache_read_input_tokens||0} cache_write:${usage.cache_creation_input_tokens||0}`);
        logResponse(method, url.pathname, 200, `${npc.name} spoke  [logged → npc-speak.log]`);
        return json(res, 200, {
          npc: key, name: npc.name, state, prompt, reply, model,
          location: { code: npc.node, label: nodeLabel },
          usage: {
            input:      usage.input_tokens,
            output:     usage.output_tokens,
            cacheRead:  usage.cache_read_input_tokens    || 0,
            cacheWrite: usage.cache_creation_input_tokens || 0,
          },
        });
      } catch (e) {
        const msg = e?.message || String(e);
        logResponse(method, url.pathname, 502, `Claude error: ${msg}`);
        return json(res, 502, { error: `Claude API error: ${msg}` });
      }
    }

    // GET /api/npc/{id}/dialogue[/{field}[/{index}]]
    if (type === 'npc' && action === 'dialogue') {
      const dlg = WBAPI.npcDialogues[key];
      if (!dlg) {
        logResponse(method, url.pathname, 404, `no NPC_DIALOGUES entry for "${key}"`);
        return json(res, 404, { error:`No NPC_DIALOGUES entry for "${key}". Create one with POST /api/npc/${key}/dialogue` });
      }
      const dlgField = parts[3];
      const dlgIdx   = parts[4] !== undefined ? parseInt(parts[4], 10) : undefined;

      if (dlgField) {
        const val = dlg[dlgField];
        if (val === undefined) {
          logResponse(method, url.pathname, 404, `field "${dlgField}" not in dialogue for "${key}"`);
          return json(res, 404, { error:`Field "${dlgField}" not found. Available: ${Object.keys(dlg).join(', ')}` });
        }
        if (dlgIdx !== undefined) {
          // GET /api/npc/:key/dialogue/:array/:index
          if (!Array.isArray(val)) {
            logResponse(method, url.pathname, 400, `"${dlgField}" is not an array`);
            return json(res, 400, { error:`"${dlgField}" is not an array` });
          }
          if (isNaN(dlgIdx) || dlgIdx < 0 || dlgIdx >= val.length) {
            logResponse(method, url.pathname, 404, `${dlgField}[${dlgIdx}] out of range (length ${val.length})`);
            return json(res, 404, { error:`${dlgField}[${dlgIdx}] out of range (length: ${val.length})` });
          }
          logRow('npc', key);
          logRow('line', `${dlgField}[${dlgIdx}]  →  ${String(val[dlgIdx]).slice(0,80)}`);
          logResponse(method, url.pathname, 200, `dialogue/${key}/${dlgField}/${dlgIdx}`);
          return json(res, 200, { ok:true, key, field:dlgField, index:dlgIdx, text: val[dlgIdx] });
        }
        // GET /api/npc/:key/dialogue/:field
        logRow('npc', key);
        logRow('field', `${dlgField}  →  ${Array.isArray(val) ? val.length+' lines' : String(val).slice(0,60)}`);
        logResponse(method, url.pathname, 200, `dialogue/${key}/${dlgField}`);
        return json(res, 200, { ok:true, key, field:dlgField, value:val, ...(Array.isArray(val) ? { count:val.length } : {}) });
      }

      logRow('npc', key);
      logRow('quote', (dlg.quote||'').slice(0,80));
      const fieldSummary = Object.entries(dlg)
        .map(([f,v]) => Array.isArray(v) ? `${f}[${v.length}]` : f).join('  ·  ');
      logRow('fields', fieldSummary);
      logResponse(method, url.pathname, 200, `dialogue/${key}`);
      return json(res, 200, { ok:true, key, dialogue: dlg,
        _meta: { hasBirkaProfile: !!WBAPI.birkaNpcs[key] } });
    }

    // GET /api/monster/{id}/drop
    if (type === 'monster' && action === 'drop') {
      const drop = WBAPI.monsterDrops[key];
      if (!drop) {
        logResponse(method, url.pathname, 404, `no drop for monster "${key}"`);
        return json(res, 404, { error:`No MONSTER_DROPS entry for "${key}". Create one with POST /api/monster/${key}/drop` });
      }
      logRow('drop', `${drop.icon||''}  ${drop.name}  ·  ${drop.sell||0}gp`);
      logResponse(method, url.pathname, 200, `drop/${key}`);
      return json(res, 200, { ok:true, key, drop });
    }

    // GET /api/quest/{id}/chain
    if (type === 'quest' && action === 'chain') {
      const q = WBAPI.questDb[key];
      if (!q) {
        logResponse(method, url.pathname, 404, `quest "${key}" not found`);
        return json(res, 404, { error:`quest "${key}" not found` });
      }
      const chain = WBAPI.quests.chain(key);
      const enrich = id => ({
        id,
        title:       WBAPI.questDb[id]?.title,
        type:        WBAPI.questDb[id]?.type,
        activateNode:WBAPI.questDb[id]?.activateNode,
      });
      logRow('quest', `${key}  ·  ${WBAPI.questDb[key]?.title||'—'}`);
      logRow('chain', `↑${chain.upstream.length} upstream  ·  ↓${chain.downstream.length} downstream  ·  ${chain.upstream.length+1+chain.downstream.length} total`);
      logResponse(method, url.pathname, 200,
        `chain for "${key}" — length ${chain.upstream.length + 1 + chain.downstream.length}`);
      return json(res, 200, {
        id:         key,
        upstream:   chain.upstream.map(enrich),
        current:    enrich(key),
        downstream: chain.downstream.map(enrich),
        length:     chain.upstream.length + 1 + chain.downstream.length,
      });
    }

    const r = CONNECT[type](key);
    if (r) {
      // ── ENRICH: add full details to every entity GET ──────────────────────
      const ent = r.entity || {};

      if (type === 'node') {
        // Full coordinates
        r.entity.coords = WBAPI.nodeCoords[key] || null;
        // Full linked-node details for each direction
        const dirs = ['N','E','S','W'];
        r.entity.links = {};
        dirs.forEach(d => {
          const tgt = ent[d];
          if (tgt) r.entity.links[d] = { code:tgt, label:WBAPI.nodeMap[tgt]?.label||tgt,
            terrain:WBAPI.nodeMap[tgt]?.name||null, act:WBAPI.nodeMap[tgt]?.act||null,
            coords:WBAPI.nodeCoords[tgt]||null };
        });
        // Quest count + list on entity
        const qlist = (WBAPI._questsByNode[key]||[]);
        r.entity.questCount = qlist.length;
        r.entity.questIds   = qlist.map(q=>q.id);
        // NPC count
        r.entity.npcCount = WBAPI.npcs.byNode(key).length;
        // Walkability helpers
        r._lookups = [
          `GET /api/location/${key}`,
          `GET /api/graph/validate/${key}`,
          `GET /api/coords/near/${key}?radius=8`,
          `GET /api/list/quest?node=${key}`,
          `GET /api/list/npc?node=${key}`,
        ];
        const exits = dirs.filter(d=>ent[d]).map(d=>`${d}:${ent[d]}`).join(' ');
        logRow('entity', `${ent.label||key}  ·  Act ${ent.act}  ·  terrain: ${ent.name||'—'}`);
        logRow('connections', `${qlist.length} quests  ·  ${r.entity.npcCount} NPCs  ·  ${(r.connections?.monsters||[]).length} monsters${exits?' ·  exits: '+exits:''}`);

      } else if (type === 'quest') {
        // Full node details
        const qnode = WBAPI.nodeMap[ent.activateNode];
        r.entity.nodeDetails   = qnode ? { code:ent.activateNode, label:qnode.label, terrain:qnode.name, act:qnode.act, coords:WBAPI.nodeCoords[ent.activateNode]||null } : null;
        // Full NPC details if attached
        const qnpc = ent.npc ? WBAPI.npcs.get?.(ent.npc) : null;
        r.entity.npcDetails = qnpc ? { key:qnpc.key, name:qnpc.name, node:qnpc.node, occupation:qnpc.occupation } : null;
        // All schema fields with nulls shown explicitly
        const QUEST_FIELDS = ['id','type','title','desc','passText','failText','activateNode','waypointNode',
          'npc','checkStat','checkDC','checkPassFlag','activateCond','questComplete','monster',
          'monsterHP','monsterAC','grantItem','takeItem','activateMissionBit'];
        QUEST_FIELDS.forEach(f => { if (r.entity[f] === undefined) r.entity[f] = null; });
        r._lookups = [
          `GET /api/quest/${key}/chain`,
          `GET /api/location/${ent.activateNode||''}`,
          `GET /api/list/quest?arc=${key.replace(/_act\d+$/,'')}`,
        ];
        const up = (r.connections?.upstream||[]).length, dn = (r.connections?.downstream||[]).length;
        logRow('entity', `${ent.title||key}  ·  type: ${ent.type}  ·  node: ${ent.activateNode||'—'}`);
        logRow('chain', `↑${up} upstream  ·  ↓${dn} downstream${ent.npc?' ·  NPC: '+ent.npc:''}`);

      } else if (type === 'monster') {
        // All schema fields
        const MON_FIELDS = ['key','name','tier','ac','hp','atk','dmg','xp','morale','loot'];
        MON_FIELDS.forEach(f => { if (r.entity[f] === undefined) r.entity[f] = null; });
        // Full drop details
        const drop = WBAPI.monsterDrops?.[key];
        r.entity.drop = drop || null;
        // Associated quests
        const questsWithMon = WBAPI.quests.all().filter(q=>q.monster===key);
        r.entity.questCount = questsWithMon.length;
        r.entity.questIds   = questsWithMon.map(q=>q.id);
        // Full terrain details
        if (r.connections?.terrains) {
          r.connections.terrainDetails = r.connections.terrains.map(tk => ({
            key:tk, label:WBAPI.worldDb[tk]?.label||tk, icon:WBAPI.worldDb[tk]?.icon||'',
            nodeCount: Object.values(WBAPI.nodeMap).filter(n=>n.name===tk).length
          }));
        }
        r._lookups = [
          `GET /api/loot-drop?monster=${key}`,
          `GET /api/list/monster?tier=${ent.tier||''}`,
        ];
        logRow('entity', `${ent.name||key}  ·  AC ${ent.ac}  HP ${ent.hp}  ATK +${ent.atk}  tier: ${ent.tier||'?'}`);
        logRow('terrains+quests', `${(r.connections?.terrains||[]).length} terrains  ·  ${questsWithMon.length} quest refs${drop?' ·  drop: '+drop.name:''}`);

      } else if (type === 'npc') {
        // Full node details
        const nnode = WBAPI.nodeMap[ent.node];
        r.entity.nodeDetails = nnode ? { code:ent.node, label:nnode.label, terrain:nnode.name, act:nnode.act, coords:WBAPI.nodeCoords[ent.node]||null } : null;
        // All quests this NPC appears in — full detail
        const npcQuests = WBAPI.quests.all().filter(q=>q.npc===key);
        r.entity.questCount  = npcQuests.length;
        r.entity.questIds    = npcQuests.map(q=>q.id);
        r.entity.questsDetail= npcQuests.map(q=>({ id:q.id, title:q.title, type:q.type, activateNode:q.activateNode }));
        // All schema fields
        const NPC_FIELDS = ['key','name','node','role','occupation','desc','state'];
        NPC_FIELDS.forEach(f => { if (r.entity[f] === undefined) r.entity[f] = null; });
        r._lookups = [
          `GET /api/location/${ent.node||''}`,
          `GET /api/list/quest?node=${ent.node||''}`,
        ];
        logRow('entity', `${ent.name||key}  ·  ${ent.occupation||''}  ·  node: ${ent.node||'—'}`);
        logRow('quests', `${npcQuests.length} quests reference this NPC`);

      } else {
        const connSummary = Object.entries(r.connections||{})
          .filter(([,v]) => Array.isArray(v) ? v.length : v)
          .map(([k,v]) => `${k}:${Array.isArray(v)?v.length:1}`).join('  ·  ');
        if (connSummary) logRow('connections', connSummary);
      }

      logRow('can delete', r._meta?.canDelete ? `${C.green}yes${C.reset}` : `${C.red}no — blocked by ${JSON.stringify(r._meta?.blockedBy||{})}${C.reset}`);
      logResponse(method, url.pathname, 200, `${type}/${key}`);
      return json(res, 200, r);
    }

    // Verbose 404 — show all valid IDs for this type
    logResponse(method, url.pathname, 404, `${type} "${rawId}" not found`);
    const allIds404 = type==='node' ? WBAPI.nodes.all().map(n=>n.id)
      : type==='quest'   ? WBAPI.quests.all().map(q=>q.id)
      : type==='monster' ? WBAPI.monsters.all().map(m=>m.key)
      : type==='npc'     ? WBAPI.npcs.all().filter(n=>!n._inline).map(n=>n.key)
      : type==='terrain' ? Object.keys(WBAPI.worldDb)
      : [];
    return json(res, 404, {
      error: `${type} "${rawId}" not found`,
      hint: `Use GET /api/list/${type} to browse all ${type}s, or GET /api/list/ids/${type} for all valid IDs`,
      count: allIds404.length,
      allValidIds: allIds404,
    });
  }

  // ── PUT ──
  if (method === 'PUT') {
    let body;
    try { body = await readBody(req); } catch(e) {
      logResponse(method, url.pathname, 400, `Invalid JSON: ${e.message}`);
      return json(res, 400, { error:'Invalid JSON' });
    }

    // PUT /api/monster/:key/drop
    if (type === 'monster' && action === 'drop') {
      if (!WBAPI.monsterDrops[key]) {
        logResponse(method, url.pathname, 404, `no drop for "${key}" — create first with POST`);
        return json(res, 404, { error:`No drop for "${key}". Create with POST /api/monster/${key}/drop` });
      }
      Object.assign(WBAPI.monsterDrops[key], body);
      if (body.sell !== undefined) WBAPI.monsterDrops[key].sell = Number(body.sell);
      logRow('updated', `drop › ${key}  →  ${WBAPI.monsterDrops[key].icon||''} ${WBAPI.monsterDrops[key].name}  ·  ${WBAPI.monsterDrops[key].sell}gp`);
      logResponse(method, url.pathname, 200, `drop/${key} updated`);
      return json(res, 200, { ok:true, key, drop: WBAPI.monsterDrops[key], note:'PUT only updates in-memory. POST /api/save to persist.' });
    }

    // PUT /api/npc/:key/dialogue[/{field}[/{index}]]
    if (type === 'npc' && action === 'dialogue') {
      if (!WBAPI.npcDialogues[key]) {
        logResponse(method, url.pathname, 404, `no dialogue for "${key}" — create first with POST`);
        return json(res, 404, { error:`No NPC_DIALOGUES entry for "${key}". Create with POST /api/npc/${key}/dialogue` });
      }
      const dlg      = WBAPI.npcDialogues[key];
      const dlgField = parts[3];
      const dlgIdx   = parts[4] !== undefined ? parseInt(parts[4], 10) : undefined;

      // PUT /api/npc/:key/dialogue/:array/:index — replace one line
      if (dlgField && dlgIdx !== undefined) {
        const arr = dlg[dlgField];
        if (!Array.isArray(arr)) {
          logResponse(method, url.pathname, 400, `"${dlgField}" is not an array`);
          return json(res, 400, { error:`"${dlgField}" is not an array` });
        }
        if (isNaN(dlgIdx) || dlgIdx < 0 || dlgIdx >= arr.length) {
          logResponse(method, url.pathname, 404, `${dlgField}[${dlgIdx}] out of range`);
          return json(res, 404, { error:`${dlgField}[${dlgIdx}] out of range (length: ${arr.length})` });
        }
        const text = body.text ?? body.line ?? body.value;
        if (text === undefined) {
          logResponse(method, url.pathname, 400, 'body.text required');
          return json(res, 400, { error:'body.text required' });
        }
        arr[dlgIdx] = String(text);
        const r = replaceSection('NPC_DIALOGUES', serializeNpcDialoguesSection());
        if (!r.ok) { logResponse(method, url.pathname, 500, r.error); return json(res, 500, r); }
        logRow('updated', `${key}.${dlgField}[${dlgIdx}]  →  ${String(text).slice(0,60)}`);
        logResponse(method, url.pathname, 200, `dialogue/${key}/${dlgField}/${dlgIdx} replaced`);
        return json(res, 200, { ok:true, key, field:dlgField, index:dlgIdx, text: arr[dlgIdx], note:'POST /api/save to persist.' });
      }

      // PUT /api/npc/:key/dialogue/quote
      if (dlgField === 'quote') {
        const text = body.text ?? body.value ?? body.quote;
        if (text === undefined) {
          logResponse(method, url.pathname, 400, 'body.text required');
          return json(res, 400, { error:'body.text required' });
        }
        dlg.quote = String(text);
        const r = replaceSection('NPC_DIALOGUES', serializeNpcDialoguesSection());
        if (!r.ok) { logResponse(method, url.pathname, 500, r.error); return json(res, 500, r); }
        logRow('updated', `${key}.quote  →  ${String(text).slice(0,80)}`);
        logResponse(method, url.pathname, 200, `dialogue/${key}/quote updated`);
        return json(res, 200, { ok:true, key, field:'quote', quote: dlg.quote, note:'POST /api/save to persist.' });
      }

      // PUT /api/npc/:key/dialogue/meta — patch meta fields
      if (dlgField === 'meta') {
        const META_FIELDS = ['name','occupation','worldTruth','missionBit','enemy','node'];
        if (!dlg.meta) dlg.meta = {};
        const updated = [];
        for (const [k, v] of Object.entries(body)) {
          if (META_FIELDS.includes(k)) { dlg.meta[k] = String(v); updated.push(k); }
        }
        if (!updated.length) {
          logResponse(method, url.pathname, 400, 'no valid meta fields');
          return json(res, 400, { error:`Valid meta fields: ${META_FIELDS.join(', ')}` });
        }
        const r = replaceSection('NPC_DIALOGUES', serializeNpcDialoguesSection());
        if (!r.ok) { logResponse(method, url.pathname, 500, r.error); return json(res, 500, r); }
        logRow('updated', `${key}.meta  →  ${updated.join(', ')}`);
        logResponse(method, url.pathname, 200, `dialogue/${key}/meta updated`);
        return json(res, 200, { ok:true, key, field:'meta', meta: dlg.meta, note:'POST /api/save to persist.' });
      }

      // PUT /api/npc/:key/dialogue/:array — replace whole array
      if (dlgField) {
        const ARRAY_FIELDS = ['impartial','questActive','friendly','dearFriend'];
        if (!ARRAY_FIELDS.includes(dlgField)) {
          logResponse(method, url.pathname, 400, `"${dlgField}" not a replaceable array field`);
          return json(res, 400, { error:`Replaceable array fields: ${ARRAY_FIELDS.join(', ')}. Use PUT /dialogue/quote or /dialogue/meta for those fields.` });
        }
        const lines = body.value ?? body.lines ?? body[dlgField];
        if (!Array.isArray(lines)) {
          logResponse(method, url.pathname, 400, 'body.value must be an array of strings');
          return json(res, 400, { error:'body.value must be an array of strings' });
        }
        dlg[dlgField] = lines.map(String);
        const r = replaceSection('NPC_DIALOGUES', serializeNpcDialoguesSection());
        if (!r.ok) { logResponse(method, url.pathname, 500, r.error); return json(res, 500, r); }
        logRow('replaced', `${key}.${dlgField}  →  ${lines.length} lines`);
        logResponse(method, url.pathname, 200, `dialogue/${key}/${dlgField} replaced (${lines.length} lines)`);
        return json(res, 200, { ok:true, key, field:dlgField, count: lines.length, value: dlg[dlgField], note:'POST /api/save to persist.' });
      }

      // PUT /api/npc/:key/dialogue — merge full object (session-only convenience)
      Object.assign(dlg, body);
      logRow('updated', `dialogue › ${key}  (in-memory only)`);
      logResponse(method, url.pathname, 200, `dialogue/${key} updated`);
      return json(res, 200, { ok:true, key, dialogue: dlg, note:'Whole-object merge is in-memory only. Use field sub-routes (PUT /dialogue/quote etc.) for persistent edits. POST /api/save to persist.' });
    }

    const col = { node:WBAPI.nodeMap, quest:WBAPI.questDb, monster:WBAPI.monsterPool, npc:WBAPI.birkaNpcs }[type];
    const resolvedKey = WBAPI._findKey(col, rawId) || rawId;
    if (!col[resolvedKey]) {
      logResponse(method, url.pathname, 404, `${type} "${resolvedKey}" not found`);
      return json(res, 404, { ok:false, error:`${type} "${resolvedKey}" not found` });
    }

    logTrace('PUT', `type=${type} key=${resolvedKey} fields=${Object.keys(body).join(',')}`);

    // Auto-junction rule: if setting a directional field (N/E/S/W) on a node
    // that already has 3 connections (deg=3), automatically create a junction
    // node first so the source stays at deg=3 and the junction gets the 4th slot.
    // Body can pass autoJunction:false to bypass this behaviour.
    const autoJunctionEnabled = type === 'node' && body.autoJunction !== false;
    const autoJunctionCreated = [];
    if (autoJunctionEnabled) {
      const DIRS4 = ['N','E','S','W'];
      const OPP4  = {N:'S',S:'N',E:'W',W:'E'};
      const DR4   = {N:-1,S:1,E:0,W:0};
      const DC4   = {N:0,S:0,E:1,W:-1};
      const srcNode = WBAPI.nodeMap[resolvedKey];
      if (srcNode) {
        const currentDeg = DIRS4.filter(d => srcNode[d] && WBAPI.nodeMap[srcNode[d]]).length;
        logTrace('auto-junction check', `node=${resolvedKey} currentDeg=${currentDeg} dirFields=${DIRS4.filter(d=>d in body&&body[d]).join(',')}`);
        if (currentDeg >= 3) {
          for (const dirField of DIRS4) {
            if (!(dirField in body) || !body[dirField]) continue; // only for set directions
            if (srcNode[dirField]) continue; // slot already taken — let normal handler run
            logTrace('auto-junction trigger', `${resolvedKey}(deg=${currentDeg}).${dirField}→${body[dirField]} — will insert junction`);
            // Degree is 3 and we're trying to set the 4th slot → auto-junction
            const targetCode  = body[dirField];
            const srcCoord    = WBAPI.nodeCoords[resolvedKey];
            // Generate a junction code
            const jNums = Object.keys(WBAPI.nodeMap).filter(c=>/^J\d+$/.test(c)).map(c=>+c.slice(1));
            const jCode = `J${(jNums.length?Math.max(...jNums):0)+1}`;
            // Place junction 1 step in the chosen direction from src
            const jR = srcCoord ? srcCoord.r + DR4[dirField] : null;
            const jC = srcCoord ? srcCoord.c + DC4[dirField] : null;
            // Verify the cell is free
            const occupied = jR !== null && Object.entries(WBAPI.nodeCoords).some(([c,p]) => p.r===jR && p.c===jC);
            if (!occupied && jR !== null) {
              const srcNode2 = WBAPI.nodeMap[resolvedKey];
              const terrain  = srcNode2?.name || 'junction';
              const srcLabel = (srcNode2?.label||resolvedKey).split(/[—–]/)[0].trim().slice(0,20);
              const tgtLabel = (WBAPI.nodeMap[targetCode]?.label||targetCode).split(/[—–]/)[0].trim().slice(0,20);
              const jBody = {
                name: terrain, label: `${srcLabel} ↔ ${tgtLabel} Junction`,
                text: `Signpost says: The road between ${srcLabel} and ${tgtLabel}. Junction auto-created at degree-3 node.`,
                act: srcNode2?.act||1, junction:true,
                [OPP4[dirField]]: resolvedKey, [dirField]: targetCode,
              };
              const jEntry = serializeNodeLiteral(jCode, jBody);
              const ins = insertBeforeSectionClose('NODE_MAP', jEntry);
              logTrace('auto-junction create', `code=${jCode} at r=${jR} c=${jC} between ${resolvedKey} and ${targetCode}`);
              if (ins.ok) {
                const newNum = Object.values(WBAPI.nodeMap).reduce((m,n)=>Math.max(m,n.num||0),0)+1;
                WBAPI.nodeMap[jCode] = { ...jBody, num:newNum };
                WBAPI.nodeCoords[jCode] = { r:jR, c:jC };
                // Write coord into source
                const CS='// ◆◆◆ WORLDBUILDER:NODE_COORDS:START ◆◆◆', CE='// ◆◆◆ WORLDBUILDER:NODE_COORDS:END ◆◆◆';
                const si=WBAPI._rawSrc.indexOf(CS)+CS.length, ei=WBAPI._rawSrc.indexOf(CE);
                let sec=WBAPI._rawSrc.slice(si,ei);
                const ci=sec.lastIndexOf('\n};');
                sec=sec.slice(0,ci+1)+`  ${jCode}:{r:${jR},c:${jC}},\n`+sec.slice(ci+1);
                WBAPI._rawSrc=WBAPI._rawSrc.slice(0,si)+sec+WBAPI._rawSrc.slice(ei);
                // Wire back from target to junction
                WBAPI.editField('node', targetCode, OPP4[dirField], jCode);
                // Replace the requested field with junction connection
                body[dirField] = jCode;
                autoJunctionCreated.push({ jCode, direction:dirField, target:targetCode, at:{r:jR,c:jC} });
                logRow('auto-junction', `${resolvedKey}(deg=3) → ${jCode} → ${targetCode}`);
              }
            }
          }
        }
      }
    }

    const results = [];
    for (const [field, value] of Object.entries(body)) {
      if (field === 'autoJunction') continue; // internal flag, not a real field
      if (typeof value === 'string' || value === null) {
        const r = WBAPI.editField(type, resolvedKey, field, value);
        results.push({ field, ok: r.ok, error: r.error, inserted: r.inserted || false, removed: r.removed || false, strategy: 'editField' });
      } else {
        // Non-string values (arrays, numbers) go through ns.put — in-memory only, requires /api/save
        const ns = { node:WBAPI.nodes, quest:WBAPI.quests, monster:WBAPI.monsters, npc:WBAPI.npcs }[type];
        const r = ns ? ns.put(resolvedKey, { [field]: value }) : { ok:false, error:'unknown type' };
        results.push({ field, ok: r.ok, strategy: 'put-memory-only', note: 'non-string; call POST /api/save to persist' });
      }
    }

    const allOk = results.every(r => r.ok);
    const failed = results.filter(r => !r.ok);
    if (!allOk) {
      logRow('target', `${type} › ${resolvedKey}`);
      failed.forEach(r => logRow(r.field, `${C.red}✗ ${r.error||'failed'}${C.reset}`));
      logResponse(method, url.pathname, 422,
        `PUT failed: ${failed.map(r => r.field + (r.error ? ' — ' + r.error : '')).join('; ')}`);
      return json(res, 422, { ok:false, error:'Some fields could not be written to source', failed, results });
    }

    logRow('target', `${type} › ${resolvedKey}`);
    results.forEach(r => logRow(r.field, `${C.green}✓${C.reset} ${r.inserted ? 'inserted' : 'updated'}`));
    logResponse(method, url.pathname, 200, `${results.length} field${results.length>1?'s':''} written to source`);
    // Collect expected values for disk-verification (string fields only — non-string are in-memory only)
    const expectedFields = {};
    for (const r of results) {
      if (r.ok && r.strategy === 'editField' && !r.removed) expectedFields[r.field] = String(body[r.field]);
    }
    const putReminder = type === 'node' ? { reminder: 'Use API only: PUT /api/node/{code}, PUT /api/coords/{code}, POST /api/graph/junction — never edit roll2hit-v3.html directly.' } : {};
    const autoJunctionInfo = autoJunctionCreated.length
      ? { autoJunctionsCreated: autoJunctionCreated, note: `${autoJunctionCreated.length} junction(s) auto-inserted (source was deg=3). Pass autoJunction:false to bypass.` }
      : {};
    return saveAndVerify(res, 200, { ok:true, fields: results, ...autoJunctionInfo, ...putReminder }, expectedFields, type, resolvedKey);
  }

  // ── DELETE ──
  if (method === 'DELETE') {
    // Nonce-free: DELETE /api/npc/:key/dialogue/:array/:index — single line removal
    if (type === 'npc' && action === 'dialogue' && parts[3] && parts[4] !== undefined) {
      const ARRAY_FIELDS = ['impartial','questActive','friendly','dearFriend'];
      const dlgField = parts[3];
      const dlgIdx   = parseInt(parts[4], 10);
      if (!ARRAY_FIELDS.includes(dlgField)) {
        logResponse(method, url.pathname, 400, `"${dlgField}" is not a removable array`);
        return json(res, 400, { error:`Removable array fields: ${ARRAY_FIELDS.join(', ')}` });
      }
      const dlg = WBAPI.npcDialogues[key];
      if (!dlg) {
        logResponse(method, url.pathname, 404, `no NPC_DIALOGUES entry for "${key}"`);
        return json(res, 404, { error:`No NPC_DIALOGUES entry for "${key}"` });
      }
      const arr = dlg[dlgField];
      if (!Array.isArray(arr) || isNaN(dlgIdx) || dlgIdx < 0 || dlgIdx >= arr.length) {
        logResponse(method, url.pathname, 400, `${dlgField}[${dlgIdx}] out of range`);
        return json(res, 400, { error:`${dlgField}[${dlgIdx}] out of range (length: ${Array.isArray(arr) ? arr.length : 0})` });
      }
      const removed = arr.splice(dlgIdx, 1)[0];
      const r = replaceSection('NPC_DIALOGUES', serializeNpcDialoguesSection());
      if (!r.ok) { logResponse(method, url.pathname, 500, r.error); return json(res, 500, r); }
      logRow('removed', `${key}.${dlgField}[${dlgIdx}]  →  ${String(removed).slice(0,60)}`);
      logRow('remaining', arr.length);
      logResponse(method, url.pathname, 200, `removed dialogue/${key}/${dlgField}/${dlgIdx}`);
      return json(res, 200, { ok:true, key, field:dlgField, removed, remaining: arr.length, note:'POST /api/save to persist.' });
    }

    // DELETE /api/monster/:key/drop — remove a drop entry (nonce type:monster, id:key)
    if (type === 'monster' && action === 'drop') {
      const nonce = req.headers['x-nonce'] || url.searchParams.get('nonce');
      if (!nonce) {
        logResponse(method, url.pathname, 403, 'DELETE drop requires X-Nonce');
        return json(res, 403, { ok:false,
          error:'DELETE drop requires a nonce. POST /api/nonce with {type:"monster",id:"<key>"} first.',
          hint:`NONCE=$(curl -s -XPOST http://localhost:${PORT}/api/nonce -H 'Content-Type: application/json' -d '{"type":"monster","id":"${key}"}' | jq -r .nonce) && curl -XDELETE http://localhost:${PORT}/api/monster/${key}/drop -H "X-Nonce: $NONCE"` });
      }
      const nc = nonceConsume(nonce, 'monster', key);
      if (!nc.ok) {
        logResponse(method, url.pathname, 403, `nonce rejected: ${nc.error}`);
        return json(res, 403, { ok:false, error: nc.error });
      }
      if (!WBAPI.monsterDrops[key]) {
        logResponse(method, url.pathname, 404, `no drop entry for "${key}"`);
        return json(res, 404, { ok:false, error:`No drop entry for "${key}"` });
      }
      // Remove the entry line from MONSTER_DROPS section in _rawSrc
      const DS = '// ◆◆◆ WORLDBUILDER:MONSTER_DROPS:START ◆◆◆';
      const DE = '// ◆◆◆ WORLDBUILDER:MONSTER_DROPS:END ◆◆◆';
      const dsIdx = WBAPI._rawSrc.indexOf(DS) + DS.length;
      const deIdx = WBAPI._rawSrc.indexOf(DE);
      if (dsIdx < DS.length || deIdx === -1) {
        logResponse(method, url.pathname, 500, 'MONSTER_DROPS section not found in source');
        return json(res, 500, { ok:false, error:'MONSTER_DROPS section markers not found in source' });
      }
      const dropSec = WBAPI._rawSrc.slice(dsIdx, deIdx);
      const lineRe  = new RegExp(`[ \\t]*${key}\\s*:\\s*\\{[^\\n]*\\},?[ \\t]*\\n`);
      const patchedDrop = dropSec.replace(lineRe, '');
      if (patchedDrop === dropSec) {
        logResponse(method, url.pathname, 404, `drop line for "${key}" not found in source text`);
        return json(res, 404, { ok:false, error:`Drop entry "${key}" not found in source text` });
      }
      WBAPI._rawSrc = WBAPI._rawSrc.slice(0, dsIdx) + patchedDrop + WBAPI._rawSrc.slice(deIdx);
      const removed = { ...WBAPI.monsterDrops[key] };
      delete WBAPI.monsterDrops[key];
      logRow('deleted', `drop › ${key}  ·  ${removed.icon||''} ${removed.name}`);
      logResponse(method, url.pathname, 200, `deleted drop/${key}`);
      return saveAndVerify(res, 200, { ok:true, key, deleted: removed }, {}, null, null);
    }

    // Require a valid nonce issued by POST /api/nonce
    const nonce = req.headers['x-nonce'] || url.searchParams.get('nonce');
    if (!nonce) {
      logResponse(method, url.pathname, 403, 'DELETE requires X-Nonce — call POST /api/nonce first');
      return json(res, 403, { ok:false, error:'DELETE requires a nonce token. Call POST /api/nonce with {type,id} first, then include the token in the X-Nonce request header.' });
    }
    const nc = nonceConsume(nonce, type, key);
    if (!nc.ok) {
      logResponse(method, url.pathname, 403, `nonce rejected: ${nc.error}`);
      return json(res, 403, { ok:false, error: nc.error });
    }

    const r = CONNECT[type](key);
    if (!r) {
      logResponse(method, url.pathname, 404, `${type} "${rawId}" not found`);
      return json(res, 404, { error: `${type} "${rawId}" not found` });
    }

    if (!r._meta.canDelete) {
      logRow('DELETE blocked', JSON.stringify(r._meta.blockedBy));
      logResponse(method, url.pathname, 409, `DELETE blocked for ${type}:${key}`);
      return json(res, 409, { ok:false, error:'Delete blocked — nested content exists',
        blockedBy: r._meta.blockedBy, connections: r.connections });
    }

    const ns = { node:WBAPI.nodes, quest:WBAPI.quests, monster:WBAPI.monsters, npc:WBAPI.npcs }[type];
    const del = ns.delete(key);
    const ent = r.entity || {};
    logRow('deleted', `${type} › ${key}${ent.label||ent.name||ent.title ? '  ·  ' + (ent.label||ent.name||ent.title) : ''}`);
    logResponse(method, url.pathname, del.ok ? 200 : 409,
      del.ok ? `deleted ${type}/${key}` : del.error);
    return json(res, del.ok ? 200 : 409, { ...del, wasEntity: r.entity });
  }

  // ── POST (special operations) ──
  if (method === 'POST') {
    let body;
    try { body = await readBody(req); } catch(e) {
      logResponse(method, url.pathname, 400, `Invalid JSON: ${e.message}`);
      return json(res, 400, { error:'Invalid JSON' });
    }
    // POST /api/npc/:key/dialogue/:array — append one line
    if (type === 'npc' && action === 'dialogue' && parts[3]) {
      const ARRAY_FIELDS = ['impartial','questActive','friendly','dearFriend'];
      const dlgField = parts[3];
      if (!ARRAY_FIELDS.includes(dlgField)) {
        logResponse(method, url.pathname, 400, `"${dlgField}" is not appendable`);
        return json(res, 400, { error:`Appendable fields: ${ARRAY_FIELDS.join(', ')}. Use PUT /dialogue/quote or /dialogue/meta for those.` });
      }
      const dlg = WBAPI.npcDialogues[key];
      if (!dlg) {
        logResponse(method, url.pathname, 404, `no NPC_DIALOGUES entry for "${key}"`);
        return json(res, 404, { error:`No NPC_DIALOGUES entry for "${key}". Create with POST /api/npc/${key}/dialogue` });
      }
      const text = body.text ?? body.line ?? body.value;
      if (!text) {
        logResponse(method, url.pathname, 400, 'body.text required');
        return json(res, 400, { error:'body.text required' });
      }
      if (!Array.isArray(dlg[dlgField])) dlg[dlgField] = [];
      dlg[dlgField].push(String(text));
      const idx = dlg[dlgField].length - 1;
      const r = replaceSection('NPC_DIALOGUES', serializeNpcDialoguesSection());
      if (!r.ok) { logResponse(method, url.pathname, 500, r.error); return json(res, 500, r); }
      logRow('appended', `${key}.${dlgField}[${idx}]  →  ${String(text).slice(0,60)}`);
      logRow('count', dlg[dlgField].length);
      logResponse(method, url.pathname, 201, `appended to dialogue/${key}/${dlgField}`);
      return json(res, 201, { ok:true, key, field:dlgField, index:idx, text: dlg[dlgField][idx], count: dlg[dlgField].length, note:'POST /api/save to persist.' });
    }

    // POST /api/monster/:id/drop  — create drop entry
    if (type === 'monster' && action === 'drop') {
      if (!body.name) {
        logResponse(method, url.pathname, 400, 'body.name required');
        return json(res, 400, { error:'Required fields: name. Optional: icon, sell' });
      }
      if (WBAPI.monsterDrops[key]) {
        logResponse(method, url.pathname, 409, `drop for "${key}" already exists — use PUT to update`);
        return json(res, 409, { error:`Drop for "${key}" already exists. Use PUT /api/monster/${key}/drop to update.` });
      }
      if (!WBAPI.monsterPool[key]) {
        logResponse(method, url.pathname, 404, `monster "${key}" not found`);
        return json(res, 404, { error:`Monster "${key}" not found` });
      }
      const entry = serializeDropLiteral(key, body);
      const ins = insertBeforeSectionClose('MONSTER_DROPS', entry);
      if (!ins.ok) { logResponse(method, url.pathname, 500, ins.error); return json(res, 500, ins); }
      WBAPI.monsterDrops[key] = { icon: body.icon||'📦', name: body.name, sell: Number(body.sell||0) };
      logRow('drop', `${key}  →  ${body.icon||'📦'} ${body.name}  ·  ${body.sell||0}gp`);
      logResponse(method, url.pathname, 201, `created drop for monster/${key}`);
      return json(res, 201, { ok:true, key, drop: WBAPI.monsterDrops[key], note:'POST /api/save to persist.' });
    }

    // POST /api/npc/:id/dialogue  — create NPC_DIALOGUES entry
    if (type === 'npc' && action === 'dialogue') {
      if (!body.quote) {
        logResponse(method, url.pathname, 400, 'body.quote required');
        return json(res, 400, { error:'Required: quote (string). Optional: meta{worldTruth,missionBit}, impartial[], friendly[], dearFriend[]' });
      }
      if (WBAPI.npcDialogues[key]) {
        logResponse(method, url.pathname, 409, `dialogue for "${key}" already exists — use PUT to update`);
        return json(res, 409, { error:`NPC_DIALOGUES entry for "${key}" already exists.` });
      }
      const npc = WBAPI.birkaNpcs[key];
      const enriched = { ...body, name: body.name || npc?.name || key, occupation: body.occupation || npc?.occupation };
      const entry = serializeNpcDialogueLiteral(key, enriched);
      const ins = insertBeforeSectionClose('NPC_DIALOGUES', entry);
      if (!ins.ok) { logResponse(method, url.pathname, 500, ins.error); return json(res, 500, ins); }
      WBAPI.npcDialogues[key] = enriched;
      logRow('dialogue', `${key}  ·  quote: ${body.quote.slice(0,60)}…`);
      logResponse(method, url.pathname, 201, `created dialogue for npc/${key}`);
      return json(res, 201, { ok:true, key, dialogue: WBAPI.npcDialogues[key], note:'POST /api/save to persist.' });
    }

    // POST /api/monster/:id/rename
    if (action === 'rename') {
      if (!body.name) {
        logResponse(method, url.pathname, 400, 'body.name required');
        return json(res, 400, { error:'body.name required' });
      }
      const r = WBAPI.monsters.rename(key, body.name);
      logRow('monster', key);
      logRow('rename', r.ok ? `"${r.from}" → "${r.to}"  (key unchanged  ·  ${r.terrains?.length||0} terrains)` : r.error);
      logResponse(method, url.pathname, r.ok ? 200 : 400, r.ok ? `renamed` : r.error);
      return json(res, r.ok ? 200 : 400, { ...r, ...(r.ok ? monsterConnections(key) : {}) });
    }

    // POST /api/monster/:id/fork
    if (action === 'fork') {
      if (!body.newKey) {
        logResponse(method, url.pathname, 400, 'body.newKey required');
        return json(res, 400, { error:'body.newKey required' });
      }
      const r = WBAPI.monsters.fork(key, body.newKey, body.overrides);
      logRow('fork', `${key}  →  ${body.newKey}`);
      if (body.overrides) logRow('overrides', JSON.stringify(body.overrides));
      logResponse(method, url.pathname, r.ok ? 201 : 400, r.ok ? `forked ${key} → ${body.newKey}` : r.error);
      return json(res, r.ok ? 201 : 400, { ...r, ...(r.ok ? monsterConnections(body.newKey) : {}) });
    }

    // POST /api/terrain/:id/swap
    if (action === 'swap') {
      if (!body.oldKey || !body.newKey) {
        logResponse(method, url.pathname, 400, 'body.oldKey and body.newKey required');
        return json(res, 400, { error:'body.oldKey and body.newKey required' });
      }
      const r = WBAPI.worlds.swapMonster(key, body.oldKey, body.newKey);
      logRow('terrain', key);
      logRow('swap', `${body.oldKey}  →  ${body.newKey}`);
      logResponse(method, url.pathname, r.ok ? 200 : 400, r.ok ? `swapped in terrain/${key}` : r.error);
      return json(res, r.ok ? 200 : 400, r);
    }

    // POST /api/node/:id/move
    if (action === 'move') {
      if (!body.newCode) {
        logResponse(method, url.pathname, 400, 'body.newCode required');
        return json(res, 400, { error:'body.newCode required' });
      }
      if (!WBAPI.nodeMap[key]) {
        logResponse(method, url.pathname, 404, `Node "${key}" not found`);
        return json(res, 404, { error:`Node "${key}" not found` });
      }
      if (WBAPI.nodeMap[body.newCode]) {
        logResponse(method, url.pathname, 409, `Code "${body.newCode}" already exists`);
        return json(res, 409, { error:`Code "${body.newCode}" already exists` });
      }
      WBAPI.nodeMap[body.newCode] = { ...WBAPI.nodeMap[key] };
      if (WBAPI.nodeCoords[key]) { WBAPI.nodeCoords[body.newCode] = WBAPI.nodeCoords[key]; delete WBAPI.nodeCoords[key]; }
      let qUpdated = 0, nUpdated = 0;
      for (const q of Object.values(WBAPI.questDb))
        for (const f of ['activateNode','waypointNode'])
          if (q[f] === key) { q[f] = body.newCode; qUpdated++; }
      for (const n of Object.values(WBAPI.birkaNpcs))
        if (n.node === key) { n.node = body.newCode; nUpdated++; }
      delete WBAPI.nodeMap[key];
      // Patch _rawSrc so the key rename survives the next save
      const renamed = WBAPI.renameNodeKey(key, body.newCode);
      WBAPI._buildIndexes();
      logRow('move', `${key}  →  ${body.newCode}`);
      logRow('updated refs', `${qUpdated} quests  ·  ${nUpdated} NPCs`);
      logRow('rawSrc sections', `${renamed.sections} patched`);
      logResponse(method, url.pathname, 200, `moved node/${key} → ${body.newCode}`);
      return json(res, 200, { ok:true, from:key, to:body.newCode, questsUpdated:qUpdated, npcsUpdated:nUpdated,
        rawSrcSections: renamed.sections, ...nodeConnections(body.newCode) });
    }
  }

  logResponse(method, url.pathname, 405, `Method ${method} not allowed`);
  json(res, 405, { error:`Method ${method} not allowed on ${url.pathname}` });
}

// ═══════════════════════════════════════════════════════════════════════════
// Server
// ═══════════════════════════════════════════════════════════════════════════
const server = http.createServer(async (req, res) => {
  try {
    await route(req, res);
  } catch(e) {
    log('ERROR', `Unhandled exception: ${e.message}`, { stack: e.stack?.split('\n')[1]?.trim() });
    json(res, 500, { error: e.message });
  }
});

// Port 1367 wins: if another instance already owns the port, exit cleanly
// so the wbapi-toggle restart loop does NOT relaunch (exit 0 ≠ exit 67).
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    writeError(`Port ${PORT} already in use — port 1367 wins; this instance exits.`);
    process.exit(0);
  }
  writeError(`server.listen failed: ${err.message}`, err.stack);
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  const line = '═'.repeat(60);
  console.log(`\n${C.bold}${C.magenta}${line}${C.reset}`);
  console.log(`${C.bold}  WBAPI Server  —  http://localhost:${PORT}/api${C.reset}`);
  console.log(`${C.dim}  paul@roll2hit.com  —  MIT License  —  Public Domain${C.reset}`);
  console.log(`${C.magenta}${line}${C.reset}`);
  console.log(`  Game file: ${C.cyan}${GAME_FILE}${C.reset}`);
  console.log(`  Log file:  ${C.cyan}${LOG_FILE}${C.reset}`);
  const modeColor = { fast: C.dim, debug: C.yellow, trace: C.cyan }[currentMode] || C.white;
  console.log(`  Mode:      ${modeColor}${C.bold}${currentMode.toUpperCase()}${C.reset}  ${C.dim}verbose=${VERBOSE} trace=${TRACE}  · ./api.sh mode [fast|debug|trace]${C.reset}`);
  console.log(`\n  ${C.dim}Endpoints:${C.reset}`);
  const routes = [
    ['GET',    '/api/help[/{topic}]             → man-page style docs (read|write|nonce|wizard|curl|...)'],
    ['GET',    '/api/ping'],
    ['GET',    '/api/mode'],
    ['POST',   '/api/mode                           body: {mode} (fast|debug|trace)'],
    ['GET',    '/api/source                         → raw HTML source (worldbuilder Load from Server)'],
    ['GET',    '/api/audit[?format=text]             → integrity scan (errors/warnings/suggestions/connectivity)'],
    ['GET',    '/api/audit/data[?format=text&section=node|quest|monster|terrain|coords]  → deep schema + bloat + explosion validator'],
    ['POST',   '/api/audit/data/clean[?dryRun=true]   → remove explosion J-nodes + orphan coords, null dangling exits'],
    ['GET',    '/api/audit/map[?format=text]         → map conformity: diagonal/bidirectional/alignment/axis-distance/long-links/market-proximity'],
    ['POST',   '/api/audit/map/fix                   body: {} (all) or {check,code,dir,target} (one)'],
    ['GET',    '/api/layout/solve[?step=8&root=TLS]  → BFS grid layout: proposed {r,c} for every node'],
    ['POST',   '/api/layout/apply                    body: {coords:{code:{r,c},...}} → mass-update NODE_COORDS'],
    ['GET',    '/api/schema[/{type}]                → canonical field schema'],
    ['GET',    '/api/flags                          → list _S_DEFAULTS flags'],
    ['POST',   '/api/flags                          body: {name, defaultValue, comment?}'],
    ['GET',    '/api/list/{node|quest|monster|npc|terrain}[?node=&terrain=&type=]'],
    ['GET',    '/api/quest?node={code}              → filter quests (shorthand)'],
    ['GET',    '/api/{node|quest|monster|npc|terrain}/{id}  → entity + connections + _meta'],
    ['GET',    '/api/quest/{id}/chain               → upstream + downstream chain'],
    ['GET',    '/api/location/{code}               → composite view'],
    ['PUT',    '/api/{node|quest|monster|npc}/{id}  body: {field:value,...}'],
    ['PUT',    '/api/terrain/{id}                  body: {label?,icon?}'],
    ['POST',   '/api/nonce                          body: {type,id} → 16-char token (required for DELETE)'],
    ['DELETE', '/api/{node|quest|monster|npc}/{id}  X-Nonce: <token> required (409 if nested content)'],
    ['POST',   '/api/quest                          body: {id, type, title, activateNode, ...}'],
    ['POST',   '/api/node                           body: {code, name, label, act, ...}'],
    ['POST',   '/api/terrain                        body: {key, label, icon?, monsters:[keys]}'],
    ['POST',   '/api/monster                        body: {key, name, ac?, hp?, atk?, dmg?, xp?, tier?}'],
    ['POST',   '/api/npc                           body: {key, name, node, occupation?, neutral?, friendly?, dearFriend?}'],
    ['GET',    '/api/export/{collection}[?format=json|js|module]  → node_map|quest_db|monster_pool|world_db|...'],
    ['GET',    '/api/fish[/{key}][?rank=&night=]     → fish list or single'],
    ['POST',   '/api/fish/simulate                  body: {dexMod, catchMod, typeMod, luckMod, rodBonus}'],
    ['POST',   '/api/fish                           body: {key, name, rank, desc?, isNight?}'],
    ['GET',    '/api/item[/{key}][?type=]              → item list or single (ITEM_DB)'],
    ['POST',   '/api/item                            body: {key, name, type, icon?, sell?, desc?, atkBonus?, ...}'],
    ['PUT',    '/api/item/{key}                      body: {field:value,...}'],
    ['GET',    '/api/lake-magic[/{key}][?effect=&minRank=] → magic item list or single'],
    ['POST',   '/api/lake-magic                     body: {key, name, effect, ...}'],
    ['GET',    '/api/drops[?sell=&q=]                → drop table list/filter'],
    ['GET',    '/api/monster/{id}/drop              → single drop entry'],
    ['POST',   '/api/monster/{id}/drop              body: {name, icon?, sell?}'],
    ['PUT',    '/api/monster/{id}/drop              body: {name?, icon?, sell?}'],
    ['DELETE', '/api/monster/{id}/drop              X-Nonce: <token>  (nonce type:monster,id:key)'],
    ['GET',    '/api/loot                           → d100 consumable table (potions/scrolls/gold) with rollRanges, gap'],
    ['PUT',    '/api/loot                           body: {entries:[{weight,_type},...]}  (consumables only — no magic weapons)'],
    ['PUT',    '/api/loot/{index}                   body: {weight?,_type?}'],
    ['GET',    '/api/loot-drop[?terrain=&monster=&fishing=&bonus=&name=] → unified drop query (monster+fishing)'],
    ['GET',    '/api/npc/{id}/dialogue[/{field}[/{index}]]  → whole entry, one field, or one line'],
    ['POST',   '/api/npc/{id}/dialogue              body: {quote, meta?, impartial?, ...}  (create)'],
    ['POST',   '/api/npc/{id}/dialogue/{array}      body: {text}  (append line)'],
    ['PUT',    '/api/npc/{id}/dialogue/quote        body: {text}'],
    ['PUT',    '/api/npc/{id}/dialogue/meta         body: {worldTruth?,missionBit?,...}'],
    ['PUT',    '/api/npc/{id}/dialogue/{array}      body: {value:[...]}  (replace array)'],
    ['PUT',    '/api/npc/{id}/dialogue/{array}/{i}  body: {text}  (replace one line)'],
    ['DELETE', '/api/npc/{id}/dialogue/{array}/{i}  (nonce-free — removes one line)'],
    ['POST',   '/api/monster/{id}/rename            body: {name}'],
    ['POST',   '/api/monster/{id}/fork              body: {newKey, overrides?}'],
    ['POST',   '/api/terrain/{id}/swap              body: {oldKey, newKey}'],
    ['POST',   '/api/node/{id}/move                 body: {newCode}'],
    ['POST',   '/api/save                           body: {outputPath?}'],
    ['POST',   '/api/reload'],
    ['POST',   '/api/restart                        → exit(0); external process handles relaunch'],
  ];
  const methodColor = { GET:C.green, PUT:C.yellow, DELETE:C.red, POST:C.blue };
  for (const [m, path] of routes)
    console.log(`  ${(methodColor[m]||C.white)+m.padEnd(7)+C.reset} ${C.dim}${path}${C.reset}`);
  console.log(`${C.magenta}${line}${C.reset}`);

  // ── Quick-start examples ──
  const b = `http://localhost:${PORT}`;
  console.log(`\n${C.bold}  Quick-start examples${C.reset}`);
  console.log(`  ${C.dim}Open in browser (or worldbuilder.html):${C.reset}`);
  console.log(`    ${C.cyan}open worldbuilder.html${C.reset}  ${C.dim}← click "Localhost Server" card${C.reset}`);
  console.log(`\n  ${C.dim}curl:${C.reset}`);
  console.log(`    ${C.green}curl${C.reset} ${C.dim}${b}/api/ping${C.reset}`);
  console.log(`    ${C.green}curl${C.reset} ${C.dim}${b}/api/node/CY${C.reset}           ${C.dim}# node by code${C.reset}`);
  console.log(`    ${C.green}curl${C.reset} ${C.dim}${b}/api/quest/quest_wis_01${C.reset}  ${C.dim}# quest by id${C.reset}`);
  console.log(`    ${C.green}curl${C.reset} ${C.dim}${b}/api/monster/goblin${C.reset}     ${C.dim}# monster by key${C.reset}`);
  console.log(`    ${C.green}curl${C.reset} ${C.dim}${b}/api/list/node${C.reset}          ${C.dim}# full node list${C.reset}`);
  console.log(`    ${C.green}curl${C.reset} ${C.dim}${b}/api/audit${C.reset}             ${C.dim}# integrity report${C.reset}`);
  console.log(`    ${C.green}curl${C.reset} ${C.dim}${b}/api/source${C.reset} ${C.dim}-o out.html${C.reset}  ${C.dim}# download game HTML${C.reset}`);
  console.log(`\n  ${C.dim}Delete with nonce:${C.reset}`);
  console.log(`    ${C.yellow}NONCE=$(curl -s -XPOST ${b}/api/nonce -H 'Content-Type: application/json'${C.reset}`);
  console.log(`    ${C.yellow}      -d '{"type":"node","id":"XX"}' | jq -r .nonce)${C.reset}`);
  console.log(`    ${C.red}curl${C.reset} ${C.dim}-XDELETE ${b}/api/node/XX -H "X-Nonce: \$NONCE"${C.reset}`);
  console.log(`${C.magenta}${line}${C.reset}\n`);

  clearError(); // successful start — remove any stale error file
  log('INFO', `Server listening on http://127.0.0.1:${PORT}`);
  logStream.write('═'.repeat(60) + '\n');

  // Crash handlers — write error file and log the stack, then exit cleanly.
  // The server never exits with code 67. All restart/relaunch is handled by
  // an external process (monitor-snapshots.py keepalive or wbapi-toggle.sh).
  // Crashes exit 1 (hard stop). POST /api/restart exits 0 (clean stop).
  process.on('uncaughtException', (err) => {
    writeError(`CRASH uncaughtException: ${err.message}`, err.stack);
    logStream.write(`CRASH: ${err.stack || err.message}\n`);
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : '';
    writeError(`CRASH unhandledRejection: ${msg}`, stack);
    logStream.write(`CRASH (rejection): ${stack || msg}\n`);
    process.exit(1);
  });

  // Watch for external edits to the game file and auto-reload
  let _watchDebounce = null;
  let _lastMtime = fs.statSync(GAME_FILE).mtimeMs;
  fs.watch(GAME_FILE, () => {
    clearTimeout(_watchDebounce);
    _watchDebounce = setTimeout(() => {
      try {
        const mtime = fs.statSync(GAME_FILE).mtimeMs;
        if (mtime === _lastMtime) return; // no actual change
        _lastMtime = mtime;
        log('LOAD', `External edit detected — reloading ${path.basename(GAME_FILE)}`);
        reload();
      } catch (e) {
        log('INFO', `Watch reload failed: ${e.message}`);
      }
    }, 200);
  });
});
