<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §PLAY-01-A *The Courier's Map*: goal legibility

**Parent:** `lab-reports/lab-report-play-review.md` §PLAY-01-A · **Track:** BACKLOG.md §PLAY-01
**Date:** 2026-07-12 · **Class:** honesty fix (UI-only; no design call, no balance risk)

## 1. The defect (verified in `roll2hit-v3.html` @ HEAD)

The win condition — **7 Codex Shards · Level 20 · defeat Commander Auros (CO) · before Day 49** — is
never stated to the player. The literal string "49 days" appears **once in the whole file**, inside the
Day-49 *defeat* flavor text (`23096`). The engine literally commits the game's own subject, the Curse of
Knowledge: it knows the goal and won't transmit it.

What already exists (scattered, non-diegetic, no goal framing):
- `#s-day` sidebar stat-row shows `N/49` (rendered `storyUpdateStatus`, `34648`).
- `#s-shards` inventory-bar pill shows `N/7` (`34651`).
- `#s-level` sidebar shows level + XP (`34681`) — but never the **Lv 20 target**.

None of these say *"this is your objective."* There is no opening frame of the Void, no single
main-objective tracker, and the Level 20 goalpost is invisible.

## 2. The fix — deliver the goal as Froberger's map (diegetic)

The prologue already presses the covenant into the player's hand: a dying courier collapses in Birka and
gives you *"a folded, stained map… four towns and seven symbols in faded ink"* (`story.md:159–163`). Make
that literal in the UI. Two pieces, both display-only, reusing the existing status render:

### (A) Persistent objective chip — the map itself
A single always-visible chip inside the always-shown Location card (`#story-location-hd-card`, `4191`):

```
🔮🔮🔮◇◇◇◇   ⭐ Lv 8/20   ☀ Day 12/49
```

- **Seven shard symbols** — `🔮` for each returned shard (`S_story.shards`, 0–7), faded `◇` for the rest.
  "The seven symbols darken as each Shard returns" (finding). Implemented as 7 spans; collected = full
  gold `🔮`, uncollected = dim `◇`.
- **`⭐ Lv N/20`** — current level vs the **20** target (turns gold once ≥ 20).
- **`☀ Day N/49`** — current day vs the **49** deadline (amber ≥ Day 35, red ≥ Day 42 — mirrors the
  existing `#s-day` thresholds so the two agree).
- Tooltip on the chip states the full covenant in one line: *"Return all 7 Codex Shards, reach Level 20,
  and defeat Commander Auros at the Codex — before Day 49."*

**Data shapes (locked):**
| field | source | type | note |
|---|---|---|---|
| shards | `S_story.shards` | int 0–7 | already rendered at `34651` |
| level | `S_story.level` | int | already rendered at `34681`; target const **20** |
| day | `S_story.day` | int | already rendered at `34648`; deadline const **49** |

No new state. Render fn `_renderObjectiveChip()` called at the end of `storyUpdateStatus()` (so it
refreshes on every stat update — move, battle, sleep, load). Constants: `SHARD_GOAL=7`, `LEVEL_GOAL=20`,
`DAY_DEADLINE=49` (49 already implicit in `s-day`; 7 in `s-shards`).

### (B) One-time opening framing card — the courier's voice
A lightweight modal (`#story-courier-modal`, styled like `#story-continue-modal`) shown **once at the
start of a fresh game**, fired at the end of `storyNewGame()` (the fresh-start path — **not**
`storyNewGamePlus`, so NG+ veterans are not re-lectured). Copy is in the courier's/covenant voice and
states the four goal-clauses plainly. A "Take the map →" button dismisses it. Because it hangs off
`storyNewGame`, no persistence flag is needed (a mid-game save that loads never re-triggers it); a
belt-and-suspenders `S_story.courierMapSeen` guard is added anyway so a future caller can't double-fire it.

## 3. Scope guard
- **UI/display only.** The mover, combat, economy, quests, save schema, and NG+ are untouched.
- No graph/node/quest change ⇒ **not** an API-authored change; direct HTML edit is correct here
  (CONTRIBUTING API-first rule governs world-graph edits, not sidebar render code).
- The one added state field `courierMapSeen` is defaulted in `_S_DEFAULTS()` (§STATE-INIT single-source
  rule) so a fresh load and a reset agree.

## 4. Verification plan
1. `node --check`-equivalent parse of the inline `<script>` (whole-file tokenizer) — 0 errors.
2. New Playwright smoke `tests/integration/courier-map.smoke.test.js`: fresh game →
   (a) the courier modal appears and dismisses; (b) the objective chip renders with the right shard/level/
   day text; (c) driving `S_story.shards` up darkens the right number of symbols; (d) no page errors.
3. Existing gates unaffected (UI-only) — spot-run the multiplayer/nav suites already green this session.
