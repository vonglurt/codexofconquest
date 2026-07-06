# Presence Without Consensus: The Synchronization, Discovery, and Bootstrap Architecture of a Single-File Multiplayer World

**Roll2Hit Lab Report — §MESH-01 architecture retrospective**
*paul@roll2hit.com · 2026-07-02 · status: descriptive (documents shipped behavior as of harness 75 / commit `9dd029b`)*
*Companion to: [lab-report-mesh-multiuser.md](lab-report-mesh-multiuser.md) (the design-lock document this report narrates in depth)*

---

## Abstract

Roll2Hit is a Dungeons & Dragons 5e combat assistant and world simulator whose defining constraint is that **the entire game — engine, content, and world data — is one HTML file**. This report describes how that single-file artifact acquires multiplayer presence, server-to-server synchronization, rendezvous-based discovery, and operator-controlled bootstrap, without introducing a database, a message broker, a consensus protocol, or any component that is not either (a) the game file itself, (b) one Node.js sidecar (`wbapi-server.js`) that *parses the game file as its database*, or (c) plain text files an operator can read and `scp`.

The architecture is presented as a seven-layer stack: **L0 identity**, **L1 sessions**, **L2 cell-scoped delivery**, **L3 gossip replication**, **L4 rendezvous (trackers)**, **L5 bootstrap and advertisement**, and **L6 observability and human trust**. The load-bearing invariant throughout is **single-writer ownership**: every replicated record has exactly one mutating authority, which reduces "synchronization" from a conflict-resolution problem to a deduplication problem solvable with per-origin sequence numbers and version vectors — no CRDTs, no last-writer-wins clocks, no blockchain. We show how the same three primitives (single-writer records, idempotent state exchange, deterministic identity) recur at every layer: presence gossip, tracker federation, and the planned trade ledger. We conclude with the trust model — what the system deliberately does *not* verify, and why the human-facing surfaces (a BIG WARNING modal, a world-diff tool, a packet log) are as much a part of the synchronization design as the version vectors are.

**Index terms** — gossip protocols, version vectors, peer exchange (PEX), rendezvous trackers, magnet links, single-writer replication, eventual consistency, browser games, self-hosting.

---

## I. Introduction

### A. The artifact

The unit of distribution for Roll2Hit is `roll2hit-v3.html`: ~34,000 lines of HTML, CSS, and JavaScript containing the combat engine, the narrative engine, a 90×360 geographic cell grid, 216+ monsters, 40 terrain types, hundreds of quests, and every data table the game reads. Opening the file in a browser *is* installing the game. Copying the file *is* forking the world.

Two sidecar processes exist, both optional:

1. **`wbapi-server.js`** — a Node.js HTTP server that opens the game file, extracts its data collections by *parsing the JavaScript source text* (comment-aware brace counting; see §III), and exposes them as a REST API on port 1367. It is simultaneously: a world-editing API for the worldbuilder, a headless MUD server (sessions, movement, encounters), and — the subject of this report — a mesh node.
2. **`worldbuilder.html`** — a separate single-file editing UI that talks to the WBAPI server. Its 🌐 **Mesh tab** is the operator's window into everything this report describes.

### B. The problem

We want a player in one browser to see a friend from another browser — possibly connected to a *different* server on a *different* machine — standing in the same cell, to chat with them, and to watch them move on the minimap. We want servers to find each other with as little configuration as one pasted link. And we want all of this while preserving three constraints that are unusual by industry standards:

- **C1 — The file stays sovereign.** No component may become "the real server" that the HTML file merely renders. The game must remain fully playable offline, unchanged, forever. Multiplayer is strictly *additive and opt-in*.
- **C2 — No new infrastructure classes.** No database, no Redis, no WebSocket broker, no DHT library. The permitted materials are: the Node sidecar, HTTP POST, Server-Sent Events, and text files.
- **C3 — Friends-scale, hostile-tolerant.** The design target is tens of servers and dozens of players (a friends mesh), but every ingress must tolerate a hostile stranger, because the discovery layer (§V, §VI) deliberately makes servers findable.

### C. The central trick

Distributed synchronization is hard when multiple writers can mutate the same record. The entire §MESH-01 architecture is arranged so that **this never happens**. Presence records are owned by the origin server of the session; tracker announce records are owned by the announcing server; peer-list entries are owned by whoever observed the peer. Every other party holds a **read-only replica** that it may discard at any time.

Under single-writer ownership, the hard problems collapse:

| Classical problem | What it becomes here |
|---|---|
| Conflict resolution | Impossible by construction (one writer per record) |
| Ordering | A per-origin monotonic sequence number |
| Duplicate suppression | A version vector: `maxSeqSeen[originId]` |
| Convergence | Periodic full-snapshot exchange (anti-entropy floor) |
| Failure of a replica | Nothing — replicas are disposable |
| Failure of the origin | TTL expiry of its records everywhere |

The one place in the roadmap where two parties genuinely co-author a record — an item **trade** between two players — is quarantined into its own future design (§IX.C) with hash-chained logs and a deterministic fork-choice rule. Everything shipped today is single-writer.

---

## II. The Layer Stack

The system is easiest to hold in mind as seven layers, each consuming only the layer below:

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

A useful property of the stack: **each layer degrades independently.** Kill the tracker (L4) and gossip (L3) carries on. Kill gossip and local sessions (L1/L2) still see each other. Kill the WBAPI server entirely and the game file (below L0, as it were) is exactly the single-player game it always was. This is constraint C1 realized structurally: multiplayer is a tower built *beside* the game, touching it only at render time.

The remainder of the report walks the stack bottom-up.

---

## III. L0 — Identity: Who Are You, and Which World Are You In?

### A. Three-part compatibility identity

Two servers may synchronize presence **only if players from one can legally stand in the other's world**. A player replicated onto a map where their cell is open ocean is not a synchronization bug — it is an *identity* bug: the servers should never have spoken. Compatibility is therefore established before any state flows, using a three-part identity:

- **`MESH_PROTO`** — the mesh wire-protocol version, an integer constant in the server. Bumped when the gossip payload shape changes.
- **`ENGINE_VER`** — the game build, a constant *in the HTML file* (single source of truth; the server parses it out). Every release is deliberately a separate, incompatible swarm.
- **`worldHash`** — a SHA-256 (truncated to 16 hex chars) over the **raw source spans of all eight data collections** in the game file: `NODE_MAP`, `NODE_COORDS`, `SEA_RUNS`, `SEA_LANES`, `ROAD_RUNS`, `QUEST_DB`, `MONSTER_POOL`, `WORLD_DB`.

The manifest is computed by parsing the file the same way the rest of WBAPI does — extracting the *textual* span of each collection with a comment- and string-aware bracket scanner, then hashing it as it sits on disk:

```js
const sha16 = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const MANIFEST_PARTS = ['NODE_MAP', 'NODE_COORDS', 'SEA_RUNS', 'SEA_LANES',
                        'ROAD_RUNS', 'QUEST_DB', 'MONSTER_POOL', 'WORLD_DB'];

function getManifest() {
  const src = WBAPI._rawSrc || '';
  ...
  const parts = {};
  for (const name of MANIFEST_PARTS) {
    const span = rawSpan(src, name);                 // comment-aware bracket scan
    parts[name.toLowerCase()] = span ? sha16(span) : 'missing';
  }
  const evm = src.match(/const\s+ENGINE_VER\s*=\s*['"]([^'"]+)['"]/);
  const engineVer = (evm && evm[1]) || 'unversioned';
  const worldHash = sha16(engineVer + '|' + MANIFEST_PARTS.map((n) => parts[n.toLowerCase()]).join('|'));
  _mani = { proto: MESH_PROTO, engineVer, worldName, worldTag: worldTag(worldName, worldHash), worldHash, parts };
  return _mani;
}
```

Hashing *source spans* rather than parsed values is a deliberate choice: it makes the hash a property of the artifact people actually share (the file), and it needs no canonicalization step. Two files whose quest tables differ by a single comma have different worlds. The per-collection `parts` hashes exist purely as **diagnostics**: when two operators discover their worlds differ, `GET /api/manifest` tells them *where* (e.g., `quest_db` differs but `node_map` matches — someone modded quests). Per-part equality is never a license for partial synchronization; the compatibility gate compares only the triple.

The hash's *scope* is itself a design decision with a documented boundary: narrative tables (NPC dialogue, journals, key events) are **not** hashed, so a pure-dialogue mod does not fork the swarm. The rule of thumb: hash what determines *where players can stand and what they can fight* — the spatial and mechanical skeleton — and leave prose free.

### B. Human-facing identity: `WORLD_NAME` and the world tag

A 16-hex hash is a terrible thing to say out loud. Each world file also carries a **display name**:

```js
// §MESH-01-FU: world DISPLAY name — rename your world/mod here. Shown across
// the mesh as `<name>-<hash5>` (e.g. Roll2Hit-131ea). Deliberately NOT part of
// worldHash: renaming never forks the swarm; identity stays data-based.
const WORLD_NAME = 'Roll2Hit';
```

and every human surface renders the **world tag** `worldTag(name, hash) = `${name}-${hash.slice(0,5)}``, e.g. `NextWorldMod-131ea`. The two halves serve opposite masters: the name is *chosen* (a mod author brands their fork), the hash suffix is *earned* (it disambiguates two forks that chose the same name, and two "renames" of identical data collapse to the same suffix). Note the asymmetry with §III.A: the name is excluded from the hash precisely so that naming is free — identity is what you *are* (data), the tag is what you're *called*.

### C. Server identity and player identity

Each server has a persistent random 16-byte **`serverId`**, minted once and stored in `.wbapi-server-id`. Every replicated fact in the system is namespaced by the serverId of its owner.

Player identity composes server and session: **`pid = <serverId[0..8]>:<sessionId[0..8]>`**.

```js
// §MESH-01-FU 3 — the player id every presence surface carries: origin server +
// session, never the display name (two "Bob"s must never misattribute a leave).
function pidOf(sessionId) { return getServerId().slice(0, 8) + ':' + String(sessionId).slice(0, 8); }
```

The rule "never key anything by display name" was learned the usual way: the first client implementation keyed its co-presence list by name, and two players named *Bob* could not coexist — when either left, both vanished. The fix (§MESH-01-FU 3) threads `pid` through every surface — session start responses, look/who/pos player lists, every SSE event, every gossiped mesh event — and the client keys its state by pid, rendering `name@server` only when a display-name collision is actually present. Names are for humans; identity is for machines; the system never confuses the two.

---

## IV. L1/L2 — Sessions and Cell-Scoped Delivery (One Server)

### A. Sessions, and the beacon/move dichotomy

The WBAPI server has carried headless MUD sessions since §WALK-5: `POST /api/session/start` creates a session at the hub, `POST /api/session/move {dir}` walks it cell-by-cell through the same movement kernel the browser uses (a byte-identical shared block, `MOVER:CORE`, parity-checked in CI), and the server rolls *instanced* encounters from the session's own seed.

When the browser game became a mesh client (§MESH-01a), a subtle hazard appeared. The single-player game is **client-authoritative** over its own movement: the browser rolls its own encounters in `_enterEmptyCell`. If the browser reported movement via `session/move`, the server would roll a *second* encounter for the same step — a double-roll that corrupts the single-player experience the moment multiplayer is switched on, violating C1.

The resolution is two verbs with disjoint contracts:

| Verb | Caller | Moves the session | Rolls encounters | Purpose |
|---|---|---|---|---|
| `POST /api/session/move` | headless MUD clients | yes (server-simulated) | **yes** (instanced, seeded) | the server *is* the game |
| `POST /api/session/pos` | browser clients | yes (validated teleport) | **never** | the game *tells* the server |

`session/pos` is a **display-only beacon**: it validates the reported cell against the mover world (rejecting open ocean and off-band rows — "no ghosts in the ocean"), updates the session's coordinates, emits the presence events, and touches nothing else. The harness pins this with a direct assertion that a beacon never carries an encounter.

### B. Cell-scoped broadcast

Browsers hold an open SSE stream (`GET /api/session/events?sessionId=`). Delivery of presence and chat is **cell-scoped**: an event at cell `(r,c)` reaches exactly the sessions standing at `(r,c)`:

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

This is the §WALK-5 *co-presence* property, and the MUD harness treats it as sacred: chat reaches co-present sessions exactly once, never a session one cell away, and the sender exactly once (no local echo — the client renders its own line only when the broadcast returns it). Exactly-once at this layer is trivial — one server, one loop — but it becomes the *specification* that the replication layer must preserve across servers (§V.D).

### C. The client: opt-in, render-time, free-movement

In the game file, multiplayer is a ~150-line `MP` module with three entry points (🌐 toggle, beacon, chat) and one iron rule: **presence is display-only**. The movement kernel never reads MP state; remote players never block a cell; there is no way for the mesh to alter a die roll. The lab report's "Free-Movement invariant" survives every increment because it is enforced by *dataflow direction* — MP data flows only into render functions (`_mpRenderPresence`, minimap dot painting), never into simulation:

```js
// §MESH-01a: other players in view (display-only multiplayer presence)
if (!isPlayer && MP.on && MP.nearby.some(p => p.r === r && p.c === c)) {
  cell.textContent = '☺';
  cell.style.color = '#7fd4ff';
}
```

Equally structural: a page that never clicks 🌐 never constructs any MP state at all (asserted by a Playwright test), and MP state lives in module scope plus `sessionStorage` — never in the save file, so a save can never carry a dead session id.

---

## V. L3 — Replication: The Gossip Mesh

### A. What is replicated

Each server replicates outward exactly two things, both ephemeral:

1. **An event log** — the last ≤500 presence events (`player_arrived`, `player_left`, `chat`), each stamped `(seq, ts, type, data, r, c)` with `seq` from a single per-server monotonic counter.
2. **A snapshot** — the complete current session list `{sid, name, r, c}`, stamped with the counter value at capture time.

Nothing durable crosses the wire. World *mutations* (WBAPI writes to the HTML file) are explicitly out of scope — they are multi-writer and therefore quarantined (§IX.C).

### B. The gossip round

Every ~2 seconds (`MESH_GOSSIP_MS`), each server pushes its payload to ≤3 random peers and merges whatever comes back. The payload is self-describing — identity triple first, then state, then peer candidates:

```js
function meshPayload() {
  const m = getManifest();
  return {
    serverId: getServerId(), proto: m.proto, engineVer: m.engineVer, worldHash: m.worldHash,
    addr: meshAdvertise(), vv: MESH.vv,
    events: MESH.log.slice(-100), snapshot: localSnapshot(),
    peers: [...MESH.peers.keys()].slice(0, 20),          // PEX
  };
}
```

Ingress applies three gates *in order* — compatibility, sanity, ACL — before any merge:

```js
function meshIngest(p, ip) {
  const m = getManifest();
  if (!p || p.proto !== m.proto || p.engineVer !== m.engineVer || p.worldHash !== m.worldHash)
    return { status: 409, body: { ok: false, reason: 'incompatible', want: {...} } };
  if (!p.serverId || p.serverId === getServerId())
    return { status: 400, body: { ok: false, reason: 'bad-serverId' } };
  if (!aclAllows({ serverId: p.serverId, ip, worldHash: p.worldHash }))
    return { status: 403, body: { ok: false, reason: 'acl' } };
  meshMergeEvents(p.serverId, p.events);
  meshMergeSnapshot(p.serverId, p.snapshot);
  for (const a of p.peers || []) /* adopt unknown addresses as PEX candidates */ ;
  return { status: 200, body: { ok: true, ...meshPayload() } };   // gossip is symmetric
}
```

Note the last line: **a gossip POST is answered with a full gossip payload**. Every exchange is bidirectional, which halves convergence time and means a server behind an unroutable address (which can dial out but not be dialed) still receives state on every round it initiates.

**Peer exchange (PEX)** rides the same payload: each side lists up to 20 known peer addresses, and unknown ones are adopted as candidates to be dialed on a later round. One live address therefore bootstraps the entire mesh, and the topology self-heals as servers come and go — the same mechanism BitTorrent clients use to wean themselves off trackers [4].

### C. Deduplication: the version vector

The merge is where the single-writer discipline pays off. Because only the origin ever *creates* events with its serverId, and it stamps them from one monotonic counter, a receiver needs exactly one integer per origin — the highest sequence number seen — to reject every duplicate, no matter how many gossip paths redundantly deliver the same event:

```js
function meshMergeEvents(originId, events) {
  const now = Date.now();
  let last = MESH.vv[originId] || 0;
  for (const ev of (events || []).slice().sort((a, b) => a.seq - b.seq)) {
    if (!ev || typeof ev.seq !== 'number' || ev.seq <= last) continue;   // dup: drop
    last = ev.seq;
    // Fan fresh remote events out to co-located LOCAL sessions only; replayed
    // history still advances the version vector (dedup) but stays silent.
    if (now - (ev.ts || 0) <= MESH_FANOUT_MAX_AGE
        && ['player_arrived', 'player_left', 'chat'].includes(ev.type))
      broadcastCell(ev.r, ev.c, ev.type, { ...ev.data, remote: true, server: originId.slice(0, 8) }, null);
  }
  MESH.vv[originId] = last;
}
```

Two details in this function carry most of the correctness weight:

- **Dup ≠ silence only; dup = not re-gossiped.** An event at or below the vector is dropped *and never re-announced*, which — together with the payload's bounded event tail — is what prevents flood loops in a cyclic topology. There is no hop-count arithmetic; the version vector *is* the loop suppressor.
- **The freshness window (`MESH_FANOUT_MAX_AGE`, 10 s).** When a server (re)joins and receives a peer's whole recent history, replaying week-old arrivals as live SSE toasts would be absurd. Stale events advance the vector silently; only fresh ones reach browsers. This cleanly separates the two roles an event plays: *state transfer* (always) and *notification* (only when timely). The known cost — a joining player receives no chat backlog — is a deliberate trade recorded as future work (§X).

### D. The anti-entropy floor: snapshots

Event logs are capped and tails are bounded, so a long partition can lose events irretrievably. The system does not fight this; it **out-floors** it. Every payload carries the origin's *complete* current session list, and the merge simply replaces the local replica if the snapshot is at least as new:

```js
function meshMergeSnapshot(originId, snap) {
  if (!snap || typeof snap.seq !== 'number') return;
  let rec = MESH.remote.get(originId) || { sessions: new Map(), snapSeq: -1, lastSeen: 0 };
  if (snap.seq < rec.snapSeq) return;        // stale snapshot from an older round
  rec.snapSeq = snap.seq;
  rec.lastSeen = Date.now();
  rec.sessions = new Map((snap.sessions || []).map((s) => [s.sid, { name: s.name, r: s.r, c: s.c }]));
  MESH.remote.set(originId, rec);
}
```

The consequence is a strong, simple guarantee: **event loss can delay presence, never corrupt it.** Whatever chaos a partition caused, the next successful round replaces the replica wholesale with ground truth. Snapshots are idempotent state exchange; events are an optimization for latency and notification. (Readers familiar with the literature will recognize the pattern: the snapshot is the anti-entropy mechanism of Demers et al. [1], the event tail is rumor-mongering, and the version vector is the standard causal-history summary [2] degenerated to one counter per origin because writers never interleave.)

Replicas expire by TTL (`MESH_ORIGIN_TTL`, 90 s of silence) — an origin that stops heartbeating takes its players off everyone's maps without any explicit teardown message.

### E. What remote players look like locally

Replicated sessions are woven into the *same* read surfaces local sessions use — `look` player lists, `who.remotes`, `pos.nearby` — tagged with their origin:

```js
function remotePlayersAt(r, c) {
  const out = [], now = Date.now();
  for (const [oid, rec] of MESH.remote) {
    if (now - rec.lastSeen > MESH_ORIGIN_TTL) continue;
    for (const [sid, p] of rec.sessions)
      if (p.r === r && p.c === c)
        out.push({ pid: `${oid.slice(0,8)}:${sid.slice(0,8)}`, name: p.name, server: oid.slice(0, 8) });
  }
  return out;
}
```

Because the client consumes presence through these unchanged surfaces, **the browser needed zero changes when the mesh shipped** — a same-cell friend from another server simply appears in the same `players` array a same-server friend does. The layering held: L3 slotted in under L2 without disturbing it.

---

## VI. L4 — Rendezvous: Trackers and Federation

### A. A role, not a stack

Gossip needs one live address to start from. The tracker exists to hand out that first address — and *only* that. Two principles bound its design:

1. **Rendezvous only, never a relay.** No presence, chat, or world data ever transits a tracker. It maps world identities to live server addresses; the mesh then talks directly.
2. **Not a new stack.** A tracker is the *same* `wbapi-server.js` started with `--tracker-mode` (or `./wbapi-toggle.sh tracker`), in which it serves *only* ping, manifest, and `tracker/*` routes and answers everything else with `410 Gone`. One codebase, one mental model, one set of ACLs.

### B. The announce table and world groups

Game servers announce every ~30 s: identity triple, advertised address, player count, and display names:

```js
await fetch(u + '/api/tracker/announce', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ serverId: getServerId(), addr: meshAdvertise(), proto: m.proto,
    engineVer: m.engineVer, worldHash: m.worldHash, worldName: m.worldName,
    playerCount: SESSIONS.size, name: SERVER_NAME }),
});
```

The tracker keeps one record per serverId (single-writer again: the announcing server owns its record; the tracker merely ages it out on TTL). The answer to an announce is **K ≤ 8 random peers from the same world group** — same `(proto, engineVer, worldHash)` triple — which the server merges into its gossip peer table. Incompatible worlds are *segregated, not rejected*: a modded fork announces into its own group, sees its own kin, and never pollutes another world's peer lists. The `GET /api/tracker/peers` browse route groups the same way and decorates each row with the human handle from §III.B (`worldTag: 'NextWorldMod-131ea'`), which is what both the game's server browser and the Mesh tab render.

Randomizing the K returned peers spreads the mesh's edges instead of having every newcomer dial the same oldest server — the classic tracker behavior [4].

### C. Tracker death is a non-event

The mesh's dependence on the tracker is front-loaded entirely into the first contact. After that, PEX propagates addresses, `peers-cache.json` persists the last-known-live set across restarts (§VII.A rung 2), and gossip carries on. A restarted tracker repopulates within one announce interval (≤30 s), since every server re-announces on a heartbeat and the table was only ever a cache of those heartbeats. This is why the announce table is deliberately **in-memory**: durable tracker state would be a liability (stale addresses served authoritatively) pretending to be a feature.

### D. Federation: trackers syncing trackers

Two communities can join their discovery domains without either surrendering control: an operator points tracker B at tracker A with `--tracker-peer <url>`, and the two periodically exchange announce tables:

```js
function trackerMergeRecords(records, ip) {
  const now = Date.now();
  let merged = 0;
  for (const rec of records || []) {
    if (!rec || !/^[0-9a-f]{32}$/.test(rec.serverId || '') || !/^[\w.-]+:\d+$/.test(rec.addr || '')) continue;
    if (!rec.proto || !rec.engineVer || !rec.worldHash || rec.serverId === getServerId()) continue;
    if (!aclAllows({ serverId: rec.serverId, ip, worldHash: rec.worldHash })) continue;
    const lastSeen = now - Math.max(0, Math.min(rec.ageMs | 0, TRACKER_TTL));  // clock-skew-safe
    const existing = TRACKER.get(rec.serverId);
    if (existing && existing.lastSeen >= lastSeen) continue;            // ours is fresher
    if (!existing && TRACKER.size >= TRACKER_MAX_RECORDS) continue;     // full — updates only
    TRACKER.set(rec.serverId, { addr: rec.addr, ..., lastSeen });
    merged++;
  }
  return merged;
}
```

Observe that this is *structurally the same function* as the presence merge in §V: records owned by a single writer (the announcing server), merged by freshness, aged by TTL, gated by ACL. Three deliberate touches:

- **`ageMs`, not timestamps.** Records carry their *age* relative to the sender's clock, and the receiver reconstitutes `lastSeen` against its own clock — federation works between machines whose wall clocks disagree, because no absolute time ever crosses the wire.
- **Idempotent exchange ⇒ no flood loops by construction.** Merging the same table twice is a no-op, so federation cycles (A↔B↔C↔A) need no suppression machinery at all — the strongest possible loop-prevention is *there being nothing to loop*.
- **Bounded tables (`TRACKER_MAX_RECORDS`, 500) with updates-preferred.** A spammer can fill the table with garbage serverIds, but cannot *evict* legitimate records, whose refreshes are always accepted.

Federation is manual and operator-initiated — an intentional asymmetry with PEX. Mesh peers auto-propagate because a bad peer costs one wasted dial; trackers are *trust anchors* for discovery, and connecting two of them is a governance act, not a routing event.

---

## VII. L5 — Bootstrap and Advertisement: Getting Found

### A. The bootstrap ladder

How does a fresh server learn its first address? Five rungs, cheapest first, all additive:

```
1. --peer host:port            CLI flags        (LAN party: point at your friend)
2. MESH_PEERS env              (deploy scripts)
3. peers-cache.json            last-known-live peers, written automatically
4. peers.txt                   operator-edited repo file; also holds `tracker <url>` lines
5. TRACKER_URL / BOOTSTRAP_URLS network rendezvous + text-file-over-HTTP backup
```

Rungs 1–4 are consumed by one function at boot (`loadStaticPeers`), and rung 3 closes the loop automatically: every 30 s the server persists currently-live peer addresses, so the *next* boot starts from where the mesh last was — the same "resume from cached peers" trick DHT clients use to survive bootstrap-node outages.

The final rung deserves its own subsection.

### B. `BOOTSTRAP_URLS`: dumb text over HTTP as infrastructure

The most striking design decision at this layer is what a "bootstrap server" is: **any URL that serves plain text in the `peers.txt` format** —

```
# r2h mesh bootstrap — one entry per line
tracker http://tracker.example.org:1368
192.168.1.20:1367  r2h-3.104.0  131eabc131eabc00
```

— fetched once at boot and parsed with the *same* parser as the local file:

```js
async function fetchBootstrapUrls() {
  const urls = (process.env.BOOTSTRAP_URLS || '').split(',').map((s) => s.trim()).filter(Boolean);
  for (const u of urls) {
    const txt = await (await fetch(u)).text();
    for (const line of txt.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      if (t.startsWith('tracker ')) { MESH_TRACKER_URLS.push(t.slice(8).trim()); continue; }
      const a = t.split(/\s+/)[0];
      if (/^[\w.-]+:\d+$/.test(a)) MESH.peers.set(a, { serverId: null, lastSeen: 0, lastErr: null });
    }
  }
}
```

The recommended host is a **GitHub Gist raw URL** — versioned, revocable, free — but a PHP echo, an S3 object, or an `scp`'d file on any VPS works identically, because clients only ever GET text. The system deliberately imposes *no* requirements on this host beyond "serves bytes": external infrastructure is used at the absolute minimum trust level, as a hint source whose every entry still has to pass the compatibility gate and ACL before any state flows.

Publishing is **deliberately manual**. The tracker emits the format (`GET /api/tracker/peers?format=txt`), and the operator copies it up by hand. There is no automatic write path to the bootstrap file — an automated publisher would be a standing takeover vector (compromise the publisher, redirect every future boot), whereas a hand-published gist is a human-reviewed artifact with version history. This "the publish path is a human" stance recurs at L6.

### C. Advertisement: `--bind` vs `--advertise`

A mesh node has two addresses, and conflating them is the classic self-hosting failure. **Bind** is where the OS accepts connections; **advertise** is what you *tell other people to dial*. The defaults are deliberately anti-social:

```js
const BIND_ADDR = process.env.BIND_ADDR
  || process.argv.find((a, i) => process.argv[i-1] === '--bind')
  || '127.0.0.1';                                   // solo dev server: never exposed by accident

function meshAdvertise() { return ADVERTISE_ADDR || ('localhost:' + PORT); }
```

A real cross-machine mesh requires *both* `--bind 0.0.0.0` (accept remote dials) and `--advertise <lan-ip>:<port>` (hand out a dialable address). Each failure mode is distinct and self-inflicted: loopback bind means nobody can reach you; localhost advertise means every peer you gossip to is told to dial *itself*. Since misconfiguration is silent (the local mesh works perfectly on one machine), the server diagnoses it aloud — at startup and in `GET /api/mesh/status → reachability.warnings`, which the Mesh tab renders:

```js
function meshReachabilityWarnings() {
  if (!meshConfigured()) return [];                  // a solo server is CORRECTLY loopback
  const warnings = [];
  if (/^(127\.|localhost$|::1$)/.test(BIND_ADDR))
    warnings.push(`bind is loopback (${BIND_ADDR}) — remote machines cannot reach this server. ...`);
  if (!TRACKER_MODE && /^(localhost:|127\.|\[::1\])/.test(meshAdvertise()))
    warnings.push(`advertise addr is ${meshAdvertise()} — peers/trackers will be told to dial localhost ...`);
  return warnings;
}
```

The guard clause is the point: loopback is only a *warning* when peers are configured. The default posture (private) and the diagnostic (you asked for a mesh but are unreachable) are the two halves of "secure by default, loud when it matters."

### D. The magnet link: the whole system in one line

Discovery culminates in a single shareable string, deliberately modeled on BitTorrent magnet URIs [5]:

```
r2h:?p=1&ev=r2h-3.104.0&wh=131eabc131eabc00&tr=http://tracker.example:1368
```

`wh` plays the infohash role — it names the *world-swarm*, not any server — and `tr` names a rendezvous that can resolve it to live addresses. The Mesh tab **copies** this link; the game's 🌐 server browser **parses** it: resolve `tr`, filter the returned group by `wh`, ping each candidate from the browser, render `name · worldTag · players · ping`, and *Join* — which does nothing but rewrite `localStorage.mpServer` and reconnect:

```js
function mpParseMagnet(str) {
  const m = String(str || '').trim().match(/^r2h:\??(.*)$/i);
  if (!m) return null;
  const q = new URLSearchParams(m[1]);
  return { p: q.get('p'), ev: q.get('ev'), wh: q.get('wh'), tr: q.get('tr') };
}
```

The end-to-end flow — paste a friend's magnet, watch a tracker resolve it, join their server, see them on the minimap — is exercised as a Playwright test against a real spawned tracker, because it is the single most important user journey the architecture exists to serve.

---

## VIII. L6 — Observability and Human Trust

### A. The Mesh tab and the packet ring

Distributed systems fail invisibly; a friends-mesh run by non-experts needs its packets *visible*. Every ingress and egress at L3–L5 — gossip in/out, announces, bootstrap fetches, federation merges, and every *refusal with its reason* — is pushed into a bounded in-memory ring:

```js
function pushTraffic(dir, kind, peer, ok, note) {
  MESH.traffic.push({ ts: Date.now(), dir, kind, peer: ..., ok: !!ok, note: ... });
  if (MESH.traffic.length > 200) MESH.traffic.shift();
}
```

served wholesale by one endpoint (`GET /api/mesh/status`, also available in tracker mode) and rendered by the worldbuilder's 🌐 Mesh tab as the "information passed" log, alongside identity (with world tag), tracker world groups, per-peer liveness, remote players, reachability warnings, and the on-demand server browser. The tab is a **pure read-only view** — it polls, it renders, it can trigger a ping; it cannot mutate mesh state. The single-source-of-truth discipline that governs the data layer governs the UI too.

### B. The world-download boundary: where sync stops and humans start

The file-is-the-world premise has a sharp consequence: *sharing a world means sharing a program*. The mesh will happily tell you a peer's address; `GET /api/world/download` will serve you their entire game file (with identity headers, refused in tracker mode — rendezvous is never a relay, not even of files). What the system will **not** do is pretend this is safe. The worldbuilder's ⬇ button sits behind a modal that states the facts in capital letters — *you are downloading someone else's CODE; it is MIT-licensed; it is saved as a separate file that never touches your world; inspect before opening* — and the inspection tool is provided:

```
$ node scripts/world-diff.js roll2hit-v3.html world-9f3ab2c1-131eabc131eabc00.html
  quest_db      DIFFERS   (+3 entries: Q_MIRE_1, Q_MIRE_2, Q_MIRE_3)
  monster_pool  DIFFERS   (~1 entry: bog_hag)
  node_map      identical
  ...
  ▓▓ CODE DIFFERS OUTSIDE DATA COLLECTIONS — REVIEW EVERY CHANGE BY HAND ▓▓
```

`world-diff` classifies a fork by its **modification set** — which collections changed, entry-by-entry — and screams if anything changed *outside* the data spans, because a data mod and a code change are categorically different trust decisions. "Mod sync" v1 is then an operator-approved pull of specific collections through the existing WBAPI write path — never automatic, because world writes are the multi-writer problem this architecture exists to avoid (§IX.C).

This is the philosophy of the whole L6 layer: **the synchronization machinery moves bytes; humans move trust.** Every place where the system could have automated a trust decision — publishing bootstrap files, federating trackers, importing worlds — it instead produced a legible artifact (a text file, a diff, a warning, a log line) and handed the decision to a person.

---

## IX. Security Model and Its Honest Limits

### A. What is enforced

- **Compatibility gating** (409) precedes everything; a wrong-world payload cannot reach the merge.
- **ACLs** (`mesh-acl.json`, hot-reloaded): allow/block by serverId, IP, and worldHash, with an `allowlist` mode for private friends meshes. Applied at gossip ingress, gossip dial-out, tracker announce, and federation merge — every doorway, same rules.
- **Shape validation everywhere addresses travel.** ServerIds must be 32-hex; addresses must match `^[\w.-]+:\d+$` — at announce, at federation merge, at bootstrap parse, and *again in the browser* before any address is interpolated into the server-browser DOM, so a hostile tracker cannot smuggle markup through a peer row.
- **Bounded everything.** Event logs (500), gossip tails (100), traffic rings (200), tracker tables (500, updates-preferred), name fields (`slice(0, 60)`). Memory exhaustion via chatter is structurally off the table.
- **Single-writer merges.** A malicious peer can lie about *its own* sessions (it owns them), but cannot mutate any other origin's replica — there is simply no code path where B's payload writes into A's record.

### B. What is deliberately not enforced

The single-file game is client-authoritative; a player *is* their file plus their save. The mesh therefore does not attempt to verify stats, saves, or grinding legitimacy — a maxed character that is *shaped* legitimately cannot be distinguished from an edited one, and the design refuses to pretend otherwise. That trust stays social (you meshed with a friend; you can ACL-block a stranger). What the *planned* machinery does verify is narrower and tractable: impossible stats (bounds derivable from the shared world data both servers provably hold, since worldHash equality is a precondition) and item *provenance* (§IX.C). Known open hardening: per-IP token-bucket rate limiting ahead of JSON parse (§MESH-01-FU 8).

### C. The quarantined multi-writer problem

Trades and duels are the two roadmap features where two parties co-author one fact, and both reuse the report's primitives rather than importing consensus: every item gets a **mint id** `(originServerId, seq)` — the same identity scheme as presence events; each player's economy history is a hash-chained, append-only per-player log; a trade is one event signed into *both* chains; ownership is the longest valid transfer chain from mint; and a double-spend detected at gossip-merge is voided by a deterministic fork-choice (lowest event hash) — detection-and-void on merge, not up-front global consensus, because trades are rare and optimism is cheap. Duels add a commit-reveal seed (neither side can steer the RNG) and a pure, replay-checkable resolution function (`DUEL:CORE`), making a cheater "a machine that disagrees with a pure function of committed inputs." These are design-locked but unshipped; they are mentioned here because they demonstrate the thesis — *identity plus ordering plus determinism substitutes for consensus at friends-mesh scale* — extending to genuinely adversarial state. **Concrete data shapes** (record envelopes, `trade/*` + `duel/*` endpoint signatures, the `DUEL:CORE` pure-kernel contract, ownership resolution + lowest-hash fork-choice, and per-rung harness cases) were specified in the 2026-07-06 design pass — see `lab-report-mesh-multiuser.md` §6. The one asymmetry that section introduces: the economy is the sole **durable, uncapped, disk-persisted** replica (`ledger/<serverId>.jsonl` on a parallel gossip channel), where every other replica in this report is TTL-bounded and disposable — the price of the two multi-writer facts, quarantined to exactly these two rungs.

---

## X. Evaluation

The architecture's properties are pinned by a layered test pyramid, all runnable from a cold checkout:

- **`tests/mud-harness.mjs`** (75 checks, pure HTTP+SSE, no browser): spawns up to 17 real server processes in one run — including three-server gossip meshes, a tracker, *federated* trackers, and misconfigured-reachability servers — and asserts, among others: exactly-once chat delivery across replayed gossip rounds; cell-scope isolation; beacon-never-rolls; incompatible-worldHash 409 + invisibility; allowlist 403; stranger discovery via tracker alone and via a plain text file alone; federation convergence (a server announced only to tracker A is found via tracker B); pid distinctness for same-named sessions; and TTL pruning closing SSE streams.
- **Playwright integration** (presence 4/4, mesh tab 4/4): two real browsers connecting, chatting, and departing; the full magnet→tracker→server-browser→join journey against a live tracker; two "Bob"s never misattributing a leave; and the Mesh tab rendering fixtures including hostile-input rows.
- **Parity checks** (`check:walk`, 6 gates): the shared movement/room kernels (`MOVER:CORE`, `ROOMS:CORE`) are byte-identical between the game file and the server — the precondition for "a replicated player stands on a cell that exists."

Convergence at friends scale is bounded by construction rather than measured: with gossip period *g* = 2 s, fanout 3, and *N* servers, fresh events reach all origins in O(log N) rounds (seconds for tens of servers), snapshots hard-bound staleness at one successful round, and origin death is visible within `MESH_ORIGIN_TTL` = 90 s. The interesting number is what the design *avoids* paying: zero coordination messages when idle (a peerless server's gossip round is one array check), and zero infrastructure beyond the processes the operator already runs.

---

## XI. Related Systems (Informal)

The architecture is a deliberate collage of well-worn ideas, chosen for being *explainable to an operator in one sentence each*: epidemic replication and anti-entropy from Demers et al. [1]; version vectors as causal summaries [2], degenerate to per-origin counters under single-writer discipline (the same observation that makes Lamport's total order [3] unnecessary here); tracker rendezvous, PEX, and magnet links from the BitTorrent ecosystem [4], [5]; cached-peers bootstrap from DHT practice [6]; and the mint-id/ledger approach to duplication from the post-mortem folklore of Diablo-style item duping. What is arguably novel is only the constraint set: all of the above squeezed into one sidecar process and some text files, beside a game that must remain a single HTML artifact.

---

## XII. Conclusion and Forward Ladder

The system demonstrates that a useful class of multiplayer — presence, chat, discovery, and community formation around forkable worlds — needs no consensus, no brokers, and no databases, provided one discipline is enforced everywhere: **every record has exactly one writer, and everything else is a disposable, TTL-bounded, idempotently-refreshed replica.** The same three primitives (owned records, monotonic sequence, deterministic identity) appear at the presence layer, the tracker layer, the federation layer, and the planned economy — the architecture is one idea wearing four coats.

Shipped at time of writing: increments (a)–(d3) plus follow-ups FU 1–3 (reachability, join-by-magnet/server browser/world tags, pid-keyed presence). The forward ladder, in order: realtime remote-player minimap push (FU 4), session auto-reconnect (FU 5), the manifest-scope decision made formal (FU 6), rate limiting (FU 8), then the gameplay layers — co-presence buffs, party loot share, hireling and sentry bots — and finally the quarantined multi-writer slice: the no-dupe ledger and consensual duels. Each rung reuses the primitives this report described; none requires a new infrastructure class. The file remains sovereign.

---

## References

[1] A. Demers, D. Greene, C. Hauser, W. Irish, J. Larson, S. Shenker, H. Sturgis, D. Swinehart, and D. Terry, "Epidemic algorithms for replicated database maintenance," in *Proc. 6th ACM Symp. Principles of Distributed Computing (PODC)*, 1987, pp. 1–12.

[2] D. S. Parker, G. J. Popek, G. Rudisin, et al., "Detection of mutual inconsistency in distributed systems," *IEEE Trans. Software Engineering*, vol. SE-9, no. 3, pp. 240–247, 1983.

[3] L. Lamport, "Time, clocks, and the ordering of events in a distributed system," *Commun. ACM*, vol. 21, no. 7, pp. 558–565, 1978.

[4] B. Cohen, "Incentives build robustness in BitTorrent," in *Proc. 1st Workshop on Economics of Peer-to-Peer Systems*, 2003.

[5] "Magnet URI scheme," BitTorrent extension BEP-9 (metadata exchange) and community specification; see also BEP-5 (DHT protocol) for trackerless operation.

[6] P. Maymounkov and D. Mazières, "Kademlia: A peer-to-peer information system based on the XOR metric," in *Proc. IPTPS*, 2002, pp. 53–65.

[7] Roll2Hit project documents: `lab-reports/lab-report-mesh-multiuser.md` (design lock), `lab-reports/lab-report-walk5-mud-harness.md` (session/instancing properties), `plan.md` §MESH-01 / §MESH-01-FU (increment history), `peers.txt` (bootstrap format specification).

---

*Appendix note: all code excerpts are verbatim (lightly elided with `...`) from `wbapi-server.js`, `roll2hit-v3.html`, and `worldbuilder.html` at commit `9dd029b`. Function names are stable public vocabulary in this codebase and may be grepped directly.*
