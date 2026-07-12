<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §PLAY-01-C *No Postponements*: make time honest (option c)

**Parent:** `lab-reports/lab-report-play-review.md` §PLAY-01-C · **Track:** BACKLOG.md §PLAY-01
**Date:** 2026-07-12 · **User decision:** **(c) reframe the deadline as generous, drop the doom** (relax the *story*, not the systems)

## 1. The say/do gap (verified in code)

- The day advances **only on sleep** — `storySleep()` does `S_story.day = min(49, day+1)` (`34880`). Movement + combat are timeless.
- `voidPressure` rises **only** when you sleep *into* a scheduled Void-Tide day (`VOID_TIDE_EVENTS`, days 3/7/14/21/28/35/42) via `_addVoidPressure(1)` in `storyCheckVoidTide()` (`34979`); 10 = defeat.
- The **Day-49 time-defeat** (`storyVoidDefeat('time')`) fires **only inside the sleep flow when `day >= 49`** (`34841`). Since day only moves by sleeping, hitting 49 means sleeping ~48 times — **effectively unreachable in normal play.**

**Conclusion:** the systems are already lenient — time is nearly free and the hard cap is a corner case. What lies is the **framing**: the game presents a doom countdown ("before Day 49 — the tide will not wait", red-alert day chip) that the mechanics never enforce. Per the user's pick, the honest fix is to make the *framing generous* to match the lenient reality — **not** to add pressure (that would be options a/b, rejected).

## 2. Scope — reframe the player-facing doom, keep the mechanic

**Change (framing only, no mechanic/balance change):**

1. **Opening courier frame (§PLAY-01-A)** — the 4th goal line `☀ Do it all before Day 49 — the Void's tide will not wait` → a **generous-horizon** line: the seals hold a long while; the Void gains only slowly and only while you rest; take the time you need. Drop the "will not wait" doom.
2. **Persistent objective chip day-leg** — remove the red **`danger`** alarm (≥42) entirely; keep only a **soft amber** heads-up very near the *real* cap (≥46, within 3 of the 49 hard edge) so the chip is honest about the far boundary without faking urgency during normal play. Retooltip the chip: drop "before Day 49"; state that time is generous.
3. **`SHARD_GOAL/LEVEL_GOAL` untouched;** the `☀ Day N/49` readout stays (the /49 cap is real) — it just stops screaming.

**Explicitly NOT changed:**
- The Day-49 `time` defeat + its flavor (`_DEFEAT_COPY.time`, `23173`) — it only ever shows to a player who *chose* to sleep out the whole clock; it is the honest, rare consequence of the one soft rule, and it is already self-aware and gentle ("That is not nothing"). Leaving it avoids a reverse-mismatch (framing generous, yet a hidden guillotine) while keeping the corner-case honest.
- The Void-Tide atmospheric events — earned by sleeping, good ambience, not false framing.
- No change to `_addVoidPressure`, the tide schedule, sleep, or the day counter.

## 3. Verification
1. Whole-file inline-script parse — 0 errors.
2. Update `courier-map.smoke.test.js`: the day-leg no longer goes **danger** at 45 (now neutral); assert **no danger class ever**, and a **soft `warn`** only at ≥46. Frame copy no longer contains "will not wait".
3. Screenshot: chip reads calm at a mid-game day; frame states a generous horizon.
