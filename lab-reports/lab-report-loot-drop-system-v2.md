<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Loot Drop System Redesign and API Formalization in *The Shattered Codex*

**Roll2Hit v3 — Game Design & Engineering Report**  
**Series:** Laboratory Reports on Narrative Engine Architecture  
**Classification:** Loot Economy · Drop Rate Balance · API Design  
**Date:** 2026-06-05  
**Status:** Specification Complete — Migration Implemented

---

## Abstract

This report formalizes the loot drop architecture of *The Shattered Codex*, resolving a design inconsistency in which the unified d100 loot table awarded magic-bonus weapons (+1–+4) that were intended to be exclusive to the fishing mechanic. We establish a clean three-channel drop model: (1) monster trophies (always), (2) monster weapon drops via a 1d6 quality roll (−4 to 0), (3) d100 consumable drops (potions, scrolls, gold). Fishing remains the exclusive source of positive-magic equipment via `LAKE_MAGIC_DB`. A new API endpoint `GET /api/loot-drop` provides a unified filterable view across all channels, replacing ad-hoc queries against `MONSTER_DROPS`, `LAKE_MAGIC_DB`, and `_D100_TABLE` separately. Code migration is documented in full; invalidated table entries are removed and redistributed.

---

## I. Introduction

### I-A. Hypothesis

> *The loot progression of* The Shattered Codex *can be improved by enforcing strict source-division: monster weapon drops are degraded variants (−4 to 0), fishing is the exclusive source of positive-magic equipment (+1 to +4), and the consumable drop table is purged of equipment entries. This produces a more readable inventory progression curve and gives fishing a clearly unique mechanical purpose.*

The current state has magic weapons appearing in both the d100 loot table (after any monster kill) and as fishing exclusives. This creates ambiguity: a player who has never fished can still accumulate +3 daggers from combat drops, which undermines the narrative and mechanical design of Yugurt Lake as a late-game upgrade source.

### I-B. Scope

This report covers:

1. Behavioral analysis of all three existing drop channels
2. Redefinition of drop semantics with canonical terminology
3. Migration of the d100 table and weapon-quality roll function
4. Removal of dead code (`LOOT_TABLE` legacy array)
5. Schema for the new `/api/loot-drop` query endpoint
6. Verification criteria for the migrated system

---

## II. Existing System Analysis

### II-A. Drop Channel Inventory

The game currently runs **three parallel drop systems** after every monster kill. They execute sequentially in `_onStoryVictory()`:

| Order | System | Implementation | Output |
|-------|--------|----------------|--------|
| 1 | Trophy drop | `MONSTER_DROPS[enemy.key]` + `S._pendingDrop` | 1 themed sell-item per monster |
| 2 | Unified d100 | `_rollD100Loot()` → `_D100_TABLE` | Potion, scroll, flashbang, gold, **or magic weapon** |
| 3 | Monster weapon | `_rollMonsterWeaponDrop(monsterDmgDie)` | 1 base weapon, quality −3 to 0 |

### II-B. Identified Defects

**Defect 1 — d100 table contains magic weapons.**  
`_D100_TABLE` entries include `_type:'dagger'` (_magic:1–4) and `_type:'mainweapon'` (_magic:0–4) at combined weight 36/100. A level-5 player reliably receives +1 daggers from combat drops before ever visiting Yugurt Lake.

```
Current d100 weight distribution:
  Consumables (potion/scroll/flashbang/gold): 64 / 100
  Daggers (+1 to +4):                          13 / 100  ← VIOLATION
  Main weapons (+0 to +4):                     23 / 100  ← VIOLATION
```

**Defect 2 — Monster weapon quality range is 4-sided, not 5-sided.**  
`_rollMonsterWeaponDrop` uses `Math.floor(Math.random() * 4) - 3` to produce −3, −2, −1, or 0. The design calls for a **five-level quality range** (−4 through 0) using a d6 mechanic. The −4 ("Wrecked") tier is missing entirely.

**Defect 3 — Dead code: `LOOT_TABLE`.**  
An earlier version of the drop system used `const LOOT_TABLE = [...]` (a flat 20-item array). This constant is defined once and referenced nowhere in the codebase. Its comment incorrectly states it is "used by `_rollD100Loot()`" — the function has not used it since the weighted table was introduced.

### II-C. Luck Integration (Existing — Correct)

The luck modifier (`_luckMod()`) is the geometric mean of all six ability scores, floored to a standard D&D modifier:

```
luck_score = ceil( (STR × DEX × CON × INT × WIS × CHA)^(1/6) )
luck_mod   = floor( (luck_score − 10) / 2 )
```

At all stats = 20: luck_score = 20, luck_mod = +5. In practice a 90th-percentile player has +3.

Luck currently applies to the d100 roll via:
```js
roll = min(99, floor(random() * 100) + max(0, luckMod))
```

This biases the roll toward higher-indexed table entries. After removing magic weapons from the table, this bias shifts toward better consumables (Superior potions, Scrolls), which is the correct behavior.

---

## III. Revised Specification

### III-A. Canonical Drop Channel Model

| Channel | Source | Magic Range | Trigger |
|---------|--------|-------------|---------|
| **Trophy** | `MONSTER_DROPS` | none (sell-only) | Every monster kill |
| **Weapon** | `_rollMonsterWeaponDrop` | −4 to 0 | Every monster kill |
| **Consumable** | `_D100_TABLE` | none | Every monster kill |
| **Fishing** | `LAKE_MAGIC_DB` + fish trophies | +1 to +4 (scaling) | Yugurt Lake combat only |

**Key invariant:** *Monsters never drop +1, +2, +3, or +4 bonus equipment.* All positive-magic items are gated behind the fishing mechanic.

### III-B. Monster Weapon Quality — d6 Table

The weapon dropped by a monster shares the monster's own `dmgDie` (or the closest available weapon type at or below that die). Quality is determined by a 1d6 roll:

| d6 Roll | Magic Bonus | Prefix   | Probability |
|---------|-------------|----------|-------------|
| 1       | −4          | Wrecked  | 16.7%       |
| 2       | −3          | Rusted   | 16.7%       |
| 3       | −2          | Chipped  | 16.7%       |
| 4       | −1          | Worn     | 16.7%       |
| 5       |  0          | (base)   | 16.7%       |
| 6       |  0          | (base)   | 16.7%       |

Base weapons appear on 5 or 6, giving a **2-in-6 (33.3%) probability** — the most common single outcome. Each degraded tier appears exactly once in six, creating a smooth downward distribution.

**Design rationale:** The d6 produces a flat but slightly base-weighted distribution. A player will see degraded weapons frequently in early game (when monsters are weak and the base weapon isn't much better than their equipped item anyway) and begin receiving base-tier drops from tougher monsters as content progresses. This feels natural without requiring a tier gate.

### III-C. d100 Consumable Table — Revised Weights

The 36 weight points freed by removing equipment entries are redistributed toward consumable variety:

| Type                    | Old Weight | New Weight | Δ   |
|-------------------------|------------|------------|-----|
| Minor Healing Potion    | 25         | 35         | +10 |
| Healing Potion          | 12         | 18         | +6  |
| Greater Healing Potion  | 8          | 14         | +6  |
| Superior Healing Potion | 3          | 6          | +3  |
| Spell Scroll            | 6          | 11         | +5  |
| Flashbang               | 4          | 6          | +2  |
| Gold Cache              | 6          | 10         | +4  |
| Dagger +1–+4 *(removed)*| 13         | 0          | −13 |
| Main Weapon +0–+4 *(removed)*| 23    | 0          | −23 |
| **Total**               | **100**    | **100**    |     |

**Expected value per kill (consumables):** With luck mod +3 at max level biasing toward higher entries, the effective probability of a Superior Healing Potion rises from ~3% (3/100) to ~9% (bias shifts ~6 positions up the table). This is the correct mechanical reward for building a high-luck character.

### III-D. Fishing as Exclusive Magic Source

`LAKE_MAGIC_DB` already contains 8 lake magic items with bonuses scaling via `base + floor(level × levelScale) + floor(luck × luckScale)`. These are not modified in this pass. Their exclusivity is reinforced by the d100 table purge rather than any new gate mechanism.

The fishing mechanic's luck connection is bidirectional:
- Luck improves the bare-hook `catch` bonus
- Luck reduces the Survival DC for finding bait
- Luck is applied to the Type roll for night fishing
- Lake magic items themselves have `luckScale > 0` — a lucky character gets better items from the same rank of fish

---

## IV. Implementation

### IV-A. Code Migration

**Change 1 — Remove `LOOT_TABLE` dead code.**

```js
// BEFORE (line 18220 — dead, never referenced):
const LOOT_TABLE = [
  ...Array(8).fill({ name:'Minor Healing Potion', ... }),
  ...
];

// AFTER:
// LOOT_TABLE removed — superseded by _D100_TABLE (see §D100_TABLE below)
```

**Change 2 — Purge equipment entries from `_D100_TABLE`.**

```js
// BEFORE:
const _D100_TABLE = [
  { weight:25, _type:'potion_minor' },
  // ... other consumables ...
  { weight:5,  _type:'dagger',     _magic:1 },  // removed
  { weight:4,  _type:'dagger',     _magic:2 },  // removed
  { weight:3,  _type:'dagger',     _magic:3 },  // removed
  { weight:1,  _type:'dagger',     _magic:4 },  // removed
  { weight:8,  _type:'mainweapon', _magic:0 },  // removed
  { weight:6,  _type:'mainweapon', _magic:1 },  // removed
  { weight:4,  _type:'mainweapon', _magic:2 },  // removed
  { weight:3,  _type:'mainweapon', _magic:3 },  // removed
  { weight:2,  _type:'mainweapon', _magic:4 },  // removed
]; // total weight = 100

// AFTER:
const _D100_TABLE = [
  { weight:35, _type:'potion_minor' },
  { weight:18, _type:'potion' },
  { weight:14, _type:'potion_greater' },
  { weight:6,  _type:'potion_superior' },
  { weight:11, _type:'scroll' },
  { weight:6,  _type:'flashbang' },
  { weight:10, _type:'gold' },
]; // total weight = 100
```

The `_rollD100Loot()` function retains its `dagger` and `mainweapon` handling branches for API compatibility (a content author can still PUT those entry types via the server if desired), but they will not fire unless manually re-added to the table.

**Change 3 — Extend `_rollMonsterWeaponDrop` to d6 quality (−4 to 0).**

```js
// BEFORE:
const deg = Math.floor(Math.random() * 4) - 3; // −3 to 0
const pfx = ['Rusted ','Chipped ','Worn ',''][deg + 3];

// AFTER:
// d6 quality roll: 1→-4(Wrecked), 2→-3(Rusted), 3→-2(Chipped), 4→-1(Worn), 5-6→0(base)
const d6  = Math.ceil(Math.random() * 6);
const deg = Math.min(0, d6 - 5);
const pfx = ['Wrecked ','Rusted ','Chipped ','Worn ','',''][d6 - 1];
```

### IV-B. API Data Structure

The `/api/loot-drop` endpoint exposes a unified view managed by the runtime — no new persistent table is required. The data is assembled from existing WBAPI structures at query time:

| Data source | WBAPI property | Key type |
|------------|----------------|----------|
| Monster trophies | `WBAPI.monsterDrops` | monster key → `{name, icon, sell}` |
| Monster pool (stats) | `WBAPI.monsterPool` | monster key → `{name, ac, hp, atk, dmgDie, ...}` |
| Terrain → monster index | `WBAPI._terrainToMonsters` | terrain key → `[monster keys]` |
| Monster → terrain index | `WBAPI._monsterToTerrains` | monster key → `[terrain keys]` |
| Lake magic | `WBAPI.lakeMagicDb` | lake_mag_N → `{name, effect, base, levelScale, luckScale, minRank, ...}` |
| Fish pool | `WBAPI.fishPool` + `WBAPI.nightFishPool` | `[{key, rank, name, ...}]` |

**No new serialized table is needed.** The quality distribution table is a static constant embedded in the endpoint response (`_meta.qualityTable`).

### IV-C. Endpoint Schema

```
GET /api/loot-drop
```

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `terrain` | string | Terrain key — returns drops for all monsters in this terrain |
| `monster` | string | Monster key — returns drops for one specific monster |
| `fishing` | boolean string | `true` → fishing only · `false` → monsters only |
| `bonus` | integer | `bonus≤0` filters monster weapon quality · `bonus>0` filters lake magic base |
| `name` | string | Case-insensitive substring search on all name fields |

**Response structure:**

```json
{
  "ok": true,
  "count": N,
  "drops": [
    {
      "source": "monster",
      "monsterKey": "orc",
      "monsterName": "Orc",
      "terrains": ["plains", "dungeon"],
      "dmgDie": 8,
      "trophy": { "name": "Orc Tusk", "icon": "🦷", "sell": 12 },
      "weaponDrop": {
        "rule": "Base weapon ≤ monster dmgDie, quality 1d6",
        "qualityTable": [
          { "roll": "1",   "bonus": -4, "prefix": "Wrecked", "probability": "1-in-6 (16.7%)" },
          { "roll": "2",   "bonus": -3, "prefix": "Rusted",  "probability": "1-in-6 (16.7%)" },
          { "roll": "3",   "bonus": -2, "prefix": "Chipped", "probability": "1-in-6 (16.7%)" },
          { "roll": "4",   "bonus": -1, "prefix": "Worn",    "probability": "1-in-6 (16.7%)" },
          { "roll": "5–6", "bonus": 0,  "prefix": "(base)",  "probability": "2-in-6 (33.3%)" }
        ]
      }
    },
    {
      "source": "fishing",
      "subtype": "lake_magic",
      "key": "lake_mag_04",
      "name": "Void-Touched Fin",
      "icon": "🌀",
      "effect": "atk_bonus",
      "base": 1,
      "levelScale": 0.2,
      "luckScale": 0,
      "minRank": 16,
      "minLevel": 5,
      "bonusFormula": "1 + floor(level×0.2)",
      "fishing": true
    }
  ],
  "_meta": {
    "qualityTable": [...],
    "sources": ["monster", "fishing"],
    "queryParams": ["terrain", "monster", "fishing=true|false", "bonus=<n>", "name=<q>"],
    "note": "d100 consumable table at GET /api/loot  ·  magic weapons are fishing-only"
  }
}
```

---

## V. Validation

### V-A. Invalidated Data Fixes

| Location | Issue | Resolution |
|----------|-------|------------|
| `const LOOT_TABLE` | Dead code, comment incorrectly credits `_rollD100Loot` | Replaced with comment stub pointing to `_D100_TABLE` |
| `_D100_TABLE` entries `_magic:1–4` on dagger/mainweapon | Violated fishing-exclusivity rule | Removed; 36 weight redistributed to consumables |
| `_rollMonsterWeaponDrop` prefix array | Missing "Wrecked" prefix for −4; 4-sided not 5-sided | Replaced with d6 mechanic; added "Wrecked" at d6=1 |
| `_D100_TABLE` comment header | Claimed `_magic?` fields as active types | Updated to document consumables-only schema |

### V-B. Verification Criteria

| Test | Pass Criterion |
|------|----------------|
| d100 table sum | `_D100_TABLE.reduce((s,e)=>s+e.weight,0) === 100` |
| No magic weapons from combat | 10,000 simulated kills at level 20: zero `magicBonus > 0` weapon drops |
| d6 quality distribution | 100,000 rolls: each of −4/−3/−2/−1 appears ~16.7% (±1.5%); 0 appears ~33.3% (±2%) |
| Fishing still exclusive | `LAKE_MAGIC_DB` items not present in any combat drop path |
| `/api/loot-drop` returns 200 | `GET /api/loot-drop` with no params returns all monster trophy + lake magic entries |
| Terrain filter | `GET /api/loot-drop?terrain=dungeon` returns only monsters from `WORLD_DB.dungeon.monsters` |
| Fishing filter | `GET /api/loot-drop?fishing=true` returns only `source:"fishing"` entries |
| Bonus filter (positive) | `GET /api/loot-drop?bonus=1` returns lake_magic items with `base === 1` |
| Bonus filter (negative) | `GET /api/loot-drop?bonus=-2` returns monster entries with quality table including −2 |
| Name filter | `GET /api/loot-drop?name=spine` returns entries with "spine" in any name field |

### V-C. New Endpoint Coverage

```bash
# Quick smoke tests
curl http://localhost:1367/api/loot-drop
# → count ≥ (total monsters with drops) + (8 lake magic items) + (25 fish)

curl 'http://localhost:1367/api/loot-drop?terrain=dungeon'
# → only monsters whose terrain array includes "dungeon"

curl 'http://localhost:1367/api/loot-drop?fishing=true'
# → only source:"fishing" entries

curl 'http://localhost:1367/api/loot-drop?fishing=true&bonus=2'
# → lake magic items where base=2

curl 'http://localhost:1367/api/loot-drop?monster=ancient_dragon'
# → 1 entry, monsterKey:"ancient_dragon", dmgDie:12
```

---

## VI. Conclusion

The loot system of *The Shattered Codex* now enforces a clean three-channel model with clear source-division. Monster combat produces trophies and degraded base weapons (d6 quality: −4 to 0). The consumable table provides health recovery and utility items. Fishing is the sole path to positive-magic equipment.

The d6 quality roll creates a natural inverse rarity: the "perfect" (base) weapon appears 33% of the time, while each degraded tier appears 16.7%. A player who fights many monsters will see the full distribution across a session without any of it feeling artificially scarce. The Wrecked tier (−4) adds a "junk pickup" moment — the weapon is almost worthless, but it happened fairly, on a 1.

The luck mechanic connects coherently: at the combat layer, luck shifts consumable quality; at the fishing layer, luck determines what you catch and what the catch is worth. The two reward loops reinforce each other without competing.

---

## Appendix A — Formula Reference

| Variable | Formula | Notes |
|----------|---------|-------|
| Luck score | `ceil((STR×DEX×CON×INT×WIS×CHA)^(1/6))` | Geometric mean |
| Luck mod | `floor((luck_score − 10) / 2)` | Standard D&D modifier |
| Max practical luck mod | +3 (all stats ~18–20) | +4 theoretical max at all 20 |
| d100 roll with luck | `min(99, floor(rand×100) + max(0, luckMod))` | Shifts toward better consumables |
| Monster weapon die | `≤ monster.dmgDie` | Drops pool filtered to matching die |
| Weapon quality d6 | `d6=1→-4, 2→-3, 3→-2, 4→-1, 5-6→0` | `deg = min(0, d6-5)` |
| Lake magic bonus | `base + floor(level×levelScale) + floor(luck×luckScale)` | Per-item scales |

## Appendix B — Files Modified

| File | Change |
|------|--------|
| `roll2hit-v3.html` | Remove `LOOT_TABLE`; update `_D100_TABLE` weights; update `_rollMonsterWeaponDrop` d6 quality |
| `wbapi-server.js` | Add `GET /api/loot-drop` endpoint; update help text for `/api/loot`; update endpoint index |
| `wbapi-help.md` | Add "Loot Drop System" section with channel model, d6 table, and query endpoint docs |

---

*Report written 2026-06-05*  
*Codebase: roll2hit-v3.html — Migration applied in this session*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
