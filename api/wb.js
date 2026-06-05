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

wb CLI cheatsheet:
  wb ping                             check server
  wb get <type> <id>                  fetch entity JSON
  wb list <type> [--node X]           list (filter by --node/--terrain/--type)
  wb put <type> <id> k=v [k=v]       update fields
  wb post <type> k=v [k=v]            create entity (nonce auto-handled)
  wb del <type> <id>                  delete (nonce auto-handled)
  wb audit [--map]                    integrity scan
  wb chain <quest-id>                 quest dependency chain
  wb export <collection>              dump JSON (collections: node_map quest_db monster_pool world_db)
  wb location <NODE_CODE>             composite location view

Reply in 1–3 lines. Lead with a concrete wb command when applicable.`;

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
    if (!type || !id) die('Usage: wb get <type> <id>');
    const r = await request('GET', `/api/${type}/${encodeURIComponent(id)}`);
    if (r.status !== 200) { printError(r); process.exit(1); }
    printResult(r.body, flags);
  },

  async list(pos, flags) {
    await requireServer();
    const [, type] = pos;
    if (!type) die('Usage: wb list <type>  [--node X] [--terrain X] [--type X]');
    const qs = new URLSearchParams();
    if (flags.node)    qs.set('node',    flags.node);
    if (flags.terrain) qs.set('terrain', flags.terrain);
    if (flags.type)    qs.set('type',    flags.type);
    const q = qs.size ? '?' + qs.toString() : '';
    const r = await request('GET', `/api/list/${type}${q}`);
    if (r.status !== 200) { printError(r); process.exit(1); }
    printResult(r.body, flags);
  },

  async put(pos, flags) {
    await requireServer();
    const [, type, id, ...rest] = pos;
    if (!type || !id) die('Usage: wb put <type> <id> [k=v ...]  (or pipe JSON)');
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
    if (!type) die('Usage: wb post <type> [k=v ...]  (or pipe JSON)');
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
    if (!type || !id) die('Usage: wb del <type> <id>');
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
    if (!id) die('Usage: wb chain <quest-id>');
    const r = await request('GET', `/api/quest/${encodeURIComponent(id)}/chain`);
    if (r.status !== 200) { printError(r); process.exit(1); }
    printResult(r.body, flags);
  },

  async export(pos, flags) {
    await requireServer();
    const [, collection] = pos;
    if (!collection) die('Usage: wb export <node_map|quest_db|monster_pool|world_db>  [--format json|js|module]');
    const fmt = flags.format || 'json';
    const r   = await request('GET', `/api/export/${collection}?format=${fmt}`);
    if (r.status !== 200) { printError(r); process.exit(1); }
    printResult(r.body, flags);
  },

  async location(pos, flags) {
    await requireServer();
    const [, code] = pos;
    if (!code) die('Usage: wb location <NODE_CODE>');
    const r = await request('GET', `/api/location/${encodeURIComponent(code)}`);
    if (r.status !== 200) { printError(r); process.exit(1); }
    printResult(r.body, flags);
  },

  async nonce(pos, flags) {
    await requireServer();
    const [, type, id] = pos;
    if (!type || !id) die('Usage: wb nonce <type> <id>');
    const nonce = await getNonce(type, id);
    process.stdout.write(nonce + '\n');
  },

  async ai(pos, flags) {
    const prompt = pos.slice(1).join(' ');
    if (!prompt) die('Usage: wb ai "<question>"');
    const reply = await askClaude(prompt);
    process.stdout.write(`${C.cyan}${reply}${C.reset}\n`);
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
      die('Usage: wb import <file.json>  (or pipe JSON)');
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
const HELP = `${C.bold}wb${C.reset}  Roll2Hit World Builder API wrapper  ${C.dim}localhost:1367${C.reset}

${C.bold}COMMANDS${C.reset}
  ping                            Check server health
  get   <type> <id>               Fetch entity + connections + _meta
  list  <type>                    List entities  [--node X] [--terrain X] [--type X]
  put   <type> <id> [k=v ...]     Update fields  (or pipe JSON body)
  post  <type> [k=v ...]          Create entity  (nonce auto-handled)
  del   <type> <id>               Delete entity  (nonce auto-handled)
  import <file.json>              Bulk import nodes + quest cycles  (or pipe JSON)
  audit                           Integrity scan  [--map] [--text]
  chain <quest-id>                Quest dependency chain
  export <collection>             Dump collection  [--format json|js|module]
  location <code>                 Composite location view
  nonce <type> <id>               Print a fresh nonce token
  ai "<question>"                 Ask Claude about the API

${C.bold}TYPES${C.reset}  node  quest  monster  npc  terrain

${C.bold}OPTIONS${C.reset}
  --server <url>    Override base URL  (default: $WBAPI_URL or http://localhost:1367)
  --out <file>      Write output to file instead of stdout
  --raw             Output compact JSON  (no pretty-print)
  --format <fmt>    Export format: json | js | module
  --retry <n>       Max retries on 5xx / conn error  (default: 3)
  --timeout <ms>    Per-request timeout  (default: 10000)
  --ai "<prompt>"   Shorthand: ask Claude without a subcommand

${C.bold}ENV${C.reset}
  WBAPI_URL           Override server base URL
  ANTHROPIC_API_KEY   Enable 'wb ai' / --ai (Claude Haiku, short answers)

${C.bold}EXAMPLES${C.reset}
  wb ping
  wb get node CY
  wb list quest --node CY
  wb list monster --terrain dungeon
  wb put quest quest_wis_01 passText="You recalled the text."
  wb post node code=MM name=mimic_meadows label="Mimic Meadows" act=3 battle=true
  wb post quest id=quest_foo type=side title="Side Quest" activateNode=CY
  wb del quest quest_old_01
  wb audit --map
  wb chain quest_wis_01
  wb export quest_db --out world/quests.json
  wb location CY
  echo '{"passText":"Done."}' | wb put quest quest_wis_01
  cat nodes.json | wb post node
  wb ai "how do I link two nodes?"
  wb --ai "what monsters appear in dungeon terrain?"
  wb import import_zth.json
  cat import_zth.json | wb import`.trim();

// ── Compact synopsis — printed before every response (stderr, TTY only) ───────
const SYNOPSIS = [
  `${C.bold}wb${C.reset} ${C.dim}[--out file] [--raw] [--retry n] [--ai "..."]${C.reset}`,
  `  ${C.green}ping${C.reset}                          check server`,
  `  ${C.green}get${C.reset}   <type> <id>             fetch entity`,
  `  ${C.green}list${C.reset}  <type>                  list  [--node X] [--terrain X] [--type X]`,
  `  ${C.green}put${C.reset}   <type> <id> [k=v…]      update fields  (or pipe JSON)`,
  `  ${C.green}post${C.reset}  <type> [k=v…]           create  (nonce auto)`,
  `  ${C.green}del${C.reset}   <type> <id>             delete  (nonce auto)`,
  `  ${C.green}import${C.reset} <file.json>            bulk import nodes + quest cycles`,
  `  ${C.green}audit${C.reset} [--map]                 integrity scan`,
  `  ${C.green}chain${C.reset} <quest-id>              quest chain`,
  `  ${C.green}export${C.reset} <collection>           dump JSON  [--format js|module]`,
  `  ${C.green}location${C.reset} <code>               composite node view`,
  `  ${C.green}ai${C.reset} "<question>"               ask Claude  (ANTHROPIC_API_KEY)`,
  `  ${C.dim}types: node  quest  monster  npc  terrain${C.reset}`,
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
  if (!fn) die(`Unknown command "${cmd}". Run: wb help`);

  // Print synopsis before every command except 'help' (which has its own full text)
  if (cmd !== 'help') printSynopsis();

  try {
    await fn(pos, flags);
  } catch (e) {
    if (e.code === 'ECONNREFUSED') die(`Server not running at ${BASE}\n  Start: ./wbapi-toggle.sh start`);
    die(e.message || String(e));
  }
})();
