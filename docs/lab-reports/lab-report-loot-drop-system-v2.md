<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Loot Drop System Redesign and API Formalization in *The Shattered Codex*

**CodexOfConquest v3 — Game Design & Engineering Report**
**Series:** Laboratory Reports on Narrative Engine Architecture
**Classification:** Loot Economy · Drop Rate Balance · API Design
**Date written:** 2026-06-05 · **Ship commit:** `440eb5d` (10:41) · **Reverted:** `88d41d1` (13:33) · **Partially re-shipped:** `0fffce7` (2026-07-07)
**Original status:** *Specification Complete — Migration Implemented*
**Verified status (§DOC-02v, 2026-08-12):** **Specification faithful; migration shipped, silently reverted the same afternoon, and restored only in part.**

> **Verification note.** This document has been re-measured against live `play.html`, against `src/js/wbapi-server.js`, and against the archive (`git show <sha>:play.html`) under the §DOC-02 lab-report verification program. Claims that did not ship are marked **NOT SHIPPED** and **kept** — a silently deleted claim reads like one that held. Anchors are written `` `symbol@line` `` (§DX-01e); the line number is a cached hint, the symbol is the pointer.

---

## Abstract

This report formalizes the loot drop architecture of *The Shattered Codex*, resolving a design inconsistency in which the unified d100 loot table awarded magic-bonus weapons (+1 to +4) that were intended to be exclusive to the fishing mechanic. It establishes a three-channel drop model — (1) monster trophies, always; (2) a monster weapon drop on a 1d6 quality roll, −4 to 0; (3) a d100 consumable roll — and specifies a new `GET /api/loot-drop` endpoint giving authors one filterable view across all channels.

**Measured outcome.** The specification is one of the most faithfully implemented in the corpus: the archive's pre-change table is byte-exact to the report's own "BEFORE" listing, all seven revised weights shipped exactly, the d6 quality roll shipped line for line including its prefix array, and the API endpoint shipped almost character for character down to its `5–6` en-dash. **The migration nonetheless spent 68 days in a broken state**, because a commit titled *"POST /api/import/book: documentation + smoke test cleanup"* silently reverted the whole morning's engine work three hours after it landed — and the July restore brought back two of the three code changes. Meanwhile the report's central invariant, *monsters never drop positive-magic equipment*, is enforced perfectly at HEAD while the channel it defers to has been unreachable since the world-grid migration. **The rule shipped; the exception did not.**

---

## I. Introduction

### I-A. Hypothesis

> *The loot progression of* The Shattered Codex *can be improved by enforcing strict source-division: monster weapon drops are degraded variants (−4 to 0), fishing is the exclusive source of positive-magic equipment (+1 to +4), and the consumable drop table is purged of equipment entries. This produces a more readable inventory progression curve and gives fishing a clearly unique mechanical purpose.*

### I-B. Why this matters for play

The problem being solved is not arithmetic; it is **legibility of reward**. Before this pass, a player could reach level 5 without ever seeing Yugurt Lake and still be carrying a +1 dagger, because the same d100 roll that hands out healing potions also handed out magic weapons at a combined weight of 36 in 100. Every channel produced every kind of thing, so no channel *meant* anything.

The redesign gives each loop one job:

- **Kill a monster** → you are paid in *consumables and a serviceable weapon*. Progress, never a jackpot.
- **Fish the lake** → you are paid in *permanent power*. A destination, not a side effect.

That division is what makes Yugurt Lake read as a **destination** rather than as scenery — the player learns, without a tutorial, that the water is where upgrades come from. The Wrecked (−4) tier exists for the same reason: a junk pickup that arrived *fairly, on a 1* is a small honest story, and it makes the base-tier drop feel earned rather than expected.

### I-C. Scope

1. Behavioral analysis of the three existing drop channels
2. Redefinition of drop semantics with canonical terminology
3. Migration of the d100 table and the weapon-quality roll
4. Removal of dead code (`LOOT_TABLE`)
5. Schema for the `/api/loot-drop` query endpoint
6. Verification criteria for the migrated system

---

## II. Method (verification pass)

| # | Instrument | Applied to |
|---|-----------|-----------|
| 1 | Batched `grep -c` census of every named symbol before reading the prose | 24 identifiers |
| 4 | `git log -S "<symbol>"` to separate **RETIRED** from **NEVER SHIPPED** | `_onStoryVictory`, `LOOT_TABLE`, the d6 roll |
| 8 | `git show <sha>:play.html` — HEAD cannot adjudicate a claim about the past | the §IV-A "BEFORE" listings, scored against `440eb5d^` |
| 12 | **COPY-vs-COMPOSE**: transcribed material is evidence, composed illustration is a claim | §IV-A tables vs §III-C's expected-value paragraph |
| 14 | Cross-check every census regex against a figure a gate already counts | `MONSTER_DROPS` / fish / lake-magic totals |
| 16 | When a report specifies a **trade**, verify **both legs** | the taking (purge) vs the giving (fishing) |
| 21 | **Read the diff, not the subject line** | `88d41d1` |

---

## III. As-Built Inventory

### III-A. The three channels, at HEAD

All three fire in order inside the battle-victory path (`const lootResult = _rollD100Loot();@25416`, `const _wpDrop = _rollMonsterWeaponDrop(_monDmgDie);@25430`), exactly as tabulated in the original §II-A:

| Order | System | Implementation | Output | Verdict |
|-------|--------|----------------|--------|---------|
| 1 | Trophy drop | `MONSTER_DROPS[enemy.key]` → `S._pendingDrop` | 1 themed sell-item | ✅ live |
| 2 | Unified d100 | `function _rollD100Loot() {@24535` → `const _D100_TABLE = [@24518` | potion · scroll · flashbang · gold | ✅ live, equipment purged |
| 3 | Monster weapon | `function _rollMonsterWeaponDrop(monsterDmgDie) {@24583` | 1 base weapon, quality −4 to 0 | ✅ live, d6 shipped |

The host function is **`_storyBattleVictory`**, not `_onStoryVictory`. The latter has **0 commits in the file's entire history** — a name supplied by memory, not read from the file (instrument 4). *The report was right about the mechanism and wrong about the doorplate.*

### III-B. Symbol census

**19 of 21 named identifiers resolve (90 %).** The two that do not are `_onStoryVictory` (0 commits ever — **NEVER SHIPPED**) and the report's own claim that `LOOT_TABLE` was deleted (see §V-F1). Every other name — `_D100_TABLE`, `_rollD100Loot`, `_rollMonsterWeaponDrop`, `_magicTierAllowed`, `LAKE_MAGIC_DB`, `MONSTER_DROPS`, `_luckMod`, `_calcLuck`, `WEAPON_ITEMS`, `DAGGER_ITEMS`, `_D100_TABLE`'s seven `_type` strings, and all six WBAPI properties named in §IV-B — resolves under its originally specified name.

### III-C. Transcription accuracy — the archive comparison

The §IV-A "BEFORE" block was diffed against `440eb5d^`:

> **All 16 rows of the pre-change `_D100_TABLE` are byte-exact** — every weight, every `_type`, in the report's own order, including the trailing `]; // total weight = 100`. The old consumable column in §III-C (25 · 12 · 8 · 3 · 6 · 4 · 6 = 64), the dagger subtotal (13) and the main-weapon subtotal (23) are all exact. `const deg = Math.floor(Math.random() * 4) - 3;` and its four-element prefix array are exact.

**Zero transcription errors in the entire document.** Every error found in this pass is in a passage the author had to *compose* — instrument 12, holding for the thirteenth consecutive increment.

---

## IV. Spec → Shipped Delta Table

| # | Report claim | Shipped? | Evidence |
|---|--------------|----------|----------|
| 1 | `LOOT_TABLE` removed, replaced by a comment stub | ⛔ **NOT SHIPPED at HEAD** *(shipped `440eb5d`, reverted `88d41d1`, never restored)* | `const LOOT_TABLE = [@24443`, all 20 entries, 0 readers |
| 2 | `_D100_TABLE` purged of `dagger`/`mainweapon` | ✅ exact | 7 rows, `35·18·14·6·11·6·10` = 100 |
| 3 | Revised weights (35/18/14/6/11/6/10) | ✅ **all seven exact** | `const _D100_TABLE = [@24518` |
| 4 | `_rollD100Loot` retains dagger/mainweapon branches "for API compatibility" | ✅ shipped **and the rationale is sound** | `src/js/wbapi-server.js:WBAPI.d100Table = entries.map@3480` preserves `_magic` on write |
| 5 | d6 quality roll, `deg = min(0, d6−5)` | ✅ **byte-exact incl. the comment** | `const deg = Math.min(0, d6 - 5)@24594` |
| 6 | Prefix array `['Wrecked ','Rusted ','Chipped ','Worn ','','']` | ✅ byte-exact | `['Wrecked ','Rusted ','Chipped ','Worn ','','']@24595` |
| 7 | `_D100_TABLE` header comment updated to consumables-only | ⛔ **NOT SHIPPED — and un-shippable in the HTML** | the header is emitted by `src/js/wbapi-server.js:function serializeD100Table(entries) {@1855` |
| 8 | Key invariant: monsters never drop +1…+4 equipment | ✅ **enforced** | `// FC06: monster drops capped at base tier@24588`, `magicBonus === 0` filter |
| 9 | Fishing is the exclusive source of positive-magic equipment | ⚠️ **vacuously true** — no live grant path exists for *any* +N equipment | §V-F4 |
| 10 | `LAKE_MAGIC_DB` = 8 items, `base + floor(lv×levelScale) + floor(luck×luckScale)` | ✅ 8 items; formula live, one guard added | `function _lakeMagicBonuses() {@23421`, `if (bonus <= 0) return;` |
| 11 | Luck applies to the d100 roll as `min(99, floor(rand×100) + max(0,luckMod))` | ✅ exact (RNG now seeded) | `Math.min(99, Math.floor(_seededNext() * 100) + Math.max(0, _luckMod())@24548` |
| 12 | Superior potion odds rise ~3 % → ~9 % with luck +3 | ⛔ **wrong** — 3 % → 6 %, and luck contributes exactly **0** | §V-F5 |
| 13 | Luck "biases the roll toward higher-indexed entries" | ⚠️ **only the last entry** — a uniform shift moves *L* weight from the first row to the last | §V-F5 |
| 14 | Max practical luck mod +3, theoretical +4 | ⛔ wrong, and self-contradictory (§II-C says +5) | all-18s = **+4**, all-20s = **+5** |
| 15 | Weapon dropped is "the closest available type at or below that die" | ⚠️ **uniform-random** over the whole eligible pool, not the closest | `pool[Math.floor(_seededNext() * pool.length)]` |
| 16 | Base weapon on 5 or 6 → 2-in-6 (33.3 %) | ✅ exact | `pfx ? {...} : base` |
| 17 | Channel host is `_onStoryVictory()` | ⛔ **NEVER SHIPPED** (0 commits ever); host is `_storyBattleVictory` | instrument 4 |
| 18 | `GET /api/loot-drop` with the five query params | ✅ shipped, near byte-exact to §IV-C | `src/js/wbapi-server.js:if (parts[0] === 'loot-drop' && method === 'GET') {@3491` |
| 19 | `_meta.qualityTable` as a static constant in the response | ✅ byte-exact, en-dash included | `src/js/wbapi-server.js:{ roll:'1',   bonus:-4, prefix:'Wrecked'@3500` |
| 20 | §IV-C's `lake_mag_04` sample record (8 fields) | ✅ **all 8 exact** | `lake_mag_04: { key:'lake_mag_04'@26542` |
| 21 | `wbapi-help.md` gains a "Loot Drop System" section | ⛔ **NOT SHIPPED** — 0 hits in `docs/api/wbapi-help.md` *or* `API-README.md` | §V-F7 |
| 22 | `wbapi-server.js` help text + endpoint index updated | ✅ shipped | `src/js/wbapi-server.js:2133`, `:11591` |
| 23 | Ten §V-B verification criteria | ⛔ **0 of 10 became a test** | no file under `src/tests/` mentions `loot-drop`, `_D100_TABLE` or `_rollMonsterWeaponDrop` |
| 24 | `Math.random()` throughout | ⚠️ **superseded** — §VM-01-B moved all four rolls to the seeded stream (invariant #6) | `_seededNext()` |

---

## V. Findings

### F1 — The migration shipped complete, and a commit about book imports silently reverted it

This is the report's whole story, and it is not visible from HEAD.

| Time | Commit | What it did |
|------|--------|-------------|
| 2026-06-05 **10:41** | `440eb5d` *"§DROP-01: loot drop system redesign + worldbuilder Loot tab"* | Shipped **all three** code changes: `LOOT_TABLE` deleted, d100 purged to 7 rows, d6 quality roll + Wrecked prefix, header comment rewritten |
| 11:24 | `664fcf8` *"§DROP-01/02 docs: sync all mechanics docs"* | Wrote *"`LOOT_TABLE` removed; replaced by comment stub"* into three docs — **true when written** |
| 11:32 | `06b9d9a` *"§DROP-03: implement lake_magic item bonus effects"* | Shipped `_lakeMagicBonuses()` |
| **13:33** | `88d41d1` *"POST /api/import/book: documentation + smoke test cleanup"* | **Reverted §DROP-01 and §DROP-03 in full** |
| 2026-06-11 | `baeb10e` | §DROP-03 re-implemented (rewritten, not restored) |
| 2026-07-07 | `0fffce7` *"§FC06 monster-drop nerf SHIPPED"* | Re-shipped **2 of 3** §DROP-01 changes — not the `LOOT_TABLE` deletion, not the comment |

`88d41d1`'s body states its HTML change in full: *"remove TST_SMOKE node + tst_smoke_act1 quest created during endpoint smoke test; restore baseline 449 nodes, 1695 quests."* **`TST_SMOKE` occurs zero times in that commit and zero times in its parent** — the stated change produces no lines at all. The 224 lines it *did* change span 23 hunks; three are the legitimate book-import content, and **the remaining twenty reach from `_rollCeremonia` to `storyCorridorTravel` and restore, verbatim, the code the morning had replaced** — §DROP-01's three changes *and* §DROP-03's `_lakeMagicBonuses()`, shipped an hour earlier.

This is **CONTRIBUTING Hazard #1 caught in the act**: the WBAPI server holds the whole file text from the moment it started and rewrites it on every data WRITE, so a `del` issued from a server that predates a hand-edit silently rolls that edit back. The report's author did everything right and lost the work anyway, to a delete of two smoke-test entries.

***The durable rule, and it is instrument 21 for the second time in two increments: a commit's subject line describes what its author intended; only the diff describes what happened. A revert issued by a tool announces nothing, because the tool does not know it is reverting.*** → **§DX-02aa**

### F2 — Two of the four §V-A fixes are still reverted, and one of them cannot be fixed where the report put it

`const LOOT_TABLE = [@24443` is still declared, still holds its 20 entries (8 Minor / 2 Spell / 5 Healing / 3 Greater / 2 Superior), still has **zero readers**, and its own comment still credits `_rollD100Loot()` — the exact defect §II-B Defect 3 described, 68 days after it was fixed. §DOC-02b independently found it as a zero-reader structure; §DOC-02j independently found it as a d20 table mislabelled d100. **This report named it first, fixed it first, and had the fix taken away.**

The header comment is stranger and more useful. §V-A's fourth row is not merely absent — **it is un-shippable in the HTML**, because the block lives inside `◆◆◆ WORLDBUILDER:D100_TABLE ◆◆◆` anchors and its comment is a hard-coded string literal in `src/js/wbapi-server.js:function serializeD100Table(entries) {@1855`. HEAD's comment is that literal, character for character, including the `_magic?` field and the `'dagger'|'mainweapon'` type list the report set out to remove. Any API write to the loot table re-emits it. ***A fix applied to generated output survives exactly until the generator runs.*** → **§DROP-01-FU**

### F3 — The "doc rot" three later reports found is not rot; it is a dated casualty of F1

`docs/mechanics/mechanics-economy.md:253`, `docs/mechanics/mechanics-combat.md:193` and `mechanics.md:209` all state that `LOOT_TABLE` was *"removed; replaced by comment stub."* §DOC-02j filed this as documentation drifting ahead of the code — *"more dangerous, because a reader greps the doc and concludes the code is clean."* The dating now available says something sharper: **those lines were accurate for two hours and nine minutes.** They were written at 11:24 against a tree where the array was gone, and the tree changed under them at 13:33 with no commit message to notice.

`mechanics.md` now contradicts itself in one file: **:209** says the array was removed, **:1016** documents it as a live `const array[20]`. → **§DX-02v extended**

### F4 — The invariant shipped perfectly and the exception it points at cannot be reached

The **taking** leg is airtight. `_rollMonsterWeaponDrop` filters `w.magicBonus === 0` on both its primary and fallback pools, under a comment that states the policy out loud (`// FC06: monster drops capped at base tier@24588`). No monster can drop positive-magic equipment. That is exactly what the report asked for.

The **giving** leg is where the design has gone quiet:

- `const DAGGER_ITEMS = [@24460` — the +1 Royal / +2 Painite / +3 Gaping / +4 Voidsteel daggers, priced 300 / 900 / 2 500 / 8 000 gp — has **exactly one consumer in 38,712 lines**, and it is the now-dormant `dagger` branch of `_rollD100Loot`. **No vendor stocks them.** Four authored items, four prices, no path.
- `const WEAPON_ITEMS = [0, 1, 2, 3, 4]@24496` flat-maps `const _BASE_WEAPONS = [@24473`'s 14 into 70; the 56 with `magicBonus ≥ 1` are reachable only through the same dormant branch (§FISH-02).
- `const LAKE_MAGIC_DB = {@26538`'s 8 items are granted at exactly one site (`const eligible = Object.values(LAKE_MAGIC_DB).filter@7078`), gated on `S_story._fishBattleRank`, whose only writer is `S_story._fishBattleRank = fish.rank || 0@30611` — **inside `function storyFishing() {@30394`**.

And fishing does not render. `const CELL_GRID = (() => {@9852` grants node identity to `list[0]` only, and `BOO:{r:2,c:194},@9422` shares its cell with `LYR:{r:2,c:194},@9423`, which is declared 59 lines earlier in `NODE_MAP` — so `const hasFish = node.isFishingLake;@35349` is never true and the *Cast a Line* verb never draws (**§FISH-01**).

**Net result at HEAD: there is no live grant path for positive-magic equipment of any kind.** The main hand is permanently capped at base tier or degraded, and the two magic tiers the game has authored — 4 daggers and 56 main weapons — are inert data.

***This report is the second half of a two-document trade, and it is the half that shipped.*** `lab-report-fishing-bait-prompting.md` (2026-05-24) specified the exchange: nerf monster drops so that fishing becomes the sole positive-magic vector. **A removal ships in one line; its compensating grant is a whole feature** (instrument 16). Here the removal shipped twice — once in June and again in July after being reverted — while the compensating channel was quietly stranded by a world-grid migration that had nothing to do with loot. The report bears no fault for this: at the time it was written, Yugurt Lake was its own cell.

### F5 — Luck does not do what §II-C and §III-C say it does, and the truth argues the report's case better

The mechanism is `roll = min(99, u + L)` over a uniform `u ∈ [0,99]` against a cumulative weight table. Adding a constant to a uniform variable **does not reweight the interior of the table at all**; it slides the whole distribution and the clamp at 99 catches the overflow. Exactly `L` points of weight move **from the first row to the last row**, and every row in between keeps its probability unchanged.

Enumerated over all 100 values of `u` on the shipped table:

| Luck mod | Minor potion | Superior potion | Gold cache |
|----------|--------------|-----------------|------------|
| +0 | 35 % | **6 %** | 10 % |
| +1 | 34 % | **6 %** | 11 % |
| +3 | 32 % | **6 %** | 13 % |
| +5 | 30 % | **6 %** | 15 % |

So §III-C's *"the effective probability of a Superior Healing Potion rises from ~3 % to ~9 %"* is wrong in both terms: it rises from 3 % to **6 %**, entirely from the weight redistribution the report itself specified, and luck adds **nothing**. There is no "bias shifts ~6 positions up the table"; there is one row shrinking and one row growing.

**And here is the part worth keeping.** Run the same enumeration on the *old* table, whose last entry was `{ weight:2, _type:'mainweapon', _magic:4 }`:

| Luck mod | +4 main weapon (old table) |
|----------|---------------------------|
| +0 | 2 % |
| +3 | **5 %** |
| +5 | **7 %** |

A high-luck character was **2.5× to 3.5× more likely to receive the rarest magic weapon in the game from an ordinary monster kill** — because the luck shift dumped its entire overflow into whichever row happened to be last, and that row was the +4. ***The report's own §II-C mechanism, correctly analysed, is a far stronger argument for its Defect 1 than the argument it actually made — and it is the one place where the purge did something the author did not claim credit for: it moved luck's overflow off the +4 weapon and onto the gold cache, where it belongs.*** The "correct behavior" §II-C hoped for arrived; it simply arrived for a different reason.

### F6 — The report contradicts itself on the luck ceiling

§II-C: *"At all stats = 20: luck_score = 20, luck_mod = +5"* — **correct**. Appendix A: *"Max practical luck mod +3 (all stats ~18–20) · +4 theoretical max at all 20"* — **wrong twice**, and it contradicts §II-C two pages earlier. All-18s yields **+4**; all-20s yields **+5**; the shipped default statline (16/12/14/10/12/8) yields **+1** via `function _calcLuck() {@23439` and `function _luckMod() {@23445`, both of which reproduce the specified formula exactly. Same signature as §DOC-02n's finding on the same helper: *the formula is copied and exact, the worked illustration beside it is composed and wrong.*

### F7 — The endpoint shipped almost byte-exact, and carries two live defects

`src/js/wbapi-server.js:if (parts[0] === 'loot-drop' && method === 'GET') {@3491` implements §IV-C with all five query parameters, the documented response shape, the `bonusFormula` string, and a `_meta` block matching the report's JSON down to the `5–6` en-dash and the phrasing *"magic weapons are fishing-only."* This is the most faithful API transcription the program has measured.

Two defects were introduced with it, both in the fishing branch:

1. **The 20 day fish are counted twice.** They carry `MONSTER_DROPS` entries, so `Object.keys(WBAPI.monsterDrops)` emits them as `source:"monster"` and the fish-trophy loop emits them again as `source:"fishing"`.
2. **All 5 night fish are silently dropped.** The trophy loop opens `const drop = WBAPI.monsterDrops[fish.key]; if (!drop) continue;` and no `nfish_*` key exists in `MONSTER_DROPS`.

A no-parameter call therefore returns **426** entries — 398 monster (20 of them fish) + 8 lake magic + the same 20 fish again — not the *monsters + 8 + 25* the report's §V-C predicts. The smoke test passes on the wrong arithmetic.

*(Instrument 14, firing on this pass as it did on §DOC-02l and §DOC-02t: a first flat `^\s{2}\w+:` extraction read **385** `MONSTER_DROPS` keys. Balanced-brace extraction gives **398**, exactly `npm run stats`' monster total — `MONSTER_DROPS` is 1:1 with `MONSTER_POOL`. Check a census regex against a figure a gate already counts before deriving anything from it.)*

Two authoring-surface gaps complete it: **there is no `./api.sh` wrapper** for the endpoint, and neither `docs/api/wbapi-help.md` nor `docs/api/API-README.md` mentions it. `wbapi-help.md`'s own opening directive reads *"Always use `./api.sh`. Never use raw curl"* — so §V-C's five smoke commands can currently be run only in the manner the file forbids. → **§DX-02ab**

### F8 — Ten verification criteria, zero tests

§V-B is a good register: weight-sum, a 10,000-kill zero-positive-magic assertion, a 100,000-roll distribution check with tolerances, four endpoint filters. **None of the ten became a test.** No file under `src/tests/` references `loot-drop`, `_D100_TABLE` or `_rollMonsterWeaponDrop`.

The cost is measurable rather than hypothetical: the very first criterion — `_D100_TABLE` sums to 100 with no equipment rows — would have gone red at 13:33 on the day it was written and turned a 68-day regression into a three-hour one. ***A verification criterion that lives only in a report is a promise; the same sentence in `src/tests/integration/` is a gate. The distance between them is the whole finding of §V-F1.***

---

## VI. Design Content — Retained and Corrected

### VI-A. Canonical channel model (unchanged, verified)

| Channel | Source | Magic range | Trigger | At HEAD |
|---------|--------|-------------|---------|---------|
| **Trophy** | `MONSTER_DROPS` | none (sell-only) | every monster kill | ✅ |
| **Weapon** | `_rollMonsterWeaponDrop` | −4 to 0 | every monster kill (guaranteed) | ✅ |
| **Consumable** | `_D100_TABLE` | none | every monster kill | ✅ |
| **Fishing** | `LAKE_MAGIC_DB` + fish trophies | effect-scaled, +1 upward | Yugurt Lake combat only | ⚠️ unreachable (§FISH-01) |

**Key invariant (holds):** *monsters never drop +1, +2, +3 or +4 bonus equipment.*
**Correction:** `LAKE_MAGIC_DB` items are **not** weapons and carry no `magicBonus`. They are passive `type:'lake_magic'` items with an `effect` (`ac_bonus` · `atk_bonus` · `first_strike` · `fishing_dc` · `night_type` · `all_ability`), `sell:0`, whose magnitude runs `base + floor(lv × levelScale) + floor(luckMod × luckScale)` and reaches **+6** at level 20 with luck +5 — a wider range than the "+1 to +4" the report states, in a different item class.

### VI-B. Monster weapon quality — the d6 table (shipped byte-exact)

| d6 | Magic bonus | Prefix | Probability |
|----|-------------|--------|-------------|
| 1 | −4 | Wrecked | 16.7 % |
| 2 | −3 | Rusted | 16.7 % |
| 3 | −2 | Chipped | 16.7 % |
| 4 | −1 | Worn | 16.7 % |
| 5–6 | 0 | *(base)* | 33.3 % |

**Design rationale (verified as written):** the flat, slightly base-weighted curve gives early players frequent degraded pickups — harmless, because a Wrecked weapon at level 2 is still competitive with a Pointy Stick — and lets base-tier drops arrive naturally as monster `dmgDie` climbs, with no tier gate to author or explain.

**Two corrections.** The base weapon is drawn **uniformly at random** from every eligible weapon with `die ≤ monsterDmgDie`, not "the closest available at or below that die." And per §DOC-02o's finding F2b, three of the four surfaces that print a weapon bonus test `> 0`, so a *Wrecked Long Sword* announces its −4 in its **name** and nowhere in its **numbers** — the junk-pickup moment lands as flavour but not as information.

### VI-C. Revised d100 weights (shipped exactly)

| Type | Old | New | Δ |
|------|-----|-----|---|
| Minor Healing Potion | 25 | 35 | +10 |
| Healing Potion | 12 | 18 | +6 |
| Greater Healing Potion | 8 | 14 | +6 |
| Superior Healing Potion | 3 | 6 | +3 |
| Spell Scroll | 6 | 11 | +5 |
| Flashbang | 4 | 6 | +2 |
| Gold Cache | 6 | 10 | +4 |
| Dagger +1…+4 *(removed)* | 13 | 0 | −13 |
| Main Weapon +0…+4 *(removed)* | 23 | 0 | −23 |
| **Total** | **100** | **100** | |

The freed 36 points went to consumable variety as specified. See §V-F5 for the corrected expected-value analysis.

### VI-D. Why the dagger and mainweapon branches were kept (rationale upheld)

§IV-A retains the two equipment branches in `_rollD100Loot()` "for API compatibility." **The measurement supports this and narrows an earlier finding.** `src/js/wbapi-server.js:WBAPI.d100Table = entries.map@3480` explicitly preserves `_magic` on write, and `serializeD100Table` emits it — so an author can `PUT /api/loot` a `{weight, _type:'dagger', _magic:2}` row and the branch fires immediately. The branches are **dormant by data, deliberately and reversibly**, not dead by accident; `function _magicTierAllowed(magic) {@24511` is their live guard, not a corpse. §FISH-02 and §DX-02n should be read with that correction. *(Corpus rule, third instance: before filing a spec-vs-engine gap, check whether a sibling report specifies the thing you are about to call a defect.)*

---

## VII. Conclusion

**What the design got right, and it is most of it.** The three-channel model is live and legible: kill a monster, receive a trophy, a consumable and a serviceable weapon; nothing about a routine fight can hand you a permanent upgrade. The d6 quality roll survives byte-exact through a total format migration and a move onto the seeded RNG stream. The API endpoint shipped essentially as drawn. The measured error rate on everything the author could *copy* is zero.

**What the design lost, it lost to tooling and to geography.** Three hours after landing, the migration was reverted by a commit about book imports; the July restore returned the two changes that mattered mechanically and left the dead array and its misleading comment behind. And the exclusivity the whole redesign was built to create — *fishing is where power comes from* — now describes a lake the player cannot fish, because a world-grid migration put Yugurt Lake second in its own cell. The rule against monster magic is enforced flawlessly against an exception that never fires.

**For playability, the sequence is therefore fixed and short.** §FISH-01 (two lines) restores the lake; that alone converts this report's invariant from a prohibition into a division of labour, and gives the game back its 8 lake-magic items, its 11 stranded fishing quests, and the reason Yael's tutorial monologue sends every new player north in the first place. §FISH-02 then decides whether the +N weapon tiers get a home at all. Until then the loot economy is honest, readable, well-tested-in-theory — and permanently capped at base tier.

*The Wrecked tier still works, at least. It happens fairly, on a 1.*

---

## Appendix A — Formula Reference (corrected)

| Variable | Formula | Verified |
|----------|---------|----------|
| Luck score | `ceil((STR×DEX×CON×INT×WIS×CHA)^(1/6))` | ✅ `function _calcLuck() {@23439` |
| Luck mod | `floor((luck_score − 10) / 2)` | ✅ `function _luckMod() {@23445` |
| Luck mod range | **+1** at the default statline · **+4** at all 18s · **+5** at all 20s | ⛔ report said "+3 practical / +4 theoretical" |
| d100 roll with luck | `min(99, floor(rand×100) + max(0, luckMod))` | ✅ exact; moves `L` weight from row 1 to row 7, nothing else |
| Monster weapon die | `die ≤ monster.dmgDie`, then **uniform random** | ⚠️ report said "closest available" |
| Weapon quality d6 | `deg = min(0, d6 − 5)` | ✅ byte-exact |
| Lake magic bonus | `floor(base + lv×levelScale + luckMod×luckScale)`, dropped if ≤ 0 | ✅ + one guard the spec did not have |

## Appendix B — Files Modified (scored)

| File | Claimed change | Verdict |
|------|----------------|---------|
| `play.html` | remove `LOOT_TABLE`; update `_D100_TABLE`; d6 quality | **2 of 3** — the removal was reverted and never restored |
| `wbapi-server.js` | add `GET /api/loot-drop`; update `/api/loot` help; update endpoint index | ✅ all three (now `src/js/wbapi-server.js` since §CLEANUP-02) |
| `wbapi-help.md` | add a "Loot Drop System" section | ⛔ **NOT SHIPPED** — 0 hits, in that file or `API-README.md` |

## Appendix C — Defects Filed

| Row | Premise | Call |
|-----|---------|------|
| **§DROP-01-FU** | Finish the reverted migration: delete `const LOOT_TABLE = [@24443` (0 readers), and fix the header literal in `src/js/wbapi-server.js:function serializeD100Table(entries) {@1855` so an API write stops re-emitting the `_magic?`/`dagger`/`mainweapon` comment | 🟢 none |
| **§DX-02aa** | A WBAPI write from a stale server silently reverts hand-edited engine JS, and no gate, test or commit message can see it (Hazard #1, measured at 68 days). Wants `./api.sh` to refuse a write when the server's loaded source differs from the file on disk | 🟢 none |
| **§DX-02ab** | `GET /api/loot-drop`: 20 day fish double-counted, 5 night fish silently dropped, no `./api.sh` wrapper, absent from `wbapi-help.md` and `API-README.md` | 🟢 none |
| **§DX-02v** *(extended)* | `mechanics.md` contradicts itself on `LOOT_TABLE` — `:209` "removed" vs `:1016` "live `const array[20]`"; both `docs/mechanics/` rows carry the same dated claim | 🟢 none |
| **§FISH-02** *(narrowed + extended)* | The dagger/mainweapon branches are dormant-and-re-armable by design, not dead code; and `DAGGER_ITEMS`' four priced +N daggers have **no** grant path at all | 🟡 design |

---

*Report written 2026-06-05 · verified and rewritten 2026-08-12 under §DOC-02v (382 → 325 lines).*
*Codebase: `play.html` · `src/js/wbapi-server.js`*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
