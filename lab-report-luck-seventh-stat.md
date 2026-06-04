<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report — Layer 48: Luck, The Seventh Stat

**IEEE-Format Post-Mortem**  
**Date:** 2026-05-25  
**Layer:** 48  
**Section:** §XIII  
**Status:** ✅ Implemented  
**Codebase:** `roll2hit-v3.html` — single-file browser RPG

---

## Abstract

This report documents the design intent, implementation architecture, and integration points of the Luck stat (Layer 48, §XIII) added to `roll2hit-v3.html`. Luck is a read-only seventh ability score computed as the geometric mean of the six standard D&D scores (STR/DEX/CON/INT/WIS/CHA). It produces a standard modifier via the D&D formula `floor((luck − 10) / 2)` and silently influences four gameplay systems: loot quality, death saves, fishing performance, and corridor encounter rate. The design goal was a hidden reward for stat investment that feels emergent rather than mechanical — a player who builds a balanced character becomes lucky without knowing they chose to.

---

## I. Design Intent

### A. Problem Statement

The six D&D ability scores in `roll2hit-v3.html` are set once at character creation and modified by ASI rolls at level-up. Most are passive references: STR gates attack bonus, CON gates HP. Players optimizing STR and CON ignore CHA, INT, and WIS — they have no mechanical weight. The result is a min-maxing attractor that flattens character diversity.

### B. Design Goal

Introduce a soft incentive for balanced ability scores without adding a visible "balance bonus" that feels artificial. The solution: compute a seventh stat from all six, display it but don't explain it loudly, and wire it into four systems that reward slightly higher values.

### C. Why Geometric Mean

The arithmetic mean rewards extreme scores on any stat. The geometric mean penalizes neglect: a single score of 1 drives the product toward zero regardless of other scores. This makes Luck a true balance incentive — a character with STR 20 and CHA 4 has lower Luck than a character with all stats at 12.

The formula: `⁶√(STR × DEX × CON × INT × WIS × CHA)`, rounded up via `Math.ceil`.

---

## II. System Architecture

### A. Core Functions

**`_calcLuck()`** — `roll2hit-v3.html` line 8464:
```js
function _calcLuck() {
  const s = S_story.abilityScores || { str:16, dex:12, con:14, int:10, wis:12, cha:8 };
  const product = s.str * s.dex * s.con * s.int * s.wis * s.cha;
  if (product <= 0) return 0;
  return Math.ceil(Math.pow(product, 1 / 6));
}
```

Returns an integer in the same range as ability scores (typically 8–18 for a starting Human Fighter).

**`_luckMod()`** — line 8470:
```js
function _luckMod() { return Math.floor((_calcLuck() - 10) / 2); }
```

Standard D&D modifier. Starting Human Fighter (STR 16, DEX 12, CON 14, INT 10, WIS 12, CHA 8):
- Product: 16 × 12 × 14 × 10 × 12 × 8 = 25,804,800
- `⁶√25,804,800` ≈ 11.7 → ceil → **12**
- `_luckMod()` = `floor((12 − 10) / 2)` = **+1**

A balanced high-stat character can reach Luck 14–15 (modifier +2/+3). A neglected stat at 8 drops Luck to ~10–11 (modifier 0/+0).

### B. Integration Points

| System | Location | Effect |
|--------|----------|--------|
| Loot roll | Line 9442 | `d100 + max(0, _luckMod())` — higher luck improves drop tier |
| Death saves | Line 10640 | `d20 + _luckMod()` — luck directly added to death save roll |
| Fishing Survival DC | Lines 13412, 13419 | `DC = max(4, base − _luckMod())` — luck reduces the DC to find bait spots |
| Fishing bare hook catch | Line 13454 | Bare hook catch value = `_luckMod()` — lucky characters can catch fish without bait |
| Fishing type roll | Line 13481 | `typeTotal += _luckMod()` — luck shifts fish type toward higher-ranked catches |
| Corridor encounter rate | Lines 17033, 17085 | `chance -= _luckMod() × 0.5` — luck reduces random encounter probability during travel |
| Character sheet display | Line 16734 | Shown as `Luck: 12 [+1]` with label "geometric mean of all stats — read-only" |

---

## III. Design Decisions and Trade-offs

### A. Read-Only, Not Assignable

Luck is derived, never assigned. Players cannot put ASI points into Luck. This preserves the emergent character — Luck rises as a side effect of investing in the six real stats, not because the player targeted it.

### B. Not Explained in Tutorial

The character sheet shows the Luck value with a small italic note ("geometric mean of all stats — read-only") but no tooltip or tutorial beat explains how it works. This is intentional. Players who care to investigate will find the pattern. Players who don't will benefit silently.

### C. Encounter Rate Reduction as the Primary Reward

The most impactful Luck application is the corridor encounter rate reduction: `−luckMod × 0.5` from the base chance. At `+2 luck`, that's a 1% reduction (from e.g. 18% to 17%). Small but compounding — a lucky character travels corridors with marginally less danger. At high levels with balanced stats, `+3 luck` reduces encounter chance by 1.5%.

### D. Death Save Luck

Adding `_luckMod()` to death saves means a lucky character (modifier +2) has a meaningfully higher floor for surviving unconsciousness. This felt thematically appropriate: survival against odds is the colloquial meaning of "lucky."

### E. Fishing Integration

The fishing system uses Luck in three distinct phases:
1. **Finding bait** — Survival DC lowered by luckMod
2. **Catch without bait** — bare hook uses luckMod as base catch
3. **Fish type** — luckMod shifts the type roll upward

This makes Luck especially relevant for fishing-heavy players, rewarding the Yugurt Lake side-arc engagement.

---

## IV. Post-Mortem Notes

### What Worked

- The geometric mean formula is mathematically correct for the design goal. A score of 8 in any stat meaningfully suppresses Luck without catastrophically punishing.
- The character sheet display is appropriately subtle. The label explains the mechanic without overselling it.
- Corridor encounter rate reduction is the right primary hook: corridors are frequent, the effect is compounding, and a 0.5%/point reduction keeps it from being game-breaking.

### What Could Be Better

- Luck modifier range is narrow in practice (+0 to +3 for normal play). The corridor encounter reduction is therefore small. A player would need to notice their saves feel slightly better to consciously appreciate the stat.
- No feedback confirms that Luck influenced a specific roll. A subtle log entry ("✨ Lucky roll") when Luck tips a death save or loot tier would make the system more legible without spoiling the mystery.
- The Luck display on the character sheet is easy to overlook. It appears below the six primary stats with no icon.

### Recommendation for Future Sessions

Consider adding a one-time tutorial message when a player first reaches CHA ≥ 12 or INT ≥ 12 (stats players usually ignore): *"Your balanced training has brought something extra. You feel particularly capable today."* — a hint without a reveal.

---

## V. File References

| File | Location | Content |
|------|----------|---------|
| `roll2hit-v3.html` | Line 8464 | `_calcLuck()` — geometric mean computation |
| `roll2hit-v3.html` | Line 8470 | `_luckMod()` — standard modifier |
| `roll2hit-v3.html` | Line 9442 | Loot roll luck bonus |
| `roll2hit-v3.html` | Line 10640 | Death save luck bonus |
| `roll2hit-v3.html` | Lines 13412–13481 | Fishing integration (3 phases) |
| `roll2hit-v3.html` | Lines 17033, 17085 | Corridor encounter rate reduction |
| `roll2hit-v3.html` | Line 16734 | Character sheet display |
| `plan.md` | §XIII | Original design directive |
| `lab-report-fishing-bait-prompting.md` | §Luck integration | Fishing×Luck interaction context |

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
