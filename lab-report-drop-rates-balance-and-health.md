# Drop Rate Calibration, Health Economy Balancing, and the Cooperative PVE Rest Architecture in *The Shattered Codex*

**Roll2Hit v3 — Game Design Analysis Report**  
**Series:** Laboratory Reports on Narrative Engine Architecture  
**Classification:** Game Balance · Economy Design · Player Experience  
**Date:** 2026-05-21  
**Status:** Design Specification + Rationale Document

---

## Abstract

This report documents the health economy, drop rate design, and rest mechanic architecture of *The Shattered Codex*, a solo PVE narrative adventure layer built atop the Roll2Hit v3 combat engine. The central design question is: *how do you give a player a meaningful challenge without punishing them for exploring?* We present a stat-derived reward formula (`reward = floor(0.1 × AC × maxHP)`) that makes enemies self-funding — fighting harder enemies yields proportionally larger health recovery and gold — and a rest system a short/long rest mechanics, extended with a location-collection sub-system called the **Necklace of Knowledge**. The overarching design philosophy is the **Cooperative DM Principle**: in a solo PVE experience, the dungeon master is structurally on the player's side. Difficulty exists as texture, not obstruction.

---

## I. Introduction

### I-A. The Problem Space

Commercial action RPGs resolve the challenge-vs-accessibility tension through contests: lives, energy meters, pay-to-continue, or difficulty sliders. These mechanisms are extrinsic to the game world — they break immersion and communicate to the player that the game is working *against* them.

*The Shattered Codex* takes a different position. The player navigates a 42-node world across 49 days to collect 7 Codex Shards. Combat is unavoidable; rest costs gold; the Void Tide advances on a calendar. These are real pressures. But the system is designed so that the *natural play path* — fight, rest, explore, follow quests — produces net-positive resource flow. A player who engages with the game as intended never hits a wall.

This is the **Cooperative DM Principle**: the dungeon master's job is to make the story compelling, not to prevent the player from finishing it.

### I-B. Scope of This Report

This report covers three interlocking systems:

1. **Drop Rate & Health Economy** — the stat-derived reward formula, loot table, and how they interact with enemy difficulty to produce self-funding combat
2. **Rest Architecture** — short rests, long rests, inn recovery, and the Necklace of Knowledge location-collection layer
3. **Design Philosophy** — the theoretical underpinning for why these systems work together.

---

## II. Health Economy Design

### II-A. The Reward Formula

Every enemy kill produces three resources simultaneously. All three derive from the same underlying formula:

```
XP        = AC × maxHP
reward    = floor(0.1 × AC × HPLoss)
healAmt   = reward
goldDrop  = reward
```

Since the enemy dies at 0 HP, `HPLoss = maxHP`, giving:

```
reward = floor(0.1 × AC × maxHP) = floor(XP × 0.1)
```

**Key property:** XP, HP healed, and gold earned are all proportional to the same enemy stat product. A harder enemy — one with higher AC and more health — rewards more across all three axes simultaneously. There is no tradeoff between "challenging fight" and "good reward." The player is never incentivized to farm weak enemies.

**Representative examples:**

| Enemy | AC | Max HP | XP | Heal (HP) | Gold (gp) |
|---|---|---|---|---|---|
| Goblin Cutpurse | 11 | 7 | 77 | 7 | 7 |
| Wererat | 13 | 33 | 429 | 42 | 42 |
| Orc Warlord | 16 | 93 | 1,488 | 148 | 148 |
| Vampire Spawn | 15 | 82 | 1,230 | 123 | 123 |
| Ancient Dragon | 22 | 367 | 8,074 | 807 | 807 |

The dragon fight that nearly kills you also heals you for 807 HP and pays 807 gp. The system is self-correcting: the fights that drain resources the most also replenish them the most.

### II-B. Loot Table Distribution

In addition to the stat-derived reward, every kill rolls a d20 on a weighted healing potion table:

| d20 | Item | Weight | Sell Value |
|---|---|---|---|
| 1–10 | 🧪 Minor Healing Potion (+10 HP) | 50% | 25 gp |
| 11–15 | 🫧 Healing Potion (+25 HP) | 25% | 75 gp |
| 16–18 | 💜 Greater Healing Potion (+50 HP) | 15% | 200 gp |
| 19–20 | ✨ Superior Healing Potion (+100 HP) | 10% | 500 gp |

**Expected value per kill:** `0.50(10) + 0.25(25) + 0.15(50) + 0.10(100)` = `5 + 6.25 + 7.5 + 10` = **28.75 HP** of potion healing per kill on average.

This is independent of enemy difficulty. A Goblin Cutpurse and an Ancient Dragon both roll the same table. The loot table is a floor — a minimum recovery guarantee per fight — while the stat-derived reward is a ceiling that scales with difficulty. Together they form a health safety net that is always nonzero.

### II-C. Monster-Specific Drops

A third drop layer — the `MONSTER_DROPS` trophy system — provides sellable items (fangs, pelts, weapon drops) keyed by monster. These feed the vendor economy, enabling potion purchases between combats. Trophy drops do not heal directly; they convert to gold via vendor nodes, which then purchases potions. This creates a secondary health recovery channel mediated by exploration (vendor access) and economy (gold management).

### II-D. Net Health Flow Analysis

For a median enemy (Wererat, AC 13, HP 33):
- Immediate heal: **+42 HP**
- Loot table average: **+28.75 HP** (deferred via potion use)
- Gold: **+42 gp** (buys ~0.8 Minor Potions at 50 gp each)

Total immediate + deferred recovery per fight: approximately **70 HP**. A player who enters a Wererat fight at 1 HP and wins exits with meaningful survivability restored. This is intentional. The game does not punish "scraping through."

---

## III. Rest Architecture

### III-A. Rest Mechanics — The Reference Model

We often see two rest types:

- **Short Rest** (1 hour): Spend Hit Dice to recover HP. Each die roll + CON modifier restores HP. A character has a number of Hit Dice equal to their level. Spent Hit Dice recover on Long Rest.
- **Long Rest** (8 hours): Regain all HP. Recover half spent Hit Dice. Reset spell slots and most limited-use abilities.

Standard 5e allows unlimited short rests between long rests, though most encounters are balanced around 6–8 encounters per long rest. *The Shattered Codex* adapts this model with a simplified constraint appropriate to a single-file arcade RPG: **3 short rests per day**, reset on long rest at an inn.

### III-B. Short Rest Implementation

**Allowance:** 3 short rests per calendar day.  
**Reset trigger:** Long rest at any inn node.  
**Simplification:** Rather than Hit Die rolls, short rests restore a flat HP amount scaled to the player's current `S_story.hpMax`. This avoids the stat complexity of CON modifiers while preserving the D&D pacing model.

Short rests represent catching breath, binding wounds, eating trail rations. They are contextual — the game does not require a specific location. A player can short-rest at a junction, a beach, or a dungeon corridor.

### III-C. Long Rest — Inn Nodes

**8 inn nodes** are distributed across the 42-node world at key act transitions. Sleeping at an inn:

1. **Restores full HP** (`S_story.hp = S_story.hpMax`)
2. **Resets the short rest counter** to 3
3. **Advances the calendar** by 1 day (triggering Void Tide pressure checks)
4. **Sets or confirms Hearth Home** if the player designates this inn as their base

Inns cost gold (scaled by act). The gold cost creates a meaningful resource decision: spend now for full recovery and rest-counter reset, or conserve and take a short rest. This is the core economic loop of the rest system.

#### III-C-1. Double Good Quality Rest

Inn rest is classified as a **Double Good Quality Rest (DGQR)**. The DGQR designation reflects the narrative reality: the player character has access to:
- Security (locked room, no random encounter during sleep)
- Comfort (real bed, warmth, shelter from weather)
- Nourishment (a meal included in the inn fee)
- Hygiene (the implied shower — a clean adventurer is a rested adventurer)

In mechanical terms, DGQR means **full HP restoration** rather than the partial recovery of a standard long rest in the field. This distinguishes the inn from a wilderness camp and gives the vendor/inn economy clear value.

### III-D. The Necklace of Knowledge

The Necklace of Knowledge is a **passive collection inventory sub-system** that rewards exploration through rest. It does not grant active powers — it is a bestiary of places, a souvenir rack of locations the player has rested in, hung as beads on a metaphorical necklace.

#### III-D-1. Structure

- Stored as a sub-array of `S_story.inventory` with `type: 'knowledge'`
- Each bead is a unique rest-location token: `{ name, icon, node, type:'knowledge' }`
- Cannot be used, sold, or dropped — display-only
- Visible in inventory as a distinct section: **🔮 Necklace of Knowledge**

#### III-D-2. Acquisition

A new bead is added to the necklace the **first time the player rests at each unique location**. Each node where rest is possible (inn, wilderness camp, vendor shelter, boat, etc.) produces exactly one bead over the course of a run. Repeat rests at the same node do not add duplicates.

This creates an organic completionism incentive aligned with exploration: a player who seeks out every rest location fills their necklace, and does so by playing the game well (surviving long enough to reach each location).

#### III-D-3. Example Beads

| Location | Bead Name | Icon |
|---|---|---|
| City Inn (Birka) | Birka Pillow | 🛏 |
| Harbor Lighthouse (coastal) | Lighthouse Watch | 🔦 |
| Forest Shrine | Shrine Stone | 🪨 |
| Sunken City (boat cabin) | Cabin Lantern | ⛵ |
| Ruined Tower | Crumbling Turret | 🏚 |
| Any wilderness node | Trail Marker | 🏕 |

### III-E. Boy Scouts Camping Award

When the player rests at a **non-inn location** — the streets of a city, the floor of a vendor's shop, a boat deck, a wilderness clearing — they receive the **Boy Scouts Camping Award**: a mechanical bonus applied to that rest's healing.

**Effect:** Double the standard short-rest HP recovery for that rest instance.

**Rationale:** Sleeping rough is *harder*. A player who chooses or is forced to camp outside an inn is demonstrating resourcefulness. The game rewards that choice rather than penalizing it. This is the Cooperative DM Principle in microcosm: the environment acknowledges what you did and respects it.

**Narrative framing:** The adventurer is experienced enough to make the most of any situation. A knight sleeps on a featherbed; a ranger sleeps better under stars than in a tavern because they know how.

**Implementation note:** The award is display-only at the mechanical level (a brief message: *"Roughing it — you rest with the resourcefulness of a seasoned traveler. Heal doubled."*) and applies the 2× multiplier to `shortRestHealAmt` before applying to `S_story.hp`.

---

## IV. Synthesis: The Cooperative DM Principle

### IV-A. Theoretical Framing

Solo PVE game design has a structural asymmetry: the "dungeon master" (the game system) controls all variables, including enemy stats, resource availability, and encounter frequency. In adversarial framing, this power is used to create challenge by restricting player resources and increasing enemy pressure. The player must overcome the system.

In cooperative framing, the system uses the same variables to *scaffold* the player toward engaging with the game's full content. Difficulty exists as texture — combat feels dangerous — but the underlying math ensures that a player who keeps fighting will always have the resources to keep fighting.

This is not "easy mode." The Void Tide clock, the day limit, and the gate-locked progression create genuine urgency. But the health and economy systems are calibrated so that *combat itself* is the primary source of health and gold. The game is self-funding. The more you play, the more resources you have.

### IV-B. Design Pillars

| Pillar | Mechanism |
|---|---|
| Combat is self-funding | `reward = 0.1 × AC × maxHP` for both heal and gold |
| Every kill has a floor | d20 loot table guarantees ~28.75 HP of potion per kill |
| Exploration is rewarded | Necklace of Knowledge beads for unique rest locations |
| Improvisation is respected | Boy Scouts Camping Award doubles rough-sleep healing |
| Inns are worth their cost | DGQR: full HP + short rest reset + Hearth Home integration |
| Quest path is easiest path | Quest-boosted encounter rolls (6× weight for quest targets) |
| Failure has a soft floor | Checkpoint respawn at ½ HP — never start from zero |

### IV-C. The Anti-Grind Guarantee

The formula `reward = 0.1 × AC × maxHP` is deliberately **not flat**. A player who grinds weak enemies for safety gets weak rewards. The system nudges players toward appropriate-difficulty encounters by making those encounters more efficient. This discourages grinding while rewarding engagement with the main content.

Combined with the Void Tide clock (Day 49 hard limit), the system produces a natural pressure toward forward progress: the most efficient play is also the most narratively engaged play.

### IV-D. Rest as Story, Not Just Mechanics

The Necklace of Knowledge converts rest into narrative artifact. Every bead is evidence of where the player has been. A fully beaded necklace is a record of a complete run — a physical history of the adventure encoded in a collectible the player can see in inventory.

This transforms "resting" from a mechanical necessity (restore HP before next fight) into a world-building act (I was *there*, in *that place*, and I stayed the night). The DM rewards presence, not just performance.

---

## V. Conclusion

The health economy of *The Shattered Codex* is built on a single commitment: **the game is on your side**. Every enemy that challenges you also funds your recovery. Every place you rest teaches you something about the world. Every night spent under the stars rather than in a warm inn is acknowledged and respected with a bonus.

The formulas are simple — `floor(0.1 × AC × maxHP)` — but the design intent behind them is not: we want a player who finishes the game to feel like the world collaborated with them, that the difficulty was real, the victories were earned, and the journey left marks they can see.

The Necklace of Knowledge is that mark. The Boy Scouts Camping Award is that respect. The inn, with its hot meal and locked door, is that comfort.

The dungeon master is not your enemy. They are the author of the world, and they want you to see all of it.

---

## Appendix A — Pending Implementation: Rest Architecture (Layer 13)

The following mechanics are **described in this report but not yet implemented** in code. They constitute the design specification for Layer 13:

| Feature | Status | Notes |
|---|---|---|
| Short rest counter (3/day) | 📋 Planned | `S_story.shortRests` field; decrement on use, reset on inn sleep |
| Short rest heal formula | 📋 Planned | Flat % of `hpMax` scaled by CON modifier or level proxy |
| Inn sleep → full HP + reset | 📋 Planned | Already restores HP; short rest reset is the new piece |
| Boy Scouts Camping Award | 📋 Planned | 2× short rest heal at non-inn nodes; message on apply |
| Necklace of Knowledge | 📋 Planned | `type:'knowledge'` inventory sub-items; unique per node; display section in inventory overlay |
| Knowledge bead acquisition | 📋 Planned | On first sleep at each node, push bead with node label + icon |
| Inventory overlay: Knowledge section | 📋 Planned | Separate render block below main inventory list |

---

## Appendix B — Formula Reference

| Variable | Formula |
|---|---|
| XP per kill | `AC × maxHP` |
| HP healed per kill | `floor(0.1 × AC × maxHP)` |
| Gold looted per kill | `floor(0.1 × AC × maxHP)` |
| Loot table roll | `d20 → LOOT_TABLE[0..19]` |
| Expected potion heal/kill | `28.75 HP` |
| Short rest heals | TBD — % of `hpMax` |
| Short rests per day | 3 |
| Boy Scouts bonus | 2× short rest heal (non-inn only) |
| Inn rest (DGQR) | Full HP (`hpMax`) + short rest counter reset |

---

*Report written 2026-05-21*  
*Codebase: roll2hit-v3.html — Layers 0–12 implemented*  
*Layer 13 (Rest Architecture + Necklace of Knowledge) — specification complete, implementation pending*
