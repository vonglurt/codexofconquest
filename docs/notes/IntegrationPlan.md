<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->
# Integration Test Plan — roll2hit-v3.html

## Overview

Browser-level integration tests for roll2hit-v3.html using Playwright. Tests drive a real headless Chromium instance against the live game page, injecting known state via `localStorage` and asserting on DOM visibility and JS globals. Randomness is **not mocked** — tests are written to allow it.

---

## Why Playwright

The game is a 60k-line single-file HTML app. It runs in-browser JS with `Math.random()`, DOM event dispatch, `localStorage` persistence, and complex modal state machines. Integration tests need:

- A real DOM (not JSDOM — too many missing APIs)
- `page.evaluate()` to read/write JS globals (`window.S_story`)
- Named element locators tied to existing IDs (`#btn-fishing-cast`, etc.)
- Retry/wait primitives for async DOM updates

Playwright gives all of this with minimal configuration.

---

## State Injection Strategy

The game hydrates from `localStorage.getItem('r2h_autosave')` at page load, via `storyLoadSave()` → `Object.assign(S_story, JSON.parse(raw))`. Tests inject a seed state **before** page JS runs using `page.addInitScript()`:

```js
await page.addInitScript(state => {
  localStorage.setItem('r2h_autosave', JSON.stringify(state));
}, SEED_STATE);
await page.goto('/roll2hit-v3.html');
```

On load, the game finds the autosave and shows a **continue modal** (`#story-continue-modal`). Clicking `#btn-continue-load` calls `storyLoadContinue()`, which re-reads the autosave, sets `S_story.active = true`, and calls `storyRender(NODE_MAP[S_story.currentCode])` — rendering the seeded node.

### Key seed fields

| Field | Value | Notes |
|---|---|---|
| `currentCode` | `'BOO'` | Yugurt Lake node — `isFishingLake: true` |
| `hp` / `hpMax` | `80` / `80` | Enough HP to survive a fish fight |
| `level` | `5` | Reasonable combat stats |
| `abilityScores` | `{str:16,dex:14,con:14,int:12,wis:12,cha:10}` | luckMod = +2; DEX mod = +2 |
| `atkBonus` | `3` | Derived from STR 16 |
| `inventory` | `[{ name:'Fishing Rod', ... }]` | Exact name from `FISHING_RODS[]` |
| `fishingCatchLog` | `[]` | Fresh — no prior catches |
| `tackleboxZoneUnlocks` | `{shore:true,reeds:false,deep:false}` | Shore only |
| `defeatedBattles` | `{}` | |
| `quests` | `{}` | |

---

## Handling Randomness

Fishing uses `Math.random()` for three rolls per cast (DEX cast check, Catch roll, Type roll). Tests **do not mock randomness**. Instead:

- **Retry loop**: `castUntilFishRevealed(page, maxCasts)` keeps casting until a fish is revealed or the limit is hit.
- **Probability floor**: With DEX 14 (mod +2) and luckMod +2 on a bare hook, P(catch ≥ 6 per cast) ≈ 85%. P(at least one catch in 20 casts) > 99.99%.
- **Assertions on reachability**: Tests assert that a stage *is reachable*, not that it *always* succeeds.

---

## File Structure

```
playwright.config.js           ← Playwright config; serves . on port 7654
tests/integration/
  helpers.js                   ← SEED_STATE, seedAndLoad(), dismissContinue(),
                                  openFishingModal(), castUntilFishRevealed()
  fishing.test.js              ← Fishing quest stage tests + main smoke test
```

---

## Fishing Quest — Stage Breakdown

The fishing system lives in `storyFishing()` (line 54602). Stages:

```
[Modal opens]
     │
     ├─► Zone selection (bank / reeds / shallows chips)
     │
     ├─► [optional] Find Bait → bait search panel → Survival DC roll → bait added
     │
     └─► Cast Line (#btn-fishing-cast)
              │
              ├─ MISS (catchTotal ≤ 5): "Nothing bites" message
              │    └─► #btn-fishing-recast text = "Cast Again" → loop back
              │
              └─ HIT (catchTotal ≥ 6): fish revealed in #fishing-fish-reveal
                   │
                   ├─► #btn-fishing-cast text = "⚔ Fight [fish]!"
                   │    └─► click → S_story.fishingCatchLog updated
                   │         → S_story.fishingQuestFlags.q01 = true
                   │         → modal closes → combat starts
                   │
                   └─► #btn-fishing-recast text = "🪣 Throw Back"
                        └─► resets to Cast Line state
```

Zone unlock progression (also verified):
- Shore: always unlocked
- Reeds: unlocks after first catch in `fishingCatchLog`
- Deep: unlocks after landing a Large+ fish

---

## Test Suite — `fishing.test.js`

### Stage tests (each independent, runs in isolation)

| # | Test name | What it verifies |
|---|---|---|
| 1 | modal opens | Fish button at BOO opens `#story-fishing-modal.visible` |
| 2 | Find Bait panel | `#btn-fishing-findbait` click makes `#fishing-bait-search` visible |
| 3 | Cast produces roll result | `#btn-fishing-cast` click makes `#fishing-roll-result` visible |
| 4 | Hit reachable within 25 casts | `castUntilFishRevealed()` returns true |
| 5 | Throw Back resets | After hit, `#btn-fishing-recast` ("🪣 Throw Back") click hides fish reveal and restores Cast Line button |
| 6 | Abandon closes modal | `#btn-fishing-abandon` click removes `.visible` from modal |

### Main test line (full path smoke test)

Tests the entire fishing happy path from cold state to combat handoff:

```
Seed state at BOO
  → load page → dismiss continue modal
  → click Fish button via storyFishing()
  → castUntilFishRevealed (max 40 casts)
  → assert fish revealed
  → click "⚔ Fight [fish]!" (castBtn)
  → assert modal closes
  → assert S_story.fishingCatchLog.length > 0
  → assert S_story.fishingQuestFlags.q01 === true
```

### Zone unlock test

Verifies zone progression:

```
Seed with fishingCatchLog = [one entry]
  → open modal
  → assert reeds chip is not disabled (zone unlocked)
```

---

## Catch Mechanics Reference

From `doCast()` (line 54734):

| Phase | Roll | Effect |
|---|---|---|
| 1 DEX cast | d20 + DEXmod vs DC 12 | castMod: −2 if <12, 0 if 12–16, +2 if ≥17 |
| 2 Catch | d20 + bait.catch + castMod + luckMod | ≤5 = miss, 6–10 = small, 11–16 = medium, 17–19 = large, 20 = very_large, 21+ = legendary |
| 3 Type | d20 + bait.type + luckMod | → rarity (common / uncommon / rare / legendary) |

Bare hook: `bait.catch = luckMod`. With luckMod = +2 and DEX mod = +2 in seed state, expected catchTotal ≈ d20 + 0–4 ≈ 12–13 median → medium fish every ~1.2 casts.

---

## How to Run

```bash
# Install Playwright (first time)
npm install -D @playwright/test
npx playwright install chromium

# Run all integration tests
npx playwright test

# Run just fishing
npx playwright test fishing

# Run with browser visible (debug)
npx playwright test fishing --headed
```

---

## Extending to Other Quest Paths

To add a new quest path test:

1. Identify the seed state needed (node, inventory, quest flags)
2. Add the seed override to `helpers.js` as a named export (e.g., `NIGHT_FISH_SEED`)
3. Create `tests/integration/<quest-name>.test.js`
4. Use `seedAndLoad(page, overrides)` with the named seed
5. Drive the UI path with locators, assert on `S_story` state via `page.evaluate()`

**Candidate next paths:**
- `night-fishing.test.js` — seed `day: 1, hour: 21` (if hour is tracked), verify night fish pool
- `bait-crafting.test.js` — Find Bait full path, verify bait in inventory
- `quest-fools-first-cast.test.js` — `quest_guide_01` activation and completion
- `tournament.test.js` — Yugurt Tournament chain (seed `tackleboxZoneUnlocks` complete)
