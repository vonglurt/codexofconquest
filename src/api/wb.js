#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// Copyright (c) 2026 Paul Richeson <paulr@sdf.org> — CodexOfConquest.com
'use strict';
// api/wb.js — Codex of Conquest WBAPI CLI wrapper
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

// ── CLI Log — build/milepoints/api-cli.log ─────────────────────────────────────────
const path     = require('path');
const LOG_FILE = path.join(__dirname, '..', '..', 'build', 'milepoints', 'api-cli.log');
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
// Used for long-running server operations (nuke-junctions, cluster-bridge) that have no timeout.
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
const AI_SYSTEM = `You are a concise assistant for the Codex of Conquest World Builder API (WBAPI) at localhost:1367.
The game is a D&D 5e world stored in a single HTML file. The API manages: nodes (map locations), quests, monsters, npcs, terrain.

./bin/api CLI cheatsheet:
  ./bin/api ping                                 check server
  ./bin/api count [nodes|quests|monsters|npcs|terrains|coords]  breakdown stats
  ./bin/api get <type> <id>                      fetch entity JSON
  ./bin/api list [type]                          list (no type = index)
  ./bin/api list ids <type>                      IDs-only array
  ./bin/api list node --act N --terrain X --q text --no-coords --has-quests bool --junction bool --ids
  ./bin/api list quest --node X --type X --arc X --npc X --monster X --has-npc bool --ids
  ./bin/api list monster --terrain X --tier X --has-drop bool --no-terrain --ids
  ./bin/api list npc --node X --occupation X --q text --ids
  ./bin/api put <type> <id> k=v [k=v]            update fields
  ./bin/api post <type> k=v [k=v]                create entity (nonce auto-handled)
  ./bin/api del <type> <id>                      delete (nonce auto-handled)
  ./bin/api audit [--map] [--data] [--section node|quest|monster|terrain|coords]  integrity scan
  ./bin/api chain <quest-id>                     quest dependency chain
  ./bin/api advise <quest-id>                    §ARCH-02 Ph5: quest fields + chain + advisory in one call
  ./bin/api batch-npc <updates.json>             §AUDIT-03b: bulk quest.npc re-anchor, one save ([{id,npc},…])
  ./bin/api export <collection>                  dump JSON (node_map quest_db monster_pool world_db all)
  ./bin/api location [code]                      composite view (no code = list all)
  ./bin/api speak <npc> "<prompt>" --state neutral|friendly|dearFriend
  ./bin/api import <file.json>                   bulk import nodes + quest cycles  [--out file]
  ./bin/api roads [pins]                         road net summary / pins file (§NAV-01h)
  ./bin/api reweave                              regenerate ROAD_RUNS from roads-pins.json + check:roads
  ./bin/api mesh status|peers|tracker [url]      multiplayer mesh: identity/peers/server browser (§MESH-01)
  ./bin/api mesh acl|blocklist|connect ...       mesh ACL editor, blocklist share/preview, runtime dial (§MESH-02)

Reply in 1–3 lines. Lead with a concrete ./bin/api command when applicable.`;

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
    if (!type || !id) die('Usage: ./bin/api get <type> <id>');
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
    // ids-only shorthand: ./bin/api list ids node  OR  ./bin/api list node --ids
    if (type === 'ids') {
      const subtype = pos[2];
      if (!subtype) die('Usage: ./bin/api list ids <node|quest|monster|npc|terrain>');
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

  // ── save / snapshots (§DX-02l) ──────────────────────────────────────────────
  // Every WRITE already reaches disk on its own (§DX-02k: temp + atomic rename).
  // `save` is the DELIBERATE dated backup — the one surface that stamps on
  // purpose — and it was reachable only by raw `curl`, which is exactly what
  // prompt.md §3 says never to fall back to.
  async save(pos, flags) {
    await requireServer();
    const r = await request('POST', '/api/save');
    if (r.status !== 200) { printError(r); process.exit(1); }
    if (flags.raw || flags.out) { printResult(r.body, flags); return; }
    const mb = r.body.bytes ? `  ${C.dim}(${(r.body.bytes / 1048576).toFixed(1)} MB)${C.reset}` : '';
    ok(`primary  ${r.body.primary}`);
    ok(`backup   ${r.body.backup}${mb}`);
    info('list them with ./bin/api snapshots');
  },

  // Dated backups are gitignored, so nothing else in the repo will tell you they
  // are there — §DX-02k found six (~32 MB) nobody had seen.
  async snapshots(pos, flags) {
    await requireServer();
    if (flags.sweep) {
      const nonce = await getNonce('snapshot', 'sweep');
      const qs = flags.force ? '?force=true' : '';
      const r = await request('DELETE', `/api/snapshots${qs}`, null, { 'X-Nonce': nonce });
      if (r.status >= 400) { printError(r); process.exit(1); }
      if (flags.raw || flags.out) { printResult(r.body, flags); return; }
      ok(`deleted ${r.body.deleted.length}  ${C.dim}(${(r.body.freedBytes / 1048576).toFixed(1)} MB freed)${C.reset}`);
      for (const s of r.body.skipped)
        process.stdout.write(`  ${C.yellow}kept${C.reset} ${s.name}  ${C.dim}${s.reason}${C.reset}\n`);
      return;
    }
    const r = await request('GET', '/api/snapshots');
    if (r.status !== 200) { printError(r); process.exit(1); }
    if (flags.raw || flags.out) { printResult(r.body, flags); return; }
    const d = r.body;
    ok(`${d.count} snapshot(s) in ${d.dir}  ${C.dim}(${(d.totalBytes / 1048576).toFixed(1)} MB, ${d.archived} archived)${C.reset}`);
    for (const s of d.snapshots)
      process.stdout.write(`  ${s.archived ? `${C.green}archived  ${C.reset}` : `${C.yellow}unarchived${C.reset}`}  ${s.name}  ${C.dim}${(s.bytes / 1048576).toFixed(1)} MB${C.reset}\n`);
    if (d.count) {
      info('fold them into the patch chain (keeps each delta, then removes the file):  ./archive-snapshots.sh');
      info('or delete the already-archived ones:  ./bin/api snapshots --sweep   [--force to discard unarchived too]');
    }
  },

  async put(pos, flags) {
    await requireServer();
    const [, type, id, ...rest] = pos;
    if (!type || !id) die('Usage: ./bin/api put <type> <id> [k=v ...]  (or pipe JSON)');
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
    if (!type) die('Usage: ./bin/api post <type> [k=v ...]  (or pipe JSON)');
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
    if (!type || !id) die('Usage: ./bin/api del <type> <id>');
    const nonce = await getNonce(type, id);
    const r = await request('DELETE', `/api/${type}/${encodeURIComponent(id)}`, null, { 'X-Nonce': nonce });
    if (r.status >= 400) { printError(r); process.exit(1); }
    ok(`${type}:${id} deleted`);
  },

  async audit(pos, flags) {
    await requireServer();
    let auditPath;
    if (flags.data) {
      const section = flags.section || 'all';
      auditPath = `/api/audit/data${section !== 'all' ? `?section=${section}` : ''}`;
    } else {
      auditPath = flags.map ? '/api/audit/map' : '/api/audit';
    }
    const sep  = auditPath.includes('?') ? '&' : '?';
    const q    = flags.text ? `${sep}format=text` : '';
    const r    = await request('GET', auditPath + q);
    if (r.status !== 200) { printError(r); process.exit(1); }
    printResult(r.body, flags);
  },

  async chain(pos, flags) {
    await requireServer();
    const [, id] = pos;
    if (!id) die('Usage: ./bin/api chain <quest-id>');
    const r = await request('GET', `/api/quest/${encodeURIComponent(id)}/chain`);
    if (r.status !== 200) { printError(r); process.exit(1); }
    printResult(r.body, flags);
  },

  // §NAV-01h — road net: GET /api/roads (overlay data) / pins subcommand
  async roads(pos, flags) {
    await requireServer();
    if (pos[1] === 'pins') {
      const r = await request('GET', '/api/roads/pins');
      if (r.status !== 200) { printError(r); process.exit(1); }
      printResult(r.body, flags);
      return;
    }
    const r = await request('GET', '/api/roads');
    if (r.status !== 200) { printError(r); process.exit(1); }
    if (flags.json) { printResult(r.body, flags); return; }
    const b = r.body;
    ok(`road net: ${b.cells} cells · ${b.junctions} junctions · ${b.pins.length} pins · ${b.links.length} links · ${b.locked.length} locked 🔒`);
    info('full runs: ./bin/api roads --json   pins file: ./bin/api roads pins');
  },

  // §NAV-01h — Reweave Net: PUT /api/roads (build-roads.js --apply + check:roads)
  async reweave(pos, flags) {
    await requireServer();
    info('reweaving the road net (build-roads.js --apply + check:roads)…');
    const r = await request('PUT', '/api/roads');
    if (r.status !== 200) { printError(r); process.exit(1); }
    const b = r.body;
    ok(`net rewoven: ${b.cells} cells · ${b.junctions} junctions · ${b.pins} pins · ${b.links} links · ${b.check}`);
    for (const line of b.generator || []) if (line) info(line);
  },

  // §MESH-01-FU 10 — mesh status / peers / tracker: API-first parity with the 🌐 Mesh tab
  // §MESH-02g — mesh acl / blocklist / connect: parity with the Map-tab connection center
  async mesh(pos, flags) {
    const sub = pos[1];
    if (!sub || !['status', 'peers', 'tracker', 'acl', 'blocklist', 'connect'].includes(sub))
      die('Usage: ./bin/api mesh status | peers | tracker [url] | acl [k=v ...] | blocklist [host:port] | connect <host:port|http(s)://tracker>   [--json]');
    await requireServer();

    // ── §MESH-02a/g — acl: GET (no args) or validated merge-PUT (k=v args) ──
    if (sub === 'acl') {
      const body = parseKV(pos.slice(2));
      const LISTS = ['blockServerIds', 'blockIps', 'blockWorldHashes', 'allowServerIds', 'allowIps', 'allowWorldHashes'];
      for (const k of LISTS)   // comma-split string → array (JSON arrays pass through)
        if (k in body && typeof body[k] === 'string') body[k] = body[k].split(',').map(v => v.trim()).filter(Boolean);
      const editing = Object.keys(body).length > 0;
      const r = await request(editing ? 'PUT' : 'GET', '/api/mesh/acl', editing ? body : null);
      if (r.status !== 200) { printError(r); process.exit(1); }
      const a = r.body.acl;
      if (flags.json) { printResult(r.body, flags); return; }
      ok(`${editing ? 'acl updated' : 'acl'} (${r.body.file}${r.body.exists === false ? ' — no file yet, defaults' : ''}): mode ${a.mode} · shareBlocklist ${a.shareBlocklist}`);
      for (const k of LISTS) if ((a[k] || []).length) process.stdout.write(`  ${k}: ${a[k].join(', ')}\n`);
      if (!editing) info('edit: ./bin/api mesh acl mode=allowlist shareBlocklist=true blockIps=1.2.3.4,5.6.7.8  (merge-write; lists comma-split)');
      return;
    }

    // ── §MESH-02e/g — blocklist: this server's shared list, or PREVIEW a peer's
    // (read-only — D2: a peer's blocklist is never auto-imported; merging is an
    // explicit click in the game's 🛡 Lists pane) ──
    if (sub === 'blocklist') {
      const peer = pos[2];
      let r;
      if (peer) {
        const u = (/^https?:\/\//.test(peer) ? peer : `http://${peer}`).replace(/\/+$/, '');
        try { r = await doHTTP('GET', `${u}/api/mesh/blocklist`, null); }
        catch (e) { die(`peer unreachable: ${e.code || e.message}`); }
      } else {
        r = await request('GET', '/api/mesh/blocklist');
      }
      if (r.status === 403) die(`${peer || 'this server'} does not share its blocklist (shareBlocklist opt-in is off — D3)`);
      if (r.status !== 200) { printError(r); process.exit(1); }
      if (flags.json) { printResult(r.body, flags); return; }
      const b = r.body;
      const n = ['blockServerIds', 'blockIps', 'blockWorldHashes'].reduce((s, k) => s + (b[k] || []).length, 0);
      ok(`${peer ? `peer ${peer}` : `server ${String(b.serverId).slice(0, 8)}`} shares ${n} blocklist entrie(s)  ·  ${b.engineVer}`);
      for (const k of ['blockServerIds', 'blockIps', 'blockWorldHashes'])
        if ((b[k] || []).length) process.stdout.write(`  ${k}: ${b[k].join(', ')}\n`);
      if (peer) info('preview only — merge into YOUR client blacklist via the game map tab → 🛡 Lists (explicit click, D2)');
      return;
    }

    // ── §MESH-02i/g — connect: dial a peer or add a tracker at runtime ──
    if (sub === 'connect') {
      const target = pos[2];
      if (!target) die('Usage: ./bin/api mesh connect <host:port>  (gossip peer)  |  mesh connect http(s)://tracker  (announce target)');
      const body = /^https?:\/\//.test(target) ? { tracker: target.replace(/\/+$/, '') } : { addr: target };
      const r = await request('POST', '/api/mesh/connect', body);
      if (r.status !== 200) { printError(r); process.exit(1); }
      if (flags.json) { printResult(r.body, flags); return; }
      const b = r.body;
      if (b.addr) ok(`peer ${b.addr}: ${b.peer.live ? `${C.green}●${C.reset} live · ${b.peer.serverId}` : `${C.red}○${C.reset} added, not answering yet${b.peer.lastErr ? ` (${b.peer.lastErr})` : ''}`}`);
      if (b.tracker) ok(`tracker ${b.tracker} added  ·  now announcing to: ${(b.trackerUrls || []).join(', ')}`);
      info('connect-added peers persist via the peers cache — connect once, remembered');
      return;
    }

    const r = await request('GET', '/api/mesh/status');
    if (r.status !== 200) { printError(r); process.exit(1); }
    const s = r.body;
    const ago = (ms) => ms == null ? 'never' : ms < 1500 ? 'now' : ms < 90_000 ? `${Math.round(ms / 1000)} s ago` : `${Math.round(ms / 60_000)} min ago`;

    if (sub === 'status') {
      if (flags.json) { printResult(s, flags); return; }
      ok(`${s.trackerMode ? 'tracker' : 'server'} ${s.serverId} @ ${s.addr}${s.name ? `  ·  "${s.name}"` : ''}`);
      ok(`world: ${s.worldTag ? `${s.worldTag} · ` : ''}${s.engineVer} · wh:${s.worldHash} · proto ${s.proto}`);
      ok(`acl: ${s.acl.mode} (${s.acl.file})  ·  rate: ${s.rate.limit} req/s, burst ${s.rate.burst}`);
      const live = (s.peers || []).filter(p => p.live).length;
      ok(`players: ${s.localPlayers} local · ${(s.remotePlayers || []).length} remote  ·  peers: ${live}/${(s.peers || []).length} live  ·  trackers: ${(s.trackerUrls || []).length}`);
      for (const g of s.trackerGroups || [])
        info(`tracker group: ${g.worldTag ? `${g.worldTag} · ` : ''}${g.engineVer} · ${g.worldHash} — ${g.servers} server(s), ${g.players} player(s)`);
      for (const w of (s.reachability && s.reachability.warnings) || [])
        stderr(`${C.yellow}⚠${C.reset} ${w}\n`);
      info('full JSON: ./bin/api mesh status --json  ·  ./bin/api mesh peers  ·  ./bin/api mesh tracker [url]');
      return;
    }

    if (sub === 'peers') {
      const peers = s.peers || [], remote = s.remotePlayers || [];
      if (flags.json) { printResult({ ok: true, count: peers.length, peers, remotePlayers: remote }, flags); return; }
      if (!peers.length) {
        ok('no gossip peers (add via peers.txt, BOOTSTRAP_URLS, or tracker discovery)');
        return;
      }
      ok(`${peers.length} gossip peer(s):`);
      for (const p of peers) {
        const dot = p.live ? `${C.green}●${C.reset}` : `${C.red}○${C.reset}`;
        process.stdout.write(`  ${dot} ${p.addr}  ·  ${p.serverId || '(id unknown)'}  ·  ${ago(p.lastSeenMs)}${p.lastErr ? `  ·  ${C.yellow}${p.lastErr}${C.reset}` : ''}\n`);
      }
      if (remote.length) {
        ok(`${remote.length} remote player(s):`);
        for (const p of remote) process.stdout.write(`  👤 ${p.name} @ (${p.r},${p.c})  ·  server ${p.server}\n`);
      }
      return;
    }

    // tracker — server browser: ask tracker(s) for their live server table
    const urls = pos[2] ? [pos[2]]
      : (s.trackerUrls || []).length ? s.trackerUrls
      : s.trackerMode ? [BASE] : [];   // a tracker with no upstream browses itself
    if (!urls.length)
      die('no tracker configured — pass one: ./bin/api mesh tracker <url>\n  (or set TRACKER_URL / a `tracker` line in peers.txt / BOOTSTRAP_URLS)');
    const seen = new Map(), errs = [];
    for (const u0 of urls) {
      const u = (/^https?:\/\//.test(u0) ? u0 : `http://${u0}`).replace(/\/+$/, '');
      try {
        const rr = await doHTTP('GET', `${u}/api/tracker/peers`, null);
        if (rr.status !== 200 || !rr.body || rr.body.ok === false) { errs.push(`${u0}: HTTP ${rr.status}`); continue; }
        for (const srv of rr.body.servers || []) if (!seen.has(srv.serverId)) seen.set(srv.serverId, srv);
      } catch (e) { errs.push(`${u0}: ${e.code || e.message}`); }
    }
    const servers = [...seen.values()];
    if (flags.json) { printResult({ ok: errs.length < urls.length, trackers: urls, errors: errs, count: servers.length, servers }, flags); return; }
    for (const e of errs) stderr(`${C.yellow}⚠${C.reset} tracker ${e}\n`);
    if (errs.length === urls.length) die('no tracker reachable');
    if (!servers.length) { ok(`tracker(s) answered, but no live servers announced  (${urls.join(', ')})`); return; }
    ok(`${servers.length} server(s) announced across ${urls.length} tracker(s):`);
    for (const srv of servers) {
      const diff = s.worldHash && srv.worldHash && srv.worldHash !== s.worldHash ? `  ${C.yellow}≠ different world${C.reset}` : '';
      process.stdout.write(`  🖥 ${srv.name || srv.addr}  ·  🌍 ${srv.worldTag || srv.worldHash}  ·  ${srv.engineVer}  ·  ${srv.addr}  ·  👥 ${srv.playerCount | 0}${diff}\n`);
    }
  },

  // §AUDIT-03b — named wrapper for POST /api/batch/npc (bulk quest.npc re-anchor,
  // one parse + one save for the whole batch instead of N full-file rewrites).
  // Usage:  ./bin/api batch-npc updates.json     (or pipe the JSON on stdin)
  //   file/stdin shape: [{id, npc}, ...]  or  {updates:[{id, npc}, ...]}
  async 'batch-npc'(pos, flags) {
    await requireServer();
    const [, file] = pos;
    const piped = file ? null : await readStdin();
    let raw = piped;
    if (file) {
      try { raw = JSON.parse(require('fs').readFileSync(file, 'utf8')); }
      catch (e) { die(`Cannot read updates file "${file}": ${e.message}`); }
    }
    if (!raw) die('Usage: ./bin/api batch-npc <updates.json>   (or pipe JSON on stdin)');
    const updates = Array.isArray(raw) ? raw : (raw.updates || []);
    if (!updates.length) die('No updates found — expected [{id, npc}, ...] or {updates:[...]}');
    info(`batch-npc: ${updates.length} quest npc re-anchors in one save`);
    const r = await request('POST', '/api/batch/npc', { updates });
    if (r.status >= 400) { printError(r); process.exit(1); }
    printResult(r.body, flags);
  },

  // §ARCH-02 Phase 5 — composite advise: quest fields + chain check in one call
  async advise(pos, flags) {
    await requireServer();
    const [, id] = pos;
    if (!id) die('Usage: ./bin/api advise <quest-id>');
    const [rQuest, rChain] = await Promise.all([
      request('GET', `/api/quest/${encodeURIComponent(id)}`),
      request('GET', `/api/quest/${encodeURIComponent(id)}/chain`),
    ]);
    if (rQuest.status !== 200) { printError(rQuest); process.exit(1); }
    const quest = rQuest.body;
    const chain = rChain.status === 200 ? rChain.body : { error: 'chain fetch failed' };
    // World-logic advisory: check node/NPC refs in quest fields
    const errors = [], warnings = [];
    if (quest.activateNode && !quest._activateNodeValid)
      warnings.push(`activateNode "${quest.activateNode}" — verify it exists in NODE_MAP`);
    if (quest.waypointNode && !quest._waypointNodeValid)
      warnings.push(`waypointNode "${quest.waypointNode}" — verify it exists in NODE_MAP`);
    if (quest.type === 'skill_check' && quest.checkStat && !quest.checkAbility)
      warnings.push(`uses legacy checkStat field — update to checkAbility`);
    const hasBits = Array.isArray(quest.bits) && quest.bits.length > 0;
    const result = {
      quest: { id, type: quest.type, title: quest.title, activateNode: quest.activateNode, npc: quest.npc, bits: quest.bits },
      chain,
      advisory: { errors, warnings, has_bits: hasBits, ok: errors.length === 0 },
    };
    printResult(result, flags);
  },

  async export(pos, flags) {
    await requireServer();
    const [, collection] = pos;
    if (!collection) die('Usage: ./bin/api export <node_map|quest_db|monster_pool|world_db>  [--format json|js|module]');
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
    if (!type || !id) die('Usage: ./bin/api nonce <type> <id>');
    const nonce = await getNonce(type, id);
    process.stdout.write(nonce + '\n');
  },

  async ai(pos, flags) {
    const prompt = pos.slice(1).join(' ');
    if (!prompt) die('Usage: ./bin/api ai "<question>"');
    const reply = await askClaude(prompt);
    process.stdout.write(`${C.cyan}${reply}${C.reset}\n`);
  },

  async speak(pos, flags) {
    await requireServer();
    const [, id, ...rest] = pos;
    if (!id) die('Usage: ./bin/api speak <npc-id> "<prompt>"  [--state neutral|friendly|dearFriend] [--model <model>]');
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
      die('Usage: ./bin/api import <file.json>  (or pipe JSON)');
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

  // ── clean: prune orphaned NODE_COORDS + explosion J-nodes ──────────────────
  // Usage: ./bin/api clean [--execute]
  //   Dry-run: reports orphan coord count + explosion node count.
  //   --execute: removes all NODE_COORDS entries with no NODE_MAP match
  //              and any J-nodes whose label contains ↔ (explosion artifacts).
  //   Run this after nuke-junctions to free the 8K+ phantom grid cells that
  //   would otherwise block rip-and-connect placement.
  async clean(pos, flags) {
    await requireServer();
    const execute = !!flags.execute;
    const r = await request('POST', `/api/audit/data/clean${execute ? '' : '?dryRun=true'}`, {});
    if (r.status !== 200) { printError(r); process.exit(1); }
    const d = r.body;
    if (!execute) {
      ok(`[DRY RUN] orphan coords: ${d.orphanCoords}  explosion nodes: ${d.explosionNodes}  dangling exits: ${d.danglingExits}`);
      if (d.orphanCoords > 0 || d.explosionNodes > 0) ok(`Add --execute to remove`);
      else ok(`Nothing to clean ✓`);
    } else {
      ok(`Removed ${d.orphanCoordsRemoved} orphan coords, ${d.explosionNodesRemoved} explosion nodes, ${d.danglingExitsNulled} dangling exits nulled`);
    }
  },

  // ── worldmap: terminal ASCII world map of major cities ──────────────────────
  // Usage: ./bin/api worldmap [--latlon]
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
        require('path').join(__dirname, '..', 'tools', 'worldmap.js'), ...args,
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
  // Usage: ./bin/api move <CODE> <r> <c> [--swap]
  async move(pos, flags) {
    const [, code, rStr, cStr] = pos;
    if (!code||rStr==null||cStr==null) die('Usage: ./bin/api move <CODE> <r> <c> [--swap]');
    const r=+rStr, c=+cStr;
    if (isNaN(r)||isNaN(c)) die('r and c must be numbers');
    const resp = await request('POST', '/api/graph/move', { code, r, c, swap: !!flags.swap });
    if (resp.status >= 400) { printError(resp); process.exit(1); }
    const d = resp.body;
    ok(`${code} moved from (${d.from?.r},${d.from?.c}) → (${r},${c})`);
    if (d.swapped) ok(`swapped with ${d.swapped.code} → (${d.swapped.movedTo?.r},${d.swapped.movedTo?.c})`);
  },

  // ── junction: spawn a new junction node between two points ───────────────────
  // Usage: ./bin/api junction <from> <dir> [--label "name"] [--terrain city] [--execute]
  //   from     — source node code
  //   dir      — N|S|E|W direction for the new junction
  //   --label  — custom label (default: auto-generated signpost name)
  //   --terrain — terrain type (default: inherits from source)
  //   --execute — actually create (default is dry-run)
  async junction(pos, flags) {
    const [, from, dir] = pos;
    if (!from||!dir) die('Usage: ./bin/api junction <from> <dir> [--label "name"] [--terrain type] [--execute]');
    const body = { from, dir, dryRun: !flags.execute, ...(flags.label?{label:flags.label}:{}), ...(flags.terrain?{terrain:flags.terrain}:{}) };
    const resp = await request('POST', '/api/graph/spawn-junction', body);
    if (resp.status >= 400) { printError(resp); process.exit(1); }
    const d = resp.body;
    if (d.dryRun) {
      ok(`[DRY RUN] Junction ${d.plan.code}  r=${d.plan.r}  c=${d.plan.c}  terrain=${d.plan.terrain}`);
      ok(`Label:  ${d.plan.label}`);
      ok(`Text:   ${d.plan.text}`);
      if (d.plan.needsFillGap) ok(`⚠ Gap ${d.plan.gap} > 4 — empty land is walkable (§WALK-1.5); verify via ./bin/api reachability`);
      ok(`Add --execute to create the junction`);
    } else {
      ok(`Junction ${d.code} created at (${d.r},${d.c})`);
      ok(`Label: ${d.plan.label}`);
      if (d.plan.needsFillGap) ok(`⚠ Gap ${d.plan.gap} > 4 — empty land is walkable (§WALK-1.5); verify via ./bin/api reachability`);
    }
  },

  // ── geo-seed: apply geographic lat/lon seeds to major city coordinates ────────
  // Usage: ./bin/api geo-seed [--execute] [--grid-min 8] [--grid-max 500]
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
      info(`Next: node src/tools/layout-solve.js --apply  to propagate remaining nodes from geo anchors`);
    }
  },

  // ── rip-and-connect: REMOVED (§WALK-3 Inc 2) ────────────────────────────────
  // The server endpoint now returns 410. Reachability is a terrain-field land
  // flood (§WALK-1.5), so there are no node-adjacency strays to relocate.
  // Verify connectivity with `./bin/api reachability` instead.

  // ── broken: §CELL-06 — show nodes in grid with no cell neighbors (isolated) ───
  // Usage: ./bin/api broken
  //   In cell-first world, "broken" = a node is in a grid cell but touches 0
  //   adjacent occupied cells.  The old gap/diagonal check is gone because
  //   N/S/E/W direction fields were stripped in §CELL-01.
  async broken(pos, flags) {
    await requireServer();
    const resp = await request('GET', '/api/grid/heatmap');
    if (resp.status !== 200) { printError(resp); process.exit(1); }
    const { cells = [], count } = resp.body;
    const isolated = cells.filter(c => c.heat === 0);
    if (isolated.length === 0) {
      ok(`No isolated cells ✓  (${count} cells in grid, all have ≥1 neighbor)`);
      return;
    }
    ok(`${isolated.length} isolated cell(s) — no cell neighbors:`);
    isolated.slice(0, 20).forEach(c => ok(`  ${c.code.padEnd(8)} r=${c.r} c=${c.c}  terrain=${c.terrain || '?'}`));
    if (isolated.length > 20) ok(`  ...and ${isolated.length - 20} more`);
    ok(`Fix: re-anchor the node's lat/lon or carve a sea-lane (§WALK-1.5); confirm with ./bin/api reachability`);
  },

  // ── reachability: show how many nodes are reachable from the hub ─────────────
  // Usage: ./bin/api reachability [--hub LHR]
  //   Uses cell-grid BFS (§CELL-06): adjacency is determined by coordinate
  //   proximity, not N/S/E/W pointer fields.
  async reachability(pos, flags) {
    await requireServer();
    const hub  = flags.hub || 'LHR';
    const resp = await request('GET', `/api/graph/reachability?hub=${hub}`);
    if (resp.status !== 200) { printError(resp); process.exit(1); }
    const d = resp.body; const c = d.counts;
    const pct = Math.round(100 * c.reachable / c.total);
    ok(`Hub: ${d.hub}  |  Reachable: ${c.reachable}/${c.total} (${pct}%)  |  Unreachable: ${c.unreachable}  |  Clusters: ${c.clusters}`);
    if (c.unreachable > 0) {
      ok(`${c.unreachable} unreachable node(s) — re-anchor their lat/lon or carve a sea-lane (§WALK-1.5); see the unreachable list in GET /api/graph/reachability`);
    } else {
      ok(`All nodes reachable ✓`);
    }
    const deg = d.reachableByDegree || {};
    for (const [k, v] of Object.entries(deg)) {
      ok(`  ${k}: ${v.length} nodes`);
    }
  },

  // ── verify: comprehensive cell-grid health check ──────────────────────────────
  // Usage: ./bin/api verify [--hub LHR]
  //
  // Reports four categories:
  //   1. Nodes with no coordinates (not in any cell)
  //   2. Coordinate collisions (two nodes in the same cell)
  //   3. Reachability from hub (cell-BFS — can you walk there?)
  //   4. Grid-isolated nodes (in a cell but heat=0, no cell neighbors)
  //
  // PASS = all nodes coordinated + 0 collisions + 100% reachable + 0 isolated
  async verify(pos, flags) {
    await requireServer();
    const hub = flags.hub || 'LHR';
    process.stdout.write(`${C.bold}══ Grid Verify ══${C.reset}\n`);

    const [coordResp, reachResp] = await Promise.all([
      request('GET', '/api/coords'),
      request('GET', `/api/grid/reachability?hub=${hub}`),
    ]);
    if (coordResp.status !== 200) { printError(coordResp); process.exit(1); }
    if (reachResp.status !== 200) { printError(reachResp); process.exit(1); }

    const coords   = coordResp.body.coords || {};
    const coordSet = new Set(Object.keys(coords));
    const nCoords  = coordResp.body.count;
    const rData    = reachResp.body;
    const total    = rData.total;

    // nodeMapSet: only codes actually in NODE_MAP (from reachability total)
    const nodeMapSet = new Set([
      ...(rData.reachable.codes  || []),
      ...(rData.unreachable.codes || []),
    ]);

    // Coordinate collisions: two NODE_MAP codes sharing the same (r,c)
    // (orphaned coords — in NODE_COORDS but not NODE_MAP — are excluded)
    const cellMap = {};
    for (const [code, p] of Object.entries(coords)) {
      if (!nodeMapSet.has(code)) continue;   // skip orphaned coords
      const key = `${p.r},${p.c}`;
      if (!cellMap[key]) cellMap[key] = [];
      cellMap[key].push(code);
    }
    const collisions = Object.entries(cellMap).filter(([, codes]) => codes.length > 1);

    // Nodes without coords (appear in reachability unreachable list but have no coord entry)
    const unreachCodes   = rData.unreachable.codes || [];
    const noCoordCodes   = unreachCodes.filter(c => !coordSet.has(c));
    const gridUnreachable = unreachCodes.filter(c => coordSet.has(c));

    // inGrid = nodes in nodeMap that have coordinates (reachable + grid-unreachable)
    // (nodeCoords may have orphan entries for deleted nodes, so use reachability total)
    const inGrid = total - noCoordCodes.length;

    ok(`── Coordinate Coverage ─────────────────────────────────`);
    ok(`  Total nodes:      ${total}`);
    ok(`  In grid (coords): ${inGrid}  (${total > 0 ? Math.round(100 * inGrid / total) : 100}%)`);
    if (noCoordCodes.length) {
      ok(`  ${C.red}Missing coords:    ${noCoordCodes.length}${C.reset}  (not in any cell)`);
      noCoordCodes.slice(0, 20).forEach(c => ok(`    ${c}`));
      if (noCoordCodes.length > 20) ok(`    ...and ${noCoordCodes.length - 20} more`);
    } else {
      ok(`  Missing coords:    0 ✓`);
    }

    ok(`── Coordinate Collisions ───────────────────────────────`);
    if (collisions.length) {
      ok(`  ${C.red}${collisions.length} collision(s) — two nodes in same cell:${C.reset}`);
      collisions.slice(0, 10).forEach(([key, codes]) => ok(`    (${key}): ${codes.join(', ')}`));
    } else {
      ok(`  0 collisions ✓`);
    }

    ok(`── Reachability from ${hub} ─────────────────────────────`);
    ok(`  Reachable: ${rData.reachable.count}/${total} (${rData.pct}%)`);
    if (gridUnreachable.length) {
      ok(`  ${C.yellow}Grid-placed but unreachable: ${gridUnreachable.length}${C.reset}`);
      gridUnreachable.slice(0, 20).forEach(c => ok(`    ${c}`));
      if (gridUnreachable.length > 20) ok(`    ...and ${gridUnreachable.length - 20} more`);
    } else if (inGrid > 0) {
      ok(`  All coordinated nodes reachable ✓`);
    }

    // Isolated: in grid but no cell neighbors
    const hmResp = await request('GET', '/api/grid/heatmap');
    if (hmResp.status !== 200) { printError(hmResp); process.exit(1); }
    const isolated = (hmResp.body.cells || []).filter(c => c.heat === 0);

    ok(`── Grid-Isolated (heat=0) ──────────────────────────────`);
    if (isolated.length) {
      ok(`  ${C.yellow}${isolated.length} node(s) in grid with no cell neighbors:${C.reset}`);
      isolated.slice(0, 10).forEach(c => ok(`    ${c.code}  r=${c.r} c=${c.c}`));
      if (isolated.length > 10) ok(`    ...and ${isolated.length - 10} more`);
    } else {
      ok(`  0 isolated ✓`);
    }

    const issues = noCoordCodes.length + collisions.length + isolated.length + gridUnreachable.length;
    ok(`── Summary ─────────────────────────────────────────────`);
    if (issues === 0) {
      ok(`  ${C.green}PASS${C.reset} — all ${total} nodes are in the grid and reachable ✓`);
    } else {
      ok(`  ${C.red}FAIL${C.reset} — ${issues} issue(s) found`);
      if (collisions.length) ok(`  Collisions: re-anchor a colliding node's lat/lon, or hold both as a 1° locale list (§WALK-1.5)`);
      ok(`  General:    ./bin/api clean --execute → ./bin/api geo-seed --execute → node src/tools/layout-solve.js --apply → ./bin/api reachability`);
    }
  },

  // ── junction-audit: breakdown of junction vs named nodes + P_NUKE dry-run preview ─
  // Usage: ./bin/api junction-audit
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
  // Usage: ./bin/api find-open-location <city> [--radius 8]
  //
  // Returns open attachment points in the city's mesh:
  //   directAttach   — degree ≤ 2, connect straight to this node
  //   junctionNeeded — degree = 3, spawn junction here first, then connect
  //   deadEnds       — degree = 1 nodes that should be expanded
  async 'find-open-location'(pos, flags) {
    const [, code] = pos;
    if (!code) die('Usage: ./bin/api find-open-location <city> [--radius N]');
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
  // Usage: ./bin/api smart-connect <from> <to> [--radius 6] [--execute]
  //
  // "A to B" is really "A-mesh to B-mesh".
  // Walks each city's network to find the best insertion points:
  //   - Nodes with deg ≤ 2: connect directly
  //   - Nodes with deg = 3: spawn junction first (preserve the 4th slot)
  //   - Nodes with deg = 4: skip (full), walk deeper
  // Reports the plan; use --execute to apply the first step.
  async 'smart-connect'(pos, flags) {
    const [, fromCode, toCode] = pos;
    if (!fromCode || !toCode) die('Usage: ./bin/api smart-connect <from> <to> [--radius 6] [--execute]');
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
      // Commands look like: "./bin/api connect TLL E BTR" or "node layout-solve.js ..."
      const apiShIdx = parts.findIndex(p => p === './bin/api' || p === 'api.sh');
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
  // Usage: ./bin/api connect <A> <dir> <B>
  //   Sets A[dir] = B and B[OPP[dir]] = A (bidirectional wire).
  //   Checks coordinate alignment first; warns if bendy or gap > 4.
  async connect(pos, flags) {
    const [, aCode, dir, bCode] = pos;
    if (!aCode||!dir||!bCode) die('Usage: ./bin/api connect <A> <N|E|S|W> <B>');
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
    if (degA >= 4) { ok(`⚠ ${aCode} already has 4 connections (full). Use ./bin/api smart-connect ${aCode} ${bCode} to find a mesh insertion point.`); if (!flags.force) return; }
    if (degB >= 4) { ok(`⚠ ${bCode} already has 4 connections (full). Use ./bin/api smart-connect ${aCode} ${bCode} to find a mesh insertion point.`); if (!flags.force) return; }
    if (degA === 3) ok(`⚠ ${aCode} has 3 connections — this will fill its 4th (last) slot. Consider: ./bin/api junction ${aCode} ${D} --execute  (spawns junction first, preserves slot)`);
    if (degB === 3) ok(`⚠ ${bCode} has 3 connections — this will fill its 4th (last) slot. Consider: ./bin/api junction ${bCode} ${OPP[D]} --execute  (spawns junction first, preserves slot)`);

    // Coordinate alignment check
    const ca = coords[aCode], cb = coords[bCode];
    if (ca && cb) {
      const axisOff = (D==='N'||D==='S') ? Math.abs(cb.c-ca.c) : Math.abs(cb.r-ca.r);
      const axisDist= (D==='N'||D==='S') ? Math.abs(cb.r-ca.r) : Math.abs(cb.c-ca.c);
      if (axisOff > 0) ok(`⚠ BENDY: offset=${axisOff} — consider an elbow junction first`);
      if (axisDist > 4) ok(`⚠ GAP: distance=${axisDist} > 4 — empty land between is walkable (§WALK-1.5); verify via ./bin/api reachability`);
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

  // ── fill-gap: REMOVED (§WALK-3 Inc 2) ───────────────────────────────────────
  // The server endpoint now returns 410. Junction stubs were abolished (§WALK-1)
  // and empty land cells are freely walkable (§WALK-1.5) — there is no gap to fill.
  // Verify connectivity with `./bin/api reachability` instead.

  // ── fix-diagonal: auto-fix one diagonal (bendy) edge via move or elbow ───────
  // Usage: ./bin/api fix-diagonal <CODE> <dir> [--dry-run]
  //   Inspects the edge CODE[dir] and proposes the least-invasive fix:
  //   1. Move target if it has only 1-2 connections (cheap)
  //   2. Otherwise spawn elbow junction at axis intersection
  async 'fix-diagonal'(pos, flags) {
    const [, code, dir] = pos;
    if (!code||!dir) die('Usage: ./bin/api fix-diagonal <CODE> <N|E|S|W> [--dry-run]');
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
      ok(`No auto-fix available — inspect manually: ./bin/api worldmap --city ${code}`);
    }
  },

  // ── fix-all-broken: batch-diagnose all broken edges, apply safe auto-fixes ───
  // Usage: ./bin/api fix-all-broken [--dry-run] [--limit N]
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
      ok(`Re-check: ./bin/api fix-all-broken`);
    }
  },

  // ── nuke-junctions: P_NUKE — bulk-delete all J#### junction nodes ────────────
  // Usage: ./bin/api nuke-junctions [--execute]
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

  // ── cluster-bridge: connect remaining isolated clusters without a full reweave ──
  // Usage: ./bin/api cluster-bridge [--execute]
  //   Dry-run: reports isolated clusters and the nearest bridge target for each.
  //   --execute: bridges each cluster to the main network via smart-connect.
  async 'cluster-bridge'(pos, flags) {
    await requireServer();
    const execute = !!flags.execute;
    if (!execute) ok('[DRY RUN] add --execute to bridge all clusters');
    ok('streaming from server — output below:\n');
    await streamPost('/api/graph/cluster-bridge', { execute });
  },

  // ── promote-junction: upgrade a junction node to real content, wiring preserved ─
  // Usage: ./bin/api promote-junction <CODE> --label "Name" --text "desc" [--terrain key]
  //        [--npc key] [--act N]
  async 'promote-junction'(pos, flags) {
    await requireServer();
    const code = pos[0]; if (!code) die('Usage: ./bin/api promote-junction <CODE> --label "..." --text "..."');
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
  // Usage: ./bin/api fix-bidirectional [--execute]
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
    ok(`Re-check: ./bin/api audit --map`);
  },

  // ── migrate: §CELL-14 data cleanup ─────────────────────────────────────────
  // Usage:
  //   ./bin/api migrate strip-exit-fields                # dry-run (default)
  //   ./bin/api migrate strip-exit-fields --execute      # actually rewrite NODE_MAP
  //   ./bin/api migrate strip-exit-fields --fields N,S,E,W   # narrow the field set
  //
  // Strips dead direction pointers (N/S/E/W/SW/portal/spire) from every NODE_MAP
  // entry in play.html. After §CELL-01–§CELL-13 these fields are no longer
  // read by any runtime code path — adjacency comes from CELL_GRID. The cleanup
  // is documented in data-code-migration-into-cells.md §6.
  async migrate(pos, flags) {
    await requireServer();
    const sub = pos[1];
    if (sub !== 'strip-exit-fields')
      die('Usage: ./bin/api migrate strip-exit-fields [--execute] [--fields N,S,E,W,portal,spire]');
    const dryRun = !flags.execute;
    const body = { dryRun };
    if (flags.fields) body.fields = String(flags.fields).split(',').map(s => s.trim()).filter(Boolean);
    const r = await request('POST', '/api/migrate/strip-exit-fields', body);
    if (r.status !== 200) { printError(r); process.exit(1); }
    const { nodesTouched, totalRemoved, perField, sampleNode, fields, savePath } = r.body;
    if (dryRun) ok(`[DRY RUN] ${totalRemoved} field(s) across ${nodesTouched} node(s)`);
    else        ok(`stripped ${totalRemoved} field(s) across ${nodesTouched} node(s)`);
    if (perField) {
      const ent = Object.entries(perField).filter(([,n]) => n > 0);
      for (const [f, n] of ent) ok(`  ${f}: ${n}`);
    }
    if (sampleNode) {
      ok(`sample (${sampleNode.code}):`);
      ok(`  before: ${sampleNode.before.replace(/\n/g,' ')}…`);
      ok(`  after : ${sampleNode.after.replace(/\n/g,' ')}…`);
    }
    if (!dryRun && savePath) ok(`saved → ${savePath}`);
    if (dryRun)               ok(`add --execute to write`);
    void fields;
  },

  // ── highway: build a full junction chain between two cities ─────────────────
  // Usage: ./bin/api highway <from> <to> [--step 4] [--dry-run] [--terrain junction]
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
  // ⚠️ DEPRECATED (§DX-01d) — planning only; --execute is refused. See the block
  // below the arg parse for why, and for what to do instead.
  async highway(pos, flags) {
    const [, fromCode, toCode] = pos;
    if (!fromCode || !toCode) die('Usage: ./bin/api highway <from> <to> [--step N] [--dry-run] [--terrain type]');
    const step     = flags.step    ? +flags.step : 4;
    const terrain  = flags.terrain || 'junction';
    const dryRun   = flags['dry-run'] !== undefined ? true : !flags.execute;
    const OPP = { N:'S', S:'N', E:'W', W:'E' };

    // ── §DX-01d: --execute is DEPRECATED and refused, before any work ─────────
    // What it actually did: drop sparse junction:true waypoint nodes every --step
    // cells and wire them N/S/E/W. It laid ZERO road cells, so it never produced a
    // road — and each waypoint referenced a `junction` terrain absent from
    // WORLD_DB, which is precisely how J14/J15 became the check:invariants I1/I2
    // reds that sat red until §DX-01a removed the nodes and build-roads.js --apply
    // laid the real Tungas–Station 7 road.
    //
    // It is also unnecessary: a node on land contiguous with the main landmass is
    // already walk-routable (./bin/api reachability is the authority — the mover
    // walks cell by cell; the legacy edge graph is abandoned). Waypoints buy
    // nothing but invariant violations.
    //
    // Refused up front, before the coordinate fetch, so it costs nothing and needs
    // no server. Planning still works — re-run without --execute.
    if (!dryRun) die([
      'highway --execute is DEPRECATED (§DX-01d) — refusing to drop junction nodes.',
      '',
      'It laid ZERO road cells and created junction:true nodes on a terrain absent',
      'from WORLD_DB — the direct cause of the J14/J15 check:invariants I1/I2 reds.',
      '',
      'What to do instead:',
      '  • Reachability — nothing to do. A contiguous-land node is already walk-routable.',
      '      ./bin/api reachability     # the authority (BFS from LHR); target 100%',
      '  • An encounter-free ROAD between two nodes — lay real road cells:',
      '      edit ROAD_RUNS in play.html, then  node src/scripts/build-roads.js --apply',
      '      verify with  npm run check:walk  (check:roads R1–R3)',
      '  • Just the route plan — re-run without --execute (the default).',
    ].join('\n'));

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

    // ── Execute (unreachable since §DX-01d — retained for the record) ─────────
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
    ok(`  ./bin/api worldmap --route ${fromCode} --to ${toCode}`);
    ok(`  ./bin/api worldmap --city ${fromCode}`);
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

  // ── §CELL-08: cell — inspect a single grid cell ─────────────────────────────
  // Usage: ./bin/api cell <r> <c> [neighbors]
  async cell(pos, flags) {
    await requireServer();
    const [, rStr, cStr, sub] = pos;
    if (!rStr || !cStr) die('Usage: ./bin/api cell <r> <c> [neighbors]');
    const r = +rStr, c = +cStr;
    if (isNaN(r) || isNaN(c)) die('r and c must be integers');
    const endpoint = sub === 'neighbors'
      ? `/api/cell/${r}/${c}/neighbors`
      : `/api/cell/${r}/${c}`;
    const resp = await request('GET', endpoint);
    if (resp.status !== 200) { printError(resp); process.exit(1); }
    printResult(resp.body, flags);
  },

  // ── §CELL-08: grid — query the cell grid ────────────────────────────────────
  // Usage: ./bin/api grid <region|heatmap|reachability> [--r1=N --c1=N --r2=N --c2=N] [--hub=LHR]
  async grid(pos, flags) {
    await requireServer();
    const [, sub] = pos;
    if (!sub) die('Usage: ./bin/api grid <region|heatmap|reachability> [options]');
    let endpoint;
    if (sub === 'region') {
      if (flags.r1 == null || flags.c1 == null || flags.r2 == null || flags.c2 == null)
        die('Usage: ./bin/api grid region --r1=N --c1=N --r2=N --c2=N');
      const qs = new URLSearchParams({ r1: flags.r1, c1: flags.c1, r2: flags.r2, c2: flags.c2 });
      endpoint = `/api/grid/region?${qs}`;
    } else if (sub === 'heatmap') {
      endpoint = '/api/grid/heatmap';
    } else if (sub === 'reachability') {
      const qs = flags.hub ? `?hub=${encodeURIComponent(flags.hub)}` : '';
      endpoint = `/api/grid/reachability${qs}`;
    } else {
      die(`Unknown grid sub-command "${sub}". Available: region, heatmap, reachability`);
    }
    const resp = await request('GET', endpoint);
    if (resp.status !== 200) { printError(resp); process.exit(1); }
    if (sub === 'reachability') {
      const d = resp.body;
      ok(`Hub: ${d.hub}  |  Reachable: ${d.reachable.count}/${d.total} (${d.pct}%)  |  Unreachable: ${d.unreachable.count}`);
      if (d.unreachable.count > 0 && !flags.raw)
        ok(`Unreachable (first 20): ${d.unreachable.codes.slice(0, 20).join(', ')}`);
      else if (d.unreachable.count === 0)
        ok('All cells reachable ✓');
    } else {
      printResult(resp.body, flags);
    }
  },

  help() { process.stdout.write(HELP + '\n'); },
};

// ── Help ───────────────────────────────────────────────────────────────────────
const HELP = `
${C.bold}./bin/api${C.reset}  —  Codex of Conquest World Builder CLI  ${C.dim}(delegates to api/wb.js → localhost:1367)${C.reset}

  ./bin/api <command> [args] [options]

  Every command talks to the WBAPI server running at localhost:1367.
  Start the server first:  ${C.dim}./wbapi-toggle.sh start${C.reset}

${C.bold}═══════════════════════════════════════════════════════════════════
  PREFERRED TOOL — USE api.sh, NOT curl
═══════════════════════════════════════════════════════════════════${C.reset}

  ${C.yellow}Always use ./bin/api for day-to-day work. Raw curl is a fallback only.${C.reset}

  api.sh handles automatically:
    • Nonces (one-time write tokens) — acquired and attached for you
    • Retry with exponential backoff on 5xx or connection errors
    • Pipe-safe JSON — errors land on stdout so | jq and | python3 work
    • Queued requests — serialised to avoid race conditions on writes
    • Auto-reload notification — the server watches play.html;
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
  §21 NETWORK WIRING  (smart-connect  highway  junction  connect)
  §22 NETWORK HEALTH & REPAIR  (verify  broken  reachability  junction-audit  fix-bidirectional  cluster-bridge)
  §23 CELL GRID QUERIES  (cell  grid region|heatmap|reachability)
  §24 COMMON RECIPES
  §25 SERVER LIFECYCLE

${C.bold}═══════════════════════════════════════════════════════════════════
  §1  THE COMMON CYCLE — search → inspect → edit
═══════════════════════════════════════════════════════════════════${C.reset}

  The workflow for every entity type follows the same three steps.
  Never guess an ID — search first, then fetch full details, then edit.

  ── quests ───────────────────────────────────────────────────────

  # 1. Find the quest by keyword
  ./bin/api list quest --q "wolsey"
  ./bin/api list quest --arc shk --q "inventory"
  ./bin/api list quest --node BK --type skill_check

  # 2. Fetch all fields for the exact quest
  ./bin/api get quest shk6_act1
  # → see desc, passText, failText, npc, activateNode, checkDC, etc.

  # 3. Patch the specific field(s) you need
  ./bin/api put quest shk6_act1 desc="Egil Thorvaldsen, a Birka wool factor..."
  ./bin/api put quest shk6_act1 npc=egil_thorvaldsen checkDC=14
  # Multi-field — pipe JSON:
  echo '{"desc":"...","passText":"...","failText":"..."}' | ./bin/api put quest shk6_act1

  ── nodes ────────────────────────────────────────────────────────

  # 1. Find the node
  ./bin/api list node --q "nuremberg"
  ./bin/api list node --terrain scholars_qtr
  ./bin/api list node --act 2 --q "birka"

  # 2. Get composite view — node + quests + NPCs + monsters
  ./bin/api location NUE
  ./bin/api get node NUE
  # → label, terrain, coords, N/E/S/W links, quest list, NPC list

  # 3. Edit
  ./bin/api put node NUE label="Nuremberg Scholar Quarter"
  ./bin/api put node NUE N=BMA S=KRN

  ── NPCs ─────────────────────────────────────────────────────────

  # 1. Find the NPC
  ./bin/api list npc --q "egil"
  ./bin/api list npc --node BK
  ./bin/api list npc --occupation "clerk"

  # 2. Fetch full details (quests linked, node, occupation)
  ./bin/api get npc egil_thorvaldsen

  # 3. Edit
  ./bin/api put npc egil_thorvaldsen occupation="wool factor and Hanseatic broker"
  # Link a quest to this NPC:
  ./bin/api put quest shk6_act1 npc=egil_thorvaldsen

  ── monsters ─────────────────────────────────────────────────────

  # 1. Find the monster
  ./bin/api list monster --terrain crypt
  ./bin/api list monster --q "shadow" --tier easy

  # 2. Inspect stat block
  ./bin/api get monster shadow

  # 3. Tune a field
  ./bin/api put monster shadow hp=22 ac=13
  ./bin/api put monster shadow tier=medium

  ── terrain ──────────────────────────────────────────────────────

  # 1. Find terrain key (needed when creating nodes)
  ./bin/api list terrain --q "scholar"
  ./bin/api list terrain --ids

  # 2. Inspect which monsters are in it
  ./bin/api get terrain scholars_qtr
  ./bin/api list monster --terrain scholars_qtr

  # 3. Update label or icon
  ./bin/api put terrain scholars_qtr label="Scholar's Quarter"

  ── create → verify → commit cycle ──────────────────────────────

  # Create an NPC
  ./bin/api post npc key=marta_vby name="Marta" node=VBY occupation="Flemish intake clerk"

  # Confirm it landed
  ./bin/api get npc marta_vby

  # Link a quest to it
  ./bin/api list quest --arc shk --q "visby"    # find the quest ID
  ./bin/api put quest shk6_act2 npc=marta_vby   # link it

  # Audit — confirm zero errors/warnings
  ./bin/api audit --raw | jq '{errors:.errors|length, warnings:.warnings|length}'

  ── bulk search with jq ──────────────────────────────────────────

  # All quests missing desc
  ./bin/api export quest_db --raw | jq '[to_entries[] | select(.value.desc=="" or .value.desc==null) | .key]'

  # All quests for a specific NPC
  ./bin/api list quest --npc egil_thorvaldsen

  # All nodes in act 2 with no quests
  ./bin/api list node --act 2 --has-quests false

  # NPC keys at a specific node
  ./bin/api list npc --node NUE --ids

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
  ${C.green}roads${C.reset} [pins]           Road net summary (§NAV-01h; --json for full runs)
  ${C.green}reweave${C.reset}                Regenerate ROAD_RUNS from pins (build-roads + check:roads)
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
    ANTHROPIC_API_KEY   Required for ./bin/api ai and ./bin/api speak

${C.bold}═══════════════════════════════════════════════════════════════════
  ping — server health
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api ping

  Returns: ok, loaded, file, nodes, quests, monsters, fish, lakeMagic.
  Exit 0 on success; exit 1 if server is unreachable.

  Examples:
    ./bin/api ping
    ./bin/api ping --server http://192.168.1.10:1367
    ./bin/api ping --raw

${C.bold}═══════════════════════════════════════════════════════════════════
  mode — get or set the server logging mode
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api mode               show current mode
  ./bin/api mode fast          minimal output (quiet)
  ./bin/api mode debug         verbose — request/response bodies logged
  ./bin/api mode trace         verbose + full algorithm trace (ultra-verbose)

  Mode is saved to build/milepoints/wbapi-config.json and survives restarts.
  Default is TRACE. Env vars WBAPI_VERBOSE / WBAPI_TRACE override on startup.

  Examples:
    ./bin/api mode
    ./bin/api mode fast
    ./bin/api mode trace

${C.bold}═══════════════════════════════════════════════════════════════════
  count — breakdown statistics
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api count [subtype]

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
    ./bin/api count
    ./bin/api count nodes
    ./bin/api count quests
    ./bin/api count monsters
    ./bin/api count npcs
    ./bin/api count terrains
    ./bin/api count coords
    ./bin/api count nodes --raw
    ./bin/api count quests --out /tmp/quest-stats.json

${C.bold}═══════════════════════════════════════════════════════════════════
  get — fetch one entity
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api get <type> <id>

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
    ./bin/api get node LHR
    ./bin/api get node BK
    ./bin/api get node TLL
    ./bin/api get node KRN
    ./bin/api get node FRO
    ./bin/api get node TRD
    ./bin/api get node SDQ
    ./bin/api get quest mq_1
    ./bin/api get quest mq_2
    ./bin/api get quest mq_3
    ./bin/api get quest mq_4
    ./bin/api get quest mq_5
    ./bin/api get quest mq_6
    ./bin/api get quest mq_7
    ./bin/api get quest sq_1
    ./bin/api get quest sq_2
    ./bin/api get quest quest_wis_01
    ./bin/api get monster goblin
    ./bin/api get monster skeleton
    ./bin/api get monster shadow
    ./bin/api get monster bandit
    ./bin/api get monster wolf
    ./bin/api get monster leshen
    ./bin/api get npc yael
    ./bin/api get npc brynn
    ./bin/api get npc archivus_sweelinck
    ./bin/api get terrain city
    ./bin/api get terrain forest
    ./bin/api get terrain crypt
    ./bin/api get terrain inn
    ./bin/api get terrain tavern
    ./bin/api get terrain goblin_cave
    ./bin/api get terrain hag_swamp
    ./bin/api get node LHR --raw
    ./bin/api get quest mq_1 --out /tmp/mq1.json

${C.bold}═══════════════════════════════════════════════════════════════════
  list — collection listing with filters
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api list [type] [filters]

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
    ./bin/api list
    ./bin/api list node
    ./bin/api list node --act 1
    ./bin/api list node --act 2
    ./bin/api list node --act 3
    ./bin/api list node --act 4
    ./bin/api list node --act 5
    ./bin/api list node --terrain city
    ./bin/api list node --terrain forest
    ./bin/api list node --terrain crypt
    ./bin/api list node --terrain inn
    ./bin/api list node --terrain tavern
    ./bin/api list node --terrain goblin_cave
    ./bin/api list node --terrain hag_swamp
    ./bin/api list node --terrain beach
    ./bin/api list node --terrain junction
    ./bin/api list node --q birka
    ./bin/api list node --q forest
    ./bin/api list node --q crypt
    ./bin/api list node --no-coords
    ./bin/api list node --has-quests true
    ./bin/api list node --has-quests false
    ./bin/api list node --junction true
    ./bin/api list node --junction false
    ./bin/api list node --act 1 --terrain city
    ./bin/api list node --act 3 --has-quests true
    ./bin/api list node --terrain forest --has-quests true
    ./bin/api list node --junction false --has-quests false
    ./bin/api list node --no-coords --ids
    ./bin/api list node --act 1 --ids
    ./bin/api list node --ids

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
    ./bin/api list quest
    ./bin/api list quest --type main
    ./bin/api list quest --type side
    ./bin/api list quest --type combat
    ./bin/api list quest --type skill_check
    ./bin/api list quest --type mission_bit
    ./bin/api list quest --node LHR
    ./bin/api list quest --node BK
    ./bin/api list quest --node TLL
    ./bin/api list quest --node KRN
    ./bin/api list quest --node FRO
    ./bin/api list quest --node TRD
    ./bin/api list quest --arc mq_
    ./bin/api list quest --arc sq_
    ./bin/api list quest --arc quest_wis
    ./bin/api list quest --npc yael
    ./bin/api list quest --npc brynn
    ./bin/api list quest --monster goblin
    ./bin/api list quest --monster skeleton
    ./bin/api list quest --monster leshen
    ./bin/api list quest --has-npc true
    ./bin/api list quest --has-npc false
    ./bin/api list quest --complete true
    ./bin/api list quest --q shard
    ./bin/api list quest --q goblin
    ./bin/api list quest --q "the road"
    ./bin/api list quest --type side --node LHR
    ./bin/api list quest --type main --ids
    ./bin/api list quest --arc mq_ --ids
    ./bin/api list quest --has-npc true --type side
    ./bin/api list quest --ids

  ── list monster ─────────────────────────────────────────────────

  Flags:
    --terrain <key>        Monsters in this terrain
    --tier <tier>          trivial | easy | medium | hard | boss
    --has-drop true|false  Filter by loot drop presence
    --no-terrain           Monsters not in any terrain (orphans)
    --q <text>             Text search on name / key
    --ids                  Return keys only

  Examples:
    ./bin/api list monster
    ./bin/api list monster --terrain city
    ./bin/api list monster --terrain forest
    ./bin/api list monster --terrain crypt
    ./bin/api list monster --terrain inn
    ./bin/api list monster --terrain tavern
    ./bin/api list monster --terrain goblin_cave
    ./bin/api list monster --terrain hag_swamp
    ./bin/api list monster --terrain beach
    ./bin/api list monster --terrain sewers
    ./bin/api list monster --terrain vampire_castle
    ./bin/api list monster --tier trivial
    ./bin/api list monster --tier easy
    ./bin/api list monster --tier medium
    ./bin/api list monster --tier hard
    ./bin/api list monster --tier boss
    ./bin/api list monster --has-drop true
    ./bin/api list monster --has-drop false
    ./bin/api list monster --no-terrain
    ./bin/api list monster --q vampire
    ./bin/api list monster --q dragon
    ./bin/api list monster --q ghost
    ./bin/api list monster --q shadow
    ./bin/api list monster --q wraith
    ./bin/api list monster --tier easy --has-drop true
    ./bin/api list monster --tier boss --ids
    ./bin/api list monster --terrain crypt --tier easy
    ./bin/api list monster --no-terrain --ids
    ./bin/api list monster --ids

  ── list npc ─────────────────────────────────────────────────────

  Flags:
    --node <code>          NPCs at this node
    --occupation <text>    Occupation substring filter
    --q <text>             Text search on name / key
    --ids                  Return keys only

  Examples:
    ./bin/api list npc
    ./bin/api list npc --node LHR
    ./bin/api list npc --node TLL
    ./bin/api list npc --node KRN
    ./bin/api list npc --occupation innkeeper
    ./bin/api list npc --occupation merchant
    ./bin/api list npc --occupation guard
    ./bin/api list npc --occupation captain
    ./bin/api list npc --q yael
    ./bin/api list npc --q brynn
    ./bin/api list npc --ids

  ── list terrain ─────────────────────────────────────────────────

  Flags:
    --q <text>   Text search on label / key
    --ids        Return keys only

  Examples:
    ./bin/api list terrain
    ./bin/api list terrain --q city
    ./bin/api list terrain --q forest
    ./bin/api list terrain --q swamp
    ./bin/api list terrain --q crypt
    ./bin/api list terrain --q cave
    ./bin/api list terrain --ids

  ── list ids <type> ──────────────────────────────────────────────

  Returns {type, count, ids:[…]} — no full objects.

  Examples:
    ./bin/api list ids node
    ./bin/api list ids quest
    ./bin/api list ids monster
    ./bin/api list ids npc
    ./bin/api list ids terrain

${C.bold}═══════════════════════════════════════════════════════════════════
  location — composite node view
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api location [code] [filters]

  No code: list all locations with counts (filterable).
  With code: node + monsters + quests + NPCs in one response.

  Location list flags (no code):
    --act <n>              Filter by act number
    --terrain <key>        Filter by terrain key
    --q <text>             Search on label / code
    --has-quests true|false  Filter by quest presence
    --ids                  Return {count, ids:[…]}

  Examples — list form:
    ./bin/api location
    ./bin/api location --act 1
    ./bin/api location --act 2
    ./bin/api location --act 3
    ./bin/api location --act 4
    ./bin/api location --act 5
    ./bin/api location --terrain city
    ./bin/api location --terrain forest
    ./bin/api location --terrain crypt
    ./bin/api location --terrain inn
    ./bin/api location --terrain goblin_cave
    ./bin/api location --has-quests true
    ./bin/api location --has-quests false
    ./bin/api location --q birka
    ./bin/api location --q crypt
    ./bin/api location --act 1 --has-quests true
    ./bin/api location --terrain forest --has-quests true
    ./bin/api location --ids
    ./bin/api location --act 3 --ids

  Examples — detail form:
    ./bin/api location LHR
    ./bin/api location BK
    ./bin/api location TLL
    ./bin/api location KRN
    ./bin/api location FRO
    ./bin/api location TRD
    ./bin/api location SDQ
    ./bin/api location LHR --out /tmp/lhr-location.json

${C.bold}═══════════════════════════════════════════════════════════════════
  chain — quest dependency chain
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api chain <quest-id>

  Returns upstream (quests that must complete before this) and
  downstream (quests unlocked by this one). Also reports canDelete.

  Examples:
    ./bin/api chain mq_1
    ./bin/api chain mq_2
    ./bin/api chain mq_3
    ./bin/api chain mq_4
    ./bin/api chain mq_5
    ./bin/api chain mq_6
    ./bin/api chain mq_7
    ./bin/api chain sq_1
    ./bin/api chain sq_2
    ./bin/api chain quest_wis_01
    ./bin/api chain mq_1 --raw

${C.bold}═══════════════════════════════════════════════════════════════════
  put — edit one or more fields
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api put <type> <id> <field>=<value> [field=value …]

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
    ./bin/api put node LHR label="City Streets — Birka (Revised)"
    ./bin/api put node LHR name=city
    ./bin/api put node LHR act=1
    ./bin/api put node LHR N=BMA
    ./bin/api put node LHR S=KRN
    ./bin/api put node LHR E=TLL
    ./bin/api put node LHR W=WRO
    ./bin/api put node LHR W=null
    ./bin/api put node TLL sleep=true sleepCost=5
    ./bin/api put node KRN npc="The Sexton"
    ./bin/api put node LHR loot="Bloodstained Map"

  Examples — quest:
    ./bin/api put quest mq_1 passText="Muffat takes the map."
    ./bin/api put quest mq_1 failText="The docks are empty."
    ./bin/api put quest mq_1 hint="Seek Muffat at the Tilbury docks."
    ./bin/api put quest mq_2 waypointNode=FRO
    ./bin/api put quest mq_3 activateNode=SDQ
    ./bin/api put quest sq_1 npc=brynn
    ./bin/api batch-npc updates.json          # §AUDIT-03b: bulk npc re-anchor, ONE save
                                             #   updates.json = [{"id":"quest_x","npc":"key"}, ...]
    ./bin/api put quest quest_wis_01 checkDC=14
    ./bin/api put quest quest_wis_01 checkStat=WIS
    ./bin/api put quest sq_2 xpAward=50 reward=20

  Examples — monster:
    ./bin/api put monster goblin hp=10
    ./bin/api put monster goblin ac=14
    ./bin/api put monster goblin atk=5
    ./bin/api put monster goblin tier=medium
    ./bin/api put monster skeleton name="Risen Skeleton"
    ./bin/api put monster shadow dmgDie=8 dmgCount=2

  Examples — terrain:
    ./bin/api put terrain city label="City Streets"
    ./bin/api put terrain forest icon=🌲

  Examples — piping JSON body:
    echo '{"passText":"You recalled the text.","failText":"Try again."}' \\
      | ./bin/api put quest quest_wis_01
    echo '{"label":"City Streets — Birka","act":1}' \\
      | ./bin/api put node LHR
    echo '{"hp":20,"ac":16,"tier":"medium"}' \\
      | ./bin/api put monster skeleton
    cat overrides.json | ./bin/api put quest mq_1

${C.bold}═══════════════════════════════════════════════════════════════════
  post — create a new entity
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api post <type> [field=value …]

  Nonce is auto-acquired if id/code/key is provided.
  Pipe a JSON object for complex bodies.

  Required fields by type:
    node:    code  name (terrain key)  label  act
    quest:   id  type  title  activateNode
    monster: key  name  tier  ac  hp  atk  dmgDie  dmgCount  dmgFlat
    npc:     key  name  occupation  node
    terrain: key  label  icon

  Examples — node:
    ./bin/api post node code=MM name=mimic_meadows label="Mimic Meadows" act=3
    ./bin/api post node code=SW name=scholars_qtr label="Scholar Workshop" act=3 N=CY W=BK
    ./bin/api post node code=EHZ name=void label="Event Horizon Zone" act=5
    ./bin/api post node \\
      code=VAULT name=crypt label="The Sealed Vault" act=2 \\
      N=KRN sleep=false
    ./bin/api post node \\
      code=NEW_INN name=inn label="The Silver Lantern Inn" act=2 \\
      sleep=true sleepCost=8 npc="Innkeeper Gert"

  Examples — quest:
    ./bin/api post quest \\
      id=sq_birka_rat type=combat title="The Rat Problem" \\
      desc="Brynn wants the cellar cleared." \\
      hint="Head to the cellar beneath the inn." \\
      passText="The cellar is quiet now." \\
      failText="The rats are still down there." \\
      activateNode=TLL waypointNode=TLL npc=brynn
    ./bin/api post quest \\
      id=sq_crypt_candle type=side title="The Black Candle" \\
      desc="Something lit that candle." \\
      hint="Search the crypt second chamber." \\
      passText="The candle burns out." \\
      failText="The candle is still burning." \\
      activateNode=KRN waypointNode=KRN
    ./bin/api post quest \\
      id=quest_int_01 type=skill_check title="Decipher the Cipher" \\
      desc="The cipher is in three parts." \\
      hint="The answer is in the structure." \\
      passText="The cipher resolves into coordinates." \\
      failText="The cipher is still locked." \\
      activateNode=MHQ waypointNode=LCY \\
      checkStat=INT checkDC=14

  Examples — monster:
    ./bin/api post monster \\
      key=bog_crawler name="Bog Crawler" tier=easy \\
      ac=11 hp=18 atk=4 dmgDie=6 dmgCount=1 dmgFlat=2
    ./bin/api post monster \\
      key=swamp_sovereign name="Swamp Sovereign" tier=boss \\
      ac=16 hp=120 atk=8 dmgDie=10 dmgCount=2 dmgFlat=5
    ./bin/api post monster \\
      key=void_tendril name="Void Tendril" tier=medium \\
      ac=13 hp=45 atk=6 dmgDie=8 dmgCount=2 dmgFlat=3

  Examples — npc:
    ./bin/api post npc \\
      key=innkeeper_gert name="Innkeeper Gert" \\
      occupation=innkeeper node=NEW_INN
    ./bin/api post npc \\
      key=fence_pachelbel name="City Fence Pachelbel" \\
      occupation=fence node=LLA

  Examples — terrain:
    ./bin/api post terrain key=temple_ruins label="Temple Ruins" icon=🏛
    ./bin/api post terrain key=void label="The Void" icon=🌑

  Examples — piping JSON:
    cat <<'EOF' | ./bin/api post node
    {"code":"EHZ","name":"void","label":"Event Horizon Zone","act":5}
    EOF

    cat <<'EOF' | ./bin/api post quest
    {"id":"quest_math_01","type":"side","title":"The Counting Problem",
     "desc":"The mathematician wants an exact count.",
     "hint":"Count carefully. Zero matters.",
     "passText":"The count is correct.",
     "failText":"The count was off.",
     "activateNode":"EHZ","waypointNode":"EHZ"}
    EOF

    cat import_cdg.json | ./bin/api post node
    cat new_quests.json | ./bin/api post quest

${C.bold}═══════════════════════════════════════════════════════════════════
  del — delete an entity
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api del <type> <id>

  Nonce is auto-acquired. Before deleting:
    - Run ./bin/api chain <id> for quests (check canDelete)
    - Run ./bin/api location <code> for nodes (check quests/npcs)

  Deletes are SOURCE-LEVEL and verified (§DX-01d/i, 2026-07-30). The entry line
  is excised from the data section, the file is saved and re-parsed, and the
  response carries deleteVerified:true only if the entry is really gone. Before
  that fix every del was model-only: it printed "✓ deleted" and the entry came
  back on the next parse.

  Cascades, so no orphan is left for ./bin/api audit:
    node    → its NODE_COORDS row
    monster → its MONSTER_DROPS trophy entry

  Refuses rather than corrupts: if excising the entry would change any other
  entry in the section, nothing is written and the delete fails loudly.
  Dependency guards are unchanged — a node with quests/NPCs, or a quest with
  downstream dependents, is still blocked (409 + blockedBy).

  Examples:
    ./bin/api del quest sq_birka_rat
    ./bin/api del quest quest_old_01
    ./bin/api del node MM
    ./bin/api del node VAULT
    ./bin/api del monster bog_crawler
    ./bin/api del npc innkeeper_gert

  Manual nonce flow (for scripting):
    NONCE=$(./bin/api nonce quest sq_birka_rat)
    curl -s -XDELETE http://localhost:1367/api/quest/sq_birka_rat \\
      -H "X-Nonce: $NONCE" | jq

${C.bold}═══════════════════════════════════════════════════════════════════
  audit — integrity scan
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api audit [--map] [--text]

  No flags: full integrity scan (broken refs, missing data, dead flags).
  --map:  bidirectional link audit (A.N→B but B.S≠A).
  --text: plain text output instead of JSON.

  Severity levels: error | warning | suggestion | parse

  Examples:
    ./bin/api audit
    ./bin/api audit --map
    ./bin/api audit --text
    ./bin/api audit --map --text
    ./bin/api audit --raw
    ./bin/api audit --out /tmp/audit.json

  Pipe for quick checks:
    ./bin/api audit --raw | jq '.summary'
    ./bin/api audit --map --raw | jq '[.errors[] | {from:.from, dir:.dir, to:.to}]'
    ./bin/api audit --map --text | grep ERROR

  Systematic fix loop using next-error:
    curl -s 'http://localhost:1367/api/next-error'              | jq '{severity, key, field, fix}'
    curl -s 'http://localhost:1367/api/next-error?skip=1'       | jq '{severity, key, field, fix}'
    curl -s 'http://localhost:1367/api/next-error?severity=error' | jq '.'

${C.bold}═══════════════════════════════════════════════════════════════════
  export — dump collection data
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api export <collection> [--format json|js|module] [--out file]

  Collections: node_map | quest_db | monster_pool | world_db | all

  --format json   (default) — plain JSON object
  --format js     — const NODE_MAP = {...} assignment
  --format module — export const NODE_MAP = {...} ESM

  Examples:
    ./bin/api export node_map
    ./bin/api export quest_db
    ./bin/api export monster_pool
    ./bin/api export world_db
    ./bin/api export all
    ./bin/api export node_map --format js
    ./bin/api export quest_db --format module
    ./bin/api export all --format json
    ./bin/api export node_map --out world/nodes.json
    ./bin/api export quest_db --out world/quests.json
    ./bin/api export monster_pool --out world/monsters.json
    ./bin/api export world_db --out world/terrains.json
    ./bin/api export all --out world/full-export.json
    ./bin/api export quest_db --format module --out src/data/quests.mjs

  Backup before large edits:
    ./bin/api export node_map --out backup-nodes-$(date +%Y%m%d).json
    ./bin/api export quest_db --out backup-quests-$(date +%Y%m%d).json

  Inspect counts:
    ./bin/api export quest_db --raw | jq 'keys | length'
    ./bin/api export node_map --raw | jq 'keys'
    ./bin/api export monster_pool --raw | jq '[to_entries[] | select(.value.tier=="boss") | .key]'

${C.bold}═══════════════════════════════════════════════════════════════════
  import — bulk import nodes + quest cycles
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api import <file.json>
  cat file.json | ./bin/api import

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
    ./bin/api import import_cdg.json
    ./bin/api import import_vie.json
    ./bin/api import import_rkv.json
    ./bin/api import import_alf.json
    ./bin/api import import_hft.json
    cat import_cdg.json | ./bin/api import
    ./bin/api import import_cdg.json --out /tmp/cdg-import-result.json

  Review result:
    ./bin/api import import_cdg.json --out /tmp/result.json
    jq '{created:.nodesCreated, skipped:.nodesSkipped, quests:.questsCreated|length}' /tmp/result.json

${C.bold}═══════════════════════════════════════════════════════════════════
  speak — Claude-voiced NPC dialogue
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api speak <npc-id> "<prompt>" [--state neutral|friendly|dearFriend] [--model <model>]

  Requires: ANTHROPIC_API_KEY in environment.
  States: neutral (first meeting) | friendly (ally) | dearFriend (deep trust)

  Examples:
    ./bin/api speak yael "Good afternoon."
    ./bin/api speak yael "What happened here?"
    ./bin/api speak yael "I cleared the crypt."
    ./bin/api speak yael "Tell me what you know about the Void."
    ./bin/api speak yael "I cleared the crypt." --state friendly
    ./bin/api speak yael "Tell me what you know about the Void." --state dearFriend
    ./bin/api speak brynn "Do you have a room available?"
    ./bin/api speak brynn "What can you tell me about Froberger?"
    ./bin/api speak brynn "I found the two missing merchants." --state friendly
    ./bin/api speak archivus_sweelinck "I have all seven shards."
    ./bin/api speak archivus_sweelinck "Is this the right path?" --state dearFriend
    ./bin/api speak yael "What is happening in this city?" --model claude-haiku-4-5-20251001
    ./bin/api speak yael "I need your help." --model claude-sonnet-4-6

${C.bold}═══════════════════════════════════════════════════════════════════
  nonce — get a one-time write token
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api nonce <type> <id>

  Prints the nonce token to stdout (expires in 5 minutes).
  Use when scripting raw curl DELETE/POST calls.
  ./bin/api post and ./bin/api del auto-acquire nonces — use this only
  when you need the token separately.

  Examples:
    ./bin/api nonce quest sq_birka_rat
    ./bin/api nonce node MM
    ./bin/api nonce monster bog_crawler

  Capture and use in a script:
    NONCE=$(./bin/api nonce quest sq_old_01)
    curl -s -XDELETE http://localhost:1367/api/quest/sq_old_01 \\
      -H "X-Nonce: $NONCE" | jq

    NONCE=$(./bin/api nonce node NEW_NODE)
    curl -s -XPOST http://localhost:1367/api/node \\
      -H "Content-Type: application/json" \\
      -H "X-Nonce: $NONCE" \\
      -d '{"code":"NEW_NODE","name":"city","label":"New City Node","act":1}' | jq

${C.bold}═══════════════════════════════════════════════════════════════════
  ai — ask Claude about the API
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api ai "<question>"
  ./bin/api --ai "<question>"

  Requires: ANTHROPIC_API_KEY. Uses Claude Haiku. Replies in 1–3 lines,
  leading with a concrete ./bin/api command when applicable.

  Examples:
    ./bin/api ai "how do I link two nodes bidirectionally?"
    ./bin/api ai "what monsters appear in dungeon terrain?"
    ./bin/api ai "how do I add a quest that requires two items?"
    ./bin/api ai "what is the difference between activateNode and waypointNode?"
    ./bin/api ai "how do I create a junction between KRN and HKG?"
    ./bin/api ai "what fields can I set on a node?"
    ./bin/api ai "how do I bulk export and re-import node_map?"
    ./bin/api ai "what curl command fills a gap between two nodes?"
    ./bin/api ai "how do I see quests at node LHR?"
    ./bin/api ai "how do I check if a node is walkable from BK?"
    ./bin/api --ai "list all monster tiers"
    ./bin/api --ai "show me how to create a skill_check quest"

${C.bold}═══════════════════════════════════════════════════════════════════
  GLOBAL OPTIONS — apply to every command
═══════════════════════════════════════════════════════════════════${C.reset}

  --server <url>      Override base URL
    ./bin/api ping --server http://localhost:1367
    ./bin/api ping --server http://192.168.1.10:1367
    WBAPI_URL=http://192.168.1.10:1367 ./bin/api ping

  --out <file>        Write output to file
    ./bin/api get node LHR --out /tmp/lhr.json
    ./bin/api list quest --out /tmp/quests.json
    ./bin/api export quest_db --out backup/quests-$(date +%Y%m%d).json
    ./bin/api count nodes --out /tmp/node-stats.json

  --raw               Compact JSON (no pretty-print)
    ./bin/api get node LHR --raw
    ./bin/api list quest --raw | wc -c
    ./bin/api list node --raw | jq 'length'
    ./bin/api export monster_pool --raw | jq 'keys | length'

  --retry <n>         Max retries on 5xx or connection error (default 3)
    ./bin/api put quest mq_1 passText="Updated." --retry 5
    ./bin/api import big-import.json --retry 2

  --timeout <ms>      Per-request timeout in ms (default 10000)
    ./bin/api export monster_pool --timeout 30000
    ./bin/api import import_vie.json --timeout 15000

${C.bold}═══════════════════════════════════════════════════════════════════
  §23 CELL GRID QUERIES
═══════════════════════════════════════════════════════════════════${C.reset}

  Cell and grid endpoints expose the game's (r,c) coordinate system
  without scanning NODE_MAP manually.  All are read-only (GET only).

  ── cell — inspect a single grid cell ──────────────────────────

  ./bin/api cell <r> <c>              # node at (r,c): code, terrain, exits
  ./bin/api cell <r> <c> neighbors    # N/E/S/W neighbors with terrain + passable

  Example:
    ./bin/api cell 5 16
    → { r:5, c:16, code:"CI", terrain:"city", exits:{N:"SL",E:"IN",S:null,W:null} }

    ./bin/api cell 5 16 neighbors
    → { N:{code:"SL",terrain:"road",passable:true}, E:{…}, S:null, W:null }

  ── grid — bulk cell-grid queries ──────────────────────────────

  ./bin/api grid heatmap
    → all cells with adjacency heat (0–4 occupied neighbors)
    → sort by heat to find highly connected vs isolated nodes

  ./bin/api grid reachability [--hub LHR]
    → reachable vs unreachable cells from hub (default: LHR)
    → same answer as ./bin/api reachability but cell-based

  ./bin/api grid region --r1=0 --c1=0 --r2=10 --c2=20
    → 2D array of cells in bounding box
    → null = empty cell, object = { code, terrain, exits }

${C.bold}═══════════════════════════════════════════════════════════════════
  §24 COMMON RECIPES
═══════════════════════════════════════════════════════════════════${C.reset}

  # Is the server running?
  ./bin/api ping

  # How many nodes / quests / monsters are loaded?
  ./bin/api count

  # What nodes have no coordinates yet?
  ./bin/api list node --no-coords

  # What quests are at a given node?
  ./bin/api list quest --node LHR
  ./bin/api list quest --node BK

  # All main quest IDs in order
  ./bin/api list quest --arc mq_ --ids

  # What monsters live in the crypt?
  ./bin/api list monster --terrain crypt

  # Are there any monsters not in any terrain?
  ./bin/api list monster --no-terrain

  # Which nodes have no quests and are not junctions?
  ./bin/api list node --has-quests false --junction false

  # Full location composite view for a node
  ./bin/api location LHR
  ./bin/api location KRN

  # Check whether a quest can be safely deleted
  ./bin/api chain sq_birka_rat

  # Update quest text from a long heredoc
  ./bin/api put quest mq_1 passText="\$(cat <<'EOF'
  Muffat takes the map and unfolds it on the dock counter.
  She does not ask how you came by it.
  EOF
  )"

  # Backup before editing
  ./bin/api export node_map --out /tmp/backup-nodes.json && \\
    ./bin/api put node LHR label="City Streets — Birka"

  # Full create+verify+save workflow
  ./bin/api post node code=TEST name=city label="Test Node" act=1
  ./bin/api post quest id=quest_test_01 type=side title="Test Quest" \\
    activateNode=TEST desc="test" passText="pass" failText="fail"
  ./bin/api location TEST
  ./bin/api audit --map
  curl -s -XPOST http://localhost:1367/api/save | jq

  # Export all data for offline analysis
  ./bin/api export all --out world-snapshot-$(date +%Y%m%d).json

${C.bold}═══════════════════════════════════════════════════════════════════
  MAP VISUALIZATION
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api worldmap [options]

  Three zoom levels — each embeds navigation hints for the next level.
  No curl needed. All map operations go through ./bin/api worldmap.

  Level 0 — World (all 76 geo-referenced cities, lat/lon oriented):
    ./bin/api worldmap
    ./bin/api worldmap --latlon

  Level 1 — Region (6×6 grid, A1–F6, west→east, north→south):
    ./bin/api worldmap --regions
    ./bin/api worldmap --region A1
    ./bin/api worldmap --region B2
    ./bin/api worldmap --region C3
    ./bin/api worldmap --region C4
    ./bin/api worldmap --region C5

  Level 2 — City (immediate connections, terrain, gap/bendy status):
    ./bin/api worldmap --city LHR
    ./bin/api worldmap --city CON
    ./bin/api worldmap --city ROM
    ./bin/api worldmap --city JAR
    ./bin/api worldmap --city BGD
    ./bin/api worldmap --city SAM

  Search / Hunt:
    ./bin/api worldmap --search "crypt"
    ./bin/api worldmap --search "forest"
    ./bin/api worldmap --search "Jerusalem"
    ./bin/api worldmap --monster skeleton
    ./bin/api worldmap --monster thug
    ./bin/api worldmap --monster drowner

  Route navigation (BFS A→B, shows turn-by-turn + terrain + battles):
    ./bin/api worldmap --route LHR --to CON
    ./bin/api worldmap --route LON --to JAR
    ./bin/api worldmap --route LHR --to SAM
    ./bin/api worldmap --route GLA --to NID

${C.bold}═══════════════════════════════════════════════════════════════════
  COORDINATE MANAGEMENT
═══════════════════════════════════════════════════════════════════${C.reset}

  ./bin/api geo-seed [--execute]

  Dry-run by default (shows what would change). --execute applies.
  Anchors 76 major cities to real lat/lon positions on the game grid.

    ./bin/api geo-seed
    ./bin/api geo-seed --execute

  After geo-seed, propagate all connected nodes:
    node src/tools/layout-solve.js --apply

  Move a node's coordinates (swap if destination is occupied):
    ./bin/api move LHR 12 18
    ./bin/api move LHR 12 18 --swap
    ./bin/api move KRN 13 18

  Find open attachment points near a city (where to add new content):
    ./bin/api find-open-location LHR
    ./bin/api find-open-location CON
    ./bin/api find-open-location LHR --radius 10

${C.bold}═══════════════════════════════════════════════════════════════════
  NETWORK WIRING
═══════════════════════════════════════════════════════════════════${C.reset}

  Connection rules (enforced everywhere):
    • Max 4 connections per node
    • Degree-3 rule: if inserting into a deg=3 node, junction auto-created first
    • A→B = A-mesh → B-mesh: use smart-connect for city-to-city wiring
    • After any change: run broken + reachability to check for regressions

  Preferred — mesh-aware (finds open insertion points in each city's mesh):
    ./bin/api smart-connect LHR CON
    ./bin/api smart-connect LHR CON --execute
    ./bin/api smart-connect KOL SAM --execute
    ./bin/api smart-connect GLA NID --execute
    ./bin/api smart-connect LHR CON --radius 8

  Full junction highway (L-shaped route, elbow at corner) — ⚠️ PLANNING ONLY:
    ./bin/api highway LHR CON            # route/elbow/step report (free, honest)
    ./bin/api highway LHR CON --execute  # REFUSED since §DX-01d

    --execute laid ZERO road cells and dropped junction:true nodes on a terrain
    absent from WORLD_DB — the direct cause of the J14/J15 check:invariants reds.
    A contiguous-land node is already walk-routable (./bin/api reachability is the
    authority). For a real encounter-free road: edit ROAD_RUNS, then
    node src/scripts/build-roads.js --apply, then npm run check:walk.

  Single junction node:
    ./bin/api junction LHR S
    ./bin/api junction LHR S --execute
    ./bin/api junction LHR S --label "Birka South Gate" --terrain city --execute
    ./bin/api junction CON W --execute

  Direct wire (warns on deg=3 or deg=4; --force to override):
    ./bin/api connect WOR E SAL
    ./bin/api connect CON W THA
    ./bin/api connect GLA S YRK
    ./bin/api connect VEN N ROM
    ./bin/api connect ANT S JAR

${C.bold}═══════════════════════════════════════════════════════════════════
  NETWORK HEALTH & REPAIR  (§CELL-06 cell-first)
═══════════════════════════════════════════════════════════════════${C.reset}

  Exits = cell adjacency only (N/S/E/W pointer fields removed in §CELL-01).
  Each location must be in exactly one cell.  Steps are always length 1.

  Full grid health check (coords + collisions + reachability + isolated):
    ./bin/api verify
    ./bin/api verify --hub LHR

  Show nodes with no cell neighbors (isolated in grid):
    ./bin/api broken

  Check reachability (% of nodes walkable from hub via cell adjacency):
    ./bin/api reachability
    ./bin/api reachability --hub LHR

  Prune orphaned NODE_COORDS entries (leftovers from deleted junctions):
    ./bin/api clean
    ./bin/api clean --execute

  Fix all one-way links (A→B but B doesn't point back):
    ./bin/api fix-bidirectional
    ./bin/api fix-bidirectional --execute

  Junction audit (if any J#### nodes still remain):
    ./bin/api junction-audit

  Full world reset sequence (cell-first, §WALK-1.5 geo flood):
    ./bin/api clean --execute
    ./bin/api geo-seed --execute
    node src/tools/layout-solve.js --apply
    ./bin/api verify
    ./bin/api reachability

  NOTE (§WALK-3): rip-and-connect, fill-gap, and reweave-all are retired (HTTP 410).
  Reachability is a terrain-field land flood — empty land cells are walkable and
  there are no node-adjacency strays. Unreachable nodes are a content decision:
  re-anchor lat/lon or carve a sea-lane (§WALK-1.5).

${C.bold}═══════════════════════════════════════════════════════════════════
  MULTIPLAYER MESH  (§MESH-01 · §MESH-02)
═══════════════════════════════════════════════════════════════════${C.reset}

  API-first parity with the worldbuilder 🌐 Mesh tab and the game's
  map-tab connection center (🌐 Connect · 🔭 Discover · 🛡 Lists).

  One-call status (identity, world hash, ACL + rate limits, peers, players):
    ./bin/api mesh status
    ./bin/api mesh status --json          full GET /api/mesh/status payload

  Gossip peer table (live/dead, last seen, last error) + remote players:
    ./bin/api mesh peers
    ./bin/api mesh peers --json

  Server browser — ask a tracker for its live server table:
    ./bin/api mesh tracker                queries this server's configured tracker(s)
    ./bin/api mesh tracker lan-host:1367  query an explicit tracker
    ./bin/api mesh tracker --json
    → servers on a different worldHash than yours are flagged "≠ different world"

  ACL editor (§MESH-02a — GET/PUT /api/mesh/acl, validated merge-write,
  comment keys in the file survive, hot-reloaded — no restart):
    ./bin/api mesh acl                    show mode · shareBlocklist · six allow/block lists
    ./bin/api mesh acl mode=allowlist shareBlocklist=true blockIps=1.2.3.4,5.6.7.8
    → lists are comma-split; blockIps= (empty) clears a list; unknown field/bad mode → 400

  Blocklist share + preview (D2/D3 — share-OUT is opt-in, import is manual):
    ./bin/api mesh blocklist              what THIS server shares (403 until shareBlocklist=true)
    ./bin/api mesh blocklist host:1367    preview a PEER's shared blocklist (read-only —
                                         merging is an explicit click in the game's 🛡 Lists pane)

  Runtime connect (§MESH-02i — no restart; persists via the peers cache):
    ./bin/api mesh connect lan-host:1367          dial a gossip peer now
    ./bin/api mesh connect http://tracker:1367    add an announce target now

  Mesh config lives server-side: peers.txt, mesh-acl.json (MESH_ACL_FILE),
  TRACKER_URL / BOOTSTRAP_URLS / --advertise. Design:
  lab-reports/lab-report-mesh-multiuser.md + lab-report-mesh02-connections-ui.md.

${C.bold}═══════════════════════════════════════════════════════════════════
  SERVER LIFECYCLE
═══════════════════════════════════════════════════════════════════${C.reset}

  ./wbapi-toggle.sh start     Start server in background (auto-restart loop)
  ./wbapi-toggle.sh stop      Kill background instance
  ./wbapi-toggle.sh restart   Stop + start (required after wbapi-server.js changes)
  ./wbapi-toggle.sh status    Show PID and port
  ./wbapi-toggle.sh fg        Run in foreground with full log scroll

  ── Persistence: dated backups (§DX-02k / §DX-02l) ───────────────

  Every write already reaches disk on its own — the server writes a temp
  beside the game file and renames it in (atomic; nothing left to sweep).
  You do NOT need to run save after a put/post/del.

    ./bin/api save               dated backup beside play.html, then
                                overwrite + hot-reload  (POST /api/save)
    ./bin/api snapshots          list the dated backups + total size
    ./bin/api snapshots --sweep  delete the ones already patch-archived
                                  [--force  discard unarchived ones too]

  Disposal keeps history by default: ./archive-snapshots.sh turns each
  snapshot into a build/milepoints/patches delta and then removes the file, so
  --sweep refuses anything that chain has never seen unless you --force.
  The dated files are gitignored — ./bin/api snapshots is the only thing
  that will ever tell you they are there.

  ── Logging modes ────────────────────────────────────────────────

  Normal (default):
    ./wbapi-toggle.sh start
    → Request method/URL, response status, timing. No bodies.

  Verbose — full request + response bodies:
    WBAPI_VERBOSE=1 node src/js/wbapi-server.js
    WBAPI_VERBOSE=1 ./wbapi-toggle.sh fg
    → Every body printed to terminal AND log file.

  Trace — ultra-verbose algorithm decisions:
    WBAPI_TRACE=1 node src/js/wbapi-server.js
    WBAPI_TRACE=1 ./wbapi-toggle.sh fg
    → Logs every decision: auto-junction trigger, smart-connect candidate
      selection, PUT field processing, node creation details.
    → Completely independent of VERBOSE. Off by default.

  Both at once:
    WBAPI_VERBOSE=1 WBAPI_TRACE=1 node src/js/wbapi-server.js

  Live log tail (all modes write here):
    tail -f build/milepoints/wbapi-server.log
    tail -f build/milepoints/wbapi-server.log | grep TRACE
    tail -f build/milepoints/wbapi-server.log | grep "auto-junction\|rip-stray\|smart-connect"

  Log file: build/milepoints/wbapi-server.log
  Port:     1367  (the canonical game year, 1367 AD)

${C.bold}═══════════════════════════════════════════════════════════════════
  SERVER LIFECYCLE
═══════════════════════════════════════════════════════════════════${C.reset}

  ./wbapi-toggle.sh start     Start server in background (auto-restart loop)
  ./wbapi-toggle.sh stop      Kill background instance
  ./wbapi-toggle.sh restart   Stop + start
  ./wbapi-toggle.sh status    Show PID and port
  ./wbapi-toggle.sh fg        Run in foreground with full log scroll

  Log file: build/milepoints/wbapi-server.log
  Port:     1367  (the canonical game year, 1367 AD)
`.trim();

// ── Compact synopsis — printed before every response (stderr, TTY only) ───────
const SYNOPSIS = [
  `${C.bold}./bin/api${C.reset} ${C.dim}[--out file] [--raw] [--retry n] [--ai "..."]${C.reset}`,
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
  `  ${C.yellow}Directive: always use ./bin/api — never curl. Request a refactor if a feature is missing.${C.reset}`,
  `  ${C.yellow}Maintain the network: run ./bin/api verify after every change.${C.reset}`,
  ``,
  `  ${C.bold}── Health ──────────────────────────────────────────────────────────────${C.reset}`,
  `  ${C.green}ping${C.reset}                               health check + entity counts`,
  `  ${C.green}verify${C.reset} [--hub LHR]                full cell-grid health: coords + collisions + reachability + isolated`,
  `  ${C.green}broken${C.reset}                             nodes in grid with no cell neighbors (heat=0)`,
  `  ${C.green}reachability${C.reset} [--hub LHR]           % reachable from hub (cell-grid BFS)`,
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
  `  ${C.green}save${C.reset}                               dated backup beside the game file, then overwrite + reload`,
  `  ${C.green}snapshots${C.reset} [--sweep] [--force]      list / delete those dated backups`,
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
  `  ${C.green}highway${C.reset} <from> <to>                ⚠️ route PLANNING only  [--step 4]  (--execute refused, §DX-01d)`,
  `  ${C.green}fix-bidirectional${C.reset} [--execute]         fix all one-way links (A→B but B doesn't point back)`,
  `  ${C.green}cluster-bridge${C.reset} [--execute]             connect remaining isolated clusters`,
  `  ${C.green}migrate strip-exit-fields${C.reset} [--execute]   §CELL-14: strip dead N/S/E/W/portal/spire from NODE_MAP`,
  ``,
  `  ${C.bold}── Multiplayer Mesh (§MESH-01) ─────────────────────────────────────────${C.reset}`,
  `  ${C.green}mesh status${C.reset}                        identity · world hash · ACL/rate · peers · players  [--json]`,
  `  ${C.green}mesh peers${C.reset}                         gossip peer table + remote players  [--json]`,
  `  ${C.green}mesh tracker${C.reset} [url]                 server browser: live servers on tracker(s)  [--json]`,
  `  ${C.green}mesh acl${C.reset} [k=v ...]                 show / merge-edit mesh-acl.json (mode, shareBlocklist, 6 lists)  [--json]`,
  `  ${C.green}mesh blocklist${C.reset} [host:port]         this server's shared blocklist, or preview a peer's (read-only)  [--json]`,
  `  ${C.green}mesh connect${C.reset} <addr|tracker-url>    dial a gossip peer / add a tracker at runtime (no restart)  [--json]`,
  ``,
  `  ${C.green}ai${C.reset} "<question>"                    ask Claude  (ANTHROPIC_API_KEY)`,
  `  ${C.dim}types: node  quest  monster  npc  terrain  |  ./bin/api help for full manual${C.reset}`,
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
  if (!fn) die(`Unknown command "${cmd}". Run: ./bin/api help`);

  // Print synopsis before every command except 'help' (which has its own full text)
  if (cmd !== 'help') printSynopsis();

  try {
    await fn.call(CMD, pos, flags);
  } catch (e) {
    if (e.code === 'ECONNREFUSED') die(`Server not running at ${BASE}\n  Start: ./wbapi-toggle.sh start`);
    die(e.message || String(e));
  }
})();
