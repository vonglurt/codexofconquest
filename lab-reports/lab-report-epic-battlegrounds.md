<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — Epic Battlegrounds
### Layer 39 — Dead-End Boss Nodes with NPC Contract Framing

**Original date:** 2026-05-22 · **Verified against HEAD:** 2026-08-12 (§DOC-02l)
**Subject:** `roll2hit-v3.html` — `EPIC_BOSS_POOL`, `EB_NPC_DIALOGUE`, `EB_STORY_ITEMS`, 20 `NODE_MAP` records, 40 `QUEST_DB` entries
**Status:** ⚠️ **IMPLEMENTED, THEN SEVERED.** The design shipped almost exactly as specified and a later world-code rename broke the runtime's link to its own quest data. See §IV Finding 1.

---

## ABSTRACT

This report specified twenty dead-end "Epic Battleground" nodes, one per outdoor terrain, each holding a
single deadly-tier boss and reached only through a named NPC who asks for it in person. Re-measured
against HEAD 79 days later, it is **the most faithfully implemented specification the §DOC-02 program has
measured**: 20/20 monster keys, 20/20 statlines byte-exact across all five combat fields, 20/20 node
labels, 20/20 NPC names, 20/20 payment floors, and — verified against the earliest surviving build —
20/20 node codes and `num:` values exactly as tabulated.

It is also the first report in the program whose **node codes were right when written**. Every prior
increment found its codes dead-on-arrival or pointing at a different node. Here all twenty shipped
verbatim (`EF`, `EH`, …) and were later renamed to geographic codes (`PRN`, `INV`, …) by the §WALK/§NAV-01
world migration, which preserved `num`, terrain key, label and boss on all twenty.

The value of the pass is in what that rename did not update. The engine derives every epic quest id by
concatenating a node code — `'quest_' + code.toLowerCase() + '_primary'` — and the rename changed the
node codes but not the forty quest ids in `QUEST_DB`. **All forty authored epic quests are orphaned, and
the entire payment/return-beat layer is unreachable**: no gold, no reward items, no return scenes, for
75 days. Separately, co-location under §WALK-1.5 has made **8 of the 20 contract chains unreachable**.

---

## I. METHOD

1. **Name census** — every monster key, boss name, NPC name, node code, item key and quest id `grep -c`'d
   against HEAD before reading a line of the report.
2. **Field-level comparison** — all 100 statline fields and all 60 payment fields compared numerically,
   not by presence.
3. **`git log -S` on every dead symbol** — separates RETIRED from NEVER SHIPPED.
4. **Archive adjudication** — `git show 32c10c5:roll2hit-v3.html` (2026-05-24, earliest surviving build,
   two days after this report) is the only witness competent to judge what shipped *as specified*.
   All twenty node records, their compass links and their grid coordinates were read from it directly.
5. **Reachability computation** — `CELL_GRID` rebuilt from `NODE_MAP` declaration order and `NODE_COORDS`
   to determine which of the forty nodes in these chains can actually become `S_story.currentCode`.
6. **Self-consistency check** — the report's ASCII grid excerpt was tokenised and compared against the
   report's own coordinate table.

---

## II. AS-BUILT INVENTORY

| Structure | Anchor | Shipped |
|---|---|---|
| Boss statlines | `const EPIC_BOSS_POOL = {@26257` | 20 entries, all `tier:'deadly'` |
| Quest-giver dialogue | `const EB_NPC_DIALOGUE = {@26299` | 20 entries × 10 fields |
| Reward items | `const EB_STORY_ITEMS = {@26283` | 11 declared, 10 referenced |
| Epic node records | `PRN:{ num:52@8736` | 20 records, `num:` 52–71 contiguous |
| Epic terrain pools | `label:'Epic Battleground — Forest'@6343` | 20 `epic_*` terrains, 3 monsters each |
| Danger banner | `sbo-epic-danger">⚠ DANGER: EPIC@5060` | markup + `pulse-red` animation |
| Pre-battle trigger | `function storyEpicPreBattle(node) {@36418` | synthesises the battle from `bossKey` |
| Return/payment beat | `function _storyEbReturnBeat(ebCode) {@30358` | gold + item + beat |
| Node-code roster | `const _EB_CODES = [@28030` | live codes `PRN`…`TBS` |
| Primary quests | `quest_ef_primary: { id:'quest_ef_primary'@10715` | 20, `type:'epic'`, UQF-1.0 |
| Return quests | `quest_ef_return: { id:'quest_ef_return'@10876` | 20, `type:'epic'`, UQF-1.0 |

Node records carry `isEpicBattleground:true, bossKey:'thornwood_king'@8736` rather than a populated
`battle` field; the battle object is synthesised at pre-battle time.

### Statline verification — 20/20 exact

All twenty rows of the report's stat table match HEAD in **all five fields** (AC, HP, ATK, damage dice,
key): 100 measured facts, zero errors. Stated ranges hold exactly — AC 14 (`noonwraith_queen`) to 21
(`forge_warden`), HP 195 to 472 (`charybdis_prime`), all twenty `tier:'deadly'`.

### Node-code translation (all twenty recorded in `docs/maps/node-index.md` §LEGACY CODE MAP)

| Report | Live | Report | Live | Report | Live | Report | Live |
|---|---|---|---|---|---|---|---|
| EF | `PRN` | EB | `FLR` | EC | `SOF` | EE | `CAI` |
| EH | `INV` | EO | `KUN` | EL | `BEG` | EV | `MCT` |
| ES | `SDR` | EI | `ACE` | ED | `OTP` | EJ | `SJO` |
| EW | `PMO` | EA | `IST` | EM | `WAW` | ET | `KTM` |
| ER | `RKV` | EK | `MAD` | EP | `HAV` | EG | `TBS` |

`num:` is preserved 1:1 across the rename (EF/PRN = 52 … EG/TBS = 71), which is what proves these are the
same twenty nodes rather than a coincidence of labels.

---

## III. SPEC → SHIPPED DELTA TABLE

Read both ways. A row marked **ENGINE-ROT** is a specified behaviour HEAD fails to provide; a row marked
**REPORT-ROT** is a claim the file never supported.

| # | Report claim | Shipped | Verdict |
|---|---|---|---|
| 1 | 20 dead-end nodes, one per outdoor terrain | 20 nodes, `num:` 52–71, one exit each at the archive | ✅ exact |
| 2 | 20 deadly bosses, AC 14–21 / HP 195–472 | all 20, all five fields exact | ✅ exact |
| 3 | 20 named quest-givers | all 20 names exact in `EB_NPC_DIALOGUE` | ✅ exact |
| 4 | Node codes `EF`…`EG` | shipped exactly; renamed 2026-05-29 | ✅ correct when written; RETIRED |
| 5 | Grid coordinates (20 cells) | 16 of 20 exact at the archive | ⚠️ 4 relocated (EH, EW, EM, EJ) |
| 6 | Connection directions (20) | 14 of 20 exact | ⚠️ see delta 7, 8 |
| 7 | `HC → W → EK` | shipped as a bespoke `spire:'EK'` link, not a compass field | ⚠️ REPORT-ROT (shape) |
| 8 | `GC → SE → EG` | shipped as `N`; the diagonal was dropped | ⚠️ REPORT-ROT |
| 8b | `DS → SW → ED` | shipped as `SW:'ED'` — the engine did support diagonals | ✅ exact |
| 9 | ASCII grid excerpt | disagrees with the report's own table in 4 places | ❌ internally inconsistent |
| 10 | `id: 'quest_[code]_return'` | exact — `quest_ef_return` … `quest_eg_return` | ✅ exact |
| 11 | Return quest is a real `QUEST_DB` entry, not a flag | exact, all 20 | ✅ exact |
| 12 | Return quest appears in the quest log | **never activated** — see Finding 1 | ❌ ENGINE-ROT |
| 13 | Waypoint auto-set to parent node on boss defeat | `S_story.waypoint = dial.npcNode` ✓ | ✅ exact |
| 14 | `objectiveText` field | retired wholesale by §ARCH-01; 0 occurrences | ⚠️ RETIRED (schema) |
| 15 | Negotiation: floor / ceiling / opening | all three fields shipped, all 20 | ✅ exact |
| 16 | Opening "usually 20–30 % below ceiling" | `paymentOpening === paymentFloor` on 20/20 | ❌ REPORT-ROT |
| 17 | Payment floors (20 values) | 20/20 exact | ✅ exact |
| 18 | Payment ceilings | 4 of 20 have a real ceiling; 16 have ceiling = floor | ⚠️ negotiation inert on 16 |
| 19 | "one attempt; success based on Charisma" | one attempt, CHA vs DC 17 | ✅ exact |
| 20 | "Failure not punished; NPC doesn't become hostile" | failure deals 1–4 damage and **still pays ceiling** | ❌ ENGINE-ROT, both halves |
| 21 | DANGER: EPIC banner, deep red, pulsing | exact, incl. `pulse-red 1.4s infinite` | ✅ exact |
| 22 | Banner shows boss name + NPC warning, attributed | exact, with an `epicDesc` fallback | ✅ exact |
| 23 | "No tier picker, no warm-up" | single synthesised battle, no tier selection | ✅ exact |
| 24 | "The node's `battle` field points directly to the boss" | `battle:null`; `bossKey` + `isEpicBattleground` instead | ⚠️ REPORT-ROT (shape) |
| 25 | Sleep-delay flavour variant in return dialogue | 0 occurrences, 0 commits ever | ❌ NOT SHIPPED |
| 26 | Froberger Entry-13 variant for Bram (EF) | 0 occurrences, 0 commits ever | ❌ NOT SHIPPED |
| 27 | 20 named reward effects (blessings, passes, waivers) | items exist; **no effect field, no readers** | ❌ NOT SHIPPED (see Finding 3) |
| 28 | Star Fragment "sells for 450gp" | `sell:0`, and the push drops `sell` entirely | ❌ NOT SHIPPED |
| 29 | EB "+50gp from Tula's navigator" | folded into the 420 ceiling; no separate bonus | ⚠️ absorbed |
| 30 | EG "+100gp bonus" | folded into the 500 ceiling | ⚠️ absorbed |
| 31 | ER "fur cache (100gp equivalent)" | folded into the 450 ceiling; no item | ⚠️ absorbed |
| 32 | "Every outdoor terrain node has exactly one NPC" | 20 of 111 terrains / 416 nodes | ⚠️ STALE (scale) |
| 33 | 26×16 grid, `WW` overrides | superseded by the 90×360 geo grid (§WALK/§NAV-01) | ⚠️ RETIRED |
| — | *(engine addition)* 20 `epic_*` terrain pools, 3 monsters each | unspecified | ➕ see §V note |
| — | *(engine addition)* `epicDesc` per boss, banner fallback | unspecified | ➕ |
| — | *(engine addition)* `EB_NG_PLUS_LINES` — 20 NG+ recognition lines | unspecified | ➕ |
| — | *(engine addition)* `category:'A'/'B'/'C'` on each contract (9/6/5) | unspecified | ➕ |
| — | *(engine addition)* 19 `negotiateLine` quotes | report supplied only Bram's | ➕ |

---

## IV. FINDINGS

### Finding 1 — the rename updated every place the code *spells* the identifier and missed the place it *computes* it (→ §EPIC-01)

Seven sites derive an epic quest id from a node code by string concatenation:

- `const primaryId = 'quest_' + ebCode.toLowerCase() + '_primary';@30346` (contract accept)
- `'quest_' + node.code.toLowerCase() + '_primary';@35892` (battle chip)
- `const returnId = 'quest_' + pb.nodeCode.toLowerCase() + '_return';@36612` (victory)
- plus four more at 28196, 30382, 35864, 35865.

At the archive these sites resolved: `EB_NPC_DIALOGUE` was keyed `EF`, so `'quest_' + 'EF'.toLowerCase()
+ '_primary'` produced `quest_ef_primary`, which exists. **The seven sites are unchanged at HEAD.** What
changed is everything they read from. `c1d5a94` (2026-05-29) renamed the `NODE_MAP` keys, the
`EB_NPC_DIALOGUE` keys, `_EB_CODES`, every `completion:{ battles:[…] }`, every `waypointNode`, and even
the prose inside `failText` — but **not the forty `QUEST_DB` ids**, which are still `quest_ef_*`.

So the runtime now computes `quest_prn_primary`, which does not exist. Consequences, in order of severity:

1. **All forty authored epic quests are orphaned.** `_questsByNode` excludes them by design —
   `if (!q || q.type === 'epic' || !q.activateNode) continue;@37020` — so arrival never activates them,
   and the chip handlers address a different namespace. Forty titles, descs, hints, passTexts, failTexts
   and twenty `reward` values are unreachable content.
2. **The entire payment layer is unreachable.** `function _storyEbReturnBeat(ebCode) {@30358` has exactly
   one caller, gated on `S_story.quests['quest_prn_return']` being active. The only writer of that key is
   line 36612, guarded by `if (QUEST_DB[returnId])` — which is falsy, so it silently does nothing.
   **No gold is ever paid, no reward item is ever granted, and no return beat ever renders, for any of the
   twenty contracts.** `ebReturnDone` is never written, which also permanently blocks the `allEbReturns`
   milestone (needs ≥ 5) and zeroes the two end-game tallies that read it.
3. **The NPC chip sticks.** After the boss dies, the parent-node chip still reads
   `quest_prn_primary === 'active'` (nothing ever completes a phantom key) and renders
   "⚔ EPIC *<battleground>* awaits" forever — a non-clickable chip where the payment used to be.
4. **A raw code reaches the player.** The accept toast falls back to the node code when
   `QUEST_DB[primaryId]` is undefined, so it reads "📋 PRN" instead of "📋 Thornwood Maw".

The combat half still works, because it is the only half that does not go through `QUEST_DB`:
`defeatedBattles[pb.nodeCode]` is written on victory regardless of the quest state, so the boss can be
fought and killed. The player simply never gets paid.

*Duration: 75 days (2026-05-29 → 2026-08-12). No gate can see it —* `check:questgraph` *walks* `QUEST_DB`
*against itself and never evaluates a computed id; this is the §DX-02o class one level deeper.*

### Finding 2 — 8 of 20 contract chains are unreachable under co-location (→ §AUDIT-03x)

`CELL_GRID` maps each cell to an array in `NODE_MAP` declaration order, and only `list[0]` can become
`S_story.currentCode`. Measured over all forty nodes in these chains:

| Broken end | Chains | Detail |
|---|---|---|
| Battleground non-primary | 5 | `IST`→`SEA` (17 occupants) · `OTP`→`WG0` (12) · `CAI`→`AHB` · `KTM`→`INN` · `HAV`→`HOR` (13) |
| Quest-giver node non-primary | 4 | `MSY`→`WG0` (Gwynne) · `SDQ`→`WG0` (Wane) · `NAS`→`VBY` (Carrick) · `BK`→`LHR` (Mordus) |

`HAV` is broken at both ends. Twelve chains are structurally intact. The sharpest case is `CAI`: Caravan
Master Zephyrine stands at `AHB` and sends the player to a vault **in her own cell** that the engine will
not render.

`BK` is the §AUDIT-03y node again — Mordus's entire Void-Shaman contract hangs off it.

**§AUDIT-03x's headline figure is confirmed** by independent recomputation from source: 416 `NODE_MAP`
records across **244** cells → **172** non-primary, with `NODE_MAP` and `NODE_COORDS` in exact bijection
(no entry on either side lacks a partner).

*Measurement hazard recorded during this pass.* A first pass reported 399 nodes / 155 non-primary and was
wrong. The extraction regex capped node codes at four characters, so six-character keys (`FSLINN`,
`MESFRY`, …) were missed in `NODE_MAP` while their trailing four characters (`LINN`, `SFRY`) matched in
`NODE_COORDS` — producing seventeen phantom "coords-only" codes and a plausible, entirely false
correction. `check:dupkeys` printing `NODE_MAP=416` is what caught it. ***A census regex is a claim like
any other: check its total against a gate that already counts the same set before trusting a delta
derived from it.***

### Finding 3 — ten reward items promise a named permanent mechanic and nothing reads any of them (→ §AUDIT-03v/w cluster)

`const EB_STORY_ITEMS = {@26283` declares eleven items. Ten are referenced as a `specialItem`; each
carries a `desc` naming a specific mechanical effect — swamp surprise immunity, waived river tolls, free
sea passage, three days of suppressed desert encounters, advantage on Shard rolls, an upgraded Stunned
condition, unlimited advantage against Void creatures, a free pirate restock, Warrant-territory passage.

**Each item name occurs exactly once in 38,712 lines: its own declaration.** No item carries an `effect`
field and no code path consumes any of them. The grant site,
`S_story.inventory.push({ name: si.name, desc: si.desc, icon: si.icon || '✨' });@30378`, additionally
drops `type` and `sell` — and the vendor filters on `i.sell > 0`, so the seven items carrying a sell value
(200/180/150/80/75/60/220 gp) **cannot even be sold.** This is the widest single instance of the
§AUDIT-03v/w/y(b)/aa detector class yet measured: ten player-facing promises, zero implementations.

Two additional collisions in the same block: `Crimson Warrant` is simultaneously an EB reward item, the
item name Shard #4 completes on (`'Crimson Warrant (Shard #4)'`), and the name of the §BOARD-01 bounty
faction; `Sand Cipher` is both an EB reward and Shard #5's item name. Neither breaks a mechanic — the
completion strings differ — but the player's inventory carries two things by each name.

And `kazrath_journal:@26294` has **one occurrence in the whole file and zero consumers** — the
§DOC-02h *Marsh Seaweed* shape exactly (→ §DX-02n).

### Finding 4 — negotiation is strictly dominated, and its failure branch inverts the spec on both halves

`const accepted = _ebNpcNegotiated ? d.paymentCeiling : d.paymentFloor;@30343`. The CHA check
(`S_story.abilityScores || {}).cha) || 8;@30290`, DC 17) gates only the *damage*, not the gold:

| Player action | CHA result | Gold | Cost |
|---|---|---|---|
| Decline to negotiate | — | floor | — |
| Negotiate | pass | **ceiling** | — |
| Negotiate | fail | **ceiling** | 1–4 non-lethal damage |

Negotiating is therefore never wrong. The report specified *"failure to negotiate: not punished beyond
losing the margin; NPC doesn't become hostile"* — HEAD punishes it (a scripted beating) **and** does not
withhold the margin. Both halves inverted. On the 16 contracts where ceiling = floor the whole exchange
is cosmetic.

Two further defects in that branch:

- `Math.max(1, Math.floor(Math.random() * 4) + 1)@30310` and the d20 roll three lines above are
  **unseeded** `Math.random()` writing to persisted state (`S_story.hp`) — invariant #6, → §DX-02m.
- The shared failure panel is hardcoded masculine (*"Then **he** moves…"*, *"Then **he** crouches down"*)
  and is rendered for whichever of the twenty NPCs was asked. **Ten of the twenty are women.**

### Finding 5 — instrument 12 (copy-vs-compose) holds, and the illustration is again the weak half

Everything in this report that was meant to be transcribed is exact: the 20-row statline table (100/100
fields), the payment floors (20/20), the NPC roster (20/20), the node codes and `num:` values (20/20 at
the archive), the coordinate table (16/20). The one hand-drawn artefact — the ASCII grid excerpt — **is
wrong against the report's own table in four places**: `EK` drawn at column 17 against a tabulated 16,
`EM` at 9 against 8, `EW` at 4 against 3, and `EP` drawn into **two adjacent cells**. The table is right
about `EK` and `EM` (the archive agrees with it); the grid is right about `EW`'s column. A table gets
copied; a picture gets drawn from memory.

The same split appears in the dialogue. Of the forty quoted lines the report puts in NPC mouths, **22
shipped verbatim** (12 of 20 `opening`s, 10 of 20 `warning`s) — quoted speech is transcribable. The
narrative `wound` and `returnBeat` prose shipped at **0 of 40 verbatim**: it was condensed into fields by
a later hand, which is why §V below is a register rather than the original 570 lines.

---

## V. NPC CONTRACT REGISTER

The twenty long-form character profiles in the original have been replaced by this register.
`EB_NPC_DIALOGUE` is the single source of truth for the shipped text (10 fields × 20 entries: `npc`,
`occupation`, `npcNode`, `category`, `wound`, `opening`, `warning`, `paymentFloor/Ceiling/Opening`,
`negotiateLine`, `returnBeat`, `specialItem`), and a second prose copy can only rot. The condensation is
recorded in Finding 5; the original narrative survives in git history at this file's prior revisions.

| Live | NPC | Stands at | Boss | Floor→Ceiling | Reward item | Chain |
|---|---|---|---|---|---|---|
| `PRN` | Woodcutter Bram | `FRO` | Thornwood King | 220→300 | — | ✅ |
| `INV` | Shepherd Rona | `KIR` | Highland Aboleth | 260 | — | ✅ |
| `SDR` | Herbalist Gwynne | `MSY` | Elder Hydra | 240 | — | ❌ giver unreachable |
| `PMO` | Wane | `SDQ` | Grand Hag Queen | 200 | Swamp Blessing | ❌ giver unreachable |
| `FLR` | Harbormaster Tula | `BGI` | Vampire Pirate Lord | 300→420 | — | ✅ |
| `KUN` | Navigator Cassius | `SID` | The True Leviathan | 320 | Ship Warrant | ✅ |
| `ACE` | Island Elder Maris | `PDL` | Ancient Sea Dragon | 280 | — | ✅ |
| `IST` | Captain Selene Draketide | `RAI` | Index Guardian Aboleth | 300 | — | ❌ node unreachable |
| `SOF` | Runewright Ossian | `GIB` | Forge Warden Dragon Turtle | 250 | Forge Rune | ✅ |
| `BEG` | River Trader Aldous | `TRF` | Storm Giant Titan | 280 | River Pass | ✅ |
| `OTP` | First Mate Darro | `SID` | Charybdis Prime | 320 | — | ❌ node unreachable |
| `WAW` | Farmer Wren | `MAN` | Noonwraith Queen | 260 | — | ✅ |
| `CAI` | Caravan Master Zephyrine | `AHB` | Vault Pharaoh | 300 | Escort Contract | ❌ node unreachable |
| `MCT` | Izador al-Rashun | `DOH` | Elder Marid | 350 | Sand Cipher | ✅ |
| `SJO` | Herbalist Mael | `BEL` | Cathedral Wyrm | 250 | — | ✅ |
| `KTM` | Blacksmith Dora Flint | `ERF` | Summit Wyrm | 300 | Runewright's Hammer | ❌ node unreachable |
| `RKV` | Fur Trader Sigrid | `LYR` | Frost Giant Jarl Kolvros | 350→450 | — | ✅ |
| `MAD` | Grounded Seraph Ithiel | `CTU` | Fallen Seraph Variel | 0 | Star Fragment | ✅ |
| `HAV` | Fence Boss Carrick | `NAS` | Admiral's Ghost | 300 | Pirate Cache | ❌ both ends |
| `TBS` | Warlord Kael Mordus | `BK` | Void High Shaman Kazrath | 400→500 | Crimson Warrant | ❌ giver unreachable |

**Note on the terrain pools.** Twenty `epic_*` terrains shipped alongside the nodes, each with a
three-monster roster. That is an addition the report never specified, and it sits in tension with its
thesis — *"One creature. One chamber. No alternatives."* Whether those rosters can fire at an epic node is
not settled by this pass and is left as an open question rather than an asserted defect.

---

## VI. NOT SHIPPED — KEPT

Per §DOC-02 policy these claims are retained rather than deleted; a silently removed claim reads as one
that held.

1. **All ten named reward effects** (Finding 3) — items exist, effects do not.
2. **The Froberger Entry-13 variant** for Bram's quest — 0 occurrences, 0 commits ever.
3. **The sleep-delay flavour variant** in return dialogue — 0 occurrences, 0 commits ever.
4. **The separate bonuses** for EB (+50 from Pell), ER (fur cache) and EG (+100) — absorbed into
   negotiation ceilings, so the *gold* survives and the *objects* do not.
5. **Star Fragment's 450gp sale value** — `sell:0`, and unsellable regardless.
6. **`objectiveText`** — retired schema-wide by §ARCH-01, not specific to this arc.
7. **The opening-offer rule** (20–30 % below ceiling) — opening equals floor on all twenty.

---

## VII. DEFECTS FILED

| Row | Severity | Design call |
|---|---|---|
| **§EPIC-01** (NEW) — epic quest ids severed from the runtime's computed ids; 40 quests orphaned, payment layer unreachable | 🔴 highest player impact open | none |
| **§AUDIT-03x** extended — 8 of 20 EB chains broken by co-location (5 battlegrounds, 4 quest-givers, `HAV` both); the 416/244/172 figure confirmed | 🟡 | inherits §AUDIT-03x's |
| **§AUDIT-03v/w** cluster +10 — ten reward items naming permanent mechanics with zero readers; `type`/`sell` dropped at grant | 🟡 | one call for the cluster |
| **§DX-02n** +1 — `kazrath_journal`, 1 occurrence / 0 consumers | 🟢 | none |
| **§DX-02m** named instances — two unseeded `Math.random()` calls writing `S_story.hp` in the negotiation | 🟢 | none |
| **§EPIC-02** (NEW) — 40 `failText` strings name a raw live node code *and* place the NPC at the battleground instead of their own `npcNode`; plus the "📋 PRN" toast | 🟢 | none |
| **§EPIC-03** (NEW) — negotiation strictly dominated (pass and fail both pay ceiling); failure branch inverts the spec; failure panel hardcoded "he" for 20 NPCs, 10 of them women | 🟢 | small: what failure should cost |

---

*Verified 2026-08-12 under §DOC-02l. Original 753 lines → 344. Node codes annotated, never rewritten
(`lab-reports/` is HISTORY under `scripts/legacy-codes.js`).*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
