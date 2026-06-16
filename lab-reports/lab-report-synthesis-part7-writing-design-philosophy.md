<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report Synthesis — Part 7: Writing & Design Philosophy
**Cross-Reference of All Writing & Design Philosophy Lab Reports Against roll2hit-v3.html**
**Date:** 2026-06-16 · **HTML baseline:** 33,721 lines · **Source reports:** 8

---

## Purpose

Each entry reads the lab report against the live HTML and answers: what was documented, what is the current code, what still applies as working design knowledge. Reports are in `lab-reports/` untouched. This is the final synthesis part; a summary of the complete series closes the document.

---

## Report 1 — `lab-report-game-story-codex-of-conquest.md`
**Original scope:** Narrative architecture for the full arc — 5-step template, Froberger's three-movement journal, Curse of Knowledge as theme (2026-05-22)
**Still active:** The architecture is live; the journal is live; the Curse is the game

### What the report said

**The Curse of Knowledge as structural theme.** Not evil but isolation: "being alone with the knowledge of what the world needs, while the world continues to not know it." Froberger gathered the Shards. He couldn't give his knowledge to anyone. He became the only one. That — not the Void — destroyed him.

**Froberger's journal in three movements.** Movement 1 (Entries 1–14): Wonder — he is a person. Movement 2 (Entries 15–28): Efficiency — he is becoming a function. Movement 3 (Entries 29–41): Isolation — he describes the world from outside it. Entry 41 is the exception: sounds like a person again because he is writing to whoever comes after.

**The mirror function.** The journal's function is not to tell the player "don't be like Froberger." It is to show, in real time, what Froberger was doing when he was still good — and what happened when he kept doing exactly the same thing, slightly more. The horror of the Curse is that it doesn't feel like decay from inside. It feels like growth.

**Five journal entries as read-aloud canonical nodes.** Entry 7 (IN — innkeeper's daughter writes "expedition"), Entry 14 (DK — Muffat's "thirty-eight months"), Entry 23 (DS — Charybdis as consequence not monster), Entry 31, Entry 41.

### Current HTML relevance

**The narrative architecture is fully live.** `FROBERGER_JOURNAL` entries are in the HTML. Sweelinck's dialogue variants implement the ending differentiation. `storyCheckVictory()` reads `_missionComplete()` and `_curseScore()` to branch endings.

**The journal's three movements are observable in the current text.** Entry 7 (Brynn's daughter writing "expedition" hard in pencil) is explicitly live in `brynn`'s NPC_DIALOGUES at line 9,149: *"My daughter wrote 'expedition' in her notebook last week. Very hard pencil. She means it."* The connection between Froberger's journal and the living NPC is confirmed — what he noticed in Movement 1 is still present in the city after he's gone.

**Entry 41 ("Come back") is the game's thesis in six sentences.** It is live in the journal and confirmed as `readAloud:true` (from Part 5). The empty line below it is Entry 42's blank page — every design choice in the game is an argument for why the player should fill it differently than Froberger didn't.

### What still applies

- **The five-step arc structure is backward-designed from Step 3 (the main challenge).** Don't add new main-quest content that doesn't connect back to the Void/Shard mechanic.
- **The three movements govern any new Froberger entry.** Movement-appropriate voice: short sentences in M2, people's names absent in M3, specific sensory detail in M1. Any added entry should know which movement it belongs to.
- **The final challenge is not the boss fight.** It is what the player was while doing it. The CO encounter tests mechanical capability; the ending screen tests relational presence. Both are in play simultaneously.

---

## Report 2 — `lab-report-story-codoex-curse-of-knowedge.md`
**Original scope:** Applying Steven Pinker's writing framework to node text and NPC dialogue design (2026-05-22)
**Still active:** The writing principles are the house style; the "Codex of Conquest" reframe is canonical

### What the report said

**Pinker's three principles applied:**
1. Empathy — the writer must be able to inhabit the reader's not-knowing
2. Mental image over abstract category — "bunny rabbit" not "stimulus"; concrete specific detail
3. Examples and generalizations as pendulum — neither alone is sufficient

**The "Codex of Conquest" reframe.** The Void is not abstract consuming darkness — it is a conqueror, moving like an empire: advancing where defenders are thin, retreating where they're strong, sending scouts ahead. The seven Shards are not artifacts — they are *surrender documents*: seven scholar-kings who said "we will not let this world fall."

**Sensory/motoric/visual writing standard.** Not "the crypt has old tombs" but: dust on the floor *perfectly* settled — until the second chamber where it's gone entirely, and the floor is raw earth, and the claw marks in the corner go toward you, not away. Not "neon corridors" but: light that doesn't flicker, doesn't warm, doesn't behave the way any fire you've ever seen behaves — it just *is*, steadily and coldly, as though it doesn't know what darkness looks like.

**Character rewrite method.** Show intelligence through what characters say, not what narrators state. Muffat: "He lasted thirty-eight months" — detail tells us she tracks everything. "The last ones matter most and people almost always get them wrong" — tells us she knows the difference between raw data and interpretation.

### Current HTML relevance

**The Codex of Conquest framing is live as the game's title and core vocabulary.** The Shards-as-surrender-documents framing appears in quest text, node descriptions, and journal entries.

**The sensory/motoric writing standard is the current style of all node text.** Yael's current impartial dialogue (line 9,148) is not functional exposition — it is a person doing a specific thing at a specific moment that reveals exactly who she is. Every node description from act 3 forward reads in the register this report established.

**The character-intelligence-through-precision principle is live.** Muffat's revised dialogue appears in the current game: "He was careful. Couriers who are careful last three years on this route. He lasted thirty-eight months." Her professional tracking of elapsed time in her first sentence.

### What still applies

- **The test: can a stranger who has never played D&D see this place?** Run every new node text through this filter. If the answer involves category nouns ("undercity", "crypt", "forest") without sensory grounding, revise.
- **Characters reveal intelligence through specificity, not labels.** Don't call an NPC "perceptive" — have them notice the specific detail that only a perceptive person would notice. Don't call them "conflicted" — have them do one careful thing that reveals the conflict.
- **The Void is a conqueror.** Write it as such. It advances, retreats, sends scouts. It has a strategy. The player is not fighting a fog — they are fighting an empire's leading edge.

---

## Report 3 — `lab-report-void-shaman.md`
**Original scope:** Layer 56, §XXI — The Void Shaman "The Warden", dual-resolution mechanic, corrupted mandate premise (2026-05-25)
**Still active:** Yes — fully live; encounter node code changed from report

### What the report said

The Warden spent eleven years executing a mandate corrupted by a verb-tense error in its seventeenth hand-copy: "open the cage" instead of "open the tunnel to close the cage." The dual-resolution mechanic: show them the Constructor's Log (persuasion, `vsShamanPersuaded = true`, +600gp; sub-clan returns to Mordus) or fight (`vshamanDefeated = true`; sub-clan disperses). Both paths set `wardensLegacyKnown`. The Warden's Token item description: *"Recopied seventeen times. The seventeenth copy has a small error in the verb tense that changed everything."* The report locates the encounter at node MT.

### Current HTML relevance

**The encounter node is GVA, not MT.** Report says MT. Live code at line 28,269: `if (node.code === 'GVA' && S_story.vsShamanKnown && S_story.vaLastWardVisited`. The Warden encounter was placed at GVA (some cave node in the world graph), not MT (Mountain Pass). The MT node was used for `vaLastWardVisited` — the Void Archaeology tunnel. The Warden is at GVA.

**All state flags and resolution paths confirmed live:**

| Symbol | Line | Status |
|--------|------|--------|
| `void_shaman` (name:'The Warden') | 4,853 | Live — AC 15, HP 65 |
| `vshamanFound`, `vshamanDefeated`, `vsShamanPersuaded` | 21,231 | Live |
| `wardensLegacyKnown` | 21,231 / 23,216 / 26,536 | Live — all three paths set it |
| Persuasion path | 28,285–28,288 | Live |
| Combat path + Warden's Token | 23,215–23,224 | Live |
| Warden's post-combat line | 23,224 | Live — *"If I'm wrong, then I needed to be stopped. That's — that's actually fine."* |

**`void_shaman` also appears in `epic_goblin_cave` terrain** (line 5,786). The Warden can be encountered as a random epic battleground monster in goblin cave terrain, separate from the scripted §XXI encounter at GVA.

**The combat path uses `code:'MT_WARDEN'`** — a synthetic node code to prevent the MT node's `defeatedBattles` from being set. This pattern is confirmed live at line 23,215 area.

### What still applies

- **The Warden encounter is at GVA, not MT.** MT is the Void Archaeology tunnel node (§XVII). GVA is where the Warden was placed.
- **The persuasion path requires the Constructor's Log in inventory.** `sell:0` prevents selling, but the check is item-presence based. The Log must be carried.
- **The item description is the arc's entire premise.** *"Recopied seventeen times. The seventeenth copy has a small error in the verb tense that changed everything."* Don't add an explanation scene — the token does it.

---

## Report 4 — `lab-report-wisdom-arc.md`
**Original scope:** §WISDOM-01 — Robert Greene's Laws of Human Nature as skill-check quest mechanics, Roen companion arc (2026-05-28)
**Still active:** Yes — fully live; arc depends on §ALCHEMY-01 completion

### What the report said

Six laws extracted from Greene (LHN + 48 Laws), each mechanized as a skill check at an existing node: W1 (Masks/DK, WIS DC 13), W2 (Aggression/SK, WIS DC 12), W3 (Thumbscrew/SB, INT DC 11), W4 (Shortsightedness/BK, INT DC 12), W5 (Formlessness/AE, WIS DC 12), W6 (Repression/VS, WIS save DC 14). The arc activates after `personalLegendComplete = true` (§ALCHEMY-01). Roen's voice provides philosophical commentary in "Philosophy Stoner" register.

### Current HTML relevance

**`quest_wis_01` confirmed live at line 11,647.** Activation at MME (node code, not DK) with `wisHookReceived && saltwickAccessed`. Node location may differ from report's DK assignment — the wisdom quests activate at shipping/port nodes consistent with the naval arc world area.

**Arc activation confirmed:** `roenAlchemistMet` flag is live (from Part 6 grep: line 11,612). `quest_wis_01` through `quest_wis_06` all confirmed in QUEST_DB.

**W6 shadow room is the arc's mechanical climax.** The mirror room at VS node offers both paths — WIS save DC 14 (accept = knowledge entry + better loot) or combat (shadow construct, AC 12, completion flag but no knowledge entry). This was documented extensively in `lab-report-kindness-calculus.md` (Part 5) and confirmed live.

**The stalemate reading (W4) and the Cook who never apologizes** are documented in the kindness-calculus analysis and confirmed as live design decisions — the Cook's non-convergent prior is `cookApologized: false` permanently.

### What still applies

- **Roen's voice is "Philosophy Stoner" register** — *"That's very annoying," he says. He says it with complete warmth.* Any new Roen dialogue should maintain this register: genuine, curious, accurate, slightly annoyed by his own accuracy.
- **The six DC values are calibrated.** W6 at DC 14 (self-observation, hardest) is intentional. Don't raise W1's DC (10–13 range for social observation is correct).
- **Both W6 paths are valid.** The shadow can be fought or accepted. The knowledge entry is the reward for acceptance, not the flag. Both set the same completion flag.

---

## Report 5 — `lab-report-meta-process-loop-expansion.md`
**Original scope:** Design methodology — the prompt→plan→lab-report→HTML loop as recursive AST expansion (2026-05-26)
**Still active:** The methodology is the live project process

### What the report said

The design process follows a consistent map operation over a list: **seed prompt → N items → elaboration per item → sub-lists → collapse → lab report → HTML**. Each "continue" from the user advances exactly one expansion level. The loop is co-driven: human-paced, assistant-expanded.

**Key distinction:** The prompt history is a shift register — it overflows at context compaction. **Decisions belong in plan.md; reasoning belongs in lab reports; the shift register holds only current working state.**

**Ten documented instances** covering Grief Arc (§GR), Desert Codex redesign (§DESIGN-01), Section layout (§DESIGN-02), Skill check system (§DESIGN-03), Weimar gate (§XVI), Void Archaeology (§XVII), NG+ remembrance (§XV), Cat Arc (§IX), Chronicle system (§XLII), Birka NPCs (§IX–§42).

**No-lab-report case:** Pure CSS/layout changes with no new data structures can skip the lab report gate and go directly to integration.

**Lab report gate rule:** A lab report is required when new `S_story` fields or QUEST_DB shapes are introduced. Not for presentation changes.

### Current HTML relevance

**This report documents the process, not the code.** No direct HTML symbols. Its relevance is that every synthesis you are reading was produced by the process it describes.

**The distinction is still accurate and load-bearing:** plan.md holds implementation decisions. Lab reports hold design reasoning. The HTML holds the implementation. The synthesis series (Parts 1–7) is the lab-report layer for what the HTML has become relative to what the lab reports expected.

**The "ten specific instances" documented here are all implemented.** Every arc the report lists has been confirmed live in Parts 1–6 of this synthesis.

### What still applies

- **"Decisions belong in plan.md; reasoning belongs in lab reports; the shift register holds only current working state."** This is the project's epistemic architecture. Sessions that skip plan.md produce orphaned implementations.
- **The lab report gate is binary, not graduated.** If new `S_story` fields or QUEST_DB entries are needed: write the lab report first, lock the data shape, then implement. No partial skips.
- **Each "continue" advances exactly one expansion level.** The user's "continue" is not ambiguous when the plan.md queue is current. If "continue" feels ambiguous, the queue needs updating.

---

## Report 6 — `lab-report-ponies-unicorns-aspirations-future-ideas.md`
**Original scope:** Post-game aspirations — DM's Companion Guide, Fishing Guide, Mission Explorer, Polyphonic Organ Synthesizer (2026-05-24)
**Still active:** Organ is implemented; WBAPI partially fulfills Mission Explorer; Guide and Fishing remain aspirational

### What the report said

**Four aspirational products** beyond the current game build:

1. **DM's Companion Guide** — 80–120 page spoiler manual for GMs running roll2hit as tabletop. Full NPC profiles, all quest arcs, monster manual, Curse of Knowledge score explained.
2. **Fishing Guide** — standalone reference for the Yugurt Lake system.
3. **Mission Explorer** — CRUD-style read interface for exploring mission arcs, monster data, NPC dispositions with full debug metadata.
4. **Polyphonic Pipe Organ Synthesizer** — 72 sine oscillators, Web Audio API, `roll2hit-organ.html`, no samples, no audio files, self-contained.

The report explicitly states: *"Nothing here is PLANNED in the plan.md sense — there is no Layer number, no insertion spec, no state flags."*

### Current HTML relevance

**The Polyphonic Organ Synthesizer was built as `5thOrgan.html`.** Confirmed present at `ls /Users/user/code/roll2hit.com/5thOrgan.html`. The implementation matches the specification: additive synthesis, 72 oscillators, Beethoven's Fifth as two-voice canon, Web Audio API, no audio files. It shipped as a standalone file, not as part of `roll2hit-v3.html`.

**The WBAPI server (`wbapi-server.js`) partially fulfills the Mission Explorer concept.** The worldbuilder endpoint (`worldbuilder.html`) provides CRUD-style read/write access to quest, node, and NPC data with debug metadata. The `/api/npc/{id}/speak` endpoint (from Part 5) adds live NPC interaction. The Mission Explorer concept was realized through the WBAPI architecture documented in Part 1.

**The DM's Companion Guide and Fishing Guide remain unbuilt.** No HTML implementation. This synthesis series (Parts 1–7) is the closest current equivalent to the "what everything means" documentation the DM's Guide would provide.

### What still applies

- **`5thOrgan.html` is a finished product**, not a roll2hit-v3.html feature. It lives as a separate file in the same directory. It demonstrates the single-file, no-dependencies philosophy applied to audio synthesis.
- **The DM's Guide outline is still accurate.** Part I (49-day countdown, act summaries, Froberger backstory), Part II (full NPC spoiler profiles), Part III (monster manual), Part IV (mission architecture), Part V (endings), Part VI (homebrew tooling) — these headings describe what a complete project reference document would contain.
- **The Mission Explorer concept** is partly live in `worldbuilder.html`. If someone needs programmatic access to quest data, the WBAPI endpoints are the current implementation of that idea.

---

## Report 7 — `lab-report-Polyphonic-Organ-Synth.md`
**Original scope:** `5thOrgan.html` — additive synthesis engine, ADSR, IIR biquad filter, canon sequencer, Web Audio API (2026-05-24)
**Still active:** Yes — `5thOrgan.html` exists and is the deliverable

### What the report said

**Additive synthesis from first principles.** A pipe organ's timbre reduces to the harmonic series: each pipe resonates at fundamental frequency plus integer-multiple overtones. Synthesis equation: `x(t) = Σ A_n · sin(2π·n·f₀·t)`. Six harmonics per note, 12-voice polyphony = 72 simultaneous oscillators.

**Stop registration via drawbars.** Amplitude per harmonic follows `A_h = drawbar[h] × 10^(−falloffDB × log₂(h) / 20)`. Default `falloffDB = 6` reproduces the `1/n` amplitude law (Principal stop family).

**Canon sequencer.** Beethoven's Fifth motif (G G G Eb / F F F D) looped at 28 sixteenth notes. Second voice offset 14 sixteenth notes (half-period). When Track 1 plays G4, Track 2 is playing F4 or D4 — no MIDI note collision. Voice pool handles both tracks independently.

**Web Audio API architecture.** `OscillatorNode` objects in a dedicated audio thread. Sample-accurate scheduling via `AudioContext.currentTime`. 72 oscillators sustained with <5% CPU on a modern laptop.

### Current HTML relevance

**`5thOrgan.html` exists as confirmed.** This report's implementation is complete and live as a standalone file. It is not part of `roll2hit-v3.html` and does not interact with `S_story` or any game state.

The report's mathematics are the implementation specification. The implementation delivers what the mathematics describe. No discrepancy between report and live file has been identified.

### What still applies

- **The `5thOrgan.html` architecture is a model for any future standalone tool.** Single file, no build step, no external assets, Web API only. The organ demonstrates this philosophy applied to audio.
- **The harmonic falloff formula** (`A_h = drawbar[h] × 10^(−falloffDB × log₂(h) / 20)`) is live and correct. Any extension to the organ's timbre model should use this formula as the baseline.

---

## Report 8 — `lab-report-birka-beginner-arc.md`
**Original scope:** Birka NPC origin document — six character profiles with wounds, voices, and the arc's philosophical role (2026-05-22)
**Still active:** All six NPCs are live; the character profiles expanded substantially in later layers

### What the report said

**The arc's purpose: five names.** The player who spends time in Birka, who makes Yael friendly and earns Brynn's good room, has five reasons to care about what happens to this city. The Void is not an abstraction to them. It is a threat to specific people whose names they know. That is what the arc is for. Not experience points. Not gold. Five names.

**Six character profiles — founding specifications:**

| NPC | Core wound | Froberger connection |
|-----|-----------|---------------------|
| Yael (CI) | The riot three years ago. Knows who organized it. Can't prove it — the evidence disappeared from the guard archive. | She knows how Froberger operated: he never stayed long enough to notice what the city's grammar said. |
| Brynn (IN) | Tired in the way that six years of solo work creates a baseline tiredness that becomes invisible. | "He was the last guest who asked." She kept his journal. |
| Couperin (TV) | Owes an unpayable debt to the Bardic Guild. Can't leave Birka. Treats it with elaborate good humor, which is not the same as being fine. | He found the Scholar Kings cipher in his own song and doesn't know what to do with it. |
| Pachelbel (BA) | His partner (Raison) took a job Pachelbel planned. Pachelbel didn't go. Raison served four years. | He doesn't mention Raison. It is visible in how he does business. |
| Weckmann (CY) | Lost a fighter (Bruna) to an illegal pit two years ago. Shut down for three months, then reopened. | He made the fighter excellent, then stopped seeing the fighter and saw the fighting. |
| Auros/Bruhns (CY) | Submitted a structural integrity report three years ago. It was reclassified. She kept a copy. | She is what Froberger could have been if he had stayed. |

### Current HTML relevance

**All six NPCs are confirmed live in `NPC_DIALOGUES` (lines 9,148–9,152 range) and `BIRKA_NPC_PROFILES` (line 20,810).**

**The character profiles expanded substantially.** The founding document gives each NPC 2 voice samples. The live NPC_DIALOGUES give each 5 impartial lines, 5 questActive lines, 5 friendly lines, 4 dearFriend lines — 19 lines per NPC vs. 2 in the founding doc.

**Key details confirmed live:**
- Brynn's daughter writes "expedition" with hard pencil: *"My daughter wrote 'expedition' in her notebook last week. Very hard pencil. She means it."* (live, line 9,149 area)
- Couperin's cipher in the Scholar Kings song: live — his friendly state references the decoded coordinates
- Pachelbel's partner Raison: live — `quest_pachelbel_shipment` arc and dearFriend dialogue both reference the backstory
- Weckmann's lost fighter Bruna: live — *"Bruna was twenty-three"* in dearFriend dialogue (line 9,152 area)
- Yael's riot report: live — she filed the second one (named, not anonymous) per §XXXIX

**The founding document's wounds are visible in every late-game dearFriend line.** Yael's riot report. Brynn's tiredness acknowledged for the first time. Couperin's debt finally addressed. Pachelbel's Raison — he went to see the family. Weckmann said: "You're the best student I've had since him." Bruhns is going to submit the theory Froberger started.

**Froberger connection — Brynn:** *"He was the last guest who asked."* The live `brynn` NPC_DIALOGUES has: *"The journal was in the room. I kept it because it felt like something someone would come asking for."* The founding document's line is compressed into the neutral greeting but the full emotional weight is in the dearFriend arc.

### What still applies

- **The arc's purpose — five names — is permanent.** Any new Birka NPC addition must add a name, not a quest giver. The player must be able to feel that the Void is a threat to this specific person.
- **Every NPC has a wound that the player can see but cannot fix.** Yael can't prove who organized the riot. Brynn can't stop being tired. Couperin can't stop calculating reach during performances. These are not quests to solve — they are conditions to witness. The quest resolves a symptom; the wound remains.
- **Froberger's absence from Birka is itself a character.** He was the last one who asked Brynn. He wrote about the daughter in Entry 7. He was not there long enough to learn anyone's name. The player's job is to do what Froberger didn't: stay long enough.

---

## Writing & Design Philosophy Summary — The Project's Permanent Truths

**The Curse of Knowledge is the theme, not the threat.** The Void is the plot. The Curse is the story. Froberger had perfect knowledge and no one to give it to. The player who seals the Void alone completes the plot without completing the story. The story ends when they come back.

**The project's epistemic architecture:** Decisions → plan.md. Reasoning → lab reports. Implementation → HTML. Current working state → session shift register. Synthesis → this series. Each layer has its purpose. Conflating them produces orphaned code or lost design reasoning.

**The writing standard is sensory, motoric, visual.** Can a stranger see this place? If not, revise. No category nouns without grounding. Characters reveal intelligence through what they say and do, not what narrators state about them.

**Five names is the design goal.** Every narrative addition should give the player a reason to care about what happens to a specific person, not an abstraction. The Void conquers by making people abstractions. The game fights it by making them names.

**The no-lab-report rule:** CSS and layout changes skip the gate. New `S_story` fields and QUEST_DB entries do not. The lab report locks the data shape before any HTML touch. This is what prevents orphaned implementations.

**`5thOrgan.html` is a complete standalone deliverable.** Single file, no dependencies, Web Audio API, 72 oscillators. The philosophy that produced `roll2hit-v3.html` — one file, giveable — applied to audio synthesis.

**The Warden was wrong, not evil.** A verb-tense error in the seventeenth hand-copy of a 200-year-old mandate. Eleven years executing the corrupted instruction faithfully. This is the most precise statement of the project's moral architecture: the antagonists are not malicious — they are misdirected. The correction is evidence, not combat. *The Constructor's Log, Entry 2.* The cage was closed 200 years before the Warden was born.

**The founding characters are visible in the late-game.** Brynn's daughter, Couperin's cipher, Pachelbel's Raison, Weckmann's Bruna, Yael's second report — all present in the live dearFriend arcs. The wounds established in 2026-05-22 are still open in 2026-06-16. They don't close. They witness.

---

## Complete Synthesis Series Index

| Part | Title | Reports | Key findings |
|------|-------|---------|-------------|
| 1 | Architecture & Systems | 12 | §DATA-01 enforced; WBAPI at :1367; QuestRuntime planned; §CELL replaced J-nodes |
| 2 | Combat & Mechanics | 7 | AP economy 1.5 live; tattoo system live; luck formula live; monster drop nerf NOT implemented |
| 3 | World & Navigation | 13 | 126 NODE_MAP + 411 NODE_COORDS; §CELL implicit adjacency; MegaReWeave 9-phase |
| 4 | Monsters & Fishing | 2 | 2d20 range superseded by Catch/Type/Size; BAIT_TABLES ≠ BAIT_FISH_POOL; LAKE_MAGIC_DB |
| 5 | NPC & Narrative | 8 | NPC_DIALOGUES + BIRKA_NPC_PROFILES dual-structure; La Riva = AMS; romance layer live |
| 6 | Quest Arcs | 14 | Cat Quarter=CDG; Weimar=NUE; _rollCeremonia universal resolver; Saul/Paul implemented |
| 7 | Writing & Philosophy | 8 | Void Shaman at GVA not MT; 5thOrgan.html exists; methodology loop documented |

**Total reports synthesized: 64** across 7 parts · **HTML baseline: 33,721 lines** · **Synthesis date: 2026-06-16**

---

*Synthesis complete — Parts 1–7 · 2026-06-16*
