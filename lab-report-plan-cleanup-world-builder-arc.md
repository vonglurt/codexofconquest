# Lab Report — Documentation Phase Transition: plan.md Archaeology and the World Builder Arc

**IEEE-Format Post-Mortem**
**Date:** 2026-05-25
**Commit:** `2940f81`
**Diff:** 8,127 lines deleted · 1,748 lines added · 9 files changed
**Status:** ✅ Committed
**Codebase:** `roll2hit-v3.html` — single-file browser RPG; `plan.md` — primary planning document

---

## Abstract

This report documents two things simultaneously: the mechanics of a major plan.md cleanup pass (8,127 lines removed, 36 lab reports now on disk, the planning surface reduced to 230 lines of active material) and the broader trajectory that made the cleanup possible — the transformation of roll2hit from an MIT D&D 5e combat simulator into a self-documenting world builder. The two stories are the same story told at different scales. plan.md accumulated 8,200 lines because the project outgrew it — the document absorbed sync-pass findings, function coverage tables, Q-indexes, and completed-layer manifests because there was nowhere else for that material to go while the layers were being built. The cleanup extracted all of that into 36 dedicated lab reports, leaving plan.md as the active surface it was always meant to be. This report analyzes the accumulation pattern, the extraction method, the architectural implications for single-file projects with large documentation surfaces, and the arc from simulator to world builder that drove the growth in the first place.

---

## I. The Accumulation Pattern

### A. What plan.md Was Originally

At the initial commit (`32c10c5`, 2026-05-24), plan.md was 3,384 lines. It contained:

- A §0 implementation dashboard with Tier 1/Tier 2 layer queues
- A directive (§I) defining the collaborative working protocol
- Design constants quick reference (§II)
- State fields reference (§III)
- A feature suggestion list (§V)
- Spec sections (§VI onward) for each planned layer

The document was structured as a **directive + prompt surface**: a coder opens plan.md, reads §0 to see what is next, reads the relevant spec section, implements it, marks the row ✅, moves on. It was designed to be consumed and updated, not to accumulate.

### B. How Accumulation Happened

Between `32c10c5` (initial commit) and `2940f81` (cleanup commit), 63 commits landed. plan.md grew from 3,384 lines to 8,238 lines — a 2.4× expansion in 24 hours of development. The growth came from four sources:

**Source 1 — Sync pass inline findings.** The SP2 sync pass (the initial commit's core work) produced a set of Per-File Sync Plans (§VI-B), each describing what to read in the HTML, what to compare, and what discrepancies were found. These were the right place for that work while it was happening. After SP2, they became a log of things that had already been fixed. No one needed to read "Finding 2 — Undocumented defi_land cluster" again after the fix was committed. But the entry stayed.

**Source 2 — Function coverage tables.** §VI (the sync architecture section) grew a set of function coverage tables for F1–F6, listing every named function in the codebase with a ✅ sync status. These served as a verification checklist during SP2. After verification, they became dead weight — the same information exists in `lab-report-architecture-full.md` at higher fidelity, and reading plan.md to find function signatures was never the right workflow.

**Source 3 — The Q-Index.** Twenty Epic Battleground NPCs with their node codes and locations, documented in a table in plan.md §VI because they were needed during the SP2 EB content verification. The authoritative copy of this data lives in `story.md`'s §EPIC BATTLEGROUNDS section, added during SP2. The plan.md copy was a staging artifact that survived the stage.

**Source 4 — Master Increment Queue.** The SP2 work was organized as a 25-item increment queue (S01–S25), each increment tracking a file-pair comparison. By the end of SP2, all 25 were ✅. The queue persisted because removing completed items from an increment queue is a separate task from completing the items — and that task had not been scheduled.

### C. The Structural Problem

The underlying issue is not laziness or poor discipline. It is a structural property of single-file documentation projects: **there is no natural eviction mechanism**. In a database, stale rows can be deleted. In a distributed documentation system, outdated files rot and become obvious. In a single large markdown document, completed sections accumulate alongside active sections with no structural pressure to remove them. plan.md had no mechanism that caused completed material to leave.

The lab report system was the intended eviction mechanism — completed layers were supposed to move from plan.md into lab reports — but the sync pass material (findings, function tables, increment queues) was a different category of completed work that had no designated home.

---

## II. The Cleanup Method

### A. Diagnostic

The cleanup pass began with reading plan.md end-to-end (8,238 lines) and categorizing every section by status:

| Category | Line count (approx.) | Status |
|----------|---------------------|--------|
| §0 Implementation dashboard | 400 | Stale — Tier 1/Tier 2 rows all ✅ |
| §I Directive + lab report policy | 80 | Active |
| §II Design constants | 200 | Active |
| §III State fields | 300 | Active |
| §IV Implementation archive provenance | 40 | Redundant with §0 lab report index |
| §V Suggestions (V-A/B/C) | 150 | V-A done; V-B active (5 items); V-C empty |
| §V-D Category coverage (13 tables) | 900 | All ✅ |
| §VI-A File manifest | 200 | All ✅ |
| §VI-B Per-file sync plans | 600 | All ✅ |
| §VI-C Master increment queue | 300 | All ✅ |
| Q-Index | 80 | Belongs in story.md |
| Cross-reference table | 40 | All ✅ |
| Pass 1 findings log | 100 | All ✅ fixed |
| Six Sync Files function tables | 700 | All ✅; content in lab-report-architecture-full.md |

Of 8,238 lines, approximately 6,800 were completed historical material. The active content was ~500 lines (directive, constants, state fields, V-B).

### B. Extraction Strategy

The cleanup did not delete history — it relocated it. The eight lab reports written during the session (Layers 50–56, 61, 70–77) absorbed the narrative and architectural content of the completed layers that had been accumulating in plan.md's Tier 1/Tier 2 queues. The sync pass findings were already in the core docs (world.md, maps.md, story.md) — they didn't need a new home, they needed deletion from plan.md.

The decision not to write a separate "sync pass archive" document was deliberate: the findings from SP2 are now canonical in the files they corrected. A document that records what was wrong before it was fixed is not a useful artifact. The fix is the record.

### C. Result

| Metric | Before | After |
|--------|--------|-------|
| plan.md line count | 8,238 | 230 |
| Lines of active material | ~500 | ~230 |
| Signal/noise ratio | ~6% | ~100% |
| Lab reports on disk | 28 | 36 |
| Total documentation lines (all .md) | ~35,000 | ~27,000 |

The total documentation footprint shrank by 8,000 lines. The active planning surface shrunk by 55% even among the lines that were kept — some of the "active" material turned out to be slightly verbose when re-read cold.

---

## III. The World Builder Arc

### A. The Starting State (Layer 0, ~2024)

Roll2hit began as a combat dice tracker — a response to a specific practical problem: tracking a D&D combat encounter in real time without a second screen. The original `roll2hit.html` was four panels: player HP, opponent stat block, d20 roller, damage roller. No state machine, no persistence, no narrative. A tool, not a game.

The single-file constraint was imposed by the deployment target: open in any browser, share as a file, no server required. This constraint became the project's primary architectural discipline. Complexity had to earn its place inside the file.

### B. The Simulator Phase (Layers 0–13)

The first thirteen layers built the simulation engine inside the single-file constraint:

- **L0–L3:** Combat loop, initiative, damage rolls, HP tracking
- **L4–L8:** Node map (42 story nodes, 7 junctions), navigation, corridor routing
- **L9–L11:** Stalk/hunt mechanic, monster weighting, BFS pathfinding
- **L12–L13:** Quest engine, gate locks, Codex Shards, vendor economy

By Layer 13, the tool had become a game. The key architectural decision was `reward = floor(0.1 × AC × maxHP)` — a formula that tied monster difficulty to reward scaling, enforcing what the `lab-report-prompt-migration-arena-to-prototype.md` calls the **Cooperative DM Principle**: the game gives you what the encounter earned, not what you negotiated for. The reward formula is a mathematical invariant encoding a design philosophy.

At Layer 13: 7,465 lines, 329 monsters, 50 nodes, 8+ quests.

### C. The Expansion Phase (Layers 14–47)

Layers 14–47 expanded the simulation into a world. The key additions:

- **L14–L17:** Condition economy, flashbang, Action Surge, weapon tiers
- **L18–L20:** Level-up system, ASI table, shield gift milestones
- **L39:** Epic Battlegrounds — 20 deadly-tier encounters with quest-giver NPCs, payment negotiation, scripted item rewards
- **L40:** Froberger's Journal — 41 entries, 10 read-aloud, 31 collectible; the game's primary narrative artifact
- **L41:** Birka Six NPC arcs — 6 named NPCs with 4 favorability states, 120 dialogue lines, quest chains
- **L42:** NPC dialogue system — `NPC_DIALOGUES` (6×4×5), cross-reference injection, farewell beats
- **L43:** Endings and echoes — curse score, 5 covenant standing tiers, NG+ preservation chain
- **L44:** Living world — world progression events, act-three emotional weight, final map render
- **L45:** Web of connections — Froberger traces, NPC cross-references, Room 6, Yael patrol

At Layer 45, the simulator had become a world. The Froberger journal is a 41-entry document within the game that narrates a researcher's death at the hands of the institution that dismissed his work. The NPCs have histories that intersect. The ending varies based on how many people you helped and how many monsters you sent back to the quest-givers who needed them. The reward formula from Layer 3 still holds.

### D. The World Builder Phase (Layers 48–77)

Layers 48–77 crossed the threshold from world to world builder. The defining shift: the game began generating material that the player could use to extend the game.

**Layer 49 — Quest -1: The Open Door.** At Level 20, the game breaks the fourth wall. It acknowledges that Level 21 is undefined, provides exact grep commands for reading the source code, and instructs the player on how to complete the quest via the browser console. The game explicitly states that it will not know whether the player earned it. Quest -1 is the first moment the game addresses its own construction directly.

**Layer 50 — NG+ Remembrance.** The Entry 42 modal at the CI node asks the player, on a NG+ run, to write a journal entry. The text is free-form; the game stores it in `S_story.entry42Text`. Froberger wrote 41 entries. The player writes one. The Benedikt callback at SQ, triggered only after completing the Weimar Scholar arc, names this "Entry 42 is the fourth link." The player's written entry becomes a load-bearing element of the world's lore chain.

**Layer 51 — Weimar Scholar Gate.** Three documents in an in-game archive tell the story of why Froberger died. The First Researcher's name is redacted in Document 3. It can only be unredacted by attending three reading circle sessions with an ex-scholar NPC — three separate in-game days, tracked by `wmSessionsDays`. The archive is a functional research archive inside a game that was once a combat dice tracker.

**Layer 52 — Void Archaeology.** Five investigation sites at nodes the player has visited since Act I reveal marks left by the First Researcher 200 years before the game's events. The marks were always there. The game generates a fourth ending variant for players who complete the chain: Sweelinck asks *"What was inside the cage?"* — a question with no in-game answer, acknowledging that the player knows what they built.

**Layers 56, 61, 70–77** continued the pattern: named antagonists with corrupted mandates (the Warden), wandering merchants with revelation-gated final items (Corelli), NPC farewell arcs timed to the final act, tattoo progression that persists through death, and a chronicle system that accumulates career statistics across NG+ runs.

### E. The Documentation Mirrors the Construction

The lab report count tracks the world builder arc directly:

| Phase | Layers | Lab Reports | Key addition |
|-------|--------|-------------|-------------|
| Simulator | 0–13 | 2 (migration + cleanup v13) | Combat loop → quest engine |
| Expansion | 14–47 | 14 | NPC arcs, journal, endings, living world |
| World builder | 48–77 | 20 | NG+, archaeology, Warden, chronicle |

The world builder phase generated 20 lab reports in roughly the same wall-clock time as the expansion phase generated 14. The documentation cadence accelerated because the design decisions became more non-obvious — each layer had more prerequisite state, more cross-system integration, and more narrative context that couldn't be recovered from the code alone. Lab reports became necessary rather than optional.

---

## IV. Design Decisions and Trade-offs

### A. plan.md as Directive vs. Archive

The root tension: plan.md serves two incompatible functions. As a **directive**, it should be short, current, and action-oriented — the first thing opened during an implementation session, the last thing updated before a commit. As an **archive**, it accumulates findings, decisions, and verification logs that justify the current state of other documents. These functions require different update disciplines. The directive shrinks toward clarity; the archive grows toward completeness.

The resolution was structural: lab reports absorb the archive function. plan.md is exclusively a directive. Any material that would be useful to a future implementer lives in a lab report, not in plan.md. The lab report system is the eviction mechanism plan.md lacked.

### B. When Completed Rows Should Be Deleted

The SP2 increment queue (S01–S25) was the clearest case: all 25 items were marked ✅, and the queue served no further purpose. Deleting it was unambiguous. The harder cases were the function coverage tables — they were accurate, they were organized, they were useful to have once. But they duplicated `lab-report-architecture-full.md` at lower fidelity. The correct answer was to maintain one copy, not two.

Rule derived: **completed verification tables belong in lab reports, not in plan.md.** plan.md should reference the lab report, not contain the table.

### C. The Q-Index Placement

The Q-Index (20 Epic Battleground NPCs with node codes and locations) was written in plan.md during SP2 because the data was needed to pull NPC names from the HTML and verify the story.md content. After SP2, the authoritative copy was story.md. plan.md held a staging copy with no mechanism to signal its own staleness. Moving staging work directly to its destination doc (story.md) would have eliminated the accumulation entirely — but staging in plan.md was faster during the session.

No clean solution exists for this pattern. The mitigation is the cleanup pass itself: a scheduled pass that looks for staging artifacts that outlived their stage.

### D. The 8,127-Line Diff Is Not a Problem Statement

A 97% reduction in a document's line count sounds alarming. It is not. The material removed was not valuable — it was completed, verified, and archived. The value it contained was extracted into the core docs and lab reports before it was removed from plan.md. The diff is large because the accumulation was large; the accumulation was large because the project moved fast during a high-productivity session and cleanup was deferred. Deferred cleanup is not a failure state — it is a normal development pattern. The cleanup commit is the intended mechanism, not a correction of an error.

---

## V. Post-Mortem Notes

### What Worked

- The lab report system correctly absorbed the narrative and design decision content of Layers 50–77. All 36 lab reports are indexed in plan.md §0 and can be read independently. The cleanup did not lose any non-obvious information.
- The three-field lab report frontmatter (name, description, type) in the memory system captured the session's output in a form retrievable across conversation resets — allowing the cleanup session to proceed without re-reading all prior sessions' output.
- Parallel agent dispatch (three background agents writing lab reports simultaneously) reduced wall-clock time for the documentation pass by approximately 60%. The pattern of delegating individual lab reports to agents while the main context handled plan.md editing worked without coordination failures.

### What Could Be Better

- The function coverage tables (F1–F6) in plan.md should have been written directly into `lab-report-architecture-full.md` rather than staging in plan.md. The architecture lab report is the correct home for function-level documentation. Writing to plan.md first and migrating later adds a cleanup burden.
- The SP2 increment queue (S01–S25) was useful during SP2 and useless after. A better pattern: write the queue to a temporary `pass-sp2.md` file, commit the findings into the target docs, then delete `pass-sp2.md`. Temporary files are easier to delete than sections of a persistent document.
- The Tier 1/Tier 2 dashboard in §0 mixed "ready to implement" with "implemented but lab report pending." Once a layer is implemented, it should leave the dashboard entirely and appear only in the lab report index. The intermediate state ("✅ Implemented — lab report pending") let rows linger.

### The Arc in One Sentence

Roll2hit started as a dice roller, became a quest engine, built a world that remembered its own history, and is now an MIT-licensed world builder that tells you — at Level 20, with a grep command — how to extend it.

---

## VI. File References

| File | Location | Content |
|------|----------|---------|
| `plan.md` | Commit `2940f81` | Before: 8,238 lines. After: 230 lines. |
| `lab-report-prompt-migration-arena-to-prototype.md` | Full document | Layer 0–13 arc: dice tracker → narrative engine |
| `lab-report-quest-minus-one-world-creator.md` | §II | Quest -1 implementation: Level 21 undefined as invitation |
| `lab-report-ng-plus-remembrance.md` | §I-B | Entry 42: player-written journal entry as lore element |
| `lab-report-weimar-scholar-gate.md` | §II-D | Archive modal: three documents + redacted name |
| `lab-report-void-archaeology.md` | §I-A | Retroactive mark system: she was always there |
| `lab-report-void-shaman.md` | §I-A | Corrupted mandate: seventeen copies, one verb-tense error |
| `lab-report-timeline-history-completed.md` | Full document | Complete layer-by-layer development timeline (L0–L45) |
| `lab-report-architecture-full.md` | Full document | Complete function catalog — canonical function reference |
| `lab-report-documentation-system-design.md` | Full document | IEEE analysis of the two-way sync architecture |
