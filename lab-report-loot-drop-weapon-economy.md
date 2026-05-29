<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report: Loot Drop & Weapon Economy Redesign
**Project:** Roll2Hit v3 (roll2hit-v3.html, ~9,600 lines)
**System:** D&D 5e single-file story RPG
**Date:** 2026-05-21
**Status:** Design proposal — not yet implemented

---

## 1. Executive Summary

- **XP thresholds are broken.** The current `XP_LEVELS` max of 680,000 XP cannot be reached in a normal playthrough. At 150 battles averaging 800 XP each, a player earns ~120,000 total XP and reaches level 11-12, never accessing magic tier 3 or 4 items. The thresholds need to be compressed roughly 3.5x at the top end.

- **No unified drop table exists.** Weapon drops (15% chance) and dagger drops (12% chance) are parallel independent rolls, not part of a single d100 loot table. Potions, gold, shields, scrolls, and the two weapon categories are distributed across disconnected code paths with no shared gate enforcement.

- **Magic tier gates are unenforced.** `WEAPON_ITEMS` has three tiers (base / +1 / +2) but no `minLevel` check blocks a level-1 character from receiving a +2 weapon through the existing 15% drop path. `DAGGER_ITEMS` has `minLevel` fields on individual entries but those are not checked at award time.

- **Item categories are incomplete and slot rules are absent.** `WEAPON_ITEMS` tops out at +2; shields top out at +3 (`Magic Shield` / `Large Magic`); no +3 or +4 weapons exist. Daggers top at +3. The offhand slot accepts both daggers and shields simultaneously with no mutual-exclusion enforcement, allowing impossible equipment states. Vendors have no auto-sell behavior for inferior duplicates.

---

## 2. XP Scaling Analysis

### 2a. Why the current thresholds fail

The current XP formula is:

```js
xpAward = enemy.AC × enemy.maxHP
```

A representative early enemy (AC 12, HP 30) yields 360 XP. A mid-game enemy (AC 15, HP 80) yields 1,200 XP. A late-game enemy (AC 18, HP 180) yields 3,240 XP. With notoriety scaling shifting tier weights upward, actual XP-per-battle traces roughly:

| Battle Range | Avg XP/battle | Cumulative XP |
|---|---|---|
| 1–20 | ~350 | ~7,000 |
| 21–45 | ~800 | ~27,000 |
| 46–80 | ~1,400 | ~76,600 |
| 81–120 | ~2,200 | ~163,400 |
| 121–150 | ~3,000 | ~253,400 |

Under the current `XP_LEVELS`, level 20 requires 680,000 XP — approximately 2.7x what a 150-battle run actually accumulates. The player stalls at level 13-14 at run's end, never reaching the level 15 or 20 magic tier gates.

### 2b. Current vs proposed XP_LEVELS

Index positions are levels 1–20 (index 0 = level 1 floor, index 19 = XP to reach level 20).

| Level | Current Threshold | Proposed Threshold | Δ | Target Battle # |
|---|---|---|---|---|
| 1 | 0 | 0 | — | Start |
| 2 | 500 | 400 | −100 | ~2 |
| 3 | 1,500 | 1,000 | −500 | ~4 |
| 4 | 4,000 | 2,000 | −2,000 | ~7 |
| 5 | 8,000 | 3,500 | −4,500 | ~12 |
| 6 | 15,000 | 5,500 | −9,500 | ~17 |
| 7 | 25,000 | 8,000 | −17,000 | ~22 |
| 8 | 40,000 | 11,000 | −29,000 | ~27 |
| 9 | 60,000 | 15,000 | −45,000 | ~33 |
| 10 | 90,000 | 20,000 | −70,000 | ~40 |
| 11 | 125,000 | 27,000 | −98,000 | ~48 |
| 12 | 165,000 | 36,000 | −129,000 | ~58 |
| 13 | 210,000 | 47,000 | −163,000 | ~68 |
| 14 | 260,000 | 60,000 | −200,000 | ~79 |
| 15 | 315,000 | 75,000 | −240,000 | ~90 |
| 16 | 375,000 | 93,000 | −282,000 | ~100 |
| 17 | 440,000 | 114,000 | −326,000 | ~112 |
| 18 | 510,000 | 138,000 | −372,000 | ~124 |
| 19 | 590,000 | 165,000 | −425,000 | ~136 |
| 20 | 680,000 | 195,000 | −485,000 | ~150 |

**Proposed array (drop-in replacement for `XP_LEVELS`):**

```js
const XP_LEVELS = [
  0, 400, 1000, 2000, 3500, 5500, 8000, 11000, 15000, 20000,
  27000, 36000, 47000, 60000, 75000, 93000, 114000, 138000, 165000, 195000
];
```

### 2c. Gate alignment verification

| Gate | Level | Proposed Threshold | Target Battle # | Battles in range |
|---|---|---|---|---|
| +1 magic tier | 5 | 3,500 XP | ~12 | Early-game |
| +2 magic tier | 10 | 20,000 XP | ~40 | Mid-game |
| +3 magic tier | 15 | 75,000 XP | ~90 | Late-game |
| +4 magic tier / final boss | 20 | 195,000 XP | ~150 | End-game |

All four tier gates are reachable in a 150-battle playthrough. The notoriety formula `level×3 + floor(battlesWon/2)` stored in `S_story` accelerates enemy tier weights, so XP-per-battle continues climbing through late game, supporting this curve.

---

## 3. Magic Tier Gate System

### 3a. Tier definitions

| Tier | Magic Bonus | Minimum Level | Gate Label |
|---|---|---|---|
| 0 | +0 (base) | 1 | Always eligible |
| 1 | +1 | 5 | `MAGIC_GATE_T1 = 5` |
| 2 | +2 | 10 | `MAGIC_GATE_T2 = 10` |
| 3 | +3 | 15 | `MAGIC_GATE_T3 = 15` |
| 4 | +4 | 20 | `MAGIC_GATE_T4 = 20` |

All three item categories — main weapons (`WEAPON_ITEMS`), offhand daggers (`DAGGER_ITEMS`), offhand shields (`SHIELD_ITEMS`) — share the same level gates. The gate check uses `S_story.level` at the moment of the loot award.

### 3b. Item eligibility by level

| Player Level | Main Weapons | Daggers | Shields |
|---|---|---|---|
| 1–4 | Base only | None (min Lv3 for +1 Royal) | Small (+1 AC) / Kite (+2 AC) |
| 5–9 | Base / +1 | +1 Royal | Small / Kite / Magic Shield (+3 AC) |
| 10–14 | Base / +1 / +2 | +1 Royal / +2 Painite | All existing + Large Magic (+4 AC) |
| 15–19 | Base / +1 / +2 / +3 | +1 Royal / +2 Painite / +3 Gaping | All + Legendary (+5 AC) |
| 20 | All tiers including +4 | All including +4 Voidsteel | All including Ancient (+6 AC) |

Note: shields at tier 0 (Small / Kite) carry no magic bonus in the current system and are available from level 1. They are not magic-gated but are included in the d100 table via their own roll range.

### 3c. New items required

**WEAPON_ITEMS additions (currently missing tiers 3 and 4):**

Each of the 14 base weapon types needs two new entries:

```js
// Tier 3: +3 weapon, minLevel: 15
// Tier 4: +4 weapon, minLevel: 20
// Pattern mirrors existing +1 (minLevel:5) and +2 (minLevel:10) entries
// Naming convention: e.g. "Runic Longsword (+3)", "Void Longsword (+4)"
```

Total `WEAPON_ITEMS` count expands from 42 entries (14 × 3) to 70 entries (14 × 5).

**SHIELD_ITEMS additions:**

```js
{ name: 'Legendary Shield',  acBonus: 5, magicBonus: 3, cost: 3000, sellPrice: 1500, minLevel: 15 },
{ name: 'Ancient Shield',    acBonus: 6, magicBonus: 4, cost: 6000, sellPrice: 3000, minLevel: 20 },
```

Existing `SHIELD_ITEMS` tier naming for reference: Small (+1 AC / 50gp), Kite (+2 AC / 150gp), Magic Shield (+3 AC / 600gp), Large Magic (+4 AC / 1500gp).

**DAGGER_ITEMS addition:**

```js
{ name: 'Voidsteel Dagger', atkBonus: 4, minLevel: 20, sellPrice: 3000 },
```

---

## 4. d100 Drop Table

One roll per battle-end loot event. The base item within each category is selected randomly from eligible entries at award time (applying the tier gate). Gated items that fail the level check trigger the reroll mechanic (Section 5).

| Roll | Category | Specific Item / Pool | Gate |
|---|---|---|---|
| 01–08 | Minor Potion (x1) | Minor Healing Potion | None |
| 09–16 | Minor Potion (x2) | Minor Healing Potion ×2 | None |
| 17–20 | Healing Potion | Standard Healing Potion | None |
| 21–27 | Healing Potion | Standard Healing Potion | None |
| 28–30 | Greater Healing Potion | Greater Healing Potion | None |
| 31–34 | Greater Healing Potion | Greater Healing Potion | None |
| 35–36 | Superior Healing Potion | Superior Healing Potion | None |
| 37–38 | Spell Scroll | Spell Scroll (random school) | None |
| 39–42 | Gold Cache | 100–500 gp (scales: `50 × S_story.level + rand(0,150)`) | None |
| 43–55 | Base Weapon | Random from 14 base `WEAPON_ITEMS` (tier 0) | None |
| 56–65 | +1 Magic Weapon | Random eligible +1 weapon from `WEAPON_ITEMS` | Lv5 |
| 66–72 | +2 Magic Weapon | Random eligible +2 weapon from `WEAPON_ITEMS` | Lv10 |
| 73–76 | +3 Magic Weapon | Random eligible +3 weapon from `WEAPON_ITEMS` | Lv15 |
| 77 | +4 Magic Weapon | Random eligible +4 weapon from `WEAPON_ITEMS` | Lv20 |
| 78–80 | Base Shield | Small Shield or Kite Shield (50/50) | None |
| 81–84 | +1 Magic Shield | Magic Shield (existing, +3 AC) | Lv5 |
| 85–87 | +2 Large Magic Shield | Large Magic Shield (+4 AC) | Lv10 |
| 88–89 | +3 Legendary Shield | Legendary Shield (+5 AC) | Lv15 |
| 90 | +4 Ancient Shield | Ancient Shield (+6 AC) | Lv20 |
| 91–94 | +1 Royal Dagger | Painite Royal Dagger | Lv5 |
| 95–97 | +2 Painite Dagger | +2 Painite Dagger | Lv10 |
| 98–99 | +3 Gaping Dagger | +3 Gaping Dagger | Lv15 |
| 100 | +4 Voidsteel / Jackpot | Voidsteel Dagger (Lv20); else Jackpot event (+500gp, 1 Superior Potion) | Lv20 |

**Notes:**
- Rolls 01–42 are ungated consumables / gold totaling a 42% base chance of non-equipment loot.
- Weapon rolls (43–77) total 35% of the table. Given gating, a level-1 character who rolls 56–77 (22% of table) rerolls up to 3 times before falling back to Minor Potion.
- Shield rolls (78–90) total 13%. Dagger rolls (91–100) total 10%.
- The gold cache formula `50 × S_story.level + rand(0,150)` gives ~200 gp at level 3, ~750 gp at level 15 — consistent with potion and shield costs at those stages.
- The existing separate 15% weapon drop and 12% dagger drop paths should be retired or converted to invoke this unified table.

**Implementation note:** The unified table replaces the current parallel drop checks. A single roll per battle end calls `rollD100Loot(S_story.level)`. The function returns a loot object `{ type, item, qty }` and hands it to the existing inventory-add pipeline.

---

## 5. Reroll Mechanic

When a d100 result resolves to a gated item and `S_story.level` is below the required tier gate, the following algorithm applies:

```
function rollD100Loot(playerLevel):
  MAX_REROLLS = 3
  FALLBACK = { type: 'potion', item: 'Minor Potion', qty: 1 }

  for attempt in 0..MAX_REROLLS:
    roll = Math.floor(Math.random() * 100) + 1
    result = lookupD100Table(roll)

    if result.gateLevel == null OR playerLevel >= result.gateLevel:
      return result         // eligible — award it

    // gated and player is below gate — loop and reroll

  return FALLBACK           // exhausted all rerolls
```

**Key properties:**
- Maximum 4 total rolls (1 initial + 3 rerolls).
- Each reroll is a fresh independent d100, not a re-consultation of the same row.
- Fallback is always Minor Potion — the safest non-zero reward that requires no gate check.
- The reroll loop is stateless; it does not remember prior results or bias toward lower-roll ranges.
- UI should surface a single message regardless of rerolls: "You found [final result]." Internal reroll count is not shown to the player unless a debug flag is active.

**Why 3 rerolls?** At level 1, gated rows cover rolls 56–100 (45 of 100 outcomes). Probability of all 4 rolls landing in the gated zone: `0.45^4 ≈ 4%`. This means Minor Potion fallback triggers less than 4% of the time for a level-1 character — acceptable noise that does not feel punishing but preserves the rarity of high-tier drops.

---

## 6. Equipment Slot Rules

### 6a. Slot model

| Slot | Allowed item types |
|---|---|
| `S_story.equippedWeapon` | Main weapon (1 of 14 base types × up to 5 tiers) |
| `S_story.equippedOffhand` | Dagger OR Shield — mutually exclusive |

The offhand slot currently stores either type without enforcement. The fix is a single-slot model: `S_story.equippedOffhand` holds exactly one item or `null`. Category is tracked by the item's own `type` field (`'dagger'` or `'shield'`).

### 6b. Equip-swap behavior

When the player equips an offhand item:

1. Check `S_story.equippedOffhand`.
2. If currently occupied by a different-category item (e.g., equipping a dagger when a shield is equipped):
   a. Move the displaced item to `S_story.inventory` (do not discard).
   b. Log: "[Item name] moved to inventory."
3. Set `S_story.equippedOffhand = newItem`.
4. Recalculate AC or ATK bonus: shields contribute to AC, daggers contribute to ATK.

If the displaced item cannot fit in inventory (inventory full), block the equip action and notify the player: "Inventory full — unequip or drop an item first."

### 6c. What vendors buy and don't buy

**Vendors accept (trigger auto-sell and manual sell):**
- Trophies (all types)
- Weapons / daggers / shields that are inferior to or duplicates of equipped/best-in-inventory items

**Vendors do not accept:**
- Potions (any tier)
- Spell scrolls
- Flashbangs
- Quest items
- Knowledge items (maps, codex shards, etc.)

This list is enforced by a `isVendorBuyable(item)` function that checks `item.type` against a blocklist.

---

## 7. Vendor Auto-Sell Design

### 7a. Trigger

Auto-sell fires once per vendor node entry — specifically when `handleNodeArrival()` resolves to a vendor node (`'BA'`, `'MQ'`, `'SF'`, `'IS'`, `'BK'`) and `S_story.inventory` contains items that meet the auto-sell criteria. It does not fire repeatedly on subsequent actions at the same node.

A flag `S_story.lastAutoSellNode` (node ID string) prevents double-trigger if the player navigates away and returns within the same session without gaining new items.

### 7b. Identification algorithm

For each item category (main weapon, dagger, shield), determine the player's **best item** — defined as highest `atkBonus` or `acBonus` among equipped and all held items.

```
for each category in ['weapon', 'dagger', 'shield']:
  bestItem = max(equipped + inventory, by bonus)
  inferiorItems = inventory.filter(item =>
    item.type == category AND item != bestItem AND isVendorBuyable(item)
  )
  autoSellList.push(...inferiorItems)
```

Items with equal bonus to the best item are NOT auto-sold (the player might want to keep a spare or switch builds). Only strictly inferior items are auto-sold.

Trophies remain in manual-sell-only mode; they are not touched by auto-sell.

### 7c. UX flow

1. Player moves to vendor node.
2. If `autoSellList` is non-empty:
   - Show a single notification before the vendor UI opens: "Auto-sold [N] inferior items for [total] gp."
   - Items are removed from `S_story.inventory`, gold added to `S_story.gold`.
   - A collapsible detail list shows each item name and its sell price.
3. Vendor UI opens normally. The player then manually sells trophies or anything else.
4. If `autoSellList` is empty, no notification appears — no "nothing to sell" message.

Auto-sell uses `item.sellPrice` (half cost by default for items without an explicit field). The existing vendor sell-price logic for trophies is unchanged.

---

## 8. Final Boss Design

### 8a. Enemy stats

```js
// Add to MONSTER_POOL or as a dedicated const:
const BOSS_COMMANDER_AUROS = {
  name:    'Commander Auros',
  AC:      22,
  maxHP:   300,
  atkBonus: 12,
  dmg:     '3d8+6',
  tier:    'deadly',
  xpValue: 22 * 300,  // = 6,600 XP (using existing formula for consistency)
  special: 'finalBoss'
};
```

The name "Commander Auros" is already present in the game's victory flavor text (`Codex Reforged` sequence). Making him the final boss closes that narrative loop.

### 8b. Trigger conditions

Both conditions must be true simultaneously:

| Condition | Check |
|---|---|
| Player is level 20 | `S_story.level >= 20` |
| All 7 shards collected | `S_story.shardsCollected === 7` (or equivalent shard-tracking field) |

Access is via node `'VA'` (Void Ascent). This node should be added to the world graph but marked as locked (visually distinct) until both conditions pass. Attempting to enter `VA` while conditions are unmet displays: "The Void Ascent is sealed. Collect all 7 shards and reach your full power."

### 8c. Encounter flow

1. Player moves to `VA`.
2. Gate check passes.
3. Combat initializes with `BOSS_COMMANDER_AUROS` as the enemy. No random enemy selection — this is a fixed encounter.
4. Boss is flagged `special: 'finalBoss'` so the combat engine can suppress the normal post-battle loot roll (the reward is the victory sequence, not an item).
5. On victory: trigger `activateCodexReforgedSequence()` (or whatever the existing victory handler is named). This is the same ending already in the codebase.
6. On defeat: player respawns at nearest safe node with 1 HP (or uses the existing death mechanic). The `VA` node remains accessible for another attempt — the boss resets.

### 8d. XP note

6,600 XP from the boss (AC 22 × HP 300) pushes a level-19 player (who needs 195,000 XP for level 20) up by ~3.4%. The boss is not the primary source of level-20 achievement — the player must reach level 20 through normal battles before the node unlocks. The XP award from the boss fight is cosmetic / journal-completion.

---

## 9. Implementation Order

Build in this sequence to avoid breaking existing combat, inventory, and vendor flows:

### Layer 1 — Data: XP thresholds and new items

1. Replace `XP_LEVELS` array with proposed 20-entry array.
2. Add `Legendary Shield` and `Ancient Shield` to `SHIELD_ITEMS`.
3. Add `Voidsteel Dagger` to `DAGGER_ITEMS`.
4. Extend `WEAPON_ITEMS` from 42 to 70 entries: add tier-3 (+3, minLevel:15) and tier-4 (+4, minLevel:20) variants for all 14 base weapon types.
5. Define `MAGIC_GATE_T1/T2/T3/T4 = 5/10/15/20` constants for use in gate checks.
6. Define `BOSS_COMMANDER_AUROS` const.

No logic changes in layer 1 — only data. Run the existing test battles to confirm XP accumulation now reaches level 20 in ~150 fights.

### Layer 2 — Gate enforcement: `isEligible(item, playerLevel)`

7. Write `isEligible(item, playerLevel)` that returns `true` if `item.minLevel == null || playerLevel >= item.minLevel`.
8. Write `rollD100Loot(playerLevel)` implementing the full d100 table (Section 4) and the reroll loop (Section 5).
9. Retire the standalone 15%-weapon and 12%-dagger drop checks. Replace both with a single call to `rollD100Loot(S_story.level)` in the post-battle loot handler.

### Layer 3 — Equipment slot enforcement

10. Add `type: 'dagger'` and `type: 'shield'` fields to `DAGGER_ITEMS` and `SHIELD_ITEMS` entries (needed for slot-swap logic).
11. Update the equip handler for offhand items to implement the mutual-exclusion swap (Section 6b).
12. Recalculate `S_story.totalAC` and `S_story.totalAtk` after any equip/unequip event.

### Layer 4 — Vendor auto-sell

13. Write `isVendorBuyable(item)` using the blocklist from Section 6c.
14. Write `computeAutoSellList(S_story)` using the best-item algorithm from Section 7b.
15. Hook `computeAutoSellList` into `handleNodeArrival()` for vendor nodes, guarded by the `lastAutoSellNode` dedup flag.
16. Add the auto-sell notification UI (collapsible list, gold summary) before the vendor panel renders.

### Layer 5 — Final boss and node VA

17. Add node `VA` to the world graph with a locked visual state.
18. Add gate-check logic in the `VA` arrival handler: `S_story.level >= 20 && shardsCollected == 7`.
19. Route `VA` combat to `BOSS_COMMANDER_AUROS` (bypass random enemy selection).
20. On victory, call the existing Codex Reforged victory sequence.
21. On defeat, reset boss HP and return player to nearest safe node via the existing respawn path.

### Layer 6 — QA checkpoints

| Test | Pass criterion |
|---|---|
| Level 20 reachable | 150 simulated battles accumulate >= 195,000 XP |
| Tier gates enforced | Level-4 character never receives +1 or higher item; verified across 1,000 loot rolls |
| Reroll fallback rate | Level-1 character falls back to Minor Potion <= 5% of loot rolls |
| Offhand exclusivity | Equipping dagger with shield equipped moves shield to inventory; vice versa |
| Auto-sell accuracy | Only strictly inferior same-category items are sold; trophies, potions untouched |
| VA node locked | Node not traversable until both gate conditions met |
| Boss triggers victory | Defeating `BOSS_COMMANDER_AUROS` triggers Codex Reforged sequence exactly once |

---

*End of lab report. All constants, field names, and node IDs reference structures as they exist in `roll2hit-v3.html`. Implementation should touch only the constructs named above without restructuring the existing combat or world-graph engine.*


---

MIT License — roll2hit.com — Copyright (c) 2026 — Free to use, modify, and share.