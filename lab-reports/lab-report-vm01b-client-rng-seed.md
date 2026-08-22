<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §VM-01-B · *One stream, two machines*: seed the client RNG

> **Type:** design review before implementation (Lab Report Policy row 4). **Child of** `lab-reports/lab-report-javascript-mud.md` and the §VM-01 track in **[BACKLOG.md](../BACKLOG.md)**. **Shipped** 2026-07-22, committed **`c22f4f0`** (the combined §VM-01-A/B/C landing).
>
> **§DOC-02cn verification pass — 2026-08-21.** Re-measured against live `roll2hit-v3.html` (**38,712** lines) and `js/wbapi-server.js` (**11,671** lines), 30 days after the ship. Original text 211 lines, this rewrite 160; it is the same lock, shortened, with a spec→shipped delta table and an errata section. **Nothing was deleted for being wrong** — a claim that did not hold is marked and kept.

---

## 1. Abstract

The WBAPI server carries a per-session deterministic PRNG — `js/wbapi-server.js:function seededNext(s)@1147`, a mulberry32 advancing `s.rngState` — and its own comment names the gap it leaves: *"a known SP/MP divergence logged in lab-report-walk5-mud-harness.md"* (`js/wbapi-server.js:divergence logged in lab-report-walk5-mud-harness.md@1157`). The server rolls each encounter from that seeded stream; the client rolled the same encounter from `Math.random()` — an unseeded, unrecordable generator one line outside the fenced kernel, where no parity script can see it.

The irony the parent report flagged: `DUEL:CORE` hand-writes a synchronous SHA-256 rather than trust `crypto.subtle` to agree across environments, ships commit-reveal, and carries its own mulberry32 (`function __duelRng(seed)@10304`). The duel path is paranoid about cross-machine determinism — and then the most-rolled event in the game was left unseeded. **The parity contract covered the kernel and stopped where the dice landed.**

Inc B ports `seededNext` to the client as `function _seededNext()@6434`, backs it with a persisted `S_story.rngState`, converts four named roll pipelines to draw from it, and adds a CI guard asserting the two implementations can never drift. It is **not** behaviour-neutral like Inc A: it deliberately changes *which numbers come out* of the converted sites, while changing **no distribution, no rule, and no message**.

---

## 2. Intention, inspiration, and what it buys the player

The inspiration is the oldest bug-report problem in games: *"it happened once and I cannot make it happen again."* A roll drawn from `Math.random()` is a fact with no history. A roll drawn from a persisted seed is a fact you can **replay**.

Three concrete playability payoffs, in the order a player would meet them:

1. **A save file becomes a reproducible world.** Load the same save and the same encounters, the same loot, the same skill checks follow. That turns "the game ate my run" from an anecdote into a reproducible artifact — and it is what makes a soft-lock *provable* rather than suspected.
2. **The wandering monster stops being a rumour.** The encounter roll at `if (_seededNext() < baseRate)@28441` is the single most-fired event in the game. Once it and the monster draw share one stream, the same seed produces the same road — so terrain balance, Hunt Mode, and notoriety weighting can be tuned against a fixed trace instead of against vibes.
3. **Single-player and multiplayer start speaking the same dialect.** The client and the MUD server now advance byte-identical generators, so one roll is server-verifiable. That is the first brick of an honest shared world, and it costs the player nothing today.

The deliberate cost, locked in §5.3: **combat stays unseeded.** A battle is still a fresh coin every time. That is a design choice about where determinism helps (diagnosis) and where it would flatten the experience (the swing of a fight), and it is revisited in §8.

> *The duel path builds a SHA-256 by hand because it does not trust two machines to agree on a hash. Then the game rolls its most common event on `Math.random()` and hopes.*

---

## 3. Method

Every `Math.random()` site in the client was greped, read in context, and sorted into *game-state rolls the server also owns or could verify* vs *cosmetic-or-combat rolls out of scope*. The server side is one function, quoted verbatim below. **The four arithmetic lines are copied, not paraphrased**, so the guard can assert byte-for-byte agreement rather than mathematical equivalence.

```js
// mulberry32 — tiny deterministic PRNG; advances s.rngState, returns [0,1).
function seededNext(s) {
  let t = (s.rngState = (s.rngState + 0x6D2B79F5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
```

`__duelRng` writes `1 | a` / `61 | t` / `t = (…) ^ t` where the server writes `t | 1` / `t | 61` / `t ^= …`; OR and XOR commute, so the streams are identical. **Verified empirically, not by argument** — guard phase P3, below.

---

## 4. Concepts added — one field, one function, one guard

| Concept | Shape | Home | Persisted |
|---------|-------|------|-----------|
| `rngState` | signed-32-bit int; `0` = unseeded sentinel | `_S_DEFAULTS()` (authoritative per §STATE-INIT) | **yes** — it rides every save |
| `_seededNext()` | `() → [0,1)`, mulberry32, byte-identical to the server | top-level HELPERS region, sibling of `roll()`/`rollN()`; **not** a kernel | n/a (draws state) |
| `check-rng-parity.js` | extract-and-run guard: client ≡ server for every seed | `scripts/`, wired as `check:rng` into `npm run check:walk` | n/a |

No new opcode, gate term, message, or movement-refusal.

---

## 5. Design locks — both flagged for veto, both shipped as recommended

### 5.1 Seed lifetime — per-save fixed, lazily bootstrapped; never per-session re-randomised

The stated payoff *is* the answer: replay-from-save is only possible if the seed persists and the stream is a pure function of it. A fresh game bootstraps once from `Date.now()`; thereafter the save fully determines every future roll. **Rejected axes:** per-session re-seed (destroys the entire deliverable); one fixed constant for all new games (every new game byte-identical); bootstrap from `Math.random()` (would falsify the *no new game-state `Math.random()`* invariant — a one-time `Date`-derived seed is a bootstrap, not a draw).

### 5.2 Save-migration — none required

Load is `Object.assign(S_story, _S_DEFAULTS(), JSON.parse(raw))@23819`. A pre-§VM-01-B save has no `rngState`, so the merge supplies the sentinel `0`; the first draw sees `!rngState` and bootstraps. No version bump, no backfill, no migration branch. *Micro-edge:* the advanced state could land on `0` roughly once every 4·10⁹ draws, triggering a one-step re-bootstrap — harmless, and documented in the helper.

### 5.3 Roll-site scope — the four named pipelines only

Converted: encounter fire · `_rollSkill` · the generic loot/drop pipeline (`_rollD100Loot` + `_rollMonsterWeaponDrop`) · `_weightedMonsterPick`. Left on `Math.random()`: the generic dice `function roll(sides)@6417` / `function rollN(sides, count)@6421`, story-battle d20s, fishing, death saves, flavour text, and bespoke one-off quest-item drops. Rationale: the combat surface is larger and riskier, and the MP duel path already has its own seeded stream.

---

## 6. The guard — `scripts/check-rng-parity.js`

Mirrors `check-terrain-parity.js`: extract the **real** functions from both sources with a brace counter (`scripts/check-rng-parity.js:function extractFn(srcText, name)@37`), run them in a sandbox, assert agreement. No replicas.

- **P1 — stream parity.** `_seededNext` ≡ `seededNext` byte-for-byte over N draws across a seed spread including edge u32 values (`scripts/check-rng-parity.js:const SEEDS = [1, 2, 7, 42@63`, `scripts/check-rng-parity.js:const DRAWS = 500;@64`).
- **P2 — determinism.** Same seed twice on the client → identical sequence.
- **P3 — DUEL cross-check.** `__duelRng` must agree, so the three mulberry32s cannot silently diverge.
- **P4 — field presence.** `rngState` declared in `_S_DEFAULTS()`, so the cell cannot be dropped without tripping CI.

Exit 0 iff all hold; exit 1 with the first divergence's seed and draw index.

---

## 7. Spec → shipped delta table (re-measured 2026-08-21)

| # | Locked claim | Status at HEAD | Evidence |
|---|--------------|----------------|----------|
| 1 | `rngState` added to `_S_DEFAULTS()`, sentinel `0` | **exact** — the second field in the literal | `const _S_DEFAULTS = () => ({@23062`, `rngState: 0,@23064` |
| 2 | `_seededNext` byte-identical to the server | **exact** — four arithmetic lines identical; only the state cell differs | `function _seededNext()@6434` vs `js/wbapi-server.js:function seededNext(s)@1147` |
| 3 | Lazy `Date.now()` bootstrap, never `Math.random()` | **exact** | `if (!S_story.rngState) S_story.rngState = (Date.now() >>> 0) || 1;@6440` |
| 4 | 9 one-line substitutions | **9 of 9 live** — 8 direct, 1 now injected (row 5) | `@24546` `@24556` `@24569` `@24590` `@24591` `@28441` `@38245` `@38255` |
| 5 | `_rollSkill` d20 draws the seeded stream | **contract exact, form changed** — §VM-01-D moved `_rollSkill` inside `QUEST:CORE` and the d20 now draws an injected effect | `const d20  = Math.ceil(E.rng() * 20)@22248`, wired at `rng:       () => _seededNext()@22346` in `const QuestRuntime = createQuestRuntime({@22341` |
| 6 | "Pure roll" comment becomes honest | **exact and extended** — the header now names both §VM-01-B and §VM-01-D | `Pure roll@22235` |
| 7 | `check:rng` wired into `check:walk` | **exact** — gate 10 of 16 | `package.json` `check:rng` |
| 8 | P1 6,000 draws / 12 seeds; P2; P3; P4 | **all four green, figures exact** | run this session: `P1 = 6000`, `P3 = 6000`, P2/P4 true |
| 9 | `rng-seed.test.js` 5/5 | **5/5 green 30 days on** | `npx playwright test tests/integration/rng-seed.test.js` → 5 passed (3.6 s) |
| 10 | No new game-state `Math.random()` | **exact** — 59 sites before, 52 after; 9 removed, 0 added | the 2 apparent additions at `c22f4f0` are both *comment text* |
| 11 | Board rotation stays `Math.random()`-free | **exact** | `FNV-1a hash@37039` — the *"never Math.random; §VM-01-B-safe"* note still true |
| 12 | Save-migration = none | **exact** | `Object.assign(S_story, _S_DEFAULTS(), JSON.parse(raw))@23819`, `function storyAutoSave()@23805` |
| 13 | Three kernels untouched | **exact** — and a fourth was added later without disturbing the stream | `function __duelRng(seed)@10304` is read by the guard, never edited |

**Anchor discipline — the strongest result the §DOC-02 program has measured.** Of the report's **28 line-number claims, 27 resolve exactly** against the build it names. The offsets against `c22f4f0^` are `+0` / `+31` / `+37` / `+47`, strictly monotonic — the insertion profile of the uncommitted §VM-01-A change the header says was in the tree. **This independently settles a doubt §DOC-02cm raised.** That pass noted §VM-01-A claims an HTML diff of *"+56/−9"* for a commit whose own message calls the landing indivisible at **+106/−30**, and so could not verify the attribution from the commit. The offsets can: §VM-01-A's share is net **+47**, exactly `+56 − 9`; the whole commit's net is `37,694 − 37,618 = +76`, exactly `+106 − 30`; and B+C therefore account for the remaining +29. Three figures from three sources, and the arithmetic closes. The anchors are not approximate; they are a different, correctly-measured build.

---

## 8. Scope fence — measured 30 days on

| Fence | Verdict |
|-------|---------|
| Does not seed combat | **HOLDS.** Story-battle d20s, damage, death saves and flee rolls are still on `Math.random()`; 49 code sites remain at HEAD |
| Does not unify the *monster pick* | **HOLDS, and the gap has widened.** The server draws on flat tier weights; the client applies ally-halving, Hunt Mode and notoriety bias. §AUDIT-03bg now counts **four** divergences where §WALK-5 logged one |
| Does not build a replay harness or seed UI | **NO PRODUCT SURFACE — but the seam has consumers.** `rngState: 424242` is the fixed seed in four headless UQF harnesses, and `tests/integration/uqf-softlock.test.js` asserts *"the same rngState → byte-identical outcome across two runs."* §VM-01-E's soft-lock prover is the first consumer, exactly as the forward pointer predicted |
| Does not touch `_legacy_fn`'s in-data `Math.random()` | **RETIRED — a later increment closed it.** §VM-01-E rewrote `quest_1367_f_plague`'s 50/50 coin-flip as a nested seeded `skill_check`; there are now **zero** `Math.random()` occurrences anywhere in the `QUEST_DB` region |

**Forward pointers, scored.** A/B/C were independent and all three shipped in `c22f4f0`; D (`9f10bfe`), E (`354b20a`) and F (`c6be7f8`) followed within the week. The report's *"C remains the enabler for D/E"* was correct, and its *"B unblocks nothing structurally"* was too modest — E's reproducibility assertion is only expressible because §5.1 chose a persisted seed over a per-session one. **The lock's conclusion and its reasoning both held.**

---

## 9. Errata — four figures that did not measure true

1. **`js/wbapi-server.js:1155` is off by one, and it was wrong the day it was written.** The quoted phrase *"a known SP/MP divergence"* begins at line **1156** and completes at 1157 — at HEAD *and* at `c22f4f0^`. Line 1155 is the preceding sentence about notoriety scaling. The report cites `1155` three times, and the wrong number was **copied into shipped engine code** at `roll2hit-v3.html:6431`. This is the same family as §DX-02ds and §DX-02dr, and it is the third instance. → **§DX-02du**.
2. **"62 `Math.random()` sites (up from the BACKLOG's 59 — three added by intervening content)."** The parent build holds **59**, and §VM-01-A added none, so the working tree held 59. The BACKLOG's figure was right; the recount and its explanation are both **NOT MEASURED**. The arithmetic proves it: 59 − 9 removed + 2 added-as-comment-text = **52** at `c22f4f0`, which is what the ship commit contains.
3. **"37,618 lines" is the parent's count, not the tree the anchors were measured on.** `c22f4f0^` is exactly 37,618 lines; add §VM-01-A's net `+47` and the file the report greped was **37,665**. The header is stale by precisely the increment's own net insertion — the anchors are right and the line-count that frames them is not.
4. **"5.13 MB" is the inline script, not the file, and its sibling ship record calls the same number "4.89 MB."** At `c22f4f0^` the file is 5,427,539 B (5.43 MB / 5.18 MiB) and its largest inline `<script>` is 5,163,675 B (5.16 MB / 4.92 MiB). The two figures reconcile as units, not as measurements: **4.89 MiB = 5.13 MB**. Two ship records of the same commit report one quantity in two systems and label both "MB".

**A fifth, in the ship record rather than the report.** The nine post-ship anchors in `plan-archive.md` (`27860` · `21902` · `37222`/`37232` · `24033`/`24043`/`24056` · `24077`/`24078`) are each **exactly 5 short** of their true positions at `c22f4f0` (`27865` · `21904` · `37227`/`37237` · `24038`/`24048`/`24061` · `24082`/`24083`). A uniform delta across nine figures is one stale copy, not nine mistakes. The number `21902` was then transcribed into a live test comment at `tests/integration/rng-seed.test.js:100`, where it points at nothing; the d20 is at `@22248` today.

---

## 10. Verification performed for this pass

- `npm run check:rng` → **green**: P1 6,000 draws over 12 seeds (client ≡ server), P2 determinism, P3 6,000 draws (`__duelRng` ≡ `_seededNext`), P4 field presence.
- `npx playwright test tests/integration/rng-seed.test.js` → **5 passed**: pure-function-of-seed · autosave/load round-trip resumes exactly · pre-§VM-01-B save lazily bootstraps · ranges intact (`[0,1)` / d20 1–20 / d100 0–99) · `QuestRuntime._rollSkill` reproducible from the seed.
- Parent build pinned with `git show "c22f4f0^:roll2hit-v3.html"` and `git show "c22f4f0^:js/wbapi-server.js"`; all 28 line-number claims scored against it.
- Ship state pinned with `git show c22f4f0:roll2hit-v3.html`; `Math.random()` occurrences counted at parent (59), ship (52) and HEAD (51).

---

## 11. Verdict

**SHIPPED EXACTLY AS LOCKED, AND STILL TRUE.** One field, one helper, nine substitutions, one CI guard, one npm wire, one test file — the footprint landed as scoped, both design calls shipped as recommended, and thirty days and four increments later **every one of the thirteen locked claims still holds**. The one structural change since — §VM-01-D lifting `_rollSkill` into the `QUEST:CORE` kernel — did not break the contract; it *strengthened* it, converting a direct call into a declared, injected dependency the headless server can stub.

What the increment actually bought is legible now in a way it could not have been on the day it shipped: **the seed is load-bearing infrastructure for the soft-lock prover**, and the self-documented SP/MP divergence is closed at the algorithm level. The four wrong numbers are all in framing prose — the line-count in the header, a recount in the method, a unit in a byte figure, and one off-by-one pointer that shipped into an engine comment. **Not one of them is in the design.** This is instrument 9 stated as cleanly as the corpus has ever stated it: the half of a document the author could copy was copied correctly, and the half the author narrated is where all four defects live.

> *The parity contract used to stop where the dice landed. It now stops where the swords do — and that, unlike the first fence, was chosen on purpose.*

**Filed from this pass:** **§DX-02du** (three drifted pointers, 🟢 comment lines only, no design call) · **§VM-01-B-FU** (whether "a save fully determines the future" should extend to combat — 🟡 design call, explicitly deferred by §5.3 and never filed since).

*© 2026 Paul Richeson — MIT License.*
