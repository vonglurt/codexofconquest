// SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com
'use strict';
// mesh.js — §MESH-01 server↔server mesh layer, extracted from wbapi-server.js
// (§MESH-01-REVIEW; the mover.js/rooms.js precedent). ACL · ingress rate
// limiting · presence gossip · tracker announce/rendezvous · tracker
// federation · bootstrap ladder. Design: lab-reports/lab-report-mesh-multiuser.md
// + lab-reports/lab-report-mesh-sync-architecture.md; operator docs:
// wbapi-help.md §Mesh API.
//
// Load-bearing invariant (rule): every presence record is SINGLE-WRITER — only
// the origin server mutates its own sessions; event id = (originServerId,
// per-origin seq), version-vector dedup; anti-entropy pulls missing ranges.
// Presence is display-only — the mover never consults it (Free-Movement).
//
// Factory: require('./mesh')(deps) returns the mesh surface; wbapi-server.js
// destructures the SAME symbol names back so every call site is unchanged.
// deps (all live server surfaces, defined before the factory call):
//   PORT, BIND_ADDR, SERVER_NAME           — startup scalars
//   SESSIONS                               — live local-session Map (read-only here)
//   getManifest(), getServerId()           — compatibility identity (proto/engineVer/worldHash)
//   broadcastCell(r,c,ev,data,excludeId)   — SSE fanout to co-located local sessions
//   broadcastAll(ev,data,excludeId)        — SSE fanout to every local session
//   pushChat(entry)                        — §MESH-01-FU 13 chat backlog ring
//   ledgerVVObj(), ledgerSyncWith(addr,vv) — §MESH-01i durable-ledger anti-entropy hooks

const fs = require('fs');
const path = require('path');

// The one styled operator warning this module emits (ACL parse failure).
const C = { bold: '\x1b[1m', yellow: '\x1b[33m', reset: '\x1b[0m' };

module.exports = function createMesh({
  PORT, BIND_ADDR, SERVER_NAME, SESSIONS,
  getManifest, getServerId,
  broadcastCell, broadcastAll, pushChat,
  ledgerVVObj, ledgerSyncWith,
}) {

// ACL — mesh-acl.json (repo root, hot-reloaded on mtime change). Applied to
// gossip ingress, gossip responses, and dial-out. mode:'allowlist' = private
// friends mesh; default open with empty blocklists.
const ACL_FILE = process.env.MESH_ACL_FILE || path.join(__dirname, 'mesh-acl.json');
let _aclMtime = -1, _acl = null;
function getAcl() {
  try {
    const st = fs.statSync(ACL_FILE);
    if (st.mtimeMs !== _aclMtime) {
      _aclMtime = st.mtimeMs;
      // §MESH-01-FU 11: a file that EXISTS but fails to parse must not silently
      // open a mesh its operator believes is allowlisted — warn once per change.
      try { _acl = JSON.parse(fs.readFileSync(ACL_FILE, 'utf8')); }
      catch (e) {
        _acl = null;
        console.warn(`${C.bold}${C.yellow}  ⚠ MESH ACL:${C.reset}${C.yellow} ${path.basename(ACL_FILE)} exists but is not valid JSON (${e.message}) — ACL DISABLED, mesh is OPEN. Template: mesh-acl.json.example${C.reset}`);
      }
    }
  } catch { _acl = null; _aclMtime = -1; }
  return _acl || { mode: 'open' };
}
function aclAllows({ serverId, ip, worldHash }) {
  const a = getAcl();
  const has = (arr, v) => Array.isArray(arr) && v != null && arr.includes(v);
  if (has(a.blockServerIds, serverId) || has(a.blockIps, ip) || has(a.blockWorldHashes, worldHash)) return false;
  if (a.mode === 'allowlist')
    return has(a.allowServerIds, serverId) || has(a.allowIps, ip) || has(a.allowWorldHashes, worldHash);
  return true;
}

// §MESH-01-FU 8 — ingress rate limiting. The server↔server mesh POSTs
// (mesh/gossip, tracker/announce, tracker/sync, ledger/sync, ledger/ingest,
// trade/relay) are unauthenticated by design (the ACL needs the PARSED
// serverId), so each is metered by a per-IP token bucket checked BEFORE the
// body is read — a flood costs a flat 429 {reason:'rate'} instead of JSON
// parse + merge work. Healthy cadence for scale: one gossip POST per peer per
// MESH_GOSSIP_MS (2 s default) ≈ 0.5 token/s, so the defaults leave ~60×
// headroom even with several peers sharing one IP (a LAN, or the test
// harness's localhost fleet at MESH_GOSSIP_MS=120).
// MESH_RATE_LIMIT tokens/s sustained (default 30; 0 disables) ·
// MESH_RATE_BURST bucket capacity (default 120).
const MESH_RATE_LIMIT = (() => { const v = parseFloat(process.env.MESH_RATE_LIMIT); return Number.isFinite(v) ? Math.max(0, v) : 30; })();
const MESH_RATE_BURST = parseInt(process.env.MESH_RATE_BURST || '', 10) || 120;
const RATE_BUCKETS = new Map(); // ip → {tokens, last, warnedAt}
function meshRateAllows(ip) {
  if (!MESH_RATE_LIMIT) return true;
  const now = Date.now();
  let b = RATE_BUCKETS.get(ip);
  if (!b) {
    // TCP source addresses are hard to spoof; cap the table anyway so it can't balloon
    if (RATE_BUCKETS.size >= 10_000) RATE_BUCKETS.delete(RATE_BUCKETS.keys().next().value);
    RATE_BUCKETS.set(ip, b = { tokens: MESH_RATE_BURST, last: now, warnedAt: 0 });
  }
  b.tokens = Math.min(MESH_RATE_BURST, b.tokens + ((now - b.last) / 1000) * MESH_RATE_LIMIT);
  b.last = now;
  if (b.tokens >= 1) { b.tokens -= 1; return true; }
  if (now - b.warnedAt > 5000) { // one traffic-ring row per flood, not one per dropped packet
    b.warnedAt = now;
    pushTraffic('in', 'rate', ip, false, `rate limited (sustained > ${MESH_RATE_LIMIT}/s, burst ${MESH_RATE_BURST})`);
  }
  return false;
}

// Mesh state. peers: addr → liveness/identity. remote: originId → replicated
// read-only session map. vv: originId → highest event seq ingested. log: this
// server's own outbound event ring (we are the single writer of these).
const MESH = {
  peers: new Map(), remote: new Map(), vv: {}, log: [], seq: 0,
  traffic: [],   // §MESH-01 UI: ring of recent packets {ts, dir:'in'|'out', kind, peer, ok, note}
};
function pushTraffic(dir, kind, peer, ok, note) {
  MESH.traffic.push({ ts: Date.now(), dir, kind, peer: String(peer || '').slice(0, 60), ok: !!ok, note: String(note || '').slice(0, 120) });
  if (MESH.traffic.length > 200) MESH.traffic.shift();
}
const MESH_GOSSIP_MS  = parseInt(process.env.MESH_GOSSIP_MS || '', 10) || 2000;
const MESH_ORIGIN_TTL = 90_000;        // drop a remote origin after 90 s of silence
const MESH_FANOUT_MAX_AGE = 10_000;    // replayed history advances vv but is not re-announced
const PEERS_CACHE_FILE = process.env.PEERS_CACHE_FILE || path.join(__dirname, 'peers-cache.json');
const ADVERTISE_ADDR = process.env.ADVERTISE_ADDR
  || process.argv.find((a, i) => process.argv[i-1] === '--advertise')
  || '';
function meshAdvertise() { return ADVERTISE_ADDR || ('localhost:' + PORT); }

// §MESH-01-FU 1 — a mesh is CONFIGURED (peers/trackers/federation) but this
// server is unreachable from another machine: loopback bind means nobody can
// dial in, and a localhost advertise addr means gossip/announce hands peers a
// dial-back address that points at THEIR OWN machine. Warned at startup and
// surfaced in GET /api/mesh/status.reachability (Mesh tab).
function meshConfigured() {
  return MESH.peers.size > 0 || TRACKER_URLS.length > 0
    || MESH_TRACKER_URLS.length > 0 || TRACKER_PEER_URLS.length > 0
    || !!(process.env.BOOTSTRAP_URLS || '').trim();
}
function meshReachabilityWarnings() {
  if (!meshConfigured()) return [];
  const warnings = [];
  if (/^(127\.|localhost$|::1$)/.test(BIND_ADDR))
    warnings.push(`bind is loopback (${BIND_ADDR}) — remote machines cannot reach this server. Start with --bind 0.0.0.0 (or BIND_ADDR=0.0.0.0).`);
  if (!TRACKER_MODE && /^(localhost:|127\.|\[::1\])/.test(meshAdvertise()))
    warnings.push(`advertise addr is ${meshAdvertise()} — peers/trackers will be told to dial localhost (their own machine). Set --advertise <lan-ip>:${PORT} (or ADVERTISE_ADDR).`);
  return warnings;
}

function emitMeshEvent(type, data, r, c) {
  MESH.seq++;
  MESH.log.push({ seq: MESH.seq, ts: Date.now(), type, data, r, c });
  if (MESH.log.length > 500) MESH.log.shift();
}
function localSnapshot() {
  // p8 — §MESH-01i cross-origin trades: the durable identity half rides the
  // presence snapshot so remote rosters can offer the ⇄ trade target
  // (ledgerPid = origin8:p8). Presence itself stays session-keyed/display-only.
  return { seq: MESH.seq, sessions: [...SESSIONS.values()].map((s) => ({ sid: s.id, name: s.playerName, r: s.r, c: s.c, p8: s.player8 || null })) };
}
function remotePlayersAt(r, c) {
  const out = [], now = Date.now();
  for (const [oid, rec] of MESH.remote) {
    if (now - rec.lastSeen > MESH_ORIGIN_TTL) continue;
    for (const [sid, p] of rec.sessions)
      if (p.r === r && p.c === c) out.push({ id: `${oid.slice(0, 8)}:${sid.slice(0, 8)}`, pid: `${oid.slice(0, 8)}:${sid.slice(0, 8)}`, name: p.name, server: oid.slice(0, 8),
        ...(p.p8 ? { ledgerPid: `${oid.slice(0, 8)}:${p.p8}` } : {}) });   // §MESH-01i: cross-origin trade target
  }
  return out;
}
// §MESH-01i cross-origin trades: resolve a pid's origin8 to a dialable peer
// (freshest gossip win). Trades relay server↔server, so an origin we have
// never successfully gossiped with is not a valid trade counterparty yet.
function meshAddrForOrigin8(o8) {
  let best = null;
  for (const [addr, rec] of MESH.peers)
    if (rec.serverId && rec.serverId.slice(0, 8) === o8 && rec.lastSeen && (!best || rec.lastSeen > best.lastSeen))
      best = { addr, serverId: rec.serverId, lastSeen: rec.lastSeen };
  return best;
}
function meshMergeEvents(originId, events) {
  const now = Date.now();
  let last = MESH.vv[originId] || 0;
  for (const ev of (events || []).slice().sort((a, b) => a.seq - b.seq)) {
    if (!ev || typeof ev.seq !== 'number' || ev.seq <= last) continue;
    last = ev.seq;
    // Fan fresh remote events out to co-located LOCAL sessions only; replayed
    // history still advances the version vector (dedup) but stays silent.
    // §MESH-01-FU 4: player_moved is the display-layer exception — worldwide.
    if (now - (ev.ts || 0) <= MESH_FANOUT_MAX_AGE) {
      if (ev.type === 'player_moved')
        broadcastAll(ev.type, { ...ev.data, remote: true, server: originId.slice(0, 8) }, null);
      else if (['player_arrived', 'player_left', 'chat'].includes(ev.type)) {
        broadcastCell(ev.r, ev.c, ev.type, { ...ev.data, remote: true, server: originId.slice(0, 8) }, null);
        // §MESH-01-FU 13: fresh cross-server chat joins the backlog ring too —
        // replayed history stays out (vv already advanced past it once).
        if (ev.type === 'chat')
          pushChat({ ts: ev.ts || now, name: ev.data.name, msg: ev.data.msg, r: ev.r, c: ev.c, server: originId.slice(0, 8) });
      }
    }
  }
  MESH.vv[originId] = last;
}
function meshMergeSnapshot(originId, snap) {
  if (!snap || typeof snap.seq !== 'number') return;
  let rec = MESH.remote.get(originId);
  if (!rec) { rec = { sessions: new Map(), snapSeq: -1, lastSeen: 0 }; MESH.remote.set(originId, rec); }
  if (snap.seq < rec.snapSeq) return;   // stale snapshot from an older round
  rec.snapSeq = snap.seq;
  rec.lastSeen = Date.now();
  rec.sessions = new Map((snap.sessions || []).map((s) => [s.sid, { name: s.name, r: s.r, c: s.c, p8: s.p8 || null }]));
}
function meshPayload() {
  const m = getManifest();
  return {
    serverId: getServerId(), proto: m.proto, engineVer: m.engineVer, worldHash: m.worldHash,
    addr: meshAdvertise(), vv: MESH.vv,
    events: MESH.log.slice(-100), snapshot: localSnapshot(),
    peers: [...MESH.peers.keys()].slice(0, 20),
    ledgerVV: ledgerVVObj(),   // §MESH-01i slice 2: advertises the durable-chain frontier; a mismatch triggers anti-entropy
  };
}
// Ingest one gossip payload (from an inbound POST or an outbound round's
// response). Compatibility gate first, ACL second, then single-writer merge.
function meshIngest(p, ip) {
  const m = getManifest();
  const from = (p && p.addr) || ip;
  if (!p || p.proto !== m.proto || p.engineVer !== m.engineVer || p.worldHash !== m.worldHash) {
    pushTraffic('in', 'gossip', from, false, `refused: incompatible (${p && p.engineVer}/${String(p && p.worldHash).slice(0, 8)})`);
    return { status: 409, body: { ok: false, reason: 'incompatible', want: { proto: m.proto, engineVer: m.engineVer, worldHash: m.worldHash } } };
  }
  if (!p.serverId || p.serverId === getServerId())
    return { status: 400, body: { ok: false, reason: 'bad-serverId' } };
  if (!aclAllows({ serverId: p.serverId, ip, worldHash: p.worldHash })) {
    pushTraffic('in', 'gossip', from, false, `refused: ACL (${String(p.serverId).slice(0, 8)})`);
    return { status: 403, body: { ok: false, reason: 'acl' } };
  }
  pushTraffic('in', 'gossip', from, true, `${(p.events || []).length} ev · snap ${(p.snapshot && p.snapshot.sessions || []).length} · ${(p.peers || []).length} px · ${String(p.serverId).slice(0, 8)}`);
  if (p.addr && p.addr !== meshAdvertise()) {
    const rec = MESH.peers.get(p.addr) || {};
    MESH.peers.set(p.addr, { ...rec, serverId: p.serverId, lastSeen: Date.now(), lastErr: null });
  }
  meshMergeEvents(p.serverId, p.events);
  meshMergeSnapshot(p.serverId, p.snapshot);
  for (const a of p.peers || [])
    if (typeof a === 'string' && a && a !== meshAdvertise() && !MESH.peers.has(a))
      MESH.peers.set(a, { serverId: null, lastSeen: 0, lastErr: null });   // PEX candidate — dialed next round
  // §MESH-01i slice 2: ledger anti-entropy off the inbound frontier (fire-and-
  // forget — the dialer's own round covers us if p.addr isn't dialable back).
  if (p.ledgerVV && p.addr) ledgerSyncWith(p.addr, p.ledgerVV).catch(() => {});
  return { status: 200, body: { ok: true, ...meshPayload() } };
}
let _meshRoundBusy = false;
async function meshGossipRound() {
  if (_meshRoundBusy || MESH.peers.size === 0) return;
  _meshRoundBusy = true;
  try {
    const addrs = [...MESH.peers.entries()]
      .filter(([, rec]) => aclAllows({ serverId: rec.serverId }))
      .map(([a]) => a)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    for (const addr of addrs) {
      try {
        // Bounded dial: rounds run SERIALLY, so without a timeout one dead
        // LAN/cached peer stalls every round for the OS connect timeout
        // (~10-75 s) and starves presence sync mesh-wide (found 2026-07-06:
        // a stale peers-cache addr slowed 120 ms rounds to ~10 s).
        const resp = await fetch(`http://${addr}/api/mesh/gossip`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(meshPayload()),
          signal: AbortSignal.timeout(3000),
        });
        const data = await resp.json().catch(() => ({}));
        const rec = MESH.peers.get(addr) || {};
        if (resp.ok && data.ok && data.serverId && aclAllows({ serverId: data.serverId, worldHash: data.worldHash })) {
          MESH.peers.set(addr, { ...rec, serverId: data.serverId, lastSeen: Date.now(), lastErr: null });
          meshMergeEvents(data.serverId, data.events);
          meshMergeSnapshot(data.serverId, data.snapshot);
          for (const a of data.peers || [])
            if (typeof a === 'string' && a && a !== meshAdvertise() && !MESH.peers.has(a))
              MESH.peers.set(a, { serverId: null, lastSeen: 0, lastErr: null });
          if (data.ledgerVV) ledgerSyncWith(addr, data.ledgerVV).catch(() => {});   // §MESH-01i slice 2
          pushTraffic('out', 'gossip', addr, true, `⇄ ${(data.events || []).length} ev · snap ${(data.snapshot && data.snapshot.sessions || []).length} · ${(data.peers || []).length} px`);
        } else {
          MESH.peers.set(addr, { ...rec, lastErr: data.reason || `http-${resp.status}` });
          pushTraffic('out', 'gossip', addr, false, `refused: ${data.reason || resp.status}`);
        }
      } catch (e) {
        const rec = MESH.peers.get(addr) || {};
        const err = (e && e.name === 'TimeoutError') ? 'timeout' : (e && e.code) || 'unreachable';
        MESH.peers.set(addr, { ...rec, lastErr: err });
        pushTraffic('out', 'gossip', addr, false, err);
      }
    }
    // Expire origins that stopped heartbeating.
    const now = Date.now();
    for (const [oid, rec] of MESH.remote) if (now - rec.lastSeen > MESH_ORIGIN_TTL) MESH.remote.delete(oid);
  } finally { _meshRoundBusy = false; }
}
// Bootstrap ladder: --peer flags → MESH_PEERS env → peers-cache.json → peers.txt.
// (Tracker + BOOTSTRAP_URLS are §MESH-01d.) `tracker <url>` lines are parsed
// and held for Inc d; `#` comments ignored.
const MESH_TRACKER_URLS = [];
// §MESH-01-FU 12 — one intake for `tracker <url>` lines (peers.txt +
// BOOTSTRAP_URLS): a GAME server announces to them; a TRACKER federates with
// them (before this, tracker lines were dead in tracker mode — federation
// could only be wired by hand via --tracker-peer/TRACKER_PEERS).
function addTrackerUrl(u) {
  if (!u) return;
  const list = TRACKER_MODE ? TRACKER_PEER_URLS : MESH_TRACKER_URLS;
  if (!list.includes(u)) list.push(u);
}
function loadStaticPeers() {
  const add = (a) => { if (a && /^[\w.-]+:\d+$/.test(a) && a !== meshAdvertise() && !MESH.peers.has(a)) MESH.peers.set(a, { serverId: null, lastSeen: 0, lastErr: null }); };
  process.argv.forEach((a, i) => { if (process.argv[i - 1] === '--peer') add(a); });
  (process.env.MESH_PEERS || '').split(',').map((s) => s.trim()).forEach(add);
  try { (JSON.parse(fs.readFileSync(PEERS_CACHE_FILE, 'utf8')).addrs || []).forEach(add); } catch {}
  try {
    for (const line of fs.readFileSync(path.join(__dirname, 'peers.txt'), 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      if (t.startsWith('tracker ')) { addTrackerUrl(t.slice(8).trim()); continue; }
      add(t.split(/\s+/)[0]);
    }
  } catch {}
}
let _peersCacheTimer = 0;
function persistPeerCache() {
  const now = Date.now();
  if (now - _peersCacheTimer < 30_000) return;
  _peersCacheTimer = now;
  const live = [...MESH.peers.entries()].filter(([, r]) => r.lastSeen && now - r.lastSeen < 300_000).map(([a]) => a);
  if (!live.length && !fs.existsSync(PEERS_CACHE_FILE)) return;   // never create an empty cache
  try { fs.writeFileSync(PEERS_CACHE_FILE, JSON.stringify({ savedAt: new Date().toISOString(), addrs: live }, null, 2)); } catch {}
}
// ── §MESH-01d: tracker — rendezvous only, NEVER a relay ─────────────────────
// A tracker is a ROLE of this same codebase (`--tracker-mode` serves only
// ping/manifest/tracker routes). It groups announcements by the full
// compatibility identity (proto, engineVer, worldHash) so incompatible servers
// are segregated into separate world groups — they can see their own group,
// never each other's. The mesh survives tracker death (gossip + peer cache).
const TRACKER_MODE = process.env.TRACKER_MODE === '1' || process.argv.includes('--tracker-mode');
const TRACKER = new Map();   // serverId → {addr, proto, engineVer, worldHash, playerCount, name, lastSeen}
const TRACKER_TTL = parseInt(process.env.TRACKER_TTL_MS || '', 10) || 120_000;
function trackerSweep() {
  const now = Date.now();
  for (const [id, r] of TRACKER) if (now - r.lastSeen > TRACKER_TTL) TRACKER.delete(id);
}
// §MESH-01-FU 12 — announce-table persistence. Belt-and-braces: servers
// re-announce every ≤30 s anyway, so the cache only matters in the window
// right after a QUICK tracker restart — peers are served immediately instead
// of an empty table. Records are saved with ageMs and re-aged by the tracker's
// downtime on load, so a long outage honestly expires them (stale addrs are
// junk, not history). Throttled + dirty-flagged: an idle tracker writes nothing.
const TRACKER_CACHE_FILE = process.env.TRACKER_CACHE_FILE || path.join(__dirname, 'tracker-cache.json');
const TRACKER_PERSIST_MS = parseInt(process.env.TRACKER_PERSIST_MS || '', 10) || 30_000;
let _trackerDirty = false;
function trackerPersist() {
  if (!_trackerDirty) return;
  _trackerDirty = false;
  trackerSweep();
  if (!TRACKER.size && !fs.existsSync(TRACKER_CACHE_FILE)) return;   // never create an empty cache
  try { fs.writeFileSync(TRACKER_CACHE_FILE, JSON.stringify({ savedAt: new Date().toISOString(), records: trackerRecordsOut() }, null, 2)); } catch {}
}
function trackerLoadCache() {
  try {
    const j = JSON.parse(fs.readFileSync(TRACKER_CACHE_FILE, 'utf8'));
    const downMs = Math.max(0, Date.now() - (Date.parse(j.savedAt) || Date.now()));
    const alive = (j.records || [])
      .map((r) => ({ ...r, ageMs: (r.ageMs | 0) + downMs }))
      .filter((r) => r.ageMs < TRACKER_TTL);
    const n = trackerMergeRecords(alive, null);   // same validation + ACL as a live sync
    if (n) console.log(`  Tracker:   ${n} announce record(s) restored from ${path.basename(TRACKER_CACHE_FILE)}`);
  } catch {}
}
// §MESH-01d2 — tracker federation: an operator MANUALLY connects tracker A to
// tracker B (`--tracker-peer <url>` / TRACKER_PEERS env); the two then merge
// announce tables every round. Same single-writer discipline as gossip: each
// record is owned by the ANNOUNCING game server; freshness travels as ageMs
// (clock-skew safe) and the younger record wins. Idempotent state exchange —
// no flood loops by construction. ACL applies to every merged record.
const TRACKER_PEER_URLS = (process.env.TRACKER_PEERS || '').split(',').map((s) => s.trim()).filter(Boolean);
process.argv.forEach((a, i) => { if (process.argv[i - 1] === '--tracker-peer') TRACKER_PEER_URLS.push(a); });
const TRACKER_MAX_RECORDS = 500;   // spam backstop: updates always land, new ids drop when full
function trackerRecordsOut() {
  const now = Date.now();
  return [...TRACKER.entries()].map(([id, r]) => ({
    serverId: id, addr: r.addr, proto: r.proto, engineVer: r.engineVer, worldHash: r.worldHash,
    playerCount: r.playerCount, name: r.name, worldName: r.worldName, ageMs: now - r.lastSeen,
  }));
}
function trackerMergeRecords(records, ip) {
  const now = Date.now();
  let merged = 0;
  for (const rec of records || []) {
    if (!rec || !/^[0-9a-f]{32}$/.test(rec.serverId || '') || !/^[\w.-]+:\d+$/.test(rec.addr || '')) continue;
    if (!rec.proto || !rec.engineVer || !rec.worldHash || rec.serverId === getServerId()) continue;
    if (!aclAllows({ serverId: rec.serverId, ip, worldHash: rec.worldHash })) continue;
    const lastSeen = now - Math.max(0, Math.min(rec.ageMs | 0, TRACKER_TTL));
    const existing = TRACKER.get(rec.serverId);
    if (existing && existing.lastSeen >= lastSeen) continue;              // ours is fresher
    if (!existing && TRACKER.size >= TRACKER_MAX_RECORDS) continue;       // full — updates only
    TRACKER.set(rec.serverId, {
      addr: rec.addr, proto: rec.proto, engineVer: rec.engineVer, worldHash: rec.worldHash,
      playerCount: rec.playerCount | 0, name: String(rec.name || '').slice(0, 60),
      worldName: String(rec.worldName || '').slice(0, 40), lastSeen,
    });
    merged++;
  }
  if (merged) _trackerDirty = true;   // §MESH-01-FU 12
  return merged;
}
async function trackerFederateRound() {
  if (!TRACKER_MODE || !TRACKER_PEER_URLS.length) return;
  trackerSweep();
  for (const u of TRACKER_PEER_URLS) {
    try {
      const resp = await fetch(u.replace(/\/+$/, '') + '/api/tracker/sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: getServerId(), records: trackerRecordsOut() }),
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data.ok) {
        const merged = trackerMergeRecords(data.records, null);
        pushTraffic('out', 'federate', u, true, `⇄ sent ${TRACKER.size} · merged ${merged} back`);
      } else pushTraffic('out', 'federate', u, false, `refused: ${data.reason || resp.status}`);
    } catch (e) { pushTraffic('out', 'federate', u, false, e.code || 'unreachable'); }
  }
}

// Game-server side: announce to every configured tracker (~30 s) and merge the
// returned same-world peers into the gossip table.
const TRACKER_URLS = (process.env.TRACKER_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
process.argv.forEach((a, i) => { if (process.argv[i - 1] === '--tracker') TRACKER_URLS.push(a); });
const MESH_ANNOUNCE_MS = parseInt(process.env.MESH_ANNOUNCE_MS || '', 10) || 30_000;
async function trackerAnnounceRound() {
  if (TRACKER_MODE) return;   // a tracker doesn't announce to itself
  const urls = [...new Set([...TRACKER_URLS, ...MESH_TRACKER_URLS])];
  if (!urls.length) return;
  const m = getManifest();
  for (const u of urls) {
    try {
      const resp = await fetch(u.replace(/\/+$/, '') + '/api/tracker/announce', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: getServerId(), addr: meshAdvertise(), proto: m.proto,
          engineVer: m.engineVer, worldHash: m.worldHash, worldName: m.worldName,
          playerCount: SESSIONS.size, name: SERVER_NAME }),
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data.ok) {
        for (const p of data.peers || [])
          if (p && p.addr && p.addr !== meshAdvertise() && !MESH.peers.has(p.addr))
            MESH.peers.set(p.addr, { serverId: p.serverId || null, lastSeen: 0, lastErr: null });
        pushTraffic('out', 'announce', u, true, `${SESSIONS.size} player(s) → ${(data.peers || []).length} peer(s) back`);
      } else pushTraffic('out', 'announce', u, false, `refused: ${data.reason || resp.status}`);
    } catch (e) { pushTraffic('out', 'announce', u, false, e.code || 'unreachable'); /* mesh carries on via gossip/cache */ }
  }
}
// §MESH-01d bootstrap backup: BOOTSTRAP_URLS = comma-separated plain-text URLs
// in the peers.txt format (a GitHub Gist raw URL, a PHP echo, an scp'd file —
// any dumb host). Read-only by design: there is no write path to it.
async function fetchBootstrapUrls() {
  const urls = (process.env.BOOTSTRAP_URLS || '').split(',').map((s) => s.trim()).filter(Boolean);
  for (const u of urls) {
    try {
      const txt = await (await fetch(u)).text();
      for (const line of txt.split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        if (t.startsWith('tracker ')) { addTrackerUrl(t.slice(8).trim()); continue; }
        const a = t.split(/\s+/)[0];
        if (/^[\w.-]+:\d+$/.test(a) && a !== meshAdvertise() && !MESH.peers.has(a))
          MESH.peers.set(a, { serverId: null, lastSeen: 0, lastErr: null });
      }
      pushTraffic('in', 'bootstrap', u, true, `${MESH.peers.size} peer(s) after parse`);
    } catch (e) { pushTraffic('in', 'bootstrap', u, false, e.code || 'unreachable'); /* lower ladder rungs still apply */ }
  }
}
// ══ end §MESH-01 mesh layer ═══════════════════════════════════════════════════

// §MESH-01-FU 12 — the announce endpoint (wbapi-server.js) marks the tracker
// cache dirty on a fresh/updated record; the flag itself stays module-internal.
function trackerMarkDirty() { _trackerDirty = true; }

return {
  // state (mutated through these references by the endpoints — never reassigned)
  MESH, TRACKER,
  // config / tuning
  MESH_GOSSIP_MS, MESH_ORIGIN_TTL, MESH_ANNOUNCE_MS, MESH_RATE_LIMIT, MESH_RATE_BURST,
  TRACKER_MODE, TRACKER_TTL, TRACKER_PERSIST_MS, TRACKER_MAX_RECORDS,
  TRACKER_URLS, MESH_TRACKER_URLS, TRACKER_PEER_URLS, ACL_FILE,
  // ACL + ingress rate limit
  getAcl, aclAllows, meshRateAllows,
  // gossip mesh
  pushTraffic, meshAdvertise, meshConfigured, meshReachabilityWarnings,
  emitMeshEvent, remotePlayersAt, meshAddrForOrigin8, meshIngest, meshGossipRound,
  addTrackerUrl, loadStaticPeers, persistPeerCache, fetchBootstrapUrls,
  // tracker role (announce table · persistence · federation)
  trackerSweep, trackerPersist, trackerLoadCache, trackerMarkDirty,
  trackerRecordsOut, trackerMergeRecords, trackerFederateRound, trackerAnnounceRound,
};
};
