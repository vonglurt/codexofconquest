<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

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

> **Status as of Layer 104 (2026-05-28).** §LXV–§LXIX: PL/AE/EF2/KR/ML/ST quest completion + Malta storyRender. §SIREN-01: 10-node Littoral Courts arc (4 Ladies + Overseer, betrayal mechanic, LCA arc-close). HTML: ~21,200 lines. Lab reports: 46. Add new layers below as §LXX+.

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
| 104 | §LXV–§LXIX + §SIREN-01 | `lab-report-littoral-courts.md` |

Earlier layers (9–47): see `lab-report-architecture-full.md` and `lab-report-timeline-history-completed.md`.

✅ §DESIGN-03 (Ceremonia Roll + Starting City) — implemented 2026-05-26. Lab report: `lab-report-ceremonia-roll-skill-checks.md`.
✅ §DUNGEON-01 (10 Dungeon Themes) — fully implemented Layer 81 (2026-05-26). Nodes WK + MM live.
✅ §DUNGEON-02 (Five-Act Arthurian Quest Elaborations) — All 10 chains live (Layer 81, 2026-05-26). D02-06 (WK node) + D02-08 (MM node) implemented. See `quest.md`.
✅ §XLIII (Hunt Overhaul) — implemented Layer 82 (2026-05-26). Inline target selector accordion, WIS Survival DC roll, ◈ quest badges, fail flavor, Rush In.
✅ §XLIV (Accordion-First UI) — implemented Layer 82 (2026-05-26). Hunt + Battle cards both inline accordions; battle accordion has threat badge, condition picker, stealth toggle, Start Battle, Retreat.
✅ §LXV–§LXIX (Mediterranean Journey Completion) — implemented Layer 104a (2026-05-28). 5 quests (quest_philippi/quest_areopagus/quest_ephesus_riot/quest_corinth_letters/quest_rome_arrest) + Malta storyRender. 6 NPC quoteFn entries. Flags: lyraConverted, areopagusSpeech, demetriusRiotEscaped, corinthLettersWritten, maltaSnakeEvent, romeArrestBegun.
✅ §SIREN-01 (The Four Courts of the Littoral Sea) — implemented Layer 104b (2026-05-28). 10 nodes (LJ0–LCA + LSO), 5 quests (4 courts + Overseer), betrayal mechanic (3 flags), LCA arc-close (3 variants), LJ3 navigator trigger. Lab report: `lab-report-littoral-courts.md`.

---

## I. Directive

> You are an expert prompt interpreter with an electrical engineering / computer science background. Follow the sections below: use the suggestions in II, III, IV to implement ideas from the list, or append new ideas to the end of the list when told about them. Work incrementally — present one step at a time and wait for "continue."

### API-First Development Policy

**Preferred workflow for any data addition or edit to `roll2hit-v3.html`:**

1. **Check API first** — before editing HTML, query `http://localhost:1367/api` to confirm current state. Use `curl` to inspect entities, audit, or list before making changes.
2. **Write the API method first** — if the operation isn't yet supported (e.g., `POST /api/terrain`, `PATCH /api/world_db`), add the endpoint to `wbapi-server.js` and restart before touching the HTML.
3. **Create/modify via API, not HTML** — preferred: `curl -X POST http://localhost:1367/api/<type> -d '...'` followed by `POST /api/save` to write back. Direct HTML edits are a fallback only when the API cannot yet express the operation.
4. **Restart server after adding endpoints** — `./wbapi-toggle.sh restart` (or `start` if stopped).
5. **When adding items to plan.md** — cross-reference the current API at `localhost:1367/api/audit` and `localhost:1367/api/list/<type>` to confirm what actually exists vs. what the plan assumes. Do not add a plan item without verifying the API-reported current state.

**Goal state:** All large JS arrays in `roll2hit-v3.html` (`NODE_MAP`, `QUEST_DB`, `WORLD_DB`, `MONSTER_POOL`, `MONSTER_DROPS`, `FISH_POOL`, `LAKE_MAGIC_DB`, `CONDITION_ITEMS`, `EPIC_BOSS_POOL`, etc.) are exportable via the API. The HTML file is the single source of truth — it should be possible to run all game logic on Node/V8 by feeding API-extracted code sections, without a browser. See `§WBAPI-01` for the export roadmap.

`roll2hit-v3.html` is the single source of truth. The API reads its text directly and writes mutations back into it in-place. The entire game — all data, all logic, all UI — is fully playable in a browser with only `roll2hit-v3.html`: no Node, no `worldbuilder.html`, no server, no dependencies. The HTML is pure JavaScript running on the DOM. `wbapi-server.js` and `worldbuilder.html` are authoring tools that read and write the same file; they add nothing the game requires at runtime.

### Incremental Recitation Rule

While writing vignette content, speak short segments aloud via `say` as you produce them — every page or every couple of paragraphs. Read the element type first, then its text. Examples:

Run `say` in the background so it does not block writing:

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

## §XLV — Yugurt Tournament + Six Fishermen (✅ Implemented — Layer 83)

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

## §LIX — Jerusalem + Damascus: The Conversion (✅ Implemented — Layer 98)

> **Status:** Live. HR + KS nodes in NODE_MAP. Two new NPC_DIALOGUE entries. Two QUEST_DB quests. Conversion fires on KS arrival. Blind gate (3-day counter) blocks movement. Anath heals on day 3 via IIFE in KS quoteFn.

### §LIX-A. What Was Built

| Element | Detail |
|---|---|
| Nodes added | HR (num:84, act:4, E:KS) · KS (num:85, act:4, W:HR) |
| NODE_COORDS | HR:{r:17,c:5} · KS:{r:17,c:8} — new southeast cluster |
| Loot at HR | Three Jerusalem Warrants · Order of Escort (first-visit only) |
| _S_DEFAULTS | saulConverted · blindDaysKS · anathSightRestored |
| NPC_DIALOGUE | HR: The Court Registrar (static) · KS: Anath (3-state quoteFn) |
| Quests | quest_road_damascus (activates at HR, completes on saulConverted) · quest_anath (activates at KS, completes on anathSightRestored) |
| Conversion event | storyRender KS block: on first arrival, sets saulConverted=true, injects conversion prose inline |
| Blind gate | storyMove KS check: blocks all exits while !anathSightRestored; increments blindDaysKS; day 3 message prompts Anath |

### §LIX-B. The Conversion Text

The conversion fires as an inline storyRender div on first arrival at KS. No skill check. No pass/fail. The road changes the person; the destination confirms it. Prose: "The light arrived with the absolute certainty of a fact that had already been true and was simply now being acknowledged."

### §LIX-C. Anath's States

| State | Condition | Action |
|---|---|---|
| Waiting (days 1–2) | blindDaysKS < 3 | "The room is quiet. Day N of three. You wait." |
| Arrival (day 3) | blindDaysKS ≥ 3 AND !anathSightRestored | IIFE: sets anathSightRestored=true; delivers healing scene |
| After healing | anathSightRestored | Quiet reflection; road visible from window |

### §LIX-D. Arc Shape So Far

| Layer | Content |
|---|---|
| §LIX (98) | HR + KS live. Conversion. Blind gate. Anath heals. quest_road_damascus + quest_anath. |
| §LX (99) | DR node. KS→DR connection. Detention gate. quest_basket_damascus (DEX DC 12, retryable). escapedDamascus flag. |
| §LXI (next) | HR return + Barnach vouches + 15-day Hellenist gate → TS (Tarsus) |
| §LXII | TS silent years + Barnach arrival → AO (Antioch) + commissioning |

## §LXIII — Cyprus: Ezzir + The Governor (✅ Implemented — Layer 102)

> **Status:** Live. CI2 node. AO.S → CI2. AO→CI2 commission gate. Governor 3-state quoteFn. Two skill checks: quest_ezzir (WIS DC 14) + quest_governor_cyprus (CHR DC 11). New flags: ezzirConfronted, govCopperConverted.

### §LXIII-A. What Was Built

| Element | Detail |
|---|---|
| CI2 node | num:89, act:4, N:AO, S:LT — harbor district, copper/salt air, sleep:true (4gp) |
| AO update | S: null → S:'CI2' |
| CI2 NPC | The Governor — 3-state quoteFn: default (watching) / ezzirConfronted (listening) / govCopperConverted (understood) |
| AO→CI2 gate | storyMove: commissionReceived required |
| quest_ezzir | WIS/Insight DC 14, retryable 1-day gate. checkPassFlag: ezzirConfronted |
| quest_governor_cyprus | CHR/Persuasion DC 11, retryable 0-day gate, activates after ezzirConfronted. checkPassFlag: govCopperConverted |

### §LXIII-B. The Door and the Room

Ezzir knows where to stand. That is all the spec says about his technique and it is sufficient. The WIS check is not "does Paul see through Ezzir" — it is whether Paul's description of what he knows is more specific than Ezzir's position of what he recommends. On pass: Ezzir's words stop working. This is visible. The governor has been watching for this kind of evidence.

The governor maintains a three-hundred-year-old altar in the corner of his room. He does not know why. Every governor before him maintained it. He maintains it because they did, which is the most honest reason he has found. The CHR check is whether Paul can tell him what it is.

### §LXIII-C. Arc Shape — Journey 1

```
AO (commission) → CI2 (Ezzir, governor) → LT (Lystra, lame man, stoning, Timael)
```

Next: §LXV — PL (Phillam, Lyra/purple cloth, prison earthquake, Silar).

---

## §LXIV — Lystra: The Gate + The Stoning (✅ Implemented — Layer 103)

> **Status:** Live. LT node (num:90, act:4, CI2.S). Timael 4-state quoteFn. Two quests: quest_lame_lystra (WIS/Faith DC 10, non-retryable) + quest_stoning_lystra (survival event). HP drops to 1 on stoningEvent. Cannot heal above 1 at LT. Timael joins after stoning.

### §LXIV-A. What Was Built

| Element | Detail |
|---|---|
| LT node | num:90, act:4, N:CI2 — Lystra, market civic pride, man at gate |
| CI2 update | S: null → S:'LT' |
| Timael NPC | 4-state quoteFn: default (watching) / lameManHealed (crowd response) / stoningEvent IIFE (joined) / timaelaJoined (not leaving) |
| quest_lame_lystra | WIS/Faith DC 10, non-retryable. checkPassFlag: lameManHealed. "No one has ever meant it this way." |
| quest_stoning_lystra | side, activates when quest_lame_lystra done. completeFn: stoningEvent. HP=1 via storyRender block |
| storyRender block | Fires at LT after quest_lame_lystra done. Sets stoningEvent=true, hp=1. Injects crowd-turns narrative |
| storyConfirmSleep HP cap | stoningEvent && nodeCode==='LT' → hp capped at 1 |

### §LXIV-B. The Two Crowd Responses

The crowd comes expecting a god and gets a correction. On pass, the man stood — and the crowd immediately misread the event as divine appointment. Paul corrects them at length. The crowd is disappointed: they were ready to sacrifice. Some of them decide the correction is the offense.

On fail, the man does not stand and the crowd disperses. The stoning happens because Paul is still in the city, still speaking, still correcting. The crowd's reason for stoning is the same reason as the worship: they had an image of what he was and he kept not being it.

Both paths lead to the stones. The WIS check changes the narrative register, not the destination.

### §LXIV-C. Timael

Does not explain why he stayed. Has not examined it. Does not appear to need to. The IIFE state fires on stoningEvent: "He got up. Everyone else left. I decided to stay." No further analysis.

### §LXIV-D. Arc Shape — Journey 1 Complete

| Layer | Node | Content |
|---|---|---|
| §LIX (98) | HR + KS | Conversion. Blind gate. Anath heals. |
| §LX (99) | DR | Detention gate. Basket escape (DEX DC 12). |
| §LXI (100) | HR return + TS | Barnach vouches. 15-day Hellenist gate. Tarsus. |
| §LXII (101) | AO | Commissioning. Name-change. Silar joins. |
| §LXIII (102) | CI2 | Ezzir (WIS DC 14). Governor (CHR DC 11). |
| §LXIV (103) | LT | Lame man (WIS DC 10). Stoning. Timael joins. |

---

## §LXV–§LXIX — Paul's Mediterranean Journey: Second Circuit + Malta + Rome (✅ Implemented — Layer 104a)

> **Status:** Live. PL/AE/EF2/KR/ML/ST nodes. 5 quests + Malta storyRender event (no quest). 6 NPC quoteFn entries. State flags: `lyraConverted`, `areopagusSpeech`, `demetriusRiotEscaped`, `corinthLettersWritten`, `maltaSnakeEvent`, `romeArrestBegun`. HTML: ~21,200 lines at implementation close.

### §LXV–§LXIX-A. What Was Built

| Section | Node | Quest ID | Type | Key Mechanic |
|---------|------|----------|------|--------------|
| §LXV | PL | `quest_philippi` | side | Lyra IIFE on first visit; `lyraConverted` set; all doors open |
| §LXVI | AE | `quest_areopagus` | skill_check | Unknown Altar; CHA Persuasion DC 13; `areopagusSpeech` pass flag |
| §LXVII | EF2 | `quest_ephesus_riot` | skill_check | Demetrius; CHA Persuasion DC 12; `demetriusRiotEscaped` pass flag |
| §LXVIII | KR | `quest_corinth_letters` | side | Prisca + Akil IIFE; `corinthLettersWritten` set; 18 months |
| §LXIX | ML | storyRender injection | event | No quest, no roll; `maltaSnakeEvent` set; crowd changes mind |
| §LXIX | ST | `quest_rome_arrest` | side | Timael IIFE; `romeArrestBegun` set; activates after `maltaSnakeEvent` |

### §LXV–§LXIX-B. Malta Design Note

The Malta node has no skill check and no FAIL flag. `storyRender` injection fires once when `!maltaSnakeEvent`. Div `id:'story-ml-snake'` appended after `story-text-box`. Text: `'...He builds the fire.'` The crowd waits for him to swell and die. He shakes the snake off. Nothing happens. The crowd changes their mind. No word explains it. This is the arc's cleanest beat — the source design mandates it plays completely straight.

---

## §LXII — Antioch: The Sending (✅ Implemented — Layer 101)

> **Status:** Live. AO node. TS.W → AO. Assembly Elder Joach 2-state quoteFn (IIFE sets commissionReceived + silarJoined). storyRender name-change notice at AO on first commission visit. quest_antioch_commission.

### §LXII-A. What Was Built

| Element | Detail |
|---|---|
| AO node | num:88, act:4, E:TS — Antioch mixed quarter, sleep:true (4gp) |
| TS update | W: null → W:'AO' |
| AO NPC | Assembly Elder Joach — 2-state quoteFn: IIFE commission → return reflection |
| Name change | storyRender block: "He is called Paul here for the first time." — injected on first AO arrival post-commission |
| _S_DEFAULTS | commissionReceived · silarJoined |
| Quest | quest_antioch_commission (activates at AO when barnachFoundPaul, completes on commissionReceived) |

### §LXII-B. The Name

"He is called Paul here for the first time. He will be called Saul again once, by someone who does not know the road. It will not fit." This is delivered as a storyRender block — not dialogue, not quest text. It is just true, and now visible.

### §LXII-C. Arc Shape — First Journey Path

```
HR (pre-conversion) → KS (blind, Anath) → DR (optional desert) → HR (return, Barnach vouches, 15 days) → TS (silent years) → AO (commissioning, Paul named) → CI2 (Copper Isle) → LT (Lystra, Timael)
```

Next: §LXIII — CI2 (Copper Isle, Ezzir encounter, governor conversion).

---

## §LXI — Jerusalem Return + Tarsus (✅ Implemented — Layer 100)

> **Status:** Live. TS node added. HR.W → TS. HR NPC_DIALOGUE updated to 4-state Barnach quoteFn. 15-day Hellenist gate in storyMove. quest_hellenists_jerusalem + quest_barnach_finds. Barnach TS 2-state quoteFn (IIFE sets barnachFoundPaul on first click).

### §LXI-A. What Was Built

| Element | Detail |
|---|---|
| TS node | num:87, act:4, E:HR — Tarsus tentmaking quarter, sleep:true (3gp), loot:Tentmaking Tools |
| HR update | W: null → W:'TS' |
| HR NPC_DIALOGUE | 4-state quoteFn: pre-conversion (Registrar) / post-conversion return (Barnach vouches, IIFE) / barnachVouchedHR (watching days) / hellenistsThreaten (go to Tarsus) |
| HR→TS gate | storyMove: barnachVouchedHR required + 15-day counter → hellenistsThreaten |
| Quests | quest_hellenists_jerusalem (activates post-vouch, completes when hellenistsThreaten) · quest_barnach_finds (activates at TS, completes when barnachFoundPaul) |
| TS Barnach | 2-state quoteFn: IIFE sets barnachFoundPaul on first click → departure speech on return |

### §LXI-B. Barnach's Vouching

The vouch is an IIFE: first time the player talks to Barnach on HR return, barnachVouchedHR=true fires and the room-scene delivers. "He was there." That's the whole of the vouch. It is enough. For now.

### §LXI-C. The Silent Years

Tarsus delivers loot (Tentmaking Tools) on first visit, then Barnach arrives. The arc earns the silence: the player has nowhere to go. The road east leads back to Jerusalem (which sent them away). The road west doesn't exist yet. The only thing to do is work. Then Barnach comes through the gate.

---

## §LX — Basket Escape + Arabia (✅ Implemented — Layer 99)

> **Status:** Live. DR node added. KS.S → DR. Two-stage KS gate (blind → detention). quest_basket_damascus (skill_check, DEX DC 12, retryable, 1-day gate). escapedDamascus flag. DR is optional negative space — desert encounter, no quests, no NPCs.

### §LX-A. What Was Built

| Element | Detail |
|---|---|
| DR node | num:86, act:4, N:KS — desert_caravan terrain, optional retreat, sleep:true (no cost) |
| KS update | S: null → S:'DR' |
| Two-stage KS gate | Blind gate (§LIX) + detention gate (§LX): escapedDamascus required after sight restored |
| quest_basket_damascus | DEX/Stealth DC 12, retryable, 1-day gate, checkPassFlag:'escapedDamascus' |
| _S_DEFAULTS | escapedDamascus: false |

### §LX-B. The Two Walls

The player encounters two walls in Damascus. The first is blindness — navigation impossible without sight. The second is the magistrate's watch. Both walls are structural: the first resolves when Anath knocks; the second resolves when the player finds the window the watch hasn't covered. The arc earns both gates — they are not arbitrary difficulty, they are the form that Damascus takes when the warrant authority reverses.

### §LX-C. Arabia

DR has one encounter (Desert Wanderer ×2) and no NPCs. The node text is the only content: "Some things about a person belong to the desert." The player can sleep there for free — the desert is the only space in the arc where nothing is asked of them. Returning to KS.N closes the retreat.

---

### §FUTURE-01 — The Road to Damascus: Saul of Tarsus Arc

> **Status:** ✅ Fully implemented — §LIX (Layer 98) through §LXIX (Layer 104a). All nodes live: HR/KS/DR/TS/AO/CI2/LT/PL/AE/EF2/KR/ML/ST. See individual section entries above.

**Concept:** A new act following the travels of Saul of Tarsus — his conversion on the road, his three missionary circuits across the inland sea, and his eventual arrest and voyage to the imperial capital. The arc is structurally derived from a historical itinerary (see `lab-report-saul-paul-travel-reference.md` for source material) but all city names, NPC names, and institutions are fictionalized to fit the Roll2Hit world.

**Mechanical hook:** The Road to Damascus conversion is not a cutscene — it is a world event. The player walks the road to Damascus as Saul (enforcer) and arrives in Damascus as Paul (apostle). The conversion changes the available quest types: enforcement quests close, persuasion and network quests open. Pre-conversion Saul has combat resources (order escort, arrest warrants). Post-conversion Paul has rhetoric resources (speeches, NPC disposition chains) and loses the combat support. This is the first instance in Roll2Hit where a mid-arc identity shift rewrites the world map's available interactions.

---

#### Name Translation Table

> Source material uses historical names. All in-game names are listed here. The lab report uses the original names for research reference.

| Historical | In-Game Name | Node Code |
|---|---|---|
| Jerusalem | **Jerusalem** | `HR` |
| Damascus | **Damascus** | `KS` |
| Arabia (Nabatean desert) | **Arabia** | `DR` |
| Tarsus | **Tarsus** | `TS` |
| Antioch | **Antioch** | `AO` |
| Cyprus | **Cyprus** | `CI2` |
| Lystra | **Lystra** | `LT` |
| Athens | **Aethon** | `AE` |
| Corinth | **Korath** | `KR` |
| Ephesus | **Ephrath** | `EF` |
| Philippi | **Phillam** | `PL` |
| Malta / Melita | **Melta** | `ML` |
| Rome | **The Seat** | `ST` |

| Historical NPC | In-Game Name | Role |
|---|---|---|
| Ananias | **Anath** | Healer; restores sight |
| Barnabas | **Barnach** | Advocate; first journey partner |
| Silas | **Silar** | Second journey co-traveler |
| Timothy | **Timael** | Third companion; picked up at Lystra |
| Lydia | **Lyra** | Purple cloth merchant; first convert at Phillam |
| Priscilla + Aquila | **Prisca + Akil** | Tentmakers; harbor Paul in Korath |
| Felix / Festus | **The Governors** | Prosecution arc; Paul appeals to the Seat |
| Bar-Jesus (the sorcerer) | **Ezzir** | Sorcerer-for-hire; opposes on Cyprus |

---

#### Act Structure

**Pre-conversion (Saul):**
- Player travels from Jerusalem toward Damascus with warrants authorizing arrest of the dissenters
- Encounters along the road: hostile terrain, order escorts, a bound prisoner being transferred
- The Road to Damascus node: WIS save or INT check has no correct answer — the light comes regardless; what changes is how clearly the player hears the voice

**Post-conversion (Paul):**
- Three days blind in Damascus — time-locked passage; player cannot move until the encounter with Anath
- Anath at the lower-city inn: `quest_anath` — NPC will not appear until blind days have passed; delivers healing
- Arabia interlude: optional node before returning to Damascus — no quests, only terrain and time; desert encounter table

---

#### Node Map

| Code | City | Act | Notes |
|---|---|---|---|
| `HR` | Jerusalem | Pre-conversion | Law-city; source of warrants; first node |
| `KS` | Damascus | Conversion | Arrival blind; Anath; basket escape over the wall |
| `DR` | Arabia | Post-conversion retreat | Optional; desert only; no NPCs |
| `HR` | Jerusalem (return) | Early post-conversion | Barnach vouches; 15-day stay; Hellenists threaten |
| `TS` | Tarsus | The silent years | Paul's home city; Barnach retrieves him |
| `AO` | Antioch | Base of operations | First called by new name here; commissioning node |
| `CI2` | Cyprus | Journey 1 | Ezzir encounter; governor conversion |
| `LT` | Lystra | Journey 1 | Lame man healed; stoning; left for dead |
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
| `quest_road_damascus` | The Light at Noon | Conversion event — no pass/fail |
| `quest_anath` | The House on the Lower Road | NPC encounter; 3-day time gate |
| `quest_barnach_vouches` | Vouched For | Disposition: Barnach favor required |
| `quest_ezzir` | The Sorcerer's Opposition | Combat/spell-block; WIS save vs blindness |
| `quest_stoning_lystra` | Left for Dead | Post-combat survival; HP threshold event |
| `quest_unknown_altar` | The Unknown Altar | Rhetoric skill check (INT + Proficiency); partial/full outcomes |
| `quest_temple_riot` | Riot in the Marketplace | Crowd encounter; escape-route decision tree |
| `quest_shipwreck_melta` | Two Hundred and Seventy-Six | Sea encounter; survival without attack roll |
| `quest_snake_melta` | It Did Nothing | Passive event — crowd expects death, crowd is wrong |

---

#### Key NPCs

| Key | Name | Role | Node |
|---|---|---|---|
| `anath` | Anath | Healer; restores sight; reluctant obedience | KS |
| `barnach` | Barnach | Advocate; retrieves Paul from Tarsus; first journey partner | HR / TS / AO |
| `silar` | Silar | Second journey co-traveler; imprisoned with Paul at Phillam | AO / PL |
| `timael` | Timael | Picked up at Lystra; youngest companion | LT |
| `lyra` | Lyra | Purple cloth merchant; first convert at Phillam; provides lodging | PL |
| `prisca_akil` | Prisca + Akil | Tentmakers; harbor Paul in Korath 18 months | KR |
| `the_governors` | The Governors | Prosecution arc; Paul appeals to the Seat | HR → ST |

---

#### Terrain Types Needed

| Terrain | New? | Notes |
|---|---|---|
| `ancient_road` | New | Paved road; low encounter rate; movement bonus |
| `desert_caravan` | New | Arabia + interior desert; heat mechanics possible |
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

---

## §PAUL-01 — The Escort of the Apostle: Revised Arc Design (📋 PLANNED)

**Status:** 📋 PLANNED — written 2026-05-29. Supersedes the storytelling approach of §FUTURE-01 (which remains the node map and implementation reference). This section reframes the player role, establishes the Fighter's presence, redesigns the skill check structure, and integrates real source quotes.

**The premise shift:** In §FUTURE-01 as implemented, the player walks in Paul's footprints — the narration is in second person but the events are Paul's events. The revision establishes the **Fighter as co-protagonist**. Paul is a Cleric NPC — on a mission from his deity, skilled in rhetoric and faith-mechanics, incapable of routing himself safely through a hostile world. The Fighter is his escort. Both characters are present in every scene. Neither is backdrop to the other.

---

### §PAUL-01-A. The Central Argument

Paul is a Cleric who fights with words and outlasts everything. The Fighter is the person who makes it possible for him to keep going. This is not a supportive relationship in the subordinate sense — it is the way two very different skill sets become one capability. Paul can persuade a governor, heal a man who has never walked, survive a shipwreck by prayer and presence of mind, and write letters that reach cities he cannot walk to. He cannot read a street about to turn, assess which guards can be bribed, lower a grown man in a basket from a third-floor window in the dark, or keep a prison door open long enough for everyone to get out.

The Fighter's job is exactly those things.

**This is a faith-witness arc, not a faith-instruction arc.** The Fighter is not asked to convert. They are asked to watch what happens when a man operates at the limit of what faith can carry, and to keep him alive long enough for it to matter. Witnessing is the Fighter's vocation in this arc, the same way it is in §GR: you come, you see, you stay — and the staying is the thing.

---

### §PAUL-01-B. Fighter Presence Rules

These rules govern how the Fighter appears in every node text and quest description. They supplement the Paul voice rules in `lab-report-saul-paul-vignette-spec.md`.

**1. The Fighter is named by function, not by name.**
Node texts do not say "you" in the Paul passages — they are in third person as observed from outside. When the Fighter acts, the text shifts to second person: "You hold the rope." "You count the guards." "You stay." The shift marks the boundary between witnessing and acting.

**2. The Fighter's skill checks are always physical or situational.**
Paul's checks are rhetoric (INT) and faith (WIS). The Fighter's checks are STR Athletics, DEX Stealth/Acrobatics, CHA Intimidation (holding a room), WIS Insight (reading a street or a crowd). Their skills are complementary. Neither set solves the same problem.

**3. The Fighter has an opinion.**
Not stated as commentary — shown as choice. Before the Aethon speech: the Fighter scouts the square and confirms two exits. Before the Phillam prison: the Fighter does not leave when the doors open. The opinion is the action. No dialogue required.

**4. The Fighter's presence changes what Paul can do.**
Without the Fighter, Paul cannot get out of Damascus. Without Paul, the Fighter has no reason to be at the Aethon public hall. The interdependence is structural, not decorative. If one of them were removed from any node, the scene's resolution changes.

**5. The Fighter is not a believer. The Fighter is a witness.**
This is the same function as in §GR: Connie's grief is witnessed by someone who came and stayed. Paul's mission is witnessed by someone who came and stayed. The Fighter does not need to share the faith to share the road. This distinction is kept clean — no conversion arc, no faith-check for the Fighter. Their deity is their own matter. What they have is loyalty to a specific man on a specific road and the professional ethic to keep him breathing.

**6. The Fighter is physically present in key objects.**
The rope holds a basket. The Fighter holds the rope. The earthquake opens the door. The Fighter is the one who tells the jailer to put down the sword. The snake goes into the fire. The Fighter is standing next to the fire. Small, specific, present.

---

### §PAUL-01-C. Paul as Cleric NPC — What He Does, What He Cannot Do

| Paul's capabilities | Fighter's capabilities |
|--------------------|----------------------|
| Rhetoric skill check (INT, Persuasion/History) | Combat, physical extraction, route-finding |
| Faith healing (scripted event — no roll; happens or it happens) | Guard assessment, bribery reads, crowd reads |
| Writes letters (narrative — not rolled) | Rope work, climbing, heavy lifting |
| NPC disposition changes (his charisma rewrites who likes whom) | Intimidation to hold a room or a guard |
| Survives things that should not be survived (the thorn; the snake) | Tactical escape planning |
| Arguments (pushes back on everyone he respects) | Recognizes which arguments are about to become streets |

Paul cannot be killed in this arc. He can be captured (triggering specific quest states), isolated (triggering the blind days, the house arrest), or delayed (triggering time-gates). The Fighter can fail to protect him — the consequence is not Paul's death but a harder path: more damage on the fighter, a missed NPC disposition opportunity, a door that closes.

---

### §PAUL-01-D. The Escort Quest Chain — Revised Structure

Each leg of the journey is one escort quest. The Fighter has a primary skill check per leg. Paul has a secondary (his rhetoric/faith action). Both resolve in the same scene.

| Quest ID | Title | Node | Fighter Check | Paul Action | Real Quote |
|----------|-------|------|---------------|-------------|-----------|
| `quest_road_kesra` | The Light at Noon | KS (road) | None — the Fighter watches. No check. This is Paul's moment alone. | Conversion event: fell to the ground, heard a voice, blind. | *"Saul, Saul, why are you persecuting me?"* — Acts 9:4 |
| `quest_basket_descent` | The Rope in the Dark | KS (wall) | STR Athletics DC 12 — lower the basket without the rope slipping while guards are at the eastern gate. Fail: rope frays; basket drops last three feet; Paul bruised, Fighter makes noise. | Paul is in the basket. He is doing nothing mechanical. He is praying. This is documented. | *"Through a window in the wall his disciples lowered him in a basket."* — Acts 9:25 |
| `quest_anath` | The House on the Lower Road | KS (inn) | WIS Insight DC 10 — is Anath safe? (He stops on the landing, deciding. The Fighter hears this and chooses not to intercept.) | 3-day time gate. Anath heals. Sight returns. | *"Brother Saul, the Lord Jesus, who appeared to you on the road... has sent me so that you may see again."* — Acts 9:17 |
| `quest_barnach_vouches` | Vouched For | HR | CHA Intimidation DC 11 — hold the room while Barnach argues. The room does not trust Paul yet. The Fighter's visible presence keeps the arguments verbal. | Barnach speaks for Paul. Paul does not speak yet. He waits. | *"He will stay with me."* — Barnach (adapted) |
| `quest_ezzir` | The Sorcerer's Opposition | CI2 | STR/DEX DC 12 — stand between Ezzir and the door while Paul addresses the governor. Ezzir will try to leave the room before the argument finishes. | WIS faith check vs Ezzir's rhetoric. Paul names what Ezzir is doing, plainly, in front of the governor. | *"You are a child of the devil and an enemy of everything that is right."* — Acts 13:10 |
| `quest_stoning_lythros` | Left for Dead | LT | STR Athletics DC 13 — create an opening in the crowd after the lame man stands and the crowd reverses. The Fighter pulls Paul through before the first stone is thrown. Fail: Paul takes 2d6 damage before extraction. | The healing happens. Paul cannot prevent what comes after. | *"He got up and went back into the city."* — Acts 14:20 (documented sequence; Paul's action after the stoning) |
| `quest_prison_phillam` | Seven Stairs, Then Five | PL | WIS Insight DC 12 — when the earthquake opens the doors and the chains fall, the jailer draws his sword (he will execute himself before being blamed for escaped prisoners). The Fighter must read this before it happens. | Paul is singing. At midnight. Silar is with him. This is the first anyone has heard this in a prison. | *"About midnight Paul and Silas were praying and singing hymns to God, and the other prisoners were listening."* — Acts 16:25 |
| `quest_unknown_altar` | The Unknown Altar | AE | DEX Stealth DC 11 — scout the two exits from the public hall before Paul takes the steps. If the speech fails (partial result), the Fighter already knows the way out. | INT Persuasion DC 14. Paul starts with the altar. The crowd has calibrated opinions. Some will stop. A few won't. | *"To an Unknown God. What therefore you worship as unknown, this I proclaim to you."* — Acts 17:23 |
| `quest_temple_riot` | Riot in the Marketplace | EF | STR Athletics DC 13 — reach the north gate. Demetrios has translated a business problem into a street; the street is between the player and the exit. Paul is already moving. | Paul is moving. He does not fight Demetrios. He leaves through the north gate. The departure is the answer. | *"Great is Artemis of the Ephesians!"* — Acts 19:28 (Demetrios's crowd — used as disposition quote for the riot scene) |
| `quest_shipwreck_melta` | Two Hundred and Seventy-Six | MT | STR Athletics DC 12 — help keep people on planks during the swim to shore. Paul has directed the crew to eat before the hull goes; the Fighter executes the distribution. | Paul addresses the 276 before the ship goes down. He tells them no one will die. He is right. | *"Therefore I urge you to take some food. You need it to survive. Not one of you will lose a single hair from his head."* — Acts 27:34 |
| `quest_snake_melta` | It Did Nothing | MT | None — the Fighter watches. No check. This is Paul's moment alone, the same as the road to Kesra. The arc brackets its two no-check moments: the conversion and the snake. Both are witnessed, not participated in. | Paul shakes the snake into the fire. Nothing happens. The crowd revises its theory twice in one afternoon. | *"The islanders showed us unusual kindness."* — Acts 28:2 (the welcome at Melta — note: unusual kindness. The same vocabulary as §SPARK-01.) |

---

### §PAUL-01-E. Key Event Vignettes — Fighter-Integrated Rewrites

These replace the corresponding passages in `lab-report-saul-paul-vignette-spec.md`. They are not replacements for the full lab report — they are additions that insert the Fighter's physical presence into the existing scene texts.

---

**KS — The Basket Descent (addition to existing KS node text)**

The rope is made of cloth strips. This was not pre-planned — the cloth was taken from the room. You knotted it yourself. Seven knots, tested against the window frame. The basket is market-grade, meant for vegetables; it will hold the weight if the weight is distributed and the descent is controlled. You know this because you have dropped things in baskets before and you know what controlled means.

He gets in. He is not heavy. He does not speak. There is nothing to say at this moment — the guards at the eastern gate change at the third hour; you are ahead of the change; the window points west; the mathematics of this are in your favor if the knots hold.

They hold.

The last three feet you lower slowly because you can hear him breathing. He lands and crouches, and then he is moving and you are pulling the rope back up and you do not watch him go because watching him go means watching the western road and you are watching the eastern gate.

The gate guard does not turn.

*"Through a window in the wall his disciples lowered him in a basket."* This is what will be written down later, by someone who was not there. The facts are accurate. They do not include the knots.

---

**PL — Seven Stairs, Then Five (addition to existing PL node text)**

At midnight there is an earthquake.

This is the fact. Earthquakes do not announce themselves. The prison floor moves the way floors should not move, and the door — the door that required a key and a guard and a formal process — swings open. The chains on the wall come loose. Not just Paul's and Silar's: all of them. Every prisoner in the block is free, in the technical sense, at midnight.

No one moves.

This is important. You are in the cell across the corridor. You are free to leave. You are staying because Paul is staying and you are his escort and he has not indicated that he is leaving. He is still singing. Silar has stopped, but Paul has not stopped.

The jailer wakes in a dark room where the doors should not be open. He draws his sword. You know this sound — the specific sound of a man who has decided to die rather than answer for something. You have three seconds to cover the distance or the sound becomes a different sound.

*"Do yourself no harm."* Paul says this before you reach the doorway. His voice is not loud.

The jailer drops the sword. You are still moving.

Later, in the jailer's house, the household eats together at a table in the middle of the night. You eat. Paul eats. Silar eats. You count seven stairs on the way down from his apartment and five more after the landing. Lyra's house had stairs like that.

*"He was filled with joy because he had come to believe in God — he and his whole household."* — Acts 16:34. The Fighter notes this: the whole household. Not the jailer alone. The jailer understood something and brought everyone with him. This is how it moves.

---

**MT — Two Hundred and Seventy-Six (addition to existing MT node text)**

Before the hull goes, Paul addresses the 276. This is unusual behavior on a sinking ship. The crew has been working for fourteen days without eating — the storm, the gear thrown overboard, the constant pumping. Paul stands in the middle of the ship and says: eat. Specifically: not one of you will die. He says this plainly.

You distribute the bread. This is a practical action — 276 people need to receive bread on a moving deck in high weather, and someone has to pass it. You pass it. Paul breaks it first and gives thanks, and then you pass the rest. The number is real. You know how many people are on this ship because you asked the ship's log keeper on the second day.

When the hull goes on the sandbar, the soldiers want to kill the prisoners so none escape. You stand in the way of this. The centurion stops his soldiers because he wants to save Paul, and Paul gets out alive, but you are the reason the moment pauses long enough for the centurion to make the order. The pause is four seconds.

Everyone reaches shore. The number at the start is the number at the end.

---

### §PAUL-01-F. Theme Cross-References

Each major Paul arc event maps to a theme running through the existing game. These cross-references should be surfaced in the quest investigation card (§WORLDBUILDER-02) when the player views any Paul quest.

| Event | Theme | Parallel arc |
|-------|-------|-------------|
| The basket descent — the rope is knotted cloth, improvised, specific | Objects that carry weight; improvised care | §GR: Aldo's net, folded in his coat pocket; the object that says everything |
| The blind days — bread on the table, unmoved, three days | Sensory specificity as testimony; the one anchor | §WISDOM-01: Froberger's taxonomy correction sent to a general address |
| The prison song at midnight | Kindness in a place that is not built for kindness | §SPARK-01: The cat and the mouse; kindness that changes what a space does |
| The snake at Melta — crowd's theory is wrong twice | The friendly monster; wrong assumption, plain correction | §HUNT-01: the creature is not what anyone thought |
| The 276 number — specific, documented | Specificity as testimony against abstraction | §GR: the three city blocks; the account book |
| The jailer's household eating at midnight | A household that decides together | §GR: Lyra's household; the household as the unit of decision |
| Paul's letters from house arrest | What survives; what extends past where you can walk | §WISDOM-01: the Ardley Manuscript; things written become things that outlast |
| The Aethon altar — *To the Unknown God* — find the entry point | Institutions that hedge honestly; the gap acknowledged | §NAVAL-01: Keel protecting something she cannot name; the gap between what is documented and what is known |
| "Unusual kindness" at Melta — the islanders | Kindness as the operative word | §SPARK-01: the harmonyChainComplete flag; the world that recognizes kindness |
| The conversion is not described, only reported | The restraint is the testimony | §GR: "What Remains" — grief not named, enacted through objects |

---

### §PAUL-01-G. Real Quote Index

Quotes cleared for use in-game. All are sourced from Acts or the Pauline letters. Used as: disposition quotes, node text fragments, or NPC voice lines. They are in plain English — not archaic, not stylized. They land the way a man lands who has said something many times and is no longer performing it.

| Quote | Source | Use |
|-------|--------|-----|
| *"Saul, Saul, why are you persecuting me?"* | Acts 9:4 | `quest_road_kesra` disposition |
| *"Brother Saul, the Lord Jesus... has sent me so that you may see again."* | Acts 9:17 | `quest_anath` disposition — Anath's voice line |
| *"Through a window in the wall his disciples lowered him in a basket."* | Acts 9:25 | `quest_basket_descent` node text fragment |
| *"He will stay with me."* | Acts 9 (Barnabas) | `quest_barnach_vouches` disposition |
| *"You are a child of the devil and an enemy of everything that is right."* | Acts 13:10 | `quest_ezzir` — Paul to Ezzir, in the room, in front of the governor. Said plainly. |
| *"He got up and went back into the city."* | Acts 14:20 | `quest_stoning_lythros` disposition — the sequence is the documentation |
| *"About midnight Paul and Silas were praying and singing hymns to God, and the other prisoners were listening."* | Acts 16:25 | `quest_prison_phillam` node text — the prisoners are listening |
| *"Do yourself no harm."* | Acts 16:28 | `quest_prison_phillam` — Paul to the jailer. Said before the Fighter reaches the door. |
| *"He was filled with joy because he had come to believe in God — he and his whole household."* | Acts 16:34 | `quest_prison_phillam` storyRender close |
| *"To an Unknown God. What therefore you worship as unknown, this I proclaim to you."* | Acts 17:23 | `quest_unknown_altar` — Paul on the public hall steps |
| *"Not one of you will lose a single hair from his head."* | Acts 27:34 | `quest_shipwreck_melta` — Paul to the 276, before the hull goes |
| *"Therefore I urge you to take some food. You need it to survive."* | Acts 27:34 | `quest_shipwreck_melta` node text — before the bread distribution |
| *"The islanders showed us unusual kindness."* | Acts 28:2 | `quest_snake_melta` — the Melta welcome; cross-references harmonyChainComplete |
| *"My grace is sufficient for you, for my power is made perfect in weakness."* | 2 Corinthians 12:9 | The Thorn item tooltip — the only line that appears there |
| *"I have learned, in whatever state I am, to be content."* | Philippians 4:11 | `ST` node text fragment — the apartment; the letters; the open ending |

---

### §PAUL-01-H. Vignette Register (Voice Tone — English Spoken)

The Littoral Courts arc (`§SIREN-01`) uses compressed French present-tense syntax — sentence fragments, calibrated ambiguity, implied perspectives. The Paul arc uses the opposite: **spoken English, full sentences, plain verb tense, no compression**. The events are documented, not evoked. Paul's voice in particular sounds like someone who has described these events many times to many different rooms and has stopped trying to make them interesting — because the facts are already interesting and the embellishment would diminish them.

The Fighter's sections use second-person present tense (same as the rest of Roll2Hit). Paul's sections can be third-person present tense, observed — "He gets in the basket. He does not speak." This maintains the separation between witnessing and participating, which is the Fighter's structural position throughout.

Object-anchored: every major scene has one object that carries the weight of the scene. The basket. The bread on the table. The seam on the tent. The snake on the fire. The warrant letters in the inner pocket. The door that should not be open. These objects should appear in both the quest description and the node text — the same object, named twice, from two distances.

Direct quotes from source material are used sparingly and exactly: one per quest, in the disposition slot or as a fragment in the node text. They are not explicated. They appear and the scene moves on.

---

### §PAUL-01-I. Implementation Checklist

This section specifies what needs to change from the existing §FUTURE-01 implementation to match the §PAUL-01 revised design. All nodes exist; quests are partially implemented; what is missing is the Fighter's presence layer and the two new quests.

- [ ] Add `quest_basket_descent` to QUEST_DB (STR Athletics DC 12, node: KS, activateCond: `kesraMadnessWISSave` complete, completion signal: `kesraBasketComplete`)
- [ ] Add `quest_prison_phillam` to QUEST_DB (WIS Insight DC 12, node: PL, activateCond: `lyraConverted`, completion signal: `phillippiJailerConverted`) — currently the prison event fires as a storyRender block only; needs a player-facing skill check
- [ ] Revise existing quest `desc` fields to add Fighter-presence clauses (one sentence per quest noting the Fighter's physical position/action during Paul's moment)
- [ ] Add Fighter second-person sections to KS, PL, and MT node texts (see §PAUL-01-E vignettes above)
- [ ] Add `quest_basket_descent` disposition and `quest_prison_phillam` disposition using quotes from §PAUL-01-G
- [ ] Update `_S_DEFAULTS` with two new flags: `kesraBasketComplete: false`, `phillippiJailerConverted: false`
- [ ] The Thorn permanent status effect tooltip: replace current (none/empty) with the 2 Corinthians 12:9 quote, exact text
- [ ] `quest_snake_melta` disposition: add "The islanders showed us unusual kindness." — cross-references the harmonyChainComplete world-state (if `harmonyChainComplete: true`, add a second line: "You have seen this before. It moves the same way.")
- [ ] `quest_unknown_altar` Fighter section: add DEX Stealth DC 11 pre-check to scout the hall exits before Paul takes the steps; Fighter result appears in storyRender pass/fail text
- [ ] Revise `quest_stoning_lythros` to add STR Athletics DC 13 Fighter extraction check; current version has only Paul's survival event with no Fighter participation
- [ ] Ensure all real quotes from §PAUL-01-G appear exactly as written — no paraphrase, no archaic substitution

## §SIREN-01 — The Four Courts of the Littoral Sea

> **Status:** ✅ Implemented 2026-05-28 (Layer 104b). 10 nodes (LJ0→LCA + LSO Overseer branch), 5 quests (4 courts + quest_sea_overseer), 6 NPC arcs, 3 sea battles, LJ3 navigator trigger, LCA betrayal-count arc-close. Entry: DS.E → LJ0(r:25,c:14), chain at c:14 rows 25→41; LSO at (r:37,c:18). Lab report: `lab-report-littoral-courts.md`.

### §S01-A. The Central Argument

A knight receives a commission requiring four courtly seals from four coastal harbor-courts that control the southern sea lanes. The seals are freely given — but the process of obtaining each one enacts a pattern the knight is asked to read.

Each Lady rules one harbor and uses one word as a social instrument: BUSY (*Occupée*), MAYBE (*Peut-être*), FRIEND (*Ami*), SOON (*Bientôt*). Each word is a frame — a way of shaping the knight's position without naming that it is a tool. The arc is not about treachery or declared opposition. It is about calibration: four courts testing whether the knight will anchor or drift.

The arc borrows its three-betrayal spine from the Succubus/Incubus lore: betrayal of thought, word, and deed. Failing the skill check at the first three courts sets the corresponding betrayal flag. The arc does not punish failure — it witnesses it. The final court (SOON) resolves the pattern regardless of score.

**Battles are with the sea, not the courts.** The Ladies never fight. The ocean does.

Writing register: all court prose and NPC voice in compressed present-tense French vignette style. Two perspectives are implied at every encounter — the Lady's calibration and the knight's position — without either being named. The gap between perspectives is the subject. No word in the text declares what the manipulation is. The skill check vignette text frames the moment without framing it as a lesson.

### §S01-B. Node Chain

| Node | Code | Label | Type | Encounter |
|------|------|-------|------|-----------|
| Entry junction | `LJ0` | The Littoral Passage | Junction (entry) | none; connects DS.E |
| First court | `LC1` | Port Aurel — The Tide Keep | Court | `quest_aurel_tide` WIS Insight DC 12 |
| First crossing | `LJ1` | First Crossing | Open water | Sea Serpent × 2 |
| Second court | `LC2` | Port Calice — The Drawbridge Court | Court | `quest_calice_bridge` INT Investigation DC 13 |
| Second crossing | `LJ2` | Second Crossing | Deep water | Deep One × 3 |
| Third court | `LC3` | Port Mireille — The Cape Court | Court | `quest_mireille_ami` CHA Persuasion DC 14 |
| Third crossing | `LJ3` | The Serpent Passage | Long battle | Sea Serpent × 1 (solo, full HP) |
| Fourth court | `LC4` | Port Solen — The Far Harbor | Court | `quest_solen_horizon` WIS Insight DC 13 |
| Arc close | `LCA` | The Southern Anchorage | Terminal | storyRender: betrayal count text |
| Overseer branch | `LSO` | The Fog Bank — Open Water | Parallel dead-end (LJ3.E) | `quest_sea_overseer` WIS Insight DC 15 |

**Coordinates:** c:14, r:25 (LJ0) → r:41 (LCA), 2-row steps. LSO: (r:37,c:18), 4 cols east of LJ3. Entry probe: DS(r:25,c:10).E → LJ0(r:25,c:14), gap=4.

### §S01-C. The Four Courts

| Court | Lady | Word | The Frame | Skill Check |
|-------|------|------|-----------|-------------|
| Port Aurel | Lady Aurel | BUSY (*Occupée*) | Warmth given in installments. The tide table is open on her desk. She reads it while speaking; she speaks while reading it. Every appointment is borrowed from the schedule. | WIS Insight DC 12: read that the schedule is calibration, not fact — that she sees you exactly as often as she has decided to |
| Port Calice | Lady Calice | MAYBE (*Peut-être*) | The drawbridge chain hangs visible in the courtyard below the window. She says: perhaps at the evening tide. The evening tide exists. The wheel is in the courtyard. The wheel is not locked. | INT Investigation DC 13: find the wheel mechanism; cross without waiting for her tide |
| Port Mireille | Lady Mireille | FRIEND (*Ami*) | She introduces the knight to her court before the herald can: "My most trusted companion." The court receives this. The frame is set before the knight can set one. | CHA Persuasion DC 14: address the court with name and title; name your standing before it names you |
| Port Solen | Lady Solen | SOON (*Bientôt*) | She points at a specific ship on the horizon. "My captain returns soon — he carries the letters of passage." The fishermen at the dock have watched that ship for three seasons. It has not moved. | WIS Insight DC 13: ask the fishermen; bring the specific fact back to Lady Solen; require a real date |

### §S01-D. Betrayal Mechanic

Three flags track skill-check fails: `betrayalThought` (Aurel/BUSY), `betrayalWord` (Calice/MAYBE), `betrayalDeed` (Mireille/FRIEND). A fourth flag `solenSoonRead` tracks the horizon check. At LCA, storyRender counts the flags and renders the arc close:

- **0 betrayals:** "The four courts gave their seals. You gave them nothing but your position. The sea behind you is the same sea."
- **1–2 betrayals:** "The seals are in your coat. You have been shaped by the crossing. The shaping was not requested. You notice it now that the water is still."
- **3 betrayals:** "You gave something at each harbor that you did not mean to give. The water is still. The stillness is the first moment of stillness since Port Aurel."

### §S01-E. Sea Crossings

| Crossing | Battle Label | Key | Count | Design Note |
|----------|-------------|-----|-------|-------------|
| LJ1 | Sea Spawn × 2 | `sea_serpent` | 2 | Shallow deep water; two creatures, standard difficulty |
| LJ2 | Deep One × 3 | `deep_one` | 3 | Old things coming up from the second fathom; known key from AT |
| LJ3 | The Serpent of the Passage | `sea_serpent` | 1 | Solo long battle; the creature holds the channel; labeled as a named creature |

### §S01-F. New State Flags

```
// §SIREN-01: Littoral Courts
aurelTideRead: false, betrayalThought: false,
caliceBridgeCrossed: false, betrayalWord: false,
mireilleAmiNamed: false, betrayalDeed: false,
solenSoonRead: false, littorialComplete: false,
seaOverseerMet: false, charmResisted: false,
```

**Flag notes:** `betrayalThought/Word/Deed` set via `checkFailFlag` on skill-check fails at LC1/LC2/LC3. `seaOverseerMet` = FAIL flag for Overseer quest (accepted the offer). `charmResisted` = PASS flag (named the structure, refused). `littorialComplete` set by Harbor Keeper IIFE at LCA (not a quest completion).

---

## §CROWN-01 — The Three Crowns of the Swamp (✅ Implemented — Layer 105)

> **Status:** ✅ Implemented 2026-05-28. 9 nodes (WG0/HW1/HJ1/HG1/HJ2/HN1/HJ3/INN/HCA, num:121-129, c:3). 24 quests live. Kindness Meter + Crone Mark mechanics active. INN free booking + Mère Boudine reveal wired. HCA Crone Mark conversion block fires at arc close. Coord correction: c:2→c:3 (EC conflict); HJ1 at r:21. Lab report: `lab-report-crown-three-hags.md`.

### §C01-A. The Central Argument

The Crones at HS have names, faces, and trades. They have been fixtures since Layer 16. What they have not had is territory — a deepening. The Crown arc corrects this: each Crone has a domain in the darker swamp, and each domain is a different face of the same ancient force. The force is generative and devouring. It gives and takes back. It is womb and tomb in the same moment.

Three archetypal forms of devouring darkness — one per Crone. Each manifests as a specific failure mode of care: the care that withholds, the care that smothers, the care that consumes through weakness. The player navigates three crowns of the deep swamp, meeting each Crone in her own territory, passing her specific test.

At the center sits an inn. The innkeeper is a hag with no category for genuine kindness. The arc asks: what does the devouring force do when it encounters something it cannot reabsorb?

**The answer is not combat.** The junction nodes have monsters. The Crowns do not. The Crowns are won with attention, with naming, with small acts of genuine care that the Crones have no protocol for. The player accumulates Crone Marks (1 per quest passed) which convert at arc close to permanent stat bonuses. The Innmother tracks a separate Kindness Meter. Free booking unlocks at Kindness ≥ 5.

### §C01-B. Characters

| Character | Crown | Two Archetypes | The Word | Domain |
|-----------|-------|----------------|----------|--------|
| Whisper | Crown of Absence | Neglectful + The Saint | NOTHING (*Rien*) | Still water — absence consumes as surely as presence |
| Glut | Crown of Excess | Over-Nurturing + Overprotective | MORE (*Encore*) | The feeding pool — gives until giving becomes taking |
| Wane | Crown of Diminishment | Neurotic + Anxious | LESS (*Moins*) | The drained mire — reduces everything including herself |
| The Innmother | The Inn | All five consolidated | MINE (*À moi*) | The swamp inn — terrible manners, no category for kindness |

**The Innmother** is not named until Kindness ≥ 3. Before the threshold she is "the innkeeper." Her inn is functional — beds, a fire, meals — all terrible, all real. She has been running it alone since before the swamp had its current shape. Her bad manners are not malice. They are the behavior of something that has never been genuinely met. She corrects the way you hold the spoon. She assigns the worst room without asking. She charges for things she never mentioned. None of this is performance. This is how she operates when no one has ever come back to say the room was worth it.

**Kindness Meter:** `S_story.innmotherKindness`, integer, starts 0, does not decay. Each PASS on a Crown quest = +1. Each Inn quest completed = +1. At ≥5: Free Booking unlocked (free sleep at INN for remainder of run). At ≥7: she says her name — the arc's emotional close.

### §C01-C. Node Chain

| Code | Label | Type | Connection | Primary Content |
|------|-------|------|-----------|-----------------|
| WG0 | The Deeper Gate | Junction | HS.S → WG0; WG0.S → HW1 | Entry narration only |
| HW1 | Whisper's Crown — The Still Water | Crown | WG0.S → HW1; HW1.S → HJ1 | 6 Whisper quests |
| HJ1 | The First Mire | Junction/Combat | HW1.S → HJ1; HJ1.S → HG1 | Will-o'-Wisp × 2 |
| HG1 | Glut's Crown — The Feeding Pool | Crown | HJ1.S → HG1; HG1.S → HJ2 | 6 Glut quests |
| HJ2 | The Second Mire | Junction/Combat | HG1.S → HJ2; HJ2.S → HN1 | Bog Hag × 2 + Swamp Horror |
| HN1 | Wane's Crown — The Drained Mire | Crown | HJ2.S → HN1; HN1.S → HJ3 | 6 Wane quests |
| HJ3 | The Dark Passage | Junction/Combat | HN1.S → HJ3; HJ3.S → INN | Shadow Drake (boss) |
| INN | The Innmother's Hall | Inn/Arc | HJ3.S → INN; INN.S → HCA | 6 Inn quests; Kindness Meter |
| HCA | The Deeper Clearing | Resolution | INN.S → HCA | Crone Mark conversion; arc close |

### §C01-D. Crown of Absence — Whisper's Domain (HW1)

Whisper's archetype: the care that withholds. Not cold. Not hostile. Simply absent — in the specific way of things that were once present and have learned to absent themselves as a form of control. The Still Water reflects the sky back. Nothing moves in it. The absence is the information.

Her word is NOTHING. She will not name what she wants. She will not say what the test is. The test is to notice what is not there and name it without accusing.

**Node text register:** The water is still enough to read by. Not glass — water — but the stillness is so complete that the sky comes down to the surface and stays there. Whisper is at the edge. She is not looking at you. She has been not looking at you since you arrived, which is a thing she does deliberately, which you would know if you had been paying attention to the quality of the deliberateness.

| ID | Title | Type | DC | What It Tests |
|----|-------|------|----|--------------|
| quest_whisper_01 | The Unspoken Request | skill_check | WIS Insight 12 | Read what she wants without being told |
| quest_whisper_02 | The Withheld Name | skill_check | INT Investigation 13 | Find who in the swamp she has stopped naming |
| quest_whisper_03 | The Empty Gift | skill_check | WIS Perception 12 | Identify which of her three offered gifts is hollow |
| quest_whisper_04 | The Absent Warning | skill_check | WIS Insight 14 | Notice what she failed to tell you before it matters |
| quest_whisper_05 | The Saint's Work | completion | — | Bear witness to her hidden care without being asked; no fail state; Kindness +1 |
| quest_whisper_06 | The Forgiven Absence | skill_check | CHA Persuasion 13 | Give her the space to be present now; do not demand she explain the past |

**PASS register (quest_whisper_01):** You do not ask what she wants. You name the thing you notice is missing — the item that should be on the bank, the name she did not say, the direction she did not look toward. You say it once. She turns. She gives you the mark. She turns back. Neither of you names what just happened.

**FAIL register (quest_whisper_01):** You wait for her to tell you. She does not tell you. The water is still for a long time. Eventually she nods toward the bank and you follow what you think she means and get it partly right. She accepts it. You have given her the answer she already knew would come — the approximate one, the one that arrives when nobody looked carefully enough.

**Disposition:** *"You brought the right thing. You did not ask how I knew you would."* — The Still Water, Whisper's Crown

### §C01-E. Crown of Excess — Glut's Domain (HG1)

Glut's archetype: the care that smothers. The Feeding Pool is warm. The water is warm. The food she offers is warm. Everything at Glut's Crown is comfortable and slightly too much. The exit is hidden under the offer of more.

Her word is MORE. She offers the extra portion, the additional warning, the second helping, the third. The test is to recognize when MORE has become the cage — and name it without refusing her entirely. Full refusal reads as rejection. Rejection makes her dangerous.

**Node text register:** The pool surface has a film on it. Not algae — warmth. The warmth rises from below, which means the source is deeper than the surface, which means the comfort she offers is not generated here but conducted from somewhere else, through something that has been here much longer than the pool has. Glut stands in the shallows. The water is at her waist. She has been here long enough that the water has adjusted to her.

| ID | Title | Type | DC | What It Tests |
|----|-------|------|----|--------------|
| quest_glut_01 | The Offered Feast | skill_check | WIS Insight 13 | Decline the second portion without offense |
| quest_glut_02 | The Smothering Gift | skill_check | CHA Persuasion 13 | Return what she gave without reading as ungrateful |
| quest_glut_03 | The Locked Door | skill_check | INT Investigation 14 | Find the exit hidden under the comfort |
| quest_glut_04 | The Endless Feeding | skill_check | WIS Insight 13 | Name the pattern of the offering without naming her as the trap |
| quest_glut_05 | The False Protection | skill_check | WIS Insight 15 | Name what she is actually protecting herself from |
| quest_glut_06 | The Open Hand | completion | — | Release the Glut-gift into the pool. Requires `glut_gift` item obtained at HG1. No check. |

**PASS register (quest_glut_03):** The exit is under the warmest part of the room — the part where the food smells best, where the fire reaches. You cross it without lingering. You do not apologize for leaving. She watches from the far side of the pool. When you reach the threshold she says: good. She says it quietly, to the water.

**FAIL register (quest_glut_03):** You stay for the meal. The meal is good. You stay for the second. The exit does not find you until you have eaten three times and slept once and she has already given you the gift you did not want and you are carrying it when you finally cross. She waves from the bank. She has been waving goodbye in this direction for longer than you have been in the swamp.

**Disposition:** *"The door has always been there. You are the fourth person this season to find it on the first crossing."* — The Feeding Pool, Glut's Crown

### §C01-F. Crown of Diminishment — Wane's Domain (HN1)

Wane's archetype: the care that drains through its own grief. The Drained Mire is colorless — not dark, not grey, colorless in the particular way of things that have had the color extracted over time. Wane was here before the other Crones had their crowns. She has been waning since before the swamp was named.

Her word is LESS. Less time. Less hope. Less you, after she's done, than before. She does not intend the drain. She cannot hold herself and so the automatic draw is sideways. The skill is not to fight it. The skill is to remain full while in her presence — which is harder than fighting.

**Node text register:** The grass does not grow toward the light here. It grows lateral — across the mire surface, covering it, waiting for what is in the surface to finish waning so there is room. Wane is seated on a stone that has been seated on for long enough that the stone remembers it. She is wearing something she has been wearing since before the color left this place. She looks up when you arrive as if she expected you later, or earlier, or someone else.

| ID | Title | Type | DC | What It Tests |
|----|-------|------|----|--------------|
| quest_wane_01 | The Carried Grief | skill_check | WIS Insight 12 | Decline to carry her weight without cruelty |
| quest_wane_02 | The Diminishing Task | skill_check | STR or INT 13 | Complete what she says cannot be done |
| quest_wane_03 | The Hopeless Errand | skill_check | INT Investigation 13 | Return what she claims is permanently lost |
| quest_wane_04 | The Burden | skill_check | CON or WIS 14 | Hear her full history without being consumed by it |
| quest_wane_05 | The Drain | skill_check | WIS Insight 13 | Notice the drain while it is happening and name it |
| quest_wane_06 | The Refusal | skill_check | CHA Persuasion 14 | Say no to her tragedy — not cruelly, simply no |

**PASS register (quest_wane_01):** She gives you her grief in the form of a stone. Not literally — she places her hand over yours and the weight transfers, which is what she does, which is what she has always done and which you name as the thing it is: I am not the place for this. You say it before the weight arrives. She takes her hand back. She holds the weight herself. She has not done that in a long time. She looks at her own hands.

**FAIL register (quest_wane_01):** You take the weight because it seems small and she seems tired. The weight is not small. You discover this in the second hour of the next crossing, when the mire is heavier than it should be and you cannot account for the difference and she has already moved on to the next thing she needs you to carry.

**Disposition:** *"You gave it back. Most people take it and don't realize they've taken it until they're out of the swamp and by then it's theirs."* — The Drained Mire, Wane's Crown

### §C01-G. The Innmother's Hall (INN)

The INN node is the arc's center of gravity. It is reached after the Dark Passage and before the resolution. The Innmother assigns the worst room without asking. She corrects the way you hold the spoon. She charges for things she never mentioned. She knows when you are tired and selects that moment to demand something.

None of this is performance. She has been running the inn since before the swamp had its current geography and no one who came through the door ever came back to say the room was worth it. She has developed no protocols for kindness because kindness has not presented itself as a category worth developing protocols for. She will be surprised exactly once, and she will not show it, and you will see it anyway.

**Six Inn Quests — Kindness Meter Actions:**

| ID | Title | Action | DC | Kindness |
|----|-------|--------|----|---------|
| quest_inn_01 | The First Night | Sleep without complaint (automatic on first sleep) | — | +1 |
| quest_inn_02 | The Unrequested Thing | Bring her something she needs before she asks | WIS Insight 12 | +1 |
| quest_inn_03 | The Correction | Name her bad manners without anger | CHA Persuasion 13 | +1 |
| quest_inn_04 | The Tired Hour | Notice she is tired and say so with no expectation | WIS Insight 12 | +1 |
| quest_inn_05 | The Return | Leave INN and return; she notes you came back | movement completion | +1 |
| quest_inn_06 | The Free Booking | Threshold: Kindness ≥ 5; she gives Innmother's Key | — | unlock |

**Full vignette — quest_inn_03, "The Correction":**

> At the table, she corrects the way you hold the spoon.
>
> This is not the first time. It is the third. The spoon is held incorrectly in the same direction each time, which means you have not changed and she has not stopped noticing.
>
> The correction is delivered the way someone delivers information they have delivered before and expect to deliver again. There is no malice in it. There is also no expectation that it will stop bothering you, because she has already decided how much things bother most people and most people do not surprise her.
>
> You set the spoon down. You say: you correct things, and I notice that you do, and I am not leaving.
>
> She looks at the spoon. She does not say anything. She picks up her own bowl and continues.
>
> This is the first time the correction has produced a response she did not already have a category for.

**PASS:** The spoon stays on the table. She says nothing for long enough that the fire in the grate changes its sound. Then she resumes her meal. You have not won. You have simply given her something she has not been given before: a person who stayed in the room with the truth of what she does and did not leave because of it. That is the whole of what happens. It is enough.

**FAIL:** You apologize for the spoon. She corrects it again. You apologize again. By the third correction you have established that apology is available, which means the corrections will continue at the intervals she decides, which is what happens for the rest of the evening. She is not cruel. She is simply thorough, and thoroughness requires something to be thorough at.

**At Kindness = 7:** Her name appears in the INN quoteFn for the first time. The line is short. It does not explain anything. She says: *"Mère Boudine. Since you'll keep coming back anyway."* The line does not fire again.

**Disposition:** *"I ran this inn before the swamp had its current shape. No one who came through the door ever came back to say the room was worth it. You came back."* — The Innmother's Hall

### §C01-H. Crone Marks & Arc Close (HCA)

Each PASS on any of the 18 Crown quests (Whisper 1–6, Glut 1–6, Wane 1–6) = +1 to `S_story.croneMarks`. At HCA, a `storyRender` injection reads the count and converts:

| Marks | Conversion |
|-------|-----------|
| 6–9 | +1 permanent bonus to one ability score (player chooses) |
| 10–14 | +1 ASI + 1 Crone Bead (Necklace of Knowledge variant, swamp-lore) |
| 15–18 | +1 ASI + Crone Staff (new unique weapon, WIS-scaling) + permanent advantage on WIS saves vs. charm |

FAIL states do not subtract marks — they simply do not add. A player who passes zero Crown quests still completes the arc and still receives the Innmother's Key if Kindness ≥ 5.

**Arc close register (HCA — The Deeper Clearing):**

> The swamp ends here. Not abruptly — it thins, the way things that have held on for a long time thin when they finally release. The color comes back gradually, not all at once.
>
> The Crone Marks are in your coat. They are not heavy. They are the weight of things that were noticed — three crowns of the deep swamp, and the things you named in each one, and the hag who told you her name after seven rooms of not telling you.
>
> The Deeper Clearing has a path going south. It did not have a path going south until now.

### §C01-I. New State Flags

```
// §CROWN-01: The Three Crowns
whisperCrownComplete: false,   // all 6 Whisper quests done
glutCrownComplete: false,      // all 6 Glut quests done
waneCrownComplete: false,      // all 6 Wane quests done
innmotherKindness: 0,          // kindness meter (0–7+)
innmotherNamed: false,         // she said her name (Kindness ≥ 7)
freeBookingUnlocked: false,    // Kindness ≥ 5; permanent free sleep at INN
innmotherKeyGiven: false,      // HCA exit opened
croneMarks: 0,                 // total Crone Marks accumulated (0–18)
croneMarksBanked: false,       // arc close conversion complete at HCA
glut_gift_held: false,         // Glut-gift in inventory (required for quest_glut_06)
```

### §C01-J. Combat at Junction Nodes

| Node | Battle Label | Key | Count | Design Note |
|------|-------------|-----|-------|-------------|
| HJ1 | Will-o'-Wisp × 2 | `will_o_wisp` | 2 | Absence given light; leads nowhere; resists physical |
| HJ2 | Bog Hag × 2 + Swamp Horror | `bog_hag` | 2 | Excess embodied; they offer and take simultaneously |
| HJ3 | Shadow Drake | `shadow_drake` | 1 | Solo boss; the last resistance before the inn; its presence dims everything around it |

Verify `will_o_wisp`, `bog_hag`, `shadow_drake` against MONSTER_POOL before implementation — add to WORLD_DB if absent.

### §C01-K. Lab Report Gate

Write `lab-report-crown-three-hags.md` before any HTML edit. Lock:
- All 10 `S_story` field names (§C01-I)
- All 24 quest IDs (18 Crown + 6 Inn)
- Node codes WG0, HW1, HJ1, HG1, HJ2, HN1, HJ3, INN, HCA
- NODE_COORDS `{r,c}` positions for all 9 new nodes
- Kindness Meter threshold values (5 = free booking; 7 = name)
- Crone Mark conversion table
- New monster keys and whether they exist in MONSTER_POOL
- `glut_gift` item definition (`{name, icon, sell}`)
- Innmother's Key item definition
- Crone Staff weapon definition (if marks ≥ 15)

---

## §LXX — The Atlantean Shore (✅ Implemented — Layer 106)

**Status:** ✅ Implemented 2026-05-28

**Summary:** Four-node arc extending south of HCA after the Leviathan is defeated. The path opens only when `defeatedBattles['HCA_BOSS']` is set. The arc resolves the iodine/Atlantean smelting thread from §CROWN-01 Amendment A — the player follows the shore road to the Drowned Shore, navigates the Kelp Channel (Giant Eel × 2), and reaches the Atlantean Forge where the Sea Element can be smelted.

| Node | Code | num | Coords | Content |
|------|------|-----|--------|---------|
| The Shore Road | `DS0` | 130 | r:34, c:3 | Junction; gate: HCA_BOSS kill required |
| The Drowned Shore | `DS1` | 131 | r:36, c:3 | Tide Reader NPC; `quest_shore_02` (WIS DC 12) |
| The Kelp Channel | `DSJ` | 132 | r:38, c:3 | Battle: Giant Eel × 2 (`DSJ_EELS`) |
| The Atlantean Forge | `DSF` | 133 | r:40, c:3 | Forge Echo NPC; `quest_forge_01` (INT DC 14) + `quest_forge_02` (smelting) |

### §LXX-A. Quests

| ID | Title | Type | Node | Gate | DC | Reward |
|----|-------|------|------|------|----|--------|
| `quest_shore_01` | "The Path Opens" | side completion | HCA | `HCA_BOSS` killed | — | 200gp, 200 XP; `shorePathFound` |
| `quest_shore_02` | "The Bed Register" | skill_check | DS1 | always active | WIS DC 12 | 2× Swamp Kelp + 150gp, 150 XP; `kelpBedsCharted` |
| `quest_forge_01` | "The Mechanism" | skill_check | DSF | `atlanteanProcessKnown` | INT DC 14 | 300gp, 300 XP; `forgeActivated` |
| `quest_forge_02` | "The Smelting" | side completion | DSF | `forgeActivated` + Iodine Salt in inv + at DSF | — | Sea Element + 400gp, 400 XP; `seaElementCrafted` |

### §LXX-B. The Sea Element

The arc's terminal reward. Crafted at the forge by consuming any Iodine Salt (plain or charged). A weapon (`type:'weapon'`) with `atkBonus:2, dmgDie:8, dmgCount:1`. The "secret of Atlantas" — the coastal smiths smelted with tidal elements, using iodine reduction to create alloys that hold elemental force.

### §LXX-C. New State Flags

```
// §LXX: Atlantean Shore
shorePathFound: false,
kelpBedsCharted: false,
forgeActivated: false,
seaElementCrafted: false,
```

### §LXX-D. NPCs

- **The Tide Reader** (DS1) — 2-state quoteFn: before/after `kelpBedsCharted`. Records kelp bed positions; bearing to forge noted six years ago, confirmed by player.
- **The Forge Echo** (DSF) — 3-state quoteFn: default (sealed, waiting for sequence knowledge) / `forgeActivated` (ready, complete the process) / `seaElementCrafted` (arc close: "Take it south. The forge has done what it was kept for.").

### §LXX-E. Arc Shape

```
HCA (Leviathan defeated) → DS0 (Shore Road) → DS1 (Drowned Shore, Tide Reader)
  → DSJ (Kelp Channel, Giant Eel × 2) → DSF (Atlantean Forge, Sea Element crafted)
```

The gate at HCA → DS0 is a `storyMove` block requiring `defeatedBattles['HCA_BOSS']`. The forge battle at DSJ uses `code:'DSJ_EELS'`. The smelting completion button appears at DSF only when `forgeActivated` and iodine is in inventory.

---

## §LXXI — The Sunken Hall (✅ Implemented — Layer 107)

**Status:** ✅ Implemented 2026-05-28

**Summary:** Three-node arc extending south of DSF, resolving the Atlantean chain back to the Antecedent's bearing 047° at depth 18m (first noted in §LIII — Station 7). The Tide Gate at DA2 was the original reason the Constructor chose this site for the Antecedent's containment. The Sea Element is the key; `inscriptionRead` (DA1 skill check) gates the Gate activation.

| Node | Code | num | Coords | Content |
|------|------|-----|--------|---------|
| The South Passage | `DA0` | 134 | r:42, c:3 | Junction; entry from DSF |
| The Sunken Hall | `DA1` | 135 | r:44, c:3 | Stone Inscription NPC; `quest_sunken_01` (INT DC 13) |
| The Tide Gate | `DA2` | 136 | r:46, c:3 | Arc close; Gate activation storyRender block |

### §LXXI-A. Quests

| ID | Title | Type | Node | Gate | DC | Reward |
|----|-------|------|------|------|----|--------|
| `quest_sunken_01` | "The Foundation" | skill_check | DA1 | always | INT DC 13 | 250gp, 250 XP; `inscriptionRead`; Atlantean Foundation added to knowledge |
| `quest_sunken_02` | "The Tide Gate" | side completion | DA2 | `inscriptionRead` + Sea Element in inv + at DA2 | — | INT +1 (permanent) + 500gp, 500 XP; `tideGateOpened`; Sea Element consumed |

### §LXXI-B. The Closure

The Gate opens to bearing 047°, depth 18m — the exact coordinates Station 7 was monitoring (§LIII). The Antecedent's containment (§LV) was built on top of Atlantean infrastructure already designed to hold something ancient in place. The chain runs: kelp beds → iodine reduction → forge → Sea Element → Tide Gate. It was laid from the Gate outward by people who knew what the return chain would eventually need.

The arc-close text at DA2 references Station 7, Bertha No-Bank's forty-one volumes, and the Constructor's site selection — connecting the Muffat chain (§LI–§LVIII) to the Atlantean chain (§CROWN-01 Amendment A + §LXX–§LXXI) as two branches of the same deep structure.

### §LXXI-C. New State Flags

```
// §LXXI: Sunken Hall
inscriptionRead: false,
tideGateOpened: false,
```

---

## §LXXII — The Conclave Annex (✅ Implemented — Layer 108)

**Status:** ✅ Implemented 2026-05-28

**Summary:** Post-event resolution of the Cycle 4 thread (§LVIII). When `tideGateOpened` is set, a sealed annex west of SQ (Scholar's Quarter) unlocks automatically. The Conclave Archivist pre-wrote a document for whoever followed the chain to completion. One quest, one document, one knowledge entry. Also adds state 6 to Muffat's quoteFn.

| Element | Detail |
|---------|--------|
| New node | `CAN` — The Conclave Annex, num:137, r:7,c:6, E:'SQ' (SQ.W → CAN) |
| Gate | `storyMove` SQ→CAN: requires `tideGateOpened` |
| Quest | `quest_ca_01` — *The Adjusted Timeline*, side completion |
| Activates | DK, requires `tideGateOpened + cycle4NoteRead` |
| Completes | `conclaveResponseRead` set by reading the post-event document at CAN |
| Reward | 300gp, 300 XP; "Cycle 4 — Post-Event Note" added to knowledge |
| Muffat state 6 | New highest-priority state: `tideGateOpened` — points player to the Annex |

### §LXXII-A. The Post-Event Note

Pre-written document left by the Conclave Archivist at CAN. Text acknowledges: (1) the Gate opened as an expected possible outcome; (2) the monitoring infrastructure was not in position to intervene; (3) the archive answered; (4) Cycle 4 proceeds on adjusted (post-event) timeline; (5) "The person who followed the chain receives this note because they are the archivist the protocol was designed to identify. The note is for them."

### §LXXII-B. New State Flags

```
// §LXXII: Conclave Annex
conclaveResponseRead: false,
```

## §LXXIII — The Depth (✅ Implemented — Layer 109)

**Arc summary:** 1-node terminal arc. DA3 (r:48, c:3) — The Depth, 18 Meters. Accessed via the open Tide Gate (DA2→DA3). Closes the tidal/Atlantean chain and cross-confirms the archival/CY→AC chain via the Antecedent's tidal configuration. Both chains converge at the same geographic coordinate (bearing 047°, depth 18m) that Station 7 monitored since §LIII.

| Node | Code | Terrain | Label | Act | Connections | NPC |
|------|------|---------|-------|-----|-------------|-----|
| 138 | DA3 | sunken_hall | The Depth — 18 Meters | 3 | N:DA2 | The Antecedent |

### §LXXIII-A. Quest

| ID | Title | Type | Activation | Completion | Reward |
|----|-------|------|-----------|------------|--------|
| `quest_depth_01` | The Depth — 18 Meters | ACCOMPLISHMENT | DA2, `tideGateOpened` | `currentCode === 'DA3'` | +500 XP + Knowledge: Constructor Design |

### §LXXIII-B. The Closure

The storyRender block at DA3 fires once (`!antecedentDepthMet`): reveals that the Constructor built both the archival installation (CY→AC) and the tidal installation (DA3) on the same foundation, and designed them to require the same archivist to close both. The Antecedent's NPC dialogue at DA3 delivers the two-chain summation: "You followed the chain from the outside in: courier to berth to manifest to station to chamber to forge to alloy to Gate to depth. And from the other side: crypt to archive to suppressor to signal to chamber to knowledge to question to answer."

Cross-arc connections resolved: §LIII (Station 7 signal origin), §LV (AC first encounter), §LVI–§LVIII (Muffat chain), §LXX–§LXXI (Atlantean Shore + Sunken Hall), §LXXII (Conclave Annex post-event note).

### §LXXIII-C. New State Flags

```
// §LXXIII: The Depth
antecedentDepthMet: false,
```

---

## §SPARK-01 — The Harmony Chain (✅ Implemented — Layer 110)

**Arc summary:** 5-quest friendship vignette arc in Tilbury's port district and aboard the Tilbury Star. French theater vignette structure: 2 acts, 5 scenes. Physical token objects are created, handed, and destroyed as the emotional plot moves. An unlikely chain of friendship — harbor cat → dock mouse → blood tick → bioluminescent mind-control parasite — radiates outward until a pompous King's Inspector with an impossible backstory finally tells the truth. Naval component: a "steamboat who done it" aboard the Tilbury Star where the murder victim is a cargo of imported perfumes and the "monster" is the parasite — which is not dangerous but is *extremely* friendly. The arc is built on improv principles: **yes-and**, **find common ground**, **contrasting energy**, **make others look good**. Every beat asks the player to accept something strange and build on it.

**Design principle:** The Harmony Chain recurs. §SPARK-01 is Tilbury. Future §SPARK-0X arcs can drop anywhere in the world. Each arc: one animal friendship chain, one token object chain, one authority figure with a secret, one mystery. All resolve in harmony.

---

### §SPARK-01-A. Nodes

No new nodes required. Arc uses existing Tilbury infrastructure:

| Node | Code | Label | Act | Notes |
|------|------|-------|-----|-------|
| Harbor Docks | DK | Harbor Docks — Tilbury | 2 | Inspector first appears; Smalt's home |
| Market Quarter | MQ | Tilbury Market Quarter | 2 | Pip's territory; Vendor Mira cameo |
| Aboard Tilbury Star | MS | Aboard the Tilbury Star | 2 | Clot's Revelation + Who Done It |

---

### §SPARK-01-B. New NPCs

**Inspector Aldous Wren-Pembury** (DK, then MS)
- Title: King's Liaison to Port Sanitation and Civil Orderliness, Eastern Reach Commission
- Apparent status: well-dressed, carries an embossed leather case, speaks in formal paragraphs
- Actual status: witness protection; real name Aldous the Fencer; black market broker from Saltwick; in protective custody under a fake crown commission following testimony against the Saltwick Dockmasters' Ring
- His family: a woman who calls herself Lady Elspeth and two children who cannot agree on their own names when asked directly
- Backstory inconsistencies (planted across scenes):
  - Scene 1 (DK): *"The Pembury estate in the Eastern Reach has been in our family three hundred years. I was born there."*
  - Scene 2 (DK): *"My father — the late Admiral Pembury — we are a naval family, always have been."* [contradicts the estate; Eastern Reach has no coastline]
  - Scene 3 (MS): *"My wife Elspeth — we relocated from Saltwick six months ago. Adjusting to Tilbury."* [completely different origin; Saltwick is where his criminal record begins]
  - Scene 5 (confession): *"I am Aldous. Just Aldous. The writ is a printing from Saltwick. The Admiral does not exist. Neither does the estate. I have been here six months because there are people who would strongly prefer I be here for fewer."*
- `quoteFn` states: 6 states keyed to `smaltBefriended`, `pipMet`, `bioluminescentParasiteFound`, `whodunitSolved`, `wrenpemburyInconsistencyNoticed`, `aldousConfessed`

**Smalt** (DK)
- A salt-gray harbor cat, four years resident on the third berth
- Currently "threatening" the docks: specifically, sitting directly on cargo manifests and refusing to move
- Is already friends with Pip, a dock mouse; neither has told anyone
- When befriended: purrs, drops a dried salt fish (creates Smalt's Trust item), begins following the player

**Pip** (DK/MQ)
- A dock mouse; Smalt's best friend; carries a large blood tick named Clot on its left ear
- Was given Pip's Friendship Bead — a gnawed wooden bead from a merchant's abacus — by Smalt as a token
- Pip has been mildly parasitized by The Warmth for approximately two months; this is why Pip and Smalt are friends
- Vendor Mira in MQ has noticed Pip occasionally; describes it as "the calm mouse" with mild concern

**Clot** (MS — Pip's ear)
- A blood tick; large for its kind; bioluminescent amber glow on its dorsal side
- Hosts The Warmth, a colonial microorganism that produces a mild neurological compound inducing oxytocin-adjacent social bonding
- When examined (WIS Medicine/Nature DC 13): Clot falls off cleanly, leaving Clot's Glow (the pustule); harmless; The Warmth is revealed

**The Warmth**
- Not a creature that fights. Not a monster in the combat sense.
- A bioluminescent colonial microorganism. It makes hosts feel warmly friendly toward other creatures they encounter.
- In small doses (Pip, Smalt, the rat catcher Brannick): creates improbable cross-species friendships
- In large doses (the Tilbury Star's perfume cargo vats — warm, liquid environment): the perfumes now smell aggressively warm and intimate instead of elegant and aloof. They've spoiled commercially. The vats have become a Warmth colony.
- The "monster hunt" arc: track the Warmth through the perfume cargo → discover it is benign → discover the rat catcher is fine, actually very happy → complete the mystery without a fight

**Brannick, Rat Catcher** (MS)
- Hired by the captain to keep the hold clear of rats
- Has been Warmth-exposed for ten days
- Is now quietly best friends with the rats; cannot explain it; considers this normal; the rats also no longer hide from him
- Provides key testimony in Scene 4: *"They never bit me once. Even when I had the net. It didn't feel right to use the net after a while."*

---

### §SPARK-01-C. Token Objects (French Vignette — created and destroyed as the play moves)

| Token | Created | Destroyed | Represents |
|-------|---------|-----------|------------|
| King's Writ (Counterfeit) | Scene 1 — Inspector presents it | Scene 5 — Aldous tears it up on confession | The false authority; the performance of legitimacy |
| Smalt's Trust | Scene 1 — cat drops it when befriended | Consumed (eaten by Smalt in Scene 2 as endorsement of Pip) | First kindness; opens the chain |
| Pip's Friendship Bead | Scene 2 — Pip gives it to the player | Handed to Inspector in Scene 5 | Alliance between contrasting creatures |
| Clot's Glow | Scene 3 — tick examined, pustule glows | 1-use torch (warm amber light, 30ft, 1 hour) | The Warmth made visible; the thing that was always there |
| Letter of True Passage | Scene 5 — Aldous writes it | N/A — kept by player | True authority replacing performed authority; future gate use |

---

### §SPARK-01-D. Quest Table

| ID | Title | Type | Node | Activation | Key Check | Completion | Reward |
|----|-------|------|------|-----------|-----------|------------|--------|
| `quest_spark_01` | "Smalt" | SKILL CHECK CHA DC 10 | DK | Always at DK | CHA DC 10 Persuasion (befriend the cat, not convince the Inspector) | `smaltBefriended=true` | Smalt's Trust + 100gp + 100 XP |
| `quest_spark_02` | "The Overture" | ACCOMPLISHMENT | DK | `smaltBefriended` | INT DC 12 — notice Inspector inconsistency (retryable, no fail) | `pipMet=true` | Pip's Friendship Bead + 150 XP |
| `quest_spark_03` | "Clot's Revelation" | SKILL CHECK WIS DC 13 | MS | `pipMet` | WIS DC 13 Medicine/Nature — examine the tick | `bioluminescentParasiteFound=true` | Clot's Glow + 200gp + 200 XP |
| `quest_spark_04` | "The Steamboat Who Done It" | SKILL CHECK INT DC 14 | MS | `bioluminescentParasiteFound` | INT DC 14 Investigation — trace the Warmth through the cargo hold | `whodunitSolved=true` | Letter of Safe Passage + 300gp + 300 XP |
| `quest_spark_05` | "Aldous Comes Clean" | ACCOMPLISHMENT | DK | `whodunitSolved` + `wrenpemburyInconsistencyNoticed` | No roll — player confronts, Inspector confesses | `aldousConfessed=true`, Writ destroyed, Letter of True Passage created | 400gp + 400 XP + Aldous recurring ally |

---

### §SPARK-01-E. 5-Scene Play Structure

**ACT I — The Harbor Stage**

*Scene 1 — "The Problem" (DK)*
The Inspector approaches with the King's Writ (Counterfeit). The cat Smalt has been sitting on cargo manifests since Tuesday. *"By order of the Crown, this animal must be relocated."* The player may: (a) attempt kindness — CHA DC 10 to befriend Smalt; (b) comply — Smalt walks off with dignity, quest branch closes. If befriended: Smalt drops Smalt's Trust (dried salt fish, a personal offering), begins following. Inspector is displeased. The Writ trembles. Token created: Smalt's Trust.

*Scene 2 — "The Overture" (DK → MQ boundary)*
Smalt leads the player to Pip at the MQ border. A cat and a mouse, sitting. The Inspector appears again — cannot help it, he's tracking the Writ. He mentions the Admiral. The player who noticed the Eastern Reach claim in Scene 1 gets the INT DC 12 check here. Pip gives the player its gnawed bead. Smalt eats the Smalt's Trust (endorsement of the alliance). Token created: Pip's Friendship Bead. Token destroyed: Smalt's Trust (consumed as affirmation).

*Scene 3 — "The Revelation" (MS)*
Pip is aboard the Tilbury Star (Pip travels in the player's pocket or pack). The tick Clot is on Pip's ear. Brannick the rat catcher appears, surrounded by calm rats. The cargo hold smells unusual. WIS DC 13 to examine Clot: the tick falls off cleanly, the pustule glows amber. The Warmth is identified — a friendly colonial organism. The Inspector is also aboard, mentioning Saltwick unprompted. Token created: Clot's Glow.

**ACT II — The Floating Stage**

*Scene 4 — "The Steamboat Who Done It" (MS)*
The captain wants answers about the spoiled perfumes. INT DC 14 Investigation: trace the Warmth colony from Clot → Pip's wandering in the hold → the warm perfume vats → full colony. Brannick testifies. The monster is identified. It is not dangerous. The mystery resolves: the "murder victim" (the perfumes) was killed by friendship. The player reports to the Inspector. The Inspector mentions Elspeth and Saltwick in the same sentence — three incompatible claims now on record.

*Scene 5 — "The Confession" (DK)*
The player confronts the Inspector with the three inconsistencies. No combat. No roll required. The Inspector, having watched the player show kindness to a cat, make friends with a mouse, examine a tick without flinching, and solve a mystery by recognizing that the monster was actually friendly — cannot maintain the performance. He tears the Writ. He gives the player Pip's Friendship Bead back (they are to keep it — he understands why now). He writes the Letter of True Passage. He is Aldous. He will be useful. Token destroyed: King's Writ (Counterfeit). Token created: Letter of True Passage.

---

### §SPARK-01-F. Improv Principles Embedded in Quest Design

| Principle | Where it appears |
|-----------|-----------------|
| Yes, and | Scene 1: accept the cat removal quest, then build toward kindness instead of compliance |
| Find common ground | Scene 2: the cat-mouse alliance models what the player is doing with the Inspector |
| Play on assumptions | Scene 4: the "monster" is friendly; the "murder" was done by love |
| Make others look good | Scene 5: the player doesn't expose Aldous — they create space for him to confess |
| Contrasting energy | Aldous (high formality) + Smalt (complete indifference) + the Warmth (uncategorizable) |
| Fail big | If CHA DC 10 is failed on first try: Smalt bites the player (1 damage, flavor), second attempt allowed — the fail is more memorable than the pass |

---

### §SPARK-01-G. New State Flags

```javascript
// §SPARK-01: The Harmony Chain
smaltBefriended: false,
pipMet: false,
wrenpemburyInconsistencyNoticed: false,
bioluminescentParasiteFound: false,
whodunitSolved: false,
aldousConfessed: false,
```

---

### §SPARK-01-H. Naval Extension — §SPARK-01 SEA (PLANNED, unscheduled)

The Warmth's progenitor — a Deep Warmth Eel, CR 4, bioluminescent, entirely non-aggressive — can be encountered at open sea (between DK and LW nodes). It has been making the sea calm for three miles in every direction. This is a problem: the predator/prey chain is disrupted, fish stocks are clustering oddly, and two pirate crews that encountered the eel have been cooperating peacefully for a week, which confuses everyone including them. Monster hunt structure (4 phases as per the transcript): **setup** (strange stillness at sea, cooperative pirates), **investigation** (skill checks on the water and the pirate crews), **confrontation** (find the eel), **resolution** (the eel is not killed; it is escorted to a deeper trench where it can be happy and stop disrupting trade). Reward: the two pirate crews owe the player a debt; sea route unlocks.

---

## §DESIGN-REF — Transcript Design Principles Reference

*Working notes distilled from 4 design transcripts. Items marked ⚙️ are actionable for future arcs. Items marked ✅ are already applied.*

---

### REF-01: Improv in D&D (Flutes Loot)

| Principle | Applied | Notes |
|-----------|---------|-------|
| Yes, and — accept and build | ✅ §SPARK-01 (cat/mouse/tick chain rewards acceptance) | Future: skill-check fail states should feel like "yes, and" not dead ends |
| Make others look good | ✅ §SPARK-01 (player gives Aldous space to confess) | ⚙️ Co-op NPC moments: other NPCs help when player does the right thing |
| Let go and play / Fail Big | ⚙️ Partially (Smalt bites on fail, 1 dmg) | ⚙️ Fail states should be more memorable than pass states in SPARK arcs |
| Find common ground | ✅ §SPARK-01 (cat-mouse models player-Inspector dynamic) | ⚙️ Future SPARK arcs: chain the unlikely pair to a human relationship |
| Play on assumptions | ✅ §SPARK-01 SEA (monster = friendly eel); ✅ §HUNT-01 (monster = spiritual? No.) | ⚙️ Every HUNT arc: setup with wrong assumption, investigation corrects |
| Contrasting energy | ✅ Smalt (indifferent) vs Inspector (formal) | ⚙️ Pair high-formality NPCs with very low-stakes creatures in SPARK arcs |
| Make statements not questions | ⚙️ NPC dialogue principle — use in all new quoteFn | "You look like you've been following something" not "What are you doing?" |
| Seek themes | ⚙️ SPARK theme: kindness → harmony. HUNT theme: fear → understanding | Each arc family should have one thematic answer |
| Approaching resolutions | ⚙️ Every quest disposition quote should be a closing statement | Already enforced by disposition field convention |

---

### REF-02: Side Quest Structure (World Anvil — 4-Point Template)

**Template:** Hook/setup → Investigation/exploration → Twist/complication → Choice/resolution

| Phase | Applied | Notes |
|-------|---------|-------|
| Hook | ✅ All quests have activateNode + activateCond | ⚙️ Hooks should feel like "a question you can't ignore" not a chore |
| Investigation | ✅ skill_check quests are investigation phase | ⚙️ Skill checks should give partial info on fail, not just "try again" |
| Twist | ✅ §SPARK-01 (parasite is friendly), §HUNT-01 (ghost is drowners) | ⚙️ Twist should contradict the initial NPC's belief, not contradict facts |
| Choice/resolution | ⚠️ Currently most quests have one outcome | ⚙️ FUTURE: add "spare the monster" or "side with X" option in HUNT arcs |

**World Anvil key insight:** Side quests feel like detours unless anchored to worldbuilding. Every quest should change something permanent in the world state (flag, NPC relationship, knowledge entry, item in world).

**NPC archetypes to maintain per hub:**
- **Go-to** (knows everything, sends you to others): Muffat (DK), Elder Fisherwoman (LS), Aldous (DK post-confession)
- **Outcast with heart of gold**: Aldous (pre-confession), Brannick (rat catcher)
- **Quest giver**: Guild Master (LH), Inspector Wren-Pembury (ironic: he gives quests he doesn't mean)
- **Upgrader**: Atlantean Forge (DSF), Vendor Mira (MQ) — ⚙️ MQ could get a proper upgrade mechanic
- **Thief**: Aldous (post-confession) — ⚙️ expand to Visby black market link

---

### REF-03: Naval Campaigns

| Element | Applied | Notes |
|---------|---------|-------|
| Travel problems (handcrafted not random) | ✅ OW (Warmth Calm blocks trade route) | ⚙️ Next travel problem: storm damage → hull repair quest |
| Ship-to-creature combat | ✅ MS (ghost in hold + pirates), OW (eel) | ⚙️ Add one ship-to-ship combat node with roles: Captain, Gunner, Lookout |
| Boarding combat | ⚙️ Not yet implemented | ⚙️ Two-gangplank choke-point map node between two ship nodes |
| 3-5 interesting ports | Tilbury (DK/MQ), Lake Harbor (LH), Malta (existing) | ⚙️ Need 2 more distinct ports with cultural identity |
| NPCs traveling with party | ✅ Aldous (can escort on sea route) | ⚙️ Brannick could travel as ship NPC post-resolution |
| Fast travel between ports | ✅ Junction system handles distance | ⚙️ Add "charter a ship" option at DK for long-range fast travel |

---

### REF-04: Monster Hunt (Ben Byrne — 4-Phase Structure)

**Template:** Setup (symptoms, not monster) → Investigation (skill checks, clues) → Confrontation (combat, exploiting weaknesses) → Resolution/Reward

| Phase | Applied | Notes |
|-------|---------|-------|
| Setup — NPC reports symptoms | ✅ §HUNT-01 (Elder Fisherwoman, missing boats) | ⚙️ NPC should give WRONG theory; investigation corrects |
| Investigation — clue chain | ✅ §HUNT-01 (INT DC 12 scales → WIS DC 13 trail → lair) | ⚙️ Each clue should lower effective DC by 2 for the confrontation |
| Confrontation | ✅ §HUNT-01 (LD — Drowner ×3 den) | ⚙️ Prep rewards: monster has weakness player can exploit if they investigated |
| Resolution | ✅ §HUNT-01 (Guild allies, Drowned Compass) | ⚙️ Always: one salvageable item + one permanent world change |

**Ben Byrne key insight:** The monster hunt is most fun when the setup gives the WRONG monster. Players investigate, correct the theory, then confront. The investigation is not optional — skipping it makes the fight harder.

**Play on assumptions in HUNT arcs:**
- §HUNT-01: "Lake spirit / ghost" → actually Drowners (physical, territorial)
- §HUNT-02 (✅ Layer 111): Road warden says bandits → actually Night Hag (riding relay horses from sleeping post at J1.N bend)
- Pattern: the quest-giver's folk theory is always sympathetically wrong

---

### §NAVAL-01 — The Intercept (✅ Implemented — Layer 111)

**Node SB** (num:144) — MS.N at {r:15,c:40}. NPC: Captain Vera Keel.  
**Design:** Ship-to-ship encounter with 3 crew role buttons (first choice in game). REF-03 template.  
**Roles:** Go to the rail (CHA Parley DC 12) / Take the helm (INT Examine DC 11) / Go below (fight).  
**Parley path:** -80gp, no boarding, Letter of Marque added (Keel planted the conversation).  
**Examine path:** Eastern Reach seal date 14 months stale — dissolved office. Keel throws the Letter across the gap. She was testing whether anyone on the eastern run reads.  
**Fight path:** quest_sb_fight, Privateer Captain + Privateer × 2 (SB_PRIVATEER). +200gp +400 XP, Letter from chart room.  
**Item:** Letter of Marque (Keel) (📜) — all 3 paths yield the same item; meaning differs by path.  
**Arc thread:** Eastern Reach seal connects to Aldous arc (Wren-Pembury claimed Eastern Reach estate). Keel's test is never explained — what she was looking for is unresolved.

---

### §PORT-02 — Dunfall: The Highland Loch Harbor (✅ Implemented — Layer 111)

**Node DF** (num:143) — inserted between HL.W and EH. HL.W: 'EH'→'DF'; EH.E: 'HL'→'DF'.  
**NODE_COORDS:** DF {r:9,c:5} between HL(c:6) and EH(c:4).  
**NPC:** Mairén Fionn (Elder Fionn's daughter). 3-state quoteFn.  
**Access gate:** HL→DF blocked until defeatedBattles['HL'] (kelpie cleared).  
**Cultural identity:** Barter economy, wool-and-fish, pre-commerce. Gold welcome but not primary. Market runs on acknowledgment: knowing why the doors were barred earns more than coin.  
**Flags:** dunfallAccessed, dfBarterLearned.  
**Quests:** quest_df_01 (harbor access), quest_df_02 (WIS Insight DC 11 barter exchange).  
**Item:** Highland Herb Pouch (🌿, consumable, sell:40) — moorland yarrow + bog myrtle + one unnamed ingredient. Dunfall-only.  
**Arc thread:** Village barred doors while kelpie active (referenced in HL text). Three men didn't return. Opening Dunfall acknowledges their grief without naming it.

---

### §PORT-01 — Saltwick: The Unwritten Port (✅ Implemented — Layer 111)

**Node SK** (num:142) — accessible from MS.S ({r:19,c:40}). NPC: Harbormaster Dorit.  
**Access system:** 3-tier storyRender credential check — pirateCrew_allied → pirate note; aldousConfessed → Letter of True Passage; neither → dock gate closed.  
**Flags:** saltwickAccessed, saltwickJobAccepted.  
**Quests:** quest_sk_01 (credential access), quest_sk_02 (CHA DC 12 missing consignment).  
**Arc thread:** quest_sk_02 reveals the amber glass consignment buyer used a "Pembury" address (Chandler's shop closed morning of delivery). Connects §SPARK-01 (Aldous's false identity) → Saltwick worldbuilding.  
**Item:** Saltwick Bill of Lading (📄, sell:0) — valid at 6 unregistered ports.  
**Cultural identity:** Reputation-gated port. No paperwork. Goods with "provenance lag of approximately forever."

---

### §HUNT-02 — The Eastern Bend (✅ Implemented — Layer 111)

**Nodes:** J1 (hook, updated N→BN) → BN (new, num:141, Night Hag den)  
**NODE_COORDS:** BN {r:9,c:24} (directly north of J1 at r:11,c:24)  
**Flags:** huntHook2Received, bendRoadClue, bendLairFound, hagDefeated2  
**Quests:** quest_hunt2_01–04. storyMove gate: J1→BN blocked until huntHook2Received.  
**NPC hook:** Tessie at J1 (existing EB_NPC_DIALOGUE entry, quote: "Watch the eastern bend")  
**Wrong theory:** Road wardens say bandit fires at the old mill. Theory is wrong.  
**Reality:** Night Hag riding relay horses from sleeping post. Horses remember; refuse the road.  
**Item:** Relay Station Token (🪙, sell:20) — brass token, relay authority mark, one night's lodging.  
**Investigation chain:** WIS Perception DC 11 (precise stopping line = territorial marker) → INT Investigation DC 13 (spiral tether wear + heel-only handprint = night hag).

---

### §HUNT-01 — What's In The Lake (✅ Implemented — Layer 111)

**Nodes:** LS (hook) → LH (INT DC 12 hull) → LN (WIS DC 13 trail) → LD (new, num:140, Drowner × 3 den)  
**NODE_COORDS:** LD {r:9,c:46} (4 rows north of LN at r:13,c:46)  
**Flags:** huntHookReceived, lakeClueFound, lakeLairLocated, drownersDefeated  
**Quests:** quest_hunt_01–04. Full spec in quest.md §HUNT-01.  
**storyMove gate:** LN→LD blocked until lakeLairLocated.  
**NPC_DIALOGUE:** LS (Elder Fisherwoman) — 4 states (pre-hook / hooked / lairLocated / defeated).  
**Item:** Drowned Compass (🧭, sell:80) — Guild captain's compass found in den wreckage.  
**Wrong theory corrected:** Guild spirit offerings → physical drowners, territorial, moved in after spring shelf collapse.

---

### §SPARK-02 — The Dunfall Harmony Chain (✅ Implemented — Layer 111)

**Node:** DF (num:143, exists from §PORT-02). Second instance of the §SPARK template.  
**NPC:** Commissioner Halvard Fehn — real name Halvard Jesst, harbor informant, Ninth Circuit. Three planted identity inconsistencies: Revenue Office closed 13 years ago; no Highland Fleet exists; Commodore-Provisional in the Northern Admiralty is not a real rank.  
**Creature chain:** Cat → Dock Mouse → Bram the Harbor Seal → Oat the Osprey → Dunfall Drift Spore (bioluminescent colony, same organism family as the Warmth Eel and Clot's Glow).  
**Flags:** spark2HookReceived, bramBefriended, oatMet, brimFound, fehnConfessed, dunfallHarmonyComplete  
**Quests:** quest_spark2_01–05 (WIS DC 11 Animal Handling to befriend Bram; INT DC 12 Nature to identify drift spore).  
**Token chain (4 objects):**

| Token | Created | Destroyed | Meaning |
|-------|---------|-----------|---------|
| Bram's Fish Scale | WIS DC 11 onPass | storyRender button (Bram endorsement) | Act 2: acknowledgment |
| Oat's Harbor Bead | storyRender button | INT DC 12 onPass (specimen holder) | Act 3: alliance |
| Dunfall Drift Spore | INT DC 12 onPass | storyRender button (Fehn opens vial) | Act 4: chemical key |
| Highland Letter of Clearance | storyRender button (confrontation) | — (permanent) | Act 5: Jesst credential |

**Arc thread:** Highland Letter of Clearance (Ninth Circuit seal) valid at SK as third credential path to Saltwick — alongside pirateCrew_allied and aldousConfessed.  
**Drift spore narrative principle:** The spore does not cause Fehn to confess. It makes him stop performing. The inconsistencies were always there. The spore makes him willing to let them show. Not coercion — gentling.

---

### §WHODUNIT-01 — The Bilge Mystery (✅ Implemented — Layer 111)

**Node:** MS (existing). No new node required — all 4 phases at MS via storyRender progression + storyPreBattle trigger.  
**Template origin:** Ben Byrne §HUNT 4-phase template applied to a closed-space ship setting.  
**Wrong theory source:** The Cook (individual, credible, circumstantially coherent). Theory: Passenger Ord (came from Saltwick, suspicious). Reality: sea spawn entered through hull repair access window during quest_sk_hull work at SK.  
**Flags:** whodunit2HookReceived, whodunit2ClueFound, whodunit2WitnessRead, whodunit2Solved  
**Quests:**
- quest_bilge_01: side, MS, activateCond: saltwickAccessed — Cook's theory hook
- quest_bilge_02: skill_check INT DC 12 Investigation — port drain exam, sea spawn scale found, whodunit2ClueFound
- quest_bilge_03: skill_check WIS DC 13 Insight — Crewman Delt interview, cold from below, whodunit2WitnessRead
- quest_bilge_04: side, MS, completeFn: defeatedBattles['MS_BILGE'] — storyPreBattle Sea Spawn × 2; +600gp +600 XP; creates Sea Spawn Scale Fragment (🐚, sell:13)

**Battle trigger:** `storyPreBattle({ ...node, code:'MS_BILGE', battle:{ label:'Sea Spawn × 2 — The Bilge', key:'sea_spawn', count:2 } })`  
**NPC: Passenger Ord** — structural element only. No dialogue, no action. Named absence. The cook has never apologized. Ord has not asked for one. This is the arc's final beat, in the `onComplete` narrative.  
**Arc thread:** quest_sk_hull (hull repair at SK) → bilge repair access window → sea spawn entry. Causal chain links §PORT-01 and §WHODUNIT-01.

---

### §ALCHEMY-01 — The Personal Legend (✅ Implemented — Layer 111)

**Nodes:** HL → MI → MS → IS → ML → AE → HL. Six existing nodes. Zero new nodes required.  
**NPC:** Roen — Highland shepherd, ~40, earnest, mildly ridiculous. The "Philosophy Stoner": applies wisdom frameworks to mundane situations with complete sincerity and frequent accuracy.  
**Source inspiration:** Paulo Coelho's *The Alchemist* + Don Miguel Ruiz's *The Four Agreements* (Toltec wisdom). The grandmother's stone is a finder's device. The gold was always in the loch. She spoke literally.  
**Flags:** roenMet, roenMidlandsWisdom, roenAtSea, roenOracleRead, roenMaltaCrisis, roenAlchemistMet, personalLegendComplete  
**Quests:** quest_alch_01–07.

| Quest | Type | Node | Beat | Toltec agreement |
|-------|------|------|------|-----------------|
| quest_alch_01 | side | HL | Hook: Roen met, Shepherd's Fortune Slip created | — |
| quest_alch_02 | side | MI | Noon plain wisdom | Don't take it personally |
| quest_alch_03 | side | MS | Sea wisdom | Don't make assumptions |
| quest_alch_04 | skill_check CHA DC 11 | IS | Oracle reading (Persuasion) | — |
| quest_alch_05 | skill_check WIS DC 12 | ML | Malta crisis (Insight) | Always do your best |
| quest_alch_06 | side | AE | Athens Stoic — the synthesis | All four |
| quest_alch_07 | side | HL | Return: stone dropped, Loch Gold Flake created | Be impeccable with your word |

**Token flow:** Shepherd's Fortune Slip (📜, sell:0) created at hook; destroyed at AE. Loch Gold Flake (✨, sell:30) created at return.  
**Bioluminescence resolution:** The Philosophy Stone is a fragment of the Warmth Eel bioluminescent colony — same organism as Clot's Glow (§SPARK-01) and the Dunfall Drift Spore (§SPARK-02). The colony concentrates trace gold from highland runoff. Roen's grandmother was using geographic coordinates, not metaphor. The fortune teller was right. The journey was required to understand what was already known.  
**Resolution beat:** Roen drops the stone into the loch. The colony responds. Loch Gold Flake surfaces. Roen says: *"That's very annoying."* — with complete warmth.

---

## §WISDOM-01 — The Book of Human Nature (✅ Implemented — Layer 112)

**Depends on:** personalLegendComplete (§ALCHEMY-01 complete)  
**Source material:** Robert Greene — *The Laws of Human Nature* (2018) + *The 48 Laws of Power* (1998)  
**Arc summary:** Roen, having found his Personal Legend, is now restless in a different direction. He has answered *where is the gold?* He has not answered *why does everyone behave the way they do?* He has a lead: a court historian named Master Fenn Ardley documented these patterns in a text that was scattered after Ardley named the court treasurer's behavior in public. The treasurer's dynasty held the city dock contracts for sixteen more years — then lost them to a Baltic competitor who had read a dispersed copy of Ardley's text. The laws worked whether or not anyone wanted them to.

**Design principle — wisdom-as-tool vs. wisdom-as-observation:**  
§ALCHEMY-01 = wisdom-as-observation. Roen notices, names, moves on. §WISDOM-01 = wisdom-as-tool. Each fragment is a lens for a skill check that does not exist without reading the law first. Fragment → law displayed → situation present → skill check tests application of the law. The law is a key, not a reward.

---

### §WISDOM-01-A. The Six Laws

| Code | Law | Source | Stat | DC | Node | Situation |
|------|-----|--------|------|----|------|-----------|
| W1 | The Law of Role-playing — *See through masks* | LHN-3 | WIS Insight | 13 | DK | New merchant Silas Vance: cloth dealer, rigger's hands |
| W2 | The Law of Aggression — *See the hostility* | LHN-16 | WIS Insight | 12 | SK | Dorit's contained hostility retroactively read |
| W3 | Discover Each Man's Thumbscrew | 48L-33 | INT Investigation | 11 | SB | Keel's chart room — what she was actually protecting |
| W4 | The Law of Shortsightedness — *Elevate your perspective* | LHN-6 | INT History | 12 | BK | Birka guild deal — name the 3-year outcome |
| W5 | Assume Formlessness — *Adapt; rigidity is the vulnerability* | 48L-48 | WIS Insight | 12 | AE | Stoic debate — release the committed argument |
| W6 | The Law of Repression — *Confront your shadow* | LHN-9 | WIS Save | 14 | VS | VS mirror chamber — accept the reflection or fight |

---

### §WISDOM-01-B. Nodes

No new nodes required. Arc uses six existing nodes.

| Node | Code | Fragment | Activation condition |
|------|------|----------|---------------------|
| Visby | VS | Hook + Resolution + W6 | personalLegendComplete (hook); wisHookReceived + wisPages 1–5 (W6) |
| Tilbury Docks | DK | W1 | wisHookReceived |
| Saltwick | SK | W2 | wisHookReceived + saltwickAccessed |
| The Intercept | SB | W3 | wisHookReceived + sbResolved |
| Birka | BK | W4 | wisHookReceived + birkaAccessed |
| Athens/Alexandria | AE | W5 | wisHookReceived + roenAlchemistMet |

---

### §WISDOM-01-C. New NPCs

**Roen** (companion, continuing from §ALCHEMY-01)  
- Post-personalLegendComplete state: still wandering; now focused outward rather than inward
- Appears in quest descriptions at each fragment node; not as a storyRender block (except VS hook/resolution)
- His commentary on each law is the "Philosophy Stoner" translation: concrete, hyper-specific, slightly absurd, accurate

**Silas Vance** (DK — W1 fragment NPC)  
- Presents as cloth merchant; actually a former ship rigger running a quiet re-export scheme
- Rope callousing on hands, not bale callousing — the tell
- Not dangerous; no combat; aligned on pass (knows a route discount at SK)

**Master Fenn Ardley** (deceased — arc's ghost)  
- Court historian, documented behavioral patterns, named the court treasurer's behavior publicly
- Dismissed; library confiscated; text scattered
- Present only through fragments; never met; his story told by implication across 6 pages

---

### §WISDOM-01-D. Quest Table

| ID | Type | Node | Title | Check | Flag set | Reward |
|----|------|------|-------|-------|----------|--------|
| quest_wis_00 | side | VS | The Manuscript Hook | storyRender button | wisHookReceived | 100 XP; creates Pages of the Ardley Manuscript |
| quest_wis_01 | skill_check WIS DC 13 | DK | Mask Check | Insight: Silas Vance | wisPage1_masks | +150gp, +250 XP |
| quest_wis_02 | skill_check WIS DC 12 | SK | What Dorit Already Knew | Insight: Dorit's hostility | wisPage2_aggression | +250 XP; knowledge entry |
| quest_wis_03 | skill_check INT DC 11 | SB | The Chart Room | Investigation: Keel's log | wisPage3_thumbscrew | +300 XP; Keel thread partially resolved |
| quest_wis_04 | skill_check INT DC 12 | BK | Three Years Out | History: guild deal outcome | wisPage4_sight | +300 XP; birkaRepImproved = true |
| quest_wis_05 | skill_check WIS DC 12 | AE | The Philosopher's Pivot | Insight: release the argument | wisPage5_form | +300 XP; stoic_letter flag |
| quest_wis_06 | skill_check WIS DC 14 | VS | The Shadow Room | Save: accept the reflection | wisPage6_shadow | +350 XP; Shadow Shard (combat path: +200 XP, no item) |
| quest_wis_07 | side | VS | Ardley's Book | completeFn: all 6 wisPage flags | personalLegendMature | +400gp, +600 XP; creates Ardley's Complete Laws |

**activateCond for quest_wis_00:** `() => S_story.personalLegendComplete`  
**completeFn for quest_wis_07:** `() => ['wisPage1_masks','wisPage2_aggression','wisPage3_thumbscrew','wisPage4_sight','wisPage5_form','wisPage6_shadow'].every(f => S_story[f])`

---

### §WISDOM-01-E. Fragment Texts and Roen Commentary

**W1 — Masks (DK, quest_wis_01)**

*Ardley text:* "Every person wears a social mask. The mask is not the lie — the mask IS the performance. What you are looking for is not the lie beneath the mask but the gap: the moment when the performance requires more effort than usual. That effort is the tell." — *A Complete Account, Ch. III*

*Roen:* "There is a cloth merchant at the Tilbury dock who holds bolts of fabric the way my grandfather held a lamb — which is to say, like something that could run. I find this interesting."

**W2 — Aggression (SK, quest_wis_02)**

*Ardley text:* "Aggression does not announce itself. It dresses as patience, as courtesy, as professional neutrality. You will see it only in small signals: the way someone's voice drops one register when they say a name, the way they touch an object on their desk before they answer. These are not accidents. They are the leak." — *A Complete Account, Ch. XVI*

*Roen:* "Dorit touched the docking ledger four times while you were talking. Not to write anything. Just to touch it. I have been thinking about what that means for several days."

**W3 — Thumbscrew (SB, quest_wis_03)**

*Ardley text:* "Every person has one thing they are trying to protect above all others. It is not always what they say they are protecting. Look for the thing they never mention — the omission is usually more revealing than the declaration. Their thumbscrew is the thing that makes them go quiet." — *A Complete Account, Ch. XXXIII*

*Roen:* "Keel talked about the commission. She talked about the eastern run. She talked about the date. She did not talk about the navigator. Not once. In my experience, people do not avoid talking about things that are not important."

**W4 — Shortsightedness (BK, quest_wis_04)**

*Ardley text:* "The present moment is always vivid and always incomplete. The person who can force themselves to ask 'what will this look like in three years?' is rare, because the exercise requires abandoning the comfort of the immediate. The guild man who takes the good deal today rarely asks what it will cost his successor." — *A Complete Account, Ch. VI*

*Roen:* "The guild master is very pleased with the new Baltic contract. I asked him what happens when the Highland timber season fails. He said the timber season does not fail. I said it failed twice in the last thirty years. He said that is different. I have been thinking about what 'different' means."

**W5 — Formlessness (AE, quest_wis_05)**

*Ardley text:* "The man who has committed to a position and then found the position untenable has two choices: defend the position anyway, or release it. The first is called dignity. The second is called intelligence. They feel identical from the outside. Only the person inside knows which one they are doing." — *A Complete Account, Ch. XLVIII*

*Roen:* "The philosopher and I argued for two hours about whether gold has intrinsic value or whether value is a social agreement. I was right, then I was wrong, then I was right again from the other direction. At some point I stopped knowing which direction I was arguing from. This felt like progress."

**W6 — Shadow (VS, quest_wis_06)**

*Ardley text:* "The parts of yourself you have refused to examine do not disappear. They operate below the surface. They surface as overreactions, as inexplicable preferences, as patterns you cannot explain. The shadow is not your enemy — it is the part of you that has been waiting to be named." — *A Complete Account, Ch. IX*

*Roen:* "There is a room in the lower level that I have been in four times now. It shows you something. I will not say what it showed me. It was accurate, though. I gave it a formal nod. It seemed appropriate."

---

### §WISDOM-01-F. Token Objects

| Token | Icon | Created | Destroyed | Significance |
|-------|------|---------|-----------|-------------|
| Pages of the Ardley Manuscript | 📖 | quest_wis_00 storyRender button | quest_wis_07 resolution button | The incomplete collection; exists only during the search |
| Shadow Shard | 🔮 | quest_wis_06 onPass (WIS save path only) | — (permanent) | Mirror fragment offered freely; VS non-combat resolution reward |
| Ardley's Complete Laws | 📚 | quest_wis_07 resolution button | — (permanent) | 6-law text; Roen's foreword: "These are not rules. They are a pair of glasses." |

---

### §WISDOM-01-G. New State Flags

```javascript
// §WISDOM-01: The Book of Human Nature
wisHookReceived: false,
wisPage1_masks: false,
wisPage2_aggression: false,
wisPage3_thumbscrew: false,
wisPage4_sight: false,
wisPage5_form: false,
wisPage6_shadow: false,
personalLegendMature: false,
```

---

### §WISDOM-01-H. storyRender Blocks Required

**story-wis-vs** (VS node) — 3 states:
1. `personalLegendMature`: arc complete — Ardley's Complete Laws in inventory
2. `wisHookReceived && allSixPages`: resolution button — bind the manuscript; create Ardley's Complete Laws; +400gp +600 XP; knowledge entry
3. `personalLegendComplete && !wisHookReceived`: hook button — Roen appears with portfolio; create Pages of the Ardley Manuscript; wisHookReceived = true

**quest-description panels** (W1–W6): The Ardley fragment text and Roen commentary appear within the quest `desc` field. No additional storyRender blocks required at DK, SK, SB, BK, AE — the skill check panels are sufficient.

**VS shadow room** (W6): The shadow encounter is triggered by a button within story-wis-vs when `wisHookReceived && wisPages1–5 all set`. Button fires either:
- Accept path: WIS Save DC 14 (linked to quest_wis_06)
- Or: implements as storyPreBattle('VS_SHADOW', Shadow Construct × 1) with wisPage6_shadow set on combat victory

Implementation note: if §DUNGEON-01 is implemented first, the shadow room may already exist as a §DUNGEON-01 storyRender block. Coordinate with §DUNGEON-01 to avoid duplicate shadow room implementations at VS.

---

### §WISDOM-01-I. Arc Threading

```
§ALCHEMY-01 (personalLegendComplete)
   → activates quest_wis_00 at VS

§SPARK-01 / §SPARK-02 (mask-wearing NPCs)
   → quest_wis_01 (DK): Silas Vance follows the Aldous/Fehn pattern — law in third instance

§PORT-01 (saltwickAccessed, Dorit)
   → quest_wis_02 (SK): Dorit's contained aggression retroactively named

§NAVAL-01 (sbResolved, Keel)
   → quest_wis_03 (SB): Keel's omission (the navigator) identified; thread partially resolved
   → Keel never mentioned the navigator once across all three intercept paths

§DESIGN-03 / Birka (birkaAccessed — see §DESIGN-03)
   → quest_wis_04 (BK): guild shortsightedness — W4 fragment; birkaRepImproved flag

§ALCHEMY-01 (roenAlchemistMet)
   → quest_wis_05 (AE): Stoic debate; stoic_letter flag (letter of introduction to VS)

§DUNGEON-01 / VS underground (visbyUnderground — PLANNED)
   → quest_wis_06 (VS): shadow room non-combat resolution; Shadow Shard
   → coordinate with §DUNGEON-01 to avoid duplicate shadow room
```

---

### §WISDOM-01-J. Keel Thread — Partial Resolution

quest_wis_03 is the first time the Keel thread advances since §NAVAL-01. The chart room at SB contains an archived log from the night of the intercept. INT Investigation DC 11 surfaces what Keel was protecting: not the commission date and not the eastern run — but the navigator's notes, which contain survey data for a Baltic sea route that would cut Tilbury out of highland timber trade entirely.

This is not a full resolution. The navigator's notes are gone — Keel took them. The player knows the shape of what she was protecting; not yet who sent her or what she did with the data. The Keel thread now has a mechanism (Baltic route data) and a missing piece (the navigator). A future arc can close it.

---

### §WISDOM-01-K. Implementation Checklist

```
_S_DEFAULTS() — add 8 new flags (§WISDOM-01-G above)

QUEST_DB — add 8 quests:
  quest_wis_00: side, VS, activateCond: personalLegendComplete
  quest_wis_01: skill_check WIS DC 13, DK, activateCond: wisHookReceived
  quest_wis_02: skill_check WIS DC 12, SK, activateCond: wisHookReceived + saltwickAccessed
  quest_wis_03: skill_check INT DC 11, SB, activateCond: wisHookReceived + (sbResolved||sbPapersRead)
  quest_wis_04: skill_check INT DC 12, BK, activateCond: wisHookReceived + birkaAccessed
  quest_wis_05: skill_check WIS DC 12, AE, activateCond: wisHookReceived + roenAlchemistMet
  quest_wis_06: skill_check WIS DC 14 (saveType:'save'), VS, activateCond: wisHookReceived
  quest_wis_07: side, VS, completeFn: all 6 wisPage flags

storyRender — add story-wis-vs block at VS node:
  3 states: hook / resolution / complete

Items created in quest callbacks:
  quest_wis_00 onAccept: Pages of the Ardley Manuscript (📖, sell:0)
  quest_wis_06 onPass (save): Shadow Shard (🔮, sell:25)
  quest_wis_07 button: splice Pages; create Ardley's Complete Laws (📚, sell:50)

JS syntax validation after each edit block

Running total after §WISDOM-01: ~159 live quests
```

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

```
Step 0:  GET /location/{startNode}         — node exists, terrain is correct
Step 1:  Edit _S_DEFAULTS                  — register new flags (manual, one-time)
Step 2:  GET /schema/quest                 — canonical field list before writing
Step 3:  POST /api/quest                   — add one quest
Step 4:  GET /api/quest/{id}              — verify quest is readable; all fields set
Step 5:  PUT /api/quest/{id}              — patch text fields if needed (no full rewrite)
Step 6:  Repeat steps 3–5 for each quest in the chain
Step 7:  GET /api/quest/{anyId}/chain     — verify dependency graph is connected
Step 8:  POST /api/save                   — commit to timestamped HTML
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
   - Grep the game file: `grep -o 'flagName: false' roll2hit-v3.html` (or `wbapi-cli.js` once `_S_DEFAULTS` is indexed)
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
| 1 | `QuestRuntime` singleton + `adaptLegacyQuest()` adapter + `schema:'0.legacy'` stamps | Zero |
| 2 | New arcs written in UQF; runtime serves both formats | Low |
| 3 | Arc-by-arc migration (§WISDOM-01 first) | Medium |
| 4 | All arcs UQF; legacy path removed | Medium-low |
| 5 | QUEST_DB is single source of truth; storyRender is display-only | Low |

### §ARCH-01-D. MissionBitController

Validates quest definitions against bit contracts before writing to QUEST_DB. Runs inside worldbuilder.html Quest Editor. Required fields, optional fields, and a `validate()` function per bit kind.

### §ARCH-01-E. Implementation Checklist

- [ ] Phase 1: Add `SCHEMA_VERSION`, `QuestRuntime`, `adaptLegacyQuest()` to game file (inert — no behavior change)
- [ ] Phase 1: Add `BIT_CONTRACTS` and `validateQuest()` to worldbuilder.html Quest Editor
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
   // or: node wbapi-cli.js edit quest quest_escort_aldric title "Walk With Me"

5. CHAIN CHECK
   WBAPI.quests.chain('quest_escort_aldric')
   // → { upstream: ['quest_aldric_intro'], downstream: [] }

6. EXPORT (for human review)
   node wbapi-cli.js export ./world
   // → world/CY/npcs/aldric/quests/quest_escort_aldric/
   //     meta.json, title.txt, passText.txt …

7. SYNC + SAVE
   node wbapi-cli.js sync ./world && node wbapi-cli.js save
   // → roll2hit-v3-YYYYMMDD-HHMMSS.html
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

**Phase 1 — Operand Registry (inert, no behavior change)**
- [ ] Define `OPERAND_CONTRACTS` object with all 12 operand kinds, required/optional fields
- [ ] Add `WBAPI.operands.list()` / `.contract(kind)` / `.validate(bit)`
- [ ] Add `WBAPI.quests.validate(id)` — field-level checks only
- [ ] Add `WBAPI.quests.advise(id)` — world-logic cross-reference checks
- [ ] Add `WBAPI.quests.toOperands(id)` — parse existing quest fields into operand array
- [ ] Wire validate + advise into API tab in worldbuilder.html

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
- [ ] World Builder CLI: `node wbapi-cli.js advise quest <id>` command

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

**Phase 1 — Quest investigation card (no graph)**
- [ ] Extend quest detail pane in worldbuilder.html to show: arc siblings, upstream/downstream flags with originating quest IDs, NPC key → NPC name lookup, activateNode → node label lookup
- [ ] Add arc-filter to quest sidebar (filter by arc prefix extracted from quest ID)
- [ ] Add "Location Profile" button on node detail that shows all quests + NPCs + monsters at that node

**Phase 2 — Mission classification layer**
- [ ] Add `_classifyQuest(q)` to wbapi-core.js — returns operational class from `§WORLDBUILDER-02-B` table based on field inspection
- [ ] Add `WBAPI.quests.byClass(cls)` list method
- [ ] Expose in worldbuilder: type filter dropdown includes the 11 operational classes (not just QUEST_DB's 4)
- [ ] Show operational class badge alongside QUEST_DB type in quest card header

**Phase 3 — Location Profile card**
- [ ] `WBAPI.location.profile(nodeCode)` — extends existing `location.get()` with: quest list with classes, NPC list with quest counts, flag reads/writes at this node
- [ ] Render Location Profile card in worldbuilder when clicking a node (replaces simple node detail pane)

**Phase 4 — Relationship graph panel**
- [ ] Add lightweight canvas/SVG graph panel (right sidebar or overlay)
- [ ] Populate from `WBAPI.location.profile()` + `WBAPI.quests.chain()` data
- [ ] Nodes clickable → navigate to investigation card

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

## §BACKLOG — Outstanding Tasks (updated 2026-05-29)

A consolidated register of all open work across the project. Organized by domain. Items carry a priority tier: **P1** (blocks other work or has active dependencies), **P2** (planned, sequenced), **P3** (unscheduled / speculative).

---

### BACKLOG-A. Tooling — WBAPI + Worldbuilder

**P1 — Immediately actionable:**

- [ ] **§ARCH-02 Phase 1 — Operand Registry (inert):** Add `OPERAND_CONTRACTS` object (12 operand kinds, required/optional fields) to `wbapi-core.js`. Add `WBAPI.operands.list()`, `.contract(kind)`, `.validate(bit)`. Add `WBAPI.quests.validate(id)` (field-level) and `WBAPI.quests.advise(id)` (world-logic cross-ref). Add `WBAPI.quests.toOperands(id)` — parse existing quest fields into operand array. Wire validate + advise into worldbuilder.html API tab. *(Depends on: nothing. Enables: §ARCH-02 Phase 2, §WORLDBUILDER-02 advisory warnings.)*

- [ ] **§ARCH-01 Phase 1 — UQF skeleton (inert):** Add `SCHEMA_VERSION = 'UQF-1.0'` and stub `QuestRuntime` + `adaptLegacyQuest()` to `roll2hit-v3.html` inside a `/* §ARCH-01 */` block. No behavior change — just establishes the namespace. Add `BIT_CONTRACTS` and `validateQuest()` to worldbuilder.html Quest Editor. *(Depends on: nothing. Enables: §ARCH-01 Phase 2 migration.)*

- [ ] **§WORLDBUILDER-02 Phase 1 — Quest investigation card:** Extend quest detail pane in worldbuilder.html: arc siblings, upstream/downstream flags with originating quest IDs, NPC key → NPC name lookup, activateNode → node label. Add arc-filter to quest sidebar. Add "Location Profile" button on node detail. *(Depends on: nothing. Enables: Phase 2 classification layer.)*

**P2 — Sequenced after P1:**

- [ ] **§WORLDBUILDER-02 Phase 2 — Mission classification:** Add `_classifyQuest(q)` to wbapi-core.js (11 operational classes). Add `WBAPI.quests.byClass(cls)`. Expose in worldbuilder filter bar. Show operational class badge in quest card. *(Depends on: §WORLDBUILDER-02 Phase 1.)*

- [ ] **§WORLDBUILDER-02 Phase 3 — Location Profile card:** `WBAPI.location.profile(nodeCode)` — extends `location.get()` with quest list w/ classes, NPC quest counts, flag reads/writes at node. Render as Location Profile card in worldbuilder. *(Depends on: Phase 2 classification, §ARCH-02 Phase 1 for flag-class map.)*

- [ ] **§ARCH-02 Phase 2 — Quest creation flow:** Add `WBAPI.quests.create(questObj)` (validates then adds). Add operand builder UI in worldbuilder Quest Editor. Show `quests.chain()` upstream/downstream in Quest Editor. *(Depends on: §ARCH-02 Phase 1.)*

- [ ] **§WORLDBUILDER-01 — Visual grid editor:** Full canvas-based node map editor with node detail inspector, exit bidirectional editing, collision detection. See full spec in §WORLDBUILDER-01-A through -D. *(Depends on: §WORLDBUILDER-02 Phase 1 for cross-ref panel integration.)*

- [ ] **§EDITOR-01 — Quest creator UI:** Form-based quest creator with type-aware fields, flag dependency graph, storyRender block generator, token item manager, template presets. See full spec in §EDITOR-01-A through -G. *(Depends on: §ARCH-02 Phase 1 for operand validation.)*

**P3 — Deferred / unscheduled:**

- [ ] **§WORLDBUILDER-02 Phase 4 — Relationship graph:** Canvas/SVG graph panel showing entity neighborhood. Nodes clickable. *(Depends on: Phase 3.)*
- [ ] **§ARCH-02 Phase 3 — Escort + party runtime:** `S.party`, `escort` pickup/dropoff, `talk_party` in inventory panel. *(Depends on: Phase 2.)*
- [ ] **§ARCH-02 Phase 4 — Legacy quest conversion:** Audit all 210 quests with `toOperands()`. Convert 59 skill_check quests first (most uniform). Convert §HUNT-01 and §SPARK-01 as proof-of-concept. *(Depends on: Phase 2.)*
- [ ] **§ARCH-01 Phases 2–5:** Migrate quest arcs to UQF one by one (WISDOM → SPARK → ALCHEMY → main chain). Remove `completeFn`/`onPass` closure pattern. Export UQF JS literals from worldbuilder. *(Long-term.)*

---

### BACKLOG-B. Game Content — Unimplemented Arcs

**P1 — Has active dependencies in live quests:**

- [ ] **§DUNGEON-01 VS Underground Room (visbyUnderground):** `quest_wis_06` (the Shadow Room WIS save) requires `visbyUnderground: true` as an activateCond gate. The shadow room must be implemented before §WISDOM-01's final quest resolves properly. See §DUNGEON-01 + §WISDOM-01-I for the coordination note. This is the only §WISDOM-01 quest that requires a new storyRender block at VS — all others are already live. *Implement first among §DUNGEON-01 remainders.*

**P2 — Specced and ready:**

- [ ] **§SPARK-01 — The Harmony Chain (5 quests):** Full spec in quest.md §SPARK-01 and plan.md §SPARK-01. Quests: `quest_spark_01–05`. Nodes: DK, MS. State flags: `smaltBefriended`, `pipMet`, `bioluminescentParasiteFound`, `whodunitSolved`, `wrenpemburyInconsistencyNoticed`, `aldousConfessed`, `harmonyChainComplete`. Token objects: Smalt's Trust, Pip's Friendship Bead, Clot's Glow, Letter of Safe Passage, Letter of True Passage (King's Writ destroyed). Inspector Aldous Wren-Pembury becomes recurring ally NPC after §SPARK-01 close. *Self-contained arc, no prerequisites beyond existing node access.*

- [ ] **Combined monster rename save:** Two renames (commoner → "Rabid Monkey", npc_merchant → "Badger") currently exist in separate timestamped saves. A combined single-session save that applies both in one timestamped file has never been produced. Low risk, low effort. *(Run both `monsters.rename()` calls in one `node -e` session.)*

**P3 — Unscheduled:**

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

## §MBIT-01 — Mission Bit Tokens: Physical Proof System (✅ Implemented 2026-05-29)

### §MBIT-01-A. What Was Built

Every skill-check quest that sets a `checkPassFlag` (or `checkFailFlag`) now also grants the player a carved bone token in inventory. The token is the physical, player-visible proof of a witnessed event.

**Three new helpers added to roll2hit-v3.html (after `_hasItem`):**

```javascript
function _flagToLabel(f)
// camelCase → "Title Case" — stoningEvent → "Stoning Event"

function _grantMissionBit(flagName, label)
// Sets S_story[flagName] = true  (backward-compatible boolean stays)
// Pushes { name:'Label Token', icon:'🪬', type:'mission_bit', sell:0, flagRef:flagName } to inventory
// Calls storyMsg('🪬 Token received: Label Token.')
// Idempotent — does not double-grant if token already present

function _takeMissionBit(flagName)
// Sets S_story[flagName] = false
// Removes token from inventory by flagRef
// Calls storyMsg('🪬 Token returned: Label Token.')
```

**Wire-up in `_rollCeremonia`:**
```
checkPassFlag set:  S_story[flag] = true  →  _grantMissionBit(flag, q.bitLabel)
checkFailFlag set:  S_story[flag] = true  →  _grantMissionBit(flag, q.bitLabel)
```

The boolean `S_story[flagName]` is still set, so all existing `activateCond: () => !!S_story.someFlag` conditions work unchanged.

**Inventory display — section 8 "🪬 Mission Tokens":**
- Compact chip grid (flex-wrap), one chip per token
- Chip shows glyph icon + flag label (without the word "Token")
- Chip tooltip (`title`) = full desc including the raw glyph code
- `'mission_bit'` added to `knownTypes` so tokens don't also appear in "Trophies & Other"

**Token object structure:**
```javascript
{
  name:    'Stoning Event Token',          // _flagToLabel(flag) + ' Token'
  icon:    '🪬',                            // carved ward — the glyph marker
  type:    'mission_bit',
  sell:    0,                               // non-sellable, always
  desc:    'A carved bone token. Glyph: STONING_EVENT. Mark of a witnessed moment.',
  flagRef: 'stoningEvent',                  // back-reference for _takeMissionBit
}
```

**Optional quest field `bitLabel`:** If a quest sets `bitLabel: 'Basket Rope'`, the token is named "Basket Rope Token" instead of the auto-generated camelCase expansion.

### §MBIT-01-B. How to Use

Naming convention: token name = readable label + " Token". Default label is the camelCase flag expanded to Title Case. Override with `bitLabel` in the quest definition:

```javascript
quest_basket_damascus: {
  ...
  checkPassFlag: 'basketRopeComplete',
  bitLabel: 'Basket Rope',              // → token named "Basket Rope Token"
}
```

To take a token back (e.g. a consumed proof, a surrendered pass):
```javascript
onPass: () => { _takeMissionBit('conclavePass'); }
```

To test if a player holds a token (alternative to boolean):
```javascript
activateCond: () => _hasItem('Stoning Event Token')
// or keep the boolean form — both work
activateCond: () => !!S_story.stoningEvent
```

---

## §MBIT-02 — Mission Bit Token Follow-Up Items

### §MBIT-02-A. ✅ `bitLabel` added to all quest sites (2026-05-29)

All `skill_check` quests with `checkPassFlag`/`checkFailFlag` now carry `bitLabel`. Full table of what was implemented:

| questId | flag | bitLabel |
|---------|------|----------|
| `quest_muffat_01` | `muffatBerthReached` | `'Muffat Berth'` |
| `quest_ezzir` | `ezzirConfronted` | `'Ezzir Standoff'` |
| `quest_governor_cyprus` | `govCopperConverted` | `'Governor of Cyprus'` |
| `quest_lame_lystra` | `lameManHealed` | `'Gate Healing'` |
| `quest_stoning_lystra` | `stoningEvent` (pass+fail) | `'Lystra Stoning'` |
| `quest_prison_phillam` | `phillippiJailerConverted` | `'Philippi Jailer'` |
| `quest_areopagus` | `areopagusSpeech` | `'Areopagus Speech'` |
| `quest_ephesus_riot` | `demetriusRiotEscaped` | `'Ephesus Riot'` |
| `quest_basket_damascus` | `escapedDamascus` | `'Damascus Escape'` |
| `quest_basket_damascus` onPass | `basketRopeComplete` | `'Basket Rope'` (via `_grantMissionBit`) |
| `quest_aurel_tide` | `aurelTideRead` / fail:`betrayalThought` | `'Aurel Seal'` |
| `quest_calice_bridge` | `caliceBridgeCrossed` / fail:`betrayalWord` | `'Calice Crossing'` |
| `quest_mireille_ami` | `mireilleAmiNamed` / fail:`betrayalDeed` | `'Mireille Named'` |
| `quest_solen_horizon` | `solenSoonRead` | `'Solen Truth'` |
| `quest_sea_overseer` | `charmResisted` / fail:`seaOverseerMet` | `'Charm Resisted'` |
| `quest_spark_smalt` | `smaltBefriended` | `'Smalt Befriended'` |

Also cleaned up: `quest_stoning_lystra` now uses `checkFailFlag:'stoningEvent'` (both outcomes produce the token). Redundant `onPass` that just set the boolean removed. `quest_basket_damascus` `onPass` now calls `_grantMissionBit('basketRopeComplete','Basket Rope')` directly. `quest_governor_cyprus` empty `onPass` removed.

`_grantMissionBit` updated to store `day: S_story.day` on each token at grant time — enables future timeline rendering.

### §MBIT-02-B. ✅ `consumeItem` on KEY_EVENTS (2026-05-29)

KEY_EVENTS that physically surrender the item now carry `consumeItem:true`. `_rollKeyEvent` filters the item from `S_story.inventory` after setting the flag.

| Key Event | Item | Consumed? | Reason |
|-----------|------|-----------|--------|
| `ke_conclave_pass` | Conclave Pass | ✅ yes | Pass registered; no further use |
| `ke_toll_token` | Toll Token | ✅ yes | "She sets the token on the gate post" |
| `ke_crypt_key` | Crypt Key | — | Key stays (player may carry it) |
| `ke_sea_cave` | Sea Cave Key | — | Key stays |
| `ke_eel_pouch` | Eel Skin Pouch | — | Reusable light, +1 fishing bonus |
| `ke_manifest` | Shipping Manifest | — | Evidence document kept |
| `ke_antecedent` | Antecedent Seal | — | Seal stays (acknowledged, not deposited) |

`quest_solen_horizon` — truth token not taken; it is a record of discernment, not a physical handover.  
Escort-arc "letter of introduction" remains P2 pending escort arc implementation.

### §MBIT-02-C. ✅ worldbuilder.html schema updated (2026-05-29)

`SCHEMAS.quest.fields` in `wbapi-server.js` now includes:
- `checkPassFlag` with note about `_grantMissionBit` side effect
- `checkFailFlag` with same note
- `bitLabel` — editable, describes token name override

Full worldbuilder quest pane "Produces: 🪬 Token" display remains P2.

### §MBIT-02-D. ✅ Token day stored at grant (2026-05-29)

`_grantMissionBit` now stores `day: S_story.day || 1` on each token. Timeline rendering in journal is P3.

**P3 — When journal is extended, filter `inventory` by `type:'mission_bit'`, sort by `.day`, render as a witnessed-events chronicle.**

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

**Pending (P2):**
- Wire `LAKE_MAGIC_DB` effects into fishing battle rewards — currently items are defined but not yet dropped in-game
- Add `POST /api/fish/simulate?advantage=true` for bait advantage rolls
- Worldbuilder quest pane: "Produces: 🪬 Token" display (§MBIT-02-C P2)

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
curl http://localhost:1367/api/export/world_db

# Export MONSTER_POOL as JSON
curl http://localhost:1367/api/export/monster_pool?format=json

# Export all collections as a standalone Node module
curl http://localhost:1367/api/export/all?format=module > world.js
node -e "const W = require('./world.js'); console.log(Object.keys(W.MONSTER_POOL).length);"
```

`?format=module` wraps the export in `module.exports = { NODE_MAP, QUEST_DB, MONSTER_POOL, ... }` so it runs on Node without a browser.

### §WBAPI-01-D. `POST /api/terrain` — Create Terrain Entry

```bash
curl -X POST http://localhost:1367/api/terrain \
  -H 'Content-Type: application/json' \
  -d '{
    "key": "forum_romanum",
    "label": "Forum Romanum — Ancient Civic Heart",
    "icon": "🏛",
    "monsters": ["golem","graveir","penitent","higher_vampire"]
  }'
```

Server validates monster keys against `MONSTER_POOL`, writes entry to `WORLD_DB` anchor block, calls `POST /api/save` automatically.

### §WBAPI-01-E. API-First Workflow — Reference Curl Sequences

**Add a terrain entry:**
```bash
curl -X POST http://localhost:1367/api/terrain \
  -H 'Content-Type: application/json' \
  -d '{"key":"new_terrain","label":"New Place","icon":"🗺","monsters":["goblin","bandit"]}'
curl -X POST http://localhost:1367/api/save
./wbapi-toggle.sh restart
curl http://localhost:1367/api/audit | jq '.summary'
```

**Create a quest:**
```bash
curl -X POST http://localhost:1367/api/quest \
  -H 'Content-Type: application/json' \
  -d '{"id":"quest_my_01","type":"main","title":"My Quest","activateNode":"CY","objectiveText":"Do the thing."}'
curl -X POST http://localhost:1367/api/save
```

**Inspect before planning:**
```bash
curl -s http://localhost:1367/api/audit | jq '.items[] | select(.level=="error")'
curl -s http://localhost:1367/api/list/terrain | jq '.[].key'
curl -s http://localhost:1367/api/list/node?type=story | jq '.[].code'
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

## §CLEANUP-01 — Audit Error Resolution (📋 PLANNED)

**Status:** 📋 PLANNED — 11 errors, 35 warnings, 120 suggestions as of 2026-05-30  
**Goal:** Drive audit errors to 0. Warnings and suggestions are cosmetic backlog.

### Immediate — Clears Errors

#### 1. Add node VS — Visby (clears 8 errors)

Quests `quest_wis_00`, `quest_wis_06`, `quest_wis_07`, `quest_vs_01`, `quest_vs_03` all reference node `VS` which does not exist in NODE_MAP. Visby is the Hanseatic port sacked by Valdemar IV of Denmark in 1361 — by 1367 it is ruined but still inhabited, contested between the League and the Danish crown.

```
code:    VS
name:    docks
label:   Visby — Ruined Hansa Port
act:     3
N:       null
S:       null
E:       RG
W:       BK
terrain: docks (Harbor Docks monster table)
```

Narrative note: Visby is the broken version of what Lübeck still is. Half the warehouses are roofless. The quayside still moves amber and herring because commerce does not stop for ruins — it simply steps over them. The Danish garrison is small, underpaid, and bored.

#### 2. Add node TL (clears 1 error)

`quest_tl_02` references node `TL`. Node not yet created. Likely a trade or road node connected to the Nájera / routier arc (TL = Toulouse? or Tamerlane waypoint?). Requires design confirmation before API call.

**Gate:** Confirm what TL stands for and what act it belongs to before creating.

#### 3. Delete orphan MONSTER_DROPS entry `creative_literacy_token` (clears 1 error)

A MONSTER_DROPS entry exists with no corresponding MONSTER_POOL entry. Safe to remove directly from HTML source. One Edit call.

---

### Short Work — Makes Flags Live

#### 4. NPC dialogue gates on faith tracks

The three faith flags exist in `_S_DEFAULTS` but nothing reads them yet. Existing NPC quests should check faith tracks in `activateCond` to make the system feel alive.

Pattern:
```javascript
// Example: Wycliffe-adjacent NPC quest only available if faith_reform >= 1
activateCond: () => (S_story.faith_reform || 0) >= 1
```

Suggested gates to add:
- `faith_reform >= 1` — unlocks itinerant preacher NPC dialogue at any city node
- `faith_reform >= 3` — unlocks heresy trial quest chain
- `faith_orthodox >= 2` — unlocks bishop quest line, pilgrimage route
- `faith_orthodox >= 3` — unlocks inquisitor NPC encounter
- `faith_folk >= 1` — unlocks `quest_lxvii67` (already done), saint shrine quests
- `faith_folk >= 2` — unlocks monster lore dialogue on certain undead encounters
- `faction_hansa >= 2` — unlocks trade privilege quests at LB/DZ/RG
- `faction_hansa <= -2` — triggers embargo encounter at Baltic port nodes

#### 5. Plague cure quest

`plague_exposed` flag can be set by failing `quest_1367_f_plague` but there is no quest to clear it. The cure requires:

```
id:           quest_plague_cure
type:         skill_check
title:        The Apothecary's Price
activateNode: (apothecary or healer node — TBD)
activateCond: () => S_story.plague_exposed === true
checkAbility: con
checkLabel:   Constitution
checkDC:      13
onPass:       () => { S_story.plague_exposed = false; }
onFail:       () => { /* plague persists, retry next day */ }
retryable:    true
retryGateDays: 1
```

Needs an apothecary NPC or node. Could anchor to an existing inn node or create a new `scholars_qtr` terrain node.

#### 6. Create node LXVII67 in NODE_MAP

The quest `quest_lxvii67` exists and its `activateNode` is `CY` (temporary). The plan (§1367-F) calls for a proper node `LXVII67` — a secret crossroads node accessible only to players with `faith_folk >= 1`.

```
code:        LXVII67
name:        forest  (or a new 'crossroads' terrain)
label:       The Jester's Crossroads
act:         3
activateCond: (S_story.faith_folk || 0) >= 1
sleep:       false
```

Once created: update `quest_lxvii67.activateNode` from `CY` to `LXVII67`.

---

### Medium Work — Historical NPCs

#### 7. Add historical NPCs to BIRKA_NPCS

§1367-E locked decision #7: Black Prince (BP), John Wycliffe (JW), Murad I (MI), Tamerlane (TL) should appear in the NPC schema. Currently none exist.

Suggested schema per NPC:
```
key:        black_prince
name:       Edward of Woodstock, the Black Prince
occupation: Commander, Duchy of Aquitaine
node:       CY  (temporary — assign to a proper node when created)
faith:      faith_orthodox  (crusading Christian commander)
```

These NPCs are authority figures in Acts II–III, not early-game combatants.

#### 8. Shattered Codex backstory — Transoxiana origin paragraph

§1367-E locked decision #6: add one paragraph to Codex lore stating origin in Transoxiana/Samarkand. Tamerlane's consolidation of Samarkand in the 1360s scattered the Codex keepers westward — that is why the Codex is shattered and its pieces are in Europe.

**Where to write it:** Find the Codex lore text in the HTML source and append the paragraph. One targeted Edit.

---

### Warnings Backlog (35 items)

All 35 warnings are MONSTER_POOL entries with no MONSTER_DROPS entry — the creature drops nothing on defeat. This is valid game design for some monsters (commoners, livestock) but should be deliberate.

**Suggested triage:**
- Intentionally drop-less monsters: flag with `drop: null` explicitly (suppresses warning)
- Monsters that should drop something: add a drop entry via `PUT /api/monster/{key}` or direct edit

Notable no-drop monsters from the warning list: `void_shaman`, `rabid_dog`, `aggressive_turkey`, `toilet_leech`, `honeybucket_spider`, `cockroach_swarm`, `swarming_wasps`, `night_owl`.

---

### Suggestions Backlog (120 items)

All 120 suggestions are MONSTER_POOL entries not assigned to any terrain. They exist as monsters but cannot be encountered in play. Triage:

- **Terrain placement pass:** assign each unplaced monster to at least one terrain via `POST /api/terrain/{key}/swap` or PUT
- **Unused on purpose:** some monsters may be reserved for specific quest encounters (not random terrain). Mark these with a `questOnly: true` flag to suppress the suggestion.

---

**Priority order:**
1. VS node (8 errors cleared, Baltic chain completed)
2. TL node (after confirming what TL is)
3. `creative_literacy_token` orphan deletion (1 line)
4. LXVII67 node creation + quest re-anchor
5. Plague cure quest
6. Faith track gates on existing NPCs
7. Historical NPC entries
8. Codex backstory paragraph
9. Monster drop triage
10. Terrain placement pass

**Cross-references:** `plan.md §1367` · `plan.md §1367-F` · `plan.md §GR` · `plan.md §DESIGN-03` · `plan.md §DUNGEON-01`

---

## §GUIDE-01 — The Fisherman's Doctrine: Four Stages of Self-Discovery (✅ IMPLEMENTED 2026-06-02)

**Status:** ✅ Implemented 2026-06-02 — 6 quests (quest_guide_01–06), Emmer Finch NPC (BIRKA_NPC_PROFILES + NPC_DIALOGUES), Rod of Self-Discovery (+1 ATK 1d4, WIS +1 on completion), birkaNpcs SSJ entry, emmerMet trigger in storyCheckQuests. Quests: SSJ/BOO chain, 3 side + 1 skill_check DC 11 (Bog Mudwhistle / U-curve), 2 side. Quest count: 218 → 228.  
**Location:** SSJ (Yugurt Cabin) · BOO (Yugurt Lake)  
**Source material:** Dr. Orion Teraban — "Just Be Yourself" (Psychax / YouTube) — the four-stage competence model as a self-growth framework  
**Depends on:** Fishing Rod in inventory (existing gate for YC NPC activation)  
**Arc reward:** +1 WIS (permanent) · Rod of Self-Discovery (new unique item)  
**New NPC:** Emmer Finch — Apprentice Fisher, the Fishing Buddy

---

### §GUIDE-01-A. The Central Argument

The transcript distills four features of good advice on self-growth:

1. **Acceptance as empowerment.** Accepting your current inadequacy is not resignation — it is the precondition for change. "This is not a terminal diagnosis. Once you accept this might be true, you can do something about it."
2. **Disciplined effort in a consistent direction.** Identity does not change from wishing or therapy or accepting yourself as you are. It changes from returning to the same practice, week after week, until you cross a threshold you cannot predict in advance.
3. **Identity as process.** "We are always in the process of becoming who we are." The Japanese speaker example: you cannot become fluent without first behaving as though you already speak the language — which is, temporarily, a kind of performance. This is not fraud. This is how everything works.
4. **The four stages of competence.** Unconscious incompetence → conscious incompetence (pain, the gift nobody wants) → conscious competence (intentional work; exhausting; things start to work but feel hard) → unconscious competence (fluency; the skill operates below awareness; "just be yourself" now applies, because you have become the self worth being).

The arc embodies these four features in structure, not in text. The teaching is enacted through what the player does across six quests, not through lectures. The Fisherman never names the stages. He fishes. He waits. He says one sentence at a time.

**Design principle:** §GUIDE-01 = wisdom-as-embodiment. Not observation (§ALCHEMY-01), not law (§WISDOM-01), but *practice*. The player returns daily. Emmer grows alongside them. The arc's thesis is delivered by the structure of the quest chain, not its dialogue.

---

### §GUIDE-01-B. The U-Curve of Knowledge

The transcript opens with a structural claim: those at the lowest level of understanding and those at the highest level often arrive at the same conclusion. It is the people in the middle who diverge, usually in an attempt to distinguish themselves from the low performers.

Example from transcript: The feast (King Solomon — *"there is nothing better for a person than to eat, drink, and be glad"*) is mocked by the middle as unworthy of a man who aspires to purpose and sacrifice. The sage returns to it and finds it correct.

This structure maps directly onto the tournament fishermen already at YC. Bog Mudwhistle represents the middle tier: credible, vocal, dismissive of effort-that-shows. The Fisherman represents the far end: he has passed through the middle, arrived at simplicity, and is no longer interested in explaining the difference. Emmer starts at the bottom — happily, obliviously, completely wrong — and over six quests crosses into the same quiet competence the Fisherman models.

The arc does not resolve this with a speech. It resolves it with Emmer's final cast — the one he doesn't think about.

---

### §GUIDE-01-C. New NPC — Emmer Finch

**Key:** `emmer_finch`  
**Name:** Emmer Finch  
**Occupation:** Apprentice Fisher  
**Node:** YC  
**Age:** ~23; arrived from a downriver mill town; never fished a lake before  
**Voice register:** Earnest, slightly out of breath, learns out loud. He says what he's thinking at the moment he's thinking it. He is not ironic. He is not performing humility — he is actually uncertain and finds that interesting rather than shameful.

**NPC_DIALOGUE progression (quoteFn — 5 states):**

| State condition | Quote |
|----------------|-------|
| `!S_story.emmerMet` | *(not yet present — appears after first YC visit with Fishing Rod)* |
| `emmerMet && !emmerStage2` | *"I think I've been doing it wrong the whole time. That's — actually kind of exciting?"* |
| `emmerStage2 && !emmerStage3` | *"He said: now you can start. Just like that. I've been thinking about it all morning."* |
| `emmerStage3 && !emmerStage4` | *"It's working. It still feels like I'm thinking too much. He says that's correct."* |
| `emmerComplete` | *"I didn't think about it. I just cast. Then the fish was there."* |

**Emmer as mirror:** He represents the player's own process. His stages mark the arc's progression. His voice is slightly ahead of his comprehension — he reports insights before he's fully absorbed them, which is accurate to how the competence stages actually work.

---

### §GUIDE-01-D. The Fisherman as Monk

The Fisherman (key: `master`, existing NPC) is already the unconsciously competent sage. His existing lines support this reading: *"Some fish don't exist in daylight."* *"You went deep."* He is always here in the morning. He does not ask where you have been or where you are going.

In this arc he does not explain the four stages. He delivers one sentence per quest, present tense, no elaboration. His teaching is the demonstration — he has arrived at the far end of the U-curve, and what he models is not technique but being.

**New Fisherman lines added per quest to quoteFn:**

| Quest | New Fisherman line |
|-------|--------------------|
| quest_guide_01 | *"You're holding it like a question."* |
| quest_guide_02 | *"Now you can start."* |
| quest_guide_03 | *"You're thinking about every move. Good. You won't always have to."* |
| quest_guide_04 | *"The wisest king in the old stories said there is nothing better than to eat and be glad. The men in the middle laughed. He was right."* |
| quest_guide_05 | *"He didn't think about it. Neither did I, once."* |
| quest_guide_06 | *(gives Rod of Self-Discovery; says nothing)* |

---

### §GUIDE-01-E. Quest Table

| ID | Type | Title | Beat | Stage mapped | Reward |
|----|------|-------|------|-------------|--------|
| `quest_guide_01` | side | "The Fool's First Cast" | Emmer arrives; casts with total confidence; completely wrong; introduces himself; asks if you want to fish together | UC Incompetence | `emmerMet: true`; +50 XP |
| `quest_guide_02` | side | "The Weight of the Hook" | Emmer loses a large fish; painful first recognition; Fisherman: *"Now you can start"* | C Incompetence; Acceptance | `emmerStage2: true`; +150 XP; `wisdomJournal_acceptance` item created |
| `quest_guide_03` | time_gate | "Morning Repetitions" | Return to YC on 3 separate days (not necessarily consecutive); each visit Emmer reports a small improvement | C Competence begins | `emmerStage3: true`; +250 XP; `wisdomJournal_effort` item created |
| `quest_guide_04` | skill_check WIS DC 11 | "The Middle Way Sneers" | Bog Mudwhistle mocks Emmer's visible trying; player must read the U-curve and not take the bait (WIS Insight) | C Competence sustained; U-curve beat | `emmerStage4a: true`; +250 XP; Bog disposition note |
| `quest_guide_05` | side | "The Cast That Didn't Think" | Emmer makes a perfect cast without deliberating; realizes after the fact; reports: *"I didn't think about it"* | UC Competence threshold | `emmerStage4: true`; +300 XP |
| `quest_guide_06` | side | "Just Be Yourself" | Arc close at YC; Fisherman gives Rod of Self-Discovery; +1 WIS applied; Emmer's final line | Arc complete | `emmerComplete: true`; **+1 WIS**; Rod of Self-Discovery |

**activateCond for quest_guide_01:** `() => _hasItem('fishing_rod') && !S_story.emmerMet`  
**activateCond for quest_guide_02:** `() => S_story.emmerMet && !S_story.emmerStage2`  
**activateCond for quest_guide_03:** `() => S_story.emmerStage2 && !S_story.emmerStage3`  
**activateCond for quest_guide_04:** `() => S_story.emmerStage3 && !S_story.emmerStage4a`  
**activateCond for quest_guide_05:** `() => S_story.emmerStage4a && !S_story.emmerStage4`  
**activateCond for quest_guide_06:** `() => S_story.emmerStage4 && !S_story.emmerComplete`

---

### §GUIDE-01-F. The Rod of Self-Discovery

**Item key:** `rod_of_self_discovery`  
**Type:** `fishing_rod` (replaces standard fishing rod in inventory slot)  
**Name:** Rod of Self-Discovery  
**Description:** *"You didn't carve this rod. You became the person who could use it."*

```javascript
{
  key: 'rod_of_self_discovery',
  name: "Rod of Self-Discovery",
  type: 'fishing_rod',
  icon: '🎣',
  castBonus: 2,       // +2 to all cast rolls (standard rod: 0)
  special: 'self_discovery',
  description: "You didn't carve this rod. You became the person who could use it."
}
```

**Special property — `self_discovery`:** In the Yugurt Tournament, each NPC challenger's effective bonus is reduced by 1 when this rod is equipped. This represents fishing from a grounded identity rather than against an opponent. The tournament display shows: *[Self-Discovery bonus applied]* in small text below the result.

**+1 WIS application:**
```javascript
// in quest_guide_06 completeFn:
S.wis = Math.min((S.wis || 10) + 1, 20);
_grantItem('rod_of_self_discovery');
S_story.emmerComplete = true;
```

---

### §GUIDE-01-G. New State Flags

```javascript
// §GUIDE-01: The Fisherman's Doctrine
S_story.emmerMet            // boolean — Emmer Finch introduced at YC
S_story.emmerStage2         // boolean — conscious incompetence beat cleared
S_story.emmerStage3         // boolean — practice gate cleared (3 YC visits)
S_story.emmerStage3Visits   // number — count of qualifying YC visits for time_gate
S_story.emmerStage4a        // boolean — U-curve WIS check passed
S_story.emmerStage4         // boolean — unconscious competence threshold crossed
S_story.emmerComplete       // boolean — arc closed; Rod granted; +1 WIS applied
S_story.wisdomJournal_acceptance  // item flag — journal page on acceptance
S_story.wisdomJournal_effort      // item flag — journal page on consistent effort
```

---

### §GUIDE-01-H. Transcript-to-Story Element Map

| Transcript element | Story element | Quest |
|--------------------|---------------|-------|
| "Just be yourself" as perennial advice — valid at both extremes | Fisherman's final silence + rod gift | quest_guide_06 |
| Fool + sage agree; middle diverges (U-curve) | Bog Mudwhistle mocks Emmer's visible trying | quest_guide_04 |
| King Solomon: nothing better than to eat and be glad | Fisherman's U-curve line: the wisest king was right | quest_guide_04 |
| Socrates: I know that I know nothing | Emmer's line after losing the fish: *"I think I've been doing it wrong the whole time"* | quest_guide_02 |
| "This is not a terminal diagnosis" | Fisherman: *"Now you can start."* | quest_guide_02 |
| Japanese speaker — must behave as if you already speak | quest_guide_03 time-gate: returning daily, practicing, even before it works | quest_guide_03 |
| Conscious competence: things feel hard because they are conscious | Emmer: *"It's working. It still feels like I'm thinking too much."* Fisherman: *"Good. You won't always have to."* | quest_guide_03/04 |
| Unconscious competence = fluency; "just be yourself" now applies | Emmer: *"I didn't think about it. I just cast. Then the fish was there."* | quest_guide_05 |
| "You will need to try to be the person you want to become" | wisdomJournal_effort item description | quest_guide_03 reward |
| "Discipline is not innate — it must be cultivated in the forge of life" | quest_guide_03 title: "Morning Repetitions" | quest_guide_03 |
| Pain = gift nobody wants → conscious incompetence | Emmer loses the fish; scene description: the weight of the fish before it was gone | quest_guide_02 |
| Identity as process: crossing a threshold where you transition from trying to being | quest_guide_05 scene: Emmer's cast; no deliberation; no threshold announced | quest_guide_05 |

---

### §GUIDE-01-I. Vignette Writing Notes

Quest nodes are written in the same compressed present-tense register as §GR (Fishmonger's Row). Each quest_guide vignette:

- One paragraph per beat, two to four sentences
- The emotional content is in what Emmer does, not what he says about how he feels
- The Fisherman's single sentence per quest is the only teaching delivered in text; everything else is scenic
- The "just be yourself" payoff is never spoken in the arc — it is enacted by the arc's last image: Emmer casting, the rod in motion, no thought preceding it

**quest_guide_01 beat note:** Emmer arrives at YC with a rod from the village market. It has a broken guide ring. He does not notice this. He casts immediately without asking anything. The line goes sideways. He says: *"Is that normal?"* He is smiling.

**quest_guide_02 beat note:** Emmer hooks something large. The rod bends correctly for the first time. He does everything wrong in sequence — pulls when he should wait, stands when he should kneel — and loses it. He stands at the water for a moment. Then: *"I think I've been doing it wrong the whole time."* He turns around and finds this interesting. The Fisherman has been watching from the cabin steps. He says: *"Now you can start."* That is all.

**quest_guide_05 beat note:** Emmer stands at the shore. He does not choose a spot. He does not look at the water first. He casts. The form is clean. He does not know it was clean until the fish is running. Later he says: *"I didn't think about it."* He looks slightly surprised at himself. This is the arrival.

**quest_guide_06 beat note:** The Fisherman brings the rod out from inside the cabin. It was not visible before. He holds it out to Emmer. Then he looks at you. The rod is yours. He does not explain. Emmer says: *"Wait, shouldn't I —"* The Fisherman goes back inside. The fire is still going. The rod is in your hands. The lake is there.

---

### §GUIDE-01-J. Next Prompt

> The following prompt is ready for the implementation session. Paste it to begin §GUIDE-01 code work.

---

**PROMPT — §GUIDE-01 Implementation:**

We are implementing §GUIDE-01 — The Fisherman's Doctrine: Four Stages of Self-Discovery. Location: YC (Yugurt Cabin). This is a 6-quest arc anchored at the existing Yugurt fishing area. The arc introduces **Emmer Finch** (new NPC, key: `emmer_finch`, Apprentice Fisher, node: YC) and delivers a +1 WIS reward plus the **Rod of Self-Discovery** (unique fishing rod, +2 castBonus, `special: 'self_discovery'`).

The four features encoded in the arc:
1. Acceptance as empowerment (quest_guide_02 — Emmer loses the fish; Fisherman: "Now you can start.")
2. Disciplined effort in a consistent direction (quest_guide_03 — time_gate: 3 separate YC day-visits)
3. Identity as process (quest_guide_05 — Emmer's unconscious cast; no deliberation; the threshold crossed)
4. Four stages of competence as arc structure (UC Incompetence → C Incompetence → C Competence → UC Competence)

Implement in this order:
1. Add `emmer_finch` to `BIRKA_NPCS` (or equivalent NPC array) at node YC with a `quoteFn` conditional on emmer state flags.
2. Add the 6 quest entries to `QUEST_DB` with correct `activateCond`, `completeFn`, and reward fields.
3. Add `rod_of_self_discovery` to `WEAPON_ITEMS` (or `FISHING_ITEMS` if that array exists) with `castBonus: 2` and `special: 'self_discovery'`.
4. Wire the `special: 'self_discovery'` property into the tournament roll function (`_tourRoll`) so each NPC's effective bonus is reduced by 1 when the rod is equipped.
5. Add +1 WIS application in quest_guide_06 completeFn: `S.wis = Math.min((S.wis || 10) + 1, 20)`.
6. Add the 9 new state flags to `_S_DEFAULTS`.
7. Update the Fisherman's `quoteFn` at YC to include the 5 new conditional lines (one per quest_guide_01 through _05).
8. Write vignette prose for all 6 storyRender quest nodes following the §GR compressed present-tense register.

Verify: after quest_guide_06 complete, player WIS is +1, `rod_of_self_discovery` is in inventory, `emmerComplete` is true, Emmer's quote at YC reads: *"I didn't think about it. I just cast. Then the fish was there."*

**Cross-references:** `plan.md §XLV` (Yugurt Tournament) · `plan.md §WISDOM-01` · `plan.md §ALCHEMY-01` · `lab-report-fish-with-dnd.md` · `lab-report-fishing-bait-prompting.md`

---

**Cross-references (section):** `plan.md §XLV` · `plan.md §WISDOM-01` · `plan.md §ALCHEMY-01` · `plan.md §GR` · `lab-report-fish-with-dnd.md` · `lab-report-fishing-bait-prompting.md`

---

## §SCAR-01 — Scar into a Star: The Philosopher's Wound (✅ IMPLEMENTED 2026-06-02)

**Status:** ✅ Implemented 2026-06-02 — 4 quests (quest_scar_01–04), Gret Orrens + Pier Falk NPCs (BIRKA_NPC_PROFILES + NPC_DIALOGUES), The Scar's Light (passive amulet: +1 ATK/DMG when HP ≤ 75%, wired into attack resolution via _scarsLight), Orrens Manuscript (readable), WIS +1 on mercy path (gretChoice='help'). birkaNpcs NUE entry. Binary choice mechanic via WIS DC 11 skill check (quest_scar_03).  
**Location:** NUE (Scholar's Quarter — Weimar)  
**Source material:** Dr. Orion Teraban — "Wounds" (Psych Hacks / YouTube) · William Golding — *Freefall* ("This is how the scar becomes a star")  
**Depends on:** Weimar accessed (Act VI) · SQ node unlocked  
**Arc reward:** The Scar's Light (unique passive item) · +1 WIS (mercy path) OR +500gp (refusal path)  
**New NPC:** Gret Orrens — Philosopher, Scholar's Quarter

---

### §SCAR-01-A. The Central Argument

The transcript establishes three non-obvious claims about suffering:

1. **The wound is a resource, not a deficit.** The suffering you have survived contains something of irreplaceable value — not because it made you stronger (this is the cliché; it does not always), but because it gives you the only kind of authority that cannot be faked: lived escape from the labyrinth. Golding's line: *"This is how the scar becomes a star."*

2. **"Bloodless good" is weak.** The goodness of people who have never been hurt is structurally insufficient — it is difficult to trust and inspires few to follow. The goodness of someone who had every right to lash out and chose differently is a different order of thing: powerful, trustworthy, inspiring. This is the price: the scar is what the real goodness costs.

3. **"It is never the same."** The scar may never regain its original functionality or sensitivity. This is not a tragedy. This is the condition. The wound does not heal back into what it was. It heals into something that can only exist because it was wounded. That is the point.

**The AA sponsor model:** The transcript closes with a practical claim — guidance out of suffering must come from someone who has been there. A textbook cannot do this. A certification cannot do this. The escaped prisoner has something the academic does not. This gives the recovered person a moral obligation and a unique standing. Gret Orrens operates on this model: she teaches from her scar, not around it.

**Design principle:** §SCAR-01 = wisdom-as-redemption. Where §GUIDE-01 is about becoming (practice, stages), §SCAR-01 is about transmutation (lead → gold; scar → star). The arc is structured around a moral fulcrum — quest_scar_03 — where the player must counsel Gret on whether to help the person who wronged her. Both paths are complete. Only one path produces the star.

---

### §SCAR-01-B. Transcript → Story Elements

| Transcript element | Story element | Quest |
|--------------------|---------------|-------|
| William Golding: "This is how the scar becomes a star" | Gret's opening line to player; the thesis delivered directly, not explained | quest_scar_01 |
| The wound is often due to ignorance and indifference, not malice | Gret's framing of Aldric Hamm's plagiarism: *"I do not think he knew what he was doing to me. That is worse, not better. And also not his fault."* | quest_scar_01 |
| "Hurt people hurt people" — the impulse to lash out is understandable | The trapped person at BQ (Pier Falk) — actively lashing out at the student who reminds him of his own loss | quest_scar_02 |
| The shock thought experiment — men would take pain rather than pass it on | quest_scar_03 choice: Gret counseled to help Aldric's son even at cost to herself | quest_scar_03 |
| Lead → gold alchemical transmutation of suffering into wisdom | The Scar's Light item passive: below 50% HP, wound becomes power | quest_scar_04 |
| "Bloodless good" is weak; hard-won good is powerful and trustworthy | Gret's final quote (mercy path): *"The weak good says 'I forgive you.' The real good shows up anyway."* | quest_scar_04 |
| AA sponsor: guide from lived escape, not textbook | Gret's method — she does not cite theories; she shows you her manuscript under Hamm's name | quest_scar_01 |
| "It is never the same" | The Scar's Light item description; Gret's scar is visible in how she pauses before proper nouns | throughout |
| "There's a way out, brother. I've been where you are." | quest_scar_02 resolution: player delivers this to Pier Falk | quest_scar_02 |
| Pain as badge of honor; wound as military decoration | The Scar's Light passive — mechanic triggers on damage taken; the badge is worn by surviving, not avoiding | item design |

---

### §SCAR-01-C. New NPC — Gret Orrens

**Key:** `gret_orrens`  
**Name:** Gret Orrens  
**Occupation:** Philosopher (unaffiliated)  
**Node:** SQ (Weimar Scholar's Quarter)  
**Age:** ~55

**Wound:** Her manuscript — a systematic moral philosophy titled *On the Obligation of the Escaped* — was submitted to the Weimar Academy by her former research partner Aldric Hamm as his sole work, twelve years ago. The Academy adopted it as curriculum. She filed a guild dispute and lost on procedural grounds (the manuscript bore Hamm's initial revisions; her name was on a discarded draft). Aldric Hamm died seven years ago. The work sits in the Great Archive under his name.

**Current state:** She is still writing. She does not go to the Archive. She says her new work is better. She says this without emphasis. When pressed on whether she is bitter: *"Bitter? I don't know. I notice that I write more carefully now. I notice every word. I don't think I did before."*

**Voice register:** Precise, measured, short declarative sentences. She argues but does not perform. She can be funny in a dry way. She does not seek your sympathy and is faintly surprised when people offer it. She uses her wound as evidence the way a scientist uses data: *"Here is what happened to me. Here is what I observe from it."*

**NPC_DIALOGUE progression (quoteFn — 4 states):**

| State | Quote |
|-------|-------|
| `!S_story.gretMet` | *"The scar does not go back to being skin. That is how you know it was real."* |
| `gretMet && !gretLabyrinth` | *"There is a man at the Book Quarter who is very angry. He doesn't know yet that the anger is not about the books."* |
| `gretLabyrinth && !gretChoice` | *"Hamm's son came by. I have been thinking about what to do. I don't think thinking is the right tool for this."* |
| `gretComplete` | *"The weak good says 'I forgive you.' The real good shows up anyway."* |

---

### §SCAR-01-D. Secondary NPC — Pier Falk

**Key:** `pier_falk`  
**Name:** Pier Falk  
**Occupation:** Former Copyist, Book Quarter  
**Node:** BQ (Book Quarter)  
**Role:** The trapped person — the one who has not yet escaped the labyrinth; the demonstration of "hurt people hurt people"

**Wound:** Pier was a copyist whose workshop burned three years ago — all his work, his tools, his journeyman records. He could not prove his hours and was not admitted to the Guild. He now works informally, underpaid, and lashes out at younger copyists who have their papers in order. He is not a villain. He is someone who is still inside the pain.

**Quest_scar_02 role:** Player identifies Pier by observation (WIS Insight DC 12) — reads his hostility as pain, not character. Then delivers a version of the AA sponsor line: *"There's a way through. Someone showed me."* (Gret's method, passed forward.)

---

### §SCAR-01-E. Quest Table

| ID | Type | Title | Beat | Stage | Reward |
|----|------|-------|------|-------|--------|
| `quest_scar_01` | side | "The Open Ledger" | Meet Gret at SQ; she shows player Hamm's published text alongside her discarded draft — the same words; she does not perform her wound | The wound as fact | `gretMet: true`; +100 XP; `scar_draft` item created |
| `quest_scar_02` | skill_check WIS DC 12 | "The Labyrinth" | Find Pier Falk at BQ; read his behavior correctly (Insight: his hostility is grief, not aggression); deliver Gret's method forward | Recognition + transmission | `gretLabyrinth: true`; +200 XP; Pier Falk disposition: Neutral→Warm |
| `quest_scar_03` | choice | "The Shock" | Aldric Hamm's son Ren arrives seeking Gret's testimony to restore family honor (claiming his father was misled by Gret, not the reverse); player must counsel her — help him or refuse | Moral fulcrum; shock thought experiment | `gretChoice: 'help'` or `'refuse'`; +250 XP |
| `quest_scar_04` | side | "The Star" | Arc close; Gret acts on player's counsel; receives the outcome; gives player The Scar's Light (mercy path) or a completed philosophical text (refusal path) | Transmutation | `gretComplete: true`; **The Scar's Light** (mercy) or **+1 WIS + 500gp** (refusal) |

**activateCond for quest_scar_01:** `() => S_story.weimarReached && !S_story.gretMet`  
**activateCond for quest_scar_02:** `() => S_story.gretMet && !S_story.gretLabyrinth`  
**activateCond for quest_scar_03:** `() => S_story.gretLabyrinth && !S_story.gretChoice`  
**activateCond for quest_scar_04:** `() => S_story.gretChoice && !S_story.gretComplete`

---

### §SCAR-01-F. The Choice — Quest_scar_03 Design

The choice is not framed as good vs. evil. Both options are argued by Gret herself, who does not know what to do.

**The setup:** Ren Hamm, Aldric's son (~30, earnest, carrying his father's shame), arrives at SQ. He has found Gret's discarded draft. He knows. He wants Gret to testify to the Academy that his father acted without full understanding — that Hamm was confused, not corrupt. This would partially restore the Hamm family name without fully crediting Gret. Her name still would not appear on the work.

**The cost of help:** Gret gets nothing formally. She loses time, reopens the wound, and gives the Hamm family partial peace. She remains uncredited.

**The cost of refusal:** Ren leaves empty-handed. The wound stays the wound. Gret keeps her anger clean and private.

**Player counsels Gret — two rendered paths:**

*Help path button text:* "Go. Show up. That's the real good."  
*Gret's response (help):* *"Yes. I think so too. I was hoping you'd say that."* She pauses. *"Not because I couldn't decide. Because I needed to say it to someone first."*

*Refusal path button text:* "You owe him nothing. Protect yourself."  
*Gret's response (refusal):* *"You're right. I don't owe him anything. That is exactly right." A silence.* *"And yet."*

Both paths complete quest_scar_03. The `gretChoice` flag records the decision. Quest_scar_04 reads this flag to determine the reward branch.

---

### §SCAR-01-G. The Scar's Light — Item Design

**Item key:** `scars_light`  
**Name:** The Scar's Light  
**Type:** `amulet` (passive — equip slot)  
**Path:** mercy path only (`gretChoice === 'help'`)  
**Description:** *"It is never the same. That is the point."*

```javascript
{
  key: 'scars_light',
  name: "The Scar's Light",
  type: 'amulet',
  icon: '⭐',
  passive: 'wound_badge',
  description: "It is never the same. That is the point."
}
```

**Passive — `wound_badge`:** When the player has taken ≥ 25% of their max HP in damage during the current combat encounter, +1 to all attack rolls and +1 to all damage rolls for the remainder of that encounter. The bonus activates mid-fight and stays active once triggered.

**Design rationale:** The wound is not removed — it is the activation condition. You do not receive the bonus by avoiding damage; you receive it by having been hit. The badge is worn on the scar. The star is made from the wound's material.

**Mechanical note:** The `wound_badge` passive check runs in the attack resolution function. Condition: `(S.maxHp - S.hp) / S.maxHp >= 0.25 && S_story.scarsLightEquipped`. If true, add +1 to `_rollHit()` result and +1 to damage.

---

### §SCAR-01-H. Refusal Path — "And Yet"

If the player counsels refusal: Gret does not give The Scar's Light. Instead quest_scar_04 renders a different close:

Gret completes her current manuscript and gives the player a copy: **Orrens: On the Obligation of the Escaped** — a readable item (knowledge entry). It contains her philosophy in compressed form, including:

> *"The good that comes from those who have never been hurt is often of a weak and bloodless sort. It inspires few to follow. The good that comes from those who have been hurt — and who choose a different path — is powerful, trustworthy, and, when it arrives, unmistakable."* — Gret Orrens

The refusal path grants **+1 WIS** (the philosophical argument absorbed) and **+500gp** (Gret pays for the consultation, which she calls "worth more than the Academy ever gave me"). No passive item. The arc closes without The Star — because the lead was not transmuted. The scar stayed a scar. Gret keeps writing. The manuscript still sits under Hamm's name.

This path is not wrong. It is honest. The arc does not punish it. It simply shows that the transmutation requires the willingness to absorb the shock — and that willingness is not automatic.

---

### §SCAR-01-I. New State Flags

```javascript
// §SCAR-01: Scar into a Star
S_story.gretMet           // boolean — Gret Orrens met at SQ
S_story.gretLabyrinth     // boolean — Pier Falk identified and reached
S_story.gretChoice        // string — 'help' | 'refuse'
S_story.gretComplete      // boolean — arc closed
S_story.scarsLightEquipped // boolean — The Scar's Light in active equip slot
S_story.pierFalkWarm      // boolean — Pier Falk disposition updated
```

**Token items created by arc:**

| Item key | Created | Description |
|----------|---------|-------------|
| `scar_draft` | quest_scar_01 | *Gret's Discarded Draft — same words, wrong name on the cover* |
| `scars_light` | quest_scar_04 (mercy path) | *The Scar's Light — passive amulet* |
| `orrens_manuscript` | quest_scar_04 (refusal path) | *Orrens: On the Obligation of the Escaped — readable knowledge item* |

---

### §SCAR-01-J. Vignette Writing Notes

All §SCAR-01 prose uses the compressed present-tense register, two to four sentences per beat. The wound is never described from inside; it is described from its observable effects.

**quest_scar_01 beat note:** The room at SQ is small. Two manuscripts are open on the table, side by side. They are the same text. One cover reads *Aldric Hamm*. She does not point. She waits for you to see it. When you do, she says: *"Twelve years. He died seven years ago. The Academy still assigns it."* She turns a page. *"The chapter on obligation. That one especially."*

**quest_scar_02 beat note:** Pier Falk is explaining, at volume, why a young copyist's margin annotations are incorrect. The annotations are not incorrect. His hands are moving too much. You know the shape of this before he finishes the sentence. After: *"There's a way through. Someone showed me once."* He stops. He looks at you as if you have said something in a language he stopped expecting to hear. He doesn't answer. He nods once.

**quest_scar_03 beat note (help path):** Ren Hamm stands in the doorway. He is holding a draft with Gret's handwriting on it. He found it. He knows. Gret looks at him for a long time without speaking. Then she looks at you. The choice is: take the shock yourself, or pass it on. The shock has already been administered. What you decide is what you do with it afterward.

**quest_scar_04 beat note (mercy path):** She returns from the Academy three days later. She does not say what happened. She sits down and opens her manuscript and writes one sentence. Then she takes something from her coat — a small pendant — and sets it on the table between you. She does not look up. *"Keep it."* You pick it up. It is warm. Not from her hands.

---

### §SCAR-01-K. Next Prompt

> The following prompt is ready for the implementation session. Paste it to begin §SCAR-01 code work.

---

**PROMPT — §SCAR-01 Implementation:**

We are implementing §SCAR-01 — Scar into a Star: The Philosopher's Wound. Location: SQ (Weimar Scholar's Quarter) and BQ (Book Quarter). The arc introduces two new NPCs: **Gret Orrens** (key: `gret_orrens`, Philosopher, SQ) and **Pier Falk** (key: `pier_falk`, Former Copyist, BQ). It runs 4 quests with a binary choice at quest_scar_03 that determines the arc's reward branch.

**Source thesis:** William Golding — *"This is how the scar becomes a star."* The wound cannot be unchanged; what can be changed is whether it is transmuted into goodness. The arc's moral fulcrum is quest_scar_03: player counsels Gret on whether to help Aldric Hamm's son testify before the Academy — absorbing the shock rather than passing it on.

**Mercy path reward:** The Scar's Light (`scars_light`) — passive amulet, `passive: 'wound_badge'`. Activates when player has taken ≥ 25% max HP damage in current combat: +1 attack rolls, +1 damage rolls for remainder of encounter.

**Refusal path reward:** +1 WIS + 500gp + `orrens_manuscript` (readable knowledge item containing Gret's philosophical argument).

Implement in this order:
1. Add `gret_orrens` to relevant NPC array at node SQ with `quoteFn` conditional on `gretMet/gretLabyrinth/gretChoice/gretComplete`.
2. Add `pier_falk` to relevant NPC array at node BQ — static quote, disposition flag `pierFalkWarm`.
3. Add 4 quest entries to `QUEST_DB`: quest_scar_01 (side), quest_scar_02 (skill_check WIS DC 12), quest_scar_03 (choice — two button paths, `gretChoice` set to `'help'` or `'refuse'`), quest_scar_04 (side — branches on `gretChoice`).
4. Add `scars_light` amulet to item array with `passive: 'wound_badge'`.
5. Wire `wound_badge` passive into attack resolution: `if ((S.maxHp - S.hp)/S.maxHp >= 0.25 && S_story.scarsLightEquipped) { hitBonus += 1; dmgBonus += 1; }`.
6. Add `orrens_manuscript` as a readable knowledge item (renders text on use, same pattern as Froberger journal entries or tome items).
7. Add 6 state flags to `_S_DEFAULTS`: `gretMet`, `gretLabyrinth`, `gretChoice`, `gretComplete`, `scarsLightEquipped`, `pierFalkWarm`.
8. Write vignette prose for all 4 quest beats in compressed present-tense register (§GR/§GUIDE-01 style).

Verify: quest_scar_03 correctly branches; mercy path grants `scars_light` and sets `gretComplete`; refusal path grants `orrens_manuscript` + applies +1 WIS + 500gp + sets `gretComplete`. The `wound_badge` passive fires only in combat when damage threshold met and item is equipped.

**Cross-references:** `plan.md §GR` · `plan.md §WISDOM-01` · `plan.md §GUIDE-01` · `plan.md §XVI (Weimar Scholar Gate)` · `lab-report-weimar-scholar-gate.md` · `lab-report-la-riva-grief-arc.md`

---

**Cross-references (section):** `plan.md §XVI` · `plan.md §GR` · `plan.md §GUIDE-01` · `plan.md §WISDOM-01` · `lab-report-weimar-scholar-gate.md`

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

The `&` runs `say` in background so it doesn't block the next request. Always announce commits and loop transitions out loud.

