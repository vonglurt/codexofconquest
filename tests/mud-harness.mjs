#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com
// §WALK-5 Inc 3 — MUD multi-client harness.
//
// Spins a THROWAWAY wbapi-server (PORT env, default 13679 — never touches the
// dev server on 1367), starts K seeded sessions, opens an SSE stream per client,
// drives scripted move/say sequences, and asserts the three §WALK-5 properties
// from lab-report-walk5-mud-harness.md §5:
//
//   (a) co-presence delivery — chat / player_arrived reach co-present sessions
//       ONLY (same cell), exactly once, and never the wrong cell;
//   (b) instancing / no bleed — encounters are session-private: never delivered
//       over SSE, a pure function of the session's own seed (determinism), and
//       independent across seeds;
//   (c) social state — who / look reflect true co-presence.
//
// Pure HTTP + SSE, no Playwright. Run: `npm run test:mud` (or
// `MUD_HARNESS_PORT=… node tests/mud-harness.mjs`). Exit 0 if all pass, else 1.
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = parseInt(process.env.MUD_HARNESS_PORT || '13679');
const BASE = `http://127.0.0.1:${PORT}`;

// ── tiny assert harness ───────────────────────────────────────────────────────
const fails = [];
function check(cond, msg) {
  if (cond) console.log('  ✓ ' + msg);
  else { fails.push(msg); console.log('  ✗ ' + msg); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, ms = 2000, step = 25) {
  const start = Date.now();
  while (Date.now() - start < ms) { if (fn()) return true; await sleep(step); }
  return !!fn();
}

// ── HTTP helpers (all routes live under /api) ─────────────────────────────────
async function jpost(p, body) {
  const r = await fetch(BASE + '/api' + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}
async function jget(p) { return (await fetch(BASE + '/api' + p)).json(); }

// ── SSE client — parses `event:`/`data:` frames into client.events[] ──────────
function openSSE(sessionId) {
  const client = { id: sessionId, events: [], req: null };
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE}/api/session/events?sessionId=${sessionId}`, (res) => {
      res.setEncoding('utf8');
      let buf = '', evName = 'message';
      res.on('data', (chunk) => {
        buf += chunk;
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
          if (line.startsWith('event:')) evName = line.slice(6).trim();
          else if (line.startsWith('data:')) {
            const raw = line.slice(5).trim();
            let data; try { data = JSON.parse(raw); } catch { data = raw; }
            client.events.push({ event: evName, data });
            evName = 'message';
          }
          // blank line (frame end) / ':' keepalive → ignore
        }
      });
      resolve(client);
    });
    req.on('error', reject);
    client.req = req;
  });
}
const closeSSE = (c) => { try { c.req.destroy(); } catch {} };
// count delivered events of `type` whose data matches `pred` (excludes the
// initial 'connected' frame, which carries no event payload of interest).
const countEv = (c, type, pred = () => true) => c.events.filter((e) => e.event === type && pred(e.data)).length;

// ── server lifecycle ──────────────────────────────────────────────────────────
async function pingOk(ms = 400) {
  const ctl = AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined;
  try { const r = await fetch(BASE + '/api/ping', ctl ? { signal: ctl } : {}); return r.ok; } catch { return false; }
}
let server = null;
async function startServer() {
  if (await pingOk()) {
    console.error(`✗ port ${PORT} is already in use — set MUD_HARNESS_PORT to a free port.`);
    process.exit(1);
  }
  server = spawn('node', ['wbapi-server.js'], {
    cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  server.stderr.on('data', (d) => { stderr += d; });
  const up = await waitFor(() => server.exitCode === null, 500) && await (async () => {
    const start = Date.now();
    while (Date.now() - start < 8000) { if (await pingOk()) return true; await sleep(150); }
    return false;
  })();
  if (!up) { console.error(`✗ test server failed to start on ${PORT}\n${stderr}`); stopServer(); process.exit(1); }
}
function stopServer() { if (server && server.exitCode === null) { try { server.kill('SIGTERM'); } catch {} } }

// ── the harness run ───────────────────────────────────────────────────────────
const openClients = [];
async function main() {
  await startServer();

  // ════════ (a/c) co-presence at the hub ════════
  console.log('\n[A] co-presence chat + who/look at the hub');
  const alice = await jpost('/session/start', { name: 'Alice', seed: 1001 });
  const bob   = await jpost('/session/start', { name: 'Bob',   seed: 2002 });
  const cara  = await jpost('/session/start', { name: 'Cara',  seed: 3003 });
  check(alice.r === bob.r && alice.c === bob.c && bob.r === cara.r && bob.c === cara.c, 'all three spawn co-present at the hub');
  const sseA = await openSSE(alice.sessionId); openClients.push(sseA);
  const sseB = await openSSE(bob.sessionId);   openClients.push(sseB);
  const sseC = await openSSE(cara.sessionId);  openClients.push(sseC);
  await sleep(150); // let 'connected' frames land

  await jpost('/session/say', { sessionId: alice.sessionId, msg: 'hello-hub' });
  await waitFor(() => countEv(sseB, 'chat', (d) => d.msg === 'hello-hub') >= 1 && countEv(sseC, 'chat', (d) => d.msg === 'hello-hub') >= 1);
  await sleep(100); // give any (buggy) duplicate a chance to arrive before counting
  check(countEv(sseA, 'chat', (d) => d.msg === 'hello-hub') === 1, 'sender Alice receives her own chat exactly once (no double-send)');
  check(countEv(sseB, 'chat', (d) => d.msg === 'hello-hub') === 1, 'co-present Bob receives the chat exactly once');
  check(countEv(sseC, 'chat', (d) => d.msg === 'hello-hub') === 1, 'co-present Cara receives the chat exactly once');

  const who = await jget('/session/who');
  check(who.count === 3, 'who reports 3 active sessions');
  const lookA = await jget(`/session/look?sessionId=${alice.sessionId}`);
  const names = (lookA.players || []).map((p) => p.name).sort();
  check(JSON.stringify(names) === JSON.stringify(['Bob', 'Cara']), 'Alice look shows Bob + Cara co-present');

  // ════════ (a) move splits co-presence; player_arrived is cell-scoped ════════
  console.log('\n[B] move splits co-presence; player_arrived only to co-present');
  const bobMove = await jpost('/session/move', { sessionId: bob.sessionId, dir: 'E' }); // hub → BMA (10,198)
  check(bobMove.ok && bobMove.c === alice.c + 1, 'Bob steps E off the hub to the next cell');
  await sleep(150);
  check(countEv(sseA, 'player_arrived') === 0, 'Alice (hub) gets no player_arrived when Bob leaves (no -left event, and he arrives alone)');

  await jpost('/session/say', { sessionId: bob.sessionId, msg: 'slums-solo' });
  await sleep(200);
  check(countEv(sseB, 'chat', (d) => d.msg === 'slums-solo') === 1, 'Bob alone at BMA hears his own chat once');
  check(countEv(sseA, 'chat', (d) => d.msg === 'slums-solo') === 0, 'Alice (hub) does NOT hear Bob’s BMA chat');
  check(countEv(sseC, 'chat', (d) => d.msg === 'slums-solo') === 0, 'Cara (hub) does NOT hear Bob’s BMA chat');

  await jpost('/session/move', { sessionId: cara.sessionId, dir: 'E' }); // hub → BMA, now co-present with Bob
  await waitFor(() => countEv(sseB, 'player_arrived', (d) => d.name === 'Cara') >= 1);
  await sleep(100);
  check(countEv(sseB, 'player_arrived', (d) => d.name === 'Cara') === 1, 'Bob (at BMA) gets exactly one player_arrived naming Cara');
  check(countEv(sseA, 'player_arrived', (d) => d.name === 'Cara') === 0, 'Alice (hub) gets no player_arrived for Cara');

  // ════════ (b) instancing / no cross-session encounter bleed ════════
  console.log('\n[C] instanced encounters — session-private, seed-deterministic, no SSE bleed');
  const PATH = []; for (let i = 0; i < 30; i++) PATH.push('N', 'S'); // each N = an empty-cell roll, each S returns to the named hub
  const traceOf = async (id) => {
    const t = [];
    for (const dir of PATH) { const r = await jpost('/session/move', { sessionId: id, dir }); if (r.ok && r.encounter) t.push(`${r.r},${r.c}:${r.encounter.key}`); }
    return t;
  };
  const dora = await jpost('/session/start', { name: 'Dora', seed: 7 });
  const evan = await jpost('/session/start', { name: 'Evan', seed: 808 });
  const finn = await jpost('/session/start', { name: 'Finn', seed: 7 }); // same seed as Dora
  const sseD = await openSSE(dora.sessionId); openClients.push(sseD);
  const sseE = await openSSE(evan.sessionId); openClients.push(sseE);
  await sleep(100);
  const tD = await traceOf(dora.sessionId);
  const tE = await traceOf(evan.sessionId);
  const tF = await traceOf(finn.sessionId);
  await sleep(150);

  // no encounter is EVER broadcast over SSE (encounters are session-private)
  const encInSSE = openClients.some((c) => c.events.some((e) =>
    e.event === 'encounter' || (e.data && typeof e.data === 'object' && 'encounter' in e.data)));
  check(!encInSSE, 'no encounter is ever delivered over SSE (instanced, never shared)');
  // mechanism actually fires (else the divergence check is vacuous)
  check(tD.length > 0 || tE.length > 0, 'encounters fire in the instancing scenario');
  // determinism: same seed + same path ⇒ identical trace
  check(JSON.stringify(tF) === JSON.stringify(tD), 'same-seed session reproduces the encounter trace exactly (determinism)');
  // independence: different seeds ⇒ different traces (each is a pure fn of its own stream)
  check(JSON.stringify(tD) !== JSON.stringify(tE), 'different-seed sessions produce different traces (instanced, no shared cell state)');
  // bleed: Dora's monsters never surface in Evan's stream/trace and vice versa.
  // Both walk the same cells, so signatures are cell:monster — overlap would mean
  // an identical pick at an identical cell, which different seeds must not force.
  const overlap = tD.filter((x) => tE.includes(x));
  check(overlap.length < Math.max(tD.length, tE.length) || (tD.length === 0 && tE.length === 0),
    'Dora and Evan do not share an identical encounter trace (no cross-session bleed)');

  console.log(`\n  (encounters fired — Dora seed7: ${tD.length}, Evan seed808: ${tE.length}, Finn seed7: ${tF.length})`);

  // ── teardown ──
  openClients.forEach(closeSSE);
  await jpost('/session/end', { sessionId: alice.sessionId }).catch(() => {});
  await jpost('/session/end', { sessionId: bob.sessionId }).catch(() => {});
}

main()
  .catch((e) => { fails.push('harness threw: ' + (e && e.stack || e)); console.error(e); })
  .finally(async () => {
    openClients.forEach(closeSSE);
    stopServer();
    await sleep(150);
    console.log('\n' + '─'.repeat(60));
    if (fails.length) {
      console.error(`✗ MUD harness: ${fails.length} assertion(s) failed:`);
      for (const f of fails) console.error('   ✗ ' + f);
      process.exit(1);
    }
    console.log('✓ MUD harness: co-presence, cell-scoped broadcast, and instanced no-bleed encounters all hold.');
    process.exit(0);
  });
