## §0 — Implementation Readiness Dashboard

> **Status as of Layer 75 (2026-05-25).** Update each row when a layer is coded and committed. This section lives at the top of the file so it's the first thing open during an implementation session.

### Tier 1 — Ready to Implement Now (no lab report needed)

Implement in layer order. Each = code change + doc sync + `git commit`.

| Layer | Section | Feature | Est. Complexity |
|-------|---------|---------|----------------|
| 70 | §XXXV | First Inn Light: Brynn's Vigil Arc | ✅ Implemented — lab report pending |
| 72 | §XXXVII | The Final Confrontation: Commander Bruhns's CO Scene | ✅ Implemented — lab report pending |
| 74 | §XXXIX | Yael's Record: The Named Report Scene | ✅ Implemented — lab report pending |
| 75 | §XL | Kenickie's Black Market + Sheet-Swapper UI | ✅ Implemented 2026-05-25 |
| 76 | §XLI | Tattoo Progression System (character creation, ASI/HP tattoos, death tattoos) | ✅ Implemented 2026-05-25 |
| 77 | §XLII | Chronicle System (career/run stats, hour clock, game-over summary) | ✅ Implemented 2026-05-25 |

### Tier 2 — Needs Lab Report Before Coding

| Layer | Section | Feature | Status |
|-------|---------|---------|--------|
| 44 | §IX | Ally Cat Arc | ✅ Implemented |
| 49 | §XIV | Quest -1 + World Creator | ✅ Implemented |
| 50 | §XV | NG+ Remembrance Layer | ✅ Implemented 2026-05-25 |
| 51 | §XVI | Weimar Scholar Gate | ✅ Implemented 2026-05-25 |
| 52 | §XVII | Void Archaeology | ✅ Implemented 2026-05-25 |
| 54+55 | §XIX+§XX | Tilbury + Visby Arcs | ✅ Implemented 2026-05-25 |
| 56 | §XXI | Void Shaman | ✅ Implemented 2026-05-25 |
| 61 | §XXVI | Corelli Wandering Merchant | ✅ Implemented 2026-05-25 |

### Implementation Protocol (reminder)

1. Pick the lowest unimplemented layer from Tier 1.
2. Open `roll2hit-v3.html`. Find the relevant function(s) in the section spec.
3. Make the code change. Run the game. Test the golden path.
4. Sync docs: update any "⚠️ PLANNED" markers to "✅" in `story.md`, `world.md`, `plan.md`.
5. `git add` all changed files + `git commit` with one-line summary.
6. Mark this table row ✅.

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

**When a lab report is written:**
1. Write the `lab-report-<title>.md` file
2. Add it to `index.md` under the appropriate category (Implemented or Design Specs)
3. Add it to `plan.md §VI-A` file manifest (update the file count in the header)
4. `git add` the lab report and all related doc changes together
5. `git commit` them in a single commit — a lab report that isn't committed is a planning note, not a record

The commit message should name the lab report and summarize what it covers in one sentence.

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
| `WORLD_DB` | 66 terrain entries (46 base + 20 epic); each has `monsters: []` with full stat blocks |
| `MONSTER_POOL` | 370 monsters across 8 source pools; keyed by monster key string |
| `MONSTER_DROPS` | Trophy drop per monster key; `{name, icon, sell}` |
| `CORRIDOR_CELLS` | Computed corridor grid; key `"r,c"` → `{dirs, glyph, terrain, edges}` |
| `HUNTING_GROUNDS` | 42 terrain → `{displayName}` for stalk overlay; Layer 39 adds 20 epic terrain entries |
| `EPIC_BOSS_POOL` | 20 deadly-tier bosses keyed by slug; AC/HP/ATK/dmg/epicDesc |
| `EB_NPC_DIALOGUE` | 20 quest-giver NPC profiles; payment negotiation, return beat, specialItem |
| `EB_STORY_ITEMS` | 11 special non-gold EB rewards: Forge Rune, Runic Hammer, Star Fragment, Swamp Blessing, River Pass, Ship Warrant, Escort Contract, Sand Cipher, Pirate Cache, Crimson Warrant, Kazrath Journal |
| `FROBERGER_JOURNAL` | 41 entries `{entryNum, nodeCode, readAloud, text}`; 10 read-aloud + 31 collectible |
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
| `S_story.log` | array | Story message log (auto-appended by `storyMsg()`; displayed in scrolling panel) |
| `S_story.visited` | object | nodeCode → true; populated on first arrival at each node |
| `S_story.journalRead` | object | nodeCode → true; tracks which node journals have been read |
| `S_story.countedMissedInns` | object | nodeCode → true; tracks inn-skip nodes to prevent double-penalizing one location |
| `S_story.missedSleeps` | number | Consecutive sleep-skips; 2 triggers an exhaustion void pressure penalty |
| `S_story.battleDis` | number | Rounds of Disadvantage on player attacks remaining this battle |
| `S_story.dropsCollected` | number | Lifetime monster drop collection count; gates early tutorial quest (≥3 to complete) |
| `S_story.lastCorridorCells` | array | Cell sequence from last corridor walk; used by `_setActivePath()` to highlight route |
| `S_story.lastExitDir` | string\|null | Direction string from last move (`'N'`/`'S'`/`'E'`/`'W'`); used in minimap flash |
| `S_story.lastExitCode` | string\|null | Node code departed from in last move |
| `S_story.battlePRoll` | number | Raw player roll value displayed in current battle round |
| `S_story.battleERoll` | number | Raw enemy roll value displayed in current battle round |
| `S_story.corpsesQuests` | array | Active corpse-loot quests `{id, nodeCode, item, reward}` — from Corpses mechanic |
| `S_story.storyDeathSaves` | object | `{successes:0, failures:0, active:false}` — current death save state; resets on stabilization |
| `S_story.lastAutoSellNode` | string\|null | Node where the last auto-sell triggered; prevents double-sell on revisit |
| `S_story.waypoint` | string\|null | Active waypoint target node code (alias used by older waypoint calls) |
| `S_story.customQuestTerrain` | string\|null | Terrain string for active Assassin's Guild hunt quest target |
| `S_story.ebReturnDone` | object | ebCode → true; set when the player physically arrives at the EB return node (gates `completeFn` check) |
| `S_story.roughWhiskeyActive` | boolean | Rough Whiskey buff currently active; grants bonus in pit fight; cleared after first attack |
| `S_story.slStalksWon` | number | Stalk-mode victories won; gates Stalker quest completion (≥3) |
| `S_story.npcVisitCounts` | object | npcKey → visit count; used by `_getNPCDialogue()` to cycle quotes |
| `S_story.couperiSongReceived` | boolean | Quill has played Couperin's song; triggers Dear Friend upgrade check for Quill |
| `S_story.bruhnsDepthsReported` | boolean | Depth report delivered to Auros; triggers Dear Friend upgrade check for Auros |
| `S_story.pitPerks` | array | Active pit training perks (slot names); earned in CY pit fights, consumed if player dies |
| `S_story.frobergerNoteNode` | string\|null | Node code where the last Froberger note was found (for trace mechanic) |
| `S_story.froberger_last_note_found` | boolean | Froberger's final note found (triggers Froberger trace line delivery) |
| `S_story.froberger_last_note_read` | boolean | Final note opened and read by player |
| `S_story.huntMode` | boolean | true while player is in active stalk/hunt mode; suppresses normal node encounters |
| `S_story.couperiDebtDegraded` | boolean | Quill's debt acknowledged as "just a number"; injects L44-E dialogue into Quill's impartial pool |
| `S_story.worldEventsFired` | array | One-time world event IDs that have fired; prevents re-trigger across sessions |
| `S_story.brynThirdStepFixed` | boolean | Bryn's third porch step repaired (S33) |
| `S_story.brynFirewoodBrought` | boolean | Firewood delivered to Bryn (S34) |
| `S_story.brynPantryRestocked` | boolean | Pantry restocked for Bryn (S35) |
| `S_story.brynLedgerBalance` | number | Bryn's ledger debt (starts −8); modified during ledger quest resolution |
| `S_story.voidSignClicked` | boolean | Player has clicked the Void Sign once; prevents double-fire of that world event |
| `S_story.brynnsJournalRead` | boolean | Bryn's hidden cabin journal read (S45) |
| `S_story.pachelbelPaidBack` | boolean | Pachelbel's debt paid; triggers Dear Friend check |
| `S_story.quillQuestComplete` | boolean | Quill's main quest resolved; gates Quill debt degradation world event |
| `S_story.actThreeWeightApplied` | boolean | Act III emotional weight injected for all Friendly+ NPCs; prevents re-injection |
| `S_story.s49SweelinckDelivered` | boolean | Sweelinck moment delivered (S49 parallel beat to Brynn) |
| `S_story.s54JointMomentDelivered` | boolean | Joint NPC moment delivered (S54) |
| `S_story.s55MapLineDelivered` | boolean | Map reveal line delivered (S55) |
| `S_story.s51NorthRoadBought` | boolean | North Road tome purchased from Leeuwenhoek (S51 shop) |
| `S_story.s51ManifoldBought` | boolean | Manifold tome purchased from Leeuwenhoek (S51) |
| `S_story.s51LastStockBought` | boolean | Final shop item purchased from Leeuwenhoek (S51 — clears stock) |
| `S_story.s6JointDelivered` | boolean | S6 joint NPC moment delivered |
| `S_story.s2DaughterDelivered` | boolean | S2 daughter-mention line delivered |
| `S_story.archiveLetterObtained` | boolean | Letter from Blue Shutters Archive obtained (S7) |
| `S_story.archiveUndercitySurveyTaken` | boolean | Undercity survey quest accepted at archive (S7) |
| `S_story.undercitySurveyDelivered` | boolean | Survey report delivered (completes archive quest chain) |
| `S_story.s8VargaClueUnlocked` | boolean | Varga surveillance clue revealed after 3 observations (S8) |
| `S_story.s8PachelbelTold` | boolean | Pachelbel informed of Varga observations (S8 — final beat) |

> **Verification note (SG11)**: All 107 fields from `_S_DEFAULTS()` (HTML line 7842) are now documented above. Fields `S._pendingDrop`, `S.char.baseAc`, and `S_story.actNumber` appear in older Section III rows but are NOT in `_S_DEFAULTS()` — they are computed or transient battle-session values, not saved state.

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

## V. Suggestions for Further Development

> Implementable feature ideas in rough priority order. Mark each ✅ when done. Add new ideas at the bottom.

*Each one is a "continue" in waiting.*

---

### V-A. Implementation Queue — PLANNED Features

> Full specs live in their own sections. This table is the priority dashboard.

| Priority | Section | Feature | Layer | Lab Report Needed? | Status |
|----------|---------|---------|-------|--------------------|--------|
| 1 | §XIV | Quest -1: The Open Door + World Creator Wizard | 49 | `lab-report-world-creator.md` (after build) | ✅ Implemented |
| 4 | §XV | NG+ Remembrance Layer: Entry 42 / "The Next Froberger" | 50 | Yes — postmortem on NG+ narrative design | ✅ Implemented 2026-05-25 |
| 5 | §IX | Ally Cat Arc: "Nine Lives, Capisce?" | 44 | Yes — `lab-report-ally-cat.md` | ✅ Implemented |
| 7 | §XVI | Weimar Scholar Gate: Tomes and the Fourth Hub | 51 | Yes — new item category + NPC arc | ✅ Implemented 2026-05-25 |
| 8 | §XVII | Void Archaeology: The Origin Investigation | 52 | Yes — narrative recontextualization + four-author chain | ✅ Implemented 2026-05-25 |
| 10 | §XIX | Tilbury Harbor Arc: "The Conclave's Weight" | 54 | Yes — shared with §XX in `lab-report-tilbury-visby-arcs.md` | ✅ Implemented 2026-05-25 |
| 11 | §XX | Visby Underground: "What Mordus Owes" | 55 | Yes — shared with §XIX in `lab-report-tilbury-visby-arcs.md` | ✅ Implemented 2026-05-25 |
| 12 | §XXI | The Void Shaman: The Antecedent's Last Warden | 56 | Yes — `lab-report-void-shaman.md` (corrupted mandate design) | ✅ Implemented 2026-05-25 |
| 17 | §XXVI | Corelli the Wandering Merchant: Cross-Act Vendor NPC | 61 | `lab-report-corelli-merchant.md` — pending | ✅ Implemented 2026-05-25 |
| 26 | §XXXV | The First Inn Light: Brynn's Vigil Arc | 70 | Lab report pending | ✅ Implemented |
| 28 | §XXXVII | The Final Confrontation: Commander Bruhns's CO Scene | 72 | Lab report pending | ✅ Implemented |
| 30 | §XXXIX | Yael's Record: The Named Report Scene | 74 | Lab report pending | ✅ Implemented |

**Rule:** Implement in layer order when possible. Each implementation = code + doc sync + git commit. See plan.md §I Lab Report Policy for commit rules.

---

### V-B. Documentation Queue — FC Items

| # | Item | File(s) | Status |
|---|------|---------|--------|
| FC01 | Doc Health badge in `index.md` — live count of sync-pass completion | `index.md` | ⏳ |
| FC02 | `froberger-journal-all-entries.txt` entry-by-entry compare against HTML | `froberger-journal-all-entries.txt` | ⏳ |
| FC03 | Split `mechanics.md` into `mechanics-combat.md` + `mechanics-economy.md` | `mechanics.md` | ⏳ |
| FC04 | Spot-check date policy: re-verify function names in `lab-report-architecture-full.md` every 10 layers | `lab-report-architecture-full.md` | ⏳ |
| FC05 | Two-way link convention: every HTML const gets `// → doc: filename.md §Section`; every doc section gets `> HTML source: CONST ~line N` | all core docs | ⏳ |

---

### V-C. New Feature Ideas (not yet assigned to a section)

> Add raw ideas here. When an idea is ready to plan, move it to its own §XVI, §XVII, etc.

| # | Idea | Rationale | Candidate Lab Report |
|---|------|-----------|----------------------|
| 1 | ~~Junction Waypoint Vignettes~~ | Promoted to §XVIII ✅ | — |
| 2 | ~~Companion System~~ | Promoted to §XVIII ✅ | — |
| 3 | ~~Void Archaeology~~ | Promoted to §XVII ✅ | — |
| 4 | ~~Tilbury Harbor Arc~~ | Promoted to §XIX ✅ | — |
| 5 | ~~Visby Underground~~ | Promoted to §XX ✅ | — |
| 6 | ~~Codex Shard Origin Stories~~ | Promoted to §XXII ✅ | — |
| 7 | ~~Inn Dreams~~ | Promoted to §XXIII ✅ | — |
| 8 | ~~The Void Shaman~~ | Promoted to §XXI ✅ | — |

---

## V-D. Documentation Sync — Category Coverage

> The HTML has working code. These docs describe it. Each category below is a **content type** that appears across multiple markdown files. For each category: which files cover it, what the HTML source is, and what sync work is needed.

---

### Category 1 — World Nodes (Story + Navigation)

**HTML source:** `NODE_MAP` (~line 6966) — 76 nodes (42 story + 7 junctions + 7 EB-adjacent + 20 EB + SL + MT + DF + HM + GL + YL + YC)

| What | File | Current State | Sync Needed |
|------|------|--------------|-------------|
| Node grid (26×16) | `maps.md` | ✅ 74+ nodes in grid (DF/HM/GL + YL/YC added) | — |
| Node legend table | `maps.md` | ✅ 74+ rows | — |
| Node network connections | `maps.md` | ✅ Correct; SL→DF + DF/HM/GL wired | — |
| Node narrative text | `story.md` | ✅ 42 story nodes | DF/HM/GL narrative in world.md defi_land section |
| Act I node descriptions | `world.md` | ✅ CI corrected (SP2); defi_land Extended Birka section added | — |
| Node coordinate index | `maps.md` | ✅ All nodes including DF/HM/GL/YL/YC | — |

---

### Category 2 — Story NPCs (Epic + Birka Six)

**HTML source:** `BIRKA_NPC_PROFILES` (6 Birka), `NPC_DIALOGUES` (6×4×5), `SWEELINCK_DIALOGUE_VARIANTS` (5), NODE_MAP npc fields (7 Epic NPCs)

| What | File | Current State | Sync Needed |
|------|------|--------------|-------------|
| 7 Epic NPC profiles | `story.md` | ✅ Full profiles for all 7 | Verify dialogue hooks match HTML NPC text fields |
| Birka Six profiles | `world.md` | ✅ Section added 2026-05-22 | Verify 6 keys + nodes match `BIRKA_NPC_PROFILES` |
| NPC_DIALOGUES content (6×4×5) | `story.md` | ✅ Full 120-line transcript added (SG02) | — |
| Sweelinck dialogue variants (4) | `story.md` | ✅ 4 ending variants in §Sweelinck's Last Question (SG19) | — |
| NPC favorability states | `world.md` | ✅ Documented (0/1/2/3 labels) | — |
| **Cross-file note:** Captain Draketide appears as Epic NPC #3 (story.md) AND as EA EB quest-giver (Q59). Two contexts, one character. | `story.md` | ✅ Cross-refs added to Draketide/Izador/Mordus profiles; no contradictions found (SG04/SG22) | — |

---

### Category 3 — Monster Stats

**HTML source:** `MONSTER_POOL` (370 monsters), `MONSTER_DROPS`, `EPIC_BOSS_POOL` (20), `WORLD_DB` (66 terrains)

| What | File | Current State | Sync Needed |
|------|------|--------------|-------------|
| All monster stat blocks | `monsters.md` | ✅ 370 documented across 8 source pools, 5 tiers + defi_land | — |
| Epic boss stat blocks (20) | `monsters.md` | ✅ Per index review | Spot-check AC/HP/ATK vs `EPIC_BOSS_POOL` |
| Monster drops (trophy per key) | `monsters.md` | ✅ per index | Verify `MONSTER_DROPS` keys all covered |
| Terrain → monster mapping | `monsters.md` | ✅ WORLD_DB terrain sections in monsters.md; defi_land added (SG09) | — |
| Fish encounter table (Yugurt Lake) | `monsters.md` | ✅ Rank 1–20 table + descriptions added (SG10/SG21) | — |
| defi_land monster pool | `monsters.md` | ✅ Added (SG09): NGMI Swarm, Rug Spider, WAGMI documented | — |

---

### Category 4 — Combat Rules

**HTML source:** All Battle Mode functions (~lines 5319–6730), `CONDITION_ADV`, `CONDITION_ITEMS`, `CONDITION_GOLD`, `BOSS_COMMANDER_AUROS`

| What | File | Current State | Sync Needed |
|------|------|--------------|-------------|
| Attack formula | `combat.md` | ✅ Documented with component table | Verify formula matches `doPlayerAttack()` |
| 1.5 AP economy (main/real/bonus) | `combat.md` | ✅ Documented | Verify 3 boolean flags match HTML field names |
| Condition costs table | `mechanics.md` | ✅ Costs 1,000–5,000gp listed | Verify each cost vs `CONDITION_GOLD` const |
| Condition ADV/DIS effects | `combat.md` | ✅ Full 24-entry CONDITION_ADV table added to combat.md §Conditions & ADV/DIS Reference (SP2) | — |
| Champion crit 19–20 | `combat.md` | ✅ Documented at L3+ | — |
| Action Surge charges | `combat.md` | ✅ 1–2/short rest, L2+ | — |
| Indomitable charges | `combat.md` | ✅ L9+ | — |
| **combat.md line count stale:** says "~10,200 lines" | `combat.md` | ✅ Fixed (SG01): now shows 14,377 lines | — |
| **combat.md last-synced date stale:** says 2026-05-21 | `combat.md` | ✅ Fixed (SG01): now shows 2026-05-24 | — |
| Boss Auros stat block | `combat.md` | ✅ In combat.md §Final Boss — Commander Seraphine Bruhns | — |

---

### Category 5 — Items & Economy

**HTML source:** `SHIELD_ITEMS`, `POTION_TIERS`, `DAGGER_ITEMS`, `WEAPON_ITEMS`, `_D100_TABLE`, `LOOT_TABLE`, `VENDOR_NODES`, `EB_STORY_ITEMS`, `STARTER_POINTY_STICK`, `STARTER_FLINT_DAGGER`, `CONDITION_ITEMS`

| What | File | Current State | Sync Needed |
|------|------|--------------|-------------|
| 6 Shield tiers (+1→+6 AC) | `mechanics.md` | ✅ Documented | Verify minLevel gates match `SHIELD_ITEMS` |
| 4 Potion tiers (name/heal/cost/sell) | `mechanics.md` | ✅ Documented | Verify sell values match `POTION_TIERS` |
| 4 Dagger tiers (drop-only, minLevel) | `mechanics.md` | ✅ Documented | Verify tier gates match `DAGGER_ITEMS` |
| 70 Weapons (14 base × 5 tiers) | `mechanics.md` | ✅ Documented | Verify tier gate rules match `_magicTierAllowed()` |
| _D100_TABLE (20-entry drop table) | `mechanics.md` | ✅ Documented | Verify weights (8 Minor/2 Scroll/5 Heal/3 Greater/2 Superior) |
| 11 EB special items | `world.md` | ✅ Full EB_STORY_ITEMS table added to world.md FL9 Milepoint D — all 11 entries with key/name/icon/quest-giver/sell/desc (SP2) | — |
| Starting kit (Pointy Stick + Flint Dagger) | `mechanics.md` | ✅ Documented | Verify stats (1d4 / atkBonus:-3) match HTML |
| Fishing Rod item | `mechanics.md` | ✅ Added to §Fishing Items (SG03) | — |
| Hooked condition (fish ADV) | `mechanics.md` | ✅ Added to §Fishing Items — Hooked injected by `_startFishBattle()` (SG03) | — |
| CONDITION_ITEMS (11 items name/icon/effect/sell) | `mechanics.md` | ✅ Documented | Verify sell values and exact 11 count |

---

### Category 6 — EB Quest Dialogues (Q52–Q71)

**HTML source:** `EB_NPC_DIALOGUE` (20 entries × 5 fields)

| What | File | Current State | Sync Needed |
|------|------|--------------|-------------|
| Wound (.W) for Q52–Q71 | `story.md` | ✅ Full Q52–Q71 EB section added (SP2) | — |
| Opening (.O) for Q52–Q71 | `story.md` | ✅ All 20 opening texts in story.md | — |
| Warning (.WA) for Q52–Q71 | `story.md` | ✅ All 20 warning texts in story.md | — |
| Negotiate (.N) for Q52–Q71 | `story.md` | ✅ All 20 negotiate lines in story.md | — |
| Return beat (.R) for Q52–Q71 | `story.md` | ✅ All 20 return beats in story.md | — |
| Q-index (NPC names Q64–Q71) | `plan.md` Q-index table | ✅ All NPC names pulled from HTML during SP2 | — |

---

### Category 7 — Froberger Journal

**HTML source:** `FROBERGER_JOURNAL` (41 entries: 10 read-aloud + 31 collectible)

| What | File | Current State | Sync Needed |
|------|------|--------------|-------------|
| Full journal text | `froberger-journal-all-entries.txt` | ✅ exists | Verify all 41 entries match HTML const exactly |
| Journal discovery nodes | `story.md` | ✅ Noted per node | Verify 10 read-aloud nodes correct |
| Entry 41 significance | `world.md` | ✅ Noted | Verify frobergerLastEntryRead flag name matches |
| Journal in index.md | `index.md` | ✅ froberger-journal-all-entries.txt indexed (SP2) | — |

---

### Category 8 — Level-Up & Progression

**HTML source:** `XP_LEVELS` (20 thresholds), `FIGHTER_FEATURES` (L2–L20), `_ASI_TABLE` (6 d6 entries), `_LEVEL_GOLD_GIFT`, `_LEVEL_SHIELD_GIFT`, tattoo system

| What | File | Current State | Sync Needed |
|------|------|--------------|-------------|
| XP thresholds (0→195,000) | `mechanics.md` | ✅ Table documented | Verify all 20 values match `XP_LEVELS` exactly |
| Fighter features per level | `mechanics.md` | ✅ Documented | Verify `FIGHTER_FEATURES` count = 19 entries (L2–L20) |
| ASI d6 table (6 entries) | `mechanics.md` | ✅ Documented | Verify delta values match `_ASI_TABLE` |
| Gold gifts per level | `mechanics.md` | ✅ Partially | Verify `_LEVEL_GOLD_GIFT` dict (L2:250→L20:2500) |
| Shield gifts (L3→+1, L11→+2) | `mechanics.md` | ✅ Noted | Verify match `_LEVEL_SHIELD_GIFT` |
| Tattoo system | `mechanics.md` | ✅ Partially | Verify `S_story.tattoos` push structure documented |
| Pit training perks | `world.md` | ✅ Full PIT_PERK_UNLOCKS table added to world.md §Key Interactions — 5 perks, keys, titles, Weckmann lines, combat effects (SP2) | — |

---

### Category 9 — Map Geography

**HTML source:** `NODE_MAP`, `CORRIDOR_CELLS`, `GATE_LOCKS`, `NODE_COORDS`, minimap render

| What | File | Current State | Sync Needed |
|------|------|--------------|-------------|
| Full grid (26×16) | `maps.md` | ✅ Accurate except DF/HM/GL | Add 3 cells |
| Gate locks (4 item-gated passages) | `maps.md` | ✅ All 4 documented | Verify blocked messages match HTML `GATE_LOCKS[].label` |
| Shard gate (CO, all 7 shards) | `maps.md` | ✅ Noted | Verify message text matches HTML |
| Corridor system (CORRIDOR_CELLS) | `maps.md` | ✅ Section exists | Verify junction types J1–J7 description matches buildCorridorMap() |
| 4 towns table | `maps.md` | ✅ Birka/Tilbury/Visby/Weimar | Verified against HTML NODE_MAP labels; lore names removed from all docs |
| Sleep nodes table (8 inns) | `maps.md` | ✅ 8 nodes, costs listed | Verify sleepCost values match NODE_MAP sleep fields |
| Minimap warmth | `maps.md` | ✅ §Minimap Warmth Tint & Final Map Render added (SG05) | — |
| Final map render | `maps.md` | ✅ `_renderFinalMap()` timing table added to maps.md (SG06) | — |

---

### Category 10 — NPC Dialogue System

**HTML source:** `NPC_DIALOGUES` (6×4×5 = 120 quotes), `NPC_CROSS_REFS` (17 lines across 6 NPCs), `FROBERGER_TRACES` (6 one-time), `NPC_FAREWELLS` (6), `NPC_ACT_THREE_LINES` (6)

| What | File | Current State | Sync Needed |
|------|------|--------------|-------------|
| 4 favorability states (labels) | `world.md` | ✅ Documented | Verify 0/1/2/3 labels match code |
| NPC_DIALOGUES full content | `story.md` | ✅ Full 120-line transcript added §NPC_DIALOGUES — Full Transcript (SG02) | — |
| NPC_CROSS_REFS 17 lines | `lab-report-web-of-connections.md` | ✅ Per lab report | ✅ Count = 17 verified (HTML: yael×3, brynn×4, couperin×3, pachelbel×2, weckmann×3, bruhns×2) |
| FROBERGER_TRACES 6 entries | `lab-report-web-of-connections.md` | ✅ Per lab report | ✅ Count = 6 verified (yael/brynn/couperin/pachelbel/weckmann/bruhns) |
| NPC_FAREWELLS 6 lines | `lab-report-living-world.md` | ✅ Per lab report | Verify count = 6 |
| NPC_ACT_THREE_LINES 6 lines | `lab-report-living-world.md` | ✅ Per lab report | Verify count = 6 |
| Dialogue priority chain | `story.md` | ✅ FL7 expanded with Milepoint E2 — Brynn Room 6 line, S29 Auros/Froberger, Couperin debt degradation (SP2) | — |

---

### Category 11 — Quest System

**HTML source:** `QUEST_DB`, `S_story.quests`, `storyCheckQuests()`, `storyRenderQuests()`

| What | File | Current State | Sync Needed |
|------|------|--------------|-------------|
| All QUEST_DB entries | `world.md` | ✅ 7 Birka quests documented | Verify all quest IDs, activateNode, objectiveText, reward |
| EB quests (20 return quests) | `world.md` | ✅ FL9 section added (SG12) with full milepoint flow, chip state table, ebReturnDone vs ebReturnsCompleted disambiguation | — |
| Side quests (sq_battling, sq_leveling, etc.) | `mechanics.md` | ✅ Partially | Verify all non-Birka non-EB quests covered |
| Quest failure conditions | — | ✅ No quest failure state exists — quests are only `'active'` or `'complete'`. The only "failure" is Void Defeat (day 49 timeout), which ends the entire run. Confirmed in HTML (verified SP2) | — |

---

### Category 12 — Ending System

**HTML source:** `_curseScore()`, `_missionComplete()`, `storyCheckVictory()`, `_buildEpilogueScroll()`, `_covenantStanding()`, `storyNewGamePlus()`, NG+ state fields

| What | File | Current State | Sync Needed |
|------|------|--------------|-------------|
| 5 Covenant Standing tiers | `story.md` | ✅ Full COVENANT_STANDING_LABELS table added (Keeper/Warden/Keeper/Watcher/Wanderer) + Cursed Seal Echo variant (SP2) | — |
| Curse score formula | `story.md` | ✅ Corrected: +3 started-not-returned, +1 never-started, −5 all-returned bonus. Range −5 to +60 (SP2) | — |
| Mission bits (12, ≥8 = complete) | `world.md` | ✅ Per lab report | Verify all 12 bits listed by name |
| Covenant Keeper conditions | `world.md` | ✅ Mentioned | Verify: curse≤−6 AND pitWins≥5 AND ebNegotiated≥5 |
| NG+ preserved state | `story.md` | ✅ §New Game+ expanded: preserves npcFavorability/pitPerks/ngPlusRun; resets saves; re-randomizes frobergerNoteNode (SP2) | — |
| "Sweelinck is waiting." overlay | `story.md` | ✅ Corrected: fires at storyNewGamePlus() start (2100ms), not on EB revisit (SP2) | — |

---

### Category 13 — Save / Load / Persistence

**HTML source:** `storyAutoSave()`, `storySaveCheckpoint()`, `storyLoadSave()`, `storyCheckContinue()`, `storyLoadContinue()`, `_S_DEFAULTS()`, `S_story` all 55 fields

| What | File | Current State | Sync Needed |
|------|------|--------------|-------------|
| All 107 S_story fields | `plan.md` (Section III) | ✅ All 107 fields verified against HTML line 7842 (SG11) | — |
| Save key format | `mechanics.md` | ✅ r2h_autosave + r2h_checkpoint documented in §Save System (SG08) | — |
| Checkpoint respawn behavior | `mechanics.md` | ✅ Partially | Verify "respawn at last inn" matches `storyRespawnFromCheckpoint()` |
| NG+ counter (`ngPlusRun`) | `story.md` | ✅ Increments by 1 per completed run at storyNewGamePlus(); verified HTML line 8197 (SP2) | — |

---

## VI. Documentation Sync Pass — Spec Unification

---

### A. Complete File Manifest — Disk vs index.md

> **40 .md files + 1 .html + 1 .txt on disk. All files listed and indexed.**

#### Core Reference (in index.md ✅)

| File | index.md Entry | Sync Target (HTML) | Priority |
|------|---------------|---------------------|----------|
| `index.md` | ✅ self | — (maintain) | MAINTAIN |
| `plan.md` | ✅ | — (this document) | MAINTAIN |
| `README.md` | ✅ | — (entry point; links to index.md + plan.md §XIV) | MAINTAIN |
| `mechanics.md` | ✅ | `CONDITION_ITEMS`, `SHIELD_ITEMS`, `POTION_TIERS`, `XP_LEVELS`, `FIGHTER_FEATURES`, `_D100_TABLE`, `VENDOR_NODES`, `_ASI_TABLE`, `_LEVEL_GOLD_GIFT` | F4 |
| `combat.md` | ✅ | `CONDITION_ADV`, `LOOT_TABLE`, `BOSS_COMMANDER_AUROS`, all Battle Mode functions | F6 |
| `maps.md` | ✅ | `NODE_MAP` (coords/connections), `CORRIDOR_CELLS`, `GATE_LOCKS`, `NODE_COORDS`, `HUNTING_GROUNDS` | F1 |
| `story.md` | ✅ | `NODE_MAP` (text/npc/loot/battle), `EB_NPC_DIALOGUE`, `FROBERGER_JOURNAL`, `SWEELINCK_DIALOGUE_VARIANTS`, `NPC_DIALOGUES` | F2 |
| `world.md` | ✅ | `BIRKA_NPC_PROFILES`, `QUEST_DB`, `NPC_CROSS_REFS`, `FROBERGER_TRACES`, `NPC_FAREWELLS`, `NPC_ACT_THREE_LINES`, `EB_STORY_ITEMS` | F3 |
| `monsters.md` | ✅ | `MONSTER_POOL`, `MONSTER_DROPS`, `EPIC_BOSS_POOL`, `WORLD_DB` | F5 |
| `ux-first-battles.md` | ✅ | first-battle UX trace, 10 UX fixes, wimper/flee flow | LOW |

#### Spec Files (in index.md ✅)

| File | index.md Entry | Sync Target (HTML) | Priority |
|------|---------------|---------------------|----------|
| `spec-engine.md` | ✅ | Layers 0–20: `NODE_MAP`, `QUEST_DB`, `GATE_LOCKS`, `S_story` state machine | MEDIUM |
| `spec-corridors.md` | ✅ | L9: `CORRIDOR_CELLS`, `buildCorridorMap()`, `storyCorridorTravel()`, J1–J7 | MEDIUM |
| `spec-world.md` | ✅ | `WORLD_DB` (66 terrains), `MONSTER_POOL` (370 monsters) — counts verified | LOW |
| `spec-combat.md` | ✅ | Base Battle Mode flow (historical) — verify still structurally accurate | LOW |
| `spec-migration.md` | ✅ | Layers 0–8 summaries — verify against implemented code | LOW |

#### Lab Reports — Implemented (in index.md ✅)

| File | index.md Entry | Sync Target (HTML) | Priority |
|------|---------------|---------------------|----------|
| `lab-report-architecture-full.md` | ✅ | Full function catalog — verify all function names still exist and signatures match | HIGH |
| `lab-report-endings-and-echoes.md` | ✅ | Layer 43: `_curseScore()`, `storyCheckVictory()`, `_buildEpilogueScroll()`, `storyNewGamePlus()`, NG+ state | MEDIUM |
| `lab-report-living-world.md` | ✅ | Layer 44: `_getGigaultState()`, `_checkWorldProgressionEvents()`, `_applyActThreeWeight()`, `_renderFinalMap()`, `_getFarewell()` | MEDIUM |
| `lab-report-web-of-connections.md` | ✅ | Layer 45: `FROBERGER_TRACES`, `NPC_CROSS_REFS`, `_checkFrobergerTrace()`, Yael patrol, Weckmann log, Room 6 | MEDIUM |
| `lab-report-game-story-codex-of-conquest.md` | ✅ | Layer 40: `FROBERGER_JOURNAL` (41 entries), `storyCheckJournal()`, `storyShowFrobergerNote()` | MEDIUM |
| `lab-report-epic-battlegrounds.md` | ✅ | Layer 39: `EPIC_BOSS_POOL`, `EB_NPC_DIALOGUE` (20 entries), `_storyEbNpcModal()`, `_storyEbReturnBeat()`, `storyEpicPreBattle()` | MEDIUM |
| `lab-report-birka-beginner-arc.md` | ✅ | Layer 41: `BIRKA_NPC_PROFILES`, `npcFavorability`, 7 Birka quests, `storyBuyWhiskey()`, Yael escort | MEDIUM |
| `lab-report-npc-dialogue-system.md` | ✅ | Layer 42: `NPC_DIALOGUES` (6×4×5), `_getNPCDialogue()`, `_missionComplete()`, 4 ending variants | MEDIUM |
| `lab-report-friendships-with-magic.md` | ✅ | L41–42 postmortem: BFS row highlight, Hunt Mode toggle, EB negotiation CHA DC17, weapon auto-equip, roll line on pass+fail | LOW |
| `lab-report-plan-cleanup-v13.md` | ✅ | Layers 9–13 archive — verify step codes vs implemented functions | LOW |
| `lab-report-plan-cleanup-v17.md` | ✅ | Layers 14–17 archive — verify 6 bug corrections still reflected in code | LOW |
| `lab-report-leveling-flashbang-condition-economy.md` | ✅ | Layer 18: `_checkLevelUp()`, `CONDITION_GOLD` (×100), Flashbang, 0.5-action bonus phase | LOW |
| `lab-report-drop-rates-balance-and-health.md` | ✅ | Drop rate formula `floor(0.1 × AC × maxHP)`, `_rollD100Loot()`, health economy | LOW |
| `lab-report-battleground-circuit-path-quest.md` | ✅ | Stalk/XP methodology, `_stalkedMonsterPick()`, `_weightedMonsterPick()`, guaranteed encounter | LOW |
| `lab-report-circuit-map-theory.md` | ✅ | `CORRIDOR_CELLS` theory, Hunt/Warp trace — reference only | LOW |
| `lab-report-prompt-migration-arena-to-prototype.md` | ✅ | Layers 0–13 retrospective — reference only | LOW |
| `lab-report-loot-drop-weapon-economy.md` | ✅ | Historical proposal (implemented L25 as `_D100_TABLE`) — mark superseded | LOW |
| `lab-report-story-codoex-curse-of-knowedge.md` | ✅ | Writing style guide — no code reference | LOW |
| `lab-report-fishing-bait-prompting.md` | ✅ | §XII design process meta-report: prompting methodology, plan.md-as-structured-prompt analysis, drop nerf + Luck stat integration documented | LOW |
| `lab-report-documentation-system-design.md` | ✅ | IEEE-format analysis of the two-way sync architecture, plan.md purpose, keyword vocabulary, task decomposition framework (Spec→Stub→Code→Sync→Commit), ASCII diagrams | LOW |
| `lab-report-ponies-unicorns-aspirations-future-ideas.md` | ✅ | 💭 Aspirational: DM's Companion Guide (80–120pp spoiler manual); standalone Fishing Guide; Mission Explorer; Polyphonic Organ Synthesizer (§VI — implemented as 5thOrgan.html) | LOW |
| `lab-report-Polyphonic-Organ-Synth.md` | ✅ | IEEE-format design report for `5thOrgan.html`: harmonic series, biquad filter derivation, ADSR for pipe organ, Beethoven 5th canon construction, Web Audio API architecture (170 nodes), post-session review | LOW |
| `5thOrgan.html` | ✅ | Standalone polyphonic pipe organ synthesizer — 72 oscillators, drawbars H1–H6, ADSR, biquad LP filter, Beethoven Op.67 canon sequencer, oscilloscope, all params adjustable | LOW |

#### ✅ Previously Missing from index.md — All Added (SP2)

| File | index.md Entry | Content | HTML Sync Target | Action |
|------|---------------|---------|------------------|--------|
| `lab-report-fish-with-dnd.md` | ✅ INDEXED | Yugurt Lake fishing system — predator encounter mechanic, The Fisherman NPC, Fishing Rod item, Hooked condition | `storyFishing()`, `_startFishBattle()`, `HUNTING_GROUNDS` fish entries, Fishing Rod in `NODE_MAP` loot | ✅ Added to index.md §Lab Reports — Implemented (SP2) |
| `lab-report-timeline-history-completed.md` | ✅ INDEXED | Complete development timeline Layers 0–45 + all S-suggestions, extracted from plan.md 2026-05-22 | All — full layer-by-layer archive with key functions per layer | ✅ Added to index.md as archive reference (SP2) |
| `froberger-journal-all-entries.txt` | ✅ INDEXED | All 41 Froberger journal entries (full text); count verified 41/41 against HTML | `FROBERGER_JOURNAL` const — count verified (SG24) | ✅ Added to index.md §Content Sources (SP2) |

---

### B. Per-File Sync Plans

> For each file: what to read in the HTML, what to compare, what constitutes "synced."

#### F1 — maps.md ↔ HTML

**Read in HTML:** `NODE_MAP` (~line 6966, all 76 nodes), `CORRIDOR_CELLS` (computed), `GATE_LOCKS`, `NODE_COORDS`, `HUNTING_GROUNDS`

**Compare:**
1. Every node code in `NODE_MAP` has a row in maps.md legend table (code, #, terrain, act, grid cell, description)
2. Every node's N/S/E/W connections match maps.md node network section exactly
3. All 4 `GATE_LOCKS` entries match maps.md gate locks table (from/to/direction/item/message)
4. All `CORRIDOR_CELLS` junction types (J1–J7) match the circuit corridors section
5. All 20 Epic Battleground nodes (E*) appear in legend + coordinate index
6. Nodes DF/HM/GL (72–74, defi_land) — ✅ Added to maps.md legend + coordinate index (SP2)
7. SL "dead-end" note — ✅ Corrected in maps.md; now shows SL connects N→DF (SP2)

**Synced when:** maps.md legend has 74 rows, connections match HTML exactly, DF/HM/GL added, SL corrected. ✅ COMPLETE

---

#### F2 — story.md ↔ HTML

**Read in HTML:** `NODE_MAP` text/npc/loot/battle fields, `EB_NPC_DIALOGUE` (20 entries, 5 fields each), `FROBERGER_JOURNAL` (41 entries), `SWEELINCK_DIALOGUE_VARIANTS` (5), `NPC_DIALOGUES` (6×4×5)

**Compare:**
1. Every story node (1–76) has a narrative section in story.md
2. EB_NPC_DIALOGUE wound/opening/warning/negotiate/return for all 20 nodes — ✅ Full Q52–Q71 table in story.md (SP2)
3. FROBERGER_JOURNAL 41 entries match `froberger-journal-all-entries.txt` and HTML const — ✅ Count verified 41/41 (SG24)
4. SWEELINCK_DIALOGUE_VARIANTS — ✅ 4 ending variants documented in story.md §Sweelinck's Last Question (SG19)
5. story.md simplified node network diagram — add disclaimer "conceptual only; see maps.md"
6. Four towns use real names only: Birka / Tilbury / Visby / Weimar — ✅ Lore names purged (SG07)

**Synced when:** EB section added (Q52–Q71 complete), all node text present, journal verified. ✅ COMPLETE (items 2–4,6)

---

#### F3 — world.md ↔ HTML

**Read in HTML:** `BIRKA_NPC_PROFILES`, `QUEST_DB`, `NPC_CROSS_REFS`, `FROBERGER_TRACES`, `NPC_FAREWELLS`, `NPC_ACT_THREE_LINES`, `EB_STORY_ITEMS`, `_DEFEAT_COPY`, `SWEELINCK_DIALOGUE_VARIANTS`

**Compare:**
1. CI node connections — ✅ Fixed in world.md (SP2): now shows `N→SL · E→IN · S→CR · W→J1`
2. SL dead-end claim — ✅ Fixed in world.md: SL connects further N→DF (SP2)
3. All 6 BIRKA_NPC_PROFILES match world.md Birka Six section (key/name/occupation/node) — ✅ verified SP2
4. All QUEST_DB entries (7 Birka + EB quests) match world.md quest descriptions — ✅ verified SP2
5. NPC_CROSS_REFS 17 lines — ✅ documented in lab-report-web-of-connections.md; count corrected from 14→17
6. FROBERGER_TRACES 6 entries — ✅ documented in lab-report-web-of-connections.md
7. 4 faction descriptions match what's in world.md — ✅ verified SP2
8. EB_STORY_ITEMS 11 special rewards documented (Forge Rune, Runic Hammer, etc.) — ✅ in world.md
9. _DEFEAT_COPY (Time Defeat / Void Defeat text) — ✅ documented in world.md survival pressure table
10. DF/HM/GL area — ✅ Added as Act I "Extended Birka" section in world.md (SP2)

**Synced when:** CI connections fixed, SL corrected, all NPC/quest/faction content verified. ✅ COMPLETE

---

#### F4 — mechanics.md ↔ HTML

**Read in HTML:** `CONDITION_ITEMS`, `CONDITION_GOLD`, `SHIELD_ITEMS`, `POTION_TIERS`, `_D100_TABLE`, `XP_LEVELS`, `FIGHTER_FEATURES`, `_ASI_TABLE`, `_LEVEL_GOLD_GIFT`, `_LEVEL_SHIELD_GIFT`, `VENDOR_NODES`, `LOOT_TABLE`, `DAGGER_ITEMS`, `WEAPON_ITEMS`, `STARTER_POINTY_STICK`, `STARTER_FLINT_DAGGER`

**Compare:**
1. All 11 `CONDITION_ITEMS` (name/icon/effect/sell) match mechanics.md condition table
2. All `CONDITION_GOLD` costs match
3. All 6 `SHIELD_ITEMS` tiers (+1→+6 AC, vendor-only, minLevel) match mechanics.md shield table
4. All 4 `POTION_TIERS` (name/icon/heal/cost/sell) match mechanics.md potion table
5. `_D100_TABLE` — ✅ 16-entry weighted table (total weight 100) fully documented in mechanics.md §Loot Table; LOOT_TABLE is dead code (SP2)
6. `XP_LEVELS` — ✅ CORRECTED in mechanics.md: 0/400/1000/2000/3500…195,000 (was wrong: old table showed 680,000 cap) (SP2)
7. `FIGHTER_FEATURES` — ✅ All 19 entries (Lv2–Lv20) verified vs HTML line 9470; crit logic confirmed: Lv3→19-20, Lv15→18-20, Lv20→17-20 (SP2)
8. `_ASI_TABLE` — ✅ 6-entry d6 table in mechanics.md verified vs HTML line 9495 (SP2)
9. `VENDOR_NODES` — ✅ BA/MQ/SF/IS/BK documented in mechanics.md §Vendor System (SP2)
10. `DAGGER_ITEMS` — ✅ 4 tiers documented in mechanics.md §Dagger Drops (SP2)
11. `WEAPON_ITEMS` — ✅ 70 weapons (14 base × 5 tiers) documented in mechanics.md §Weapons (SP2)
12. Starting kit — ✅ Pointy Stick (1d4, sell:10) + Flint Dagger (atkBonus:−3, sell:5) in mechanics.md §Starting Kit; HTML line 8613-8615 (SP2)
13. Void Tide schedule — ✅ days 3/7/14/21/28/35/42 documented in mechanics.md §Survival & Rest (SP2)

**Synced when:** All constants match table-by-table; no value discrepancies. ✅ COMPLETE

---

#### F5 — monsters.md ↔ HTML

**Read in HTML:** `MONSTER_POOL` (370 monsters), `MONSTER_DROPS`, `EPIC_BOSS_POOL` (20 entries), `WORLD_DB` (66 terrains: 46 base + 20 epic)

**Compare:**
1. `MONSTER_POOL` count — ✅ 370 keys verified (HTML line 4458–4864); monsters.md updated 2026-05-24
2. All `EPIC_BOSS_POOL` 20 entries (slug/AC/HP/ATK/dmg/epicDesc) match monsters.md
3. All `WORLD_DB` terrains (42 + defi_land) each have a monsters.md section
4. `MONSTER_DROPS` — trophy for each monster key documented
5. defi_land terrain (DF/HM/GL nodes) — `WORLD_DB` entry for `defi_land` — verify monsters listed
6. Fish encounter table (Yugurt Lake fish pool) — verify documented per `lab-report-fish-with-dnd.md`

**Synced when:** Count correct, all 20 EB bosses verified, defi_land terrain covered. ✅ COMPLETE (SP2/SG09/SG10/SG21)

---

#### F6 — combat.md ↔ HTML

**Read in HTML:** All Battle Mode functions (~line 5319–6730), `CONDITION_ADV`, `_DEFEAT_COPY`, `BOSS_COMMANDER_AUROS`, pre-battle functions (~13007–13200), death save functions, level-up functions

**Compare:**
1. Battle Mode flow (Initiative → Player Turn → Enemy Turn → Outcome) — verify all steps documented
2. 1.5 AP economy (usedMainAttack / usedRealAttack / usedBonusAction) — verify documented
3. `BOSS_COMMANDER_AUROS` stat block (AC22/HP300/ATK+12/3d8+6) — verify in combat.md
4. `CONDITION_ADV` table — ✅ Added to combat.md §Conditions & ADV/DIS Reference (24 entries, SP2 complete)
5. Death save system: d20 vs DC10, 3 successes = crawl, 3 fails = fall — ✅ documented in combat.md FL11
6. Flee/wimper flow (`storyRunAway()` → enemy free attack → return to Story Mode) — ✅ documented in combat.md
7. Pre-battle condition selector and gold cost system — ✅ documented in mechanics.md §Conditions
8. Champion crit (19–20 crit range at L3+) — ✅ documented in combat.md §Fighter Champion Class Features
9. Action Surge (1–2 charges/short rest, L2+) and Indomitable (L9+) — ✅ documented in combat.md §Action Economy
10. Story vs Battle Mode initiative split (`_storyRollInit()` vs `rollInitiative()`) — ✅ documented in combat.md

**Synced when:** Every flow chart step (FL2, FL6, FL11) traceable to a combat.md section. ✅ COMPLETE

---

#### Spec Files — Verification Plans

| File | HTML Comparison | Synced When |
|------|----------------|-------------|
| `spec-engine.md` | Verify all L0–L20 "PLANNED" → "IMPLEMENTED" labels; check that every referenced function still exists at the named line | ✅ All L0–L37 marked IMPLEMENTED; Layers 38–45 in lab reports; no stale labels found |
| `spec-corridors.md` | Verify L9-A–L9-H step codes against `buildCorridorMap()`, `storyCorridorTravel()`, J1–J7 nodes | ✅ Status header: "COMPLETE — All L9-A through L9-H implemented" |
| `spec-world.md` | Verify terrain count = 66 (46 base + 20 epic), monster count = 370 | ✅ Counts match HTML — note updated 2026-05-24 |
| `spec-combat.md` | Historical — Phase 0/2 arena spec; no PLANNED labels to resolve | ✅ Historical document; no action needed |
| `spec-migration.md` | Verify Layer 0–8 implemented summaries match HTML | ✅ Sections IV/VII/X present; §IV-B and §X both marked "✅ All Implemented" |

---

#### Lab Reports — Verification Plans

| File | HTML Comparison | Action |
|------|----------------|--------|
| `lab-report-architecture-full.md` | Spot-check 10 function names from each of F1–F6 — verify they exist at claimed lines | ✅ All checked: storyRender/storyMove/storyPreBattle/buildCorridorMap/storyWaypoint/_weightedMonsterPick/triggerCorridorEncounter/_getNPCDialogue/_curseScore/_covenantStanding all found at expected lines; `_curseScore()` formula corrected in lab report (was +2/+1/−1, now +3/+1/−5) |
| `lab-report-endings-and-echoes.md` | Verify `_curseScore()` formula, 5 ending tiers (COVENANT_STANDING_LABELS), NG+ state fields match HTML | ✅ 5-tier COVENANT_STANDING_LABELS verified; NG+ preserved fields documented; `_curseScore()` formula (+3/+1/−5) in story.md |
| `lab-report-living-world.md` | Verify `_getGigaultState()`, `_checkWorldProgressionEvents()`, `NPC_FAREWELLS` count | ✅ All verified: `_getGigaultState()` §II; `WORLD_PROGRESSION_EVENTS` §III; `NPC_FAREWELLS` 6/6 NPCs |
| `lab-report-web-of-connections.md` | Verify `FROBERGER_TRACES` count = 6, `NPC_CROSS_REFS` count = 17, Room 6 triggers | ✅ FROBERGER_TRACES = 6; NPC_CROSS_REFS = 17 (was documented as 14 — corrected); Room 6 documented §VII |
| `lab-report-game-story-codex-of-conquest.md` | Verify `FROBERGER_JOURNAL` = 41 entries, 10 read-aloud nodes correct | ✅ 41 `entryNum:` entries verified in HTML lines 10328–10370 |
| `lab-report-epic-battlegrounds.md` | Verify all 20 EB codes (`_EB_CODES`) match, payment floors/ceilings match `EB_NPC_DIALOGUE` | ✅ All 20 codes match HTML `_EB_CODES` (EF→EG); all 20 floor/ceiling values verified against HTML lines 10106–10296 |
| `lab-report-birka-beginner-arc.md` | Verify 6 NPCs, 7 quests, Rough Whiskey flag, Yael escort flag | ✅ 6 NPCs in BIRKA_NPC_PROFILES (yael/brynn/quill/pachelbel/crov/auros); 6 quests in QUEST_DB (not 7 — `quest_drunk_fight` is a flag ref only, not a QUEST_DB entry); `roughWhiskeyUsed` + `yaelEscortUsed` confirmed; world.md quest IDs corrected (5 were wrong) |
| `lab-report-npc-dialogue-system.md` | Verify `NPC_DIALOGUES` structure = 6×4×5, `_missionComplete()` = 12 mission bits, ≥8 threshold | ✅ 6×4×5=120 confirmed (6 NPCs, 4 pools: impartial/questActive/friendly/dearFriend, 5 quotes each); `_missionComplete()` HTML uses `≥8` not `.every(Boolean)` — implementation note added to lab report |
| `lab-report-fish-with-dnd.md` | ✅ **INDEXED** — in index.md §Lab Reports — Implemented; Fishing Rod + Hooked documented in mechanics.md (SG03); fish pool in monsters.md (SG10/SG21) | — |
| `lab-report-timeline-history-completed.md` | ✅ **INDEXED** — in index.md §Archive; 45 layers confirmed | — |
| `froberger-journal-all-entries.txt` | ✅ **INDEXED** — in index.md §Content Sources; 41/41 entries verified vs HTML (SG24) | — |
| `lab-report-loot-drop-weapon-economy.md` | Historical proposal — verify index.md notes it as "superseded by L25 `_D100_TABLE`" | ✅ index.md §Known Conflicts + Review Plan row 32 both note "Superseded — loot system (L25) fully implemented. Document is historical proposal." |
| `lab-report-story-codoex-curse-of-knowedge.md` | Writing style guide — no code sync needed | ✅ index.md §Lab Reports — Design Specs categorizes it as "Pinker Framework Application (writing guide)"; Review Plan row 38 notes "Writing framework — used as style reference; no direct code changes" |

---

### C. Master Increment Queue (All Files)

> Replaces previous 8-item queue. Full scope: 35 files × HTML comparison. One "continue" per increment.

| Inc | File | HTML Target | Description | Status |
|-----|------|-------------|-------------|--------|
| S01 | `world.md` | `NODE_MAP` CI, SL | Fix CI connections (line 40); fix SL dead-end claim | ✅ |
| S02 | `maps.md` | `NODE_MAP` DF/HM/GL | Add nodes 72–74 to legend, grid, network, coordinate index | ✅ |
| S03 | `world.md` | `NODE_MAP` DF/HM/GL | Add defi_land Extended Birka section to Act I | ✅ |
| S04 | `plan.md` | `EB_NPC_DIALOGUE` EE–EG | Pull Q64–Q71 NPC names; complete Q-index table | ✅ |
| S05 | `story.md` | `EB_NPC_DIALOGUE` EF–EA | Add EB section Q52–Q59 (wound/opening/warning/N/R) | ✅ |
| S06 | `story.md` | `EB_NPC_DIALOGUE` EC–EG | Add EB section Q60–Q71 (wound/opening/warning/N/R) | ✅ |
| S07 | `index.md` | — | Add `lab-report-fish-with-dnd.md` to index under Lab Reports — Implemented | ✅ |
| S08 | `index.md` | — | Add `lab-report-timeline-history-completed.md` to index as archive | ✅ |
| S09 | `index.md` | `FROBERGER_JOURNAL` | Add `froberger-journal-all-entries.txt` to index as content source | ✅ |
| S10 | `lab-report-fish-with-dnd.md` | `storyFishing()`, `_startFishBattle()` | Verify fishing mechanic matches HTML; note discrepancies | ✅ |
| S11 | `maps.md` | `NODE_MAP` (all 76 nodes) | F1 function coverage: storyMove→storyRender flow documented | ✅ |
| S12 | `story.md` | `NPC_DIALOGUES`, `SWEELINCK_DIALOGUE_VARIANTS` | F2: verify NPC dialogue structure documented | ✅ |
| S13 | `world.md` | `QUEST_DB`, `NPC_CROSS_REFS`, `FROBERGER_TRACES` | F3: verify quest/NPC content coverage | ✅ |
| S14 | `mechanics.md` | `CONDITION_ITEMS`, `SHIELD_ITEMS`, `POTION_TIERS`, `XP_LEVELS` | F4: verify all constants match tables | ✅ |
| S15 | `mechanics.md` | `FIGHTER_FEATURES`, `_D100_TABLE`, `DAGGER_ITEMS`, `WEAPON_ITEMS` | F4 continued: leveling + loot tables | ✅ |
| S16 | `monsters.md` | `MONSTER_POOL`, `EPIC_BOSS_POOL`, `WORLD_DB` | F5: verify counts + defi_land terrain | ✅ |
| S17 | `combat.md` | Battle Mode functions, `CONDITION_ADV`, `BOSS_COMMANDER_AUROS` | F6: verify battle flow + all 10 comparison points | ✅ |
| S18 | `spec-engine.md` | Layers 0–20 labels | Verify all PLANNED→IMPLEMENTED; no stale function refs | ✅ |
| S19 | `spec-world.md` | `WORLD_DB`, `MONSTER_POOL` | ✅ terrain count = 66 (46 base + 20 epic); monster count = 370 — verified HTML 2026-05-24 | ✅ |
| S20 | `lab-report-architecture-full.md` | All F1–F6 functions | Spot-check 10 function names per file — still at claimed lines? | ✅ |
| S21 | `lab-report-endings-and-echoes.md` | `_curseScore()`, NG+ fields | Verify ending variant formula + NG+ preserved fields | ✅ |
| S22 | `lab-report-epic-battlegrounds.md` | `EPIC_BOSS_POOL`, `EB_NPC_DIALOGUE` | Verify all 20 EB codes + payment floors/ceilings | ✅ |
| S23 | `froberger-journal-all-entries.txt` | `FROBERGER_JOURNAL` | Compare all 41 entry texts against HTML const | ✅ |
| S24 | `index.md` | all | Update review table rows 44–50 for new files + sync pass entries | ✅ |
| S25 | `plan.md` | — | Final: mark all completed increments; update index.md last-updated line | ✅ |

---

> **Purpose:** Cross-reference every markdown file against `roll2hit-v3.html` (source of truth). Ensure every HTML constant, node, and dialogue entry has a corresponding markdown entry — and that all markdown values match the code exactly. Two-way: docs→code AND code→docs.
>
> **Format:** Work one file-pair per "continue." Each increment: compare, list discrepancies, fix, cross-ref table updated.

---

### Q-Index — Mission Quote & Mission Bit Numbering System

Each Epic Battleground node carries 5 dialogue fields in `EB_NPC_DIALOGUE`. These are indexed as:

**`Q{nodeNum}.{field}`** where field codes are:

| Code | Field | Meaning |
|------|-------|---------|
| `.W` | wound | NPC's backstory — the loss that motivates the quest |
| `.O` | opening | NPC's ask to the player |
| `.WA` | warning | Tactical warning about the boss |
| `.N` | negotiate | Payment negotiation line |
| `.R` | return | NPC's reaction on successful return |

**Full Q-Index (Nodes 52–71):**

| Q# | Code | NPC | Location |
|----|------|-----|----------|
| Q52 | EF | Woodcutter Bram | FO — Thornwood Maw |
| Q53 | EH | Shepherd Rona | HL — Loch of the Drowned King |
| Q54 | ES | Herbalist Gwynne | SW — Sunken Altar |
| Q55 | EW | Wane (youngest crone) | HS — Hag Mother's Cradle |
| Q56 | EB | Harbormaster Tula | BE — Wreck of the Unbroken |
| Q57 | EO | Navigator Cassius | DS — Leviathan's Eye |
| Q58 | EI | Island Elder Maris | IS — Isle of the Wyrm Crown |
| Q59 | EA | Captain Selene Draketide | AT — Abyssal Scriptorium |
| Q60 | EC | Runewright Ossian | SC — Scholar Kings' Forge |
| Q61 | EL | River Trader Aldous | FL — Sunken God's Throne |
| Q62 | ED | First Mate Darro | DS — Trench Titan |
| Q63 | EM | Farmer Wren | MI — Noonwraith Queen's Field |
| Q64 | EE | Caravan Master Zephyrine | DE — Pharaoh's Vault |
| Q65 | EV | Izador al-Rashun ✅ | DC — Djinn Lord's Palace |
| Q66 | EJ | Herbalist Mael | JU — Canopy Cathedral |
| Q67 | ET | Blacksmith Dora Flint | BQ — Peak of the Eldest |
| Q68 | ER | Fur Trader Sigrid | AR — Frost Warden's Throne |
| Q69 | EK | Grounded Seraph Ithiel ★ | HC — Shattered Seraph's Spire |
| Q70 | EP | Fence Boss Carrick | PC — Admiral's Last Cove |
| Q71 | EG | Warlord Kael Mordus ✅ | GC — Void Shaman's Sanctum |

> **Usage example:** `Q52.W` = Woodcutter Bram's wound. `Q56.R` = Harbormaster Tula's return beat.  
> **Destination:** ✅ All Q-entries added to `story.md` §EPIC BATTLEGROUNDS (SP2).  
> **✅ Dual-role NPCs resolved (SG04/SG22):** Q65 Izador, Q71 Mordus, Q59 Draketide — cross-refs added to all three Epic NPC profiles in story.md; no contradictions found.  
> **★ Zero-payment entry:** Q69 (EK — Grounded Seraph Ithiel) has paymentFloor:0 / paymentCeiling:0. No gold reward. Special item only: `star_fragment`. The negotiateLine is "There is no gold. There is only this." Unique across all 20 EB entries.

---

### Cross-Reference Table

| HTML Constant / Section | Markdown Home | Status |
|------------------------|---------------|--------|
| `NODE_MAP` CI connections (N/S/E/W) | `world.md` Act I, `maps.md` node network | ✅ world.md fixed 2026-05-24 |
| `NODE_MAP` nodes DF/HM/GL (72–74) | `maps.md` legend, `world.md` Act I | ✅ maps.md fixed 2026-05-24; world.md S03 pending |
| `EB_NPC_DIALOGUE` (Q52–Q71, 5 fields each) | `story.md` | ✅ All 20 entries (Q52–Q71) added 2026-05-24 |
| `EB_NPC_DIALOGUE` (Q64–Q71, NPC names) | this plan.md Q-index | ✅ All NPC names verified from HTML during SP2 |
| `maps.md` SL "dead-end" note | `maps.md` legend, `world.md` | ✅ Both fixed (SP2) |
| `story.md` simplified node network | `maps.md` full grid | ✅ Disclaimer added to story.md §NODE NETWORK MAP (SP2) |
| `FOUR TOWNS` names | all docs | ✅ Unified — Birka/Tilbury/Visby/Weimar only; lore names purged 2026-05-24 |

---

### Pass 1 — World Map (this session)

**Scope:** Compare `NODE_MAP` in HTML against `maps.md` and `world.md`.  
**Source of truth:** `roll2hit-v3.html` `NODE_MAP` definition (~line 6966).

**Finding 1 — world.md CI connections WRONG** *(world.md line 40)*
- world.md says: `N→SL, S→IN, E→TV, W→BA`
- HTML says: `N→SL, S→CR, E→IN, W→J1`
- Status: ✅ Fixed in world.md (SP2) — now shows `N→SL · E→IN · S→CR · W→J1`

**Finding 2 — Undocumented defi_land cluster (Nodes 72–74)**
- HTML defines DF (Node 72), HM (Node 73), GL (Node 74) — all `defi_land` terrain, north of SL
- DF: The Unbanked Quarter · HM: Frequency Row · GL: Old Guard's Corner
- SL→N→DF; DF→E→HM; DF→W→GL
- Status: ✅ Added to maps.md legend + coordinate index; world.md Act I Extended Birka section added; SL corrected in both docs (SP2)

**Finding 3 — story.md no EB content**
- 20 `EB_NPC_DIALOGUE` entries (Q52–Q71), 5 fields each = 100 text fragments
- None are in story.md; no EB section exists
- Status: ✅ Full Q52–Q71 EB section added to story.md with all wound/opening/warning/negotiate/return lines (SP2)

**Finding 4 — story.md node network outdated**
- story.md has a simplified ASCII node diagram that predates junctions, EB nodes, defi_land
- maps.md has the authoritative 26×16 grid
- Status: ✅ Disclaimer added to story.md §NODE NETWORK MAP: "conceptual terrain topology — see maps.md for authoritative grid" (SP2)

---

---

### The Six Sync Files

The six markdown documents that must be two-way synced against `roll2hit-v3.html`. Each is compared function-by-function and constant-by-constant. Every flow chart through the program must be traceable to at least one entry in one of these six files.

| # | File | HTML Constants Owned | HTML Functions Owned |
|---|------|---------------------|---------------------|
| F1 | `maps.md` | `NODE_MAP` (coords/connections), `CORRIDOR_CELLS`, `GATE_LOCKS`, `NODE_COORDS`, `HUNTING_GROUNDS` | navigation, map render, corridor, BFS |
| F2 | `story.md` | `NODE_MAP` (text/npc/loot), `EB_NPC_DIALOGUE`, `FROBERGER_JOURNAL`, `SWEELINCK_DIALOGUE_VARIANTS`, `NPC_DIALOGUES` | node render, NPC display, journal, EB modals, endings |
| F3 | `world.md` | `BIRKA_NPC_PROFILES`, `QUEST_DB`, `NPC_CROSS_REFS`, `FROBERGER_TRACES`, `NPC_FAREWELLS`, `NPC_ACT_THREE_LINES` | quest logic, favorability, curse score, world events, epilogue |
| F4 | `mechanics.md` | `CONDITION_ITEMS`, `CONDITION_GOLD`, `SHIELD_ITEMS`, `POTION_TIERS`, `_D100_TABLE`, `XP_LEVELS`, `FIGHTER_FEATURES`, `_ASI_TABLE`, `VENDOR_NODES` | vendor, loot, rest, inventory, level-up, void tide |
| F5 | `monsters.md` | `MONSTER_POOL`, `MONSTER_DROPS`, `EPIC_BOSS_POOL`, `WORLD_DB`, `EB_STORY_ITEMS` | monster pick, stalk, hunt, fishing, corridor encounter |
| F6 | `combat.md` | `LOOT_TABLE`, `SHIELD_ITEMS` (battle use), `BOSS_COMMANDER_AUROS`, `CONDITION_ADV`, `_LEVEL_GOLD_GIFT`, `_LEVEL_SHIELD_GIFT` | pre-battle, initiative, attack/damage, flee/wimper, death saves, level-up modal |

---

### Function Coverage by File

> **Rule:** Every named function in `roll2hit-v3.html` maps to exactly one of the six files. "Utility" functions (roll, clamp, animateDie, etc.) belong to the file that calls them most. The goal: reading F1–F6 in sequence covers every function in the codebase.

#### F1 — maps.md Functions

| Function | Purpose | Sync Status |
|----------|---------|-------------|
| `storyMove(dir)` | Player navigation — resolves direction, checks GATE_LOCKS, dispatches corridor or direct move | ✅ |
| `storyPortal()` | Instant OU→GA teleport | ✅ |
| `storyCorridorTravel(from, dest, dir)` | Animates cell-by-cell corridor walk | ✅ |
| `triggerCorridorEncounter(terrain, dest, questHunt)` | Random encounter during corridor transit | ✅ |
| `buildCorridorMap()` | Computes `CORRIDOR_CELLS` sparse grid at startup | ✅ |
| `_bfsPath(from, to)` | BFS shortest path between two node codes | ✅ |
| `storyWaypoint()` | Fires BFS auto-walk to waypoint destination | ✅ |
| `storySetWaypoint(nodeCode)` | Sets waypoint target; highlights path | ✅ |
| `_setActivePath(from, to, dir)` | Marks active gold path on map overlay | ✅ |
| `_updateWaypointBtn()` | Refreshes waypoint button state | ✅ |
| `storyMapToggle()` | Opens/closes map overlay | ✅ |
| `_renderMapGrid()` | Renders full 26×16 node grid | ✅ |
| `_renderMiniMap()` | Renders compact inline minimap in node panel | ✅ |
| `_renderWorldMiniMap()` | Renders world-level minimap with warmth tint | ✅ |
| `_renderFinalMap()` | Final map render at game end | ✅ |
| `_mapIcon(code)` | Returns glyph for a node code | ✅ |
| `_mapAddExits(cell, code)` | Adds exit direction arrows to map cell | ✅ |
| `_updateExitLinks()` | Refreshes d-pad exit buttons for current node | ✅ |
| `_wireGlyph(dirs)` | Returns corridor wire glyph from direction set | ✅ |
| `_routeSegments(r1,c1,r2,c2,first)` | Decomposes route into corridor segments | ✅ |
| `_corridorTerrain(from, to)` | Returns terrain type for a corridor segment | ✅ |
| `_storyFindTerrainNode(terrain)` | Finds a reachable node of given terrain type | ✅ |
| `_getYaelLocation()` | Returns Yael's current patrol node | ✅ |

#### F2 — story.md Functions

| Function | Purpose | Sync Status |
|----------|---------|-------------|
| `storyRender(node, prefix)` | Master node render — text, items, NPC card, battle chip, map | ✅ |
| `storyShowNpc(nodeCode)` | Dispatches NPC card for current node | ✅ |
| `_getNPCDialogue(npcKey)` | Priority chain: quest-active → fav → cross-ref → trace → default | ✅ |
| `_renderNpcCard(key, container)` | Builds NPC card DOM with dialogue + action buttons | ✅ |
| `_hasActiveQuestFor(npcKey)` | Returns true if player has an active quest tied to this NPC | ✅ |
| `storyCheckJournal(node)` | Checks if a Froberger journal entry is found at this node | ✅ |
| `storyJournalToggle()` | Opens/closes journal sidebar | ✅ |
| `storyUpdateJournalCount()` | Updates journal badge count | ✅ |
| `storyShowFrobergerNote()` | Renders parchment note at CO node | ✅ |
| `_checkFrobergerTrace(npcKey)` | Fires one-time Froberger memory for an NPC | ✅ |
| `_storyEbNpcModal(ebCode)` | Renders EB quest-giver modal (wound → opening → warning → negotiate) | ✅ |
| `_storyEbReturnBeat(ebCode)` | Renders EB return beat modal on quest completion | ✅ |
| `storyShowRoom6()` | Renders Room 6 modal (Layer 45) | ✅ |
| `storyShowDeaconCode()` | Renders Deacon's Code modal | ✅ |
| `storyShowBrynnLedger()` | Renders Brynn's maintenance ledger | ✅ |
| `storyShowWeckmannLog()` | Renders Weckmann training log | ✅ |
| `_buildWeckmannLog()` | Constructs Weckmann log text from state | ✅ |
| `_buildSweelinckNamingSequence()` | Builds Sweelinck covenant naming text | ✅ |
| `_buildEpilogueScroll()` | Constructs per-NPC epilogue scroll for ending | ✅ |
| `storyCheckVictory(node)` | Checks win condition; triggers covenant ceremony chain | ✅ |
| `storyPreFinalBattle(node)` | Pre-battle screen for Auros boss fight at CO | ✅ |
| `_covenantStanding()` | Returns string label for ending covenant tier | ✅ |
| `storyMsg(txt)` | Appends a message line to the node log | ✅ |
| `_yaelEscortAction()` | One-time Yael escort narration at CI | ✅ |

#### F3 — world.md Functions

| Function | Purpose | Sync Status |
|----------|---------|-------------|
| `_missionComplete()` | Returns true if ≥8 of 12 mission bits are set | ✅ |
| `_curseScore()` | Computes curse engagement score for ending variant | ✅ |
| `storyCheckQuests(node)` | Checks all QUEST_DB completion conditions at this node | ✅ |
| `storyQuestToggle()` | Opens/closes quest sidebar | ✅ |
| `storyRenderQuests()` | Renders active/done/failed quests list | ✅ |
| `storyCreateCustomQuest()` | Creates a player-defined custom quest entry | ✅ |
| `_npcFavor(key)` | Returns favorability integer for NPC key | ✅ |
| `_lubeckFriends()` | Returns count of NPCs at Friendly+ | ✅ |
| `_setNpcFavor(key, level)` | Sets NPC favorability; fires upgrade check | ✅ |
| `_checkDearFriendUpgrade(key)` | Fires Dear Friend upgrade sequence if conditions met | ✅ |
| `_checkRoughWhiskeyReaction(npcKey)` | Fires drunk pit fight event (one-time) | ✅ |
| `_checkPitPerkUnlock()` | Unlocks pit training perks after enough wins | ✅ |
| `_applyPitPerks(combatState)` | Injects pit perk bonuses into battle state | ✅ |
| `_checkWorldProgressionEvents()` | Fires off-screen world events on node entry | ✅ |
| `_applyActThreeWeight()` | Applies Act III desaturation/ambient shift | ✅ |
| `_getFarewell(from, to)` | Returns farewell line when leaving Friendly+ NPC node | ✅ |
| `_getGigaultState()` | Returns Gigault stall state (present/absent/gone) | ✅ |
| `storyNewGame()` | Resets all state for a new run | ✅ |
| `storyNewGamePlus()` | NG+ reset preserving npcFavorability + pitPerks | ✅ |
| `storyAutoSave()` | Writes S_story to localStorage | ✅ |
| `storySaveCheckpoint()` | Saves checkpoint (inn) node | ✅ |
| `storyLoadSave(key)` | Loads save from localStorage | ✅ |
| `storyCheckContinue()` | Checks for existing save on startup | ✅ |
| `storyRespawnFromCheckpoint()` | Respawns at last checkpoint inn after death | ✅ |
| `storyLoadContinue()` | Loads and resumes a saved run | ✅ |

#### F4 — mechanics.md Functions

| Function | Purpose | Sync Status |
|----------|---------|-------------|
| `storyVendorToggle()` | Opens/closes vendor panel | ✅ |
| `storyRenderVendor()` | Renders vendor item list for current node | ✅ |
| `_renderVendorShields()` | Renders available shield tiers in vendor | ✅ |
| `_renderPachelbelSpecials()` | Renders fav-gated/act-gated Pachelbel special items | ✅ |
| `storySellAll()` | Sells all sellable inventory items | ✅ |
| `storySellEquipment()` | Sells equipped weapon/shield | ✅ |
| `storyBuyPotion(tier)` | Purchases a potion of given tier | ✅ |
| `storyBuyShield(tier)` | Purchases a shield of given tier | ✅ |
| `storyBuyFlashbang()` | Purchases Flashbang condition item | ✅ |
| `storyBuyWhiskey()` | Purchases Rough Whiskey | ✅ |
| `_autoSellDuplicates()` | Auto-sells duplicate items after loot pickup | ✅ |
| `storyCollectLoot(node)` | Collects node loot item into inventory | ✅ |
| `_rollD100Loot()` | Rolls d100 drop table after battle victory | ✅ |
| `_d100Result(r)` | Returns item descriptor for a d100 roll result | ✅ |
| `_rollMonsterWeaponDrop(dmgDie)` | Rolls monster-specific weapon drop | ✅ |
| `_magicTierAllowed(magic)` | Returns true if player level allows magic tier | ✅ |
| `storyRenderInventory()` | Renders full inventory panel | ✅ |
| `storyInventoryToggle()` | Opens/closes inventory panel | ✅ |
| `storyUpdateStatus()` | Refreshes HP/gold/day/level status bar | ✅ |
| `storyShortRest(nodeCode)` | Short rest: heals 25% HP, grants Necklace Token | ✅ |
| `storySleep(node)` | Initiates sleep sequence at inn node | ✅ |
| `storyConfirmSleep()` | Confirms sleep; advances day, heals HP | ✅ |
| `storyCheckVoidTide()` | Checks if current day triggers a Void Tide event | ✅ |
| `storyCheckMissedSleep()` | Applies exhaustion DIS for skipped inns | ✅ |
| `storySetHearthHome(nodeCode)` | Sets Transmort Scroll destination | ✅ |
| `storyUseTransmort()` | Teleports to Hearth Home node | ✅ |
| `_hasItem(keyword)` | Returns true if inventory contains keyword item | ✅ |
| `_maybeAddKnowledgeBead(nodeCode)` | Grants Necklace Token on first short rest at node | ✅ |
| `_knowledgeIcon(terrain)` | Returns icon for a Necklace Token terrain type | ✅ |
| `storyEnter()` | Entry point for Story Mode; init + first render | ✅ |
| `storyExit()` | Returns to Battle Mode from Story Mode | ✅ |
| `storyToggle()` | Toggles Story Mode panel visibility | ✅ |
| `storyGameOver()` | Shows game-over / void-defeat screen | ✅ |
| `storyVoidDefeat(type)` | Fires time or void defeat sequence | ✅ |

#### F5 — monsters.md Functions

| Function | Purpose | Sync Status |
|----------|---------|-------------|
| `populateTerrainEnemies(terrainId)` | Fills enemy preset list for a terrain in Battle Mode | ✅ |
| `loadWorldMonster(m)` | Loads a `WORLD_DB` monster into the battle config | ✅ |
| `loadEnemyPreset(key)` | Loads a named preset monster from `MONSTER_POOL` | ✅ |
| `_weightedMonsterPick(terrain)` | Picks a random monster from WORLD_DB terrain with notoriety weighting | ✅ |
| `_stalkedMonsterPick(terrain)` | Picks a monster matching active quest hunt target | ✅ |
| `_getQuestTargetKeys()` | Returns monster keys required by active hunt quests | ✅ |
| `storyStalk(nodeCode)` | Initiates stalk mechanic — guaranteed quest-target encounter | ✅ |
| `storyQuickWait(nodeCode)` | Quick wait — random encounter without navigation | ✅ |
| `storyToggleHunt()` | Toggles Hunt Mode persistent flag | ✅ |
| `_updateHuntBtn()` | Refreshes Hunt Mode button state | ✅ |
| `storyFishing()` | Fishing mechanic entry — skill check then fish battle | ✅ |
| `_startFishBattle(fish, hasRod)` | Starts a fish-type battle with rod modifier | ✅ |
| `_notoriety()` | Returns current notoriety level from battle history | ✅ |
| `_notorietyWeights(n)` | Returns tier probability weights for notoriety level | ✅ |
| `_getNodeMapColor(nodeSlug)` | Returns terrain color for minimap cell | ✅ |
| `_terrainLabel(nodeName)` | Returns display label for a terrain name | ✅ |

#### F6 — combat.md Functions

| Function | Purpose | Sync Status |
|----------|---------|-------------|
| `storyPreBattle(node)` | Standard pre-battle overlay — monster + condition selector | ✅ |
| `storyEpicPreBattle(node)` | EB pre-battle overlay — DANGER:EPIC screen | ✅ |
| `_switchPreBattTab(tab)` | Switches pre-battle tab (monster/conditions) | ✅ |
| `_renderPreBatt()` | Renders pre-battle panel contents | ✅ |
| `_selectedCondsTotalCost()` | Sums gold cost of selected conditions | ✅ |
| `_toggleCond(i)` | Toggles a condition on/off in pre-battle selector | ✅ |
| `_updatePreBattSummary()` | Refreshes pre-battle cost/summary display | ✅ |
| `storyCommitBattle()` | Locks in pre-battle choices; transitions to Battle Mode | ✅ |
| `storyApplyOutcome(won)` | Applies win/loss result back to Story Mode state | ✅ |
| `storyShowOutcome()` | Renders post-battle outcome modal | ✅ |
| `_storyRollInit()` | Rolls story-mode initiative (no Battle Mode UI) | ✅ |
| `_calcPlayerAc()` | Computes player AC from base + shield + magic bonuses | ✅ |
| `_overlayFlee()` | Shows flee overlay in story battle | ✅ |
| `_storyFleeClean()` | Clean flee — exits battle, no penalty | ✅ |
| `_storyFleeMutual()` | Mutual flee — enemy gets one free attack, then exit | ✅ |
| `storyRunAway()` | Player-initiated flee from story battle | ✅ |
| `_storyWimper()` | Wimper — defeated-state flee attempt | ✅ |
| `_storyEnterDeathSaves()` | Enters death save sequence (HP = 0 in story battle) | ✅ |
| `_storyUpdateDsPips()` | Updates death save pip display | ✅ |
| `_storyRollDeathSave()` | Rolls one death save (d20 vs DC 10) | ✅ |
| `_storyDeathSaveCrawl()` | Death save success sequence — crawl back | ✅ |
| `_storyDeathSaveFall()` | Death save fail sequence — respawn at checkpoint | ✅ |
| `_storyRetrieveCorpse(questId)` | Retrieves a quest item from a dead character | ✅ |
| `_renderSboShield()` | Shows/hides shield row in story battle overlay; gates unequip button to bonus-action phase | ✅ |
| `_storyUnequipShield()` | Unequips shield as bonus action after main attack; triggers enemy turn | ✅ |

#### F4-ext — mechanics.md (Level-Up & Character Sheet)

| Function | Purpose | Sync Status |
|----------|---------|-------------|
| `_checkLevelUp()` | Checks if XP threshold crossed; fires level-up modal | ✅ |
| `_showLevelUpModal(lvl)` | Renders level-up modal (tattoo + ASI or gold gift) | ✅ |
| `_lu_refreshAsiBtns()` | Refreshes ASI choice buttons in level-up modal | ✅ |
| `_lu_applyGiftsAndFinish(lvl, hp)` | Applies level gifts and closes level-up modal | ✅ |
| `storyCharToggle()` | Opens/closes character sheet panel | ✅ |
| `storyRenderCharSheet()` | Renders full character sheet (stats, tattoos, features) | ✅ |

#### F6-ext — combat.md (Battle Mode Utilities)

| Function | Purpose | Sync Status |
|----------|---------|-------------|
| `roll(sides)` / `rollN()` / `rollNExploding()` | Core dice primitives | ✅ |
| `abilityMod(score)` / `getProfBonus()` / `getAtkAbilityMod()` / `getDmgMod()` | Ability/proficiency math | ✅ |
| `resolveAdv(pm,om)` / `rollD20(advState)` | Advantage/disadvantage resolution | ✅ |
| `playerRoll()` / `doPlayerAttack(num,total)` | Battle Mode attack pipeline | ✅ |
| `rollInitiative()` / `oppRoll()` | Battle Mode initiative + enemy attack | ✅ |
| `rollMainDamage()` / `offhandRoll()` / `bonusRoll()` | Battle Mode damage rolls | ✅ |
| `applyCondition(side,condKey)` | Applies condition effect to combatant | ✅ |
| `newCombat()` | Resets Battle Mode for new encounter | ✅ |
| `syncCharFromUI()` / `syncWeaponFromUI()` / `syncOffhandFromUI()` | Syncs Battle Mode config from UI fields | ✅ |
| `hpColor()` / `clamp()` / `dieSVG()` / `animateDie()` / `animateChips()` / `appendChips()` | UI utilities | ✅ |
| `refreshLeftPanel()` / `refreshAbilityMods()` / `disableAllRollBtns()` | Battle Mode panel refresh | ✅ |
| `buildCard()` / `appendCard()` / `battKillEvent()` / `recordRolls()` / `renderHistogram()` | History & histogram | ✅ |
| `rollDeathSave()` / `enterDeathSaves()` / `exitDeathSaves()` | Battle Mode death saves | ✅ |
| `sneakAutoCount()` / `freeRoll()` / `rollHeal()` | Misc Battle Mode rolls | ✅ |

---

### Program Flow Charts

> Every major execution path through the codebase. Each flow must be traceable to at least one of F1–F6. A flow is "covered" when the owning file documents every function in the chain.

| # | Flow Name | Chain | Owner(s) |
|---|-----------|-------|---------|
| FL1 | **Story Navigation** | `storyMove()` → GATE_LOCKS → `storyCorridorTravel()` / direct → `storyRender()` → `storyCheckQuests()` → `storyCheckJournal()` → `storyShowNpc()` | F1, F2, F3 |
| FL2 | **Standard Battle** | `storyPreBattle()` → `_renderPreBatt()` → `_toggleCond()` → `storyCommitBattle()` → [Battle Mode] → `storyApplyOutcome()` → `_rollD100Loot()` → `_checkLevelUp()` | F6, F4 |
| FL3 | **Epic Battleground Quest** | `_storyEbNpcModal()` → negotiation → `storyEpicPreBattle()` → [Battle] → `storyApplyOutcome()` → `_storyEbReturnBeat()` | F2, F6 |
| FL4 | **Rest & Void Tide** | `storySleep()` → `storyConfirmSleep()` → `storyCheckVoidTide()` → `storyCheckMissedSleep()` → HP recovery → day++ → `storyAutoSave()` | F4, F3 |
| FL5 | **Loot Pipeline** | `_rollD100Loot()` → `_d100Result()` → item type → `_autoSellDuplicates()` → `storyRenderInventory()` | F4 |
| FL6 | **Level-Up Chain** | `_checkLevelUp()` → `_showLevelUpModal()` → `_lu_refreshAsiBtns()` → `_lu_applyGiftsAndFinish()` → tattoo push → `storyUpdateStatus()` | F6, F4 |
| FL7 | **NPC Dialogue Priority** | `storyShowNpc()` → `_getNPCDialogue()` → `_hasActiveQuestFor()` → `_checkFrobergerTrace()` → cross-ref injection → `_renderNpcCard()` → `_checkDearFriendUpgrade()` | F2, F3 |
| FL8 | **Ending Chain** | `storyCheckVictory()` → `_missionComplete()` → `_curseScore()` → `_covenantStanding()` → ceremony → `_buildEpilogueScroll()` → `storyNewGamePlus()` | F2, F3 |
| FL9 | **Hunt & Corridor Encounter** | `storyToggleHunt()` → `_stalkedMonsterPick()` → `triggerCorridorEncounter()` → `storyCorridorTravel()` → `_setActivePath()` → `storyRender()` | F1, F5 |
| FL10 | **Vendor Economy** | `storyVendorToggle()` → `storyRenderVendor()` → `_renderVendorShields()` / `_renderPachelbelSpecials()` → `storyBuyPotion/Shield/Flashbang/Whiskey()` → `_magicTierAllowed()` → `storyUpdateStatus()` | F4 |
| FL11 | **Death Save Sequence** | `_storyEnterDeathSaves()` → `_storyRollDeathSave()` → crawl (`_storyDeathSaveCrawl()`) / fall (`_storyDeathSaveFall()`) → checkpoint respawn | F6 |
| FL12 | **Waypoint BFS Walk** | `storySetWaypoint()` → `_bfsPath()` → `storyWaypoint()` → `storyMove()` × n → `_setActivePath()` | F1 |
| FL13 | **Stalk Mechanic** | `storyStalk()` → `_getQuestTargetKeys()` → `_stalkedMonsterPick()` → `storyPreBattle()` → [Battle] | F5, F6 |
| FL14 | **Fishing** | `storyFishing()` → skill check → `_startFishBattle()` → [Battle] → drop | F5, F6 |
| FL15 | **NG+ Reset** | victory → `storyNewGamePlus()` → preserve npcFavorability/pitPerks → `_S_DEFAULTS()` → `storyRender(CI)` | F3 |

---

### Sync Increment Queue

> One increment per "continue." Each: read the relevant section of the owning file → compare against HTML → edit the markdown → mark complete.

| Inc | Scope | File | Functions / Constants | Status |
|-----|-------|------|-----------------------|--------|
| S01 | Fix CI node connections + SL dead-end | `world.md` | `NODE_MAP`: CI(N/S/E/W), SL connections | ✅ |
| S02 | Add DF/HM/GL to legend + node network + grid | `maps.md` | `NODE_MAP` nodes 72–74 | ✅ |
| S03 | Add defi_land area to Act I description | `world.md` | DF, HM, GL lore | ✅ |
| S03b | Update `world.md` cross-ref: DF/HM/GL also in maps.md | `world.md` Category 1 | nodes 72–74 | ✅ |
| S04 | Complete Q-index (pull Q64–Q71 NPC names from HTML) | `plan.md` | `EB_NPC_DIALOGUE` keys EE–EG | ✅ |
| S05 | Add EB NPCs Q52–Q59 to story.md (wound/opening/warning) | `story.md` | `EB_NPC_DIALOGUE` EF–EA | ✅ |
| S06 | Add EB NPCs Q60–Q71 to story.md (wound/opening/warning) | `story.md` | `EB_NPC_DIALOGUE` EC–EG | ✅ |
| S07 | Add return beats (`.R`) + negotiate lines (`.N`) for all 20 | `story.md` | `EB_NPC_DIALOGUE` all | ✅ — all 5 fields written in S05+S06 |
| S08 | Verify maps.md F1 function coverage (navigation block) | `maps.md` | FL1, FL9, FL12 | ✅ |
| S09 | Verify story.md F2 function coverage (NPC + ending block) | `story.md` | FL3, FL7, FL8 | ✅ |
| S10 | Verify world.md F3 function coverage (quest + world events) | `world.md` | FL4, FL7, FL8, FL15 | ✅ |
| S11 | Verify mechanics.md F4 function coverage (vendor + loot + rest) | `mechanics.md` | FL2, FL4, FL5, FL6, FL10 | ✅ |
| S12 | Verify monsters.md F5 function coverage (monster pick + stalk) | `monsters.md` | FL9, FL13, FL14 | ✅ |
| S13 | Verify combat.md F6 function coverage (battle + level-up) | `combat.md` | FL2, FL6, FL11 | ✅ |
| S14 | Town alias table — lore names vs real names | `index.md` | FOUR TOWNS cross-ref | ✅ |
| S15 | Update index.md review table for new sync pass entries | `index.md` | all | ✅ |

---

## VII. Running Suggestions & Future Considerations

> This section is a living list. Append new suggestions as they are noticed. Do not delete entries — mark them ✅ when implemented or ❌ when ruled out with reason.

### Documentation Gaps Found During Sync Pass (2026-05-24)

| # | Observation | File(s) | Priority | Status |
|---|-------------|---------|----------|--------|
| SG01 | `combat.md` header says "~10,200 lines" — HTML is 14,377 lines. Date also stale (2026-05-21). | `combat.md` | HIGH | ✅ Already fixed — header shows 14,377 lines, 2026-05-24 |
| SG02 | `NPC_DIALOGUES` (120 quotes) have no markdown home. 6 NPCs × 4 states × 5 quotes each. Should live in `story.md` or `world.md`. | `story.md` or `world.md` | HIGH | ✅ Full transcript added to story.md §NPC_DIALOGUES — Full Transcript (all 6 NPCs, 4 states, all quotes) |
| SG03 | Fishing Rod item and Hooked condition are missing from `mechanics.md`. | `mechanics.md` | MEDIUM | ✅ Fixed — Fishing Rod + Hooked condition documented in §Fishing Items; Hooked source code verified (injected by `_startFishBattle()`, not from CONDITION_ITEMS) |
| SG04 | Captain Draketide appears as Epic NPC #3 in `story.md` AND as EA EB quest-giver (Q59). Her two contexts should cross-reference each other. | `story.md` | MEDIUM | ✅ EB Quest-Giver line added to Epic NPC #3 entry; Q59 already had the reverse note at line 1354 |
| SG05 | Minimap warmth tint (`_renderWorldMiniMap()`) is not documented in `maps.md`. | `maps.md` | MEDIUM | ✅ |
| SG06 | `_renderFinalMap()` end-game map behavior not documented anywhere. | `maps.md` | MEDIUM | ✅ |
| SG07 | Town lore names purged from all docs. Real names (Birka/Tilbury/Visby/Weimar) are now the only names used. `BIRKA_NPC_PROFILES` const name in HTML is preserved (code, not prose). | `all` | MEDIUM | ✅ |
| SG08 | Save system localStorage key format not documented. What key name does `storyAutoSave()` use? | `mechanics.md` | LOW | ✅ |
| SG09 | defi_land `WORLD_DB` entry (monsters[], terrain) is completely undocumented. | `monsters.md` | MEDIUM | ✅ |
| SG10 | Fish encounter table (Yugurt Lake fish pool, Rank 1–20) not in `monsters.md`. Only in `lab-report-fish-with-dnd.md`. | `monsters.md` | MEDIUM | ✅ |
| SG11 | `_S_DEFAULTS()` (line 7840) defines all 55 state fields — this is the canonical source for Section III of plan.md. Should be verified entry-by-entry. | `plan.md` | HIGH | ✅ All 107 fields verified and documented in Section III |
| SG12 | EB quest return completion conditions not documented — what triggers `ebReturnsCompleted[ebCode] = true`? | `world.md` | MEDIUM | ✅ FL9 section added to World Engine; also fixed stale "55 fields" → 107 |
| SG13 | `S_story.s8VargaWatches`, `archiveVisited`, `s29LineDelivered`, `s49BrynnDelivered`, `raisonToolsUsed` — these S-suggestion state fields are in Section III but not explained in any narrative doc. | `world.md` | LOW | ✅ Narrative entries added to world.md Part Four-B Key Interactions |
| SG14 | `spec-world.md` terrain count: says "42 terrains" but defi_land is a 43rd terrain type in `WORLD_DB`. Count needs update. | `spec-world.md` | LOW | ✅ Already corrected at line 13 (current-state callout) and line 854 (expansion budget) |
| SG15 | `NIGHT_AMBIENT` dict (S52) renders when `gameDay % 4 >= 2` — city night atmosphere. Not documented in `world.md` or `story.md`. | `world.md` | LOW | ✅ FL16 section added with full node table and day-cycle diagram |
| SG16 | `QUILL_UNFINISHED_SONGS` (7 ambient snippets, cycle by gameDay at TV) — content not in `story.md`. | `story.md` | LOW | ✅ Table added to NPC_DIALOGUES transcript section after Quill's Dear Friend quotes |
| SG17 | `EB_NG_PLUS_LINES` (20 EB node NG+ first-lines) — content not documented anywhere. | `story.md` | LOW | ✅ Full table added to story.md in §New Game+ section |
| SG18 | `_renderPachelbelSpecials()` S46/S51/S57 fav-gated + act-gated items at BA — item names and conditions not in `mechanics.md`. | `mechanics.md` | LOW | ✅ Full Pachelbel Special Stock section added to mechanics.md §Vendor System |
| SG19 | `#victory-question` (S48 — Sweelinck's Last Question appended to each ending) — text not in `story.md`. | `story.md` | LOW | ✅ Already documented in story.md §Sweelinck's Last Question (lines 1346–1352) with all 4 variant quotes |
| SG20 | `storyShowDeaconCode()` — Deacon's Code content not documented in `world.md` or `story.md`. | `world.md` | LOW | ✅ Full DEACON_CODE_TEXT added to world.md Part Four-B §Deacon's Code |
| SG21 | `FISH_POOL` const (rank 1–20, lines ~10302–10323) exists in HTML but is not documented in `monsters.md` or `lab-report-fish-with-dnd.md`. All 20 fish names + descriptions are unique combat entities. | `monsters.md` | MEDIUM | ✅ Description column added to Yugurt Lake Fish table in monsters.md |
| SG22 | Three EB quest-givers are the same characters as Epic NPCs in `story.md`: Q59 Draketide (EA), Q65 Izador al-Rashun (EV), Q71 Warlord Mordus (EG). Their Epic NPC profiles and EB wound/opening/warning must not contradict each other. | `story.md` | HIGH | ✅ Backward cross-refs added to all three Epic NPC profiles; verified no contradictions (EB scenes are supplemental, not contradictory) |
| SG23 | Q69 (EK — Grounded Seraph Ithiel) is the only zero-gold EB entry. paymentFloor/Ceiling both = 0. The `_storyEbNpcModal()` negotiation branch must handle 0-gold gracefully — verify in HTML. | `combat.md` or `story.md` | MEDIUM | ✅ Verified: `if (d.paymentFloor === 0)` branch (HTML line 11421) renders "No gold — a greater reward awaits." and hides Negotiate button. story.md Q69 note updated. |
| SG24 | `FROBERGER_JOURNAL` const found at ~line 10326 in HTML. All 17 entries visible — `froberger-journal-all-entries.txt` must be verified against these. First 10 entries confirmed present in HTML. | `froberger-journal-all-entries.txt` | MEDIUM | ✅ HTML has exactly 41 `entryNum:` entries (line 10327, confirmed via grep); txt file has exactly 41 `ENTRY` headers — counts match. Entry 41 (CO node, readAloud:true) verified. |

---

## IX. The Ally Cat Arc — "Nine Lives, Capisce?" (Layer 44)

> **Design status:** ✅ Implemented 2026-05-25. HTML line count: 16,024.  
> **Level range:** 3–5 (beginner arc; accessible from early Act I via SL node)  
> **Tone:** Goodfellas mob + Grease Broadway + New York street dialect. Cats talk tough. Cats have history. Cats have feelings about territory.

---

### IX-A. Setting & World Hook

The Cat Quarter is a sub-district hanging off the SL (Birka Slums) node. No city register. No city services. Run entirely by the Ally Cat community — a layered hierarchy of strays, muscle, Honchos, and the legendary rotating Cat-King. The player stumbles in via a quest chip on the SL node board: a hand-scrawled sign that reads **"RAT PROBLEM. NOT RATS. CATS. WORSE."**

**New node: CQ — The Cat Quarter**  
- Connects: `SL.E → CQ` (new east exit from Birka Slums)  
- Terrain: `alley` (existing WORLD_DB key)  
- Sleep: false  
- NPC: `Jimmy Two-Tails`  
- Battle: `{label:'Beefy Tom × 3', key:'beefy_tom', count:3}`  
- Text: *"Narrow brick lanes, broken glass, discarded fish bones. Every surface is scratched. Not vandalism — territorial markings, dense as wallpaper. A large orange tabby sits on an overturned crate wearing what appears to be a very small fedora. He sees you and doesn't move."*

---

### IX-B. The Cat Hierarchy

```
ALLY CAT COMMUNITY — faction structure

  THE CAT-KING (tornado form)          ← epic boss; rare merge event
       ↑ merges from 3+ Taz Devils
  TAZ DEVIL — FURBALL TORNADO          ← hard boss; spawns when two Honchos meet
       ↑ merges from 1 male + 1 female Honcho
  HONCHO CAT (Male) ← "Capo"          ← medium; territorial, marks exits
  HONCHO CAT (Female) ← "Boss Lady"   ← medium; organizes the community
       ↑ commands
  BEEFY TOM                            ← easy; muscle, large, slow
  FLUFFY CAT                           ← easy; fast, scratchy, hissy
  STRAY ALLEY CAT                      ← trivial; just vibing, reacts badly to approach

  FAT CATS OF THE MERCHANTS (rival faction, city-backed)
  CORRUPTED CATS (void-touched strays; spawn near DF node overlap)
```

---

### IX-C. New MONSTER_POOL Entries (insert after `rug_spider` block, Layer 44 section)

| Key | Name | AC | HP | ATK | Die×Count+Flat | Tier | Notes |
|---|---|---|---|---|---|---|---|
| `stray_alley_cat` | Stray Alley Cat | 11 | 6 | +3 | 1d4+1 | trivial | Hisses, may flee |
| `fluffy_cat` | Fluffy Cat | 12 | 9 | +4 | 1d4+2 | trivial | Fast; two scratch attacks |
| `beefy_tom` | Beefy Tom | 13 | 18 | +4 | 1d6+2 | easy | Shoulder-barge; Charge on round 1 |
| `fat_merchant_cat` | Fat Merchant Cat | 11 | 22 | +3 | 1d6+1 | easy | Drops coin; never fights fair |
| `honcho_cat_m` | Honcho Cat (Capo) | 14 | 32 | +5 | 1d8+3 | medium | Male; marks territory; enrages on low HP |
| `honcho_cat_f` | Boss Lady Honcho | 15 | 36 | +6 | 1d8+4 | medium | Female; commands +1 ATK to all cats in terrain |
| `corrupted_cat` | Corrupted Cat | 13 | 28 | +5 | 1d6+3 | medium | Void-touched; ignores first hit each combat |
| `taz_devil` | Taz Devil — Furball Tornado | 16 | 70 | +8 | 2d8+4 | hard | Boss; AOE scratch; spawns when two Honchos fight |
| `fat_cat_boss` | Don Fluffissimo | 17 | 90 | +7 | 2d6+5 | hard | Merchant cat boss; bodyguards (Fat Merchant Cats ×2) |
| `cat_king` | The Cat-King | 19 | 160 | +10 | 3d8+6 | deadly | Epic boss; tornado form; spawns from 3+ Taz Devils merging |

**MONSTER_DROPS** (add alongside entries):
- `stray_alley_cat` → `{name:'Flea-Dusted Pelt', icon:'🐱', sell:1}`
- `fluffy_cat` → `{name:'Tuft of Fluff', icon:'🐾', sell:2}`
- `beefy_tom` → `{name:'Cracked Claw', icon:'🦴', sell:4}`
- `fat_merchant_cat` → `{name:'Embossed Coin Pouch', icon:'💰', sell:12}`
- `honcho_cat_m` → `{name:'Tiny Fedora', icon:'🎩', sell:8}`
- `honcho_cat_f` → `{name:'Rhinestone Collar', icon:'💎', sell:10}`
- `corrupted_cat` → `{name:'Void-Singed Whisker', icon:'⚡', sell:7}`
- `taz_devil` → `{name:'Furball Crown', icon:'🌀', sell:18}`
- `fat_cat_boss` → `{name:'The Don's Signet Ring', icon:'💍', sell:35}`
- `cat_king` → `{name:'Cat-King's Claw Fragment', icon:'👑', sell:50}`

**Add to WORLD_DB terrain `alley`:** `P.stray_alley_cat, P.fluffy_cat, P.beefy_tom, P.honcho_cat_m, P.honcho_cat_f, P.corrupted_cat, P.taz_devil`

**New WORLD_DB terrain `cat_quarter`:**
```js
cat_quarter: { label:'The Cat Quarter', icon:'🐱', monsters:[
  P.stray_alley_cat, P.fluffy_cat, P.beefy_tom, P.fluffy_cat,
  P.honcho_cat_m, P.honcho_cat_f, P.fat_merchant_cat,
  P.corrupted_cat, P.taz_devil, P.fat_cat_boss
] }
```

---

### IX-D. NPC Characters (Goodfellas × Grease, New York dialect)

**Jimmy "Two-Tails" Carbonara** — Node CQ. Orange tabby. Fixer. Talks like he's been in the business forever. Quest-giver for the arc.  
> *"Listen. LISTEN. I'm gonna tell you somethin' and I'm only gonna say it once. The Taz Devil? It ain't a monster. It's a SITUATION. Two Honchos merge and boom — situation. You wanna help? You help by makin' sure they don't get within three blocks of each other. Capisce?"*

**Sandy "Scratchpad" Mewlino** — Node CQ (second visit). Tortoiseshell. Grease-queen energy. Runs the Fluffy faction. Unlocks after Quest 1.  
> *"Oh honey. You think this is about territory? This is about RESPECT. These boys think they can just MERGE whenever they want and turn into a tornado and that's somehow MY problem? I don't THINK so, sweetheart."*

**Don Fluffissimo** — Boss of the Fat Merchant Cats. Persian cat. Speaks very slowly. Very soft. Final boss of the Merchant Cat quest chain.  
> *"You come to MY quarter. In MY district. Without bringing fish. Without a proper introduction. That's... unfortunate."*

**Tommy "No-Ears" DeVito** — Honcho Cat enforcer. Aggressive. Unpredictable. Appears as a recurring hard encounter before becoming the Taz Devil boss fight.  
> *"You look at me? You look at me funny? I KNOW you looked at me funny. SANDY, DID THIS GUY JUST LOOK AT ME FUNNY?"*

**Kenickie "Clawnickie" Mancuso** — Beefy Tom lieutenant to Sandy. Good heart, bad impulse control.  
> *"The Cat-King shows up once every few months when enough Taz Devils pile up. Last time, three city blocks. THREE. Nobody's been back to Fishmonger's Row since."*

---

### IX-E. Quest Chain — "Nine Lives, Capisce?"

**Q-CAT-01: "The New Scratch" (intro)** — Level 3 entry  
- Trigger: First visit to CQ node; Jimmy Two-Tails auto-dialogue  
- Task: Kill 5× Stray Alley Cats AND 3× Fluffy Cats in the CQ terrain  
- Reward: 200gp + Tiny Fedora (equipped as trophy item, no stats)  
- Jimmy: *"You done good, kid. Real professional. The neighborhood's already calmer. Relatively. For cats."*  
- Completion flag: `quests['quest_cat_01'] === 'complete'`

**Q-CAT-02: "Beefy Business"** — Level 3  
- Trigger: Q-CAT-01 complete  
- Task: Kill 3× Beefy Toms; find the Cracked Claw drops (3 required)  
- Reward: 350gp + Sandy "Scratchpad" Mewlino unlocks at CQ  
- Sandy: *"Those guys were affiliated. You just stepped into something bigger than strays, sweetheart."*

**Q-CAT-03: "Honcho Problems"** — Level 4  
- Trigger: Q-CAT-02 complete  
- Task: Kill 1× Honcho Cat (Capo) AND 1× Boss Lady Honcho — do NOT let them merge  
- Mechanic note: If both are present in the same battle, a second-wave Taz Devil spawns (load `taz_devil` as a second encounter)  
- Reward: 500gp + Rhinestone Collar trophy  
- Jimmy: *"Kid, I told you. SEPARATE. You kill 'em SEPARATE. The merge thing is NOT a mechanic I enjoy."*

**Q-CAT-04: "When the Tornado Comes"** — Level 4, first Taz Devil fight  
- Trigger: Q-CAT-03 complete  
- Task: Kill 1× Taz Devil — Furball Tornado  
- Node battle: CQ battle slot loads `taz_devil`  
- Reward: 750gp + Furball Crown trophy item + Tommy "No-Ears" DeVito appears  
- Tommy: *"Oh you think you TOUGH now? You killed ONE Taz? ONE? There's THREE more building up past the fish market right now and when they merge — WHEN THEY MERGE, buddy — that ain't a Taz no more. That's a KING."*

**Q-CAT-05: "Fat Cats Don't Tip"** — Level 4, merchant cat arc  
- Trigger: Parallel to Q-CAT-04; Sandy gives this quest  
- Task: Kill 4× Fat Merchant Cats AND defeat Don Fluffissimo  
- Don Fluffissimo battle: `fat_cat_boss` — use existing hard-boss loading pattern  
- Reward: 900gp + The Don's Signet Ring (sell:35) + new vendor chip at CQ: "Kenickie's Black Market" (sells fish bait, minor potions at 10% discount)  
- Sandy: *"The merchants have been using Corrupted Cats as enforcers. Void-touched kitties doing dirty work for coin. I don't like it, and I DEFINITELY don't like it in my neighborhood."*

**Q-CAT-06: "The Cat-King Cometh"** — Level 5, epic finale  
- Trigger: Q-CAT-04 + Q-CAT-05 both complete  
- Task: Defeat The Cat-King — a three-Taz-merge tornado of flying fur and claws  
- Tommy: *"Three Taz Devils merged at the fish market. It's a KING. I'm not going anywhere near that. You're the hero. You go."*  
- Battle: Load `cat_king` from a new CQ-KING node or as a special battle on CQ node  
- Reward: 1,500gp + Cat-King's Claw Fragment + `couperiSongReceived` style flag `catKingDefeated:true`  
- Kenickie: *"Yo. YO. You actually killed the Cat-King. Nobody's done that. The community's gonna be talking about this for like... three whole days. Then they'll forget. They're cats."*  
- Jimmy (final): *"Listen. LISTEN. I want you to know something. You did good. Real good. You're like... honorary Ally Cat now. Don't tell nobody. It ain't a thing we advertise."*

---

### IX-F. Corrupted Cat Sub-Quest — "Void Strays" (parallel, optional)

- Trigger: Any time after Q-CAT-02; auto-appears on CQ board  
- Sandy: *"Something's wrong with the strays near the DF node. They're not just feral — they're WRONG. Wrong eyes. Wrong fur. Not touching anything from that block."*  
- Task: Kill 5× Corrupted Cats  
- Reward: 400gp + Void-Singed Whisker ×3  
- Ties into: DeFi Land (DF node) lore — Void pressure leaking into the Cat Quarter from the Unbanked Quarter next door

---

### IX-G. Insertion Spec for `roll2hit-v3.html`

**Layer tag:** Layer 44 — Ally Cat Arc

**Step 1 — MONSTER_POOL** (insert as new `// ── Ally Cat Arc ──` block after DeFi Land entries, ~line 4489):  
Add 10 new entries per IX-C table above.

**Step 2 — MONSTER_DROPS** (insert 10 drop entries after `rug_spider` drop, ~line 4895):  
Add drops per IX-C table above.

**Step 3 — WORLD_DB** (two changes):  
- Add 7 cat monsters to existing `alley` terrain monsters array  
- Add new `cat_quarter` terrain entry after `defi_land` (~line 5244)

**Step 4 — NODE_MAP** (insert new CQ node, num:77):
```js
CQ:{ num:77, code:'CQ', name:'cat_quarter', label:'The Cat Quarter',
     act:1, N:null, S:null, E:null, W:'SL',
     text:"...",  npc:'Jimmy Two-Tails',
     battle:{label:'Beefy Tom × 3', key:'beefy_tom', count:3},
     loot:'Tiny Fedora', sleep:false }
```
Wire: add `E:'CQ'` to SL node entry.

**Step 5 — NODE_COORDS**: Add `CQ:{r:4, c:17}` (one east of SL). *(Corrected from r:5 — SL is at r:4,c:16; r:5,c:17 conflicts with IN)*

**Step 6 — QUEST_DB**: Add 6 quest entries `quest_cat_01` through `quest_cat_06` plus `quest_cat_void` (Corrupted Cat sub-quest) using same structure as existing side quests.

**Step 7 — NPC_DIALOGUE**: Add `CQ` entry for Jimmy Two-Tails opening quote.

**Step 8 — NPC_DIALOGUES**: Add `jimmy`, `sandy_cat`, `don_fluffissimo` with hostile/neutral/friendly/dear states.

**Step 9 — HUNTING_GROUNDS**: Add `cat_quarter: { displayName:"The Cat Quarter" }`.

**Step 10 — MONSTER_POOL count update**: Header in `monsters.md` → 370 + 10 = 380 entries; source groups table gains new row "Ally Cat Arc | 10 | ⏳".

---

### IX-H. Documentation Updates Required on Completion

| File | Update |
|---|---|
| `monsters.md` | Add Ally Cat Arc section (10 entries); update header 370→380; update Source Groups |
| `story.md` | Add CQ node entry; add 6 quests; add Jimmy/Sandy/Don NPC profiles |
| `maps.md` | Add CQ to node grid (r:4, c:17); wire SL↔CQ connection |
| `world.md` | Add cat_quarter terrain entry; note Corrupted Cat/DF node overlap |
| `index.md` | Add CQ to node cross-reference; note cat community arc |
| `spec-engine.md` | Update Layer 44 entry (once implemented) |

---

### Future Feature Considerations

| # | Idea | Rationale | Status |
|---|------|-----------|--------|
| FC01 | Add a "Doc Health" badge to `index.md` — a one-line summary of how many of the 25 sync increments are complete | Makes the index a live dashboard, not just an archive | ⏳ |
| FC02 | `froberger-journal-all-entries.txt` should be compared entry-by-entry against `FROBERGER_JOURNAL` in HTML and discrepancies noted inline | The .txt predates several layers; drift is likely | ⏳ |
| FC03 | Consider splitting `mechanics.md` into `mechanics-combat.md` and `mechanics-economy.md` — it covers too many categories | At 14,377 lines the game is complex enough to warrant the split | ⏳ |
| FC04 | `lab-report-architecture-full.md` was written at 14,339 lines (2026-05-22), updated 2026-05-24 at 14,377 lines. Every function name is a claim about line numbers that may drift. Add a "spot-check date" policy — re-verify every 10 layers. | Architecture docs rot fastest | ⏳ |
| FC05 | A "two-way link" convention: every HTML constant should have a `// → doc: filename.md §Section` comment, and every doc section should have a `> HTML source: CONSTANT_NAME ~line N` line. | Currently one-directional and fragile | ⏳ |
| FC06 | Automated diff script: compare `MONSTER_POOL` key count in HTML vs `monsters.md` row count. Can be a 5-line shell script. | Prevents count drift without manual audit | ✅ Implemented in `plan.md §XIV-D5` (verification loop) and `§XIV-D1` (counting reference). Shell patterns documented for monster/quest/terrain/NPC/mission-bit counts. |

---

## VIII. Code Examples & Flowchart Prompts

> These are **session prompts** — each one is a ready-to-run instruction for a future coding session. Each prompt asks for: (1) working code excerpts from `roll2hit-v3.html`, (2) a named-milepoint flowchart, (3) CS-perspective commentary on data structures and assumptions. The goal is that a human reading the result can trace every execution path without opening the source file.

---

### PROMPT-FL1 — Story Navigation (Core Game Loop)

```
Read roll2hit-v3.html. Find and quote the exact code for:
  1. storyMove(dir) — the full function body
  2. The GATE_LOCKS check inside storyMove or called by it
  3. storyCorridorTravel(fromCode, destCode, dir) — first 30 lines

Then write a flowchart with named milepoints:
  MILEPOINT A: Player clicks a direction button (d-pad) → storyMove(dir) called
  MILEPOINT B: GATE_LOCKS.find() check — does the passage require an item?
  MILEPOINT C: item present → proceed; item absent → storyMsg() block message
  MILEPOINT D: Manhattan distance check — is this a corridor (≥2 cells) or direct?
  MILEPOINT E: Corridor path → storyCorridorTravel() cell-by-cell animation
  MILEPOINT F: Direct path → storyRender(node) called immediately
  MILEPOINT G: storyRender() → storyCheckQuests() → storyCheckJournal() → storyShowNpc()

CS assumptions to document:
  - NODE_MAP is a flat object keyed by node code string — O(1) lookup
  - GATE_LOCKS is a small array (~4 items) — linear scan is fine
  - Corridor distance uses Manhattan distance on {r,c} grid coordinates
  - storyMove() is the single authoritative navigation entry point — all d-pad clicks funnel here
```

---

### PROMPT-FL2 — Pre-Battle → Battle Mode → Outcome

```
Read roll2hit-v3.html. Find and quote:
  1. storyPreBattle(node) — full function
  2. storyCommitBattle() — full function
  3. storyApplyOutcome(won) — first 40 lines

Then write a flowchart with named milepoints:
  MILEPOINT A: Player clicks ⚔ Battle chip → storyPreBattle(node) called
  MILEPOINT B: _renderPreBatt() — populates monster stats, condition tabs, stealth tab
  MILEPOINT C: Player clicks ⚔ Start Battle → storyCommitBattle()
  MILEPOINT D: CONDITION_GOLD deducted; pendingBattle set on S_story
  MILEPOINT E: _storyRollInit() — d20 each side, ties to player; battleTurn set
  MILEPOINT F: _showBattleOverlay() — syncs hp, AC, weapon from S_story into S.char
  MILEPOINT G: [Battle Mode executes — separate engine]
  MILEPOINT H: storyApplyOutcome(won) called on return
  MILEPOINT I: won=true → _rollD100Loot() → _checkLevelUp() → storyShowOutcome()
  MILEPOINT J: won=false → _storyEnterDeathSaves() or storyRespawnFromCheckpoint()

CS assumptions:
  - S_story.pendingBattle is the shared-state handshake between Story and Battle modes
  - S.char.baseAc is snapshotted at battle start to prevent shield-equip exploits mid-battle
  - The two modes are NOT running concurrently — it is a modal state switch
```

---

### PROMPT-FL3 — Epic Battleground Quest Chain

```
Read roll2hit-v3.html. Find and quote:
  1. _storyEbNpcModal(ebCode) — full function
  2. The negotiation branch inside it (paymentFloor/paymentCeiling logic)
  3. _storyEbReturnBeat(ebCode) — full function

Then write a flowchart with named milepoints:
  MILEPOINT A: Player reaches EB node → NPC card shown via storyShowNpc()
  MILEPOINT B: Player clicks "Hear the Story" → _storyEbNpcModal(ebCode)
  MILEPOINT C: Modal shows: wound → opening → warning (3-step reveal)
  MILEPOINT D: Player clicks "Negotiate" → CHA check DC17 via d20+abilityMod(CHA)
  MILEPOINT E: Pass → paymentOpening raised toward paymentCeiling; logged to ebNegotiatedPayments
  MILEPOINT F: Fail → gut-punch narration; no payment increase
  MILEPOINT G: Player commits → storyEpicPreBattle(node) → DANGER:EPIC overlay
  MILEPOINT H: [Battle vs EPIC_BOSS_POOL boss]
  MILEPOINT I: Victory → storyApplyOutcome(won=true) → _storyEbReturnBeat(ebCode)
  MILEPOINT J: Return beat fires → ebReturnsCompleted[ebCode]=true; specialItem added to inventory

CS assumptions:
  - EB_NPC_DIALOGUE is keyed by 2-letter EB code — same key used in NODE_MAP
  - paymentFloor ≤ paymentOpening ≤ paymentCeiling — negotiation raises opening toward ceiling
  - ebNegotiatedPayments[ebCode] = gold amount is used by _curseScore() for ending calculation
```

---

### PROMPT-FL4 — NPC Dialogue Priority Chain

```
Read roll2hit-v3.html. Find and quote:
  1. _getNPCDialogue(npcKey) — full function
  2. _renderNpcCard(key, container) — first 40 lines
  3. _checkFrobergerTrace(npcKey) — full function

Then write a flowchart with named milepoints:
  MILEPOINT A: storyShowNpc(nodeCode) called on node entry or NPC button click
  MILEPOINT B: _getNPCDialogue(npcKey) begins priority chain
  MILEPOINT C: Priority 1 — does player have active quest for this NPC? → quest-active dialogue
  MILEPOINT D: Priority 2 — visit count % 3 === 0 AND fav≥1 → NPC_CROSS_REFS injection
  MILEPOINT E: Priority 3 — froberger trace available? → _checkFrobergerTrace() one-time memory
  MILEPOINT F: Priority 4 — default NPC_DIALOGUES[npcKey][favState][visitCount % 5]
  MILEPOINT G: _renderNpcCard() receives dialogue string → builds DOM card
  MILEPOINT H: Action buttons rendered (quest accept/complete, gift, favorability triggers)
  MILEPOINT I: _checkDearFriendUpgrade(key) — fav threshold check; fires if conditions met

CS assumptions:
  - visitCount is a per-NPC counter stored in S_story.npcVisits or similar — verify field name
  - NPC_DIALOGUES uses [npcKey][state][index] triple indexing — state = 0/1/2/3
  - Priority chain is checked sequentially — first match wins; no fallthrough
  - FROBERGER_TRACES are one-time: once fired, permanently consumed (flag set in S_story)
```

---

### PROMPT-FL5 — Loot Pipeline (d100 Drop System)

```
Read roll2hit-v3.html. Find and quote:
  1. _rollD100Loot() — full function
  2. _d100Result(r) — full function
  3. _autoSellDuplicates() — full function

Then write a flowchart with named milepoints:
  MILEPOINT A: storyApplyOutcome(won=true) → _rollD100Loot() called
  MILEPOINT B: Roll d100 → r value (1–100)
  MILEPOINT C: _d100Result(r) matches r against _D100_TABLE weight ranges
  MILEPOINT D: Result type: Minor Potion / Healing Potion / Greater / Superior / Spell Scroll / Gold / Dagger / Weapon
  MILEPOINT E: Weapon/Dagger path → _magicTierAllowed(magic) gate: tier capped by player level
  MILEPOINT F: Item pushed to S_story.inventory
  MILEPOINT G: _autoSellDuplicates() fires — finds duplicate potions/items; sells excess for gold
  MILEPOINT H: storyRenderInventory() called to refresh panel

CS assumptions:
  - _D100_TABLE is a weight array — each entry has a weight; cumulative weights sum to 100
  - Magic tier gate: tier 0 always allowed; tier 1+ requires minimum level (verify thresholds)
  - Duplicate detection: potions beyond a stack cap are auto-sold; weapons keep best-in-slot
  - _pendingDrop (monster-specific drop) is checked BEFORE _rollD100Loot() and takes priority
```

---

### PROMPT-FL6 — Level-Up Chain

```
Read roll2hit-v3.html. Find and quote:
  1. _checkLevelUp() — full function
  2. _showLevelUpModal(lvl) — first 40 lines
  3. _lu_applyGiftsAndFinish(lvl, hp) — full function

Then write a flowchart with named milepoints:
  MILEPOINT A: storyApplyOutcome() or XP award → _checkLevelUp() called
  MILEPOINT B: S_story.xp vs XP_LEVELS[S_story.level] — threshold crossed?
  MILEPOINT C: No → return. Yes → S_story.level++
  MILEPOINT D: _showLevelUpModal(lvl) — renders tattoo + choice: ASI roll OR gold gift
  MILEPOINT E: Non-ASI levels → _LEVEL_GOLD_GIFT[lvl] gold auto-awarded
  MILEPOINT F: ASI levels → _lu_refreshAsiBtns() → player picks from d6 roll results
  MILEPOINT G: Player clicks ASI choice → _lu_applyGiftsAndFinish(lvl, hp)
  MILEPOINT H: HP roll applied (bonusHpRoll for Champion feature levels)
  MILEPOINT I: Shield gift check — _LEVEL_SHIELD_GIFT[lvl] if applicable
  MILEPOINT J: Tattoo pushed to S_story.tattoos; levelUpLog entry recorded
  MILEPOINT K: storyUpdateStatus() + storyRenderCharSheet() refresh

CS assumptions:
  - XP_LEVELS is a 20-entry array; index = level-1; check XP_LEVELS[level] to know next threshold
  - Level-up is a modal interrupt — game is paused until player confirms
  - Multiple levels can be gained from one battle (rare); _checkLevelUp() must loop until stable
  - tatoos[] is append-only; character sheet renders all accumulated tattoos in reverse order
```

---

### PROMPT-FL7 — Ending Chain (Covenant Ceremony)

```
Read roll2hit-v3.html. Find and quote:
  1. storyCheckVictory(node) — first 50 lines
  2. _missionComplete() — full function
  3. _curseScore() — full function
  4. _covenantStanding() — full function

Then write a flowchart with named milepoints:
  MILEPOINT A: Player enters CO node with 7 shards → storyCheckVictory('CO') called
  MILEPOINT B: BOSS_COMMANDER_AUROS fight required first → storyPreFinalBattle()
  MILEPOINT C: Boss defeated → storyCheckVictory() re-fires
  MILEPOINT D: _missionComplete() — checks 12 mission bits; returns true if ≥8 set
  MILEPOINT E: _curseScore() — computes integer from EB negotiations, pit wins, quest completion
  MILEPOINT F: _covenantStanding() — maps score to: Covenant Keeper / Standard / Groundhog Day / Mixed
  MILEPOINT G: Covenant ceremony SVG sigil animation fires
  MILEPOINT H: _buildEpilogueScroll() — per-NPC epilogue text assembled from npcFavorability states
  MILEPOINT I: _buildSweelinckNamingSequence() — Sweelinck names the player based on run
  MILEPOINT J: Victory modal shown with ending variant + "Sweelinck's Last Question"
  MILEPOINT K: Player clicks "New Game+" → storyNewGamePlus() → preserve fav+perks → reset

CS assumptions:
  - storyCheckVictory() guards: shard count must be 7 AND Auros must be defeated
  - _curseScore() is negative for engaged play (negotiated EB payments lower it) — lower = better ending
  - _missionComplete() uses boolean AND of 12 independent tracking flags in S_story
  - NG+ run counter increments (ngPlusRun++) but npcFavorability survives — NPCs remember
```

---

### PROMPT-FL8 — Rest & Void Tide Pressure

```
Read roll2hit-v3.html. Find and quote:
  1. storySleep(node) — full function
  2. storyConfirmSleep() — full function  
  3. storyCheckVoidTide() — full function
  4. storyCheckMissedSleep() — full function

Then write a flowchart with named milepoints:
  MILEPOINT A: Player clicks 🛌 Rest → storySleep(node) — sleep confirm prompt shown
  MILEPOINT B: storyConfirmSleep() — verifies node has sleep:true, deducts sleepCost gold
  MILEPOINT C: S_story.day++ → storyCheckVoidTide() called
  MILEPOINT D: VoidTide check: day ∈ [3,7,14,21,28,35,42]? → S_story.voidPressure++, narrative event
  MILEPOINT E: VoidPressure === 10 → storyVoidDefeat('void') — immediate game over
  MILEPOINT F: Day === 49 AND shards < 7 → storyVoidDefeat('time') — immediate game over
  MILEPOINT G: storyCheckMissedSleep() — were any inns skipped? → DIS flag on next battles
  MILEPOINT H: HP recovery: sleptAtNodes[code] first time → 2×d10+CON; revisit → 1×d10+CON; min 50% hpMax
  MILEPOINT I: shortRests reset to 3; sleptAtNodes[code]=true; storyAutoSave() fires

CS assumptions:
  - Void Tide events are triggered by sleep, not real-time — skipping sleep delays the pressure
  - Day 49 check fires on sleep attempt — player can stay on day 48 indefinitely (no time pressure from waiting)
  - DIS from missed sleep is tracked as a boolean flag, cleared after the affected battle
  - Boyscout Token (first-sleep-at-node double roll) is the primary HP recovery mechanism, not potions
```

---

### PROMPT-FL9 — Corridor + Hunt Mode

```
Read roll2hit-v3.html. Find and quote:
  1. storyToggleHunt() — full function
  2. triggerCorridorEncounter(terrain, destCode, questHunt) — full function
  3. _weightedMonsterPick(terrain) — full function
  4. _stalkedMonsterPick(terrain) — full function

Then write a flowchart with named milepoints:
  MILEPOINT A: Player toggles Hunt Mode → storyToggleHunt() → S_story.huntMode = !huntMode
  MILEPOINT B: Player moves between nodes → storyCorridorTravel() begins
  MILEPOINT C: Each corridor step: roll for encounter? → triggerCorridorEncounter()
  MILEPOINT D: huntMode=true → _stalkedMonsterPick(terrain) — filters to quest-target keys
  MILEPOINT E: huntMode=false → _weightedMonsterPick(terrain) — notoriety-weighted random pick
  MILEPOINT F: Encounter fires → storyPreBattle() with corridor-picked monster
  MILEPOINT G: _setActivePath(from, to, dir) marks gold path on map overlay post-travel

CS assumptions:
  - Hunt Mode is a toggle, not a one-shot — persists until player toggles off
  - _getQuestTargetKeys() cross-references QUEST_DB active quests to find valid monster keys
  - Corridor encounter probability is per-step (each grid cell is one step) — longer corridors = more chances
  - _notoriety() derives difficulty weighting from recent battle history (kill streak drives harder monsters)
```

---

### PROMPT-FL10 — Vendor Economy

```
Read roll2hit-v3.html. Find and quote:
  1. storyRenderVendor() — first 40 lines
  2. storyBuyShield(tier) — full function
  3. _magicTierAllowed(magic) — full function
  4. _renderPachelbelSpecials() — first 30 lines

Then write a flowchart with named milepoints:
  MILEPOINT A: Player clicks Vendor button → storyVendorToggle() → storyRenderVendor()
  MILEPOINT B: storyRenderVendor() checks VENDOR_NODES — is current node a vendor?
  MILEPOINT C: Node BA → _renderPachelbelSpecials() fires (fav-gated + act-gated items)
  MILEPOINT D: _renderVendorShields() — SHIELD_ITEMS filtered by _magicTierAllowed(tier)
  MILEPOINT E: Player buys shield → storyBuyShield(tier) → gold deducted → added to inventory
  MILEPOINT F: _magicTierAllowed(magic) enforces minLevel gates (tier gate prevents over-powered early equip)
  MILEPOINT G: storyUpdateStatus() refreshes gold display

CS assumptions:
  - VENDOR_NODES is a Set — O(1) membership test
  - _magicTierAllowed() maps magic bonus (0–4) to minimum player level — tier 0 always allowed
  - Pachelbel specials (BA node) are fav-gated: require npcFavorability[pachelbel] ≥ threshold
  - Vendor does not restock or change prices — prices are constants in SHIELD_ITEMS/POTION_TIERS
```

---

### PROMPT-FL11 — Death Save Sequence

```
Read roll2hit-v3.html. Find and quote:
  1. _storyEnterDeathSaves() — full function
  2. _storyRollDeathSave() — full function
  3. _storyDeathSaveCrawl() — full function
  4. _storyDeathSaveFall() — full function

Then write a flowchart with named milepoints:
  MILEPOINT A: Player HP hits 0 in Story Battle → _storyEnterDeathSaves() called
  MILEPOINT B: Death save overlay shown — 3 success pips / 3 fail pips
  MILEPOINT C: Player clicks Roll → _storyRollDeathSave() → d20 vs DC10
  MILEPOINT D: d20=20 (nat 20) → instant crawl (counts as 2 successes)
  MILEPOINT E: ≥10 → success pip; <10 → fail pip
  MILEPOINT F: 3 successes → _storyDeathSaveCrawl() → HP restored to 1; battle exits
  MILEPOINT G: 3 failures → _storyDeathSaveFall() → storyRespawnFromCheckpoint()
  MILEPOINT H: Indomitable (L9+): 1 reroll available per long rest via indomitableCharges

CS assumptions:
  - Death saves are D&D 5e standard: 3 successes = stable, 3 failures = death (respawn here)
  - Unlike Battle Mode death saves, Story Mode death saves do NOT end the run — checkpoint respawn
  - indomitableCharges is restored by long rest (sleep) only, not short rest
  - _storyDeathSaveFall() calls storyRespawnFromCheckpoint() which sets currentCode to checkpointNode
```

---

### PROMPT-CONST — Core Constants Architecture

```
Read roll2hit-v3.html. For each constant below, quote the first 5 lines of its definition and note its approximate line number:

  NODE_MAP, CORRIDOR_CELLS, GATE_LOCKS, NODE_COORDS, HUNTING_GROUNDS,
  MONSTER_POOL, MONSTER_DROPS, EPIC_BOSS_POOL, WORLD_DB, EB_NPC_DIALOGUE,
  EB_STORY_ITEMS, FROBERGER_JOURNAL, SWEELINCK_DIALOGUE_VARIANTS,
  NPC_DIALOGUES, BIRKA_NPC_PROFILES, NPC_CROSS_REFS, FROBERGER_TRACES,
  NPC_FAREWELLS, NPC_ACT_THREE_LINES, QUEST_DB, POTION_TIERS, SHIELD_ITEMS,
  DAGGER_ITEMS, WEAPON_ITEMS, FIGHTER_FEATURES, XP_LEVELS, _D100_TABLE,
  _ASI_TABLE, _LEVEL_GOLD_GIFT, _S_DEFAULTS, BOSS_COMMANDER_AUROS, VENDOR_NODES

Then write a one-sentence "contract" for each constant:
  - What it IS (data type / shape)
  - What it OWNS (what it is the authoritative source for)
  - What READS it (which functions consume it)
  - What WRITES it (if mutable — most constants are read-only; _S_DEFAULTS returns a new mutable object)

CS note: The codebase uses const-keyed plain objects as immutable databases. There is no ORM, no class hierarchy. Data flows from constants → functions → S_story (mutable state) → DOM. The only shared mutable state is S_story and S (Battle Mode state). All other mutation is DOM-only.
```

---

### PROMPT-STATE — S_story State Machine

```
Read roll2hit-v3.html. Find _S_DEFAULTS() (~line 7840). Quote the full function body.

Then write a state diagram:
  - STATES: new_game | in_story | in_battle | in_vendor | in_sleep_confirm | in_death_saves | victory | void_defeat | time_defeat | ng_plus
  - TRANSITIONS:
    new_game → in_story: storyNewGame() / storyLoadContinue()
    in_story → in_battle: storyCommitBattle()
    in_battle → in_story: storyApplyOutcome(won)
    in_story → in_vendor: storyVendorToggle()
    in_vendor → in_story: storyVendorToggle() again
    in_story → in_sleep_confirm: storySleep(node)
    in_sleep_confirm → in_story: storyConfirmSleep()
    in_story → in_death_saves: HP hits 0
    in_death_saves → in_story: _storyDeathSaveCrawl()
    in_death_saves → in_story: _storyDeathSaveFall() → checkpoint
    in_story → victory: storyCheckVictory() passes all gates
    victory → ng_plus: storyNewGamePlus()
    in_story → void_defeat: voidPressure reaches 10
    in_story → time_defeat: day 49 sleep attempted

CS assumptions:
  - There is no explicit state enum — state is implied by which DOM overlays are visible and which S_story fields are set
  - S_story.pendingBattle being non-null signals "in_battle prep" state
  - The two-mode architecture (Battle + Story) means "in_battle" is a foreign mode — S_story is paused while S (Battle) runs
  - All state transitions are synchronous except corridor travel (which uses setTimeout for animation)
```

---

## Section X — The Torment Nexus Overture (Layer 46, PLANNED)

> **Hook:** At HM — Frequency Row (the DeFi Land bar counter, jury-rigged from a ration crate and a neon strip), the player overhears two cyberpunk regulars having the most confident conversation in the room. They have read every cautionary sci-fi novel and understood zero of them. They are taking notes.

---

### X-A. The Characters

**KERN** — "Visor"  
Mirrored ski goggles over a completely ordinary face. Speaks in rapid-fire bursts with maximum conviction. Treats every citation as endorsement. Has a notebook labeled RAD IDEAS (DO NOT READ) that he reads from constantly.

**SABLE** — "Future-Proof"  
Wears a t-shirt reading FUTURE PROOF with FUTURE crossed out in marker. Completes other people's sentences wrong. Speaks exclusively in first drafts. Never finishes a sentence that doesn't end in an upvote.

---

### X-B. The Overheard Conversation

> *Two figures at the Frequency Row counter. Visor is face-down in a notebook. Future-Proof is nodding along to something that hasn't been said yet.*

**KERN:** "Yo. Yo yo yo."

**SABLE:** "Rad."

**KERN:** "You know what the Dark Knight did. That thing. The specific thing. The thing that made The Trusted Friend quit."

**SABLE:** "The sonar."

**KERN:** "The sonar! Every device in the city. Triangulated. City-wide listening grid. All of it."

**SABLE:** "Good-guy detective stuff. Righteous."

**KERN:** "Exactly. We should do that."

**SABLE:** "Next project. Right after the Torment Nexus."

**KERN:** "From the hit book *Don't Create The Torment Nexus.*"

**SABLE:** "Classic. Chapter 7. The specs."

**KERN:** "They really laid it out."

**SABLE:** "Author was so helpful."

**KERN:** "So rad."

**SABLE:** "Upvote."

**KERN:** "Cool cool cool."

*[both nod]*

**KERN:** "We should build the sonar first actually."

**SABLE:** "Either order. Flexible."

**KERN:** "Upvote."

---

### X-C. Player Interaction Options

Three triggers appear when the player enters HM and the quest flag `nexusQuestSeen` is false:

| Button | Text | Effect |
|--------|------|--------|
| [Listen] | "Stay quiet. Keep listening." | Sets `nexusQuestSeen:true`. Journal entry Q-NEXUS-00 unlocked. No quest started. |
| [Ask] | "What exactly are you building?" | Triggers extended dialogue (see X-D). Starts Q-NEXUS-01. |
| [Warn] | "That book is a warning. Not a manual." | Skips to the confrontation arc (see X-E). Starts Q-NEXUS-02. |

---

### X-D. Extended Dialogue (Q-NEXUS-01 — "Blueprints")

**KERN:** "What are we building?"

**SABLE:** "Rad question."

**KERN:** "The Torment Nexus. Classic infrastructure."

**SABLE:** "From the literature."

**KERN:** "The author spent like 400 pages describing it."

**SABLE:** "Extremely detailed."

**KERN:** "We took notes."  
*(holds up notebook labeled RAD IDEAS (DO NOT READ))*

**SABLE:** "The warning parts were also helpful actually."

**KERN:** "Yeah the warning parts had the most detail."

**SABLE:** "Really hammered it home."

**KERN:** "Really painted a picture."

**SABLE:** "Very vivid."

**KERN:** "Upvote the author."

**SABLE:** "Upvote."

> *They both look at you, waiting.*

Player chooses: [Say nothing] or [Explain what a warning is].

---

### X-E. The Confrontation Arc (Q-NEXUS-02 — "Creative Literacy")

> *You say: "That book is a warning. Not a manual."*

**SABLE:** "...Oh."

**KERN:** "Wait."

*[pause]*

**KERN:** "So when the detective used the city-wide sonar and The Trusted Friend quit..."

**SABLE:** "...that was bad."

**KERN:** "That was the whole point."

**SABLE:** "The author was not impressed by the sonar."

**KERN:** "The author was concerned about the sonar."

**SABLE:** "The author wrote 80,000 words about how the sonar was a problem."

**KERN:** "Because the detective had all the power."

**SABLE:** "And he decided who was a criminal."

**KERN:** "And no one could opt out."

**SABLE:** "...Rad."

*[longer pause]*

**KERN:** "The Torment Nexus book."

**SABLE:** "Yeah."

**KERN:** "The title."

**SABLE:** "Don't Create The Torment Nexus."

**KERN:** "The title was also a warning."

**SABLE:** "That's two warnings."

**KERN:** "The title and the entire book."

**SABLE:** "Very consistent messaging."

*[both look at the notebook]*

**KERN:** *(quietly)* "We should probably not build the Torment Nexus."

**SABLE:** "Upvote."

**KERN:** "Cool cool cool."

> *Kern closes the notebook. Something shifts. Not much — they are still themselves — but they are slightly less dangerous than they were five minutes ago. Sable peels the neon sticker off the notebook that said FUTURE PROOF and drops it in the gutter.*

**Quest Complete: "Creative Literacy" — Kern hands you a folded printout. It is a 2.7K-upvote Reddit comment explaining why tech companies build the things the books told them not to build. He has underlined nothing. He has not yet read it. But he kept it.**

**Reward:** `creative_literacy_token` — *A folded printout, upvotes still visible in the corner. Worth more than it looks. Someone kept this for a reason.*

---

### X-F. Item Definition

```js
// MONSTER_DROPS entry (or as a static loot at HM after quest complete)
creative_literacy_token: { name:'Creative Literacy Token', icon:'📄', sell:27 }
```

*(Sell value 27 = 2.7K upvotes / 100. This is intentional.)*

---

### X-G. Journal Entry — Q-NEXUS-00 (Read-Aloud, unlocked by [Listen])

> *Two people at a bar counter, taking notes on a book called Don't Create The Torment Nexus. They are on Chapter 7. They have underlined the parts that describe the Torment Nexus in the most detail. They believe the author was being helpful. The mirrored-visor one says "rad" every 30 seconds. The other one nods. They are having a great time. You say nothing. You keep walking.*

---

### X-H. Quest Flags

| Flag | Type | Set When |
|------|------|----------|
| `nexusQuestSeen` | bool | Player enters HM for the first time |
| `nexusQ01Active` | bool | [Ask] chosen |
| `nexusQ02Active` | bool | [Warn] chosen |
| `nexusQ02Complete` | bool | Confrontation arc reaches resolution |
| `creativeLiteracyToken` | bool | Reward claimed |

---

### X-I. Node Assignment

- **Location:** HM — Frequency Row (existing node, R03,C17)
- **NPC addition:** KERN + SABLE appear as a joint NPC entry (`npc:'Kern & Sable'`) at HM, replacing the bare "dead-end east of DF" description with a full bar scene
- **No new node required** — HM gains NPC dialogue and a quest trigger; its terrain and connections stay the same

---

### X-J. Documentation Updates

| File | Change |
|------|--------|
| `world.md` | Update HM description: add Kern & Sable, bar counter, quest trigger |
| `story.md` | Add Q-NEXUS-00 through Q-NEXUS-02 dialogue |
| `monsters.md` | Add `creative_literacy_token` to drop table |
| `plan.md` | Mark X-A through X-J complete after implementation |

---

## Section XI — Sync Pass 2: Two-Way Consistency Pass

> **Directive:** Every item in the docs must trace to `roll2hit-v3.html` (source of truth). Every item in the HTML must have a home doc. Planned features (Cat Arc, Torment Nexus) get PLANNED stubs in the relevant docs. World map must be described consistently across all files that reference it. One "continue" per increment.

---

### XI-A. Master Cross-Reference Table

> Which game element lives in which doc. This table is the spine of the consistency pass — any gap is an SP2 item.

| Element | HTML const / function | Primary doc | Secondary docs | Status |
|---------|----------------------|-------------|----------------|--------|
| NODE_MAP (76 nodes, connections) | `NODE_MAP` | `maps.md` | `world.md`, `story.md`, `spec-engine.md` | ✅ synced |
| NODE_COORDS (76 grid positions) | `NODE_COORDS` | `maps.md` | — | ✅ synced |
| CORRIDOR_CELLS (sparse grid) | `CORRIDOR_CELLS` (computed) | `maps.md` | — | ✅ synced |
| HUNTING_GROUNDS (64 terrains) | `HUNTING_GROUNDS` | `monsters.md` | `world.md` | ✅ synced |
| MONSTER_POOL (370 entries) | `MONSTER_POOL` | `monsters.md` | `spec-world.md`, `spec-engine.md` | ✅ synced |
| WORLD_DB (66 terrain entries) | `WORLD_DB` | `monsters.md` | `spec-world.md` | ✅ synced |
| NPC_DIALOGUES (6 profiles × 4 states × 5 fields) | `NPC_DIALOGUES` | `story.md` | `lab-report-npc-dialogue-system.md` | ✅ synced |
| EB_NPC_DIALOGUE (Q52–Q71, 5 fields each) | `EB_NPC_DIALOGUE` | `story.md` | `lab-report-epic-battlegrounds.md` | ✅ synced |
| FROBERGER_JOURNAL (41 entries) | `FROBERGER_JOURNAL` | `froberger-journal-all-entries.txt` | `story.md` node texts | ✅ verified S23 |
| NPC_CROSS_REFS (17 lines across 6 NPCs) | `NPC_CROSS_REFS` | `world.md` | `lab-report-web-of-connections.md` | ✅ synced — count corrected 14→17 (SP2) |
| FROBERGER_TRACES (6 NPCs) | `FROBERGER_TRACES` | `world.md` | `lab-report-web-of-connections.md` | ✅ synced |
| QUEST_DB | `QUEST_DB` | `world.md` | `story.md` | ✅ synced |
| FIGHTER_FEATURES | `FIGHTER_FEATURES` | `mechanics.md` | — | ✅ synced |
| CONDITION_ITEMS | `CONDITION_ITEMS` | `mechanics.md` | — | ✅ synced |
| SHIELD_ITEMS (6 tiers) | `SHIELD_ITEMS` | `mechanics.md` | `spec-engine.md` | ✅ synced |
| DAGGER_ITEMS (4 offhand) | `DAGGER_ITEMS` | `mechanics.md` | `spec-engine.md` | ✅ synced |
| _S_DEFAULTS (~107 fields) | `_S_DEFAULTS()` | `spec-engine.md` | `lab-report-architecture-full.md` | ✅ synced |
| EPIC_BOSS_POOL (20 EBs) | `EPIC_BOSS_POOL` | `combat.md` | `lab-report-epic-battlegrounds.md` | ✅ synced |
| _curseScore() formula | `_curseScore()` | `lab-report-endings-and-echoes.md` | `story.md` endings section | ✅ synced |
| NPC_NG_PLUS_GREETINGS | `NPC_NG_PLUS_GREETINGS` | `lab-report-endings-and-echoes.md` | — | ✅ synced |
| storyFishing() / fish pool | `storyFishing()` | `lab-report-fish-with-dnd.md` | `monsters.md` (fish_01–fish_20) | ✅ synced |
| **Fishing Overhaul (Section XII)** | plan.md only — PLANNED | `plan.md` §XII | BAIT_TABLES const / BAIT_FISH_POOL / YL isFishingLake flag / fishing modal / tournament / YL+YC nodes | ✅ Implemented |
| **Luck Stat (Section XIII)** | plan.md only — PLANNED | `plan.md` §XIII | `_calcLuck()` geometric mean / `_luckMod()` / corridor encounter rate / initiative bonus / character sheet display | ✅ Implemented |
| **Project Directive** | — | `index.md` (top) | Rule: Adding = Planning in plan.md; Implementing = Code + markdown sync | ✅ added SP2-11 |
| **Cat Arc (Section IX)** | plan.md only — PLANNED | `plan.md` | ✅ PLANNED stubs added: CQ node in `maps.md`; The Cat Quarter in `world.md`; Q-CAT-01–06 in `story.md` | ✅ SP2-05–07 |
| **Torment Nexus (Section X)** | plan.md only — PLANNED | `plan.md` | ✅ PLANNED stubs added: Kern & Sable in `world.md`; Q-NEXUS-00–02 in `story.md` | ✅ SP2-08–09 |
| World map grid (26×16) | `NODE_COORDS` + corridor calc | `maps.md` | ✅ YL/YC added to maps.md (grid + legend + network + coords); CQ PLANNED node stubbed; all docs consistent | ✅ SP2-02–04 |
| **Function Coverage Table** | all ~169 named functions | `plan.md` §F1–F6 | ✅ All 169 functions verified documented in their target .md files; F4-ext/F6-ext sections added for level-up + Battle Mode utilities; `_renderSboShield()` + `_storyUnequipShield()` added to `combat.md` | ✅ SP2 complete |
| **World Creator Wizard (§XIV)** | Quest -1 / Level 21 undefined / MIT fork | `plan.md §XIV` | Level 20 "The Open Door" sweelinck-variant block at CO; console completion path; grep reference table | ✅ Implemented |
| **NG+ Remembrance Layer (§XV)** | ngPlusRun ≥ 1 / Entry 42 / "The Next Froberger" | `plan.md §XV` | ✅ Implemented 2026-05-25: NPC_NG_MEMORY_LINES, Entry 42 CI modal, journal Entry 42 append, Q-NG-01/02/03, CO Froberger letter, storyNewGamePlus preservation | ✅ Implemented |
| **Weimar Scholar Gate (§XVI)** | Ivory Circle / Tomes / `scholars_guard` / First Researcher | `plan.md §XVI` | ✅ Implemented 2026-05-25: scholars_guard, 3 tomes, Isolde/Benedikt NPCs, Q-WM-01–04, archive modal, reading circle, _tomeBonuses() | ✅ Implemented |
| **Void Archaeology (§XVII)** | Antecedent Containment / Constructor's Log / five-node overlay / four-author chain | `plan.md §XVII` | ✅ Implemented 2026-05-25: 5 [INVESTIGATE] sites, Q-VA-01–04, Constructor's Log (4th archive doc), MT tunnel, CO fifth ending + "What was inside the cage?" Sweelinck question | ✅ Implemented |
| **Living World (§XVIII)** | J1–J7 junction vignettes / Road Companion (Acts II–VI) | `plan.md §XVIII` | `JUNCTION_VIGNETTES` const (J1–J7+RD) / `COMPANION_LINES` const (Acts 2–5) / storyRender junction block | ✅ Implemented |
| **Tilbury Harbor Arc (§XIX)** | Rennau / Vonn / Q-TL-01–03 / ship_manifest / Ori survivor | `plan.md §XIX` | Rennau/Vonn NPCs / Q-TL-01–03 / Harbor Board / Harrow Manifest / Ori Account / SF+TL render blocks | ✅ Implemented 2026-05-25 |
| **Visby Underground (§XX)** | Solvak / Yva / Q-VS-01–03 / hollow_hands_guard / Void shaman shadow | `plan.md §XX` | ✅ Implemented 2026-05-25: hollow_hands_guard, Solvak/Yva NPCs, Q-VS-01–03, Harbor→Visby cross-ref, vsShamanKnown flag | ✅ Implemented |
| **Void Shaman (§XXI)** | The Warden / void_shaman boss / warden_token / combat+persuasion paths / Hollow Hands resolution | `plan.md §XXI` | `story.md` §XXI MT tunnel encounter; both outcome texts; Benedikt callback | ✅ Implemented 2026-05-25 |
| **Codex Shard Origins (§XXII)** | 7 shard_note items / named placers / flag-gated variants / journal reward | `plan.md §XXII` | `story.md` Shard Origins section; `world.md` placer name notes | ✅ Implemented |
| **Inn Dreams (§XXIII)** | INN_DREAMS const / 4 inns × 3 base variants / flag-gated replacements | `plan.md §XXIII` | `story.md` Inn Dreams section | ✅ Implemented |
| **Pressure Cascade (§XXIV)** | voidPressure threshold events (3/6/9) / void-touched monsters / NPC pressure lines / mercy counter | `plan.md §XXIV` | `story.md` Void Tide Events; `world.md` Void-Touched Monsters note | ✅ Implemented |
| **Homecoming (§XXV)** | 6 one-time Act VIII farewell beats / Brynn's Loaf / Champion's Tincture / Pachelbel's Sketch / 6 new flags | `plan.md §XXV` | `story.md` Act VIII Farewell Beats | ✅ Implemented |
| **Wandering Merchant (§XXVI)** | Corelli — 5 appearances Acts II–VIII / purchase-gated fav / 5 unique items / Scholar King courier reveal / `last_cipher` cross-ref §XVI–§XVII | `plan.md §XXVI` | `story.md` Corelli NPC section; `CORELLI_ITEMS` + `CORELLI_APPEARANCES` consts; RD node added | ✅ Implemented 2026-05-25 |
| **Town Crier (§XXVII)** | `TOWN_CRIER_LINES` const / priority-selector / inn rest rumor line / 56 act-cycling lines + critical/tension/quest/NPC tiers | `plan.md §XXVII` | `story.md` Town Crier note; no new state flags | ✅ Implemented |
| **Froberger Memorial (§XXVIII)** | `FROBERGER_MEMORIAL_TEXT` object / 4-layer plaque text / memorial book entries / [Leave Flowers] 10gp action / `storyShowFrobergerMemorial()` / CI `[Examine Memorial]` button | `plan.md §XXVIII` | `story.md` §XXVIII | ✅ Implemented |
| **Pit Championship (§XXIX)** | `PIT_CHAMPION_OGUNDIMU` const / `_showPitChampionOffer()` / `_startPitChampionBattle()` / `_onPitChampionWin()` / `_onPitChampionLoss()` / championship log entry / `crovChampionLineDelivered` pool injection / §XXV farewell function-text branch / death-save fall bypass | `plan.md §XXIX` | `story.md` §XXIX | ✅ Implemented |
| **Entry 41 Echo (§XXX)** | `S49_BRYNN_SCENE` const / `S49_SWEELINCK_SCENE_BASE` + `_getS49SweelinckScene()` (NG+ closing variant) / full scene text replaces stubs at IN (`s49BrynnDelivered`) and SQ (`s49SweelinckDelivered`) / Covenant Keeper intro patch in victory screen (`s49SweelinckDelivered` branch) | `plan.md §XXX` | `story.md` §XXX | ✅ Implemented |
| **Joint Witness + Map Caption (§XXXI)** | `S54_JOINT_MOMENT` const / CI scene (act≥7, yael+brynn Friendly gate, `s54JointMomentDelivered`) / TV Quill+Brynn stub split to `s54QuillBrynnDelivered` / SQ map stub split to `s55SqMapLineDelivered` / S55 caption in `_renderFinalMap()` (fade-in at +400ms, base + Sweelinck variant, `s55MapLineDelivered`) | `plan.md §XXXI` | `story.md` §XXXI | ✅ Implemented |
| **Two Intelligence Feeds (§XXXII)** | S8: three-observation Varga BA arc / pigeon direction / Pachelbel tell (+15gp) — all pre-existing at BA / S29: `S29_AUROS_THEORY` const / `_getNPCDialogue` stub replaced / CY node render trigger (frobergerLastEntryRead + bruhns Dear Friend + `!s29LineDelivered`) | `plan.md §XXXII` | `story.md` §XXXII | ✅ Implemented |
| **Archive and Tools (§XXXIII)** | S7: CI Blue Shutters three-state pre-existing / Survey delivery +40gp (was 0gp) + S29 cross-ref line added / S46: Raison's Tools fixed to +30gp + two-message spec / `PACHELBEL_LEDGER` const (entries 2+3) / [Read Ledger] button at BA Dear Friend / `undercitySurveyDelivered` used in place of spec's `surveyDeliveredToAuros` | `plan.md §XXXIII` | `story.md` §XXXIII | ✅ Implemented |
| **Couperin Ledger (§XXXIV)** | `quills_lute` quest item / `QUEST_DB` entry / Beat 2 TV render (+40gp, couperiSongReceived, quillQuestComplete, Dear Friend check) / Beat 3 TV render (couperiDebtDegraded, L44-E NPC_DIALOGUES injection) / Beat 1 BA/SH lute handoff (Pachelbel) / Act VIII BA farewell Pachelbel note branch / no new flags — all pre-exist | `plan.md §XXXIV` | `story.md` §XXXIV | ✅ Implemented |
| **First Inn Light (§XXXV)** | `BRYNN_KEEPER_STORY` const / Beat 1 inquiry (fav_brynn ≥ 1, Act II+, + follow-up) / Beat 2 choice block (fav_brynn ≥ 2, 'keep'/'rest') / IN lamp ambient line (always) / §XXV farewell four-branch table / TC_BRYNN_LAMP crier line (§XXVII) / 3 new flags (brynnKeeperStoryTold, brynnLightChoiceMade, brynnLightKept) | `plan.md §XXXV` | `story.md` §XXXV; `BRYNN_KEEPER_STORY` const | ✅ Implemented |
| **Epilogue Integration Layer (§XXXVI)** | `ARC_EPILOGUE_CONDITIONS` const (14 entries: §XXIX pit champ / §XXX s49 both+solo / §XXXI s54 / §XXXII s8+s29 / §XXXIII archive+survey / §XXXIV lute arc / §XXXV lamp arc) / `_buildEpilogueScroll()` 4-line patch / scroll ordering doc / no new flags | `plan.md §XXXVI` | `ARC_EPILOGUE_CONDITIONS` const; `_buildEpilogueScroll()` | ✅ Implemented |
| **Commander Bruhns CO Scene (§XXXVII)** | `BRUHNS_CO_SCENE` const (friendly / dearFriend / dearFriendWithTheory) / CO render patch (after NODE_ARRIVAL_QUOTES, before fight chip) / fav 1 brief + fav 2 full Circle/Codex motivation / s29 addendum / 1 new flag (`bruhnsCoSceneDelivered`) | `plan.md §XXXVII` | `BRUHNS_CO_SCENE` const; CO storyRender patch | ✅ Implemented |
| **Heartwood Letter (§XXXVIII)** | `BRYNN_HEARTWOOD_SCENE` const (friendly brief / dearFriend letter-read) / IN render patch / Entry 7 cross-ref / Froberger's Last Note cross-ref / §XXXV lamp cross-ref | `plan.md §XXXVIII` | `BRYNN_HEARTWOOD_SCENE` const; IN storyRender patch | ✅ Implemented |
| **Yael's Named Report (§XXXIX)** | `YAEL_NAMED_REPORT_SCENE` const (setup + decision + two choices) / CI render patch (fav 2, Act VI+, yaelEscortUsed) / `YAEL_PATROL_NODES` SW addendum / riot backstory / §XXXVI epilogue condition (`yaelNamedReportDelivered`) / 1 new flag | `plan.md §XXXIX` | `YAEL_NAMED_REPORT_SCENE` const; CI+SW storyRender patch | ✅ Implemented |

---

### XI-B. SP2 Increment Queue

> Say "continue" for each increment. Each one is a single file comparison and edit.

| # | File(s) | HTML source | Task | Status |
|---|---------|-------------|------|--------|
| SP2-01 | `index.md` | — | Fix stale "42 nodes" (line 103) and "329 monsters" (lines 71, 116) in blurb descriptions | ✅ |
| SP2-02 | `maps.md` vs HTML | `NODE_COORDS` | World map consistency: verify all 76 node grid positions match `NODE_COORDS`; spot-check 10 nodes; fix any discrepancies | ✅ |
| SP2-03 | `world.md` vs HTML | `NODE_MAP` | World map consistency: verify every node code (76) appears in at least one Act section; list any missing; add one-line stub for each gap | ✅ |
| SP2-04 | `spec-engine.md` vs HTML | `NODE_MAP` act fields | World map consistency: verify Layer 1 node count, Layer 0 terrain counts, Layer 10 hunt ground count all match HTML | ✅ |
| SP2-05 | `maps.md` | plan.md §IX | Cat Arc PLANNED: add node CQ (The Cat Quarter, num:77, R:tbd, W:'SL') to legend and coordinate index as ⚠️ PLANNED | ✅ |
| SP2-06 | `world.md` | plan.md §IX | Cat Arc PLANNED: add "The Cat Quarter (Node CQ — PLANNED Layer 44)" stub to Act I section | ✅ |
| SP2-07 | `story.md` | plan.md §IX | Cat Arc PLANNED: add Q-CAT-01 through Q-CAT-06 dialogue stub section (beat lines only, mark PLANNED) | ✅ |
| SP2-08 | `world.md` | plan.md §X | Torment Nexus PLANNED: update HM node description to add Kern & Sable and bar counter (mark PLANNED) | ✅ |
| SP2-09 | `story.md` | plan.md §X | Torment Nexus PLANNED: add Q-NEXUS-00 / Q-NEXUS-01 / Q-NEXUS-02 dialogue stubs (mark PLANNED) | ✅ |
| SP2-10 | `lab-report-architecture-full.md` | roll2hit-v3.html | Verify conclusion / abstract still accurate after sync pass updates: node count, monster count, line count | ✅ |
| SP2-11 | `index.md` | — | Update SP2 sync note in footer; add project directive to top; verify cross-ref table entries marked ✅ | ✅ |
| SP2-12 | `plan.md` | — | Final: mark all SP2-01 through SP2-11 ✅; update cross-ref table | ✅ |

---

### XI-C. World Map Consistency Rules

> Applied during SP2-02 through SP2-04. Any claim about the world map in any doc must satisfy all three rules:

1. **Node count:** Every doc that states a node count must say 76 (or qualify: "42 story nodes + 20 EBs + 7 junctions + SL + MT + DF/HM/GL + CO = 76"). Historical docs (spec-migration, prompt-migration) are exempt — they reflect their snapshot.

2. **Grid positions:** Any doc showing a `NODE_COORDS` value must match HTML exactly. The ASCII grid in `maps.md` is authoritative for display; `NODE_COORDS` in HTML is authoritative for code.

3. **Connections:** Any doc stating "Node X connects N→Y" must match `NODE_MAP[X].N === 'Y'` in HTML. Conflict = HTML wins; doc gets corrected.

4. **Act assignments:** Any doc stating which Act a node belongs to must match `NODE_MAP[code].act` in HTML.

5. **PLANNED nodes:** CQ (Cat Quarter, num:77) appears in docs only as `⚠️ PLANNED — Layer 46` — never as implemented.

---

### XI-D. Planned Feature Documentation Standard

> How to document a PLANNED feature that exists in plan.md but not in the HTML:

- In `maps.md` legend: add the row with `⚠️ PLANNED` in the Act column
- In `maps.md` coordinate index: add the row with `TBD` for R/C and `⚠️ PLANNED` note
- In `world.md`: add a sub-section headed `**[PLANNED — Layer N]**` with beat-level description only (no full lore text)
- In `story.md`: add a section headed `### Q-XX — PLANNED (Layer N)` with quest beat lines; no verbatim dialogue until implemented
- **Never** add PLANNED items to the HTML reference tables (MONSTER_POOL, NODE_MAP, etc.) — those reflect implemented code only

---

## Section XII — Yugurt Lake Fishing Overhaul (Layer 47, PLANNED)

> **Directive:** The current fishing system is a single 2d20 roll → combat. This section replaces it with a multi-step D&D-style fishing sub-game: Bait Search → Cast → Catch Roll → Type Roll → Combat. Fish names are converted to fit size tiers. A story quest chain "Master of Yugurt" makes fishing a mission-critical skill. **Do not implement yet — this is a plan.**

---

### XII-A. What the Current System Does

```
storyFishing() → player clicks "Cast Line (2d20)"
  → rolls d1 and d2 (each 1–20)
  → lo = min, hi = max
  → picks random fish from FISH_POOL where rank ∈ [lo, hi]
  → reveals fish name + stats
  → player clicks "Fight [name]!" → _startFishBattle()
  → standard combat, Fishing Rod grants Hooked condition
```

Problems: no skill expression, no bait strategy, all casts are identical, no story weight, no non-combat catch outcome.

---

### XII-B. New System — Four-Phase Fishing

```
Phase 1 — Bait Search (optional; skippable with default bait)
  Player chooses search location: [Shore/Dirt] [Reeds/Foliage] [Shallows/Water]
  Survival (WIS) DC 10 → find bait (roll d6 on chosen table)
  Fail → no bait; fish with default worm (+0 all)
  DC 15+ → player may choose which table to roll on

Phase 2 — Casting (Dexterity)
  Dexterity check DC 12
  Fail      → −2 to Catch Roll
  Pass      → +0 (standard cast)
  Pass +5   → +2 to Catch Roll ("perfect cast")

Phase 3 — Catch Roll (d20 + bait bonus + cast mod)
  1–5   → No Catch — "Nothing bites. The water is still."
  6–10  → Small Catch → go to Type Roll
  11–16 → Medium Catch → go to Type Roll
  17–19 → Large Catch → go to Type Roll
  20+   → Special Catch → auto-Legendary type; go to combat

Phase 4 — Type Roll (d20 + bait bonus)
  1–5   → Common     (×1 value)
  6–10  → Rare       (×2 value)
  11–15 → Enchanted  (×3 value)
  16–18 → Golden     (×5 value)
  19–20 → Legendary  (×10 value)
  → Result determines which fish from the size-appropriate pool enters combat
```

---

### XII-C. Bait Tables — Yugurt Lake Edition

> Three search locations, d6 roll each, 18 distinct baits. Converted from D&D fishing system (source: DM transcript) into the Yugurt Lake world.

**Table 1 — The Bank (searching lakeside dirt & stones)**

| d6 | Bait | Lore | Bonus |
|----|------|------|-------|
| 1 | Lakebed Worm | Damp soil at water's edge; standard issue | +1 Catch Roll |
| 2 | Void Grub | Dark, pulsing; found under flat rocks near the pressure zones | +2 Catch Roll |
| 3 | Shore Beetle | Abundant under rotting bark; fish mistake them for something worse | +1 Catch Roll |
| 4 | Yugurt Pebble | Smooth and pale; catches light in the water; fish are curious | +1 Type Roll |
| 5 | Void-Touched Moss | Faintly luminescent; grows only where the pressure leaks through | +2 Type Roll |
| 6 | Lakebed Pincher | Small crab; very alive; very annoyed | Roll Catch with advantage |

**Table 2 — The Reeds (searching lakeshore foliage)**

| d6 | Bait | Lore | Bonus |
|----|------|------|-------|
| 1 | Reed Cricket | Chirps until it hits the water, then stops immediately | +1 Catch Roll |
| 2 | Yugurt Dragonfly | The surface moves when it lands; predatory fish take note | +2 Catch Roll |
| 3 | Lakeshore Web | Sticky filament; allows combining with a second bait | Combine two baits; add both bonuses |
| 4 | Voidcap Mushroom | Glows faintly; grows only at the pressure nodes along the bank | +3 Type Roll |
| 5 | Wetland Root | Aromatic; drawn from the sediment below the reeds | +1 Type Roll |
| 6 | Lakebank Snail | Slow and deliberate; has done this before, on its own terms | +1 Catch Roll |

**Table 3 — The Shallows (searching wading-depth water)**

| d6 | Bait | Lore | Bonus |
|----|------|------|-------|
| 1 | Yugurt Frog | Larger bait; larger answers | +1 Catch Roll |
| 2 | Live Needle Minnow | Using Rank 1 as bait; the lake's deeper things take notice | +3 Catch Roll |
| 3 | Void Glow Fly | Bioluminescent; most effective after dark or in overcast weather | +2 Catch Roll (night/overcast) |
| 4 | Sunken Chip | Old coin or debris; the fish are curious about treasure too | +1 Type Roll |
| 5 | Lake Moss | Common; effective; smells wrong in a way fish find irresistible | +1 Type Roll |
| 6 | Void Bloom | Deep-water algae that should not be in the shallows | Bumps Catch result up one size category |

---

### XII-D. Fish Name Conversion — Size Tiers

> Current fish_01–fish_20 map to four size categories. Combat stats are unchanged. Only the presentation layer changes — size label replaces raw rank in the fishing modal.

| Size | Ranks | Fish Keys | Notes |
|------|-------|-----------|-------|
| Small | 1–4 | fish_01–04 | Trivial–Easy tier |
| Medium | 5–9 | fish_05–09 | Easy–Medium tier |
| Large | 10–14 | fish_10–14 | Medium–Hard tier |
| Very Large | 15–19 | fish_15–19 | Hard–Deadly tier |
| Legendary | 20 | fish_20 (Yugurt's Dread) | Special Catch only; always Legendary type |

> The raw rank number remains in the data. The fishing modal displays "Small Catch — [fish name]" instead of "Rank 3 of 20". The existing combat stats do not change — size tier only affects the presentation layer and gold value table.

---

### XII-E. Gold Value Table (replaces current drop sell values)

> Drop item names stay the same (Minnow Barb, Viper Scale, etc.). Sell values are overridden by size × rarity at time of drop:

| Size \ Rarity | Common | Rare | Enchanted | Golden | Legendary |
|---------------|--------|------|-----------|--------|-----------|
| Small | 2gp | 5gp | 8gp | 15gp | 25gp |
| Medium | 6gp | 12gp | 20gp | 35gp | 55gp |
| Large | 12gp | 25gp | 40gp | 65gp | 100gp |
| Very Large | 20gp | 40gp | 65gp | 100gp | 150gp |
| Legendary | 75gp | 120gp | 175gp | 225gp | 300gp |

*(Current sell values: fish_01 = 2gp, fish_20 = 80gp. New system preserves the low end for small common; significantly raises the ceiling for legendary catches.)*

---

### XII-F. Story Mission — "Master of Yugurt" (Q-FISH-01–Q-FISH-05)

Quest-giver: The Fisherman at YC. Triggers on second visit after player has caught at least one fish.

> *"...Nice Day For Fishing. Yugurt! You came back."*  
> He hands you a piece of bark with five scratches on it.  
> *"When these are marks, you'll know."*

| Code | Quest | Condition | Reward |
|------|-------|-----------|--------|
| Q-FISH-01 | First Cast | Catch any fish | "You know the rod now." (flavor); +50 XP |
| Q-FISH-02 | Bait Master | Complete all three bait search tables (one success each) | Bait Satchel item (reduces bait search DC by 2 permanently) |
| Q-FISH-03 | Patient Angler | Catch a Large fish using only Bank bait (Table 1) | +150gp + "Old Sinker" token (lore item, sell:5) |
| Q-FISH-04 | The Challenge | Beat The Fisherman in a 4-round competition (first to 20 points) | "Yugurt's Favour" (permanent: +1 to all fishing Catch Rolls) |
| Q-FISH-05 | Yugurt's Secret | Catch Yugurt's Dread (fish_20 via Special Catch) | Yugurt's Mark (unique item, sell:100) + FROBERGER_JOURNAL entry unlocked |

---

### XII-G. The Fisherman — Competition Mechanic (Q-FISH-04)

Four rounds. Each round both player and The Fisherman fish simultaneously. Points awarded per catch (size × rarity from table XII-E, converted to points). First to 20 wins.

**The Fisherman's rolls (auto-calculated, not player-controlled):**
- Bait: always finds Void Bloom (Table 3, d6=6) — auto-bumps size up one category
- Catch Roll: 1d20 + 5 (veteran; 30 years on this lake)
- Type Roll: 1d20 + 3
- He never misses a cast (Dex auto-pass)
- Point conversion: same size×rarity table as player

> *He is not trying to make you feel bad. He has simply fished every day for thirty years and is the best reader of this water in the region. He replaced his rod so many times the original material is a minority.*

---

### XII-H. New State Flags

| Flag | Type | Purpose |
|------|------|---------|
| `fishingBait` | object | `{bonus:n, typeBonus:n, advantage:bool, sizeUp:bool}` — cleared after each cast |
| `fishingQuestFlags` | object | `{q01:bool, q02a:bool, q02b:bool, q02c:bool, q03:bool, q04:bool, q05:bool}` |
| `fishingCompPoints` | int | Player points in current competition round |
| `fishingBaitSatchel` | bool | True if Bait Satchel item owned (reduces Survival DC) |
| `fishingYugurtFavour` | bool | True if Q-FISH-04 complete (+1 permanent Catch bonus) |
| `fishingCatchLog` | array | Last 5 catches: `{size, rarity, fish_key, gold}` — used for Q-FISH-03 check |

---

### XII-I. Implementation Steps (Layer 47)

1. Add `BAIT_TABLES` const (3 tables × 6 entries each, with bonus fields)
2. Add `FISH_SIZE_TIERS` const mapping fish keys → size label
3. Rewrite `storyFishing()` as a modal chain: bait search → cast → catch → type → reveal
4. Add Survival check UI (WIS mod + proficiency if applicable, vs DC 10/15)
5. Add Dexterity check UI (DEX mod, vs DC 12)
6. Update FISH_POOL entries with `size` field
7. Update fishing modal display: show size tier instead of raw rank
8. Add `_fishGoldValue(size, rarity)` lookup function
9. Add `_fishingQuestCheck()` on each successful catch
10. Add Q-FISH-01–05 quest entries to QUEST_DB
11. Add competition UI for Q-FISH-04 (4-round tracker, score display)
12. Update `_S_DEFAULTS()` with new fishing state flags

---

### XII-J. Documentation Updates (on implementation)

| File | Change |
|------|--------|
| `story.md` | Expand NODE 75 and NODE 76 sections with full bait table context and quest chain |
| `world.md` | Add YL/YC backstage notes (The Fisherman character profile) |
| `monsters.md` | Update fish drop sell values to size×rarity table |
| `lab-report-fish-with-dnd.md` | Add "v2 mechanic" section noting the overhaul; preserve v1 design rationale |
| `plan.md` | Mark XII-A through XII-P complete after implementation |

---

### XII-K. Bait as Consumable Stack (The Arrow Mechanic)

> Bait works exactly like arrows on a bow — equipped to the rod, consumed one per cast, auto-cycles to the next available stack when empty.

**Bait item data shape:**
```js
{ name:'Void Grub', icon:'🪱', type:'bait', count:3,
  bonus:{ catch:2, type:0, advantage:false, sizeUp:false } }
```

**Equip logic:**
- `S_story.equippedBait` = `{ key:'void_grub', count:3, bonus:{…} }` or `null`
- On equip: move bait from `S_story.inventory` into `equippedBait` slot
- On cast: decrement `equippedBait.count` by 1
- If `equippedBait.count` reaches 0: auto-unequip → scan `inventory` for next `type:'bait'` item → auto-equip first found → notify player ("Void Grub depleted. Using Reed Cricket.")
- If no bait anywhere: cast with Bare Hook (−3 Catch Roll, no Type bonus)

**Bait inventory UI (fishing modal):**
```
🎣 Rod: [🪱 Void Grub ×2] ← equipped bait + remaining count
   Inventory: [🦟 Reed Cricket ×3] [🐌 Lakebank Snail ×1]  ← tap to swap
```

Player can manually swap bait before casting (costs no action). Swapping mid-stack leaves the remainder in inventory.

**Bait acquisition:**
- Bait Search at YL → adds to inventory (not auto-equipped if already has a bait equipped)
- Vendor (future): The Fisherman at YC sells 3 common bait types: Lakebed Worm ×5 (2gp), Reed Cricket ×5 (2gp), Yugurt Frog ×5 (2gp)
- Drop: some monsters near the lake drop bait (e.g. shore beetles near SL)

---

### XII-L. Complete Fishing Flowchart

```
══════════════════════════════════════════════════════
  YUGURT LAKE — FISHING FLOWCHART (Layer 47)
══════════════════════════════════════════════════════

ENTER YL
  │
  ├─ No Fishing Rod in inventory?
  │    └─ "You need a Fishing Rod. The Fisherman at YC has one."
  │         [GO TO YC ↓] [LEAVE]
  │
  └─ Has Fishing Rod → OPEN FISHING MODAL
       │
       ├── ① BAIT SLOT (top of modal)
       │     Shows: equipped bait + count  — or — "Bare Hook (−3 Catch)"
       │     [SWAP BAIT] → inventory bait list → tap to equip
       │
       ├── ② [FIND BAIT] ─────────────────────────────────────┐
       │     Choose search location:                           │
       │       [THE BANK] [THE REEDS] [THE SHALLOWS]          │
       │     → Survival (WIS) check DC 10                     │
       │          │                                           │
       │          ├─ FAIL → "Nothing useful found."           │
       │          │         (return to modal)                 │
       │          └─ PASS → Roll d6 on chosen table           │
       │                    Bait revealed + added to inventory │
       │                    Auto-equip if bait slot empty      │
       │                    (return to modal) ────────────────┘
       │
       ├── ③ [CAST LINE] ────────────────────────────────────────────┐
       │     Consume 1 bait (or flag bare hook)                      │
       │     Auto-cycle bait if stack empty                          │
       │                                                             │
       │     CASTING CHECK — Dexterity DC 12                        │
       │       Fail      → cast mod: −2                             │
       │       Pass      → cast mod: +0                             │
       │       Pass +5   → cast mod: +2 ("perfect cast")            │
       │                                                             │
       │     CATCH ROLL: 1d20 + bait.catch + cast mod               │
       │       1–5  → NO CATCH ──────────────────────────────────┐  │
       │       6–10 → SMALL CATCH ─────────────────────────┐    │  │
       │       11–16→ MEDIUM CATCH ────────────────────┐   │    │  │
       │       17–19→ LARGE CATCH ─────────────────┐   │   │    │  │
       │       20+  → SPECIAL CATCH → auto-Legend  │   │   │    │  │
       │                                            │   │   │    │  │
       │     TYPE ROLL: 1d20 + bait.type            │   │   │    │  │
       │       1–5  → Common                        │   │   │    │  │
       │       6–10 → Rare                          │   │   │    │  │
       │       11–15→ Enchanted                     │   │   │    │  │
       │       16–18→ Golden                        │   │   │    │  │
       │       19–20→ Legendary                     │   │   │    │  │
       │                (all merge here) ───────────┘───┘───┘    │  │
       │                                                          │  │
       │     FISH SELECTED: random from size-tier pool            │  │
       │       Reveal: name · size · rarity · AC · HP · ATK      │  │
       │       [FIGHT {name}!]  [THROW BACK] [RECAST]            │  │
       │              │              │            │               │  │
       │              │         No combat;    Consume next bait;  │  │
       │              │         no loot;      repeat Phase ③     │  │
       │              │         no quest ck                       │  │
       │              ↓                                           │  │
       │         _startFishBattle()                               │  │
       │              │                                           │  │
       │              ├─ WIN → loot drop (size×rarity gold)       │  │
       │              │        _fishingQuestCheck()               │  │
       │              │        [RECAST] [LEAVE LAKE]              │  │
       │              └─ LOSE → no loot; bait consumed            │  │
       │                        [RECAST] [LEAVE LAKE]             │  │
       │                                                          │  │
       │     NO CATCH branch: ────────────────────────────────────┘  │
       │       "Nothing bites. The water is still."                  │
       │       [RECAST] [LEAVE LAKE]                                 │
       │                                               ──────────────┘
       └── ④ [LEAVE LAKE] → close modal; return to node

══════════════════════════════════════════════════════
  TOURNAMENT / BETTING OVERLAY (separate entry point)
══════════════════════════════════════════════════════

AT TOURNAMENT NPC (any node where a fisherman NPC lives)
  │
  ├─ [CHALLENGE {NPC}] → show bet options: 10 / 25 / 50 / 100gp
  │    (max bet capped by NPC's tier — see XII-N)
  │
  └─ Both sides put in ante → SINGLE ROUND
       │
       Player fishes (full Phase ③ above, one cast)
       NPC fishes (auto-roll, see XII-N stat block)
       │
       Compare SCORE (size×rarity → points from XII-E table)
       │
       ├─ Player wins   → collect 2× ante
       │                   _fishingQuestCheck() (Q-TOUR circuit)
       ├─ NPC wins      → lose ante
       └─ Tie           → SUDDEN DEATH recast (repeat once)
                          Second tie → push; both refunded
```

---

### XII-M. Betting Tournament System

**Structure:** Best-of-1, 1v1. Each participant makes one cast. Higher score (converted from size×rarity table) wins the pot. No round limit for story matches — only tournament bouts are single-round.

**Score conversion for tournament (same as XII-E gold values, used as points):**

| Size \ Rarity | Common | Rare | Enchanted | Golden | Legendary |
|---|---|---|---|---|---|
| Small | 2 | 5 | 8 | 15 | 25 |
| Medium | 6 | 12 | 20 | 35 | 55 |
| Large | 12 | 25 | 40 | 65 | 100 |
| Very Large | 20 | 40 | 65 | 100 | 150 |
| Legendary | 75 | 120 | 175 | 225 | 300 |
| No Catch | 0 | — | — | — | — |

**Tournament stakes tiers:**
| Tier | Ante | Win | Loss |
|---|---|---|---|
| Casual | 10gp | +10gp | −10gp |
| Serious | 25gp | +25gp | −25gp |
| Competitive | 50gp | +50gp | −50gp |
| High Roller | 100gp | +100gp | −100gp |
| Circuit Final | 200gp | +200gp | −200gp |

Each NPC opponent has a maximum stake tier — you cannot bet higher than their tier.

---

### XII-N. Fisherman NPC Roster — The Yugurt Circuit

> Six opponents of increasing competence, each with a plausible profession that explains their fishing skill. Defeating all six unlocks the Circuit Final.

---

**1. Dockhand Pip** *(Tilbury Docks — DK node)*
- **Job:** Harbor Apprentice, age 14; fishes off the pier on lunch breaks
- **Bait:** Bare Hook (can't afford bait, doesn't know better)
- **Catch Roll:** 1d20 + 0
- **Type Roll:** 1d20 + 0
- **Max bet:** 10gp (Casual)
- **Dialogue before:** "I caught a fish THIS big once. Well. I think it was a fish."
- **Dialogue win:** "You really know what you're doing! Can you teach me?"
- **Dialogue lose:** "Ha! Beginner's luck! ...I think."

---

**2. Off-Duty Guard Roskar** *(Visby Approach — AL node)*
- **Job:** City Watchman, 3rd Precinct; fishes the estuary on patrol breaks
- **Bait:** Lakebed Worm (bank standard; always has some in his pack)
- **Catch Roll:** 1d20 + 2
- **Type Roll:** 1d20 + 1
- **Max bet:** 20gp (Casual/Serious)
- **Dialogue before:** "I've been fishing this stretch for six years. Water knows me."
- **Dialogue win:** "Hm. Maybe I should try that moss bait Halvard mentioned."
- **Dialogue lose:** "Knew I should've woken up earlier. The morning bite was better."

---

**3. Fishmonger Daria** *(Tilbury Market — MQ node)*
- **Job:** Fish Market Proprietor; sources her own stock three mornings a week
- **Bait:** Live Needle Minnow (knows the lake; uses Rank 1 as bait)
- **Catch Roll:** 1d20 + 4
- **Type Roll:** 1d20 + 2
- **Max bet:** 35gp (Serious)
- **Dialogue before:** "I don't fish for sport. I fish so I know exactly what I'm selling."
- **Dialogue win:** "Good technique. Wrong bait for this season, but good technique."
- **Dialogue lose:** "Write that down. Whatever you did — write it down."

---

**4. Crown River Warden Halvard** *(Yugurt Lake — YL node)*
- **Job:** Official Crown Fisheries Inspector; monitors the lake's ecosystem for the High Council
- **Bait:** Void-Touched Moss (government-issue; maps the pressure zones)
- **Catch Roll:** 1d20 + 6
- **Type Roll:** 1d20 + 4
- **Max bet:** 60gp (Competitive)
- **Dialogue before:** "I assess this water for a living. I know what's in it. I know where it is. I know why."
- **Dialogue win:** "Interesting. The Void Bloom pulled something I haven't catalogued yet."
- **Dialogue lose:** "That was — I need to file a report on this. What bait was that exactly?"

---

**5. Sorsha of the Shallows** *(Yugurt Cabin — YC node, occasional visits)*
- **Job:** Retired Scholar King, former Aquatic Ecology researcher; gave up the Academy for the water
- **Bait:** Voidcap Mushroom (grows these herself in a jar she keeps in her coat)
- **Catch Roll:** 1d20 + 8
- **Type Roll:** 1d20 + 6
- **Max bet:** 90gp (Competitive/High Roller)
- **Dialogue before:** "I published fourteen papers on Yugurt's ecosystem. Turned out the lake was a better teacher without the papers."
- **Dialogue win:** "The Enchanted tier responds to barometric pressure changes. I published that in volume eleven. Nobody read volume eleven."
- **Dialogue lose:** "You felt the bottom current shift before the cast. I've only seen that done correctly twice. The second time was The Fisherman."

---

**6. The Master** *(Yugurt Lake — YL node; appears only after beating all 5 above)*
- **Job:** Unknown. Has no title. Carries a rod carved from Yugurt driftwood. Has been here longer than anyone can verify.
- **Bait:** Void Bloom (always; does not search — it is simply there when he reaches into the water)
- **Catch Roll:** 1d20 + 10
- **Type Roll:** 1d20 + 8
- **Max bet:** 200gp (Circuit Final)
- **Dialogue before:** *[He does not speak. He is already fishing. A second rod appears propped against a nearby rock. It is for you.]*
- **Dialogue win:** *[He nods once. Picks up his rod. Leaves. The second rod remains. It is now yours.]*  
  → Win reward: **The Driftwood Rod** (unique item; +2 all Catch Rolls; +1 all Type Rolls; sell:0 — cannot be sold)
- **Dialogue lose:** *[He does not look at you. He is watching the water. The water is very still.]*

---

### XII-O. Tournament Quest Chain (Q-TOUR-01 through Q-TOUR-06)

| Code | Quest | Opponent | Reward |
|------|-------|----------|--------|
| Q-TOUR-01 | "The Harbor Bout" | Beat Pip | +25gp + "Pier Token" (lore, sell:1) |
| Q-TOUR-02 | "The Estuary Match" | Beat Roskar | +40gp + Guard-issue Lakebed Worm ×5 |
| Q-TOUR-03 | "The Market Bout" | Beat Daria | +60gp + Daria's Bait Pouch (holds 3 bait stacks instead of 1 in equip slot) |
| Q-TOUR-04 | "The Crown Assessment" | Beat Halvard | +100gp + Crown Warden's Field Notes (lore, sell:5; reduces Survival bait-search DC by 3) |
| Q-TOUR-05 | "The Scholar's Challenge" | Beat Sorsha | +150gp + Volume Eleven (lore item, sell:15; +1 permanent Type Roll) |
| Q-TOUR-06 | "The Circuit Final" | Beat The Master | The Driftwood Rod (unique; +2 Catch / +1 Type; cannot sell) + "Yugurt Circuit Champion" flag |

All Q-TOUR quests trackable via standard `QUEST_DB` entries. Circuit champion flag enables a special line from The Fisherman: *"...Nice Day For Fishing. Yugurt! You beat him. He doesn't lose."*

---

### XII-P. Updated Implementation Steps (additions to XII-I)

**New steps added to the Layer 47 build list:**

13. Add `BAIT_ITEMS` const (18 named baits × bonus fields; also 3 basic vendor baits)
14. Add `S_story.equippedBait` field to `_S_DEFAULTS()` (null default)
15. Implement bait equip/unequip in fishing modal; auto-cycle on stack depletion
16. Add bare-hook penalty path (−3 Catch, no Type bonus, warning UI)
17. Add bait swap panel to fishing modal (list available baits from inventory)
18. Add `FISHING_NPCS` const (6 entries: pip / roskar / daria / halvard / sorsha / master)
19. Add tournament modal: ante selection → NPC auto-roll → score compare → payout
20. Add `_npcFishingRoll(npc)` function (auto-bait, catch roll, type roll, score return)
21. Add `_fishingQuestCheck()` function (checks Q-FISH and Q-TOUR progress on each win)
22. Wire NPC dialogue triggers at DK / AL / MQ / YL / YC nodes (tournament entry points)
23. Add The Master appearance gate: `allTourCircuitComplete` flag required
24. Add The Driftwood Rod to `WEAPON_ITEMS` or special rod slot (unique, unsellable)
25. Add `S_story.fishingCatchLog` array (last 10 catches for Q-FISH-03 validation)
26. Add vendor panel at YC: The Fisherman sells 3 basic bait types after Q-FISH-01

---

### XII-Q. Yugurt Lake Biome — Three Territory Zones

Yugurt Lake is not a uniform body of water. It has three distinct fishing zones, each with its own bait fish population and predator depth. The zone is not chosen by the player — it is determined by the tier of bait equipped. Higher-tier bait sinks deeper and attracts deeper predators.

```
══════════════════════════════════════════
  YUGURT LAKE — TERRITORY MAP
══════════════════════════════════════════

  ┌─────────────────────────────────────┐
  │  THE SHORE / SHALLOWS               │
  │  Bait Tiers 1–2 · Predator Rank 1–7 │
  │  Calm water. You can see the bottom. │
  │  The sign says YUGURT.               │
  └──────────────┬──────────────────────┘
                 │ deeper
  ┌──────────────▼──────────────────────┐
  │  THE REEDS / MID-LAKE               │
  │  Bait Tiers 3–4 · Predator Rank 8–14│
  │  Reed line obscures the shore.       │
  │  Something moves in parallel.        │
  └──────────────┬──────────────────────┘
                 │ deeper
  ┌──────────────▼──────────────────────┐
  │  THE DEEP                           │
  │  Bait Tier 5 · Predator Rank 15–20  │
  │  Mirror-flat. No reflection.         │
  │  The sign was not put here recently. │
  └─────────────────────────────────────┘
```

**Zone rules:**
- Bare hook → Shore zone only (rank 1–5 predator pool, Luck Mod as only bonus)
- Tier 1–2 bait → Shore zone (rank 1–7 predator pool)
- Tier 3–4 bait → Reeds zone (rank 8–14 predator pool)
- Tier 5 bait → Deep zone (rank 15–20 predator pool)
- Zone also determines which bait fish are available during Bait Fishing phase

---

### XII-R. Bait Fish Pool — 20 Freshwater Species

Bait fish are caught during the **Bait Fishing Phase** (separate from predator fishing). They have no counterattack — they splash and dodge. One hit catches them. They are added to the tackle box as ammo for the next predator cast.

**Combat:** 1 attack roll (d20 + Luck Mod) vs bait fish AC → hit = caught (no damage phase). No enemy turn. Bait fish are not in `MONSTER_POOL` — they use a separate `BAIT_FISH_POOL` to prevent them appearing in corridor encounters.

**Tackle box entry format:**
```js
{ key: 'fathead_minnow', name: 'Fathead Minnow', icon: '🐟',
  tier: 1, bonus: +1, ac: 3, hp: 2, xp: 5 }
```

**All 20 freshwater bait fish — Tier 1 through Tier 5:**

| Tier | Bait Bonus | Species | Slug | AC | HP | XP | Zone |
|------|-----------|---------|------|----|----|-----|------|
| 1 | +1 | Fathead Minnow | `fathead_minnow` | 3 | 2 | 5 | Shore |
| 1 | +1 | Bluntnose Minnow | `bluntnose_minnow` | 3 | 2 | 5 | Shore |
| 1 | +1 | Bridle Shiner | `bridle_shiner` | 4 | 3 | 5 | Shore |
| 1 | +1 | Swallowtail Shiner | `swallowtail_shiner` | 4 | 3 | 5 | Shore |
| 2 | +2 | Golden Shiner | `golden_shiner` | 4 | 4 | 10 | Shore |
| 2 | +2 | Comely Shiner | `comely_shiner` | 5 | 4 | 10 | Shore |
| 2 | +2 | Satinfin Shiner | `satinfin_shiner` | 5 | 5 | 10 | Shore |
| 2 | +2 | Ironcolor Shiner | `ironcolor_shiner` | 5 | 5 | 10 | Shore |
| 3 | +3 | Creek Chub | `creek_chub` | 5 | 6 | 15 | Reeds |
| 3 | +3 | Common Shiner | `common_shiner` | 6 | 6 | 15 | Reeds |
| 3 | +3 | Spotfin Shiner | `spotfin_shiner` | 6 | 7 | 15 | Reeds |
| 3 | +3 | Spottail Shiner | `spottail_shiner` | 6 | 7 | 15 | Reeds |
| 4 | +4 | Gizzard Shad | `gizzard_shad` | 6 | 8 | 20 | Reeds |
| 4 | +4 | Alewife (landlocked) | `alewife` | 7 | 9 | 20 | Reeds |
| 4 | +4 | White Sucker | `white_sucker` | 7 | 9 | 20 | Reeds |
| 4 | +4 | Banded Killifish | `banded_killifish` | 7 | 10 | 20 | Reeds |
| 5 | +5 | Tadpole Madtom | `tadpole_madtom` | 7 | 11 | 25 | Deep |
| 5 | +5 | Margined Madtom | `margined_madtom` | 8 | 11 | 25 | Deep |
| 5 | +5 | Mummichog | `mummichog` | 8 | 12 | 25 | Deep |
| 5 | +5 | Blacknose Dace | `blacknose_dace` | 8 | 12 | 25 | Deep |

**Bait fish drop table by zone:**

| Zone | Which bait fish appear |
|------|----------------------|
| Shore | Tiers 1–2 (roll d8: 1–4 = Tier 1, 5–8 = Tier 2) |
| Reeds | Tiers 3–4 (roll d8: 1–4 = Tier 3, 5–8 = Tier 4) |
| Deep | Tier 5 only (roll d4 to pick species) |

Within each tier, species is chosen randomly. Luck Mod adds to the catch roll (higher Luck = catches harder bait fish on the same roll, potentially accessing Tier 2 from a Tier 1 zone if Luck Mod ≥ +2).

---

### XII-S. Bait Fishing Phase — The Sub-Loop

Bait fishing is a separate action from predator fishing. It is available at YL at any time. It does not cost a turn in the tournament.

```
BAIT FISHING LOOP
─────────────────
[FIND BAIT] button in fishing modal
  │
  ├─ Choose zone: [SHORE] [REEDS] [DEEP]
  │   (REEDS and DEEP require previous zone bait in tackle box to unlock)
  │
  ├─ Roll: d20 + Luck Mod vs zone DC
  │   Shore DC 8  ·  Reeds DC 12  ·  Deep DC 16
  │
  ├─ FAIL: "Nothing struck. The water is quiet." (no cost)
  │
  └─ PASS: bait fish selected from zone table
        │
        └─ BAIT CATCH COMBAT
             One attack: d20 + Luck Mod vs bait fish AC
             Hit → fish caught → added to tackle box
             Miss → fish escapes ("It got away. The water closes.")
             No enemy counterattack. No death save. No conditions.
             XP awarded on catch regardless of how many attempts.
```

**Zone unlock progression:**
- Shore always unlocked
- Reeds unlock when you have ≥ 1 Tier 2 bait in tackle box
- Deep unlocks when you have ≥ 1 Tier 4 bait in tackle box
- This creates a natural progression: fish Shore to unlock Reeds, fish Reeds to unlock Deep

---

### XII-T. Predator Attraction Formula (Revised with Bait Tiers)

**Type Roll (determines predator rank 1–20):**
```
predatorRank = clamp(2d20 + baitBonus + Luck Mod, 1, 20)
```

Where:
- `2d20` = sum of two d20 rolls (range 2–40 before clamping)
- `baitBonus` = tier bonus of equipped bait fish (0 bare hook, +1 to +5 by tier)
- `Luck Mod` = floor((Luck − 10) / 2) from getLuck()
- `clamp(x, 1, 20)` = max 20, min 1

**Expected predator rank by bait tier and character Luck:**

| Bait | Luck Mod | Avg 2d20 | Expected Rank | Zone |
|------|---------|----------|--------------|------|
| Bare hook | +0 | 21 + 0 | ~10 (Shore only) | Shore |
| Tier 1 | +0 | 21 + 1 | ~11 | Shore |
| Tier 2 | +1 | 21 + 3 | ~13 | Shore |
| Tier 3 | +1 | 21 + 4 | ~14 | Reeds |
| Tier 4 | +2 | 21 + 6 | ~16 (capped) | Reeds |
| Tier 5 | +2 | 21 + 7 | ~17 (capped) | Deep |
| Tier 5 | +3 | 21 + 8 | ~18 (capped) | Deep |
| Tier 5 | +4 | 21 + 9 | ~19 (capped) | Deep |
| Tier 5 | +5 | 21 + 10 | ~20 max | Deep |

> **Design note:** A Level 20 character with max stats (Luck ≈ 18, Mod +4) using Tier 5 bait averages rank 19–20. This is deliberate — the fishing sub-game scales to endgame character power. The average converges to 20 for a fully-built character, matching the Epic Boss difficulty curve.

---

### XII-U. Predator Fish Combat — Conditions & Magic Weapon Drops

Predator fish fight back. They have attack stats, and high-rank predators inflict conditions.

**Condition table by rank:**

| Rank | Condition | Save DC | Notes |
|------|-----------|---------|-------|
| 1–7 | None | — | Clean fight |
| 8–10 | Poisoned (on hit) | DC 12 CON | Disadvantage on attacks next round |
| 11–13 | Poisoned + Restrained | DC 14 CON | Cannot flee while Restrained |
| 14–16 | Poisoned + Blinded | DC 16 CON | Player has DIS on attack |
| 17–19 | Poisoned + Paralyzed | DC 18 CON | Lose bonus action; enemy ATK has ADV |
| 20 | Poisoned + Paralyzed + Cursed | DC 20 CON | Yugurt's Dread — saves at DIS |

**Poison mechanic:** On a predator hit that triggers Poison, player rolls CON save. Fail = Poisoned condition applied for duration of the fishing encounter. Condition clears automatically when the fight ends (fish-specific — not carried to next node).

**Magic Weapon Drop — Predator Loot:**
Every predator fish defeat drops a magic weapon. No d100 roll required — it is guaranteed.

```
weaponMagicBonus = floor(fish.ac / 4) + max(0, Luck Mod)
```

| Fish AC | Base Bonus | Luck Mod +0 | Luck Mod +1 | Luck Mod +2 | Luck Mod +3 |
|---------|-----------|------------|------------|------------|------------|
| 5–7 | +1 | +1 | +2 | +2 | +3 |
| 8–10 | +2 | +2 | +3 | +3 | +4 |
| 11–13 | +2 | +2 | +3 | +4 | +4 |
| 14–16 | +3 | +3 | +4 | +4 | +5 |
| 17–19 | +4 | +4 | +5 | +5 | +6 |
| 20 | +5 | +5 | +6 | +6 | +6 (cap) |

Weapon type is drawn from `WEAPON_ITEMS` at random, then the magic bonus is applied. Flavor name is prefixed: `"Lake-Forged "`, `"Yugurt-Tempered "`, `"Deepwater "` etc. (chosen by rank tier).

**No regular monster drops magic weapons** (see XII-V below).

---

### XII-V. Global Monster Drop Nerf — Used Weapons Only

> **This is a global mechanical change to `_rollMonsterWeaponDrop()`.**

**Current behavior:** Monster weapon drops have `+0 to +3` magic bonus. This makes corridor fights a reliable source of good gear.

**New behavior:** Monster weapon drops have `−3 to 0` modifier — degraded, used, chipped, rusted. They are still equippable but are inferior to the starting Flint Dagger at worst. They are junk gear sold for scrap gold.

**Implementation:**
```js
// OLD:
const magicBonus = Math.floor(Math.random() * 4); // 0–3

// NEW:
const magicBonus = Math.floor(Math.random() * 4) - 3; // −3 to 0
```

**Flavor names for degraded weapons:**

| Bonus | Prefix | Example |
|-------|--------|---------|
| −3 | "Rusted " | Rusted Shortsword |
| −2 | "Chipped " | Chipped Axe |
| −1 | "Worn " | Worn Longsword |
| 0 | "Salvaged " | Salvaged Dagger |

**Sell values:** Degraded weapons sell for base value only (no bonus multiplier). This maintains gold flow from combat without providing a gear-upgrade shortcut.

**Why:** Fishing becomes the exclusive source of magic weapons. A player who engages with the Yugurt Lake sub-game gains a significant gear advantage over one who ignores it. This creates a meaningful reason to fish at any level — the best drops in the game come from the lake, not the dungeon.

**Scope:** Applies to `_rollMonsterWeaponDrop()` only. Boss drops (Commander Auros, Epic Bosses), chest loot (`storyCollectLoot()`), and vendor items are unaffected.

---

### XII-W. Luck Modifier — Complete Fishing Integration

All fishing calculations are modified by `getLuck()` → Luck Mod = `floor((Luck − 10) / 2)`.

| Phase | Where Luck Mod applies | Formula |
|-------|----------------------|---------|
| Bait zone DC | Subtracted from zone DC | effective DC = zoneDC − Luck Mod |
| Bait catch roll | Added to catch roll | d20 + Luck Mod vs bait AC |
| Predator type roll | Added to type roll | 2d20 + baitBonus + Luck Mod |
| Predator hit roll | Added to hit roll | d20 + atkBonus + Luck Mod vs fish AC |
| Death save (fishing) | Added to save roll | d20 + Luck Mod |
| Magic weapon drop quality | Added to base bonus | floor(ac/4) + max(0, Luck Mod) |
| Tournament tiebreaker | Determines winner on tie | higher Luck Mod wins; coin flip on equal |

**Cumulative example — Level 20 character, STR:20 DEX:18 CON:20 INT:16 WIS:18 CHA:14:**
```
Luck = ⌈(20×18×20×16×18×14)^(1/6)⌉ = ⌈(1,161,216,000)^(1/6)⌉ = ⌈17.1⌉ = 17
Luck Mod = floor((17 − 10) / 2) = +3

Bait catch vs Tier 5 (AC 8): d20 + 3 → needs 5+ to catch (75% success rate)
Type roll with Tier 5 bait: 2d20 + 5 + 3 = avg ~29 → clamped to 20 → always Rank 20
Magic weapon: fish AC 20 → floor(20/4) + 3 = 5 + 3 = 6 (cap) → +6 weapon
```

A maximally-built character fishing Deep zone with Tier 5 bait reliably encounters Rank 20 predators and receives +5 to +6 magic weapons. This is the reward for full stat investment and fishing engagement.

---

### XII-X. Tackle Box — Full Data Shape

The tackle box is the bait inventory subsystem. It extends the existing `equippedBait` mechanic (XII-K) with bait fish as the primary input.

**State shape additions to `_S_DEFAULTS()`:**
```js
equippedBait: null,       // { key, name, icon, tier, bonus, count } or null
tacklebox: {},            // { [slug]: count } — all bait fish in inventory
tackleboxZoneUnlocks: {   // which bait zones the player has accessed
  shore: true,
  reeds: false,
  deep: false
},
fishingCatchLog: [],      // last 20 catches: [{ type:'bait'|'predator', rank, name, ts }]
baitFishingActive: false  // true while in bait-catch combat (suppresses node re-render)
```

**Bait fish flow from catch to tackle box:**
```
Bait fish caught in combat
  → add to tacklebox[slug]++
  → if equippedBait === null: auto-equip (highest tier available)
  → notify: "Caught Blacknose Dace ×1. Tackle box: [🐟 Blacknose Dace ×3]"
  → unlock next zone if tier threshold met
```

**BAIT_FISH_POOL const structure:**
```js
const BAIT_FISH_POOL = {
  fathead_minnow: { name:'Fathead Minnow', icon:'🐟', tier:1, bonus:1,
                    ac:3, hp:2, xp:5, zone:'shore' },
  // ... 19 more entries
};
```

---

### XII-Y. Updated Implementation Steps (additions to XII-P step 26)

27. Add `BAIT_FISH_POOL` const (20 entries × tier/bonus/ac/hp/xp/zone fields)
28. Add `tacklebox`, `tackleboxZoneUnlocks`, `fishingCatchLog`, `baitFishingActive` to `_S_DEFAULTS()`
29. Implement bait fishing sub-loop: zone selection → DC check → bait combat (no counterattack path)
30. Wire zone unlock logic: Reeds unlocks at Tier 2 bait count ≥ 1; Deep at Tier 4 ≥ 1
31. Update type roll formula: `clamp(2d20 + baitBonus + Luck Mod, 1, 20)` with zone constraint
32. Add condition table to predator combat by rank (Poisoned DC 12–20; Restrained/Blinded/Paralyzed)
33. Implement `_fishingMagicWeaponDrop(fishAc)`: `floor(fishAc / 4) + max(0, getLuckMod())` → magic weapon
34. Add degraded weapon prefixes array: `['Rusted ','Chipped ','Worn ','Salvaged ']` keyed to −3/−2/−1/0
35. Change `_rollMonsterWeaponDrop()` bonus: `Math.floor(Math.random()*4) - 3` (−3 to 0)
36. Add tackle box panel to fishing modal: show equipped bait, tacklebox contents, swap button
37. Add zone selector UI to fishing modal: [SHORE][REEDS][DEEP] with lock indicators
38. Add bait catch log display (last 5 catches) in fishing modal footer
39. Implement `_checkTackleboxZoneUnlocks()`: auto-upgrades zone access after each catch
40. Update `storyFishing()` entry: route to bait-fishing or predator-fishing based on player selection

---

*Sections XII-Q through XII-Y are additions to the Layer 47 PLANNED build. They extend and supersede XII-B (four-phase system) with the full bait fish sub-loop. The core flowchart in XII-L remains valid — zone selection is added as a new branch before Phase 1.*

---

### XII-Z. Quest — Q-BAIT-00: "Listen Closely" (The Outsider Merchant's Briefing)

**Quest ID:** `Q-BAIT-00`  
**Type:** Tutorial / intro gate  
**Trigger:** First arrival at YC (Yugurt Cabin) — fires before The Fisherman's Fishing Rod hand-off  
**NPC:** The Outsider Merchant — a trader who has come from somewhere else specifically to fish Yugurt Lake; appears once, at the cabin door, blocking entry until the briefing is delivered; never seen again after Q-BAIT-00 completes  
**Location:** YC (Node 76)  
**Reward:** Starter Tackle Pouch — `{ fathead_minnow:×3, golden_shiner:×2 }` (5 bait fish, Tiers 1–2); 75 XP  
**Completion trigger:** Auto-completes on first predator fish defeat (not on first bait catch — the merchant wants proof you went through the full loop)

---

**Character note:** The merchant speaks in the precise, slightly mechanical cadence of someone reciting from memory. That is because he is. He memorized the Fishing Guide — the small folded pamphlet he has carried since before he came to the lake. Every clause, every tier number, every warning about Rank 14 is lifted verbatim from it. At the end of the briefing he hands the Guide to the player. He no longer needs it. He knows it by heart and will never need it again because he is leaving.

**Full NPC dialogue (verbatim — write to `NPC_DIALOGUES` or inline in node render):**

> *"Listen. I'm going to say this once because I don't repeat myself for free.*
>
> *You need the Rod. You get it from the man at the cabin. He won't charge you — he doesn't talk about money.*
>
> *You fish the Shore first. Catch the small ones — the Minnows, the Shiners. They go in the box. The box feeds the rod. The rod calls the big ones. You understand? You fish for bait. You use bait to fish.*
>
> *Tier one bait catches tier one fish. You want the deep water, you earn deep water bait. Nobody fishes the Deep on day one. The lake doesn't allow it.*
>
> *When you hook something big, it will try to blind you. It will try to poison you. Rank fourteen and above, you probably can't run. You don't get to run. You made your cast.*
>
> *If you win, it drops something. Not gold — something better. The quality depends on how lucky you are. Not how strong. Lucky. There's a difference. The lake knows the difference.*
>
> *And one more thing. Don't bother looting the monsters on the road in for good gear. They carry junk. Used blades. Rust. The lake is the only place for real equipment now.*
>
> *His name is Yugurt. The lake. Not the man at the cabin. I don't think the man has a name.*"
>
> *He holds out a small folded pamphlet. The cover reads:* **YUGURT LAKE — FISHING GUIDE**. *The pages are worn. Some margins have been underlined twice.*
>
> *"You can go now."*
>
> *He leaves before you do.*

---

**The Fishing Guide — Loot Item:**

```js
{ name: 'Fishing Guide', icon: '📖', type: 'readable',
  description: 'A small folded pamphlet. YUGURT LAKE — FISHING GUIDE. '
             + 'The margins are underlined. Someone memorized this.' }
```

- Added to `S_story.inventory` at the end of the briefing (same moment as the last dialogue line)
- Readable from inventory: opens a text overlay with the in-world guide text (see below)
- Not sellable. Not consumable. Weighs nothing. Stays in inventory permanently.
- **Mechanical effect:** While Fishing Guide is in inventory, zone DCs are displayed in the fishing modal UI (Shore DC 8 · Reeds DC 12 · Deep DC 16). Without it, DCs are hidden — the player knows they exist but not the numbers.

**In-world Fishing Guide text (rendered on [READ] from inventory):**

```
YUGURT LAKE — FISHING GUIDE
────────────────────────────

THE SHORE        Fish for Minnows and Shiners. Bait Tiers 1–2.
                 Predators: Ranks 1–7. Search DC: 8.

THE REEDS        Requires Tier 2 bait in tackle box.
                 Predators: Ranks 8–14. Search DC: 12.
                 Warning: Rank 8+ fish may Poison on hit.

THE DEEP         Requires Tier 4 bait in tackle box.
                 Predators: Ranks 15–20. Search DC: 16.
                 Warning: Rank 14+ may Blind, Restrain, or Paralyze.
                 Rank 20: saves at Disadvantage. Do not fish alone.

THE TACKLE BOX   Bait fish are ammunition. One per cast.
                 Box auto-cycles when a stack depletes.
                 Bare Hook: −3 to catch. No type bonus. Luck only.

THE DROP         Every predator drops a magic weapon.
                 Quality = fish AC ÷ 4 + Luck Modifier.
                 Road monsters drop junk. The lake does not.

LUCK             The lake knows the difference.
────────────────────────────
```

---

**Quest beat structure:**

| Beat | Trigger | State flag | Notes |
|------|---------|-----------|-------|
| Briefing | First visit to YC | `q_bait_00_briefed = true` | Blocks cabin door until player [LISTEN] |
| Guide received | End of briefing dialogue | `q_bait_00_guide = true` | Fishing Guide added to inventory; DC display unlocked |
| Rod acquired | Pick up Fishing Rod at YC | `q_bait_00_rod = true` | The Fisherman hands it over as normal |
| First bait catch | Tier 1 bait caught at YL | `q_bait_00_bait = true` | Auto-triggers; no UI interrupt |
| First predator win | Any predator fish defeated | `q_bait_00_complete = true` | Quest marks done; Starter Tackle Pouch auto-added; 75 XP |

**The Merchant is gone on the player's next visit to YC.** No farewell. No note. The cabin door is unblocked. The man is inside saying Yugurt. Neither of them mentions the merchant.

---

**Implementation notes:**
- The Outsider Merchant is not in `BIRKA_NPC_PROFILES` and not in `NPC_DIALOGUES` — he is a one-shot inline NPC, rendered directly in the YC node text via the `Q-BAIT-00` quest state flags
- The Fishing Guide is added to `S_story.inventory` as a `type:'readable'` item; `[READ]` button opens a modal with the guide text above
- The Starter Tackle Pouch is not a separate item — it auto-unpacks: adds directly to `S_story.tacklebox` and auto-equips Fathead Minnow as starting bait
- Fishing modal DC display: if `_hasItem('Fishing Guide')` → show zone DCs; else show "DC: ???"
- Add `q_bait_00_briefed`, `q_bait_00_guide`, `q_bait_00_rod`, `q_bait_00_bait`, `q_bait_00_complete` to `_S_DEFAULTS()` (all false)
- Step 41 (new): Implement Q-BAIT-00 state flags, Fishing Guide item, and inline Outsider Merchant render at YC node

---

## Section XIII — Luck: The Seventh Stat (Layer 48, PLANNED)

> **Concept:** Luck is the geometric mean of all six ability scores — STR, DEX, CON, INT, WIS, CHA. It is a **derived, read-only stat**: the player cannot spend points on it, cannot level it directly. It rises naturally as the player increases their other stats via ASI. It is the universe's running assessment of how balanced and capable the character is across all dimensions. A specialist is unlucky. A generalist is lucky.

---

### XIII-A. Formula

```
LUCK = ⌈(STR × DEX × CON × INT × WIS × CHA)^(1/6)⌉
```

**JavaScript implementation:**
```js
function _calcLuck() {
  const s = S_story.abilityScores || { str:16, dex:12, con:14, int:10, wis:12, cha:8 };
  const product = s.str * s.dex * s.con * s.int * s.wis * s.cha;
  if (product <= 0) return 0;
  return Math.ceil(Math.pow(product, 1 / 6));
}

function _luckMod() {
  return Math.floor((_calcLuck() - 10) / 2);
}
```

> **Note on stat naming:** The six stats are STR / DEX / CON / INT / WIS / CHA — the standard D&D six. CON (Constitution) is the endurance and survival stat. "Survival" in D&D is a WIS-based skill, not a separate ability score. Both CON and WIS feed into Luck.

**Ceiling rule:** All fractional results round UP to the next integer. `Math.ceil()` — never `Math.round()`, never `Math.floor()`.

**Zero rule:** If any stat is 0, the product is 0, and Luck = 0. Luck Mod = −5. This should not happen in normal play (all stats start ≥ 8 at character creation).

---

### XIII-B. Luck Score Reference Table

| All stats at… | Product | Raw mean | LUCK (ceiling) | Luck Mod |
|---|---|---|---|---|
| 8 (all even) | 262,144 | 8.00 | 8 | −1 |
| 10 (all ten) | 1,000,000 | 10.00 | 10 | +0 |
| Default start (16/12/14/10/12/8) | 2,580,480 | 11.87 | **12** | **+1** |
| After ASI spread (14/14/14/12/12/12) | 6,096,384 | 13.21 | 14 | +2 |
| High specialization (20/8/8/8/8/8) | 5,242,880 | 12.80 | 13 | +1 |
| Balanced high (16/16/16/14/14/14) | 100,122,624 | 17.16 | 18 | +4 |
| Max all (20/20/20/20/20/20) | 64,000,000,000 | 20.00 | 20 | +5 |

**Design insight — the specialist penalty:** A character who dumps all ASI into STR (STR 20, all others 8) gets Luck 13 (+1). A character who spreads ASI evenly (all 14s) gets Luck 14 (+2). Generalists are luckier. The formula enforces this mathematically — the geometric mean is always ≤ the arithmetic mean.

---

### XIII-C. Luck Modifier Table

Standard D&D modifier formula applied to the Luck score:

| Luck | Mod | | Luck | Mod |
|------|-----|-|------|-----|
| 1 | −5 | | 12–13 | +1 |
| 2–3 | −4 | | 14–15 | +2 |
| 4–5 | −3 | | 16–17 | +3 |
| 6–7 | −2 | | 18–19 | +4 |
| 8–9 | −1 | | 20 | +5 |
| 10–11 | +0 | | | |

`LuckMod = Math.floor((LUCK - 10) / 2)`

---

### XIII-D. What Luck Modifier Applies To

Luck Mod is a passive bonus/penalty applied automatically — the player never chooses to "use" luck.

| Context | How LuckMod applies | Notes |
|---|---|---|
| **Fishing — Type Roll** | +LuckMod to every Type Roll | The quality of what answers is partly luck |
| **Fishing — Bare Hook** | +LuckMod to Catch Roll (replaces bait bonus) | Luck is all you have with no bait |
| **Tournament tie-breaker** | If scores equal: player with higher LuckMod wins | Second tie → recast |
| **d100 Loot Roll** | +LuckMod to the d100 roll | Better items drop slightly more often |
| **Corridor Encounter** | Encounter threshold raised by LuckMod × 0.5 | Lucky characters avoid more random fights |
| **Death Saves** | +LuckMod to each death save roll (DC 10) | A lucky fighter stabilizes more often |
| **Bait Search** | −LuckMod reduces effective Survival DC | Lucky characters find better bait easier |

> **Read-only invariant:** Luck never appears as a spend-able resource. It is always derived live from `S_story.abilityScores`. No item, no quest, no flag directly sets `luck` — all changes flow through the six underlying stats.

---

### XIII-E. UI — Where Luck Appears

**Character sheet** (below the six stat blocks):

```
┌─────────────────────────────────────────┐
│  STR 16 +3 │ DEX 12 +1 │ CON 14 +2     │
│  INT 10 +0 │ WIS 12 +1 │ CHA  8 −1     │
├─────────────────────────────────────────┤
│  ✦ LUCK  12  [+1]   ← read-only        │
│    Geometric mean of all six stats      │
└─────────────────────────────────────────┘
```

- Displayed with a ✦ glyph to distinguish it from the six primary stats
- Shows the score and modifier in brackets
- Tooltip/subline: "Geometric mean of all stats. Cannot be assigned directly."
- Recalculates and re-renders on every level-up (ASI allocation changes stats → Luck updates live)

**Fishing modal** (bait slot area):

```
🎣 Rod: [🪱 Void Grub ×2]    ✦ Luck +1 → Type Roll
```

**Status bar** (optional — only if space allows): small ✦ LUCK 12 chip next to the level badge.

---

### XIII-F. Luck and ASI Strategy Note (for story.md / world.md flavor)

> This is a flavor note for documentation — not a mechanical rule, just a consequence of the math.

A character who puts every ASI point into one stat is a specialist. A specialist's geometric mean is dragged down by their low scores elsewhere. A fighter who ignores CHA (dump stat to 6) finds their luck consistently diminished. The Froberger journal could mention this: *"The soldiers with the worst luck were always the most impressive in one way. The soldiers with the best luck were adequate at everything."*

The Fisherman at YC has high WIS, decent DEX, moderate everything else — estimated Luck 14 or 15. He is not the strongest or the fastest. He is the most consistently capable person at the lake. The formula knows this.

---

### XIII-G. Implementation Steps (Layer 48)

1. Add `_calcLuck()` pure function (reads `S_story.abilityScores`, returns ceiling integer)
2. Add `_luckMod()` pure function (calls `_calcLuck()`, returns floor((luck-10)/2))
3. Add Luck display block to `_showCharacterSheet()` below the six stat rows
4. Recalculate and re-render Luck in `_showLevelUpModal()` after ASI allocation
5. Patch `storyFishing()` Type Roll: add `+ _luckMod()` to the d20 roll
6. Patch fishing bare-hook path: use `_luckMod()` as catch bonus instead of bait bonus
7. Patch `_rollD100Loot()`: add `+ _luckMod()` to the d100 roll (clamped to 100 max)
8. Patch death save roll in `_storyDeathSaveCrawl()`: add `+ _luckMod()` to each roll
9. Patch corridor encounter threshold: `10 + notoriety×1.5 + questCount×4 - _luckMod()×0.5`
10. Patch tournament tie-breaker in `_npcFishingRoll()`: compare `_luckMod()` on tied score
11. Patch bait search Survival DC: `effectiveDC = 10 - _luckMod()` (floor 4 — never trivial)
12. Add Luck chip to fishing modal bait-slot row (shows active LuckMod on Type Roll)
13. No new `_S_DEFAULTS()` field needed — Luck is always computed, never stored
---

## Section XIV — The World Creator: Fork, Extend, and Quest -1 (Layer 49, ✅ Implemented 2026-05-25)

> **Philosophy:** This section is addressed to the next developer — the person who reached Level 20 and found the world too small. It is not a feature. It is an invitation. The plan below describes what needs to be built so that invitation has a door.

---

### XIV-A. The Premise

Level 20 is the ceiling of the Fighter Champion progression. `XP_LEVELS` tops out at 195,000. The crit range reaches 17–20. Action Surge has 2 charges. There is nowhere left to grow inside the existing system.

Level 21 is undefined. `XP_LEVELS[20]` does not exist. The array has 20 entries (indices 0–19, representing Levels 1–20). If a player somehow accrues more XP, the level check returns `undefined`, the cap holds at 20, and the game continues without acknowledgment.

This is the space **Quest -1: The Open Door** occupies.

It is not a quest in the `QUEST_DB`. It is not journaled. It does not award gold. Its "mission bit" is set by the player opening the browser's developer console and typing a single line. The game will not guide them there. The lab report will.

This is intentional. The game ends by making the player a developer.

---

### XIV-B. Quest -1: The Open Door

**Trigger:** `S_story.level >= 20 && !S_story.questMinusOne`

**Surface:** A one-time text injection into the node description at CO (the final node) after the Void is sealed. Rendered as a Froberger-style scroll — same CSS class, same italic treatment, same fade-in — but with a different icon: `🔓`.

**Quest text (full):**

```
You are Level 20.

The Fighter Champion progression ends here. The crit window is 17–20.
You have two Action Surges per short rest. Indomitable has been yours
for eleven levels. There is no Level 21 in this build.

But the source file is 14,377 lines of readable JavaScript.
MONSTER_POOL has 370 keys. WORLD_DB has 66 terrain entries.
QUEST_DB has a completion function for each quest. The MIT License
has no restrictions.

Level 21 is undefined.
That is not a bug. That is the door.

If you want to continue, the next step is yours to write.
The tools are: a text editor, a browser, and the following commands:

    grep -n "MONSTER_POOL" roll2hit-v3.html
    grep -c "key:'" roll2hit-v3.html
    grep -n "^const QUEST_DB" roll2hit-v3.html

The markdown files in this directory keep the documentation synchronized.
The index.md explains the two-way sync rule.
plan.md §XIV describes the World Creator Wizard.

To mark this quest complete, open your browser console and type:
    S_story.questMinusOne = true; saveStory();

The game will not know whether you earned it.
That is also intentional.

— Froberger's margin note, Entry 42 (not yet written)
```

**State flag:** `S_story.questMinusOne` (boolean, default false)

**Completion:** Set manually by player via browser console. No automatic check. No reward. The act of opening the console is the reward.

**NG+ behavior:** `questMinusOne` is NOT preserved across NG+. It resets. The door opens again.

---

### XIV-C. The World Creator Wizard — Concept

The World Creator Wizard is not a UI feature inside the game. It is a **documented shell workflow** — a sequence of grep and sed commands that lets a developer safely add content to `roll2hit-v3.html` while keeping the markdown documentation synchronized.

The wizard operates in three phases:

**Phase 1 — Audit (read-only)**
Count what exists before touching anything. Establish a baseline.

**Phase 2 — Add (targeted write)**
Insert new content at a verified line number using sed. One entry at a time.

**Phase 3 — Sync (documentation update)**
Update the relevant markdown files to reflect the new count and content.

The shell is the wizard. The commands are the spells. The line numbers are the coordinates.

---

### XIV-D. Shell Tooling Reference — Data Integrity Promises

> **Promise:** Every grep count is a truth claim. Every sed insertion is verified before and after by count. Every markdown sync is exact. If the before-count and after-count differ by exactly 1, the insertion succeeded. If they differ by 0 or more than 1, do not proceed.

#### D1. Counting Entries

```bash
# Count all monster entries (baseline before any edit)
grep -c "key:'" roll2hit-v3.html
# Expected: 370

# Count WORLD_DB terrain entries
awk '/^const WORLD_DB/,/^const [A-Z]/' roll2hit-v3.html | grep -c "^  [a-z_]*:"
# Expected: 46 (base terrains; epic terrains counted separately)

# Count QUEST_DB side quests (non-epic)
grep -c "type:'side'" roll2hit-v3.html
# Expected: 6

# Count NPC_DIALOGUES NPCs
awk '/^const NPC_DIALOGUES/,/^};/' roll2hit-v3.html | grep -c "^  [a-z]*: {"
# Expected: 6

# Count mission bits in _missionComplete()
awk '/^function _missionComplete/,/^}/' roll2hit-v3.html | grep -c "S_story\."
# Expected: 12
```

#### D2. Finding Safe Insertion Points

```bash
# Find the line where MONSTER_POOL ends (the closing brace)
awk '/^const MONSTER_POOL/{found=1} found && /^};/{print NR; exit}' roll2hit-v3.html
# Returns: 4864 (use line 4863 to insert before closing brace)

# Find the last monster entry in MONSTER_POOL (line before closing brace)
sed -n '4858,4864p' roll2hit-v3.html
# Verify the last real entry before };

# Find QUEST_DB closing brace
awk '/^const QUEST_DB/{found=1} found && /^};/{print NR; exit}' roll2hit-v3.html
# Returns the line number to insert a new quest before

# Find _missionComplete() bits block
awk '/^function _missionComplete/,/^}/' roll2hit-v3.html | grep -n "S_story\."
# Shows each bit with its line offset within the function
```

#### D3. Adding a Monster (Safe Pattern)

```bash
# Step 1: count before
BEFORE=$(grep -c "key:'" roll2hit-v3.html)
echo "Before: $BEFORE"

# Step 2: find insertion line (last entry before MONSTER_POOL closing brace)
INSERT_LINE=$(awk '/^const MONSTER_POOL/{found=1} found && /^};/{print NR-1; exit}' roll2hit-v3.html)
echo "Inserting after line: $INSERT_LINE"

# Step 3: insert the new monster entry
# (edit this line with your monster's data)
NEW_ENTRY="  my_monster: { key:'my_monster', name:'My Monster', ac:13, hp:55, atk:6, dmgDie:8, dmgCount:2, dmgFlat:3, tier:'medium' },"

sed -i '' "${INSERT_LINE}a\\
${NEW_ENTRY}" roll2hit-v3.html

# Step 4: count after — must be BEFORE + 1
AFTER=$(grep -c "key:'" roll2hit-v3.html)
echo "After: $AFTER"
[ "$AFTER" -eq "$((BEFORE + 1))" ] && echo "✅ Count verified" || echo "❌ COUNT MISMATCH — revert"

# Step 5: sync documentation
sed -i '' "s/${BEFORE} monsters/${AFTER} monsters/g" monsters.md
sed -i '' "s/${BEFORE} monsters/${AFTER} monsters/g" index.md
sed -i '' "s/MONSTER_POOL\` (${BEFORE}/MONSTER_POOL\` (${AFTER}/g" plan.md
```

#### D4. Adding a Quest (Safe Pattern)

```bash
# Step 1: count side quests before
BEFORE=$(grep -c "type:'side'" roll2hit-v3.html)
echo "Before: $BEFORE side quests"

# Step 2: find QUEST_DB insertion point
INSERT_LINE=$(awk '/^const QUEST_DB/{found=1} found && /^};/{print NR-1; exit}' roll2hit-v3.html)

# Step 3: craft quest entry (minimum viable QUEST_DB entry)
# Replace all fields with your quest's data
NEW_QUEST="  quest_my_quest: { id:'quest_my_quest', type:'side', title:'My Quest Title',
    desc:'What the player is asked to do.',
    hint:'Where to go.',
    activateNode:'CI', completeItems:[], completeFn:() => !!(S_story.myQuestFlag),
    waypointNode:'SL', reward:100,
    disposition: '\"The NPC said something here.\" — NPC Name' },"

sed -i '' "${INSERT_LINE}a\\
${NEW_QUEST}" roll2hit-v3.html

# Step 4: verify
AFTER=$(grep -c "type:'side'" roll2hit-v3.html)
echo "After: $AFTER"
[ "$AFTER" -eq "$((BEFORE + 1))" ] && echo "✅ Quest added" || echo "❌ MISMATCH"

# Step 5: add state flag to _S_DEFAULTS (find its closing brace)
# grep -n "_S_DEFAULTS\|myQuestFlag" roll2hit-v3.html
# Then sed-insert: myQuestFlag: false,
```

#### D5. Adding a Mission Bit to `_missionComplete()`

```bash
# Step 1: show current bits
awk '/^function _missionComplete/,/^}/' roll2hit-v3.html | grep "S_story\."

# Step 2: find the closing line of the bits object
BITS_LINE=$(awk '/^function _missionComplete/{found=1} found && /return Object/{print NR-1; exit}' roll2hit-v3.html)

# Step 3: insert new bit (verify flag name matches S_story field)
NEW_BIT="    myQuestFlag: !!(S_story.myQuestFlag),"
sed -i '' "${BITS_LINE}a\\
${NEW_BIT}" roll2hit-v3.html

# Step 4: verify count
awk '/^function _missionComplete/,/^}/' roll2hit-v3.html | grep -c "S_story\."
# Must equal previous count + 1

# Step 5: update story.md FL8 Milepoint B bit list
# grep -n "Bits:" story.md
# sed-insert the new bit name into the comma-separated list
```

#### D6. Setting a Mission Bit Manually (The Player's Path)

The player does not run shell commands. The player opens the browser console:

```javascript
// Open browser DevTools → Console tab

// Check current quest state
console.log(JSON.stringify(S_story.quests, null, 2));

// Check mission bit status
console.log({
  yaelEscortUsed: S_story.yaelEscortUsed,
  brynnsJournalRead: S_story.brynnsJournalRead,
  // ... etc
});

// Complete Quest -1 manually
S_story.questMinusOne = true;
saveStory();
console.log("Quest -1 marked complete. The door is open.");

// Set your own quest's mission bit
S_story.myQuestFlag = true;
saveStory();
console.log("Your quest is complete. Count the bits.");
```

The `saveStory()` function writes `S_story` to `localStorage`. On next page load, the state persists. This is the "cookie" — the browser's local storage. The player can inspect it:

```javascript
// Read the full save state
JSON.parse(localStorage.getItem('roll2hit_autosave'));

// Check all mission bits at once
const bits = {
  yaelEscortUsed: !!S_story.yaelEscortUsed,
  brynnsJournalRead: !!(S_story.journalEntriesRead && S_story.journalEntriesRead.includes(7)),
  couperiSongReceived: !!S_story.couperiSongReceived,
  pachelbelPaidBack: !!(S_story.quests['quest_pachelbel_shipment'] === 'complete'),
  crovPitTrainingWins: (S_story.pitTrainingWins || 0) >= 3,
  bruhnsDepthsReported: !!S_story.bruhnsDepthsReported,
  allEbReturns: Object.values(S_story.ebReturnDone || {}).filter(Boolean).length >= 5,
  journalHalf: (S_story.journalEntriesRead || []).length >= 9,
  sealedVoid: !!(S_story.defeatedBattles && S_story.defeatedBattles['CO']),
  atLeastThreeFriends: Object.values(S_story.npcFavorability || {}).filter(v => v >= 1).length >= 3,
  noHighCurse: true, // check with _curseScore() in console
  returnedToCI: !!(S_story.visited && S_story.visited['CI'] && S_story.level >= 5),
};
const count = Object.values(bits).filter(Boolean).length;
console.log(bits);
console.log(`Mission complete: ${count}/12 bits set (need 8)`);
```

This is the exploration the user does on their own. The documentation points here. The game does not explain it. The console is the last dungeon.

---

### XIV-E. Synchronized Documentation Workflow

Every content addition requires documentation updates in the same increment. The markdown files are the second source of truth. The following table maps HTML changes to required doc updates:

| HTML Change | Required Doc Updates | Shell Command |
|-------------|---------------------|---------------|
| Add monster to `MONSTER_POOL` | `monsters.md` (count, new entry row), `index.md` (line count), `plan.md` (§II count) | `sed -i '' 's/370 monsters/371 monsters/g' monsters.md index.md` |
| Add terrain to `WORLD_DB` | `monsters.md` (new terrain section), `maps.md` (legend), `world.md` | Manual — terrain sections have prose |
| Add quest to `QUEST_DB` | `world.md` (quest table), `story.md` (if node-related), `plan.md` (§II QUEST_DB count) | Grep for quest table, sed-insert row |
| Add NPC to `BIRKA_NPC_PROFILES` | `world.md` (Birka Six table), `story.md` (node entry) | Manual — NPC sections have prose |
| Add mission bit to `_missionComplete()` | `story.md` FL8 Milepoint B, `lab-report-npc-dialogue-system.md` §Mission Bits | grep for bit list, sed-insert |
| Add EB node | `maps.md` (grid + legend), `story.md` (Q-codes), `monsters.md` (boss section), `plan.md` (EB count) | Multiple files — use the SP2 workflow |

**Verification loop after any change:**

```bash
# Run after every content addition to verify documentation matches HTML
echo "=== MONSTER COUNT ===" && grep -c "key:'" roll2hit-v3.html
echo "=== QUEST COUNT ===" && grep -c "type:'side'" roll2hit-v3.html
echo "=== TERRAIN COUNT ===" && awk '/^const WORLD_DB/,/^const [A-Z]/' roll2hit-v3.html | grep -c "^  [a-z_]*:"
echo "=== NPC COUNT ===" && awk '/^const NPC_DIALOGUES/,/^};/' roll2hit-v3.html | grep -c "^  [a-z]*: {"
echo "=== MISSION BITS ===" && awk '/^function _missionComplete/,/^}/' roll2hit-v3.html | grep -c "S_story\."
echo "=== DOC MONSTER COUNT ===" && grep -m1 "[0-9]* monsters" monsters.md
```

Every line of this output is a promise. If the HTML count and the doc count differ, there is a sync error. The error must be fixed before the next increment.

---

### XIV-F. Story Integration — story.md and mechanics.md Additions

**In `story.md`:** Add a node-level entry for CO (the Convergence node) documenting the Quest -1 injection. Quest -1 text renders as a Froberger scroll after the victory screen, gated by `level >= 20 && !questMinusOne`. The text should direct the player to `plan.md §XIV` and to their browser console.

**In `mechanics.md`:** Add a §World Creator sub-section under the Advancement section. This section advises the reader:
- How `XP_LEVELS` caps at Level 20 (index 19)
- That Level 21 is architecturally undefined
- That `_levelUp()` can be extended by copying the existing pattern
- That the stat blocks in `MONSTER_POOL` follow a consistent schema (ac/hp/atk/dmgDie/dmgCount/dmgFlat/tier) and new entries are safe to add at the tail of the object
- That `WORLD_DB` terrain entries reference `MONSTER_POOL` keys in their `monsters: []` array
- Shell tooling reference pointing to plan.md §XIV-D

**In `index.md`:** Add a new lab report entry for this section once the feature is implemented:
```
#### `lab-report-world-creator.md` — Fork, Extend, and Quest -1 *(Layer 49 PLANNED)*
```

---

### XIV-G. Implementation Steps (Layer 49)

These steps are deliberately left to the user. Each step is a self-contained change with a shell verification. The order matters. Do not skip the count verification.

1. **Add `questMinusOne: false`** to `_S_DEFAULTS()` in the HTML
   - Verify: `grep -c "questMinusOne" roll2hit-v3.html` returns ≥ 1

2. **Add Quest -1 text injection** to `storyRender()` at CO node  
   - Gate: `if (node.code === 'CO' && S_story.level >= 20 && !S_story.questMinusOne)`
   - Render using existing Froberger scroll CSS class
   - Text: verbatim from §XIV-B above

3. **Add story.md node entry** for Quest -1 injection at CO  
   - Add milepoint note under CO node description
   - Cross-reference §XIV

4. **Add mechanics.md §World Creator** section  
   - `XP_LEVELS` cap, Level 21 undefined, monster schema, shell tools
   - Cross-reference plan.md §XIV-D

5. **Update index.md** Review Plan table with new row 55: Quest -1 + World Creator Wizard

6. **Write `lab-report-world-creator.md`** (optional — after building)  
   - IEEE format, full walkthrough of adding one monster, one quest, one mission bit
   - Shell session transcript showing count-before / insert / count-after / doc sync
   - Philosophy section: the player who opens the console is the next developer

7. **NG+ preservation check**: `questMinusOne` must NOT be in the preserved fields list of `storyNewGamePlus()` — the door reopens every run

---

### XIV-H. The MIT License as Game Mechanic

The license is the last item in the inventory. It cannot be equipped, sold, or dropped. It has no icon. Its sell value is 0. Its effect is permanent.

```
Name: MIT License
Type: key
Description: Fork this. Name your world. Write your own Froberger.
             No permission required. No attribution required.
             The only condition: include this when you distribute.
Effect: Unlocks Level 21 in the fork of your choice.
Sell: 0
```

The World Creator Wizard does not run in a browser. It runs in a terminal. Its inputs are grep counts and line numbers. Its outputs are verified data structure insertions and synchronized documentation. Its final output is a fork — a new file, a new world, a new set of people in the inn.

The original game will not know. That is also intentional.

---

*§XIV status: ✅ Implemented 2026-05-25. `questMinusOne:false` added to `_S_DEFAULTS()`. Quest -1 scroll injects at CO node when `level >= 20 && !questMinusOne`. Uses `.sweelinck-variant` CSS, border tinted olive. Text updated to 16,024 lines / 423 entries / 67 terrains. `storyAutoSave()` corrected from spec's `saveStory()`. Lab report optional.*

---

## Section XV — The NG+ Remembrance Layer: Entry 42 (Layer 50, ✅ Implemented 2026-05-25)

> **Philosophy:** The game begins with finding Froberger's journal. He documented what he learned so you wouldn't have to start from zero. By New Game+, you have already done what Froberger did — you walked the world, you chose who to help, you sealed the Void. The question §XV asks is: *what do you leave behind for the next run?*
>
> Layer 50 is the layer that closes the loop.

---

### XV-A. The Premise

Froberger's journal has 41 entries. Entry 42 is mentioned exactly once — in Quest -1:

> *"— Froberger's margin note, Entry 42 (not yet written)"*

Entry 42 is not Froberger's to write. He is dead. The researcher at the inn, the man who mapped every terrain — he ran out of time before he ran out of world.

Entry 42 belongs to whoever came after him. On NG+, that is the player.

---

### XV-B. Trigger Conditions

The Remembrance Layer activates on New Game+ (ngPlusRun ≥ 1) under the following conditions:

| Condition | State field | Notes |
|-----------|-------------|-------|
| At least one prior completed run | `ngPlusRun >= 1` | Guaranteed in any NG+ session |
| At least 3 NPCs at Dear Friend in prior run | Preserved `npcFavorability[key] >= 2` for ≥ 3 keys | Dear Friend is fav=2 or 3 |
| Quest -1 completed in prior run | `questMinusOne === true` at time of NG+ transition | The door was opened |

If all three conditions are met: **full Remembrance Layer** (Entry 42 + extended NPC memory + new quest chain).

If only ngPlusRun ≥ 1 (no other conditions): **basic NG+ only** — existing NPC_NG_PLUS_GREETINGS fire as normal; no Entry 42 system.

---

### XV-C. Entry 42 — The Player Writes It

**Trigger:** On first arrival at the INN (CI node, Act I) in a qualifying NG+ run. Before the inn text renders, a modal fires.

**Modal title:** `📓 Froberger's Journal — Entry 42`

**Modal text:**

> *The innkeeper sets the journal on the table without being asked. She remembers you.*
>
> *"He left this. You know who I mean. You were here before. You know what happened to him."*
>
> *Entry 42 is blank. It always has been. Froberger ran out of time before he ran out of world.*
>
> *What do you write?*

**Input:** A `<textarea>` — 400 character maximum. Placeholder: *"One sentence. The most important thing you learned."*

**Buttons:** `[WRITE IT]` / `[LEAVE IT BLANK]`

- **Write It:** Saves the textarea content to `S_story.entry42Text` (string). Sets `S_story.entry42Written = true`. The journal entry appears in the FROBERGER_JOURNAL sidebar as "Entry 42 — Your Hand."
- **Leave It Blank:** Sets `S_story.entry42Written = true` but saves `entry42Text = ""`. Entry 42 appears as: *"Entry 42 — blank page. The margin says: I know. I was there too."*

Either choice marks the quest chain active.

---

### XV-D. Entry 42 in the Journal

If `entry42Written = true`, the FROBERGER_JOURNAL sidebar renders a 42nd entry at the bottom:

```
📓 ENTRY 42 — YOUR HAND

[player text, or the blank-page line]

——
Found at the inn. Written in different handwriting than the other 41.
The innkeeper says she kept a blank page at the back. Just in case.
```

On NG+2 and beyond, if the player wrote an entry in NG+1, that text persists via `localStorage`. The journal they found in their first run — the journal Froberger left — now ends with something they wrote. The loop is closed.

---

### XV-E. Extended NPC Memory — Dear Friend Callbacks

Preserved `npcFavorability` already enables `NPC_NG_PLUS_GREETINGS`. The Remembrance Layer adds a **second visit callback** — a different line that fires on the second NPC encounter in NG+, after the greeting. Gated by fav ≥ 2 (Dear Friend) in the preserved state.

These are not stored in `NPC_DIALOGUES` — they are a separate small constant `NPC_NG_MEMORY_LINES` (6 entries, 1 per NPC):

| NPC | Memory line |
|-----|-------------|
| Yael | *"You came back to the slums. I thought you would. People who fix things usually come back to see if they stayed fixed."* |
| Brynn | *"The ledger's still balanced. I check it every morning. Old habit. You taught me that."* |
| Quill | *"I've been playing the song you helped me get back. Different every night. I think that's the right way."* |
| Pachelbel | *"The shipment arrived. Eventually. You know — it always does, when someone's watching for it."* |
| Weckmann | *"The pit's quieter now. The regulars remember someone fought clean. They copy it. Funny how that works."* |
| Auros | *"The depths are still there. We just know what's in them now. That's different from safe. But it's better."* |

**Trigger:** Second NPC visit in NG+ AND `npcFavorability[key] >= 2` preserved. Each line fires once per NG+ run (flag: `S_story.ngMemoryDelivered[npcKey]`).

---

### XV-F. Quest Chain — "The Next Froberger" (Q-NG-01 through Q-NG-03)

**Quest-giver:** The innkeeper at CI. Triggers after Entry 42 modal resolves.

> *"He used to say someone would come back and finish what he started. I thought he meant the journal. But I think he meant the rest of it."*
>
> *She slides a folded note across the table. It's in Froberger's handwriting — but addressed to no one. The last line reads: "If you're reading this, you already know what to do next."*

---

**Q-NG-01: "Return Address"** — Visit all 6 Dear Friends in NG+ (any order)
- Condition: `npcFavorability[key] >= 2` for all 6 keys AND each visited once in current NG+ run
- Reward: 500gp + `froberger_letter` item (lore, sell:0; readable — shows Froberger's unaddressed note in full)
- Brynn (on completion): *"Six of us. He knew about all of us. He was watching. I don't know how that feels — being known by a dead man."*

---

**Q-NG-02: "The Margin"** — Read your own Entry 42 from the journal sidebar
- Condition: `entry42Written = true` AND player opens journal sidebar AND scrolls to Entry 42 (`entry42Read = true`)
- Reward: 200 XP + `margin_note` item — *"A blank margin. The best kind."* (sell:0; no mechanical effect)
- Froberger's last collectible entry (Entry 41) gains a new closing line in NG+: *"Entry 42 — I left the page. I knew someone would need it."*

---

**Q-NG-03: "What He Started"** — Complete all 6 Birka quests again in NG+ (same IDs, re-activated)
- Condition: All 6 QUEST_DB side quests marked 'complete' in the current NG+ run
- Reward: `researchers_kit` — *"A field kit. Worn grip, clean lens. He used it every day for nine years."* (sell:0; inventory item; unlocks a special line from Auros at the journal page)
- Auros (on completion): *"You know what I found in his kit? A note that said 'count everything twice.' That's it. That's all his method was. Count everything twice."*

**Quest chain complete reward:** `S_story.nextFrobergerComplete = true` flag. On arrival at CO in NG+, after the Void is sealed: a second scroll fires, using the Froberger scroll CSS class, `🔓` icon:

> *You sealed it again.*
>
> *The journal has 42 entries now. One of them is yours.*
>
> *Froberger counted everything twice. That's all his method was.*
>
> *This run is the second count.*

---

### XV-G. New State Fields (additions to `_S_DEFAULTS()`)

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `entry42Written` | boolean | false | Entry 42 modal has been resolved (write or skip) |
| `entry42Text` | string | `""` | Player-authored text; empty = blank-page variant |
| `entry42Read` | boolean | false | Player opened journal to Entry 42 in current NG+ run |
| `ngMemoryDelivered` | object | `{}` | npcKey → true; each Dear Friend memory line fires once per NG+ run |
| `nextFrobergerComplete` | boolean | false | Q-NG-01 through Q-NG-03 all complete in this run |
| `frobergerLetterFound` | boolean | false | `froberger_letter` item acquired (Q-NG-01 reward) |

> **NG+ preservation:** `entry42Written` and `entry42Text` ARE preserved across NG+ — the player's entry persists. All other fields reset to defaults on each NG+ transition (the memory lines fire fresh each run).

---

### XV-H. Items

```js
// froberger_letter — Q-NG-01 reward
{ name:'Froberger\'s Unaddressed Note', icon:'📜', type:'readable', sell:0,
  description:'A letter written to no one. The last line: "If you\'re reading this, you already know what to do next."' }

// margin_note — Q-NG-02 reward
{ name:'Margin Note', icon:'📄', type:'lore', sell:0,
  description:'A blank margin. The best kind.' }

// researchers_kit — Q-NG-03 reward
{ name:'Researcher\'s Field Kit', icon:'🔬', type:'lore', sell:0,
  description:'Worn grip. Clean lens. Nine years of daily use. A note inside: "Count everything twice."' }
```

---

### XV-I. Documentation Updates Required on Implementation

| File | Change |
|------|--------|
| `story.md` | Add Q-NG-01 through Q-NG-03 in §New Game+ section; add Entry 42 modal description at CI node; add CO second scroll text |
| `world.md` | Add NPC_NG_MEMORY_LINES table to §NPC Dialogue System; note extended Dear Friend memory trigger |
| `mechanics.md` | Add Entry 42 under §Save System (persists across NG+ runs); add 3 new lore items to §Items |
| `plan.md` | Mark XV-A through XV-I complete after implementation |

---

### XV-J. Thematic Coherence Note

The game opens with a dead man's journal. Entry 1 is at the first terrain Froberger visited. Entry 41 is at CO — the last node, the convergence, where the Void lived. Entry 42 is blank.

The player spends 20 levels learning what Froberger knew. They learn from his mistakes, follow his trail, find his friends. By Level 20, by the Void sealed, by Quest -1 opened — they have done exactly what Froberger did. The difference is: they survived.

What Froberger never got to do was write the entry about what happened after. He died documenting the problem. The player sealed it.

Entry 42 is the entry about the solution. It belongs to whoever wrote it.

---

*§XV status: ✅ Implemented 2026-05-25 — NPC_NG_MEMORY_LINES const; Entry 42 CI modal; journal append; Q-NG-01/02/03 in QUEST_DB; CO Froberger letter; storyNewGamePlus flag preservation.*

---

## Section XVI — The Weimar Scholar Gate: Tomes and the Fourth Hub (Layer 51, ✅ Implemented 2026-05-25)

> **The gap:** Weimar is the fourth hub town — the scholars' city, home of the Scholar Kings — but it receives the least development of the four hubs. Birka has six named NPCs and a full quest arc. Tilbury has the merchant harbor and a vendor. Visby is the enemy stronghold with gate drama. Weimar has Leeuwenhoek's shop (S51 items) and a name. This section gives Weimar a story identity.

> **The theme:** Froberger was a researcher. He came from somewhere. He studied at somewhere. Weimar is where scholars study things like the Void — and where access to that knowledge is controlled by people who have decided what others are allowed to know. The Curse of Knowledge has an institutional form. It lives in Weimar.

---

### XVI-A. The Setting — Weimar Scholars' District

**Node:** WM — Weimar (existing hub node, Act V–VII range)

Weimar is a walled city within a city — the Scholar Kings occupy the upper district, accessible through a gated archive passage. The lower district is open: traders, messengers, researchers without guild affiliation, and the occasional ex-Scholar who left or was asked to leave. Leeuwenhoek's shop is in the lower district. The gate is between them.

**The Scholar Gate** — an actual locked passage in the upper district. Not a GATE_LOCKS item gate — a quest-gated NPC interaction. The senior Scholar King, Archivist Isolde Voss, controls access. She determines what qualifies as legitimate research. She has decided that the Void is not a legitimate research topic.

Froberger had his access revoked six months before he died.

---

### XVI-B. New NPCs

**Archivist Isolde Voss** — Node WM (lower district, blocking the gate)
- Occupation: Senior Archivist, Scholar Kings First Tier. Keeper of the Gate Records.
- First impression: Not hostile. Precise. Everything she says is technically correct.
- Demeanor: She believes access restriction is a form of care. Research without certification causes harm. She has 30 years of examples.
- Fav gating: Starts Impartial. Requires Q-WM-02 completion to reach Friendly. Cannot reach Dear Friend in Act V — only after CO (if returning in NG+, she has processed what happened).

> *"You're asking about Froberger. Everyone who comes here lately is asking about Froberger. He was a credentialed researcher. His access was revoked pursuant to the Scholar Kings Protocol on Speculative Endangerment. That is the extent of what I can tell you."*

> *(Friendly, after quest):* *"He left his research notes in the lower archive. I moved them there myself. I told myself it was protocol. I've been thinking about that since you came in."*

---

**Benedikt Rasp** — Node WM (lower district, near Leeuwenhoek's shop)
- Occupation: Ex-Scholar, Tier 3 (resigned — or near enough). Now runs an informal reading circle out of the back of a bookbinder's stall.
- Relationship to Froberger: Knew him. Was his student for two years. Watched the access revocation happen. Kept some of Froberger's early notes.
- Fav gating: Starts Friendly (he's not suspicious of anyone, just tired). Reaches Dear Friend after Q-WM-03.

> *"The Scholar Kings don't lock up knowledge because they want to hoard it. They lock it up because they're afraid of what happens when the wrong person finds the right thing and does something about it. They were right about Froberger. He found the right thing. He just wasn't the wrong person — that's the part they got wrong."*

---

### XVI-C. New Item Category — Tomes

Tomes are passive research documents. They have no combat use. They sit in inventory. While they are held, a bonus applies. They cannot be equipped to a weapon or shield slot — they are a new item type: `type:'tome'`.

**Mechanic:** `_applyTomeBonuses(combatState)` — called at battle start. Checks inventory for `type:'tome'` items. Applies each tome's bonus to the battle state. Multiple tomes stack.

**Three tomes added in §XVI:**

| Tome | Source | Bonus | Lore |
|------|--------|-------|------|
| `tome_void_pressure` | Q-WM-02 reward | +1 to all death save rolls | *"Froberger's field notes on the Void Tide advance. Margin: 'The pressure is survivable if you know it's coming.'"* |
| `tome_scholar_kings` | Q-WM-03 reward | +2 to all initiative rolls | *"A history of the Scholar Kings' martial governance. Chapter 7: 'First knowledge, then decision, then action. Never the other order.'"* |
| `tome_rasp_annotated` | Benedikt Rasp (Dear Friend) | +1 to all ATK rolls while any active quest is in `S_story.quests` | *"Benedikt's annotated copy of Froberger's early theory. The annotations are longer than the text. 'He was right about this one too.'"* |

**Item shape:**
```js
{ name: 'Froberger\'s Field Notes', icon: '📗', type: 'tome', sell: 0,
  bonus: { deathSave: 1 },
  description: 'Margin: "The pressure is survivable if you know it\'s coming."' }
```

Tomes cannot be sold (`sell: 0`). Auto-sell (`_autoSellDuplicates()`) ignores them. They persist through NG+.

---

### XVI-D. Quest Chain — "What the Gate Keeps" (Q-WM-01 through Q-WM-04)

**Q-WM-01: "The Revocation Record"** — Trigger: first visit to WM node, Act V+

- NPC: Archivist Isolde Voss (at the gate)
- Dialogue: She mentions the Froberger revocation unprompted if player has any Froberger journal entry read. Does not offer the record. Says it's sealed.
- Task: Find 3 Scholar Kings' Seal items (drops from `scholars_guard` monsters in WM terrain — new monster, see XVI-E) OR bring her the `archive_letter` item (already obtainable from CI Blue Shutters Archive, S7 quest chain)
- If player has `archiveLetterObtained = true`: quest skips the seal-hunting step entirely. The archive letter IS a Scholar Kings seal-class document. Isolde accepts it. She did not expect someone to have one.
- Reward: Access to the Lower Archive (flag: `wmLowerArchiveUnlocked`). +Froberger context note in the journal sidebar.

---

**Q-WM-02: "Lower Archive"** — Trigger: `wmLowerArchiveUnlocked` set, WM node

- Task: Read the 3 archived documents in the Lower Archive (a small modal with three text entries: Froberger's access revocation letter, a Scholar Kings field report on early Void signs, and a personnel file on someone called "the First Researcher")
- No combat required. Each document is a [READ] button in the archive modal. Setting `wmDoc1Read / wmDoc2Read / wmDoc3Read` flags.
- Reward on all three read: `tome_void_pressure` (Froberger's Field Notes tome) + `wmArchiveComplete` flag + Isolde Voss moves to Friendly.
- Isolde (Friendly): *"He left his research notes in the lower archive. I moved them there myself. I told myself it was protocol. I've been thinking about that since you came in."*

---

**Q-WM-03: "Benedikt's Circle"** — Trigger: `wmArchiveComplete` set + speak to Benedikt Rasp

- Task: Attend 3 of Benedikt's reading circle sessions. Each session requires a visit to WM on a different in-game day (`wmSessionsDays` array of unique day values). Each session adds a brief text entry to the quest log — excerpts from Froberger's early notes, filtered through Benedikt's commentary.
- Day spacing: each session must be on a different day (not consecutive — the circle meets irregularly). Player must leave WM and return at least twice.
- Reward on third session: `tome_scholar_kings` + Benedikt reaches Dear Friend + `wmBenediktCircleComplete` flag.
- Benedikt (Dear Friend): *"The third one's always the hardest. Not because the material is harder — because by then you realize the first two were already enough and you stayed anyway."*

---

**Q-WM-04: "The First Researcher"** — Trigger: `wmBenediktCircleComplete` set + Benedikt at Dear Friend

- This quest reveals who "the First Researcher" was. The personnel file from Q-WM-02 named them but gave no identity. Benedikt knows. He has known since Q-WM-01. He waited to see if you were the kind of person who would stay for three sessions.
- The First Researcher is not a name the player knows — but the dates in the file match the dates of the first Void Tide events, a generation before Froberger. Froberger was not the first. He knew he was not the first. Entry 7 of his journal references a "predecessor" without naming one.
- Task: Return to the lower archive and read Document 3 again (the personnel file) — it now shows the unredacted name. `wmDoc3Unredacted` flag set by Benedikt's dialogue.
- Reward: `tome_rasp_annotated` (Benedikt's annotated copy) + 300gp + `wmFirstResearcherKnown` flag.
- Benedikt: *"The Scholar Kings didn't erase her. They just stopped saying the name. Froberger said it in his margin notes every time. That's how I found her. And now you know how I found him."*

---

### XVI-E. New Monster — `scholars_guard`

Needed for Q-WM-01 (seal drop) and for WM terrain combat.

| Key | Name | AC | HP | ATK | Dmg | Tier | Drop |
|-----|------|----|----|-----|-----|------|------|
| `scholars_guard` | Scholar's Guard | 14 | 45 | +5 | 1d8+3 | medium | Scholar Kings' Seal (icon: 🔏, sell: 20) |

**Add to WORLD_DB terrain:** `scholars` or `city` (whichever covers Weimar nodes in HTML).

**MONSTER_DROPS:** `scholars_guard → { name:'Scholar Kings\' Seal', icon:'🔏', sell:20 }`

---

### XVI-F. New State Flags (additions to `_S_DEFAULTS()`)

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `wmLowerArchiveUnlocked` | boolean | false | Access to lower archive granted (Q-WM-01) |
| `wmDoc1Read` | boolean | false | Revocation letter read |
| `wmDoc2Read` | boolean | false | Void field report read |
| `wmDoc3Read` | boolean | false | Personnel file read (redacted) |
| `wmDoc3Unredacted` | boolean | false | Personnel file re-read after Benedikt reveals name |
| `wmArchiveComplete` | boolean | false | All 3 archive docs read |
| `wmSessionsDays` | array | `[]` | Day numbers of attended reading circle sessions |
| `wmBenediktCircleComplete` | boolean | false | 3 sessions attended |
| `wmFirstResearcherKnown` | boolean | false | Unredacted personnel file read |

---

### XVI-G. Insertion Spec for `roll2hit-v3.html`

**Layer tag:** Layer 51 — Weimar Scholar Gate

1. Add `scholars_guard` to `MONSTER_POOL` and `MONSTER_DROPS`
2. Add `scholars_guard` to appropriate `WORLD_DB` terrain (verify Weimar terrain key in HTML)
3. Add `TOME_BONUSES` helper or inline tome bonus application in `storyPreBattle()` / `storyCommitBattle()` — scan inventory for `type:'tome'`, apply `.bonus` fields
4. Add 3 tome items (void_pressure / scholar_kings / rasp_annotated) to a new `TOME_ITEMS` const or inline in quest reward delivery
5. Add Isolde Voss and Benedikt Rasp to `BIRKA_NPC_PROFILES` equivalent (or a new `WM_NPC_PROFILES` if Birka-only restriction applies)
6. Add Q-WM-01 through Q-WM-04 to `QUEST_DB`
7. Add 16 new state flags to `_S_DEFAULTS()`
8. Add archive modal (`_storyWmArchiveModal()`) — 3-document viewer with [READ] buttons
9. Add reading circle session check to WM node render (day-gated, 3 required)

**MONSTER_POOL count after:** 370 + 1 = 371

---

### XVI-H. Documentation Updates Required on Implementation

| File | Change |
|------|--------|
| `monsters.md` | Add `scholars_guard` entry; update count 370→371 |
| `story.md` | Add WM node arc section; Q-WM-01 through Q-WM-04 quest beats; Isolde and Benedikt NPC profiles |
| `world.md` | Add Isolde Voss and Benedikt Rasp to NPC section; add tome item category |
| `mechanics.md` | Add §Tomes — `type:'tome'` item shape, bonus application, NG+ persistence |
| `index.md` | Add Scholar Gate arc note to Weimar entry |
| `plan.md` | Mark XVI-A through XVI-H complete after implementation; update §V-A queue |

**Lab report required:** `lab-report-weimar-scholar-gate.md` — covers new item category (Tomes), new NPC arc, archive modal design, and the Froberger/First Researcher revelation as a narrative design decision.

---

### XVI-I. Thematic Coherence Note

The Curse of Knowledge score tracks whether the player shared what they learned. The Scholar Kings are its institutional counterpart — an organization that decided, systematically, that some knowledge should not be shared. They are not villains. Isolde Voss is not a villain. She genuinely believes that uncontrolled access to Void research causes harm.

She is correct. Froberger's research did cause harm. He went into the field. He died.

The question §XVI asks — the same question the game asks about the Curse of Knowledge — is whether that harm was from the knowledge or from the withholding. Froberger knew. He shared. He died, but the player is alive because of what he left. The First Researcher knew. She did not share. Nobody knows her name. The Void still came.

Benedikt's annotated copy gives the player +1 ATK while on an active quest. The tomb says: knowledge in service of action is the only kind that works.

---

*§XVI status: ✅ Implemented 2026-05-25 — scholars_guard monster + drop; 3 tomes (Field Notes / Scholar Kings' History / Annotated Copy) with `_tomeBonuses()` applied to initiative, death saves, and ATK; Isolde Voss and Benedikt Rasp NPC profiles; Q-WM-01 through Q-WM-04 in QUEST_DB; `_storyWmArchiveModal()` with 3 documents; reading circle (day-gated, 3 sessions); 9 state flags; SQ NPC card rendering.*

---

## Section XVII — Void Archaeology: The Origin Investigation (Layer 52, ✅ Implemented 2026-05-25)

> **The gap:** The player seals the Void and wins. The ending notices whether they shared what they learned. But nobody — player or NPC — ever learns what the Void actually *was*. The Froberger research chain (41 journal entries), the First Researcher revelation (§XVI), and Entry 42 (§XV) form a knowledge chain. This section gives that chain a destination.

> **The theme:** The Void was not a natural phenomenon. It was a containment structure — built to hold something called the Antecedent. The cage was never supposed to expand. The Void Tide is the cage failing. The CO victory didn't destroy the Void: it activated the stabilization mechanism. The player sealed the cage. They just didn't know that's what they were doing — until now.

> **Prerequisites:** NG+ run (`ngPlusRun ≥ 1`) + `wmFirstResearcherKnown` (from §XVI) + `entry42Written` (from §XV). Without all three, the five overlay sites are normal nodes. No content is locked — only the interpretation layer.

---

### XVII-A. The Five Investigation Sites

No new nodes. Five existing nodes gain a `[INVESTIGATE]` button in NG+ when prerequisites are met. Each site reveals one piece of the picture.

| Node | Location | What the player finds |
|------|----------|-----------------------|
| CI | Blue Shutters Archive | A partial shelf record: *"Researcher Category: Containment, Date: [REDACTED]."* The same shelf that held the archive letter. She worked here. |
| DF | Defiant Fields | A stone alignment in the scorched terrain. Not random — spaced to a mathematical interval. The battle happened at the activation point, not a random field. |
| WM | Weimar lower archive | Document 3 again — but now the project codename is visible: *"ANTECEDENT CONTAINMENT PROTOCOL."* The word "Void" appears nowhere in the original documents. |
| SL | Birka Slums | An old carved marker on a building corner. The mark matches the DF stones. This building predates the city by 80 years — predates the Scholar Kings. |
| MT | Mountain Pass | A sealed access tunnel. *"Never opened by anyone in the records. Sealed before the Scholar Kings existed."* Not collapsed — sealed from inside. |

Collecting all five: `vaAllMarksFound = true`.

---

### XVII-B. The Revelation — Who Built It

**The First Researcher did not merely study the Void. She built it.**

Specifically: she built a containment structure — a pressure cage — to trap something she called the Antecedent. She did not know what the Antecedent was. She knew it could not be destroyed. She knew it could be contained. The cage required a destabilization event to seal — it had to be opened before it could be closed.

The Void Tide is the cage expanding because nobody activated the sealing mechanism. Froberger's research was aimed at the stabilization mechanism, not the Void itself. The CO victory activated it. The player didn't destroy the Void. They closed the cage.

Entry 7 of FROBERGER_JOURNAL references *"a predecessor"* without a name. That is her. He found her records in the Weimar lower archive (before access revocation — the revocation letter was about this research). He knew the cage was failing. He documented it. The player followed his trail.

Entry 42, written by the player in §XV, is now the fourth document in a chain: her 7 entries → Froberger's 41 → Entry 42. Benedikt Rasp carries the reading circle annotations. That is four authors. The cage is closed, the chain holds.

---

### XVII-C. Quest Chain — "The Architecture" (Q-VA-01 through Q-VA-04)

**Q-VA-01: "Five Marks"** — Trigger: NG+ active + prerequisites met + first investigation site visited

- No NPC. The `[INVESTIGATE]` button appears at each of the five nodes.
- Each gives one paragraph of overlay text (see XVII-A).
- Reward on all five: `vaAllMarksFound = true` + quest log entry: *"Five marks. One pattern. She was everywhere before anyone was looking."*

---

**Q-VA-02: "The Constructor's Log"** — Trigger: `vaAllMarksFound`

- Location: WM lower archive. Document 3 modal gains a 4th document: **The Constructor's Log** — 7 entries, written in the First Researcher's hand, embedded in the margin of the personnel file.
- The 7 entries:
  1. *"The Antecedent cannot be destroyed. It can be contained."*
  2. *"The containment structure requires a destabilization event to trigger the sealing mechanism. In plain terms: the cage must be opened before it can be closed."*
  3. *"I have calculated the destabilization event. It is survivable — if the person inside it knows it is coming."*
  4. *"The Scholar Kings do not know what I built. I told them it was a ward. They accepted that. I am not sure I was lying."*
  5. *"The stones are placed. The archive is sealed. The tunnel is closed. When it opens, the mechanism will know."*
  6. *"I am leaving my name off this record. If someone finds it, they will know why."*
  7. *"If someone is reading this, the sealing mechanism has activated. The cage is closed. Whatever you sealed inside it — that is what I built this for. I am sorry. I did not have a better answer."*
- Reward: `constructor_log` item + `void_architect_seal` item + `vaLogFound = true`
- Tome connection: Entry 3 of the Constructor's Log matches the margin note in `tome_void_pressure` word for word. Froberger copied it. He knew whose margin it was.

---

**Q-VA-03: "The Sealed Tunnel"** — Trigger: `vaLogFound`

- MT node gains `[OPEN THE TUNNEL]` when `vaLogFound` is set.
- Opening requires: (a) `void_architect_seal` in inventory, OR (b) `tome_void_pressure` in inventory (proves Froberger research chain complete).
- Inside: a short text chamber. No combat. Six sentences describing the first field test of the containment structure — 200 years before the game. The last sentence: *"The Antecedent was here. It is not anymore. You know where it is now."*
- Reward: `vaLastWardVisited = true` + 200gp

---

**Q-VA-04: "The Architecture"** — Trigger: `vaLastWardVisited` + `entry42Written`

- Benedikt Rasp delivers a message on next WM node visit.
- *"She built it. You closed it. Froberger found the mechanism. You followed him. Entry 42 is the fourth link. Four links is a chain. A chain holds. That is the only kind of answer this work produces — not a solution, a chain."*
- Reward: `vaArchitectureKnown = true` + 500gp + `tome_rasp_annotated` gains a second line of lore: *"One annotation, added later: 'She was right. The fourth link held.'"*

---

### XVII-D. New Items

| Key | Name | Icon | Type | Sell | Effect |
|-----|------|------|------|------|--------|
| `void_architect_seal` | Antecedent Seal | 🏛️ | relic | 0 | *"The Antecedent Containment Protocol. Seal 7. Activated."* Passive — no bonus; narrative object. Persists through NG+. Required for MT tunnel (or `tome_void_pressure`). |
| `constructor_log` | The Constructor's Log | 📜 | readable | 0 | 7-entry journal; readable from inventory. Sets `vaLogFound` on read. |

Both items: `sell: 0`, auto-sell ignores them, NG+-persistent.

---

### XVII-E. New State Flags

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `vaCI` | boolean | false | CI investigation site visited |
| `vaSL` | boolean | false | SL investigation site visited |
| `vaDF` | boolean | false | DF investigation site visited |
| `vaWM` | boolean | false | WM investigation site visited |
| `vaMT` | boolean | false | MT investigation site visited |
| `vaAllMarksFound` | boolean | false | All five sites visited (Q-VA-01 complete) |
| `vaLogFound` | boolean | false | Constructor's Log obtained (Q-VA-02 complete) |
| `vaLastWardVisited` | boolean | false | MT tunnel opened (Q-VA-03 complete) |
| `vaArchitectureKnown` | boolean | false | Benedikt's message received (Q-VA-04 complete) |

---

### XVII-F. The Fifth Ending — The Acknowledgment

Not a new ending screen. An addendum to the existing CO node in NG+.

**Condition:** `vaArchitectureKnown = true` AND `entry42Written = true` AND `ngPlusRun ≥ 1`

The CO outro appends: *"Froberger wrote 41 entries. You wrote one. She wrote 7, and no one counted them for 200 years. The cage is closed. You know what it holds. The story has four authors now."*

The curse score text gains a final line: *"You knew. You told someone. That is the only thing that changes anything."*

The Sweelinck question (`#victory-question`) in this condition replaces its standard text with: *"What was inside the cage?"* — and accepts no answer. The question is the ending.

---

### XVII-G. Insertion Spec for `roll2hit-v3.html`

**Layer tag:** Layer 52 — Void Archaeology

1. Add `[INVESTIGATE]` button to CI, DF, WM, SL, MT node renders — gated: `ngPlusRun ≥ 1 && wmFirstResearcherKnown && entry42Written`
2. Add 4th document to WM archive modal (`_storyWmArchiveModal()`) — Constructor's Log 7 entries; gated: `vaAllMarksFound`
3. Add 2 new items to a `RELIC_ITEMS` const or inline in Q-VA-02 reward delivery
4. Add `[OPEN THE TUNNEL]` to MT node render — gated: `vaLogFound && (inv.void_architect_seal || inv.tome_void_pressure)`
5. Add Q-VA-01 through Q-VA-04 to `QUEST_DB`
6. Add 9 new state flags to `_S_DEFAULTS()`
7. Add CO outro addendum — gated condition in `storyRenderCO()` or equivalent
8. Modify Sweelinck question render — gated condition appends final text

**MONSTER_POOL count after:** unchanged (370 or 371 if §XVI is also implemented).

---

### XVII-H. Documentation Updates Required on Implementation

| File | Change |
|------|--------|
| `story.md` | Add §XVII quest chain Q-VA-01 through Q-VA-04; CO outro addendum note; Constructor's Log text |
| `world.md` | Add Constructor's Log summary to the First Researcher entry (from §XVI stub); add Antecedent Containment note |
| `mechanics.md` | Add `type:'relic'` item shape; add readable-from-inventory note for `constructor_log` |
| `index.md` | Add Void Archaeology arc note |
| `plan.md` | Mark XVII complete after implementation; update §V-A queue |

**Lab report required:** `lab-report-void-archaeology.md` — covers the "revelation-as-recontextualization" design pattern (CO victory retroactively meant more), Antecedent Containment as the Void's actual nature, and the four-author narrative chain as a design decision.

---

### XVII-I. Thematic Coherence Note

The Curse of Knowledge score asks: did you share what you learned? The game ends differently depending on the answer.

§XVII is the scene where the player finds out what the First Researcher learned — and why she didn't share it. She didn't share it because she built the thing and was ashamed. She left 7 margin entries instead of a name. The Scholar Kings built an institution to contain her secret without understanding it. Froberger understood it. He went public. He died. The player followed him. The cage is closed.

The question *"What was inside the cage?"* does not have an answer in the game. It is the correct question. The game rewards the player for arriving at it with full knowledge — not for answering it. Knowing what question to ask, after everything, is the only competence the game ever tested.

---

*§XVII status: ✅ Implemented 2026-05-25 — 5 [INVESTIGATE] buttons at CI/SL/DF/WM/MT; Constructor's Log as 4th archive doc in _storyWmArchiveModal(); Q-VA-01–04 QUEST_DB entries; MT sealed tunnel (requires Antecedent Seal or Froberger's Field Notes); CO outro addendum + "What was inside the cage?" fifth ending Sweelinck question; 9 state flags.*

---

## Section XVIII — Living World: Junction Vignettes and the Road Companion (Layer 53, ✅ Implemented)

> **The gap:** The seven junction nodes (J1–J7) are featureless waypoints — terrain, connections, nothing else. The corridor traversal between hubs is text-free past Act I. This section adds two small texture layers: one NPC encounter per junction node (no quests, no combat), and one named road companion per act section (one piece of lore, then gone). Neither is big enough for its own section or its own lab report. Together they make the open world feel inhabited.

---

### XVIII-A. Junction Waypoint Vignettes

One static NPC encounter per junction node. First-visit only — using the existing `visitedNodes` tracking. Subsequent visits: *"The traveler has moved on."* No state flags needed. No quests. No combat.

Each vignette:
- One NPC name + occupation
- 3 lines of dialogue (first visit)
- Optional `[HELP]` (donate 10gp; counts as one Curse of Knowledge credit — shared what you had)
- `[MOVE ON]` always available

**Junction assignments:**

| Node | NPC | Occupation | Opening line |
|------|-----|------------|--------------|
| J1 | Tessie | Merchant's runner | *"My employer hasn't paid me in three weeks. I'm still running the routes. I don't know why."* |
| J2 | Old Faeron | Retired soldier | *"I fought the first Tide. Told everyone it would come back. I was very boring at parties."* |
| J3 | Mira | Refugee (Act III+ only) | *"We left Tilbury before the harbor closed. I don't think we'll go back."* |
| J4 | The Cartographer | Unknown | *"I've been mapping these roads for twelve years. I still find new ones. That used to frighten me."* |
| J5 | Wren | Scholar Kings courier | *"I carry messages for the Scholar Kings. I stopped reading them two years ago. Better that way."* |
| J6 | — | Empty junction (Act VII+) | A note pinned to a post: *"Paid in full. —S."* No NPC. No [HELP]. |
| J7 | — | Nobody | A child's toy on the road. No NPC. No explanation. One sentence: *"You leave it where it is."* |

**Implementation:** `JUNCTION_VIGNETTES` const (7 entries, keyed by junction code) or inline in NODE_MAP text render. Act-gating on J3 (only visible Act III+) and J6 (only visible Act VII+) via `S_story.act` check. No new state flags. No new quests.

No lab report needed — too small; document inline in `world.md` §Junction Nodes when implemented.

---

### XVIII-B. The Road Companion

One named traveler appears once per act (Acts II–VI). They walk the same road and share one corridor-cell text line before arriving at the next node. No combat. No quests. No flags. They are gone on the next act. In Act VI, the road is empty — that is also a companion entry.

**Companions by act:**

| Act | Name | Context | Lore line |
|-----|------|---------|-----------|
| II | Dessa | Running supplies between Birka and Tilbury | *"The harbor master in Tilbury keeps a ledger of every ship that left since the Tide started. He won't show it to anyone. I've seen him writing in it."* |
| III | Olaf | Traveling researcher, unaffiliated | *"Weimar's upper district has been closed to independent researchers for eleven years. That's exactly when the Void reports started."* |
| IV | Maret | Soldier going home | *"Visby fell twice before. Both times, they held the west gate. They tell new recruits that story on the first day."* |
| V | Pilgrim (unnamed) | Going to the Mountain Pass | *"Someone sealed that tunnel before the Scholar Kings existed. I've been trying to find out who for forty years."* |
| VI | — | The road is empty | *"For the first time in days, no one else is on the road. You walk alone. It is not lonely — it is quiet in a different way."* |

**Implementation:** `COMPANION_LINES` const (5 entries keyed by act number 2–6) or inline in corridor render. Act-gated via `S_story.act`. Fires in first corridor cell after departing a hub node. No state tracking needed.

Note: The Pilgrim (Act V) foreshadows the MT sealed tunnel from §XVII. If §XVII is not implemented, their line is flavor. If §XVII is implemented, returning players in NG+ will recognize it.

No lab report needed. Document inline in `world.md` §Road Companion when implemented.

---

### XVIII-C. Insertion Spec for `roll2hit-v3.html`

**Layer tag:** Layer 53 — Living World

1. Add `JUNCTION_VIGNETTES` const — 7 entries; each with `npc`, `lines[]`, `helpText` (optional), `actMin` (optional)
2. Add junction vignette render to `_storyRenderNode()` — show NPC block on first visit; show "moved on" text on repeat visit; gate J3 (act ≥ 3) and J6 (act ≥ 7)
3. Add `COMPANION_LINES` const — 5 entries keyed by act (2–6)
4. Add companion render to corridor cell render (`_storyRenderCorridor()`) — fires on first corridor cell of a hub-to-hub path, act-gated
5. No new `_S_DEFAULTS()` flags needed (junction first-visit uses existing `visitedNodes` set; companion uses `S_story.act`)

**MONSTER_POOL count after:** unchanged.

---

### XVIII-D. Documentation Updates Required on Implementation

| File | Change |
|------|--------|
| `world.md` | Add §Junction Vignette NPCs section (Tessie through J7); add §Road Companions section (Dessa through Act VI empty) |
| `story.md` | Add companion lore lines to corridor notes section; add junction vignette dialogue list |
| `maps.md` | Update J1–J7 legend entries to note "NPC vignette (first visit)" |
| `plan.md` | Mark §XVIII complete; update §V-A queue |

No lab report needed.

---

*§XVIII status: ✅ Implemented — JUNCTION_VIGNETTES const (J1–J7+RD); COMPANION_LINES const (Acts 2–5); storyRender junction block; RD node added for Corelli (§XXVI).*

---

## Section XIX — The Tilbury Harbor Arc: "The Conclave's Weight" (Layer 54, ✅ Implemented 2026-05-25)

> **The gap:** Tilbury is the second hub town — Act II, the player's first stop outside Birka. It has a vendor (SF node), an inn (Storefront Inn), and a connection to the Merchant's Conclave. It has no named NPCs with quest chains. Magistra Elara Muffat appears as Epic NPC Q65 but is unreachable without an EB encounter. The harbor is referenced in ambient lore (Dessa in §XVIII, the harbor embargo in §XVI) but has no mechanical presence. This section gives Tilbury a story identity.

> **The theme:** The Void Tide's narrative damage is institutional before it is physical. It breaks the structures people rely on. The Merchant's Conclave's response to Void-driven crisis was to close the harbor, impose a tariff, and stall. Harbor Master Rennau is keeping a ledger of ships that haven't come back. A survivor knows what happened to one of them. The embargo is the wrong answer to a real problem. The player can do something about the ledger; they cannot fix the Conclave.

---

### XIX-A. The Setting — Tilbury Harbor District

**Node:** TL (Tilbury) + SF (Storefront, the Act II inn node)

The harbor district is in SF — the docks, the inn, the Storefront, and the counting houses where the Conclave weighs cargo. TL is the city proper — merchants, guides, the Conclave adjutant's office. The embargo is not visible as a locked gate; it manifests as empty berths at the docks and a `[HARBOR BOARD]` notice on the SF node (a list of ships whose berths are occupied by no ship). Harbor Master Rennau manages the board alone. He has nobody left to argue with.

---

### XIX-B. New NPCs

**Harbor Master Rennau** — Node SF (the docks)
- Occupation: Harbor Master, Merchant's Conclave Tier 2. He was appointed before the embargo. He reports to Adjutant Vonn, who reports to the Conclave proper.
- First impression: Tired. Not defeated — tired of being ignored. He keeps the ledger because nobody else will.
- Fav gating: Starts Impartial. Friendly after Q-TL-01. Dear Friend after Q-TL-03.

> *"The ledger goes back eleven months. Every ship that's left, every ship that's come back, every ship that hasn't. The Conclave calls the ones that haven't 'weather losses.' I stopped calling them that six weeks ago."*

> *(Dear Friend):* *"Ori said the thing that boarded them didn't have a name. Things that don't have names are the Void's specialty. I'm glad someone came back to tell us."*

---

**Adjutant Vonn** — Node TL (the adjutant's office)
- Occupation: Merchant's Conclave Adjutant, Tier 3. Enforces the embargo. Keeps the tariff records.
- Demeanor: Professionally polite. Believes the Conclave's decision was correct. Has 30 years of trade law to back it up. The embargo is a legitimate Conclave instrument; the fact that it's bad policy is above his grade.
- Fav gating: Starts Impartial. Caps at Friendly — he will be cordial but he holds the Conclave's position and will not budge from it.

> *"The harbor is closed to non-Conclave vessels under Emergency Trade Protocol 7. I understand this is inconvenient. I can offer you a transit permit for a fee. The fee is fixed by the Conclave. I did not set it."*

---

### XIX-C. Quest Chain — "The Conclave's Weight" (Q-TL-01 through Q-TL-03)

**Q-TL-01: "The Ledger"** — Trigger: first visit to SF node, Act II+

- NPC: Harbor Master Rennau
- He shows the player the harbor board: ten empty berths. He'll share the ledger page for the most recent missing ship — the *Harrow* — if the player agrees to look for any trace of its manifest.
- Task: Find the *Harrow* manifest. It drops from a `docks_patrol` monster in the SF terrain (existing docks terrain encounters), or appears as loot in the SF node's loot table (one-time find).
- Reward: `ship_manifest` readable item (icon: 📄, type: 'readable', sell: 0) + `tlLedgerRead = true` + Rennau Friendly.
- Lore on reading `ship_manifest`: *"Cargo: 40 crates, Scholar Kings correspondence, sealed. Consignee: Weimar, Archivist I. Voss. Departure: Day 17. Expected arrival: Day 20. Status: Weather Loss."* — If `wmFirstResearcherKnown` is true, an additional line appears: *"Isolde Voss's name on a ship manifest from eleven months ago. Before the revocation. Whatever she was sending arrived nowhere."*

---

**Q-TL-02: "The Embargo"** — Trigger: `tlLedgerRead` + speak to Adjutant Vonn

- The player learns the embargo's full scope from Vonn. He explains the legal basis. He is not wrong.
- Three approaches (no binary choice):
  - **Report to Muffat** — if Q65 (Muffat EB quest) is active or complete: bring the ship_manifest to Muffat. She files it with the Council as evidence of unreported losses. 200gp reward from her liaison NPC (an anonymous messenger at the IN node — no new NPC needed). Sets `tlEmbargoChallenged`.
  - **Deliver to Birka contact** — carry the `ship_manifest` to IN node and interact with the [NOTICE BOARD] option "Leave a message." A contact from the High Council receives it in 3 in-game days. 150gp reward delivered to the player on next IN visit. Sets `tlEmbargoChallenged`.
  - **Leave it** — close the quest without escalating. No reward. Sets `tlEmbargoDismissed`. The harbor stays closed.
- Reward: status flag + gold (if challenged) + Vonn stays Impartial regardless of player's choice. He's doing his job.

---

**Q-TL-03: "The Missing Ship"** — Trigger: `tlLedgerRead` + Act IV+

- A new encounter at SF in Act IV: **Ori**, a sailor from the *Harrow*, has arrived in Tilbury. She's the only survivor. She's been walking for three weeks.
- Dialogue: She describes what boarded them. Not pirates. Not storm. Something that came from below — *"a shape in the water, very large, that didn't move like a fish or a whale. It moved like it was looking for something. Then it found the ship."*
- Cross-reference: If §XII (Fishing Overhaul) is implemented, Ori's description matches the BAIT_FISH_POOL apex predator tier exactly. The Void Tide has pushed deep-sea creatures into shipping lanes.
- Task: Bring Ori's account to Rennau. He writes it into the ledger. Sets `tlMissingShipSolved`.
- Reward: 300gp + Rennau reaches Dear Friend + `ori_account` readable item (icon: 📜, type: 'readable', sell: 0).
- If player has `tome_void_pressure` in inventory: an additional note appears in `ori_account`: *"Froberger wrote: 'The pressure is survivable if you know it's coming.' Ori survived because she knew the shape was there and went over the side before it hit. She knew it was coming. She'd seen it the night before, tracking the ship."*

---

### XIX-D. New Items

| Key | Name | Icon | Type | Sell | Content |
|-----|------|------|------|------|---------|
| `ship_manifest` | The Harrow Manifest | 📄 | readable | 0 | Cargo record of a missing ship; Scholar Kings correspondence consigned to Isolde Voss; cross-references with §XVI if `wmFirstResearcherKnown` |
| `ori_account` | Ori's Account | 📜 | readable | 0 | Survivor's description of the attack; cross-references with §XII fishing arc if implemented |

Both items: `sell: 0`, NG+-persistent, readable from inventory.

---

### XIX-E. New State Flags

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `tlLedgerRead` | boolean | false | ship_manifest obtained (Q-TL-01) |
| `tlEmbargoChallenged` | boolean | false | Embargo escalated via Muffat or Birka contact |
| `tlEmbargoDismissed` | boolean | false | Player left the embargo issue unresolved |
| `tlMissingShipSolved` | boolean | false | Ori's account delivered to Rennau (Q-TL-03) |
| `tlRennauFav` | int | 0 | Rennau favorability (0=Impartial, 1=Friendly, 2=DearFriend) |
| `tlVonnFav` | int | 0 | Vonn favorability — caps at 1 (Conclave allegiance) |

---

### XIX-F. Insertion Spec for `roll2hit-v3.html`

**Layer tag:** Layer 54 — Tilbury Harbor Arc

1. Add Rennau to `BIRKA_NPC_PROFILES` equivalent or to a new `TL_NPC_PROFILES` const (if hub NPCs are town-specific)
2. Add Vonn as ambient NPC at TL node — minimal profile; caps at Friendly; no Dear Friend path
3. Add `ship_manifest` and `ori_account` to a `READABLE_ITEMS` const or inline in quest reward delivery
4. Add Q-TL-01 through Q-TL-03 to `QUEST_DB`
5. Add 6 new state flags to `_S_DEFAULTS()`
6. Add `[HARBOR BOARD]` interaction to SF node render (one-time; shows empty berth list; triggers Rennau introduction)
7. Add Ori encounter to SF node render — gated: `tlLedgerRead && S_story.act >= 4`
8. Add cross-reference line to `ship_manifest` read — gated: `wmFirstResearcherKnown`
9. Add cross-reference line to `ori_account` read — gated: `inv.tome_void_pressure`

**MONSTER_POOL count after:** unchanged (uses existing docks terrain monsters).

---

### XIX-G. Documentation Updates Required on Implementation

| File | Change |
|------|--------|
| `world.md` | Add Rennau and Vonn to Tilbury NPC section; add harbor district description; add Q-TL-01 through Q-TL-03 beats |
| `story.md` | Add Q-TL-01 through Q-TL-03 quest beat section; Ori encounter notes; cross-references to §XII and §XVI |
| `mechanics.md` | Add `type:'readable'` item shape if not already documented |
| `index.md` | Add Tilbury Harbor Arc note |
| `plan.md` | Mark §XIX complete; update §V-A queue |

**Lab report:** `lab-report-tilbury-visby-arcs.md` — covers §XIX and §XX together as the "hub town completion pass"; institutional fracture theme (Void damages institutions before it damages people); readable item pattern (`ship_manifest`, `ori_account`, `hollow_hands_seal`); goblin sub-faction design.

---

### XIX-H. Thematic Coherence Note

The Void Tide does not begin with monsters. It begins with missing ships, revoked research access, suppressed riot reports, and a harbor closed by people who believed they were managing a crisis. §XIX makes this visible from the commercial side: the Conclave's response is procedurally correct and humanly inadequate. Rennau keeps the ledger because institutions don't. The Curse of Knowledge applies here too — the player finds out what happened to the *Harrow*, and what they do with that information is the same choice the game asks about everything else.

---

*§XIX status: ✅ Implemented 2026-05-25 — Rennau/Vonn NPCs; Q-TL-01–03; Harbor Board button; Harrow Manifest + Ori Account items; wmFirstResearcherKnown cross-ref; SF+TL render blocks.*

---

## Section XX — The Visby Underground: "What Mordus Owes" (Layer 55, ✅ Implemented 2026-05-25)

> **The gap:** Visby is the enemy stronghold — the Crimson Warrant's territory, Warlord Kael Mordus's seat of power. Mordus appears as Epic NPC Q71 but the Crimson Warrant has no player-facing quest arc in the main game. The world.md note for Visby mentions "the Void shaman's influence spreading through the goblin clans — it's already destabilizing Mordus's control" — but this instability is never made player-visible. This section surfaces it through a debt collection arc.

> **The theme:** §XIX showed how the Void fractures commerce. §XX shows how the Void fractures criminal authority. Mordus's control is built on loyalty and fear — the two things a Void-aligned faction subverts by definition. The "debt" is real but not the point. The point is the Hollow Hands: a goblin sub-clan that broke from Mordus six months ago, armed with weapons meant for him, loyal to a shaman the player never meets. The shaman is the shadow of §XX, not the subject.

---

### XX-A. The Setting — Visby Underground

**Nodes:** VS (Visby node) + GC (Goblin Caves)

Visby's surface is controlled; the caves beneath are not. The Goblin Caves are a labyrinthine territory that Mordus governs through a system of tributes and sub-chiefs. The Hollow Hands are a goblin sub-clan that stopped paying tribute six months ago and began answering to someone else. Mordus knows. He has not moved against them because he does not know how many there are, where the weapons came from, or who their shaman is. He is waiting. The player has leverage Mordus doesn't: they go into places Mordus can't follow without starting a war he's not ready for.

---

### XX-B. New NPCs

**Debt Agent Solvak** — Node VS (outside the Crimson Warrant perimeter)
- Occupation: Merchant's Conclave Tier 3 debt collector. He was sent from Tilbury to collect 2,000gp from Mordus — the price of a weapons shipment that never arrived. He has been outside Visby for six weeks. He is not going in.
- Demeanor: Professionally anxious. He knows Mordus won't pay. He knows he can't make Mordus pay. He needs the player to make the debt solvable.
- Fav gating: Starts Impartial. Friendly after Q-VS-01. He leaves VS after Q-VS-03.

> *"The Conclave hired me to collect. I have collected from Crimson Warrant before — once. The key is presenting it as a mutual interest problem, not a threat. Mordus does not respond to threats. He responds to leverage. I don't have any. You might."*

---

**Yva** — Node GC (inside the Goblin Caves)
- Occupation: Goblin broker, formerly Mordus-aligned supply intermediary. Now independent and frightened.
- Background: She brokered the weapons shipment that never arrived. She knows who diverted it. She will not say the name without compensation.
- Fav gating: Starts Impartial. Friendly after paying 50gp. Dear Friend after Q-VS-02 completion.

> *"I moved cargo for Mordus for eight years. Good coin, no questions. Then the Hollow Hands put a mark on my stall and started asking questions instead. I don't know who they answer to. I know what the mark means. It means I am not neutral anymore unless I pay to be."*

> *(Dear Friend):* *"I want Mordus to know I didn't betray him. I want you to tell him I didn't know what the cargo was for until it was already moved. I am telling you this because you're the only one who's been in here and out of here without bleeding."*

---

### XX-C. Quest Chain — "What Mordus Owes" (Q-VS-01 through Q-VS-03)

**Q-VS-01: "The Collector"** — Trigger: first visit to VS node, Act V+

- NPC: Debt Agent Solvak
- He explains the 2,000gp debt. The weapons shipment (40 crates, Conclave-sourced) left Tilbury six months ago and never reached Visby. Mordus denies receiving it. The Conclave says he owes regardless.
- Note: If `tlLedgerRead` is true (§XIX), Solvak mentions the Harrow by name: *"We lost a ship around the same time. The Harrow. Unrelated, probably."* (It is not unrelated — the Harrow was carrying Scholar Kings correspondence; the weapons were on a different manifest. But the timing is the same Void advance that pushed both into crisis.)
- Task: Enter Visby and speak to Mordus about the debt.
- If Q71 (Mordus EB quest) is active or complete: Mordus greets the player differently — *"Another one with a debt ledger. The Conclave is bold."* — but still engages.
- Mordus's answer: *"The debt will be paid when the weapons are returned. The weapons will be returned when I know where they went. I do not know where they went."* He is telling the truth.
- Reward: `vsDebtProbed = true` + Solvak Friendly.

---

**Q-VS-02: "The Broker"** — Trigger: `vsDebtProbed` + visit to GC node

- Yva is inside GC. Her stall has the Hollow Hands mark. She charges 50gp to talk (deducted from `S_story.gold`).
- She tells the player: the weapons went to the Hollow Hands, a goblin sub-clan with a Void-aligned shaman. The shaman told the Hollow Hands the weapons were tribute paid in advance for their loyalty. Mordus never paid tribute; the shaman invented a tribute that made the Hollow Hands feel owed.
- New combat encounter: `hollow_hands_guard` — a Void-modified goblin. Drops `hollow_hands_seal` (icon: 🖤, type: 'quest_item', sell: 0).
- Task: Find the Hollow Hands' cache marker in GC terrain (the `hollow_hands_guard` drops the `hollow_hands_seal` on defeat).
- Reward: `vsWeaponsFound = true` + Yva Friendly + `hollow_hands_seal` item.
- If the player chooses [TELL YVA ABOUT RENNAU] (available if `tlMissingShipSolved` from §XIX): she adds one sentence: *"The Harrow. I heard about that ship. The Hollow Hands didn't touch it. Whatever got that ship wasn't them."*

---

**Q-VS-03: "Mordus Pays"** — Trigger: `vsWeaponsFound` + speak to Mordus again

- Mordus sees the `hollow_hands_seal`. He does not say the shaman's name. He pays the debt sideways: he gives the player a transit seal for a hidden weapons cache in Visby territory — not the original 40 crates, but enough for the Conclave to close the ledger.
- Task: Deliver `hollow_hands_seal` to Solvak. He accepts the transit seal as settlement.
- Reward: `vsDebtSettled = true` + 400gp from Solvak + Solvak leaves VS permanently.
- Mordus's follow-up (next GC/VS visit): *"The Hollow Hands are mine to deal with now that I know what they are. You found what I needed to find them. That's worth something."* — Sets `vsShamanKnown = true`. The player now knows the Void shaman is a distinct faction operating inside Mordus's territory. The shaman is not confronted in §XX — they are named as a threat that exists.

---

### XX-D. New Monster — `hollow_hands_guard`

| Key | Name | AC | HP | ATK | Dmg | Tier | Drop |
|-----|------|----|----|-----|-----|------|------|
| `hollow_hands_guard` | Hollow Hands Guard | 13 | 22 | +4 | 1d6+2 | low | `hollow_hands_seal` (icon: 🖤, sell: 0) |

Add to: `GC` terrain in `WORLD_DB`. Flavour: a goblin with Void-marked armor — darker, quieter, moves wrong. The mark on the armor matches the mark on Yva's stall.

**MONSTER_POOL count after §XX:** 370 + 1 (scholars_guard from §XVI) + 1 (hollow_hands_guard) = 372 if both §XVI and §XX are implemented.

---

### XX-E. New State Flags

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `vsDebtProbed` | boolean | false | Spoke to Mordus about the weapons debt (Q-VS-01) |
| `vsWeaponsFound` | boolean | false | hollow_hands_seal obtained (Q-VS-02) |
| `vsDebtSettled` | boolean | false | Debt settled with Solvak (Q-VS-03) |
| `vsShamanKnown` | boolean | false | Player knows Void shaman is operating inside Mordus's territory |
| `vsYvaFav` | int | 0 | Yva favorability (0/1/2) |
| `vsSolvakFav` | int | 0 | Solvak favorability — caps at 1; he leaves VS after §Q-VS-03 |

---

### XX-F. Insertion Spec for `roll2hit-v3.html`

**Layer tag:** Layer 55 — Visby Underground

1. Add `hollow_hands_guard` to `MONSTER_POOL` and to `GC` terrain in `WORLD_DB`
2. Add Solvak and Yva to NPC profile const (VS and GC node respectively)
3. Add `hollow_hands_seal` as quest item (inline in `MONSTER_DROPS` for `hollow_hands_guard`)
4. Add Q-VS-01 through Q-VS-03 to `QUEST_DB`
5. Add 6 new state flags to `_S_DEFAULTS()`
6. Add cross-reference check in Q-VS-01: if `tlLedgerRead`, insert Harrow mention into Solvak's dialogue
7. Add cross-reference check in Q-VS-02: if `tlMissingShipSolved`, unlock Yva's Harrow line
8. Add Solvak departure logic (remove from VS node render after `vsDebtSettled`)

**MONSTER_POOL count after:** +1 (hollow_hands_guard).

---

### XX-G. Documentation Updates Required on Implementation

| File | Change |
|------|--------|
| `monsters.md` | Add `hollow_hands_guard` stat block; update MONSTER_POOL count |
| `world.md` | Add Solvak and Yva to Visby NPC section; add Hollow Hands sub-clan description; update Crimson Warrant entry to note Void shaman instability |
| `story.md` | Add Q-VS-01 through Q-VS-03 quest beat section; Mordus dialogue variants; cross-references to §XIX |
| `index.md` | Add Visby Underground arc note |
| `plan.md` | Mark §XX complete; update §V-A queue |

**Lab report:** `lab-report-tilbury-visby-arcs.md` — shared with §XIX; covers both hub arcs, institutional fracture theme, readable item pattern, hollow_hands_guard sub-faction design, and §XIX/§XX cross-references. Write on implementation of both.

---

### XX-H. Thematic Coherence Note

Mordus is not a villain in §XX. He is an authority figure whose authority is being dissolved by a force he cannot name. The player can name it, because the player has been in the Void's wake since Birka. The Curse of Knowledge dynamic applies: Mordus cannot share what he knows (he doesn't know enough), the player cannot tell him what they know (he wouldn't believe it yet), and the only thing that moves is the ledger.

The Void shaman named in §XX is not introduced as a character. This is intentional. The shaman is what comes next — the shadow behind §XX, the threat that will need a section of its own if the game ever reaches Layer 56. Naming a threat without confronting it is the game's oldest design move: Froberger in Entry 7 named the First Researcher without naming her, and the player spent two game layers finding her. §XX does the same with the shaman.

---

*§XX status: ✅ Implemented 2026-05-25 — hollow_hands_guard monster; Solvak/Yva NPCs; Q-VS-01–03; Harrow cross-ref at Yva; Mordus debt arc; vsShamanKnown flag.*

---

## Section XXI — The Void Shaman: The Antecedent's Last Warden (Layer 56, ✅ Implemented 2026-05-25)

> **The resolution:** §XX named the Void Shaman without confronting them. This section is the confrontation. The reveal is that the Void Shaman is not a villain — they are a catastrophically misdirected guardian. The First Researcher, after sealing the Antecedent, appointed a Warden from a local goblin clan to maintain the MT tunnel. The mandate was: "if the cage starts to fail, open the tunnel." Over 200 years of oral transmission, "open the tunnel" became "open the cage." The current Warden has been working to release the Antecedent, believing this is what the First Researcher wanted. They were right about the verb, wrong about the direction.

> **Prerequisites:** `vsShamanKnown` (from §XX) + `vaLastWardVisited` (from §XVII — the MT tunnel must already be open). If either is missing, the MT tunnel is unchanged and the encounter does not trigger. This creates a natural convergence: players must do both §XVII and §XX before §XXI is reachable.

---

### XXI-A. The Setting — Inside the MT Tunnel

The MT tunnel was described in §XVII as sealed before the Scholar Kings existed, opened by the player during Q-VA-03, and containing *"the Antecedent was here — it is not anymore — you know where it is now."* The player has been inside once. Someone else has been living there for six months.

The Warden has been working. The tunnel walls have marks — not the stone alignment from DF, but new ones, carved in the past six months. A workbench. Notes in a language that mixes goblin glyphs and Old Scholar script. The Warden is not surprised to see the player. They knew Mordus would send someone eventually.

---

### XXI-B. The Warden

The current Warden has no individual name recorded anywhere. They have held the title for eleven years, inherited from their predecessor. The Hollow Hands know them only as "the Warden." The Scholar Kings' records have no entry for a goblin Warden because the First Researcher never wrote it down — the Warden was a private failsafe, not a documented protocol.

The Warden is old for a goblin. They have read every piece of writing they could find about the Antecedent — which amounts to the Scholar Kings' suppressed field reports (obtained via a Hollow Hands intermediary six months before Q-WM-02 uncovered the same reports), and a corrupted version of the First Researcher's mandate, recopied seventeen times across eleven generations.

> *"I know what you are. You're from outside. You found the marks. You went to Mordus. You came here. That's the sequence she described — the sequence that means someone finally followed the full trail. I've been waiting for someone to follow the full trail for eleven years."*

> *"She said: 'When the cage starts to fail, open the tunnel.' The cage has been failing for three years. I opened the tunnel. I've been trying to open the cage from the outside. I have been doing this wrong, haven't I."*

---

### XXI-C. Two Outcomes — Combat or Persuasion

**Combat path:** Fight `void_shaman`. Stats: AC 15 / HP 65 / ATK +6 / 2d6+4 (fire+void). Rare/boss tier. Drops `warden_token` on defeat.

The Warden fights to protect the tunnel — not from malice but from eleven years of belief that the tunnel must stay active until the cage is opened. They are not trying to kill the player; they are trying to slow them down long enough to finish the work. The combat ends when they are defeated. They accept it without bitterness: *"If I'm wrong, then I needed to be stopped. That's — that's actually fine."*

`vshamanDefeated = true`.

---

**Persuasion path:** If `constructor_log` is in inventory, a `[SHOW THEM THE LOG]` option appears before combat triggers.

The Warden reads the Constructor's Log. Specifically Entry 2: *"The containment structure requires a destabilization event to trigger the sealing mechanism. In plain terms: the cage must be opened before it can be closed."* And Entry 7: *"If someone is reading this, the sealing mechanism has activated. The cage is closed."*

The Warden's reaction, reading:

> *"'The cage must be opened before it can be closed.' That's — that's exactly what we were told. That's the mandate. But. Entry 7 says it's already done. The sealing mechanism. That was the battle, wasn't it. At the Defiant Fields. You were there."*

> *"I've been outside the wall I was supposed to be inside. I was supposed to open it from inside, at the right moment, to trigger the seal. Someone else did that. You did that. And I've been out here trying to open it from the wrong direction for six months."*

The Warden gives `warden_token` voluntarily. Tells the Hollow Hands the mission is complete — the cage is sealed, the mandate is fulfilled. The sub-clan, without a war mandate, returns to Mordus's territory quietly.

`vsShamanPersuaded = true`.

---

### XXI-D. The Hollow Hands Aftermath

Both outcomes set `wardensLegacyKnown = true`.

- **Combat:** Hollow Hands lose leadership and scatter. Mordus regains GC territory over 5 in-game days. A quest log entry: *"Without the Warden, the Hollow Hands have no direction. Mordus's scouts report the sub-clan dispersing into the wider cave network."*

- **Persuasion:** Hollow Hands receive word from the Warden that the mission is done. They return to Mordus's governance without fighting. Mordus's quest log note: *"The sub-clan walked back in. All of them. Mordus didn't ask what changed. He logged them as returned."*

**Benedikt Rasp callback** — if `vsShamanPersuaded` and Benedikt is Dear Friend (§XVI), next WM visit triggers:

> *"You found the Warden. She planted them, didn't she — the First Researcher. She planted a guardian at the tunnel and didn't write it down anywhere official. I didn't know the chain went that far. Neither did she, I think — she thought she was planting a safeguard. She planted a 200-year misunderstanding. The difference between those things might be very small."*

---

### XXI-E. New Monster — `void_shaman`

| Key | Name | AC | HP | ATK | Dmg | Tier | Drop |
|-----|------|----|----|-----|-----|------|------|
| `void_shaman` | The Warden | 15 | 65 | +6 | 2d6+4 | rare | `warden_token` (icon: 🔑, sell: 0) |

**NOT added to random encounter pool.** This is a scripted encounter at MT tunnel only. Add to `MONSTER_POOL` as a scripted/unique entry with `spawnsIn: []` (no terrain random encounters). The `warden_token` drop is scripted — not in `MONSTER_DROPS` random table.

---

### XXI-F. New Items

| Key | Name | Icon | Type | Sell | Content |
|-----|------|------|------|------|---------|
| `warden_token` | The Warden's Token | 🔑 | relic | 0 | *"Original Warden's seal, First Researcher's appointment. Recopied seventeen times. The seventeenth copy has a small error in the verb tense that changed everything."* NG+-persistent. |

---

### XXI-G. New State Flags

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `vshamanFound` | boolean | false | MT tunnel encounter triggered |
| `vshamanDefeated` | boolean | false | Warden defeated in combat |
| `vsShamanPersuaded` | boolean | false | Warden persuaded via Constructor's Log |
| `wardensLegacyKnown` | boolean | false | Either outcome complete; Hollow Hands resolved |

---

### XXI-H. Insertion Spec for `roll2hit-v3.html`

**Layer tag:** Layer 56 — The Void Shaman

1. Add `void_shaman` to `MONSTER_POOL` with `spawnsIn: []` (scripted only)
2. Add `warden_token` relic item inline in encounter reward delivery
3. Add scripted encounter to MT node render — gated: `vsShamanKnown && vaLastWardVisited && !wardensLegacyKnown`
4. Add `[SHOW THEM THE LOG]` dialogue option — gated: `inv.constructor_log && !wardensLegacyKnown`
5. Add Q-VS continuation logic: after `wardensLegacyKnown`, update Mordus quest log entry
6. Add Benedikt callback — gated: `vsShamanPersuaded && fav_benedikt >= 2` (Dear Friend)
7. Add 4 new state flags to `_S_DEFAULTS()`

**MONSTER_POOL count after:** +1 (`void_shaman`, scripted entry) = 373 if §XVI + §XX + §XXI all implemented.

---

### XXI-I. Documentation Updates Required on Implementation

| File | Change |
|------|--------|
| `monsters.md` | Add `void_shaman` scripted entry; note it has `spawnsIn: []`; update MONSTER_POOL count |
| `world.md` | Add Warden backstory to Visby/GC section; update Hollow Hands note; add Benedikt callback note |
| `story.md` | Add §XXI encounter section at MT node; both outcome texts; Hollow Hands aftermath quest log lines |
| `plan.md` | Mark §XXI complete; update §V-A queue |

**Lab report:** `lab-report-void-shaman.md` — covers the "corrupted mandate" design (a guardian who was right about the verb, wrong about the direction), the persuasion-vs-combat duality, and the First Researcher's chain (Researcher → Warden → Hollow Hands → §XXI confrontation → player). Write on implementation.

---

### XXI-J. Thematic Coherence Note

The Warden is the only character in the game who has been doing the right thing in the wrong direction for 200 years. Every other antagonist or complication in the game is a system failure — the Scholar Kings suppressed knowledge, the Merchant's Conclave closed the harbor, the Void Tide corrupted the goblin clans. The Warden is the only one who was appointed correctly, genuinely loyal, doing exactly what they were told, and still catastrophically wrong. The mandate degraded in transmission, not in intent.

This is the Curse of Knowledge in reverse: the First Researcher withheld the full truth from the Warden (she didn't tell them what was inside the cage) because she believed it was safer. That withheld truth became the 200-year misunderstanding. Sharing the Constructor's Log resolves it. The game's thesis — knowing is not enough; you have to tell someone — applies to the First Researcher herself. She kept the secret. It almost destroyed everything she built.

---

*§XXI status: ✅ Implemented 2026-05-25 — void_shaman (AC15/HP65/ATK+6/2d6+4) added to MONSTER_POOL (scripted only); warden_token relic delivered inline per path; MT tunnel encounter gated by vsShamanKnown && vaLastWardVisited && !wardensLegacyKnown; persuasion path (Constructor's Log → vsShamanPersuaded) and combat path (MT_WARDEN battle → vshamanDefeated) both set wardensLegacyKnown; Benedikt Dear Friend callback at SQ (vsShamanPersuaded + fav>=2 + !vsShamanBenediktDelivered); quest_vs_warden in QUEST_DB; five state flags in _S_DEFAULTS(); Hollow Hands aftermath text per path.*

---

## Section XXII — Codex Shard Origin Stories (Layer 57, ✅ Implemented)

> **The gap:** The 7 Codex Shards are the main quest MacGuffins. Each has a node location and a brief description. None of them has a named placer, a reason for being there, or a connection to the Scholar Kings history established in §XVI and §XVII. This section gives each shard a readable item that auto-adds to inventory when the shard is collected. Reading it reveals who placed the shard, why, and one line from that person about what they were doing.

> **The reveal:** The 7 shards were distributed by 7 different people across the Scholar Kings' history — researchers, archivists, and guardians who knew the Codex must survive any single catastrophe. The distribution was a precaution against exactly the kind of knowledge-suppression the Scholar Kings later became. The last placer was Froberger. He placed Shard 7 himself. He knew he wasn't going to make it out.

---

### XXII-A. The Seven Shards — Named and Sourced

Following the game's Baroque composer naming theme, each shard is named after a musical form from the Baroque period.

| # | Shard Name | Node | Placer | Era | Cross-reference |
|---|-----------|------|--------|-----|----------------|
| 1 | **The Toccata Fragment** | CI (Birka Archive) | Elder Couperin — ancestor of NPC Quill/Couperin | 5 generations ago | Quill's `dearFriend` dialogue mentions "family papers in the archive" |
| 2 | **The Prelude Stone** | TL/SF (Tilbury docks) | Scholar Marzena — Merchant's Conclave-aligned researcher | 4 generations ago | Connects to Tilbury Harbor Arc (§XIX): she worked with early Conclave |
| 3 | **The Fugue Seal** | Mid-world node (DF or J4) | Researcher Aldric — field researcher, no guild affiliation | 3 generations ago | Connects to §XVIII J4 vignette (The Cartographer found old maps referencing Aldric) |
| 4 | **The Cantata Mark** | VS/GC (Visby/Goblin Caves) | Archivist Hendrika — briefly Scholar Kings Tier 1 before defecting | 3 generations ago | Chose Visby because *"the Warrant would protect it from the Circle"* |
| 5 | **The Passacaglia Core** | MT (Mountain Pass) | The First Researcher | 2 generations ago | If `wmFirstResearcherKnown`: note names her; *"She placed this before she sealed the tunnel."* |
| 6 | **The Chaconne Piece** | WM (Weimar lower district) | The original Warden (first of the Hollow Hands lineage) | 2 generations ago | If `wardensLegacyKnown`: note says *"Placed by the first Warden, at her instruction."* |
| 7 | **The Sarabande Key** | CO (Covenant ceremony site) | Froberger himself | ~1 year ago (recent) | If `frobergerLastEntryRead`: note matches Entry 41's mood exactly |

---

### XXII-B. Shard Note Content

Each `shard_note_N` readable item (2–3 sentences) is added to inventory automatically when the corresponding Codex Shard is collected. Readable at any time from inventory.

**shard_note_1** — The Toccata Fragment (CI):
> *"Elder Couperin placed this in the Birka city archive seventy years ago. He told his family he was storing a keepsake. The note reads: 'The first note must be held longest. Everything else can be improvised.'"*

**shard_note_2** — The Prelude Stone (TL):
> *"Scholar Marzena brought this from Weimar to Tilbury docks in a merchant's crate, labeled 'decorative ballast.' She was Conclave-adjacent but not Conclave-loyal. Her note: 'What begins here sets the key for everything that follows. I hope someone follows.'"*

**shard_note_3** — The Fugue Seal (mid-world):
> *"Researcher Aldric left this at a crossroads node. He was not affiliated with any guild — he walked routes for forty years and left things where he thought they would be found by the right person at the right time. His note: 'Three voices; none of them alone. The fugue requires all three to resolve.'"*

**shard_note_4** — The Cantata Mark (VS/GC):
> *"Archivist Hendrika defected from the Scholar Kings in the third year of her appointment. She chose Visby deliberately: 'The Crimson Warrant protects what the Circle has decided isn't worth protecting. I disagree with both their methods. I trust their incentives.' Her note: 'Written to be heard, not read. You had to be there.'"*

**shard_note_5** — The Passacaglia Core (MT):
> *"Placed by the First Researcher, at the Mountain Pass, before she sealed the tunnel. No name on the note — she had already stopped signing her name by then. The handwriting matches Document 3 in the Weimar lower archive."*
> *(If `wmFirstResearcherKnown` adds): "You recognize the handwriting. She was here. This was hers."*

**shard_note_6** — The Chaconne Piece (WM):
> *"Left in the Weimar lower district by a hand that is not Scholar Kings — the script is older, pre-institutional. A single line: 'Variations without end. The theme persists.' The wax seal shows a mark you have seen before — in the Goblin Caves, on a stall."*
> *(If `wardensLegacyKnown` adds): "Placed by the first Warden, on the First Researcher's instruction. The chain goes back this far."*

**shard_note_7** — The Sarabande Key (CO):
> *"Froberger placed this here. His handwriting — you know it from 41 journal entries. The note is three words: 'I couldn't carry it any further. Someone else will have to finish.' There is no Entry 42 in his journal. He left that page for you."*
> *(If `entry42Written` adds): "You wrote Entry 42. He left the page. You filled it."*

---

### XXII-C. Implementation

**New const:** `SHARD_NOTES` — 7 entries, keyed by shard number 1–7.

Each entry:
```js
{ key: 'shard_note_1', name: 'The Toccata Fragment', icon: '📿', type: 'readable', sell: 0,
  text: '...base text...',
  conditionals: [
    { flag: 'wmFirstResearcherKnown', addText: '...' }  // for shard 5 only
  ]
}
```

**Trigger:** When each Codex Shard is collected (in `_collectShard()` or equivalent), add the corresponding `shard_note_N` to inventory and set `S_story.shardNotes[N] = true`.

**New const flag:** `shardNotesCollected` — array tracking which notes have been collected (mirrors shard collection).

**Journal reward:** When all 7 shard notes have been read from inventory, append a Froberger Journal sidebar entry: *"Seven people carried the pieces. Five of them knew what they were carrying. One of them didn't know what was inside it. One of them did and placed it last. You know all their names now."*

**No new monsters. No new quests (shard collection is already main-quest gated).** No new nodes.

---

### XXII-D. New State Flags

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `shardNotes` | array[7] | `[false×7]` | Tracks which shard notes have been collected |
| `shardNotesAllRead` | boolean | false | All 7 notes read from inventory; journal sidebar entry unlocked |

---

### XXII-E. Documentation Updates Required on Implementation

| File | Change |
|------|--------|
| `story.md` | Add Shard Origin section: table of all 7 shards with placer names and notes; note flag-gated text variants |
| `world.md` | Add placer names to relevant faction sections (Couperin ancestor to Birka NPC section; Marzena to Conclave section; Hendrika to Scholar Kings defector note; First Researcher shard to MT node) |
| `mechanics.md` | Add `SHARD_NOTES` const reference; note auto-add on shard collect |
| `plan.md` | Mark §XXII complete; update §V-A queue |

No lab report needed — shard origins are a retroactive depth layer, not a new system. Document inline in `story.md` when implemented.

---

*§XXII status: ✅ Implemented — SHARD_NOTES const (7 entries keyed 1–7); auto-added to inventory on shard collect via storyCollectLoot() patch; flag-gated addText for shards 5 (wmFirstResearcherKnown), 6 (wardensLegacyKnown), 7 (entry42Written); all-7 journal reward message; "📖 Origin Notes" inventory section with Read button; shardNotes[7] + shardNotesAllRead state flags.*

---

## Section XXIII — Inn Dreams (Layer 58, ✅ Implemented)

> **The gap:** The four inns (IN, SF, IS, SQ) heal HP and advance time. When the player sleeps, the game renders a rest confirmation and continues. There is no content at that moment — no texture, no foreshadow, no reflection. This section adds a brief dream text (1–2 sentences) that fires after every rest, selected by inn and `gameDay % 3`. Three base variants per inn cycle on a 3-day rotation. Flag-gated variants replace the base when specific story conditions are met.

> **The philosophy:** Dreams in the game are not prophetic or mechanical. They do not grant bonuses. They are not even reliably true. They are the player-character's subconscious processing what they have seen, at whatever level the character has been paying attention. A player who has done everything will get different dreams than a player who hasn't spoken to anyone.

---

### XXIII-A. IN Dreams — The First Inn, Birka (Acts I and VIII)

Base variants (cycle by `gameDay % 3`):

1. *"Birka in the small hours. The fires are banked. Something is counting the days — not with alarm, just keeping track."*
2. *"A door you have walked past a hundred times. Tonight you try the handle. It opens onto another door. You decide this is fine."*
3. *"The city is very quiet. You are aware, in the way of dreams, that this is temporary. You sleep anyway."*

Flag-gated replacements:

- If `frobergerLastEntryRead`: *"Entry 41. He knew it was the last one. He wrote it anyway. You sleep in a city he documented until he couldn't."*
- If `entry42Written`: *"Entry 42 is in the journal now. Forty-two entries. You are one of them. The journal is heavier than it looks."*
- If `vaArchitectureKnown`: *"Four authors. You are the fourth. The journal has always had room for a fourth. You dream about that."*

---

### XXIII-B. SF Dreams — Storefront Inn, Tilbury (Act II)

Base variants:

1. *"The harbor at night. Ship bells. One bell does not stop when the others do."*
2. *"Something large, moving slow, below the surface. It is looking for something. In the dream you know what it is looking for. When you wake up, you don't."*
3. *"The harbor board. All the berths are accounted for. You count them. Eleven. Then you count again. Twelve."*

Flag-gated replacements:

- If `tlLedgerRead`: *"The Harrow's berth. Empty. Rennau stands at the board with his pen. He doesn't write anything. Neither do you."*
- If `tlMissingShipSolved`: *"Ori's voice, calm: 'I went over the side before it hit.' The shape passes beneath where the ship was. You understand, in the dream, that she was right to go over."*

---

### XXIII-C. IS Dreams — Smuggler's Safe House, Visby (Acts III–V)

Base variants:

1. *"The caves go deeper than the map says. You can hear counting in the dark. Not numbers — something else being enumerated."*
2. *"A mark on the wall. You did not put it there. You do not recognize it. Someone before you did. Someone before them made it."*
3. *"You are being watched from somewhere in the dark. The watcher is patient. They have been waiting longer than you have been alive. This does not frighten you, in the dream."*

Flag-gated replacements:

- If `vsDebtProbed`: *"Mordus at a table, writing in a ledger. He crosses out a number and writes another. The number never gets smaller."*
- If `vsShamanPersuaded`: *"The counting stops. What replaces it is not silence — it is a rhythm. You almost hear the words. You feel that they are not a threat."*
- If `wardensLegacyKnown`: *"The mark on the wall resolves. You recognize it now. It is very old. It was put there by someone who was told to put it there. They did exactly what they were asked. That is what the mark means."*

---

### XXIII-D. SQ Dreams — Scholar's Quarter, Weimar (Acts VI–VII, free sleep)

Base variants:

1. *"Pages turning by themselves. One at a time, deliberate. You have the impression that something is reading, not that the pages are moving."*
2. *"A name at the margin of a book. You almost read it. The handwriting is older than the paper it is written on."*
3. *"The archive is perfectly organized. The system makes sense. You understand the system completely in the dream and cannot explain it when you wake up."*

Flag-gated replacements:

- If `wmFirstResearcherKnown`: *"Document 3, the personnel file. You can read the name now. You read it again to make sure. It is the same name both times."*
- If `vaArchitectureKnown`: *"Constructor's Log, Entry 7: 'If someone is reading this, the sealing mechanism has activated.' You are reading it. You already knew this."*
- If `shardNotesAllRead`: *"Seven handwritings. You could identify each one now. They are distinct in the dream in a way they aren't on paper. You think: that is what a chain looks like."*

---

### XXIII-E. Implementation

**New const:** `INN_DREAMS` — object keyed by inn node code (`IN`, `SF`, `IS`, `SQ`).

Each entry:
```js
'IN': {
  base: ['...day1...', '...day2...', '...day3...'],
  conditional: [
    { flag: 'frobergerLastEntryRead', text: '...' },
    { flag: 'entry42Written', text: '...' },
    { flag: 'vaArchitectureKnown', text: '...' }
  ]
}
```

**Render logic:** In the sleep/rest function (after HP restore, before advancing `gameDay`):
1. Check if current node is an inn node — if not, no dream text
2. Select base variant: `INN_DREAMS[nodeCode].base[gameDay % 3]`
3. Check conditionals in order: use the first matching flag's text instead of base
4. Render dream text in a styled block (italic, smaller, below the HP restore confirmation)

**No new state flags, no new monsters, no new quests, no new items.** The dreams do not need tracking — they are ambient texture.

**One optional flag:** `firstDreamSeen` (boolean) — set on first dream render. Can be used by FC01 doc health or future achievement system. Otherwise has no effect.

---

### XXIII-F. Documentation Updates Required on Implementation

| File | Change |
|------|--------|
| `story.md` | Add §Inn Dreams section: full `INN_DREAMS` content for all 4 inns (base + conditional variants) |
| `mechanics.md` | Add §Sleep and Dreams to the rest/inn section: cycle logic, conditional check, render note |
| `plan.md` | Mark §XXIII complete; update §V-A queue |

No lab report needed — too small; document inline.

---

*§XXIII status: ✅ Implemented — INN_DREAMS const keyed by IN and SQ (SF/IS have sleep:false in WORLD_DB so were omitted); 3 base variants per inn cycling on gameDay % 3; flag-gated conditional checks (IN: frobergerLastEntryRead / entry42Written / vaArchitectureKnown; SQ: wmFirstResearcherKnown / vaArchitectureKnown / shardNotesAllRead); dream text fires via setTimeout after storyConfirmSleep() render, prefixed "💤 ‹dream›"; no new state flags.*

---

## Section XXIV — The Pressure Cascade: Visible Void Tide Events (Layer 59, ✅ Implemented)

> **Design problem:** `voidPressure` (0–10) is the game's central survival clock. Currently it accumulates silently — the player sees it in the HUD number but the world doesn't respond to it. The final defeat at pressure 10 feels sudden. This section makes the pressure visible in the world from the first crack to the imminent breach.

---

### XXIV-A. Design Intent

The Void Tide should feel like a physical presence that grows heavier as the run progresses. At low pressure (0–2) the world is normal. At medium pressure (3–5) cracks appear — in the environment text, in battle encounters, in the corridor grid. At high pressure (6–8) NPCs notice; monsters are affected; the map itself shows the strain. At critical pressure (9) the player receives a direct warning. The mercy window at pressure 9 + ≥ 5 shards gives the engaged player one last breath before the final push.

Three systems are extended: **world text** (node flavor lines keyed by pressure tier), **encounter tables** (void-touched monster variants injected at pressure ≥ 6), and **NPC reactions** (one pressure line per Dear Friend NPC at pressure ≥ 6).

---

### XXIV-B. Pressure Tier Thresholds

| Tier | Range | Name | Effect |
|------|-------|------|--------|
| 0 | 0–2 | Clear | No visible change. World is normal. |
| 1 | 3–5 | First Crack | Flavor text appears in certain node descriptions; corridor glyph `◈` appears at 1 randomly-selected node per visit at voidPressure ≥ 3 |
| 2 | 6–8 | Fracture | Void-touched monster variants join encounter tables; NPC Dear Friend pressure lines unlock; map header shows "The Void stirs." |
| 3 | 9   | Imminent | Player receives a modal warning; CO gate text changes; mercy window opens if ≥ 5 shards |

---

### XXIV-C. World Text — Pressure Lines

One additional flavor line is appended to certain node visit texts when the player arrives at that node and voidPressure ≥ 3. These lines are keyed to node clusters:

**Birka cluster (CI, SL, CR, BA, SH) — First Crack:**
> *"The cobblestones are colder than they should be."*

**Tilbury cluster (SF, PH, DK, MQ) — First Crack:**
> *"The harbor lights flicker without wind."*

**Weimar cluster (SQ, DF, WM) — First Crack:**
> *"The scholars' candles are burning down fast today."*

**Wilderness (GL, MT, MH, HM) — First Crack:**
> *"Something is bleeding through the rock."*

**At Fracture tier (voidPressure ≥ 6), a second line is added:**
> *"[node name]: the air here has a quality you can't name. Wrong, somehow."*

This is implemented as a helper `_voidFlavorLine(nodeCode)` that checks `S_story.voidPressure` and returns the appropriate string (or `""` at tier 0). The story node render function (`_renderNode()`) appends it to the existing node text if non-empty.

---

### XXIV-D. Corridor Glyph — The Void Crack `◈`

At voidPressure ≥ 3, one corridor cell adjacent to the player's current node is temporarily marked with `◈` instead of its normal glyph (`·`, `─`, `│`, `┼`, etc.). This is a cosmetic-only change — it does not block movement. The crack cell resets each time the player moves to a new node (it's not persistent — it's a visual shimmer, not a permanent map feature).

Implementation: after `_renderCorridorGrid()` writes the grid, a post-pass selects one of the 8 adjacent corridor cells at random (if any exist) and replaces its character with `◈` and colors it with `#7744aa` (void purple). This requires no new state — it is computed fresh on each render.

---

### XXIV-E. Void-Touched Monster Variants (voidPressure ≥ 6)

Two new `MONSTER_POOL` entries are added. They are injected into specific `WORLD_DB` terrain entries at runtime (not hardcoded into WORLD_DB — injected via `_applyVoidPressureMonsters()` called at session start after `voidPressure` is loaded):

**`void_wolf`**
```
key:    void_wolf
name:   Void-Touched Wolf
icon:   🐺
ac:     13
hp:     28
atk:    +5
die:    8, dieCount: 1, mod: 3
tier:   medium
drop:   { name: "Void Shard", icon: "◈", sell: 25 }
```
Injected into: `dark_forest`, `mountain_pass`, `GL wilderness` terrain WORLD_DB entries when `voidPressure ≥ 6`.

**`void_rat_swarm`**
```
key:    void_rat_swarm
name:   Void Rat Swarm
icon:   🐀
ac:     12
hp:     18
atk:    +4
die:    4, dieCount: 2, mod: 0
tier:   low
drop:   { name: "Void Shard", icon: "◈", sell: 15 }
```
Injected into: `alley`, `city_slums`, `sewers` WORLD_DB entries when `voidPressure ≥ 6`.

The `Void Shard` drop item (not a Codex Shard — different item) is a sellable minor lore relic with flavor text: *"A fragment of something that shouldn't exist."* It sells for 15–25 gold and is not part of the Codex Shard count.

---

### XXIV-F. NPC Pressure Lines (Dear Friend, voidPressure ≥ 6)

Each of the 6 core NPCs (Yael, Brynn, Quill, Pachelbel, Weckmann, Auros) gets one additional dialogue line injected into their Dear Friend dialogue pool when `voidPressure ≥ 6`. These are checked in `_getNPCDialogue()` after the normal Dear Friend quote is selected — if the pressure condition is met, the pressure line replaces the normal quote (or is appended, implementation choice).

| NPC | Pressure line |
|-----|--------------|
| Yael | *"The city is holding its breath. Even the rioters have gone quiet."* |
| Brynn | *"My candles won't stay lit past midnight. I've started leaving the fire banked all night."* |
| Quill | *"The numbers in the ledger keep adding up wrong. I've checked them four times."* |
| Pachelbel | *"Three students fainted in the atelier today. The air feels thick. Like before a storm that never breaks."* |
| Weckmann | *"I've been keeping the forge running later than usual. It feels wrong to let the fire go out."* |
| Auros | *"Something is moving in the Convergence. Not the Commander. Something older."* |

These lines are stored in a new const `NPC_VOID_PRESSURE_LINES` keyed by NPC ID. The check is: `if (S_story.voidPressure >= 6 && S_story['fav_' + npcId] >= 2)` — only Dear Friends (fav ≥ 2) hear this line.

---

### XXIV-G. The Pressure 9 Warning — "Imminent Breach"

When `voidPressure` reaches exactly 9 (transition from 8→9 via `_addVoidPressure()`), a modal fires once:

```
┌─────────────────────────────────────────────────────┐
│  ⚠️  THE VOID IS IMMINENT                           │
│                                                     │
│  Pressure: 9 / 10.                                  │
│                                                     │
│  One more day without reaching the Convergence      │
│  and the Void breaks through. The world ends        │
│  tomorrow if you rest.                              │
│                                                     │
│  [Shards collected: N / 7]                          │
│                                                     │
│  [I understand]                                     │
└─────────────────────────────────────────────────────┘
```

State flag: `voidImminentWarned` (boolean, default false). The modal fires once and sets the flag. The `[Shards collected]` line is dynamic.

**CO Gate text at pressure 9 (without 7 shards):**
> *"The gate is sealed. You need all seven Codex Shards. [N/7 shards collected.] The Void is one day away."*

This replaces the normal gate-locked text when `voidPressure ≥ 9`.

---

### XXIV-H. Mercy Window — One Last Rest

When `voidPressure` reaches 9 AND the player has ≥ 5 shards, a one-time "mercy rest" becomes available: the player may rest once without voidPressure increasing. This is stored in:

```
S_story.void_mercy_count  (int, default 0)
```

Set to 1 when `voidPressure` transitions to 9 and `S_story.shards >= 5`. During the rest mechanic in `storyRest()`, if `void_mercy_count > 0`, skip the pressure increment and decrement `void_mercy_count` to 0. A small text note: *"You sleep fitfully. The Void holds its breath with you."*

This is intentionally not well-telegraphed — it's a mechanical grace for engaged players who are close to the end. Players who have only 0–4 shards at pressure 9 do not receive the mercy window.

---

### XXIV-I. New State Flags

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `voidCrackFired` | boolean | false | First Crack pressure text has been shown at least once (suppress repeat modal) |
| `voidFracturesFired` | boolean | false | Fracture tier crossed; NPC pressure lines unlocked; void-touched monsters injected |
| `voidImminentWarned` | boolean | false | Pressure 9 modal has fired |
| `void_mercy_count` | int | 0 | Number of mercy rests remaining at pressure 9 (set to 1 once if shards ≥ 5) |

Note: no new persistent monster pool entries need separate flags — the injection is computed from existing `voidPressure` state on load.

---

### XXIV-J. Insertion Spec for `roll2hit-v3.html`

**XXIV-J-1.** Add `void_wolf` and `void_rat_swarm` to `MONSTER_POOL` (after existing wolf/rat entries; include `voidTainted: true` property).

**XXIV-J-2.** Add `VOID_SHARD` to a loot/drop table (or define inline in monster entries — follow existing `MONSTER_DROPS` pattern).

**XXIV-J-3.** Add `NPC_VOID_PRESSURE_LINES` const (object, 6 keys: `yael/brynn/quill/pachelbel/weckmann/auros`).

**XXIV-J-4.** In `_getNPCDialogue()`: after selecting the Dear Friend quote, check `S_story.voidPressure >= 6` and `fav >= 2`; if true, return `NPC_VOID_PRESSURE_LINES[npcId]` instead.

**XXIV-J-5.** In `_addVoidPressure()`: add threshold checks:
- At pressure 3 → set `voidCrackFired = true` (flag for node render)
- At pressure 6 → set `voidFracturesFired = true`; call `_applyVoidPressureMonsters()`
- At pressure 9 → set `voidImminentWarned` modal trigger; set `void_mercy_count = (shards >= 5) ? 1 : 0`

**XXIV-J-6.** New function `_applyVoidPressureMonsters()`: if `voidPressure >= 6`, push `'void_wolf'` into `WORLD_DB['dark_forest'].monsters` etc. — check for duplicates before pushing. Called once per session load after state restore.

**XXIV-J-7.** New function `_voidFlavorLine(nodeCode)`: returns pressure tier string for the given node, or `""`. Called from `_renderNode()` after existing node text render.

**XXIV-J-8.** In `_renderCorridorGrid()`: post-pass `◈` crack cell injection when `voidPressure >= 3`. Select one adjacent corridor cell pseudorandomly from `S_story.day % [adjacents.length]` (deterministic per day, not per render — avoids shimmer on re-render).

**XXIV-J-9.** In `storyRest()`: check `void_mercy_count > 0` before `_addVoidPressure()`; if true, skip pressure and decrement mercy count. Add flavor text to rest output.

**XXIV-J-10.** Gate text override at CO: in the gate-locked modal function, check `voidPressure >= 9` and append the urgency line.

---

### XXIV-K. Documentation Updates Required on Implementation

| File | Update |
|------|--------|
| `monsters.md` | Add `void_wolf` and `void_rat_swarm` stat blocks; note `voidTainted` flag |
| `story.md` | Add "Void Tide Events" stub (XXIV-C flavor lines); add Mercy Window note |
| `world.md` | Add Void-Touched Monsters note; NPC pressure lines listed |
| `mechanics.md` | Update `voidPressure` section: add threshold events table, mercy window rule, CO gate override |
| `plan.md` | Mark §XXIV complete; update §V-A queue |

No lab report needed — extend `lab-report-living-world.md` with a §XXIV appendix note.

---

*§XXIV status: ✅ Implemented — void_wolf + void_rat_swarm added to MONSTER_POOL (voidTainted:true); void_wolf/void_rat_swarm drops in MONSTER_DROPS; NPC_VOID_PRESSURE_LINES const (6 keys); _voidFlavorLine() helper (4 clusters, tiers 3+/6+); _addVoidPressure() refactors raw increments with threshold checks (3→voidCrackFired, 6→voidFracturesFired, 9→imminentWarned + mercy count); mercy window in storyCheckVoidTide(); void flavor appended in storyRender(); CO gate urgency text; NPC Dear Friend pressure lines (first-time flag per NPC); 4 state flags.*


---

## Section XXV — The Homecoming: Act VIII One-Time Farewell Beats (Layer 60, ✅ Implemented)

> **Design problem:** Act VIII returns the player to Birka, but the 6 core NPCs don't acknowledge that the player has been gone for the entire journey — they cycle through the same dialogue pool as always. The emotional climax of the story happens at CO, but the *human* climax should happen here, in the last town, with the people the player actually knows. This section adds six one-time farewell beats that fire exactly once in Act VIII and are never repeated.

---

### XXV-A. Design Intent

The farewell beats are not quests. There is no objective text, no completion reward beyond the beat itself (and in two cases, a small item). They are triggered automatically when the player visits an NPC's node during Act VIII with at least Friendly favorability. Once fired, the flag is set and the NPC returns to normal dialogue.

The beats accomplish three things:
1. Acknowledge the player's journey across eight acts without summarizing it — they show rather than tell.
2. Give each NPC a final emotional note consistent with their arc: Yael's witness-keeping, Brynn's quiet care, Quill's reconciled ledger, Pachelbel's recovered creativity, Weckmann's recognition, Auros's unsentimental preparation.
3. Provide two small mechanical gifts (Brynn's Loaf, Champion's Tincture) that are useful for the final push — earned, not handed over.

---

### XXV-B. Trigger Conditions

All six beats use the same logic:

```
if (actNumber === 8
    && npcFavorability[npc] >= 1
    && !S_story['act8Farewell' + Npc])
{
    fireAct8Farewell(npc);
    S_story['act8Farewell' + Npc] = true;
}
```

This check runs in `_renderNpcCard()` before the normal dialogue is selected. When fired, the farewell beat renders as a distinct modal (parchment or speech overlay — same style as Froberger journal entry modals) rather than as a dialogue quote, so it doesn't consume one of the NPC's five-quote rotation slots.

**Act VIII detection:** `S_story.actNumber === 8` is set when the player reaches the IN node on their return (the existing act transition logic handles this).

**NG+ behavior:** The six flags are NOT preserved across NG+. On NG+, the player re-experiences them. This is intentional — the farewell beats are about the end of this run, not about accumulated memory. (NG+ has its own separate epilogue system.)

---

### XXV-C. The Six Farewell Beats

---

#### C-1. Yael Scheidemann — *"The List"* (CI node, fav ≥ 1)

> *"You came back. I wasn't certain you would — I'm not being unkind, I just know what the road between here and the Convergence costs people.*
>
> *While you were gone I've been building something. Not a movement, not a cause. Just a list. Names. People who know what happened here — what the Void is, what the Scholar Kings suppressed, what it cost to hold it back. People who will tell the truth about this, after.*
>
> *Whatever 'after' looks like — whether you come back or not — the truth will be harder to erase than it's been. That's the only kind of victory I know how to build.*
>
> *Go do the other kind."*

No item. No mechanical gift. The beat is the gift.
Flag: `act8FarewellYael`

---

#### C-2. Brynn — *"Too Much Bread"* (IN node, fav ≥ 1)

> *"Sit down. I made too much bread today — I always do when I'm worried, and I've been worried since Act III, so there's quite a lot of it.*
>
> *Don't argue about the room cost. Don't argue about the bread. You've been traveling on short rations and I can tell. You have the look of someone who's been eating just enough to keep moving.*
>
> *Take it. It'll keep."*

**Auto-gives to inventory:** `brynns_loaf`
```
key:   brynns_loaf
name:  Brynn's Loaf
icon:  🍞
type:  food
heal:  8
desc:  "Still warm. Brynn's bread always is."
sell:  0   (cannot be sold — Brynn would be offended)
```

Use during combat or at any node to restore 8 HP. One-use.
Flag: `act8FarewellBrynn`

---

#### C-3. Quill Faber — *"The Ledger Closes"* (BA node, fav ≥ 1)

> *"I've been going through the old ledgers. All the debts that seemed so significant. The Couperin estate. The back payments. The interest that had been accumulating for longer than either of us had been keeping accounts.*
>
> *They balance now. Some were paid. Some were forgiven. Some just stopped mattering — which is its own kind of payment.*
>
> *I think I understand the note Couperin left better now. 'Just a number.' He didn't mean the debt was meaningless. He meant it had served its purpose and could be released. He was teaching me something. It just took me this long to learn it.*
>
> *Good luck out there. I'll keep the books straight here."*

No item. Quill's arc completes here. This is the third and final beat of his journey (debt degradation → `couperiDebtDegraded` flag → this farewell).
Flag: `act8FarewellQuill`

---

#### C-4. Pachelbel Voss — *"The Sketch"* (SH node, fav ≥ 1)

> *"I've been writing something. I don't know if it's good — I'm not sure that question is the right one anymore.*
>
> *It's honest. That's the difference between the work I did before you cleared my debt and the work I'm doing now. I was composing to prove something. Now I'm composing because there's something in me that needs to come out.*
>
> *I'd like you to have this. It's not finished — I don't think it should be finished by me alone. Maybe you'll understand it. Maybe you'll leave it for someone else to read."*

**Auto-gives to inventory:** `pachelbels_sketch`
```
key:    pachelbels_sketch
name:   Pachelbel's Sketch
icon:   📄
type:   readable
text:   "Three lines of notation. A rest. Then three more, transposed up a fifth.
         The intervals spell out something — or almost spell it out, the way all
         honest things approach their meaning diagonally.
         At the bottom, in small letters: 'For the one who came back.'"
sell:   0
```

No mechanical effect. A readable item that carries the tone of the ending. Can be read from inventory like a tome.
Flag: `act8FarewellPachelbel`

---

#### C-5. Weckmann — *"The Tincture"* (CR node, fav ≥ 1)

> *"You look different.*
>
> *I've been in this business long enough to know what the road does to people. Most come back smaller — worn down, quieter, like something got used up. Some don't come back at all. You came back standing straight. That's rarer than it sounds.*
>
> *I was holding this for a champion. Not the pit-fight kind — the kind that earns it out there, where nobody's watching and there's no purse at the end. Take it. You'll know when to use it."*

**Auto-gives to inventory:** `champions_tincture`
```
key:    champions_tincture
name:   Champion's Tincture
icon:   ⚗️
type:   consumable
effect: advantage_next_attack
desc:   "Brewed by a man who knows champions. Tastes like iron and pine resin."
sell:   0
```

When used before an attack roll (in battle UI: a "Use Item" action that costs no AP), grants advantage on that roll. One-use. The `advantage_next_attack` flag is set and consumed on the next ATK roll.
Flag: `act8FarewellWeckmann`

---

#### C-6. Auros (Commander Seraphine Bruhns) — *"Be Ready"* (BK or Auros node, fav ≥ 1)

> *"I won't say goodbye. That's what people say when they're not sure something will work.*
>
> *I'll say: be ready. The Convergence has been waiting longer than either of us has been alive. It isn't patient — patience implies willingness to wait. It's simply there. It's always been there.*
>
> *What you bring to it matters. Not just the Shards — those are the key, not the reason. The reason is everything you did between collecting them. Whether you know that yet or not.*
>
> *I'll see you on the other side of it. One way or another."*

No item. Auros's beat is forward-facing — the only farewell beat that looks toward CO rather than back at the journey. It also carries the ambiguity of her final role (she is the antagonist at CO, but she says this as an ally — the player will remember it during the final battle).
Flag: `act8FarewellAuros`

---

### XXV-D. New Items Summary

| Key | Name | Icon | Type | Effect | Sell |
|-----|------|------|------|--------|------|
| `brynns_loaf` | Brynn's Loaf | 🍞 | food | Heal 8 HP (one-use) | 0 (no sell) |
| `pachelbels_sketch` | Pachelbel's Sketch | 📄 | readable | In-world prose (no mechanical effect) | 0 |
| `champions_tincture` | Champion's Tincture | ⚗️ | consumable | Advantage on next attack roll | 0 |

All three items have `sell: 0` — they cannot be sold to vendors. Attempting to sell them returns: *"[Item] is not something you can sell."* This is enforced in the vendor UI by checking `item.sell === 0`.

---

### XXV-E. New State Flags

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `act8FarewellYael` | boolean | false | Yael's Act VIII beat has fired |
| `act8FarewellBrynn` | boolean | false | Brynn's Act VIII beat has fired |
| `act8FarewellQuill` | boolean | false | Quill's Act VIII beat has fired |
| `act8FarewellPachelbel` | boolean | false | Pachelbel's Act VIII beat has fired |
| `act8FarewellWeckmann` | boolean | false | Weckmann's Act VIII beat has fired |
| `act8FarewellAuros` | boolean | false | Auros's Act VIII beat has fired |

All 6 default to false. Reset to false on NG+ (not preserved).

---

### XXV-F. Insertion Spec for `roll2hit-v3.html`

**XXV-F-1.** Add `brynns_loaf`, `pachelbels_sketch`, `champions_tincture` to an appropriate item pool (or define inline at point of use, as `const ACT8_FAREWELL_ITEMS`). These are one-off items that don't belong in LOOT_TABLE, SHIELD_ITEMS, etc. — define them in a dedicated `ACT8_GIFTS` object keyed by NPC.

**XXV-F-2.** Add 6 flags to `_S_DEFAULTS()`:
```js
act8FarewellYael:      false,
act8FarewellBrynn:     false,
act8FarewellQuill:     false,
act8FarewellPachelbel: false,
act8FarewellWeckmann:  false,
act8FarewellAuros:     false,
```

**XXV-F-3.** New function `_checkAct8Farewell(npcKey)`:
```js
function _checkAct8Farewell(npcKey) {
  const flagKey = 'act8Farewell' + npcKey[0].toUpperCase() + npcKey.slice(1);
  if (S_story.actNumber !== 8) return false;
  if ((S_story['fav_' + npcKey] || 0) < 1) return false;
  if (S_story[flagKey]) return false;
  return true;
}
```

**XXV-F-4.** In `_renderNpcCard(key, container)`: call `_checkAct8Farewell(key)` before building the normal dialogue. If true:
- Call `_fireAct8Farewell(key)` to render the farewell modal
- Set `S_story[flagKey] = true`
- Return early (don't render the normal NPC card this visit)

**XXV-F-5.** New function `_fireAct8Farewell(npcKey)`: renders the farewell text in a modal (parchment style, same as Froberger journal entry overlays). If the NPC has a gift item, push it to `S_story.inventory` and append `"\n\n[Received: {itemName}]"` to the modal text. Include a `[Close]` button.

**XXV-F-6.** Add `champions_tincture` effect handling to battle phase: in the pre-attack step, check `S_story.inventory` for `champions_tincture`. If found and player activates it (Use Item action, 0 AP), set `S_story._advantageNextAttack = true`, remove item from inventory. In attack roll: if `_advantageNextAttack`, roll twice and take higher; then set `_advantageNextAttack = false`.

**XXV-F-7.** Add `brynns_loaf` healing: in inventory/Use Item flow, handle `type: 'food'` items similarly to healing potions — restore `item.heal` HP, clamp at `hpMax`, remove item.

**XXV-F-8.** Add `pachelbels_sketch` readable: in inventory/Use Item flow, handle `type: 'readable'` — render `item.text` in a small modal. Same treatment as other tome-class items.

---

### XXV-G. Documentation Updates Required on Implementation

| File | Update |
|------|--------|
| `story.md` | Add "Act VIII Farewell Beats" section with all 6 beat texts (PLANNED → IMPLEMENTED) |
| `world.md` | Add note under each NPC profile entry: farewell beat summary |
| `mechanics.md` | Add food item type (`brynns_loaf`); add consumable advantage mechanic (`champions_tincture`); add readable item type (`pachelbels_sketch`) |
| `plan.md` | Mark §XXV complete; update §V-A queue |

No lab report needed. Document inline.

---

### XXV-H. Thematic Coherence Note

The farewell beats respect each NPC's established arc without summarizing it. They trust the player to have lived those arcs and to receive the final note as a resonance, not a recap:

- Yael doesn't say "remember all those quests we did." She just shows what she built while the player was gone.
- Brynn doesn't say "I was worried." She shows it: bread.
- Quill doesn't summarize the Couperin debt arc. He arrives at the lesson and lets it land.
- Pachelbel doesn't say "thank you for paying my debt." He gives the player the art that the debt was preventing.
- Weckmann doesn't list the player's achievements. He describes what he sees when he looks at them.
- Auros doesn't warn or advise. She says "be ready" and means it entirely.

None of these beats explain the game to the player. They assume the player already knows.

---

*§XXV status: ✅ Implemented — ACT8_FAREWELL_BEATS const (6 NPCs: yael/brynn/quill/pachelbel/crov/auros); fires via _renderNpcCard() when actNumber === 8 + fav ≥ 1 + flag not set; storyMsg with 🌅 prefix; Brynn's Loaf (type:potion heal:8), Pachelbel's Sketch (type:readable), Champion's Tincture (type:consumable effect:advantage_next_attack); tincture effect in doPlayerAttack(); 6 state flags; consumable+food use buttons added to inventory.*

---

## Section XXVI — Corelli the Wandering Merchant: Cross-Act Vendor NPC (Layer 61, ✅ Implemented 2026-05-25)

> **Design problem:** All vendor-capable NPCs in the game are fixed to a single node. The world has four towns and multiple vendor-adjacent locations, but no character who *travels through* the world in the same direction the player does. A wandering merchant creates the sensation that the world is inhabited by people who have their own routes — that the player isn't the only one crossing it.

---

### XXVI-A. The Merchant — "Corelli"

**Name:** Corelli. No given name offered until Dear Friend. Players will call them "the merchant" for most of the run — which is intentional.

**Physical:** Indeterminate age. Heavy oilskin coat. A cart that's always slightly different from the last time you saw it — not larger, just rearranged. Never explains where the new items come from.

**Archetype:** The wandering merchant who has seen more than they're selling. They move through the same world the player does but on a different axis — their priorities are commerce and safety, not the Codex. They've been through the Northern Reach before the player was born.

**True backstory (revealed at Dear Friend):** Former courier for the Ivory Circle's distribution branch — not a Scholar King themselves, but someone who carried their sealed documents for six years without asking what was in them. Went rogue when they accidentally read one. Has been selling the Scholar Kings' lost items ever since — not to expose them, but because *someone should have these things*.

---

### XXVI-B. Appearances — Five Nodes Across Five Acts

Corelli is not an NPC in `NPC_DIALOGUES` (which covers fixed Birka NPCs). They are a new NPC type: a **vendor-modal NPC** who appears at specific nodes during specific acts, rendered through the existing vendor modal system with an extended dialogue header.

| Appearance | Node | Act | Dialogue opener |
|-----------|------|-----|----------------|
| 1st | TL (Tilbury) | II | *"New in Tilbury? Thought so. You have the look of someone who just arrived and hasn't decided if they trust the harbor yet."* |
| 2nd | RD (Roadside camp node between Tilbury and Visby) | III | *"We meet again. I saw you in Tilbury — don't be alarmed, I remember everyone I sell to."* |
| 3rd | IS (Visby Smuggler's Safe House) | V | *"Visby. Well. You've been going places. I've been going places too, just different ones. Still — here we are."* |
| 4th | WM (Weimar Scholar's Quarter) | VI | *"The Ivory Circle makes me nervous. I used to work adjacent to them. I try not to stay in Weimar long. But you — you look like you've been asking questions here. Good. Keep asking."* |
| 5th | IN (Birka First Inn) | VIII | *"End of the road. Or the beginning of one, depending. You look like you've come the whole way. I have too. I always end up back here."* |

**Detection:** Corelli appears when `actNumber` matches the appearance's act AND `corelli_encounter_count < appearance_index`. The check runs in `storyRender()` for these specific node codes, adding a special "Traveling Merchant" button to the node UI (styled like an NPC card, not a vendor button).

---

### XXVI-C. Favorability — Purchase-Gated, Not Conversation-Gated

Unlike the six Birka NPCs (conversation and quest-gated fav), Corelli's favorability is entirely purchase-driven:

```
fav_corelli  = floor(corelli_purchase_count / 1)  (capped at 3)
```

Every purchase from Corelli increases `corelli_purchase_count` by 1 and re-evaluates `fav_corelli`. No greeting changes. No quest needed. The relationship is built through commerce — which is all they'll say about themselves until trust is established.

| fav_corelli | Title | Dialogue behavior |
|------------|-------|------------------|
| 0 | Stranger | Standard vendor opener; remembers nothing between visits |
| 1 | Regular | Comments on the player's last purchase; one observation about what they've seen on the road |
| 2 | Trusted Client | Shares one piece of road intelligence per visit (useful lore or navigation note); at WM appearance: *"I haven't worked for them in six years. But I kept the seal. It still opens most of their archives."* |
| 3 | Dear Friend | On 5th appearance (IN, Act VIII): fires the Revelation modal before vendor screen |

---

### XXVI-D. The Revelation Modal (fav = 3, 5th appearance)

When the player reaches Corelli's 5th appearance in Birka with `fav_corelli >= 3` and `!corelliRevelationDelivered`:

> *"Six years I carried sealed documents for the Ivory Circle. Documents between the Scholar Kings and their contractors — institutions, archivists, field correspondents. I never opened them.*
>
> *Then one seal broke in the rain. Just the outer wrapper. I had three days before the next courier exchange, so I read what was inside.*
>
> *It was an order. A suppression order. For a researcher named — they called her 'the Antecedent.' They were very careful not to use her name.*
>
> *The order said: remove her findings from the distribution network. All copies. All correspondence. All record of the correspondence. Do not destroy — destroy leaves a record of destruction. Reclassify. The word they used was 'reclassify.'*
>
> *I've been selling her things ever since. Not all of them. I'm not foolish. But the ones that would find the right hands eventually. I think you might be the right hands.*
>
> *Take this. Don't ask where I found it."*

**Auto-gives to inventory:** `last_cipher`

```
key:   last_cipher
name:  The Last Cipher
icon:  🔐
type:  readable
text:  "A Scholar King administrative cipher key — the kind used to decode sealed
        distribution correspondence. At the bottom, in a different hand:
        'Antecedent Containment Protocol, cycle 3. All materials reclassified.
        Distribution route: suppressed.
        Reason on file: CLASSIFICATION LEVEL 7.'
        Beneath that, scratched with a nail rather than written with a pen:
        'She built it to save us. They hid it to save themselves.'"
sell:  0
```

If the player has `encoded_letter` in inventory (from Corelli's 3rd appearance), reading `last_cipher` unlocks an additional inventory note appended to the `encoded_letter` item text: *"[Decoded with the Last Cipher: 'Route suppressed by order of the Circle. Contents: Antecedent Completion Protocol, draft 3. Status: reclassified, not destroyed.']"*

Cross-reference: §XVI (First Researcher = "the Antecedent"), §XVII (Antecedent Containment Protocol), §XXII (shard 5 placed by First Researcher).

Flag: `corelliRevelationDelivered = true`

---

### XXVI-E. Unique Items Per Appearance

Each appearance offers 1–2 standard items (potions, condition items at market rate) plus one unique item not available anywhere else. Standard items follow existing vendor pricing; unique items have fixed prices.

| Appearance | Unique Item | Price | Description |
|-----------|-------------|-------|-------------|
| 1st (TL) | `scholar_ink` | 120g | Readable: a dismissed scholar's notes on voidPressure accumulation rates; cross-ref §XXIV — hints at the 3/6/9 threshold events |
| 2nd (RD) | `false_warrant` | 200g | Consumable: skip one forced corridor encounter (the player "shows papers" — not available at ≥ voidPressure 7; the Void makes forgeries meaningless) |
| 3rd (IS) | `encoded_letter` | 80g | Readable: partially decrypted Scholar King correspondence mentioning "the Antecedent's route" — unreadable without the Last Cipher |
| 4th (WM) | `kings_seal` | 350g | Trinket: +1 bonus to one saving throw per short rest; *"I haven't used it since I left their service. Might as well be good for something."* |
| 5th (IN) | `last_cipher` | Auto-given at Dear Friend (no purchase needed) | See §XXVI-D |

---

### XXVI-F. Roadside Node (RD) — New Junction Point

The 2nd appearance (Act III) requires a node between Tilbury and Visby that isn't currently in the node map. Rather than adding a new full story node, a **junction waypoint** `RD` (Roadside) is added — a minor corridor node with:
- No battle or loot
- No sleep
- Only: NPC encounter (Corelli on 2nd appearance) + brief node text
- Connected to the Act III corridor path

Node text: *"A cleared verge where travelers sometimes stop. A fire ring, cold. Someone's broken cart wheel leaning against the tree line."*

If the player arrives and Corelli's 2nd appearance conditions aren't met, the node is empty — just passage. This follows the §XVIII junction vignette model.

`RD` node spec:
```
code:    RD
text:    "A cleared verge where travelers sometimes stop. A fire ring, cold..."
npc:     null (Corelli is rendered separately by act check)
loot:    null
battle:  null
sleep:   null
connections: { N: [Act III path north], S: [Act III path south] }
terrain: road
act:     3
```

---

### XXVI-G. New State Flags and Constants

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `fav_corelli` | int | 0 | Favorability tier (0–3); increments per purchase |
| `corelli_purchase_count` | int | 0 | Total purchases from Corelli across all appearances |
| `corelli_encounter_count` | int | 0 | How many of the 5 appearances have fired |
| `corelliRevelationDelivered` | boolean | false | Revelation modal has fired on 5th appearance |

New const: `CORELLI_APPEARANCES` — array of 5 objects `{node, act, opener, uniqueItemKey}`, checked against `actNumber` and `corelli_encounter_count` on each `storyRender()` call.

---

### XXVI-H. Insertion Spec for `roll2hit-v3.html`

**XXVI-H-1.** Add `scholar_ink`, `false_warrant`, `encoded_letter`, `kings_seal`, `last_cipher` item definitions to a new `CORELLI_ITEMS` object.

**XXVI-H-2.** Add 4 flags to `_S_DEFAULTS()`: `fav_corelli`, `corelli_purchase_count`, `corelli_encounter_count`, `corelliRevelationDelivered`.

**XXVI-H-3.** Add `RD` node to `NODE_MAP` and `NODE_COORDS`; connect to Act III corridor path. Follow §XVIII junction vignette style.

**XXVI-H-4.** Add `CORELLI_APPEARANCES` const (5-element array). Each entry: `{nodeCode, actMin, actMax, opener, uniqueItemKey}`.

**XXVI-H-5.** New function `_checkCorelliAppearance(nodeCode)`: called from `storyRender()`. Returns the matching appearance object if `actNumber` is in range and `corelli_encounter_count < appearance_index`; otherwise null.

**XXVI-H-6.** New function `_renderCorelliVendor(appearance)`: renders a modified vendor modal with Corelli's dialogue header (shows fav-appropriate opener, road intelligence if fav ≥ 2), then the unique item for this appearance, then 2 standard items. On purchase: `corelli_purchase_count++`, `fav_corelli = min(3, floor(corelli_purchase_count))`, auto-save.

**XXVI-H-7.** After `_renderCorelliVendor()` call: increment `corelli_encounter_count`. On 5th encounter with `fav_corelli >= 3`: fire `_renderCorelliRevelation()` before vendor modal, set `corelliRevelationDelivered = true`, push `last_cipher` to inventory.

**XXVI-H-8.** `false_warrant` handling: in corridor encounter check function, if `false_warrant` is in inventory and player activates it, skip the encounter, consume item, add storyMsg: *"The patrol glances at your papers and waves you through."* Disabled if `voidPressure >= 7`.

**XXVI-H-9.** `encoded_letter` + `last_cipher` interaction: in the readable item display function (`_showReadable()`), after rendering `encoded_letter`, check if `last_cipher` has been read (`kings_seal` or check inventory). If `corelliRevelationDelivered`, append decoded footnote to `encoded_letter` display text.

**XXVI-H-10.** `kings_seal` trinket: add to equipped items slot or passive-item slot (implementation follows existing trinket system if present; if not, define `passiveItemSlot` as new equippable slot with one active item at a time). Effect: `+1` to one saving throw per short rest — simplest implementation: on short rest, if `kings_seal` in inventory, add +1 to lowest current ability modifier for that rest's effect.

---

### XXVI-I. Lab Report Trigger

This section introduces a new **NPC archetype** — the wandering vendor — that doesn't exist in the current codebase. The existing `NPC_DIALOGUES` system covers fixed-node NPCs with 4 states × 5 quotes. Corelli is a different shape: vendor-modal NPC, purchase-gated fav, per-appearance unique items, act-range detection. This architectural difference is significant enough to warrant `lab-report-corelli-merchant.md`:

- Documents the new NPC archetype vs. existing `NPC_DIALOGUES` shape
- Explains the purchase-gated fav system vs. conversation/quest-gated
- Describes `CORELLI_APPEARANCES` const structure and `_checkCorelliAppearance()` logic
- Notes the `RD` roadside node addition and its relation to §XVIII junction model
- Catalogs all 5 unique items and their cross-references

Write this lab report **before implementing** (design-spec report, not postmortem).

---

### XXVI-J. Documentation Updates Required on Implementation

| File | Update |
|------|--------|
| `story.md` | Add Corelli section to NPC roster; 5 encounter stubs with node/act/unique item; Revelation modal text |
| `world.md` | Add "Wandering Merchant" NPC profile: backstory, fav system, road intelligence lines |
| `maps.md` | Add `RD` (Roadside) node to grid, node network, coordinate index |
| `monsters.md` | No new monsters |
| `mechanics.md` | Add `false_warrant` consumable; `kings_seal` trinket; `encoded_letter` + `last_cipher` readable interaction |
| `plan.md` | Mark §XXVI complete; update §V-A queue |

---

### XXVI-K. Thematic Coherence Note

Corelli is the first NPC in the game whose loyalty is not to a faction, a cause, a debt, or a friendship — only to the act of making sure certain things find the right hands. They don't fight. They don't quest. They sell. But what they sell, and when, and who they eventually tell — that's the whole arc.

The Scholar Kings suppressed "the Antecedent." Corelli has been quietly, commercially dismantling that suppression for six years. By the time the player reads the Last Cipher in Birka's First Inn, on the night before the Convergence, everything the Scholar Kings tried to hide about the First Researcher is now in the player's hands — not through heroics, but through six years of a merchant keeping the right things in circulation.

The Last Cipher's final line — *"She built it to save us. They hid it to save themselves."* — is scratched with a nail, not written with a pen. Corelli didn't write it. They found it that way.

---

*§XXVI status: ✅ Implemented 2026-05-25 — CORELLI_ITEMS const (5 items: scholar_ink/false_warrant/encoded_letter/kings_seal/last_cipher); CORELLI_APPEARANCES const (5 appearances: DK/RD/BK/SQ/IN); RD node (num:78, act:3) added to NODE_MAP between J6↔MI; _checkCorelliAppearance() + _corelliOpener() helpers; storyRender inline vendor button at all 5 nodes; purchase-gated fav (fav_corelli, corelli_purchase_count, corelli_encounter_count); Revelation modal at IN with auto-delivery of last_cipher (fav≥3); encoded_letter decoded footnote when corelliRevelationDelivered; false_warrant auto-consume on hunt-mode corridor encounter (disabled at voidPressure≥7); kings_seal +1 to death saves; 4 flags in _S_DEFAULTS().*

---

## Section XXVII — Town Crier: Inn Rest World-News Ambient Lines (Layer 62, ✅ Implemented)

> **Design problem:** Resting at an inn restores HP and advances the day counter, but the world doesn't react. The player sleeps, wakes up, and the node text is unchanged. This section adds one rumor line per inn rest — overheard from a traveler, posted on a board, murmured by the innkeeper — that reflects the current state of the world. The world is talking. The player overhears it.

---

### XXVII-A. Design Intent

The Town Crier system adds a single ambient line to the inn rest modal, after HP restoration and before the player closes the modal. The line is selected by a four-tier priority system: pressure-critical overrides everything; specific quest completions and NPC relationships surface targeted rumors; generic act-appropriate lines cycle by day when no specific condition applies.

**Key constraints:**
- No new state flags — the selector reads existing `S_story` fields and writes nothing
- No new state — lines repeat when their condition persists (a rumor about the Hollow Hands circulates for multiple days; that's authentic)
- No player pronoun — the crier speaks about the world, not to the player (*"someone was seen"*, never *"you were seen"*)
- One line per rest, never two — the priority system selects exactly one

**UI:** After the rest text (*"You sleep. [N] HP restored."*), a horizontal rule and one italic grey line:

```
────────────────────────────────────
[Town rumor] "Roads south of Tilbury are quiet — unusually
quiet, says a carter who came through yesterday."
```

---

### XXVII-B. Priority Tier System

```
Tier 1 (highest): voidPressure >= 9  →  critical[] (cycle by gameDay % 2)
Tier 2:           voidPressure >= 6  →  tension[]  (cycle by gameDay % 3)
Tier 3:           quest flags set    →  quests{}   (first matching key wins)
Tier 4:           NPC fav >= 2       →  npcs{}     (first matching Dear Friend wins)
Tier 5 (default): act-appropriate   →  acts[act]  (cycle by gameDay % 7)
```

Quest flag priority order (checked top to bottom, first match wins):
1. `warden_resolved` (§XXI persuasion complete)
2. `void_architect_seal` in inventory (§XVII)
3. `corelliRevelationDelivered` (§XXVI)
4. `vs_hollow_seal_taken` (§XX)
5. `tl_ori_account_read` (§XIX)
6. `yaelEscortDone` (Layer 41)
7. `quillQuestComplete`

NPC Dear Friend priority order:
1. Auros (2), Yael (1), Weckmann (3), Brynn (4), Quill (5), Pachelbel (6)

---

### XXVII-C. Complete Line Library

#### Critical Lines (voidPressure ≥ 9) — 2 lines, cycle by `gameDay % 2`

```
[0] "The Convergence lights were visible from the north road last night.
    Three travelers saw them. Nobody is talking about what it means."

[1] "Three inns north of Weimar have closed without notice. The owners
    packed before dawn. One left a note: 'Go south.'"
```

#### Tension Lines (voidPressure ≥ 6) — 3 lines, cycle by `gameDay % 3`

```
[0] "Roads south of Tilbury are quiet — unusually quiet, says a carter
    who came through yesterday morning."

[1] "The Hollow Hands were seen near Visby — more of them than usual,
    and carrying something wrapped in cloth."

[2] "A scholar left Weimar without settling her accounts. Her rooms were
    found in order. Her notes were gone."
```

#### Quest-Specific Lines — one per flag, fires once per rest until condition changes

| Flag | Line |
|------|------|
| `warden_resolved` | *"Travelers on the northern road say the MT pass is open for the first time in forty years. Nobody knows why."* |
| `void_architect_seal` in inv | *"Someone in Weimar has been asking about the Antecedent Containment Protocols. The archivists say no such documents exist. Three of them said it simultaneously."* |
| `corelliRevelationDelivered` | *"A traveling merchant was seen leaving the Ivory Circle's distribution archive with a document case. The Circle says no such archive exists in this city."* |
| `vs_hollow_seal_taken` | *"The Hollow Hands' mark has disappeared from three Visby buildings overnight. The Crimson Warrant says they don't know what it means. They're lying."* |
| `tl_ori_account_read` | *"Someone has been asking at the Tilbury docks about a ship called the Ori's Hope. The Harbor Master says she has no record of it."* |
| `yaelEscortDone` | *"The Slums have been quieter since someone ran Varga's informants off the north end. Nobody's taking credit."* |
| `quillQuestComplete` | *"The ledger house near the Birka bar settled two long-outstanding debts this week. The creditors didn't argue, which is the strangest part."* |

#### NPC Dear Friend Lines — one per NPC at fav ≥ 2

| NPC | Line |
|-----|------|
| Auros | *"The Commander's office has had its lights on until the fourth hour three nights running. The duty sergeant says it's paperwork. The soldiers say she doesn't pace like that over paperwork."* |
| Yael | *"Someone has been posting unsigned bills overnight — the language matches those riot pamphlets from two years ago, but the message is different. Quieter."* |
| Weckmann | *"The unofficial sparring at the Crypt has a new rule: first one to leave the ring clean has to buy the next round. Weckmann started it. Nobody knows why."* |
| Brynn | *"The First Inn has been leaving a light on all night. The innkeeper says it's for late travelers. The regulars think she's waiting for someone."* |
| Quill | *"One of the bar's regulars paid a three-year-old tab last night — unprompted, in full, with a note that just said 'settling up.' Quill didn't comment."* |
| Pachelbel | *"New work has appeared in the shop district window — small format, unsigned, not for sale. A customer offered twice the likely price. The shopkeeper said it wasn't his to sell."* |

#### Act-Cycling Lines — 7 per act, cycle by `gameDay % 7`

**Act I — Birka:**
```
[0] "A courier from the Ivory Circle arrived in Birka this morning. Left
    without speaking to anyone. The message, if there was one, went
    directly to the High Council."

[1] "Someone's been asking questions at the Birka Slums about a man named
    Froberger. Nobody's saying much."

[2] "The crypt bell rang at the wrong hour last night. The sexton says
    it was wind. The sexton lives two streets away and wasn't there."

[3] "Three of Varga's usual informants didn't show up to their usual
    corners this morning. The fourth one is talking to nobody."

[4] "A pawnbroker on the east side bought a journal — old, leather,
    no name inside. Wouldn't say who sold it."

[5] "There's a new fighter at the unofficial pit. Won four bouts and
    disappeared before anyone got a name."

[6] "The High Council met twice this week without posting the agenda.
    That's happened three times in the last hundred years. Twice ended
    badly."
```

**Act II — Tilbury:**
```
[0] "A Conclave ship came in last night without running lights. The
    Harbor Master logged it as a supply run. The manifest was sealed."

[1] "Two of the Tilbury merchant guilds have stopped accepting letters
    of credit from the northern settlements. No announcement. Just stopped."

[2] "A sailor off a northern vessel asked about the Codex Shards at
    the harborside market. Paid in coin nobody recognized."

[3] "The Storefront Inn has a new lock on its private dining room.
    The innkeeper says it's for large parties. The room seats four."

[4] "Dock workers found something washed up on the south strand —
    wouldn't say what. The Conclave collected it before noon."

[5] "The Tilbury customs office turned away a scholar's wagon yesterday.
    Papers were in order. The reason given was 'classification concerns.'"

[6] "Harbor Master Rennau has been working late all week. The adjutant
    covers the mornings. Nobody is explaining the arrangement."
```

**Act III — The Coastal Road:**
```
[0] "A traveling physician on the road south says she's seen three
    villages where the wells have gone brackish overnight. She's heading
    north now."

[1] "Someone stripped a Hollow Hands lookout post near the coastal path.
    Left the equipment. Took the ledger."

[2] "A tinker on the road says the milepost stones between here and Visby
    have been moved — not stolen, just repositioned. Off by about ten yards."

[3] "A patrol out of Tilbury turned back at the third waypoint. Captain
    said the air 'didn't smell right.' Filed no further report."

[4] "Road traffic from the north has been lighter for five days. Merchants
    say they're taking the longer route. They're not saying why."

[5] "A shepherd's dog won't go past the fourth ridge. It's been doing
    this for a week. The shepherd moved his flock south."

[6] "A carter heading to Visby says the bridge at the Kelwick crossing
    is sound but the toll keeper was gone. The box was empty. The gate
    was open."
```

**Act IV — Western Coast:**
```
[0] "Fisherfolk on the western coves say the catch has been off for a
    week — wrong fish, wrong depth, wrong behavior. One crew came back
    early and wouldn't talk."

[1] "A lighthouse keeper's log found on the road — last entry three
    days ago: 'Something is moving below the surface. Not a ship.'"

[2] "The western coastal roads have no Crimson Warrant patrols this week.
    No explanation was posted. The absence is loud."

[3] "A trader from the coast says the tidewater has been wrong —
    not unusual, she says, just wrong. Like it's running a different
    schedule than the moon."

[4] "A group of scholars heading west turned back at the clifftop track.
    They won't say what they saw. Three of them aren't speaking to each
    other anymore."

[5] "Someone put a ward mark on the coastal waystation door last night.
    Old script. The type the Ivory Circle stopped using forty years ago."

[6] "A captain heading north says she saw lights under the water south of
    the headland. She's been sailing thirty years. She filed no report."
```

**Act V — Visby:**
```
[0] "Two Crimson Warrant officers were found unconscious in the lower
    market. No injuries. No explanation. Back on duty by nightfall."

[1] "A Hollow Hands broker has been making purchases in the legal market —
    openly, with legitimate coin. The Warrant is watching. So is everyone
    else."

[2] "The smuggler's underground has a new room that wasn't there last
    month. The regulars say it appeared overnight. Nobody asked questions."

[3] "Solvak's office has been closed three days running. His assistant
    says he's in meetings. The debt notices have still been going out."

[4] "An anonymous buyer purchased every remaining copy of a restricted
    Ivory Circle circular at the Visby book market. Paid double asking.
    The seller won't describe the buyer."

[5] "The goblin broker in the underground bought something yesterday
    that made her laugh for the first time in six months. She won't say
    what it was."

[6] "Three shipping contracts in the Visby ledger have been quietly
    voided this week. All three ran through the same northern route.
    All three are now listed as 'fulfilled.'"
```

**Act VI — Weimar:**
```
[0] "An Ivory Circle archive room was found unlocked this morning.
    The duty archivist says nothing is missing. The catalog says
    otherwise."

[1] "A visiting scholar gave a lecture at the Quarter that wasn't on
    the schedule. By the time anyone thought to stop it, it was over
    and the scholar was gone."

[2] "Three senior Circle members skipped the morning convocation without
    notice. Their offices are locked. Their assistants say they're
    'in consultation.'"

[3] "Someone has been leaving annotated pages in the Scholar's Quarter
    library — slipped into books, not checked out. The annotations are
    in a hand nobody recognizes."

[4] "The Ivory Circle's distribution manifest has a gap — seven weeks,
    about six years ago. Every record from that period references
    'Classification Level 7.' Nobody in the current archive has that
    clearance."

[5] "A retired Circle courier was seen in Weimar for the first time in
    years. Left the same day. Didn't visit any of their former colleagues."

[6] "The blacksmith quarter has a new commission — a large seal press,
    institutional size. The specifications match the Circle's old format.
    Nobody ordered it through the Circle."
```

**Act VII — Northern Reach:**
```
[0] "A goat herder near the high pass says the stones in the MT tunnel
    glow faintly at dusk. Has been happening for forty years. She stopped
    mentioning it because nobody believed her."

[1] "A pilgrim heading south says the northern road feels shorter than
    it used to. Not by distance — by time. She checked her clock three
    times."

[2] "The last waystation before the northern descent has a new entry in
    its log: 'Do not enter the tunnel after dark.' Unsigned. Written in
    the same ink as entries from four decades ago."

[3] "A hunter near the High Moor says the usual game has shifted south.
    All at once, about ten days ago. He's relocating his routes."

[4] "Someone buried a cache in the northern pass — food, waterskins, a
    folded map. No name. A note on top: 'For whoever needs it next.'"

[5] "Travelers who've been through the MT tunnel in the last week all
    report hearing the same thing: a low sound, like stone settling.
    It stops when you stop to listen."

[6] "The High Moor viewpoint is the highest place on the road. On a clear
    day you can see Birka's lanterns from there. Three travelers this week
    stood and looked south for a long time before continuing north."
```

**Act VIII — Return to Birka:**
```
[0] "Birka is quieter than when you left. People are inside earlier.
    The market closes an hour before dark now. Nobody announced it;
    it just started happening."

[1] "The High Council has posted guards at the northern gate. Not for
    inspection — they're watching the road. Waiting for something."

[2] "A letter arrived at the First Inn for a traveler who isn't staying
    there. The innkeeper is holding it. The seal is Ivory Circle."

[3] "The unofficial sparring at the Crypt has stopped for the week.
    Weckmann closed it without explanation. The fighters are training
    on their own, quietly."

[4] "Three of Yael's contacts have gone quiet in the last two days.
    The ones who usually have news. When sources go quiet all at once,
    it means they know something they can't say yet."

[5] "The city feels like it's listening. Shopkeepers at their doors,
    watching the street. Not afraid — waiting. There's a difference,
    though it's a thin one."

[6] "Someone left flowers at the old Froberger memorial stone near the
    CI crossroads. Fresh ones. Every morning this week."
```

---

### XXVII-D. Implementation Spec

**XXVII-D-1.** Add `TOWN_CRIER_LINES` const with the structure above: `{ critical[], tension[], quests{}, npcs{}, acts{} }`.

**XXVII-D-2.** New function `_getTownCrierLine()`:
```js
function _getTownCrierLine() {
  // Tier 1
  if (S_story.voidPressure >= 9)
    return TOWN_CRIER_LINES.critical[S_story.gameDay % 2];
  // Tier 2
  if (S_story.voidPressure >= 6)
    return TOWN_CRIER_LINES.tension[S_story.gameDay % 3];
  // Tier 3 — quest flags in priority order
  const qOrder = ['warden_resolved','void_architect_seal_inv','corelliRevelationDelivered',
                  'vs_hollow_seal_taken','tl_ori_account_read','yaelEscortDone','quillQuestComplete'];
  for (const flag of qOrder) {
    const val = flag === 'void_architect_seal_inv'
      ? S_story.inventory.some(i => i.key === 'void_architect_seal')
      : S_story[flag];
    if (val) return TOWN_CRIER_LINES.quests[flag];
  }
  // Tier 4 — NPC Dear Friend
  const npcOrder = ['auros','yael','weckmann','brynn','quill','pachelbel'];
  for (const npc of npcOrder) {
    if ((S_story['fav_' + npc] || 0) >= 2) return TOWN_CRIER_LINES.npcs[npc];
  }
  // Tier 5 — act cycling fallback
  const actLines = TOWN_CRIER_LINES.acts[S_story.actNumber] || TOWN_CRIER_LINES.acts[1];
  return actLines[S_story.gameDay % actLines.length];
}
```

**XXVII-D-3.** In `storyConfirmSleep()` (the inn rest function): after HP restore and day increment text is built, call `_getTownCrierLine()` and append to the rest modal's output string:

```js
const crierLine = _getTownCrierLine();
restText += '\n\n────────────────────\n[Town rumor] "' + crierLine + '"';
```

**XXVII-D-4.** Style: the `[Town rumor]` label renders in `#666` (grey), the quote in `#aaa` italic. No separate DOM element needed — inline within the rest modal text block using a `<span class="crier-line">` wrapper.

---

### XXVII-E. New State Flags

**None.** This system reads only existing `S_story` fields. No new persistent state required.

---

### XXVII-F. Documentation Updates Required on Implementation

| File | Update |
|------|--------|
| `story.md` | Add Town Crier note (all 56+ lines documented; selection logic) |
| `mechanics.md` | Add "Town Rumor" entry under Sleep / Inn Rest section |
| `plan.md` | Mark §XXVII complete; update §V-A queue |

No lab report needed. No new nodes, monsters, or items.

---

### XXVII-G. Design Notes

**Why no deduplication?** A rumor circulates. If the Hollow Hands story is relevant (quest flag set), it's appropriate for the same line to appear multiple nights running — it means the event is still being talked about. When the condition clears, a different line takes over. This is more authentic than a deduplication queue and simpler to implement.

**Why no player pronoun?** The crier speaks about events in the world. The player should feel like an observer, not the subject. This is also consistent with how rumors work: people don't say "someone just like you did X" — they say "someone did X." The player knows whether they're that someone.

**The Act VIII lines are different in tone.** They're not gossip — they're the city going quiet. *"Birka is quieter than when you left."* They describe a world that's holding its breath. This makes the final act feel genuinely different from the first seven without any additional mechanics.

**The Froberger line** — *"Someone left flowers at the old Froberger memorial stone near the CI crossroads. Fresh ones. Every morning this week."* — is the last Act VIII cycling line. It's never explained. It has no flag, no quest, no resolution. It's just there: someone in Birka remembers Froberger and brings flowers. Who? Unknown. That ambiguity is the point.

---

*§XXVII status: ✅ Implemented — TOWN_CRIER_LINES const (56 act-cycling + 2 critical + 3 tension + 7 quest-flag + 6 NPC lines); _getTownCrierLine() 5-tier selector (pressure → tension → quest flags → Dear Friends → act cycling); fires via setTimeout(350ms) in storyConfirmSleep() as "📢 [Town rumor]" storyMsg; zero new state flags; no new nodes/monsters/items.*

---

## Section XXVIII — The Froberger Memorial: A Living Stone at CI (Layer 63, ✅ Implemented)

> **Design status:** PLANNED. Not yet in `roll2hit-v3.html`. No new nodes, no new monsters, no new items, no lab report required.  
> **Layer 63** — one interaction point added to CI; 3 new state flags; zero new combat; document inline.

---

### XXVIII-A. Concept and World Hook

The Act VIII town crier line reads: *"Someone left flowers at the old Froberger memorial stone near the CI crossroads. Fresh ones. Every morning this week."* (§XXVII, Act VIII cycling line 7). This section makes the memorial real: a carved stone at the CI node that the player can examine, read, and interact with throughout the run.

The memorial has always existed in the world — it is referenced in Yael's Froberger trace (`NPC_CROSS_REFS`), implied by Brynn's memory of extending Froberger's credit, and anchored by 41 journal entries the player has been collecting since Act I. What §XXVIII adds is the ability to stand in front of it.

**No quest, no combat, no vendor.** The memorial is a narrative object: one optional `[Examine Memorial]` action at CI, two optional sub-actions ([Leave Flowers] / [Sign the Book]), and a small constellation of text that reveals itself as the player builds relationships with the people who knew Froberger.

**Why Layer 63?** Every layer before it built the world. This one lets the player acknowledge it.

---

### XXVIII-B. The Memorial Text — Four Layers

Const: `FROBERGER_MEMORIAL_TEXT` — object with keys `base`, `yael_friendly`, `dear_friend`, `post_cipher`. Layers are additive: each one appends to the previous.

**Layer 1 — Base** (always visible on first examine):

```
FROBERGER
Chronicler of the Road
Walked every corridor in Birka
His notes are still right
```

**Layer 2 — Yael Friendly** (appended when `fav_yael >= 1`):

```
"He was the one who told me what was happening
 in the Unbanked Quarter before anyone else would.
 The story didn't die with him."
                                    — Y.S.
```

**Layer 3 — Dear Friend (any NPC)** (appended when any `fav_* >= 2`):

```
The Ivory Circle formally requested the stone be removed in 1312.
The city refused.
```

**Layer 4 — Post-Cipher** (appended when `S_story.corelliRevelationDelivered === true`; requires `last_cipher` interaction from §XXVI):

```
Beneath the main inscription, faint letters in a different hand:
"First Contact: F.B. — the chronicler who drew the map
 before the Circle drew the borders."
```

This is the only in-world confirmation that Froberger was "the Antecedent's first contact outside the Circle." No other scene names him directly. The player discovers this meaning retroactively.

---

### XXVIII-C. The Memorial Book

A small weathered journal sits in a metal bracket beside the stone. The player can [Read Book] (no cost, any time) and [Sign the Book] (no cost, one-time, sets `frobergerMemorialBookSigned`).

**Pre-written entries** (always present, in order, attributed or anonymous):

| Entry | Attribution | Text |
|-------|-------------|------|
| 1 | *(unsigned)* | *"I bring fresh water. Every week."* |
| 2 | *B.M.* | *"He had credit at the inn until the last. I never called it in."* |
| 3 | *W. of the Crossroads Forge* | *"He watched every training session from the bench across the road. Never bet on anyone."* |
| 4 | *(unsigned)* | *"He was right about the Tide."* |
| 5 | *(unsigned)* | *"The thirty-second corridor. Map checks out."* |

**Player sign action** — modal with a prompt (*"What would you write?"*) and three preset choices + dismiss:

| Choice | Player writes |
|--------|--------------|
| A | *"For the map."* |
| B | *"The covenant holds."* |
| C | *"The road was worth it."* |

Selecting A, B, or C appends the chosen line below entry 5 as *(your hand)* and sets `frobergerMemorialBookSigned = true`. Once signed, [Sign the Book] becomes [Read Your Entry] (shows only the player's line). On NG+, `frobergerMemorialBookSigned` is cleared — the player can sign again, and a fourth option appears:

| D *(NG+ only)* | *"Still right."* |

---

### XXVIII-D. The Flowers Action

**[Leave Flowers]** — costs 10gp. Available any time `frobergerMemorialFlowers === false`. Once taken:
- `frobergerMemorialFlowers = true`
- `S_story.gold -= 10`
- Story log: *"You leave a small bunch of flowers at the stone. They look right there."*
- Unlocks the Act VIII town crier flower line: the Act VIII cycling pool already contains the flowers line; after `frobergerMemorialFlowers = true`, that line is promoted to the front of the Act VIII pool (priority before cycling). It fires on the first inn rest in Act VIII if flowers were left in any previous act.

On NG+: `frobergerMemorialFlowers` is cleared. The player can leave flowers again. The story log changes on NG+: *"You leave flowers again. You wonder if anyone will wonder who keeps doing this."*

**10gp cost justification:** The cost is intentionally low — not trivial (it's a deliberate choice) but never punishing. It is the cheapest meaningful decision in the game. A player who has run a full combat loop will have hundreds of gold; this is not about resource pressure, it is about intention.

---

### XXVIII-E. Implementation Spec

**XXVIII-E-1.** Add `FROBERGER_MEMORIAL_TEXT` const:

```js
const FROBERGER_MEMORIAL_TEXT = {
  base: `FROBERGER\nChronicler of the Road\nWalked every corridor in Birka\nHis notes are still right`,
  yael_friendly: `\n\n"He was the one who told me what was happening\n in the Unbanked Quarter before anyone else would.\n The story didn't die with him."\n                                    — Y.S.`,
  dear_friend: `\n\nThe Ivory Circle formally requested the stone be removed in 1312.\nThe city refused.`,
  post_cipher: `\n\nBeneath the main inscription, faint letters in a different hand:\n"First Contact: F.B. — the chronicler who drew the map\n before the Circle drew the borders."`
};
```

**XXVIII-E-2.** Add `FROBERGER_MEMORIAL_BOOK` const — array of 5 static entries (objects `{attr, text}`):

```js
const FROBERGER_MEMORIAL_BOOK = [
  { attr: '',                           text: 'I bring fresh water. Every week.' },
  { attr: 'B.M.',                       text: 'He had credit at the inn until the last. I never called it in.' },
  { attr: 'W. of the Crossroads Forge', text: 'He watched every training session from the bench across the road. Never bet on anyone.' },
  { attr: '',                           text: 'He was right about the Tide.' },
  { attr: '',                           text: 'The thirty-second corridor. Map checks out.' }
];
```

**XXVIII-E-3.** New function `storyShowFrobergerMemorial()`:

```js
function storyShowFrobergerMemorial() {
  S_story.frobergerMemorialVisited = true;
  // Build plaque text
  let plaque = FROBERGER_MEMORIAL_TEXT.base;
  if ((S_story.fav_yael || 0) >= 1) plaque += FROBERGER_MEMORIAL_TEXT.yael_friendly;
  const anyDearFriend = ['yael','brynn','quill','pachelbel','weckmann','auros']
    .some(k => (S_story['fav_' + k] || 0) >= 2);
  if (anyDearFriend) plaque += FROBERGER_MEMORIAL_TEXT.dear_friend;
  if (S_story.corelliRevelationDelivered) plaque += FROBERGER_MEMORIAL_TEXT.post_cipher;
  // Render overlay (plaque + book + action buttons)
  // [Leave Flowers] costs 10gp; [Read Book]; [Sign the Book / Read Your Entry]
  _renderMemorialOverlay(plaque);
}
```

**XXVIII-E-4.** Add `[Examine Memorial]` button to CI node render (alongside existing CI action buttons). Visible at all times. Triggers `storyShowFrobergerMemorial()`.

**XXVIII-E-5.** In `storyConfirmSleep()` Act VIII flower promotion: before calling `_getTownCrierLine()`, check `if (S_story.actNumber === 8 && S_story.frobergerMemorialFlowers)` and prepend the flower line to the Act VIII pool at index 0 if not yet delivered.

---

### XXVIII-F. New State Flags

| Flag | Type | Default | NG+-preserved | Purpose |
|------|------|---------|---------------|---------|
| `frobergerMemorialVisited` | boolean | false | No | Tracks first visit; no mechanical effect; used for narrative log |
| `frobergerMemorialFlowers` | boolean | false | No | Tracks flower action; promotes Act VIII crier line |
| `frobergerMemorialBookSigned` | boolean | false | No | Tracks player signature; changes [Sign] to [Read Your Entry] |

Add all three to `_S_DEFAULTS()`. Clear all three on NG+ (same batch as other non-preserved booleans). Add to Section III state field table.

---

### XXVIII-G. Documentation Updates Required on Implementation

| File | Update |
|------|--------|
| `story.md` | Add §F2 row for `storyShowFrobergerMemorial()`; add Memorial section with plaque text layers and book entries |
| `world.md` | Add note in Birka geography section: memorial stone at CI crossroads; Ivory Circle removal request 1312; cultural significance |
| `plan.md` | Mark §XXVIII complete; update §V-A queue; add flag rows to §III State Fields |
| `spec-engine.md` | Add 3 new `_S_DEFAULTS()` fields |
| `mechanics.md` | Add "Froberger Memorial" entry under Optional Interactions / no-combat node actions |

No lab report. No new monsters, nodes, quests, or items.

---

### XXVIII-H. Design Notes

**Why no mechanical reward?** The memorial is the reward. Every other optional interaction in the game gives the player something to carry: gold, XP, an item, favorability. The memorial gives none of those things. It gives a moment of recognition — the player stops, reads the stone, and knows what they've been collecting those journal entries for. That completeness is the payoff.

**Why four text layers instead of one?** Froberger's story arrives in fragments throughout the run — journal entries, NPC traces, Corelli's revelation. The memorial text mirrors that structure. A player on their first run reads the base inscription. A player who built Yael to Friendly reads Yael's note. A player who decoded Corelli's letter reads the four-word confirmation: *"First Contact: F.B."* The stone knows exactly as much as the player does.

**The Ivory Circle removal request.** *"The city refused."* This is the only moment in the game where the city of Birka acts as a collective agent — not a faction, not an NPC, not a guild, but the whole city making a decision. It refused. That's it. No explanation of who voted or why. It's enough.

**The NG+ *(Still right.)* option.** Froberger's base inscription ends: *"His notes are still right."* On NG+, the player can write: *"Still right."* It's an echo across runs. The player has now walked every corridor too. They know. The notes are still right.

**The [Leave Flowers] act in Act VIII.** If flowers were left in any earlier act, the town crier line about *"fresh ones, every morning this week"* is no longer anonymous. The player knows who has been leaving them. They did it. The town doesn't know that. The player does. That gap between what is said and what is known is the whole game in miniature.

---

*§XXVIII status: ✅ Implemented — FROBERGER_MEMORIAL_TEXT const; memorial book entries; [Examine Memorial] at CI; [Leave Flowers] 10gp action; three state flags.*

---

## Section XXIX — The Pit Championship: Finals at Crossroads Forge (Layer 64, ✅ Implemented)

> **Design status:** PLANNED. Not yet in `roll2hit-v3.html`. One new named human opponent; one new const; 2 new state flags; no new nodes or monsters in MONSTER_POOL; no lab report.  
> **Layer 64** — triggered at `pitTrainingWins === 5`; one-time offer; document inline.

---

### XXIX-A. Concept and World Hook

`pitTrainingWins >= 5` is one of the four conditions for the True Keeper ending. The player accumulates these wins across CY pit training bouts, tracked silently in `S_story.pitTrainingWins`. But the game never acknowledges reaching the threshold. The counter increments. Nothing else happens. The player either knows to check `_isTrue()` or they don't.

§XXIX adds the moment: on the first CR visit after reaching five wins, Weckmann offers the Pit Championship. It is not framed as a milestone — Weckmann frames it as *the next fight*. The fight itself answers the question the training system has been building toward: *what does five wins mean?* It means Weckmann thinks you are ready to face someone who might beat you.

The opponent is Ogundimu, the Iron Standard — a retired city champion who lost her title in a bout she still disputes and has been taking irregular exhibition matches ever since. She is not a monster. She does not appear in `MONSTER_POOL`. She is defined entirely within the championship const, fights once, and is never seen again.

**No XP. No gold. No item drop.** Winning the championship sets `pitChampionWon = true`, adds a final entry to the Weckmann training log, and permanently changes one of Weckmann's dialogue lines. These are the only consequences — and they are the right ones.

---

### XXIX-B. Trigger Condition

The championship offer fires on the **first CR visit where `pitTrainingWins >= 5` AND `!S_story.pitChampionOffered`**. It does not fire during the training bout itself — it fires afterward, when the player is at CR (Weckmann's node) and Weckmann can address them directly.

On trigger:
1. A pre-modal fires (Weckmann speaks, see §XXIX-C)
2. `S_story.pitChampionOffered = true` (offer fires exactly once regardless of player response)
3. Player chooses [Accept] or [Not yet]

**[Not yet]:** Closes modal. Offer does not re-fire automatically. After declining, [Challenge for the Title] button appears in the CR node action row and persists until accepted. Player can return to accept at any point.

**[Accept]:** Proceeds directly to the championship pre-battle overlay (§XXIX-D).

---

### XXIX-C. Weckmann's Offer — Pre-Modal Text

```
Weckmann is cleaning the forge when you arrive. He sets the 
brush down.

"Five. You know what five means?"

He doesn't wait for an answer.

"It means I've been holding back a name. Ogundimu. The Iron 
Standard — that's what they called her, before the dispute. 
She doesn't fight for rankings anymore. She fights because 
she wants to know if she's still herself."

He picks the brush back up.

"I told her about you. She said yes. That means something — 
she says no to most people."

    [Accept the match]    [Not yet]
```

---

### XXIX-D. Ogundimu — The Iron Standard

Defined in const `PIT_CHAMPION_OGUNDIMU` (not in MONSTER_POOL). One-time opponent.

```js
const PIT_CHAMPION_OGUNDIMU = {
  name: 'Ogundimu, the Iron Standard',
  icon: '🏆',
  ac: 16,
  hp: 42,
  atk: 7,
  die: 10,
  dieCount: 1,
  mod: 4,
  xp: 0,
  gold: 0,
  drop: null,
  tier: 'elite',
  isChampion: true,
  flavorPre: `She arrives without ceremony. Shortsword, buckler, no 
introduction. She looks at your weapon and nods once — the 
kind of nod that means she's already thought about how she'd 
answer it.

"I retired," she says. "Not from this."`,
  flavorWin: `She doesn't fall. She steps back, shield lowering.

"Good. That's good."

She means it.

She picks up her bag. At the door she turns back.
"Your fifth. That's not luck anymore."`,
  flavorLoss: `She doesn't follow up. She steps back and waits.

"Different day," she says. "Same champion."

She means it as an invitation, not an insult.`
};
```

**Battle mechanics:** Standard story battle flow — `_storyRollInit()`, attack/defense, conditions, death saves. No special abilities. She is formidable (AC 16, HP 42, +7 ATK) but not supernatural. A fully leveled player with good gear wins reliably. A player who rushed here early will struggle. That is correct.

**On player death/checkpoint:** `pitChampionOffered` remains `true`. [Challenge for the Title] button persists at CR. Player can fight again — `flavorLoss` text is Ogundimu's, not a failure state. She is waiting.

---

### XXIX-E. Victory Resolution

On win, before returning to CR:

```
WECKMANN'S LOG — Final Entry
────────────────────────────
Fight 6: Ogundimu, the Iron Standard
Result: WIN
Note: She chose the match. That matters.
      You chose to accept. That matters more.
```

This entry is appended to the existing `_buildWeckmannLog()` output. It fires only when `pitChampionWon = true`. The log entry is readable at any time via [Weckmann's Log] at CR.

Additionally:
- `S_story.pitChampionWon = true`
- Weckmann's `dearFriend` dialogue pool gains one additional line (see §XXIX-F)
- The Act VIII farewell beat for Weckmann (§XXV) references the championship explicitly

---

### XXIX-F. Weckmann Dialogue Change

One new line added to `NPC_DIALOGUES['weckmann'].dearFriend[]` (appended, selected via normal priority pool rotation when `pitChampionWon`):

> *"Ogundimu asked after you, the last time she came through. I told her you'd moved on. She said that was the right answer."*

This line only enters the pool when `pitChampionWon === true`. It is added alongside the existing 5 Dear Friend lines — total becomes 6 at Dear Friend state for players who completed the championship.

---

### XXIX-G. Act VIII Farewell Beat Integration (§XXV Cross-Reference)

The Weckmann Act VIII farewell beat (§XXV, §XXV-C-5) currently reads:

> *"Recognizes the player as the rare kind of champion — the kind earned in the world, not in a pit."*

With §XXIX implemented, this line is **conditionally branched**:

- `pitChampionWon === false` → standard: *"…the kind earned in the world, not in a pit."*
- `pitChampionWon === true` → extended: *"…the kind who earns it in the pit and then earns it again out here. I've seen both kinds. You're the second kind."*

The distinction matters: the standard line implies the pit doesn't count. The champion line says both count — the pit was real, the world was also real, the player did both.

---

### XXIX-H. Implementation Spec

**XXIX-H-1.** Add `PIT_CHAMPION_OGUNDIMU` const (structure in §XXIX-D).

**XXIX-H-2.** In CR node render function (wherever the existing [Weckmann's Log] button is rendered): add check:

```js
if ((S_story.pitTrainingWins || 0) >= 5 && !S_story.pitChampionOffered) {
  _showPitChampionOffer(); // fires the Weckmann offer modal
}
if (S_story.pitChampionOffered && !S_story.pitChampionWon) {
  // render [Challenge for the Title] button
}
```

**XXIX-H-3.** New function `_showPitChampionOffer()`: sets `pitChampionOffered = true`; renders offer modal with Weckmann text; [Accept] calls `_startPitChampionBattle()`; [Not yet] closes.

**XXIX-H-4.** New function `_startPitChampionBattle()`: uses `PIT_CHAMPION_OGUNDIMU` const to initialize a battle in the same way as `storyBattle()` but with `xp=0`, `gold=0`, no drop — custom `_onPitChampionWin()` and `_onPitChampionLoss()` callbacks.

**XXIX-H-5.** `_onPitChampionWin()`: sets `pitChampionWon = true`; appends championship log entry (mutates the `_buildWeckmannLog()` output via flag); shows victory text; returns to CR.

**XXIX-H-6.** `_onPitChampionLoss()`: shows loss text (Ogundimu's flavorLoss); respawns at checkpoint (standard `storyRespawnFromCheckpoint()`); [Challenge for the Title] button remains at CR.

**XXIX-H-7.** Patch `_buildWeckmannLog()`: after existing log text, append championship entry if `pitChampionWon`.

**XXIX-H-8.** Patch §XXV Act VIII Weckmann farewell beat: conditional branch on `pitChampionWon` (§XXIX-G).

---

### XXIX-I. New State Flags

| Flag | Type | Default | NG+-preserved | Purpose |
|------|------|---------|---------------|---------|
| `pitChampionOffered` | boolean | false | No | Tracks whether offer has fired; prevents re-offer on each CR visit |
| `pitChampionWon` | boolean | false | No | Tracks championship win; gates log entry, dialogue line, farewell branch |

Add both to `_S_DEFAULTS()`. Clear on NG+ (not preserved). Add to Section III state field table.

---

### XXIX-J. Documentation Updates Required on Implementation

| File | Update |
|------|--------|
| `story.md` | Add §F2 rows for `_showPitChampionOffer()`, `_startPitChampionBattle()`, `_onPitChampionWin()`; note Weckmann dearFriend pool expansion |
| `world.md` | Add Ogundimu to Birka NPC roster (non-dialogue NPC — no favorability, no quest; one-time encounter) |
| `plan.md` | Mark §XXIX complete; update §V-A queue; add flag rows to §III; patch §XXV farewell beat note |
| `spec-engine.md` | Add 2 new `_S_DEFAULTS()` fields |
| `combat.md` | Note `PIT_CHAMPION_OGUNDIMU` as a named-human const separate from `MONSTER_POOL`; xp/gold = 0 |

No lab report. No new MONSTER_POOL entries. Ogundimu lives only in `PIT_CHAMPION_OGUNDIMU`.

---

### XXIX-K. Design Notes

**Why no XP and no gold?** Every other fight gives XP and/or gold. Ogundimu gives neither. This is the signal: this fight is different. It's not about resources. It's about being ready. A player who approaches it as a resource fight is approaching it wrong, and the 0 XP / 0 gold result will make them reconsider. That reconsideration is part of the design.

**Why is she retired?** Every combat system in the game culminates in a boss fight (Auros, EB champions). Ogundimu is the anti-boss: a human who chose to stop competing, who takes selective exhibition bouts, who has nothing to prove and isn't trying to prove anything here. Her presence in the world is voluntary. She said yes because she heard something worth testing — not to defeat the player, to find out. That's a fundamentally different motivation than any other opponent in the game.

**"The dispute."** Weckmann mentions she lost her title in a bout she still disputes. This is never explained. It is not a quest hook. It is not a lore entry. It is background that makes Ogundimu feel like a person who existed before the player arrived. She doesn't need a quest chain — she needs to be real enough that the fight matters.

**The farewell branch.** The §XXV standard line (*"the kind earned in the world, not in a pit"*) would have been a retroactive slight on the pit system — implying the pit wins were lesser. The champion branch corrects this: both count. The pit made the world wins possible; the world wins made the pit championship meaningful. The player who did both did something the standard line can't describe.

**NG+ and Ogundimu.** On NG+, `pitChampionOffered` and `pitChampionWon` are cleared. The player must re-earn five pit wins and Weckmann must re-offer. But there's no new NG+ text for Ogundimu. If the player has won the championship before, they bring that knowledge into the fight — they know her patterns, her AC, her HP. The fight is objectively easier. The game doesn't comment on this. The player can.

---

*§XXIX status: ✅ Implemented — PIT_CHAMPION_OGUNDIMU const; _showPitChampionOffer()/_startPitChampionBattle()/_onPitChampionWin()/_onPitChampionLoss(); Weckmann log; §XXV farewell branch.*

---

## Section XXX — The Entry 41 Echo: Brynn and Sweelinck After the Last Journal (Layer 65, ✅ Implemented)

> **Design status:** PLANNED. State flags `s49BrynnDelivered` and `s49SweelinckDelivered` already exist in `_S_DEFAULTS()` — this section provides the full scene design for what they gate.  
> **Layer 65** — two parallel one-time scenes; no new nodes, monsters, items, or quests; no lab report; document inline.

---

### XXX-A. Concept and World Hook

Froberger's Entry 41 ends: *"Come back."*

It is the only direct address in the journal — forty entries of terrain notes, encounter logs, and observations about people, and then this: *"Come back. To the people. They need the person who knows, not just the knowledge."*

The S49 design (noted in `world.md` Part Four-B) specifies two parallel scenes that fire on the first IN and SQ visit after `frobergerLastEntryRead = true`. The state flags exist. This section writes the scenes.

**Why two scenes, not one?** Because Entry 41 means different things to Brynn and to Sweelinck. Brynn hears *"Come back"* as something she's been quietly saying herself since Act III. Sweelinck hears the part about the pattern — *"Someone made the covenant before me. I made it after. You are making it now"* — because Sweelinck is the one who has been watching the pattern from outside it. The same entry, two readings. Both are correct.

**Why no player choice?** These scenes are not decisions. Entry 41 is not something the player did — it's something Froberger wrote before they arrived. The player reads it and it lands. Then they carry it to IN and to SQ. What Brynn and Sweelinck do with it is theirs. The player watches.

---

### XXX-B. Trigger Condition

**Both scenes trigger independently** on the first visit to their respective nodes **after `S_story.frobergerLastEntryRead === true`**.

- `frobergerLastEntryRead` is set by `storyCheckJournal()` at CO node when Entry 41 is read (the final journal entry, `readAloud: true`)
- Entry 41 can be read at any CO visit — Act V through Act VIII, depending on player routing
- The s49 scenes fire on the **next** IN / SQ visit after Entry 41, not immediately
- If the player reads Entry 41 and immediately returns to IN, the scene fires on that visit
- Each scene checks only its own delivered flag: Brynn fires when `!s49BrynnDelivered`, Sweelinck fires when `!s49SweelinckDelivered`
- They can fire in either order, in the same session or in different sessions

**Coexistence with §XXV Act VIII Farewell Beats:**
- Brynn's farewell beat (§XXV, `act8FarewellBrynn`) fires on the first Act VIII IN visit
- If the player reads Entry 41 before Act VIII: s49 Brynn fires mid-run; the Act VIII farewell fires separately on the first Act VIII visit (both can fire in the same run, in order)
- If the player reads Entry 41 during Act VIII: whichever scene hasn't fired fires first on that visit; the other fires on the next visit to the same node

---

### XXX-C. Brynn's Scene — IN Node

Text stored in `S49_BRYNN_SCENE` const (string or rendered HTML block):

```
You find Brynn at the bar. Before you say anything,
she looks at the journal.

"The last one?"

You hand it to her. She reads it standing, at the
bar — doesn't sit, doesn't move anywhere. When she
finishes, she reads it again from the beginning.
You can tell by the time it takes.

She closes it and sets it on the counter.

"'Come back,'" she says. Not to you. To herself,
maybe. Or to him.

She slides the journal across the bar. Picks up
her cloth.

"He was right. They do need the person."

A pause.

"Glad you're not done yet."
```

On close:
- `S_story.s49BrynnDelivered = true`
- `storyMsg()`: *Brynn has read the final entry.*
- Return to standard IN node render

**Why this works:** Brynn doesn't explain the journal. She quotes one line — the last line — because it's the one she would have said to Froberger herself. *"Come back."* She's been saying it in the other direction (the player coming back to her inn). The scene puts both directions in the same room for one moment.

---

### XXX-D. Sweelinck's Scene — SQ Node

Text stored in `S49_SWEELINCK_SCENE` const:

```
Sweelinck is at the desk. They look up when you
enter.

"May I see it?"

You hand over the journal. They read Entry 41
standing — they don't sit for this. Their eyes
go to the last line and stay there a moment.

Then they close the journal with the particular
care you give something you intend to keep, and
set it on the desk.

"He knew the shape of the absence," Sweelinck
says. "Before anyone arrived. He wrote it down
anyway, because that's what you do with knowledge
that can't be transferred — you write it down and
you wait."

The journal stays on the desk. They don't offer
it back.

"I'll keep it here. You know where to find me
when you're done."

The lamp is on. It stays on.
```

On close:
- `S_story.s49SweelinckDelivered = true`
- `storyMsg()`: *Sweelinck has kept the final entry.*
- Return to standard SQ node render

**The journal:** The journal is not a physical inventory item — it's accessed via `FROBERGER_JOURNAL` const and read through `storyCheckJournal()`. Narratively, Sweelinck "keeps" it; mechanically, the player still has access. What Sweelinck actually keeps is the *weight* of Entry 41 — they now carry the knowledge that the player knows. This is the transfer the entry says can't happen for free. Sweelinck paid by watching the pattern across multiple covenants. The player paid by walking. They have met in the middle.

---

### XXX-E. Ending Ceremony Patch — Covenant Keeper

In `_buildSweelinckNamingSequence()`, the opening line is currently a formal introduction (the exact text is in the HTML at ~line 11016). Add a conditional branch:

**Standard opening** (`s49SweelinckDelivered === false`):
> *(existing formal opening — unchanged)*

**Encounter opening** (`s49SweelinckDelivered === true`):

Replace the first line of the naming sequence with:

```
"You know where to find me.
 You found me."

A pause. The lamp is on here too.

"Good."
```

Then the naming sequence continues normally. This change is invisible to players who didn't find the SQ scene, and profound for those who did. The ceremony becomes a reunion. Sweelinck already told the player they'd be here. They were right.

---

### XXX-F. Implementation Spec

**XXX-F-1.** Add `S49_BRYNN_SCENE` const (scene text, §XXX-C).

**XXX-F-2.** Add `S49_SWEELINCK_SCENE` const (scene text, §XXX-D).

**XXX-F-3.** In IN node render: check `S_story.frobergerLastEntryRead && !S_story.s49BrynnDelivered`. If true, show `S49_BRYNN_SCENE` modal before standard node content. On close: set `s49BrynnDelivered = true`.

**XXX-F-4.** In SQ node render: check `S_story.frobergerLastEntryRead && !S_story.s49SweelinckDelivered`. If true, show `S49_SWEELINCK_SCENE` modal. On close: set `s49SweelinckDelivered = true`.

**XXX-F-5.** In `_buildSweelinckNamingSequence()`: add conditional branch at first line — `if (S_story.s49SweelinckDelivered)` → encounter opening; else → standard opening.

**XXX-F-6.** Both modals: no action buttons beyond [Close] / [Continue]. No choices. The player reads and moves on.

---

### XXX-G. State Flags

Both flags already exist in `_S_DEFAULTS()`:
- `S_story.s49BrynnDelivered` — boolean, default false, NOT NG+-preserved (clears on NG+)
- `S_story.s49SweelinckDelivered` — boolean, default false, NOT NG+-preserved (clears on NG+)

**No new state fields.** Section III already has both entries. This section documents what they gate.

**NG+ note:** Both flags clear on NG+. The player can re-trigger both scenes. Brynn's text is unchanged on NG+. Sweelinck's text changes: the final line becomes *"Still here. Bring it back when you're done again."* — a one-word addition (`again`) that costs nothing and means everything for a player on their second run.

---

### XXX-H. Documentation Updates Required on Implementation

| File | Update |
|------|--------|
| `story.md` | Add §F2 rows for s49 scene trigger logic; add scene text to NPC section (Brynn / Sweelinck) |
| `world.md` | Update S49 note with full scene summaries; note Sweelinck lamp line cross-ref |
| `plan.md` | Mark §XXX complete; update §V-A queue; note `s49` flags already in §III |
| `lab-report-endings-and-echoes.md` | Add note: `_buildSweelinckNamingSequence()` has conditional s49 branch |

No lab report for this section. No new nodes, monsters, items, or quests.

---

### XXX-I. Design Notes

**"May I see it?"** Sweelinck asks permission. They are the most powerful narrative figure in the ending — the one who names the player — but they ask. This matters. They are not taking something. They are receiving something that the player is ready to give.

**Brynn's two readings.** She reads Entry 41 twice — you can tell by the time it takes. This is not stated explicitly in the scene; it's implied by the pacing. A reader who has been paying attention will understand. A reader who hasn't will still read the scene correctly. The double reading is a gift to the attentive player: Brynn is doing exactly what Froberger said couldn't be done — receiving the knowledge by reading it. But Brynn has paid her own price: forty-one days of having bread ready. That's not free.

**"The lamp is on. It stays on."** This line echoes the NIGHT_AMBIENT entry for SQ: *"Sweelinck's lamp is on."* The night ambient fires when `gameDay % 4 >= 2` — Sweelinck's lamp is part of the world's background texture. After the s49 scene, the player knows why. Sweelinck is always waiting. The lamp is the signal.

**Why the Covenant Keeper opening matters.** In a run without the s49 scene, Sweelinck appears at CO as a figure who has been waiting — but the player has never met them before. The ceremony is moving but impersonal. With the s49 scene, Sweelinck is someone the player sat across from at a desk while they read Entry 41 standing up. The ceremony is a reunion. *"You know where to find me. You found me."* — the player found Sweelinck at SQ; they found them again at CO. That's the covenant in miniature: you come back.

---

*§XXX status: ✅ Implemented — S49_BRYNN_SCENE + S49_SWEELINCK_SCENE consts; trigger at IN + SQ; NG+ variant; Covenant Keeper patch.*

---

## Section XXXI — The Joint Witness and the Map Caption (Layers 66a + 66b, ✅ Implemented)

> **Design status:** PLANNED. State flags `s54JointMomentDelivered` and `s55MapLineDelivered` already exist in `_S_DEFAULTS()` — this section provides the full scene designs.  
> **Layers 66a + 66b** — two small S-suggestion systems; no new nodes, monsters, items, or quests; no lab report; document inline.

---

### XXXI-A. Concept: Two Quiet Witnesses

The game has 76 nodes, 6 named NPCs, 41 journal entries, 7 Codex Shards, and a 49-day countdown. Everything in it is moving. §XXXI is about the two moments where things are briefly still: the moment two NPCs share a courtyard at CI and don't need to explain anything to each other, and the moment after the victory sequence when the map hangs in the air for five seconds and one line appears beneath it.

Both are S-suggestions with existing state flags. Both are short. Both are the world, briefly, looking back.

---

### XXXI-B. S54 — Yael and Brynn at CI: "The Same Light" (Layer 66a)

**Trigger:** First CI visit where `S_story.actNumber >= 7` AND `(S_story.fav_yael || 0) >= 1` AND `(S_story.fav_brynn || 0) >= 1` AND `!S_story.s54JointMomentDelivered`.

Brynn makes supply runs and check-ins. Yael is always at CI. They know each other. The §XXVII Town Crier NPC line for Brynn — *"The First Inn has been leaving a light on all night. The innkeeper says it's for late travelers. The regulars think she's waiting for someone."* — is the background of this scene. Yael knows. Brynn knows Yael knows.

The scene fires as a modal before the standard CI render. Const: `S54_JOINT_MOMENT`.

```
Brynn is at the crossroads when you arrive.
She has a delivery basket — the kind she uses
for rounds, not for waiting.

Yael is already there.

They're finishing a conversation when you come
into earshot. You catch the end of it.

"Still the same light?" Brynn asks.

"Still the same light," Yael says.

They turn when you arrive. Brynn gives you
the look she reserves for people she's been
quietly worried about. Yael gives you the nod
that means she's been watching.

"You're later than I expected," Yael says.

"She means that in the good way," Brynn adds.

They're both right.
```

On close:
- `S_story.s54JointMomentDelivered = true`
- `storyMsg()`: *(Yael and Brynn. The same crossroads.)*
- Return to standard CI node render

**"Still the same light?"** The light at the First Inn (IN node) has been burning all night every night since Act I. Yael is the one watching the city — her witness network sees everything, including which lights stay on. She already knew Brynn was keeping it on. What she's checking now is whether Brynn is still doing it, which is also asking: *is the world still holding?* It is. Still the same light.

**NG+:** On NG+, `s54JointMomentDelivered` clears. The scene fires again. The dialogue does not change — these are two people who have had this conversation before. The player witnesses it again knowing the outcome. The familiarity is the point.

---

### XXXI-C. S55 — The Map Caption (Layer 66b)

**Trigger:** Fires inside `_renderFinalMap()` during the victory sequence. The caption appears during the 5-second warmth-grid display window (3100–8100 ms). Appears at ~3500 ms (400 ms after the grid fades in), fades out with the grid at ~8100 ms. Sets `s55MapLineDelivered = true` before rendering.

**Base caption** (always):

> *He walked every corridor. So did you. The map remembers.*

**Conditional variant** — if `S_story.s49SweelinckDelivered`:

> *He walked every corridor. So did you. Sweelinck has the record.*

The base line treats the warmth-tinted map as its own memory — the colors are where the player has been, and the map holds that. The Sweelinck variant says the same thing in a more human way: the journal is with Sweelinck, who is at CO, who is the one naming the player. The record is in good hands.

**Implementation:** A `<div id="final-map-caption">` positioned absolutely centered below the warmth grid, rendered into the same overlay as `_renderFinalMap()`. Font: small, muted (`color: #bbb; font-style: italic; font-size: 0.9em`). Fades in at 3500 ms via CSS transition; fades out with the grid.

```js
// Inside _renderFinalMap(), after grid construction:
const caption = S_story.s49SweelinckDelivered
  ? 'He walked every corridor. So did you. Sweelinck has the record.'
  : 'He walked every corridor. So did you. The map remembers.';
const captionEl = document.createElement('div');
captionEl.id = 'final-map-caption';
captionEl.textContent = caption;
// Insert into overlay; apply fade timing
S_story.s55MapLineDelivered = true;
```

**Why these words?** "He walked every corridor." — Froberger's base inscription at the CI memorial (§XXVIII): *"Walked every corridor in Birka / His notes are still right."* The map caption echoes the memorial. The player has now done what the memorial says Froberger did. The warmth tint is the visual proof: the nodes the player visited are colored. Empty nodes are dark. The player's map is the player's journey.

*"The map remembers"* — the map is not neutral. The warmth tint is warmer where the player spent more time (via the minimap color logic). The final map is a portrait of how the player moved through the world.

---

### XXXI-D. Implementation Spec

**XXXI-D-1.** Add `S54_JOINT_MOMENT` const (string or rendered HTML block, scene text §XXXI-B).

**XXXI-D-2.** In CI node render: check `S_story.actNumber >= 7 && (S_story.fav_yael||0) >= 1 && (S_story.fav_brynn||0) >= 1 && !S_story.s54JointMomentDelivered`. If true, show `S54_JOINT_MOMENT` modal before node content; on close set `s54JointMomentDelivered = true`.

**XXXI-D-3.** In `_renderFinalMap()`: before or immediately after constructing the warmth grid, build the caption string from the conditional; create and position `<div id="final-map-caption">`; apply the fade-in at +400 ms after grid appears (3500 ms total); set `s55MapLineDelivered = true`.

**XXXI-D-4.** The S55 flag `s55MapLineDelivered` needs no check gate — `_renderFinalMap()` only fires once per victory sequence. The flag's purpose is record-keeping (confirming the line was delivered; potentially used in future NG+ variant detection). Set it immediately when the caption renders.

---

### XXXI-E. State Flags

Both flags already exist in `_S_DEFAULTS()`:
- `S_story.s54JointMomentDelivered` — boolean, default false, NOT NG+-preserved
- `S_story.s55MapLineDelivered` — boolean, default false, NOT NG+-preserved

**No new state fields.** Section III already has both entries. This section documents what they gate.

**NG+ behavior:**
- `s54JointMomentDelivered`: clears, scene re-triggers. Dialogue unchanged.
- `s55MapLineDelivered`: clears, caption re-renders on the new victory. Caption unchanged unless `s49SweelinckDelivered` has been re-earned (it also clears on NG+, so the player must re-trigger the SQ Sweelinck scene to get the variant).

---

### XXXI-F. Documentation Updates Required on Implementation

| File | Update |
|------|--------|
| `story.md` | Add §F2 note for s54 trigger in CI node render; add S54_JOINT_MOMENT scene text to NPC dialogue section (Yael + Brynn) |
| `world.md` | Add S54 and S55 entries to Part Four-B Key Interactions (parallel to existing S8/S29/S49 entries) |
| `maps.md` | Add caption spec to `_renderFinalMap()` table (timing + conditional logic) |
| `plan.md` | Mark §XXXI complete; update §V-A queue; note s54/s55 flags already in §III |

No lab report. No new nodes, monsters, items, or quests.

---

### XXXI-G. Design Notes

**Why Yael and Brynn?** They are on opposite ends of the inn-to-crossroads line that runs through CI. Brynn sustains the physical world (food, warmth, the light that stays on). Yael sustains the civic world (testimony, witness, the record that can't be suppressed). The player has been sustained by both. Seeing them in the same frame, speaking to each other about the same light, is the first time the game acknowledges that these two systems have been running in parallel all along.

**"They're both right."** The scene's last line. Yael says the player is later than expected; Brynn says that's meant in the good way. Both are true simultaneously. The player is late in the sense that the run is nearly over; they are late in the good sense because they survived to be late. The scene doesn't resolve this — it just notes that both things are true and lets the player carry it.

**The caption echoing the memorial.** §XXVIII (Froberger Memorial) inscribes: *"Walked every corridor in Birka."* §XXXI's map caption begins: *"He walked every corridor."* These are the same words from different directions — the memorial looks back at Froberger; the map caption looks forward from Froberger to the player. The player is the person the memorial is about to become: someone who walked every corridor, whose path will be remembered, who will not be here to read what gets written about them.

**The warmth tint as earned record.** The final map shows visited nodes warmer than unvisited ones. A player who visited every node sees a uniformly warm map. A player who rushed sees cold patches. The caption says *"the map remembers"* — which is true for both. What the map remembers differs. The caption is not a grade. It is a record.

---

*§XXXI status: ✅ Implemented — S54_JOINT_MOMENT const; CI trigger (act≥7, dual Friendly); S55 map caption in _renderFinalMap().*

---

## Section XXXII — Two Intelligence Feeds: The Varga Watch and the Auros Theory (Layers 67a + 67b, ✅ Implemented)

> **Design status:** PLANNED. State flags `s8VargaWatches`, `s8VargaClueUnlocked`, `s8PachelbelTold`, and `s29LineDelivered` already exist in `_S_DEFAULTS()` — this section provides the full scene designs.  
> **Layers 67a + 67b** — two S-suggestion systems; no new nodes, monsters, items, or quests; no lab report; document inline.

---

### XXXII-A. Concept: The Same Truth from Two Directions

Varga is an Ivory Circle informant watching the BA (Birka Archive) — specifically watching who accesses the shelves where Froberger-related and Void research materials are held. He uses a pigeon-route network to file reports to a forwarding agent north-northeast of BA, who relays them to the Circle anonymously.

Auros is a military commander in the Undercity (CY) who has been cross-referencing Froberger's journal route against Void-advance tactical indicators from Year Twelve. She never connected them until Entry 41.

Both systems reveal the same thing: Froberger was, without knowing it, mapping the Void Tide's advance path. The Circle knew. Varga was monitoring who else might figure it out. Auros can explain what it means.

The S8 mechanic (three-observation Varga arc) and the S29 dialogue injection (Auros tactical analysis) are independent systems that converge on the same knowledge. Neither references the other. Together they constitute an intelligence picture the player assembles across two NPCs who have never met.

---

### XXXII-B. S8 — The Varga Watch at BA (Layer 67a)

**State flags:** `s8VargaWatches` (0–3), `s8VargaClueUnlocked` (boolean), `s8PachelbelTold` (boolean) — all pre-existing in `_S_DEFAULTS()`.

**Who is Varga?** A minor Ivory Circle functionary. He holds a regular table at BA and keeps a book open to the same page. He is not interesting to talk to. He files one pigeon per archive visit by any player who touches the restricted shelves. He does not know the content of what he's reporting — only that the Circle flagged those shelves.

He appears in the Act I Town Crier cycling pool (line [3]): *"Three of Varga's usual informants didn't show up to their usual corners this morning. The fourth one is talking to nobody."* — this fires before the player has observed him. Varga's informant network is already fraying at Act I for reasons unconnected to the player. The player's observations don't disrupt him — they read him.

After `yaelEscortDone`, the Town Crier questFlag line fires: *"The Slums have been quieter since someone ran Varga's informants off the north end. Nobody's taking credit."* — Yael's escort resolution disrupts Varga's street network. The pigeon route at BA continues separately; the S8 mechanic is unaffected by `yaelEscortDone`.

**Three-observation arc — ambient text added to BA render:**

| `s8VargaWatches` | Added ambient line | Player action |
|---|---|---|
| 0 | *(no Varga text — he's background)* | [Observe the clerk] button appears |
| 1 | *"A clerk at the far table has the same book open to the same page as last time. He isn't reading it."* | [Observe the clerk again] |
| 2 | *"The same clerk. Today he wrote one line in a small notebook, then put it away immediately."* | [Watch for the signal] |
| 3 | `s8VargaClueUnlocked = true` — see §XXXII-C | — |

Each [Observe] click increments `s8VargaWatches` by 1. No time gate — observations can happen in consecutive visits or across acts.

**Watch 3 event text** (shown in place of the normal [Watch for the signal] result):

```
The clerk closes his book. He folds a small slip of
paper — you can't see what's on it from here — and
walks to the east window.

He opens it. A pigeon launches from the sill, banks
north-northeast, and is gone.

The clerk returns to his table and opens his book to
the same page.
```

**Direction note:** *North-northeast from BA* — the player can note this in the story log. `storyMsg()`: *"The pigeon flew north-northeast. Pachelbel's district."*

---

### XXXII-C. S8 — Telling Pachelbel (Layer 67a, continued)

**Trigger for tell option:** `s8VargaClueUnlocked && !s8PachelbelTold && (S_story.fav_pachelbel || 0) >= 1`. Available as a dialogue option at SH (Pachelbel's node) or BA: [Tell Pachelbel about the pigeon].

**Pachelbel's response:**

```
"North-northeast from BA?"

She doesn't need you to describe the pigeon.

"That's a forwarding route. The Circle uses couriers
at that rooftop when they don't want a name attached
to the report — the message goes to a handler, the
handler uses a commercial channel, and by the time
it arrives it's just a note from 'a concerned party.'"

A pause.

"Was it the Froberger shelf?"

She doesn't wait for the answer.

"Of course it was. They've been watching that section
for three years. Someone at the Circle decided his
notes were worth monitoring before they decided his
memorial was worth removing."

She counts out 15 gold.

"You didn't hear that from me. Officially."
```

On close: `s8PachelbelTold = true`; `S_story.gold += 15`.

**Why Pachelbel knows:** She's a former fence and dealer (Raison's Tools backstory, Pachelbel's journal entries 2–3). She knows commercial information channels, forwarding routes, and how to read indirect communications. The pigeon route north-northeast from BA is a known Circle forwarding corridor in Birka's underground network. She recognized it immediately.

**Why 15gp?** It's the fee she would have charged a client for this information. She's paying the player at the same rate she values the intelligence. It's not charity; it's professional courtesy.

---

### XXXII-D. S29 — Auros's Tactical Theory at CY (Layer 67b)

**State flag:** `s29LineDelivered` (boolean) — pre-existing in `_S_DEFAULTS()`.

**Trigger:** First CY visit where `S_story.frobergerLastEntryRead === true` AND `(S_story.fav_auros || 0) >= 2` AND `!S_story.s29LineDelivered`.

**Auros's speech** (stored in `S29_AUROS_THEORY` const):

```
Auros is at her desk when you arrive. She looks up,
then at the journal.

"Entry 41?"

You nod.

"Froberger's last documented route covered three sectors
I flagged as Void-advance indicators in Year Twelve. He
walked them in the right order. He logged what he saw
in each one — terrain shifts, monster density changes,
corridor instability."

She sets her notes down.

"He wasn't warning anyone. He didn't know what he was
mapping. He was just thorough. But if you read his last
six entries in sequence, and you know what the Void
advance looks like from tactical coordinates, you get
a clear picture of exactly where it was going and how
fast."

A pause.

"'The shape of the absence.' That's what he calls it
in Entry 41. He finally understood — he'd been mapping
the negative space of the Void all along. Every corridor
he documented was one the Tide had not yet filled."

She turns back to her notes.

"He got to the end of the map. Then the Tide arrived."
```

On close: `S_story.s29LineDelivered = true`; `storyMsg()`: *(Auros has read the route.)*

**Why CY (Undercity)?** Auros's tactical operations center is in the Undercity — signal jammers, EMP grenades, encrypted reports. She's the one military figure in Birka who cross-references civilian reports against Void-advance mapping data. Entry 41's "shape of the absence" is a phrase she would understand immediately; Froberger arrived at it inductively from journal entries while Auros had the deductive framework all along. Neither told the other.

---

### XXXII-E. Cross-Reference Network

Both systems converge on the same underlying truth about Froberger:

| System | Source | Reveals |
|--------|--------|---------|
| S8 — Varga | Observation at BA + Pachelbel | The Circle has been monitoring who reads Froberger's materials for 3 years |
| S29 — Auros | CY tactical briefing | Froberger's route = Void advance indicator sequence (Years 12–current) |
| §XXVIII — Memorial | CI stone, Layer 3 unlock | "The Ivory Circle formally requested the stone be removed in 1312. The city refused." |
| §XVII — Void Archaeology | Origin Investigation | First Researcher / Antecedent documented the advance; Circle suppressed it |
| §XXVI — Corelli | Courier reveal, fav 3 | Froberger was "First Contact: F.B." — the chronicler who mapped before the Circle drew borders |
| §XXX — Entry 41 | Brynn + Sweelinck scenes | "He knew the shape of the absence... He wrote it down and waited." |

A player who completes all six systems assembles the full picture: Froberger was mapping the Void's advance without knowing it, the Circle knew and monitored who accessed his work, Auros decoded the tactical implication, the memorial stone encodes the Circle's failed attempt at erasure, Corelli's revelation names Froberger as the first external contact for the suppressed research, and the Entry 41 scenes show what the map meant to the people who loved him.

No single system tells the whole story. All six together do.

---

### XXXII-F. Implementation Spec

**XXXII-F-1.** Add `S29_AUROS_THEORY` const (scene text, §XXXII-D).

**XXXII-F-2.** In BA node render: add ambient text injection at `s8VargaWatches >= 1` (see table §XXXII-B). Add [Observe] / [Observe again] / [Watch for signal] buttons gated by watch count. Each button click increments `s8VargaWatches` and re-renders the node.

**XXXII-F-3.** When `s8VargaWatches` reaches 3: show Watch 3 event modal (§XXXII-B text); set `s8VargaClueUnlocked = true`; add `storyMsg()` direction note.

**XXXII-F-4.** In SH (and optionally BA) node render: if `s8VargaClueUnlocked && !s8PachelbelTold && fav_pachelbel >= 1`, add [Tell Pachelbel about the pigeon] option. On click: show Pachelbel response modal (§XXXII-C); set `s8PachelbelTold = true`; add 15gp.

**XXXII-F-5.** In CY node render: check `frobergerLastEntryRead && fav_auros >= 2 && !s29LineDelivered`. If true, show `S29_AUROS_THEORY` modal before standard node. On close: set `s29LineDelivered = true`.

---

### XXXII-G. State Flags

All flags pre-exist in `_S_DEFAULTS()`:
- `S_story.s8VargaWatches` — number, default 0, NOT NG+-preserved (resets to 0)
- `S_story.s8VargaClueUnlocked` — boolean, default false, NOT NG+-preserved
- `S_story.s8PachelbelTold` — boolean, default false, NOT NG+-preserved
- `S_story.s29LineDelivered` — boolean, default false, NOT NG+-preserved

**No new state fields.** All four entries already in Section III.

**NG+ note:** All four clear on NG+. The Varga observation arc can be re-run. The Auros speech can be re-triggered if Entry 41 is re-read and Auros is brought to Dear Friend again. On a second run, a player who already knows the picture will recognize each beat faster — the information doesn't change, but the understanding arrives earlier.

---

### XXXII-H. Documentation Updates Required on Implementation

| File | Update |
|------|--------|
| `story.md` | Add §F2 notes for s8 BA observation logic, s8 Pachelbel tell option, s29 CY trigger; add `S29_AUROS_THEORY` to Auros NPC profile section |
| `world.md` | Update S8 and S29 entries with full scene text; add cross-reference network note |
| `plan.md` | Mark §XXXII complete; update §V-A queue; note all s8/s29 flags already in §III |
| `combat.md` | Add note: Varga surveillance backstory cross-refs Auros CY tactical data (Void-advance indicator sectors) |

No lab report. No new nodes, monsters, items, or quests.

---

### XXXII-I. Design Notes

**"Was it the Froberger shelf?"** Pachelbel doesn't wait for an answer. She already knows. This is the scene's emotional center: the player brought her a direction (north-northeast) expecting to learn something; instead, Pachelbel confirms something the player already suspected and reveals that she suspected it independently. The 15gp is her acknowledgment that the player did something that cost attention and time — two things Pachelbel values.

**Why doesn't Auros seem shocked?** Because she isn't. The Void-advance indicators were in her Year Twelve reports. She flagged those sectors. She was not surprised when Froberger's route matched them — she was surprised by the timing: that Froberger reached Entry 41 (where he finally understood) at the same moment she was correlating the same data from the other direction. *"He got to the end of the map. Then the Tide arrived."* She says this without inflection because it's just the sequence of events. What makes it tragic is the precision of the timing, which she doesn't name.

**The pigeon goes north-northeast.** This is slightly wrong as an actual direction from BA to SH — the story geography doesn't require geographic accuracy, and the player is not expected to verify it on the map. What matters is that a direction is given, and that the direction leads somewhere. "Pachelbel's district" is approximate and correct in the sense that matters: it leads to Pachelbel.

**Six systems, one picture.** The cross-reference table in §XXXII-E is not a checklist. A player who only triggers one system still has a complete experience of that system. But the six together form something the game never states explicitly: the Circle, the Void, Froberger's route, the memorial, the courier reveal, the Entry 41 scenes — they all connect. The game doesn't tell the player to connect them. It creates the conditions and trusts that some players will.

---

*§XXXII status: ✅ Implemented — Varga Watch (S8) and Auros Theory (S29) designed; all four flags pre-exist in _S_DEFAULTS(); S29_AUROS_THEORY const specified with full speech text; three-observation BA ambient escalation table written (Varga at watches 1/2/3); Watch 3 pigeon launch event text; Pachelbel tell response written (+15gp, "was it the Froberger shelf?"); CY trigger for s29 (frobergerLastEntryRead + Dear Friend); six-system cross-reference table assembled; zero new state flags; no new nodes/monsters/items/quests; no lab report — document inline.*

---

## Section XXXIII — The Archive and the Tools: Blue Shutters (S7) and Raison (S46) (Layers 68a + 68b, ✅ Implemented)

> **Design status:** PLANNED. State flags `archiveVisited`, `archiveLetterObtained`, `archiveUndercitySurveyTaken`, and `raisonToolsUsed` already exist in `_S_DEFAULTS()` — this section provides the full designs.  
> **Layers 68a + 68b** — two S-suggestion systems; one existing item cross-cut into §XVI; no new nodes or monsters; no lab report; document inline.

---

### XXXIII-A. Concept: Knowledge That Was Hidden and Knowledge That Was Sold

Both systems turn on the same idea: there is more in the world than what is openly visible, and accessing it costs something specific.

The Blue Shutters Archive (S7) costs a Yael letter — the player must have earned Yael's Friendly regard. What they find inside is not secret in itself, but it is more complete than what circulates freely: Entry 33 with archival annotation, an Undercity Survey that Auros needs, and the archive letter that §XVI will accept as proof of access to restricted-class documents.

Raison's Tools (S46) costs 50gp and Pachelbel's trust (Dear Friend). What the tools carry is not a mechanical enhancement but a record — of a person, of an arrest, of a family separated. Using them gives the player a modest gold return that is not compensation for what was lost. Pachelbel knows this. The tools are sold anyway because the right things should find the right hands.

---

### XXXIII-B. S7 — Blue Shutters Archive: Three-State Unlock (Layer 68a)

**Location:** CI node. The archive is on the northeast corner of the crossroads — the same corner where Froberger's memorial stone sits to the northwest (§XXVIII). They have been across the courtyard from each other this entire time.

**Three states:**

| State | Condition | Button / Text |
|-------|-----------|---------------|
| Blocked | `!archiveLetterObtained` | *"Blue Shutters Archive — access requires a registered letter of introduction."* [Request a letter] |
| Letter pending | Yael dialogue initiated but letter not yet obtained | [Yael is writing the letter] *(disabled until next CI visit)* |
| Open | `archiveLetterObtained` | [Enter the Archive] |

**[Request a letter]:** Opens a short Yael dialogue (available when `fav_yael >= 1`):

```
"The Blue Shutters? Yes, I know someone on the access
committee. I can write you in — it'll take a day. They
ask for a name and a purpose. I'll say you're documenting
the walk routes."

A pause.

"It's not wrong."
```

Sets a `_archiveLetterPending = true` session flag (not persisted). On the next CI visit: letter is ready, `archiveLetterObtained = true`, `storyMsg()`: *Yael left a letter of introduction at the crossroads desk. The Blue Shutters Archive is now accessible.*

**Inside the archive** (`archiveVisited = true` on first entry):

Three things are available:

1. **Entry 33 (Archival Copy):** The standard Froberger journal Entry 33 appears in the journal sidebar immediately (added to `journalEntriesRead`). The archive version includes a two-line archivist footnote beneath the entry text:

   > *Filed under: Void Research / Public / Uncatalogued — per Circle directive 1309-VII.*  
   > *Archivist note: Entry author appears unaware of the correlation. No restriction required.*

   This footnote appears only in the archive version. The regular node version (at its normal node) has no footnote. Players who read Entry 33 at its normal node before entering the archive will see the footnote when they [Re-read Entry 33] inside the archive.

2. **`archive_letter`** — key item. Pickable from the shelf on the same visit. `archiveLetterObtained` tracks access, but the item itself is separate in inventory. Flavor text: *"A partial shelf record. 'Researcher Category: Containment, Date: [REDACTED].' The handwriting shifts mid-page — two different archivists. The second one stopped in the middle of a sentence."* Usage: In §XVI (Weimar Scholar Gate), bringing `archive_letter` to Isolde Voss skips the Scholar Kings seal-hunting step entirely. Isolde: *"I didn't expect someone to have one of these. This is a Circle-class containment record. Where did you find this?"*

3. **Undercity Survey (Partial)** — key item. `archiveUndercitySurveyTaken = true` on pickup. Flavor: *"A partial survey of the Undercity's corridor grid, annotated with pressure readings. Someone was mapping the same thing Froberger mapped, from below."* Deliverable to Auros at CY.

---

### XXXIII-C. S7 — The Survey Delivery (Layer 68a, continued)

**Delivering to Auros at CY** (requires `archiveUndercitySurveyTaken && !S_story.surveyDeliveredToAuros`):

Auros dialogue on receiving the survey:

```
She takes it from you without asking where you got it.

She reads the pressure annotations. A long pause.

"This was taken around Year Ten. The survey team
documented six sectors. Four of them match the
Void-advance indicators I flagged in Year Twelve."

She folds it.

"Two years. They had two years of lead time and
this never reached the tactical desk. Someone
decided it wasn't worth forwarding."

She adds it to her notes. +40gp.

"If you find the second half, bring it."
```

Reward: +40gp. Sets `S_story.surveyDeliveredToAuros = true`.

**Auros survey cross-ref with S29:** If `s29LineDelivered` is also true (Auros has already decoded Entry 41), she adds one line after the standard delivery text: *"Froberger walked the same sectors in Year Thirteen. One year after this survey was buried. If he'd known it existed, he would have understood earlier."*

**New state flag:** `surveyDeliveredToAuros` (boolean, default false, NOT NG+-preserved). This is the one genuinely new flag in §XXXIII — it's not in the current `_S_DEFAULTS()` and must be added.

---

### XXXIII-D. S46 — Raison's Tools (Layer 68b)

**Item:** `raisons_tools` — sold by Pachelbel at BA, Dear Friend tier (fav_pachelbel >= 2), 50gp. The item appears in Pachelbel's special stock alongside her other Dear Friend items (§XVIII implementation notes reference `_renderPachelbelSpecials()` at S46/S51/S57).

**Flavor text:** *"A field assessment kit. Worn grip, clean lens, calibration weights. The name 'R.T.' is scratched into the case. Someone used these for nine years and knew what they were doing."*

**Using from inventory:** Sets `raisonToolsUsed = true`. Immediate effects:
1. `S_story.gold += 30` — the assessment reveals hidden value in something already in the player's possession. The storyMsg: *"The lens clarifies something you've been carrying. What you thought was worth less is worth more. (+30 gold)"*
2. Second `storyMsg()`: *"The handle has instructions written in tiny letters. Whoever taught Raison to do this was very careful about what not to forget."*

The 30gp is not the point. The second message is the point.

---

### XXXIII-E. S46 — Pachelbel's Ledger (Layer 68b, continued)

**Const:** `PACHELBEL_LEDGER` — object with entries indexed by number. Entries 2 and 3 are the ones the player can access. Entry 1 exists but is not shown (it's prior to the events the player cares about).

**Access:** When `fav_pachelbel >= 2` (Dear Friend), a [Read Ledger] button appears at BA. The ledger is free to read, no purchase required.

**Entry 2:**

```
Raison was taken at the north gate.

Someone told the Circle about the seals he'd been
breaking. I need it on record that it wasn't me,
even if the only record is this.

They called it unauthorized research access. His
tools were confiscated. His eldest was brought in
for "evaluation." The Circle uses that word like
it means something clean.
```

**Entry 3:**

```
The younger one got out. Took the southern road
by night — someone had left a boat. I don't know
who arranged it. I didn't ask.

The eldest is still in evaluation, which means they
found something worth keeping. Raison would know
what to think about that.

I bought the tools back at the impound auction.
Paid four times what they were worth, because I
could, and because someone had to.

I don't know what I'm going to do with them.
```

**Cross-references:**
- The younger child taking "the southern road" to Tilbury connects to §XIX (Tilbury Harbor — Vonn, one of the two arc characters, may be Raison's younger child; the connection is not stated explicitly, left for players who notice the details)
- "Evaluation" connects to §XVI Weimar Scholar Gate (Ivory Circle "researcher assets" — the same term used for the First Researcher's suppression)
- Pachelbel knowing the pigeon route (§XXXII) becomes more legible: she learned surveillance networks while trying to track what happened to Raison after the arrest

---

### XXXIII-F. Implementation Spec

**XXXIII-F-1.** In CI node render: check state and render the appropriate archive button (blocked / pending / open). On [Request a letter]: fire Yael dialogue; set session var `_archiveLetterPending`. On next CI visit if pending: set `archiveLetterObtained = true`; show letter-ready message.

**XXXIII-F-2.** [Enter Archive] opens archive overlay with three content rows: Entry 33 (with footnote), `archive_letter` pickup button, Survey pickup button.

**XXXIII-F-3.** Entry 33 archive footnote: append to standard entry text when rendering from inside the archive overlay. The footnote text is a property on `FROBERGER_JOURNAL[33]` or a separate const `ARCHIVE_FOOTNOTE_33`.

**XXXIII-F-4.** In CY node render: if `archiveUndercitySurveyTaken && !S_story.surveyDeliveredToAuros && fav_auros >= 0`, show [Deliver the survey] option. On click: Auros dialogue; +40gp; `surveyDeliveredToAuros = true`. If `s29LineDelivered`: append cross-ref line.

**XXXIII-F-5.** Add `raisons_tools` to Pachelbel's special stock at BA (`_renderPachelbelSpecials()`): available when `fav_pachelbel >= 2`, costs 50gp. Standard inventory item with `type:'usable'`.

**XXXIII-F-6.** When player uses `raisons_tools` from inventory: set `raisonToolsUsed = true`; +30gp; two story log messages (§XXXIII-D).

**XXXIII-F-7.** In BA node render: if `fav_pachelbel >= 2`, add [Read Ledger] button. Opens overlay with entries 2 and 3 from `PACHELBEL_LEDGER`.

**XXXIII-F-8.** Add `surveyDeliveredToAuros` to `_S_DEFAULTS()` (boolean, default false). This is the only new field required.

---

### XXXIII-G. State Flags

Pre-existing in `_S_DEFAULTS()` (no changes needed):
- `S_story.archiveVisited` — boolean, default false
- `S_story.archiveLetterObtained` — boolean, default false
- `S_story.archiveUndercitySurveyTaken` — boolean, default false
- `S_story.raisonToolsUsed` — boolean, default false

**One new flag** (must be added to `_S_DEFAULTS()`):
- `S_story.surveyDeliveredToAuros` — boolean, default false, NOT NG+-preserved

Add `surveyDeliveredToAuros` to Section III state field table.

---

### XXXIII-H. Documentation Updates Required on Implementation

| File | Update |
|------|--------|
| `story.md` | Add §F2 rows for archive overlay render, survey delivery, Pachelbel ledger, Raison's Tools use; add Pachelbel entry 2+3 text to NPC profile section |
| `world.md` | Update S7 and S46 entries with full scene text; add Raison backstory note and Vonn connection hint; update survey delivery details |
| `mechanics.md` | Add `raisons_tools` to Pachelbel Special Stock table; add archive_letter to key items; add undercity_survey_partial to key items |
| `plan.md` | Mark §XXXIII complete; update §V-A queue; add `surveyDeliveredToAuros` to §III state fields; note archive_letter cross-ref to §XVI |
| `spec-engine.md` | Add `surveyDeliveredToAuros` to `_S_DEFAULTS()` fields |

No lab report. No new nodes or monsters.

---

### XXXIII-I. Design Notes

**The archive is across the courtyard from the memorial.** This is not stated in the game. The player discovers it by looking at the CI node map. Froberger's memorial and the archive where his un-restricted entry lives are thirty meters apart. The Circle decided Entry 33 didn't need restricting. They were right, technically. And wrong in the way things are often technically right.

**"I don't know what I'm going to do with them."** Pachelbel's Ledger Entry 3 ends on this line. The player reading this already knows: Pachelbel sells the tools to someone who might use them well. The ledger was written before she knew what to do with them. By the time the player reads it, the question has already been answered.

**The Vonn connection.** "The younger one took the southern road by night — someone had left a boat." §XIX (Tilbury Harbor, Layer 54) features Vonn as one of the two arc characters. The connection is not named. A player who notices both the ledger and Vonn's backstory in §XIX will feel the click. A player who doesn't will still have a complete experience of both systems. The connection requires no flag, no quest step, no reward — just attention.

**Auros and the buried survey.** The survey was taken in Year Ten. Auros flagged the same sectors in Year Twelve. Two years elapsed. The survey "never reached the tactical desk" — someone decided it wasn't worth forwarding. Auros has been working from incomplete data for her entire career. The player bringing her this survey is giving her something she should have had a long time ago. The +40gp is the tactical value she assigns to it. The line *"If you find the second half, bring it"* is not a quest hook — it's what someone says when they know the rest of the picture exists somewhere and they have not given up on it.

---

*§XXXIII status: ✅ Implemented — Blue Shutters Archive (S7) three-state unlock designed; Entry 33 archive footnote specified; archive_letter item and §XVI cross-ref; Undercity Survey delivery to Auros (+40gp, s29 cross-ref line); Raison's Tools (S46) item designed (+30gp use, handle message); Pachelbel Ledger entries 2+3 written (Raison arrest, family fate, Vonn connection); one new flag (surveyDeliveredToAuros); four pre-existing flags; no new nodes/monsters; no lab report — document inline.*

---

## Section XXXIV — The Couperin Ledger: Quill's Three-Beat Arc (Layer 69, ✅ Implemented)

> **Design status:** IMPLEMENTED. State flags `couperiSongReceived`, `couperiDebtDegraded`, and `quillQuestComplete` pre-existed in `_S_DEFAULTS()`.  
> **Layer 69** — `S34_QUILL_BEAT2` + `S34_QUILL_BEAT3` consts added; Beat 3 block runs before Beat 2 in TV render to prevent same-visit co-fire; L44-E npcKey bug fixed ('couperin' → 'quill') and lesson line updated; `ACT8_FAREWELL_BEATS.quill.text` converted to function with `quillQuestComplete` branch; BA Act VIII Quill farewell block added (fires before TV, sets `act8FarewellQuill`). Pachelbel auto-gives lute via NPC card render (pre-existing). Quest auto-complete gives +40gp + removes lute (pre-existing). Town Crier `quillQuestComplete` line pre-existing.

---

### XXXIV-A. Concept: The Debt That Taught Something

Quill Faber is the bard at the Birka Tavern (TV, node 03). His full name is Quill Couperin-Faber, or simply Quill of the Couperin family — a name that carries a multi-generational debt obligation dating to Elder Couperin's placement of Codex Shard 1 at the Birka Archive (§XXII).

The lute pawn is the visible surface of this debt. The lesson Elder Couperin inscribed on the original debt notice — *"just a number"* — is the thing Quill has been trying to understand his entire adult life. The three-beat arc ends not with the debt repaid but with the debt understood. That is the resolution.

**Beat 1:** The player retrieves Quill's lute from Pachelbel. (quest_couperin_lute)  
**Beat 2:** Quill plays Couperin's family theme. The song is the debt's real purpose. (couperiSongReceived)  
**Beat 3:** The acknowledgment settles in. A new dialogue line enters Quill's pool permanently. The world registers it. (couperiDebtDegraded, quillQuestComplete)

---

### XXXIV-B. Beat 1 — The Lute Retrieval

**Quest activation:** Available at TV when `fav_quill >= 0` (any visit). Quill's opening dialogue when the quest is first available:

```
Quill is at his usual table with a borrowed instrument —
you can tell by the way he holds it. More carefully than
you'd hold your own things.

"My lute's at Pachelbel's. Two months. I put it up as
surety for a debt that isn't entirely mine — technically
it's the Couperin estate's, but the estate is me now,
so it's mine too."

He looks at the borrowed instrument.

"Forty gold when you bring it back. I'll have it by then."
```

Sets `quest_couperin_lute` active.

**Pachelbel at BA or SH** — when quest is active, a [Ask about the lute] option appears:

```
"Quill's lute?"

She pulls it from behind the counter without ceremony.
The case has a small label in Quill's handwriting:
'Return to Quill Faber, TV, when ready.'

"He wrote that label the day he brought it in. He already
knew someone would come for it."

She hands it over. No charge.

"Tell him the account is closed."
```

`undercity_survey_lute` item added to inventory. (The item key is `quills_lute`, `type:'quest'`, not sellable.)

---

### XXXIV-C. Beat 2 — Couperin's Song

**Trigger:** Next TV visit with `quills_lute` in inventory.

```
Quill takes the lute from you.

He opens the case and checks the strings — they're still
in tune. It has been sitting in Pachelbel's back room for
two months and it is still in tune.

He plays a phrase. One bar, two. Something formal and
very old — the same pattern as the first line of
Codex Shard 1's note (if you've read it), though you'd
have to know both to hear the connection.

"Couperin's theme," he says. "The family theme. My
grandmother taught me this. I haven't played it since
before the pawn."

He closes the case.

"Forty gold. And thank you."
```

On close:
- `quills_lute` removed from inventory
- `S_story.gold += 40`
- `S_story.couperiSongReceived = true`
- `S_story.quillQuestComplete = true`
- Dear Friend upgrade check fires for Quill (`fav_quill` check → may increment to 2)
- `storyMsg()`: *Quill has his lute back. Pachelbel's account is closed.*

**The musical connection (Shard 1):** If the player has read the Shard 1 note (§XXII), the parenthetical in the scene becomes active — they recognize the pattern. This is not gated: the scene text includes the connection regardless. But only players who have read §XXII's shard note will know what it means. This is the same design principle as the six-system intelligence picture (§XXXII-E): no single system states the full connection.

---

### XXXIV-D. Beat 3 — The Debt Degradation

**Trigger:** First TV visit where `quillQuestComplete && !couperiDebtDegraded`.

```
The borrowed instrument is gone. Quill has his lute.

He's playing something quiet when you arrive — not
performing, just playing. The tavern is half-empty
or half-full, depending on how you count.

He looks up.

"I've been thinking about the note Elder Couperin left
on the original account. 'Just a number.' I used to
find that dismissive."

He plays another bar.

"I think he meant something different. He meant: this
number served its purpose, which was to create an
obligation, which was honored, which taught something.
After that, it's just a number. You can let it go."

He turns back to his playing.
```

On close:
- `S_story.couperiDebtDegraded = true`
- L44-E dialogue injected (§XXXIV-E)
- `storyMsg()`: *"The Couperin debt has done its work."*

**Town Crier integration:** On the next inn rest after `quillQuestComplete`, the questFlag town crier line fires: *"The ledger house near the Birka bar settled two long-outstanding debts this week. The creditors didn't argue, which is the strangest part."* This uses the existing §XXVII questFlag tier with `quillQuestComplete` as the trigger flag.

---

### XXXIV-E. The L44-E Dialogue Injection

When `couperiDebtDegraded = true`, Quill's impartial dialogue pool permanently gains one additional line (Layer 44, Milepoint E injection). This line rotates into the pool like any other impartial quote; it does not fire preferentially after the debt degradation scene. It is simply available from that point forward:

> *"Elder Couperin wrote 'just a number' on the original debt notice. Not minimizing. Describing. A debt that has done its work becomes just a number. That's when you can release it."*

This line is the distilled lesson — the version Quill would give to a stranger asking. The Beat 3 scene gives it directly; this quote gives it to players who visit Quill again later and happen to draw this line from the pool.

---

### XXXIV-F. Act VIII Farewell Cross-Reference

§XXV §C-3 places Quill's farewell beat at the BA node (fav ≥ 1), which is unusual since Quill's standard node is TV. The resolution: in Act VIII, Quill visits the Birka Archive (BA) to physically close the Couperin estate ledger — a real archival action, not a metaphor. The farewell fires when the player visits BA in Act VIII and `!act8FarewellQuill && fav_quill >= 1`. The player may find him there unexpectedly.

If `quillQuestComplete` is true when the farewell fires, the farewell adds one line to the standard text:

> *"Pachelbel sent a note. 'Account closed, no remainder.' I keep it in the case."*

If `quillQuestComplete` is false (the player never retrieved the lute), the farewell still fires but without this line. Quill's reflection on the debt stands regardless of whether the player participated.

---

### XXXIV-G. Implementation Spec

**XXXIV-G-1.** Add `quest_couperin_lute` to `QUEST_DB`. Quest active check: `fav_quill >= 0` (always available from first TV visit). Quest giver: Quill at TV.

**XXXIV-G-2.** In TV render: if quest active AND `quills_lute` not in inventory, show standard TV node with quest-active Quill dialogue. If `quills_lute` in inventory: fire Beat 2 scene (§XXXIV-C) before node content; on close: process loot + flags.

**XXXIV-G-3.** In BA and SH render: if `quest_couperin_lute` active, show [Ask about the lute] option. On click: Pachelbel dialogue (§XXXIV-B); add `quills_lute` to inventory.

**XXXIV-G-4.** In TV render: check `quillQuestComplete && !couperiDebtDegraded`. If true: show Beat 3 scene (§XXXIV-D) before node content; on close: set `couperiDebtDegraded = true`; inject L44-E line into Quill's `NPC_DIALOGUES.quill.impartial` pool.

**XXXIV-G-5.** In BA render (Act VIII): check `actNumber === 8 && fav_quill >= 1 && !act8FarewellQuill`. If true: show Quill's farewell beat (§XXV §C-3 text + `quillQuestComplete` branch); set `act8FarewellQuill = true`.

---

### XXXIV-H. State Flags

All pre-existing in `_S_DEFAULTS()`:
- `S_story.couperiSongReceived` — boolean, default false, NOT NG+-preserved
- `S_story.couperiDebtDegraded` — boolean, default false, NOT NG+-preserved
- `S_story.quillQuestComplete` — boolean, default false, NOT NG+-preserved

**No new state fields.** Section III already has all three entries. This section documents what they gate.

**NG+ note:** All three clear on NG+. The lute arc can be re-run. On a second run, players who have already learned the Couperin theme will recognize it. Nothing changes. Everything is true again.

---

### XXXIV-I. Documentation Updates Required on Implementation

| File | Update |
|------|--------|
| `story.md` | Add §F2 note for Beat 2/3 TV trigger logic; add BA Act VIII Quill check note; add L44-E quote to Quill's NPC_DIALOGUES transcript |
| `world.md` | Update Quill NPC section with lute arc summary; note BA node Act VIII appearance; Pachelbel lute handoff cross-ref |
| `mechanics.md` | Add `quest_couperin_lute` to QUEST_DB table; add `quills_lute` item (quest, non-sellable) |
| `plan.md` | Mark §XXXIV complete; update §V-A queue; note s-flags already in §III |

No lab report. No new nodes or monsters. One quest item (`quills_lute`, type:'quest') and one dialogue injection (L44-E).

---

### XXXIV-J. Design Notes

**"He already knew someone would come for it."** Pachelbel's line about the label Quill wrote. The label reads *'Return to Quill Faber, TV, when ready.'* Quill wrote it on the day he brought the lute in — he knew, when he gave the lute up, that it was temporary. He was not in despair. He was managing an obligation. The label is his optimism made legible.

**The song is still in tune.** Two months in a case, and the strings hold. This is the kind of detail that has no narrative function except to be true. Instruments kept properly stay in tune. Quill kept it properly even when he had to give it away. The reader can decide what that means.

**The shard connection.** The Couperin family theme is the same pattern as the first note of Shard 1's inscription. Elder Couperin placed Shard 1 at the Birka Archive seventy years ago and told his family he was storing a keepsake. The keepsake was a Codex Shard. The family theme was the Couperin way of marking something as theirs. Quill plays it as a family song; Elder Couperin embedded it as a kind of signature. A player who has read both will hear this. A player who has read neither will hear a sad and beautiful phrase.

**"Just a number."** The three-word note on the original debt notice. Quill misunderstood it for years as dismissal. The game doesn't tell you what it means; it shows Quill arriving at the interpretation. Then he gives it, once, plainly: *"A debt that has done its work becomes just a number. That's when you can release it."* This is the arc in one sentence. The entire three-beat structure exists to earn that sentence.

---

*§XXXIV status: ✅ Implemented — Quill Couperin three-beat arc designed; Beat 1 (lute retrieval, Pachelbel dialogue "he already knew"); Beat 2 (Couperin's theme, song played, +40gp, quest complete); Beat 3 (debt degradation scene, L44-E dialogue injection); Act VIII BA node farewell cross-ref (§XXV) with quillQuestComplete branch; Town Crier quillQuestComplete line already in §XXVII; three pre-existing flags; no new nodes/monsters/items (quest item quills_lute type:'quest'); no lab report — document inline.*

---

## Section XXXV — The First Inn Light: Brynn's Vigil Arc (Layer 70, ✅ Implemented)

### XXXV-A. Concept

A lamp burns at the First Inn (IN, Birka) — it has been lit since the player's first night. Brynn lit it then, without announcement, and has tended it every night since. This arc formalizes that lamp as a named lore element and gives Brynn her own dedicated two-beat quest arc, parallel to Quill's Couperin Ledger (§XXXIV). Beat 1 is the inquiry (fav_brynn ≥ 1, Act II+). Beat 2 is the choice of the lamp's fate (fav_brynn ≥ 2 only). The Act VIII farewell (§XXV) branches on both flags.

The "Still the same light?" exchange in §XXXI (S54 Joint Witness) retroactively becomes the verbal shorthand for everything established here. Yael already knew.

Three genuinely new flags: `brynnKeeperStoryTold`, `brynnLightChoiceMade`, `brynnLightKept`. All must be added to `_S_DEFAULTS()`.

---

### XXXV-B. The Lamp as Persistent Setting

Patch IN node render to include one ambient line every visit (no flag required):

> *A lamp burns in the corner. It has been lit since your first night here.*

This line appears in the room description block, before NPC options, always. No trigger. No condition. It is simply true.

On implementation: if IN node currently has no persistent room-description flavor text, this is the first. If it does, insert after existing flavor.

---

### XXXV-C. Beat 1 — The Inquiry

**Trigger:** IN node visit, `fav_brynn >= 1`, Act II+, `!brynnKeeperStoryTold`.

**Option appears:** `[Ask Brynn about the lamp in the corner.]`

**Brynn's response (from `BRYNN_KEEPER_STORY.inquiry`):**

> *"I lit it the night you arrived. Didn't know if you'd be back by morning, and it seemed wrong to let you come back to a dark room. So I kept it."*

**Follow-up option appears immediately (same visit):** `[Why that night?]`

**Brynn (from `BRYNN_KEEPER_STORY.followUp`):**

> *"I've had guests before. Some didn't come back. I always meant to start a lamp then too. But you were the first time I actually did it."*

No follow-up to the follow-up. The conversation ends there.

**Sets:** `brynnKeeperStoryTold = true`.

**Note:** The lamp inquiry cannot fire before Act II because it references a continuity ("since your first night") that requires the player to have been back at least once.

---

### XXXV-D. Beat 2 — The Choice (Dear Friend Only)

**Trigger:** IN node visit, `fav_brynn >= 2`, `brynnKeeperStoryTold`, `!brynnLightChoiceMade`. Fires on the *next* IN visit after Beat 1 if fav_brynn is already 2; otherwise fires the first qualifying IN visit.

**Brynn (from `BRYNN_KEEPER_STORY.choicePrompt`):**

> *"I've been thinking about what happens when you're done — when all of this is done. Whether the lamp should keep burning. I haven't decided. I think it's your lamp as much as it is mine now. What do you want?"*

**Options:**

| Choice | Brynn's response | Flags set |
|---|---|---|
| `[Let it keep burning.]` | *"Then it keeps burning. I'll see to it."* | `brynnLightChoiceMade = true`, `brynnLightKept = true` |
| `[It can rest when I'm done.]` | *"Then we'll let it rest together. Seems right."*  | `brynnLightChoiceMade = true`, `brynnLightKept = false` |

Both choices are valid. Neither is rewarded or penalized. No gold, no fav change. The arc is complete at this beat regardless of which choice is made.

**Design constraint:** If fav_brynn never reaches 2 before Act VIII, Beat 2 never fires. The §XXV farewell handles this gracefully (see §XXXV-E).

---

### XXXV-E. §XXV Farewell Integration (Act VIII IN Beat)

When the Act VIII farewell fires at IN (§XXV), Brynn's beat branches on all three flags:

| State | Brynn's farewell line |
|---|---|
| `!brynnKeeperStoryTold` | *"There's a lamp in the corner that's been burning since your first night. I wanted you to know that."* |
| `brynnKeeperStoryTold && !brynnLightChoiceMade` | *"The lamp is still burning. I've never asked what you wanted for it."* |
| `brynnLightChoiceMade && brynnLightKept` | *"The lamp is still burning. I checked this morning."* |
| `brynnLightChoiceMade && !brynnLightKept` | *"The lamp is still burning. I'll tend it until you come back. After that — well. After that."* |

All four are emotionally complete. The `!brynnKeeperStoryTold` farewell is the compressed version of the full arc — the player discovers the lamp at the last possible moment.

**Implementation note for §XXV:** The farewell beat at IN should check `brynnKeeperStoryTold` first; if false, deliver the abbreviated story, set `brynnKeeperStoryTold = true`, and skip Beat 2 (no choice during farewell). If `brynnKeeperStoryTold` is true but `brynnLightChoiceMade` is false and `fav_brynn >= 2`: offer the choice inline during the farewell. This is the only case where Beat 2 fires during Act VIII rather than during a regular visit.

---

### XXXV-F. §XXXI Cross-Reference (S54 Joint Witness)

The S54 scene at CI has Brynn ask Yael: *"Still the same light?"* / *"Still the same light."* This exchange is already designed in §XXXI. §XXXV establishes what "the same light" refers to without altering the §XXXI scene text. No patch to §XXXI is required.

**Optional enhancement (flag as design note, not implementation requirement):** If `brynnKeeperStoryTold` at the time S54 fires, the player can infer the reference from their own prior conversation. If `!brynnKeeperStoryTold`, the exchange is mysterious until Beat 1 fires later. Both experiences are valid — the scene works in either order.

---

### XXXV-G. §XXVII Town Crier Integration

One Town Crier ambient line unlocks when `brynnKeeperStoryTold`. Fires once during inn rest; uses existing TC dedup logic (line ID: `TC_BRYNN_LAMP`):

> *"The lamp at the First Inn has been burning since the early days. Birka folk consider it a good omen."*

Add to `TOWN_CRIER_LINES` array with trigger condition `brynnKeeperStoryTold`. TC dedup ensures it fires only once across all inn rests.

---

### XXXV-H. The `BRYNN_KEEPER_STORY` Const

```js
const BRYNN_KEEPER_STORY = {
  inquiry:      `"I lit it the night you arrived. Didn't know if you'd be back by morning, and it seemed wrong to let you come back to a dark room. So I kept it."`,
  followUp:     `"I've had guests before. Some didn't come back. I always meant to start a lamp then too. But you were the first time I actually did it."`,
  choicePrompt: `"I've been thinking about what happens when you're done — when all of this is done. Whether the lamp should keep burning. I haven't decided. I think it's your lamp as much as it is mine now. What do you want?"`,
  choiceKeep:   `"Then it keeps burning. I'll see to it."`,
  choiceRest:   `"Then we'll let it rest together. Seems right."`,
  farewellNoStory:   `"There's a lamp in the corner that's been burning since your first night. I wanted you to know that."`,
  farewellNoChoice:  `"The lamp is still burning. I've never asked what you wanted for it."`,
  farewellKeep:      `"The lamp is still burning. I checked this morning."`,
  farewellRest:      `"The lamp is still burning. I'll tend it until you come back. After that — well. After that."`
};
```

---

### XXXV-I. Implementation Spec

**XXXV-I-1.** Add to `_S_DEFAULTS()`: `brynnKeeperStoryTold: false`, `brynnLightChoiceMade: false`, `brynnLightKept: false`.

**XXXV-I-2.** Patch IN node render: insert lamp ambient line (*"A lamp burns in the corner..."*) into room description, always.

**XXXV-I-3.** IN node options render: if `fav_brynn >= 1 && !brynnKeeperStoryTold && act >= 2`: add `[Ask Brynn about the lamp in the corner.]` option. On selection: deliver `BRYNN_KEEPER_STORY.inquiry`, render follow-up option, deliver `BRYNN_KEEPER_STORY.followUp` on selection, set `brynnKeeperStoryTold = true`.

**XXXV-I-4.** IN node options render: if `fav_brynn >= 2 && brynnKeeperStoryTold && !brynnLightChoiceMade`: add Beat 2 choice block (choicePrompt + two options). On choice: set `brynnLightChoiceMade = true` + `brynnLightKept` accordingly.

**XXXV-I-5.** Patch §XXV Act VIII IN farewell branch: check `brynnKeeperStoryTold` / `brynnLightChoiceMade` / `brynnLightKept` per §XXXV-E table. Handle inline Beat 2 offer if `brynnKeeperStoryTold && !brynnLightChoiceMade && fav_brynn >= 2`.

**XXXV-I-6.** Add `TC_BRYNN_LAMP` line to `TOWN_CRIER_LINES` with `brynnKeeperStoryTold` trigger condition.

---

### XXXV-J. State Flags

| Flag | Default | NG+-preserved? | Note |
|---|---|---|---|
| `brynnKeeperStoryTold` | `false` | No (reset) | Beat 1 fired |
| `brynnLightChoiceMade` | `false` | No (reset) | Beat 2 choice offered and answered |
| `brynnLightKept` | `false` | No (reset) | `true` = 'keep'; `false` = 'rest' or choice not made |

**All three are new — not in current `_S_DEFAULTS()`.** Add all three in the Brynn block.

NG+ reset rationale: the lamp story is about this run, this arrival, this first night. The player re-lights the lamp (so to speak) each new game. Preserving the choice across NG+ would imply a continuity the narrative doesn't support — Brynn doesn't remember you until §XV NG+ memory fires.

---

### XXXV-K. Documentation Updates

| File | Update |
|---|---|
| `story.md` | Add §XXXV stub: lamp ambient, Beat 1 inquiry, Beat 2 choice, §XXV farewell branch table, §XXXI cross-ref note |
| `world.md` | Add §XXXV entry in Brynn's section: lamp lore, three-flag design, §XXXI and §XXV cross-refs |
| `plan.md` | §V-A item 26; §XI-A row for §XXXV |

No lab report. No new nodes. No new monsters. No new items. Three new state flags.

---

### XXXV-L. Design Notes

**"Without announcement."** Brynn didn't light the lamp as a gesture. She lit it because it was the practical thing to do when a stranger might come back in the dark. The arc only works because Brynn's motivation is that quiet. When the player asks why, she doesn't reach for meaning — she reaches for the fact: *"It seemed wrong to let you come back to a dark room."*

**The follow-up as the real answer.** The inquiry response explains what she did. The follow-up explains why it was this time, this guest: *"You were the first time I actually did it."* She's had strangers not come back before. She meant to light the lamp then too. She never did. This time she did. The player can decide what that means about Brynn, and about themselves.

**Two valid choices.** "Let it keep burning" is care expressed as continuity. "Let it rest when I'm done" is care expressed as closure. Neither is surrender. The arc is designed so both feel earned — not like one is the "good" answer and one is the "realistic" answer. Brynn accepts both with the same weight.

**"Still the same light?" as the retroactive payoff.** If the player reads §XXXI before §XXXV fires (which is possible — S54 fires at CI, §XXXV fires at IN), the exchange is mysterious and beautiful. If they read §XXXV first, the S54 exchange is the confirmation: Yael knew all along. Either order works. The design principle is that neither scene requires the other to function; they are better together but complete separately.

**Layer 70 placement.** This arc is designed to be implementable at any point after the NPC_DIALOGUES system and IN node exist in their current form. No dependencies on Layers 44–69 except: §XXV (farewell) and §XXVII (Town Crier) must be implemented first, or implemented simultaneously. In practice: implement Layers 62 and 60 first (§XXVII, §XXV), then Layer 70.

---

*§XXXV status: ✅ Implemented — First Inn lamp ambient line specified; Beat 1 inquiry (fav_brynn ≥ 1, Act II+) designed with follow-up; Beat 2 choice (fav_brynn ≥ 2) designed with two branches; §XXV farewell four-branch table; §XXXI retroactive cross-ref (no patch needed); §XXVII TC_BRYNN_LAMP line; BRYNN_KEEPER_STORY const written; three new flags (brynnKeeperStoryTold, brynnLightChoiceMade, brynnLightKept); no new nodes/monsters/items/lab report.*

---

## Section XXXVI — The Epilogue Integration Layer: Arcs to Scroll (Layer 71, ✅ Implemented)

### XXXVI-A. Concept

`_buildEpilogueScroll()` (HTML ~line 11028) builds the "What happened after." victory scroll from `NPC_EPILOGUES` (six NPCs × fav tiers) and `FROBERGER_EPILOGUE` (covenant/imperfect/efficient variants). It has no awareness of any arc designed in §XXVII–§XXXV. This section specifies a new const `ARC_EPILOGUE_CONDITIONS` and a patch to `_buildEpilogueScroll()` that adds conditional epilogue lines for each completed arc — pushed after the `FROBERGER_EPILOGUE` line, before the `return`.

These lines are ADDITIVE — they appear alongside the existing NPC tier lines, not in place of them. Each adds information the NPC tier system doesn't carry: the specific mechanism by which a story resolved, the object or scene that made it real.

No new state flags. No lab report. One new const and one function patch.

---

### XXXVI-B. The `ARC_EPILOGUE_CONDITIONS` Const

```js
const ARC_EPILOGUE_CONDITIONS = [

  // §XXIX — Pit Championship
  { cond: () => !!(S_story.defeatedBattles?.['CF']),
    line: "Ogundimu offered his hand after. You shook it. He's still undefeated in his mind — he says you were the floor, not the ceiling." },

  // §XXX — Entry 41 Echo (both)
  { cond: () => S_story.s49BrynnDelivered && S_story.s49SweelinckDelivered,
    line: "Both of them have Entry 41. They haven't compared notes. They don't need to." },

  // §XXX — Entry 41 Echo (Sweelinck only)
  { cond: () => S_story.s49SweelinckDelivered && !S_story.s49BrynnDelivered,
    line: "Sweelinck has the journal. He keeps it at the right height on the shelf. You know which one." },

  // §XXX — Entry 41 Echo (Brynn only)
  { cond: () => S_story.s49BrynnDelivered && !S_story.s49SweelinckDelivered,
    line: "Brynn read Entry 41 twice, quietly, and set it down. She hasn't mentioned it since. She hasn't needed to." },

  // §XXXI — Joint Witness (S54)
  { cond: () => S_story.s54JointMomentDelivered,
    line: "Brynn and Yael stood in the same light at the same time. They both looked at you. The light held." },

  // §XXXII — Varga Watch (S8)
  { cond: () => S_story.s8PachelbelTold,
    line: "Pachelbel recognized the forwarding route without being told what it was. She hasn't mentioned Varga by name since. She doesn't need to." },

  // §XXXII — Auros Theory (S29)
  { cond: () => S_story.s29LineDelivered,
    line: "Auros had the complete picture. The structural survey and the tactical theory were filed together. That's new." },

  // §XXXIII — Archive Letter
  { cond: () => S_story.archiveLetterObtained,
    line: "The archive letter is in Weimar. The footnote that said 'no restriction required' is on record. It's no longer the last word." },

  // §XXXIII — Survey to Auros
  { cond: () => S_story.surveyDeliveredToAuros,
    line: "Auros has the Year Ten pressure data. The sectors match her Year Twelve projections. She's drafting a unified report." },

  // §XXXIV — Couperin Ledger (arc complete + debt resolved)
  { cond: () => S_story.quillQuestComplete && S_story.couperiDebtDegraded,
    line: "Quill plays the family theme on request. He calls it 'the one that came back.' The lute is still in tune." },

  // §XXXIV — Couperin Ledger (arc complete, debt not yet resolved)
  { cond: () => S_story.quillQuestComplete && !S_story.couperiDebtDegraded,
    line: "Quill has the lute. He knows what a number means. He hasn't found the words for the last part yet." },

  // §XXXV — First Inn Light (choice: keep)
  { cond: () => S_story.brynnLightChoiceMade && S_story.brynnLightKept,
    line: "The lamp at the First Inn is still burning. Brynn checked it this morning." },

  // §XXXV — First Inn Light (choice: rest)
  { cond: () => S_story.brynnLightChoiceMade && !S_story.brynnLightKept,
    line: "The lamp at the First Inn burned down quietly. Brynn says it did its work. She's right." },

  // §XXXV — First Inn Light (story told, choice never offered)
  { cond: () => S_story.brynnKeeperStoryTold && !S_story.brynnLightChoiceMade,
    line: "Brynn never asked what you wanted for the lamp. She kept tending it. It's still burning." },

];
```

**Implementation note for §XXIX:** The Pit Championship fight at CF (Crossroads Forge) should set `defeatedBattles['CF']` via the existing `defeatedBattles` write pattern. If a dedicated `pitChampionDefeated` flag is introduced in §XXIX's implementation instead, update the condition above to use it.

---

### XXXVI-C. `_buildEpilogueScroll()` Patch

After the existing `FROBERGER_EPILOGUE` push and before `return lines`, add:

```js
  // Arc epilogue additions (§XXXVI — Layers 62–70)
  ARC_EPILOGUE_CONDITIONS.forEach(({ cond, line }) => {
    if (cond()) lines.push(line);
  });
```

That's the entire patch: four lines. The const does the work.

---

### XXXVI-D. Interaction with Existing `NPC_EPILOGUES` Lines

The arc epilogues are ADDITIVE — they do not replace or override the NPC tier entries. Both can appear for the same NPC in the same scroll. Expected combinations:

| NPC_EPILOGUES line (existing) | ARC_EPILOGUE_CONDITIONS line (new) |
|---|---|
| *"Quill settled the debt. He's playing without counting the reach now."* (fav 2) | *"Quill plays the family theme on request. The lute is still in tune."* (§XXXIV) |
| *"Brynn's daughter came home for two weeks."* (fav 2) | *"The lamp at the First Inn is still burning."* (§XXXV) |
| *"Auros completed the structural survey."* (fav 2) | *"The structural survey and the tactical theory were filed together."* (§XXXII) |
| *"Pachelbel sent coin to Raison's family."* (fav 2) | *"Pachelbel recognized the forwarding route."* (§XXXII) |

The fav line describes the NPC's personal arc. The arc epilogue line describes the specific mechanism or object that made it concrete. Together they are more complete than either alone.

---

### XXXVI-E. Scroll Ordering

The full scroll after §XXXVI's patch fires in this order:

1. NPC_EPILOGUES entries (6 NPCs, one line each, fav-gated)
2. EB contracts line (if ebReturns ≥ 10)
3. FROBERGER_EPILOGUE line (one, mission/curse-gated)
4. **ARC_EPILOGUE_CONDITIONS lines** (0–14, flag-gated) ← new
5. End of scroll

A very thorough player who completes every arc will see up to 8 lines from ARC_EPILOGUE_CONDITIONS in addition to the 6 NPC lines and the Froberger line: a scroll of up to 15 entries. A player who did nothing beyond the main quest sees only the 6 base NPC lines + 1 Froberger line.

---

### XXXVI-F. State Flags

No new flags. All conditions reference flags already defined in existing or PLANNED _S_DEFAULTS() entries:
`defeatedBattles`, `s49BrynnDelivered`, `s49SweelinckDelivered`, `s54JointMomentDelivered`, `s8PachelbelTold`, `s29LineDelivered`, `archiveLetterObtained`, `surveyDeliveredToAuros`, `quillQuestComplete`, `couperiDebtDegraded`, `brynnKeeperStoryTold`, `brynnLightChoiceMade`, `brynnLightKept`.

---

### XXXVI-G. Documentation Updates

| File | Update |
|---|---|
| `story.md` | Add §XXXVI stub: scroll extension concept, list of 14 arc conditions with their trigger flags |
| `world.md` | No update needed — arc epilogues are output, not world state |
| `plan.md` | §V-A item 27; §XI-A row; update §0 dashboard Tier 1 table |

No lab report. No new nodes, monsters, flags, or items. One new const + four lines added to one function.

---

### XXXVI-H. Design Notes

**The scroll earns its length.** The base six NPC lines are always there. The 14 arc conditions are additive — each requires real engagement. A player who found the lamp story, retrieved the lute, watched the joint witness scene, and delivered the journal will see a scroll that reflects all of it. A player who didn't will see a shorter scroll that still closes cleanly. The scroll length is a mirror, not a score.

**The arc epilogue lines are specific.** "The lute is still in tune." "Pachelbel recognized the forwarding route." "The lamp is still burning. Brynn checked it this morning." Each is concrete — an object, an act, a moment. Not summaries. Not evaluations. The player already knows what they did; the epilogue confirms that the world registered it.

**The §XXIX check.** The Pit Championship flag condition (`defeatedBattles?.['CF']`) is written with optional chaining to avoid errors if the battle was never started. On implementation, verify the actual key used when `PIT_CHAMPION_OGUNDIMU` fight completes.

**Layer 71 placement.** `_buildEpilogueScroll()` must be patched after all arc system flags are defined in `_S_DEFAULTS()`. In practice: implement after all Tier 1 arcs are coded. The patch itself is trivial; the const can be defined as a stub earlier and lines added incrementally as arcs are implemented.

---

*§XXXVI status: ✅ Implemented — ARC_EPILOGUE_CONDITIONS const written (14 conditions × §XXIX–§XXXV); _buildEpilogueScroll() patch specified (4 lines); scroll ordering documented; interaction with NPC_EPILOGUES documented; no new flags; no lab report; §XI-A row + §V-A item 27 pending.*

---

## Section XXXVII — The Final Confrontation: Commander Bruhns's CO Scene (Layer 72, ✅ Implemented)

### XXXVII-A. Concept

Commander Seraphine Bruhns (`BOSS_COMMANDER_AUROS`, Layer 28, AC 22 HP 300) is the final boss. She is the same character the player has been working with as "Auros" at CY throughout the game — the `key:'auros'` NPC in `BIRKA_NPC_PROFILES`, `fav_bruhns` in `NPC_DIALOGUES`. At CO, after Entry 41 fires read-aloud (setting `frobergerLastEntryRead`), the only current content is a single fixed arrival quote: *"The cordon holds. We have maybe one hour before the Void breaks through completely. Forge the Codex. I will handle whatever comes over the wall."* — then the battle chip.

This section designs the fav-gated scene that fires **between Entry 41 delivery and the fight** — giving the player who built a relationship with Bruhns a fuller picture of what she's been doing, and why the fight is still necessary.

No new flags. No new nodes. One new const. One render patch at CO.

---

### XXXVII-B. Character: Auros = Bruhns

Throughout the game: "Auros" (informal, CY) = Commander Seraphine Bruhns (formal, CO). The fav system uses key `'bruhns'`; `BIRKA_NPC_PROFILES` uses key `'auros'`. Both refer to the same person.

Her story, assembled from `NPC_EPILOGUES` and existing dialogue:
- She has been running depth surveys in the undercity for years (Layer 28+)
- She holds a military cordon at the CO spire — officially "to contain the Void threat"
- She has been suppressing her own structural survey through official channels (NPC_EPILOGUES fav 0: *"Auros submitted another report. It was reclassified."*)
- At fav 2+: the survey reaches a different channel; at fav 3+: filed jointly with a Scholar King archivist, city planning acts on it
- `FROBERGER_TRACES.bruhns`: Froberger spent three hours with her depth survey, then told her "The rate of change is accelerating. You have maybe two years before the first surface event." — she's been working against that deadline ever since
- The `s6JointDelivered` scene shows her and Weckmann as trusted colleagues
- The final battle exists because: whoever holds the Codex Cradle controls Birka's fate. The Ivory Circle (who classified her reports) want the Codex sealed. Bruhns holds the cordon because if she yields command voluntarily, the Circle replaces her with someone who won't let anyone reach it. The only way she can hand over the Codex legitimately — within Circle rules — is if she's defeated in direct engagement. She cannot lose on purpose; she can only be beaten.

This is the story the fav 2 scene tells directly.

---

### XXXVII-C. The CO Scene Sequence

**Full CO sequence with §XXXVII patch:**

1. Player arrives at CO (level ≥ 20, shards = 7)
2. Entry 41 fires read-aloud via `storyCheckJournal()` — sets `frobergerLastEntryRead = true`
3. `NODE_ARRIVAL_QUOTES.CO` fires: *"The cordon holds. We have maybe one hour..."* (existing, unchanged)
4. **[NEW §XXXVII] Fav-gated scene fires** if `fav_bruhns >= 1` — see §XXXVII-D
5. Player sees CO node options including battle chip: *"⚔ THE FINAL BATTLE — Commander Bruhns"*
6. Fight: `BOSS_COMMANDER_AUROS` (AC 22, HP 300, ATK +12, 3d8+6)
7. Victory: `storyCheckVictory()` → ending sequence (§XXXVI epilogue)

Step 4 fires once per visit to CO while `!S_story.defeatedBattles['CO']`. Use flag `bruhnsCoSceneDelivered` to prevent repeat — BUT this fires only at CO and only when the pre-fight conditions are met, so it will only naturally trigger once anyway. No new flag strictly required; implement as a one-time `setTimeout` with a session check.

---

### XXXVII-D. Fav-Gated Scene Content

**fav 0 (no scene):** Only the existing arrival quote fires. Cold, professional, unknown.

**fav 1 — Friendly (new content):**

> *"You got this far. Froberger made it this far too, more than once."*
>
> *A pause. The cordon behind her is steady.*
>
> *"He didn't finish. I need you to finish. So does the city."*

Sets no flag. One-time atmospheric addition that acknowledges prior acquaintance without revealing her full hand.

**fav 2 — Dear Friend (new content):**

```
BRUHNS_CO_SCENE.dearFriend:

"You know what I've been doing here."

It isn't a question. She looks at the Codex Cradle, then at you.

"The Circle classified every report I submitted for eleven years. I've been 
buying time the only way the Circle's rules allow — holding command. As long 
as I hold this platform, no Circle delegate can lock that Cradle without going 
through me. And they won't move against a standing Commander without cause."

She meets your eyes.

"You beating me is cause. Documented, witnessed, legitimate. After that, I 
don't hold command and I don't hold the Codex. You do. And the Circle can't 
classify that — you'd be the one who opened it."

A beat.

"I'm going to do everything I can to stop you. That's not negotiable. The 
Circle is watching and I need this to look like I meant it."

She doesn't wait for a response.
```

**fav 2 + `s29LineDelivered` — additional line (appended to above):**

```
BRUHNS_CO_SCENE.dearFriendWithTheory:

"You understood the tactical model. That mattered — it meant you understood 
what the cost of getting this wrong would be. Anyone who understood that and 
still came here — I can trust them to open it."
```

---

### XXXVII-E. `BRUHNS_CO_SCENE` Const

```js
const BRUHNS_CO_SCENE = {
  friendly: `"You got this far. Froberger made it this far too, more than once."\n\nA pause. The cordon behind her is steady.\n\n"He didn't finish. I need you to finish. So does the city."`,

  dearFriend: `"You know what I've been doing here."\n\nIt isn't a question. She looks at the Codex Cradle, then at you.\n\n"The Circle classified every report I submitted for eleven years. I've been buying time the only way the Circle's rules allow — holding command. As long as I hold this platform, no Circle delegate can lock that Cradle without going through me. And they won't move against a standing Commander without cause."\n\nShe meets your eyes.\n\n"You beating me is cause. Documented, witnessed, legitimate. After that, I don't hold command and I don't hold the Codex. You do. And the Circle can't classify that — you'd be the one who opened it."\n\nA beat.\n\n"I'm going to do everything I can to stop you. That's not negotiable. The Circle is watching and I need this to look like I meant it."\n\nShe doesn't wait for a response.`,

  dearFriendWithTheory: `"You understood the tactical model. That meant you understood what getting this wrong would cost. Anyone who understood that and still came here — I can trust them to open it."`
};
```

---

### XXXVII-F. Implementation Spec

**XXXVII-F-1.** In the CO node render path (where `NODE_ARRIVAL_QUOTES` fires), add after the existing quote:

```js
// §XXXVII: Bruhns CO fav-gated scene
if (!S_story.defeatedBattles['CO'] && !S_story.bruhnsCoSceneDelivered) {
  const fav = _npcFavor('bruhns');
  let sceneText = null;
  if (fav >= 2) {
    sceneText = BRUHNS_CO_SCENE.dearFriend;
    if (S_story.s29LineDelivered) sceneText += '\n\n' + BRUHNS_CO_SCENE.dearFriendWithTheory;
  } else if (fav >= 1) {
    sceneText = BRUHNS_CO_SCENE.friendly;
  }
  if (sceneText) {
    S_story.bruhnsCoSceneDelivered = true;
    setTimeout(() => storyMsg(sceneText), 600);
  }
}
```

**XXXVII-F-2.** Add `bruhnsCoSceneDelivered: false` to `_S_DEFAULTS()`.

**XXXVII-F-3.** No changes to `storyPreFinalBattle()`, `BOSS_COMMANDER_AUROS`, or the battle system. The fight is unchanged; only the pre-fight narration is new.

**XXXVII-F-4.** Victory flavor text (line 4273) is unchanged: *"Commander Bruhns lowers her sword and looks at you the way people look at history."* — this lands differently at fav 2 because the player now understands why she lowered it.

---

### XXXVII-G. State Flags

| Flag | Default | NG+-preserved? | Note |
|---|---|---|---|
| `bruhnsCoSceneDelivered` | `false` | No (reset) | One-time CO fav-gated scene fired |

One new flag. Must be added to `_S_DEFAULTS()`.

---

### XXXVII-H. NPC Key Clarification (Implementation Note)

The fav system uses two keys for Bruhns: `'bruhns'` (NPC_DIALOGUES, NPC_EPILOGUES, `_npcFavor('bruhns')`) and `'auros'` (BIRKA_NPC_PROFILES, `key:'auros'`). Both refer to Commander Seraphine Bruhns. On implementation: use `_npcFavor('bruhns')` for all fav checks in §XXXVII (consistent with the NPC_DIALOGUES system).

**Also note (§XXXIII implementation correction):** The undercity survey delivery is already implemented in HTML as `undercitySurveyDelivered` (line ~12460). The §XXXIII design used flag name `surveyDeliveredToAuros` — on implementation, use `undercitySurveyDelivered` instead (it already exists and tracks the same state).

---

### XXXVII-I. Documentation Updates

| File | Update |
|---|---|
| `story.md` | Add §XXXVII stub: CO scene sequence, fav 1/2 text, s29 branch, const name |
| `world.md` | Expand Bruhns entry: Circle/Codex motivation, "you beating me is cause" design, same-character note |
| `plan.md` | §V-A item 28; §XI-A row; §0 Tier 1 table row 72 |

No lab report. No new nodes. No new monsters. No new items. One new flag.

---

### XXXVII-J. Design Notes

**"I need this to look like I meant it."** Bruhns has been managing a corrupt system's rules to do the right thing. The fight is not betrayal — it's the mechanism by which the right thing becomes possible. She tells you this at Dear Friend because you've earned the right to understand what you're fighting for, not just that you're fighting.

**Victory flavor lands differently at fav 2.** "Commander Bruhns lowers her sword and looks at you the way people look at history." At fav 0, this is simply the moment of defeat. At fav 2, the player knows: she was waiting to be beaten. She lowered it not in defeat but in transfer. The look is relief, not resignation.

**The `s29LineDelivered` addendum.** The S29 scene at CY (§XXXII) delivers Bruhns's tactical theory: the connection between Froberger's final route and the Void advance. At CO, if this theory was shared, she adds one line: understanding the cost is what makes someone trustworthy with the opening. The theory was not just information — it was a test.

**fav 0 is not a failure.** The player who never built a relationship with Bruhns still wins. The game doesn't require the fav 2 scene to complete. The epilogue at fav 0 reads: *"Auros submitted another report. It was reclassified."* — without the relationship, the Circle wins the bureaucratic battle. The player saved the world; the institutional damage continues. Both endings are true.

**The `bruhnsCoSceneDelivered` flag.** Added to `_S_DEFAULTS()` as a guard against the scene firing twice if the player somehow re-enters CO. In practice, `defeatedBattles['CO']` would be set on victory and the early-return in `storyCheckVictory()` would prevent the node from rendering normally — but the flag is cheap insurance.

---

*§XXXVII status: ✅ Implemented — CO fav-gated scene designed (fav 1 brief; fav 2 full Circle/Codex motivation reveal; fav 2 + s29 addendum); BRUHNS_CO_SCENE const written; implementation spec (one render patch + one _S_DEFAULTS() flag); Auros = Bruhns same-character clarification; §XXXIII flag correction noted (surveyDeliveredToAuros → undercitySurveyDelivered); no new nodes/monsters/items; no lab report.*

---

## Section XXXVIII — The Heartwood Letter: Brynn's Daughter Scene (Layer 73, ✅ Implemented)

### XXXVIII-A. Concept

Froberger's Journal Entry 7 (fires read-aloud at IN) describes Brynn's daughter learning to write — she pressed hard, she wrote "expedition" back larger than Froberger wrote it, because she hadn't learned yet that soft marks still count. Reading Entry 7 sets `brynnsJournalRead = true`, which eventually triggers the world progression event `brynn_letter` (Act III+): *"A letter arrived for Brynn at the inn. The seal is from the Heartwood district."*

Currently: the progression event fires and the journal note appears. Then nothing. Brynn doesn't react. The letter has no content.

§XXXVIII designs the scene that fires when the player next visits IN after `brynn_letter` has triggered — Brynn mentions the letter, and at fav 2 (Dear Friend) reads a line from it aloud. The letter is from her daughter, now living in the Heartwood district, apprenticed to a surveyor. She signed it *"expedition."*

Froberger wrote one journal entry about one child pressing hard on borrowed paper. It became her word. That is the arc.

One new flag (`brynnLetterSceneDelivered`). No new nodes. No new combat. No lab report.

---

### XXXVIII-B. The Letter's Content (Not Read Aloud to the Player)

The full letter is not shown to the player. Brynn holds it. The player sees only what Brynn shares. The letter's contents — summarized here for implementation — are:

> The daughter has found work as a surveyor's apprentice in the Heartwood district. She is learning to measure things she cannot touch — property lines, sight-lines, the depth of wells by the sound of dropped stone. She is good at it. The surveyor says she has patience for the work. She says she doesn't know if it's patience or stubbornness. She signed the letter with one word: *expedition.*

The player does not read this. Brynn reads it. The player sees Brynn read it.

---

### XXXVIII-C. Scene Trigger

**Trigger:** IN node visit, `brynnsJournalRead`, `actNumber >= 3`, `!brynnLetterSceneDelivered`.

The progression event `brynn_letter` fires independently of this scene (it's already implemented). §XXXVIII's scene fires on the next IN visit AFTER the progression event would have triggered. In practice: if the player is at IN when they read Entry 7 and they're already Act III+, the scene fires on the very next IN visit. If they haven't yet reached Act III, the scene waits.

**One-time.** Sets `brynnLetterSceneDelivered = true` on delivery.

---

### XXXVIII-D. Scene Content

**fav 0–0 (Impartial — no scene):** The progression event fired, the journal note appeared. That's all Brynn shares with a stranger.

**fav 1 (Friendly):** Brynn mentions the letter without being asked. Matter-of-fact.

```
BRYNN_HEARTWOOD_SCENE.friendly:

"She wrote. First letter in three months."

She slides it off the counter, folds it back into the envelope.

"She's working with a surveyor in the Heartwood district. Measuring things.
She says she's good at it." A pause. "She wrote 'expedition' in the letter.
She said she learned that word from a traveler who stayed here years ago."

She puts the envelope away. "The good room's still yours."
```

**fav 2 (Dear Friend):** Brynn reads a line from the letter aloud.

```
BRYNN_HEARTWOOD_SCENE.dearFriend:

"She wrote."

She sets the letter on the counter between you, then picks it back up.

"She's with a surveyor in the Heartwood district. Learning to measure
property lines, well depth — things you can't see the end of. She says
she has patience for it."

She reads the last line aloud:

"'I don't know if it's patience or stubbornness. I signed this
expedition because I couldn't decide.'"

Brynn folds the letter. Her daughter pressed hard when she wrote it — the
impressions are visible through the back of the envelope.

"She found a word for what she's doing."

She doesn't say anything else for a moment. Then: "The good room has a
window that faces east."
```

*"The good room has a window that faces east."* — this is Brynn's neutral greeting from the lab report. She says it now in a different register. The same words. The same lamp in the corner. A different weight.

---

### XXXVIII-E. `BRYNN_HEARTWOOD_SCENE` Const

```js
const BRYNN_HEARTWOOD_SCENE = {
  friendly:
    `"She wrote. First letter in three months."\n\nShe slides it off the counter, folds it back into the envelope.\n\n"She's working with a surveyor in the Heartwood district. Measuring things. She says she's good at it." A pause. "She wrote 'expedition' in the letter. She said she learned that word from a traveler who stayed here years ago."\n\nShe puts the envelope away. "The good room's still yours."`,

  dearFriend:
    `"She wrote."\n\nShe sets the letter on the counter between you, then picks it back up.\n\n"She's with a surveyor in the Heartwood district. Learning to measure property lines, well depth — things you can't see the end of. She says she has patience for it."\n\nShe reads the last line aloud:\n\n"'I don't know if it's patience or stubbornness. I signed this expedition because I couldn't decide.'"\n\nBrynn folds the letter. Her daughter pressed hard when she wrote it — the impressions are visible through the back of the envelope.\n\n"She found a word for what she's doing."\n\nShe doesn't say anything else for a moment. Then: "The good room has a window that faces east."`
};
```

---

### XXXVIII-F. Cross-References

**Entry 7 (HTML ~line 10335):** *"She wrote expedition back, larger than I wrote it, because she was still pressing hard."* — §XXXVIII delivers the resolution: she kept the word, found a life for it, pressed hard on the letter.

**§XXXV (First Inn Light):** The lamp is still burning; the daughter has moved on. The light stays; the people go. Both things are true simultaneously.

**§XXXVII (Bruhns CO scene — epilogue `brynn` NPC_EPILOGUES fav 2/3):** *"Brynn's daughter came home for two weeks."* (fav 2) — the homecoming in the epilogue is not the first contact; the letter (§XXXVIII) is. The daughter comes home later. §XXXVIII plants the relationship that makes the homecoming legible.

**Froberger's Last Note (HTML ~line 4258):** *"The person you're becoming is visible from outside. People can see the shape of it before you can."* Froberger saw the daughter becoming a surveyor. He wrote it as "pressing hard on paper." He didn't know that's what he saw. She figured out what to call it herself.

**§XXXVI (ARC_EPILOGUE_CONDITIONS):** One additional condition can be added to `ARC_EPILOGUE_CONDITIONS` in §XXXVI's implementation:
```js
{ cond: () => S_story.brynnLetterSceneDelivered,
  line: "Brynn's daughter wrote 'expedition' at the bottom of the letter. She's measuring property lines in the Heartwood district. She's good at it." }
```
This supplements `NPC_EPILOGUES.brynn` without replacing it. Add during §XXXVI implementation.

---

### XXXVIII-G. Implementation Spec

**XXXVIII-G-1.** Add `brynnLetterSceneDelivered: false` to `_S_DEFAULTS()`.

**XXXVIII-G-2.** In the IN node render path, after the standard NPC render, add:

```js
// §XXXVIII: Brynn heartwood letter scene
if (S_story.brynnsJournalRead
    && (S_story.actNumber || 1) >= 3
    && !S_story.brynnLetterSceneDelivered) {
  const fav = _npcFavor('brynn');
  let sceneText = null;
  if (fav >= 2) sceneText = BRYNN_HEARTWOOD_SCENE.dearFriend;
  else if (fav >= 1) sceneText = BRYNN_HEARTWOOD_SCENE.friendly;
  if (sceneText) {
    S_story.brynnLetterSceneDelivered = true;
    setTimeout(() => storyMsg(sceneText), 500);
  }
}
```

**XXXVIII-G-3.** No changes to the `brynn_letter` progression event (already implemented). No changes to Entry 7 (already implemented). No changes to `brynnsJournalRead` derivation.

**XXXVIII-G-4.** Optional §XXXVI patch: add `brynnLetterSceneDelivered` epilogue condition (see §XXXVIII-F).

---

### XXXVIII-H. State Flags

| Flag | Default | NG+-preserved? | Note |
|---|---|---|---|
| `brynnLetterSceneDelivered` | `false` | No (reset) | One-time letter scene at IN |

One new flag. Add to `_S_DEFAULTS()` in the Brynn block.

---

### XXXVIII-I. Documentation Updates

| File | Update |
|---|---|
| `story.md` | Add §XXXVIII stub: brynn_letter progression event + scene design |
| `world.md` | Add to Brynn's section: letter from Heartwood, daughter arc, Entry 7 cross-ref |
| `plan.md` | §V-A item 29; §XI-A row; §0 Tier 1 row 73 |

No lab report. No new nodes. No new monsters. No new items.

---

### XXXVIII-J. Design Notes

**The word "expedition."** Froberger defined it for her: *going somewhere you haven't been before, on purpose.* She wrote it back larger. She couldn't have known she was writing her future. She signed the letter with it because she still couldn't decide between patience and stubbornness — and "expedition" held both.

**"Pressing hard."** Entry 7 says she wrote with a stub of charcoal, pressing hard, *"the way children do when they haven't learned to trust that soft marks still count."* The letter envelope has impressions visible through the back — she's still pressing hard. She hasn't learned. The design point is that she doesn't need to. She found work where pressing hard is correct: measuring property lines, well depth, the distance to things you can't see.

**The fav gate.** At fav 0, the player doesn't get this scene at all — Brynn doesn't share private correspondence with strangers. At fav 1, she shares the fact and the word. At fav 2, she reads a line aloud and doesn't explain what it means. The explanation would ruin it. She just lets the player sit in the room where Entry 7 happened.

**"The good room has a window that faces east."** The closing line of both the fav 2 scene and Brynn's neutral greeting in the lab report. Brynn says the same thing in the same room across the whole game. The room doesn't change. The light doesn't change. The daughter is different. Brynn is different. The line is the same.

---

*§XXXVIII status: ✅ Implemented — brynn_letter progression event hook designed; BRYNN_HEARTWOOD_SCENE const written (fav 1 brief + fav 2 letter-read); IN render patch specified; Entry 7 and Froberger's Last Note cross-refs; §XXXVI epilogue condition addendum specified; §XXXV First Inn Light cross-ref; NPC_EPILOGUES fav 2/3 homecoming seeded; one new flag (brynnLetterSceneDelivered); no new nodes/monsters/items/lab report.*

---

## Section XXXIX — Yael's Record: The Named Report Scene (Layer 74, ✅ Implemented)

### XXXIX-A. Concept

The `yael_report` world progression event fires at Act V+ with `yaelEscortUsed`: *"City records show a new internal affairs submission. Source: anonymous. It wasn't anonymous."* This is Yael's first report — about the suppressed riot evidence — filed anonymously because she didn't want to become the story. `NPC_EPILOGUES.yael` fav 2 shows the outcome of a *second* report: *"Yael filed the second report under her own name. It was acted on."*

There is no designed scene between those two events. §XXXIX designs it: Yael tells the player she's filing again, under her name, and why. At fav 2 she reveals the full picture — the riot, the name, the suppressed evidence, the Weckmann connection — and asks if the player will hold a fourth copy.

The Weckmann thread: his NPC_EPILOGUES fav 2 reads *"The illegal operation didn't come back."* That illegal operation was the riot from three years ago — Yael investigated the funding; Weckmann tracked the fighters. Neither had enough alone. Together: the complete record. §XXXIX makes this connection explicit at fav 2, without either NPC needing to appear in the same scene.

One new flag. No new nodes. No new combat. No lab report.

**Note — §XXXVIII / S2 reconciliation:** The `brynn_letter` daughter scene is already partially implemented in HTML as S2 (`s2DaughterDelivered`, line ~12499), firing at Act IV+ with a `journalEntriesRead[7]` gate. §XXXVIII's implementation should patch the existing S2 block with fav-gating and the richer "expedition" callback, rather than adding a new block. Use `s2DaughterDelivered` (existing flag) instead of the new `brynnLetterSceneDelivered` designed in §XXXVIII.

---

### XXXIX-B. The Riot — What Yael Knows

Three years ago, a riot in the market district. Yael collected evidence: names, times, the transaction record that funded it. The evidence was pulled from the guard archive four weeks later — cleanly, by someone with access above her rank. She filed a report: anonymous, disappeared.

She has a name. She cannot prove it. The name connects to the Ivory Circle's information management at BA (S8, §XXXII) — the riot was funded to suppress a public record that would have put pressure on the Circle's operations in Birka. Yael doesn't know this. She knows the name; the Circle connection is visible only to a player who has assembled the full picture (S8 + S29 + §XXXIII archive letter + §XXXIX Yael scene).

Weckmann's illegal pit operation ran alongside the riot's funding network. Not connected to the Circle — Weckmann was running fights in the lower CY corridors, separate from the official pit. The riot's money moved through the same underground channels his operation used. He saw the transactions. He kept records because he always keeps records.

When the illegal operation was shut down, Weckmann's records survived because they were in the training log, not the financial ledger. The financial ledger disappeared. The training log was grandfathered as "documentation of athletic supervision." Bureaucratic luck. Weckmann knows this. He's been maintaining the training log with particular care ever since.

---

### XXXIX-C. Scene Trigger

**Trigger:** CI node, `_npcFavor('yael') >= 2`, `actNumber >= 6`, `yaelEscortUsed`, `!yaelNamedReportDelivered`.

Act VI is chosen because: the anonymous report fires at Act V. Yael needs one act's worth of watching to see whether the first report disappeared before she commits to filing under her name. At Act VI she's made her decision.

**One-time.** Sets `yaelNamedReportDelivered = true` on delivery.

---

### XXXIX-D. Scene Content

**fav 0–1 (no scene):** The anonymous report has been filed. That's everything Yael shares with someone she's still measuring.

**fav 2 (Dear Friend):**

```
YAEL_NAMED_REPORT_SCENE:

"You've been in the archive. You've seen what happens to records."

She isn't looking at you. She's watching the market corner from the 
CI door.

"Three years ago there was a riot in this district. I worked it for 
six weeks. Names, times, the transaction record that paid for it. Four 
weeks after I filed it, the evidence was gone — pulled from the guard 
archive. Someone with access above my rank took it cleanly."

She finally looks at you.

"I filed a report at the time. Anonymous. I didn't want to become the 
story. The report disappeared too."

A pause.

"I'm filing again. Under my name. I'm keeping three copies — one with 
the Commissioner, one with a Scholar Kings archivist in Weimar, one with 
Weckmann. He had records of the operation that funded the riot. His 
training log. The financial ledger is gone but the training log survived 
because no one thought to look there."

She turns back to the market.

"I'm telling you because you know what it means when something 
disappears from an archive. If you want to hold a fourth copy, I'll 
give you one. If not — you know it exists. That's also something."
```

**Player options:**

| Choice | Yael's response | Effect |
|---|---|---|
| `[I'll hold it.]` | *"Good. Then it's in four places now."* She nods once. That's the whole acknowledgment. | `yaelNamedReportDelivered = true` |
| `[Three copies is enough.]` | *"Three is enough. I just wanted someone outside the system to know."* | `yaelNamedReportDelivered = true` |

Both choices are complete. Neither is rewarded or penalized. Yael files the report regardless.

---

### XXXIX-E. `YAEL_NAMED_REPORT_SCENE` Const

```js
const YAEL_NAMED_REPORT_SCENE = {
  setup: `"You've been in the archive. You've seen what happens to records."\n\nShe isn't looking at you. She's watching the market corner from the CI door.\n\n"Three years ago there was a riot in this district. I worked it for six weeks. Names, times, the transaction record that paid for it. Four weeks after I filed it, the evidence was gone — pulled from the guard archive. Someone with access above my rank took it cleanly."\n\nShe finally looks at you.\n\n"I filed a report at the time. Anonymous. I didn't want to become the story. The report disappeared too."`,

  decision: `"I'm filing again. Under my name. I'm keeping three copies — one with the Commissioner, one with a Scholar Kings archivist in Weimar, one with Weckmann. He had records of the operation that funded the riot. His training log. The financial ledger is gone but the training log survived because no one thought to look there."\n\nShe turns back to the market.\n\n"I'm telling you because you know what it means when something disappears from an archive. If you want to hold a fourth copy, I'll give you one. If not — you know it exists. That's also something."`,

  choiceHold:  `"Good. Then it's in four places now."`,
  choiceThree: `"Three is enough. I just wanted someone outside the system to know."`
};
```

---

### XXXIX-F. Cross-References

**S8 / §XXXII (Varga Watch):** The riot was funded through the same channels the Ivory Circle used for information suppression at BA. Yael doesn't know this. The player who assembled the S8 picture can see the connection. No explicit statement; legible only to those who looked.

**§XXXIII (Archive Letter):** The `archive_letter` obtained from the Blue Shutters contains a Circle directive: *"Entry author appears unaware of the correlation. No restriction required."* — the Circle's preferred method is letting evidence go unnoticed. When it does get noticed (Yael, Froberger), they pull it cleanly. Yael's report is the same pattern from the ground floor.

**Weckmann / `WECKMANN_TRAINING_LOG`:** The training log already exists as a readable item at CY. Yael's scene retroactively explains why Weckmann maintains it so carefully — it's the only surviving record of the riot's funding network. The log is already there; §XXXIX gives it a second meaning without changing it.

**§XXXVI `ARC_EPILOGUE_CONDITIONS`:** Add on §XXXVI implementation:
```js
{ cond: () => S_story.yaelNamedReportDelivered,
  line: "Yael kept three copies of the second report. She knows exactly where each one is." }
```

**NPC_EPILOGUES.yael:** fav 2 (*"filed the second report under her own name. It was acted on."*) / fav 3 (*"The commissioner resigned. She went back to the corner."*) — these outcomes are the downstream result of §XXXIX's scene. §XXXIX plants; the epilogue delivers.

**§XXXI (S54 Joint Witness):** Yael and Brynn at CI — *"Still the same light?"* Brynn knew what Yael was doing. The lamp Brynn kept was also for this: a light that stays on while someone does something that could get them in trouble.

---

### XXXIX-G. Implementation Spec

**XXXIX-G-1.** Add `yaelNamedReportDelivered: false` to `_S_DEFAULTS()`.

**XXXIX-G-2.** In the CI node render path, after the standard NPC render:

```js
// §XXXIX: Yael named report scene
if (node.code === 'CI'
    && _npcFavor('yael') >= 2
    && (S_story.actNumber || 1) >= 6
    && S_story.yaelEscortUsed
    && !S_story.yaelNamedReportDelivered) {
  setTimeout(() => {
    storyMsg(YAEL_NAMED_REPORT_SCENE.setup + '\n\n' + YAEL_NAMED_REPORT_SCENE.decision);
    // Render choice buttons: [I'll hold it.] and [Three copies is enough.]
    // On selection: set yaelNamedReportDelivered = true, deliver response line
  }, 600);
}
```

Implementation note: the choice buttons follow the same pattern as other in-narrative choice renders (Beat 2 in §XXXV, Beat 2 in §XXXIV). If the existing pattern uses `storyChoice()` or inline button DOM, follow that pattern.

**XXXIX-G-3.** Add `yaelNamedReportDelivered` epilogue condition to `ARC_EPILOGUE_CONDITIONS` during §XXXVI implementation.

**XXXIX-G-4.** Add one new `YAEL_PATROL_NODES` entry:
```js
{ condition: () => S_story.yaelNamedReportDelivered,
  nodeSlug: 'SW',
  line: "The second report is filed. I'm not watching to see if it disappears." }
```
This patrol line fires at SW after the scene, acknowledging the decision without narrating it. No new flag needed — uses `yaelNamedReportDelivered`.

---

### XXXIX-H. State Flags

| Flag | Default | NG+-preserved? | Note |
|---|---|---|---|
| `yaelNamedReportDelivered` | `false` | No (reset) | Named report scene fired at CI |

One new flag. Add to `_S_DEFAULTS()` in the Yael block.

---

### XXXIX-I. Documentation Updates

| File | Update |
|---|---|
| `story.md` | Add §XXXIX stub: named report scene, Weckmann connection, patrol line addendum |
| `world.md` | Add to Yael's section: riot backstory, Weckmann training log link, three-copy strategy |
| `plan.md` | §V-A item 30; §XI-A row; §0 Tier 1 row 74 |

No lab report. No new nodes. No new monsters. No new items.

---

### XXXIX-J. Design Notes

**"Three copies is enough."** Both player choices close the scene cleanly. Choosing not to hold the copy isn't a failure or a missed opportunity — Yael's point is that someone outside the system knows it exists. The player knowing is already something. She explicitly says this: *"That's also something."*

**The Weckmann connection.** The training log at CY is already readable. Most players who find it see training notes about fighters. A player who has had §XXXIX's scene reads it and sees: this is also a record of a riot's funding network, kept accidentally, surviving by bureaucratic luck. The same text, two readings, depending on what the player knows.

**The Circle at the center, unnamed.** No character in §XXXIX names the Ivory Circle as the riot's organizer. Yael has a name, not a faction. The Circle connection is visible only to a player who has: S8 (Varga at BA, Circle informant), S29 (Auros's tactical theory connecting Froberger's route to Circle pressure), §XXXIII (archive letter, Circle directive to not restrict what's not noticed), and §XXXIX (the riot, the same suppression method). Four systems pointing at the same answer. No system states it.

**"She went back to the corner."** NPC_EPILOGUES yael fav 3 ends: *"The commissioner resigned. She went back to the corner."* After all of this — the testimony, the inquiry, the resignation — Yael goes back to her patrol route. That's the whole arc: she did the thing, and then she went back to work. The corner doesn't change. She does.

---

*§XXXIX status: ✅ Implemented — Yael named report scene designed (fav 2, Act VI+, CI); riot backstory established (three years ago, suppressed evidence, Weckmann training log connection); YAEL_NAMED_REPORT_SCENE const written; two-choice player options; §XXXIX YAEL_PATROL_NODES addendum; §XXXVI epilogue condition addendum; §XXXVIII/S2 reconciliation note; no new nodes/monsters/items/lab report; 1 new flag.*
