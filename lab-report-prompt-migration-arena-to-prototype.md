# From Arena to Prototype: The Architectural Evolution of *The Shattered Codex*

**A Study in Prompt-Driven Game Engine Development and the Roll2Hit Migration**

**Roll2Hit v3 — Post-Implementation Retrospective**  
**Series:** Laboratory Reports on Narrative Engine Architecture  
**Classification:** Software Architecture · Game Design · Specification Methodology · Human-AI Collaboration  
**Date:** 2026-05-21  
**Status:** Retrospective Analysis — Codebase Complete (Layers 0–13)

---

## Abstract

This report documents the complete architectural transformation of Roll2Hit from a single-screen combat dice tracker to *The Shattered Codex* — a 42-node, 8-act, 49-day solo PVE narrative adventure built inside a single HTML file. The transformation occurred across approximately thirteen distinct development layers, each initiated through a structured natural-language prompt dialogue. We analyze the thematic progression of these prompts, identify recurring design patterns, document the specification-implementation-documentation loop that kept the project coherent across a large context span, and construct a formal timeline from Arena (the original dice roller) to Prototype (the complete narrative engine). We argue that the project's primary architectural contribution is not any single feature but the discipline of maintaining **specification gravity**: a set of interlocking documents (plan, spec, mechanics, world, map, story, monsters) that exert coherent pressure on all implementation decisions, preventing both feature bloat and design drift. The result is a game engine that encodes a distinct philosophical position — the **Cooperative DM Principle** — not merely as narrative flavor but as a mathematical invariant in its reward formula.

---

## I. Introduction

### I-A. The Starting State

Roll2Hit began as a response to a practical problem: tracking a D&D combat encounter in real time, without a second screen or physical dice. The first implementation (`roll2hit.html`) was a four-quadrant arena layout displaying:

- A player character panel with HP and weapons
- An opponent panel with HP and stat block
- A dice roller producing d20 attack rolls with advantage/disadvantage
- A damage roll panel
- A combat history log

This was a **tool**, not a game. It had no state machine, no persistence, no narrative. Its only job was to replace rolling physical dice and tracking numbers on paper.

The architectural decision that made all subsequent development possible was the single-file constraint: everything in one `.html` file with no external dependencies. This decision was imposed by the deployment target (open in any browser, share as a file, no server required) and it became a discipline that shaped every subsequent architectural choice. There was no place to put complexity except inside the file — which meant complexity had to earn its position.

### I-B. The Destination State

At Layer 13, `roll2hit-v3.html` is 7,465 lines and contains:

- A full combat dice tracker (Battle Mode) with the original Arena functionality
- A narrative adventure game (Story Mode) with 50 navigable nodes
- A 42-terrain monster catalog with 329 monsters across 6 source pools
- A quest engine with 8+ quests, gate locks, and Codex Shards
- A vendor economy with 4 potion tiers, trophy drops, and Transmort Scrolls
- A rest system with inn long rests (DGQR), short rests (3/day), and Boy Scouts Award camping bonus
- A circuit corridor map with PCB-trace routing, 7 junction nodes, fog-of-war, and Hunt/Warp travel
- A stalk mechanic across 42 hunting grounds with quest-preference weighting
- A focused battle overlay with initiative, turn enforcement, pre-battle tabs, auto-turn, and potion quick-use
- A reward economy where `reward = floor(0.1 × AC × maxHP)` drives both HP healing and gold simultaneously
- A Necklace of Knowledge that converts every unique rest location into a collectible memory bead
- A save/load system, a Void Tide calendar clock, Hearth Home, and checkpoint respawn

This is a **game**. It has a philosophical design position. It has a character. It took thirteen layers to get there.

### I-C. The Method

Every layer was initiated by a natural-language prompt. No feature was added without a conversation that established:
- The problem being solved
- The design decision among alternatives
- The implementation plan (explicit or implicit)
- A confirmation gate before code was written

The development loop was: **prompt → plan → confirm → implement → document → prompt**. The documentation step was not optional — it was the mechanism that prevented context collapse as the project grew.

---

## II. Chronological Phase Analysis

### Phase 0: Pre-Roll2Hit — The Problem Statement

**Before any code:** The conceptual seed of Roll2Hit was the frustration of tracking D&D combat without dedicated tooling. Commercial virtual tabletops were too heavy. Spreadsheets required too much manual bookkeeping. Physical dice and paper were disconnected from any kind of state persistence.

The initial prompt did not say "build me a game." It said, in effect: *I need to track this fight.* This is the foundational truth of the project's architecture: every system that exists does so because tracking a fight demanded it.

**Key theme established:** Practical necessity drives feature addition. Every layer that follows can be traced back to a real friction point in game-running.

---

### Phase I: The Arena Combat Tracker (roll2hit.html)

**Deliverable:** `roll2hit.html`  
**Timeline position:** Session 1  
**Lines:** ~400

The first implementation introduced the four-quadrant arena:

```
┌─────────────┬─────────────┐
│   PLAYER    │   OPPONENT  │
│   HP Bars   │   Stat Block│
├─────────────┼─────────────┤
│   ATTACK    │   DAMAGE    │
│   d20 Roll  │   Dice Roll │
└─────────────┴─────────────┘
```

**Architectural decisions:**
- Single mutable state object `S` — everything lives here
- No frameworks, no imports
- Advantage/disadvantage resolved by rolling 2d20 and taking higher/lower
- History log as a linear card stack — immutable record

**The history log was the first narrative element.** Storing past rolls as readable cards — "d20 → 14 + 5 = 19, HIT" — transformed a number into a sentence. This pattern would later evolve into the story log, the quest journal, and the combat narrative in the Battle Focus overlay. The impulse was always the same: *make the number tell a story.*

**Key theme established:** Every UI element is an argument about what matters in a fight.

---

### Phase II: Layout Evolution and the 3-Column Arena (roll2hit-v2.html)

**Deliverable:** `roll2hit-v2.html`  
**Key changes:** 4-quadrant → 3-column layout; config panel (weapon loading, monster selection); advantage toggle moved to header

The first major refactor. The 4-quadrant layout treated attack and damage as symmetric — two equal boxes — but they are not symmetric in play. Attack is interrogative (did I hit?); damage is consequential (how much?). The 3-column layout reflected this:

```
[Config] [Attack + History] [Damage + HP Tracking]
```

Config (monster and weapon loading) moved to a dedicated column, making it a setup phase rather than an inline action. This was the first architectural separation of **state initialization** from **state mutation** — a pattern that would later manifest as the pre-battle screen (configure your approach before entering the fight).

**Spec-combat.md** was written during this phase: a 10-step implementation plan that formally documented the column layout, the advantage model, the history card format, and the config panel. This was the project's first specification document — establishing the habit that would define all future development.

**Key theme established:** Separate configuration from action. Separate setup from play.

---

### Phase III: World Engine — Monster Catalog and Terrain System (roll2hit-v3.html begins)

**Deliverable:** Beginning of `roll2hit-v3.html`; `WORLD_DB`; `MONSTER_POOL` (120 → 329 monsters); terrain-stratified monster selector  
**Documentation:** `spec-world.md`

The question that drove Phase III: *Why do I have to manually type in the monster's stat block every time?* The answer was `WORLD_DB` — a 42-terrain database where each terrain key maps to a curated monster pool. The cascading dropdown (terrain → location → monster) became the world selector that persists through Layer 13.

**The monster catalog expanded in two waves:**
- Wave 1: ~120 monsters drawn from the standard D&D bestiary
- Wave 2: Dark Fantasy Bestiary II — adding leshen, drowners, wraiths, void creatures, and Witcher-adjacent dark ecology, bringing the total to 329

**Architectural significance:** `WORLD_DB` established that terrain is the organizing principle of monster ecology. This decision made Layer 10's Hunting Grounds trivially achievable — 42 terrains already had 42 monster pools. The infrastructure preceded the feature by multiple development phases.

**Key theme established:** Build data architecture before building features. The monster catalog was built for the dice tracker; it became the spine of the entire world.

---

### Phase IV: Narrative Engine — The Shattered Codex (Layers 0–8)

**Deliverable:** Story Mode; `NODE_MAP` (42 nodes); `QUEST_DB`; 8-act campaign structure; Void Tide calendar  
**Documentation:** `spec-engine.md`, `spec-migration.md`, `world.md`, `story.md`, `maps.md`

**This is the pivotal phase.** The question that drove it: *What if the monster combat was part of a story?*

`S_story` was created alongside the existing `S` battle state — two state machines sharing one file, one screen, one mutable object family. The bridge between them is `S_story.pendingBattle`: Story Mode sets up the battle descriptor, hands off to Battle Mode, which runs the combat, then returns control to Story Mode via `storyApplyOutcome()`.

**The 42-node world design:**

42 nodes across a 26×16 grid, organized into 8 acts:
- Act I–III: Urban Birka (city, alley, docks, tavern, market)
- Act III–IV: Wilderness outskirts (forest, swamp, highlands, midlands)
- Act IV–V: Underground and sea (crypt, catacombs, ocean, islands)
- Act V–VI: Exotic terrains (desert, jungle, arctic, freshwater lake)
- Act VI–VII: Mythic domains (Camelot, Greek agora, oriental palace)
- Act VIII: Cosmic endgame (heavenly clouds, cosmic realm)

**The 49-day Void Tide clock:**

Each inn sleep advances the calendar by 1 day. Day 49 is hard failure. This created the first genuine tension loop: the player needs to rest (for HP and short rest reset) but resting costs days. The economic pressure on the calendar is what makes exploration meaningful — every off-path detour is a day-budget decision.

**Documentation discipline established:**

Eight specification documents were created in parallel with code:
- `spec-engine.md` — the architecture blueprint
- `spec-migration.md` — the formal IEEE migration report (Layers 0–4)
- `world.md` — DM manual: factions, NPCs, condition items
- `story.md` — 42-node narrative content (full prose per node)
- `maps.md` — 26×16 grid, node coordinates, gate locks
- `mechanics.md` — player-facing rules reference
- `monsters.md` — 329-entry monster reference table
- `index.md` — master index and session review plan

This documentation corpus became the project's memory — more durable than any single conversation's context window.

**Key theme established:** A game is not just code. It is a world with consistent internal rules. The world must be documented before the code implements it, or the code will be inconsistent.

---

### Phase V: Geography Layer — Circuit Corridors and Junctions (Layer 9)

**Deliverable:** `CORRIDOR_CELLS`, `buildCorridorMap()`, J1–J7 junction nodes, Hunt/Warp dialog, fog-of-war, active path highlight  
**Documentation:** `spec-corridors.md`, `lab-report-circuit-map-theory.md`

**Problem:** The world map showed 42 isolated dots connected only by D-pad navigation. There was no visual representation of the roads between them. A player teleporting from node to node felt disconnected from the geography they were supposedly traversing.

**Solution:** PCB-trace corridor routing. Every connection in `NODE_MAP` was converted to a Manhattan L-shaped path of intermediate grid cells, rendered as box-drawing characters (`─ │ ┘ └ ┐ ┌ ┼`). These corridors were:
1. **Visible** — the grid showed the road network
2. **Navigable** — clicking a corridor cell opened a Hunt/Warp dialog
3. **Fog-of-war aware** — corridors to unvisited nodes were dim; to visited nodes, bright

**The junction concept** solved the problem of long corridors with no waypoints. Seven junction nodes (J1–J7) were placed at strategic crossroads, each with a named signpost and directional connections. They added navigation granularity without adding story content.

**The routing algorithm** deserves mention as a stand-alone engineering achievement within the single-file constraint:
```
1. Look up grid coordinates for each NODE_MAP edge
2. Compute Manhattan L-shape (H-first default; V-first if H-corner hits a node)
3. Merge crossing corridors into ┼ glyphs
4. Skip cells already occupied by named nodes
5. Populate CORRIDOR_CELLS at startup (once, before any player interaction)
```

This was the project's most algorithmically complex single feature — and it was specified completely in prose + pseudo-code before a line of implementation code was written.

**Key theme established:** Spatial representation is not decoration. The circuit corridor map turned navigation from an abstract D-pad operation into a physical journey through a legible world.

---

### Phase VI: Ecology Layer — Hunting Grounds and the Stalk Mechanic (Layer 10)

**Deliverable:** `HUNTING_GROUNDS` (42 terrain entries), `MT` node, `storyStalk()`, `_stalkedMonsterPick()` with 6× quest-target boost  
**Documentation:** `lab-report-battleground-circuit-path-quest.md`

**Problem:** Story battles are one-shot (each node battle can only be won once). Corridor encounters are random and infrequent. A player who needs to kill a specific monster type for a quest has no reliable mechanism to find one.

**Solution:** The Stalk mechanic. Every node with a terrain type has a Hunting Ground — a named location ("The Dark Copse," "The Rat King's Warren," "The Void Rift") where the player can wait for prey. Stalk is guaranteed to produce a combat. The monster selected is weighted by quest relevance — active quest targets get a 6× boost to their encounter weight.

**The three XP layers:**

| Layer | Trigger | Rate | Source |
|---|---|---|---|
| Story battle | Arrive at battle node | Once (one-shot) | NODE_MAP battle field |
| Corridor encounter | Choose Hunt mode | 10–90% (quest-scaled) | `triggerCorridorEncounter()` |
| Stalk | Activate at Hunting Ground | 100% (guaranteed) | `_stalkedMonsterPick()` |

This three-layer architecture gives the player meaningful agency over encounter frequency: low risk (warp past), ambient risk (hunt corridors), or deliberate farming (stalk).

**The MT node** resolved the only terrain gap in the original 42-node world: `mountains` had 23 monsters in `WORLD_DB` but no story node. A dead-end branch from junction J6 added the Mountain Pass — accessible by one path, containing no story battle, existing purely as a hunting ground. This was the minimum-footprint solution to a data coverage gap.

**Key theme established:** Quest progression and XP farming must be aligned. The 6× quest-target boost ensures that a player following the quest narrative encounters the right monsters naturally.

---

### Phase VII: Combat Focus Layer — The Story Battle Focus System (Layer 11)

**Deliverable:** `_storyRollInit()`, `#story-battle-overlay`, `#story-prebatt-overlay` (3-tab), `_storyEnemyTurn()`, `_storyBattleVictory()`, `#story-victory-overlay`, God Mode compatibility  
**Documentation:** Updated `mechanics.md` (full Battle Mode section rewrite)

**Problem:** Entering combat from Story Mode dumped the player into the raw Battle Mode panels — a God Mode debug interface with every possible roll visible simultaneously. This broke narrative immersion completely. The transition from "I arrived at a dungeon node" to "I see 14 dice-roll input fields" was tonally incoherent.

**Solution:** A focused, fixed-position overlay that hides the complexity of Battle Mode while preserving full access for players who want it.

The pre-battle screen established a deliberate moment of preparation before combat. Three tabs:
- **⚔ Fight** — enter immediately
- **💣 Condition** — spend gold to apply a status condition as an opener
- **🎭 Stealth** — roll d20 vs random DC 5–16; pass = go first + advantage on first attack

The distinction between these options is **risk calculus**. Stealth is free but uncertain. Conditions are reliable but cost gold. Plain fight costs nothing but sacrifices tactical advantage. This is the pre-battle as a decision, not a formality.

**Initiative enforcement:** `_storyRollInit()` rolls for both sides; the winner goes first. When the enemy goes first, `_storyEnemyTurn()` fires automatically at load — the player immediately takes a hit before they can act. This made initiative feel consequential rather than cosmetic.

**The God Mode compatibility solution** was architecturally interesting: rather than replacing the existing battle panels, the overlay sits on top of them (`z-index:150`). "⚙ Advanced" hides the overlay to reveal the full debug interface. `#sbo-refocus-bar` is a thin fixed bar that re-opens it. Neither mode is sacrificed — the debug tools remain fully accessible for power users while newcomers see only the focused narrative interface.

**Key theme established:** Interface has a point of view. The Battle Focus overlay argues that combat is drama, not spreadsheet management. The God Mode toggle acknowledges that some players want to see the numbers.

---

### Phase VIII: Economy Layer — Dynamic XP, Self-Funding Combat, and the Loot Table (Layer 12)

**Deliverable:** `LOOT_TABLE`, reward formula `floor(0.1 × AC × maxHP)`, `#svo-heal`, `#svo-gold`, corrected gold formula  
**Documentation:** `lab-report-drop-rates-balance-and-health.md` (partial; completed in Layer 13 writeup)

**Problem:** The existing XP system was flat-tier-based (`XP_BY_TIER`): a trivial monster gave 25 XP, a deadly monster gave 1,000 XP. This was correct in principle but decoupled from the enemy's actual stat block. Two "easy" monsters could have wildly different HP and AC values but award the same XP. There was no incentive to fight a tougher-than-necessary enemy within a tier.

**The formula:**
```
xpAward = enemy.ac × enemy.maxHp
reward  = floor(0.1 × AC × maxHP)
healAmt = reward
goldDrop = reward
```

**This formula has three important properties:**

1. **Continuous scaling:** XP, heal, and gold all scale with the continuous product `AC × maxHP`, not a discrete tier bucket. An enemy with AC 15 and HP 80 rewards `reward = 120` — more than an AC 12, HP 80 enemy (`reward = 96`) even if both are "hard" tier.

2. **Self-funding property:** The reward heals `10%` of the XP earned. A fight that drains HP also restores HP. Harder fights drain more HP but also restore more. The system is self-correcting — it can never trap the player in a state where they are damaged and poor from the fight that caused the damage.

3. **No farm incentive:** Weak enemies yield weak rewards. A goblin at AC 11, HP 7 yields `reward = 7`. A dragon at AC 22, HP 367 yields `reward = 807`. The player is never incentivized to grind trivial content.

**The formula correction mid-implementation** is documented in the cleanup report: the original plan specified gold as flat `enemy.maxHp`, but the user corrected this to `floor(0.1 × AC × maxHP)` — the same formula as heal. This correction transformed gold from a static tether to a dynamic proportional reward, aligning gold and HP recovery as a unified economy rather than two separate systems.

**The loot table** (d20 → healing potion) provides a floor: every kill, regardless of the enemy's stat block, drops a random healing potion. The expected value is 28.75 HP of potion recovery per kill. This ensures that the very first fight (against a trivial enemy with low reward) still produces a meaningful inventory drop.

**Key theme established:** Economy design is moral design. When you decide what behavior the game rewards, you decide what kind of player the game creates.

---

### Phase IX: Rest and Memory Layer — Short Rests, Boy Scouts Award, and the Necklace of Knowledge (Layer 13)

**Deliverable:** `storyShortRest()`, `_maybeAddKnowledgeBead()`, `_knowledgeIcon()`, `S_story.shortRests`, `S_story.knowledge`, inn DGQR reset, `#s-rests` status counter, `.rest-chip` chip, `.inv-item-knowledge` inventory section  
**Documentation:** `lab-report-drop-rates-balance-and-health.md` (completed)

**The Cooperative DM Principle, formalized:**

Every previous layer embodies the Cooperative DM Principle — the idea that in a solo PVE game, the game system is structurally on the player's side. Layer 13 made this principle explicit in design.

The short rest system (3 charges per day, reset at inn) is borrowed from D&D 5e's long-rest/short-rest model but simplified for a single-file arcade context. Key choices:
- Short rests are free (no gold, no day advance)
- 25% hpMax heal is meaningful but not overwhelming
- The 3-per-day limit creates genuine resource pressure

**The Boy Scouts Camping Award** is the most philosophically charged feature in the codebase. When a player rests outside an inn — in a forest clearing, on a boat deck, in a dungeon corridor — the game doubles their short rest healing. The design reasoning: sleeping rough is harder. A player who does it isn't being careless; they're being resourceful. The game should respect that, not penalize it.

This is the Cooperative DM Principle in its most literal form: the game acknowledges what the player did and rewards the harder choice.

**The Necklace of Knowledge** is the layer's most unusual feature. It does nothing. Knowledge beads cannot be used, sold, or combined. They are display-only items in a dedicated inventory section, accumulated by resting at each unique location. Their only function is to be a record of where the player has been.

This converts rest from a mechanical necessity (restore HP) into a narrative act (I was here, in this place, and I stayed). A fully beaded necklace is a complete run — a geography of a life. The DM rewards presence, not just performance.

**DGQR (Double Good Quality Rest):** Inn sleep was already the full HP restore. Layer 13 added:
1. Short rest counter reset (the "double good" — you get your charges back)
2. A knowledge bead for the inn (first time only)
3. A renamed message: "🛏 Double Good Quality Rest — full HP, short rests reset (3)."

The DGQR nomenclature is deliberate. It signals that the inn is *not just* a heal point — it is the premium rest experience that the short rest system exists in contrast to.

**Key theme established:** Memory is its own reward. The Necklace of Knowledge says: it matters that you were here.

---

## III. Prompt Pattern Analysis

The development conversation that produced *The Shattered Codex* exhibits several recurring prompt patterns. Identifying these patterns explains both why the project maintained coherence over a very long context span and why certain features arrived in a particular order.

### Pattern 1: The Practical Friction Prompt

**Form:** "This thing is annoying / missing / broken. Here is what I need instead."

**Examples:**
- "I need to track a fight better." → Battle Mode v1
- "I can't find the right monster fast enough." → WORLD_DB cascading dropdown
- "The combat just dumps me into the debug panels." → Story Battle Focus overlay

This pattern produced the majority of the project's infrastructure. Each prompt started from a real pain point in game-running and specified a concrete solution. The AI's role was to translate that solution into a minimal, coherent implementation.

**Architectural consequence:** Features driven by practical friction tend to be well-scoped. The player knows exactly what is missing because they felt its absence.

### Pattern 2: The "Plan Then Continue" Gate

**Form:** "Plan this for me. I'll say continue when ready."

This pattern appeared at every major layer boundary. The user consistently requested a full implementation plan before any code was written. The plan was reviewed, the user said "continue," and implementation proceeded without further specification negotiation.

**Architectural consequence:** Planning before coding prevented mid-implementation design conflicts. When a plan specified `CONDITION_GOLD` as a gold-cost table rather than an inventory deduction, that decision was reviewed before the code made it load-bearing.

### Pattern 3: The Inline Correction

**Form:** "Update correction: [specific formula / behavior / field name]."

**Examples:**
- "The gold dropped and the health given back is equal to the 10% modifier. HPGive = 0.1 × OpponentHPLoss × OpponentAC."
- "The return to story should dismiss [the banner] as well."

These corrections arrived mid-implementation, after the user saw the live output. They were always precise — not "this doesn't feel right" but "this formula is wrong and here is the right one." This precision enabled immediate, surgical corrections without revisiting the surrounding design.

**Architectural consequence:** Inline corrections were never refactors. They changed a formula or a behavior at its source without touching the surrounding architecture. The modular structure (each reward derived from a single `reward` variable, each UI update going through `storyUpdateStatus()`) made this possible.

### Pattern 4: The Academic Frame

**Form:** "Do a lab writeup / IEEE report for [feature or system]."

**Examples:**
- `lab-report-circuit-map-theory.md` — CS theory of the sparse node mesh
- `lab-report-battleground-circuit-path-quest.md` — battleground XP methodology
- `lab-report-drop-rates-balance-and-health.md` — reward formula + rest architecture

These requests arrived after a major feature was implemented and functionally verified. The lab report was not documentation for future developers — it was a tool for the *designer* to understand what they had built. Writing the reward formula derivation formally (showing `reward = floor(XP × 0.1)`) made its self-funding property legible. Writing the Cooperative DM Principle as an abstract theory gave it a name the design could be held accountable to.

**Architectural consequence:** The lab reports served as a specification audit. Writing them required verifying that the implemented system actually matched the intended design. Several discrepancies were caught this way and corrected.

### Pattern 5: The Philosophy Prompt

**Form:** A design question framed as a philosophical position, not a technical request.

**Examples:**
- "The adventurer is on your side." (framing for the Cooperative DM Principle)
- "The dungeon master is not your enemy. They are the author of the world."
- "Difficulty exists as texture, not obstruction."

These prompts did not request specific features. They established constraints that all features must satisfy. The Boy Scouts Camping Award exists because of this philosophical position — a feature that rewards rough camping with double healing is not obviously necessary, but it is *obligatory* given the stated principle that the game respects what the player chooses to do.

**Architectural consequence:** Philosophy prompts created *negative space* constraints — things the game was not allowed to do. The game was not allowed to punish exploration. It was not allowed to make the weak choice the safe choice. It was not allowed to make the player feel that the system was working against them. These constraints eliminated entire categories of bad design before any code was written.

### Pattern 6: The "Incorporate This Into the Plan" Bridge

**Form:** "Incorporate the ideas of this into the plan, then ask me to continue."

This pattern bridged a lab report (analytical) to a plan (implementation). The lab report established the design intent; the bridge prompt asked for that intent to be formalized as actionable implementation steps. The separation was deliberate: understanding a design and implementing it are different cognitive operations, and the bridge prompt created space for both.

**Architectural consequence:** This pattern ensured that the lab reports were not dead-end documents. Every analytical document produced at least one implementation commitment. The Necklace of Knowledge was described philosophically in the lab report; it was specified mechanically in the plan; it was implemented in the code.

---

## IV. Architectural Themes

### Theme 1: Single-File Discipline

Every feature in *The Shattered Codex* lives in one 7,465-line HTML file. There are no modules, no imports, no build system, no CDN dependencies. This is not a limitation — it is an architectural commitment with real consequences:

**Everything must coexist.** The Battle Mode dice roller and the Story Mode narrative engine share the same DOM, the same JavaScript namespace, the same CSS file. Features cannot assume isolation; they must assume collision. This discipline produced:
- Explicit namespacing (`S_story.*` vs `S.*`)
- Shared utility functions (one `storyMsg()` for all narrative messages)
- Careful z-index management for overlays
- A single startup initialization sequence

**Portability as a value.** The game runs in any browser, in an airplane, on a phone, with no internet connection. This was the original deployment constraint and it remained a design value throughout. Every architectural decision that would require a server, a build step, or an external dependency was rejected.

**File size as a health metric.** The line count progression (400 → 3,000 → 5,000 → 6,700 → 7,465) is visible in every commit. Each layer added between 100 and 800 lines. The discipline of "does this feature earn its lines" was implicit but real — every feature was measured against the cost of its footprint.

### Theme 2: State as Story

The `S_story` object is the complete state of an in-progress playthrough. It contains:
- Geographic state (current node, visited nodes, log)
- Economic state (HP, gold, day, inventory)
- Quest state (quest map, defeated battles, drops collected)
- Temporal state (Void Tide, Void Day)
- Tactical state (battle turn, battle round, pending drop)
- Memory state (knowledge beads, Necklace of Knowledge)

The save/load system serializes `S_story` to `localStorage`. A saved game is a complete snapshot of a playthrough's state at a moment in time — every choice the player made is encoded in this object. The Necklace of Knowledge's `knowledge[]` array is literally a serialized travel log: each bead records a node where the player slept, in the order they slept there.

**The state is the story.** The narrative does not exist in `story.md` (the prose document); it exists in the player's `S_story` object, as accumulated decisions.

### Theme 3: Data Precedes Feature

Every major feature in *The Shattered Codex* was enabled by data architecture that preceded it by multiple phases:

| Feature (Layer) | Data Architecture (Earlier Layer) |
|---|---|
| Stalk mechanic (L10) | `WORLD_DB` terrain → monster mapping (Phase III) |
| Hunting Grounds (L10) | All 42 terrains already had monster pools (Phase III) |
| Circuit corridors (L9) | `NODE_COORDS` for all 42 nodes (L0-era) |
| Reward formula (L12) | `S.enemy.ac` and `S.opp.maxHp` on battle state (L8-era) |
| Necklace of Knowledge (L13) | `node.name` terrain field on every NODE_MAP entry (L0-era) |
| Pre-battle condition gold cost (L11) | `CONDITION_ITEMS` with names (L4-era) |

This pattern was not accidental. It reflects the first-principles approach of building data schemas before building features that consume them. A terrain type that doesn't exist yet cannot have a hunting ground. A monster without an AC field cannot participate in the reward formula. The data layer is always built first, even when the features it enables are not yet planned.

### Theme 4: Specification Gravity

The project maintained coherence across a very long development span through a set of interlocking documents. These documents were not secondary artifacts — they were active design tools. Each document exerted "specification gravity" on the implementation: the code had to be consistent with the spec, and when they diverged, the spec was updated and the divergence was documented.

The specification family:
- `index.md` — master index; tracks all docs and their review status
- `plan.md` — active implementation plans; archived on completion
- `spec-engine.md`, `spec-corridors.md`, `spec-combat.md`, `spec-world.md`, `spec-migration.md` — architecture blueprints per domain
- `mechanics.md` — player-facing rules; updated with each layer
- `world.md`, `story.md`, `maps.md`, `monsters.md` — content references
- `lab-report-*.md` — analytical documents; specify-by-analysis

**The review cycle:** At intervals, `index.md` was used to audit all documents against the live code. Out-of-date sections were corrected. New features were documented in the appropriate spec. This cycle kept specification gravity from decaying into specification debt.

### Theme 5: Philosophy as Invariant

The Cooperative DM Principle is not a tagline. It is a mathematical invariant that the codebase must not violate. Concretely:

**The reward formula must be self-funding.** `reward = floor(0.1 × AC × maxHP)` ensures that the harder the fight, the more it heals and pays. A fight that nearly kills you leaves you better resourced than before it started. Violating this invariant (e.g., by capping the reward or separating heal from gold) would break the principle.

**Short rests must be free.** Charging gold or days for short rests would mean that rest is a resource the game controls against the player. The Cooperative DM Principle prohibits this.

**The Necklace of Knowledge must have no cost.** A bead system that costs inventory slots or has a carry limit would make exploration feel taxed. The beads are strictly additive — zero cost, zero tradeoff. The principle requires that memory has no price.

**The Boy Scouts Award must double healing, not halve the penalty.** A roughing-it system that said "you're at half healing outside an inn" would penalize resourcefulness. Doubling healing outside the inn instead rewards it. The principle transforms what could have been a punishment into a bonus.

---

## V. The Specification-Code Coherence Loop

The most important engineering process in this project is not any algorithm or data structure. It is the **specification-code coherence loop**:

```
Write Spec → Implement Code → Verify Spec → Document Divergences → Update Spec → Write Spec
```

### The Loop in Practice

**Step 1 — Write Spec:** Before any code was written for a layer, the design was articulated in natural language. Sometimes this was a formal plan (plan.md sections), sometimes an architectural spec (spec-corridors.md), sometimes a lab report that identified an intention (lab-report-drop-rates-balance-and-health.md).

**Step 2 — Implement Code:** The spec was used as a guide during implementation. When the spec was ambiguous, the implementation made a decision and that decision was noted for later documentation.

**Step 3 — Verify Spec:** After implementation, the code was compared to the spec. The verification manifests in `lab-report-plan-cleanup-v13.md` are the formal record of this step — every spec item cross-referenced to its live function or constant.

**Step 4 — Document Divergences:** Two classes of divergence were documented:
- **Corrections:** Where the spec was wrong and the implementation was corrected (e.g., the gold formula)
- **Extensions:** Where the implementation went beyond the spec (e.g., `S.opp.tier` and `S.opp.cond` were added to `loadWorldMonster()` to support the battle overlay, even though they weren't explicitly specced)

**Step 5 — Update Spec:** Corrected specs and documented extensions were folded back into the appropriate documents (mechanics.md, spec-engine.md, etc.).

**Step 6 — Compress Completed Specs:** When a layer was complete and verified, its detailed spec was archived (as in `lab-report-plan-cleanup-v13.md`) and plan.md was compacted to a reference row. The detailed spec ceased to be authoritative — the code took over as the source of truth.

### Why the Loop Works

The loop works because it assigns authority correctly:
- During design, the spec is authoritative.
- During implementation, the spec is a guide but the coder has authority to deviate.
- After implementation, the code is authoritative.
- After verification, the deviation is documented and the spec is updated.

At no point is the spec expected to be a perfect predictor of the implementation. It is a thinking tool, not a contract. This flexibility allowed the design to evolve without invalidating the specification process.

---

## VI. Timeline — Arena to Prototype

```
[Pre-development]
  The problem: tracking D&D combat in real time without secondary tooling.
  The constraint: single HTML file, no external dependencies.
  
  ↓

[Phase 0 — Concept] ~2024
  First prompts about combat tracking. No code yet.
  
  ↓

[Phase I — Arena] Session 1
  roll2hit.html: ~400 lines
  Four-quadrant arena. Player and opponent panels. d20 attack + damage.
  History log. Advantage/disadvantage.
  Core pattern established: one mutable state object S, all data there.
  
  ↓

[Phase II — Layout] Session 2–3
  roll2hit-v2.html: ~800 lines
  3-column layout: config / attack / damage.
  Config panel: weapon loading, monster selection.
  Advantage toggle moved to header.
  spec-combat.md written: first formal specification document.
  
  ↓

[Phase III — World Engine] Sessions 4–8
  roll2hit-v3.html begins: ~2,000–3,000 lines
  WORLD_DB: 42 terrain types.
  MONSTER_POOL: 120 monsters → 329 monsters (Dark Fantasy Bestiary II added).
  Terrain-stratified cascading dropdown.
  spec-world.md written.
  
  ↓

[Phase IV — Narrative Engine] Sessions 9–20 (Layers 0–8)
  roll2hit-v3.html: ~5,500 lines
  S_story state machine alongside S battle state.
  NODE_MAP: 42 nodes, 8 acts, 26×16 grid.
  QUEST_DB, GATE_LOCKS, CONDITION_ITEMS.
  Vendor economy (POTION_TIERS, MONSTER_DROPS).
  Hearth Home, Transmort Scroll.
  Void Tide calendar, 49-day hard limit.
  Save/load to localStorage.
  8 documentation documents written:
    spec-engine.md, spec-migration.md, world.md, story.md,
    maps.md, mechanics.md, monsters.md, index.md.
  
  ↓

[Phase V — Geography] 2026-05-21 (Layer 9)
  roll2hit-v3.html: ~6,322 lines
  CORRIDOR_CELLS: Manhattan L-shape routing for all NODE_MAP edges.
  J1–J7 junction nodes at strategic crossroads.
  Hunt/Warp dialog (#story-corridor-overlay).
  Quest-scaled encounter rate (10–90%).
  Active path highlight (gold wire glow on last route).
  Fog-of-war: dim to unvisited nodes, bright to visited.
  lab-report-circuit-map-theory.md written.
  spec-corridors.md written.
  
  ↓

[Phase VI — Ecology] 2026-05-21 (Layer 10)
  roll2hit-v3.html: ~6,500 lines
  HUNTING_GROUNDS: 42 terrain → display name lookup.
  MT node at (4,5): Mountain Pass, dead-end branch from J6.
  Stalk mechanic: guaranteed encounter, 6× quest-target weight.
  _stalkedMonsterPick() + _getQuestTargetKeys().
  lab-report-battleground-circuit-path-quest.md written.
  
  ↓

[Phase VII — Combat Focus] 2026-05-21 (Layer 11)
  roll2hit-v3.html: ~6,900 lines
  Story Battle Focus overlay (#story-battle-overlay, z-index:150).
  Initiative: _storyRollInit() with tier modifier.
  Pre-battle 3-tab system: Plain / Condition (gold) / Stealth (d20 vs DC 5–16).
  Enemy auto-turn: _storyEnemyTurn() at 1.2s.
  Potion quick-use as free action in battle.
  Victory overlay (#story-victory-overlay): XP, heal, gold, drops.
  God Mode via ⚙ Advanced: minimizes overlay, full panels visible.
  mechanics.md rewritten: full Battle Mode section.
  
  ↓

[Phase VIII — Economy] 2026-05-21 (Layer 12)
  roll2hit-v3.html: ~7,200 lines
  XP formula: AC × maxHP (replaces flat XP_BY_TIER).
  Reward formula: floor(0.1 × AC × maxHP) for both heal and gold.
  LOOT_TABLE: 20-entry d20 weighted potion table (50/25/15/10).
  Formula correction: gold changed from flat maxHp to reward formula.
  Victory overlay shows HP recovered + gp looted.
  lab-report-drop-rates-balance-and-health.md begun.
  
  ↓

[Phase IX — Rest and Memory] 2026-05-21 (Layer 13)
  roll2hit-v3.html: 7,465 lines
  Short rests: 3/day, 25% hpMax, free (no gold, no day cost).
  Boy Scouts Camping Award: 2× heal at non-inn nodes.
  Necklace of Knowledge: unique rest-location beads, display-only.
  Inn DGQR: full HP + short rest reset.
  Status bar: 🌙 N/3 rest counter (warn at 1, danger at 0).
  SHORT REST chip on every node: shows charges + ×2 camping indicator.
  Inventory: 🔮 Necklace of Knowledge section below item list.
  lab-report-drop-rates-balance-and-health.md completed.
  plan.md compacted: 1,223 lines → 85 lines.
  lab-report-plan-cleanup-v13.md written.
  
  ↓

[Current State] 2026-05-21
  roll2hit-v3.html: 7,465 lines
  14 documentation files across 3 specification families.
  329 monsters, 42 nodes, 50 nodes total (+ junctions + MT).
  Layers 0–13: complete.
  Philosophical position: the Cooperative DM Principle.
  Architectural identity: The Shattered Codex.
```

---

## VII. From Arena to Prototype — A Comparative Analysis

### What Stayed

The original dice engine is still in `roll2hit-v3.html`, unchanged in its essential mechanics. The d20 attack roll, the advantage/disadvantage resolution, the damage dice roller, the combat history log — these are Phase I features that every subsequent layer was built around, not over.

This persistence is architecturally important. *The Shattered Codex* did not replace the dice tracker. It *narrated* it. The Story Battle Focus overlay is not a new combat system — it is a presentation layer over the existing `rollAttack()`, `rollDamage()`, `rollEnemyAttack()` functions. The pre-battle tabs do not change how combat resolves — they change how the player enters it. The victory screen does not change what dropping an enemy means — it changes how that meaning is communicated.

The arena remained. The narrative grew around it.

### What Changed

| Dimension | Arena (Phase I) | Prototype (Phase IX) |
|---|---|---|
| State | One object `S` with ~15 fields | Two objects (`S` + `S_story`) with 40+ fields combined |
| Input | Roll buttons, HP tracking | D-pad navigation, chip clicks, overlay interactions |
| Output | Dice results, HP numbers | Narrative messages, quest updates, map movement |
| Persistence | None | localStorage autosave; full `S_story` serialization |
| World | One encounter | 50 navigable nodes, 8 acts, 49 days |
| Monsters | Manual stat block entry | 329-entry catalog across 42 terrains |
| Economy | None | Gold, potions, trophies, vendor nodes |
| Time | None | Calendar (days), Void Tide pressure clock |
| Memory | Session only | Knowledge beads, necklace, run history |
| Philosophy | Neutral (it's a tool) | Explicit (the DM is on your side) |

### What the Project Became

A dice tracker is an instrument. A game is an argument.

*The Shattered Codex* makes an argument: that a player who engages with the game as intended should always have enough resources to continue, that difficulty is texture rather than obstruction, that the places you sleep are worth remembering, and that the system respects what you do even when you do it the hard way.

This argument was not in the first prompt. It emerged across the development conversation — through philosophy prompts, through formula corrections, through lab reports that forced the design to articulate itself. The Cooperative DM Principle was not planned; it was discovered.

That is, perhaps, the most important architectural observation of this entire report: **the best design decisions in this project were not made in advance. They were recognized in retrospect.** The reward formula was a correction. The Boy Scouts Award was a principle statement. The Necklace of Knowledge was a philosophical assertion that crystallized only after the rest architecture was laid out analytically.

This is what long development conversations make possible: not just implementation, but emergence. The game that exists at Layer 13 is not the game that was planned at Phase I. It is the game that was discovered through the process of building it.

---

## VIII. Conclusion

The Roll2Hit project is a case study in prompt-driven software development at the intersection of game design, systems architecture, and design philosophy. Its primary technical contribution — a 7,465-line single-file game engine with no dependencies — is less interesting than its methodological contribution: the discipline of maintaining specification gravity across a multi-phase, long-context-span development process.

The project succeeded because:
1. Practical friction drove feature prioritization — nothing was built for its own sake
2. The "plan then continue" gate prevented premature implementation
3. Inline corrections were surgical and documented
4. Lab reports converted design intent into articulated principles
5. Philosophy prompts created invariant constraints that all features had to satisfy
6. The specification-code coherence loop kept documentation and implementation aligned
7. The single-file constraint forced every feature to earn its position

The game that emerged — *The Shattered Codex* — is a 42-node solo adventure built on the belief that the dungeon master is on your side. That belief is encoded not merely in the narrative but in the mathematics of its reward formula, in the doubled healing when you sleep under stars, in the bead that appears in your inventory the first time you rest at each new place.

The arena was a tool. The prototype is a position.

---

## Appendix A — Document Inventory (as of 2026-05-21)

| File | Type | Status |
|---|---|---|
| `index.md` | Master index | ✅ Current |
| `plan.md` | Implementation plan | ✅ Compacted (85 lines) |
| `spec-combat.md` | Phase I–II architecture spec | ✅ Historical |
| `spec-world.md` | Phase III world engine spec | ✅ Current |
| `spec-engine.md` | Layers 0–8 architecture spec | ✅ Current |
| `spec-migration.md` | Layers 0–8 IEEE migration report | ✅ Current |
| `spec-corridors.md` | Layer 9 function-level spec | ✅ Current |
| `mechanics.md` | Player-facing rules reference | ✅ Current |
| `world.md` | DM manual: factions, NPCs, conditions | ✅ Current |
| `story.md` | 42-node narrative content | ✅ Current |
| `maps.md` | World map: grid, nodes, gates | ✅ Current |
| `monsters.md` | 329-monster reference table | ✅ Current |
| `lab-report-circuit-map-theory.md` | Layer 9 CS theory | ✅ Complete |
| `lab-report-battleground-circuit-path-quest.md` | Layer 10 XP methodology | ✅ Complete |
| `lab-report-drop-rates-balance-and-health.md` | Layer 12–13 reward + rest design | ✅ Complete |
| `lab-report-plan-cleanup-v13.md` | Spec archive: Layers 9–13 | ✅ Complete |
| `lab-report-prompt-migration-arena-to-prototype.md` | This document | ✅ Complete |

---

## Appendix B — Key Formula Reference

| Formula | Domain | Invariant |
|---|---|---|
| `XP = AC × maxHP` | Combat economy | Scales continuously with enemy stat product |
| `reward = floor(0.1 × AC × maxHP)` | Reward (heal + gold) | HP recovered = gold looted, always equal |
| `shortRestHeal = floor(hpMax × 0.25)` | Rest | Standard short rest: 25% max HP |
| `shortRestHeal = floor(hpMax × 0.50)` | Rest (Boy Scouts) | Non-inn rest: 50% max HP |
| `encounterChance = min(0.9, 0.1 + activeQuestCount × 0.05)` | Corridor encounter | Quest engagement scales encounter pressure |
| Stalk weight boost = `6×` for quest targets | Stalk ecology | Active quests make their targets more findable |
| Expected potion heal per kill = `28.75 HP` | Loot table | Floor guarantee independent of enemy difficulty |

---

*Report written 2026-05-21*  
*Codebase: roll2hit-v3.html — 7,465 lines, Layers 0–13 complete*  
*Development span: Arena (~400 lines) → Prototype (7,465 lines), approximately 10× growth*  
*Philosophy: The Cooperative DM Principle — the dungeon master is not your enemy*
