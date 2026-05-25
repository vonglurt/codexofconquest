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
