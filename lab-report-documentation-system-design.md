# Lab Report — The roll2hit.com Documentation System: Design, Purpose, and Synchronization Architecture
### IEEE-Format Analysis of a Two-Way Synchronized Planning and Documentation Framework
**Date:** 2026-05-24  
**Subject:** `plan.md` as master planning document; all `.md` files in `/roll2hit.com/`  
**Scope:** Documentation system architecture, prompt keyword analysis, task decomposition, sync symmetry  

---

## Abstract

This report analyzes the documentation system for `roll2hit.com` — a 14,377-line single-file browser RPG — from the perspective of software engineering methodology. The system maintains a **two-way synchronization** between a primary source file (`roll2hit-v3.html`) and a corpus of 37 Markdown documents. `plan.md` functions as the master planning document: it holds implementation directives, a PLANNED-feature specification queue, tooling reference, and the complete sync-pass record. This report describes `plan.md`'s architecture, extracts the recurring keyword vocabulary used across all prompts, proposes a task-assignment decomposition framework derived from that vocabulary, and articulates the symmetry of the two-way sync as a formal engineering pattern. ASCII flowcharts and architecture diagrams are provided for each subsystem. The report concludes that the documentation system is itself a form of software: it has a schema (`index.md` as manifest), a source of truth (`roll2hit-v3.html`), a spec layer (`plan.md`), and a test suite (sync pass increments). Understanding it as software — not prose — is the key to maintaining it at scale.

---

## I. Introduction

### A. The Documentation Problem

`roll2hit-v3.html` is a monolith: all game logic, data, UI, and narrative in a single file. Monoliths are readable only as long as the programmer holds the full architecture in memory. At 14,377 lines, that mental model exceeds working memory for any session longer than a few hours. Documentation exists to externalize that model.

The naive documentation approach — write a README, update it occasionally — fails at this scale because the gap between documentation and code grows with every edit. The roll2hit documentation system addresses this with a constraint that is both obvious and uncommon: **every item in the docs must trace to the HTML, and every item in the HTML must have a home document.** The two-way sync rule makes documentation a first-class engineering artifact, not an afterthought.

### B. The Role of plan.md

`plan.md` is not a README. It is the master planning document: the first file read at the start of every working session. Its functions are:

1. **Directive** — what the session must do and what rules govern all edits
2. **Design Constants** — the canonical numbers (370 monsters, 66 terrain entries, 76 nodes, 107 state fields)
3. **State Field Reference** — all 107 `_S_DEFAULTS()` fields documented by category
4. **Implementation Archive** — provenance of each implemented layer (1–53)
5. **Implementation Queue** — PLANNED features in priority order (§V-A)
6. **Sync Pass Record** — SP1 and SP2 increment logs with status
7. **Feature Specs** — full IEEE-style specifications for each PLANNED layer (§IX–§XVIII)
8. **Tooling Reference** — shell commands for safe HTML editing (§XIV)
9. **Code Examples** — annotated JavaScript patterns for the game's idioms

### C. Scope of This Report

This report covers:
- `plan.md` structure and purpose (Section II)
- Keyword analysis across all `.md` prompts and directives (Section III)
- Task decomposition framework derived from the keyword vocabulary (Section IV)
- Two-way synchronization as a formal engineering pattern (Section V)
- Document role specifications — each file's architectural purpose (Section VI)
- ASCII flowcharts for all major subsystems (Section VII)
- Recommendations (Section VIII)

---

## II. plan.md — Structure and Purpose Analysis

### A. Section Map

`plan.md` is organized into four logical zones:

| Zone | Sections | Purpose |
|------|----------|---------|
| **Governance** | §I–§IV | Directives, constants, state fields, provenance |
| **Dashboard** | §V | Implementation and documentation queues; new ideas |
| **Sync Record** | §VI–§XI | SP1 and SP2 increment logs; function coverage; cross-reference table |
| **Feature Specs** | §IX, §X, §XII–§XVIII | Full PLANNED feature specifications, one per layer |

The governance zone is read every session. The dashboard is updated whenever a feature is planned or completed. The sync record is the audit trail of SP2. The feature specs are written when planning and marked `✅` when implemented.

### B. The Directive (§I)

§I is the constitution of the documentation system. It states three rules:

1. **Two-way sync rule** — every doc item traces to HTML; every HTML item has a home doc
2. **PLANNED feature standard** — PLANNED features exist in docs as stubs until implemented; never in HTML reference tables
3. **Lab Report Policy** — write a lab report for major collections, large redesigns, new narrative arcs, design reviews, and session postmortems; commit with related doc changes in a single commit

The directive is read before any other section. It overrides any other guidance.

### C. The Design Constants (§II)

§II is a quick-reference card for the numbers that appear most frequently across all documents:

| Constant | Value | HTML source |
|----------|-------|-------------|
| Monster count | 370 | `MONSTER_POOL` — grep -c "key:'" |
| WORLD_DB terrains | 66 (46 base + 20 epic) | `WORLD_DB` |
| Story nodes | 76 | `NODE_MAP` |
| State fields | 107 | `_S_DEFAULTS()` |
| Froberger journal entries | 41 | `FROBERGER_JOURNAL` |
| Named NPCs (Birka) | 6 | `NPC_DIALOGUES` |
| Acts | 8 | `NODE_MAP[code].act` |

These numbers must be consistent across every document that references them. Any document that states a different count is stale. The sync pass exists to find and correct these divergences.

### D. The PLANNED Feature Lifecycle

Every feature in plan.md §V-A exists in one of four states:

```
IDEA (§V-C) → SECTION (§IX–§XVIII) → PLANNED stubs (docs) → IMPLEMENTED (HTML + doc sync)
```

The transition from IDEA to SECTION creates the full spec. The transition from SECTION to PLANNED stubs adds the feature to `story.md`, `world.md`, and `maps.md` as `⚠️ PLANNED` entries. The transition from PLANNED stubs to IMPLEMENTED touches the HTML and then syncs all affected docs.

---

## III. Keyword Analysis — Common Vocabulary Across All Prompts

### A. Method

The recurring vocabulary of the documentation system was extracted by analyzing: `plan.md` §I–§XVIII, `index.md`, `spec-engine.md`, `spec-world.md`, `spec-combat.md`, and all lab-report headers. Keywords were grouped by function.

### B. Control Flow Keywords

These keywords appear in session directives and control the working mode:

| Keyword | Frequency | Function |
|---------|-----------|---------|
| `continue` | Very high | Triggers next increment; session resumption signal |
| `PLANNED` | Very high | Marks a feature not yet in HTML; PLANNED stubs exist in docs only |
| `✅` | High | Marks a completed increment or sync item |
| `⚠️` | High | Flags attention — PLANNED or deviation from directive |
| `⏳` | Medium | In-progress or deferred item |
| `❌` | Low | Ruled out; kept for audit trail |
| `Layer N` | High | Implementation version number; each layer is an atomic unit |

### C. Architecture Keywords

These keywords name the primary data structures:

| Keyword | HTML const | Home doc |
|---------|-----------|---------|
| `MONSTER_POOL` | `MONSTER_POOL` | `monsters.md` |
| `WORLD_DB` | `WORLD_DB` | `monsters.md`, `spec-world.md` |
| `NODE_MAP` | `NODE_MAP` | `maps.md`, `world.md` |
| `QUEST_DB` | `QUEST_DB` | `world.md` |
| `_S_DEFAULTS` | `_S_DEFAULTS()` | `spec-engine.md`, `plan.md §III` |
| `NPC_DIALOGUES` | `NPC_DIALOGUES` | `story.md` |
| `FROBERGER_JOURNAL` | `FROBERGER_JOURNAL` | `froberger-journal-all-entries.txt` |
| `FIGHTER_FEATURES` | `FIGHTER_FEATURES` | `mechanics.md` |
| `CONDITION_ITEMS` | `CONDITION_ITEMS` | `mechanics.md` |
| `EPIC_BOSS_POOL` | `EPIC_BOSS_POOL` | `combat.md` |

### D. Policy Keywords

These keywords encode behavioral rules and constraints:

| Keyword | Meaning |
|---------|---------|
| `source of truth` | Designates which artifact governs in case of conflict (`roll2hit-v3.html` for code; `plan.md` for intent) |
| `two-way sync` | Every doc item traces to HTML; every HTML item has a home doc |
| `lab report` | A new `.md` file written when a major collection, redesign, or arc is added |
| `home doc` | The canonical document for a given HTML const |
| `state flag` | A boolean or array field in `_S_DEFAULTS()` that tracks game progress |
| `gate` / `gated` | A prerequisite condition that must be true before content unlocks |
| `stale` | A documentation value that no longer matches the HTML |
| `SP2` | Sync Pass 2 — the two-way consistency pass; each increment is one file comparison |

### E. Narrative Keywords

These keywords appear in feature specs and carry narrative/mechanical weight:

| Keyword | Domain | Usage |
|---------|--------|-------|
| `Dear Friend` | NPC | Highest favorability tier; unlocks quest completion content |
| `favorability` | NPC | Four-state progression: Impartial → Friendly → Dear Friend |
| `ngPlusRun` | NG+ | Counter tracking how many New Game+ runs; gates §XV and §XVII |
| `Entry 42` | Narrative | Player-authored journal entry; the 42nd entry; stored in `entry42Text` |
| `Curse of Knowledge` | Mechanic | Score tracking whether the player shared what they learned |
| `Void Tide` | World | The primary antagonist force; advances daily |
| `Froberger` | Character | The deceased researcher; the player's predecessor |
| `PLANNED stub` | Doc standard | A `⚠️ PLANNED` section in a markdown doc for an unimplemented feature |

### F. Keyword Patterns and Implications for Prompt Design

The keyword analysis reveals three prompt design principles used consistently across all documents:

1. **Gate vocabulary is consistent.** Every prerequisite uses the same form: `flagName = true` or `ngPlusRun ≥ N`. This makes implementation specs machine-parseable — a programmer can extract all gate conditions with a single grep.

2. **Status is always visible.** Every item has a status symbol (`✅ ⚠️ ⏳ ❌`). A reader scanning any section can immediately identify what is done, pending, blocked, or ruled out without reading prose.

3. **Layer numbers are the version system.** Every PLANNED feature has a Layer number. Implementation priority follows layer order. This provides a deterministic ordering that doesn't require a separate project management tool.

---

## IV. Task Assignment and Decomposition Framework

### A. The Atomic Unit of Work

The atomic unit of work in the roll2hit system is the **Layer**. A Layer is:

- One feature or coherent set of changes
- Fully specified in plan.md before implementation begins
- Tagged with a `Layer N` number
- Implemented as: code change + doc sync + git commit
- Accompanied by a lab report if it meets the lab report trigger criteria

A Layer is **not** a sprint, a ticket, or a milestone. It is closer to a commit with a spec. The spec exists before the code. The code matches the spec or the spec is updated first.

### B. Task Breakdown by Layer State

Each Layer passes through five task phases:

```
Phase 1: SPEC     — Write the full spec in plan.md (new §N section)
Phase 2: STUB     — Add ⚠️ PLANNED stubs to story.md, world.md, maps.md
Phase 3: CODE     — Implement in roll2hit-v3.html; verify with grep counts
Phase 4: SYNC     — Update all home docs to reflect implemented code
Phase 5: COMMIT   — git add all changed files; git commit with layer tag
```

If a lab report is needed, it is written in Phase 4 and committed in Phase 5 with all other changes.

### C. Task Assignment Template

When assigning a Layer to a working session, the prompt should include:

```
TASK: Implement Layer N — [Feature Name]
SPEC: plan.md §N
PREREQUISITES: [list state flags that must be set]
HTML TARGETS: [list of consts/functions to modify]
DOC SYNC: [list of markdown files to update after]
VERIFY: grep -c "key:'" roll2hit-v3.html (expect: N)
LAB REPORT: [yes/no — if yes, title]
COMMIT: git add [files] && git commit -m "Layer N — [Feature Name]"
```

This template ensures the session has: scope (what to implement), context (where in HTML), verification (how to confirm it worked), and exit criteria (commit).

### D. Session Continuity — The "continue" Keyword

The word `continue` in a session prompt signals: "resume from the last completed increment." The session reads the plan.md dashboard (§V-A), finds the highest-priority `⚠️ PLANNED` item, and begins Phase 1 or resumes at whatever phase was last completed.

This makes plan.md a **resumable state machine** — the document itself encodes where the work is, so context can be reconstructed from the file rather than from conversation history.

### E. Priority Assignment

§V-A assigns priorities 1–9 to current PLANNED features. Priority is determined by:

1. **Layer order** — lower layer number = higher priority (implemented in ascending order)
2. **Prerequisite readiness** — features with no unsatisfied prerequisites are higher priority than those that require other layers first
3. **Narrative coherence** — features that connect to already-implemented content are higher priority than those that introduce entirely new systems

The current priority table (§V-A) reflects this ordering: §XIV (Layer 49) before §XV (Layer 50) before §XVI (Layer 51), etc.

---

## V. Two-Way Synchronization — Symmetry Analysis

### A. The Symmetry Statement

The two-way sync rule has an elegant symmetry:

```
∀ item D in docs:  ∃ const/function C in HTML such that D describes C
∀ const C in HTML: ∃ document D in docs such that D is the home doc of C
```

This is a **bijection** between documentation items and code items. In practice it is not perfectly bijective — some HTML functions have no doc, some doc sections describe behavior rather than a single const — but the bijection is the target state. Every sync pass moves the system closer to it.

### B. The Source-of-Truth Hierarchy

The system has three layers of authority:

```
Level 1 (Intent):    plan.md         — what should be built and why
Level 2 (Code):      roll2hit-v3.html — what IS built; source of truth for counts
Level 3 (Docs):      *.md files       — verbose English description of what is built
```

When Levels 1 and 2 conflict: the feature is PLANNED (not yet implemented). When Levels 2 and 3 conflict: the doc is stale (Level 2 wins; update Level 3). When Levels 1 and 3 conflict: the spec has changed (update Level 1, then Level 3).

### C. The Sync Pass as a Formal Process

A sync pass (SP1, SP2) is a systematic traversal of the bijection:

```
FOR each HTML const C:
  1. Identify its home document D
  2. Read the relevant section of D
  3. Compare D's claim against C's actual value
  4. If mismatch: update D to match C (or flag for review)
  5. Mark increment ✅ in plan.md §XI-B
```

Each increment (`SP2-01` through `SP2-12`) is one pass through one file comparison. The result is a `✅` in the sync log. When all increments are `✅`, the system is in a consistent state.

### D. PLANNED Feature Asymmetry

PLANNED features break the bijection intentionally:

```
∃ doc section D with ⚠️ PLANNED: no corresponding C in HTML
```

This is acceptable because the PLANNED stub is an explicit marker of the gap. The invariant becomes: every gap must be marked `⚠️ PLANNED` in the relevant doc. An unmarked gap is a sync error; a marked gap is a design decision.

---

## VI. Document Role Specifications

Each document in the roll2hit corpus has a single governing purpose — its "prompt." These are the canonical one-line descriptions:

### A. Core Documents (always kept in sync with HTML)

| File | One-Line Role Prompt |
|------|---------------------|
| `plan.md` | Master planning document — directives, PLANNED feature queue, sync log, tooling reference; read first every session |
| `index.md` | Cross-reference manifest — maps every doc to its HTML const; SP2 sync log; lab report index |
| `world.md` | World description — NODE_MAP, WORLD_DB, NPC profiles, faction descriptions, quest IDs, Birka district layout |
| `story.md` | Narrative document — all 76 nodes, 8 acts, full narrative flow, NPC dialogue transcript (all 120 quotes), quest beats |
| `mechanics.md` | Mechanical reference — combat engine, XP table, conditions, economy, equipment, save format, fighter features |
| `monsters.md` | Monster reference — all 370 MONSTER_POOL entries with stat blocks; all 66 WORLD_DB terrain coverage tables |
| `maps.md` | Spatial reference — 26×16 grid layout, corridor map, node network, all 76 node coordinates, legend |
| `combat.md` | Combat deep-dive — full combat loop, death saves, Epic Boss Pool, conditions in combat, fighter abilities |

### B. Spec Documents (JavaScript architecture reference)

| File | One-Line Role Prompt |
|------|---------------------|
| `spec-engine.md` | Core engine — `_S_DEFAULTS()` all 107 fields, combat loop, dice functions, initiative, action economy |
| `spec-corridors.md` | Corridor system — `CORRIDOR_CELLS` grid, stalk/hunt mechanics, movement through terrain |
| `spec-world.md` | World engine — `WORLD_DB`, `MONSTER_POOL` terrain cascade, terrain-to-monster resolution |
| `spec-combat.md` | Combat flow — conditions, death saves, Fighter features, battle overlay state machine |
| `spec-migration.md` | Architecture overview — all data structures; full migration history from Arena to Story Mode |

### C. Lab Reports (design decisions and postmortems)

Lab reports are time-stamped IEEE-format documents that capture a design decision, implementation result, or architecture review. They are not updated after the fact — an "implementation note" is prepended if shipped code diverges from the design. See `index.md` for the full list (23 lab reports).

**Lab Report Trigger Criteria:**
- Major new collection added (new monster group, terrain cluster, NPC faction, item economy)
- Large redesign touching multiple systems
- New narrative theme or arc spanning multiple nodes/NPCs/quests
- Design review before implementation (spec to lock in data shapes before touching HTML)
- Session postmortem with non-obvious decisions

---

## VII. Architecture Diagrams

### A. Document Hierarchy

```
                    ┌─────────────────────────┐
                    │       plan.md           │
                    │  (Master Planning Doc)  │
                    │  Directives + Queue     │
                    │  Feature Specs §IX–§XVIII│
                    └────────────┬────────────┘
                                 │ governs
                    ┌────────────▼────────────┐
                    │      index.md           │
                    │  (Cross-Reference Map)  │
                    │  HTML const → doc file  │
                    │  Lab report index       │
                    └────────────┬────────────┘
                                 │ maps to
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼────────┐  ┌──────────▼──────────┐  ┌───────▼──────────┐
│   Core Docs      │  │    Spec Docs        │  │   Lab Reports    │
│  world.md        │  │  spec-engine.md     │  │  lab-report-*.md │
│  story.md        │  │  spec-corridors.md  │  │  (23 files)      │
│  mechanics.md    │  │  spec-world.md      │  │  IEEE-format     │
│  monsters.md     │  │  spec-combat.md     │  │  design decisions│
│  maps.md         │  │  spec-migration.md  │  └──────────────────┘
│  combat.md       │  └─────────────────────┘
└─────────┬────────┘
          │ synced with
┌─────────▼───────────────────────────────────────────┐
│                  roll2hit-v3.html                   │
│          (Source of Truth — 14,377 lines)           │
│  MONSTER_POOL · WORLD_DB · NODE_MAP · QUEST_DB      │
│  _S_DEFAULTS · NPC_DIALOGUES · FROBERGER_JOURNAL    │
│  FIGHTER_FEATURES · EPIC_BOSS_POOL · CONDITION_ITEMS│
└─────────────────────────────────────────────────────┘
```

### B. Two-Way Sync Flow

```
  HTML (source of truth)              Docs (verbose description)
  ─────────────────────               ──────────────────────────
  
  MONSTER_POOL ──────────────────────► monsters.md §MONSTER_POOL
    key: 'goblin_scout'                  goblin_scout | 12 | 8 | +3 | ...
    name: 'Goblin Scout'  
    
  ◄────────────────────────────────── (sync check: count matches grep -c "key:'")
  
  If doc says "370 monsters" and grep returns 371:
    → doc is stale → update doc to 371
    
  If HTML has a new const with no home doc:
    → sync gap → assign to home doc → add section
    
  If doc has a PLANNED stub with no HTML entry:
    → intentional gap → verify ⚠️ PLANNED marker present → OK
```

### C. PLANNED Feature Lifecycle

```
  ┌─────────────────────────────────────────────────────────────────────┐
  │                    PLANNED Feature Lifecycle                        │
  └─────────────────────────────────────────────────────────────────────┘
  
  [Raw Idea]
      │
      ▼
  §V-C New Feature Ideas table
  (idea + rationale + candidate lab report)
      │
      ▼  (session: "continue working on plan.md")
  §N Full Spec Section written in plan.md
  (setting + NPCs + quests + items + state flags + insertion spec)
      │
      ▼  (same session)
  ⚠️ PLANNED stubs added to:
    story.md — quest beat lines
    world.md — NPC/location description
    maps.md  — node entry (if new node)
      │
      ▼  (git commit — spec + stubs together)
  git commit "Add plan.md §N — [Feature Name] (Layer N PLANNED)"
      │
      ▼  (future session: implementation)
  CODE: edit roll2hit-v3.html
    - add entries to MONSTER_POOL, QUEST_DB, _S_DEFAULTS, etc.
    - verify with grep count checks
      │
      ▼
  DOC SYNC: update home docs
    - monsters.md: add monster stat block
    - story.md: convert PLANNED stub to implemented content
    - world.md: convert PLANNED stub to implemented content
    - mechanics.md: add new mechanic section (if needed)
    - Remove ⚠️ PLANNED markers
      │
      ▼  (if lab report criteria met)
  Write lab-report-[title].md
  Add to index.md + plan.md §VI-A
      │
      ▼
  git commit "Layer N — [Feature Name]: [summary]"
  (all files in one commit: HTML + all docs + lab report if any)
      │
      ▼
  §V-A table: update status from ⚠️ PLANNED to ✅
  §XI-A table: update to ✅ synced
```

### D. Session Workflow

```
  SESSION START
       │
       ▼
  Read plan.md §I (Directive)
       │
       ▼
  Read plan.md §V-A (Implementation Queue)
  Find highest-priority ⚠️ PLANNED item
       │
       ├── If implementing: read §N full spec
       │       │
       │       ▼
       │   Read relevant core docs (world.md, story.md, etc.)
       │       │
       │       ▼
       │   Read spec-*.md for JavaScript patterns
       │       │
       │       ▼
       │   Edit roll2hit-v3.html
       │       │
       │       ▼
       │   Verify (grep counts, spot-check)
       │       │
       │       ▼
       │   Sync all home docs
       │       │
       │       ▼
       │   Write lab report (if triggered)
       │       │
       │       ▼
       │   git commit
       │
       └── If planning: write §N spec
               │
               ▼
           Add ⚠️ PLANNED stubs to story.md, world.md, maps.md
               │
               ▼
           Update §V-A, §XI-A
               │
               ▼
           git commit
```

### E. State Flag Architecture

State flags are the mechanical layer connecting the HTML game logic to the narrative progression:

```
  _S_DEFAULTS() — 107 fields
  ─────────────────────────────────────────────
  
  Category A: Core game state
    hp, hpMax, gold, xp, level, gameDay, act
    
  Category B: Quest completion flags
    quest_yael_escort: false
    quest_brynn_ledger: false
    ... (one boolean per quest)
    
  Category C: Narrative state flags
    frobergerLastEntryRead: false
    entry42Written: false
    ngPlusRun: 0
    wmFirstResearcherKnown: false
    vaArchitectureKnown: false
    
  Category D: NPC favorability
    fav_yael: 0        // 0=Impartial 1=Friendly 2=DearFriend
    fav_brynn: 0
    ... (one int per named NPC)
    
  Category E: System arrays
    quests: []         // active quest IDs
    inventory: []      // item objects
    visitedNodes: Set  // nodes visited
    wmSessionsDays: [] // reading circle days attended
    
  ─────────────────────────────────────────────
  Persisted by: storyAutoSave() → localStorage
  Restored by:  storyLoadContinue()
  Default init: _S_DEFAULTS()
  Doc home:     spec-engine.md, plan.md §III
```

---

## VIII. Recommendations

### A. The FC Item Queue (§V-B)

Five documentation improvement items (FC01–FC05) remain open. In priority order:

1. **FC05** — Two-way link convention: every HTML const gets `// → doc: filename.md §Section`; every doc section gets `> HTML source: CONST ~line N`. This makes the bijection explicit in both artifacts, not just in `index.md`.

2. **FC02** — `froberger-journal-all-entries.txt` entry-by-entry compare against HTML. The count is verified (41 entries); the content comparison has not been done.

3. **FC01** — Doc Health badge in `index.md` — a live count of sync-pass completion visible at a glance.

4. **FC03** — Split `mechanics.md` into `mechanics-combat.md` + `mechanics-economy.md`. The file covers two distinct domains; splitting improves navigation.

5. **FC04** — Spot-check policy: re-verify function names in `lab-report-architecture-full.md` every 10 layers, since function names can change over time.

### B. The Keyword Vocabulary as a Style Guide

The keyword analysis in Section III reveals an implicit style guide for all plan.md additions:
- Use status symbols (`✅ ⚠️ ⏳ ❌`) consistently — never use prose status ("done", "in progress")
- Use Layer N numbers for every feature — never describe a feature without its layer tag
- Use `gate condition:` notation for every prerequisite — never bury gate conditions in prose
- Use the established vocabulary (`Dear Friend`, `favorability`, `state flag`, `home doc`) — do not invent synonyms

Consistency in vocabulary is what makes the document machine-parseable by a language model reading from a cold start.

### C. Lab Report Cadence

The lab report policy (plan.md §I) defines trigger criteria but not cadence. Recommendation: review the trigger criteria at the end of every 5-layer implementation block (every 5 `✅` marks in §V-A) to determine whether a session postmortem lab report is warranted. A postmortem every 5 layers ensures that non-obvious design decisions are captured before the session's context is lost.

### D. The plan.md File as Session State

`plan.md` functions as a resumable state machine across sessions. Every section either has a status (✅ or ⚠️ PLANNED) or is governance text that does not change. A language model reading plan.md from scratch can determine:
- What has been implemented (✅ in §XI-A, §V-A)
- What is planned next (⚠️ PLANNED in §V-A, ordered by priority)
- What rules govern all work (§I)
- What the canonical numbers are (§II)

This means `plan.md` is not just documentation — it is **session context as data**. Its maintenance is not optional overhead; it is the mechanism by which continuity is preserved across sessions.

---

## IX. Conclusions

The roll2hit.com documentation system is best understood as a software artifact: it has a schema, a source of truth, a spec layer, and a testing protocol (the sync pass). `plan.md` is the specification file — not a README, not a changelog, but the persistent description of intent that governs all future changes.

The two-way synchronization rule creates a **bijection** between documentation items and code items. This bijection is maintained by sync passes (SP1, SP2), enforced by the directive (§I), and audited by the cross-reference table (§XI-A). PLANNED features break the bijection intentionally — they exist in docs but not yet in HTML — and this asymmetry is marked explicitly with `⚠️ PLANNED` to distinguish gaps from errors.

The keyword vocabulary analysis reveals that the system is consistent in its language: status symbols, Layer numbers, gate conditions, and architectural names are used uniformly across all 37 documents. This consistency makes the corpus parseable from a cold start — any session can reconstruct the working context by reading `plan.md` alone.

The task decomposition framework (five phases: Spec → Stub → Code → Sync → Commit) ensures that no implementation is begun without a spec and no spec is closed without a doc sync. The lab report policy ensures that significant design decisions are captured as named artifacts before the session context is lost.

The system works because it treats documentation as a first-class engineering artifact. That is the only recommendation that matters: maintain it as you would maintain code.

---

## X. References

| Reference | Description |
|-----------|-------------|
| `roll2hit-v3.html` | Primary source file — 14,377 lines, all game logic and data |
| `plan.md` | Master planning document — analyzed in this report |
| `index.md` | Cross-reference manifest and lab report index |
| `lab-report-architecture-full.md` | IEEE architectural review of roll2hit-v3.html |
| `spec-engine.md` | `_S_DEFAULTS()` all 107 fields; core engine reference |
| `spec-world.md` | `WORLD_DB` and `MONSTER_POOL` architecture |
| `lab-report-web-of-connections.md` | NPC cross-reference system design |
| `lab-report-endings-and-echoes.md` | NG+ and ending system design |
| IEEE Std 830-1998 | *IEEE Recommended Practice for Software Requirements Specifications* |

---

*Lab report status: ✅ Complete — Documents plan.md purpose, keyword vocabulary, task decomposition framework, two-way sync symmetry, document role specifications, and ASCII architecture diagrams in IEEE format.*
