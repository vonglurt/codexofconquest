<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — SP4 Documentation Sync Pass

**Project:** CodexOfConquest.com — *The Shattered Codex*
**Pass Designation:** SP4 (Sync Pass 4)
**Session Date:** 2026-05-26 · **Ship commits:** `9684ff6` (Phases 1–3, FC06–FC07) · `ded062e` (Phase 4, FC08)
**HTML baseline at close:** 17,762 lines — **verified exact at both ship commits**
**Category:** Documentation Architecture · Two-Way Sync Enforcement · Technical Debt
**Verification:** §DOC-02ak, 2026-08-12 — re-measured against live `play.html` (38,712 lines), 78 days on.

---

## Abstract

SP4 audited every Markdown document against the live HTML and repaired three classes of drift: stale
`PLANNED` markers describing features that had already shipped; public constants with no reverse link to
their documentation home; and function-reference line numbers that had drifted by up to 3,115 lines. The
pass introduced the `// → doc:` inbound annotation — a comment on a constant's declaration naming the doc
section that explains *why that constant exists* — and deployed it across 94 constants in a single commit.

**Verification result.** Everything SP4 *measured* is exact: 17,762 lines, 94 annotations, nine template
literal splits, and a flag-name correction that survives in the engine to this day. Everything SP4
*assumed* is wrong, and it is wrong in one direction: the eight layers it set aside as "genuinely
unimplemented" were **all eight already implemented in the commit SP4 itself shipped**, provable by the
report's own stated test. The pass verified what it changed and assumed what it left alone.

---

## I. Intention and Inspiration

### I-A. Why an annotation system helps the *game*

CodexOfConquest.com is one static HTML file. A reader who opens it finds `const S29_AUROS_THEORY@27184` — a
template literal of dialogue — with no indication of who Auros is, what he is theorising about, when the
scene fires, or which of the game's several hundred narrative threads it closes. The prose reads as
orphaned text. The design intent lives in `world.md`, in a paragraph the reader has no way to find.

SP4's premise is that **this lookup cost is a content-velocity tax, and content velocity is playability.**
The pass ran against a file that had grown 23% in a matter of days across Layers 44–77 — the Cat Quarter,
Corelli, the romance layer, the Arthurian dialogue rewrite, Kenickie's market, the tattoo track, the
fishing sub-system. That cadence is only sustainable if an author can move between a constant and its
narrative context without re-reading the world. The `// → doc:` annotation buys that in one line:

```js
const S29_AUROS_THEORY = // → doc: world.md §S29 — Auros/Froberger theory (fires at CY when frobergerLas…)
```

The player never sees the comment. The player sees its consequence: scenes that stay coherent because the
author who edited one could find the three documents describing what it was for. Every arc that shipped in
the 78 days since — the Crown of the Swamp, the Littoral Courts, the Saul-to-Paul road — was authored
against a file annotated by this pass.

### I-B. The bidirectional invariant

> Every item in the Markdown docs traces back to `play.html`. Everything in the HTML has a home doc.

Two mechanisms are required. **Outbound** references — docs citing HTML symbols — were established by
SP1–SP3. **Inbound** references — the `// → doc:` comments — are SP4's mandate, alongside clearing docs
that described shipped features as planned.

---

## II. Method and Phase Architecture

Four sequential phases, each generating drift the next had to correct.

| Phase | Scope | Stated method |
|-------|-------|---------------|
| 1 | `world.md`, `story.md` | Grep `PLANNED` markers; cross-reference each feature against `_S_DEFAULTS()` — *"state fields are definitive evidence of implementation"* |
| 2 | `play.html` | Enumerate top-level `const`; add `// → doc: file.md §Section` at each declaration |
| 3 | `mechanics-economy.md` (F4), `combat.md` (F6), `mechanics-combat.md` | Re-grep every function-table line number |
| 4 | All annotations | Extract each `file.md §Section` target; verify the section exists **as a heading** |

**Template-literal split.** Nine constants opened a backtick on the `const` line, so an inline comment
would have landed inside the string. Each was split across two lines, adding +9 lines below ~11,619 and
compounding Phase 3's drift with a second, non-uniform source.

---

## III. Verification — As-Built Delta Table

Live measurement at HEAD (38,712 lines) unless stated. Report figures scored at ship commit `9684ff6`
where the claim concerns the past (instruments 11/18).

| # | SP4 claim | Measured | Verdict |
|---|-----------|----------|---------|
| 1 | HTML 17,762 lines at close | 17,762 at `9684ff6` **and** `ded062e` | ✅ exact |
| 2 | 94 consts annotated | 94 at both ship commits; 93 at HEAD | ✅ exact |
| 3 | *"27 from earlier passes + 67 new"* | **0** at `9684ff6^` — the string `doc:` occurs **zero times in any form** | ❌ **never shipped** |
| 4 | 9 template-literal splits | all 9 live, still in 2-line form | ✅ 9/9 |
| 5 | `surveyDeliveredToAuros` → `undercitySurveyDelivered` | correction survives as engine comment `not surveyDeliveredToAuros@28235`; spec name has 1 occurrence, that comment | ✅ exact |
| 6 | 20 stale markers cleared | 19 (`world.md`) + 2 (`story.md`) = **21** | ✅ within rounding |
| 7 | §IV: *"story.md — 13 markers cleared"* | story.md held **6** marker lines in total pre-pass | ❌ **arithmetically impossible** |
| 8 | Phase 4: 5 targets corrected | 4 of 5 hold at HEAD (`§Inn Dreams`, `§FL3`, `§FL7`, `§Covenant Ceremony`) | ✅ 4/5 |
| 9 | New section `story.md §Gate Locks` | created; `GATE_LOCKS` **0 occurrences** (retired `5123f5a`, two days later) | ❌ **orphaned** (Finding 3) |
| 10 | 89 of 94 targets valid | HEAD: **45/82** by SP4's heading test, **73/82 (89 %)** by content | ⚠️ instrument decayed, not corpus (Finding 4) |
| 11 | FC06 `magicBonus = max(0, base − floor(random()×4))` | pool pre-filtered `magicBonus === 0`; `deg = Math.min(0, d6 - 5)@24652` → **−4…0** | ❌ different mechanism (Finding 5) |
| 12 | FC07 `FISHING_GUIDE_TEXT` + `quest_fishing_guide` | both live | ✅ |
| 13 | V-B: zone gating UI *"deferred"*, *"all three zones always accessible"* | shipped `59cc13b`, **10 h 47 m later** — `Unlocks after landing a Large fish@30630` | ❌ inverted (Finding 6) |
| 14 | `baitFishingActive` *"wired"* | **1 occurrence** — `tackleboxZoneUnlocks: {shore:true@23140` — declared, never read | ❌ → §DX-02n |
| 15 | V-A: 8 layers *"do not yet exist in the HTML"* | **0 of 8** — all carry `// ── Layer N ──` markers at `9684ff6` | ❌ **total** (Finding 1) |
| 16 | F4 = 29 entries, F6 = 23 | F4 = **26**, F6 = **55**; both still bare line numbers | ❌ → §DX-02aw (Finding 8) |
| 17 | Annotation target `froberger-journal-all-entries.txt` | file lives at `src/sources/…`; path unresolvable | ❌ path stale |

**Census:** 25 of 26 named identifiers resolve (**96 %**) — the second-strongest survival in the program
after §DOC-02g's 95 % on a shorter list. The single dead symbol is `GATE_LOCKS`.

---

## IV. Findings

### Finding 1 — The residual set is 0 for 8, and it fails the report's own test

§V-A preserves eight `PLANNED` markers as *"features that do not yet exist in the HTML."* Every one of the
eight carries an implementation marker comment **in the commit SP4 shipped**:

| Layer | Feature | Evidence at `9684ff6` |
|-------|---------|----------------------|
| 49 | Quest −1 / World Creator | `// ── Layer 49: §XIV Quest -1 — The Open Door ──` |
| 51 | Weimar Scholar Gate | 6 marker comments + `// Layer 51: Weimar Scholar Gate@23160` **inside `_S_DEFAULTS()`** |
| 52 | Void Archaeology | 4 markers + `// Layer 52: Void Archaeology` inside `_S_DEFAULTS()` |
| 54 | Tilbury Harbor | 26 references (nodes, quests) |
| 55 | Visby Underground | 29 references; `vsDebtProbed`/`vsWeaponsFound`/`vsDebtSettled` |
| 56 | Void Shaman | `// ── Layer 56: The Void Shaman ──`; node `EG` *"Void Shaman's Sanctum"*; `quest_eg_primary` |
| 57 | Codex Shard Origin Stories | `// ── Layer 57: Codex Shard Origin Stories ──` + readable-note table |
| 59 | Pressure Cascade | `// ── Layer 59: Pressure Cascade ──@27067` — **and SP4's own Phase 2 annotated its const** |

Layer 59 is the sharpest instance: Phase 2 wrote `const NPC_VOID_PRESSURE_LINES@27068` pointing at
`world.md §The Pressure Cascade`, while §V-A of the same report declared that layer unimplemented. One
commit contradicts itself.

Phase 1's stated method — *"cross-reference the feature against `_S_DEFAULTS()`; state fields are
definitive evidence of implementation"* — was not merely adequate to catch this. `_S_DEFAULTS()` at
`9684ff6` carries **section comments naming the layers by number**, with their fields beneath. A single
grep of the pass's own designated evidence source returns *implemented* for Layers 51, 52 and 56.

***The instrument this yields: a verification pass tests what it CHANGES and assumes what it LEAVES.***
Effort follows the edit. The residual set — the rows a pass deliberately preserves — receives no
verification at all precisely because preserving them requires no work, and it is therefore where a sync
pass's errors concentrate. This is the inverse of §DOC-02j's Appendix-A inversion: there a status block
read as stale only against HEAD; here it was wrong on the day, and the cost is still being paid.

**Live consequence.** Four of those headings survive in `world.md` at HEAD, 78 days on — Layers 51, 52,
56, 57. Layer 56 is marked `#### ⚠️ PLANNED — The Void Shaman` in `world.md:280` and
`#### ✅ Layer 56 — The Void Shaman` in `story.md:1697`. **The two home docs disagree about the same
feature**, which is the precise defect Phase 1 existed to eliminate, in the two files it ran against.

### Finding 2 — *"27 from earlier passes"* never existed

§I-B's Growth Profile table reports annotated consts as `27 → 94`. At `9684ff6^` the substring `doc:`
occurs **zero times** in the file — not in the `// → doc:` form, not in any variant. `git log -S --reverse`
names `9684ff6` the first commit in the file's history to contain the form. All 94 landed at once.

**Corpus correction to §DOC-02i.** That increment scored recommendation FC05 as *"half-shipped — 93
`// → doc:` pointers in the HTML, the doc half 0 commits ever."* The pointers exist, but FC05 did not ship
them; SP4/FC08 did, two days later, and back-credited 27 to a pass that wrote none. FC05's honest score is
**shipped nothing under its own name**. Instrument 12 in its purest form: the number the author measured
(94) is exact, the number describing prior state (27) is invented.

### Finding 3 — The one section SP4 created outlived its constant, then was laundered

SP4's sole new doc section is `story.md §Gate Locks`, written to give `GATE_LOCKS` a home. At HEAD:

- `GATE_LOCKS` — **0 occurrences**. Retired at `5123f5a` (2026-05-28), *two days after SP4 shipped*.
- `_canTravelTo()` — **0 occurrences**; the section describes it as firing *"before any node transition."*
- The section states that travel is **blocked** when an item is absent. That is not merely absent from the
  engine; it is a **forbidden design**. Invariant #1 refuses a step for exactly two reasons, `oob` and
  `impassable`, and `cellMove` at HEAD honours that. No quest, flag or item may refuse a step.
- The section still cites *"HTML line 10864."*

Three passes then walked over it. §NAV-01's 2026-07-03 sync **found this exact defect** — `index.md`
records *"stale GATE_LOCKS section retired"* and *"`GATE_LOCKS` gone from code (docs claimed 4 live
gates)"* — retired the `maps.md` copy, and missed the `story.md` copy SP4 had minted. §AUDIT-03m then
annotated the section's four legacy code pairs into tidy live ones: `` `KRN` (historical `CR`) `` →
`` `HKG` (historical `CY`) ``, and three more.

***This is §AUDIT-03m-FU's laundering lesson at full strength: annotation without verification converts a
wrong claim into a confident-looking live one.*** The earlier instance mislabelled one NPC's node. This
one dressed a deleted constant and a banned mechanic in current node codes.

### Finding 4 — The validator decayed; the corpus largely did not

Re-running Phase 4's stated test at HEAD — *does the annotated `§Section` exist as a heading?* — returns
**45 of 82**. That reads as catastrophic decay from SP4's 89 of 94. It is not.

`world.md` carries 78 headings across 1,333 lines and names its sections as **bold paragraph subjects**:
`**Blue Shutters Archive** (…)`, `**S29 — Auros/Froberger theory** (…)`. Scored on whether the pointer
finds its content, the annotations are **73 of 82 (89 %)** — against SP4's 95 %. Seventy-eight days and
2.2× the file later, the reverse-link layer is substantially intact.

| Outcome | Count |
|---------|-------|
| Resolves as a heading | 45 |
| Resolves as bold subject / prose — correct pointer, invisible to a heading test | 28 |
| Genuinely absent | 9 |
| Target file path wrong (`froberger-journal-all-entries.txt` → `src/sources/`) | 1 |
| No `§Section` component | 3 |

SP4 hit this wall itself and did not record it. Two of its five Phase-4 "corrections" say so in their own
notes — *"Content in FL3 milepoint E, no heading"*, *"Content in FL7 milepoint C, no heading"* — and both
were resolved by **repointing the annotation to the nearest heading** rather than by noting that the
document's section convention was not headings at all.

***The lesson is the repo's own, arrived at independently 70 days early: the regex serves the prose, never
the reverse.*** A pointer bent to satisfy a checker is a false green. Of SP4's five corrections, the two
that bent the pointer are the two that describe content the reader still cannot locate by section name.

### Finding 5 — FC06 shipped a different mechanism than the one described

| | Report | HEAD (`_rollMonsterWeaponDrop(monsterDmgDie)@24641`) |
|---|--------|------|
| Pool | all weapons; degrade after selection | pre-filtered `w.magicBonus === 0` — a magic weapon is **never selected** |
| Formula | `max(0, base − floor(random()×4))` | `deg = Math.min(0, d6 - 5)@24652` |
| Range | *"−3…0"* — which `max(0, …)` cannot produce | −4…0 |
| Result | *"a base +4 weapon drops as +1, +2, or +3"* | `Wrecked`/`Rusted`/`Chipped`/`Worn` prefixes on a **negative** bonus |
| Rationale | protect the vendor economy from full-quality drops | `capped at base tier@24646` — *"fishing is the only source of +bonus weapons"* |

The design goal held; the implementation inverted it. The report describes degrading a magic drop toward
zero. The engine never grants one, and instead degrades a *mundane* weapon **below** base — so FC06's
observable effect is a stock of rusted swords, not a scarcity of shiny ones. The randomness moved to the
seeded stream (`_seededNext()`, invariant #6) as expected. Note also that the report's formula and its
stated range contradict each other inside one sentence — `max(0, x)` is never negative.

### Finding 6 — V-B's deferral inverted in under eleven hours

*"Zone gating UI (shore/reeds/deep progression) deferred to Layer 48+ … No UI renders the zone gate or
prevents access to locked zones. All three zones are currently always accessible."*

Shipped at `59cc13b`, 2026-05-26 21:26 — **10 h 47 m** after SP4's close, in the same day's session. HEAD
renders locked zones as disabled buttons with a 🔒 suffix, 45 % opacity, and unlock hints
(`Unlocks after landing a Large fish@30630`), with auto-unlock driven by the catch log. §DOC-02j's
inversion recurs: read against HEAD alone, a deferral block is indistinguishable from a live gap.

The companion field did **not** ship. `baitFishingActive` has exactly one occurrence in 38,712 lines —
its own declaration at `tackleboxZoneUnlocks: {shore:true@23140`. Declared, never written, never read.
→ **§DX-02n**.

---

## V. Recommendation Register

| Item | SP4 status | Verified outcome |
|------|-----------|------------------|
| FC06 Monster drop nerf | ✅ | **Shipped, different mechanism** (Finding 5) |
| FC07 Fishing Guide | ✅ | Shipped |
| FC07 zone-gate UI | deferred | **Shipped 10 h 47 m later** (Finding 6) |
| FC08 Annotation target validation | ✅ | Shipped; 4 of 5 corrections hold, 1 orphaned (Finding 3) |
| V-C *"re-grep F4/F6 after any session adding ≥20 lines"* | protocol | **Never ran** — see below |

**V-C never ran, and could not have.** The cadence is a manual instruction with no gate behind it — the
same failure §DOC-02i measured for FC04, and the same class as the Doc Health Badge (§DX-02s), which still
reads ✅ beside `HTML line count | 36,933` against a live 38,712. Both F4 and F6 still carry bare line
numbers in a `| Function | Line |` column rather than the `symbol@line` anchors the repo adopted in
§DX-01e, so `check:anchors` cannot see them. Measured drift: F4's `storyPreBattle` reads **16179** against
a live **36399** — **+20,220 lines** — and F6's `roll(sides)` reads 5483 against 6417. The F4 table still
carries SP4's own stamp, *"All 29 line numbers verified against `play.html` (17,762 lines) ·
2026-05-26,"* above 26 rows. → **§DX-02aw**.

---

## VI. Defects Filed

| Row | Severity | Summary |
|-----|----------|---------|
| **§AUDIT-03ak** | 🟢 | Four `⚠️ PLANNED` headings in `world.md` (Layers 51, 52, 56, 57) describe features live since 2026-05-26; Layer 56 is simultaneously `✅ Implemented` in `story.md`. No design call. |
| **§AUDIT-03al** | 🟢 | `story.md §Gate Locks` documents `GATE_LOCKS` (0 occ.) and `_canTravelTo()` (0 occ.) and describes item-gated movement blocking — forbidden by invariant #1. Delete the section; the `maps.md` twin was already retired. |
| **§DX-02aw** | 🟡 | F4 (26 rows) and F6 (55 rows) are the last doc tables using bare line numbers in a `Line` column, outside `check:anchors`' universe. F4 drift measured at +20,220 lines under a "verified" stamp. Migrate to `symbol@line`. |
| **§DX-02n** (+1) | 🟢 | `baitFishingActive` — 1 occurrence, declared only. |

---

## VII. Conclusion

SP4 built the reverse-link layer this file has run on ever since, and built it accurately: 94 annotations,
nine template splits, a flag-name correction still standing in the engine, and a line count exact at both
ship commits. Eighty-nine per cent of its pointers still find their content after the file more than
doubled. As an act of construction it is among the most durable work the program has measured.

As an act of *verification* it has one systematic flaw, and the flaw is instructive because it is
invisible from inside the pass. Every claim SP4 checked is right. Every claim SP4 carried forward
untouched — the 27 prior annotations, the eight unimplemented layers, the deferred zone UI — is wrong, and
the eight-layer table was disprovable in the same commit by the pass's own stated method.

> *"State fields are definitive evidence of implementation."* — SP4 Phase 1, which then declined to grep
> the state fields for the eight features it was deciding about.

A sync pass is a rewriting instrument, and its attention is drawn to what it rewrites. The residual set —
the rows marked *deliberately preserved*, *deferred*, *out of scope* — is not a quiet corner of the
document. It is the part no one checked.

---

*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
