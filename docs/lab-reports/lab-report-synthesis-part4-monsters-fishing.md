<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report Synthesis — Part 4: Monsters & Fishing

**Original:** 2026-06-16 · **Stated baseline:** 33,721 lines · **Source reports:** 2
**Verified:** 2026-08-13 (§DOC-02be) against `play.html` @ 38,712 lines
**Provenance:** mtime `13:57:03`, commit `58f89cf` `13:57:40` — a **37-second** birth window.
Reference build `89fa13b` (`12:20:47`) is **33,721 lines**: the stated baseline, exact.

> **Verification banner.** This is a HISTORY document. Claims that did not ship are marked
> **NOT SHIPPED** and kept, never deleted. Original bare line numbers are preserved in the delta
> table as evidence of what the author read; live pointers are `symbol@line` (§DX-01e).

---

## I. Abstract

Yugurt Lake is the game's only *fishing* sub-game: a self-contained economy of 20 predator ranks,
18 baits, 4 rods, 8 passive relics, a night pool, a six-round tournament and one NPC who says the
same eight words for as long as it takes you to earn different ones. This synthesis cross-referenced
the two lab reports that designed it against the file as it stood on 2026-06-16.

**Result of re-measurement.** The document is an unusually strong *transcriber* and an unreliable
*narrator*. **31 of 31 line citations resolve exactly** at the reference build, and every figure it
copied out of a data block — 18 bait rows, 5 night species, 8 relics, 4 rod prices, 5 size tiers,
6 tournament stakes, 5 monster statlines — is byte-exact and **still exact at HEAD two months
later**. Every error is in a sentence the author *composed*: one inverted verdict on a system that
had already shipped at the line it cites, one rename history that never happened, one node code
three weeks dead, one encounter filed in the wrong access path, and one starting character the game
cannot create. Instrument 12's gradient, cleanly.

The largest correction is not an error in the report at all — it is an omission. **The entire layer
this document describes is unreachable by a player**, and has been since before it was written.

---

## II. Method

Pin the reference build from the mtime and diff the stated baseline against it; resolve every bare
citation *at that build*, not at HEAD; census each data block at both builds, proving the pattern
matches the block's **last** entry as well as its first; `git log -S` every claim scored dead, the
only thing that separates **RETIRED** (true when written) from **NOT SHIPPED** (written from
intent); and read against siblings rather than against HEAD alone. Both source reports have
themselves been verified — `lab-report-fish-with-dnd.md` (§DOC-02m) and
`lab-report-fishing-bait-prompting.md` (§DOC-02n) — so three documents adjudicate each other.

---

## III. Design intent — what the lake is *for*

Fishing exists because the rest of the game is a clock. The world ends on Day 49, travel costs days,
and nearly every verb the player has spends time they do not have. Yugurt Lake inverts the loop:
**you go there to be patient, and patience is the stat that pays.** Three design decisions carry
that intent, and all three shipped:

- **Fishing is the only positive-magic vector in the economy.** Monster kills were deliberately
  nerfed to *degraded* gear — `Wrecked`/`Rusted`/`Chipped`/`Worn` — so a `+2` blade has exactly one
  origin. The engine says so in its own margin:
  `// FC06: monster drops capped at base tier; fishing is the only source of +bonus weapons@24587`.
  Grinding orcs makes you rich. It does not make you *equipped*.
- **Luck prices breadth.** `⌈(STR·DEX·CON·INT·WIS·CHA)^(1/6)⌉` is a geometric mean, so one neglected
  stat drags the whole thing down and a min-maxed Fighter is unlucky at the lake by construction.
- **The lake cannot be conquered.** `pb.fish` suppresses `defeatedBattles[nodeCode]`, so no catch
  ever "clears" Yugurt. Every other encounter is a thing you finish; this one is a thing you *visit*.

The NPC is the payload. The Fisherman says one line — *"...Nice Day For Fishing. Yugurt!"* — and
keeps saying it until you have killed the shark, and then until you have found what is under the
shale. Only then does he set out a second cup, on the windowsill rather than the table. **He is a
relationship you earn by doing, and the game never once tells you that is what is happening.**

---

## IV. As-built inventory (HEAD, 2026-08-13)

| Structure | Anchor | Census | Status |
|---|---|---|---|
| `FISH_POOL` | `const FISH_POOL = [@26505` | **20** ranks, `{rank,key,name,desc}` | SHIPPED |
| `NIGHT_FISH_POOL` | `const NIGHT_FISH_POOL = [@26527` | **5**, ranks 6/8/10/12/14 | SHIPPED §XLVIII |
| `LAKE_MAGIC_DB` | `const LAKE_MAGIC_DB = {@26537` | **8**, all `sell:0`, minRank 11–20 | SHIPPED §DROP-03 |
| `BAIT_TABLES` | `const BAIT_TABLES = {@26633` | **3 × 6 = 18** | SHIPPED |
| `FISHING_GUIDE_TEXT` | `const FISHING_GUIDE_TEXT =@26660` | readable, 1 reader | SHIPPED (see F6) |
| `FISH_SIZE_TIERS` | `const FISH_SIZE_TIERS = [@26686` | **5** bands, 1–4/5–9/10–14/15–19/20 | SHIPPED |
| `FISHING_RODS` | `const FISHING_RODS = [@26701` | **4** tiers, 20/75/200/600gp | SHIPPED |
| `NPC_TOUR_OPPONENTS` | `const NPC_TOUR_OPPONENTS = [@26709` | **6**, Pip −1/50gp → The Fisherman +8/1500gp | SHIPPED §XLV |
| Four-phase cast | `function storyFishing() {@30393` | DEX → Catch → Type → select | SHIPPED |
| Luck | `function _calcLuck() {@23439` | 6th-root, `product <= 0` guard | SHIPPED |
| Drop nerf | `function _rollMonsterWeaponDrop@24582` | `const deg = Math.min(0, d6 - 5);@24593` | SHIPPED (see F2) |
| Lake gate | `const hasFish = node.isFishingLake;@35348` | **1** flagged node (`BOO:{ num:75@8782`) | SHIPPED, unreachable (F1) |
| Zone alias map | `const _zoneMap = { bank:'shore'@30474` | reconciles 2 vocabularies | SHIPPED |

Quest surface: **8** quests declare `activateNode:'SSJ'` (the six-round §XLV tournament plus
`quest_fish_01` and `quest_fishing_guide`); **3** declare `activateNode:'BOO'`
(`quest_horned_shark`, `quest_night_eel`, `quest_shale_drop`); the six-part Emmer Finch arc
`quest_guide_01`–`06` is chained rather than node-activated and completes off `fishingCatchLog`.

Special statlines, all exact as reported: `horned_shark` AC 15 / HP 120 / 2d8+8 / deadly ·
`cave_lurker` AC 15 / HP 88 / 3d8+5 / hard · `night_03` AC 12 / HP 38 / 2d8+3 / medium ·
`fish_01` AC 5 / HP 4 / 1d3 · `fish_20` AC 20 / HP 220 / 4d12+9.

---

## V. Delta table

| # | Report's claim | Measured | Verdict |
|---|---|---|---|
| 1 | 2d20 lo/hi range mechanic | four-phase Catch/Type/Size | **RETIRED** — shipped verbatim at `32c10c5`, replaced by Layer 47 |
| 2 | `storyFishing()` @26,731 · `FISH_POOL` @24,229 · `FISH_SIZE_TIERS` @24,387 · `LAKE_MAGIC_DB` @24,261–24,269 · `BAIT_TABLES` @24,334 · rods @24,403–06 · `NIGHT_FISH_POOL` @24,251 · `pb.fish` @32,571 · `_calcLuck` @21,519 · `_luckMod` @21,525 · the 7 Luck sites · `_rollMonsterWeaponDrop` @22,533 · `BOO` @8,010 · `SSJ` @8,014 · guide @24,381 · profile @21,049 · portrait @20,789 · zone unlocks @26,810–11 · sheet @33,048 | **31 of 31 exact** at `89fa13b` | **EXACT** |
| 3 | 18 bait rows with catch/type/ADV/SizeUp | **18/18 byte-exact** | **EXACT** |
| 4 | 8 lake relics, "no sell value", minRank 11–20 | 8, all `sell:0`, minRank 11–20 | **EXACT** |
| 5 | Relic effects "AC, ATK, firstStrike, **catch**, nightType, allAbility" | `ac_bonus · atk_bonus · first_strike · **fishing_dc** · night_type · all_ability` | **WRONG** — no `catch` effect; `Yugurt's Eye` cuts the search **DC** |
| 6 | Phase 1 "d20 + DEX mod **vs DC 12**" | `const castMod = dexTot@30535` is a **three-band** test: `<12 → −2`, `≥17 → +2`, else 0 | **INCOMPLETE** — the perfect-cast threshold (17) is unstated; there is no pass/fail |
| 7 | "Global monster drop nerf **not implemented**" | implemented **at the cited line**, comment included | **INVERTED** → F2 |
| 8 | Fish ranks 3–19 "renamed" from the original report | 7/7 original names: **0 commits ever** | **NEVER EXISTED** → F3 |
| 9 | Rod shop and tournament "at **YC**" | both gate on `node.code === 'SSJ'`; `YC` died 2026-05-29 | **FOSSIL** → F4 |
| 10 | Lantern Eel is outside the Cast a Line path | rank 10 of the night pool, drawn by any night `large` result | **WRONG** → F5 |
| 11 | Guide "reveals zone DCs" | guide states 8/12/16; code uses **one flat DC** for all three | **NOT SHIPPED** → F6 |
| 12 | "Starting scores (16,12,14,10,12,8) yield Luck 12, Mod +1" | arithmetic exact; the character is impossible. Real start = Luck **9**, Mod **−1** | **WRONG SUBJECT** → F7 |
| 13 | "`EB_NPC_DIALOGUE` pool entry at 9,322" | line exact; the registry is **`NPC_DIALOGUES`**. `EB_NPC_DIALOGUE` is EB-code-keyed and holds no fisherman | **MISATTRIBUTED** |
| 14 | "Phase 1 = `plan.md` … the living governance protocol" | `plan.md` was split into CONTRIBUTING.md + BACKLOG.md, 2026-07-09 | **STALE** (true when written) |
| 15 | `isFishingLake` is the sole gate; only `BOO` carries it | 2 occurrences: the flag and its one reader | **EXACT** |
| 16 | `pb.fish` prevents node lock | `!pb.corridor && !pb.fish@36591` | **EXACT** (the `!pb.stalk` term was deleted with §TIMELESS-01) |
| 17 | Fisherman has neutral/friendly/dearFriend arcs + 3-state quote | exact, both | **EXACT** |
| 18 | `FISH_POOL` comment says "Yugurt's Leviathan", data says "Yugurt's Dread" | still true at HEAD | **EXACT** — already filed §DX-02v |

---

## VI. Findings

### F1 — The layer is unreachable, and the report does not know it *(highest impact)*

This document's closing section is titled *"What Is Structurally True Right Now."* What was
structurally true right then, and still is, is that **no player can reach Yugurt Lake.**

`CELL_GRID` iterates `Object.keys(NODE_MAP)` and only `list[0]` can become `currentCode`.
`LYR:{ num:41@8723` (Arctic Wastes, act 7) and `BOO:{ num:75@8782` (Yugurt Lake, act 3) both
occupy cell `2,194` — and `LYR` is declared **59 lines earlier**. Arriving at that cell renders the
arctic node, `const hasFish = node.isFishingLake;@35348` is never true, and `storyFishing` has
exactly one call site: that chip. `BOO` has `sleep:false`, so respawn cannot reach it either.

Stranded: 11 quests, ~100 authored data rows, two flag writers, one key event — and the four
Luck integration points the report calls "load-bearing." The cabin survives (`SSJ:{ num:76@8786`
is alone in its cell), so **the player can meet the Fisherman and never fish.** Filed as
**§FISH-01** by §DX-02m; re-confirmed unchanged at HEAD by this pass. The fix is mechanical and
waits on no design call.

*A synthesis reads its sources for what they claim. Nothing in either source could have told it
that the node ordering had eaten the subject — which is exactly why a cross-reference document
needs a reachability check of its own (instrument 19).*

### F2 — "Not implemented" was implemented, at the line the report cites

> **Report:** *"`_rollMonsterWeaponDrop()` (line 22,533) exists but the `[-3, 0]` range change from
> the lab report was not applied. Monster drops still use the original bonus range."*

At line 22,533 of the reference build: `const deg = Math.floor(Math.random() * 4) - 3; // −3 to 0`,
prefixed `['Rusted ','Chipped ','Worn ','']`, three lines under a comment reading *"fishing is the
only source of +bonus weapons."* The trade the source report specified had shipped in full. At HEAD
it has shipped **harder** — `const deg = Math.min(0, d6 - 5);@24593` widens the floor to −4, adds a
`Wrecked` tier, and draws from the seeded stream (§VM-01-B).

The author pasted a correct pointer and wrote the opposite sentence beside it. The one real delta
is cosmetic: the spec's `Salvaged` prefix at 0 shipped as an empty string. *A citation carries no
evidential weight (instrument 27) — it proves the author found the line, not that they read it.*
The other half of this trade — whether the `+bonus` gear the nerf defers to can be obtained at all
— is F1's problem, and is tracked as **§FISH-02**.

### F3 — The rename table is not a rename table

All **seven** "Original name" entries — `Spine Perch`, `Venom Roach`, `Razorback Carp`,
`Poison Bream`, `Barbed Tench`, `Venom Pike`, `Razorfin Zander` — return **0 commits in the file's
entire history**. `FISH_POOL` shipped with its live names and has never carried any other. The
source report's name column was reconstructed from the table's *shape*, not copied — §DOC-02m proved
it per column (names 3/20 correct, `tier` 20/20, because a rule can regenerate a tier and cannot
invent a noun). This synthesis read that reconstruction as an editorial record and supplied a
motive: *"Names shifted toward more evocative prose."*

***Nothing shifted. A wrong figure is an erratum; a wrong figure with a plausible story attached is
a false map, and the next author walks on it*** (instrument 52).

### F4 — `YC` is a fossil, and the place it names is `SSJ`

The report places the rod shop and the tournament "at YC" three times. There is no `YC` node — but
there **was**: `YC:{ num:76, code:'YC', name:'yugurt_cabin', label:'Yugurt Cabin', act:3` at
`32c10c5` (2026-05-24, the earliest surviving build). It was renamed to `SSJ` — same `num`, same
terrain key, same label — by `c1d5a94` (2026-05-29 22:45). **RETIRED, not born-dead**; only the
archive can say so (instrument 8).

The comments were never updated, so the report copied a fossil three weeks stale — while its own
Summary gets it right (*"the tournament chain run through SSJ"*) three pages later. Both gates read
`node.code === 'SSJ'`. The count has since **grown**: 4 comment sites at the reference build,
**6 at HEAD** — §VM-01-G2b's hook migration duplicated `// ── Rod Shop at YC ──` and
*"(YC only, requires Fishing Rod)"* into two new call sites while correctly rewiring the code
beneath them. *A migration repairs the references that break and carries the one that doesn't*
(instrument 38). Filed: **§AUDIT-03s extended**.

### F5 — The Lantern Eel is an ordinary night catch

> **Report:** *"Three non-`FISH_POOL` fish exist in `MONSTER_POOL` for specific quest encounters …
> These three are accessed via specific quest conditions, not the standard Cast a Line path."*

`night_03` is rank 10 of `NIGHT_FISH_POOL`, and the selector draws it on any night cast that lands
in the `large` band: `_nightInTier = NIGHT_FISH_POOL.filter(f => f.rank >= tier.minRank …)`, then
`isNight && _nightInTier.length` takes priority over the day pool. `quest_night_eel` is a quest
*about* a fish anyone can catch, not a gate on catching it. The report's own §"Night fishing added"
bullet, two pages earlier, lists the Lantern Eel among the five night species. Correct grouping:
**two** story-gated encounters (`horned_shark` at `BOO`, `cave_lurker` at `MJF`) and one night
species that happens to have a quest attached.

### F6 — The Fishing Guide's central table is fiction *(new defect)*

`FISHING_GUIDE_TEXT` is the reward readable for `quest_fishing_guide`, and its headline content is
a difficulty gradient:

```
  Shore (The Bank)   — DC 8.  Worms, grubs, pebbles. Common bait.
  Reeds              — DC 12. Crickets, moss, caps. Better type bonus.
  Deep (The Shallows)— DC 16. Frogs, minnows, bloom. Strongest effects.
```

The code computes `Math.max(4, (S_story.fishingBaitSatchel ? 8 : 10) - _luckMod())` — **once**,
with the zone (`loc`) never consulted. All three zones share one DC, and none of the three printed
numbers is it. The player is handed a document that reads like a mechanic and describes nothing.
Compounding it, `fishingBaitSatchel` has 2 readers and 0 writers (**§DX-02u**), so the DC-8 branch
is unreachable and the true value is a flat `10 − LuckMod` everywhere. Filed: **§FISH-03**.

*This is the shape a reward item should never have: the gradient is a good design — deep water
should cost more to work — and shipping the prose without the branch converts a feature into a lie.*

### F7 — Luck 12 describes a character the game cannot create

`(16,12,14,10,12,8)` → product 2,580,480 → Luck 12, Mod +1. The arithmetic is exact. The statline
is not a starting character and never has been: it exists only as the dead `||` fallback in
`const s = S_story.abilityScores || { str:16, dex:12, con:14, int:10, wis:12, cha:8 };@23440`,
which is unreachable because `_S_DEFAULTS()` and `storyNewGame` both always set the field. The real
default `(10,8,8,8,8,8)` gives product 327,680 → **Luck 9, Mod −1** — a starting character whose
Luck is a *penalty*, which materially changes the report's "invest broadly" advice.

Already filed as **§DX-02ac**, which counted three propagations. This is the **fifth** document
carrying it. ***A dead `||` branch naming a plausible data shape reads exactly like a declaration.***

### F8 — Three names for three zones, reconciled by one line

The third zone is `shallows` in `BAIT_TABLES`, `deep` in `tackleboxZoneUnlocks`, *"The Deep 🌊"* on
the button and *"Deep (The Shallows)"* in the guide; the first is `bank`/`shore`/*"The Bank"*.
`const _zoneMap = { bank:'shore', reeds:'reeds', shallows:'deep' };@30474` holds it together. The
report transcribes **both** vocabularies correctly and never notices they name the same three
places. Not a defect — but a new zone must be added in three places and mapped in a fourth.

---

## VII. What still applies

- **`isFishingLake:true` is the gate, and node *declaration order* is the real one.** One flag, one
  reader, one node — and a node 59 lines above it in `NODE_MAP` currently wins the cell. Any new
  fishing node needs the flag **and** a cell it is `list[0]` of.
- **`pb.fish` prevents node lock, and it is load-bearing.** Any fish battle raised outside
  `_startFishBattle()` must set it, or the lake becomes a thing you can finish.
- **Bait is a four-field interface.** A `BAIT_TABLES` row needs `catch` and `type` (0 is valid)
  plus `advantage` and `sizeUp` booleans. Missing fields read as `undefined` in an arithmetic sum.
- **Zone unlock is progress-based, not inventory-based.** Reeds after the first catch; Deep after
  a `large`-or-better landing. The source report's tacklebox-tier gating was not implemented, and
  the simpler gate needs no inventory UI — don't reintroduce it.
- **Luck is the fishing economy's spine.** Seven integration points, geometric mean, read-only.
  Do not bypass them; do not quote `16/12/14/10/12/8` as a starting character.
- **The Fisherman's dialogue is calibrated.** He notices the shark. He notices what happened
  underground. He says nothing until the relationship has earned it. No tutorial dialogue, no
  explanatory text — the second cup on the windowsill is the whole payoff.

---

## VIII. Backlog

| Row | Subject | Status |
|---|---|---|
| **§FISH-01** | `BOO` loses cell `2,194` to `LYR`; the entire layer is unreachable | open, no design call |
| **§FISH-02** | the drop nerf's other leg — can `+bonus` gear be obtained at all | open |
| **§FISH-03** | `FISHING_GUIDE_TEXT` promises per-zone DCs 8/12/16; the code uses one flat DC | **NEW**, small design call |
| **§AUDIT-03s** | `YC` ×6 in engine comments — a code retired 2026-05-29, two sites minted by a 2026-08 migration | **EXTENDED** |
| **§DX-02ac** | the `16/12/14/10/12/8` fallback — this is the 5th document carrying it | **EXTENDED** |
| **§DX-02u** | `fishingBaitSatchel`: 2 readers, 0 writers | open (corroborated) |
| **§DX-02v** | `FISH_POOL`'s comment still says *"Yugurt's Leviathan"*; three home docs still teach 2d20 | open (corroborated) |

---

*Synthesis Part 4 of 7 · Next: Part 5 — NPC & Narrative · verified §DOC-02be, 2026-08-13*
