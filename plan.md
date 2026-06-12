<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
## I. Directive

> You are an expert prompt interpreter with an electrical engineering / computer science background. Follow the sections below: use the suggestions in II, III, IV to implement ideas from the list, or append new ideas to the end of the list when told about them. Work incrementally — present one step at a time and wait for "continue."

### API-First Development Policy

**Preferred workflow for any data addition or edit to `roll2hit-v3.html`:**

1. **Check API first** — before editing HTML, use `./api.sh` to confirm current state: `./api.sh ping`, `./api.sh list <type>`, `./api.sh audit`. Direct HTML edits are a fallback only when the API cannot yet express the operation.
2. **Write the API method first** — if the operation isn't yet supported, add the endpoint to `wbapi-server.js` and restart before touching the HTML.
3. **Create/modify via API, not HTML** — preferred: `./api.sh post <type> [k=v ...]` or `./api.sh put <type> <id> [k=v ...]`. The tool handles nonces automatically and queues all requests with retry.
4. **Restart server after adding endpoints** — `./wbapi-toggle.sh restart` (or `start` if stopped).
5. **When adding items to plan.md** — cross-reference current state with `./api.sh audit` and `./api.sh list <type>` to confirm what actually exists vs. what the plan assumes. Do not add a plan item without verifying the API-reported current state.

**CLI quick reference (`./api.sh`):**
```bash
./api.sh ping                              # health check
./api.sh get node LHR                      # fetch node + connections + _meta
./api.sh list quest --node LHR             # quests at a node
./api.sh list npc --node LHR               # NPCs at a node
./api.sh list monster --terrain city       # monsters by terrain
./api.sh put quest quest_wis_01 passText="..." # update field
./api.sh post quest id=q_foo npc=aldric type=side activateNode=CY title="..." # create
./api.sh del quest quest_old_01            # delete (nonce auto-handled)
./api.sh audit                             # full integrity scan
./api.sh chain quest_wis_01               # quest dependency chain
./api.sh export quest_db --out quests.json # dump collection to file
./api.sh location CY                       # composite node view
./api.sh --ai "how do I link two nodes?"  # ask Claude (ANTHROPIC_API_KEY)
```

**Goal state:** All large JS arrays in `roll2hit-v3.html` (`NODE_MAP`, `QUEST_DB`, `WORLD_DB`, `MONSTER_POOL`, `MONSTER_DROPS`, `FISH_POOL`, `LAKE_MAGIC_DB`, `CONDITION_ITEMS`, `EPIC_BOSS_POOL`, etc.) are exportable via the API. The HTML file is the single source of truth — it should be possible to run all game logic on Node/V8 by feeding API-extracted code sections, without a browser. See `§WBAPI-01` for the export roadmap.

`roll2hit-v3.html` is the single source of truth. The API reads its text directly and writes mutations back into it in-place. The entire game — all data, all logic, all UI — is fully playable in a browser with only `roll2hit-v3.html`: no Node, no `worldbuilder.html`, no server, no dependencies. The HTML is pure JavaScript running on the DOM. `wbapi-server.js` and `worldbuilder.html` are authoring tools that read and write the same file; they add nothing the game requires at runtime.

### Incremental Recitation Rule

While writing vignette content, speak short segments aloud via `say` as you produce them — every page or every couple of paragraphs. Read the element type first, then its text. Examples:

Run `say` blocking (no `&`) so each announcement completes before writing continues:

```bash
say "Source hook. King John the Second of France was captured at Poitiers in 1356." &
say "Scene, Act One. A narrow Damascus house, morning. The library is being catalogued for dissolution." &
say "Quest message. Carry the installment certificate from Périgueux to the Bordeaux English Registry." &
say "Pass text. The temporal independence of the two documents makes their agreement evidential." &
say "Fail text. The certificate and the entry match. That is necessary but not sufficient." &
say "Archive category. Confiscation Records — Property Inventories Compiled After Political Purges." &
```

Write to file incrementally — after each act, save and run the next `say` call. Do not write all five acts before speaking. After every full vignette, commit and speak the commit subject.

---

### Loop vs. Ask Rule

Before starting any task:

- **Loop tasks** (no user input needed — clear next step): begin immediately, state what you are doing in one sentence.
- **Ask tasks** (user decision required): present a yes/no or choice prompt. Then run:
  ```bash
  say "If you say yes: <one sentence describing the intention and outcome of yes>"
  ```
  Read the purpose of yes aloud before the user answers.

---

### Commit + Speak Rule

After every git commit, immediately run:

```bash
say "<commit subject line>"
```

Read the **subject line only** (first line of the commit message) aloud via macOS `say`. This confirms the commit completed and anchors the session.

---

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
| `NODE_MAP` | 121 nodes (base 76 + Paul arc 91–110 + Littoral Courts 111–120); all `N/E/S/W/sleep/battle/loot` fields |
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

> All 194 `S_story` fields from `_S_DEFAULTS()` (HTML line 8402). Updated 2026-05-26.

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
| `S_story.abilityScores` | object | `{str,dex,con,int,wis,cha}` — set by character creation (base `{10,10,10,8,8,8}` + point-buy); legacy-save fallback `{16,12,14,10,12,8}` |
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
| `S_story.actNumber` | number | Current act (1–8); set from `NODE_MAP[code].act` at top of `storyRender()`; defaults 1 |
| `S_story.currentCode` | string | Current node code |
| `S_story.s8VargaWatches` | number | Varga observation count (S8 mechanic, 0–3) |
| `S_story.archiveVisited` | boolean | Blue Shutters Archive entered |
| `S_story.s29LineDelivered` | boolean | Auros/Froberger theory line delivered |
| `S_story.s49BrynnDelivered` | boolean | Brynn Entry-41 reaction delivered |
| `S_story.raisonToolsUsed` | boolean | Raison's Tools assessment used |
| `S_story.log` | array | Navigation history — node codes pushed on each move, max 20; used by vignette delivery and farewell logic |
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
| `S_story.romanceQuotesDelivered` | array | Indices of ROMANCE_QUOTES already shown; prevents repeats |
| `S_story.npcRomanceVignetteDelivered` | object | npcKey → true; inn vignette fires once per NPC per run |
| `S_story.nexusQuestSeen` | boolean | Nexus quest intro line delivered |
| `S_story.nexusQ01Active` | boolean | Nexus quest 01 active |
| `S_story.nexusQ02Complete` | boolean | Nexus quest 02 complete |
| `S_story.creativeLiteracyToken` | boolean | Creative Literacy Token obtained |
| `S_story.fishingQuestFlags` | object | Fishing quest completion flags by fish key |
| `S_story.fishingBaitSatchel` | boolean | Bait Satchel item obtained |
| `S_story.fishingYugurtFavour` | boolean | Yugurt Lake favour earned |
| `S_story.fishingCatchLog` | array | Log of fish caught |
| `S_story.junctionsSeen` | object | nodeCode → true; junction arrival tracking |
| `S_story.companionActsSeen` | object | Companion act IDs that have fired |
| `S_story.shardNotes` | array[7] | boolean per shard; true when shard origin note read |
| `S_story.shardNotesAllRead` | boolean | All 7 shard origin notes read |
| `S_story.voidCrackFired` | boolean | Void crack event fired (Act VII warning) |
| `S_story.voidFracturesFired` | boolean | Void fractures event fired |
| `S_story.voidImminentWarned` | boolean | Void imminent warning shown |
| `S_story.void_mercy_count` | number | Times Void mercy mechanic has triggered |
| `S_story.act8FarewellYael` | boolean | Act VIII Yael farewell scene delivered |
| `S_story.act8FarewellBrynn` | boolean | Act VIII Brynn farewell scene delivered |
| `S_story.act8FarewellQuill` | boolean | Act VIII Quill farewell scene delivered |
| `S_story.act8FarewellPachelbel` | boolean | Act VIII Pachelbel farewell scene delivered |
| `S_story.act8FarewellCrov` | boolean | Act VIII Weckmann farewell scene delivered |
| `S_story.act8FarewellAuros` | boolean | Act VIII Bruhns farewell scene delivered |
| `S_story.frobergerMemorialVisited` | boolean | Froberger memorial node visited |
| `S_story.frobergerMemorialFlowers` | boolean | Flowers placed at memorial |
| `S_story.frobergerMemorialBookSigned` | boolean | Book of remembrance signed at memorial |
| `S_story._memorialPlayerEntry` | string\|null | Player's text entry in the memorial book |
| `S_story.pitChampionOffered` | boolean | Pit Champion bout offered to player |
| `S_story.pitChampionWon` | boolean | Pit Champion bout won |
| `S_story.s54QuillBrynnDelivered` | boolean | Quill+Brynn joint scene at S54 delivered |
| `S_story.s55SqMapLineDelivered` | boolean | SQ map reveal line at S55 delivered |
| `S_story.brynnKeeperStoryTold` | boolean | Brynn's keeper backstory revealed |
| `S_story.brynnLightChoiceMade` | boolean | Player made the light/dark choice in Brynn arc |
| `S_story.brynnLightKept` | boolean | true = light choice; false = dark choice |
| `S_story.bruhnsCoSceneDelivered` | boolean | Bruhns CO confrontation scene delivered |
| `S_story.yaelNamedReportDelivered` | boolean | Yael named report scene delivered |
| `S_story.catKills` | object | nodeCode → kill count; Cat Quarter arc tracking |
| `S_story.catKingDefeated` | boolean | Cat King boss defeated |
| `S_story.kenickieMarketUsed` | boolean | Kenickie's black market accessed |
| `S_story.questMinusOne` | boolean | Quest -1 (Level 21 / World Creator) seen |
| `S_story.entry42Written` | boolean | Player has written Entry 42 |
| `S_story.entry42Text` | string | Player's text for Entry 42 |
| `S_story.entry42Read` | boolean | Entry 42 read back after writing |
| `S_story.ngMemoryDelivered` | object | npcKey → true; NG+ memory line delivered per NPC |
| `S_story.nextFrobergerComplete` | boolean | NG+ Froberger arc complete |
| `S_story.frobergerLetterFound` | boolean | Froberger's sealed letter at CO found |
| `S_story.priorQuestMinusOne` | boolean | Quest -1 seen on a prior NG+ run |
| `S_story.wmLowerArchiveUnlocked` | boolean | Weimar lower archive unlocked |
| `S_story.wmDoc1Read` | boolean | Weimar archive Doc 1 read |
| `S_story.wmDoc2Read` | boolean | Weimar archive Doc 2 read |
| `S_story.wmDoc3Read` | boolean | Weimar archive Doc 3 read |
| `S_story.wmDoc3Unredacted` | boolean | Doc 3 unredacted (First Researcher name revealed) |
| `S_story.wmArchiveComplete` | boolean | Full archive sequence complete |
| `S_story.wmSessionsDays` | array | Days on which archive sessions occurred |
| `S_story.wmBenediktCircleComplete` | boolean | Benedikt reading circle sequence complete |
| `S_story.wmFirstResearcherKnown` | boolean | First Researcher identity known |
| `S_story.vaCI` | boolean | Void Archaeology mark found at CI |
| `S_story.vaSL` | boolean | Void Archaeology mark found at SL |
| `S_story.vaDF` | boolean | Void Archaeology mark found at DF |
| `S_story.vaWM` | boolean | Void Archaeology mark found at WM |
| `S_story.vaMT` | boolean | Void Archaeology mark found at MT |
| `S_story.vaAllMarksFound` | boolean | All 5 archaeology marks found |
| `S_story.vaLogFound` | boolean | Constructor's Log found in lower archive |
| `S_story.vaLastWardVisited` | boolean | Last ward (sealed tunnel) visited |
| `S_story.vaArchitectureKnown` | boolean | Full void architecture understood |
| `S_story.tlLedgerRead` | boolean | Tilbury Harbor ledger read |
| `S_story.tlEmbargoChallenged` | boolean | Emergency Trade Protocol 7 challenged |
| `S_story.tlEmbargoDismissed` | boolean | Embargo dismissed or resolved |
| `S_story.tlMissingShipSolved` | boolean | Missing ship investigation complete |
| `S_story.vsDebtProbed` | boolean | Visby debt structure investigated |
| `S_story.vsWeaponsFound` | boolean | Visby underground weapons cache found |
| `S_story.vsDebtSettled` | boolean | Visby debt arc resolved |
| `S_story.vsShamanKnown` | boolean | Void Shaman (the Warden) identified |
| `S_story.vshamanFound` | boolean | Warden located at MT |
| `S_story.vshamanDefeated` | boolean | Warden defeated in combat |
| `S_story.vsShamanPersuaded` | boolean | Warden persuaded (non-combat resolution) |
| `S_story.wardensLegacyKnown` | boolean | Warden's corrupted mandate understood |
| `S_story.vsShamanBenediktDelivered` | boolean | Warden truth delivered via Benedikt chain |
| `S_story.fav_corelli` | number | Corelli favorability (0–3) |
| `S_story.corelli_purchase_count` | number | Items purchased from Corelli |
| `S_story.corelli_encounter_count` | number | Times Corelli wandering merchant encountered |
| `S_story.corelliRevelationDelivered` | boolean | Corelli's final revelation delivered |
| `S_story.hour` | number | Time-of-day clock 0–23; +1 per battle, +6 per sleep |
| `S_story.careerStats` | object | Permanent career ledger (never reset): kills, deaths, dmgDealt, dmgReceived, sleeps, battlesAttempted, attacksAttempted, attacksHit, exitsTaken, daysAdventuring |
| `S_story.runStats` | object | Per-run ledger (reset on respawn): same 10 fields as careerStats |
| `S_story.tackleboxZoneUnlocks` | object | `{shore:true, reeds:false, deep:false}` — which fishing search zones are accessible; zone gating live (Layer 83) |
| `S_story.baitFishingActive` | boolean | Suppresses node re-render during bait catch sequence |
| `S_story.skillCheckAttempts` | object | `{ questId: { lastDay, failures } }` — retry gate for Ceremonia Roll quests; set on each failed retryable roll |
| `S_story.ceremoniaYaelAct` | number | Current act in Yael Ceremonia Arc (0 = not started, 1–5 = act N complete) |
| `S_story.ceremonia_yael_04_failed` | boolean | Act IV fail path — changes Yael's Act V vignetteText |
| `S_story.ceremonia_yael_complete` | boolean | Full Yael Ceremonia Arc complete; triggers Watch Token item |
| `S_story.cryptSurveyed` | boolean | `quest_crypt_survey` pass flag |
| `S_story.courierReleased` | boolean | `quest_courier_release` pass flag |
| `S_story.patrolBA` | boolean | Player visited CI while `quest_city_watch_patrol` active |
| `S_story.patrolIN` | boolean | Player visited IN after CI while `quest_city_watch_patrol` active |
| `S_story.patrolRouteComplete` | boolean | Full patrol route BA→IN→TA completed; triggers quest completion |

---

## V. Suggestions for Further Development

> FC01–FC08 all ✅ 2026-05-25/26. Full record in `lab-report-sp4-documentation-sync-pass.md`. Add new FC items here as §XLIII+ work is planned.

---

> §API-01 + §API-02 extracted to `lab-report-api-01-02-mechanics-combat-review.md` (2026-05-26).

---

## §FUTURE — Long-Range Ideas (not scheduled)

> Speculative world expansions. No implementation layer assigned. Record the concept and canonical source material while the idea is fresh.

---

## §WORLDBUILDER-01 — The World Builder Editor (📋 PLANNED)

**What it is:** A browser-based CRUD editor for the game's node architecture. The game world currently lives as a JavaScript object (`NODE_MAP`) with ~150 nodes, each having coordinates, exits, NPC, battle, loot, and sleep fields. Editing requires reading raw JS. The World Builder makes this visual and interactive.

**Why now:** The world has reached a scale where new arcs require cross-referencing 6–8 nodes at a time to check exit availability, coordinate positions, and verify that new nodes don't collide with existing ones. The grid is large enough that a visual overview is no longer optional — it is necessary for safe world expansion.

---

### §WORLDBUILDER-01-A. The Three Views

**1. Grid View (World Map)**  
A 2D rendered grid of all nodes at their `{r, c}` coordinates. Each cell shows the node code, label abbreviation, and act number (color-coded by act). Exits rendered as directional arrows between cells. Clicking a node enters Detail View.

- Zoom in/out (the full grid spans ~50 rows × 60 columns)
- Filter by act (show only act 1, act 2, etc.)
- Highlight: orphan nodes (no exits), terminal nodes (one exit), hub nodes (4 exits)
- Empty cells are potential insertion points — clicking an empty cell opens a "New Node" form with coordinates pre-filled

**2. Detail View (Node Inspector)**  
Full debug readout for a selected node:

```
Node: [code]  Label: [label]  Act: [n]  Num: [n]
Coordinates: r:[n] c:[n]
Exits: N:[code or null]  S:[code or null]  E:[code or null]  W:[code or null]

NPC: [name]  quoteFn: [3-state / inline / none]
Battle: [label]  key:[key]  count:[n]
Loot: [items list]
Sleep: [true/false]

Attached Quests: [list of quest IDs where activateNode === this code]
Attached storyRender blocks: [list of block IDs]
Flags set by quests here: [list]
Flags read by quests here: [list]
```

All fields are editable in place. Changes tracked in a "pending edits" diff panel before export.

**3. Edit Mode (Node Form)**  
Full form UI for creating or editing a node:

| Field | Input type | Notes |
|-------|-----------|-------|
| code | text (4 chars) | Uniqueness check against existing codes |
| num | number | Auto-increments from current max |
| name | text | Internal key name |
| label | text | Display label |
| act | 1–8 select | |
| r, c | number | Validated against grid collision |
| N/S/E/W exits | node selector (dropdown of all existing codes) | Bidirectional update option: "also update target node's reverse exit" |
| text | textarea | The node's prose description |
| npc | text | NPC name |
| battle.label | text | |
| battle.key | dropdown of MONSTER_POOL keys | |
| battle.count | number | |
| loot | text | |
| sleep | checkbox | |

---

### §WORLDBUILDER-01-B. Quest Cross-Reference Panel

For any selected node, show a panel listing all quests where `activateNode === nodeCode`:

```
Quests active at this node:
  quest_hunt_01    [side]      activateCond: always       — "Missing Boats"
  quest_hunt_02    [skill WIS] activateCond: huntHookReceived  — "Hull Marks"
  quest_wis_04     [skill INT] activateCond: wisHookReceived   — "The Stalemate Cost"
```

Clicking a quest ID opens a quest detail panel (links to the Quest Editor, §EDITOR-01).

---

### §WORLDBUILDER-01-C. Export Format

The editor does not modify the live HTML file directly. It outputs a **diff block** showing:

1. The modified NODE_MAP entry as a valid JS object literal
2. Any exit updates to adjacent nodes (bidirectional changes)
3. A checklist of manual steps required (e.g., "Add storyRender block at HL for new arc")

Export format is JS-object-literal (not JSON) because the `quoteFn` and `completeFn` fields are functions. The editor generates template functions with placeholder bodies:

```javascript
quoteFn: () => S_story.newFlag ? 'Post-quest dialogue.' : 'Pre-quest dialogue.',
```

The user pastes the diff into the game file. A future version could write directly to the file via a local server endpoint.

---

### §WORLDBUILDER-01-D. Implementation Notes

- Runs as a standalone HTML file (`worldbuilder.html`) that imports a JSON snapshot of NODE_MAP (auto-generated at build time, or pasted manually)
- No server required — purely client-side JS + Canvas or CSS grid
- State: the editor's working copy of NODE_MAP is stored in localStorage; export clears the diff queue
- Responsive to the game's coordinate system (r/c grid, not pixel positions)
- Node text field supports multi-line editing with live character count

---

## §EDITOR-01 — The Quest Creator / Generic Mission Maker (📋 PLANNED)

**What it is:** A form-based UI for creating, editing, and cross-referencing quest objects of any type (`side`, `skill_check`). Outputs valid JS quest object literals ready to paste into `QUEST_DB`. Eliminates the need to hand-write the boilerplate for each quest while preserving full flexibility.

**Why now:** Six quest templates are proven (`§SPARK`, `§HUNT`, `§PORT`, `§WHODUNIT`, `§ALCHEMY`, `§WISDOM`). Each template has a predictable field set. The quest boilerplate is repetitive to write and error-prone (flag name typos, unmatched braces, missing `activateCond`). A form editor with type-aware field display reduces the error surface and makes new arc creation accessible without reading existing quest code.

---

### §EDITOR-01-A. Quest Type Field Sets

The editor shows different fields depending on the selected quest type:

**All quest types:**
| Field | Input | Notes |
|-------|-------|-------|
| id | text | Uniqueness check against QUEST_DB keys |
| type | select: side / skill_check | Determines which additional fields appear |
| title | text | |
| desc | textarea | Fragment texts, Roen commentary, etc. |
| hint | text | Quest panel hint line |
| activateNode | node selector | Dropdown of all NODE_MAP codes |
| activateCond | flag selector + operator | e.g., `flagA && flagB`; builds the function |
| waypointNode | node selector | |
| reward | number | Gold reward on complete |
| disposition | text | The closing quote line |

**Additional for `skill_check`:**
| Field | Input | Notes |
|-------|-------|-------|
| checkStat | select: wis / int / cha / str / dex / con | |
| checkSkill | select: Insight / Investigation / Nature / Persuasion / Perception / Medicine / Animal Handling | |
| checkDC | number | |
| retryable | checkbox | |
| checkPassFlag | flag selector | Must exist in `_S_DEFAULTS` or can create new |
| onPass body | textarea (JS) | Function body; editor wraps in `onPass:() => { ... }` |
| onFail body | textarea (JS) | |
| xpAward | number | 0 if XP awarded inside onPass |

**Additional for `side`:**
| Field | Input | Notes |
|-------|-------|-------|
| completeItems | item name list | Items that must be in inventory to complete |
| completeFn body | textarea (JS) | Function body |
| onComplete body | textarea (JS) | Optional |

---

### §EDITOR-01-B. Flag Dependency Graph

Every quest reads flags (in `activateCond`, `completeFn`) and writes flags (in `onPass`, `onComplete`, `checkPassFlag`). The editor maintains a live dependency map:

```
quest_wis_03
  READS:  wisHookReceived (set by quest_wis_00)
          sbResolved (set by quest_sb_01 / quest_sb_02 / quest_sb_fight)
  WRITES: wisPage3_thumbscrew
  DOWNSTREAM: quest_wis_07 reads wisPage3_thumbscrew
```

The flag graph surfaces:
- Circular dependencies (quest A waits for flag set by quest B waits for quest A)
- Orphan flags (set but never read)
- Missing flags (read but not set by any quest)

---

### §EDITOR-01-C. storyRender Block Generator

For each quest, the editor can generate a skeleton `storyRender` block:

```javascript
// §[ARC-ID]: [NODE] — [quest title]
{ const _[id]Old = document.getElementById('[id]'); if (_[id]Old) _[id]Old.remove();
  if (node.code === '[activateNode]' && S_story.[activateCond]) {
    const _div = document.createElement('div');
    _div.id = '[id]'; _div.className = 'sweelinck-variant';
    _div.style.cssText = 'margin-top:10px;border-left-color:#[color];color:#[color];font-size:12px;';
    _div.textContent = '[desc text here]';
    // [button if needed]
    document.getElementById('story-text-box').insertAdjacentElement('afterend', _div);
  }
}
```

The generator fills in the known fields and leaves `[desc text here]` as a placeholder. The user writes the narrative prose in the editor's textarea and it gets embedded.

---

### §EDITOR-01-D. Token Item Manager

For arcs with token objects (§SPARK, §ALCHEMY, §WISDOM pattern), a visual chain editor:

```
Token chain:
  [Item Name] [icon] [sell] → Created by: [quest_id onPass / storyRender button]
                            → Destroyed by: [quest_id / storyRender button]
  + Add token
```

The manager generates the `inv.push(...)` and `inv.splice(...)` code for each transition and embeds it in the appropriate quest callback bodies.

---

### §EDITOR-01-E. Export Format

Output is a single JS object literal block ready to paste into `QUEST_DB`:

```javascript
  quest_XXXX: { id:'quest_XXXX', type:'skill_check',
    title:'...',
    desc:'...',
    hint:'...',
    activateNode:'XX', activateCond:() => !!(S_story.flagA && S_story.flagB),
    checkStat:'wis', checkSkill:'Insight', checkDC:13, retryable:false,
    checkPassFlag:'flagC',
    onPass:() => {
      S_story.flagC = true;
      S_story.xp = (S_story.xp||0) + 250;
      storyMsg('...');
    },
    onFail:() => { storyMsg('...'); },
    xpAward:0,
    disposition:'...' },
```

The output window shows the complete object, validates brace matching, and highlights any unfilled placeholder fields in red before allowing copy.

---

### §EDITOR-01-F. Template Presets

One-click presets that pre-fill the field set for each proven template:

| Preset | Pre-fills |
|--------|-----------|
| §SPARK hook | type:side, disposition style, activateCond: always at node |
| §SPARK skill_check | WIS Animal Handling DC 11, token item fields, onPass creates item |
| §HUNT setup | type:side, wrong-theory disposition, storyRender skeleton |
| §HUNT investigation | INT Investigation DC 12, retryable:false, knowledge entry in onPass |
| §WHODUNIT drain | INT Investigation DC 12, storyMsg pattern |
| §ALCHEMY beat | type:side, wisdom beat desc pattern, +XP in completeFn |
| §WISDOM fragment | desc: Ardley-text + Roen-commentary pattern, knowledge entry onPass |

---

### §EDITOR-01-G. Implementation Notes

- Runs as a standalone HTML file (`questeditor.html`), no server required
- QUEST_DB imported as a JSON-serializable snapshot (functions serialized as template strings, deserialized on load)
- The function serialization problem: JS functions in `onPass`, `completeFn` etc. cannot be stored as JSON. The editor stores them as **template strings** with named slots (`{{flagName}}`, `{{xpAmount}}`, `{{itemName}}`), and generates the final JS function body at export time
- Side-by-side preview: left panel = editor form; right panel = rendered quest card as it would appear in the game's quest panel UI
- All flag names validated against a loaded snapshot of `_S_DEFAULTS()`

---

## §EDITOR-02 — Generic Quest Chain Inserter: Mission Builder (📋 PLANNED)

**Status:** 📋 PLANNED — written 2026-05-29  
**Reference:** `API-README.md §Use Case: Generic Mission Builder`

**What it is:** A repeatable API-driven workflow for inserting new quest arcs one mission at a time. Not a UI — a workflow pattern and a server-side extension that makes the pattern executable. The insight from the Paul arc implementation: every new arc is a sequence of these moves: check the node → add a state flag → verify the schema → POST the quest → GET it back → PUT any text corrections → check the chain → save. That sequence can be formalized.

**Why now:** Without a pattern, each arc requires re-learning the API from scratch. With a pattern, a new arc is a checklist. The Paul arc was the first arc implemented this way — 12 quests, 13 nodes, each verified individually before the next was added. The pattern worked. It should be the standard method.

---

### §EDITOR-02-A. The Seven-Step Arc Insertion Protocol

This is the canonical workflow for adding any quest chain via the API. It applies whether you are adding 2 quests or 20. The steps are invariant; the content changes.

```bash
# Step 0: confirm node exists and terrain is correct
./api.sh location {startNode}

# Step 1: register new flags in _S_DEFAULTS (manual, one-time edit in roll2hit-v3.html)

# Step 2: inspect quest schema before writing
./api.sh get quest --schema    # or: ./api.sh --ai "what fields does a quest need?"

# Step 3: create one quest (nonce auto-handled; NPC field required)
./api.sh post quest id=quest_{arc}_{nn} type=side npc={npc_key} activateNode={code} title="..."

# Step 4: verify quest is readable and all fields set
./api.sh get quest quest_{arc}_{nn}

# Step 5: patch text fields if needed
./api.sh put quest quest_{arc}_{nn} passText="..." failText="..."

# Step 6: repeat steps 3–5 for each quest in the chain

# Step 7: verify dependency graph is connected end-to-end
./api.sh chain quest_{arc}_{nn}

# Step 8: run audit — must be clean before save
./api.sh audit

# Step 9: commit to timestamped HTML
# (auto-save fires after each POST/PUT; explicit save via server restart or worldbuilder.html Save button)
```

**One session per arc.** All POSTs and PUTs in the chain must happen in a single server session before Step 8. Each `save()` produces a new timestamped file. The next session loads that timestamped file as `ROLL2HIT_FILE`.

---

### §EDITOR-02-B. Mission Type → Canonical Field Template

Every mission type has a minimum required field set. These are the templates. Copy, fill in the narrative fields (`desc`, `hint`, `vignetteText`, `passText`, `failText`, `disposition`), then POST.

**Template: `talk_chain` (NPC conversation, no roll)**
```json
{
  "id": "quest_{arc}_{nn}",
  "type": "side",
  "title": "...",
  "desc": "...",
  "hint": "...",
  "activateNode": "{nodeCode}",
  "activateCond": "{priorFlag}",
  "checkPassFlag": "{arcFlag}",
  "xpAward": 100,
  "reward": 0
}
```

**Template: `skill_check` (Fighter ability check)**
```json
{
  "id": "quest_{arc}_{nn}",
  "type": "skill_check",
  "title": "...",
  "desc": "...",
  "hint": "...",
  "activateNode": "{nodeCode}",
  "activateCond": "{priorFlag}",
  "checkAbility": "{str|dex|con|int|wis|cha}",
  "checkLabel": "{Skill name}",
  "checkDC": 12,
  "retryable": false,
  "xpAward": 150,
  "vignetteText": "...",
  "passText": "...",
  "failText": "...",
  "checkPassFlag": "{arcFlag}",
  "disposition": "..."
}
```

**Template: `hunt` (kill-count mission — uses `completeFn`)**
```json
{
  "id": "quest_{arc}_{nn}",
  "type": "side",
  "title": "...",
  "desc": "...",
  "hint": "Kill {N} × {monsterKey} at {nodeCode}.",
  "activateNode": "{nodeCode}",
  "activateCond": "{priorFlag}",
  "completeItems": [],
  "checkPassFlag": "{arcFlag}",
  "xpAward": 200,
  "reward": 0
}
```
*Note: `completeFn` (kill count check against S_story counter) cannot be posted via the API's current text fields — it requires a manual source edit for the JS closure. For kill-count quests, POST the non-function fields, then manually add the `completeFn` in the game file.*

**Template: `escort` (companion travel — no roll, completion at destination)**
```json
{
  "id": "quest_{arc}_{nn}",
  "type": "side",
  "title": "...",
  "desc": "...",
  "hint": "Reach {destinationNode} with {npcKey}.",
  "activateNode": "{startNode}",
  "waypointNode": "{destinationNode}",
  "activateCond": "{priorFlag}",
  "checkPassFlag": "{arcFlag}",
  "xpAward": 150,
  "reward": 0
}
```

**Template: `collect` (item delivery)**
```json
{
  "id": "quest_{arc}_{nn}",
  "type": "side",
  "title": "...",
  "desc": "...",
  "hint": "Bring {itemName} to {npcKey} at {nodeCode}.",
  "activateNode": "{nodeCode}",
  "waypointNode": "{deliveryNode}",
  "activateCond": "{priorFlag}",
  "completeItems": ["{itemName}"],
  "checkPassFlag": "{arcFlag}",
  "xpAward": 150,
  "reward": 0
}
```

---

### §EDITOR-02-C. Pre-flight Checklist (run before POST /api/save)

Before saving any quest chain, verify all three of these pass:

1. **All `activateCond` flags exist in `_S_DEFAULTS`:**
   - Check flags: `./api.sh export _s_defaults --raw` (or grep: `grep -o 'flagName: false' roll2hit-v3.html`)
   - Every flag referenced in `activateCond` must be listed there

2. **All `checkPassFlag` values are unique:**
   - `GET /api/quest/{flagName}` — if it returns a quest, that flag name is taken by another quest
   - Naming convention: `{arcPrefix}_{nodeCode}_{nn}` avoids collisions

3. **All `activateNode` and `waypointNode` values exist:**
   - `GET /api/node/{code}` for each node referenced in the chain

4. **Chain is connected:**
   - `GET /api/quest/{firstQuestId}/chain` — downstream array lists all expected quests

---

### §EDITOR-02-D. Needed API Extensions (not yet implemented)

These additions to `wbapi-server.js` and `wbapi-core.js` are required to make §EDITOR-02 fully executable without manual file edits:

- [ ] **`POST /api/quest`** — create a new quest object in QUEST_DB (currently only PUT/existing quests supported). Inserts between the QUEST_DB START/END anchors. Validates against `GET /api/schema/quest` before writing.

- [ ] **`POST /api/node`** — create a new NODE_MAP entry. Currently only PUT/existing nodes is supported.

- [ ] **`GET /api/quest/{id}/chain`** — expose the existing `WBAPI.quests.chain()` method as an HTTP endpoint (currently only available in the CLI).

- [ ] **`GET /api/flags`** — list all flags currently in `_S_DEFAULTS`. Enables pre-flight check #1 without manual grep.

- [ ] **`POST /api/flag`** — add a new flag to `_S_DEFAULTS` with a default value. Eliminates the only remaining manual edit step in the protocol.

- [ ] **`GET /api/quest?node={code}`** — filter quests by `activateNode` (wrapper around `WBAPI.quests.byNode()`). Currently requires the full location GET.

---

### §EDITOR-02-E. Worldbuilder UI Integration

Once §EDITOR-02-D extensions exist, the Mission Builder can be a tab in worldbuilder.html:

```
[ Mission Builder ]

Starting node:  [ KS — Damascus ▾ ]
Arc prefix:     [ paul_ ]

Mission 1:  [ talk_chain ▾ ]  Title: [ The House on the Lower Road ]  Flag: [ anathSightRestored ]
Mission 2:  [ skill_check ▾ ] Title: [ Over the Wall ]  Stat: [ STR ▾ ] DC: [ 12 ]  Flag: [ escapedDamascus ]
Mission 3:  [ skill_check ▾ ] Title: [ Vouched For ]    Stat: [ CHA ▾ ] DC: [ 11 ]  Flag: [ barnachVouchedHR ]

[ + Add Mission ]

[ Preview Chain ]   [ Validate ]   [ POST All ]   [ Save ]
```

**Preview Chain** renders the full quest sequence in order with flag dependency arrows.  
**Validate** runs the pre-flight checklist (§EDITOR-02-C) and shows pass/fail per check.  
**POST All** sends each quest in sequence, stopping if any POST fails.  
**Save** calls `POST /api/save` only if all POSTs succeeded.

---

## §ARCH-01 — Quest API Architecture & Universal Mission Format (📋 PLANNED — Next Implementation Phase)

**Lab Report:** `lab-report-quest-api-architecture.md`  
**Scope:** Unification of all quest types into Universal Quest Format (UQF v1.0); WBAPI runtime layer; live 5-phase migration

### Core Problem
QUEST_DB currently has three incompatible formats (main/side/skill_check), logic scattered across storyRender + completeFn closures, and JS arrow functions that cannot be serialized, diffed, or safely edited by the worldbuilder.

### §ARCH-01-A. Universal Quest Format (UQF v1.0)

Every quest becomes a declarative object with:
- `schema: '1.0'` — version stamp
- `gate: { flags, flagsAny, notFlags }` — replaces `activateCond` arrow function
- `bits: [...]` — ordered array of typed mission bit objects

### §ARCH-01-B. Mission Bit Registry

Atomic, composable mechanics — each bit is a typed contract:

| Kind | Contract | Replaces |
|------|----------|---------|
| `skill_check` | `stat`, `dc`, `onPass`, `onFail` | `checkStat/checkDC/onPass/onFail` |
| `flag_write` | `set[]`, `clear[]` | `S_story.flag = true` in closures |
| `reward` | `xp`, `gold`, `items[]`, `knowledge` | XP/gold/item lines in completeFn |
| `combat` | `key`, `label`, `count`, `nodeCode` | `storyPreBattle(...)` calls |
| `narrative` | `msg` or `template` | `storyMsg(...)` calls |
| `choice` | `prompt`, `options[{label,bits}]` | Accept/Fight button pairs in storyRender |
| `item_remove` | `name` | `inv.splice(idx,1)` calls |
| `unlock` | `quests[]` | quest chain activation side effects |

### §ARCH-01-C. Migration Plan (5 Phases, Zero-Downtime)

| Phase | Description | Risk |
|-------|-------------|------|
| 0 | Anchors + worldbuilder (✅ Done) | Zero |
| 1 | `QuestRuntime` singleton + `adaptLegacyQuest()` adapter + `schema:'0.legacy'` stamps (✅ Done) | Zero |
| 2 | New arcs written in UQF; runtime serves both formats | Low |
| 3 | Arc-by-arc migration (§WISDOM-01 first) | Medium |
| 4 | All arcs UQF; legacy path removed | Medium-low |
| 5 | QUEST_DB is single source of truth; storyRender is display-only | Low |

### §ARCH-01-D. MissionBitController

Validates quest definitions against bit contracts before writing to QUEST_DB. Runs inside worldbuilder.html Quest Editor. Required fields, optional fields, and a `validate()` function per bit kind.

### §ARCH-01-E. Implementation Checklist

- [x] Phase 1: Add `SCHEMA_VERSION`, `QuestRuntime`, `adaptLegacyQuest()` to game file (inert — no behavior change) *(✅ 2026-06-12)*
- [x] Phase 1: Add `BIT_CONTRACTS` and `validateQuest()` to worldbuilder.html Quest Editor *(✅ 2026-06-12)*
- [ ] Phase 2: Write §DUNGEON-01 quests in UQF v1.0 as first proof-of-concept
- [ ] Phase 3-a: Migrate §WISDOM-01 (8 quests) — cleanest arc, well-documented
- [ ] Phase 3-b: Migrate §SPARK-01, §SPARK-02 arcs
- [ ] Phase 3-c: Migrate §ALCHEMY-01, §HUNT arcs
- [ ] Phase 3-d: Migrate main quest chain
- [ ] Phase 4: Remove `completeFn` / `onPass` closure pattern; confirm storyRender blocks are display-only
- [ ] Phase 5: Export format in worldbuilder generates paste-ready UQF JS literals

---

## §ARCH-02 — Quest Operand Registry & Full Cycle API (📋 PLANNED)

**Depends on:** §ARCH-01 Phase 1 complete  
**Lab report:** `lab-report-wbapi.md` (WBAPI system — import, patch, export)  
**Source data:** 210 quests across 4 types (side:104, skill_check:59, epic:40, main:7)

### Core Problem §ARCH-02 Solves

§ARCH-01 defines UQF format (gate + bits[]). §ARCH-02 defines **what those bits mean at execution time** — the operand vocabulary that every quest is made from. Without this, UQF is a schema with no runtime semantics, and world creation is still freeform. With it, every quest is a declared sequence of typed operands, each with a contract, a gate condition, and a completion signal.

---

### §ARCH-02-A. Operand Registry — The Complete Vocabulary

An **operand** is a discrete unit of player action with:
- **required fields** — must be present to be valid
- **optional fields** — modify behaviour when present
- **gate** — condition checked before the operand activates
- **complete** — condition checked to consider this operand done
- **runtime handler** — what the game does when the operand fires

**Scan of existing 210 quests reveals these execution fingerprints:**

| Pattern | Quest count | Notes |
|---|---|---|
| Node travel (activate ≠ waypoint) | 126 | Most common — player must move between nodes |
| In-place (activate == waypoint) | 62 | Talk, roll, receive at same node |
| Skill check | 59 | `checkAbility` + `checkDC` + `passText` + `failText` |
| Flag gate | 22 | `activateCond` reads `S_story.flag` |
| Inventory give | 15 | `inv.push(item)` in `completeFn` |
| Choice branch | 6 | Accept/Fight or multi-option branches |
| Inventory take | 4 | `inv.splice` / `inv.filter` — item consumed |
| Party/companion | 2 | NPC in `S.party`, not at a node |

---

#### Operand 1 — `talk_at`
Travel to node, interact with NPC or object.

```javascript
{
  kind: 'talk_at',
  node: 'CI',           // required — node code where interaction occurs
  npcKey: 'yael',       // optional — NPC key (verified against BIRKA_NPC + NODE_MAP)
  objectKey: 'stone',   // optional — non-NPC interactable
  requiresItem: 'Map',  // optional — item must be in S.inv to proceed
  dialogue: '...',      // optional — overrides NPC default greeting
}
```

**Gate:** `S.currentNode === bit.node`  
**Complete:** `S_story[talked_${npcKey || objectKey}_at_${node}] === true`  
**Covers:** 62 in-place side quests, most §SPARK intro quests

---

#### Operand 2 — `skill_check`
Roll stat vs DC. Existing `checkAbility`/`checkDC` fields become this operand.

```javascript
{
  kind: 'skill_check',
  ability: 'wis',       // required — wis | int | str | dex | con | cha
  dc: 14,               // required
  label: 'Ancient Text Knowledge',  // required — shown to player
  retryable: false,     // optional — default false
  retryGateDays: 3,     // optional — days before retry allowed
  passText: '...',      // required
  failText: '...',      // required
  passFlag: 'wisdomRead', // optional — S_story flag set on pass
}
```

**Gate:** player is at activateNode  
**Complete:** rolled, result recorded  
**Covers:** all 59 `skill_check` type quests  
**Stats breakdown from live data:** wis:11, int:9, cha:4, undefined:35 (to be filled)

---

#### Operand 3 — `navigate`
Player must move from one node to another. Pure location gate.

```javascript
{
  kind: 'navigate',
  fromNode: 'CI',       // required
  toNode: 'CY',         // required
  hint: '...',          // optional — shown in quest strip
}
```

**Gate:** `S.currentNode === bit.fromNode`  
**Complete:** `S.currentNode === bit.toNode`  
**Covers:** 126 quests with `activateNode ≠ waypointNode`

---

#### Operand 4 — `kill_at`
Defeat a specific enemy at a specific node. Combat is not embedded in QUEST_DB — it is triggered by the node's `battle` field. This operand declares the *intent*, which the runtime maps to the node's combat trigger.

```javascript
{
  kind: 'kill_at',
  node: 'CY',                        // required — node with battle field
  monsterKey: 'corrupted_android',   // required — must match MONSTER_POOL key
  count: 2,                          // optional — default 1
  targetLabel: 'Android ×2',        // optional — display override
  killFlag: 'androidsClear',         // optional — S_story flag set on completion
}
```

**Gate:** `S.currentNode === bit.node && nodeMap[bit.node].battle`  
**Complete:** `S_story[bit.killFlag || killed_${monsterKey}_at_${node}] === true`  
**Validation:** monsterKey must exist in MONSTER_POOL; node must have `battle` field  
**Covers:** hunt quests, §DUNGEON-01 combat encounters

---

#### Operand 5 — `escort`
NPC joins the player's party and must be delivered to a destination. The NPC is held as a party slot — not at a fixed node, but traveling with the player.

```javascript
{
  kind: 'escort',
  npcKey: 'aldric',     // required — NPC key; NPC "picked up" at fromNode
  fromNode: 'CY',       // required — where NPC joins party
  toNode: 'CI',         // required — where NPC must be delivered
  partySlot: 'escort',  // optional — S.party slot key, default 'escort'
  combatRisk: true,     // optional — combat may trigger during transit
  failFlag: 'escortFailed', // optional — set if NPC dies or player leaves zone
}
```

**Gate:** `S.currentNode === bit.fromNode && !S.party[bit.partySlot]`  
**Complete:** `S.currentNode === bit.toNode && !!S.party[bit.partySlot]`  
**NPC-as-item model:** NPC is stored in `S.party[slotKey] = npcKey` on pickup, cleared on delivery  
**Covers:** 2 existing party-pattern quests; new escort arc template

---

#### Operand 6 — `talk_party`
NPC is already in party. Conversation is available regardless of current node. This is the key distinction from `talk_at` — the NPC travels *with* the player rather than waiting at a fixed location.

```javascript
{
  kind: 'talk_party',
  npcKey: 'aldric',       // required — NPC must be in S.party
  partySlot: 'escort',    // optional — which slot to check
  trigger: 'inventory',   // optional — how conversation is initiated
  dialogue: '...',        // optional — what NPC says
  talkFlag: 'aldricBriefed', // optional — S_story flag set after talk
}
```

**Gate:** `S.party?.[bit.partySlot] === bit.npcKey || S.inv?.includes(bit.npcKey)`  
**Complete:** `S_story[bit.talkFlag] === true`  
**Player experience:** accessible from inventory/party panel, not map navigation  
**Covers:** companion quest arcs, §SPARK-style "NPC follows you" sequences

---

#### Operand 7 — `deliver`
Carry an item from one location to another. Item must be in inventory when arriving at destination.

```javascript
{
  kind: 'deliver',
  item: 'Bloodstained Map',  // required — must match S.inv entry
  toNode: 'CY',              // required — destination node
  fromNode: 'CI',            // optional — where item was picked up
  recipient: 'bruhns',       // optional — NPC key to hand item to
  consumeOnDeliver: true,    // optional — default true, removes from inv
}
```

**Gate:** `S.inv.includes(bit.item)`  
**Complete:** `S.currentNode === bit.toNode`  
**Covers:** quest_mq_1 (Bloodstained Map), any §ALCHEMY token delivery

---

#### Operand 8 — `collect_item`
Quest completion grants an item to inventory.

```javascript
{
  kind: 'collect_item',
  item: 'Drowned Compass',  // required — name added to S.inv
  icon: '🧭',               // optional
  sell: 40,                 // optional — gold value if sold
  unique: true,             // optional — only one allowed in inv
}
```

**Gate:** previous operand complete  
**Complete:** `S.inv.includes(bit.item)`  
**Covers:** 15 quests that push items — §SPARK tokens, §HUNT relics, §ALCHEMY reagents

---

#### Operand 9 — `consume_item`
Requires item in inventory, removes it as cost/condition.

```javascript
{
  kind: 'consume_item',
  item: 'Antidote',         // required — must exist in S.inv
  failText: '...',          // optional — shown if item not found
}
```

**Gate:** `S.inv.includes(bit.item)`  
**Complete:** item removed from inv  
**Covers:** 4 quests that remove items (quest_forge_02 pattern)

---

#### Operand 10 — `investigate`
Examine a location or object. Precedes `kill_at` in the §HUNT 4-phase template — investigation reveals the real enemy before the player commits to combat.

```javascript
{
  kind: 'investigate',
  node: 'LD',               // required — investigation location
  target: 'shore_markings', // required — what is examined
  skillCheck: { ability:'int', dc:12 }, // optional — DC to learn more
  reveals: 'drowner',       // optional — monster key unlocked by investigation
  narrativeText: '...',     // optional — what is discovered
  investigateFlag: 'shoreInvestigated', // optional
}
```

**Gate:** `S.currentNode === bit.node`  
**Complete:** `S_story[bit.investigateFlag] === true`  
**Covers:** §HUNT investigation phase, §WHODUNIT clue collection

---

#### Operand 11 — `flag_gate`
Not an action — a prerequisite block. Declares the flags that must be set before this quest or operand is reachable. Replaces inline `activateCond` arrow functions.

```javascript
{
  kind: 'flag_gate',
  requires: ['questDone_01'],       // ALL must be true
  requiresAny: ['spark_path_a', 'spark_path_b'], // ANY one must be true
  blocks: ['questDone_02'],         // none of these may be true
}
```

**Gate:** evaluated against `S_story`  
**Complete:** gate passes (this is a gate, not an action)  
**Covers:** 22 quests with flag-dependent `activateCond`

---

#### Operand 12 — `choice`
Branching decision. Each option contains its own operand sub-sequence. Merges into a `choice` bit in UQF v1.0.

```javascript
{
  kind: 'choice',
  prompt: 'What do you do?',
  options: [
    { label: 'Accept',  bits: [ /* operand sequence */ ] },
    { label: 'Fight',   bits: [ /* operand sequence */ ] },
    { label: 'Flee',    bits: [ /* operand sequence */ ] },
  ],
}
```

**Gate:** previous operand complete  
**Complete:** one option chosen and its bit sequence resolved  
**Covers:** 6 existing choice quests (quest_sb_01 pattern), §SIREN betrayal mechanic

---

### §ARCH-02-B. Operand Composition Rules

Every quest is a **linear or branching sequence of operands**. The runtime walks the sequence, testing each operand's gate before exposing it to the player.

```
quest = {
  gate:  flag_gate operand    ← when does this quest appear?
  bits:  [
    operand_1,                ← first player action
    operand_2,                ← second (unlocked when 1 completes)
    ...
    collect_item,             ← reward
    flag_write,               ← mark completion
  ]
}
```

**Composition constraints enforced by MissionBitController:**
- `kill_at` must reference a node with `battle: true` in NODE_MAP
- `escort.fromNode` and `escort.toNode` must exist in NODE_MAP
- `deliver.item` must match a prior `collect_item` or existing inv item
- `talk_at.npcKey` must exist in BIRKA_NPC or as inline `node.npc`
- `talk_party.npcKey` must match a prior `escort` operand's `npcKey`
- `skill_check.ability` must be one of: `str dex con int wis cha`
- Every quest must end with either `collect_item`, `flag_write`, or `choice`

---

### §ARCH-02-C. Existing Quest → Operand Map

| Quest type | Count | Primary operand sequence |
|---|---|---|
| `skill_check` | 59 | `flag_gate?` → `talk_at` → `skill_check` → `collect_item?` |
| `side` (in-place) | ~62 | `flag_gate?` → `talk_at` → `collect_item?` → `flag_write` |
| `side` (travel) | ~42 | `flag_gate?` → `navigate` → `talk_at` → `flag_write` |
| `epic` | 40 | `flag_gate` → `navigate` → `choice` → `skill_check` → `collect_item` → `flag_write` |
| `main` (mq_1–7) | 7 | `navigate` → `deliver?` → `flag_write` → `unlock` |
| §HUNT template | 4 arcs | `flag_gate` → `navigate` → `investigate` → `kill_at` → `collect_item` → `flag_write` |
| §SPARK template | 2 arcs | `flag_gate` → `talk_at` → `skill_check` → `collect_item` → `talk_party?` |
| §ALCHEMY template | 1 arc | `flag_gate` → `navigate` → `collect_item` → `deliver` → `flag_write` |
| §ESCORT (new) | 0 | `flag_gate` → `talk_at` → `escort` → `navigate` → `talk_party` → `flag_write` |

---

### §ARCH-02-D. NPC-as-Party-Member Model

When an NPC joins the player's party, they shift from a **world object** (at a fixed node) to a **carried object** (in `S.party`). This is the conceptual bridge between `talk_at` (NPC at location) and `talk_party` (NPC traveling with player).

**State model:**
```javascript
S.party = {
  escort: 'aldric',       // NPC key in this slot
  companion: null,        // permanent party slot (future)
}
```

**Lifecycle:**
```
1. talk_at (fromNode)          → NPC met at node; offer to join
2. collect_item 'Aldric'       → NPC added to S.inv as token
   + flag_write: aldricJoined  → S_story flag set
3. escort operand active       → S.party.escort = 'aldric'
4. talk_party (any node)       → available while NPC in party
5. navigate (toNode)           → player travels with NPC
6. deliver at toNode           → S.party.escort cleared
   + consume_item 'Aldric'     → token removed from inv
   + flag_write: aldricDelivered
```

**Why item + flag + party slot:**  
Three redundant signals ensure robustness across save/load, UI display, and runtime checks. The item shows in inventory so the player knows they're carrying someone. The flag enables downstream quest gates. The party slot enables `talk_party` gates without scanning inventory.

---

### §ARCH-02-E. World Creation Advisory Layer

The **Advisory Layer** is the creative half of MissionBitController. It validates not just field types but *world logic* — whether the operands refer to things that actually exist in the game world.

**Checks run on every quest PUT/create:**

| Check | Operand(s) | Error if |
|---|---|---|
| Node exists | `talk_at`, `kill_at`, `navigate`, `escort`, `investigate` | Node code not in NODE_MAP |
| Node has battle | `kill_at` | `nodeMap[node].battle` is null/false |
| Monster exists | `kill_at` | monsterKey not in MONSTER_POOL |
| Monster in terrain | `kill_at` | monsterKey not in `_terrainToMonsters[node.name]` |
| NPC exists | `talk_at`, `escort`, `talk_party` | npcKey not in BIRKA_NPC and not `node.npc` |
| NPC at node | `talk_at` | NPC's node field ≠ operand's node |
| Item coherence | `deliver`, `consume_item` | item not granted by prior `collect_item` in same quest |
| Party coherence | `talk_party` | no prior `escort` operand grants this npcKey |
| Flag uniqueness | `flag_write` | flag already written by another quest in same arc |
| Stat validity | `skill_check` | ability not in `[str,dex,con,int,wis,cha]` |
| DC range | `skill_check` | DC < 5 or DC > 25 (advisory, not block) |

**Advisory (warn, don't block):**
- Quest with no `collect_item` or `flag_write` at end — player gets no signal of completion
- `skill_check` with no `passFlag` — downstream quests can't gate on this result
- `navigate` with no `hint` — player has no waypoint guidance
- `escort` with `combatRisk: true` but no `killFlag` — combat outcome untracked

---

### §ARCH-02-F. Full Cycle API

The complete round-trip from world creation intent to saved game file:

```
1. DESIGN
   WBAPI.quests.create({
     id: 'quest_escort_aldric',
     type: 'escort',
     title: 'The Archivist Walks',
     gate: { requires: ['aldricMet'] },
     bits: [
       { kind: 'talk_at',     node: 'CY', npcKey: 'aldric' },
       { kind: 'collect_item', item: 'Aldric', icon: '👴' },
       { kind: 'escort',      npcKey: 'aldric', fromNode: 'CY', toNode: 'CI' },
       { kind: 'talk_party',  npcKey: 'aldric', talkFlag: 'aldricBriefed' },
       { kind: 'navigate',    fromNode: 'CY', toNode: 'CI' },
       { kind: 'flag_write',  set: ['aldricDelivered'] },
       { kind: 'consume_item', item: 'Aldric' },
       { kind: 'collect_item', item: 'Archivist Key', icon: '🗝', sell: 0 },
     ]
   })

2. VALIDATE
   WBAPI.quests.validate('quest_escort_aldric')
   // → { ok:true, warnings:['navigate has no hint'] }

3. ADVISORY CHECK
   WBAPI.quests.advise('quest_escort_aldric')
   // → checks: node CY exists ✓, NPC aldric exists ✓, aldricMet flag writable ✓

4. EDIT (text fields via file or inline)
   WBAPI.editField('quest', 'quest_escort_aldric', 'title', 'Walk With Me')
   // or: ./api.sh put quest quest_escort_aldric title="Walk With Me"

5. CHAIN CHECK
   WBAPI.quests.chain('quest_escort_aldric')
   // → { upstream: ['quest_aldric_intro'], downstream: [] }

6. EXPORT (for human review)
   ./api.sh export quest_db --out world/quests.json
   // or full tree export: node wbapi-cli.js export ./world
   //     world/CY/npcs/aldric/quests/quest_escort_aldric/

7. AUDIT + SAVE
   ./api.sh audit              // must be clean before save
   // then save via worldbuilder.html Save button or wbapi-cli.js save
```

---

### §ARCH-02-G. WBAPI Methods to Add

New methods needed in `wbapi-core.js` and `worldbuilder.html`:

```javascript
// Quest creation with operand validation
WBAPI.quests.create(questObj)          // validates operands before adding
WBAPI.quests.validate(idOrTitle)       // run MissionBitController checks
WBAPI.quests.advise(idOrTitle)         // run world-logic advisory checks
WBAPI.quests.toOperands(idOrTitle)     // parse legacy quest into operand array

// Operand registry
WBAPI.operands.list()                  // all 12 operand types
WBAPI.operands.contract(kind)          // required/optional fields for a kind
WBAPI.operands.validate(bit)           // validate a single operand object

// World advisory
WBAPI.worlds.validateNodeForCombat(code)    // node has battle field + monsters
WBAPI.worlds.npcAtNode(npcKey, nodeCode)    // NPC is correctly placed
WBAPI.worlds.flagUniqueInArc(flag, arcId)  // flag not reused across arc
```

---

### §ARCH-02-H. Implementation Checklist

**Phase 1 — Operand Registry (inert, no behavior change)** *(✅ 2026-06-12)*
- [x] Define `OPERAND_CONTRACTS` object with all 12 operand kinds, required/optional fields
- [x] Add `WBAPI.operands.list()` / `.contract(kind)` / `.validate(bit)`
- [x] Add `WBAPI.quests.validate(id)` — field-level checks only
- [x] Add `WBAPI.quests.advise(id)` — world-logic cross-reference checks
- [x] Add `WBAPI.quests.toOperands(id)` — parse existing quest fields into operand array
- [x] Wire validate + advise into API tab in worldbuilder.html

**Phase 2 — Quest creation flow**
- [ ] Add `WBAPI.quests.create(questObj)` — validates then adds
- [ ] Add operand builder UI in worldbuilder.html Quest Editor (one card per operand)
- [ ] Add `WBAPI.quests.chain()` to show upstream/downstream in Quest Editor

**Phase 3 — Escort + party operand runtime (new execution paths)**
- [ ] Add `S.party` to game state model
- [ ] Implement `escort` pickup/dropoff in storyRender
- [ ] Implement `talk_party` trigger in inventory/party panel
- [ ] Add `talk_party` detection to `_questsByNode` — these quests appear everywhere

**Phase 4 — Legacy quest conversion**
- [ ] `quests.toOperands()` used to audit all 210 quests
- [ ] Generate operand arrays for all 59 `skill_check` quests (most uniform, lowest risk)
- [ ] Convert §HUNT-01 (4 quests) as escort+kill_at proof-of-concept
- [ ] Convert §SPARK-01 arc as collect_item+talk_party proof-of-concept

**Phase 5 — Full advisory enforcement**
- [ ] `quests.create()` hard-blocks on world-logic failures (node not found, NPC not placed)
- [ ] World Builder CLI: `./api.sh audit` advise mode — `./api.sh get quest <id>` + chain check in one call

---

## §WORLDBUILDER-02 — Investigation Mode: Cross-Reference Explorer (📋 PLANNED)

**Status:** 📋 PLANNED — written 2026-05-29

**What it is:** A second interaction mode for worldbuilder.html that shifts emphasis from editing to *investigation*. The current worldbuilder is CRUD-first: you find an entity, you change its fields. Investigation Mode is knowledge-first: you find an entity and immediately see all of its relationships — what it's connected to, what depends on it, what references it — so that design decisions are made from a full picture rather than a partial one.

**Why this matters:** The game has 210 quests, 144 nodes, 392 monsters, 69 terrains. At this scale, editing a quest's activateNode without knowing what else activates at that node, or renaming a monster without knowing which terrains it appears in, creates invisible breakage. Investigation Mode makes the graph visible before any change is made.

---

### §WORLDBUILDER-02-A. The Quest Detail Card (Full Cross-Reference View)

The current quest display shows title + text. The investigation card adds:

```
┌─────────────────────────────────────────────────────────────────┐
│  quest_wis_03                                [skill_check / WIS] │
│  "The Stalemate Cost"                                            │
│  Node: SB  (Senate Building — Birka)                             │
├─────────────────────────────────────────────────────────────────┤
│  NPC: Magistra Voss (yael)   Stat: WIS  DC: 12                  │
│  Retryable: no               XP: 100   Gold: 0                  │
├─────────────────────────────────────────────────────────────────┤
│  UPSTREAM FLAGS (must be set before this activates):            │
│    wisHookReceived    ← written by quest_wis_00                 │
│    sbResolved         ← written by quest_sb_01 or quest_sb_fight│
│  DOWNSTREAM FLAGS (set by this quest, read by):                 │
│    wisPage3_thumbscrew → read by quest_wis_07, quest_wis_09     │
├─────────────────────────────────────────────────────────────────┤
│  ARC: quest_wis (Wisdom arc)   [8 quests total, this is #3]     │
│  Sibling quests in arc: wis_00 wis_01 wis_02 [this] wis_04...   │
└─────────────────────────────────────────────────────────────────┘
```

Clicking any node code, NPC key, flag name, or arc quest ID navigates to that entity's card.

---

### §WORLDBUILDER-02-B. Mission Classification — Proposed Type Taxonomy

Current quest types in QUEST_DB: `side`, `skill_check`, `epic`, `main`.

These 4 types carry too much semantic weight for a 210-quest corpus. A finer taxonomy makes it possible to filter by what the player actually does:

| Proposed Class | Description | Existing examples |
|----------------|-------------|-------------------|
| `hunt` | Kill N enemies of type X | quest_hunt_01–04 |
| `collect` | Acquire item(s) and return them | quest_la_riva_02, quest_basket_damascus |
| `escort` | Companion must survive to destination | §SPARK-01 (Caspian) |
| `skill_check` | Roll stat vs DC (already exists) | all skill_check quests |
| `talk_chain` | Dialogue with NPC sequence (no combat required) | quest_wis_00, quest_la_riva_01 |
| `lore_collect` | Gather scattered journal/map fragments | Froberger arc, §ALCH |
| `gate_pass` | Reach a node while a condition is met | quest_governor_cyprus |
| `survival` | Reach a state with HP > threshold | quest_stoning_lystra |
| `investigation` | Read clues from multiple nodes, synthesize at one | §WHODUNIT |
| `epic` | Multi-step, multi-node arc capstone (already exists) | mq quests |
| `main` | Story-gate progression key (already exists) | quest_antecedent_01 |

**Classification rule:** a quest's operational class is determined by the primary completion signal — the single thing that fires `completeFn`. Secondary effects (a skill check inside a hunt) do not change the class.

---

### §WORLDBUILDER-02-C. Filter + Search Interface

Investigation Mode adds a persistent filter bar above the main content area:

```
[ Type ▾ all ] [ Arc ▾ all ] [ Node ▾ all ] [ NPC ▾ all ]  [ Search... ]
```

Filtering by node shows all quests that activate OR waypoint at that node — the full mission picture for a location. Filtering by NPC shows every quest that NPC is involved in. Filtering by arc shows the full chain in order with flag dependencies inline.

**Location Profile card** (per node, aggregates all entities):

```
Node: CI — City Streets – Birka  (Act 1, terrain: city)
  Quests active here:  6  (3 side, 2 skill_check, 1 talk_chain)
  NPCs:                Yael Scheidemann, Crov (inline)
  Monsters:            city_guard, thief, pickpocket, shadow_agent... (28 total)
  Terrains:            city
  Adjacent nodes:      CI2 (S), CY (N), CO (E), IN (W)
  Flags set by quests: connieMet, wisHookReceived, labHookReceived
  Flags read by quests: catKingDefeated, govCopperConverted
```

---

### §WORLDBUILDER-02-D. Relationship Graph (Visual)

A secondary panel showing the selected entity's immediate neighborhood as a small force-directed graph:

- Quest node → connected to: its activateNode, waypointNode, NPC key, arc siblings, upstream/downstream quests (by flag)
- Node → connected to: all adjacent nodes (N/S/E/W), all quests at that node, all NPCs at that node
- NPC → connected to: their home node, all quests that reference their key
- Monster → connected to: all terrains that include it, all nodes where that terrain is active

The graph is not a map replacement — it is a relationship surface for the selected entity. Nodes in the graph are clickable (navigate to that entity's investigation card).

---

### §WORLDBUILDER-02-E. Implementation Phases

**Phase 1 — Quest investigation card (no graph)** ✅ 2026-06-12
- [x] Extend quest detail pane in worldbuilder.html to show: arc siblings, upstream/downstream flags with originating quest IDs, NPC key → NPC name lookup, activateNode → node label lookup
- [x] Add arc-filter to quest sidebar (filter by arc prefix extracted from quest ID)
- [x] Add "Location Profile" button on node detail that shows all quests + NPCs + monsters at that node

**Phase 2 — Mission classification layer** *(✅ 2026-06-12)*
- [x] Add `_classifyQuest(q)` to wbapi-core.js — returns operational class from `§WORLDBUILDER-02-B` table based on field inspection
- [x] Add `WBAPI.quests.byClass(cls)` list method
- [x] Expose in worldbuilder: class filter dropdown with 10 operational classes + class badge in quest list
- [x] Show operational class badge alongside QUEST_DB type in quest card header

**Phase 3 — Location Profile card**
- [x] `WBAPI.location.profile(nodeCode)` — extends existing `location.get()` with: quest list with classes, NPC list with quest counts, flag reads/writes at this node
- [x] Render Location Profile card in worldbuilder when clicking a node (replaces simple node detail pane)

**Phase 4 — Relationship graph panel** *(✅ 2026-06-12)*
- [x] Add lightweight SVG graph panel inline in detail pane (node profile accordion, quest detail, NPC detail)
- [x] Populate from `WBAPI.location.profile()` + `WBAPI.quests.chain()` + `_questsByNpc` data
- [x] Nodes clickable → switchTab + selectQuest/selectMapNode/selectNpc; hover highlight

---

### §WORLDBUILDER-02-F. Architectural Suggestion List

Items that arise from the investigation-mode design and should feed into §ARCH-01/§ARCH-02:

1. **Quest operational class field** — add `_class` to UQF schema (§ARCH-01). Derived at load time by `_classifyQuest()`, not stored in source. Classification is deterministic from existing fields.

2. **Arc ID field** — quests currently encode arc membership in their key prefix (e.g., `quest_wis_03` → arc `quest_wis`). Make this explicit: add `arc: 'quest_wis'` as a first-class UQF field. Enables arc-level sorting, ordering, and chain queries without string-splitting heuristics.

3. **NPC–quest relationship index** — WBAPI already has `_questsByNode` but no `_questsByNpc`. Add `_questsByNpc` index (NPC key → quest IDs that reference it) in `_buildIndexes()`. Currently this is done by regex scan of raw source; a first-class index makes it O(1).

4. **Terrain–node index** — `WBAPI.worlds.monsterList(terrain)` exists but there is no `WBAPI.worlds.nodeList(terrain)` — the list of all nodes whose `name` field equals a terrain key. Add this to `_buildIndexes()` as `_nodesByTerrain`.

5. **Waypoint-node second index** — `_questsByNode` currently indexes only `activateNode`. Add `_questsByWaypoint` for `waypointNode` so both activation point and completion point are reachable in O(1). This makes the Location Profile card complete.

6. **Flag-to-class map** — for a given flag (e.g., `catKingDefeated`), show: which quest class wrote it, and which quest classes read it. Supports Investigation Mode's "what does changing this flag break?" view.

7. **Mission brief export** — `WBAPI.quests.brief(id)` returns a human-readable one-paragraph summary of a quest: class, node, NPC, stat check if any, upstream deps, downstream effects. Used in investigation card and exportable as game design doc.
- [ ] worldbuilder.html Quest Editor shows real-time advisory warnings while editing

---

## §BACKLOG — Outstanding Tasks (updated 2026-06-12)

A consolidated register of all open work across the project. Organized by domain. Items carry a priority tier: **P1** (blocks other work or has active dependencies), **P2** (planned, sequenced), **P3** (unscheduled / speculative).

---

### BACKLOG-A. Tooling — WBAPI + Worldbuilder

**P1 — Immediately actionable:**

- [x] **§WORLDBUILDER-02 Phase 2 — Mission classification:** Add `_classifyQuest(q)` to wbapi-core.js (10 operational classes; survival not auto-detectable). Add `WBAPI.quests.byClass(cls)`. Class filter in worldbuilder sidebar. Class badge in quest list and detail header. *(✅ 2026-06-12)*

- [x] **§WORLDBUILDER-02 Phase 3 — Location Profile card:** `WBAPI.location.profile(nodeCode)` — extends `location.get()` with quest list w/ classes, NPC quest counts, flag reads/writes at node. Render as Location Profile card in worldbuilder. Also: `_questsByNpc` + `_questsByWaypoint` indexes added to wbapi-core.js; `/api/location/:code` enriched with same data. *(✅ 2026-06-12)*

- [x] **§WORLDBUILDER-02 Phase 4 — Relationship graph panel:** SVG radial graph in node/quest/NPC detail panes. Node→adjacent+quests+NPCs; Quest→activateNode/waypointNode/NPC/arc siblings/upstream/downstream; NPC→home node+quests. Clickable nodes navigate via switchTab. `selectNpc()` helper added. *(✅ 2026-06-12)*

- [ ] **§ARCH-02 Phase 2 — Quest creation flow:** Add `WBAPI.quests.create(questObj)` (validates then adds). Add operand builder UI in worldbuilder Quest Editor. Show `quests.chain()` upstream/downstream in Quest Editor. *(Depends on: §ARCH-02 Phase 1.)*

- [ ] **§WORLDBUILDER-01 — Visual grid editor:** Full canvas-based node map editor with node detail inspector, exit bidirectional editing, collision detection. See full spec in §WORLDBUILDER-01-A through -D. *(Depends on: §WORLDBUILDER-02 Phase 1 for cross-ref panel integration.)*

- [ ] **§EDITOR-01 — Quest creator UI:** Form-based quest creator with type-aware fields, flag dependency graph, storyRender block generator, token item manager, template presets. See full spec in §EDITOR-01-A through -G. *(Depends on: §ARCH-02 Phase 1 for operand validation.)*

**P2 — Deferred / unscheduled:**

- [ ] **§WORLDBUILDER-02 Phase 4 — Relationship graph:** Canvas/SVG graph panel showing entity neighborhood. Nodes clickable. *(Depends on: Phase 3.)*
- [ ] **§ARCH-02 Phase 3 — Escort + party runtime:** `S.party`, `escort` pickup/dropoff, `talk_party` in inventory panel. *(Depends on: Phase 2.)*
- [ ] **§ARCH-02 Phase 4 — Legacy quest conversion:** Audit all 210 quests with `toOperands()`. Convert 59 skill_check quests first (most uniform). Convert §HUNT-01 and §SPARK-01 as proof-of-concept. *(Depends on: Phase 2.)*
- [ ] **§ARCH-01 Phases 2–5:** Migrate quest arcs to UQF one by one (WISDOM → SPARK → ALCHEMY → main chain). Remove `completeFn`/`onPass` closure pattern. Export UQF JS literals from worldbuilder. *(Long-term.)*

---

### BACKLOG-B. Game Content — Unimplemented Arcs

**P1 — Specced and ready:**

- [ ] **§SPARK-01 — The Harmony Chain (5 quests):** Full spec in quest.md §SPARK-01 and plan.md §SPARK-01. Quests: `quest_spark_01–05`. Nodes: DK, MS. State flags: `smaltBefriended`, `pipMet`, `bioluminescentParasiteFound`, `whodunitSolved`, `wrenpemburyInconsistencyNoticed`, `aldousConfessed`, `harmonyChainComplete`. Token objects: Smalt's Trust, Pip's Friendship Bead, Clot's Glow, Letter of Safe Passage, Letter of True Passage (King's Writ destroyed). Inspector Aldous Wren-Pembury becomes recurring ally NPC after §SPARK-01 close. *Self-contained arc, no prerequisites beyond existing node access.*

- [x] **Combined monster rename save:** commoner → "Rabid Monkey", npc_merchant → "Badger" — applied in one `node -e` session, single save. *(✅ 2026-06-12)*

**P2 — Unscheduled:**

- [ ] **§SPARK-01-H — Naval Extension (Deep Warmth Eel):** Non-aggressive CR 4 Deep Warmth Eel at open sea between DK and LW. Four-phase hunt (strange stillness → investigation → confrontation → escort). Resolution: escort to deeper trench, not kill. Reward: two pirate crews owe a debt, sea route unlocks. *(Depends on: §SPARK-01 complete, `harmonyChainComplete` flag set.)*

- [ ] **§WISDOM-01 — Keel thread close:** quest_wis_03 identified that Keel was protecting Baltic sea route survey data from the navigator's notes. This is a partial resolution only — Keel took the notes, their destination is unknown, the navigator is missing. A future arc (unspecced) must close this thread. Candidate: an arc at an eastern Baltic node where the survey data surfaces. *(Unspecced — requires new arc design.)*

- [ ] **§GR-D Froberger Entry 42 (NG+ deferred):** The blank page filled on second playthrough. Deferred from §GR implementation. *(Requires NG+ state tracking, currently unsupported.)*

- [ ] **Covenant Keeper Ending:** Referenced across §GR-D (all six grief arcs converge here; each person's name is spoken as a receipt of witnessing). Not yet implemented as a narrative endpoint. Requires: all six grief arcs complete, a final node or storyRender event, the "naming ceremony" dialogue. *(Depends on: §GR complete, §SPARK-01 complete for Aldous/harmony thread.)*

---

### BACKLOG-C. Design + Architecture Decisions (non-implementation)

- [ ] **Arc ID as first-class UQF field:** Currently arc membership is inferred from quest key prefix (`quest_wis_03` → arc `quest_wis`). Add explicit `arc: 'quest_wis'` field to UQF schema. Enables arc-level sorting without heuristics. *(Feed into §ARCH-01 Phase 1.)*

- [ ] **`_questsByNpc` index in WBAPI:** NPC key → quest IDs that reference it. Currently done by regex scan; a first-class index makes it O(1) and enables investigation card NPC panels. *(Feed into §WORLDBUILDER-02-F item 3.)*

- [ ] **`_nodesByTerrain` index in WBAPI:** Terrain key → list of node codes whose `name` field equals that terrain. No lookup currently exists. *(Feed into §WORLDBUILDER-02-F item 4.)*

- [ ] **`_questsByWaypoint` second index:** Currently `_questsByNode` indexes only `activateNode`. Add `_questsByWaypoint` for `waypointNode`. Makes Location Profile cards complete for completion-point queries. *(Feed into §WORLDBUILDER-02-F item 5.)*

- [ ] **§FUTURE-01 Saul/Paul arc — canonical placement decision:** This arc is fully specced and was implemented (§FUTURE-01 section). The design decision outstanding is how its tone and register sits relative to the Birka/Tilbury/Visby world — specifically whether Acts-fidelity creates a tonal discontinuity. See §BACKLOG-D thematic audit note. If the arc is to remain, the integration point is the existing Malta/Rome nodes; if pulled, those nodes should stand alone.

---

### BACKLOG-D. Thematic Audit Note

*See §BACKLOG-E below for the full theme review. Outstanding design question:*

The current game has two registers that coexist:

1. **Chrétien register** — grief enacted through objects, silence, small domestic actions. Brynn's cup. Connie's key ring. The void that expresses itself through supply chains and cat factions. The Harmony Chain (kindness → harmony, monster = friendly). Keel's omission. Inspector Wren-Pembury's impossible backstory. This register is character-first, and its resolutions are receipts, not victories.

2. **Acts fidelity register** — §FUTURE-01, conversion mechanics, Acts/Pauline canon adherence. This register is history-first and its resolutions are transformations.

These two registers are currently adjacent without a seam. The question is whether to write a seam (a bridging character who exists in both registers) or to let them be two distinct world zones. The Covenant Keeper ending is the natural seam candidate — it names people from both zones.

*Decision deferred. Flag for next major arc design session.*

---

### BACKLOG-E. Unified Theme Review (2026-05-29)

Every major implemented arc and every PLANNED arc was reviewed against the project's core thematic vocabulary. Summary:

**Core vocabulary (all arcs that use it):**

| Theme | Arcs |
|-------|------|
| Grief enacted through objects, not declared | §GR, §SPARK-01 (Inspector), §WHODUNIT-01, §WISDOM-01 |
| Corruption as infrastructure (void moves through supply chains) | §GR, §DUNGEON-01 (CY/CQ corruption chain), all Cat faction arcs |
| Kindness as the operative skill (not violence) | §SPARK-01, §SPARK-02, §HUNT-01 ("fear → understanding"), §HUNT-02 |
| Institutions that fail silently | §NAVAL-01 (Keel), §PORT-01 (Saltwick suppressed history), §WISDOM-01 (Senate Building) |
| Witnessing as resolution | §GR (Connie/Aldo scene; Kenickie receipt), Covenant Keeper ending, §WHODUNIT-01 |
| The friendly monster (assumptions inverted) | §SPARK-01 (Warmth eel), §HUNT-01 (creature is spiritual, not feral), §DUNGEON-01 (mimic meadows) |

**Arcs with strong thematic coherence:** §GR, §SPARK-01, §SPARK-02, §HUNT-01, §HUNT-02, §NAVAL-01, §PORT-01, §WHODUNIT-01, §ALCHEMY-01, §WISDOM-01, §DUNGEON-01 (thematically anchored via hero origin + shadow room + sacrifice gate).

**Arcs with partial or conditional coherence:**

- **§SPARK-01-H (Naval Extension):** Uses the "friendly monster" theme correctly. The eel as the resolution agent for a human social problem (pirate cooperation) is thematically sharp. *Coherent.*

- **§FUTURE-01 (Saul/Paul arc):** Uses transformation as its primary register, not grief-through-objects. The conversion mechanic is conceptually distinct from the witnessing model. *See §BACKLOG-D.* The road-to-Damascus section is internally coherent; the question is whether "transformation that rewrites identity" and "grief that does not resolve" are in productive tension or in contradiction. The arc currently treats them as separate world zones rather than as two expressions of a shared theme. This is fine architecturally but could be richer if the tension were made explicit.

- **§DUNGEON-01 — Loop Heart choice room + Sacrifice Gates:** These are mechanically the most game-like sections. They fit thematically via "what you carry shapes what you find" (the sacrifice gate asks the player to give up something they value to advance). *Thematically coherent, mechanically legible.*

**One gap:** No arc currently addresses the *restoration* side of witnessing. All grief resolutions are receipts (acknowledgment), not rebuilds. Fishmonger's Row does not rebuild. The Covenant Keeper ending names people, does not heal them. The §SPARK-01 chain does not undo the Inspector's lost years. This is structurally correct for the Chrétien register — but it means the world has no arc about what comes after witnessing. The Keel thread close (BACKLOG-B) is the natural candidate for this: if the Baltic survey data is recovered, something lost to institutional silence actually returns. *Suggestion: design the Keel closure arc explicitly as the "after witnessing" arc.*

---

### BACKLOG-F. API-CLI Tooling Follow-Ups (2026-06-05)

- [ ] **`wb import` endpoint verification:** `wb import` calls `POST /api/import/book` — verify the endpoint is actually wired into the server route table (`wbapi-server.js`) and test with a real book JSON before relying on it in production.
- [ ] **`wb import` synopsis line:** Update `HELP` text in `wb` / `api.sh` to match the full flag set (verify `--out` and others pass through correctly).

---

### §MBIT-02-E. Token as gate key (alternative to separate `_hasItem` condition)

The existing `_hasItem('Trade Seal')` pattern and `KEY_EVENTS[].item` patterns could unify with mission bit tokens. A quest with `checkPassFlag:'tradeSealReceived'` would produce a "Trade Seal Received Token" — but the token's `name` doesn't match `_hasItem('Trade Seal')` since the naming differs.

Resolution options:
1. Add `keyPhrase` field to token: `{ ..., keyPhrase:'Trade Seal' }` — `_hasItem` checks both `name` and `keyPhrase`
2. Keep the two systems separate: KEY_EVENTS use named items; mission bits use tokens. They serve different purposes.

**P3 — Decision pending. Leaning toward keeping systems separate: KEY_EVENTS items are physical objects found or purchased; mission bit tokens are event receipts. Different ontology.**

---

## §FISH-01 — Fish + Lake Magic in Worldbuilder + API (2026-05-29)

### Implemented

**WORLDBUILDER anchors (roll2hit-v3.html):**
- `// ◆◆◆ WORLDBUILDER:FISH_DB:START/END ◆◆◆` — wraps `FISH_POOL` (20 day fish, rank 1–20) and `NIGHT_FISH_POOL` (5 nocturnal species, ranks 6–14)
- `// ◆◆◆ WORLDBUILDER:LAKE_MAGIC:START/END ◆◆◆` — new `LAKE_MAGIC_DB` const with 8 lake magic items

**wbapi-core.js:**
- `extractArr(block, name)` — array-literal parser (like `extractObj` but for `[...]`), with `//` and `/* */` comment skipping
- `parseArr(block, name)` — wraps `extractArr` for safe eval
- `WBAPI.fishPool`, `WBAPI.nightFishPool`, `WBAPI.lakeMagicDb` — loaded on `WBAPI.load()`

**wbapi-server.js API routes:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET`  | `/api/fish` | List all 25 fish; filter `?rank=N` or `?night=true/false` |
| `GET`  | `/api/fish/:key` | Single fish + connections (drop, monster) |
| `POST` | `/api/fish` | Create new fish (day or night pool) |
| `POST` | `/api/fish/simulate` | Run full 3-phase fishing roll server-side; returns fish + monster stats |
| `GET`  | `/api/lake-magic` | List all 8 magic items; filter `?effect=` or `?minRank=` |
| `GET`  | `/api/lake-magic/:key` | Single magic item |
| `POST` | `/api/lake-magic` | Create new magic item |

**SCHEMAS:** `fish` and `lake_magic` schemas added to `GET /api/schema`.

**worldbuilder.html — Fishing Sim Easter Egg (Dice Lab):**
- "🪣 Yugurt Lake Fishing Sim" collapsible section in the Dice Lab
- 5 modifier inputs: DEX mod, Bait Catch, Bait Type, Luck mod, Rod bonus
- Calls `POST /api/fish/simulate` → renders 3 accordion rows (Phase 1 Cast, Phase 2 Catch, Phase 3 Type) plus final result card with fish name + monster stats
- Offline fallback: local rolls if API unavailable

**LAKE_MAGIC_DB schema:**
```
effect: ac_bonus | atk_bonus | fishing_dc | first_strike | night_type | all_ability
bonus formula: base + floor(level × levelScale) + floor(luckMod × luckScale)
```

**Implemented (P2 — completed):**
- §DROP-03 ✅ COMPLETE 2026-06-12: `_lakeMagicBonuses()` implemented. All 6 effect types live. Grant path live in `battKillEvent()` — 20–55% chance by rank, unique per item. ✅ LAKE_MAGIC_DB effects are dropped in-game.

**Pending (P3 — unscheduled):**
- Add `POST /api/fish/simulate?advantage=true` for bait advantage rolls
- Worldbuilder quest pane: "Produces: 🪬 Token" display (§MBIT-02-C P3)

---

## §WBAPI-01 — Full Array Export + API-First Write Workflow (📋 PLANNED)

**Status:** 📋 PLANNED — written 2026-05-29  
**Goal:** Make every large data array in `roll2hit-v3.html` readable and writable via `wbapi-server.js`. The HTML is the single source of truth; all creation and mutation goes through the API. Direct HTML edits are a fallback of last resort.

### §WBAPI-01-A. Problem Statement

Currently, most data writes still happen by editing `roll2hit-v3.html` directly. This is fragile: a missed comma, wrong key name, or quote mismatch can silently break the game. The WBAPI already supports `POST /api/save` (write back to disk) and `POST /api/reload`, and has `PUT` for node/quest/monster/npc/terrain entities. What's missing:

1. **Create endpoints** for terrain, monster, and condition items (WORLD_DB, MONSTER_POOL, CONDITION_ITEMS)
2. **Bulk export** of every array as raw JSON and as pasteable JS literal
3. **Full-array PATCH** — replace or merge a complete named constant via the API
4. **Node.js / V8 runability** — extracted code sections should execute as standalone modules

### §WBAPI-01-B. Array Export Targets

| Constant | Current API coverage | Target |
|----------|---------------------|--------|
| `NODE_MAP` | `GET /api/list/node`, `GET /api/node/:id`, `PUT` | ✅ readable; add `GET /api/export/node_map` (raw JS literal) |
| `QUEST_DB` | `GET /api/list/quest`, `GET /api/quest/:id`, `PUT`, `POST` | ✅ readable; add `GET /api/export/quest_db` |
| `MONSTER_POOL` | `GET /api/list/monster`, `GET /api/monster/:id`, `PUT`, fork, rename | ✅ readable; add `GET /api/export/monster_pool` + `POST /api/monster` (create) |
| `MONSTER_DROPS` | `GET /api/monster/:id` (included in detail) | Add `GET /api/export/monster_drops` + `PUT /api/monster/:id/drop` |
| `WORLD_DB` | `GET /api/list/terrain`, `GET /api/terrain/:id`, `PUT` | Add `POST /api/terrain` (create) + `GET /api/export/world_db` |
| `CONDITION_ITEMS` | none | Add `GET /api/list/condition`, `GET /api/condition/:id`, `PUT`, `POST`, `GET /api/export/condition_items` |
| `EPIC_BOSS_POOL` | none | Add `GET /api/list/epic_boss`, `GET /api/epic_boss/:id`, `PUT`, `POST` |
| `FISH_POOL` + `NIGHT_FISH_POOL` | `GET /api/fish`, `GET /api/fish/:id`, `POST` | Add `GET /api/export/fish_pool` |
| `LAKE_MAGIC_DB` | `GET /api/lake-magic`, `GET /api/lake-magic/:id`, `POST` | Add `GET /api/export/lake_magic` |
| `NPC_DIALOGUES` | `GET /api/list/npc`, `GET /api/npc/:id` | Add `PUT /api/npc/:id/dialogue` (per-state patch) |
| `FROBERGER_JOURNAL` | none | Add `GET /api/list/journal`, `GET /api/journal/:id`, `POST /api/journal` |
| `_S_DEFAULTS` | none | Add `GET /api/defaults` — read-only snapshot of all 194 story flags with types and defaults |

### §WBAPI-01-C. `GET /api/export/:collection` — Raw JS Literal Endpoint

Returns the named constant as a raw JS literal string that can be pasted directly into `roll2hit-v3.html` or `require()`d by a Node script:

```bash
# Export full WORLD_DB as pasteable JS literal
./api.sh export world_db

# Export MONSTER_POOL as JSON
./api.sh export monster_pool --format json

# Export all collections as a standalone Node module
./api.sh export all --format module --out world.js
node -e "const W = require('./world.js'); console.log(Object.keys(W.MONSTER_POOL).length);"
```

`?format=module` wraps the export in `module.exports = { NODE_MAP, QUEST_DB, MONSTER_POOL, ... }` so it runs on Node without a browser.

### §WBAPI-01-D. `POST /api/terrain` — Create Terrain Entry

```bash
./api.sh post terrain key=forum_romanum label="Forum Romanum — Ancient Civic Heart" \
  icon=🏛 monsters='["golem","graveir","penitent","higher_vampire"]'
```

Server validates monster keys against `MONSTER_POOL`, writes entry to `WORLD_DB` anchor block, calls `POST /api/save` automatically.

### §WBAPI-01-E. API-First Workflow — Reference Curl Sequences

**Add a terrain entry:**
```bash
./api.sh post terrain key=new_terrain label="New Place" icon=🗺 monsters='["goblin","bandit"]'
./wbapi-toggle.sh restart
./api.sh audit
```

**Create a quest (NPC required):**
```bash
./api.sh post quest id=quest_my_01 type=main npc=aldric title="My Quest" \
  activateNode=CY objectiveText="Do the thing."
```

**Inspect before planning:**
```bash
./api.sh audit --raw | jq '.items[] | select(.level=="error")'
./api.sh list terrain --raw | jq '.[].key'
./api.sh list node --raw | jq '.[].code'
```

### §WBAPI-01-F. Implementation Checklist

- [ ] **Phase 1 — Create endpoints for missing types:**
  - [ ] `POST /api/terrain` — create terrain entry (validate monster keys)
  - [ ] `POST /api/monster` — create monster entry
  - [ ] `GET /api/list/condition` + `GET /api/condition/:id` + `PUT` + `POST`
  - [ ] `GET /api/list/epic_boss` + `GET /api/epic_boss/:id`
  - [ ] `GET /api/list/journal` + `GET /api/journal/:id` + `POST /api/journal`
  - [ ] `GET /api/defaults` — read all 194 `_S_DEFAULTS` fields

- [ ] **Phase 2 — Export endpoints:**
  - [ ] `GET /api/export/:collection` — supported collections: `node_map`, `quest_db`, `monster_pool`, `monster_drops`, `world_db`, `fish_pool`, `lake_magic`, `condition_items`
  - [ ] `?format=json` (default) — JSON array/object
  - [ ] `?format=js` — raw JS literal (the const block as it appears in HTML)
  - [ ] `?format=module` — `module.exports = { ... }` wrapper for Node require

- [ ] **Phase 3 — Full-array PATCH:**
  - [ ] `PUT /api/collection/:name` — replace or deep-merge a complete named constant
  - [ ] Validates structure against known schema before writing
  - [ ] Backs up original block to `.bak` comment before writing

- [ ] **Phase 4 — worldbuilder.html write tab:**
  - [ ] "Create" forms for terrain, monster, quest using API-first workflow
  - [ ] Shows curl equivalent for each action (copy button)
  - [ ] "Export" panel: select collection, format, download or copy to clipboard

- [ ] **Phase 5 — Standalone Node module:**
  - [ ] `GET /api/export/all?format=module` produces a complete game-logic module
  - [ ] Add `wbapi-extract.js` CLI: `node wbapi-extract.js --out=world.js` (no server needed; reads HTML directly like `parse-nodes.js`)
  - [ ] Document how to run game logic in Node: `const W = require('./world.js'); W.NODE_MAP['CY']`

---

## §1367 — The Year Is 1367 AD: Historical Setting Canon (📋 PLANNED)

**Canonical game year: 1367 AD.**

All in-game time, political factions, cities, trade routes, and named historical figures should be consistent with the world as it existed in 1367 AD. This section maps the six major historical events of that year to quest design opportunities, and poses the clarification questions that must be answered before integration begins.

---

### §1367-A. Historical Anchor — What Was True in 1367 AD

| Event | Where | Significance to the game |
|-------|-------|--------------------------|
| **Battle of Nájera** (Apr 3) | Castile, Spain | Edward the Black Prince leads English mercenaries to victory. Routier companies are everywhere. |
| **Tamerlane rising** | Transoxiana (Central Asia) | 31 years old, consolidating power. The eastern threat is not yet war — it is whisper and rumor. |
| **Ottoman expansion** | Balkans | Murad I holds Adrianople (Edirne) as European capital. The Balkans are actively contested. |
| **Hanseatic League peak** | Baltic / North Sea | Birka and Visby are Hanseatic-adjacent cities. Trade, wool, amber, salt, herring. Political leverage. |
| **John Wycliffe at Oxford** | England | Early heresy. Questioning papal authority. Not yet condemned — dangerous ideas moving through clergy. |
| **Black Death aftermath** | All of Europe | ~1/3 of Europe dead since 1347. Cities undermanned. Inheritance disputes. Plague pits. Survivor guilt. |

**Visby note:** Visby was sacked by Valdemar IV of Denmark in 1361. By 1367 it is six years into its decline from a Hanseatic powerhouse to a contested, partially ruined port. This is already in the game — the arc structure fits perfectly.

**Birka note:** Historically Birka was abandoned ~970 AD. In this game it is treated as a persistent fictional city in the Hanseatic Baltic world, elevated to 1367 status. No apology needed — this is D&D 5e, not a textbook.

---

### §1367-B. The Six Events as Quest Seeds

#### 1. The Routiers — Mercenary Companies (from Nájera)

The *routiers* (French) and *condottieri* (Italian) are freelance mercenary bands roaming Europe after every truce and treaty. They are soldiers with no war — dangerous, experienced, and available for hire or extortion.

**Design seed:** A routier company has set up near a node and is extracting "protection" from local merchants. The player can fight them, hire them, or expose who is paying them. One routier captain may be a named NPC with a Hundred Years' War backstory.

**Clarification needed:**
- [ ] Is the routier faction a one-off quest or a recurring faction with multiple nodes?
- [ ] Does the Black Prince himself appear (as NPC, rumor, or distant authority), or only his soldiers?
- [ ] Do routiers have a home node, or do they migrate between nodes seasonally?

---

#### 2. Tamerlane — The Eastern Whisper

Tamerlane is not yet the destroyer of cities he will become by 1380. In 1367 he is a warlord consolidating Transoxiana — present as rumor, refugee, and displaced scholar rather than direct threat.

**Design seed:** A refugee scholar from Samarkand arrives at a Mediterranean node carrying a scroll Tamerlane's men were hunting. The scroll contains something (a map, a heresy, a formula). The quest is to understand what it contains before Tamerlane's agents arrive.

**Clarification needed:**
- [ ] Is Tamerlane a named villain who eventually appears (in a late-act node), or kept permanently offscreen as rumor?
- [ ] Does the eastern threat connect to the Shattered Codex arc (the Codex itself could be what Tamerlane seeks)?
- [ ] Which node receives the Samarkand scholar — a Mediterranean city (Jerusalem, Athens) or a trade hub (Visby, a Hanseatic port)?

---

#### 3. The Ottoman Balkans — Murad I's Expansion

The Balkans in 1367 are a patchwork of contested Christian kingdoms and Ottoman-held territory. Adrianople is Ottoman. Murad I is methodical and patient. Local Serbian and Bulgarian lords are making desperate deals.

**Design seed:** A Balkan noble is at a node, negotiating secretly with an Ottoman envoy. The player stumbles into this. The quest branches: expose the negotiation (destabilize the region, gain a reward from the Church), assist it (gain Ottoman favor, anger the Church), or steal the treaty document and sell it to the highest bidder.

**Clarification needed:**
- [ ] Does the Ottoman faction have a node on the map, or appear only as quest NPCs?
- [ ] Is Murad I a named NPC (distant, political) or kept as a historical backdrop force?
- [ ] Does the Balkan arc connect to the existing Middle East map nodes (Jerusalem, Athens)?

---

#### 4. The Hanseatic League — Trade as Power

The Hanseatic League in 1367 is at its apex. It controls Baltic and North Sea trade — wool, herring, amber, salt, timber. It has its own navy, its own legal system, and its own foreign policy. Birka and Visby sit in its orbit.

**Design seed:** A Hanseatic factor (merchant-agent) at Birka is withholding grain shipments to a northern node as a political lever. The local population is hungry. The quest is to break the embargo — by theft, negotiation, forgery of trade documents, or finding an alternative supply route.

**Clarification needed:**
- [ ] Is the Hanseatic League a faction with a disposition score (like a merchant guild), or purely quest-context flavor?
- [ ] Does Visby's 1361 sacking appear as past lore in node descriptions, or as an active unresolved quest arc?
- [ ] Are there Hanseatic trade route nodes — ports along the Baltic coast — that should be added to the map?

---

#### 5. John Wycliffe — The Heresy at Oxford

Wycliffe is teaching that the Bible should be in English (not Latin), that the Pope's temporal power is illegitimate, and that clergy who sin forfeit their authority. This is not yet the Protestant Reformation — it is one dangerous scholar at one university, and the Church is watching.

**Design seed:** A traveling friar arrives at a node carrying a handwritten pamphlet in the vernacular. He asks the player to deliver it to a local monastery without the bishop's men intercepting it. The pamphlet's content is Wycliffe's argument — the player may read it, burn it, deliver it, or sell it to the bishop.

**Clarification needed:**
- [ ] Is Wycliffe's heresy a single quest or a recurring philosophical thread (a book that reappears across acts)?
- [ ] Does the Church appear as an antagonist faction with quests on both sides (heresy vs. orthodoxy)?
- [ ] Does this connect to the existing Codex arc — could the Shattered Codex itself be a suppressed vernacular scripture?

---

#### 6. The Black Death Aftermath — The Hollow World

By 1367 the first wave is twenty years past but recurring outbreaks continue. One third of Europe is dead. The survivors live in a world of:
- Inherited land with no heirs — abandoned manor nodes
- Flagellant processions — NPCs performing public penance
- Plague pits that were never properly sealed
- Labor scarcity — peasants have leverage they never had before
- Survivor guilt — characters who lived when their families did not

**Design seed:** A node has been abandoned — its population died in a 1363 recurrence. A merchant wants to claim the land. The player must clear the node (the dead were not buried correctly — undead encounter), determine who the legal heir is (a quest chain through Church records), and decide who gets the land: the merchant, the distant heir, or the Church.

**Clarification needed:**
- [ ] Does plague appear as an active mechanic (infection risk, quarantine nodes), or only as historical backdrop in node descriptions?
- [ ] Are flagellants an NPC type — wandering, hostile to merchants and rationalists, occasionally violent?
- [ ] Does the abandoned node exist as a map location (a hollow/ruined terrain type), or only in quest flavor text?

---

### §1367-C. Universal Setting Directives

Once the above clarifications are resolved, these changes become universal across the game:

1. **Year stamp** — add `const GAME_YEAR = 1367;` to `_S_DEFAULTS`. Display in UI as "Anno Domini MCCCLXVII" or simply "1367 AD" in appropriate nodes.

2. **Node description anachronism audit** — scan all 144 node `desc` fields for technology, language, or political references inconsistent with 1367 AD. Flag and rewrite.

3. **Faction system** — introduce a lightweight faction disposition table for: `Hanseatic League`, `The Church`, `Ottoman Court`, `Routier Companies`, `Crown of England`. Each quest that touches a faction shifts disposition ±1. Disposition gates certain quest options.

4. **Calendar events** — the Battle of Nájera is April 3. If the game tracks months (via the existing hour system), certain historical events could trigger as the player's in-game date passes the anniversary. Optional.

5. **Named historical figures as NPCs** — candidates: Edward the Black Prince (distant authority, Nájera rumor), John Wycliffe (the scholar, Oxford), Murad I (Ottoman envoy, not direct), Tamerlane (offscreen threat, refugee NPCs only). None appear as combatants in Act I.

---

### §1367-D. Clarification Queue — **ANSWERED ✓**

All 8 questions answered. Integration may proceed.

| # | Question | **Answer** |
|---|----------|-----------|
| 1 | Literal 1367 or fantasy-analog? | **Literal.** Real place names kept — Birka, Visby, Adrianople, Ragusa, Oxford, Castile. This is 1367 AD on the actual Earth, rendered as a D&D 5e adventure world. |
| 2 | Which events become major arcs? | **All 6.** Every event ties to existing node codes. No event is background-only. Each vignette becomes a quest arc anchored to a node already on the map or a new Baltic trade node. |
| 3 | Historical figures as NPCs or offscreen? | **Named NPCs, on stage.** The Black Prince, Wycliffe, Murad I, and Tamerlane appear as named figures the player can encounter, receive orders from, or work against. Not combatants in Act I — they are distant authority or quest-givers. By Act III they are present. |
| 4 | Black Death gameplay mechanic or lore only? | **Full mechanic.** Plague Walkers are combat encounters. Infection is a state flag (`plague_exposed`). Exposure triggers a CON save (DC 13). Failed save adds `Exhaustion 1` and a mission bit. Cure requires a quest. Nodes in the aftermath zone have modified monster tables. |
| 5 | Hanseatic League faction disposition? | **Yes.** `faction_hansa` disposition score (−5 to +5). Affects: trade quest availability, node entry permissions in Baltic ports, NPC dialogue, prices. Score changes on quest outcomes. |
| 6 | Tamerlane connects to the Shattered Codex? | **Yes.** The Codex fragments originate in Transoxiana. Tamerlane's consolidation of Samarkand scattered its keepers westward — that is why the Codex is shattered and its pieces are in Europe. The Codex backstory gains a paragraph pointing east. |
| 7 | Add Baltic coast trade route nodes? | **Yes, more trade routes.** New nodes: Lübeck (LB), Danzig (DZ), Riga (RG), Bruges corridor waypoint (BG). Connected to existing Birka (BK) and Visby (VS) nodes. Trade route quest chain threads through all of them. |
| 8 | Church as dual-sided faction? | **Yes — and more.** The Church is not just a faction: it is the total human condition. Devotion, allegiance, fear, mercy, guilt, transcendence. Two sub-tracks: `faith_orthodox` (inquisitor, bishop, pilgrim quests) and `faith_reform` (Wycliffe pamphlet, itinerant preacher, heresy trial quests). A third track `faith_folk` covers saints, relics, magic springs, and monster-lore. All three interact. A player deep in `faith_folk` gets different dialogue from priests than a player deep in `faith_orthodox`. Monster encounters in church ruins have modified outcomes based on faith tracks. Fantasy and adventure — especially those with monsters — live inside the religious world of 1367, not outside it. |

### §1367-E. Locked Design Decisions (derived from answers)

1. **`const GAME_YEAR = 1367;`** added to `_S_DEFAULTS`. Display: `"Anno Domini MCCCLXVII"`.
2. **Plague mechanic:** `plague_exposed` flag + CON DC 13 save + `Exhaustion 1` mission bit. Cure quest required to clear.
3. **Hanseatic faction:** `faction_hansa` score (−5 to +5) stored in player state. Affects trade nodes BK, VS, LB, DZ, RG, BG.
4. **Faith triple-track:** `faith_orthodox`, `faith_reform`, `faith_folk` — each ±5. Stored in player state. Affects NPC dialogue, quest availability, monster encounter modifiers.
5. **New nodes to add:** LB (Lübeck), DZ (Danzig), RG (Riga), BG (Bruges waypoint) — trade route chain.
6. **Shattered Codex backstory:** Add one paragraph in Codex lore pointing origin to Transoxiana/Samarkand. Tamerlane's rise as the inciting event that scattered keepers westward.
7. **Historical NPCs in NPC schema:** Add Black Prince (BP), John Wycliffe (JW), Murad I (MI), Tamerlane (TL) to `BIRKA_NPCS` or equivalent NPC table.
8. **All 6 vignettes from `Year1367AD.md`** map to QUEST_DB entries. Node codes from those vignettes are authoritative.
9. **Node `LXVII67` — The Jester's Crossroads.** Secret easter egg node. `faith_folk` only. See §1367-F.

---

### §1367-F. Node LXVII67 — The Double Dab Faith Puzzle

**Code:** `LXVII67`  
**Name:** The Jester's Crossroads  
**Label:** LXVII  
**Faith track:** `faith_folk` (gated — requires `faith_folk >= 1` to enter)  
**API easter egg:** `GET /api/67` — returns node metadata and the puzzle hint

**The Lore:**  
At the edge of a forest road stands a painted post. No sign. A jester sits on a stone beside it, tossing a coin. He does not speak first. He does not ask a question aloud. He holds up two fingers — not in greeting, not in peace. Just two. Then he looks away.

**The Mechanic — Double Dab:**  
Two characters must each arrive at this node **separately** (not as a group action, no Help action allowed) and each independently:

1. **Self-serve:** Make a DC 10 Wisdom (Insight) check alone. No assistance.  
2. **Answer the unasked question:** Choose an option the jester never voiced. The correct answer is 67. It is not listed anywhere. It must be known.

On the **first** successful solo arrival → `faith_folk_seed` mission bit granted. Jester nods once.  
On the **second** successful solo arrival (same or different character) → `faith_folk_dab` mission bit granted. Jester dabs. The post opens. Reward drops.

**The Reward:**  
- `faith_folk +2` for both characters  
- A carved wooden coin stamped `LXVII` — a misc inventory item, no mechanical value, infinite bragging rights  
- Unlocks the jester as a recurring NPC in other `faith_folk` nodes (he remembers you)

**Quest entry:**
```
id:            quest_lxvii67
type:          skill_check
title:         The Jester's Crossroads
activateNode:  LXVII67
dc:            10
skill:         Wisdom (Insight)
retryable:     true
retryGateDays: 0
missionBits:   [faith_folk_seed, faith_folk_dab]
notes:         Two solo attempts required. No Help action. No hints given in-game.
```

**`GET /api/67`** returns:
```json
{
  "ok": true,
  "year": 1367,
  "leet": 1337,
  "port": 1367,
  "node": "LXVII67",
  "note": "67 > 69. self-serve. double dab. taps chest.",
  "faith": "faith_folk",
  "puzzle": "two must arrive alone and answer the same question without conferring. the jester does not ask it aloud.",
  "dab": "⁶⁷"
}
```

---

**Status:** ✅ ANSWERED — integration may begin  
**Cross-references:** `plan.md §GR` · `plan.md §FUTURE-01` (Saul to Paul arc, Middle East map) · `quest.md` · `lab-report-wbapi-evolution.md` · `Year1367AD.md`

---

## §TTS — macOS Text-to-Speech Session Protocol

When working in this project, Claude should follow these TTS conventions so the user can monitor progress without watching the screen.

### Git commits

After every `git commit`, run `say` with the commit message before moving on:

```bash
git commit -m "message" && say "message"
```

The automated hook in `~/.claude/settings.json` also fires `say` with the committed file names and a pipeline seed count after each commit.

### Asking the user to continue

Whenever the protocol calls for asking the user to type "continue" (e.g. mid-book processing, end of a work block, or before a major next step), first run:

```bash
say "continue, continue, continue!"
```

Then output the written prompt. This lets the user hear the pause point without reading the screen.

### Example — end of a processing pass

```bash
say "continue, continue, continue!"
# then output: "FCO part 2/3 done — Books 4–8 covered. Type 'continue' for part 3."
```

### Data audit loop — api-data-audit.md

The audit loop (`api-data-audit.md`) runs `/api/next-error` to find missing quest text and patches it via PUT. Each PUT now uses `saveAndVerify` (saves, reloads in-memory, confirms the written value — no process restart, no silent failures). The loop runs until `found: false` on both errors and warnings.

After each book completes:

```bash
git add -A && git commit -m "BOOK IMPORTED — BookName: N quests patched"
say "Book done. Commit sent. Continuing loop." &
```

Mid-loop after each individual PUT, speak the result:

```bash
say "Fixed quest_id. Verified on disk." &
```

Run `say` blocking — no `&` — so each announcement completes before the next request. Always announce commits and loop transitions out loud.

---

## §AUDIT-02 — NPC/Quest Connection Gap (📋 INVESTIGATE)

**Logged:** 2026-06-05 — discovered via new `./api.sh audit` validator rules  
**Status:** 📋 INVESTIGATE — do not fix blindly; understand patterns first

### Finding 1: 985 quests have no `npc` field (ERROR)

Every quest must be anchored to an NPC. The validator now flags this as an ERROR. The scope breaks down as:

**All 21 completed book imports — 35 quests each, 0 NPCs wired:**

| Book arc | Quests missing npc |
|----------|--------------------|
| lhr, lcy, lgw, gci, inv, bhd, sdq, plw, gdn, boo | 35 each |
| alf, ksu, cdg, vie, erf, hft, rkv, ost, arn, vby, rix | 35 each |
| blq (Decameron — partial) | 20 |

**Legacy arcs (pre-import, never had NPCs):**

| Arc | Count |
|-----|-------|
| quest (misc 24 unnamed) | 24 |
| quest_wis | 8 |
| mq (main quests) | 7 |
| quest_alch | 7 |
| quest_whisper, quest_glut, quest_wane, quest_inn, quest_cat, quest_tour | 6 each |

**Root cause:** The import scripts (`import_*.py`) created quest stubs but never populated `npc`. The NPC role was implicit in the vignette text but not stored as a structured field.

**Investigation questions before fixing:**
1. Do the book-arc nodes (e.g. `LHR`, `LCY`) already have NPCs registered in BIRKA_NPC who should own these quests?
2. For arcs with no named NPC, should a new NPC be created per-arc, or should quests reference the inline `node.npc` string?
3. Can `./api.sh list npc --node {CODE}` for each arc's `activateNode` reveal an already-registered NPC to wire in?

**Suggested fix workflow (when ready):**
```bash
# For each book arc, find the node and any existing NPC:
./api.sh location LHR     # shows NPCs registered at that node
./api.sh list npc --node LHR
# If an NPC exists, patch all quests for that arc:
./api.sh list quest --node LHR --raw | jq '.[].id' | xargs -I{} ./api.sh put quest {} npc=yael
# Run audit after each arc to confirm errors reduce
./api.sh audit --raw | jq '.errors | length'
```

---

### Finding 2: 13 NPCs have no quests (WARNING)

These NPCs exist in BIRKA_NPC with full dialogue entries but give no quests. They have no gameplay function beyond ambient dialogue.

| NPC key | Name | Node | Notes |
|---------|------|------|-------|
| `yael` | Guard Captain Yael Scheidemann | LHR | Core Birka — has NPC_DIALOGUES arc; quest arc planned (§CEREMONIA-03?) |
| `brynn` | Innkeeper Brynn Clerambault | TLL | Core Birka — has NPC_DIALOGUES arc; quest arc planned |
| `quill` | Bard Tomas Couperin | MHQ | Core Birka — has NPC_DIALOGUES arc; quest arc planned |
| `pachelbel` | Fence Pachelbel | LLA | Core Birka — has NPC_DIALOGUES; fencing/trade arc unwritten |
| `crov` | Pit Master Weckmann | HKG | Core Birka — pit combat arena NPC |
| `auros` | Commander Seraphine Bruhns | HKG | Core Birka — has story arc notes elsewhere |
| `ser_bardo` | Ser Bardo Albizzi | PSAGLD | Decameron import — created as NPC stub, no quests written yet |
| `ser_taddeo` | Ser Taddeo Borghini | PISNOT | Decameron import — same |
| `abramo_simone` | Abramo di Simone | GENWHS | Decameron import — same |
| `lapo_matteo` | Lapo di Ser Matteo | PSAFAB | Decameron import — same |
| `kyriakos_philanthropenos` | Kyriakos Philanthropenos | TRB | Book import stub |
| `georgios_sphrantzes` | Georgios Sphrantzes | CON | Book import stub — Byzantine node |
| `hamid_al_sarakhsi` | Hamid al-Sarakhsi | MRV | Book import stub |

**Two distinct groups:**

- **Core Birka 6 (yael/brynn/quill/pachelbel/crov/auros):** These are deeply characterised. They have NPC_DIALOGUES, story arcs planned in other §sections, and are waiting for their quest arcs to be written. Do not add placeholder quests. Write the real arcs.
- **Book-import stubs (ser_bardo etc.):** Created during Decameron/Byzantine imports. The quests exist in QUEST_DB but have no `npc` field pointing back to them (Finding 1). Fix: wire the existing quests → NPC, not create new quests.

**Quick check to run when investigating:**
```bash
# See what quests activate at each orphaned NPC's node:
./api.sh location PSAGLD    # ser_bardo's node — what quests are already there?
./api.sh location CON        # georgios_sphrantzes — Byzantine node
./api.sh --ai "which quests at node CON have no NPC, and which NPC at CON should own them?"
```

---

*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
