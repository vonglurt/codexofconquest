<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — Layers 75+77: Kenickie's Black Market + Chronicle System

**IEEE-Format Post-Mortem**  
**Date:** 2026-05-25  
**Layers:** 75 (§XL) + 77 (§XLII)  
**Sections:** §XL — Kenickie's Black Market + Sheet-Swapper UI · §XLII — Chronicle System  
**Status:** ✅ Implemented  
**Codebase:** `roll2hit-v3.html` — single-file browser RPG

---

## Abstract

This report covers two systems implemented as structurally distinct but thematically adjacent layers: Layer 75 (§XL) — Kenickie's Black Market and the associated Sheet-Swapper UI at the Cat Quarter node, and Layer 77 (§XLII) — the Chronicle System, a dual-ledger career/run statistics tracker with game-over summary and live character sheet display. Both systems are reward-surface features: §XL gives a concrete economic payoff for completing the Cat Arc's most demanding quest chain (`quest_cat_05`), while §XLII gives players a narrative payoff — a readable record of what happened across a run or a career. Neither system branches story; both systems measure and display what the player has already done.

---

## I. §XL — Kenickie's Black Market + Sheet-Swapper UI

### A. Design Intent

The Cat Arc (`quest_cat_01` through `quest_cat_06`) concludes with `quest_cat_05` — defeating the Cat-King. The quest chain is the longest in Act I and involves the arc's primary antagonist faction. Quest completions in this codebase typically reward gold and a trophy item; the Cat-King defeat adds the Don's Signet Ring and 900gp. But the arc's tone — a mob-cat economy run on loyalty and crew hierarchy — called for something beyond a loot drop. Kenickie Clawnickie Mancuso exists in the Cat Quarter as a background presence: a black market operator who has never been the player's direct contact. He is not Jimmy Two-Tails (the fixer), Sandy (the informant), or any of the Honchos. He is the fence.

§XL makes Kenickie's operation accessible as the mechanical payoff for completing `quest_cat_05`. The reward is not a unique item — it is access to discounted healing and fishing bait from someone who now considers you validated crew. The "10% community pricing" framing is intentional: the Cat Quarter economy does not run on adventurer-as-customer. It runs on loyalty. Completing the Cat-King quest earns that loyalty, and Kenickie's prices reflect it.

The Sheet-Swapper UI refers to Kenickie's dialogue card appearing in the CQ NPC sheet view once `quest_cat_05 === 'complete'`. Before that condition is met, Kenickie has no interface presence at CQ. After it, his card surfaces alongside the standard CQ node render. This is a sheet-swap pattern: the same node surface area presents different NPC content depending on quest state.

### B. Implementation Architecture

#### NPC Definition

**`kenickie` NPC profile** — defined in `NPC_DIALOGUES` (line 7638). Node: CQ. Kenickie Clawnickie Mancuso is not a full-arc NPC and does not accumulate favorability states in the standard hostile/neutral/friendly/dear progression. His dialogue is a single-state encounter: he appears only when the unlock condition is satisfied, and his tone is that of an operator acknowledging a peer.

Character archetype: the fence who speaks in fish metaphors because the Cat Quarter economy runs on fish. His dialogue treats the player's Cat-King victory as professional validation — not emotional warmth. He is not Jimmy's warmth or Sandy's sharpness; he is the quiet economy that underlies the arc.

#### State Flag

**`kenickieMarketUsed: false`** — defined in `_S_DEFAULTS()` (line 8422). Tracks whether the player has made at least one purchase from the Black Market. Set to `true` on first completed transaction. Used to conditionally alter Kenickie's greeting on subsequent visits ("Back again. Good. The sardines are fresher today than yesterday.") — a single-line variation that rewards return visits without requiring additional quest machinery.

#### Unlock Condition

The market activates when `quest_cat_05 === 'complete'`. This flag is set at the Cat-King quest completion handler (line 13056), which also grants +900gp and the Don's Signet Ring and emits the story message: *"+900gp + The Don's Signet Ring. Kenickie's Black Market is open."*

The inline announcement in the completion message is the only notification that the market exists. There is no quest entry for market access, no map marker change, and no separate unlock animation. The message is the unlock.

#### Render Block

**Lines 14878–14933** — the CQ node render block includes a conditional that checks `quest_cat_05 === 'complete'`. When true, a button labeled `🐟 Kenickie's Black Market` appears in the node UI. Clicking the button toggles the visibility of `#kenickie-shop-div` — an inline shop div that renders without a page transition.

The shop div is not a modal. It is an in-place expansion of the CQ node surface, consistent with the single-file, no-page-transition architecture of `roll2hit-v3.html`.

#### Shop Inventory (4 items)

| Item | Price | Type | Effect | Flavor |
|------|-------|------|--------|--------|
| Sardine Pack ×3 | 18gp | Bait | Catch +2 | *"Freshish. Don't ask about the smell."* |
| Live Shallows Minnow | 28gp | Bait | Catch +3, size↑ | *"From the Don's private pond. He doesn't need it anymore."* |
| Minor Healing Potion | 45gp | Consumable | Heals 10hp | — (10% off standard price) |
| Healing Potion | 135gp | Consumable | Heals 25hp | — (10% off standard price) |

**Bait stacking logic:** Bait items check inventory by name. If a matching item already exists, the count increments by the purchased quantity (×3 for the Sardine Pack; ×1 for the Minnow). They do not create duplicate inventory entries. This follows the existing bait-stacking pattern used elsewhere in the fishing system.

**Healing potion pricing:** The 10% discount is applied at the shop definition level — 45gp and 135gp are the actual stored prices, not calculated dynamically from a base price. If standard potion prices change in a future layer, Kenickie's prices must be manually updated to maintain the discount relationship.

#### Sheet-Swapper UI (line 14959)

The Kenickie card at CQ is an instance of the sheet-swapper pattern: the NPC sheet area of the CQ node conditionally renders Kenickie's dialogue when `quest_cat_05 === 'complete'`, replacing (or appending to) the default CQ node NPC display. This surfaces Kenickie's voice — the fence's single-state dialogue — at the point in the game when the player has earned access to it. Before `quest_cat_05` is complete, the sheet area at CQ shows Jimmy Two-Tails or the default node NPC. After completion, Kenickie's card appears.

---

## II. §XLII — Chronicle System

### A. Design Intent

Before §XLII, the game-over screen showed gold earned, level reached, and a "Try Again" prompt. There was no summary of what happened during a run. A player who died at Act IV after 14 nights, 200 battles, and 1,800 damage dealt had no way to see any of that — only that they were dead.

The Chronicle system fills this gap with a dual-ledger architecture: `runStats` tracks the current run from start to game-over or respawn; `careerStats` tracks the same fields permanently across all runs, all respawns, and all NG+ cycles. The distinction matters because `roll2hit-v3.html` supports NG+ — a player on their fourth run is a different player than one on their first, and the career ledger is the record of that difference.

The game-over Chronicle div (`#gameover-chronicle`) is the only place `runStats` is displayed in complete form. The character sheet Chronicle section (line 16756) shows `careerStats` live during play. The design intent is that the game-over screen is a summary of what just happened, while the character sheet is a record of who you are across everything you have done.

### B. Implementation Architecture

#### Stat Objects

**Defined in `_S_DEFAULTS()` (lines 8446–8447):**

```js
careerStats: _STAT_ZERO(),
runStats:    _STAT_ZERO(),
```

Both objects are initialized by `_STAT_ZERO()`, which returns the same structure: a zeroed object with ten named fields.

**`_STAT_ZERO()` factory function (line 8815):**

```js
function _STAT_ZERO() {
  return {
    kills: 0, deaths: 0, dmgDealt: 0, dmgReceived: 0,
    sleeps: 0, battlesAttempted: 0, attacksAttempted: 0,
    attacksHit: 0, exitsTaken: 0, daysAdventuring: 0
  };
}
```

Using a factory function rather than an inline object literal ensures that `careerStats` and `runStats` are always separate object references — not aliases — and that both are initialized to identical zero-states without duplication.

#### Stat Field Reference

| Field | Incremented by | Notes |
|-------|---------------|-------|
| `kills` | Enemy defeat | All combat kills, all terrains |
| `deaths` | Player reaches 0 HP | Includes respawn events |
| `dmgDealt` | Any damage applied to enemy | Accumulated per hit |
| `dmgReceived` | Any damage applied to player | Accumulated per hit |
| `sleeps` | Rest action taken | Not equivalent to `daysAdventuring` |
| `battlesAttempted` | Battle initiated | Includes retreated battles |
| `attacksAttempted` | Attack roll made | Includes misses |
| `attacksHit` | Attack roll hits | Subset of `attacksAttempted` |
| `exitsTaken` | Node transition via path | Counts each movement action |
| `daysAdventuring` | Sleep action taken | Tracks calendar progression |

**Note on `daysAdventuring` vs. `gameDay`:** `gameDay` (line 8397) is the in-game calendar counter — it increments on sleep and is used for time-sensitive quest checks and ambient day display. `daysAdventuring` is the Chronicle stat tracking the same event. They increment together on sleep but serve different systems: `gameDay` is a game-state variable read by quest logic; `daysAdventuring` is a stat read by the Chronicle. They are not aliased.

#### `_trackStat()` Call Pattern

Stats are written via `_trackStat(field, amount)`, which increments both `careerStats[field]` and `runStats[field]` simultaneously. All stat-incrementing calls use this function — there is no direct mutation of either stat object outside it. This guarantees the two ledgers stay in sync at the write level.

Example (sleep): `_trackStat('daysAdventuring', 1)` fires on every rest action, incrementing both `careerStats.daysAdventuring` and `runStats.daysAdventuring`.

#### Game-Over Chronicle

**`_populateGameoverChronicle()` (line 8753)** — reads `runStats` and populates `#gameover-chronicle` with a table of ten rows. Called at game-over, before the game-over screen renders. The div acquires the CSS class `has-data` after population, which controls its visibility — the Chronicle section is hidden until populated, preventing an empty table from rendering in any other context.

**Chronicle row labels:**

| Field | Display Label |
|-------|--------------|
| `kills` | Enemies defeated |
| `deaths` | Times downed |
| `dmgDealt` | Damage dealt |
| `dmgReceived` | Damage received |
| `sleeps` | Nights slept |
| `battlesAttempted` | Battles |
| `attacksAttempted` | Attacks attempted |
| `attacksHit` | Attacks hit |
| `exitsTaken` | Paths taken |
| `daysAdventuring` | Days adventuring |

#### Reset and Persistence Behavior

**On respawn (line 8834):** `careerStats` is preserved as-is. `runStats` is reassigned to `_STAT_ZERO()`. The player's career ledger continues accumulating; the run ledger starts clean. This is the correct behavior for a game with permadeath-and-respawn: career numbers should grow monotonically; run numbers should represent only the run that just ended.

**On NG+ (`storyNewGamePlus()`, line 8826):** `careerStats` is preserved across the NG+ initialization. The career ledger accumulates across all runs in all NG+ cycles — a player on NG+3 who has completed 400 battles total will see 400 in their career ledger regardless of how many runs have ended. `runStats` resets at NG+ the same way it resets at respawn.

#### Character Sheet Chronicle Section (line 16756)

The character sheet has a Chronicle section that reads `careerStats` fields live during play. This is the permanent record visible to the player at any time — not a summary, but a running total. The game-over screen shows what the run cost; the character sheet shows what the career has accumulated.

---

## III. Design Decisions and Trade-offs

### A. The Market as Loyalty Payoff, Not Transaction

Kenickie's Black Market is not available to new visitors, high-level players, or players with gold above a threshold. It is available only to players who completed `quest_cat_05`. This is a deliberate choice against convenience-based gating. The Cat Quarter economy is faction-based; access is a recognition of loyalty, not a commercial transaction. A player with 10,000gp who never completed the Cat Arc cannot buy Sardine Packs from Kenickie. A player at 200gp who defeated the Cat-King can. The economic gating is relational, not numerical.

### B. 10% Discount as Hardcoded Price

The 10% discount on healing potions is baked into the item prices (45gp, 135gp) rather than calculated dynamically from a base price. This simplifies the shop render — no percentage logic at display time — but creates a maintenance dependency: if standard healing potion prices change, Kenickie's prices must be manually updated. Given that potion prices are stable across the current version and Kenickie's shop is a single shop definition with four items, this trade-off is acceptable. The flavor rationale (community pricing as a fixed rate, not a market adjustment) also supports hardcoded prices: Kenickie does not offer variable discounts.

### C. `kenickieMarketUsed` as First-Purchase Flag

The flag tracks first purchase rather than visit count. This is sufficient for the intended behavior (greeting variation on return) and avoids tracking purchase frequency, which would require either a counter or a more complex state structure. The greeting variation is cosmetic — it does not affect prices, inventory, or quest state. A simple boolean is the correct instrument.

### D. Dual Ledger vs. Single Ledger with Reset

An alternative architecture would track only `careerStats` and display run totals by recording a snapshot at run-start and computing the delta at game-over. This was not adopted. The dual-ledger approach (`careerStats` + `runStats`) is explicit: each ledger has a clear write path, a clear reset point, and a clear display surface. The delta-computation approach would require storing a run-start snapshot and ensuring it resets correctly — more state, more failure modes, no readability advantage. Two zeroed objects with a shared write function is the simpler design.

### E. `has-data` CSS Gate on Chronicle Div

The `#gameover-chronicle` div is hidden until `_populateGameoverChronicle()` runs and applies `has-data`. This prevents the Chronicle section from rendering as an empty table in any non-game-over context (e.g., if the div is present in the DOM during normal play but not yet populated). The CSS gate also means the Chronicle section can be included in the game-over screen markup without conditional render logic — the markup is always present; only the class controls visibility.

---

## IV. Post-Mortem Notes

### What Worked

- Kenickie's bait items — particularly the "From the Don's private pond. He doesn't need it anymore." line — land well as Cat Arc payoff. The flavor text does not describe a dead Don Fluffissimo explicitly, but the implication is clear to players who completed `quest_cat_05`. The shop rewards completion by letting players loot the winner's narrative.
- The `_STAT_ZERO()` factory pattern is the correct isolation tool. Using the same function to initialize both `careerStats` and `runStats` ensures the field list is always identical between them and that reset is expressed as reassignment rather than per-field zero-out.
- Displaying `runStats` exclusively on the game-over screen and `careerStats` exclusively on the character sheet creates a clean division of concern: the game-over screen is retrospective (what this run cost), the character sheet is progressive (who you are now). Players reading one surface are not confused by the other.
- The `daysAdventuring` / `gameDay` separation is well-motivated. The two counters track the same event (sleep) but for different systems, and keeping them separate avoids cross-system coupling — quest logic that reads `gameDay` would break if `gameDay` were replaced by the Chronicle stat.

### What Could Be Better

- Kenickie's shop has no restock mechanic. The four items are always available in unlimited quantity. For bait items this is correct — fishing bait should not be scarce. For healing potions, unlimited availability at a 10% discount is a mild economy edge for players who completed `quest_cat_05`, which is probably fine but worth noting. A future layer could cap healing potion stock at 3 per visit (resetting on sleep) without changing the bait behavior.
- The `kenickieMarketUsed` greeting variation has no documentation in the NPC_DIALOGUES entry other than the flag itself. If a future maintainer adds a new greeting condition or extends Kenickie's dialogue, the flag's purpose and trigger point are not visible at the NPC profile definition. An inline comment at line 8422 (the flag definition) noting *"first purchase flag — gates Kenickie's return greeting"* would close this gap.
- The Chronicle character sheet section (line 16756) shows `careerStats` but not `runStats`. A player mid-run has no in-play way to see how their current run is going numerically — only their career total. Adding a collapsible "This Run" row group below "Career" in the character sheet Chronicle section would give mid-run visibility without replacing the career display.
- `attacksAttempted` and `attacksHit` are tracked but no derived hit rate is computed or displayed. The game-over Chronicle lists both fields as raw numbers. A percentage display ("Attacks hit: 47 / 112 (42%)") would make the stat more readable at the summary screen without additional state.

---

## V. File References

| File | Location | Content |
|------|----------|---------|
| `roll2hit-v3.html` | Line 7638 | `kenickie` NPC_DIALOGUES profile |
| `roll2hit-v3.html` | Line 8397 | `gameDay` state variable |
| `roll2hit-v3.html` | Line 8422 | `kenickieMarketUsed: false` in `_S_DEFAULTS()` |
| `roll2hit-v3.html` | Lines 8446–8447 | `careerStats` and `runStats` initialized via `_STAT_ZERO()` |
| `roll2hit-v3.html` | Line 8753 | `_populateGameoverChronicle()` — reads `runStats`, populates `#gameover-chronicle` |
| `roll2hit-v3.html` | Line 8815 | `_STAT_ZERO()` factory function |
| `roll2hit-v3.html` | Line 8826 | `storyNewGamePlus()` — `careerStats` preserved on NG+ |
| `roll2hit-v3.html` | Line 8834 | Respawn handler — `runStats` reset to `_STAT_ZERO()` |
| `roll2hit-v3.html` | Line 13056 | `quest_cat_05` completion — +900gp, Don's Signet Ring, market unlock message |
| `roll2hit-v3.html` | Lines 14878–14933 | CQ node render block — Kenickie button + `#kenickie-shop-div` |
| `roll2hit-v3.html` | Line 14959 | Sheet-Swapper UI — Kenickie card conditional on `quest_cat_05 === 'complete'` |
| `roll2hit-v3.html` | Line 16756 | Character sheet Chronicle section — reads `careerStats` live |
| `lab-report-ally-cat.md` | §5 | `quest_cat_05` quest chain — Sandy, vendor chip unlock, original design |
| `plan.md` | §XL + §XLII | Original design directives for Layers 75 and 77 |

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
