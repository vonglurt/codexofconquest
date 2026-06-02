#!/usr/bin/env node
// ============================================================
// wbapi-server.js — Roll2Hit World Builder API Server
// MIT License — Copyright (c) 2026 PaulRicheson@Roll2Hit.com
// SPDX-License-Identifier: MIT
// ============================================================
'use strict';
// Local REST API for roll2hit-v3.html — reads and writes the HTML file
// directly.  The game is fully self-contained in that one file.
// Toggle: ./wbapi-toggle.sh [start|stop|restart|status]
// curl:   curl http://localhost:1367/api/ping

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const WBAPI  = require('./wbapi-core');

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
const VERBOSE   = process.env.WBAPI_VERBOSE === '1' || process.env.WBAPI_VERBOSE === 'true';
const GAME_FILE = process.env.ROLL2HIT_FILE
  || process.argv.find((a, i) => process.argv[i-1] === '--file')
  || path.join(__dirname, 'roll2hit-v3.html');

// ── Logging ──────────────────────────────────────────────────────────────────
const LOG_FILE = path.join(__dirname, 'wbapi-server.log');
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

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
  // LOGIC suppressed from console; goes to file only
  const dataStr = data !== undefined ? ' ' + (typeof data === 'string' ? data : JSON.stringify(data)) : '';
  if (level !== 'LOGIC' && level !== 'REQUEST') {
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
      type:        { type:'string',  required:true,  editable:true,  values:['side','main','skill_check','hunt'],
                     note:'Quest type. main quests gated by story flags. skill_check requires DC roll. hunt targets specific monsters.' },
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
  for (const f of FN)   if (body[f] !== undefined) parts.push(`${f}:${body[f]}`);
  return parts.join(', ') + ' },\n';
}

function serializeNodeLiteral(code, body) {
  const maxNum = Object.values(WBAPI.nodeMap).reduce((m, n) => Math.max(m, n.num || 0), 0);
  const num = body.num !== undefined ? Number(body.num) : maxNum + 1;
  const STR  = ['name','label','text','npc','loot','N','S','E','W'];
  const NUM  = ['act','sleepCost'];
  const BOOL = ['sleep'];
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
          '  GET /api/help/curl            — curl cheat sheet for every operation',
          '',
          `Server: ${b}`,
          'Source: PaulRicheson@Roll2Hit.com — MIT License',
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
          `  POST ${b}/api/npc           body: {key, name, node, role?, desc?}`,
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
          `  POST ${b}/api/reload    — re-parse roll2hit-v3.html from disk (discard memory edits)`,
          `  POST ${b}/api/restart   — save + exit(67); toggle script auto-relaunches`,
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
          '',
          'FIXING ERRORS',
          '  1. Run audit to get the error list',
          '  2. For broken references: create the missing entity or fix the key',
          '  3. For typos in existing keys: use /rename or /swap endpoints',
          '  4. Run audit again to confirm errors dropped to zero',
          '',
          `  e.g. curl ${b}/api/audit | jq \'.errors\'`,
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
    };

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

  // ── Restart (exits with code 67; toggle script loops on this) ──
  if (parts[0] === 'restart' && method === 'POST') {
    logRow('exit(67)', 'wbapi-toggle.sh restart loop will relaunch');
    logResponse(method, url.pathname, 200, 'restarting');
    res.writeHead(200, { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' });
    res.end(JSON.stringify({ ok:true, note:'Server restarting. Poll /api/ping until it responds.' }));
    server.close(() => { process.exit(67); });
    setTimeout(() => process.exit(67), 500);
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
      return json(res, 200, { ok:true });
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

    // 3. Respond, then restart so the server reloads from roll2hit-v3.html clean
    logResponse(method, url.pathname, 200, `saved → restarting`);
    res.writeHead(200, { 'Content-Type':'application/json' });
    res.end(JSON.stringify({
      ok: true,
      backup: backupPath,
      primary: GAME_FILE,
      note: 'Server restarting. Poll /api/ping until it responds.',
    }));
    setTimeout(() => process.exit(67), 120); // let response flush before exit
    return;
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

    const summary = { errors: errors.length, warnings: warnings.length, suggestions: suggestions.length };
    const eCol = errors.length   ? C.red    : C.green;
    const wCol = warnings.length ? C.yellow : C.green;
    logRow(`${eCol}${errors.length} errors${C.reset}  ·  ${wCol}${warnings.length} warnings${C.reset}  ·  ${C.dim}${suggestions.length} suggestions${C.reset}`);
    if (errors.length) {
      // Count by message pattern for the top error summary
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
    return json(res, 200, { ok:true, errors, warnings, suggestions, parse, summary });
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
      return json(res, 201, { ok:true, name, defaultValue, note:'POST /api/save to persist.' });
    }
  }

  // ── List ──────────────────────────────────────────────────────────────────
  if (parts[0] === 'list') {
    const type    = parts[1];
    const nodeQ   = url.searchParams.get('node');
    const terrain = url.searchParams.get('terrain');
    const arc     = url.searchParams.get('arc');
    const qtype   = url.searchParams.get('type');
    const filters = [nodeQ&&`node=${nodeQ}`, terrain&&`terrain=${terrain}`, arc&&`arc=${arc}`, qtype&&`type=${qtype}`].filter(Boolean);

    if (type === 'node') {
      const total = WBAPI.nodes.all().length;
      let list = WBAPI.nodes.all();
      if (nodeQ) list = list.filter(n => n.id === nodeQ);
      const out = list.map(n => ({
        id: n.id, label: n.label, terrain: n.name, act: n.act,
        _meta: { quests: (WBAPI._questsByNode[n.id]||[]).length,
                 npcs:   WBAPI.npcs.byNode(n.id).length,
                 canDelete: !WBAPI._questsByNode[n.id]?.length && !WBAPI.npcs.byNode(n.id).length }
      }));
      const acts = {};
      out.forEach(n => { acts[n.act] = (acts[n.act]||0)+1; });
      logRow('total', filters.length ? `${total} total  →  ${out.length} matched  (${filters.join(', ')})` : `${out.length} nodes`);
      logRow('by act', Object.entries(acts).sort((a,b)=>a[0]-b[0]).map(([a,n])=>`Act${a}×${n}`).join('  '));
      logRow('sample', sample(out, 5));
      logResponse(method, url.pathname, 200, `${out.length} nodes`);
      return json(res, 200, out);
    }

    if (type === 'quest') {
      const total = WBAPI.quests.all().length;
      let list = WBAPI.quests.all();
      if (nodeQ)  list = list.filter(q => q.activateNode===nodeQ || q.waypointNode===nodeQ);
      if (qtype)  list = list.filter(q => q.type === qtype);
      if (arc)    list = list.filter(q => q.id.startsWith(arc));
      const out = list.map(q => ({
        id: q.id, title: q.title, type: q.type,
        activateNode: q.activateNode, waypointNode: q.waypointNode, npc: q.npc,
        _meta: { downstream: WBAPI.quests.chain(q.id).downstream.length,
                 canDelete:  WBAPI.quests.chain(q.id).downstream.length === 0 }
      }));
      const types = {};
      out.forEach(q => { types[q.type] = (types[q.type]||0)+1; });
      logRow('total', filters.length ? `${total} total  →  ${out.length} matched  (${filters.join(', ')})` : `${out.length} quests`);
      logRow('by type', Object.entries(types).map(([t,n])=>`${t}×${n}`).join('  '));
      logRow('sample', sample(out, 4));
      logResponse(method, url.pathname, 200, `${out.length} quests`);
      return json(res, 200, out);
    }

    if (type === 'monster') {
      const total = WBAPI.monsters.all().length;
      let list = WBAPI.monsters.all();
      if (terrain) list = list.filter(m => m.terrains.includes(terrain));
      const out = list.map(m => ({
        key: m.key, name: m.name, tier: m.tier, terrainCount: m.terrains.length,
        _meta: { canDelete: m.terrains.length === 0 }
      }));
      const noDrops = out.filter(m => !WBAPI.monsterDrops[m.key]).length;
      logRow('total', filters.length ? `${total} total  →  ${out.length} matched  (${filters.join(', ')})` : `${out.length} monsters`);
      logRow('no drops', `${noDrops} monsters  ·  ${out.length - noDrops} have drops`);
      logRow('sample', sample(out.map(m=>m.key), 5));
      logResponse(method, url.pathname, 200, `${out.length} monsters`);
      return json(res, 200, out);
    }

    if (type === 'npc') {
      let list = WBAPI.npcs.all().filter(n => !n._inline);
      if (nodeQ) list = list.filter(n => n.node === nodeQ);
      const out = list.map(n => ({
        key: n.key, name: n.name, node: n.node, occupation: n.occupation,
        _meta: { canDelete: WBAPI._deps.npc(n.key).quests.length === 0 }
      }));
      logRow('total', `${out.length} NPCs`);
      logRow('sample', out.map(n=>`${n.name} @ ${n.node}`).join('  ·  '));
      logResponse(method, url.pathname, 200, `${out.length} npcs`);
      return json(res, 200, out);
    }

    if (type === 'terrain') {
      const out = Object.entries(WBAPI.worldDb).map(([k,v]) => ({
        key: k, label: v.label || k, icon: v.icon || '',
        monsterCount: (WBAPI._terrainToMonsters[k]||[]).length,
        nodeCount: Object.values(WBAPI.nodeMap).filter(n=>n.name===k).length,
      }));
      const noMonsters = out.filter(t=>t.monsterCount===0).length;
      const noNodes    = out.filter(t=>t.nodeCount===0).length;
      logRow('total', `${out.length} terrains`);
      logRow('empty monster list', `${noMonsters}  ·  unused by any node: ${noNodes}`);
      logRow('sample', sample(out.map(t=>t.key), 5));
      logResponse(method, url.pathname, 200, `${out.length} terrains`);
      return json(res, 200, out);
    }

    logResponse(method, url.pathname, 404, `unknown list type: ${type}`);
    return json(res, 404, { error: `Unknown list type: ${type}` });
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

  // ── POST /api/{quest|node|terrain|monster} (create new entity) ────────────
  if (!rawId && method === 'POST' && (type === 'quest' || type === 'node' || type === 'terrain' || type === 'monster' || type === 'npc')) {
    let body;
    try { body = await readBody(req); } catch(e) {
      return json(res, 400, { error:'Invalid JSON' });
    }
    if (type === 'quest') {
      const { id } = body;
      if (!id || !body.type || !body.title || !body.activateNode) {
        logResponse(method, url.pathname, 400, 'missing required fields');
        return json(res, 400, { error:'Required fields: id, type, title, activateNode' });
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
      if (hasFns) logRow('note', 'function fields written — POST /api/save then /api/reload');
      logResponse(method, url.pathname, 201, `created quest/${id}`);
      return json(res, 201, {
        ok:true, id,
        note: hasFns
          ? 'Function fields written to source. POST /api/save then /api/reload to activate.'
          : 'POST /api/save to persist.',
        ...questConnections(id),
      });
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
      const ins = insertBeforeSectionClose('NODE_MAP', entry);
      if (!ins.ok) { logResponse(method, url.pathname, 500, ins.error); return json(res, 500, ins); }
      const maxNum = Object.values(WBAPI.nodeMap).reduce((m, n) => Math.max(m, n.num || 0), 0);
      const { code: _code, ...nodeFields } = body;
      WBAPI.nodeMap[code] = { ...nodeFields, num: body.num !== undefined ? Number(body.num) : maxNum + 1 };
      WBAPI._buildIndexes();
      logRow('code', code);
      logRow('label', `${body.label}  ·  Act ${body.act}  ·  terrain: ${body.name||'—'}`);
      logResponse(method, url.pathname, 201, `created node/${code}`);
      return json(res, 201, { ok:true, code, note:'POST /api/save to persist.', ...nodeConnections(code) });
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
      return json(res, 201, { ok:true, key, note:'POST /api/save to persist.',
        entity: WBAPI.worldDb[key], connections: { monsters: monsterKeys } });
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
      return json(res, 201, { ok:true, key, note:'POST /api/save to persist.', entity: WBAPI.monsterPool[key] });
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
      return json(res, 201, { ok:true, key, note:'POST /api/save to persist.', ...npcConnections(key) });
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

  if (!type || !rawId) {
    logResponse(method, url.pathname, 400, 'missing type/id');
    return json(res, 400, { error: 'Path: /api/{type}/{id}' });
  }

  // ── Location (composite) ──
  if (type === 'location') {
    const r = locationConnections(rawId);
    if (r) {
      const node = WBAPI.nodeMap[rawId] || {};
      logRow('location', `${rawId}  ·  ${node.label||rawId}  ·  Act ${node.act||'?'}`);
      logRow('connections', `${r.monsters?.length||0} monsters  ·  ${r.quests?.length||0} quests  ·  ${r.npcs?.length||0} NPCs`);
      logResponse(method, url.pathname, 200, `location/${rawId}`);
      return json(res, 200, r);
    }
    logResponse(method, url.pathname, 404, `location "${rawId}" not found`);
    return json(res, 404, { error: `Location "${rawId}" not found` });
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
    return json(res, 400, { error: `Unknown type "${type}". Use: node quest monster npc terrain location fish lake-magic` });
  }

  const key = resolveId(type, rawId);

  // ── GET ──
  if (method === 'GET') {
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
      // Rich entity breadcrumb based on type
      const ent = r.entity || {};
      if (type === 'node') {
        const exits = Object.entries(r.connections?.linkedNodes||{}).filter(([,v])=>v).map(([d,c])=>`${d}:${c}`).join(' ');
        logRow('entity', `${ent.label||key}  ·  Act ${ent.act}  ·  terrain: ${ent.name||'—'}`);
        logRow('connections', `${(r.connections?.quests||[]).length} quests  ·  ${(r.connections?.npcs||[]).length} NPCs  ·  ${(r.connections?.monsters||[]).length} monsters${exits?' ·  exits: '+exits:''}`);
      } else if (type === 'quest') {
        logRow('entity', `${ent.title||key}  ·  type: ${ent.type}  ·  node: ${ent.activateNode||'—'}`);
        const up = (r.connections?.upstream||[]).length, dn = (r.connections?.downstream||[]).length;
        logRow('chain', `↑${up} upstream  ·  ↓${dn} downstream${ent.npc?' ·  NPC: '+ent.npc:''}`);
      } else if (type === 'monster') {
        logRow('entity', `${ent.name||key}  ·  AC ${ent.ac}  HP ${ent.hp}  ATK +${ent.atk}  tier: ${ent.tier||'?'}`);
        logRow('terrains', `${(r.connections?.terrains||[]).length} terrains${r.connections?.drop?' ·  drop: '+r.connections.drop.name:''}`);
      } else if (type === 'npc') {
        logRow('entity', `${ent.name||key}  ·  ${ent.occupation||''}  ·  node: ${ent.node||'—'}`);
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
    logResponse(method, url.pathname, 404, `${type} "${rawId}" not found`);
    return json(res, 404, { error: `${type} "${rawId}" not found` });
  }

  // ── PUT ──
  if (method === 'PUT') {
    let body;
    try { body = await readBody(req); } catch(e) {
      logResponse(method, url.pathname, 400, `Invalid JSON: ${e.message}`);
      return json(res, 400, { error:'Invalid JSON' });
    }
    const col = { node:WBAPI.nodeMap, quest:WBAPI.questDb, monster:WBAPI.monsterPool, npc:WBAPI.birkaNpcs }[type];
    const resolvedKey = WBAPI._findKey(col, rawId) || rawId;

    const results = [];
    for (const [field, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        const r = WBAPI.editField(type, resolvedKey, field, value);
        results.push({ field, ok: r.ok, error: r.error, strategy: 'editField' });
      } else {
        const ns = { node:WBAPI.nodes, quest:WBAPI.quests, monster:WBAPI.monsters, npc:WBAPI.npcs }[type];
        const r = ns.put(resolvedKey, { [field]: value });
        results.push({ field, ok: r.ok, strategy: 'put' });
      }
    }

    const allOk = results.every(r => r.ok);
    const failed = results.filter(r => !r.ok).map(r => r.field);
    const updated = CONNECT[type](resolvedKey);
    logRow('target', `${type} › ${resolvedKey}`);
    results.forEach(r => logRow(r.field, r.ok ? `${C.green}✓${C.reset} updated` : `${C.red}✗ ${r.error||'failed'}${C.reset}`));
    logResponse(method, url.pathname, allOk ? 200 : 207,
      `${results.length} field${results.length>1?'s':''} updated${failed.length?' — '+failed.length+' failed':''}`);
    return json(res, allOk ? 200 : 207, { ok: allOk, fields: results,
      ...(failed.length ? { failed } : {}), ...updated });
  }

  // ── DELETE ──
  if (method === 'DELETE') {
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

server.listen(PORT, '127.0.0.1', () => {
  const line = '═'.repeat(60);
  console.log(`\n${C.bold}${C.magenta}${line}${C.reset}`);
  console.log(`${C.bold}  WBAPI Server  —  http://localhost:${PORT}/api${C.reset}`);
  console.log(`${C.dim}  PaulRicheson@Roll2Hit.com  —  MIT License  —  Public Domain${C.reset}`);
  console.log(`${C.magenta}${line}${C.reset}`);
  console.log(`  Game file: ${C.cyan}${GAME_FILE}${C.reset}`);
  console.log(`  Log file:  ${C.cyan}${LOG_FILE}${C.reset}`);
  if (VERBOSE) console.log(`  ${C.yellow}${C.bold}VERBOSE${C.reset}${C.yellow}     Full request + response bodies printed to terminal${C.reset}`);
  console.log(`\n  ${C.dim}Endpoints:${C.reset}`);
  const routes = [
    ['GET',    '/api/help[/{topic}]             → man-page style docs (read|write|nonce|wizard|curl|...)'],
    ['GET',    '/api/ping'],
    ['GET',    '/api/source                         → raw HTML source (worldbuilder Load from Server)'],
    ['GET',    '/api/audit                          → data integrity scan (errors/warnings/suggestions)'],
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
    ['POST',   '/api/monster/{id}/rename            body: {name}'],
    ['POST',   '/api/monster/{id}/fork              body: {newKey, overrides?}'],
    ['POST',   '/api/terrain/{id}/swap              body: {oldKey, newKey}'],
    ['POST',   '/api/node/{id}/move                 body: {newCode}'],
    ['POST',   '/api/save                           body: {outputPath?}'],
    ['POST',   '/api/reload'],
    ['POST',   '/api/restart                        → save + exit(67); toggle script auto-relaunches'],
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

  log('INFO', `Server listening on http://127.0.0.1:${PORT}`);
  logStream.write('═'.repeat(60) + '\n');
});
