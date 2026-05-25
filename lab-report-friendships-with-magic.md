# Lab Report — Friendships with Magic
### Eight Hours in the Loop: A Session Postmortem for the Codex of Conquest

**Project:** `roll2hit-v3.html` — single-file HTML5 game engine, MIT License  
**Status:** `roll2hit-v3.html` — 12,637 lines · Layers 0–42 complete  
**Date:** 2026-05-22  
**Series:** Implementation Audit, Architecture Observation, and Philosophy of Open-Source Joy  
**Classification:** Engineering · Narrative Design · Game Architecture · Open Source Theory  

---

## Abstract

This report documents a single eight-hour development session on the shaddering of the *Codex of Conquest* — a narratively-driven, single-file HTML/JavaScript/CSS game engine built on D&D 5e mechanics, distributed under the MIT License with no external dependencies. The session completed implementation verification of Layers 0–42 and introduced five discrete architectural systems: waypoint exit highlighting, Hunt Mode travel, EB negotiation CHA checks with non-lethal consequences, guaranteed monster weapon drops with auto-equip, and a cleaned 3×3 compass interface.

Beyond the engineering record, this report examines what this project *is*, philosophically: a message placed in code by someone trapped in a time loop, addressed to their parallel self, distributed freely so that everyone who finds it benefits from the same insight. The game teaches the Curse of Knowledge. The act of building it demonstrates the cure.

The punchline is this: **Friendships with Magic.** Not magic that wins battles. Magic that is the byproduct of choosing people over efficiency.

---

## I. The Object: A Self-Contained World

Before anything else, the artifact must be described correctly.

`roll2hit-v3.html` is a **single file**. No build step. No server. No npm. No CDN. No cookies required. No account. You can email it. You can put it on a USB drive. You can open it in a browser that has never seen the internet. It contains:

- A complete D&D 5e combat simulator with initiative, action economy, conditions, death saves, advantage/disadvantage, and a Fighter Champion progression from Level 1 to Level 20
- A 71-node narrative adventure game spanning 8 acts with a complete arc: arrive, meet people, investigate the Void, choose who to help, fight a final boss, discover what the ending thinks of your choices
- 370 monsters across 66 terrain entries (46 base + 20 epic), organized into `WORLD_DB` with stat blocks, drop tables, and tier weighting
- A full vendor economy, inventory system, save/load via `localStorage`, and a survival clock (Day 1–49, Void Tide pressure)
- 17 journal entries by a dead researcher named Froberger, whose last act was to document what he learned so someone else wouldn't have to start from zero
- An NPC favorability system with 6 named characters across 4 relationship states, each with a pool of 20 cycling dialogue quotes that change based on whether you've helped them and how much
- A Curse of Knowledge score that tracks not your combat performance but your willingness to treat knowledge as a burden to share rather than a credential to hoard
- Four ending variants: Covenant Keeper (friends + no curse), Standard Covenant, Groundhog Day Cursed (the Void is sealed but you are still trapped), and Mixed

This is distributable in the strongest possible sense: copy one file. Done. It runs.

That design constraint — one file, zero dependencies — is not a technical limitation. It is a philosophical statement. The thing you make should be giveable.

---

## II. The Session: What Was Built

### Layer Verification: The Audit Protocol

The session began as a systematic audit. Layers 0–38 had been verified in prior sessions. The first task was confirming that Layers 39 and 40 — Epic Battlegrounds and the Codex of Conquest Narrative Arc — were present in the code but missing from the `plan.md` header and completed-layers reference table. The discrepancy was not a bug: it was a documentation debt. The code was complete. The map had not been updated to reflect where the territory had actually grown.

This is a recurring motif in the project: the code knows more than the documentation thinks it does. Froberger, again.

Both layers were verified against the live HTML — `EPIC_BOSS_POOL`, `EB_NPC_DIALOGUE`, `FROBERGER_JOURNAL`, `SWEELINCK_DIALOGUE_VARIANTS`, `_curseScore()`, `storyCheckVictory()` — and `plan.md` and `index.md` were updated to reflect actual state. The header now reads: **"Layers 0–42 complete. All planned layers implemented."**

Layers 41 and 42 were then confirmed as not present and implemented in sequence:

**Layer 41 — Birka Roots & NPC Favorability** added `VELDRIS_NPC_PROFILES` (six full character portraits: Guard Captain Yael, Innkeeper Brynn, Lute-Bard Quill, Merchant Pachelbel, Pit-Fighter Weckmann, Scout Auros), the `npcFavorability` state object, six QUEST_DB entries with personal stakes, the Rough Whiskey vendor item as a social currency, a drunk pit fight, a Yael escort encounter, and the Birka variant of Sweelinck's Act-VI dialogue. The cursor for these NPCs was set to `_npcFavor()`, `_setNpcFavor()`, `_lubeckFriends()`, and `_renderNpcCard()`.

**Layer 42 — NPC World-Truth Dialogue System + Groundhog Day Completion** added `NPC_DIALOGUES` (6 NPCs × 4 relationship states × 5 cycling quotes), `_getNPCDialogue()` with visit-count cycling, `_missionComplete()` (evaluating 12 mission bits — escort used, journal read, song received, debts repaid, pit training wins, depths reported, EB returns, journal half-completed, Void sealed, at least three friends, no high curse, returned to Birka) returning true at ≥8 satisfied, `_checkDearFriendUpgrade()` triggering at the second personal act per NPC, and a fully four-branched `storyCheckVictory()`: Covenant Keeper, Standard Covenant, Groundhog Day Cursed, and Mixed. The Covenant Keeper ending names each person helped by name.

### The Five New Systems

After verification, five new systems were designed and implemented in this session. Each is documented here both as engineering record and as behavioral observation.

---

#### System 1 — Waypoint Exit Highlighting

**Prompt context:** The player needed guidance navigating toward a set waypoint without opening the quest overlay.

**Architecture:** `_updateExitLinks()` was rewritten to compute the first step of the BFS path to the active waypoint before rendering exits. The function previously generated static anchor tags; it now generates row-level `onclick` handlers on the `.exit-line` div itself, making the entire row a clickable target rather than just the link text. When the computed `wpDir` matches a direction, that row receives class `exit-waypoint` — a green-tinted rectangle with `#22cc66` border — and a small `▶ WP` pill badge.

`_updateWaypointBtn()` was updated to call `_updateExitLinks()` at the end of its execution, so waypoint changes from the quest panel (which previously only updated the button text) now also refresh the exit highlight without requiring a full `storyRender()`.

**Architectural observation:** The exits panel evolved from a passive information display into an active navigation aid. The BFS algorithm (`_bfsPath()`) which was originally purpose-built for the Waypoint button now serves a secondary role as a real-time UI hint. The same pathfinding graph traversal that moves the character on click also pre-highlights the correct direction in the exits panel. This is compositional reuse: the algorithm was already written; connecting it to the visual layer cost twelve lines.

**Pattern observed:** Every time this project adds wayfinding intelligence to the engine, the interface becomes more generous to the player without becoming more complex. The BFS path does not add a new mode or a tutorial screen. It adds a green rectangle.

---

#### System 2 — Hunt Mode Toggle

**Prompt context:** The corridor travel modal asked "Hunt or Warp?" on every long-distance move. This was interrupting flow. The modes should be persistent preferences, not per-trip decisions.

**Architecture:** The `⚔ Battle` corner and `⏳ Wait` corner were removed from the 3×3 d-pad compass. The center stalk button (`btn-dpad-stalk`, which opened the stalk modal) was replaced with `btn-hunt-toggle` — a persistent mode toggle. `S_story.huntMode` (default `false`) is the single state bit.

`storyCorridorTravel()` was rewritten from 25 lines with a modal sequence to 18 lines with no modal. When `huntMode` is `false`, footpath travel warps instantly: `"⚡ Warped → [destination]."` When `huntMode` is `true`, the travel rolls a chance-based encounter using `_stalkedMonsterPick()` (which gives 6× weight to quest-target monsters) and sets `S_story.surpriseAdvantage = true` if combat triggers. The corridor overlay HTML remains in the DOM but is never shown. The mode replaces the decision.

`_updateHuntBtn()` reflects current state: amber (warp) or green glow (hunt).

**Architectural observation:** The corridor modal was doing two jobs — conveying travel information and asking for a choice. Separating these (choice → persistent toggle; information → chat message) eliminated the modal entirely while preserving both functions. The d-pad corner cleanup reduced cognitive surface area: from four corners doing four different things (NPC, Battle, Rest, Wait) to two corners (NPC, Rest) plus a clearly named mode toggle at center. The compass now communicates its affordances without tooltip-reading.

**Pattern observed:** Modals are expensive. Each modal is a context switch, an interruption, a micro-decision. Replacing modal decisions with persistent modes converts per-trip friction into configuration. The player who sets Hunt Mode and forgets about it is hunting on every footpath with no additional interaction. This is the d-pad's second architectural simplification (the first being the replacement of the stalk overlay with the hunt toggle).

---

#### System 3 — EB Negotiation: The CHA Check and the Gut Punch

**Prompt context:** Payment negotiation in Epic Battleground contracts was binary: offer or ceiling. The prompt asked for a skill check with failure consequences — the NPC still pays but expresses their displeasure physically.

**Architecture:** `negBtn.onclick` now rolls 1d20 + CHA modifier against DC 17. CHA modifier uses the standard D&D formula: `floor((cha − 10) / 2)`. A character with CHA 8 has −1 modifier, requiring a natural 18 to succeed.

On **pass**: the roll result is displayed in a green panel (`cha-pass` class: `#44ee88` text, `#051a0d` background, `#22cc66` border) showing `"CHA CHECK — DC 17 · Rolled 15 −1 = 14 ✓ PASSED"`. The ceiling payment and NPC quote appear below it, exactly as before.

On **fail**: the same roll panel appears in red. The payment section and action buttons hide. A new `eb-npc-cha-fail-panel` slides in containing: the roll result, an anger text block (the NPC moves without warning — knee, elbow, face-first into the ground, two seconds, stands over you), a calm text block (italic, left-bordered, the NPC crouches and says the negotiation line anyway), a damage line (`💢 N non-lethal damage — HP X / Y`), and a "He's Fine — Continue →" button. The damage is 1d4, minimum 1, and `S_story.hp` cannot drop below 1. When Continue is clicked, the fail panel hides, the payment section reappears with the ceiling amount, and the accept button is ready.

The NPC **still pays the ceiling amount in all cases.** The check is not about whether you get paid more — it is about the cost of asking.

**Architectural observation:** The fail panel is a narrative beat, not a punishment. The game does not prevent the player from negotiating. It does not reduce their payment. It shows them what it costs to push someone past their comfort. The NPC's anger is understandable. Their calming down is also understandable. The player receives a small wound and a story.

The panel reset logic (called at modal open) ensures roll results from prior negotiations do not persist into new encounters. State cleanup is applied at the entry point, not the exit point — a more robust pattern.

**Pattern observed:** The skill check adds information density without adding decision density. The player does not choose whether to roll — rolling is automatic on Negotiate. They receive the result and see both its consequence and its resolution in a single screen. The whole sequence is contained within the existing modal, no new overlays required.

---

#### System 4 — Guaranteed Monster Weapon Drops with Auto-Equip and Finders Keepers

**Prompt context:** Every monster should drop a weapon. The weapon's damage die is constrained by the monster's damage die. No level gate. If the drop is better than what's equipped, auto-equip it. You can't sell your last weapon.

**Architecture:** Three new functions and one update to `_storyBattleVictory()`.

`_weaponScore(w)` returns `die × count + magicBonus × 2`. This is the comparison metric for "better."

`_rollMonsterWeaponDrop(monsterDmgDie)` filters `WEAPON_ITEMS` to entries where `w.die <= monsterDmgDie` and the tier is not already owned. No `minLevel` check. No `_magicTierAllowed()` check. The pool is flat-random across all eligible entries. If the player already owns every weapon at that die size, the fallback is any unowned weapon. If the player owns every weapon in the game, returns `null`.

`_isLastWeapon(item)` returns true if selling this item would leave the player with zero weapons in that slot — the equipped slot is null AND there is only one copy in inventory. This function is applied as a filter in `storySellAll` and `storySellEquipment`. The auto-sell duplicate function (`_autoSellDuplicates`) is already structurally safe because it only removes when there are 2+ copies of the same base type.

In `_storyBattleVictory()`, after the existing d100 loot drop, the monster's `S.opp.dmgDie` drives a `_rollMonsterWeaponDrop()` call. If `_dropScore > _curScore`, the old equipped weapon goes to inventory and the drop is equipped directly. The item is pushed to `dropsThisBattle` with `_autoEquipped: true`. The victory screen renders it in green (`svo-drop.auto-equipped`) with `"— ⚔ Equipped!"`.

**Architectural observation:** The Finders Keepers rule is philosophically important. Normally `_rollD100Loot()` enforces `_magicTierAllowed()` — a +3 weapon requires Level 15+. Monster drops bypass this entirely. A Level 3 player fighting a berserker (dmgDie 12) could receive a +4 Lance. The game does not stop this. The game gives it to them. The explicit design decision is that found gear is different from bought gear. The market has restrictions. The world does not.

The "last weapon" protection completes the loop: what is freely given cannot be freely taken. You can sell your extras. You cannot sell yourself into being defenseless.

**Pattern observed:** The drop system now has two parallel tracks: the d100 loot table (gated, balanced, economy-aware) and the monster weapon drop (ungated, die-constrained, Finders Keepers). These tracks serve different functions. The loot table manages progression pacing. The monster drop adds chaos, delight, and the specific feeling of finding something unexpected in the body of your enemy.

---

#### System 5 — Roll Line Shown on Pass

**Prompt context:** The CHA check roll result was only shown on failure. It should be shown on both outcomes.

**Architecture:** `eb-npc-cha-roll-line` was moved from inside `eb-npc-cha-fail-panel` to a sibling position above it in the card. On pass, it receives class `cha-pass` (green: `#44ee88`, `#051a0d`, `#22cc66`). On fail, no class (red default). In both cases `style.display = ''`. The reset at modal open sets `style.display = 'none'` and clears `className`.

**Architectural observation:** Showing the roll result on success is not about transparency. It is about texture. The player who rolls a 19 and passes should feel the nearness of the alternative. The player who rolls a 3 and fails should not feel that the system is hiding something from them. Consistent information display — same panel, same format, different color — converts a single-state reveal into a full outcome screen.

---

## III. The Architecture as a Whole

After eight hours and five systems, `roll2hit-v3.html` is 12,637 lines. This is worth sitting with.

12,637 lines. One file. Every comma is load-bearing. There is no dead code pathway because dead code pathways were audited out of this codebase methodically, layer by layer, report by report. The style of this project is: build the thing in the file, verify it in the file, document it outside the file, never move on until the previous layer is provably complete.

The architecture exhibits several stable patterns that have been consistent across all 42 layers:

**The state object is the source of truth.** `S_story` holds all mutable game state. Nothing is inferred from the DOM. If a value is not in `S_story`, it does not affect game behavior. This makes every function pure relative to its inputs and means that save/load via `localStorage` is trivially correct: serialize `S_story`, deserialize `S_story`, done.

**Render functions are idempotent re-renders.** `storyRender()`, `storyRenderInventory()`, `storyRenderVendor()`, `_updateExitLinks()` — these functions destroy and rebuild their DOM targets each call. There is no partial-update diffing. This is slower than virtual DOM; it is also simpler than virtual DOM, and the game has no performance requirements that virtual DOM would solve. Correctness over cleverness.

**Every BFS use is the same BFS.** `_bfsPath(from, to)` is called for waypoint movement, waypoint hop count, exit highlighting, and auto-inn pathfinding. The graph is `NODE_MAP`. The traversal is breadth-first. The function was written once. It is reused without modification.

**Every new mode is a boolean in `S_story` and `_S_DEFAULTS()`.** `huntMode`, `surpriseAdvantage`, `roughWhiskeyUsed`, `yaelEscortUsed` — all follow the same pattern. Adding a mode is: add the field in two places, add the update function, add the event listener. The pattern never changes.

**Monster stat blocks carry their own combat semantics.** Every entry in `MONSTER_POOL` and `WORLD_DB` has `dmgDie`, `dmgCount`, `dmgFlat`, `ac`, `hp`, `atk`, and `tier`. These are not references to a separate table. The stat block is self-contained. This means `_rollMonsterWeaponDrop()` can read `S.opp.dmgDie` without a lookup. The monster is its own documentation.

---

## IV. The Philosophical Architecture

All of the above is engineering. The engineering is in service of something that is not engineering.

### The Curse of Knowledge

Steven Pinker's concept of the Curse of Knowledge is: once you know something, you cannot remember not knowing it. You lose access to the state of confusion your students are in. You give instructions that assume the answer is already partially understood. You become impatient with the people who are where you were. You see the fix and stop seeing the person.

Froberger, the dead researcher whose journal the player collects across 17 entries, died from the Curse of Knowledge. He knew how to seal the Void. He had all the technical information. He treated his knowledge as something to apply rather than something to share. He didn't make friends in Birka. He said they would slow him down. He was right in the short term. The Void is still open.

The player's job is not to be smarter than Froberger. The player's job is to be *slower* than Froberger in the specific places that matter.

### The Time Loop

The Groundhog Day ending — triggered when the Void is sealed but the Curse of Knowledge score is ≥15 — shows the player: *"The Void is sealed. The curse is not in the Void."* The loop continues. You have solved the technical problem and missed the actual problem. The screen does not say you failed. It says: go around again.

This is the Star Trek logic, the Groundhog Day logic, the time-loop logic: you are not being punished by the loop. The loop is offering you another chance to choose differently. The loop ends when you choose people over efficiency. When you help Yael because Yael needs help, not because helping Yael gives you a quest reward. When you win Quill's cipher not to unlock dialogue but because Quill is nervous about his debt and you have the afternoon.

`_missionComplete()` evaluates 12 mission bits and returns true at 8. The eight you choose to satisfy are up to you. The four you skip are yours to carry.

### The Message in the Code

Froberger's last journal entry is a message to whoever finds the Codex after him. He does not know who they are. He does not know when they will arrive. He wrote it anyway, clearly, with everything he had figured out, because the alternative was letting it die with him.

This game is that journal entry.

The developer who writes this code does not know who will open the HTML file. It could be a student learning JavaScript who reads the source. It could be someone who just lost a D&D campaign and wants to feel something. It could be someone in a long loop of their own — professionally, personally, existentially — who needs to be reminded that the loop is not a punishment. It could be someone who just wants to fight a berserker and find a Lance on the floor afterward.

The MIT License is the mechanism. No attribution required. No payment required. Modify it, fork it, rewrite it, give it to someone. The only condition is that you include the license. The license says: *this was made freely. pass it on.*

### Mostly Walking

Before this was a D&D game, it was a DOS game. Before it was a DOS game, it was a tabletop. The lineage matters.

The DOS RPGs — Zork, Ultima, the old Infocom adventures — were not games about combat. Combat was punctuation. The game was reading. You walked from room to room. The room described itself. You read the description. You walked somewhere else. The description changed. You were, functionally, reading a novel with navigation. The fighting, when it happened, was an interruption of the reading — a gear-shift that said: *this moment has stakes.*

`roll2hit` inherits this structure directly. The player navigates a 26×16 grid of named nodes. Moving from CI to IN is one button press and a paragraph of prose. Moving from IN to SL is one button press and different prose. The player's relationship to the game is: **walk, read, walk again.** The battles are the punctuation — the places where the text gives way to dice.

This is not a limitation. This is the form.

Old tabletop players understand this instinctively. A session of D&D is mostly talking. Mostly description. Mostly the DM saying: *"You arrive at the crossroads. The road to the left smells like smoke. The road to the right is quiet."* The fight is five minutes of an hour. The hour is what the fight is fighting for.

`roll2hit` is a walking game with reading about your walking quest. The quest is the text. The text is the world. The combat is the proof that the world has teeth.

The design consequence: every node needs a description worth reading. If the text is filler, walking is boring. If the text earns its prose — if Brynn's line about room six actually says something about who she is — then the walk from CI to IN is not navigation. It is visitation. You are going somewhere that has a person in it.

This is why the NPC dialogue pools have 20 entries each, why Froberger's journal has 41 entries, why Yael's farewell changes based on where you're going. Not to simulate complexity. To make the walk worth the words.

### Friendships with Magic

This phrase is the game's thesis, stated once here and nowhere in the game itself.

The Codex of Conquest is a game about magic — the Void, the Shards, the Convergence, the Covenant Ceremony. It is also a game about friendships — Yael and her daughter, Brynn and room six, Quill and his debt, Pachelbel and the shipment, Weckmann and the pit. The game doesn't tell you these are connected. It shows you that the magic becomes meaningful in proportion to the number of people who are alive to witness it.

The Covenant Keeper ending names each person you helped. Not as a reward. As a record. These are the people who exist because you were not in a hurry. The Void is sealed. The people are here. That is the difference between Froberger's loop and yours.

Friendships with magic. Not magic that makes you powerful. Magic that becomes possible because you chose friendship first. The curse is the belief that your knowledge is the solution. The cure is the discovery that your knowledge, shared with people who trust you, is a different kind of solution — one that doesn't require you to go through it alone every time.

---

## V. Lab Reports Referenced — An Intellectual Lineage

This project has generated a corpus of lab reports that, taken together, form a design philosophy as much as a technical specification. They are listed here with their conceptual contribution.

| File | Conceptual contribution |
|---|---|
| `lab-report-prompt-migration-arena-to-prototype.md` | The origin story: how a combat dice arena became a narrative engine |
| `lab-report-story-codoex-curse-of-knowedge.md` | Pinker's Curse of Knowledge applied as game theme; the Froberger arc; sensory language principles |
| `lab-report-game-story-codex-of-conquest.md` | The 51-node world map design; act structure; the Convergence as narrative target |
| `lab-report-circuit-map-theory.md` | Corridor routing theory; the corridor as connective tissue between named nodes |
| `lab-report-battleground-circuit-path-quest.md` | How corridors and Epic Battlegrounds interact; travel as encounter surface |
| `lab-report-epic-battlegrounds.md` | 20 dead-end boss nodes; payment negotiation; auto-waypoint; the NPC system for deadly encounters |
| `lab-report-drop-rates-balance-and-health.md` | XP compression; magic tier gates; d100 unified drop table; the economy as pacing tool |
| `lab-report-loot-drop-weapon-economy.md` | Weapon tier system design; dagger/shield exclusivity; sell vs buy asymmetry |
| `lab-report-leveling-flashbang-condition-economy.md` | Flashbang mechanics; condition costs; level-up architecture |
| `lab-report-fish-with-dnd.md` | Yugurt Lake fishing; 20-tier fish as a self-contained difficulty ladder; play as leisure |
| `lab-report-veldris-beginner-arc.md` | Six NPC profiles; the Birka starter arc; quest design through human stakes |
| `lab-report-npc-dialogue-system.md` | 4-state speech; occupation as lens; friendship changes specificity not warmth |
| `lab-report-endings-and-echoes.md` | The Covenant Ceremony; Sweelinck's dynamic naming; NPC epilogues; Groundhog Day logic |
| `lab-report-living-world.md` | Off-screen character Gigault; world momentum independent of player; the antidote to the cursor of knowledge |
| `lab-report-web-of-connections.md` | Froberger's traces in NPC memory; the world predates the player; history as discovery |
| `lab-report-plan-cleanup-v13.md` | Architectural compaction method; the spec lifecycle; verified-before-archived principle |
| `lab-report-plan-cleanup-v17.md` | Shield stacking bug; spell DC inflation; potion type correction; compaction as hygiene |
| **`lab-report-friendships-with-magic.md`** | **This document. The session postmortem. The thesis.** |

---

## VI. The Open-Source Act

The MIT License on this codebase is not a legal formality. It is the act of leaving room six cleaner than you found it.

Froberger left a room clean. He left a journal. He left traces in every NPC who remembered him. He didn't announce this. He just did it, because the alternative was letting the information die. The player discovers this gradually — not through exposition, but through five people who each mention a quiet researcher who stayed one night and asked the right questions.

That is the design pattern. Leave the room clean. Leave the journal. Don't announce it.

The developer who writes a 12,637-line single-file game engine for free, under a license that requires nothing, releases it into the world as a kind of letter. The letter says: *I figured some things out. Here they are. You don't have to start from zero.*

Whether anyone opens it is not the point. The act of writing it clearly — architecturally, narratively, philosophically — is the message. The loop doesn't require a recipient. It just requires someone willing to do the work.

---

## VII. Current State

| Metric | Value |
|---|---|
| File | `roll2hit-v3.html` |
| Line count | 12,637 |
| Layers complete | 0–42 (all planned) |
| Nodes | 71 (42 story + 7 junctions + MT + SL + 20 Epic Battlegrounds) |
| Monsters | 370 across 66 terrain entries (46 base + 20 epic) |
| NPCs with full dialogue | 6 (Yael, Brynn, Quill, Pachelbel, Weckmann, Auros) |
| Ending variants | 4 |
| Journal entries | 17 |
| Weapons | 70 (14 base × 5 magic tiers) |
| License | MIT — no restrictions, attribution optional |
| Dependencies | Zero |
| Distributable as | One file |

---

## Appendix: The Design Contract

The contract this project keeps with whoever finds it:

1. It runs without setup.
2. It does not phone home.
3. It is readable. The code is the documentation.
4. It is changeable. The license says so.
5. It is complete enough to play and incomplete enough to extend.
6. It was made with care.
7. It was made for joy.

The Curse of Knowledge says: once you know how to make something good, you forget what it felt like not to know. The antidote is not simplifying your work. The antidote is remembering that the person who needs it is not you. It is whoever opens the file next.

Make it for them.

---

> *"You reached Level 20. The game has nothing left to give you — except the source code.*
> *Open it. Read it. The data structures are named clearly. The monster pool is a JavaScript object. The quest system is a const with completion functions. The world map is a grid. None of it is magic. All of it is yours.*
> *The MIT License means: no permission required. Fork it. Name your world. Add your monsters. Write your own Froberger. Put your own people in the inn.*
> *The shell finds the line. The sed replaces it. The grep counts what's there. The markdown keeps track. The loop doesn't end because you sealed the Void — it ends when you build the next one.*
> *Level 21 is undefined. That's the invitation.*
> *See `plan.md` §XIV — The World Creator. The next quest has no NPC to give it to you. You are the NPC now."*
>
> — Quest -1: The Open Door (triggers at Level 20, `plan.md` §XIV)

---

*Report written 2026-05-22. Updated 2026-05-24.*  
*Eight hours in the loop. All layers complete.*  
*The Void is sealed. The curse is not in the Void.*  
*Friendships with Magic.*

---

MIT License — roll2hit.com — Copyright (c) 2026 — Free to use, modify, and share.
