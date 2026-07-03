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
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const requireCjs = createRequire(import.meta.url);   // §NAV-01f: rooms.js + wbapi-core are CJS

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

// ── HTTP helpers (all routes live under /api; base defaults to the main server)─
async function jpost(p, body, base = BASE) {
  const r = await fetch(base + '/api' + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}
async function jget(p, base = BASE) { return (await fetch(base + '/api' + p)).json(); }
async function jput(p, body, base = BASE) {
  const r = await fetch(base + '/api' + p, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}

// ── SSE client — parses `event:`/`data:` frames into client.events[] ──────────
function openSSE(sessionId, base = BASE) {
  const client = { id: sessionId, events: [], req: null, closed: false };
  return new Promise((resolve, reject) => {
    const req = http.get(`${base}/api/session/events?sessionId=${sessionId}`, (res) => {
      res.setEncoding('utf8');
      res.on('end', () => { client.closed = true; });
      res.on('close', () => { client.closed = true; });
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

// ── server lifecycle (factory — supports >1 throwaway server per run) ──────────
async function pingOk(base, ms = 400) {
  const ctl = AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined;
  try { const r = await fetch(base + '/api/ping', ctl ? { signal: ctl } : {}); return r.ok; } catch { return false; }
}
const servers = [];
async function startServer(port, extraEnv = {}, extraArgs = []) {
  const base = `http://127.0.0.1:${port}`;
  if (await pingOk(base)) {
    console.error(`✗ port ${port} is already in use — set MUD_HARNESS_PORT to a free port.`);
    stopAllServers(); process.exit(1);
  }
  const proc = spawn('node', ['wbapi-server.js', ...extraArgs], {
    cwd: ROOT, env: { ...process.env, PORT: String(port), ...extraEnv }, stdio: ['ignore', 'ignore', 'pipe'],
  });
  const srv = { port, base, proc, stderr: '' };
  servers.push(srv);
  proc.stderr.on('data', (d) => { srv.stderr += d; });
  const up = await waitFor(() => proc.exitCode === null, 500) && await (async () => {
    const start = Date.now();
    while (Date.now() - start < 8000) { if (await pingOk(base)) return true; await sleep(150); }
    return false;
  })();
  if (!up) { console.error(`✗ test server failed to start on ${port}\n${srv.stderr}`); stopAllServers(); process.exit(1); }
  return srv;
}
function stopAllServers() {
  for (const s of servers) if (s.proc && s.proc.exitCode === null) { try { s.proc.kill('SIGTERM'); } catch {} }
}

// ── the harness run ───────────────────────────────────────────────────────────
const openClients = [];
async function main() {
  await startServer(PORT);

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

  // ════════ (a3) §MESH-01a pos beacon — display-only, validated, rolls nothing ════════
  // Browser clients report position via /session/pos (they roll their own
  // encounters locally); the beacon must validate passability, broadcast
  // player_left + player_arrived, and never touch s.encounter.
  console.log('\n[B2] §MESH-01a position beacon (browser-client presence)');
  const aPos = await jpost('/session/pos', { sessionId: alice.sessionId, r: alice.r, c: alice.c + 1 }); // hub → BMA (Bob + Cara there)
  check(aPos.ok === true && aPos.moved === true, 'pos accepts a passable cell and reports moved');
  check((aPos.players || []).map((p) => p.name).sort().join(',') === 'Bob,Cara', 'pos response lists Bob + Cara co-present');
  check(aPos.encounter == null, 'pos response carries no encounter (beacon rolls nothing)');
  await waitFor(() => countEv(sseB, 'player_arrived', (d) => d.name === 'Alice') >= 1);
  await sleep(100);
  check(countEv(sseB, 'player_arrived', (d) => d.name === 'Alice') === 1, 'Bob gets exactly one player_arrived for the beaconed Alice');
  const aBack = await jpost('/session/pos', { sessionId: alice.sessionId, r: alice.r, c: alice.c });     // back to the hub
  check(aBack.ok === true && aBack.moved === true, 'pos moves Alice back to the hub');
  await waitFor(() => countEv(sseB, 'player_left', (d) => d.name === 'Alice') >= 1);
  await sleep(100);
  check(countEv(sseB, 'player_left', (d) => d.name === 'Alice') === 1, 'Bob gets exactly one player_left when Alice beacons away');
  const aStay = await jpost('/session/pos', { sessionId: alice.sessionId, r: alice.r, c: alice.c });     // unchanged cell
  check(aStay.ok === true && aStay.moved === false, 'same-cell beacon reports moved:false (idempotent re-render ping)');
  const seaPos = await jpost('/session/pos', { sessionId: alice.sessionId, r: alice.r + 1, c: alice.c }); // S of hub = sea
  check(seaPos.ok === false && seaPos.reason === 'sea', 'pos rejects a sea cell (no ghosts in the ocean)');
  const oobPos = await jpost('/session/pos', { sessionId: alice.sessionId, r: -3, c: 5 });
  check(oobPos.ok === false && oobPos.reason === 'oob', 'pos rejects an off-band row');
  const whoPos = await jget('/session/who');
  const aliceW = whoPos.sessions.find((x) => x.name === 'Alice');
  check(aliceW.r === alice.r && aliceW.c === alice.c, 'rejected beacons leave the session position unchanged');
  check(aliceW.encounter == null, 'pos never sets an encounter (display-only beacon)');
  const pete = await jpost('/session/start', { name: 'Pete', seed: 5005 });          // spawns at the hub, where Alice is
  await waitFor(() => countEv(sseA, 'player_arrived', (d) => d.name === 'Pete') >= 1);
  await sleep(100);
  check(countEv(sseA, 'player_arrived', (d) => d.name === 'Pete') === 1, 'session/start announces the newcomer to players already at the spawn cell');
  await jpost('/session/end', { sessionId: pete.sessionId });

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

  // ════════ (d) idle session past SESSION_TTL is pruned + its SSE closed ════════
  // A SECOND throwaway server with a short SESSION_TTL_MS (env override that is
  // inert in every real deployment) so the 30-min prune path runs in ms. We keep
  // a "Warm" session alive with periodic look()s and leave "Ghost" idle, then
  // trigger the sweep (any /session/* request prunes first) and assert that only
  // the idle one is dropped — and that its SSE stream was server-closed.
  console.log('\n[D] idle session past SESSION_TTL is pruned + its SSE closed');
  const TTL_MS = 700;
  const ttl = await startServer(PORT + 1, { SESSION_TTL_MS: String(TTL_MS) });
  const ghost = await jpost('/session/start', { name: 'Ghost', seed: 11 }, ttl.base);
  const warm  = await jpost('/session/start', { name: 'Warm',  seed: 22 }, ttl.base);
  const sseG = await openSSE(ghost.sessionId, ttl.base); openClients.push(sseG);
  await sleep(100);
  check((await jget('/session/who', ttl.base)).count === 2, 'both sessions present before TTL elapses');
  check(sseG.closed === false, 'Ghost SSE is open before TTL elapses');

  // Keep Warm warm across > TTL of wall-clock; never touch Ghost.
  const warmTouches = 4, warmStep = Math.ceil((TTL_MS * 1.6) / warmTouches);
  for (let i = 0; i < warmTouches; i++) {
    await sleep(warmStep);
    await jget(`/session/look?sessionId=${warm.sessionId}`, ttl.base); // refreshes Warm.lastSeen + prunes stale
  }
  // one more pruning request after the dust settles, then assert
  const whoAfter = await jget('/session/who', ttl.base);
  const survivors = (whoAfter.sessions || whoAfter.players || []).map((p) => p.name);
  await waitFor(() => sseG.closed, 1000);
  check(whoAfter.count === 1, 'after idle TTL, exactly one session survives');
  check(survivors.includes('Warm') && !survivors.includes('Ghost'), 'Warm (kept active) survives; Ghost (idle) is pruned');
  check(sseG.closed === true, 'pruned Ghost’s SSE stream was closed by the server');
  const ghostLook = await jget(`/session/look?sessionId=${ghost.sessionId}`, ttl.base);
  check(ghostLook.ok === false, 'pruned Ghost session is gone (look 404s)');

  // ════════ (e) §MESH-01 b/c — manifest identity + 2-server gossip mesh ════════
  // Two servers over the SAME game file gossip presence (single-writer records,
  // version-vector dedup, snapshot anti-entropy); an incompatible-worldHash
  // server never merges; an allowlist ACL refuses even a compatible peer.
  console.log('\n[E] §MESH-01 b/c — manifest identity + gossip mesh');
  const tmp = os.tmpdir();
  const mkEnv = (port, sid, extra = {}) => ({
    MESH_SERVER_ID: sid, ADVERTISE_ADDR: `localhost:${port}`, MESH_GOSSIP_MS: '120',
    PEERS_CACHE_FILE: path.join(tmp, `r2h-peers-${port}.json`), ...extra,
  });
  const mA = await startServer(PORT + 2, mkEnv(PORT + 2, 'a'.repeat(32)));
  const mB = await startServer(PORT + 3, mkEnv(PORT + 3, 'b'.repeat(32), { MESH_PEERS: `localhost:${PORT + 2}` }));

  const manA = await jget('/manifest', mA.base);
  const manB = await jget('/manifest', mB.base);
  check(manA.ok === true && /^[0-9a-f]{16}$/.test(manA.worldHash), 'manifest exposes a 16-hex worldHash');
  check(Object.keys(manA.parts || {}).length === 8 && !Object.values(manA.parts).includes('missing'),
    'manifest hashes all 8 data collections (nodes/coords/sea/lanes/roads/quests/monsters/world)');
  check(manA.engineVer !== 'unversioned' && manA.engineVer === manB.engineVer && manA.worldHash === manB.worldHash,
    'same game file ⇒ identical (engineVer, worldHash) — ENGINE_VER parsed from the HTML');

  const ann = await jpost('/session/start', { name: 'Ann', seed: 41 }, mA.base);
  const sseAnn = await openSSE(ann.sessionId, mA.base); openClients.push(sseAnn);
  await sleep(150);
  const ben = await jpost('/session/start', { name: 'Ben', seed: 42 }, mB.base);

  let benSeen = false;
  for (let i = 0; i < 40 && !benSeen; i++) {
    await sleep(150);
    benSeen = (((await jget(`/session/look?sessionId=${ann.sessionId}`, mA.base)).players) || []).some((p) => p.name === 'Ben' && p.server);
  }
  check(benSeen, 'Ann (server A) sees Ben (server B) co-present at the hub — gossip replica in look');
  const lookBen = await jget(`/session/look?sessionId=${ben.sessionId}`, mB.base);
  check((lookBen.players || []).some((p) => p.name === 'Ann' && p.server), 'Ben (server B) sees Ann (server A) — symmetric');
  check((((await jget('/session/who', mA.base)).remotes) || []).some((p) => p.name === 'Ben'), 'who on A lists Ben as a remote replica');
  await sleep(700);   // several extra gossip rounds — every replay must be deduped
  check(countEv(sseAnn, 'player_arrived', (d) => d.name === 'Ben' && d.remote === true) === 1,
    'Ann hears Ben arrive over SSE exactly once (version-vector dedup across rounds)');

  await jpost('/session/say', { sessionId: ben.sessionId, msg: 'cross-server-hello' }, mB.base);
  await waitFor(() => countEv(sseAnn, 'chat', (d) => d.msg === 'cross-server-hello') >= 1, 4000, 100);
  await sleep(600);
  check(countEv(sseAnn, 'chat', (d) => d.msg === 'cross-server-hello') === 1,
    'cross-server chat reaches Ann exactly once (deduped across gossip rounds)');

  await jpost('/session/pos', { sessionId: ben.sessionId, r: ben.r, c: ben.c + 1 }, mB.base);
  await waitFor(() => countEv(sseAnn, 'player_left', (d) => d.name === 'Ben') >= 1, 4000, 100);
  await sleep(400);
  check(countEv(sseAnn, 'player_left', (d) => d.name === 'Ben') === 1, 'Ann hears Ben leave the hub exactly once (cross-server pos beacon)');
  let benGone = false;
  for (let i = 0; i < 20 && !benGone; i++) {
    await sleep(150);
    benGone = !(((await jget(`/session/look?sessionId=${ann.sessionId}`, mA.base)).players) || []).some((p) => p.name === 'Ben');
  }
  check(benGone, 'snapshot anti-entropy moves Ben off the hub in Ann’s look');

  // Incompatible world: overridden worldHash (harness-only env) never merges.
  const mC = await startServer(PORT + 4, mkEnv(PORT + 4, 'c'.repeat(32), {
    MESH_PEERS: `localhost:${PORT + 2}`, MESH_WORLDHASH_OVERRIDE: 'deadbeefdeadbeef',
  }));
  await jpost('/session/start', { name: 'Carl', seed: 43 }, mC.base);
  await sleep(800);
  check(!(((await jget('/session/who', mA.base)).remotes) || []).some((p) => p.name === 'Carl'),
    'incompatible worldHash never syncs — Carl stays invisible on A');
  const gBad = await fetch(mA.base + '/api/mesh/gossip', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serverId: 'c'.repeat(32), proto: manA.proto, engineVer: manA.engineVer, worldHash: 'deadbeefdeadbeef' }),
  });
  check(gBad.status === 409, 'gossip ingress refuses a mismatched worldHash with 409');

  // ACL: allowlist-mode server refuses even a compatible, unlisted peer.
  const aclPath = path.join(tmp, `r2h-acl-${PORT}.json`);
  fs.writeFileSync(aclPath, JSON.stringify({ mode: 'allowlist', allowServerIds: [] }));
  const mD = await startServer(PORT + 5, mkEnv(PORT + 5, 'd'.repeat(32), { MESH_ACL_FILE: aclPath }));
  const gAcl = await fetch(mD.base + '/api/mesh/gossip', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serverId: 'a'.repeat(32), proto: manA.proto, engineVer: manA.engineVer, worldHash: manA.worldHash }),
  });
  check(gAcl.status === 403, 'allowlist-mode ACL refuses an unlisted (compatible) peer with 403');

  // ════════ (f) §MESH-01d — tracker discovery + world grouping + bootstrap URL ════════
  console.log('\n[F] §MESH-01d — tracker rendezvous, compat grouping, BOOTSTRAP_URLS');
  const trk = await startServer(PORT + 6, { TRACKER_MODE: '1', MESH_SERVER_ID: 'e'.repeat(32), PEERS_CACHE_FILE: path.join(tmp, `r2h-peers-${PORT + 6}.json`) });
  check((await jget('/ping', trk.base)).ok === true, 'tracker answers /api/ping');
  check((await jget('/session/who', trk.base)).ok === false, 'tracker-mode refuses non-tracker routes (rendezvous only, never a relay)');

  const mE = await startServer(PORT + 7, mkEnv(PORT + 7, 'f'.repeat(32), { TRACKER_URL: trk.base, MESH_ANNOUNCE_MS: '150' }));
  const mF = await startServer(PORT + 8, mkEnv(PORT + 8, '9'.repeat(32), { TRACKER_URL: trk.base, MESH_ANNOUNCE_MS: '150' }));
  await jpost('/session/start', { name: 'Eve', seed: 51 }, mE.base);
  let eveSeen = false;
  for (let i = 0; i < 40 && !eveSeen; i++) {
    await sleep(200);
    eveSeen = (((await jget('/session/who', mF.base)).remotes) || []).some((p) => p.name === 'Eve');
  }
  check(eveSeen, 'two strangers sharing only a tracker URL discover each other and sync (Eve visible on F)');
  check((await jget(`/tracker/peers?wh=${manA.worldHash}`, trk.base)).count >= 2, 'tracker lists both announced servers in the world group');
  const txt = await (await fetch(trk.base + `/api/tracker/peers?wh=${manA.worldHash}&format=txt`)).text();
  check(txt.includes(`localhost:${PORT + 7}`), 'tracker emits the peers.txt bootstrap format (format=txt — the gist backup source)');

  await startServer(PORT + 9, mkEnv(PORT + 9, '8'.repeat(32), { TRACKER_URL: trk.base, MESH_ANNOUNCE_MS: '150', MESH_WORLDHASH_OVERRIDE: 'deadbeefdeadbeef' }));
  await sleep(700);
  const tpReal = await jget(`/tracker/peers?wh=${manA.worldHash}`, trk.base);
  check(!(tpReal.servers || []).some((s) => s.worldHash === 'deadbeefdeadbeef'), 'world grouping: the incompatible server never appears in the real-world group');
  check((await jget('/tracker/peers?wh=deadbeefdeadbeef', trk.base)).count === 1, 'the incompatible server is tracked in its OWN world group (segregated, not dropped)');

  const mH = await startServer(PORT + 10, mkEnv(PORT + 10, '7'.repeat(32), {
    BOOTSTRAP_URLS: `${trk.base}/api/tracker/peers?wh=${manA.worldHash}&format=txt`,
  }));
  let eveSeenH = false;
  for (let i = 0; i < 40 && !eveSeenH; i++) {
    await sleep(200);
    eveSeenH = (((await jget('/session/who', mH.base)).remotes) || []).some((p) => p.name === 'Eve');
  }
  check(eveSeenH, 'a plain text file over HTTP alone bootstraps a stranger into the mesh (BOOTSTRAP_URLS gist-style backup)');

  // ════════ (g) §MESH-01d2 — tracker federation ════════
  // Server Ida announces ONLY to tracker A; server J announces ONLY to tracker
  // B, which federates with A. J must still discover Ida — proof that manually
  // connecting two trackers implicitly shares both server lists.
  console.log('\n[G] §MESH-01d2 — tracker federation (announce tables merge)');
  const trkA2 = await startServer(PORT + 11, { TRACKER_MODE: '1', MESH_SERVER_ID: '6'.repeat(32), MESH_ANNOUNCE_MS: '150', PEERS_CACHE_FILE: path.join(tmp, `r2h-peers-${PORT + 11}.json`) });
  const trkB2 = await startServer(PORT + 12, { TRACKER_MODE: '1', MESH_SERVER_ID: '5'.repeat(32), MESH_ANNOUNCE_MS: '150', TRACKER_PEERS: trkA2.base, PEERS_CACHE_FILE: path.join(tmp, `r2h-peers-${PORT + 12}.json`) });
  const mI = await startServer(PORT + 13, mkEnv(PORT + 13, '4'.repeat(32), { TRACKER_URL: trkA2.base, MESH_ANNOUNCE_MS: '150' }));
  const mJ = await startServer(PORT + 14, mkEnv(PORT + 14, '3'.repeat(32), { TRACKER_URL: trkB2.base, MESH_ANNOUNCE_MS: '150' }));
  await jpost('/session/start', { name: 'Ida', seed: 61 }, mI.base);
  let idaSeen = false;
  for (let i = 0; i < 50 && !idaSeen; i++) {
    await sleep(200);
    idaSeen = (((await jget('/session/who', mJ.base)).remotes) || []).some((p) => p.name === 'Ida');
  }
  check(idaSeen, 'federated trackers: a server announced only to tracker A is discovered via tracker B (Ida visible on J)');
  check((await jget(`/tracker/peers?wh=${manA.worldHash}`, trkB2.base)).count >= 2,
    'tracker B holds both servers in its announce table after the federation merge');
  const stB = await jget('/mesh/status', trkB2.base);
  check((stB.traffic || []).some((t) => t.kind === 'federate' && t.ok), 'federation packets appear in tracker B’s information-passed log');

  // ── §MESH-01d3 — world download endpoint ──
  const dl = await fetch(mI.base + '/api/world/download');
  check(dl.status === 200 && (dl.headers.get('content-type') || '').includes('text/html')
    && dl.headers.get('x-r2h-worldhash') === manA.worldHash
    && /^attachment; filename="world-/.test(dl.headers.get('content-disposition') || ''),
    'world download serves the game file with identity headers + attachment filename');
  const dlTxt = await dl.text();
  check(dlTxt.includes("const ENGINE_VER = '") && dlTxt.length > 1_000_000, 'downloaded world is the full single-file game');
  check((await fetch(trkA2.base + '/api/world/download')).status === 410, 'tracker-mode refuses world download (rendezvous only, never a relay)');

  // ════════ (h) §MESH-01-FU 1 — LAN/WAN reachability ════════
  console.log('\n[H] §MESH-01-FU 1 — --bind/--advertise flags + loopback reachability warnings');
  // The main harness server has no peers/trackers configured: a solo dev
  // server must boot warning-free (loopback is the CORRECT default there).
  check((((await jget('/mesh/status')).reachability || {}).warnings || []).length === 0,
    'solo server (no peers/trackers configured) reports zero reachability warnings');
  // mB is the canonical misconfig: peers configured, loopback bind, localhost advertise.
  const stMisconfig = await jget('/mesh/status', mB.base);
  check((stMisconfig.reachability.warnings || []).length === 2,
    'peers + loopback bind + localhost advertise → both warnings (bind AND advertise)');
  // Flags: ADVERTISE_ADDR:'' forces the env fallback so --advertise is what's read.
  const mK = await startServer(PORT + 15,
    mkEnv(PORT + 15, '2'.repeat(32), { ADVERTISE_ADDR: '', MESH_PEERS: `localhost:${PORT + 2}` }),
    ['--bind', '127.0.0.1', '--advertise', `10.0.0.5:${PORT + 15}`]);
  const stK = await jget('/mesh/status', mK.base);
  check(stK.addr === `10.0.0.5:${PORT + 15}` && stK.reachability.advertise === stK.addr,
    '--advertise flag is honored (gossip/announce hand out the LAN addr)');
  check(stK.reachability.bind === '127.0.0.1'
    && (stK.reachability.warnings || []).length === 1 && /loopback/.test(stK.reachability.warnings[0]),
    'LAN advertise + loopback --bind → exactly one warning (bind), none for the advertise addr');
  await waitFor(() => /MESH REACHABILITY/.test(mK.stderr), 2000);
  check(/MESH REACHABILITY/.test(mK.stderr), 'the reachability warning is printed loudly at startup');

  // ════════ (i) §MESH-01-FU 2 — world name/tag + server-browser data ════════
  console.log('\n[I] §MESH-01-FU 2 — WORLD_NAME tag + tracker server-browser rows');
  const manMain = await jget('/manifest');
  check(manMain.worldName === 'Roll2Hit'
    && manMain.worldTag === 'Roll2Hit-' + manMain.worldHash.slice(0, 5),
    'manifest parses WORLD_NAME from the game file and derives worldTag <name>-<hash5>');
  // A named server announces → the tracker row carries name + worldName + worldTag.
  await startServer(PORT + 16, mkEnv(PORT + 16, '1'.repeat(32),
    { TRACKER_URL: trk.base, MESH_ANNOUNCE_MS: '150', SERVER_NAME: 'Hub Alpha' }));
  let hubRow = null;
  for (let i = 0; i < 40 && !hubRow; i++) {
    await sleep(150);
    hubRow = ((await jget(`/tracker/peers?wh=${manMain.worldHash}`, trk.base)).servers || [])
      .find((s) => s.name === 'Hub Alpha');
  }
  check(!!hubRow && hubRow.worldName === 'Roll2Hit'
    && hubRow.worldTag === 'Roll2Hit-' + manMain.worldHash.slice(0, 5),
    'tracker rows carry server name + worldName + worldTag (the server-browser data)');
  const stTrk = await jget('/mesh/status', trk.base);
  check((stTrk.trackerGroups || []).some((g) => g.worldTag === 'Roll2Hit-' + manMain.worldHash.slice(0, 5)),
    'tracker world groups are tagged (mesh/status.trackerGroups[].worldTag)');

  // ════════ (j) §MESH-01-FU 3 — pid-keyed presence ════════
  console.log('\n[J] §MESH-01-FU 3 — pid identity (same display name never misattributes)');
  const twin1 = await jpost('/session/start', { name: 'Twin', seed: 71 });
  const twin2 = await jpost('/session/start', { name: 'Twin', seed: 72 });
  const olaJ  = await jpost('/session/start', { name: 'OlaJ', seed: 73 });
  check(/^[0-9a-f]{8}:[0-9a-f]{8}$/.test(twin1.pid || '') && twin1.pid !== twin2.pid,
    'session/start returns a pid (server8:session8); same-name sessions get distinct pids');
  const sseOla = await openSSE(olaJ.sessionId); openClients.push(sseOla);
  const lookJ = await jget(`/session/look?sessionId=${olaJ.sessionId}`);
  const twins = (lookJ.players || []).filter((p) => p.name === 'Twin');
  check(twins.length === 2 && twins[0].pid !== twins[1].pid && twins.every((p) => /^[0-9a-f]{8}:[0-9a-f]{8}$/.test(p.pid)),
    'look lists BOTH same-name players with distinct pids');
  await jpost('/session/end', { sessionId: twin1.sessionId });
  await waitFor(() => countEv(sseOla, 'player_left', (d) => d.pid === twin1.pid) === 1);
  check(countEv(sseOla, 'player_left', (d) => d.pid === twin1.pid) === 1,
    'player_left carries the leaver’s pid');
  const lookJ2 = await jget(`/session/look?sessionId=${olaJ.sessionId}`);
  check((lookJ2.players || []).filter((p) => p.name === 'Twin').length === 1,
    'after one Twin ends, exactly one Twin remains (pid-keyed, not name-keyed)');

  // ════════ (k) §MESH-01-FU 4 — worldwide player_moved push ════════
  console.log('\n[K] §MESH-01-FU 4 — realtime map dots (player_moved is worldwide, display-only)');
  const kw = await jpost('/session/start', { name: 'WatcherK', seed: 91 });
  const km = await jpost('/session/start', { name: 'MoverK', seed: 92 });
  const sseKW = await openSSE(kw.sessionId); openClients.push(sseKW);
  await sleep(100);
  // Mover beacons one cell east (known passable); the watcher stays at the hub —
  // after the move they are NOT co-present, yet the watcher must hear about it.
  await jpost('/session/pos', { sessionId: km.sessionId, r: km.r, c: km.c + 1 });
  await waitFor(() => countEv(sseKW, 'player_moved', (d) => d.pid === km.pid) >= 1);
  check(countEv(sseKW, 'player_moved', (d) => d.pid === km.pid && d.to && d.to.c === km.c + 1) === 1,
    'a watcher in a different cell receives player_moved with pid + destination (worldwide push)');
  const kPos = await jpost('/session/pos', { sessionId: kw.sessionId, r: kw.r, c: kw.c });
  check((kPos.world || []).some((p) => p.pid === km.pid && p.r === km.r && p.c === km.c + 1),
    'pos response world[] lists far players with live coords (world/globe panel seed)');
  await jpost('/session/end', { sessionId: km.sessionId });
  await waitFor(() => countEv(sseKW, 'player_moved', (d) => d.pid === km.pid && !d.to) === 1);
  check(countEv(sseKW, 'player_moved', (d) => d.pid === km.pid && !d.to) === 1,
    'session end pushes player_moved to:null (worldwide dot removal)');
  // Cross-server: Ben's single [E] beacon must have fanned player_moved to Ann
  // (different server, different cell) exactly once — vv dedup across replays.
  check(countEv(sseAnn, 'player_moved', (d) => d.name === 'Ben' && d.remote === true) === 1,
    'cross-server pos beacon fans player_moved to remote watchers exactly once');

  // ════════ (l) §MESH-01e — partition-heal harness: 3 servers + tracker ════════
  // The mesh's promised hardening gate. Topology: tracker T + servers P/Q/R who
  // know ONLY the tracker URL. Partition = hot-reloaded block ACL on R (cuts
  // BOTH directions: R's dial-out filter skips blocked peers, R's ingress 403s
  // them — one file is a full bidirectional partition). Heal = rewrite the ACL
  // to open; the next 120 ms gossip round reconnects. Asserts: convergence,
  // exactly-once across the partition (vv dedup vs the 100-event tail replayed
  // EVERY round), stale-replica availability during the split, snapshot
  // anti-entropy correcting position after it, incompat-refusal + ACL in the
  // same 3-server topology.
  console.log('\n[L] §MESH-01e — partition heal (3 servers + tracker: converge · split · heal · exactly-once)');
  const idP = '1a'.repeat(16), idQ = '2b'.repeat(16), idR = '3c'.repeat(16);
  const aclR = path.join(tmp, `r2h-acl-partition-${PORT}.json`);
  fs.writeFileSync(aclR, JSON.stringify({ mode: 'open' }));           // deterministic start (tmp persists across runs)
  for (const p of [17, 18, 19, 20, 21]) fs.rmSync(path.join(tmp, `r2h-peers-${PORT + p}.json`), { force: true }); // no stale bootstrap
  const trkL = await startServer(PORT + 17, { TRACKER_MODE: '1', MESH_SERVER_ID: '4d'.repeat(16), PEERS_CACHE_FILE: path.join(tmp, `r2h-peers-${PORT + 17}.json`) });
  const mP = await startServer(PORT + 18, mkEnv(PORT + 18, idP, { TRACKER_URL: trkL.base, MESH_ANNOUNCE_MS: '150' }));
  const mQ = await startServer(PORT + 19, mkEnv(PORT + 19, idQ, { TRACKER_URL: trkL.base, MESH_ANNOUNCE_MS: '150' }));
  const mR = await startServer(PORT + 20, mkEnv(PORT + 20, idR, { TRACKER_URL: trkL.base, MESH_ANNOUNCE_MS: '150', MESH_ACL_FILE: aclR }));

  const pia  = await jpost('/session/start', { name: 'Pia',  seed: 111 }, mP.base);
  const quin = await jpost('/session/start', { name: 'Quin', seed: 222 }, mQ.base);
  const rex  = await jpost('/session/start', { name: 'Rex',  seed: 333 }, mR.base);
  const ssePia = await openSSE(pia.sessionId, mP.base); openClients.push(ssePia);
  const sseRex = await openSSE(rex.sessionId, mR.base); openClients.push(sseRex);

  // (1) convergence from the tracker alone: every server replicates the other two
  const remoteNames = async (base) => ((((await jget('/session/who', base)).remotes) || []).map((p) => p.name));
  const seesBoth = async (base, a, b) => { const n = await remoteNames(base); return n.includes(a) && n.includes(b); };
  let converged = false;
  for (let i = 0; i < 50 && !converged; i++) {
    await sleep(200);
    converged = (await seesBoth(mP.base, 'Quin', 'Rex')) && (await seesBoth(mQ.base, 'Pia', 'Rex')) && (await seesBoth(mR.base, 'Pia', 'Quin'));
  }
  check(converged, '3 servers sharing only a tracker URL fully converge — each replicates the other two players');

  // (2) baseline exactly-once on the healthy mesh (all three co-present at the hub)
  await jpost('/session/say', { sessionId: quin.sessionId, msg: 'mesh-baseline' }, mQ.base);
  await waitFor(() => countEv(ssePia, 'chat', (d) => d.msg === 'mesh-baseline') >= 1
                   && countEv(sseRex, 'chat', (d) => d.msg === 'mesh-baseline') >= 1, 5000, 100);
  await sleep(600);   // several replay rounds — the 100-event tail is resent every round
  check(countEv(ssePia, 'chat', (d) => d.msg === 'mesh-baseline') === 1, 'healthy 3-mesh: Pia hears the chat exactly once');
  check(countEv(sseRex, 'chat', (d) => d.msg === 'mesh-baseline') === 1, 'healthy 3-mesh: Rex hears the chat exactly once');

  // (3) PARTITION — block P and Q on R via the hot-reloaded ACL, verify the split is tight
  fs.writeFileSync(aclR, JSON.stringify({ blockServerIds: [idP, idQ] }));
  let splitSeen = false;
  for (let i = 0; i < 40 && !splitSeen; i++) {
    await sleep(150);
    const pPeers = (await jget('/mesh/status', mP.base)).peers || [];
    const qPeers = (await jget('/mesh/status', mQ.base)).peers || [];
    splitSeen = pPeers.some((p) => p.addr.endsWith(':' + (PORT + 20)) && p.lastErr === 'acl')
             && qPeers.some((p) => p.addr.endsWith(':' + (PORT + 20)) && p.lastErr === 'acl');
  }
  check(splitSeen, 'hot-reloaded block ACL partitions R: P and Q both record lastErr acl on the R peer');
  check(((await jget('/mesh/status', mR.base)).traffic || []).some((t) => t.kind === 'gossip' && !t.ok && /ACL/.test(t.note)),
    'partitioned R logs the refusals in its information-passed ring');
  const gSplit = await fetch(mR.base + '/api/mesh/gossip', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serverId: idP, proto: manA.proto, engineVer: manA.engineVer, worldHash: manA.worldHash, addr: `localhost:${PORT + 18}` }),
  });
  check(gSplit.status === 403, 'gossip from a blocked serverId is refused with 403 (the partition mechanism itself)');

  // Events DURING the split — kept brief so partition-era events are still
  // fresh (< MESH_FANOUT_MAX_AGE) when the link heals and they first cross it.
  await jpost('/session/say', { sessionId: quin.sessionId, msg: 'thru-partition-pq' }, mQ.base);
  await jpost('/session/say', { sessionId: rex.sessionId,  msg: 'behind-partition-r' }, mR.base);
  await jpost('/session/pos', { sessionId: rex.sessionId, r: rex.r, c: rex.c + 1 }, mR.base);   // Rex steps E, unseen
  await waitFor(() => countEv(ssePia, 'chat', (d) => d.msg === 'thru-partition-pq') >= 1, 4000, 100);
  await sleep(500);
  check(countEv(ssePia, 'chat', (d) => d.msg === 'thru-partition-pq') === 1, 'the surviving P–Q link still delivers exactly once during the split');
  check(countEv(ssePia, 'chat', (d) => d.msg === 'behind-partition-r') === 0, 'Rex’s chat does NOT cross the partition');
  check(countEv(sseRex, 'chat', (d) => d.msg === 'thru-partition-pq') === 0, 'isolated R hears nothing from the majority side');
  check(countEv(ssePia, 'player_moved', (d) => d.name === 'Rex') === 0, 'Rex’s move does not cross the partition');
  check((((await jget('/session/who', mP.base)).remotes) || []).some((p) => p.name === 'Rex' && p.r === rex.r && p.c === rex.c),
    'split ≤ origin-TTL: P keeps the stale Rex replica at his last known cell (availability over freshness)');

  // (4) HEAL — reopen the ACL; the next gossip round reconnects
  fs.writeFileSync(aclR, JSON.stringify({ mode: 'open' }));
  await waitFor(() => countEv(ssePia, 'chat', (d) => d.msg === 'behind-partition-r') >= 1, 8000, 100);
  await sleep(700);   // many post-heal rounds: the partition-era events replay in every tail
  check(countEv(ssePia, 'chat', (d) => d.msg === 'behind-partition-r') === 1,
    'heal: the partition-era chat crosses exactly once, despite the event tail replaying every round');
  check(countEv(ssePia, 'player_moved', (d) => d.name === 'Rex' && d.to && d.to.c === rex.c + 1) === 1,
    'heal: the partition-era move fans out exactly once (vv dedup across the healed link)');
  let rexFixed = false;
  for (let i = 0; i < 20 && !rexFixed; i++) {
    await sleep(150);
    rexFixed = (((await jget('/session/who', mP.base)).remotes) || []).some((p) => p.name === 'Rex' && p.c === rex.c + 1);
  }
  check(rexFixed, 'heal: snapshot anti-entropy corrects the stale replica to Rex’s true cell');
  check(countEv(sseRex, 'chat', (d) => d.msg === 'mesh-baseline') === 1,
    'pre-partition history replayed across the heal is never re-delivered (exactly-once across partitions)');
  check(countEv(ssePia, 'chat', (d) => d.msg === 'thru-partition-pq') === 1, 'majority-side delivery count is unchanged by the heal');
  let reconverged = false;
  for (let i = 0; i < 30 && !reconverged; i++) {
    await sleep(200);
    reconverged = await seesBoth(mR.base, 'Pia', 'Quin');
  }
  check(reconverged, 'heal: the isolated server re-converges — R replicates both majority-side players again');

  // (5) incompat-refusal in the same topology: a mismatched world knocks on the healed mesh
  await startServer(PORT + 21, mkEnv(PORT + 21, '5e'.repeat(16), {
    TRACKER_URL: trkL.base, MESH_ANNOUNCE_MS: '150', MESH_PEERS: `localhost:${PORT + 18}`, MESH_WORLDHASH_OVERRIDE: 'feedfacefeedface',
  }));
  await jpost('/session/start', { name: 'Xeno', seed: 444 }, `http://127.0.0.1:${PORT + 21}`);
  await sleep(800);
  check(!(await remoteNames(mP.base)).includes('Xeno') && !(await remoteNames(mR.base)).includes('Xeno'),
    'an incompatible world never joins the healed mesh — Xeno invisible on P and R');
  check((await jget('/tracker/peers?wh=feedfacefeedface', trkL.base)).count === 1,
    'the tracker segregates the incompatible server into its own world group');

  // ════════ (m) §NAV-01f — MUD server room parity ════════
  // The server's `room` (returned by start/move/look/pos via the shared
  // buildLook) must be BYTE-EQUAL to what the SP client renders for the same
  // cell. Reference = rooms.js describeCell (byte-identical to the client copy
  // by check:roomsparity) over a world built here the way the CLIENT builds it
  // (literals re-parsed from roll2hit-v3.html, client fallbacks reproduced) —
  // an independent construction, so server-side world-assembly drift fails.
  console.log('\n[M] §NAV-01f — server room ≡ client describeCell (byte-equal)');
  const Rooms = requireCjs(path.join(ROOT, 'rooms.js'));
  const CORE  = requireCjs(path.join(ROOT, 'wbapi-core.js'));
  CORE.load(path.join(ROOT, 'roll2hit-v3.html'));
  const gameSrc = CORE._rawSrc;
  const lit = (re) => { const m = gameSrc.match(re); return m ? (new Function('return ' + m[1]))() : null; };
  const expandRuns = (runs) => { const s = new Set(); for (const [r, rr] of Object.entries(runs || {})) for (const [a, b] of rr) for (let c = a; c <= b; c++) s.add(`${r},${c}`); return s; };
  const IMPASSABLE = expandRuns(lit(/const\s+SEA_RUNS\s*=\s*(\{[\s\S]*?\});/));
  const ROAD_CELLS = expandRuns(lit(/const\s+ROAD_RUNS\s*=\s*(\{[\s\S]*?\});/));
  const SEA_LANES  = new Set(lit(/const\s+SEA_LANES\s*=\s*new Set\(\s*(\[[\s\S]*?\])\s*\)\s*;/) || []);
  const CELL_GRID = {};   // client §CELL-02: first-wins locale list in NODE_MAP key order
  for (const code of Object.keys(CORE.nodeMap)) {
    const coord = CORE.nodeCoords[code] || { r: CORE.nodeMap[code].r, c: CORE.nodeMap[code].c };
    if (coord && coord.r != null && coord.c != null) (CELL_GRID[`${coord.r},${coord.c}`] ??= []).push(code);
  }
  const inferTerrain = (r, c) => {   // client _inferTerrain: majority vote of named neighbours
    if (SEA_LANES.has(`${r},${c}`)) return 'ocean';
    if (ROAD_CELLS.has(`${r},${c}`)) return 'road';
    const names = [[-1, 0], [1, 0], [0, 1], [0, -1]]
      .map(([dr, dc]) => (CELL_GRID[`${r + dr},${c + dc}`] || [])[0])
      .filter(Boolean).map((code) => CORE.nodeMap[code] && CORE.nodeMap[code].name).filter(Boolean);
    if (!names.length) return 'midlands';
    const freq = {}; let best = 'midlands', bestN = 0;
    for (const t of names) { freq[t] = (freq[t] || 0) + 1; if (freq[t] > bestN) { bestN = freq[t]; best = t; } }
    return best;
  };
  const refWorld = {   // client _roomWorld(), field-for-field
    proj: { ROWS: 90, COLS: 360 },
    impassable: IMPASSABLE,
    cellCodes: (r, c) => CELL_GRID[`${r},${c}`] || [],
    terrainAt: inferTerrain,
    roadCells: ROAD_CELLS,
    laneCells: SEA_LANES,
    nodeLabel: (code) => (CORE.nodeMap[code] && CORE.nodeMap[code].label) || code,
    terrainInfo: (key) => { const t = CORE.worldDb[key] || CORE.worldDb.midlands; return { label: (t && t.label) || key, icon: (t && t.icon) || '·' }; },
  };
  const refRoom = (r, c) => Rooms.describeCell(refWorld, { r, c });
  const bytes = (o) => JSON.stringify(o);

  const mia = await jpost('/session/start', { name: 'Mia', seed: 7007 });
  check(mia.room && typeof mia.room.prose === 'string' && Array.isArray(mia.room.exits), 'session/start returns the room object (icon/title/prose/exits)');
  check(bytes(mia.room) === bytes(refRoom(mia.r, mia.c)), 'hub room is byte-equal to the client describeCell (title/sub/prose/exits/signposts/landmarks)');
  check(mia.room.title === refWorld.nodeLabel('LHR'), 'hub room titles by the node display label');
  const lookM1 = await jget(`/session/look?sessionId=${mia.sessionId}`);
  const lookM2 = await jget(`/session/look?sessionId=${mia.sessionId}`);
  check(bytes(lookM1.room) === bytes(mia.room) && bytes(lookM2.room) === bytes(lookM1.room), 'look returns the same room, byte-stable across calls (deterministic prose hash)');
  check(lookM1.room.exits.some((e) => e.kind === 'blocked' && e.label === 'open sea'), 'hub exits sign the sea-blocked direction as "open sea"');

  const miaMove = await jpost('/session/move', { sessionId: mia.sessionId, dir: 'E' });   // hub → BMA
  check(miaMove.ok && bytes(miaMove.room) === bytes(refRoom(miaMove.r, miaMove.c)), 'move returns the destination room, byte-equal to the client');
  check(miaMove.room.title === (miaMove.node && miaMove.node.label), 'named-cell room title matches the node the move reports');
  check(typeof miaMove.desc === 'string' && miaMove.exits && miaMove.room, 'move keeps the legacy desc/exits surface alongside room (no breaking change)');

  // road cell: first unnamed passable road cell (ROAD_RUNS order) with signage
  let roadCell = null;
  for (const k of ROAD_CELLS) {
    const [r, c] = k.split(',').map(Number);
    if (IMPASSABLE.has(k) || (CELL_GRID[k] || []).length) continue;
    const rr = refRoom(r, c);
    if (rr.signposts.length) { roadCell = { r, c, ref: rr }; break; }
  }
  check(!!roadCell, 'a signposted road cell exists to probe');
  if (roadCell) {
    const onRoad = await jpost('/session/pos', { sessionId: mia.sessionId, r: roadCell.r, c: roadCell.c });
    check(onRoad.ok && onRoad.room.terrain === 'road', 'pos onto the road net reports road terrain');
    check(bytes(onRoad.room) === bytes(roadCell.ref), 'road room (incl. "The road runs …" signposts) is byte-equal to the client');
  }

  // empty wilderness cell near the hub: unnamed, off-net, passable, with a landmark
  let wildCell = null;
  outer: for (let radius = 1; radius <= 12 && !wildCell; radius++)
    for (let dr = -radius; dr <= radius; dr++) for (let dc = -radius; dc <= radius; dc++) {
      if (Math.max(Math.abs(dr), Math.abs(dc)) !== radius) continue;
      const r = mia.r + dr, c = mia.c + dc, k = `${r},${c}`;
      if (r < 0 || r >= 90 || IMPASSABLE.has(k) || ROAD_CELLS.has(k) || SEA_LANES.has(k) || (CELL_GRID[k] || []).length) continue;
      const rr = refRoom(r, c);
      if (rr.landmarks.length) { wildCell = { r, c, ref: rr }; break outer; }
    }
  check(!!wildCell, 'an empty wilderness cell with a landmark exists near the hub');
  if (wildCell) {
    const inWild = await jpost('/session/pos', { sessionId: mia.sessionId, r: wildCell.r, c: wildCell.c });
    check(inWild.ok && bytes(inWild.room) === bytes(wildCell.ref), 'wilderness room (terrain prose + nearest-landmark line) is byte-equal to the client');
    check(inWild.room.sub.startsWith('Near '), 'wilderness sub locates by nearest landmark, not raw coordinates');
  }
  await jpost('/session/end', { sessionId: mia.sessionId });

  // ════════ (n) §NAV-01g — roads-pins lock API + geo-seed honors locked ════════
  // The worldbuilder 🔒 toggle persists locked:[codes] into roads-pins.json via
  // PUT /api/roads/lock; POST /api/layout/geo-seed must then keep a locked
  // city's coords through regeneration (dry-run asserted — no file writes).
  console.log('\n[N] §NAV-01g — roads-pins lock API + geo-seed keeps locked cities');
  const pinsFile = path.join(os.tmpdir(), `r2h-roads-pins-${PORT}.json`);
  fs.rmSync(pinsFile, { force: true });
  const srvN = await startServer(PORT + 22, { ROADS_PINS_FILE: pinsFile });
  const pins0 = await jget('/roads/pins', srvN.base);
  check(pins0.ok === true && Array.isArray(pins0.locked) && pins0.locked.length === 0
     && Array.isArray(pins0.links) && Array.isArray(pins0.pins), 'pins file absent → empty {pins,links,locked} defaults, not an error');
  const lockBad = await jput('/roads/lock', { code: 'NOPE', locked: true }, srvN.base);
  check(lockBad.ok === false, 'locking an unknown node code is refused');
  const lock1 = await jput('/roads/lock', { code: 'LHR', locked: true }, srvN.base);
  const lock2 = await jput('/roads/lock', { code: 'VBY', locked: true }, srvN.base);
  check(lock1.ok && lock2.ok && JSON.stringify(lock2.locked) === JSON.stringify(['LHR', 'VBY']),
    'PUT /api/roads/lock accumulates a sorted locked list');
  check(fs.existsSync(pinsFile) && JSON.stringify(JSON.parse(fs.readFileSync(pinsFile, 'utf8')).locked) === JSON.stringify(['LHR', 'VBY']),
    'the lock persists to the pins file on disk');
  const lhrBefore = (await jget('/coords', srvN.base)).coords.LHR;
  const seedLocked = await jpost('/layout/geo-seed', { dryRun: true }, srvN.base);
  check(seedLocked.ok && (seedLocked.lockedKept || []).includes('LHR') && seedLocked.coords.LHR === undefined,
    'geo-seed dry-run keeps a locked city: LHR in lockedKept, absent from the re-seed coords');
  const unlock = await jput('/roads/lock', { code: 'LHR', locked: false }, srvN.base);
  check(unlock.ok && JSON.stringify(unlock.locked) === JSON.stringify(['VBY']), 'unlock removes only the one code');
  const seedOpen = await jpost('/layout/geo-seed', { dryRun: true }, srvN.base);
  check(seedOpen.ok && seedOpen.coords.LHR && seedOpen.coords.LHR.r === lhrBefore.r && seedOpen.coords.LHR.c === lhrBefore.c,
    'unlocked again → geo-seed re-projects LHR (to its true geo cell)');
  fs.rmSync(pinsFile, { force: true });

  // ── teardown ──
  openClients.forEach(closeSSE);
  await jpost('/session/end', { sessionId: alice.sessionId }).catch(() => {});
  await jpost('/session/end', { sessionId: bob.sessionId }).catch(() => {});
}

main()
  .catch((e) => { fails.push('harness threw: ' + (e && e.stack || e)); console.error(e); })
  .finally(async () => {
    openClients.forEach(closeSSE);
    stopAllServers();
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
