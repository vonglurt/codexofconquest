<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §VM-01-B · *One stream, two machines*: seed the client RNG

> **Child lab report of** `lab-reports/lab-report-javascript-mud.md` (the structural read that opened §VM-01) and of the §VM-01 track in **[BACKLOG.md](../BACKLOG.md)**. **Type:** *Design review before implementation* (Lab Report Policy row 4 — "IEEE-format spec locking data shapes and flow before any HTML edit"). Per the §VM-01 preamble: *"every increment locks its own child lab report (data shapes + flow) before any HTML edit."* **This is that lock for Inc B. No product code is touched by this report.**
>
> **Theme (matched to `story.md` / the track's *No Word for Wait*):** the parity contract that guarantees `moverMove` is byte-identical on client and server **stops exactly where the dice are.** The kernel is fenced; the generator that consumes its answer is not. Inc A gave the VM a `yield`; Inc B gives the client and server **one shared, replayable stream** so the most-rolled event in the game — the encounter — is the same on both machines and reproducible from a save.
>
> **Anchors below were grepped from the live `roll2hit-v3.html` (37,618 lines, 5.13 MB) and `js/wbapi-server.js` this session, working tree at branch `feat/board-01-warrants-board` with the uncommitted §VM-01-A change in place.** They have drifted from the BACKLOG §VM-01-B row (measured earlier): `_rollSkill` d20 `21739 → 21879`, encounter roll `27685 → 27836`, `_weightedMonsterPick` `→ 37190`. **Re-grep before editing — these will drift again.**

---

## 1. Abstract

The server carries a per-session deterministic PRNG — `seededNext(s)` (`js/wbapi-server.js:1147`), a mulberry32 that advances `s.rngState` — and its own comment names the gap it leaves: *"a known SP/MP divergence logged in lab-report-walk5-mud-harness.md §4.3"* (`1155`). The server rolls each encounter from that seeded stream (`8784`); **the client rolls the same encounter from `Math.random()`** (`27836`), an unseeded, unrecordable generator one line *outside* the fenced kernel where no parity script can see it.

The irony the parent report flagged: `DUEL:CORE` hand-writes a **synchronous SHA-256** rather than trust `crypto.subtle` to agree across environments, ships commit-reveal, and carries *its own* mulberry32 (`__duelRng`, `10161`) — the duel path is paranoid about cross-machine determinism — and then the single most-rolled event in the game is left unseeded on the client. **The parity contract covers the kernel and stops where the dice land.**

**Inc B ports `seededNext` to the client as `_seededNext()`, backs it with a persisted `S_story.rngState`, and converts the four named game-state roll pipelines to draw from it.** After this, client and server use the **byte-identical** mulberry32; a save file fully determines the future stream (bug-repro-from-save, replayable traces, server-verifiable rolls); and a new CI guard `scripts/check-rng-parity.js` asserts the two implementations can never drift. It is **not** a behaviour-neutral no-op like Inc A — it deliberately *changes which numbers come out* of the converted sites (they now read a seeded stream instead of `Math.random()`), but it changes **no distribution, no gameplay rule, and no message** — every roll keeps its exact range, weight table, and consumer.

---

## 2. Method

A grep of all 62 `Math.random()` sites in the client (up from the BACKLOG's "59" — three added by intervening content), read in context and sorted into *game-state rolls the server also owns / could verify* vs *cosmetic-or-combat rolls out of this increment's named scope*. The server side is one function, quoted verbatim below.

**The server stream, in full (`js/wbapi-server.js:1146`–`1152`):**

```js
// mulberry32 — tiny deterministic PRNG; advances s.rngState, returns [0,1).
function seededNext(s) {
  let t = (s.rngState = (s.rngState + 0x6D2B79F5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
```

**The client encounter roll it diverges from (`27835`–`27837`):**

```js
if (S_story.huntMode) baseRate = Math.min(0.8, baseRate * 2);
if (Math.random() < baseRate) {                 // ← same event, unseeded generator
  const monster = _weightedMonsterPick(terrain);
```

**The three mulberry32s already in the file are the *same algorithm*** — `__duelRng` (`10161`) writes `1 | a` / `61 | t` / `t = (…) ^ t` where the server writes `a | 1` / `t | 61` / `t ^= …`; XOR and OR commute, so the streams are identical. `_seededNext` will copy the **server's exact textual form** so the parity checker (§5) can assert byte-for-byte agreement, not just mathematical equivalence.

---

## 3. Concepts added (one field, one function, one guard)

| Concept | Shape | Where it lives | Persisted? |
|---------|-------|----------------|-----------|
| **`rngState`** | signed-32-bit int; `0` = unseeded sentinel | added to `_S_DEFAULTS()` (`22620`) — authoritative per §STATE-INIT | **yes** — the whole point; it rides every save |
| **`_seededNext()`** | `() → [0,1)` — mulberry32, byte-identical to server `seededNext`, reads/writes `S_story.rngState` | top-level `HELPERS` region (`6417`), a sibling of `roll()`/`rollN()`; **not** in a kernel | n/a (draws state) |
| **`check-rng-parity.js`** | extract-and-run guard: client `_seededNext` ≡ server `seededNext` for every seed | `scripts/`, wired into `npm run check:walk` | n/a |

No new opcode, no new gate term, no new message, no new movement-refusal. One new `S_story` field, one helper, one CI check.

---

## 4. The transformation

### 4.1 The client stream (new helper, `HELPERS` region)

```js
// §VM-01-B — client-side seeded PRNG stream (mulberry32), byte-identical to the
// server's seededNext (js/wbapi-server.js:1147). rngState lives in S_story, so a
// save fully determines the future stream: bug-repro from a save file, replayable
// traces, server-verifiable rolls. Closes the SP/MP divergence the server documents
// against itself ("a known SP/MP divergence", wbapi-server.js:1155).
function _seededNext() {
  // Lazy one-time seed — a BOOTSTRAP, not a game-state roll: Date-derived, never
  // Math.random(); thereafter the stream is deterministic and persisted. Covers
  // fresh games AND pre-§VM-01-B saves (which load with rngState defaulted to 0).
  if (!S_story.rngState) S_story.rngState = (Date.now() >>> 0) || 1;
  let t = (S_story.rngState = (S_story.rngState + 0x6D2B79F5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
```

The four arithmetic lines are **copied verbatim** from the server; only the state cell changes (`s.rngState` → `S_story.rngState`). The lazy guard is the entire migration story (§6.2).

### 4.2 The four converted pipelines — same range, same weights, seeded source

| Site | Line | Before | After |
|------|-----:|--------|-------|
| encounter fire | `27836` | `if (Math.random() < baseRate)` | `if (_seededNext() < baseRate)` |
| `_rollSkill` d20 | `21879` | `Math.ceil(Math.random() * 20)` | `Math.ceil(_seededNext() * 20)` |
| `_weightedMonsterPick` hunt-bias | `37198` | `S_story.huntMode && Math.random() < 0.8` | `S_story.huntMode && _seededNext() < 0.8` |
| `_weightedMonsterPick` draw | `37208` | `weighted[Math.floor(Math.random() * weighted.length)]` | `weighted[Math.floor(_seededNext() * weighted.length)]` |
| `_rollD100Loot` d100 | `24009` | `Math.floor(Math.random() * 100)` | `Math.floor(_seededNext() * 100)` |
| `_rollD100Loot` gold | `24019` | `Math.floor(Math.random() * 200) + 50` | `Math.floor(_seededNext() * 200) + 50` |
| `_rollD100Loot` weapon pool | `24032` | `pool[Math.floor(Math.random() * pool.length)]` | `pool[Math.floor(_seededNext() * pool.length)]` |
| `_rollMonsterWeaponDrop` base | `24053` | `pool[Math.floor(Math.random() * pool.length)]` | `pool[Math.floor(_seededNext() * pool.length)]` |
| `_rollMonsterWeaponDrop` degrade | `24054` | `Math.ceil(Math.random() * 6)` | `Math.ceil(_seededNext() * 6)` |

Every substitution is `Math.random()` → `_seededNext()` in place. **No range, cap, weight table, or fallback changes.** The `Math.min(99, …)`/`Math.max(0, _luckMod())` clamp, the `_notorietyWeights` table, the 3-attempt loop, the `Finders Keepers` guarantee — all untouched. The nine sites now interleave into **one** `S_story.rngState` stream in call order.

### 4.3 The "Pure roll" label becomes honest (the BACKLOG's bonus)

`_rollSkill`'s header comment (`21870`) already reads *"Pure roll — single source of the skill-check math."* Today it is a misnomer: the roll reads hidden global entropy (`Math.random()`) and cannot be reproduced. After Inc B the randomness is **threaded through explicit, persisted state** — given `S_story.rngState`, the roll is reproducible. The comment gains a clause noting it now draws the seeded stream; it stops being a claim the code falsifies.

---

## 5. The parity guard — `scripts/check-rng-parity.js`

Mirrors `check-terrain-parity.js`: extract the **real** functions from both sources (no replicas), run them in a sandbox, assert agreement. Wired into `npm run check:walk` as `check:rng`.

- **Extract** `seededNext` from `js/wbapi-server.js` and `_seededNext` from `roll2hit-v3.html` via the shared `extractFn` brace-counter.
- **P1 — stream parity.** For a spread of seeds (incl. edge u32 values and negatives), run **N draws** on each; assert the `[0,1)` sequences are **byte-identical**. This is the invariant: *one algorithm, two machines.*
- **P2 — determinism.** Same seed twice on the client → identical sequence (proves the stream is a pure function of `rngState`).
- **P3 — DUEL cross-check.** Extract `__duelRng` (`10161`) and assert it agrees too — so the three mulberry32s in the tree can never silently diverge.
- **P4 — field presence.** Assert `rngState` is declared in `_S_DEFAULTS()` (grep) — the authoritative-shape guarantee (§STATE-INIT), so the field can never be dropped without tripping CI.

Exit 0 iff all hold; exit 1 with the first divergence's seed + draw index.

---

## 6. Design decisions — LOCKED (both flagged for veto)

The §VM-01-B "Lock first" clause names one question (save-migration / seed lifetime); a second (roll-site scope) is implicit in "cosmetic ones stay." Both are locked here and **flagged for the user's veto on the next `continue`** (house precedent: §VM-01-A §6, §BOARD-01-FU7/FU8 — design calls made in the lab report, veto-flagged).

### 6.1 Seed lifetime — **per-save fixed, lazily bootstrapped; never per-session re-randomised.**
The stated payoff *is* the answer: *"bug repro from a save file, replayable traces, server-verifiable encounters"* is only possible if the seed **persists in the save** and the stream is a pure function of it. So `rngState` is a persisted `S_story` field; a fresh game bootstraps it once and thereafter the save fully determines every future roll. Reload a save → the exact same encounters/loot/skill rolls follow. A tester or the §WALK-5 harness fixes a seed by writing `rngState` directly. **Veto axes:** (a) *per-session re-seed* — rejected, it destroys replay-from-save, the entire deliverable; (b) *fixed constant seed for all new games* — rejected, every new game would be byte-identical; (c) *bootstrap from `Math.random()` once instead of `Date.now()`* — rejected to keep the "no new game-state `Math.random()`" invariant literally true (a one-time `Date`-derived seed is a bootstrap, not a per-roll draw).

### 6.2 Save-migration — **none. Defaults-in-the-middle + lazy bootstrap handle every pre-§VM-01-B save.**
Load is `Object.assign(S_story, _S_DEFAULTS(), JSON.parse(raw))` (`23298`/`23314`). A pre-§VM-01-B save has no `rngState`, so the merge supplies the `_S_DEFAULTS()` sentinel `0`; the first `_seededNext()` draw sees `!rngState` and bootstraps. **No version bump, no backfill, no migration branch** — an old save simply gains a deterministic stream from its load point forward, and a mid-stream save (new) carries its live `rngState` through untouched. (Contrast §VM-01-A, whose §6.3 lock was "the suspension *never* persists"; here the opposite — the seed is *exactly* what must persist — and both are handled by the same serialization boundary.) *Micro-edge:* mulberry32's advanced state could in principle land on `0` once every ~4·10⁹ draws, which would trigger a one-step re-bootstrap; observationally never, and harmless (documented in the helper comment).

### 6.3 Roll-site scope — **the four named pipelines only; combat / fishing / cosmetic stay on `Math.random()` this increment.**
Converted: encounter fire, `_rollSkill`, `_rollD100Loot` + `_rollMonsterWeaponDrop` (the generic loot/drop pipeline), `_weightedMonsterPick` — the sites the server rolls or could verify, exactly the BACKLOG's named set. **Left on `Math.random()`:** the generic `roll()`/`rollN()` dice, the story-battle inline d20s (`~24090`–`25363`), fishing (`26165`/`29838`+), death saves (`25359`), name/madness/town-crier flavour, and bespoke one-off quest-item drop chances (e.g. the Worn Ledger Book `24796`). Rationale: the combat surface is far larger and riskier, and the MP duel path **already** has its own seeded stream (`__duelRng`); seeding client combat is a separate, later increment (or never, if MP combat stays on the duel stream). **Veto axis:** widen to combat d20s now (bigger blast radius, no server-verification payoff this increment).

---

## 7. Exact anchors (live file, this session)

| Symbol | Line | Note |
|--------|-----:|------|
| server `seededNext` | `js/wbapi-server.js:1147` | the stream to mirror; encounter roll `8784`, `pickMonster` `1162` |
| server divergence comment | `js/wbapi-server.js:1155` | *"a known SP/MP divergence"* — the self-documented gap Inc B closes |
| `__duelRng` (DUEL:CORE) | `10161` | the third mulberry32 — same algorithm; P3 cross-checks it (do **not** edit the kernel) |
| `roll()` / `rollN()` | `6417` / `6421` | HELPERS region — `_seededNext`'s home (top-level, no kernel) |
| **`_seededNext`** | **new @ `~6425`** | the client stream |
| `_rollSkill` d20 | **`21879`** | `Math.ceil(Math.random()*20)`; "Pure roll" comment `21870` |
| `_rollD100Loot` | `23996` | d100 `24009`, gold `24019`, weapon pool `24032` |
| `_rollMonsterWeaponDrop` | `24044` | base `24053`, degrade d6 `24054` |
| encounter fire | `27836` | `Math.random() < baseRate` |
| `_weightedMonsterPick` | `37190` | hunt-bias `37198`, draw `37208` |
| `_S_DEFAULTS` | `22620` | add `rngState: 0` (authoritative shape, §STATE-INIT) |
| load / autosave | `23298`/`23314` / `23287`ish | `Object.assign(S_story, _S_DEFAULTS(), raw)` — the migration boundary (§6.2) |
| test dir | `tests/integration/` | new `rng-seed.test.js`; `scripts/check-rng-parity.js` |

---

## 8. Invariants preserved (all load-bearing — [CONTRIBUTING.md](../CONTRIBUTING.md))

- **No new game-state `Math.random()`.** Inc B *removes* nine of them and adds **zero**; the only new entropy is a one-time `Date.now()` seed bootstrap (§6.1c), outside every roll path. Board rotation's own "never `Math.random()`; §VM-01-B-safe" note (`35993`) stays true.
- **Three kernels untouched.** `_seededNext` lives in HELPERS (`6417`), ~3,700 lines above `DUEL:CORE`. `__duelRng` (`10161`) is **read** by the parity check, never edited. Gate: git-diff shows **0 kernel sentinels**; `npm run check:walk` parity unchanged (plus the new `check:rng` arm).
- **§STATE-INIT single-source-of-truth.** `rngState` is added to `_S_DEFAULTS()` (the authoritative shape), never to the drifting seed literal; every entry path (New Game / Continue / respawn / NG+) gets the field for free. P4 pins it in CI.
- **Free-Movement / Mission-Gating.** Inc B touches roll *sources*, never the mover. No `S_story`/flag/bit a movement path reads is added. **No new movement-refusal**; no jump travel.
- **Host/Script Separation.** RNG is host infrastructure; no quest datum gains a pointer. The seam moves entropy behind a host helper — the direction the policy mandates.

---

## 9. Test plan

**New: `tests/integration/rng-seed.test.js`** — behaviour of the seeded stream in the live page:

1. **Replayability.** New game, fix `S_story.rngState = K`, take a sequence of steps that force encounter rolls (or call `_seededNext` directly N times); reload the same save (`rngState` restored) and repeat; assert the **identical** roll sequence.
2. **Persistence round-trip.** After some play, `JSON.parse(localStorage.r2h_autosave).rngState` is a finite integer and equals the live `S_story.rngState`; reloading resumes the stream (no re-bootstrap).
3. **Old-save migration (§6.2).** Seed `localStorage` with a save object that has **no** `rngState`; load; assert the game runs and `rngState` becomes a non-zero integer on the first roll (lazy bootstrap), with no exception.
4. **Range integrity.** `_seededNext()` ∈ `[0,1)` over many draws; a d20 built from it stays `1..20`, a d100 `0..99` post-clamp — the converted sites keep their exact ranges.

**New CI: `scripts/check-rng-parity.js`** (§5) — P1 stream parity, P2 determinism, P3 DUEL cross-check, P4 field-presence. Wired as `check:rng` into `npm run check:walk`.

**Regression (must show no *rule* change — only different, still-valid numbers):**
- `quest-runtime-uqf.test.js` — full pass, **no NEW failures vs. the HTML-stashed env baseline** (17 known env failures; the §VM-01-A verdict discipline). `_rollSkill` is a converted site; assertions test pass/fail *routing*, not specific d20 values, so they hold.
- `warrants-board` 25/25 · `uqf-coroutine` 5/5 · `courier-map` 1/1 · `enemy-ai` 4/4 · `kg-quest-chain` 4/4 (none assert specific RNG outputs).
- `node --check` on the extracted `<script>` (parse clean); **0 kernel sentinels** in the diff; **no new movement-refusal**; the full `npm run check:walk` green (incl. the new `check:rng`).

**Verification discipline (carried from §VM-01-A):** stop the WBAPI server before Playwright (Test-Run Rule 2); read the summary line from a file (Rule 1); the verdict is *"no NEW failures vs. a git-stashed run,"* never a raw pass count.

---

## 10. Scope fence — what Inc B does NOT do

- **It does not seed combat.** Story-battle d20s, damage dice, death saves, flee rolls stay on `Math.random()` (§6.3). The MP duel path already has `__duelRng`; unifying client combat onto the session stream is a separate increment.
- **It does not make SP and MP roll the *same monster*.** The server's `pickMonster` is flat-weighted (`BASE_TIER_WEIGHTS`) while the client's `_weightedMonsterPick` is notoriety-weighted with a Hunt-Mode bias — a divergence the server *already documents* (`1155`). Inc B unifies the **PRNG algorithm and stream**, so a single roll is server-verifiable; full monster-pick parity (aligning the weight tables) is out of scope and may be intentional design.
- **It does not build a replay harness or a save-seed UI.** It makes traces replayable *in principle* (the seed persists, the algorithm matches); consuming that — a §WALK-5 client-side replay, a "share your seed" feature, server-side roll verification — is downstream.
- **It does not touch `_legacy_fn`'s in-data `Math.random()`** (e.g. `quest_1367_f_plague` `13810`). That is §VM-01-E's blocker (arbitrary code defeats static analysis), called out there, not here.

**Forward pointers:** A · B · C are independent (A shipped). B unblocks nothing structurally but pays down a self-documented divergence and makes every converted roll reproducible — a prerequisite for any future replay/verification work. C (`_ENV` state-passing) remains the enabler for D/E.

**Prior art:** mulberry32 (Tommy Ettinger / bryc) is the reference PRNG already in the tree three times; Inc B simply stops the client's most-rolled event from being the one place that ignores it.

---

## 11. Verdict

**✅ SHIPPED 2026-07-22 exactly as locked** (not committed — user rule). Footprint landed as scoped: **1 field (`rngState` in `_S_DEFAULTS()`) + 1 helper (`_seededNext`) + 9 one-line `Math.random()`→`_seededNext()` substitutions + 1 CI script (`scripts/check-rng-parity.js`) + 1 npm wire (`check:rng` in `check:walk`) + 1 test file (`tests/integration/rng-seed.test.js`, 5/5)**. Both §6 design calls shipped as recommended (seed lifetime = per-save fixed, lazily bootstrapped; scope = the four named pipelines).

- **Cross-source parity (the deliverable) — `check:rng` green:** P1 client `_seededNext` ≡ server `seededNext` byte-for-byte over **6000 draws / 12 seeds**; P2 determinism; P3 DUEL `__duelRng` agrees (all three mulberry32s are one algorithm); P4 `rngState` declared in `_S_DEFAULTS()`.
- **Behaviour (game-facing) — `rng-seed.test.js` 5/5:** stream is a pure function of `rngState`; persists through the REAL `storyAutoSave`/`storyLoadSave` and resumes *exactly* (no re-bootstrap); a pre-§VM-01-B save (no `rngState`) loads and lazily bootstraps a non-zero seed with no exception; ranges intact ([0,1) / d20 1..20 / d100 0..99); `_rollSkill` reproducible from the seed.
- **Regression (no rule changed) — `quest-runtime-uqf` 286 passed / 17 failed = the §VM-01-A env baseline EXACTLY (0 NEW failures).** The 17 are the documented story-tab render quirk; every forced-outcome skill_check test is RNG-*source*-independent (fail forced by `dc:99` vs a max-24 roll; pass forced by `wis:40` where the ability mod alone clears any DC), so the seeded d20 cannot flip them. Also green: `warrants-board` 25/25 · `uqf-coroutine` 5/5 · `courier-map` 1/1 · `enemy-ai` 4/4 · `kg-quest-chain` 4/4 · `hunt-mode` · `death-loot-grave` · `effort-xp` (49 in one run).
- **Invariants:** HTML working-tree diff carries **0 kernel sentinels** (mover/rooms/**duel** parity all still byte-identical — `__duelRng` was *read* by the checker, never edited); **no new game-state `Math.random()`** (nine removed, zero added; the only new entropy is a one-time `Date.now()` seed bootstrap outside every roll path); no new movement-refusal; main inline script parses clean (4.89 MB, 0 errors).

The self-documented SP/MP divergence (`js/wbapi-server.js:1155`) is closed at the algorithm level: the client's most-rolled event now draws the same mulberry32 the server does, and a save file fully determines the stream that follows. **Next:** §VM-01-C (`_ENV` state-passing — the enabler for D/E) is the independent follow-on; a client-side replay harness or server-side roll verification are the first *consumers* of this seam.

*© 2026 Paul Richeson — MIT License.*
