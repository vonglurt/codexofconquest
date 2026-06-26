<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — §TIMELESS-01: Timeless One-Cell Movement + Hunt Feature Removal

**Date:** 2026-06-26
**Status:** SPEC (locked; pre-implementation — no `roll2hit-v3.html` edits yet)
**Scope:** Movement time model + full removal of the Hunt/Stalk subsystem
**Related:** §WALK series (navigation core), §CELL-03 (one-cell MUD movement), §DATA-01 (quest data/code separation)

---

## 1. Motivation (user directive, 2026-06-26)

> "remove all walkable gap distances. that concept should not exist. The game should still be walkable. The position will move only N,E,S, or W. There should be no mention of time warp traveling, and the hunting time bonus. the screen, the entire concept is gone, we now move only one cell at a time (lat/long), or whatever the map has for cell movement N,E,S,W."

Resolved into three decisions (via clarifying questions):

| # | Decision | Chosen |
|---|----------|--------|
| D1 | Time/clock system | **Only movement is timeless** — keep the `⏱ Hours` HUD, fatigue, and Day 1→49 deadline; moving a cell no longer advances time. Battles / sleep / fishing / short-rest still cost time. |
| D2 | Hunt Mode | **Remove the entire feature** — 🎯 button, HUNT cards/accordion, stalk modal, `huntMode` state, hunt-only helpers. |
| D3 | Rollout | **Plan + lab report first**, then implement in reviewable increments (one per "continue"). |

### 1.1 What "walkable gap distance" actually is

Investigation (two Explore passes) confirmed the **runtime is already pure one-cell N/E/S/W movement** (§CELL-03 / §WALK-2 `Mover.move`). There is **no** multi-cell gap travel, warp, fast-travel, or travel screen in the game. Clicking a non-adjacent node already refuses with *"not reachable in one step."* So "gap distance" survives only as:
- leftover **hint wording** in the map-click handler, and
- the **worldbuilder/tooling** `fill-gap` / `maxGap` / `axisDist` concept — already being retired in **§WALK-3** (Inc 2 410'd `fill-gap`/`rip-and-connect`).

No runtime movement-logic change is required for "no gap distance"; only wording cleanup.

### 1.2 What "time warp traveling" is

The in-game **hours clock** (`S_story.hoursElapsed`, shown in the HUD as `⏱ Hours`) advances on several actions. Per D1, the only change is that **moving a cell stops advancing it**. The clock, fatigue, and Day-49 deadline remain.

---

## 2. Current-state inventory (line numbers as of commit `017d7d8`)

### 2.1 Movement time advancement
| Site | Lines | Action | Disposition |
|------|-------|--------|-------------|
| `cellMove` | 25762–25763 | `hoursElapsed`/`hoursSinceSlept` += 1 **per cell moved** | **REMOVE** (D1) |
| `_storyRollInit` (battle start) | 22337–22338 | += 1 per battle | keep |
| short-rest button | 6449–6450 | += 1 per short rest | keep |
| `storyShortRest` fn | 23413–23414 | += 1 per short rest | keep |
| `storyQuestHunt` | 26726–26727 | += 2 per hunt | **REMOVE with hunt** |
| sleep | 31909–31910 | += 8, reset fatigue | keep |

Movement is the **only** time site removed. `_enterEmptyCell` and `storyRender` carry no time of their own — they run inside `cellMove`, so removing the two `cellMove` lines makes both named-node and empty-cell entry timeless.

### 2.2 Hunt/Stalk subsystem (full removal)

**State (`_S_DEFAULTS`)**
- `huntMode: false` (20894 + duplicate 20922) → **remove**.
- `slStalksWon: 0` (20892 + 20919) → **keep** (see §3) — it counts BMA battle wins, not stalks.

**DOM / HTML**
- `#btn-hunt-toggle` 🎯 d-pad button (4290) → remove.
- Stalk modal `#story-stalk-modal` / `#stalk-card` / `#btn-stalk-wait` / `#btn-stalk-abandon` (4388–4399) → remove (already never shown — legacy/dead).

**CSS**
- `.story-card-btn.btn-hunt` (1054–1055, dark 3030–3034) → remove.
- `#story-stalk-modal` / `#stalk-card` / `#btn-stalk-wait` / `#btn-stalk-abandon` (2174–2206, 3203–3211) → remove.

**Functions (all hunt-only → remove)**
- `storyToggleHunt` (32826–32832), `_updateHuntBtn` (32814–32824)
- `storyQuestHunt` (26713–26734), `storyQuickWait` (26647–26658)
- `_stalkedMonsterPick` (32970–32985+), `_getQuestTargetKeys` (32957–32968)
- `HUNTING_GROUNDS` constant (9228–9296) — used only by `storyQuickWait` (26649) + hunt card (29763)

**storyRender hunt UI**
- "Stalk" section + HUNT card + accordion + monster rows (29792–29887)
- per-quest "🎯 Hunt" cards (29900–29907)

**Encounter logic (`cellMove`)** (25822–25831)
- Replace the `huntMode ? 1.0 : baseRate` / `_stalkedMonsterPick` / "🎯 Hunt ambush" branch with the **plain path**: always `baseRate` + `_weightedMonsterPick` + "Wild …" label.

**`pb.stalk` flag + guards**
- Set at 26653, 26729, 29855, 29864 → gone with the functions/UI above.
- Guards `!pb.stalk` at 22898 and 32217–32218 → simplify (always true once nothing sets `stalk`); leave behavior identical.

**Wiring / misc**
- `btn-hunt-toggle` listener (33012) → remove.
- Escape-key stalk-modal close (32903) → remove.
- Stalk-modal hide on `storyRender` (27334) → remove.

### 2.3 Time HUD & costs that STAY (D1)
- `⏱ Hours` HUD (`#s-hours`, 3927; updated 31783) — **keep**.
- Fatigue: `hoursSinceSlept >= 24` → battle disadvantage (22716) — **keep**.
- Day 1→49 deadline; advances on sleep only (31909) — **keep**.
- Action time-cost hints that remain real: fishing `⏱ 1 hour` (29894), combat `⏱ 1 hour` (29923), sleep `⏱ 8 hours` (30197), short rest `⏱ 1 hour` (30232) — **keep**. Only the hunt hint `⏱ 2 hours` (29807) is removed.

---

## 3. Quest impact — `quest_slums_cleanup` (Yael: Slums Cleanup)

- Definition (19697–19701): `type:'side'`, `activateNode:'LHR'`, `waypointNode:'BMA'`, `completeFn:() => (S_story.slStalksWon||0) >= 3`, reward 80.
- **`slStalksWon` is mislabeled.** It increments on **any** battle win at node `BMA` (22904–22906: `if (pb && pb.nodeCode === 'BMA') slStalksWon++`), independent of Hunt Mode. The hint already reads *"Head north to the Birka Slums and clear vermin."*
- **Therefore removing Hunt Mode does not break this quest.** Three battles at BMA still complete it; encounters at BMA still trigger via the normal terrain encounter rate on cell entry/movement (just no longer forced to 100%).
- **Rework = clarity only (optional):** rename `slStalksWon` → `slBattlesWon` with a one-line load-compat shim (`S_story.slBattlesWon ??= S_story.slStalksWon || 0`) so existing saves carry over. If we keep the name, zero migration is needed. **Decision: keep the field name** to avoid save churn; add a code comment that it counts BMA battle wins. (Re-evaluate during Inc D.)

---

## 4. Implementation increments

| Inc | Title | Touches | Verify |
|-----|-------|---------|--------|
| **A** | Movement timeless | delete 2 lines in `cellMove` (25762–63) | move a cell → `⏱ Hours` unchanged; battle/sleep still advance it |
| **B** | Hunt logic + state | `cellMove` encounter branch → plain path; remove hunt-only fns (`storyToggleHunt`, `_updateHuntBtn`, `storyQuestHunt`, `storyQuickWait`, `_stalkedMonsterPick`, `_getQuestTargetKeys`, `HUNTING_GROUNDS`), `huntMode` default, `pb.stalk` flags/guards, listener/escape/nav-hide | grep clean: no `huntMode`/`stalk`/`HUNTING_GROUNDS`/`_stalked` refs remain; page loads; encounter still rolls on move |
| **C** | Hunt UI/DOM/CSS | remove 🎯 button (4290), stalk modal (4388–4399), hunt CSS, hunt cards in `storyRender` (29792–29887, 29900–29907) | no dead element IDs referenced; story node renders without HUNT card; no console errors |
| **D** | Quest + wording + docs | confirm `quest_slums_cleanup` completes via BMA wins (comment the field); reword map-click "not reachable in one step" if it reads as distance; sync `mechanics-combat.md §Hunting Mode`, `index.md`, state-field count, `plan.md` | quest completes after 3 BMA wins; docs reflect removal |

**Ordering rationale:** A is independent and tiny. B removes the JS that C's DOM/CSS references — but C's elements only *call* B's functions via listeners, so B-before-C avoids a window where the UI calls deleted fns. (Alternatively C-before-B; either is safe if done in one session. Lock **B → C**.)

**API-First note:** Hunt removal, the time model, and the quest completion logic are **code** (engine functions, `_S_DEFAULTS`, `QUEST_DB.completeFn` per §DATA-01), not WBAPI-expressible data. Direct HTML edits are the correct path here; no `wbapi-server.js` endpoint applies. No node/monster/terrain CRUD is involved.

---

## 5. Risks & non-goals

- **Risk — encounter farming at BMA slows.** Without forced 100% encounters, the Slums quest relies on the terrain base rate. Acceptable (natural pacing); not a blocker. If it proves tedious, a follow-up could raise BMA's `TERRAIN_ENCOUNTER_RATE` slightly — out of scope here.
- **Risk — stale doc references.** `mechanics-combat.md §Hunting Mode`, the index "Hunt Mode" reverse-lookup rows, and any `HUNTING_GROUNDS` mentions must be retired in Inc D (two-way sync rule).
- **Non-goal:** the Day-49 deadline, fatigue/disadvantage, the hours HUD, and non-movement time costs all **stay**. This report does not touch combat, fishing, or sleep mechanics beyond removing the hunt hooks.
- **Non-goal:** no change to `Mover.move` / `mover.js` — movement *direction/position* logic is already correct; only the time side-effect in the `cellMove` caller changes.

---

## 6. Acceptance criteria

1. Moving any number of cells leaves `S_story.hoursElapsed` unchanged; a battle or sleep still advances it.
2. No `huntMode`, `_stalked*`, `HUNTING_GROUNDS`, `storyQuestHunt`, `storyQuickWait`, `_updateHuntBtn`, `storyToggleHunt`, or stalk-modal identifier remains in `roll2hit-v3.html` (grep-clean).
3. Story nodes render with **no** HUNT/Stalk card; the d-pad has **no** 🎯 button; no console errors on load or navigation.
4. `quest_slums_cleanup` still completes after 3 battle wins at BMA.
5. Encounters still roll on cell movement at each terrain's normal rate.
6. Docs synced: `mechanics-combat.md`, `index.md`, `plan.md`, state-field count.

---

*© 2026 Paul Richeson — MIT License.*
