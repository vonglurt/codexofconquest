<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report Synthesis — Part 1: Architecture & Systems
**Cross-Reference of All Architecture Lab Reports Against roll2hit-v3.html**
**Date:** 2026-06-16 · **HTML baseline:** 33,721 lines · **Source reports:** 12

---

## Purpose of This Document

This synthesis reads each Architecture & Systems lab report alongside the live HTML and answers three questions for each: what did the report document, what does the code look like *now*, and what from the report still applies as working design knowledge. Reports are in the `lab-reports/` archive, untouched. This document is the living cross-reference.

---

## Report 1 — `lab-report-architecture-full.md`
**Original scope:** IEEE-format full architectural review at ~14,377 lines (2026-05-22)
**Still active:** Yes — describes the foundational design that all subsequent work extends

### What the report said

The game runs two engines inside one file: **Battle Mode** (`S` object, stateless per session) and **Story Mode** (`S_story` object, persisted via localStorage). Both share the dice library (`roll()`, `resolveAdv()`). Story Mode copies relevant fields into `S` for battle, then reads results back. The "one file" constraint is the primary architectural driver: every pattern that looks unusual is a consequence of zero build step, zero CDN, zero modules.

State architecture: `S` is flat and shallow (reset on refresh). `S_story` is initialized by `_S_DEFAULTS()`, merged from localStorage by `storyLoadSave()`, and persisted by `storyAutoSave()`.

### Current HTML (2026-06-16)

| Symbol | Line | Current state |
|--------|------|---------------|
| `const S = {` | 4,720 | Active — Battle Mode state; unchanged in structure |
| `const _S_DEFAULTS = () => ({` | 21,157 | Active — now ~194 fields (was ~107 at report time) |
| `storyAutoSave()` | 21,800 | Active |
| `storyLoadSave(key)` | 21,808 | Active |
| `storyRender(node, prefix)` | 27,668 | Active — now the primary Story Mode render function |
| `cellMove(dir)` | 26,002 | Added post-report — replaces `storyMove()` (§CELL-01) |

The `storyMove()` function documented in the report no longer exists — it was replaced by `cellMove(dir)` in §CELL-01 which navigates by grid direction rather than named neighbor. The core insight (two engines, shared dice, one state object) is unchanged and still governs the entire codebase.

### What still applies

- The "no framework" constraint is permanent. Every future feature must fit the one-file, one-scope model.
- `S_story` mutation discipline: any function can read and write `S_story` because all functions share file scope. This is a design choice, not a limitation — it makes the system tractable without a framework but requires that mutation remain observable (hence the `// → doc:` annotation discipline).
- The `_S_DEFAULTS()` pattern for safe state initialization is still the canonical new-game/NG+ reset mechanism.

---

## Report 2 — `lab-report-prompt-migration-arena-to-prototype.md`
**Original scope:** Retrospective on 13 layers of evolution from dice tracker to 42-node narrative game (2026-05-21)
**Still active:** Historically foundational; all named layers are implemented

### What the report said

The game evolved from a single-screen combat tracker (Arena) through 13 distinct layers. The primary architectural contribution was **specification gravity**: interlocking documents (plan, spec, mechanics, world, map, story, monsters) that exert coherent pressure on implementation decisions, preventing feature bloat and design drift. The **Cooperative DM Principle** — the mathematical invariant that enemies must always be beatable and death must always be recoverable — was identified as the philosophical core encoded in the reward formula.

### Current HTML relevance

Specification gravity is now the documentation system itself. The `index.md` / `plan.md` / `story.md` / `world.md` / `maps.md` cluster has grown to 13+ documents and still operates on the same principle: every item in the docs traces to the HTML, every item in the HTML has a home doc.

The Cooperative DM Principle survives in `_D100_TABLE` (loot that always gives something), the void mercy mechanic (`S_story.void_mercy_count`), and the `storyRespawnFromCheckpoint()` path. Death is recoverable; encounters are never unwinnable by design.

### What still applies

- The spec-first discipline: write a spec section in `plan.md` before any feature touches the HTML. This is still §I of the Project Directive.
- Layer numbering as a provenance system: knowing a feature is "Layer 39" (Epic Battlegrounds) tells you exactly when it was added and where to look for its design context.

---

## Report 3 — `lab-report-documentation-system-design.md`
**Original scope:** Two-way sync architecture analysis — plan.md as planning document, 37-file MD corpus (2026-05-24)
**Still active:** Yes — the sync discipline described here governs every session

### What the report said

`plan.md` functions as master planning document across seven zones: Directive, Design Constants, State Fields, Implementation Archive, Implementation Queue, Sync Pass Record, Feature Specs. The **two-way sync rule** — every markdown item traces to HTML, every HTML constant has a home doc — was articulated as a formal engineering invariant. The documentation system is itself software: it has a schema (`index.md` as manifest), a source of truth (the HTML), a spec layer (`plan.md`), and a test suite (sync pass increments).

### Current HTML relevance

The `// → doc: filename.md §Section` annotation pattern is live across all 94 public constants. The WORLDBUILDER anchor comments (14 pairs) added in §WBAPI-01 are the physical markers of the two-way sync at the data layer.

| Anchor pair | Lines |
|-------------|-------|
| MONSTER_POOL | 4,797–5,700 |
| WORLD_DB | 5,708–5,835 |
| NODE_MAP | 7,654–8,613 |
| NODE_COORDS | 8,618–9,054 |
| NPC_DIALOGUES | 9,146–9,362 |
| QUEST_DB | 9,365–19,816 |
| BIRKA_NPC | 20,809–21,092 |
| D100_TABLE | 22,456–22,477 |
| FISH_DB | 24,228–24,258 |

### What still applies

- The Lab Report Rule: write a lab report for major collections, multi-system redesigns, new narrative arcs (3+ nodes), pre-implementation design reviews, session postmortems with non-obvious decisions. Do not write one for single additions.
- New lab reports go to `lab-reports/lab-report-<title>.md` (updated 2026-06-16 after archive move).

---

## Report 4 — `lab-report-sp4-documentation-sync-pass.md`
**Original scope:** SP4 sync pass — closed 20 stale PLANNED markers, annotated 94 consts, corrected 29+23+8 function table entries (2026-05-26)
**Still active:** The outcomes are permanently in the HTML; the procedure is a template

### What the report said

SP4 ran a systematic audit at 17,762 lines (+23% from prior sync). Three categories of documentation debt: stale PLANNED markers in world.md/story.md; constants without `// → doc:` reverse-links; function table line numbers drifted +9 to +3,115 lines. The pass cleared all three. Net: 94 consts annotated, 20 stale markers cleared, 5 annotation targets corrected, 1 missing section created.

### Current HTML relevance

The HTML is now at 33,721 lines — nearly double the SP4 baseline. A sync pass is overdue. The `// → doc:` annotation count has not been reverified since SP4. Any new public const added after SP4 should have the annotation; the synthesis process now will verify this for newly-documented systems.

### What still applies

- The SP format (sync pass as a named increment with a baseline, closure criteria, and a report) is the right model for documentation maintenance at this scale.
- Overdue: SP5 when the HTML crosses a major milestone; probably due now given the §CELL, §ARCH, §DATA-01 additions since SP4.

---

## Report 5 — `lab-report-plan-cleanup-world-builder-arc.md`
**Original scope:** 8,127-line plan.md cleanup — extraction to 36 lab reports, plan.md reduced to active surface (2026-05-25)
**Still active:** Procedurally historical; the extraction is permanent

### What the report said

plan.md accumulated 8,200 lines because the project outgrew it — sync findings, function tables, Q-indexes, and completed-layer manifests were absorbed into plan.md while layers were still in flight. The cleanup extracted all historical material into 36 lab reports, leaving plan.md as the active planning surface (~230 lines at close). The arc from simulator (Arena) to world builder was traced: the documentation system expanded in direct proportion to the game's complexity.

### Current HTML relevance

The lab report corpus that cleanup created now has 64 entries (including this synthesis). The plan.md cleanup model — extract completed work to archive, keep active surface lean — is the template for the current lab-reports/ move.

### What still applies

- Keep plan.md as the active planning surface. Historical layer specs belong in lab reports or the archive.
- The "documentation grows with code" insight: at ~33,721 lines, plan.md would need another extraction pass if it were accumulating layer specs again. It isn't because the lab report discipline is established.

---

## Report 6 — `lab-report-timeline-history-completed.md`
**Original scope:** Complete layer-by-layer development timeline archive — Layers 0–45 (2026-05-22)
**Still active:** Historical record only; all 45 layers are implemented

### What the report said

46 named development layers (0–45) with step codes, key functions/consts, and completion status. The timeline captured the emergence of: NODE_MAP and storyMove (L1), QUEST_DB and storyCheckQuests (L2), loot/inventory (L6), inn sleep/day mechanics (L10), conditions/flashbang (L14), world map (L20), NPC dialogue (L34), fishing (L37), epic battlegrounds (L39), cat quarter (L44), Ally Cat hierarchy (L44). Also archived the Baroque composer renaming migration and all 60 S-suggestions.

### Current HTML relevance

All Layer 0–45 features are still active in the current HTML. The `storyCheckQuests()` (L2) is at line 26,291. The `QUEST_DB` (L2) is at line 9,366–19,816. `NODE_MAP` (L1) is at 7,654–8,613. The fishing system (L37) has grown substantially with lake magic and bait sub-systems (§FISH-01).

Layers 46–104 are not in this timeline report — they're documented across the quest arc and narrative lab reports (see Parts 5 and 6 of this synthesis).

---

## Report 7 — `lab-report-api-01-02-mechanics-combat-review.md`
**Original scope:** IEEE API review of mechanics.md + combat.md — 36 comparison points, 30 function table entries re-verified (2026-05-25)
**Still active:** The review outcomes are in the docs; the procedure is a template

### What the report said

§API-01 audited mechanics.md across 36 points, leading to its split into mechanics-combat.md + mechanics-economy.md. §API-02 audited combat.md's F6 Function Reference Table — all 30 entries had drifted +163 to +3,115 lines from the last sync (HTML grew from 14,377 to 17,708 lines). Corrected all 30 plus added 12 new entries.

### Current HTML relevance

The F6 table in combat.md is likely drifted again — the HTML has grown from 17,708 to 33,721 lines (+16,013 lines, +91%). A §API-03 review of combat.md's function reference would find all entries stale. This is not urgent (the functions are still there; only the line numbers are wrong) but should be part of any SP5 pass.

### What still applies

- The API Review methodology: enumerate a doc's claims, verify each against the HTML line by line, record drift, update. This is the right procedure for any documentation file that includes line numbers.

---

## Report 8 — `lab-report-wbapi.md`
**Original scope:** WBAPI first-pass design — 3 artifacts, 14 anchor comments, buffer model, parse pipeline (2026-05-29)
**Still active:** Yes — WBAPI is the active development toolchain

### What the report said

Three artifacts: `worldbuilder.html` (browser UI), `wbapi-core.js` (Node.js parse+CRUD), `api.sh`/`api/wb.js` (CLI wrapper). 14 WORLDBUILDER anchor comment pairs mark 7 data sections. The core pipeline: read HTML as text → find anchor → extract JavaScript literal → eval in sandboxed context → mutate → serialize → write back. The buffer model: mutations accumulate in memory until a write-back serialization. The nonce system prevents concurrent writes.

### Current HTML relevance

The 14 anchor pairs are still present and in the same section order (see Report 3 table above). The FISH_DB, BIRKA_NPC, and D100_TABLE anchors were added after this report as new collections were implemented. Current count: 9 unique sections, 18+ anchor comments.

The WBAPI is the active tool for all worldbuilder operations. The `wbapi-server.js` runs on port 1367. The `api.sh` wrapper is the primary CLI. Nothing documented in this report has been superseded.

### What still applies

- WORLDBUILDER anchor pairs are a contract: if you add a new top-level data collection to the HTML, add the anchor pair so the WBAPI can find it.
- The "read as text, never execute" principle: the WBAPI parser never runs the whole HTML as JavaScript. It extracts and evals only the data sections it needs.

---

## Report 9 — `lab-report-wbapi-architecture.md`
**Original scope:** WBAPI internal architecture — Proxy model, comment-aware brace counting, request lifecycle (2026-05-30)
**Still active:** Yes — the described architecture is the live wbapi-server.js

### What the report said

The parsing pipeline: HTML text → `extractObj(html, anchor)` finds the data section → `removeFns(objStr)` strips function-valued properties (since functions can't be round-tripped through JSON) → the cleaned object literal is evaled in a sandboxed `Function('return ...')` call → mutations are applied → `JSON.stringify` → write back into the HTML at the anchor. **Comment-aware brace counting** is the key insight: brace counting must skip `//` line comments and `/* */` block comments, or a `{` inside a comment string falsely inflates depth.

### Current HTML relevance

The `extractObj` + `removeFns` + comment-aware brace counting pipeline directly explains the `QUEST_DB` parsing in §DATA-01. The `removeFns` step is why `completeFn` and `activateCond` (arrow functions) are not round-trippable through the WBAPI — they survive in the HTML but don't survive a WBAPI read-write cycle unless handled specially.

The §DATA-01 separation of `onPass`/`onFail` into `QUEST_ACTIONS`/`QUEST_EFFECTS`/`QUEST_HOOKS` makes those fields WBAPI-safe: `QUEST_EFFECTS` contains only plain data objects, which survive `removeFns` and `JSON.stringify` cleanly.

### What still applies

- The Proxy model: worldbuilder.html uses a P proxy object that intercepts property access and calls WBAPI endpoints. This is the bridge between UI clicks and HTML mutations.
- `removeFns` is necessary because the HTML contains arrow functions in data objects. `completeFn`, `activateCond`, and (formerly) `onPass`/`onFail` were all affected. Now only `completeFn` and `activateCond` remain as functions in QUEST_DB — a future WBAPI-02 could convert those to declarative predicates as well.

---

## Report 10 — `lab-report-wbapi-evolution.md`
**Original scope:** Evolution of world data access from grep through WBAPI — 6 phases (2026-05-29)
**Still active:** Historical; all 6 phases are superseded by the current WBAPI

### What the report said

Six evolutionary phases: raw `grep` → `sed` stream editing → Perl one-liners → Python AST attempts → bare Node.js extraction → full JavaScript parser (WBAPI). Each phase was driven to failure by a specific constraint: grep couldn't mutate; sed couldn't handle multi-line objects; Python AST failed on non-standard JS syntax; bare Node couldn't handle the `removeFns` + brace-count problem. The final WBAPI is the only approach that correctly handles all constraints.

### What still applies

- The constraint catalog is a warning list for anyone trying to write their own parser: JavaScript object literals with multi-line strings, arrow functions, nested objects, and inline comments require comment-aware character-level brace counting, not regex or AST parsing.
- Never use `JSON.parse` directly on a JS object literal from the HTML — they're not valid JSON (unquoted keys, trailing commas, arrow functions). Always use `removeFns` + `Function('return ...')`.

---

## Report 11 — `lab-report-quest-api-architecture.md`
**Original scope:** UQF v1.0 schema + Mission Bit Registry + QuestRuntime design + 5-phase migration (2026-05-28)
**Still active:** Phase 1 implemented; Phases 2–5 partially superseded by §DATA-01

### What the report said

Universal Quest Format (UQF) v1.0: a single declarative schema for all mission types (main/side/skill_check). Mission Bit Registry: 8 atomic bit kinds (flag_set, flag_check, item_grant, item_take, xp_award, gold_award, npc_dialog, battle_gate) with typed contracts. `QuestRuntime` singleton as a live-migration bridge. 5-phase migration: (1) add UQF skeleton, (2) instrument live quests, (3) migrate skill_check quests, (4) migrate side/main, (5) retire legacy path.

### Current HTML relevance

| Symbol | Line | Status |
|--------|------|--------|
| `const SCHEMA_VERSION = 'UQF-1.0'` | 20,474 | Active — Phase 1 skeleton present |
| `const QuestRuntime = {` | 20,476 | Active — stub with `run()` + `adaptLegacyQuest()` |
| `const QUEST_EFFECTS = {` | 19,837 | Active — **§DATA-01 advance** of Phase 2 intent |
| `const QUEST_HOOKS = {` | 20,141 | Active — engine handler registry |
| `function applyQuestEffects(effs)` | 19,819 | Active — effect interpreter |

§DATA-01 (2026-06-16) delivered a practical implementation of the declarative outcome vision: `QUEST_EFFECTS` is the "Mission Bit Registry" made concrete for the pass/fail path. The UQF report's Phase 2 (`completeFn` + `activateCond` declarative conversion) remains open — 166 `completeFn` and 1,731 `activateCond` arrow functions are still in `QUEST_DB` as code.

### What still applies

- The Mission Bit type taxonomy is correct and now maps directly to `QUEST_EFFECTS` effect types (`e:'flag'` = flag_set, `e:'item'` = item_grant, `e:'xp'` = xp_award, `e:'gold'` = gold_award, `e:'mbit'` = mission_bit).
- `QuestRuntime.adaptLegacyQuest()` remains the bridge to the UQF world. Phase 3–5 migration is the next architecture milestone.

---

## Report 12 — `lab-report-quest-data-code-separation.md`
**Original scope:** §DATA-01 — data-code boundary enforcement (2026-06-16)
**Still active:** Yes — the described architecture is the live HTML

### What the report said

(Full summary in the report itself.) Key outcomes: `storyShowNpc` `quoteFn` fix; `ZRH` → `DFL` Dunfall node rename; `QUEST_DB` purged of 127 `onPass`/`onFail` functions; `QUEST_EFFECTS` (121 declarative entries) + `QUEST_HOOKS` (91 named handlers) + `applyQuestEffects` (10-case dispatch); `q.title/desc/hint` via `textContent` not `innerHTML`.

### What still applies

Everything described is live. The open question: `completeFn` (166) and `activateCond` (1,731) are still functions in `QUEST_DB`. These are predicate functions (return boolean) rather than action callbacks, so they have different risk and conversion profiles. A future §DATA-02 could convert `completeFn` to a declarative completion check format.

---

## Architecture Summary — What Is Structurally True Right Now

**One file, one scope, one state object.** `S_story` at line 21,157. `S` at line 4,720. All functions share file scope. No framework. No modules. 33,721 lines.

**Two engines, shared dice.** Battle Mode (`S`) and Story Mode (`S_story`) share `roll()`, `resolveAdv()`, and the damage resolution layer. They never merge state.

**Nine WORLDBUILDER-anchored data sections.** The WBAPI toolchain reads/writes all nine via anchor comment pairs. QUEST_DB (lines 9,365–19,816) is the largest section at ~10,450 lines.

**Three-layer quest architecture.** `QUEST_DB` (pure data, 1,695+ quests), `QUEST_EFFECTS` (declarative outcomes, 121 entries), `QUEST_HOOKS` (named engine handlers, 91 entries). `applyQuestEffects` is the only execution path from quest data to game state mutation.

**Documentation as software.** `index.md` is the manifest. `plan.md` is the active spec. Lab reports are the archive. The two-way sync rule is the invariant. The `// → doc:` annotation is the inbound link. The WORLDBUILDER anchor pair is the machine-readable boundary.

---

*Synthesis Part 1 of 7 · Next: Part 2 — Combat & Mechanics · 2026-06-16*
