<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §PLAY-01-A *The Courier's Map*: goal legibility

**Parent:** `lab-reports/lab-report-play-review.md` §PLAY-01-A · **Track:** BACKLOG.md §PLAY-01 (archived → `plan-archive.md`)
**Authored:** 2026-07-12 · **Class:** honesty fix (UI-only; no design call, no balance risk) · **Status:** ✅ SHIPPED
**Ship commit:** `b46d3f0` (2026-07-12 11:49:34) — the report and the code are the *same* commit
**Reference build for every line citation:** `b46d3f0^` = `ec3fd36` (36,933 lines) · **Ship build:** 37,047 lines (+114)
**HEAD at re-verification:** 38,712 lines
**Re-verified:** 2026-08-18 (§DOC-02ce) — verdict **SHIPPED WHOLE; ONE THIRD OF IT WAS SUPERSEDED TWO HOURS LATER AND ONLY HALF THE SUPERSESSION LANDED**

---

## Abstract

The game had a win condition and no way to say it. Seven Codex Shards, Level 20, Commander Auros
at the Codex, before Day 49 — four clauses the engine enforces on every tick and stated to the
player exactly nowhere. §PLAY-01-A closes that gap without touching a single mechanic: a
**persistent objective chip** in the always-shown Location card, and a **one-time opening frame**
in the voice of the dying courier who hands you the map in the first place. Display-only. No
balance surface. No design call.

Re-measured 37 days after the ship: **every component is live and painted**, the acceptance suite
is **1/1** and the declared regression set **navigation 35/35** (36/36, one run, no retries), the
inline `<script>` parses with **0 errors**, and **6 of 6** published citations resolve byte-exact at
the parent build — the programme's second perfect dating result. Two defects survive, both created
*after* the ship and both invisible to the acceptance test: the game now shows the player **two
different day-counters that disagree on every day above 34**, and the one state field the report
added went into the wrong object, so the opening frame is a **once-per-page-load** feature that a
defeated player restarting in place never sees again.

> *"Sweelinck."*
> — the courier, `<div id="story-courier-modal">@4938`, one word and then nothing.

---

## I. Intention and inspiration — what this buys the player

The review that spawned this slice named the disease precisely: **the engine knows things it will
not transmit.** §PLAY-01-A is the first and cheapest treatment, and it earns its place three ways.

**1. It converts a wandering simulator into a game with a shape.** Before the chip, a new player
had a world, a character sheet, a combat loop, and no answer to *"what am I doing?"* The four
clauses were load-bearing in code — `S_story.shards`, `XP_LEVELS`, the Auros battle, the Day-49
sleep branch — and rhetorically absent. Naming a goal is what turns a set of systems into an
objective; the systems were already there, and this is the cheapest change in the repo that makes
them read as one.

**2. It makes progress countable at a glance, in the world's own vocabulary.** Seven symbols is not
a progress bar. The prologue already put a stained map with *"four towns and seven symbols in faded
ink"* into the player's hand (`story.md:The map shows four towns and seven symbols@163`); the chip
is that map, drawn in the status bar, and it fills in as the fiction says it should. The player
learns their position from an object they were given in the story rather than from a UI widget
bolted onto it. That is the whole argument for diegetic UI in one line, and it is why this slice
was recommended first: it costs nothing and it teaches the game's manners.

**3. It made the honesty class safe to build.** §PLAY-01-A is the pattern the rest of the track
inherited — *surface what the engine already knows, diegetically, display-only, zero balance risk.*
BACKLOG §CODEX-01 cites it by name as the proof that the class ships cleanly, and instructs its own
increments to *"mirror the objective-chip / void-modal UI patterns."* A slice whose real yield is a
precedent is worth more than its 114 lines.

**What it explicitly does not buy.** No difficulty change, no pacing change, no new content. A
player who already knew the win condition gains a convenience; a player who did not gains the game.

---

## II. Method

Re-verification followed the §DOC-02 instrument set:

1. **Dating (108).** The report has exactly one commit and it *is* the ship commit, so every line
   citation was scored against the parent tree `git show ec3fd36:roll2hit-v3.html`, never HEAD.
   `git diff b46d3f0 HEAD -- <this file>` is empty: the text below is the text that shipped.
2. **Provenance (4).** `git log -S <symbol> --all` with no pathspec on every symbol, to separate
   *retired* from *never shipped*.
3. **Scope audit.** The ship commit's seven HTML hunks read individually against the §3 scope guard.
4. **Acceptance (70).** The report's own §4 plan re-run at HEAD, not read.
5. **Browser proof (88, 117).** Three throwaway Playwright probes driving the real functions —
   run, recorded, deleted. Source reading cannot tell a painted branch from an unreached one, and
   two of the three findings below are only visible at runtime.
6. **Backlog grep (7).** Every candidate row grepped against `BACKLOG.md` before filing.

---

## III. The defect, re-measured at the parent build

The report's §1 is **right in substance and wrong in its one derived figure** — instrument 66's
signature, and the correction makes the argument stronger rather than weaker.

| §1 claim | Measured at `ec3fd36` | Verdict |
|---|---|---|
| Win condition never stated to the player | no goal-statement surface of any kind | ✅ holds |
| The literal string *"49 days"* appears once in the whole file | `grep -c "49 days"` = **0** | ⚠ the string is spelled out, not numeric |
| Day-49 defeat flavour at line 23096 | byte-exact; `The court had granted forty-nine days@23888` at HEAD | ✅ exact |
| `#s-day` shows `N/49` | `dayEl.textContent = S_story.day + @36104` renders `N/49` | ✅ exact |
| `#s-shards` shows `N/7` | `.textContent = S_story.shards + @36106` | ✅ exact |
| `#s-level` shows level and XP but never the Lv 20 target | `const lvEl = document.getElementById@36136` — no target | ✅ exact |

**The correction sharpens the thesis.** The number **49 was on the player's screen every second of
play** — the sidebar has always rendered `12/49` — and was never once labelled. The deadline was not
absent; it was *visible and unexplained*, which is a harder version of the Curse of Knowledge than
the one the report described. A bare denominator is data the player cannot convert into intent.

**The Level-20 goalpost survives its own census (86).** `Level 20` appears three times at the parent
and none of the three is reachable as a goal-statement: two are code comments, and the third is
`You are Level 20.@31385` — the §XIV *Open Door* easter egg, which fires only **after** you already
are. The engine congratulated you for arriving at a destination it had never named.

---

## IV. As-built inventory

Every symbol resolves at HEAD. The symbol is the pointer; the number is a refreshable hint.

| Component | Anchor | Verdict |
|---|---|---|
| Chip host (always-shown Location card) | `id="story-location-hd-card"@4252` | ✅ live |
| Chip element and covenant tooltip | `<div id="objective-chip" title=@4260` | ✅ live, tooltip reworded by §PLAY-01-C |
| Chip CSS block (11 rules) | `#objective-chip .obj-shard.empty@1750` | ✅ live |
| Goal constants | `const SHARD_GOAL = 7, LEVEL_GOAL = 20, DAY_DEADLINE = 49;@36175` | ✅ live, values as specified |
| Chip renderer | `function _renderObjectiveChip() {@36176` | ✅ live |
| Seven-symbol loop | `const got = Math.max(0, Math.min(SHARD_GOAL@36179` | ✅ live, clamped 0–7 |
| Level leg and gold-at-20 state | `lvEl.innerHTML = @36186` · `#objective-chip .obj-leg.hit b@1753` | ✅ live |
| Day leg | `(day >= DAY_DEADLINE - 3 ? @36193` | ⚠ superseded — see §7.1 |
| Render call site | `_renderObjectiveChip();   // §PLAY-01-A@36150` | ✅ live, at the tail of `storyUpdateStatus` |
| Opening frame markup | `<div id="story-courier-modal">@4938` | ✅ live, four goal-clauses |
| Dismiss button | `id="btn-courier-begin">Take the map@4955` | ✅ live |
| Frame trigger, fresh-game only | `_showCourierMap();   // §PLAY-01-A@23988` in `function storyNewGame(startScores) {@23951` | ✅ live, absent from `storyNewGamePlus` |
| Frame guard | `function _showCourierMap() {@23993` · `if (S_story.courierMapSeen) return;@23994` | ✅ live |
| The one state field | `courierMapSeen: false,@23044` | ❌ wrong object — see §7.2 |

**Painted, not merely present** (the §DOC-02f rule: grep for what *reveals* a surface). Live probe
after `storyNewGame`: the chip has a non-null `offsetParent`, measures **958 × 24 px**, and
`closest("#story-location-hd-card")` is truthy. It is on screen, not in the file.

---

## V. Spec → shipped delta table

| # | Spec (report §2) | Shipped at `b46d3f0` | Delta |
|---|---|---|---|
| 1 | Seven spans, `🔮` collected / dim `◇` uncollected | as specified | ✅ exact |
| 2 | `⭐ Lv N/20`, gold once ≥ 20 | as specified, `obj-leg hit` | ✅ exact |
| 3 | `☀ Day N/49`, amber ≥ 35, red ≥ 42, mirroring `#s-day` | as specified, byte-exact | ✅ at ship · ❌ at HEAD (§7.1) |
| 4 | Tooltip stating the full covenant in one line | as specified, verbatim | ✅ at ship · reworded by §PLAY-01-C |
| 5 | `SHARD_GOAL=7`, `LEVEL_GOAL=20`, `DAY_DEADLINE=49` | as specified, one line | ✅ exact, still exact |
| 6 | `_renderObjectiveChip()` at the end of `storyUpdateStatus()` | as specified | ✅ exact |
| 7 | One-time modal off `storyNewGame`, never `storyNewGamePlus` | as specified | ✅ exact |
| 8 | *"Take the map →"* dismisses | as specified, verbatim | ✅ exact |
| 9 | `courierMapSeen` defaulted in `_S_DEFAULTS()` per §STATE-INIT | added to the **seed literal** instead | ❌ false at its own ship commit (§7.2) |

**Nine locked items; eight shipped byte-exact.** Rows 3 and 4 were then deliberately superseded by
§PLAY-01-C nineteen minutes later — a *gain*, not a regression, and named as such in
§7.1. Row 9 was wrong the day it was written.

---

## VI. Verification-plan outcome (the report's own §4, re-run at HEAD)

| Plan item | Result 2026-08-18 |
|---|---|
| 1. Whole-file tokenizer parse of the inline `<script>` | ✅ **1 block, 0 parse errors** |
| 2. `tests/integration/courier-map.smoke.test.js` | ✅ **1/1**, 17 assertions, 2.5 s |
| 3. Spot-run the nav suite | ✅ **35/35**; combined run **36/36**, no retries |

**The acceptance test is honest about what it covers and silent about what it does not.** It
asserts seven symbols, 0 → 3 → 7 darkening, the exact leg strings `⭐ Lv 1/20` and `☀ Day 1/49`,
the gold-at-20 state, and — since §PLAY-01-C amended it — that the chip is calm at day 45 and
softly amber at day 47 (`tests/integration/courier-map.smoke.test.js:out.day47SoftWarn@53`). It
contains **no assertion about `#s-day`** and it calls `storyNewGame` **once per page load**. Those
are precisely the two blind spots the findings below occupy. Neither defect is a test failure;
both are outside the test's universe.

---

## VII. Findings

### 7.1 Two day-counters, one screen, and they have disagreed for 37 days → **§DX-02dg** 🟡

The report locked one invariant on the day leg: *amber ≥ 35, red ≥ 42 —* ***"mirrors the existing
`#s-day` thresholds so the two agree."*** It shipped byte-exact.

**§PLAY-01-C (`caa489e`, +19 min 42 s) reframed the deadline as generous and rewrote only one of the
two surfaces.** The chip lost its red alarm entirely and kept a soft amber inside three days of the
cap (`(day >= DAY_DEADLINE - 3 ? @36193`). The sidebar still carries the original doom ladder
(`(S_story.day >= 42 ? @36105`). Proved in the browser, one page, one tick apart:

| Day | `#s-day` sidebar | `#obj-day` chip |
|---|---|---|
| 34 | plain | plain |
| 35–41 | **amber** | plain |
| 42–45 | **red** | plain |
| 46–49 | **red** | amber |

**The two surfaces agree on no day above 34.** At Day 42 the sidebar screams and the chip
introduced to explain the sidebar says nothing; at Day 46 they are both lit, in different colours,
about the same number. §PLAY-01-C's commit carries an explicit *"Not touched (deliberately)"* list —
the Day-49 defeat flavour, the Void-Tide events, `_addVoidPressure`, sleep, the day counter — and
the sidebar's **colour** is on none of it. This is not a deferral that rotted; it is a surface that
was never in view. ***A reframe applied to one surface is not applied to the feature*** — the exact
sibling of §DX-02de's *a hazard fixed in one branch of a function is not fixed in the function*.

Two smaller items on the same chip, filed as (b) and (c) of the same row because all three are
one-liners in the same twenty lines of CSS and render code:

- **(b) The level pill warns you for being level 8 of 20.** `(lv >= 8 ? @36141` turns `#s-level`
  amber at Lv 8 — a threshold inherited from the initial commit `b7280b3`, when 8 was near the top
  of the curve. `XP_LEVELS` now runs to 20 and the chip beside it says so. The sidebar flags 60 % of
  the levelling curve as a warning state, immediately below a chip stating that 20 is the target.
- **(c) The uncollected shard symbols are measurably close to invisible.** The chip paints its own
  `rgba(20,14,4,0.55)` panel over the `#F0E6C8` parchment card; measured contrast against that
  blend is **3.12:1** for a collected `🔮`, **2.54:1** for the leg text, and **1.40:1** for an
  uncollected `◇`. This is as-designed — *"faded"* and *"dim"* are the report's own words, and
  `--bg` was parchment at the ship commit, so nothing drifted — but a feature whose thesis is
  *count what is left at a glance* should probably be legible at a glance. A designer's call on one
  alpha value, not a defect.

### 7.2 The one state field is in the wrong object, and the opening frame fires once per page load → **§DX-02dh** 🟡

§3 states: *"The one added state field `courierMapSeen` is defaulted in `_S_DEFAULTS()` (§STATE-INIT
single-source rule) so a fresh load and a reset agree."* **It is not, and they do not.**

The field was added to the seed literal `courierMapSeen: false,@23044`, inside the block whose own
comment two lines above reads `seed only — replaced with the canonical@22999` … *"Do not rely on
these values; keep `_S_DEFAULTS()` authoritative."* The seed object is then discarded wholesale at
`S_story = _S_DEFAULTS();@23403`, and `const _S_DEFAULTS = () => ({@23062` has never carried the
key — in any build, under any name.

The consequence is behavioural, and it is exactly the failure the guard was written to prevent,
running in the opposite direction. `storyNewGame` resets state with
`Object.assign(S_story, _S_DEFAULTS());@23954`, which cannot clear a key its source object does not
declare. So `courierMapSeen` is set to `true` on the first fresh game and **never returns to
`false` without a page reload.** Browser-proved, one page, three calls:

| Probe | Result |
|---|---|
| `_S_DEFAULTS()` has own property `courierMapSeen` | **false** |
| After boot, `S_story` has own property `courierMapSeen` | **false** |
| `storyNewGame()` #1 → frame visible | **true** ✅ |
| `storyNewGame()` #2, same page session → frame visible | **false** ❌ |

**The reachable path is the defeat screen.** `, storyNewGame);@38329` wires the *"↩ New Game"*
button straight to `storyNewGame` with no reload in between. A player who loses, clicks it, and
starts over is handed the world without the map — the single surface that states the win condition
in words is gone, and only the chip's four glyphs remain to carry it. The player most in need of
the goal restated is the one guaranteed not to get it.

The report called the guard *"belt-and-suspenders… so a future caller can't double-fire it."* The
belt held perfectly. The suspenders were nailed to the floor. Fix is one line — move the field into
`_S_DEFAULTS()` — plus one assertion driving two consecutive `storyNewGame()` calls, which is the
gap in §VI that let this live 37 days.

### 7.3 Two internal inconsistencies, neither load-bearing

- **"No new state" vs "the one added state field."** §2(A) closes with *"No new state."* and §3 opens
  by defaulting `courierMapSeen`. Both are true of their own halves — the chip is pure derivation,
  the modal needs a flag — but the reader has to work that out. Scored as imprecision, not error.
- **The symbols brighten; the report says they darken.** *"The seven symbols darken as each Shard
  returns"* describes an implementation in which uncollected is dim `◇` and collected is bright gold
  `🔮`. The verb is inherited from the parent play-review, where it means *inked in* rather than
  *dimmed*, and the ship commit repeats it verbatim. Harmless, and worth naming because the
  commit-message copy makes it the repo's canonical description of the mechanic.

### 7.4 Positive findings worth keeping

1. **The scope guard is exactly true.** The ship commit's seven HTML hunks are: chip CSS, chip
   markup, modal markup, one field in the seed literal, the `storyNewGame` tail, the
   `storyUpdateStatus` tail, and one button listener. Zero writes to mover, combat, economy, quest,
   or save-schema surfaces. A §3 promise of *"UI/display only"* that measures as UI/display only is
   rarer in this corpus than it should be.
2. **The NG+ exclusion holds under adversarial conditions.** With `courierMapSeen` forced back to
   `false`, `storyNewGamePlus()` still does not open the frame — the exclusion is structural (the
   call site simply is not there), not flag-dependent. NG+ veterans are genuinely never re-lectured.
3. **The double-fire guard works.** Calling `_showCourierMap()` a second time after dismissal is a
   clean no-op. The mechanism is sound; only its reset is missing.
4. **The chip degrades safely outside the game.** `function _renderObjectiveChip() {@36176` returns
   early when `#obj-shards` is absent, so `worldbuilder.html` and any harness that loads the render
   path get a no-op rather than a throw. Zero page errors across all four browser runs.
5. **The renderer is genuinely derivation-only.** Shards, level and day are read from `S_story` and
   never written. The chip cannot desynchronise from the sidebar's *numbers* — only, as §7.1 shows,
   from its *colours*.

---

## VIII. What the feature actually did for the game

Measured rather than asserted, 37 days on:

- **The four clauses are stated in two registers.** Prose, once, in the courier's voice at the start;
  and continuously, in four glyphs, for the rest of the run. That is the correct shape — narrative
  for comprehension, HUD for tracking — and it is why the chip survived a design reversal that
  rewrote its own tooltip without anyone proposing to remove it.
- **It gave the honesty class a working precedent.** §CODEX-01 — the largest open UI row in the
  repo — is written on top of it by name, and inherits the recipe verbatim: read-only, reflects
  existing constants, can never drift from balance.
- **It exposed the say/do gap that became §PLAY-01-C.** Writing the deadline down in plain words is
  what made it obvious that the deadline was a lie: the day only advances on sleep, so Day 49
  requires roughly 48 deliberate sleeps and is effectively unreachable. **The chip did not create
  that dishonesty; it made it legible enough to fix.** A surface whose first act is to indict the
  system it describes has done its job. That §PLAY-01-C then repaired only half the surface area is
  §7.1, and does not diminish this.
- **What it did not do, and should not be credited with.** It does not teach the *rules* — the skill
  formula, the XP curve, the magic tiers are all still untransmitted (§CODEX-01-A). It states the
  destination, not the route.

> *"You came. You kept it open forty-nine days. That is not nothing. It is not enough, but it is not
> nothing."*
> — `The court had granted forty-nine days@23888`, the only place the game ever explained the
> deadline before this slice, and it only says it once you have lost.

---

## IX. Open decisions

1. **§DX-02dg (a)** — align `#s-day` with the chip's §PLAY-01-C framing, or revert the chip to the
   sidebar's ladder. One line either way; the reframe was a user decision, so aligning the sidebar
   *to the chip* is the reading consistent with that call.
2. **§DX-02dg (b)** — retire or re-target the `lv >= 8` warn threshold against a Lv 20 curve.
3. **§DX-02dg (c)** — design call on the uncollected-shard alpha (1.40:1 measured).
4. **§DX-02dh** — move `courierMapSeen` into `_S_DEFAULTS()`; add the two-consecutive-new-games
   assertion to the smoke test.
5. **Not filed, deliberately.** `#objective-chip` declares one palette and no second theme block,
   so it renders identically in both — exactly as its Location-card neighbour `#corpse-chip` does
   (§DOC-02cc reached the same verdict on that chip). It matches its siblings; consistency beats a
   cosmetic row.

---

## Appendix — verification evidence

- **Dating (108).** Report and code are one commit, `b46d3f0`; `git diff b46d3f0 HEAD` over this
  file is empty. **6 of 6** published citations byte-exact at `ec3fd36` — `#story-location-hd-card`
  4191 · Day-49 flavour 23096 · `#s-day` 34648 · `#s-shards` 34651 · `#s-level` 34681 ·
  `story.md` 159–163. No mid-edit re-measurement and no fabricated identifiers: the prose was typed
  **before** the diff, and every number is one the author could copy.
- **Provenance (4).** `_renderObjectiveChip`, `courierMapSeen` and `story-courier-modal` each carry
  exactly two code-bearing commits — `b46d3f0` and the §PLAY-01 archive sync `f2e8d44`. Nothing here
  was retired and re-minted under another name.
- **Tests.** `npx playwright test courier-map.smoke navigation` → **36 passed**, one run, no
  retries. Acceptance 1/1; declared regression 35/35.
- **Parse.** Whole-file tokenizer over the inline `<script>`: **1 block, 0 errors** at HEAD.
- **Live probes (88, 117).** Three throwaway Playwright specs driving the real functions — day-leg
  colour sweep across nine days on both surfaces; the two-consecutive-`storyNewGame` sequence with
  `hasOwnProperty` checks against `_S_DEFAULTS()`; and a computed-style pass for the contrast
  figures. All run against `roll2hit-v3.html` at HEAD, recorded above, and deleted.
- **Scope.** Seven HTML hunks in the ship commit, read individually; zero mechanic writes.
- **Gates.** `npm run check:walk` chain reached `check:anchors` and `check:legacycodes` — every
  gate exit 0. `check:anchors` **3,660 → 3,707 across 88 → 89 docs** (this report joined the
  anchored set; it previously carried none), **0 dead**, 117 stale = unchanged baseline. The +47
  is 36 in this report and 11 in the two new rows, counted after the §RESUME entry was written.
- **Untouched.** `roll2hit-v3.html` was not modified by this re-verification. The only working-tree
  change present is the user's 2026-08-06 palette recolor, still exactly 9 additions / 9 deletions.

**Corrections applied to other documents.** `plan-archive.md` §PLAY-01-A repeats both false claims
verbatim — the `_S_DEFAULTS()` defaulting and the *"mirrors the existing `#s-day` thresholds"* — and
is annotated in place rather than rewritten, per the archive convention.
