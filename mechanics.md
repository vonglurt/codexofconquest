<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Roll2Hit — The Shattered Codex: Game Mechanics

## Overview

Roll2Hit runs in two modes that share a single state. **Battle Mode** is the combat tracker. **Story Mode** is the narrative exploration layer. The two modes communicate through `S_story.pendingBattle` and `S._pendingDrop`.

---

## Battle Mode

### Combat Flow

#### Starting a Battle (Story Mode)
1. Navigate to a node with a **⚔ BATTLE** chip (or trigger a Stalk / corridor encounter).
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

### XP System

XP is earned on every enemy kill, including Stalk and corridor encounters.

**Formula:** `XP = enemy AC × enemy max HP`

| Enemy example | AC | HP | XP |
|---|---|---|---|
| Goblin Scout | 12 | 10 | 120 |
| Wererat | 13 | 33 | 429 |
| Orc Warlord | 16 | 93 | 1,488 |
| Ancient Dragon | 22 | 367 | 8,074 |

XP accumulates in `S_story.xp` across the entire run. Shown on the victory overlay after each fight.

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

**Level 21 — ⚠️ PLANNED (plan.md §XIV):** `XP_LEVELS[20]` is undefined. The level check in `_checkLevelUp()` reads `XP_LEVELS[currentLevel]`; at Level 20 this returns `undefined` and the cap holds. Level 21 is architecturally open — extending `XP_LEVELS` with one more entry and adding a new `FIGHTER_FEATURES` row at Lv21 is the minimum to unlock it. See `plan.md §XIV` (World Creator Wizard) for the full extension guide, including shell tooling for safe HTML data structure editing.

---

### Level-Up System (Fighter Champion)

The player is a **Fighter Champion** with a **d10 Hit Die**. Every level-up rolls `d10 + CON modifier` for HP (minimum 1). CON modifier increases from an ASI retroactively add HP for all prior levels.

**ASI Levels:** 4, 6, 8, 12, 14, 16, 19

At ASI levels, the game rolls a **d6** on `_ASI_TABLE` and applies the result:

| d6 | Name | Effect |
|---|---|---|
| 1 | Might | STR +2 → atkBonus increases |
| 2 | Endurance | CON +2 → retroactive HP per level |
| 3 | Agility | DEX +2 |
| 4 | Power | STR +1, CON +1 |
| 5 | Speed | STR +1, DEX +1 |
| 6 | Guard | DEX +1, CON +1 |

STR modifier increases flow through to `S_story.atkBonus`. CON modifier increases add `conDelta × currentLevel` HP retroactively.

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

Shield gifts are added to inventory and auto-equipped if better than the currently held shield. `atkBonus` and `acBonus` in `S_story` are updated immediately; `hpMax` increases and current HP also increases by the same roll. The status bar shows `⭐ Level N · X/Y XP`.

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

**Default scores** (STR:16, DEX:12, CON:14, INT:10, WIS:12, CHA:8):  
`⌈(16×12×14×10×12×8)^(1/6)⌉ = ⌈(25,804,800)^(1/6)⌉ = ⌈11.54⌉ = 12` → **Luck 12, Luck Mod +1**

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

where `battlesWon` counts all defeated node battles plus Stalk/corridor victories.

**Effect on enemy tier weights:**

| Notoriety | Trivial | Easy | Medium | Hard | Deadly |
|---|---|---|---|---|---|
| ≤ 5 | 40% | 35% | 20% | 4% | 1% |
| 6–10 | 20% | 35% | 30% | 12% | 3% |
| 11–20 | 8% | 25% | 35% | 25% | 7% |
| 21–30 | 2% | 15% | 35% | 35% | 13% |
| 31–40 | 1% | 8% | 30% | 40% | 21% |
| 41+ | 0% | 5% | 25% | 40% | 30% |

**Effect on corridor encounters:** `encounterPct = min(95, 10 + notoriety × 1.5 + activeQuests × 4)`

As notoriety climbs, corridors become progressively more dangerous and deadly-tier enemies appear more often. High-notoriety runs demand consumable spending and careful route planning.

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
- Saves checkpoint via `r2h_checkpoint`

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
total = d20 + proficiencyBonus + S_story.atkBonus (level)
             + equippedWeapon.atkBonus (dagger offhand)
             + equippedMainWeapon.magicBonus (main weapon)
```

---

### Main Hand Weapons (WEAPON_ITEMS)

42 entries: 14 base weapon types × 3 magic tiers (base, +1, +2). +3 and +4 tiers are planned for Layers 25+.

**14 base types (die size ascending):** Pointy Stick d4 Lv1, Sickle d4 Lv1, Axe d6 Lv1, Bow d6 Lv2, Scimitar d6 Lv2, Flail d8 Lv3, Long Sword d8 Lv3, Morningstar d8 Lv4, Rapier d8 Lv4, Crossbow d10 Lv5, Glaive d10 Lv5, Halberd d10 Lv6, Maul 2d6 Lv7, Lance d12 Lv8.

**Magic tiers:** `minLevel = baseLv + magic × 4`. A +1 Axe requires Lv5; a +2 Axe requires Lv9.

Drop chance: **15% per battle** via `_rollMainWeaponDrop()`. Duplicate tiers already owned are excluded from the eligible pool.

---

### Dagger Drops (DAGGER_ITEMS)

Daggers are offhand weapons that drop from battle — they are not sold at vendor nodes.

| Dagger | ATK Bonus | Min Level | Sell |
|---|---|---|---|
| 🗡 +1 Royal Dagger | +1 | Lv3 | 150gp |
| 🗡 +2 Painite Dagger | +2 | Lv7 | 450gp |
| 🗡 +3 Gaping Dagger | +3 | Lv13 | 1,250gp |
| 🗡 +4 Voidsteel Dagger | +4 | Lv20 | — (planned) |

Drop chance: **12% per battle** via `_rollWeaponDrop()`. Always drops the lowest tier the player doesn't yet own and qualifies for. The `atkBonus` adds to every attack roll when the dagger is equipped in the offhand slot.

---

### Starting Kit (New Game)

Every new game begins at City Streets — Birka (CI) with:

| Slot | Item | Stats | Notes |
|---|---|---|---|
| Main Hand (equipped) | 🪵 Pointy Stick | 1d4, no magic bonus | STARTER_POINTY_STICK; set in storyNewGame() |
| Offhand (equipped) | 🗡 Flint Dagger | atkBonus: −3 | STARTER_FLINT_DAGGER; crude stone blade |
| Inventory | 🗡 Rusted Dagger | type:'item' | Fallback; no atkBonus |
| Inventory | 🧪 Minor Healing Potion × 2 | heal 10 HP | First-fight healing |
| Gold | 150gp | — | Covers first inn (5gp) + early purchases |

**Starting attack bonus at Level 1:** STR +3 (score 16) + Prof +2 + Flint Dagger −3 = **+2 to hit**. Deliberately weak — the crude flint dagger makes early fights challenging and rewards upgrading to a better offhand.

The nearest vendor is BA (City Fence) — one hop south then east from CI. The nearest inn is IN — one hop east.

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
- Checkpoint saves on every inn sleep via `r2h_checkpoint`

---

### Save System

All state is persisted via `localStorage`. There is no server component.

| Key | Written by | Read by | Content |
|-----|-----------|---------|---------|
| `r2h_autosave` | `storyAutoSave()` | `storyCheckContinue()` | Full `S_story` JSON snapshot; written on every move, battle end, level-up, and purchase |
| `r2h_checkpoint` | `storySaveCheckpoint()` | `storyLoadSave('r2h_checkpoint')` | Full `S_story` JSON snapshot; written only on inn sleep (long rest) |

**Continue flow**: On page load, `storyCheckContinue()` reads `r2h_autosave`. If the save exists and `hp > 0`, the player is offered a **Continue** button that calls `storyLoadSave('r2h_autosave')`.

**Respawn flow**: On combat death (`hp === 0`), the respawn option calls `storyLoadSave('r2h_checkpoint')`, restoring the player to their last inn sleep at half max HP.

**New Game / Wipe**: Both the Wipe Void Defeat screen and the explicit New Game path call `localStorage.removeItem('r2h_autosave')` and `localStorage.removeItem('r2h_checkpoint')` before resetting `S_story` to `_S_DEFAULTS()`.

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

#### Buying Transmort Scrolls

| Item | Cost | Effect |
|---|---|---|
| 📜 Transmort Scroll | 200gp | Instantly recall to Hearth Home inn |

---

### Hearth Home

**Purpose**: Set a "home base" inn where your Transmort Scroll returns you.

**Setting it**: At any inn node (🛏 chip visible), click the **🔥 Set as Home** chip next to the INN chip. The selected inn becomes your Hearth Home. A gold 🔥 HEARTH badge replaces the chip at that location.

**Default**: Starts at City Inn (CI).

**Persists** across sessions via autosave.

---

### Transmort Scroll

**Purpose**: Emergency teleport back to safety.

**Acquiring**: Buy from any vendor for 200gp. Also potentially found as world loot.

**Using**: Open Inventory (I or 📦 button), click **📜 Use** next to the Transmort Scroll.

**Effect**:
- The scroll is consumed (removed from inventory).
- You are immediately transported to your Hearth Home node.
- The move is logged as a navigation step.
- The destination renders normally — loot, quests, and journal entries trigger as expected.

**Tactical use**: Use when surrounded, when a gate blocks your path back, or when the Void Tide timer is critical and you need to rest immediately.

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
- **Activates**: At Birka (CI) — first time you enter Story Mode
- **Objective**: Collect weapon drops from 3 combat victories
- **Tracked by**: `S_story.dropsCollected >= 3`
- **Flavor**: The fence at the Rough Bar will buy anything. Reputation is currency.

#### sq_leveling — The Spoils of War
- **Activates**: At Birka (CI) — alongside Battling
- **Objective**: Win 5 story battles (via Victory outcome)
- **Tracked by**: `Object.keys(S_story.defeatedBattles).length >= 5`
- **Flavor**: Five fights means you've survived enough to be dangerous.

---

### Final Boss — Commander Auros ✅

**High Commander Seraphine Bruhns / Auros** — accessible at node **CO (Covenant)** when `level ≥ 20` AND `shards = 7`. The stat block is loaded from `BOSS_COMMANDER_AUROS`.

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
| Friendly | 1 | Quest-gated; unlock via completing their intro quest |
| Dear Friend | 2 | Time-gated after Friendly + enough visits |
| Dear Friend+ | 3 | Second-act content; post-NG+ or post-Act IV |

**The six NPCs:** Yael (CI), Brynn (IN), Quill/Couperin (TV), Pachelbel/Deacon (BA), Weckmann (CY), Auros/Bruhns (CY).

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

On NG+ runs, the EB nodes show one-time atmospheric `EB_NG_PLUS_LINES` on first revisit. The EB nodes "remember" the player has been there. At CI on NG+ start, "Sweelinck is waiting." overlay fires.

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
| `S_story.atkBonus` | number | Cumulative ATK bonus (level ASIs + STR mod) |
| `S_story.acBonus` | number | Cumulative AC bonus from level rewards |
| `S_story.abilityScores` | object | STR/DEX/CON/INT/WIS/CHA scores; default {str:16,dex:12,con:14,int:10,wis:12,cha:8} |
| `S_story.shortRests` | number | Remaining short rest charges today (0–3) |
| `S_story.knowledge` | array | Necklace of Knowledge beads (one per unique rest location) |
| `S_story.hearthHome` | string (node code) | Transmort Scroll destination |
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
| `LOOT_TABLE` | const array[20] | d20 drop table — 8 Minor / 2 Spell / 5 Healing / 3 Greater / 2 Superior |
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
| `_ASI_TABLE` | const array[6] | d6 ASI roll outcomes (Might/Endurance/Agility/Power/Speed/Guard) |
| `_ASI_LEVELS` | Set | Level numbers that grant ASI rolls: {4,6,8,12,14,16,19} |
| `S_story.npcFavorability` | object | npcKey → 0/1/2/3 (Impartial/Friendly/Dear Friend/Dear Friend+) |
| `S_story.ngPlusRun` | number | NG+ generation counter; 0 = first run |
| `S_story.frobergerLastEntryRead` | boolean | true after player finds Journal Entry 41 |
| `S_story.journalEntriesRead` | array | entryNums of FROBERGER_JOURNAL collectible entries found |
| `S_story.ebReturnsCompleted` | object | ebCode → true; set on EB return quest completion; feeds curse score |
| `S_story.ebNegotiatedPayments` | object | ebCode → gold accepted during payment negotiation |
| `S_story.actNumber` | number | Current act (1–8); derived from current node's `act` field |
| `S_story.currentCode` | string | Current node code; set on each navigation event |
| `S_story.roughWhiskeyUsed` | boolean | true after Rough Whiskey drunk-pit-fight scene fires |
| `S_story.pitTrainingWins` | number | CY battle wins while quest_pit_training active |
| `S_story.archiveVisited` | boolean | Blue Shutters Archive entered (S7 mechanic) |
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

> The battle resolution side (Battle Mode) is documented in `combat.md` (F6). F4 owns the pre-battle setup, condition deduction, and post-battle loot.

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

MILEPOINT D  [Battle Mode] — resolves in battle overlay; see combat.md FL2

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
             Each click: stat +1, asiRemaining−1; STR delta cascades to atkBonus; CON delta cascades to retroactive HP
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
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
