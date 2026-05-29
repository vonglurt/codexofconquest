<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Roll2Hit — The Shattered Codex: Economy, NPCs & Engine Reference

## Overview

This document covers Story Mode economy and narrative systems, plus the full state field reference and F4 function reference. Combat mechanics (Battle Mode, action economy, XP, equipment) are in `mechanics-combat.md`.

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

### Romance Layer (§RESEARCH-01 — ✅ Implemented 2026-05-25)

Three consts add an ambient emotional layer to NPC favorability at fav ≥ 2. No mechanical effect — mood only.

**`NPC_ROMANCE_PREAMBLES`** (HTML line 12020) — 6 entries keyed by NPC key (`yael`, `brynn`, `quill`, `pachelbel`, `crov`, `auros`). One line per NPC, injected as an italic paragraph in `_renderNpcCard()` between the greeting and the dialogue quote, only when `fav[npc] ≥ 2`. Describes a silent recognition beat: *"She looks up before you reach the corner."* / *"The cup is already on the table."*

**`NPC_ROMANCE_VIGNETTES`** (HTML line 12030) — 6 entries, one per NPC. Multi-sentence scenes delivered via `storyConfirmSleep()` at 1400 ms delay after sleeping at an inn, when:
- `fav[npc] ≥ 2`
- NPC's home node is in the last 3 moves or current node
- Flag `npcRomanceVignetteDelivered[npcKey]` not set (once per NPC per run)

**`ROMANCE_QUOTES`** (HTML line 8164) — 21-entry array. Passages in a Chrétien de Troyes register adapted to the game's voice. Fires at 15% chance per inn sleep when `actNumber ≥ 3`. Never repeats (index stored in `S_story.romanceQuotesDelivered[]`).

| Const | Line | State field | Gate |
|-------|------|-------------|------|
| `NPC_ROMANCE_PREAMBLES` | 12065 | none | `fav ≥ 2` |
| `NPC_ROMANCE_VIGNETTES` | 12075 | `npcRomanceVignetteDelivered{}` | `fav ≥ 2` + NPC node nearby + once-per-run |
| `ROMANCE_QUOTES` | 8164 | `romanceQuotesDelivered[]` | Act III+ · 15% per sleep · no repeat |

See `plan.md §RESEARCH-01 §III` for full design notes and source texts.

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
| `S_story.abilityScores` | object | STR/DEX/CON/INT/WIS/CHA scores; set by character creation (base {str:10,dex:10,con:10,int:8,wis:8,cha:8} + point-buy); legacy saves fall back to {str:16,dex:12,con:14,int:10,wis:12,cha:8} |
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
| `LOOT_TABLE` | const array[20] | d20 drop table — dead code (replaced by `_D100_TABLE` at Layer 25); kept for reference only |
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
| `FROBERGER_JOURNAL` | const array | 41 entries `{entryNum, nodeCode, readAloud, text}`; 10 read-aloud at key nodes + 31 collectible scattered |
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

> All 29 line numbers verified against `roll2hit-v3.html` (17,762 lines) · 2026-05-26 (SP4 annotation pass)

| Function | Line | Purpose | Key data read | Key data written |
|----------|------|---------|---------------|-----------------|
| `storyPreBattle(node)` | 16179 | Opens pre-battle overlay; initialises conditions and stealth panels | `node.battle`, `defeatedBattles` | `_preBattNode`, `_selectedConds`, `S_story.surpriseAdvantage` |
| `_renderPreBatt()` | 16229 | Populates pre-battle overlay DOM (title, threat, cost preview, cond list) | `_preBattNode`, `_selectedConds`, `CONDITION_ITEMS`, `CONDITION_GOLD` | DOM prebatt-* elements |
| `_toggleCond(i)` | 16304 | Toggles condition index in _selectedConds; re-renders cost | `_selectedConds` | `_selectedConds`; calls `_renderPreBatt()` |
| `storyCommitBattle()` | 16327 | Deducts condition gold; writes pendingBattle; loads monster; applies conditions | `_selectedConds`, `CONDITION_GOLD`, `CONDITION_ADV`, `MONSTER_POOL` | `S_story.gold`, `pendingBattle`, `S.opp.cond/adv` |
| `storyVendorToggle()` | 9028 | Opens/closes vendor overlay; closes other overlays | DOM state | DOM story-vendor-overlay |
| `storyRenderVendor()` | 9041 | Renders full vendor panel: sell list, shields, specials, whiskey | `S_story.inventory`, `currentCode`, `npcFavorability` | DOM vendor-* elements |
| `_renderVendorShields()` | 9256 | Renders purchasable shield tiers; _magicTierAllowed() gate | `SHIELD_ITEMS`, `S_story.level`, `equippedShield` | DOM vendor shield list |
| `_renderPachelbelSpecials()` | 9079 | Renders fav-gated/act-gated Pachelbel special items at BA | `npcFavorability['pachelbel']`, `actNumber`, `S_story.inventory` | DOM pachelbel-specials element |
| `storySellAll()` | 9188 | Removes all sell>0 items from inventory; credits gold | `S_story.inventory` | `S_story.inventory`, `S_story.gold` |
| `storySellEquipment()` | 9199 | Sells unequipped weapons/shields from inventory | `S_story.inventory`, equipped tiers | `S_story.inventory`, `S_story.gold` |
| `storyBuyPotion(tier)` | 9228 | Purchases potion of given tier; gold check | `POTION_TIERS[tier]`, `S_story.gold` | `S_story.gold`, `S_story.inventory` push |
| `storyBuyShield(tier)` | 9243 | Purchases and equips shield; _magicTierAllowed() gate | `SHIELD_ITEMS`, `S_story.level/gold` | `equippedShield`, `S_story.gold` |
| `storyBuyFlashbang()` | 9285 | Purchases Flashbang condition item | `S_story.gold` | `S_story.gold`, inventory push |
| `storyBuyWhiskey()` | 9296 | Purchases Rough Whiskey; sets roughWhiskeyActive | `S_story.gold` | `S_story.gold`, `roughWhiskeyActive = true` |
| `_autoSellDuplicates()` | 8972 | Auto-sells duplicate weapons/daggers/shields; idempotent per node | `lastAutoSellNode`, `inventory`, equipped tiers | `inventory` filtered, `S_story.gold`, `lastAutoSellNode` |
| `storyCollectLoot(node)` | 13089 | Collects node loot on first visit; parses multi-item `loot` field | `node.loot`, `visited[code]` | `visited[code]`, inventory push, `S_story.shards` |
| `_rollD100Loot()` | 9472 | Rolls d100 weighted loot table; 3 attempts before fallback | `_D100_TABLE`, `S_story.level/inventory`, `_magicTierAllowed()` | returns item object |
| `_d100Result(r)` | 9466 | Maps roll 0–99 to _D100_TABLE row by cumulative weight | `_D100_TABLE` | returns row object |
| `_rollMonsterWeaponDrop(dmgDie)` | 9520 | Monster-specific weapon drop filtered by die ≤ dmgDie | `WEAPON_ITEMS`, owned weapon tiers | returns weapon object\|null |
| `_magicTierAllowed(magic)` | 9441 | Returns true if level ≥ magic × 5 | `S_story.level` | none (predicate) |
| `storyRenderInventory()` | 13915 | Renders full inventory panel with equipped items + grouped sections | `S_story.inventory`, equipped items | DOM inventory overlay |
| `_checkLevelUp()` | 10463 | Checks XP vs threshold; increments level; recurses for multi-gain | `S_story.xp/level`, `XP_LEVELS` | `S_story.level`, `_levelUpQueue.push()` |
| `_showLevelUpModal(lvl)` | 10407 | Opens level-up modal; populates feature/HP/ASI sections | `FIGHTER_FEATURES[lvl]`, `_ASI_LEVELS`, `S_story.xp` | `_lu_pending`; DOM levelup-modal |
| `_lu_refreshAsiBtns()` | 10398 | Disables capped (≥20) or exhausted ASI buttons | `_lu_pending.asiRemaining`, `abilityScores` | DOM .lu-asi-btn disabled states |
| `_lu_applyGiftsAndFinish(lvl, hp)` | 17543 | Awards gold gift + magic shield; closes modal; autosaves | `_LEVEL_GOLD_GIFT[lvl]`, `_LEVEL_SHIELD_GIFT[lvl]` | `S_story.gold`, `equippedShield`, `tattoos`, `levelUpLog` |
| `storyUpdateStatus()` | 15967 | Refreshes all status bar elements (HP, gold, day, level, XP bar) | All S_story display fields | DOM status bar elements |

---

*© 2026 roll2hit.com — MIT License. See [LICENSE](LICENSE) for full text.*
