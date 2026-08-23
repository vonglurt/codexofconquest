<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §XP-01 *Universal Effort XP*: misses and failed skill-checks

**Parent:** `lab-reports/lab-report-play-review.md` §PLAY-01, spun off from §PLAY-01-B · **Track:** BACKLOG.md §XP-01 (Mechanics & Systems)
**Authored:** 2026-07-12 · **Class:** enactment (carries design weight) · **Status:** ✅ SHIPPED
**Ship commit:** `8ae9e8c` (2026-07-12 13:04:47) — the report and the code are the *same* commit
**Reference build for every line citation:** `8ae9e8c^` (37,126 lines) · **HEAD at re-verification:** 38,712 lines
**Re-verified:** 2026-08-18 (§DOC-02cd) — verdict **SHIPPED WHOLE, TWO SURFACES SHORT OF ITS OWN THESIS**

---

## Abstract

The engine rewarded success and nothing else. A player could spend a full combat round swinging
at a Deadly enemy, miss every swing, flee, and walk away with a ledger entry reading zero — the
game had counted the effort (`_statTally` fires per swing) and paid for none of it. §XP-01 closes
the last two "effort without success" surfaces in the single-player story loop: **a missed attack**
and **a failed skill-check**. It introduces one dial (`EFFORT_MISS_PCT = 0.02`), reuses the
existing one (`EFFORT_XP_PCT = 0.25`), and adds a per-encounter cap so partial credit can never
out-earn the success it is a fraction of.

Re-measured 37 days after the ship: **all six implementation-surface rows are live**, the
acceptance suite is **3/3** and the declared regression set **enemy-ai 4/4 · courier-map 1/1 ·
hunt-mode 3/3** (11/11 total, one run, no retries), the PvP determinism constraint holds
**byte-for-byte**, and **13 of 13** line citations resolve exactly at the parent build. Two deltas
survive, both narrower than the report's own thesis rather than contrary to it: the failed-check
notification is **written and never displayed**, and the **off-hand attack** — the game's second
counted attack surface — was left out of scope without the report saying so.

> *"The attempt was not wasted. +38 XP for the effort."*
> — `roll2hit-v3.html`, a string no player has ever read (§7.1).

---

## I. Intention and inspiration — what this buys the player

The directive is one sentence, and it is a *promise about the game's character* rather than a
balance tweak:

> **"All action earns XP; you never lose XP."**

Three things follow from it, and they are the reason this feature earns its place.

**1. It removes the punishing dead turn.** A d20 game spends a large fraction of its wall-clock
time on rolls that fail. Before §XP-01, every one of those was a pure subtraction of the player's
time. The design read as "the dice decide whether the last thirty seconds counted." Partial credit
converts a miss from *nothing happened* into *something small happened* — the difference between a
loss and a slow gain, which is the difference between a player who closes the tab and a player who
takes one more swing.

**2. It makes difficulty legible in the reward, not just the health bar.** The grant scales off the
enemy, `(AC × maxHp)`, exactly as the kill and flee grants do. Missing a boss is worth more than
missing a rat. The player learns the tier from the payout without being told it, which is the same
lesson §PLAY-01 spent a whole review arguing: *the engine knows things it will not transmit.*

**3. It makes failure survivable in the narrative layer too.** A failed Ceremonia Roll used to cost
the attempt and return nothing. Under §XP-01 a failed check pays a quarter of the reward the pass
would have given — once, so a retryable check cannot be farmed. A player who fumbles a Persuasion
check is now *behind*, not *punished*, and can walk to the next node with the level bar a little
fuller. That is the difference between a skill system and a tax.

The inspiration is §PLAY-01-B, which shipped the first instance of the idea without naming it: a
fled mundane beast already granted `EFFORT_XP_PCT` of the kill. §XP-01's contribution is to
recognise that as a *principle* rather than a special case, name the dial, and apply it everywhere
the principle reaches. §XP-02-A later extended the same dial family to first-arrival exploration
(`EXPLORE_XP = 10`), which is the strongest evidence that the abstraction was the right one.

---

## II. Method

Verification was performed against three trees, because a claim about the past cannot be
adjudicated at HEAD:

| Tree | Purpose |
|---|---|
| `8ae9e8c^` (parent) | scores every line citation the report published |
| `8ae9e8c` (ship) | the as-shipped code, for spec→shipped comparison |
| HEAD (2026-08-18) | survival, drift, and reachability 37 days on |

Instruments applied: full-corpus census through `js/wbapi-core.js` (`W.load(GAME)`), `git log -S`
with **no pathspec** on every symbol scored dead, a byte-hash of the DUEL:CORE span across all
three trees, the report's own acceptance suite re-run at HEAD, and a throwaway Playwright probe
driving the real `_overlayPlayerAttack` / `_overlayOffhandAttack` / `_resolveQuestUQF` in a live
browser — because reading source cannot distinguish a branch that runs from a branch that merely
compiles.

---

## III. The say/do gap the report opened with — re-measured

Both claims in the original §1 are **CORRECT**, and the second is stronger than it was stated.

- **Missed attacks earned nothing.** `_overlayPlayerAttack` rolls `n = _extraAttackCount()` swings
  (`function _extraAttackCount@24995`); at the parent build both miss branches set `logMsg` and
  granted no XP, while `_statTally('attacksAttempted', 1)` already fired per swing. Counted, never
  rewarded. ✅ verified at `8ae9e8c^:24290/24295/24297`.
- **Failed skill-checks earned nothing.** The report hedged this as *"`onFail:[]` on the
  overwhelming majority."* Measured: of **2,634** UQF quests carrying a `skill_check` bit,
  **2,602 (98.8 %)** ship `onFail:[]`, 32 carry any fail bits at all, and **none** of those 32
  grants XP. The hedge was an understatement.

Baselines, both exact at the reference build and both still live:

| Grant | Formula | Site at HEAD |
|---|---|---|
| Full kill | `round(AC × maxHp × partyMult)` | `const xpAward = Math.round@25292` |
| Flee / prior effort | `round(AC × maxHp × EFFORT_XP_PCT)` | `function _storyEnemyFlees@25170` |

---

## IV. As-built inventory

Every symbol below resolves at HEAD. Line numbers are refreshable hints; the symbol is the pointer.

| Component | Anchor | Verdict |
|---|---|---|
| New dial | `const EFFORT_MISS_PCT@24430` | ✅ live, value `0.02` |
| Existing dial (reused) | `const EFFORT_XP_PCT@24426` | ✅ live, value `0.25` |
| Miss-grant helper | `function _grantMissEffortXp@25009` | ✅ live |
| Cap arithmetic | `const cap  = Math.round@25011` · `const remaining = cap@25012` | ✅ live |
| Accumulator write | `S.effortXpEarned = (S.effortXpEarned@25015` | ✅ live |
| Per-encounter reset | `capped; transient, never saved@24640` | ✅ live, in `function _storyRollInit@24624` |
| Miss branch, NAT 1 | `NAT 1 — Auto Miss@25064` | ✅ calls the helper |
| Miss branch, ordinary | `function _overlayPlayerAttack@25020` | ✅ calls the helper (25066) |
| Failed-check grant | `a failed check still earns effort XP@7003` | ✅ live |
| Reward extraction | `const rewardXp = ((sc.onPass@7007` · `const effXp = Math.round@7008` | ✅ live |
| Once-per-quest guard | `effortXpQuests: {}@23150` in `_S_DEFAULTS` | ✅ live |
| Sibling dial (§XP-02-A) | `const EXPLORE_XP@24435` | ✅ later work, same family |

**Transience holds.** `storyAutoSave` persists `S_story` and nothing else, so `S.effortXpEarned`
is genuinely per-encounter and never enters a save file — the §MESH-01f convention the report cited
is still the convention.

---

## V. Spec → shipped delta table

| # | Spec (report §3) | Shipped | Delta |
|---|---|---|---|
| 1 | `EFFORT_MISS_PCT = 0.02` beside `EFFORT_XP_PCT` | as specified, with a 3-line rationale comment | ✅ exact |
| 2 | `S.effortXpEarned = 0` in `_storyRollInit` beside `S.opp.enraged = false` | as specified, adjacent line | ✅ exact |
| 3 | helper in both miss branches, banks capped XP, appends `+N XP`, no modal | as specified | ⚠ see below |
| 4 | fail-branch grant, once per quest, `_checkLevelUp()` + modal | as specified | ⚠ see §7.1 |
| 5 | `effortXpQuests: {}` in `_S_DEFAULTS()` | as specified | ✅ exact |
| 6 | `mechanics.md` + `docs/mechanics/mechanics-combat.md` synced | both carry the three-dial table | ✅ exact, and still accurate |

**Delta on row 3, in the engine's favour.** The spec said each miss grants
`max(1, round(kill × 0.02))` and *"once the cap is hit, further misses grant 0."* The shipped
helper is `min(remaining, max(1, round(kill × 0.02)))` — the final grant is **clamped to the
remaining headroom** instead of being all-or-nothing, so the accumulator lands exactly on the cap
rather than short of it. This is why the acceptance test can assert `total === cap` on the nose.
An improvement made during implementation and never written down.

**Guarantees re-checked arithmetically.** (i) miss-farming a weak enemy caps at 25 % of *that*
enemy's kill value, always below a real kill; (ii) cumulative miss-XP < kill XP by construction;
(iii) a won fight yields at most **125 %** of its own kill XP in single-player — and *less* in a
party, because `partyMult` (1.0–1.2) scales the kill but not the cap. All three hold.

---

## VI. Verification-plan outcome (the report's own §4, re-run at HEAD)

| Plan item | Result 2026-08-18 |
|---|---|
| 1. Inline-script parse | ✅ 1 script block, **0 parse errors** |
| 2a. Forced-miss grant + cap | ✅ `tests/integration/effort-xp.test.js:missed attack grants fractional effort XP@9` |
| 2b. No mid-fight level-up modal | ✅ `tests/integration/effort-xp.test.js:misses bank XP silently@43` |
| 2c. Failed check, guard, no-reward case | ✅ `tests/integration/effort-xp.test.js:failed skill-check grants 25@68` |
| 2d. Regression enemy-ai / courier-map / hunt-mode | ✅ **4/4 · 1/1 · 3/3** |
| 3. DUEL:CORE untouched | ✅ span sha `511b93cc1b21` **identical** at parent, ship and HEAD |
| 4. Live screenshot of both notices | ⚠ combat log ✅ · quest notice **never rendered** (§7.1) |

**11/11 green in one run.** The DUEL:CORE result is the strongest survival signal in the report:
the kernel spans `DUEL:CORE:START@10238` to `:END`, has moved **213 lines down the file** in 37
days, and its contents have not changed by one byte. The hard constraint was not merely respected
at ship time — it is still being respected by everyone who has edited around it.

**The acceptance suite itself has a history worth recording** (a report's own test is a live
claim). Test 3 originally forced its failure by stubbing `Math.random`. Ten days later §VM-01-B
moved `QuestRuntime._rollSkill`'s d20 onto the seeded stream, the stub stopped controlling
anything, and the test became a ~45 % coin flip that the backlog recorded as a *deterministic* red.
§DX-02f (2026-07-30) diagnosed it from the mechanic outward, found **the mechanic correct**, and
repaired the test by forcing the outcome through the engine's own dial —
`tests/integration/effort-xp.test.js:const forceFail@77` raises `sc.dc` to 999 and restores it in a
`finally`. **The §XP-01 ship record was never in question; the test was.** The durable lesson:
*a test that stubs an RNG must stub the stream the code actually draws.*

---

## VII. Findings

### 7.1 The failed-check notice is written, and has never been displayed → **§DX-02de** 🟡

The fail branch ends with

```js
storyMsg('The attempt was not wasted. +' + effXp + ' XP for the effort.');   // The attempt was not wasted@7014
```

and then, two statements later, `_resolveQuestUQF` calls `storyRender(...)`, whose tail runs
`storyMsg(parts.join@36043)` **unconditionally**. When the render produces no loot or quest
message, `parts` is empty and the tail writes the empty string. The effort notice is destroyed in
the same synchronous tick that created it.

**Proven in the browser**, not inferred: forcing `quest_muffat_01` to fail grants the correct
**+38 XP** and leaves `#story-move-msg` reading `""`.

This is **born dead, not rot** — `storyMsg(parts.join` is present at the *parent* build, so the
message never worked for a single day of the 37. And the pass branch of the very same function was
repaired for exactly this hazard by §BOARD-01-FU6: it buffers through `_passMsgs` and hands the
text to `storyRender` as its `prefix` argument, under a comment that names the failure mode
verbatim. The fail branch sits **nineteen lines below that comment** on the broken idiom.

**Player impact.** The XP arrives, and the level-up modal still opens, so nothing is lost
mechanically — but the *pedagogy* is lost entirely. The feature's whole job is to teach the player
that failure is not a dead end, and the one sentence that teaches it is deleted before it can be
read. **Fix:** buffer the string and pass it as `storyRender`'s prefix, exactly as the pass branch
already does. **Risk:** low.

### 7.2 The off-hand miss is counted and unrewarded → **§DX-02df** 🟢

Story mode has exactly **two** `_statTally('attacksAttempted', 1)` sites: the main attack
(`function _overlayPlayerAttack@25020`, granted) and the off-hand bonus-action swing
(`function _overlayOffhandAttack@25102`, **not** granted). Its miss branch
(`Offhand NAT 1 — Miss@25119`) sets a log line and returns. Live probe: main-attack miss **+20 XP**,
off-hand miss **+0 XP**, same encounter, same enemy.

The report's §3 *did* say the helper touches "only `_overlayPlayerAttack`'s two miss branches," so
this is **stated scope, not an oversight** — but §1 opened by declaring that *missed attacks earn
nothing* and the directive says *all* action earns XP. A dual-wielding player is left with the one
swing in the game that the engine counts and refuses to pay for, and the report never flags the
gap. The free swing inside `function _storyFleeMutual@25699` (`const pHit  = pRoll@25704`) is a
third such surface, untallied as well as unrewarded.

**Blast radius is small by construction** — main-attack misses usually reach the per-encounter cap
regardless, so the off-hand grant would often be zero anyway. Fix it for consistency, not balance.
**Risk:** low.

### 7.3 The failed-check grant reaches 3.5 % of skill checks → **§AUDIT-03bm** 🟡 (design call)

Corpus census at HEAD (2,853 quests · 2,823 UQF):

| Population | Count | Share of skill-checks |
|---|---|---|
| UQF quests carrying a `skill_check` bit | 2,634 | 100 % |
| …with `onFail:[]` | 2,602 | 98.8 % |
| …whose `onPass` carries a `reward` bit with `xp` | **91** | **3.5 %** |
| …whose `onPass` is `mission_bit` only (no XP either way) | 2,438 | 92.6 % |

Effort grants across the whole corpus: **6 – 125 XP**, median **44**, total **4,067 XP** if every
one of the 91 were failed once. The report anticipated the zero case — *"many narrative checks have
no reward and shouldn't invent one"* — but framed it as an edge, when it is **the overwhelming
majority**.

**The design is internally consistent and that is the point.** Those 2,543 checks pay no XP on
*pass* either; they pay a mission-bit token —

> *"A carved bone token. Glyph: … . Mark of a witnessed moment."*

— granted by `function _grantMissionBit@26109`, which awards **no XP** (`Token received: @26125`).
So §XP-01 did not miss them; the *game* pays them in a different currency, and the XP economy
simply does not reach there. Verified live: failing `quest_spark_01` (mission-bit only) grants 0.

**The open question is therefore not a bug but a call the project has never made:** should
witnessing a moment be worth XP? If yes, the cleanest shape is a flat token grant in the
`mission_bit` opcode (the `EXPLORE_XP` precedent), after which §XP-01's 25 % rule would inherit
2,438 quests for free. If no, then *"all action earns XP"* is true only of the combat and
exploration loops and the documentation should say so. **Do not build before the call** — 2,853
quests are calibrated against the current curve.

### 7.4 Corroborated, not re-filed

**§DX-02p** already records that a level earned by *passing* a skill check delivers no level-up
while the §XP-01 fail branch does it correctly three lines away (`function _checkLevelUp@25671`;
the queue drain at `7015`). That asymmetry is a §XP-01 artefact and is filed; this pass confirms it
rather than duplicating it.

### 7.5 Positive findings worth keeping

- **The `(S.enemy.ac × S.opp.maxHp)` idiom is correct, not a mixed-object bug.** `S.enemy` is the
  stat block and `S.opp` is the live combat panel; both `maxHp` fields are written together at
  every story-mode load site, and the kill grant has used the same pair since long before §XP-01.
  The one path that writes `S.enemy.maxHp` alone is the dice-roller sandbox's custom-enemy form,
  which deliberately does not reset HP on keystroke and never enters story mode.
- **No double-grant exists.** No `skill_check` quest carries an XP-bearing `reward` bit in *both*
  `onPass` and `onFail`, so the effort grant can never stack with an authored consolation prize.
- **`_levelUpQueue = []` before `_checkLevelUp()`** in the fail branch is the engine's own idiom,
  copied verbatim from the battle-victory path — not an invention.
- **The documentation stayed true.** `mechanics.md` and `docs/mechanics/mechanics-combat.md` both
  carry the three-dial table, both name the cap and both state the single-player restriction, and
  every number in them re-measures correct 37 days on.

---

## VIII. What the feature actually did for the game

**It shipped a principle, not a patch — and the principle recruited more surfaces than the report
planned for.** §XP-01 named `EFFORT_XP_PCT` as a world-percent rather than a flee constant, and
eleven days later §XP-02-A hung first-arrival exploration XP off the same dial block with the same
bounding argument (`EXPLORE_XP = 10 ≤ 48`, the weakest starter flee value). A design that gets
extended by a later track without being renegotiated is a design that was drawn at the right
altitude.

**It is the only XP the player earns while losing**, and it is deliberately quiet about it. The
miss note rides inline in the combat log (`✗ Miss. 14 vs AC 18 (+20 XP effort)`) instead of
interrupting the attack loop with a modal; the level-up celebration is deferred to victory, flee or
death, all of which already call `_checkLevelUp()`. XP is banked instantly — *never lost* — and only
the fanfare waits. That restraint is why the feature survives 37 days of unrelated edits without a
single regression: it adds no new interaction, no new screen, and no new save field beyond one
guard map.

**Where it under-delivers is transmission, not mechanics.** Both open defects are about the player
*being told*: one notice is overwritten before it paints (§7.1), one surface pays silently nothing
(§7.2). The XP model itself is sound, capped, documented and provably PvP-safe. §PLAY-01's original
complaint — that the engine knows things it will not transmit — turns out to describe its own
remedy.

---

## IX. Open decisions

**At authoring time: none.** Both design calls were signed off 2026-07-12 (combat misses =
fractional 2 % + per-encounter cap at the flee value; failed skill-checks = 25 % of the quest's own
reward, once per quest), and both shipped as decided.

**Open now: one, and it is §7.3.** Whether a mission-bit check should earn XP at all is the only
question standing between §XP-01's implementation and §XP-01's stated thesis. It is a design call,
not a defect, and it is filed as §AUDIT-03bm.

---

## Appendix — verification evidence

- **Dating:** report and code are one commit, `8ae9e8c`; **13 of 13** published line citations are
  byte-exact at `8ae9e8c^` (`_resolveQuestUQF` 6782 · fail branch 6807 · `EFFORT_XP_PCT` 23686 ·
  `S.opp.enraged` 23890 · `_overlayPlayerAttack` 24253 · `attacksAttempted` 24290 · NAT 1 24295 ·
  miss 24297 · `_storyEnemyFlees` 24401 · flee formula 24402 · `S_story.xp += xpAward` 24524 ·
  DUEL:CORE 10025 and 10177). No mid-edit re-measurement, no fabricated identifiers.
- **Tests:** `npx playwright test` over `effort-xp`, `enemy-ai`, `courier-map.smoke`, `hunt-mode`
  → **11 passed**, one run.
- **Live probe:** throwaway Playwright spec driving the real functions; main-miss `+20`,
  off-hand-miss `+0`, banked `20`; reward-check fail `+38` with `#story-move-msg` empty;
  mission-bit-check fail (`quest_spark_01`) `+0`. Spec run and deleted.
- **Census:** `js/wbapi-core.js` `W.load('roll2hit-v3.html')`, brace-walked entry bodies for the
  `_legacy_fn` scan — **0** of 77 `_legacy_fn` onPass bits carry an XP grant the reward-bit reader
  would miss, so the extraction in `const rewardXp = ((sc.onPass@7007` sees everything there is to
  see.
- **Parse:** inline `<script>` block, 0 errors. **DUEL:CORE:** sha `511b93cc1b21` at all three trees.
