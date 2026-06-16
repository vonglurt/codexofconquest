<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report Synthesis — Part 5: NPC & Narrative
**Cross-Reference of All NPC & Narrative Lab Reports Against roll2hit-v3.html**
**Date:** 2026-06-16 · **HTML baseline:** 33,721 lines · **Source reports:** 8

---

## Purpose

Each entry reads the lab report against the live HTML and answers: what was documented, what is the current code, what still applies as working design knowledge. Reports are in `lab-reports/` untouched.

---

## Report 1 — `lab-report-npc-dialogue-system.md`
**Original scope:** Layer 42 — 4-state NPC speech system, world-truth profiles, Groundhog Day mechanic, 6 Birka NPCs (2026-05-22)
**Still active:** Yes — the system is live; several state definitions differ from the design

### What the report said

**4-state dialogue system.** Every NPC has four states keyed to `S_story.npcFavorability[npcKey]`: Impartial (0), Quest-Active (quest in journal), Friendly (fav ≥ 2), Dear Friend (fav ≥ 3). Visit-count cycling instead of random: `visitCount % pool.length` ensures all quotes surface across multiple visits.

**Six Birka NPCs** with full design matrices: Yael (guard captain — suppressed riots), Brynn (innkeeper — invisible labor), Quill/Couperin (bard — institutional capture), Pachelbel/Deacon (fence — moral code as armor), Crov/Weckmann (pit master — coaching becomes variable-watching), Auros/Bruhns (researcher — diagnosis as worldview). Each has a worldTruth, enemy, wound, and curse expression.

**`_missionComplete()` with 12 bits.** Original design: `bits.every(Boolean)` — all 12 must be true.

**The Groundhog Day mechanic.** Four ending variants keyed on `_missionComplete() && _curseScore()`. The loop closes when you choose people over efficiency.

*Note: the report itself carries an implementation note (added at SP2) correcting the state logic — `questActive` fires when `_hasActiveQuestFor(npcKey)` is true regardless of fav level, not at fav=1; `_missionComplete()` returns `>= 8`, not `.every(Boolean)`.*

### Current HTML relevance

**`NPC_DIALOGUES` is live at line 9,146.** The structure matches the design. All 6 Birka NPCs are present with the `meta`, `impartial`, `questActive` (or equivalent), `friendly`, `dearFriend` fields. The system is live and active.

**`_getNPCDialogue()` at line 21,619 is live.** State selection follows the SP2-corrected logic: `questActive` triggers on `_hasActiveQuestFor(npcKey)`, independent of fav level.

**`BIRKA_NPC_PROFILES` is a separate, parallel structure** at line 20,810. The NPC card renderer `_renderNpcCard()` at line 21,715 reads from both `BIRKA_NPC_PROFILES` (for portrait/greeting/profile) and `NPC_DIALOGUES` (for cycling quotes). The design document describes one object; the live code uses two parallel objects. Both are required.

**`_missionComplete()` at line 21,698 is live and correct per the SP2 note.** 12 bits evaluated, returns `>= 8`. Current bits:

| Bit | Condition |
|-----|-----------|
| `yaelEscortUsed` | Flag set |
| `brynnsJournalRead` | `journalEntriesRead` includes entry 7 |
| `couperiSongReceived` | Flag set |
| `pachelbelPaidBack` | `quest_pachelbel_shipment === 'complete'` |
| `crovPitTrainingWins` | `pitTrainingWins >= 3` |
| `bruhnsDepthsReported` | Flag set |
| `allEbReturns` | `ebReturnDone` filter ≥ 5 (not 20 — reduced threshold) |
| `journalHalf` | `journalEntriesRead.length >= 9` |
| `sealedVoid` | `defeatedBattles['TLS']` set |
| `atLeastThreeFriends` | `_lubeckFriends() >= 3` |
| `noHighCurse` | `_curseScore() < 10` |
| `returnedToCI` | `visited['LHR']` && `level >= 5` |

The EB returns threshold dropped from 20 (original design) to 5 — a significant relaxation. NPC name and key changes from design to live: Quill/Couperin → `quill`, Pachelbel/Deacon → `pachelbel`, Weckmann/Crov → `crov`, Auros/Bruhns → `bruhns`.

### What still applies

- **`NPC_DIALOGUES` is the canonical quote source.** Four arrays per NPC key: `impartial`, `questActive`, `friendly`, `dearFriend`. The visit-count cycling `(visitKey % pool.length)` is load-bearing — do not convert to random.
- **`BIRKA_NPC_PROFILES` is required alongside `NPC_DIALOGUES`.** Both structures must be present and keyed consistently for `_renderNpcCard()` to work.
- **Occupation as lens.** Each NPC has a `worldTruth` and `enemy` in `meta`. These appear on the card at fav ≥ 2. Don't flatten these into generic flavor.
- **The EB return threshold is now ≥ 5, not 20.** The design required all 20 EB returns. The live `_missionComplete()` requires 5 `ebReturnDone` flags.

---

## Report 2 — `lab-report-npc-speak-sdk.md`
**Original scope:** WBAPI NPC speak endpoint — live Claude API character instantiation, Emmer Finch test (2026-06-05)
**Still active:** Yes — endpoint implemented in `wbapi-server.js`

### What the report said

`GET /api/npc/{id}/speak?prompt={text}&state={neutral|friendly|dearFriend}` calls the Claude Haiku 4.5 model with a system prompt built from the NPC's `BIRKA_NPC_PROFILES` entry (name, occupation, node text, voice examples for all states). Prompt caching on the system block. Falls back to seed text if `ANTHROPIC_API_KEY` absent. Logs every call to `milepoints/npc-speak.log`.

Test subject: Emmer Finch (`emmer`, node SSJ), 6 calls, 2 prompts ("hello", "biggest fish"). Key finding: **the arc holds without instruction** where seed dialogue is strong (dearFriend: *"Age sixteen. Silver fish. Arms shaking. 'That's not the biggest fish in the river.'"*). Friendly state weakest — seed dialogue quality problem, not model problem. The prompt is short; `worldTruth` and `enemy` not yet passed.

### Current HTML relevance

**The `/api/npc/{id}/speak` endpoint is implemented in `wbapi-server.js` at line 11,408.** Matches the design: GET handler, Claude API call with seed fallback, logging to `npc-speak.log`. The endpoint is live.

**The endpoint uses `BIRKA_NPC_PROFILES` data** served from the extracted game file. The system prompt includes node text and voice examples. The `ANTHROPIC_API_KEY` gate and seed fallback are confirmed at lines 11,428–11,436.

**Recommended extensions from the report** (worldTruth + enemy in prompt; `questContext` parameter; pre-render cache) were not implemented as of this synthesis. The endpoint works at "first attempt" quality.

### What still applies

- **The `/api/npc/{id}/speak` endpoint is available for player-prompt NPC interactions** — the long tail beyond the pre-rendered `NPC_DIALOGUES` arrays. Use it for arbitrary player-initiated prompts; use `NPC_DIALOGUES` for known cycling exchanges.
- **Friendly seed dialogue is weaker than neutral or dearFriend.** This is a content gap, not a model gap. Improving friendly dialogue strings in `NPC_DIALOGUES` improves the speak endpoint's output for that state at zero model cost.
- **The loop note from the report is permanently accurate:** *"The lab reports are the npc-speak.log of the collaboration. They function identically to the character cache: a record of what was said, by whom, under what conditions, for future retrieval."* This synthesis document is that cache.

---

## Report 3 — `lab-report-corelli-merchant.md`
**Original scope:** Layer 61, §XXVI — Corelli the Wandering Merchant, 5 appearances, reveal arc (2026-05-25)
**Still active:** Yes — fully implemented; appearance node sequence changed

### What the report said

Five appearances across acts (DK/RD/BK/SQ/IN), gated by `corelli_encounter_count < index`. Favorability derived from purchase count. Five items: `scholar_ink`, `encoded_letter`, `false_warrant`, `kings_seal`, `last_cipher` (auto-delivered, free). Fifth appearance revelation modal when `fav_corelli >= 3`: "She built it to save us. They hid it to save themselves." `last_cipher` delivered, `encoded_letter` footnote retroactively appended.

### Current HTML relevance

**All Corelli structures are live.** `CORELLI_ITEMS` at line 24,298, `CORELLI_APPEARANCES` at line 24,310, all four state flags in `_S_DEFAULTS` at line 21,234, helper functions at lines 21,531–21,534.

**Appearance node sequence changed from design.** The design document lists DK/RD/BK/SQ/IN. The `wbapi-server.js` `GET /api/nodes` help text (line 1,467) and CORELLI_APPEARANCES doc comment (line 24,310) indicate the sequence shifted to TL/RD/IS/WM/IN. Node code changes: DK→TL (Harbor Docks), BK→IS (somewhere in act 5), SQ→WM (Weimar Scholar Quarter). Core mechanics unchanged.

**`kings_seal` death-save integration is live** at line 6,732: `_kingsSealBonus` checks inventory for the seal by name and grants +1 to death saves.

**`false_warrant` disable gate** — the design specified disabling at `voidPressure >= 7`. The current HTML uses `actNumber` gating rather than explicit voidPressure checks — behavior preserved, mechanism may differ.

**The post-mortem gaps from the report remain unaddressed:**
- Act II–III gap attrition (no ambient reminder)
- `false_warrant` mechanical effect not described to player on consumption
- `kings_seal` at 350gp still expensive relative to mechanical benefit

### What still applies

- **`fav_corelli` is always derived from `corelli_purchase_count`, never set directly.** Don't add manual fav_corelli assignments.
- **`encoded_letter` footnote retroactive decode** via `corelliRevelationDelivered` is load-bearing. The check at line 27,552 reads inventory and appends `_decoded` content. Preserve this flag.
- **`last_cipher` auto-delivery at appearance 5 is non-transactional by design.** Don't add a price to it.

---

## Report 4 — `lab-report-living-world.md`
**Original scope:** Layer 44 — off-screen Gigault, world progression events, map memory, corridor farewells, Brynn's maintenance tasks (2026-05-22)
**Still active:** Majority implemented; some features remain design-stage

### What the report said

Gigault as uninteractable off-screen character (3-state stall, never present). World progression events keyed to act transitions. Map warmth gradient (NPC favorability → node color). Corridor farewell system (`NPC_FAREWELLS`, Friendly+ only). Brynn's maintenance tasks (fix step, firewood, pantry restock). Pachelbel's moral code readable. Void's First Sign flicker in Act I. Final map render at game end.

### Current HTML relevance

**Gigault / `PETRA_STALL_STATES` is live** at line 25,083–25,086. `_getGigaultState()` at line 25,228 cycles on `gameDay % 3`. Her stall appears at the CI node. She is never there. This is correct.

**`NPC_FAREWELLS` is live** at line 25,106. Route-specific and default farewells per NPC. Fires via `_getFarewell()` at line 25,248. Friendly+ only, correct.

**`NPC_ACT_THREE_LINES` is live** at line 25,139. One-line Act III injections per NPC. `_getNPCDialogue()` at line 21,642 checks for these and returns them with priority when `actNumber >= 3` and the line hasn't been seen.

**`BRYNN_MAINTENANCE_TASKS` is live** at line 25,168–25,177. Three tasks with gold cost, flags (`brynThirdStepFixed`, `brynFirewoodBrought`, `brynPantryRestocked`), ledger balance updates. All three flags live in `_S_DEFAULTS` at line 21,186.

**`NODE_NPC_KEYS` is live** at line 25,098. Maps node codes to NPC keys for dialogue routing.

**`NPC_ROMANCE_VIGNETTES` is live** at line 25,159. Once-per-run vignettes fired post-sleep when NPC's home node was in last 3 moves.

**World progression events partially implemented.** `couperiDebtDegraded` fires via a WORLD_EVENTS handler at line 25,095 when `actNumber >= 4 && !quillQuestComplete`. Quill's dialogue silently changes. The `worldEventsFired` array at line 21,185 tracks fired events. The specific CSS `WORLD_JOURNAL_STYLE` class from the report is not confirmed as a live style block — world events may render as standard messages.

**Map warmth gradient — not confirmed implemented.** The design specified `_getNodeMapColor()` returning warmth tints based on NPC fav. The function may not be live in the current minimap render path. `NODE_NPC_KEYS` exists (prerequisite), but the gradient render is unconfirmed.

**Void's First Sign flicker — not confirmed implemented.** The Act I minimap flicker at a specific cell with CSS animation is a design-stage feature; no confirming grep.

**Final map render — not confirmed implemented.** The post-ending full-screen node map at `_renderFinalMap()` is a design-stage feature.

### What still applies

- **Gigault is the off-screen character template.** Never interactable. Named by Friendly NPCs. The stall rotates 3 states. No quest hooks. Any new "city person who exists" follows this pattern.
- **`NPC_ACT_THREE_LINES` is additive, not replacing.** Don't replace the existing quote pool with Act III lines — `_getNPCDialogue()` returns them with priority and then the cycle continues with the regular pool.
- **Brynn's third step still creaks until fixed.** `brynThirdStepFixed` drives the ledger balance. If anyone adds new maintenance tasks, they follow the same `{label, cost_gold, flag, action, narration}` pattern.
- **The "antidote to the Curse of Knowledge" framing is the design philosophy.** The world doesn't wait for the player. It was going before they arrived. Every world-progression event should reinforce this: Quill's debt is worse when you come back, not because the game punished you, but because time passed.

---

## Report 5 — `lab-report-narrative-arcs-brynn-bruhns-yael.md`
**Original scope:** Layers 70, 72, 74 (§XXXV/§XXXVII/§XXXIX) — three companion scene arcs (2026-05-25)
**Still active:** Yes — all three arcs fully implemented and live

### What the report said

Three scene-const arcs with no new nodes, monsters, or items. Brynn's Vigil (3 flags: `brynnKeeperStoryTold`, `brynnLightChoiceMade`, `brynnLightKept`; lamp burns for travelers who haven't come back). Bruhns CO Scene (1 flag `bruhnsCoSceneDelivered`; "She is not sure she believed the right people"; cross-dep on `s29LineDelivered`). Yael Named Report Scene (1 flag `yaelNamedReportDelivered`; filed her name on the suppression report; `yaelEscortUsed` required).

### Current HTML relevance

**All three arcs are fully live:**

| Arc | Const | Flags (line) |
|-----|-------|------|
| Brynn's Vigil | `BRYNN_KEEPER_STORY` (line 24,732) | 3 flags at line 21,208 |
| Bruhns CO Scene | `BRUHNS_CO_SCENE` (line 25,719) | 1 flag at line 21,209 |
| Yael Named Report | `YAEL_NAMED_REPORT_SCENE` (line 25,705) | 1 flag at line 21,210 |

**Cross-dependencies confirmed live:** `s29LineDelivered` at line 21,190. `yaelEscortUsed` is an existing mission bit flag. Both work as read-only guards into the scenes.

**Yael patrol addendum confirmed:** Line 25,399 fires a patrol line at MSY when `yaelNamedReportDelivered` is true: *"The second report is filed. I'm not watching to see if it disappears."* Note: the design specified the SW patrol node; live code uses MSY (patrol node in current world layout).

**The Bruhns CO arc cross-dependency note is the most architecturally notable feature.** The `dearFriendWithTheory` variant in `BRUHNS_CO_SCENE` appends a confirmatory line (not explanatory) when `s29LineDelivered` is true. This is the game's only arc where companion disclosure is gated on cross-arc knowledge — the player must have encountered the Auros theory before Bruhns will confirm it.

### What still applies

- **Arc triggers are triple-gated.** Brynn: `fav_brynn >= 1` AND `actNumber >= 2` AND `!brynnKeeperStoryTold`. Bruhns: `!bruhnsCoSceneDelivered`. Yael: `fav >= 2` AND `actNumber >= 6` AND `yaelEscortUsed`. Never collapse these gates — they ensure the scene lands with the right weight at the right moment.
- **Neither Bruhns's confession nor Yael's report branches on player response.** Both are faits accomplis. The player witnesses; they don't determine. Don't add response branches that change the outcome — Bruhns has already signed on; Yael has already filed.
- **The ambient lamp line at IN after `brynnLightChoiceMade` is load-bearing.** Without it the arc closes at Beat 2 and leaves no trace. It's a one-sentence passive residue that changes the node forever. Keep it.

---

## Report 6 — `lab-report-la-riva-grief-arc.md`
**Original scope:** Layer 78 (§GR) — La Riva grief arc, five-act vignette, romance layer, hour counter (2026-05-26)
**Still active:** Yes — arc fully live; node code differs from report; romance layer fully live

### What the report said

**The corruption-grief chain.** Void pressure → Merchant Cats → Taz Devils → Cat-King → Fishmonger's Row → Vincenzo Tuna → Connie + Aldo → Corrupted Cats colonize grief. The chain was already present in the HTML; the arc surfaces it.

**Five-act vignette structure (La Riva).** Five objects (net/crate/account book/key/market), two perspectives per act, the gap between perspectives carries the emotion. Design principle: "Never declare the emotion. Name the object. Name what the person does with it."

**Quest chain:** quest_la_riva_01 (visit FR), quest_la_riva_02 (5 Corrupted Cat kills → Vincenzo's Net), quest_la_riva_03 (deliver Old Tuna Account Book to Kenickie). Kenickie's final line: *"Yeah. Okay. I'll hold onto this."*

**Romance layer.** `ROMANCE_QUOTES` (21 Chrétien de Troyes quotes), `NPC_ROMANCE_PREAMBLES` (6 prior-act preambles), `NPC_ROMANCE_VIGNETTES` (6 once-per-run post-sleep vignettes), `INN_DREAMS` (flag-gated conditional dream text).

**Hour counter wiring.** 5 action types wired to `hoursElapsed`/`hoursSinceSlept`.

**Distributed grief.** Froberger's journal entries 12, 17, 29, 41 as the grief of epistemic failure. Brynn's cup, Yael's corner, Bruhns's manifold — the prior-act preambles as Chrétien-derived attachments.

### Current HTML relevance

**The Fishmonger's Row node uses code `AMS`, not `FR`.** Node at line 8,028: `AMS: { num:79, code:'AMS', name:'ruins', label:"Fishmonger's Row" }`. The lab report refers to it as `FR`. The code changed at some point; the content matches perfectly.

**`connie_tuna` and `aldo_sardino` are live in `NPC_DIALOGUES`** at lines 9,158–9,159. The vignette five-act structure lives in their dialogue pools: Connie's `dearFriend` line *"The key still opens the lock. I tried it. The lock is in the rubble but it opens"* is the Act IV vignette compressed into one sentence.

**All three quests are live** at lines 11,899/11,910/11,923. The `frCatKillCount` counter at line 23,186 increments on Corrupted Cat kills at AMS. At ≥5 with quest active, Vincenzo's Net drops to inventory.

**All state flags live** at line 21,213: `connieMet`, `fishmongerRowRestored`, `laRivaComplete`, `frCatKillCount`.

**Romance layer fully live:**

| System | Line | Status |
|--------|------|--------|
| `ROMANCE_QUOTES` | 20,507 | Live — 21 Chrétien quotes |
| `BIRKA_NPC_PROFILES` | 20,810 | Live — includes preamble data |
| `NPC_ROMANCE_PREAMBLES` | 25,149 | Live — 6 prior-act lines |
| `NPC_ROMANCE_VIGNETTES` | 25,159 | Live — 6 post-sleep vignettes |
| `INN_DREAMS` | 24,826 | Live — flag-gated dream text |

The preamble delivery is confirmed at line 21,757: `_preamble` renders the `NPC_ROMANCE_PREAMBLES[key]` line at fav ≥ 2 before the NPC card.

**`gameDay` is live** at line 21,185. Hour counter fields exist; hour-wiring to specific actions should be verified against live code but the fields are present.

**Deferred items from the report remain deferred:**
- `fishmongerRowRestored: true` sets the flag but FR (AMS) terrain text does not change to `partial_market`
- Kenickie fav 3 naming line for Covenant Keeper ending not added
- NG+ `entry42Written` not implemented

### What still applies

- **The Fishmonger's Row node is AMS, not FR.** Any reference to "FR node" in future work means `AMS`.
- **The vignette principle is canonical.** "Name the object. Name what the person does with it. The gap is the emotion." Applied to NPC preambles, quest dispositions, dream text. Don't declare the feeling.
- **NPC_ROMANCE_PREAMBLES render at fav ≥ 2 before the NPC card.** These are single italic lines: *"The cup is already on the table."* They are the prior-act technique from Chrétien. Don't lengthen them.
- **`connie_tuna` and `aldo_sardino` are `NPC_DIALOGUES` entries, not `BIRKA_NPC_PROFILES` entries.** They live in the wider dialogue pool, not the Birka six. This is correct — they are La Riva arc NPCs, not city NPCs.

---

## Report 7 — `lab-report-friendships-with-magic.md`
**Original scope:** Session postmortem — Layers 0–42 verification, 5 new systems, project philosophy (2026-05-22)
**Still active:** All 5 systems live; philosophy timeless; line count at session close was 12,637 — now 33,721

### What the report said

**Five systems implemented:** waypoint exit highlighting (`exit-waypoint` class, BFS-first-step hint), Hunt Mode toggle (persistent mode vs. per-trip decision), EB CHA check DC 17 with gut-punch fail panel (non-lethal, NPC still pays ceiling), guaranteed monster weapon drops with auto-equip, roll line shown on pass.

**Project philosophy:** Curse of Knowledge (Froberger sealed the Void alone; didn't make friends; the loop continues). Groundhog Day logic. MIT License as the act of leaving the room clean. Walking game with reading. **Friendships with Magic** as the thesis — *"Magic that is the byproduct of choosing people over efficiency."*

**Architectural patterns:** `S_story` as source of truth, render functions as idempotent re-renders, every BFS use is the same BFS, every mode is a boolean in `S_story` and `_S_DEFAULTS`.

### Current HTML relevance

**All 5 systems are fully live** — confirmed across prior synthesis reports (Parts 1–3) and the current HTML.

**The project has grown 2.67× since this report** (12,637 → 33,721 lines). All architectural patterns described remain stable. `S_story` is still the source of truth. `storyRender()` still destroys and rebuilds its DOM targets. `_bfsGridPath()` (renamed from `_bfsPath()` in the §CELL redesign) is still the single pathfinding primitive.

**The philosophical material is timeless and does not have a "current HTML relevance" entry** because it is not implementation — it is the reason for the implementation. Read it when you need to understand why this project exists. Don't check it for API details.

### What still applies

- **The four architectural patterns are still invariants.** `S_story` is truth. Renders are idempotent. BFS is one function. Modes are state booleans. Do not deviate.
- **The thesis: Friendships with Magic.** This is not in the game. It is the design contract the game fulfills. *"The Void is sealed. The people are here. That is the difference between Froberger's loop and yours."*
- **The design contract from the appendix:** runs without setup, doesn't phone home, readable, changeable, complete enough to play and incomplete enough to extend, made with care, made for joy. Every addition should honor this.

---

## Report 8 — `lab-report-kindness-calculus.md`
**Original scope:** IEEE spoof — formal analysis of 6 arc templates, prosocial mechanics, token automata, bioluminescent spanning tree (2026-05-28)
**Still active:** All 6 templates live; formal insights accurate

### What the report said

**Six arc templates** (§SPARK, §HUNT, §PORT, §WHODUNIT, §ALCHEMY, §WISDOM) with formal treatment: prosocial DC mean 11.9 (vs combat DCs 11–20); token ring protocol for arc state management; bioluminescent colonial organism as unplanned spanning-tree connector across §SPARK-01/§SPARK-02/§ALCHEMY-01; Cook who never apologized as `P(Saltwick people = untrustworthy)` failing to converge despite counter-evidence; Roen as ideal Bayesian agent with wide evidence range.

**Key theorems** (as documented): Prosocial EV dominates combat 6:1 in §SPARK family; token chains are formally equivalent to token ring protocols; bioluminescent organism is the minimal spanning tree across three otherwise independent arcs; wrong-theory NPCs implement sympathetically correct Bayesian priors.

**Quest state machine formalism.** Q = (S, Σ, δ, s₀, F). `activateCond` implements transition from inactive → active. `completeFn` implements transition active → complete. State space grows linearly; dependency expressiveness grows super-linearly. Later arcs read earlier flags at zero cost.

### Current HTML relevance

**All six templates are live** across the currently implemented arcs. The Kolmogorov complexity argument from the report is confirmed: §WORLDBUILDER-01 (worldbuilder.html) and §EDITOR-01 are implemented, validating the prediction that the game would reach the template-parameterization threshold.

**The prosocial DC cluster at 11.9 average is accurate** for the arcs the report analyzed. Newer arcs (Saul/Paul, Norse, Arthurian, Math World) extend the system but follow the same pattern: investigation and observation checks cluster in the DC 11–14 range; combat DCs are set by monster AC which ranges much higher.

**The Cook who never apologized** (`cookApologized` never set to true) is a permanent design decision. The paper names this "Cook Non-Convergence." It is a theorem about people, not about the game. The flag does not exist because the flag should not exist.

**The bioluminescent spanning tree is confirmed.** The Warmth Eel / drift spore / grandmother's stone are the same colonial organism in three arcs. No design intent produced this — it was discovered when the writers needed a mechanism and reached for established biology. The spanning tree was already in the graph.

**Roen as Bayesian agent:** His four-thousand-mile journey to confirm grandmother's literal directions (*"I would do it again. I understand it now."*) is live across the §ALCHEMY-01 arc. The characterization holds.

### What still applies

- **The quest state machine formalism is the correct mental model.** `activateCond` = transition guard; `completeFn` = acceptance condition; flags as the state alphabet. New quests should be designed as tuples Q = (S, Σ, δ, s₀, F) — whether or not anyone writes it that way.
- **The Cook never apologizes.** This is correct. Do not add a resolution to this beat.
- **The prosocial DC cluster is design intent.** Keep new prosocial checks (observation, befriending, understanding) in the DC 10–14 range. Keep combat DCs implicit in monster AC. The quantitative preference — *it is statistically easier to understand the situation than to fight through it* — should be preserved in future arc design.
- **The token ring pattern is the correct model for single-progress arc items.** One token in circulation at a time. Create before destroy. The §SPARK-02 chain (fish scale → harbor bead → drift spore → letter of clearance) is the canonical example.

---

## NPC & Narrative Summary — What Is Structurally True Right Now

**`NPC_DIALOGUES` and `BIRKA_NPC_PROFILES` are two parallel structures, both required.** `NPC_DIALOGUES` carries cycling quote pools (impartial/questActive/friendly/dearFriend). `BIRKA_NPC_PROFILES` carries portrait data and static greeting/profile text. `_renderNpcCard()` reads both.

**Six Birka NPCs with full arc closure.** Yael, Brynn, Quill/Couperin, Pachelbel, Weckmann/Crov, Auros/Bruhns — each has a world truth, 4 dialogue states, a scene const (Brynn's Vigil/Bruhns CO/Yael Report), and a mission bit. `_missionComplete()` evaluates 12 bits returning `>= 8`.

**La Riva arc is live at node AMS (not FR).** Three quests, `connie_tuna` and `aldo_sardino` in `NPC_DIALOGUES`, `frCatKillCount` counter, Vincenzo's Net key item. Kenickie fav → 3 on delivery. The Row does not rebuild.

**The romance layer is fully live.** `ROMANCE_QUOTES` (21 quotes), `NPC_ROMANCE_PREAMBLES` (6 prior-act lines at fav ≥ 2), `NPC_ROMANCE_VIGNETTES` (6 post-sleep vignettes), `INN_DREAMS` (flag-gated per-node). The prior-act technique (Brynn's cup, Yael's corner) is Chrétien-derived and load-bearing.

**Corelli's 5-appearance arc is live.** `fav_corelli` derived from purchase count. `last_cipher` free at appearance 5. `encoded_letter` footnote retroactively decoded. `kings_seal` grants +1 to death saves.

**The NPC speak endpoint is live in WBAPI.** `GET /api/npc/{id}/speak` handles player-prompt NPC responses via Claude Haiku. Falls back to seed text without API key. Logs to `npc-speak.log`.

**The vignette principle governs NPC writing.** Never declare the emotion. Name the object. Name what the person does with it. The gap is the emotion. This applies at every scale: arc level (La Riva five acts), NPC level (Brynn's cup / Yael's corner), quest disposition level (one revealing statement, not a plot summary).

**The Groundhog Day mechanic is live.** `_missionComplete()` + `_curseScore()` produce four ending variants. The loop ends when you choose people over efficiency. The Cook never apologizes.

---

*Synthesis Part 5 of 7 · Next: Part 6 — Quest Arcs · 2026-06-16*
