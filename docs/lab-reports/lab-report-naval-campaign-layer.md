<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report: The Naval Campaign Layer — Ports, Intercepts, Hunts, and the Harmony Chain at Sea

**Author:** Claude (Sonnet 4.6) + CodexOfConquest.com design sessions
**Filed:** 2026-05-28 · **Ship commit:** `e339aeb`
**Verified against HEAD:** 2026-08-12 (§DOC-02z) — 76 days later, at 5.5× the file
**Classification:** Arc Design / Naval Systems / Quest Architecture
**Audience:** EE/CS background; game designer-programmer

---

## Abstract

This report specifies a naval campaign layer for *The Shattered Codex*: **7 new nodes, 33 quests, 13 items, 11 NPCs**, distilled from four tabletop-design transcripts (improv, side-quest structure, naval campaigns, monster hunts) into **five reusable arc templates** — §HUNT, §PORT, §SPARK, §WHODUNIT, §ALCHEMY.

**Why the game wanted it.** Before this layer the world had one shape of "go there and fight the thing." The sea gave three new shapes the engine could already express with the mechanics it had: a *reputation currency* (a port that opens because of who vouches for you, not because you paid), an *investigation gradient* (a wrong theory held sincerely, corrected by two skill checks, not by a lore dump), and a *travelling companion* (an arc whose geography is borrowed rather than built). Each is a different answer to the same playability question — **what makes the player want to cross four thousand miles of a world they can already walk freely?**

**Verification result.** The specification shipped with **zero transcription error** across ~100 measured identifiers: 33/33 quest ids, 29/29 state flags, 13/13 items with every icon and all five sell values, **14/14 skill checks exact in stat, skill name and DC**, and 7/7 node records exact in `num`, terrain key, label and act. All 22 node codes are dead *as written* and **all 22 resolve by `num`+label to a live node** — the §WALK/§NAV-01 migration renamed this layer, it deleted nothing.

**And 13 of the 33 quests (39 %) cannot be reached in the shipped game.** Not one identifier is missing. Four host nodes — `SEN`, `HFT`, `VAW`, `ATH` — became **non-primary** occupants of shared cells, and three arcs die at flags whose only writer sits inside a `node.code === '<that node>'` block. §HUNT-01 loses 4 of 4, §WHODUNIT-01 loses 4 of 4, §ALCHEMY-01 loses 5 of 7. *A 100 % symbol census accompanying a 39 % dead feature — §DOC-02r's instrument 19.*

**Attribution.** §DOC-02r (2026-08-12, `33c2166`) reached the §HUNT-01 4/4 and §WHODUNIT-01 4/4 verdicts first, from the prosocial-mechanics side, and named `SEN`←`LCY`, `HFT`/`VAW`←`ALF` and `ATH`←`SEA`. This pass **independently reproduces both** from the naval side and adds four results that arc-shaped review could not see: **§ALCHEMY-01's 5-of-7 casualty**, the **loss of the §BOARD-01-FU6 diamond's apex**, the **two surfaces that rescue part of the layer** (§V-4), and **two live double-pay sites** on nodes that are perfectly reachable (§VI-A).

---

## I. Method

Nine instruments, in the order run:

1. **Batch census.** Every named quest id, flag, item, NPC and node code through one `grep -c` loop *before* reading a line of prose (§DOC-02b).
2. **Archive comparison.** `git show e339aeb:play.html` — the report's own ship commit — is the only thing that can adjudicate a claim about 2026-05-28 (§DOC-02f, instrument 8).
3. **Rename resolution by triple-match.** A dead node code is presumed a *rename*, not a deletion, until `num` + terrain key + label all fail (§DOC-02y).
4. **Cell-primacy census.** `const CELL_GRID = (() => {@9865` builds each cell in `NODE_MAP` declaration order; only `list[0]` can ever become `S_story.currentCode` (§AUDIT-03x).
5. **Reachability closure over gate flags.** For every gate term, find *all* writers; a single writer inside a blocked block kills the whole downstream chain (§DOC-02r, instrument 19).
6. **Second-route search.** Before declaring a quest dead, check `unlock` edges and the Warrant's Board — the closure runs in the *positive* direction too.
7. **Recommendation register.** Score the report's own ⚙️ deferrals against HEAD (§DOC-02i).
8. **Copy-vs-compose.** Expect transcribed tables to be exact and narrated passages to drift (§DOC-02k, instrument 12).
9. **Payment audit.** Where a `storyRender` button writes a quest's completion flag, check whether *both* sides pay.

---

## II. As-Built Inventory

### 2.1 Nodes — 7 of 7 shipped, 7 of 7 survive

| Spec code | `num` | Label | HEAD code | Cell | Reachable? |
|---|---|---|---|---|---|
| OW | 139 | Open Water — The Warmth Calm | **`NWI`**`@8641` | 17,181 | ✅ primary |
| SK | 142 | Saltwick — The Unwritten Port | **`MME`**`@8651` | 15,178 | ✅ primary |
| SB | 144 | The Intercept — Three Miles Out | **`GCI`**`@8646` | 20,177 | ✅ primary |
| DF | 143 | Dunfall — The Loch Harbor | **`DNF`**`@8739` | 17,171 | ✅ primary |
| LD | 140 | North Shore Den | **`VAW`**`@8526` | 10,191 | ❌ **4th of 6** |
| BN | 141 | The Eastern Bend | **`BNX`**`@8806` | 25,197 | ✅ primary |
| DA3 | 138 | The Depth — 18 Meters | `DA3`@8623 | 32,203 | ❌ 15th of 17 |

The archive record is exact in every field, **including the bidirectional wiring the report's "Connection" column claims**: `OW:{ num:139, … E:'LW', W:'MS'`, `SK: N:'MS'`, `SB: S:'MS'`, `DF: E:'HL', W:'EH'`, `LD: S:'LN'`, `BN: S:'J1'`, `DA3: N:'DA2'`. Six of seven kept their exact display label through the migration; `BN`'s was extended to *'The Eastern Bend — Relay Road'*.

**Host nodes borrowed by the layer, all renamed, all num-exact:** MS(10)→`SEN`, DK(7)→`LCY`, LS(109)→`HFT`, LN(107)→`ALF`, LH(106)→`KSU`, HL(14)→`KIR`, MI(12)→`MAN`, IS(19)→`PDL`, ML(95)→`MLA`, AE(92)→`ATH`, LW(105)→`MOL`, EH(53)→`INV`, J1(43)→`WRO`.

`J1` is worth its own line: it was `name:'junction'`, and junction nodes became a **CI failure** (`check:invariants` I1/I2, §DX-01d). It was not deleted — it was reclassified to `name:"midlands"`, kept `num:43` and kept its label *'Midlands Road Fork'*. **§HUNT-02's entire hook survived a design ban by changing terrain.**

### 2.2 Quests — 33 of 33 live as UQF-1.0

| Arc | Quests | Host at HEAD | Reachable |
|---|---|---|---|
| §SPARK-01 SEA | `quest_sea_01–03` | SEN → NWI | ⚠️ **board only** (1 of 3 heads) |
| §HUNT-01 | `quest_hunt_01–04` | HFT · KSU · ALF · VAW | ❌ **0 of 4** |
| §HUNT-02 | `quest_hunt2_01–04` | WRO · BNX | ✅ 4 of 4 |
| §PORT-01 | `quest_sk_01` · `_02` · `_hull` | MME | ✅ 3 of 3 |
| §PORT-02 | `quest_df_01/02` | DNF | ✅ 2 of 2 |
| §NAVAL-01 | `quest_sb_01` + 3 role paths | GCI | ✅ 1 of 1 |
| §SPARK-02 | `quest_spark2_01–05` | DNF | ✅ 5 of 5 |
| §WHODUNIT-01 | `quest_bilge_01–04` | SEN | ❌ **0 of 4** |
| §ALCHEMY-01 | `quest_alch_01–07` | KIR·MAN·SEN·PDL·MLA·ATH·KIR | ❌ **2 of 7** |

### 2.3 Skill checks — 14 of 14 byte-exact

| Quest | Spec | Shipped |
|---|---|---|
| `quest_sea_02` | INT 13 identify eel | `stat:'INT', skill:'Investigation', dc:13` ✅ |
| `quest_sea_03` | WIS 14 escort | `stat:'WIS', skill:'Nature', dc:14` ✅ |
| `quest_hunt_02` | INT 12 hull marks | `INT / Investigation / 12` ✅ |
| `quest_hunt_03` | WIS 13 north-shore trail | `WIS / Perception / 13` ✅ |
| `quest_hunt2_02` | WIS 11 road | `WIS / Perception / 11` ✅ |
| `quest_hunt2_03` | INT 13 sleeping post | `INT / Investigation / 13` ✅ |
| `quest_sk_02` | CHA 12 consignment | `CHA / Persuasion / 12` ✅ |
| `quest_df_02` | WIS 11 barter insight | `WIS / Insight / 11` ✅ |
| `quest_spark2_02` | WIS 11 animal handling | `WIS / Animal Handling / 11` ✅ |
| `quest_spark2_04` | INT 12 nature | `INT / Nature / 12` ✅ |
| `quest_bilge_02` | INT 12 port drain | `INT / Investigation / 12` ✅ |
| `quest_bilge_03` | WIS 13 witness | `WIS / Insight / 13` ✅ |
| `quest_alch_04` | CHA 11 oracle | `CHA / Persuasion / 11` ✅ |
| `quest_alch_05` | WIS 12 Malta crisis | `WIS / Insight / 12` ✅ |

### 2.4 Items — 13 of 13 live, every icon and sell value exact

Joint Pirate Debt Note ⚓ · Drowned Compass 🧭 **80** · Relay Station Token 🪙 **20** · Saltwick Bill of Lading 📄 · Highland Herb Pouch 🌿 **40** · Letter of Marque (Keel) 📜 · Bram's Fish Scale 🐟 · Oat's Harbor Bead 🪡 · Dunfall Drift Spore ✨ · Highland Letter of Clearance 📃 · Sea Spawn Scale Fragment 🐚 **13** · Shepherd's Fortune Slip 📜 · Loch Gold Flake ✨ **30**.

### 2.5 Battle keys — classified, and the gate's table records the rename

`SYNTHETIC_BATTLE_CODES` in `src/scripts/check-noderegs.js` carries all four, each already annotated with its *new* host: `MS_BILGE: '§WHODUNIT-01 — Sea Spawn ×2 bilge fight at SEN'`, `SB_PRIVATEER: '… at GCI'`, `BN_NIGHTHAG: '… at BNX'`, `LD_DROWNERS: '… at VAW'`. Gate #13 phase 6 is the only place in the repo that records this layer's rename map, and it is correct.

---

## III. Design Intent — what each template was for

The transcripts were not game-design documents; they were lectures. The extraction filter was **existing-system compatibility**: anything expressible in `QUEST_DB` + `NODE_MAP` + a state flag was built; anything needing new UI was deferred with a ⚙️.

**§SPARK-01 SEA — play on assumptions (OW/`NWI`).** Two wanted pirate ships at anchor, not fighting. The player expects a threat encounter; the reality is something large and warm below the surface that has made conflict feel pointless to both crews. *The Redmast Quartermaster: "eight days and I haven't hit anyone; I don't know what to do with that."* The eel has no agenda — it simply is. **Playability contribution:** the game's first encounter that cannot be solved by the combat system, teaching the player that `Investigate` is a verb here.

**§HUNT-01/02 — the wrong theory, held sincerely.** Four phases: setup (a credible institution asserts a wrong cause), investigation (two checks read physical evidence), confrontation, resolution. The Guild's spirit offerings are the *traditional* response to unexplained lake deaths; the road wardens' "bandit fires" is a *credible* theory, because old mills do attract squatters. **Neither character is diminished by being wrong** — the tell is precision: every horse stopped at the same point. Bandit fear is diffuse; territorial marking is not. **Playability contribution:** an investigation gradient that rewards reading over grinding, and §HUNT-02 is built *entirely* from one line Tessie was already saying at the J1 fork — retroactive worldbuilding at zero content cost.

**§PORT-01/02 — reputation and barter as currencies.** Saltwick opens on any of three credentials (`pirateCrew_allied`, `aldousConfessed`, or §SPARK-02's Ninth Circuit seal) and on none of them stays shut; Dunfall's market runs on acknowledgment, and the fail state says so out loud — *"Come back when you've walked the ford path. Not the road — the ford."* Dunfall is gated by clearing the kelpie at `KIR`, so **the village is a consequence, not a quest**. **Playability contribution:** two ports that reward completionist play without gating content behind a single mandatory quest.

**§NAVAL-01 — one item, three meanings (SB/`GCI`).** REF-03 asked for Captain/Gunner/Lookout/Quartermaster crew roles; the implementation simplified to three buttons because the node is one encounter, not a campaign. Parley (CHA 12), Examine (INT 11), Fight — **all three yield the same Letter of Marque**. Parley: Keel gave it willingly, she wanted to be bought off. Examine: she threw it across the gap, the test was whether you'd read the date. Fight: recovered from the chart room, the Commission was already void. *The item is identical. The player's understanding of Keel is not.*

**§SPARK-02 — the four-token vignette chain (DF/`DNF`).** Objects enter and leave as physical markers of emotional state: Bram's Fish Scale exists only between Act 2 and Act 3, then Bram eats it. **The player's inventory becomes a timeline of the arc rather than a permanent record of it.** Commissioner Halvard Fehn maintains three identities at once — a Revenue Office closed 13 years ago, a Highland Fleet that does not exist, a Commodore-Provisional rank in a Northern Admiralty that does not exist — and the drift spore does not make him confess; **it makes him stop performing.** That is the difference between coercion and gentling, and the confrontation works because the player collected the evidence.

**§WHODUNIT-01 — a mystery in a closed space (MS/`SEN`).** No new node: all four phases run at one node via `storyRender` progression, with the battle fired by button rather than by a cardinal move, because "deeper into the ship" is a vertical descent. The wrong theory here is *social* rather than institutional — the cook's, and it is circumstantially coherent (the passenger came from Saltwick; nobody from Saltwick uses their real name). **The cook never apologizes.** In §HUNT the wrong-theory NPC updates; the cook does not, and that persistent off-note is load-bearing: the mystery is solved, the bilge is clear, and the social wrong stands.

**§ALCHEMY-01 — a world-spanning arc with zero new nodes.** Roen the shepherd crosses six existing nodes and roughly four thousand miles. The Four Agreements are never stated, only enacted — a player who knows Ruiz recognises them; a player who doesn't gets a travel companion who notices things. The resolution inverts every other template: **the prophecy is simply true.** The grandmother's stone is a finder for a bioluminescent colony that concentrates highland gold, and *"the gold is in the loch"* was a coordinate, not a metaphor. Roen says *"That's very annoying"* with complete warmth. **Playability contribution:** proof that a long arc needs no geography of its own — it borrows the world's, and the whole colony threads three arcs into one organism (Clot's Glow → Dunfall Drift Spore → the Philosophy Stone).

---

## IV. Spec → Shipped Delta Table

| # | Spec claim | HEAD | Verdict |
|---|---|---|---|
| 1 | 7 new nodes, `num` 138–144 | all 7 live, `num`/terrain/label/act exact | ✅ **SHIPPED** |
| 2 | ~34 quests across 9 arcs | **33** `QUEST_DB` entries, all UQF-1.0 | ✅ **SHIPPED** |
| 3 | 13 items, listed sell values | 13/13, all icons + 5/5 sells exact | ✅ **SHIPPED** |
| 4 | 16 skill checks with named DCs | 14 authored; **14/14 stat+skill+DC exact** | ✅ **SHIPPED** |
| 5 | 11 NPCs with named flags | 11/11 live; 29/29 flags in `_S_DEFAULTS()` | ✅ **SHIPPED** |
| 6 | Node codes OW/SK/SB/DF/LD/BN + 15 hosts | 0/22 resolve as written; **22/22 resolve by `num`+label** | ⚠️ **RENAMED** (§WALK/§NAV-01) |
| 7 | *"MS now has three exits: W/E/S/N"* | compass fields: **0 occurrences** in `NODE_MAP` | ❌ **RETIRED** — the mover walks cell-by-cell |
| 8 | §3.2 *"storyMove gate on LN→LD"* | `storyMove` does not exist; mover refuses only `oob`/`impassable` | ❌ **NOW FORBIDDEN** (invariant #1) |
| 9 | §3.5 *"storyMove gate at HL→DF checks `defeatedBattles['HL']`"* | same | ❌ **NOW FORBIDDEN** (invariant #1) |
| 10 | *"Running total: ~151 live"* quests | 2,853 at HEAD; **402 top-level `QUEST_DB` entries at `e339aeb`** | ⚠️ **UNVERIFIABLE** — see §VI-D |
| 11 | Hull repair costs 200gp at Saltwick | `kind:'cost', gold:200@34133` (*"Dorit looks at your coin. 'Short. Come back when the purse is right.'"*) | ✅ **SHIPPED** — and now a `cost` leaf (§VM-01-G4a) |
| 12 | §HUNT-01 investigation gates the den | gate is *quest-side* only; the den node is walk-open | ✅ **RE-EXPRESSED**, invariant-correct |
| 13 | REF-03 ⚙️ boarding combat | 0 hits | ❌ **NOT SHIPPED** (kept) |
| 14 | REF-03 ⚙️ `travelCompanion` state system | **0 occurrences** | ❌ **NOT SHIPPED** (kept) |
| 15 | REF-03 ⚙️ charter a ship at DK | 0 hits | ❌ **NOT SHIPPED** (kept) |
| 16 | REF-04 ⚙️ investigation lowers confrontation DC | no DC modifier anywhere in §HUNT | ❌ **NOT SHIPPED** (kept) |
| 17 | REF-04 ⚙️ spare-the-monster option | 0 hits | ❌ **NOT SHIPPED** (kept) |
| 18 | The layer is playable | **13 of 33 quests unreachable** | ❌ **ENGINE-ROT** → §V |

**Recommendation register: 0 of 5 ⚙️ items shipped in 76 days.** All five needed a *new system* rather than new data, and the report said so at the time. That is a correct triage surviving unrevised — the deferral held.

---

## V. The Finding — a 100 % census over a 39 % dead layer

### 5.1 Mechanism

`const CELL_GRID = (() => {@9865` maps every cell to an **array** of node codes, built in `NODE_MAP` declaration order; `const cellCode   = (key) => CELL_GRID[key]?.[0] || null;@9874` returns `list[0]`, and `S_story.currentCode` is assigned at exactly two sites, both yielding the primary. `function _uqfActivateAtNode(node, indexFresh) {@30293` keys on `node.code`. **A non-primary node's quests never activate by arrival, its text never renders, its battle never fires, and `if (g.atNode && st.currentCode !== g.atNode) return false;@22147` makes any `atNode` completion there impossible.**

Four of this layer's host nodes are non-primary:

| Node | Cell | Occupants | Primary | Cost |
|---|---|---|---|---|
| **`SEN`** *Aboard the Tilbury Star* | 18,180 | 3 (`LCY` `STN` `SEN`) | `LCY` | **8 quests**, `battle:{label:'Pirate ×3 + Ghost'}`, `loot:'Cargo Manifest'`, `npc:'Ship Captain'`, and `sleep:true, sleepCost:3` |
| **`HFT`** *South Shore — Fishermen's Village* | 10,191 | 6 | `ALF` | 1 quest + the §HUNT-01 hook block |
| **`VAW`** *North Shore Den* | 10,191 | 6 | `ALF` | 1 quest + the drowner den |
| **`ATH`** *Athens — The Market Hill* | 32,203 | 17 | `SEA` | 4 quests |

`SEN` is the layer's hub. It is also a `sleep:true` node, therefore a **Warrant's Board host that no player can ever stand on** (`function _boardHost(node)@37241`).

Cell **10,191** deserves its own note: it holds the entire lake sub-map — `ALF` *North Shore Path*, `HVG` *East Coast — Upper Shore*, `HFT` *South Shore*, `VAW` *North Shore Den* — **plus two Volsunga-saga halls from an unrelated track**, `ODD` *Oddrun's Estate* and `SIG` *Siggeir's Hall*. **5 of 6 stranded, across 2 independent tracks.** This is the §DOC-02x "score by cell, not by arc" result reproduced in a second cell.

### 5.2 Closure over the gate flags

The cell map alone would strand 9 quests. The **flag closure** takes it to 13, because three entry flags have exactly one writer each and each writer sits inside a blocked node's `storyRender` block:

| Flag | Sole writer | Blocked by | Kills |
|---|---|---|---|
| `huntHookReceived` | `if (node.code === 'HFT' && !S_story.huntHookReceived) {@33439` | `HFT` non-primary | `quest_hunt_01`'s completion → `_02` → `_03` → `_04` — **§HUNT-01, 4 of 4** *(§DOC-02r first)* |
| `whodunit2HookReceived` | inside `if (node.code === 'SEN' && S_story.saltwickAccessed) {@33831` | `SEN` non-primary | `quest_bilge_01`'s completion → `_02` → `_03` → `_04` — **§WHODUNIT-01, 4 of 4** *(§DOC-02r first)* |
| `roenAtSea` | `if (node.code === 'SEN' && S_story.roenMidlandsWisdom && !S_story.roenAtSea) {@33595` | `SEN` non-primary | `quest_alch_03`'s completion → `_04` → `_05` → `_06` → `_07` — **§ALCHEMY-01, 5 of 7** — **NEW** |

(`roenAlchemistMet`, written at `if (node.code === 'ATH' && S_story.roenMaltaCrisis && !S_story.roenAlchemistMet) {@33618`, is blocked the same way — but the arc is already dead two beats upstream, so `ATH` is a *redundant* casualty.)

**Blast radius, per arc:** §HUNT-01 loses the Elder Fisherwoman's ninety-one years of lake reading, the Drowned Compass, the drowner den and the Guild's two-season theory correction. §WHODUNIT-01 loses the entire template's only instance — the port drain, Delt's memory, the bilge fight, and the cook who never apologises. §ALCHEMY-01 stops at the Midlands and never reaches the oracle, the Malta crisis, the Alchemist, or the Loch Gold Flake — *so the one arc built to prove that the grandmother spoke literally never gets to prove it.*

### 5.3 The §BOARD-01-FU6 diamond loses its apex

`quest_hunt_01` is not an ordinary casualty: its `onComplete` carries
`{ kind:'unlock', quests:['sq_2','quest_hunt2_01'] }@12917` — the referral graph's **one geo-spanning diamond**, forking to a highland kelpie and a relay-road hag and reconverging on the reopened harbour at `DNF`. Its completion requires `huntHookReceived`. **The apex can activate and can never complete, so the diamond's fork never fires.** Both arms remain independently reachable by arrival, so the *content* survives; what is lost is the Warrant reader's line that connects them — the sentence that turns two hunts into one pattern.

### 5.4 What survives, and why — the closure in the positive direction

Two mechanisms rescue part of the layer, and both were found by looking for a *second route* before writing anything off:

1. **The Warrant's Board pre-activates across the map.** `function _bountyPostable(q, node)@37352` requires only that the destination exist in `NODE_MAP` — **it never tests primacy** — and `_acceptBounty` fires the file's first live `unlock`. So `quest_sea_01` (gate `{}`, `xp:100` ≤ the Unknown tier's 250 cap) *is* postable, and its completion is `completion:{ atNode:'NWI' }` — a **primary** node. **§SPARK-01 SEA is fully playable, but only for a player who finds it on a board.**
2. **The quest panel is not node-scoped.** `// ── QUESTS section (active quests at this node) ────@35753` is followed by `.filter(([, s]) => s === 'active')@35756` over the *whole* `S_story.quests` map, with no node filter. The Ceremonia roll card therefore renders for **any** active skill_check quest at **any** node. This is what makes board-accepted skill-check bounties completable at all — and it is a divergence between a comment and its code that nobody has recorded. → **§DX-02ah**.

Final tally: **17 quests live by walking · 3 live only via the board · 13 unreachable.**

---

## VI. Secondary Findings

**A. Two live double-pay sites (→ §DX-02ai ✅ 2026-09-03 — one was real).** Where a `storyRender` button writes the flag a quest completes on, both sides can pay. This finding named two; measured by clicking each in Playwright, the hull site paid twice and the Fehn site paid once — `quest_spark2_05` has no `xpAward` at HEAD and had none when this report was written, so the figure below for it was wrong. The hull button's inline grant is deleted; the quest is the single payer. As written on 2026-08-12:

- `quest_sk_hull` — the MME button grants `S_story.xp = (S_story.xp||0) + 200;` (deleted by §DX-02ai) and the toast says *"-200gp. +200 XP"*; `storyRender(node)` then completes the quest, whose `onComplete` carries `{ kind:'reward', xp:200 }`. **400 XP paid, 200 announced.**
- `quest_spark2_05` — the DNF Fehn-confrontation button grants +400 gold and +400 XP; the quest then pays `xpAward:600` through `if (q.type === 'side' && q.xpAward) { S_story.xp += q.xpAward; _checkLevelUp(); }@30359`. **1,000 XP paid, 400 announced.**

The other nine button/quest pairs in this layer are clean — payment sits on exactly one side each. These two are the same class as the four fixed by `3338def` (§SPARK-01-FU / §LXX-01-FU) and survived that sweep because it was scoped to the harbour and §LXX stacks.

**B. Two specified movement gates are now banned designs.** §3.2 and §3.5 both specify a `storyMove` refusal — *"The lair (LD) is not accessible until `lakeLairLocated` is set"* and *"The `storyMove` gate at HL→DF checks this flag."* Invariant #1 now forbids any quest state from refusing a step, and `storyMove` no longer exists; the mover refuses for exactly two reasons, `oob` and `impassable`. **Both intents survived the ban** — the investigation still gates the *mission*, never the road. This is §DOC-02c's "specified design is now FORBIDDEN, not merely absent" class, with the unusual outcome that the re-expression is faithful.

**C. `SEN`'s stranding is wider than this layer.** Its 8 `activateNode:'SEN'` quests include `quest_spark_03` and `quest_spark_04` — the §SPARK-01 cat→mouse→tick→parasite beats aboard the Star — so the parent arc loses two beats to the same cell. `STN`, the Map Shop (§AUDIT-03u's *"forty-two nodes"* string), is the third occupant of the same cell and equally unreachable.

**D. The one figure that cannot be checked.** *"Running total: ~151 live"* has no reproducible referent: `QUEST_DB` at `e339aeb` holds **402** top-level entries (269 whose opening line carries an `id:`), and `wbapi-core` cannot parse the archive at all — the `◆◆◆ WORLDBUILDER:` section anchors post-date it, so `npm run stats` has no archive mode. Marked **UNVERIFIABLE**, not wrong. *(Instrument 14: never derive a delta from a count no existing gate produces.)*

---

## VII. Risk Register — Outcomes

| Risk the report filed | Outcome |
|---|---|
| Five templates might not be repeatable | ✅ Held — §SPARK reached 2 instances, §HUNT 2, §PORT 2 |
| Boarding combat needs a dedicated node | ⚠️ Still true; **still not built** |
| `travelCompanion` needs a state system | ⚠️ Still true; **0 occurrences** |
| Keel's motive left deliberately open | ✅ Still open — `sbResolved`, no follow-up authored |
| Arcs must be completable independently | ❌ **Broke, but not the way the author feared** — not through coupling, through geography |

**The risk nobody filed is the one that fired.** Every risk in the register is about *design coupling*: will the arcs depend on each other, will the templates generalise, will the threading make any single arc unplayable alone. The threading is fine — §HUNT-02, §PORT-01/02, §NAVAL-01 and §SPARK-02 are all completable today. What killed 39 % of the layer is that a world-coordinate migration two months later collapsed four host nodes into cells they no longer own. *A design review can only file risks about the thing it is reviewing, and the danger came from the coordinate system underneath it.*

---

## VIII. Conclusion

**This is the highest-fidelity content report §DOC-02 has measured.** Roughly a hundred identifiers — quest ids, flags, item names, icons, sell values, fourteen stat/skill/DC triples, seven full node records with their bidirectional wiring — and **not one transcription error**, across 76 days, a total quest-format migration (§ARCH-01), and a 26×16 → 90×360 world-coordinate migration (§WALK/§NAV-01). It is instrument 12's positive case in its purest form: every table here was a **specification meant to be transcribed**, and the engine transcribed it.

**And that is exactly why it matters that 13 of its 33 quests cannot be played.** No gate is red. `check:noderegs`, `check:nodeindex`, `check:dupkeys`, `check:npcregs` and `check:legacycodes` all exit 0 on this material; every node code resolves, every quest id resolves, every flag is declared, every skill check is well-formed. `quest.md` lists the arcs as live, and of `QUEST_DB` that is entirely true.

**The one sentence worth keeping:** *the lab-report loop verifies that what was specced got written, and it has no instrument for whether what was written can be reached* (§DX-02w). This report is the cleanest demonstration the corpus has of both halves at once — a perfect spec, perfectly implemented, into a world that moved out from under four of its nodes.

The cheapest repair is also the smallest: **`SEN`, `HFT`, `VAW` and `ATH` are `list[0]` of nothing.** Reordering four `NODE_MAP` declarations, or splitting four cells, restores three complete arcs, a template that currently has zero live instances, the Tilbury Star's rest node and pirate battle, and the referral graph's only diamond apex — without touching a single line of the content this report specified, because all of it is still there.

---

## IX. Filed From This Verification

- **§AUDIT-03x extended** — cell `10,191`: 6 nodes, 2 independent tracks, **5 stranded**; cell `18,180`: `SEN` + `STN` behind `LCY`. `SEN` carries 8 quests, a battle, loot, an NPC and `sleep:true`.
- **§DX-02w confirmed, 4th independent reproduction** — the single-writer-inside-a-blocked-block shape, three instances in one layer.
- **§DX-02ah (NEW, 🟡)** — the quest panel renders every active quest at every node, contradicting its own comment; load-bearing for §BOARD-01, and it makes §BOARD-01-FU3's leg-count label cosmetic for skill-check bounties.
- **§DX-02ai ✅ 2026-09-03** — filed as two live double-pay sites; measured, `quest_sk_hull` paid 400 XP against 200 announced and is fixed, `quest_spark2_05` paid the 400 it announced and was never a double-pay.

---

**Cross-references:** `BACKLOG.md §AUDIT-03x` · `§DX-02w` · `§DX-02ah` · `§DX-02ai` · `quest.md §HUNT-01` · `lab-report-meta-process-loop-expansion.md §III` · `src/scripts/check-noderegs.js` (`SYNTHETIC_BATTLE_CODES`)
**Ship commit:** `e339aeb` (2026-05-28) · **Verified:** 2026-08-12 at `2b6c33e`

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
