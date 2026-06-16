<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report Synthesis — Part 2: Combat & Mechanics
**Cross-Reference of All Combat & Mechanics Lab Reports Against roll2hit-v3.html**
**Date:** 2026-06-16 · **HTML baseline:** 33,721 lines · **Source reports:** 7

---

## Purpose

Each entry reads the lab report against the live HTML and answers: what was documented, what is the current code, what still applies as working design knowledge. Reports are in `lab-reports/` untouched.

---

## Report 1 — `lab-report-leveling-flashbang-condition-economy.md`
**Original scope:** Layer 18 — character progression (10 levels), Flashbang consumable, ×100 condition repricing (2026-05-21)
**Still active:** Yes — all three systems are live and extended

### What the report said

Three systems implemented together as Layer 18:

1. **Character progression** — XP economy wired to level gates. Design constraint: session-completable (levels 5–7 in a normal playthrough). Rewards automatic, no build choices, no menus. Tangible combat difference between levels.

2. **Flashbang** — guaranteed ADV on next attack, bonus action cost. Formalizes the 0.5-action bonus phase economy. The design insight: the bonus phase is the creative space where player tactical identity emerges. Flashbang adds a setup option without adding another decision point per round.

3. **CONDITION_GOLD ×100** — pre-battle conditions repriced from single-digit gold to hundreds. Reflects true power of tactical setup. A level-1 character who spends 300gp on Blinded/Restrained is making a meaningful economic decision, not a trivial one.

### Current HTML

| Symbol | Line | Current state |
|--------|------|---------------|
| `const XP_LEVELS = [` | 22,375 | Active — 20 levels, max 195,000 XP (was 10 levels at report time; extended in §XL+) |
| `const CONDITION_GOLD = {` | 22,569 | Active — annotated `// → doc: mechanics-combat.md §Combat Flow` |
| `const CONDITION_ITEMS = [` | 20,537 | Active — 11 conditions with name/icon/effect/sell |
| `const CONDITION_ADV = {` | 6,513 | Active — ADV/DIS modifier by condition name |
| Flashbang in `_D100_TABLE` | 22,465 | Active — `{weight:4, _type:'flashbang'}` |
| Flashbang in `COMBAT_ITEMS` | 22,409 | Active — `{name:'Flashbang', cost:150, sell:75}` |
| `_checkLevelUp()` | 23,499 | Active — called from all XP award sites |
| `_lu_applyGiftsAndFinish()` | 33,502 | Active — awards HP, gold, shield, tattoo at level-up |

The XP table was extended from 10 to 20 levels (0–195,000 XP). The Flashbang is still the only guaranteed-ADV consumable in the game — no mechanic has superseded its niche. CONDITION_GOLD is unchanged in principle; specific values may have been rebalanced.

### What still applies

- **The 1.5 AP economy** is the structural spine of every combat round. All subsequent combat additions (offhand dagger, Action Surge, spell scroll, Flashbang, conditions) are options within the bonus phase — never new decision phases.
- **The level design constraint** (session-completable, no build menus, automatic rewards) still governs any new progression mechanic. No feature should require the player to choose between two upgrade paths.
- `_checkLevelUp()` is the single call site for all XP gate processing — called from quest completions, battle victories, and skill checks. Any new XP source should call it.

---

## Report 2 — `lab-report-drop-rates-balance-and-health.md`
**Original scope:** Health economy, drop rate design, Cooperative DM Principle, Necklace of Knowledge (2026-05-21)
**Still active:** Yes — the reward formula and design philosophy are unchanged

### What the report said

**The reward formula**: `XP = AC × maxHP`, `reward = floor(0.1 × AC × HPLoss)`. Both heal and gold derive from the same formula — harder enemies are self-funding. A player who fights harder enemies gets proportionally more back.

**Cooperative DM Principle**: The dungeon master is structurally on the player's side. Death is recoverable (checkpoint respawn), encounters are never unwinnable by design, and the natural play path (fight/rest/quest) produces net-positive resource flow.

**Necklace of Knowledge**: Location-collection layer — first arrival at each node awards a Knowledge Bead. Passive reward for exploration without changing combat mechanics.

**Rest architecture**: Short rests (3/day, 50gp, partial heal), long rests (inn sleep, full heal + day advance, costs vary by node).

### Current HTML

| Symbol | Line | Current state |
|--------|------|---------------|
| `reward = floor(0.1 × AC × maxHP)` | ~23,244 | Active — `_onStoryVictory()` at line 23,244 |
| `S_story.knowledge = []` | 21,157 | Active — array of Necklace of Knowledge beads |
| Checkpoint respawn | 21,917 | Active — `_survivingTattoos` preserved across respawn |
| `void_mercy_count` | 21,157 | Active — Cooperative DM Principle encoded as state |
| Short rest (3/day) | `storyShortRest()` | Active |

The formula has not changed since the report. The Cooperative DM Principle is mathematically enforced: `void_mercy_count` prevents the Void Tide from killing a player who is actively playing, and `storyRespawnFromCheckpoint()` guarantees recovery from death.

### What still applies

- The reward formula is a load-bearing invariant. Any new enemy type must produce `XP = AC × maxHP` and heal/gold from `floor(0.1 × AC × HPLoss)` to maintain economy balance.
- The Cooperative DM Principle is a design rule, not just philosophy: **no mechanic should create a state the player cannot escape through normal play.** Gate locks (e.g., DAM blind-days) must have a reachable resolution.
- The Necklace of Knowledge is the location-discovery reward layer. It should be the only reward for "first visit" — do not create a parallel "first visit" mechanic.

---

## Report 3 — `lab-report-loot-drop-weapon-economy.md`
**Original scope:** Design proposal — XP scaling fix, unified drop table, magic tier gates, slot rules (2026-05-21)
**Status:** Historical proposal — superseded by `lab-report-loot-drop-system-v2.md`

### What the report said

Four problems identified: (1) XP thresholds unreachable in normal play (max 680,000 XP, players hit ~120,000); (2) no unified drop table — weapons/daggers/potions on separate parallel rolls; (3) magic tier gates unenforced (level-1 could receive +2 weapons); (4) offhand slot accepts dagger and shield simultaneously.

### Current HTML status

All four problems were resolved in the v2 redesign (see Report 4). This report's value is as the diagnostic that drove that redesign.

- XP table compressed to 0–195,000 (20 levels reachable in extended play).
- `_D100_TABLE` unified all consumable drops.
- `_magicTierAllowed()` enforces magic tier gates via `S_story.level`.
- Equipment slot rules enforced — offhand dagger and shield are mutually exclusive.

### What still applies

The diagnostic framing is still useful: any new drop type added to the game should (1) appear in `_D100_TABLE` or a clearly named parallel table, (2) have a `minLevel` check if it has power scaling, (3) not be reachable from multiple uncoordinated code paths.

---

## Report 4 — `lab-report-loot-drop-system-v2.md`
**Original scope:** Three-channel drop model — trophies, weapon quality roll, d100 consumable; fishing exclusivity for positive magic (2026-06-05)
**Still active:** Yes — this is the current drop architecture

### What the report said

**Three-channel drop model** (sequential, every monster kill):
1. **Trophy drop** — `MONSTER_DROPS[enemy.key]` → themed sell-item, always
2. **Unified d100** — `_rollD100Loot()` → `_D100_TABLE` → potions/scrolls/flashbang/gold only (magic weapons removed)
3. **Monster weapon** — `_rollMonsterWeaponDrop(monsterDmgDie)` → 1 base weapon, quality −4 to 0 (never positive magic)

**Fishing exclusivity**: `LAKE_MAGIC_DB` contains all positive-magic equipment (+1 to +4). Only fishing produces positive-magic items. This gives Yugurt Lake a mechanically unique purpose.

**`GET /api/loot-drop` endpoint** — unified view across all three channels; filterable by channel, type, monster, level.

### Current HTML

| Symbol | Line | Current state |
|--------|------|---------------|
| `MONSTER_DROPS` anchor | 5,232–5,699 | Active — 392+ entries |
| `_D100_TABLE` anchor | 22,456–22,477 | Active — consumables only, no magic weapons |
| `_rollD100Loot()` | 22,485 | Active |
| `LAKE_MAGIC_DB` | 24,261 | Active — exclusive positive-magic source |
| `LOOT_TABLE` | 22,384 | Present but **dead code** — replaced by `_D100_TABLE`; marked in a comment |

`LOOT_TABLE` still exists in the HTML (line 22,384) as dead code — the report intended its removal but it was left as a `// dead code` comment. It is not called from anywhere. This is harmless but a future cleanup could remove it.

### What still applies

- The three-channel model is canonical. Do not add weapons to `_D100_TABLE`. Do not add positive-magic items to monster drops. Fishing is the exclusive upgrade path for positive-magic equipment.
- `MONSTER_DROPS` is the WBAPI-anchored source for trophy drops. New monsters must have a `MONSTER_DROPS` entry or they drop nothing thematic.
- `_magicTierAllowed(tier)` is the gating function — always call it before awarding any tiered item.

---

## Report 5 — `lab-report-luck-seventh-stat.md`
**Original scope:** Layer 48 (§XIII) — Luck as geometric mean of all six ability scores (2026-05-25)
**Still active:** Yes — four integration points all active

### What the report said

**Formula**: `Luck = ceil(⁶√(STR × DEX × CON × INT × WIS × CHA))`. Modifier: `floor((luck − 10) / 2)`. Read-only, displayed on character sheet. Wired into four systems silently:
1. **Loot quality** — `_rollD100Loot()` adds `_luckMod()` to the roll
2. **Death saves** — `_luckMod()` added to d20 death save roll
3. **Fishing** — reduces Survival DC, improves catch roll
4. **Corridor encounter rate** — higher Luck reduces random encounter probability

Design intent: reward balanced stat builds without a visible "balance bonus." A player who invests in all stats becomes lucky without knowing they chose to.

### Current HTML

| Symbol | Line | Current state |
|--------|------|---------------|
| `_luckMod()` | 21,525 | Active — `Math.floor((_calcLuck() - 10) / 2)` |
| `_calcLuck()` | ~21,520 | Active — geometric mean of 6 stats |
| Loot integration | 22,498 | Active — `Math.min(99, roll + Math.max(0, _luckMod()))` |
| Death save integration | 23,724 | Active — `let d20 = Math.ceil(Math.random() * 20) + _luckMod()` |
| Fishing integration | 26,830 | Active — `dc = Math.max(4, (baitSatchel ? 8 : 10) - _luckMod())` |
| Character sheet display | 33,047 | Active — "✦ LUCK" row with geometric mean + modifier |

All four integration points are live. `_luckMod()` is called 7+ times across the codebase. The "hidden reward" design works as intended: the character sheet shows the Luck value but doesn't explain its sources in-game.

### What still applies

- Any new system that should reward balanced stat investment should use `_luckMod()` as an additive bonus.
- The geometric mean formula is correct for the incentive: one low stat pulls the whole value down. Do not change to arithmetic mean.
- The `_luckMod()` calls are marked `// Layer 48:` in comments — these should be preserved as provenance markers.

---

## Report 6 — `lab-report-tattoo-progression-system.md`
**Original scope:** §XLI–§XLVII — Tattoo System (death-persistent progression record) + Chronicle System (dual-ledger stats) (2026-05-25)
**Still active:** Yes — both systems are core to character identity and death mechanics

### What the report said

**Tattoo System**: Bifurcated inventory — standard items drop on death, tattoos survive. Tattoos record: each level-up (ASI choice + HP roll), each death (timestamp + location). They are permanent, non-droppable, rendered in character sheet under "⚫ Your Tattoos." The character sheet text: *"Your tattoos record every level-up decision. They outlive you — the body remembers."*

**Chronicle System**: Two parallel ledgers — `careerStats` (never resets) and `runStats` (resets on respawn). 10 fields each: kills, deaths, dmgDealt, dmgReceived, sleeps, battlesAttempted, attacksAttempted, attacksHit, exitsTaken, daysAdventuring. Displayed in character sheet + game-over modal.

**Time-of-day clock**: `S_story.hour` advances +1 per battle, +6 per sleep (0–23). Used to timestamp death tattoos.

### Current HTML

| Symbol | Line | Current state |
|--------|------|---------------|
| `tattoos: []` in `_S_DEFAULTS` | 21,144 / 21,173 | Active — two entries (new-game + NG+ path) |
| `careerStats: {kills:0,...}` | 21,237 | Active — 10 fields |
| `runStats: {kills:0,...}` | 21,238 | Active — 10 fields |
| `_survivingTattoos` on respawn | 21,917 | Active — tattoos preserved across death |
| `_survivingCareerStats` on respawn | 21,918 | Active — career stats preserved across death |
| `_lu_applyGiftsAndFinish()` | 33,502 | Active — writes level-up tattoo to inventory |
| `kenickieMarketUsed: false` | 21,211 | Active — also in this section's scope |

The tattoo and chronicle systems are fully live. The `levelUpLog` array (also in `_S_DEFAULTS`) stores the full level-up history as a separate machine-readable record; tattoos are the human-readable inventory version.

### What still applies

- **The bifurcated inventory rule**: any item that represents a permanent character achievement (level, decision, death) must be a tattoo (`sell: 0`, no drop-on-death). Items that represent resources or equipment are standard inventory.
- **Death should write a tattoo** with day + hour + node code. The format is established; any future "death event" must follow it.
- `_survivingTattoos` and `_survivingCareerStats` are the respawn preservation hooks. Do not reset `careerStats` on death. Never drop tattoos.
- The chronicle fields are the canonical telemetry. Any new trackable player action should be added as a `careerStats` / `runStats` field, not a separate flag.

---

## Report 7 — `lab-report-kenickie-chronicle.md`
**Original scope:** Layers 75+77 — Kenickie's Black Market + Chronicle System (§XL + §XLII) (2026-05-25)
**Still active:** Yes — both systems are live

### What the report said

**§XL — Kenickie's Black Market**: Access unlocks when `quest_cat_05 === 'complete'`. A single inline announcement in the Cat-King completion message is the only notification ("Kenickie's Black Market is open"). No quest entry, no map marker, no animation. The reward is access to discounted healing and fishing bait from someone who now considers you crew. `kenickieMarketUsed: false` tracks first purchase, enabling a single-line greeting variation on return visits. The "sheet-swapper" pattern: the same node surface presents different NPC content depending on quest state.

**§XLII — Chronicle System**: (Also documented in Report 6 above.) The Chronicle system in this report focuses on the game-over modal integration — at death/respawn, the run stats are displayed as a summary before the career cumulative. The display format is: run stats first ("This run"), career stats second ("All time"), presented without blame or judgment — just numbers.

### Current HTML

| Symbol | Line | Current state |
|--------|------|---------------|
| `kenickieMarketUsed: false` | 21,211 | Active — `_S_DEFAULTS()` |
| Kenickie shop unlock | 28,804 | Active — `S_story.kenickieMarketUsed = true` on purchase |
| `quest_cat_05` completion | ~26,334 | Active — Cat-King quest handler |
| Run/career stats game-over display | ~21,848 | Active — `storyAutoSave()` vicinity |

### What still applies

- **The sheet-swapper pattern** is the correct model for post-quest NPC surface changes: check a quest flag in the node render block, swap the NPC card content. Do not create a separate node or quest entry for the unlocked NPC mode.
- **The silent unlock** is the right UX for reward-surface features that only exist as payoff for a completed quest chain. No notification beyond the quest completion message itself.
- **Chronicle display at game-over**: run stats / career stats displayed without judgment is the tone for all game-over data. The game does not tell the player they failed; it tells them what happened.

---

## Combat & Mechanics Summary — What Is Structurally True Right Now

**Three-channel loot**. Trophy (`MONSTER_DROPS`) → D100 consumable (`_D100_TABLE`) → weapon quality roll. Fishing is the exclusive positive-magic source (`LAKE_MAGIC_DB`). `_magicTierAllowed()` gates all tiered awards.

**1.5 AP economy is inviolable**. Every battle round: main action (attack) + bonus phase (one of: offhand, potion, spell, flashbang, condition, pass). No feature should add a third decision phase to the round.

**Cooperative DM Principle is mathematically enforced**. Reward formula (`0.1 × AC × HPLoss`) makes harder enemies self-funding. Death checkpoint preserves tattoos + career stats. `void_mercy_count` prevents Void-kill of active players.

**Luck is the seventh stat**. `_calcLuck()` = geometric mean of six ability scores. `_luckMod()` applies to: loot roll quality, death saves, fishing DC, encounter rate. Read-only, hidden incentive for balanced builds.

**Tattoos + Chronicle are the character persistence layer**. Tattoos survive death, record every level and every death with timestamp + location. Career stats never reset. Run stats reset on respawn.

**The level system is session-completable**. `XP_LEVELS` runs 0–195,000 across 20 levels. A normal playthrough reaches levels 5–7; extended play reaches 15+. No build choices, all rewards automatic.

---

*Synthesis Part 2 of 7 · Next: Part 3 — World & Navigation · 2026-06-16*
