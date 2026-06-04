<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report — Tattoo Progression System: Character Persistence, Death Economics, and Run Chronicle in a D&D 5e-Derived Single-File RPG

**IEEE Game Design & Systems Analysis — Technical Report**
**roll2hit.com · Layer Reference: §XLII – §XLVII**
**Date:** 2026-05-25
**Status:** ✅ IMPLEMENTED (commits 1445fc4, cab8865, e1c91e8, and current)

---

## Abstract

This report presents the design, analysis, and implementation of two interlocking character persistence systems in roll2hit.com: the *Tattoo System* and the *Chronicle System*. The Tattoo System uses permanent, death-persistent inventory entries (tattoos) to record all character progression decisions — ability score improvements, hit point rolls, and now death events — preserving build identity across the death-respawn cycle. The Chronicle System maintains two parallel statistical ledgers (career-wide and run-local) that passively accumulate gameplay telemetry: kills, deaths, damage dealt and received, battles fought, attack accuracy, exits taken, sleeps, and days adventuring. A time-of-day clock (0–23 hours) advances one hour per battle and six hours per sleep, providing sub-day temporal resolution for death event timestamps. Death itself is now written as a tattoo with a timestamp and location, permanently archived alongside the character's progression decisions. All systems are passive — no new game mechanics are surfaced to the player; the data accumulates silently behind the existing interfaces and is rendered in the character sheet and game-over modal.

**Index Terms** — ability score improvement, career statistics, character persistence, death mechanics, game balance, hit point progression, inventory economics, roguelite design, run statistics, tattoo ledger, temporal tracking

---

## I. Introduction

A recurring design problem in action role-playing games is the communication of *character identity* through mechanical systems. A character is defined not merely by their current equipment loadout but by the accumulated decisions that produced their statistical profile. Inventory items are transient: purchased, found, sold, and lost. But the choices made at critical progression milestones — which attributes to improve, where to invest hit points — constitute the permanent record of who the character *became*.

The game roll2hit.com (hereinafter "the system") presents an additional design challenge: the system employs an item-drop death mechanic in which all carried inventory is lost upon character death. This creates the desired economic loss aversion and strategic tension but introduces a secondary problem: if ability-improving items or equipment are treated as standard inventory, they too are lost upon death, potentially erasing hours of progression.

The Tattoo System resolves this tension through a bifurcated inventory architecture. All standard items occupy the normal inventory and are subject to the death-drop rule. Progression decisions are recorded as *tattoos*: permanent, non-droppable inventory entries. The Chronicle System extends this architecture to passive gameplay statistics, maintaining two parallel ledgers that diverge at each death: a run ledger that resets on respawn, and a career ledger that accumulates unconditionally across all deaths.

The contributions of this report are:

1. A formal specification of the tattoo as an inventory object with defined fields, rendering rules, and death-survival semantics.
2. An analysis of the HP-roll tattoo as a mechanism converting random outcomes into permanent historical records.
3. A balance analysis of Hard Mode (10/8/8/8/8/8) versus Custom Build starting modes.
4. A full specification of the Chronicle System including schema, hook sites, reset semantics, and display architecture.
5. A death tattoo specification encoding temporal (day + hour) and spatial (node) death coordinates.
6. Implementation-verified code examples for all systems.

---

## II. Background and Related Work

### II-A. Death Mechanics and Loss Aversion in RPGs

The use of item loss as a death penalty is well-documented in the game design literature. Dark Souls [6] and its successors employ a "souls on the floor" mechanic in which currency is lost at the death location and may be recovered in a subsequent attempt. NetHack and the Angband lineage [7] employ full permadeath. The roguelite genre [8] typically preserves some form of meta-progression across runs.

The system under analysis occupies an intermediate position. Character death triggers a respawn from the most recent checkpoint, but all carried inventory is forfeited. The tattoo category constitutes the meta-progression layer — achievement that persists across the death boundary.

### II-B. The D&D 5e Ability Score Improvement Framework

The Fighter class receives ASI events at levels 4, 6, 8, 12, 14, 16, and 19 — seven total events [4]. Each event grants exactly +2 points. HP follows the class Hit Die (d10) plus Constitution modifier.

### II-C. Permanent Body as Inventory

The tattoo mechanic is conceptually consistent with a body-as-archive design pattern. Disco Elysium [10] encodes the protagonist's past through psyche and body as readable, persistent state. The present system formalizes this intuition: decisions made at the moment of leveling are inked into the character's body, readable by any game system that needs to reconstruct the character's state.

---

## III. System Architecture

### III-A. The Three-Tier Persistence Model

All player-accumulated state falls into one of three tiers with distinct survival rules:

```
Tier 1 — Tattoos (decisions + death records)
  S_story.tattoos[]
  Survive death unconditionally. Written at: character creation (baseline),
  each level-up (ASI/HP), each death event (death tattoo).

Tier 2 — Chronicle (passive accumulated statistics)
  S_story.careerStats   never reset — accumulates across all deaths
  S_story.runStats      reset to zero on each respawn

Tier 3 — Inventory (droppable)
  S_story.inventory[]
  Cleared on death; gold goes to corpse quest.
```

### III-B. Tattoo Object Schema — Full Discriminated Union

```js
// Baseline — written at storyNewGame()
{
  type: 'tattoo', subtype: 'baseline', icon: '🌑', lvl: 0,
  name: 'Origin', sell: 0, drop: false,
  desc: 'Baseline · STR 10 · DEX 8 · CON 8 · INT 8 · WIS 8 · CHA 8',
  baselineScores: { str:10, dex:8, con:8, int:8, wis:8, cha:8 },
}

// ASI decision — written at level-up confirm
{
  type: 'tattoo', subtype: 'asi', icon: '⬆', lvl: 4,
  name: 'Lv4 ASI', sell: 0, drop: false,
  desc: 'STR+2',
  asiChanges: { str: 2 },
}

// HP roll — written at level-up confirm
{
  type: 'tattoo', subtype: 'hp_roll', icon: '❤', lvl: 4,
  name: 'Lv4 HP Roll', sell: 0, drop: false,
  desc: 'd10=7 + CON+1 = +8 HP',
  bonusHpRoll: 8,
}

// Death event — written at _storyDeathSaveFall()
{
  type: 'tattoo', subtype: 'death', icon: '💀',
  lvl: 7,          // level when died
  name: 'Fallen', sell: 0, drop: false,
  desc: 'Day 12 · 14:00 · Birka Slums',
  deathDay: 12, deathHour: 14,
  deathNode: 'SL', deathNodeName: 'Birka Slums',
  corpseQuestId: 'corpse_1748188800000',  // links to the body retrieval quest
}
```

The `drop: false` flag is checked by `_storyDeathSaveFall()` — it never touches `S_story.tattoos[]`. The `sell: 0` flag is checked by the vendor render function. Death tattoos are filtered out of `tattooByLvl` in `storyRenderCharSheet()` (line `if (t.subtype !== 'death') tattooByLvl[t.lvl] = t`) and rendered in a separate "Deaths" section, preventing collision with level-up tattoos at the same level number.

### III-C. The Reconstruction Algorithm

```
score[stat] = baseline[stat]
            + Σ delta[stat] for all ASI tattoos ≤ current level

hpMax = max(1, 10 + CON_modifier_at_level_1)    // baseline
      + Σ bonusHpRoll for all hp_roll tattoos ≤ current level
```

This reconstruction property has two implications. First, the tattoo ledger is the canonical source of truth for character statistics. Second, a freshly respawned character can be fully reconstructed from tattoos alone.

### III-D. Respawn Preservation

Both tattoos and career stats are snapshotted before loading the older checkpoint state:

```js
function storyRespawnFromCheckpoint() {
  const _survivingTattoos     = (S_story.tattoos || []).slice();
  const _survivingCareerStats = Object.assign({}, S_story.careerStats || {});
  document.getElementById('story-gameover-modal').classList.remove('visible');
  if (!storyLoadSave('r2h_checkpoint')) Object.assign(S_story, _S_DEFAULTS());
  // Keep whichever tattoo set is larger (more progression)
  if (_survivingTattoos.length > (S_story.tattoos || []).length) {
    S_story.tattoos = _survivingTattoos;
  }
  // Career stats carry forward unconditionally; run stats reset for the new life
  S_story.careerStats = _survivingCareerStats;
  S_story.runStats    = _STAT_ZERO();
  S_story.hour        = 0;
  S_story.hp = Math.max(1, Math.floor(S_story.hpMax / 2));
  S_story.active = true;
  storyUpdateStatus();
  storyRender(NODE_MAP[S_story.currentCode]);
}
```

---

## IV. Starting Modes and Baseline Definition

### IV-A. Hard Mode — Fixed Baseline (10/8/8/8/8/8)

In Hard Mode, the character's ability scores at creation are fixed:

```
STR 10 · DEX 8 · CON 8 · INT 8 · WIS 8 · CHA 8
```

Total: 52 points. This is intentionally below the D&D 5e standard array (total 72) and below the point-buy maximum. Hard Mode produces maximal build differentiation: all ASI investment is visible as pure player choice in the tattoo ledger.

**Table I — Hard Mode Progression to STR 20**

| Start STR | ASI Points to Cap | Points Remaining | Secondary Budget |
|:---------:|:-----------------:|:----------------:|:----------------:|
| 8         | 12                | 2                | 2                |
| 10        | 10                | 4                | 4                |
| 14        | 6                 | 8                | 8                |
| 16        | 4                 | 10               | 10               |

### IV-B. Custom Build Mode

Custom Build Mode uses the D&D 5e point-buy system: 27 points, scores 8–15, with the cost table `[0,1,2,3,4,5,7,9]` indexed by `score - 8`. Implementation:

```js
const _CC_COST = [0,1,2,3,4,5,7,9];
const CC_BUDGET = 27;

function _ccCost(score) { return _CC_COST[Math.max(0, Math.min(7, score - 8))]; }
function _ccSpent() { return Object.values(_cc_scores).reduce((s,v) => s + _ccCost(v), 0); }
```

**Table II — Mode Comparison Summary**

| Property | Hard Mode | Custom Build |
|---|---|---|
| Starting total | 52 pts | ~65–72 pts |
| Player agency at creation | None (fixed) | Full (point-buy) |
| Early-game difficulty | High | Moderate to Low |
| Tattoo ledger baseline | Fixed (10/8/8/8/8/8) | Player-defined |
| Recommended for | Experienced players | New players |

---

## V. The HP Roll Tattoo

Hit point increases are random (d10 + CON modifier per level for Fighter). Recording these as tattoos serves three functions: audit trail, character narrative, and reconstruction completeness. A level 7 HP tattoo reading "d10=2 + CON+1 = 3 HP" tells a story of a difficult year; "d10=9 + CON+2 = 11 HP" tells another.

The CON modifier is recorded at the pre-ASI value if CON is raised at the same level-up event, preserving historical accuracy.

---

## VI. The Death Tattoo

### VI-A. Design Rationale

Character death in the system is an event with two immediate consequences: inventory is dropped at the death location (creating a corpse retrieval quest), and a death tattoo is written to the permanent ledger. The death tattoo encodes three coordinates:

- **Temporal**: game day + hour of day (from the time-of-day clock, see §VII)
- **Spatial**: node code and human-readable label of the death location
- **Referential**: the `corpseQuestId` linking the tattoo to the active body retrieval quest

### VI-B. Implementation

In `_storyDeathSaveFall()`, immediately after the corpse quest object is created and before inventory is stripped:

```js
S_story.corpsesQuests.push(corpseQuest);

// Write death tattoo — permanent record of when and where the player fell
const _dHour = S_story.hour || 0;
const _dHourStr = _dHour.toString().padStart(2,'0') + ':00';
S_story.tattoos = (S_story.tattoos || []).concat([{
  type: 'tattoo', subtype: 'death', icon: '💀',
  lvl: S_story.level || 1, name: 'Fallen', sell: 0, drop: false,
  desc: 'Day ' + S_story.day + ' · ' + _dHourStr + ' · ' + nodeName,
  deathDay: S_story.day, deathHour: _dHour,
  deathNode: nodeCode, deathNodeName: nodeName,
  corpseQuestId: corpseQuest.id,
}]);

// Strip the player
S_story.gold = 0;
```

### VI-C. Corpse Quest Integration

The `corpseQuestId` field in the death tattoo references the corresponding entry in `S_story.corpsesQuests[]`. The corpse quest records the node and the item list lost at death. The death tattoo provides the temporal coordinate. Together they constitute a complete record: *when* the player died, *where* the body is, and *what* was on it. The character sheet's Deaths section renders all death tattoos; the Quest sheet renders active corpse retrieval objectives.

### VI-D. Character Sheet Rendering

Death tattoos are separated from level-up tattoos in `storyRenderCharSheet()` and displayed in a dedicated "Deaths" section:

```js
// Exclude death tattoos from the level-keyed lookup
(S_story.tattoos || []).forEach(t => {
  if (t.subtype !== 'death') tattooByLvl[t.lvl] = t;
});

// Render Deaths section
const deathTattoos = (S_story.tattoos || []).filter(t => t.subtype === 'death');
if (deathTattoos.length) {
  // <div class="cs-section-title">Deaths — N</div>
  // each: <div class="cs-tattoo-row">💀 Day 12 · 14:00 · Birka Slums</div>
}
```

---

## VII. The Time-of-Day Clock

### VII-A. Rationale

Death timestamps require sub-day temporal resolution. The system's gameplay day counter (`S_story.day`, 1–49) advances once per sleep event. For death tattoo timestamps, a finer clock is needed. The time-of-day clock (`S_story.hour`, 0–23) advances at two rates:

- **Battle start**: +1 hour (one battle = one hour of in-world time)
- **Sleep confirm**: +6 hours (one long rest = six hours of in-world time)

The clock wraps at 24. The gameplay day counter remains unchanged — the hour clock is purely for timestamp resolution and does not affect the 49-day void timer or any game balance system.

### VII-B. Implementation

In `_storyRollInit()` (called for all battle types — node battles, corridor encounters, stalk encounters, pit championship):

```js
_statTally('battlesAttempted', 1);
S_story.hour = ((S_story.hour || 0) + 1) % 24;
```

In `storyConfirmSleep()`:

```js
_statTally('sleeps', 1);
_statTally('daysAdventuring', 1);
S_story.hour = ((S_story.hour || 0) + 6) % 24;
```

The hour is reset to 0 on respawn alongside `runStats`.

---

## VIII. Chronicle System

### VIII-A. State Schema

```js
// _STAT_ZERO factory — canonical empty ledger
const _STAT_ZERO = () => ({
  kills: 0, deaths: 0,
  dmgDealt: 0, dmgReceived: 0,
  sleeps: 0,
  battlesAttempted: 0,
  attacksAttempted: 0, attacksHit: 0,
  exitsTaken: 0,
  daysAdventuring: 0,
});

// In _S_DEFAULTS():
careerStats: _STAT_ZERO(),   // never reset — accumulates across all deaths
runStats:    _STAT_ZERO(),   // reset on each respawn
hour: 0,                     // time-of-day clock 0–23
```

### VIII-B. The `_statTally` Helper

All stat increments flow through a single two-line helper that null-guards both ledgers:

```js
function _statTally(key, n) {
  if (!S_story.careerStats) S_story.careerStats = _STAT_ZERO();
  if (!S_story.runStats)    S_story.runStats    = _STAT_ZERO();
  S_story.careerStats[key] = (S_story.careerStats[key] || 0) + n;
  S_story.runStats[key]    = (S_story.runStats[key]    || 0) + n;
}
```

The null guards ensure backward compatibility with saves written before the Chronicle system was added.

### VIII-C. Hook Sites

**Table III — Chronicle Hook Sites**

| Stat | Function | Condition |
|---|---|---|
| `kills` | `_storyBattleVictory()` | After XP award, all battle types except pit bypass |
| `deaths` | `_storyDeathSaveFall()` | Before inventory strip |
| `dmgDealt` | `_overlayPlayerAttack()` | On hit, main attack (per swing in multi-attack) |
| `dmgDealt` | `_overlayOffhandAttack()` | On offhand hit |
| `dmgReceived` | `_storyEnemyTurn()` | On enemy hit |
| `dmgReceived` | EB negotiation failure | Non-lethal CHA fail retaliation |
| `battlesAttempted` | `_storyRollInit()` | Called for all battle types |
| `attacksAttempted` | `_overlayPlayerAttack()` | Per loop iteration (each swing) |
| `attacksAttempted` | `_overlayOffhandAttack()` | Per offhand attempt |
| `attacksHit` | `_overlayPlayerAttack()` | Inside hit branch, alongside `dmgDealt` |
| `attacksHit` | `_overlayOffhandAttack()` | Inside offhand hit branch |
| `exitsTaken` | `storyMove()` | After `S_story.currentCode = dest` (direct moves) |
| `sleeps` | `storyConfirmSleep()` | After `S_story.sleptAtNodes[nodeCode] = true` |
| `daysAdventuring` | `storyConfirmSleep()` | Alongside `sleeps` |

Code example — attack tracking in the multi-attack loop:

```js
for (let i = 0; i < n; i++) {
  // ...
  const isHit = isCrit || (!isNat1 && atkTotal >= S.enemy.ac);
  _statTally('attacksAttempted', 1);  // ← per swing

  let finalDmg = 0;
  if (isNat1) {
    // miss
  } else if (!isHit) {
    // miss
  } else {
    finalDmg = applyDmgMod(raw, S.opp.dmgMod);
    S.opp.hp = Math.max(0, S.opp.hp - finalDmg);
    refreshLeftPanel();
    _statTally('dmgDealt', finalDmg);
    _statTally('attacksHit', 1);      // ← on hit only
  }
}
```

### VIII-D. Reset Semantics

| Event | `careerStats` | `runStats` | `hour` |
|---|---|---|---|
| New game | Zeroed (from `_S_DEFAULTS`) | Zeroed | 0 |
| Death | `deaths += 1` | Unchanged (still shows last-run values while modal is open) | Unchanged |
| Respawn | Snapshotted and restored | Reset to `_STAT_ZERO()` | Reset to 0 |
| Load continue | As saved | As saved | As saved |

The key design: `runStats` is NOT reset at death — only at respawn. This allows the game-over modal to display the final run statistics before they are cleared.

### VIII-E. Display Architecture

**Game-Over Modal — Run Summary**

Populated by `_populateGameoverChronicle()` called from both `storyGameOver()` and `storyCheckContinue()` (dead-save path):

```js
function _populateGameoverChronicle() {
  const rs = S_story.runStats || {};
  const rows = [
    ['Battles fought',   rs.battlesAttempted || 0],
    ['Kills',            rs.kills            || 0],
    ['Attacks',          rs.attacksAttempted || 0],
    ['Hit rate', rs.attacksAttempted
        ? Math.round((rs.attacksHit||0) / rs.attacksAttempted * 100) + '%'
        : '—'],
    ['Damage dealt',     rs.dmgDealt         || 0],
    ['Damage received',  rs.dmgReceived      || 0],
    ['Exits taken',      rs.exitsTaken       || 0],
    ['Sleeps',           rs.sleeps           || 0],
    ['Days adventuring', rs.daysAdventuring  || 0],
  ];
  // render only if any non-zero value; hidden on instant death
}
```

**Character Sheet — Chronicle Section**

Two-column grid: "This Life" (runStats) and "All Lives" (careerStats). The "All Lives" column is suppressed on the first run before any death event, since both columns would be identical:

```js
const isFirstRun = (cs.deaths || 0) === 0;
// All Lives header and values omitted when isFirstRun === true
```

**Character Sheet — Deaths Section**

Rendered above the Chronicle section, only if death tattoos exist:

```
Deaths — 3
💀  Day 5 · 08:00 · Birka Slums
💀  Day 12 · 14:00 · The Cat Quarter
💀  Day 23 · 21:00 · Void Antechamber
```

---

## IX. Balance Analysis

### IX-A. Progression Curve — Hard Mode vs Custom Build

Under Hard Mode (STR 10 start):
- Lv 1–3: STR mod = +0; Hit rate vs AC 13 ≈ 45%
- Lv 4: STR 12, mod = +1; Hit rate ≈ 55%
- Lv 14: STR 20 (capped); Hit rate at level-appropriate AC ≈ 60%–70%

Under Custom Build (STR 15 start):
- Lv 1–3: STR mod = +2; Hit rate vs AC 13 ≈ 65%
- Lv 8: STR 20 (capped), 6 levels earlier than Hard Mode
- 10 more secondary stat points available post-cap

**Table IV — Fighter Level-Up ASI Schedule**

| Level | Event | Cumulative ASI Points |
|:-----:|:-----:|:---------------------:|
| 4     | ASI   | 2                     |
| 6     | ASI   | 4                     |
| 8     | ASI   | 6                     |
| 12    | ASI   | 8                     |
| 14    | ASI   | 10                    |
| 16    | ASI   | 12                    |
| 19    | ASI   | 14                    |

### IX-B. Hit Rate as Chronicle-Derivable Metric

The Chronicle's `attacksAttempted` and `attacksHit` fields allow post-session hit rate computation:

```
hitRate = attacksHit / attacksAttempted
```

This is displayed on the game-over modal as a percentage. Over a full career, the careerStats version of this ratio is an empirical measure of how well the player's build translates to actual combat outcomes — a ground-truth balance diagnostic unavailable without passive stat collection.

### IX-C. HP Volatility and CON Investment

CON 14 (mod +2): expected HP per level = 5.5 + 2 = 7.5 → level-20 total ≈ 145 HP
CON 8 (mod −1): expected HP per level = 5.5 − 1 = 4.5 → level-20 total ≈ 87 HP

The 58-HP differential is visible in the tattoo ledger as a sequence of HP roll tattoos. A player who dumped CON and later regrets it can read exactly why their hpMax is what it is.

---

## X. Discussion

### X-A. The Tattoo Ledger as Character Biography

The tattoo ledger in a fully-played game is a complete biography: the baseline (origin), ASI decisions (character arc), HP rolls (physical history), and death events (mortality record). A player with three death tattoos reading "Day 5 · 08:00 · Birka Slums", "Day 12 · 14:00 · The Cat Quarter", and "Day 23 · 21:00 · Void Antechamber" has a readable narrative: an early death in a low-level area, a mid-game failure in a new zone, and a late push into dangerous territory. No separate journal entry is needed — the tattoo ledger tells the story.

### X-B. Career vs Run Statistics as Player Feedback

The Chronicle's two-ledger design surfaces a distinction that most games obscure: the difference between *how this life went* and *how all lives have gone*. On a first run, both ledgers are identical. After the first death, they diverge permanently. A player's "All Lives" damage dealt is an indicator of cumulative engagement; the ratio of careerStats.kills to careerStats.battlesAttempted is a long-run combat efficiency measure. Neither requires the player to track anything — the system observes silently.

The hit rate metric is particularly useful for build validation. A player investing heavily in STR expecting high accuracy who finds a 48% career hit rate has empirical evidence that their build assumption is not holding, which may prompt a tactical pivot (conditions, terrain, weapon choice) or an ASI reallocation toward DEX or proficiency-boosting items.

### X-C. Death as Inventory Reset, Not Character Reset

The death mechanic preserves the character's *self* while resetting their *possessions*. A character who dies at level 12 with a full tattoo ledger is stripped of loot but retains the mathematical identity of twelve levels of growth, the accumulated Chronicle of their kills and battles, and a new death tattoo recording where they fell. They are poor but experienced. They know exactly when and where they died.

### X-D. Future Extensions

**1. Feat tattoos.** If the system introduces D&D 5e Feats as an alternative to ASIs, feat selection is recorded as `subtype: 'feat'` with a `featKey` field.

**2. Story tattoos.** Significant narrative events (defeating the Cat-King, completing the Froberger arc) could be recorded as cosmetic tattoos with `delta: {}` serving as narrative memoir.

**3. Negative tattoos.** A curse or cursed item that permanently reduces a stat could be recorded as a tattoo with negative delta values, visible in the ledger as a scar.

**4. Cross-run persistence.** In a New Game+ context, the tattoo ledger from a prior run could be surfaced as a read-only "ancestral record" — not applied to the new character's stats, but visible as a historical document. The death tattoos in particular would serve as warnings: "Your previous life fell at Day 23 · 21:00 · Void Antechamber. You are approaching that point."

**5. Chronicle analytics.** Career hit rate, kill-to-death ratio, and damage dealt per battle could be surfaced as derived metrics in the character sheet, converting raw Chronicle data into build quality signals.

---

## XI. Conclusion

This report has presented two fully-implemented systems: the Tattoo System and the Chronicle System.

**Tattoo System** — four subtypes implemented:
- `baseline`: written at `storyNewGame()`, records starting ability scores
- `asi`: written at level-up confirm, records +1/+2 ASI allocation decisions
- `hp_roll`: written at level-up confirm, records d10 + CON roll per level
- `death`: written at `_storyDeathSaveFall()`, records day, hour, and node of death, linked to the corpse retrieval quest via `corpseQuestId`

**Chronicle System** — two parallel ledgers with 10 tracked metrics:
- `kills`, `deaths`, `battlesAttempted`, `attacksAttempted`, `attacksHit`, `dmgDealt`, `dmgReceived`, `exitsTaken`, `sleeps`, `daysAdventuring`
- `careerStats`: never reset, survives respawn via snapshot/restore in `storyRespawnFromCheckpoint()`
- `runStats`: reset on respawn; retains values until respawn so game-over modal can display final run stats

**Time-of-Day Clock** — `S_story.hour` (0–23), advances +1 per battle (at `_storyRollInit()`), +6 per sleep (at `storyConfirmSleep()`); provides temporal resolution for death tattoo timestamps; no gameplay mechanics attached.

All systems are passive collection only — no new game mechanics are surfaced. Data renders in two locations: the character sheet (Chronicle section, Deaths section) and the game-over modal (run summary with hit rate computation).

---

## References

[1] A. Juul, *The Art of Failure: An Essay on the Pain of Playing Video Games*. Cambridge: MIT Press, 2013.

[2] G. Whitehead, "Meta-progression and the Roguelite Genre," *Proc. Game Developers Conference*, San Francisco, CA, 2019, pp. 14–22.

[3] M. Merleau-Ponty, *Phenomenology of Perception*, trans. C. Smith. London: Routledge, 1962.

[4] *Dungeons & Dragons Player's Handbook*, 5th ed. Renton, WA: Wizards of the Coast, 2014.

[5] J. Crawford, "Fighter Class Design Notes," in *Dungeons & Dragons Dungeon Master's Guide*, 5th ed., Wizards of the Coast, 2014, Appendix A.

[6] FromSoftware, *Dark Souls*, Namco Bandai Games, 2011.

[7] M. Toy, G. Wichman, K. Arnold, J. Lane, *Rogue*, UC Berkeley, 1980.

[8] F. Lantz, "Roguelikes and the Persistence Problem," *Kill Screen*, vol. 4, 2012.

[9] R. Bartle, *Designing Virtual Worlds*. New Riders Publishing, 2003.

[10] ZA/UM, *Disco Elysium*, ZA/UM, 2019.

[11] Capcom, *Monster Hunter: World*, Capcom, 2018.

[12] B. Suits, *The Grasshopper: Games, Life and Utopia*. Broadview Press, 2005.

[13] D. Kahneman and A. Tversky, "Prospect Theory: An Analysis of Decision under Risk," *Econometrica*, vol. 47, no. 2, pp. 263–291, Mar. 1979.

[14] J. Schell, *The Art of Game Design: A Book of Lenses*, 3rd ed. Boca Raton: CRC Press, 2019.

---

## Appendix A — Implementation Checklist

| # | Task | Status | Location |
|---|---|---|---|
| A1 | `_S_DEFAULTS()` starting scores 10/8/8/8/8/8 | ✅ | `_S_DEFAULTS()` |
| A2 | Character creation modal — Hard Mode tab | ✅ | `#story-charcreate-modal` |
| A3 | Character creation modal — Custom Build point-buy | ✅ | `_ccRefresh()`, `_showCharCreate()` |
| A4 | Baseline tattoo written at `storyNewGame()` | ✅ | `storyNewGame(startScores)` |
| A5 | ASI tattoo written at level-up confirm | ✅ | Level-up modal confirm handler |
| A6 | HP roll tattoo written at level-up confirm | ✅ | `btn-lu-roll-hp` handler |
| A7 | Tattoo section in `storyRenderCharSheet()` | ✅ | `progRows()` inside `storyRenderCharSheet()` |
| A8 | Tattoos excluded from death-drop routine | ✅ | `_storyDeathSaveFall()` never touches `tattoos[]` |
| A9 | Tattoos excluded from vendor sell interface | ✅ | `sell: 0` flag |
| A10 | Tattoos survive respawn (snapshot/restore) | ✅ | `storyRespawnFromCheckpoint()` |
| A11 | `careerStats` / `runStats` in `_S_DEFAULTS()` | ✅ | `_S_DEFAULTS()` |
| A12 | `_STAT_ZERO()` factory + `_statTally(key, n)` helper | ✅ | Before `storyRespawnFromCheckpoint()` |
| A13 | Kill hook at `_storyBattleVictory()` | ✅ | After XP award |
| A14 | Death hook at `_storyDeathSaveFall()` | ✅ | Before inventory strip |
| A15 | Damage dealt hooks (main + offhand attack hit) | ✅ | `_overlayPlayerAttack()`, `_overlayOffhandAttack()` |
| A16 | Damage received hooks (enemy hit + CHA fail) | ✅ | `_storyEnemyTurn()`, EB negotiation |
| A17 | `battlesAttempted` hook at `_storyRollInit()` | ✅ | Covers all battle types |
| A18 | `attacksAttempted` / `attacksHit` per swing | ✅ | Inside loop in `_overlayPlayerAttack()` |
| A19 | `exitsTaken` hook at `storyMove()` | ✅ | After `currentCode = dest` |
| A20 | `sleeps` + `daysAdventuring` hooks at `storyConfirmSleep()` | ✅ | After `sleptAtNodes` recorded |
| A21 | `hour` clock: +1 per battle at `_storyRollInit()` | ✅ | Alongside `battlesAttempted` |
| A22 | `hour` clock: +6 per sleep at `storyConfirmSleep()` | ✅ | Alongside `sleeps` |
| A23 | `hour` reset to 0 on respawn | ✅ | `storyRespawnFromCheckpoint()` |
| A24 | Death tattoo written at `_storyDeathSaveFall()` | ✅ | Encodes day, hour, node, corpseQuestId |
| A25 | Death tattoos excluded from `tattooByLvl` in char sheet | ✅ | `if (t.subtype !== 'death')` filter |
| A26 | Deaths section in `storyRenderCharSheet()` | ✅ | Rendered above Chronicle section |
| A27 | Chronicle section in `storyRenderCharSheet()` | ✅ | Two-column This Life / All Lives |
| A28 | `_populateGameoverChronicle()` in game-over modal | ✅ | Called from `storyGameOver()` and `storyCheckContinue()` |
| A29 | Hit rate computed in game-over run summary | ✅ | `attacksHit / attacksAttempted * 100` |
| A30 | `careerStats` snapshot/restore on respawn | ✅ | `storyRespawnFromCheckpoint()` |

---

*Report prepared for internal design documentation of roll2hit.com. Not submitted to any external publication venue. IEEE formatting applied for structural clarity.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
