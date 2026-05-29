<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report — SP4 Documentation Sync Pass

**Project:** roll2hit.com — *The Shattered Codex*
**Pass Designation:** SP4 (Sync Pass 4)
**HTML Baseline:** `roll2hit-v3.html` — 17,762 lines at close
**Session Date:** 2026-05-26
**Category:** Documentation Architecture · Two-Way Sync Enforcement · Technical Debt

---

## Abstract

SP4 was a systematic documentation audit and repair pass covering all markdown documents in the roll2hit.com project against the live HTML source (`roll2hit-v3.html`). The codebase had grown from approximately 14,377 lines (last formal sync) to 17,762 lines — a +23% expansion representing Layers 44–77. During that growth, three categories of documentation debt accumulated: (1) PLANNED markers in world.md and story.md that had been superseded by completed implementations; (2) public JavaScript constants that had no `// → doc:` reverse-link to their documentation home; and (3) function table line numbers in mechanics-economy.md, combat.md, and mechanics-combat.md that had drifted by 9–3,115 lines. SP4 resolved all three categories, corrected a flag name discrepancy, validated all annotation targets, and produced FC06–FC08 as supplementary feature and quality items. Net result: 94 consts annotated, 20 stale markers cleared, 29 + 23 + 8 function table entries re-verified, 5 annotation targets corrected, 1 missing doc section created.

---

## I. Background and Motivation

### I-A. The Two-Way Sync Rule

The roll2hit.com documentation system is governed by a bidirectional invariant:

> Every item in the markdown docs traces back to `roll2hit-v3.html`. Everything in the HTML has a home doc.

This invariant was established during the SP2 documentation architecture pass. It requires two enforcement mechanisms:
1. **Outbound references** — markdown docs must cite HTML line numbers and const names for any implemented mechanic.
2. **Inbound references** — HTML source must carry `// → doc: filename.md §Section` comments on all public constants, so that a reader of the HTML can locate the narrative or design context for any given constant.

SP1–SP3 established outbound references for most core systems. SP4's primary mandate was enforcing inbound references (the `// → doc:` annotation pass) and clearing documentation that described features as planned when they had already been implemented.

### I-B. Growth Profile

| Metric | SP3 Baseline | SP4 Close | Delta |
|--------|-------------|-----------|-------|
| HTML lines | ~14,377 | 17,762 | +3,385 (+23%) |
| Implemented layers | ~45 | 77 | +32 |
| Documented consts with `// → doc:` | 27 | 94 | +67 |
| Stale PLANNED markers | 20 | 0 | −20 |
| F4 table entries (mechanics-economy.md) | 26 → 29 | 29 ✅ | corrected |
| F6 table entries (combat.md) | 23 | 23 ✅ | corrected |

The 32-layer expansion introduced the bulk of the line-number drift. Layers 44–77 added: the Cat Quarter arc, Corelli wandering merchant, romance system (21 quotes + inn vignettes + preambles), Arthurian rewrite of NPC dialogue, Brynn/Bruhns/Yael narrative arcs, Kenickie's market, Chronicle career/run stats, tattoo progression, fishing bait sub-system, Fishing Guide item, and multiple world events.

---

## II. Phase Architecture

SP4 was executed in four sequential phases. Each phase generated secondary drift that required the next phase to correct it.

### Phase 1 — Stale PLANNED Marker Scan

**Scope:** `world.md`, `story.md`

**Method:** Grep for `⚠️ PLANNED` and `[PLANNED —` markers. For each match, cross-reference the feature against `_S_DEFAULTS()` in the HTML (state fields are definitive evidence of implementation) and against the relevant const or trigger code.

**Findings:** 20 stale markers found across Layers 46, 47, 50, 53, 60–70, 73–74. All 20 confirmed implemented. One flag name discrepancy discovered: world.md cited `surveyDeliveredToAuros` but the HTML comment at line 12750 explicitly documented the correct name as `undercitySurveyDelivered`, with a note explaining the spec name was never adopted.

**Actions:**
- Layer 46 (Cat Quarter): header promoted from `[PLANNED — Layer 46]` to `[✅ Layer 46 — Implemented]`.
- Layer 47 (Outsider Merchant): spec rewritten to note the `quest_fishing_guide` mechanism superseded the original tournament/Six Fishermen design.
- Layer 50 (NPC_NG_MEMORY_LINES): `#### ⚠️ PLANNED —` → `#### NPC_NG_MEMORY_LINES *(Layer 50 — ✅ Implemented)*`.
- Layer 53 (Junction Vignettes): same heading promotion pattern.
- Layers 60–64: `## ⚠️ PLANNED —` → `## [Title] *(Layer N — ✅ Implemented)*`.
- Layers 65–74: inline markers replaced with implementation notes including HTML line numbers.
- `surveyDeliveredToAuros` corrected to `undercitySurveyDelivered` in world.md §Blue Shutters Archive.

**Residual genuine PLANNED markers** (not cleared — correctly describe unimplemented features): Layers 49 (Quest -1 World Creator), 51 (Weimar Scholar Gate), 52 (Void Archaeology), 54 (Tilbury Harbor), 55 (Visby Underground), 56 (Void Shaman), 57 (Codex Shard Origin Stories), 59 (Pressure Cascade).

---

### Phase 2 — `// → doc:` Annotation Reverse Scan

**Scope:** `roll2hit-v3.html` (all public constants)

**Method:** Grep for `^const ` to enumerate all top-level constants. Filter to non-trivial public consts (data tables, narrative text arrays, configuration objects). For each, locate the corresponding section in a markdown doc and add `// → doc: filename.md §Section` on the same line as the `const` declaration.

**Template Literal Split Problem:** Nine constants used template literal syntax where the opening backtick began on the same line as the `const` keyword. Adding an inline annotation to these would have placed the comment inside the string. The fix was to split each declaration across two lines:

```js
// Before:
const FOO = `text starts here...`

// After:
const FOO = // → doc: story.md §Section
`text starts here...`
```

The nine affected consts were: `S34_QUILL_BEAT2`, `S34_QUILL_BEAT3`, `S29_AUROS_THEORY`, `S54_JOINT_MOMENT`, `S49_BRYNN_SCENE`, `S49_SWEELINCK_SCENE_BASE`, `DEACON_CODE_TEXT`, `WECKMANN_TRAINING_LOG`, `BLUE_SHUTTERS_ARCHIVE_TEXT`. Each split added one line to the HTML, producing a cumulative +9 line shift for all consts below the first split point (~line 11,619).

**Final annotation count:** 94 consts annotated (27 from earlier passes + 67 new in SP4). Coverage: all non-trivial public consts.

---

### Phase 3 — Function Table Re-Verification

**Scope:** `mechanics-economy.md` (F4 table, 29 entries), `combat.md` (F6 table, 23 entries), `mechanics-combat.md` (8 key line references)

**Root cause of drift:** Two independent drift sources compounded.
1. The +3,385 line expansion from Layers 44–77 had shifted all functions below the insertion points.
2. The Phase 2 template literal splits added 9 more lines specifically below HTML line ~11,619, creating non-uniform drift within the already-drifted tables.

**Observed drift magnitudes:**

| Function group | Approximate drift |
|---------------|------------------|
| dice primitives (roll, rollN) | +163 lines |
| player attack group | +169–175 lines |
| calc/init group | +749 lines |
| flee/death saves group | +796 lines |
| story outcome group | +3,115 lines |
| functions above line ~11,619 (post-Phase 2) | additional +9 |
| functions above line ~10,000 (post-Phase 2) | additional +12 |

**Actions:** All 29 F4 entries, all 23 F6 entries, and 8 mechanics-combat.md references re-grepped against the live HTML and corrected. Romance const line numbers corrected (ROMANCE_QUOTES 8156→8164, NPC_ROMANCE_PREAMBLES 12020→12065, NPC_ROMANCE_VIGNETTES 12030→12075). combat.md header updated: 17,709 → 17,762 lines.

---

### Phase 4 — Annotation Target Validation

**Scope:** All 94 `// → doc:` annotations in `roll2hit-v3.html`

**Method:** Extract all unique annotation targets from HTML with grep + sed. For each `filename.md §SectionName`, verify the section name exists as a heading in the target file.

**Findings — 5 mismatched targets:**

| Const | Annotated as | Actual section |
|-------|-------------|----------------|
| `INN_DREAMS` | `story.md §Inn Sleep` | `#### ✅ Implemented — Inn Dreams` (line 1571) |
| `GATE_LOCKS` | `story.md §Gate Locks` | No section existed |
| `QUIET_RETURN_RECEIPTS` | `story.md §Quiet Return` | Content in FL3 milepoint E, no heading |
| `NPC_ACT_THREE_LINES` | `story.md §Act III NPC Lines` | Content in FL7 milepoint C, no heading |
| `SWEELINCK_NAMING_LINES` | `story.md §Sweelinck Naming Ceremony` | `### Covenant Ceremony` (line 1401) |

**Actions:**
- `INN_DREAMS`: annotation corrected to `§Inn Dreams`.
- `GATE_LOCKS`: `#### Gate Locks` section created in story.md under `## NODE NETWORK MAP` / Travel Methods, with the 4-entry block table (CR→CY Crypt Key, SC→FL Sea Cave Key, AL→SE Conclave Pass, VC→DE Toll Token).
- `QUIET_RETURN_RECEIPTS`: annotation corrected to `§FL3 — Epic Battleground Quest Chain` (FL3 milepoint E covers this precisely).
- `NPC_ACT_THREE_LINES`: annotation corrected to `§FL7 — NPC Dialogue Priority` (FL7 milepoint C covers Act III weight injection).
- `SWEELINCK_NAMING_LINES`: annotation corrected to `§Covenant Ceremony`.

**Confirmed correct:** 89 of 94 annotation targets verified against actual headings.

---

## III. Supplementary FC Items

Three feature and quality items were completed as part of the SP4 session scope:

### FC06 — Monster Drop Nerf

**Problem:** Weapon drops from monsters could produce full-quality weapons, undermining the vendor economy and creating inventory bloat at high levels.

**Solution:** `_rollMonsterWeaponDrop()` (HTML line 9520) now applies a degradation offset at drop time: `magicBonus = max(0, base − floor(random() × 4))` (range −3…0). A base +4 weapon drops as +1, +2, or +3 rather than always +4. The base item pool is unchanged; degradation is applied post-selection.

**Status:** ✅ Implemented 2026-05-26.

### FC07 — Fishing Guide + Zone Unlock Gating

**Problem:** The fishing bait sub-system (Layer 47) had no entry-point item that the player could obtain to learn about it, and the zone unlock state fields in `_S_DEFAULTS()` were wired but the gating UI was not.

**Solution:** `FISHING_GUIDE_TEXT` (HTML line 11239) — a readable item delivered via `quest_fishing_guide`. The guide explains bait tiers, biome zones, and catch mechanics. State fields `tackleboxZoneUnlocks` and `baitFishingActive` exist in `_S_DEFAULTS()`; zone gating UI (shore/reeds/deep progression) deferred to Layer 48+.

**Status:** ✅ Fishing Guide + quest_fishing_guide implemented 2026-05-26. Zone gating UI deferred.

### FC08 — Annotation Target Validation

The Phase 4 work described above was formalized as FC08 in the documentation queue, completing the two-way link convention that FC05 initiated. FC05 ensured all consts had annotations; FC08 ensured all annotations pointed to real sections.

**Status:** ✅ 2026-05-26.

---

## IV. Index and Status Document Updates

The following tracking files were updated to reflect SP4 completion:

| File | Updates |
|------|---------|
| `index.md` | Line count 17,709→17,762; FC badge FC01–FC07→FC01–FC08; status line updated; 5 new rows in Known Cross-Document Issues table; Gate Locks reverse lookup updated |
| `plan.md` | §0 status updated to SP4 complete; §V-B and §V-C removed (all FC items ✅) |
| `mechanics-economy.md` | All 29 F4 entries corrected; romance const line numbers corrected; verification note added |
| `combat.md` | All 23 F6 entries corrected; header line count corrected |
| `mechanics-combat.md` | 8 key line number references corrected; last-synced header added |
| `world.md` | 20 stale PLANNED markers cleared; `surveyDeliveredToAuros` corrected |
| `story.md` | 13 stale PLANNED markers cleared; `#### Gate Locks` section added |

---

## V. Residual Issues and Deferred Work

### V-A. Genuinely Unimplemented Layers

The following layers have PLANNED markers that were deliberately preserved. They describe features that do not yet exist in the HTML. Each requires a lab report or existing lab report review before implementation:

| Layer | Feature | Lab Report |
|-------|---------|-----------|
| 49 | Quest -1 / World Creator (Level 21) | `lab-report-quest-minus-one-world-creator.md` |
| 51 | Weimar Scholar Gate | `lab-report-weimar-scholar-gate.md` |
| 52 | Void Archaeology | `lab-report-void-archaeology.md` |
| 54 | Tilbury Harbor Arc | `lab-report-tilbury-visby-arcs.md` |
| 55 | Visby Underground | `lab-report-tilbury-visby-arcs.md` |
| 56 | Void Shaman | `lab-report-void-shaman.md` |
| 57 | Codex Shard Origin Stories | — (no lab report yet) |
| 59 | Pressure Cascade | — (no lab report yet) |

### V-B. Zone Gating UI (Fishing)

`tackleboxZoneUnlocks: {shore:true, reeds:false, deep:false}` and `baitFishingActive` are live state fields in `_S_DEFAULTS()`. The intent is that shore fishing is available immediately, reeds unlock after the Fishing Guide quest, and deep water unlocks at a higher favor or quest milestone. No UI renders the zone gate or prevents access to locked zones. All three zones are currently always accessible. Design spec required before implementation; assign to Layer 48.

### V-C. Future Sync Pass Maintenance Protocol

Line number drift is systemic and predictable:
- Any insertion of new HTML lines above an annotated function will shift all references below it.
- Template literal splits (+1 line each) propagate drift even within a sync pass.
- The recommended maintenance action is: after any session that adds ≥20 lines to the HTML, re-grep the F4 and F6 tables before committing.

The `// → doc:` annotation system is now fully deployed. The forward maintenance burden is:
1. When adding a new public const, add the `// → doc:` annotation at declaration time.
2. When adding a new section heading to a markdown doc, check whether any existing const already points to that content without a formal heading.

---

## VI. Summary Statistics

| Item | Count |
|------|-------|
| Stale PLANNED markers cleared | 20 |
| New `// → doc:` annotations added | 67 |
| Total annotated consts | 94 |
| Template literal consts split (2-line form) | 9 |
| F4 table entries re-verified | 29 |
| F6 table entries re-verified | 23 |
| mechanics-combat.md line refs corrected | 8 |
| Annotation targets corrected | 5 |
| New doc sections created | 1 (§Gate Locks in story.md) |
| Flag name corrections | 1 (surveyDeliveredToAuros → undercitySurveyDelivered) |
| FC items completed | 8 (FC01–FC08) |
| HTML lines at close | 17,762 |
| Implemented layers at close | 0–77 (§I–§XLII) |
