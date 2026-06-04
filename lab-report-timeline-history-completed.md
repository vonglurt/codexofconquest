<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

## Appendix: Routine Cleanup Notice

*Nothing to see here. We did a standard cleanup pass. All items were completed. Most had to do with quests. No discussion was necessary.*

*What follows is, without cause or incident, a 383-line information dump covering: 46 named development layers (combat systems, navigation, economy, death saves, level-up architecture, world maps, epic bosses, NPC dialogue trees, endings, and a full narrative arc about a wandering researcher named Froberger); 32 global constants that form the structural skeleton of the game; 55 runtime state fields tracking everything from void pressure to pit training wins; 11 archived lab reports; 60 specific feature proposals ranging from a bard's accruing debt to an empty room in an inn that has an extra pillow for no reason; a complete Baroque organ composer renaming migration across all characters and places; and a composer-origin-city geographic naming system grounded in Hamburg, Paris, Husum, Rouen, and Schlackenwerth. Sweelinck is the Watcher. Froberger is the protagonist. The Void is at the center. It was always at the center.*

*All completed. All quests. Routine.*

---

# Roll2Hit — Development Timeline & Implementation History

> Extracted from `plan.md` on 2026-05-22. This document is the complete archived record of the Roll2Hit implementation log — every layer, every design constant, every state field, every fulfilled feature suggestion, and the Baroque organ composer naming migration. Source of truth for running code: `roll2hit-v3.html`.

**File:** `roll2hit-v3.html`  
**Status at archive:** Layers 0–45 complete. All S-suggestions (S1–S60) addressed. No pending layers or items.

---

## I. Completed Layers Reference

> All 46 layers (Layer 0–45) are fully implemented and verified against the codebase. Detailed step-by-step implementation specs are in the lab reports listed in Section V (Archive Provenance). The table below is the canonical timeline: each row is one named development unit, its step codes, its key functions and constants, and its completion status.

| Layer | Name | Steps | Key Functions / Consts | Status |
|---|---|---|---|---|
| 0 | Story Mode Foundation | L0-A–L0-E | `storyMode`, `S_story`, `storyExit()`, `storyInit()` | ✅ |
| 1 | NODE_MAP & Navigation | L1-A–L1-D | `NODE_MAP`, `storyMove()`, `storyRender()` | ✅ |
| 2 | Quest Engine | L2-A–L2-D | `QUEST_DB`, `storyCheckQuests()`, `S_story.quests` | ✅ |
| 3 | Gate Locks & Shards | L3-A–L3-C | `GATE_LOCKS`, `S_story.shards`, `storyCollectLoot()` | ✅ |
| 4 | Inventory & Items | L4-A–L4-C | `S_story.inventory`, `storyRenderInventory()`, `CONDITION_ITEMS` | ✅ |
| 5 | Sleep & Void Tide | L5-A–L5-D | `storySleep()`, `storyConfirmSleep()`, `S_story.voidPressure` | ✅ |
| 6 | Vendor Economy | L6-A–L6-C | `VENDOR_NODES`, `POTION_TIERS`, `storyVendorToggle()`, `storyRenderVendor()` | ✅ |
| 7 | Hearth Home & Transmort | L7-A–L7-B | `storySetHearthHome()`, `storyUseTransmort()`, `S_story.hearthHome` | ✅ |
| 8 | Monster Drops & Sidequests | L8-A–L8-C | `MONSTER_DROPS`, `sq_battling`, `sq_leveling`, `S_story.dropsCollected` | ✅ |
| 9 | Circuit Corridors & Junctions | L9-A–L9-H | `CORRIDOR_CELLS`, `buildCorridorMap()`, `storyCorridorTravel()`, `_setActivePath()`, J1–J7 nodes | ✅ |
| 10 | Hunting Grounds & Stalk | L10-A–L10-F | `HUNTING_GROUNDS`, `MT` node, `storyStalk()`, `_stalkedMonsterPick()`, `_getQuestTargetKeys()` | ✅ |
| 11 | Story Battle Focus System | L11-A–L11-H | `_storyRollInit()`, `_showBattleOverlay()`, `_storyEnemyTurn()`, `_storyBattleVictory()`, `#story-battle-overlay`, `#story-victory-overlay`, `storyCommitBattle()` | ✅ |
| 12 | Dynamic XP, Heal-on-Kill, Loot | L12-A–L12-E | `LOOT_TABLE`, `XP_BY_TIER`, reward formula `floor(0.1 × AC × maxHP)`, `#svo-heal`, `#svo-gold` | ✅ |
| 13 | Rest Architecture & Necklace | L13-A–L13-G | `storyShortRest()`, `_maybeAddKnowledgeBead()`, `_knowledgeIcon()`, `S_story.shortRests`, `S_story.knowledge`, `.rest-chip`, `.inv-item-knowledge` | ✅ |
| 14 | Game Loop Overlay Separation | L14-A–L14-D | `#practice-badge`, `_showBattleOverlay()` hides `#main-body`, `⚙ God Mode` button, Advanced/Refocus symmetric toggle | ✅ |
| 15 | Story Death Saves & Corpse Quests | L15-A–L15-K | `STARTER_DAGGER`, `_storyEnterDeathSaves()`, `_storyRollDeathSave()`, `_storyDeathSaveCrawl()`, `_storyDeathSaveFall()`, `_storyRetrieveCorpse()`, `S_story.corpsesQuests`, `#sbo-death-save-panel` | ✅ |
| 16 | Battle Condition Rounds, DIS Display & Spell Scrolls | L16-A–L16-G | `conditionRoundsLeft`, `spellAdvantageReady`, `_renderSboSpells()`, `_storyUseSpellScroll()`, LOOT_TABLE (8+2), `#sbo-spell-row`, `sbo-dis-badge`, `has-dis` CSS | ✅ |
| 17 | Full Action Economy, Shield Mechanic & Battle Clarity | L17-A–L17-L | `usedBonusAction`, `equippedShield`, `_storyAdvanceToBonus()`, `_storyWimper()`, `_storyFleeClean/Mutual()`, `SHIELD_ITEMS`, `_calcPlayerAc()`, `_renderSboShield()`, `_storyUnequipShield()`, `#sbo-ap-row`, `storyRenderInventory()` 6-section rewrite | ✅ |
| 18 | Character Levels, Flashbang & Condition Economy | L18-A–L18-G | `XP_LEVELS`, `_checkLevelUp()`, `_LEVEL_REWARDS`, `COMBAT_ITEMS`, `storyBuyFlashbang()`, `_storyUseFlashbang()`, `S_story.level/atkBonus/acBonus`, `#s-level`, `#svo-levelup`, CONDITION_GOLD ×100 | ✅ |
| 19 | New Player UX & Battle Readiness | L19-A–L19-K | Starting kit (2× potion + dagger), gold 150, condition hint, safe-retreat button, stealth % hint, wimper redesign (phase-only pass), safe flee via wimper→bonus, AP hint text, `usedRealAttack` flag, enemy threat badge `#prebatt-threat` | ✅ |
| 20 | End State: Void Defeat & Victory Arc | L20-A–L20-H | `storyVoidDefeat(type)`, `story-defeat-modal`, Day-49 defeat, void pressure defeat (pressure 10 via missed sleeps), enhanced victory stats (level/XP/battles), voidPressure +1 per exhaustion cycle | ✅ |
| 21 | Fighter Level-Up System | L21-A–L21-J | `FIGHTER_FEATURES`, `_ASI_TABLE`, `_LEVEL_GOLD_GIFT`, `_LEVEL_SHIELD_GIFT`, `_checkLevelUp()` refactor, `_showLevelUpModal()`, `_rollLevelHp()`, `_applyASI()`, `_grantMagicShield()`, `#story-levelup-modal`, `S_story.abilityScores`, `XP_LEVELS` to L20 | ✅ |
| 22 | Shield Tier Expansion & Dagger Drops | L22-A–L22-F | `SHIELD_ITEMS` 4 tiers, `DAGGER_ITEMS` 3 offhand daggers, `_renderVendorShields()`, `_rollWeaponDrop()`, `S_story.equippedWeapon`, `weaponAtk` in atkTotal | ✅ |
| 23 | Notoriety & Dynamic Enemy Scaling | L23-A–L23-G | `_notoriety()`, `_notorietyWeights(n)`, patched `_weightedMonsterPick` + `_stalkedMonsterPick`, corridor formula `10 + n×1.5 + q×4`, `#s-notoriety` stat row | ✅ |
| 24 | Main Hand Weapon Drop System | L24-A–L24-H | `WEAPON_ITEMS` (42 entries), `_rollMainWeaponDrop()`, `equippedMainWeapon` sync in `_showBattleOverlay()`, main weapon inventory section | ✅ |
| 25 | d100 Unified Drop Table & Magic Tier Gates | L25-A–L25-H | `XP_LEVELS` rebalanced (max 195k), `SHIELD_ITEMS` 6 tiers, `DAGGER_ITEMS` 4 tiers, `WEAPON_ITEMS` 70 entries (5 tiers), `_magicTierAllowed()`, `_rollD100Loot()`, unified loot in `_storyBattleVictory()` | ✅ |
| 26 | Offhand Slot Exclusivity | L26-A–L26-B | Dagger/shield equip handlers enforce mutual exclusivity; each auto-displaces the other to inventory | ✅ |
| 27 | Vendor Auto-Sell & Economy Polish | L27-A–L27-E | `_autoSellDuplicates()` on vendor open, `storySellEquipment()`, `⚔ Sell Equipment` button in vendor | ✅ |
| 28 | Final Boss & Level 20 Endgame | L28-A–L28-D | `BOSS_COMMANDER_AUROS` (AC22/HP300/ATK+12/3d8+6), `storyPreFinalBattle()`, pulsing final-battle chip at CO, `storyCheckVictory()` now gated behind CO defeat | ✅ |
| 30 | World Minimap | L30-A–L30-C | `_renderWorldMiniMap()` 14×23 grid, `NODE_COORDS`, yellow/green/dim cells, square 9×9 gap-grid | ✅ |
| 31 | Waypoint Navigation | L31-A–L31-E | `_bfsPath()`, WAYPOINT button replaces NEW GAME, `storyWaypoint()`, `storySetWaypoint()`, custom terrain quest | ✅ |
| 32 | Local Mini-Map Restoration | L32-A | 7×7 local map parallel to world map, `#mini-map-grid` 184×182px | ✅ |
| 33 | NSEW Exit Block | L33-A–L33-B | `#story-nsew` right of world map, `_updateExitLinks()` terrain labels, `_terrainLabel()` helper | ✅ |
| 34 | City Slums Node | L34-A–L34-F | 12 vermin monsters, `city_slums` WORLD_DB terrain, SL node (num:51), CI `N:'SL'`, NODE_COORDS `SL:{r:4,c:16}` | ✅ |
| 35 | Map Polish & Auto-Return | L35-A–L35-B | Victory banner auto-dismisses (1.4s fade) when story active; terrain label in node title | ✅ |
| 36 | Fighter Features, Tattoo System & Action Economy | L36-A–L36-J | `FIGHTER_FEATURES`, tattoo system, bonus HP roll levels (7/10/13/18), `_extraAttackCount()`, `indomitableCharges`, `surgeCharges`, `storyCharToggle()`, `storyRenderCharSheet()`, `progRows()` | ✅ |
| 37 | D-pad 3×3 Grid, Starting Weapons, Boyscout Token | L37-A–L37-G | `.dpad-corner` CSS, 3×3 d-pad HTML, `storyQuickWait()`, `STARTER_POINTY_STICK` + `STARTER_FLINT_DAGGER`, `shortRestedAtNodes`, Necklace Token, dice-based sleep (2×/1×d10+CON), auto-inn BFS | ✅ |
| 38 | World Map Technique Unification | L38-A | `_renderWorldMiniMap()` rewritten to match local map: background-color nodes, corridor glyphs, trail/visited/current states, `wmc-icon`; removed `cx-*` border connectors; CSS: `184×112px`, `1fr` columns | ✅ |
| 39 | Epic Battlegrounds | L39-A–L39-S | `EPIC_BOSS_POOL` (20 bosses), `EB_NPC_DIALOGUE` (20 NPCs), `EB_STORY_ITEMS` (11 items), 20 EB nodes/coords/WORLD_DB/quests (40 entries), payment negotiation modal, `DANGER: EPIC` overlay, auto-waypoint on EB defeat, minimap crimson display | ✅ |
| 40 | Codex of Conquest Narrative Arc | L40-A–L40-N | `FROBERGER_JOURNAL` (17 entries), `SWEELINCK_DIALOGUE_VARIANTS` (4 brackets), `_curseScore()`, `#story-journal-overlay`, two ending variants (Covenant/Cursed), `ebReturnsCompleted` tracking, victory screen "People Returned To" counter | ✅ |
| 41 | Birka Roots + NPC Favorability | L41-A–L41-S | `BIRKA_NPC_PROFILES`, `npcFavorability`, `_npcFavor/setNpcFavor/lubeckFriends`, `_renderNpcCard`, 6 QUEST_DB entries, Rough Whiskey vendor, drunk pit fight, Yael escort, Sweelinck Birka variant | ✅ |
| 42 | NPC World-Truth Dialogue System | L42-A–L42-S | `NPC_DIALOGUES` (6 NPCs × 4 states × 5 quotes), `_getNPCDialogue()`, `_hasActiveQuestFor()`, `_missionComplete()`, `_checkDearFriendUpgrade()`, Covenant Keeper ending (names each person), Groundhog Day Cursed ending, `disposition` field in QUEST_DB, `couperiSongReceived` + `bruhnsDepthsReported` triggers | ✅ |
| 43 | Endings, Echoes & Item Mechanics | L43-A–L43-W | `SWEELINCK_NAMING_LINES`, `NPC_EPILOGUES`, `FROBERGER_EPILOGUE`, `ROUGH_WHISKEY_REACTIONS`, `COVENANT_STANDING_LABELS`, `PIT_PERK_UNLOCKS`, `NPC_NG_PLUS_GREETINGS`, `_covenantStanding()`, `_buildSweelinckNamingSequence()`, `_buildEpilogueScroll()`, `ngPlusRun` state, Covenant Ceremony SVG, epilogue scroll, Cursed Seal Echo, Froberger's Last Note | ✅ |
| 44 | The Living World | L44-A–L44-T | `PETRA_STALL_STATES`, `WORLD_PROGRESSION_EVENTS`, `NODE_NPC_KEYS`, `NPC_FAREWELLS`, `NPC_ACT_THREE_LINES`, `BRYNN_MAINTENANCE_TASKS`, `QUIET_RETURN_RECEIPTS`, `DEACON_CODE_TEXT`, `_getNodeMapColor()`, `_getFarewell()`, `_checkWorldProgressionEvents()`, `_renderFinalMap()`, minimap warmth tinting, farewell lines, Act III weight | ✅ |
| 45 | The Web of Connections | L45-A–L45-M | `FROBERGER_TRACES`, `YAEL_PATROL_NODES`, `WECKMANN_TRAINING_LOG`, `NIVERS_DIALOGUE`, `_checkFrobergerTrace()`, `_getYaelLocation()`, NPC cross-reference lines, Nivers patrol node, Yael field patrol, Weckmann training log, Room 6, Fighter's Token, cross-item triggers | ✅ |

---

## II. Design Constants Quick Reference

> The 30 named constants below are the structural skeleton of `roll2hit-v3.html`. Each entry gives the constant's role in the game system; exact initializer syntax lives in the source file.

| Const | Purpose |
|---|---|
| `NODE_MAP` | 51 nodes (42 story + 7 junctions + MT + SL); all `N/E/S/W/sleep/battle/loot` fields |
| `NODE_COORDS` | Grid position `{r,c}` for all 51 nodes; used by corridor router and map renderer |
| `QUEST_DB` | Quest definitions: activateNode, objectiveText, reward, completionCheck |
| `GATE_LOCKS` | 4 passage locks + shard gate; each entry: `{from, to, item, label}` |
| `CONDITION_ITEMS` | 11 condition items: name, icon, effect, sell value |
| `CONDITION_GOLD` | Pre-battle cost per condition (flat gold, not inventory) |
| `CONDITION_ADV` | Adv/DIS modifier keyed by lowercase-underscore condition name |
| `WORLD_DB` | 42 terrain types; each has `monsters: []` with full stat blocks |
| `MONSTER_POOL` | 341+ monsters across 7 source pools; keyed by monster key string |
| `MONSTER_DROPS` | Trophy drop per monster key; `{name, icon, sell}` |
| `CORRIDOR_CELLS` | Computed corridor grid; key `"r,c"` → `{dirs, glyph, terrain, edges}` |
| `HUNTING_GROUNDS` | 42 terrain → `{displayName}` for stalk overlay; Layer 39 adds 20 epic terrain entries |
| `EPIC_BOSS_POOL` | 20 deadly-tier bosses keyed by slug; AC/HP/ATK/dmg/epicDesc |
| `EB_NPC_DIALOGUE` | 20 quest-giver NPC profiles; payment negotiation, return beat, specialItem |
| `EB_STORY_ITEMS` | 11 special non-gold EB rewards: Forge Rune, Runic Hammer, Star Fragment, Swamp Blessing, River Pass, Ship Warrant, Escort Contract, Sand Cipher, Pirate Cache, Crimson Warrant, Kazrath Journal |
| `FROBERGER_JOURNAL` | 17 entries `{entryNum, nodeCode, readAloud, text}`; 5 read-aloud + 12 collectible |
| `SWEELINCK_DIALOGUE_VARIANTS` | 5 variants keyed by curse score bracket + Birka variant if `_lubeckFriends()≥3` |
| `BIRKA_NPC_PROFILES` | 6 Birka NPC profiles (Yael/Brynn/Quill/Pachelbel/Weckmann/Auros); key/name/occupation/node |
| `NPC_DIALOGUES` | 6 NPCs × 4 states × 5 quotes each; cycled by visit count; priority chain in `_getNPCDialogue()` |
| `POTION_TIERS` | 4 potion tiers: minor/healing/greater/superior; `{name, icon, heal, cost, sell}` |
| `LOOT_TABLE` | 20-entry d20 drop table: 8 Minor / 2 Spell Scroll / 5 Healing / 3 Greater / 2 Superior |
| `SHIELD_ITEMS` | 6 tiers: Small +1 → Legendary +5 → Ancient +6 AC; vendor-gated by minLevel; `_magicTierAllowed()` enforces tier gates |
| `DAGGER_ITEMS` | 4 offhand daggers (drop-only): +1 Royal (Lv3) / +2 Painite (Lv7) / +3 Gaping (Lv13) / +4 Voidsteel (Lv20) |
| `WEAPON_ITEMS` | 70 main-hand weapons (14 base × 5 magic tiers 0–+4); `_magicTierAllowed()` gates drops by level; bonus adds to both attack and damage |
| `FIGHTER_FEATURES` | Fighter Champion features per level 2–20; `{name, icon, tattooName, desc, shortRest?, longRest?, asi?, bonusHpRoll?}` |
| `_ASI_TABLE` | 6-entry d6 table; each: `{name, icon, delta, desc}` — delta is `{str/dex/con: N}` |
| `_LEVEL_GOLD_GIFT` | Gold gifted on non-ASI levels: `{2:250, 3:350, 5:500, …, 20:2500}` |
| `_LEVEL_SHIELD_GIFT` | Magic shield gifts on milestone levels: L3 → +1 Shield, L11 → +2 Shield |
| `XP_BY_TIER` | Legacy tier XP; kept for reference — L12+ uses `AC × maxHP` formula |
| `BOSS_COMMANDER_AUROS` | AC22/HP300/ATK+12/3d8+6; final boss at CO node; requires Lv20 + 7 shards |
| `VENDOR_NODES` | Set of node codes with vendor access (5 nodes: BA/MQ/SF/IS/BK) |
| `XP_LEVELS` | 20-entry array; max 195,000 XP at L20; targets ~150 battles to reach L20 |

---

## III. State Fields Quick Reference

> The 55 `S_story` fields below represent the complete runtime save-state of a player session. Fields added in later layers appear toward the bottom.

| Field | Type | Purpose |
|---|---|---|
| `S_story.hp / hpMax` | number | Player story HP |
| `S_story.gold` | number | Current gold |
| `S_story.day` | number | Current day (1–49) |
| `S_story.shards` | number | Codex Shards collected (0–7) |
| `S_story.voidPressure` | number | Void Tide counter (0–10) |
| `S_story.xp / xpLastBattle` | number | Cumulative XP / last battle award |
| `S_story.level` | number | Current character level (1–20) |
| `S_story.atkBonus / acBonus` | number | Story combat modifiers (accumulated from level rewards + ASI) |
| `S_story.abilityScores` | object | `{str,dex,con,int,wis,cha}` — starts at `{16,12,14,10,12,8}` (Human Fighter) |
| `S_story.shieldTier` | string\|null | `null` / `'shield_plus1'` / `'shield_plus2'` — tracks magic shield tier granted |
| `S_story.levelUpLog` | array | Records each level-up `{lvl, hp, asiResult, goldGift, shieldGift}` |
| `S_story.shortRests` | number | Remaining short rest charges today (0–3) |
| `S_story.knowledge` | array | Necklace of Knowledge beads |
| `S_story.inventory` | array | All held items (potions, trophies, keys, scrolls, shields, weapons) |
| `S_story.quests` | object | Quest status map: `questId → 'active'|'done'|'failed'` |
| `S_story.defeatedBattles` | object | nodeCode → true for completed story battles |
| `S_story.hearthHome` | string | Transmort Scroll destination node code |
| `S_story.checkpointNode` | string | Last inn slept at (respawn point) |
| `S_story.battleTurn` | `'player'|'enemy'` | Initiative state for current battle |
| `S_story.battleRound` | number | Current round number; increments at enemy turn start |
| `S_story.surpriseAdvantage` | boolean | Stealth check passed — ADV on first attack |
| `S_story.usedMainAttack` | boolean | Main action consumed this round |
| `S_story.usedRealAttack` | boolean | A genuine weapon attack was made this round (gates offhand) |
| `S_story.usedBonusAction` | boolean | Bonus action consumed this round |
| `S_story.conditionRoundsLeft` | number | Rounds remaining on opponent condition effect |
| `S_story.spellAdvantageReady` | boolean | Spell scroll ADV queued; consumed on use or expired at round end |
| `S_story.equippedShield` | object\|null | Currently equipped shield `{name, icon, acBonus, tier?}`; null = unshielded |
| `S_story.equippedWeapon` | object\|null | Equipped offhand dagger `{name, icon, atkBonus, tier}`; adds to attack roll only |
| `S_story.equippedMainWeapon` | object\|null | Equipped main hand weapon `{name, icon, die, count, magicBonus, tier}`; overrides `S.weapon` in battle |
| `S_story.pendingBattle` | object\|null | Active battle descriptor |
| `S._pendingDrop` | object\|null | Staged monster-specific drop for next victory |
| `S.char.baseAc` | number | AC snapshot taken at battle start; prevents shield-stack on re-entry |
| `S_story.surgeCharges` | number | Action Surge charges remaining (0–2); restored on short rest; Lv17+ = 2/rest |
| `S_story.indomitableCharges` | number | Indomitable death-save reroll charges (0–1); restored on long rest; Lv9+ |
| `S_story.tattoos` | array | Tattoo items `{type:'tattoo', lvl, name, icon, hpRoll, bonusHpRoll}` pushed on each level-up |
| `S_story.shortRestedAtNodes` | object | nodeCode → true; tracks first short rest per location for Necklace Token |
| `S_story.sleptAtNodes` | object | nodeCode → true; tracks first sleep per location for Boyscout Night double rolls |
| `S_story.journalEntriesRead` | array | entryNums of FROBERGER_JOURNAL collectible entries found |
| `S_story.ebReturnsCompleted` | object | ebCode → true; set on EB return quest completion |
| `S_story.ebNegotiatedPayments` | object | ebCode → gold accepted; set during EB payment negotiation |
| `S_story.npcFavorability` | object | npcKey → 0/1/2/3 (Impartial/Friendly/Dear Friend/Dear Friend+) |
| `S_story.roughWhiskeyUsed` | boolean | true after drunk pit fight event fires; prevents repeat |
| `S_story.yaelEscortUsed` | boolean | true after one-time escort narration fires; reverts to re-viewable mode |
| `S_story.pitTrainingWins` | number | CY battle wins while `quest_pit_training` active |
| `S_story.ngPlusRun` | number | NG+ generation counter; 0 = first run |
| `S_story.frobergerLastEntryRead` | boolean | true after player finds Journal Entry 41 |
| `S_story.gameDay` | number | Alias for `S_story.day`; used in NPC ambient systems |
| `S_story.actNumber` | number | Current act (1–8); derived from node act field |
| `S_story.currentCode` | string | Current node code; set on each navigation |
| `S_story.s8VargaWatches` | number | Varga observation count (S8 mechanic, 0–3) |
| `S_story.archiveVisited` | boolean | Blue Shutters Archive entered (S7) |
| `S_story.s29LineDelivered` | boolean | Auros/Froberger theory line delivered (S29) |
| `S_story.s49BrynnDelivered` | boolean | Brynn Entry-41 reaction delivered (S49) |
| `S_story.raisonToolsUsed` | boolean | Raison's Tools assessment used (S46) |

---

## IV. Implementation Archive Provenance

> Step-by-step implementation specs for individual layers are not reproduced here. Each lab report below is the canonical source for that layer's design decisions, exact step codes, and diff notes.

- Layers 9–13: `lab-report-plan-cleanup-v13.md`
- Layers 14–17: `lab-report-plan-cleanup-v17.md`
- Layer 18: `lab-report-leveling-flashbang-condition-economy.md`
- Layer 39: `lab-report-epic-battlegrounds.md`
- Layer 40: `lab-report-game-story-codex-of-conquest.md`
- Layer 41: `lab-report-birka-beginner-arc.md`
- Layer 42: `lab-report-npc-dialogue-system.md`
- Layer 43: `lab-report-endings-and-echoes.md`
- Layer 44: `lab-report-living-world.md`
- Layer 45: `lab-report-web-of-connections.md`
- Full architectural review: `lab-report-architecture-full.md`

---

## V. Suggestions for Further Development (S1–S60)

> Sixty specific, implementable feature ideas recorded at the close of Layer 45. All are marked ✅ (addressed in layers 43–45 or in design). S24–S26 are tooling notes, marked out of scope. The section is preserved verbatim as a design record — these are the game's possible futures at the time of archive.

*These are specific, implementable ideas in rough priority order. Each one is a "continue" in waiting.*

---

### Dialogue & NPC Depth

**S1 — Sweelinck Remembers Names** ✅  
In the Covenant ending, Sweelinck names the people the player helped. The list is dynamically generated from `npcFavorability` keys. If player is Friendly with Yael: "Yael, who keeps the city honest with her own hands." If Dear Friend: "Yael, who told you about the riot report." Each relationship level has a different line. The ceremony of naming is the reward.

**S2 — Brynn's Daughter Returns** ✅  
A late-game node (post-Act IV) in IN triggers: Brynn's daughter sent something. Not a quest — just a letter, hand-delivered by a courier NPC who appears once. The letter references what was in the journal, which the player found. If `brynnsJournalRead = true`, the letter mentions it. If not, it's still a beautiful letter. Two different emotional registers for two different players.

**S3 — NPC Memory of Player Choices** ✅  
When the player returns after Act III, friendly NPCs have seen what's been happening in the world. Yael: "The smoke to the northwest — that was Tilbury, wasn't it." Brynn: "A merchant came through last week. Said the roads south were impassable. I didn't ask why." These are not quest hooks — they're acknowledgment that the world has been moving and the NPCs are in it.

**S4 — Tomas Couperin Writes the Song** ✅  
If the player triggers `couperiSongReceived`, Quill's last Dear Friend quote describes the song he wrote. Mechanically: the song text is stored in `NPC_DIALOGUES.couperin.dearFriend[3]` as a full verse — rendered in a distinct typographic style (blockquote, slightly larger, different background) when that quote cycles. One time only — the song is played once. After that, the Dear Friend pool continues with the next quote. The verse is about someone who keeps returning.

**S5 — Pachelbel Inherits the Salvage** ✅  
If player is Dear Friend with Pachelbel AND completes Act VI: Pachelbel leaves a parcel at BA for the player. Inside: Raison's tools. A note: "He was a better fence than me. If you need to move something difficult, these'll help you think like he did." Mechanical reward: new salvage-evaluation ability (identify hidden item value). Story reward: Raison finally has a name in the world.

**S6 — Weckmann Trains Auros** ✅  
If both Weckmann and Auros are Friendly: they start talking to each other. A shared dialogue line appears when the player visits CY: Weckmann and Auros mid-conversation, which the player interrupts. Different content depending on whether Void Below has been triggered. This has no mechanical effect — it's just two characters having a life while the player isn't watching.

---

### World Building & Exploration

**S7 — The Blue Shutters Archive (Scholar King)** ✅  
Yael mentions the blue-shuttered building on Scholar's Row in her Friendly dialogue. If the player goes to Scholar's Row (a node or sub-location within CI district), there is a buildable encounter: the archive staff won't let players in. But if Yael is Friendly, she can be asked for a letter of introduction. The archive contains: one EB quest document, one Froberger journal page (collectible Entry 33 or 35, whichever is rarest in playthrough), one structural map of the undercity that Auros has been looking for.

**S8 — Varga's Pigeon Route** ✅  
Yael's Friendly dialogue mentions Varga as an informant tell. Varga can be added as a minor NPC at the market node — not a quest giver, just a presence. If the player watches him (visits market node 3+ times without buying), a clue unlocks: Varga's route changed again. This leads to a small deduction puzzle — where's the coin moving? Reward: information about a merchant smuggling arc that connects to Pachelbel's enemy system.

**S9 — Undercity as Dungeon Layer** ✅  
Auros's depth work implies an actual traversable sub-map. Post-Act II, with `bruhnsDepthsReported = true`, a "🔴 Descend" option appears at CY. The undercity is a 5-node mini-map overlaid beneath the main map — rendered in a dark-blue palette. It has its own monster pool (undercity-specific), no natural light (disadvantage on perception checks), and at the bottom: the Void Below encounter. Weckmann's Dear Friend unlock and Auros's depth data are both required to survive it.

**S10 — Gigault's Bread Route as Calendar** ✅  
Brynn mentions Gigault goes home early when trouble is coming. If Gigault is added as a market-node NPC (one line only — never a quest giver), her presence/absence at the node at specific game-time moments becomes a signal system. The player learns to read Gigault the way Yael does. This is pure flavor that functions as gameplay — a predictive system communicated entirely through an NPC who never explains herself.

**S11 — The Eleven-Year Guard (Nivers)** ✅  
Yael's Friendly dialogue mentions a guard named Nivers who has never called in sick. If Nivers appears at a CI patrol node (visible but not interactable initially), and the player has Yael at Dear Friend, Yael can point her out: "Twenty-three years now. I stopped asking." Nivers has one line of dialogue: "Evening." The implication is the game's business. The player supplies it.

---

### Mechanical Systems

**S12 — NPC Favorability Persists Through New Game+** ✅  
If the player starts New Game+, npcFavorability values are preserved. When the player returns to CI on a NG+ run, Yael says: "You again. I wondered if you'd come back." The impartial pool is replaced with a NG+ pool — not warmer necessarily, but more knowing. She references things the player did in the previous run without naming them. She was watching.

**S13 — Item: Froberger's Last Note** ✅  
A craftable or findable item: a scrap of parchment in Froberger's handwriting. Not in the journal system. Found at a random EB node (different each run, seeded at start). Text: "If you find this — the person you're becoming is visible from the outside. Check in with someone who knew you before you got good at this. They'll tell you." Mechanical: no effect. Story: it's the only thing Froberger wrote that was addressed to someone else.

**S14 — Rough Whiskey: Extended Mechanic** ✅  
Currently: drunk fight at CY. Extended: Rough Whiskey triggers unique dialogue from ANY NPC if consumed before visiting them. Yael: "You've been drinking. I'm not going to pretend I don't know what that means." Brynn: pours water, says nothing. Quill: laughs, plays something worse. Pachelbel: "Come back sober. I don't deal with people who can't track their decisions." Weckmann (after quest): "Good. Now we see what you're like when you can't think." Each response reveals character. The item teaches you who these people are faster than three sober visits.

**S15 — Curse Score as Hidden Stat** ✅  
The curse score is currently never displayed. Extension: in the character sheet, after Act III, a new section appears: "Covenant Standing." Not a number — a description. One of five strings mapped to curse score brackets. The player can track their arc without understanding the formula. The strings: "Unknown" / "Watcher" / "Warden" / "Keeper" / "Covenant." These are titles Sweelinck uses in his ending speech. The player sees them as aspiration before understanding them as achievement.

**S16 — EB Negotiated Payments as Alternative Victory** ✅  
Currently tracked but not deeply mechanized. Extension: NPCs who accepted negotiated payment (non-combat resolution) can send follow-up messages to the player's journal. Not quests — acknowledgments. "You let me pay instead of fight. I've been thinking about that. Here's something that might help you." Small item or information. The message arrives at the next safe-rest node. This makes non-violence produce story, not just avoid combat.

**S17 — Pit Training as Skill Tree** ✅  
Weckmann's training (pitTrainingWins) currently gives access to the Friendly state. Extension: 5 training visits unlock 5 distinct combat perks: (1) "Controlled Aggression" — +1 attack on flanked targets; (2) "Read the Room" — know enemy HP tier before engaging; (3) "Ground Game" — on knockdown, bonus action attack; (4) "Corner Work" — recover 1d4 HP between combat rounds at DK/CY; (5) "Weckmann's Lesson" — once per rest, when HP drops below 20%, bonus action: Recompose (cancel disadvantage). The tree is invisible until the player visits Weckmann the first time post-Friendly.

---

### Narrative & Story

**S18 — Froberger's Handwriting Changes** ✅  
Froberger's journal entries are currently text. Extension: render early entries (1-10) in a slightly warmer typographic style (more punctuation, longer sentences) and late entries (30-41) in a clipped style (shorter sentences, fewer dependent clauses). This is implementable as a CSS class on the journal entry container — `class="journal-entry early|mid|late"` — with different font-weight and letter-spacing. The visual change is subtle enough that only readers will notice. That's the point.

**S19 — EB NPCs Mention Each Other** ✅  
The 20 EB NPCs occupy the same dangerous world. Some know of each other. Muffat (DE) could mention the Leviathan sighting from Froberger's Entry 23 (DS node). The glacier NPC could reference the Spire — "heard the fog there moves against the wind." These cross-references reward players who are doing multiple EB quests in the same session. The world feels connected rather than procedurally assembled.

**S20 — The Covenant Ceremony** ✅  
The Covenant ending at SQ currently resolves in text. Extension: a simple animated overlay — Sweelinck draws a sigil in the air, rendered as an SVG path animation, 3 seconds. Sound: a low hum (existing audio system). Then: the victory screen. The ceremony is brief and deliberate. It doesn't need to be cinematic — it needs to feel like something that has been done before, many times, by someone who knows the weight of it.

**S21 — NPC Epilogues at End of Run** ✅  
Post-covenant: the victory screen includes a scrolling list of NPC statuses, populated from `npcFavorability`. Impartial: "You passed through. They're still there." Friendly: "[Name] remembers you." Dear Friend: "[Name] — [one sentence of what they did after]." Yael Dear Friend: "Yael filed a second report. This one she kept a copy of." Brynn Dear Friend: "Brynn's daughter came home. They stayed up late." Quill Dear Friend: "Quill finished the song. He plays it every Friday." These are 12 words each. They're everything.

**S22 — The Cursed Seal Epilogue (Groundhog Day)** ✅  
If the Cursed Seal ending triggers, the epilogue reads differently. Instead of NPC statuses: one line for each NPC the player left at Impartial. Not accusatory — observational. "Yael: you passed through." "Brynn: she didn't know your name." "Quill: he was playing when you left." And then: "Sweelinck said the next Warden will come. He has seen this pattern seventeen times. He believes the eighteenth will be different." The game ends. The belief is Sweelinck's, not the game's. The player decides what to do with it.

**S23 — Second Playthrough Memory** ✅  
A small, optional New Game+ feature: when the player starts a new run with existing save data, a brief overlay appears at the title screen: "Sweelinck is waiting." On first visit to SQ, Sweelinck has one new line: "You've been here before. I can tell by the way you move. You know what's coming." Then normal dialogue. This is all the NG+ content. It's enough.

---

### Technical & Architecture

**S24 — NPC_DIALOGUES as Loadable Module** (tooling, out of scope)  
As the quote library grows to 700+ entries, the const will be large. Architecture plan: keep `NPC_DIALOGUES` as a separate JS object defined in a `<script>` tag before the main game script. It can be edited as its own section without scrolling through game logic. All game logic references it by name. No behavioral changes — just separation for maintainability.

**S25 — Quote Authoring Workflow** (tooling, out of scope)  
Define a comment-block format above each NPC in NPC_DIALOGUES:
```js
// YAEL STORMHOOK — Guard Captain
// World Truth: Every riot that gets suppressed becomes three quiet riots.
// Enemy: Commissioners who scrub evidence of unrest.
// Wound: Filed the riot report herself.
// Writing register: Direct. Short sentences. Specific nouns. No reassurance.
```
This makes the character voice portable — a new collaborator can read the block and write new quotes in register without reading the whole lab report.

**S26 — A/B Quote Testing** (tooling, out of scope)  
Add a dev-mode flag: `DEBUG_CYCLE_ALL_QUOTES = true`. When active, each NPC visit cycles through the entire pool (all states) in order, ignoring favorability. This lets a writer read all quotes in sequence for voice-consistency checking without playing through the game. Paired with `DEBUG_NPC_STATE = 'friendly'` override.

---

**S27 — The Map as Memory** ✅  
As the player returns to visited nodes, the minimap fills with color — not the standard visited-node color but a warmth gradient based on what happened there. A node where a friend lives is slightly warmer than a cleared combat node. A node where an EB was returned glows faintly. This is purely visual and cosmetic. The player's map becomes a picture of their run.

**S28 — Sweelinck's Age** ✅  
Sweelinck has been at SQ for longer than the current city exists. He mentions this once — not in the main dialogue arc, but as a random Impartial line when the player revisits SQ mid-game: "The city you came from wasn't always called that. Neither was the one before it. The Void predates the naming." No mechanic attached. Just true.

**S29 — Auros and Froberger's Theory** ✅  
Auros in her Dear Friend state mentions she's finishing the theory Froberger started. If the player has `froberger_last_note_read = true` AND Auros is Dear Friend: she has a special dialogue line that references the note: "You found his note. He left them at certain nodes. I think he knew which ones mattered." This is the only moment two pieces of Froberger evidence connect in real time.

**S30 — The Bard's Debt as Living System** ✅  
Quill's debt accrues at a fixed rate (simulated — not real-time, but incrementing on specific game-day transitions). After the quest is resolved, the debt counter stops. But if the player never starts Quill's quest: by Act V, the counter is so large that Quill's impartial dialogue changes: "The number is a number now. I don't look at it anymore." This is the only NPC whose state degrades if ignored.

**S31 — Weckmann and the Illegal Pit (Post-Quest)** ✅  
After the illegal pit operation is shut down, a new minor node becomes accessible: the empty lot where it ran. One interaction only — the player can search the space. Result: a fighter's token (someone who fought there). Not a quest item. Not valuable. Weckmann's Dear Friend dialogue, if triggered after the player brings the token to CY: "I know that mark. They're okay. They moved on. Don't ask me how I know." He won't say more. He knows.

**S32 — Quill's Second Song** ✅  
Quill's Dear Friend state mentions he's working on a second song. If the player completes NG+ and returns to TV with Quill at Dear Friend: the second song is ready. Rendered the same way as the first — blockquote, distinct typography. The second song is about returning. Where the first was about someone who kept coming back, the second is about the city still being there when they do. It's the same chord progression. Quill says: "I reused it. It fit."

**S33 — Gigault as Off-Screen Character** ✅  
Brynn mentions Gigault, Yael mentions Gigault. If the player visits the market node (once built) and searches, they find Gigault's bread stall — but Gigault is never there when the player arrives, or always has her back turned, or is mid-conversation. She is completely off-screen. She is named by two NPCs. She exists. She affects the world (Yael uses her schedule). The player never speaks to her. She is how the world is larger than the player.

**S34 — The Third Act Weight** ✅  
After Act III, the game world changes visually: sky color shifts (already planned). But also: NPC idle animations (if any) slow slightly. Dialogue lines are shorter. The world is heavier. Friendly NPCs still recognize you. But their greetings are quieter. Brynn: "You look tired." Yael: "Rough stretch." Quill: just nods and starts a slower song. The world registers what's happening without explaining it.

**S35 — Pachelbel's Moral Code as Item** ✅  
The "code" on Pachelbel's wall can be a readable object. Click on it: text overlay with his four rules. Simple, direct prose. Not dramatic — more like a shop's return policy written by someone who thought very carefully about what a fair return policy looks like. Players who read it understand Pachelbel completely before they ever interact with him. It's also the best possible description of how to play the game ethically.

**S36 — EB NPC Memory of First Visit** ✅  
When the player returns to an EB node for a second or third run (NG+), the EB NPC has an alternate opener: "You again. Different run, same Void. The world doesn't tire of needing things from capable people." The 20 EB NPCs each get one NG+ first-line. It means 20 new lines total — a small investment for players who replay to see what changes.

**S37 — Weckmann's Name for What He Does** ✅  
In Weckmann's final Dear Friend quote, he says something like: "I became very good at reading fighters." Layer 43 notes this. Extension: the character sheet's Combat Style field (if built) has a special value for players who have all 5 pit perks: "Weckmann's Student." Not a class. Not a title. A relationship recorded in game data.

**S38 — The Whiskey Bottle as Recurring Prop** ✅  
Rough Whiskey can be re-purchased. Each bottle is slightly different in Brynn's dialogue (if player buys one from BA and then visits IN): "Pachelbel's selling that now? He used to refuse it. Things change." This is one line, triggered by `roughWhiskeyInInventory = true` when visiting IN. It connects two nodes, two characters, one item. The world is denser for it.

**S39 — Map Travel as Pacing Tool** ✅  
Long-haul travel routes (e.g., CY → SW → DK → DE) currently show corridor nodes. Extension: on routes where the player has a Friendly NPC at the origin node, a one-line farewell appears at the top of the first corridor panel. Not an overlay — a small italic header: *"Weckmann: 'Watch the ground on the SW road. It's unstable after the rains.'"* Disappears after one step. This costs one string per Friendly NPC per major departure route. The world is still present as you leave it.

**S40 — Auros Submits Her Report (Live)** ✅  
If `bruhnsDepthsReported = true` AND player has reached Act V: a note appears in the journal: "Structural assessment submitted — Auros's name on the cover page." Not a quest reward. Not prompted. The journal just gains a new entry. This is what it looks like when an NPC's arc continues while the player is somewhere else. Auros doesn't need the player to finish her work. She needed them to make it possible.

**S41 — Brynn's Maintenance List** ✅  
The third step creaks. The kitchen closes at ninth bell. The fire needs tending. Brynn mentions these things in passing. Extension: an optional interaction at IN lets the player help with the maintenance — fix the step, bring firewood, restock the kitchen from a nearby vendor. No quest tag. No reward except Brynn's Dear Friend quote cycling slightly faster (visit count +1). This is the mechanic of noticing. The player does a thing because it needed doing.

**S42 — Covenant Keeper Achievement Variant** ✅  
If `_missionComplete() && _curseScore() <= -6` (perfect run — not just complete but actively generous, ebNegotiatedPayments ≥ 5, pitTrainingWins ≥ 5, etc.): the victory screen shows a different Covenant Standing string: "Covenant Keeper (True)." Same mechanics. Different acknowledgment. The game does not explain what makes it "true." Players who get it will know.

**S43 — The Void's First Sign** ✅  
In Act I, before any EB quests are available, there is one dark cell at the edge of the map that flickers — the WW cell nearest the SQ node. When the player tries to navigate to it, the path fails silently (no message). By Act III, the flicker is gone. By Act V, the cell is accessible — it contains one line: "You saw this before. It was waiting for you to be ready." No combat. No loot. A marker that the player ignored in Act I.

**S44 — The Ledger at IN** ✅  
Brynn's ledger (mentioned in story.md) is a clickable object at the IN node. Inspecting it: a scrollable page showing fictional room-nights and meal costs for the last thirty days of game time. At the bottom: a balance in the red. Not dramatically — about 8 copper. But red. The player cannot help with the ledger mechanically. But they can buy a meal. The meal costs 3 copper. The ledger updates.

**S45 — Quill Plays Without Prompting** ✅  
When the player visits TV at night (if a day/night cycle exists, or on specific game-day transitions): Quill is playing a song they haven't heard before. It's not on the request list. He doesn't explain it. If the player clicks on him: "Oh — this one's not finished. Come back." On the next visit: he's playing a different unfinished thing. He's always working. The songs are never named.

**S46 — Pachelbel's Inventory as Character** ✅  
The BA vendor stock changes slightly run-to-run based on `S_story.deaconFriendly`. Impartial Pachelbel: standard salvage items. Friendly Pachelbel: one additional item per visit tagged "no questions." Dear Friend Pachelbel: an item called "Raison's Tools" — a salvage kit that identifies hidden item value, as described in S5. The inventory is a biography.

**S47 — The Weight of Returning** ✅  
After any EB quest is completed and returned, the returning NPC at SQ (or relevant return node) should have a one-line acknowledgment that is different from a quest completion pop-up: not "Quest Complete" — something like a quiet receipt. "Weckmann nods." "Brynn sets down the ledger." "Yael doesn't say anything, but she marks something in her patrol log." This is the sound of the world registering that you came back.

**S48 — Sweelinck's Last Question** ✅  
In every ending variant, after all the naming or silence, Sweelinck asks one question. The question is different per ending:
- Covenant Keeper: "Will you come back?" (The player cannot answer. The screen fades.)
- Imperfect Covenant: "What would you have done differently?" (No answer possible.)
- Efficient Seal: "Do you remember their names?" (The answer is displayed — just the names, if favorability ≥ 2.)
- Cursed Seal: "Were you alone by choice?" (No answer possible.)

The question is the last thing on the screen before the title returns.

**S49 — Froberger's Entry 41 Read-Aloud** ✅  
Entry 41 ("Come back") is the last and most important journal entry. Currently: read in the journal system. Extension: if `frobergerLastEntryRead = true` AND the player is at an IN or SQ node: Brynn or Sweelinck (whichever is present) has an optional interaction: "You read the last entry." They don't ask what it said. They know what it said. Brynn: "He was trying to come back. He just — ran out of time to figure out how." Sweelinck: "He wrote it for the next one. I think he knew you'd find it."

**S50 — The Seal That Holds** ✅  
The final image of every ending is the same: the map, zoomed out, all nodes visible. The EB nodes glow if returned. The Birka nodes glow if Friendly or Dear Friend. The SQ node is bright. The WW cells are dark. The Void is sealed — it's just the dark water cells now, not a threat. The player can see, in the shape of the light, what they did and what they left behind. No text. Just the map. Then: credits.

---

**S51 — Seasonal Market Stock** ✅  
The BA vendor stock shifts based on `gameDay` thresholds. By Act III, Pachelbel has acquired goods that weren't available in Act I — specific items with backstory ("came in on the north road, no name on the seller"). By Act V, his stock reflects what's happening in the world — certain goods scarcer, others suddenly available. Pachelbel's inventory is a low-resolution news feed.

**S52 — The City at Night** ✅  
A day/night cycle (already implied by game-day tracking) could differentiate node visits by time. Some nodes are closed at night (TV closes late, market closes at dusk). Some nodes are different at night — Yael's patrol is smaller, Brynn's inn is quieter, Weckmann runs unofficial sparring instead of official fights. Night travel has slightly higher encounter rates (already in the theme). The world has a rhythm.

**S53 — Froberger's Previous Visits** ✅  
Each major NPC has a memory of Froberger — mentioned once, unprompted. Not a quest hook. Just: Yael, Friendly: "A researcher came through once. Froberger, he said. Knew every patrol route by the second day. Left without saying why." Brynn, Dear Friend: "He stayed here. Room 6. He was very quiet. He read all night. I brought him water twice. He said thank you both times." These mentions connect the journal to the living world. Froberger was real. These people met him.

**S54 — Letters Between NPCs** ✅  
Brynn and Yael know each other. Quill knows Pachelbel (they have a complicated history around the Rough Whiskey). Weckmann and Auros share the CY node. If the player is Dear Friend with both NPCs in a pair, a joint moment becomes possible: arriving at TV with both Quill and Brynn at Dear Friend, Quill is playing a song he says Brynn requested. "She came by yesterday. Said to play something slow." The web of relationships that exists without the player is now visible.

**S55 — The Map Before the City** ✅  
The maps.md grid shows the world. An optional "world history" interaction at SQ (Sweelinck, Impartial, revisit after Act III): "That map on the wall. It's not current. The city has moved twice since the cartographer drew it. The river used to be east of the Conclave district. The Void has always been at the center." This costs one Sweelinck line and one readable map prop. It makes the game world feel geologically old.

**S56 — Yael's Patrol Schedule as Puzzle** ✅  
Yael mentions her patrol timing. If the player visits specific nodes at specific game-day times (morning vs. evening), they encounter Yael in the field rather than at her CI post — one line, no quest, just: "You again. I'm on route. Walk with me if you want." The player who learns her schedule can catch her at four different nodes. Each location has a slightly different line. Yael is the largest NPC presence in the city. Most players will meet her once.

**S57 — Pachelbel's No-Questions Item List** ✅  
Pachelbel's Dear Friend state grants access to a "no questions" back-stock list — items with no provenance information, acquired through channels he doesn't disclose. The items are mechanically useful. They also have one-line descriptions that imply a history: "Still warm from somewhere." / "The owner is not looking for it." / "You probably don't want to know." This is the game letting you be complicit in something small. Pachelbel's code says he asked once and believed the answer. He offers you the same.

**S58 — Brynn's Regulars** ✅  
The IN node currently shows Brynn. Extension: a "Regulars" section below the NPC card — ambient descriptions of the two or three guests who are always at the inn. They don't interact. They have names and one-line descriptions. By Act V, if `brynLedgerBalance` ever reached 0, one regular has a new description: "The merchant in room 4 has been here for three weeks now. He says the roads south are clear again." Brynn's inn is full because the city is working. Small things add up.

**S59 — Weckmann's Training Log** ✅  
A readable object at the CY pit: Weckmann's training log. Written in the same handwriting as his voice — short, direct, specific. Entries dated by game day. The player's own training sessions appear in it: "Player — showed up; good instincts, overcorrects left. Day 3: better. Day 7: starting to read." Bruna appears as a historical entry, much earlier in the log. No comment. Just: "Bruna — 23rd day — pushed too far. Note for next time." The note for next time is what he's been applying ever since.

**S60 — The Empty Room** ✅  
At IN, after reaching Dear Friend with Brynn: a fifth interaction appears below the maintenance options. "🚪 Room 6." If clicked: a text panel. The room is clean. A mark on the wall where someone scratched a small sigil. The bed has an extra pillow — Brynn added it after the fact, she doesn't know why. On the windowsill: a small scrap of paper that isn't Froberger's Last Note but is clearly in the same hand, left by accident, reading only: *"— still here."* Not findable. Not lootable. Just there.

---

*Every suggestion from S51 to S60 follows the same principle: the world is larger than the player. Somewhere, someone is doing something that has nothing to do with the Void. That's the point. The Void is sealed because of what the world is worth — and the world is worth more than what you can see from any single node.*

---

*These suggestions are written as specifics, not directions. Each one is implementable. None of them are required. The game is complete at Layer 42 if the Groundhog Day mechanic and NPC dialogue system are shipped. Everything above is the next continue.*

---

## VI. Name Migration — Baroque Organ Composer Renaming

> Recorded at the close of Layer 45. All phases marked ✅ complete. The script and tables below are the canonical record of the naming decision; the live names are in `roll2hit-v3.html`.

*All characters and places use real public-domain Baroque organ composer names — Latin characters only, no hyphens. Theme: Bach-era pirate/sea-music, early organ school. Names feel old, authoritative, and slightly weathered.*

---

### Source List — Cleaned (Latin only, no hyphens)

```
Jan Pieterszoon Sweelinck
Jean Titelouze
Girolamo Frescobaldi
Samuel Scheidt
Heinrich Scheidemann
Andreas Duben
Pablo Bruna
Johann Jakob Froberger
Matthias Weckmann
Jean Henri Anglebert
Nicolas Antoine Lebegue
Guillaume Gabriel Nivers
Dieterich Buxtehude
Andre Raison
Juan Cabanilles
Georg Muffat
Johann Pachelbel
Johann Caspar Ferdinand Fischer
Georg Bohm
Nicolaus Bruhns
Johann Heinrich Buttstett
Francois Couperin
Nicolas de Grigny
Jeremiah Clarke
Louis Nicolas Clerambault
Johann Gottfried Walther
Johann Sebastian Bach
George Frederic Handel
Louis Claude Aquin
Louis Archimbaud
Jacques Boyvin
Guillaume Antoine Calviere
Gaspard Corrette
Francois Agincourt
Jean Francois Dandrieu
Pierre Dandrieu
Nicolas Gigault
Gilles Jullien
```

*Note: Louis-Claude d'Aquin appears twice in source (as "d'Aquin" and "Daquin") — same composer, listed once above as Aquin. Jean Titelouze appears twice in source — listed once. Bach and Handel included as anchors for the era even though they post-date the earlier names.*

---

### Proposed Renaming Table — Characters

| Current Name | Type | Proposed Name | Source Composer | Reason | Review |
|---|---|---|---|---|---|
| **Froberger** | Protagonist / journal author | **Froberger** | Johann Jakob Froberger | The wandering organist. Traveled Vienna→Rome→Paris→London, died in French exile in 1667. Melancholic suites. Brilliant, alone at the end. Froberger and Weckmann had a famous improvisation contest — so Froberger vs. Weckmann (= Froberger vs. Weckmann) has a historical echo. | ✅ |
| **Sweelinck** | The Watcher at SQ | **Sweelinck** | Jan Pieterszoon Sweelinck | "The Organist-Maker." Trained every major German organist of the next generation, never left his Weimar post in 44 years. Ancient, fixed, the one everyone came to. | ✅ |
| **Yael Scheidemann** | Guard Captain at CI | **Yael Scheidemann** | Heinrich Scheidemann | Hamburg organist, 40 years at St. Catherine's, trained by Sweelinck. City-loyal, methodical, institutional but principled. Scheidemann was also trained by Sweelinck — so Yael Scheidemann under Sweelinck/Sweelinck has a coherent in-world lineage. | ✅ |
| **Brynn Clerambault** | Innkeeper at IN | **Brynn Clerambault** | Louis Nicolas Clerambault | French court organist who ran the Maison Royale de Saint-Louis for decades. Domestic warmth, long quiet dedication, the work no one names. | ✅ |
| **Tomas Couperin** | Bard at TV | **Tomas Couperin** | Francois Couperin | "Couperin le Grand" — court musician under Louis XIV, trapped in systems of patronage and debt, elegant and constrained. The Guild is his court. | ✅ |
| **Pachelbel** | Fence at BA | **Pachelbel** | Johann Pachelbel | The methodical one. The Canon. Clear rules, consistently applied. Left Erfurt, Gotha, Reims, Nuremberg — always by principle. His code IS the Canon. | ✅ |
| **Weckmann** | Pit Master at CY | **Weckmann** | Matthias Weckmann | Known for organ improvisation *jousts* — including a famous contest against Froberger himself. Trained under Schütz, powerful, ran Hamburg Collegium Musicum. The duelist. Historically connected to Froberger (= Froberger). | ✅ |
| **Seraphine Bruhns** | Undercity researcher at CY | **Seraphine Bruhns** | Nicolaus Bruhns | Buxtehude's star pupil. Died at 31. Left only a handful of works that show what he might have become. The precocious researcher who ran out of time. | ✅ |
| **Nivers** | The eleven-year corner guard | **Nivers** | Guillaume Gabriel Nivers | Royal organist at Saint-Cyr for 40+ years. Just there. Always there. "Evening." | ✅ |
| **Bruna** | Weckmann's lost student | **Bruna** | Pablo Bruna | "El Ciego de Huesca" — the blind organist of Huesca, Spain. Died without full recognition. Works of profound depth, mostly unknown. | ✅ |
| **Raison** | Pachelbel's regret | **Raison** | Andre Raison | The conscientious one. His Livre d'orgue has clear moral architecture. "Raison" means *reason* in French — a fence's regret that is completely reasonable and completely insufficient. | ✅ |
| **Gigault** | Off-screen bread stall owner | **Gigault** | Nicolas Gigault | 200+ organ pieces. Most people cannot name one. Always there. Never the focus. Part of the landscape. | ✅ |
| **Muffat** | Traveler in Froberger's journal (DS) | **Muffat** | Georg Muffat | Traveled extensively — Paris, Rome, Salzburg, Passau. The reporter, the observer. Froberger's journal entry: "Muffat said thirty-eight months." | ✅ |
| **Boyvin** | Bardic Guild debt collector | **Boyvin** | Jacques Boyvin | Rouen organist, associated with institutional guild structures. The bureaucrat. Punctual, polite, implacable. | ✅ |
| **Cabanilles** | Weckmann's early student (training log) | **Cabanilles** | Juan Cabanilles | Never left his Valencian post. Steady, prolific, underknown. Cabanilles who went east. | ✅ |
| **Fischer** | Illegal pit operator | **Fischer** | Johann Caspar Ferdinand Fischer | Systematic, self-serving, technically correct. His suites predate Bach's WTC. The operator. | ✅ |

---

### Proposed Renaming Table — Places

| Current Name | Type | Proposed Name | Source Composer | Reason | Review |
|---|---|---|---|---|---|
| **Birka** | Starting city | ~~Buxtehude~~ **Birka** (kept) | Dieterich Buxtehude | The master of Lübeck — everyone came to him (including Bach, who walked 400km). The starting city as origin-point of the whole tradition. Also: Buxtehude is a real port town near Hamburg — maritime, Baltic, weathered. | ✅ |
| **Tilbury** | Act II port destination | ~~Frescobaldi~~ **Tilbury** (kept) | Girolamo Frescobaldi | Roman organist with cosmopolitan, commercial-city energy. Tilbury as a city of transactions, complexity, trade. Frescobaldi drew 30,000 people to hear him play in 1615 — a city that knows how to put on a show. | ✅ |

---

### What to Keep (Do Not Rename)

| Name | Reason |
|------|--------|
| Yael, Brynn, Tomas, Seraphine | First names stay — only last names change |
| Commander Auros | This is a MONSTER in MONSTER_POOL (final boss), not Seraphine Bruhns the NPC. Needs separate handling if we rename "Auros" — recommend renaming monster to "Commander Bruhns" to match. Flag for manual check. |
| The Void / Void Below | Thematic term, not a proper noun |
| Rough Whiskey | Item name |
| Conclave Pass / Scholar King / Bardic Guild | Institutional terms — review separately if desired |
| Node codes (CI, IN, TV, BA, CY, SQ, ER, etc.) | 2-3 letter codes, unchanged |
| `S_story` field names (e.g. `couperiSongReceived`) | Code variable names — do NOT rename in this pass |

---

### Migration Plan

**Phase 0 — Backup ✅**
```bash
cd /Users/user/code/roll2hit.com
cp plan.md plan.md.bak
cp maps.md maps.md.bak
# Copy all lab reports:
for f in lab-report-*.md; do cp "$f" "${f%.md}.bak.md"; done
# If roll2hit-v3.html exists:
# cp roll2hit-v3.html roll2hit-v3.html.bak
```

**Phase 1 — Rename in .md files ✅**  
Scope: `*.md` files in `/Users/user/code/roll2hit.com/`  
Not yet: `roll2hit-v3.html` (review .md output first)

**Phase 2 — Review diff ✅**  
```bash
diff plan.md.bak plan.md | head -80
diff maps.md.bak maps.md | head -40
```
Confirm names look right in context before touching the HTML.

**Phase 3 — Rename in roll2hit-v3.html ✅**  
Same script, scoped to .html. Separate pass because HTML has JS variable names like `couperiSongReceived` that should NOT be renamed — only display strings and story text.

**Phase 4 — Manual checks ✅**
- Search for "Commander Auros" and rename to "Commander Bruhns" manually
- Search for any partial matches (e.g. "Froberger" inside "Frobergertastic" — unlikely but check)
- Search for lowercase `finn` in JS code references — decide if code variable names follow

---

### The Script

```bash
#!/usr/bin/env bash
# rename-codex.sh — Baroque organ composer name migration
# Usage: bash rename-codex.sh       (execute replacements)
#        bash rename-codex.sh dry   (preview only, no writes)
# Run from: /Users/user/code/roll2hit.com

DRY="${1:-}"
SCOPE="*.md"   # Change to "*.html" for Phase 3

replace() {
  local old="$1" new="$2"
  for f in $SCOPE; do
    [ -f "$f" ] || continue
    if grep -qF "$old" "$f" 2>/dev/null; then
      echo "  [$f]  \"$old\"  →  \"$new\""
      if [ "$DRY" != "dry" ]; then
        sed -i '' "s/$(echo "$old" | sed 's/[\/&]/\\&/g')/$(echo "$new" | sed 's/[\/&]/\\&/g')/g" "$f"
      fi
    fi
  done
}

echo "=== CODEX NAME MIGRATION — Phase: $SCOPE ${DRY:+(DRY RUN)} ==="
echo ""

# ── Full compound names FIRST (must precede single-word passes) ──────────────
replace "Yael Scheidemann"   "Yael Scheidemann"
replace "Brynn Clerambault"       "Brynn Clerambault"
replace "Tomas Couperin"      "Tomas Couperin"
replace "Seraphine Bruhns"  "Seraphine Bruhns"

# ── Single-name characters ───────────────────────────────────────────────────
replace "Froberger"     "Froberger"
replace "Sweelinck"    "Sweelinck"
replace "Pachelbel"   "Pachelbel"
replace "Weckmann"     "Weckmann"
replace "Nivers"    "Nivers"
replace "Bruna"      "Bruna"
replace "Raison"     "Raison"
replace "Gigault"    "Gigault"
replace "Muffat"     "Muffat"
replace "Boyvin"    "Boyvin"
replace "Cabanilles"   "Cabanilles"
replace "Fischer"     "Fischer"

# ── Places ───────────────────────────────────────────────────────────────────
replace "Birka"  "Buxtehude"
replace "Tilbury" "Frescobaldi"

echo ""
echo "=== Done. Run: diff plan.md.bak plan.md | head -100 ==="
```

---

### Remaining Unassigned Composers (Reserve Pool)

```
Jean Titelouze          — early French; austere, monumental style
Andreas Duben           — Swedish court; northern cold
Jean Henri Anglebert    — French court; ornate, aristocratic
Nicolas Antoine Lebegue — Paris; systematic, institutional
Andre Raison            — (assigned to Raison above)
Georg Bohm              — Hamburg; lyrical, slightly melancholic
Johann Heinrich Buttstett — Weimar; Bach's contemporary and rival
Nicolas de Grigny       — Reims; one masterwork, died young
Jeremiah Clarke         — London; "Trumpet Voluntary" — port, naval, maritime
Johann Gottfried Walther — Weimar; encyclopedist, cataloguer
Louis Claude Aquin      — Paris; showman; competitive
Louis Archimbaud        — French; minor but named
Guillaume Antoine Calviere — Paris court; late baroque
Gaspard Corrette        — Paris; steady, institutional
Francois Agincourt      — French; named after a battle
Jean Francois Dandrieu  — French; fashionable, popular
Pierre Dandrieu         — Jean Francois's uncle; the older, steadier one
Gilles Jullien          — Chartres; cathedral organist; architectural scale
```

*Good candidates for: second-tier EB NPCs, faction names (Agincourt as a military faction), city districts (Clarke district for the harbor), guild names (Dandrieu Guild vs. the Couperin Guild).*

---

## VII. City Naming — Composer Origin City Mapping

> Second naming pass. Instead of using composer names as city names (Birka → Buxtehude), this table maps each game location to the real historical city where its assigned composer worked. Game cities are thereby grounded in actual Baltic/North Sea/Mediterranean geography, coherent with the Bach-era pirate world aesthetic.

*The principle: if the composer's city matches the character's background by coincidence — use it. If it does not fit, use the nearest alternate that does.*

---

### Composer to Historical City Reference

| Composer (Game Role) | Primary Work City | Secondary / Birth City |
|---|---|---|
| Sweelinck (Sweelinck / SQ) | Weimar | — |
| Scheidemann (Yael / CI) | Hamburg — St. Catherine's | Wittstock (birth) |
| Froberger (Froberger) | Vienna then Reims then Paris then Herincourt | Rome (study) |
| Clerambault (Brynn / IN) | Paris — Saint-Sulpice | Saint-Cyr-l'Ecole |
| Couperin (Tomas / TV) | Paris — Versailles, Saint-Gervais | — |
| Pachelbel (Pachelbel / BA) | Nuremberg — St. Sebald | Erfurt, Gotha |
| Weckmann (Weckmann / CY) | Hamburg — St. Jacob's | Dresden (trained) |
| Bruhns (Seraphine / CY) | Husum (Schleswig-Holstein) | — |
| Nivers (Nivers) | Paris — Saint-Cyr | Versailles |
| Bruna (Bruna) | Huesca (Aragon, Spain) | — |
| Raison (Raison) | Paris — Sainte-Genevieve | — |
| Gigault (Gigault) | Paris — Saint-Nicolas-des-Champs | — |
| Muffat (Muffat) | Passau (Bavaria) | Salzburg |
| Boyvin (Boyvin) | Rouen (Normandy) | — |
| Cabanilles (Cabanilles) | Valencia (Spain) | — |
| Fischer (Fischer) | Baden-Baden | Schlackenwerth (Bohemia) |
| Buxtehude (city anchor) | Birka — St. Mary's | Elsinore / Helsingborg |
| Frescobaldi (port city anchor) | Rome — St. Peter's | Tilbury (birth), Florence |
| Clarke (reserve pool) | London — Chapel Royal | — |
| Titelouze (reserve pool) | Rouen — Notre-Dame | — |
| Bohm (reserve pool) | Luneburg | Hamburg |
| Duben (reserve pool) | Stockholm — Royal Court | — |

*Hamburg conflict: Both Scheidemann and Weckmann worked in Hamburg — different churches (St. Catherine's vs. St. Jacob's). In the game, CI and CY are both in the same main city. They share the city, with different district names. No rename conflict.*

*Paris conflict: Clerambault, Couperin, Nivers, Raison, Gigault all worked in Paris. All five characters are in the main city too. Paris becomes the model for the city's cosmopolitan interior — a city that pulled musicians from across Europe. Districts named after their Parisian churches.*

---

### Game Location to Origin City Mapping

#### The Main City (Birka)

The port exterior maps to **Birka** — Baltic trading hub, St. Mary's, cold North Sea air, everyone came through. The interior districts map to Paris churches, because cosmopolitan cities always draw the French court's talent.

| Game Location | Node | Composer | Origin City | Proposed Name | Conflict |
|---|---|---|---|---|---|
| City Gate / Guard Post | CI | Scheidemann | Hamburg — St. Catherine's | **Katharinen** gate quarter | None |
| The Inn | IN | Clerambault | Saint-Cyr-l'Ecole | **Saint-Cyr** quarter — small post, domestic, away from the main court | None |
| The Tavern / Bard district | TV | Couperin | Paris — Saint-Gervais | **Saint-Gervais** lane (Couperin family church for 173 years, in the Marais) | Shares Paris with IN — Saint-Gervais differentiates |
| The Bazaar / Black Alley | BA | Pachelbel | Nuremberg — St. Sebald | **Sebaldus** market | None |
| The Combat Yard | CY | Weckmann + Bruhns | Hamburg (St. Jacob's) + Husum | **Sankt Jacob** yard — waterfront; undercity beneath = **Husum** (cold, coastal, Bruhns's depth) | Same Hamburg as Scheidemann; different church resolves it |
| The Slum / Ghetto | SL | unassigned | Huesca (Bruna) — coincidence match | **Huesca** quarter — Bruna's Spanish backwater with a hidden cathedral; poverty with depth | None |
| The Covenant node | SQ | Sweelinck | Weimar | **Oude Kerk** — Weimar's oldest church, where Sweelinck played for 44 years | None |

#### Cities Outside the Main City

| Game Location | Node | Composer | Origin City | Proposed City Name | Conflict |
|---|---|---|---|---|---|
| Tilbury (Act II port) | SW destination | Frescobaldi | Tilbury (birth) / Rome | **Tilbury** — Adriatic-adjacent port, Este court, mercantile; more port-like than Rome | None |
| Reims keep | DK | unassigned | Froberger early career | **Reims** keep — Froberger was briefly at the Reims court; fortress-city, military | None |
| Desert / Ruins node | DE | unassigned | Muffat → Passau | **Passau** — Bavarian fortress at river confluence; arid fortress-gateway feeling | None |
| Deep Sea node | DS | unassigned | Muffat → Salzburg (alt.) | **Salzburg** deep — mountain-below depth; Muffat passed through Salzburg | Muffat covers DE and DS — split Passau/Salzburg |
| Scarlet Coast | SC | unassigned | Boyvin → Rouen | **Rouen** coast — Norman red-cliff coastline; Boyvin's home; seafaring history | None |
| Mine / Ironshell | IS | unassigned | Fischer → Schlackenwerth | **Schlackenwerth** — Bohemian mining town, Fischer's court post; industrial, remote | None |
| Forest nodes | FO / EF area | unassigned | Bohm → Luneburg | **Luneburg** — small North German forest town near Hamburg; Bohm's base; fits forest geography | Bohm not yet assigned as character; reserve pool |
| Arctic / Mountain EBs | ER, EK, EA | unassigned | Duben → Stockholm | **Stockholm** range — Andreas Duben, Swedish Royal Court; Nordic, cold, northern | None |
| Ocean / Sea EBs | ES, EO, EW | unassigned | Clarke → London | **London** sea — Clarke at the Chapel Royal; Trumpet Voluntary has naval/maritime energy | None |

---

### Conflict Resolution Summary

| Conflict | Composers | Resolution |
|---|---|---|
| Hamburg x 2 | Scheidemann (CI) + Weckmann (CY) | Different churches: St. Catherine's → Katharinen district; St. Jacob's → Sankt Jacob district. Same city, different quarters. No conflict. |
| Paris x 5 | Clerambault, Couperin, Nivers, Raison, Gigault | All in same city (main city). Use church names as district differentiators: Saint-Cyr (IN), Saint-Gervais (TV), ambient use of Sainte-Genevieve and Saint-Nicolas in lore. |
| Muffat x 2 | Passau and Salzburg both Muffat | Split: DE = Passau (river fortress), DS = Salzburg (mountain depth). One composer, two locations, geographically adjacent in-world. |
| Rouen x 2 | Boyvin (SC) + Titelouze (reserve) | Boyvin assigned to SC = Rouen coast. Titelouze stays reserve. If Titelouze is later assigned, use Rouen Cathedral quarter vs. port quarter to differentiate. |
| Forest nodes | Cabanilles = Valencia (no fit) | Use Bohm (reserve pool) → Luneburg instead. Better geographic and thematic match. |

---

### Two-Pass Naming — Recommended Division

**Pass A — Character names:** Use composer SURNAMES  
`Froberger → Froberger` / `Pachelbel → Pachelbel` / `Weckmann → Weckmann`

**Pass B — Place names:** Use composer WORK CITIES  
`Birka → Birka` / `Tilbury → Tilbury` / the Bazaar = `Sebaldus market` / the Covenant node = `Oude Kerk`

These two passes create a world where the character Froberger passed through Birka, met Scheidemann at the Katharinen gate, drank at the Saint-Gervais tavern, and now the Void beneath the Sebaldus market needs sealing. It is historically accurate by coincidence. That is the goal.

---

### Updated Script — Phase 2 (Place Names)

```bash
# ── Places (Pass B — composer origin cities) ──────────────────────────────────
replace "Birka"         "Birka"
replace "Tilbury"        "Tilbury"
replace "Huesca quarter"     "Huesca quarter"
replace "Reims keep"       "Reims keep"
# District names — add to story.md and node descriptions manually:
# CI node vicinity: Katharinen gate
# IN node vicinity: Saint-Cyr quarter
# TV node vicinity: Saint-Gervais lane
# BA node vicinity: Sebaldus market
# CY node vicinity: Sankt Jacob yard
# SQ node vicinity: Oude Kerk
```

*Note: District names (Katharinen, Saint-Gervais, etc.) are not standalone text strings — they are woven into node descriptions and NPC dialogue. Apply those manually in story.md and node description fields, not by bulk script.*

---

### Quick Reference — Final Proposed Place Names

```
Birka (main city)    →  Birka
  CI district          →  Katharinen gate quarter
  IN district          →  Saint-Cyr quarter
  TV district          →  Saint-Gervais lane
  BA district          →  Sebaldus market
  CY district          →  Sankt Jacob yard
  SL district          →  Huesca quarter
  SQ / Covenant        →  Oude Kerk
Tilbury (port city)   →  Tilbury
Reims keep              →  Reims keep
Desert / Ruins node    →  Passau
Deep Sea node          →  Salzburg
Scarlet Coast          →  Rouen coast
Mine / Ironshell       →  Schlackenwerth
Forest nodes           →  Luneburg
Arctic EB nodes        →  Stockholm range
Ocean EB nodes         →  London sea
```

---

*plan.md last updated 2026-05-22 — Layers 0–45 complete. All S-suggestions addressed: S1–S60 ✅ (S24–S26 are tooling, marked out of scope).*  
*Codebase: roll2hit-v3.html — 14,339 lines · NODE_MAP: 51 nodes (71 with Layer 39 EBs) · MONSTER_POOL: 341+ monsters*



---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
