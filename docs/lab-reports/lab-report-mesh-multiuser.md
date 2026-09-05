<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §MESH-01: Multiuser MUD

**Presence rendering · self-discovering server mesh · tracker rendezvous · no-dupe economy · consensual duels**

**Status:** 🔒 DESIGN LOCKED 2026-07-02 · **ALL TEN INCREMENTS (a–j) SHIPPED** · §MESH-01-FU CLOSED
**Parent design:** `plan.md §MESH-01` (logged 2026-07-01) → `plan-archive.md §2026-07-03`
**Predecessors:** `lab-report-walk5-mud-harness.md` (§WALK-5 instanced encounters + `src/tests/mud-harness.mjs`) · `lab-report-cell-map-mud-redesign.md` §CELL-07 (SESSIONS store + SSE broadcast) · `lab-report-mesh-sync-architecture.md` (the seven-layer transport this report sits on top of)
**Verified:** 2026-08-17 (§DOC-02bw) — see §VIII.

---

## Abstract

codexofconquest is a single-file offline game. §MESH-01 asks whether it can become a *multiplayer* game **without ceasing to be an offline one**, and answers yes by adding exactly one new capability at each of three tiers: a client that finally reads the SSE stream it had been ignoring; servers that find each other by gossip rather than by configuration; and a small economy layer that makes an item a fact with a history instead of a string in a save file. The load-bearing simplification is **single-writer**: because only the origin server ever mutates its own records, presence needs no CRDT, no consensus, and no clock — a version vector serves as a duplicate filter, not a merge strategy. Ten increments, `a` through `j`, shipped in **four days, seven hours, and thirteen minutes**. Six weeks later every numeric constant, every cited line, every ladder formula and all sixteen commit hashes in this document still measure exact; two named mechanisms — a hop counter and a test script — were never written, and the invariants they were said to protect are held by other means.

---

## I. Introduction

### A. The problem

Before §MESH-01, `wbapi-server.js` already maintained a `SESSIONS` map, broadcast cell events over SSE, and rolled instanced encounters for headless MUD clients (§WALK-5, §CELL-07). The game client had **zero** `EventSource` references. The server was talking to an empty room.

That is a strange kind of loneliness to ship: the multiplayer plumbing was live, tested, and unheard.

### B. The intention

Three tiers, each strictly additive:

1. **Presence rendering (client).** *"Also here: Kestrel, Bram"* appended to the room, dots on the minimap, `say` chat in the story log. Opt-in behind a 🌐 toggle that only appears when `GET /api/ping` succeeds. No WBAPI ⇒ zero MP code runs.
2. **Self-discovering mesh (server).** Servers holding the same world gossip presence deltas peer-to-peer, exchanging peer lists (PEX) so topology self-heals. A tracker *role* — the same binary with `--tracker-mode` — shortens the first hello and is never on the hot path.
3. **Gameplay + economy ladder.** Co-presence buffs → party loot/XP share → hireling bots → sentry bots → a hash-chained trade ledger → consensual PvP duels.

### C. What this buys the player

The tiers are ordered by how much they change the *feel* of a walk across the map:

| Rung | What the player gains |
|---|---|
| Presence | The map stops being empty. Somebody else's dot is on your minimap, and the room names them. |
| Chat + backlog | Arriving somewhere prints *"🕰 Earlier here:"* — a cell accumulates a history of who passed through. |
| Co-presence buffs | Traveling together is *mechanically* safer, not merely sociable: **+1 to hit per ally (cap +2)** and **half the wilderness encounter rate**. The game rewards the thing players already wanted to do. |
| Party loot/XP share | **+10 % XP and gold per ally (cap +20 %)** — company is never a tax on progression. |
| Hireling | Bram the Trailhand costs 60 gp up front and 12 gp a day, swings one extra die, and will walk you to your quest waypoint. Deliberately **single-player-first**: the solo player gets the shape of company without needing friends online. |
| Sentries | You can *invest in the map*. Garrison a junction and that cell stops ambushing anybody — player-authored safety that persists while you are away. |
| Ledger | An item acquires provenance. Trading matters because the item cannot be duplicated — bytes without lineage are worthless in trade. |
| Duels | Competitive expression that never touches movement. Walk off the cell mid-duel and you forfeit; the step itself is never refused. |

The through-line is the invariant the whole track was built to protect: **Free-Movement**. Multiplayer adds reasons to walk somewhere and never adds a locked door.

---

## II. Method

Measured 2026-08-17 against HEAD (`1442209`) and against each increment's own tree via `git show <commit>:<path>` — HEAD cannot adjudicate a claim about 2026-07-02. Instruments applied: symbol census with `git log -S` and **no pathspec** (to separate *retired* from *never shipped*); archive reads at the reference build `c78eb4d`; the report's own acceptance gates re-run; every cited hash verified **by commit subject**, never by existence; and the increment ladder scored **against the clock**, not only against the ledger.

**File relocations since ship** (both correct for their day, annotated not rewritten): `wbapi-server.js` → `src/js/wbapi-server.js` and `duel.js` → `src/js/duel.js`, moved by §CLEANUP-02 on 2026-07-14; the mesh kernel was extracted to `src/js/mesh.js` by `4367a38` nine hours after this report's last edit.

---

## III. Ground truth at the reference build (2026-07-02, `wbapi-server.js` **9,402 lines** — exact)

| Piece | Location then | Status |
|---|---|---|
| `SESSIONS` Map | `wbapi-server.js:65` | ✅ §CELL-07 + §WALK-5 |
| `SSE_CLIENTS` Map + `broadcastCell(r, c, event, data, excludeId)` | `:66`, `:87` | ✅ |
| `SESSION_TTL` 30-min idle prune (+ `SESSION_TTL_MS` override) | `:70` | ✅ |
| Per-session seeded RNG (`seededNext`, mulberry32) + `pickMonster` | `:475`, `:490` | ✅ §WALK-5 |
| `/api/session/{who,look,events,start,move,say,end}` | `:7508–7690` | ✅ |
| Instanced encounter roll on `session/move` success | `:7650` | ✅ §WALK-5 Inc 2 |
| Game client consuming the SSE stream | — | ⛔ **0 `EventSource` refs** → Inc (a) |
| Server-to-server sync of any kind | — | ⛔ → Inc (b)–(e) |
| Tracker mode | — | ⛔ → Inc (d) |

All eight line citations land on the named symbol; §VIII.A. The session shape this report gives — `{id, playerName, r, c, nodeCode, state, lastSeen, seed, rngState, encounter}` — is **more accurate than the source's own declaration comment**, which listed only the first seven. The three §WALK-5 fields were in the object literal and not in the comment above it.

---

## IV. As-built inventory (HEAD, 2026-08-17)

**Identity and compatibility** — `src/js/wbapi-server.js:const sha16 = (s) => crypto.createHash('sha256')@673` · `src/js/wbapi-server.js:const MANIFEST_PARTS = ['NODE_MAP', 'NODE_COORDS'@674` · `serverId` = 16 random bytes hex in `.wbapi-server-id` (live file: `6f139689a4f8ae48c07d88e6af4b2c2d`).

**Mesh constants** — `src/js/mesh.js:const MESH_GOSSIP_MS@116` (2 s) · `src/js/mesh.js:const MESH_ORIGIN_TTL = 90_000;@117` · `src/js/mesh.js:const MESH_FANOUT_MAX_AGE = 10_000;@118` · `src/js/mesh.js:if (MESH.log.length > 500)@148` (the bounded presence ring).

**Timers** — `src/js/wbapi-server.js:const SESSION_TTL = parseInt@76` (30 min) · `src/js/wbapi-server.js:const TRADE_TTL = parseInt@264` (60 s) · `src/js/wbapi-server.js:const DUEL_TTL = parseInt@591` (30 s per phase).

**Client** — `const MP = { base: null, session: null, pid: null@28646` (the sketched `{session, es, players}` grew to sixteen fields; all three named survive) · **exactly one** `EventSource` in the game file, which is the whole of Inc (a).

**Ladder** — `function _mpAllyCount() {@28803` · `function _partyHitBonus(allies) { return Math.min(2@28810` · `function _partyLootMult(allies) { return 1 + 0.1 *@28811` · `function _sentryHere() {@28816` · `function _partyEncounterRate(base) {@28822` · `const HIRELING_SPEC = { name: 'Bram the Trailhand'@28836` · read at battle start by `S.partyAllies   = _mpAllyCount();@24713`.

**Economy** — `src/js/wbapi-server.js:function playerKeyRegister(playerKey) {@290` · durable chain at `ledger/<serverId>.jsonl` · collision map persisted to `ledger/players.json`.

**Guards** — `src/js/wbapi-server.js:if (parts[0] === 'world' && parts[1] === 'download'@2933` · `src/js/wbapi-server.js:reason: 'cross-origin'@9700` (the v1 duel scope, enforced with a 400 rather than a comment).

---

## V. Delivery record

Ten planned increments, ten shipped. Every hash verified by subject.

| Inc | Scope | Ship | Elapsed from lock |
|---|---|---|---|
| **a** | Client presence on one server: MP toggle, `POST /api/session/pos` beacon, EventSource consumer, "Also here:", chat, minimap dots | `acd9b77` 07-02 09:31 | **25 min** |
| **b/c** | Identity + manifest + static bootstrap ladder + gossip mesh (single-writer events, version-vector dedup, anti-entropy, PEX) + `mesh-acl.json` | `80526b1` 07-02 09:50 | 44 min |
| **d** | Tracker rendezvous: `--tracker-mode`, announce/peers grouped by full compat identity, 30 s heartbeat, `BOOTSTRAP_URLS` | `d00faea` 07-02 09:57 | 51 min |
| — | Mesh tab UI (`GET /api/mesh/status` + traffic ring) | `6908504` 07-02 10:05 | 59 min |
| **d2** | Tracker federation (`--tracker-peer`, `POST /api/tracker/sync`, ageMs freshness, 500-record backstop) | `ca284e6` 07-02 10:31 | 1 h 25 m |
| **d3** | `GET /api/world/download` + BIG WARNING modal + `src/scripts/world-diff.js` + magnet v2 | `8543e63` 07-02 10:38 | 1 h 32 m |
| — | §MESH-01-FU 1: `--bind`/`--advertise` + loopback warning | `8ef0e67` 07-02 10:55 | 1 h 49 m |
| **e** | Mesh harness hardening — 3 servers + tracker: converge · split · heal · exactly-once | harness `[L]` | ✅ |
| **f** | Co-presence buffs + party loot/XP share | `a07b281` 07-05 21:41 | 3 d 12 h |
| **g** | Hireling guide bot | `26bfed0` 07-05 22:25 | 3 d 13 h |
| **h** | Sentry bots | `ff413f6` 07-06 07:03 | 3 d 22 h |
| **i** | No-dupe ledger — slice 1 `5536685` (08:12), 2a `87970d1` (09:15), 2b `a3836f5` (10:01), cross-origin co-signed trades `c27f6f5` (13:47) | `c27f6f5` 07-06 | 4 d 5 h |
| **j** | Consensual PvP duels v1 | `73f7faf` 07-06 14:15 | 4 d 5 h |
| — | §MESH-01-FU 11–13: ACL template · tracker cache + federation bootstrap · per-cell chat backlog | `e13338e` 07-06 16:19 | **4 d 7 h 13 m** |

Six of the nine core increments shipped inside **109 minutes** of the design lock.

---

## VI. Design decisions worth keeping

- **`session/pos` (beacon) vs `session/move` (simulate).** Browser clients tell the server where they are; headless MUD clients ask the server to move them. Mixing them double-rolls encounters, because the §WALK-5 instanced roll lives exclusively on `session/move`. The beacon validates passability against the same mover world — no ghosts in the ocean — and rolls nothing.
- **Presence never touches ROOMS:CORE or MOVER:CORE.** *"Also here:"* is a render-time append. Both shared-core blocks stay byte-identical client/server, enforced by `check:parity` and `check:roomsparity`. The report's own acceptance test for this — `grep -nE "presence|MP\." mover.js` must stay **0** — returns 0 at the reference build **and** at HEAD.
- **Single-writer is the whole trick.** Only the origin mutates its own records, so the version vector is a *dup filter*, not a merge strategy. No CRDTs, no LWW, no clock. The economy is the one multi-writer slice in the system, and it is the only thing that gets a fork-choice rule.
- **Tracker death is a non-event.** Gossip, PEX and the cached-peers file carry the mesh; the tracker only shortens the first hello.
- **Sentries are just sessions.** Server-origin bot sessions reuse the §WALK-5 schema and ride the same gossip — no second presence system. Suppression is applied *after* the RNG stream advances, so the instanced trace stays byte-deterministic.
- **Loopback is the default on purpose (§MESH-01-FU 1).** A solo dev server must never be exposed by accident. A real cross-machine mesh needs **both** `--bind 0.0.0.0` and `--advertise <lan-ip>:<port>`; bind without advertise hands peers a `localhost:` dial-back pointing at *their own* machine. Misconfiguration warns loudly at startup and in the Mesh tab.
- **Battle stays client-local through (f)–(h).** "Party combat" in v1 is same-cell players each fighting their own instance with shared bonuses. A synced turn engine was deferred to its own design pass, and still is.

---

## VII. The two multi-writer facts — ledger (i) and duels (j)

These are the only two rungs where **two parties co-author one fact**, so they were code-gated on a concrete-shape design pass before any implementation.

### A. The durable chain vs the ephemeral ring

Presence events live in a bounded 500-entry ring and are display-only: losing one blinks a dot, not a fact. Ledger and duel events are **economy facts** — a lost trade event is a lost item. So they do not ride the presence ring. Each origin keeps a persisted, append-only, per-player hash chain at `ledger/<serverId>.jsonl` (fsync on append), replicated over a parallel gossip channel that reuses the same peer set, ACL and `(proto, engineVer, worldHash)` compat gate as presence — but with its own version vector and **no TTL, no size cap**. The economy is permanent; everything else is disposable.

### B. Event envelope (shipped, field order verified against the live ledger)

```
{ kind: 'mint'|'trade'|'duel',
  id:    [originServerId, seq],                 // origin-wide monotonic; the version vector dedups on it
  ts,                                           // advisory — ordering is by chain height, not wall clock
  chain: { <pid>: { height, prevHash }, … },    // 1 entry for mint, 2 for trade/duel
  body:  { …kind-specific… },
  sig:   { <serverId>: hmac },                  // each participating ORIGIN signs the canonical event
  hash:  sha256(canonical(event \ {hash})) }    // identity for fork-choice + prevHash linkage
```

`hash` is over canonical JSON with stable key order, so client and server compute identical digests — the same discipline `worldHash` already uses. `sig` is an HMAC keyed by the signer's public `serverId`, not a PKI: its job is not *"prove identity to a stranger"* but *"make a self-inconsistent origin detectable."*

### C. Ownership and the double-spend

`owner(mintId)` is the endpoint of the longest valid transfer path rooted at a `mint` event, where each `transfer.priorEventHash` equals the previous owning event's `hash`. An item whose lineage does not root at a mint is owned by nobody. Under single-writer, a double-spend requires an origin to sign two transfers of one `mintId` from the **same** `priorEventHash` — something an honest origin never does. When both branches reach a third server, the conflict is detected at merge and resolved by **lowest `hash` wins**, voiding the losing branch and everything descending from it. Because the rule is a pure function of the event set, every server reaches the identical verdict with zero coordination messages.

This is the Diablo-2 dupe fix stated in one sentence: **bytes without lineage are worthless in trade.**

### D. Durable player identity (§6.4, user call 2026-07-06)

Slice 1 keyed chains on `(origin8, session8)`, and sessions idle-expire after 30 minutes — so a player's entire item history stranded when they stepped away for lunch. The ledger is permanent; its identity cannot be rented from an ephemeral table. Rejected: session-resume tokens (a lost token still strands the chain) and chain-rebind events (the dead session cannot co-sign its own rebind).

Shipped: the client mints `S_story.playerKey` once — 32 hex from `crypto.getRandomValues` — and persists it in the save. The server never stores the raw key, deriving `player8 = sha256(playerKey).slice(0,8)`; the durable pid is `(origin8, player8)`. Presence stays session-keyed and TTL-bounded. The key is a **bearer credential**: whoever presents it owns the chain, which is exactly the project's social-trust posture — in a client-authoritative game a stolen save file already *is* the player.

### E. Duels

Commit-reveal, so neither side can steer the RNG or pre-see the opponent's build: the challenged player commits `sha256(nonce‖statHash)` first, both reveal, and `duelSeed = sha256(nonceA ‖ nonceB ‖ duelId)` takes both nonces so neither party alone chooses it. Each origin validates the counterparty's `statBlock` against bounds derivable from shared world data — legal precisely because `worldHash` equality is a precondition, so both servers provably hold the same level and monster tables.

`DUEL:CORE` is a pure kernel in `src/js/duel.js`, inlined byte-identically into the game file and gated by `check:duelparity` — the `mover.js` / `rooms.js` precedent. A `mulberry32` seeded by `duelSeed` drives every d20, so a cheater is *"a machine that disagrees with a pure function of committed inputs."* The transcript is not stored; any observer replays the kernel from the duel event and the client prints **"Replay verified ✓"**.

Free-Movement holds: a duel is a modal overlay, never a mover gate. Walking off the shared cell after commit records a forfeit and the step itself is never refused.

---

## VIII. Verification ledger (2026-08-17, §DOC-02bw)

### A. Exact

| Class | Result |
|---|---|
| Reference-build line count | `wbapi-server.js` **9,402 lines** — exact |
| §III line citations | **8/8** land on the named symbol at `c78eb4d` |
| Absence claims at the reference build | `EventSource` = **0** in the game file — exact (HEAD: **1**, which is Inc (a)) |
| Commit hashes | **16/16** verified by subject |
| Timers | `SESSION_TTL` 30 min · `TRADE_TTL` 60 s · `DUEL_TTL` 30 s/phase · gossip 2 s · announce 30 s · `MESH_ORIGIN_TTL` 90 s — **6/6** |
| Structural constants | serverId 16 bytes · `worldHash` = sha256 first 16 hex · presence ring 500 · tracker 500-record backstop · `playerKey` 32 hex · `player8` 8 chars — **6/6** |
| Ladder formulas | +1/ally cap +2 · ×0.5 encounter rate · +10 %/ally cap +20 % · hireling one extra die — **4/4 byte-exact** |
| Endpoint signatures | `session/pos` · `trade/{propose,accept,cancel,relay}` · `duel/{challenge,accept,reveal}` · `ledger/{mint,owner,chain,status,ingest,sync}` — **all live** |
| Envelope field order | `kind · id · ts · chain · body · sig · hash` — **byte-exact in the live ledger file** |
| Playwright spec counts | copresence 6 · hireling 6 · sentry 7 · ledger-client 8 · duel-client 5 — **5/5** |
| Harness deltas | `[E]` +13 · `[F]` +8 · `[G]` +3 — exact; totals **60 · 63 · 251** exact |
| `check:duelparity` | ✅ green — DUEL:CORE identical in `src/js/duel.js` and the game file (7,987 bytes) |
| `npm run test:mud` | every §MESH section green: `[E] [F] [G] [H] [H6] [I] [I2] [I3] [L] [O] [P] [Q]` |
| Report's own invariant | `grep -nE "presence\|MP\." mover.js` = **0** at both the reference build and HEAD |

The three earliest harness totals (35 · 48 · 56) each sit one below the static call-site count at their commit, consistently — a conditional check-site, not a mis-count. The per-increment deltas the report claims are exact either way.

### B. Corrected

1. **The hop TTL never existed.** §3.2 read *"this + a hop TTL of 3 stops flood loops."* `hopTtl` has **0 commits in the repository's entire history**, under any path. **NOT SHIPPED** — but the *property* holds by a different mechanism: `MESH_FANOUT_MAX_AGE = 10_000` means replayed history advances the version vector and is not re-announced, which closes the loop without a counter. **Pin the property, not the mechanism.**

2. **`npm run test:mesh` never existed.** Named twice as a gate — Inc (e)'s row and the ledger harness cases. **0 commits ever.** Everything landed in `src/tests/mud-harness.mjs` instead, as sections `[E]`–`[R]`, and the report's own evidence column says so (*"mud-harness `[I]` 26"*). The document contradicted itself and the mud-harness half governed. Inc (e) did ship — it is harness section `[L]`, "partition heal (3 servers + tracker: converge · split · heal · exactly-once)", green today.

3. **`tracker.js` never existed either**, and never should have: §3.3 corrected §2's row title in the same document — *"a role, not a stack."* The role shipped; the filename was only ever shorthand.

4. **`worldHash` inputs were widened, and the stated rationale was inverted.** §3.2 specified a hash over `CELL_GRID` keys + `ROAD_RUNS` + `IMPASSABLE_CELLS` — *"the walkable world, not the whole HTML (narrative edits must not fork the swarm)"*. What shipped in Inc (b/c) hashes **eight** data collections including `QUEST_DB`, `MONSTER_POOL` and `WORLD_DB`, plus `ENGINE_VER`, and the compat gate tests the **whole** hash for equality. **A narrative edit forks the swarm today** — precisely the outcome §5 was written to prevent. Filed **§DX-02cq**.

5. **§6's preamble expired in 22 minutes.** *"Nothing here is shipped"* was written at `96de681` (07:50); slice 1 shipped at `5536685` (08:12), and §6.2 in the same section now reads *"SHIPPED 2026-07-06"*. A scope note is a claim with an expiry date.

6. **"Never persisted into `S_story`/saves" was retired by this report's own §6.4**, four days later, when `S_story.playerKey` became a save field by design. The *narrow* form the sentence was protecting — **no dead sessionId in a save** — is still true today. The wide form's collapse has a live consequence, already filed as **§DX-02cn**: `playerKey` and `pvpOff` are absent from `_S_DEFAULTS()`, and `storyNewGame` assigns onto the live object, so a fresh character inherits the previous one's bearer credential and therefore its item chain.

7. **`check:duelparity` is the one parity gate nothing runs.** §6.3 promised it would work *"exactly like `check:parity`/`check:roomsparity`"*. Those two are inside the 16-gate `check:walk` chain; `check:duelparity` is in neither `check:walk` nor CI, and `src/js/duel.js` is not in the CI trigger paths. It passes when invoked by hand — verified above — and nothing invokes it. Filed **§DX-02cr**.

### C. Deltas in the engine's favour

- **Sentries are excluded from the ally count.** §3.4 gave sentries the same presence schema so they would *"ride the mesh for free"* — which would have let a garrisoned junction inflate the party bonus. `_mpAllyCount()` filters `kind !== 'sentry'`, a refinement the design did not anticipate and the implementation caught.
- **The collision guard was made durable.** §6.4 said the server *"keeps the full sha256 in its session map"*; it ships as a persisted `ledger/players.json`, because a guard that forgets on restart is not a guard.
- **Free-Movement is restated in the shipped source.** `_partyEncounterRate`'s comment reads *"Client-side roll adjustment only — the mover never reads it (Free-Movement holds)."* The invariant survived out of the design doc and into the code that could have broken it.
- **The v1 duel scope is enforced, not merely documented.** A cross-origin challenge returns 400 with `reason: 'cross-origin'` and a sentence explaining the limit. A deferral with a guard does not rot.

### D. The ladder against the clock

Ten lettered increments (`a`–`j`), ten shipped, in order, inside 4 d 7 h 13 m. Three items named as **prose categories** rather than lettered rungs — *"shared turn-based party combat"*, *"v1.5 per-round commit-reveal"*, *"v2 server-authoritative combat"* — have **0 commits** six weeks on and remain correctly deferred. Both polarities of the same predictor sit in one document: a named rung has an owner and a next commit; a category has neither.

### E. Shipped, and not yet used

The live ledger at `ledger/6f139689a4f8ae48c07d88e6af4b2c2d.jsonl` holds **18 events across 5 players — all of them `mint`. Zero `trade`, zero `duel`.** The two multi-writer facts that justify the entire durable-chain apparatus have never carried a production event. The machinery is correct, tested, and idle: an economy waiting for a second player to walk into the room.

---

## IX. Risk register outcome

| Risk as filed | Outcome |
|---|---|
| Presence leaking into the mover / ROOMS:CORE | ✅ held — grep = 0, parity gates green |
| Double-rolled encounters from move-mirroring | ✅ held — the beacon rolls nothing; `[C]` green |
| Flood loops in gossip | ✅ property held — by fanout age, not the specified hop counter (§VIII.B.1) |
| Ghost players on non-existent cells | ✅ held — compat gate is exact-match, and over-tight (§DX-02cq) |
| Save files carrying dead session ids | ✅ held in the narrow form; the wide form fell (§DX-02cn) |
| Client/server duel divergence | ⚠️ kernel byte-identical today, but nothing checks it automatically (§DX-02cr) |
| Stat/save cheating | out of scope by design — the ledger protects **trades**, not stats |

---

## X. Defects filed

- **§DX-02cq** 🟡 — `worldHash` covers all eight data collections, so editing one quest segregates you from your friend's server. Contradicts this report's own stated rationale. Design call: narrow to spatial parts, or split spatial/content hashes. Sibling of **§DX-02cp** (the `ENGINE_VER` leg of the same triple, inert since the day it was created — one leg stuck, one leg hair-trigger).
- **§DX-02cr** 🟢 — `check:duelparity` runs in neither `check:walk` nor CI, and `src/js/duel.js` is not a CI trigger path. Two lines.
- **§DX-02cn** 🟢 (filed by §DOC-02bv) — corroborated here: `playerKey`/`pvpOff` missing from `_S_DEFAULTS()`; a New Game inherits the prior character's economy identity.

## XI. Still deferred (correctly)

Cross-origin duels (reuse the trade relay) · v1.5 per-round commit-reveal · v2 server-authoritative shared combat — the same design pass as the party-combat turn engine. Cross-mesh **world** mutations (WBAPI writes) remain out of scope entirely: multi-writer conflict resolution on the world is a different problem, and this track deliberately solved only the two facts that two players must author together.
