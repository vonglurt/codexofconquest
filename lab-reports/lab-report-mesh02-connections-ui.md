<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->
# Lab Report — §MESH-02: Map-Tab Connection Center (sub-tabs · discovery · ACL UI · shared blocklists)

**Date:** 2026-07-06 · **Status:** ✅ SHIPPED 2026-07-07 (increments a–j)
**Parents:** §MESH-01 (closed; `lab-report-mesh-multiuser.md`), mesh-acl (§MESH-01-FU 11)
**Ship records:** `14bd572` (a) → `d86aeea` (f) → `c03cdc5` (g, closes a–j); archive: `plan-archive.md` §"Archived 2026-07-07"
**Verified against HEAD:** 2026-08-17 (§DOC-02bx) — see §VII

## Abstract

§MESH-01 gave the game a working seven-layer mesh and hid every control for it behind a
status strip and one modal. §MESH-02 promotes those controls to a **Connection Center**: a
sub-tab bar on the Map sheet carrying **Connect · Discover · Lists** panes, three server
endpoints (`GET/PUT /api/mesh/acl`, `GET /api/mesh/blocklist`, `POST /api/mesh/connect`),
two ambient presence features (💬 chat history, 👣 footprints), and CLI parity through
`./api.sh mesh`. The organising principle is a **trust boundary drawn once and enforced
everywhere**: a peer's blocklist is share-OUT only and never auto-imported, sharing is the
operator's opt-in, and auto-fetch is confined to hosts the player approved. Everything
added here is connection/display layer; the mover reads none of it. Re-measured 42 days
later, **every locked decision D1–D7 holds and every endpoint, constant and list key is
byte-exact**; the drift is entirely in the *labels* of the sub-tab bar, which absorbed two
more panes the day after ship without a contract change.

## I. Introduction

### A. Problem

All multiplayer UI lived in a status strip (🌐) and a modal (Shift+🌐). Consequences:

1. The authoritative server ACL (`mesh-acl.json`) had **no UI at all** — it was a file you
   edited by hand and restarted around.
2. There was no way to **find** a server: not one listening on your own machine, not one on
   a list a friend published.
3. There was no way to say *"never show me that server again"* short of not typing its address.

### B. Motivation — what this buys the player

A mesh nobody can join is a single-player game with extra latency. The Connection Center is
where multiplayer stops being an operator feature and becomes a *place in the game*:

- **The world tab is the social tab.** Joining another world is framed as an act of
  navigation, not configuration — you find people on the Map sheet, next to the map.
- **Discovery replaces address-typing.** 🖥 Scan-local finds the server you started ten
  minutes ago; a list source lets one person curate a server list for a group and everyone
  else subscribe to it.
- **Refusal is a first-class verb.** A blacklist that hides rows *and* refuses Join means a
  player can permanently opt out of a griefer's world in one click, on every surface at once.
- **Trust is opt-in in both directions.** You may publish who you block; nobody may install
  their judgement into your client. *Nobody else curates your blocklist* is the whole of D2.
- **Presence gains a memory.** 💬 chat history and 👣 footprints make an empty cell readable:
  *"Aldric passed through here 4 min ago"* turns 90×360 cells of wilderness from an empty
  grid into a place other people are demonstrably using.

### C. Constraint inherited from §MESH-01

Free-Movement: the mover kernel never consults presence, and presence stays single-writer.
This report adds five new data structures and **none of them is readable from movement code**
— a property re-verified in §VII, not merely asserted.

## II. Locked Decisions and Their Outcome

| # | Decision | Rationale | Outcome at HEAD |
|---|----------|-----------|-----------------|
| D1 | Multiplayer UI moves into the **Map sheet** as sub-tabs. The 🌐 strip and Shift+🌐 modal stay as shortcuts. | Map is the world-facing surface. | ✅ **held, and outgrew the spec** — the bar shipped with 4 tabs and carries **6** since §MP-MAPTABS (2026-07-08); pane ids unchanged |
| D2 | **Blocklists are share-OUT only, never auto-imported.** A peer's list is fetched manually, previewed, merged only on explicit click. | Nobody else curates your blocklist. | ✅ exact — merge is reachable only from a button rendered by the preview |
| D3 | Sharing is **opt-in** via ACL field `shareBlocklist:true` (absent/false → 403). | Publishing who you block is itself information. | ✅ exact, both directions (403 → 200 → 403) |
| D4 | **Auto-fetch only for sources whose host the user approved** (client whitelist). | User request; unapproved sources load on click only. | ✅ exact, and covered by a fetch-count assertion |
| D5 | Client keeps quick lists in localStorage; the authoritative ACL stays `mesh-acl.json`, edited via new endpoints. | Client lists work offline/`file://`; the server ACL gates the mesh itself. | ✅ exact — offline renders a hint, never an error |
| D6 | Local discovery = parallel `GET /api/manifest` probes of `localhost` **1360–1380**, ~600 ms each. | A browser cannot listen, only probe. Zero server changes. | ✅ exact (`[1360, 1380]` inclusive, 600 ms abort) |
| D7 | Everything here is connection/display layer. **The mover never reads any of it.** | Standing §MESH-01 invariant. | ✅ measured 0 hits (§VII) |

## III. As-Built Inventory

### A. Server surface (`js/wbapi-server.js`; at the root as `wbapi-server.js` until `5e48dd7`, 2026-07-09)

```
GET  /api/mesh/acl        → { ok, file, exists, acl:{ mode, shareBlocklist,
                              blockServerIds[], blockIps[], blockWorldHashes[],
                              allowServerIds[], allowIps[], allowWorldHashes[] } }
PUT  /api/mesh/acl          body: any subset of the acl fields (unknown field → 400)
GET  /api/mesh/blocklist  → 403 {ok:false, reason:'not-shared'} until the D3 opt-in,
                            then { ok, serverId, engineVer, block*[] } — allow* never leaks
POST /api/mesh/connect      {addr:'host:port'} | {tracker:'http(s)://…'} — dials in-request
GET  /api/session/chat      ?limit=1..200 (default 100), optional &r=&c= cell filter
```

- `js/wbapi-server.js:if (parts[0] === 'mesh' && parts[1] === 'acl'@2978` — the GET reply is
  rebuilt from a whitelist of keys, so `'//'`-comment keys are stripped on the way out and
  **preserved in the file** on the way in (merge-write).
- PUT validation: mode ∈ {open, allowlist}; lists are arrays of ≤200 non-empty strings
  (`js/wbapi-server.js:ab[k].length <= 200@3006`), trimmed and deduped through a `Set`;
  `shareBlocklist` boolean. The write bumps the file mtime and `getAcl()` hot-reloads on the
  next mesh packet — **no restart between an edit and its effect**.
- `js/wbapi-server.js:return json(res, 403, { ok: false, reason: 'not-shared' });@3019` — the
  D3 gate, and the exact string the client renders as *"does not share its blocklist."*
- `js/mesh.js:function aclAllows({ serverId, ip, worldHash }) {@63` — blocks are checked
  first and beat an allowlist match. **`shareBlocklist` occurs zero times in `js/mesh.js`**:
  it is metadata about publication, never a gate. The report's original sentence, exact.
- Footprints (j): `js/wbapi-server.js:const FOOTPRINT_TTL = 30 * 60 * 1000, FOOTPRINT_PER_CELL = 8;@175`,
  written by `js/wbapi-server.js:function recordFootprint(pid, name, r, c) {@177` from
  `session/move` and `session/pos`, served by
  `js/wbapi-server.js:footprints: footprintsAt(s.r, s.c),@8698` — one entry per player per
  cell, a re-pass refreshing the ts.

### B. Client surface (`roll2hit-v3.html`)

- Shell: `<div id="map-subtab-bar">@4585` + `function msubSwitch(id) {@36638`, which is a
  pure pane toggle plus one `on-open` hook per pane. 25 test hooks are exported at
  `window.__mesh02 = Object.assign@38366`.
- Connect: status card from `/api/manifest`, reusing `async function mpResolveMagnet(ui) {@29362`
  — the one resolver, parameterised by container ids, shared with the modal and Discover.
- Discover: `async function _mdProbeManifest(base, ms) {@29503` fired in parallel across
  `const _MD_SCAN_PORTS = [1360, 1380];@29512`; list parsing in
  `function mpParseServerList(text) {@29477`; D4 gate in `function _mdHostApproved(url) {@29532`.
- Lists: `const _ML_ACL_LISTS = ['blockServerIds'@29639` drives six textareas; the D2 flow is
  fetch → preview → `function mlPeerMerge() {@29743`, which is unreachable except from the
  button the preview renders.
- Enforcement is two lines, and they are the reason the blacklist feels absolute:
  `rows = rows.filter(s => !_mpBlacklisted(s));@29348` on every rendered server list, and
  `if (_mpBlacklisted(addr))@29402` inside Join. Matching is by addr, bare host, serverId or
  world hash — `function _mpBlacklisted(s) {@29643`.
- Presence: `const MP_CHAT_CAP = 200;@28503` ring, and `function _mpFootprints(look) {@29169`,
  which announces **once per cell arrival**, excluding yourself and anyone standing there —
  prints are for who you *missed*.

### C. Client persistence (localStorage)

```
mpBlacklist   : ["host:port" | host | serverId | worldHash, …]   hides rows, refuses Join
mpWhitelist   : ["host" | "host:port", …]                        approved sources (D4)
mpListSources : [{ url, auto:bool }, …]                          auto honored only if host ∈ mpWhitelist
mpChatLog     : last 200 chat lines (💬 history, survives reload)
```

Server-list format (`http(s)` txt or JSON): text = one entry per line — `host:port`,
`http(s)://…`, or an `r2h:?…` magnet, `#` comments ignored; JSON = array of strings or
`{addr,name}` objects. Parsed to `[{addr|url|magnet, name?}]`, deduped.

## IV. Spec → Shipped Delta

| Spec claim | HEAD | Verdict |
|---|---|---|
| §3.1 endpoint shapes (all fields, both directions) | identical, field-for-field | ✅ exact |
| PUT caps: ≤200/list, trimmed, deduped, unknown field → 400 | identical | ✅ exact |
| `shareBlocklist` ignored by `aclAllows()` | 0 occurrences in `js/mesh.js` | ✅ exact |
| §3.2 three localStorage keys | all three, same names | ✅ exact (+ `mpChatLog` from (h)) |
| §3.3 parser contract | identical | ✅ exact (+ optional `name` passthrough) |
| D6 ports 1360–1380, ~600 ms | `[1360, 1380]`, 600 ms abort | ✅ exact |
| D1 sub-tab bar: **4** panes `🗺 Map · 🌐 Connect · 🔭 Discover · 🛡 Lists` | **6** panes `🗺 Local · 🌍 World · 🛰 Full · 🌐 Multiplayer · 🔭 Discover · 🛡 Lists` | ⚠ **stale labels, sound shell** — §MP-MAPTABS added World/Full on 2026-07-08 with **no change to `msubSwitch`'s contract**; pane ids `msub-connect/discover/lists` never moved |
| Blacklist entry forms: `host:port` \| serverId \| worldHash | also matches a **bare host** | ⚠ report understates the shipped behaviour |
| (f) "mud-harness [R] — **19** checks" | **18**, at `d86aeea`, at `c03cdc5` and at HEAD | ❌ **wrong the day it was written** — never 19 (see §VII) |
| (a)–(j) all shipped | all ten live | ✅ |
| §3.1 header path `wbapi-server.js` | `js/wbapi-server.js` since `5e48dd7` (2026-07-09) | ⓘ **correct for its day**, stale for 40 days |

## V. Non-Goals — Still Held?

| Non-goal | Status |
|---|---|
| No auto-import of foreign blocklists (D2) | ✅ held — merge is click-only |
| No client listening sockets | ✅ held — probe-only by construction |
| No ACL of players/sessions (servers only) | ✅ held — no player/session key exists in any ACL path |
| No LAN broadcast discovery | ✅ held — `dgram` occurs **0** times in `js/wbapi-server.js` and `js/mesh.js` |

Four non-goals, four survivals, 42 days — each written as a *property to preserve* rather
than a feature to postpone. A property has a test; a postponed feature has good intentions.

## VI. Defects Found (2026-08-17)

- **§DX-02cs 🟢** — `js/wbapi-server.js:const parsed = JSON.parse(buf || '{}');@1616` resolves
  non-object JSON verbatim, and the 44 handlers that dereference it are unguarded. Measured
  live: `PUT /api/mesh/acl` with body `null` or `5` returns **500 and a raw JS TypeError
  string** instead of this report's documented 400; `POST /api/mesh/connect` and
  `POST /api/session/start` fail the same way. Arrays and strings correctly 400. One-line
  fix at the single choke point.
- **§DX-02ct 🟢** — the retired four-tab roster still ships in two docs
  (`docs/notes/docs-node-network.md:451`, `index.md:191`); `mechanics.md` was updated and is
  correct. `index.md:191` also still reads *"(g) docs/CLI closes it"* for an increment that
  closed on 2026-07-07.
- **§DX-02cu 🟡** — the 🛡 Lists ACL editor offers `mode: allowlist` with no warning that
  saving it while the three allow* lists are empty **isolates the server completely** (in and
  out). `docs/api/wbapi-help.md` documents the hazard; the in-game surface that can trigger
  it does not.

## VII. Verification Method and Results (§DOC-02bx)

1. **Instrument 101 (path-parts router).** `mesh/acl` and `mesh/blocklist` grep to **0** as
   URL literals and are both live: the router dispatches on `parts[0]`/`parts[1]`. A literal
   URL grep would have declared this report's whole server surface unshipped.
2. **Instrument 84 (a report amended by the work it authorises).** The a–j increment table
   was added by `c03cdc5` — increment (g) itself. §1–§6 are the original 2026-07-06 design
   lock, unedited. Both halves are dated in the header above so a later reader cannot
   mistake the retrospective table for a prediction.
3. **Instrument 70 (run the acceptance test).** `tests/integration/mesh-connections-ui.test.js:sub-tab shell: 6 tabs / 6 panes@48`
   — **8/8 green** (4.7 s). Harness section `tests/mud-harness.mjs:const aclR2 = path.join(tmp,@1364`
   — **18/18 green**, covering GET-defaults, PUT roundtrip, disk persistence, comment-key
   survival, five validation 400s, and the 403→200→403 share flip. `npm run test:mud` overall:
   **267 ✓ / 2 ✗**, both failures the carried §DX-02ca `[D]` idle-TTL reds — a different
   section, unrelated to any claim here.
4. **The one wrong number, and how it was caught.** Increment (f) claims 19 checks in `[R]`.
   Static call sites: **18** at `d86aeea` (the commit that wrote the claim), **18** at
   `c03cdc5`, **18** at HEAD; the live run prints **18**. There are no loops in that section,
   so runtime cannot exceed the static count. This is a review defect, not rot — *a figure
   you must count is a claim, and this one was never true.*
5. **D7 measured, not asserted.** `grep -cE "msub|mpBlacklist|MP\.|mesh" js/mover.js` → **0**.
   The footprint kernel restates the invariant in its own header comment at the one site that
   could have broken it — the mover *could* have read footprints for free, and does not.
6. **Live endpoint replay.** A scratch server on `PORT=1379` with a scratch `MESH_ACL_FILE`
   reproduced the §3.1 GET default response **byte-for-byte** against the block quoted above,
   round-tripped a PUT, and produced the §DX-02cs 500s.

**Gate state at verification:** `check:anchors` 3,301 anchors / 81 docs, 0 dead (117 stale
hints = unchanged baseline) · `roll2hit-v3.html` untouched by this pass.

## VIII. Conclusion

§MESH-02 is the strongest survival in the §MESH block. Six weeks on, every endpoint shape,
constant, list key and locked decision measures exact against HEAD; three tables of claims
produced exactly one wrong figure, and that figure was wrong the day it was typed rather
than eroded since.

The durable lesson is **where a design's contract actually lives**. D1 named four sub-tabs;
the bar has six, because the contract was never the labels — it was `msubSwitch` plus four
stable pane ids, onto which two unrelated panes were bolted a day later without touching a
line of §MESH-02 code. The decisions stated as *properties* — share-OUT only, opt-in
publication, whitelist-gated auto-fetch, the mover reads nothing — are all still enforced,
each by code a test can point at. The labels drifted and it did not matter; the properties
did not drift, because something is watching them.
