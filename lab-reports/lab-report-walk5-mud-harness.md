# Lab Report — §WALK-5: MUD Multi-Client Harness (instanced encounters, v1)

**Status:** ✅ **COMPLETE (2026-06-26).** **Inc 1 ✅** (world inputs + terrain-parity guard) · **Inc 2 ✅** (per-session seeded RNG + instanced roll) · **Inc 3 ✅** (`tests/mud-harness.mjs`, properties a–c) · **Inc 4 ✅** (TTL-prune assertion + CI `mud` job + docs). Full harness **24/24, green across 3 consecutive runs**; closes the **§WALK series**.
**Parent:** `lab-reports/lab-report-terrain-field-mover-redesign.md` §7 (the v1 instanced-vs-shared decision).
**Predecessor MUD layer:** `lab-reports/lab-report-cell-map-mud-redesign.md` §CELL-07 (the in-memory `SESSIONS` store + SSE broadcast this report extends).

---

## 1. Summary

§WALK-5 closes the §WALK series by giving the WBAPI server **server-side encounter resolution** and a
**deterministic multi-client test harness** that proves encounters are *instanced per session* — client A's
fight never bleeds into client B. The world kernel (`mover.js`) already emits an `encounter:{eligible,
baseRate}` block; the server simply never populates the inputs (`terrainAt`/`encounterRate` are omitted from
`getMoverWorld()`). This report locks the shape that wires them in, stores the rolled encounter on the
session, and drives the whole thing from a scripted K-client harness.

**Acceptance:** K-client harness green; the instancing property holds (each client's encounter trace is a
pure function of its own seed + path); no cross-session encounter bleed; `player_arrived`/`chat` reach
co-present sessions only; idle TTL prunes sessions.

---

## 2. Why this was deferred to its own report

The parent §7 locked the *decision* (instanced, not shared) but its §7.1 pseudo-code predates two later
changes and assumed a session shape that does not exist. Three reconciliations are mandatory before any code:

1. **`s.huntMode` is gone.** §TIMELESS-01 removed the Hunt/Stalk feature entirely. The parent §7.1 roll
   `roll < (s.huntMode ? 1 : res.encounter.baseRate)` must drop the `huntMode` branch. The roll is simply
   `roll < res.encounter.baseRate`. (The §TIMELESS-01 report and `lab-report-timeless-movement-hunt-removal.md`
   are the authority; there is no guaranteed-encounter mode in the current engine.)

2. **Blocked moves return 409, not `200 {ok:false}`.** The parent §7.1 sketched `if !res.ok: 200 {ok:false}`.
   The *live* handler (`wbapi-server.js` POST `/api/session/move`, ~line 7507) already returns **409** with
   `{ok:false, error, reason}` for sea/oob, and that behaviour is covered by the §WALK-2 end-to-end
   verification. **Do not change it.** §WALK-5 only adds the encounter side-effect to the *success* path
   (200); the 409 block path is untouched.

3. **`s.state` is a string, not an object.** `session/start` sets `state:'active'` and `session/who`
   serialises `state: s.state`. The parent §7.1 wrote `s.state.encounter = …`, which would (a) clobber the
   lifecycle string and (b) change the `who` payload shape. **Decision:** store the rolled encounter at a
   **new top-level field `s.encounter`** (object or `null`), leaving `s.state` as the lifecycle string. This
   is additive — `who` gains an `encounter` field; nothing existing changes type.

---

## 3. Current state (ground truth, 2026-06-26)

What already exists and is load-bearing — §WALK-5 builds *only* on top of this:

| Piece | Location | Status |
|---|---|---|
| `SESSIONS` Map (`id→{id,playerName,r,c,nodeCode,state,lastSeen}`) | `wbapi-server.js:65` | ✅ §CELL-07 |
| `SSE_CLIENTS` Map + `broadcastCell(r,c,event,data,excludeId)` | `wbapi-server.js:66,84` | ✅ |
| `SESSION_TTL` 30-min idle prune (sweep on access) | `wbapi-server.js:67–76` | ✅ |
| `POST /api/session/start` (spawn at hub LHR) | `wbapi-server.js:7458` | ✅ |
| `POST /api/session/move` (thin `Mover.move()` caller, §WALK-2) | `wbapi-server.js:7495` | ✅ |
| `POST /api/session/say` (cell-scoped chat broadcast) | `wbapi-server.js:7526` | ✅ |
| `GET /api/session/look` · `/who` · `/events` (SSE) | `wbapi-server.js:7390–7446` | ✅ |
| `getMoverWorld()` — **omits** `terrainAt`/`encounterRate`/`ferryEdges` | `wbapi-server.js:376` | ⛔ §WALK-5 wires these |
| Kernel `encounter:{eligible,baseRate}` in `MoveResult` | `mover.js:60–67` | ✅ (inputs unfed) |
| Client parity primitives `_inferTerrain` / `TERRAIN_ENCOUNTER_RATE` / `_weightedMonsterPick` | `roll2hit-v3.html:25639 / 9077 / 32596` | ✅ (to mirror) |

The kernel is already correct: `mover.js:60–61` computes `terrain = world.terrainAt(r,c)` and
`baseRate = (destKind==='empty' && world.encounterRate) ? world.encounterRate(terrain) : 0`, and emits
`encounter.eligible = destKind === 'empty'`. With `terrainAt`/`encounterRate` absent, `terrain` is `null` and
`baseRate` is `0` — so today the server reports `eligible:true, baseRate:0` on empty cells and never rolls a
monster. §WALK-5 supplies the two functions; **no kernel change is required.**

---

## 4. Design decisions (locked)

### 4.1 Instanced encounters — restated, corrected

Each session resolves its own encounter when it steps onto an **empty** cell (`destKind==='empty'`). The roll
result lives on `s.encounter`, never on the cell. Co-presence stays *social* (arrivals, chat, `who`, shared
`look`) — combat is never shared. This matches the §CELL-07 single-thread note: Node is single-threaded and
processes one synchronous `move` per session, so **no per-cell mutex is needed**. Shared/contended encounters
remain explicitly v2.

> Named cells (`destKind==='named'`) are **not** encounter-eligible — the kernel already sets
> `eligible:false` there, mirroring the SP client where `_enterEmptyCell` (and only it) rolls encounters.

### 4.2 Server↔client terrain & encounter parity

`getMoverWorld()` gains two functions that mirror the client byte-for-behaviour:

- **`terrainAt(r,c)`** mirrors `_inferTerrain` (`roll2hit-v3.html:25639`):
  1. if `SEA_LANES.has("r,c")` → `'ocean'` (carved sea-lanes render as open ocean);
  2. else majority terrain (`NODE_MAP[code].name`) among the 4 orthogonal neighbours that are named cells;
  3. ties → first-seen; no named neighbours → `'midlands'`.
  Server already has `WBAPI.nodeMap` and `getLocaleGrid()` (the cell→codes index); it needs a parsed
  **`SEA_LANES`** set (parse from `WBAPI._rawSrc` the same way `getImpassable()` parses `SEA_RUNS`). If
  `SEA_LANES` is empty/absent, step 1 is simply skipped (no ocean reclass) — acceptable for v1 and logged.

- **`encounterRate(terrain)`** mirrors `TERRAIN_ENCOUNTER_RATE` (`roll2hit-v3.html:9077`): a lookup table with
  `_default:0.15`. Parse the literal from `_rawSrc`, or — since it is a small static table — inline a copy in
  the server with a **parity assertion** (see §6) that fails CI if the two drift.

### 4.3 Monster pick — parity with `_weightedMonsterPick`

On a successful roll the server picks a monster mirroring `_weightedMonsterPick` (`roll2hit-v3.html:32596`):
tier-weighted draw from `WORLD_DB[terrain].monsters` (fallback `midlands`). **Caveat:** the client weights by
`_notorietyWeights(_notoriety())`, which is *player-progression* state the server session does not track. For
v1 the server uses **flat tier weights** (the `WEIGHTS[m.tier] || 10` default with notoriety held at its base
tier) and stores `{key,name,tier}` on `s.encounter`. Document this as a known SP/MP divergence; full notoriety
parity is a v2 follow-up (it needs per-session progression, which the MUD layer does not yet model).

### 4.4 Per-session seeded RNG (the instancing proof's backbone)

Each session gets a deterministic RNG stream seeded at `start` so the harness can replay an exact encounter
trace. Add `s.seed` (derive from `sessionId`, or accept an optional `body.seed` at `start` for the harness)
and `s.rngState`; advance a small LCG/xorshift per roll. **This is also the only reason the server can avoid
`Math.random()`** — which is unavailable in the deterministic contexts the harness drives. The roll is:

```
// on session/move success, empty cell only:
if (mres.encounter.eligible) {
  const roll = seededNext(s);                 // 0..1, advances s.rngState (per-session stream)
  s.encounter = (roll < mres.encounter.baseRate)
    ? pickMonster(mres.terrain, s)            // flat-tier draw, also via seededNext(s)
    : null;
} else {
  s.encounter = null;                         // named cell or blocked → clear stale encounter
}
```

The instancing property falls straight out: `s.encounter` reads and writes **only** `s.*` — no cell state, no
other session — so client A's stream and client B's stream are independent by construction. The harness
asserts this empirically (§5) rather than trusting the argument alone.

### 4.5 Ferry hook — resolve the inert `ferryEdges`

`mover.js` supports `world.ferryEdges` (a `Set` of `"r,c|r,c"` land↔land-over-sea edges) but `getMoverWorld()`
never sets it, and there is no `FERRY_EDGES` data anywhere — it is dead capability (§WALK-2-FU "inert ferry
hook"). **Decision for §WALK-5: keep the kernel capability, defer the data.** Authoring a real `FERRY_EDGES`
table is a content/geo task (which crossings exist) that does not belong in a harness increment and would need
its own SP-client wiring to stay in parity. The §WALK-5 increment will instead:
- leave `mover.js`'s `ferryEdges` branch as-is (already tested structurally),
- add a one-line `getMoverWorld()` comment pointing here, and
- file the authoring task as **§WALK-5-FU** (author `FERRY_EDGES` for both server and SP client together, or
  delete the kernel branch if no crossing is ever needed).
This avoids shipping a half-wired ferry that exists on the server but not the client (a parity violation the
§WALK-4 invariant suite would not catch, since it does not model ferries).

---

## 5. The harness (`tests/mud-harness.*`)

A Node multi-client driver (no Playwright — it speaks HTTP/SSE to the server directly):

1. **Spin** the server on an ephemeral port (or assume a running dev server; prefer spawning for CI isolation).
2. **Start K sessions** at the hub, each with a distinct `seed`.
3. **Subscribe** each to `GET /api/session/events?sessionId=` (SSE) and record every event with its recipient.
4. **Drive** a scripted move/say sequence per client (deterministic per seed).
5. **Assert:**
   - **(a) co-presence delivery** — `player_arrived` and `chat` are delivered to *co-present sessions only*
     (same `r,c`), never to the actor, never to sessions elsewhere.
   - **(b) instancing** — each client's encounter trace (`s.encounter` after each move, read back via `who`/
     the move response) is a **pure function of its own seed + path**; replaying client A's seed+path
     reproduces its trace exactly, and A's encounters never appear in B's trace. **This is the core property.**
   - **(c) social state** — `who`/`look` reflect true co-presence (the `players[]` list at a cell).
   - **(d) TTL prune** — fast-forwarding past `SESSION_TTL` (inject a clock or temporarily shrink the TTL via
     a test env var) drops idle sessions and closes their SSE.

The harness is the *acceptance test* for §WALK-5; it lives outside the Playwright suite because it is a
server-protocol test, but it should run under `npm run` and (cheaply) in CI.

---

## 6. Parity guard (extends the §WALK-4 invariant suite)

§WALK-4 proved structural/behavioural mover parity (`scripts/check-mover-parity.js`,
`scripts/check-mover-behaviour.js`). §WALK-5 adds a **terrain/encounter parity** check so the server's new
`terrainAt`/`encounterRate`/`encounterRate`-table and monster-pick cannot silently drift from the SP client:

- assert the server's `TERRAIN_ENCOUNTER_RATE` copy === the client's parsed table (keys + values + `_default`);
- assert `terrainAt(r,c)` agrees with `_inferTerrain(r,c)` on a deterministic sample of empty cells
  (replicate `_inferTerrain` offline from `NODE_MAP`/`SEA_LANES`, compare);
- wire into `npm run check:walk` so the existing CI gate (`.github/workflows/walk-invariants.yml`) enforces it.

This keeps the §6 acceptance bar from the parent series — *green on current `main`* — and means any future
terrain re-tuning that touches one side and not the other fails CI immediately.

---

## 7. Increment plan (one commit each, per the Directive)

Strictly sequential; each is a green checkpoint (`npm run check:walk` + harness where applicable):

- **Inc 1 — World inputs. ✅ DONE.** Added `getSeaLanes()` parse + `terrainAt`/`encounterRate` to
  `getMoverWorld()` (wbapi-server.js); added `scripts/check-terrain-parity.js` to `scripts/` + `check:walk` +
  CI `paths:`. *No behaviour change to `move` yet* (encounter not yet stored). Verified the kernel now reports
  non-zero `baseRate` on empty cells (LHR N→empty `eligible:true baseRate:0.15`; E→named BMA `eligible:false`).
  The guard extracts the REAL `_inferTerrain` (HTML) + `terrainAt` (server) and runs both in a sandbox: rate
  table (15 keys) + SEA_LANES (59 cells) regex round-trip, terrainAt==_inferTerrain on all 10440 band cells.
  **Parity guard green; full `check:walk` green.**
- **Inc 2 — Instanced roll. ✅ DONE.** Added `s.seed`/`s.rngState`/`seededNext` (mulberry32), `pickMonster`
  (flat base-tier weights `{trivial:40,easy:35,medium:20,hard:4,deadly:1}` via `WBAPI.monsters.byTerrain`,
  midlands fallback), and the §4.4 roll on the `session/move` **success** path; stored `s.encounter`; surfaced
  it on the move response + `who` (which also exposes `seed`). Empty cell rolls; named cell clears; a blocked
  **409** returns early so a pending encounter survives (no move happened). `session/start` accepts an optional
  `body.seed` for reproducible harness traces. **Verified live over HTTP** (throwaway `PORT=1368` instance,
  user's 1367 untouched): determinism (same seed+path ⇒ identical trace), firing (32/40 seeds fired ≥1), and
  per-seed divergence (31 distinct traces / 40 seeds). The automated multi-client SSE/no-bleed assertions are
  Inc 3. **`check:walk` green.**
- **Inc 3 — Harness. ✅ DONE.** Built `tests/mud-harness.mjs` (`npm run test:mud`) — a pure HTTP+SSE Node
  driver (no Playwright). Spawns a throwaway `wbapi-server` on `MUD_HARNESS_PORT` (default 13679, pre-checked;
  child killed in `finally`), starts K seeded sessions, opens an SSE stream per client (parses `event:`/`data:`
  frames into `events[]`), drives scripted move/say, and asserts properties (a)–(c): co-presence chat (every
  co-present session incl. the sender exactly once; a walked-away session stops hearing the cell), cell-scoped
  `player_arrived` (once, only to sessions already at the destination, never the mover), instancing (encounters
  never delivered over SSE; trace is a pure fn of the session's own seed — determinism; different seeds
  diverge), and `who`/`look` co-presence. **18/18, green across 3 consecutive runs.** **Caught + fixed a real
  §CELL-07 bug:** `session/say` double-delivered the sender's own chat (`broadcastCell(...,null)` already
  includes the sender, then a redundant `sseSend` to the sender fired again) — removed the redundant send.
  *CI wiring deferred to Inc 4: the harness boots the server, which top-level-requires `@anthropic-ai/sdk`, so
  it needs an `npm ci` job (unlike the pure-stdlib `check:walk`).*
- **Inc 4 — TTL + CI + docs. ✅ DONE.** Added property (d): a second throwaway server booted with a
  `SESSION_TTL_MS` env override (inert in every real deployment — falls back to the 30-min default) so the
  prune path runs in ms. The harness keeps a "Warm" session alive with periodic `look`s and leaves a "Ghost"
  idle, then triggers the sweep (every `/session/*` request prunes first) and asserts **only** the idle Ghost
  is dropped *and* its SSE stream was server-closed (`res.end()` → client `'end'`), while Warm survives —
  proving the prune is selective, not a blanket reap. **Harness now 24/24.** Wired into CI as a **separate
  `mud` job** in `walk-invariants.yml` (`npm ci` + `npm run test:mud`) — it can't ride the stdlib-only
  `invariants` job because the server top-level-requires `@anthropic-ai/sdk`. Docs synced; **§WALK-5-FU**
  (ferry data) filed. **Green: full harness + `check:walk`.** This closes §WALK-5 and the entire §WALK series.

---

## 8. Non-obvious decisions (for the next reader)

- **No `huntMode`.** Anything in older notes implying a guaranteed-encounter mode is stale post-§TIMELESS-01.
- **409 stays.** The block path predates the parent §7.1 sketch and is tested; §WALK-5 is purely additive on
  the 200 path.
- **`s.encounter`, not `s.state.encounter`.** `s.state` is the lifecycle string; nesting on it would change
  the `who` API and clobber `'active'`.
- **Flat tier weights, not notoriety.** The server session has no progression state; full SP parity on the
  monster draw is a v2/§WALK-5-FU concern, explicitly logged as an SP/MP divergence.
- **Ferry deferred, not deleted.** Kernel keeps the capability; data (`FERRY_EDGES`) is a paired SP+server
  content task tracked as §WALK-5-FU — shipping it server-only would be an undetectable parity break.
- **Seeded RNG is mandatory, not a nicety.** It is both the instancing proof's backbone and the only way the
  server rolls encounters in the deterministic contexts the harness (and CI) run in.

---

## 9. Files (as shipped)

| File | Change |
|---|---|
| `wbapi-server.js` | `getMoverWorld()` +`terrainAt`/`encounterRate`/`SEA_LANES`; `session/move` +instanced roll; `s.encounter`/`s.seed`/`s.rngState`; `who` +`encounter`; `SESSION_TTL` reads `SESSION_TTL_MS` env override (test-only, prod-inert) |
| `scripts/check-terrain-parity.js` (new) | server↔client terrain/encounter-rate parity guard |
| `package.json` | `check:terrain` + `test:mud` aliases; `check:terrain` folded into `check:walk` |
| `tests/mud-harness.mjs` (new) | K-client deterministic HTTP+SSE harness, properties a–d (24/24) |
| `.github/workflows/walk-invariants.yml` | new `mud` job (`npm ci` + `test:mud`); harness path added to triggers |
| `index.md` / `plan.md` | cross-ref + status; SP/MP encounter divergence note |
| this report | status → COMPLETE |
