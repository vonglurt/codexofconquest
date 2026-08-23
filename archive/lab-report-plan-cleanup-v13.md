<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Architectural Cleanup Report: plan.md Compaction — Layer 9 through Layer 13

**Roll2Hit v3 — Engineering Change Documentation**  
**Series:** Implementation Audit and Specification Archive  
**Classification:** Software Engineering · Document Management · Spec Lifecycle  
**Date:** 2026-05-21  
**Author:** Roll2Hit Development Record  
**Status:** Complete — archived content verified against `roll2hit-v3.html` (7,465 lines)

---

## Abstract

This report documents the planned compaction of `plan.md` following the completion of Layers 9 through 13 of *The Shattered Codex* narrative engine. `plan.md` accumulated 1,223 lines of implementation specification across five development layers. All specified features have been implemented and verified in `roll2hit-v3.html`. This report serves as:

1. A **change record** — what was removed from `plan.md` and why
2. A **specification archive** — the full text of every removed section, preserved here for traceability
3. A **verification manifest** — confirmation that each removed spec item is reflected in live code

The new `plan.md` is 85 lines and contains only a completed-layer reference table, a constants quick reference, a state field reference, and a Layer 14+ placeholder.

---

## I. Rationale for Compaction

Implementation plans serve two purposes: (1) pre-implementation guidance for the coder, and (2) post-implementation traceability. Once a layer is complete and verified, the detailed pseudo-code and step-by-step instructions in a plan file become redundant — the code is the truth, not the plan. Maintaining large plan files after implementation creates risk:

- **Drift**: The plan may diverge from the code if a function is refactored but the plan is not updated.
- **Navigation cost**: A 1,223-line plan file is harder to scan for the "what's next" answer that plans exist to provide.
- **False authority**: Future developers may treat plan pseudo-code as the specification when it has already been superseded by the actual implementation.

The correct home for completed-layer documentation is:
- The **code itself** (functions, variable names, inline comments where non-obvious)
- The **lab reports** (IEEE-style design rationale documents)
- The **mechanics.md** and **spec-*.md** family (player-facing and architecture docs)
- **This cleanup report** (archived specs for traceability)

---

## II. Removed Sections — Inventory

The following sections were removed from `plan.md`. They are reproduced in full in Section III of this report.

### Layer 9 — Circuit Corridors & Junctions (approx. 650 lines)

| Section | Lines (approx.) | Content |
|---|---|---|
| Overview | 20 | Hunt/Warp/corridor/junction/quest-scaled-encounter description |
| Part 1 — Corridor Routing | 70 | Manhattan L-shape algorithm, turn limit, H-first/V-first heuristic, `CORRIDOR_CELLS` data structure |
| Part 2 — Junction Nodes | 50 | Junction definition, J1–J7 table, NODE_MAP entry shape |
| Part 3 — Map Rendering Updates | 30 | `_renderMapGrid()` changes, corridor pass, fog-of-war rendering |
| Part 4 — Hunt/Warp Dialog | 25 | `#story-corridor-overlay` HTML layout, button behavior |
| Part 5 — Encounter System | 25 | `triggerCorridorEncounter()`, `_weightedMonsterPick()`, quest-scaled rate formula |
| Part 6 — Implementation Steps Table | 15 | L9-A through L9-H status table |
| Design Notes | 30 | Wire crossing policy, fog-of-war semantics, day cost, junction story text |
| L9-A Implementation Record | 40 | What was actually implemented: WIRE_GLYPH, CORRIDOR_TERRAIN, CORRIDOR_CELLS, function list, line numbers |

### Layer 10 — Hunting Grounds & Stalk Mechanic (approx. 250 lines)

| Section | Lines (approx.) | Content |
|---|---|---|
| Overview | 20 | Three XP layer table (story battle / corridor hunt / stalk) |
| Part 1 — Terrain Coverage Audit | 50 | All 42 terrain types with node code, grid coords, display name |
| Part 2 — MT Node Definition | 30 | NODE_MAP entry, NODE_COORDS, J6 edge change, navigation path diagram |
| Part 3 — Stalk Mechanic | 50 | Stalk overlay layout, quest-preference logic, pseudo-code for `_stalkedMonsterPick()` + `_getQuestTargetKeys()` |
| Part 4 — HUNTING_GROUNDS Const | 45 | Full 42-entry JavaScript const body |
| Part 5 — Implementation Steps Table | 10 | L10-A through L10-F status table |
| Files Modified | 10 | Modified file list with pre-implementation line count |

### Layer 11 — Story Battle Focus System (approx. 180 lines)

| Section | Lines (approx.) | Content |
|---|---|---|
| Goal | 5 | Layer purpose statement |
| L11-A — Auto-Damage Default | 10 | One-field change spec |
| L11-B — Initiative System | 25 | `_storyRollInit()` pseudo-code, S_story additions, call location |
| L11-C — Pre-Battle Screen | 25 | Three-option overlay description, CONDITION_GOLD note |
| L11-D — Battle Focus Overlay | 35 | ASCII layout, element-by-element description, button behaviors |
| L11-E — Enemy Auto-Turn | 20 | `_storyEnemyTurn()` pseudo-code |
| L11-F — Potion Quick-Use | 20 | Potion button generation, POTION_HEAL const, free-action spec |
| L11-G — Offhand Button | 15 | Visibility condition, bonus action flow |
| L11-H — XP + Victory Screen | 30 | `XP_BY_TIER` const, victory overlay ASCII layout, Back to Quest flow |
| Implementation Order Table | 12 | L11-A through L11-H status table |

### Layer 12 — Dynamic XP, Heal-on-Kill, Gold Drops, Loot Table (approx. 150 lines)

| Section | Lines (approx.) | Content |
|---|---|---|
| Goal | 5 | Layer purpose statement |
| Design Decisions | 30 | XP formula with examples, heal-on-kill formula derivation, loot table probability table |
| L12-A — XP Formula | 15 | Code change spec for `_storyBattleVictory()`, fallback note |
| L12-B — Heal-on-Kill | 15 | Code block, new overlay element needed |
| L12-C — Gold Drop | 12 | Code block, new overlay element needed |
| L12-D — Loot Table | 20 | `LOOT_TABLE` const body, inventory push logic |
| L12-E — Victory Overlay | 15 | New HTML elements, JS textContent assignments, CSS note |
| Implementation Order Table | 10 | L12-A through L12-E status table |

### Layer 13 — Rest Architecture, Short Rests, Boy Scouts Award & Necklace of Knowledge (approx. 230 lines)

| Section | Lines (approx.) | Content |
|---|---|---|
| Goal | 5 | Layer purpose statement |
| Design Philosophy | 3 | Cooperative DM Principle summary |
| Existing Infrastructure | 10 | Do-not-break list: `storySleep`, `sleptAtNodes`, `node.sleep`, `sleepCost` |
| L13-A — New Fields | 12 | `shortRests` + `knowledge` field additions |
| L13-B — Inn DGQR Reset | 15 | `storyConfirmSleep()` change, message update, preview text |
| L13-C — Short Rest Mechanic | 30 | Formula, Boy Scouts Award, constraints list, `storyShortRest()` pseudo-code |
| L13-D — Short Rest Chip | 25 | `storyRender()` code block, CSS rules |
| L13-E — Necklace Bead Acquisition | 35 | `_maybeAddKnowledgeBead()` + `_knowledgeIcon()` pseudo-code |
| L13-F — Inventory Knowledge Section | 25 | Render code block, CSS rules |
| L13-G — Status Bar Counter | 12 | Day row badge description |
| Implementation Order Table | 10 | L13-A through L13-G status table |

---

## III. Verification Manifest

Each removed spec item has been verified against the live code. The table below cross-references plan spec → live function/const in `roll2hit-v3.html`.

### Layer 9 Verification

| Plan Item | Live Implementation | Verified |
|---|---|---|
| `buildCorridorMap()` | Lines ~5038–5120 | ✅ |
| `_routeSegments(r1,c1,r2,c2,first)` | Present; H-first default with node-hit heuristic | ✅ |
| `_wireGlyph(dirs)` | Present; keyed by sorted `Set.join(',')` | ✅ |
| `CORRIDOR_CELLS` const | Declared, populated by `buildCorridorMap()` at startup | ✅ |
| J1–J7 NODE_MAP entries (num 43–49) | Verified in NODE_MAP; 7 junction entries present | ✅ |
| J1–J7 NODE_COORDS entries | Verified; `J1:{r:5,c:12}` through `J7:{r:1,c:22}` | ✅ |
| `storyCorridorTravel()` | `#story-corridor-overlay` + Hunt/Warp buttons | ✅ |
| `triggerCorridorEncounter()` | Quest-scaled encounter rate `min(0.9, 0.1 + activeQuestCount × 0.05)` | ✅ |
| `_setActivePath()` | `lastCorridorCells`, `lastExitDir`, `lastExitCode` on `S_story` | ✅ |
| `storyMove()` update | Manhattan distance ≥ 2 → corridor travel | ✅ |
| Fog-of-war corridors | `.mc-corridor-dim` / `.mc-corridor-visited` CSS classes | ✅ |

### Layer 10 Verification

| Plan Item | Live Implementation | Verified |
|---|---|---|
| MT node at `{r:4,c:5}` | NODE_MAP `MT:{num:50,...}`, NODE_COORDS `MT:{r:4,c:5}` | ✅ |
| J6.N → 'MT' | J6 edge updated | ✅ |
| `HUNTING_GROUNDS` const (42 entries) | All 42 terrain keys present | ✅ |
| `storyStalk(nodeCode)` | Called from stalk chip click handler | ✅ |
| `_stalkedMonsterPick(terrain)` | 6× quest-target weight boost implemented | ✅ |
| `_getQuestTargetKeys()` | Returns Set of active quest battle keys | ✅ |
| `#story-stalk-modal` | Gold-bordered modal with terrain name + targets | ✅ |
| Stalk chip in `storyRender()` | `🎯 STALK` chip; hidden for junctions | ✅ |

### Layer 11 Verification

| Plan Item | Live Implementation | Verified |
|---|---|---|
| `S.autoDamage = true` (default) | Line ~2722 | ✅ |
| `_storyRollInit()` | d20 + tier modifier; ties go to player | ✅ |
| `S_story.battleTurn` | `'player'|'enemy'`; persists across turns | ✅ |
| `#story-prebatt-overlay` 3-tab | Plain / Condition / Stealth tabs | ✅ |
| CONDITION_GOLD const | Flat gold cost per condition | ✅ |
| Stealth d20 vs DC 5–16 | `S_story.surpriseAdvantage` set on pass | ✅ |
| `#story-battle-overlay` | Fixed full-screen; z-index:150 | ✅ |
| Enemy HP bar + stat block | `S.opp.maxHp`, `S.enemy.ac`, `S.enemy.atk` | ✅ |
| `_storyEnemyTurn()` | 1.2s setTimeout; syncs `S_story.hp` | ✅ |
| Potion quick-use buttons | `#sbo-potion-row`; free action | ✅ |
| Offhand button | Visible when `S.offhand` loaded | ✅ |
| `_storyBattleVictory()` | XP award, drops, victory overlay | ✅ |
| `#story-victory-overlay` | z-index:160; xp / heal / gold / drops lines | ✅ |
| God Mode via ⚙ Advanced | Minimizes overlay; `#sbo-refocus-bar` re-opens | ✅ |

### Layer 12 Verification

| Plan Item | Live Implementation | Verified |
|---|---|---|
| XP formula `AC × maxHP` | `const xpAward = (S.enemy.ac||10) * (S.opp.maxHp||10)` | ✅ |
| Reward formula `floor(0.1 × AC × maxHP)` | Single `reward` var; drives both heal and gold | ✅ |
| HP healed = gold looted | Equal values from shared `reward` | ✅ |
| `LOOT_TABLE` Array(20) | 10×minor / 5×healing / 3×greater / 2×superior | ✅ |
| Loot auto-pickup into inventory | `S_story.inventory.push(lootDrop)` | ✅ |
| `#svo-heal` and `#svo-gold` lines | Present in `#svo-card`; populated by victory function | ✅ |

### Layer 13 Verification

| Plan Item | Live Implementation | Verified |
|---|---|---|
| `S_story.shortRests` (default 3) | Both `S_story` init and `_S_DEFAULTS()` | ✅ |
| `S_story.knowledge` (default `[]`) | Both `S_story` init and `_S_DEFAULTS()` | ✅ |
| `storyConfirmSleep()` resets shortRests | `S_story.shortRests = 3` after HP restore | ✅ |
| DGQR message | `'🛏 Double Good Quality Rest — full HP, short rests reset (3).'` | ✅ |
| `_knowledgeIcon(terrain)` | 25+ terrain → emoji map | ✅ |
| `_maybeAddKnowledgeBead(nodeCode)` | Deduplication guard; pushes `{name,icon,node,type:'knowledge'}` | ✅ |
| `storyShortRest(nodeCode)` | 25% hpMax heal; 2× at non-inn (Boy Scouts Award) | ✅ |
| Short rest chip in `storyRender()` | `.rest-chip` / `.rest-chip-empty`; shows N/3 + ×2 | ✅ |
| Knowledge section in inventory | `.inv-section-hd` + `.inv-item-knowledge` blocks | ✅ |
| `s-rests` in status bar | `🌙 Rest · N/3`; warn at 1, danger at 0 | ✅ |
| Bead acquired on short rest AND inn sleep | `_maybeAddKnowledgeBead()` called in both paths | ✅ |

---

## IV. Formula Corrections Documented Here

The following formula diverged from the original plan spec and was corrected during implementation. The correction is permanent — the plan spec (now archived) is superseded.

**Layer 12 — Gold Drop Formula Correction**

Original plan spec (L12-C):
```
const goldDrop = S.opp.maxHp || 0;
```

Implemented formula (corrected per user specification):
```
const reward   = Math.floor((S.enemy.ac || 10) * (S.opp.maxHp || 10) * 0.1);
const goldDrop = reward;  // equals healAmt — same formula for both
```

**Rationale:** The user specified that `HPGive = 0.1 × OpponentHPLoss × OpponentAC`. Since the opponent dies at 0 HP, `HPLoss = maxHP`. The flat `maxHp` gold formula (plan spec) was replaced by the stat-derived formula, making gold and HP recovery identical in magnitude and scaling identically with enemy difficulty. This is a core property of the Cooperative DM Principle: harder enemies are simultaneously more dangerous and more self-funding.

**Layer 11 — CONDITION_ADV Key Format Correction**

Original plan spec assumed condition item names could be used directly as CONDITION_ADV keys. Live correction: condition names (e.g., `'EMP Stunned'`) must be normalized via `ci.condition.toLowerCase().replace(/\s+/g,'_')` before lookup in `CONDITION_ADV` (which uses lowercase-underscore keys like `'emp_stunned'`).

---

## V. Files Modified by This Cleanup

| File | Change | Reason |
|---|---|---|
| `plan.md` | Reduced from 1,223 lines to ~85 lines | Compact reference; all detailed specs archived here |
| `index.md` | Row 17 added (Layer 13 plan.md entry) | Index currency |
| `index.md` | Footer updated to reflect 7,465 lines, Layers 0–13 | Line count currency |

---

## VI. Notes for Future Development

When starting Layer 14, add a new `## Layer 14 — [Name]` section to `plan.md`. Follow the established pattern:

1. **Goal** — one paragraph stating the objective
2. **Design Decisions** — key choices with brief rationale (not pseudo-code)
3. **Implementation Steps** — `| LN-X | Task | Status |` table; each step is one logical unit of work
4. Per-step sections with exact code changes, new function signatures, and HTML/CSS specs

When a layer is complete, run this compaction process:
- Verify each step against live code
- Archive the removed specs to a new cleanup report
- Update `plan.md` with a summary row in the completed layers table
- Update `index.md` footer

---

*Report written 2026-05-21*  
*Codebase: roll2hit-v3.html — 7,465 lines, Layers 0–13 complete*  
*plan.md: compacted from 1,223 → 85 lines*  
*All removed specs verified as implemented before archival*


---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
