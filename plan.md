## §0 — Implementation Readiness Dashboard

> **Status as of Layer 77 (2026-05-25).** All layers through §XLII implemented. Add new layers below as §XLIII+.

### Lab Report Index (Layers 48–77)

| Layer(s) | Section(s) | Lab Report |
|----------|-----------|-----------|
| 48 | §XIII | `lab-report-luck-seventh-stat.md` |
| 49 | §XIV | `lab-report-quest-minus-one-world-creator.md` |
| 50 | §XV | `lab-report-ng-plus-remembrance.md` |
| 51 | §XVI | `lab-report-weimar-scholar-gate.md` |
| 52 | §XVII | `lab-report-void-archaeology.md` |
| 54+55 | §XIX+§XX | `lab-report-tilbury-visby-arcs.md` |
| 56 | §XXI | `lab-report-void-shaman.md` |
| 61 | §XXVI | `lab-report-corelli-merchant.md` |
| 70+72+74 | §XXXV+§XXXVII+§XXXIX | `lab-report-narrative-arcs-brynn-bruhns-yael.md` |
| 75+77 | §XL+§XLII | `lab-report-kenickie-chronicle.md` |
| 76 | §XLI | `lab-report-tattoo-progression-system.md` |

Earlier layers (9–47): see `lab-report-architecture-full.md` and `lab-report-timeline-history-completed.md`.

---

## I. Directive

> You are an expert prompt interpreter with an electrical engineering / computer science background. Follow the sections below: use the suggestions in II, III, IV to implement ideas from the list, or append new ideas to the end of the list when told about them. Work incrementally — present one step at a time and wait for "continue."

### Lab Report Policy

Write a new `lab-report-<title>.md` when any of the following is true:

| Trigger | Examples |
|---------|---------|
| Major collection added or redesigned | New monster group, terrain cluster, NPC faction, item economy |
| Large redesign touching multiple systems | Weapon drop overhaul, Luck Stat, fishing bait sub-system |
| New narrative theme or arc | New quest chain spanning 3+ nodes, new named faction, new NPC arc |
| Design review before implementation | IEEE-format spec locking data shapes and flow before any HTML edit |
| Session postmortem with non-obvious decisions | Choices that won't be recoverable from code or core docs alone |

Do **not** write a lab report for: a single monster/quest addition (sync core docs instead), a value correction (add an implementation note to the existing report), or small additions that fit cleanly in an existing doc section.

---

## II. Design Constants Quick Reference

| Const | Purpose |
|---|---|
| `NODE_MAP` | 76 nodes (42 story + 7 junctions + MT + SL + DF/HM/GL + 20 EB); all `N/E/S/W/sleep/battle/loot` fields |
| `NODE_COORDS` | Grid position `{r,c}` for all nodes; used by corridor router and map renderer |
| `QUEST_DB` | Quest definitions: activateNode, objectiveText, reward, completionCheck |
| `GATE_LOCKS` | 4 passage locks + shard gate; each entry: `{from, to, item, label}` |
| `CONDITION_ITEMS` | 11 condition items: name, icon, effect, sell value |
| `CONDITION_GOLD` | Pre-battle cost per condition (flat gold, not inventory) |
| `CONDITION_ADV` | Adv/DIS modifier keyed by lowercase-underscore condition name |
| `WORLD_DB` | 66 terrain entries (46 base + 20 epic); each has `monsters: []` with full stat blocks |
| `MONSTER_POOL` | 370 monsters across 8 source pools; keyed by monster key string |
| `MONSTER_DROPS` | Trophy drop per monster key; `{name, icon, sell}` |
| `CORRIDOR_CELLS` | Computed corridor grid; key `"r,c"` → `{dirs, glyph, terrain, edges}` |
| `HUNTING_GROUNDS` | 42 terrain → `{displayName}` for stalk overlay; 20 epic terrain entries |
| `EPIC_BOSS_POOL` | 20 deadly-tier bosses keyed by slug; AC/HP/ATK/dmg/epicDesc |
| `EB_NPC_DIALOGUE` | 20 quest-giver NPC profiles; payment negotiation, return beat, specialItem |
| `EB_STORY_ITEMS` | 11 special non-gold EB rewards: Forge Rune, Runic Hammer, Star Fragment, etc. |
| `FROBERGER_JOURNAL` | 41 entries `{entryNum, nodeCode, readAloud, text}`; 10 read-aloud + 31 collectible |
| `SWEELINCK_DIALOGUE_VARIANTS` | 5 variants keyed by curse score bracket + Birka variant if `_lubeckFriends()≥3` |
| `BIRKA_NPC_PROFILES` | 6 Birka NPC profiles (Yael/Brynn/Quill/Pachelbel/Weckmann/Auros); key/name/occupation/node |
| `NPC_DIALOGUES` | 6 NPCs × 4 states × 5 quotes each; cycled by visit count |
| `POTION_TIERS` | 4 potion tiers: minor/healing/greater/superior; `{name, icon, heal, cost, sell}` |
| `LOOT_TABLE` | 20-entry d20 drop table (dead code — replaced by `_D100_TABLE`) |
| `SHIELD_ITEMS` | 6 tiers: Small +1 → Legendary +5 → Ancient +6 AC; vendor-gated by minLevel |
| `DAGGER_ITEMS` | 4 offhand daggers (drop-only): +1 Royal (Lv3) → +4 Voidsteel (Lv20) |
| `WEAPON_ITEMS` | 70 main-hand weapons (14 base × 5 magic tiers 0–+4); `_magicTierAllowed()` gates drops |
| `FIGHTER_FEATURES` | Fighter Champion features per level 2–20 |
| `_ASI_TABLE` | 6-entry d6 table; each: `{name, icon, delta, desc}` |
| `_LEVEL_GOLD_GIFT` | Gold gifted on non-ASI levels: `{2:250, 3:350, 5:500, …, 20:2500}` |
| `_LEVEL_SHIELD_GIFT` | Magic shield gifts on milestone levels: L3 → +1 Shield, L11 → +2 Shield |
| `XP_BY_TIER` | Legacy tier XP; kept for reference — L12+ uses `AC × maxHP` formula |
| `BOSS_COMMANDER_AUROS` | AC22/HP300/ATK+12/3d8+6; final boss at CO node; requires Lv20 + 7 shards |
| `VENDOR_NODES` | Set of node codes with vendor access (5 nodes: BA/MQ/SF/IS/BK) |
| `XP_LEVELS` | 20-entry array; max 195,000 XP at L20 |

---

## III. State Fields Quick Reference

> All 107 `S_story` fields from `_S_DEFAULTS()` (HTML ~line 7842).

| Field | Type | Purpose |
|---|---|---|
| `S_story.hp / hpMax` | number | Player story HP |
| `S_story.gold` | number | Current gold |
| `S_story.day` | number | Current day (1–49) |
| `S_story.shards` | number | Codex Shards collected (0–7) |
| `S_story.voidPressure` | number | Void Tide counter (0–10) |
| `S_story.xp / xpLastBattle` | number | Cumulative XP / last battle award |
| `S_story.level` | number | Current character level (1–20) |
| `S_story.atkBonus / acBonus` | number | Story combat modifiers |
| `S_story.abilityScores` | object | `{str,dex,con,int,wis,cha}` — starts at `{16,12,14,10,12,8}` |
| `S_story.shieldTier` | string\|null | Magic shield tier granted |
| `S_story.levelUpLog` | array | Records each level-up `{lvl, hp, asiResult, goldGift, shieldGift}` |
| `S_story.shortRests` | number | Remaining short rest charges today (0–3) |
| `S_story.knowledge` | array | Necklace of Knowledge beads |
| `S_story.inventory` | array | All held items |
| `S_story.quests` | object | Quest status map: `questId → 'active'|'done'|'failed'` |
| `S_story.defeatedBattles` | object | nodeCode → true for completed story battles |
| `S_story.hearthHome` | string | Transmort Scroll destination node code |
| `S_story.checkpointNode` | string | Last inn slept at (respawn point) |
| `S_story.battleTurn` | `'player'|'enemy'` | Initiative state for current battle |
| `S_story.battleRound` | number | Current round number |
| `S_story.surpriseAdvantage` | boolean | Stealth check passed — ADV on first attack |
| `S_story.usedMainAttack` | boolean | Main action consumed this round |
| `S_story.usedRealAttack` | boolean | A genuine weapon attack was made (gates offhand) |
| `S_story.usedBonusAction` | boolean | Bonus action consumed this round |
| `S_story.conditionRoundsLeft` | number | Rounds remaining on opponent condition |
| `S_story.spellAdvantageReady` | boolean | Spell scroll ADV queued |
| `S_story.equippedShield` | object\|null | Currently equipped shield |
| `S_story.equippedWeapon` | object\|null | Equipped offhand dagger |
| `S_story.equippedMainWeapon` | object\|null | Equipped main hand weapon |
| `S_story.pendingBattle` | object\|null | Active battle descriptor |
| `S._pendingDrop` | object\|null | Staged monster-specific drop for next victory |
| `S.char.baseAc` | number | AC snapshot taken at battle start |
| `S_story.surgeCharges` | number | Action Surge charges remaining (0–2) |
| `S_story.indomitableCharges` | number | Indomitable death-save reroll charges (0–1) |
| `S_story.tattoos` | array | Tattoo items pushed on each level-up |
| `S_story.shortRestedAtNodes` | object | nodeCode → true; first short rest per location |
| `S_story.sleptAtNodes` | object | nodeCode → true; first sleep per location |
| `S_story.journalEntriesRead` | array | entryNums of FROBERGER_JOURNAL entries found |
| `S_story.ebReturnsCompleted` | object | ebCode → true; set on EB return quest completion |
| `S_story.ebNegotiatedPayments` | object | ebCode → gold accepted |
| `S_story.npcFavorability` | object | npcKey → 0/1/2/3 |
| `S_story.roughWhiskeyUsed` | boolean | true after drunk pit fight event fires |
| `S_story.yaelEscortUsed` | boolean | true after one-time escort narration fires |
| `S_story.pitTrainingWins` | number | CY battle wins while `quest_pit_training` active |
| `S_story.ngPlusRun` | number | NG+ generation counter; 0 = first run |
| `S_story.frobergerLastEntryRead` | boolean | true after player finds Journal Entry 41 |
| `S_story.gameDay` | number | Alias for `S_story.day` |
| `S_story.actNumber` | number | Current act (1–8) |
| `S_story.currentCode` | string | Current node code |
| `S_story.s8VargaWatches` | number | Varga observation count (S8 mechanic, 0–3) |
| `S_story.archiveVisited` | boolean | Blue Shutters Archive entered |
| `S_story.s29LineDelivered` | boolean | Auros/Froberger theory line delivered |
| `S_story.s49BrynnDelivered` | boolean | Brynn Entry-41 reaction delivered |
| `S_story.raisonToolsUsed` | boolean | Raison's Tools assessment used |
| `S_story.log` | array | Story message log |
| `S_story.visited` | object | nodeCode → true; first arrival |
| `S_story.journalRead` | object | nodeCode → true; which node journals read |
| `S_story.countedMissedInns` | object | nodeCode → true; prevents double-penalizing |
| `S_story.missedSleeps` | number | Consecutive sleep-skips |
| `S_story.battleDis` | number | Rounds of Disadvantage on player attacks |
| `S_story.dropsCollected` | number | Lifetime monster drop collection count |
| `S_story.lastCorridorCells` | array | Cell sequence from last corridor walk |
| `S_story.lastExitDir` | string\|null | Direction string from last move |
| `S_story.lastExitCode` | string\|null | Node code departed from in last move |
| `S_story.battlePRoll` | number | Raw player roll value in current battle round |
| `S_story.battleERoll` | number | Raw enemy roll value in current battle round |
| `S_story.corpsesQuests` | array | Active corpse-loot quests |
| `S_story.storyDeathSaves` | object | `{successes:0, failures:0, active:false}` |
| `S_story.lastAutoSellNode` | string\|null | Node where last auto-sell triggered |
| `S_story.waypoint` | string\|null | Active waypoint target node code |
| `S_story.customQuestTerrain` | string\|null | Terrain for active Assassin's Guild hunt |
| `S_story.ebReturnDone` | object | ebCode → true; player arrived at EB return node |
| `S_story.roughWhiskeyActive` | boolean | Rough Whiskey buff currently active |
| `S_story.slStalksWon` | number | Stalk-mode victories won |
| `S_story.npcVisitCounts` | object | npcKey → visit count |
| `S_story.couperiSongReceived` | boolean | Quill has played Couperin's song |
| `S_story.bruhnsDepthsReported` | boolean | Depth report delivered to Auros |
| `S_story.pitPerks` | array | Active pit training perks |
| `S_story.frobergerNoteNode` | string\|null | Node code of last Froberger note found |
| `S_story.froberger_last_note_found` | boolean | Froberger's final note found |
| `S_story.froberger_last_note_read` | boolean | Final note opened and read |
| `S_story.huntMode` | boolean | true while player is in active stalk/hunt mode |
| `S_story.couperiDebtDegraded` | boolean | Quill's debt acknowledged as "just a number" |
| `S_story.worldEventsFired` | array | One-time world event IDs that have fired |
| `S_story.brynThirdStepFixed` | boolean | Bryn's third porch step repaired |
| `S_story.brynFirewoodBrought` | boolean | Firewood delivered to Bryn |
| `S_story.brynPantryRestocked` | boolean | Pantry restocked for Bryn |
| `S_story.brynLedgerBalance` | number | Bryn's ledger debt (starts −8) |
| `S_story.voidSignClicked` | boolean | Player has clicked the Void Sign once |
| `S_story.brynnsJournalRead` | boolean | Bryn's hidden cabin journal read |
| `S_story.pachelbelPaidBack` | boolean | Pachelbel's debt paid |
| `S_story.quillQuestComplete` | boolean | Quill's main quest resolved |
| `S_story.actThreeWeightApplied` | boolean | Act III emotional weight injected |
| `S_story.s49SweelinckDelivered` | boolean | Sweelinck moment delivered |
| `S_story.s54JointMomentDelivered` | boolean | Joint NPC moment delivered |
| `S_story.s55MapLineDelivered` | boolean | Map reveal line delivered |
| `S_story.s51NorthRoadBought` | boolean | North Road tome purchased |
| `S_story.s51ManifoldBought` | boolean | Manifold tome purchased |
| `S_story.s51LastStockBought` | boolean | Final shop item purchased from Leeuwenhoek |
| `S_story.s6JointDelivered` | boolean | S6 joint NPC moment delivered |
| `S_story.s2DaughterDelivered` | boolean | S2 daughter-mention line delivered |
| `S_story.archiveLetterObtained` | boolean | Letter from Blue Shutters Archive obtained |
| `S_story.archiveUndercitySurveyTaken` | boolean | Undercity survey quest accepted |
| `S_story.undercitySurveyDelivered` | boolean | Survey report delivered |
| `S_story.s8VargaClueUnlocked` | boolean | Varga surveillance clue revealed |
| `S_story.s8PachelbelTold` | boolean | Pachelbel informed of Varga observations |

---

## V. Suggestions for Further Development

### V-B. Documentation Queue — FC Items

| # | Item | File(s) | Status |
|---|------|---------|--------|
| FC01 | Doc Health badge in `index.md` — live count of sync-pass completion | `index.md` | ⏳ |
| FC02 | `froberger-journal-all-entries.txt` entry-by-entry compare against HTML | `froberger-journal-all-entries.txt` | ⏳ |
| FC03 | Split `mechanics.md` into `mechanics-combat.md` + `mechanics-economy.md` | `mechanics.md` | ⏳ |
| FC04 | Spot-check function names in `lab-report-architecture-full.md` every 10 layers | `lab-report-architecture-full.md` | ⏳ |
| FC05 | Two-way link convention: every HTML const gets `// → doc: filename.md §Section` | all core docs | ⏳ |

### V-C. New Feature Ideas (not yet assigned to a section)

> Add raw ideas here when ready to plan. Move to its own §XLIII+, etc. when spec is written.

---

## §API-01 — mechanics.md Analysis

**IEEE-Format API Review**  
**File:** `mechanics.md` (1,117 lines)  
**HTML Source:** `roll2hit-v3.html` (~17,600 lines)  
**Category Group:** Game Design · Combat System · Economy · Progression · Persistence

### Abstract

`mechanics.md` is the primary API surface document for roll2hit's simulation engine. It documents two behavioral modes (Battle Mode, Story Mode), the action economy (1.5 AP system), the loot pipeline (`_D100_TABLE`), the vendor economy (5 nodes × 3 item categories), the level-up chain (Fighter Champion, 1–20), and the save/load architecture (`localStorage`, two-key). The document serves as both a player-facing guide and an implementer reference — it names HTML functions, line numbers, const names, and state fields explicitly. This dual-audience design creates a verification burden: every function reference and line number is a testable claim.

This section records 36 comparison points across five categories — Game Design, Combat System, Economy, Progression, and Persistence — evaluating `mechanics.md` against `roll2hit-v3.html` for accuracy, completeness, and sync parity.

---

### I. Data Architecture

```
S_story (localStorage)
  ├── Combat state:   hp/hpMax, pendingBattle, battleTurn, battleRound
  ├── Progression:    xp, level, abilityScores, surgeCharges, indomitableCharges
  ├── Economy:        gold, inventory[], equipped{Shield/Weapon/MainWeapon}
  ├── Map state:      currentCode, visited{}, defeatedBattles{}
  ├── Quest state:    quests{}, ebReturnsCompleted{}, ebNegotiatedPayments{}
  └── Narrative:      npcFavorability{}, ngPlusRun, frobergerLastEntryRead, journalEntriesRead[]
```

Two `localStorage` keys:

```
r2h_autosave    ← storyAutoSave()         every move / battle / levelup / purchase
r2h_checkpoint  ← storySaveCheckpoint()   on inn sleep only
```

No versioning field — `Object.assign` merge with `_S_DEFAULTS()` on load provides forward compatibility.

---

### II. Game Design Category (Points 1–10)

| # | Claim in mechanics.md | HTML evidence | Status |
|---|---|---|---|
| 1 | Reward formula: `floor(0.1 × AC × maxHP)` for HP healed and gold dropped | `storyApplyOutcome()` kill path | ✓ |
| 2 | XP formula: `enemy AC × enemy maxHP` | `_checkLevelUp()` trigger | ✓ |
| 3 | Level 20 cap = 195,000 XP; `XP_LEVELS[20]` returns `undefined` (Level 21 open) | `XP_LEVELS` at line 8608 | ✓ |
| 4 | 1.5 AP system: 1.0 main + 0.5 bonus; two Flee paths (⚠ mutual, ✓ clean) | `doPlayerAttack()` / `oppRoll()` button logic | ✓ |
| 5 | `usedRealAttack` gates 🗡 Offhand; wimper → offhand exploit blocked | `S_story.usedRealAttack` state field | ✓ |
| 6 | Auto-Damage ON by default; damage applied before victory overlay | `storyApplyOutcome()` | ✓ |
| 7 | Notoriety formula: `level × 3 + floor(battlesWon / 2)`; 5-bracket tier weight table | `_notoriety()` — **no line ref cited** | ⚠ |
| 8 | Corridor encounter: `min(95, 10 + notoriety × 1.5 + activeQuests × 4)` | Corridor encounter logic | ✓ |
| 9 | Stealth roll: d20 vs random DC 5–16 (25–80% pass rate) | `storyCommitBattle()` stealth tab | ✓ |
| 10 | Condition costs: Feint Scroll 1,000gp → Basilisk Eye Flask 5,000gp | `CONDITION_GOLD` const | ✓ |

---

### III. Combat System Category (Points 11–20)

| # | Function | HTML line | Status in mechanics.md |
|---|---|---|---|
| 11 | `roll()` / `rollN()` dice primitives | 5482 / 5486 | ⚠ Not named — underlie all dice results |
| 12 | `abilityMod()` | 5505 | ⚠ Not named — used in ASI cascade descriptions |
| 13 | `getProfBonus()` | 5509 | ⚠ Not named — formula says "proficiencyBonus" without naming the function |
| 14 | `getAtkAbilityMod()` | 5514 | ⚠ Not named |
| 15 | `doPlayerAttack()` | 6084 | ⚠ Not named — attack flow documented but function anonymous |
| 16 | `rollInitiative()` | 6152 | ⚠ Not named; HTML also refs `_tomeInit = _tomeBonuses().initiative` (undocumented) |
| 17 | `rollDeathSave()` | 6212 | ⚠ Not named; HTML refs `_kingsSealBonus` + `_tomeBonuses()` affecting death saves (undocumented) |
| 18 | `offhandRoll()` | 6374 | ⚠ F6 scope — belongs in combat.md, not mechanics.md F4 |
| 19 | `oppRoll()` | 6596 | ⚠ F6 scope; 1.2s delay IS documented |
| 20 | `newCombat()` | 6682 | ⚠ Not named; pre-battle chain flow is documented |

**Note:** The 7 "function unnamed" results in Points 11–20 are scope-split findings, not errors. `doPlayerAttack()`, `offhandRoll()`, `oppRoll()`, and `newCombat()` belong to F6 (combat.md scope). The dice primitives (`roll()`, `abilityMod()`, `getProfBonus()`) belong to a utility layer not assigned to any current doc.

---

### IV. Economy Category (Points 21–28)

| # | Claim | HTML line | Status |
|---|---|---|---|
| 21 | `VENDOR_NODES`: BA/MQ/SF/IS/BK (5 nodes) | 5393 | ✓ (no line ref cited in mechanics.md) |
| 22 | `_D100_TABLE` total weight = 100; `LOOT_TABLE` is dead code | `_rollD100Loot()` line 8714 | ✓ |
| 23 | `_magicTierAllowed(magic)`: `level >= magic × 5` | line 8683 | ✓ |
| 24 | `_autoSellDuplicates()`: idempotent per node via `lastAutoSellNode` | line 8219 | ✓ Named in F4 table |
| 25 | Potion pricing: ~3× per tier, tied to exponential HP growth | `POTION_TIERS` | ✓ Design intent documented |
| 26 | `_renderPachelbelSpecials()`: S51 act-gated, S46 Dear Friend, friendly rotating | BA vendor section | ✓ Named correctly |
| 27 | `_rollMonsterWeaponDrop(dmgDie)`: filtered by die ≤ dmgDie | line 8762 | ✓ Named in F4 table |
| 28 | `MONSTER_DROPS`: 8 creature categories, sell range 4–150gp | `MONSTER_DROPS` const | ✓ |

---

### V. Progression Category (Points 29–33)

| # | Claim | HTML line | Status |
|---|---|---|---|
| 29 | `_checkLevelUp()` recurses for multi-level gains | 9655 | ✓ Named, flow documented |
| 30 | `_lu_applyGiftsAndFinish()` at line 14233 | 14233 | ✓ Correct line reference |
| 31 | ASI levels {4,6,8,12,14,16,19}; d6 on `_ASI_TABLE`; CON delta → retroactive HP | `_ASI_LEVELS` Set | ✓ |
| 32 | Bonus HP on milestone levels 7/10/13/18; feature names match FIGHTER_FEATURES | `FIGHTER_FEATURES` | ✓ |
| 33 | Tattoo schema inline: `{type, lvl, name, icon, hpRoll, bonusHpRoll}` | `S_story.tattoos` | ⚠ Partial — F4 table at doc bottom adds `asiChanges`, `goldGift` |

---

### VI. Persistence Category (Points 34–36)

| # | Claim | Status |
|---|---|---|
| 34 | Two-key localStorage: autosave (every move) + checkpoint (inn sleep only) | ✓ |
| 35 | No versioning field; `Object.assign` merge for forward compatibility | ✓ Design decision documented |
| 36 | NG+ preserves `npcFavorability`, `pitPerks`, `ngPlusRun`; all other state reset | ✓ Matches `storyNewGamePlus()` |

---

### VII. Summary Assessment

| Category | Points | ✓ Accurate | ⚠ Gap |
|---|---|---|---|
| Game Design | 10 | 9 | 1 (notoriety line ref) |
| Combat System | 10 | 3 | 7 (dice primitives unnamed; scope-split) |
| Economy | 8 | 7 | 1 (VENDOR_NODES line ref) |
| Progression | 5 | 4 | 1 (tattoo schema partial) |
| Persistence | 3 | 3 | 0 |
| **Total** | **36** | **26** | **10** |

**Structural finding:** mechanics.md's F4 table is comprehensive for economy/vendor functions but explicitly excludes combat.md scope (F6). The 7 "function unnamed" gaps in Combat are scope-split findings — those functions live in combat.md's API surface. True gaps: notoriety line ref, VENDOR_NODES line ref, tattoo schema inconsistency.

**FC03 recommendation confirmed:** The mechanics.md split into `mechanics-combat.md` + `mechanics-economy.md` is natural — F4 (economy) and F6 (combat) are already separated in the document. Splitting makes the scope boundary explicit and eliminates scope-split confusion.

**Undocumented mechanic (flag for FC):** `_tomeBonuses().initiative` at line 6152 and `_kingsSealBonus` at line 6212 affect initiative and death saves respectively. Neither appears in mechanics.md. These belong in the combat doc surface.

---

### VIII. Flowchart — Battle Resolution Pipeline

```
PRE-BATTLE                         BATTLE FOCUS                   POST-BATTLE
==========                         ============                   ===========
storyPreBattle(node)               Round start (1.5 AP)          storyApplyOutcome(won)
  ├─ CONDITION_ITEMS panel         ├─ ⚔ Attack (1.0 AP)            ├─ Won:
  ├─ stealth tab (d20 vs DC 5-16) │    doPlayerAttack()            │    defeatedBattles[code]=true
  └─ Retreat (safe) available      │    ├─ hit → auto-damage        │    XP += AC × maxHP
                                   │    └─ bonus phase opens         │    _checkLevelUp()
storyCommitBattle()                ├─ 😬 Wimper (1.0 AP)           │    _rollD100Loot()
  ├─ gold deducted                 │    bonus phase opens           ├─ Lost:
  ├─ pendingBattle written         ├─ Bonus phase (0.5 AP)         │    pendingBattle retained
  └─ CONDITION_ADV applied         │    ├─ 🗡 Offhand (usedRealAtk) │    respawn from checkpoint
                                   │    ├─ 🧪 Potion
newCombat()                        │    ├─ 📜 Spell Scroll (ADV)
  └─ Battle Focus overlay renders  │    ├─ 💥 Flashbang (ADV)
                                   │    ├─ 🛡 Shield (equip)
                                   │    ├─ 🏃 Flee ✓ (clean)
                                   │    └─ 😬 Pass bonus
                                   └─ Enemy turn (1.2s delay)
                                        oppRoll()
```

---

### IX. Flowchart — Loot Pipeline

```
_rollD100Loot()
  │
  ├─ [roll d100, up to 3 attempts]
  │
  └─ _d100Result(roll)   ← walks _D100_TABLE by cumulative weight (total=100)
       ├─ potion_*   → push to inventory
       ├─ scroll     → Spell Scroll (sell:50)
       ├─ flashbang  → Flashbang (sell:75)
       ├─ gold       → 50–249gp added directly to S_story.gold
       ├─ dagger     → _magicTierAllowed() + not owned → push
       └─ mainweapon → _magicTierAllowed() + not owned → push
             └─ [pool empty or tier blocked → retry; after 3 fails → Minor Potion fallback]

[Next node entry]
  └─ _autoSellDuplicates()  (idempotent: skips if lastAutoSellNode === currentCode)
       ├─ main weapons: keep equipped + best magicBonus per base key; sell rest
       ├─ daggers:      keep equipped + best atkBonus; sell rest
       └─ shields:      keep equipped + best acBonus; sell rest
```

---

### X. File References

| File | Location | Content |
|------|----------|---------|
| `roll2hit-v3.html` | 5393 | `VENDOR_NODES` Set (BA/MQ/SF/IS/BK) |
| `roll2hit-v3.html` | 5482–5486 | `roll()` / `rollN()` dice primitives |
| `roll2hit-v3.html` | 5505–5533 | `abilityMod()` / `getProfBonus()` / `getAtkAbilityMod()` / `getDmgMod()` |
| `roll2hit-v3.html` | 5998 | `CONDITION_ADV` |
| `roll2hit-v3.html` | 6084 | `doPlayerAttack()` |
| `roll2hit-v3.html` | 6152 | `rollInitiative()` — includes `_tomeInit = _tomeBonuses().initiative` |
| `roll2hit-v3.html` | 6212 | `rollDeathSave()` — includes `_kingsSealBonus` modifier |
| `roll2hit-v3.html` | 6374 / 6464 / 6596 | `offhandRoll()` / `bonusRoll()` / `oppRoll()` |
| `roll2hit-v3.html` | 6682 | `newCombat()` |
| `roll2hit-v3.html` | 8219 | `_autoSellDuplicates()` |
| `roll2hit-v3.html` | 8608 | `XP_LEVELS` (20-entry array; max 195,000 at L20) |
| `roll2hit-v3.html` | 8683 / 8708 / 8714 / 8762 | `_magicTierAllowed()` / `_d100Result()` / `_rollD100Loot()` / `_rollMonsterWeaponDrop()` |
| `roll2hit-v3.html` | 9599 / 9655 | `_showLevelUpModal()` / `_checkLevelUp()` |
| `roll2hit-v3.html` | 13007 | `storyPreBattle()` |
| `roll2hit-v3.html` | 14233 | `_lu_applyGiftsAndFinish()` |
| `mechanics.md` | §Battle Mode | 1.5 AP system, XP formula, loot table, flee chain |
| `mechanics.md` | §Story Mode | Vendor, save system, items |
| `mechanics.md` | §F4 Function Reference | Economy + pre-battle functions |
| `combat.md` | F6 scope | `doPlayerAttack()`, `offhandRoll()`, `oppRoll()`, `newCombat()` — F6 scope, not mechanics.md |

---

## §RESEARCH-01 — Arthurian Romance Reference: Chrétien de Troyes

**Source:** *Four Arthurian Romances* — Chrétien de Troyes (c. 1160–1172 CE)  
**Purpose:** Research session — extract structural patterns, parallel analysis to roll2hit arcs, and propose an empathetic romance subplot layer with quote candidates for random romance events.

---

### I. Four Romance Plot Summaries

**Erec and Enide**  
Erec, a Knight of the Round Table, encounters a dwarf who strikes the Queen's damsel in a forest road and later strikes Erec himself. He follows the offending knight to a foreign town and lodges with a poor vavasor (a knight of reduced means) whose daughter — Enide — is of extraordinary beauty and intelligence despite her threadbare white linen dress. Erec borrows arms, champions Enide at the sparrow-hawk tournament, defeats the offending knight Yder, and returns with Enide to Arthur's court where she is re-clothed by the Queen. They wed. Then Erec, absorbed in domestic happiness, stops jousting — and Enide, overhearing gossip that she has unmanned him, weeps. Her tears wake him, and he takes her on a punishing journey through dangerous roads, forbidding her to speak. She speaks anyway, each time, to warn him of ambushes she sees first. The arc is: love → estrangement through misread silence → reconciliation through Enide's courage and Erec's recognition of it. Psychological nuance: neither is simply wrong. Erec tests what he suspects he already knows. Enide passes every test by breaking the rule.

**Cligès**  
Called the "Anti-Tristan." Cligès loves Fenice, who has been married to his uncle through political arrangement. Unlike Iseut, who was complicit in an actual affair with Tristan while married to King Mark, Fenice refuses to give her body where her heart does not go — she obtains a sleeping potion and feigns death to escape her husband and reach Cligès. They hide in a tower garden. The parallel to Romeo and Juliet is explicit and older. The "Anti-Tristan" dimension: Fenice says explicitly, "I will not be Iseut. I would not have my Cligès be a Tristan." The romance insists on interiority over passion — Fenice's position is an argument about the self, not just about desire. The Byzantine setting distances the story from Arthurian geography, using Arthur's court as a legitimizing frame rather than a primary stage.

**Yvain, the Knight of the Lion**  
Yvain defeats a magical knight who guards a forest fountain, then falls in love with that knight's widow Laudine and marries her — a swift, strange, entirely asymmetric union. He leaves to joust at Arthur's court, promising to return within a year. He forgets. A messenger from Laudine publicly shames him — she reclaims her ring, revokes her favor. Yvain collapses into madness in the forest. He is healed by a noblewoman's ointment. He rescues a lion from a serpent; the lion follows him thereafter as a companion and symbol of restored nobility. Through a series of increasingly generous deeds — rescuing a damsel, freeing enslaved workers, championing the weak — he earns the name "the Knight of the Lion" before anyone knows it is he. He returns to Laudine under a false name. She takes him back before knowing who he is; when she learns, she is caught — she swore to make peace with the Knight of the Lion. The arc: promise broken → public shame → madness → slow redemption through accumulated acts → return under a name that is not yet yours again.

**Lancelot, the Knight of the Cart**  
The earliest surviving account of Lancelot's love for Guinevere. Meleagant, a prince of the kingdom of Gorre (a land of no return), abducts Guinevere. Lancelot pursues. On the road he loses his horse and faces a choice: walk (and be shamed as a knight who travels on foot) or ride in a passing cart driven by a dwarf (carts are for criminals; riding in one is public disgrace). He hesitates for two steps — and then climbs in. That two-step hesitation costs him Guinevere's brief coldness when he rescues her: she saw the hesitation. The rescue is accomplished; the affair is consummated; Meleagant is eventually killed. The structural point: the cart is the symbol of love's absolute demand. The hesitation is the symbol of incomplete surrender to that demand. Chrétien was commissioned to write this by the Countess Marie de Champagne and reportedly finished it reluctantly — he tells us this; the romance is simultaneously his most courtly and his most morally equivocal.

---

### II. Structural Parallels to roll2hit

| Romance | Core structural pattern | roll2hit parallel |
|---------|------------------------|-------------------|
| **Erec/Enide** | Poverty + beauty + intelligence (the vavasor's daughter); love earned through service; testing that looks like cruelty but is recognition | **Brynn arc** (ledger debt, firewood, pantry service — domestic acts that earn trust); **Yael escort arc** (protection through presence); NPC fav system (Impartial → Dear Friend as the slow arc Enide walks) |
| **Cligès / Anti-Tristan** | Refusing the tragic template; interiority over passion; love that writes its own ending rather than inheriting the doomed one | **Froberger arc** — Froberger died before he could write Entry 42. The player writes it. The player is Cligès: comes after the tragedy and refuses to repeat it. `entry42Written` is the Anti-Tristan move |
| **Yvain** | Promise broken → public shame → madness → redemption through accumulated generous deeds → return under a name you must re-earn | **Curse score system** — abandoned EB quests raise curse score; Sweelinck's closing speech varies by how many people you helped vs. abandoned. **voidPressure** as Yvain's forest madness. Clearing EB quests is the lion-companion arc: small generous acts restoring the name |
| **Lancelot / Cart** | The two-step hesitation as the measure of incomplete love; public shame as the price of absolute commitment; a rescue that costs the rescuer | **The push to CO** — the player walks into the final boss knowing they've been working toward this the whole run. Hesitation = any flight from the final confrontation. The cart is committing to Level 20 + 7 shards + the boss who will not yield easily |

---

### III. Proposed Romance Subplot Adaptations

#### A. Inn Vignette System — `NPC_ROMANCE_VIGNETTES`

**Trigger:** At any inn node (sleep available), after sleeping, if:
- `npcFavorability[key] >= 2` for any NPC  
- Player visited that NPC's node within the last 3 moves (`lastNpcVisited` flag)

**Mechanic:** A short narrative passage (3–5 sentences) fires as a post-sleep dawn moment. Not a quest. Not a reward. A mood beat. Uses Chrétien's technique of psychological interiority — the narrator observing the character observing the other.

**State flag needed:** `npcRomanceVignetteDelivered: {}` — fires once per NPC per run (resets on NG+).

**Six vignette sketches (one per Dear Friend NPC):**

*Yael (CI node):*
> "You slept poorly. Before dawn the city makes a sound like breathing — the docks, the cart-wheels not yet moving, one dog somewhere two streets over. You have been to Yael's corner more than once now, and she always looks up before you arrive, as if she heard your step from farther away than makes sense. You have not spoken of this. Neither has she. Some things are more useful left as questions."

*Brynn (IN node — after firewood/pantry service):*
> "The inn is warm because you brought wood. You know this in a way that has no words. Brynn set a cup on the table before you asked, and you watched her hands — careful with small things, decisive with heavy ones. You think: a person who is precise with cups knows what they are doing with everything. You think: that is not a small thing to know about someone."

*Quill/Couperin (TV node):*
> "Couperin played something last night that he said had no name. You woke at the third hour with the melody still in your head, which is strange because you cannot usually remember music. The song was about waiting, or about distance — you could not tell which. He never finishes anything. You are beginning to think that is not an accident."

*Pachelbel/Deacon (BA node):*
> "Pachelbel does not say farewell. He slides things across the counter and you take them. That is the transaction. But this morning you passed the City Fence before it opened and saw him through the grating, tallying something, and he was talking quietly to himself the way people do when they have been alone a long time and have made peace with it. You walked past. You came back. You went past again. You did not go in. Some things are not for daylight."

*Weckmann (CY node — after pit training):*
> "You fought under Weckmann's eye until your arms were done. He did not encourage. He corrected. Afterward he said: 'You favour your left. That is good. Do not let them learn it.' Then he was quiet, and you were quiet, and the yard smelled like dust and iron and the particular exhaustion that is not entirely unpleasant. You understood, in that silence, that he has said this to someone before and the someone did not come back."

*Auros/Bruhns (CY node — before final confrontation):*
> "Bruhns reviews her manifests each morning before the city wakes. You have seen it three times now from the street: the candle, the papers, the absolute stillness of someone who is used to carrying things alone. You are going to have to fight her. She is going to have to let you. You do not know, and have stopped pretending to know, whether you are the right person for what comes after."

---

#### B. Chrétien-Informed NPC Description Language

Chrétien's technique: describe beauty through its effect on the observer, not its enumeration. Not "she was fair" but "he could not look at her enough — for the more he looks at her, the more she pleases him." This produces psychological weight rather than inventory.

**Apply to NPC encounter text at fav ≥ 2.** Current NPC_DIALOGUES delivers dialogue. Add a one-sentence **narrative preamble** (rendered in italic before the speech bubble) when `npcFavorability[key] >= 2`:

| NPC | Current fav ≥ 2 state | Proposed preamble (italics, one sentence) |
|-----|----------------------|-------------------------------------------|
| Yael | Dear Friend | *She looks up before you reach the corner.* |
| Brynn | Dear Friend | *The cup is already on the table.* |
| Quill | Dear Friend | *He is mid-phrase and does not stop playing, but he nods.* |
| Pachelbel | Dear Friend | *He slides it across without being asked.* |
| Weckmann | Dear Friend | *He does not look up, but he knew you were there.* |
| Auros/Bruhns | Dear Friend | *She closes the manifold. That is the acknowledgment.* |

These are Chrétien's "the more he looks at her, the more she pleases him" reduced to one observable action — the NPC already knowing you are there. This encodes warmth without declaration.

---

#### C. Froberger Journal — Elegiac Romance Entries

Three of the 31 collectible journal entries should carry emotional interiority about a person Froberger lost contact with — unnamed, referred to only by a descriptor ("the cartographer," "the woman at the archive," "my correspondent in Visby"). This is Chrétien's anti-Tristan move: the grief is not performed, it is documented in the margins.

**Proposed addition — Entry 17 (collectible, mid-run):**
> "The woman at the archive disagreed with my taxonomy of the eastern wards. She was right. I did not tell her she was right until she had already left the city. I wrote it in a letter I addressed to the archive's general post, not to her name, because I did not know if she would want to hear from me. I do not know if she received it. The taxonomy stands corrected in any case."

**Proposed addition — Entry 29 (collectible, late-run):**
> "There is a question I should have asked before she left. I have been composing an answer to it for eleven months in case she asks it, which she will not, because I never asked the question. This is the kind of error that only gets worse with additional documentation."

---

#### D. Quote Candidates for `ROMANCE_QUOTES` Const (Random Inn Events)

A new const `ROMANCE_QUOTES` — an array of short passages drawn from Chrétien's register, adapted to the game's voice, that can surface as flavor text at inn nodes with probability 15% per sleep (gated: never fires before Act III, never repeats). Not mechanically significant. Mood only.

**Draft entries (16 candidates):**

```js
const ROMANCE_QUOTES = [
  // Erec/Enide register
  "She passed before him on a white palfrey and he watched until she was past the gate, and then watched the gate.",
  "He could not look at her enough: for the more he looks at her, the more she pleases him. He cannot help giving her a kiss.",
  "They were so alike in quality, manner, and customs that no one wishing to tell the truth could choose the better of them.",
  "She wept from love and pity when they separated. She had no other cause to weep.",
  "Long he gazed at her fair hair, her laughing eyes — and yet she looked at him with equal steadiness, as if they were in competition.",
  "Law or marriage never brought together two such sweet creatures, and this they did not say aloud.",
  // Yvain/Lion register
  "He forgot. That is the whole of it. He forgot, and when he remembered, it was already the wrong kind of late.",
  "The lion followed because Yvain had saved it, not because Yvain had asked it to. Loyalty does not wait to be invited.",
  "She reclaimed her ring. That was the end of the first version of the story.",
  "He returned under a name she did not yet know was his. She kept her oath. He had been counting on this.",
  // Cligès register
  "She said: I will not be Iseut. I will not give what I do not give freely. That is not the same story.",
  "Fenice chose her ending before the ending could choose her. This is harder than it sounds.",
  "He came after the tragedy and found the door still open. He walked through it. He wrote what was on the other side.",
  // Lancelot register
  "He hesitated for two steps before climbing in. She saw the two steps. He had not thought about two steps.",
  "A shame endured for love's sake is not a diminishment. This is the argument. He climbed into the cart.",
  "The rescue was accomplished. The hesitation was not forgotten. Both were true at the same time.",
];
```

---

#### E. Implementation Notes

| Item | State field | Trigger | Size |
|------|-------------|---------|------|
| Inn vignette system | `npcRomanceVignetteDelivered: {}` | Post-sleep, fav ≥ 2, last 3 moves visited | 6 vignettes, ~5 sentences each |
| NPC preamble lines | no new state | fav ≥ 2 on any visit | 6 one-liners, inline |
| Froberger entries | `journalEntriesRead[]` (existing) | Collectible at specific nodes | 2 new entries (17, 29) |
| ROMANCE_QUOTES | `romanceQuotesDelivered: []` | 15% per sleep, Act III+, no repeat | 16-entry array |

**Dependency chain:** None of these require changes to existing combat or quest logic. All are additive narrative layers. The inn vignette and NPC preamble are the highest-value targets — they change the _texture_ of every high-favorability visit without touching favorability logic.

**Chrétien's craft principle applied:** Do not describe what the character feels. Describe what the character notices. The cup on the table. The gate watched until she is through it. The two steps before the cart. The noticing is the feeling. The reader does the rest.

---

### IV. Parallel Arc Summary

```
CHRÉTIEN                          ROLL2HIT
========                          ========
White Stag hunt → custom          Void Tide → covenant obligation
Sparrow-hawk tournament → proof   EB quests → proof of worth
Dwarf who strikes → indignity     Rough Whiskey → incident that changes things
Vavasor's poverty + daughter      Brynn's ledger + the small acts
Enide's broken silence            Yael's escort narration (she speaks first)
Yvain's broken promise            Abandoned EB quest → curse score +2
Lion companion → redeemed name    Player's tattoos → permanent record of who you were
The cart and two steps            Walking into CO at Level 20 knowing the cost
Entry 42 blank page               Fenice's refused inheritance of Iseut's story
Froberger Entry 41                Froberger's death = Yvain's moment of forgetting
```

The structural loop: **Chrétien's romances are about what you owe the people you said you would return to.** Roll2hit is built on the same question, encoded in mechanics: curse score, NPC favorability, EB return quests, the NG+ memory lines. The Arthurian layer gives this mechanical system its emotional vocabulary.

---

### V. Source Reference

| Text | Status |
|------|--------|
| *Four Arthurian Romances*, trans. W. W. Comfort (1914) | Public domain; full text of Erec read |
| *Erec and Enide* — first 1,844 verses (opening section) | ✓ Read |
| *Cligès* | Summary synthesized from Introduction |
| *Yvain, the Knight of the Lion* | Summary synthesized from Introduction |
| *Lancelot, the Knight of the Cart* | Summary synthesized from Introduction |

---

### VI. Quest Description Rewrites — Before / After

**Chrétien's principle applied throughout:** Do not state the condition. Describe what the character does inside it. A woman who is missing something does not pace — she sets the table for one fewer person and does not mention it. A man who forgot an oath does not despair — he is found standing in the middle of a road, facing the wrong direction, unsure how long he has been there. Write the observable action that contains the interior state.

---

#### A. Main Quest Arc

---

**`mq_1` — Follow the Bloodstained Map**

*Before:*
> A dying courier pressed a map into your hands and said one word: "Sweelinck." Follow the trail.

*After:*
> A dying courier pressed a map into your hands. He said one word — "Sweelinck" — as if that word would explain everything that came before it. You do not know what came before it. The map is bloodstained on the upper right corner. The blood is not yours. Follow the trail.

*Note:* The original is clean and efficient. The rewrite adds the weight of the courier's faith that one name would be enough — and the player's uncertainty about whether it is. This is Chrétien's "she does not know him, yet she drew back only a little" — the smallness of an inadequate explanation that still compels movement.

---

**`mq_2` — Find Brother Aldric**

*Before:*
> Magistra Muffat believes Aldric holds a Codex Shard. He was last seen in the eastern forest.

*After:*
> Magistra Muffat says: Aldric has the second shard. She says this with the certainty of someone who has not been wrong about this kind of thing before, which makes it harder to ask what she might be wrong about. He was last seen entering the eastern forest. He has not come out. The crow-marked trees are his. He put them there himself so he could find his way back.

*Note:* Adds the small detail of the crow-marked trees as Aldric's own navigation system — which implies someone methodical enough to mark trees should have come back. The absence matters more.

---

**`mq_3` — The Sea Road South**

*Before:*
> The Crones traded the sea road for the Runed Stone. Find Captain Draketide at the beach.

*After:*
> The Crones know the sea road is not yours to use without their leave. They have decided — for reasons they did not explain and would not explain if asked — to allow it. The Runed Stone changes hands. Find Captain Draketide at the beach. She has been waiting at this particular crossing for six years. She did not know she was waiting for this. She thought she was just sailing past it.

*Note:* Adds Draketide's long unwitting waiting — the Yvain motif of someone stationed at a place whose purpose they don't yet understand. Chrétien does this constantly: the fountain Yvain's cousin described is right there; everyone knows about it; no one understood it.

---

**`mq_4` — The Goblin Shaman**

*Before:*
> Warlord Mordus needs the Void shaman eliminated. The shaman holds Shard #4 as his ritual focus.

*After:*
> Warlord Mordus does not ask for help. He states a problem and looks at you until you understand that you are the solution. The Void shaman holds Shard #4 as a ritual focus — which means the shaman believes it is a source of power rather than a seal on something much worse. He is wrong about what he has. That is, in the end, what makes him vulnerable.

*Note:* The original is efficient military speech. The rewrite adds the Mordus characterization (no asking, only stating) and the thematic note — the shaman's misidentification of the shard's nature foreshadows the Void Archaeology arc's argument about what the Codex actually does.

---

**`mq_5` — The Djinn's Binding**

*Before:*
> Sandmage Izador will lead you to the djinn who has held Shard #5 for two centuries.

*After:*
> Izador al-Rashun has spent eleven years studying the djinn who has held Shard #5 for two centuries. He will take you there. He does this not because he trusts you with it, but because there is no other way to settle a question that has been eating at him for eleven years: whether a thing that has held something for two centuries understands what it is holding, or whether it is simply holding it because no one has yet asked it to stop.

*Note:* Izador's question is the thematic heart of his character — his journal entry (Entry 31) is literally about a question he cannot answer. This desc positions the djinn encounter as the test of that question, not just a combat objective.

---

**`mq_6` — The Mythic Circuit**

*Before:*
> Oracle Kassiphane named the last two locations: the Oriental Palace and the Scholars' Quarter.

*After:*
> Oracle Kassiphane has been holding these coordinates for longer than she will say. She names them now because you have earned the naming — not by asking but by being the kind of person who came this far with six. The Oriental Palace. The Scholars' Quarter. She says them as if they are the last two words of a sentence she has been composing for years. She asks only that you listen. She does not ask you to interpret.

*Note:* Mirrors her NPC dialogue hook: "She asks only that you listen — not interpret, not argue." The desc and the dialogue hook now rhyme.

---

**`mq_7` — The Reckoning**

*Before:*
> Sweelinck has the seventh shard and the method. Return to Birka. The Convergence is above the city.

*After:*
> Sweelinck has been holding the Weimar Fragment since before you were born. He knew it would take this long. He has the method and the shard and now he has the person who earned both. Return to Birka. The Convergence is gathering above the city — the Void does not wait for dawn and Sweelinck says dawn would be better, and what Sweelinck says about timing has never yet been wrong.

*Note:* Adds Sweelinck's authority (he said "your sibling will find seven" — he has a track record of knowing). The "dawn would be better" note adds urgency without melodrama, which is Chrétien's way: understated consequence.

---

#### B. Birka NPC Arc

---

**`quest_slums_cleanup` — Yael: Slums Cleanup**

*Before:*
> Guard Captain Yael has asked you to clear vermin from the Birka Slums. Three encounters — she'll know when it's done.

*After:*
> Yael Scheidemann runs the Birka Slums detail because she asked for it and because nobody else did. She clears vermin because the commissioners do not read field reports about the Slums. She will know when it is done because she always knows — she has been watching this street since before you arrived on it. Three encounters. Come back when it is finished and she will not say thank you, which in her particular register means something closer to it than most people's explicit gratitude.

*Note:* Yael's "she'll know when it's done" is already strong, but adding that she doesn't say thank you — and that this means more than thank you — is pure Chrétien. Erec recognizes Enide's love through her reluctance to speak it, not through its declaration.

---

**`quest_brynn_ledger` — Brynn: Missing Ledger**

*Before:*
> Innkeeper Brynn is missing a worn ledger book she lent to a merchant who headed to the Slums. Find it.

*After:*
> Brynn Clerambault keeps her accounts in a worn ledger that has been written in, crossed out, and written in again for six years. She lent it to a merchant with good credit and bad judgment and she has been setting a table with one fewer place since. The ledger is in the Slums somewhere. She asked you to find it without saying what it actually contains, which means she trusts you with it more than she trusts the asking.

*Note:* "Setting a table with one fewer place" — this is Chrétien's technique of the small domestic action encoding grief. Brynn's line in the disposition is "good credit and bad judgment and I trusted the credit" — the desc now sets that up as the sustained weight of that trust.

---

**`quest_couperin_lute` — Quill: The Pawned Lute**

*Before:*
> Bard Couperin pawned his lute to Pachelbel for a drink tab. He wants it back. Pachelbel is at the Rough Bar.

*After:*
> Tomas Couperin's lute has been in Pachelbel's inventory for eleven days. He pawned it against a drink tab at the Rough Bar — a transaction he does not regret exactly, but which he replays in a particular way every morning. The lute does not play without him. The drink is gone. The tab is the only thing that remained, and now the lute is not his. Pachelbel will release it for what is owed. The asking is the part Couperin cannot bring himself to do.

*Note:* Adds the asymmetry — Couperin knows how to ask for everything except this one thing. Matches the Quill romance vignette's "he never finishes anything" motif.

---

**`quest_pachelbel_shipment` — Pachelbel: Scholar Box**

*Before:*
> Pachelbel is holding a sealed Scholar Box for someone who never came back. He wants it out of his inventory — check the crypt.

*After:*
> Pachelbel does not deal in debts he did not originate. The Scholar Box has been in his back inventory for four months — sealed, addressed, and belonging to someone who paid for it and then stopped existing in any record Pachelbel can find. The crypt is where things go when they stop being anyone's problem. He wants it out of his problem. He does not say why it bothers him that it is still there. You can see that it does.

*Note:* "You can see that it does" — the Chrétien move of the observer noticing what the character will not say.

---

**`quest_pit_training` — Weckmann: Pit Training**

*Before:*
> Pit Master Weckmann will train anyone who survives the floor. Win 3 pit fights in the Neon Undercity.

*After:*
> Weckmann trains whoever survives the floor. Not whoever asks. Not whoever pays. Whoever survives. He does not explain the distinction because he considers it self-evident. Three fights in the Neon Undercity. He will be watching. He will correct what he sees. He will not encourage, because encouragement is for people who need to be told they are doing it right. He corrects because he believes you can do it right.

*Note:* Weckmann's disposition quote is about refusing to fix a fight rather than host it. The desc now rhymes with that: he corrects rather than encourages, because correction is a higher form of respect.

---

**`quest_void_below` — Auros: Void Below**

*Before:*
> Commander Bruhns has found a Void corruption node deeper in the undercity. She needs it cleared — but won't send anyone alone.

*After:*
> Commander Bruhns found the Void corruption node three weeks ago and has been writing maintenance requests to the Council since. The Council approved it in principle. The Void does not wait for implementation. She will not send anyone into the undercity depths alone — not because the regulations require two, but because she has already lost people in there and she knows what alone means in that context. She is asking you. She is not accustomed to asking.

*Note:* "She is not accustomed to asking" — this is the Lancelot principle. Bruhns is the person who handles things. Asking is its own form of vulnerability. The Lancelot parallel: Guinevere's captivity required Lancelot to ride a cart. Bruhns's situation requires her to ask.

---

#### C. NG+ Remembrance Arc

---

**`quest_ng_01` — Froberger: The Remembered Path**

*Before:*
> You have returned. The city remembers you — and so do the people in it. Revisit three Dear Friends.

*After:*
> You have been here before. The city does not announce this — the city does not announce anything. But the three people who matter have been here too, and they looked up when you came around the corner before you were close enough to be recognized, and this is how you know the city remembers. Go to them. They are not the same as when you left. Neither are you. This is not a problem. This is what the second visit is for.

*Note:* "They looked up before you were close enough to be recognized" — this is the NPC preamble line principle applied directly to the quest desc. The second visit as the specific purpose of NG+ is explicitly named.

---

**`quest_ng_02` — Froberger: The Open Page**

*Before:*
> Entry 42 of Froberger's journal has always been blank. He left it for you.

*After:*
> Froberger's journal ends at forty-one. The forty-second page is blank — not torn, not missing, blank. He stopped there on purpose. You can tell because the previous entry ends mid-thought and the blank page comes after it like an answer to a question he decided not to answer himself. He left it. He knew someone would come back a second time with enough of the story to fill it. That someone is whoever is holding this journal now.

*Note:* "He knew someone would come back a second time" — this positions NG+ not as repetition but as the precondition Froberger planned for. The blank page as an argument about who gets to finish something.

---

**`quest_ng_03` — Froberger: The Letter**

*Before:*
> A sealed letter has appeared at the Coastal Observatory. Froberger's handwriting. It was not there before.

*After:*
> A sealed letter is at the Coastal Observatory. Froberger's handwriting — you know it now well enough to recognize it before you see the name. It was not there on your first run, because on your first run you were not the person it was addressed to. The observatory is the place the arc ends. The letter is what it leaves behind for whoever arrives a second time having already done the work of the first.

*Note:* "You were not the person it was addressed to" — this makes NG+ a transformation, not a replay. The letter is gated not by a flag but by having become a different kind of person.

---

#### D. Void Archaeology Arc

---

**`quest_va_01` — The Architecture: Five Marks**

*Before:*
> Five existing sites carry marks from the First Researcher's original construction. Investigate all five.

*After:*
> Five sites across the map carry marks the First Researcher left two hundred years before you walked past them. You have already been to every one of them. The marks were there the whole time. That is the architecture's argument: it was always here; it was waiting for someone to look at the right five places in the right order and understand what they were standing inside. Go back. Look again. It is a different walk when you know what you are walking through.

*Note:* "It is a different walk when you know what you are walking through" — the retroactive revelation structure that defines the Void Archaeology arc. The player has already completed the dungeon; this quest reveals the dungeon was always already completed.

---

**`quest_va_02` — The Architecture: Constructor's Log**

*Before:*
> The lower archive has a fourth document now — the Constructor's Log. Seven entries. Her handwriting.

*After:*
> A fourth document has appeared in the lower archive. It was not there when Isolde catalogued the collection — or it was there and not visible, which is a distinction the archive does not officially recognize. Seven entries. Her handwriting. The last entry reads: "If someone is reading this, the sealing mechanism has activated. The cage is closed. I am sorry. I did not have a better answer." She wrote that line and then walked out of the archive knowing she would not be back to see if anyone found it.

*Note:* Ends on her act of leaving — the Constructor walking away from a message she would never see delivered. This is the Erec/Enide register applied to the investigation arc: describe the act, not the feeling.

---

**`quest_va_03` — The Architecture: The Sealed Tunnel**

*Before:*
> The Mountain Pass has a tunnel sealed from the inside. Never opened in any record. It will open for you now.

*After:*
> There is a tunnel at the Mountain Pass sealed from the inside. No record in any archive shows it being opened. No record shows it being built. It was sealed before the Scholar Kings existed as an institution and before Froberger was born and before any of the names you have learned on this run were written down anywhere. It will open for you now. It recognizes that you have been doing this work. Sealed things are not locked to everyone — only to those who haven't earned the opening.

*Note:* "Sealed things are not locked to everyone — only to those who haven't earned the opening" — this is the Arthurian motif of the test-as-door. The Chrétien sparrow-hawk: only the one who can claim the fairest lady may lift the hawk. The tunnel opens because you are the right person, not because you have the right key.

---

**`quest_va_04` — The Architecture: The Chain**

*Before:*
> Benedikt has a message. Something about four links. Something about a chain.

*After:*
> Benedikt Rasp has been assembling something for three weeks, since the last time you were in his reading circle. He has the Constructor's Log, Froberger's margin notes, your name, and one other piece he waited to confirm before speaking. He waited because he wanted to be certain you were the kind of person the message should go to. He has decided you are. Return to the Scholar's Quarter. He says it is about a chain. He means it is about what holds.

*Note:* "He waited because he wanted to be certain you were the kind of person" — this is Chrétien's vavasor who waits for the right king for his daughter. The disposition quote already delivers the speech; the desc earns the approach to it.

---

#### E. Epic Battleground Return Quests — Five Selected

These are uniformly flat. The current form: "Return to [NPC] at [Location] for payment. [One gesture]." The gesture is usually the best part — "He holds the formulary without opening it," "She is already marking charts." The fix: let the gesture carry more weight. The payment is the excuse. The return is the real structure.

---

**`quest_ef_return` — Return: Woodcutter Bram**

*Before:*
> Return to Woodcutter Bram at Verdant Forest for payment. He is waiting at the forest edge.

*After:*
> Woodcutter Bram has been at the forest edge since you went in. He did not follow. He said he would wait, and he has been standing there in the particular stillness of someone who has made a decision to trust a stranger and is now living inside that decision. He will pay what he offered. He will not say he was afraid you wouldn't come back. You will be able to tell anyway.

---

**`quest_eo_return` — Return: Navigator Cassius**

*Before:*
> Return to Navigator Cassius at Deep Sea for payment. The lane is open.

*After:*
> Navigator Cassius charted the lane as open the moment you came back up. He had the chart ready before you surfaced, which means he was certain, which means something about the way you went down told him you were the kind of person who comes back. The Deep Sea lane is navigable for the first time in recorded history. He will mark it in every chart he has. He will put your name in the margin. He always puts the name of the person who opened a road.

---

**`quest_ej_return` — Return: Herbalist Mael**

*Before:*
> Return to Herbalist Mael at Jungle for payment. He holds the formulary without opening it.

*After:*
> Mael is at the jungle clearing with the formulary closed in his hands. He has not opened it since you left. The formulary contains the compound's synthesis and twenty years of notes on what it costs to make it and what it costs to use it. He did not give it to you because he could not give it to a stranger. You are not a stranger now. He is still holding it closed, which is how you will know, when you arrive, that he was waiting to give it to you.

---

**`quest_ek_return` — Return: Grounded Seraph Ithiel**

*Before:*
> Return to Grounded Seraph Ithiel at Heavenly Clouds — no gold, but a Star Fragment awaits.

*After:*
> There is no payment in gold. Grounded Seraph Ithiel has no gold and considers this beside the point. What she has is a Star Fragment she has been carrying since before the Spire fell — something she held back from the institution that would have catalogued it and filed it and lost it in protocol. She kept it for the person who would climb the Spire and come down again. You climbed the Spire. You came down. Come to Heavenly Clouds. She has been carrying it a very long time.

---

**`quest_eb_return` — Return: Harbormaster Tula**

*Before:*
> Return to Harbormaster Tula at Beach for payment. She is already marking charts.

*After:*
> Tula is at the chart table before you arrive at the beach. She is marking the wreck site as cleared — drawing a single horizontal line through the notation that has said "UNKNOWN — AVOID" for three years. She does this before the payment, before the report, before anything official happens, because the line on the chart is the thing she has actually been waiting to draw. The gold is secondary. Come back so she can pay what is owed and finish the chart.

---

#### F. Void Tide Events — Rewritten in the Yvain Register

The Void Tide events currently narrate fact. Yvain's madness is not narrated as fact — it is described as behavior. He does not go mad; he is found wandering in the forest. He does not recover; he is bathed in an ointment and wakes up with no memory of the forest. Apply this: the Void does not escalate; people stop doing the things people do, one by one.

---

**Day 3 — "The First Warning"**

*Before:*
> Seven new moons until the Void breaks through completely. Three days spent. Skipping sleep accelerates the tide. Keep moving. Keep resting.

*After:*
> Seven new moons. You have spent three days. The clock is a fact you cannot argue with. What accelerates the Void is not combat, not failure — it is exhaustion. The people who stop sleeping are the ones who notice the Void first, and then they stop sleeping more, and then they stop coming back. Keep moving. Keep resting. These are not two different instructions.

---

**Day 14 — "Void-Touched"**

*Before:*
> Reports of livestock found standing motionless on the midlands road, facing north. They don't respond to sound. The farmers have stopped reporting.

*After:*
> There are livestock standing motionless on the midlands road, facing north. They have been there since before dawn. They do not respond to sound. The farmers have been filing reports for two weeks. They filed the last one three days ago. Not because the livestock stopped, but because the farmers stopped believing the report would be read by anyone who would do anything about livestock that face north and do not move.

*Note:* Adds the human layer — the farmers' exhaustion of bureaucratic hope. This is Chrétien: the wrong is not that the livestock are wrong; the wrong is that the people who should notice have already learned not to.

---

**Day 28 — "The Gates Close"**

*Before:*
> The High Council has sealed Birka's outer gates. The Ivory Circle is silent. Commander Bruhns has moved her forces to the spire approach.

*After:*
> The High Council sealed Birka's outer gates this morning. The Ivory Circle, which has issued seventeen statements in the past fourteen days, has issued none. Commander Bruhns moved her forces to the spire approach before dawn — before the gates closed, before the order came, before anyone told her to. This is what knowing what is coming looks like from the outside: you act two hours early and no one understands why until the thing arrives.

*Note:* Bruhns as the person who acts before the order — this is the Erec-recognizes-Enide-knows-better structure. The people of value act on what they see, not on what they are told.

---

**Day 42 — "Critical — Last Week"**

*Before:*
> The convergence is imminent. The Codex Cradle is already resonating. Seven days. The Void's outriders are at every major crossing. Move now.

*After:*
> The Codex Cradle is resonating without being touched. You can hear it from the Scholars' Quarter. The Void's outriders are at every major crossing — not hidden, not hunting, just present, which is its own kind of message. Seven days. Sweelinck said seven new moons and there is one left. He was right about the others. He did not say what happens in the eighth. Move now. Before the outriders stop merely standing at the crossings and begin asking what you are carrying.

---

### VII. NPC Dialogue Hook Rewrites — Selected

The `NPC_DIALOGUE` const has very strong voices in some nodes (Brynn, Muffat, Izador) and functional-only text in others. Applying the Chrétien register selectively:

---

**CI — City Guard Captain**

*Before:*
> "Move along. The lower districts are sealed after dark — third night running. Whatever came out of the crypt, it's not going back in on its own."

*After (no change needed):* This is already strong. "It's not going back in on its own" is the Yvain-register: a simple statement about behavior that contains everything.

---

**IN — Innkeeper Brynn**

*Before:*
> "He left this in the room. Paid three nights ahead, didn't sleep the third one. I kept it. Felt like someone would come asking."

*After (no change needed):* "Felt like someone would come asking" is perfect Chrétien — she acted on a feeling she cannot justify. Do not change this.

---

**BA — City Fence (Pachelbel)**

*Before:*
> "No names, no receipts, no regrets. Show coin first. We can arrange the rest."

*After:*
> "No names, no receipts. If you have regrets, that's yours to carry. Show coin and we begin."

*Note:* Small change: removing "no regrets" (which is bravado) and returning regrets to the customer (which is accurate). Pachelbel does not perform indifference. He simply has a policy.

---

**FO — Brother Aldric**

*Before:*
> "You'll want to go into that grove. I'd advise against it. You'll go anyway. Come back when you're done bleeding."

*After (no change needed):* Perfect. "Come back when you're done bleeding" is the Weckmann register — correction, not encouragement. Keep it exactly.

---

**DC — Sandmage Izador al-Rashun**

*Before:*
> "What does the Codex actually protect? The world, you say. That is the answer to a different question. Think longer. I'll wait."

*After (no change needed):* This is already one of the best lines in the game. The Entry 31 callback structure is precise. Keep it.

---

**SQ — Archivus Ptolemy Sweelinck**

*Before:*
> "You found six. The seventh completes the map. I have been holding the Weimar Fragment since before you were born — waiting for someone who has earned the right to carry it to the Cradle."

*After:*
> "You found six. The seventh is the map — not the destination, the map. I have been holding the Weimar Fragment since before you were born. I knew the day I took it that I would not be the one to carry it. I have been waiting for whoever earned the carrying. You found six. You have earned it."

*Note:* "You have earned the carrying" — elevates the handoff from logistics to recognition. Sweelinck has been carrying something for decades that was never his to keep. The relief of that handoff is the emotional payload.

---

### VIII. Synthesis: The Chrétien-Informed Description Grammar

Patterns extracted from the rewrites above, usable as a style guide for all future quest desc writing:

| Pattern | Chrétien example | Applied form |
|---------|-----------------|-------------|
| **Describe the act, not the feeling** | "She wept from love and pity. She had no other cause to weep." | "She is filling in the insurance form" (Zephyrine's return quest) |
| **Describe what someone does inside a decision** | Lancelot's two steps before the cart | "He has been standing there in the particular stillness of someone who has made a decision to trust a stranger" |
| **The small action that encodes the whole interior** | "The more he looks at her, the more she pleases him. He cannot help giving her a kiss." | "She is already marking charts" — Tula's return quest |
| **The person who acts before the order** | Erec pursues Yder before being told to | "She moved her forces before dawn, before the gates closed, before anyone told her to" |
| **The thing that was always there** | The fountain Yvain's cousin described — it was right there — | "The marks were there the whole time" — va_01 |
| **Trust encoded as not-asking** | Enide's father gives her without conditions | "She trusts you with it more than she trusts the asking" — Brynn's ledger |
| **The person who is not accustomed to asking** | Guinevere requiring Lancelot's rescue | "She is asking you. She is not accustomed to asking." — Auros void below |
| **Correction as respect** | Weckmann's disposition quote | "He corrects because he believes you can do it right" — pit training |
| **The letter written to no one specific** | Froberger's general-post letter | "She walked out of the archive knowing she would not be back to see if anyone found it" |
| **The name in the margin** | Chrétien's "he made of it what it had never been before" | "He will put your name in the margin. He always puts the name of the person who opened a road." |

---

### IX. The Yvain Search Passage — Supplemental Analysis

**Source:** *Yvain (The Knight of the Lion)*, vv. 4703–5184

This passage contains four structural elements not present in the earlier Erec excerpt: the inheritance dispute between sisters, the night ride through rain guided by a horn, the trail of testimonies that leads a damsel to a man she has never met, and the castle of Pesme Avanture where everyone warns you away and you go in anyway. Each maps precisely onto roll2hit architecture.

---

#### IX.A — The Trail of Testimonies

From the text, the damsel seeking Yvain never meets him directly. She follows him through a chain of witnesses:

> *"I can testify to that," the other said: "for the day before yesterday God sent him here to me in my dire need."*

> *"They told her that they had seen him defeat three knights in that very place. Whereupon, she said at once: 'For God's sake, since you have said so much, do not keep back from me anything that you can add.'"*

> *"You can come up with him to-night, if you are able to keep his tracks in sight, and are careful not to lose any time."*

The quest is constructed entirely from secondhand accounts. No one knows where he is now — only where he was, and what he did there, and how long ago. The accumulating testimony is itself the structure: by the time she catches up, she knows him from everyone except himself.

**Roll2hit parallel — Void Archaeology arc:**

The player never meets Froberger. They follow him through marginal notes, through people who knew him, through a mechanism he activated without knowing he activated it. The trail of testimonies is the quest structure:

- Entry 7 marginal note → five marks
- Froberger's access revocation record → Isolde's archive  
- Benedikt's reading circle → unredacted name
- Constructor's Log → sealed tunnel
- Entry 42 → four-author chain

Each document says: "he was here, and then he went there." No one knows where he is now. The player follows the track. The "come up with him to-night, if you keep his tracks in sight" is Entry 42 — you catch up to Froberger when you write what he left blank.

**New rewrite — `quest_va_01`:**

*Before:*
> Five existing sites carry marks from the First Researcher's original construction. Investigate all five.

*After (extended version):*
> Someone passed through five sites two hundred years ago and left marks. The marks are at nodes you have already visited — you walked past them without knowing. No one told you they were there because no one who knew is still alive to tell. What you have instead are Froberger's margin notes, which mention the marks in the way a person mentions something they saw once in passing and could not explain and never went back for. Follow the track. Each site will say where he was and how long ago. The fifth will say where he went next.

---

#### IX.B — The Night Ride and the Horn

> *"She continued in prayer until she heard a horn, at which she greatly rejoiced; for she thought now she would find shelter, if she could only reach the place. So she turned in the direction of the sound, and came upon a paved road which led straight toward the horn."*

The damsel is completely disoriented — no road, no light, rain, mud to the horse's girth. What navigates her is not sight or map but sound. She turns toward the horn before she knows what it leads to. The faith is not in the destination but in the principle that a sound in darkness leads somewhere habitable.

**Roll2hit parallel — Void Tide and waypoint system:**

The Void Tide events are the rain and forest. The waypoint system is the horn. When exhausted (`shortRests <= 0`), the game automatically routes to the nearest inn — a horn in the dark. The player does not need to see the inn; they only need to follow the path the game sets.

The Void Tide text currently narrates external fact (the sky is wrong, livestock face north). The Yvain passage suggests an interior register instead — what it feels like to be in the dark when you hear something you cannot yet explain.

**New rewrite — Void Tide Day 7 "Darkening Skies":**

*Before:*
> The sky over Birka is darker. Birds stopped flying at dawn two days ago. Locals are calling it a weather pattern. It is not a weather pattern.

*After:*
> The sky over Birka has been wrong for two days and no one can say exactly how. The birds stopped flying at dawn. The locals are calling it a weather pattern — not because they believe it but because weather pattern is a container that holds the thing without requiring them to name it. You are not required to call it anything. You are required to keep moving. If you hear something in the dark, follow it. It will lead somewhere.

---

#### IX.C — The Warning Crowd and the Wayward Heart

> *"Ill come, sire, ill come. This lodging-place was pointed out to you in order that you might suffer harm and shame."*

> *"My lord Yvain, who is listening, says: 'Base and pitiless people, miserable and impudent, why do you assail me thus?'"*

> *A lady, who was somewhat advanced in years, who was courteous and sensible, said: "They mean no harm in what they say; but, if thou understoodest them aright, they are warning thee not to spend the night up there; they dare not tell thee the reason for this."*

> *"Lady," he says, "may God reward you for the wish. However, my wayward heart leads me on inside, and I shall do what my heart desires."*

Three layers: the crowd that warns without explaining, the courteous woman who translates the warning, and the knight who hears all of it clearly and goes in anyway. "My wayward heart leads me on inside" is not recklessness — it is deliberate acceptance of the cost of going forward. He knows the warning is genuine. He goes because his heart says the thing inside is the thing he needs.

**Roll2hit parallels:**

1. **The Warden quest at MT:** The Warden is the castle of Pesme Avanture — a thing that has been here a long time, that has hurt people, that everyone who has come near warns about. The courteous woman is Benedikt: he explains what the crowd only shouts.

2. **The CO final approach:** Every signal in the game from Act V onward says the Void is winning, the gates are closing, the Ivory Circle is silent. The player who arrives at CO with Level 20 and 7 shards has heard all of this. They go in anyway. "My wayward heart leads me on inside" is the exact register of the final approach.

3. **The DF/GL/HM nodes (the broken radio cluster):** Grimshaw, Bertha No-Bank, Zeke "The Signal" — these three are the warning crowd. They warn about something in the register of people who have stopped believing warnings help. They are Chrétien's crowd but emptied of urgency: they have been warning so long that the warning has become ritual.

**New rewrite — `quest_vs_warden` — The Warden:**

*Before:*
> You have found the Void Shaman — the Antecedent's Last Warden, 200 years misdirected. The mandate was corrupted in transmission. The question is whether they can be shown this.

*After:*
> The Warden has been at the Mountain Pass for two hundred years, executing a mandate that was already wrong when it arrived. Everyone who has come close enough to understand this has been turned away or worse. You have the Constructor's Log. You have Froberger's notes. You have the names of all four links in the chain. The Warden does not know any of this — does not know that the thing they have been guarding against was sealed by the same person who sent the mandate. Go in. The question is not whether you can explain it. The question is whether something that has been wrong for two centuries can recognize its own wrongness when someone finally holds up the record.

*Note:* The Warden's own disposition quote — "If I'm wrong, then I needed to be stopped. That's — that's actually fine" — is already the resolution. The quest desc earns that line by establishing that the Warden has been waiting, on some level, for exactly this.

---

#### IX.D — The Inheritance Dispute as Legitimacy Structure

> *"My damsel, who is deprived of her inheritance by a sister, expects with your help to win her suit; she will have none but you defend her cause."*

> *"My dame, may I advise, recommend, and urge her to surrender to you what is your right."*

The elder sister moved first and claimed everything. The younger sister's only recourse is to find the knight everyone else has heard of but no one can locate. The quest is to find someone powerful enough to enforce a right that is already established — the right is not in question, only the enforcement.

**Roll2hit parallel — Tilbury Harbor / Rennau arc:**

Rennau has the ledger. The Conclave has the protocol. The Harrow is already gone. The right is not in question (the ships are lost, the manifest exists, the embargo is bad policy) — only the enforcement. The arc is the younger sister's quest: finding someone willing to take up a case that is already right but has no champion.

**New rewrite — `quest_tl_02` — Rennau: The Embargo:**

*Before:*
> The harbor is closed under Emergency Trade Protocol 7. Adjutant Vonn is politely immovable. Decide what to do with the manifest.

*After:*
> The harbor has been closed for three weeks under Emergency Trade Protocol 7. Adjutant Vonn enforces it politely and completely — he is not wrong about the protocol, only about whether the protocol is right. The manifest proves ships have gone missing. The embargo prevents finding out why. Both things are true at the same time and the Conclave considers this a policy matter above Vonn's grade. Rennau has the ledger and no leverage. Decide what to do with the manifest. The younger sister always has to find someone willing to take her case.

---

#### IX.E — New Patterns from the Yvain Search Passage

Added to the §VIII grammar table:

| Pattern | Yvain example | Applied form |
|---------|--------------|-------------|
| **The trail of testimonies** | "I can testify to that — the day before yesterday he came here" / "they told her they had seen him defeat three knights in that very place" | Void Archaeology desc: "Each site will say where he was and how long ago. The fifth will say where he went next." |
| **Navigation by sound in darkness** | The damsel turning toward the horn before knowing what it leads to | Waypoint system: "If you hear something in the dark, follow it. It will lead somewhere." |
| **The warning crowd and the translating woman** | The crowd shouting "ill come" / the courteous woman who explains | Benedikt translating the archive's warning; the three broken-radio NPCs as the exhausted warning crowd |
| **The wayward heart** | "My wayward heart leads me on inside, and I shall do what my heart desires" — said clearly, to a person who gave good advice | CO approach / the Warden quest: the player goes in after hearing every warning, understanding what they mean |
| **The right that has no champion** | The disinherited younger sister; the right is not contested, only unenforced | Rennau's ledger: the ships are gone, the manifest exists, the protocol is bad policy; the problem is finding someone willing to take the case |
| **Catching up to someone through their track** | "You can come up with him to-night, if you keep his tracks in sight" | NG+ as catching up to Froberger: "You catch up to Froberger when you write what he left blank" |
| **The damsel falling sick on the quest, another taking her place** | The ill sister; a second damsel continues the search | Layered quest activation: `quest_va_02` only activates after `quest_va_01`; each quest hands off to the next like one damsel to another |

---

#### IX.F — The 40-Day Deadline

> *"If she desires, she may have forty days to secure a champion, according to the practice of all courts."*

The 40-day postponement is the structural pressure that drives the damsel's search. It is a deadline imposed by law rather than by the void. It is not punishment — it is the court's formal recognition that finding the right person takes time, and that time is finite.

**Roll2hit parallel:** The game's Day 49 limit and `voidPressure` counter are the same structure. The game gives you 49 days — not because the Void is arbitrary, but because the court has recognized that finding the Codex and the method takes time, and that time is finite. The "40 days" is the exact same contract: find your champion, or concede the field.

The Day 49 defeat screen currently reads: *"the player chose rest; the Void sealed its breach at dawn."* The Yvain register would say: *"Forty-nine days. You needed one more. The Void does not grant postponements."*

**New rewrite — Time-Limit Defeat screen text:**

*Before (mechanics.md description):*
> Triggers when the player attempts to sleep on Day 49. The sleep overlay immediately shows the defeat screen instead of confirming rest. Narrative: the player chose rest; the Void sealed its breach at dawn.

*Proposed narrative text for the actual defeat screen modal:*
> Day 49. You lay down. The court had granted forty-nine days to find a champion and the time is complete. The Void does not grant postponements — not because it is cruel, but because it does not know what a postponement is. It simply sealed the breach at dawn, as it would have done on Day 1 if you had not come. You came. You kept it open forty-nine days. That is not nothing. It is not enough, but it is not nothing.

---

#### IX.G — Selected Direct Quotes for `ROMANCE_QUOTES` Addition

From this passage, five new entries for the `ROMANCE_QUOTES` const:

```js
// Yvain search passage — quest / search register
"She continued in prayer until she heard a horn, at which she greatly rejoiced; for she thought now she would find shelter, if she could only reach the place. So she turned in the direction of the sound.",
"I have long searched for you. The great fame of your merit has made me traverse many a county. But I continued my quest so long, thank God, that at last I have found you here.",
"You can come up with him to-night, if you are able to keep his tracks in sight, and are careful not to lose any time.",
"My wayward heart leads me on inside, and I shall do what my heart desires.",
"She had already made several loving and insistent appeals to my lord Gawain; but he had said to her: I cannot do it; I have another affair on hand. Then the damsel at once left him.",
```

*Note on the last entry:* "I have another affair on hand" — Gawain's refusal is the most devastating line in the passage because it is so reasonable. The disinherited sister does not blame him. She simply leaves and finds someone else. This is the register for when the player abandons an EB quest: they had another affair on hand. The quest-giver does not blame them. They simply stop waiting.
