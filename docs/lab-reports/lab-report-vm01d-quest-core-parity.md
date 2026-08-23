<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §VM-01-D: `QUEST:CORE`, the Fourth Kernel (host-injected)

**Track:** §VM-01 — The Quest VM → *No Word for Wait*
**Increment:** D — the fourth parity kernel: `QUEST:CORE` + dependency injection
**Status:** Design lock written 2026-07-22; **shipped the same day** as `9f10bfe` (2026-07-22 11:30:30 −0700), parent `4931ba6`. The lock and the implementation are **one commit** — see Delta D9.
**Verified:** 2026-08-22 (§DOC-02cp) against `9f10bfe^`, `9f10bfe`, and HEAD.

---

## Abstract

`src/js/` held `mover.js`, `rooms.js`, `duel.js` — and no `quest.js`. The engine that runs every quest in the game was the one engine the server could not `require()`. This increment gives the quest VM the parity-fenced kernel treatment the other three already carried: a `// ◆◆◆ QUEST:CORE ◆◆◆` block inlined **byte-identically** into `play.html` and mirrored in `src/js/quest.js`, asserted by `src/scripts/check-quest-parity.js` and wired into `npm run check:walk`.

The blocker was not packaging. `MOVER`/`ROOMS`/`DUEL` were pure from birth; `QuestRuntime` was an object literal closing over `S_story`, `QUEST_DB`, `NODE_MAP` and **ten host functions**. The resolution — chosen by the user over a minimal validation-only fence — is **dependency injection**: `createQuestRuntime({ getState, effects })`. The kernel names no global; the live game injects the real ones. On the live path every thunk calls the function it replaced, so the change is a **provable no-op**, and the regression suite is the proof.

---

## I. Intent, and what it buys a player

A quest VM is invisible. Nobody has ever finished a session and said *"what a well-factored dispatcher."* The reason this increment exists is one step downstream of the refactor, and it is entirely player-facing:

**A quest that cannot be finished is the worst bug this game can ship.** It is worse than a wrong damage roll, because the player cannot tell it from their own mistake. They re-read the hint, re-walk the node, re-load the save — and the quest was never completable. In a world of **2,853 quests across 416 nodes**, no amount of play-testing finds those by hand.

The only way to find them all is to *run the gate logic outside the browser, over every quest, on every commit.* That requires the engine to be a module. Before D it was 260 lines welded to a live DOM and a live `S_story`, and the answer to *"is quest X reachable?"* was **open the game and try**.

After D the answer is a gate. Measured this session:

- `npm run check:questgraph` — **2,853 quests analysed, 2,804 reachable, 0 residual nondeterminism.**
- `npm run check:gateast` — **76 assertions**, the kernel's real gate algebra checked against an independently re-implemented reference interpreter.

That is the feature. Not a screen, not a verb — a **standing guarantee that the content the player is walking toward can actually be walked to**, re-proved on every commit, forever. The parity fence is what keeps the guarantee honest: if the shipped HTML and the checked module ever drift by one byte, `check:questparity` fails loudly rather than quietly certifying the wrong engine.

The secondary payoff — a server authoritative over quest state — was **explicitly a build-ahead** with no consumer at ship time. It still has none (Delta D7). The report said so plainly at the time, and it deserves credit for that.

---

## II. Method

Five instruments, in order:

1. **Pin the parent build.** `git show "9f10bfe^:play.html"` (37,694 lines) — every line number in the report was measured pre-edit and must be scored there, not at HEAD.
2. **Score the anchors.** All 18 line-number claims resolved against the pinned parent.
3. **Score the free-name table.** All 13 rows of §2 re-grepped inside the parent literal `21764`–`21965`.
4. **Score the artefacts at HEAD.** Parity gate, kernel members, host wiring, exports, consumers.
5. **Re-measure the baseline the report reasoned through** — the one claim a report never re-checks about itself.

---

## III. As-built inventory (HEAD, 2026-08-22)

| Artefact | Status |
|---|---|
| `QUEST:CORE:START ◆◆◆@21965` … `QUEST:CORE:END ◆◆◆@22334` | live, 370 lines |
| `function createQuestRuntime(host) {@22180` | live, the factory |
| `function _questRunToCompletion(gen) {@22036` | live, the pure twin of `function _uqfRunToCompletion(gen) {@6840` |
| `const SCHEMA_VERSION@21966` · `const BIT_CONTRACTS = {@21970` · `function validateQuest(q) {@22004` · `function adaptLegacyQuest(id, q) {@22026` | the four pure members, moved unchanged |
| `const QuestRuntime = createQuestRuntime({@22341` · `getState: () => S_story,@22342` · `rng:       () => _seededNext(),@22346` | host wiring, outside the sentinels |
| `src/js/quest.js:module.exports = { createQuestRuntime@403` | the export line, byte-exact as specified |
| `src/scripts/check-quest-parity.js:const a = core@22` | the fence — **25,030 bytes identical**, green |
| `src/tests/integration/uqf-quest-core.test.js:const Q = require@13` | **7 tests, 7/7 green** (2.6 s) |

**Method surface unchanged**, as promised: `canActivate` · `canComplete` · `execBits` · `_rollSkill` · `resolveSkillCheck` · `HANDLERS`. No test caller needed adapting, and the §VM-01-A signature-break hazard did not recur.

---

## IV. Spec → shipped delta table

**Nine deltas. Seven are prose; two are code and are now filed.**

| # | Claim | Measured | Verdict |
|---|---|---|---|
| — | 18 header line numbers | **18/18 exact** at `9f10bfe^`, offset 0 | ✅ |
| — | §2 free-name table, 13 rows | **13/13** present in the parent literal | ✅ |
| — | Server QUEST_DB validation at `4425`–`4846` | both exact in the parent `src/js/wbapi-server.js` | ✅ |
| — | No new opcode, gate term, state field, save migration | **0 diff lines** touch `_S_DEFAULTS` or the three sibling sentinels | ✅ |
| D1 | *"2,850 quests"* | **2,853** at parent, ship and HEAD | ❌ wrong when written |
| D2 | *"258-line engine"* | the region its own anchors bracket is **260** lines (249 non-blank) | ❌ off by 2 |
| D3 | `S_story` *"gates ×~30"* | **40** in the two gates, **50** in the whole literal | ❌ understated |
| D4 | *"`check:quest` in `npm run check:walk`"* | shipped as **`check:questparity`** | ❌ name |
| D5 | *"a `Math.random()` fallback exists … for a server that injects no rng"* | **no fallback exists**; `E.rng()` is called unguarded | ❌ **NOT SHIPPED** → §DX-02dw |
| D6 | *"the first consumer is … §VM-01-E's static gate walker"* | E requires the kernel and **never calls it**; §VM-01-F is the real first consumer | ⚠ half → §DX-02dx |
| D7 | *"server authoritative over quest state"* | `src/js/wbapi-server.js` still does not `require('./quest')`, 30 days on | ⚠ open debt |
| D8 | *"286 passed / 17 env-quirk failures = the A/B/C env baseline"* | arithmetic **correct** (286+17 = 303 = the real suite); the **baseline** was retired 7 h 28 min later | ⚠ see below |
| D9 | *"LOCKED … design-review-before-implementation"* | report and implementation are **the same commit** | ⚠ unprovable |

### D1 — the same wrong number, three times

`2,850` is not a rounding. The parser reports **2,853** at `9f10bfe^`, at `9f10bfe`, and at HEAD — the figure was wrong the day it was typed. It is **the third sighting**: §VM-01-A and §VM-01-C carry it identically. One decoration, inherited down a sibling set, never re-measured by any of them. Nothing depends on it, which is exactly why it survived.

### D5 — the guard that was promised and never written

§4 states the kernel keeps *"a `Math.random()` fallback … only for a server that injects no rng."* There is no such fallback, at ship or at HEAD. The kernel contains **zero** occurrences of `Math.random()` — which is *better* than advertised for reproducibility — but `const d20  = Math.ceil(E.rng() * 20)@22248` calls the injected effect **bare**, and it is the **only** unguarded effect call among **13**. Every sibling is defended: `E.getQuest ? …`, `if (E.checkLevelUp)`, `if (E.mint)`, `if (E.preBattle)`, `mission_bit(bit, ctx)@22303` even carries an explicit env fallback.

This is not hypothetical. `src/scripts/check-gate-parity.js:const rt = Q.createQuestRuntime@32` — a **shipped, green, in-`check:walk` consumer** — builds a runtime with `effects: { getQuest }` and no `rng`. It survives only because gate evaluation never reaches `_rollSkill`. It is one `skill_check` walk away from a `TypeError`. Filed **§DX-02dw**.

### D6 — the prediction that landed in the wrong file

§6 named two candidate first consumers: a future §MESH quest increment, or §VM-01-E's static gate walker. E's walker exists and it *does* carry `src/scripts/check-questgraph.js:const Q = require@63` — and **`Q` appears exactly once in that file, on its own declaration line.** The kernel is imported, credited in the header comment, and never called; the walker re-implements what it needs against its own brace matcher.

The genuine first consumer is §VM-01-F's `check-gate-parity.js`, which was not on the list. The substrate paid off — one increment later than predicted and through a different door. Filed **§DX-02dx** (dead require).

### D8 — the baseline was the fiction, and the report is the honest witness

§5 builds a git-stash-diff ceremony around hitting *"the §VM-01-A/B/C env baseline exactly (286 passed / 17 env-quirk failures = 0 NEW)."* Measured this session:

- The suite held **303** tests at `c22f4f0`, `9f10bfe`, `bd951d7` and HEAD — unchanged. 286 + 17 = 303. **The report's arithmetic closes.**
- `bd951d7` (2026-07-22 18:58:33, **7 h 28 min after this increment shipped**) is titled *"retire the quest-runtime-uqf env baseline — it was 17 stale tests, not server clobber (17→1)."*

So the ceremony was sound and the verdict was right — C and D were genuine no-ops — but the thing it measured *against* was seventeen stale tests wearing the word **baseline**. A baseline is a claim like any other, and it is the one claim a report never re-measures, because the whole method turns on the delta rather than the absolute.

**This also resolves §DX-02dv, which posed an either/or.** That row observes that `plan-archive.md`'s ship record for this increment says *"286 passed / 0 failed"*, and 286 + 0 ≠ 303. The report is the correct witness; **the ship record dropped the 17.** Correct it to `286/17` and note that `bd951d7` retired the baseline hours later. At HEAD the suite is **303/303 green** (measured this session, 3.8 min).

---

## V. Verification (re-run 2026-08-22, not recalled)

| Check | Result |
|---|---|
| `npm run check:questparity` | ✅ QUEST:CORE identical in both files, 25,030 bytes |
| `src/tests/integration/uqf-quest-core.test.js` | ✅ **7/7** — the plan asked for five assertions; the shipped suite adds isolation-of-`{state}` and choice-suspend-under-bare-`require()` |
| `src/tests/integration/quest-runtime-uqf.test.js` | ✅ **303/303** |
| `npm run check:questgraph` | ✅ 2,853 analysed · 2,804 reachable · 0 residual nondeterminism |
| `npm run check:gateast` | ✅ 76 assertions agree with the reference interpreter |
| `npm run check:invariants` · `npm run check:roads` | ✅ both green — **the two reds §5 named as permanent are gone** (the J14/J15 junctions were removed outright by §JUNK-01/§DX-01a on 2026-07-28, six days later) |

The engine runs headless in Node. That is the thing that was structurally impossible before this increment, and it is now three gates deep in CI.

---

## VI. Design calls, scored 30 days on

1. **Injection over a shared singleton** — `getState()` resolves at call time, so §VM-01-C's per-call `execBits(chain, {state: scratch})` seam survives. **Held.** `uqf-quest-core.test.js` and `uqf-softlock.test.js` both drive scratch states through it; §VM-01-E's own record credits the seam for letting it take the light option instead of porting 124 `_legacy_fn` closures.
2. **Guards live in the host thunks, not the kernel** — **held 12 times out of 13.** The thirteenth is D5, and it is the one that matters.
3. **`resolveSkillCheck` uses a kernel-internal pure `_questRunToCompletion`, not the host driver** — **held.** `function _questRunToCompletion(gen) {@22036` is live inside the sentinels; the four outer call sites still use the host driver, exactly as scoped.

---

## VII. Scope fence, scored

| Fence | Outcome |
|---|---|
| No server consumer wired in this increment | ✅ held — and **still unwired at HEAD** (D7) |
| Gate readers move but keep exact logic; no expression AST — *"that is §VM-01-F"* | ✅ held, and the forward pointer paid: §VM-01-F shipped `c6be7f8`, and its checker became the kernel's first real consumer |
| `_legacy_fn` still runs arbitrary code; D does not purge legacy fns | ✅ held — **114** `_legacy_fn` bits live at HEAD, and `check:questgraph` now certifies them determinate rather than removing them |

---

## VIII. Defects filed

- **§DX-02dw** 🟢 — `const d20  = Math.ceil(E.rng() * 20)@22248` is the only unguarded effect call in a guards-in-the-host kernel, and `src/scripts/check-gate-parity.js:const rt = Q.createQuestRuntime@32` already injects no `rng`. Guard it, or document `rng` as the one required effect. §4 of this report promised a fallback that was never written.
- **§DX-02dx** 🟢 — `src/scripts/check-questgraph.js:const Q = require@63` imports the kernel and never uses it. Either call it or drop the import and the header claim.
- **§DX-02dv** (already open) — resolved above: the ship record dropped the 17, the report did not.

---

## IX. Conclusion

**The lock held, and it held on the merits.** Every anchor exact, every free name accounted for, every design call live thirty days on, both artefacts byte-identical under a gate that runs on every commit. The report's own thesis correction — *"this was never the mechanical fence the row assumed; it is the dependency-injection refactor the ten host calls always required"* — is the sentence that made the increment shippable in a single day, and it is still true.

The errors are where the corpus has learned to expect them: in the framing prose, not the design. A quest count nobody re-counted, a line total off by two, a gate name that would have exited 1 the first time anyone typed it, and a baseline that was retired before the day was out.

One promise was not kept, and it is small and real: the kernel was designed so that a host could supply nothing and get a no-op, and twelve of thirteen effects honour that. The thirteenth rolls the dice.

*© 2026 Paul Richeson — MIT License.*
