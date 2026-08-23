<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Story Flowchart — The Shattered Codex

> Node codes are two-letter identifiers from `NODE_MAP` in `play.html`.
> Town hubs use bold two-letter abbreviations: **BI** Birka · **TL** Tilbury · **VS** Visby · **WM** Weimar.
> `[dead]` = dead-end node (no exits). `──*──>` = portal/instant teleport. `[E*]` = Epic Battleground dead-end.
>
> **§CELL note:** Edges in this diagram represent **cell-grid adjacency** (neighboring `(r,c)` coordinates), not stored N/E/S/W fields on node objects. `cellMove(dir)` derives exits from `CELL_GRID` at runtime. Moving a node's coordinates changes its connections; stored direction fields are deprecated and rejected by the API.

---

## High-Level Town Map

```
                    [AR]──J5──[HC]──J7──[OP]──[KT]──[GA]
                      │                                 ↑ portal from OU
              WM ──[SQ]──[BQ]──[OU]──*
              │    │
              │  [HL]──────────── (west approach to WM from ACT III)
              │
[DF]──[SL]──BI──[CI]──J1──[MI]──J6──[FO]──[SW]──[HS]──J3──[BE]
              │                   │
             [CQ]                [MT]──[YL]──[YC]
              │
              BI──TL──[DK]──[MQ]──[SF]
                        │         │
                       [MS]      [AL]──VS──[SE]──[BK]──[GC]──[PC]
                        │                              │
                       [OC]──[IS]──[AT]     [MC]──[CA]──[VC]──[DE]──[DC]──[JU]
                              │
                             [SC]──[FL]──(JU above)
                              └──[DS]──J4──(SE above)
```

---

## Detailed Flow by Act

```
══════════════════════════════════════════════════════════════════
 ACT I — BIRKA  [BI]
══════════════════════════════════════════════════════════════════

  DF(72) ─┬─ HM(73) [dead]        ← defi_land cluster (Extended Birka)
           └─ GL(74) [dead]
           │
         SL(51) ─── CQ(77) [dead] ← Cat Arc (§IX)
           │
         CI(01) ─────────────────────────────────> J1(43) → ACT III
           ├─ IN(02)
           │    └─ TV(03) ── BA(04)
           └─ CR(05) ── CY(06) ─────────────────────────────> DK(07) → ACT II

══════════════════════════════════════════════════════════════════
 ACT II — TILBURY  [TL]
══════════════════════════════════════════════════════════════════

  CY(06) ──> DK(07) ─┬─ MQ(08) ── SF(09)
                      ├─ MS(10) [dead]     ← pirate boarding
                      ├─ AL(11) ──────────────────────────────> SE(24) → ACT V
                      └─ OC(18) ──────────────────────────────────────> → ACT IV

══════════════════════════════════════════════════════════════════
 ACT III — WESTERN WILDS
══════════════════════════════════════════════════════════════════

  J1(43) ──> MI(12) ─┬─ EM(63) [dead]    ← [E] Noonwraith Queen's Field
                      │
                      └─ J6(48) ─┬─ MT(50) ─── ET(67) [dead]   ← [E] Peak of Eldest
                      │           │    └── (§XVII investigation mark; §XXI Warden)
                      │           ├─ YL(75) ── YC(76) [dead]   ← fishing cluster
                      │           └─ FO(13) ─┬─ EF(52) [dead]  ← [E] Thornwood Maw
                      │                       └─ SW(15) ─┬─ ES(54) [dead] ← [E] Sunken Altar
                      │                                   └─ HS(16) ─┬─ EW(55) [dead]
                      │                                               └─ J3(45) ── BE(17)
                      │                                                              └─ EB(56) [dead]
                      └─ HL(14) ─┬─ EH(53) [dead]   ← [E] Loch Drowned King
                                  └─ SQ(35) ─────────────────── shortcut → ACT VI

══════════════════════════════════════════════════════════════════
 ACT IV — SEA CIRCUIT
══════════════════════════════════════════════════════════════════

  OC(18) ─┬─ IS(19) ─┬─ EI(58) [dead]   ← [E] Isle of the Wyrm Crown
           │           └─ AT(20) ─┬─ EA(59) [dead]  ← [E] Abyssal Scriptorium
           │                       └─ [dive]
           ├─ SC(21) ─┬─ EC(60) [dead]   ← [E] Scholar Kings' Forge
           │           └─ FL(22) ─┬─ EL(61) [dead]  ← [E] Sunken God's Throne
           │                       └─ JU(33) ─────────────────────> → ACT VI
           └─ DS(23) ─┬─ EO(57) [dead]   ← [E] Leviathan's Eye
                       ├─ ED(62) [dead]   ← [E] Trench Titan
                       └─ J4(46) ──> SE(24) → ACT V

══════════════════════════════════════════════════════════════════
 ACT V — VISBY  [VS]
══════════════════════════════════════════════════════════════════

  AL(11) ──> SE(24) ──> BK(25) ──> GC(26) ─┬─ PC(27) ─┬─ EP(70) [dead]
                                              │           └─ [dead end]
                                              ├─ EG(71) [dead]   ← [E] Void Shaman's Sanctum
                                              └─ MC(28) ── CA(29) ── VC(30) ──> DE(31) → ACT VI

══════════════════════════════════════════════════════════════════
 ACT VI — DESERT + WEIMAR  [WM]
══════════════════════════════════════════════════════════════════

  DE(31) ─┬─ EE(64) [dead]   ← [E] Pharaoh's Vault
           └─ DC(32) ─┬─ EV(65) [dead]   ← [E] Djinn Lord's Palace
                       └─ JU(33) ─┬─ EJ(66) [dead]  ← [E] Canopy Cathedral
                                   └─ BQ(34) ──> SQ(35) ─┬─ AR(41) ─┬─ ER(68) [dead]
                                                           │           └─ SQ(35) [loop back]
                                                           └─ OU(36) ──*──> GA(37) → ACT VII

  WM node cluster (SQ hub):
  SQ(35) ─┬─ BQ(34) ── OU(36) ──*──> GA
           ├─ AR(41) ── J5 ── HC
           └─ (approach from HL via ACT III shortcut)

══════════════════════════════════════════════════════════════════
 ACT VII — MYTHIC CIRCUIT
══════════════════════════════════════════════════════════════════

  GA(37) ──> KT(38) ──> OP(39) ──> J7(49) ──> HC(40) ─┬─ EK(69) [dead]
                                                          ├─ CO(42) → ACT VIII
                                                          └─ J5(47) ──> AR(41) ─┬─ ER(68) [dead]
                                                                                  └─ SQ(35) [WM]

══════════════════════════════════════════════════════════════════
 ACT VIII — THE CONVERGENCE  [CO]
══════════════════════════════════════════════════════════════════

  CO(42) ──> [CODEX REFORGED → VICTORY]
              └─ (Quest -1 triggers here at Level 20 — §XIV)
              └─ (NG+ Froberger's Letter here — §XV)
              └─ (Fifth ending variant if vaArchitectureKnown — §XVII)
```

---

## Arc Overlays

Each named arc touches specific nodes. Intersection points (nodes shared by multiple arcs) are marked ★.

### Main Quest Arc (7 Shards)
```
CI(01) → J1 → MI → J6 → FO → SW → HS → J3 → BE → OC → IS → AT   [Shard #3]
DK(07) [Shard #1]
FO(13) [Shard #2]
AT(20) [Shard #3]
GC(26) [Shard #4] ★
DC(32) [Shard #5]
OP(39) [Shard #6]
SQ(35) [Shard #7] ★
CO(42) [Reforging]
```

### Investigation Chain Arc — §XVI → §XVII → §XXI
```
NODES: SQ(35)★ · CI(01)★ · SL(51) · DF(72) · WM[doc4] · MT(50)★

§XVI Weimar Scholar Gate:
  SQ(35) — 4-quest archive chain (quest_wm_01 through quest_wm_04)
  SQ(35) — 3 reading circle sessions (wmSessionsDays)
  SQ(35) — Document 3 unredacted → wmFirstResearcherKnown

§XVII Void Archaeology (NG+ only):
  CI(01) — [INVESTIGATE] → vaCI flag
  SL(51) — [INVESTIGATE] → vaSL flag
  DF(72) — [INVESTIGATE] → vaDF flag
  SQ/WM  — [INVESTIGATE] → vaWM flag (archive modal gains Document 4)
  MT(50) — [INVESTIGATE] → vaMT flag → all 5 found → vaAllMarksFound
  MT(50) — [Open tunnel] → vaLastWardVisited (key: Antecedent Seal or Froberger's Field Notes)
  SQ(35) — Benedikt synthesis when vaLastWardVisited + entry42Written → vaArchitectureKnown

§XXI Void Shaman:
  MT(50) — Warden encounter (requires vsShamanKnown + vaLastWardVisited)
  MT(50) — Persuasion path: Constructor's Log → vsShamanPersuaded
  MT(50) — Combat path: void_shaman monster → vshamanDefeated
  SQ(35) — Benedikt callback (persuasion path only, fav ≥ 2)

Prerequisite chain: §XVI → wmFirstResearcherKnown → §XVII → vaLastWardVisited → §XXI
```

### Coastal Underground Arc — §XIX + §XX
```
NODES: DK(07)★ · SF(09) · GC(26)★

§XIX Tilbury Harbor Arc:
  DK(07) / SF(09) — Harbor Board, 10 missing ships, Rennau NPC
  SF(09) — Ori encounter (Act IV+, tlLedgerRead)
  Cross-ref: if wmFirstResearcherKnown → Isolde Voss appears in Harrow Manifest

§XX Visby Underground:
  BK(25) / SE(24) — Solvak NPC
  GC(26) — Yva NPC, Hollow Hands Seal
  GC(26) — vsDebtSettled + vsShamanKnown set simultaneously → enables §XXI
```

### NG+ Remembrance Arc — §XV
```
NODES: CI(01)★ · SQ(35)★ · CO(42)★

CI(01) — Entry 42 modal (ngPlusRun ≥ 1, priorQuestMinusOne, 3+ Dear Friends)
SQ(35) — Benedikt synthesis (requires entry42Written) — links to §XVII
CO(42) — Froberger's sealed letter (frobergerLetterFound)
ALL    — NPC_NG_MEMORY_LINES fire on 2nd visit to each Dear Friend node

State chain: questMinusOne (§XIV) → priorQuestMinusOne (NG+ reset) → entry42Written (§XV) → vaArchitectureKnown (§XVII)
```

### Birka NPC Arc
```
NODES: CI(01)★ · IN(02) · TV(03) · BA(04) · CY(06)

CI — Yael Scheidemann (City Guard Captain) — quest_yael_escort
IN — Brynn Clerambault (Innkeeper) — quest_brynn_ledger; §XXXV farewell
TV — Quill / Tomas Couperin (Bard) — quest_couperin_lute
BA — Pachelbel / Deacon (Fence) — quest_pachelbel_goods
CY — Weckmann (Pit Master) — quest_pit_training
CY — Auros / Commander Bruhns — quest_auros_depths; §XXXVII CO scene
```

### Cat Arc — §IX (Layer 44)
```
NODES: SL(51) → CQ(77) [dead-end]

CQ — 6-quest chain (Q-CAT-01 through Q-CAT-06)
CQ — Ally Cat hierarchy (strays → fluffies → beefies → honchos → Taz Devils → Cat-King)
CQ — Kenickie's black market (§XL) unlocked by quest_cat_05
```

### Corelli Wandering Merchant Arc — §XXVI
```
NODES: DK(07)★ · RD(78) · IS(19) · SQ(35)★ · IN(02)

Appearance 1: DK (Act II)
Appearance 2: RD (Act III) — roadside waypoint
Appearance 3: IS (Act V)
Appearance 4: SQ (Act VI) ★
Appearance 5: IN (Act VIII) — revelation if fav = 3
```

### Epic Battlegrounds Arc — 20 Nodes
```
Each EB node is a dead-end off one parent main-path node:

FO(13) → EF(52)   HL(14) → EH(53)   SW(15) → ES(54)   HS(16) → EW(55)
BE(17) → EB(56)   DS(23) → EO(57)   IS(19) → EI(58)   AT(20) → EA(59)
SC(21) → EC(60)   FL(22) → EL(61)   DS(23) → ED(62)   MI(12) → EM(63)
DE(31) → EE(64)   DC(32) → EV(65)   JU(33) → EJ(66)   MT(50) → ET(67)
AR(41) → ER(68)   HC(40) → EK(69)   PC(27) → EP(70)   GC(26) → EG(71)
```

---

## Intersection Points ★

Nodes where two or more named arcs cross. These are the most structurally loaded locations in the game.

| Node | Code | Arcs Crossing | Notes |
|------|------|--------------|-------|
| Birka City Streets | `LHR` (historical `CI`) | Main Quest · §XVII · §XV · Birka NPC (Yael) | Entry 42 modal fires here in NG+; §XVII mark vaCI |
| First Inn | `TLL` (historical `IN`) | Main Quest · Birka NPC (Brynn) · Corelli (5th) · §XXV Homecoming | Brynn farewell + Corelli revelation both fire here Act VIII |
| Tilbury Docks | `LCY` (historical `DK`) | Main Quest (Shard #1) · §XIX · Corelli (1st) | Harbor Board + Harrow Manifest + Corelli introduction |
| Goblin Warrens | `TRD` | Main Quest (Shard #4) · §XX · §XXI (prerequisite) · [E] `TBS` | vsShamanKnown set here; enables Warden encounter; `TBS` `FLR` (historical `EB`) |  *(historical: `GC`=`TRD` · `EG`=`TBS`)*
| Mountain Pass | `GVA` (historical `MT`) | §XVII (5th mark + tunnel) · §XXI (Warden) · [E] `KTM` (historical `ET`) | Only node that is simultaneously investigation site and encounter node |
| Scholar's Quarter | `NUE` (historical `SQ`) | Main Quest (Shard #7) · §XVI · §XVII · §XXI · §XV · Corelli (4th) | Most arc-loaded node in the game — 5 arcs intersect here |
| Cosmic Realm | `TLS` (historical `CO`) | Main Quest (victory) · §XIV (Quest -1) · §XV (Froberger's letter) · §XVII (5th ending) | End state diverges based on 4 arc completion flags |
| Birka Slums | `BMA` (historical `SL`) | Cat Arc (→`CDG` (historical `CQ`)) · §XVII (vaSL mark) | Investigation mark + cat arc hub |

---

## Story Arc Files Index

| Arc File | Content | Lab Reports |
|----------|---------|-------------|
| `story.md` | Main quest nodes 1–42 · Prologue · 4 Towns · 7 Epic NPCs · Ending system | `lab-report-game-story-codex-of-conquest.md` |
| `story-arc-npc-dialogues.md` | Birka Six NPC_DIALOGUES full transcript (120 quotes) · Arc summary | `lab-report-birka-beginner-arc.md` · `lab-report-npc-dialogue-system.md` · `lab-report-narrative-arcs-brynn-bruhns-yael.md` |
| `story-arc-epic-battlegrounds.md` | Q52–Q71 EB quest-giver dialogue (5 fields × 20 entries) | `lab-report-epic-battlegrounds.md` |
| `story-arc-investigation.md` | §XVI Weimar Scholar Gate · §XVII Void Archaeology · §XXI Void Shaman | `lab-report-weimar-scholar-gate.md` · `lab-report-void-archaeology.md` · `lab-report-void-shaman.md` |
| `story-arc-coastal.md` | §XIX Tilbury Harbor · §XX Visby Underground | `lab-report-tilbury-visby-arcs.md` |
| `story-arc-ngplus.md` | §XV NG+ Remembrance · Entry 42 · quest_ng_01/02/03 | `lab-report-ng-plus-remembrance.md` |
| `story-flowchart.md` | This file — flowchart + arc overlays + intersection points | — |

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../../LICENSE) for full text.*
