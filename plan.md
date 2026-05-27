## §GR — Grief Arc: The Vignette Layer

> **Status:** ✅ Implemented 2026-05-26 (Layer 78). FR node live at CQ.E. NPCs: `connie_tuna`, `aldo_sardino`. Quest chain: `quest_la_riva_01–03`. State flags: `connieMet`, `frCatKillCount`, `laRivaComplete`, `fishmongerRowRestored`. Vincenzo's Net drops at frCatKillCount ≥ 5. HTML: ~18,304 lines at implementation close.

### §GR-A. The Central Argument

Grief in *The Shattered Codex* is not a decorative layer. It is mechanically causal — a consequence of corruption, not a parallel story running alongside it.

The chain runs entirely through existing HTML:

**Void corruption (CY, Neon Undercity) → Merchant Cat faction void-touched → Taz Devils merge into Cat-King → Cat-King destroys Fishmonger's Row (3 city blocks) → Vincenzo Tuna dies in the destruction → Connie Tuna + Aldo Sardino grieve unwitnessed → Corrupted Cats colonize the rubble → grief-space becomes a second void-corruption vector → cycle feeds back upward into Birka surface**

The wound is already in the HTML. Jimmy Two-Tails: *"Last time: three city blocks. Three. Nobody's been back to Fishmonger's Row since."* Kenickie: *"My guy Vinnie's got a contact..."* and *"My guy Vinnie's got more next week. Maybe."* The La Riva arc writes the content of what nobody goes back to describe — and names why Kenickie says "maybe" with the trailing silence after it.

The grief arc asks: what does it mean to return to a place that grief has already colonized? What does it mean that the same void mechanism that runs through the Neon Undercity's neon corridors and data wraiths also runs through the Merchant Cat supply chain and comes out the other end as three blocks of rubble where a fishmonger's husband used to work?

### §GR-B. Characters

| Character | Role | Node | Status |
|-----------|------|------|--------|
| Connie Tuna | Widow, former fishmonger; carries Vincenzo's key | FR (CQ.E) | ✅ Implemented — Layer 78 |
| Aldo Sardino | Patriarch, old fishmonger; carries Vincenzo's folded net inside his coat | FR | ✅ Implemented — Layer 78 |
| Vincenzo "Vinnie" Tuna | Kenickie's contact; died when Cat-King attacked; referenced, never appears | — (retroactive) | ✅ Live: HTML lines 7857, 15265 |
| Kenickie Clawnickie Mancuso | Black market operator; carries the Vinnie reference | CQ (existing) | ✅ Implemented — Layer 75 |

**The Vinnie retrofit is cost-free.** The two existing Kenickie lines already name him. The grief arc does not require changing any Kenickie dialogue. It requires the player to encounter Connie and understand that "Vincenzo" and "Vinnie" are the same person. The reveal is delivered by register alone — Connie uses the full name; Kenickie uses the nickname. No disambiguation in the text. The reader connects them across the gap.

### §GR-C. Quest Architecture — "La Riva" (The Row)

**Prerequisites:** `catKingDefeated: true` (Q-CAT-06 complete). Kenickie's Black Market open.

| ID | Title | Activation | Completion | Reward |
|----|-------|-----------|------------|--------|
| `quest_la_riva_01` | "What Remains" | Kenickie post-Q-CAT-06: *"You should go see what's left of the Row. Connie's still there."* | Reach FR; Connie first dialogue | `connieMet: true` |
| `quest_la_riva_02` | "The Weight of a Net" | Connie at FR | Kill 5× corrupted_cat at FR + find Vincenzo's Net (guaranteed 5th drop) | 500gp + Aldo Friendly |
| `quest_la_riva_03` | "The Account Book" | Aldo at FR (after quest_la_riva_02) | Deliver `Old Tuna Account Book` to Kenickie at CQ | Kenickie Dear Friend + `fishmongerRowRestored: true` |

**Node FR — Fishmonger's Row:**
- Access: CQ.S → FR (new exit, unlocks after `catKingDefeated`)
- Terrain: `ruins` (existing type; re-uses terrain monster pool)
- Default battle: `corrupted_cat` × 4 (separate encounter from CQ default)
- NPCs: Connie Tuna (key: `connie_tuna`), Aldo Sardino (key: `aldo_sardino`)
- State flags: `connieMet`, `fishmongerRowRestored`, `laRivaComplete`

**Ending — Q-FR-03 complete:** Kenickie receives the account book. He looks at it. He does not say Vinnie's name. He says: *"Yeah. Okay. I'll hold onto this."* The Row does not rebuild. Aldo does not stop carrying the net. The key stays on Connie's ring. What changes is that someone came, and the thing that had been happening in private — grief in a neighborhood that does not discuss grief because everyone inside it is still inside it — gets a witness. That is the only resolution this kind of grief admits.

### §GR-D. Grief Subplot Map — Full Narrative

The La Riva quest is where the grief is concentrated. But the same corruption-grief transfer runs through the full arc as a distributed layer, using the same technique: small domestic actions encoding loss, not performed, not declared — the object that carries the weight.

| Arc | Character | Grief Source | Object | Node | Status |
|-----|-----------|-------------|--------|------|--------|
| La Riva | Connie + Aldo | Vincenzo's death; Cat-King destruction | The net / the key / the account book | FR | ✅ Implemented — Layer 78 |
| Froberger's Margins | Froberger | The woman at the archive; the unfinished life | Entry 41 blank line; Entry 42 page | CO + collectible | Entries 17+29 ✅ in FROBERGER_JOURNAL; Entry 41 ✅; Entry 42 deferred NG+ |
| Brynn's Cup | Brynn Clerambault | The merchant who took the ledger; "good credit and bad judgment" | The cup already on the table | IN | ✅ fav ≥ 2 preamble |
| Yael's Corner | Yael Scheidemann | The courier she filed correctly; the distance she stood at | The corner she looks up from | CI | ✅ fav ≥ 2 preamble |
| Bruhns at Dawn | Commander Seraphine Bruhns | The chain of command; carrying things alone | The manifests; the candle; the absolute stillness | CY | ✅ fav ≥ 2 preamble |
| Void Archaeology | Froberger + player | Things that should be dead writing to you | Entry 42; the blank page filled | CO | ✅ Layer 52 |

All six arcs share one structural constraint: **the grief is not named in the text.** It is enacted through objects and small observable actions. Brynn's cup. Yael's corner. Aldo's coat pocket. Connie's key ring. Froberger's taxonomy correction mailed to a general address. The Chrétien technique applied consistently: encode the emotional weight in a thing the character does, not in a thing the character says about how they feel.

All six converge at the Covenant Keeper ending, where each name is spoken. The ending is structured as a receipt — acknowledgment that the grief was witnessed. This is why the Covenant Keeper ending names each person: not to celebrate them, but to confirm that the things they carried were seen.

### §GR-E. The Corruption Transfer — Neon Undercity to Surface

The CY aesthetic (neon corridors, mechanical guards, corrupted data wraiths) is not genre mixing. It documents the void's mode of advance: through commercial infrastructure, through faction relationships, through the supply corridors between underground and surface.

**The pathway (all currently live in HTML):**

1. Void pressure at CY → `quest_cat_void` (Sandy: *"Something's wrong with the strays near the DF node. They're not just feral — they're WRONG."*)
2. Don Fluffissimo uses Corrupted Cats as enforcers across the CY/CQ boundary (Q-CAT-05 lore)
3. Cat-King emerges from merged Taz Devils — void-touch accelerates the merge rate
4. Cat-King destroys three city blocks — disproportionate to a territorial conflict; void-amplified
5. Corrupted Cats colonize the Fishmonger's Row ruins — still void-touched, still carrying the resonance
6. Human grief settles in the same space as the corrupted colonization
7. The grief-space and the corruption-space become the same block

**The "bad vibes" transfer:** Every time a Merchant Cat ran a Corrupted Cat enforcer through the CQ/CY corridor, they moved a small amount of void resonance upward through the social lattice. The Neon Undercity's neon-and-data aesthetic is the form this corruption takes underground. The Fishmonger's Row rubble is the form it takes on the surface. The grief bad vibes and the corruption bad vibes are the same phenomenon in two registers: structural (void colonizing territory) and human (loss colonizing memory). The Corrupted Cats squat in both simultaneously.

The player who has been through CY already knows what void corruption looks like. The La Riva arc is the point where they discover that the same mechanism they cleared underground has a residue on the surface — not a monster, but a widow who is still there, and an old man who carries a net folded inside his coat and has not told her he found it.

### §GR-F. Vignette Writing Spec

All La Riva and grief-arc prose uses the French vignette technique:

- **5 acts**, each named for one object (not a character, not an event — the object that survives and travels)
- **Two perspectives per act**: one short paragraph per character; compressed present-tense prose
- **The gap between perspectives is the emotion**: what one character doesn't know the other is carrying; where they do not speak; what the same object meant to each of them
- **No declaration**: the emotional register is not named in the prose
- **Objects travel across acts**: the same object reappears in later acts with accumulated weight

See `story.md §GRIEF AND CORRUPTION` for the vignette prose.

### §GR-G. Lab Report

✅ `lab-report-la-riva-grief-arc.md` written 2026-05-26. Covers: corruption-grief chain, five-act vignette structure (confirmed correct), full La Riva quest chain record, distributed grief subplot map (Froberger/Brynn/Yael/Bruhns), romance layer (ROMANCE_QUOTES/NPC_ROMANCE_PREAMBLES/NPC_ROMANCE_VIGNETTES), quest disposition rewrite philosophy, hour counter wiring table, deferred items (FR visual change, Kenickie NG+ naming line).

---

## §0 — Implementation Readiness Dashboard

> **Status as of Layer 96 (2026-05-27).** §LVIII implemented: quest_muffat_05 "Cycle 4" (activates DK post-solmFound, completes on cycle4NoteRead) + Scholar Kings Requisition (Handwritten) readable ("Do not let the archive answer") + Muffat six-state quoteFn. Muffat chain structurally complete; Cycle 4 / Conclave Archivist thread open for future arc. HTML: ~20,435 lines. Lab reports: 43. Add new layers below as §LIX+.

### Lab Report Index (Layers 48–79)

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
| 79 | §DESIGN-03 | `lab-report-ceremonia-roll-skill-checks.md` |
| 78 | §GR | `lab-report-la-riva-grief-arc.md` |
| 80 | §DUNGEON-01 | `lab-report-dungeon-ten-themes.md` |

Earlier layers (9–47): see `lab-report-architecture-full.md` and `lab-report-timeline-history-completed.md`.

✅ §DESIGN-03 (Ceremonia Roll + Starting City) — implemented 2026-05-26. Lab report: `lab-report-ceremonia-roll-skill-checks.md`.
✅ §DUNGEON-01 (10 Dungeon Themes) — fully implemented Layer 81 (2026-05-26). Nodes WK + MM live.
✅ §DUNGEON-02 (Five-Act Arthurian Quest Elaborations) — All 10 chains live (Layer 81, 2026-05-26). D02-06 (WK node) + D02-08 (MM node) implemented. See `quest.md`.
✅ §XLIII (Hunt Overhaul) — implemented Layer 82 (2026-05-26). Inline target selector accordion, WIS Survival DC roll, ◈ quest badges, fail flavor, Rush In.
✅ §XLIV (Accordion-First UI) — implemented Layer 82 (2026-05-26). Hunt + Battle cards both inline accordions; battle accordion has threat badge, condition picker, stealth toggle, Start Battle, Retreat.

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

## §DESIGN-01 — Desert Codex Theme Redesign

**Status:** ✅ Implemented 2026-05-26. P1–P8 complete.
**Scope:** CSS variables · Story Mode layout · Character vitals panel · Quest strip · Action chip styling · Map panel
**Files:** `roll2hit-v3.html` (CSS block lines 7–2229 + story mode structural CSS lines 886–2360)

---

### I. Design Rationale

The current theme is a BBS/terminal palette — near-black background (#120600), flame orange (#E76219), hot red (#C21717), amber (#FEA712), warm cream (#FDDCA9). It reads well in dark conditions and has strong character. The Aztec stripe banding (panel-banding: dark ember → red → orange → amber → cream) is a signature element to preserve.

The redesign shifts the **base surface from near-black to parchment/sand**. All structural readability problems trace to the dark background: description text, quest text, NPC dialogue, and stat labels are all warm-cream-on-dark, which fatigues the eye for reading. Inverting to dark-text-on-light-sand dramatically improves reading legibility while keeping the Aztec stripe palette and border color language.

**Inspiration:** 1970s earth-tone graphic design — harvest gold, burnt sienna, baby blue, cream. Think airport signage, airline liveries, textbook covers. Brown + blue + cream is the canonical 70s triplet. Aztec codex manuscripts used sand-parchment grounds with terracotta, turquoise, and black geometric marks — the Aztec and 70s palettes are the same underlying vocabulary.

---

### I-B. Color Theory — Why Autumn Pastels

#### Warm-Cool Contrast (Goethe / Itten)

The Desert Codex palette is structured around **warm-cool opposition** — the oldest organizing principle in Western color theory. Johannes Itten (Bauhaus, 1961) identified warm-cool contrast as the most psychologically active of the seven color contrasts: warm tones (ochre, sienna, amber) advance visually; cool tones (blue, teal) recede. The eye alternates between them without fatigue.

Our split: **warm parchment field** (#F0E6C8) + **cool blue accent** (#7BAAB8). The sand background reads as the resting state — the ground — and the baby blue reads as active attention signal. Every information element that says "this is notable" (quest strip, inn/rest chip, map) uses the cool blue, while narrative text (descriptions, NPC dialogue) lives on the warm sand. The warm-cool axis encodes meaning without color-coding by memorized convention.

#### Simultaneous Contrast (Chevreul, 1839)

Chevreul's law: a color appears more saturated when placed against its temperature complement. Our flame orange / amber Aztec stripes (#E76219, #FEA712) already exist in the design. When the baby blue (#7BAAB8) appears adjacent to these warm stripes, Chevreul contrast amplifies both — the blue reads cooler and the orange reads warmer than their measured values. This means the blue accent does not need to be saturated to feel vivid. The #7BAAB8 is deliberately desaturated (the "dusty" quality); the Aztec frame does the amplification work for free.

#### Autumn Pastel Specifically — Why Desaturated Earth Tones

"Pastel" means a hue with white or gray added — reduced chroma, raised lightness. Autumn pastels are earth-tone hues at low-to-medium chroma:

| Season feel | Pigment origin | Hex range |
|-------------|----------------|-----------|
| Spring | Zinc white, cadmium yellow | #FFF8E7 |
| **Autumn** | **Raw sienna, raw umber, yellow ochre** | **#F0E6C8 → #C8A870** |
| Winter | Titanium white, Prussian blue | #E8EEF4 |

Autumn pigments are the colors of **aging organic matter** — drying grasses, exposed clay, sandstone, aged paper, tanned leather. They are inherently aged rather than clinical. For a game about codices, chronicles, and ruin archaeology, this is thematically precise: the surface itself reads as artifact.

Psychologically, desaturated earth tones reduce arousal — low chroma, moderate value. This is intentional: the base field should be calm so that high-chroma events (red battle chips, amber gold notifications, flame orange Aztec stripes) read as elevated. The entire signal hierarchy relies on the muted ground.

#### Value Contrast and Legibility

The BBS dark theme is technically high-contrast (cream #FDDCA9 on near-black #120600 ≈ 15:1 luminance ratio), but long-form reading on dark backgrounds creates a specific fatigue mechanism: the pupil dilates for low ambient light, then constricts in response to each bright text character — this micro-oscillation over minutes of reading produces eye strain. All historical long-form reading media (manuscripts, printed books, newspapers) use **dark text on light ground** for this reason.

Our Desert Codex: dark brown #2A1A0A on parchment #F0E6C8 ≈ 12:1 contrast ratio, well above WCAG AA (4.5:1). The 3-point drop from the dark theme is irrelevant; what matters is stable pupil diameter during description / quest / NPC text reading.

#### The Aztec Codex Parallel

Mesoamerican codices (Codex Borgia, Codex Mendoza, c. 14th–16th century) used:
- **Ground**: amatl bark paper — ochre/buff (#E8D4A0 range)
- **Structural color**: deep red (iron oxide, cinnabar)
- **Sacred accent**: turquoise / teal (azurite, malachite)
- **Outline**: carbon black

The turquoise in Mesoamerican iconography carried the highest status — associated with Quetzalcoatl, Tlaloc, sky, water, and divine favor. The hot red was blood, sacrifice, warfare. Together: sacred blue + sacrificial red against parchment ground. Our palette is this structure exactly: --sky (#7BAAB8, teal-blue) + --az2/#C21717 (hot red) + --bg (#F0E6C8, buff parchment). The 1970s design trend and the Aztec codex tradition are drawing from the same source: earth pigments before synthetic dyes.

#### The 1970s Palette as Earth-Pigment Revival

The 1970s earth-tone movement was a conscious rejection of 1960s high-saturation primary colors (think Mondrian, Helvetica on white). Designers returned to pigments validated by organic chemistry: raw sienna, burnt umber, harvest gold, avocado, harvest wheat. The baby blue (#7BAAB8) is specifically the **institutional pastel blue** of 1970s public design — hospitals, schools, government offices — a blue that had been stripped of the crisp corporate associations of Pantone 300 and left to age into something warmer and less declarative.

This color — dusty, slightly gray-shifted — is calm where a saturated blue is assertive. It says "information" rather than "alert." That is exactly the register we want for quest data, rest actions, and map navigation: present and legible, not alarming.

#### Summary — Color Theory Rationale

| Choice | Theory basis | Effect |
|--------|-------------|--------|
| Parchment ground (#F0E6C8) | Autumn pastel earth pigment; dark-on-light legibility principle | Reduces reading fatigue; reads as artifact/manuscript |
| Baby blue accent (#7BAAB8) | Warm-cool Itten contrast; Chevreul amplification against orange stripes | Encodes "calm/navigational" category without memorized convention |
| Terracotta border (#8B4A2A) | Desaturated warm — same hue family as Aztec stripes, lower chroma | Frames without competing with text or action elements |
| Aztec stripes UNCHANGED | Existing brand; Mesoamerican codex parallel confirmed | Continuity + amplifies cool accents via simultaneous contrast |
| Dark brown text (#2A1A0A) | ~12:1 contrast on parchment; stable pupil for long-form reading | Maximizes description/quest text legibility |

---

### II. New Color Palette — "Desert Codex"

```css
:root {
  /* Surface scale (light → dark) */
  --bg:       #F0E6C8;   /* parchment ground — main background */
  --panel:    #E2D0A8;   /* panel surface — slightly darker parchment */
  --panel2:   #D4BC88;   /* recessed panel — mid sand */
  --panel3:   #C8A870;   /* deep panel — warm tan */

  /* Text */
  --text:     #2A1A0A;   /* dark brown — primary text on light bg */
  --dim:      #6A4A28;   /* mid-brown — secondary/label text */
  --muted:    #9A7A52;   /* muted — disabled / hints */

  /* Aztec stripe colors (panel-banding — UNCHANGED from current) */
  --az1: #562717;        /* dark ember      → KEEP */
  --az2: #C21717;        /* hot red         → KEEP */
  --az3: #E76219;        /* flame orange    → KEEP */
  --az4: #FEA712;        /* amber           → KEEP */
  --az5: #FDDCA9;        /* warm cream      → KEEP */

  /* Border / structural accent — terracotta */
  --border:   #8B4A2A;   /* terracotta border (was flame orange) */
  --border-lt:#C47A4A;   /* light border — hover state */

  /* 70s baby blue — rest, inn, quests, map */
  --sky:      #7BAAB8;   /* dusty blue accent */
  --sky-lt:   #B0D0DC;   /* pale blue — chip fill */
  --sky-dk:   #3D6E7A;   /* deep blue — active/selected */

  /* Ochre / gold — loot, XP, level-up */
  --gold:     #B87C28;   /* burnt gold (was amber) */
  --gold-lt:  #D4A848;   /* warm gold highlight */

  /* Alert colors */
  --red:      #8B2010;   /* deep crimson — danger */
  --red-lt:   #C03020;   /* bright red — warnings */
  --grn-lt:   #3A7A3A;   /* forest green — success */

  /* Action / advantage colors */
  --adv:      #3D6E7A;   /* sky-dk = advantage blue */
  --dis:      #C03020;   /* red-lt = disadvantage */
}
```

**What changes:**
- Background: #120600 (near-black) → #F0E6C8 (parchment)
- Panels: #562717 (dark ember) → #E2D0A8 (light sand)
- Text: #FDDCA9 (cream) → #2A1A0A (dark brown)
- Border: #E76219 (flame orange) → #8B4A2A (terracotta)
- Added baby blue (#7BAAB8) as new accent

**What is preserved:**
- Panel banding stripes: all five colors unchanged (#562717 → #C21717 → #E76219 → #FEA712 → #FDDCA9)
- Aztec groove: #1c0804 unchanged
- Red/orange for warnings, battles, danger states

---

### III. Layout Redesign — Story Mode

#### III-A. Current Layout (3-column fixed)

```
┌─────────┬──────┬──────────────────────────────┬──────┬──────────┐
│ Left    │ Band │ Center                        │ Band │ History  │
│ 180px   │ 44px │ flex                          │ 44px │ 190px    │
│         │      │                               │      │          │
│ act     │      │ node-header                   │      │ location │
│ log     │      │ text-box (description)        │      │ history  │
│ status  │      │ info-row (chips)              │      │ cards    │
│ buttons │      │ nav-row:                      │      │          │
│         │      │   dpad | minimap | worldmap   │      │          │
│         │      │   nsew-exits                  │      │          │
└─────────┴──────┴──────────────────────────────┴──────┴──────────┘
```

Problems: (1) Left sidebar is cramped — 11 stat rows + 6 buttons in 180px. (2) Description text box is mid-column between header and chips — not prominent. (3) Quest log is a separate full-screen sheet — not visible at a glance. (4) Character vitals (weapon, potions) are buried in separate sheet. (5) History panel competes for horizontal space.

#### III-B. New Layout — "Read → Quest → Act → Navigate"

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER (38px): Roll2Hit v3 ── story badge ── btns               │
├────────────────────────────────────────────────────────────────┤
│ AZTEC BAND (horizontal, 8px tall, full width)                   │
│ [dark ember ━━ red ━━ orange ━━ amber ━━ cream ━━ groove]       │
├──────────┬─────────────────────────────────────────────────────┤
│ LEFT     │ CENTER MAIN                                          │
│ CHAR     │                                                      │
│ VITALS   │ ① NODE NAME + ACT BADGE                             │
│ (200px)  │    [large, clear header]                             │
│          │                                                      │
│ ── HP ── │ ② DESCRIPTION                                       │
│ bar      │    [parchment card, dark brown text, readable]       │
│          │                                                      │
│ Potions  │ ③ QUEST STRIP (inline, 1-2 active quests)           │
│ count    │    [sky-blue left border, compact, no sheet switch]  │
│          │                                                      │
│ ⚔ Main  │ ④ ACTION CHIPS                                      │
│ weapon   │    [NPC / Battle / Rest / Loot / EB]                 │
│ +atk mod │    [larger, clear labels, terracotta/sky/gold accent]│
│          │                                                      │
│ 🛡 Off  │ ⑤ NAVIGATION                                        │
│ hand +ac │    dpad (left) + mini-map (center) + exits (right)   │
│          │                                                      │
│ ── MAP ──│                                                      │
│ local    │ ── HORIZONTAL DIVIDER (Aztec step pattern) ─────── │
│ 7×7      │                                                      │
│          │ ⑥ WORLD MAP (full width below divider)              │
│ Day/Void │    [scrollable, appears below main content]          │
│ Level    │                                                      │
│ Gold     │ ⑦ HISTORY LOG (below world map, scrollable)         │
│          │    [location history cards, no longer a sidebar]     │
└──────────┴──────────────────────────────────────────────────────┘
```

**Key structural changes:**
1. **Horizontal Aztec band** replaces the vertical panel banding as the top-of-content divider. The vertical bands remain as left/right framing elements flanking the left sidebar.
2. **Left sidebar** shrinks to character vitals only: HP bar, potion count, equipped weapons with modifiers, day/void/level/gold.
3. **World map and history** move below the fold (scrollable) instead of always-on competing for width.
4. **Quest strip** is always visible inline below the description — 1 or 2 current active quests, compact, sky-blue accented.
5. **Description text** is given full width and clear parchment card treatment.

---

### IV. Character Vitals Panel (Left Sidebar)

New left sidebar content — compact, always-on, battle-useful:

```
┌─────────────────────┐
│ ACT I · DAY 4       │
│ Level 3             │
├─────────────────────┤
│ ❤ HP  ██████░░ 24/30│
│ ⚡ XP  ━━━━━━░░ 40% │
├─────────────────────┤
│ ⚔ Longsword +1      │
│   ATK +7 · 1d8+3   │
│ 🛡 Shield +1        │
│   AC +3             │
├─────────────────────┤
│ 🧪 Potions    ×2    │
│ 💰 Gold    850gp    │
│ 🔮 Shards    2/7    │
│ 🌑 Void      3/10  │
├─────────────────────┤
│ LOCAL MAP (7×7)     │
│ [mini-map grid]     │
├─────────────────────┤
│ 📋 Quests [Q]       │
│ 🎒 Inventory [I]    │
│ 📖 Journal          │
│ 📍 Waypoint         │
└─────────────────────┘
```

**HTML changes needed:**
- `#story-status`: add weapon display rows (`s-main-weapon`, `s-offhand`, `s-potion-count`)
- `#story-left`: reorganize into logical groups with section dividers
- Weapon data populated in JS `storyRender()` reading `S_story.equippedMainWeapon` + `S_story.equippedShield`/`S_story.equippedWeapon`

---

### V. Quest Strip (Inline, Below Description)

A new `#story-quest-strip` element between `#story-text-box` and `#story-info-row`. Shows max 2 active quests without switching sheets.

```html
<div id="story-quest-strip">
  <!-- populated by storyRender(); hidden if no active quests -->
</div>
```

CSS: `border-left: 3px solid var(--sky-dk)` + compact row with quest name, objective snippet, hint. Tap/click to open full quest sheet.

---

### VI. Aztec Geometric Accents (CSS only, no images)

**Section dividers** — CSS repeating gradient step pattern replacing plain `<hr>`:

```css
.az-divider {
  height: 8px;
  background: repeating-linear-gradient(
    90deg,
    var(--az1) 0px, var(--az1) 8px,
    var(--az2) 8px, var(--az2) 16px,
    var(--az3) 16px, var(--az3) 24px,
    var(--az4) 24px, var(--az4) 32px,
    var(--az5) 32px, var(--az5) 40px
  );
}
```

**Card headers** — stepped border on section title blocks:

```css
.section-card-hd {
  background: var(--panel3);
  border-top: 3px solid var(--az3);
  border-left: 6px solid var(--az2);
  padding: 4px 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 700;
  color: var(--dim);
}
```

**Panel banding** (vertical, kept): update pb-l5 to `var(--sky-lt)` as the 6th/outermost layer instead of cream — adds baby blue fringe to the stripe stack.

---

### VII. Action Chips — Restyled

Current chips are small `border: 1px solid` pills. New chips are taller (32px min), grouped by action type, with clear icons and purpose labels:

| Chip type | Border color | Background | Label |
|-----------|-------------|------------|-------|
| NPC talk | terracotta `--border` | `--panel` | "Talk to [Name]" |
| Battle | `--red-lt` | `rgba(red, 0.06)` | "⚔ Fight" |
| Epic Battle NPC | `--red` | `rgba(red, 0.12)` | "⚔ Quest: [Name]" |
| Rest (Inn) | `--sky` | `rgba(sky, 0.1)` | "🌙 Rest here" |
| Short rest | `--sky-dk` | `rgba(sky, 0.08)` | "🛌 Short Rest" |
| Loot | `--gold` | `rgba(gold, 0.08)` | "💰 Loot" |
| Portal | `--gold-lt` | `rgba(gold, 0.06)` | "🔮 Portal" |
| EB Return | `--grn-lt` | `rgba(grn, 0.08)` | "↩ Return" |

---

### VIII. Implementation Phases

| Phase | Scope | Status |
|-------|-------|--------|
| **P1** | CSS variables — `:root` Desert Codex palette | ✅ 2026-05-26 |
| **P2** | Base surfaces — bg/panel/text classes; chips; overlays | ✅ 2026-05-26 |
| **P3** | Left sidebar vitals — HP bar; weapon rows; potion count | ✅ 2026-05-26 |
| **P4** | Description card + quest strip — `#story-quest-strip` + JS | ✅ 2026-05-26 |
| **P5** | Action chips — 32px min-height; icon/label sizing | ✅ 2026-05-26 |
| **P6** | Navigation block — dpad sizing; hover states | ✅ 2026-05-26 |
| **P7** | Panel banding — pb-l5 → sky-lt; horizontal az-divider | ✅ 2026-05-26 |
| **P8** | History below fold — horizontal hcard strip; az-divider | ✅ 2026-05-26 |

---

## §DESIGN-02 — Story Mode UX: Purpose-Driven Section Layout + Hour Tracking

**Status:** ✅ All phases implemented 2026-05-26/27 (P1–P5 live; P5 covered by §XLIV battle accordion).
**Scope:** Story mode center layout · Section containers · Hour tracking · Per-quest hunt UI
**Files:** `roll2hit-v3.html` (CSS + JS storyRenderSections + _S_DEFAULTS)

---

### I. Design Rationale

The current story mode center renders all action chips in a single undifferentiated row. The user sees: NPC Talk, Battle, Stalk, Loot, Inn, Short Rest, Vendor — all flattened into a list with no semantic hierarchy. The result: the player must scan the entire chip list to find the relevant action for their current intent.

The fix: **purpose-driven labeled sections**. Each section has one semantic meaning. The player can navigate by section identity ("I want to hunt → look for STALK") rather than by parsing icons.

**Visual language:** Section container = dark ember `var(--c1)/#562717` → section header in warm cream `var(--c5)` → item cards in parchment `var(--bg)/#F0E6C8`. This matches the quests screen aesthetic (dark section frame, eggshell content card).

---

### II. Section Layout (Phase 1 — Implemented)

```
┌─ 📍 LOCATION ───────────────────────────────────────┐
│ [01] City Streets — Birka   Act I                   │
│ Description text (full narrative)                   │
└─────────────────────────────────────────────────────┘
┌─ 🎯 STALK ──────────────────────────────────────────┐  (if hunting ground)
│ Hunt: Urban Ruins · Rats, Thugs, Shadows   [Hunt]  │
└─────────────────────────────────────────────────────┘
┌─ ⚔ ENCOUNTER ───────────────────────────────────────┐  (if battle)
│ ⚔ Skeleton ×3 + Shadow                    [Fight]  │
└─────────────────────────────────────────────────────┘
┌─ 📋 QUESTS ─────────────────────────────────────────┐  (if active quests)
│ ◈ Main: Find the Sealed Box                         │
│   ▶ Recover from Chamber CR                        │
└─────────────────────────────────────────────────────┘
┌─ 💰 LOOT ───────────────────────────────────────────┐  (if loot present)
│ 📦 Bloodstained Map           ✓ In Inventory        │
└─────────────────────────────────────────────────────┘
┌─ 🛌 REST ───────────────────────────────────────────┐  (always)
│ 🌙 Short Rest   2/3 remaining         [Short Rest]  │
│ 🏠 Long Rest → Nearest Inn: IN (2 moves N)          │
└─────────────────────────────────────────────────────┘
┌─ 🌐 WORLD ──────────────────────────────────────────┐  (if misc: NPC, vendor, portal)
│ 🧙 Talk: City Guard Captain Yael       [Talk]       │
│ 🛒 Vendor: Mira                        [Shop]       │
└─────────────────────────────────────────────────────┘
```

**Section order:** LOCATION → STALK → ENCOUNTER → QUESTS → LOOT → REST → WORLD

Stalk is above Quests: hunting is active/dangerous and should precede the passive quest list.

---

### III. Hour Tracking System (Phase 2 — Spec)

#### III-A. New State Fields

```js
hoursElapsed: 0,        // total hours since run start
hoursSinceSlept: 0,     // hours since last long rest (inn sleep)
```

#### III-B. Hour Cost by Action

| Action | Hours | Notes |
|--------|-------|-------|
| Move to adjacent node | 1h | Normal travel |
| Corridor warp | 2h | Long-distance fast travel |
| Normal combat | 1h | Win or retreat |
| Hunt / Stalk | 2h | 1h setup + 1h battle |
| Fishing | 1h | One fishing session |
| Short rest | 1h | HD roll + HP recovery |
| Long rest (inn) | 8h | Full HP + resets hoursSinceSlept |
| Shop / vendor | 0h | No time cost |
| NPC dialogue | 0h | No time cost |

#### III-C. Sidebar Display

```
⏱ 6h elapsed   0h rested
```

Add to resources stat group in `#story-left`:
- `s-hours-elapsed` — total hours, always incrementing
- `s-hours-slept` — hours since last long rest

#### III-D. Exhaustion Thresholds (design, implementation deferred)

| Hours without sleep | Effect |
|--------------------|--------|
| 0–15h | Normal |
| 16–23h | ⚠ Warn in sidebar: "Tired" |
| 24h+ | DIS on all attack rolls |
| 48h+ | DIS on STR/DEX checks + -2 to AC |

Exhaustion resets on inn long rest. Short rest does NOT reset hoursSinceSlept.

---

### IV. Per-Quest Hunt Buttons (Phase 2 — Spec)

When a quest is active and specifies a monster type, and that monster type exists in the current node's terrain `WORLD_DB` entry, show a dedicated hunt button in the STALK section:

```
┌─ 🎯 STALK ──────────────────────────────────────────┐
│ 🐀 Rats ×3 — Hunt for: Rat Poison Quest   [Hunt]    │
│ 👤 Thug — Hunt for: Bounty: The Fence     [Hunt]    │
└─────────────────────────────────────────────────────┘
```

**Implementation notes:**
- Requires `QUEST_DB` entries to carry a `huntMonsterKey` or `huntTerrain` field
- `huntMonsterKey` matches a key in `MONSTER_POOL`
- A hunt button launches `storyPreBattle(node)` with the monster pre-selected
- Hunt costs 2h; normal stalk costs 2h; they are the same mechanic but surfaced per-quest

---

### V. Inline Condition Selector per Quest (Phase 2 — Spec)

Instead of navigating away to the pre-battle overlay, the ENCOUNTER section shows inline condition buttons:

```
┌─ ⚔ ENCOUNTER ──────────────────────────────────────┐
│ ⚔ Skeleton ×3 + Shadow                             │
│   [Fight]  [Poison (50gp)]  [Flanked (30gp)]       │
└─────────────────────────────────────────────────────┘
```

Only show conditions the player can afford. Clicking a condition button launches battle with that condition pre-applied (skipping the pre-battle overlay).

---

### VI. Implementation Phases

| Phase | Scope | Status |
|-------|-------|--------|
| **P1** | Section layout CSS + JS routing into labeled sections | ✅ Implemented 2026-05-26 |
| **P2** | Hour state fields + sidebar display + per-action hour increment | ✅ Implemented 2026-05-26 |
| **P3** | Exhaustion thresholds + DIS application | ✅ Implemented 2026-05-26 — `hoursSinceSlept ≥ 24` and `battleDis > 0` both now apply DIS to attack rolls (ADV cancelled to normal); fixed bug where `battleDis` showed warning but never affected rolls |
| **P4** | Per-quest hunt buttons (needs QUEST_DB `huntMonsterKey` field) | ✅ Implemented 2026-05-26 — per-monster STALK cards keyed to terrain `WORLD_DB` monster list; `storyQuestHunt(id, forceKey)` added; kill-goal progress shown inline |
| **P5** | Inline condition selector per encounter | ✅ Covered by §XLIV battle accordion (condition sub-row + stealth toggle inline beneath Encounter card) |

---

## §RESEARCH-01 — Arthurian Romance Reference: Chrétien de Troyes

**Source:** *Four Arthurian Romances* — Chrétien de Troyes (c. 1160–1172 CE)  
**Purpose:** Research session — extract structural patterns, parallel analysis to roll2hit arcs, and propose an empathetic romance subplot layer with quote candidates for random romance events.

**Implementation status — 2026-05-25:**
- §III.A Inn Vignette System: ✅ `NPC_ROMANCE_VIGNETTES` const (6 entries), `npcRomanceVignetteDelivered: {}` state field, delivery in `storyConfirmSleep()` at 1400ms — fav ≥ 2, NPC node in last 3 moves + current, once per NPC per run.
- §III.B NPC Preamble Lines: ✅ `NPC_ROMANCE_PREAMBLES` const (6 entries), injected as italic div in `_renderNpcCard()` between greeting and quote when fav ≥ 2.
- §III.C Froberger Journal Entries: ✅ Entries 17 and 29 replaced with elegiac romance content (archive woman / unasked question).
- §III.D ROMANCE_QUOTES: ✅ Implemented 2026-05-25 (prior session) — 21-entry const, 15% per sleep, Act III+, no repeat.
- §VI Quest Rewrites: ✅ Implemented 2026-05-25 (prior session) — all QUEST_DB descs, VOID_TIDE_EVENTS, and selected NPC quotes rewritten in Chrétien register.

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

---

## §NODE-TEXT — Noir Vignette Node Descriptions

### Standing Writing Prompt

Apply to every existing `text:` field in NODE_MAP. Rewrite only — do not add nodes that don't exist.

**Register:** Noir-dense, 100–150 words. Named sub-location within the territory (a specific bench, gate, platform, stall row — not just the zone). Timeless: what the place IS, not what happened once. Adventurer's POV. Chrétien de Troyes structure active throughout.

**Five Chrétien registers to engage per node:**

1. **The threshold test** — every node is a gate. The description names what is being tested about the player, not merely what is being seen. Entering the location proves something.

2. **The host-guest contract** — the NPC at each node is a host figure. What they give freely, what they withhold, and whether they greet you before you speak encodes the moral weight of the place. The host who gives without asking the price; the host who calculates it in advance.

3. **The object that carries fate** — one prop per scene that compresses the arc into a thing. The bloodstained map. The blank arrival column. The running wax. The Flash Powder tossed before you ask. Props are not decoration; they are the plot in hand.

4. **The interior made exterior** — never write the feeling. Write the act that contains it. "She was afraid" becomes "her hands let the horse choose the road." The dockworkers avoid the third berth without discussing it. The sexton does not look down.

5. **Time as the legal-moral frame** — Chrétien's deadlines (40 days, year-and-a-day) are social contracts, not just urgency. In this game: Day 49, the harbor board counting from Day 17, the torch wax still running. When time appears in a description it is always a contract someone is about to break.

**Monster scale rule:** Embed weak vermin and strong epics in the description of the place itself — not as a bestiary, but as what the location produces when left long enough. The crypt's unlocked door produces shadows. The harbor's wrong-berth hold produces something that doesn't appear on the cargo list. The corridor without maintenance produces data wraiths.

**Format per entry:** Named sub-location · Current `text:` field (quoted) · Proposed replacement (block quote) · Props · Monster scale · Chrétien register active · Word count.

**Status:** ✅ Implemented 2026-05-25 — all 76 node text fields rewritten and applied to HTML.

---

---

### NODE: CI — City Streets, Birka

**Named location:** Katharinen Gate

**Current text:**
> You stand at the crossroads of Birka, the greatest city in the known world. The sky carries a faint violet cast where the Void bleeds into the evening dark. Cobblestones slick with last night's rain catch the lantern light in amber pools. A dying courier collapses at your feet, pressing a bloodstained map into your trembling hand — the single word on his lips before he goes still: 'Sweelinck.' You are a Level 1 Fighter. You have a sword, a name no one here knows yet, and a loop that has already started. The city is alive and it is watching. You will fight monsters here — real ones, with claws and void-rot and bad intentions. You will also fight the ones that live behind your own eyes. The friends you make in these streets will matter more than any loot you carry. This is not a story about winning. It is a story about waking up.

**Proposed replacement:**
> The courier is already dead. He made it to the gate lamp and no further; the map he was carrying is in your hand now. You don't remember being given it.
>
> Around him, the city continues. A cart adjusts its wheel line. Guard Captain Yael notes the body's position from the corner — does not approach. The notice board behind her: lower districts sealed, three consecutive nights. Rationale field: blank.
>
> She looks at the map. Then at you.
>
> "Where did he come from?"

**Props:** Gate lamp · Bloodstained map · Notice board (blank rationale field) · Cart adjusting course
**NPC anchor:** Yael — reads the scene before she speaks
**Word count:** ~70

---

### NODE: IN — The First Inn, Birka

**Named location:** The Front Counter

**Current text:**
> The innkeeper is nervous. Two merchants disappeared from the harbor. She gives you a free breakfast — and slides Froberger's journal across the table.

**Proposed replacement:**
> The breakfast is already waiting when you sit down. She hasn't asked what you take in your tea.
>
> Innkeeper Brynn wipes the same section of counter she wiped when you walked in. Two stools down, a ledger sits open to an entry that hasn't been filled — harbor arrivals, last Tuesday. Two names in the margin. No departure columns.
>
> She sets the journal in front of you. Forty-one entries. The author's name is Froberger.
>
> "Free," she says. "The room's free too, if you need it."
>
> She goes back to the counter.

**Props:** Waiting breakfast · Tea she didn't ask about · Ledger open to blank departure columns · Froberger's journal already on the counter
**NPC anchor:** Brynn — nervousness encoded through repeated wiping action, not named
**Word count:** ~75

---

### NODE: TV — Birka Tavern

**Named location:** The Door Frame

**Current text:**
> Rumors fly. Something came out of the crypt last week. A bard sings a cipher-song that feels mathematical. Two men who watched you take the ledger have followed you in.

**Proposed replacement:**
> The bard at the back is singing something that doesn't repeat. You catch yourself counting the intervals. The man at the bar does the same — you can tell by how he holds his cup: not drinking, calculating.
>
> The two men who watched you take the ledger at the inn are two steps behind you. They came in during the verse. They ordered nothing.
>
> Bard Tomas Couperin reaches the third line of the cipher and looks up.
>
> He has been watching the door since before you arrived.

**Props:** Non-repeating song (cipher as sound) · Cup held but not drunk · Two men who ordered nothing · The verse used as cover
**NPC anchor:** Couperin — already watching the door; the bard who performs surveillance
**Word count:** ~75

---

### NODE: BA — The Rough Bar, Birka

**Named location:** The Crypt-Wall Corner

**Current text:**
> The bar closest to the crypt entrance. A fence in the back room sells information about the Tilbury Conclave. The crypt entrance is in the wall behind the bar.

**Proposed replacement:**
> The back wall is older than the building. The door set into it opens onto the crypt and has never been locked. Newcomers find this out on their own — the bar doesn't announce it.
>
> Pachelbel works the back room. Tilbury Conclave passes, fifteen gold. He has heard everything this city produces and stopped reacting to it years ago.
>
> The vermin work the drain trench and the alley side: kobolds in the gutter, wererats below the boards, cockroach swarms behind the bottle shelf. What rises from the crypt door behind them is a different scale — ghouls that move slow, wights that don't until they must, shadows that use the unlocked door as a corridor. The bar has stayed open through all of it.

**Props:** Unlocked crypt door in the old wall · Pachelbel's back room · Bottle shelf and what's behind it
**Monster scale:** kobolds / wererats / cockroach swarms (vermin) → ghouls / wights / shadows (crypt escalation)
**Word count:** ~105

---

### NODE: CR — The Birka Crypt

**Named location:** The First Chamber Stair

**Current text:**
> Below the bar. Dark. Smells of old stone and something worse. Something has been digging from below. The second chamber has fresher tombs.

**Proposed replacement:**
> The torches at the bottom of the stair were lit recently — wax still running, not yet pooled. Someone came down here in the last half hour and did not stay.
>
> The first chamber holds twelve tombs. Three are disturbed: lids displaced, stone face-down on the floor. The scratches on the underside face upward.
>
> In the far corner, a shadow that has no source shifts when you don't look at it directly.
>
> From the second chamber, below the drip of water: a slower sound. The deliberate kind that comes from something that has time.
>
> A sexton crosses the grating overhead, lantern swinging. He does not look down.
>
> The three skeletons in the first chamber have already stood. The shadow is waiting for you to choose a direction.

**Props:** Running wax on fresh torches · Three lids displaced (scratches on underside face upward) · Sourceless shadow · Sexton who does not look down
**Sound:** Dripping water · Below it, a slower deliberate sound · Grating creak overhead
**Monster scale:** skeletons (standing, first chamber) → shadow (waiting) → unnamed second-chamber sound (deeper escalation)
**Tension register:** Everything poised — nothing has moved yet; train-about-to-depart structure
**Word count:** ~120

---

### NODE: CY — The Neon Undercity

**Named location:** Transit Corridor — Sub-Level 3

**Current text:**
> Below the crypt. Neon-lit corridors, mechanical guards, corrupted data wraiths. Commander Bruhns is already here, following the same trail.

**Proposed replacement:**
> The descent from the crypt floor takes thirty steps. At the bottom the stone ends and the conduit begins — cable bundles thick as your arm running the corridor's length, neon strips casting everything in a blue the eye reads as cold.
>
> The passage was a transit corridor once. The turnstiles at the far end are still set to reject; three have been forced and bent back. Someone came through recently, and the path they cleared is the one you will use.
>
> Two androids hold the mid-point checkpoint, heads tracking in the slow arc of a thing that runs on schedule. Between them, a data wraith — light that moves wrong, a signal that chose to persist rather than terminate. The androids are the vermin here. The wraiths are what a corridor produces when it runs long enough without maintenance.
>
> Commander Bruhns is already past the checkpoint. You can tell because the androids are still in reset posture, not yet returned to neutral scan.
>
> He did not wait.

**Props:** Cable conduit bundles · Forced turnstiles · Android patrol arc · Reset posture as departure evidence
**Sound:** Electrical hum of neon strips · Slow mechanical track of android heads
**Monster scale:** androids (vermin — scheduled, mechanical) → data wraiths (corrupted signal, persistent, harder to kill than anything that runs on a clock)
**Tension:** Train already left — Bruhns was on it; you read his passage from residue
**Word count:** ~145

---

### NODE: SQ — Scholar's Quarter, Weimar

**Named location:** The Reading Room, Upper Observatory

**Current text:**
> Books. Silence. Very old people. Archivus Ptolemy Sweelinck is in the observatory. He knows why you are here. He wrote the riddle door when he still had good knees.

**Proposed replacement:**
> The reading room is lit by twelve candles and one scholar who fell asleep at his desk three days ago and has not been disturbed. His book is open to the same page. No one has moved it.
>
> The stacks run three floors in each direction. In the sections where the candles don't reach — the lower east wing, the corridor behind the catalogue — specters of researchers who died mid-sentence drift between the shelves. They are not hostile. They are looking for the argument they never finished. The intellect devourers that follow them are a different matter.
>
> Archivus Ptolemy Sweelinck is in the upper observatory. He is very old. He wrote the riddle door at Katharinen Gate when he still had good knees and has not been back to check whether it still holds.
>
> He knows why you are here. He wrote it so that someone would come.
>
> A young archivist climbs the stairs past you with an armload of bound journals, eyes fixed on the step count. She has done this route so many times she no longer needs to look.

**Props:** Twelve candles · Sleeping scholar open to the same page · Gap where a volume is missing · Archivist counting stairs by muscle memory
**Sound:** Pages settling · Third-floor stack creak · Silence that has a shape
**Monster scale:** specters (researchers mid-sentence, still searching, not hostile) → intellect devourers (follow the specters; predators on seekers)
**Tension:** Sweelinck is old; the riddle door may not still hold; he wrote it so someone would come — you are the someone, arriving later than he expected
**Word count:** ~175

---

### NODE: TL — Tilbury Conclave Hall

**Named location:** The Harbor Board Anteroom
*(Note: TL has no NODE_MAP text: field — this vignette is a proposed addition)*

**Current text:** *(none — dynamic node)*

**Proposed text:**
> The board on the anteroom wall lists departures, not arrivals. This is not how harbor boards work. The clerk behind the counter changed the heading six weeks ago and has not changed it back.
>
> Ten berths. Ten vessel names. Ten departure dates counting forward from Day 17. The column beside them — Expected Arrival — is filled in a careful hand. The column beside that is blank. There is nothing to add to it now.
>
> Adjutant Vonn receives cases in order of filing. The anteroom holds eleven people ahead of you. Two of them have been waiting since the Harrow did not return. They have not been told anything. They have been noted.
>
> The vermin here wear Conclave badges and speak in protocols. The things that come in from the harbor at night — from berths that have been empty long enough to smell of nothing — are a different matter entirely.

**Props:** Harbor board (departure column full, arrival column blank) · Eleven people waiting · Heading changed six weeks ago, not changed back
**Sound:** Pen scratching a record of nothing · The anteroom's particular silence
**Monster scale:** bureaucratic predators (badge-and-protocol vermin) → harbor horrors (whatever empties a berth until it smells of nothing)
**Tension:** The board is a ledger of departures. The train already left — ten times. No arrival column. No announcement.
**Word count:** ~145

---

### NODE: DK — Harbor Docks, Tilbury

**Named location:** The Third Berth Gate

**Current text:**
> Tilbury's harbor. Three ships unloading simultaneously. Magistra Muffat finds you before you find her — she was watching the dock gate.

**Proposed replacement:**
> Three ships offload simultaneously at Tilbury. The crane operators don't speak — they work by sound: the groan of the chain, the pace of the tackle, the thud of a crate landing right. At the third berth something in the hold has been wrong since morning. The dockworkers avoid that side without discussing it.
>
> The vermin here are standard harbor stock: wererats in the cargo nets, spies in the chandler's office, pirates who read Tilbury's inspection schedule as an invitation. What comes off the wrong ships — the deep-run vessels whose cargo lists say *ballast* — belongs to a different tier.
>
> Magistra Elara Muffat is at the gate. She was there before you arrived. She already knows which berth you'll walk toward.

**Props:** Crane chain groan · Third berth hold (wrong since morning) · Cargo lists marked "ballast"
**Sound:** Chain groan · Crate thud · Dockworkers not talking about the third berth
**Monster scale:** wererats / spies / pirates (harbor vermin) → deep-run cargo horrors (unnamed, a different tier)
**NPC anchor:** Muffat at the gate before you — she already knows
**Word count:** ~130

---

### NODE: MQ — Tilbury Market Quarter

**Named location:** The Upper Gallery, Third Stall Row

**Current text:**
> Shops stack three stories. Vendor Mira tosses a Flash Powder twist at a seagull to demonstrate — it flaps away in a startled spiral.

**Proposed replacement:**
> The market runs three stories on both sides of the gallery and has done so for longer than the Conclave has administered it. What the Conclave taxes, the market absorbs. What the market cannot absorb, it sells.
>
> The lower stalls deal in the expected: pack supplies, dried goods, rope, the kind of blade that is technically legal. The upper gallery is where the prices stop being posted. Vendor Mira works the third row. She knows what you need before you name it — not because she's perceptive, but because everyone who climbs to the third row needs the same thing.
>
> She tosses you a Flash Powder twist without being asked. A seagull had been watching from the railing. It is no longer there.
>
> "The price," she says, "is knowing what it's for."

**Props:** Unstickered upper gallery · Flash Powder as greeting-before-question · The seagull that was watching
**Threshold test:** The market tests whether you can afford the upper gallery — not in gold, in purpose
**Host-guest (Chrétien):** Mira gives before you ask; payment is disclosure, not coin
**Word count:** ~145

---

### NODE: SF — The Map Shop, Tilbury

**Named location:** The Back Counter, Behind the Spice Stalls

**Current text:**
> No sign. Behind the spice stalls. Sells maps, locks, and old keys. The proprietor pales at the Bloodstained Map and gives you the Real Map for free.

**Proposed replacement:**
> No sign. The spice stalls provide the address: follow the smell of cinnamon until it stops. The door is unlocked. It has always been unlocked.
>
> Proprietor Dusk keeps maps, locks, and old keys behind a counter too high for the room. The maps on the left wall cover forty-one nodes. The space on the right is a gap — a forty-second map, rolled and waiting for whoever brings the right thing to the counter.
>
> You place the Bloodstained Map down.
>
> He doesn't speak immediately. His hands stay flat on the counter. Then he reaches under and sets the Real Map beside it — all forty-two nodes — and pushes it toward you.
>
> "Free," he says. The word costs him something.
>
> Maps this complete attract attention. The kind that doesn't knock.

**Props:** Cinnamon smell as address · Gap on the right wall (forty-second map always waiting) · Hands flat on the counter · "Free" as weight
**Threshold test:** Navigation by sense — no sign; found only by those already looking
**Host-guest:** Dusk holds the Real Map for this exchange specifically; gives freely but not without cost
**Fateful object:** Bloodstained Map unlocks the Real Map — the dead courier's final gift
**Monster scale:** No battle — hiddenness is the protection; complete maps draw the kind of attention that doesn't knock
**Word count:** ~140

---

### NODE: MS — Aboard the Tilbury Star

**Named location:** The Night Deck, Mid-Passage

**Current text:**
> A night passage heading east. The cargo below is alive and shouldn't be shipping. Pirates board at 2am.

**Proposed replacement:**
> The Tilbury Star takes paying passengers on the eastern run for three gold. The captain asks no questions about where you're going. You are expected to ask none about what's in the hold.
>
> The hold has been making sounds since Tilbury cleared the harbor. Not movement sounds — the specific sound of something that has learned to be still but hasn't learned to be quiet. The crew goes below in pairs before dusk and not at all after. The captain eats at her table alone and sets the cargo manifest face-down when you pass.
>
> The ghost in the hold predates the pirates. The pirates are simply what 2am produces on the eastern run — three of them, every other crossing, regular as a tide schedule. They come over the port rail.
>
> What rises from below to meet them is not on the manifest.

**Props:** Face-down manifest · Hold's specific sound · Crew going below in pairs · 2am port rail
**Threshold test:** The passenger contract — ask nothing about the hold; the contract breaks when the hold starts sounding wrong
**Host-guest:** Captain knows; manifest face-down is the host who hasn't disclosed the haunting
**Fateful object:** The manifest — should name what's below; its position is the scene's central lie
**Monster scale:** ghost (in the hold before you boarded) → pirates (3, tidal-schedule reliable) → unnamed thing that rises to meet them
**Word count:** ~145

---

### NODE: AL — Visby Approach Alley

**Named location:** The Alley Mouth, Harbor-Side

**Current text:**
> The edge of Visby. Warrant scouts watch every entrance. Show the Conclave Pass — or fight through the checkpoint.

**Proposed replacement:**
> The alley is forty feet of bad light between the harbor road and Visby's outer district. Warrant scouts work both ends. They have been at this post long enough to know every face that belongs here — and can describe, in detail, every face that doesn't.
>
> The kenku on the drainpipe above the left wall has heard every excuse this alley produces. It repeats them back, occasionally, at inconvenient moments. It is not the threat. It is the warning that the thugs behind it have heard it all before.
>
> The Conclave Pass gets you through in under a minute. Without it, the two men at the far end step forward and the kenku goes quiet — which is the only time it ever does.
>
> Visby is forty feet away. The sewer grating to the left is the other route. It is not better. It is faster.

**Props:** Bad light between two lamp posts · Kenku on the drainpipe · Conclave Pass (or its absence) · Sewer grating as alternative
**Threshold test:** The ford the knight must cross — credentials or force; the Pass is the letter of introduction bought in Pachelbel's back room for 15gp
**Host-guest:** Inverted — gatekeepers not hosts; the Pass converts them into something barely civil
**Fateful object:** The Conclave Pass — presence or absence determines the next forty feet
**Monster scale:** kenku (mimic-vermin, warns, doesn't lead) → thugs ×2 (muscle, well-rehearsed) → sewer route (wererat/nekker tier — the price of the faster path)
**Word count:** ~145

---

### NODE: MI — Plains & Midlands

**Named location:** The Noon Point, Open Road

**Current text:**
> Open road. Wide sky. Farms abandoned. Livestock wandered off. A 'field woman' appears at noon on the open plain.

**Proposed replacement:**
> The road between Birka and the highlands runs through farming country that has stopped farming. The gates stand open. The livestock have wandered far enough that they're no longer visible from the road — which means they either found shelter, or stopped needing it.
>
> At noon, the plain produces no shadows. This is the structural fact the road doesn't warn you about.
>
> A pack sits in the center of the track, contents intact, abandoned mid-stride by someone who had somewhere else to be very suddenly. The crows on the fence line know what happened. They are not saying.
>
> The field wraith comes first. The noonwraith herself arrives when the sun is directly overhead and your shadow disappears beneath your feet. She is not hostile in the way that implies intent — she is hostile in the way that a tide is hostile, or a frost.
>
> Cross before noon or after. The road does not enforce this. The noon does.

**Props:** Open farm gates · Abandoned pack (contents intact) · Crows on the fence line · The shadowless noon
**Threshold test:** Time is the gate — noon is the ford; the test is whether you are caught in the open when the shadow goes
**Host-guest:** Anti-host — abandoned farms are failed hospitality; noonwraith is natural law, not a guardian
**Fateful object:** The abandoned pack — intact contents encode sudden departure; the crows have the answer
**Monster scale:** crows (ambient warning) → field wraith (precursor, arrives first) → noonwraith (tide-hostile, structural)
**Word count:** ~155

---

### NODE: FO — Aldric's Forest

**Named location:** The Hermitage Clearing, Crow-Marked Path

**Current text:**
> Ancient trees. Crow-marked trunks every 200 paces. Brother Aldric's hermitage: a stone hut, a fire, boiling mushrooms. He has been expecting someone.

**Proposed replacement:**
> The crow marks begin at the forest edge: carved into bark every 200 paces, roughly at eye height, facing the path. They are not warnings. They are a count. Someone has been keeping track of how deep the forest goes, and the marks stop where the leshen's territory begins.
>
> The hermitage is a stone hut in a clearing too regular to be natural. Brother Aldric keeps a fire outside it. The mushrooms in the pot have been boiling since before you entered the tree line — you can smell the smoke from the last crow mark.
>
> He does not look up when you arrive. He sets a second bowl on the stone beside the fire.
>
> The leshen commands everything in this forest that is not Aldric's clearing. The crows report to it. The root system beneath your feet belongs to it. The Earthbind Root you need grows at the border — exactly where the marks stop.

**Props:** Crow marks as count not warning · Smoke readable from the last mark · Second bowl already set · The gap where the marks stop
**Threshold test:** The last crow mark is the ford — past it is the leshen's territory; the Earthbind Root grows there
**Host-guest:** Aldric is the model Chrétien hermit-host — fire lit, bowl set, guest expected before arrival announced
**Fateful object:** The crow marks that stop — the gap encodes the leshen's border more precisely than any map
**Monster scale:** crows (leshen's surveillance, vermin as informants) → root system beneath your feet (passive reach, always present) → leshen (commands the forest entire; the clearing is the only exception)
**Word count:** ~155

---

### NODE: HL — Irish Highlands

**Named location:** The Village Common, Dunfall — Dusk

**Current text:**
> Rolling hills. Cold wind. Standing stones. Dunfall village bars its doors at dusk — a kelpie has been in the loch for two seasons. Elder Fionn asks for help.

**Proposed replacement:**
> The standing stones around the loch predate the village by a long margin. They were not placed as warnings. The village learned to read them anyway: when the light behind the stones goes gold, the doors in Dunfall bar from the inside.
>
> The kelpie has been in the loch two seasons. In that time the fishing has gone, the ford has closed, and three men who did not make it back before dusk did not make it back at all. The village cannot afford a fourth.
>
> Elder Fionn keeps his fire on the common side of the door, facing the loch. He will ask for help before you are fully inside. He has been asking everyone who passes for two seasons. You are the first to arrive who looks like the answer.
>
> The Cú Sídhe run the moorland above the loch at night — the hounds that hunt before the kelpie surfaces. You will hear them before you see the water move.

**Props:** Standing stones as dusk-clock · Barred doors as two-season habit · Fionn's fire facing the loch · Still surface before it moves
**Threshold test:** Dusk is the gate — gold light behind the stones is the signal; remaining outside is the choice
**Host-guest:** Fionn asks before you are fully inside — distressed host exhausted of options; you are the first who looks like the answer
**Fateful object:** Standing stones — predating the village, not built as warnings, read as warnings anyway
**Monster scale:** Cú Sídhe (moorland hunters, arrive first — hear before water moves) → kelpie (surfaces after hounds; takes the shape of what you want most on a dark road)
**Word count:** ~155

---

### NODE: SW — Murky Swamp

**Named location:** The Causeway — Last Intact Section

**Current text:**
> The road becomes a causeway. The causeway becomes a suggestion. A Drowner has been killing bridge repair crews. The Runed Stone is at the center crossing.

**Proposed replacement:**
> The road becomes a causeway two hundred paces past the forest edge. The causeway becomes a suggestion shortly after. The last intact section has three planks missing and a set of repair tools left by someone who decided not to finish.
>
> The bridge crews stopped coming after the second drowner pulled a man off the staging platform. The water here does not move when you drop something into it. The fog moves instead — it turns without wind, thickens at the center crossing, thins when you look directly at it. The foglet that lives in it works the same way.
>
> The Runed Stone sits at the center crossing. You can see it from the last intact plank. The drowners know you can see it. The waterhag at the southern end knows you need it.
>
> Getting there is not the same problem as getting back.

**Props:** Three missing planks · Abandoned repair tools · Still water · Runed Stone visible from safety
**Threshold test:** The last intact plank — object visible; crossing is the commitment
**Host-guest:** Swamp refuses all hospitality; abandoned tools are the evidence of every failed attempt
**Fateful object:** The Runed Stone — visible but held by a space that dismantles the path to it
**Monster scale:** foglet (disorientation, thins when looked at) → drowners ×2 (ambush; know your sight line) → waterhag (southern border; positioned at the exit, knows you need it)
**Word count:** ~145

---

### NODE: HS — The Crones' Domain

**Named location:** The Inner Clearing — Green Water, Wrong-Direction Trees

**Current text:**
> Deeper in. Water glows faintly green. Trees grow in wrong directions. The Crones — Whisper, Glut, and Wane — trade the Runed Stone for the sea road and a binding web.

**Proposed replacement:**
> Past the swamp's center the trees begin growing toward directions that don't correspond to any compass. The water glows faintly green — not bioluminescence, not reflection. The light comes from below, from something with no interest in being identified.
>
> The Crones are already in position when you arrive. Whisper, Glut, and Wane have arranged themselves in a triangle around the space you will stand in, and they did this before you entered the tree line. They are not threatening. They are prepared.
>
> They will trade the Runed Stone for the Sea Cave Key and a Binding Web. The Web will matter later. They know this. They give it to you in advance — which is the courtesy their kind extends to those they consider worth the effort.
>
> The sleep here is free. This is the part to think carefully about.

**Props:** Wrong-compass trees · Green-lit water from below · Triangle arranged before you arrived · Binding Web given before it's needed
**Threshold test:** Past the swamp's center the compass fails — negotiate in a space that doesn't run on human rules
**Host-guest:** Fairy host motif — hospitality freely given, terms unstated; free sleep carries an unstated contract
**Fateful object:** The Binding Web — given in advance of need; Crones operate on a time scale that includes your future
**Monster scale:** No battle — Crones are the power structure; green light below is the deeper thing; domain produces nothing the Crones don't permit
**Word count:** ~150

---

### NODE: BE — Tropical Beach

**Named location:** The North Shore Firepit

**Current text:**
> First sight of the sea. A dinghy beached near a firepit. Note under it: signal with three torch flashes after dark. Pirates raid before the signal can be sent.

**Proposed replacement:**
> You hear the sea before you see it — through the last of the tree cover, a low continuous sound the forest has been absorbing for hours. The canopy ends and the beach opens: white sand, a firepit with ash that hasn't dispersed, a dinghy dragged above the tide line with a note tucked under the bow.
>
> *Three torch flashes after dark. Signal, and someone will come.*
>
> The ash is still warm. Whoever left the note has not been gone long. The sahuagin in the shallows have been in position longer than that — they arrived from the water side and have been waiting for something to happen on the beach.
>
> The pirates come from the tree line, not the water. They've been watching from the same side you came in on. Three of them. They are not interested in the note.
>
> The Signal Torch is in the dinghy. The signal window opens after dark. The pirates don't wait that long.

**Props:** Warm ash · Note under the dinghy bow · Signal Torch · Three-flash protocol
**Threshold test:** Sea heard before seen — canopy end is the threshold; note is the gate; signal is the password
**Host-guest:** Absent host left instructions recently; pirates interrupt before the contract completes
**Fateful object:** Signal Torch in the dinghy — needed later; note is the absent host's only remaining presence
**Monster scale:** sahuagin ×2 (water side, in position before you arrived) → pirates ×3 (tree line — they were behind you the whole time)
**Word count:** ~150

---

### NODE: OC — Aboard the Cerulean Debt

**Named location:** The Main Deck — Mid-Ocean, Night Watch

**Current text:**
> Captain Draketide's ship. She reviews your items, laughs about the Trade Seal, and agrees to help. Mid-ocean at night, something surfaces.

**Proposed replacement:**
> Captain Draketide reviews your items on the dock before she agrees to anything. She picks up the Trade Seal, reads it, and laughs — not unkindly. She sets it back down and takes you aboard anyway, which tells you more about her opinion of the Conclave than the laugh did.
>
> The Cerulean Debt runs a tight chart room. The Feint Scroll is filed between two ocean surveys — someone left it there and she has not moved it, which means she either hasn't found it or has decided it belongs to whoever knows to look.
>
> Mid-ocean on the night watch the wake goes wrong. Not choppy — wrong. The water behind the ship flattens in a line, as if something very large passed beneath it and the surface is still settling. The kraken spawn surface first. They always do.
>
> The sea serpent follows at a distance it considers safe.

**Props:** Trade Seal that earns the laugh · Feint Scroll filed between ocean surveys · Wrong wake at night · Spawn that always surface first
**Threshold test:** Item review on the dock — Draketide decides by what you carry; laugh is verdict, boarding is the pass
**Host-guest:** Captain-host with complete authority; takes you aboard despite the Conclave seal; Feint Scroll left unmoved = host who leaves space for guest's discoveries
**Fateful object:** Feint Scroll — placed deliberately, waiting for whoever knows to look
**Monster scale:** kraken spawn ×2 (surface first, always — known precursors) → sea serpent (follows at a distance it considers safe — calculating, not charging)
**Word count:** ~155

---

### NODE: IS — Island Shore

**Named location:** The Harbor Dock — Deep Water Moorings

**Current text:**
> An island harbor. Fishermen, smugglers, retired pirates. The local oracle's apprentice delivers a sealed message from Kassiphane.

**Proposed replacement:**
> The island harbor runs on a three-tier economy: fishermen who ask no questions, smugglers who ask the right ones, and retired pirates who have stopped asking anything at all. All three know you arrived on the Cerulean Debt. None of them mention it.
>
> The deep water moorings at the far end of the dock are empty. Whatever anchors there comes and goes without appearing in the harbor master's log.
>
> The oracle's apprentice finds you before you've cleared the gangplank. She is young, unhurried, and has been holding a sealed letter since before the Debt was sighted on the horizon. The seal is Kassiphane's.
>
> She does not explain who Kassiphane is. She hands you the letter and walks back up the dock without waiting to see if you open it.
>
> Below the island, at a depth the fishermen know not to fish, the Atlantean ruins begin.

**Props:** Empty deep-water moorings (unlogged) · Sealed letter held before ship sighted · Fishermen who know the depth
**Threshold test:** Three-tier harbor economy as social gate — permitted by vessel, not by name
**Host-guest:** Apprentice as proxy host — letter prepared before arrival; apprentice doesn't wait, encoding Kassiphane's certainty
**Fateful object:** Kassiphane's Letter — sealed, anticipated, delivered before you were on the horizon
**Monster scale:** retired pirates at wrong dock → unlogged deep moorings → Atlantean ruins below (depth the fishermen don't fish — Deep Ones begin there)
**Word count:** ~150

---

### NODE: AT — Atlantis, Sunken City

**Named location:** The Sunken Library Hall — Bell Landing Point

**Current text:**
> Underwater. Cold. Dark. Beautiful. Draketide's diving bell descends to the sunken library hall. Deep Ones guard the scroll case.

**Proposed replacement:**
> Draketide's diving bell takes twelve minutes to reach the library floor. The descent is cold and then colder, dark and then differently dark — at a certain depth the darkness stops being the absence of light and becomes a substance in its own right.
>
> The library hall is intact. Marble columns preserved by cold and pressure run the length of a room larger than any building in Birka. Bioluminescent growth covers the lower shelves and provides enough light to read by, which suggests the library has not been unread.
>
> The Deep Ones guard the scroll case with the patience of things that have nowhere else to be. They are not the difficulty.
>
> The Aboleth has been in the eastern alcove since before the city was underwater. It has read everything in this library. The water near it is slightly thicker than the water elsewhere, and carries a quality you feel in your reasoning before you feel it in your body.
>
> The scroll case is on the central lectern. The Aboleth already knows you are here.

**Props:** Twelve-minute descent · Intact marble columns · Bioluminescent shelf growth (library in continuous use) · Thicker water near eastern alcove · Scroll case on central lectern
**Threshold test:** Bell descent is the commitment — twelve minutes down, twelve back; library floor is the game's deepest threshold
**Host-guest:** Aboleth as anti-host — predates hospitality; "already knows you are here" inverts the Chrétien host's preparation
**Fateful object:** Scroll case on the lectern — visible and central; bioluminescent shelves encode continuous use
**Monster scale:** Deep Ones ×3 (patient, not the difficulty) → Aboleth (geological time, reads your reasoning before your body knows)
**Word count:** ~165

---

### NODE: SC — Sea Cavern

**Named location:** The Salt-to-Fresh Transition — Inner Passage

**Current text:**
> The coastal cave system connecting the sea approach to the freshwater interior. Scholar King markers carved on the walls. A Dragon Turtle guards the inner passage.

**Proposed replacement:**
> The cave system runs from the coastal approach to the freshwater interior — the only passage between sea and lake that doesn't require forty miles of highland. The Scholar Kings knew this. Their markers are carved at intervals where a traveler needs reassurance the route continues: every fifty paces, a little deeper, a little higher as the cave rises.
>
> The water changes from salt to fresh in the second chamber. You can tell by taste, and by the different quality of silence the cave carries on the far side.
>
> The cave vermin — blind crabs, thermal vent fish, the small pale things that live near the Dragon Turtle's heat — stay in the outer sections. They have learned the boundary.
>
> The Dragon Turtle holds the inner passage at its narrowest point. The heat arrives before it does. The Scholar King who placed the last marker on this wall left it at the passage entrance and did not mark anything beyond.

**Props:** Scholar King markers at fifty-pace intervals · Taste-change from salt to fresh · Thermal boundary the cave vermin respect · Last marker at entrance with nothing beyond
**Threshold test:** Inner passage at its narrowest — cave commits to a single line; Dragon Turtle holds exactly that point
**Host-guest:** Scholar Kings marked the route for those who followed — the last marker is their farewell; Dragon Turtle inherited what they abandoned
**Fateful object:** The last Scholar King marker — placed at passage entrance; nothing marked beyond; the gap is the record
**Monster scale:** blind crabs / thermal vent fish (outer sections, learned the boundary) → Dragon Turtle (holds the narrowest point; heat arrives before it does)
**Word count:** ~155

---

### NODE: FL — Freshwater Lake & River

**Named location:** The Water Shrine — Stone Circle, Lake Shore

**Current text:**
> The river cave exits into a lake. A water shrine — stone circle half-submerged at the shore. Place a silver coin, receive the River Blessing: one free inn beat.

**Proposed replacement:**
> The river cave exits into light. After the inner passage's single-file dark, the lake opens into sky and cold clean air. The stone circle at the shore is half-submerged — lower stones green with growth, upper stones dry. The water level has been rising for long enough that whoever built the circle did not build it to be standing in the lake.
>
> A silver coin placed at the circle's center returns the River Blessing: one night's rest, given by the stone and the water jointly. No coin, no blessing. The exchange is older than the currency.
>
> The kappa in the shallows are territorial but courteous — if you know to bow first, they bow in return, the water in their dish spills, and the rest of the encounter is negotiable. Most travelers don't know to bow.
>
> The River Troll holds the deep water at the lake's northern end. It does not come into the shallows. The kappa see to that.

**Props:** Half-submerged stone circle (lower green, upper dry) · Silver coin · Kappa's dish of water · Deep northern end
**Threshold test:** Shrine offering as voluntary contract — older than the currency; kappa bow as second threshold requiring courtly knowledge
**Host-guest:** Shrine as oldest host — stone and water as joint hosts; contract carved not spoken
**Fateful object:** Silver coin — smallest offering, most significant return; water level encodes the shrine's age
**Monster scale:** kappa ×2 (territorial but courteous — bow unlocks negotiation; most don't know) → River Troll (deep water; kappa maintain his boundary)
**Word count:** ~165

---

### NODE: DS — Deep Sea Trench

**Named location:** The Trench Crossing — Open Deck, Mid-Passage

**Current text:**
> Draketide takes the ship over the trench on the way back north. The Leviathan's silhouette passes far below. A whirlpool forms.

**Proposed replacement:**
> The water above the trench is a different color than the ocean around it — darker, with a quality of depth that daylight does not correct. Draketide crosses it on the return north because it is the fastest route and because she believes the ship is fast enough.
>
> The hull makes a sound it does not make in shallower water. Once. Then twice. Then the current changes.
>
> Far below — at a depth where the trench light fails entirely — the Leviathan's silhouette passes. It moves in a direction that does not correspond to any current. The ship rocks in the pressure wave of its passage and settles. It does not surface. It does not need to.
>
> The Charybdis forms at the surface while this is happening. It builds from the outer edge inward — which gives you the time between the first rotation and the last to do something about it. The window is not generous.

**Props:** Trench's darker water visible from deck · Hull sound made twice · Leviathan silhouette at unmeasurable depth · Whirlpool building from outside in
**Threshold test:** Crossing is the commitment — fastest route, only if ship is fast enough; whirlpool window is the gate
**Host-guest:** Draketide chose this route — host makes decisions you don't control; Leviathan is the anti-host that doesn't acknowledge the ship
**Fateful object:** Hull sound twice then silence; pressure wave confirms Leviathan without a sighting
**Monster scale:** Charybdis (surface — whirlpool building inward, time-gated) → Leviathan (below the light, passes without engaging; ship is beneath its notice)
**Word count:** ~155

---

### NODE: SE — Visby Sewers

**Named location:** The Main Channel — Lower Road Junction

**Current text:**
> The sewers connect the lower road to Visby's goblin district. The smell is accurate. Goblin guide Gritch works here for 3gp and won't go near the goblin cave.

**Proposed replacement:**
> The smell is accurate.
>
> Goblin guide Gritch works the lower junction for three gold. He knows every passage in this system — where the channels run clear, where the overflow backs up, which routes the wererats consider theirs and which they have ceded. He scratches route markers into the lower brickwork at knee height. Most guides use torchlight. Gritch uses the markers.
>
> The wererats in the eastern channel are the manageable problem. The nekkers coming in from the goblin district are smaller, faster, and arrive in numbers the channel is not wide enough to fight in comfortably.
>
> Gritch will take you as far as the goblin cave approach. There he stops, hands you the torch, and tells you the price was three gold and this is the three-gold route.
>
> What lies past the approach is a different negotiation, with different parties, and he is not one of them.

**Props:** Knee-height route markers in brickwork · Overflow channels · Torch handed over at the cave approach · Goblin cave defined by Gritch stopping
**Threshold test:** Goblin cave approach is Gritch's limit — his stopping point marks the threshold; past it is a different contract
**Host-guest:** Mercantile host who keeps exactly to stated terms; "three gold and this is the three-gold route" honored to the letter
**Fateful object:** Gritch's knee-height markers; torch handed over encodes transfer of responsibility
**Monster scale:** wererats ×2 (eastern channel — territorial, negotiable) → nekkers ×3 (goblin district — pack hunters, channel too narrow)
**Word count:** ~150

---

### NODE: BK — Broken Tooth Tavern, Visby

**Named location:** The Main Floor — Mordus's Table

**Current text:**
> The Warrant Hall is upstairs. Downstairs is extremely lively. Warlord Mordus explains the shaman problem: it's bad for business.

**Proposed replacement:**
> The Broken Tooth runs on two levels. The main floor is extremely lively — the specific kind of lively that happens when a warlord has a corner table and everyone in the room has decided to behave as though they haven't noticed. The Warrant Hall is upstairs. The stairs are in the back, past Mordus.
>
> Warlord Kael Mordus sits with a sightline to both the door and the stairs. The staff brings his drink without being asked. He is explaining the shaman problem to no one in particular when you arrive — which means he was explaining it to you before he knew you were coming.
>
> "It's bad for business," he says. This is his moral framework. In this context, it is also accurate.
>
> The shaman's influence runs through the Warrant Hall above him. Mordus runs the floor below. Neither has fully displaced the other yet.

**Props:** Corner table with dual sightline · Drink without request · Stairs past Mordus as gated passage · Warrant Hall above as unreached threshold
**Threshold test:** Stairs to Warrant Hall are the structural gate — Mordus between door and stairs; he is the knowledge toll
**Host-guest:** Host with prior agenda — already talking to you before you arrived; drink without request encodes territorial authority
**Fateful object:** Shaman's influence in Warrant Hall — framed commercially by Mordus; "bad for business" is the object compressed into a verdict
**Monster scale:** main floor performing normality (social cover) → shaman's influence in Warrant Hall → temporary balance between them ("yet")
**Word count:** ~155

---

### NODE: GC — Goblin Warrens, Visby

**Named location:** The Central Warren — Three-Clan Convergence

**Current text:**
> Three goblin clans and one Void shaman who convinced them all he is a god. Shard #4 is the shaman's ritual focus. Goblins are fighting each other — the Void Virus is already active.

**Proposed replacement:**
> Three goblin clans have shared these warrens for two generations. The territorial markers scratched into the passage walls were the only law that functioned down here. They are no longer functioning.
>
> The Void Shaman arrived eight months ago and told all three clans he was a god. The evidence he offered was the Crimson Warrant — a ritual object that produces effects the goblins had no prior framework for. The clans accepted this. They are now fighting each other over which of them the god loves best, which is how the Void Virus spreads.
>
> The hobgoblins nearest the shaman's chamber are still loyal and organized. The goblins in the outer passages are fighting their cousins and do not particularly care which direction you approach from.
>
> The Void Virus Canister is in the shaman's chamber. He has not used it yet. He is waiting for the right moment — which is a concerning sign of patience in something that calls itself a god.

**Props:** Two-generation wall markings no longer respected · Crimson Warrant as sacred display · Void Virus Canister held in reserve · Outer goblins too distracted to prioritize you
**Threshold test:** Past Gritch's limit — different negotiation, different parties; shaman's chamber is the inner gate
**Host-guest:** Shaman as false divine host — corrupted hospitality into competition for divine favor
**Fateful object:** Crimson Warrant as ritual focus — removes his godhood when taken; Canister held with deliberate patience
**Monster scale:** goblins ×4 (outer, disorganized — chaos as cover) → hobgoblins ×2 (chamber guard, loyal) → Void Shaman (restraint with Canister is the real threat)
**Word count:** ~165

---

### NODE: PC — Pirate Cave, Visby

**Named location:** The Storage Chamber — Between Goblin Warrens and Coast

**Current text:**
> A connected cave system off the goblin warrens runs to the coast. Visby's pirate faction stores stolen goods here. Not hostile to Warrant passholders.

**Proposed replacement:**
> The cave runs from the goblin warren junction to the coast — a quarter mile of dry passage with the salt smell strengthening as you go east. The pirate faction has been using the inland section as a warehouse long enough that the crates have developed a sorting system. Goods with paperwork are stacked near the entrance. Goods without paperwork are near the exit.
>
> The faction does not ask about your Warrant credentials. They read them. If they are in order, you are a guest. If they are not in order, this conversation is already over.
>
> The Nautical Chart on the east wall covers routes the Conclave harbor master does not have on record. This is not an accident.
>
> The coastal exit opens to a cove the Conclave has not mapped. The faction keeps it that way.

**Props:** Salt smell strengthening east · Two-tier crate sorting (paperwork near entrance, none near exit) · Nautical Chart on east wall · Unmapped coastal exit
**Threshold test:** Credentials read not asked — gate set at AL; recognition here is silent and immediate
**Host-guest:** Conditional hospitality stated precisely — in order: guest; not in order: already over
**Fateful object:** Nautical Chart — routes not on official record; knowledge asymmetry is the value
**Monster scale:** No battle — faction is the peace if credentials hold; unmapped cove is the implied external threat
**Word count:** ~145

---

### NODE: MC — Monster Den, Visby Pass

**Named location:** The Outer Den — Where the Road Used to Run

**Current text:**
> A zeugl — a massive tentacled horror — has been nesting here for three seasons. The road through is blocked. There is no route around.

**Proposed replacement:**
> The road through this section has been a den for three seasons. You can trace where it went by the outline in the wall — the cut stone is still visible at the edges, but the center is covered in a biological residue the zeugl produces when nesting. It has been nesting for three seasons. The residue has developed layers.
>
> An Abandoned Scholar Pack sits against the left wall at the den's outer edge. The contents are intact. The scholar is not.
>
> The Greater Mutants hold the middle chamber — offspring or byproducts of prolonged zeugl presence, larger than the residue should be able to produce, faster than the den's geometry suggests. They have learned the space. You have not.
>
> The zeugl is in the inner chamber. It has been here long enough that the cave has adapted to it, not the other way around.
>
> There is no route around. This has been true for three seasons.

**Props:** Cut stone outline visible at edges, center buried · Residue with developed layers · Scholar Pack intact, scholar not · Greater Mutants who know the geometry
**Threshold test:** Hardest gate in the game — no route around, stated twice; the ford with no alternative
**Host-guest:** Absolute anti-host — cave adapted to zeugl; scholar's pack is evidence of the last guest
**Fateful object:** Scholar Pack — contents intact encodes zeugl's indifference to material goods; scholar's purpose lost with them
**Monster scale:** residue vermin (every crevice) → Greater Mutants ×2 (middle chamber, know the geometry) → zeugl (inner chamber, three-season territorial authority)
**Word count:** ~165

---

### NODE: CA — Scholar Kings' Underground Road

**Named location:** The Functional Section — Second Junction West

**Current text:**
> The Scholar Kings built underground roads. Some still work. The dead down here are restless — and recent.

**Proposed replacement:**
> The Scholar Kings built these roads to standards that have outlasted their civilization by four centuries. The vaulting is intact in seven of the nine sections. The other two collapsed within living memory — the rubble has not yet compacted. Builder's marks at each junction indicate which branch continues and which ends in stone.
>
> The dead here come in two vintages. The wights in the second chamber are old — Scholar Kings-era, possibly road wardens who never left their post. They remember the layout in the way things retain memory after they stop being able to form new ones. The sluagh are recent. Something happened at the western end last season that produced three of the unforgiven dead, and they have not yet learned the road's geometry.
>
> The wraith moves between both groups. It does not belong to either vintage.
>
> The Catacomb Map is folded into a niche at the fourth junction. Someone was surveying this road and stopped mid-survey.

**Props:** Builder's marks at each junction · Rubble not yet compacted (recent collapse) · Catacomb Map mid-survey in fourth junction niche · Wraith with no history here
**Threshold test:** Builder's marks are the navigation gate — functional and collapsed sections indistinguishable without them
**Host-guest:** Scholar Kings as four-century hosts; road wardens who never left; recent sluagh violate the road's institutional hospitality
**Fateful object:** Catacomb Map — stopped mid-survey; incomplete map encodes interrupted mission
**Monster scale:** wights ×2 (old, remember layout — post-memory retention) → sluagh ×3 (recent, still learning geometry) → wraith (no vintage, no constraint)
**Word count:** ~170

---

### NODE: VC — Vampire Castle Ruins, Visby Pass

**Named location:** The Castle Gate — Built Into the Road

**Current text:**
> No road bypasses it. The castle was built to be unavoidable. Bruxa Elise Mourne collects tolls — not in coin, but in blood debt and returned items.

**Proposed replacement:**
> The castle was built so the road passes through the great hall, not beside it. There is no path around. This was an architectural decision made several centuries ago and has been enforced every day since.
>
> Bruxa Elise Mourne is at the gate when you arrive. She is in human form, which is the courtesy she extends to travelers who have not yet been rude. The toll is not in coin. She will tell you what you owe and what you are carrying that belongs to her — she has had a long time to develop her accounting.
>
> Blood debt is older than currency. Returned items are simply things that found their way into circulation when they should have stayed here.
>
> The room she offers is on the second floor, east wing. The bed is the best you will find between Visby and the desert. The sleep is free. She does not explain why.
>
> What she does in the west wing is her own business.

**Props:** Road through great hall (no bypass) · Human form as courtesy · Centuries-developed toll ledger · East wing room (best bed in Act V) · West wing as private domain
**Threshold test:** Gate is the road — no alternative; toll is the threshold condition; she knows what you owe and what you carry that is hers
**Host-guest:** Fullest Chrétien host in the game — toll paid, hospitality complete; free sleep without explanation; west wing is the guest boundary
**Fateful object:** Returned items in your inventory that are hers; Toll Token as proof of satisfaction
**Monster scale:** No battle — toll is the alternative; Elise unpaid is a Bruxa with centuries of practice; west wing holds what east wing guests don't see
**Word count:** ~165

---

### NODE: DE — Desert Wastes

**Named location:** The Crossroads Marker — Open Sand

**Current text:**
> Sand. Heat. Things that move faster than they should. The crossroads marker points to the caravan's pattern of movement.

**Proposed replacement:**
> The desert offers one navigational aid: a stone post at the crossroads, carved with arrows that have been re-cut several times as the wind wore the edges down. The caravan's pattern of movement is marked on the eastern face. The marking is fresh enough that someone passed through within the season.
>
> Everything else the desert offers is a problem. The heat at midday produces a shimmer the sand wraith uses as cover — it moves through the distortion faster than the eye resolves it. The mummies in the western sand are slower, which is their only mercy. They do not tire. They do not stop because you are moving. They stop when you do.
>
> The scorpions and vipers shelter in the shadow of the crossroads post at noon. They are the smallest things out here and the easiest to manage. They are also the only things out here with the sense to find shade.
>
> The caravan is east. The marker points there. Getting there before dark is the question the desert is asking.

**Props:** Stone post re-cut by wind erosion · Fresh eastern marking within the season · Heat shimmer at midday · Post shadow sheltering vermin at noon
**Threshold test:** Getting there before dark — natural law; marker gives direction not guarantee; desert tests endurance across the crossing
**Host-guest:** Purest anti-hospitality — post is impersonal aid from previous travelers; caravan is the distant host the desert interposes between
**Fateful object:** Desert Crossroads Marker — ancient, maintained, recently used; freshness is the only evidence of human presence
**Monster scale:** scorpions / vipers (post shadow — smallest, most sensible about shade) → mummies ×2 (tireless, stop when you stop) → sand wraith (heat shimmer cover, faster than eye resolves)
**Word count:** ~165

---

### NODE: DC — Izador's Desert Caravan

**Named location:** The Center Awning — Philosopher's Court

**Current text:**
> 30 people, 12 camels, a philosopher. Sandmage Izador meditates under a sun awning — unsurprised. The djinn has had Shard #5 for two centuries.

**Proposed replacement:**
> Thirty people and twelve camels moving through the desert constitute a civilization in miniature. Izador's caravan has been following the pattern marked on the crossroads post for longer than the current crossroads post has been standing. The people know the route. The camels know it better.
>
> Sandmage Izador is under the center awning when you arrive. He is meditating. He does not open his eyes. He moves a cushion to the left with one hand to make space, which means he heard you coming while you were still too far away for the camels to notice.
>
> "The djinn has had it for two centuries," he says. This is not a preamble. This is the situation.
>
> The djinn circles the caravan at the eastern perimeter. The thirty people have been traveling alongside a two-century territorial djinn long enough to have developed accommodations for it — where to camp, which direction to face the tents, what not to do near the eastern edge after dark. The Sand Cipher is in the djinn's custody. The djinn does not consider this unusual.

**Props:** Center awning (only shade) · Cushion moved left without eyes opening · Djinn's eastern perimeter circuit · Caravan's accommodations (tent orientation, camp position)
**Threshold test:** Djinn is the inner threshold — Shard in custody 200 years; caravan arrival completes desert crossing but opens the next gate
**Host-guest:** Philosopher-host who prepares before you arrive; caravan as traveling civilization adapted around a permanent territorial complication
**Fateful object:** Sand Cipher — 200 years in djinn custody; djinn finds this unremarkable, which is the most important detail
**Monster scale:** caravan vermin (food stores, camel line) → thirty people (behavior variable near djinn) → djinn (eastern perimeter, two centuries, territorial and absolute)
**Word count:** ~170

---

### NODE: MT — The Mountain Pass, High Crest

**Named location:** The Cliff Edge Lookout — Southern Face

**Current text:**
> A narrow pass through sheer rock faces. Wind cuts horizontal. Eagles circle the southern ledge. Griffons nest above. The path dead-ends at a cliff overlooking the Midlands. Good place to wait for prey.

**Proposed replacement:**
> The pass is narrow enough that two cannot walk abreast. The rock faces are sheer and close, and the wind comes through horizontal — not down from above, not up from below, but straight across at chest height, continuous, like something that has been doing this for centuries and has no interest in stopping.
>
> The path dead-ends at a cliff overlooking the Midlands. Eagles work the thermal off the southern ledge. They are not interested in you.
>
> The griffons nest in the upper rock above the lookout — three visible, others audible. They are not hunting. Griffons at rest communicate this clearly: weight settled, not coiled. They watch without tracking. You are not the scale of thing they are waiting for.
>
> Standing at the edge, the Midlands spread below in the full distance you have crossed. The road you walked looks, from here, like something a predator would use.

**Props:** Horizontal chest-height wind (centuries-continuous) · Eagle thermal off southern ledge · Griffon nest above (weight settled, not coiled) · Midlands road visible as hunting corridor
**Threshold test:** Dead-end cliff as perspective threshold — no combat, no loot; test is what you understand when you see where you have been from above
**Host-guest:** Griffons as territorial owners — passage permitted by irrelevance; you are not the scale of thing they wait for
**Fateful object:** The view — road walked looks like a predator's corridor; perspective transforms already-crossed geography
**Monster scale:** eagles (thermal, not engaged) → griffons (nested, at rest — watching without tracking; more audible than visible)
**Word count:** ~165

---

### NODE: CO — Cosmic Realm, The Convergence

**Named location:** The Spire Platform — Above Birka, Noon

**Current text:**
> The spire above Birka. The sky turns black at noon. The Void is already here. Commander Bruhns holds the platform with a military cordon. The Codex Cradle is built into the spire wall.

**Proposed replacement:**
> The spire above Birka is the tallest structure in the known world, built for this specific purpose by people who knew this day would come and did not know when. The Codex Cradle is set into the eastern spire wall at platform height. It has been waiting here since construction was complete.
>
> The sky is black at noon. This is not weather. The Void does not cause nightfall — it causes noon itself to fail. Below the platform, the city of Birka is still lit by the morning that preceded this hour. Up here the light stopped when the convergence began.
>
> Commander Bruhns holds the platform perimeter with a military cordon. He arrived before you. He has always arrived before you. He does not explain how.
>
> Seven Void Walkers stand between you and the Cradle. After them, the Void Warlord — the Void's chosen instrument, not its full extent. The full extent is behind it and does not require a body.
>
> This is the threshold every other threshold was oriented toward.

**Props:** Codex Cradle in eastern spire wall (built first) · Black noon above, morning light below · Bruhns's cordon · Seven Walkers before the Warlord · NG+: Froberger's letter at base of spire
**Threshold test:** Cumulative threshold — every prior gate pointed here; the Cradle is where all crossings terminate
**Host-guest:** Bruhns as host of last resort — always arrived first; Void Warlord as instrument not source
**Fateful object:** Codex Cradle — predates the building; the Bloodstained Map, every Shard, every crossing terminates here
**Monster scale:** Void Walkers ×7 (threshold before the threshold) → Void Warlord (instrument) → the Void itself (behind it, does not require a body)
**Word count:** ~175

---

### NODE: SL — Birka Slums

**Named location:** The North Alley Junction — Gutter Stone Crossroads

**Current text:**
> The cramped alleys north of Birka market. Refuse heaps attract every pest the city produces. Children dare each other to touch the leech-covered gutter stones.

**Proposed replacement:**
> The alleys north of the Birka market are too narrow for carts and too cramped for anything to move through quickly. This is their primary defense. The refuse heaps at each junction attract every pest the city produces — rats in the lower layers, cockroach swarms in the dry section above, wasps where the heat concentrates in the overhang. The city does not come here to clean. The city does not come here.
>
> Three children are playing a dare game at the gutter crossroads when you arrive. The rules are visible in how they stand: one touches the leech-covered stones, two watch. They have run this game long enough to know exactly how close you can get before a leech detaches and looks for warmer purchase.
>
> They don't look at you when you pass. In the slums, ignoring strangers is the social courtesy — it means you have decided not to be a problem.
>
> The road north goes to the Defiant Fields. The children don't go north.

**Props:** Too-narrow alleys (primary defense) · Layered refuse heap (rats / swarms / wasps by tier) · Three children (one touches, two watch) · Road north the children won't take
**Threshold test:** Social not architectural — ignoring strangers is the hospitality code; passing without incident requires reading it correctly
**Host-guest:** No host — city doesn't come here; ignoring strangers is hospitality in ungoverned space
**Fateful object:** Leech-covered gutter stones — calibrated hazard the children have mapped precisely; their knowledge is the slums' institutional memory
**Monster scale:** rats / cockroach swarms / wasps (refuse-heap tiers) → stalk-hunt system draws full Birka city pool (commoner through lich)
**Word count:** ~160

---

### NODE: BQ — Blacksmith Quarter, Weimar

**Named location:** The Forge Floor — Dora Flint's Demonstration Anvil

**Current text:**
> The industrial quarter below Weimar. Forges. Hammering at all hours. Dora Flint throws a Thunderstone at an anvil to demonstrate. The concussive crack rattles the quarter.

**Proposed replacement:**
> The quarter below Weimar runs on a different schedule than the scholars above it — which is to say it runs on no schedule, at all hours, without pause. The hammering has been continuous long enough that the scholars have stopped noticing it. The scholars are wrong to have stopped noticing.
>
> Forges that run too long without rest begin to develop opinions. The Forge Elemental in the eastern bay is the opinion this quarter has developed. The Animated Armor at the forge entrance are the arguments it made when it was still communicating through product.
>
> Dora Flint is at the central anvil. She throws a Thunderstone at it when she sees you — not as a threat, as a demonstration. The concussive crack rattles the quarter wall to wall. She watches your reaction the way a host watches a guest eat the first course.
>
> "Useful," she says. "You'll need two."
>
> She has already set two on the counter.

**Props:** Central anvil as demonstration surface · Thunderstone detonation · Two already on the counter · Eastern bay where elemental has settled · Forge heat shimmer from SQ stairs above
**Threshold test:** Thunderstone demonstration IS the threshold test — Dora reads your response to a detonation; correct response earns the product
**Host-guest:** Merchant-host who performs before selling; product set out before agreement; "You'll need two" encodes foreknowledge
**Fateful object:** Thunderstone — crack advertises itself; two already set out encodes Dora's prior reading of you
**Monster scale:** Animated Armor ×2 (forge entrance — elemental's earlier legible communication, now hostile) → Forge Elemental (eastern bay — developed opinion of continuous operation without rest)
**Word count:** ~155

---

### NODE: YC — Yugurt Cabin

**Named location:** The Cabin Door — Morning, Lakeside

**Current text:**
> Smells like wood smoke and fish oil. A lifetime of tackle on the walls. Nets that haven't been cast in years. A rod propped by the door. He is always here in the morning.

**Proposed replacement:**
> The smell reaches you before the cabin does: wood smoke and fish oil, the specific combination that means a fire kept through the night and something cooked on it years ago that the walls remember. A lifetime of tackle hangs inside — hooks, lines, leaders, a sinker collection organized in a way that took decades. The nets haven't been cast in years. They are hung correctly, maintained, waiting for a decision that hasn't come back yet.
>
> The rod is propped by the door. Not inside — outside, by the door, where a visitor would see it before they knocked.
>
> The Fisherman is always here in the morning. He does not ask where you have been or where you are going. He has a fire. He has a floor you can sleep on for nothing.
>
> This is the only place between the highlands and the coast that offers both.

**Props:** Fish oil smell in the walls from years ago · Decades-organized tackle · Nets hung correctly but not cast · Rod outside the door positioned for a visitor
**Threshold test:** The choice to stop — rod seen before knocking means the threshold is already crossed; the cabin tests whether you can rest
**Host-guest:** Purest Chrétien hermit-host — fire, floor, no conditions, no cost, no questions; trust encoded as not-asking
**Fateful object:** Rod outside not inside — positioned for a visitor before they arrived; the Fisherman expected someone to need it
**Monster scale:** None — sanctuary node; absence of threat is the description; this place has been kept clear
**Word count:** ~155

---

### NODE: YL — Yugurt Lake

**Named location:** The Noon Point — Shore Mark, Yugurt

**Current text:**
> Mirror-flat water. No wind. No birds. A hand-painted sign on a stick at the shore: YUGURT. The surface moves once, slowly, then stops. Something very large is in this lake and it knows you are here.

**Proposed replacement:**
> The hand-painted sign at the shore says YUGURT. Someone planted it in the bank on a stick, no base, no post — it leans at the angle of a thing that has been leaning a long time. No birds. No wind. The water is mirror-flat in the way that means the air above it is being held still by something below.
>
> The surface moves once. A slow displacement, not a wave — a weight shifting. Then it stops.
>
> There is a name for what produces that displacement. You will not find it in shallow water. The Horned Shark hunts this lake; the Leviathan calls it home. Anglers who know the difference between a bite and a notice do not fish past the Noon Point marker.
>
> You are past it.
>
> The lake has already registered you. What it does with that information is the only question still open. The sign leans. The water holds. Whatever is under the mirror is not in a hurry.

**Props:** Hand-painted YUGURT sign leaning on a stick — no base, no permanence · Noon Point marker as the line between fishing and warning · Single slow surface displacement — weight, not current
**Threshold test:** Passing the Noon Point — the marker is the gate; the lake tests whether you read signs
**Host-guest:** Hostile inversion — the lake is host, but its hospitality is predatory; the displacement is the host acknowledging the guest
**Fateful object:** The leaning sign — planted with no base, held only by what surrounds it; permanence without foundation
**Interior made exterior:** The lake's awareness rendered as displacement, not as menace; what the water does encodes what is beneath it
**Time as moral frame:** "Not in a hurry" — the lake has all the time; the clock belongs to whatever is under the surface, not to you
**Monster scale:** Horned Shark (Noon Point line — hunting tier, actively territorial) → Leviathan (deep water — apex, the source of the single displacement; it does not chase, it notices)
**Word count:** ~160

---

### NODE: DF — The Unbanked Quarter

**Named location:** The Zero Block — First Approach, Unbanked Quarter

**Current text:**
> A district that exists on no city register. No tax collector has ever returned from this block. Hand-lettered signs in cracked windows read NO COIN · NO TRUST · NO THANKS. A shortwave signal repeats on every frequency. Nobody is answering. The rats here are wrong.

**Proposed replacement:**
> The sign in the cracked window reads NO COIN · NO TRUST · NO THANKS, in that order, which is also the order in which you will need to accept them. The Unbanked Quarter appears on no city register. Tax collectors who came back from this block had nothing to report except that they were not going back. The ones who went back have not come back.
>
> A shortwave signal repeats on every frequency. Same pattern, same interval, same broadcast quality — which is poor. Nobody is answering. The signal has been going out long enough that nobody answering is not a condition; it is the standing state of the broadcast.
>
> Grimshaw runs the transmitter. His receiver has been broken for eleven years. He is aware of this. He does not consider it relevant to the transmission.
>
> The rats here are wrong. Not wrong in the way of sick rats or starving rats — wrong in the way of rats that have adapted to something that should not be adapted to. They do not scatter. They watch the frequency bands.

**Props:** Hand-lettered window sign with its own interior logic (NO COIN first) · Shortwave repeater — same interval, nobody answering · Grimshaw's broken receiver — broadcast without return is not a malfunction, it is the protocol · Watching rats
**Threshold test:** The sign's order of terms — entering the Zero Block means accepting all three in sequence; it tests whether you can operate without the city's guarantees
**Host-guest:** Grimshaw as host-broadcaster — transmission as hospitality; the broken receiver means he cannot hear guests but continues broadcasting anyway; the district extends welcome it cannot receive
**Fateful object:** The shortwave repeater — signal going out on every frequency without answer is not a failure state, it is the correct output of this place
**Interior made exterior:** The rats' wrongness described as behavioral (they watch frequency bands, they don't scatter), not as feeling
**Time as moral frame:** "Long enough that nobody answering is the standing state" — the broadcast clock has no urgency because urgency has already been normalized out; the deadline passed and the transmission continued
**Monster scale:** NGMI Swarm ×3 (the watching rats — vermin tier, adapted to the void-adjacent environment; wrong in proportion to how long the signal has been running) → Rug Spider (large, static, hidden in the building infrastructure; listens the way the rats do but does not move)
**Word count:** ~155

---

### NODE: HM — Frequency Row

**Named location:** The Forty-First Volume — Listening Row, Unbanked Quarter

**Current text:**
> Storage units converted into listening posts, each bristling with improvised antenna arrays. Cable runs between them in defiance of physics and permits. A woman sits outside updating a frequency log in a composition notebook. She is on volume forty-one.

**Proposed replacement:**
> The storage units have been converted into listening posts — each one bristles with antenna arrays, improvised, dense, aimed at frequencies the city does not acknowledge. Cable runs between them in configurations that violate physics and every permit classification on record. Nobody has corrected this. The cables stay.
>
> Bertha No-Bank sits outside on a metal folding chair with a composition notebook. She is on volume forty-one. Volume forty-two begins tomorrow; she has already labeled the cover.
>
> The frequency she monitors is 14.225. She has checked it every morning since the third moon of the fourth year. Nothing was on it then. Nothing is on it now. She logs this. Every morning: a new entry confirming the absence. Forty-one volumes of confirmed absence, organized by date, cross-referenced by atmospheric condition.
>
> You are now in the log. Frequency Row notes everything that passes through it. This is the hospitality it offers — not shelter, not coin. Documentation.

**Props:** Cable configurations violating physics — stayed up without correction · Volume forty-one (cover of forty-two pre-labeled — tomorrow is already prepared) · Frequency 14.225 — logged absence, not presence
**Threshold test:** Entering Frequency Row registers you; the threshold is Bertha's pen; the question is whether you are the kind of thing that gets logged or the kind that gets a category note
**Host-guest:** Bertha as host-documentarian — hospitality is the log entry; she cannot offer what she doesn't have, so she offers what she does: record of your presence
**Fateful object:** Volume forty-one — forty-one notebooks of nothing found is not failure, it is the archive; the pre-labeled volume forty-two encodes that the work continues regardless of finding
**Interior made exterior:** Bertha's discipline (conviction that the frequency must be monitored even if empty) rendered as the physical act of pre-labeling tomorrow's notebook before it begins
**Time as moral frame:** "Volume forty-two begins tomorrow" — tomorrow is real and scheduled; the deadline is the notebook's cover, already written; the log's continuation is a standing legal commitment to absence
**Monster scale:** None — civilian audit node; Bertha's continuous monitoring is the reason Frequency Row stays clear; the listening posts function as a deterrent by documentation
**Word count:** ~155

---

### NODE: GL — Old Guard's Corner

**Named location:** The Convergence Chair — Three-Alley Crossing, Unbanked Quarter

**Current text:**
> Three alleys converge at an improbable angle. A wooden folding chair. A man in it. A laminated sign that says GET OFF. Off of what is not specified. He has outlasted four city administrations, two plagues, and one Void surge without moving.

**Proposed replacement:**
> Three alleys meet at an improbable angle — the geometry is wrong for this block, wrong for this district, possibly wrong for this city. The intersection produced itself without civic input. No permit issued it. It is here regardless.
>
> The wooden folding chair is in the center of it. Zeke 'The Signal' has occupied that chair through four city administrations, two plagues, and one Void surge. He has not moved. This is not stubbornness — it is evidence. Administrations change. Plagues end. Void surges recede. The chair remains. Zeke has become the fixed reference point by which the impermanence of everything around him is measured.
>
> The sign on his lap says GET OFF. Off of what is not specified. This is intentional. You are probably on it.
>
> He does not speak. He holds up a laminated card. The card says: SYSTEM COMPROMISED. He has a weatherproof box beside the chair containing four hundred identical cards. He has never offered a different one. He has never needed to. He offers you one. It is simply the current reading.

**Props:** The improbable-angle intersection — self-produced geometry, no permit · Wooden folding chair as fixed reference point against everything impermanent · Laminated GET OFF sign (object unspecified) · Weatherproof box of 400 identical SYSTEM COMPROMISED cards
**Threshold test:** The GET OFF sign with no object — entering the crossing means you are probably what the sign refers to; the threshold test is whether you can stand in a space that has already named you as the problem
**Host-guest:** Zeke as the oldest possible host — he predates every current tenant in the surrounding buildings; his hospitality is the card; it is offered without expectation of response or departure
**Fateful object:** The weatherproof box — 400 identical cards prepared in advance; the box is not a supply, it is a commitment to the reading being permanent and repeatable
**Interior made exterior:** Zeke's conviction that the system is compromised rendered as never producing a different card; four hundred identical copies is not obsession, it is calibration
**Time as moral frame:** Outlasting four administrations and two plagues is not patience — it is legal precedent; the chair is not squatting, it is prior claim; Zeke's continued presence is the most accurate clock in the district
**Monster scale:** None — Zeke's presence is the reason the crossing stays navigable; the fixed reference point suppresses chaos by being unchanged; the corner tests players, it does not fight them
**Word count:** ~165

---

### NODE: CQ — The Cat Quarter

**Named location:** The Crate Seat — Jimmy's Corner, Cat Quarter

**Current text:**
> Narrow brick lanes, broken glass, discarded fish bones. Every surface is scratched. Not vandalism — territorial markings, dense as wallpaper. A large orange tabby sits on an overturned crate wearing what appears to be a very small fedora. He sees you and doesn't move.

**Proposed replacement:**
> Narrow brick lanes, broken glass, fish bones in the cracks. Every surface is scratched — not vandalism but territorial markings, laid so densely they read like wallpaper. Someone has been making claims in this district surface by surface for a long time. The claims are current.
>
> At the corner: an overturned crate. On the crate: a large orange tabby in a very small fedora. The fedora fits correctly. This is not the result of chance.
>
> Jimmy Two-Tails registers you from the moment you enter the lane. He does not move. He does not adjust his position. He watches with the professional stillness of someone who has already reached a verdict and is waiting to see if you confirm it.
>
> The scratches on the walls are the guest register. They record every claim made in this quarter and kept. Yours is not yet on the wall.
>
> The Beefy Toms are his. They are not visible from here. They are present.

**Props:** Dense territorial scratch markings as wallpaper — active and current, not historical · The correctly-fitted tiny fedora — implies a supply chain, a prior relationship, hands better than a cat's · Jimmy's professional stillness as verdict already rendered
**Threshold test:** The scratch markings read you as you enter; the threshold is Jimmy's verdict — his not-moving is the verdict being delivered; what he decides determines the quarter's hospitality
**Host-guest:** Jimmy as district lord-host; the scratches are the guest register; your entry is a claim request; he determines whether you are a guest or an intrusion
**Fateful object:** The tiny fedora — it fits correctly; correct fit implies intention, not accident; the fedora compresses an entire relationship history between Jimmy and whoever had the foresight to commission it
**Interior made exterior:** Jimmy's assessment rendered entirely as stillness; the verdict is not announced, it is enacted by the absence of movement; what he has decided is visible only in what he doesn't do
**Time as moral frame:** "Yours is not yet on the wall" — the scratches are a living legal record; the deadline for making a claim is ongoing; every visit is an opportunity to be registered or refused
**Monster scale:** Beefy Toms ×3 (not visible but present — mid-tier enforcement; the territory's muscle operates off-screen until the verdict requires action) → Jimmy himself is the apex of this node; the fedora is the marker of his rank, not his size
**Word count:** ~155

---

### NODE: JU — Dense Jungle

**Named location:** The Covered Road — Mael's Clearing, Dense Jungle

**Current text:**
> The Scholar Kings' road is overgrown but present. Arachas webs block every third stretch. Herbalist Mael lives here — perfectly sane, perfectly dangerous.

**Proposed replacement:**
> The Scholar Kings' road is still here. It runs beneath the overgrowth in straight, deliberate intervals — you can feel the paved stone where the jungle floor gives differently. Three hundred years of root and vine have not moved the road. They have covered it. This is not the same thing.
>
> Arachas webs block every third stretch. The webs are architectural — anchored across the full road width at regular intervals, as if the spiders have been reading the same survey markers the Scholar Kings used. You go through or you go back.
>
> Herbalist Mael lives in the clearing at the road's center. She is perfectly sane. She is perfectly dangerous. These are not contradictions — they are the same characteristic expressed at different scales.
>
> Her compound stops muscle function in organisms above forty kilos. It wears off in five minutes. She recommends using the five minutes productively. She is not being ironic.
>
> The Ancient Road Marker at the clearing's edge still reads. Not all of it. Enough.

**Props:** Scholar Kings' road under the jungle floor — paved stone felt through differential give · Arachas webs at regular intervals, anchored architecturally · Ancient Road Marker — partial, sufficient · The five-minute window
**Threshold test:** Recognizing the road under the overgrowth — the gate is reading what's beneath; covered is not erased; entering tests whether you can navigate a path that doesn't announce itself
**Host-guest:** Mael as jungle host — compound offered as practical hospitality; the five minutes is the gift; the guest determines what happens inside it; she is not withholding anything
**Fateful object:** Ancient Road Marker — still legible, partially; what it still says is enough to know where the road was going; partial information is the jungle's version of full disclosure
**Interior made exterior:** Mael's dual nature (sane + dangerous) described as a single characteristic at two scales, not as a feeling or warning; the compound is the proof, not the description
**Time as moral frame:** Five minutes — the neurotoxin's duration is the only clock this node runs on; every productive act happens in that window or not at all; the deadline is chemical, not social
**Monster scale:** Arachas ×2 (road-crossing webs — architectural territorial claim; mid-tier, blocking the path at surveyed intervals) → Endrega ×3 (deeper in the canopy — the fauna the Scholar Kings' road was built to avoid; why the road needed walls that are now gone)
**Word count:** ~160

---

### NODE: OU — The Observatory Outhouse

**Named location:** The Hook — Observatory Annex, Rear Approach

**Current text:**
> Behind the observatory. A smell. A door. A portal. Turn the hook left. Sweelinck was not joking.

**Proposed replacement:**
> The observatory is a building of some academic consequence. The outhouse behind it is not.
>
> The smell reaches the path about ten meters out. The door is wood, painted once, not recently. The latch is a simple hook — the kind on a thousand doors in Weimar. Turn it right: outhouse, fully functional, no further comment. Turn it left: the Greek Agora, three thousand years and several thousand kilometers from your current position.
>
> Sweelinck told you about this. He used the same tone he uses for everything else. You may have been skeptical. That is a reasonable response to the information as delivered.
>
> The Portal Key goes in your hand or it doesn't. The hook is on the door regardless. The decision is yours.
>
> The smell is not.
>
> Sweelinck was not joking.

**Props:** Standard hook latch — same hardware as a thousand Weimar doors · The right/left binary — one ordinary, one extraordinary, same motion · The smell as the ordinary anchor of the extraordinary node
**Threshold test:** The hook is the gate in the most literal sense; turning it left requires believing Sweelinck; the threshold tests whether you act on information that sounds implausible
**Host-guest:** Sweelinck as absent host — he left the portal, the instructions, and the key; hospitality at its most pragmatic; he did not stay to explain it twice
**Fateful object:** The hook latch — the smallest hardware item in the game; left or right; the fate of the Greek Agora visit encoded in a single turn
**Interior made exterior:** The extraordinary (dimensional portal) fully embedded in the ordinary (outhouse smell, wood door, standard hook); the portal is not announced by the architecture
**Time as moral frame:** "Sweelinck was not joking" — the statement implies prior skepticism; the deadline for believing him was before you arrived; you are already past the point of deciding whether to trust him
**Monster scale:** None — transit node; the threshold is the latch, not combat; what is tested here is conviction, not capability
**Word count:** ~130

---

### NODE: GA — Greek Agora

**Named location:** The Speaking Chamber — Central Colonnade, Greek Agora

**Current text:**
> Columns. Heat. The sound of something vast breathing beneath the stones. Kassiphane sits cross-legged in the speaking chamber. Solid gold eyes.

**Proposed replacement:**
> The columns are older than the civilization that built them. Heat radiates from the stone in a direction heat should not travel — upward from below, as if the ground is warm from something beneath it. Under the paving stones, something vast is breathing. It has a rhythm. It is not in distress.
>
> Kassiphane sits cross-legged in the speaking chamber at the colonnade's center. Her eyes are solid gold — not golden, not amber, gold — which means she sees at a frequency you do not. She is not looking at you the way you look at things. She is reading a different register of the same information.
>
> Seven questions. Seven seals. She will tell you what you already know, in the order you have always needed to hear it. The Codex Shard was here before she was. It has always been yours.
>
> The Bronze Automatons at the gate have been here longer than the oracle. The Sphinx at the chamber threshold asks first.

**Props:** Columns older than the civilization that raised them · Heat traveling upward from below — thermal anomaly, not atmosphere · Solid gold eyes (not golden — gold) · Codex Shard predating the oracle
**Threshold test:** The speaking chamber is the second gate — the first was the outhouse hook; Kassiphane's seven questions are the inner threshold; the test is whether you can answer what you already know
**Host-guest:** Kassiphane as oracle-host — she holds the Shard but does not own it; her hospitality is accurate information about what was always yours; the host who returns, not grants
**Fateful object:** The Codex Shard — present before Kassiphane arrived; the oracle is the guardian of something that predates her; the Shard has always been the player's; the Agora is simply where it waited
**Interior made exterior:** Kassiphane's oracular perception rendered as solid gold eyes and a different frequency of vision — not metaphor but physical fact; the vast thing below rendered as a thermal direction and a rhythm
**Time as moral frame:** "You already know the answers" — the education is already complete; the deadline for learning was before this visit; Kassiphane's role is to confirm, not to teach; the questions are the ceremony of retrieval
**Monster scale:** Bronze Automaton ×2 (colonnade gate — constructed guardians, older than the oracle; mid-tier, structural; they test passage before Kassiphane speaks) → Sphinx (speaking chamber threshold — asks the question before the player can ask theirs; the gate that speaks)
**Word count:** ~155

---

### NODE: KT — Camelot — Arthurian Road

**Named location:** The Split Road — Castle Gate Approach, Arthurian Road

**Current text:**
> A legendary place made real — or a real place made legendary. The road splits here. A death knight challenges all travellers at the castle gate.

**Proposed replacement:**
> A legendary place made real — or a real place made legendary. The distinction matters less than the road, which splits at the approach and does not indicate which branch leads where. Both arrive at the castle gate. The gate does not distinguish between them.
>
> The road is paved in the Arthurian manner: flat stone, fitted without mortar, maintained by a tradition older than the current throne. The castle rises behind the gate in proportions that are correct but slightly more correct than ordinary architecture allows. Something about the towers is too deliberate.
>
> The Death Knight at the gate challenges every traveller. Not some — every. He has held this post through four dynasties and the interval between them. The challenge is the same each time. It has always been the same challenge.
>
> The Black Knight holds the approach road. You face him before the gate. The Knight's Favour is awarded after, not before. This is the Arthurian contract: the token is earned by accepting what it costs.

**Props:** Split road with no signs — both branches arrive at the same gate · Flat stone paving fitted without mortar — older than the throne · Towers proportioned too deliberately · Knight's Favour as earned token, not found loot
**Threshold test:** The road splits and neither branch is marked; the gate is the real threshold; the Death Knight's challenge is not selective — every traveller answers it; the test is unconditional
**Host-guest:** The Death Knight as anti-host — his hospitality is the challenge; Camelot does not receive guests, it receives travellers who have proven they can enter; the castle gate is the only form of welcome on offer
**Fateful object:** The Knight's Favour — in Arthurian romance, a token given before or after combat as proof of standing; awarded after, not before; it compresses the entire chivalric economy into one loot item
**Interior made exterior:** The legendary/real ambiguity rendered as architecture that is "slightly more correct than ordinary" — the towers are too deliberate; the castle is what a castle would be if a castle were trying to be itself
**Time as moral frame:** The Death Knight has held the gate through four dynasties and the interval between them — the challenge predates every kingdom it served; the contract is older than the institution; it will outlast the current one too
**Monster scale:** Black Knight (approach road — mid-tier, the first challenge; tests combat readiness before the gate) → Death Knight (castle gate — the standing challenge; four dynasties, same terms; the gate that does not negotiate)
**Word count:** ~155

---

### NODE: OP — Oriental Dragon Palace

**Named location:** The Cloud Gate — Jade Threshold, Dragon Palace

**Current text:**
> The edge of the known world. A palace built on cloud-stone. The Jade Construct at the gate has never lost a fight. The Olympian Key asks it seven questions at once.

**Proposed replacement:**
> The palace is built on cloud-stone — material that has no business bearing weight, bearing it regardless. At the edge of the known world, the cartographers stopped drawing. The palace occupies the margin they left blank.
>
> The approach is without sound. No wind at this altitude. No birds. The cloud-stone does not echo footsteps. You arrive having made no noise the palace did not already know about.
>
> The gate is jade. The Jade Construct at the gate has never lost a fight. This is not a boast — it is a property of the structure, stated the way a bridge's load capacity is a property of the bridge. The Construct does not move toward you. It holds a record. The record is complete.
>
> The Olympian Key does not fight it. The Key carries Kassiphane's seven questions — all seven, presented at once. The Construct recognizes the sequence. The gate opens for ceremony what it has never opened for force.
>
> The Codex Shard is the sixth and last. It has been waiting.

**Props:** Cloud-stone — load-bearing material that should not bear loads · Cartographic margin — the palace in the blank space past the edge of the map · Soundless approach — no echo, no wind · Jade Construct's undefeated record as a structural specification
**Threshold test:** The gate that has never been forced; the Olympian Key is the only mechanism that works; the threshold tests not strength but whether you completed the ceremony at GA first
**Host-guest:** The palace as the final host — it does not receive guests through force; ceremony is the only admissible approach; the Construct's record guarantees that the wrong kind of arrival does not succeed
**Fateful object:** The Olympian Key — carries the seven questions from Kassiphane; presented all at once; the Key is the ceremony compressed into an object; without it the Jade Construct's record remains unbroken
**Interior made exterior:** The Construct's invincibility stated as a structural property, not a power level; the approach's silence described as the palace already knowing you arrived — sound rendered as information the building receives, not produces
**Time as moral frame:** "It has been waiting" — the sixth Codex Shard is the final piece; the palace has been holding it since before the player arrived; the wait is the Shard's temporal frame, not an obstacle
**Monster scale:** Jade Construct (gate — apex of this node; has never lost; the record predates the player's journey; the only way past is the Key, not combat; if the Key is absent, the Construct's record extends)
**Word count:** ~155

---

### NODE: HC — Sky Road — Heavenly Clouds

**Named location:** The High Road — Above the World, Scholar Kings' Sky Road

**Current text:**
> There is a road above the world. The Scholar Kings built it. Bruhns's signal fire is visible from here. The Void is bleeding through — Fallen Seraph on the road.

**Proposed replacement:**
> There is a road above the world. The Scholar Kings built it in a period when they believed the world needed roads above it as much as through it. They were correct. The road is still here. The Scholar Kings are not.
>
> The surface is white stone, cut to a width that accommodates two carts abreast. It curves slightly with the curvature of the sky. The edge has no railing. The Scholar Kings did not build for vertigo.
>
> Bruhns's signal fire is visible from here — a point of orange below and to the west, deliberate, maintained. Someone is still sending a message upward. The message has not been answered yet.
>
> The Void is bleeding through the road's eastern section. The Star Spawn hold that stretch. The Fallen Seraph at the road's center is what the Void produces when it has enough time and something sufficiently holy to work with.
>
> The road continues north. The sky ahead is the same color as the Void it contains.

**Props:** White stone road cut for two carts — practical, enormous scale · No railing on the edge · Bruhns's signal fire below and west — orange point, maintained, unanswered · Void bleeding through the eastern section
**Threshold test:** No railing — the Scholar Kings built for passage, not for the fear of falling; entering the Sky Road means accepting that the edge is real and unguarded; it tests whether you can walk a road that does not accommodate hesitation
**Host-guest:** The Scholar Kings as long-dead hosts — the road is their hospitality, left in stone; the Fallen Seraph is the corruption of that hospitality; the road was built to be walked, not held
**Fateful object:** Bruhns's signal fire — visible from the highest road; someone below is still signaling upward; the fire is maintained which means the message is ongoing; it has not been answered, which means the answer is still possible
**Interior made exterior:** The Void's bleeding described as a color match between the sky ahead and the corruption it contains — the Void does not arrive, it assimilates; the Fallen Seraph described as a process result (time + holiness + Void) rather than a creature
**Time as moral frame:** "The message has not been answered yet" — Bruhns's fire is the standing clock; the signal began at some point; the answer is still open; the Sky Road is the place from which the answer would come
**Monster scale:** Star Spawn ×2 (eastern road section — Void-adjacent, dispersed; they hold the stretch, not the node) → Fallen Seraph (road center — apex corruption; what the Void makes of something holy given sufficient time; the hardest single encounter on the road above the world)
**Word count:** ~160

---

### NODE: AR — Arctic Wastes — Detour

**Named location:** The White Pass — Below the Cloud Road, Arctic Detour

**Current text:**
> The arctic pass below the cloud road. Cold. White. Efficient. Triggered only if the sky road battle is lost. Both paths arrive at the Birka approach.

**Proposed replacement:**
> The arctic pass runs below the cloud road. You cannot see the sky road from here — it is above the weather, and you are in it. Snow fills the horizontal distances. The cold arrives before the wind that carries it.
>
> Cold. White. Efficient. The pass is all three without apology. It does not ask whether you intended to be here. You are here. The pass provides: a path north, a wind that stays behind you, ground frozen hard enough to walk on. That is the full inventory of what it offers.
>
> The Wendigo moves with the weather. The Ice Giant does not move — it has been in the deep section of the pass since before the cloud road was built. The Scholar Kings surveyed this route. They built upward instead.
>
> Both paths arrive at the Birka approach. The sky road and the white pass end at the same place. The loss on the high road is not a loss — it is a different itinerary. The pass knows this. It does not slow down.

**Props:** Weather obscuring the sky road above · Snow in the horizontal distances · The Ice Giant as the reason the Scholar Kings built upward · "Full inventory" of what the pass offers — path, wind, frozen ground
**Threshold test:** The pass tests the player who lost — whether failure ends the journey or redirects it; the threshold is the first step into the white, taken after a defeat on the road above
**Host-guest:** The Arctic as the most austere possible host — it provides exactly what it provides, no surplus, no warmth, no commentary; its hospitality is the path and the frozen ground underfoot
**Fateful object:** The convergent destination — both paths arrive at Birka; the Chrétien fateful object here is not a prop but a fact of geography; the detour's mercy is encoded in the map
**Interior made exterior:** The loss on the sky road rendered as "a different itinerary" — defeat becomes rerouting; the pass's efficiency is the emotional reframe, stated as a property of the landscape
**Time as moral frame:** "The pass does not slow down" — the detour takes no longer than the high road; the deadline is identical; the Arctic offers no additional punishment for arriving via loss
**Monster scale:** Wendigo (pass surface — cold-adapted, moves with weather; mid-tier; the Arctic's ambient threat) → Ice Giant (deep section — has not moved since before the cloud road existed; the Scholar Kings' survey found it and built upward; the reason the sky road exists)
**Word count:** ~155

---

### NODE: EF — Thornwood Maw

**Named location:** The Black Approach — Root Zone, Thornwood Maw

**Current text:**
> Black bark ahead. The trees grow wrong — no birds, no wind, no sound except deep creaking from below the roots.

**Proposed replacement:**
> The trees ahead are black-barked. Not diseased — wrong. They grow wrong in the specific way that means something underneath them has been growing longer. No birds. No wind. No sound except a deep creaking from below the roots, rhythmic and patient, the kind of sound a thing makes when it has been making it for a very long time.
>
> The Thornwood Maw opens past the normal forest line at the point where the light changes color. Not darker — a different color. The bark is not dead wood. It is occupied wood. Every trunk here conducts something upward from the root system.
>
> The Thornwood King is what happens when a forest decides it has had enough of being a forest. He has been here since before the name Thornwood. The name came after.
>
> The creaking is closer than it was a moment ago.

**Props:** Black bark as occupied, not dead — conducting something upward · Light that changes color at the Maw's threshold · Deep rhythmic root-creaking — patient, ancient · "The name came after"
**Threshold test:** The changing light marks the gate — past the normal forest line is the Maw's interior; the threshold is the color shift; entering means the usual forest rules no longer apply
**Host-guest:** The Thornwood King as the deepest anti-host — the Maw is his domain; its hospitality is silence above and sound below; the forest performs his preferences, not yours
**Fateful object:** The creaking from below the roots — it locates the King before he is visible; the sound is closer than it was; the object is the distance closing
**Interior made exterior:** The King's presence rendered entirely as what the forest does — occupied bark, wrong growth, absent birds, rhythmic sound from below; he is not described, only his effects
**Time as moral frame:** "The name came after" — the Thornwood King predates his own name; his tenure is older than the human act of naming him; the wrongness of the trees is a permanent condition, not a recent event
**Monster scale:** Thornwood King (apex — has been here since before the name; the root-creaking is his; the occupied bark is his; the forest is him)
**Word count:** ~145

---

### NODE: EH — Loch of the Drowned King

**Named location:** The Clear Margin — Shore Mark, Loch of the Drowned King

**Current text:**
> The loch is cold and too clear. Figures move below the surface, walking in slow loops.

**Proposed replacement:**
> The loch is cold and too clear — clear in the way that means it has been maintained at that clarity for a reason. Standing water clouds. This one does not. The bottom is visible at fifteen meters, and the bottom is occupied.
>
> Figures move below the surface in slow loops. Not swimming — walking. Their feet are on the loch floor. Their arms are at their sides. They follow a circuit that takes approximately four minutes to complete. They have been completing it for some time.
>
> The Highland Aboleth does not swim so much as preside. The figures are its record — everything that has come to this loch and stayed. The loops are not imprisonment. They are memory, organized.
>
> The loch is cold. The figures do not appear cold. They appear occupied.

**Props:** Maintained clarity — not natural; the loch does not cloud · Bottom visible at fifteen meters, occupied · Four-minute walking circuit — approximate, measurable, ongoing · "Memory, organized"
**Threshold test:** The shore is the gate — the loch can see you from the moment you arrive; the too-clear water inverts normal visibility; entering means being seen before you can see what sees you
**Host-guest:** The Highland Aboleth as the coldest host — the figures are its prior guests, still moving; their loops are the hospitality it offers new arrivals: a preview of the arrangement
**Fateful object:** The walking circuit — four minutes, regular, measurable; whoever measured it was close enough and long enough to time it; the circuit is the Aboleth's signature, left visible
**Interior made exterior:** The Aboleth's control rendered entirely as the regularity of the loops; "slow loops" is organized, not random; the figures' arms at their sides is the detail that encodes everything about what holds them
**Time as moral frame:** The maintained clarity is an old condition — standing water clouds naturally; something has been preventing that for long enough to become the loch's defining characteristic; the Aboleth's tenure is measured in the clarity of the water
**Monster scale:** Highland Aboleth (apex — presides; the figures are its record; it has been here since the loch was clear; the Drowned King is not the boss — the Aboleth is what drowned him)
**Word count:** ~140

---

### NODE: ES — Sunken Altar

**Named location:** The Drowned Causeway — Past the Swamp Edge, Sunken Altar

**Current text:**
> The causeway continues past the swamp edge into black water. The altar stones are visible below the surface.

**Proposed replacement:**
> The causeway was built to go somewhere. It continues past the swamp's navigable edge into black water without apology — flat stones, deliberate spacing, the work of people who knew where they were going. The point where it submerges is marked by nothing. The causeway simply continues below the waterline.
>
> The altar stones are visible below the surface. They are arranged. Someone set them in that configuration and they have held it, in black water, for long enough that the arrangement is now the altar's permanent state. The stones are not ruins. They are intact. Submerged is not the same as destroyed.
>
> The Elder Hydra holds this space. It has not disrupted the altar arrangement — not from reverence, but because the arrangement was for it. The causeway was built toward it. The altar was built for it. The swamp remembered, even after the water rose.

**Props:** Causeway that continues below the waterline without marking the transition · Altar stones arranged and intact below the surface — submerged, not ruined · "The swamp remembered"
**Threshold test:** The submerging causeway — the threshold is the waterline; the gate is whether you follow the path past the point it goes under; the causeway does not hesitate and neither can you
**Host-guest:** The Elder Hydra as the altar's intended recipient — the causeway was built toward it; the altar was built for it; the hospitality predates the Hydra's current tenure by whoever built the path
**Fateful object:** The altar stones — intact, arranged, permanently submerged; whoever built them built them to last in water; the altar was always meant to be this way; submerged is its correct state
**Interior made exterior:** The Hydra's claim rendered as the fact that it has not disrupted the altar — not reverence but ownership; the arrangement was always its; this is the exterior proof of the interior relationship
**Time as moral frame:** "The swamp remembered, even after the water rose" — the altar's arrangement survived the flooding; memory encoded in stone; the causeway's destination predates the current water level
**Monster scale:** Elder Hydra (apex — holds the altar space; has not disrupted the arrangement because the arrangement was built for it; regenerating, ancient, the reason the causeway was built)
**Word count:** ~145

---

### NODE: EW — Hag Mother's Cradle

**Named location:** The Deep Still — Center of the Cradle, Hag Mother's Domain

**Current text:**
> The deepest part of the swamp. The air smells different — older. Something vast regards you from the water.

**Proposed replacement:**
> The deepest part of the swamp is not deeper in elevation — it is deeper in time. The air smells different: older, the way old wood smells, or old water, or the inside of something that has not been opened in a very long time. The Crones' Domain is behind you. This is what the Crones' Domain is the approach to.
>
> The Grand Hag Queen does not surface. She does not need to. The water is dark enough that you cannot see more than half a meter into it, and she is below that threshold, regarding you. Something vast regarding you from the water is not a metaphor for threat — it is a description of attention. She is paying attention. You are the object of it.
>
> The Cradle is named correctly. This is where the swamp came from. She was here before it.

**Props:** Air that smells older — old wood, old water, something unopened · The Crones' Domain named as approach, not destination · Dark water, half-meter visibility, and she is below it · "Named correctly"
**Threshold test:** The Crones' Domain was already the deep; this is what lies past the deep; the threshold is the point where the swamp's age changes; entering the Cradle means having passed every prior gate in the hag hierarchy
**Host-guest:** The Grand Hag Queen as the matriarch of all hag hospitality — HS was the outer court; this is the inner sanctum; the Cradle is the origin point; the Queen's hospitality is the attention itself, which is total
**Fateful object:** The age in the air — the smell of something long unopened; the Cradle has not been entered in a very long time; the air carries the record of that absence; your arrival ends it
**Interior made exterior:** The Queen's regard stated as attention, not threat — "a description of attention" refuses the menace reading and replaces it with the more unsettling fact of being fully seen
**Time as moral frame:** "She was here before it" — the swamp grew around her; the Cradle is older than the ecosystem it sits inside; the Queen's temporal claim is absolute and predates every other feature of this terrain
**Monster scale:** Grand Hag Queen (apex — does not surface; has been here since before the swamp; the Cradle is named for her function, not her location; she is the source of what the Crones serve)
**Word count:** ~145

---

### NODE: EB — Wreck of the Unbroken

**Named location:** The Beached Hull — Hold Approach, Wreck of the Unbroken

**Current text:**
> The wreck sits half-beached, half-submerged. Three hundred years of stillness. Something moves in the hold.

**Proposed replacement:**
> The Unbroken sits half-beached on the sand, half-submerged in the shallow break. Three hundred years ago it came to rest in this position and has not moved since. The hull is intact — the masts are gone, the rigging is gone, but the hull has not separated. The name holds, for a ship three centuries out of commission.
>
> The hold is accessible at low tide. Something moves in it. Not the tide — the tide has a pattern, and what moves in the hold follows a different pattern, slower and its own.
>
> The Vampire Pirate Lord has been in the hold for the full three hundred years. He did not leave with the crew. He outlasted the crew. He does not require the ship to go anywhere. He receives visitors.
>
> The sand around the hull is undisturbed. He does not come out.

**Props:** The intact hull — masts gone, hull holds; name still accurate for a ship three centuries beached · Low-tide hold access · Movement in the hold at a rhythm distinct from the tide's · "He does not come out"
**Threshold test:** The hold entrance at low tide — the gate is tidal; the threshold opens and closes on a schedule the Lord did not set; entering the hold means entering on the tide's permission, not his
**Host-guest:** The Vampire Pirate Lord as the most literal host — a ship receives passengers by definition; the hold is his receiving chamber; three hundred years of receiving visitors; he does not go to them
**Fateful object:** The ship's name — the Unbroken; the hull has held for three centuries in salt water; the name is accurate in both senses: the ship did not break, and the Lord inside it did not end
**Interior made exterior:** The Lord's presence rendered as movement at a rhythm the tide doesn't explain — not described, only the deviation from the expected pattern; he is the residual after the tide's motion is subtracted
**Time as moral frame:** "He outlasted the crew" — the crew left or died; the Lord remained; three hundred years in the hold is not waiting, it is residence; he has been receiving visitors for the entire interval
**Monster scale:** Vampire Pirate Lord (apex — in the hold; has not come out in three centuries; receives; the wreck is his domain by three hundred years of uncontested tenure)
**Word count:** ~150

---

### NODE: EO — Leviathan's Eye

**Named location:** The Eye Floor — Abyssal Base, Leviathan's Eye

**Current text:**
> The trench floor. No light should reach here. You can see it below — a shape too large to be one thing.

**Proposed replacement:**
> The trench floor. No light should reach this depth — the water column above absorbs the last of it long before here. You can see regardless. The source of the light is below you.
>
> The True Leviathan is not in the trench. The trench is in the True Leviathan. What you see below the floor — the shape too large to be one thing — is the part of it that held still long enough for sediment to settle on its back. The trench is the impression it left in staying.
>
> It does not move. It does not need to. You are at the bottom of the world's deepest water and you are still above it.
>
> The Eye is not the Leviathan's eye. It is the place where you can see the Leviathan's eye. There is a difference, and the difference is the distance between you.

**Props:** Light at depth with no surface source — the Leviathan's own luminescence · Sediment settled on the Leviathan's back — the trench as impression, not container · The distance between the node's name and the eye itself
**Threshold test:** The trench floor is not the bottom — the Leviathan is below it; the threshold is the realization that the floor you are standing on is the surface of something else; the gate is understanding the node's name
**Host-guest:** The True Leviathan as the deepest host — it does not rise; the trench is its impression; it receives visitors at a depth they can barely reach and it is still below them; the hospitality is the light that lets you see
**Fateful object:** The shape too large to be one thing — a shape this size can only be seen in part; the fateful object is the portion visible; the rest is the context of what you cannot see
**Interior made exterior:** The Leviathan's age and scale rendered as geological consequence — the trench is the impression it left; its stillness created the terrain; the creature is described through what the landscape did in response to it
**Time as moral frame:** "Held still long enough for sediment to settle on its back" — the duration is geological; the Leviathan has been here long enough to become a feature of the ocean floor; you are a visitor to something that predates the trench
**Monster scale:** True Leviathan (apex of apexes — is the trench; the sediment is on its back; it is below the floor you are standing on; "too large to be one thing" is the accurate description, not hyperbole)
**Word count:** ~150

---

### NODE: EI — Isle of the Wyrm Crown

**Named location:** The Blackened Shore — Rock Crown, Isle of the Wyrm

**Current text:**
> An island of black rock, no vegetation. The dragon has been here long enough that the stone has changed color.

**Proposed replacement:**
> Black rock, no vegetation, no soil. The island is what a dragon makes of an island given sufficient time and preference: everything that was not rock has been removed or burned away. The vegetation line stopped at the waterline, which is also the dragon's line.
>
> The stone has changed color. This requires time — not years, not decades. Centuries of sustained heat alter mineral composition; the color runs in bands from the summit down, deepest at the peak where the dragon rests, lighter at the tideline where its influence gives way to the sea's. The rock is a record. It documents duration.
>
> The Ancient Sea Dragon has been on this island long enough that the island has a geological memory of it. The Wyrm Crown is not a metaphor — the crown of the island is where it sits. The color of the stone tells you how long. The stone does not exaggerate.

**Props:** Vegetation line at the waterline — the dragon's boundary marked by absence · Color bands running from summit to tideline — deepest at the peak, geological record · "The stone does not exaggerate"
**Threshold test:** The waterline is the dragon's boundary; stepping onto the black rock is crossing into territory that has been single-occupancy for centuries; the island tests whether you can enter a space with no neutral ground
**Host-guest:** The Ancient Sea Dragon as the total host — it has removed everything it did not want; the island's hospitality is the absolute clarity of what remains; black rock, nothing else, the dragon's full preference expressed in landscape
**Fateful object:** The color-changed stone — the dragon's tenure written into the mineral composition of the rock; the color bands are a vertical timeline; the peak is the oldest record
**Interior made exterior:** The dragon's age and dominance described entirely through what it did to the stone — not described directly; the rock's color change is the dragon made visible in geological time
**Time as moral frame:** "The stone does not exaggerate" — rock color change is not impression or reputation; it is chemistry; the duration required is specific and long; the island's record is the most conservative possible estimate of the dragon's tenure
**Monster scale:** Ancient Sea Dragon (apex — has been on the summit long enough to alter the stone's mineral composition; the island is its record; it does not need to attack; it simply has been here longer than anything else in the region)
**Word count:** ~155

---

### NODE: EA — Abyssal Scriptorium

**Named location:** The Lower Scriptorium — Below Atlantis, Scholar Kings' Archive

**Current text:**
> Below Atlantis. Scholar King inscriptions cover every surface. Something has been adding to them.

**Proposed replacement:**
> Below Atlantis is the chamber the Scholar Kings sealed last. Every surface carries inscription — walls, floor, ceiling, the pillar faces. Not decorative: functional notation, the Scholar Kings' archival system, dense and cross-referenced. The chamber is a compressed library. The library is complete.
>
> Except for the new entries.
>
> Something has been adding to the inscriptions using the Scholar Kings' own notation system, in the correct conventions, in the margins of the original text. The additions are syntactically correct. They are not Scholar King work. The Scholar Kings have been dead for centuries. The additions are recent.
>
> The Index Aboleth did not destroy what it found here. It read it. It understood the notation. It has been continuing the work with the rigor of something that has had centuries alone with the primary sources.
>
> The most recent entry is on the wall nearest the descending passage. It is about you.

**Props:** Every surface inscribed — walls, floor, ceiling, pillar faces · New entries in correct notation, in the margins · The most recent entry on the wall nearest the entrance · "The library is complete. Except for the new entries."
**Threshold test:** Descending below Atlantis into the sealed chamber — the threshold is the passage the Scholar Kings sealed; entering means the seal has been broken from inside; the Aboleth opened it for you
**Host-guest:** The Index Aboleth as unauthorized archivist-host — it did not destroy the archive; it continued it; the hospitality is the maintained and extended library; the most recent entry is about the current visitor
**Fateful object:** The most recent inscription — on the wall nearest the descending passage; written before your arrival, which means the Aboleth knew you were coming; the entry about you predates your descent
**Interior made exterior:** The Aboleth's intelligence rendered as the quality of its additions — syntactically correct, correct notation, correct conventions; its nature described through its scholarly competence, not its predatory nature
**Time as moral frame:** The Scholar Kings sealed this chamber centuries ago; the Aboleth has been adding to the record in the interval; the unauthorized continuation is now the majority of new material; the archive's authorship has changed hands without acknowledgment
**Monster scale:** Index Aboleth (apex — has been alone with the primary sources for centuries; syntactically correct additions to a dead scholarly tradition; has already written the entry about you; the most dangerous librarian in the known world)
**Word count:** ~155

---

### NODE: EC — Scholar Kings' Forge

**Named location:** The Sealed Door — West Chamber Approach, Scholar Kings' Forge

**Current text:**
> A sealed chamber west of the sea cave. The door has not been opened in four centuries. Something breathes on the other side.

**Proposed replacement:**
> West of the sea cave, the passage narrows and ends at a door. The door is sealed — not locked, sealed; the Scholar Kings' method of closing something they intended to remain closed. The compound has held for four centuries. The door has not been opened.
>
> Something breathes on the other side. Audibly, with rhythm, at regular intervals. The Forge Warden was set to guard the forge and it has been guarding it, in the sealed dark, for four hundred years without instruction or relief. It does not require either. It is doing what it was built to do.
>
> The forge is still operational. The Scholar Kings built their machines to last. The Warden has kept it lit for four centuries because that was the instruction and the instruction has not been rescinded.
>
> The door is the question. What you do with it is the answer. The Warden has been waiting four centuries for someone to provide one.

**Props:** Sealed door — not locked; sealed compound held four centuries · Audible breathing at regular intervals through sealed stone · Forge still lit behind the door · "The instruction has not been rescinded"
**Threshold test:** The sealed door is the most literal threshold in the game — it tests whether you open what four centuries of prior visitors did not; the question is whether you are the person the sealing was meant to stop or the one it was meant to wait for
**Host-guest:** The Forge Warden as the most patient guardian-host — four centuries in the sealed dark, maintaining the forge, waiting; the hospitality is the lit forge; the Warden has been keeping it ready for the visit that finally comes
**Fateful object:** The sealed door — compressed record of four centuries of people who did not open it; the sealing compound is the physical evidence of the Scholar Kings' intention; what holds it now is inertia and the Warden's continued operation
**Interior made exterior:** The Warden's continued existence rendered as audible breathing through sealed stone — the only evidence of what's inside is the sound; everything else is inference from what the Scholar Kings left
**Time as moral frame:** "The instruction has not been rescinded" — the Warden operates on a four-century standing order with no expiry; the Scholar Kings who issued it are gone; the order remains in force because no one has cancelled it; this is the Chrétien legal-moral frame at its most precise
**Monster scale:** Forge Warden (apex — four centuries of uninterrupted post; the forge is still lit; constructed to last and has lasted; the breathing through the door is the proof; it has been waiting for this visit the entire time)
**Word count:** ~155

---

### NODE: EL — Sunken God's Throne

**Named location:** The Throne Chamber — Flooded East, Sunken God's Seat

**Current text:**
> A flooded chamber east of the lake. A throne carved from a single boulder, larger than it should be.

**Proposed replacement:**
> East of the lake, the chamber floods from the bottom — water entering through cracks in the eastern wall rather than from any visible source. The temperature is the same as the lake above. It is not the same water. It moves differently.
>
> The throne is carved from a single boulder. Not assembled — one piece of stone, shaped. It is larger than it should be, which is to say it is the correct size for what sits in it. The scale of the throne is the scale of the Storm Titan. The math is simple once you see the chair.
>
> The Storm Titan has been enthroned here since before the chamber flooded. It did not move when the water came. The throne was not moved. The chamber filled around both of them and the Titan remained in the correct position: seated, receiving, present.

**Props:** Water entering from cracks — same temperature as the lake, different movement · Throne from a single boulder, shaped not assembled · "The math is simple once you see the chair" · Titan seated in the flooded chamber, receiving
**Threshold test:** The water that moves differently — entering the chamber means crossing from lake water into chamber water; the threshold is perceptible in the current; the Titan's domain has a different physics
**Host-guest:** The Storm Titan as the enthroned host — a throne implies a ruler receiving audiences; the Titan is in the receiving posture; flooded or not, it is present; the chamber is its hall
**Fateful object:** The throne carved from a single boulder — "larger than it should be" encodes the Titan's scale before it is seen; the throne is the advance proof of what sits in it; one measurement tells the whole story
**Interior made exterior:** The Titan's scale rendered as the throne's dimensions — the god is described through the furniture; "the math is simple once you see the chair" makes the inference explicit without making the Titan explicit
**Time as moral frame:** "It did not move when the water came" — the flooding was not a disruption; the Titan's authority over the chamber meant the chamber adapted; seated and receiving through the interval of flooding and after
**Monster scale:** Storm Titan (apex — enthroned since before the flooding; the water filled around it; it remains in the receiving posture; the throne's scale is the advance measurement of what you are about to face)
**Word count:** ~150

---

### NODE: ED — Trench Titan

**Named location:** The Hadal Margin — Deepest Zone, Charybdis Prime Territory

**Current text:**
> The hadal zone. The pressure here is wrong. Charybdis has been waiting in the deepest part of the trench since before the Scholar Kings.

**Proposed replacement:**
> The hadal zone is the last zone — below the abyssal, below the trench slopes, the flat floor of the deepest water in the world. The pressure here is wrong. Not extreme — wrong. Pressure at this depth should be measurable, predictable, the product of water column above. The pressure here has a different source.
>
> Charybdis has been waiting in the deepest part of the trench since before the Scholar Kings named the ocean's zones. Before anyone descended far enough to distinguish the hadal from the abyssal. Before the trench had a name. Charybdis was here when the trench was forming. It may have had opinions about the process.
>
> It does not move toward you. It does not need to. The pressure moves toward you instead.
>
> The pressure is Charybdis, distributed.

**Props:** Hadal zone as the final depth classification — below all others · Wrong pressure with a different source · "It may have had opinions about the process" · "The pressure is Charybdis, distributed"
**Threshold test:** The pressure shift — entering the hadal margin means the pressure changes character; the threshold is perceptible as a qualitative wrongness before anything is visible; the zone announces itself through physics
**Host-guest:** Charybdis as the oldest waiting host — has been waiting since before the Scholar Kings; every visitor that arrives is the eventual fulfillment of a tenure-long wait; the hospitality is the distributed pressure, which is total
**Fateful object:** The wrong pressure — not the creature but its physical expression throughout the zone; the pressure is the advance presence of Charybdis before it is encountered directly; the fateful object is a physics anomaly
**Interior made exterior:** Charybdis described as a distributed physical phenomenon — "the pressure is Charybdis" renders the creature as environment; it is not in the zone, it is the zone's physics
**Time as moral frame:** "Since before the Scholar Kings named the ocean's zones" — Charybdis predates the human act of classification; its tenure is older than the vocabulary used to describe where it lives; it was here before the hadal zone was called the hadal zone
**Monster scale:** Charybdis Prime (apex of the trench — predates Scholar King oceanography; may have had opinions about the trench's formation; the pressure is its distributed self; it does not approach, it is already everywhere in this zone)
**Word count:** ~150

---

### NODE: EM — Noonwraith Queen's Field

**Named location:** The Noon Field — Open Ground, South of the Midlands Road

**Current text:**
> An open field south of the Midlands road. Nothing grows here. She appears when the sun is directly overhead.

**Proposed replacement:**
> The field is south of the Midlands road, past the tree line. Nothing grows here. Not sparse, not thin — nothing. The soil is the correct color and consistency for growth. The field has decided otherwise.
>
> She appears when the sun is directly overhead. Not before. Not after. The moment the shadow disappears from beneath your feet, the Noonwraith Queen is present. She has always been present. Noon is simply the condition under which she is visible.
>
> The field has never grown anything because she has never permitted it. Whatever was planted here before the Queen claimed this ground did not survive the first noon. The soil remembers the decision. Nothing new has tested it since.
>
> You arrived at noon, or you did not. If you did not, the field is empty. If you did, she is already behind you.

**Props:** Correct soil that grows nothing — the decision is the field's, not the soil's · Noon shadow disappearing as the trigger · "The soil remembers the decision" · "She is already behind you"
**Threshold test:** Arrival time is the threshold — the gate is astronomical, not spatial; arriving at noon is the only way to cross it; the field tests punctuality as moral commitment; if you are here at noon, you have already passed through
**Host-guest:** The Noonwraith Queen as the strictly-timed host — she receives at noon and not otherwise; the hospitality is the single moment; she does not come early or late; the guest must come to the host's schedule, not their own
**Fateful object:** The vanishing shadow — when the shadow disappears from beneath your feet, she is visible; the shadow's absence is the trigger object; noon is the fateful moment compressed into a physical phenomenon
**Interior made exterior:** The Queen's permanent presence rendered as the field's permanent barrenness — she is always there; the dead field is her continuous effect; the soil's decision not to grow is the ongoing record of her occupation
**Time as moral frame:** "The soil remembers the decision" — the first noon the Queen claimed this field, nothing survived; every subsequent season the soil has not been tested; the decision is standing and has not been revisited; the deadline for planting here passed long ago
**Monster scale:** Noonwraith Queen (apex — always present, visible only at noon; the field is her permanent domain; nothing survives the first noon; she is already behind you if you arrived correctly)
**Word count:** ~150

---

### NODE: EE — Pharaoh's Vault

**Named location:** The Sealed Descent — Below the Desert Surface, Pharaoh's Vault

**Current text:**
> Cut stone below the desert surface. No sand inside — perfectly sealed. The mummy lord has been waiting since the first century.

**Proposed replacement:**
> Cut stone below the desert surface, descending at the angle the first-century builders chose. The desert is everywhere above. Inside the vault: no sand, no infiltration, no particle of the desert that surrounds it on every side. Perfectly sealed for two thousand years.
>
> Something is maintaining that seal from inside.
>
> The Vault Pharaoh has been waiting since the first century. Not sleeping — waiting. The vault is arranged as a receiving chamber: intact, ceremonial, prepared for the arrival that has taken two thousand years to occur. He did not seal himself in. He sealed himself in with room for a visitor.
>
> The stone is the temperature of stone that has not been touched in a very long time. The air is older than any air you have breathed. The Mummy Lord has been conserving both.

**Props:** No sand inside a desert vault — two thousand years of perfect exclusion · Receiving chamber arrangement — intact, ceremonial, prepared · Stone temperature of long isolation · Air older than any above ground
**Threshold test:** The descent into a space built to remain sealed — entering breaks a two-thousand-year closure; the threshold is the vault entrance; crossing it is the first event in the chamber since the first century
**Host-guest:** The Vault Pharaoh as the most patient host — built a receiving chamber and waited two thousand years for the guest; the ceremonial arrangement is still intact; the hospitality has been held in reserve for the full interval
**Fateful object:** The sealed air — older than any air the player has breathed; maintained for two thousand years; the air's age is the physical record of the vault's isolation and the Lord's continued occupation
**Interior made exterior:** The Mummy Lord's continued existence rendered as the maintained seal — something is keeping the sand out from inside; the vault's perfect condition is the exterior proof of the Lord's interior presence
**Time as moral frame:** "Not sleeping — waiting" — the distinction encodes the entire node; a sleeping occupant is passive; a waiting one has intentions; the receiving chamber arrangement is the evidence that the wait was purposeful and the arrival was anticipated
**Monster scale:** Vault Pharaoh / Mummy Lord (apex — has been waiting since the first century; maintained the seal; arranged the receiving chamber; the air's age is the measure of his tenure; he built this space for this meeting)
**Word count:** ~150

---

### NODE: EV — Djinn Lord's Palace

**Named location:** The Dry Foundation — East of the Caravan Route, Djinn Lord's Palace

**Current text:**
> East of the caravan route. A palace that shouldn't exist this far from the desert coast. The Marid built it from water that is no longer here.

**Proposed replacement:**
> East of the caravan route, in a location where no palace should be: a palace. The desert coast is several days' travel. There is no water table here, no aquifer, no seasonal river, no historical reason for a structure of this scale in this location. The Elder Marid did not require a reason. It required water.
>
> The water is no longer here. The Marid built the palace from it — not with it, from it. The water became the walls, the columns, the floor, the arches. The water is not gone; it is the building. What you are walking into is what the water was before it was consumed into form.
>
> The Elder Marid is still inside. It gave its medium to make the structure. The structure is the hospitality. A djinn that has poured its own substance into architecture and then waited inside for someone to arrive is either very generous or very confident about what happens next.

**Props:** Palace in a location with no water source — no table, no aquifer, no river · "Not with it, from it" — water as material, not medium · The distinction between water gone and water transformed · Generous or confident — the ambiguity held open
**Threshold test:** The palace that shouldn't exist — entering means accepting the impossible location; the threshold is the doorway of a building made from something that evaporated; the test is whether you can walk into what the water became
**Host-guest:** The Elder Marid as the most literal host — it built the palace from its own substance and waited inside; the hospitality is the building itself; a djinn that poured itself into architecture for guests has given everything it had
**Fateful object:** The absent water — not gone, transformed; the palace is the water's final form; every surface is what the water was before it became stone; the fateful object is the transformation itself, held in the walls
**Interior made exterior:** The Marid's power (water command) rendered as permanent architecture — it externalized its medium into structure; the interior (water) is now the exterior (palace); the djinn is inside what it made from itself
**Time as moral frame:** The water was consumed in construction at a specific moment; the palace has stood since then without its source material; the Marid has been inside the structure it paid for ever since; the cost was paid once and the palace has been the permanent result
**Monster scale:** Elder Marid (apex — poured its medium into the building; is inside waiting; the palace is its body in a sense; a djinn that has made itself into a location is not diminished, it is differently distributed)
**Word count:** ~155

---

### NODE: EJ — Canopy Cathedral

**Named location:** The Light Columns — Canopy Level, Cathedral Wyrm's Hollow

**Current text:**
> Deep west in the jungle, accessible by rope and ancient stairwork. Light comes through the canopy in long columns. The dragon hollowed this space.

**Proposed replacement:**
> Deep west in the jungle, the canopy opens into a hollowed space that should not exist at this scale. The approach is rope and ancient stairwork — the stairwork is older than the rope, and the rope is not new. What requires two kinds of infrastructure to reach has been reached before.
>
> Light comes through the canopy in long columns, spaced at intervals that are not random. The openings were made. The Cathedral Wyrm chose where to hollow, which determined where the light falls. The cathedral form — the columns of light, the cleared nave, the vaulted space where branches used to be — is the dragon's aesthetic decision, executed in negative space.
>
> The Wyrm hollowed this. It removed what was here and replaced it with light and volume. Whether the dragon knew the word for what it was making is not the relevant question. It knew what it wanted.

**Props:** Rope over ancient stairwork — layered access infrastructure; both not new · Light columns at non-random intervals — the openings were chosen · "Negative space" as the dragon's design medium · "It knew what it wanted"
**Threshold test:** The rope and stairwork ascent — the threshold is the climb; reaching the canopy cathedral requires using infrastructure the dragon did not need; the test is whether you can ascend into something built at a scale not designed for you
**Host-guest:** The Cathedral Wyrm as the architect-host — it hollowed the space for its own residence; the light columns are its windows; the cathedral form is its hospitality expressed as volume; what it made is what it offers
**Fateful object:** The light columns — not random, therefore chosen; the dragon positioned every opening; the light is the dragon's lasting aesthetic signature, falling in the same columns every day since the hollowing
**Interior made exterior:** The Wyrm's nature (aesthetic, intentional, architectural) rendered as the cathedral's negative space — the dragon is what was removed; the hollow is its self-expression; "what it wanted" is demonstrated by what it made, not stated
**Time as moral frame:** The stairwork older than the rope — layered access history; something came before the rope, used the stairwork, then the rope was added; the cathedral has been reached multiple times by multiple means; the Wyrm has received before
**Monster scale:** Cathedral Wyrm (apex — hollowed the space; chose the light columns; the cathedral is its negative-space self-portrait; it is inside what it made; the scale of the hollowing is the scale of the dragon)
**Word count:** ~150

---

### NODE: ET — Peak of the Eldest

**Named location:** The Summit Claim — Above the Treeline, Peak of the Eldest

**Current text:**
> Above the treeline. The air is thin. The dragon has held this summit without challenge for three hundred years.

**Proposed replacement:**
> The treeline ends and the summit begins. The transition is the gate — below the treeline there is cover, perspective, the ability to see without being seen. Above it: open rock, thin air, and a dragon that has held this ground without challenge for three hundred years. The dragon can see the treeline from the summit. It has been watching the approach since before you reached it.
>
> The air is thin. Not difficult — thin. The distinction matters at altitude: difficult air exhausts you; thin air simply gives you less of what you need, steadily, without announcement.
>
> The Summit Wyrm has been on this peak for three hundred years. No one has challenged its claim. This is the record. Arriving here is the first challenge the record has faced. The dragon has been watching challengers fail to arrive for three centuries.
>
> You are the first thing that counts.

**Props:** The treeline as the visible gate · Dragon watching from summit before the treeline is crossed · Thin air vs. difficult air — the precise distinction · "You are the first thing that counts"
**Threshold test:** The treeline is the gate — crossing it means entering the dragon's visibility before entering its territory; the threshold was crossed before you knew you were at it; the dragon registered your approach from the treeline onward
**Host-guest:** The Summit Wyrm as the open-summit host — no walls, no enclosure; the peak is entirely visible; the dragon's hospitality is the unobstructed meeting ground; it has held an open court on the highest point for three hundred years
**Fateful object:** The thin air — not a dramatic condition but a steady deficit; the air favors the dragon at altitude and disadvantages the visitor; the summit's atmosphere is the home-field advantage the Wyrm has always had
**Interior made exterior:** The Wyrm's dominance rendered as the unbroken record — three hundred years without challenge is not a boast, it is the absence of a counter-example; no one tested it, which is the exterior proof of what testing it would cost
**Time as moral frame:** "Watching challengers fail to arrive for three centuries" — the dragon's patience is expressed as sustained observation of a threshold no one crossed; your arrival ends the three-century observation period; the record ends here
**Monster scale:** Summit Wyrm (apex — has held the highest ground for three hundred years; the thin air is its element; it has been watching since before the treeline; the uncontested record is the advance description of what it would cost to contest it)
**Word count:** ~155

---

### NODE: ER — Frost Warden's Throne

**Named location:** The Glacier Seat — Frozen Waste, North of the Pass

**Current text:**
> The frozen waste north of the arctic pass. Wind constant. The Frost Giant's throne is carved from a glacier.

**Proposed replacement:**
> North of the arctic pass, the frozen waste begins and does not end. The wind is constant — not weather, not seasonal variation, constant. Wind is a feature of this place the way cold is a feature, or ice. The Frost Jarl does not control the wind. He is served by it.
>
> The throne is carved from a glacier. Not from ice — from a glacier, which requires either sustained cold beyond measurement or the kind of patience that counts centuries as a working unit of time. The carving is precise. The armrests fit. Something with hands sat down and worked.
>
> The Frost Jarl sits in it, receiving. He has been north of the arctic pass since before the pass had a name. The waste was here before the pass was cut. He was here before the waste had a name either.
>
> You have come further north than the arctic. The throne is ahead.

**Props:** Constant wind as a permanent feature, not weather · Glacier as throne material — precise carving, fitting armrests · "He does not control the wind. He is served by it." · "Before the waste had a name either"
**Threshold test:** The frozen waste itself is the threshold — past the arctic pass, past the detour route, into terrain that does not offer the arctic's minimal hospitality; reaching the throne tests whether you can go further north than the furthest north
**Host-guest:** The Frost Jarl as the glacier-throne host — sits receiving in the frozen waste; the constant wind is his court's atmosphere; the throne is his hall; he has been sitting in the receiving posture since before anything around him had a name
**Fateful object:** The glacier throne — carved precisely, armrests fitted; the physical evidence of patience counted in centuries; the precision of the carving is the advance measurement of what made it
**Interior made exterior:** The Frost Jarl's authority rendered as the constant wind attending him — not commanded, served; his dominion expressed as the waste's permanent atmospheric condition; he is not in the wind, the wind is in his court
**Time as moral frame:** "Before the waste had a name either" — the Frost Jarl predates the naming of every feature in his territory; he was here when the arctic pass was cut, when the waste was unnamed, before the glacier was a throne; his tenure is the oldest temporal claim after Charybdis
**Monster scale:** Frost Jarl (apex — has been receiving at the glacier throne since before names; the constant wind attends him; the carving is precise because he had the time to make it so; he is the northernmost named lord in the game)
**Word count:** ~155

---

### NODE: EK — Shattered Seraph's Spire

**Named location:** The Falling Space — West of the Sky Road, Void-Blackened Spire

**Current text:**
> West of the sky road. A spire of void-blackened stone. The Seraph has been falling here, in the space between sky and ground.

**Proposed replacement:**
> West of the sky road, the spire stands in the space the road's edge does not cover. The stone is void-blackened — not its original state; not natural coloration. The stone is void-blackened because of what has been near it long enough to change it.
>
> Fallen Variel did not crash. It fell. The distinction is that crashing ends and falling does not. The Seraph is suspended in the space between sky and ground, in the act of falling, which began at a specific moment and has not ended. The spire is the stone record of how long the fall has been ongoing.
>
> The void-blackening runs deepest at the center and fades toward the edges — the corruption radiates from Variel outward, and Variel has been here long enough for the stone to carry it permanently.
>
> The fall began. That moment has not concluded.

**Props:** Void-blackened stone — not original; changed by proximity · "Not crashed — fell. Crashing ends and falling does not." · Void-blackening deepest at center, fading at edges — corruption radiating from source · "That moment has not concluded"
**Threshold test:** Leaving the sky road's edge for the void-adjacent space beside it — the road had no railing, and the spire is in the gap; crossing to the spire means stepping off the road's implicit boundary into the falling Seraph's zone
**Host-guest:** Fallen Variel as the suspended host — it has been here since the fall began; the spire is its space; the hospitality is the fall itself; to enter this zone is to enter the condition of the falling — the Seraph does not need to move toward you, you have entered its descent
**Fateful object:** The void-blackening pattern — deepest at center, fading outward; the gradient is the clock; it tells you how long Variel has been the center of this corruption; the stone is the duration made visible
**Interior made exterior:** Variel's state (falling) rendered as permanent spatial condition — not a position but a process; "the act of falling, which has not ended" describes the Seraph through what it is doing rather than what it is; the fall is its current and total activity
**Time as moral frame:** "That moment has not concluded" — the fall began at a specific instant; that instant is still the present for Variel; time for the Seraph is the extended now of the fall; the void's effect on time is expressed as the permanence of a single falling moment
**Monster scale:** Fallen Variel (apex — has been falling since the moment of fall; the void-blackened spire is the corruption record; the fall is its state and its combat posture; it does not descend toward you, it is already descending, permanently, and you have entered the descent)
**Word count:** ~155

---

### NODE: EP — Admiral's Last Cove

**Named location:** The Low Tide Berth — Tidal Cove, Admiral's Last Station

**Current text:**
> Below the pirate cave, accessible only at low tide. The Admiral's flagship is still here. He has been guarding it since he died.

**Proposed replacement:**
> Below the pirate cave, accessible only at low tide, the cove opens. The approach is timed — the tide determines when you can reach it and when you cannot. The Admiral did not choose this schedule. He works with what the cove gives him.
>
> The flagship is still here. It sits in the low-tide berth in the condition of a ship that has been kept rather than abandoned — no rot in the visible planking, no collapse in the rigging. Someone has been maintaining it. Someone has been here continuously.
>
> The Admiral has been guarding the flagship since he died. The post was not relieved at death. No one relieved it. He is still on station, in the tidal cove, keeping the ship in the condition it was in when he last commanded it.
>
> He died before he could leave. Whether could not and did not are the same question here is not a question the cove can answer.

**Props:** Tidal access schedule — the Admiral works with it, didn't choose it · Ship in kept condition — no rot, no collapse; someone has been here · "The post was not relieved at death. No one relieved it." · "Could not and did not"
**Threshold test:** The tide schedule — the threshold opens and closes without the Admiral's input; arriving at low tide is the prerequisite; the cove tests whether you arrived at the right moment; the gate is astronomical, same as EM
**Host-guest:** The Admiral as the ghost-guardian host — he is on station; the cove is his post; the flagship is his charge; the hospitality is the maintained ship in a hidden cove accessible only to those who know the tide; he has been keeping it for whoever arrives
**Fateful object:** The flagship in kept condition — the maintenance is the evidence; a ghost that maintains a ship has priorities that survived death; the ship's condition is the record of the Admiral's continued presence and continued purpose
**Interior made exterior:** The Admiral's inability or unwillingness to leave rendered as the ship's condition — the interior (what he couldn't release) is externalized as the planking that hasn't rotted; he is present because the ship is maintained; the maintenance is the proof
**Time as moral frame:** "The post was not relieved at death. No one relieved it." — the commission stands because it was never terminated; the Admiral continues a standing order that death did not cancel; the most extreme form of "the instruction has not been rescinded"
**Monster scale:** Admiral Ghost (apex — on station since death; maintains the flagship; the ship's condition is the evidence of his continued presence; he guards what he could not leave; the cove opens at low tide and he is always there when it does)
**Word count:** ~155

---

### NODE: EG — Void Shaman's Sanctum

**Named location:** The Chosen Seal — Below the Warrens, Kazrath's Chamber

**Current text:**
> A chamber below the goblin warrens, sealed by choice. Kazrath has been here since before the Codex shattered.

**Proposed replacement:**
> Below the goblin warrens, the chamber was sealed by choice. Not sealed against Kazrath — sealed by him. From inside. The difference between a chamber sealed to keep something out and a chamber sealed to keep something in is the direction of the lock. Kazrath holds the lock from the inside.
>
> He has been here since before the Codex shattered. The shattering is the event by which everything else in this world is dated — before it, after it, in the moment of it. Kazrath was already below, already sealed, already here when it happened. He felt it from the chamber. He did not come out.
>
> The goblins above know the chamber is below them. They do not go down. They have not gone down since before anyone alive remembers going down.
>
> What Kazrath has been doing in a sealed chamber since before the Codex shattered is the question the chamber was sealed to prevent from being asked.

**Props:** Lock held from inside — direction of the seal defines everything · "He felt it. He did not come out." · Goblins above who do not go down and haven't in living memory · The final question the chamber was sealed to prevent
**Threshold test:** The chosen seal — Kazrath sealed this from inside; breaking the seal requires overcoming a deliberate act of will, not just a physical barrier; the threshold tests whether you can open what someone sealed themselves inside of
**Host-guest:** Kazrath as the self-sealed host — he chose the chamber, chose the seal, has been inside for the entire post-Codex era; the hospitality is the invitation implied by a sealed door: he is in there, and you are out here, and one of those conditions is about to change
**Fateful object:** The Codex shattering as temporal marker — Kazrath predates the game's central catastrophe; "since before the Codex shattered" is not a duration but a position; he was already here when the world's defining event occurred
**Interior made exterior:** Kazrath's depth and commitment rendered as two facts: he felt the Codex shatter and did not come out; the non-response is the exterior proof of the interior commitment; what he is doing is legible only through what he chose not to do
**Time as moral frame:** The final question "sealed to prevent from being asked" — the chamber is a time-lock on a question; the seal is the answer to the question by refusing the question; opening the seal asks it; Kazrath has been the answer for the entire post-Codex interval
**Monster scale:** Kazrath / Void High Shaman (apex — sealed himself in before the Codex shattered; felt it and stayed; the goblins above will not go down; he has been doing something in there for the entire era; he is the oldest self-contained mystery in the game)
**Word count:** ~160

---

### NODE: J1 — Midlands Road Fork

**Named location:** The Two-League Stone — Stone Post, Midlands Road Fork

**Current text:**
> A stone post at a crossroads. Carved arrows: East — Birka (2 leagues). West — Forest Road (3 leagues). The road is packed dirt, well-traveled.

**Proposed replacement:**
> A stone post at the crossroads — carved, not painted. Someone decided these directions were worth the permanence of stone. East, Birka, two leagues. West, Forest Road, three.
>
> The road is packed dirt in both directions, but more packed east. Birka gets more traffic. The Forest Road gets travelers who have already decided not to go to Birka — people who know their destination and are not reconsidering it here.
>
> The post has no opinion on the choice. It has been providing the same two directions for long enough that the road arranged itself around the decision it represents. The packed dirt is the accumulated weight of everyone who read the post and went east.

**Props:** Carved stone vs. painted — permanence chosen deliberately · Differential packing east vs. west · "Already decided not to go to Birka"
**Threshold test:** The crossroads — east to the city, west to the forest; the choice defines what comes next; the stone post is the most literal Chrétien threshold marker in the game
**Fateful object:** The stone post — carved for permanence; the information has been here long enough to pack the road; it will be here after this trip ends
**Time as moral frame:** The packed dirt is accumulated time — every traveler who read the post and chose; the road's condition is the record of the post's entire operational history
**Word count:** ~105

---

### NODE: J2 — Southern Road Cross

**Named location:** The Cracked Marker — No-Shade Crossing, Southern Road Cross

**Current text:**
> Cracked stones in the shape of a crossroads marker. East — Desert Wastes. West — Jungle Road. A vulture circles above. No shade.

**Proposed replacement:**
> Cracked stones at the crossing, arranged in the shape of a crossroads marker. The arrangement is still readable — east, desert wastes; west, jungle road — though the stones have not been in their original condition for some time. The information outlasted the structure.
>
> No shade. A vulture circles above, not descending. The vulture has no stake in which direction you choose. It attends the crossing the way the crossing attends travelers — without opinion, without assistance.
>
> East is exposure. West is cover. The cracked marker offers both directions with equal indifference. The difference between them is the traveler's problem, not the crossing's.

**Props:** Cracked stones still readable — structure degraded, information intact · Vulture circling, not descending — attending without commitment · "The traveler's problem, not the crossing's"
**Threshold test:** East or west — exposure or cover; the crossing is neutral; the choice is entirely the traveler's; no post, no carving, no permanence — just cracked stones that still point
**Fateful object:** The cracked stones — the information outlasted the structure that carries it; the marker is degrading; the directions remain legible; this is the less permanent version of J1's stone post
**Time as moral frame:** "Not been in their original condition for some time" — the crossing has been cracked long enough that this is simply its condition; the information continues regardless of the carrier's state
**Word count:** ~95

---

### NODE: J3 — Coastal Fork

**Named location:** The Driftwood Fork — Cliff Path Junction, Coastal Fork

**Current text:**
> A driftwood post driven into the cliff path. North — Crones' Swamp. South — Tropical Beach. The sea is audible in both directions.

**Proposed replacement:**
> A driftwood post driven into the cliff path — not planted, driven; someone put force into this marker. The wood is sea-worn and grey, borrowed material. The sea gave it up at some point. Someone found it useful. North, Crones' Swamp. South, Tropical Beach.
>
> The sea is audible in both directions. Both destinations are coastal. The sound does not indicate a preference. Neither does the post.
>
> The difference between north and south is not something the driftwood can tell you. The post gives directions. What the directions mean is not in the wood.

**Props:** Driftwood driven, not planted — force applied · Sea-worn grey wood borrowed from the sea · Sound equal in both directions · "Not in the wood"
**Threshold test:** North or south along the coast — swamp or beach; the sound of the sea is the same either way; the fork tests what you are going toward, which the post cannot tell you
**Fateful object:** The driftwood post — impermanent, sea-borrowed, driven rather than planted; the most provisional marker in the junction set; it will not be here indefinitely
**Time as moral frame:** Driftwood is temporary; the cliff path will outlast this marker; the information is current but the carrier is borrowed time — the post tells you where the paths go, not how long it will keep telling you
**Word count:** ~95

---

### NODE: J4 — Deep Road Split

**Named location:** The Tide Mark — Sunken Road, Deep Road Split

**Current text:**
> A sunken road through packed sand. Saltwater marks on the stone walls. East — Visby sewers entrance. West — Deep sea trench coast road.

**Proposed replacement:**
> The road is sunken — below surface grade by enough that the walls are stone and the floor is packed sand that was once a seabed, or close to one. Saltwater marks on the stone walls at chest height. The water was here. It isn't now. The marks say how high it came.
>
> East, Visby sewers entrance. West, deep sea trench coast road. Both directions go further down. The junction does not offer upward.
>
> The packed sand is firm underfoot. A road this far below the surface, traveled enough to pack its floor — someone has been using this corridor regularly through a passage that was once chest-deep in saltwater.

**Props:** Sunken road below surface grade — stone walls, sand floor · Saltwater marks at chest height — the water line, historical · "The junction does not offer upward" · Packed sand in a subterranean passage
**Threshold test:** Both directions descend further — east into the sewers, west toward the trench coast; arriving at this junction means having already accepted going underground; the fork does not reverse that; the threshold was the surface, and you are past it
**Fateful object:** The saltwater marks at chest height — the high-water record; the water came to chest height in this corridor; the marks are the evidence of how different this road was when it was last in active use by the sea
**Time as moral frame:** The water was here and is not now — the marks are the historical record; the floor packed after the water receded; the road has been dry long enough for regular foot traffic to compress the sand; two time periods readable in one corridor
**Word count:** ~100

---

### NODE: J5 — Arctic Overpass

**Named location:** The Fifty-League View — Cloud Level Junction, Arctic Overpass

**Current text:**
> The sky road above the clouds. Permanent frost underfoot. East — Heavenly Clouds road. West — Arctic Wastes. Visible for fifty leagues in clear weather.

**Proposed replacement:**
> The sky road above the clouds. Permanent frost underfoot — not weather, not seasonal variation; this junction is cold in a fixed way that does not change. East, Heavenly Clouds road. West, Arctic Wastes.
>
> Visible for fifty leagues in clear weather. The fifty-league visibility cuts in both directions: you can see everything at that range, and everything at that range can see you. The sky road offers no cover. The view is what the junction provides, and the view is total.
>
> The clouds are below. The junction is above them. This is the correct order for a road built to be above the world.

**Props:** Permanent frost — not seasonal, fixed · Fifty-league visibility in both directions · No cover on the sky road · "The clouds are below" as correct order
**Threshold test:** The cloud layer is already below — arriving here means having ascended past it; the junction tests whether you can navigate at altitude with total visibility and no shelter; the threshold was the cloud layer, and you are past it
**Fateful object:** The fifty-league view — the vista the Scholar Kings designed into the road's highest junction; it is the road's defining feature and its principal exposure; seeing and being seen at the same range
**Time as moral frame:** "Permanent frost" and "correct order" — the frost has been here since the road was built; the clouds being below is the intended design, not a side effect; the junction is as the Scholar Kings made it, unchanged
**Word count:** ~95

---

### NODE: J6 — Western Wilds Crossroads

**Named location:** The Forked Oak — Triple Fork, Western Wilds Crossroads

**Current text:**
> A triple-forked oak, each fork pointing a direction. East — Midlands plains. West — Aldric's Forest. South — a faint path ends at still water. Nothing was said about a lake.

**Proposed replacement:**
> A triple-forked oak at the junction, each main branch pointing a direction. East, Midlands plains. West, Aldric's Forest. North, the mountain pass. The oak did not grow to be a signpost. It has served as one long enough that the function is now its defining feature.
>
> The south branch is smaller than the others. Below it, a faint path through the undergrowth leads toward still water. The path is not maintained. It is not in the main branches. It is barely a path.
>
> Nothing was said about a lake.

**Props:** Triple-forked oak — natural signpost by tenure, not design · South branch smaller, faint path below it · Still water at the end of the unmaintained path · "Nothing was said about a lake"
**Threshold test:** The faint southern path — the three main branches are the official junction; the fourth direction is not marked, not maintained, barely visible; the threshold tests whether you read past the advertised choices
**Fateful object:** The faint path — it ends at still water; the water is Yugurt Lake with the Leviathan; the path is the most consequential unmarked direction in the game; its faintness is the information someone chose not to advertise
**Time as moral frame:** "Nothing was said about a lake" — the silence is the temporal frame; over the entire history of this junction, the lake was not mentioned; the omission is sustained and deliberate; this is information withheld, not forgotten
**Word count:** ~90

---

### NODE: J7 — Sky Gate Spur

**Named location:** The East Spur — Edge Approach, Sky Gate

**Current text:**
> The eastern branch of the sky road. North — Heavenly Clouds entrance. East — Oriental Dragon Palace. Clouds below. Nothing for hundreds of leagues.

**Proposed replacement:**
> The eastern branch of the sky road breaks off here. North, the Heavenly Clouds entrance. East, the Oriental Dragon Palace — the edge of the known world.
>
> Clouds below. Nothing for hundreds of leagues in any direction except north and east. The spur extends into the space between the sky road and the world's eastern limit without cover, without landmarks, without anything the eye can use as a reference except the road underfoot and, eventually, the palace.
>
> The Scholar Kings built the sky road to the edge of the known world. This is the branch they built to reach it. The spur does not apologize for how far east the edge is.

**Props:** Sky road branching east — the departure from the main axis · Clouds below, nothing for hundreds of leagues · Road underfoot as the only navigational reference · "Does not apologize for how far east the edge is"
**Threshold test:** Leaving the main sky road axis for the eastern spur — the junction tests whether you go east toward the world's edge or stay on the main road; the spur is the choice to go to the limit
**Fateful object:** The hundreds of leagues of nothing — absence as the defining feature of the spur; the space between the junction and the palace is described entirely by what it lacks; the road and the palace are the only things in it
**Time as moral frame:** The Scholar Kings built the road to the edge — the spur was planned as the terminus; this junction is the last deliberate architectural decision before the world runs out; it was built to reach a specific limit and it does
**Word count:** ~95

---

## §DESIGN-03 — Starting City Expansion + Ceremonia Roll (Skill Check Quest System)

**Status:** ✅ Implemented 2026-05-26. P1–P4 complete. Lab report: `lab-report-ceremonia-roll-skill-checks.md`.  
**Scope:** Birka Act I node content · New quest type `skill_check` · Ceremonia Roll engine · 5-act romantic vignette chain

---

### I. Design Rationale

The starting city (Birka, Act I) currently provides two progression lanes: vermin hunting at SL (trivial–easy, L1–4) and the Cat Quarter arc at CQ (easy–hard, L5–20). Between these is a gap: players at L3–6 who have cleared the Slums but are not yet strong enough for the Cat Quarter have no meaningful city content.

Wider problem: **combat is the only source of XP.** All social interaction, exploration, and NPC relationship-building are narratively rewarded but mechanically inert — they do not advance the player's numbers. The existing romance layer (ROMANCE_QUOTES, NPC_ROMANCE_PREAMBLES, NPC_ROMANCE_VIGNETTES, all ✅ implemented) has no quest structure tying it to any mechanical progression. Players have no in-system reason to build NPC favorability beyond curiosity.

**Fix:** Introduce a skill check quest type — the **Ceremonia Roll** — that makes social and exploratory actions mechanically meaningful. Apply it to new Birka missions and to a 5-act romantic vignette chain that gives the favorability system a story spine.

---

### II. Ceremonia Roll — Mechanic Spec

A **Ceremonia Roll** is a named d20 skill check. "Ceremonia" is a Birkan social term — from *caerimonia* (sacred rite) — used in the city's legal and diplomatic culture. When an NPC is sizing you up, a guard is deciding whether to pass you, or a courtship moment is being made formal, the dice are called a Ceremonia Roll.

**Formula:**
```
d20 + abilityMod(ability) + profBonus ≥ DC  →  Pass
```

- `abilityMod(a) = Math.floor((S_story.abilityScores[a] - 10) / 2)`
- `profBonus = 2 + Math.floor((S_story.level - 1) / 4)`  
  (D&D 5e standard: L1–4 → +2 · L5–8 → +3 · L9–12 → +4 · L13–16 → +5 · L17–20 → +6)
- **Default stat:** the character's own ability scores from character creation, modified by level proficiency. No situational bonuses unless a condition item grants them.

**DC tiers:**

| Tier | DC | Example |
|------|----|---------|
| Easy | 10 | Casual persuasion; a guard who wants to be convinced |
| Medium | 12–13 | Competent NPCs with genuine doubt |
| Hard | 15 | Adversarial or high-stakes social situations |
| Very Hard | 18 | Against a trained interrogator or deeply suspicious NPC |

**Retry gate:** Each quest specifies `retryable: true/false`. If retryable, a failed roll locks the attempt until `S_story.day` advances (daily cooldown). If not retryable, one roll only — pass or permanent fail path.

**Combat log integration:** Ceremonia Rolls display in the combat log hcard strip using the same roll card format as attack rolls. Breakdown shown: `d20(14) + CHA mod(+2) + Prof(+3) = 19 vs DC 15 → Pass`.

---

### III. Quest Type — Skill Check Challenge

**New QUEST_DB fields** (added to qualifying entries alongside existing fields):

```js
{
  // existing fields:
  id: 'quest_ceremonia_yael_01',
  title: 'The Watch',
  // new fields:
  type: 'skill_check',           // flags this as a Ceremonia Roll quest
  checkAbility: 'cha',           // str | dex | con | int | wis | cha
  checkLabel: 'Persuasion',      // display name in UI button + log
  checkDC: 10,                   // target number
  retryable: true,               // daily retry gate on fail
  retryGateDays: 1,              // days until retry (default 1)
  checkPassFlag: 'ceremoniaPassed_yael_01',  // S_story flag set on pass
  vignetteText: '...',           // 2–3 sentence prose shown before the roll button
  passText: '...',               // one sentence shown on pass
  failText: '...',               // one sentence shown on fail
}
```

**UI render** (in QUEST section of `storyRenderSections()`):

- Quest card shows `checkLabel`, modifier total `(+N)`, and DC
- Single button: **"Roll Ceremonia — [Label] DC [N]"**
- On click: `_rollCeremonia(questId)` fires
- Result hcard pushed to combat log strip: roll breakdown, pass/fail verdict, flavor line

**`_rollCeremonia(questId)` function spec:**
1. Pull `checkAbility`, `checkDC` from QUEST_DB
2. Compute `mod = Math.floor((S_story.abilityScores[ability] - 10) / 2)`
3. Compute `prof = 2 + Math.floor((S_story.level - 1) / 4)`
4. Roll `d20 = Math.ceil(Math.random() * 20)`
5. Total `= d20 + mod + prof`
6. If total ≥ DC: pass path (complete quest, set `checkPassFlag`, push pass hcard)
7. If total < DC: fail path (push fail hcard; if `retryable`, set retry gate on `S_story.skillCheckAttempts[questId].lastDay`)
8. Re-render QUEST section

---

### IV. Starting City New Content — Birka Act I

Four new Birka missions using existing nodes. None require new nodes.

| Quest ID | Node | Type | Ability | DC | Reward | Notes |
|----------|------|------|---------|-----|--------|-------|
| `quest_courier_release` | BA (city) | `skill_check` | CHA | 10 | Map + 50gp | Already implied in NODE 1 text ("must be persuaded or deceived"). Retrofit: make the City Guard encounter a real Ceremonia Roll gate. Fail path: player must pay 20gp bribe instead. |
| `quest_city_watch_patrol` | BA→IN→TA | accomplishment | — | — | 50gp + Yael fav +1 | Visit BA, IN, TA in sequence. Fires on TA arrival if quest active. No combat. L1 suitable. |
| `quest_crypt_survey` | CP (crypt) | `skill_check` | WIS | 12 | 75gp + `cryptSurveyed: true` | "Something is digging from below — you spend an hour mapping the second chamber." Retry: daily. Flavor tie: Froberger made the same survey fifteen years ago; his notes are in the archive. |
| `quest_pit_debut` | CY | accomplishment | — | — | 100gp + "Pit Newcomer" flavor line | Auto-fires on first CY battle win. Uses existing `pitTrainingWins` tracking — needs reward hook only. L4–6 suitable. |

**Accomplishment missions** do not use the Ceremonia Roll. They fire automatically when a condition is met and push a reward hcard to the combat log.

**Early XP source gap:** Skill check quests award XP on pass:

| Quest | XP Award | Level Range |
|-------|----------|-------------|
| `quest_courier_release` | 100 XP | L1 |
| `quest_city_watch_patrol` | 150 XP | L1–2 |
| `quest_crypt_survey` | 200 XP | L3–5 |
| `quest_pit_debut` | 250 XP | L4–6 |

---

### V. The Ceremonia Arc — "The Watchpost" (Yael Scheidemann, 5 acts)

A 5-act romantic vignette chain applied to Yael Scheidemann using the French vignette technique from §GR-F. Each act is a `skill_check` quest. Acts are named for the object that survives — the same object travels across all five acts.

**Prerequisites:** `quest_slums_cleanup` complete (Yael Friendly, fav ≥ 1).

| Act | Quest ID | Object | Node | Ability | DC | Trigger | Retryable |
|-----|----------|--------|------|---------|-----|---------|-----------|
| I — The Watch | `quest_ceremonia_yael_01` | The watch she checks every quarter-hour | BA | CHA (Persuasion) | 10 | Yael fav ≥ 1 | yes |
| II — The Route | `quest_ceremonia_yael_02` | The patrol route, rolled in her left sleeve | BA | WIS (Insight) | 12 | Act I pass | yes |
| III — The Crate | `quest_ceremonia_yael_03` | A heavy crate in the Slums square | SL | STR (Athletics) | 12 | Act II pass + at SL | yes |
| IV — The Report | `quest_ceremonia_yael_04` | The duty report she signs at shift change | BA | CHA (Persuasion) | 14 | Act III pass | no |
| V — The Name | `quest_ceremonia_yael_05` | Your name, spoken without title | BA | CHA (Persuasion) | 15 | Act IV pass + Yael fav ≥ 3 | no |

**Completion reward:** `ceremonia_yael_complete: true` + Yael Dear Friend (fav → 3 if not already) + `Yael's Watch Token` item (sell: 0; flavor: *"A small brass coin, worn smooth. Guard issue, retired. She gave it to you without explanation."*)

**Vignette prose spec (Act I — sample):**

> *She checks her watch once more while you are talking. Quarter-hour. She has been doing this since before you arrived. You say what you came to say. She does not look up from the logbook. The watch is back in her coat pocket. You have thirty seconds before the shift changes.*

Roll: CHA (Persuasion) DC 10.  
Pass: *She writes something in the logbook. You do not see what.*  
Fail: *The logbook closes. "Next time," she says, which means: try again.*

**Writing technique (all 5 acts):** Present tense, second-person, 2–3 sentences max before the roll button. The prose names the object, describes the space, withholds the emotion. Pass/fail lines are one sentence each. The gap between the two lines is the emotional range; the player's dice determine which vignette they receive. No act tells the player what they are feeling.

**Act IV note (no retry):** DC 14. The shift captain is asking why you were seen in her district. One pass gets you through without Yael's name appearing in anyone's report. Fail: `ceremonia_yael_04_failed: true`; the quest status is `'failed'`; Act V still unlocks, but Yael's Act V opening line changes: *"I heard about the report."*

**Act V note (no retry):** DC 15. She says your name. Not the title. Not "you." Your name — which she has been carrying since you told it to her outside the mortuary. One roll. The last Ceremonia Roll of the arc.

---

### VI. New State Fields

| Field | Type | Purpose |
|-------|------|---------|
| `S_story.skillCheckAttempts` | object | `{ questId: { lastDay: N, failures: N } }` — retry gate; `lastDay` = `S_story.day` value of last fail |
| `S_story.ceremoniaYaelAct` | number | Current act in Yael arc (0 = not started, 1–5 = act N complete) |
| `S_story.ceremonia_yael_04_failed` | boolean | Act IV fail path — Yael's Act V opening line variant |
| `S_story.ceremonia_yael_complete` | boolean | Full arc complete |

**§DUNGEON-01 new state fields (Layer 80):**

| Field | Type | Purpose |
|-------|------|---------|
| `S_story.cyMadnessRoll` | `'clear'\|'fractured'\|null` | CY first-visit WIS save result |
| `S_story.cyMadnessTable` | `string\|null` | d10 madness table result text |
| `S_story.inquisitorMet` | boolean | WM Codex Inquisitor handshake initiated |
| `S_story.inquisitorPassed` | boolean | All three questions passed; archive key given |
| `S_story.priorCarrierSeen` | boolean | Prior Carrier encountered in WM cell |
| `S_story.priorCarrierSpoke` | boolean | Player answered the Prior Carrier's question |
| `S_story.mazeSolvedChecks` | number (0–3) | Void Fracture Maze navigation checks |
| `S_story.voidMazeEntered` | boolean | Player entered the Void Fracture Maze |
| `S_story.voidFluxActive` | boolean | Arcane Inversion Zone active during combat |
| `S_story.voidFluxCleared` | boolean | Chamber defeated |
| `S_story.voidFluxImmunityChoice` | `string\|null` | Chosen immunized inversion |
| `S_story.voidFluxScrollChanged` | boolean | Scroll dual-use state |
| `S_story.codexCoreChosen` | `'stabilize'\|'destroy'\|'claim'\|null` | Codex Core Chamber choice |
| `S_story.codexCoreEntered` | boolean | Pre-boss chamber triggered |
| `S_story.tribbleCount` | number | Tribble counter — void-corruption byproduct; acquired at Node MM, consumed as mimic-bait |
| `S_story.mimicPetName` | `string\|null` | Baby mimic pet name |
| `S_story.tribbleGladesFed` | boolean | Colony fed 3× rations |
| `S_story.memorGateBypassUsed` | boolean | Memory Gate fought through rather than paid |
| `S_story.memorGatePassedEntry` | boolean | Found prior payment entry in toll room |

---

### VII. Implementation Phases

| Phase | Scope | Status |
|-------|-------|--------|
| **P1** | Ceremonia Roll engine: `_rollCeremonia(questId)`, `_appendStoryHcard()`, `_ceremoRetryBlocked()`, hcard render, retry gate; `storyCheckQuests()` `activateCond` patch | ✅ 2026-05-26 |
| **P2** | `quest_courier_release` + `quest_crypt_survey`: QUEST_DB entries, wired to `type: 'skill_check'`, XP awards | ✅ 2026-05-26 |
| **P3** | `quest_city_watch_patrol` + `quest_pit_debut`: accomplishment hooks, patrol flag logic | ✅ 2026-05-26 |
| **P4** | Ceremonia Arc 01–05 (Yael): full QUEST_DB entries, all prose vignettes, state flags, fav gate | ✅ 2026-05-26 |

---

### §DESIGN-03-G. Lab Report Gate

Write `lab-report-ceremonia-roll-skill-checks.md` before implementing P1. Report must lock:

1. Data shape for `type: 'skill_check'` in QUEST_DB — all new fields, which are required vs optional
2. `_rollCeremonia()` function signature, return value, and hcard push format
3. Retry mechanic: state field key format, collision prevention with existing quest fields
4. UI render spec: where the button appears in `storyRenderSections()`, what the quest card shows at each state (active/retry-locked/passed)
5. Prose for all 5 Yael arc acts — `vignetteText`, `passText`, `failText` locked before any HTML edit
6. XP award hook: integration with `storyLevelCheck()` — same path as battle XP or separate channel
7. Assess whether `quest_courier_release` should gate the NODE 1 main flow or run as an optional parallel quest

---

## §DUNGEON-01 — Ten Dungeon Themes Applied to The Shattered Codex

**Source:** Transcript — "10 Dungeon Room Ideas That Don't All Rely on Combat" (D&D Hunter)  
**Status:** ✅ Fully Implemented — Layer 81 (2026-05-26). All 10 themes live. Nodes WK (Scholar King's Workshop) + MM (Mimic Meadows) implemented. Node code WK replaces deferred SW (WM was already taken). All D02 chains complete.  
**Scope:** New node types · Dungeon-cluster design doctrine · Hero origin canon · Loop reason · Mimic Meadows territory · Madness mechanic · Heart of the Dungeon room · Arcane inversion zone · Sacrifice gates · Shifting labyrinth

---

### §D01-01 — Themed Dungeon Doctrine (Theme 1: Theme Your Dungeon)

**Principle:** Every EB (Epic Battleground) and major node cluster should feel architecturally unified — not tunnel-after-tunnel. Each zone needs an atmosphere that connects all its rooms to a single governing idea.

**Application to The Shattered Codex:**

The 20 Epic Battlegrounds are currently spec'd as individual combat encounters with NPC quest-givers. Upgrade each to a **mini-dungeon cluster** with 3 thematic zones:

| Zone | Role | Mechanic |
|------|------|----------|
| Approach room | Atmosphere-setter, no combat | Lore/puzzle/Ceremonia Roll |
| Mid-chamber | Hazard room — madness / labyrinth / sacrifice gate | Skill check or resource cost |
| Boss room | The EB encounter | Combat, driven by existing EB system |

**Thematic archetypes for existing EB clusters:**

| EB | Theme Archetype |
|----|----------------|
| Abyssal Scriptorium (AT) | Library of the drowned — ink-black water, pages that ripple |
| Void Shaman's Sanctum (BK) | Organic corruption — bones in walls, void-flesh architecture |
| Djinn's Apex Vault (DC) | Elemental geometry — sand-glass corridors, light refracting wrong |
| Oriental Dragon Palace | Celestial bureaucracy — jade, red lacquer, forms that require completion |
| Heavenly Clouds | Altitude vertigo — no ground visible, cloud-floor illusion |

**Implementation note:** Themed approach rooms and mid-chambers do not require new nodes — they are rendered as flavor sections within existing EB node `storyRender()` calls, gated by `!defeatedBattles[ebCode]`.

---

### §D01-02 — The Judgment Room (Theme 2: The Interview)

**Principle from transcript:** A statue interviews the player, locked to the chair, must answer truthfully. Questions reveal backstory. Lying incurs psychic damage.

**Application: The Codex Inquisitor at Weimar (WM)**

At the Weimar lower archive (`wmLowerArchiveUnlocked`), a Scholar King defensive construct sits behind the final door. A stone judge with an outstretched hand. The player shakes it. The construct activates. Three questions asked; the answers unlock the Weimar Fragment (Shard #7 approach).

**The three questions (dynamically chosen from player state):**

| Question | State condition | Pass outcome |
|----------|-----------------|--------------|
| "Name someone you helped." | Check `npcFavorability` — any fav ≥ 2 | Pass: construct acknowledges; next question |
| "Name something you sacrificed to come this far." | Check `defeatedBattles` + `curse score` | Pass: construct recognizes cost |
| "Why are you still here after everything?" | Final question — Ceremonia Roll CHA DC 12 | Pass: door opens |

**Lie detection:** If the player's answer to a past-action question contradicts their actual state flags (e.g., claims to have helped someone with fav = 0), a psychic zap fires: 10 damage, Construct says *"The record disagrees."* Retry allowed — but the lie is logged in combat history.

**On passing all three:** The construct releases the player, hands over the archive key, and delivers one line: *"The previous applicant answered none of them correctly. He came back seventeen times."* (Sweelinck, in a previous age.)

**New state flags:** `inquisitorMet: boolean`, `inquisitorPassed: boolean`

---

### §D01-03 — The Prisoner Who Shouldn't Be Here + Hero's Origin (Theme 3)

**Principle from transcript:** A confused person woke up in a cell with no memory of how they got there. The dungeon itself may have pulled them in. Could be a future version of a party member.

**Application: The Hero's Origin Canon — "The Codex Carrier"**

This is the canonical answer to: *What were you before the loop began?*

**Proposed canon:**

You were a Scholar King Apprentice — not one of the seven kings, but one of their assistants, the person who ran messages between them during the final binding. When the last Seal was set, the Codex's magic misfired: it needed a carrier for the next age but found no one who qualified. It pulled the nearest living person who understood all seven Kings by name. That was you. You were not heroic. You were just present, and you knew their names, and the Codex decided that was enough.

You have been waking up in Birka ever since — at the moment the city needs you, with no memory of who you were, with a sword and a coin purse, at the exact corner where a dying courier is about to round the turn too fast.

The Neon Undercity (CY) feels wrong to you in a way you cannot name. You built it. Not in this run — in an earlier one. The Scholar Kings' underground city was your design. You forgot. The Void has been slowly corrupting it since.

**The Prisoner NPC — "The Prior Carrier"**

In the Weimar lower archive, behind the Inquisitor's door, there is a cell. Inside: a figure sitting against the wall. Their eyes are tired. Their clothes are Scholar King era — not fantasy, not cyberpunk. Just old. They do not know how they got here.

They are a previous version of the player. Not quite the player — more like a ghost of an earlier run that got stuck. The dungeon (the Codex's architecture) pulled them in because the binding was imperfect.

They are not hostile. They ask one thing: *"Did the Void open again?"*

**Player responses and outcomes:**

| Response | Effect |
|----------|--------|
| "Yes." | Prior Carrier nods. *"It always does. Tell Sweelinck I found the seventh entry."* Gives `Prior Carrier's Token` — not collectible, just flavor. |
| "No." | Prior Carrier says *"Then you're ahead of me."* Token same. |
| Ignore / walk past | No token, but `priorCarrierSeen: true` fires; Sweelinck's Last Question changes to *"Did you find the room?"* |

**New state flags:** `priorCarrierSeen: boolean`, `priorCarrierSpoke: boolean`

---

### §D01-04 — Price Rooms: Sacrifice Gates (Theme 4: The Room That Demands a Sacrifice)

**Principle from transcript:** A door with glowing runes: "A price must be paid." Make the price something players dread: a memory, a secret, a class feature for a week.

**Application: Void Toll Gates**

Three optional toll gates distributed across Act III–VI nodes. Each extracts a cost more significant than gold. All are optional bypasses — there is always a harder path that avoids the toll.

| Gate | Location | Price | Gain |
|------|----------|-------|------|
| **The Memory Gate** | Catacombs (CO approach) | One journal entry permanently removed from `journalEntriesRead` — a memory the Codex takes | Skip a dangerous corridor segment |
| **The Secret Gate** | Void Archaeology node | A Ceremonia Roll CHA DC 13 — "speak the thing you have not said" (player types a secret into a text box) | The secret is written into `S_story._voidTollSecret`; delivered as an anonymous line in the victory epilogue |
| **The Class Gate** | Weimar archive | Spend an Action Surge charge permanently (reduces `surgeCharges` max by 1 for this run) | `wmLowerArchiveUnlocked` bypassed — direct access to Inquisitor room |

**Design note:** The transcript warns against blood sacrifice (D4 damage, anyone would pay it). These prices are not HP. They are choices that the player will think about before agreeing. The Memory Gate removes something the player has already collected. The Secret Gate records what the player writes. The Class Gate costs a combat resource permanently.

---

### §D01-05 — The Shifting Labyrinth: The Void Corridor Maze (Theme 5)

**Principle from transcript:** Walls rotate on a d6 roll (4–6 = shift). Three successful navigation checks before the dungeon realigns. Walls can crush on failure.

**Application: The Void Fracture Maze (new EB cluster)**

A new Epic Battleground zone: `void_fracture_maze` terrain. Applied to one existing EB — the Void Shaman's Sanctum approach (BK) is the best fit: a maze of void-corrupted architecture that rearranges itself.

**Mechanics:**

Every two rounds in the maze, the DM rolls a d6:
- 1–3: Layout stable. Move freely.
- 4–6: Walls shift. A check is required to maintain orientation.

Three checks needed before the boss room opens:

| Check | Ability | DC | Effect on fail |
|-------|---------|-----|----------------|
| Track movement through rotating walls | WIS (Survival) | 14 | Looped back to start of maze |
| Read the shifting void runes | INT (Arcana) | 14 | `voidPressure` +1 |
| Dash through before walls close | STR/DEX (Athletics) | 13 | 10 crushing damage |

**State mechanic:** `mazeSolvedChecks` counter (0–3). On 3 checks: maze stabilizes, boss room unlocks. Failed checks cost resources but do not fail the run.

**New state flags:** `mazeSolvedChecks: number (0–3)`, `voidMazeEntered: boolean`

---

### §D01-06 — The Forgotten Workshop: The Scholar King's Laboratory (Theme 6)

**Principle from transcript:** A dusty room with half-finished constructs, blueprints, and clues about the final boss. A safe rest room — but the creator walks in after 2 hours.

**Application: Node SW — The Scholar King's Workshop (new optional node)**

A new optional node accessible from the Weimar or CO approach. The abandoned lab of the Scholar King who designed both the Neon Undercity and the Codex binding architecture.

**Contents:**
- Blueprint of Commander Auros's armor (foreshadows the CO boss, hints at the weak point)
- A half-finished void containment construct with a note: *"The failsafe assumes the carrier remembers their name. Current carrier test: negative."* (The player is the carrier. They failed the test.)
- `Scholar King's Prototype Wand` — single use: empowered spell effect; 2d6 force damage on next attack
- A rest opportunity: safe short rest, free

**The 2-hour rule:** If the player rests more than one short rest cycle here, a footstep sequence fires in the combat log: *"Someone is walking toward this room from below."* The creator is not dead — they are an ancient Scholar King spirit that has inhabited the lab. They are not hostile but they are intensely uncomfortable with visitors.

**Spirit encounter:** Ceremonia Roll WIS DC 12 — *"They look at you the way a teacher looks at a student who found their private notes."* Pass: the Spirit tells you one thing about Commander Auros that changes combat. Fail: they gesture toward the exit. Either way they do not fight.

**New node:** `node_sw` — Scholar's Workshop. Accessible from WM.S or CO.W. Terrain: `workshop`. No default battle.

---

### §D01-07 — Madness Risk: The Neon Undercity as Hallucination (Theme 7)

**Principle from transcript:** Alien being frozen in ice; staring at it triggers WIS save; fail = roll on the madness table. The question: is it worth the risk to find out what this alien is?

**Application: The CY Madness Gate + Hero Origin Reveal**

**The central question:** Is the Neon Undercity real?

The CY node (Lower Birka — the Neon Undercity) is the only cyberpunk-aesthetic node in an otherwise fantasy/historical world. The story justification is that the Scholar Kings built it as a technological failsafe three centuries ago. But the Void has been corrupting it since. The player, as a Codex Carrier with no conscious memory of prior runs, may have *built* it in a previous life.

**Mechanic: First CY Entry WIS Save**

On first visit to CY (`!visited['CY']`), a WIS save fires before the normal render:

| Roll | DC 12 | Outcome |
|------|--------|---------|
| **Pass** | The player sees the Neon Undercity clearly: Scholar King infrastructure, three centuries old, now void-corrupted. The neon is bioluminescent void growth on copper wiring. The data wraiths are corrupted Scholar King maintenance programs. This is what it is. | `cyMadnessRoll: 'clear'` |
| **Fail** | The Neon Undercity doesn't make sense. A fantasy city shouldn't have neon. A fantasy city shouldn't have data wraiths. For one round, the player's combat log shows fragments: *"You have been here before. You don't know when. The wiring looks like something you designed."* Short-term madness fires: roll on the D&D Madness Table. | `cyMadnessRoll: 'fractured'` |

**The madness result is flavor only** — it cannot kill, and it clears by the next day. But it plants the question: was CY always real, or is the Void teaching you to see things that aren't there? In NG+ runs, the WIS save does not fire — the player's accumulated self knows what CY is. Instead, a one-time line: *"The Neon Undercity looks exactly as you remember it. Which is the problem — you should not remember it at all."*

**New state flags:** `cyMadnessRoll: 'clear'|'fractured'|null`, `cyMadnessTable: string` (result text)

**Short-term Madness Table** (d10, flavor only — no mechanical penalties past flavor):

| d10 | Madness |
|-----|---------|
| 1 | "The walls are breathing. You are fairly certain this is incorrect." |
| 2 | "The data wraith turns toward you before you enter the room. You didn't make a sound." |
| 3 | "A maintenance log on the wall is dated 300 years ago and your name is on it." |
| 4 | "For three seconds, the neon is beautiful and you know exactly why." |
| 5 | "You can read the void-script on the relays. You do not know this language. You have always known this language." |
| 6 | "Someone else is wearing your footsteps." |
| 7 | "The Corrupted Androids look at you like they recognize you." |
| 8 | "The map in your hand matches this building's blueprint exactly. It shouldn't." |
| 9 | "You almost said hello to the data wraith before combat started." |
| 10 | "This is fine. This is all fine. You have been here before and it was fine then too." |

---

### §D01-08 — The Mimic Meadows + Tribble Glades (Theme 8: Mimic Sanctuary)

**Principle from transcript:** A room full of non-hostile mimics living their best lives. Baby chest mimics scurrying. Bookshelf mimic napping. Mother Mimic watching like a big weird cat. Animal handling checks to befriend. A mimic can become a pet — or cough up a reward. It's like a little mimic colony. Fun and cute.

**Application: New Territory — Node MM, Mimic Meadows**

A new optional node: the only space in the world where mimics are the dominant ecosystem, living peacefully in symbiosis with Tribbles (small fuzzy multiplying creatures). The mimics have no reason to attack — they are well-fed and safe. The Tribbles keep them entertained.

**Node MM — The Mimic Meadows**
- Accessible from: Jungle node (NODE 33) east exit, or as an Act III detour branch
- Terrain: `mimic_meadow` (new terrain entry in `WORLD_DB`)
- No default hostile battle — all enemies are `mimic_*` variants flagged `passive: true`
- Monster pool (passive, Animal Handling gate): baby_chest_mimic, bookshelf_mimic, floor_mimic, mother_mimic

**Tribble mechanic:**

Tribbles are a collectible item dropped by the Mimic Meadows environment. They do nothing harmful. They multiply in inventory.

| Inventory state | Effect |
|----------------|--------|
| 1 Fuzzy Tribble | Just sits there. Soft. |
| 2 Fuzzy Tribbles (after any sleep) | Becomes 3. |
| 3 Fuzzy Tribbles | Becomes "Tribble Cluster" — counts as one slot, still multiplies |
| 5+ after next sleep | Becomes "Tribble Swarm" — small hcard appears in combat log: *"The Tribbles have opinions about the battle."* Flavor only. |
| 10+ | `tribbleOverflow: true` — Brynn at the Inn says: *"Those things are on the ceiling."* |

**Tribbles as mimic bait:** In the Mimic Meadows, offering a Tribble to a mimic in lieu of gold adds +4 to the Animal Handling check (mimics find the movement irresistible).

**Animal Handling encounters:**

| Target | WIS DC | On success | On fail |
|--------|--------|-----------|---------|
| Baby chest mimic | 10 | Befriended; follows for remainder of node visit | Scurries away |
| Bookshelf mimic | 12 | Naps beside you; ignore you for rest of visit | Hisses; minor psychic damage 2 |
| Floor mimic | 13 | Coughs up 1 Fuzzy Tribble | Startled; leaves |
| Mother Mimic | 16 | Grants `Mimic's Cache` (random rare item + 3 Fuzzy Tribbles) | Watches you coolly. No attack. Try again tomorrow. |

**The Mimic Pet:**

If the baby_chest_mimic Animal Handling check passes + the player feeds it gold (20gp), it becomes `Baby Mimic` — an equipped pet item that grants one passive: +2 to Deception checks (the mimic opens its lid convincingly to distract NPCs). It cannot be sold. It can be named — player text entry, saved to `S_story.mimicPetName`.

**Quest: "Colony Curation" — `quest_mimic_colony`**
- Trigger: First MM visit
- Objective: Bring 3× Rations to the colony (feed the Tribbles) AND pass one Animal Handling check (any mimic, any DC)
- Reward: 200gp + `Mimic's Wax` item (can coat a weapon: next attack auto-crits — chest-mimic saliva is surprisingly corrosive) + `tribbleGladesFed: true`
- Flavor: The Mother Mimic watches you leave. She does not follow. The meadow is still there if you come back.

**New state flags:** `tribbleCount: number`, `tribbleOverflow: boolean`, `mimicPetName: string|null`, `tribbleGladesFed: boolean`

---

### §D01-09 — The Arcane Inversion Zone: Void Flux Chamber (Theme 9)

**Principle from transcript:** In this room magic works backwards. Fire freezes. Healing hurts. Teleportation sends you somewhere else. Players must adapt on the fly.

**Application: The Void Flux Chamber (new EB approach room)**

Applied as the mid-chamber in two EBs where the Void's corrupting influence on reality is strongest:

1. **Abyssal Scriptorium approach (AT)** — ink-black room where written spells invert
2. **Neon Undercity CY_VOID encounter** — the deepest relay chamber; void energy inverts polarity

**Inversion table (active while inside the Void Flux Chamber):**

| Normal effect | Inverted effect |
|--------------|----------------|
| Fire damage | Cold damage + slow (move rate halved) |
| Healing spell | 50% of healing becomes damage |
| Teleportation | Player moves to random adjacent node (1-step displacement) |
| Buff (ADV) | Becomes DIS for that round |
| Necrotic damage | Becomes radiant damage (vs undead: reversed weakness/resistance) |

**Mechanical implementation:**

`S_story.voidFluxActive: boolean` — set when the player enters the chamber. While active:
- `storyRollAttack()` checks `voidFluxActive` and applies inversion table to condition items
- Healing potions in `storyRollHeal()` apply 50% as damage if `voidFluxActive`
- Combat log hcard shows: *"[Void Flux] Fire → Cold. Heal → Hurt. The rules have changed."*

**Escape:** Clear the chamber's mini-encounter (3–4 enemies, INT (Arcana) DC 12 check pre-battle grants immunity to one inversion of player's choice) or use INT (Arcana) DC 15 to deactivate the chamber without combat.

**New state flags:** `voidFluxActive: boolean`, `voidFluxCleared: boolean`, `voidFluxImmunityChoice: string|null`

---

### §D01-10 — The Loop Heart: Codex Core Chamber (Theme 10: Heart of the Dungeon)

**Principle from transcript:** Final room. A pulsing crystal at the center. Air shivers. Every step echoes. The players must choose: stabilize it, destroy it, or claim its power. No mandatory combat. About choices and the weight of the dungeon's final secret.

**Application: The Codex Core Chamber at CO — Pre-Boss Choice Room**

A new pre-boss room inserted at the CO node, before the Commander Auros fight. Accessible after 6 Shards are in hand but before engaging Auros. The seventh Shard is visible inside the Codex Core, pulsing.

**Description:**

> *The chamber hums like a tuning fork. The Codex — not all of it, not yet, but the architecture of it — is visible here as a standing column of light, each Shard spinning in its locked position. Six of them yours now. The seventh is here. Has been here. The chamber built itself around the seventh Shard centuries ago and the whole CO node is structured around keeping anything from touching it. Commander Auros is not guarding the Codex. She is part of the seal. She does not know this. When she attacks you, she is executing a Scholar King failsafe that has been running in her bones for thirty years.*

**The Choice:**

| Option | Mechanic | Outcome |
|--------|---------|---------|
| **Stabilize** | Standard path — take Shard, face Auros | Normal CO boss fight; full ending options |
| **Destroy the housing** | Ceremonia Roll STR DC 15 — smash the crystal column | Shard acquired without Auros fight (ends threat) — but `curseScore +5`: "You broke something that could not be rebuilt." Auros's armor fails (she is freed from the compulsion) but the Codex housing is permanently scarred |
| **Claim it as power** | Ceremonia Roll CHA DC 17 — assert ownership of the full Codex in its incomplete state | `surgeCharges` +2 permanent for this run, `voidPressure` +3 (the void notices), Shard acquired, Auros fight still required but Auros is confused: "You shouldn't be able to do that." |

**The Loop Reveal:**

If `priorCarrierSeen: true` (from §D01-03 — the player met the Prior Carrier in Weimar), an additional text block fires:

> *The Prior Carrier said "Tell Sweelinck I found the seventh entry." You are standing in the room where that entry was written. This is not a metaphor. The Codex recorded you before you arrived. The blank page is not blank.*

This fires as a one-time combat log hcard. No mechanical effect. It is the answer to where you were before the loop.

**New state flags:** `codexCoreChosen: 'stabilize'|'destroy'|'claim'|null`, `codexCoreEntered: boolean`

---

### §DUNGEON-01-G. Lab Report Gate

Write `lab-report-dungeon-ten-themes.md` before implementing any of the above. Report must lock:

1. Which themes are P1 (low-hanging, existing infrastructure) vs P3+ (require new nodes/systems)
2. Node MM (Mimic Meadows) data shape: `WORLD_DB` entry, monster keys, `passive` flag implementation
3. Tribble multiplication mechanic: how `tribbleCount` interacts with inventory slots
4. Madness Table: confirm flavor-only (no mechanical penalties) vs allowing light penalties
5. `voidFluxActive` inversion logic: where in `storyRollAttack()` to insert, how to avoid breaking existing condition item calculations
6. Prior Carrier NPC: confirm this is a separate entity from any existing NPC; does not share state with player
7. Codex Core Chamber choice room: confirm "Destroy" and "Claim" paths do not break the existing ending system (`_missionComplete()` requires `catKingDefeated + sevenShards`)

---

## §DUNGEON-02 — Five-Act Arthurian Quest Elaborations (10 + Framework)

**Source:** §DUNGEON-01 themes + Chrétien de Troyes structural analysis from §RESEARCH-01  
**Status:** ✅ Complete — Layer 81 (2026-05-26). All 10 chains live. D02-06 (WK node) + D02-08 (MM node) implemented. See `quest.md` for register.  
**Structure:** Each quest has 5 acts. Every act is tagged **[Story Skill Check]** or **[Story Gating Battle]**. No permanent fail — retryable until pass. Final act is always the story-driving Ceremonia Roll.

**Act label conventions:**
- **[Story Skill Check]** — Ceremonia Roll; retry gate is one day advance. Story pauses here until pass.
- **[Story Gating Battle]** — Must win combat to proceed. No fail state; player respawns at checkpoint; quest remains active.
- **[Story-Driving]** — Final act only. Ceremonia Roll that closes the quest emotionally. Always retryable, but each fail generates a unique flavor line.

**Five-act template (Chrétien de Troyes pattern):**

| Act | Arthurian parallel | Mechanic | Named for |
|-----|--------------------|---------|-----------|
| I | Encounter / The Object appears | Skill Check DC Easy | The object's first form |
| II | Complication / The Test | Skill Check DC Medium | The object under pressure |
| III | The Ordeal | Gating Battle | The object at risk |
| IV | The Cost / Recognition | Skill Check DC Medium-Hard | The object changed |
| V | The Seal / Return | Story-Driving Skill Check | The object in its final meaning |

---

### §D02-01 — "The Drowned Page" (Quest: Abyssal Scriptorium Approach)

**Location:** AT — Abyssal Scriptorium (EB cluster approach)  
**Object travels:** A drowned manuscript page — Froberger's handwriting, waterlogged, still legible  
**Chrétien parallel:** Lancelot — the scholar chose the wrong path (the page was never sent); now it must be recovered by someone who will do what Froberger could not

---

**Act I — "The Page Afloat"** `[Story Skill Check]`

> *The entrance to the Scriptorium is three inches of ink-black water. Something floats at the surface — a page, face-up, as if placed.*

Roll: INT (Investigation) DC 10 — recognize Froberger's handwriting.  
**Pass:** You carry the page forward. It becomes your compass through the dungeon.  
**Fail:** Retry next room. The page floats there. It will wait.

---

**Act II — "The Flooded Chamber"** `[Story Skill Check]`

> *The second room is deeper. Something moves under the surface — not fast, not hostile. Just present.*

Roll: DEX (Stealth) DC 12 — cross without disturbing the water.  
**Pass:** The thing below does not surface. You reach the door.  
**Fail:** `voidPressure +1`. Retry — the thing resettles. Try again.

---

**Act III — "The Archivist's Guardian"** `[Story Gating Battle]`

> *A Scholar King construct stands between the archives and you. It does not speak. It attacks because it was built to. The page in your hand flickers — it recognizes something it cannot act on.*

Battle: AC 16 / HP 40. Must defeat to reach the central archive.  
**Win:** The construct falls. The page stops flickering. The archive door opens.

---

**Act IV — "The Reading"** `[Story Skill Check]`

> *The page is now fully legible in the archive's light. It was always complete. The water preserved it.*

Roll: INT (Arcana) DC 13 — decode the Scholar King cipher on the page.  
**Pass:** The Shard's location is confirmed. The page dissolves — it was always meant to be read exactly here.  
**Fail:** `voidPressure +1`. Retry — the cipher reshuffles but stays readable.

---

**Act V — "The Librarian's Question"** `[Story-Driving Skill Check]`

> *A voice from the walls — the Scholar King's recorded question, echoing since the archive was sealed. It has been asking this for three centuries. You are the first person to hear it who could answer.*

Roll: CHA (Persuasion) DC 14 — "What are you here to preserve?"  
**Pass:** The Shard room unlocks peacefully. `scriptorium_approach_complete: true`.  
**Fail flavor:** *"The archive has heard that answer before. It didn't work then either."* Retry next visit.

---

### §D02-02 — "The Extended Hand" (Quest: The Codex Inquisitor)

**Location:** WM — Weimar lower archive (behind `wmLowerArchiveUnlocked` gate)  
**Object travels:** The construct's outstretched hand — extended for three centuries, waiting  
**Chrétien parallel:** Erec — the formal encounter that starts the arc; sitting across from someone who knows your worth before you do

---

**Act I — "The Handshake"** `[Story Skill Check]`

> *The Inquisitor's hand has been extended since the archive was sealed. Three centuries. Whoever shakes it must be willing to be questioned. The chair is on the other side of the desk.*

Roll: CHA (Persuasion) DC 10 — volunteer to be the one who sits.  
**Pass:** You shake the hand. The construct activates.  
**Fail:** The construct waits. It will wait another three centuries. Try again.

---

**Act II — "The First Two Questions"** `[Story Skill Check]`

> *"Name someone you helped." Then: "Name something you sacrificed." The construct reads your state — it knows if you're lying.*

Roll: WIS (Insight) DC 12 — answer truthfully (answers must match `npcFavorability` and `defeatedBattles` state).  
**Pass:** "Acknowledged." The third question prepares.  
**Fail (lie detected):** 10 psychic damage. *"The record disagrees."* Retry with honest answer.

---

**Act III — "The Construct's Patience"** `[Story Gating Battle — triggered by two lies]`

> *If honesty fails twice, the Inquisitor's patience ends. It was built to protect the archive, not to be deceived.*

Battle: AC 14 / HP 30. Only triggered by repeated dishonesty. Defeating it opens the door; the third question is waived — but `inquisitorPassed` remains false.  
**Win:** Passage granted. The hand goes still.

---

**Act IV — "The Third Question"** `[Story Skill Check]`

> *"Why are you still here after everything?" There is no wrong answer. The construct measures conviction, not content.*

Roll: CHA (Persuasion) DC 12 Ceremonia Roll.  
**Pass:** The door opens. Archive key acquired. `inquisitorPassed: true`.  
**Fail:** *"You'll need to mean it."* Retry next day.

---

**Act V — "The Record"** `[Story-Driving Skill Check]`

> *Inside the archive, a record book lists every prior applicant. The handshake is on each page — the same extended hand, different grips.*

Roll: INT (Investigation) DC 13 — find your own entry in the record.  
**Pass:** It is there. Dated before you arrived. *"The Codex knew."* The Prior Carrier's cell is in the next room.  
**Fail flavor:** *"Your page is here but it's blank. You'll fill it in by the time you leave."*

---

### §D02-03 — "The Worn Boots" (Quest: The Prior Carrier)

**Location:** WM cell — behind the Inquisitor's archive  
**Object travels:** The Prior Carrier's worn boots — identical to yours in every detail  
**Chrétien parallel:** Yvain — the promise broken across a loop; the knight who must return under a name not yet re-earned

---

**Act I — "The Cell"** `[Story Skill Check]`

> *The cell door is locked from the inside. The lock is on their side. This is not imprisonment. This is choice.*

Roll: WIS (Perception) DC 10 — notice the lock placement before knocking.  
**Pass:** You knock. They look up.  
**Fail:** You try the door first — it doesn't open. Look again.

---

**Act II — "The Question"** `[Story Skill Check]`

> *"Did the Void open again?" Their eyes are tired but the question is precise. They have asked it before. They will ask it again.*

Roll: CHA (Persuasion) DC 11 — answer truthfully (matches actual `voidPressure` state).  
**Pass:** They nod. They begin to speak.  
**Fail:** *"You don't know yet. Come back when you do."* Retry after `voidPressure` updates.

---

**Act III — "The Outrider"** `[Story Gating Battle]`

> *A Void Outrider has been tracking the Prior Carrier. It breaks through the archive wall. The Carrier does not fight — they have already done this. They watch.*

Battle: AC 14 / HP 35. Must defeat to protect them.  
**Win:** The Outrider collapses. *"Thank you,"* the Carrier says, which is not nothing.

---

**Act IV — "The Token"** `[Story Skill Check]`

> *"Take this." The token is worn smooth. It is not a gift. It is the thing they carried when they last stood where you are standing.*

Roll: WIS (Insight) DC 12 — understand what the token is before accepting.  
**Pass:** `priorCarrierSpoke: true`. The token means: you are not the first, and the one before you was not the first either.  
**Fail:** You take it anyway. `priorCarrierSpoke: false`. The distinction matters later.

---

**Act V — "The Name"** `[Story-Driving Skill Check]`

> *They say your name. Not your title. Your actual name. They should not know it. You gave it to no one here.*

Roll: CHA (Persuasion) DC 13 — "How do you know that?"  
**Pass:** *"I was you. Before the last time."* `priorCarrierSeen: true`. The blank journal page is no longer blank.  
**Fail flavor:** *"You're not ready to hear that answer."* Come back after advancing one act in the main quest.

---

### §D02-04 — "The Journal Entry" (Quest: The Memory Gate)

**Location:** CO approach — Catacombs corridor  
**Object travels:** A specific journal entry — found, carried, offered  
**Chrétien parallel:** Cligès — the Anti-Tristan move; refusing the tragic cost; choosing to pay voluntarily rather than have it taken

---

**Act I — "The Runes"** `[Story Skill Check]`

> *The gate's inscription is not a threat. It is an offer. There is a difference.*

Roll: INT (Arcana) DC 10 — read the inscription before agreeing to anything.  
**Pass:** You understand the full price before committing. *"A memory given freely passes. A memory taken by force costs more."*  
**Fail:** You don't read it fully. You can still pay the toll, but without the context.

---

**Act II — "The Choice"** `[Story Skill Check]`

> *The gate reads intent. Not what you say — what you hold toward it.*

Roll: WIS (Insight) DC 12 — identify a journal entry you are willing to lose.  
**Pass:** The gate accepts the choice without taking it yet. The entry glows in your pack.  
**Fail:** The gate refuses unclear intent. Retry when you know which entry to offer.

---

**Act III — "The Guardian"** `[Story Gating Battle — bypass path]`

> *The guardian is not blocking the toll. It is the toll for those who refuse to pay. The bypass is harder than the price.*

Battle: AC 15 / HP 45. Defeat opens the gate without the memory cost — but `memorGateBypassUsed: true` affects the Act V room.  
**Win:** Gate opens. You paid nothing and lost something harder to name.

---

**Act IV — "The Payment"** `[Story Skill Check — toll path only]`

> *The gate says nothing. It takes the memory and is done. The entry is gone from your journal. What remains is the gap.*

Roll: CHA (Persuasion) DC 13 — "I give this freely."  
**Pass:** Entry removed from `journalEntriesRead`. Passage opens. The gate says nothing.  
**Fail:** *"That was not free."* Try again. The gate waits.

---

**Act V — "The Other Side"** `[Story-Driving Skill Check]`

> *A small room. A single chair. Something left here by whoever paid last.*

Roll: INT (Investigation) DC 12 — examine the room.  
**Pass:** Another journal entry — from someone else's run. Left here. `memorGatePassedEntry: true`.  
**Fail flavor (bypass path):** The room is empty. The chair is for the person who paid.

---

### §D02-05 — "The Chalk Mark" (Quest: The Void Fracture Maze)

**Location:** BK — Void Shaman's Sanctum approach  
**Object travels:** A chalk mark scratched on the first wall entering the maze  
**Chrétien parallel:** Lancelot and the cart — you enter knowing it will cost you; the mark is the commitment to return

---

**Act I — "The Mark"** `[Story Skill Check]`

> *Before entering, you scratch an orientation mark on the first wall. The maze will try to erase it. You are betting that it can't.*

Roll: DEX (Sleight of Hand) DC 10 — the mark holds through the first shift.  
**Pass:** One of three required checks auto-complete (`mazeSolvedChecks: 1`).  
**Fail:** The mark smears. Start with zero checks.

---

**Act II — "The First Shift"** `[Story Skill Check]`

> *The walls begin to move. A d6 rolls 5. New positions. The chalk mark is somewhere behind you.*

Roll: WIS (Survival) DC 14 — maintain orientation through the rotation.  
**Pass:** `mazeSolvedChecks: 2`. The mark becomes visible again from the new angle.  
**Fail:** Looped back to maze entrance. Mark still visible. Retry.

---

**Act III — "The Construct"** `[Story Gating Battle]`

> *The construct patrols the maze's center. While it lives, the maze does not shift. Its presence stabilizes the architecture. Defeating it is, paradoxically, the only way to end the maze's coherence.*

Battle: AC 15 / HP 40. Defeat auto-completes the third check (`mazeSolvedChecks: 3`). The maze recognized the act as orientation.  
**Win:** Three checks. Maze stabilized. Boss room visible.

---

**Act IV — "The Last Shift"** `[Story Skill Check — if maze shifts post-battle]`

> *One last rotation before the maze accepts its defeat. A final d6: 6.*

Roll: INT (Arcana) DC 14 — read the void runes on the final panel.  
**Pass:** You move through without losing the path.  
**Fail:** One more loop. The chalk mark is still there. The maze is almost done.

---

**Act V — "The Exit"** `[Story-Driving Skill Check]`

> *The boss room door is visible. The maze makes one last attempt — the final wall segment begins to close.*

Roll: STR/DEX (Athletics) DC 12 — dash through before it locks.  
**Pass:** Through. `voidMazeEntered: true`. The chalk mark is on the other side of the wall now.  
**Fail flavor:** *"The wall closes. The chalk mark is on the wrong side. You can still see it."* Retry immediately — no day gate on Act V.

---

### §D02-06 — "The Blueprint Roll" (Quest: The Scholar King's Workshop)

**Location:** Node SW — Scholar King's Workshop (new optional node, WM.S or CO.W)  
**Object travels:** A blueprint roll — the original architectural plans for Commander Auros's armor  
**Chrétien parallel:** Erec and Enide — the hero in domestic repose discovers the stakes were always higher than the household; the armor was made here; the maker was already gone

---

**Act I — "The Dusty Table"** `[Story Skill Check]`

> *The workshop has not been touched. The blueprint roll is on the table as if the Scholar King stepped out to get tea and never returned.*

Roll: INT (Investigation) DC 10 — confirm this is the right blueprint.  
**Pass:** You recognize Commander Auros's armor system. This is where she was made. The workshop is her origin.  
**Fail:** Retry — keep searching the table.

---

**Act II — "The Prototype"** `[Story Skill Check]`

> *A half-finished wand on the shelf. The creator ran out of time.*

Roll: WIS (Perception) DC 11 — assess stability.  
**Pass:** `Scholar King's Prototype Wand` added (single use, 2d6 force).  
**Fail:** The wand sparks. Leave it. Return next day if desired.

---

**Act III — "The Spirit"** `[Story Gating Battle — triggered by second short rest]`

> *After two short rests, footsteps from below. The Scholar King Spirit does not want a fight. But it is not accustomed to visitors, and discomfort, in spirits, looks a great deal like hostility.*

Ceremonia Roll CHA DC 12 — "I'm not here to take anything."  
**Pass:** No battle. Spirit speaks. Act IV proceeds with full lore.  
**Roll fail / combat chosen:** AC 12 / HP 25. Defeat the spirit — lore lost; skip to Act V with `spiritDefeated: true`.

---

**Act IV — "The Blueprint's Secret"** `[Story Skill Check]`

> *The Spirit points to a specific fold in the blueprint roll. The left pauldron joint. Where the original design was never completed.*

Roll: WIS (Insight) DC 13 — understand the implication for the CO boss fight.  
**Pass:** `aurosBlueprintKnown: true`. In the CO boss fight, Auros's left pauldron has -4 AC (her armor was never finished there).  
**Fail (or spirit defeated):** No knowledge gained. The blueprint roll is still useful as lore, but the mechanical advantage is lost.

---

**Act V — "The Name on the Cover"** `[Story-Driving Skill Check]`

> *As you leave, you look at the blueprint roll's cover. Your name is on it. Not written now. Written into the original paper, three centuries ago, in the Scholar King's hand.*

Roll: CHA (Persuasion) DC 13 — accept what this means.  
**Pass:** `scholarWorkshopComplete: true`. The Prior Carrier connection fires: you designed this. You designed her.  
**Fail flavor:** *"You fold the cover back and pretend you didn't see it. The paper does not pretend back."*

---

### §D02-07 — "The Maintenance Plate" (Quest: Neon Undercity Madness Gate)

**Location:** CY — Neon Undercity (first visit only; NG+ variant)  
**Object travels:** A copper maintenance plate — Scholar King cipher, dated 300 years ago  
**Chrétien parallel:** Yvain's lion — the beast that follows after the madness; the data wraith is the serpent; your recognition of the plate is the rescue

---

**Act I — "The Plate"** `[Story Skill Check]`

> *First entry to CY. The neon is loud. The plate on the wall is quiet. Dated three centuries ago. Scholar King cipher. You should not be able to read this.*

Roll: WIS (Perception) DC 10 — notice the plate before the ambient overwhelms you.  
**Pass:** You see it. It is there.  
**Fail:** Your attention is pulled by the neon. Retry — the plate doesn't move.

---

**Act II — "The Madness Save"** `[Story Skill Check]`

> *CY's aesthetic makes no sense. A fantasy city should not have neon. You have been here before. You don't know when.*

Roll: WIS saving throw DC 12.  
**Pass:** Clarity. This is Scholar King infrastructure — copper wiring, bioluminescent void growth. The data wraiths are corrupted maintenance programs.  
**Fail:** Madness Table d10 fires (flavor hcard only, no mechanical penalty). Both results leave the plate visible.

---

**Act III — "The Data Wraith"** `[Story Gating Battle]`

> *The Data Wraith investigates the plate at the same moment you do. It is drawn to the cipher. So are you. There is only one plate.*

Battle: AC 14 / HP 30. Must defeat to examine the plate safely.  
**Win:** The Wraith dissolves. The plate is yours to read.

---

**Act IV — "The Cipher"** `[Story Skill Check]`

> *The maintenance log names the original builder. The name is a Scholar King designation that matches a fragment Froberger held.*

Roll: INT (Arcana) DC 13 — decode the log.  
**Pass:** `cyMaintenanceDecoded: true`. The builder designation matches a cipher fragment from Froberger's Journal (Entry 17 or 29 if read).  
**Fail:** The cipher scrambles. Retry next day.

---

**Act V — "The Name on the Log"** `[Story-Driving Skill Check]`

> *The builder's designation, fully decoded, translates to a name in the Scholar King's naming convention. It is yours — not your current name, but the name you had before.*

Roll: CHA (Persuasion) DC 12 — accept or reject the implication.  
**Pass:** `cyOriginKnown: true`. `Scholar King's Name Plate` added to inventory (flavor item, cannot be sold). The Neon Undercity is, in a very specific sense, yours.  
**Fail flavor:** *"The translation is inconclusive. This is the most comfortable explanation available to you."*

---

### §D02-08 — "The Dropped Coin" (Quest: The Mimic Colony)

**Location:** Node MM — The Mimic Meadows  
**Object travels:** A small shiny coin — dropped by the first baby chest mimic, carried through all five acts  
**Chrétien parallel:** Erec and Enide (the vavasor's daughter) — beauty and intelligence recognized in a setting of apparent lowliness; the mimic colony is not low, it is simply misread

---

**Act I — "The Coin"** `[Story Skill Check]`

> *A baby chest mimic runs past and drops a coin. It is watching to see what you do with it.*

Roll: WIS (Animal Handling) DC 10 — pick it up gently, visibly, without pocketing it.  
**Pass:** The baby mimic pauses. It watches. `mimicColonyEntered: true`.  
**Fail:** You pocket the coin. The baby mimic hisses once and runs. Retry — put the coin back down first.

---

**Act II — "The Bookshelf"** `[Story Skill Check]`

> *A bookshelf mimic naps in the corner. A Fuzzy Tribble is balanced on its top shelf, asleep. This is apparently a normal arrangement.*

Roll: WIS (Animal Handling) DC 12 — approach the napping mimic without waking it.  
**Pass:** You sit near it. It opens one eye. It goes back to sleep. A Fuzzy Tribble rolls off and lands near your foot. `tribbleCount: 1`.  
**Fail:** It hisses — 2 psychic damage. Try again.

---

**Act III — "The Mother Mimic"** `[Story Gating Battle — if any mimic provoked]`

> *The Mother Mimic is the size of a treasure chest that has been thinking about it for a very long time. She does not attack unless something she considers hers is threatened.*

Battle triggers only if a mimic was attacked: AC 16 / HP 60.  
**Win:** She retreats. The colony resettles. The coin is still in your hand.  
**No battle path:** If no mimics were harmed, skip to Act IV directly.

---

**Act IV — "The Feeding"** `[Story Skill Check]`

> *The Mother Mimic watches you. The coin the baby dropped is still in your hand. You have been carrying it through this whole place.*

Roll: WIS (Animal Handling) DC 14 — return the coin to the baby mimic, in front of the Mother.  
**Pass:** The baby mimic takes the coin to the Mother. She opens her chest lid and gives you `Mimic's Cache` (rare item + 3 Fuzzy Tribbles). `tribbleGladesFed: true`.  
**Fail:** The Mother closes her lid. Retry tomorrow — she is patient.

---

**Act V — "The Name"** `[Story-Driving Skill Check]`

> *The baby chest mimic follows you toward the exit. It is not following you. It has decided you are interesting and has adjusted its route accordingly.*

Roll: CHA (Persuasion) DC 10 — accepting the pet.  
Text prompt: player names the mimic → `mimicPetName` set.  
**Pass:** `Baby Mimic` item added. *"It has decided you are acceptable. You are unsure when you decided the same."*  
**Fail flavor:** *"It follows anyway. You just haven't acknowledged it yet."*

---

### §D02-09 — "The Spell Scroll" (Quest: The Void Flux Chamber)

**Location:** AT (Abyssal Scriptorium mid-chamber) or CY_VOID (deepest relay)  
**Object travels:** A spell scroll in the player's pack — enters the chamber, exits changed  
**Chrétien parallel:** Cligès and Fenice — the thing that comes out of the experience is not the same as what went in; the self that emerges from the inversion is the Anti-Tristan move

---

**Act I — "The Entry"** `[Story Skill Check]`

> *The room hums at a frequency that isn't sound. The spell scroll in your pack begins to glow wrong.*

Roll: INT (Arcana) DC 10 — recognize the inversion field before casting anything.  
**Pass:** `voidFluxActive: true` registered. You will not cast by accident.  
**Fail:** Your next action misfires once (condition item effect inverted). You recognize it after.

---

**Act II — "The Immunization"** `[Story Skill Check]`

> *You have a brief window before combat begins to choose which rule you refuse to follow.*

Roll: INT (Arcana) DC 12 — choose one inversion to immunize against.  
**Pass:** Your chosen immunity applies. One spell effect behaves normally.  
**Fail:** All inversions apply this combat. The field does not negotiate.

---

**Act III — "The Chamber's Guardians"** `[Story Gating Battle]`

> *Three Void-flux constructs. They were built inside the inversion field. They do not find it confusing.*

Battle: 3× AC 14 / HP 20 each. The inversion field is active — use immunized spell normally; all others invert.  
**Win:** `voidFluxCleared: true`.

---

**Act IV — "The Scroll"** `[Story Skill Check]`

> *After the battle, the scroll in your pack has been changed by the field. It is still the same scroll. It is also something else.*

Roll: INT (Arcana) DC 13 — safely stabilize the changed scroll.  
**Pass:** The scroll now holds both its original spell AND its inverted variant — dual-use, single use. `voidFluxScrollChanged: true`.  
**Fail:** The scroll stabilizes back to its original form only. The change was lost.

---

**Act V — "The Exit"** `[Story-Driving Skill Check]`

> *The field collapses. Thirty seconds. The room returns to normal physics, which in this context is an event.*

Roll: DEX (Acrobatics) DC 12 — dash through before the rebound wall closes.  
**Pass:** You exit with the changed scroll. `voidFluxActive: false`. The scroll whispers in your pocket.  
**Fail flavor:** *"The wall closes. You are inside the rebound. The scroll chooses one form. You have fifteen seconds before the next opening."* Retry immediately.

---

### §D02-10 — "The Seventh Shard" (Quest: The Loop Heart, Codex Core Chamber)

**Location:** CO — pre-boss Codex Core Chamber  
**Object travels:** The seventh Shard — visible inside the pulsing column; the thing the loop was built to carry  
**Chrétien parallel:** Lancelot — the two-step hesitation; the choice in this room is the measure of how completely you have committed

---

**Act I — "The Hum"** `[Story Skill Check]`

> *The chamber hums at the frequency of something that has been running for centuries without maintenance. Every step echoes like a heartbeat — not yours.*

Roll: WIS (Perception) DC 10 — sense how many times this room has been entered before.  
**Pass:** You know the number. `codexCoreEntered: true`.  
**Fail:** You enter without knowing. The number is there either way.

---

**Act II — "The Three Paths"** `[Story Skill Check]`

> *Inscribed on the column base: three sets of instructions. Each clear. Each honest about its cost.*

Roll: INT (Arcana) DC 12 — read and understand all three costs before choosing.  
**Pass:** You see: Stabilize (standard, Auros fight), Destroy (STR DC 15, curseScore +5, Auros freed), Claim (CHA DC 17, surge +2, void +3, Auros fight required).  
**Fail:** The inscription is partially obscured. You choose without full information — the choice is valid; the cost may surprise you.

---

**Act III — "Commander Auros"** `[Story Gating Battle — Stabilize and Claim paths]`

> *She is not protecting the Codex. She is part of the Codex's seal. She does not know this. When she attacks, she is executing a Scholar King failsafe that has been running in her bones for thirty years.*

Battle: AC 22 / HP 300 / ATK +12.  
**Destroy path bypass:** STR Ceremonia Roll DC 15 — smash the housing before she can respond. Pass: no battle. `curseScore +5`.  
**Win (Stabilize/Claim):** Auros falls. The seal releases her. She will be someone else when she wakes.

---

**Act IV — "The Cost"** `[Story Skill Check]`

> *The choice has been made. Now it must be accepted.*

**Stabilize path:** WIS (Insight) DC 12 — *"Accept that it will open again."* Pass: standard ending proceeds.  
**Claim path:** CHA (Persuasion) DC 17 Ceremonia Roll — assert full ownership. Pass: `surgeCharges +2`, `voidPressure +3`.  
**Destroy path:** No check. `curseScore +5` already paid.  
**Fail (Claim or Stabilize):** *"Not yet."* Retry next day.

---

**Act V — "Sweelinck's Last Question"** `[Story-Driving Skill Check]`

> *Sweelinck's Last Question fires. One final Ceremonia Roll — the question determined by your curse score and mission state. You have carried the Shard this far. The loop closes here, or it does not.*

Roll: CHA (Persuasion) DC 12 — answer the question honestly. Any true answer passes.  
**Pass:** `codexCoreChosen` set. Victory sequence fires. The loop heart closes.  
**Fail flavor:** *"The question waits. It has waited before. It will wait until you mean it."*  
**Prior Carrier connection (if `priorCarrierSeen`):** *"The blank page is not blank. The Prior Carrier left their answer here. You are leaving yours."*

---

### §D02-11 — The Five-Act Arthurian Quest Framework

**Purpose:** A design template for all future quests in The Shattered Codex — applicable to any new quest, EB approach, romantic arc, or skill check chain.

**The core argument:** Every quest in The Shattered Codex is a Chrétien de Troyes romance in miniature. The player is always Lancelot choosing the cart, or Yvain breaking the promise, or Erec sitting across from Enide at the vavasor's table. The object that travels through the quest's five acts is the emotional anchor — the thing that cannot be named directly, carried instead through five different forms.

---

**Structural rules:**

1. **Name the quest for its object, not its goal.** "The Drowned Page" not "Retrieve the Archive Key." The object is what travels; the goal is what closes.

2. **Tag every act.** `[Story Skill Check]` or `[Story Gating Battle]`. No unmarked acts. Players always know what kind of moment they are in.

3. **No permanent fail.** Every check is retryable. The retry gate (day advance, quest state change, or immediate) must be specified. The emotional cost of failing is the story — it generates flavor text, not a dead end.

4. **The battle is Act III.** The Ordeal is always in the middle. Acts I–II build toward it; Acts IV–V are its aftermath. Do not put the battle at Act I or Act V.

5. **Act V is always the story-driving skill check.** It closes the object's arc. The check is never purely mechanical — it asks the player to acknowledge something. It cannot be brute-forced by stats alone (CHA-based Ceremonia Roll is the default).

6. **Two perspectives per act (implied).** Even in a solo game, write the NPC's implied perspective into the vignette prose. *"She does not look up from the logbook"* — we do not need to be told what Yael is thinking. The gap between her action and yours is the emotion.

7. **The object must arrive changed.** By Act V, the object the quest was named for has changed form: the page dissolves, the coin is given back, the boots are recognized, the scroll whispers. The change is the evidence that something happened.

---

**Difficulty scaling by act:**

| Act | Check DC (Easy Quest) | Check DC (Mid Quest) | Check DC (Hard Quest) |
|-----|----------------------|---------------------|----------------------|
| I | 10 | 11 | 12 |
| II | 12 | 13 | 14 |
| III | Battle: AC 13/HP 25 | Battle: AC 15/HP 40 | Battle: AC 17/HP 55 |
| IV | 12 | 14 | 15 |
| V | 12 | 14 | 16 |

**Quest type pairings (what kinds of checks belong to what arcs):**

| Arc type | Act I | Act II | Act IV | Act V |
|----------|-------|--------|--------|-------|
| Romantic/social | CHA Persuasion | WIS Insight | CHA Persuasion | CHA Persuasion |
| Exploration/discovery | WIS Perception | INT Investigation | INT Arcana | INT History |
| Physical/dungeon | WIS Perception | DEX Stealth | STR Athletics | DEX Acrobatics |
| Combat/ordeal | INT Investigation | WIS Survival | WIS Insight | CHA Persuasion (final acceptance) |

**The last line of every Act V vignette prose block should pass through the object:**

> *The page dissolves.* (D02-01)  
> *The hand goes still.* (D02-02)  
> *The blank page is not blank.* (D02-03)  
> *The gap where the memory was.* (D02-04)  
> *The chalk mark is on the other side of the wall.* (D02-05)  
> *The blueprint roll knew you were coming.* (D02-06)  
> *The Neon Undercity is yours.* (D02-07)  
> *It has decided you are acceptable.* (D02-08)  
> *The scroll whispers.* (D02-09)  
> *The loop heart closes.* (D02-10)

---

## §XLIII — Hunt Overhaul: Target Selector + WIS Survival Check

**Status:** ✅ Implemented — Layer 82 (2026-05-26)  
**Scope:** `storyStalk()` · `storyRenderInfoRow()` · new `_huntSurvivalRoll()` · stalk modal redesign  
**Motivation:** Hunting currently gives no player control over the target and does not use any stat. Clicking Hunt opens a modal with "Wait for Prey" — random weighted pick, no input. This redesign adds a monster target selector, a WIS Survival check as the hunt resolution, a time economy choice, and surprise advantage as the reward for skilled hunting.

---

### §XLIII-A. Time Economy — Two Hunt Modes

| Mode | Time Cost | How | Outcome |
|------|----------|-----|---------|
| **Targeted Hunt** | 1h hunt + 1h battle = **2h** | Select target → roll d20+WIS vs DC → preferred encounter | Pass: exact target + `surpriseAdvantage`. Fail: random encounter, no advantage |
| **Rush In** | 1h battle only = **1h** | Skip hunt → immediate random encounter | `_weightedMonsterPick`, no `surpriseAdvantage` |

The **Hunt button** in the stalk info-row card changes to open the target selector inline (not modal). A separate **Rush In** button triggers the old `storyQuickWait` path immediately.

---

### §XLIII-B. Target Selector UI

Replaces the stalk modal. Rendered inline below the Stalk section card (accordion-style, same pattern as NPC talk accordion).

**Layout:**

```
┌─ STALK ────────────────────────────────────────┐
│ 🎯 [terrain name]            2h   [Select Target ▾]  [Rush In 1h] │
└────────────────────────────────────────────────┘
  ↓ expanded accordion:
  ┌──────────────────────────────────────────────┐
  │ QUEST TARGETS IN THIS TERRAIN                │
  │  ◈ Beefy Tom ⚔ medium   AC13/HP60   DC 12   │
  │  ◈ Honcho Cat ⚔ hard    AC15/HP80   DC 14   │
  │ ALL MONSTERS HERE                            │
  │  ○ Alley Thug ⚔ easy    AC10/HP22   DC 10   │
  │  ○ Stray Cat  ⚔ trivial  AC8/HP12    DC  8   │
  │  ...                                         │
  │                                              │
  │  [selected: Beefy Tom]  WIS check DC 12      │
  │  d20 + WIS mod (+1) = vs DC 12               │
  │  [🎯 Hunt (2h) — Roll Survival]              │
  └──────────────────────────────────────────────┘
```

**Data population:**
- Header group **"Quest Targets"**: monsters from `_getQuestTargetKeys()` intersected with `WORLD_DB[node.name].monsters`
- Body group **"All Monsters"**: full `WORLD_DB[node.name].monsters` list, excluding duplicates already in quest group
- Each row shows: name · tier badge · AC · HP · Survival DC
- Clicking a row selects it (highlight); shows DC + WIS modifier below; unlocks Hunt button

**DC by tier:**

| Monster tier | Survival DC |
|---|---|
| trivial | 8 |
| easy | 10 |
| medium | 12 |
| hard | 14 |
| deadly | 16 |

---

### §XLIII-C. WIS Survival Check — `_huntSurvivalRoll(targetKey)`

```
roll   = d20 + wisModifier
wisModifier = floor((abilityScores.wis - 10) / 2)
pass   = roll >= DC[targetMonster.tier]
```

**On pass:**
- 1h deducted from time (`S_story.hour += 1`)
- `pendingBattle` set with the exact selected monster key
- `S_story.surpriseAdvantage = true` — ADV on first attack
- storyMsg: *"You read the ground. Tracks — fresh. You know exactly where it goes."*

**On fail:**
- 1h deducted (`S_story.hour += 1`)
- Fall back to `_weightedMonsterPick` — random encounter (no advantage)
- storyMsg flavor from a small table (see §XLIII-D)
- Player may abort after seeing the "you lost the trail" message — but time is already spent

**Roll display:** Show `d20 (N) + WIS mod (±N) = total vs DC N → PASS / FAIL` in the storyMsg, same pattern as `_rollCeremonia`.

---

### §XLIII-D. Fail Flavor Lines (5 entries, random)

1. *"The prints go cold. Whatever you were tracking changed direction an hour ago."*
2. *"Wind shift. It caught your scent before you caught its trail."*
3. *"You find the spot where it bedded. The grass is still warm. It's gone."*
4. *"Three parallel scratches on the bark. Warning mark. They warned each other."*
5. *"You wait in the right place at the wrong hour. Something else finds you."*

---

### §XLIII-E. Rush In Path

New **Rush In (1h)** button on the Hunt card (not inside the accordion).

- Calls `storyQuickWait(nodeCode)` directly — no changes to that function
- Does NOT deduct the extra hunt hour (battle deducts its own 1h via existing logic)
- No `surpriseAdvantage`
- Message: *"You walk straight in. Whatever's here will find you."*

---

### §XLIII-F. storyRenderInfoRow Changes

**Current Hunt card:**
```js
btn: 'Hunt', btnClass: 'btn-hunt', btnClick: () => storyStalk(node.code)
```

**New Hunt card:**
```js
// Two buttons — use hint row for Rush In; Hunt opens accordion
btn: 'Select Target', btnClass: 'btn-hunt', btnClick: () => _toggleHuntAccordion(node)
// Plus a second element: Rush In button appended to the card
```

The `storyStalk()` modal is retired. The `storyQuickWait()` function is preserved unchanged as the Rush In path. The stalk HTML modal (`#story-stalk-modal`) can remain but is no longer opened by any primary path (kept for legacy save compatibility).

---

### §XLIII-G. State Fields (new)

Add to `_S_DEFAULTS()`:

| Field | Type | Purpose |
|---|---|---|
| `huntSelectedTarget` | string\|null | Currently selected monster key in hunt selector |
| `huntLastSurvivalRoll` | number\|null | Last d20 survival roll total (for display) |

---

### §XLIII-H. Mechanics Doc Update

Update `mechanics-combat.md §Stalk / Hunt` to document:
- Three modes: Targeted Hunt (2h), Rush In (1h), Corridor Hunt (passive)
- Survival DC table
- WIS modifier formula
- Surprise advantage as the reward for successful targeted hunting
- Target selector behavior (quest targets flagged, DC shown per monster)

---

### §XLIII-I. Implementation Checklist

- [x] State is closure-scoped — no `_S_DEFAULTS` fields needed (inline roll, no persistence required)
- [x] Survival roll inline in monster row click handler (no named function needed)
- [x] Hunt accordion built in `storyRenderInfoRow` Hunt card `btnClick` closure
- [x] Hunt card button: 'Hunt' → 'Close' when open; accordion toggles
- [x] Pass path: `surpriseAdvantage = true`, exact monster `pendingBattle`, `loadWorldMonster(m)` → battle
- [x] Fail path: `_weightedMonsterPick` fallback + storyMsg flavor line
- [x] Monster rows: tier badge, name, AC, HP, DC — click to select and roll
- [x] Quest-target badge ◈ for monsters in `_getQuestTargetKeys()`
- [x] storyMsg roll display: `d20 (N) + WIS (±N) = N vs DC N → PASS/FAIL`
- [x] mechanics-combat.md hunt section ✅ 2026-05-26
- [x] Rush In button: `storyQuickWait(node.code)`, 1h, no survival check

---

## §XLIV — Accordion-First UI Pattern

**Layer:** 82  
**Status:** ✅ Implemented — 2026-05-26  
**Directive:** Every Story Mode button that currently opens a full-screen modal should expand an inline accordion below the triggering card instead. NPC Talk is the reference implementation (Layer 81 ✅).

### §XLIV-A. Design Principle

The Talk accordion proved the pattern: a smooth max-height CSS transition reveals context inline, keeping the user in the node view without a modal interrupt. The same pattern applies to every action that currently hijacks the screen.

**Rule:** Modals are for game-changing irreversible events only (battle itself, death, level-up, New Game). Pre-action UI — target selection, pre-battle options, stalk options — must be inline accordions.

### §XLIV-B. Targets

| Button | Current behavior | New behavior | Status |
|---|---|---|---|
| **Talk** | Opens `storyShowNpc()` modal | Accordion below NPC card | ✅ Live (Layer 81) |
| **Hunt / Select Target** | Opens stalk modal | Accordion below Hunt card (target selector) | ✅ Live (Layer 82) |
| **Fight / ⚔ Battle** | Opens full pre-battle screen modal | Accordion below Battle card | ✅ Live (Layer 82) |
| **Stalk (legacy)** | Opens stalk modal | Replaced by Hunt accordion | ✅ Live (Layer 82) |

### §XLIV-C. Battle Card Accordion

The Battle card's **Fight** button expands an inline accordion below the card. The accordion is a single setup panel — configure conditions and stealth, then hit Start Battle when ready.

**Row 1 — Enemy threat summary:**  
`[Tier badge] [Name] AC N · HP ~N · ATK +N`

**Row 2 — Optional setup toggles (horizontal, both default off):**

| Toggle | Effect when selected |
|---|---|
| 💣 Condition | Expands condition picker sub-row below (gold costs shown inline) |
| 🎭 Stealth | Marks stealth for inclusion at battle start; result resolves when Start Battle fires |

Neither toggle is required. Both can be skipped.

**Row 3 — Start Battle button (full-width):**  
`⚔ Start Battle` — fires with whatever is configured above.  
- If Condition selected: deducts gold, queues condition  
- If Stealth selected: rolls d20 vs random DC, shows result briefly (`d20 (N) vs DC N → PASS`), then opens battle  
- If neither: enters battle immediately

**Row 4 — Safe retreat link:**  
`← Retreat (safe)` — collapses accordion, no penalty.

The 💣 Condition sub-row lists affordable conditions only. If none affordable: dimmed hint text `"Conditions unlock as you earn gold. Cheapest: Feint Scroll at 1,000 gp."` No condition selected = no cost.

Stealth result display: shown for ~600ms inline before the battle screen opens. Pass gives you first initiative + ADV on first attack. Fail: no effect, no cost.

### §XLIV-D. CSS Spec

Reuse `.npc-talk-accordion` and `.open` CSS classes. Add `.battle-accordion` modifier for border color (dark red `#5c0a0a` for battle context vs orange-brown for NPC). No new transition definitions needed.

Condition sub-row uses a nested inner accordion (same pattern, max-height 180px).

### §XLIV-E. Behavior Rules

- Only one accordion open at a time per node render. Opening a second collapses the first.
- Accordion state is not persisted — re-render always starts collapsed.
- Clicking the Fight button again while accordion is open → closes it (toggle).
- Battle accordion closing via Retreat: `storyAutoSave()` is NOT called (no state change).
- Start Battle removes the accordion from DOM before the battle screen opens (avoids stale DOM behind overlay).

### §XLIV-F. Implementation Checklist

- [x] Battle card `btnClick` → inline accordion (closure, no named toggle function needed)
- [x] Accordion DOM: threat row, Condition + Stealth toggle buttons, condition sub-row, stealth result, Start Battle, Retreat
- [x] Condition toggle: `condSubrow.style.display` toggled; `_condSelected` Set tracked in closure
- [x] Stealth toggle: `_stealthOn` bool tracked in closure; roll fires at Start Battle click
- [x] Start Battle: sets `_preBattNode`, `_availableConds`, `_selectedConds` then calls `storyCommitBattle()`
- [x] Condition sub-row: all `CONDITION_ITEMS` shown; cant-afford hint if none affordable
- [x] Stealth result: inline div, 700ms delay before `storyCommitBattle()` fires
- [x] CSS: `.battle-accordion` (bg `#1c0404`, border `#5c0a0a` in dark theme), `.hunt-accordion` (same colors as NPC)
- [x] Toggle close: re-clicking Fight while open collapses accordion
- [x] `storyPreBattle()` modal kept as legacy path (used by quest card fight-now buttons + script event listeners)

---

## §XLV — Yugurt Tournament + Six Fishermen (PLANNED → Layer 83)

**Status:** ✅ Implemented — 2026-05-26  
**Source:** story.md line 832 — longest-standing PLANNED marker (Layer 47)

### §XLV-A. NPCs at Yugurt Cabin

Six fishermen are present at YC whenever the player has a Fishing Rod:

| Key | Name | Title | Competence | Cast Bonus | Stake |
|---|---|---|---|---|---|
| `pip` | Pip | The Kid | Novice | −1 | 50gp |
| `renard` | Renard Castwell | Accounting Dept. | Terrible | −3 | 75gp |
| `bog` | Bog Mudwhistle | Subsistence Fisher | Average | +1 | 150gp |
| `vera` | Vera Hookline | Sport Angler | Skilled | +3 | 300gp |
| `dirk` | Dirk Troutslap | Commercial Trawler | Expert | +5 | 600gp |
| `master` | The Fisherman | Master of Yugurt | God-tier | +8 | 1,500gp |

### §XLV-B. Tournament Mechanic

1. Each opponent is challenged via a **Challenge** accordion button at their card.
2. Both sides roll: `d20 + cast_bonus = catch_total → size_tier → random fish from tier → rank`
3. Highest fish rank wins. Tie → Luck Mod tiebreaker (NPC has Luck Mod 0).
4. Win: player gains stake gold + title + quest complete. Lose: player loses stake gold.
5. Each opponent can be beaten once (tracked in `S_story.yugurtTourBeat`).

**Cast Bonus mapping:**
- Player: current bait's `catchBonus`, or −3 for bare hook
- NPC: fixed bonus per competence tier (see table above)

**Catch total → size tier:** ≤5 → nothing (rank 0), 6–10 → small (1–4), 11–16 → medium (5–9), 17–19 → large (10–14), 20–21 → very\_large (15–19), 22+ → legendary (20)

### §XLV-C. Title Progression

| Beaten | Title Earned |
|---|---|
| Pip | Lake Apprentice |
| Renard Castwell | Local Angler |
| Bog Mudwhistle | Credible Fisher |
| Vera Hookline | Named Competitor |
| Dirk Troutslap | Lake Champion |
| The Fisherman | Master of Yugurt 🏆 |

Title stored in `S_story.yugurtTourTitle`. Shown in the tournament section header.

### §XLV-D. Quest Chain

| Quest ID | Title | Completes when |
|---|---|---|
| `quest_tour_01` | Pip's Challenge | `yugurtTourBeat.pip` |
| `quest_tour_02` | The Spreadsheet Casts | `yugurtTourBeat.renard` |
| `quest_tour_03` | Bog's Terms | `yugurtTourBeat.bog` |
| `quest_tour_04` | Vera's Rulebook | `yugurtTourBeat.vera` |
| `quest_tour_05` | Tonnage | `yugurtTourBeat.dirk` |
| `quest_tour_06` | The Fisherman's Tournament | `yugurtTourBeat.master` |

All 6 quests activate on first YC visit when Fishing Rod is in inventory.
XP: 100 / 150 / 200 / 300 / 500 / 1000 per quest.

### §XLV-E. State Fields

| Field | Default | Notes |
|---|---|---|
| `yugurtTourBeat` | `{}` | `{ pip:true, ... }` — beaten opponent keys |
| `yugurtTourTitle` | `null` | Current title string |

### §XLV-F. UI

Tournament section `🏆 Tournament` in `storyRenderInfoRow` at YC (after Rest, before World). Each card: `[COMPETENCE] Name · Title · Stake Ngp [Challenge]`. Beaten cards show `[BEAT] done:true`. Challenge button opens accordion with NPC quote, bait status, Cast button, result display, Walk Away link. Uses `hunt-accordion` CSS class. `_tourRoll(bonus)` helper function. After win: `storyRender(node)` called after 400ms to refresh beaten state.

### §XLV-G. Fishing Zone Unlock Gating *(✅ Implemented Layer 83)*

Zone access now gates progressively instead of all-open. Evaluated when Find Bait panel opens; auto-granted on the spot.

| Zone | Key | Unlock Condition |
|------|-----|-----------------|
| The Bank 🪨 | `shore` | Always open |
| The Reeds 🌿 | `reeds` | First catch (`fishingCatchLog.length >= 1`) |
| The Deep 🌊 | `deep` | Large+ fish landed (`fishingCatchLog.some(c => ['large','very_large','legendary'].includes(c.size))`) |

Locked buttons: `🔒` label, opacity 0.45, `disabled`, tooltip hint. Zone map (`bank→shore`, `reeds→reeds`, `shallows→deep`) bridges `BAIT_TABLES` keys to `tackleboxZoneUnlocks` keys. State auto-persists to `S_story.tackleboxZoneUnlocks`.

---

## §XLVI — Q-FISH-01: The Leviathan Class (✅ Implemented — Layer 84)

**Status:** ✅ Implemented 2026-05-26

Quest ID: `quest_fish_01`

| Field | Value |
|---|---|
| Title | The Leviathan Class |
| Type | `side` |
| Activates | YC visit; requires Fishing Rod in inventory + `fishingCatchLog.length > 0` |
| Completes | `fishingQuestFlags.landed15Plus === true` |
| XP | 750 |
| Gold | 200gp |
| Mechanic reward | `fishingYugurtFavour = true` → permanent +1 on all future catch rolls |
| Waypoint | YL |
| Disposition | *"You went deep."* — The Fisherman |

**Implementation:**
- `quest_fish_01` entry in QUEST_DB (after `quest_fishing_guide`)
- `castBtn.onclick` in `doCast()`: sets `fishingQuestFlags.landed15Plus = true` when `fish.rank >= 15 && !isBare`
- Completion handler in `storyCheckQuests`: `+200gp` + sets `fishingYugurtFavour = true` (dormant state field pre-wired to `+favBonus` in cast roll display)
- `fishingYugurtFavour` was already in `_S_DEFAULTS` and `doCast()` roll formula since Layer 47 but was never triggered — this quest wires the hook

---

## §XLVII — Horned Shark: Yugurt Lake Boss (✅ Implemented — Layer 85)

**Status:** ✅ Implemented 2026-05-27

| Field | Value |
|---|---|
| Monster | `horned_shark` — ac:15, hp:120, atk:10, dmgDie:8×2+8, tier:deadly |
| Quest ID | `quest_horned_shark` — *The Noon Point* |
| Activates | YL visit; requires `fishingYugurtFavour === true` |
| Completes | `hornedSharkSlain === true` (set in `battKillEvent`) |
| XP | 500 |
| Gold | 300gp |
| Waypoint | YL |
| Disposition | *"You got the shark. That's a different kind of fishing."* — The Fisherman |

**Implementation:**
- `horned_shark` in MONSTER_POOL + MONSTER_DROPS + `yugurt_lake` terrain + HUNTING_GROUNDS (*The Noon Point*)
- `hornedSharkSlain: false` in `_S_DEFAULTS()`
- `battKillEvent()`: sets `hornedSharkSlain = true` when `S.enemy.key === 'horned_shark'`
- NPC_DIALOGUE YC: static `quote` → conditional `quoteFn` pattern (renderer checks `_npcDial.quoteFn ? _npcDial.quoteFn() : _npcDial.quote`). Fisherman post-kill acknowledgment fires only if `hornedSharkSlain`

---

## §XLVIII — Night Fishing: Nocturnal Species + Eel Skin Pouch (✅ Implemented — Layer 86)

**Status:** ✅ Implemented 2026-05-27

**Mechanic:** `storyFishing()` reads `S_story.hour` on entry. If `hour >= 20 || hour <= 5`, night mode activates: header shows 🌙, lake text changes register, and `NIGHT_FISH_POOL` replaces `FISH_POOL` for medium/large tier catches.

| Field | Value |
|---|---|
| New pool | `NIGHT_FISH_POOL` — 5 species, ranks 6–14 (medium/large tier only) |
| Night detection | `isNight = (S_story.hour \|\| 12) >= 20 \|\| (S_story.hour \|\| 12) <= 5` |
| Fallback | If no night fish in tier range, falls back to `FISH_POOL` |
| Quest ID | `quest_night_eel` — *Night Water* |
| Activates | YL visit; requires `hornedSharkSlain === true` |
| Completes | `lanternEelLanded === true` (set in `battKillEvent` on `night_03` kill) |
| XP | 400 |
| Gold | 150gp |
| Item reward | Eel Skin Pouch (🏮, trinket) — sets `eelSkinPouchActive = true` → +1 Type on all future casts |
| Waypoint | YL |
| Disposition | *"Some fish don't exist in daylight."* — The Fisherman |

**Night Fish Pool:**

| Key | Name | Rank | Tier |
|-----|------|------|------|
| `night_01` | Murk Darter | 6 | easy |
| `night_02` | Void Gulper | 8 | easy |
| `night_03` | Lantern Eel | 10 | medium (quest target) |
| `night_04` | Shadowfin Carp | 12 | medium |
| `night_05` | Deepwater Lurker | 14 | hard |

**State fields added to `_S_DEFAULTS()`:** `lanternEelLanded: false`, `eelSkinPouchActive: false`

---

## §XLIX — The Shale Drop: Yugurt's Identity (✅ Implemented — Layer 87)

**Status:** ✅ Implemented 2026-05-27

**Summary:** A new node `YD` (The Shale Drop) opens west of YL when the player carries the Eel Skin Pouch. Inside: a fixed Cave Lurker encounter and, upon completion, the `Y. Gurt Field Survey` — a pre-Codex Scholar Kings document that names Yugurt as a First Circle Naturalist who chose the lake over the archive.

| Field | Value |
|---|---|
| New node | `YD` — act 3, num:77, E:'YL' return, battle: Cave Lurker |
| Gate | GATE_LOCKS YL→YD requires Eel Skin Pouch (msg: "The crack in the bank drops into darkness. You need a light.") |
| Monster | `cave_lurker` — ac:15, hp:88, atk:8, tier:hard (cave variant; distinct key from `night_05`) |
| Quest | `quest_shale_drop` — *The Shale Drop* |
| Activates | YL visit; requires `eelSkinPouchActive === true` |
| Completes | `shaleDropFound === true` (set in `battKillEvent` on `cave_lurker` kill) |
| XP | 300 |
| Gold | 250gp |
| Item reward | `Y. Gurt Field Survey` (📋 readable) — Pre-Codex Year 3 survey, signed "Y. Gurt, Nat. First Circle"; closes with: *"The request was not approved. I stayed anyway."* |
| Disposition | *"He doesn't react when you come back up. He already knew what was down there."* — The Fisherman |

**The reveal:** Yugurt is not the lake's name that became a man's name. He is Y. Gurt — a Scholar Kings naturalist who filed a formal request to remain at the lake instead of returning to the archive for classification review. The request was denied. He stayed anyway. The lake has been giving him data every morning since. He's still recording it.

---

## §L — Arc Close: Fisherman's Third Dialogue + Weimar Y. Gurt Connection (✅ Implemented — Layer 88)

**Status:** ✅ Implemented 2026-05-27

### §L-A. Fisherman's Arc Close

The `quoteFn` at YC now has three states (was two):

| Condition | Dialogue |
|-----------|----------|
| `shaleDropFound` | *Making tea. Sets a second cup on the windowsill — not the table. "First Circle used to say the archive outlasts the archivist." Drinks. "...Nice Day For Fishing. Yugurt."* |
| `hornedSharkSlain` | *Acknowledges the shark. "That's a different kind of fishing."* |
| default | *The continuous loop. Simply correct about the weather.* |

The third state resolves his arc: he uses "First Circle" without explanation. He does not acknowledge the survey. He does not explain himself. The second cup on the windowsill — for whoever is looking at the lake — is the only gesture he makes.

### §L-B. Weimar: The Open File (quest_wm_05)

| Field | Value |
|---|---|
| Quest | `quest_wm_05` — *The Open File* |
| Activates | SQ; requires `wmLowerArchiveUnlocked && Y. Gurt Field Survey in inventory` |
| Completes | `wmGurtFileRead === true` (set by reading the fifth archive document) |
| XP | 200 |
| Gold | 200gp |
| Disposition | *"We continue to file them."* — Scholar Kings Personnel Record, Y. Gurt (Field Absence: Ongoing) |

**Fifth archive document** appears in `_storyWmArchiveModal()` only when player carries the Y. Gurt Field Survey. Content: personnel file showing three unanswered follow-up correspondences, ongoing field absence classification, and a handwritten note from Isolde Voss: *"He is still there. I checked the lake last year. He is still there and the lake is fine. — I.V."*

**The full Yugurt arc resolves as:** rod → catches → zone unlocks → tournament (6 fights) → Leviathan Class (rank 15+, Yugurt's Favour) → Horned Shark → night fishing → Lantern Eel (Eel Skin Pouch) → Shale Drop (cave_lurker, Y. Gurt Field Survey) → Fisherman's third dialogue → Weimar archive (The Open File). The lake was always a field station. He never stopped working. The Scholar Kings never closed the file.

---

## §LI — Isolde Acknowledgment + Muffat: The Third Berth (✅ Implemented — Layer 89)

**Status:** ✅ Implemented 2026-05-27

### §LI-A. Isolde Voss: The Visit

One-time delivery in `_getNPCDialogue('isolde_voss')` when `wmGurtFileRead && !isoldeGurtAckDelivered`. Quote: *"The shore smells like cold stone and fish oil in the morning. He had a fire going when I arrived. He looked at me the way he looks at the water — checking whether something had changed. I filed the note when I got back. That is the only part that was protocol."*

She doesn't explain why she went. The shore smell, the fire, the way he looked at her — all detail. No commentary. She filed the note. That's the procedural frame around the personal thing she did.

### §LI-B. Muffat: The Third Berth (quest_muffat_01)

| Field | Value |
|---|---|
| Quest | `quest_muffat_01` — *The Third Berth* |
| Type | `skill_check` |
| Activates | DK; requires `_hasItem('Trade Seal')` |
| Check | DEX · Stealth · DC 13 · retryable (1 day gate) |
| XP | 150 |
| Gold | 150gp |
| Pass flag | `muffatBerthReached` |
| Disposition | *"There are three things on that berth that should not be there. The crate is one of them."* — Magistra Elara Muffat |

**Muffat's `quoteFn`** now has two states: before the berth, she gives the Act One/Act Two line. After, she reveals she's been collecting off-ledger Scholar Kings crates for two years. Three already on her shelf. Every six weeks. Someone decided these crates do not exist. *"The Scholar Kings do not make clerical errors. They make decisions."*

This opens `quest_muffat_02` (*The Distribution Pattern*) as a future layer — what's in the crates, who's been shipping them, and whether Muffat's collection is known to the Scholar Kings.

---

## §LII — Muffat: The Distribution Pattern (✅ Implemented — Layer 90)

**Status:** ✅ Implemented 2026-05-27

### §LII-A. The Connection

`quest_muffat_02` activates at DK once `muffatBerthReached` is set. The crate Muffat recovered carries a distribution reference: *Frequency 14.225* — delivery terminus: **Station 7, Frequency Row Monitoring Annex**. Station 7 went dark three months ago. Bertha No-Bank has been logging the changed absence in volume 41 without knowing what changed it.

### §LII-B. Bertha No-Bank: Changed Absence (quoteFn)

| State | Trigger | Quote |
|---|---|---|
| Default | Always | *"This is frequency 14.225. Nothing is on 14.225..."* Volume 42 begins tomorrow |
| Post-read | `muffatManifestRead` | *"Volume forty-one is when it changed. Not the signal — the absence..."* |

### §LII-C. Muffat: Three-State quoteFn

| State | Trigger | Content |
|---|---|---|
| State 1 | Default | *"The courier worked for me. That was Act One. Welcome to Act Two."* |
| State 2 | `muffatBerthReached` | Off-ledger crate pattern, two-year six-week schedule, Scholar Kings decisions |
| State 3 | `muffatManifestRead` | Station 7 / 14.225 convergence — *"Scholar Kings infrastructure does not produce coincidences. It produces decisions that look like coincidences."* |

### §LII-D. Readable Item

**Shipping Manifest (Intercepted)** — `📦` — lists origin (Tilbury third berth), destination (Station 7), contents (Category 4 monitoring equipment), frequency reference (14.225), six-week schedule. Margin annotations: one noting Station 7 went dark in Vol. 41. Second annotation in different hand: *"Station 7 was not decommissioned. —M.E.M."*

| Field | Value |
|---|---|
| Quest | `quest_muffat_02` — *The Distribution Pattern* |
| Activates | DK; requires `muffatBerthReached` |
| Completes | On `muffatManifestRead` (set in reward handler) |
| XP | 250 |
| Gold | 300gp |
| State flag | `muffatManifestRead` |
| Disposition | *"Volume forty-one is when the absence changed."* — Bertha No-Bank |

---

## §LIII — Station 7 (Dark) (✅ Implemented — Layer 91)

**Status:** ✅ Implemented 2026-05-27

### §LIII-A. Node S7

New node east of HM (r:3, c:18). GATE_LOCK: requires `Shipping Manifest (Intercepted)`. Equipment still running on emergency power. Receiver array still oriented toward subsurface. Transmission log on the desk, pen in the output tray, last entry mid-sentence.

The node text does not explain what happened. It documents what remains: indicators blinking, three months of unread output, a half-written sentence, a pen set with care by a person who expected to return.

### §LIII-B. Station 7 Transmission Log (Readable)

Four signal events on 14.225, subsurface bearing 047°:
- Day 3: 0.4s, non-mechanical, no repeat
- Day 9: 1.1s, non-mechanical, partial structure detected
- Day 14: 3.1s — *"Signal contains—"* [log ends]

Final note appended: *"Bearing 047° from Station 7 points toward the Neon Undercity access corridor."* This connects the Tilbury/Muffat monitoring arc to the Void Archaeology arc — the Scholar Kings were listening for something under the city. Something started answering.

### §LIII-C. Muffat: Four-State quoteFn

| State | Trigger | Content |
|---|---|---|
| 1 | Default | *"Welcome to Act Two."* |
| 2 | `muffatBerthReached` | Off-ledger crate pattern, two-year six-week schedule |
| 3 | `muffatManifestRead` | Station 7 / 14.225 convergence, Scholar Kings decisions |
| 4 | `station7LogRead` | Log ends mid-entry. Bearing 047°. Neon Undercity. The operator knew. We don't know where the operator is. |

| Field | Value |
|---|---|
| Quest | `quest_muffat_03` — *The Dark Station* |
| Activates | DK; requires `muffatManifestRead` |
| Completes | On `station7LogRead` |
| XP | 300 |
| Gold | 350gp |
| State flag | `station7LogRead` |
| Gate lock | HM → S7, item: `Shipping Manifest (Intercepted)` |
| Disposition | *"We do not know where the station operator is. We know the bearing."* — Magistra Elara Muffat |

---

## §LIV — The Warrant (✅ Implemented — Layer 92)

**Status:** ✅ Implemented 2026-05-27

### §LIV-A. The Discovery

The Warrant suppressor Seraphine gave the player is a WSP-CY-04 unit. It fires automatically on structured transmissions. It keeps a log. She did not know it kept a log.

The suppressor is what silenced Station 7's operator mid-entry on Day 14. Seraphine cut the transmission without knowing she was cutting anything. She was watching the door.

The signal has not repeated since. Three months of silence after three transmissions of increasing length — the fourth long enough to contain something, ended before it finished. Either the source stopped voluntarily. Or the source knows it's being jammed.

### §LIV-B. Seraphine Bruhns: Three-State quoteFn

| State | Trigger | Content |
|---|---|---|
| 1 | Default | *"That's a Warrant suppressor. Keep it."* |
| 2 | `station7LogRead` | She checks the side panel. Hands it back. *"I cut the transmission. I did not know I was cutting anything."* |
| 3 | `suppressorLogRead` | Three months of silence after three events. *"I would like to know what it was trying to say."* |

### §LIV-C. Warrant Suppressor Log (Readable)

Auto-log recovered from the device itself. Three suppression events matching Station 7 exactly. Source: bearing 047°, depth 18m, subsurface. Post-Day 14 note: *"Either source ceased voluntarily, or source is aware of suppression."*

The device continues active monitoring.

| Field | Value |
|---|---|
| Quest | `quest_signal_01` — *The Warrant* |
| Activates | CY; requires `station7LogRead` |
| Completes | On `suppressorLogRead` |
| XP | 250 |
| Gold | 300gp |
| State flag | `suppressorLogRead` |
| Disposition | *"Either source ceased voluntarily, or source is aware of suppression."* — Warrant Suppressor Log, Day 14 |

---

## §LV — The Antecedent Chamber (✅ Implemented — Layer 93)

**Status:** ✅ Implemented 2026-05-27

### §LV-A. What It Is

The thing at bearing 047°, depth 18m is not a void creature, not a weapon, not a trapped monster. It is something older than the Scholar Kings' classification system, contained by the Constructor in a room designed specifically for it. She built it to save people. They hid it to save themselves.

The Antecedent has been asking one question for forty-one volumes: *is the archive still maintained?* The question is not metaphorical. It is checking whether there is still a person doing the work of following evidence through systems designed to obscure it.

The player activated the Antecedent Seal (quest_va_02). The activation of Seal 7 triggered the containment protocol's receiving mode — the thing could now transmit. It began asking. Seraphine's suppressor kept cutting it off before it could complete the question. Three tries, each longer. The player followed the chain from Muffat's berth through the manifest, Station 7, the suppressor log, and into the chamber. The act of arriving with the Seal *is the answer*.

### §LV-B. The Quote

One-time delivery via `quoteFn` on the AC NPC_DIALOGUE entry. Sets `antecedentMet = true` on read.

*"The signal was not distress. It was a question: is the archive still maintained? [...] You followed the chain — courier, berth, manifest, station, suppressor, chamber. That is the answer. That is what an archivist does. [...] The classification is: archivist. The question is closed. You may go."*

Final lines are the node's own voice, not the Antecedent's: *At Station 7, the automated log writes: 14.225 — absence confirmed. It will not transmit again.*

The silence after is different from the silence before.

### §LV-C. Arc Summary — The Muffat Chain (Layers 89–93)

| Layer | Quest | Key Beat |
|---|---|---|
| 89 | quest_muffat_01 | Berth — off-ledger crate retrieved |
| 90 | quest_muffat_02 | Manifest — 14.225 / Station 7 identified |
| 91 | quest_muffat_03 | Dark Station — log ends mid-entry |
| 92 | quest_signal_01 | Warrant — suppressor cut the transmission |
| 93 | quest_antecedent_01 | Chamber — the question is answered |

| Field | Value |
|---|---|
| Quest | `quest_antecedent_01` — *The Question* |
| Activates | CY; requires `suppressorLogRead` |
| Completes | On `antecedentMet` (set in quoteFn) |
| XP | 400 |
| Gold | 0 (the reward is the answer) |
| Gate lock | CY → AC, item: `Antecedent Seal` |
| Disposition | *"The question is closed."* — The Antecedent |

---

## §LVI — Bertha: Volume 42 (✅ Implemented — Layer 94)

**Status:** ✅ Implemented 2026-05-27

Third state on Bertha's `quoteFn`, triggered by `antecedentMet`. She writes the Volume 42 entry. Confirmed absence. Same as every morning for forty-one volumes. She looks at it for longer than usual. *"The absence is the same. But it is quieter than it was yesterday."* She returns to the notebook. She does not know why she said that.

She is the only person in the city who would notice. She has been listening to it for forty-one volumes. The changed character of the absence registers before she has language for it.

She never finds out what answered. The log continues.

---

## §LVII — The Field Analyst (✅ Implemented — Layer 95)

**Status:** ✅ Implemented 2026-05-27

### §LVII-A. Analyst I. Solm

The Station 7 operator. Class 3, field-redacted. She heard the transmission cut off at 3.1 seconds on Day 14. She understood what had happened before she understood what she had heard. She went to Muffat. Muffat sent her to the Map Shop. Dusk held her for three months without asking why.

She has been writing the same entry every morning: *transmission confirmed, bearing 047°, no repeat.* She cannot close the file without a record from the terminus. The player comes back from the terminus. She writes the closing entry once, cleanly, and shuts the volume.

### §LVII-B. Dusk: Three-State quoteFn

| State | Trigger | Content |
|---|---|---|
| 1 | Default | *"Found it, which means you were supposed to."* |
| 2 | `antecedentMet && !solmFound` | *"Back room."* — Sets solmFound. Solm's scene delivered. |
| 3 | `solmFound` | She left this morning. She left the field file. *"You closed the record."* |

### §LVII-C. Final Arc Shape — The 14.225 Chain

Every person who touched this signal now has a closing beat:
- **Muffat** — five-state quoteFn, State 5: she sent Solm to Dusk, she is satisfied
- **Bertha** — three-state quoteFn, State 3: Volume 42, the quieter absence
- **Seraphine** — three-state quoteFn, State 3: three months of silence, she would like to know what it was trying to say
- **Solm** — one-time scene at SF: she writes the closing entry and goes
- **The Antecedent** — one-time delivery at AC: the question is closed, you may go

The Solm Field File closes with: *"The archive still has an archivist."*

| Field | Value |
|---|---|
| Quest | `quest_solm_01` — *The Field Analyst* |
| Activates | DK; requires `antecedentMet` |
| Completes | On `solmFound` (set in SF quoteFn) |
| XP | 200 |
| Gold | 150gp |
| Readable | Analyst Solm Field File — 88 entries, Vol. 1, closing entry written by hand |
| Disposition | *"File closed."* — Analyst I. Solm |

---

## §LVIII — Cycle 4 (✅ Implemented — Layer 96)

**Status:** ✅ Implemented 2026-05-27

### §LVIII-A. The Crate

Two years, six-week intervals, Scholar Kings stamp. Muffat never opened them because the stamp prevented search and she was building a case. The question is closed now. She opens one.

The receiver array inside is expected. The handwritten requisition note in the packing material — written by hand, no copy authorized, no date, no countersignature required — was not.

### §LVIII-B. The Requisition

The note authorizes expansion of Station 7 monitoring capacity *in advance of Cycle 4*. The Antecedent Containment Protocol runs in cycles. Cycle 3 was the Constructor's work. Cycle 4 carries a Conclave Archivist's authorization — someone with institutional authority over the Scholar Kings' archive itself.

The final line, in different ink: *"The archive knows what it holds. Do not let the archive answer."*

The signal answered anyway. The archive answered anyway. Someone with Conclave authority had already written the instruction against it before the first transmission. Cycle 4 is not a response. It was already in motion.

### §LVIII-C. What Cycle 4 Is (§FUTURE)

Unknown. The Conclave Archivist is unnamed. The Cycle 4 components have not arrived. The adjustment required at the interval is unspecified. This thread is open — the Conclave Archivist is a figure for a future arc, as is the question of what Cycle 4 does to the containment that the Constructor built to save people.

| Field | Value |
|---|---|
| Quest | `quest_muffat_05` — *Cycle 4* |
| Activates | DK; requires `solmFound` |
| Completes | On `cycle4NoteRead` |
| XP | 150 |
| Gold | 200gp |
| Readable | Scholar Kings Requisition (Handwritten) — Cycle 4 auth, Conclave Archivist, "Do not let the archive answer" |
| Disposition | *"They were not reacting to the signal. They were already in motion."* — Magistra Elara Muffat |

---

## §FUTURE — Long-Range Ideas (not scheduled)

> Speculative world expansions. No implementation layer assigned. Record the concept and canonical source material while the idea is fresh.

---

### §FUTURE-01 — The Road to Kesra: Saul of Tarsis Arc

**Concept:** A new act following the travels of Saul of Tarsis — his conversion on the road, his three missionary circuits across the inland sea, and his eventual arrest and voyage to the imperial capital. The arc is structurally derived from a historical itinerary (see `lab-report-saul-paul-travel-reference.md` for source material) but all city names, NPC names, and institutions are fictionalized to fit the Roll2Hit world.

**Mechanical hook:** The Road to Kesra conversion is not a cutscene — it is a world event. The player walks the road to Kesra as Saul (enforcer) and arrives in Kesra as Paul (apostle). The conversion changes the available quest types: enforcement quests close, persuasion and network quests open. Pre-conversion Saul has combat resources (order escort, arrest warrants). Post-conversion Paul has rhetoric resources (speeches, NPC disposition chains) and loses the combat support. This is the first instance in Roll2Hit where a mid-arc identity shift rewrites the world map's available interactions.

---

#### Name Translation Table

> Source material uses historical names. All in-game names are listed here. The lab report uses the original names for research reference.

| Historical | In-Game Name | Node Code |
|---|---|---|
| Jerusalem | **Herath** | `HR` |
| Damascus | **Kesra** | `KS` |
| Arabia (Nabatean desert) | **The Dust Roads** | `DR` |
| Tarsus | **Tarsis** | `TS` |
| Antioch | **Anthos** | `AO` |
| Cyprus | **The Copper Isle** | `CI2` |
| Lystra | **Lythros** | `LT` |
| Athens | **Aethon** | `AE` |
| Corinth | **Korath** | `KR` |
| Ephesus | **Ephrath** | `EF` |
| Philippi | **Phillam** | `PL` |
| Malta / Melita | **Melta** | `MT` |
| Rome | **The Seat** | `ST` |

| Historical NPC | In-Game Name | Role |
|---|---|---|
| Ananias | **Anath** | Healer; restores sight |
| Barnabas | **Barnach** | Advocate; first journey partner |
| Silas | **Silar** | Second journey co-traveler |
| Timothy | **Timael** | Third companion; picked up at Lythros |
| Lydia | **Lyra** | Purple cloth merchant; first convert at Phillam |
| Priscilla + Aquila | **Prisca + Akil** | Tentmakers; harbor Paul in Korath |
| Felix / Festus | **The Governors** | Prosecution arc; Paul appeals to the Seat |
| Bar-Jesus (the sorcerer) | **Ezzir** | Sorcerer-for-hire; opposes on the Copper Isle |

---

#### Act Structure

**Pre-conversion (Saul):**
- Player travels from Herath toward Kesra with warrants authorizing arrest of the dissenters
- Encounters along the road: hostile terrain, order escorts, a bound prisoner being transferred
- The Road to Kesra node: WIS save or INT check has no correct answer — the light comes regardless; what changes is how clearly the player hears the voice

**Post-conversion (Paul):**
- Three days blind in Kesra — time-locked passage; player cannot move until the encounter with Anath
- Anath at the lower-city inn: `quest_anath` — NPC will not appear until blind days have passed; delivers healing
- The Dust Roads interlude: optional node before returning to Kesra — no quests, only terrain and time; desert encounter table

---

#### Node Map

| Code | City | Act | Notes |
|---|---|---|---|
| `HR` | Herath | Pre-conversion | Law-city; source of warrants; first node |
| `KS` | Kesra | Conversion | Arrival blind; Anath; basket escape over the wall |
| `DR` | The Dust Roads | Post-conversion retreat | Optional; desert only; no NPCs |
| `HR` | Herath (return) | Early post-conversion | Barnach vouches; 15-day stay; Hellenists threaten |
| `TS` | Tarsis | The silent years | Paul's home city; Barnach retrieves him |
| `AO` | Anthos | Base of operations | First called by new name here; commissioning node |
| `CI2` | The Copper Isle | Journey 1 | Ezzir encounter; governor conversion |
| `LT` | Lythros | Journey 1 | Lame man healed; stoning; left for dead |
| `PL` | Phillam | Journey 2 | Lyra conversion; prison + earthquake event |
| `AE` | Aethon | Journey 2 | Unknown Altar speech; rhetoric skill check |
| `KR` | Korath | Journey 2 | 18-month stay; tentmaking with Prisca + Akil |
| `EF` | Ephrath | Journey 3 | 3-year stay; Temple riot (silversmiths) |
| `MT` | Melta | Shipwreck | 276 aboard; grounded; snake bite; 3 months |
| `ST` | The Seat | Final | Under house arrest; open ending |

---

#### Key Quests

| ID | Title | Type |
|---|---|---|
| `quest_road_kesra` | The Light at Noon | Conversion event — no pass/fail |
| `quest_anath` | The House on the Lower Road | NPC encounter; 3-day time gate |
| `quest_barnach_vouches` | Vouched For | Disposition: Barnach favor required |
| `quest_ezzir` | The Sorcerer's Opposition | Combat/spell-block; WIS save vs blindness |
| `quest_stoning_lythros` | Left for Dead | Post-combat survival; HP threshold event |
| `quest_unknown_altar` | The Unknown Altar | Rhetoric skill check (INT + Proficiency); partial/full outcomes |
| `quest_temple_riot` | Riot in the Marketplace | Crowd encounter; escape-route decision tree |
| `quest_shipwreck_melta` | Two Hundred and Seventy-Six | Sea encounter; survival without attack roll |
| `quest_snake_melta` | It Did Nothing | Passive event — crowd expects death, crowd is wrong |

---

#### Key NPCs

| Key | Name | Role | Node |
|---|---|---|---|
| `anath` | Anath | Healer; restores sight; reluctant obedience | KS |
| `barnach` | Barnach | Advocate; retrieves Paul from Tarsis; first journey partner | HR / TS / AO |
| `silar` | Silar | Second journey co-traveler; imprisoned with Paul at Phillam | AO / PL |
| `timael` | Timael | Picked up at Lythros; youngest companion | LT |
| `lyra` | Lyra | Purple cloth merchant; first convert at Phillam; provides lodging | PL |
| `prisca_akil` | Prisca + Akil | Tentmakers; harbor Paul in Korath 18 months | KR |
| `the_governors` | The Governors | Prosecution arc; Paul appeals to the Seat | HR → ST |

---

#### Terrain Types Needed

| Terrain | New? | Notes |
|---|---|---|
| `ancient_road` | New | Paved road; low encounter rate; movement bonus |
| `desert_caravan` | New | The Dust Roads + interior desert; heat mechanics possible |
| `assembly_hall` | New | Interior node; dialogue-only; persuasion checks |
| `locked_cell` | New | Time-locked node; earthquake event wired to day counter |
| `harbor_ancient` | Reuse `harbor` | Inland sea ports: Kaphos, Mileth, Keth-Shor |
| `sea_voyage` | New | Shipwreck sequence; storm encounter table |

---

#### Design Notes

- **The conversion is not a reward — it is a reframing.** Pre-conversion Saul has combat resources (order escorts, arrest warrants). Post-conversion Paul has persuasion resources (rhetoric, NPC disposition chains) and loses the combat support. The arc is about what you trade and what you gain.
- **Source fidelity as constraint, not costume.** Every node maps to a documented stop in the lab report. Quests dramatize events rather than invent them. The Unknown Altar speech at Aethon is the text; the skill check is whether Paul finds the right entry point with this particular crowd.
- **"It Did Nothing"** is the best single beat in the source arc. The Melta snake encounter should play completely straight: Paul is bitten, the crowd waits for him to swell and die, he shakes the snake off into the fire, nothing happens. No roll. No explanation. The crowd changes their mind about who he is.
- **Travel pacing:** The journeys cover thousands of miles across multiple years. The hour counter is insufficient — this arc needs a **day/week counter** as the primary time unit, or explicit time-abstraction (node-to-node = one movement, no hour cost).
- **Cross-reference with existing Arthurian arc:** Roll2Hit uses Chrétien's structural vocabulary (objects that carry weight, things enacted not stated). This arc uses the same technique: the snake that does nothing, the coat left behind at a waypoint inn, the letter carried for someone else. These are Chrétien objects. The arcs belong to the same tradition.
- **Source material:** `lab-report-saul-paul-travel-reference.md` — 37 nodes, Acts 7–28 + Pauline letters, full NPC list, lodging details, meals, speeches. Use for implementation reference; do not expose historical names in-game.
- **Vignette spec:** `lab-report-saul-paul-vignette-spec.md` — 14 node texts, 9 quest descriptions + disposition quotes, 7 NPC voice lines, 8 voice rules, object inventory, thorn mechanic note.
