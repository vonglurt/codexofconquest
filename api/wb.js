#!/usr/bin/env node
'use strict';
// api/wb.js — Roll2Hit WBAPI CLI wrapper
// SDK-pattern queue with retry/backoff; Claude AI assist via --ai

const http  = require('http');
const https = require('https');
const fs    = require('fs');

// ── ANSI ──────────────────────────────────────────────────────────────────────
const TTY = process.stdout.isTTY;
const C = TTY ? {
  reset:'\x1b[0m', bold:'\x1b[1m', dim:'\x1b[2m',
  cyan:'\x1b[36m', green:'\x1b[32m', yellow:'\x1b[33m',
  red:'\x1b[31m', blue:'\x1b[34m', white:'\x1b[37m',
} : new Proxy({}, { get: () => '' });

// ── Config (overridable via flags / env) ──────────────────────────────────────
let   BASE     = process.env.WBAPI_URL || 'http://localhost:1367';
let   RETRIES  = 3;
let   TIMEOUT  = 10_000;
const AI_KEY   = process.env.ANTHROPIC_API_KEY;
const AI_MODEL = 'claude-haiku-4-5-20251001';

// ── Arg parser ─────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const flags = {}, pos = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key  = argv[i].slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) { flags[key] = next; i++; }
      else flags[key] = true;
    } else {
      pos.push(argv[i]);
    }
  }
  return { flags, pos };
}

// ── Request queue — serialises all API calls (SDK pattern) ────────────────────
class Queue {
  constructor() { this._q = []; this._busy = false; }
  run(fn) {
    return new Promise((res, rej) => {
      this._q.push({ fn, res, rej });
      this._tick();
    });
  }
  async _tick() {
    if (this._busy || !this._q.length) return;
    this._busy = true;
    const { fn, res, rej } = this._q.shift();
    try { res(await fn()); } catch (e) { rej(e); }
    this._busy = false;
    this._tick();
  }
}
const Q = new Queue();

// ── Raw HTTP (http + https) ────────────────────────────────────────────────────
function doHTTP(method, urlStr, body, extraHeaders = {}) {
  return new Promise((res, rej) => {
    const u    = new URL(urlStr);
    const mod  = u.protocol === 'https:' ? https : http;
    const str  = body ? JSON.stringify(body) : null;
    const req  = mod.request({
      hostname : u.hostname,
      port     : u.port || (u.protocol === 'https:' ? 443 : 80),
      path     : u.pathname + u.search,
      method,
      timeout  : TIMEOUT,
      headers  : {
        'Content-Type': 'application/json',
        ...(str ? { 'Content-Length': Buffer.byteLength(str) } : {}),
        ...extraHeaders,
      },
    }, resp => {
      let raw = '';
      resp.on('data', c => raw += c);
      resp.on('end', () => {
        let json;
        try { json = JSON.parse(raw); } catch { json = { raw }; }
        res({ status: resp.statusCode, body: json, raw });
      });
    });
    req.on('timeout', () => { req.destroy(); rej(Object.assign(new Error('TIMEOUT'), { code: 'TIMEOUT' })); });
    req.on('error',   rej);
    if (str) req.write(str);
    req.end();
  });
}

// ── HTTP with exponential backoff retry (SDK pattern) ─────────────────────────
const RETRYABLE = new Set(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'TIMEOUT', 'ENOTFOUND']);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function request(method, urlPath, body = null, extraHeaders = {}) {
  const url = `${BASE}${urlPath}`;
  return Q.run(async () => {
    let lastErr;
    for (let i = 0; i <= RETRIES; i++) {
      if (i > 0) {
        const d = Math.min(1000 * 2 ** (i - 1), 8000);
        stderr(`${C.yellow}↻ retry ${i}/${RETRIES}${C.reset} (${d}ms)\n`);
        await sleep(d);
      }
      try {
        const r = await doHTTP(method, url, body, extraHeaders);
        if (r.status >= 500 && i < RETRIES) { lastErr = r; continue; }
        return r;
      } catch (e) {
        lastErr = e;
        if (RETRYABLE.has(e.code) && i < RETRIES) continue;
        throw e;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(`HTTP ${lastErr?.status}`);
  });
}

// ── Output ─────────────────────────────────────────────────────────────────────
function stderr(s) { process.stderr.write(s); }
function die(msg)  { stderr(`${C.red}✗${C.reset} ${msg}\n`); process.exit(1); }
function ok(msg)   { process.stdout.write(`${C.green}✓${C.reset} ${msg}\n`); }
function info(msg) { if (TTY) stderr(`${C.dim}  ${msg}${C.reset}\n`); }

function printResult(data, flags) {
  const out = flags.raw
    ? (typeof data === 'string' ? data : JSON.stringify(data))
    : (typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  if (flags.out) {
    fs.writeFileSync(flags.out, out + '\n');
    ok(`→ ${flags.out}`);
  } else {
    process.stdout.write(out + '\n');
  }
}

function printError(r) {
  const col = r.status >= 500 ? C.red : C.yellow;
  const msg = r.body?.error || r.body?.message || r.raw || JSON.stringify(r.body);
  stderr(`${col}HTTP ${r.status}${C.reset} ${msg}\n`);
  // When piped (not a TTY), emit the response body as JSON to stdout so pipe consumers can parse it
  if (!TTY && r.body) process.stdout.write(JSON.stringify(r.body, null, 2) + '\n');
}

// ── k=v pair parser (inline body args) ────────────────────────────────────────
function parseKV(args) {
  const obj = {};
  for (const a of args) {
    const idx = a.indexOf('=');
    if (idx < 0) continue;
    const k = a.slice(0, idx);
    const v = a.slice(idx + 1);
    try { obj[k] = JSON.parse(v); } catch { obj[k] = v; }
  }
  return obj;
}

// ── Nonce helper ───────────────────────────────────────────────────────────────
async function getNonce(type, id) {
  const r = await request('POST', '/api/nonce', { type, id });
  if (r.status !== 200) die(`Nonce failed (${r.status}): ${r.body?.error || JSON.stringify(r.body)}`);
  info(`nonce acquired for ${type}:${id}`);
  return r.body.nonce;
}

// ── Read stdin (piped JSON or plain text) ──────────────────────────────────────
function readStdin() {
  return new Promise((res) => {
    if (process.stdin.isTTY) { res(null); return; }
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', c => data += c);
    process.stdin.on('end', () => {
      const s = data.trim();
      if (!s) { res(null); return; }
      try { res(JSON.parse(s)); } catch { res(s); }
    });
  });
}

// ── Claude AI assistant ────────────────────────────────────────────────────────
const AI_SYSTEM = `You are a concise assistant for the Roll2Hit World Builder API (WBAPI) at localhost:1367.
The game is a D&D 5e world stored in a single HTML file. The API manages: nodes (map locations), quests, monsters, npcs, terrain.

./api.sh CLI cheatsheet:
  ./api.sh ping                                 check server
  ./api.sh count [nodes|quests|monsters|npcs|terrains|coords]  breakdown stats
  ./api.sh get <type> <id>                      fetch entity JSON
  ./api.sh list [type]                          list (no type = index)
  ./api.sh list ids <type>                      IDs-only array
  ./api.sh list node --act N --terrain X --q text --no-coords --has-quests bool --junction bool --ids
  ./api.sh list quest --node X --type X --arc X --npc X --monster X --has-npc bool --ids
  ./api.sh list monster --terrain X --tier X --has-drop bool --no-terrain --ids
  ./api.sh list npc --node X --occupation X --q text --ids
  ./api.sh put <type> <id> k=v [k=v]            update fields
  ./api.sh post <type> k=v [k=v]                create entity (nonce auto-handled)
  ./api.sh del <type> <id>                      delete (nonce auto-handled)
  ./api.sh audit [--map]                        integrity scan
  ./api.sh chain <quest-id>                     quest dependency chain
  ./api.sh export <collection>                  dump JSON (node_map quest_db monster_pool world_db all)
  ./api.sh location [code]                      composite view (no code = list all)
  ./api.sh speak <npc> "<prompt>" --state neutral|friendly|dearFriend
  ./api.sh import <file.json>                   bulk import

Reply in 1–3 lines. Lead with a concrete ./api.sh command when applicable.`;

async function askClaude(prompt) {
  if (!AI_KEY) die('ANTHROPIC_API_KEY not set — needed for --ai');
  info('asking Claude...');
  const r = await doHTTP('POST', 'https://api.anthropic.com/v1/messages', {
    model: AI_MODEL, max_tokens: 256, system: AI_SYSTEM,
    messages: [{ role: 'user', content: String(prompt) }],
  }, {
    'x-api-key': AI_KEY,
    'anthropic-version': '2023-06-01',
  });
  if (r.status !== 200) die(`Claude ${r.status}: ${r.body?.error?.message || JSON.stringify(r.body)}`);
  return r.body?.content?.[0]?.text || '(no response)';
}

// ── Server health guard ────────────────────────────────────────────────────────
async function requireServer() {
  try {
    const r = await doHTTP('GET', `${BASE}/api/ping`, null);
    if (r.status === 200) return;
  } catch {}
  die(`WBAPI server not running at ${BASE}\n  Start: ./wbapi-toggle.sh start`);
}

// ══════════════════════════════════════════════════════════════════════════════
// Commands
// ══════════════════════════════════════════════════════════════════════════════

const CMD = {

  async ping(pos, flags) {
    try {
      const r = await doHTTP('GET', `${BASE}/api/ping`, null);
      if (r.status === 200) ok(`server alive  ${C.dim}${BASE}${C.reset}`);
      else die(`ping returned HTTP ${r.status}`);
    } catch (e) {
      die(`server not responding at ${BASE}  (${e.message})`);
    }
  },

  async get(pos, flags) {
    await requireServer();
    const [, type, id] = pos;
    if (!type || !id) die('Usage: ./api.sh get <type> <id>');
    const r = await request('GET', `/api/${type}/${encodeURIComponent(id)}`);
    if (r.status !== 200) { printError(r); process.exit(1); }
    printResult(r.body, flags);
  },

  async list(pos, flags) {
    await requireServer();
    const [, type] = pos;
    if (!type) {
      const r = await request('GET', '/api/list');
      if (r.status !== 200) { printError(r); process.exit(1); }
      printResult(r.body, flags);
      return;
    }
    // ids-only shorthand: ./api.sh list ids node  OR  ./api.sh list node --ids
    if (type === 'ids') {
      const subtype = pos[2];
      if (!subtype) die('Usage: ./api.sh list ids <node|quest|monster|npc|terrain>');
      const r = await request('GET', `/api/list/ids/${subtype}`);
      if (r.status !== 200) { printError(r); process.exit(1); }
      printResult(r.body, flags);
      return;
    }
    const qs = new URLSearchParams();
    // universal
    if (flags.node)        qs.set('node',        flags.node);
    if (flags.terrain)     qs.set('terrain',     flags.terrain);
    if (flags.type)        qs.set('type',        flags.type);
    if (flags.act)         qs.set('act',         flags.act);
    if (flags.q)           qs.set('q',           flags.q);
    if (flags.ids)         qs.set('ids',         'true');
    // node-specific
    if (flags['no-coords'])  qs.set('no_coords',  'true');
    if (flags['has-quests']) qs.set('has_quests', flags['has-quests']);
    if (flags.junction)      qs.set('junction',   flags.junction);
    // quest-specific
    if (flags.arc)           qs.set('arc',         flags.arc);
    if (flags.npc)           qs.set('npc',         flags.npc);
    if (flags.monster)       qs.set('monster',     flags.monster);
    if (flags['has-npc'])    qs.set('has_npc',     flags['has-npc']);
    if (flags.complete)      qs.set('complete',    flags.complete);
    // monster-specific
    if (flags.tier)          qs.set('tier',        flags.tier);
    if (flags['has-drop'])   qs.set('has_drop',    flags['has-drop']);
    if (flags['no-terrain']) qs.set('no_terrain',  'true');
    // npc-specific
    if (flags.occupation)    qs.set('occupation',  flags.occupation);
    const q = qs.size ? '?' + qs.toString() : '';
    const r = await request('GET', `/api/list/${type}${q}`);
    if (r.status !== 200) { printError(r); process.exit(1); }
    printResult(r.body, flags);
  },

  async count(pos, flags) {
    await requireServer();
    const [, subtype] = pos;
    const path = subtype ? `/api/count/${subtype}` : '/api/count';
    const r = await request('GET', path);
    if (r.status !== 200) { printError(r); process.exit(1); }
    printResult(r.body, flags);
  },

  async put(pos, flags) {
    await requireServer();
    const [, type, id, ...rest] = pos;
    if (!type || !id) die('Usage: ./api.sh put <type> <id> [k=v ...]  (or pipe JSON)');
    const piped = await readStdin();
    const body  = Object.assign(
      typeof piped === 'object' && piped ? piped : {},
      parseKV(rest),
    );
    if (!Object.keys(body).length) die('No fields. Provide k=v pairs or pipe JSON.');
    const r = await request('PUT', `/api/${type}/${encodeURIComponent(id)}`, body);
    if (r.status >= 400) { printError(r); process.exit(1); }
    printResult(r.body, flags);
  },

  async post(pos, flags) {
    await requireServer();
    const [, type, ...rest] = pos;
    if (!type) die('Usage: ./api.sh post <type> [k=v ...]  (or pipe JSON)');
    const piped = await readStdin();
    const body  = Object.assign(
      typeof piped === 'object' && piped ? piped : {},
      parseKV(rest),
    );
    const entityId  = body.id || body.key || body.code;
    const hdrs = {};
    if (entityId) {
      hdrs['X-Nonce'] = await getNonce(type, String(entityId));
    }
    const r = await request('POST', `/api/${type}`, body, hdrs);
    if (r.status >= 400) { printError(r); process.exit(1); }
    printResult(r.body, flags);
  },

  async del(pos, flags) {
    await requireServer();
    const [, type, id] = pos;
    if (!type || !id) die('Usage: ./api.sh del <type> <id>');
    const nonce = await getNonce(type, id);
    const r = await request('DELETE', `/api/${type}/${encodeURIComponent(id)}`, null, { 'X-Nonce': nonce });
    if (r.status >= 400) { printError(r); process.exit(1); }
    ok(`${type}:${id} deleted`);
  },

  async audit(pos, flags) {
    await requireServer();
    const path = flags.map ? '/api/audit/map' : '/api/audit';
    const q    = flags.text ? '?format=text' : '';
    const r    = await request('GET', path + q);
    if (r.status !== 200) { printError(r); process.exit(1); }
    printResult(r.body, flags);
  },

  async chain(pos, flags) {
    await requireServer();
    const [, id] = pos;
    if (!id) die('Usage: ./api.sh chain <quest-id>');
    const r = await request('GET', `/api/quest/${encodeURIComponent(id)}/chain`);
    if (r.status !== 200) { printError(r); process.exit(1); }
    printResult(r.body, flags);
  },

  async export(pos, flags) {
    await requireServer();
    const [, collection] = pos;
    if (!collection) die('Usage: ./api.sh export <node_map|quest_db|monster_pool|world_db>  [--format json|js|module]');
    const fmt = flags.format || 'json';
    const r   = await request('GET', `/api/export/${collection}?format=${fmt}`);
    if (r.status !== 200) { printError(r); process.exit(1); }
    printResult(r.body, flags);
  },

  async location(pos, flags) {
    await requireServer();
    const [, code] = pos;
    if (!code) {
      // list all locations with optional filters
      const qs = new URLSearchParams();
      if (flags.act)           qs.set('act',        flags.act);
      if (flags.terrain)       qs.set('terrain',    flags.terrain);
      if (flags.q)             qs.set('q',          flags.q);
      if (flags['has-quests']) qs.set('has_quests', flags['has-quests']);
      if (flags.ids)           qs.set('ids',        'true');
      const q = qs.size ? '?' + qs.toString() : '';
      const r = await request('GET', `/api/location${q}`);
      if (r.status !== 200) { printError(r); process.exit(1); }
      printResult(r.body, flags);
      return;
    }
    const r = await request('GET', `/api/location/${encodeURIComponent(code)}`);
    if (r.status !== 200) { printError(r); process.exit(1); }
    printResult(r.body, flags);
  },

  async nonce(pos, flags) {
    await requireServer();
    const [, type, id] = pos;
    if (!type || !id) die('Usage: ./api.sh nonce <type> <id>');
    const nonce = await getNonce(type, id);
    process.stdout.write(nonce + '\n');
  },

  async ai(pos, flags) {
    const prompt = pos.slice(1).join(' ');
    if (!prompt) die('Usage: ./api.sh ai "<question>"');
    const reply = await askClaude(prompt);
    process.stdout.write(`${C.cyan}${reply}${C.reset}\n`);
  },

  async speak(pos, flags) {
    await requireServer();
    const [, id, ...rest] = pos;
    if (!id) die('Usage: ./api.sh speak <npc-id> "<prompt>"  [--state neutral|friendly|dearFriend] [--model <model>]');
    const prompt = rest.join(' ') || 'Good afternoon.';
    const qs = new URLSearchParams({ prompt });
    if (flags.state) qs.set('state', flags.state);
    if (flags.model) qs.set('model', flags.model);
    const r = await request('GET', `/api/npc/${encodeURIComponent(id)}/speak?${qs}`);
    if (r.status >= 400) { printError(r); process.exit(1); }
    const d = r.body;
    process.stdout.write(`\n${C.bold}${d.name}${C.reset}  ${C.dim}[${d.state}]${C.reset}\n`);
    process.stdout.write(`${C.cyan}${d.reply}${C.reset}\n\n`);
    if (TTY) {
      stderr(`${C.dim}model: ${d.model}  in:${d.usage?.input} out:${d.usage?.output} cache_read:${d.usage?.cacheRead} cache_write:${d.usage?.cacheWrite}${C.reset}\n`);
    }
  },

  async import(pos, flags) {
    await requireServer();
    const [, file] = pos;
    const piped = await readStdin();
    let body;
    if (piped && typeof piped === 'object') {
      body = piped;
    } else if (file) {
      if (!fs.existsSync(file)) die(`File not found: ${file}`);
      try { body = JSON.parse(fs.readFileSync(file, 'utf8')); }
      catch(e) { die(`Invalid JSON in ${file}: ${e.message}`); }
    } else {
      die('Usage: ./api.sh import <file.json>  (or pipe JSON)');
    }
    const acts = (body.cycles || []).reduce((s, c) => s + (c.acts || []).length, 0);
    info(`importing ${body.book || '?'} — ${(body.nodes||[]).length} node(s), ${acts} act(s)`);
    const r = await request('POST', '/api/import/book', body);
    if (r.status >= 400) { printError(r); process.exit(1); }
    const d = r.body;
    if (d.nodesCreated?.length)  ok(`nodes created:   ${d.nodesCreated.join(', ')}`);
    if (d.nodesSkipped?.length)  info(`nodes skipped:   ${d.nodesSkipped.join(', ')}`);
    if (d.questsCreated?.length) ok(`quests created:  ${d.questsCreated.length}  (${d.questsCreated[0]} … ${d.questsCreated[d.questsCreated.length - 1]})`);
    if (d.questsSkipped?.length) info(`quests skipped:  ${d.questsSkipped.length}`);
    if (d.errors?.length)        stderr(`${C.red}errors (${d.errors.length}): ${JSON.stringify(d.errors)}${C.reset}\n`);
    if (d.total)                 info(`baseline: ${d.total.nodes} nodes  ${d.total.quests} quests`);
    if (flags.out) { fs.writeFileSync(flags.out, JSON.stringify(d, null, 2) + '\n'); ok(`→ ${flags.out}`); }
  },

  help() { process.stdout.write(HELP + '\n'); },
};

// ── Help ───────────────────────────────────────────────────────────────────────
const HELP = `
${C.bold}./api.sh${C.reset}  —  Roll2Hit World Builder CLI  ${C.dim}(delegates to api/wb.js → localhost:1367)${C.reset}

  ./api.sh <command> [args] [options]

  Every command talks to the WBAPI server running at localhost:1367.
  Start the server first:  ${C.dim}./wbapi-toggle.sh start${C.reset}

${C.bold}═══════════════════════════════════════════════════════════════════
  COMMAND INDEX
═══════════════════════════════════════════════════════════════════${C.reset}

  ${C.green}ping${C.reset}                   Check server health and data counts
  ${C.green}count${C.reset} [subtype]        Breakdown statistics for a collection
  ${C.green}get${C.reset} <type> <id>        Fetch one entity with full detail
  ${C.green}list${C.reset} [type] [filters]  List a collection (no type = index)
  ${C.green}list ids${C.reset} <type>        Compact ID/key array for any type
  ${C.green}location${C.reset} [code]        Composite node view (no code = list all)
  ${C.green}chain${C.reset} <quest-id>       Quest dependency chain
  ${C.green}put${C.reset} <type> <id> [k=v]  Edit one or more fields
  ${C.green}post${C.reset} <type> [k=v]      Create a new entity
  ${C.green}del${C.reset} <type> <id>        Delete an entity
  ${C.green}audit${C.reset} [--map]          Integrity scan
  ${C.green}export${C.reset} <collection>    Export data as JSON / JS / ES module
  ${C.green}import${C.reset} <file.json>     Bulk import nodes + quest cycles
  ${C.green}speak${C.reset} <npc> "<prompt>" Claude-voiced NPC dialogue
  ${C.green}nonce${C.reset} <type> <id>      Get a one-time write token
  ${C.green}ai${C.reset} "<question>"        Ask Claude about the API

  Entity types:  ${C.dim}node  quest  monster  npc  terrain${C.reset}
  Export collections:  ${C.dim}node_map  quest_db  monster_pool  world_db  all${C.reset}

${C.bold}═══════════════════════════════════════════════════════════════════
  GLOBAL OPTIONS  (work on every command)
═══════════════════════════════════════════════════════════════════${C.reset}

  --server <url>      Override base URL           default: $WBAPI_URL or http://localhost:1367
  --out <file>        Write output to file        instead of stdout
  --raw               Compact JSON                no pretty-print
  --format <fmt>      Export format               json | js | module
  --retry <n>         Max retries on 5xx          default: 3  (backoff: 1s 2s 4s)
  --timeout <ms>      Per-request timeout         default: 10000 (10 s)
  --ai "<prompt>"     Ask Claude (no subcommand needed)

  Environment:
    WBAPI_URL           Override base URL
    ANTHROPIC_API_KEY   Required for ./api.sh ai and ./api.sh speak

${C.bold}═══════════════════════════════════════════════════════════════════
  ping — server health
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh ping

  Returns: ok, loaded, file, nodes, quests, monsters, fish, lakeMagic.
  Exit 0 on success; exit 1 if server is unreachable.

  Examples:
    ./api.sh ping
    ./api.sh ping --server http://192.168.1.10:1367
    ./api.sh ping --raw

${C.bold}═══════════════════════════════════════════════════════════════════
  count — breakdown statistics
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh count [subtype]

  No subtype: master count for all collections in one call.
  Subtypes: nodes | quests | monsters | npcs | terrains | coords

  Master count returns:
    totals.{nodes, quests, monsters, terrains, npcs, coords}
    byAct          — node count per act number
    byType         — quest count per type
    byTier         — monster count per tier

  Subtype responses:
    nodes     → total, byAct, byTerrain, junctionCount, nodesWithCoords, nodesWithoutCoordsList
    quests    → total, byType, topArcs (most quests), topNodes (most activate nodes)
    monsters  → total, byTier, withDrops, withoutDrops, withTerrain, withoutTerrain
    npcs      → total, byNode, questCounts (quests referencing each NPC)
    terrains  → total, withMonsters, emptyTerrains, usedByNodes, unusedByNodes
    coords    → total, inNodeMap, orphanCoords, nodesWithoutCoordsList

  Examples:
    ./api.sh count
    ./api.sh count nodes
    ./api.sh count quests
    ./api.sh count monsters
    ./api.sh count npcs
    ./api.sh count terrains
    ./api.sh count coords
    ./api.sh count nodes --raw
    ./api.sh count quests --out /tmp/quest-stats.json

${C.bold}═══════════════════════════════════════════════════════════════════
  get — fetch one entity
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh get <type> <id>

  Returns: entity (all fields), connections (related data), _meta (canDelete, blockedBy).
  Unknown id returns verbose 404 with full list of valid IDs for that type.

  Node response includes:
    coords {r,c}, links{N,E,S,W} with full target objects,
    questCount, questIds[], npcCount, terrain details

  Quest response includes:
    nodeDetails (full node for activateNode), npcDetails (full NPC if set),
    all fields explicit (null if unset — not omitted)

  Monster response includes:
    drop object, questCount, terrainDetails[] with node lists

  NPC response includes:
    nodeDetails, questCount, questIds[], questsDetail[]

  Examples:
    ./api.sh get node LHR
    ./api.sh get node BK
    ./api.sh get node TLL
    ./api.sh get node KRN
    ./api.sh get node FRO
    ./api.sh get node TRD
    ./api.sh get node SDQ
    ./api.sh get quest mq_1
    ./api.sh get quest mq_2
    ./api.sh get quest mq_3
    ./api.sh get quest mq_4
    ./api.sh get quest mq_5
    ./api.sh get quest mq_6
    ./api.sh get quest mq_7
    ./api.sh get quest sq_1
    ./api.sh get quest sq_2
    ./api.sh get quest quest_wis_01
    ./api.sh get monster goblin
    ./api.sh get monster skeleton
    ./api.sh get monster shadow
    ./api.sh get monster bandit
    ./api.sh get monster wolf
    ./api.sh get monster leshen
    ./api.sh get npc yael
    ./api.sh get npc brynn
    ./api.sh get npc archivus_sweelinck
    ./api.sh get terrain city
    ./api.sh get terrain forest
    ./api.sh get terrain crypt
    ./api.sh get terrain inn
    ./api.sh get terrain tavern
    ./api.sh get terrain goblin_cave
    ./api.sh get terrain hag_swamp
    ./api.sh get node LHR --raw
    ./api.sh get quest mq_1 --out /tmp/mq1.json

${C.bold}═══════════════════════════════════════════════════════════════════
  list — collection listing with filters
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh list [type] [filters]

  No type: shows index of all list types with counts + available filters.
  Each list type supports ?ids=true → {count, ids:[…]} compact response.

  ── list node ────────────────────────────────────────────────────

  Flags:
    --act <n>              Filter by act number (1–5)
    --terrain <key>        Filter by terrain key (city, forest, crypt…)
    --q <text>             Substring search on label / code
    --no-coords            Only nodes without coordinates
    --has-quests true|false  Filter by quest presence
    --junction true|false  true = junction nodes (J*); false = named nodes
    --ids                  Return {count, ids:[…]}

  Examples:
    ./api.sh list
    ./api.sh list node
    ./api.sh list node --act 1
    ./api.sh list node --act 2
    ./api.sh list node --act 3
    ./api.sh list node --act 4
    ./api.sh list node --act 5
    ./api.sh list node --terrain city
    ./api.sh list node --terrain forest
    ./api.sh list node --terrain crypt
    ./api.sh list node --terrain inn
    ./api.sh list node --terrain tavern
    ./api.sh list node --terrain goblin_cave
    ./api.sh list node --terrain hag_swamp
    ./api.sh list node --terrain beach
    ./api.sh list node --terrain junction
    ./api.sh list node --q birka
    ./api.sh list node --q forest
    ./api.sh list node --q crypt
    ./api.sh list node --no-coords
    ./api.sh list node --has-quests true
    ./api.sh list node --has-quests false
    ./api.sh list node --junction true
    ./api.sh list node --junction false
    ./api.sh list node --act 1 --terrain city
    ./api.sh list node --act 3 --has-quests true
    ./api.sh list node --terrain forest --has-quests true
    ./api.sh list node --junction false --has-quests false
    ./api.sh list node --no-coords --ids
    ./api.sh list node --act 1 --ids
    ./api.sh list node --ids

  ── list quest ───────────────────────────────────────────────────

  Flags:
    --type <type>          main | side | combat | skill_check | mission_bit | hunt
    --node <code>          Quests at this node (activateNode or waypointNode)
    --arc <prefix>         ID prefix filter (mq_, sq_, quest_wis…)
    --npc <key>            Quests assigned to this NPC key
    --monster <key>        Quests referencing this monster key
    --has-npc true|false   Filter by NPC presence
    --complete true|false  Filter by completeFn presence
    --q <text>             Text search on title / id
    --ids                  Return IDs only

  Examples:
    ./api.sh list quest
    ./api.sh list quest --type main
    ./api.sh list quest --type side
    ./api.sh list quest --type combat
    ./api.sh list quest --type skill_check
    ./api.sh list quest --type mission_bit
    ./api.sh list quest --node LHR
    ./api.sh list quest --node BK
    ./api.sh list quest --node TLL
    ./api.sh list quest --node KRN
    ./api.sh list quest --node FRO
    ./api.sh list quest --node TRD
    ./api.sh list quest --arc mq_
    ./api.sh list quest --arc sq_
    ./api.sh list quest --arc quest_wis
    ./api.sh list quest --npc yael
    ./api.sh list quest --npc brynn
    ./api.sh list quest --monster goblin
    ./api.sh list quest --monster skeleton
    ./api.sh list quest --monster leshen
    ./api.sh list quest --has-npc true
    ./api.sh list quest --has-npc false
    ./api.sh list quest --complete true
    ./api.sh list quest --q shard
    ./api.sh list quest --q goblin
    ./api.sh list quest --q "the road"
    ./api.sh list quest --type side --node LHR
    ./api.sh list quest --type main --ids
    ./api.sh list quest --arc mq_ --ids
    ./api.sh list quest --has-npc true --type side
    ./api.sh list quest --ids

  ── list monster ─────────────────────────────────────────────────

  Flags:
    --terrain <key>        Monsters in this terrain
    --tier <tier>          trivial | easy | medium | hard | boss
    --has-drop true|false  Filter by loot drop presence
    --no-terrain           Monsters not in any terrain (orphans)
    --q <text>             Text search on name / key
    --ids                  Return keys only

  Examples:
    ./api.sh list monster
    ./api.sh list monster --terrain city
    ./api.sh list monster --terrain forest
    ./api.sh list monster --terrain crypt
    ./api.sh list monster --terrain inn
    ./api.sh list monster --terrain tavern
    ./api.sh list monster --terrain goblin_cave
    ./api.sh list monster --terrain hag_swamp
    ./api.sh list monster --terrain beach
    ./api.sh list monster --terrain sewers
    ./api.sh list monster --terrain vampire_castle
    ./api.sh list monster --tier trivial
    ./api.sh list monster --tier easy
    ./api.sh list monster --tier medium
    ./api.sh list monster --tier hard
    ./api.sh list monster --tier boss
    ./api.sh list monster --has-drop true
    ./api.sh list monster --has-drop false
    ./api.sh list monster --no-terrain
    ./api.sh list monster --q vampire
    ./api.sh list monster --q dragon
    ./api.sh list monster --q ghost
    ./api.sh list monster --q shadow
    ./api.sh list monster --q wraith
    ./api.sh list monster --tier easy --has-drop true
    ./api.sh list monster --tier boss --ids
    ./api.sh list monster --terrain crypt --tier easy
    ./api.sh list monster --no-terrain --ids
    ./api.sh list monster --ids

  ── list npc ─────────────────────────────────────────────────────

  Flags:
    --node <code>          NPCs at this node
    --occupation <text>    Occupation substring filter
    --q <text>             Text search on name / key
    --ids                  Return keys only

  Examples:
    ./api.sh list npc
    ./api.sh list npc --node LHR
    ./api.sh list npc --node TLL
    ./api.sh list npc --node KRN
    ./api.sh list npc --occupation innkeeper
    ./api.sh list npc --occupation merchant
    ./api.sh list npc --occupation guard
    ./api.sh list npc --occupation captain
    ./api.sh list npc --q yael
    ./api.sh list npc --q brynn
    ./api.sh list npc --ids

  ── list terrain ─────────────────────────────────────────────────

  Flags:
    --q <text>   Text search on label / key
    --ids        Return keys only

  Examples:
    ./api.sh list terrain
    ./api.sh list terrain --q city
    ./api.sh list terrain --q forest
    ./api.sh list terrain --q swamp
    ./api.sh list terrain --q crypt
    ./api.sh list terrain --q cave
    ./api.sh list terrain --ids

  ── list ids <type> ──────────────────────────────────────────────

  Returns {type, count, ids:[…]} — no full objects.

  Examples:
    ./api.sh list ids node
    ./api.sh list ids quest
    ./api.sh list ids monster
    ./api.sh list ids npc
    ./api.sh list ids terrain

${C.bold}═══════════════════════════════════════════════════════════════════
  location — composite node view
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh location [code] [filters]

  No code: list all locations with counts (filterable).
  With code: node + monsters + quests + NPCs in one response.

  Location list flags (no code):
    --act <n>              Filter by act number
    --terrain <key>        Filter by terrain key
    --q <text>             Search on label / code
    --has-quests true|false  Filter by quest presence
    --ids                  Return {count, ids:[…]}

  Examples — list form:
    ./api.sh location
    ./api.sh location --act 1
    ./api.sh location --act 2
    ./api.sh location --act 3
    ./api.sh location --act 4
    ./api.sh location --act 5
    ./api.sh location --terrain city
    ./api.sh location --terrain forest
    ./api.sh location --terrain crypt
    ./api.sh location --terrain inn
    ./api.sh location --terrain goblin_cave
    ./api.sh location --has-quests true
    ./api.sh location --has-quests false
    ./api.sh location --q birka
    ./api.sh location --q crypt
    ./api.sh location --act 1 --has-quests true
    ./api.sh location --terrain forest --has-quests true
    ./api.sh location --ids
    ./api.sh location --act 3 --ids

  Examples — detail form:
    ./api.sh location LHR
    ./api.sh location BK
    ./api.sh location TLL
    ./api.sh location KRN
    ./api.sh location FRO
    ./api.sh location TRD
    ./api.sh location SDQ
    ./api.sh location LHR --out /tmp/lhr-location.json

${C.bold}═══════════════════════════════════════════════════════════════════
  chain — quest dependency chain
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh chain <quest-id>

  Returns upstream (quests that must complete before this) and
  downstream (quests unlocked by this one). Also reports canDelete.

  Examples:
    ./api.sh chain mq_1
    ./api.sh chain mq_2
    ./api.sh chain mq_3
    ./api.sh chain mq_4
    ./api.sh chain mq_5
    ./api.sh chain mq_6
    ./api.sh chain mq_7
    ./api.sh chain sq_1
    ./api.sh chain sq_2
    ./api.sh chain quest_wis_01
    ./api.sh chain mq_1 --raw

${C.bold}═══════════════════════════════════════════════════════════════════
  put — edit one or more fields
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh put <type> <id> <field>=<value> [field=value …]

  Values are auto-coerced: numbers for ac/hp/atk/act/sleepCost etc.,
  null clears a field, true/false for booleans.
  Pipe JSON body for multi-field or long-text updates.

  Editable node fields:
    label  name (terrain key)  act  text  npc  loot  sleep  sleepCost
    N  E  S  W  (set to node code or null to clear)

  Editable quest fields:
    title  type  desc  hint  passText  failText  rewardText
    activateNode  waypointNode  npc  xpAward  reward
    checkDC  checkStat  checkSkill

  Editable monster fields:
    name  ac  hp  atk  dmgDie  dmgCount  dmgFlat  tier

  Editable terrain fields:
    label  icon

  Examples — node:
    ./api.sh put node LHR label="City Streets — Birka (Revised)"
    ./api.sh put node LHR name=city
    ./api.sh put node LHR act=1
    ./api.sh put node LHR N=BMA
    ./api.sh put node LHR S=KRN
    ./api.sh put node LHR E=TLL
    ./api.sh put node LHR W=WRO
    ./api.sh put node LHR W=null
    ./api.sh put node TLL sleep=true sleepCost=5
    ./api.sh put node KRN npc="The Sexton"
    ./api.sh put node LHR loot="Bloodstained Map"

  Examples — quest:
    ./api.sh put quest mq_1 passText="Muffat takes the map."
    ./api.sh put quest mq_1 failText="The docks are empty."
    ./api.sh put quest mq_1 hint="Seek Muffat at the Tilbury docks."
    ./api.sh put quest mq_2 waypointNode=FRO
    ./api.sh put quest mq_3 activateNode=SDQ
    ./api.sh put quest sq_1 npc=brynn
    ./api.sh put quest quest_wis_01 checkDC=14
    ./api.sh put quest quest_wis_01 checkStat=WIS
    ./api.sh put quest sq_2 xpAward=50 reward=20

  Examples — monster:
    ./api.sh put monster goblin hp=10
    ./api.sh put monster goblin ac=14
    ./api.sh put monster goblin atk=5
    ./api.sh put monster goblin tier=medium
    ./api.sh put monster skeleton name="Risen Skeleton"
    ./api.sh put monster shadow dmgDie=8 dmgCount=2

  Examples — terrain:
    ./api.sh put terrain city label="City Streets"
    ./api.sh put terrain forest icon=🌲

  Examples — piping JSON body:
    echo '{"passText":"You recalled the text.","failText":"Try again."}' \\
      | ./api.sh put quest quest_wis_01
    echo '{"label":"City Streets — Birka","act":1}' \\
      | ./api.sh put node LHR
    echo '{"hp":20,"ac":16,"tier":"medium"}' \\
      | ./api.sh put monster skeleton
    cat overrides.json | ./api.sh put quest mq_1

${C.bold}═══════════════════════════════════════════════════════════════════
  post — create a new entity
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh post <type> [field=value …]

  Nonce is auto-acquired if id/code/key is provided.
  Pipe a JSON object for complex bodies.

  Required fields by type:
    node:    code  name (terrain key)  label  act
    quest:   id  type  title  activateNode
    monster: key  name  tier  ac  hp  atk  dmgDie  dmgCount  dmgFlat
    npc:     key  name  occupation  node
    terrain: key  label  icon

  Examples — node:
    ./api.sh post node code=MM name=mimic_meadows label="Mimic Meadows" act=3
    ./api.sh post node code=SW name=scholars_qtr label="Scholar Workshop" act=3 N=CY W=BK
    ./api.sh post node code=EHZ name=void label="Event Horizon Zone" act=5
    ./api.sh post node \\
      code=VAULT name=crypt label="The Sealed Vault" act=2 \\
      N=KRN sleep=false
    ./api.sh post node \\
      code=NEW_INN name=inn label="The Silver Lantern Inn" act=2 \\
      sleep=true sleepCost=8 npc="Innkeeper Gert"

  Examples — quest:
    ./api.sh post quest \\
      id=sq_birka_rat type=combat title="The Rat Problem" \\
      desc="Brynn wants the cellar cleared." \\
      hint="Head to the cellar beneath the inn." \\
      passText="The cellar is quiet now." \\
      failText="The rats are still down there." \\
      activateNode=TLL waypointNode=TLL npc=brynn
    ./api.sh post quest \\
      id=sq_crypt_candle type=side title="The Black Candle" \\
      desc="Something lit that candle." \\
      hint="Search the crypt second chamber." \\
      passText="The candle burns out." \\
      failText="The candle is still burning." \\
      activateNode=KRN waypointNode=KRN
    ./api.sh post quest \\
      id=quest_int_01 type=skill_check title="Decipher the Cipher" \\
      desc="The cipher is in three parts." \\
      hint="The answer is in the structure." \\
      passText="The cipher resolves into coordinates." \\
      failText="The cipher is still locked." \\
      activateNode=MHQ waypointNode=LCY \\
      checkStat=INT checkDC=14

  Examples — monster:
    ./api.sh post monster \\
      key=bog_crawler name="Bog Crawler" tier=easy \\
      ac=11 hp=18 atk=4 dmgDie=6 dmgCount=1 dmgFlat=2
    ./api.sh post monster \\
      key=swamp_sovereign name="Swamp Sovereign" tier=boss \\
      ac=16 hp=120 atk=8 dmgDie=10 dmgCount=2 dmgFlat=5
    ./api.sh post monster \\
      key=void_tendril name="Void Tendril" tier=medium \\
      ac=13 hp=45 atk=6 dmgDie=8 dmgCount=2 dmgFlat=3

  Examples — npc:
    ./api.sh post npc \\
      key=innkeeper_gert name="Innkeeper Gert" \\
      occupation=innkeeper node=NEW_INN
    ./api.sh post npc \\
      key=fence_pachelbel name="City Fence Pachelbel" \\
      occupation=fence node=LLA

  Examples — terrain:
    ./api.sh post terrain key=temple_ruins label="Temple Ruins" icon=🏛
    ./api.sh post terrain key=void label="The Void" icon=🌑

  Examples — piping JSON:
    cat <<'EOF' | ./api.sh post node
    {"code":"EHZ","name":"void","label":"Event Horizon Zone","act":5}
    EOF

    cat <<'EOF' | ./api.sh post quest
    {"id":"quest_math_01","type":"side","title":"The Counting Problem",
     "desc":"The mathematician wants an exact count.",
     "hint":"Count carefully. Zero matters.",
     "passText":"The count is correct.",
     "failText":"The count was off.",
     "activateNode":"EHZ","waypointNode":"EHZ"}
    EOF

    cat import_cdg.json | ./api.sh post node
    cat new_quests.json | ./api.sh post quest

${C.bold}═══════════════════════════════════════════════════════════════════
  del — delete an entity
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh del <type> <id>

  Nonce is auto-acquired. Before deleting:
    - Run ./api.sh chain <id> for quests (check canDelete)
    - Run ./api.sh location <code> for nodes (check quests/npcs)

  Examples:
    ./api.sh del quest sq_birka_rat
    ./api.sh del quest quest_old_01
    ./api.sh del node MM
    ./api.sh del node VAULT
    ./api.sh del monster bog_crawler
    ./api.sh del npc innkeeper_gert

  Manual nonce flow (for scripting):
    NONCE=$(./api.sh nonce quest sq_birka_rat)
    curl -s -XDELETE http://localhost:1367/api/quest/sq_birka_rat \\
      -H "X-Nonce: $NONCE" | jq

${C.bold}═══════════════════════════════════════════════════════════════════
  audit — integrity scan
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh audit [--map] [--text]

  No flags: full integrity scan (broken refs, missing data, dead flags).
  --map:  bidirectional link audit (A.N→B but B.S≠A).
  --text: plain text output instead of JSON.

  Severity levels: error | warning | suggestion | parse

  Examples:
    ./api.sh audit
    ./api.sh audit --map
    ./api.sh audit --text
    ./api.sh audit --map --text
    ./api.sh audit --raw
    ./api.sh audit --out /tmp/audit.json

  Pipe for quick checks:
    ./api.sh audit --raw | jq '.summary'
    ./api.sh audit --map --raw | jq '[.errors[] | {from:.from, dir:.dir, to:.to}]'
    ./api.sh audit --map --text | grep ERROR

  Systematic fix loop using next-error:
    curl -s 'http://localhost:1367/api/next-error'              | jq '{severity, key, field, fix}'
    curl -s 'http://localhost:1367/api/next-error?skip=1'       | jq '{severity, key, field, fix}'
    curl -s 'http://localhost:1367/api/next-error?severity=error' | jq '.'

${C.bold}═══════════════════════════════════════════════════════════════════
  export — dump collection data
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh export <collection> [--format json|js|module] [--out file]

  Collections: node_map | quest_db | monster_pool | world_db | all

  --format json   (default) — plain JSON object
  --format js     — const NODE_MAP = {...} assignment
  --format module — export const NODE_MAP = {...} ESM

  Examples:
    ./api.sh export node_map
    ./api.sh export quest_db
    ./api.sh export monster_pool
    ./api.sh export world_db
    ./api.sh export all
    ./api.sh export node_map --format js
    ./api.sh export quest_db --format module
    ./api.sh export all --format json
    ./api.sh export node_map --out world/nodes.json
    ./api.sh export quest_db --out world/quests.json
    ./api.sh export monster_pool --out world/monsters.json
    ./api.sh export world_db --out world/terrains.json
    ./api.sh export all --out world/full-export.json
    ./api.sh export quest_db --format module --out src/data/quests.mjs

  Backup before large edits:
    ./api.sh export node_map --out backup-nodes-$(date +%Y%m%d).json
    ./api.sh export quest_db --out backup-quests-$(date +%Y%m%d).json

  Inspect counts:
    ./api.sh export quest_db --raw | jq 'keys | length'
    ./api.sh export node_map --raw | jq 'keys'
    ./api.sh export monster_pool --raw | jq '[to_entries[] | select(.value.tier=="boss") | .key]'

${C.bold}═══════════════════════════════════════════════════════════════════
  import — bulk import nodes + quest cycles
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh import <file.json>
  cat file.json | ./api.sh import

  Import file format:
    {
      "book": "CDG",
      "nodes": [
        { "code":"CDG", "name":"airport", "label":"Charles de Gaulle",
          "act":2, "sleep":true, "sleepCost":6 }
      ],
      "cycles": [
        { "cycle": 8, "acts": [
          { "id":"quest_cdg_01", "type":"side", "title":"The Delayed Flight",
            "activateNode":"CDG", "waypointNode":"CDG",
            "desc":"...", "passText":"...", "failText":"..." }
        ]}
      ]
    }

  Examples:
    ./api.sh import import_cdg.json
    ./api.sh import import_vie.json
    ./api.sh import import_rkv.json
    ./api.sh import import_alf.json
    ./api.sh import import_hft.json
    cat import_cdg.json | ./api.sh import
    ./api.sh import import_cdg.json --out /tmp/cdg-import-result.json

  Review result:
    ./api.sh import import_cdg.json --out /tmp/result.json
    jq '{created:.nodesCreated, skipped:.nodesSkipped, quests:.questsCreated|length}' /tmp/result.json

${C.bold}═══════════════════════════════════════════════════════════════════
  speak — Claude-voiced NPC dialogue
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh speak <npc-id> "<prompt>" [--state neutral|friendly|dearFriend] [--model <model>]

  Requires: ANTHROPIC_API_KEY in environment.
  States: neutral (first meeting) | friendly (ally) | dearFriend (deep trust)

  Examples:
    ./api.sh speak yael "Good afternoon."
    ./api.sh speak yael "What happened here?"
    ./api.sh speak yael "I cleared the crypt."
    ./api.sh speak yael "Tell me what you know about the Void."
    ./api.sh speak yael "I cleared the crypt." --state friendly
    ./api.sh speak yael "Tell me what you know about the Void." --state dearFriend
    ./api.sh speak brynn "Do you have a room available?"
    ./api.sh speak brynn "What can you tell me about Froberger?"
    ./api.sh speak brynn "I found the two missing merchants." --state friendly
    ./api.sh speak archivus_sweelinck "I have all seven shards."
    ./api.sh speak archivus_sweelinck "Is this the right path?" --state dearFriend
    ./api.sh speak yael "What is happening in this city?" --model claude-haiku-4-5-20251001
    ./api.sh speak yael "I need your help." --model claude-sonnet-4-6

${C.bold}═══════════════════════════════════════════════════════════════════
  nonce — get a one-time write token
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh nonce <type> <id>

  Prints the nonce token to stdout (expires in 5 minutes).
  Use when scripting raw curl DELETE/POST calls.
  ./api.sh post and ./api.sh del auto-acquire nonces — use this only
  when you need the token separately.

  Examples:
    ./api.sh nonce quest sq_birka_rat
    ./api.sh nonce node MM
    ./api.sh nonce monster bog_crawler

  Capture and use in a script:
    NONCE=$(./api.sh nonce quest sq_old_01)
    curl -s -XDELETE http://localhost:1367/api/quest/sq_old_01 \\
      -H "X-Nonce: $NONCE" | jq

    NONCE=$(./api.sh nonce node NEW_NODE)
    curl -s -XPOST http://localhost:1367/api/node \\
      -H "Content-Type: application/json" \\
      -H "X-Nonce: $NONCE" \\
      -d '{"code":"NEW_NODE","name":"city","label":"New City Node","act":1}' | jq

${C.bold}═══════════════════════════════════════════════════════════════════
  ai — ask Claude about the API
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh ai "<question>"
  ./api.sh --ai "<question>"

  Requires: ANTHROPIC_API_KEY. Uses Claude Haiku. Replies in 1–3 lines,
  leading with a concrete ./api.sh command when applicable.

  Examples:
    ./api.sh ai "how do I link two nodes bidirectionally?"
    ./api.sh ai "what monsters appear in dungeon terrain?"
    ./api.sh ai "how do I add a quest that requires two items?"
    ./api.sh ai "what is the difference between activateNode and waypointNode?"
    ./api.sh ai "how do I create a junction between KRN and HKG?"
    ./api.sh ai "what fields can I set on a node?"
    ./api.sh ai "how do I bulk export and re-import node_map?"
    ./api.sh ai "what curl command fills a gap between two nodes?"
    ./api.sh ai "how do I see quests at node LHR?"
    ./api.sh ai "how do I check if a node is walkable from BK?"
    ./api.sh --ai "list all monster tiers"
    ./api.sh --ai "show me how to create a skill_check quest"

${C.bold}═══════════════════════════════════════════════════════════════════
  GLOBAL OPTIONS — apply to every command
═══════════════════════════════════════════════════════════════════${C.reset}

  --server <url>      Override base URL
    ./api.sh ping --server http://localhost:1367
    ./api.sh ping --server http://192.168.1.10:1367
    WBAPI_URL=http://192.168.1.10:1367 ./api.sh ping

  --out <file>        Write output to file
    ./api.sh get node LHR --out /tmp/lhr.json
    ./api.sh list quest --out /tmp/quests.json
    ./api.sh export quest_db --out backup/quests-$(date +%Y%m%d).json
    ./api.sh count nodes --out /tmp/node-stats.json

  --raw               Compact JSON (no pretty-print)
    ./api.sh get node LHR --raw
    ./api.sh list quest --raw | wc -c
    ./api.sh list node --raw | jq 'length'
    ./api.sh export monster_pool --raw | jq 'keys | length'

  --retry <n>         Max retries on 5xx or connection error (default 3)
    ./api.sh put quest mq_1 passText="Updated." --retry 5
    ./api.sh import big-import.json --retry 2

  --timeout <ms>      Per-request timeout in ms (default 10000)
    ./api.sh export monster_pool --timeout 30000
    ./api.sh import import_vie.json --timeout 15000

${C.bold}═══════════════════════════════════════════════════════════════════
  COMMON RECIPES
═══════════════════════════════════════════════════════════════════${C.reset}

  # Is the server running?
  ./api.sh ping

  # How many nodes / quests / monsters are loaded?
  ./api.sh count

  # What nodes have no coordinates yet?
  ./api.sh list node --no-coords

  # What quests are at a given node?
  ./api.sh list quest --node LHR
  ./api.sh list quest --node BK

  # All main quest IDs in order
  ./api.sh list quest --arc mq_ --ids

  # What monsters live in the crypt?
  ./api.sh list monster --terrain crypt

  # Are there any monsters not in any terrain?
  ./api.sh list monster --no-terrain

  # Which nodes have no quests and are not junctions?
  ./api.sh list node --has-quests false --junction false

  # Full location composite view for a node
  ./api.sh location LHR
  ./api.sh location KRN

  # Check whether a quest can be safely deleted
  ./api.sh chain sq_birka_rat

  # Update quest text from a long heredoc
  ./api.sh put quest mq_1 passText="\$(cat <<'EOF'
  Muffat takes the map and unfolds it on the dock counter.
  She does not ask how you came by it.
  EOF
  )"

  # Backup before editing
  ./api.sh export node_map --out /tmp/backup-nodes.json && \\
    ./api.sh put node LHR label="City Streets — Birka"

  # Full create+verify+save workflow
  ./api.sh post node code=TEST name=city label="Test Node" act=1
  ./api.sh post quest id=quest_test_01 type=side title="Test Quest" \\
    activateNode=TEST desc="test" passText="pass" failText="fail"
  ./api.sh location TEST
  ./api.sh audit --map
  curl -s -XPOST http://localhost:1367/api/save | jq

  # Export all data for offline analysis
  ./api.sh export all --out world-snapshot-$(date +%Y%m%d).json

${C.bold}═══════════════════════════════════════════════════════════════════
  COORDINATE & GRAPH OPERATIONS  (curl only — no ./api.sh wrapper)
═══════════════════════════════════════════════════════════════════${C.reset}

  These endpoints exist on the server but are not wrapped by ./api.sh.
  Use curl directly:

  # All coordinates
  curl -s http://localhost:1367/api/coords | jq '.coords.LHR'

  # Nodes near a position
  curl -s 'http://localhost:1367/api/coords/near/BK?radius=8' | jq '[.nearby[] | .code]'

  # Validate one node's connections
  curl -s 'http://localhost:1367/api/graph/validate/LHR?maxGap=4' | jq
  curl -s 'http://localhost:1367/api/graph/validate/BK?maxGap=4' | jq '.diagnosis'

  # All broken edges from root
  curl -s 'http://localhost:1367/api/graph/broken?maxGap=4&root=BK' | jq '{broken, categories}'

  # Walkable path between two nodes
  curl -s 'http://localhost:1367/api/graph/path/BK/LHR?maxGap=4' | jq '{reachable, walkablePath}'

  # Move node to absolute position
  curl -s -XPUT http://localhost:1367/api/coords/LHR \\
    -H 'Content-Type: application/json' \\
    -d '{"r":120,"c":144}' | jq

  # Nudge node relative to current position
  curl -s -XPOST http://localhost:1367/api/coords/BK/nudge \\
    -H 'Content-Type: application/json' \\
    -d '{"dr":-4,"dc":0}' | jq

  # Swap two nodes' coordinates
  curl -s -XPOST http://localhost:1367/api/coords/swap \\
    -H 'Content-Type: application/json' \\
    -d '{"a":"J52","b":"LHR"}' | jq

  # Wire both ends of a directional link
  curl -s -XPOST http://localhost:1367/api/graph/link \\
    -H 'Content-Type: application/json' \\
    -d '{"a":"LHR","aDir":"N","b":"BMA"}' | jq

  # Plan junction chain (dry run — review before executing)
  curl -s -XPOST http://localhost:1367/api/graph/fill-gap \\
    -H 'Content-Type: application/json' \\
    -d '{"from":"KRN","dir":"S","to":"HKG","maxGap":4,"step":4,"terrain":"inherit","dryRun":true}' | jq

  # Execute junction chain
  curl -s -XPOST http://localhost:1367/api/graph/fill-gap \\
    -H 'Content-Type: application/json' \\
    -d '{"from":"KRN","dir":"S","to":"HKG","maxGap":4,"step":4,"terrain":"inherit","resolveConflicts":"shift"}' | jq

  # Fix diagonal connection (corner junction)
  curl -s -XPOST http://localhost:1367/api/graph/corner-junction \\
    -H 'Content-Type: application/json' \\
    -d '{"nodeA":"ROT","dirA":"E","nodeB":"NRG","dirB":"N","sharedTarget":"SHW"}' | jq

  # Propose layout from root
  curl -s 'http://localhost:1367/api/layout/solve?root=LHR&step=8' | jq '{placed:(.coords|keys|length), orphans}'

  # Save all changes to disk
  curl -s -XPOST http://localhost:1367/api/save | jq

  # Server help topics
  curl -s 'http://localhost:1367/api/help' | jq '.topics'
  curl -s 'http://localhost:1367/api/help/wizard?format=text'
  curl -s 'http://localhost:1367/api/help/coords?format=text'
  curl -s 'http://localhost:1367/api/help/nonce?format=text'

${C.bold}═══════════════════════════════════════════════════════════════════
  SERVER LIFECYCLE
═══════════════════════════════════════════════════════════════════${C.reset}

  ./wbapi-toggle.sh start     Start server in background (auto-restart loop)
  ./wbapi-toggle.sh stop      Kill background instance
  ./wbapi-toggle.sh restart   Stop + start
  ./wbapi-toggle.sh status    Show PID and port
  ./wbapi-toggle.sh fg        Run in foreground with full log scroll

  Log file: milepoints/wbapi-server.log
  Port:     1367  (the canonical game year, 1367 AD)
`.trim();

// ── Compact synopsis — printed before every response (stderr, TTY only) ───────
const SYNOPSIS = [
  `${C.bold}./api.sh${C.reset} ${C.dim}[--out file] [--raw] [--retry n] [--ai "..."]${C.reset}`,
  `  ${C.green}ping${C.reset}                               check server + counts`,
  `  ${C.green}count${C.reset} [nodes|quests|monsters|npcs|terrains|coords]  breakdown stats`,
  `  ${C.green}get${C.reset}   <type> <id>                  fetch entity + full details`,
  `  ${C.green}list${C.reset}  [type]                       list (no type = index)  [--act N] [--terrain X] [--q text]`,
  `  ${C.green}list${C.reset}  ids <type>                   IDs-only array`,
  `  ${C.green}put${C.reset}   <type> <id> [k=v…]           update fields  (or pipe JSON)`,
  `  ${C.green}post${C.reset}  <type> [k=v…]                create  (nonce auto)`,
  `  ${C.green}del${C.reset}   <type> <id>                  delete  (nonce auto)`,
  `  ${C.green}speak${C.reset} <npc-id> "<prompt>"           Claude NPC reply  [--state neutral|friendly|dearFriend]`,
  `  ${C.green}import${C.reset} <file.json>                 bulk import nodes + quest cycles`,
  `  ${C.green}audit${C.reset} [--map]                      integrity scan`,
  `  ${C.green}chain${C.reset} <quest-id>                   quest chain`,
  `  ${C.green}export${C.reset} <collection>                dump JSON  [--format js|module]`,
  `  ${C.green}location${C.reset} [code]                    composite node view (no code = list all)`,
  `  ${C.green}ai${C.reset} "<question>"                    ask Claude  (ANTHROPIC_API_KEY)`,
  `  ${C.dim}types: node  quest  monster  npc  terrain  |  ./api.sh help for full manual${C.reset}`,
].join('\n');

function printSynopsis() {
  if (TTY) stderr(SYNOPSIS + '\n\n');
}

// ── Main ───────────────────────────────────────────────────────────────────────
(async () => {
  const { flags, pos } = parseArgs(process.argv.slice(2));

  if (flags.server)  BASE     = flags.server;
  if (flags.retry)   RETRIES  = parseInt(flags.retry, 10);
  if (flags.timeout) TIMEOUT  = parseInt(flags.timeout, 10);

  // --ai shorthand (no subcommand needed)
  if (flags.ai && typeof flags.ai === 'string') {
    printSynopsis();
    const reply = await askClaude(flags.ai);
    process.stdout.write(`${C.cyan}${reply}${C.reset}\n`);
    return;
  }

  const cmd = pos[0] || 'help';
  const fn  = CMD[cmd];
  if (!fn) die(`Unknown command "${cmd}". Run: ./api.sh help`);

  // Print synopsis before every command except 'help' (which has its own full text)
  if (cmd !== 'help') printSynopsis();

  try {
    await fn(pos, flags);
  } catch (e) {
    if (e.code === 'ECONNREFUSED') die(`Server not running at ${BASE}\n  Start: ./wbapi-toggle.sh start`);
    die(e.message || String(e));
  }
})();
