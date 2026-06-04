<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report: The Meta Lab-Report Process — Prompt Loop Expansion and Design Iteration

**Author:** Claude (Sonnet 4.6) + roll2hit.com design sessions  
**Date:** 2026-05-26  
**Classification:** Design Methodology / Process Engineering  
**Audience:** Electrical Engineering / Computer Science background; video game designer / programmer  

---

## Abstract

This report documents the meta-process by which `plan.md` and its associated lab reports evolve through iterative prompt sessions. The central observation is that the prompt–plan–lab-report pipeline is not a linear authoring process — it is a recursive unrolling loop in which each expansion pass produces a list of items, each of which becomes the seed for the next expansion pass. This document analyzes that loop structure, identifies ten specific instances of it in the roll2hit.com design history, and proposes efficiency improvements for future session design.

---

## I. The Core Loop: Prompt → Expansion → Lab Report → Integration

### 1.1 Formal description

The design process for *The Shattered Codex* follows a consistent pattern:

```
SEED PROMPT
   └─► [Parse] → List of N items
                      └─► [For each item] → Elaboration
                                                └─► [For each elaboration] → Sub-list
                                                                                  └─► ...
                                                [Collapse all passes] → Lab Report
                                                                              └─► [Integration] → HTML
```

Each stage is a **map operation over a list**. The list grows by a factor of approximately 3–10 per pass. A single seed prompt ("add skill checks") produces, over four passes: 1 mechanic spec → 5 state fields → 4 quest IDs → 15 vignette prose lines → 2 new sections of plan.md → 1 lab report gate → 1 HTML implementation sequence.

This is not unusual in software engineering — it resembles an **AST expansion** in compiler theory: a token is parsed into a tree, the tree is traversed depth-first, and each leaf is expanded before the traversal continues. The distinguishing feature here is that the **traversal is human-paced**: the user says "continue" between passes, and the assistant expands exactly one level per continue. The loop is explicit and co-driven.

### 1.2 Why this matters

The efficiency of the design process depends on knowing where in the traversal you are. In electrical engineering terms: the prompt history is a **shift register** — each new input shifts all prior context one position toward the overflow boundary. When the register overflows (context compaction), you lose the tail. The meta-question is: which design decisions belong in the shift register (session memory) vs. which belong in permanent storage (plan.md, lab reports, quest.md)?

The answer in this project: **decisions belong in plan.md; reasoning belongs in lab reports; the shift register holds only current working state.**

---

## II. Ten Specific Instances of the Loop

### Instance 1 — The Grief Arc Expansion (§GR, 2026-05-25)

**Seed:** "Add grief to the story."  
**First pass:** Corruption-grief chain identified (CY → CQ → FR). 3 characters specced (Connie, Aldo, Vincenzo).  
**Second pass:** Quest chain elaborated (Q-FR-01–03). Node FR specced (terrain, battle, NPCs).  
**Third pass:** Writing technique specced (§GR-F French vignette, 5 acts, object-named).  
**Lab report:** `lab-report-la-riva-grief-arc.md` — locked all data shapes before HTML edit.  
**Integration:** Layer 78. All state flags, NPC keys, and quest IDs from lab report appear verbatim in HTML.  

**Loop analysis:** Seed → 1 theme → 3 characters → 3 quests → 1 node → 1 writing technique → 1 lab report → Layer 78 HTML. Each "continue" expanded one list item at a time. Total expansion factor: ~1 → ~20 spec items → 1 HTML block.

---

### Instance 2 — The Desert Codex Redesign (§DESIGN-01, 2026-05-25/26)

**Seed:** "Redesign the theme to desert/Aztec."  
**First pass:** Color palette specced (8 variables). Rationale documented (Goethe/Itten contrast theory, simultaneous contrast, 1970s earth tones, Aztec codex parallel).  
**Second pass:** Layout redesigned (8 structural changes, 3-column → read-quest-act-navigate).  
**Third pass:** P1–P8 implementation phases defined.  
**Lab report:** None written (design was primarily CSS; no complex data shape decisions).  
**Integration:** P1–P8 all implemented 2026-05-26.

**Loop analysis:** This instance demonstrates the **no-lab-report case**: when the expansion produces only CSS values and layout changes (no new data structures, no complex state), the loop can skip the lab report gate and go directly to integration. The efficiency decision is: lab reports are required when new `S_story` fields or QUEST_DB shapes are introduced. They are not required for pure presentation changes.

---

### Instance 3 — The Section Layout (§DESIGN-02, 2026-05-26)

**Seed:** "Make the story mode layout purpose-driven with labeled sections."  
**First pass:** 5 section types identified (LOCATION / ENCOUNTER / STALK / SOCIAL / VENDOR).  
**Second pass:** Per-section render logic specced. `_mkSection()` and `_mkCard()` helper functions designed.  
**Third pass:** Hour tracking added (P2). Exhaustion threshold added (P3, critical bug fix: `battleDis` never applied to rolls).  
**Fourth pass:** Per-quest hunt buttons added (P4). `storyQuestHunt(id, forceKey)` signature specced.  
**Lab report:** Not written (section layout was a render pass, no new persisted state beyond `hoursSinceSlept`).  
**Integration:** P1–P4 all implemented 2026-05-26. P5 still spec-only.

**Loop analysis:** This instance demonstrates **incremental expansion with a bug discovery mid-pass**. P3 was specced as "add exhaustion warnings" but the integration pass revealed that `battleDis` had been displaying but not applying disadvantage. The lab report was not yet written — the bug was caught in the integration pass rather than the spec pass. **Lesson:** the lab report gate exists partly to force analysis of existing code before writing new code. A lab report for P3 would have caught the bug during spec.

---

### Instance 4 — The Romance Layer (§RESEARCH-01, 2026-05-25)

**Seed:** "Research Chrétien de Troyes and apply romance patterns to the game."  
**First pass:** 4 Arthurian romances summarized. Structural parallels to existing game arcs identified.  
**Second pass:** `ROMANCE_QUOTES` const designed (21 entries, 15% per sleep, Act III+).  
**Third pass:** `NPC_ROMANCE_PREAMBLES` and `NPC_ROMANCE_VIGNETTES` consts designed per NPC.  
**Fourth pass:** Quest disposition rewrites applied (all QUEST_DB descs + VOID_TIDE_EVENTS).  
**Lab report:** `lab-report-la-riva-grief-arc.md` incorporated the romance layer documentation.  
**Integration:** All romance consts implemented 2026-05-25 (prior session). Inn vignette delivery in `storyConfirmSleep()`.

**Loop analysis:** This instance demonstrates **theory-first expansion**: the research pass precedes the spec pass. The structural parallel table (romance → game arc) is the pivot point — it converts literary analysis into mechanical design decisions. The efficiency of this approach is high: 4 Arthurian arc summaries generate ~6 mechanical implementations in one research session.

---

### Instance 5 — The Cat Quarter Arc (§XLII, Layer 75–77, 2026-05-26)

**Seed:** "Add a Cat Quarter with a cat mob story arc."  
**First pass:** NPC faction specced (Jimmy, Sandy, Don Fluffissimo, Cat-King, Kenickie, Tommy).  
**Second pass:** Quest chain Q-CAT-01 through Q-CAT-06 + Q-CAT-VOID designed.  
**Third pass:** Monster keys designed (stray_alley_cat, fluffy_cat, beefy_tom, honcho_cat_m/f, taz_devil, fat_merchant_cat, the_cat_king, corrupted_cat).  
**Fourth pass:** Corruption chain from CY → CQ → FR identified and documented.  
**Lab report:** `lab-report-kenickie-chronicle.md`.  
**Integration:** Layer 75–77. 7 quests, 8+ monster keys, 3 NPCs, 1 new node.

**Loop analysis:** This is the canonical example of a **full depth-first traversal**: seed → NPCs → quests → monsters → lore → lab report → integration. Each level of the tree was expanded completely before moving to the next. The resulting HTML block was large enough that multiple "continue" passes were required at integration time.

---

### Instance 6 — The §DESIGN-03 Ceremonia Roll (2026-05-26)

**Seed:** "Add skill checks, a skill check quest type, romantic vignette quests."  
**First pass:** Ceremonia Roll formula specced (d20 + abilityMod + profBonus ≥ DC).  
**Second pass:** `type: 'skill_check'` QUEST_DB fields designed. `_rollCeremonia()` signature sketched.  
**Third pass:** 4 new Birka missions designed. XP awards assigned.  
**Fourth pass:** Yael Ceremonia Arc (5 acts, quest IDs 01–05, state flags).  
**Lab report gate:** §DESIGN-03-G — write `lab-report-ceremonia-roll-skill-checks.md` before P1.  
**Integration:** PLANNED.

**Loop analysis:** This instance is currently at the **lab report gate** — the expansion is complete but integration has not started. The gate enforces a deliberate pause. This is the correct behavior: the Ceremonia Roll introduces new `S_story` fields, a new QUEST_DB field type, and a new UI button in `storyRenderSections()`. All three touch existing systems. The lab report must verify no collisions before HTML edits begin.

---

### Instance 7 — The §DUNGEON-01 Ten Themes (2026-05-26)

**Seed:** "Analyze a D&D dungeon design transcript. Find 10 themes. Apply each to the game."  
**First pass:** 10 themes extracted. Each mapped to an existing game system (madness → CY, mimic sanctuary → new node MM, heart of dungeon → CO pre-boss, etc.).  
**Second pass:** Hero origin canon established. Loop reason defined. CY as madness hallucination specced.  
**Third pass:** Node MM specced (Mimic Meadows terrain, tribble mechanics, Animal Handling DCs).  
**Fourth pass:** 10 new state fields specced. 2 new nodes (MM, SW).  
**Lab report gate:** §DUNGEON-01-G.  
**Integration:** PLANNED.

**Loop analysis:** This instance demonstrates **theme-to-system mapping** as the first pass. The transcript provided 10 pre-named items; the design work was matching each to an appropriate game system. The efficiency of this approach is high: 10 pre-named inputs with clear descriptions reduce the first-pass cognitive load to a matching problem rather than an invention problem.

---

### Instance 8 — The §DUNGEON-02 Five-Act Quest Elaborations (2026-05-26)

**Seed:** "For each of the 10 dungeon themes, elaborate a 5-act Chrétien-style quest sequence."  
**First pass:** 5-act template established (Encounter → Test → Ordeal → Cost → Seal).  
**Second pass:** 10 quest sequences written in parallel (one per §DUNGEON-01 theme).  
**Third pass:** Framework document written (§D02-11) — design principles, DC tables, check type tables.  
**Fourth pass:** `quest.md` created as location-organized register.  
**Lab report gate:** Merged with §DUNGEON-01-G.  
**Integration:** PLANNED.

**Loop analysis:** This is the **parallel expansion case**: 10 items expanded simultaneously rather than sequentially. Each quest used the same 5-act template, so the expansion was O(N × template_size) rather than O(N²). The framework document (§D02-11) emerged from the pattern recognition across 10 parallel expansions — it could not have been written first because it required seeing the 10 cases to identify what was common.

---

### Instance 9 — The Documentation Sync Pass (SP4, 2026-05-25/26)

**Seed:** "Sync plan.md and story.md with the actual HTML."  
**First pass:** 20 stale PLANNED markers identified and resolved.  
**Second pass:** 94 consts annotated with `// → doc:` markers.  
**Third pass:** F4/F6 tables re-verified against WORLD_DB.  
**Fourth pass:** `#### Gate Locks` section added to story.md.  
**Lab report:** `lab-report-sp4-documentation-sync-pass.md`.  
**Integration:** N/A — this pass was documentation, not HTML.

**Loop analysis:** This instance demonstrates **reverse traversal**: instead of spec → HTML, it went HTML → spec (verifying the HTML against the docs). This is the audit pass. Its efficiency depends entirely on the quality of the forward-traversal documentation: well-annotated HTML (`// → doc:`) makes the audit O(N) scan; unannotated HTML makes it O(N²) search. The sync pass revealed 5 mismatched `// → doc:` targets — evidence of previous forward-traversal passes that lacked the annotation discipline.

---

### Instance 10 — The NG+ Remembrance Layer (§XV, Layer 50, 2026-05-25)

**Seed:** "Add NG+ memory lines — NPCs remember the player from previous runs."  
**First pass:** 6 NPC memory lines designed (`NPC_NG_MEMORY_LINES` const).  
**Second pass:** Entry 42 modal designed (textarea + write/blank buttons, fav gate, `ngPlusRun ≥ 1`).  
**Third pass:** Froberger's sealed letter at CO designed.  
**Fourth pass:** NG+ quest chain designed (`nexusQ01`/`nexusQ02`).  
**Fifth pass:** Fifth ending specced (Sweelinck question override: "What was inside the cage?").  
**Lab report:** `lab-report-ng-plus-remembrance.md`.  
**Integration:** Layer 50 implemented.

**Loop analysis:** This is the **depth-limited expansion case**: the seed prompt specified a constraint ("NG+ memory") that bounded the expansion. Five passes were needed, but each pass was constrained to the NG+ context. The depth limit prevented scope creep into the base-game systems. The lab report locked the data shapes (`npcKey → boolean`, `ngMemoryDelivered[key]`, `priorQuestMinusOne` preservation) before any HTML edit.

---

## III. Efficiency Analysis

### 3.1 Where the loop wastes time

| Waste source | Example | Fix |
|-------------|---------|-----|
| Expanding before context is clear | D02 expansion began before D01 was finalized | Use the lab report gate as a hard stop: no expansion until the prior level is locked |
| Speccing data shapes that will change | `S_story.skillCheckAttempts` field name changed twice during §DESIGN-03 | Name fields in the lab report, not in the planning pass. Field names in plan.md are aspirational; field names in lab reports are binding. |
| Parallel expansion without template | 10 quest sequences without §D02-11 framework | Write the framework first (one expansion pass), then apply it in parallel. Template-first expansion is O(N × template) not O(N²). |
| Over-documenting obvious CSS | §DESIGN-01 color theory section (~400 lines for 8 CSS variables) | Rationale is valuable; length is not. Compress theory sections to 50-word summaries + the table. |
| Re-reading already-read sections | Each session restarts cold; system-reminder blocks re-inject context | Memory files (`MEMORY.md`, `project_*.md`) reduce the cost of cold restarts. Write a memory entry after every major design decision. |

### 3.2 Where the loop works well

| Success pattern | Example |
|----------------|---------|
| Theory-first expansion | §RESEARCH-01 Chrétien analysis → romance mechanics in one session |
| Lab report as commitment device | §GR lab report locked all data shapes; Layer 78 integration was clean with no schema changes |
| Object-named vignettes | The French vignette technique produces consistent tone without per-instance style decisions |
| Parallel expansion with fixed template | §D02 10 quests all used the 5-act template; expansion was fast and output was uniform |
| Bug discovery at integration time | §DESIGN-02 P3 battleDis bug; caught before any user-facing harm |

### 3.3 The shift register problem

The prompt history is a finite-capacity shift register. When it overflows, earlier context is compacted. The design process compensates by writing every binding decision to a persistent file before it shifts out:

```
[Prompt Session N] → decisions → plan.md (persistent)
                              → lab report (persistent)
                              → HTML (persistent, via git)
                              → memory files (persistent, via MEMORY.md)

[Prompt Session N+1] → cold start → reads plan.md → continues from last gate
```

The cost of a cold start is proportional to the size of the persistent files. This is a space-time tradeoff: larger plan.md → cheaper cold start, more expensive scan. The optimization is **structured indexing**: `§0` dashboard + Lab Report Index + Memory files provide O(log N) access to the most recent decision state.

---

## IV. The Expanding Loop — Visual Model

```
INITIAL SEED
│
└─► Pass 1: Identify N items (N ≈ 3–10)
    │
    ├─► Item 1 → sub-list (M items)
    │           └─► each sub-item → elaboration
    │
    ├─► Item 2 → sub-list
    │   ...
    │
    └─► Item N → sub-list
                 │
                 └─► COLLAPSE all passes → Lab Report
                                            │
                                            └─► Integration → HTML
                                                              │
                                                              └─► Sync pass → plan.md update
                                                                              │
                                                                              └─► Next seed
```

At each level, the user's "continue" is the signal to descend one level deeper. The assistant expands exactly one item per continue. This is the **human-paced depth-first traversal**: it prevents the assistant from racing ahead of the user's mental model.

The loop's unrolling produces a **long linear list** as a side effect — because each for-each expands in sequence, the resulting plan.md is a sequential narrative of design decisions rather than a tree. This is intentional: a tree is hard to read; a sequential narrative is readable top-to-bottom.

---

## V. Improvements for Future Sessions

1. **Template-first rule:** For any expansion producing ≥ 5 instances of the same pattern, write the template (framework document) before expanding the instances. Applied retroactively: §D02-11 framework should have been §D02-00.

2. **Lab report naming convention:** All lab reports follow `lab-report-<slug>.md`. The slug should match the section it documents: `lab-report-ceremonia-roll-skill-checks.md` for §DESIGN-03, `lab-report-dungeon-ten-themes.md` for §DUNGEON-01. No orphaned lab reports.

3. **State field freeze:** Once a field name appears in a lab report, it does not change. If it must change, the lab report is updated and the change is noted in plan.md with a ⚠️ deprecation note.

4. **Compression rule for rationale sections:** Theory and design rationale sections should compress to: one-paragraph summary + one table. Long-form rationale belongs in lab reports, not in plan.md.

5. **Memory file after every session:** Before the context overflows, write or update a `project_*.md` memory file with the key decisions from this session. The memory file is the cold-start entry point for the next session.

6. **Parallel expansion protocol:** When expanding N items using a fixed template, write the template first, then expand all N items in a single pass (not N separate passes). This reduces the N×(pass overhead) cost to N + (template write overhead).

7. **Integration readiness checklist:** Before any HTML edit:
   - [ ] Lab report written and field names frozen
   - [ ] New `S_story` fields added to `_S_DEFAULTS()` spec
   - [ ] New QUEST_DB fields listed in §II Quick Reference
   - [ ] New state fields added to §III State Fields
   - [ ] `// → doc:` annotation planned for each new HTML const

8. **quest.md as living register:** `quest.md` was created this session. Keep it current: every new quest added to HTML should have a corresponding entry in `quest.md`. The register is the canonical source of truth for quest IDs, locations, and act structure.

9. **The "continue" discipline:** Each "continue" expands exactly one level of the tree, not multiple. If the user says "continue" and the assistant expands two levels, the next session will have inconsistent depth and will need a sync pass to reconcile.

10. **The anti-scope-creep gate:** Any expansion that introduces a new node, a new terrain entry, or a new QUEST_DB field type triggers a lab report gate. This is the firewall between planning and integration. It prevents the planning loop from producing changes that are expensive to undo.

---

## VI. Conclusion

The meta-process is a recursive list-expansion loop driven by human-paced depth-first traversal. Its outputs are: lab reports (design commitments), plan.md sections (design history), and HTML (executable artifact). The loop is efficient when templates exist before expansion and when the lab report gate enforces a clean separation between speculation and commitment. It is inefficient when expansion races ahead of commitment, producing spec documents whose field names drift before integration.

The ten instances documented here show that this project has consistently followed the efficient pattern for narrative and quest design (§GR, §RESEARCH-01, §XLII) and inconsistently followed it for mechanical design (§DESIGN-02 P3 bug, §DESIGN-03 field name drift). The improvement is not structural — the loop is correct — it is disciplinary: freeze field names in lab reports, not in planning passes.

*The thing you build should be giveable. The process you use to build it should be documentable. This report is the documentation.*

---

**Filed:** 2026-05-26  
**Cross-references:** `plan.md §I` (Directive) · `plan.md §0` (Dashboard) · `plan.md §DESIGN-03-G` · `plan.md §DUNGEON-01-G` · `plan.md §DUNGEON-02` · `quest.md`

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
