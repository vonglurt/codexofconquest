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

// ── Load ────────────────────────────────────────────────────────────────────
function reload() {
  if (!fs.existsSync(GAME_FILE))
    throw new Error(`Game file not found: ${GAME_FILE}`);
  WBAPI.load(GAME_FILE);
  console.log(`[WBAPI] loaded ${path.basename(GAME_FILE)} — ` +
    `${Object.keys(WBAPI.nodeMap).length} nodes, ` +
    `${Object.keys(WBAPI.questDb).length} quests, ` +
    `${Object.keys(WBAPI.monsterPool).length} monsters`);
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

function resolveId(type, raw) {
  const col = { node:WBAPI.nodeMap, quest:WBAPI.questDb, monster:WBAPI.monsterPool, npc:WBAPI.birkaNpcs }[type];
  return col ? (WBAPI._findKey(col, raw) || raw) : raw;
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
  return new Promise((res, rej) => {
    let buf = '';
    req.on('data', c => { buf += c; if (buf.length > 1e6) rej(new Error('Body too large')); });
    req.on('end', () => { try { res(JSON.parse(buf || '{}')); } catch(e) { rej(e); } });
    req.on('error', rej);
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
  if (method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }

  // ── Health ──
  if (parts[0] === 'ping') return json(res, 200, { ok:true, loaded: WBAPI.loaded,
    file: path.basename(GAME_FILE), nodes:Object.keys(WBAPI.nodeMap).length,
    quests:Object.keys(WBAPI.questDb).length, monsters:Object.keys(WBAPI.monsterPool).length });

  // ── Reload ──
  if (parts[0] === 'reload' && method === 'POST') {
    try { reload(); return json(res, 200, { ok:true }); }
    catch(e) { return json(res, 500, { ok:false, error:e.message }); }
  }

  // ── Save ──
  if (parts[0] === 'save' && method === 'POST') {
    const body = await readBody(req).catch(() => ({}));
    const r = WBAPI.save(body.outputPath);
    return json(res, r.ok ? 200 : 500, r);
  }

  // ── Diff ──
  if (parts[0] === 'diff' && method === 'GET')
    return json(res, 200, DIFF_summary());

  // ── List ──────────────────────────────────────────────────────────────────
  if (parts[0] === 'list') {
    const type = parts[1];
    const node    = url.searchParams.get('node');
    const terrain = url.searchParams.get('terrain');
    const arc     = url.searchParams.get('arc');
    const qtype   = url.searchParams.get('type');

    if (type === 'node') {
      let list = WBAPI.nodes.all();
      if (node) list = list.filter(n => n.id === node);
      return json(res, 200, list.map(n => ({
        id: n.id, label: n.label, terrain: n.name, act: n.act,
        _meta: { quests: (WBAPI._questsByNode[n.id]||[]).length,
                 npcs:   WBAPI.npcs.byNode(n.id).length,
                 canDelete: !WBAPI._questsByNode[n.id]?.length && !WBAPI.npcs.byNode(n.id).length }
      })));
    }

    if (type === 'quest') {
      let list = WBAPI.quests.all();
      if (node)   list = list.filter(q => q.activateNode===node || q.waypointNode===node);
      if (qtype)  list = list.filter(q => q.type === qtype);
      if (arc)    list = list.filter(q => q.id.startsWith(arc));
      return json(res, 200, list.map(q => ({
        id: q.id, title: q.title, type: q.type,
        activateNode: q.activateNode, waypointNode: q.waypointNode, npc: q.npc,
        _meta: { downstream: WBAPI.quests.chain(q.id).downstream.length,
                 canDelete:  WBAPI.quests.chain(q.id).downstream.length === 0 }
      })));
    }

    if (type === 'monster') {
      let list = WBAPI.monsters.all();
      if (terrain) list = list.filter(m => m.terrains.includes(terrain));
      return json(res, 200, list.map(m => ({
        key: m.key, name: m.name, tier: m.tier, terrainCount: m.terrains.length,
        _meta: { canDelete: m.terrains.length === 0 }
      })));
    }

    if (type === 'npc') {
      let list = WBAPI.npcs.all().filter(n => !n._inline);
      if (node) list = list.filter(n => n.node === node);
      return json(res, 200, list.map(n => ({
        key: n.key, name: n.name, node: n.node, occupation: n.occupation,
        _meta: { canDelete: WBAPI._deps.npc(n.key).quests.length === 0 }
      })));
    }

    if (type === 'terrain') {
      return json(res, 200, Object.entries(WBAPI.worldDb).map(([k,v]) => ({
        key: k, monsterCount: (WBAPI._terrainToMonsters[k]||[]).length,
        nodeCount: Object.values(WBAPI.nodeMap).filter(n=>n.name===k).length,
      })));
    }

    return json(res, 404, { error: `Unknown list type: ${type}` });
  }

  // ── Single entity ─────────────────────────────────────────────────────────
  const [type, rawId] = parts;
  if (!type || !rawId) return json(res, 400, { error: 'Path: /api/{type}/{id}' });

  // ── Location (composite) ──
  if (type === 'location') {
    const r = locationConnections(rawId);
    return r ? json(res, 200, r) : json(res, 404, { error: `Location "${rawId}" not found` });
  }

  if (!CONNECT[type]) return json(res, 400, { error: `Unknown type "${type}". Use: node quest monster npc location` });

  const key = resolveId(type, rawId);

  // ── GET ──
  if (method === 'GET') {
    const r = CONNECT[type](key);
    return r ? json(res, 200, r) : json(res, 404, { error: `${type} "${rawId}" not found` });
  }

  // ── PUT ──
  if (method === 'PUT') {
    let body;
    try { body = await readBody(req); } catch(e) { return json(res, 400, { error:'Invalid JSON' }); }

    const col = { node:WBAPI.nodeMap, quest:WBAPI.questDb, monster:WBAPI.monsterPool, npc:WBAPI.birkaNpcs }[type];
    const resolvedKey = WBAPI._findKey(col, rawId) || rawId;

    // Apply each field — use editField for string fields (patches _rawSrc), put for rest
    const results = [];
    for (const [field, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        const r = WBAPI.editField(type, resolvedKey, field, value);
        results.push({ field, ok: r.ok, error: r.error });
      } else {
        const ns = { node:WBAPI.nodes, quest:WBAPI.quests, monster:WBAPI.monsters, npc:WBAPI.npcs }[type];
        const r = ns.put(resolvedKey, { [field]: value });
        results.push({ field, ok: r.ok });
      }
    }

    const allOk = results.every(r => r.ok);
    const updated = CONNECT[type](resolvedKey);
    return json(res, allOk ? 200 : 207, { ok: allOk, fields: results, ...updated });
  }

  // ── DELETE ──
  if (method === 'DELETE') {
    const r = CONNECT[type](key);
    if (!r) return json(res, 404, { error: `${type} "${rawId}" not found` });

    if (!r._meta.canDelete)
      return json(res, 409, { ok:false, error:'Delete blocked — nested content exists', blockedBy: r._meta.blockedBy, connections: r.connections });

    const ns = { node:WBAPI.nodes, quest:WBAPI.quests, monster:WBAPI.monsters, npc:WBAPI.npcs }[type];
    const del = ns.delete(key);
    return json(res, del.ok ? 200 : 409, { ...del, wasEntity: r.entity });
  }

  // ── POST (special operations) ──
  if (method === 'POST') {
    let body;
    try { body = await readBody(req); } catch(e) { return json(res, 400, { error:'Invalid JSON' }); }

    // POST /api/monster/:id/rename
    if (parts[2] === 'rename') {
      if (!body.name) return json(res, 400, { error:'body.name required' });
      const r = WBAPI.monsters.rename(key, body.name);
      return json(res, r.ok ? 200 : 400, { ...r, ...( r.ok ? monsterConnections(key) : {} ) });
    }

    // POST /api/monster/:id/fork
    if (parts[2] === 'fork') {
      if (!body.newKey) return json(res, 400, { error:'body.newKey required' });
      const r = WBAPI.monsters.fork(key, body.newKey, body.overrides);
      return json(res, r.ok ? 201 : 400, { ...r, ...( r.ok ? monsterConnections(body.newKey) : {} ) });
    }

    // POST /api/terrain/:id/swap
    if (parts[2] === 'swap') {
      if (!body.oldKey || !body.newKey) return json(res, 400, { error:'body.oldKey and body.newKey required' });
      const r = WBAPI.worlds.swapMonster(key, body.oldKey, body.newKey);
      return json(res, r.ok ? 200 : 400, r);
    }

    // POST /api/node/:id/move
    if (parts[2] === 'move') {
      if (!body.newCode) return json(res, 400, { error:'body.newCode required' });
      if (!WBAPI.nodeMap[key]) return json(res, 404, { error:`Node "${key}" not found` });
      if (WBAPI.nodeMap[body.newCode]) return json(res, 409, { error:`Code "${body.newCode}" already exists` });

      WBAPI.nodeMap[body.newCode] = { ...WBAPI.nodeMap[key] };
      if (WBAPI.nodeCoords[key]) { WBAPI.nodeCoords[body.newCode] = WBAPI.nodeCoords[key]; delete WBAPI.nodeCoords[key]; }
      let qUpdated = 0, nUpdated = 0;
      for (const q of Object.values(WBAPI.questDb))
        for (const f of ['activateNode','waypointNode'])
          if (q[f] === key) { q[f] = body.newCode; qUpdated++; }
      for (const n of Object.values(WBAPI.birkaNpcs))
        if (n.node === key) { n.node = body.newCode; nUpdated++; }
      delete WBAPI.nodeMap[key];
      WBAPI._buildIndexes();
      return json(res, 200, { ok:true, from:key, to:body.newCode, questsUpdated:qUpdated, npcsUpdated:nUpdated,
        ...nodeConnections(body.newCode) });
    }
  }

  json(res, 405, { error:`Method ${method} not allowed on ${url.pathname}` });
}

// ── Diff summary ─────────────────────────────────────────────────────────────
function DIFF_summary() {
  // WBAPI tracks edits via _rawSrc patches; surface a summary
  return { note: 'Use POST /api/save to write all pending changes to disk' };
}

// ═══════════════════════════════════════════════════════════════════════════
// Server
// ═══════════════════════════════════════════════════════════════════════════
const server = http.createServer(async (req, res) => {
  try { await route(req, res); }
  catch(e) { json(res, 500, { error: e.message }); }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\nWBAPI Server — http://localhost:${PORT}/api`);
  console.log(`  GET    /api/ping`);
  console.log(`  GET    /api/list/{node|quest|monster|npc|terrain}[?node=&terrain=&type=]`);
  console.log(`  GET    /api/{node|quest|monster|npc}/{id}`);
  console.log(`  GET    /api/location/{code}`);
  console.log(`  PUT    /api/{node|quest|monster|npc}/{id}    body: {field:value,...}`);
  console.log(`  DELETE /api/{node|quest|monster|npc}/{id}    (blocked if nested content)`);
  console.log(`  POST   /api/monster/{id}/rename              body: {name}`);
  console.log(`  POST   /api/monster/{id}/fork                body: {newKey, overrides?}`);
  console.log(`  POST   /api/terrain/{id}/swap                body: {oldKey, newKey}`);
  console.log(`  POST   /api/node/{id}/move                   body: {newCode}`);
  console.log(`  POST   /api/save                             body: {outputPath?}`);
  console.log(`  POST   /api/reload`);
  console.log(`\nGame file: ${GAME_FILE}\n`);
});
