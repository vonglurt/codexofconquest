<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §EDITOR-01-D-FU(b): Reward-Ladder → `itemChain` Migration

**Track:** §EDITOR-01-D-FU item (b) · **Original date:** 2026-06-27 · **Status:** ✅ CLOSED (Inc 1–5)
**Verified against `roll2hit-v3.html` @ HEAD:** 2026-08-17 (§DOC-02bs). History doc — annotate, never rewrite.

---

## Abstract

Every quest in this game ends by handing the player something: a trophy, a tome, a readable, a rod.
Before this work, all 61 of those payouts lived in one 220-line `if (id === 'quest_…')` ladder inside
`storyCheckQuests` — engine code, invisible to the worldbuilder, editable only by hand. This report
locked the design that moved the *inventory* half of that ladder into `itemChain`, a declarative
per-quest field, and specified the five decisions that made the move safe. It shipped over five
increments: a parity guard first, then 22 branches in two waves, with a grammar widening between them.

Re-measured 51 days later, the report is **exact on every number it counted** — the 61-branch census,
the 22 migrations, the 9/13 wave split, the 13-field grammar, five of its six line anchors. Its
residue analysis proved *predictive*: the five branches it declared un-migratable were hit by an
independent refactor six days later and left as code for the same reasons. The one thing it could not
know is that its subject would be dissolved: **§ARCH-01 Wave 7c deleted the ladder entirely on
2026-07-03**, so the structure this report was written about has stood at zero branches ever since.

---

## 1. Intention and inspiration — what this buys the player

The ladder was a *content* bottleneck wearing a refactor's clothes.

- **Rewards become authorable.** A designer who wanted Sandy's Honcho contract to pay a Rhinestone
  Collar had to open the engine and add a line to a 61-case block. After (b), the reward is a field on
  the quest, editable in the §EDITOR-01-D-FU(a) visual chain editor. More quests get real payouts
  because adding one stopped being an engine edit — and a game whose side-content pays out in
  *objects* rather than in numbers is a game where the world remembers what you did.
- **The game keeps its own voice.** `_applyItemChain` announces a grant as `"💎 Rhinestone Collar
  obtained."` The ladder's own line was `'💰 +500gp + Rhinestone Collar trophy.'` A naïve migration
  would have printed both, stapling a robotic receipt to a hand-written sentence. §3.2's `silent:true`
  exists purely so the prose survives the refactor. **A refactor the player can hear is a bug.**
- **Items are load-bearing, so a rename is a world-break.** `KEY_EVENTS` fires on an item name held in
  inventory — carrying the Crypt Key opens the lower ward, the Sea Cave Key opens the inner passage.
  Reshaping an item during migration would have silently made a world-change unreachable, with no
  error anywhere. §3.3's name-preservation rule is the reason that did not happen.

The inspiration is the house rule stated in `CONTRIBUTING.md` and re-learned in every WBAPI hazard:
*a write that lands in a real-but-wrong object never throws.* An inventory push is exactly that kind
of write. So this migration was designed guard-first.

---

## 2. Method (verification pass, 2026-08-17)

1. Census re-derived from the archive, not from HEAD — `git show 27956e4:roll2hit-v3.html` (the Inc-1
   design-lock build) and `git show de64c16:roll2hit-v3.html` (the Inc-5 close build).
2. Every line anchor in the original re-resolved against the build it was written against.
3. Migration count taken from the live gate, not from prose: `npm run check:laddermigration`.
4. Allow-list compared field-by-field across all four sites the report named as "in lockstep".
5. `git log -S` on each disputed symbol to separate RETIRED from NEVER-SHIPPED.
6. Residue cross-checked against the *successor* refactor's own commit message (`a79c76a`).

---

## 3. Ground truth — the 61-branch census (VERIFIED EXACT)

The FU brief assumed a population of pure `inv.push` branches ready to lift out. There was
essentially one. The ladder was overwhelmingly **mixed effects** — gold + favor + XP + flags + ability
scores + a narrative line, with an inventory push as one ingredient among several. So (b) was never
"lift the pure branches"; it was **partial extraction**.

| Bucket | Count | Disposition | Members |
|--------|------:|-------------|---------|
| Expressible now — `grant` over `name/icon/type/sell/desc` | 7 | ✅ wave b2a | `couperin_lute` (Cipher Scrap; also a take), `pit_training`, `cat_03`, `cat_04`, `cat_05`, `cat_06`, `night_eel` |
| Take-only — name-based removal → `take` | 3 | ✅ 2 shipped b2a; `wm_01` **dropped to residue** | `brynn_ledger`, `pachelbel_shipment`, ~~`wm_01`~~ |
| Needs grammar ext (b1) — literal push w/ rich fields | 14 | ✅ 13 shipped b2b; `fishing_guide` **dropped to residue** | `readText`×7, `bonus`+`description`×3 (`wm_02/03/04`), weapon stats (`guide_06`), `readText`+`passive` (`scar_04`), `uses` (`void_below`), `readableKey` (`va_02`) |
| Dynamic/computed item | 2 | ❌ never — stays code | `tl_01`, `tl_03` |
| No inventory op — gold/favor/XP/flag only | 19 | ❌ out of scope | `slums_cleanup`, `cat_01/02/void`, `city_watch_patrol`, `pit_debut`, `fish_01`, `horned_shark`, `ng_01/03`, `wm_05`, `va_03/04`, `vs_01/02/03/warden`, `lame_lystra`, `brynn_firewood` |
| Message-only | 16 | ❌ nothing to migrate | the Damascus/Lystra/Antioch §LIX–LXIV beats, `va_01`, `tl_02`, `ng_02`, `d0206_a5`, `d0208_a4/a5`, `antecedent_01` |

**Total 61 — confirmed by direct count at both the Inc-1 build and the Inc-5 build**, and corroborated
by `a79c76a`'s own subject line: *"the 61-id hardcoded effects block in storyCheckQuests … DELETED."*

> ⚠ **Correction to the original table.** It marked 24 branches migratable (10 + 14) but the report
> closed at **22**. Both dropouts are named in §6 Residue and neither was silent — the ✅ column above
> is corrected to match the shipped result rather than the plan.

---

## 4. The five design locks

**4.1 — `grant` was too thin; b1 is a hard prerequisite.** The ladder's 26 pushed item objects used
`readText`×8, `description`×7 (a *different key* from the grammar's `desc`), `bonus`×3, plus
`passive`, `readableKey`/`readable`, `uses`, `minLevel`, and four weapon stats. **LOCKED:** an explicit
allow-list, not arbitrary passthrough — anything off-list is dropped, because a stray field the codec
and widget cannot author would silently diverge. Four sites kept in lockstep: the runtime, the text
codec, the (a) widget schema, and `check:itemchain`.

**4.2 — Migrated grants run silent.** `silent:true` suppresses only the auto-`obtained` line; the
branch keeps its hand-written narrative verbatim. This preserves exact user-visible output, which is
what lets the parity guard assert *message* equality and not merely inventory equality.

**4.3 — Item names are byte-preserved.** `KEY_EVENTS[].item` and `completeItems` match by string.
**LOCKED:** the guard cross-checks every migrated name against both indexes and fails on drift.

**4.4 — `once` replaces the hand-rolled dedup.** Two branches guarded with
`!inventory.some(i => i.name === X)` (`guide_06`, `scar_04`). Grant's default `once:true` is
semantically equivalent for a quest that completes once. **LOCKED:** migrate as default-`once`; never
emit `once:false`.

**4.5 — The boundary with §DATA-01-REVERTED is drawn, not crossed.** The 19 gold/favor branches and
the 2 dynamic-item branches are effects-layer territory. (b) migrates *only* inventory — the one
effect `itemChain` already models — and never invents a second gold/favor mechanism.

**4.6 — The parity guard ships first.** `scripts/check-ladder-migration.js`, manifest-driven: one entry
per migrated quest recording what its branch used to push, asserting (a) inventory parity field-by-field,
(b) `silent:true` on every migrated grant, (c) the surviving branch no longer pushes the name, (d) the
name still satisfies its `KEY_EVENTS`/`completeItems` reference. Built at Inc 2 against an *empty*
manifest, so every later wave was gated by a harness already proven to read the file correctly.

---

## 5. Spec → shipped delta table

| # | Report claim | HEAD (2026-08-17) | Verdict |
|---|---|---|---|
| 1 | 61-branch ladder at `roll2hit-v3.html` **25875–26094** | Exact at `27956e4`: first branch 25875, last 26094, count 61 | ✅ **EXACT, both ends** |
| 2 | Grant builder at **23549**, `once` guard at **23548** | Exact at `27956e4` | ✅ **EXACT** |
| 3 | `_applyItemChain` call site at **25869**, before the ladder body | Exact at `27956e4` | ✅ **EXACT** |
| 4 | `FISHING_GUIDE_TEXT` at line **24017** | 23997 at `27956e4` (**−20**) | ⚠ hint drifted; the *argument* holds — `const FISHING_GUIDE_TEXT@26659` is still declared after `const QUEST_DB = {@10615`, so the TDZ objection is live today |
| 5 | 22 branches migrated (9 b2a + 13 b2b) | `check:laddermigration`: **22 quests, 148/148 checks** | ✅ **EXACT** |
| 6 | b1 allow-list: 13 optional fields | `for (const f of ['desc', 'description'@26182` carries all 13 **plus `heal`** | ✅ 13/13 shipped; ➕ grown to 14 |
| 7 | `silent:true` added | `if (!s.silent) msgs.push@26189`; all 22 migrated grants carry it | ✅ SHIPPED |
| 8 | Four sites in lockstep | Runtime ✓ · `worldbuilder.html:const GRANT_RICH = [@8567` ✓ · widget `worldbuilder.html:{f:'silent',chk:true}@8558` ✓ · `scripts/check-itemchain.js:grant passes heal@81` ✓ — and all four carry `heal` | ✅ held through a later widening by a different track |
| 9 | Never emit `once:false` | 0 occurrences file-wide | ✅ HELD |
| 10 | 3 named load-bearing names survive | `const KEY_EVENTS = [@26207` holds 7 items; all three named ones grant through `itemChain` | ✅ VERIFIED |
| 11 | Guard wired into CI beside `check:itemchain` | `walk-invariants.yml` runs both on the same push paths | ✅ EXACT |
| 12 | "Both completion paths unchanged" | The second call site (legacy `_rollCeremonia`) was **retired** by §ARCH-01 W7d `f8691c1`; one call site remains — `msgs.push(..._applyItemChain(q))@30198` | ⚠ STALE by design, not a defect |
| 13 | The ladder shrinks but survives | **Deleted.** `a79c76a` (§ARCH-01 W7c, 2026-07-03) folded all 61 ids into per-quest `onComplete` bit chains — `W7c folded the per-id hardcoded effects block@30193` | ⚠ **SUPERSEDED — 0 branches since 2026-07-03** |
| 14 | "The larger lever remains §DATA-01-REVERTED" | Right in substance, wrong in vehicle — the effects layer arrived as UQF `onComplete` chains, not `QUEST_EFFECTS`/`HOOKS` | ⚠ SUPERSEDED |

### 5.1 The successor, measured

W7c absorbed exactly the buckets §3 declared out of scope, using the grammar §4.5 refused to invent:

- **19 gold/favor/XP branches** → `reward` + a new `favor` bit kind. `quest_slums_cleanup` at HEAD reads
  `onComplete:[ {kind:'reward',gold:80}, {kind:'favor',npc:'yael',set:1}, {kind:'narrative',msg:'💰 +80gp from Yael. Guard Favor granted.'} ]`
  — the same three effects, in the same order, with the report's own quoted message intact.
- **16 message-only branches** → single `narrative` bits.
- **`quest_cat_03`** now carries the migrated `itemChain` *and* the W7c `narrative` bit side by side,
  still printing `'💰 +500gp + Rhinestone Collar trophy.'` and still silent on the grant. **§4.2's
  contract survived a whole-file refactor it was not designed for.** That is the strongest single
  result in this verification.

---

## 6. Residue — and why it was a prediction, not an excuse

The following stayed as code by design. All four are still code at HEAD, now as `_legacy_fn` bits
inside `onComplete` rather than ladder branches:

- **`fishing_guide`** — the one "pure push", but its `readText` is `FISHING_GUIDE_TEXT`, a const
  declared *after* `QUEST_DB`. Referencing it from a data literal is a temporal-dead-zone error, and
  inlining the canonical text would duplicate a single-source string. Live at
  `readText:FISHING_GUIDE_TEXT@13819`.
- **`tl_01`, `tl_03`** — item `description` conditionally concatenated from other state. Non-static;
  only a computed-effects layer could take them.
- **`wm_01`** — `Scholar Kings' Seal` removal is conditional (`!archiveLetterObtained`) *and*
  count-limited to 3. A flat `take` cannot express it. Live at
  `seal spend stays _legacy_fn@11072`.
- **Every migrated branch is PARTIAL** — gold/favor/XP, the `guide_06`/`scar_04` WIS writes, flag
  sets, and the verbatim `msgs.push` all stayed; only the inventory operation left.

> **The finding.** `a79c76a`'s commit message, written by an independent refactor six days later,
> names its own `_legacy_fn` holdouts as: *"scar_04 mercy branch, vs_warden three-way, lame_lystra,
> wm_01 seal spend, tl_01/tl_03 runtime items, fishing_guide lazy FISHING_GUIDE_TEXT."* That is this
> report's residue list, re-derived from scratch, for the same reasons. **A residue section that a
> later author reproduces without reading it was a measurement, not an apology.**

---

## 7. Verification at HEAD

```
check:laddermigration   148/148 pass — 22 quests migrated, 0 ladder branches, 7 key-event items
check:itemchain         29/29 pass
check:anchors           3,162 anchors / 76 docs, 0 dead (117 stale hints = standing baseline)
```

`roll2hit-v3.html` was **not modified** by this verification pass.

---

## 8. Defects found → BACKLOG

- **§DX-02ci** 🟢 — the parity guard's check (c) is **vacuous**. `LADDER` has been empty since
  `a79c76a`, so `scripts/check-ladder-migration.js:// (c) no double-grant@245` iterates nothing and
  cannot fail. The risk it guarded is real and *moved*: a double-grant would now come from an
  `onComplete` chain, not a ladder branch. No live double-grant exists today (checked: 0 of the 22
  manifest quests push inventory in their own block), so this is coverage, not a red. The same file's
  header prose still says the ladder *"is being migrated, branch by branch"* and *"at Inc 2 the
  manifest is EMPTY."* Its one W7c-aware line —
  `scripts/check-ladder-migration.js:reward ladder stays deleted@208` — shows the right instinct and
  was applied to one assertion instead of the file.
- **§DX-02cj** 🟢 — the four-place lockstep is enforced by a **comment**. Nothing in `scripts/` or
  `tests/` mentions `GRANT_RICH`; no gate compares the widget's list to the runtime allow-list at
  `for (const f of ['desc', 'description'@26182`, so the two can diverge silently. It
  survived one widening (`heal`, added by §KG Inc 3 `d6aeefd`, 11 days later, by an author on a
  different track) purely on discipline. The §DX-02at class, one layer down.

---

## 9. Conclusion

**(b) did what it said, and said what it did.** Twenty-two reward branches became data; the four that
could not are named, reasoned, and still named correctly today. The guard shipped before the first
migration and has never gone red. Every counted figure re-measures exact.

The lesson is about *scope honesty*. The report closed with a strategic note — that (b) was "real but
narrow," that 37 branches and every non-inventory effect remained, and that a declarative effects
layer was the larger lever. Six days later §ARCH-01 built that layer under a different name and
finished the job. **The report was superseded because it was right about its own limits**, which is
the only respectable way for a design lock to age. The `silent` flag it invented to keep one
hand-written sentence from being followed by a robot is still doing that job, two refactors later.

*Author's note preserved from the original: "(b) deliberately shrank the ladder without inventing a
second gold/favor mechanism." Six days later, someone invented the first one properly instead.*
