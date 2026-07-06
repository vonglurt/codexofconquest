<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §MESH-01: Multiuser MUD (presence rendering · self-discovering server mesh · tracker · no-dupe economy)

**Status:** 🔒 **DESIGN LOCKED (2026-07-02)** · **Inc (a) ✅ SHIPPED `acd9b77` (2026-07-02)** — client presence on one server, exactly as §3.1: 🌐 opt-in toggle + `MP` module, `POST /api/session/pos` beacon (display-only, rolls nothing), `session/start` newcomer announce, minimap ☺ dots; gates mud-harness 35 / 2-browser smoke 2/2 / navigation 29/29 / `check:walk` green. **Inc (b/c) ✅ SHIPPED `80526b1` (2026-07-02)** — identity, manifest (worldHash v2 over all 8 data collections + per-part hashes), static bootstrap ladder (`--peer`/`MESH_PEERS`/`peers.txt`/`peers-cache.json`), gossip mesh (single-writer events, version-vector dedup, snapshot anti-entropy, PEX), remote replicas in `look`/`who`/`pos`, `mesh-acl.json`, end/prune `player_left` (closes the Inc-a residue); harness [E] 13 checks. **Extended design 2 locked in plan.md §MESH-01 items 8–13** (compat identity, bootstrap text-file ladder incl. Gist-raw `BOOTSTRAP_URLS`, tracker federation, ACLs, world download + BIG WARNING + `world-diff`, magnet v2). **Inc (d) ✅ SHIPPED `d00faea` (2026-07-02)** — tracker discovery: `--tracker-mode` rendezvous role, announce/peers grouped by the full compat identity (incompatible worlds segregated), `format=txt` bootstrap output, 30 s announce heartbeat, `BOOTSTRAP_URLS` text-file pull, `./wbapi-toggle.sh tracker`; harness [F] 8 checks (56 total). **Inc (d2) ✅ SHIPPED `ca284e6` (2026-07-02)** — tracker federation (`--tracker-peer`, `POST /api/tracker/sync` anti-entropy merge, ageMs freshness, per-record ACL, 500-record backstop; harness [G] 3 checks, 60 total). **Mesh tab UI ✅ `6908504`** (`GET /api/mesh/status` + traffic ring). **Inc (d3) ✅ SHIPPED `8543e63` (2026-07-02)** — `GET /api/world/download` w/ identity headers, ⬇ world behind the BIG WARNING modal, `scripts/world-diff.js` (0/1/2 exit contract verified), magnet-v2 copy link; harness 63. **Inc (e) ✅ SHIPPED (partition-heal harness)** · **gameplay ladder (f) co-presence buffs ✅ `a07b281` · (g) hireling guide bot ✅ `26bfed0` · (h) sentry bots ✅ `ff413f6` (2026-07-06)** — all three in plan.md §MESH-01 ladder rows. **Inc (i) no-dupe economy ledger ✅ SHIPPED IN FULL (2026-07-06)** — slice 1 `5536685` (single-server mint+trade), slice 2a `87970d1` (durable identity + cross-mesh replication), slice 2b `a3836f5` (client rung), **cross-origin co-signed trades (final rung)** — data shapes §6.1–6.2/§6.4, ship records in plan.md §MESH-01 ladder row (i). **Inc (j) consensual PvP duels ✅ SHIPPED 2026-07-06 (v1)** — commit-reveal handshake, `duel.js` DUEL:CORE kernel + `check:duelparity`, dual-chain outcome events, forfeit-on-walk-off (never a mover gate); §6.3 implemented as specified. **THE §MESH-01 GAMEPLAY LADDER (f–j) IS COMPLETE.** Deferred beyond the ladder: cross-origin duels (reuse the trade relay), v1.5 per-round commit-reveal, v2 server-authoritative shared combat (own design pass).
**Parent design:** `plan.md §MESH-01` (idea logged 2026-07-01; extended same day with tracker enablement, gameplay ladder, no-dupe economy).
**Predecessors:** `lab-reports/lab-report-walk5-mud-harness.md` (§WALK-5 instanced encounters + `tests/mud-harness.mjs`, 24/24) · `lab-reports/lab-report-cell-map-mud-redesign.md` §CELL-07 (SESSIONS store + SSE broadcast) · `plan.md §NAV-01` L4 room layer (`describeCell` ROOMS:CORE) + L8 MUD parity (Inc f).

---

## 1. Summary

§MESH-01 turns the existing single-server MUD session layer into a *visible, multi-server* multiplayer game in three tiers:

1. **Presence rendering (client)** — the game client finally *consumes* the SSE stream it has never opened: "Also here: <names>" in the room output, player dots on the minimap, `say` chat in the story log. Strictly opt-in; the single-file offline game is untouched.
2. **Self-discovering server mesh** — servers with the same `worldHash` gossip presence deltas peer-to-peer (PEX for topology), with a **single-writer version-vector dedup** as the load-bearing invariant. A tiny **tracker role** (same codebase, `--tracker-mode`) is rendezvous-only; `r2h:` world magnet links bootstrap a friend's mesh.
3. **Gameplay + economy ladder** — co-presence buffs → party loot/XP share → hireling guide bots → server-side sentry bots → mint-id/hash-chained trade ledger (the Diablo-dupe fix). True shared turn-based party combat is explicitly deferred (needs a server-authoritative battle instance).

**Hard invariants preserved by construction:** Free-Movement (presence is display-only; `mover.js` and the inlined kernel never read it — `grep -nE "presence|MP\." mover.js` must stay 0) · deterministic ROOMS:CORE (`describeCell` stays pure; presence is appended at *render time*, never inside the shared room function, or the §NAV-01 rooms-parity check would break) · client-authoritative single-player (battle engine stays client-local in v1; the ledger protects *trades*, not stats).

---

## 2. Current state (ground truth, 2026-07-02, `wbapi-server.js` 9,402 lines)

| Piece | Location | Status |
|---|---|---|
| `SESSIONS` Map (`id→{id,playerName,r,c,nodeCode,state,lastSeen,seed,rngState,encounter}`) | `wbapi-server.js:65` | ✅ §CELL-07 + §WALK-5 |
| `SSE_CLIENTS` Map + `broadcastCell(r,c,event,data,excludeId)` | `wbapi-server.js:66,87` | ✅ |
| `SESSION_TTL` 30-min idle prune (+ `SESSION_TTL_MS` test override) | `wbapi-server.js:70` | ✅ |
| Per-session seeded RNG (`seededNext`, mulberry32) + `pickMonster` (flat tier weights) | `wbapi-server.js:475,490` | ✅ §WALK-5 |
| `/api/session/{who,look,events,start,move,say,end}` | `wbapi-server.js:7508–7690` | ✅ |
| Instanced encounter roll on `session/move` success (empty cell) | `wbapi-server.js:7650` | ✅ §WALK-5 Inc 2 |
| MUD harness `tests/mud-harness.mjs` (`npm run test:mud`, 24/24; CI `mud` job) | `tests/` | ✅ §WALK-5 Inc 3–4 |
| **Game client consuming the SSE stream** | — | ⛔ **0 `EventSource` refs in `roll2hit-v3.html`** — Inc (a) |
| **Server-to-server sync of any kind** | — | ⛔ Inc (b)–(e) |
| **`tracker.js` / tracker mode** | — | ⛔ no file exists — Inc (d) |
| §NAV-01 Inc f (server `look`/`move` return the L4 room object) | — | ⛔ open under §NAV-01; §MESH-01 Inc (a) does **not** depend on it |

---

## 3. Design decisions (locked)

### 3.1 Presence rendering (client) — Inc (a)

- **Opt-in connect only.** A "🌐 Multiplayer" toggle (story sheet) — enabled only when `GET /api/ping` succeeds. No WBAPI ⇒ the toggle is hidden and zero MP code runs. The single-file game stays fully offline-capable.
- **Session state is ephemeral.** `MP = {session, es, players}` is transient module state (like §NAV-01d travel state) + `sessionStorage` for reconnect. **Never persisted into `S_story`/saves** — a save file must not carry a dead sessionId.
- **Position beacon, NOT move mirroring.** The browser client is authoritative for its own movement and rolls its *own* encounters (`_enterEmptyCell`); mirroring through `POST /api/session/move` would double-roll (the server's §WALK-5 instanced roll fires there for headless MUD clients). **New endpoint `POST /api/session/pos {sessionId, r, c}`:** validates passability with the same mover world (reject sea/oob — no ghosts in the ocean), updates `s.r/s.c/s.nodeCode/lastSeen`, fires the same `player_arrived` broadcast, rolls nothing. The SP client fires it (fire-and-forget, throttled to the move rate) after every successful local step; headless MUD clients keep using `session/move` unchanged.
- **Render through the presentation layer.** "Also here: <names>" is appended by the *renderer* (`storyRender`/`_enterEmptyCell` shell) from `MP.players`, never inside `describeCell` (ROOMS:CORE must stay byte-identical client/server). Sources: `GET /api/session/look` on arrival seeds the cell's `players[]`; SSE `player_arrived`/`player_left` events update it between arrivals. Chat renders through the existing `storyMsg` channel (`💬 <name>: <msg>`); a small input posts `session/say`. Minimap: one dot per co-viewport player, drawn in `_renderMiniMap` after the fog pass.

### 3.2 Identity, worldHash, mesh — Inc (b)–(c)

- **`serverId`**: 16 random bytes hex, persisted to `.wbapi-server-id` (gitignored) on first boot.
- **`worldHash`**: SHA-256 (first 16 hex chars) over the parsed `CELL_GRID` keys + `ROAD_RUNS` + `IMPASSABLE_CELLS` literals — i.e. *the walkable world*, not the whole HTML (narrative edits must not fork the swarm). Servers mesh **only** with same-`worldHash` peers → no ghost players on non-existent cells.
- **Presence record (single-writer):** `{pid:"<originServerId>:<sessionId>", name, r, c, node, seq, ts}`. Only the origin server ever mutates its own records; replicas are read-only. Event id = `(originId, seq)` with `seq` monotonic per origin.
- **Version-vector dedup:** each server keeps `maxSeqSeen[originId]`; an incoming event with `seq ≤ maxSeqSeen[origin]` is a dup — dropped AND not re-gossiped (this + a hop TTL of 3 stops flood loops). Anti-entropy: gossip rounds exchange version vectors and pull only missing ranges. **No CRDTs/LWW needed** — there are no concurrent writers per record. Records expire when the origin stops heartbeating (TTL ~90 s).
- **Transport:** plain HTTP POST server-to-server. `POST /api/mesh/gossip {serverId, worldHash, vv, events[]}` (~2 s rounds, to 2–3 random peers) · `POST /api/mesh/peers` (PEX — exchange known-peer lists). One live `--peer host:port` bootstraps the whole mesh; topology self-heals; last-known peers cached to disk (DHT-style fallback so the mesh survives tracker death).
- **Remote players render exactly like local ones** — the client's `MP.players` merges local-session and gossiped records by `pid`; the UI never distinguishes.

### 3.3 Tracker + magnet — Inc (d)

- **A role, not a stack:** `node wbapi-server.js --tracker-mode` (or `./wbapi-toggle.sh tracker`) serves ONLY `POST /announce {serverId, host, port, worldHash, playerCount}` (~30 s heartbeat) and `GET /peers?wh=` → K random same-world live peers. Never a relay; never on the hot path.
- **World magnet link:** `r2h:?wh=<worldHash>&tr=<trackerURL>` — `wh` plays the infohash role (identifies the world-swarm), the tracker resolves it to live peers. Paste a friend's magnet → join their mesh. Clients may also `GET /peers` as a server browser.

### 3.4 Gameplay ladder — Inc (f)–(h)

(i) **Co-presence buffs ✅ SHIPPED (f)**: co-located players get "traveling with allies" — +1 to hit per ally (cap +2), encounter rate halved on shared cells. (ii) **Party loot/XP share ✅ SHIPPED (f)** on same-cell battles — each fights their own client-local instance; party bonus applies; **no synced turn engine in v1**. (iii) **Hireling guide bot ✅ SHIPPED (g)** (single-player-first): daily-fee NPC, extra attacker die in battles, and as *quest guide* drives the §NAV-01d auto-travel loop toward the active quest's waypoint ("follow me"). (iv) **Sentry bots ✅ SHIPPED (h)**: server-owned bot sessions (`bot:true`/`kind:'sentry'`, same presence schema — they ride the mesh for free) stationed at junctions; suppress encounters in their cell + auto-assist battles there; daily upkeep. Deterministic suppression: `/session/move` voids `s.encounter` on a sentry's cell AFTER the RNG stream advanced, so the instanced trace stays byte-deterministic. (v) **Shared turn-based party combat — DEFERRED** (server-authoritative battle instance; own design pass — see also duel v2 in §6.3).

### 3.5 No-dupe economy — Inc (i)

No PoW, no blocks, no global consensus — ordering + identity only: (a) every dropped/minted item gets a globally unique **mint id** `(originServerId, seq)`; (b) each player's economy history is a **hash-chained append-only event log** (lamport-style height, no computation); (c) a **trade** is one event signed into BOTH players' chains, referencing the item's mint id + the giver's prior-ownership event; (d) ownership = longest valid transfer chain from mint; on gossip-merge of two transfers from the same prior state (the double-spend), a deterministic fork-choice (lowest event-hash) voids the loser — detect-and-void on merge, optimistic because trades are rare; (e) item BYTES without a valid mint lineage are worthless in trade — exactly the Diablo-2 dupe fix. **Out of scope:** stat/save cheating (client-authoritative single-file game; friends-mesh trust is social — the ledger protects TRADES, not stats). Cross-mesh WORLD mutations (WBAPI writes) stay out of scope entirely — multi-writer conflict resolution is a different problem.

---

## 4. Increment plan (one per "continue"; gates per row)

| Inc | Scope | Gates |
|-----|-------|-------|
| **a** | **Client presence on one server:** MP toggle + connect (`session/start` → `sessionStorage`), `POST /api/session/pos` (new, display-only, passability-validated), EventSource consumer, "Also here:" line via renderer, chat in/out via `storyMsg` + `session/say`, minimap dots. | mud-harness 24/24 (pos beacon cases added) · navigation 29/29 (MP off = zero behavior change) · manual 2-browser smoke |
| **b** | serverId + worldHash + 2-server presence exchange over static `--peer` config (no discovery yet). | 2-server harness case: A's player visible on B, exactly once |
| **c** | Gossip + PEX + version-vector dedup (self-discovering; hop TTL; anti-entropy pull; peer cache file). | 3-server harness: convergence, exactly-once, no flood loops |
| **d** | `--tracker-mode` + `/announce` + `/peers` + `r2h:` magnet parse in client. | tracker harness: announce/resolve; mesh survives tracker kill |
| **e** | **Mesh harness hardening:** 3 servers + tracker — convergence, exactly-once, partition-heal (kill a peer, rejoin, vv catch-up). | new `npm run test:mesh` green ×3 runs, CI job |
| **f** ✅ | Co-presence buffs + party loot/XP share (client-local, reads `MP.players` at battle start). | ✅ `a07b281` — copresence 6/6 |
| **g** ✅ | Hireling guide bot (single-player: fee on day tick, extra die, drives auto-travel). | ✅ `26bfed0` — hireling 6/6 |
| **h** ✅ | Sentry bots (server-owned bot sessions at junctions; encounter suppression + assist). | ✅ `ff413f6` — mud-harness [H]/[H6] 22 + mesh-sentry 7/7 |
| **i** ✅ | No-dupe ledger: mint-id on drops, per-player hash chain, trade handshake, fork-choice void. **Data shapes: §6.1–6.2.** **Slice 1 (single-server mint+trade) ✅ 2026-07-06:** persisted chains (`ledger/<origin>.jsonl`, fsync), `ledger/mint|owner|chain|status|ingest` + `trade/propose|accept|cancel`, pure resolver incl. lowest-hash dupe-void. **Slice 2a ✅ 2026-07-06:** durable playerKey identity (§6.4) + parallel durable gossip channel (`ledgerVV` piggyback → `ledger/sync` pull / `ingest` push anti-entropy). **Slice 2b ✅ 2026-07-06:** client rung — save-persisted playerKey, mint stamping at acquisition, ⇄ trade UI over the SSE `trade_*` events. **Last rung ✅ 2026-07-06 — CROSS-ORIGIN co-signed trades:** parties on different servers; `p8` rides the presence snapshot (remote roster entries carry `ledgerPid`), propose relays proposer-origin → counterparty-origin over `POST /api/trade/relay` (compat+ACL gated like gossip; each leg pulls the caller's ledger frontier before any ownership verdict), accept relays back, and the **proposer's origin authors ONE event carrying both origins' HMAC sigs** (the counterparty's assent IS the relayed accept — HMAC keys are public serverIds, §6.1); trade_completed fires from the ingest hook (hash-deduped), so a lost relay reply is healed by gossip back-fill. Cancel relays best-effort; TTL is the backstop. Requires mutually dialable origins (reason `peer-unreachable` otherwise). | ✅ mud-harness [I] 26 + [I2] 18 + **[I3] 15 checks** (remote-roster ledgerPid, relayed propose/accept, dual-origin sig, dual-chain linkage, exactly-once SSE, 3-server verdict convergence, cancel relay, wrong-acceptor + unknown-origin rejects) · Playwright `mesh-ledger-client.test.js` 8 (incl. a two-SERVER two-browser cross-origin E2E) |
| **j** ✅ | Consensual PvP duels ✅ **SHIPPED 2026-07-06 (v1: same-origin, auto-resolve playback, no stakes)**: `duel/challenge|accept|reveal` exactly as §6.3 (challenged player commits first; 30 s TTL per phase; `pvp:'off'` at session/start = unchallengeable; co-presence required), commit `sha256(nonce‖statHash)` verified at reveal, `DUEL.checkBounds` rejects impossible statBlocks, `duelSeed = sha256(nonceA‖nonceB‖duelId)`, **`duel.js` DUEL:CORE kernel** (pure mulberry32 combat + its own pure-JS sha256 so client/server hashing can never diverge; inlined byte-identical, `check:duelparity` gate) → ONE `kind:'duel'` event into both chains (transcript NOT stored — replayable); walk-off after commit = forfeit event, the step itself never refused; client: ⚔ presence button, SSE-driven commit/reveal, transcript playback that RE-RUNS the kernel and prints "Replay verified ✓", 🚫 decline-all toggle (`S_story.pvpOff`). | ✅ `check:duelparity` · mud-harness **[O] 22 checks** (sha256≡node:crypto, determinism, ordering, reveal-mismatch, replay-agreement, peer replication, bounds, pvp-off/co-presence/cross-origin guards, forfeit + never-blocks, TTL) · Playwright `mesh-duel-client.test.js` 5 (incl. two-browser E2E: verified playback both screens, saves untouched, event in both chains) |

**Docs sync on close:** plan.md §MESH-01 → Completed Work registry row in index.md; mechanics.md (multiplayer section); this report → status COMPLETE.

---

## 5. Non-obvious decisions (for the next reader)

- **`session/pos` (beacon) vs `session/move` (simulate).** Browser clients tell the server where they are; headless MUD clients ask the server to move them. Mixing the two double-rolls encounters — the §WALK-5 instanced roll stays exclusively on `session/move`.
- **Presence never touches ROOMS:CORE or MOVER:CORE.** "Also here:" is a render-time append; both shared-core blocks must stay byte-identical client/server (parity checks enforce it).
- **worldHash over walkable-world literals only.** Hashing the whole HTML would fork the swarm on every narrative edit; hashing CELL_GRID+ROAD_RUNS+IMPASSABLE_CELLS forks it exactly when players could desync spatially.
- **Single-writer is the whole trick.** Presence needs no CRDTs because only the origin mutates a record; the version vector is a dup filter, not a merge strategy. The *economy* is the one multi-writer slice, and it gets the fork-choice ledger — nothing else does.
- **Tracker death is a non-event.** Gossip + PEX + the cached-peers file carry the mesh; the tracker only shortens the first hello.
- **Loopback is the default on purpose (§MESH-01-FU 1).** A solo dev server must never be exposed by accident, so `127.0.0.1` stays the default bind; a real cross-machine mesh is an explicit opt-in with BOTH `--bind 0.0.0.0` (or `BIND_ADDR`) and `--advertise <lan-ip>:<port>` (or `ADVERTISE_ADDR`) — bind without advertise hands peers a `localhost:` dial-back that points at *their own* machine. Misconfig (peers configured + loopback bind/advertise) warns loudly at startup and in `GET /api/mesh/status → reachability.warnings` (Mesh tab).
- **Sentries are just sessions.** Server-origin bot sessions reuse the §WALK-5 session schema and ride the same gossip — no second presence system.
- **Battle stays client-local through Inc (f)–(h).** "Party combat" in v1 = same-cell players each fighting their own instance with shared bonuses; a synced turn engine is deferred to its own design pass.

---

## 6. Data shapes for the multi-writer slice — (i) ledger + (j) duels (design pass, 2026-07-06)

> **Why this section exists.** (i) and (j) are the only two rungs where **two parties co-author one fact**, so they were code-gated on a concrete-shape design pass (plan.md §MESH-01 ladder (j) note: *"extend the mesh lab report with DUEL:CORE data shapes before any code"*). §3.5 and the sync-architecture report §IX.C lock the *concepts*; this section pins the **record schemas, endpoint signatures, resolver contract, and harness cases** a coder implements against. Nothing here is shipped. It reuses the report's three primitives — owned records, monotonic sequence, deterministic identity — and adds **no new infrastructure class**.

### 6.1 Shared primitives (both rungs)

**The durable chain vs the ephemeral ring — the one new invariant.** Presence events live in a **bounded (500) ring** and are *display-only*: losing one blinks a dot, not a fact. Ledger/duel events are **durable economy facts** — a lost trade event is a lost item. So they do **not** ride the presence ring. Each origin keeps a **persisted, append-only, per-player hash chain** on disk (`ledger/<serverId>.jsonl`, one line per event, fsync on append), replicated over a **parallel gossip channel** that reuses the *same* peer set, ACL, and `(proto,engineVer,worldHash)` compat gate as presence, but with its own version vector and **no TTL / no size cap** (the economy is permanent). Anti-entropy is the existing shape: exchange per-origin `maxSeq`, pull missing ranges; snapshots are the durability floor.

**Event envelope** (every ledger/duel event; single-writer = the `origin` server is the sole appender to *its own* players' chains):

```
{ kind: 'mint'|'trade'|'duel',
  id:      [originServerId, seq],   // origin-wide monotonic seq — the same id scheme as presence; the version vector dedups on it
  ts,                                // wall clock (advisory; ordering is by chain height, not ts)
  chain:  { <pid>: { height, prevHash } , ... },   // per-player linkage; 1 entry for mint, 2 for trade/duel (dual-membership)
  body:   { … kind-specific … },
  sig:    { <serverId>: hmac } ,     // each participating ORIGIN signs the canonical event; 1 for mint, 2 for trade/duel
  hash:    sha256(canonical(event \ {hash}))        // the event's identity for fork-choice + prevHash linkage
}
```

- **`height`/`prevHash`** are the per-player chain position and the hash of that player's *previous* chain event — this makes each player's history a tamper-evident Lamport-height chain independent of wall-clock.
- **`hash`** is over the canonical JSON with a **stable key order** (sort keys; `sig`/`hash` excluded from `sig`'s and `hash`'s own preimage in that order) so client and server compute identical digests — the same discipline `worldHash` already uses.
- **`sig`** is an HMAC keyed by the signer's `serverId` (not a real PKI — friends-mesh trust is social, §IX.B). Its job is not "prove identity to a stranger" but "make a *self-inconsistent* origin detectable": a signature that doesn't verify against the claimed origin's own prior events is dropped at ingest.

### 6.2 (i) No-dupe economy ledger — data shapes

**Item lifecycle.** An S_story inventory item is a plain local object until an origin server **mints** it; only minted items are tradeable across the mesh (an unminted item fails `trade/propose` — the Diablo-dupe fix: bytes without lineage are worthless in trade). Minting happens server-side at acquisition **while connected** (drop/quest-reward → the origin issues a `mint` event stamping `mintId=[serverId,seq]` onto the item). Single-player / offline items simply have no `mintId` and are local-only until registered.

```
mint.body  = { player: <pid>, item: { key, name, qty }, mintId: [serverId, seq] }   // mintId === event.id
trade.body = { tradeId,
               parties: [pidA, pidB],
               transfers: [ { mintId, from: pidA, to: pidB, priorEventHash } , … ],   // priorEventHash = the giver's last event that owned this mintId
               // dual-signed: sig has both origins; chain has both players' {height,prevHash}
             }
```

**Trade handshake** (two-phase, both origins co-sign one event):

```
POST /api/trade/propose  { from:pidA, to:pidB, give:[mintId…], want:[mintId…] }  → { tradeId, ttl:60s }
POST /api/trade/accept   { tradeId, by:pidB }                                     → both origins validate ownership,
                                                                                     co-sign ONE trade event, append to
                                                                                     BOTH chains, gossip it
POST /api/trade/cancel   { tradeId }                                              → drop the pending proposal (no event)
```

**Cross-origin handshake (SHIPPED 2026-07-06 — the rung's final shape).** When `to` belongs to another origin, the three client calls above are unchanged; the servers add one relay surface, `POST /api/trade/relay` (server↔server only; same compat + ACL gate as gossip/sync; ops `propose|accept|cancel`). Flow: the proposer's origin resolves the counterparty origin's address from the gossip peer table (`meshAddrForOrigin8`), **pulls its ledger frontier** (so a seconds-old foreign mint is visible to the ownership verdict), validates, and relays the offer in; the counterparty's origin re-validates on ITS replica (after the symmetric pull — every relay leg carries the caller's `vv` and blocks on `ledgerSyncCover`), stores the pending offer, and SSEs its player. The accept relays back, and the **proposer's origin authors the one event**, passing the counterparty origin as a cosigner — `sig` carries both origins per §6.1. Since the HMAC key is the public serverId, either side *could* compute either entry; the counterparty's **assent is the relayed accept request itself**, and the second sig makes the event self-verify against both origins at every ingest. `trade_completed` fires from the ledger *ingest hook* (hash-deduped, at most once per event), so if the relay reply is lost after the event was authored, the durable gossip back-fill still notifies the accepting party exactly once. Constraint: the two origins must be mutually dialable (`peer-unreachable` otherwise) — the same reachability the mesh itself needs.

**Ownership resolution** (pure function over the merged chains): `owner(mintId)` = the endpoint of the **longest valid transfer path** rooted at the `mint` event, where each `transfer.priorEventHash` equals the previous owning-event's `hash` and `transfer.from` equals the previous owner. An item whose lineage does not root at a `mint` event is **not owned by anyone** (untradeable).

**Double-spend → deterministic fork-choice.** Under single-writer, a double-spend requires the giver's *own origin* to sign **two** transfers of one `mintId` from the **same** `priorEventHash` (an honest origin serializes its player's trades and never does this). When both branches reach a third server via gossip, it is detected at merge (two transfers share a `priorEventHash`) and resolved by **lowest `hash` wins**; the losing branch and everything transitively descending from it are marked `voided:true`. Because the rule is a pure function of the events, **every server reaches the identical verdict** with no coordination — detect-and-void on merge, optimistic because honest double-spends never occur.

**Ledger harness cases** (`npm run test:mesh` extension): mint-id uniqueness across two origins · honest trade converges (item leaves A's chain, resolves to B on a third server) · **dupe-void determinism** (a doctored origin signs two conflicting transfers; three servers independently void the same branch) · provenance-reject (`trade/propose` refuses an unminted item) · **durability** (a ledger event survives a peer restart via the persisted log + anti-entropy re-pull — the property presence deliberately lacks).

### 6.3 (j) Consensual PvP duels — `DUEL:CORE` data shapes

**Handshake + commit-reveal** (neither side can steer the RNG or pre-see the opponent's build):

```
POST /api/duel/challenge { from:pidA, to:pidB }                 → { duelId, ttl:30s }   (refused if either has pvp:off)
POST /api/duel/accept    { duelId, commit: sha256(nonce‖statHash) }   // B then A each COMMIT (hash only)
POST /api/duel/reveal    { duelId, nonce, statBlock }                 // both REVEAL; each reveal must match its commit
```

- **`statBlock`** = the committing player's derivable combat state `{ level, hp, ac, atkBonus, dmgDie, dmgFlat, abilityScores }`. On reveal, each origin **validates the counterparty's statBlock against bounds derivable from the shared world data** — legal because `worldHash` equality is a precondition, so both servers provably hold the same level/monster/XP tables; a statBlock exceeding the world-max for its level is rejected (§IX.B: impossible stats are the tractable half of anti-cheat). A reveal whose `sha256(nonce‖statHash)` ≠ its commit is rejected (commit-reveal integrity).
- **Seed**: `duelSeed = sha256(nonceA ‖ nonceB ‖ duelId)` — both nonces feed it, so neither party alone chooses it.

**`DUEL:CORE` — a shared pure kernel** (the `mover.js` / `rooms.js` precedent): a new `duel.js`, inlined verbatim into `roll2hit-v3.html` and `require`d by the server, guarded by a **`check:duelparity`** gate (byte-identical, exactly like `check:parity`/`check:roomsparity` for MOVER/ROOMS:CORE).

```
DUEL:CORE(statA, statB, duelSeed) → { transcript: [ {round, attacker, d20, total, hit, dmg, hpA, hpB} … ],
                                      winner: pid, loser: pid, rounds }
```

- Deterministic: a `mulberry32` seeded by `duelSeed` (the same RNG discipline as `seededNext`) drives every d20; initiative, hit resolution, and damage are pure over `(statA, statB, seed)`. **Same inputs → byte-identical transcript on client and server.** A cheater is therefore *"a machine that disagrees with a pure function of committed inputs"* — any observer replays `DUEL:CORE` from the duel event and verifies the winner.
- **Outcome event** (`kind:'duel'`) carries `{ duelId, parties, statA, statB, duelSeed, winner, rounds }`, dual-signed, appended to **both** players' chains (so a duel record is as durable and replay-checkable as a trade). Rewards/standings derive from `winner`; **no stakes-transfer in v1** (if duels ever wager items, the stake is expressed as a `trade` event conditioned on `winner` — reusing §6.2, no new primitive).
- **Free-Movement holds**: a duel is a modal overlay, never a mover gate. Walking off the shared cell mid-duel = **flee/forfeit** (the resolver records a forfeit outcome); the move itself is never blocked. Global `pvp:off` toggle makes a player unchallengeable.

**Staging.** **v1** = auto-resolve transcript playback (both reveal → `DUEL:CORE` runs → the transcript animates client-side, both clients replaying the same pure result). **v1.5** = per-round commit-reveal (each round's chosen action committed then revealed, defeating pre-computation of a losing line). **v2** = server-authoritative shared combat instance — the same deferred design as the party-combat turn engine (§3.4.v); out of scope here.

**Duel harness cases**: `check:duelparity` (byte-identical `duel.js`) · determinism (same `(statA,statB,seed)` → identical transcript across a fresh client eval and the server) · commit-reveal (a mismatched reveal is rejected) · bounds (an over-max statBlock is rejected at reveal) · **replay-agreement** (a third server replays the duel event and agrees on `winner`) · forfeit (walking off-cell forfeits and never blocks the move).

### 6.4 Durable player identity — persistent player key (LOCKED 2026-07-06, user call)

**The problem.** Slice 1 chains key on `pid = (origin8, session8)`, but sessions idle-expire after 30 minutes — a player's chain (and the tradeability of every item they minted) strands when the session dies. The ledger is permanent; its identity cannot be rented from an ephemeral table.

**The decision (user call, 2026-07-06): persistent player key.** Rejected alternatives: session-resume tokens (server must persist the session table; a lost token still strands the chain) and chain-rebind events (the dead session can't co-sign the rebind — proof needs its own mechanism).

- **Client:** on first `session/start` while connected, generate `S_story.playerKey` once — 32 hex chars from `crypto.getRandomValues` — and persist it in the save file (exported/imported with it, like any other S_story field). Every subsequent `session/start` sends it.
- **Server:** derives the durable half of the pid from the key, never storing the raw key — `player8 = sha256(playerKey).slice(0,8)`; **ledger/duel pid = `(origin8, player8)`**. The session table maps live `sessionId → player8`; mint/trade/duel endpoints keep taking the sessionId (session-bound as shipped) and resolve it to the durable pid at append time. The §6.1 envelope is unchanged — only the *definition* of `<pid>` in `chain:{}` moves from session8 to player8.
- **Presence untouched:** presence records stay session-keyed and TTL-bounded (display-only — losing one blinks a dot, not a fact). Only the durable chains (§6.1's one new invariant) use the durable pid. The asymmetry is deliberate and mirrors the ring-vs-chain split.
- **Trust model:** the key is a bearer credential — whoever presents it owns the chain. That is §IX.B's social-trust posture verbatim (a stolen save file already *is* the player in a client-authoritative game); no PKI, consistent with HMAC-not-signature in §6.1.
- **Migration:** none needed — slice 1 shipped with harness-only data; no live economy exists on session-keyed chains. Slice 2 starts clean on `(origin8, player8)`.
- **Collision note:** 32 bits of player8 per origin is negligible for a friends-mesh; the server keeps the full sha256 in its session map and rejects a `session/start` whose full hash differs from a colliding player8's recorded hash (first-writer wins, log loudly).

### 6.5 Invariants this slice must preserve

- **Single-writer per record still holds** — each player's chain is appended only by *their own* origin; a trade/duel is two single-writer appends (one per origin) of the *same* co-signed event, not a shared mutable record. No CRDT, no consensus.
- **Determinism substitutes for consensus** — ownership resolution, fork-choice, and `DUEL:CORE` are all pure functions of the merged event set, so every honest server converges to the identical verdict with zero coordination messages.
- **Free-Movement + client-authoritative SP untouched** — the ledger protects *trades*, the duel kernel protects *duel outcomes*; neither gates the mover, and offline single-player carries no chain (items are plain local objects until minted).
- **The economy is the only durable, uncapped, disk-persisted replica** — every other replica in the system stays TTL-bounded and disposable. That asymmetry is the price of the two multi-writer facts, and it is quarantined to exactly these two rungs.
