<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — Yugurt Lake Bait & Tackle (Layer 47) and the `plan.md` Prompt Protocol

**Original:** roll2hit.com development session, 2026-05-24 · **Verified against HEAD:** 2026-08-12 (§DOC-02n)
**Subject:** `roll2hit-v3.html` — single-file browser D&D 5e RPG (14,377 lines at authoring; 38,712 at HEAD)
**License:** MIT — roll2hit.com — Copyright (c) 2026

---

## Abstract

This report specified the Yugurt Lake **bait** economy (Layer 47): a `BAIT_FISH_POOL` of 20 catchable
freshwater species used as ammunition, a tackle box, three depth zones, a `2d20` predator-attraction
roll, a Luck stat wired into seven roll points, and a **two-sided magic-weapon trade** — nerf monster
drops to negative bonuses so that fishing becomes the sole source of positive ones. It also analysed
the `index.md` directive ("Adding = Planning; Implementing = Code + Sync") that produced it.

Re-measured at HEAD, the result is a **partial implementation whose two halves were split apart**.
The Luck stat shipped with its formula byte-exact. The zone/bait/cast loop shipped, but under an
entirely different data model — bait is *foraged*, not *caught*, and `BAIT_FISH_POOL` and all 20
species have **0 commits ever**. The weapon trade shipped **one-sided**: the nerf landed, harder than
specified, and the compensating fishing drop was never built, leaving 48 of 60 generated weapons with
no live grant path (**§FISH-02**). And the entire subject is unreachable — `storyFishing()` has never
been callable in production (**§FISH-01**, confirmed independently here).

Census: **14 of 22 named identifiers resolve (64 %)**; **0 of 20 bait species**; **7 of 12 specified
quests**; **2 of 2 node codes were correct when written**.

---

## I. Method

Instruments per the §DOC-02 program: batch `grep -c` census before reading; `git log -S` on every
symbol scored dead, to separate **RETIRED** from **NEVER SHIPPED**; `git show` against the archive for
any claim about the past; the delta table run **both ways**, so a specified behaviour absent from HEAD
is an engine defect, not automatically a stale claim; per-column diffing of any table before scoring
it; and corpus cross-checking against the sibling report `lab-report-fish-with-dnd.md` (§DOC-02m),
which measured the *predator* half of the same sub-system.

A claim that did not ship is marked **NOT SHIPPED** and **kept**. A silently deleted claim reads as
one that held.

---

## II. Design Intent and Playability Rationale

The inspiration is a **second, parallel progression ladder** that does not run through combat. The
game's main loop is walk → fight → loot. Fishing was designed as an alternative loop — search →
bait → cast → land → sell — that pays into the *same* XP and gear pools, so a player who dislikes
the combat treadmill still advances.

Four specific contributions to playability were argued:

1. **A non-combat route to Level 20.** Fishing XP flows through the standard `_checkLevelUp()` path,
   so a "pacifist angler" is a viable build with no special-casing.
2. **Self-teaching progression.** Zone access is earned, not chosen: the Reeds and the Deep unlock
   from play, so the lake paces itself without a tutorial.
3. **Replacing a degenerate loot mechanic.** Random positive magic weapons from ordinary monsters
   made gear a function of grind time. Routing power through a skill-and-stat-gated sub-game makes
   gear a function of *engagement with a system*.
4. **Giving the six ability scores a joint consequence.** Luck is a geometric mean, so it punishes
   dump stats — it converts six independent numbers into one number the player can feel.

**How much of that intent reached players is the subject of §V.** Points 1 and 2 shipped. Point 3
shipped only in its subtractive half. Point 4 shipped in full. All four are then gated behind
§FISH-01, which makes the lake unreachable.

---

## III. As-Built Inventory

**Live, under the specified name**
`tackleboxZoneUnlocks: {shore:true@23107` · `baitFishingActive: false@23107` (inert — see §V-D) ·
`fishingCatchLog` (13 sites; sole writer `S_story.fishingCatchLog.unshift@30614`) ·
`isFishingLake` (`BOO:{ num:75@8782`, read at `const hasFish = node.isFishingLake;@35366`) ·
`_rollMonsterWeaponDrop` · `storyFishing` (`function storyFishing() {@30392`).

**Live, under a different name**
`getLuck()` → **`_calcLuck()@23438`** + **`_luckMod()@23444`** · `BAIT_FISH_POOL` → **`BAIT_TABLES = {@26632`**
(3 zones × 6 foraged items) · `equippedBait` → `_getSessionBait()` · `_checkTackleboxZoneUnlocks()` →
inlined at `_zoneUnlocks.reeds && _catchLog.length >= 1@30471` · `predatorRank` →
`tDie + bait.type + _luckMod()@30556`.

**Not shipped — 0 occurrences and 0 commits ever**
`BAIT_FISH_POOL` · all 20 bait species (sampled: `fathead_minnow`, `mummichog`, `blacknose_dace`) ·
`equippedBait` · `tacklebox` (the object) · `_checkTackleboxZoneUnlocks` · `_fishingMagicWeaponDrop` ·
`predatorRank` · `baitBonus` · the prefix `Salvaged`.

**Present at HEAD, absent from the spec**
`LAKE_MAGIC_DB = {@26536` (§DROP-03 — rank-gated passive items, granted at `if (_fishRank >= 11@7073`) ·
`FISHING_GUIDE_TEXT@26659` · `FISH_SIZE_TIERS` · `FISH_GOLD_VALUES` · `NIGHT_FISH_POOL` · `FISHING_RODS` ·
the four-phase cast that replaced `2d20` (§DOC-02m).

---

## IV. Spec → Shipped Delta

Two-way. **STALE** = the report aged. **NOT SHIPPED** = specified, absent at HEAD, engine-side gap.
**RETIRED** = shipped, later removed. **EXTENDED** = HEAD exceeds the spec.

| # | Spec claim | HEAD | Verdict |
|---|---|---|---|
| 1 | `BAIT_FISH_POOL`, 20 species × 5 tiers, caught as ammunition | 0 occurrences, 0 commits ever | **NOT SHIPPED** |
| 2 | Bait fish have AC/HP, one hit catches them, XP on catch | No bait combat exists; bait is foraged on a WIS check | **NOT SHIPPED** |
| 3 | Bait sourced from a tackle box (`tacklebox: {}`) | Bait lives in `S_story.inventory` as `type:'bait'` | **NOT SHIPPED** (replaced) |
| 4 | 3 zones: Shore / Reeds / Deep | Shipped as `bank` / `reeds` / `shallows`, bridged by `_zoneMap = { bank:'shore'@30473` | **SHIPPED, renamed** |
| 5 | Zone gate = Tier 2 / Tier 4 bait held | Gate = catch-log progress (≥1 catch; a Large+ catch) | **SHIPPED, different mechanism** |
| 6 | Per-zone find DC 8 / 12 / 16 | Flat `S_story.fishingBaitSatchel ? 8 : 10@30491` in all three zones | **NOT SHIPPED** → §AUDIT-03v/w |
| 7 | Effective DC = zoneDC − Luck Mod | `- _luckMod()@30491` | **SHIPPED** |
| 8 | Bare Hook = −3 to Catch Roll | `catch:_luckMod()@30526` — **+1** at the default statline | **NOT SHIPPED** (sign inverted) |
| 9 | `predatorRank = clamp(2d20 + baitBonus + LuckMod, 1, 20)` | 4-phase cast; `tDie + bait.type + _luckMod()@30556` | **RETIRED** (§DOC-02m) |
| 10 | Condition ladder by rank (Poisoned→Paralyzed→Cursed, CON DC 12–20) | No rank→condition map; conditions are player-applied from `CONDITION_ITEMS = [@22409` | **NOT SHIPPED** |
| 11 | Rank-20 predator "Yugurt's Dread" | Shipped as a **monster name**, `fish_20: { key:'fish_20'@5376` (AC 20 — matches) | **SHIPPED, as data not mechanic** |
| 12 | Every predator drops a magic weapon | No weapon is minted in the fishing path | **NOT SHIPPED** |
| 13 | `weaponMagicBonus = floor(fish.ac / 4) + max(0, LuckMod)` | `ac / 4` — 0 occurrences in the file | **NOT SHIPPED** |
| 14 | Monster drop nerf to `[−3, 0]` on a d4 | `deg = Math.min(0, d6 - 5)@24592` → **[−4, 0]** on a d6, plus a `w.magicBonus === 0 && !ownedTiers@24587` pool filter | **SHIPPED, stronger** |
| 15 | Prefixes Rusted/Chipped/Worn/Salvaged | `Wrecked/Rusted/Chipped/Worn/—`; `Salvaged` 0 commits ever | **NOT SHIPPED** (renamed set) |
| 16 | Luck = `⌈(∏ scores)^(1/6)⌉`, edge case product ≤ 0 | `_calcLuck()@23438` — byte-exact, including the guard | **SHIPPED, exact** |
| 17 | `Luck Mod = floor((Luck − 10) / 2)` | `_luckMod()@23444` — byte-exact | **SHIPPED, exact** |
| 18 | Luck never stored, computed on demand | Correct — no `S_story` field | **SHIPPED, exact** |
| 19 | Luck at 7 roll points | 4 shipped, 3 not (see §V-C); **2 unspecified additions** | **PARTIAL / EXTENDED** |
| 20 | Luck on fishing death saves only | `Math.ceil(Math.random() * 20) + _luckMod()@25896` applies to **all** death saves | **EXTENDED** |
| 21 | Tournament tiebreaker: higher Luck Mod, **coin flip on equal** | Higher Luck Mod shipped; equal Luck Mod leaves `'tie'` — no coin flip | **PARTIAL** |
| 22 | Q-FISH-00 … Q-FISH-05 (6 quests) | Only `quest_fish_01` exists | **1 of 6** |
| 23 | Q-TOUR-01 … Q-TOUR-06 (6 quests) | `quest_tour_01`–`06` all live | **6 of 6 SHIPPED** |
| 24 | 4 new `_S_DEFAULTS()` fields (§V-A) / 5 fields (§II-D) | 3 names shipped; 2 of those function | **PARTIAL + self-contradiction** |
| 25 | Fishing XP flows through `_checkLevelUp()` unchanged | Correct | **SHIPPED** |
| 26 | Node `YL`, node 75 | `BOO:{ num:75@8782` — renamed, `num`/label/`isFishingLake`/`loot` preserved | **RIGHT WHEN WRITTEN** |
| 27 | Node `YC` (cabin) | `SSJ:{ num:76@8786` — renamed, `sleepCost:0` preserved | **RIGHT WHEN WRITTEN** |
| 28 | "Nothing has been written to `roll2hit-v3.html`" | False since Layer 47 shipped | **STALE** (by design — it was a Phase-1 statement) |
| 29 | "`plan.md` is 2,500+ lines" | `plan.md` does not exist — split into `CONTRIBUTING.md` + `BACKLOG.md` at `5e48dd7` | **STALE** |
| 30 | Appendix B worked example | Conclusion right, both intermediates wrong (§V-E) | **PARTIAL** |

---

## V. Findings

### A. The magic-weapon trade shipped one-sided — no live path grants a positive weapon (**§FISH-02**)

The report's economic thesis was a trade: **take** positive bonuses away from monster drops, **give**
them back through fishing. Only the taking side exists.

- **Taking, shipped and stronger than specified.** `_rollMonsterWeaponDrop` filters its pool to
  `w.magicBonus === 0 && !ownedTiers@24587` and degrades the result by `deg = Math.min(0, d6 - 5)@24592`
  (−4 … 0). A monster kill can never yield a positive weapon.
- **Giving, never built.** `_fishingMagicWeaponDrop` and `ac / 4` have **0 occurrences and 0 commits
  ever**. The fishing victory path only overrides the drop's *sell* value with size×rarity gold; the
  reward that did ship is §DROP-03's `LAKE_MAGIC_DB = {@26536`, a different class — passive stat items,
  not weapons.
- **The third path closed silently.** `_rollD100Loot` still branches on `w.magicBonus === row._magic@24567`
  and on a `dagger` type — but `const _D100_TABLE = [@24516` holds **seven rows** (potions, scroll,
  flashbang, gold) totalling `]; // total weight = 100@24524` and contains **neither `mainweapon` nor
  `dagger`**. Both branches are unreachable, and `_magicTierAllowed(magic) {@24509` — whose only two
  callers sit inside them — is a dead function.

**Net:** `WEAPON_ITEMS = [0, 1, 2, 3, 4]@24494` generates 5 magic tiers × 12 base weapons = 60 items.
The 48 with `magicBonus` 1–4 have **no live grant path**, and no positive `magicBonus` literal exists
anywhere in the file. A player's main-hand weapon is permanently capped at base tier or degraded.

The engine asserts otherwise in its own source: `// FC06: monster drops capped at base tier@24586`
continues *"fishing is the only source of +bonus weapons."* Per §DOC-02g, **an engine comment is a
claim, not authority** — this one names a compensating mechanism with zero commits.

### B. One readable item carries two unimplemented mechanical promises (**§AUDIT-03v/w cluster, 8th instance**)

`const FISHING_GUIDE_TEXT@26659` is the reward readable of `quest_fishing_guide`. It tells the player
two things the engine does not do:

1. *"Shore (The Bank) — DC 8. Reeds — DC 12. Deep (The Shallows) — DC 16."* The find DC is computed
   once, without reference to the zone, at `S_story.fishingBaitSatchel ? 8 : 10@30491`. Because deeper
   zones carry strictly better bait at an **identical** cost, the Bank is strictly dominated the moment
   the Reeds unlock — the inverse of the risk/reward gradient the guide describes.
2. `Weapon bonus = floor(fish AC / 4) + max(0, Luck Mod).@26679` — the §V-A formula that was never built.

This is the first instance in the cluster where a **single string** carries two distinct unbacked
promises, and both are this report's own specifications surviving as player-facing prose only.

### C. Luck: the formula was copied and is exact; the integration table was composed and is 4 of 7

`_calcLuck()@23438` reproduces the specified formula byte-for-byte, including the `product <= 0`
guard, over the exact default statline. Of the seven specified roll points: **shipped** — zone DC
(`- _luckMod()@30491`), type roll (`tDie + bait.type + _luckMod()@30556`), death save
(`Math.ceil(Math.random() * 20) + _luckMod()@25896`), tournament tiebreak (minus the coin flip);
**not shipped** — bait catch roll (no bait combat), predator hit roll, weapon drop quality.
**Unspecified additions:** a Luck term in the d100 loot roll, and `luckScale` in `LAKE_MAGIC_DB`.

The death-save site is worth isolating: it is unseeded `Math.random()` deciding a life-or-death
outcome that mutates persisted state — invariant #6, **outside** the fishing block and so not covered
by §DOC-02m's fishing cluster.

### D. Four fields with a broken reader/writer balance

- `S_story.fishingBaitSatchel` — declared, **2 readers, 0 writers**. The DC-8 discount can never be
  earned; the find DC is permanently `10 − LuckMod`. This is §DX-02u's **read-only** class, 2nd instance.
- `baitFishingActive: false@23107` — **1 occurrence**, its own declaration. It was specified to
  suppress node re-render during bait combat, which was never built.
- `fishingQuestFlags['searched_'+loc]@30512` — write-only, **0 readers**, and its key is *computed*,
  so a literal grep for a gate name would never find it either (the §EPIC-01 hazard in miniature).
- `fishingQuestFlags.q01 = true;@30611` — write-only, **0 readers**.

`fishingYugurtFavour` is the healthy counterexample: one writer (a quest `flag_write`), two readers.

### E. Instrument 12 holds — the formula was copied, the worked example was composed

Appendix B's arithmetic does not compute to its own answer. The product of the default scores is
**2,580,480**; the appendix prints **25,804,800** (one digit shifted). The true sixth root is
**11.71**; the appendix prints **11.54**. Both nonetheless round up to **12**, giving Luck Mod **+1**,
which is what the appendix concludes and what the engine produces — while the *printed* product would
have yielded 17.19 → Luck 18 → Mod +4.

So the conclusion is right and every intermediate is wrong: the transcribed formula is exact, the
illustration built to demonstrate it is not. Same split as §II-F's condition ladder — a six-row table
composed to display a difficulty gradient, with no engine counterpart, whose one accurate cell is the
AC 20 it shares with a real monster statline.

### F. The frame: everything measured above is unreachable (**§FISH-01**, re-confirmed)

`LYR:{ num:41@8723` (Arctic Wastes, act 7) is declared **59 lines before** `BOO:{ num:75@8782`
(Yugurt Lake, act 3), and both occupy the same cell — `BOO:{r:2,c:194}@9422`, `LYR:{r:2,c:194}@9423`.
`CELL_GRID` builds each cell in `NODE_MAP` declaration order and only `list[0]` can become
`currentCode`, so `const hasFish = node.isFishingLake;@35366` is never true and
`function storyFishing() {@30392` has never run in production. The cabin `SSJ:{ num:76@8786` sits alone
in its own cell, so the Fisherman, the free bed and the six-quest tournament still render — which is
why the gap reads as missing content rather than as a bug.

**Every "SHIPPED" verdict in §IV is therefore shipped-but-dark.** The fix is a two-line reordering and
does not wait on §AUDIT-03x's design call.

### G. Method note — a vocabulary split that is *not* a defect

`BAIT_TABLES = {@26632` is keyed `bank`/`reeds`/`shallows` while `tackleboxZoneUnlocks: {shore:true@23107`
is keyed `shore`/`reeds`/`deep`. This reads as a guaranteed `undefined` lookup and is not one: an
explicit `_zoneMap = { bank:'shore'@30473` reconciles them. Recorded because it was nearly filed as a
crash — **check for a translation layer before scoring a key mismatch.**

---

## VI. Recommendation Register — Outcome

| Spec item | Status at HEAD |
|---|---|
| Bait sub-loop (search → catch → tackle box) | **Superseded** — foraging replaced catching; design intent preserved |
| Three-zone progression | **Shipped**, on a different gate; DC gradient **not shipped** |
| Luck stat | **Shipped exactly**, and extended beyond the spec |
| Monster drop nerf | **Shipped**, stronger than specified |
| Fishing as the gear economy | **Not shipped** — §FISH-02 |
| Q-TOUR tournament chain | **Shipped 6/6** |
| Q-FISH chain | **1 of 6** |
| `index.md` directive | **Superseded** — `plan.md` split at `5e48dd7`; the two-phase workflow survives under new filenames |

**Doc surface.** `monsters.md:315/643` still describe `BAIT_FISH_POOL` and mark it **⚠️ PLANNED** /
**[PLANNED — Layer 47]** — accurate 80 days on, and the clearest evidence in this pass that the
directive this report argued for actually works. Two facts around them are stale: `monsters.md:317`
claims *"All 370 keys are present and unique in `MONSTER_POOL` — verified 2026-05-24"* (HEAD: **398**),
and `monsters.md:645` scopes bait to *"`isFishingLake:true` nodes (currently YL only)"* — a retired
node code, §DX-02v/§AUDIT-03ab class.

**On Appendix A.** The 20-species bait table is retained in full below, against the house rule that
transcribed data sections are deleted. That rule applies when `QUEST_DB` or `MONSTER_POOL` is the
single source of truth and the copy can only rot. Here the constant **never existed**, `monsters.md`
points at this report for its contents, and so this table is the specification of record.

---

## VII. Defects Filed

- **§FISH-02** *(new, small design call)* — no live path grants a positive-`magicBonus` weapon: 48 of
  60 `WEAPON_ITEMS` unreachable; `_rollD100Loot`'s `mainweapon` and `dagger` branches dead against a
  7-row `_D100_TABLE`; `_magicTierAllowed` a dead function; the FC06 engine comment asserts a fishing
  source with 0 commits. Call: restore via d100 rows, or build the specified fishing drop.
- **§AUDIT-03v/w cluster, 8th instance** — `FISHING_GUIDE_TEXT` promises a per-zone DC gradient and a
  weapon-bonus formula, neither implemented; first single string carrying two.
- **§DX-02u, 2nd instance (read-only)** — `fishingBaitSatchel`: 2 readers, 0 writers.
- **§DX-02n +3** — `baitFishingActive`, `fishingQuestFlags['searched_'+loc]` (computed key),
  `fishingQuestFlags.q01`; plus `_magicTierAllowed` as a **live function reachable only from dead
  branches**, which a reader/writer census scores as live.
- **§DX-02m, named instance outside the fishing block** — unseeded `Math.random()` on story death
  saves at `Math.ceil(Math.random() * 20) + _luckMod()@25896`.
- **§DX-02v extended** — `monsters.md:317` (370 vs 398 monsters), `monsters.md:645` (retired `YL`).

**Blocked on §FISH-01.** Every defect above except §FISH-02's d100 half and the death-save roll sits
inside unreachable code. Fix the `NODE_MAP` declaration order first, or none of it is testable.

---

## Appendix A — `BAIT_FISH_POOL` Specification of Record (NOT SHIPPED — 0 commits ever)

| Tier | Bonus | Species | AC | HP | XP | Zone |
|---|---|---|---|---|---|---|
| 1 | +1 | Fathead Minnow · Bluntnose Minnow · Bridle Shiner · Swallowtail Shiner | 3–4 | 2–3 | 5 | Shore |
| 2 | +2 | Golden Shiner · Comely Shiner · Satinfin Shiner · Ironcolor Shiner | 4–5 | 4–5 | 10 | Shore |
| 3 | +3 | Creek Chub · Common Shiner · Spotfin Shiner · Spottail Shiner | 5–6 | 6–7 | 15 | Reeds |
| 4 | +4 | Gizzard Shad · Alewife · White Sucker · Banded Killifish | 6–7 | 8–10 | 20 | Reeds |
| 5 | +5 | Tadpole Madtom · Margined Madtom · Mummichog · Blacknose Dace | 7–8 | 11–12 | 25 | Deep |

Slugs were specified as `snake_case` of the common name (`fathead_minnow`, `blacknose_dace`, …).
Species were sourced from a user-provided naturalist list and given 5e-conventional statlines.

## Appendix B — What Shipped Instead: `BAIT_TABLES` (foraged, 3 × 6)

Bait is found on a WIS (Survival) check and stored in `S_story.inventory` as `type:'bait'`. Each entry
carries `catch` (cast-roll bonus), `type` (rarity-roll bonus), `advantage`, and `sizeUp`.

| Zone key | Displayed as | Entries |
|---|---|---|
| `bank` | The Bank 🪨 | Lakebed Worm · Void Grub · Shore Beetle · Yugurt Pebble · Void-Touched Moss · Lakebed Pincher |
| `reeds` | The Reeds 🌿 | Reed Cricket · Yugurt Dragonfly · Lakeshore Web · Voidcap Mushroom · Wetland Root · Lakebank Snail |
| `shallows` | The Deep 🌊 | Yugurt Frog · Live Needle Minnow · Void Glow Fly · Sunken Chip · Lake Moss · Void Bloom |

---

*End of report.*

**MIT License — roll2hit.com — Copyright (c) 2026 — Free to use, modify, and share.**

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
