# UX Walkthrough: First Battles & First Level-Up

**Roll2Hit v3 — Player Experience Analysis**  
**Date:** 2026-05-21  
**Status:** Post-Layer 37 — starting weapons (Pointy Stick + Flint Dagger), Boyscout Token, SL node

---

## Starting State (New Game)

| Stat | Value |
|---|---|
| HP | 30/30 |
| Gold | 150 gp |
| Level | 1 · 0 / 500 XP |
| Short Rests | 3/3 |
| Main weapon | 🪵 Pointy Stick (1d4, no magic bonus) |
| Offhand weapon | 🗡 Flint Dagger (atkBonus: −3) |
| Inventory | 🗡 Rusted Dagger · 🧪 Minor Healing Potion × 2 |

The player begins at **CI — Birka City Streets**, the hub node of Act I. The status bar shows `⭐ Level 1 · 0/500 XP`. The Pointy Stick is the starting main weapon (1d4); the Flint Dagger offhand imposes a −3 attack penalty — deliberately weak, incentivizing early drops. North of CI is **SL — Birka Slums** (The Vermin Pit): a dead-end hunting ground with 12 trivial/easy vermin, ideal for safe first battles.

**Boyscout Token:** The first short rest taken at any node earns a **🏕 Necklace Token** collectible. The first sleep at any node also doubles HP heal dice (2×d10+CON instead of 1×d10+CON) — called a Boyscout Night.

---

## Pre-Battle: The First Fight

The player clicks a node with a battle chip. The map panel slides to show the pre-battle overlay:

```
⚔ [Enemy Name]          [Node Label]           💰 150gp

[⚔ Fight] [💣 Condition] [🎭 Stealth]

────────────────────────────────────────────
Enter combat directly — no special opener or gold cost.
────────────────────────────────────────────

        [⚔ Start Battle]   [← Retreat (safe)]
```

### Tab: Condition (💣)

All 12 condition items are visible but greyed out (can't-afford). A hint appears at the bottom:

> *Conditions unlock as you earn gold. Cheapest: Feint Scroll at 1,000 gp. Win battles to save up.*

The player sees that these are powerful tools — Paralyzed grants auto-crit, Petrified grants ADV + auto-crit — but they require investment. This is mid-game content, correctly priced.

### Tab: Stealth (🎭)

> *Roll d20 vs a random DC (5–16) — roughly 25–80% chance of success. Pass → you go first with ADV on your first attack. Fail → no effect, no gold cost. Free to attempt.*

The player clicks **🎭 Attempt Stealth Check**. They roll a 14 vs DC 9 — pass. The result shows: "✓ Stealth success — you move first with ADV on first attack." Now when they hit Start Battle, `surpriseAdvantage = true`.

### Retreat (safe)

The **← Retreat (safe)** button is always available with tooltip "Leave without fighting — no cost, no penalty." Clicking it closes the overlay and returns to the map — no mutual attacks, no penalty. This is important: the player can scout a battle node, decide the enemy is too strong, and walk away.

---

## Battle 1 — Normal Flow (Stealth ADV secured)

**Scenario:** Easy-tier zombie. AC 8, HP 22, ATK +3.

**Initiative:** Player rolled d20 (no tier mod for player) vs zombie d20−1. Stealth pass already gave player first turn.

**Round 1:**

```
⚡ 1.5  Attack · or Pass to open bonus (heal / flee)

[⚔ Attack]  [🗡 Offhand]  [🏃 Flee ⚠]  [😬 Pass attack]
```

- Flee shows **⚠** with tooltip "Flee at round start — both sides get a free attack!"
- Pass attack shows tooltip "Skip main attack — opens bonus phase (heal / flee safely)"

Player clicks **Attack**. ADV fires (from stealth): rolls 7 and 18, takes 18. With +5 modifier, total 23 vs AC 8 → HIT. Damage: 9. Zombie HP: 22 → 13.

```
⚡ 0.5  Bonus: heal · offhand · spell · flee · pass

[🗡 Offhand]  [🏃 Flee ✓]  [😬 Pass bonus]
[🧪 Minor Healing Potion] [🧪 Minor Healing Potion]
```

Player has no offhand weapon configured. Potion buttons appear. Flee now shows **✓** with tooltip "Clean exit — no mutual attacks." Player clicks **😬 Pass bonus** → enemy fires.

Zombie attacks: d20+3 vs player AC 13 → rolls 8 → total 11 → MISS.

**Round 2:** Player attacks again (no ADV). Rolls 16 + 5 = 21 vs AC 8 → HIT. Damage 6. Zombie HP 13 → 7. Bonus: pass. Zombie rolls 17+3 = 20 vs AC 13 → HIT. Player takes 4 damage. Player HP: 30 → 26.

**Round 3:** Player attacks. Rolls 11+5 = 16 → HIT. Damage 8. Zombie dies.

**Victory screen:**

```
⚔ Victory!
Defeated: Zombie

+176 XP
Lv 1 · 176/500 XP · 324 to Lv 2

+17 HP recovered
+17 gp looted

Drops
🧪 Minor Healing Potion
```

Player is at 26+17 = 43 HP (capped at 30) → 30/30. Gold: 150+17 = 167 gp. Gets a loot Minor Potion → inventory now has 3 potions.

---

## Battle 2 — Dangerous Enemy: Heal-Without-Attacking

**Scenario:** Hard-tier enemy appears at the next node. Player opens pre-battle:
- Stealth attempt: fails (rolled 4 vs DC 13)
- Enemy wins initiative → goes first

Enemy fires immediately (1.2s delay). Player takes 11 damage. HP: 30 → 19.

Player's turn:

```
⚡ 1.5  Attack · or Pass to open bonus (heal / flee)

[⚔ Attack]  [🏃 Flee ⚠]  [😬 Pass attack]
```

Player is at 19/30 HP — not critical yet. But the enemy is hard-tier with high AC. Player can:

**Option A — Attack and hope:** Attack, then if hit hard by enemy on their bonus, heal next round.

**Option B — Heal first:** Click **😬 Pass attack** → bonus phase opens:

```
⚡ 0.5  Bonus: heal · offhand · spell · flee · pass

[🏃 Flee ✓]  [😬 Pass bonus]
[🧪 Minor Healing Potion] × 3
```

Player drinks a potion: +10 HP → 29/30. Then enemy fires. Even if hit for 10, player stays at 19 HP (fighting range). Next round: player attacks with full health.

**Option C — Flee safely:** Click **😬 Pass attack** → bonus phase → **🏃 Flee ✓** → clean exit. No mutual attacks. Player retreats to map to heal with a short rest before retrying.

---

## Battle 3 — Flee from the Start (High-Level Enemy)

**Scenario:** Player navigates to a deadly-tier node by accident. Battle chip triggers. Pre-battle shows the enemy name — a Lich Remnant. Player decides to retreat.

Pre-battle: **← Retreat (safe)** → back to map, no cost.

But what if they accidentally hit Start Battle? They're now in combat:

```
⚡ 1.5  Attack · or Pass to open bonus (heal / flee)

[⚔ Attack]  [🏃 Flee ⚠]  [😬 Pass attack]
```

If they click Flee ⚠ directly: **mutual free attacks** — both sides roll. Lich Remnant has ATK +12. This could be fatal.

**Safe escape route:** Click **😬 Pass attack** → bonus phase → **🏃 Flee ✓** → clean exit, no damage taken.

The action economy makes safe retreat always available: Wimper main → Flee in bonus phase. The ⚠/✓ distinction on the flee button communicates the risk.

---

## First Level-Up (Battle 3–5)

After 3 more fights at mixed difficulty, total XP reaches ~520. Victory screen fires:

```
⚔ Victory!
Defeated: Forest Troll

+210 XP
Lv 1 · 520/500 XP · LEVEL UP!

⭐ Level Up! Now Level 2 · +10 max HP

+21 HP recovered
+21 gp looted
```

`S_story.hpMax` is now 40. `S_story.hp` increases by 10 (partial fill). Status bar updates: `⭐ Level 2 · 20/1,500 XP`. The player can immediately feel the difference — they're tankier.

---

## Mid-Game: First Condition Use (~1,000 gp accumulated)

After ~10 medium battles, gold is around 1,000–1,500 gp. A condition item is now affordable.

Player opens pre-battle. Condition tab:

```
💣 Condition Tab — active

☑ Feint Scroll          DODGE    1,000 gp
  +1 AC this combat · DIS on one enemy attack roll
☐ Earthbind Root        PRONE    1,500 gp  [greyed]
  ADV on all attacks vs target · target speed 0
...
```

Player selects Feint Scroll (1,000 gp). Summary shows: "DODGE · Total: 1,000 gp (you have 1,240 gp)." They hit Start Battle. Gold deducted. Enemy enters combat with Dodge condition — player gets +1 AC and the enemy has DIS on one attack roll. The investment was real (most of their gold), but so is the effect.

At higher gold (3,000+ gp), premium conditions like Thunderstone (Stunned) or Basilisk Eye (Petrified + auto-crit) become available — decisive tactical tools for boss fights or deadly encounters.

---

## Summary of UX Fixes Applied (Layer 18 post-patch)

| Issue | Fix |
|---|---|
| Empty starting inventory — no healing in first fight | 2 Minor Healing Potions + Rusted Dagger given at game start |
| 50 gp start — only 1 potion if at vendor | Starting gold raised to 150 gp |
| Condition tab empty/confusing for new players | Hint text: "Save gold from battles to unlock..." |
| Cancel pre-battle unlabeled | Renamed "← Retreat (safe)" with tooltip |
| Stealth DC range opaque | Description now says "roughly 25–80% chance" |
| Wimper skipped entire turn — couldn't heal without attacking first | Wimper now passes only the current phase; bonus opens after pass-attack |
| No safe flee path from round-start | Pass attack → bonus phase → Flee ✓ (clean exit, no mutual attacks) |
| AP row hint didn't mention flee or heal | Updated: "Attack · or Pass to open bonus (heal / flee)" |
| Wimper button label didn't distinguish phases | Context-aware: "😬 Pass attack" vs "😬 Pass bonus" with tooltips |


---

MIT License — roll2hit.com — Copyright (c) 2026 — Free to use, modify, and share.