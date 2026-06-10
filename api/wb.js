#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Paul Richeson <paul@roll2hit.com> — Roll2Hit.com
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

// ── CLI Log — milepoints/api-cli.log ─────────────────────────────────────────
const path     = require('path');
const LOG_FILE = path.join(__dirname, '..', 'milepoints', 'api-cli.log');
const _logStart = new Date().toISOString();
let   _logCmd  = process.argv.slice(2).join(' ');

function cliLog(entry) {
  try {
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
    fs.appendFileSync(LOG_FILE, line);
  } catch {}  // never crash the CLI over logging
}
cliLog({ event: 'start', cmd: _logCmd });

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

// ── Streaming POST — reads chunked text/plain response, prints lines as they arrive ──
// Used for long-running server operations (reweave) that have no timeout.
function streamPost(urlPath, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(`${BASE}${urlPath}`);
    const str = JSON.stringify(body);
    const req = http.request({
      hostname: u.hostname, port: u.port || 80,
      path: u.pathname + u.search, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(str) },
    }, (res) => {
      let leftover = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        const lines = (leftover + chunk).split('\n');
        leftover = lines.pop();
        for (const line of lines) if (line.trim()) process.stdout.write(`${C.green}✓${C.reset} ${line}\n`);
      });
      res.on('end', () => {
        if (leftover.trim()) process.stdout.write(`${C.green}✓${C.reset} ${leftover}\n`);
        resolve(res.statusCode);
      });
    });
    req.on('error', reject);
    req.write(str); req.end();
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
        const t0 = Date.now();
        const r = await doHTTP(method, url, body, extraHeaders);
        const ms = Date.now() - t0;
        if (r.status >= 500 && i < RETRIES) { lastErr = r; continue; }
        cliLog({ event: 'request', method, path: urlPath, status: r.status, ms,
          body: body ? (typeof body === 'string' ? body.slice(0,200) : JSON.stringify(body).slice(0,200)) : null,
          response: r.body ? JSON.stringify(r.body).slice(0,500) : null });
        return r;
      } catch (e) {
        cliLog({ event: 'request_error', method, path: urlPath, error: e.message, attempt: i });
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
  cliLog({ event: 'result', bytes: out.length, preview: out.slice(0, 200) });
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
  cliLog({ event: 'error', status: r.status, msg });
  if (TTY) {
    // Terminal: colored human-readable error on stderr
    stderr(`${col}HTTP ${r.status}${C.reset} ${msg}\n`);
  } else {
    // Piped: JSON only on stdout — stderr suppressed so 2>&1 doesn't corrupt the JSON stream
    if (r.body) process.stdout.write(JSON.stringify(r.body, null, 2) + '\n');
  }
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
    if (d.npcsCreated?.length)   ok(`npcs created:    ${d.npcsCreated.join(', ')}`);
    if (d.npcsSkipped?.length)   info(`npcs skipped:    ${d.npcsSkipped.join(', ')}`);
    if (d.errors?.length)        stderr(`${C.red}errors (${d.errors.length}): ${JSON.stringify(d.errors)}${C.reset}\n`);
    if (d.total)                 info(`baseline: ${d.total.nodes} nodes  ${d.total.quests} quests`);
    if (flags.out) { fs.writeFileSync(flags.out, JSON.stringify(d, null, 2) + '\n'); ok(`→ ${flags.out}`); }
  },

  // ── worldmap: terminal ASCII world map of major cities ──────────────────────
  // Usage: ./api.sh worldmap [--latlon]
  async worldmap(_pos, flags) {
    // Delegate rich views to worldmap.js before fetching API data
    const regionArg   = flags.region;
    const cityArg     = flags.city;
    const regionsFlag = flags.regions !== undefined;
    const searchArg   = flags.search || flags.monster;
    const routeFrom   = flags.route || flags.from;
    const routeTo     = flags.to;
    if (regionArg || cityArg || regionsFlag || searchArg || (routeFrom && routeTo)) {
      const { spawnSync } = require('child_process');
      const args = cityArg              ? ['--city',   cityArg]
                 : searchArg            ? ['--search', searchArg]
                 : (routeFrom&&routeTo) ? ['--route',  routeFrom, '--to', routeTo]
                 : regionArg            ? ['--region', regionArg]
                 : ['--regions'];
      const result = spawnSync('node', [
        require('path').join(__dirname, '..', 'worldmap.js'), ...args,
        '--port', String(flags.port || 1367),
      ], { stdio: 'inherit' });
      process.exit(result.status || 0);
    }

    const r = await request('GET', '/api/layout/worldmap');
    if (r.status !== 200) { printError(r); process.exit(1); }
    const cities = r.body.cities || {};
    const geo = Object.entries(cities).sort(([,a],[,b]) => (a.lon||0) - (b.lon||0) || (b.lat||0) - (a.lat||0));

    // Simple terminal map (equirectangular, 90 wide × 26 tall)
    const W=90, H=26, MLAT=68, mLAT=-8, MLON=72, mLON=-25;
    const project = (lat,lon) => ({
      r: Math.round((MLAT-lat)/(MLAT-mLAT)*(H-1)),
      c: Math.round((lon-mLON)/(MLON-mLON)*(W-1)),
    });
    const grid = Array.from({length:H},()=>Array(W).fill(' '));
    // Grid lines every 15°
    for (let lat=mLAT; lat<=MLAT; lat+=15) { const {r}=project(lat,0); if(r>=0&&r<H) for(let c=0;c<W;c++) if(grid[r][c]===' ') grid[r][c]='·'; }
    for (let lon=mLON; lon<=MLON; lon+=15) { const {c}=project(0,lon); if(c>=0&&c<W) for(let r=0;r<H;r++) if(grid[r][c]===' ') grid[r][c]='·'; }
    // Place cities
    for (const [code, city] of geo) {
      const {r,c}=project(city.lat,city.lon);
      if(r<0||r>=H||c<0||c>=W) continue;
      const ch=code.slice(0,3);
      for(let i=0;i<ch.length&&c+i<W;i++) grid[r][c+i]=ch[i];
    }
    // Print
    ok(`World Map — ${geo.length} geo-referenced cities`);
    const lonHdr = Array(W+4).fill(' ');
    for (let lon=mLON; lon<=MLON; lon+=15) { const {c}=project(0,lon); const t=(lon<0?`${-lon}W`:`${lon}E`).padStart(4); for(let i=0;i<t.length&&c+i+3<lonHdr.length;i++) lonHdr[c+i+3]=t[i]; }
    process.stdout.write('   '+lonHdr.join('')+'\n');
    process.stdout.write('   ╔'+'═'.repeat(W)+'╗\n');
    for (let r=0; r<H; r++) {
      const lat=MLAT-r*(MLAT-mLAT)/(H-1);
      const tag=(lat>=0?`${Math.round(lat)}N`:`${Math.abs(Math.round(lat))}S`).padStart(3);
      process.stdout.write(`${tag}║${grid[r].join('')}║\n`);
    }
    process.stdout.write('   ╚'+'═'.repeat(W)+'╝\n\n');

    if (flags.latlon || flags.l) {
      // City list with lat/lon
      process.stdout.write(`${'CODE'.padEnd(6)} ${'LABEL'.padEnd(26)} ${'REGION'.padEnd(20)} ${'LAT'.padStart(6)} ${'LON'.padStart(7)}  ${'r,c in game'.padStart(10)}\n`);
      process.stdout.write('─'.repeat(88)+'\n');
      for (const [code,city] of geo) {
        const latS=(city.lat>=0?`${city.lat.toFixed(1)}N`:`${Math.abs(city.lat).toFixed(1)}S`).padStart(6);
        const lonS=(city.lon>=0?`${city.lon.toFixed(1)}E`:`${Math.abs(city.lon).toFixed(1)}W`).padStart(7);
        const rc   = city.gameCoords ? `r=${city.gameCoords.r} c=${city.gameCoords.c}` : '(no coords)';
        process.stdout.write(`${code.padEnd(6)} ${(city.label||'').slice(0,26).padEnd(26)} ${(city.region||'').slice(0,20).padEnd(20)} ${latS} ${lonS}  ${rc}\n`);
      }
    }
  },

  // ── move: move a node to new coordinates (with collision check / swap) ──────
  // Usage: ./api.sh move <CODE> <r> <c> [--swap]
  async move(pos, flags) {
    const [, code, rStr, cStr] = pos;
    if (!code||rStr==null||cStr==null) die('Usage: ./api.sh move <CODE> <r> <c> [--swap]');
    const r=+rStr, c=+cStr;
    if (isNaN(r)||isNaN(c)) die('r and c must be numbers');
    const resp = await request('POST', '/api/graph/move', { code, r, c, swap: !!flags.swap });
    if (resp.status >= 400) { printError(resp); process.exit(1); }
    const d = resp.body;
    ok(`${code} moved from (${d.from?.r},${d.from?.c}) → (${r},${c})`);
    if (d.swapped) ok(`swapped with ${d.swapped.code} → (${d.swapped.movedTo?.r},${d.swapped.movedTo?.c})`);
  },

  // ── junction: spawn a new junction node between two points ───────────────────
  // Usage: ./api.sh junction <from> <dir> [--label "name"] [--terrain city] [--execute]
  //   from     — source node code
  //   dir      — N|S|E|W direction for the new junction
  //   --label  — custom label (default: auto-generated signpost name)
  //   --terrain — terrain type (default: inherits from source)
  //   --execute — actually create (default is dry-run)
  async junction(pos, flags) {
    const [, from, dir] = pos;
    if (!from||!dir) die('Usage: ./api.sh junction <from> <dir> [--label "name"] [--terrain type] [--execute]');
    const body = { from, dir, dryRun: !flags.execute, ...(flags.label?{label:flags.label}:{}), ...(flags.terrain?{terrain:flags.terrain}:{}) };
    const resp = await request('POST', '/api/graph/spawn-junction', body);
    if (resp.status >= 400) { printError(resp); process.exit(1); }
    const d = resp.body;
    if (d.dryRun) {
      ok(`[DRY RUN] Junction ${d.plan.code}  r=${d.plan.r}  c=${d.plan.c}  terrain=${d.plan.terrain}`);
      ok(`Label:  ${d.plan.label}`);
      ok(`Text:   ${d.plan.text}`);
      if (d.plan.needsFillGap) ok(`⚠ Gap ${d.plan.gap} > 4 — run fill-gap after creating`);
      ok(`Add --execute to create the junction`);
    } else {
      ok(`Junction ${d.code} created at (${d.r},${d.c})`);
      ok(`Label: ${d.plan.label}`);
      if (d.plan.needsFillGap) ok(`⚠ Gap ${d.plan.gap} > 4 — run: ./api.sh fill-gap ${from} ${dir} ${d.code}`);
    }
  },

  // ── geo-seed: apply geographic lat/lon seeds to major city coordinates ────────
  // Usage: ./api.sh geo-seed [--execute] [--grid-min 8] [--grid-max 500]
  async 'geo-seed'(pos, flags) {
    const dryRun = !flags.execute;
    const body   = { dryRun, ...(flags['grid-min']?{gridMin:+flags['grid-min']}:{}), ...(flags['grid-max']?{gridMax:+flags['grid-max']}:{}) };
    const resp = await request('POST', '/api/layout/geo-seed', body);
    if (resp.status >= 400) { printError(resp); process.exit(1); }
    const d = resp.body;
    if (dryRun) {
      ok(`[DRY RUN] ${d.seeded} cities would be geo-seeded. Add --execute to apply.`);
      if (d.skipped?.length) ok(`Not in node_map: ${d.skipped.join(', ')}`);
      for (const [code,p] of Object.entries(d.coords||{}).slice(0,10)) ok(`  ${code}: r=${p.r} c=${p.c}`);
      if (Object.keys(d.coords||{}).length>10) ok(`  ...and ${Object.keys(d.coords).length-10} more`);
    } else {
      ok(`Geo-seeded ${d.seeded} cities to game grid.`);
      if (d.skipped?.length) info(`Skipped (not in node_map): ${d.skipped.join(', ')}`);
      info(`Next: node layout-solve.js --apply  to propagate remaining nodes from geo anchors`);
    }
  },

  // ── rip-and-connect: auto-relocate all stray (unreachable) nodes ─────────────
  // Usage: ./api.sh rip-and-connect [--execute] [--limit 50] [--radius 6]
  //
  // For each node unreachable from the hub:
  //   1. Finds the best city to relocate near (scored by quest cross-references + proximity)
  //   2. Walks that city's mesh to find an open slot (deg ≤ 3)
  //   3. Moves the stray's coordinates to the adjacent cell
  //   4. Wires it bidirectionally to the slot node
  //   5. If slot is deg=3, notes that a junction should be spawned first
  // Dry-run by default. --execute applies all changes in one server pass.
  // Reports: placed, failed (cell occupied or no slot), skipped.
  // Errors that can't be auto-satisfied are listed for manual review.
  async 'rip-and-connect'(pos, flags) {
    const limit   = flags.limit  ? +flags.limit  : 50;
    const radius  = flags.radius ? +flags.radius :  6;
    const execute = !!flags.execute;
    const resp = await request('POST', '/api/graph/rip-and-connect', {
      dryRun: !execute, limit, meshRadius: radius,
    });
    if (resp.status >= 400) { printError(resp); process.exit(1); }
    const d = resp.body;

    ok(`Rip-and-connect  hub=${d.hub}  totalStrays=${d.totalStrays}  limit=${limit}`);
    ok(`Result: ${d.placed?.length ?? 0} placed  |  ${d.failed?.length ?? 0} failed  |  ${d.skipped?.length ?? 0} skipped`);
    if (!execute) ok(`[DRY RUN] — add --execute to apply`);

    if (d.placed?.length) {
      ok(`\nPlaced:`);
      d.placed.slice(0, 20).forEach(r => {
        const p = r.plan;
        ok(`  ${r.stray.padEnd(8)} → near ${p.bestCity} via ${p.slotNode}(deg=${p.slotDeg}).${p.attachDir}  coord=(${p.targetCoord?.r},${p.targetCoord?.c})${p.needsJunction ? '  ⚠ junction recommended' : ''}  ${r.status||''}`);
      });
      if (d.placed.length > 20) ok(`  ...and ${d.placed.length - 20} more`);
    }

    if (d.failed?.length) {
      ok(`\nFailed (manual review needed):`);
      d.failed.slice(0, 10).forEach(r => ok(`  ${r.stray.padEnd(8)}  ${r.reason}`));
    }

    if (d.failed?.length && !execute) {
      ok(`\nTo fix failed nodes manually:`);
      ok(`  ./api.sh find-open-location <nearest-city>  # find open slot`);
      ok(`  ./api.sh move <stray> <r> <c>               # reposition`);
      ok(`  ./api.sh connect <slot> <dir> <stray>       # wire in`);
    }
  },

  // ── broken: list all broken edges (diagonal, gap > 4) ───────────────────────
  // Usage: ./api.sh broken [--maxgap N]
  async broken(pos, flags) {
    const maxGap = flags.maxgap ? +flags.maxgap : 4;
    const fast = !flags.full; // default fast=true (count only, no suggestions); --full for detailed
    const resp = await request('GET', `/api/graph/broken?maxGap=${maxGap}${fast ? '&fast=true' : ''}`);
    if (resp.status !== 200) { printError(resp); process.exit(1); }
    const d = resp.body;
    if (d.broken === 0) {
      ok(`No broken edges ✓  (${d.totalChecked} checked, maxGap=${maxGap})`);
      return;
    }
    ok(`${d.broken} broken edges  |  categories: ${JSON.stringify(d.categories)}`);
    ok(`Total checked: ${d.totalChecked}  |  maxGap: ${maxGap}`);
    for (const e of (d.edges || []).slice(0, 20)) {
      const s = e.moveSuggestion;
      const fix = s?.recommended
        ? `→ move ${s.node} to (${s.recommended.r},${s.recommended.c})`
        : `→ elbow or fill-gap`;
      ok(`  ${e.from}─${e.dir}→${e.to}  [${e.type}]  off=${e.axisOffset}  gap=${e.gap}  ${fix}`);
    }
    if (d.broken > 20) ok(`  ... and ${d.broken - 20} more`);
    ok(`Fix all: ./api.sh fix-all-broken --execute`);
  },

  // ── reachability: show how many nodes are reachable from the hub ─────────────
  // Usage: ./api.sh reachability
  async reachability() {
    const resp = await request('GET', '/api/graph/reachability');
    if (resp.status !== 200) { printError(resp); process.exit(1); }
    const d = resp.body; const c = d.counts;
    const pct = Math.round(100 * c.reachable / c.total);
    ok(`Hub: ${d.hub}  |  Reachable: ${c.reachable}/${c.total} (${pct}%)  |  Unreachable: ${c.unreachable}  |  Clusters: ${c.clusters}`);
    if (c.unreachable > 0) {
      ok(`Isolated clusters: ${c.clusters} — use ./api.sh highway to connect them`);
    } else {
      ok(`All nodes reachable ✓`);
    }
    const deg = d.reachableByDegree || {};
    for (const [k, v] of Object.entries(deg)) {
      ok(`  ${k}: ${v.length} nodes`);
    }
  },

  // ── junction-audit: breakdown of junction vs named nodes + P_NUKE dry-run preview ─
  // Usage: ./api.sh junction-audit
  async 'junction-audit'() {
    const resp = await request('GET', '/api/graph/junction-audit');
    if (resp.status !== 200) { printError(resp); process.exit(1); }
    const d = resp.body;
    const s = d.summary;
    ok(`── Node Summary ──────────────────────────────────────────`);
    ok(`  Total:      ${s.total}`);
    ok(`  Junctions:  ${s.junctionCount}  (${s.junctionPct})`);
    ok(`  Named:      ${s.namedCount}`);
    ok(`── Coordinate Coverage ───────────────────────────────────`);
    const cc = d.coordsCoverage;
    ok(`  Junctions with coords:    ${cc.jWithCoords}  |  without: ${cc.jWithoutCoords}`);
    ok(`  Named nodes with coords:  ${cc.namedWithCoords}  |  without: ${cc.namedWithoutCoords}`);
    ok(`── Reachability ──────────────────────────────────────────`);
    const rc = d.reachability;
    ok(`  Junctions reachable:  ${rc.jReachable}  |  unreachable: ${rc.jUnreachable}`);
    ok(`  Named reachable:      ${rc.namedReachable}  |  unreachable: ${rc.namedUnreachable}`);
    ok(`── Quest / NPC Refs ──────────────────────────────────────`);
    const qr = d.questRefs;
    ok(`  Quest ref nodes:           ${qr.totalQuestRefNodes}`);
    ok(`  Named quest nodes:         ${qr.uniqueNamedQuestNodes}`);
    ok(`  J#### with quest refs:     ${qr.junctionQuestRefs}  ${qr.junctionQuestRefs === 0 ? '✓ zero — safe to nuke' : '⚠ BLOCKED'}`);
    if (qr.junctionQuestRefCodes.length) ok(`  Blocked codes: ${qr.junctionQuestRefCodes.join(', ')}`);
    ok(`  J#### with NPC stations:   ${d.npcRefs.junctionNpcRefs}  ${d.npcRefs.junctionNpcRefs === 0 ? '✓' : '⚠ BLOCKED'}`);
    ok(`  Safe to nuke all junctions: ${qr.safeToNukeAllJunctions ? 'YES ✓' : 'NO ⚠'}`);
    ok(`── Junction Degree Distribution ─────────────────────────`);
    const dd = d.junctionDegreeDist;
    ok(`  deg-0 (isolated):  ${dd[0]}    deg-1 (dead-end): ${dd[1]}`);
    ok(`  deg-2:             ${dd[2]}    deg-3:            ${dd[3]}    deg-4: ${dd[4]}`);
    ok(`── Unplaced Quest Nodes ──────────────────────────────────`);
    const up = d.unplacedQuestNodes;
    ok(`  Named quest nodes missing r,c: ${up.count}`);
    if (up.count > 0 && up.count <= 20) ok(`  Codes: ${up.codes.join(', ')}`);
    ok(`── P_NUKE Dry-Run Preview ────────────────────────────────`);
    const nk = d.nukePreview;
    ok(`  Safe to delete:    ${nk.safeToDelete}`);
    ok(`  Straight-stitch:   ${nk.straightStitch}  (A-J-B → A-B direct)`);
    ok(`  L-shaped deferred: ${nk.lShapedDeferred}  (handed to A* for path rebuild)`);
    ok(`  Dead-end delete:   ${nk.deadEndDelete}  (degree≤1, drop outright)`);
    ok(`  Blocked by quest:  ${nk.blockedByQuest}`);
    ok(`  Blocked by NPC:    ${nk.blockedByNpc}`);
  },

  // ── find-open-location: find a node near a city that can accept a new neighbour
  // Usage: ./api.sh find-open-location <city> [--radius 8]
  //
  // Returns open attachment points in the city's mesh:
  //   directAttach   — degree ≤ 2, connect straight to this node
  //   junctionNeeded — degree = 3, spawn junction here first, then connect
  //   deadEnds       — degree = 1 nodes that should be expanded
  async 'find-open-location'(pos, flags) {
    const [, code] = pos;
    if (!code) die('Usage: ./api.sh find-open-location <city> [--radius N]');
    const radius = flags.radius ? +flags.radius : 8;
    const resp = await request('GET', `/api/graph/find-open-location/${code}?radius=${radius}`);
    if (resp.status >= 400) { printError(resp); process.exit(1); }
    const d = resp.body;
    ok(`Open locations near ${code}  (radius=${radius})`);
    ok(`  Direct attach (deg ≤ 2): ${d.summary.directAttach}`);
    ok(`  Need junction first (deg=3): ${d.summary.junctionNeeded}`);
    ok(`  Dead ends (deg=1): ${d.summary.deadEnds}`);
    ok(`Advice: ${d.advice}`);
    if (d.directAttach?.length) {
      ok(`\nBest direct slots:`);
      d.directAttach.slice(0, 5).forEach(e =>
        ok(`  ${e.code.padEnd(8)} deg=${e.degree}  depth=${e.depth}  density=${e.density}  free=${e.freeSlots.join(',')}  ${(e.label||'').slice(0,30)}`));
    }
    if (d.junctionNeeded?.length) {
      ok(`\nJunction-spawn spots (deg=3):`);
      d.junctionNeeded.slice(0, 3).forEach(e =>
        ok(`  ${e.code.padEnd(8)} deg=${e.degree}  depth=${e.depth}  free=${e.freeSlots.join(',')}  ${(e.label||'').slice(0,30)}`));
    }
    if (d.deadEnds?.length) {
      ok(`\nDead ends (should be extended):`);
      d.deadEnds.slice(0, 5).forEach(e =>
        ok(`  ${e.code.padEnd(8)} depth=${e.depth}  free=${e.freeSlots.join(',')}  ${(e.label||'').slice(0,30)}`));
    }
  },

  // ── smart-connect: mesh-aware A→B connection with degree/junction rules ─────
  // Usage: ./api.sh smart-connect <from> <to> [--radius 6] [--execute]
  //
  // "A to B" is really "A-mesh to B-mesh".
  // Walks each city's network to find the best insertion points:
  //   - Nodes with deg ≤ 2: connect directly
  //   - Nodes with deg = 3: spawn junction first (preserve the 4th slot)
  //   - Nodes with deg = 4: skip (full), walk deeper
  // Reports the plan; use --execute to apply the first step.
  async 'smart-connect'(pos, flags) {
    const [, fromCode, toCode] = pos;
    if (!fromCode || !toCode) die('Usage: ./api.sh smart-connect <from> <to> [--radius 6] [--execute]');
    const radius  = flags.radius ? +flags.radius : 6;
    const execute = !!flags.execute;

    // Always fetch the plan first (dryRun=true gives us the commands array)
    const resp = await request('POST', '/api/graph/smart-connect', {
      from: fromCode, to: toCode, meshRadius: radius, dryRun: true,
    });
    if (resp.status >= 400) { printError(resp); process.exit(1); }
    const d = resp.body;
    const p = d.plan;

    ok(`Smart-connect: ${fromCode} ↔ ${toCode}`);
    ok(`  A-mesh insertion: ${p.insertA.code} (deg=${p.insertA.degree}, depth=${p.insertA.depth}, ${p.insertA.action})`);
    ok(`  B-mesh insertion: ${p.insertB.code} (deg=${p.insertB.degree}, depth=${p.insertB.depth}, ${p.insertB.action})`);
    ok(`  Bridge direction: ${p.direction}  gap: ${p.gap ?? '?'}  needsFillGap: ${p.needsFillGap}`);

    const cmds = (d.commands || []).filter(c => !c.startsWith('#'));
    ok(`\nCommands:`);
    (d.commands || []).forEach(cmd => ok(`  ${cmd}`));

    if (!execute) {
      ok(`\nAdd --execute to run these automatically.`);
      return;
    }

    // Execute each command by delegating to the existing CMD handlers
    ok(`\nExecuting...`);
    for (const rawCmd of cmds) {
      const parts = rawCmd.trim().split(/\s+/);
      // Commands look like: "./api.sh connect TLL E BTR" or "node layout-solve.js ..."
      const apiShIdx = parts.findIndex(p => p === './api.sh' || p === 'api.sh');
      if (apiShIdx >= 0) {
        const subParts = parts.slice(apiShIdx + 1);
        const subCmd = subParts[0];
        const fn = CMD[subCmd];
        if (fn) {
          const subFlags = {};
          const subPos = [subCmd];
          for (let i = 1; i < subParts.length; i++) {
            if (subParts[i].startsWith('--')) subFlags[subParts[i].slice(2)] = subParts[i+1]?.startsWith('--') ? true : subParts[++i];
            else subPos.push(subParts[i]);
          }
          subFlags.execute = true;
          ok(`  → ${subParts.join(' ')}`);
          await fn(subPos, subFlags);
          continue;
        }
      }
      ok(`  (manual): ${rawCmd}`);
    }
  },

  // ── connect: wire two existing nodes together in a direction ────────────────
  // Usage: ./api.sh connect <A> <dir> <B>
  //   Sets A[dir] = B and B[OPP[dir]] = A (bidirectional wire).
  //   Checks coordinate alignment first; warns if bendy or gap > 4.
  async connect(pos, flags) {
    const [, aCode, dir, bCode] = pos;
    if (!aCode||!dir||!bCode) die('Usage: ./api.sh connect <A> <N|E|S|W> <B>');
    if (!['N','E','S','W'].includes(dir.toUpperCase())) die('dir must be N|E|S|W');
    const D = dir.toUpperCase(), OPP={N:'S',S:'N',E:'W',W:'E'};

    // Fetch current node state + coords for degree/alignment checks
    const [nmResp, coordsResp] = await Promise.all([
      request('GET', '/api/export/node_map?format=json'),
      request('GET', '/api/coords'),
    ]);
    const nm     = nmResp.body?.data    || {};
    const coords = coordsResp.body?.coords || {};

    const degA = ['N','E','S','W'].filter(d => nm[aCode]?.[d]).length;
    const degB = ['N','E','S','W'].filter(d => nm[bCode]?.[d]).length;

    // Degree-cap warnings
    if (degA >= 4) { ok(`⚠ ${aCode} already has 4 connections (full). Use ./api.sh smart-connect ${aCode} ${bCode} to find a mesh insertion point.`); if (!flags.force) return; }
    if (degB >= 4) { ok(`⚠ ${bCode} already has 4 connections (full). Use ./api.sh smart-connect ${aCode} ${bCode} to find a mesh insertion point.`); if (!flags.force) return; }
    if (degA === 3) ok(`⚠ ${aCode} has 3 connections — this will fill its 4th (last) slot. Consider: ./api.sh junction ${aCode} ${D} --execute  (spawns junction first, preserves slot)`);
    if (degB === 3) ok(`⚠ ${bCode} has 3 connections — this will fill its 4th (last) slot. Consider: ./api.sh junction ${bCode} ${OPP[D]} --execute  (spawns junction first, preserves slot)`);

    // Coordinate alignment check
    const ca = coords[aCode], cb = coords[bCode];
    if (ca && cb) {
      const axisOff = (D==='N'||D==='S') ? Math.abs(cb.c-ca.c) : Math.abs(cb.r-ca.r);
      const axisDist= (D==='N'||D==='S') ? Math.abs(cb.r-ca.r) : Math.abs(cb.c-ca.c);
      if (axisOff > 0) ok(`⚠ BENDY: offset=${axisOff} — consider an elbow junction first`);
      if (axisDist > 4) ok(`⚠ GAP: distance=${axisDist} > 4 — consider fill-gap first`);
      if (axisOff === 0 && axisDist <= 4) ok(`Coords OK: axis-aligned, gap=${axisDist} ≤ 4`);
    }

    const r1 = await request('PUT', `/api/node/${aCode}`, { [D]: bCode });
    if (r1.status >= 400) { printError(r1); process.exit(1); }
    const r2 = await request('PUT', `/api/node/${bCode}`, { [OPP[D]]: aCode });
    if (r2.status >= 400) { printError(r2); process.exit(1); }
    // Report auto-junctions (server creates them when source is at deg=3)
    const jA = r1.body?.autoJunctionsCreated, jB = r2.body?.autoJunctionsCreated;
    if (jA?.length) jA.forEach(j => ok(`  Auto-junction ${j.jCode} inserted at (${j.at?.r},${j.at?.c}) between ${aCode} and ${bCode} (${aCode} was deg=3)`));
    if (jB?.length) jB.forEach(j => ok(`  Auto-junction ${j.jCode} inserted at (${j.at?.r},${j.at?.c}) between ${bCode} and ${aCode} (${bCode} was deg=3)`));
    if (!jA?.length && !jB?.length) ok(`Wired: ${aCode}.${D} = ${bCode}  ↔  ${bCode}.${OPP[D]} = ${aCode}`);
    else ok(`Wired via junction chain: ${aCode} → junction → ${bCode}`);
  },

  // ── fill-gap: insert junction chain to bridge a long axis-aligned gap ────────
  // Usage: ./api.sh fill-gap <from> <dir> <to> [--step 4] [--dry-run]
  async 'fill-gap'(pos, flags) {
    const [, from, dir, to] = pos;
    if (!from||!dir||!to) die('Usage: ./api.sh fill-gap <from> <N|E|S|W> <to> [--step N] [--dry-run]');
    const step   = flags.step ? +flags.step : 4;
    const dryRun = flags['dry-run'] !== undefined ? true : !flags.execute;
    const body   = { from, dir: dir.toUpperCase(), to, maxGap:4, step, terrain:'inherit', dryRun };
    const resp   = await request('POST', '/api/graph/fill-gap', body);
    if (resp.status >= 400) { printError(resp); process.exit(1); }
    const d = resp.body;
    if (d.dryRun) {
      ok(`[DRY RUN] ${from}─${dir}→${to}  gap=${d.gap}  needs ${d.junctionsNeeded} junction(s)`);
      (d.plan||[]).forEach(p => ok(`  ${p.code}  r=${p.r} c=${p.c}  ${p.conflict?'CONFLICT: '+p.slot:'free'}`));
      if (d.conflicts?.length) ok(`⚠ ${d.conflicts.length} slot conflicts — resolve before executing`);
      ok(`Add --execute to create junctions`);
    } else {
      ok(`fill-gap: ${d.junctionsCreated} junction(s) created`);
      ok(`Chain: ${d.wireChain}`);
    }
  },

  // ── fix-diagonal: auto-fix one diagonal (bendy) edge via move or elbow ───────
  // Usage: ./api.sh fix-diagonal <CODE> <dir> [--dry-run]
  //   Inspects the edge CODE[dir] and proposes the least-invasive fix:
  //   1. Move target if it has only 1-2 connections (cheap)
  //   2. Otherwise spawn elbow junction at axis intersection
  async 'fix-diagonal'(pos, flags) {
    const [, code, dir] = pos;
    if (!code||!dir) die('Usage: ./api.sh fix-diagonal <CODE> <N|E|S|W> [--dry-run]');
    const D    = dir.toUpperCase();
    const exec = flags.execute && !flags['dry-run'];

    // Validate the edge
    const vResp = await request('GET', `/api/graph/validate/${code}`);
    if (vResp.status >= 400) { printError(vResp); process.exit(1); }
    const v = vResp.body;
    const conn = v.connections?.[D];
    if (!conn) { ok(`${code}.${D}: (no connection)`); return; }
    if (conn.status === 'ok') { ok(`${code}.${D} → ${conn.target}: already OK (${conn.status})`); return; }

    ok(`${code}.${D} → ${conn.target}:  status=${conn.status}  gap=${conn.gap}  offset=${conn.axisOffset}`);

    if (conn.moveSuggestion) {
      const s = conn.moveSuggestion;
      ok(`Suggested fix: move "${s.node}" to r=${s.recommended?.r} c=${s.recommended?.c}`);
      ok(`  ${conn.fix || ''}`);
      if (exec && s.recommended && s.node !== '(junction)' && s.node !== '(new junction)') {
        const mr = await request('POST', '/api/graph/move', {
          code: s.node, r: s.recommended.r, c: s.recommended.c
        });
        if (mr.status >= 400) {
          ok(`Move failed (${mr.body?.error}) — trying elbow junction instead`);
          const jr = await request('POST', '/api/graph/spawn-junction', {
            from: code, dir: D, dryRun: false
          });
          if (jr.status >= 400) { printError(jr); process.exit(1); }
          ok(`Elbow ${jr.body.code} created at (${jr.body.r},${jr.body.c})`);
        } else {
          ok(`Moved ${s.node} → (${s.recommended.r},${s.recommended.c})`);
        }
      } else if (exec) {
        // New junction needed
        const jr = await request('POST', '/api/graph/spawn-junction', { from: code, dir: D, dryRun: false });
        if (jr.status >= 400) { printError(jr); process.exit(1); }
        ok(`Elbow ${jr.body.code} created at (${jr.body.r},${jr.body.c})`);
      } else {
        ok(`Add --execute to apply fix`);
      }
    } else {
      ok(`No auto-fix available — inspect manually: ./api.sh worldmap --city ${code}`);
    }
  },

  // ── fix-all-broken: batch-diagnose all broken edges, apply safe auto-fixes ───
  // Usage: ./api.sh fix-all-broken [--dry-run] [--limit N]
  //   Fetches /api/graph/broken, then for each edge either moves a light node
  //   or spawns an elbow junction. Safe fixes only (no multi-hop guesses).
  async 'fix-all-broken'(pos, flags) {
    const exec  = flags.execute && !flags['dry-run'];
    const limit = flags.limit ? +flags.limit : Infinity;
    const resp  = await request('GET', '/api/graph/broken');
    if (resp.status !== 200) { printError(resp); process.exit(1); }
    const { edges, broken } = resp.body;
    ok(`${broken} broken edges found`);
    if (!exec) ok(`[DRY RUN] showing first ${Math.min(broken, 20)} — add --execute --limit N to fix`);

    let fixed = 0, failed = 0, skipped = 0;
    for (const edge of (edges||[]).slice(0, limit)) {
      const { from, dir, to, type, moveSuggestion } = edge;
      if (type === 'missing_coords') { skipped++; continue; }

      process.stdout.write(`  ${from}─${dir}→${to}  [${type}]`);

      if (!exec) {
        const s = moveSuggestion;
        if (s?.recommended) {
          process.stdout.write(`  → move ${s.node} to (${s.recommended.r},${s.recommended.c})\n`);
        } else {
          process.stdout.write(`  → elbow junction\n`);
        }
        continue;
      }

      // Try move first, fall back to elbow
      const s = moveSuggestion;
      if (s?.recommended && s.node !== '(new junction)' && s.node !== '(junction)') {
        const mr = await request('POST', '/api/graph/move', {
          code: s.node, r: s.recommended.r, c: s.recommended.c
        });
        if (mr.status < 400) {
          process.stdout.write(`  → moved ${s.node} ✓\n`);
          fixed++; continue;
        }
      }
      // Elbow
      const jr = await request('POST', '/api/graph/spawn-junction', { from, dir, dryRun: false });
      if (jr.status < 400) {
        process.stdout.write(`  → elbow ${jr.body?.code} ✓\n`);
        fixed++;
      } else {
        process.stdout.write(`  → FAILED: ${jr.body?.error}\n`);
        failed++;
      }
    }
    if (exec) {
      ok(`Done: ${fixed} fixed, ${failed} failed, ${skipped} skipped (missing coords)`);
      ok(`Re-check: ./api.sh fix-all-broken`);
    }
  },

  // ── nuke-junctions: P_NUKE — bulk-delete all J#### junction nodes ────────────
  // Usage: ./api.sh nuke-junctions [--execute]
  //   Dry-run (default): reports what would be deleted/stitched/deferred.
  //   --execute: applies straight stitches, bulk-deletes all J#### from source,
  //              cleans dangling direction refs, saves snapshot.
  //   After running, deferred L-shaped pairs need A* reconnect (future step).
  //   See: lab-report-junction-reweave-overhaul.md §5
  async 'nuke-junctions'(pos, flags) {
    await requireServer();
    const execute = !!flags.execute;
    if (execute) ok(`Executing P_NUKE — this will delete all J#### nodes and save. No undo except snapshot.`);
    else ok(`Dry-run — add --execute to apply.`);
    await streamPost('/api/graph/nuke-junctions', { execute });
  },

  // ── reweave: mega-loop — rip-and-connect → fix-all-broken → fix-bidir ─────
  // Usage: ./api.sh reweave [--execute] [--max-rip N] [--max-fix N] [--limit N] [--radius N]
  //   Dry-run:  reports what each phase would do, no writes.
  //   --execute: runs all three phases server-side in one call.
  //   --max-rip   max rip-and-connect passes (default 50000)
  //   --max-fix   max fix-all-broken passes  (default 50000)
  //   --limit     nodes per rip-and-connect pass (default 1000000)
  //   --radius    BFS depth for city-search (default 60000)
  //   --no-wither skip Phase 7 wither (default: wither is ON)
  //
  // Stopping conditions (prevents runaway):
  //   Phase 1 stops when totalStrays=0 or maxRip hit.
  //   Phase 2 stops when broken=0, plateau (2 consecutive non-improving passes), or maxFix hit.
  //   Phase 3 always runs once.
  //   Phase 7 (Wither) stops when no unused non-bridge junctions remain.
  async 'reweave'(pos, flags) {
    await requireServer();
    const execute    = !!flags.execute;
    const maxRip     = flags['max-rip']       ? +flags['max-rip']       : 50000;
    const maxFix     = flags['max-fix']       ? +flags['max-fix']       : 50000;
    const step       = flags.step             ? +flags.step             : 4;
    const limit      = flags.limit            ? +flags.limit            : 1000000;
    const meshRadius = flags.radius           ? +flags.radius           : 60000;
    const geoSeed    = flags['no-geo-seed']   ? false : true;
    const cityMesh   = flags['no-city-mesh']  ? false : true;
    const derelict   = flags['no-derelict']   ? false : true;
    const wither     = flags['no-wither']     ? false : true;

    // ── Priority highways — corridor definitions ──────────────────────────
    // Each entry is a {from, to} pair. buildHighway auto-detects shape:
    //   • Pure N/S corridor if one endpoint is nearly due north/south of the other
    //   • Pure E/W corridor if one is nearly due east/west
    //   • L-shape (elbow) only when both axes are significant
    // New junctions stitch into surrounding mesh in ALL 4 directions — not just
    // the corridor axis — so highways merge with the existing node network.
    // Run in Phase 2, after geo-seed, before city MST.
    const PRIORITY_HIGHWAYS = [
      // N/S corridors — same longitude, large latitude delta
      { from:'HHL', to:'MLN',  note:'Meridian spine: Iceland → East Africa (lon~22-40°)' },
      { from:'EDI', to:'CVP',  note:'Atlantic coast: Scotland → Lisbon (lon~3-9°W)' },
      { from:'NID', to:'TUN',  note:'Norse → North Africa (lon~10°E)' },
      // E/W corridors — same latitude, large longitude delta
      { from:'CVP', to:'SAM',  note:'Southern silk road: Lisbon → Samarkand (lat~38°N)' },
      { from:'LHR', to:'TRB',  note:'Northern route: London → Trebizond (lat~41-51°N)' },
      { from:'GLA', to:'SIN',  note:'High latitude: Scotland → Sinop (lat~55-42°N)' },
      // Long diagonals — L-shape elbow
      { from:'ACT', to:'BGD',  note:'West → Mesopotamia connector' },
      { from:'HHL', to:'GEDI', note:'Iceland → Horn of Africa (if GEDI exists)' },
    ];

    process.stdout.write(`${C.bold}══ MegaReWeave ══${C.reset}\n`);
    ok(`execute=${execute}  geoSeed=${geoSeed}  cityMesh=${cityMesh}  derelict=${derelict}  wither=${wither}`);
    ok(`maxRip=${maxRip}  maxFix=${maxFix}  step=${step}  limit=${limit}`);
    ok(`highways: ${PRIORITY_HIGHWAYS.length} configured`);
    if (!execute) ok('[DRY RUN] add --execute to apply all changes');
    ok('streaming from server — output below:\n');

    const body = {
      execute, geoSeed, priorityHighways: PRIORITY_HIGHWAYS,
      cityMesh, derelictCleanup: derelict, witherPhase: wither,
      maxRip, maxFix, step, limit, meshRadius,
    };

    // Uses streamPost — no timeout, prints lines as the server emits them
    await streamPost('/api/graph/reweave-all', body);

    // ── post-reweave checks (run automatically as part of the full workflow) ──
    ok('');
    ok(`${'═'.repeat(60)}`);
    ok(`  POST-REWEAVE CHECKS`);
    ok(`${'═'.repeat(60)}`);
    ok('');
    ok('── reachability ─────────────────────────────────────────');
    await this.reachability();
    ok('');
    ok('── broken edges ─────────────────────────────────────────');
    await this.broken([], {});
    ok('');
    ok('── geographic world map ──────────────────────────────────');
    await this.worldmap([], {});
    ok('');
    ok(`${'═'.repeat(60)}`);
    ok('  reweave workflow complete.');
    ok(`${'═'.repeat(60)}`);
  },

  // ── promote-junction: upgrade a junction node to real content, wiring preserved ─
  // Usage: ./api.sh promote-junction <CODE> --label "Name" --text "desc" [--terrain key]
  //        [--npc key] [--act N]
  async 'promote-junction'(pos, flags) {
    await requireServer();
    const code = pos[0]; if (!code) die('Usage: ./api.sh promote-junction <CODE> --label "..." --text "..."');
    const label   = flags.label;
    const text    = flags.text;
    const terrain = flags.terrain;
    const npc     = flags.npc || null;
    const act     = flags.act ? +flags.act : undefined;
    const sleep   = !!flags.sleep;
    if (!label) die('--label is required');
    if (!text)  die('--text is required');
    const body = { code, label, text, ...(terrain?{name:terrain}:{}), npc, sleep, ...(act!==undefined?{act}:{}) };
    const r = await request('POST', '/api/graph/promote-junction', body);
    if (r.status === 200) {
      ok(`Promoted ${code} → "${label}"`);
      ok(`Connections preserved: ${JSON.stringify(r.body.connections)}`);
    } else {
      printError(r); process.exit(1);
    }
  },

  // ── fix-bidirectional: batch-fix one-way links (A→B but B doesn't point back) ─
  // Usage: ./api.sh fix-bidirectional [--execute]
  //   Dry-run: calls GET /api/audit/map, counts bidirectional violations, shows summary.
  //   --execute: POSTs to /api/audit/map/fix (no body) which fixes all diagonal + one-way
  //              issues in one pass, then saves and reloads.
  async 'fix-bidirectional'(pos, flags) {
    await requireServer();
    const exec = !!flags.execute;

    if (!exec) {
      // Dry-run: fetch audit to show how many violations exist
      const r = await request('GET', '/api/audit/map');
      if (r.status !== 200) { printError(r); process.exit(1); }
      const errors = (r.body.errors || []).filter(e => e.check === 'bidirectional');
      ok(`${errors.length} bidirectional violations found`);
      if (errors.length) ok(`[DRY RUN] add --execute to fix all`);
      return;
    }

    const r = await request('POST', '/api/audit/map/fix', {});
    if (r.status !== 200) { printError(r); process.exit(1); }
    const { fixed = [], errors = [], note } = r.body;
    const bidir = fixed.filter(f => f.check === 'bidirectional');
    const diag  = fixed.filter(f => f.check === 'diagonal_exit');
    ok(`Done: ${bidir.length} bidirectional fixed, ${diag.length} diagonal fixed, ${errors.length} errors`);
    if (note) ok(note);
    ok(`Re-check: ./api.sh audit --map`);
  },

  // ── highway: build a full junction chain between two cities ─────────────────
  // Usage: ./api.sh highway <from> <to> [--step 4] [--dry-run] [--terrain junction]
  //
  // Builds a walkable highway of junctions from <from> to <to>.
  // Strategy:
  //   1. Fetch coordinates of both cities
  //   2. Walk East/West first to align columns, then North/South to align rows
  //      (or vice versa, whichever is shorter first leg)
  //   3. At the corner turn, insert an elbow junction
  //   4. Fill each straight segment with junctions spaced --step apart
  //   5. Wire <from>.dir = first junction, last junction.dir = <to>
  //
  // Signpost text is generated for each junction indicating the road name.
  async highway(pos, flags) {
    const [, fromCode, toCode] = pos;
    if (!fromCode || !toCode) die('Usage: ./api.sh highway <from> <to> [--step N] [--dry-run] [--terrain type]');
    const step     = flags.step    ? +flags.step : 4;
    const terrain  = flags.terrain || 'junction';
    const dryRun   = flags['dry-run'] !== undefined ? true : !flags.execute;
    const OPP = { N:'S', S:'N', E:'W', W:'E' };

    // Fetch current state
    const [nmResp, coordResp] = await Promise.all([
      request('GET', '/api/export/node_map?format=json'),
      request('GET', '/api/coords'),
    ]);
    if (nmResp.status !== 200) { printError(nmResp); process.exit(1); }
    const nm     = nmResp.body.data   || {};
    const coords = coordResp.body.coords || {};

    const fromNode = nm[fromCode]; if (!fromNode) die(`Node "${fromCode}" not found`);
    const toNode   = nm[toCode];   if (!toNode)   die(`Node "${toCode}" not found`);
    const ca = coords[fromCode]; if (!ca) die(`"${fromCode}" has no coordinates — run geo-seed first`);
    const cb = coords[toCode];   if (!cb) die(`"${toCode}" has no coordinates — run geo-seed first`);

    const fromLabel = (fromNode.label || fromCode).split(/[—–]/)[0].trim().slice(0, 20);
    const toLabel   = (toNode.label   || toCode).split(/[—–]/)[0].trim().slice(0, 20);
    const roadName  = `The ${fromLabel}–${toLabel} Road`;

    const dr = cb.r - ca.r;  // positive = toCode is south of fromCode
    const dc = cb.c - ca.c;  // positive = toCode is east  of fromCode

    ok(`Highway: ${fromCode}(${ca.r},${ca.c}) → ${toCode}(${cb.r},${cb.c})  Δr=${dr} Δc=${dc}`);
    ok(`Road: "${roadName}"  step=${step}  terrain=${terrain}`);
    if (dryRun) ok(`[DRY RUN] — add --execute to create junctions`);

    // Plan the route: leg1 (horizontal or vertical), elbow, leg2
    // Choose: go horizontal first if |dc| > |dr|, else vertical first
    const goHorizFirst = Math.abs(dc) >= Math.abs(dr);
    const leg1Dir = goHorizFirst ? (dc >= 0 ? 'E' : 'W') : (dr >= 0 ? 'S' : 'N');
    const leg2Dir = goHorizFirst ? (dr >= 0 ? 'S' : 'N') : (dc >= 0 ? 'E' : 'W');
    const elbowR  = goHorizFirst ? ca.r : cb.r;   // elbow row
    const elbowC  = goHorizFirst ? cb.c : ca.c;   // elbow col

    const leg1Steps = goHorizFirst ? Math.abs(dc) : Math.abs(dr);
    const leg2Steps = goHorizFirst ? Math.abs(dr) : Math.abs(dc);

    ok(`Route: ${leg1Dir} ${leg1Steps} units, elbow at (${elbowR},${elbowC}), ${leg2Dir} ${leg2Steps} units`);
    ok(`Junctions needed: leg1≈${Math.ceil(leg1Steps/step)-1}  leg2≈${Math.ceil(leg2Steps/step)-1}  + 1 elbow`);

    if (dryRun) return;

    // ── Execute ──────────────────────────────────────────────────────────────
    // Helper: spawn one junction in a given direction from a source node
    const spawnNext = async (srcCode, dir, overrideR, overrideC) => {
      const body = { from: srcCode, dir, dryRun: false, terrain,
        label: `${roadName} Waypoint`, text: `Signpost says: ${roadName}. Follow this road between ${fromLabel} and ${toLabel}.` };
      const r = await request('POST', '/api/graph/spawn-junction', body);
      if (r.status >= 400) {
        ok(`  WARN: ${r.body?.error || 'spawn failed'} — skipping`);
        return null;
      }
      ok(`  ✓ ${r.body.code} at (${r.body.r},${r.body.c})`);
      return r.body.code;
    };

    // Fill leg 1: from → toward elbow, step by step
    ok(`\nLeg 1: ${fromCode} → elbow (${elbowR},${elbowC}) going ${leg1Dir}`);
    let prevCode = fromCode;
    let stepsLeft = leg1Steps;
    while (stepsLeft > step) {
      const next = await spawnNext(prevCode, leg1Dir);
      if (!next) break;
      prevCode = next;
      stepsLeft -= step;
    }
    // Last junction of leg 1 (the elbow itself)
    const elbowCode = await spawnNext(prevCode, leg1Dir);
    if (elbowCode) {
      // Move elbow to exact corner position
      const mv = await request('POST', '/api/graph/move', { code: elbowCode, r: elbowR, c: elbowC });
      if (mv.status < 400) ok(`  Elbow moved to (${elbowR},${elbowC})`);

      // Fill leg 2: elbow → toCode
      ok(`\nLeg 2: elbow → ${toCode} going ${leg2Dir}`);
      prevCode = elbowCode;
      stepsLeft = leg2Steps;
      while (stepsLeft > step) {
        const next = await spawnNext(prevCode, leg2Dir);
        if (!next) break;
        prevCode = next;
        stepsLeft -= step;
      }
      // Wire last junction to destination
      const r1 = await request('PUT', `/api/node/${prevCode}`, { [leg2Dir]: toCode });
      const r2 = await request('PUT', `/api/node/${toCode}`,   { [OPP[leg2Dir]]: prevCode });
      if (r1.status < 400 && r2.status < 400) {
        ok(`  ✓ Wired: ${prevCode}.${leg2Dir} = ${toCode}`);
      }
    }

    ok(`\nHighway complete. Verify:`);
    ok(`  ./api.sh worldmap --route ${fromCode} --to ${toCode}`);
    ok(`  ./api.sh worldmap --city ${fromCode}`);
  },

  async mode(pos, flags) {
    await requireServer();
    const newMode = pos[1]; // fast | debug | trace | undefined = GET
    if (!newMode) {
      const r = await request('GET', '/api/mode');
      if (r.status !== 200) { printError(r); process.exit(1); }
      const { mode, verbose, trace } = r.body;
      const modeColor = { fast: C.dim, debug: C.yellow, trace: C.cyan }[mode] || C.white;
      ok(`${modeColor}${C.bold}${mode.toUpperCase()}${C.reset}  ${C.dim}verbose=${verbose}  trace=${trace}${C.reset}`);
      return;
    }
    const r = await request('POST', '/api/mode', { mode: newMode });
    if (r.status !== 200) { printError(r); process.exit(1); }
    ok(`mode → ${C.bold}${r.body.mode.toUpperCase()}${C.reset}  ${C.dim}verbose=${r.body.verbose}  trace=${r.body.trace}${C.reset}`);
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
  PREFERRED TOOL — USE api.sh, NOT curl
═══════════════════════════════════════════════════════════════════${C.reset}

  ${C.yellow}Always use ./api.sh for day-to-day work. Raw curl is a fallback only.${C.reset}

  api.sh handles automatically:
    • Nonces (one-time write tokens) — acquired and attached for you
    • Retry with exponential backoff on 5xx or connection errors
    • Pipe-safe JSON — errors land on stdout so | jq and | python3 work
    • Queued requests — serialised to avoid race conditions on writes
    • Auto-reload notification — the server watches roll2hit-v3.html;
      you do not need POST /api/reload after an external edit

  If a feature is missing from api.sh, request an API refactor — do not
  fall back to curl. Describe the operation and it will be added as a
  named command. See API-README.md §Requesting new features.

${C.bold}═══════════════════════════════════════════════════════════════════
  TABLE OF CONTENTS
═══════════════════════════════════════════════════════════════════${C.reset}

  §1  THE COMMON CYCLE — search → inspect → edit
  §2  COMMAND INDEX (all commands, one line each)
  §3  GLOBAL OPTIONS
  §4  ping — server health
  §5  count — breakdown statistics
  §6  get — fetch one entity
  §7  list — collection listing with filters
      list node  |  list quest  |  list monster  |  list npc  |  list terrain  |  list ids
  §8  location — composite node view
  §9  chain — quest dependency chain
  §10 put — edit one or more fields
  §11 post — create a new entity
  §12 del — delete an entity
  §13 audit — integrity scan
  §14 export — dump collection data
  §15 import — bulk import nodes + quest cycles
  §16 speak — Claude-voiced NPC dialogue
  §17 nonce — one-time write token
  §18 ai — ask Claude about the API
  §19 MAP VISUALIZATION  (worldmap --regions --region --city --search --monster --route)
  §20 COORDINATE MANAGEMENT  (geo-seed  move  find-open-location)
  §21 NETWORK WIRING  (smart-connect  highway  junction  fill-gap  connect)
  §22 NETWORK HEALTH & REPAIR  (broken  reachability  junction-audit  fix-diagonal  fix-all-broken  fix-bidirectional  rip-and-connect  reweave)
  §23 COMMON RECIPES
  §24 SERVER LIFECYCLE

${C.bold}═══════════════════════════════════════════════════════════════════
  §1  THE COMMON CYCLE — search → inspect → edit
═══════════════════════════════════════════════════════════════════${C.reset}

  The workflow for every entity type follows the same three steps.
  Never guess an ID — search first, then fetch full details, then edit.

  ── quests ───────────────────────────────────────────────────────

  # 1. Find the quest by keyword
  ./api.sh list quest --q "wolsey"
  ./api.sh list quest --arc shk --q "inventory"
  ./api.sh list quest --node BK --type skill_check

  # 2. Fetch all fields for the exact quest
  ./api.sh get quest shk6_act1
  # → see desc, passText, failText, npc, activateNode, checkDC, etc.

  # 3. Patch the specific field(s) you need
  ./api.sh put quest shk6_act1 desc="Egil Thorvaldsen, a Birka wool factor..."
  ./api.sh put quest shk6_act1 npc=egil_thorvaldsen checkDC=14
  # Multi-field — pipe JSON:
  echo '{"desc":"...","passText":"...","failText":"..."}' | ./api.sh put quest shk6_act1

  ── nodes ────────────────────────────────────────────────────────

  # 1. Find the node
  ./api.sh list node --q "nuremberg"
  ./api.sh list node --terrain scholars_qtr
  ./api.sh list node --act 2 --q "birka"

  # 2. Get composite view — node + quests + NPCs + monsters
  ./api.sh location NUE
  ./api.sh get node NUE
  # → label, terrain, coords, N/E/S/W links, quest list, NPC list

  # 3. Edit
  ./api.sh put node NUE label="Nuremberg Scholar Quarter"
  ./api.sh put node NUE N=BMA S=KRN

  ── NPCs ─────────────────────────────────────────────────────────

  # 1. Find the NPC
  ./api.sh list npc --q "egil"
  ./api.sh list npc --node BK
  ./api.sh list npc --occupation "clerk"

  # 2. Fetch full details (quests linked, node, occupation)
  ./api.sh get npc egil_thorvaldsen

  # 3. Edit
  ./api.sh put npc egil_thorvaldsen occupation="wool factor and Hanseatic broker"
  # Link a quest to this NPC:
  ./api.sh put quest shk6_act1 npc=egil_thorvaldsen

  ── monsters ─────────────────────────────────────────────────────

  # 1. Find the monster
  ./api.sh list monster --terrain crypt
  ./api.sh list monster --q "shadow" --tier easy

  # 2. Inspect stat block
  ./api.sh get monster shadow

  # 3. Tune a field
  ./api.sh put monster shadow hp=22 ac=13
  ./api.sh put monster shadow tier=medium

  ── terrain ──────────────────────────────────────────────────────

  # 1. Find terrain key (needed when creating nodes)
  ./api.sh list terrain --q "scholar"
  ./api.sh list terrain --ids

  # 2. Inspect which monsters are in it
  ./api.sh get terrain scholars_qtr
  ./api.sh list monster --terrain scholars_qtr

  # 3. Update label or icon
  ./api.sh put terrain scholars_qtr label="Scholar's Quarter"

  ── create → verify → commit cycle ──────────────────────────────

  # Create an NPC
  ./api.sh post npc key=marta_vby name="Marta" node=VBY occupation="Flemish intake clerk"

  # Confirm it landed
  ./api.sh get npc marta_vby

  # Link a quest to it
  ./api.sh list quest --arc shk --q "visby"    # find the quest ID
  ./api.sh put quest shk6_act2 npc=marta_vby   # link it

  # Audit — confirm zero errors/warnings
  ./api.sh audit --raw | jq '{errors:.errors|length, warnings:.warnings|length}'

  ── bulk search with jq ──────────────────────────────────────────

  # All quests missing desc
  ./api.sh export quest_db --raw | jq '[to_entries[] | select(.value.desc=="" or .value.desc==null) | .key]'

  # All quests for a specific NPC
  ./api.sh list quest --npc egil_thorvaldsen

  # All nodes in act 2 with no quests
  ./api.sh list node --act 2 --has-quests false

  # NPC keys at a specific node
  ./api.sh list npc --node NUE --ids

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
  mode — get or set the server logging mode
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh mode               show current mode
  ./api.sh mode fast          minimal output (quiet)
  ./api.sh mode debug         verbose — request/response bodies logged
  ./api.sh mode trace         verbose + full algorithm trace (ultra-verbose)

  Mode is saved to milepoints/wbapi-config.json and survives restarts.
  Default is TRACE. Env vars WBAPI_VERBOSE / WBAPI_TRACE override on startup.

  Examples:
    ./api.sh mode
    ./api.sh mode fast
    ./api.sh mode trace

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
  MAP VISUALIZATION
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh worldmap [options]

  Three zoom levels — each embeds navigation hints for the next level.
  No curl needed. All map operations go through ./api.sh worldmap.

  Level 0 — World (all 76 geo-referenced cities, lat/lon oriented):
    ./api.sh worldmap
    ./api.sh worldmap --latlon

  Level 1 — Region (6×6 grid, A1–F6, west→east, north→south):
    ./api.sh worldmap --regions
    ./api.sh worldmap --region A1
    ./api.sh worldmap --region B2
    ./api.sh worldmap --region C3
    ./api.sh worldmap --region C4
    ./api.sh worldmap --region C5

  Level 2 — City (immediate connections, terrain, gap/bendy status):
    ./api.sh worldmap --city LHR
    ./api.sh worldmap --city CON
    ./api.sh worldmap --city ROM
    ./api.sh worldmap --city JAR
    ./api.sh worldmap --city BGD
    ./api.sh worldmap --city SAM

  Search / Hunt:
    ./api.sh worldmap --search "crypt"
    ./api.sh worldmap --search "forest"
    ./api.sh worldmap --search "Jerusalem"
    ./api.sh worldmap --monster skeleton
    ./api.sh worldmap --monster thug
    ./api.sh worldmap --monster drowner

  Route navigation (BFS A→B, shows turn-by-turn + terrain + battles):
    ./api.sh worldmap --route LHR --to CON
    ./api.sh worldmap --route LON --to JAR
    ./api.sh worldmap --route LHR --to SAM
    ./api.sh worldmap --route GLA --to NID

${C.bold}═══════════════════════════════════════════════════════════════════
  COORDINATE MANAGEMENT
═══════════════════════════════════════════════════════════════════${C.reset}

  ./api.sh geo-seed [--execute]

  Dry-run by default (shows what would change). --execute applies.
  Anchors 76 major cities to real lat/lon positions on the game grid.

    ./api.sh geo-seed
    ./api.sh geo-seed --execute

  After geo-seed, propagate all connected nodes:
    node layout-solve.js --apply

  Move a node's coordinates (swap if destination is occupied):
    ./api.sh move LHR 12 18
    ./api.sh move LHR 12 18 --swap
    ./api.sh move KRN 13 18

  Find open attachment points near a city (where to add new content):
    ./api.sh find-open-location LHR
    ./api.sh find-open-location CON
    ./api.sh find-open-location LHR --radius 10

${C.bold}═══════════════════════════════════════════════════════════════════
  NETWORK WIRING
═══════════════════════════════════════════════════════════════════${C.reset}

  Connection rules (enforced everywhere):
    • Max 4 connections per node
    • Degree-3 rule: if inserting into a deg=3 node, junction auto-created first
    • A→B = A-mesh → B-mesh: use smart-connect for city-to-city wiring
    • After any change: run broken + reachability to check for regressions

  Preferred — mesh-aware (finds open insertion points in each city's mesh):
    ./api.sh smart-connect LHR CON
    ./api.sh smart-connect LHR CON --execute
    ./api.sh smart-connect KOL SAM --execute
    ./api.sh smart-connect GLA NID --execute
    ./api.sh smart-connect LHR CON --radius 8

  Full junction highway (L-shaped route, elbow at corner):
    ./api.sh highway LHR CON
    ./api.sh highway LHR CON --execute
    ./api.sh highway KOL REG --execute
    ./api.sh highway REG VEN --execute
    ./api.sh highway VEN CON --execute
    ./api.sh highway CON SIN --execute
    ./api.sh highway ANT JAR --execute
    ./api.sh highway BGD SAM --execute
    ./api.sh highway MAR CVP --execute
    ./api.sh highway GLA NID --step 2 --execute
    ./api.sh highway WOR REG --terrain junction --execute

  Single junction node:
    ./api.sh junction LHR S
    ./api.sh junction LHR S --execute
    ./api.sh junction LHR S --label "Birka South Gate" --terrain city --execute
    ./api.sh junction CON W --execute

  Fill gap between two existing connected nodes:
    ./api.sh fill-gap WOR E SAL
    ./api.sh fill-gap WOR E SAL --execute
    ./api.sh fill-gap KOL S REG --step 4 --execute
    ./api.sh fill-gap LHR S KRN --execute

  Direct wire (warns on deg=3 or deg=4; --force to override):
    ./api.sh connect WOR E SAL
    ./api.sh connect CON W THA
    ./api.sh connect GLA S YRK
    ./api.sh connect VEN N ROM
    ./api.sh connect ANT S JAR

${C.bold}═══════════════════════════════════════════════════════════════════
  NETWORK HEALTH & REPAIR
═══════════════════════════════════════════════════════════════════${C.reset}

  Check broken edges (diagonal or gap > 4):
    ./api.sh broken
    ./api.sh broken --maxgap 4

  Check reachability (% of nodes walkable from hub):
    ./api.sh reachability

  Junction audit (breakdown + P_NUKE dry-run preview):
    ./api.sh junction-audit

  Nuclear junction cull (delete all J#### nodes):
    ./api.sh nuke-junctions             # dry-run
    ./api.sh nuke-junctions --execute   # apply

  Fix a single broken edge:
    ./api.sh fix-diagonal LHR S
    ./api.sh fix-diagonal LHR S --execute
    ./api.sh fix-diagonal BMA N --execute
    ./api.sh fix-diagonal KRN N --execute

  Batch-fix all broken edges:
    ./api.sh fix-all-broken
    ./api.sh fix-all-broken --execute
    ./api.sh fix-all-broken --execute --limit 50

  Fix all one-way links (A→B but B doesn't point back):
    ./api.sh fix-bidirectional
    ./api.sh fix-bidirectional --execute

  Mega-loop repair (all phases server-side, 100x limits):
    ./api.sh reweave
    ./api.sh reweave --execute
    ./api.sh reweave --execute --max-rip 50000 --max-fix 50000 --limit 1000000
    ./api.sh reweave --execute --max-rip 50000 --max-fix 50000 --limit 1000000 --radius 60000
    ./api.sh reweave --execute --no-wither     (skip Phase 7 junction wither)

  Relocate all stray/unreachable nodes near their quest city:
    ./api.sh rip-and-connect
    ./api.sh rip-and-connect --execute
    ./api.sh rip-and-connect --execute --limit 50
    ./api.sh rip-and-connect --execute --limit 100 --radius 8

  Full world reset sequence (run in order):
    ./api.sh geo-seed --execute
    node layout-solve.js --apply
    ./api.sh highway LHR CON --execute
    ./api.sh highway KOL REG --execute
    ./api.sh smart-connect LHR CON --execute
    ./api.sh rip-and-connect --execute --limit 100
    ./api.sh fix-all-broken --execute
    ./api.sh broken
    ./api.sh reachability

${C.bold}═══════════════════════════════════════════════════════════════════
  SERVER LIFECYCLE
═══════════════════════════════════════════════════════════════════${C.reset}

  ./wbapi-toggle.sh start     Start server in background (auto-restart loop)
  ./wbapi-toggle.sh stop      Kill background instance
  ./wbapi-toggle.sh restart   Stop + start (required after wbapi-server.js changes)
  ./wbapi-toggle.sh status    Show PID and port
  ./wbapi-toggle.sh fg        Run in foreground with full log scroll

  ── Logging modes ────────────────────────────────────────────────

  Normal (default):
    ./wbapi-toggle.sh start
    → Request method/URL, response status, timing. No bodies.

  Verbose — full request + response bodies:
    WBAPI_VERBOSE=1 node wbapi-server.js
    WBAPI_VERBOSE=1 ./wbapi-toggle.sh fg
    → Every body printed to terminal AND log file.

  Trace — ultra-verbose algorithm decisions:
    WBAPI_TRACE=1 node wbapi-server.js
    WBAPI_TRACE=1 ./wbapi-toggle.sh fg
    → Logs every decision: auto-junction trigger, rip-and-connect stray
      scoring + placement, smart-connect candidate selection, fill-gap
      junction chain steps, PUT field processing, node creation details.
    → Completely independent of VERBOSE. Off by default.

  Both at once:
    WBAPI_VERBOSE=1 WBAPI_TRACE=1 node wbapi-server.js

  Live log tail (all modes write here):
    tail -f milepoints/wbapi-server.log
    tail -f milepoints/wbapi-server.log | grep TRACE
    tail -f milepoints/wbapi-server.log | grep "auto-junction\|rip-stray\|smart-connect"

  Log file: milepoints/wbapi-server.log
  Port:     1367  (the canonical game year, 1367 AD)

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
  `  ${C.yellow}Directive: always use ./api.sh — never curl. Request a refactor if a feature is missing.${C.reset}`,
  `  ${C.yellow}Maintain the network: run broken + reachability after every change.${C.reset}`,
  ``,
  `  ${C.bold}── Health ──────────────────────────────────────────────────────────────${C.reset}`,
  `  ${C.green}ping${C.reset}                               health check + entity counts`,
  `  ${C.green}broken${C.reset} [--maxgap N]               list broken edges (target: 0)`,
  `  ${C.green}reachability${C.reset}                       % reachable from hub (target: 100%)`,
  `  ${C.green}audit${C.reset} [--map]                      integrity scan`,
  ``,
  `  ${C.bold}── Read ────────────────────────────────────────────────────────────────${C.reset}`,
  `  ${C.green}count${C.reset} [nodes|quests|monsters|npcs|terrains|coords]  stats`,
  `  ${C.green}get${C.reset}   <type> <id>                  fetch entity`,
  `  ${C.green}list${C.reset}  [type] [filters]             list (no type = index)`,
  `  ${C.green}location${C.reset} [code]                    composite node view`,
  `  ${C.green}chain${C.reset} <quest-id>                   quest chain`,
  `  ${C.green}export${C.reset} <collection>                dump JSON  [--format js|module]`,
  ``,
  `  ${C.bold}── Write ───────────────────────────────────────────────────────────────${C.reset}`,
  `  ${C.green}post${C.reset}  <type> [k=v…]                create`,
  `  ${C.green}put${C.reset}   <type> <id> [k=v…]           update fields  (or pipe JSON)`,
  `  ${C.green}del${C.reset}   <type> <id>                  delete`,
  `  ${C.green}speak${C.reset} <npc-id> "<prompt>"           Claude NPC reply`,
  `  ${C.green}import${C.reset} <file.json>                 bulk import nodes + quest cycles`,
  ``,
  `  ${C.bold}── Map & Coordinates ───────────────────────────────────────────────────${C.reset}`,
  `  ${C.green}worldmap${C.reset} [--regions] [--region A1] [--city CODE] [--search Q] [--monster M] [--route A --to B]`,
  `  ${C.green}geo-seed${C.reset} [--execute]               seed major cities from lat/lon`,
  `  ${C.green}move${C.reset} <CODE> <r> <c> [--swap]       move node coordinates`,
  ``,
  `  ${C.bold}── Network Wiring ──────────────────────────────────────────────────────${C.reset}`,
  `  ${C.green}smart-connect${C.reset} <A> <B>              mesh-aware connect: finds open slots, respects deg rules  [--radius 6] [--execute]`,
  `  ${C.green}find-open-location${C.reset} <city>         find open attachment points near a city  [--radius 8]`,
  `  ${C.green}connect${C.reset} <A> <dir> <B>              direct wire (warns on deg=3/4 issues)  [--force]`,
  `  ${C.green}junction${C.reset} <from> <dir> [--label "…"] [--terrain T] [--execute]`,
  `  ${C.green}fill-gap${C.reset} <from> <dir> <to>         junction chain for gap > 4  [--step N] [--execute]`,
  `  ${C.green}highway${C.reset} <from> <to>                full junction highway  [--step 4] [--execute]`,
  `  ${C.green}rip-and-connect${C.reset} [--execute] [--limit 50]  auto-relocate stray nodes to nearest city mesh`,
  `  ${C.green}fix-diagonal${C.reset} <CODE> <dir>          fix one diagonal edge  [--execute]`,
  `  ${C.green}fix-all-broken${C.reset} [--execute] [--limit N]  batch-fix all broken edges`,
  `  ${C.green}fix-bidirectional${C.reset} [--execute]         fix all one-way links (A→B but B doesn't point back)`,
  `  ${C.green}reweave${C.reset} [--execute] [--max-rip 50000] [--max-fix 50000] [--step 4] [--limit 1000000] [--radius 60000] [--no-wither]  MegaReWeave: geo-seed→highways→city-MST→fix-broken→fix-bidir→derelict→wither (streaming, no timeout)`,
  ``,
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
    await fn.call(CMD, pos, flags);
  } catch (e) {
    if (e.code === 'ECONNREFUSED') die(`Server not running at ${BASE}\n  Start: ./wbapi-toggle.sh start`);
    die(e.message || String(e));
  }
})();
