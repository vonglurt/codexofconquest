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
import crypto from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
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

// ── CLI runner — §MESH-01-FU 10: ./api.sh mesh wrappers, pointed at a throwaway
// server via --server. Not a TTY, so wb.js keeps stdout to pure payload.
function cli(args) {
  return new Promise((resolve) => {
    execFile('node', [path.join(ROOT, 'api', 'wb.js'), ...args], { cwd: ROOT }, (err, stdout, stderr) => {
      resolve({ code: err ? (err.code ?? 1) : 0, stdout, stderr });
    });
  });
}
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
  const proc = spawn('node', ['js/wbapi-server.js', ...extraArgs], {
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
  // pid-scoped peers cache for the MAIN server too — the repo-root default
  // (peers-cache.json) is written by any live dev server, and a stale addr in
  // it makes this "solo" server boot configured → [H] reachability-warning
  // check fails (same poisoning class as the [E]/[G] note below; found 2026-07-06
  // when a §MESH-02 connect test left localhost:1368 behind).
  await startServer(PORT, { PEERS_CACHE_FILE: path.join(os.tmpdir(), `r2h-peers-${process.pid}-${PORT}.json`) });

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
  // PEERS_CACHE_FILE is pid-scoped: port-only names survive ACROSS runs, and
  // the [G] reachability server advertises a fake LAN addr (10.0.0.5) into the
  // mesh — cached at shutdown, it poisoned [E] on every SUBSEQUENT run (each
  // gossip round stalled dialing it; found 2026-07-06). Within one run the
  // cache still persists per port, which is what the restart cases need.
  const mkEnv = (port, sid, extra = {}) => ({
    MESH_SERVER_ID: sid, ADVERTISE_ADDR: `localhost:${port}`, MESH_GOSSIP_MS: '120',
    PEERS_CACHE_FILE: path.join(tmp, `r2h-peers-${process.pid}-${port}.json`), ...extra,
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
  const trk = await startServer(PORT + 6, { TRACKER_MODE: '1', MESH_SERVER_ID: 'e'.repeat(32), PEERS_CACHE_FILE: path.join(tmp, `r2h-peers-${PORT + 6}.json`), TRACKER_CACHE_FILE: path.join(tmp, `r2h-trkcache-${process.pid}-${PORT + 6}.json`) });
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

  // ── §MESH-01-FU 10 — ./api.sh mesh CLI wrappers ride the same live mesh ──
  const cliSt = await cli(['mesh', 'status', '--json', '--server', mE.base]);
  let cliStJ = {}; try { cliStJ = JSON.parse(cliSt.stdout); } catch {}
  check(cliSt.code === 0 && cliStJ.ok === true && cliStJ.serverId === 'f'.repeat(8),
    'CLI: mesh status --json returns the live /api/mesh/status identity');
  let cliPe = {}; try { cliPe = JSON.parse((await cli(['mesh', 'peers', '--json', '--server', mE.base])).stdout); } catch {}
  check((cliPe.peers || []).some((p) => p.addr === `localhost:${PORT + 8}`),
    'CLI: mesh peers lists the tracker-discovered gossip peer');
  let cliTr = {}; try { cliTr = JSON.parse((await cli(['mesh', 'tracker', trk.base, '--json', '--server', mE.base])).stdout); } catch {}
  check(cliTr.count >= 2 && (cliTr.servers || []).some((s) => s.addr === `localhost:${PORT + 8}`),
    'CLI: mesh tracker <url> browses the tracker’s live server table');
  check((await cli(['mesh', 'bogus'])).code === 1, 'CLI: mesh rejects an unknown subcommand (usage, exit 1)');

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
  const trkA2 = await startServer(PORT + 11, { TRACKER_MODE: '1', MESH_SERVER_ID: '6'.repeat(32), MESH_ANNOUNCE_MS: '150', PEERS_CACHE_FILE: path.join(tmp, `r2h-peers-${PORT + 11}.json`), TRACKER_CACHE_FILE: path.join(tmp, `r2h-trkcache-${process.pid}-${PORT + 11}.json`) });
  const trkB2 = await startServer(PORT + 12, { TRACKER_MODE: '1', MESH_SERVER_ID: '5'.repeat(32), MESH_ANNOUNCE_MS: '150', TRACKER_PEERS: trkA2.base, PEERS_CACHE_FILE: path.join(tmp, `r2h-peers-${PORT + 12}.json`), TRACKER_CACHE_FILE: path.join(tmp, `r2h-trkcache-${process.pid}-${PORT + 12}.json`) });
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
  const trkL = await startServer(PORT + 17, { TRACKER_MODE: '1', MESH_SERVER_ID: '4d'.repeat(16), PEERS_CACHE_FILE: path.join(tmp, `r2h-peers-${PORT + 17}.json`), TRACKER_CACHE_FILE: path.join(tmp, `r2h-trkcache-${process.pid}-${PORT + 17}.json`) });
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
  const Rooms = requireCjs(path.join(ROOT, 'js', 'rooms.js'));
  const CORE  = requireCjs(path.join(ROOT, 'js', 'wbapi-core.js'));
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

  // ════════ (h) §MESH-01h — sentry bots: presence + encounter suppression ════════
  // A server-owned bot session stationed at a junction. It must (1) ride EVERY
  // presence surface for free (player_arrived/look/who carry it, tagged
  // kind:'sentry'), (2) suppress the instanced encounter roll in its cell, and
  // (3) never idle-expire (sessionPrune skips bots). Deploy/recall are the
  // single-writer mutations of THIS origin's sentries.
  console.log('\n[H] §MESH-01h — sentry bots (deploy → presence, suppression, recall, prune-immunity)');
  const cellN = { r: alice.r - 1, c: alice.c };   // empty, encounter-eligible cell N of the hub (see [C])

  // H1 — baseline: a fresh seed-7 session rolls encounters at cell N with NO sentry.
  // Same seed + same path reproduces exactly ([C]), so this count is the oracle the
  // guarded run must suppress to zero.
  const nsPath = []; for (let i = 0; i < 30; i++) nsPath.push('N', 'S');
  const walkTrace = async (id) => {
    let enc = 0, guarded = 0;
    for (const dir of nsPath) {
      const r = await jpost('/session/move', { sessionId: id, dir });
      if (r.ok && r.encounter) enc++;
      if (r.ok && r.sentryGuard) guarded++;
    }
    return { enc, guarded };
  };
  const baseSess = await jpost('/session/start', { name: 'SentryBase', seed: 7 });
  const baseline = await walkTrace(baseSess.sessionId);
  check(baseline.enc > 0, `baseline seed-7 session rolls encounters at cell N (${baseline.enc}) — suppression is non-vacuous`);
  check(baseline.guarded === 0, 'baseline sees no sentryGuard (no sentry deployed yet)');
  await jpost('/session/end', { sessionId: baseSess.sessionId });

  // H2 — a watcher at cell N, then deploy: the bot rides presence.
  const watch = await jpost('/session/start', { name: 'Watch', seed: 91 });
  const wMove = await jpost('/session/move', { sessionId: watch.sessionId, dir: 'N' });
  check(wMove.ok && wMove.r === cellN.r && wMove.c === cellN.c, 'watcher steps N off the hub to the empty cell');
  const sseW = await openSSE(watch.sessionId); openClients.push(sseW);
  await sleep(120);
  const dep = await jpost('/sentry/deploy', { r: cellN.r, c: cellN.c, dailyFee: 25 });
  check(dep.ok === true && /^[0-9a-f]{32}$/.test(dep.sentryId || ''), 'deploy returns a 32-hex sentryId');
  check(dep.r === cellN.r && dep.c === cellN.c && dep.dailyFee === 25, 'sentry lands on the requested cell with the given daily fee');
  await waitFor(() => countEv(sseW, 'player_arrived', (d) => d.kind === 'sentry') >= 1);
  await sleep(80);
  check(countEv(sseW, 'player_arrived', (d) => d.kind === 'sentry') === 1, 'co-present watcher gets exactly one player_arrived tagged kind:sentry');
  const wLook = await jget(`/session/look?sessionId=${watch.sessionId}`);
  check((wLook.players || []).some((p) => p.kind === 'sentry'), 'watcher look.players carries the sentry, tagged kind:sentry');
  const whoH = await jget('/session/who');
  check((whoH.sessions || []).some((x) => x.kind === 'sentry'), 'who lists the sentry with kind:sentry');
  const listed = await jget('/sentry/list');
  check(listed.count >= 1 && listed.sentries.some((x) => x.sentryId === dep.sentryId && x.dailyFee === 25), 'sentry/list reports the deployed sentry + its fee');

  // H3 — rejections.
  const dupDep = await jpost('/sentry/deploy', { r: cellN.r, c: cellN.c });
  check(dupDep.ok === false && dupDep.reason === 'occupied', 'a second deploy on the same cell is refused (occupied)');
  const badDep = await jpost('/sentry/deploy', { node: 'NOPE' });
  check(badDep.ok === false, 'deploy at an unknown node code is refused');

  // H4 — suppression: seed-7 guarded run suppresses EVERY encounter the baseline
  // rolled at cell N (deterministic: the RNG stream still advances, only the
  // result is voided), so guarded.enc === 0 and guarded.guarded === baseline.enc.
  const guardSess = await jpost('/session/start', { name: 'SentryGuarded', seed: 7 });
  const guarded = await walkTrace(guardSess.sessionId);
  check(guarded.enc === 0, `sentry suppresses all wilderness encounters in its cell (guarded enc=${guarded.enc})`);
  check(guarded.guarded === baseline.enc, `every baseline encounter is accounted for as a sentryGuard suppression (${guarded.guarded} === ${baseline.enc})`);
  await jpost('/session/end', { sessionId: guardSess.sessionId });

  // H5 — recall: the bot leaves presence.
  const recall = await jpost('/sentry/recall', { sentryId: dep.sentryId });
  check(recall.ok === true && recall.recalled === dep.sentryId, 'recall removes the sentry');
  await waitFor(() => countEv(sseW, 'player_left', (d) => d.kind === 'sentry') >= 1);
  await sleep(80);
  check(countEv(sseW, 'player_left', (d) => d.kind === 'sentry') === 1, 'co-present watcher gets exactly one player_left tagged kind:sentry');
  check((await jget('/sentry/list')).count === 0, 'sentry/list is empty after recall');
  check(!(await jget('/session/who')).sessions.some((x) => x.kind === 'sentry'), 'who no longer lists the sentry');
  const recallGone = await jpost('/sentry/recall', { sentryId: dep.sentryId });
  check(recallGone.ok === false, 'recalling an already-gone sentry is a clean 404');
  await jpost('/session/end', { sessionId: watch.sessionId });

  // H6 — prune immunity: on a short-TTL server, an idle PLAYER session is pruned
  // but a sentry bot at the same idle age survives (sessionPrune skips bots).
  console.log('\n[H6] sentry bots survive the idle-session prune');
  const sTtl = await startServer(PORT + 30, { SESSION_TTL_MS: '600' });
  const idlePlayer = await jpost('/session/start', { name: 'IdleGhost', seed: 44 }, sTtl.base);
  const sBot = await jpost('/sentry/deploy', { node: 'LHR', dailyFee: 10 }, sTtl.base);
  check(sBot.ok === true, 'sentry deploys on the short-TTL server (via node code)');
  await sleep(900);   // both sit idle past the 600ms TTL
  await jget('/session/who', sTtl.base);   // any /session/* request triggers the prune sweep
  const whoTtl = await jget('/session/who', sTtl.base);
  check(!whoTtl.sessions.some((x) => x.name === 'IdleGhost'), 'the idle player session is pruned past its TTL');
  check(whoTtl.sessions.some((x) => x.kind === 'sentry'), 'the sentry bot survives the prune (bots never idle-expire)');
  check((await jget('/sentry/list', sTtl.base)).count === 1, 'sentry/list still reports the bot after the prune sweep');

  // ════════ (i) §MESH-01i — no-dupe economy ledger (single-server slice) ════════
  // Durable per-player hash chains (ledger/<origin>.jsonl), server-side mint,
  // two-phase same-origin trade → ONE dual-chain event, pure ownership
  // resolution, deterministic lowest-hash dupe-void, and durability across a
  // restart — the property presence deliberately lacks. Lab report §6.1–6.2.
  console.log('\n[I] §MESH-01i — no-dupe ledger (mint, provenance, trade, dupe-void, durability)');
  const ledDir = fs.mkdtempSync(path.join(tmp, 'r2h-ledger-'));
  const ledId = 'ab'.repeat(16);
  const ledEnv = { LEDGER_DIR: ledDir, MESH_SERVER_ID: ledId, LEDGER_TRADE_TTL_MS: '900' };
  let led = await startServer(PORT + 31, ledEnv);

  // Harness-side twin of the server's canonical/sig/hash discipline — the
  // doctored-origin events below must be byte-compatible with ledgerValidate.
  const canon = (v) => v === null || typeof v !== 'object' ? JSON.stringify(v)
    : Array.isArray(v) ? '[' + v.map(canon).join(',') + ']'
    : '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  const hashOf = (e) => { const { hash, ...r } = e; return crypto.createHash('sha256').update(canon(r)).digest('hex'); };
  const sigOf = (e, signer) => { const { sig, hash, ...r } = e; return crypto.createHmac('sha256', signer).update(canon(r)).digest('hex'); };
  const sealed = (e) => { e.sig = { [e.id[0]]: sigOf(e, e.id[0]) }; e.hash = hashOf(e); return e; };

  // I1 — mint: session-bound, monotonic distinct ids, chain linkage from genesis.
  const annL = await jpost('/session/start', { name: 'Ann', seed: 11 }, led.base);
  const benL = await jpost('/session/start', { name: 'Ben', seed: 22 }, led.base);
  const sseBen = await openSSE(benL.sessionId, led.base); openClients.push(sseBen);
  const m1 = await jpost('/ledger/mint', { sessionId: annL.sessionId, item: { key: 'sword_iron', name: 'Iron Sword' } }, led.base);
  const m2 = await jpost('/ledger/mint', { sessionId: annL.sessionId, item: { key: 'ring_gold', name: 'Gold Ring' } }, led.base);
  check(m1.ok === true && m2.ok === true && m1.mintKey !== m2.mintKey, 'two mints get distinct mintIds (origin-wide monotonic seq)');
  check(m1.event.chain[annL.pid].height === 0 && m1.event.chain[annL.pid].prevHash === null, 'first mint is the genesis of Ann’s chain (height 0, prevHash null)');
  check(m2.event.chain[annL.pid].height === 1 && m2.event.chain[annL.pid].prevHash === m1.event.hash, 'second mint chains onto the first (height 1, prevHash = mint1.hash)');
  check((await jpost('/ledger/mint', { sessionId: 'nope', item: { key: 'x', name: 'X' } }, led.base)).ok === false, 'mint without a live session is refused');
  check((await jget(`/ledger/owner?mintId=${m1.mintKey}`, led.base)).owner === annL.pid, 'freshly minted item resolves to its minter');

  // I2 — provenance-reject: an unminted item fails trade/propose (§6.2).
  const fakeProp = await jpost('/trade/propose', { sessionId: annL.sessionId, to: benL.pid, give: ['ff'.repeat(16) + ':7'], want: [] }, led.base);
  check(fakeProp.ok === false && fakeProp.reason === 'provenance', 'trade/propose refuses an unminted item (no mint lineage)');

  // I3 — honest trade: propose notifies B over SSE; accept co-signs ONE event
  // into BOTH chains; ownership flips; the giver can no longer trade it away.
  const prop = await jpost('/trade/propose', { sessionId: annL.sessionId, to: benL.pid, give: [m1.mintKey], want: [] }, led.base);
  check(prop.ok === true && !!prop.tradeId, 'trade/propose returns a tradeId + TTL');
  await waitFor(() => countEv(sseBen, 'trade_proposed', (d) => d.tradeId === prop.tradeId) >= 1);
  check(countEv(sseBen, 'trade_proposed', (d) => d.tradeId === prop.tradeId) === 1, 'counterparty gets exactly one trade_proposed over SSE');
  check((await jpost('/trade/accept', { tradeId: prop.tradeId, sessionId: annL.sessionId }, led.base)).ok === false, 'only the counterparty session may accept (proposer refused)');
  const acc = await jpost('/trade/accept', { tradeId: prop.tradeId, sessionId: benL.sessionId }, led.base);
  check(acc.ok === true && Object.keys(acc.event.chain).length === 2, 'accept appends ONE co-signed event carrying BOTH players’ chain linkage');
  check(acc.event.body.transfers[0].priorEventHash === m1.event.hash, 'the transfer references the giver’s prior owning event (the mint)');
  const owned = await jget(`/ledger/owner?mintId=${m1.mintKey}`, led.base);
  check(owned.owner === benL.pid && owned.hops === 1, 'ownership resolves to the receiver after the trade (1 hop from mint)');
  const staleProp = await jpost('/trade/propose', { sessionId: annL.sessionId, to: benL.pid, give: [m1.mintKey], want: [] }, led.base);
  check(staleProp.ok === false && staleProp.reason === 'provenance', 'the giver cannot re-trade an item they no longer own');

  // I4 — cancel + TTL expiry: neither leaves an event.
  const p2 = await jpost('/trade/propose', { sessionId: annL.sessionId, to: benL.pid, give: [m2.mintKey], want: [] }, led.base);
  check((await jpost('/trade/cancel', { tradeId: p2.tradeId }, led.base)).ok === true, 'trade/cancel drops the pending proposal');
  check((await jpost('/trade/accept', { tradeId: p2.tradeId, sessionId: benL.sessionId }, led.base)).ok === false, 'accept after cancel is refused');
  const p3 = await jpost('/trade/propose', { sessionId: annL.sessionId, to: benL.pid, give: [m2.mintKey], want: [] }, led.base);
  await sleep(1000);   // past the 900ms harness TTL
  check((await jpost('/trade/accept', { tradeId: p3.tradeId, sessionId: benL.sessionId }, led.base)).ok === false, 'an expired proposal cannot be accepted (60s TTL, shortened here)');

  // I5 — ingest validation: bad sig and own-origin forgeries are dropped;
  // a well-formed foreign event is accepted and deduped on replay.
  const X = 'cd'.repeat(16);
  const pX1 = 'cdcdcdcd:11111111', pX2 = 'cdcdcdcd:22222222', pX3 = 'cdcdcdcd:33333333';
  const mintX = sealed({ kind: 'mint', id: [X, 1], ts: 1700000000000, chain: { [pX1]: { height: 0, prevHash: null } },
    body: { player: pX1, item: { key: 'amulet_dupe', name: 'Duped Amulet', qty: 1 }, mintId: [X, 1] } });
  const tampered = { ...mintX, sig: { [X]: 'ff'.repeat(32) } };
  tampered.hash = hashOf(tampered);
  const ingBad = await jpost('/ledger/ingest', { events: [tampered] }, led.base);
  check(ingBad.accepted === 0 && ingBad.rejected.length === 1 && ingBad.rejected[0].reason === 'bad-sig', 'ingest drops a self-inconsistent (bad HMAC) event');
  const forged = sealed({ kind: 'mint', id: [ledId, 999], ts: 1700000000001, chain: { [pX1]: { height: 0, prevHash: null } },
    body: { player: pX1, item: { key: 'forge', name: 'Forged', qty: 1 }, mintId: [ledId, 999] } });
  check((await jpost('/ledger/ingest', { events: [forged] }, led.base)).rejected[0].reason === 'own-origin', 'ingest refuses an event forged in OUR origin’s name (single-writer)');
  const ingOk = await jpost('/ledger/ingest', { events: [mintX] }, led.base);
  const ingDup = await jpost('/ledger/ingest', { events: [mintX] }, led.base);
  check(ingOk.accepted === 1 && ingDup.dup === 1, 'a valid foreign event is accepted once and deduped on replay');

  // I6 — dupe-void determinism: a doctored origin signs TWO transfers of one
  // mintId off the SAME priorEventHash. Fork-choice: lowest event hash wins,
  // the loser is voided — and an independent second server, given the same
  // events, reaches the identical verdict with zero coordination.
  const dupeTrade = (seq, toPid, tradeId) => sealed({ kind: 'trade', id: [X, seq], ts: 1700000000002, chain: {
      [pX1]: { height: 1, prevHash: mintX.hash }, [toPid]: { height: 0, prevHash: null } },
    body: { tradeId, parties: [pX1, toPid], transfers: [{ mintId: [X, 1], from: pX1, to: toPid, priorEventHash: mintX.hash }] } });
  const branchA = dupeTrade(2, pX2, 'aa'.repeat(16));
  const branchB = dupeTrade(3, pX3, 'bb'.repeat(16));
  const winner = branchA.hash < branchB.hash ? branchA : branchB;
  const loser  = branchA.hash < branchB.hash ? branchB : branchA;
  await jpost('/ledger/ingest', { events: [branchA, branchB] }, led.base);
  const verdict = await jget(`/ledger/owner?mintId=${X}:1`, led.base);
  check(verdict.owner === winner.body.transfers[0].to, `fork-choice: lowest event hash wins the double-spent item (${winner === branchA ? 'A' : 'B'})`);
  check(verdict.voided.includes(loser.hash) && !verdict.voided.includes(winner.hash), 'the losing branch is voided; the winner is not');
  const led2 = await startServer(PORT + 32, { LEDGER_DIR: fs.mkdtempSync(path.join(tmp, 'r2h-ledger2-')), MESH_SERVER_ID: 'ef'.repeat(16) });
  await jpost('/ledger/ingest', { events: [branchB, branchA, mintX] }, led2.base);   // different arrival order, same event set
  const verdict2 = await jget(`/ledger/owner?mintId=${X}:1`, led2.base);
  check(verdict2.owner === verdict.owner && verdict2.voided.includes(loser.hash), 'an independent server reaches the identical verdict from a different arrival order');

  // I7 — durability: the persisted log survives a restart (same LEDGER_DIR +
  // server id) — ownership, the foreign replica, the void verdict, and the
  // monotonic seq all reload. Presence deliberately lacks this property.
  const preRestart = await jget('/ledger/status', led.base);
  led.proc.kill('SIGTERM');
  await waitFor(() => led.proc.exitCode !== null, 4000);
  for (let i = 0; i < 40 && await pingOk(led.base); i++) await sleep(50);   // port must be free (waitFor is sync-only)
  led = await startServer(PORT + 31, ledEnv);
  const postRestart = await jget('/ledger/status', led.base);
  check(postRestart.events === preRestart.events, `all ${preRestart.events} ledger events survive the restart (fsync’d jsonl reload)`);
  const reOwned = await jget(`/ledger/owner?mintId=${m1.mintKey}`, led.base);
  check(reOwned.owner === benL.pid, 'ownership still resolves to the receiver after the restart');
  check((await jget(`/ledger/owner?mintId=${X}:1`, led.base)).voided.includes(loser.hash), 'the dupe-void verdict is reproduced from the reloaded log (pure function of the events)');
  const cara2 = await jpost('/session/start', { name: 'Cara2', seed: 33 }, led.base);
  const m3 = await jpost('/ledger/mint', { sessionId: cara2.sessionId, item: { key: 'boots', name: 'Boots' } }, led.base);
  check(m3.ok === true && m3.mintId[1] > preRestart.seq, `post-restart mint continues the monotonic seq (${m3.mintId[1]} > ${preRestart.seq}) — no id reuse`);

  // ════════ (i2) §MESH-01i slice 2 — durable identity + ledger gossip replication ════════
  // Persistent playerKey → durable ledgerPid that survives session death (lab
  // report §6.4), and the parallel durable gossip channel: ledgerVV piggybacks
  // on presence gossip; anti-entropy range pull (/ledger/sync) + push
  // (/ledger/ingest) replicate the chains cross-mesh with no TTL and no age
  // cap — then the pure fork-choice yields identical verdicts everywhere.
  console.log('\n[I2] §MESH-01i slice 2 — persistent player key + ledger gossip replication');
  const until = async (fn, ms = 6000, step = 100) => {
    const t0 = Date.now();
    for (;;) { if (await fn().catch(() => false)) return true; if (Date.now() - t0 > ms) return false; await sleep(step); }
  };

  // I8 — durable identity on the (restarted) single ledger server.
  const KEY = '5eed'.repeat(8);   // the client-generated 32-hex save-file key
  const d1 = await jpost('/session/start', { name: 'Dana', seed: 55, playerKey: KEY }, led.base);
  check(d1.ok === true && /^[0-9a-f]{8}:[0-9a-f]{8}$/.test(d1.ledgerPid) && d1.ledgerPid !== d1.pid, 'session/start with a playerKey returns a durable ledgerPid distinct from the session pid');
  check((await jpost('/session/start', { name: 'Eve', seed: 66, playerKey: 'not-hex' }, led.base)).ok === false, 'a malformed playerKey is refused');
  const same = await jpost('/session/start', { name: 'Dana2', seed: 57, playerKey: KEY }, led.base);
  check(same.ledgerPid === d1.ledgerPid, 'the same key always maps to the same durable pid');
  await jpost('/session/end', { sessionId: same.sessionId }, led.base);
  const md = await jpost('/ledger/mint', { sessionId: d1.sessionId, item: { key: 'lute', name: 'Lute' } }, led.base);
  check(md.ok === true && !!md.event.chain[d1.ledgerPid], 'a mint chains on the durable pid, not the session pid');
  await jpost('/session/end', { sessionId: d1.sessionId }, led.base);
  const d2 = await jpost('/session/start', { name: 'Dana', seed: 58, playerKey: KEY }, led.base);
  check(d2.sessionId !== d1.sessionId && d2.ledgerPid === d1.ledgerPid, 'a NEW session with the same key resumes the same durable pid after the old session died');
  check((await jget(`/ledger/owner?mintId=${md.mintKey}`, led.base)).owner === d2.ledgerPid, 'the dead session’s mint is still owned by the durable identity');
  const pd = await jpost('/trade/propose', { sessionId: d2.sessionId, to: benL.pid, give: [md.mintKey], want: [] }, led.base);
  check(pd.ok === true, 'the resumed identity can still trade its pre-death mint (no stranded chain)');
  await jpost('/trade/cancel', { tradeId: pd.tradeId }, led.base);

  // I9 — replication over REAL gossip: a mint on A appears on peered B via the
  // parallel durable channel (vv piggyback → anti-entropy), verdicts identical.
  const gid = (n) => String(n).repeat(32).slice(0, 32);
  const mkLedEnv = (port, sid, extra = {}) => ({
    LEDGER_DIR: fs.mkdtempSync(path.join(tmp, 'r2h-ledgas-')), MESH_SERVER_ID: sid,
    ADVERTISE_ADDR: `localhost:${port}`, MESH_GOSSIP_MS: '120', ...extra,
  });
  const gA = await startServer(PORT + 33, mkLedEnv(PORT + 33, gid(3)));
  const gB = await startServer(PORT + 34, mkLedEnv(PORT + 34, gid(4), { MESH_PEERS: `localhost:${PORT + 33}` }));
  const gil = await jpost('/session/start', { name: 'Gil', seed: 77, playerKey: 'ab12'.repeat(8) }, gA.base);
  const hal = await jpost('/session/start', { name: 'Hal', seed: 88, playerKey: 'cd34'.repeat(8) }, gA.base);
  const gm = await jpost('/ledger/mint', { sessionId: gil.sessionId, item: { key: 'gem', name: 'Gem' } }, gA.base);
  check(await until(async () => (await jget(`/ledger/owner?mintId=${gm.mintKey}`, gB.base)).owner === gil.ledgerPid),
    'a mint on A replicates to peered B over the durable gossip channel and resolves identically');
  const gp = await jpost('/trade/propose', { sessionId: gil.sessionId, to: hal.ledgerPid, give: [gm.mintKey], want: [] }, gA.base);
  await jpost('/trade/accept', { tradeId: gp.tradeId, sessionId: hal.sessionId }, gA.base);
  check(await until(async () => (await jget(`/ledger/owner?mintId=${gm.mintKey}`, gB.base)).owner === hal.ledgerPid),
    'the trade replicates too — ownership flips to the receiver on the remote server');
  check((await jget('/mesh/status', gB.base)).traffic.some((t) => t.kind === 'ledger' && t.ok),
    'the Mesh traffic ring records the ledger channel packets');

  // I10 — anti-entropy catch-up: server C joins AFTER the history was written.
  // The presence ring can never do this (10 s fanout cap, 500-event ring); the
  // ledger range-pull back-fills everything from seq 1.
  const gC = await startServer(PORT + 35, mkLedEnv(PORT + 35, gid(5), { MESH_PEERS: `localhost:${PORT + 33}` }));
  const aStat = await jget('/ledger/status', gA.base);
  check(await until(async () => (await jget('/ledger/status', gC.base)).events === aStat.events),
    `late-joining C back-fills the full ${aStat.events}-event history it never witnessed (anti-entropy range pull)`);
  check((await jget(`/ledger/owner?mintId=${gm.mintKey}`, gC.base)).owner === hal.ledgerPid,
    'C resolves the back-filled item to the same owner');

  // I11 — dupe-void over REAL replication: a doctored origin's conflicting
  // branches ingested at A propagate mesh-wide; every server voids the same
  // branch (pure fork-choice, zero coordination).
  const Y = 'ee'.repeat(16);
  const pY1 = 'eeeeeeee:aaaa1111', pY2 = 'eeeeeeee:bbbb2222', pY3 = 'eeeeeeee:cccc3333';
  const mintY = sealed({ kind: 'mint', id: [Y, 1], ts: 1700000000010, chain: { [pY1]: { height: 0, prevHash: null } },
    body: { player: pY1, item: { key: 'crown_dupe', name: 'Duped Crown', qty: 1 }, mintId: [Y, 1] } });
  const forkOf = (seq, toPid, tradeId) => sealed({ kind: 'trade', id: [Y, seq], ts: 1700000000011, chain: {
      [pY1]: { height: 1, prevHash: mintY.hash }, [toPid]: { height: 0, prevHash: null } },
    body: { tradeId, parties: [pY1, toPid], transfers: [{ mintId: [Y, 1], from: pY1, to: toPid, priorEventHash: mintY.hash }] } });
  const forkA = forkOf(2, pY2, 'cc'.repeat(16));
  const forkB = forkOf(3, pY3, 'dd'.repeat(16));
  const loserY = forkA.hash < forkB.hash ? forkB : forkA;
  await jpost('/ledger/ingest', { events: [mintY, forkA, forkB] }, gA.base);
  const verdictOn = async (base) => jget(`/ledger/owner?mintId=${Y}:1`, base);
  check(await until(async () => (await verdictOn(gC.base)).voided && (await verdictOn(gB.base)).voided
      && (await verdictOn(gB.base)).owner === (await verdictOn(gA.base)).owner
      && (await verdictOn(gC.base)).owner === (await verdictOn(gA.base)).owner),
    'the doctored double-spend propagates mesh-wide; A, B and C converge on one owner');
  const [vA, vB, vC] = [await verdictOn(gA.base), await verdictOn(gB.base), await verdictOn(gC.base)];
  check(vA.voided.includes(loserY.hash) && vB.voided.includes(loserY.hash) && vC.voided.includes(loserY.hash),
    'all three servers void the identical losing branch (lowest-hash fork-choice, no coordination)');

  // I12 — §MESH-01i slice 2b: the client rung's server read surface. The
  // browser client restores its trade identity from the pos beacon, picks
  // trade targets from the co-present list's ledgerPid, and reads item names
  // from /ledger/owned — pin all three.
  console.log('\n[I2] I12 — client-rung read surface (pos ledgerPid · co-present ledgerPid · ledger/owned)');
  const gilPos = await jpost('/session/pos', { sessionId: gil.sessionId, r: gil.r, c: gil.c }, gA.base);
  check(gilPos.ok === true && gilPos.ledgerPid === gil.ledgerPid,
    'session/pos carries the durable ledgerPid (the reload-resume path restores the trade identity)');
  await jpost('/session/pos', { sessionId: hal.sessionId, r: gil.r, c: gil.c }, gA.base);
  const gilPos2 = await jpost('/session/pos', { sessionId: gil.sessionId, r: gil.r, c: gil.c }, gA.base);
  check((gilPos2.players || []).some((p) => p.ledgerPid === hal.ledgerPid),
    'the co-present players[] entries carry ledgerPid (the trade-target picker)');
  const halOwned = await jget(`/ledger/owned?pid=${hal.ledgerPid}`, gA.base);
  check(halOwned.ok === true && halOwned.items.some((t) => t.mintKey === gm.mintKey && t.item && t.item.name === 'Gem'),
    'ledger/owned lists the receiver’s traded-in item with its name (the trade UI read surface)');
  const gilOwned = await jget(`/ledger/owned?pid=${gil.ledgerPid}`, gA.base);
  check(gilOwned.ok === true && !gilOwned.items.some((t) => t.mintKey === gm.mintKey),
    'ledger/owned no longer lists the item for the giver after the trade');

  // ── [I3] §MESH-01i last rung — CROSS-ORIGIN co-signed trades ──────────────
  // Parties on different servers: gil lives on gA, Ben on gB (peered, real
  // gossip). The propose relays gA→gB, the accept relays back, and gA (the
  // proposer's origin) authors ONE event co-signed by both origins; gC (a
  // third server) replays it to the same verdict.
  console.log('\n[I3] §MESH-01i — cross-origin co-signed trades (propose/accept relay, dual-origin sig)');

  const benX = await jpost('/session/start', { name: 'Ben', seed: 99, playerKey: 'ef56'.repeat(8) }, gB.base);
  check(benX.ok === true && benX.ledgerPid.split(':')[0] === gid(4).slice(0, 8), 'Ben holds a durable identity on HIS origin (gB)');

  // (1) presence carries the remote trade identity: Ben's p8 rides gB→gA gossip.
  await jpost('/session/pos', { sessionId: benX.sessionId, r: gil.r, c: gil.c }, gB.base);
  check(await until(async () => {
    const p = await jpost('/session/pos', { sessionId: gil.sessionId, r: gil.r, c: gil.c }, gA.base);
    return (p.players || []).some((q) => q.ledgerPid === benX.ledgerPid && q.server);
  }), 'the co-present roster on A carries the REMOTE player’s ledgerPid (p8 rides the presence snapshot)');

  // (2) mints on each origin, then the cross-origin swap.
  const swordM = await jpost('/ledger/mint', { sessionId: gil.sessionId, item: { key: 'sword', name: 'Sword' } }, gA.base);
  const shieldM = await jpost('/ledger/mint', { sessionId: benX.sessionId, item: { key: 'shield', name: 'Shield' } }, gB.base);
  const benSSE = await openSSE(benX.sessionId, gB.base);
  openClients.push(benSSE);
  const xp = await jpost('/trade/propose', { sessionId: gil.sessionId, to: benX.ledgerPid, give: [swordM.mintKey], want: [shieldM.mintKey] }, gA.base);
  check(xp.ok === true && xp.remote === true, 'a cross-origin proposal validates (vv pull covers the fresh foreign mint) and relays to the counterparty’s origin');
  check((await jget(`/trade/list?pid=${benX.ledgerPid}`, gB.base)).count === 1, 'the pending offer exists on the counterparty’s origin');
  check(await waitFor(() => countEv(benSSE, 'trade_proposed', (d) => d.tradeId === xp.tradeId) === 1, 4000),
    'the counterparty is notified over SSE on THEIR server');

  // (3) only the counterparty, on their own origin, may accept.
  const wrong = await jpost('/trade/accept', { tradeId: xp.tradeId, sessionId: hal.sessionId }, gA.base);
  check(wrong.ok === false, 'a third player on the proposer origin cannot accept the cross-origin offer');
  const xa = await jpost('/trade/accept', { tradeId: xp.tradeId, sessionId: benX.sessionId }, gB.base);
  check(xa.ok === true && xa.event && xa.event.id[0] === gid(3), 'the accept relays back and the PROPOSER’s origin authors the one trade event');
  check(xa.event && Object.keys(xa.event.sig || {}).sort().join(',') === [gid(3), gid(4)].sort().join(','),
    'the event carries BOTH origins’ signatures (co-signed)');
  check(xa.event && !!xa.event.chain[gil.ledgerPid] && !!xa.event.chain[benX.ledgerPid],
    'the event links BOTH players’ chains (dual-membership across origins)');
  check(await waitFor(() => countEv(benSSE, 'trade_completed', (d) => d.tradeId === xp.tradeId) === 1, 4000),
    'the accepting party hears trade_completed exactly once (ingest-hook SSE, hash-deduped)');

  // (4) the swap converges to the identical verdict on A, B and bystander C.
  check(await until(async () => (await jget(`/ledger/owner?mintId=${swordM.mintKey}`, gA.base)).owner === benX.ledgerPid
      && (await jget(`/ledger/owner?mintId=${shieldM.mintKey}`, gA.base)).owner === gil.ledgerPid),
    'ownership flips BOTH ways on the proposer origin');
  check(await until(async () => (await jget(`/ledger/owner?mintId=${swordM.mintKey}`, gB.base)).owner === benX.ledgerPid
      && (await jget(`/ledger/owner?mintId=${shieldM.mintKey}`, gB.base)).owner === gil.ledgerPid),
    'the counterparty origin agrees');
  check(await until(async () => (await jget(`/ledger/owner?mintId=${swordM.mintKey}`, gC.base)).owner === benX.ledgerPid),
    'a third server replays the co-signed event to the same owner (no coordination)');

  // (5) cancel relays: the pending copy disappears on the OTHER origin too.
  const xp2 = await jpost('/trade/propose', { sessionId: gil.sessionId, to: benX.ledgerPid, give: [], want: [swordM.mintKey] }, gA.base);
  check(xp2.ok === true, 'a second cross-origin proposal (want-only, the traded sword) is accepted');
  await jpost('/trade/cancel', { tradeId: xp2.tradeId }, gA.base);
  check(await until(async () => (await jget(`/trade/list?pid=${benX.ledgerPid}`, gB.base)).count === 0),
    'a cancel on the proposer origin relays — the counterparty’s pending copy goes too');

  // (6) an unknown / never-gossiped origin is refused up front.
  const badX = await jpost('/trade/propose', { sessionId: gil.sessionId, to: 'deadbeef:cafebabe', give: [shieldM.mintKey], want: [] }, gA.base);
  check(badX.ok === false && badX.reason === 'peer-unreachable', 'a counterparty on an unknown origin is refused with a clear peer-unreachable error');

  // ── [O] §MESH-01j — consensual PvP duels (commit-reveal + DUEL:CORE) ──────
  // gil and hal are co-present on gA. The kernel is pure (lab report §6.3):
  // duelSeed = sha256(nonceA‖nonceB‖duelId) — neither party alone steers the
  // dice — and the outcome event carries everything needed to REPLAY the duel
  // and independently agree on the winner.
  console.log('\n[O] §MESH-01j — consensual PvP duels (commit-reveal, DUEL:CORE replay, forfeit)');
  const DUEL = requireCjs('../js/duel.js');

  // (1) kernel invariants: sha256 ≡ node:crypto, determinism, bounds.
  check(['', 'abc', 'ünïcode ⚔ 🗡'].every((m) => DUEL.sha256(m) === crypto.createHash('sha256').update(m, 'utf8').digest('hex')),
    'the kernel’s pure-JS sha256 agrees with node:crypto (commit hashes portable across environments)');
  const sbGil = { level: 3, hp: 44, ac: 15, atkBonus: 5, dmgDie: 8, dmgFlat: 3, abilityScores: { str: 16, dex: 12, con: 14, int: 10, wis: 12, cha: 8 } };
  const sbHal = { level: 3, hp: 40, ac: 14, atkBonus: 6, dmgDie: 6, dmgFlat: 2, abilityScores: { str: 14, dex: 14, con: 12, int: 10, wis: 10, cha: 10 } };
  const kseed = DUEL.seedOf('a'.repeat(32), 'b'.repeat(32), 'c'.repeat(32));
  check(JSON.stringify(DUEL.run(sbGil, sbHal, kseed)) === JSON.stringify(DUEL.run(sbGil, sbHal, kseed))
      && JSON.stringify(DUEL.run(sbGil, sbHal, kseed)) !== JSON.stringify(DUEL.run(sbGil, sbHal, DUEL.seedOf('9'.repeat(32), 'b'.repeat(32), 'c'.repeat(32)))),
    'DUEL.run is deterministic per seed and diverges across seeds');
  check(DUEL.checkBounds(sbGil) === null && !!DUEL.checkBounds({ ...sbGil, level: 21 }) && !!DUEL.checkBounds({ ...sbGil, dmgDie: 7 }),
    'checkBounds passes a legal statBlock and rejects impossible ones');

  // (2) handshake ordering + commit-reveal integrity.
  const halSSE = await openSSE(hal.sessionId, gA.base);
  openClients.push(halSSE);
  const du1 = await jpost('/duel/challenge', { sessionId: gil.sessionId, to: hal.ledgerPid }, gA.base);
  check(du1.ok === true && !!du1.duelId, 'a co-present same-origin challenge opens a duel');
  check(await waitFor(() => countEv(halSSE, 'duel_challenged', (d) => d.duelId === du1.duelId) === 1, 4000),
    'the challenged player is notified over SSE');
  const nGil1 = 'a1'.repeat(16), nHal1 = 'b2'.repeat(16);
  const early = await jpost('/duel/accept', { duelId: du1.duelId, sessionId: gil.sessionId, commit: DUEL.commitOf(nGil1, sbGil) }, gA.base);
  check(early.ok === false, 'the challenger cannot commit before the challenged player accepts');
  check((await jpost('/duel/accept', { duelId: du1.duelId, sessionId: hal.sessionId, commit: DUEL.commitOf(nHal1, sbHal) }, gA.base)).ok === true, 'the challenged player accepts with their commit');
  const gc1 = await jpost('/duel/accept', { duelId: du1.duelId, sessionId: gil.sessionId, commit: DUEL.commitOf(nGil1, sbGil) }, gA.base);
  check(gc1.ok === true && gc1.phase === 'revealing', 'both commits in → reveal phase');
  const doctored = await jpost('/duel/reveal', { duelId: du1.duelId, sessionId: gil.sessionId, nonce: nGil1, statBlock: { ...sbGil, atkBonus: 8 } }, gA.base);
  check(doctored.ok === false && doctored.reason === 'reveal-mismatch', 'a reveal that does not hash to its commit is rejected (commit-reveal integrity)');
  check(await waitFor(() => countEv(halSSE, 'duel_cancelled', (d) => d.duelId === du1.duelId && d.reason === 'reveal-mismatch') === 1, 4000),
    'the tampered duel dies loudly for both parties — no event is written');

  // (3) the clean duel: reveal → ONE dual-chain event, replay-agreement.
  const du2 = await jpost('/duel/challenge', { sessionId: gil.sessionId, to: hal.ledgerPid }, gA.base);
  const nGil2 = 'c3'.repeat(16), nHal2 = 'd4'.repeat(16);
  await jpost('/duel/accept', { duelId: du2.duelId, sessionId: hal.sessionId, commit: DUEL.commitOf(nHal2, sbHal) }, gA.base);
  await jpost('/duel/accept', { duelId: du2.duelId, sessionId: gil.sessionId, commit: DUEL.commitOf(nGil2, sbGil) }, gA.base);
  const rv1 = await jpost('/duel/reveal', { duelId: du2.duelId, sessionId: gil.sessionId, nonce: nGil2, statBlock: sbGil }, gA.base);
  check(rv1.ok === true && rv1.waiting === true, 'the first reveal waits for the second');
  const rv2 = await jpost('/duel/reveal', { duelId: du2.duelId, sessionId: hal.sessionId, nonce: nHal2, statBlock: sbHal }, gA.base);
  const dEvt = rv2.event;
  check(rv2.ok === true && dEvt && dEvt.kind === 'duel' && !!dEvt.chain[gil.ledgerPid] && !!dEvt.chain[hal.ledgerPid],
    'the second reveal resolves: ONE duel event linked into BOTH players’ chains');
  check(dEvt && dEvt.body.duelSeed === DUEL.seedOf(nGil2, nHal2, du2.duelId),
    'duelSeed = sha256(nonceA‖nonceB‖duelId) — neither party alone chose it');
  const replay = dEvt && DUEL.run(dEvt.body.statA, dEvt.body.statB, dEvt.body.duelSeed);
  check(replay && replay.winner === dEvt.body.winner && replay.rounds === dEvt.body.rounds,
    'REPLAY AGREEMENT: re-running DUEL:CORE from the event reproduces the recorded winner');
  check(await waitFor(() => countEv(halSSE, 'duel_completed', (d) => d.duelId === du2.duelId) === 1, 4000),
    'both parties hear duel_completed over SSE');
  check(await until(async () => {
    const ch = await jget(`/ledger/chain?pid=${gil.ledgerPid}`, gB.base);
    return (ch.events || []).some((e) => e.hash === dEvt.hash);
  }), 'the duel event replicates to a peer server over the durable ledger channel (as permanent as a trade)');

  // (4) bounds enforcement at reveal — impossible stats are refused.
  const du3 = await jpost('/duel/challenge', { sessionId: gil.sessionId, to: hal.ledgerPid }, gA.base);
  const sbCheat = { ...sbHal, level: 20, hp: 431, atkBonus: 29 };   // 1 past the level-20 caps (30+20·20 hp, 8+20 atk)
  const nC = 'e5'.repeat(16);
  await jpost('/duel/accept', { duelId: du3.duelId, sessionId: hal.sessionId, commit: DUEL.commitOf(nC, sbCheat) }, gA.base);
  await jpost('/duel/accept', { duelId: du3.duelId, sessionId: gil.sessionId, commit: DUEL.commitOf(nGil2, sbGil) }, gA.base);
  const cheat = await jpost('/duel/reveal', { duelId: du3.duelId, sessionId: hal.sessionId, nonce: nC, statBlock: sbCheat }, gA.base);
  check(cheat.ok === false && cheat.reason === 'bounds', 'an over-world-max statBlock is rejected at reveal (impossible-stats anti-cheat)');

  // (5) pvp:off + co-presence + cross-origin guards.
  const eve2 = await jpost('/session/start', { name: 'Eve2', seed: 111, playerKey: '9a9a'.repeat(8), pvp: 'off' }, gA.base);
  const pvpRef = await jpost('/duel/challenge', { sessionId: gil.sessionId, to: eve2.ledgerPid }, gA.base);
  check(pvpRef.ok === false && pvpRef.reason === 'pvp-off', 'a pvp:off player is unchallengeable');
  const frank = await jpost('/session/start', { name: 'Frank', seed: 112, playerKey: '8b8b'.repeat(8) }, gA.base);
  await jpost('/session/pos', { sessionId: frank.sessionId, r: frank.r, c: frank.c + 1 }, gA.base);
  const farRef = await jpost('/duel/challenge', { sessionId: gil.sessionId, to: frank.ledgerPid }, gA.base);
  check(farRef.ok === false && farRef.reason === 'not-co-present', 'a duel needs a shared cell (walk to them first)');
  const xoRef = await jpost('/duel/challenge', { sessionId: gil.sessionId, to: benX.ledgerPid }, gA.base);
  check(xoRef.ok === false && xoRef.reason === 'cross-origin', 'cross-origin duels are refused clearly (same-server v1)');

  // (6) forfeit: walking off the duel cell mid-handshake loses on the record —
  // and the STEP IS NEVER REFUSED (Free-Movement holds absolutely).
  const du4 = await jpost('/duel/challenge', { sessionId: gil.sessionId, to: hal.ledgerPid }, gA.base);
  const nG4 = 'f6'.repeat(16), nH4 = 'a7'.repeat(16);
  await jpost('/duel/accept', { duelId: du4.duelId, sessionId: hal.sessionId, commit: DUEL.commitOf(nH4, sbHal) }, gA.base);
  await jpost('/duel/accept', { duelId: du4.duelId, sessionId: gil.sessionId, commit: DUEL.commitOf(nG4, sbGil) }, gA.base);
  const flee = await jpost('/session/pos', { sessionId: hal.sessionId, r: gil.r, c: gil.c + 1 }, gA.base);
  check(flee.ok === true, 'the fleeing step itself succeeds — a duel never gates movement');
  check(await waitFor(() => countEv(halSSE, 'duel_completed', (d) => d.duelId === du4.duelId && d.event && d.event.body.forfeit === true && d.event.body.winner === gil.ledgerPid) === 1, 4000),
    'the walk-off resolves as a forfeit: the stayer wins on the record');

  // (7) TTL: a challenge nobody answers expires (fast-TTL throwaway server).
  const dT = await startServer(PORT + 36, { LEDGER_DIR: fs.mkdtempSync(path.join(tmp, 'r2h-duelttl-')), MESH_SERVER_ID: '2e'.repeat(16), DUEL_TTL_MS: '250', PEERS_CACHE_FILE: path.join(tmp, `r2h-peers-${PORT + 36}-${process.pid}.json`) });
  const tia = await jpost('/session/start', { name: 'Tia', seed: 5, playerKey: '7c7c'.repeat(8) }, dT.base);
  const uri = await jpost('/session/start', { name: 'Uri', seed: 6, playerKey: '6d6d'.repeat(8) }, dT.base);
  const duT = await jpost('/duel/challenge', { sessionId: tia.sessionId, to: uri.ledgerPid }, dT.base);
  await sleep(450);
  const late = await jpost('/duel/accept', { duelId: duT.duelId, sessionId: uri.sessionId, commit: DUEL.commitOf('5e'.repeat(16), sbHal) }, dT.base);
  check(late.ok === false, 'an unanswered challenge expires at the TTL');

  // ── [P] §MESH-01-FU 8 — ingress rate limiting (per-IP token bucket) ───────
  // The unauthenticated server↔server POSTs (gossip/announce/sync/ingest/relay)
  // are metered per IP BEFORE the body is read: a flood gets a flat
  // {reason:'rate'} 429, while GETs, client-facing routes, and well-behaved
  // peers (one gossip per MESH_GOSSIP_MS) are never touched. Tight limits via
  // env so the flood fits in a test.
  console.log('\n[P] §MESH-01-FU 8 — ingress rate limiting (per-IP token bucket before JSON parse)');
  const rl = await startServer(PORT + 37, {
    MESH_RATE_LIMIT: '5', MESH_RATE_BURST: '8', MESH_SERVER_ID: '3f'.repeat(16),
    LEDGER_DIR: fs.mkdtempSync(path.join(tmp, 'r2h-rate-')),
    PEERS_CACHE_FILE: path.join(tmp, `r2h-peers-${PORT + 37}-${process.pid}.json`),
  });
  const g1 = await jpost('/mesh/gossip', { serverId: 'zz' }, rl.base);
  check(g1.ok === false && g1.reason !== 'rate', 'inside the burst budget a bad gossip is refused by the real gate (compat), not the bucket');
  const flood = [];
  for (let i = 0; i < 30; i++) flood.push(await jpost('/mesh/gossip', { serverId: 'zz' }, rl.base));
  check(flood.filter((r) => r.reason === 'rate').length >= 15 && flood[flood.length - 1].reason === 'rate',
    'a 30-POST flood drains the 8-token bucket and the tail is flat-refused with reason:rate');
  check((await jpost('/tracker/announce', {}, rl.base)).reason === 'rate', 'tracker/announce shares the drained per-IP bucket (refused before field validation)');
  check((await jpost('/tracker/sync', {}, rl.base)).reason === 'rate', 'tracker/sync shares it');
  check((await jpost('/ledger/sync', {}, rl.base)).reason === 'rate', 'ledger/sync shares it');
  check((await jpost('/ledger/ingest', {}, rl.base)).reason === 'rate', 'ledger/ingest shares it');
  check((await jpost('/trade/relay', {}, rl.base)).reason === 'rate', 'trade/relay shares it');
  const rai = await jpost('/session/start', { name: 'Rai', seed: 9 }, rl.base);
  check(!!rai.sessionId, 'session/start still works on an empty bucket — players are never rate limited');
  const rst = await jget('/mesh/status', rl.base);
  check(rst.ok === true && rst.rate && rst.rate.limit === 5 && rst.rate.burst === 8,
    'GET routes still serve while drained; mesh/status surfaces the configured limits');
  const rateRows = rst.traffic.filter((t) => t.kind === 'rate');
  check(rateRows.length >= 1 && rateRows.length <= 2 && rateRows.every((t) => t.ok === false),
    'the traffic ring records the flood — throttled to ~one row, not one per dropped packet');
  await sleep(1300);   // 5 tokens/s refill → ~6 tokens back
  const g2 = await jpost('/mesh/gossip', { serverId: 'zz' }, rl.base);
  check(g2.reason !== 'rate', 'the bucket refills — a peer that backs off is served again about a second later');

  // ════════ (q) §MESH-01-FU 11–13 — ACL template · tracker persistence +
  // federation bootstrap · chat backlog on join ════════
  console.log('\n[Q] §MESH-01-FU 11–13 — ACL template · tracker cache + federation bootstrap · chat backlog');

  // FU 11 — the committed template must be valid JSON that keeps the mesh open verbatim.
  const aclEx = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'mesh-acl.json.example'), 'utf8'));
  check(aclEx.mode === 'open'
    && ['blockServerIds', 'blockIps', 'blockWorldHashes', 'allowServerIds', 'allowIps', 'allowWorldHashes']
      .every((k) => Array.isArray(aclEx[k]) && aclEx[k].length === 0),
    'mesh-acl.json.example is valid JSON: mode open + all six allow/block lists present and empty (safe to copy verbatim)');
  const aclQ = path.join(tmp, `r2h-acl-example-${process.pid}.json`);
  fs.copyFileSync(path.join(ROOT, 'config', 'mesh-acl.json.example'), aclQ);
  const mQ2 = await startServer(PORT + 38, mkEnv(PORT + 38, '6f'.repeat(16), { MESH_ACL_FILE: aclQ }));
  check((await jget('/mesh/status', mQ2.base)).acl.mode === 'open', 'a server running the copied template reports acl mode open');
  await sleep(20);
  fs.writeFileSync(aclQ, '{ mode: allowlist ');   // malformed on purpose
  check((await jget('/mesh/status', mQ2.base)).acl.mode === 'open', 'a malformed ACL file fails OPEN (the documented caveat), never half-applied');
  await waitFor(() => /MESH ACL/.test(mQ2.stderr), 2000);
  check(/MESH ACL/.test(mQ2.stderr) && /OPEN/.test(mQ2.stderr), 'the malformed-ACL fallback is warned loudly on the server console');

  // FU 12 — announce-table persistence: the announcer speaks exactly ONCE (600s
  // cadence), so anything served after the tracker restart can only be the cache.
  const trkCache = path.join(tmp, `r2h-trkcache-${process.pid}-${PORT + 39}.json`);
  fs.rmSync(trkCache, { force: true });
  const trkEnvQ = { TRACKER_MODE: '1', MESH_SERVER_ID: '7a'.repeat(16), TRACKER_PERSIST_MS: '100',
    TRACKER_CACHE_FILE: trkCache, PEERS_CACHE_FILE: path.join(tmp, `r2h-peers-${process.pid}-${PORT + 39}.json`) };
  let trkQ = await startServer(PORT + 39, trkEnvQ);
  await startServer(PORT + 40, mkEnv(PORT + 40, '8b'.repeat(16), { TRACKER_URL: trkQ.base, MESH_ANNOUNCE_MS: '600000' }));
  await waitFor(() => { try { return (JSON.parse(fs.readFileSync(trkCache, 'utf8')).records || []).length >= 1; } catch { return false; } }, 5000, 50);
  let cacheJ = {}; try { cacheJ = JSON.parse(fs.readFileSync(trkCache, 'utf8')); } catch {}
  check((cacheJ.records || []).some((r) => r.addr === `localhost:${PORT + 40}`),
    'the tracker persists its announce table to TRACKER_CACHE_FILE (throttled, dirty-flagged)');
  trkQ.proc.kill('SIGTERM');
  await waitFor(() => trkQ.proc.exitCode !== null, 3000);
  trkQ = await startServer(PORT + 39, trkEnvQ);
  const tpQ = await jget(`/tracker/peers?wh=${manA.worldHash}`, trkQ.base);
  check(tpQ.count >= 1 && (tpQ.servers || []).some((sv) => sv.addr === `localhost:${PORT + 40}`),
    'a restarted tracker serves the table from the cache immediately — no re-announce needed');

  // FU 12 — federation bootstrap: a tracker wired ONLY by a `tracker <url>`
  // text-file line (no --tracker-peer flag) still federates.
  const bootSrv = http.createServer((_q, sres) => { sres.setHeader('Content-Type', 'text/plain'); sres.end(`# r2h bootstrap\ntracker ${trkQ.base}\n`); });
  await new Promise((r) => bootSrv.listen(PORT + 42, '127.0.0.1', r));
  const trkR = await startServer(PORT + 41, { TRACKER_MODE: '1', MESH_SERVER_ID: '9c'.repeat(16), MESH_ANNOUNCE_MS: '150',
    BOOTSTRAP_URLS: `http://127.0.0.1:${PORT + 42}/boot.txt`,
    TRACKER_CACHE_FILE: path.join(tmp, `r2h-trkcache-${process.pid}-${PORT + 41}.json`),
    PEERS_CACHE_FILE: path.join(tmp, `r2h-peers-${process.pid}-${PORT + 41}.json`) });
  let fedSeen = false;
  for (let i = 0; i < 40 && !fedSeen; i++) {
    await sleep(150);
    fedSeen = (((await jget(`/tracker/peers?wh=${manA.worldHash}`, trkR.base)).servers) || []).some((sv) => sv.addr === `localhost:${PORT + 40}`);
  }
  check(fedSeen, 'a tracker bootstrapped only by a text file (tracker <url> line) federates and merges the peer tracker’s table');
  check(((await jget('/mesh/status', trkR.base)).federationPeers || []).includes(trkQ.base),
    'mesh/status on a tracker lists its federation peers (bootstrap-fed ones included)');
  bootSrv.close();

  // FU 13 — chat backlog on join: cell-scoped history on the one look surface.
  const saya = await jpost('/session/start', { name: 'Saya', seed: 131 });
  await jpost('/session/say', { sessionId: saya.sessionId, msg: 'backlog-one' });
  await jpost('/session/say', { sessionId: saya.sessionId, msg: 'backlog-two' });
  const newt = await jpost('/session/start', { name: 'Newt', seed: 132 });
  const tailQ = (newt.chat || []).slice(-2);
  check(tailQ.length === 2 && tailQ[0].msg === 'backlog-one' && tailQ[1].msg === 'backlog-two' && tailQ.every((l) => l.name === 'Saya'),
    'session/start replays the last chat lines at the spawn cell, oldest→newest, attributed (join context)');
  const lookQ = await jget(`/session/look?sessionId=${newt.sessionId}`);
  check(JSON.stringify((lookQ.chat || []).slice(-2)) === JSON.stringify(tailQ), 'look serves the same backlog (one look surface, no per-route drift)');
  const newtE = await jpost('/session/move', { sessionId: newt.sessionId, dir: 'E' });   // hub → BMA
  check((newtE.chat || []).some((l) => l.msg === 'slums-solo') && !(newtE.chat || []).some((l) => /backlog-/.test(l.msg)),
    'backlog is cell-scoped: BMA replays its own earlier chat, never the hub’s');
  // Cross-server: Ben's [E] hub chat on server B must reach a fresh joiner's
  // backlog on server A, tagged with its origin.
  const lateQ = await jpost('/session/start', { name: 'LateQ', seed: 133 }, mA.base);
  check((lateQ.chat || []).some((l) => l.msg === 'cross-server-hello' && l.server === 'b'.repeat(8)),
    'cross-server chat lands in the backlog too, tagged with its origin server');
  await jpost('/session/end', { sessionId: saya.sessionId });
  await jpost('/session/end', { sessionId: newt.sessionId });
  await jpost('/session/end', { sessionId: lateQ.sessionId }, mA.base);

  // ════════ (r) §MESH-02a — ACL editor endpoints + opt-in blocklist share ════════
  // Dedicated server on a scratch MESH_ACL_FILE. GET serves safe defaults with
  // no file; PUT merge-writes (validated, deduped, trimmed, operator comment
  // keys survive) and the file lands on disk; GET /api/mesh/blocklist is 403
  // not-shared until the D3 shareBlocklist opt-in flips it to 200 (ACL
  // hot-reloads via mtime — no restart between the flip and the read). Design:
  // lab-reports/lab-report-mesh02-connections-ui.md §3.1.
  console.log('\n[R] §MESH-02a — mesh ACL GET/PUT + blocklist 403→200 share flip');
  const aclR2 = path.join(tmp, `r2h-acl-mesh02-${process.pid}.json`);
  fs.rmSync(aclR2, { force: true });
  const mR2 = await startServer(PORT + 43, mkEnv(PORT + 43, '5a'.repeat(16), { MESH_ACL_FILE: aclR2 }));
  const ACL_LISTS = ['blockServerIds', 'blockIps', 'blockWorldHashes', 'allowServerIds', 'allowIps', 'allowWorldHashes'];

  // R1 — GET with no file on disk: defaults, never an error.
  const acl0 = await jget('/mesh/acl', mR2.base);
  check(acl0.ok === true && acl0.exists === false && acl0.acl.mode === 'open' && acl0.acl.shareBlocklist === false,
    'GET with no ACL file → exists:false, mode open, share off (defaults, not an error)');
  check(ACL_LISTS.every((k) => Array.isArray(acl0.acl[k]) && acl0.acl[k].length === 0),
    'all six allow/block lists default to empty arrays');

  // R2 — PUT roundtrip: the response echoes the merged ACL, the file is written.
  const put1 = await jput('/mesh/acl', { mode: 'allowlist', blockIps: [' 9.9.9.9 ', '9.9.9.9', '8.8.8.8'] }, mR2.base);
  check(put1.ok === true && put1.acl.mode === 'allowlist' && JSON.stringify(put1.acl.blockIps) === '["9.9.9.9","8.8.8.8"]',
    'PUT echoes the merged ACL with entries trimmed + deduped');
  const disk1 = JSON.parse(fs.readFileSync(aclR2, 'utf8'));
  check(disk1.mode === 'allowlist' && JSON.stringify(disk1.blockIps) === '["9.9.9.9","8.8.8.8"]',
    'the PUT is persisted to the scratch MESH_ACL_FILE on disk');
  // Merge-write: an operator's comment key survives a later unrelated PUT.
  disk1['// note'] = 'operator comment';
  fs.writeFileSync(aclR2, JSON.stringify(disk1, null, 2));
  await sleep(20);   // distinct mtimeMs for the hot-reload stat
  const put2 = await jput('/mesh/acl', { mode: 'open' }, mR2.base);
  check(put2.ok === true && put2.acl.mode === 'open' && JSON.stringify(put2.acl.blockIps) === '["9.9.9.9","8.8.8.8"]',
    'a later PUT merges over the file — untouched fields survive');
  check(JSON.parse(fs.readFileSync(aclR2, 'utf8'))['// note'] === 'operator comment',
    'operator comment keys in the file survive the merge-write');
  const aclNow = await jget('/mesh/acl', mR2.base);
  check(aclNow.exists === true && aclNow.acl.mode === 'open', 'GET reflects the round-tripped file (exists:true)');

  // R3 — validation 400s (status via raw fetch; jput strips it).
  const putRaw = async (body) => (await fetch(mR2.base + '/api/mesh/acl',
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).status;
  check(await putRaw({ mode: 'banhammer' }) === 400, 'PUT a bad mode → 400');
  check(await putRaw({ frobnicate: true }) === 400, 'PUT an unknown field → 400');
  check(await putRaw({ shareBlocklist: 'yes' }) === 400, 'PUT a non-boolean shareBlocklist → 400');
  check(await putRaw({ blockIps: 'not-an-array' }) === 400, 'PUT a non-array list → 400');
  check(await putRaw({ blockIps: ['ok', ''] }) === 400, 'PUT a list holding an empty string → 400');
  check(JSON.parse(fs.readFileSync(aclR2, 'utf8')).mode === 'open', 'no rejected PUT touched the file');

  // R4 — blocklist share flip: 403 by default, 200 after the opt-in, 403 again off.
  const bl403 = await fetch(mR2.base + '/api/mesh/blocklist');
  check(bl403.status === 403 && (await bl403.json()).reason === 'not-shared',
    'blocklist is NOT shared by default — 403 not-shared (D2/D3: share-out is opt-in)');
  await sleep(20);
  await jput('/mesh/acl', { shareBlocklist: true, blockServerIds: ['badid1', 'badid2'], blockWorldHashes: ['deadhash'] }, mR2.base);
  const bl200 = await fetch(mR2.base + '/api/mesh/blocklist');
  const blJ = await bl200.json();
  check(bl200.status === 200 && blJ.ok === true,
    'after the PUT share flip the blocklist serves 200 (ACL hot-reload, no restart)');
  check(JSON.stringify(blJ.blockServerIds) === '["badid1","badid2"]'
    && JSON.stringify(blJ.blockIps) === '["9.9.9.9","8.8.8.8"]'
    && JSON.stringify(blJ.blockWorldHashes) === '["deadhash"]',
    'the shared payload carries exactly the three block* lists');
  check(blJ.serverId === '5a'.repeat(16) && typeof blJ.engineVer === 'string' && blJ.engineVer.length > 0
    && !('allowServerIds' in blJ),
    'the payload is attributed (full serverId + engineVer) and never leaks the allow* lists');
  await sleep(20);
  await jput('/mesh/acl', { shareBlocklist: false }, mR2.base);
  check((await fetch(mR2.base + '/api/mesh/blocklist')).status === 403, 'flipping the share back off restores the 403');
  fs.rmSync(aclR2, { force: true });

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
