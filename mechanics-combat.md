<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Roll2Hit — The Shattered Codex: Combat Mechanics
**Last synced:** 2026-05-26 · 17,762 lines · All line numbers re-verified (SP4 annotation pass)

## Overview

Roll2Hit runs in two modes that share a single state. **Battle Mode** is the combat tracker (this document). **Story Mode** vendor, economy, NPC, and function reference content is in `mechanics-economy.md`. The two modes communicate through `S_story.pendingBattle` and `S._pendingDrop`.

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

Luck's sole mechanical role is improving what you get from a fish catch. All other former uses (bait search DC, d100 combat drops, death saves, encounter rate, tournament tiebreaker) have been removed.

**Rarity thresholds** (`_rarityFromRoll`):

| Type total | Rarity | Gold multiplier (vs common) |
|-----------|--------|----------------------------|
| ≤ 5 | Common | 1× |
| ≤ 10 | Rare | ~2.5× |
| ≤ 15 | Enchanted | ~4× |
| ≤ 18 | Golden | ~6× |
| 19+ | Legendary | ~10× |

At max practical luck (+3), average type roll shifts from ~10.5 → ~13.5 — most catches move from Common/Rare into Rare/Enchanted.

**UI:** Displayed in character sheet as `🍀 Luck: 12 (Mod: +1)` below the six ability scores. Not shown on the status bar — derived on demand only.

See `plan.md` §XIII for full implementation steps and flavor note.

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

**📖 Fishing Guide** *(✅ Implemented 2026-05-26)* — obtained from the Fisherman at YC via quest `quest_fishing_guide`. The Fisherman gives it after the player has fished at least once.

- **[READ]** opens the in-world guide: zone table (Shore/Reeds/Deep), bait tier reference, predator condition summary, drop formula, and the line *"The lake knows the difference."*
- **Mechanical effect:** While the Fishing Guide is in inventory, zone DCs are displayed in the fishing modal (`Shore DC 8 · Reeds DC 12 · Deep DC 16`). Without it, DCs show as `DC: ???`
- Not sellable. Not consumable. Not transferable.

---

### Fishing Items *(Layer 47 — partial)*

Three items are exclusive to the Yugurt Lake fishing sub-game. None can be used outside `isFishingLake:true` nodes.

**🎣 Fishing Rod** *(✅ Implemented, Layer 37)*  
Obtained from The Fisherman at YC (free, no gold cost). Required to trigger `storyFishing()` at YL. Without it, the fishing chip at YL shows: *"You need a Fishing Rod. The Fisherman at YC has one."* Not sellable. Not equippable in combat slots.

When the Fishing Rod is in inventory and a fish battle begins, `_startFishBattle()` injects a special condition into the pre-battle screen:

| Condition | Source | Effect | Cost |
|-----------|--------|--------|------|
| 🎣 **Hooked** | Fishing Rod (auto-injected) | ADV on all attacks — fish is on your line | Free |

Hooked is not in `CONDITION_ITEMS`. It is unshifted directly into `_availableConds` at pre-battle setup when `hasRod === true`. It costs no gold. Selecting it is optional but costs nothing.

**🪝 Bait System** *(✅ Implemented, Layer 47)*  
Bait is stored in the main inventory (`type:'bait'`) — not a separate Tackle Box structure. `storyFishing()` calls `_getSessionBait()` to find the first bait in inventory. A single bait is consumed per cast via `_consumeBait()`. The three search locations (bank/reeds/shallows) draw from `BAIT_TABLES` (HTML line 11212). Bare hook fallback shows `🪝 Bare Hook (−3 Catch)`.

| State field | Type | Default | Notes |
|-------------|------|---------|-------|
| `fishingQuestFlags` | object | `{}` | Tracks which bait locations have been searched |
| `fishingBaitSatchel` | bool | false | Lowers Survival DC from 10 to 8 when true |
| `fishingYugurtFavour` | bool | false | Reserved for future Fisherman relationship arc |
| `fishingCatchLog` | array | `[]` | Last 10 catches `{size, rarity, fish_key, gold}` |

**📖 Fishing Guide** *(✅ Implemented 2026-05-26)*  
Readable item from the Fisherman at YC via quest `quest_fishing_guide` *"Listen Closely"* (activates on first YC visit; completes when `fishingCatchLog.length > 0` and player returns to YC). While in inventory: zone DCs displayed in fishing modal (`Shore DC 8 · Reeds DC 12 · Deep DC 16`). Without it, shows `DC: ???`. Content: `FISHING_GUIDE_TEXT` const (HTML line 11230). DC display wired via `hasGuide` check at top of `storyFishing()`.

**Zone Unlock Progression** *(✅ Implemented — Layer 83, §XLV)*  
Zone access is gated via `tackleboxZoneUnlocks` state. All three zones check unlock state when the Find Bait panel opens; unlocks are auto-granted on the spot when conditions are met.

| Zone | Key | Default | Unlock Condition |
|------|-----|---------|-----------------|
| The Bank 🪨 | `shore` | `true` | Always available |
| The Reeds 🌿 | `reeds` | `false` | Auto-unlocks after first catch (`fishingCatchLog.length >= 1`) |
| The Deep 🌊 | `deep` | `false` | Auto-unlocks after landing a Large+ fish (`fishingCatchLog.some(c => ['large','very_large','legendary'].includes(c.size))`) |

Locked buttons show `🔒`, opacity 0.45, `disabled`, and a tooltip hint. The `baitFishingActive` suppression flag is also live.

| State field | Type | Default | Purpose |
|-------------|------|---------|---------|
| `tackleboxZoneUnlocks` | object | `{shore:true, reeds:false, deep:false}` | Unlocked fishing search zones |
| `baitFishingActive` | bool | false | Suppresses node re-render during bait catch sequence |

---

### Stalk / Hunt Mechanic *(§XLIII — ✅ Implemented Layer 82)*

Hunting lets the player choose a specific target before entering combat. Three distinct paths exist with different time costs and risk profiles.

#### Hunt Modes

| Mode | Time Cost | Survival Check | Outcome |
|---|---|---|---|
| **Targeted Hunt** | 1h hunt + 1h battle = 2h | WIS Survival vs tier DC | Pass → exact target + surprise ADV; Fail → random fallback |
| **Rush In** | 1h battle only | None | Random encounter from terrain pool (notoriety-weighted) |
| **Corridor** | 0h (passive) | None | Encounter rolls on movement, no player agency |

**Time Economy:** A targeted hunt costs one extra hour but rewards precise control and surprise advantage on pass. Players hunting quest targets should invest the extra hour — the XP/loot from off-target monsters doesn't contribute to quest completion. Players grinding levels may prefer Rush In for speed.

#### Target Selector UI

The Hunt card in Story Mode expands an **inline accordion** below the card (same CSS transition as the NPC Talk accordion). The panel lists two groups:

**Quest Targets** — monsters from active quests matching this terrain.  
**All Monsters Here** — full terrain pool from `WORLD_DB[node.name].monsters`.

Each row: name · tier badge · AC · HP · WIS Survival DC. Quest targets also show a ◈ badge.

A **Rush In** button above the selector skips target selection, calls `storyQuickWait(nodeCode)`, and costs only the 1h battle.

#### WIS Survival DC by Tier

| Tier | DC |
|---|---|
| Trivial | 8 |
| Easy | 10 |
| Medium | 12 |
| Hard | 14 |
| Deadly | 16 |

DC is derived from the monster's `tier` field in `MONSTER_POOL`.

#### Survival Roll Formula

```
roll  = d20 + floor((WIS − 10) / 2)
dc    = TIER_DC[monster.tier]
pass  = roll >= dc
```

**UI display:** `d20 (N) + WIS (±N) = N vs DC N → PASS` or `→ FAIL`

#### Pass / Fail Outcomes

**Pass:** `pendingBattle` set with exact monster key. `surpriseAdvantage = true` → ADV on first attack. 1h added to time.

**Fail:** `_weightedMonsterPick(terrain)` fires as fallback. No surprise advantage. Flavor text shown (5 entries: cold trail, snapped branch, old tracks, wind betrayal, quarry never arrived). 1h added to time.

**Rush In:** Calls `storyQuickWait(nodeCode)` unchanged — no survival check, no extra hour.

#### Reward for Hunting Well

Precise hunting completes quest kills in 2h vs 4–6h of random encounters. Surprise ADV is meaningful against hard/deadly-tier enemies with high AC. The extra hour is never wasted if the target is a quest monster.

#### State Fields

| Field | Type | Default | Notes |
|---|---|---|---|
| `huntSelectedTarget` | string\|null | `null` | Monster key selected in target picker |
| `huntLastSurvivalRoll` | object\|null | `null` | `{roll, mod, total, dc, pass}` — for display |

---

*© 2026 roll2hit.com — MIT License. See [LICENSE](LICENSE) for full text.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
