#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02jg(b) — behavioural conformance for `GET /api/help[/{topic}]`.
//
// (a) `scripts/check-help-conformance.js` compares three documented tables against the
// constants beside them, without a server. It cannot see the defects that have nothing to
// compare against: an endpoint that has never been a route, an entity id no longer in the
// corpus, a topic the index names and the server does not have. Those are only visible by
// CALLING what the prose claims, which is what §DX-02jf did by hand over 45 paths.
//
// This harness does it as an instrument. It boots a THROWAWAY wbapi-server against a
// COPY of play.html (HELP_HARNESS_PORT, default 13671 — never the dev server on 1367,
// never the real game file), reads the help out of the running server, and asserts:
//
//   [help/topics]        every topic the index lists resolves to ITSELF, every topic the
//                        server has is listed, and a name no topic can be answers 404 —
//                        the control, without which the first two assert nothing.
//   [help/endpoints]     every concrete GET path any topic names answers < 400.
//   [export/collections] every collection the `export` topic documents exports 200.
//   [nonce/types]        every documented `type` value issues a nonce, and a value the
//                        help does not document is refused.
//
// The two instruments are not nested — each sees defects the other cannot, measured over
// six mutations of the real source. (a) alone catches a TTL five times short and a value
// dropped from the help's `type` list; (b) alone catches an endpoint that was never a
// route, an index entry naming a topic the server does not have, and an example naming an
// entity the corpus no longer holds; a collection dropped from `exportMap` is caught by
// both. In particular the "and nothing undocumented is accepted" direction belongs to (a),
// which reads `validTypes`: from outside, the accepted set cannot be enumerated, so this
// harness can only prove the validator refuses a value nobody documents.
//
// Every extractor reports when it matches nothing: a harness that cannot find the prose
// it checks must go red, not green (the §DX-02jg(a) rule, one surface further out).
//
// Reads only. No write endpoint is called, nothing is saved, and the scratch copy is
// removed on exit.
//
// Pure HTTP, no Playwright — `npm test` does not complete on a musl host (§DX-02ir) and
// 427 browser-free assertions already sit unread behind that (§DX-02jd), so an assertion
// filed there would be one more. Run: `npm run test:help` (or `--selftest`, which needs
// no server and drives the same check functions through a stub probe).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORT = parseInt(process.env.HELP_HARNESS_PORT || '13671');
const BASE = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── the one documented path that cannot answer, and why ──────────────────────
// The `import` topic is a walkthrough: step 6 fetches the chain of the quest step 5
// creates. Read end to end it is correct; replayed against an untouched corpus it 404s.
// The reason is named here rather than filtered by a pattern, and the harness asserts the
// exception is still NEEDED — a waiver that has quietly started passing is itself a
// finding, or the list becomes a place defects go to be forgotten.
const EXPECTED_404 = [
  { topic: 'import', path: '/api/quest/stn_01_act1/chain',
    why: 'the walkthrough creates stn_01_act1 one step earlier; it is correct as written and unreachable on an untouched corpus' },
];

// ── extractors ───────────────────────────────────────────────────────────────

// "  GET /api/help/overview        — what this API is and how it works"
export function docTopics(indexText) {
  const out = [];
  for (const l of indexText.split('\n')) {
    const m = /^\s*GET \/api\/help\/([a-z_]+)\b/.exec(l);
    if (m) out.push(m[1]);
  }
  return out;
}

// Every GET path the prose names, from both shapes it is written in:
//   "  GET /api/list/{type}"                       — the endpoint catalogues
//   "  curl http://localhost:1367/api/node/BK"     — the worked examples
// The help writes its origin three ways — an already-interpolated `http://localhost:PORT`,
// the walkthrough's `$SERVER`, the cheat sheet's `${b}` — and the harness answers on a host
// and port of its own, so the origin is STRIPPED rather than matched. A path carrying a
// {placeholder} or an [optional] segment is a form, not a call, and is not run; nor is a
// curl with an -X verb.
export function docGetPaths(text) {
  const seen = new Map();
  const add = (p, line) => { if (!seen.has(p)) seen.set(p, line.trim()); };
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\$SERVER\b/g, '').replace(/\$\{b\}/g, '').replace(/https?:\/\/[^\s/'"`]+/g, '');
    if (/\bcurl\b/.test(line)) {
      if (/-X\s*(POST|PUT|DELETE|PATCH)/.test(line)) continue;
      const m = /(\/api\/[^\s'"`|]*)/.exec(line);
      if (m) add(m[1], raw);
      continue;
    }
    for (const m of line.matchAll(/(?:^|\s)GET\s+(\/api\/[^\s'"`|,)]*)/g)) add(m[1], raw);
  }
  return [...seen].filter(([p]) => !/[{}\[\]]/.test(p)).map(([path, line]) => ({ path, line }));
}

// The COLLECTIONS block: "  node_map        — NODE_MAP object", to the first blank line.
export function docCollections(text) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => /^COLLECTIONS\s*$/.test(l));
  if (start < 0) return null;
  const out = [];
  for (const l of lines.slice(start + 1)) {
    if (!l.trim()) break;
    const m = /^ {2}([a-z_]+)\s+—/.exec(l);
    if (m) out.push(m[1]);
  }
  return out.length ? out : null;
}

// "  type: node | quest | monster | npc | snapshot"
export function docNonceTypes(text) {
  for (const l of text.split('\n')) {
    const m = /^\s*type:\s*([a-z_-]+(?:\s*\|\s*[a-z_-]+)+)\s*$/.exec(l);
    if (m) return m[1].split('|').map((s) => s.trim());
  }
  return null;
}

// ── the checks — pure over (topics, probe), so the selftest drives the real code ──
// `topics` is name → text. `probe(method, path, body)` → { status, json }.
export async function runChecks({ topics, liveTopicKeys, probe }) {
  const findings = [];
  const index = topics.index;
  if (typeof index !== 'string') return ['[source] the server served no `index` help topic — the harness cannot read the surface it checks'];

  // [help/topics]
  const listed = docTopics(index);
  if (!listed.length) {
    findings.push('[help/topics] the index no longer lists its topics as `GET /api/help/<name>` — the harness cannot find the table it checks');
  } else {
    for (const t of listed) {
      const r = await probe('GET', `/api/help/${t}?format=json`);
      if (r.status !== 200) findings.push(`[help/topics] the index lists \`${t}\`, and GET /api/help/${t} answers ${r.status} — the server has no such topic`);
    }
    for (const k of liveTopicKeys) {
      if (k !== 'index' && !listed.includes(k)) findings.push(`[help/topics] the server serves \`${k}\`, which the index does not list — a topic nothing points at`);
    }
  }
  // The control. Both checks above read a status, so both are vacuous unless a name that
  // cannot be a topic is refused (§DX-02jk).
  const bogus = 'not_a_help_topic';
  const rb = await probe('GET', `/api/help/${bogus}?format=json`);
  if (rb.status < 400) findings.push(`[help/topics] GET /api/help/${bogus} answers ${rb.status}, so an unknown topic is indistinguishable from a real one and the checks above assert nothing`);

  // [help/endpoints]
  const waived = new Set(EXPECTED_404.map((e) => `${e.topic} ${e.path}`));
  const hit = new Set();
  let examples = 0;
  for (const [name, text] of Object.entries(topics)) {
    for (const { path: p, line } of docGetPaths(text)) {
      const key = `${name} ${p}`;
      const r = await probe('GET', p);
      if (name !== 'index') examples++;
      if (waived.has(key)) { if (r.status < 400) hit.add(key); continue; }
      if (r.status >= 400) findings.push(`[help/endpoints] help/${name} names \`GET ${p}\`, which answers ${r.status} — "${line}"`);
    }
  }
  // The index's own TOPICS lines are GET paths and would satisfy a bare count, so the
  // vacuity guard asks for what the harness exists to run: the worked examples.
  if (!examples) findings.push('[help/endpoints] no topic outside the index named a single concrete GET path — the harness cannot pass by failing to find its own work');
  for (const e of EXPECTED_404) {
    if (hit.has(`${e.topic} ${e.path}`)) findings.push(`[help/endpoints] \`GET ${e.path}\` is waived in EXPECTED_404 and now answers — remove the waiver, or it becomes a place a real defect can hide`);
  }

  // [export/collections]
  const exp = topics.export;
  const cols = exp ? docCollections(exp) : null;
  if (!cols) findings.push('[export/collections] the `export` topic no longer carries a COLLECTIONS block in the expected form');
  else for (const c of cols) {
    const r = await probe('GET', `/api/export/${c}?format=json`);
    if (r.status !== 200) findings.push(`[export/collections] the help documents the collection \`${c}\`, which GET /api/export/${c} answers ${r.status} for`);
  }

  // [nonce/types]
  const nonce = topics.nonce;
  const types = nonce ? docNonceTypes(nonce) : null;
  if (!types) findings.push('[nonce/types] the `nonce` topic no longer lists its `type` values in the expected form');
  else {
    for (const t of types) {
      const r = await probe('POST', '/api/nonce', { type: t, id: 'HARNESS_PROBE' });
      if (r.status !== 200 || !(r.json && r.json.nonce)) findings.push(`[nonce/types] the help offers \`type: ${t}\`, and POST /api/nonce answers ${r.status} for it`);
    }
    const bogus = 'not_a_documented_type';
    const r = await probe('POST', '/api/nonce', { type: bogus, id: 'HARNESS_PROBE' });
    if (r.status < 400) findings.push(`[nonce/types] POST /api/nonce accepts \`${bogus}\`, which no help topic documents — the documented list is not the accepted list`);
  }

  return findings;
}

// ── selftest — no server; the same checks, driven through a stub probe ────────
async function selftest() {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const B = 'http://127.0.0.1:1';
  const INDEX_TITLE = 'WBAPI Help Index';

  const stubTopics = (over = {}) => ({
    index: [
      'TOPICS',
      '  GET /api/help/nonce           — how write-protection and nonces work',
      '  GET /api/help/export          — exporting arrays',
      '', 'Server: x',
    ].join('\n'),
    nonce: ['  type: node | quest', `  curl ${B}/api/ping`].join('\n'),
    export: ['COLLECTIONS', '  node_map        — NODE_MAP object', '  quest_db        — QUEST_DB array', '', 'FORMATS'].join('\n'),
    ...over,
  });

  // Routes the stub server "has". Anything else is a 404, as the real one would be.
  const stubProbe = (routes) => async (method, p, body) => {
    const clean = p.split('?')[0];
    if (method === 'POST' && clean === '/api/nonce')
      return routes.nonceTypes.includes(body.type) ? { status: 200, json: { nonce: 'n' } } : { status: 400, json: { ok: false } };
    if (clean.startsWith('/api/help/')) {
      const t = clean.slice('/api/help/'.length);
      if (routes.topics.includes(t)) return { status: 200, json: { topic: t, title: `Topic ${t}`, topics: routes.topics } };
      // `helpFallback` models a server that answers 200 with the index under any name at all.
      return routes.helpFallback
        ? { status: 200, json: { topic: t, title: INDEX_TITLE, topics: routes.topics } }
        : { status: 404, json: { ok: false, error: `unknown help topic '${t}'`, topic: t, topics: routes.topics } };
    }
    return routes.get.includes(clean) ? { status: 200, json: {} } : { status: 404, json: {} };
  };
  const stubRoutes = (over = {}) => ({
    topics: ['nonce', 'export'],
    get: ['/api/ping', '/api/export/node_map', '/api/export/quest_db'],
    nonceTypes: ['node', 'quest'],
    helpFallback: false,
    ...over,
  });
  const run = (t = {}, r = {}, keys = ['index', 'nonce', 'export']) =>
    runChecks({ topics: stubTopics(t), liveTopicKeys: keys, probe: stubProbe(stubRoutes(r)) });

  ok((await run()).length === 0, 'a help whose every claim answers produces no findings');

  ok((await run({ index: stubTopics().index.replace('/api/help/export', '/api/help/exports') }))
    .some((f) => f.includes('no such topic') && f.includes('exports') && f.includes('404')),
    'an index entry naming a topic the server does not have is caught by its status');
  ok((await run({}, { helpFallback: true })).some((f) => f.includes('not_a_help_topic') && f.includes('assert nothing')),
    'a server that answers 200 for any name at all is caught by the control, whatever the index says');
  ok((await run({ index: stubTopics().index.replace('/api/help/export', '/api/help/exports') }, { helpFallback: true }))
    .every((f) => !f.includes('`exports`')),
    'and that server hides the wrong index entry from the status check — which is why the control is the assertion, not a spare');
  ok((await run({}, {}, ['index', 'nonce', 'export', 'wizard'])).some((f) => f.includes('`wizard`') && f.includes('does not list')),
    'a topic the server serves and the index omits is caught — the check runs in both directions');

  ok((await run({ nonce: `  type: node | quest\n  curl ${B}/api/read/node/CY` })).some((f) => f.includes('/api/read/node/CY') && f.includes('404')),
    'an endpoint that has never been a route is caught — §DX-02jg(b)\'s stated verify condition');
  ok((await run({ nonce: `  type: node | quest\n  e.g.  curl ${B}/api/quest/gone_quest` })).some((f) => f.includes('/api/quest/gone_quest')),
    'an example naming an entity the corpus no longer holds is caught');
  ok((await run({ nonce: `  type: node | quest\n  GET /api/no-such-route` })).some((f) => f.includes('/api/no-such-route')),
    'a bare `GET /api/...` catalogue line is checked, not only the curl examples');
  ok((await run({ nonce: '  type: node | quest' })).some((f) => f.includes('cannot pass by failing to find its own work')),
    'a help naming no concrete GET path at all goes RED, not silently green');

  ok((await run({ export: 'COLLECTIONS\n  node_map        — NODE_MAP object\n  gone_map        — GONE object\n' }))
    .some((f) => f.includes('`gone_map`') && f.includes('404')),
    'a documented collection the server does not export is caught');
  ok((await run({ export: 'FORMATS\n  json' })).some((f) => f.includes('no longer carries a COLLECTIONS block')),
    'a COLLECTIONS block the extractor cannot find goes RED, not silently green');

  ok((await run({ nonce: '  type: node | quest | terrain' })).some((f) => f.includes('type: terrain')),
    'a documented nonce type the server refuses is caught');
  ok((await run({}, { nonceTypes: ['node', 'quest', 'not_a_documented_type'] })).some((f) => f.includes('not the accepted list')),
    'a type the server accepts and no topic documents is caught — the enum is checked in both directions');
  ok((await run({ nonce: '  kinds are node and quest' })).some((f) => f.includes('no longer lists its `type` values')),
    'a `type` line the extractor cannot match goes RED, not silently green');

  const waiver = EXPECTED_404[0];
  ok((await run({ [waiver.topic]: `  curl ${B}${waiver.path}` }, {}, ['index', 'nonce', 'export', waiver.topic])).every((f) => !f.includes(waiver.path)),
    'the one waived path does not fail the run while it is still unreachable');
  ok((await run({ [waiver.topic]: `  curl ${B}${waiver.path}` }, { get: ['/api/ping', '/api/export/node_map', '/api/export/quest_db', waiver.path] }, ['index', 'nonce', 'export', waiver.topic]))
    .some((f) => f.includes('remove the waiver')),
    'a waived path that has started answering is itself a finding — the waiver cannot rot');

  ok(docGetPaths(`  curl -XPOST ${B}/api/quest -d '{}'`).length === 0, 'a curl with an -X verb is not run as a GET');
  ok(docGetPaths('  GET /api/coords/near/{startingNode}?radius=8').length === 0, 'a path carrying a {placeholder} is a form, not a call, and is not run');
  ok(docGetPaths('SERVER=x\ncurl $SERVER/api/audit').some((e) => e.path === '/api/audit'), '$SERVER is resolved to the base the walkthrough sets');

  if (fail) { console.log(`\n✗ help-behaviour selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ help-behaviour selftest: all ${pass} checks pass`);
  process.exit(0);
}

// ── the live run ─────────────────────────────────────────────────────────────
async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-help-'));
  const scratch = path.join(dir, 'play.html');
  fs.copyFileSync(path.join(ROOT, 'play.html'), scratch);
  const proc = spawn('node', [path.join(ROOT, 'src', 'js', 'wbapi-server.js')], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), CODEXOFCONQUEST_FILE: scratch, PEERS_CACHE_FILE: path.join(dir, 'peers.json') },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  proc.stderr.on('data', (d) => { stderr += d; });
  const done = (code) => { try { proc.kill('SIGTERM'); } catch {} fs.rmSync(dir, { recursive: true, force: true }); process.exit(code); };

  let up = false;
  for (let i = 0; i < 100 && proc.exitCode === null; i++) {
    try { if ((await fetch(`${BASE}/api/ping`)).ok) { up = true; break; } } catch {}
    await sleep(150);
  }
  if (!up) { console.error(`✗ help-behaviour: the throwaway wbapi-server did not answer on :${PORT} — set HELP_HARNESS_PORT to a free port.\n${stderr}`); done(1); }

  const probe = async (method, p, body) => {
    const r = await fetch(BASE + p, method === 'GET' ? {} : {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    let json = null;
    try { json = await r.json(); } catch {}
    return { status: r.status, json };
  };

  const idx = await probe('GET', '/api/help?format=json');
  if (idx.status !== 200 || !idx.json) { console.error(`✗ help-behaviour: GET /api/help answered ${idx.status}`); done(1); }
  const liveTopicKeys = idx.json.topics || [];
  const topics = { index: idx.json.text };
  for (const t of new Set([...liveTopicKeys, ...docTopics(idx.json.text)])) {
    if (t === 'index') continue;
    const r = await probe('GET', `/api/help/${t}?format=json`);
    if (r.status === 200 && r.json) topics[t] = r.json.text || '';
  }

  const findings = await runChecks({ topics, liveTopicKeys, probe });
  const calls = Object.values(topics).flatMap((text) => docGetPaths(text).map((e) => e.path));
  console.log(`  ${Object.keys(topics).length} topics read from the running server · ${calls.length} documented GET calls over ${new Set(calls).size} distinct paths`);
  if (findings.length) {
    findings.forEach((f) => console.log('  ✗ ' + f));
    console.log(`\n✗ help-behaviour: ${findings.length} finding(s)`);
    console.log('  `GET /api/help` is documentation the server never executes. Correct the prose in');
    console.log('  wbapi-server.js\'s HELP object, or the route it names, so calling it works (§DX-02jg).');
    done(1);
  }
  console.log('✓ §DX-02jg help behaviour: every topic the index names resolves to itself, every documented GET path answers, every documented collection exports, and every documented nonce `type` issues a nonce while an undocumented one is refused.');
  done(0);
}

// Only when run as a command: the extractors above are importable on their own.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) await selftest();
  else await main();
}
