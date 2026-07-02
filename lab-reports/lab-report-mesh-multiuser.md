<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §MESH-01: Multiuser MUD (presence rendering · self-discovering server mesh · tracker · no-dupe economy)

**Status:** 🔒 **DESIGN LOCKED (2026-07-02).** No code shipped yet — this report is the Lab Report Policy prerequisite for §MESH-01 implementation (multi-system redesign trigger). Increments (a)–(i) below, one per "continue."
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

(i) **Co-presence buffs**: co-located players get "traveling with allies" — +1 to hit per ally (cap +2), encounter rate halved on shared cells. (ii) **Party loot/XP share** on same-cell battles — each fights their own client-local instance; party bonus applies; **no synced turn engine in v1**. (iii) **Hireling guide bot** (single-player-first): daily-fee NPC, extra attacker die in battles, and as *quest guide* drives the §NAV-01d auto-travel loop toward the active quest's waypoint ("follow me"). (iv) **Sentry bots**: server-side bot sessions (origin = the server, same presence schema — they ride the mesh for free) stationed at road junctions; suppress encounters in their cell + auto-assist battles there; daily fee. (v) **Shared turn-based party combat — DEFERRED** (server-authoritative battle instance; own design pass).

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
| **f** | Co-presence buffs + party loot/XP share (client-local, reads `MP.players` at battle start). | navigation/fishing suites green; buff unit cases |
| **g** | Hireling guide bot (single-player: fee on day tick, extra die, drives auto-travel). | navigation travel cases green |
| **h** | Sentry bots (server-side sessions at road junctions; encounter suppression + assist). | mud-harness sentry cases |
| **i** | No-dupe ledger: mint-id on drops, per-player hash chain, trade handshake, fork-choice void. | ledger harness: dupe-void case, honest-trade case |

**Docs sync on close:** plan.md §MESH-01 → Completed Work registry row in index.md; mechanics.md (multiplayer section); this report → status COMPLETE.

---

## 5. Non-obvious decisions (for the next reader)

- **`session/pos` (beacon) vs `session/move` (simulate).** Browser clients tell the server where they are; headless MUD clients ask the server to move them. Mixing the two double-rolls encounters — the §WALK-5 instanced roll stays exclusively on `session/move`.
- **Presence never touches ROOMS:CORE or MOVER:CORE.** "Also here:" is a render-time append; both shared-core blocks must stay byte-identical client/server (parity checks enforce it).
- **worldHash over walkable-world literals only.** Hashing the whole HTML would fork the swarm on every narrative edit; hashing CELL_GRID+ROAD_RUNS+IMPASSABLE_CELLS forks it exactly when players could desync spatially.
- **Single-writer is the whole trick.** Presence needs no CRDTs because only the origin mutates a record; the version vector is a dup filter, not a merge strategy. The *economy* is the one multi-writer slice, and it gets the fork-choice ledger — nothing else does.
- **Tracker death is a non-event.** Gossip + PEX + the cached-peers file carry the mesh; the tracker only shortens the first hello.
- **Sentries are just sessions.** Server-origin bot sessions reuse the §WALK-5 session schema and ride the same gossip — no second presence system.
- **Battle stays client-local through Inc (f)–(h).** "Party combat" in v1 = same-cell players each fighting their own instance with shared bonuses; a synced turn engine is deferred to its own design pass.
