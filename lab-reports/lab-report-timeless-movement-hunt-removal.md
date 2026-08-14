<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — §TIMELESS-01: Timeless One-Cell Movement + Hunt Feature Removal

**Date:** 2026-06-26 · **Verified:** 2026-08-14 (§DOC-02bl)
**Status:** ✅ **SHIPPED** — 4 of 4 increments plus an unplanned follow-up, all on the spec date
**Reference commit:** `017d7d8` (every line number in the original spec was taken against it)
**Related:** §WALK · §CELL-03 · §ARCH-01 (UQF) · **§KG-01 — see §5**

---

## Abstract

The game charged an hour of a 49-day doom clock for every cell of walking. This report specified
removing that charge and deleting the Hunt/Stalk subsystem built on it. Both shipped the same day
(`7d1418c`, `7952752`, `5a54657`, `1d6263a`) plus a documentation sweep (`790d4f3`).

Re-measured 49 days later: **the movement half is intact; the removal half is not.** Twelve days
after this report closed, §KG-01 (`8168f0e`) reintroduced a *different* mechanic under the
*identical* identifiers — `huntMode`, `storyToggleHunt`, `_updateHuntBtn`, a 🎯 button. Six sites
across the engine and three maintained docs still certify a removal that has been undone, including
one engine comment announcing the deletion of two functions defined 28 and 39 lines above it.

The spec's pointer accuracy is **13 of 13 exact**. Its one substantive error is a single adjective.

---

## 1. Motivation and design intent

> *"remove all walkable gap distances. that concept should not exist. The game should still be
> walkable. The position will move only N,E,S, or W. There should be no mention of time warp
> traveling, and the hunting time bonus. the screen, the entire concept is gone, we now move only
> one cell at a time (lat/long), or whatever the map has for cell movement N,E,S,W."*
> — user directive, 2026-06-26

| # | Decision | Chosen |
|---|----------|--------|
| D1 | Time model | **Only movement is timeless.** Keep the `⏱ Hours` HUD, fatigue, Day 1→49. Battle, sleep and rest still cost time. |
| D2 | Hunt Mode | **Remove the entire feature** — button, cards, stalk modal, state, helpers. |
| D3 | Rollout | Lab report first, then one reviewable increment per "continue". |

### 1.1 Why this makes the game better to play

The doom clock is the game's central pressure — seven Codex Shards, forty-nine days. A resource that
tense only works if the player can see what it is charging them for. An hour per cell put the
clock's largest expense on its least interesting action, and taxed the one thing the project holds
inviolable: **free movement** (invariant #1). Walking became a budget item and exploring became
something to feel guilty about.

Making movement free moves the whole cost onto **decisions** — fighting, resting, sleeping. Those
are moments the player chose. Curiosity stops competing with survival, the 416-node world becomes
something to wander rather than ration, and the deadline survives with more force, not less, because
everything still on it is something the player actually did.

Hunt removal followed from the same logic: that era's Hunt forced encounters to a **guaranteed
100%** and charged 2 hours for it — a mode whose whole function was converting time into fights.
With movement free, its premise was gone.

### 1.2 What "walkable gap distance" turned out to be

The runtime was **already** pure one-cell N/E/S/W movement (§CELL-03, §WALK): no multi-cell travel,
no warp, no travel screen, and a non-adjacent map click already refused. "Gap distance" survived only
as leftover hint wording and the worldbuilder's `fill-gap`/`maxGap` tooling, already being retired by
§WALK-3 — which is why this report is mostly a deletion. *The concept the directive asked us to
abolish had quietly abolished itself.*

---

## 2. Method (verification pass, 2026-08-14)

Every named symbol batched through one `grep -c` loop against live `roll2hit-v3.html`; `git log -S`
with **no pathspec** on each, to separate *retired* from *never shipped* — and, as it turned out, to
catch a *re-added*; spec line numbers replayed against `git show 017d7d8:roll2hit-v3.html`;
`_S_DEFAULTS()` censused by a brace-depth walk, not a line regex.

---

## 3. As-built

| Inc | Commit | Delivered |
|-----|--------|-----------|
| — | `d4fae39` | Spec locked (this report) |
| **A** | `7d1418c` | Movement no longer advances the clock |
| **B** | `7952752` | All Hunt/Stalk JavaScript removed |
| **C** | `5a54657` | Hunt/Stalk UI, DOM and CSS removed |
| **D** | `1d6263a` | Quest comment · map-click wording · doc sync |
| **FU** | `790d4f3` | *(unplanned)* Hunt/Stalk residue swept from 7 deeper spec docs |

`function cellMove(dir)@28345` holds zero clock writers and says so at line 28366. Exactly **four**
`hoursElapsed` writers survive, all on the D1 keep-list: the short-rest button (7149),
`function _storyRollInit()@24624` at battle start (24650), `function storyShortRest(nodeCode)@25817`
(25841), and `function storyConfirmSleep()@36244` at +8 (36300). The `⏱ Hours` HUD
(`id="s-hours"@4190`) and the 24-hour fatigue rule (25046) are live.

The **Stalk** half is gone and stayed gone: `storyQuestHunt`, `storyQuickWait`, `btn-hunt-toggle`,
`btn-stalk-wait`, `btn-stalk-abandon`, `stalk-card` are all **0 occurrences**; `HUNTING_GROUNDS`,
`_getQuestTargetKeys` and `_stalkedMonsterPick` survive only inside tombstone comments, which counts
as dead. Ten `§TIMELESS-01` tombstones remain in the engine. **Nine are true.**

---

## 4. Spec → shipped delta, and the acceptance criteria

Criteria 1–6 are the spec's own, adjudicated in place.

| # | Claim / criterion | At HEAD | Verdict |
|---|---|---|---|
| 1 | **AC1** — movement leaves `hoursElapsed` unchanged; battle/sleep still advance it | 0 writers in `cellMove`; 4 elsewhere, all keep-list | ✅ |
| 2 | **AC2** — no hunt/stalk identifier remains (grep-clean) | Stalk clean; **Hunt live** | ❌ split (§5) |
| 3 | **AC3** — no HUNT card, no 🎯 button | button back at `id="btn-hunt"@4752` | ❌ (§5) |
| 4 | **AC4** — `quest_slums_cleanup` completes on 3 BMA wins | true; §ARCH-01 migrated it to UQF-1.0 `completion.countMin` | ✅ |
| 5 | **AC5** — encounters still roll on movement at terrain rate | plain path at 28437 | ✅ |
| 6 | **AC6** — docs synced | synced then, **wrong now** | ❌ (§6-A) |
| 7 | Encounter branch → plain `baseRate` | plain, then **re-branched** by §KG-01 at 28440 | ⚠️ partial |
| 8 | `slStalksWon` kept, no save migration | kept; writer 25328, comment 25325 | ✅ |
| 9 | Map-click wording reworded | phrase 0 occurrences (`1d6263a`) | ✅ |
| 10 | 13 cited line numbers | 13/13 byte-exact at `017d7d8` | ✅ |
| 11 | Fishing's `⏱ 1 hour` is a real cost that stays | **never had a clock writer** — not at `017d7d8`, not now | ❌ **NOT SHIPPED** (§6-B) |
| 12 | State-field count synced | wrote *"All 193"*; the function held **486** that day | ❌ **NEVER CORRECT** (§6-C) |

**4 of 6 acceptance criteria hold.** Both failures are the same event, and it is not this report's
fault.

---

## 5. The finding: a removed feature's vocabulary was re-used

Twelve days after this report closed, `8168f0e` (§KG-01, 2026-07-08) shipped a new Hunt Mode — a
genuinely different mechanic:

| | Removed (June) | Re-added (July) |
|---|---|---|
| Encounter rate | forced **1.0**, guaranteed | `baseRate × 2`, **capped 0.8** (28440) |
| Monster choice | quest-target picker | 80/20 bias toward monsters ≤ player level (38245) |
| Time cost | +2 hours per hunt | none — movement is timeless |
| Scope | quest cards + stalk modal | wilderness cells only |
| Toggle | `btn-hunt-toggle` | `btn-hunt` (4752) |

Same name, same state field, same two function names, different behaviour. The new design is
**better** and consistent with D1 — a grinding aid that costs no clock — and it lives entirely in
`function _enterEmptyCell(r, c)@28420` and `function _weightedMonsterPick(terrain)@38237`, whose only
caller is that function; named-node battles never consult it.

The defect is not the feature. It is that **nothing updated its predecessor's paperwork**, and the
paperwork was thorough. Most vividly, line 38113 still reads:

> `// §TIMELESS-01: _updateHuntBtn / storyToggleHunt removed with the Hunt feature.`

`function _updateHuntBtn()@38074` and `function storyToggleHunt()@38085` are defined 39 and 28 lines
**above** that sentence. *The tombstone outlived the corpse, and the corpse got up.*

The general hazard, in its sharpest form: **a retired feature's vocabulary is not free to re-use.**
The existence check passes and the grep for the old name succeeds, so every claim about the removal
reads as confirmed while being false.

---

## 6. Risk register and defects filed

| Risk (as filed) | Outcome |
|---|---|
| BMA farming slows without forced encounters | **Resolved, not as proposed.** The spec suggested raising BMA's terrain rate; §KG-01 restored deliberate grinding globally instead. The follow-up was never needed. |
| Stale doc references to Hunt/Stalk | **Materialised, then inverted** — Inc D and `790d4f3` swept them; §KG-01 made the corrected docs wrong again. |
| Non-goals: deadline, fatigue, HUD, non-movement costs, `mover.js` untouched | **All held.** |

**A · §AUDIT-03be** 🟢 — six sites certify a removal §KG-01 undid: the engine comment at 38113;
`mechanics-combat.md:690`, which lists three live symbols under *"Removed code/state"*;
`docs-node-network.md:306`; `index.md:409` and `:523`. The same `mechanics-combat.md:688` adds
*"movement and battle no longer advance the clock"* — **battle always did**, by D1 of this very
report, and the engine's comment at 28366 says so.

**B · §DX-02bz** 🟡 — the fishing card advertises `⏱ 1 hour · fishing session` (35371) and charges
nothing. There were exactly **six** clock writers at `017d7d8` — the six in this report's own §2.1
table — and none was fishing; four now, still none. The row also records that sleep advances
`hoursElapsed` by 8 but the wall clock `hour` by 6, and the wall clock decides night fishing.

**C · §AUDIT-03bf** 🟢 — `index.md:523` reads *"All 193 `S_story` fields from `_S_DEFAULTS()`"*. That
sentence was written by **this report's own Inc D** (`1d6263a`), and at that commit the function held
**486** top-level fields while the doc's table listed **205** rows — matching neither denominator on
the day it was written. At HEAD: **493** and **208**. The word carrying the error is *"All"*.

---

## 7. Conclusion

§TIMELESS-01 did what it set out to do, completely and in a day, and its bookkeeping was unusually
good: thirteen of thirteen pointers land byte-exact seven weeks later, and it left ten labelled
tombstones so the next reader would know what had been here. Yael still runs her Slums detail on
three plain battles at BMA, exactly as predicted — and still will not say thank you.

**The first lesson it demonstrates rather than states.** Its inventory tables, copied out of the
file, are flawless. Its single wrong claim is one adjective, applied to a line it had transcribed
*correctly*, four lines after tabulating the evidence that disproves it: fishing's `⏱ 1 hour` was
called a cost that "remains real" because the hint says so. **Transcription is reliable; the
characterisation laid over it is not — and sitting beside a correct citation is no protection.**

**The second is what happened afterwards.** A deletion cannot defend its own vocabulary: the careful
tombstones this report left became six confident false statements, because the next author needed a
name for a good idea and the best one was lying around unused. *Nothing is quite as reusable as a
word you have just finished burying.*

---

*© 2026 Paul Richeson — MIT License.*
