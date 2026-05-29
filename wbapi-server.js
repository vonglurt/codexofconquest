#!/usr/bin/env node
'use strict';
// wbapi-server.js — Local REST API server for the Roll2Hit World Builder
// Usage: node wbapi-server.js [--port 3001] [--file roll2hit-v3.html]
// Browser: fetch('http://localhost:3001/api/node/CY')

const http = require('http');
const fs   = require('fs');
const path = require('path');
const WBAPI = require('./wbapi-core');

// ── Config ──────────────────────────────────────────────────────────────────
const PORT      = parseInt(process.env.PORT || '3001');
const GAME_FILE = process.env.ROLL2HIT_FILE
  || process.argv.find((a, i) => process.argv[i-1] === '--file')
  || path.join(__dirname, 'roll2hit-v3.html');

// ── Verbose Logging ─────────────────────────────────────────────────────────
const LOG_FILE = path.join(__dirname, 'wbapi-server.log');
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

// Console color codes
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  blue:   '\x1b[34m',
  magenta:'\x1b[35m',
  white:  '\x1b[37m',
};

function log(level, msg, data) {
  const ts = new Date().toISOString().slice(0, 23).replace('T', ' ');

  // Console: color-coded by level
  const levelColors = {
    REQUEST:  C.cyan   + '[REQUEST] ' + C.reset,
    RESPONSE: C.green  + '[RESPONSE]' + C.reset,
    LOGIC:    C.yellow + '[LOGIC]   ' + C.reset,
    INFO:     C.blue   + '[INFO]    ' + C.reset,
    ERROR:    C.red    + '[ERROR]   ' + C.reset,
    LOAD:     C.magenta+ '[LOAD]    ' + C.reset,
  };
  const prefix = levelColors[level] || `[${level}]`;
  const dataStr = data !== undefined ? ' ' + (typeof data === 'string' ? data : JSON.stringify(data)) : '';
  console.log(`${C.dim}${ts}${C.reset} ${prefix} ${msg}${dataStr}`);

  // File: plain text
  const fileLine = `${ts} [${level.padEnd(8)}] ${msg}${dataStr}\n`;
  logStream.write(fileLine);
}

function logReqStart(req, bodySnippet) {
  const sep = '─'.repeat(60);
  log('REQUEST', `${req.method} ${req.url}`);
  if (bodySnippet && Object.keys(bodySnippet).length) {
    log('REQUEST', `Body: ${JSON.stringify(bodySnippet)}`);
  }
  const fileLine = sep + '\n';
  logStream.write(fileLine);
}

function logResponse(method, url, status, summary) {
  const col = status < 300 ? C.green : status < 500 ? C.yellow : C.red;
  console.log(`            ${C.dim}└─${C.reset} ${col}${status}${C.reset} ${summary}`);
  logStream.write(`            └─ ${status} ${summary}\n`);
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
      activateCond:{ type:'function',required:false, editable:false, note:'JS arrow function (S) => bool. Evaluated at runtime to decide if quest is visible. Not editable via API — edit in source.' },
      completeFn:  { type:'function',required:false, editable:false, note:'JS arrow function (S) => {...}. Runs on quest completion to set story flags, grant items, etc. Not editable via API.' },
      onPass:      { type:'function',required:false, editable:false, note:'Alternative to completeFn. Runs on successful skill_check.' },
      onFail:      { type:'function',required:false, editable:false, note:'Runs on failed skill_check.' },
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, body) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', c => { buf += c; if (buf.length > 1e6) reject(new Error('Body too large')); });
    req.on('end', () => { try { resolve(JSON.parse(buf || '{}')); } catch(e) { reject(e); } });
    req.on('error', reject);
  });
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

  logReqStart(req, null);

  // ── Health ──
  if (parts[0] === 'ping') {
    log('LOGIC', 'Health check requested');
    const resp = { ok:true, loaded: WBAPI.loaded,
      file: path.basename(GAME_FILE),
      nodes:    Object.keys(WBAPI.nodeMap).length,
      quests:   Object.keys(WBAPI.questDb).length,
      monsters: Object.keys(WBAPI.monsterPool).length,
    };
    logResponse(method, url.pathname, 200, `ping ok — ${resp.nodes} nodes, ${resp.quests} quests`);
    return json(res, 200, resp);
  }

  // ── Reload ──
  if (parts[0] === 'reload' && method === 'POST') {
    log('LOGIC', `Reloading game file: ${GAME_FILE}`);
    try {
      reload();
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
    const body = await readBody(req).catch(() => ({}));
    log('LOGIC', 'Save requested', body.outputPath ? { outputPath: body.outputPath } : { outputPath: '(timestamped)' });
    const r = WBAPI.save(body.outputPath);
    logResponse(method, url.pathname, r.ok ? 200 : 500, r.ok ? `saved → ${r.path}` : r.error);
    return json(res, r.ok ? 200 : 500, r);
  }

  // ── Schema ──
  if (parts[0] === 'schema') {
    const type = parts[1];
    log('LOGIC', `Schema requested${type ? ' for type: ' + type : ' (all)'}`);
    if (type && !SCHEMAS[type]) {
      logResponse(method, url.pathname, 404, `Unknown schema type: ${type}`);
      return json(res, 404, { error: `Unknown schema type "${type}". Available: ${Object.keys(SCHEMAS).filter(k=>!k.startsWith('_')).join(', ')}` });
    }
    const result = type ? SCHEMAS[type] : SCHEMAS;
    logResponse(method, url.pathname, 200, type ? `schema for ${type}` : 'full schema');
    return json(res, 200, result);
  }

  // ── Diff summary ──
  if (parts[0] === 'diff' && method === 'GET') {
    log('LOGIC', 'Diff summary requested');
    logResponse(method, url.pathname, 200, 'diff summary');
    return json(res, 200, { note: 'Use POST /api/save to write all pending changes to disk' });
  }

  // ── List ──────────────────────────────────────────────────────────────────
  if (parts[0] === 'list') {
    const type    = parts[1];
    const nodeQ   = url.searchParams.get('node');
    const terrain = url.searchParams.get('terrain');
    const arc     = url.searchParams.get('arc');
    const qtype   = url.searchParams.get('type');
    const filters = [nodeQ&&`node=${nodeQ}`, terrain&&`terrain=${terrain}`, arc&&`arc=${arc}`, qtype&&`type=${qtype}`].filter(Boolean);
    log('LOGIC', `List ${type}${filters.length ? ' filtered by ' + filters.join(', ') : ' (all)'}`);

    if (type === 'node') {
      let list = WBAPI.nodes.all();
      if (nodeQ) list = list.filter(n => n.id === nodeQ);
      const out = list.map(n => ({
        id: n.id, label: n.label, terrain: n.name, act: n.act,
        _meta: { quests: (WBAPI._questsByNode[n.id]||[]).length,
                 npcs:   WBAPI.npcs.byNode(n.id).length,
                 canDelete: !WBAPI._questsByNode[n.id]?.length && !WBAPI.npcs.byNode(n.id).length }
      }));
      logResponse(method, url.pathname, 200, `${out.length} nodes`);
      return json(res, 200, out);
    }

    if (type === 'quest') {
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
      logResponse(method, url.pathname, 200, `${out.length} quests`);
      return json(res, 200, out);
    }

    if (type === 'monster') {
      let list = WBAPI.monsters.all();
      if (terrain) list = list.filter(m => m.terrains.includes(terrain));
      const out = list.map(m => ({
        key: m.key, name: m.name, tier: m.tier, terrainCount: m.terrains.length,
        _meta: { canDelete: m.terrains.length === 0 }
      }));
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
      logResponse(method, url.pathname, 200, `${out.length} npcs`);
      return json(res, 200, out);
    }

    if (type === 'terrain') {
      const out = Object.entries(WBAPI.worldDb).map(([k,v]) => ({
        key: k, label: v.label || k, icon: v.icon || '',
        monsterCount: (WBAPI._terrainToMonsters[k]||[]).length,
        nodeCount: Object.values(WBAPI.nodeMap).filter(n=>n.name===k).length,
      }));
      logResponse(method, url.pathname, 200, `${out.length} terrains`);
      return json(res, 200, out);
    }

    logResponse(method, url.pathname, 404, `Unknown list type: ${type}`);
    return json(res, 404, { error: `Unknown list type: ${type}` });
  }

  // ── Single entity ─────────────────────────────────────────────────────────
  const [type, rawId, action] = parts;
  if (!type || !rawId) {
    logResponse(method, url.pathname, 400, 'missing type/id');
    return json(res, 400, { error: 'Path: /api/{type}/{id}' });
  }

  // ── Location (composite) ──
  if (type === 'location') {
    log('LOGIC', `Location composite view for "${rawId}"`);
    const r = locationConnections(rawId);
    if (r) {
      logResponse(method, url.pathname, 200, `location ${rawId} — ${r.monsters?.length||0} monsters, ${r.quests?.length||0} quests`);
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
      log('LOGIC', `GET terrain "${tk}" — ${(WBAPI._terrainToMonsters[tk]||[]).length} monsters`);
      const monsterList = (WBAPI._terrainToMonsters[tk]||[]).map(mk => ({
        key: mk, name: WBAPI.monsterPool[mk]?.name||mk, tier: WBAPI.monsterPool[mk]?.tier||'?'
      }));
      const nodes = Object.entries(WBAPI.nodeMap)
        .filter(([,n])=>n.name===tk)
        .map(([code,n])=>({ code, label:n.label, act:n.act }));
      logResponse(method, url.pathname, 200, `terrain:${tk} — ${monsterList.length} monsters, ${nodes.length} nodes`);
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
      log('REQUEST', `PUT terrain:${tk}`, body);
      const allowed = ['label','icon'];
      const results = [];
      for (const [field, value] of Object.entries(body)) {
        if (!allowed.includes(field)) {
          log('LOGIC', `Field "${field}" is not directly editable on terrain (use swapMonster for monsters)`);
          results.push({ field, ok:false, error:`Field "${field}" not directly editable. Editable: ${allowed.join(', ')}` });
          continue;
        }
        if (typeof value === 'string') {
          log('LOGIC', `Patching terrain "${tk}" field "${field}" → "${value}"`);
          WBAPI.worldDb[tk][field] = value;
          results.push({ field, ok:true });
        } else {
          results.push({ field, ok:false, error:'Terrain fields must be strings' });
        }
      }
      const allOk = results.every(r=>r.ok);
      logResponse(method, url.pathname, allOk ? 200 : 207, `terrain:${tk} — ${results.map(r=>`${r.field}=${r.ok?'ok':'FAIL'}`).join(', ')}`);
      return json(res, allOk ? 200 : 207, {
        ok: allOk, fields: results,
        entity: { ...WBAPI.worldDb[tk], key:tk },
      });
    }
  }

  if (!CONNECT[type]) {
    logResponse(method, url.pathname, 400, `Unknown type "${type}"`);
    return json(res, 400, { error: `Unknown type "${type}". Use: node quest monster npc terrain location` });
  }

  const key = resolveId(type, rawId);

  // ── GET ──
  if (method === 'GET') {
    log('LOGIC', `GET ${type} "${key}" — building connection envelope`);
    const r = CONNECT[type](key);
    if (r) {
      const connSummary = Object.entries(r.connections||{})
        .filter(([,v]) => Array.isArray(v) ? v.length : v)
        .map(([k,v]) => `${k}:${Array.isArray(v)?v.length:1}`)
        .join(', ');
      logResponse(method, url.pathname, 200, `${type}:${key} — connections: ${connSummary || 'none'}, canDelete:${r._meta?.canDelete}`);
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
    log('REQUEST', `PUT body for ${type}:${key}`, body);

    const col = { node:WBAPI.nodeMap, quest:WBAPI.questDb, monster:WBAPI.monsterPool, npc:WBAPI.birkaNpcs }[type];
    const resolvedKey = WBAPI._findKey(col, rawId) || rawId;

    const results = [];
    for (const [field, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        log('LOGIC', `Field "${field}" is string → editField (patches _rawSrc)`);
        const r = WBAPI.editField(type, resolvedKey, field, value);
        if (!r.ok) log('LOGIC', `editField failed for "${field}": ${r.error}`);
        results.push({ field, ok: r.ok, error: r.error, strategy: 'editField' });
      } else {
        log('LOGIC', `Field "${field}" is ${typeof value} → ns.put (in-memory)`);
        const ns = { node:WBAPI.nodes, quest:WBAPI.quests, monster:WBAPI.monsters, npc:WBAPI.npcs }[type];
        const r = ns.put(resolvedKey, { [field]: value });
        results.push({ field, ok: r.ok, strategy: 'put' });
      }
    }

    const allOk = results.every(r => r.ok);
    const failed = results.filter(r => !r.ok).map(r => r.field);
    const updated = CONNECT[type](resolvedKey);
    logResponse(method, url.pathname, allOk ? 200 : 207,
      `${type}:${key} — ${results.length} fields: ${results.map(r=>`${r.field}=${r.ok?'ok':'FAIL'}`).join(', ')}`);
    return json(res, allOk ? 200 : 207, { ok: allOk, fields: results,
      ...(failed.length ? { failed } : {}), ...updated });
  }

  // ── DELETE ──
  if (method === 'DELETE') {
    const r = CONNECT[type](key);
    if (!r) {
      logResponse(method, url.pathname, 404, `${type} "${rawId}" not found`);
      return json(res, 404, { error: `${type} "${rawId}" not found` });
    }

    if (!r._meta.canDelete) {
      log('LOGIC', `DELETE blocked — nested content: ${JSON.stringify(r._meta.blockedBy)}`);
      logResponse(method, url.pathname, 409, `DELETE blocked for ${type}:${key}`);
      return json(res, 409, { ok:false, error:'Delete blocked — nested content exists',
        blockedBy: r._meta.blockedBy, connections: r.connections });
    }

    log('LOGIC', `DELETE ${type}:${key} — no blockers, proceeding`);
    const ns = { node:WBAPI.nodes, quest:WBAPI.quests, monster:WBAPI.monsters, npc:WBAPI.npcs }[type];
    const del = ns.delete(key);
    logResponse(method, url.pathname, del.ok ? 200 : 409,
      del.ok ? `deleted ${type}:${key}` : del.error);
    return json(res, del.ok ? 200 : 409, { ...del, wasEntity: r.entity });
  }

  // ── POST (special operations) ──
  if (method === 'POST') {
    let body;
    try { body = await readBody(req); } catch(e) {
      logResponse(method, url.pathname, 400, `Invalid JSON: ${e.message}`);
      return json(res, 400, { error:'Invalid JSON' });
    }
    log('REQUEST', `POST ${action} for ${type}:${key}`, body);

    // POST /api/monster/:id/rename
    if (action === 'rename') {
      if (!body.name) {
        logResponse(method, url.pathname, 400, 'body.name required');
        return json(res, 400, { error:'body.name required' });
      }
      log('LOGIC', `Rename monster "${key}" display name → "${body.name}" (key unchanged)`);
      const r = WBAPI.monsters.rename(key, body.name);
      logResponse(method, url.pathname, r.ok ? 200 : 400,
        r.ok ? `renamed "${r.from}" → "${r.to}" (key:${key}, ${r.terrains.length} terrains)` : r.error);
      return json(res, r.ok ? 200 : 400, { ...r, ...(r.ok ? monsterConnections(key) : {}) });
    }

    // POST /api/monster/:id/fork
    if (action === 'fork') {
      if (!body.newKey) {
        logResponse(method, url.pathname, 400, 'body.newKey required');
        return json(res, 400, { error:'body.newKey required' });
      }
      log('LOGIC', `Fork monster "${key}" → new key "${body.newKey}", overrides: ${JSON.stringify(body.overrides||{})}`);
      const r = WBAPI.monsters.fork(key, body.newKey, body.overrides);
      logResponse(method, url.pathname, r.ok ? 201 : 400,
        r.ok ? `forked ${key} → ${body.newKey}` : r.error);
      return json(res, r.ok ? 201 : 400, { ...r, ...(r.ok ? monsterConnections(body.newKey) : {}) });
    }

    // POST /api/terrain/:id/swap
    if (action === 'swap') {
      if (!body.oldKey || !body.newKey) {
        logResponse(method, url.pathname, 400, 'body.oldKey and body.newKey required');
        return json(res, 400, { error:'body.oldKey and body.newKey required' });
      }
      log('LOGIC', `Swap monster in terrain "${key}": "${body.oldKey}" → "${body.newKey}"`);
      const r = WBAPI.worlds.swapMonster(key, body.oldKey, body.newKey);
      logResponse(method, url.pathname, r.ok ? 200 : 400,
        r.ok ? `swapped ${body.oldKey} → ${body.newKey} in ${key}` : r.error);
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
      log('LOGIC', `Move node "${key}" → "${body.newCode}" — rewriting quest/NPC refs`);
      WBAPI.nodeMap[body.newCode] = { ...WBAPI.nodeMap[key] };
      if (WBAPI.nodeCoords[key]) { WBAPI.nodeCoords[body.newCode] = WBAPI.nodeCoords[key]; delete WBAPI.nodeCoords[key]; }
      let qUpdated = 0, nUpdated = 0;
      for (const q of Object.values(WBAPI.questDb))
        for (const f of ['activateNode','waypointNode'])
          if (q[f] === key) { q[f] = body.newCode; qUpdated++; }
      for (const n of Object.values(WBAPI.birkaNpcs))
        if (n.node === key) { n.node = body.newCode; nUpdated++; }
      log('LOGIC', `Node move complete: ${qUpdated} quests updated, ${nUpdated} NPCs updated`);
      delete WBAPI.nodeMap[key];
      WBAPI._buildIndexes();
      logResponse(method, url.pathname, 200, `moved ${key} → ${body.newCode}, quests:${qUpdated}, npcs:${nUpdated}`);
      return json(res, 200, { ok:true, from:key, to:body.newCode, questsUpdated:qUpdated, npcsUpdated:nUpdated,
        ...nodeConnections(body.newCode) });
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
  console.log(`${C.magenta}${line}${C.reset}`);
  console.log(`  Game file: ${C.cyan}${GAME_FILE}${C.reset}`);
  console.log(`  Log file:  ${C.cyan}${LOG_FILE}${C.reset}`);
  console.log(`\n  ${C.dim}Endpoints:${C.reset}`);
  const routes = [
    ['GET',    '/api/ping'],
    ['GET',    '/api/schema[/{type}]                → canonical field schema'],
    ['GET',    '/api/list/{node|quest|monster|npc|terrain}[?node=&terrain=&type=]'],
    ['GET',    '/api/{node|quest|monster|npc|terrain}/{id}  → entity + connections + _meta'],
    ['GET',    '/api/location/{code}               → composite view'],
    ['PUT',    '/api/{node|quest|monster|npc}/{id}  body: {field:value,...}'],
    ['PUT',    '/api/terrain/{id}                  body: {label?,icon?}'],
    ['DELETE', '/api/{node|quest|monster|npc}/{id}  (409 if nested content)'],
    ['POST',   '/api/monster/{id}/rename            body: {name}'],
    ['POST',   '/api/monster/{id}/fork              body: {newKey, overrides?}'],
    ['POST',   '/api/terrain/{id}/swap              body: {oldKey, newKey}'],
    ['POST',   '/api/node/{id}/move                 body: {newCode}'],
    ['POST',   '/api/save                           body: {outputPath?}'],
    ['POST',   '/api/reload'],
  ];
  const methodColor = { GET:C.green, PUT:C.yellow, DELETE:C.red, POST:C.blue };
  for (const [m, path] of routes)
    console.log(`  ${(methodColor[m]||C.white)+m.padEnd(7)+C.reset} ${C.dim}${path}${C.reset}`);
  console.log(`${C.magenta}${line}${C.reset}\n`);

  log('INFO', `Server listening on http://127.0.0.1:${PORT}`);
  logStream.write('═'.repeat(60) + '\n');
});
