<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §MESH-02: Map-Tab Connection Center (sub-tabs · discovery · ACL UI · shared blocklists)

**Date:** 2026-07-06 · **Status:** ✅ SHIPPED 2026-07-07 (increments a–j; ship records in plan.md §MESH-02)
**Parents:** §MESH-01 (closed; `lab-report-mesh-multiuser.md`), mesh-acl (§MESH-01-FU 11)

| Inc | What | Shipped |
|-----|------|---------|
| (a) | Server endpoints — `GET/PUT /api/mesh/acl` + `GET /api/mesh/blocklist` (§3.1) | ✅ 2026-07-06 |
| (b) | Map-sheet sub-tab shell (`#map-subtab-bar`, 4 panes, `msubSwitch`, `window.__mesh02`) | ✅ 2026-07-06 |
| (c) | Connect pane — status card + one connect path via `mpJoin`/`mpToggle`/`mpResolveMagnet(ui)` | ✅ 2026-07-06 |
| (d) | Discover pane — D6 local scan, Find, list sources + D4 whitelist-gated auto-load | ✅ 2026-07-07 |
| (e) | Lists pane — client black/whitelist, server ACL editor, D2/D3 peer preview→explicit merge | ✅ 2026-07-07 |
| (f) | Committed tests — mud-harness [R] (19 checks) + hermetic `mesh-connections-ui.test.js` (8) | ✅ 2026-07-07 |
| (g) | Docs + CLI parity — `./api.sh mesh acl\|blocklist\|connect`; wbapi-help/mechanics/docs-node-network/index | ✅ 2026-07-07 |
| (h) | 💬 multi-user chat history (`GET /api/session/chat`, `MP.chat` ring + panel) | ✅ 2026-07-06 |
| (i) | Runtime mesh connect (`POST /api/mesh/connect`, worldbuilder 🔌 box) | ✅ 2026-07-06 |
| (j) | 👣 footprints (`FOOTPRINTS` ring on `buildLook`, once-per-cell client announce) | ✅ 2026-07-07 |

## 1. Problem

All multiplayer UI lives in a status strip (🌐) + a modal (Shift+🌐). The server-side
ACL (`mesh-acl.json`) has no UI, no sharing, and the client has no way to discover
servers listening on the local machine or to load a server list from a URL.

## 2. Decisions (locked)

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Multiplayer UI moves into the **Map sheet** as sub-tabs: `🗺 Map · 🌐 Connect · 🔭 Discover · 🛡 Lists`. The 🌐 strip and Shift+🌐 modal stay (shortcuts). | User request; Map is the world-facing surface. |
| D2 | **Blocklists are share-OUT only, never auto-imported.** A peer's shared blocklist is fetched manually, previewed, and merged only on explicit click. | Trust posture: nobody else curates your blocklist. |
| D3 | Blocklist sharing is **opt-in** via a new ACL field `shareBlocklist:true` (default absent/false → endpoint answers 403). | Publishing who you block is itself information. |
| D4 | **Auto-fetch applies only to server-list sources the user marked approved** (client whitelist). Non-approved sources load on manual click only. | User request ("whitelist allows auto fetching from approved IPs"). |
| D5 | Client keeps its own quick lists in localStorage (`mpBlacklist`, `mpWhitelist`, `mpListSources`) — display/join layer. The authoritative server ACL stays `mesh-acl.json`, edited via new endpoints. | Client lists work offline/file://; server ACL gates the mesh itself. |
| D6 | Local discovery = parallel `GET /api/manifest` probes of `localhost` ports **1360–1380** (~600 ms timeout each). No new protocol; a browser cannot listen, only probe. | Finds every locally-listening WBAPI server with zero server changes. |
| D7 | Everything here is connection/display layer. **The mover never reads any of it** (Free-Movement invariant). Presence stays single-writer. | Standing §MESH-01 invariants. |

## 3. Data shapes

### 3.1 Server endpoints (wbapi-server.js §MESH-02)

```
GET /api/mesh/acl
  → { ok, file, exists, acl: { mode, shareBlocklist,
      blockServerIds[], blockIps[], blockWorldHashes[],
      allowServerIds[], allowIps[], allowWorldHashes[] } }   // '//'-comment keys stripped

PUT /api/mesh/acl        body: any subset of the acl fields above
  - mode ∈ {open, allowlist}; lists = arrays of strings (trimmed, deduped, ≤200 each);
    shareBlocklist = boolean. Unknown body fields → 400.
  - Merges over the existing file (unknown/comment keys in the file preserved),
    writes ACL_FILE. Hot-reload (mtime) applies it on the next mesh packet.
  → { ok, file, acl }

GET /api/mesh/blocklist
  - 403 { ok:false, reason:'not-shared' } unless getAcl().shareBlocklist === true
  → { ok, serverId, engineVer, blockServerIds[], blockIps[], blockWorldHashes[] }
```

`shareBlocklist` is ignored by `aclAllows()` — it is metadata, not a gate.

### 3.2 Client localStorage (game HTML)

```
mpBlacklist   : ["host:port" | serverId | worldHash, ...]   // hides rows, refuses Join
mpWhitelist   : ["host" | "host:port", ...]                 // approved sources (D4)
mpListSources : [{ url, auto:bool }, ...]                   // auto only honored if url's host ∈ mpWhitelist
```

### 3.3 Server-list source format (http(s) txt or JSON)

Text: one entry per line — `host:port`, `http(s)://…` (tracker or server), or `r2h:?…`
magnet; `#` comments ignored. JSON: array of strings or `{addr,name}` objects.
Parser: `mpParseServerList(text)` → `[{addr|url|magnet}]`, deduped.

## 4. UI

`#sheet-map` gains `#map-subtab-bar` + four panes (`#msub-map` wraps the existing map
content untouched). Connect pane: status card (server, session, world tag, engine ver
from `/api/manifest`) + server/magnet input + Connect/Disconnect (reuses `mpToggle`/
`mpJoin`). Discover pane: 🖥 Scan-local button (D6), tracker/magnet resolve (reuses
`mpResolveMagnet` renderer, parameterized container), source-list manager (add URL,
auto toggle per D4, load now). Lists pane: client quick-lists editor, server ACL editor
(GET/PUT `/api/mesh/acl`; offline → hint), peer-blocklist fetch → preview → explicit
merge (D2/D3). Rows everywhere are filtered by `mpBlacklist` and `mpJoin` refuses
blacklisted targets.

## 5. Tests

- **mud-harness [R]**: dedicated server with `MESH_ACL_FILE` pointed at a scratch file —
  GET default acl · PUT roundtrip (file written, response echoes) · blocklist 403 when
  unshared · 200 + lists once `shareBlocklist:true` PUT · bad mode/field → 400.
- **Playwright `mesh-connections-ui.test.js`** (hermetic, `:1367` route-blocked):
  sub-tab switching; `mpParseServerList` txt/JSON/garbage; blacklist filtering of
  rendered rows + Join refusal; whitelist-gated auto flag. Server-free hooks:
  `window.__mesh02 = { mpParseServerList, _mpClientLists, ... }`.

## 6. Non-goals

No auto-import of foreign blocklists (D2). No client listening sockets. No ACL of
players/sessions (servers only — §MESH-01-FU 11 stance). No LAN broadcast discovery
(would need a server-side helper; localhost probing only for now).
