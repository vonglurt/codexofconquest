<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — The Corpus as Architecture
### A Meta-Analysis of 65 Active Lab Reports and Their Structural Relationship to `roll2hit-v3.html`

**Project:** `roll2hit-v3.html` — single-file HTML5 game engine, MIT License  
**Status:** 65 active lab reports · 33,721 HTML lines · Layers 0–78+ documented  
**Date:** 2026-06-16  
**Series:** Meta-Documentation · Corpus Analysis · Design Philosophy  
**Classification:** Engineering · Game Theory · Documentation Science · Self-Reference  

---

## Abstract

This report treats the corpus of 65 active lab reports as a primary data source and asks a structural question: *what does the distribution of lab-report topics reveal about the game they document?*

**Hypothesis:** The 65 active lab reports, when ordered by their conceptual distance from the game's atomic unit (a single dice roll), exhibit a monotonic gradient from mechanical precision to narrative ambiguity. This gradient is not accidental — it mirrors the game's own design philosophy, which holds that probabilistic systems (the dice) and human-meaning systems (NPC relationships, grief, music) are two poles of the same moral framework. Furthermore, the lab-report method itself — hypothesis, data, observation, conclusion — is structurally identical to the game's core loop: form expectation, roll dice, observe outcome, update state. The act of writing a lab report *is* the game. The corpus is the player's save file.

**Finding:** The hypothesis is supported. The 65 reports cluster into seven concentric layers radiating outward from the roll mechanic, and the reports that produced the most durable architectural decisions are the ones that crossed layer boundaries — that had to reconcile dice physics with human meaning. The single-file constraint is the gravitational field that keeps all seven layers in contact. Remove it and the layers separate into a conventional game engine.

---

## I. Introduction: The Object and the Method

Before the corpus can be analyzed, both the object and the method must be precisely defined.

### I.A — The Object

`roll2hit-v3.html` is a single file. No server. No npm. No CDN. No build step. One HTML file you can email. It contains:

- A complete D&D 5e combat engine (initiative, action economy, conditions, death saves, advantage/disadvantage, Fighter Champion Levels 1–20)
- A 71-node narrative RPG spanning 8 acts and ~100 quests
- 370+ monsters across 66 terrain types organized into `WORLD_DB` / `MONSTER_POOL`
- A vendor economy, inventory, save/load via `localStorage`, and a survival clock
- 17 journal entries by a dead researcher; an NPC favorability system with 6 named characters; four ending variants; and a Curse of Knowledge score that measures whether you treated knowledge as a credential or a gift

The design constraint — one file, giveable — is not a limitation. It is a philosophical statement encoded as an engineering requirement. Every architectural decision in the game traces back to it.

### I.B — The Method

A lab report in this project is an IEEE-format document written *during or immediately after* a development session. It has a hypothesis, a data section (usually: line numbers, function names, state fields), and a conclusion. It is not a post-mortem. It is a cognitive scaffold for the next session — the previous researcher's last act before walking away from the desk.

Froberger, the dead researcher in the game's fiction, left 17 journal entries. Each entry is a lab report. Each says: here is what I found, here is where I failed, here is what I am leaving for you. The structural parallel is not decorative. It is the design.

---

## II. Taxonomy: Seven Layers from the Roll

The 65 reports are assigned to seven concentric layers based on their primary conceptual focus relative to the core dice roll. Layer 0 is the roll itself. Layer 6 is the outermost layer: meaning, philosophy, the reason anyone rolls at all. The seventh category — Orbit — is the structural container that makes all six layers possible.

| Layer | Name | Count | Theme |
|-------|------|-------|-------|
| 0 | The Roll | 6 | Dice, probability, combat mechanics, conditions |
| 1 | The Hit | 5 | What the roll resolves: loot, economy, survival math |
| 2 | The World | 8 | Where rolls happen: map, grid, node network |
| 3 | The Quest | 18 | Who sends you to roll: arcs, NPCs, quest architecture |
| 4 | The Voice | 7 | Why rolling matters: narrative, writing, grief, music |
| 5 | The Horizon | 5 | Future rolls: planned arcs, aspirational features |
| 6 | The Mirror | 7 | The corpus reflecting on itself: synthesis series |
| Orbit | The Engine | 9 | Infrastructure that holds all layers in contact |

---

## III. Layer 0 — The Roll

*Six reports whose primary subject is the dice mechanic itself: what happens when a number is generated, how probability is shaped by design, what constitutes a fair fight.*

### 1. `lab-report-drop-rates-balance-and-health.md`
**Connection to core concept:** The Cooperative DM Principle — enemies must always be beatable; death must always be recoverable — is the moral philosophy of the game encoded as a probability formula. This report is where that principle became a number. It defines the loot floor (always something), the XP curve, and the health regeneration that prevents softlocking. Without it, the dice are just dice. With it, the dice are a promise.

### 2. `lab-report-leveling-flashbang-condition-economy.md`
**Connection:** Character progression from Level 10 to Level 20, the Flashbang condition (disadvantage on concentration), and condition pricing are the mechanics by which the roll's meaning changes over time. A Level 3 roll and a Level 17 roll hit the same numbers but land in different worlds. This report defines how the world changes around the roll without changing the roll itself.

### 3. `lab-report-luck-seventh-stat.md`
**Connection:** Luck is the hidden seventh stat that affects loot weighting, death save thresholds, fishing variance, and encounter rate — invisibly. A player who helped their friends rolls better without knowing why. This is the game's deepest mechanical encoding of its thesis: prosocial behavior has probabilistic consequences. The dice are not neutral. They know who you helped.

### 4. `lab-report-fish-with-dnd.md`
**Connection:** Fishing is the positive loot vector — the counterpoint to combat. Where combat resolves violence probabilistically, fishing resolves patience probabilistically. Both use the dice. This report is the moment the design recognized that the roll need not always be in service of hitting something. It can be in service of waiting. That expansion of what the dice mean is architecturally significant.

### 5. `lab-report-fishing-bait-prompting.md`
**Connection:** The bait subsystem adds conditional probability layering to the fishing roll — certain baits shift the encounter table in ways the player can learn and exploit. This is teaching the player that the dice are shapeable, not fixed. The same lesson the game's narrative teaches: you can shift outcomes by choosing who to help. The fishing mechanics are a tutorial for the NPC favorability system.

### 6. `lab-report-api-01-02-mechanics-combat-review.md` *(archived)*
**Note:** Archived as superseded by synthesis-part2. Included in this layer for completeness. Its primary contribution — verifying that the API and combat mechanics remained consistent across documentation versions — is now a permanent fixture of the two-way sync discipline.

---

## IV. Layer 1 — The Hit

*Five reports about what the roll resolves: loot tables, weapon economy, rewards, and the math of survival.*

### 7. `lab-report-loot-drop-system-v2.md`
**Connection:** The three-channel loot model (monster drops, fishing, vendor) formalizes the game's economy into a verifiable system. This report is the moment the reward structure became architecture rather than ad-hoc design. It defines what the player carries out of every encounter — which determines what they can do in the next one. The economy is the bridge between rolls.

### 8. `lab-report-battleground-circuit-path-quest.md`
**Connection:** Epic Battlegrounds are outdoor boss nodes with dedicated quest-terrain coupling and a stalk mechanic. This report defines how a combat encounter becomes a *destination* — how hitting hard enough to earn a named boss fight is different from random engagement. The path to the Battleground is the game telling you this hit matters more than the others.

### 9. `lab-report-epic-battlegrounds.md`
**Connection:** Twenty new nodes, outdoor boss architecture, the approach-chamber-boss structure for outdoor fights. Where Layer 0 defines the roll, Layer 1 defines the arena. This report is the most spatial of the combat reports — it turns probability into geography.

### 10. `lab-report-tattoo-progression-system.md`
**Connection:** Tattoos are a death-persistent progression layer — ink that survives both NG+ resets and the Groundhog Day loop. They are the only form of combat power that accumulates across playthroughs. This connects to the core concept because the Tattoo system is the game's answer to the question: what do you carry when you die? Not your gold. Not your gear. Your choices and their physical marks.

### 11. `lab-report-ng-plus-remembrance.md`
**Connection:** NG+ is the second playthrough state where prior knowledge changes what the dice reveal. Froberger's empty page (Entry 42) can only be written on the second run, because only then does the player know what to write. This report formalizes memory as a mechanical resource — the second roll is different because of the first one. Remembrance is a stat.

---

## V. Layer 2 — The World

*Eight reports about where rolls happen: the map, the cell grid, the node network, and the tooling that maintains it.*

### 12. `lab-report-cell-map-mud-redesign.md`
**Connection:** §CELL-01 through §CELL-12 replaced the named-neighbor navigation system with a coordinate grid. This is the most structurally consequential change in the project's history — it turned the world from a graph of named relationships into a space with cardinal directions and reachability proofs. You don't travel to a node by name. You travel north. The grid is the world's grammar.

### 13. `lab-report-movement-by-cells.md`
**Connection:** The complete navigation system specification. `cellMove(dir)`, the BFS pathfinder, the compass interface, the one-BFS invariant. This report is the source truth for how the player gets from one place to another — which means it defines the shape of every encounter, since you cannot fight something you cannot reach.

### 14. `lab-report-circuit-map-theory.md`
**Connection:** The junction model that preceded cells. Historically foundational: it shows the design attempting to formalize world traversal through circuit theory (nodes, edges, traversal rules) before discovering that a coordinate grid was simpler and more provable. The failure mode of circuit theory — junctions that were logically connected but geometrically incoherent — is what motivated the cell redesign. Every good architectural decision in this project has a lab report documenting why the previous approach was wrong.

### 15. `lab-report-highway-mesh-entry.md`
**Connection:** Junction optimization for the highway mesh — reducing unnecessary intermediate nodes that added traversal cost without adding narrative content. This report's contribution is the principle that every node must justify its existence: a node with no NPC, no quest, and no distinctive terrain is a structural tax on the player's attention. The highway mesh fix applied this principle to the world's skeleton.

### 16. `lab-report-junction-reweave-overhaul.md`
**Connection:** The junction reduction procedure — the operation that collapses redundant intermediate nodes and re-establishes bidirectional connectivity. This is infrastructure surgery, and it connects to the core concept by ensuring that the world remains a space the player can explore rather than a graph they can only traverse in prescribed directions. Reachability is freedom.

### 17. `lab-report-mega-reweave.md`
**Connection:** The eight-phase MegaReweave operation — the largest single world-repair pass in the project. This report documents what happens when structural debt accumulates: nodes that were logically correct but geometrically isolated, edges that existed in one direction but not the other. The MegaReweave is the moment the world became fully traversable. It is the map audit made executable.

### 18. `lab-report-map-audit-layout-tooling.md`
**Connection:** The TTS queue, patch sidecar, grid layout solver, and map validation tooling. This report is the maintenance layer for the world: the tools that detect drift between the documented map and the live WORLD_DB. It connects to the core concept because a world that cannot be audited cannot be trusted — and a player who cannot trust the world cannot trust the roll.

### 19. `lab-report-node-network-reconnection.md`
**Connection:** The full world repair pass that achieved 100% reachability. Every node connected to every other node through some valid path. This report is the proof that the world is complete — that no matter where the player starts, they can get everywhere. It is the navigational equivalent of the Cooperative DM Principle: the world, like the combat system, promises that no state is terminal.

---

## VI. Layer 3 — The Quest

*Eighteen reports about who sends you to roll and why: specific arcs, NPC design, and the formal architecture of quests.*

### 20. `lab-report-ally-cat.md`
**Connection:** The Cat Quarter arc (CDG) — Jimmy Two-Tails, Sandy Scratchpad Mewlino, the Taz Devil merge mechanic, the Cat-King. This is the first major optional arc in Act I. It connects to the core concept by being structurally optional: you never have to go to CDG. The Birka main quest continues without it. But if you do go, you become Honorary Ally Cat — the game's first proof that optional commitment produces identity, not just reward.

### 21. `lab-report-birka-beginner-arc.md`
**Connection:** Act I narrative structure — the six Birka NPCs, the favorability system, the personal quests that establish stakes before the Void pressure becomes legible. This report is the on-ramp. It connects to the core concept because the Birka arc teaches the player that the dice are not the point. The point is what you do between rolls: who you talk to, what you deliver, who you check on. The combat is the punctuation. The NPCs are the sentences.

### 22. `lab-report-ceremonia-roll-skill-checks.md`
**Connection:** §DESIGN-03 — the d20+mod+prof skill check system, the Ceremonia Roll (a social roll for non-combat interactions), and the Yael 5-act romantic arc. This report expands the dice mechanic into the social domain: not just "can I hit this" but "can I say the right thing." It formalizes the game's implicit claim that social competence is a skill, not a personality trait — you can roll for it.

### 23. `lab-report-corelli-merchant.md`
**Connection:** Layer 61 — the Corelli merchant arc, favorability gating, and the investigative content at the merchant layer. Corelli is the game's example of a quest-giver whose quests reveal more about the quest-giver than the quest. Connecting to core concept: the deeper you go into a character, the more the rolls feel personal. Corelli's arc is the tutorial for La Riva — for grief told through objects.

### 24. `lab-report-crown-three-hags.md`
**Connection:** §CROWN-01 — the Three Hags arc, the Ceremony mechanic, the Kindness Calculus applied to supernaturally adversarial entities. The hags use the same favorability logic as friendly NPCs, but inverted: they reward you for cruelty, not kindness. This connects to core concept by showing that the prosocial mechanics have a dark mirror — the game can use the same system to teach both what works and what doesn't.

### 25. `lab-report-dungeon-ten-themes.md`
**Connection:** §DUNGEON-01 — ten dungeon themes applied to The Shattered Codex: hero origin, CY madness, Mimic Meadows (LIM), Loop Heart (CO), Shifting Labyrinth, Sacrifice Gates, Scholar Workshop, Themed EB doctrine, Arcane Inversion, Judgment Room. This report is the game's theory of dungeon design, expressed as a checklist. Each theme is a different kind of question a dungeon asks the player. The dungeon is not an obstacle. It is a diagnostic.

### 26. `lab-report-endings-and-echoes.md`
**Connection:** The four ending variants, the Covenant Ceremony, the epilogue structure. This report is the game's theory of completion — what it means for a roll-based game to end. The answer the report arrives at: the ending is not determined by your final roll. It is determined by the accumulation of all your non-combat choices. The Covenant Keeper ending names every person you helped. The dice are not even mentioned.

### 27. `lab-report-kenickie-chronicle.md`
**Connection:** The Kenickie Black Market (Layer 75) and the Chronicle System (career stats). Kenickie is the Cat Arc's most load-bearing NPC — the one whose silence at the end of La Riva is the resolution of the grief arc. The Chronicle System records the player's statistical history across the whole run. Connecting to core concept: the Chronicle is what the game knows about you that you may not have noticed. It is the save file's autobiography.

### 28. `lab-report-kindness-calculus.md`
**Connection:** A formal analysis of 159 active quests through the lens of prosocial mechanics. This report asks: across all quests, what is the actual ratio of "help someone" to "defeat something"? The finding that most quests are prosocial — that combat is usually a means to helping, not an end in itself — confirms the game's design thesis in aggregate. The Kindness Calculus is the game's own moral audit.

### 29. `lab-report-la-riva-grief-arc.md`
**Connection:** §GR-01 — the La Riva grief arc (AMS node), the French vignette writing technique, Connie Tuna and Aldo Sardino. This is the purest expression of the game's thesis: the three city blocks the Cat-King destroyed are not a combat zone. They are a grief space. You cannot un-destroy them. You can only witness what happened and carry the account book to someone who needs it. The roll to hit cannot fix everything. That is the point.

### 30. `lab-report-littoral-courts.md`
**Connection:** §SIREN-01 — the Littoral Courts arc, the four Ladies of the Littoral, the manipulation psychology mechanics. The Ladies do not fight you. They offer you what you want in exchange for your betrayal of everything you've built. The arc connects to core concept by being the game's hardest test of the prosocial framework: can you refuse something genuinely desirable because of who you'd hurt?

### 31. `lab-report-living-world.md`
**Connection:** Layer 44 — off-screen characters (Gigault), world momentum, the design of a world that continues without the player. This report formalizes the principle that NPCs have lives the player doesn't observe. Connecting to core concept: the world's fullness — the sense that Sweelinck is in the observatory whether or not you visit — is what makes your choice to visit meaningful. A world that only exists where the player is looking is a carnival mirror. This is not that.

### 32. `lab-report-naval-campaign-layer.md`
**Connection:** §SPARK, §NAVAL, §PORT, §HUNT, §WHODUNIT, §ALCHEMY — nine new nodes, the naval arcs. The naval layer is the game's first sustained engagement with a domain (seafaring) that has its own physics, its own economy, and its own social structures. It connects to core concept by expanding the definition of "world" beyond the cell grid into a different kind of navigation — one where the wind matters and the compass points differently.

### 33. `lab-report-quest-api-architecture.md`
**Connection:** §ARCH-01 — the Universal Quest Format (UQF v1.0), the Mission Bit Registry, the QuestRuntime singleton. This report is the moment the quest system became a formal API rather than a collection of ad-hoc state flags. Connecting to core concept: every quest in the game is now a declaration — it says what it is, what it needs, what it produces — rather than a procedure. The game's meaning is now expressed in data, not code. That is a philosophical choice as much as an architectural one.

### 34. `lab-report-quest-data-code-separation.md`
**Connection:** §ARCH-02 — separating QUEST_DB from QUEST_EFFECTS and QUEST_HOOKS. This report enforces the principle that data and behavior are different things. A quest's identity (what it is, who gives it, what it rewards) is separate from a quest's consequence (what it changes when completed). Connecting to core concept: this separation is what allows the game to be understood — you can read QUEST_DB and know the world. You don't need to trace function calls.

### 35. `lab-report-quest-minus-one-world-creator.md`
**Connection:** Level 20+ disclosure and the World Creator Wizard — the post-game state where the player can see the system they played inside. This report is the game's theory of transparency: after you've finished, you get to see the rules. You become the person who can give this knowledge to the next player, which is the Curse of Knowledge's cure. The World Creator Wizard is the game's final mechanic, and it is about sharing.

### 36. `lab-report-weimar-scholar-gate.md`
**Connection:** Layer 51 — the Scholar Gate arc, Isolde Voss and Benedikt Rasp at NUE, the archive modal, the tome category. Weimar is where the game's knowledge is stored — the archive the First Researcher used, the lower stacks where the redacted document waits. Connecting to core concept: the archive is the game's in-world version of the lab-report corpus. Froberger's field notes are there. So is the proof of why the Void was never fully defeated: the knowledge was hoarded.

### 37. `lab-report-tilbury-visby-arcs.md`
**Connection:** Layers 54–55 — the Tilbury Harbor arc (investigating the merchant conclave) and the Visby Underground. These are the game's investigation arcs — quests that resolve through discovery rather than combat. Connecting to core concept: the investigation mechanic uses the same dice system as combat, but pointed inward at the world's secrets rather than outward at enemies. Knowing something is a form of hitting it.

---

## VII. Layer 4 — The Voice

*Seven reports about why rolling matters: narrative design, writing philosophy, grief, and the aesthetics of the text itself.*

### 38. `lab-report-friendships-with-magic.md`
**Connection:** The foundational philosophy audit — eight hours examining what the game actually is. The punchline: "Friendships with Magic" — not magic that wins battles, but magic that is the byproduct of choosing people over efficiency. This report is the most important in the corpus for establishing what the game is trying to *feel like*. All subsequent writing decisions trace back to it.

### 39. `lab-report-game-story-codex-of-conquest.md`
**Connection:** Narrative architecture for the full arc: the 5-step narrative template, the Curse of Knowledge theme, the relationship between the game's story and its mechanics. This report is the design spec for the game's voice — how it speaks, what it speaks *about*, and why those two things are the same question.

### 40. `lab-report-kindness-calculus.md`
*(Cross-listed with Layer 3.)* As a Layer 4 document, it is the game's moral philosophy expressed as a formal framework — a proof that prosocial behavior is the game's winning strategy at every level of abstraction, from individual quests to the final ending evaluation.

### 41. `lab-report-narrative-arcs-brynn-bruhns-yael.md`
**Connection:** Layers 70, 72, 74 — the implemented NPC arc scenes for Brynn, Bruhns, and Yael. Each arc uses the favorability system to deliver a specific emotional register: Brynn (care as continuity), Bruhns (precision as care), Yael (protection as language). This report is the closest the corpus comes to a writing textbook. It defines how three characters can occupy the same mechanical system and feel completely different.

### 42. `lab-report-story-codoex-curse-of-knowedge.md`
**Connection:** Steven Pinker's "Curse of Knowledge" applied as narrative design principle — the game's primary theme. The Curse is the reason Froberger left journal entries: he knew something, and he chose to give it away rather than hoard it. This report formalizes the game's proposition: intelligence without generosity is the void. The antidote is the same mechanic as fishing — patience, attention, and releasing what you caught so someone else can find it.

### 43. `lab-report-la-riva-grief-arc.md`
*(Cross-listed with Layer 3.)* As a Layer 4 document, it is the game's theory of grief: how to write loss that cannot be resolved, only witnessed. The French vignette technique — two perspectives, one object, the gap between them — is the stylistic heart of the game's most emotionally demanding content.

### 44. `lab-report-Polyphonic-Organ-Synth.md`
**Connection:** `5thOrgan.html` — the standalone browser-based polyphonic organ synthesizer. At first glance, this is the corpus outlier. It has no monsters, no quests, no NPCs. But it is the game's proposition about sound applied to code: can a single HTML file contain music the way it contains narrative? The organ synth is the same design constraint (one file, giveable, zero dependencies) applied to a different problem domain. It is proof that the constraint is generative, not restrictive.

---

## VIII. Layer 5 — The Horizon

*Five reports about future rolls: planned arcs, aspirational features, and content waiting to be implemented.*

### 45. `lab-report-saul-paul-travel-reference.md`
**Connection:** §FUTURE-01 historical reference — chronology, geography, and source material for the Saul/Paul arc. A game about a scholar trapped in a loop has a natural affinity with Paul of Tarsus, who spent his pre-conversion life enforcing the Curse of Knowledge (keeping the Law closed, persecuting those who said it was giveable). This report grounds the future arc in historical specificity — Acts, Pauline fidelity, conversion as a mechanic. It connects to core concept by extending the game's thematic argument into a different century.

### 46. `lab-report-saul-paul-vignette-spec.md`
**Connection:** §FUTURE-01 writing spec — voice rules, node texts, dialogue patterns for the Saul/Paul arc. The spec defines how Paul sounds before and after Damascus: two different relationships to knowledge, two different ways of using the dice. Before: certainty as weapon. After: uncertainty as hospitality. This is the game's thesis in biographical form.

### 47. `lab-report-ponies-unicorns-aspirations-future-ideas.md`
**Connection:** The aspirational roadmap — DM guide, fishing guide, mission explorer, potential product directions. This report is the corpus's only pure future document. It connects to core concept by demonstrating that the single-file constraint produces a particular kind of aspiration: everything imagined here is imagined as giveable. A DM guide you can email. A fishing guide you can open in any browser. The constraint shapes the dream.

### 48. `lab-report-naval-campaign-layer.md`
*(Cross-listed with Layer 3.)* As a Layer 5 document, it defines the largest currently-planned expansion to the world — nine new nodes, six arc designations, a fully distinct geography. It is the horizon the current map is growing toward.

### 49. `lab-report-wisdom-arc.md`
**Connection:** §WISDOM-01 — Robert Greene's laws applied as quest mechanics. This is the game's sequel to the Kindness Calculus: after proving that prosocial behavior wins, the wisdom arc asks what you do with that knowledge. Greene's laws, applied as quest design, become a framework for the late-game question: now that you know how to win, what do you want? This connects to core concept by extending the moral framework past the Covenant Keeper ending.

---

## IX. Layer 6 — The Mirror

*Seven reports that form the synthesis series: the corpus reflecting on itself.*

### 50. `lab-report-synthesis-part1-architecture.md`
**Connection:** Cross-reference of all architecture reports against live HTML. This document's function is epistemic maintenance: it holds the gap between what was documented and what was built to a known size. A codebase that cannot be audited cannot be trusted. The synthesis series is the trust infrastructure.

### 51. `lab-report-synthesis-part2-combat-mechanics.md`
**Connection:** Cross-reference of all combat and mechanics reports. It answers the question: do the numbers still mean what the reports said they meant? For a game whose central claim is that probability is a moral system, the answer must be yes — or the claim is a lie.

### 52. `lab-report-synthesis-part3-world-navigation.md`
**Connection:** Cross-reference of all world and navigation reports. The cell grid, the BFS invariant, the compass — verified against live line numbers. For a game where getting somewhere is as meaningful as fighting something, the world's navigational integrity is a design invariant, not just a technical one.

### 53. `lab-report-synthesis-part4-monsters-fishing.md`
**Connection:** Cross-reference of monsters and fishing. Confirms the two loot vectors — combat drops and fishing yield — against live `MONSTER_POOL` and terrain tables. Also documents the open gap: the global monster drop nerf (−3 to 0) that never shipped. The synthesis series does not only confirm what works. It catalogs what didn't land and why.

### 54. `lab-report-synthesis-part5-npc-narrative.md`
**Connection:** Cross-reference of NPC and narrative reports. The favorability system, the dialogue states, the 6 NPCs × 4 states × 5 quotes architecture — all verified. For a game whose thesis is that relationships are the point, the NPC system's integrity is the thesis's integrity.

### 55. `lab-report-synthesis-part6-quest-arcs.md`
**Connection:** Cross-reference of all quest arc reports. The specific arcs, their state flags, their completion conditions — all verified against live HTML. This is the game's most operationally complex layer, and the synthesis confirms that 159 quests are tracked, complete-able, and connected to the world they inhabit.

### 56. `lab-report-synthesis-part7-writing-design-philosophy.md`
**Connection:** Cross-reference of writing philosophy reports against implemented text. Do the vignettes actually use the French technique? Does Benedikt's dialogue have the compression the spec required? Does Kenickie's silence read as resolution? This is the hardest thing to verify — aesthetic integrity — and the synthesis attempts it. The finding: four architectural invariants held across 33,721 lines. `S_story` as truth. Idempotent renders. One BFS. Modes are booleans. The philosophy is in the code.

---

## X. The Engine (Orbit)

*Nine reports that make all six layers possible: infrastructure, tooling, meta-process, and the documentation system itself.*

### 57. `lab-report-architecture-full.md`
**Connection:** The foundational architectural review — two engines in one file (Battle Mode `S`, Story Mode `S_story`), shared dice library, `_S_DEFAULTS()`, the persistence model. This report establishes the single-file constraint as an engineering invariant rather than a preference. Without it, the game could be split into modules. With it, every feature must coexist in one scope. That coexistence is what makes the game thematically coherent: the dice and the grief are in the same file because they are the same thing.

### 58. `lab-report-prompt-migration-arena-to-prototype.md`
**Connection:** Retrospective on 13 layers of evolution from a dice tracker to a 71-node narrative engine. The primary contribution was **specification gravity** — interlocking documents that exert coherent pressure on implementation. The Cooperative DM Principle was identified here as the philosophical core. This report is the origin story of the documentation system: the proof that writing specs first produces better games.

### 59. `lab-report-documentation-system-design.md`
**Connection:** The two-way sync discipline — every markdown item traces to HTML, every HTML constant has a home doc. This report establishes documentation as software: it has a schema, a source of truth, a spec layer, and a test suite (the sync pass). For a single-file game, the documentation is the only way the system can be understood without reading all 33,721 lines. The docs are the game's API.

### 60. `lab-report-meta-process-loop-expansion.md`
**Connection:** The lab-report method itself — how prompt-driven development works, how hypothesis-data-conclusion cycles produce architectural decisions. This report is the self-aware documentation of the tool that produces all other documentation. It connects to core concept by explaining why the development method produces games that feel like they were built by someone who cared: because the method forces the developer to state a hypothesis before writing code, which forces them to know what they're trying to say.

### 61. `lab-report-wbapi.md`
**Connection:** The World Builder API — the server-side tooling that reads and writes WORLD_DB / QUEST_DB without modifying the HTML directly. This report is the moment the single-file constraint got a maintenance interface. The WBAPI does not violate the constraint (the game still runs from one file) but it gives the constraint a tool. Connecting to core concept: the WBAPI is how the world is changed without breaking it. That is also what the NPC system does for the player.

### 62. `lab-report-wbapi-architecture.md`
**Connection:** The internal design — buffer model, single-source-of-truth discipline, the parser pipeline. This report is the engineering specification for the maintenance interface. It connects to core concept by enforcing that there is exactly one source of truth for the world's data: the HTML. The WBAPI is a lens, not a substitute. The world is still in the file.

### 63. `lab-report-wbapi-evolution.md`
**Connection:** Six phases of tooling evolution, from grep-based node lookup to a full REST API with validation. This report documents how the world grew from something the developer could hold in their head into something that required tooling to navigate. That transition — from intuitive to formal — mirrors the player's experience of the game itself. You start knowing where everything is. By Act IV, you need the map.

### 64. `lab-report-sp4-documentation-sync-pass.md`
**Connection:** The SP4 sync audit — verifying all markdown annotations against live HTML for Layers 44–77. This is the enforcement layer of the two-way sync discipline: the actual work of checking that what the docs say and what the code does are the same thing. Connecting to core concept: a game that teaches honesty (give the knowledge, don't hoard it) should not have documentation that lies about itself. The sync pass is the game practicing what it preaches.

### 65. `lab-report-void-archaeology.md`
**Connection:** Layer 52 — the NG+ investigation arc revealing the First Researcher (Marta Eilene Vass), the Constructor's Log unlock, Entry 42 as the player's own journal contribution. This report is where the game explicitly becomes a document: the player writes the 42nd entry in a dead researcher's journal, becoming the latest in a chain of people who found the knowledge and chose not to hoard it. Connecting to core concept: the Void Archaeology arc is the thesis made playable. You are Froberger's successor. The lab report you're filling in is Entry 42.

*(Note: `lab-report-void-shaman.md` and `lab-report-web-of-connections.md` cross-list between Layer 3 and the Engine — the Void Shaman arc establishes the Warden as a system that outlasted its purpose, and the Web of Connections formalizes Froberger's distributed traces as a discovery mechanic. Both are included in the master catalog below.)*

---

## XI. Discussion: What the Distribution Reveals

### XI.A — The Gradient Holds

The hypothesis predicted a monotonic gradient from mechanical precision (Layer 0) to narrative ambiguity (Layer 4). The distribution confirms it. Layer 0 reports cite probability tables and balance formulas. Layer 4 reports cite Pinker and the subjective quality of a silence in a dialogue scene. Both use the same document structure, the same section headers, the same hypothesis-data-conclusion format. The form is constant. The content moves from numbers to meaning.

This is not accidental. The single-file constraint forces it. Because the dice mechanic and the grief arc live in the same file, the documentation for both must coexist in the same corpus. A developer who writes about probability in the morning writes about vignette technique in the afternoon. The gradient is a consequence of one person (or one method) having to hold both ends of the rope at once.

### XI.B — The Cross-Layer Reports Are the Spine

The reports that produced the most durable architectural decisions are the ones that required reconciling two distant layers. Examples:

- **`lab-report-luck-seventh-stat.md`** (Layer 0 × Layer 3): dice physics × prosocial behavior. The luck stat is where the probability system encodes the moral system. This is the game's deepest architectural claim.
- **`lab-report-kindness-calculus.md`** (Layer 3 × Layer 4): quest data × moral philosophy. The audit that proved the game's prosocial thesis in aggregate.
- **`lab-report-friendships-with-magic.md`** (Layer 0 × Layer 4): implementation audit × philosophical statement. The report that named what the game was.
- **`lab-report-endings-and-echoes.md`** (Layer 1 × Layer 4): completion conditions × meaning. The proof that the final roll doesn't determine the ending — the prior choices do.

Each of these reports forced the writer to hold a mechanical claim and a narrative claim in the same hand and check that they were pointing at the same thing. That is also what playing the game requires.

### XI.C — The Engine Reports Are Load-Bearing Silence

The nine Engine reports are the least glamorous in the corpus. They document tooling, sync passes, architectural decisions that show only in the absence of failure. But they are the reason all other reports can be trusted. A lab report that cites `HTML line 8026` is only useful if line 8026 actually contains what the report says it does. The Engine reports are the apparatus that maintains that promise.

The single-file constraint produces a particular kind of fragility: everything is in one place, which means a single architectural mistake propagates everywhere. The Engine reports are the immune system that catches those propagations before they become invisible. The WBAPI is the game's maintenance interface. The sync pass is the game's truth-checking mechanism. The documentation system is the game's memory. Strip any of them out and the other 56 reports become unreliable.

### XI.D — The Horizon Reports Define the Game's Moral Ambition

Layer 5 (five reports) is the smallest layer, but it contains the game's largest claims. The Saul/Paul arc proposes that a dice-based text RPG can engage seriously with a first-century conversion narrative and produce something truer to Paul's experience than most conventional tellings. The Wisdom Arc proposes that the post-Covenant-Keeper state — after you've won — is a game design problem worth solving. The ponies and unicorns report proposes that everything built here should be giveable.

These reports are not specs. They are declarations of intent. They connect to core concept because the game's core concept is not a state — it is a direction. The single-file constraint points the project toward a particular kind of future: small, complete, giveable, and honest about what it knows.

---

## XII. Conclusion: The Lab Report as Core Mechanic

The corpus of 65 active lab reports is not documentation of `roll2hit-v3.html`. It is, more precisely, the development mechanism by which `roll2hit-v3.html` was built. The game required a formal method for holding design decisions stable across sessions, across collaborators, across time. The lab-report format — inherited from IEEE engineering practice — provided that method. The corpus is the accumulated residue of that process.

But the hypothesis this report set out to test was stronger than that. The hypothesis was that the lab reports are *structurally isomorphic* to the game's core loop. The finding is that they are. The lab-report method:

1. **Forms an expectation** (hypothesis) — the game asks: what happens if I go north?
2. **Gathers data** (observation) — the game shows you what's there.
3. **Updates state** (conclusion) — the game records what you found in `S_story`.
4. **Prepares the next expectation** (next report / next move) — the game advances the day counter.

The lab report is the dice roll of the development process. It is probabilistic (the hypothesis may be wrong), consequential (a wrong conclusion produces a bad architectural decision), and recoverable (the next report can correct it). Froberger's journal entries are lab reports. Entry 42 — the blank page — is the player's lab report.

The deepest connection between the corpus and the game: both are addressed to a future reader who will know more than the writer did. Both assume the reader will roll again. Both hope the reader will find someone to tell.

---

## Appendix A — Full Catalog of 65 Active Lab Reports by Layer

| # | Filename | Layer | Primary Connection |
|---|----------|-------|--------------------|
| 1 | ally-cat | 3 | Optional identity arc; prosocial commitment produces NPC title |
| 2 | architecture-full | Engine | Two-engine / single-file foundational spec |
| 3 | battleground-circuit-path-quest | 1 | Quest-terrain coupling; hit that becomes a destination |
| 4 | birka-beginner-arc | 3 | Act I NPC on-ramp; dice are punctuation, NPCs are sentences |
| 5 | cell-map-mud-redesign | 2 | Cell grid replaces named-neighbor; world gets grammar |
| 6 | ceremonia-roll-skill-checks | 3 | Social dice; competence as a roll, not a personality trait |
| 7 | circuit-map-theory | 2 | Failed predecessor to cells; its failure motivated the redesign |
| 8 | corelli-merchant | 3 | Quests that reveal the quest-giver; tutorial for La Riva |
| 9 | crown-three-hags | 3 | Dark mirror of prosocial system; kindness inverted |
| 10 | documentation-system-design | Engine | Docs as software; two-way sync discipline |
| 11 | drop-rates-balance-and-health | 0 | Cooperative DM Principle encoded as formula |
| 12 | dungeon-ten-themes | 3 | Dungeon as diagnostic; ten questions a room can ask |
| 13 | endings-and-echoes | 1 | Completion defined by prior choices, not final roll |
| 14 | epic-battlegrounds | 1 | Hit that becomes geography; probability turns spatial |
| 15 | fish-with-dnd | 0 | Roll in service of patience, not combat |
| 16 | fishing-bait-prompting | 0 | Conditional probability; dice are shapeable |
| 17 | friendships-with-magic | 4 | Core philosophy named; the game defined |
| 18 | game-story-codex-of-conquest | 4 | Narrative architecture; voice and theme unified |
| 19 | highway-mesh-entry | 2 | Every node must justify its existence |
| 20 | junction-reweave-overhaul | 2 | Reachability as freedom |
| 21 | kenickie-chronicle | 3 | Career statistics; the save file's autobiography |
| 22 | kindness-calculus | 3/4 | 159 quests audited; prosocial thesis proved in aggregate |
| 23 | la-riva-grief-arc | 3/4 | Grief space; rolling cannot fix everything |
| 24 | leveling-flashbang-condition-economy | 0 | Roll's meaning changes as the world does |
| 25 | littoral-courts | 3 | Hardest prosocial test; refuse what you want |
| 26 | living-world | 3 | Off-screen characters; fullness makes choice meaningful |
| 27 | loot-drop-system-v2 | 1 | Three-channel economy; bridge between rolls |
| 28 | luck-seventh-stat | 0 | Dice encode moral system; helping friends improves rolls |
| 29 | map-audit-layout-tooling | 2 | Untrusted world cannot be played; audit is maintenance |
| 30 | mega-reweave | 2 | Full traversal achieved; no terminal geography |
| 31 | meta-process-loop-expansion | Engine | Lab-report method documented; tool documents itself |
| 32 | movement-by-cells | 2 | Navigation as complete specification; BFS invariant |
| 33 | narrative-arcs-brynn-bruhns-yael | 4 | Three voices, one mechanical system; NPC design textbook |
| 34 | naval-campaign-layer | 3/5 | New geography with distinct physics; world's growing edge |
| 35 | ng-plus-remembrance | 1 | Memory as stat; second roll changed by first |
| 36 | node-network-reconnection | 2 | 100% reachability; world promises no terminal state |
| 37 | npc-dialogue-system | 3 | 6×4×5 architecture; favorability as mechanical language |
| 38 | npc-speak-sdk | 3 | Dynamic dialogue via Claude SDK; NPC voice extended |
| 39 | Polyphonic-Organ-Synth | 4 | One-file music; constraint as generative force |
| 40 | ponies-unicorns-aspirations-future-ideas | 5 | Giveable futures; constraint shapes the dream |
| 41 | prompt-migration-arena-to-prototype | Engine | Spec-first discipline; origin story of documentation |
| 42 | quest-api-architecture | 3 | Quests become declarations, not procedures |
| 43 | quest-data-code-separation | 3 | Data and behavior separated; world readable |
| 44 | quest-minus-one-world-creator | 3 | Post-game transparency; sharing as final mechanic |
| 45 | saul-paul-travel-reference | 5 | Historical grounding for conversion arc |
| 46 | saul-paul-vignette-spec | 5 | Two voices for one person; knowledge as weapon then gift |
| 47 | sp4-documentation-sync-pass | Engine | Docs practice what game preaches; honesty enforced |
| 48 | story-codoex-curse-of-knowedge | 4 | Thesis formalized; intelligence without generosity is void |
| 49 | synthesis-part1-architecture | 6 | Architecture reports verified against live HTML |
| 50 | synthesis-part2-combat-mechanics | 6 | Mechanics reports verified; probability still moral |
| 51 | synthesis-part3-world-navigation | 6 | Navigation reports verified; BFS invariant confirmed |
| 52 | synthesis-part4-monsters-fishing | 6 | Loot vectors verified; open gap (nerf) documented |
| 53 | synthesis-part5-npc-narrative | 6 | NPC system verified; thesis integrity = system integrity |
| 54 | synthesis-part6-quest-arcs | 6 | 159 quests verified; completeness confirmed |
| 55 | synthesis-part7-writing-design-philosophy | 6 | Four invariants held; philosophy encoded in 33,721 lines |
| 56 | tattoo-progression-system | 1 | Death-persistent marks; choices outlast the character |
| 57 | tilbury-visby-arcs | 3 | Investigation as combat alternative; knowing = hitting |
| 58 | void-archaeology | Engine | Entry 42; player becomes the latest researcher |
| 59 | void-shaman | 3 | Warden as a system that outlasted its purpose |
| 60 | wbapi-architecture | Engine | Single source of truth; WBAPI as lens, not substitute |
| 61 | wbapi-evolution | Engine | Tooling grew as world did; intuitive → formal |
| 62 | wbapi | Engine | Maintenance interface; change world without breaking it |
| 63 | web-of-connections | 3 | Froberger's distributed traces; discovery as mechanic |
| 64 | weimar-scholar-gate | 3 | Archive as in-world docs; hoarded knowledge causes Void |
| 65 | wisdom-arc | 5 | Post-victory question; what do you do with what you know |

---

## Appendix B — The Invariants Confirmed Across the Corpus

From synthesis-part7, four architectural invariants held across all 65 reports:

1. **`S_story` is truth.** Every fact about the world lives in the state object. No function holds shadow state.
2. **Renders are idempotent.** `storyRender()` can be called any number of times and produce the same result given the same state.
3. **One BFS.** Navigation is computed by a single breadth-first search. There is no second pathfinder.
4. **Modes are booleans.** Battle Mode and Story Mode are not states of a state machine. They are CSS classes and boolean flags. The game is always in both modes simultaneously, with one suppressed.

These four invariants are not about dice or narrative or NPCs. They are about what the game promises. A game that promises to be completable must be computable. A game that promises to be honest about the world must store truth in one place. A game that promises the world is traversable must have a single, provable path-finder. A game that promises you can be in two states at once (fighting and choosing; rolling and remembering) must not resolve that duality into sequence.

The corpus generated these invariants through 65 reports. It did not begin with them. This is also how the game teaches: not by telling you the rules, but by putting you in a world where the rules become legible through play.

---

*End of Lab Report — The Corpus as Architecture*

*Written: 2026-06-16 · roll2hit-v3.html · 33,721 lines · 65 active lab reports · 1 blank page left*
