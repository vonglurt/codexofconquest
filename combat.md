<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Roll2Hit — Combat System Reference
**File:** `roll2hit-v3.html` · **Layers:** 11–17 (battle engine), 21 (level-up), 23 (notoriety), 36–37 (features, d-pad, Boyscout)  
**Last synced:** 2026-05-26 · 17,762 lines · §API-02 line numbers verified

---

## Combat Entry Flow

```
D-pad ⚔ corner (NE) or 🗡 center Stalk or Corridor Encounter
   │
   ▼
Pre-Battle Screen (#story-prebatt-overlay)
   ├─ Fight tab   → commit, no opener
   ├─ Condition tab → spend gold (1,000–5,000gp) to debuff enemy
   └─ Stealth tab → d20 vs DC 5–16; pass = you go first + ADV on round 1
   │
   [← Retreat (safe)] exits at no cost, any time before commit
   │
   ▼
_storyRollInit()  →  initiative d20 each side; ties go to player
   │
   ▼
_showBattleOverlay()
   ├─ Syncs S.player.hp from S_story.hp
   ├─ Saves S.char.baseAc snapshot; applies _calcPlayerAc() (shield + acBonus)
   ├─ Syncs equippedMainWeapon → S.weapon.die / count / flatMod
   └─ Syncs ability scores + level into simulator inputs; calls syncCharFromUI()
```

**D-pad 3×3 grid** (story mode left panel):
```
[🧙 NPC]   [↑ N]  [⚔ Battle]
[← W]      [🗡 Stalk]   [E →]
[🛌 Rest]  [↓ S]  [⏳ Wait]
```
- **🗡 Center (Stalk)**: Opens stalk modal with quest-target awareness → "Wait for Prey" commits to fight
- **⚔ NE (Battle)**: Opens pre-battle screen; disabled if no `node.battle` or already defeated
- **🧙 NW (NPC)**: Calls `storyShowNpc()`; disabled if no NPC dialogue at node
- **🛌 SW (Rest)**: Calls `storyShortRest()`; 0 rests → BFS to nearest inn + auto-set waypoint
- **⏳ SE (Wait)**: `storyQuickWait()` — picks random monster from terrain, starts battle immediately

---

## Conditions & ADV/DIS Reference

> **Source:** `CONDITION_ADV` const, HTML line 5999. Applied by `applyCondition(side, condKey)`. Each condition sets one combatant's `adv` field to `'adv'` or `'dis'`, which is consumed by `rollD20(advState)`.

| Key | Label | Side | Effect | Note |
|---|---|---|---|---|
| `prone` | PRONE | opp | opp gets DIS | Enemy rolls at disadvantage |
| `restrained` | RESTRAINED | opp | opp gets DIS | — |
| `blinded` | BLINDED | opp | opp gets DIS | — |
| `paralyzed` | PARALYZED | opp | opp gets DIS | — |
| `stunned` | STUNNED | opp | opp gets DIS | — |
| `grappled` | GRAPPLED | opp | opp gets DIS | — |
| `petrified` | PETRIFIED | opp | opp gets DIS | — |
| `jammed` | JAMMED | opp | opp gets DIS | Tech/sci-fi flavor |
| `emp_stunned` | EMP STUNNED | opp | opp gets DIS | Tech/sci-fi flavor |
| `corrupted` | CORRUPTED | opp | opp gets DIS | Void flavor |
| `dodge` | DODGE | opp | opp gets ADV | Player rolls at disadvantage |
| `half_cover` | HALF COVER | opp | opp gets ADV | Player rolls at disadvantage |
| `poisoned` | POISONED | player | player gets DIS | — |
| `frightened` | FRIGHTENED | player | player gets DIS | — |
| `exhausted` | EXHAUSTED | player | player gets DIS | Applied by missed-sleep penalty |
| `hexed` | HEXED | player | player gets DIS | — |
| `cursed` | CURSED | player | player gets DIS | — |
| `virus_infected` | VIRUS INFECTED | player | player gets DIS | Tech/sci-fi flavor |
| `system_hacked` | SYSTEM HACKED | player | player gets DIS | Tech/sci-fi flavor |
| `overloaded` | OVERLOADED | player | player gets DIS | Tech/sci-fi flavor |
| `invisible` | INVISIBLE | player | player gets ADV | — |
| `raging` | RAGING | player | player gets ADV | — |
| `blessed` | BLESSED | player | player gets ADV | — |
| `stealth_mode` | STEALTH MODE | player | player gets ADV | — |

**Distinct from `CONDITION_ITEMS`:** `CONDITION_ITEMS` are the 11 purchasable pre-battle items (Flashbang, Torch, etc.). `CONDITION_ADV` maps condition *keys* to their mechanical effect — it covers all 24 condition states usable in the Battle Mode condition selector and via `applyCondition()`.

---

## Attack Formula (Story Mode)

```
atkTotal = d20 + abilityMod + profBonus + atkBonus + weaponAtk + mainWeaponAtk
```

| Component | Source | Notes |
|---|---|---|
| `d20` | `rollD20(advState)` | ADV = roll 2 keep high; DIS = roll 2 keep low |
| `abilityMod` | `getAtkAbilityMod()` | STR mod (or DEX if finesse) |
| `profBonus` | `getProfBonus()` | `floor((level-1)/4)+2`, applied if `S.weapon.prof = true` |
| `atkBonus` | `S_story.atkBonus` | Accumulated from ASI STR increases at level-up |
| `weaponAtk` | `S_story.equippedWeapon.atkBonus` | Offhand dagger magic bonus; 0 if no dagger |
| `mainWeaponAtk` | `S_story.equippedMainWeapon.magicBonus` | Main hand weapon magic bonus; 0 if none |

**Hit condition:** `atkTotal >= S.enemy.ac` OR `d20 === 20` (auto-crit)  
**Miss condition:** `d20 === 1` (nat 1 = always miss)  
**Critical hit:** damage dice doubled (`weapon.count × 2`)

---

## Damage Formula

```
damage = sum(rollN(die, count × critFactor)) + flatMod + getDmgMod()
```

| Component | Source | Notes |
|---|---|---|
| `die` | `S.weapon.die` | Set from equippedMainWeapon.die at battle start; default 8 |
| `count` | `S.weapon.count × dmgMultiplier` | count=2 for Maul; multiplier from ×1–×4 God Mode panel |
| `critFactor` | `isCrit ? 2 : 1` | Doubles count on crit; Fighter Champion crits on 19–20 at level 3+ |
| `flatMod` | `S.weapon.flatMod` | Set from equippedMainWeapon.magicBonus; also +STR/DEX mod from getDmgMod() |
| `dmgMod` | `applyDmgMod(raw, S.opp.dmgMod)` | 0.5× resistance / 1× normal / 2× vulnerability |

---

## Action Economy (1.5 AP per Round)

```
Round Start: 1.5 AP
  │
  ├─ ⚔ Attack (1.0 AP)     → bonus phase (0.5 AP)
  │    └─ deals damage, sets usedRealAttack = true
  │    └─ fires _extraAttackCount() rolls (1/2/3/4 at Lv1-4/5-10/11-19/20)
  │
  └─ 😬 Wimper (1.0 AP)    → bonus phase (0.5 AP)
       └─ no damage; opens bonus phase safely

Bonus phase (0.5 AP) — pick one:
  ├─ 🗡 Offhand attack    (requires usedRealAttack = true)
  ├─ ⚡ Action Surge      (Lv2+; spends surgeCharge → resets main action, +1.5 AP)
  ├─ 🧪 Drink potion
  ├─ 📜 Use spell scroll  (queues ADV on next attack)
  ├─ 💥 Use flashbang     (queues ADV; no offhand)
  ├─ 🛡 Equip shield      (AC adjusts immediately)
  ├─ 🏃 Flee ✓            (clean exit, no mutual attacks)
  └─ 😬 Pass bonus        → enemy turn fires
```

**Flee ⚠ (main phase):** both sides roll one free attack before escape — risky  
**Flee ✓ (bonus phase after wimper):** no damage taken — always available from round 1

**Action Surge (⚡):** Appears in bonus phase when `surgeCharges > 0` and main was used. Spends 1 charge → resets `usedMainAttack` + `usedRealAttack` so the full main action is available again. Net effect: +1.5 AP that round. **Not combinable:** two 0.5 AP bonus actions never combine into a 1.0 AP main action.

**Extra Attack loop:** `_extraAttackCount()` returns 1/2/3/4 based on level. Each roll is fully independent — resolved, logged, and mid-loop victory-checked. If the enemy dies before all rolls fire, the remaining rolls are skipped.

---

## Equipment Slots in Combat

| Slot | Field | Effect in Battle |
|---|---|---|
| Main Hand | `S_story.equippedMainWeapon` | Sets `S.weapon.die`, `count`, `flatMod = magicBonus` |
| Offhand | `S_story.equippedWeapon` (dagger) | Adds `atkBonus` to every attack roll |
| Offhand | `S_story.equippedShield` (shield) | Adds `acBonus` to AC via `_calcPlayerAc()` |
| Back | inventory (unequipped) | No effect |

**Offhand exclusivity:** dagger and shield occupy the same offhand slot. Equipping one auto-displaces the other to inventory. (Layer 26 enforces this.)

**Tactical choice:**
- Dagger offhand → better hit chance vs high-AC enemies (boss fights)
- Shield offhand → better survivability vs high-damage enemies (attrition fights)

---

## Enemy Turn

Fires automatically 1.2–1.4 seconds after player action resolves (`setTimeout`).

```
Enemy rolls: d20 + S.enemy.atk vs S.char.ac (= S.player.ac)
  ├─ HIT: dealDmg = rollN(dmgDie, dmgCount) + dmgFlat
  │        apply to S.player.hp + S_story.hp
  │        if hp <= 0 → _storyEnterDeathSaves()
  └─ MISS: no damage
```

Enemy dmg formula uses `S.opp.dmgMod` (resistance/vulnerability) same as player.

---

## Death Saves

Triggered when `S_story.hp <= 0` after enemy attack.

```
Roll d20 (no modifiers):
  ≥ 10       → 1 success pip
  < 10       → 1 failure pip (Indomitable may reroll — see below)
  Nat 20     → stabilize at 1 HP (immediate recovery)
  Nat 1      → 2 failure pips

3 successes → stable (unconscious, battle ends)
3 failures  → dead → story-defeat-modal (respawn at checkpoint)
```

State: `S_story.storyDeathSaves = { successes, failures, active }`

**Indomitable I (Lv9):** If `d20 < 10` AND `S_story.indomitableCharges > 0`, the roll is automatically rerolled once. Charge is spent. Logged as "🛡 Indomitable! Death save rerolled: N → M". This is a long-rest gated resource — 1 charge per long rest at Lv9.

---

## Fighter Champion Class Features by Level

All features grant a **tattoo item** (`type:'tattoo'`) pushed to `S_story.tattoos[]` at level-up. The character sheet shows all 20 levels interleaved: feature row + tattoo sub-row, earned = full color, future = greyed.

| Level | Feature | Mechanic | Rest Gate | Tattoo Name |
|---|---|---|---|---|
| 1 | Fighter's Foundation | d10 HP/level · all armor · 1 attack | — | The First Scar |
| 2 | Action Surge I | ⚡ Surge: spend 1 `surgeCharge` → reset main action (+1.5 AP) | **1/short rest** | Lightning Rune |
| 3 | Improved Critical | Crits on 19–20 | passive | Edge of Fate |
| 4 | ASI | Player allocates 2 stat points (cap 20) | — | Iron Discipline |
| 5 | Extra Attack I | Main action fires **2** independent rolls | passive | Twin Strike |
| 6 | ASI | +2 stat points | — | Sinew & Stone |
| 7 | Remarkable Athlete | **Bonus d10 HP roll at this level-up** | level-up only | Vitality Brand |
| 8 | ASI | +2 stat points | — | Mountain's Root |
| 9 | Indomitable I | When you fail a death save: spend `indomitableCharge` → reroll | **1/long rest** | Indomitable Mark |
| 10 | Fighting Style | **Bonus d10 HP roll at this level-up** | level-up only | Battle-Hardened |
| 11 | Extra Attack II | Main action fires **3** independent rolls | passive | War Mark |
| 12 | ASI | +2 stat points | — | Champion's Seal |
| 13 | Indomitable II | **Bonus d10 HP roll at this level-up** | level-up only | Iron Constitution |
| 14 | ASI | +2 stat points | — | Titan's Brand |
| 15 | Superior Critical | Crits on 18–20 | passive | Executioner's Eye |
| 16 | ASI | +2 stat points | — | Warlord's Mark |
| 17 | Action Surge II | `surgeCharges` pool → **2/short rest** | **2/short rest** | Storm Rune |
| 18 | Survivor | **Bonus d10 HP roll at this level-up** | level-up only | Survivor's Mark |
| 19 | ASI | +2 stat points | — | Apex Mark |
| 20 | Extra Attack III | Main action fires **4** rolls; crits 17–20 | passive | Legend's Mark |

**Bonus HP roll levels (7, 10, 13, 18):** Level-up modal shows a second 🎲 Roll d10 after the standard roll. Both results add to `hpMax`. Tattoo records both rolls and the bonus total.

**Rest charges:**
- `S_story.surgeCharges` — restored by `storyShortRest()` (1 at Lv2–16; 2 at Lv17+) and `storyConfirmSleep()` (same amounts)
- `S_story.indomitableCharges` — restored only by `storyConfirmSleep()` (1 at Lv9+)

**ASI Table (d6) — allocated by player (not rolled):**

| Option | Delta | STR cascade | CON cascade |
|---|---|---|---|
| Might | STR +2 | `atkBonus` increases | — |
| Endurance | CON +2 | — | retroactive HP: `conDelta × level` |
| Agility | DEX +2 | — | — |
| Power | STR +1, CON +1 | if mod changes | if mod changes |
| Speed | STR +1, DEX +1 | if mod changes | — |
| Guard | DEX +1, CON +1 | — | if mod changes |

STR mod increase → `S_story.atkBonus += strModDelta`  
CON mod increase → `S_story.hpMax += conDelta × currentLevel` (retroactive)

---

## Notoriety & Enemy Scaling

Notoriety is computed fresh before every monster pick — never stored.

```js
_notoriety() = level × 3 + floor(battlesWon / 2)
```

| Notoriety | trivial | easy | medium | hard | deadly |
|---|---|---|---|---|---|
| 0–5 | 40% | 35% | 20% | 4% | 1% |
| 6–10 | 20% | 35% | 30% | 12% | 3% |
| 11–20 | 8% | 25% | 35% | 25% | 7% |
| 21–30 | 2% | 15% | 35% | 35% | 13% |
| 31–40 | 1% | 8% | 30% | 40% | 21% |
| 41+ | 0% | 5% | 25% | 40% | 30% |

**Corridor encounter chance:** `min(95%, 10 + notoriety×1.5 + activeQuests×4)`  
At level 15, notoriety ≈ 45+. Most corridors are ambushes.

---

## XP & Level Progression

**Formula:** `xpAward = enemy.AC × enemy.maxHP`

**Proposed XP thresholds (Layer 25 — ~150 battles for Lv20):**

| Level | Cumulative XP | ~Battles to reach | Magic tier unlocked |
|---|---|---|---|
| 1 | 0 | — | Base items |
| 2 | 400 | 2 | — |
| 3 | 1,000 | 4 | — |
| 4 | 2,000 | 7 | — |
| 5 | 3,500 | 12 | **+1 magic** |
| 6 | 5,500 | 17 | — |
| 7 | 8,000 | 23 | — |
| 8 | 11,000 | 30 | — |
| 9 | 15,000 | 37 | — |
| 10 | 20,000 | 45 | **+2 magic** |
| 11 | 27,000 | 54 | — |
| 12 | 36,000 | 65 | — |
| 13 | 47,000 | 77 | — |
| 14 | 60,000 | 90 | — |
| 15 | 75,000 | 103 | **+3 magic** |
| 16 | 93,000 | 116 | — |
| 17 | 114,000 | 129 | — |
| 18 | 138,000 | 141 | — |
| 19 | 165,000 | 151 | — |
| 20 | 195,000 | 160 | **+4 magic · Final Boss** |

Battle count estimates assume average XP/battle: 350 (Lv1–4) → 800 (Lv5–9) → 1,400 (Lv10–14) → 2,500 (Lv15–20), driven by notoriety-scaled enemy tiers.

---

## Victory Resolution

`_storyBattleVictory()` fires on enemy HP = 0:

1. Award `xpAward = AC × maxHP` → `S_story.xp`
2. `_checkLevelUp()` → fill `_levelUpQueue[]` with any new levels
3. Heal + gold: `floor(0.1 × AC × maxHP)` each
4. Collect `S._pendingDrop` (monster-specific trophy)
5. Roll unified d100 loot (`_rollD100Loot()` — Layer 25)
6. Show victory overlay → loot list → "Back to Quest"
7. On "Back to Quest": if `_levelUpQueue.length > 0` → `_showLevelUpModal(shift())`; else → `storyEnter()`

---

## Final Boss — Commander Seraphine Bruhns

**JS const:** `BOSS_COMMANDER_AUROS` · **Access:** Node CO (Cosmic Realm — The Convergence) when `S_story.level >= 20` AND `S_story.shards >= 7`

| Stat | Value |
|---|---|
| AC | 22 |
| HP | 300 |
| ATK | +12 |
| DMG | 3d8+6 |
| Tier | deadly |
| XP | 22 × 300 = 6,600 |

Defeating Commander Bruhns → `storyCheckVictory()` → Codex Reforged victory modal.

---

## Key Functions Reference

| Function | Purpose |
|---|---|
| `_storyRollInit()` | Roll initiative; set battleTurn, round=1, flags to false; does NOT reset surgeCharges |
| `_showBattleOverlay()` | Sync all state into S; apply weapon/shield; sync simulator inputs; open overlay |
| `_overlayPlayerAttack()` | Loop `_extraAttackCount()` rolls; each fully resolved; mid-loop victory check |
| `_storyEnemyTurn()` | Enemy attack roll; apply damage; check death saves |
| `_storyBattleVictory()` | Award XP/gold/HP; collect drops; show victory overlay |
| `_storyEnterDeathSaves()` | Switch YOU zone to death-save UI |
| `_storyRollDeathSave()` | Roll d20; Indomitable auto-reroll if charge available; apply success/failure |
| `_checkLevelUp()` | Advance S_story.level if XP threshold crossed; fill queue |
| `_showLevelUpModal(lvl)` | Apply HP roll + ASI/gifts + bonus HP roll for Lv7/10/13/18; populate modal DOM |
| `_lu_applyGiftsAndFinish()` | Shared helper: apply gold/shield gifts, push to levelUpLog, enable continue |
| `_extraAttackCount()` | Returns 1/2/3/4 based on level (Lv1-4/5-10/11-19/20) |
| `_notoriety()` | Compute notoriety from level + battlesWon (pure, no side effects) |
| `_notorietyWeights(n)` | Map notoriety → {trivial,easy,medium,hard,deadly} weight object |
| `_weightedMonsterPick(terrain)` | Pick random monster weighted by notoriety tier weights |
| `_stalkedMonsterPick(terrain)` | Same + BOOST=6 for quest-target monsters |
| `_calcPlayerAc()` | baseAc + equippedShield.acBonus + acBonus |
| `_rollD100Loot()` | Unified d100 loot table roll with 3-reroll gate fallback |
| `_magicTierAllowed(n)` | `S_story.level >= n*5` — checks if player can hold +n magic items |
| `storyStalk(nodeCode)` | Opens stalk modal with quest-target list; "Wait for Prey" → battle |
| `storyQuickWait(nodeCode)` | SE d-pad ⏳: picks random monster via `_weightedMonsterPick()`, starts battle |
| `storyShortRest(nodeCode)` | Heals 25% hpMax (×2 if not inn); Necklace Token if first visit; 0 rests → BFS waypoint to inn |
| `storyConfirmSleep()` | Long rest: dice-based heal (2×d10+CON first visit; 1×d10+CON revisit); min 50% hpMax |
| `storyRenderCharSheet()` | Renders char overlay: stats, ability grid, gear, 20-level interleaved prog table |
| `storyCharToggle()` | Opens/closes char overlay; syncs simulator inputs from S_story when story active |

---

## COMBAT ENGINE — Function Reference (F6 Coverage)

> **CS architecture note:** F6 contains two combat layers that share dice primitives but differ in data scope. **Battle Mode** (`S` object, always-present) is a standalone d20 combat simulator with full roll history and histogram. **Story Battle overlay** (`S_story` + `S`) is an in-narrative wrapper: it syncs Story state into Battle Mode at battle start, reads HP back at `storyApplyOutcome()`, and controls overlay visibility. The bridge between layers is `_showBattleOverlay()` (Story → Battle) and `storyApplyOutcome()` (Battle → Story). `S.char.baseAc` is snapshotted at overlay open to prevent shield AC stacking across re-entry. Death saves live entirely in Story layer — the Battle Mode death-save panel is parallel logic, not shared.

---

### FL2 — Standard Battle (Battle Mode side)

> The pre-battle setup side (storyPreBattle → storyCommitBattle) is documented in `mechanics.md` (F4). F6 owns the in-battle resolution and outcome application.

```
MILEPOINT A  storyCommitBattle() transitions to Battle Mode → _storyRollInit()
             Initiative: player d20 vs enemy d20 + tierMod {trivial:-2, easy:0, medium:+1, hard:+3, deadly:+5}
             player ≥ enemy → battleTurn='player'; else 'enemy'
             battleRound = 1; all used* flags cleared; conditionRoundsLeft = 3 if condition set

MILEPOINT B  _showBattleOverlay() syncs Story → Battle
             S.player.hp = S_story.hp; S.char.baseAc snapshot; _calcPlayerAc() applied
             equippedMainWeapon → S.weapon.die/count/flatMod; abilityScores → UI fields
             syncCharFromUI(); _applyPitPerks(S); refreshLeftPanel()

MILEPOINT C  Player turn — playerRoll() entry point
             resolveAdv(S.player.adv, S.opp.adv) → combined ADV state
             ADV = max of 2d20; DIS = min of 2d20; norm = 1d20
             doPlayerAttack(attackNum, total) resolves to HIT/MISS/CRIT/NAT1
             CRIT doubles damage dice; NAT1 auto-misses regardless of AC

MILEPOINT D  Enemy turn — oppRoll()
             d20 + enemy.atk vs S.char.ac; damage = d(enemy.dmgDie)×count + dmgFlat
             Condition rounds tracked: conditionRoundsLeft-- each enemy turn; at 0 → condition clears

MILEPOINT E  Battle end — HP = 0 or kill event
             S.player.hp = 0 → _storyEnterDeathSaves() (Story layer)
             S.opp.hp = 0 → battKillEvent() → XP award; storyApplyOutcome() triggered via UI

MILEPOINT F  storyApplyOutcome(won)
             HP read from outcome-hp-input (pre-filled from S.player.hp)
             Won + non-corridor/stalk/fish: defeatedBattles[nodeCode] = true
             Won + EB node: return quest activated; waypoint set to npcNode
             Won + _pendingDrop set: specific trophy pushed to inventory; dropsCollected++
             Won + no _pendingDrop: _rollD100Loot() rolls standard drop
             hp = 0 after outcome → storyGameOver(); else storyRender(currentNode)
```

---

### FL6 — Level-Up Chain (Battle side)

> Level-up modal management is documented in `mechanics.md` (F4 — FL6). F6 combat.md owns the XP award that triggers it and the ASI stat cascades that affect battle.

```
MILEPOINT A  Battle won → XP award written to S_story.xp by storyApplyOutcome()
             _checkLevelUp() called: compares xp to XP_LEVELS[level]; recurses for multi-gain
             Levels queued in _levelUpQueue[]; _showLevelUpModal() fires for each

MILEPOINT B  ASI stat choice cascades into combat state
             STR +1 → atkBonus += strModDelta (added to all attack rolls in battle)
             CON +1 → retroactive HP: each level × new conModDelta added to hpMax
             DEX +1 → acBonus adjustable (not auto-applied; player equips armor separately)

MILEPOINT C  _lu_applyGiftsAndFinish() commits tattoo + gold + shield gifts
             Tattoo object pushed: {type:'tattoo', lvl, name, icon, hpRoll, bonusHpRoll}
             _LEVEL_GOLD_GIFT[lvl] → S_story.gold (non-ASI levels only)
             _LEVEL_SHIELD_GIFT[lvl] → _grantMagicShield() at L3 (+1) and L11 (+2)
             storyAutoSave() called at end — level-up is a checkpoint-equivalent event
```

---

### FL11 — Death Save Sequence

```
MILEPOINT A  S.player.hp reaches 0 in Story Battle → _storyEnterDeathSaves()
             Action row hidden; death-save panel shown; storyDeathSaves = {successes:0, failures:0, active:true}
             Turn badge shows ☠ DYING

MILEPOINT B  Player rolls → _storyRollDeathSave()
             d20: NAT20 → +2 successes; NAT1 → +2 failures; ≥10 → +1 success; <10 → +1 failure
             Indomitable (Lv9+): if fail AND indomitableCharges > 0 → reroll; indomitableCharges--
             Success/failure pips updated via _storyUpdateDsPips()

MILEPOINT C  3 successes → _storyDeathSaveCrawl()
             hp set to 1; S.player.hp = 1; pendingBattle = null
             Battle overlay closed; action row restored; storyEnter()
             Log: "By sheer will you drag yourself from the fight. 1 HP — rest immediately."

MILEPOINT D  3 failures → _storyDeathSaveFall()
             Inventory split: critTypes (shard, key) kept; all else → corpseQuest body
             corpseQuest = {id, nodeCode, nodeName, items[], goldDropped}
             S_story.corpsesQuests.push(corpseQuest); gold = 0; inventory = critItems + STARTER_DAGGER
             currentCode = checkpointNode (or CI if none); storyRender() at checkpoint with death message
             Body can be retrieved later via _storyRetrieveCorpse(questId)
```

---

### F6 Function Reference Table

| Function | Line | Purpose | Key data read | Key data written |
|----------|------|---------|---------------|-----------------|
| `roll(sides)` | 5483 | Core die roll: floor(random × sides) + 1 | sides | returns int |
| `rollN(sides, count)` | 5487 | Rolls N dice; returns array | sides, count | returns int[] |
| `rollNExploding(sides, count)` | 5493 | Rolls N dice; re-rolls each max value | sides, count | returns int[] (can exceed N elements) |
| `abilityMod(score)` | 5506 | Returns floor((score−10)/2) | score | returns int |
| `getProfBonus()` | 5510 | Returns ceil(level/4)+1; or override | `S.char.level/prof/profOverride` | returns int |
| `getAtkAbilityMod()` | 5515 | ATK ability mod + finesse + extra-mod field | `S.char.*`, atk-ability UI, atk-extra-mod UI | returns int |
| `getDmgMod()` | 5526 | Damage ability mod (STR or DEX for finesse) | `S.char.*`, atk-ability UI | returns int |
| `resolveAdv(pm, om)` | 5534 | Combines player+opponent ADV/DIS flags | pm (player mod), om (opp mod) | returns 'adv'\|'dis'\|'norm' |
| `rollD20(advState)` | 5542 | Rolls 1 or 2d20; returns {result, rolls[]} | advState string | returns {result, rolls} |
| `applyCondition(side, condKey)` | 6030 | Applies condition effect (ADV/DIS) to combatant | `CONDITION_ADV[condKey]`, side string | `S.player.adv` or `S.opp.adv` |
| `enterDeathSaves()` | 6194 | Battle Mode death saves (parallel, not shared with Story layer) | `S.player.*` | `S.deathSaves.*` |
| `rollDeathSave()` | 6213 | Rolls one Battle Mode death save d20 | `S.deathSaves` | `S.deathSaves.successes/failures` |
| `playerRoll()` | 6077 | Entry point for player attack in Battle Mode | `S.multiAttack` | calls `doPlayerAttack(1, total)` |
| `doPlayerAttack(attackNum, total)` | 6085 | Resolves one player attack: roll → hit/miss/crit → damage chips | `S.player.adv`, `S.opp.adv/ac`, `S.weapon.*` | `S.lastHit`, roll history; calls `appendCard()` |
| `rollMainDamage()` | 6282 | Rolls main-hand weapon damage after hit | `S.weapon.die/count/flatMod`, crit flag | `S.opp.hp`; appends damage chips |
| `offhandRoll()` | 6375 | Offhand dagger attack + damage | `S_story.equippedWeapon`, `S.usedRealAttack` | `S.opp.hp`; bonus-action consumed |
| `bonusRoll()` | 6465 | Bonus action roll (misc) | `S.player.*` | `S.opp.hp` |
| `oppRoll()` | 6597 | Enemy attack: d20+atk vs char.ac; damage on hit | `S.enemy.atk/dmgDie/dmgCount/dmgFlat`, `S.char.ac` | `S.player.hp`; calls `appendCard()` |
| `newCombat()` | 6683 | Resets Battle Mode for a new encounter | `S` defaults | `S.round`, HP, adv, cond fields cleared |
| `syncCharFromUI()` | 6743 | Syncs S.char from UI input fields | UI char-* elements | `S.char.*` |
| `_magicTierAllowed(magic)` | 9441 | `S_story.level >= magic*5` — checks if player can hold +n magic items | `S_story.level` | returns bool |
| `_rollD100Loot()` | 9472 | Unified d100 loot table roll with 3-reroll gate fallback | `_D100_TABLE`, `S_story.level` | `S_story.inventory`; returns result string |
| `_calcPlayerAc()` | 9548 | Computes AC: baseAc + shield.acBonus + acBonus | `S.char.baseAc/ac`, `equippedShield`, `S_story.acBonus` | returns int |
| `_storyRollInit()` | 9549 | Story initiative: player d20 vs enemy d20+tierMod | `S.opp.tier` | `S_story.battleTurn/battlePRoll/battleERoll/battleRound`, used* flags |
| `_showBattleOverlay()` | 9568 | Story→Battle sync: HP, AC, weapon, ability scores, pit perks | `S_story.*`, `S_story.equippedMainWeapon` | `S.player/char/weapon.*`; DOM battle fields |
| `_extraAttackCount()` | 9897 | Returns 1/2/3/4 based on level | `S_story.level` | returns int |
| `_overlayPlayerAttack()` | 9905 | Loop `_extraAttackCount()` rolls; each fully resolved; mid-loop victory check | `S.player.*`, `S.opp.*` | `S.opp.hp`; mid-loop `_storyBattleVictory()` if enemy dies |
| `_storyBattleVictory()` | 10071 | Award XP/gold/HP; collect drops; show victory overlay | `S.opp.ac/maxHP`, `S._pendingDrop` | `S_story.xp/gold/hp`, `defeatedBattles`, `inventory` |
| `_storyEnemyTurn()` | 10013 | Enemy attack roll; apply damage; check death saves | `S.enemy.atk/dmgDie`, `S.char.ac` | `S.player.hp`, `S_story.hp`; calls `_storyEnterDeathSaves()` if hp≤0 |
| `_showLevelUpModal(lvl)` | 10395 | Apply HP roll + ASI/gifts + bonus HP roll for Lv7/10/13/18; populate modal DOM | `S_story.level/xp`, `FIGHTER_FEATURES` | `S_story.hp/hpMax`, tattoos; DOM modal |
| `_checkLevelUp()` | 10451 | Advance S_story.level if XP threshold crossed; fill queue | `S_story.xp/level`, `XP_LEVELS` | `S_story.level`; `_levelUpQueue.push()` |
| `_overlayFlee()` | 10460 | Flee dispatcher: clean flee (after attack) vs mutual (before attack) | `battleTurn`, `usedMainAttack`, `usedBonusAction` | calls `_storyFleeClean()` or `_storyFleeMutual()` |
| `_storyFleeClean()` | 10469 | Clean flee after player attack: exits battle, no penalty | `S_story.usedBonusAction` | `pendingBattle = null`; battle overlay closed |
| `_storyFleeMutual()` | 10479 | Mutual flee: both combatants swap one free attack | `S.player/enemy.*` | `S.opp.hp`, `S.player.hp`, `S_story.hp` |
| `_renderSboShield()` | 10537 | Shows/hides shield row in battle overlay; disables unequip btn unless bonus-action phase | `S_story.equippedShield`, `usedMainAttack`, `usedBonusAction`, `battleTurn` | DOM `#sbo-shield-row`, `#sbo-shield-name`, `#btn-sbo-unequip-shield` |
| `_storyUnequipShield()` | 10548 | Unequips shield as bonus action after main attack; triggers enemy turn | `usedMainAttack`, `usedBonusAction`, `equippedShield` | `equippedShield=null`, `inventory.push()`, `_calcPlayerAc()`, `battleTurn='enemy'` |
| `storyShortRest(nodeCode)` | 10597 | Heals 25% hpMax (×2 if not inn); Necklace Token if first visit; 0 rests → BFS waypoint to inn | `S_story.shortRests/hpMax`, `nodeCode` | `S_story.hp`, `shortRests--` |
| `_storyUpdateDsPips()` | 10647 | Renders success/failure pip indicators | `storyDeathSaves.successes/failures` | DOM sbo-ds-pip elements |
| `_storyEnterDeathSaves()` | 10655 | Enters death save UI; hides action row; shows DS panel | — | `storyDeathSaves = {0,0,true}` |
| `_storyRollDeathSave()` | 10669 | Rolls one death save d20; handles Indomitable reroll | `storyDeathSaves`, `indomitableCharges` | `storyDeathSaves.successes/failures`, `indomitableCharges` |
| `_storyDeathSaveCrawl()` | 10711 | 3-success path: hp=1; close battle; storyEnter() | — | `S_story.hp=1`, `pendingBattle=null` |
| `_storyDeathSaveFall()` | 10728 | 3-failure path: strip gold+items to corpse; respawn at checkpoint | `pendingBattle.nodeCode`, `inventory`, `gold` | `corpsesQuests.push()`, `gold=0`, `inventory` stripped, `currentCode=checkpointNode` |
| `_storyRetrieveCorpse(questId)` | 10797 | Retrieves items+gold from a corpse quest back to inventory | `corpsesQuests`, questId | `inventory` restored, `gold` restored, corpse quest removed |
| `_storyBattleVictory()` | 10071 | Award XP/gold/HP; collect drops; show victory overlay | `S.opp.ac/maxHP`, `S._pendingDrop` | `S_story.xp/gold/hp`, `defeatedBattles`, `inventory` |
| `storyStalk(nodeCode)` | 13626 | Opens stalk modal with quest-target list; "Wait for Prey" → battle | `nodeCode`, `QUEST_DB`, `WORLD_DB` | DOM stalk modal |
| `storyQuickWait(nodeCode)` | 13671 | SE d-pad ⏳: picks random monster via `_weightedMonsterPick()`, starts battle | `nodeCode`, `WORLD_DB` | `S_story.pendingBattle` |
| `storyShowOutcome()` | 16315 | Shows outcome modal pre-filled with post-battle HP | `S_story.pendingBattle`, `S.player.hp` | DOM outcome modal |
| `storyApplyOutcome(won)` | 16324 | Applies battle result back to S_story: HP, defeat flag, loot, EB quest | `outcome-hp-input`, `pendingBattle`, `S._pendingDrop` | `S_story.hp`, `defeatedBattles`, `quests`, `inventory`, `waypoint` |
| `storyCharToggle()` | 16710 | Opens/closes char overlay; syncs simulator inputs from S_story when story active | `S_story.*` | DOM char overlay, `syncCharFromUI()` |
| `storyRenderCharSheet()` | 16732 | Renders char overlay: stats, ability grid, gear, 20-level interleaved prog table | `S_story.*`, `FIGHTER_FEATURES` | DOM char sheet elements |
| `_lu_applyGiftsAndFinish(lvl, hp)` | 17489 | Shared helper: apply gold/shield gifts, push to levelUpLog, enable continue | `lvl`, `hp`, `_LEVEL_GOLD_GIFT`, `_LEVEL_SHIELD_GIFT` | `S_story.gold`, `inventory`, `levelUpLog.push()` |
| `_notoriety()` | 17043 | Compute notoriety from level + battlesWon (pure, no side effects) | `S_story.level/battlesWon` | returns int |
| `_notorietyWeights(n)` | 17048 | Map notoriety → {trivial,easy,medium,hard,deadly} weight object | n (notoriety score) | returns weight object |
| `_weightedMonsterPick(terrain)` | 17057 | Pick random monster weighted by notoriety tier weights | `terrain`, `WORLD_DB`, `MONSTER_POOL` | returns monster object |
| `_stalkedMonsterPick(terrain)` | 17199 | Same + BOOST=6 for quest-target monsters | `terrain`, `QUEST_DB`, active quests | returns monster object |


---
*© 2026 roll2hit.com — MIT License. See [LICENSE](LICENSE) for full text.*
