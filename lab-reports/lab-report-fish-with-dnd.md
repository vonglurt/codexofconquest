<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — Yugurt Lake: Fishing as a Predator Encounter System

**Original:** 2026-05-22 · **Verified against HEAD:** 2026-08-12 (§DOC-02m)
**Subject:** the Yugurt Lake fishing sub-game — node pair, fish pool, cast mechanic, reward loop
**Status:** design intent **upheld and extended**; the original cast mechanic **RETIRED**; the
whole feature is **currently unreachable in the shipped build** (Finding 1).

---

## ABSTRACT

This report specified fishing as a *predator encounter system* rather than a patience minigame:
a cast is an invitation, and what answers is a combatant resolved by the same 5e engine as every
other fight. That thesis shipped and has been extended fourfold since — the 20-rank pool it
described is byte-identical to the earliest surviving build and to HEAD, 80 days later, and four
later layers (§XLV–§XLIX, §DROP-03) bolted bait, rods, night species, rarity, lake magic and a
six-opponent tournament onto it without touching the pool.

Three results were measured. **(1)** The lake node is **non-primary in its cell** and therefore
unreachable: `LYR` (Arctic Wastes) is declared before `BOO` (Yugurt Lake) in `NODE_MAP` and both
occupy cell `2,194`, so the only surface that opens the fishing modal never renders. Eleven
quests and roughly 100 authored data rows are stranded. **(2)** The report's 20-row statline
table is a **reconstruction, not a transcription**: the columns a formula regenerates are right
(tier 20/20, atk 18/20, AC 17/20) and the columns carrying authored data are wrong (name 3/20,
HP 2/20, damage 3/20); 17 of its 20 fish names have **zero commits in the file's entire history**.
**(3)** The 2d20 range mechanic — the report's centrepiece — **shipped verbatim** and was later
replaced by a four-phase Catch system, which three live home docs still describe as future work.

---

## I. INTENT AND PLAYABILITY RATIONALE

*(Restated, because the delta table below is only meaningful against what the feature was for.)*

Most games make fishing a **patience** mechanic: wait, press, receive. That teaches the player
nothing and interacts with nothing. The design premise here is the inverse — **the rod is bait,
and the fish are what answer.** Every entry in the pool is a combatant with AC, HP, an attack
bonus and a damage expression, so a cast routes into the engine the player already knows.

What this buys the game, concretely:

1. **A difficulty dial the player sets themselves.** The lake is not level-gated. Rank 1 is a
   Needle Minnow (AC 5, HP 4); rank 20 is Yugurt's Dread (AC 20, HP 220, 4d12+9) — a boss-weight
   encounter. The player chooses how hard to pull.
2. **An optional act-3 destination with no quest tax.** The cabin sleeps free (`sleepCost:0`),
   the rod is free node loot, and nothing about the lake is mandatory. It is a place to *go*,
   which a world of 416 nodes needs more of than it needs another errand.
3. **One vocabulary, no second engine.** Conditions, initiative, flanking, death saves, the
   `floor(0.1 × AC × maxHP)` reward formula — fishing reuses all of it. The Fishing Rod is a
   condition item like any other, granting **Hooked** (advantage) rather than a bespoke buff.
   Nothing here is a special case, which is why four later layers could extend it cheaply.
4. **A repeatable node in a world of one-shot encounters.** Ordinary combat sets
   `defeatedBattles[nodeCode]` and the node is spent. Fish battles are exempt, so the lake is one
   of the few places a player can return to deliberately. *You are not winning the lake — you are
   fishing in it.*
5. **Character through restraint.** The Fisherman charges nothing, asks nothing, sends you
   nowhere, and says the same sentence forever. He is the game's demonstration that an NPC can be
   fully present without being a quest dispenser.

**All five hold at HEAD as design.** Finding 1 is that no player can currently reach any of them.

---

## II. METHOD

| # | Instrument | Applied to |
|---|---|---|
| 1 | Batched `grep -c` census of every symbol the report names | 40 identifiers, before reading any engine code |
| 4 | `git log -S "<symbol>"` on every dead symbol | 8 sampled fish names + `Captain Rhistle` — all **0 commits ever** |
| 8 | `git show 32c10c5:roll2hit-v3.html` (earliest surviving build, 2026-05-24) | the fish pool, the node pair, the cast function, the lock line |
| 12 | Copy-vs-compose partition | the statline table, per column (§V) |
| — | Cell-primacy check via `CELL_GRID` declaration order | the two Yugurt nodes (Finding 1) |

Instrument 8 was decisive twice, in opposite directions. It proved the node codes `YL`/`YC` were
**right when written** and later renamed — the §DOC-02l result, repeating — and it proved the fish
statline table was **wrong when written**, because the live values were already in place two days
after the report's own date.

---

## III. AS-BUILT INVENTORY (HEAD, 2026-08-12)

### III.A The node pair

| Field | HEAD | Report | Verdict |
|---|---|---|---|
| Lake node | `BOO:{ num:75@8782` — `yugurt_lake`, act 3, cell `2,194` | `YL`, act 3, `r:6 c:5` | **RENAMED** — `num` preserved; `docs/maps/node-index.md` §LEGACY CODE MAP carries `YL`→`BOO` |
| Cabin node | `SSJ:{ num:76@8786` — `yugurt_cabin`, act 3, cell `4,192` | `YC`, `r:7 c:5` | **RENAMED**, `num` preserved (`YC`→`SSJ`) |
| Lake contents | `npc:null, battle:null, loot:null`, `isFishingLake:true` | same | **EXACT** |
| Cabin contents | `npc:'The Fisherman'`, `loot:'Fishing Rod'`, `sleep:true, sleepCost:0` | same | **EXACT** |
| Vendor at cabin | not in `VENDOR_NODES` | "No vendor" | **EXACT** |
| Adjacency | none — the compass fields the report drew died with §WALK/§NAV-01 | `J6 → YL → YC` | **SUPERSEDED** (`J6` was a junction node; `check:invariants` I1/I2 now forbids them) |

### III.B The fishing layer

| Structure | Anchor | Size | Status |
|---|---|---|---|
| `FISH_POOL` | `const FISH_POOL = [@26504` | 20 ranks | As specified, **byte-identical to the archive** |
| `NIGHT_FISH_POOL` | `const NIGHT_FISH_POOL = [@26526` | 5 species, ranks 6–14 | **NEW** §XLVIII |
| Fish statlines | `fish_01: { key:'fish_01'@5357` | 20 + 5 night | **NEW to the report's table** — see §V |
| `FISH_SIZE_TIERS` | `const FISH_SIZE_TIERS = [@26685` | 5 tiers | **NEW** §Layer 47 |
| `FISH_GOLD_VALUES` | `const FISH_GOLD_VALUES = {@26692` | 5 × 5 = 25 values | **NEW** |
| `BAIT_TABLES` | `const BAIT_TABLES = {@26632` | 3 zones × 6 baits | **NEW** |
| `FISHING_RODS` | `const FISHING_RODS = [@26700` | 4 tiers, +0…+3 | **NEW** |
| `LAKE_MAGIC_DB` | `const LAKE_MAGIC_DB = {@26536` | 8 items | **NEW** §DROP-03 |
| `NPC_TOUR_OPPONENTS` | `const NPC_TOUR_OPPONENTS = [@26708` | 6 rivals | **NEW** §XLV |
| Cast driver | `function storyFishing() {@30392` | 4 phases | **REPLACES** the 2d20 mechanic |
| Battle entry | `function _startFishBattle(fish, hasRod, rodName)@30627` | — | As specified, +1 parameter |
| Node lock exemption | `!pb.corridor && !pb.fish@36608` | — | As specified, minus `!pb.stalk` |
| The chip | `main: 'Cast a Line',@35370` behind `const hasFish = node.isFishingLake;@35366` | 1 call site | As specified |
| Lake magic aggregator | `function _lakeMagicBonuses() {@23420` | 6 effects | **NEW**; all six have readers |

### III.C The current cast — four phases, not two dice

`storyFishing` resolves a cast in four rolls rather than one:

1. **DEX cast check** vs DC 12 → `−2` / `0` / `+2` modifier.
2. **Catch roll** — d20 + bait + cast modifier + Fisherman favour + rod bonus + lake magic; the
   total selects a **size tier** (`≤5` nothing bites · `≤10` Small · `≤16` Medium · `≤19` Large ·
   `20` Very Large · `21+` Legendary).
3. **Species pick** — a uniform draw from the ranks inside that tier (night pool after hour 20).
4. **Type roll** — d20 + bait + luck → rarity (Common → Legendary), which sets the trophy's gold.

---

## IV. SPEC → SHIPPED DELTA TABLE

Read both ways: a row is **NOT SHIPPED** when the engine never had it, **RETIRED** when it shipped
and was later removed, **SUPERSEDED** when a later design replaced it, and **STALE** when only the
report's wording aged.

| # | Report claim | HEAD | Verdict |
|---|---|---|---|
| 1 | 2d20 → `lo`/`hi` range → uniform pick from eligible ranks | four-phase Catch/Size/Type system | **RETIRED** — shipped verbatim at the archive, replaced by Layer 47 |
| 2 | "Cast Line (2d20)" button label | `🎣 Cast Line` | **RETIRED** with the mechanic |
| 3 | The 5-row roll/range example table | no range exists to tabulate | **RETIRED** |
| 4 | Fish pool has 20 ranks, rank matches index+1 | exact | **SHIPPED** |
| 5 | 20 fish **names** | 3 of 20 match | **NOT SHIPPED** — 17 names have 0 commits ever (§V) |
| 6 | 20 fish **HP / damage** columns | 2/20 and 3/20 match | **NOT SHIPPED** — wrong at the archive too (§V) |
| 7 | 20 fish **tier / atk / AC** columns | 20/20, 18/20, 17/20 | **SHIPPED** (see §V for why these three) |
| 8 | Rank 1 = Needle Minnow AC 5 HP 4; rank 20 = Yugurt's Dread AC 20 HP 220 4d12+9 | exact, both | **SHIPPED** — the only two fully exact rows |
| 9 | `FISH_POOL` entry shape `{rank, key, name, desc}` | exact | **SHIPPED** |
| 10 | The two quoted `desc` strings | paraphrased — live rank 1 reads `'Tiny. Barbed. Bites above its weight class.'` | **NOT SHIPPED** as quoted |
| 11 | Rod grants **Hooked** = advantage for that battle | `condition:'Hooked',@30640` | **SHIPPED**, verbatim |
| 12 | Rod has no sell value, does not break | `sell:10, price:20`, plus three upgrade tiers | **SUPERSEDED** — true when written |
| 13 | `_startFishBattle(fish, hasRod)` builds a synthetic `_preBattNode` with `_isFishBattle:true` | same, plus a `rodName` parameter | **SHIPPED** |
| 14 | Lock check `!pb.corridor && !pb.stalk && !pb.fish` | `!pb.corridor && !pb.fish` | **SHIPPED**; `!pb.stalk` **RETIRED** by §TIMELESS-01 |
| 15 | Fish battles never set `defeatedBattles`, so the lake replenishes | holds | **SHIPPED** — the design's load-bearing exemption |
| 16 | Victory pays the standard `floor(0.1 × AC × maxHP)` XP/gold | holds; Layer 47 additionally overrides the **trophy's sell value** with size × rarity | **SHIPPED**, extended |
| 17 | Death saves apply | holds | **SHIPPED** |
| 18 | Lake has one chip, "Cast a Line" | one chip, one call site | **SHIPPED** |
| 19 | The Fisherman is in the `EB_NPC_DIALOGUE` pool with no epic quest | `YC` was a key at the archive; `SSJ` is not a key at HEAD | **RETIRED** |
| 20 | …"alongside Woodcutter Bram and Captain Rhistle" | Bram is live (`npcNode:'FRO'`); **`Captain Rhistle` has 0 commits ever** | **NOT SHIPPED** — invented name |
| 21 | The Fisherman's repeated line, verbatim | `"...Nice Day For Fishing. Yugurt!"` still shipped | **SHIPPED** |
| 22 | Lake sits south of the Western Wilds Crossroads at `J6`, act 3 | act 3 holds; `J6` deleted, cells now `2,194` / `4,192` | **SUPERSEDED** |
| 23 | Cabin is south of the lake | it is 2 rows south and 2 columns **west**, not adjacent | **STALE** |
| 24 | "The lake does not grade on a curve" — any rank on any cast | the Catch total now floors the tier; rank 20 needs a 21+ | **SUPERSEDED** — the curve is now real |
| — | *(not in the report)* bait, rods, night species, rarity, lake magic, tournament, 15 quests | all live | **ADDED SINCE** |

---

## V. THE STATLINE TABLE — A RECONSTRUCTION, MEASURED

The report's 20-row table was diffed cell-by-cell against `MONSTER_POOL` at HEAD, which is
byte-identical to the archive build two days *after* the report was written.

| Column | Match | Character of the column |
|---|---|---|
| `tier` | **20/20** | five bands of four, in rank order |
| `atk` | **18/20** | monotone, ≈ `rank/2 + 2` |
| `ac` | **17/20** | monotone, ≈ `rank + 4` |
| `name` | **3/20** | authored |
| `dmg` | **3/20** | authored |
| `hp` | **2/20** | authored |

**The split is not random and it is not about tables versus prose.** Every column a formula
regenerates is nearly perfect; every column carrying authored data is nearly empty. The author
was reconstructing the table from its *shape*, not copying it — and the two rows that are exact
in all six fields (rank 1 and rank 20) are precisely the two the report also quotes in running
prose, where they could be remembered as sentences.

Instrument 4 confirms the diagnosis rather than assuming it: `Spine Perch`, `Venom Roach`,
`Razorback Carp`, `Yugurt's Fang`, `Razorscale Elder`, `Barb-Tail Catfish`, `Deepbarb Gharial`
and `Captain Rhistle` each return **0 commits in the file's entire history**. They were never
renamed; they never existed.

> **Durable rule (15th instrument).** A table is not evidence because it is a table. It is
> evidence when it was **copied**. A reconstructed table betrays itself by column: it is correct
> exactly where a rule can regenerate the value and wrong exactly where the data was authored.
> Diff a suspect table *per column* before scoring it — a 68% overall match rate hid a 3/20
> name column here.

---

## VI. FINDINGS

### F1 — The entire fishing layer is unreachable *(highest impact; new)*

`CELL_GRID` is built by iterating `Object.keys(NODE_MAP)` (`const CELL_GRID = (() => {@9852`) and
only `list[0]` — the primary — can become `S_story.currentCode`
(`S_story.currentCode = destCode;@28373`, where `destCode = res.destCodes[0]`). Both
`LYR:{r:2,c:194}@9423` and `BOO:{r:2,c:194}@9422` occupy cell `2,194`, and `LYR:{ num:41@8723`
(Arctic Wastes — Detour, act 7) is declared **59 lines before** `BOO:{ num:75@8782`.

Therefore `CELL_GRID['2,194'] = ['LYR','BOO']`, arriving at that cell renders the *arctic* node,
and `const hasFish = node.isFishingLake;@35366` is never true. `storyFishing` has **exactly one
call site**, that chip. `BOO` has `sleep:false`, so the `checkpointNode` path cannot reach it
either.

Stranded by this one ordering:

- **11 quests.** Three cannot activate (`activateNode:'BOO'` — `quest_horned_shark`,
  `quest_shale_drop`, `quest_night_eel`). Eight cannot complete, because their `completion` reads
  `fishingCatchLog` or `fishingQuestFlags`, and `S_story.fishingCatchLog.unshift@30614` is the
  **only writer** in the file: `quest_fishing_guide`, `quest_fish_01`, and the whole six-part
  Emmer Finch arc `quest_guide_01`–`quest_guide_06`.
- **~100 authored data rows**: 20 fish + 5 night fish (and their 25 `MONSTER_POOL` statlines and
  20 trophy drops), 8 lake magic items, 18 baits, 4 rod tiers, 25 gold values, 5 size tiers.
- **Two flag writers** that only a fish battle can reach: `hornedSharkSlain = true;@7051` and
  `lanternEelLanded = true;@7052`.
- **One key event**, `id:'ke_eel_pouch'@26228`, whose `node` is `BOO`.

The cabin survives — `SSJ` is alone in cell `4,192` — so the Fisherman, the free bed and the
six-quest §XLV tournament still render. **The player can meet the Fisherman and never fish.**

This is §AUDIT-03x's class and, by stranded-content volume, its worst single-node instance yet:
§CROWN-01 lost 7 nodes and 24 quests, but its mechanics were reachable elsewhere; here **one**
non-primary node takes an entire self-contained sub-game with it. → **§FISH-01** (fix is
mechanical and does not wait on §AUDIT-03x's design call: move `BOO`'s `NODE_MAP` declaration
above `LYR`, or move one of the two to a free adjacent cell).

### F2 — The report's thesis shipped and was then replaced

The 2d20 range mechanic is not a claim that failed; it is a claim that **aged**. The archive
carries it line for line — `d1`, `d2`, `lo = Math.min`, `hi = Math.max`, the `FISH_POOL.filter`
and the uniform pick — and the button read `🎣 Cast Line (2d20)`. Layer 47 replaced it with the
four-phase system in §III.C. **RETIRED, not NOT SHIPPED**, and the distinction matters: the
design argument the report makes for 2d20 ("rolling 1 and 20 gives you the widest possible range")
was implemented and then judged, not ignored.

### F3 — Three home docs still describe the retired mechanic as current

`world.md:160` (*"Current system (Layer 37): 2d20 cast roll"*), `story.md:811` (*"Current
Mechanic (Layer 37)"*) and `monsters.md:616`/`:753`/`:780` all document the 2d20 cast as live.
A reader greps the home doc and gets a mechanic the engine has not run in months — the inverse
rot direction §DOC-02j found in the `LOOT_TABLE` docs, and the more dangerous one. → **§DX-02v**.

### F4 — Six live home docs are classified HISTORY by gate #16

`scripts/legacy-codes.js` lists `monsters.md`, `mechanics.md`, `quest.md`, `index.md`,
`docs/mechanics/mechanics-combat.md` and `docs/mechanics/mechanics-economy.md` in
`HISTORY_FILES`, whose contract is *"records of what was true when written — annotate, never
rewrite."* These are the **maintained home docs** prompt.md §2 step 6 requires every increment to
sync, and `mechanics-combat.md` is the target of five `// → doc:` pointers in the fishing block
alone. It carries live prose reading *"Obtained from The Fisherman at YC … to trigger
`storyFishing()` at YL"* — two dead codes, unreportable by classification. The file's own comment
claims *"every live doc is now gate-fenced."* → **§AUDIT-03ab**.

### F5 — 11 unseeded `Math.random()` calls in the fishing path

Eight in `storyFishing` (DEX die, both Catch dice, the Type die, the species pick, the night pick,
the bait pick, the bait-search die) and three in the kill/lake-magic path. All feed persisted
state: `S_story.fishingCatchLog`, `S_story.inventory`, and — through the battle — `S_story.hp`.
Invariant #6 requires the seeded stream. The UQF quest path is already seeded; every
hand-authored surface that rolls its own dice is not. → **§DX-02m named instance** (the largest
single-feature cluster yet found).

### F6 — Two small engine-text errors

`const FISH_POOL = [@26504` carries the comment *"20 ranks, Needle Minnow → Yugurt's Leviathan"*;
rank 20 is `Yugurt's Dread` and no fish is named *Yugurt's Leviathan* (rank 17 is
`Barbed Leviathan Trout`). `monsters.md:780` anchors `storyFishing()` at bare line **11537**,
which is its *archive* line — the function is at 30392 — an anchor shape `check:anchors` cannot
see because it carries no symbol. Both filed under §DX-02v.

---

## VII. NOT-SHIPPED REGISTER (kept, not deleted)

| Claim | Why it is kept |
|---|---|
| 17 of 20 fish names, and the HP/damage curve | The measurement is the finding; deleting the table would erase the evidence for §V |
| `Captain Rhistle` | A named NPC that never existed — the corpus's cheapest example of instrument 4 |
| The two paraphrased `desc` strings | Near-verbatim is not verbatim; the drift is the point |
| The `J6 → YL → YC` adjacency chain | Correct when written; the junction node it hangs from is now a CI failure |
| The 5-row 2d20 example table | Correct when written against a mechanic that no longer exists |

---

## VIII. DEFECTS FILED

| Row | Premise | Design call? |
|---|---|---|
| **§FISH-01** | `BOO` is non-primary behind `LYR` in cell `2,194`; the whole fishing layer, 11 quests and ~100 data rows are unreachable | **No** |
| **§DX-02v** | `world.md`, `story.md`, `monsters.md` document the retired 2d20 cast as current; plus the `FISH_POOL` comment and the stale bare anchor | No |
| **§AUDIT-03ab** | Six maintained home docs are classified `HISTORY` in gate #16 and are therefore exempt from the legacy-code sweep they most need | Small |
| **§DX-02m** | +11 unseeded `Math.random()` sites in the fishing path, all writing persisted state | No |

---

## IX. WHAT THE FISHERMAN KNOWS

He knows. He has always known. He considers it a nice day.

He is also, at HEAD, standing beside a lake no one can walk to.

---

*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
