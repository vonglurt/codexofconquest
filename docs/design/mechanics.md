<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# CodexOfConquest — The Shattered Codex: Game Mechanics

## Overview

CodexOfConquest runs in two modes that share a single state. **Battle Mode** is the combat tracker. **Story Mode** is the narrative exploration layer. The two modes communicate through `S_story.pendingBattle` and `S._pendingDrop`.

---

## Battle Mode

### Combat Flow

#### Starting a Battle (Story Mode)
1. Navigate to a node with a **⚔ BATTLE** chip (or trigger an open-cell encounter).
2. The **Pre-Battle screen** opens with three tabs:

| Tab | Cost | Effect |
|---|---|---|
| ⚔ Fight | 0gp | Enter combat immediately, no opener |
| 💣 Condition | 1,000–5,000gp | Apply a status condition to the enemy at battle start (gold deducted, not inventory) |
| 🎭 Stealth | 0gp | Roll d20 vs random DC 5–16 — roughly 25–80% chance. Pass → you go first + ADV on first attack. Fail → no effect, no cost. |

**Enemy Threat Badge:** Before starting, a threat badge shows the enemy's tier (TRIVIAL through DEADLY ⚠) along with their AC, approximate HP, and ATK bonus from `MONSTER_POOL`. Use this to decide whether to fight, flee, or spend on conditions.

**Safe Retreat:** A **← Retreat (safe)** button is always visible — leave without fighting, no penalty, no cost. This is always available even if conditions or stealth tabs are open.

**Condition Gold Costs:**

| Condition Item | Cost |
|---|---|
| Feint Scroll | 1,000gp |
| Earthbind Root / Binding Web / Snare Trap | 1,500gp each |
| Flash Powder / Smoke Bomb | 2,000gp each |
| Thunderstone / Signal Jammer | 3,000gp each |
| Void Virus Canister | 3,500gp |
| EMP Grenade / Neurotoxin | 4,000gp each |
| Basilisk Eye Flask | 5,000gp |

Conditions are priced as decisive tactical tools — mid-to-late-game investments. The cheapest (Feint Scroll at 1,000gp) becomes affordable around 6–10 battles in. If none are affordable, a hint appears in the tab: "Conditions unlock as you earn gold. Cheapest: Feint Scroll at 1,000 gp."

3. Click **⚔ Start Battle** → **Initiative** is rolled automatically (`d20 + tier modifier` for both sides; ties go to player).
4. The **Story Battle Focus overlay** appears, replacing the screen.

#### Story Battle Focus Overlay
A full-screen focused UI showing:

- **Opponent block** — name, AC, ATK bonus, DMG dice, HP bar, active condition
- **Your block** — AC, HP bar, initiative note
- **Turn badge** — YOUR TURN (gold) or ENEMY TURN (red)
- **Round counter**

Action buttons:

| Button | Phase | Action |
|---|---|---|
| ⚔ Attack | Main (1.0 AP) | Roll to-hit + auto-damage; opens bonus phase |
| 😬 Pass attack | Main (1.0 AP) | Skip attack — opens bonus phase safely (no mutual attacks) |
| 🗡 Offhand | Bonus (0.5 AP) | Off-hand attack; requires a real weapon attack already landed this round |
| 🧪 Potion | Bonus (0.5 AP) | One button per healing potion — drink without ending your turn |
| 📜 Spell Scroll | Bonus (0.5 AP) | Queues ADV on your next attack roll this round |
| 💥 Flashbang | Bonus (0.5 AP) | Grants ADV on next attack (no DC, no fail — see Combat Items) |
| 🛡 Shield | Bonus (0.5 AP) | Equip a shield from inventory for immediate AC bonus |
| 🏃 Flee ⚠ | Main (1.0 AP) | Flee at round-start — both sides roll free attacks first |
| 🏃 Flee ✓ | Bonus (0.5 AP) | Clean exit after passing main — no mutual attacks |
| 😬 Pass bonus | Bonus (0.5 AP) | Skip bonus action — fires enemy turn |

The **AP row** at the top of the overlay shows current action points: `⚡ 1.5` when fresh, `⚡ 0.5` in bonus phase.

**Enemy turn** fires automatically 1.2s after your action resolves.

---

### Action Economy (1.5 AP System)

Each round has **1.5 Action Points**. The main action (1.0 AP) must be used first; this opens the bonus phase (0.5 AP).

```
Round Start (1.5 AP)
  │
  ├─ ⚔ Attack   → bonus phase opens → use or pass → enemy fires
  └─ 😬 Wimper  → bonus phase opens → use or pass → enemy fires
                                       └─ 🏃 Flee ✓ = clean exit
```

**Wimper (Pass attack):** Passes the main action without attacking. Critical use cases:
- **Heal first:** Wimper → open bonus → drink potion → enemy fires (arrive at enemy turn at full HP)
- **Safe flee:** Wimper → open bonus → Flee ✓ (clean exit, no mutual attacks — works from round 1)

**Flee ⚠ vs Flee ✓:**
- `🏃 Flee ⚠` in main phase = both sides get free attacks. Risky if the enemy is hard-tier.
- `🏃 Flee ✓` in bonus phase (after passing or attacking) = clean exit, no mutual attacks.

**Offhand requirement:** `🗡 Offhand` requires a **genuine weapon attack** this round (not wimper). This prevents the "wimper → offhand heal" exploit — offhand is a second attack, not a free bonus.

**⚙ Advanced** — minimizes the overlay, revealing the full God Mode battle panels below. A refocus bar at the top re-opens the overlay.

#### Auto-Damage
Auto-Damage is **ON by default**. Both player and enemy damage is applied automatically — no separate "Roll Damage" step needed in the Battle Focus overlay.

#### Defeat (HP = 0 during battle)
If your HP reaches 0 during a Story Battle, the overlay closes and the **Game Over modal** fires automatically. Options: **Respawn at Checkpoint** (last inn sleep, ½ HP) or **New Game**.

#### Victory Screen
On enemy death the **Victory overlay** appears automatically, showing:

| Line | Detail |
|---|---|
| Enemy name | Who you defeated |
| XP earned | `enemy AC × enemy max HP` |
| Total XP | Cumulative XP · progress toward next level |
| Level Up! | If XP crossed a threshold: new level + stat gains shown |
| HP recovered | `floor(0.1 × AC × maxHP)` applied immediately |
| Gold looted | Same formula as HP recovered |
| Drops | Monster-specific trophy + loot table roll (d20) + equipment drop rolls |

Click **▶ Back to Quest** to return to Story Mode.

**Run Victory (Codex Reforged):** Reaching the CO node with all 7 shards shows the final victory modal with full run stats: day, HP, gold, items, quests completed, level reached, XP earned, battles won.

---

### Flee / Run Away

Two flee paths exist with very different risk profiles:

**Flee ⚠ (Main-phase flee):** Click Flee at the start of your turn before attacking.
- Both sides roll **one free attack** against each other.
- If the enemy hits (Auto-Damage ON), you take damage before escaping.
- Risky against hard/deadly-tier enemies; their ATK bonus can be fatal.

**Flee ✓ (Bonus-phase flee, safe):** Wimper main → bonus phase → click Flee.
- **Clean exit — no mutual attacks.** No damage taken.
- Available from round 1 via the wimper → flee route.
- This is the recommended escape when you want zero risk.

In both cases: the battle is not marked defeated — no victory credit, no drops. The BATTLE chip remains active.

**Pre-battle safe retreat:** Before committing to the battle at all, the **← Retreat (safe)** button returns to the map with no cost and no penalty.

---

### Enemy Low-HP Behavior (§PLAY-01-B)

At **≤30% HP** the enemy's turn (`_storyEnemyTurn`) branches on what kind of thing it is — enacting the story's "the Void advances where defenders are thin and retreats where they're strong." (Single-player only; the `DUEL:CORE` PvP kernel is untouched.)

- **Void-touched enemies *press* (one-time enrage).** `_isVoidEnemy()` is a **heuristic**: Void/undead vocabulary in the name/key (void, corrupt, wraith, shade, revenant, wight, ghoul, lich, skeleton, necro, dread, abyss, blight, cursed, shadow, demon…) **or** a Void-ish current terrain. Once per fight (`S.opp.enraged`, reset each encounter in `_storyRollInit`) it gains `_voidEnrage(tier)`: **easy** +1 atk/+1 dmg … **deadly** +4 atk/+4 dmg **and an extra damage die** — then still attacks that turn. Makes "Deadly ⚠" read as a duel, not just big numbers.
- **Mundane beasts *flee*.** With `_fleeChance(tier)` (easy 0.5 → deadly 0.1) the beast breaks and runs: `_storyEnemyFlees()` ends the fight — **no loot, node not cleared** — but the effort still earns XP (see below).

> ⚠️ **Both branches key on `tier`, and both fall back silently** (§DX-02g, 2026-07-31). `_voidEnrage` answers an unknown tier with the *weakest* press (`+1/+1`) and `_fleeChance` with `0.4`; the same value also feeds `_storyRollInit`'s initiative modifier and `_weightedMonsterPick`'s encounter weight (`|| 10`). `void_shaman` shipped as `tier:'rare'` and pressed at +1/+1 for as long as it existed. **A monster's tier must be one of the five** — see the tier-contract table in `monsters.md`.

### XP System

XP is earned on every enemy kill, including open-cell encounters.

**Formula:** `XP = enemy AC × enemy max HP`

| Enemy example | AC | HP | XP |
|---|---|---|---|
| Goblin Scout | 12 | 10 | 120 |
| Wererat | 13 | 33 | 429 |
| Orc Warlord | 16 | 93 | 1,488 |
| Ancient Dragon | 22 | 367 | 8,074 |

XP accumulates in `S_story.xp` across the entire run (monotonic — never decremented in-run; NG+ resets). Shown on the victory overlay after each fight.

**Effort XP (§XP-01 / §XP-02):** the principle is *all action earns XP; you never lose XP* — every "effort without success" surface, plus **covering new ground**, pays out. Three dials:

| Dial | Default | Applies to |
|---|---|---|
| `EFFORT_XP_PCT` | `0.25` | a **fled enemy** grants `round(AC·maxHp·EFFORT_XP_PCT)` (`_storyEnemyFlees`); a **failed skill-check** grants `round(rewardXp·EFFORT_XP_PCT)` of the reward the pass would have given, **once per quest** (`_resolveQuestUQF`; 0 if the check carries no reward bit) |
| `EFFORT_MISS_PCT` | `0.02` | each **missed attack** grants `round(AC·maxHp·EFFORT_MISS_PCT)`, banked silently (no mid-fight level-up modal). Paid on **all three** attack surfaces — `_overlayPlayerAttack`, the off-hand bonus action `_overlayOffhandAttack` (§DX-02df), and the mutual-flee free swing in `_storyFleeMutual` (§XP-FLEE). **The flee swing is paid but NOT tallied**, deliberately: `attacksAttempted` means *deliberate attacks*, and re-defining it would retroactively change the hit rate every save prints. One per-encounter cap is shared across all three |
| `EXPLORE_XP` (§XP-02-A) | `10` | **first arrival** at a node — a flat grant awarded once when `S_story.visited[code]` flips false→true (`storyCollectLoot` → `_grantExplorationXp`); backtracking a visited node pays nothing. Accrues to `S_story.explorationXp` telemetry; UI (message + any level-up) is deferred so it never gates the free step |

**What the principle does NOT reach, and deliberately (§AUDIT-03bm, 2026-09-03):** the failed-check dial is a **percentage of the pass value, not a floor**, so a check whose `onPass` carries no `reward` bit pays nothing on either side of the roll. That is **2,384 of 2,635** skill-check quests (90.5 %); only **92** (3.5 %) can pay effort XP at all, worth **4,205 XP** in total if every one were failed once. Those checks are not unpaid — they mint a **mission-bit token** through `` `function _grantMissionBit@26242` ``, which awards no XP by design (`` `Token received: @26258` ``). **XP is the currency of the combat and exploration loops; a witnessed moment is denominated in tokens.** The declined alternative was a flat grant inside the `mission_bit` opcode: at the `EXPLORE_XP` dial it cites as precedent that is **2,450 bits × 10 = 24,500 XP**, more than the **22,307 XP** every authored quest reward in the game pays put together — a level-curve move needing the balance pass §DX-02i refused to skip, not a consistency fix. All five counts are re-derived from `QUEST_DB` on every run by `src/tests/integration/audit03bm-skillcheck-xp-census.test.js`.

Combat misses are **capped per encounter** at the flee value — cumulative miss-XP in one fight cannot exceed `round(AC·maxHp·EFFORT_XP_PCT)` (25% of the kill), so miss-farming a weak enemy never out-earns fighting a real one, and a won fight yields at most ~125% of its kill XP. First-arrival XP is likewise **bounded ≤ the weakest starter flee value** (`EXPLORE_XP` = `10` ≤ protofleder's `round(12·16·0.25)` = `48`), so exploring a node can never out-earn a fight. All effort XP is single-player story only (`S_story`); it never enters the synced PvP duel.

---

### Heal on Kill & Gold Drop

Both use the same formula:

```
Reward = floor(0.1 × OpponentAC × OpponentHPLoss)
```

Since the opponent dies at 0 HP, `HPLoss = maxHP`, so:

```
Reward = floor(0.1 × AC × maxHP)
```

HP healed and gold looted are **equal** — you get the same number for both.

| Enemy example | AC | HP | Reward (HP + gold each) |
|---|---|---|---|
| Goblin Scout | 12 | 10 | 12 |
| Wererat | 13 | 33 | 42 |
| Orc Warlord | 16 | 93 | 148 |
| Ancient Dragon | 22 | 367 | 807 |

Both values are applied immediately on kill, before the victory overlay renders.

---

### Loot Table

> **Source:** `_D100_TABLE` + `_rollD100Loot()`. Consumables only — magic weapons and daggers are **fishing-exclusive**. Monster weapon drops handled by `_rollMonsterWeaponDrop()` (see below). `LOOT_TABLE` (old d20 array, Layer 25) removed; replaced by comment stub.

On every enemy kill, `_rollD100Loot()` rolls d100 against the weighted table below. Up to **3 reroll attempts** before falling back to Minor Healing Potion.

| Weight | % | Type | Drop | Sell |
|---|---|---|---|---|
| 35 | 35% | `potion_minor` | 🧪 Minor Healing Potion | 25gp |
| 18 | 18% | `potion` | 🫧 Healing Potion | 75gp |
| 14 | 14% | `potion_greater` | 💜 Greater Healing Potion | 200gp |
| 6 | 6% | `potion_superior` | ✨ Superior Healing Potion | 500gp |
| 11 | 11% | `scroll` | 📜 Spell Scroll | 50gp |
| 6 | 6% | `flashbang` | 💥 Flashbang | 75gp |
| 10 | 10% | `gold` | 💰 50–249 Gold Pieces | n/a |

**Total weight = 100.** Gold drop range: `floor(random × 200) + 50` → 50–249gp.

**📜 Spell Scroll:** Used in battle bonus phase — queues ADV on next attack. Expires at round end if unused. Also sellable at vendor nodes for 50gp.

---

### Equipment Drops

After each battle, **one guaranteed weapon drop** fires via `_rollMonsterWeaponDrop()`. The old parallel 15%/12% separate dagger and weapon rolls are retired; the d100 table is consumables-only.

**Monster weapon drop — `_rollMonsterWeaponDrop(monsterDmgDie)` *(§DROP-01 — ✅ 2026-06-05)***

Drops one base weapon with die ≤ monster's own `dmgDie`. Quality determined by **1d6**:

```js
const d6  = Math.ceil(Math.random() * 6);
const deg = Math.min(0, d6 - 5);                                    // 1→-4, 2→-3, 3→-2, 4→-1, 5-6→0
const pfx = ['Wrecked ','Rusted ','Chipped ','Worn ','',''][d6 - 1];
return pfx ? {...base, name: pfx + base.name, magicBonus: deg} : base;
```

| d6 | Bonus | Prefix | Probability |
|----|-------|--------|-------------|
| 1 | −4 | Wrecked | 16.7% |
| 2 | −3 | Rusted | 16.7% |
| 3 | −2 | Chipped | 16.7% |
| 4 | −1 | Worn | 16.7% |
| 5–6 | 0 | (base) | 33.3% |

**Invariant:** Monsters never drop +1 or higher. All positive-magic equipment comes exclusively from Yugurt Lake fishing (`LAKE_MAGIC_DB`). A player who fishes gains a permanent gear advantage no amount of combat grinding can replicate.

**Scope:** `_rollMonsterWeaponDrop()` only. Unaffected: Commander Auros drop, Epic Boss drops, chest loot (`storyCollectLoot()`), vendor items.

---

### Gold Drops

Gold looted equals the same reward value as HP healed: `floor(0.1 × AC × maxHP)`. Both scale together with enemy difficulty — tougher enemies heal you more and pay more gold. See **Heal on Kill & Gold Drop** above for the shared table.

---

### Character Levels & XP

XP accumulates across the run. On each victory, `_checkLevelUp()` fires — if XP crossed a threshold, the player levels up immediately. A dedicated level-up modal opens for each level gained; multiple levels are queued and shown in sequence if the player gains more than one level from a single battle.

**XP Thresholds (Levels 1–20):**

> **Source:** `XP_LEVELS`, HTML line 8608. Cumulative XP to reach each level.

| Lv | XP | Lv | XP | Lv | XP | Lv | XP |
|---|---|---|---|---|---|---|---|
| 1 | 0 | 6 | 5,500 | 11 | 27,000 | 16 | 93,000 |
| 2 | 400 | 7 | 8,000 | 12 | 36,000 | 17 | 114,000 |
| 3 | 1,000 | 8 | 11,000 | 13 | 47,000 | 18 | 138,000 |
| 4 | 2,000 | 9 | 15,000 | 14 | 60,000 | 19 | 165,000 |
| 5 | 3,500 | 10 | 20,000 | 15 | 75,000 | 20 | 195,000 |

Cap is 195,000 XP (Level 20). A focused run (~150 battles) should reach Level 15–17.

**Level 21 — ⚠️ PLANNED (plan-archive.md §XIV):** `XP_LEVELS[20]` is undefined. The level check in `_checkLevelUp()` reads `XP_LEVELS[currentLevel]`; at Level 20 this returns `undefined` and the cap holds. Level 21 is architecturally open — extending `XP_LEVELS` with one more entry and adding a new `FIGHTER_FEATURES` row at Lv21 is the minimum to unlock it. See `plan-archive.md §XIV` (World Creator Wizard) for the full extension guide, including shell tooling for safe HTML data structure editing.

---

### Level-Up System (Fighter Champion)

The player is a **Fighter Champion** with a **d10 Hit Die**. Every level-up rolls `d10 + CON modifier` for HP (minimum 1). CON modifier increases from an ASI retroactively add HP for all prior levels.

**ASI Levels:** 4, 6, 8, 12, 14, 16, 19

At ASI levels **the player allocates two points** across the six abilities, one per click, capped at 20 — see `mechanics-combat.md` §Level-Up System. *(This section previously described a d6 roll on a table with zero readers; corrected 2026-08-26, §ASI-01.)*

| d6 | Name | Effect |
|---|---|---|
| 1 | Might | STR +2 → the attack roll's STR modifier increases |
| 2 | Endurance | CON +2 → retroactive HP per level |
| 3 | Agility | DEX +2 |
| 4 | Power | STR +1, CON +1 |
| 5 | Speed | STR +1, DEX +1 |
| 6 | Guard | DEX +1, CON +1 |

STR modifier increases reach the attack roll through `S_story.abilityScores` alone — the `S_story.atkBonus` cache they used to cascade into was deleted by §AUDIT-03ae, which found three readers interpreting it three different ways. CON modifier increases add `conDelta × currentLevel` HP retroactively.

**Non-ASI levels** receive a gold stipend (Royal Recognition) and a magic shield gift at milestones:

| Level | Feature | Gold Gift | Shield Gift |
|---|---|---|---|
| 2 | Action Surge I — ⚡ 1 surgeCharge/short rest | 250gp | — |
| 3 | Improved Critical — crits on 19–20 | 350gp | +1 Shield (+3 AC) via Royal Charter |
| 4 | ASI — player allocates 2 stat points | — | — |
| 5 | Extra Attack I — main fires 2 rolls | 500gp | — |
| 6 | ASI | — | — |
| 7 | Remarkable Athlete — **bonus d10 HP at level-up** | 650gp | — |
| 8 | ASI | — | — |
| 9 | Indomitable I — 1 indomCharge/long rest (death save reroll) | 800gp | — |
| 10 | Fighting Style — **bonus d10 HP at level-up** | 900gp | — |
| 11 | Extra Attack II — main fires 3 rolls | 1,200gp | +2 Shield (+4 AC) via Royal Warrant |
| 12 | ASI | — | — |
| 13 | Indomitable II — **bonus d10 HP at level-up** | 1,400gp | — |
| 14 | ASI | — | — |
| 15 | Superior Critical — crits on 18–20 | 1,600gp | — |
| 16 | ASI | — | — |
| 17 | Action Surge II — surgeCharges pool → **2/short rest** | 1,800gp | — |
| 18 | Survivor — **bonus d10 HP at level-up** | 2,000gp | — |
| 19 | ASI | — | — |
| 20 | Extra Attack III — main fires 4 rolls; crits 17–20 | 2,500gp | — |

Shield gifts are added to inventory and auto-equipped if better than the currently held shield. `hpMax` increases and current HP also increases by the same roll. The status bar shows `⭐ Level N · X/Y XP`.

> **⚠️ Corrected 2026-08-26 (§DX-02y).** This paragraph previously read *"`atkBonus` and `acBonus` in `S_story` are updated immediately."* Neither was true of the level-up path. **Neither field exists any more.** `S_story.acBonus` had no writer at all (§DX-02y). `S_story.atkBonus` was a *cache of the STR modifier* that three readers each interpreted differently, and the STR modifier is now derived from `S_story.abilityScores` wherever it is needed (§AUDIT-03ae). The same sentence in `docs/mechanics/mechanics-combat.md` was corrected on 2026-08-12 by §DOC-02t and this copy was missed; **a claim corrected in one home doc and left standing in its sibling is the §DOC-02 rot direction that costs the most**, because the reader who greps finds the wrong one first.

---

### Luck — The Seventh Stat *(Layer 48 — ✅ Implemented)*

Luck is a read-only derived stat computed from the geometric mean of all six ability scores. It is never stored in `S_story`; it is recalculated on demand from `S_story.abilityScores`.

**Formula:**
```
Luck = ⌈(STR × DEX × CON × INT × WIS × CHA)^(1/6)⌉
```
Integer ceiling. If any score is 0, Luck = 0.

**Implementation:**
```js
function getLuck() {
  const { str, dex, con, int, wis, cha } = S_story.abilityScores;
  const product = str * dex * con * int * wis * cha;
  if (product <= 0) return 0;
  return Math.ceil(Math.pow(product, 1/6));
}
```

**Luck Modifier:** `floor((Luck − 10) / 2)` — identical to all other ability modifiers.

**Default scores** (`_S_DEFAULTS()`: STR:10, DEX:8, CON:8, INT:8, WIS:8, CHA:8):  
`⌈(10×8×8×8×8×8)^(1/6)⌉ = ⌈(327,680)^(1/6)⌉ = ⌈8.31⌉ = 9` → **Luck 9, Luck Mod −1**

**Reference table (sample scores):**

| STR | DEX | CON | INT | WIS | CHA | Luck | Luck Mod |
|-----|-----|-----|-----|-----|-----|------|----------|
| 10 | 10 | 10 | 10 | 10 | 10 | 10 | +0 |
| 16 | 12 | 14 | 10 | 12 | 8 | 12 | +1 |
| 20 | 18 | 20 | 16 | 18 | 14 | 17 | +3 |
| 8 | 8 | 8 | 8 | 8 | 8 | 8 | −1 |

**Application — single call site *(§DROP-02 — ✅ 2026-06-05):***

| Context | Formula | Effect |
|---------|---------|--------|
| Fishing — Type / Rarity roll | `typeTotal = tDie + bait.type + LuckMod + eelBonus` | Shifts catch rarity: common → rare → enchanted → golden → legendary |

Luck's sole mechanical role is improving what you get from a fish catch. All other former uses (bait search DC, d100 combat drops, death saves, encounter rate, tournament tiebreaker) were removed.

**Rarity thresholds** (`_rarityFromRoll`):

| Type total | Rarity | Gold multiplier (vs common) |
|-----------|--------|----------------------------|
| ≤ 5 | Common | 1× |
| ≤ 10 | Rare | ~2.5× |
| ≤ 15 | Enchanted | ~4× |
| ≤ 18 | Golden | ~6× |
| 19+ | Legendary | ~10× |

**UI:** Displayed in character sheet as `🍀 Luck: 12 (Mod: +1)` below the six ability scores. Not shown on the status bar — derived on demand only.

---

### Notoriety (Layer 23)

Notoriety is a persistent scalar that drives enemy scaling across the entire run.

**Formula:** `_notoriety() = level × 3 + floor(battlesWon / 2)`

where `battlesWon` counts all defeated node battles plus open-cell victories.

**Effect on enemy tier weights:**

| Notoriety | Trivial | Easy | Medium | Hard | Deadly |
|---|---|---|---|---|---|
| ≤ 5 | 40% | 35% | 20% | 4% | 1% |
| 6–10 | 20% | 35% | 30% | 12% | 3% |
| 11–20 | 8% | 25% | 35% | 25% | 7% |
| 21–30 | 2% | 15% | 35% | 35% | 13% |
| 31–40 | 1% | 8% | 30% | 40% | 21% |
| 41+ | 0% | 5% | 25% | 40% | 30% |

**Effect on open-cell encounters:** `TERRAIN_ENCOUNTER_RATE[terrain]` sets the base probability (0.10–0.35 depending on terrain). Empty cells in jungle, swamp, and hag_swamp are most dangerous; roads and junctions are safe (0%). Notoriety weights the tier of whatever monster is picked from the terrain pool.

As notoriety climbs, open-cell encounters skew toward harder-tier enemies. High-notoriety runs in dangerous terrain demand consumable spending and careful route planning.

---

### Short Rests

Each inn sleep resets **3 short rest charges**. Click the **🛌 Rest** button (SW corner of d-pad) or the 🌙 SHORT REST chip. Each charge heals **25% of max HP** (non-inn locations double this = 50% — Boy Scouts Award).

- Short rests reset to 3 on each inn sleep (long rest)
- The status bar and chip show `N/3` remaining
- **Action Surge** charges (`S_story.surgeCharges`) also restore on each short rest

**Necklace Token (Boyscout mechanic):**
- Tracked in `S_story.shortRestedAtNodes: {}`
- The **first** short rest at any location earns a **🏕 Necklace Token** (`type:'token'`) added to inventory
- Message: "🏕 Necklace Token earned! Sleep here tonight for double heal rolls."
- Tokens are permanent collectibles — unsellable, unequippable

**Auto-quest to inn when exhausted:**
- If `shortRests <= 0` and the player clicks Rest: BFS from current node to nearest `sleep:true` node → set `S_story.waypoint` → log a navigation message
- Clicking Waypoint will auto-route to the nearest inn to rest

### Long Rest (Sleep)

Sleep (🛏 chip at inn nodes) performs a long rest with dice-based HP recovery:

| Condition | Heal Roll | Minimum |
|---|---|---|
| **First sleep** at this node (Boyscout Night) | **2×d10 + CON mod** | 50% hpMax |
| **Revisited** node | **1×d10 + CON mod** | 50% hpMax |

The sleep preview (`storySleep()`) shows the estimated average and mode (Boyscout or Normal).

Long rest also:
- Advances day by 1 (cap: Day 49)
- Resets `shortRests = 3`
- Resets `surgeCharges` (1 at Lv2–16; 2 at Lv17+)
- Resets `indomitableCharges` (1 at Lv9+)
- Saves checkpoint via `coc_checkpoint`

---

### Combat Items

#### Shields

Shields are bought at vendor nodes and equipped from inventory as a **bonus action** during battle (🛡 Equip). They add their `acBonus` to AC via `_calcPlayerAc()` for the duration of combat. The offhand slot must be free — equipping a shield displaces any dagger equipped there to inventory.

| Shield | AC Bonus | Buy | Sell | Requires |
|---|---|---|---|---|
| 🛡 Small Shield | +1 AC | 50gp | 30gp | Lv1 |
| 🛡 Kite Shield | +2 AC | 150gp | 90gp | Lv1 |
| ✨ Magic Shield | +3 AC | 600gp | 300gp | Lv3 (Royal Charter) |
| 🔰 Large Magic Shield | +4 AC | 1,500gp | 750gp | Lv11 (Royal Warrant) |
| 🛡 Legendary Shield | +5 AC | 3,000gp | 1,500gp | Lv15 (Duke's Seal) — planned |
| 🛡 Ancient Shield | +6 AC | 6,000gp | 3,000gp | Lv20 (King's Decree) — planned |

Click **⊘ Unequip** to remove (costs the bonus action). AC resets to base at battle start — equipping a new shield each fight is normal.

#### Flashbang

The **Flashbang** (💥) is a single-use guaranteed ADV tool.

| Item | Buy | Sell | Effect |
|---|---|---|---|
| 💥 Flashbang | 150gp | 75gp | ADV on your next attack this round — no DC, no fail |

- Costs a **bonus action** (0.5 AP) — does not replace your main attack
- No offhand interaction — Flashbang is the bonus action, not an attack
- Use case: open a tough fight with ADV without risking a stealth roll fail
- Available at vendor nodes (BA, MQ, SF, IS, BK)

---

### Equipment Slots

The player has two equipment slots:

**Main Hand** — holds a main weapon from `WEAPON_ITEMS`. When equipped, overrides the character's default `S.weapon.die` and `S.weapon.count` at battle start. Provides `magicBonus` to both attack and damage rolls.

**Offhand** — holds either a dagger or a shield. The two are **mutually exclusive**: equipping one automatically displaces the other to inventory.

- **Dagger offhand:** adds `atkBonus` to all attack rolls (main and offhand). Does not add to damage.
- **Shield offhand:** adds `acBonus` to player AC via `_calcPlayerAc()`.

Equipment persists across all battles. Vendor auto-sell removes inferior or duplicate equipment from inventory when you enter a vendor node — the game keeps the best tier in each category.

**Attack roll formula (combined):**

```
total = d20 + STR modifier (from S_story.abilityScores)
             + proficiencyBonus
             + equippedWeapon.atkBonus (dagger offhand)
             + equippedMainWeapon.magicBonus (main weapon)
```

---

### Main Hand Weapons (WEAPON_ITEMS)

70 entries: 14 base weapon types × 5 magic tiers (base, +1, +2, +3, +4) — `[0,1,2,3,4].flatMap(...)` over `_BASE_WEAPONS` (`const _BASE_WEAPONS@24527`).

**14 base types (die size ascending):** Pointy Stick d4 Lv1, Sickle d4 Lv1, Axe d6 Lv1, Bow d6 Lv2, Scimitar d6 Lv2, Flail d8 Lv3, Long Sword d8 Lv3, Morningstar d8 Lv4, Rapier d8 Lv4, Crossbow d10 Lv5, Glaive d10 Lv5, Halberd d10 Lv6, Maul 2d6 Lv7, Lance d12 Lv8.

**Magic-tier level gate:** `_magicTierAllowed(magic)` (`function _magicTierAllowed@24567`) = player `level ≥ magic × 5` — so **+1 → Lv5, +2 → Lv10, +3 → Lv15, +4 → Lv20** (note: no `baseLv` term in the gate). Each item also carries a per-entry `minLevel = min(20, max(magic × 5, baseLv + magic × 4))` used for display/sort.

**Acquisition (§FC06 nerf — fishing-exclusive positive magic):** only the **base tier (magicBonus 0)** drops from combat, via the one-guaranteed `_rollMonsterWeaponDrop()` (d6 quality −4..0; see §Equipment Drops). The +1..+4 tiers **no longer drop from any kill** — the old `_rollMainWeaponDrop()` 15%/battle path is **deleted** and the d100 table is consumables-only. Positive-magic weapons reach the player only via **Yugurt Lake fishing** (`LAKE_MAGIC_DB`) and **hand-authored quest / Epic-Boss rewards**. The +N `WEAPON_ITEMS` pool stays defined for save reconstruction + future authored grants, but nothing random rolls it.

---

### Dagger Drops (DAGGER_ITEMS)

Daggers are offhand weapons; they are not sold at vendor nodes.

| Dagger | ATK Bonus | Min Level | Sell |
|---|---|---|---|
| 🗡 +1 Royal Dagger | +1 | Lv3 | 150gp |
| 🗡 +2 Painite Dagger | +2 | Lv7 | 450gp |
| 🗡 +3 Gaping Dagger | +3 | Lv13 | 1,250gp |
| 🗡 +4 Voidsteel Dagger | +4 | Lv20 | — (planned) |

**Acquisition (§FC06 nerf):** these magic daggers **no longer drop from combat** — the old `_rollWeaponDrop()` 12%/battle path is **deleted** and the d100 table is consumables-only. As positive-magic gear they are fishing-exclusive by policy; the generic `DAGGER_ITEMS` pool is granted only by any hand-authored quest reward that references it (no random vector). The `atkBonus` adds to every attack roll when a dagger is equipped in the offhand slot.

---

### Starting Kit (New Game)

Every new game begins at City Streets — Birka (LHR) with:

| Slot | Item | Stats | Notes |
|---|---|---|---|
| Main Hand (equipped) | 🪵 Pointy Stick | 1d4, no magic bonus | STARTER_POINTY_STICK; set in storyNewGame() |
| Offhand (equipped) | 🗡 Flint Dagger | atkBonus: −3 | STARTER_FLINT_DAGGER; crude stone blade |
| Inventory | 🗡 Rusted Dagger | type:'item' | Fallback; no atkBonus |
| Inventory | 🧪 Minor Healing Potion × 2 | heal 10 HP | First-fight healing |
| Gold | 150gp | — | Covers first inn (5gp) + early purchases |

**Starting attack bonus at Level 1:** STR +3 (score 16) + Prof +2 + Flint Dagger −3 = **+2 to hit**. Deliberately weak — the crude flint dagger makes early fights challenging and rewards upgrading to a better offhand.

The start node is **`LHR`** ("City Streets — Birka", `num:1`, `LHR:{ num:1@8439`) — set by `storyNewGame() → storyRender(NODE_MAP['LHR'])`; `checkpointNode` also defaults to `LHR`. *(Note: the neighbouring-node codes below — the City Fence vendor, the inn, and the NPC codes in §Story Mode — are pre-§WALK legacy codes and still need a dedicated remap pass; only the `LHR` start node is code-verified here.)*

---

### Defeat Screens

Two distinct defeat conditions exist beyond combat death:

#### Time-Limit Defeat — ⌛ The Seventh Moon Has Risen
- Triggers when the player attempts to **sleep on Day 49** (day cap reached)
- The sleep overlay immediately shows the defeat screen instead of confirming rest
- Narrative: the player chose rest; the Void sealed its breach at dawn
- **No respawn.** Only New Game available.

#### Void Pressure Defeat — ☠ The Void Has Breached
- Triggers when `voidPressure` reaches **10**
- Void pressure accumulates from: 7 Void Tide events (days 3/7/14/21/28/35/42) + 1 per exhaustion cycle (each time 2 inns are skipped without sleeping)
- Maximum from tide events alone: 7. Three exhaustion penalties push it to 10.
- **No respawn.** Only New Game available.

Both defeat screens show a full **run summary**: level reached, XP earned, day reached, shards collected, gold at defeat, battles won.

#### Combat Death — ☠ You Have Fallen
- HP drops to 0 during battle → game over modal fires
- **Respawn available** at last checkpoint (inn slept at), at half max HP
- Checkpoint saves on every inn sleep via `coc_checkpoint`

#### The Corpse-Run — Death, Loot & the Grave (§DEATH-01)
When you fail your death saves in a Story Battle (`_storyDeathSaveFall`), a lighter loss than the
game-over path fires — you keep playing, but your body is left where you fell:

- **What actually drops:** your **loose bagged items + 100% of your gold** are bagged into a
  *corpse* at the death node (`S_story.corpsesQuests`, persisted). **Codex Shards and gate keys are
  protected** (never drop). **Your equipped gear survives** — the main weapon, off-hand, and shield
  live outside `inventory` and are untouched by death. You respawn at your `checkpointNode` (set by
  sleeping at any `sleep:true` node; default Birka/LHR) at **1 HP**.
- **The message tells the truth** (§DEATH-01 Inc A): it names what the body holds, states that your
  equipped gear (and shards) stayed with you, and names where you woke — no false "a rusted dagger
  is all you carry."
- **The signal** (Inc B): a persistent **🦴 corpse chip** in the location card names where your
  body is ("🦴 1 body at Rzhev"); clicking it opens the Map (a read-only view aid — **no warp**;
  `checkpointNode` respawn is the only warp, §CELL-13). When the grave node is on-screen in the
  Local map it also shows a 🦴 marker. You reclaim a body by returning to the node and pressing
  **🦴 Remains → Retrieve** (or via the journal's ☠ Fallen Hero list).
- **NG+ safety** (Inc C): New Game+ resets `corpsesQuests`. If you begin NG+ with an **unrecovered**
  corpse, the game **warns and asks for confirmation** first (naming the items + gold at stake); a
  decline aborts NG+ so nothing is lost silently.
- **Atomicity:** the death + corpse persist the instant they happen — `_storyDeathSaveFall` ends in
  `storyRender()`, whose terminal `storyAutoSave()` writes the state synchronously (no save-scum gap).

A permanent **death tattoo** (day/hour/node + `corpseQuestId`) records every fall.

---

### Save System

All state is persisted via `localStorage`. There is no server component.

| Key | Written by | Read by | Content |
|-----|-----------|---------|---------|
| `coc_autosave` | `storyAutoSave()` | `storyCheckContinue()` | Full `S_story` JSON snapshot; written on every move, battle end, level-up, and purchase |
| `coc_checkpoint` | `storySaveCheckpoint()` | `storyLoadSave('coc_checkpoint')` | Full `S_story` JSON snapshot; written only on inn sleep (long rest) |

**Continue flow**: On page load, `storyCheckContinue()` reads `coc_autosave`. If the save exists and `hp > 0`, the player is offered a **Continue** button that calls `storyLoadSave('coc_autosave')`.

**Respawn flow**: On combat death (`hp === 0`), the respawn option calls `storyLoadSave('coc_checkpoint')`, restoring the player to their last inn sleep at half max HP.

**New Game / Wipe**: Both the Wipe Void Defeat screen and the explicit New Game path call `localStorage.removeItem('coc_autosave')` and `localStorage.removeItem('coc_checkpoint')` before resetting `S_story` to `_S_DEFAULTS()`.

**Format**: `JSON.stringify(S_story)` — a flat serialization of the entire `_S_DEFAULTS()` shape. No versioning field; forward compatibility relies on `Object.assign` merge (missing keys get default values from the running `_S_DEFAULTS()` call).

---

### Monster Trophy Drops

Every monster in MONSTER_POOL has an entry in `MONSTER_DROPS`:

| Category | Drop Type | Icon | Sell Range |
|---|---|---|---|
| Beasts (wolf, bear, etc.) | Fangs, Claws, Pelts | 🦷 🐾 🪶 | 6–45gp |
| Humanoids (thug, knight, etc.) | Their weapon | 🗡 ⚔ 🪓 | 5–50gp |
| Undead (skeleton, lich, etc.) | Bone, Dust, Essence | 🦴 💀 | 4–80gp |
| Constructs (golem, android, etc.) | Cores, Gears, Chips | ⚙ 💡 | 8–75gp |
| Dragons | Scales, Teeth | 🐉 🦷 | 45–150gp |
| Aquatic | Scales, Pearls, Ink | 🐚 🦑 | 6–100gp |
| Dark lore creatures (leshen, drowner, etc.) | Creature parts | 🧪 🌿 | 4–45gp |
| Fiends (imp, succubus, etc.) | Ichor, Horns, Hearts | 💜 🩸 | 8–35gp |

Drops with `sell > 0` are **trophies** — sellable at vendor nodes.

---

### Readable Items

A `type:'readable'` item has a **[READ]** button in the inventory panel that opens a text overlay. It cannot be sold, equipped, or consumed. It persists in inventory for the entire run.

Currently one readable item exists in the game (PLANNED — Layer 47):

**📖 Fishing Guide** — obtained from the Outsider Merchant at YC (Yugurt Cabin) during quest Q-BAIT-00 *"Listen Closely."* The merchant recited its contents from memory; the physical pamphlet is what he hands over at the end.

- **[READ]** opens the in-world guide: zone table (Shore/Reeds/Deep), bait tier reference, predator condition summary, drop formula, and the line *"The lake knows the difference."*
- **Mechanical effect:** While the Fishing Guide is in inventory, zone DCs are displayed in the fishing modal (`Shore DC 8 · Reeds DC 12 · Deep DC 16`). Without it, DCs show as `DC: ???`
- Not sellable. Not consumable. Not transferable. The pages are worn; some margins are underlined twice.

---

### **[PLANNED — Layer 47]** Fishing Items

Three items are exclusive to the Yugurt Lake fishing sub-game. None can be used outside `isFishingLake:true` nodes.

**🎣 Fishing Rod** *(already implemented, Layer 37)*  
Obtained from The Fisherman at YC (free, no gold cost). Required to trigger `storyFishing()` at YL. Without it, the fishing chip at YL shows: *"You need a Fishing Rod. The Fisherman at YC has one."* Not sellable. Not equippable in combat slots.

When the Fishing Rod is in inventory and a fish battle begins, `_startFishBattle()` injects a special condition into the pre-battle screen:

| Condition | Source | Effect | Cost |
|-----------|--------|--------|------|
| 🎣 **Hooked** | Fishing Rod (auto-injected) | ADV on all attacks — fish is on your line | Free |

Hooked is not in `CONDITION_ITEMS`. It is unshifted directly into `_availableConds` at pre-battle setup when `hasRod === true`. It costs no gold. It is the mechanical representation of having already set the hook before the fight begins — the fish cannot escape, so the player attacks with advantage. Selecting it is optional but costs nothing.

**📖 Fishing Guide** *(PLANNED — Layer 47)*  
See Readable Items above.

**🎒 Tackle Box** *(PLANNED — Layer 47)*  
Not a physical inventory item — it is a sub-system stored in `S_story.tacklebox{}`. Displays in the fishing modal as a scrollable list of bait fish stacks. Bait fish are consumed one-per-cast when predator fishing. The selected bait is shown as the equipped bait slot (mirrors the arrow/quiver pattern).

| State field | Type | Default | Purpose |
|-------------|------|---------|---------|
| `equippedBait` | object\|null | null | Currently equipped bait: `{ key, name, icon, tier, bonus, count }` |
| `tacklebox` | object | `{}` | All bait stocks: `{ [slug]: count }` |
| `tackleboxZoneUnlocks` | object | `{ shore:true, reeds:false, deep:false }` | Which fishing zones are accessible |
| `fishingCatchLog` | array | `[]` | Last 20 catches for quest validation |
| `baitFishingActive` | bool | false | Suppresses node re-render during bait catch |

Bare Hook fallback: if `equippedBait === null` and `tacklebox` is empty, predator fishing proceeds with no bait bonus (−3 Catch Roll, Luck Mod only on Type Roll).

---

---

## Story Mode

### Cell Movement (§CELL-03)

Navigation is **cell-based**: pressing N/E/S/W moves the player exactly one grid cell `(r±1, c)` or `(r, c±1)` per keypress. `cellMove(dir)` is a thin caller over the shared `mover.js` kernel (§WALK-2), which decides band bounds (`0≤r<90`), E/W wrap at the antimeridian, and sea blocking. A step is refused for exactly two reasons — `'oob'` and `'sea'`. **No gate locks, no quest checks** (Free-Movement Policy, CONTRIBUTING.md).

**Node entry:** If the destination cell has an entry in `CELL_GRID`, the player enters that named node and `storyRender(node)` fires (quests, encounters, NPC dialogue, loot). If the destination cell is empty, `_enterEmptyCell(r, c)` fires — since §NAV-01c it renders a full MUD room (see next section).

**Encounters:** Stepping into an empty cell makes a single encounter roll against the terrain's `TERRAIN_ENCOUNTER_RATE` inside `_enterEmptyCell` — on hit, `_weightedMonsterPick(terrain)` starts a "Wild …" battle. **Road cells roll at rate 0** — highways are safe. Movement itself is timeless (no clock advance). Named-node entry does not roll an open-cell encounter; it runs the node's own `storyRender` battle/quest logic. **Hunt Mode** (§KG-01, d-pad center toggle, `S_story.huntMode`) doubles the wilderness rate and biases `_weightedMonsterPick` toward monsters at/below the player's `_monsterLevel` — the on-ramp grind path (roads stay 0 since 2·0=0).

**Kill counters:** Every battle win increments a generic `S_story.monsterKills[S.enemy.key]` counter (battle-win handler; seeded `{}` in `_S_DEFAULTS`) — the reusable per-monster tally any arc can read via a quest's `completion.countMin:[{path:'monsterKills.<key>', min:N}]` and surface in the kill-goals HUD chip with `killCounter:'monsterKills'`. The older `catKills` counter (Cat Quarter) is unchanged; `monsterKills` is the superset going forward (first consumer: the §KG Inc-3 cull/duel quests). Heal-consumable quest rewards ride the itemChain `grant` allow-list (`heal` added §KG Inc 3, kept in lockstep across `_applyItemChain` / worldbuilder `GRANT_RICH` / `check-itemchain.js`).

**Exits:** Exits from a node are derived at runtime from `CELL_GRID` adjacency — whichever of the four cardinal neighbors is occupied. They are **not stored** on the node object. `PUT /api/node/:code` rejects `N/E/S/W` field submissions; change a node's connections by moving it with `PUT /api/coords/:code`.

There is no corridor dialog, no Manhattan-distance gating, and no "Hunt/Warp" overlay. The corridor travel system was removed in §CELL-05.

---

### Roads, Rooms & Auto-Travel (§NAV-01, ✅ 2026-07-03)

> Design + diagnosis: `docs/lab-reports/lab-report-nav01-navigable-world.md` · layer stack: `docs/notes/docs-node-network.md §13` · map surfaces: `maps.md` "ROAD NET & ROOM LAYER".

**Roads (what the player experiences):** a fungal highway net (400 road cells, 88 intersections/T-junctions) connects every settlement. Road cells are terrain `'road'` — **encounter rate 0** — so following the road is the safe way to cross the wilderness; striking out overland is always allowed but rolls the local terrain's encounter rate (0.10–0.35). Sea-lane crossings stay `ocean` at 0.10 — boats are never free. Roads are pure terrain: they never gate movement, and the open field stays fully walkable.

**Rooms:** every empty cell renders as a MUD room via `describeCell` — deterministic terrain prose (no RNG; same text every visit, and byte-identical on the MUD server), a region-name title instead of raw coordinates, 🪧 signposts on road cells naming the next settlement in each road direction, and a nearest-landmarks line (BFS radius 12).

**Auto-travel:** set a waypoint (map click or quest "📍 Navigate →") and press **WP** — the player walks the road-weighted route automatically (~120 ms/step; road/lane cost 1 vs open land 2, so routes hug the highways). Travel halts on: an encounter roll, arrival, **any input**, or a blocked step. **Shift+WP** = single step. The journal and Navigate button show `(n steps, NE)`; a waypoint ★ marks the destination on the minimap and world canvases (edge-of-window arrow when off-screen).

**Authoring:** edit.html drags & locks cities (`PUT /api/coords`, 🔒 → `roads-pins.json`) and edits the net itself — pins, ✚/┬ junction palette, 🔗 links, ♻ Reweave Net (`PUT /api/roads`, auto-rollback on a red `check:roads`). Never hand-edit `ROAD_RUNS`.

---

### Vendor System

**Available at nodes**: BA (City Fence), MQ (Vendor Mira), SF (Proprietor Dusk), IS (Oracle's Apprentice), BK (Warlord Mordus)

Click the **🛒 VENDOR** chip at any of these nodes.

#### Pachelbel's Special Stock (BA — `_renderPachelbelSpecials()`)

The BA vendor has fav-gated and act-gated items rendered by `_renderPachelbelSpecials()` (separate from the standard vendor overlay). These only appear at the BA node.

**S51 — Act-gated stock** (available regardless of favorability, based on `S_story.actNumber`):

| Item | Cost | Sell | Unlocks | Flag | Description |
|------|------|------|---------|------|-------------|
| 📦 North Road Goods | 20gp | 15gp | Act 3+ | `s51NorthRoadBought` | "Came in on the north road. No name on the seller." |
| 📄 Courier's Manifold | 35gp | 22gp | Act 5+ | `s51ManifoldBought` | "Something became available when it stopped being needed. Ask him what that means." |
| 🔒 Last Stock (Sealed) | 55gp | 40gp | Act 6+ | `s51LastStockBought` | "His back inventory. He says: 'I don't know what's in it. That's the price.'" |

Each item appears once (purchased = flag set = item removed from display). "Pachelbel completes the transaction without commentary."

**S46 — Dear Friend stock** (fav ≥ 2):

| Item | Cost | Sell | Condition | Description |
|------|------|------|-----------|-------------|
| 🔧 Raison's Tools | 50gp | 0 (no sell) | Once; appears until used | "A certified salvager's toolkit. Identifies and documents item provenance. No questions asked about how you found things." |

When purchased: "Pachelbel slides it across without a word. The toolkit is well-maintained. Someone took care of it before you."

**Friendly stock** (fav ≥ 1) — rotating by `gameDay` cycle, one item at a time:

| Item | Cost | Sell | Description |
|------|------|------|-------------|
| 🗝 Lockpick Set | 8gp | 12gp | "A standard set. No questions about the doors." |
| 🗺 Wayfarer's Map | 10gp | 8gp | "Route markings someone else made. Useful if you trust them." |
| 📋 Courier's Seal | 12gp | 10gp | "A recent settlement document. Moves through checkpoints without inspection." |

#### Selling Trophies
- The vendor overlay shows all sellable trophies in your inventory with their gp values.
- **Sell All Trophies** sells everything at once, adding the gold to your total.
- Vendors also accept inferior or duplicate weapons and shields (the game keeps the best tier you own).
- Vendors **do not buy**: potions, quest items, spell scrolls, flashbangs, or knowledge beads.

#### Buying Potions

| Potion | Cost | Heals | Best For |
|---|---|---|---|
| 🧪 Minor Healing Potion | 50gp | 10 HP | Level 1–4 (HP ~10–40) |
| 🫧 Healing Potion | 150gp | 25 HP | Level 5–9 (HP ~40–70) |
| 💜 Greater Healing Potion | 400gp | 50 HP | Level 10–14 (HP ~70–120) |
| ✨ Superior Healing Potion | 1,000gp | 100 HP | Level 15–20 (HP ~120–250) |

Costs scale exponentially (~3× per tier) to match the exponential growth of expected character HP across tiers of play:
- **Tier 1** (Lv 1–4): ~1d8+1 per level → 8–40 HP → Minor Potion covers a meaningful chunk
- **Tier 2** (Lv 5–10): ~48–70 HP → Healing Potion covers ~35%
- **Tier 3** (Lv 11–16): ~75–130 HP → Greater covers ~40–65%
- **Tier 4** (Lv 17–20): ~130–250 HP → Superior covers ~40–75%

Potions are stored in inventory. Use the **🍺 Drink** button in the Inventory overlay to consume one at any time.

### Hearth Home & Transmort Scroll — ❌ REMOVED (§CELL-13, re-applied 2026-07-03)

Jump travel does not exist. The Transmort Scroll (vendor item + inventory Use teleport), the Hearth Home system (`storySetHearthHome`, `hearthHome` state, 🔥 Set-as-Home inn chip), and `storyPortal` were removed per §CELL-13; the removal had been partially reverted by a snapshot rollback and was **re-applied 2026-07-03** (verified: all three grep to 0 live references; walk suites green). All travel is `cellMove` one cell at a time — auto-travel (§NAV-01) *walks* the route, it never teleports. `checkpointNode` (death respawn) is the only warp in the game. Transmort Scrolls in old saves become inert quest items (no Use button).

---

### Healing Potions (Detailed)

#### Design Philosophy
Potions are exponentially priced to match exponential HP scaling. A low-level character with 12 HP values 10 HP of healing far more than a high-level character with 220 HP. The Minor Potion at 50gp is affordable at Act 1 gold levels; the Superior Potion at 1,000gp requires late-game economy.

#### HP Scaling Reference (Fighter Champion, CON 14 → +2 mod)

| Level | Approx HP | Recommended Potion | Heals % |
|---|---|---|---|
| 1 | 12 | Minor (10 HP) | 83% |
| 5 | 48 | Healing (25 HP) | 52% |
| 10 | 88 | Greater (50 HP) | 57% |
| 15 | 128 | Superior (100 HP) | 78% |
| 18 | 152 | Superior (100 HP) | 66% |
| 20 | 168 | Superior (100 HP) | 60% |

Story Mode HP (`S_story.hp`) starts at 30 and is tracked separately from Battle Mode HP. Potions consumed in Story Mode restore `S_story.hp`, used before/after battles.

#### Stack vs. Single Use
Potions do not stack effects — each is one item, one use. Buy multiples to carry multiple uses.

---

### Sidequests: Battling & Leveling

#### sq_battling — Earn Your Reputation
- **Activates**: At Birka (LHR) — first time you enter Story Mode
- **Objective**: Collect weapon drops from 3 combat victories
- **Tracked by**: `S_story.dropsCollected >= 3`
- **Flavor**: The fence at the Rough Bar will buy anything. Reputation is currency.

#### sq_leveling — The Spoils of War
- **Activates**: At Birka (LHR) — alongside Battling
- **Objective**: Win 5 story battles (via Victory outcome)
- **Tracked by**: `Object.keys(S_story.defeatedBattles).length >= 5`
- **Flavor**: Five fights means you've survived enough to be dangerous.

---

### Final Boss — Commander Auros ✅

**High Commander Seraphine Bruhns / Auros** — accessible at **`TLS`** (Cosmic Realm; historical `CO`) when the node's **`finalBattle` thresholds** are met: `TLS` authors `finalBattle:{minLevel:20, minShards:7}` in `NODE_MAP` (§VM-01-G-FU-f2 — the §VM-01-G3 `onActivate` precedent: per-node data driving an engine seam), read by the single helper `` `function _finalBattleReady@28139` ``. That helper is the ONE copy of what used to be three hand-copied `=== 'TLS' && level ≥ 20 && shards ≥ 7` predicates (the encounter card + both quest-list Fight buttons); a node without the field is never final. The stat block is loaded from `BOSS_COMMANDER_AUROS`.

| Stat | Value |
|---|---|
| AC | 22 |
| HP | 300 |
| ATK | +12 |
| DMG | 3d8+6 |
| Tier | Deadly |

Defeating Auros triggers `storyCheckVictory()` which fires the Covenant Ceremony, builds the epilogue scroll, and shows the final victory modal. The ending variant is determined by `_curseScore()`.

---

## NPC Favorability System (Layers 41–42)

Six named Birka NPCs each have a favorability state tracked in `S_story.npcFavorability`:

| Level | Value | Unlocks |
|---|---|---|
| Impartial | 0 | Default state; neutral dialogue pool |
| Friendly | 1 | A quest `{kind:'favor'}` grant **or** the **Talk** action (§NPC-01-D); unlocks the ⚔ enemy card footer |
| Dear Friend | 2 | A quest/personal-act grant (never Talk); unlocks the ✦ worldTruth card footer |
| Dear Friend+ | 3 | Second-act content; post-NG+ or post-Act IV |

**Talk verb (§NPC-01-D).** Every card-bearing NPC (~203 after §NPC-01-B/SF6) carries a **💬 Talk** button on its card while Impartial. Talking accumulates `S_story.npcTalk[key] = {count, lastDay}`; **`TALK_TO_FRIENDLY` (=3) talks on distinct game-days** call `_setNpcFavor(key, 1)` → Friendly. It is rate-limited to **once per game-day per NPC** (no day is spent — cost model B; the cost is the days that pass as you travel/rest near them) and **never raises favor above 1**, so Friendly (and the ⚔ enemy footer) becomes talk-reachable at scale while **Dear Friend (the ✦ worldTruth footer) stays quest/personal-act earned** — preserving the §NPC-01-C reveal. Talking is a card action, not a movement step (Free-Movement untouched). *Intended ripple:* the two `favorMin:{brynn:1}` / `favorMin:{yael:1}` side quests (`quest_brynn_firewood`, `quest_city_watch_patrol`) become listable by befriending those NPCs, and talk-earned friends count toward `_lubeckFriends()`.

**The six curated Birka NPCs:** Yael (CI), Brynn (IN), Quill/Couperin (TV), Pachelbel/Deacon (BA), Weckmann (CY), Auros/Bruhns (CY) — the original rich-profile set; §NPC-01 widened the *card render* (and now Talk-earnable favor) to ~203 NPCs.

Each NPC has 5 dialogue quotes per state in `NPC_DIALOGUES`, cycled by visit count. `_getNPCDialogue(npcKey)` runs a priority chain:
1. Debt degradation check (Rough Whiskey debt)
2. Act III weight injection (one-time at Friendly+)
3. Froberger trace (`FROBERGER_TRACES` — one-time NPC memory of Froberger)
4. NPC cross-reference (`NPC_CROSS_REFS` — every 3rd visit)
5. Room 6 trigger (CY node, fav ≥ 1)
6. S29: Auros/Froberger theory line (bruhns, fav ≥ 2, Entry 41 found)
7. Normal pool: `NPC_DIALOGUES[key][state][visitCount % 5]`

**NPC farewell lines** (`NPC_FAREWELLS`) appear when leaving a node where a Friendly+ NPC lives.

**Rough Whiskey** (sold at BA vendor) — giving it to Brynn triggers a one-time drunk pit fight scene at CY. Tracked via `S_story.roughWhiskeyUsed`.

---

## Epic Battlegrounds (Layer 39)

20 dead-end nodes accessible from their parent terrain node. Each has a named boss from `EPIC_BOSS_POOL` (all Deadly tier) and a quest-giver NPC from `EB_NPC_DIALOGUE`.

**EB quest flow:**
1. Visit parent node → quest-giver NPC card appears → payment negotiation modal
2. Player accepts quest → waypoint set to EB node
3. Travel to EB → `DANGER: EPIC` pre-battle overlay → fight boss
4. Victory → auto-waypoint back to parent → return quest activates
5. Speak to NPC at parent → receive gold + optional `EB_STORY_ITEMS` reward

**Payment negotiation:** Opening offer vs ceiling offer. Player can negotiate up (no CHA check — narrative only). Accepted amount stored in `S_story.ebNegotiatedPayments[ebCode]`.

**`_curseScore()` impact:** Each EB quest abandoned (started but not returned) adds +2 to curse score. Never-started adds +1. Returns subtract -1. High curse scores shift Sweelinck's dialogue and ending variant.

---

## New Game+ (Layer 43)

After completing the game, `storyNewGamePlus()` starts a new run with:
- `npcFavorability` preserved at all current levels
- `pitPerks` preserved
- `ngPlusRun` counter incremented
- All other state reset

On NG+ runs, the EB nodes show one-time atmospheric `EB_NG_PLUS_LINES` on first revisit. The EB nodes "remember" the player has been there. At LHR (Birka) on NG+ start, "Sweelinck is waiting." overlay fires.

---

## Multiplayer — Mesh Presence (§MESH-01, ✅ Incs a–e shipped 2026-07-02 · §MESH-02 connection center 2026-07-07)

CodexOfConquest is single-player-first: multiplayer is a strictly **opt-in presence layer** on top of the unchanged solo game. Full design: `docs/lab-reports/lab-report-mesh-multiuser.md` (spec) and `docs/lab-reports/lab-report-mesh-sync-architecture.md` (architecture write-up); connection-center UI: `docs/lab-reports/lab-report-mesh02-connections-ui.md`; server/API detail: `docs/notes/docs-node-network.md §12`; map surfaces: `maps.md`.

### What the player experiences

- **🌐 opt-in toggle** in Story Mode. Nothing multiplayer runs — no network key exists in the tab — until it is clicked. The single HTML file stays fully playable offline.
- **"Also here:" strip** under the move message lists players co-present on your cell (local and remote-server alike); **☺ dots** on the minimap and **cyan dots** on the WORLD map / GLOBE panels track everyone worldwide in real time (`player_moved` SSE).
- **Chat**: `say` reaches players on your cell — exactly once, including across servers. The map pane's **📍 Local / 🌍 World toggle is both the view *and* the send channel** (§MP-CHAT-GLOBAL): 📍 Local is proximity chat (your cell); 🌍 World reaches **every connected player live**, here and across the mesh (like the worldwide `player_moved` presence event), and shows a 🌍 badge. World lines carry no cell coords, so they appear only in the World view, never a cell's proximity backlog. On connect/resume you also get "🕰 Earlier here:" — the last ~10 lines said at your cell before you joined (§MESH-01-FU 13), so you land mid-conversation instead of in silence. The **💬 toggle** in the mp-bar opens the full chat history panel (§MESH-02h): a persistent, timestamped log (cap 200, survives reloads) fed by live SSE, per-cell backlogs, and a global history fetch under one dedupe — cross-server lines carry an `@origin8` tag; an unread badge counts what you haven't opened.
- **Footprints (§MESH-02j)**: every step stamps the arrival cell server-side (≤8 per cell, 30-min TTL). Arriving somewhere a player recently passed announces "👣 *Name* passed through here N min ago" — once per cell, self and co-present players excluded (prints are who you *missed*). Display-only; local-server only for now.
- **Auto-reconnect**: reloading the page resumes the same session (sessionStorage id probed via the `pos` beacon); a dead id falls back to a fresh connect under the same tab opt-in.
- **Server browser / magnet links**: Shift+🌐 (or a failed connect) opens the browser — paste an `coc:?…` magnet, a tracker URL, or a server URL; rows show server name, 🌍 world tag, player count, ping, and a ⚠ build-mismatch flag. The same resolver also powers the map tab's Connect and Discover panes (below).
- **Same display name never misattributes**: every presence surface is keyed by `pid` (`<serverId8>:<sessionId8>`), so two "Bob"s stay distinct (an `@server` suffix renders only on a name collision).

### Map sub-tabs (§MP-MAPTABS — Local · World · Full)

The Map sheet's map view is split into three sub-tabs, all **click-to-travel** (click any reachable tile → adjacent = one instant step, farther = auto-travel the road-weighted route there, halting on encounter/block/battle/input — pure `cellMove` steps, the mover is never gated, Free-Movement). Display-only.

- **🗺 Local** — the navigable 15×21 window centered on you. Cells scale to fill the pane **width** (big + legible, ~45px, clamp 24–88px via `--mcpx`, ResizeObserver-refit) and scroll vertically auto-centered on the player. The day/shards/HP/gold footer + Location History log were removed (they live in the story HUD); the hover/info line is black-on-tan for contrast.
- **🌍 World** — a player-centered regional overview (61×41 crop) drawn on a responsive canvas (`_paintWorldWindow`): terrain, roads, settlements (cream), remote travelers (cyan), waypoint (gold), you (red).
- **🛰 Full** — the entire world (rows 0–89 × cols 140–255) on a responsive canvas (`_paintFullWorld`), with the World-panel + Local-map viewport rectangles traced.

Pathfinding: `_roadGridPathCore(startCoord,endCoord)` is the shared BFS; `_roadGridPath` targets a node code, `_cellRoute`/`_cellGridDir` target a raw `{r,c}` cell. Click-travel (`_navTravelTo`/`_navTick`) is a sibling of WP auto-travel and shares `_travelStepping`/`_encounterQueued`, so a user move halts either.

**Story-bar mini maps are click-to-travel too (§MAP-NAV).** The three always-visible panels in the story bottom bar — **LOCAL** (`#mini-map-grid`, the 11×17 window), **WORLD** (`#world-map-grid`, the 41×61 overview), and **GLOBE** (`#globe-map-canvas`, the whole world at 2 px/cell) — each route a click through the same `_navClickCell` used by the Map sheet: a non-self, non-sea tile → one instant step if adjacent, else auto-travel the road-weighted route there (halting on encounter/block/battle/input). The grid panels wire a per-cell listener; the GLOBE canvas maps pixel→cell via `_mapCanvasClick` (`cv._win = {r0:0, c0:140, PX:2}`, wired once). Display-only — the mover is never gated (Free-Movement). *(The GLOBE no longer opens the full Map on click; open it from the map toggle elsewhere.)*

### Connection center (§MESH-02 — the Map sheet's sub-tabs)

The Map sheet also carries connection sub-tabs — **🌐 Multiplayer · 🔭 Discover · 🛡 Lists** — making discovery, list sources, and the server ACL first-class UI. Everything here is connection/display layer: the mover never reads any of it (Free-Movement), and presence stays single-writer. The 🌐 strip and Shift+🌐 modal remain as shortcuts.

- **🌐 Connect** — a live status card (server base, 🟢/🔴 state, 🌍 world tag, mesh-peer count, engine version with a ⚠ build-mismatch flag; offline → "no server" hint) plus a server-or-magnet input with **🔌 Connect / 🔭 Find / ✕ Disconnect**. One connect path: everything delegates to the same join/resolve code as the 🌐 strip.
- **🔭 Discover** — three ways to find servers: **🖥 local scan** (parallel manifest probes of `localhost:1360–1380` — a browser can only probe, never listen), **🔭 Find** (magnet/tracker/server input through the shared resolver), and **server-list sources** (subscribe to a plain-text or JSON list URL; one `host:port` / URL / magnet per line, `#` comments). Sources marked **auto** load when the pane opens — but **only if their host is on your whitelist** (D4); a non-whitelisted auto source shows ⚠ and is never fetched.
- **🛡 Lists** — your client **blacklist** (matched by address, host, server id, or world hash — blacklisted servers vanish from every row list and Join refuses them) and **whitelist** (which hosts may auto-load, D4); the **server ACL editor** (mode, `shareBlocklist`, all six allow/block lists — a validated merge-write over `GET/PUT /api/mesh/acl`, offline → hint); and **peer blocklist preview** (D2/D3): fetch a peer's shared blocklist — 403 means they haven't opted in — see a counted preview, and merge into your own blacklist **only on an explicit click**. Nothing is ever auto-imported.

**Quick-start — two players, one machine:** run one server (`./wbapi-toggle.sh start`), open `play.html` in **two browser windows** (two local clients = one server), click 🌐 in each, pick different names. You'll see each other in "Also here:", on the map dots, and in 💬. A friend on your LAN instead runs nothing: they open the game, map tab → 🌐 Connect, and enter `your-lan-ip:1367` (or you send them an `coc:?…` magnet); serve them the world itself via `GET /api/world/download`. CLI parity for everything above: `./api.sh mesh status|peers|tracker|acl|blocklist|connect` (§MESH-02g).

### What multiplayer never does (invariants)

- **Presence is display-only.** The browser reports position via the `POST /api/session/pos` beacon, which validates passability and broadcasts arrivals/departures but **rolls nothing** — your encounters are always your own client's rolls. (`session/move`, which does roll, is exclusive to headless MUD clients.)
- **Encounters are instanced** — session-private, seed-deterministic, never delivered over SSE (§WALK-5 property, enforced by the mud-harness).
- **Free-Movement is untouched** — the mover never consults presence.
- **Stale beats absent**: during a network split you keep seeing a peer's last known position (up to a 90 s origin TTL) rather than players blinking out; snapshot anti-entropy corrects positions on heal (partition-heal harness, Inc e).

### World identity — what forks a swarm and what doesn't

Two servers sync only if their `(proto, engineVer, worldHash)` match exactly. `worldHash` covers the **eight spatial/mechanical data collections** — `NODE_MAP`, `NODE_COORDS`, `SEA_RUNS`, `SEA_LANES`, `ROAD_RUNS`, `QUEST_DB`, `MONSTER_POOL`, `WORLD_DB` — hashed as raw source spans, plus `ENGINE_VER`. **This boundary is intentional** (decided in the architecture report §III.A): *hash what determines where players can stand and what they can fight*. Narrative tables — `NPC_DIALOGUES`, `BIRKA_NPC_PROFILES`, `FROBERGER_JOURNAL`, `KEY_EVENTS`, and other prose — are deliberately **not** hashed, so a pure-dialogue mod does not fork the swarm. Likewise `WORLD_NAME` is a display-only tag (rendered as `worldTag` = `<name>-<hash5>`, e.g. `CodexOfConquest-915aa`): renaming a world never forks it — identity is what a world *is* (data), the tag is what it's *called*. Incompatible worlds are refused at gossip ingress (409) and segregated into their own tracker world groups; mod inspection goes through `GET /api/world/download` + `src/scripts/world-diff.js`.

### Gameplay ladder

- **(f) co-presence buffs + party loot share** ✅ — co-located players get "traveling with allies": +1 to hit per ally (cap +2), the wilderness encounter rate halved on shared cells, and +10% XP/gold per ally (cap +20%) on victory. All guarded on the connection, so single-player is unchanged.
- **(g) hireling guide bot** ✅ — a single-player companion (60g + 12g/day) that fights beside you (one extra attacker die) and, on "follow me", leads you to your active quest via auto-travel.
- **(h) sentry bots** ✅ — server-owned guards you post at a road junction. A sentry rides presence for free (anyone co-present sees it), **suppresses wilderness encounters in its cell**, and **auto-assists any battle there** (a second extra attacker die). You bankroll the sentries you post: **120g up front, then 20g/day upkeep** drawn on rest — a post you can no longer pay stands down (auto-recalled). Post/recall from the **🛡 Sentries** panel in Story Mode (requires a live server connection; the sentry only exists as server presence). A sentry never idle-expires — only recall removes it.
- **(i) no-dupe trade ledger** ✅ — player-to-player item trading, backed by a tamper-evident economy ledger (below).
- **(j) consensual PvP duels** ✅ — challenge a co-present player to a provably fair duel (below).

### Duels (§MESH-01j — how it plays)

- **Challenge**: click the **⚔** button next to a co-present player's name (same server, v1). They get 30 seconds to accept. Nobody can be dueled without saying yes — and the **🚫 decline all duels** checkbox in the duel window makes you unchallengeable entirely (takes effect on your next connect).
- **Provably fair**: accepting locks in your current stats as a hidden *commitment* (a hash). Only after both sides commit does anyone reveal — then the dice seed is derived from both players' secret nonces together, so **neither side can steer the rolls or tailor their build to yours**. The server rejects impossible stat blocks outright (a level-20 build with 9,999 HP never fights).
- **The fight resolves itself**: a shared pure resolver (the same `DUEL:CORE` code runs in your game and on the server, byte-identical) plays out initiative, attack rolls, crits and damage from the committed inputs. Your client **replays the whole duel locally and verifies the verdict** — the transcript you watch ends with "Replay verified ✓" because it literally re-derived the winner.
- **No stakes in v1**: winning or losing changes nothing in your save — no HP, gold, XP or item movement. The outcome is written into both players' ledger chains (as durable as a trade), so bragging rights are on the permanent record.
- **Walking away**: leaving the shared cell before accepting just cancels the challenge; leaving after you've committed counts as a **forfeit** — the move itself is never blocked (Free-Movement holds even mid-duel).

### Trading (§MESH-01i — how it plays)

- **Your trade identity travels with your save, and it belongs to the character.** The first time you connect, the game generates a private `playerKey` and keeps it in your save file. **Starting a New Game gives you a new one** (§DX-02cn — until 2026-08-26 the field was undeclared, so a fresh character silently inherited the previous character's ledger chain); **New Game+ keeps yours**, because that is the same player carrying a run forward. It gives you a durable trade identity on each server — sessions can expire, tabs can close, and everything you own on the ledger is still yours when you reconnect. Guard your save: whoever holds the key owns the items (the same trust as the save file itself).
- **Items become tradeable by being *minted*.** Loot you pick up **while connected** is minted on the server and shows a 🔗 mark in your inventory. Items found offline are yours to use as always, but they have no ledger lineage, so they can't be traded — that's the anti-duplication rule: only items whose history roots at a mint can change hands. Story-progression items (shards, key items, mission-bit tokens) never mint and never trade.
- **To trade**: click the **⇄** button next to a player's name in the "Also here:" strip. Tick what you give and what you ask for, then **Propose** — they get the offer instantly and have **60 seconds** to accept before it expires. Either side can cancel; walking away costs nothing. On accept the server re-checks that both sides still own what they promised, then writes **one co-signed event into both players' chains** — the trade is atomic: both halves happen or neither does.
- **Trading works across servers.** A player standing next to you who is connected to a *different* server in the mesh gets the same ⇄ button. Your server relays the offer to theirs, the accept relays back, and the one trade event is **co-signed by both servers** before it gossips out to the whole mesh. The only requirement: the two servers must be able to reach each other (the same reachability the mesh already needs — if you can see them walking around, you can usually trade with them).
- **No dupes, ever**: every server that hears about a trade independently verifies the item's full ownership history. A doctored double-spend is detected on merge and voided identically everywhere — no moderator needed.
- The ledger protects **trades**, not stats — CodexOfConquest stays a client-authoritative single-file game among friends.

---

## State Fields Reference

| Field | Type | Purpose |
|---|---|---|
| `S_story.hp / hpMax` | number | Player story HP / max HP |
| `S_story.gold` | number | Current gold |
| `S_story.day` | number | Current day (1–49) |
| `S_story.shards` | number | Codex Shards collected (0–7) |
| `S_story.voidPressure` | number | Void Tide counter (0–10); defeat at 10 |
| `S_story.xp / xpLastBattle` | number | Cumulative XP / last battle award |
| `S_story.level` | number | Current player level (1–20) |
| `S_story.abilityScores` | object | STR/DEX/CON/INT/WIS/CHA scores; default {str:10,dex:8,con:8,int:8,wis:8,cha:8} from `_S_DEFAULTS()`, always present — every load merges the defaults under the save |
| `S_story.shortRests` | number | Remaining short rest charges today (0–3) |
| `S_story.knowledge` | array | Necklace of Knowledge beads (objects, one per unique rest location) and bare-string lore notes from arcs and the VM `reward.knowledge` bit; rendered as two sections, 🔮 Necklace and 📖 Field Notes |
| `S_story.checkpointNode` | string | Last inn slept at — respawn point for combat death |
| `S_story.dropsCollected` | number | Trophy drop counter for sq_battling; also feeds notoriety |
| `S_story.defeatedBattles` | object | Map of nodeCode → true; counts sq_leveling battles; feeds notoriety |
| `S_story.equippedShield` | object\|null | Currently equipped shield; null = unshielded |
| `S_story.shieldTier` | string\|null | Tier key of equipped shield (mirrors equippedShield.tier) |
| `S_story.equippedWeapon` | object\|null | Offhand dagger equipped; null = none |
| `S_story.equippedMainWeapon` | object\|null | Main hand weapon equipped; null = default character weapon |
| `S_story.levelUpLog` | array | Log of levels gained and features received |
| `S_story.tattoos` | array | Permanent tattoo items from each level-up `{type:'tattoo', lvl, icon, name, feature, desc, hpResult, bonusHpRoll, asiChanges, goldGift, shieldGift}` |
| `S_story.surgeCharges` | number | Action Surge charges remaining (restored on short/long rest; 0 before Lv2) |
| `S_story.indomitableCharges` | number | Indomitable death-save reroll charges (restored on long rest; 0 before Lv9) |
| `S_story.shortRestedAtNodes` | object | Map of nodeCode → true; tracks first short-rest per location (Boyscout Token) |
| `S_story.pendingBattle` | object or null | Active battle descriptor (`nodeCode`, `name`, `label`, flags) |
| `S_story.battleTurn` | `'player'`\|`'enemy'` | Whose turn it is in the Battle Focus overlay |
| `S_story.battleRound` | number | Round counter for the current battle |
| `S_story.surpriseAdvantage` | boolean | Stealth check passed — ADV on first attack |
| `S_story.usedMainAttack` | boolean | Main action consumed this round (attack OR wimper) |
| `S_story.usedRealAttack` | boolean | Genuine weapon attack made this round — gates offhand |
| `S_story.usedBonusAction` | boolean | Bonus action consumed this round |
| `S_story.conditionRoundsLeft` | number | Rounds remaining on opponent condition effect |
| `S_story.spellAdvantageReady` | boolean | Spell scroll ADV queued; consumed on use or expires at round end |
| `S._pendingDrop` | object or null | Staged monster-specific drop; consumed on Victory |
| `S.opp.tier` | string | Enemy tier (`trivial`…`deadly`) |
| `S.opp.cond` | string or null | Active condition name on enemy block |
| `S.char.baseAc` | number | AC snapshot at battle start; prevents shield-stack on re-entry |
| `POTION_TIERS` | const object | Potion data keyed by tier name |
| `LOOT_TABLE` | *(deleted 2026-08-26, §DROP-01-FU)* | The d20 drop table `_D100_TABLE` replaced in §DROP-01. Zero readers for its last 82 days |
| `XP_LEVELS` | const array[20] | Cumulative XP thresholds for levels 1–20 |
| `SHIELD_ITEMS` | const array | 6 tiers: Small +1 → Kite +2 → Magic +3 → Large Magic +4 → Legendary +5 → Ancient +6; `_magicTierAllowed()` gates drops |
| `DAGGER_ITEMS` | const array | 4 tiers: +1 Royal (Lv3) / +2 Painite (Lv7) / +3 Gaping (Lv13) / +4 Voidsteel (Lv20); drop-only |
| `WEAPON_ITEMS` | const array[70] | 14 base types × 5 magic tiers (0–+4); `STARTER_POINTY_STICK` is a standalone copy for new game |
| `STARTER_POINTY_STICK` | const object | Starting main weapon `{tier:'pointy_stick', die:4, count:1, magicBonus:0}`; set on storyNewGame() |
| `STARTER_FLINT_DAGGER` | const object | Starting offhand `{tier:'flint_dagger', atkBonus:-3}`; crude stone blade; set on storyNewGame() |
| `COMBAT_ITEMS` | const array | Flashbang (💥, 150gp, guaranteed ADV) |
| `MONSTER_DROPS` | const object | Drop data keyed by monster key |
| `CONDITION_GOLD` | const object | Gold cost per condition item (1,000–5,000gp) |
| `VENDOR_NODES` | Set | Node codes with vendor access (BA, MQ, SF, IS, BK) |
| `FIGHTER_FEATURES` | const object | Fighter Champion class features by level (2–20) |
| `_ASI_TABLE` *(deleted 2026-08-26, §ASI-01)* | — | had zero readers; the ASI is player-allocated (§ASI-01) |
| `_ASI_LEVELS` | Set | Levels that grant an ASI allocation: {4,6,8,12,14,16,19} |
| `S_story.npcFavorability` | object | npcKey → 0/1/2/3 (Impartial/Friendly/Dear Friend/Dear Friend+) |
| `S_story.npcTalk` | object | npcKey → `{count, lastDay}`: §NPC-01-D talk progress toward Friendly (once/game-day; `count≥TALK_TO_FRIENDLY` → fav 1) |
| `S_story.ngPlusRun` | number | NG+ generation counter; 0 = first run |
| `S_story.frobergerLastEntryRead` | boolean | true after player finds Journal Entry 41 |
| `S_story.journalEntriesRead` | array | entryNums of FROBERGER_JOURNAL collectible entries found |
| `S_story.ebNegotiatedPayments` | object | ebCode → gold accepted during payment negotiation |
| `S_story.actNumber` | number | Current act (1–8); derived from current node's `act` field |
| `S_story.currentCode` | string | Current node code; set on each navigation event |
| `S_story.roughWhiskeyUsed` | boolean | true after Rough Whiskey drunk-pit-fight scene fires |
| `S_story.pitTrainingWins` | number | CY battle wins while quest_pit_training active |
| `S_story.archiveVisited` | boolean | Blue Shutters Archive entered (S7 mechanic) |
| `S_story.playerKey` | string | Private 32-hex durable trade identity (§MESH-01i); generated once on first connect, save-persisted; server derives ledger pid `(origin8, sha256(key)[:8])`. **Declared `''` in `_S_DEFAULTS()` (§DX-02cn)** — a New Game clears it, NG+ preserves it |
| `item.mintId / item.mintKey` | array / string | Ledger mint id `[originServerId, seq]` (+ `"origin:seq"` string form) stamped on an inventory item minted while connected; 🔗 in inventory = tradeable |
| `NPC_DIALOGUES` | const object | 6 NPCs × 4 states × 5 quotes; `_getNPCDialogue()` priority chain |
| `FROBERGER_JOURNAL` | const array | 17 entries; 5 read-aloud at key nodes + 12 collectible |
| `EPIC_BOSS_POOL` | const object | 20 Deadly bosses keyed by slug; all EB encounters |
| `EB_NPC_DIALOGUE` | const object | 20 EB quest-giver NPCs; payment + return beat |
| `BIRKA_NPC_PROFILES` | const object | 6 Birka NPC definitions; key/name/occupation/node |
| `SWEELINCK_DIALOGUE_VARIANTS` | const array | 5 variants keyed by curse score bracket + Birka variant |
| `BOSS_COMMANDER_AUROS` | const object | Final boss stat block (AC22/HP300/ATK+12/3d8+6) |

---

## MECHANICS ENGINE — Function Reference (F4 Coverage)

> **CS architecture note:** F4 contains the economy and progression layer — vendor purchases, loot rolling, inventory management, and level-up sequencing. All loot rolls go through `_rollD100Loot()` → `_d100Result()` → weighted table (`_D100_TABLE`, total weight = 100). Magic tier gating is a single line: `level >= magic * 5`. Level-up is a two-phase process: `_checkLevelUp()` queues levels into `_levelUpQueue[]`; `_showLevelUpModal()` opens the modal one level at a time; `_lu_applyGiftsAndFinish()` commits gold/shield gifts and pushes to `levelUpLog`. Pre-battle condition costs deduct gold at `storyCommitBattle()` — not at condition selection. `_autoSellDuplicates()` fires on node entry (idempotent per node via `lastAutoSellNode`).

---

### FL2 — Standard Battle (pre-battle side)

> The battle resolution side (Battle Mode) is documented in `docs/spec/combat.md` (F6). F4 owns the pre-battle setup, condition deduction, and post-battle loot.

```
MILEPOINT A  Player arrives at battle node → storyPreBattle(node) called
             Guards: node.battle must exist AND defeatedBattles[code] must be absent
             _preBattNode = node; _selectedConds = new Set(); conditions panel initialised
             All CONDITION_ITEMS available for gold purchase; stealth tab available

MILEPOINT B  Player selects conditions → _toggleCond(i) toggles index in _selectedConds
             _renderPreBatt() updates cost preview (gold-only, no inventory consumed)
             Stealth tab: DEX check rolled; on success, surpriseAdvantage = true

MILEPOINT C  Player commits → storyCommitBattle()
             condCost = sum of CONDITION_GOLD[cond] for selected conditions
             Gold deducted immediately; battleDis charge consumed if > 0
             pendingBattle descriptor written to S_story
             BOSS_COMMANDER_AUROS / EPIC_BOSS_POOL / MONSTER_POOL loaded via loadWorldMonster()
             Conditions applied to S.opp.cond + S.opp.adv via CONDITION_ADV lookup

MILEPOINT D  [Battle Mode] — resolves in battle overlay; see docs/spec/combat.md FL2

MILEPOINT E  storyApplyOutcome(won)
             Won: defeatedBattles[code] = true; XP awarded; _checkLevelUp() queued
             Won + no _pendingDrop: _rollD100Loot() → item pushed to inventory
             Won + _pendingDrop: monster-specific drop used instead; _pendingDrop cleared
             Lost: pendingBattle retained; player may retry or respawn from checkpoint
```

---

### FL5 — Loot Pipeline

```
MILEPOINT A  Battle victory → _rollD100Loot() called
             Snapshots owned dagger tiers and weapon tiers to avoid duplicates

MILEPOINT B  Up to 3 roll attempts (Math.floor(random * 100))
             _d100Result(roll) walks _D100_TABLE by cumulative weight; returns row {_type, _magic?}

MILEPOINT C  Item type branch:
             potion_minor/potion/potion_greater/potion_superior → potion object, sell value set
             scroll → Spell Scroll (sell:50)
             flashbang → Flashbang (sell:75)
             gold → random 50–249gp, type='_goldcache', _gold field
             dagger / mainweapon → _magicTierAllowed(magic) gate; pool filtered by lv + not owned
             If pool empty or tier not allowed → retry; after 3 fails → Minor Healing Potion fallback

MILEPOINT D  _autoSellDuplicates() fires on next node entry
             Skips if lastAutoSellNode === currentCode (idempotent per node)
             Main weapons: keep equipped + best magicBonus per base key; sell rest
             Daggers: keep equipped + best atkBonus; sell rest
             Shields: keep equipped + best acBonus; sell rest
             goldGained added to S_story.gold; inventory filtered in-place

MILEPOINT E  storyRenderInventory() rebuilds inventory panel DOM
             Groups: equipped weapon/shield/dagger | potions | trophies | keys | scrolls
```

---

### FL6 — Level-Up Chain

```
MILEPOINT A  storyApplyOutcome(won) awards XP → _checkLevelUp() called
             Compares S_story.xp to XP_LEVELS[currentLevel]
             Increments level; pushes to _levelUpQueue[]; recurses for multi-level gains

MILEPOINT B  _showLevelUpModal(lvl) opens modal for one level
             Reads FIGHTER_FEATURES[lvl]; determines isASI from _ASI_LEVELS Set
             _lu_pending = { lvl, isASI, asiRemaining: isASI?2:0, asiChanged:[] }
             HP roll button enabled; ASI section hidden until HP rolled

MILEPOINT C  Player rolls HP (d10 + CON mod; min 1)
             Bonus HP roll on milestone levels (7/10/13/18): extra d10 added
             S_story.hpMax += roll; hp clamped to new max

MILEPOINT D  ASI branch (levels 4/6/8/12/14/16/19/20)
             Player clicks stat buttons; _lu_refreshAsiBtns() disables capped (≥20) stats
             Each click: stat +1, asiRemaining−1; CON delta cascades to retroactive HP
             (the STR→atkBonus cascade is gone — §AUDIT-03ae; STR reaches the roll through the score)
             2 points to spend; can split across two stats

MILEPOINT E  _lu_applyGiftsAndFinish(lvl, hp)
             _LEVEL_GOLD_GIFT[lvl] → S_story.gold += gift (non-ASI levels only)
             _LEVEL_SHIELD_GIFT[lvl] → _grantMagicShield() (L3 = +1, L11 = +2)
             Tattoo object pushed to S_story.tattoos {type,lvl,name,icon,hpRoll,bonusHpRoll}
             levelUpLog.push({ lvl, hp, bonusHp, goldGift, shieldGift })
             storyUpdateStatus(); storyAutoSave()

MILEPOINT F  If _levelUpQueue.length > 0 → "Next Level →" button triggers next modal
             Queue drains sequentially; each level a separate modal with its own HP roll
```

---

### FL10 — Vendor Economy

```
MILEPOINT A  Player clicks vendor button → storyVendorToggle()
             Toggles story-vendor-overlay; closes inv/quest overlays if open
             Only available at VENDOR_NODES: {BA, MQ, SF, IS, BK}

MILEPOINT B  storyRenderVendor() populates overlay
             Shows sellable inventory (sell > 0) with totals; Sell All / Sell Equipment buttons
             _renderVendorShields() — shows purchasable shield tiers; _magicTierAllowed() gate
             Whiskey section: shown only at BA
             _renderPachelbelSpecials() — fav-gated and act-gated items at BA node only

MILEPOINT C  Buy path — gold check before each purchase:
             storyBuyPotion(tier) → POTION_TIERS[tier]; deducts cost; pushes to inventory
             storyBuyShield(tier) → SHIELD_ITEMS by tier; _magicTierAllowed() gate; equips immediately
             storyBuyFlashbang() → fixed cost; pushes Flashbang to inventory
             storyBuyWhiskey() → fixed cost; sets roughWhiskeyActive = true

MILEPOINT D  Sell path:
             storySellAll() — removes all sell>0 items; adds total to gold; storyUpdateStatus()
             storySellEquipment() — sells unequipped weapons/shields from inventory

MILEPOINT E  _magicTierAllowed(magic) — single line: level >= magic * 5
             Gates: +1 needs Lv5 | +2 needs Lv10 | +3 needs Lv15 | +4 needs Lv20
             Applied in vendor shield display, _rollD100Loot() dagger/weapon rolls
```

---

### F4 Function Reference Table

| Function | Line | Purpose | Key data read | Key data written |
|----------|------|---------|---------------|-----------------|
| `storyPreBattle(node)` | 13007 | Opens pre-battle overlay; initialises conditions and stealth panels | `node.battle`, `defeatedBattles` | `_preBattNode`, `_selectedConds`, `S_story.surpriseAdvantage` |
| `_renderPreBatt()` | 13060 | Populates pre-battle overlay DOM (title, threat, cost preview, cond list) | `_preBattNode`, `_selectedConds`, `CONDITION_ITEMS`, `CONDITION_GOLD` | DOM prebatt-* elements |
| `_toggleCond(i)` | 13135 | Toggles condition index in _selectedConds; re-renders cost | `_selectedConds` | `_selectedConds`; calls `_renderPreBatt()` |
| `storyCommitBattle()` | 13158 | Deducts condition gold; writes pendingBattle; loads monster; applies conditions | `_selectedConds`, `CONDITION_GOLD`, `CONDITION_ADV`, `MONSTER_POOL` | `S_story.gold`, `pendingBattle`, `S.opp.cond/adv` |
| `storyVendorToggle()` | 8268 | Opens/closes vendor overlay; closes other overlays | DOM state | DOM story-vendor-overlay |
| `storyRenderVendor()` | 8283 | Renders full vendor panel: sell list, shields, specials, whiskey | `S_story.inventory`, `currentCode`, `npcFavorability` | DOM vendor-* elements |
| `_renderVendorShields()` | 8498 | Renders purchasable shield tiers; _magicTierAllowed() gate | `SHIELD_ITEMS`, `S_story.level`, `equippedShield` | DOM vendor shield list |
| `_renderPachelbelSpecials()` | 8321 | Renders fav-gated/act-gated Pachelbel special items at BA | `npcFavorability['pachelbel']`, `actNumber`, `S_story.inventory` | DOM pachelbel-specials element |
| `storySellAll()` | 8430 | Removes all sell>0 items from inventory; credits gold | `S_story.inventory` | `S_story.inventory`, `S_story.gold` |
| `storySellEquipment()` | 8441 | Sells unequipped weapons/shields from inventory | `S_story.inventory`, equipped tiers | `S_story.inventory`, `S_story.gold` |
| `storyBuyPotion(tier)` | 8470 | Purchases potion of given tier; gold check | `POTION_TIERS[tier]`, `S_story.gold` | `S_story.gold`, `S_story.inventory` push |
| `storyBuyShield(tier)` | 8485 | Purchases and equips shield; _magicTierAllowed() gate | `SHIELD_ITEMS`, `S_story.level/gold` | `equippedShield`, `S_story.gold` |
| `storyBuyFlashbang()` | 8527 | Purchases Flashbang condition item | `S_story.gold` | `S_story.gold`, inventory push |
| `storyBuyWhiskey()` | 8538 | Purchases Rough Whiskey; sets roughWhiskeyActive | `S_story.gold` | `S_story.gold`, `roughWhiskeyActive = true` |
| `_autoSellDuplicates()` | 8219 | Auto-sells duplicate weapons/daggers/shields; idempotent per node | `lastAutoSellNode`, `inventory`, equipped tiers | `inventory` filtered, `S_story.gold`, `lastAutoSellNode` |
| `storyCollectLoot(node)` | 11308 | Collects node loot on first visit; parses multi-item `loot` field | `node.loot`, `visited[code]` | `visited[code]`, inventory push, `S_story.shards` |
| `_rollD100Loot()` | 8714 | Rolls d100 weighted loot table; 3 attempts before fallback | `_D100_TABLE`, `S_story.level/inventory`, `_magicTierAllowed()` | returns item object |
| `_d100Result(r)` | 8708 | Maps roll 0–99 to _D100_TABLE row by cumulative weight | `_D100_TABLE` | returns row object |
| `_rollMonsterWeaponDrop(dmgDie)` | 8762 | Monster-specific weapon drop filtered by die ≤ dmgDie | `WEAPON_ITEMS`, owned weapon tiers | returns weapon object\|null |
| `_magicTierAllowed(magic)` | 8683 | Returns true if level ≥ magic × 5 | `S_story.level` | none (predicate) |
| `storyRenderInventory()` | 11822 | Renders full inventory panel with equipped items + grouped sections | `S_story.inventory`, equipped items | DOM inventory overlay |
| `_checkLevelUp()` | 9655 | Checks XP vs threshold; increments level; recurses for multi-gain | `S_story.xp/level`, `XP_LEVELS` | `S_story.level`, `_levelUpQueue.push()` |
| `_showLevelUpModal(lvl)` | 9599 | Opens level-up modal; populates feature/HP/ASI sections | `FIGHTER_FEATURES[lvl]`, `_ASI_LEVELS`, `S_story.xp` | `_lu_pending`; DOM levelup-modal |
| `_lu_refreshAsiBtns()` | 9590 | Disables capped (≥20) or exhausted ASI buttons | `_lu_pending.asiRemaining`, `abilityScores` | DOM .lu-asi-btn disabled states |
| `_lu_applyGiftsAndFinish(lvl, hp)` | 14233 | Awards gold gift + magic shield; closes modal; autosaves | `_LEVEL_GOLD_GIFT[lvl]`, `_LEVEL_SHIELD_GIFT[lvl]` | `S_story.gold`, `equippedShield`, `tattoos`, `levelUpLog` |
| `storyUpdateStatus()` | 12837 | Refreshes all status bar elements (HP, gold, day, level, XP bar) | All S_story display fields | DOM status bar elements |


---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../../LICENSE) for full text.*
