# Combat UI Design Report: Character Progression, Tactical Consumables & Condition Economy

**Roll2Hit v3 — Engineering Design Documentation**  
**Series:** Game Design Analysis & Implementation Record  
**Classification:** Human-Computer Interaction · Game Mechanics · Rapid-Play UI Design  
**Date:** 2026-05-21  
**Author:** Roll2Hit Development Record  
**Status:** Complete — Layer 18 implemented and verified against `roll2hit-v3.html` (8,236 lines)

---

## Abstract

This report documents the design rationale and implementation of Layer 18 of *The Shattered Codex* narrative engine, comprising four interconnected systems: (1) a ten-level character progression system tied to the existing XP economy, (2) the Flashbang tactical consumable, a guaranteed-advantage combat item that formalizes the 0.5-action item economy, (3) a ×100 repricing of the condition gold cost system to reflect the genuine power of pre-battle tactical setup, and (4) a design analysis of the broader item-as-bonus-action economy in the context of rapid-play single-session game design.

The unifying thesis is that in a rapid-play combat interface — one where a complete narrative arc must fit within a single session — every mechanical addition must pay for itself in decision density per second of play, not in absolute mechanical richness. The systems documented here were designed against that constraint.

---

## I. Design Context: The Rapid-Play Constraint

### I.A Definitions

A **rapid-play** game is one where the unit of player engagement is measured in seconds-per-decision rather than minutes-per-turn. Roll2Hit's story battle overlay is a rapid-play interface: the player makes 2–4 decisions per round (attack, bonus action, enemy fires, next round begins), and a full battle resolves in under two minutes of real time.

This is distinct from tabletop D&D, where a single attack roll involves physical dice, verbal narration, table consensus, and bookkeeping. In Roll2Hit, the dice are virtual, the narration is a one-line log message, and bookkeeping is automatic. The interface must be optimized for *decision clarity* rather than *rule fidelity*.

### I.B The 0.5-Action Economy as a Rapid-Play Mechanism

Prior to Layer 17, the story battle system used a binary turn model: player acts, enemy acts. Layer 17 introduced the 1.5 AP (action point) economy — one main action (attack) plus one 0.5 bonus action (offhand, heal, spell, or pass). This design has a specific rapid-play property: **every round has exactly two player decision points**, separated by an enemy turn. The structure is:

```
[Player Main] → [Bonus Phase Decision] → [Enemy Turn] → [Next Round]
```

The bonus phase is the creative space. It is where the player's tactical identity emerges: aggressive (offhand), defensive (potion), setup (spell scroll or flashbang), or conservative (wimper/pass). The fixed two-decision structure keeps rounds fast while giving the player a meaningful secondary choice.

Layer 18 adds new options to the bonus phase (Flashbang) without expanding the number of decisions per round. It also introduces character levels, which gradually expand the *power* of those decisions without adding *more* decisions. This is the correct direction for rapid-play design: deepen existing decisions rather than add new ones.

---

## II. Character Progression System

### II.A Design Goal

XP was awarded after every battle since Layer 12, but had no downstream effect. This created a motivational dead end: the player could see the XP counter accumulating but could draw no inference about what it meant for their character. The level system closes that loop.

The explicit design constraints were:

1. **Session-completable**: A normal playthrough (30–40 battles at mixed difficulty) should reach levels 5–7. Levels 1–4 must feel like early-game progression. Levels 8–10 are for dedicated players who fight everything.
2. **Rewards must be tangible in battle**: The player should be able to feel the difference between Level 1 and Level 5 in a fight.
3. **No new UI complexity**: Levels should not require the player to make build choices, allocate stat points, or read a menu. Rewards are automatic and announced.

### II.B XP Economy Analysis

The XP award formula (established in Layer 12) is:

```
XP = OpponentAC × OpponentMaxHP
```

This formula scales XP with enemy difficulty, since both AC and HP are higher for harder monsters. Empirical range:

| Enemy Tier | Typical AC | Typical HP | XP Range |
|---|---|---|---|
| Trivial | 9–11 | 10–20 | 90–220 |
| Easy | 12–13 | 20–35 | 240–455 |
| Medium | 14–15 | 35–60 | 490–900 |
| Hard | 16–17 | 60–100 | 960–1,700 |
| Deadly | 18–20 | 100–150 | 1,800–3,000 |

A representative 35-battle playthrough with mixed difficulty yields approximately 25,000–35,000 total XP. This informed the `XP_LEVELS` threshold design.

### II.C XP_LEVELS Const

```js
const XP_LEVELS = [0, 500, 1500, 4000, 8000, 15000, 25000, 40000, 60000, 90000];
```

Index semantics: `XP_LEVELS[N]` is the cumulative XP required to reach level `N+1`. Level 1 requires 0 XP (starting level). Level 10 requires 90,000 XP (reachable only in a maximum-combat run).

| Level | XP Required | XP Gap | Typical Fights to Reach |
|---|---|---|---|
| 2 | 500 | 500 | 2–4 trivial |
| 3 | 1,500 | 1,000 | 3–5 easy |
| 4 | 4,000 | 2,500 | 4–6 medium |
| 5 | 8,000 | 4,000 | 4–5 hard |
| 6 | 15,000 | 7,000 | 5–8 mixed |
| 7 | 25,000 | 10,000 | 7–10 mixed |
| 8 | 40,000 | 15,000 | 10+ mixed |
| 9 | 60,000 | 20,000 | 15+ hard |
| 10 | 90,000 | 30,000 | Max-combat run |

### II.D Level Rewards

All rewards are automatic — no player action required. The `_checkLevelUp()` function fires immediately after XP is awarded in `_storyBattleVictory()`, applies rewards, and populates the victory overlay's `#svo-levelup` banner.

```js
const _LEVEL_REWARDS = {
  2:  { hp:10 },
  3:  { hp:10, atk:1, label:'⚔ Proficiency' },
  4:  { hp:10 },
  5:  { hp:10, ac:1,  label:'🛡 Toughened Skin' },
  6:  { hp:10, atk:1, label:'⚔ Veteran Strike' },
  7:  { hp:10 },
  8:  { hp:10, ac:1,  label:'🛡 Battle Hardened' },
  9:  { hp:10, atk:1, label:'⚔ Expert Aim' },
  10: { hp:20, atk:2, ac:2, label:'🏆 Champion' },
};
```

By Level 10, cumulative bonuses are: **+100 max HP**, **+5 to all attack rolls**, **+4 AC**. These compound with equipped shields and base character stats.

**Design note on HP scaling:** +10 max HP per level was chosen because the post-battle heal formula (`0.1 × AC × maxHP`) also scales with max HP. A higher-level character recovers more HP per kill, creating a self-reinforcing survivability arc that feels earned rather than arbitrary.

### II.E Implementation: `_checkLevelUp()`

The function is recursive to handle multi-level gains in a single battle (e.g., a deadly boss fight at low level might award enough XP to jump two levels). Recursion terminates when `S_story.xp < XP_LEVELS[S_story.level]` or when level 10 is reached.

```js
function _checkLevelUp() {
  const cur = S_story.level || 1;
  if (cur >= XP_LEVELS.length) return; // max level
  if (S_story.xp < XP_LEVELS[cur]) return;
  // ... apply rewards, update overlay, recurse
  _checkLevelUp();
}
```

**State fields added:**
- `S_story.level` (default: 1) — current character level
- `S_story.atkBonus` (default: 0) — permanent attack roll modifier from leveling
- `S_story.acBonus` (default: 0) — permanent AC modifier from leveling

**Integration points:**
- `_overlayPlayerAttack()`: `atkTotal = d20Val + atkMod + profB + (S_story.atkBonus || 0)`
- `_calcPlayerAc()`: `base + shieldBonus + (S_story.acBonus || 0)`
- `storyUpdateStatus()`: `⭐ Level` row showing current level + XP/threshold progress
- `_storyBattleVictory()`: `_checkLevelUp()` called after XP award, before overlay render

### II.F Victory Overlay Integration

The `#svo-levelup` element (hidden by default) appears when a level-up occurs, displaying a gold-highlighted banner:

```
⭐ Level Up! Now Level 3 — ⚔ Proficiency · +10 max HP · +1 ATK
```

The `#svo-xp-total` line now also shows contextual XP progress:

```
Lv 3 · 1,840 XP · 2,160 to Lv 4
```

or at max level:

```
Lv 10 · 91,500 XP · MAX
```

---

## III. Flashbang: Guaranteed-Advantage Tactical Consumable

### III.A Design Problem

Spell Scrolls (Layer 16) introduced the concept of in-combat consumable items that grant advantage as a bonus action. However, spell scrolls require a DC skill check (`d20 ≥ AC − 2`), meaning their success rate varies from 40–75% depending on the character's armor class. This DC mechanic adds appropriate risk for a scroll-based arcane ability, but also means spell scrolls are unreliable at low AC.

A complementary item was needed that offered **guaranteed** advantage — a purely tactical throw-and-forget device with no skill component. This is the Flashbang.

### III.B Flashbang Design

| Property | Value |
|---|---|
| Icon | 💥 |
| Type | `'flashbang'` |
| Cost | 150 gp |
| Sell-back | 75 gp |
| Effect | Sets `spellAdvantageReady = true` — guaranteed ADV on next attack |
| DC check | None |
| Action cost | 0.5 (bonus action, after main attack) |
| Inventory section | 💊 Consumables |
| Stack behavior | One per inventory slot, multiple carriable |

**Contrast with Spell Scroll:**

| | Spell Scroll | Flashbang |
|---|---|---|
| ADV type | Arcane (skill check) | Physical (always works) |
| Success rate | 40–75% | 100% |
| Cost | 50 gp (loot drop value) | 150 gp (vendor purchase) |
| Shield restriction | Yes (free hand) | Yes (free hand) |
| When ADV fires | Next attack | Next attack |

The guarantee premium (150 vs 50 gp) reflects the reliability differential. A player who wants certainty pays for it. A player who wants efficiency gambles on scrolls.

### III.C The "Surprise Attack" Framing

The user's design brief framed Flashbang as a "surprise attack" item — something thrown at the moment of engagement to disorient the enemy before the real strike lands. In rapid-play terms, this framing maps to:

1. Use Flashbang as bonus action at end of Round 1
2. Enemy fires (Round 1 closes)
3. Round 2 main attack fires with ADV (the "surprise" lands)

The one-round delay between the throw and the advantage is narratively coherent: the flashbang needs a moment to take effect. The player sacrifices their Round 1 bonus action (no offhand, no heal that round) in exchange for a guaranteed Round 2 opening strike. This is a meaningful tactical trade.

### III.D Action Economy Implication: The Three-Potion Strategy

The Flashbang's formalization of item-use-as-bonus-action has an important emergent consequence for healing. All item uses — potions, spell scrolls, flashbangs — cost the 0.5 bonus action slot. This means:

- **One heal per round**: A player can use exactly one healing potion per round (as a bonus action).
- **Three heals in three rounds**: If a player uses Wimper (pass) as their main action and a potion as their bonus action, they can recover 3× heal amounts over 3 consecutive rounds — while taking 3× enemy attacks in return.

This is the "super-heal" strategy: viable if the player has high enough AC to survive the incoming damage. The cost is giving up three attack opportunities. The D&D analogue is a character with high Constitution choosing to stabilize rather than press an attack.

The game does not explicitly flag this strategy. It emerges from the consistent application of one rule (items = bonus action) across all consumable types. Emergent strategy depth from consistent rule application is a mark of clean system design.

---

## IV. Condition Economy: ×100 Gold Repricing

### IV.A Original Pricing

The original `CONDITION_GOLD` table priced condition item use at 10–50 gold:

```js
// ORIGINAL (Layers 11–17):
const CONDITION_GOLD = {
  'Earthbind Root':15, 'Binding Web':15, 'Smoke Bomb':20, 'Flash Powder':20,
  'Signal Jammer':30, 'EMP Grenade':40, 'Void Virus':35, 'Snare Trap':15,
  'Neurotoxin':40, 'Thunderstone':30, 'Basilisk Eye':50, 'Feint Scroll':10,
};
```

### IV.B The Pricing Problem

At 10–50 gold, condition items cost approximately the same as a Minor Healing Potion (50 gp at vendor). This radically underprices their tactical value:

- **Basilisk Eye** (Petrified) grants ADV + auto-crit on all attacks. At 50 gold, this is essentially free against a Deadly encounter worth 2,000+ XP and hundreds of gold in drops.
- **Neurotoxin** (Paralyzed) grants ADV + auto-crit on melee. At 40 gold, this is cheaper than a Minor Potion and far more powerful in combat.
- **Earthbind Root / Binding Web / Snare Trap** (Prone/Restrained/Grappled) grant ADV on all attacks. At 15 gold, these are essentially free relative to any encounter reward.

The net effect: a player who stockpiles condition items can trivialize any encounter by pre-applying a condition in the pre-battle screen. The conditions split their power equally among their effect set (ADV + status), but the pricing didn't reflect this.

### IV.C Revised Pricing

```js
// LAYER 18:
const CONDITION_GOLD = {
  'Earthbind Root':1500, 'Binding Web':1500, 'Smoke Bomb':2000, 'Flash Powder':2000,
  'Signal Jammer':3000, 'EMP Grenade':4000, 'Void Virus':3500, 'Snare Trap':1500,
  'Neurotoxin':4000, 'Thunderstone':3000, 'Basilisk Eye':5000, 'Feint Scroll':1000,
};
```

The ×100 multiplier maps condition use costs to meaningful portions of the player's gold economy:

| Tier | Examples | Old Cost | New Cost | As % of Typical 5K Gold |
|---|---|---|---|---|
| Light | Feint Scroll | 10 gp | 1,000 gp | 20% |
| Standard | Earthbind Root, Prone-class | 15 gp | 1,500 gp | 30% |
| Heavy | Signal Jammer, Thunderstone | 30 gp | 3,000 gp | 60% |
| Premium | Neurotoxin, EMP Grenade | 40 gp | 4,000 gp | 80% |
| Elite | Basilisk Eye | 50 gp | 5,000 gp | 100% |

At the new pricing, using a Basilisk Eye against a Deadly encounter costs roughly the full gold reward from that encounter (`0.1 × 18 × 120 = 216 gp` from kill; but stockpiled gold from many battles). Condition use is now a significant tactical investment, not a routine preamble.

### IV.D The Cooperative DM Principle Applied

The Cooperative DM Principle (established in Layer 12) states that the game should never create unwinnable states, but also should not trivialize player choices. The original condition pricing violated the second clause: it made the *not using a condition item* choice obviously suboptimal in any encounter where the player had one. At ×100 pricing, both choices — use a condition item, or save the gold — are genuinely meaningful.

---

## V. Unified Item Economy in Rapid-Play Combat

### V.A Item Type Taxonomy (as of Layer 18)

| Item Type | Source | In-Battle Use | Action Cost | Effect |
|---|---|---|---|---|
| Potion (minor/healing/greater/superior) | Vendor / loot drop | Bonus action | 0.5 | Heals N HP |
| Spell Scroll | Loot drop (d20 table) | Bonus action | 0.5 | ADV on next attack if d20 ≥ AC−2 |
| Flashbang | Vendor | Bonus action | 0.5 | ADV on next attack (guaranteed) |
| Condition Item | Pre-existing inventory | Pre-battle (gold cost) | Bonus action (round 1) | Applies condition to opponent for 3 rounds |
| Shield | Vendor | Equip/unequip (bonus action) | 0.5 | +1/+2 AC; blocks bonus-action items while held |

### V.B The Single Rule: All Items = 0.5 Action

Every consumable and equipable in the above table costs exactly 0.5 of the player's action budget. This single consistent rule has high leverage:

1. **No item is unequivocally optimal.** A flashbang (0.5 action) competes for the same slot as a healing potion (0.5 action). In a round where you need HP, the flashbang is wrong. In a round where you're near-full HP facing a high-AC enemy, the flashbang may be optimal.

2. **The shield is a trade, not a buff.** Equipping a shield (+1 or +2 AC) permanently eliminates access to the 0.5-action item economy *while equipped*. The player can unequip mid-combat as a bonus action, trading the AC bonus for a round of item access. This is a dynamic trade, not a static equipment slot.

3. **Three-potion healing is real but costly.** Because potions are 0.5-action items and the player has one bonus action per round, the maximum healing rate is 1 potion per round. Over three rounds of non-attack healing, the player absorbs three enemy attacks. This strategy is viable at high AC and high max HP — attributes that come precisely from leveling. The systems are coupled.

4. **Condition items fit the taxonomy.** Condition items are used in the pre-battle screen and cost a gold toll rather than an action. But their effect (3-round ADV on player attacks) is equivalent to three consecutive flashbangs — they are the bulk-rate premium pre-purchase version of the in-combat flashbang. At ×100 pricing, the economic equivalence now makes intuitive sense: 5,000 gp for three rounds of auto-ADV vs. 450 gp for three flashbangs (3 × 150 gp). Conditions are worth the premium because they also apply a status effect to the opponent.

### V.C Rapid-Play UI Implications

The battle overlay surfaces item options contextually — buttons are only enabled when the item's action slot is available:

- Potion, scroll, and flashbang buttons are **disabled during the main action phase** and **enabled in the bonus phase**.
- Shield unequip is **enabled during the bonus phase** (costs the slot).
- All buttons are **disabled during the enemy turn** (turn enforcement prevents input during animation).

This means the player is never presented with an invalid option in an enabled state. The UI enforces the action economy, so the player learns the rules by interacting with it — not by reading documentation.

---

## VI. Verification Manifest

All Layer 18 items verified against `roll2hit-v3.html` (8,236 lines):

| Item | Implementation | Verified |
|---|---|---|
| `CONDITION_GOLD` ×100 | Lines ~5979–5983; all values multiplied | ✅ |
| `COMBAT_ITEMS` const | `[{ name:'Flashbang', icon:'💥', type:'flashbang', cost:150, sell:75 }]` | ✅ |
| `storyBuyFlashbang()` | Gold check, inventory push, vendor re-render, storyMsg | ✅ |
| Flashbang vendor HTML | Buy-item row with `#btn-buy-flashbang`; 150gp description | ✅ |
| `btn-buy-flashbang` listener | `storyBuyFlashbang` wired in event listener block | ✅ |
| `_renderSboSpells()` flashbang branch | Orange-border button; no DC check; calls `_storyUseFlashbang(idx)` | ✅ |
| `_storyUseFlashbang()` | Guard checks → splice inventory → `spellAdvantageReady = true` → `usedBonusAction = true` → enemy turn | ✅ |
| Flashbang in Consumables section | `storyRenderInventory()` filter includes `type === 'flashbang'` | ✅ |
| `'flashbang'` in `knownTypes` | Excluded from Trophies catch-all | ✅ |
| `_playerHasBonusOptions()` flashbang check | `inventory.some(i => i.type === 'flashbang')` | ✅ |
| `S_story.level` default 1 | Both `S_story` init and `_S_DEFAULTS()` | ✅ |
| `S_story.atkBonus` default 0 | Both `S_story` init and `_S_DEFAULTS()` | ✅ |
| `S_story.acBonus` default 0 | Both `S_story` init and `_S_DEFAULTS()` | ✅ |
| `XP_LEVELS` const | 10-entry cumulative threshold array | ✅ |
| `_LEVEL_REWARDS` const | 9 level entries (Lv2–Lv10); hp/atk/ac/label fields | ✅ |
| `_checkLevelUp()` | Recursive; applies HP/ATK/AC; populates `#svo-levelup`; max-level guard | ✅ |
| `_checkLevelUp()` called in `_storyBattleVictory()` | After XP award, before overlay populate | ✅ |
| `_overlayPlayerAttack()` atkBonus | `atkTotal = d20Val + atkMod + profB + (S_story.atkBonus \|\| 0)` | ✅ |
| `_calcPlayerAc()` acBonus | `base + shieldBonus + (S_story.acBonus \|\| 0)` | ✅ |
| `#s-level` status bar row | `⭐ Level` label; `storyUpdateStatus()` writes level + XP/threshold | ✅ |
| `#svo-levelup` HTML element | Hidden by default; shown with gold styling when level-up occurs | ✅ |
| `#svo-xp-total` contextual line | `Lv N · X XP · Y to Lv N+1` or `Lv 10 · X XP · MAX` | ✅ |

---

## VII. Design Retrospective: What Makes a Good Rapid-Play Addition

Each Layer 18 addition satisfies a checklist for rapid-play game design additions:

**Character Levels:**
- ✅ Uses existing XP counter — no new UI surface required
- ✅ Rewards are automatic — zero player overhead per level-up
- ✅ Rewards are tangible in play — +ATK is visible in the battle log; +HP is visible on the status bar
- ✅ Does not add decision points — levels happen, they don't demand choices
- ✅ Scales with session length — casual players reach level 4–5; dedicated players reach level 8–10

**Flashbang:**
- ✅ One rule: bonus action, guaranteed ADV
- ✅ Reuses existing `spellAdvantageReady` machinery — zero new state paths
- ✅ Clear trade: flashbang OR offhand/heal that round, never both
- ✅ Visible in the spell/items row — no UI discovery required
- ✅ Priced to make the decision non-trivial (150 gp vs. 50 gp scroll sell value)

**Condition Economy:**
- ✅ No new mechanics — price change only
- ✅ Restores meaning to the gold-vs-condition trade
- ✅ Aligns condition cost with their 3-round equivalent value
- ✅ Makes the "use or save" decision genuinely contested

**Item Economy Consistency:**
- ✅ One rule for all consumables (0.5 action)
- ✅ Player learns the rule by experiencing it, not reading it
- ✅ Creates emergent strategy (three-potion arc) without a dedicated mechanic for it

---

*Report written 2026-05-21*  
*Codebase: roll2hit-v3.html — 8,236 lines, Layers 0–18 complete*  
*Layer 18: Character Levels (1–10), Flashbang (150 gp guaranteed ADV), CONDITION_GOLD ×100*


---

MIT License — roll2hit.com — Copyright (c) 2026 — Free to use, modify, and share.