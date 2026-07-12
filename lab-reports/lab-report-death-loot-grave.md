<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §DEATH-01: Death, Loot & the Grave (truth, signal, permanence)

**Status:** shapes locked 2026-07-12 · gate for HTML edits per Lab Report Policy.
**Theme:** the §PLAY-01 "Honest Floor" — *"the floor will be honest."* Death must tell the
truth about what it takes, signal where your body is, and never lose it silently.

## User design calls (locked 2026-07-12)

- **#1 respawn message** → **(a) fix the message — equipped gear survives.** No equipped-strip
  mode. The three equipped slots already survive death by construction; the message must say so.
- **#2 gold loss** → **keep 100% (but say so).** All gold → corpse, fully recoverable. No % / floor
  change. Message states it honestly.
- **#4 NG+ corpse safety** → **warn + confirm.** Before the NG+ wipe, if any corpse is
  unrecovered, name what will be lost and require confirmation; decline aborts NG+.

These calls delete the optional **Inc D** entirely (no gold-% tuning, no equipped-drop).

## Ground truth (verified in `roll2hit-v3.html`, 2026-07-12)

- `_storyDeathSaveFall()` **L25221** — on a failed death-save fall: protects `shard`+`key` items,
  bags the rest of `S_story.inventory` + **all** `S_story.gold` into a `corpseQuest`
  (`{id, nodeCode, nodeName, items, goldDropped}`) pushed to `S_story.corpsesQuests`, writes a
  permanent death tattoo (`corpseQuestId` link), strips `gold=0` / `inventory=[...crit, STARTER_DAGGER]`,
  respawns at `S_story.checkpointNode||'LHR'` at 1 HP, `storyEnter()`+`storyRender(...)`.
- **The equipped slots are top-level `S_story` fields, NOT in `inventory`:**
  `equippedMainWeapon` / `equippedWeapon` / `equippedShield` (defaults **L22426/22439/22440**).
  `_storyDeathSaveFall` never touches them ⇒ **they survive death.** The current message —
  *"A rusted dagger is all you carry. Find your body."* (**L25287**) — is a **lie** (finding #1).
- **Finding #5 (non-atomic death save) is a STALE audit claim — already satisfied at HEAD.**
  `_storyDeathSaveFall` ends with `storyRender(...)`, and `storyRender` (**L30491**, spanning to
  ~L34852) ends in `storyAutoSave()` (**L34843**) with no `await` between the strip and the save.
  So the death + corpse persist synchronously the instant they happen — a tab-close cannot
  interleave. No code change for #5; pinned by a test that asserts the save fires.
- `.info-chip.corpse-chip` CSS exists (**L1317** light / **L2891** dark) but **no JS renders a
  persistent chip** — a dead affordance (finding #3). The only "where is my body" signals today:
  node-card **🦴 Remains** section (**L33250**, only when standing on the node) + journal
  **☠ Fallen Hero** list (**L29853**).
- `storyNewGamePlus()` (**L23302**) does `Object.assign(S_story, _S_DEFAULTS())`
  (resets `corpsesQuests:[]`) + `localStorage.removeItem('r2h_autosave')` ⇒ any unrecovered corpse
  is **gone forever** at NG+ (finding #4). NG+ is reached only from the victory-close button
  (**L36776**) — the post-final-victory reward path.
- Objective chip (§PLAY-01-A) lives in `#story-location-hd-card` (**L4237-4253**), rendered by
  `_renderObjectiveChip()` off `storyUpdateStatus()` (**L34899**). This is the placement pattern
  the corpse chip reuses.
- Map is **player-centered**; region-centering was explicitly **deferred** by §NAV-01-FU item 4
  (needs pannable `mapViewR/C` view-offset state). `storyMapToggle()` (**L35388**) opens the Map
  tab. `_renderMapGrid()` (**L35401**) paints a ±7×±10 window around the player.
- No `window.confirm` / generic confirm-modal helper exists in the file (all modals are bespoke
  overlays). For a data-loss guard the reliable, atomic, testable choice is `window.confirm`.

## Implementation — three increments

### Inc A — Truth pass (findings #1a, #2, #5)  ·  edits confined to `_storyDeathSaveFall`

1. **Honest respawn message** (replaces L25284-25287). Adaptive so it never prints "0 item(s)":
   - names the fall node + what the body holds (bagged items + gold, honest 100%),
   - states equipped gear + shards **stayed with you**,
   - names the checkpoint you respawned at.
   Shape:
   ```
   ☠ You fell at <nodeName>. Your body lies there with <N item(s)>[ and <G> gp] — go back to
   reclaim [it/them]. Your equipped gear[ and Codex shards] stayed with you. You wake at
   <checkpointName> with 1 HP.
   ```
   (item/gold clauses omitted when zero; "and Codex shards" only if `critItems` non-empty.)
2. **Finding #5 — no code change** (see Ground truth): the terminal `storyAutoSave()` inside
   `storyRender()` already persists the death atomically. The Inc-A edit adds only a comment
   documenting this; the test pins that the save fires so a future refactor can't regress it.

### Inc B — Corpse signal chip + Local-grid grave marker (finding #3)

1. **HTML** — add `<div id="corpse-chip" style="display:none">` inside `#story-location-hd-card`,
   directly after `#objective-chip` (sibling line). Non-clickable-by-CSS until shown.
2. **`_renderCorpseChip()`** — new fn called from `storyUpdateStatus()` right after
   `_renderObjectiveChip()`:
   - hide (`display:none`) when `corpsesQuests.length === 0`;
   - else show `🦴 <N> bod(y/ies) at <place>` where `place` = the single `nodeName`, or
     `"N places"` for >1 distinct nodes; `title` lists each `nodeName` + its item/gold counts;
     `onclick = storyMapToggle` (opens the Map tab — **honest: player-centered, no warp, no
     region-centering — §NAV-01-FU deferral stands**; the chip TEXT carries the location so the
     player knows *where* regardless of centering).
3. **Local-grid grave marker** — in `_renderMapGrid`, for a rendered node cell whose `code` has a
   corpse (`corpsesQuests.some(q=>q.nodeCode===code)`), add class `mc-grave` + a small 🦴 overlay +
   hover text "🦴 Your remains — <N item(s)>, <G> gp". Only shows when the grave is within the
   window (i.e. when you're near) — an honest "you're getting warm" cue, not a teleport.
   **Deferred (documented, not silently dropped):** grave markers on the World/Full/GLOBE
   canvases (`_paintFullWorld`) — a separate render surface; the chip + Local marker + node-card +
   journal already cover the signal.
4. **CSS** — `#corpse-chip` styled like `#objective-chip` (bone/amber, `cursor:pointer`), light +
   dark theme rules; `.mc-grave` overlay dot.

### Inc C — NG+ corpse safety (finding #4)  ·  guard at top of `storyNewGamePlus`

Before the destructive `Object.assign(S_story, _S_DEFAULTS())`:
```js
if ((S_story.corpsesQuests || []).length > 0) {
  const bodies = S_story.corpsesQuests;
  const gp = bodies.reduce((s,q)=>s+(q.goldDropped||0),0);
  const items = bodies.reduce((s,q)=>s+((q.items||[]).length),0);
  const where = [...new Set(bodies.map(q=>q.nodeName))].join(', ');
  const ok = window.confirm('⚠ You still have ' + bodies.length + ' unrecovered '
    + (bodies.length===1?'body':'bodies') + ' out there (' + where + ') carrying '
    + items + ' item(s) and ' + gp + ' gp. Beginning New Game+ leaves them behind forever.\n\n'
    + 'Begin New Game+ anyway?');
  if (!ok) return;   // player chose to retrieve first — NG+ aborted, nothing wiped
}
```
Placed **before** the NG-title overlay animation so a decline is a clean no-op.

## Invariants preserved

- **§CELL-13 — no jump travel, ever.** The corpse chip opens a *view* (Map tab); it never warps.
  `checkpointNode` death-respawn remains the only warp.
- **DUEL:CORE untouched** — all edits are single-player `S_story` death/UI/NG+ surfaces.
- **Free-Movement** — no gate/mover reads corpse state; display + save only.
- **Shards/keys still protected** (unchanged `critTypes` set).
- `S_story.xp` monotonic (untouched by this work).

## Verification plan

- Whole inline script parses clean after each edit (`node -e` extract-and-check, 0 errors).
- New `tests/integration/death-loot-grave.test.js`:
  - **Inc A** — drive `_storyDeathSaveFall`: equipped slots unchanged post-death; message contains
    the honest clauses (body items+gold, "stayed with you") and never the old "rusted dagger is all
    you carry" lie; `storyAutoSave` fired exactly once (spy).
  - **Inc B** — `_renderCorpseChip`: hidden at 0 corpses; shows count+place at 1; multi-node → "N
    places"; click calls `storyMapToggle`. Local-grid marker present on the grave cell when in view.
  - **Inc C** — `storyNewGamePlus` with an outstanding corpse: `window.confirm` stubbed → decline
    aborts (corpsesQuests intact, no reset); accept proceeds (corpsesQuests reset). No corpse → no
    confirm call.
- Regression: `effort-xp` 3/3 · `enemy-ai` 4/4 · `courier-map` 1/1 green.
- Docs synced: `mechanics.md` + `docs/mechanics/mechanics-combat.md` §Death / corpse-run.

## Honesty ledger (no silent caps)

- Map **region-centering** on the grave: **NOT** built (stays deferred per §NAV-01-FU item 4). The
  chip opens a player-centered map; location is transmitted via chip text + Local marker instead.
- Grave markers on the **World/Full/GLOBE** canvases: **NOT** built this pass (Local grid only).
- Corpse array is **unbounded** (50 deaths = 50 corpses). Not addressed here (minor, not loss);
  noted for a future soft-cap.
