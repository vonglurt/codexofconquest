<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §WALK-5: MUD Multi-Client Harness (instanced encounters, v1)

**Track:** §WALK-5 (Inc 1–4) + §WALK-5-FU · closes the §WALK series
**Written:** 2026-06-26 11:41 (`7f4b73c`) · **Series closed:** 2026-06-26 13:33 (`95c4143`)
**Re-verified against HEAD:** 2026-08-14 (§DOC-02bm)
**Parent:** `docs/lab-reports/lab-report-terrain-field-mover-redesign.md` §7 (the instanced-vs-shared decision)
**Predecessor:** `docs/lab-reports/lab-report-cell-map-mud-redesign.md` §CELL-07 (the `SESSIONS` store + SSE broadcast this extends)

---

## Abstract

The WBAPI server had a multi-client session layer (§CELL-07) and a shared movement kernel (§WALK-2), but no
danger: `mover.js` computed an `encounter` block the server never fed, so every MUD step reported
`baseRate: 0` and no monster ever appeared. §WALK-5 wires the two missing world inputs, resolves the
encounter **per session** rather than per cell, and proves the resulting independence with a scripted
K-client harness. The question it answers is social, not technical: *when two players stand on the same
wilderness cell, whose fight is it?* The answer locked here — **co-presence is social, danger is private** —
is what lets a second player join without turning the world into a queue.

Verified at HEAD ten weeks later: **every structure specified is live**, **all 12 line pointers were
byte-exact at the reference commit**, the parity guard reports **10,440/10,440 cells in agreement**, and the
harness this report founded has grown **24 → 269 assertions**. Two deltas matter: its own Inc 4 assertion is
**red at HEAD** (a timing budget, not a broken prune), and the single SP/MP divergence it logged has quietly
become **four**.

---

## 1. Method

Batch `grep -c` census of all 40 named symbols first; every §3 pointer replayed against the report's own
reference tree `7f4b73c` (instrument 8 — HEAD cannot adjudicate a claim about 2026-06-26);
`git log -S <sym> --all` with **no pathspec** on each dead symbol, to separate RETIRED from NEVER-SHIPPED
(instruments 4/67); `check-terrain-parity.js` and `npm run test:mud` run live, three consecutive times, plus
an isolated re-creation of the one failing scenario; and, for every identifier the report declares gone, a
read of the commits that came **after** its deletion (instrument 68 — vocabulary gets re-minted).

---

## 2. Intent — why encounters are instanced, and why that is a playability decision

The parent locked the *decision* (instanced, not shared); this report had to live with it. Three arguments,
ascending:

- **Mechanical.** Node is single-threaded and processes one synchronous `move` per session, so an instanced
  roll needs no per-cell mutex. A *shared* encounter would need one — and a lock on a cell is a lock on the
  road.
- **Free movement (CONTRIBUTING invariant #1).** A shared encounter turns another player's bad luck into a
  refusal of *your* step. That promise does not survive contended combat.
- **Playability.** The point of a second player is company, not competition for monsters. Instancing lets a
  friend walk beside you across 416 nodes — you see their arrival, hear their chat, share the room
  description — while your fights stay yours. Co-presence becomes something you *want* rather than something
  you route around.

Shared encounters remain explicitly v2; §4.1 simply refuses to ship them by accident.

---

## 3. Reconciliations before code — the parent's sketch versus the live file

The parent §7.1 pseudo-code predated two later tracks and assumed a session shape that did not exist. Three
corrections were mandatory, and all three were correct:

| # | Parent §7.1 assumed | The file actually held | Outcome |
|---|---|---|---|
| 1 | `roll < (s.huntMode ? 1 : baseRate)` | §TIMELESS-01 had removed Hunt/Stalk; **`s.huntMode` never existed in code at all** | Roll simplified to `roll < baseRate`. Shipped exactly so. |
| 2 | blocked move → `200 {ok:false}` | the live handler already returned **409** with `{ok, error, reason}` | *"Do not change it."* Unchanged to this day. |
| 3 | `s.state.encounter = …` | `s.state` is the lifecycle **string** `'active'`, serialised by `who` | New top-level `s.encounter`; `who` gains a field, nothing changes type. |

Correction #1 is the rarer kind of accuracy. `git log -S "s.huntMode" --all` returns **two commits, and both
are lab reports** — the parent's sketch and this report correcting it. The identifier was never in the
server. This report is not describing a feature it removed; it is refusing to implement one a sibling
document had invented on paper.

> **⚠ Annotated 2026-08-14 (§DOC-02bm), and this is the one paragraph a later commit falsified.** §8's
> *"No `huntMode`"* is **false at HEAD**. `8168f0e` (§KG-01, 2026-07-08) shipped a **different** mechanic —
> `baseRate × 2` capped at 0.8, an 80/20 bias toward monsters at or below player level, wilderness only, no
> clock cost — under the identical identifiers `S_story.huntMode` / `storyToggleHunt` / `_updateHuntBtn`.
> The *server*-side claim (`s.huntMode` absent, roll is plain `baseRate`) remains exactly true, and so does
> *"there is no guaranteed-encounter mode"* — the new one is a doubling, not a certainty. What is now wrong
> is the blanket sentence. Tracked as **§AUDIT-03be** (this is its seventh site). *A retired feature's
> vocabulary is not free to re-use.*

---

## 4. As-built inventory (verified live 2026-08-14)

| Piece | Anchor at HEAD | State |
|---|---|---|
| Kernel encounter block | `` `src/js/mover.js:encounter: { eligible: destKind === 'empty', baseRate }@65` `` | ✅ unchanged — **no kernel change was ever required** |
| Sea-lane parse | `` `src/js/wbapi-server.js:function getSeaLanes()@1018` `` | ✅ from `_rawSrc`, cached by source ref |
| Rate-table parse | `` `src/js/wbapi-server.js:function getEncounterRateTable()@1074` `` | ✅ **stronger than spec** (§5) |
| Server terrain inference | `` `src/js/wbapi-server.js:function terrainAt(r, c)@1091` `` | ✅ mirrors `` `function _inferTerrain(r, c)@28383` `` |
| World inputs wired | `` `src/js/wbapi-server.js:function getMoverWorld()@1113` `` | ✅ `terrainAt` + `encounterRate`; **no `ferryEdges`** |
| Per-session PRNG | `` `src/js/wbapi-server.js:function seededNext(s)@1147` `` | ✅ mulberry32 over `s.rngState` |
| Flat tier weights | `` `src/js/wbapi-server.js:const BASE_TIER_WEIGHTS@1158` `` | ✅ `{trivial:40, easy:35, medium:20, hard:4, deadly:1}` — byte-exact to Inc 2 |
| Monster draw | `` `src/js/wbapi-server.js:function pickMonster(terrain, s)@1162` `` | ✅ returns `{key, name, tier}` |
| The instanced roll | `` `src/js/wbapi-server.js:s.encounter = (seededNext(s) < mres.encounter.baseRate)@8890` `` | ✅ §4.4's pseudo-code, near-verbatim |
| Idle prune + env override | `` `src/js/wbapi-server.js:function sessionPrune()@93` `` · `` `src/js/wbapi-server.js:const SESSION_TTL = parseInt(process.env.SESSION_TTL_MS@76` `` | ✅ prod-inert |
| Parity guard | `src/scripts/check-terrain-parity.js` (196 lines), in `check:walk` | ✅ green |
| Harness | `src/tests/mud-harness.mjs` (1,447 lines), `npm run test:mud` | ⚠ **267/269** — §7 |
| CI | `mud` job in `.github/workflows/walk-invariants.yml` | ✅ present |

**Pointer fidelity: 12/12 byte-exact at `7f4b73c`** — `SESSIONS`, `SSE_CLIENTS`, `SESSION_TTL`,
`broadcastCell`, `getMoverWorld`, the four `/api/session/*` routes, the `if (!mres.ok)` 409 branch cited as
*"~line 7507"*, and the three HTML anchors. `mover.js:60–61` is `terrain` then `baseRate`, exactly as
claimed. The report measured its own file rather than remembering it.

---

## 5. Spec → shipped delta table

| § | Specified | Shipped | Verdict |
|---|---|---|---|
| 4.2 | `terrainAt`: lane→`ocean`; else majority of 4 orthogonal named neighbours; ties→first-seen; none→`midlands` | identical, **plus** a `ROAD_CELLS`→`'road'` step inserted second | **EXTENDED** — §NAV-01b added it to *both* sides symmetrically; `road:0` is now a rate-table key |
| 4.2 | rate table: *"parse the literal, **or** inline a copy with a parity assertion"* | **parsed** — the server keeps **no copy** | **STRONGER** — no second table to drift |
| 4.3 | flat tier weights; document the notoriety divergence | shipped, and the server *comments its divergence back at this report* by name (`@1155`) | **SHIPPED** — but the list has since grown (§8) |
| 4.4 | per-session `s.seed`/`s.rngState`, mulberry32, roll on the empty-cell success path | verbatim | **SHIPPED**, and later **adopted upstream** — below |
| 4.5 | keep the ferry branch, author `FERRY_EDGES` later | `95c4143` **deleted** the branch instead | **RESOLVED BY DELETION** — `ferryEdges` (9 commits) / `FERRY_EDGES` (12) are RETIRED, not never-shipped; 0 at HEAD |
| 5 | harness properties (a) delivery, (b) instancing, (c) social state, (d) TTL prune | all four built | (a)(b)(c) ✅ · **(d) ✅ then, ❌ now** (§7) |
| 6 | *"assert the server's `TERRAIN_ENCOUNTER_RATE` copy === the client's table"* | no copy exists; guard asserts parse round-trip + full-band agreement | **SUPERSEDED, upward** |
| 8 | *"Ferry deferred, not deleted"* · *"No `huntMode`"* | ferry deleted the same day; `huntMode` re-minted 12 days later | **BOTH OVERTAKEN** — annotated, not removed |

**The seeded stream went the other way.** §4.4 called the per-session PRNG *"mandatory, not a nicety — the
only reason the server can avoid `Math.random()`."* Twenty-six days later `c22f4f0` (§VM-01-B) moved the
**single-player client** onto the same algorithm: `` `function _seededNext()@6434` `` is byte-identical to
the server's but for a lazy bootstrap, and `check:rng` (CI gate #10) proves it — **6,000 draws across 12
seeds, client == server, duel kernel included.** A save file now fully determines its future rolls. A
server-side test convenience became a property of the whole game, and it is the largest thing this two-hour
report produced.

---

## 6. Risk-register outcomes

| Call made in 2026-06 | Outcome at HEAD |
|---|---|
| No per-cell mutex needed (single-threaded Node) | **Correct** — no locking has ever been added |
| Instancing is structural: the roll touches only `s.*` | **Correct, and it held under pressure.** §MESH-01h later voids a sentry-guarded encounter *after* the roll, precisely so the stream still advances and the trace stays replayable |
| `s.encounter` is additive; nothing changes type | **Correct** — `who` still serialises `state` as the lifecycle string |
| 409 block path is right; leave it alone | **Correct** — untouched through §MESH-01/02 and §NAV-01f/g |
| Ferry server-only would be an undetectable parity break | **Correct in principle, moot in fact** — the branch was deleted rather than fed |
| Named cells are not encounter-eligible | **Correct** — `` `function _enterEmptyCell(r, c)@28420` `` is still the only client site rolling against the terrain rate |

Six calls, six correct. The report's weakest passages are not judgements but a blanket sentence (§3) and a
timing constant (§7).

---

## 7. Verification at HEAD (2026-08-14)

**Parity guard — green, and exactly the numbers Inc 1 claimed:**

```
A   rate-table keys = 15    (client == server: true)      ← Inc 1 said "15 keys"
A2  SEA_LANES cells = 59    (client == server: true)      ← Inc 1 said "59 cells"
A3  ROAD_CELLS cells = 410  (client == server: true)      ← §NAV-01b, added later
B   terrainAt agree = 10440/10440   diffs = 0             ← Inc 1 said "all 10440 band cells"
```

**Harness — `npm run test:mud` exits 1: 267 passed, 2 failed, three consecutive runs, deterministic.**
The two failures are property **(d)**, this report's own Inc 4:

```
[D] idle session past SESSION_TTL is pruned + its SSE closed
  ✗ after idle TTL, exactly one session survives
  ✗ Warm (kept active) survives; Ghost (idle) is pruned
  ✓ pruned Ghost's SSE stream was closed by the server
  ✓ pruned Ghost session is gone (look 404s)
```

**The prune is not broken; the stopwatch is.** Re-created in isolation the scenario passes — one survivor,
Warm. Instrumented inside the full run, `who` returns **count 0**: *both* sessions were reaped.
`sessionPrune()` runs at the **top of every `/api/session/*` request**, before `look` refreshes `lastSeen` —
correct behaviour, since a client silent longer than the TTL should be pruned by its own late ping. But
section [D] sets `TTL_MS = 700` with keep-alives every 280 ms, and by then five node servers are live.
Measured round-trips in one run: **217 ms, 463 ms, 644 ms** — so the second keep-alive was issued **744 ms**
after the first, past the TTL, and Warm's own keep-alive killed it. Under 300 ms of margin, against a
harness that has grown 11× since the constant was chosen. Filed as **§DX-02ca**.

**Growth.** **18/18** at Inc 3 (`a9ee5eb`), **24/24** at Inc 4 (`8a280af`) — both byte-exact against those
commits. At HEAD: **269 assertions across 26 lettered sections**, 1,447 lines, and the acceptance surface for
§MESH-01 (a–j), §MESH-02, §NAV-01f/g, the duel kernel, the no-dupe ledger and the ACL. Four properties
written to prove one design decision became the repo's entire multiplayer test rig.

---

## 8. Defects found → BACKLOG

- **§DX-02ca** 🟢 — the [D] TTL assertion is red, which means `npm run test:mud` exits 1 and **CI's `mud`
  job fails on any push touching the mover, the server or the harness**. Three live docs
  (`BACKLOG.md`, `potential.md`, `plan-archive.md`) still record the harness as **269/269**.
- **§AUDIT-03bg** 🟡 — **§4.3 logged one SP/MP encounter divergence; there are now four**, and none of the
  three new ones is written down anywhere. The client's roll at
  `` `function _enterEmptyCell(r, c)@28420` `` applies, in order: `_partyEncounterRate` (§MESH-01f — **×0.5
  with a co-present ally**, 0 with a sentry), then §KG-01's `` `if (S_story.huntMode) baseRate = Math.min(0.8, baseRate * 2);@28440` ``,
  then a monster draw that is both notoriety-weighted *and* §KG-01 level-biased. The server applies none of
  them. `check:terrain` fences the *inputs* — the table and `terrainAt` — and nothing fences the **applied
  rate**, which is exactly where three later tracks widened the gap. The row also carries a stale cross-file
  pointer: the comment at HTML line 28441 cites `wbapi-server.js:8784` for the server's matching roll, which
  now lives at **8890**. (Its two neighbours, `:1147` and `:1155`, are still exact.)
- **§AUDIT-03be** — extended, not re-filed: this report is the **seventh** site certifying a Hunt Mode
  removal that was undone. Annotated in place in §3 above.

---

## 9. Ship record

Six commits, **2026-06-26, 11:41 → 13:33 — one hour and fifty-two minutes from spec to closed series.**

| Commit | Time | Increment |
|---|---|---|
| `7f4b73c` | 11:41 | Spec (this report) |
| `65604e9` | 11:52 | **Inc 1** — world inputs + `src/scripts/check-terrain-parity.js` into `check:walk`. No behaviour change to `move`. |
| `278cfdc` | 12:41 | **Inc 2** — the instanced roll, surfaced on the move response and `who`. Verified live on a throwaway `PORT=1368`: 32/40 seeds fired, **31 distinct traces from 40 seeds**. |
| `a9ee5eb` | 12:59 | **Inc 3** — `src/tests/mud-harness.mjs`, properties (a)–(c), **18/18**. Caught and fixed a real §CELL-07 bug: `session/say` double-delivered the sender's own line. |
| `8a280af` | 13:17 | **Inc 4** — property (d) via a second server with `SESSION_TTL_MS`; **24/24**; CI `mud` job. |
| `95c4143` | 13:33 | **§WALK-5-FU** — delete the inert `ferryEdges` branch, both MOVER:CORE copies byte-identical. Series closed. |

**Files:** `src/js/wbapi-server.js` · `src/scripts/check-terrain-parity.js` (new) · `package.json` · `src/tests/mud-harness.mjs` (new) · `.github/workflows/walk-invariants.yml` · `index.md`.

---

## 10. Notes for the next reader

- **A pending encounter survives a blocked move** — the 409 returns before the roll, because no step
  happened.
- **Ferry is gone, not deferred.** The original §8 said the opposite for about twenty minutes.
- **A water crossing is terrain, not a permission.** The strongest sentence the §WALK series produced, and
  this report is where the last exception to it was surrendered.

---

*§DOC-02bm re-verification, 2026-08-14. HISTORY document — deltas are annotated, never deleted.*
