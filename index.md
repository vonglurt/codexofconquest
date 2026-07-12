<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Roll2Hit — The Shattered Codex: Document Index

**Project:** `roll2hit-v3.html` — single-file combat tracker + narrative RPG
**Status:** Layers 0–104 implemented · 36,933 lines · 418 nodes · 398 monsters · ~2,848 quests · 85 lab reports · §WALK ✅ · **§ARCH-01 UQF ✅ CLOSED 2026-07-05** (all ~2,700 quests UQF-1.0; QuestRuntime sole execution surface) · **§NAV-01 ✅ COMPLETE** (Inc a–h, closed 2026-07-03) · §MESH-01 core ✅ + **§MESH-01 gameplay ladder (f–j) ✅ COMPLETE 2026-07-06** (buffs · hireling · sentries · no-dupe ledger incl. cross-origin trades · PvP duels) · **no jump travel** (§CELL-13 re-applied 2026-07-03 — portal/transmort/hearth re-removed after a snapshot-rollback revert) · full ✅ registry in the Completed Work table below · §DATA-01 ✅ RESOLVED 2026-07-06 (superseded by §ARCH-01 UQF; journal-renderer textContent residual shipped)
**Last updated:** 2026-07-09 — repository reorganized + structure simplified (see below)

> **📁 Repo reorganized 2026-07-09.** Root decluttered ~110 → ~35 files. `plan.md` split into `CONTRIBUTING.md` (dev policies) + `BACKLOG.md` (outstanding work). Historical docs moved under `docs/{spec,story,api,mechanics,notes}/`; importers → `importers/`, dev utilities → `tools/`, narrative texts → `sources/`. Core sync docs stay at root. Folder map + hosting/run instructions: **`README.md`**.
>
> **🧹 Structure simplified 2026-07-09 (§CLEANUP-02).** Runtime JavaScript moved to **`js/`** (`wbapi-server.js`, `wbapi-core.js`, `mesh.js`, `mover.js`, `rooms.js`, `duel.js`); data + config moved to **`config/`** (`peers.txt`, `roads-pins.json`, `walk-geo-gazetteer.json`, `mesh-acl.json`, plus runtime caches). One launcher at root: **`./r2h`** (`serve` · `game` · `world` · `test` · `checks` · `api` · `tracker`). The single-file game bundle `roll2hit-v3.html`, `worldbuilder.html`, the core sync docs, and shell launch scripts stay at root. Start the server with `./r2h serve` (was `node wbapi-server.js`).

### Doc Health Badge

| Metric | Value | Status |
|--------|-------|--------|
| HTML line count | 36,933 | ✅ |
| Lab reports on disk | 85 | ✅ |
| Lab reports in index | 85 | ✅ |
| Node text rewrites (noir register) | 121 / 121 | ✅ +33 nodes: Med arc (91–110) + Littoral Courts (111–120) Layer 104 |
| FC items pending | 0 (FC01–FC08 all ✅) | ✅ 2026-05-26 |
| Layers implemented | 0–104 | ✅ |
| Live entity counts | 418 nodes · 398 monsters · 111 terrains · ~2,848 quests · 204 NPCs | ✅ 2026-07-09 (`GET /api/list`) |
| Last sync pass | 2026-07-09 — §CLEANUP-01 Part B doc-health: refreshed stale in-prose counts against the live `GET /api/list` parse — **monsters 370/392 → 398** (`monsters.md` header + `index.md` Status/footer/`MONSTER_POOL` row + spec-world row), **nodes 410 → 418** (Status/footer/cell-map row), **quests ~2,830 → ~2,848**, **footer line count 34,542 → 36,933**; terrain live count noted as 111 (check:invariants' 110 is its line-regex Set undercounting the JS-parse total by 1). `story.md`'s "42 story nodes" left as-is — it's a curated *narrative*-beat count, not the 418 world nodes (flagged for a narrative-owner review, not a mechanical overwrite). **Prior pass:** 2026-07-03 — §NAV-01 docs close-out: `lab-reports/lab-report-nav01-navigable-world.md` written; road-net + room-layer sections added to `maps.md` (+ FL1/FL9/FL12 flows re-verified against code, stale GATE_LOCKS section retired), `docs/notes/docs-node-network.md §13` (L0–L8 layer stack; §4/§9 rewritten to mover-kernel reality), `mechanics.md` (Roads, Rooms & Auto-Travel). **Sync findings:** `GATE_LOCKS` gone from code (docs claimed 4 live gates); §CELL-13 jump-travel removal partially reverted (`storyPortal`/`storyUseTransmort`/hearth live) → **resolved same day: user directed re-removal** (all jump-travel code cut from HTML; mechanics.md/mechanics-economy.md sections replaced with removal notes; gates check:walk 6/6, nav+autosave+fishing 48/48). Prior pass: 2026-07-02 §MESH docs close-out | ✅ |

> Update this table at the start of each session: recount lab reports with `ls lab-reports/lab-report-*.md | wc -l`, check HTML line count with `wc -l roll2hit-v3.html`, confirm FC item status.

---

## Project Directive

> Read this section at the start of every session.

**Adding = Planning.** Write a spec in `BACKLOG.md`. Assign a Layer number. Mark it `⚠️ PLANNED`. Do not touch `roll2hit-v3.html`. (Dev policies live in `CONTRIBUTING.md`.)

**Implementing = Code + Sync.** Write JavaScript. Then sync every markdown doc that describes what changed. Both steps required.

**Two-Way Sync Rule.** Every item in the markdown docs traces back to `roll2hit-v3.html`. Everything in the HTML has a home doc. On each sync pass: verify world map consistency across `maps.md`, `story.md`, `world.md`.

**Lab Report Rule.** Write a `lab-reports/lab-report-<title>.md` for: major collections, multi-system redesigns, new narrative arcs (3+ nodes), pre-implementation design reviews, or session postmortems with non-obvious decisions. Do not write one for single-item additions or value corrections.

**Session Format.** One increment per "continue."

---

## The Game in One Paragraph

Roll2Hit is a single-file HTML application. It runs as a combat dice tracker (Battle Mode) and a 410-node narrative adventure game (Story Mode). The narrative game — *The Shattered Codex* — is a solo journey across 8 acts and 121 locations to collect 7 Codex Shards and seal the Void before Day 49. The player is a Level 1–20 Fighter Champion. Combat uses D&D 5e mechanics; story progression uses directional navigation across a node graph. MIT-licensed. No server. No build step.

---

## Document Index

### Core Reference

| File | Purpose | Status |
|------|---------|--------|
| `README.md` | Project overview, how to open/host the game, run the API server (brew + node), full folder map | ✅ Rewritten 2026-07-09 |
| `index.md` | This file — master index + cross-reference | ✅ Updated 2026-07-09 |
| `docs/` | Reference docs (see `docs/README.md`): `spec/` `story/` `api/` `mechanics/` `notes/` | ✅ Created 2026-07-09 |
| `CONTRIBUTING.md` | Development policies & directives (API-first, cell-first, free-movement, test-run rules, WBAPI hazards, lab-report policy) | ✅ Split from plan.md 2026-07-09 |
| `BACKLOG.md` | Outstanding work — open/in-progress items + closed-for-context list | ✅ Split from plan.md 2026-07-09 |
| `docs/mechanics/mechanics-combat.md` | Battle Mode: combat flow, 1.5 AP economy, weapons, loot, leveling, defeat screens, save system | ✅ Split 2026-05-25 |
| `docs/mechanics/mechanics-economy.md` | Story Mode: vendor system, NPC favorability, EB, NG+, state fields, F4 function reference | ✅ Split 2026-05-25 |
| `docs/spec/combat.md` | Battle engine reference: initiative, overlay, Champion features, death saves, flee | ✅ §API-02 line-verified 2026-05-25 |
| `maps.md` | World map: cell grid + extended areas, 410 node codes + coordinates, cell-adjacency network, gate locks, §MESH multiplayer map surfaces | ✅ Updated 2026-07-02 |
| `story.md` | Main quest narrative: 42 story nodes across 8 acts, 7 Epic NPC profiles, prologue, endings, NG+ | ✅ 76 nodes covered |
| `world.md` | DM manual: world history, 4 factions, 7 Epic NPC profiles, quest motivation, survival pressure | ✅ Reviewed 2026-05-24 |
| `monsters.md` | 398 monsters: stat blocks by tier and terrain pool, 20 EB bosses, fish pool | ✅ Verified 2026-07-09 |
| `quest.md` | Master quest register — all quests organized by location (implemented + planned) | ✅ |
| `mechanics.md` | High-level game mechanics overview — links to docs/mechanics/mechanics-combat.md and docs/mechanics/mechanics-economy.md; §MESH-01 multiplayer presence + world-identity boundary; §MESH-02 connection center (Map-tab sub-tabs, 💬 chat history, 👣 footprints, two-window quick-start) | ✅ Updated 2026-07-07 |
| `docs/notes/docs-node-network.md` | Node network technical reference — cell grid, adjacency, code conventions, `cellMove` navigation, §12 multiplayer mesh (gossip/vv/tracker/ACL) + §MESH-02 operator endpoints (acl/blocklist/connect/chat) | ✅ Updated 2026-07-07 |
| `mover.js` | **§WALK-2** unified mover kernel — pure `move(world,pos,dir)→MoveResult` (geo wrap/clamp/sea/locale per lab report §4.1; no DOM/SSE/RNG). The `MOVER:CORE` block is inlined byte-identically into `roll2hit-v3.html` and `require()`d by `wbapi-server.js` — single source of movement truth shared by SP client (`cellMove`) + MUD server (`POST /api/session/move`) | ✅ done 2026-06-26 |
| `rooms.js` | **§NAV-01c/f** unified room-description kernel — pure `describeCell(world,pos)→Room` (deterministic prose hash, exits-with-signage, road/lane signposts, nearest landmarks). The `ROOMS:CORE` block is inlined byte-identically into `roll2hit-v3.html` (`check:roomsparity`) and `require()`d by `wbapi-server.js` — `room` on all session look surfaces, byte-equal SP/MUD (mud-harness [M]) | ✅ done 2026-07-02 |
| `duel.js` | **§MESH-01j** unified duel-resolution kernel — pure `DUEL.run(statA,statB,duelSeed)→{transcript,winner,…}` (mulberry32 over the commit-reveal seed; own pure-JS sha256 so commit hashing never diverges; `checkBounds` impossible-stats gate). The `DUEL:CORE` block is inlined byte-identically into `roll2hit-v3.html` (`check:duelparity`) and `require()`d by `wbapi-server.js` — client replays + verifies every server verdict | ✅ done 2026-07-06 |
| `mesh.js` | **§MESH-01-REVIEW** server↔server mesh layer extracted from `wbapi-server.js` — ACL (`mesh-acl.json` hot-reload, fail-open warning) · per-IP ingress rate limit · presence gossip (single-writer, version-vector dedup, PEX) · tracker announce/rendezvous + federation + announce-table cache · bootstrap ladder (`--peer` / `MESH_PEERS` / `peers-cache.json` / `peers.txt` / `BOOTSTRAP_URLS`). Factory `require('./mesh')(deps)`: the server passes its live surfaces (SESSIONS, SSE fanout, chat ring, manifest/serverId, ledger hooks) and destructures the same symbol names back, so every endpoint call site is unchanged. Server-only — never inlined into the HTML (unlike `mover.js`/`rooms.js`/`duel.js` there is no `:CORE` parity block) | ✅ done 2026-07-06 |
| `docs/notes/Year1367AD.md` | Canonical year 1367 AD — historical events, source texts, quest vignettes for §1367 integration | ✅ |

### Story Arc Files

| File | Content | Intersection |
|------|---------|-------------|
| `docs/story/story-flowchart.md` | Full story flowchart using two-letter node codes · arc overlays · intersection points ★ | All arcs |
| `docs/story/story-arc-investigation.md` | §XVI Weimar Scholar Gate + §XVII Void Archaeology + §XXI Void Shaman chain | SQ · MT · CI |
| `docs/story/story-arc-coastal.md` | §XIX Tilbury Harbor + §XX Visby Underground | DK · SF · GC |
| `docs/story/story-arc-ngplus.md` | §XV NG+ Remembrance · Entry 42 · quest_ng_01/02/03 | CI · SQ · CO |
| `docs/story/story-arc-npc-dialogues.md` | Birka Six NPC_DIALOGUES full transcript (120 quotes) · arc summary | CI · IN · TV · BA · CY |
| `docs/story/story-arc-epic-battlegrounds.md` | Q52–Q71 EB quest-giver dialogue (5 fields × 20 entries) | 20 dead-end nodes |

### Content Files

| File | Content | Status |
|------|---------|--------|
| `froberger-journal-all-entries.txt` | All 41 Froberger journal entries verbatim | ✅ Verified 41/41 (2026-05-24) |
| `docs/notes/ux-first-battles.md` | First battles UX walkthrough, 10 UX fixes, wimper/flee flow | ✅ Accurate for L0–37 |
| `5thOrgan.html` | Standalone polyphonic pipe organ synthesizer (72 oscillators, Beethoven canon) | ✅ 2026-05-24 |
| `worldbuilder.html` | World Builder UI — 17 tabs: Map, Bestiary, Loot, NPCs, Quests, Dice Lab, CRUD, API, Audit, Stats, Endpoints, Builder, Wizard, ✏ Editor (§EDITOR-01), ⛓ Mission (§EDITOR-02), 🚶 Walk (§WALK), 🌐 Mesh (§MESH-01) | ✅ 2026-07-02 |
| `Saul2Paul.txt` | §FUTURE-01 reference text — Paul's journey from Acts/Pauline letters, itinerary notes | ✅ |
| `littoral-courts-story.txt` | §SIREN-01 vignette prose — Littoral Courts story text, French register source | ✅ |

### Spec Documents *(historical — all implemented)*

| File | Scope |
|------|-------|
| `docs/spec/spec-engine.md` | Layers 0–20 narrative engine design — all marked IMPLEMENTED |
| `docs/spec/spec-corridors.md` | Layer 9 corridor system — all L9-A through L9-H ✅ — **⚠️ SUPERSEDED by §CELL-03** |
| `docs/spec/spec-world.md` | WORLD_DB + MONSTER_POOL architecture — live counts 111 terrains, 398 monsters (2026-07-09; the doc's in-body "66 terrains / 370 monsters" is a historical Layer-37 figure) |
| `docs/spec/spec-combat.md` | Phase 0/2 combat arena spec — historical |
| `docs/spec/spec-migration.md` | Layers 0–8 IEEE migration report — all sections implemented |

### WBAPI Toolchain

| File | Purpose |
|------|---------|
| `wbapi-core.js` | Core WBAPI library — `extractObj`, `removeFns`, Proxy model, comment-aware brace counting |
| `api.sh` / `api/wb.js` | **Primary CLI wrapper** — queued HTTP to WBAPI, auto-nonce, retry/backoff, `--ai` Claude assist, `--out` file output, pipe-friendly |
| `wbapi-cli.js` | Low-level CLI — direct in-process reads/writes against `roll2hit-v3.html` (use `api.sh` for day-to-day work) |
| `wbapi-server.js` | Local HTTP server — REST endpoints for worldbuilder.html at port 1367 |
| `wbapi-toggle.sh` | Shell helper — start/stop wbapi-server |
| `docs/api/wbapi-help.md` | WBAPI usage reference — endpoint list, anchor syntax, example calls; session/pos + Mesh API (manifest, gossip, tracker, world/download, ACL) |
| `parse-nodes.js` | Standalone node parser — extracts NODE_MAP entries for external tooling |
| `scripts/check-mover-parity.js` | **§WALK-2** structural walk-parity — asserts the `MOVER:CORE` block is byte-identical in `mover.js` and `roll2hit-v3.html` |
| `scripts/check-mover-behaviour.js` | **§WALK-2** behavioural walk-parity — replays real `CELL_GRID`/`IMPASSABLE_CELLS` through old `cellMove` logic vs `mover.js`; asserts 0 content-affecting decision mismatches |
| `scripts/check-duel-parity.js` | **§MESH-01j** structural duel-parity — asserts the `DUEL:CORE` block is byte-identical in `duel.js` and `roll2hit-v3.html` |

### Integration Tests (Playwright)

Run with `npm test`. Tests serve the project at `localhost:7654` (no WBAPI server needed).

> ✅ **Rebuilt in §WALK-4 (2026-06-26)** against current geo, extended by §NAV-01 (room render, auto-travel, wayfinding, road-net editor cases). Current at §NAV-01 close (2026-07-03): walk suite **89/89** (navigation 37 + worldbuilder walk specs) · autosave 4/4 · fishing green. Walk-invariant CI gate: `npm run check:walk` **6/6** (invariants, mover parity ×2, terrain parity incl. roads, check:roads R1–R4, rooms parity). MUD server protocol tests live outside Playwright: `npm run test:mud` (**224** checks, sections [A]–[O]: sentry [H]/[H6] · ledger [I]/[I2]/[I3] incl. cross-origin trades · duels [O]). At 2026-07-06 (§MESH-01i slice 1): full Playwright **501 passed** (4 known `worldbuilder-crud-arrays` fails = the §NAV-01-FU-5 server dependency). ⚠️ Before any Playwright run, re-read CONTRIBUTING.md Test-Run Rules: stop the WBAPI server first, never trust piped exit codes.

| File | Coverage | Count |
|------|---------|-------|
| `tests/integration/helpers.js` | Shared helpers: `seedAndLoad`, `dismissContinue`, `readStory`, `SEED_STATE` | — |
| `tests/integration/navigation.test.js` | `cellMove`, geo BFS (`_bfsGridPath`), road-weighted auto-travel (`_roadGridPath` + `_travelTick` interrupts), `storyWaypoint`, empty-cell room render (§NAV-01c), wayfinding UI (§NAV-01e: signage, waypoint ★, readouts), sea-block, status bar | 37 tests |
| `tests/integration/fishing.test.js` | Fishing modal flow, cast/catch/XP loop, miss/recast cycle, throw-back | ~10 tests |
| `tests/integration/autosave.spec.js` | Autosave on navigation, save-and-verify discipline (§UNIFY-09) | ~4 tests |
| `tests/integration/worldbuilder-walk.test.js` | **§WALK** tab in worldbuilder.html — load/nav/chips/D-pad/keyboard/neighbor list/edit form/dirty tracking/quest panel/coord index/cross-tab buttons | **73 tests** |
| `tests/integration/multiplayer-presence.test.js` | **§MESH-01a** two-browser presence smoke — spawns a throwaway wbapi-server; connect via 🌐, "Also here:", exactly-once SSE chat, player_left on departure, strict opt-in | 2 tests |
| `tests/integration/worldbuilder-mesh.test.js` | **§MESH-01 UI** 🌐 Mesh tab — fixture-driven render (identity/trackers/peers/remotes/packet log) + offline fallback | 2 tests |
| `tests/integration/mesh-connections-ui.test.js` | **§MESH-02f** map-tab connection center, hermetic (`:1367` route-blocked before goto) — sub-tab switching, `mpParseServerList` txt/JSON/garbage, `_mpBlacklisted` matrix + row-filter + `mpJoin` refusal, D4 `_mdHostApproved` + auto-load gating, via `window.__mesh02` | 8 tests |
| `tests/integration/quest-runtime-uqf.test.js` | **§ARCH-01** UQF runtime (canActivate/canComplete/execBits, wave-by-wave parity, census pins) + **§MATH-01** completions (shapes, HKG-pocket node cells, same-visit collect completion, atNode hold) | 293 tests |

### Completed Work Registry

All finished §* items. Open/planned items live in `BACKLOG.md`.

| Item | Date | What was built |
|------|------|---------------|
| **§CELL-01–§CELL-13** | 2026-06-13/14 | Cell-first MUD redesign: stripped N/E/S/W from NODE_MAP; added `CELL_GRID` + `IMPASSABLE_CELLS`; rewrote movement as `cellMove(dir)`; empty cell traversal (`_enterEmptyCell`); abolished junction nodes (268 stubs purged); BFS + heatmap rewritten for grid; MUD session layer (`/api/session/*`); cell REST endpoints (`/api/cell/:r/:c`, `/api/grid/*`); quest triggers cell-driven; minimap extended with visited-cell fog; dead corridor code removed; all docs synced |
| **§UNIFY-01–§UNIFY-10** | 2026-06-15 | Unified in-game experience: empty-cell/named-node UI parity (`_renderNodeShell`); `storyMsg` as single narrative channel; `storyUpdateStatus` call discipline; exit link consistency (uses `playerR/C` not `currentCode`); modal `.visible` class audit (no change needed); `ITEM_TYPES` registry; quest/mission-bit boundary audit; `parseLoot` utility; autosave discipline + 4 Playwright tests; `_gameWarn` channel for soft errors |
| **§ARCH-02 Phases 1–5** | 2026-06-12/15 | Operand registry + full-cycle API: `OPERAND_CONTRACTS` (12 kinds); `WBAPI.quests.validate/advise/create/toOperands/chain`; `WBAPI.operands.list/contract/validate`; quest creation UI (opQuestCreate); escort + party runtime (`S.party`, `escort` pickup/dropoff, `talk_party` in inventory); legacy quest conversion (`toOperands` for 108 skill_check quests; §HUNT-01 + §SPARK-01 bits arrays); full advisory enforcement (world-logic hard-block on create + server guard on POST /api/quest); audit extension for bits; `./api.sh advise` composite call |
| **§WORLDBUILDER-02 Phases 1–4** | 2026-06-12 | Investigation mode: quest detail card with arc siblings + upstream/downstream flags; arc filter; mission classification (`_classifyQuest`, 10 classes, `WBAPI.quests.byClass`); Location Profile card (`WBAPI.location.profile`); SVG radial relationship graph in node/quest/NPC detail panes; `_questsByNpc` + `_questsByWaypoint` indexes; `/api/location/:code` enriched |
| **§ARCH-01 Phases 1–2** | 2026-06-12/14 | UQF schema foundation: `SCHEMA_VERSION`, `QuestRuntime`, `adaptLegacyQuest()` (inert); `BIT_CONTRACTS` + `validateQuest()` in worldbuilder; §D01-07 "The Maintenance Plate" arc (5 quests at HKG) migrated from NPC_DIALOGUE dead-code to QUEST_DB |
| **§EDITOR-01** | 2026-06-15 | "✏ Editor" tab in worldbuilder.html: type-aware form (side/skill_check/main/epic); 8 template presets (§SPARK hook/skill, §HUNT setup/invest, §WHODUNIT drain, §ALCHEMY beat, §WISDOM frag); live preview card; flag dependency panel (reads/writes from S_story.*); ID uniqueness badge; ⚡ Advise (§ARCH-02 advisory); ↳ storyRender skeleton generator; ◇ JS export (paste-ready QUEST_DB entry); POST Quest; operand bits builder |
| **§WALK** | 2026-06-15 | "🚶 Walk" tab in worldbuilder.html — playable world editor: 3-column layout (mini-map canvas / game-style node view / inline edit form); live mini-map (196×400px, SCALE=10, current=blue dot+halo, neighbors=orange, edges, click=teleport); D-pad + neighbor list navigation; WASD/arrow keys; jump input; NPC/BATTLE/QUEST info chips; dirty-tracking edit form (label/name/act/terrain/npc/battle/desc); PUT to server; quests-at-node panel; cross-tab links (CRUD/Editor/Quests/NPCs); 73/73 Playwright integration tests green |
| **§SPARK-01** | 2026-06-14 | The Harmony Chain (5 quests at LCY+SEN): smalt befriended → pip met → bioluminescent parasite found → whodunit solved → aldous confessed → harmony chain complete; full storyRender UI; all tokens |
| **§SPARK-01-H Naval Ext.** | 2026-06-14 | Open Water arc (quest_sea_01/02/03 at NWI): strange stillness → INT DC 13 investigation → WIS DC 14 escort into trench depth; pirateCrew_allied; Joint Pirate Debt Note |
| **§FISH-01** | 2026-05-29 | Fish + lake magic in worldbuilder + API: `FISH_POOL`/`NIGHT_FISH_POOL`/`LAKE_MAGIC_DB` anchors; `WBAPI.fishPool/nightFishPool/lakeMagicDb`; `/api/fish`, `/api/lake-magic` endpoints; fishing sim easter egg in Dice Lab; `_lakeMagicBonuses()` drop in `battKillEvent()` |
| **§WBAPI-01 Ph 1–2** | 2026-05-29/06-05 | `POST /api/terrain`, `POST /api/monster`; `GET /api/export/:collection` (node_map, quest_db, monster_pool, world_db, fish_pool, lake_magic; formats: json/js/module); `GET /api/flags` + `POST /api/flags` |
| **§WBAPI-01 Ph 3–4** | 2026-06-26 | Ph3 structured-field PATCH: PUT bodies with array/object/number/boolean values patch `_rawSrc` at source level via `editStructuredField`/`patchLiteralField`/`serializeJsLiteral` (persist through `save()`), not in-memory only (`npm run check:arraypatch`, 13 checks). Ph4 array authoring: Quest Creator gained `targetMonsterKeys`+`killGoals` inputs; **ph4-FU** — CRUD quest form edits existing entities' array fields (`completeItems`/`targetMonsterKeys`/`killGoals`) via the Ph3 PUT path (codecs `arrToText`/`textToArr`; `worldbuilder-crud-arrays.test.js`). Ph5 standalone Node module shipped |
| **§EDITOR-01-D core** | 2026-06-27 | Declarative `itemChain` quest field (Inc 1–4): `_applyItemChain` runtime (grant/take/grantBit/takeBit) hooked into both completion paths; Quest Creator + CRUD form now author via the **§EDITOR-01-D-FU(a) visual `buildChainEditor` widget** (shared `parseItemChainText`/`itemChainToText` codec kept for export/parity); `npm run check:itemchain` (19 checks). FU: (a) visual chain UI ✅ CLOSED (Inc 1–4); (b) 58-branch reward-ladder migration still open |
| **§EDITOR-02 core** | 2026-06-27 | "⛓ Mission" Builder tab in worldbuilder.html (Inc 1–4): pure `buildArcQuests(arcDraft)→questObj[]` compiler (seq ids, arrow-fn `activateCond` chain wiring, skill_check `checkPassFlag` / consumption-gated non-skill `grantBit` producer flags); arc-header + add/remove step rows; **Build Chain** + **Preview Chain** (`.chain-link` + connector flags + `advise` badges); **POST All** = `mbPostAll()` sequential `WBAPI.quests.create`, stop-on-first-error + already-posted skip, per-step `#mb-result` render + done summary. `tests/integration/worldbuilder-mission-builder.test.js` 10 passed. FU: branching arcs + drag-reorder + whole-arc UQF export → §EDITOR-03 |
| **§MBIT-01** | 2026-06-05 | Mission bit token system: `_grantMissionBit`/`_takeMissionBit` helpers; `type:'mission_bit'` inventory items; 🪬 token display in inventory panel |
| **§CELL-01–§CELL-13** nav/session | 2026-06-14 | See §CELL entry above |
| **§D01-07 Maintenance Plate** | 2026-06-14 | 5-quest arc at HKG: WIS Perception DC 10 → auto WIS save → Data Wraith battle → INT Arcana DC 13 cipher → CHA Persuasion DC 12 identity reveal; Scholar King's Name Plate reward |
| **§WORLDBUILDER-02-F open items** | — | `_questsByNpc` ✅ done; `_questsByWaypoint` ✅ done; `_nodesByTerrain` index pending; `_flagToQuests` arc-class map pending |
| **§GR + Covenant Keeper Ending** | 2026-06-15 | La Riva grief arc: FR node + corruption chain CY→FR; Connie/Aldo/Vinnie sub-arc; 6 grief vignettes at FR; Covenant Keeper Ending — all six grief arcs name their people in final storyRender event. Lab report: `lab-reports/lab-report-la-riva-grief-arc.md` |
| **§WISDOM-01** | — | Keel thread close: Baltic survey data arc at eastern Baltic node; "after witnessing" arc completion |
| **§MATH-01** | 2026-06-15 → **✅ 2026-07-07** | Mathematical World: 4 nodes (EHZ/MONS/ZERO/CNTR) + 5 quests (quest_math_01–05); Group Theory dungeon, Monster Group (~8×10^53), zero corridor, Cantor's Attic; Adventure Time register. **Completions shipped 2026-07-07:** nodes moved to the walkable 2×2 pocket NE of HKG (29,247 / 28,247 / 29,248 / 28,248 — the hints' literal layout; before, they were unreachable sub-locations of JRS's cell), all five quests UQF collect (`itemsAll` + `atNode`, gold via onComplete bits); en route, WBAPI PUT gained object-valued field persistence via `editStructuredField`. Design: `lab-reports/lab-report-math01-completions.md` |
| **§WALK-1 / §WALK-1.5 / §WALK-2** | 2026-06-25/26 | Navigation-core redesign: §WALK-1 deleted 316 `junction:true` routing stubs; §WALK-1.5 re-projected all 409 `NODE_COORDS` to equirectangular 1° (360×90, band 70°N→20°S), `CELL_GRID`→locale lists, `SEA_RUNS`→`IMPASSABLE_CELLS` (4790 sea) + `SEA_LANES` land-bridges (59 cells, render as ocean), 409/409 reachable from Birka (LHR cell 10,197); §WALK-2 extracted pure shared `mover.js` (inlined byte-identically into the HTML + `require()`d by the server), rewired `cellMove` + `POST /api/session/move` as thin callers (fixed latent server sea/bounds bug, unified empty-cell movement, first-wins `buildCellGrid`). Lab report: `lab-reports/lab-report-terrain-field-mover-redesign.md`. |
| **§WALK-3 / §WALK-4** | 2026-06-26 | §WALK-3 recast reweave as read-only `GET /api/graph/reachability` (land-flood 409/409, 1 component), 410'd the graph mutators, deleted the 3,240-line dead `reweave-all` body + `reweave` CLI. §WALK-4 added the CI-gated invariant suite (`scripts/check-invariants.js` I1/I2/I3 + structural/behavioural mover parity via `npm run check:walk`; `.github/workflows/walk-invariants.yml`) and rebuilt the Playwright nav tests — **caught + fixed 3 latent bugs on `main`:** orphaned `junction` WORLD_DB terrain, VBY `'bar (Visby)'`→`'bar'` terrain key, and a P0 `_enterEmptyCell` crash (wrote to non-existent `#story-content`; restored the §UNIFY-01 `_renderNodeShell` shell). Lab report: `lab-reports/lab-report-terrain-field-mover-redesign.md` §6. |
| **§WALK-5 (Inc 1–4) + FU ✅ COMPLETE** | 2026-06-26 | MUD multi-client harness — **all 4 increments + §WALK-5-FU done; §WALK series FULLY CLOSED.** Lab report locks instanced per-session encounters, per-session seeded RNG, K-client no-bleed proof; reconciles the parent §7 sketch with current code (no `huntMode`; 409 block path; encounter at `s.encounter` not `s.state`); ferry deferred → §WALK-5-FU; flat tier weights (no server notoriety). **Inc 1** wired `terrainAt`/`encounterRate`/`getSeaLanes()` into `getMoverWorld()` + `scripts/check-terrain-parity.js` in `check:walk` (server↔client parity, 10440/10440 band cells). **Inc 2** added per-session RNG + the instanced encounter roll on `session/move` (`s.encounter`, surfaced on move response + `who`; flat base-tier weights); verified live determinism + per-seed divergence. **Inc 3** built `tests/mud-harness.mjs` (`npm run test:mud`) — HTTP+SSE K-client driver (co-presence + instancing/no-bleed + who/look); caught + fixed a `session/say` double-send bug. **Inc 4** added the idle-TTL-prune assertion (2nd server with `SESSION_TTL_MS` env override, prod-inert; selective prune of an idle session + its SSE) → harness **24/24**, and wired it into CI as a separate **`mud` job** (`npm ci` + `test:mud`). **§WALK-5-FU ✅** resolved the ferry hook by **deleting** the inert kernel `ferryEdges` branch (SEA_LANES land-bridges already carry every crossing; no `FERRY_EDGES` data needed) — both MOVER:CORE copies kept byte-identical. No open §WALK items remain. Lab report: `lab-reports/lab-report-walk5-mud-harness.md`. |
| **§DATA-01 Quest Data–Code Separation** | 2026-06-16 → ⚠️ REVERTED (found 2026-06-27) → ✅ **RESOLVED 2026-07-06 (superseded by §ARCH-01 UQF)** | The 2026-06-16 change was lost to a snapshot rollback (`QUEST_EFFECTS`/`QUEST_HOOKS`/`applyQuestEffects`/`DFL` all grepped to 0). **Closed 2026-07-06 by user decision: superseded, not restored** — §ARCH-01 UQF achieved the same data/code separation by a better route (all ~2,700 quests declarative UQF-1.0; `onPass`/`onFail` are `[{kind:…}]` descriptor arrays with **zero functions**; QuestRuntime sole execution surface). Restoring QUEST_EFFECTS/QUEST_HOOKS would have created a second, competing effects system. ZRH duplicate re-fixed 2026-06-27 as `DNF` at `(17,171)` (supersedes old `DFL`). The one real residual — journal renderer concatenating `q.title/desc/hint` into `innerHTML` — **shipped 2026-07-06** as textContent DOM building (`storyRenderQuests`). One state-conditional `passText:()` remains by design (Codex finale). Lab report: `lab-reports/lab-report-quest-data-code-separation.md` (historical design record) |

### Planned Features

| Item | Description |
|------|-------------|
| **§WORLDBUILDER-01** | Canvas node map editor — click node to edit, click empty cell to create, bidirectional exit wiring, collision detection. Depends on §WORLDBUILDER-02 Ph1 ✅ |
| **§1367** | Historical year 1367 AD integration — `GAME_YEAR=1367`, plague mechanic, Hanseatic faction score, faith triple-track (orthodox/reform/folk), 4 new Baltic nodes (LB/DZ/RG/BG), 6 arc seeds, historical NPCs. Full spec in `docs/notes/Year1367AD.md`. |
| **§EDITOR-02-FU** | ✅ COMPLETE — branching arcs + drag-reorder shipped 2026-06-27; whole-arc UQF export shipped 2026-07-03 with §EDITOR-03 (§ARCH-01 W8b). Archived: plan-archive.md §"Archived 2026-07-06". |
| **§NAV-01** | Navigable World: MUD-coherent map + fungal road net — **✅ COMPLETE 2026-07-03 (Inc a–h)**: pos-origin BFS (geo bounds + wrap), `ROAD_RUNS` net (400 cells / 88 junctions, encounter rate 0, `check:roads` R1–R4), `describeCell` room layer (ROOMS:CORE `rooms.js`, deterministic prose + signposts), road-weighted auto-travel (`_roadGridPath` + `_travelTick`, 4 interrupt classes), wayfinding UI (exits signage, waypoint ★, `(n steps, NE)`), map suite + GLOBE panel, Inc f MUD server room parity (`room` on all four look surfaces, byte-equal to client, mud-harness [M]), Inc g worldbuilder drag-&-lock cities (`PUT /api/coords`, 🔒 → `roads-pins.json`), Inc h road-net editor (chain-link overlay, pin drag, ✚/┬/🔗/🗑 palette, ♻ Reweave Net = `PUT /api/roads` with auto-rollback). Gates at close: walk suite 89/89 · check:walk 6/6 · mud-harness 119. Lab report: `lab-reports/lab-report-nav01-navigable-world.md` · archive: plan-archive.md §2026-07-03. |
| **§MESH-01** | Multiuser MUD — **core ✅ SHIPPED** (client presence, gossip/PEX mesh + `worldHash` scoping, tracker + federation, world download/diff, Mesh tab; archived 2026-07-03) · **gameplay ladder (f) buffs ✅ · (g) hireling ✅ · (h) sentry bots ✅ · (i) no-dupe ledger ✅ COMPLETE 2026-07-06 (all rungs)** (durable hash chains `ledger/<origin>.jsonl`, mint + two-phase trade + pure lowest-hash dupe-void resolver; durable playerKey identity + cross-mesh gossip replication; client mint-stamping + ⇄ trade UI; **cross-ORIGIN co-signed trades** via `POST /api/trade/relay`, proposer's origin authors the one dual-sig event — mud-harness [I]/[I2]/[I3] 202 + `mesh-ledger-client.test.js` 8 incl. a two-server cross-origin E2E). · **(j) consensual PvP duels ✅ 2026-07-06** (`duel.js` DUEL:CORE kernel + `check:duelparity`, commit-reveal `duel/challenge|accept|reveal`, dual-chain `kind:'duel'` events, ⚔ client UI with verified replay, `S_story.pvpOff` opt-out, forfeit-on-walk-off never blocks a step — mud-harness [O] 22 + `mesh-duel-client.test.js` 5 incl. two-browser E2E). **THE LADDER (f–j) IS COMPLETE.** See BACKLOG.md §Multiplayer + plan-archive.md. |
| **§MESH-02** | Map-Tab Connection Center — multiplayer menus as Map-sheet sub-tabs (🗺 Map · 🌐 Connect · 🔭 Discover · 🛡 Lists). **(a) ACL/blocklist endpoints ✅ · (b) sub-tab shell ✅ · (c) Connect pane ✅ · (d) Discover pane (local scan D6, find, list sources, D4 whitelist gating) ✅ · (e) Lists pane (client black/whitelist, server ACL editor, D2/D3 peer-blocklist preview→explicit merge) ✅ · (f) committed tests ✅ 2026-07-07 (mud-harness [R] + hermetic `mesh-connections-ui.test.js` 8) · (h) 💬 multi-user chat history ✅ · (i) runtime `POST /api/mesh/connect` ✅ · (j) 👣 footprints ✅** — (g) docs/CLI closes it. CLI: `./api.sh mesh acl\|blocklist\|connect`. Design: `lab-reports/lab-report-mesh02-connections-ui.md`; player view: `mechanics.md §Multiplayer` "Connection center"; operator view: `docs/notes/docs-node-network.md §12` + `docs/api/wbapi-help.md §Mesh API`. |

### Version Snapshots

| Location | Contents |
|----------|---------|
| `milepoints/` | Curated milestone builds (e.g., `roll2hit-v3-20260602-174751.html`) |
| `roll2hit-v3-*.html` (root) | Session-level timestamped snapshots — ~25 files, May 29 – Jun 2 2026 |

### 1367-Sources

All 54 source books are marked `[x]` in `books.md` — all have been processed through at least one full cycle (Three-Pass Summary + 5-act vignette + UQF JSON stub + admin updates to quest-map.md, books.md, plan.md).

**Processing pipeline** (defined in `books.md` directive + `plan.md` protocol):
- **Pass 1–3:** Full-telling summary → character/tone → elaborated scene
- **5-act vignette play:** French noir register, Token doctrine (ACCEPT → CARRY → RETURN → RECORD)
- **Quest API stub:** UQF v1.0 JSON, skill checks (DC 12+), fail text, grant/takeItem
- **Pass 4:** Source text content summaries appended per part file (separate from literary analysis)

**Books with outstanding supplementary cycle seeds** (seeds written, full vignette treatment pending):
- `LIL` — Froissart/Berners: LIL-S02–S07 (6 seeds)
- `BGW` — Arabian Nights/Burton: BGW-S09–S14 (6 seeds)
- `CAI` — Arabian Nights/Lang: CAI-S09–S14 (6 seeds)
- `BEY` — Mandeville (supplementary): BEY-S09–S14 (6 seeds)
- `KYA` — Shah-Nameh: KYA-02–25 seeds written (24 pending full spec)
- `ADA` — Ramayana: ADA-02–48 seeds written (47 pending full spec)

| File | Purpose |
|------|---------|
| `1367-sources/books.md` | Master index of all 54 source texts — codes, titles, KB sizes, [x] status, region groupings, processing notes; Token Doctrine and City Travel Log |
| `1367-sources/plan.md` | Pipeline tracker — outstanding seeds per book, Processing Protocol (single-part, multi-part, Pass 4), continuation entry format |
| `1367-sources/quest-map.md` | City-to-source mapping — which source feeds which in-game node; Theme Threads Active (theme-uniqueness guard) |
| `1367-sources/lab-report-agentic-pipeline.txt` | Agentic pipeline design notes for source-text processing |
| `1367-sources/split-sources.js` / `.sh` | Utilities to chunk large source `.txt` files into 200 KB `partN` segments |
| **Source `.md` files** | One per book — Three-Pass Summary + vignette cycles + quest seeds. See `books.md` for full list |
| **Source `.part*.txt` files** | Pre-split 200 KB chunks of source texts — input to the processing pipeline |

---

## Lab Report Index (All 78 Reports)

> Six historical reports moved to `archive/` (plan-cleanup v13/v17/world-builder-arc, timeline-history, api-01-02 review, loot-drop-weapon-economy) — rows below point there.

### Synthesis (Multi-Part Cross-Reference)

| File | Parts | Coverage |
|------|-------|----------|
| `lab-reports/lab-report-synthesis-part1-architecture.md` | Part 1 of 7 | All 12 Architecture & Systems reports cross-referenced against live HTML — current line numbers, active/superseded status, what still applies |
| `lab-reports/lab-report-synthesis-part2-combat-mechanics.md` | Part 2 of 7 | All 7 Combat & Mechanics reports — loot channels, 1.5 AP economy, Cooperative DM Principle, Luck stat, tattoo/chronicle persistence |
| `lab-reports/lab-report-synthesis-part3-world-navigation.md` | Part 3 of 7 | All 13 World & Navigation reports — §CELL model, BFS, MegaReWeave, Epic Battlegrounds, arc templates (§SPARK/§WHODUNIT/§ALCHEMY) |
| `lab-reports/lab-report-synthesis-part4-monsters-fishing.md` | Part 4 of 7 | Both Fishing reports — 2d20 superseded by Catch/Type/Size system; BAIT_TABLES vs planned BAIT_FISH_POOL; Luck live at 7 roll points; LAKE_MAGIC_DB; night fishing; Emmer arc; tournament chain |
| `lab-reports/lab-report-synthesis-part5-npc-narrative.md` | Part 5 of 7 | All 8 NPC & Narrative reports — NPC_DIALOGUES/BIRKA_NPC_PROFILES dual-structure; Corelli arc; living world; Brynn/Bruhns/Yael companion scenes; La Riva AMS node; romance layer; vignette principle; kindness calculus templates |
| `lab-reports/lab-report-synthesis-part6-quest-arcs.md` | Part 6 of 7 | All 14 Quest Arc reports — Cat Quarter CDG; Weimar NUE; _rollCeremonia universal resolver; §XVI→§XVII→Quest-1→Entry 42 deep-lore chain; Littoral Courts/Crown arc; endings live; P3+ dungeon themes implemented |
| `lab-reports/lab-report-synthesis-part7-writing-design-philosophy.md` | Part 7 of 7 ✅ | All 8 Writing & Design Philosophy reports — Curse of Knowledge architecture; Pinker writing standard; Void Shaman at GVA not MT; 5thOrgan.html live; Birka wounds visible in dearFriend arcs; methodology loop; 64-report series complete |

### Architecture & Systems

| File | Layer(s) | Topic |
|------|---------|-------|
| `lab-reports/lab-report-architecture-full.md` | 0–45 | Complete IEEE function catalog — every function, all subsystems, flow charts |
| `lab-reports/lab-report-documentation-system-design.md` | — | Two-way sync architecture, plan.md purpose, task decomposition framework |
| `lab-reports/lab-report-sp4-documentation-sync-pass.md` | SP4 | SP4 sync pass — 20 PLANNED markers, 67 annotations, F4/F6 re-verification, FC01–FC08 archive |
| `archive/lab-report-api-01-02-mechanics-combat-review.md` | §API-01+02 | IEEE API review: mechanics.md (36 points) + docs/spec/combat.md F6 drift (+163 to +3,115 lines) |
| `archive/lab-report-plan-cleanup-world-builder-arc.md` | 48–77 | plan.md archaeology + arc from dice tracker to world builder |
| `archive/lab-report-timeline-history-completed.md` | 0–45 | Complete layer-by-layer development timeline archive |
| `lab-reports/lab-report-prompt-migration-arena-to-prototype.md` | 0–13 | Arena → Prototype: specification gravity, Cooperative DM Principle |
| `lab-reports/lab-report-wbapi.md` | WBAPI | World Builder API first-pass design — buffer model, extractObj pipeline, port 1367 |
| `lab-reports/lab-report-wbapi-architecture.md` | WBAPI | WBAPI internal architecture — Proxy model, comment-aware brace counting, single-file source of truth |
| `lab-reports/lab-report-wbapi-evolution.md` | WBAPI | Evolution from grep to WBAPI — world data access history, design decisions, tradeoffs |
| `lab-reports/lab-report-quest-api-architecture.md` | §ARCH-01 | Quest API & Universal Mission Format — UQF v1.0 schema, Mission Bit Registry, QuestRuntime design |
| `lab-reports/lab-report-quest-data-code-separation.md` | §DATA-01 (✅ RESOLVED 2026-07-06 — superseded by §ARCH-01 UQF) | Data–code boundary enforcement: QUEST_EFFECTS declarative DSL, QUEST_HOOKS named engine, applyQuestEffects dispatch; storyShowNpc quoteFn fix; DFL node rename; innerHTML→textContent; passText function removal. Never re-shipped after a snapshot rollback; **closed as superseded** — UQF delivered the separation goal (declarative `onPass`/`onFail` descriptors, QuestRuntime); the innerHTML→textContent journal residual shipped 2026-07-06. Historical design record, not a restore spec. |
| `lab-reports/lab-report-uqf-migration-playbook.md` | §ARCH-01 Ph3 | UQF bulk-migration playbook — wave-by-wave history, golden-capture parity protocol, §SKILLFIX-01/-02 gotchas, `scripts/uqf-bulk-migrate.js` usage |
| `lab-reports/lab-report-wbapi01-ph3-array-patch.md` | §WBAPI-01 Ph3 | Structured-field PATCH — source-level array/object literal patching (`editStructuredField`/`patchLiteralField`/`serializeJsLiteral`) |
| `lab-reports/lab-report-editor01d-itemchain.md` | §EDITOR-01-D | Declarative `itemChain` quest field — grant/take/grantBit/takeBit grammar, `_applyItemChain` runtime, pipe codec |
| `lab-reports/lab-report-editor01d-fu-chain-ui.md` | §EDITOR-01-D-FU(a) | Visual itemChain editor widget (`buildChainEditor`) — Quest Creator + CRUD form wiring |
| `lab-reports/lab-report-editor01d-fu-b-ladder-migration.md` | §EDITOR-01-D-FU(b) | Reward-ladder → itemChain migration — 61-branch classification, manifest-driven parity guard, silent grants |
| `lab-reports/lab-report-editor02-mission-builder.md` | §EDITOR-02 | Mission Builder tab — arc compiler (`buildArcQuests`), chain preview, sequential POST All |
| `lab-reports/lab-report-mesh-multiuser.md` | §MESH-01 (core + f/g/h + (i) ledger ✅ COMPLETE) | Multiuser MUD — presence, gossip/PEX mesh + `worldHash` scoping, tracker + magnets, gameplay ladder (f)–(j); §6 data shapes for the (i) no-dupe ledger + (j) `DUEL:CORE` duels; §4 increment table tracks ship status |
| `lab-reports/lab-report-mesh02-connections-ui.md` | §MESH-02 | Map-Tab Connection Center — design + locked decisions (D2 blocklists share-OUT only · D3 sharing opt-in · D4 whitelist-gated auto-fetch · D6 localhost probe scan · D7 display-layer only); §3.1 ACL/blocklist endpoint shapes; pane specs for Connect/Discover/Lists |
| `lab-reports/lab-report-math01-completions.md` | §MATH-01 | Mathematical World completions — audit findings (first-visit `node.loot` pickup pre-existed; EHZ/MONS/ZERO were unreachable sub-locations of JRS's cell), HKG-pocket placement, UQF `itemsAll`+`atNode` shapes + gold chains, D2 rejection of the "carry 3 documents" access gate (Free-Movement), test-pin inventory |

### Combat & Mechanics

| File | Layer(s) | Topic |
|------|---------|-------|
| `lab-reports/lab-report-leveling-flashbang-condition-economy.md` | 18 | Level-up system, Flashbang, CONDITION_GOLD ×100, 0.5-action bonus phase |
| `lab-reports/lab-report-drop-rates-balance-and-health.md` | 12 | `reward = floor(0.1 × AC × maxHP)`, health economy, Cooperative DM Principle |
| `archive/lab-report-loot-drop-weapon-economy.md` | 25 | Historical proposal — superseded by `_D100_TABLE`. Read for design context. |
| `lab-reports/lab-report-loot-drop-system-v2.md` | 25+ | Loot drop system redesign and API formalization — `_D100_TABLE`, monster-specific drops, vendor economy |
| `lab-reports/lab-report-luck-seventh-stat.md` | 48 | §XIII Luck as seventh stat — d20 roll modifier, stat interaction |
| `lab-reports/lab-report-tattoo-progression-system.md` | 76 | §XLI Tattoo progression — character creation modal, HP tattoos, death persistence |
| `lab-reports/lab-report-kenickie-chronicle.md` | 75+77 | §XL Kenickie's black market + §XLII Chronicle System (careerStats/runStats) |

### World & Navigation

| File | Layer(s) | Topic |
|------|---------|-------|
| `lab-reports/lab-report-nav01-navigable-world.md` | §NAV-01 | Navigable World close-out — diagnosis (median 33 blind steps), L0–L8 layer stack, ROAD_RUNS fungal net, ROOMS:CORE kernel, auto-travel, MUD room parity, worldbuilder road-net editor, increment record a–h |
| `lab-reports/lab-report-movement-by-cells.md` | §CELL-01–§CELL-12 | Cell-grid navigation architecture — full program flow, wbapi-server/worldmap/runtime layers, BFS reachability, Playwright + Node test suite spec |
| `lab-reports/lab-report-cell-map-mud-redesign.md` | §CELL-01–§CELL-11 | Cell map redesign — 11-section grid migration, MUD session layer, 419 nodes, dead-code removal |
| `lab-reports/lab-report-map-audit-layout-tooling.md` | §CELL | Map audit, grid layout solver, tooling infrastructure — coordinate audit, gap analysis, reachability |
| `lab-reports/lab-report-node-network-reconnection.md` | §CELL | Full node network reconnection — stray relocation, bidirectional check, reachability recovery |
| `lab-reports/lab-report-junction-reweave-overhaul.md` | §CELL | Junction reduction & reweave overhaul — boilerplate purge, coordinate mesh redesign |
| `lab-reports/lab-report-mega-reweave.md` | §CELL | MegaReWeave procedure & configuration — batch coordinate migration, world mesh construction |
| `lab-reports/lab-report-highway-mesh-entry.md` | §CELL | Highway mesh-entry selection & same-component skip — connected-component BFS, entry-point algorithm |
| `lab-reports/lab-report-walk15fu-grid-resolution.md` | §WALK-1.5-FU(c) | Grid-resolution analysis — 0.25° REJECTED (doesn't fix anchor-chained piles; 16× cells, 4× steps); de-pile at 1° instead |
| `lab-reports/lab-report-world-structure-critique.md` | — | World structure critique — geographic architecture, node density, IATA anchor system |
| `archive/lab-report-plan-cleanup-v13.md` | 9–13 | Spec archive Layers 9–13 — corridor, hunt, stalk, quest engine |
| `archive/lab-report-plan-cleanup-v17.md` | 14–17 | Spec archive Layers 14–17 — conditions, shield, flee, 6 bug corrections |
| `lab-reports/lab-report-circuit-map-theory.md` | 9 | CS theory: sparse node mesh, junction concept, TSP framing, Hunt/Warp traces |
| `lab-reports/lab-report-battleground-circuit-path-quest.md` | 9–12 | Stalk mechanics, quest-coupled guaranteed encounters, XP methodology |
| `lab-reports/lab-report-epic-battlegrounds.md` | 39 | §0 20 EB dead-end nodes, `EB_NPC_DIALOGUE`, payment negotiation, return beats |
| `lab-reports/lab-report-naval-campaign-layer.md` | — | Naval Campaign Layer — ports, intercepts, hunts, Harmony Chain at sea (design spec) |

### Monsters & Fishing

| File | Layer(s) | Topic |
|------|---------|-------|
| `lab-reports/lab-report-fish-with-dnd.md` | 37 | Yugurt Lake — 20 rank fish, 2d20 cast roll, predator-as-combat design |
| `lab-reports/lab-report-fishing-bait-prompting.md` | 47 | §XII Fishing bait sub-system design — 5 bait tiers, biome zones, Luck integration |

### NPC & Narrative

| File | Layer(s) | Topic |
|------|---------|-------|
| `lab-reports/lab-report-birka-beginner-arc.md` | 41 | Birka Six NPCs, 7 quests, Rough Whiskey, Yael escort, pit fight |
| `lab-reports/lab-report-npc-dialogue-system.md` | 42 | 4-state dialogue system, `NPC_DIALOGUES` (6×4×5), `_missionComplete()` |
| `lab-reports/lab-report-npc-speak-sdk.md` | — | Dynamic NPC speech via LLM API — lightweight character instantiation, voice consistency, first-person vignette register |
| `lab-reports/lab-report-friendships-with-magic.md` | 41–42 | Session postmortem — waypoint BFS highlight, Hunt Mode, EB negotiation |
| `lab-reports/lab-report-living-world.md` | 44 | World progression events, Gigault stall, NPC farewells, Act III desaturation |
| `lab-reports/lab-report-web-of-connections.md` | 45 | `FROBERGER_TRACES`, `NPC_CROSS_REFS` (17), Room 6, Yael patrol, cross-item triggers |
| `lab-reports/lab-report-ally-cat.md` | 44 | §IX Cat Quarter — 6-quest arc, Ally Cat hierarchy, Kenickie unlock |
| `lab-reports/lab-report-narrative-arcs-brynn-bruhns-yael.md` | 70+72+74 | §XXXV Brynn's Vigil + §XXXVII Bruhns CO scene + §XXXIX Yael Named Report |

### Quest Arcs

| File | Layer(s) | Topic |
|------|---------|-------|
| `lab-reports/lab-report-game-story-codex-of-conquest.md` | 40 | `FROBERGER_JOURNAL` (41 entries), curse arc, Pinker's Curse of Knowledge |
| `lab-reports/lab-report-endings-and-echoes.md` | 43 | Covenant ending system, curse score formula, epilogue scroll, NG+ state |
| `lab-reports/lab-report-ng-plus-remembrance.md` | 50 | §XV Entry 42, NPC_NG_MEMORY_LINES, quest_ng_01/02/03, priorQuestMinusOne |
| `lab-reports/lab-report-weimar-scholar-gate.md` | 51 | §XVI Scholar Gate — archive modal, tome items, Benedikt reading circle, First Researcher |
| `lab-reports/lab-report-void-archaeology.md` | 52 | §XVII Void Archaeology — 5 investigation sites, Constructor's Log, 4-author chain |
| `lab-reports/lab-report-tilbury-visby-arcs.md` | 54+55 | §XIX Tilbury Harbor + §XX Visby Underground — Rennau, Solvak, hollow_hands_guard |
| `lab-reports/lab-report-void-shaman.md` | 56 | §XXI Void Shaman "The Warden" — dual resolution, verb-tense mandate corruption |
| `lab-reports/lab-report-corelli-merchant.md` | 61 | §XXVI Corelli — 5-appearance wandering merchant, purchase-gated fav, last_cipher |
| `lab-reports/lab-report-quest-minus-one-world-creator.md` | 49 | §XIV Quest -1 — Level 21 undefined as invitation, World Creator Wizard |
| `lab-reports/lab-report-ceremonia-roll-skill-checks.md` | 79 | §DESIGN-03 Ceremonia Roll — `skill_check` quest type, `_rollCeremonia()`, Yael 5-act arc |
| `lab-reports/lab-report-dungeon-ten-themes.md` | 80 | §DUNGEON-01 — 10 dungeon themes, P1–P3+ tiers, Node MM, Tribble counter, Madness Table, voidFluxActive, Prior Carrier, Codex Core ending compat |
| `lab-reports/lab-report-la-riva-grief-arc.md` | 78 | §GR Grief Arc — La Riva / Fishmonger's Row, Connie/Aldo/Vinnie, corruption-grief chain, distributed grief subplot map |
| `lab-reports/lab-report-littoral-courts.md` | 104 | §SIREN-01 Littoral Courts — four manipulative words, betrayal mechanic, Overseer parallel quest, French vignette register, non-obvious decisions |
| `lab-reports/lab-report-crown-three-hags.md` | §CROWN-01 | The Three Crowns of the Swamp — hag encounter arc design |

### Writing & Design Philosophy

| File | Topic |
|------|-------|
| `lab-reports/lab-report-story-codoex-curse-of-knowedge.md` | Pinker framework — writing guide for terrain descriptions and NPC dialogue |
| `lab-reports/lab-report-Polyphonic-Organ-Synth.md` | `5thOrgan.html` — IIR biquad filter, ADSR, Beethoven canon construction, Web Audio API |
| `lab-reports/lab-report-ponies-unicorns-aspirations-future-ideas.md` | Future aspirations — DM's Companion Guide, Fishing Guide, Mission Explorer |
| `lab-reports/lab-report-meta-process-loop-expansion.md` | Meta-process — prompt→plan→lab-report recursive loop, 10 historical instances, session efficiency |
| `lab-reports/lab-report-meta-corpus-analysis.md` | The corpus as architecture — meta-analysis of the lab-report corpus and its structural relationship to the game file |
| `lab-reports/lab-report-saul-paul-travel-reference.md` | §FUTURE-01 source — 37-node Paul arc itinerary, Acts 7–28 + Pauline letters, NPC list, lodging, speeches |
| `lab-reports/lab-report-saul-paul-vignette-spec.md` | §FUTURE-01 vignette — 14 node texts, 9 quest descriptions, 7 NPC voice lines, 8 voice rules, object inventory, thorn mechanic |
| `lab-reports/lab-report-kindness-calculus.md` | Prosocial mechanics — asymptotic kindness in quest graphs, token automata, the probabilistic case against combat |
| `lab-reports/lab-report-wisdom-arc.md` | Wisdom Arc — Robert Greene's Laws of Human Nature as quest mechanics, WIS progression design |

---

## Reverse Lookup — Keywords to Files

> Find any topic and the files that elaborate it. Every file has at least one inbound reference.

| Keyword / Topic | Primary File | Elaboration |
|----------------|-------------|-------------|
| **Action economy (1.5 AP)** | `docs/mechanics/mechanics-combat.md` | `archive/lab-report-plan-cleanup-v17.md` |
| **Ability scores** | `docs/mechanics/mechanics-combat.md` | `index.md` |
| **ASI table (d6)** | `docs/mechanics/mechanics-combat.md` | `index.md` |
| **Antecedent / cage** | `docs/story/story-arc-investigation.md` | `lab-reports/lab-report-void-archaeology.md` · `lab-reports/lab-report-void-shaman.md` |
| **Archive modal (Weimar)** | `docs/story/story-arc-investigation.md` | `lab-reports/lab-report-weimar-scholar-gate.md` |
| **Benedikt Rasp** | `docs/story/story-arc-investigation.md` | `lab-reports/lab-report-weimar-scholar-gate.md` · `lab-reports/lab-report-void-archaeology.md` |
| **Betrayal mechanic (thought/word/deed)** | `story.md Layer 104b` | `lab-reports/lab-report-littoral-courts.md` · `world.md §SIREN-01` |
| **Battle Mode engine** | `docs/spec/combat.md` | `lab-reports/lab-report-architecture-full.md` · `docs/spec/spec-combat.md` |
| **BFS pathfinding** | `maps.md` | `lab-reports/lab-report-circuit-map-theory.md` · `lab-reports/lab-report-battleground-circuit-path-quest.md` |
| **Birka Six NPCs** | `world.md` | `lab-reports/lab-report-birka-beginner-arc.md` · `docs/story/story-arc-npc-dialogues.md` |
| **Brynn Clerambault** | `docs/story/story-arc-npc-dialogues.md` | `lab-reports/lab-report-narrative-arcs-brynn-bruhns-yael.md` · `lab-reports/lab-report-living-world.md` |
| **Bruhns CO scene** | `story.md` | `lab-reports/lab-report-narrative-arcs-brynn-bruhns-yael.md` |
| **Career/run stats (Chronicle)** | `lab-reports/lab-report-kenickie-chronicle.md` | `index.md (careerStats/runStats)` |
| **Cat Quarter / Ally Cat** | `story.md` | `lab-reports/lab-report-ally-cat.md` |
| **Codex Shards (7)** | `story.md` | `lab-reports/lab-report-game-story-codex-of-conquest.md` |
| **Conditions / CONDITION_GOLD** | `docs/mechanics/mechanics-combat.md` | `docs/spec/combat.md` · `lab-reports/lab-report-leveling-flashbang-condition-economy.md` |
| **Constructor's Log** | `docs/story/story-arc-investigation.md` | `lab-reports/lab-report-void-archaeology.md` · `lab-reports/lab-report-void-shaman.md` |
| **Cooperative DM Principle** | `lab-reports/lab-report-drop-rates-balance-and-health.md` | `lab-reports/lab-report-prompt-migration-arena-to-prototype.md` |
| **Corelli merchant** | `story.md §XXVI stub` | `lab-reports/lab-report-corelli-merchant.md` · `docs/story/story-arc-coastal.md` |
| **Corinth / Korath (KR)** | `story.md Layer 104a` | `lab-reports/lab-report-saul-paul-travel-reference.md` |
| **Cell movement system (§CELL-01–§CELL-11)** | `docs/notes/docs-node-network.md` | `docs/spec/spec-corridors.md` (archived) · `lab-reports/lab-report-cell-map-mud-redesign.md` · `lab-reports/lab-report-circuit-map-theory.md` |
| **Curse score / Covenant Standing** | `story.md` | `lab-reports/lab-report-endings-and-echoes.md` · `lab-reports/lab-report-architecture-full.md` |
| **Daggers (offhand)** | `docs/mechanics/mechanics-combat.md` | `index.md` |
| **Death saves** | `docs/spec/combat.md` | `archive/lab-report-plan-cleanup-v17.md` |
| **defi_land cluster (DF/HM/GL)** | `maps.md` · `world.md` | `docs/story/story-flowchart.md` |
| **Drop rates / reward formula** | `docs/mechanics/mechanics-combat.md` | `lab-reports/lab-report-drop-rates-balance-and-health.md` |
| **Entry 42** | `docs/story/story-arc-ngplus.md` | `lab-reports/lab-report-ng-plus-remembrance.md` · `lab-reports/lab-report-void-archaeology.md` |
| **Epic Battlegrounds** | `docs/story/story-arc-epic-battlegrounds.md` | `lab-reports/lab-report-epic-battlegrounds.md` · `docs/story/story-flowchart.md` |
| **Endings / epilogue** | `story.md` | `lab-reports/lab-report-endings-and-echoes.md` |
| **Fighter Champion features** | `docs/mechanics/mechanics-combat.md` | `index.md (FIGHTER_FEATURES)` |
| **First Researcher (Marta Eilene Vass)** | `docs/story/story-arc-investigation.md` | `lab-reports/lab-report-weimar-scholar-gate.md` · `lab-reports/lab-report-void-archaeology.md` |
| **Fishing / Yugurt Lake** | `monsters.md` | `lab-reports/lab-report-fish-with-dnd.md` · `lab-reports/lab-report-fishing-bait-prompting.md` · `maps.md` |
| **Fishing Buddy / Emmer Finch (§GUIDE-01)** | `plan-archive.md §GUIDE-01` | `lab-reports/lab-report-fish-with-dnd.md` · `plan-archive.md §XLV` |
| **Four Stages of Competence / Self-Discovery arc** | `plan-archive.md §GUIDE-01` | `plan-archive.md §WISDOM-01` · `plan-archive.md §ALCHEMY-01` |
| **Rod of Self-Discovery** | `plan-archive.md §GUIDE-01-F` | `plan-archive.md §XLV` (tournament wiring) |
| **Scar into a Star / §SCAR-01** | `plan-archive.md §SCAR-01` | `lab-reports/lab-report-weimar-scholar-gate.md` · `plan-archive.md §XVI` |
| **Gret Orrens (Philosopher NPC)** | `plan-archive.md §SCAR-01-C` | `plan-archive.md §SCAR-01` |
| **The Scar's Light (passive amulet)** | `plan-archive.md §SCAR-01-G` | `plan-archive.md §SCAR-01-F` (wound_badge mechanic) |
| **Pier Falk (BQ — trapped person)** | `plan-archive.md §SCAR-01-D` | `plan-archive.md §SCAR-01` |
| **Froberger journal (41 entries)** | `froberger-journal-all-entries.txt` | `lab-reports/lab-report-game-story-codex-of-conquest.md` · `story.md §PROLOGUE` |
| **Froberger traces** | `world.md` | `lab-reports/lab-report-web-of-connections.md` |
| **Gate locks** *(removed — Free-Movement Policy; `GATE_LOCKS` = 0 in code, verified 2026-07-03)* | `maps.md §GATE LOCKS (removal notice)` | `CONTRIBUTING.md (Free-Movement / Mission-Gating Policy)` |
| **Hollow Hands sub-clan** | `docs/story/story-arc-coastal.md` | `lab-reports/lab-report-tilbury-visby-arcs.md` · `lab-reports/lab-report-void-shaman.md` |
| **Hunt Mode / stalk** *(retired §TIMELESS-01)* | `docs/mechanics/mechanics-combat.md §Stalk / Hunt (retired)` | `lab-reports/lab-report-timeless-movement-hunt-removal.md` · `lab-reports/lab-report-battleground-circuit-path-quest.md` |
| **Inn Dreams** | `story.md §XXIII stub` | `lab-reports/lab-report-void-archaeology.md §H` |
| **Investigation chain arc** | `docs/story/story-arc-investigation.md` | `docs/story/story-flowchart.md` |
| **Isolde Voss (Archivist)** | `docs/story/story-arc-investigation.md` | `lab-reports/lab-report-weimar-scholar-gate.md` |
| **Kenickie's market** | `lab-reports/lab-report-kenickie-chronicle.md` | `lab-reports/lab-report-ally-cat.md` |
| **Lab report policy** | `index.md` · `CONTRIBUTING.md` | `lab-reports/lab-report-documentation-system-design.md` |
| **Littoral Courts (§SIREN-01)** | `story.md Layer 104b` · `world.md` | `lab-reports/lab-report-littoral-courts.md` · `maps.md §SIREN-01` |
| **Level-up system** | `docs/mechanics/mechanics-combat.md` | `lab-reports/lab-report-leveling-flashbang-condition-economy.md` · `lab-reports/lab-report-architecture-full.md` |
| **Luck stat** | `docs/mechanics/mechanics-combat.md` | `lab-reports/lab-report-luck-seventh-stat.md` · `lab-reports/lab-report-fishing-bait-prompting.md` |
| **MIT License / Quest -1** | `story.md §XIV` | `lab-reports/lab-report-quest-minus-one-world-creator.md` |
| **Monster pool (370)** | `monsters.md` | `index.md (MONSTER_POOL)` · `docs/spec/spec-world.md` |
| **Mordus (Warlord)** | `story.md` · `world.md` | `lab-reports/lab-report-tilbury-visby-arcs.md` |
| **Multiplayer mesh (§MESH-01 · §MESH-02 connection center)** | `mechanics.md §Multiplayer` · `docs/notes/docs-node-network.md §12` | `lab-reports/lab-report-mesh-multiuser.md` · `lab-reports/lab-report-mesh-sync-architecture.md` · `lab-reports/lab-report-mesh02-connections-ui.md` · `maps.md §Multiplayer` · `docs/api/wbapi-help.md §Mesh API` |
| **Navigable world — roads, rooms, auto-travel (§NAV-01)** | `docs/notes/docs-node-network.md §13` · `maps.md §ROAD NET & ROOM LAYER` | `lab-reports/lab-report-nav01-navigable-world.md` · `mechanics.md §Roads, Rooms & Auto-Travel` · `docs/api/wbapi-help.md` (roads/pins endpoints) · `rooms.js` · `scripts/build-roads.js` |
| **MT Mountain Pass** | `maps.md` · `docs/story/story-flowchart.md` | `docs/story/story-arc-investigation.md` (§XVII + §XXI intersection) |
| **NPC cross-references** | `world.md` | `lab-reports/lab-report-web-of-connections.md` |
| **NPC dialogue system** | `docs/story/story-arc-npc-dialogues.md` | `lab-reports/lab-report-npc-dialogue-system.md` · `lab-reports/lab-report-birka-beginner-arc.md` |
| **NPC favorability** | `world.md` | `lab-reports/lab-report-birka-beginner-arc.md` · `index.md` |
| **NG+ system** | `docs/story/story-arc-ngplus.md` | `lab-reports/lab-report-ng-plus-remembrance.md` · `lab-reports/lab-report-endings-and-echoes.md` |
| **Cell map (418 nodes)** | `maps.md` | `index.md (NODE_MAP · NODE_COORDS · CELL_GRID)` · `docs/story/story-flowchart.md` · `docs/notes/docs-node-network.md` |
| **Overseer (The Fog Bank / LSO)** | `world.md` · `story.md Layer 104b` | `lab-reports/lab-report-littoral-courts.md §III` |
| **Pachelbel / Deacon** | `docs/story/story-arc-npc-dialogues.md` | `lab-reports/lab-report-web-of-connections.md` |
| **Saul→Paul arc (§LIX–§LXIX + §PAUL-01; §FUTURE-01 ✅ closed 2026-07-07)** | `story.md Layer 104a` · `maps.md` · `quest.md` §THE SAUL→PAUL ARC (18-quest table) | `lab-reports/lab-report-saul-paul-travel-reference.md` · `lab-reports/lab-report-saul-paul-vignette-spec.md` |
| **Pit training / Weckmann** | `world.md` | `lab-reports/lab-report-birka-beginner-arc.md` · `lab-reports/lab-report-kenickie-chronicle.md` |
| **Polyphonic organ** | `5thOrgan.html` | `lab-reports/lab-report-Polyphonic-Organ-Synth.md` |
| **Potions (4 tiers)** | `docs/mechanics/mechanics-economy.md` | `index.md (POTION_TIERS)` |
| **Quill / Couperin** | `docs/story/story-arc-npc-dialogues.md` | `lab-reports/lab-report-web-of-connections.md` |
| **Quest -1 (Level 21)** | `story.md §XIV` | `lab-reports/lab-report-quest-minus-one-world-creator.md` |
| **Quest system** | `world.md` | `index.md (QUEST_DB)` · `lab-reports/lab-report-architecture-full.md` |
| **Reward formula** | `docs/mechanics/mechanics-combat.md` | `lab-reports/lab-report-drop-rates-balance-and-health.md` |
| **Room 6 (joint NPC moment)** | `world.md` | `lab-reports/lab-report-web-of-connections.md` |
| **Save / load system** | `docs/mechanics/mechanics-combat.md` | `lab-reports/lab-report-architecture-full.md` · `index.md` |
| **Shard origin stories** | `story.md §XXII stub` | `lab-reports/lab-report-void-archaeology.md` (shard notes table) |
| **Shields (6 tiers)** | `docs/mechanics/mechanics-combat.md` | `index.md (SHIELD_ITEMS)` |
| **Specification gravity** | `lab-reports/lab-report-prompt-migration-arena-to-prototype.md` | `lab-reports/lab-report-documentation-system-design.md` |
| **State fields (193)** | `index.md` | `lab-reports/lab-report-architecture-full.md` |
| **Story arc split** | `docs/story/story-flowchart.md` | All `story-arc-*.md` files |
| **Sweelinck / endings** | `story.md` | `lab-reports/lab-report-endings-and-echoes.md` · `lab-reports/lab-report-npc-dialogue-system.md` |
| **Tattoos** | `lab-reports/lab-report-tattoo-progression-system.md` | `index.md (S_story.tattoos)` |
| **Tilbury Harbor Arc** | `docs/story/story-arc-coastal.md` | `lab-reports/lab-report-tilbury-visby-arcs.md` |
| **Tomes (item type)** | `docs/story/story-arc-investigation.md` | `lab-reports/lab-report-weimar-scholar-gate.md` |
| **Void Archaeology** | `docs/story/story-arc-investigation.md` | `lab-reports/lab-report-void-archaeology.md` |
| **Void pressure / Void Tide** | `docs/mechanics/mechanics-combat.md` | `index.md (voidPressure)` · `lab-reports/lab-report-architecture-full.md` |
| **Void Shaman / The Warden** | `docs/story/story-arc-investigation.md` | `lab-reports/lab-report-void-shaman.md` |
| **Visby Underground** | `docs/story/story-arc-coastal.md` | `lab-reports/lab-report-tilbury-visby-arcs.md` |
| **Weapons (70 types)** | `docs/mechanics/mechanics-combat.md` | `index.md (WEAPON_ITEMS)` |
| **Weimar Scholar Gate** | `docs/story/story-arc-investigation.md` | `lab-reports/lab-report-weimar-scholar-gate.md` |
| **World builder arc** | `archive/lab-report-plan-cleanup-world-builder-arc.md` | `lab-reports/lab-report-quest-minus-one-world-creator.md` |
| **World progression events** | `world.md` | `lab-reports/lab-report-living-world.md` |
| **XP / leveling** | `docs/mechanics/mechanics-combat.md` | `index.md (XP_LEVELS)` · `lab-reports/lab-report-leveling-flashbang-condition-economy.md` |
| **Yael Scheidemann** | `docs/story/story-arc-npc-dialogues.md` | `lab-reports/lab-report-narrative-arcs-brynn-bruhns-yael.md` · `lab-reports/lab-report-web-of-connections.md` |
| **Yugurt Lake / fishing** | `monsters.md` · `maps.md` | `lab-reports/lab-report-fish-with-dnd.md` |

---

## Town Cross-Reference

| Town | Two-letter hub | Act | Inn | Key quest nodes | Epic NPC |
|------|---------------|-----|-----|-----------------|----------|
| **Birka** | BI | I + VIII | IN | CI · SL · CQ · TV · BA · CR · CY | Commander Bruhns |
| **Tilbury** | TL | II | SF | DK · MQ · MS · AL | Magistra Muffat |
| **Visby** | VS | V | IS / PC | SE · BK · GC · MC · CA · VC | Warlord Mordus |
| **Weimar** | WM | VI | SQ | BQ · OU → GA · AR · MT | Archivus Sweelinck |

> See `docs/story/story-flowchart.md` for full node-to-node movement graph and arc overlays.

---

## Design Constants Quick Reference

> Moved from `index.md`. Updated 2026-06-14 — reflects §CELL-01–§CELL-12 state.

| Const | Purpose |
|---|---|
| `NODE_MAP` | 410 named nodes with `r,c` grid coords; all `N/S/E/W`, `portal`, `spire` edge fields stripped (§CELL-01 + §CELL-13); 268 zombie J-stubs purged by §CELL-05b; exits derived at runtime from CELL_GRID adjacency only |
| `NODE_COORDS` | Grid position `{r,c}` for all nodes; used by cell renderer and minimap |
| `CELL_GRID` | Reverse grid lookup; key `"r,c"` → **node-code list** (§WALK-1.5 locale lists); computed at startup from `NODE_MAP`; `cellCode(key)`=primary, `cellCodes(key)`=full list; `getCellGrid()` in server caches it per `WBAPI.nodeMap` reference |
| `GEO_PROJ` | §2.1 equirectangular 1° grid dims `{ROWS:90, COLS:360}`; passed to the mover kernel as `world.proj` for N/S clamp + E↔W wrap |
| `Mover` / `_moverWorld()` | §WALK-2 client handle to `mover.js` (`Mover.move(world,pos,dir)`); `_moverWorld()` builds the read-only world snapshot (`proj`/`impassable`/`cellCodes`/`terrainAt`/`encounterRate`) per move. See `mover.js` in Core Reference |
| `QUEST_DB` | Quest definitions (UQF-1.0: `gate`/`bits`/`completion`/`onComplete`); ~2,848 quests — ALL UQF after §ARCH-01 close 2026-07-05 + the §MATH-01 migration 2026-07-07, except the 30 dead `blq` stubs |
| `GATE_LOCKS` | 4 passage locks + shard gate; each entry: `{from, to, item, label}` |
| `CONDITION_ITEMS` | 11 condition items: name, icon, effect, sell value |
| `CONDITION_GOLD` | Pre-battle cost per condition (flat gold, not inventory) |
| `CONDITION_ADV` | Adv/DIS modifier keyed by lowercase-underscore condition name |
| `WORLD_DB` | 66 terrain entries (46 base + 20 epic); each has `monsters: []` with full stat blocks |
| `MONSTER_POOL` | 398 monsters across 8 source pools; keyed by monster key string |
| `MONSTER_DROPS` | Trophy drop per monster key; `{name, icon, sell}` |
| `EPIC_BOSS_POOL` | 20 deadly-tier bosses keyed by slug; AC/HP/ATK/dmg/epicDesc |
| `EB_NPC_DIALOGUE` | 20 quest-giver NPC profiles; payment negotiation, return beat, specialItem |
| `EB_STORY_ITEMS` | 11 special non-gold EB rewards: Forge Rune, Runic Hammer, Star Fragment, etc. |
| `FROBERGER_JOURNAL` | 41 entries `{entryNum, nodeCode, readAloud, text}`; 10 read-aloud + 31 collectible |
| `SWEELINCK_DIALOGUE_VARIANTS` | 5 variants keyed by curse score bracket + Birka variant if `_lubeckFriends()≥3` |
| `BIRKA_NPC_PROFILES` | 6 Birka NPC profiles (Yael/Brynn/Quill/Pachelbel/Weckmann/Auros); key/name/occupation/node |
| `NPC_DIALOGUES` | 6 NPCs × 4 states × 5 quotes each; cycled by visit count |
| `POTION_TIERS` | 4 healing potion tiers: minor/healing/greater/superior; `{name, icon, heal, cost}`; transmort scroll removed §CELL-13 |
| `SHIELD_ITEMS` | 6 tiers: Small +1 → Legendary +5 → Ancient +6 AC; vendor-gated by minLevel |
| `DAGGER_ITEMS` | 4 offhand daggers (drop-only): +1 Royal (Lv3) → +4 Voidsteel (Lv20) |
| `WEAPON_ITEMS` | 70 main-hand weapons (14 base × 5 magic tiers 0–+4); `_magicTierAllowed()` gates drops |
| `FIGHTER_FEATURES` | Fighter Champion features per level 2–20 |
| `_ASI_TABLE` | 6-entry d6 table; each: `{name, icon, delta, desc}` |
| `_LEVEL_GOLD_GIFT` | Gold gifted on non-ASI levels: `{2:250, 3:350, 5:500, …, 20:2500}` |
| `_LEVEL_SHIELD_GIFT` | Magic shield gifts on milestone levels: L3 → +1 Shield, L11 → +2 Shield |
| `XP_BY_TIER` | Legacy tier XP; kept for reference — L12+ uses `AC × maxHP` formula |
| `BOSS_COMMANDER_AUROS` | AC22/HP300/ATK+12/3d8+6; final boss at CO node; requires Lv20 + 7 shards |
| `VENDOR_NODES` | Set of node codes with vendor access (5 nodes: BA/MQ/SF/IS/BK) |
| `XP_LEVELS` | 20-entry array; max 195,000 XP at L20 |
| `LOOT_TABLE` | 20-entry d20 drop table (dead code — replaced by `_D100_TABLE`) |

---

## State Fields Quick Reference (S_story)

> Moved from `index.md`. All 193 `S_story` fields from `_S_DEFAULTS()`. Updated 2026-06-26 (§TIMELESS-01 removed `huntMode`).

| Field | Type | Purpose |
|---|---|---|
| `S_story.hp / hpMax` | number | Player story HP |
| `S_story.gold` | number | Current gold |
| `S_story.day` | number | Current day (1–49) |
| `S_story.shards` | number | Codex Shards collected (0–7) |
| `S_story.voidPressure` | number | Void Tide counter (0–10) |
| `S_story.xp / xpLastBattle` | number | Cumulative XP / last battle award |
| `S_story.level` | number | Current character level (1–20) |
| `S_story.atkBonus / acBonus` | number | Story combat modifiers |
| `S_story.abilityScores` | object | `{str,dex,con,int,wis,cha}` — set by character creation (base `{10,10,10,8,8,8}` + point-buy); legacy-save fallback `{16,12,14,10,12,8}` |
| `S_story.shieldTier` | string\|null | Magic shield tier granted |
| `S_story.levelUpLog` | array | Records each level-up `{lvl, hp, asiResult, goldGift, shieldGift}` |
| `S_story.shortRests` | number | Remaining short rest charges today (0–3) |
| `S_story.knowledge` | array | Necklace of Knowledge beads |
| `S_story.inventory` | array | All held items |
| `S_story.quests` | object | Quest status map: `questId → 'active'|'done'|'failed'` |
| `S_story.defeatedBattles` | object | nodeCode → true for completed story battles |
| `S_story.checkpointNode` | string | Last inn slept at (respawn point) |
| `S_story.battleTurn` | `'player'|'enemy'` | Initiative state for current battle |
| `S_story.battleRound` | number | Current round number |
| `S_story.surpriseAdvantage` | boolean | Stealth check passed — ADV on first attack |
| `S_story.usedMainAttack` | boolean | Main action consumed this round |
| `S_story.usedRealAttack` | boolean | A genuine weapon attack was made (gates offhand) |
| `S_story.usedBonusAction` | boolean | Bonus action consumed this round |
| `S_story.conditionRoundsLeft` | number | Rounds remaining on opponent condition |
| `S_story.spellAdvantageReady` | boolean | Spell scroll ADV queued |
| `S_story.equippedShield` | object\|null | Currently equipped shield |
| `S_story.equippedWeapon` | object\|null | Equipped offhand dagger |
| `S_story.equippedMainWeapon` | object\|null | Equipped main hand weapon |
| `S_story.pendingBattle` | object\|null | Active battle descriptor |
| `S._pendingDrop` | object\|null | Staged monster-specific drop for next victory |
| `S.char.baseAc` | number | AC snapshot taken at battle start |
| `S_story.surgeCharges` | number | Action Surge charges remaining (0–2) |
| `S_story.indomitableCharges` | number | Indomitable death-save reroll charges (0–1) |
| `S_story.tattoos` | array | Tattoo items pushed on each level-up |
| `S_story.shortRestedAtNodes` | object | nodeCode → true; first short rest per location |
| `S_story.sleptAtNodes` | object | nodeCode → true; first sleep per location |
| `S_story.journalEntriesRead` | array | entryNums of FROBERGER_JOURNAL entries found |
| `S_story.ebReturnsCompleted` | object | ebCode → true; set on EB return quest completion |
| `S_story.ebNegotiatedPayments` | object | ebCode → gold accepted |
| `S_story.npcFavorability` | object | npcKey → 0/1/2/3 |
| `S_story.roughWhiskeyUsed` | boolean | true after drunk pit fight event fires |
| `S_story.yaelEscortUsed` | boolean | true after one-time escort narration fires |
| `S_story.pitTrainingWins` | number | CY battle wins while `quest_pit_training` active |
| `S_story.ngPlusRun` | number | NG+ generation counter; 0 = first run |
| `S_story.frobergerLastEntryRead` | boolean | true after player finds Journal Entry 41 |
| `S_story.gameDay` | number | Alias for `S_story.day` |
| `S_story.actNumber` | number | Current act (1–8); set from `NODE_MAP[code].act` at top of `storyRender()`; defaults 1 |
| `S_story.currentCode` | string | Current node code |
| `S_story.s8VargaWatches` | number | Varga observation count (S8 mechanic, 0–3) |
| `S_story.archiveVisited` | boolean | Blue Shutters Archive entered |
| `S_story.playerKey` | string | Private 32-hex durable trade identity (§MESH-01i 2b); generated once on first 🌐 connect, save-persisted; server derives ledger pid from its sha256 |
| `S_story.pvpOff` | boolean | §MESH-01j global duel opt-out (🚫 decline all duels); presented at session/start — an off player is unchallengeable |
| `S_story.s29LineDelivered` | boolean | Auros/Froberger theory line delivered |
| `S_story.s49BrynnDelivered` | boolean | Brynn Entry-41 reaction delivered |
| `S_story.raisonToolsUsed` | boolean | Raison's Tools assessment used |
| `S_story.log` | array | Navigation history — node codes pushed on each move, max 20; used by vignette delivery and farewell logic |
| `S_story.visited` | object | nodeCode → true; first arrival |
| `S_story.journalRead` | object | nodeCode → true; which node journals read |
| `S_story.countedMissedInns` | object | nodeCode → true; prevents double-penalizing |
| `S_story.missedSleeps` | number | Consecutive sleep-skips |
| `S_story.battleDis` | number | Rounds of Disadvantage on player attacks |
| `S_story.dropsCollected` | number | Lifetime monster drop collection count |
| `S_story.lastCorridorCells` | array | Cell sequence from last corridor walk |
| `S_story.lastExitDir` | string\|null | Direction string from last move |
| `S_story.lastExitCode` | string\|null | Node code departed from in last move |
| `S_story.battlePRoll` | number | Raw player roll value in current battle round |
| `S_story.battleERoll` | number | Raw enemy roll value in current battle round |
| `S_story.corpsesQuests` | array | Active corpse-loot quests |
| `S_story.storyDeathSaves` | object | `{successes:0, failures:0, active:false}` |
| `S_story.lastAutoSellNode` | string\|null | Node where last auto-sell triggered |
| `S_story.waypoint` | string\|null | Active waypoint target node code |
| `S_story.customQuestTerrain` | string\|null | Terrain for active Assassin's Guild hunt |
| `S_story.ebReturnDone` | object | ebCode → true; player arrived at EB return node |
| `S_story.roughWhiskeyActive` | boolean | Rough Whiskey buff currently active |
| `S_story.slStalksWon` | number | BMA combat wins; `quest_slums_cleanup` completes at ≥3 (legacy name kept; no save migration — §TIMELESS-01) |
| `S_story.npcVisitCounts` | object | npcKey → visit count |
| `S_story.couperiSongReceived` | boolean | Quill has played Couperin's song |
| `S_story.bruhnsDepthsReported` | boolean | Depth report delivered to Auros |
| `S_story.pitPerks` | array | Active pit training perks |
| `S_story.frobergerNoteNode` | string\|null | Node code of last Froberger note found |
| `S_story.froberger_last_note_found` | boolean | Froberger's final note found |
| `S_story.froberger_last_note_read` | boolean | Final note opened and read |
| `S_story.hoursElapsed` | number | Total hours elapsed this run; +1 per short rest, battle, or inn stay |
| `S_story.hoursSinceSlept` | number | Hours since last inn sleep; ≥24 → exhaustion penalty |
| `S_story.playerR` | number | Current grid row; updated every `storyRender()` call (§CELL-03) |
| `S_story.playerC` | number | Current grid column; updated every `storyRender()` call (§CELL-03) |
| `S_story.visitedCells` | object | `"r,c"` → true for every cell stepped on; drives §CELL-10 minimap shading |
| `S_story.party` | object | Escort slot map: `{escort: npcKey\|null, …}`; `talk_party` quests gate on this (§ARCH-02 Phase 3) |
| `S_story.couperiDebtDegraded` | boolean | Quill's debt acknowledged as "just a number" |
| `S_story.worldEventsFired` | array | One-time world event IDs that have fired |
| `S_story.brynThirdStepFixed` | boolean | Bryn's third porch step repaired |
| `S_story.brynFirewoodBrought` | boolean | Firewood delivered to Bryn |
| `S_story.brynPantryRestocked` | boolean | Pantry restocked for Bryn |
| `S_story.brynLedgerBalance` | number | Bryn's ledger debt (starts −8) |
| `S_story.voidSignClicked` | boolean | Player has clicked the Void Sign once |
| `S_story.brynnsJournalRead` | boolean | Bryn's hidden cabin journal read |
| `S_story.pachelbelPaidBack` | boolean | Pachelbel's debt paid |
| `S_story.quillQuestComplete` | boolean | Quill's main quest resolved |
| `S_story.actThreeWeightApplied` | boolean | Act III emotional weight injected |
| `S_story.s49SweelinckDelivered` | boolean | Sweelinck moment delivered |
| `S_story.s54JointMomentDelivered` | boolean | Joint NPC moment delivered |
| `S_story.s55MapLineDelivered` | boolean | Map reveal line delivered |
| `S_story.s51NorthRoadBought` | boolean | North Road tome purchased |
| `S_story.s51ManifoldBought` | boolean | Manifold tome purchased |
| `S_story.s51LastStockBought` | boolean | Final shop item purchased from Leeuwenhoek |
| `S_story.s6JointDelivered` | boolean | S6 joint NPC moment delivered |
| `S_story.s2DaughterDelivered` | boolean | S2 daughter-mention line delivered |
| `S_story.archiveLetterObtained` | boolean | Letter from Blue Shutters Archive obtained |
| `S_story.archiveUndercitySurveyTaken` | boolean | Undercity survey quest accepted |
| `S_story.undercitySurveyDelivered` | boolean | Survey report delivered |
| `S_story.s8VargaClueUnlocked` | boolean | Varga surveillance clue revealed |
| `S_story.s8PachelbelTold` | boolean | Pachelbel informed of Varga observations |
| `S_story.romanceQuotesDelivered` | array | Indices of ROMANCE_QUOTES already shown; prevents repeats |
| `S_story.npcRomanceVignetteDelivered` | object | npcKey → true; inn vignette fires once per NPC per run |
| `S_story.nexusQuestSeen` | boolean | Nexus quest intro line delivered |
| `S_story.nexusQ01Active` | boolean | Nexus quest 01 active |
| `S_story.nexusQ02Complete` | boolean | Nexus quest 02 complete |
| `S_story.creativeLiteracyToken` | boolean | Creative Literacy Token obtained |
| `S_story.fishingQuestFlags` | object | Fishing quest completion flags by fish key |
| `S_story.fishingBaitSatchel` | boolean | Bait Satchel item obtained |
| `S_story.fishingYugurtFavour` | boolean | Yugurt Lake favour earned |
| `S_story.fishingCatchLog` | array | Log of fish caught |
| `S_story.junctionsSeen` | object | nodeCode → true; junction arrival tracking |
| `S_story.companionActsSeen` | object | Companion act IDs that have fired |
| `S_story.shardNotes` | array[7] | boolean per shard; true when shard origin note read |
| `S_story.shardNotesAllRead` | boolean | All 7 shard origin notes read |
| `S_story.voidCrackFired` | boolean | Void crack event fired (Act VII warning) |
| `S_story.voidFracturesFired` | boolean | Void fractures event fired |
| `S_story.voidImminentWarned` | boolean | Void imminent warning shown |
| `S_story.void_mercy_count` | number | Times Void mercy mechanic has triggered |
| `S_story.act8FarewellYael` | boolean | Act VIII Yael farewell scene delivered |
| `S_story.act8FarewellBrynn` | boolean | Act VIII Brynn farewell scene delivered |
| `S_story.act8FarewellQuill` | boolean | Act VIII Quill farewell scene delivered |
| `S_story.act8FarewellPachelbel` | boolean | Act VIII Pachelbel farewell scene delivered |
| `S_story.act8FarewellCrov` | boolean | Act VIII Weckmann farewell scene delivered |
| `S_story.act8FarewellAuros` | boolean | Act VIII Bruhns farewell scene delivered |
| `S_story.frobergerMemorialVisited` | boolean | Froberger memorial node visited |
| `S_story.frobergerMemorialFlowers` | boolean | Flowers placed at memorial |
| `S_story.frobergerMemorialBookSigned` | boolean | Book of remembrance signed at memorial |
| `S_story._memorialPlayerEntry` | string\|null | Player's text entry in the memorial book |
| `S_story.pitChampionOffered` | boolean | Pit Champion bout offered to player |
| `S_story.pitChampionWon` | boolean | Pit Champion bout won |
| `S_story.s54QuillBrynnDelivered` | boolean | Quill+Brynn joint scene at S54 delivered |
| `S_story.s55SqMapLineDelivered` | boolean | SQ map reveal line at S55 delivered |
| `S_story.brynnKeeperStoryTold` | boolean | Brynn's keeper backstory revealed |
| `S_story.brynnLightChoiceMade` | boolean | Player made the light/dark choice in Brynn arc |
| `S_story.brynnLightKept` | boolean | true = light choice; false = dark choice |
| `S_story.bruhnsCoSceneDelivered` | boolean | Bruhns CO confrontation scene delivered |
| `S_story.yaelNamedReportDelivered` | boolean | Yael named report scene delivered |
| `S_story.catKills` | object | nodeCode → kill count; Cat Quarter arc tracking |
| `S_story.catKingDefeated` | boolean | Cat King boss defeated |
| `S_story.kenickieMarketUsed` | boolean | Kenickie's black market accessed |
| `S_story.questMinusOne` | boolean | Quest -1 (Level 21 / World Creator) seen |
| `S_story.entry42Written` | boolean | Player has written Entry 42 |
| `S_story.entry42Text` | string | Player's text for Entry 42 |
| `S_story.entry42Read` | boolean | Entry 42 read back after writing |
| `S_story.ngMemoryDelivered` | object | npcKey → true; NG+ memory line delivered per NPC |
| `S_story.nextFrobergerComplete` | boolean | NG+ Froberger arc complete |
| `S_story.frobergerLetterFound` | boolean | Froberger's sealed letter at CO found |
| `S_story.priorQuestMinusOne` | boolean | Quest -1 seen on a prior NG+ run |
| `S_story.wmLowerArchiveUnlocked` | boolean | Weimar lower archive unlocked |
| `S_story.wmDoc1Read` | boolean | Weimar archive Doc 1 read |
| `S_story.wmDoc2Read` | boolean | Weimar archive Doc 2 read |
| `S_story.wmDoc3Read` | boolean | Weimar archive Doc 3 read |
| `S_story.wmDoc3Unredacted` | boolean | Doc 3 unredacted (First Researcher name revealed) |
| `S_story.wmArchiveComplete` | boolean | Full archive sequence complete |
| `S_story.wmSessionsDays` | array | Days on which archive sessions occurred |
| `S_story.wmBenediktCircleComplete` | boolean | Benedikt reading circle sequence complete |
| `S_story.wmFirstResearcherKnown` | boolean | First Researcher identity known |
| `S_story.vaCI` | boolean | Void Archaeology mark found at CI |
| `S_story.vaSL` | boolean | Void Archaeology mark found at SL |
| `S_story.vaDF` | boolean | Void Archaeology mark found at DF |
| `S_story.vaWM` | boolean | Void Archaeology mark found at WM |
| `S_story.vaMT` | boolean | Void Archaeology mark found at MT |
| `S_story.vaAllMarksFound` | boolean | All 5 archaeology marks found |
| `S_story.vaLogFound` | boolean | Constructor's Log found in lower archive |
| `S_story.vaLastWardVisited` | boolean | Last ward (sealed tunnel) visited |
| `S_story.vaArchitectureKnown` | boolean | Full void architecture understood |
| `S_story.tlLedgerRead` | boolean | Tilbury Harbor ledger read |
| `S_story.tlEmbargoChallenged` | boolean | Emergency Trade Protocol 7 challenged |
| `S_story.tlEmbargoDismissed` | boolean | Embargo dismissed or resolved |
| `S_story.tlMissingShipSolved` | boolean | Missing ship investigation complete |
| `S_story.vsDebtProbed` | boolean | Visby debt structure investigated |
| `S_story.vsWeaponsFound` | boolean | Visby underground weapons cache found |
| `S_story.vsDebtSettled` | boolean | Visby debt arc resolved |
| `S_story.vsShamanKnown` | boolean | Void Shaman (the Warden) identified |
| `S_story.vshamanFound` | boolean | Warden located at MT |
| `S_story.vshamanDefeated` | boolean | Warden defeated in combat |
| `S_story.vsShamanPersuaded` | boolean | Warden persuaded (non-combat resolution) |
| `S_story.wardensLegacyKnown` | boolean | Warden's corrupted mandate understood |
| `S_story.vsShamanBenediktDelivered` | boolean | Warden truth delivered via Benedikt chain |
| `S_story.fav_corelli` | number | Corelli favorability (0–3) |
| `S_story.corelli_purchase_count` | number | Items purchased from Corelli |
| `S_story.corelli_encounter_count` | number | Times Corelli wandering merchant encountered |
| `S_story.corelliRevelationDelivered` | boolean | Corelli's final revelation delivered |
| `S_story.hour` | number | Time-of-day clock 0–23; +1 per battle, +6 per sleep |
| `S_story.careerStats` | object | Permanent career ledger (never reset): kills, deaths, dmgDealt, dmgReceived, sleeps, battlesAttempted, attacksAttempted, attacksHit, exitsTaken, daysAdventuring |
| `S_story.runStats` | object | Per-run ledger (reset on respawn): same 10 fields as careerStats |
| `S_story.tackleboxZoneUnlocks` | object | `{shore:true, reeds:false, deep:false}` — which fishing search zones are accessible; zone gating live (Layer 83) |
| `S_story.baitFishingActive` | boolean | Suppresses node re-render during bait catch sequence |
| `S_story.skillCheckAttempts` | object | `{ questId: { lastDay, failures } }` — retry gate for Ceremonia Roll quests; set on each failed retryable roll |
| `S_story.ceremoniaYaelAct` | number | Current act in Yael Ceremonia Arc (0 = not started, 1–5 = act N complete) |
| `S_story.ceremonia_yael_04_failed` | boolean | Act IV fail path — changes Yael's Act V vignetteText |
| `S_story.ceremonia_yael_complete` | boolean | Full Yael Ceremonia Arc complete; triggers Watch Token item |
| `S_story.cryptSurveyed` | boolean | `quest_crypt_survey` pass flag |
| `S_story.courierReleased` | boolean | `quest_courier_release` pass flag |
| `S_story.patrolBA` | boolean | Player visited CI while `quest_city_watch_patrol` active |
| `S_story.patrolIN` | boolean | Player visited IN after CI while `quest_city_watch_patrol` active |
| `S_story.patrolRouteComplete` | boolean | Full patrol route BA→IN→TA completed; triggers quest completion |

---

## Known Cross-Document Issues

All previously logged conflicts resolved. Current known gaps:

| Gap | Files | Action |
|-----|-------|--------|
| index.md status line was "Layers 0–45" | `index.md` | ✅ Fixed 2026-05-25 |
| story.md EB dialogs and NPC dialogs were inline (2660 lines) | `story.md` | ✅ Extracted to `story-arc-*.md` files 2026-05-25 |
| Lab reports for Layers 48–77 missing from index | `index.md` | ✅ All 36 indexed 2026-05-25 |
| Reverse lookup table missing | `index.md` | ✅ Added 2026-05-25 |
| docs/story/story-flowchart.md did not exist | — | ✅ Created 2026-05-25 |
| FC01–FC05 documentation queue | `plan-archive.md §V-B` | ✅ All complete 2026-05-25 |
| F4 table line numbers all stale (+749–3119 drift) | `docs/mechanics/mechanics-economy.md` | ✅ All 26 entries corrected 2026-05-26 (SP4) |
| 8 HTML consts missing home docs (romance system, BRYNN_MAINTENANCE_TASKS, etc.) | `docs/mechanics/mechanics-economy.md` · `world.md` · `story.md` | ✅ Reverse-scan pass SP4 2026-05-26 |
| State fields count "107" stale; plan.md description "230 lines" stale | `index.md` | ✅ Fixed 2026-05-26 (SP4) |
| 20 stale ⚠️ PLANNED markers (Layers 46–74) in world.md + story.md | `world.md` · `story.md` | ✅ All cleared 2026-05-26 (SP4 stale-PLANNED scan) |
| 67 HTML public consts had no `// → doc:` pointer (27 → 94 total) | `roll2hit-v3.html` | ✅ Full reverse scan complete 2026-05-26 (SP4) |
| F4 table re-drifted (+9–53 lines) after SP4 annotation pass | `docs/mechanics/mechanics-economy.md` | ✅ All 29 entries re-verified 2026-05-26 |
| `surveyDeliveredToAuros` flag name wrong in world.md §Blue Shutters Archive | `world.md` | ✅ Corrected to `undercitySurveyDelivered` 2026-05-26 |
| 5 `// → doc:` annotations pointed to non-existent section names (§Inn Sleep, §Gate Locks, §Quiet Return, §Act III NPC Lines, §Sweelinck Naming Ceremony) | `roll2hit-v3.html` · `story.md` | ✅ All fixed 2026-05-26 — annotations corrected; `#### Gate Locks` section added to story.md |
| OST code collision: `OST` node code was already used (Bruges — Cloth Hall), so La Chanson de Roland uses quest prefix `ost_` only; no OST hub node created | `1367-sources/plan.md` · `docs/api/api-data-audit.md` | ✅ Resolved 2026-06-05 — 4 new nodes RON/PYR/AIX/FRS created; cycles 1–2 route RON/PYR/AIX/FRS naturally; cycles 3–7 hub at AIX or RON |

---

---

## Data Audit Loop — Quest Text Backfill

Procedure: `docs/api/api-data-audit.md` — self-referential loop that runs until all errors and warnings are cleared.

**How it works:**
1. `curl 'http://localhost:1367/api/next-error?severity=error'` → fix all errors first
2. `curl 'http://localhost:1367/api/next-error?severity=warning'` → then warnings
3. Identify quest source: book prefix → `1367-sources/{CODE}-*.md`; original game → write from context
4. PUT the fix; response includes `verified` array confirming disk write (no server restart)
5. Commit after each book completes; announce with macOS `say`

**macOS say — loop protocol (applies everywhere in this project):**
```bash
# After each commit:
git commit -m "message" && say "message" &
# At each loop pause point:
say "continue, continue, continue!" &
# After each PUT in the audit loop:
say "Fixed quest id. Verified on disk." &
```
`say` runs blocking (no `&`) — each announcement completes before the next step.
This rule applies to `docs/api/api-data-audit.md`, `plan-archive.md §TTS`, and all session loops.

**Source fidelity:** When `1367-sources/{CODE}-*.md` exists, copy `scene:/successText:/failText:` fields verbatim. City names and geographic anchors in quest text must match the city referenced in the source file. The book authored as a 1367-source uses the city name in the title and the plan — those landmarks carry into the quest desc and hint.

**Status (2026-06-05):** MQ/SQ/EPIC done. §IMPORT-102 RIX complete (449 nodes, 1695 quests). See `docs/api/api-data-audit.md §Per-Book Queue`.

**§IMPORT-99 OST nodes** (La Chanson de Roland, Anon, c.1100):
- `RON` — Roncevaux Pass (r:110 c:128, highlands)
- `PYR` — Pyrenean High Road (r:110 c:130, highlands)
- `AIX` — Aix-la-Chapelle Chapel (r:110 c:132, camelot)
- `FRS` — Frankish Road-Town (r:110 c:134, city)

---

*Last updated: 2026-07-02*
*Codebase: `roll2hit-v3.html` · 36,933 lines · Layers 0–104 complete · 418 nodes · 398 monsters · ~2,848 quests · geo-cell navigation (§CELL + §WALK + §NAV-01 roads/rooms/auto-travel, complete) · §ARCH-01 UQF ✅ CLOSED · §MESH-01 core + full gameplay ladder f–j (ledger trades incl. cross-origin, PvP duels) · all jump-travel removed (§CELL-13 re-applied 2026-07-03)*
*MIT License — roll2hit.com — Copyright (c) 2026 — Free to use, modify, and share.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
