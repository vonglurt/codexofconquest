<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Presence Without Consensus: Synchronization, Discovery, and Bootstrap in a Single-File Multiplayer World

**Roll2Hit Lab Report — §MESH-01 architecture retrospective**
*paul@roll2hit.com · written 2026-07-02 · amended 2026-07-06 · descriptive (shipped behaviour as of harness 75 / commit `9dd029b`)*
*Companion: [lab-report-mesh-multiuser.md](lab-report-mesh-multiuser.md) — the design-lock document this report narrates.*

> **§DOC-02bv verification stamp (2026-08-17).** Every symbol, constant, excerpt, evaluation figure
> and roadmap rung was re-measured against HEAD and against the archive at the report's own commit.
> **13/13 constants exact · 14/14 cited functions live · 4/4 evaluation figures exact for their day ·
> 9/9 roadmap rungs shipped, in order, inside four days.** Six claims did not survive; each is marked
> **RETIRED** or **CORRECTED** in place and kept. Full ledger: §XII.

---

## Abstract

Roll2Hit is a D&D-5e combat assistant and world simulator whose defining constraint is that **the
entire game — engine, content, world data — is one HTML file**. This report describes how that
artifact acquires multiplayer presence, server-to-server synchronization, rendezvous discovery and
operator-controlled bootstrap without a database, a broker, a consensus protocol, or any component
that is not (a) the game file, (b) one Node sidecar that *parses the game file as its database*, or
(c) plain text an operator can read and copy.

The stack has seven layers — **L0** identity, **L1** sessions, **L2** cell-scoped delivery, **L3**
gossip replication, **L4** rendezvous, **L5** bootstrap, **L6** observability — over one load-bearing
discipline: **single-writer ownership.** Every replicated record has exactly one mutating authority,
which reduces synchronization from conflict resolution to deduplication, solvable with per-origin
sequence numbers. No CRDTs, no last-writer-wins clocks, no consensus. Three primitives (owned
records, monotonic sequence, deterministic identity) recur at presence, tracker, federation and
economy. We close on the trust model: what the system deliberately does *not* verify, and why its
human-facing surfaces are as much a part of the design as its version vectors.

**Index terms** — gossip protocols, version vectors, peer exchange, rendezvous trackers, magnet
links, single-writer replication, eventual consistency, browser games, self-hosting.

---

## I. Introduction

### A. The artifact

`roll2hit-v3.html` is the unit of distribution. Opening it *is* installing the game; copying it *is*
forking the world. Measured at the report's own commit `9dd029b`:

| Figure | As written | At `9dd029b` | At HEAD |
|---|---|---|---|
| Lines | "~34,000" | **34,494** ✅ | 38,712 |
| Cell grid | "90×360" | **`const GEO_PROJ = { ROWS: 90, COLS: 360 }@9902`** ✅ | unchanged |
| Monsters | "216+" | **392** ❌ | 398 |
| Terrains | "40" | **106** ❌ | 111 |
| Quests | "hundreds" | **2,839** ⚠ short by an order of magnitude | 2,853 |

**CORRECTED.** The wrong figures were not misremembered — they were copied verbatim, `+` and all,
from `docs/notes/docs-dev-environment.md:55` (*"216+ monsters"*) and `docs/spec/spec-migration.md:46`
(*"40 terrain types"*). The one figure the author measured himself, the line count that `wc -l`
answers in a second, is exact. `npm run stats` — the command that ends this failure mode by parsing
the live data sections — did not exist for another three weeks (`8c9a482`, §DX-01g). Both source
documents are **still stale at HEAD** (§DX-02co).

Two sidecars exist, both optional:

1. **`wbapi-server.js`** — a Node HTTP server that opens the game file, extracts its collections by
   *parsing the JavaScript source text* (comment-aware brace counting), and serves them as REST on
   port 1367. It is at once a world-editing API, a headless MUD server, and a mesh node.
   **RELOCATED:** the mesh half left this file **nine hours after the report's last edit** —
   `4367a38` (2026-07-06 17:01), *"mesh layer extracted to mesh.js — 434-line kernel moved
   verbatim"*. Every excerpt below is still verbatim; the anchors point at `js/mesh.js`.
2. **`worldbuilder.html`** — the separate editing UI. Its 🌐 **Mesh tab** is the operator's window
   into everything described here.

### B. The problem, under three unusual constraints

A player in one browser should see a friend from another browser — possibly on a *different* server
on a *different* machine — standing in the same cell, chat with them, and watch them move on the
minimap; and servers should find each other from one pasted link.

- **C1 — The file stays sovereign.** No component may become "the real server" the HTML merely
  renders; the game stays fully playable offline, forever. Multiplayer is additive and opt-in.
- **C2 — No new infrastructure classes.** Permitted: the Node sidecar, HTTP POST, Server-Sent
  Events, text files. Not permitted: a database, a broker, a DHT library.
- **C3 — Friends-scale, hostile-tolerant.** Tens of servers, dozens of players — but every ingress
  must tolerate a hostile stranger, because the discovery layer deliberately makes servers findable.

### C. The central trick

Synchronization is hard when multiple writers mutate one record; the architecture is arranged so
**this never happens**. Presence records are owned by the session's origin server, tracker records by
the announcing server, peer entries by whoever observed the peer. Everyone else holds a **read-only
replica** they may discard at will.

| Classical problem | What it becomes here |
|---|---|
| Conflict resolution | Impossible by construction (one writer per record) |
| Ordering | A per-origin monotonic sequence number |
| Duplicate suppression | A version vector: `maxSeqSeen[originId]` |
| Convergence | Periodic full-snapshot exchange (anti-entropy floor) |
| Failure of a replica | Nothing — replicas are disposable |
| Failure of the origin | TTL expiry of its records everywhere |

The one place two parties genuinely co-author a record — an item **trade** — is quarantined into its
own design (§X.C). *Everything shipped today is single-writer.* **RETIRED:** that sentence expired
the day it was amended; the economy shipped 2026-07-06 (§XII.C).

---

## II. What This Adds to the Game

Roll2Hit's spine is solitary and finite: one Fighter, a 49-day doom clock, seven Codex Shards, and a
world that ends whether or not you were ready. Everything pushes toward *consequence* — XP for
effort, mission bits as receipts, NPC favor the ending reads back to you. What the spine could not
produce is a **witness.** A world where every choice is permanent and nobody else was there to see it
is a diary, not a place.

The mesh supplies exactly that, and deliberately not more:

- **Somebody is standing here.** Cell-scoped presence and chat let the tavern cell at Birka hold two
  people at once. The `☺` on the minimap is a person, and they arrived by walking — there is no jump
  travel in this game for anyone.
- **Company changes the arithmetic, gently.** §MESH-01f grants **+1 to hit per co-present ally,
  capped at +2** (`function _partyHitBonus(allies)@28655`), **+10 % XP and gold per ally, capped at
  +20 %** (`function _partyLootMult(allies)@28656`), and **halves the wilderness encounter rate**
  for a party travelling together (`function _partyEncounterRate(base)@28667`). The doom clock is the
  real currency: a halved encounter rate is *days*, and days are shards.
- **Somebody can hold the road.** §MESH-01h sentry bots suppress encounters in the cell they garrison
  and auto-assist a battle there — and are explicitly excluded from the party bonus, so a garrisoned
  junction cannot inflate anyone's to-hit (`function _mpAllyCount()@28648`).
- **A world is a thing you can hand someone.** The file *is* the game, so forking is copying, and the
  world tag (`Roll2Hit-131ea`) tells two strangers at a glance whether they are playing the same
  world at all. A mod author brands their fork and gets their own swarm free.
- **None of it is compulsory.** A page that never clicks 🌐 constructs no mesh state whatsoever. That
  is C1, and it is why the tower is built *beside* the game rather than under it.

The cost is stated honestly in §V.C and audited in §XII: co-presence buffs mean the mesh **can** move
a die roll — a promise this report made in absolute terms and the project retired three days later,
on purpose, on this report's own roadmap.

---

## III. The Layer Stack

```
L6  Observability & trust      Mesh tab, packet ring, BIG WARNING modal, world-diff
L5  Bootstrap & advertisement  --peer / peers.txt / peers-cache.json / BOOTSTRAP_URLS,
                               --bind/--advertise, magnet links
L4  Rendezvous                 tracker role: announce tables, world groups, federation
L3  Replication                gossip rounds, version vectors, snapshots, PEX
L2  Delivery                   cell-scoped SSE broadcast to attached browsers
L1  Sessions                   SESSIONS map, beacon vs. move, instanced encounters
L0  Identity                   serverId, ENGINE_VER, worldHash, WORLD_NAME, pid
```

**Each layer degrades independently.** Kill the tracker and gossip carries on; kill gossip and local
sessions still see each other; kill the server and the game file is the single-player game it always
was. That is C1 realized structurally.

---

## IV. L0 — Identity

### A. The three-part compatibility identity

Two servers may synchronize presence **only if players from one can legally stand in the other's
world**. A player replicated onto a map where their cell is open ocean is not a synchronization bug —
it is an *identity* bug: the servers should never have spoken. Compatibility is settled before any
state flows, on three terms: **`MESH_PROTO`** (wire-protocol version), **`ENGINE_VER`** (the game
build, a constant *in the HTML file*; the server parses it out), and **`worldHash`** — SHA-256
truncated to 16 hex over the **raw source spans of all eight data collections**
(`js/wbapi-server.js:const MANIFEST_PARTS@674`: `NODE_MAP`, `NODE_COORDS`, `SEA_RUNS`, `SEA_LANES`,
`ROAD_RUNS`, `QUEST_DB`, `MONSTER_POOL`, `WORLD_DB` — same eight, same order, at HEAD).

The manifest parses the file the way the rest of the API does — a comment- and string-aware bracket
scanner per collection — then hashes each span as it sits on disk
(`js/wbapi-server.js:function getManifest@676`):

```js
const sha16 = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
for (const name of MANIFEST_PARTS) parts[name.toLowerCase()] = sha16(rawSpan(src, name));
const worldHash = sha16(engineVer + '|' + MANIFEST_PARTS.map((n) => parts[n.toLowerCase()]).join('|'));
```

Hashing *source spans* rather than parsed values makes the hash a property of the artifact people
actually share, and needs no canonicalization: two files whose quest tables differ by one comma are
different worlds. The per-collection `parts` hashes are **diagnostics only** — when two operators
find their worlds differ, `GET /api/manifest` says *where* (`quest_db` differs, `node_map` matches:
somebody modded quests) — and per-part equality never licenses partial sync. The hash's *scope* is a
stated boundary: narrative tables are **not** hashed, so a pure-dialogue mod does not fork the swarm.
*Hash what determines where players can stand and what they can fight; leave prose free.*

> **⚠ Live finding (§DX-02cp).** `ENGINE_VER` has read `r2h-3.104.0` since `80526b1` (2026-07-02) —
> the commit that introduced it — and has not moved across the 4,218 lines added since. *"Every
> release is deliberately a separate, incompatible swarm"* is carried entirely by `worldHash`. The
> triple works; one of its three legs is inert.

### B. Human-facing identity

A 16-hex hash is a terrible thing to say out loud, so each world file carries a display name
(`const WORLD_NAME = 'Roll2Hit'`) and every human surface renders the **world tag**
`<name>-<hash5>`, e.g. `NextWorldMod-131ea` (`js/wbapi-server.js:function worldTag@700`). The halves
serve opposite masters: the name is *chosen* (a mod author brands a fork), the suffix is *earned* (it
separates two forks that picked the same name, and two renames of identical data collapse to one
suffix). The name is excluded from the hash precisely so naming is free — **identity is what you are;
the tag is what you're called.**

### C. Server and player identity

Each server mints a persistent random 16-byte **`serverId`** in `.wbapi-server-id`, and every
replicated fact is namespaced by its owner's. Player identity composes the two:

```js
// §MESH-01-FU 3 — the player id every presence surface carries: origin server +
// session, never the display name (two "Bob"s must never misattribute a leave).
function pidOf(sessionId) { return getServerId().slice(0, 8) + ':' + String(sessionId).slice(0, 8); }
```

*(`js/wbapi-server.js:function pidOf@119` — byte-identical at HEAD, comment included.)*

The rule "never key anything by display name" was learned the usual way: the first client keyed its
co-presence list by name, and two players called *Bob* could not coexist — when either left, both
vanished. The fix threads `pid` through every surface, and the client renders `name@server` only when
a collision is actually present. **Names are for humans; identity is for machines; the system never
confuses the two.**

---

## V. L1/L2 — Sessions and Cell-Scoped Delivery

### A. The beacon/move dichotomy

The server has carried headless MUD sessions since §WALK-5: `session/start` creates one at the hub,
`session/move` walks it cell-by-cell through the same kernel the browser uses (`MOVER:CORE`,
byte-identical and parity-checked in CI), and the server rolls *instanced* encounters from the
session's own seed.

When the browser became a mesh client, a hazard appeared. Single-player is **client-authoritative**
over its own movement — the browser rolls its own encounters — so had the browser reported movement
via `session/move`, the server would roll a *second* encounter for the same step, corrupting
single-player the moment multiplayer is switched on and violating C1. The resolution is two verbs
with disjoint contracts:

| Verb | Caller | Moves the session | Rolls encounters | Purpose |
|---|---|---|---|---|
| `POST /api/session/move` | headless MUD clients | yes (server-simulated) | **yes** (instanced, seeded) | the server *is* the game |
| `POST /api/session/pos` | browser clients | yes (validated teleport) | **never** | the game *tells* the server |

`session/pos` is a **display-only beacon**: it validates the reported cell against the mover world —
rejecting open ocean and off-band rows, *no ghosts in the ocean* — updates coordinates, emits
presence events, and touches nothing else. Green at HEAD, in the harness's words: *"pos response
carries no encounter (beacon rolls nothing)"* and *"pos never sets an encounter (display-only
beacon)."*

### B. Cell-scoped broadcast

Browsers hold an open SSE stream; presence and chat are **cell-scoped**, so an event at `(r,c)`
reaches exactly the sessions standing at `(r,c)`:

```js
function broadcastCell(r, c, event, data, excludeId) {
  for (const [id, s] of SESSIONS) {
    if (s.r === r && s.c === c && id !== excludeId) {
      const sse = SSE_CLIENTS.get(id);
      if (sse) sseSend(sse, event, data);
    }
  }
}
```

*(`js/wbapi-server.js:function broadcastCell@129` — byte-identical at HEAD.)*

This is the §WALK-5 *co-presence* property, and the harness treats it as sacred: chat reaches
co-present sessions exactly once, never a session one cell away, and the sender exactly once.
Exactly-once is trivial here — one server, one loop — but it becomes the *specification* the
replication layer must preserve across servers.

> **Amendment (§MESH-01-FU 4, §MP-CHAT-GLOBAL).** Two event types later earned a deliberate
> worldwide exception: `player_moved` (map dots need moves the watcher's cell never hears about) and
> `chat_world`. Both are display-layer only; arrive/left/local-chat semantics are untouched.

### C. The client: opt-in, render-time, free-movement

Multiplayer began as a ~150-line `MP` module with three entry points (🌐 toggle, beacon, chat) and one
iron rule — **presence is display-only**:

```js
// §MESH-01a: other players in view (display-only multiplayer presence)
if (!isPlayer && MP.on && MP.nearby.some(p => p.r === r && p.c === c)) {
  cell.textContent = '☺';
  cell.style.color = '#7fd4ff';
}
```

*(Byte-identical at HEAD — `MP.nearby.some(p => p.r === r && p.c === c)@37368`.)*

This report made four claims about that rule. **Three held for 46 days; one was retired in three, by
a rung on this report's own roadmap.**

- ✅ **"The movement kernel never reads MP state."** HOLDS. `js/mover.js` has zero `MP` references at
  HEAD, and the engine re-states the guarantee at each new site that earned one: *"Client-side roll
  adjustment only — the mover never reads it (Free-Movement holds)."*
- ✅ **"Remote players never block a cell."** HOLDS — invariant #1: nothing may refuse a step.
- ✅ **"A page that never clicks 🌐 constructs no MP state."** HOLDS, asserted by a Playwright test.
- ❌ **"There is no way for the mesh to alter a die roll."** **RETIRED `a07b281` (2026-07-05).**
  §MESH-01f is precisely mesh state altering rolls: to-hit, XP, gold, encounter rate (§II). The
  mitigation is real and worth the record — ally count is snapshotted **once, at battle start**, into
  transient state, with the reason written at the site: *"a party member wandering off mid-fight
  can't strip a buff already earned. Transient battle state (`S`, never `S_story`): a save file must
  not carry mesh state."* (`S.partyAllies   = _mpAllyCount()@24647`.)
- ⚠ **"MP state … never in the save file."** **CORRECTED.** The session id still lives only in
  `sessionStorage`, so the hazard the sentence guarded — *a save carrying a dead session id* — never
  occurred. But two mesh fields now persist: `S_story.playerKey` (`function _mpPlayerKey()@28980`,
  the durable trade credential) and `S_story.pvpOff`. Neither is declared in `_S_DEFAULTS()`, with a
  consequence the ledger design did not intend (§DX-02cn).

  *The lesson outlives the correction: **state an invariant at the width of the hazard it prevents,
  not wider.** "No session id in the save" would still be true today. "Never in the save file" was
  falsified by the first legitimate exception — and once the wide form falls, nothing defends the
  narrow one.*

---

## VI. L3 — Replication: The Gossip Mesh

### A. What is replicated

Two things, both ephemeral: an **event log** (the last ≤500 presence events — `player_arrived`,
`player_left`, `chat` — each stamped `(seq, ts, type, data, r, c)` from one per-server monotonic
counter) and a **snapshot** (the complete current session list, stamped with the counter at capture).
Nothing durable crosses the wire; world *mutations* are multi-writer and quarantined.

> **Amendment (§MESH-01i).** There is now a **third**: `ledgerVV`, the durable economy chain's
> frontier, on the same payload. The §X.C amendment predicted this asymmetry before it shipped and
> named it correctly — §XII.C.

### B. The gossip round

Every ~2 s (`js/mesh.js:const MESH_GOSSIP_MS@116`) each server pushes its payload to ≤3 random peers
and merges what comes back. The payload is self-describing — identity triple, then state, then peer
candidates (`js/mesh.js:function meshPayload@216`):

```js
return {
  serverId: getServerId(), proto: m.proto, engineVer: m.engineVer, worldHash: m.worldHash,
  addr: meshAdvertise(), vv: MESH.vv,
  events: MESH.log.slice(-100), snapshot: localSnapshot(),
  peers: [...MESH.peers.keys()].slice(0, 20),          // PEX
};
```

Ingress applies three gates *in order* — compatibility (409), sanity (400), ACL (403) — before any
merge (`js/mesh.js:function meshIngest@228`). **A gossip POST is answered with a full gossip
payload**: every exchange is bidirectional, halving convergence time and letting a server behind an
unroutable address — able to dial out but not be dialed — still receive state on every round it
initiates. **PEX** rides the same payload: each side lists up to 20 known addresses and adopts
unknown ones as candidates for a later round, so one live address bootstraps the entire mesh and the
topology self-heals — the mechanism BitTorrent clients use to wean themselves off trackers [4].

### C. Deduplication: the version vector

Because only the origin ever *creates* events with its serverId, stamped from one monotonic counter,
a receiver needs exactly one integer per origin to reject every duplicate, however many gossip paths
redundantly deliver it (`js/mesh.js:function meshMergeEvents@176`):

```js
let last = MESH.vv[originId] || 0;
for (const ev of (events || []).slice().sort((a, b) => a.seq - b.seq)) {
  if (!ev || typeof ev.seq !== 'number' || ev.seq <= last) continue;   // dup: drop
  last = ev.seq;
  // Fan fresh remote events out to co-located LOCAL sessions only; replayed
  // history still advances the version vector (dedup) but stays silent.
  if (now - (ev.ts || 0) <= MESH_FANOUT_MAX_AGE) { /* … broadcast by type … */ }
}
MESH.vv[originId] = last;
```

Two details carry most of the correctness weight:

- **Dup ≠ silence only; dup = not re-gossiped.** An event at or below the vector is dropped *and
  never re-announced*, which — with the bounded tail — prevents flood loops in a cyclic topology.
  There is no hop-count arithmetic; **the version vector *is* the loop suppressor.**
- **The freshness window** (`js/mesh.js:const MESH_FANOUT_MAX_AGE@118`, 10 s). A rejoining server
  receives a peer's whole recent history; replaying week-old arrivals as live toasts would be absurd.
  Stale events advance the vector silently, only fresh ones reach browsers — separating the two roles
  an event plays: *state transfer* (always) and *notification* (only when timely).

> **Deferral closed.** The stated cost — *"a joining player receives no chat backlog"* — **shipped as
> §MESH-01-FU 13** (`e13338e`): fresh cross-server chat now joins a backlog ring while replayed
> history stays out, because the vector has already passed it. The deferral's own mechanism is what
> makes the fix safe.

### D. The anti-entropy floor

Logs are capped and tails bounded, so a long partition can lose events irretrievably. The system does
not fight this; it **out-floors** it. Every payload carries the origin's *complete* session list, and
the merge replaces the replica if the snapshot is at least as new
(`js/mesh.js:function meshMergeSnapshot@207`):

```js
if (!snap || typeof snap.seq !== 'number') return;
if (snap.seq < rec.snapSeq) return;        // stale snapshot from an older round
rec.snapSeq = snap.seq;  rec.lastSeen = Date.now();
rec.sessions = new Map((snap.sessions || []).map((s) => [s.sid, { name: s.name, r: s.r, c: s.c }]));
```

The guarantee is strong and simple: **event loss can delay presence, never corrupt it.** Whatever a
partition did, the next successful round replaces the replica wholesale with ground truth. Snapshots
are idempotent state exchange; events are an optimization for latency and notification. The shape is
familiar from the literature: the snapshot is Demers et al.'s anti-entropy mechanism [1], the event
tail is rumor-mongering, and the version vector is the standard causal summary [2] degenerated to one
counter per origin because writers never interleave. Replicas expire by TTL
(`js/mesh.js:const MESH_ORIGIN_TTL@117`, 90 s of silence) — an origin that stops heartbeating takes
its players off everyone's maps with no teardown message.

### E. What remote players look like locally

Replicated sessions are woven into the *same* read surfaces local ones use — `look` player lists,
`who.remotes`, `pos.nearby` — tagged with their origin
(`js/mesh.js:function remotePlayersAt@156`). Because the client consumes presence through those
unchanged surfaces, **the browser needed zero changes when the mesh shipped**: a same-cell friend
from another server lands in the same `players` array a same-server friend does. L3 slotted in under
L2 without disturbing it.

---

## VII. L4 — Rendezvous: Trackers and Federation

Gossip needs one live address to start from; the tracker hands out that address and *only* that. Two
principles bound it. **Rendezvous only, never a relay** — no presence, chat or world data transits a
tracker. **Not a new stack** — a tracker is the *same* server started with `--tracker-mode`, serving
only ping, manifest and `tracker/*` and answering everything else **`410 Gone`** (9 sites at HEAD).

Servers announce every ~30 s (`js/mesh.js:const MESH_ANNOUNCE_MS@439`) with the identity triple,
advertised address, player count and names. The tracker keeps one record per serverId — single-writer
again, the announcing server owns it and the tracker merely ages it out — and answers with **K ≤ 8
random peers from the same world group**, the same `(proto, engineVer, worldHash)` triple.
Incompatible worlds are *segregated, not rejected*: a modded fork announces into its own group, sees
its kin, and never pollutes another world's peer lists (green at HEAD: *"the incompatible server is
tracked in its OWN world group (segregated, not dropped)"*). Randomizing the K spreads the mesh's
edges instead of having every newcomer dial the same oldest server [4].

**Tracker death is a non-event.** Dependence is front-loaded entirely into first contact; afterwards
PEX propagates addresses, `peers-cache.json` persists the last-known-live set across restarts, and
gossip carries on. A restarted tracker repopulates within one announce interval, since the table was
only ever a cache of heartbeats — which is why it is deliberately **in-memory**. Durable tracker state
would be a liability (stale addresses served authoritatively) pretending to be a feature.

**Federation** lets two communities join discovery domains without either surrendering control: an
operator points tracker B at tracker A with `--tracker-peer <url>` and the two exchange announce
tables (`js/mesh.js:function trackerMergeRecords@396`). This is *structurally the same function* as
the presence merge in §VI — records owned by a single writer, merged by freshness, aged by TTL, gated
by ACL — with three deliberate touches:

- **`ageMs`, not timestamps.** Records carry their *age* relative to the sender's clock; the receiver
  reconstitutes `lastSeen` against its own, so federation survives disagreeing wall clocks because no
  absolute time ever crosses the wire.
- **Idempotent exchange ⇒ no flood loops by construction.** Merging the same table twice is a no-op,
  so federation cycles need no suppression machinery — the strongest loop prevention is *there being
  nothing to loop*.
- **Bounded tables, updates-preferred** (`js/mesh.js:const TRACKER_MAX_RECORDS@388`, 500). A spammer
  can fill the table with garbage serverIds but cannot *evict* legitimate records, whose refreshes
  always land — the contract stated in the source in five words: *"updates always land, new ids drop
  when full."*

Federation is manual and operator-initiated, an intentional asymmetry with PEX. Mesh peers
auto-propagate because a bad peer costs one wasted dial; trackers are *trust anchors*, and connecting
two of them is a governance act, not a routing event.

---

## VIII. L5 — Bootstrap and Advertisement

### A. The bootstrap ladder

Five rungs, cheapest first, all additive:

```
1. --peer host:port            CLI flags        (LAN party: point at your friend)
2. MESH_PEERS env              (deploy scripts)
3. peers-cache.json            last-known-live peers, written automatically
4. peers.txt                   operator-edited config file; also holds `tracker <url>` lines
5. TRACKER_URL / BOOTSTRAP_URLS network rendezvous + text-file-over-HTTP backup
```

Rungs 1–4 are consumed by one function at boot — verified exact and **in this order** at
`js/mesh.js:function loadStaticPeers@317`. Rung 3 closes the loop automatically: every 30 s the
server persists currently-live addresses, so the *next* boot starts where the mesh last was — the
"resume from cached peers" trick DHT clients use to survive bootstrap-node outages [6]. *(The file
moved to `config/peers.txt` in the 2026-07-09 layout change; the format is unchanged.)*

### B. `BOOTSTRAP_URLS`: dumb text over HTTP as infrastructure

The most striking decision here is what a "bootstrap server" is: **any URL serving plain text in the
`peers.txt` format** —

```
# r2h mesh bootstrap — one entry per line
tracker http://tracker.example.org:1368
192.168.1.20:1367  r2h-3.104.0  131eabc131eabc00
```

— fetched once at boot and parsed with the *same* parser as the local file
(`js/mesh.js:function fetchBootstrapUrls@466`). The recommended host is a versioned, revocable, free
public gist, but a PHP echo, an object store or a file copied onto any VPS works identically, because
clients only ever GET text. The system imposes *no* requirement beyond "serves bytes": external
infrastructure is used at minimum trust, as a hint source whose every entry must still pass the
compatibility gate and the ACL. Publishing is **deliberately manual** — an automated publisher would
be a standing takeover vector (compromise it, redirect every future boot), whereas a hand-published
file is a human-reviewed artifact with version history. *(A helper script for the copy step shipped
as §MESH-01-FU 7, `02470c3` — a helper for the human, not a replacement of them.)*

### C. `--bind` vs `--advertise`

A mesh node has two addresses and conflating them is the classic self-hosting failure. **Bind** is
where the OS accepts connections; **advertise** is what you tell others to dial. The defaults are
deliberately anti-social — bind `127.0.0.1`, advertise `localhost:PORT`
(`js/mesh.js:function meshAdvertise@123`) — while a real cross-machine mesh needs *both*
`--bind 0.0.0.0` and `--advertise <lan-ip>:<port>`. Each failure mode is distinct and self-inflicted:
loopback bind means nobody can reach you; localhost advertise means every peer you gossip to is told
to dial *itself*. Because misconfiguration is silent — the local mesh works perfectly on one machine
— the server diagnoses it aloud, at startup and in `GET /api/mesh/status`
(`js/mesh.js:function meshReachabilityWarnings@135`, verbatim at HEAD including both warning
strings). The guard clause is the point: **loopback is only a warning when peers are configured.**
Private by default, loud when it matters.

### D. The magnet link: the whole system in one line

```
r2h:?p=1&ev=r2h-3.104.0&wh=131eabc131eabc00&tr=http://tracker.example:1368
```

Modelled on BitTorrent magnet URIs [5]: `wh` plays the infohash role — it names the *world-swarm*,
not any server — and `tr` names a rendezvous that resolves it to live addresses. The Mesh tab
**copies** this link; the game's 🌐 server browser **parses** it
(`function mpParseMagnet(str)@29296`): resolve `tr`, filter the group by `wh`, ping each candidate
from the browser, render `name · worldTag · players · ping`, and *Join* — which does nothing but
rewrite the stored server address and reconnect. The flow is exercised end-to-end as a Playwright
test against a real spawned tracker, because it is the most important user journey the architecture
exists to serve.

---

## IX. L6 — Observability and Human Trust

Distributed systems fail invisibly, and a friends-mesh run by non-experts needs its packets
*visible*. Every ingress and egress at L3–L5 — gossip in/out, announces, bootstrap fetches,
federation merges, and every *refusal with its reason* — is pushed into a bounded ring of 200
(`js/mesh.js:function pushTraffic@112`), served by one endpoint and rendered by the worldbuilder's 🌐
Mesh tab as the "information passed" log, beside identity, tracker world groups, per-peer liveness,
remote players, reachability warnings and the server browser. The tab is a **pure read-only view** —
it polls, renders, can trigger a ping, and cannot mutate mesh state.

**The world-download boundary is where sync stops and humans start.** The file-is-the-world premise
has a sharp consequence: *sharing a world means sharing a program.* The mesh will tell you a peer's
address, and `GET /api/world/download` will serve their entire game file with identity headers —
refused in tracker mode with **410**, because rendezvous is never a relay, not even of files
(asserted at HEAD in the report's own words: *"tracker-mode refuses world download (rendezvous only,
never a relay)"*). What the system will **not** do is pretend this is safe. The ⬇ button sits behind a
modal stating the facts in capital letters — *you are downloading someone else's CODE; it is
MIT-licensed; it is saved as a separate file that never touches your world; inspect before opening* —
and the inspection tool ships with it:

```
$ node scripts/world-diff.js roll2hit-v3.html world-9f3ab2c1-131eabc131eabc00.html
  quest_db      DIFFERS   (+3 entries: Q_MIRE_1, Q_MIRE_2, Q_MIRE_3)
  monster_pool  DIFFERS   (~1 entry: bog_hag)
  node_map      identical
  ▓▓ CODE DIFFERS OUTSIDE DATA COLLECTIONS — REVIEW EVERY CHANGE BY HAND ▓▓
```

`world-diff` classifies a fork by its **modification set** and screams if anything changed *outside*
the data spans, because a data mod and a code change are categorically different trust decisions. It
is live at HEAD, gained per-entry field diffs and `--json` in §MESH-01-FU 9, and is now a CI gate —
`check:worlddiff` passes its self-test, including *"ENGINE_VER bump is flagged by name AND trips the
code-differs gate."*

This is the philosophy of the whole layer: **the synchronization machinery moves bytes; humans move
trust.** Every place the system could have automated a trust decision — publishing bootstrap files,
federating trackers, importing worlds — it produced a legible artifact and handed the decision to a
person instead.

---

## X. Security Model and Its Honest Limits

### A. What is enforced

- **Compatibility gating** (409) precedes everything; a wrong-world payload cannot reach the merge.
- **ACLs** (`config/mesh-acl.json`, hot-reloaded): allow/block by serverId, IP and worldHash, with an
  `allowlist` mode for private meshes — applied at gossip ingress, gossip dial-out, tracker announce
  and federation merge. Every doorway, same rules.
- **Shape validation everywhere addresses travel.** ServerIds must be 32-hex; addresses must match
  `^[\w.-]+:\d+$`. **Verified: that regex occurs 11 times across four files — 3 in `js/mesh.js`, 2 in
  `js/wbapi-server.js`, 1 in `worldbuilder.html`, and *5 in the game file itself*** — exactly the
  claim that it is re-checked *again in the browser* before any address reaches the server-browser
  DOM, so a hostile tracker cannot smuggle markup through a peer row. The strongest positive in this
  verification: the defensive claim is not merely true, it is densest where it matters most.
- **Bounded everything.** Event logs (500), gossip tails (100), traffic rings (200), tracker tables
  (500, updates-preferred), name fields (60 chars) — all exact at HEAD. Memory exhaustion via chatter
  is structurally off the table.
- **Single-writer merges.** A malicious peer can lie about *its own* sessions — it owns them — but
  cannot mutate another origin's replica. There is no code path where B's payload writes into A's
  record.

### B. What is deliberately not enforced

The single-file game is client-authoritative; a player *is* their file plus their save. The mesh does
not verify stats, saves or grinding legitimacy — a maxed character that is *shaped* legitimately
cannot be told from an edited one, and the design refuses to pretend otherwise. That trust stays
social: you meshed with a friend; you can ACL-block a stranger.

> **Hardening closed.** *"Known open hardening: per-IP token-bucket rate limiting ahead of JSON
> parse (§MESH-01-FU 8)"* — **shipped `0f5439e`**, four days after the sentence was written. 30
> requests/s sustained, 120 burst, both env-tunable.

### C. The quarantined multi-writer problem

Trades and duels are the two features where two parties co-author one fact, and both reuse this
report's primitives rather than importing consensus: every item gets a **mint id**
`(originServerId, seq)` — the presence-event identity scheme; each player's economy history is a
hash-chained, append-only log; a trade is one event signed into *both* chains; ownership is the
longest valid transfer chain from mint; and a double-spend caught at gossip-merge is voided by
deterministic fork-choice (lowest event hash) — detection-and-void on merge, not up-front global
consensus, because trades are rare and optimism is cheap. Duels add a commit-reveal seed (neither
side can steer the RNG) and a pure, replay-checkable resolution function (`DUEL:CORE`), making a
cheater *"a machine that disagrees with a pure function of committed inputs."*

Concrete data shapes were specified in the 2026-07-06 design pass — `lab-report-mesh-multiuser.md`
§6. The one asymmetry that section introduces: the economy is the sole **durable, uncapped,
disk-persisted** replica (`ledger/<serverId>.jsonl` on a parallel gossip channel), where every other
replica here is TTL-bounded and disposable — the price of two multi-writer facts, quarantined to
exactly these two rungs.

> **RETIRED — and this is the report's best moment.** *"These are design-locked but unshipped"* was
> true for roughly nine hours. Both rungs shipped the same day the sentence was written: the ledger
> in four commits (`5536685` single-server mint+trade → `87970d1` durable identity + cross-mesh
> replication → `a3836f5` client rung → `c27f6f5` cross-origin co-signed trades) and duels in
> `73f7faf`. **The amendment's prediction was exact in every particular** — `ledger/` at the repo root
> holds a `<serverId>.jsonl` chain today, `ledgerVV` rides the gossip payload as the promised
> parallel channel, and `player8 = sha256(playerKey).slice(0,8)`
> (`js/wbapi-server.js:function playerKeyRegister@290`) is the durable identity §6.4 specified. *A
> design paragraph that predicts its own implementation down to the filename is the rarest thing in
> this corpus.*

---

## XI. Evaluation

Properties are pinned by a layered test pyramid, runnable from a cold checkout. **Every figure was
exact on the report's own day** — read off the run, not recalled:

| Pin | As written (2026-07-02) | At `9dd029b` | At HEAD |
|---|---|---|---|
| `tests/mud-harness.mjs` | "75 checks" | **75** ✅ (`56def8a`: *"harness 75"*) | **269** (267 ✓ / 2 ✗) |
| Playwright presence | "4/4" | **4 tests** ✅ | 7 |
| Playwright mesh tab | "4/4" | **4 tests** ✅ | 4 |
| `check:walk` | "6 gates" | **6** ✅ — invariants · parity · behaviour · terrain · roads · roomsparity | **16** |

The harness spawns real server processes — three-server gossip meshes, a tracker, *federated*
trackers, misconfigured-reachability servers — and asserts nine properties this report names:
exactly-once chat across replayed gossip rounds; cell-scope isolation; beacon-never-rolls;
incompatible-worldHash 409 + invisibility; allowlist 403; stranger discovery via tracker alone *and*
via a plain text file alone; federation convergence (a server announced only to tracker A found via
tracker B); pid distinctness for same-named sessions; and TTL pruning closing SSE streams.

**All nine are green at HEAD**, 46 days and 194 new checks later. The last deserves a footnote:
harness section `[D]` is currently **red**, but the two failures are *"after idle TTL, exactly one
session survives"* and *"Warm (kept active) survives"* — the keep-alive half. This report's claim,
*"TTL pruning closing SSE streams,"* is the assertion that stays green inside the red section:
*"pruned Ghost's SSE stream was closed by the server"* ✓ and *"pruned Ghost session is gone (look
404s)"* ✓. **The prune is correct; a 700 ms timing budget in the assertion is not** (§DX-02ca). *Score
the assertion, not the section — a red section does not falsify a claim naming a different line in
it.*

Convergence is bounded by construction rather than measured: with gossip period *g* = 2 s, fanout 3
and *N* servers, fresh events reach all origins in O(log N) rounds, snapshots hard-bound staleness at
one successful round, and origin death is visible within 90 s. The interesting number is what the
design *avoids* paying: zero coordination messages when idle, and zero infrastructure beyond the
processes the operator already runs.

---

## XII. Verification Ledger (§DOC-02bv, 2026-08-17)

### A. Spec → shipped

| # | Claim | Verdict |
|---|---|---|
| 1 | 57 named symbols across four files | **All resolve.** Mesh half relocated to `js/mesh.js` |
| 2 | 14 cited functions | **All live.** `broadcastCell`, `pidOf`, the §V.C client paint, the announce body, `meshReachabilityWarnings`, `meshAdvertise`, `pushTraffic` byte-identical incl. comments |
| 3 | 13 constants (2 s · fanout 3 · 100 tail · 20 PEX · 500 log · 200 ring · 90 s TTL · 10 s freshness · 30 s announce · 30 s cache · K≤8 · 500 records · 60-char names) | **13/13 exact** |
| 4 | Eight `MANIFEST_PARTS`, same order | **Exact** |
| 5 | Five-rung bootstrap ladder, rungs 1–4 in `loadStaticPeers` | **Exact and in order** |
| 6 | `^[\w.-]+:\d+$` re-validated in the browser | **Exact — 11 sites, 5 in the game file** |
| 7 | 410 in tracker mode incl. world download | **Exact**, asserted in the report's own words |
| 8 | §XI figures (harness 75 · presence 4/4 · mesh tab 4/4 · walk 6 gates) | **4/4 exact for their day** |
| 9 | §I.A orientation figures | **2 of 5** — lines and grid exact; monsters, terrains, quests copied from stale docs |

### B. Claims retired or corrected

| Claim | § | Fate |
|---|---|---|
| *"No way for the mesh to alter a die roll"* | V.C | **RETIRED** `a07b281`, +3 d — §MESH-01f co-presence buffs. Its three sibling claims **hold at HEAD** |
| *"MP state … never in the save file"* | V.C | **CORRECTED** — `S_story.playerKey` + `pvpOff` persist. The narrow hazard (a dead session id in a save) never occurred |
| *"Everything shipped today is single-writer"* / *"design-locked but unshipped"* | I.C, X.C | **RETIRED** same day as the amendment — ledger + duels in five commits |
| *"all excerpts verbatim from `wbapi-server.js`"* | App. | **RELOCATED** `4367a38`, +9 h. Still verbatim, now `js/mesh.js` |
| *"a joining player receives no chat backlog"* | VI.C | **DEFERRAL CLOSED** — §MESH-01-FU 13 |
| *"Known open hardening: rate limiting"* | X.B | **CLOSED** `0f5439e` |

### C. The roadmap scorecard

§XIV named nine remaining rungs *in order*. **Every one shipped, in that order, within four days:**

| Rung as written | Shipped | Interval |
|---|---|---|
| realtime remote-player minimap push (FU 4) | `0d79e18` | **same day** |
| session auto-reconnect (FU 5) | `a34b474` | **same day** |
| manifest-scope decision made formal (FU 6) | `4bbe17f` | **same day** |
| co-presence buffs + party loot share | `a07b281` | 3 d |
| hireling bot | `26bfed0` | 3 d |
| sentry bots | `ff413f6` | 4 d |
| rate limiting (FU 8) | `0f5439e` | 4 d |
| the no-dupe ledger | `5536685`→`c27f6f5` | 4 d |
| consensual duels | `73f7faf` | 4 d |

**A follow-up register behaving as a schedule rather than a wish-list — and the predictor is visible
in the writing.** Every rung was named as an increment inside an existing numbering scheme (FU 4/5/6/8,
ladder f–j), not as a prose category. A named rung has an owner and a next commit; a category has
neither. *Score a forward ladder against the clock, not only against the ledger: nine for nine in four
days is a plan; one unfiled prediction ageing 26 days is a defect.*

### D. Defects filed

- **§DX-02cn** 🟢 — `S_story.playerKey` and `S_story.pvpOff` are undeclared in `_S_DEFAULTS()`
  (`const _S_DEFAULTS = () => ({@23062`). Because `storyNewGame` does `Object.assign(S_story,
  _S_DEFAULTS())` on the live object rather than replacing the binding, a field absent from the
  defaults shape **survives a New Game** — so a fresh character inherits the previous character's
  bearer credential and, with it, its economy chain.
- **§DX-02co** 🟢 — the two figures this report copied are still wrong at source:
  `docs/notes/docs-dev-environment.md:55` says *"216+ monsters"* (live: 398);
  `docs/spec/spec-migration.md:46` says *"40 terrain types"* (live: 111).
- **§DX-02cp** 🟡 — `ENGINE_VER` has not moved off `r2h-3.104.0` since the commit that introduced it,
  so one leg of the compatibility triple is inert (§IV.A).

---

## XIII. Related Systems (Informal)

A deliberate collage of well-worn ideas, chosen for being *explainable to an operator in one sentence
each*: epidemic replication and anti-entropy from Demers et al. [1]; version vectors as causal
summaries [2], degenerate to per-origin counters under single-writer discipline — the same
observation that makes Lamport's total order [3] unnecessary here; tracker rendezvous, PEX and magnet
links from the BitTorrent ecosystem [4], [5]; cached-peers bootstrap from DHT practice [6]; and the
mint-id/ledger approach to duplication from the post-mortem folklore of Diablo-style item duping.
What is arguably novel is only the constraint set: all of it squeezed into one sidecar process and
some text files, beside a game that must remain a single HTML artifact.

---

## XIV. Conclusion

A useful class of multiplayer — presence, chat, discovery, and community formation around forkable
worlds — needs no consensus, no brokers and no databases, provided one discipline is enforced
everywhere: **every record has exactly one writer, and everything else is a disposable, TTL-bounded,
idempotently-refreshed replica.** Owned records, monotonic sequence, deterministic identity appear at
the presence layer, the tracker layer, the federation layer and the economy. *The architecture is one
idea wearing four coats.*

Six weeks of verification say the idea held: the browser needed zero changes when the mesh shipped,
the constants held to the digit, the defensive shape checks turned out densest at the browser
boundary where they matter most, and every rung the report scheduled was walked, in order, inside
four days. What did *not* hold instructs differently — three figures copied out of other documents,
and one safety sentence written wider than the hazard it guarded. **Both failures share a shape: a
claim asserted rather than measured, in a document whose measured claims were flawless.**

The file remains sovereign.

---

## References

[1] A. Demers, D. Greene, C. Hauser, W. Irish, J. Larson, S. Shenker, H. Sturgis, D. Swinehart, and
D. Terry, "Epidemic algorithms for replicated database maintenance," in *Proc. 6th ACM Symp.
Principles of Distributed Computing (PODC)*, 1987, pp. 1–12.

[2] D. S. Parker, G. J. Popek, G. Rudisin, et al., "Detection of mutual inconsistency in distributed
systems," *IEEE Trans. Software Engineering*, vol. SE-9, no. 3, pp. 240–247, 1983.

[3] L. Lamport, "Time, clocks, and the ordering of events in a distributed system," *Commun. ACM*,
vol. 21, no. 7, pp. 558–565, 1978.

[4] B. Cohen, "Incentives build robustness in BitTorrent," in *Proc. 1st Workshop on Economics of
Peer-to-Peer Systems*, 2003.

[5] "Magnet URI scheme," BitTorrent extension BEP-9 (metadata exchange) and community specification;
see also BEP-5 (DHT protocol) for trackerless operation.

[6] P. Maymounkov and D. Mazières, "Kademlia: A peer-to-peer information system based on the XOR
metric," in *Proc. IPTPS*, 2002, pp. 53–65.

[7] Roll2Hit project documents: `lab-reports/lab-report-mesh-multiuser.md` (design lock),
`lab-reports/lab-report-walk5-mud-harness.md` (session/instancing properties), `plan-archive.md`
§MESH-01 / §MESH-01-FU (increment history), `config/peers.txt` (bootstrap format specification).

---

*Appendix note: all excerpts are verbatim (lightly elided with `…`) from the sources named at each
anchor, verified at HEAD 2026-08-17. Excerpts credited to `wbapi-server.js` in the 2026-07-02
original are, since `4367a38`, in `js/mesh.js` — moved without edit. Function names are stable public
vocabulary and may be grepped directly.*

*© 2026 Paul Richeson — MIT License.*
