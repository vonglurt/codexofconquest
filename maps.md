<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# MAPS — The Shattered Codex
### Island World Grid Map & Node Network Reference

> **Grid system:** Columns C01–C26 (west→east), Rows R01–R16 (north→south). Each cell is a 2-letter code. `WW` = water (ocean, impassable without boat). Sky nodes (CO, HC) float above the island. Mythic-east nodes (GA, KT, OP) are on a distant island reachable by sky road — their grid position reflects relative east direction. All node connections are derived from `CELL_GRID` adjacency; no stored edge data exists.

---

## TINY MAP — Overview (Zones)

*Each cell represents a broad geographic zone. Use for orientation only.*

```
     W  CE  C  E  ME
  N [AR][HI][  ][VL][SK]
 NW [  ][HL][MI][CR][  ]
  W [FO][SW][  ][DK][  ]
 SW [JU][HS][DE][AL][AC]
  S [FL][SC][  ][CA][VC]
 CS [BE][OC][IS][  ][  ]
 DS [  ][AT][DS][  ][  ]
```
**Zone Key:** AR=Arctic/Sky · HI=Weimar · VL=Birka · SK=Tilbury · HL=Highlands · MI=Midlands · CR=Crypts · FO=Forest · SW=Swamp · DK=Docks · JU=Jungle · HS=Hag Swamp · DE=Desert · AL=Alley · AC=Visby · FL=Freshwater · SC=Sea Cavern · CA=Catacombs · VC=Vampire · BE=Beach · OC=Ocean · IS=Islands · AT=Atlantis · DS=Deep Sea

---

## FULL MAP — Node Grid (26×16)

*Two-letter node codes. `WW` = water. Non-node land cells shown as `..`. Epic Battleground nodes (E*) appear at WW cells only where the terrain has a logical override (deep forest, underwater cave, frozen waste, sky-adjacent spire). Mythic-east nodes shown at far right; reach by walking east via sky road.*

```
     C01 C02 C03 C04 C05 C06 C07 C08 C09 C10 C11 C12 C13 C14 C15 C16 C17 C18 C19 C20 C21 C22 C23 C24 C25 C26
R01: WW  WW  ER  WW  WW  WW  WW  WW  WW  J5  WW  WW  WW  WW  WW  EK  HC  CO  WW  WW  WW  J7  WW  WW  WW  WW
R02: WW  WW  AR  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  KT  WW  OP  WW  WW  WW
R03: WW  WW  SQ  BQ  OU  WW  WW  WW  WW  WW  WW  WW  WW  WW  GL  DF  HM  WW  WW  GA  ..  WW  ..  WW  WW  WW
R04: WW  WW  HL  EH  MT  ET  WW  EM  WW  WW  WW  WW  WW  WW  WW  SL  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW
R05: WW  EF  FO  ..  J6  ..  ..  MI  ..  ..  ..  J1  ..  WW  WW  CI  IN  WW  WW  WW  WW  WW  WW  WW  WW  WW
R06: WW  ES  SW  ..  YL  ..  ..  ..  ..  ..  ..  ..  ..  WW  WW  ..  TV  BA  WW  WW  WW  WW  WW  WW  WW  WW
R07: WW  WW  HS  ..  YC  ..  ..  ..  ..  ..  ..  ..  ..  WW  CR  CY  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW
R08: WW  WW  EW  ..  ..  ..  ..  ..  ..  ..  ..  ..  ..  ..  DK  MQ  SF  WW  MS  WW  WW  WW  WW  WW  WW  WW
R09: WW  WW  J3  ..  ..  ..  ..  ..  ..  ..  ..  ..  ..  ..  AL  ..  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW
R10: WW  JU  EJ  J2  DE  ..  DC  EV  ..  ..  ..  CA  SE  BK  GC  PC  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW
R11: EC  FL  EL  ..  EE  ..  ..  ..  ..  ..  VC  MC  ..  EG  WW  EP  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW
R12: SC  BE  EB  ..  ..  ..  ..  J4  ..  ..  ..  ..  ..  ..  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW
R13: OC  WW  IS  EI  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW
R14: WW  AT  WW  DS  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW
R15: WW  EA  ED  EO  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW
R16: WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW
```

---

## LEGEND — Two-Letter Code Reference

| Code | Node # | Terrain | Act | Grid Cell | Story Description |
|------|--------|---------|-----|-----------|-------------------|
| SL | 51 | city_slums | I | R04,C16 | Birka Slums — vermin hunting ground (The Vermin Pit), N of CI; connects N→DF |
| CQ | 77 | cat_quarter | ⚠️ PLANNED | R04,C17 | The Cat Quarter — Ally Cat hierarchy, Jimmy Two-Tails quest-giver, 6-quest arc (Layer 46); E of SL |
| RD | 78 | road | ⚠️ PLANNED | R09,C14 | Roadside waypoint — cleared verge between Tilbury and Visby; Corelli 2nd appearance (Act III); no battle/loot/sleep (Layer 61) |
| DF | 72 | defi_land | I | R03,C16 | The Unbanked Quarter — unregistered district, NGMI Swarm ×3 + Rug Spider, NPC Grimshaw |
| HM | 73 | defi_land | I | R03,C17 | Frequency Row — improvised antenna arrays, Bertha No-Bank (dead-end E of DF) |
| GL | 74 | defi_land | I | R03,C15 | Old Guard's Corner — Zeke 'The Signal', laminated GET OFF sign (dead-end W of DF) |
| CI | 01 | city | I | R05,C16 | Birka city streets — quest start |
| IN | 02 | inn | I | R05,C17 | First inn — sleep mechanic intro, Froberger's journal |
| TV | 03 | tavern | I | R06,C17 | Birka tavern — cipher scrap, Bard Quill |
| BA | 04 | bar | I | R06,C18 | Rough bar, crypt entrance — fence, Conclave Pass |
| CR | 05 | crypt | I | R07,C15 | Birka crypt — skeletons, Crypt Key |
| CY | 06 | cyberpunk_streets | I | R07,C16 | Undercity — Auros, Signal Jammer, EMP Grenade |
| DK | 07 | docks | II | R08,C15 | Tilbury harbor — Magistra Muffat, Shard #1 |
| MQ | 08 | market_quarter | II | R08,C16 | Tilbury market — Flash Powder, supplies |
| SF | 09 | storefront | II | R08,C17 | Map shop — Real Map from Proprietor Dusk |
| MS | 10 | merchant_ship | II | R08,C19 | Aboard *Tilbury Star* — pirate boarding |
| AL | 11 | alley | II | R09,C15 | Visby approach — Warrant checkpoint |
| MI | 12 | midlands | III | R05,C08 | Open plains — Noonwraith encounter |
| FO | 13 | forest | III | R05,C03 | Aldric's forest — Leshen, Shard #2, Earthbind Root |
| HL | 14 | highlands | III | R04,C03 | Irish highlands — Kelpie loch, Snare Trap |
| SW | 15 | swamp | III | R06,C03 | Murky swamp — Drowner, Runed Stone |
| HS | 16 | hag_swamp | III | R07,C03 | Crones' domain — Binding Web, Sea Cave Key |
| BE | 17 | beach | III | R12,C02 | Tropical beach — signal Draketide |
| OC | 18 | ocean | IV | R13,C01 | Aboard *Cerulean Debt* — Draketide, Feint Scroll |
| IS | 19 | islands | IV | R13,C03 | Island harbor — Kassiphane's letter |
| AT | 20 | atlantis | IV | R14,C02 | Sunken library — Aboleth, Shard #3 |
| SC | 21 | sea_cavern | IV | R12,C01 | Coastal cave — Dragon Turtle, Scholar King markers |
| FL | 22 | freshwater_lake | IV | R11,C02 | River cave/lake — Kappa, River Blessing |
| DS | 23 | deep_sea | IV | R14,C04 | Trench crossing — Charybdis, ship danger |
| SE | 24 | sewers | V | R10,C13 | Visby sewers — Gritch the guide |
| BK | 25 | bar (Visby) | V | R10,C14 | Broken Tooth Tavern — Warlord Mordus |
| GC | 26 | goblin_cave | V | R10,C15 | Goblin warrens — Void Shaman, Shard #4, Void Virus |
| PC | 27 | pirate_cave | V | R10,C16 | Pirate cave — treasure, hammock sleep |
| MC | 28 | monster_cave | V | R11,C12 | Monster den — Zeugl, Abandoned Scholar Pack |
| CA | 29 | catacombs | V | R10,C12 | Scholar Kings' underground road — Wights |
| VC | 30 | vampire_castle | V | R11,C11 | Vampire ruins — Bruxa Mourne, Toll Token |
| DE | 31 | desert | VI | R10,C05 | Desert wastes — Mummy, crossroads |
| DC | 32 | desert_caravan | VI | R10,C07 | Izador's caravan — Djinn, Shard #5 |
| JU | 33 | jungle | VI | R10,C02 | Dense jungle — Mael, Neurotoxin, Scholar road |
| BQ | 34 | blacksmith_qtr | VI | R03,C04 | Weimar lower — Dora Flint, Thunderstone |
| SQ | 35 | scholars_qtr | VI | R03,C03 | Weimar upper — Sweelinck, Shard #7, Riddle Door |
| OU | 36 | outhouse | VI | R03,C05 | Observatory outhouse |
| GA | 37 | greek_agora | VII | R03,C20 | Ancient Agora — Oracle Kassiphane, Basilisk Flask |
| KT | 38 | camelot | VII | R02,C21 | Arthurian ruins — Death Knight, Knight's Favour |
| OP | 39 | oriental_palace | VII | R02,C23 | Dragon Palace — Jade Construct, Shard #6 |
| HC | 40 | heavenly_clouds | VII | R01,C17 | Sky road — Fallen Seraph, fast return to Birka |
| AR | 41 | arctic | VII | R02,C03 | Arctic detour — Wendigo, Ice Giant |
| CO | 42 | cosmic_realm | VIII | R01,C18 | Birka spire convergence — Codex reforging, finale |
| J1 | 43 | junction | III | R05,C12 | Midlands Road Fork — waypoint between CI and MI |
| J2 | 44 | junction | V  | R10,C04 | Southern Road Cross — waypoint between JU and DE |
| J3 | 45 | junction | IV | R09,C03 | Coastal Fork — waypoint between HS and BE |
| J4 | 46 | junction | IV | R12,C08 | Deep Road Split — waypoint between DS and SE |
| J5 | 47 | junction | VII | R01,C10 | Arctic Overpass — waypoint between AR and HC |
| J6 | 48 | junction | III | R05,C05 | Western Wilds Crossroads — FO/MI junction; N branch to MT, S branch to YL (Yugurt Lake) |
| J7 | 49 | junction | VII | R01,C22 | Sky Gate Spur — connects HC and OP sky road |
| MT | 50 | mountains | III | R04,C05 | The Mountain Pass — Hunting Ground; dead-end north of J6 |
| YL | 75 | yugurt_lake | III | R06,C05 | Yugurt Lake — predator fish encounter system; `isFishingLake:true`; S of J6, N to YC |
| YC | 76 | yugurt_cabin | III | R07,C05 | Yugurt Cabin — The Fisherman NPC, Fishing Rod loot, free sleep; dead-end south of YL |
| EF | 52 | epic_forest | III | R05,C02 | Thornwood Maw — Thornwood King (Treant); dead-end west of FO *(WW override)* |
| EH | 53 | epic_highlands | III | R04,C04 | Loch of the Drowned King — Highland Aboleth; dead-end east of HL |
| ES | 54 | epic_swamp | III | R06,C02 | Sunken Altar — Elder Hydra; dead-end west of SW *(WW override)* |
| EW | 55 | epic_hag_swamp | III | R08,C03 | Hag Mother's Cradle — Grand Hag Queen; dead-end south of HS |
| EB | 56 | epic_beach | III | R12,C03 | Wreck of the Unbroken — Vampire Pirate Lord; dead-end east of BE |
| EO | 57 | epic_deep_sea | IV | R15,C04 | Leviathan's Eye — The True Leviathan; dead-end south of DS *(WW override)* |
| EI | 58 | epic_islands | IV | R13,C04 | Isle of the Wyrm Crown — Ancient Sea Dragon; dead-end east of IS *(WW override)* |
| EA | 59 | epic_atlantis | IV | R15,C02 | Abyssal Scriptorium — Index Guardian Aboleth; dead-end south of AT *(WW override)* |
| EC | 60 | epic_sea_cavern | IV | R11,C01 | Scholar Kings' Forge — Forge Warden Dragon Turtle; dead-end west of SC *(WW override)* |
| EL | 61 | epic_freshwater | IV | R11,C03 | Sunken God's Throne — Storm Giant Titan; dead-end east of FL |
| ED | 62 | epic_deep_sea_2 | IV | R15,C03 | Trench Titan — Charybdis Prime; dead-end SW of DS *(WW override)* |
| EM | 63 | epic_midlands | III | R04,C08 | Noonwraith Queen's Field — Noonwraith Queen; dead-end north of MI *(WW override)* |
| EE | 64 | epic_desert | VI | R11,C05 | Pharaoh's Vault — Vault Pharaoh (Mummy Lord); dead-end south of DE |
| EV | 65 | epic_caravan | VI | R10,C08 | Djinn Lord's Palace — Elder Marid; dead-end east of DC |
| EJ | 66 | epic_jungle | VI | R10,C03 | Canopy Cathedral — Cathedral Wyrm (Green Dragon); dead-end east of JU |
| ET | 67 | epic_mountains | III | R04,C06 | Peak of the Eldest — Summit Wyrm (White Dragon); dead-end east of MT *(WW override)* |
| ER | 68 | epic_arctic | VII | R01,C03 | Frost Warden's Throne — Frost Giant Jarl Kolvros; dead-end north of AR *(WW override)* |
| EK | 69 | epic_clouds | VII | R01,C16 | Shattered Seraph's Spire — Fallen Seraph Variel; dead-end west of HC *(WW override)* |
| EP | 70 | epic_pirate | V | R11,C16 | Admiral's Last Cove — Admiral's Ghost (Wraith King); dead-end south of PC *(WW override)* |
| EG | 71 | epic_goblin | V | R11,C14 | Void Shaman's Sanctum — Void High Shaman Kazrath; dead-end SE of GC |
| PL | 91 | philippi | IV | off-map §LXV | Philippi — The River Quarter — Lyra converted; crowd by the river |
| EF2 | 94 | ephesus | IV | off-map §LXVII | Ephesus — The Silver Quarter — Demetrius riot; silversmith guild uprising |
| AE | 92 | athens | IV | off-map §LXVI | Athens — The Market Hill — Areopagus speech; the unknown-god altar |
| KR | 93 | corinth | IV | off-map §LXVIII | Corinth — The East Harbor — letters written; two seasons in the city |
| ML | 95 | malta | IV | off-map §LXIX | Malta — The Shore — snake bite at the fire; crowd reversal; no skill roll |
| ST | 96 | rome | IV | off-map §LXIX | Rome — House Arrest — commission ends; the chain is the last fact |
| LJ0 | 111 | junction | IV | off-map §SIREN-01 | The Littoral Passage — §SIREN-01 arc entry; enters via DS east probe |
| LC1 | 112 | port_aurel | IV | off-map §SIREN-01 | Port Aurel — The Tide Keep — Lady Aurel; BUSY; WIS Insight DC 12 |
| LJ1 | 113 | junction | IV | off-map §SIREN-01 | First Crossing — Sea Spawn ×2 |
| LC2 | 114 | port_calice | IV | off-map §SIREN-01 | Port Calice — The Drawbridge Court — Lady Calice; MAYBE; INT Investigation DC 13 |
| LJ2 | 115 | junction | IV | off-map §SIREN-01 | Second Crossing — Deep One ×3 |
| LC3 | 116 | port_mireille | IV | off-map §SIREN-01 | Port Mireille — The Cape Court — Lady Mireille; FRIEND; CHA Persuasion DC 14 |
| LJ3 | 117 | junction | IV | off-map §SIREN-01 | The Serpent Passage — Sea Serpent (solo); navigator storyRender trigger fires |
| LC4 | 118 | port_solen | IV | off-map §SIREN-01 | Port Solen — The Far Harbor — Lady Solen; SOON; WIS Insight DC 13 |
| LCA | 119 | southern_anchorage | IV | off-map §SIREN-01 | The Southern Anchorage — arc terminal; storyRender betrayal-count close (0 / 1–2 / 3) |
| LSO | 120 | fog_bank | IV | off-map §SIREN-01 | The Fog Bank — Open Water — The Overseer; WIS Insight DC 15; parallel dead-end east of LJ3 |

> **Junction note:** J1–J7 are navigation waypoints with no battle or loot. They appear as `✛` on the map. MT is the only terrain node reachable only via J6.N — it exists purely as a Hunting Ground for the `mountains` terrain. J6 also connects S→YL (Yugurt Lake) — a fishing-only dead-end branch that does not appear on the main quest path.

> **Yugurt Lake cluster note (Nodes 75–76):** YL (Yugurt Lake, R06,C05) and YC (Yugurt Cabin, R07,C05) occupy cells south of J6 at the Western Wilds Crossroads. YL has `isFishingLake:true` — `storyFishing()` triggers here instead of a standard encounter. YC has The Fisherman NPC and a free sleep (sleepCost:0) with a Fishing Rod loot drop. Neither node has a main quest battle or Codex Shard. The Yugurt fish pool (fish_01–fish_20) is documented in `monsters.md` and `lab-report-fish-with-dnd.md`.

> **Epic Battleground note:** E* nodes (EF–EW, Nodes 52–71) are dead-ends with a single deadly-tier boss and no tier picker. They are accessible only from their parent node. WW-override cells represent terrain that is accessible by specific lore (deep forest passage, underwater cave, frozen waste, sky-adjacent spire, tidal cave) but not traversable by normal travel. The `isEpicBattleground:true` flag in NODE_MAP gates the DANGER:EPIC pre-battle overlay and auto-waypoint-return system (Layer 39).

> **Duplicate terrain note:** `BA` = bar, Node 4 (Birka, R06,C18). `BK` = bar (Broken Tooth), Node 25 (Visby, R10,C14). Same terrain type, different nodes and codes. DS(23) has two EB dead-ends: EO (south, Leviathan's Eye) and ED (SW, Trench Titan) — both are separate encounters with separate quest givers.

> **Defi_land cluster note (Nodes 72–74):** DF/HM/GL are three `defi_land` terrain nodes north of SL in the extended Birka Slums district. They occupy R03,C15–C17, cells previously shown as WW. DF (The Unbanked Quarter) is the hub — HM (Frequency Row) hangs off its east, GL (Old Guard's Corner) off its west. Both HM and GL are dead-ends. DF has one story battle (NGMI Swarm ×3 + Rug Spider) and NPC Grimshaw. None of these nodes have a Codex Shard, inn sleep, or vendor.

> **⚠️ PLANNED — Cat Quarter note (Node 77, Layer 46):** CQ (The Cat Quarter) is planned at R04,C17 — one cell east of SL (Birka Slums). It extends the Birka Slums district eastward. CQ will be a `cat_quarter` terrain node with a 6-quest arc (Q-CAT-01 through Q-CAT-06) and the Ally Cat hierarchy (strays → fluffies → beefies → honchos → Taz Devils → Cat-King). Not yet in HTML. See `plan-archive.md` Section IX for full design.

> **§LXV–§LXIX — Paul's Mediterranean Journey (Nodes 91–96):** Six story nodes (PL/EF2/AE/KR/ML/ST) in the extended east grid, connected via seven junction nodes (J8/SEA/J9–J14, nodes 97–104). Entry via Lystra (LT, Node 90) south to J8 then SEA. PL (Philippi) branches west off SEA; EF2 (Ephesus) branches east — both dead-ends. AE (Athens), KR (Corinth), and ML (Malta) each dead-end east of their respective junction node; ST (Rome) is the chain terminal south of J14. Malta has no skill roll — the crowd simply reverses. NODE_COORDS: col c:52–c:60, rows r:25–r:41 (extended east).

> **§SIREN-01 — Littoral Courts (Nodes 111–120):** Ten-node sequential ocean arc in the extended south-west grid. Entry via DS east probe (DS at r:25,c:10; LJ0 at r:25,c:14 — 4 cells east, within probe limit). Chain runs south at c:14 from LJ0 (r:25) to LCA (r:41) in 2-row steps; LSO branches east at (r:37,c:18). Three sea-battle junctions (LJ1/LJ2/LJ3) alternate with four port-courts (LC1/LC2/LC3/LC4). LJ3 fires a storyRender navigator-trigger on first visit. LCA is the arc terminal with a three-variant betrayal-count arc-close. LSO is the Overseer dead-end (WIS DC 15, Succubus/Incubus telepathic bond mechanic). Betrayal flags: `betrayalThought` (LC1 fail), `betrayalWord` (LC2 fail), `betrayalDeed` (LC3 fail). All nodes Act IV.

---

## NODE NETWORK — Travel Connections

*Connections are derived at runtime from `CELL_GRID` grid adjacency — not stored as edge fields. This table documents the canonical story connections for reference. Directions reflect geographic movement on the cell grid.*

> **§CELL-01 + §CELL-13 note:** All N/E/S/W, SW, spire, and portal edge fields were stripped from `NODE_MAP`. All exits below are derived from (r,c) proximity — no stored edge data exists. DS→ED and HC→EK are co-located grid neighbors.

```
BIRKA CLUSTER (Acts I–II)
  DF(72) ──S──> SL(51)
  DF(72) ──E──> HM(73)   [dead-end]
  DF(72) ──W──> GL(74)   [dead-end]
  SL(51) ──N──> DF(72)
  SL(51) ──S──> CI(01)
  CI(01) ──N──> SL(51)
  CI(01) ──E──> IN(02)
  CI(01) ──S──> CR(05)
  CI(01) ──W──> J1(43)   [Midlands Road Fork corridor]
  IN(02) ──S──> TV(03)
  TV(03) ──S──> BA(04)
  CR(05) ──S──> CY(06)
  CY(06) ──SW─> DK(07)   [exit Birka, head to Tilbury]

SALTWICK CLUSTER (Act II)
  DK(07) ──E──> MQ(08)
  MQ(08) ──E──> SF(09)
  DK(07) ──E──> MS(10)   [ship, offshore]
  DK(07) ──S──> AL(11)   [Visby approach]
  DK(07) ──W──> OC(18)   [sea route, needs ship]

ISLAND INTERIOR (Act III)
  CI(01) ──W──> J1(43) ──W──> MI(12)   [Midlands Road Fork corridor]
  MI(12) ──W──> J6(48) ──W──> FO(13)   [Western Wilds Crossroads corridor]
  MI(12) ──N──> HL(14)   [highlands branch, adjacent]
  J6(48) ──N──> MT(50)   [Mountain Pass dead-end, Hunting Ground only]
  J6(48) ──S──> YL(75) ──S──> YC(76)   [Yugurt Lake cluster — fishing dead-end]
  FO(13) ──S──> SW(15)
  SW(15) ──E──> HS(16)
  HL(14) ──N──> SQ(35)   [Weimar approach from west]
  HS(16) ──S──> J3(45) ──S──> BE(17)   [Coastal Fork corridor]

HIGHSPIRE CLUSTER (Acts III/VI)
  SQ(35) ──N──> AR(41)   [arctic above mountains]
  SQ(35) ──E──> BQ(34)
  BQ(34) ──E──> OU(36)
  OU(36) ────> GA(37)   [adjacent cells — walk east]
  BQ(34) ──S──> JU(33)   [approach from south, jungle side]

SEA CIRCUIT (Act IV)
  BE(17) ──W──> OC(18)   [Draketide's ship]
  OC(18) ──W──> IS(19)
  IS(19) ──S──> AT(20)   [dive to Atlantis]
  OC(18) ──S──> DS(23)   [deep sea trench]
  BE(17) ──W──> SC(21)   [sea cavern entrance, ground level]
  SC(21) ──N──> FL(22)   [inland river/lake]
  FL(22) ──N──> JU(33)   [jungle, inland route]
  DS(23) ──E──> J4(46) ──E──> SE(24)   [Deep Road Split corridor]

ASHCRAG CLUSTER (Act V)
  AL(11) ──S──> SE(24)
  SE(24) ──E──> BK(25)   [Broken Tooth Tavern]
  BK(25) ──E──> GC(26)   [goblin warrens]
  GC(26) ──E──> PC(27)   [pirate cave]
  GC(26) ──S──> MC(28)   [monster cave]
  MC(28) ──E──> CA(29)   [catacombs]
  CA(29) ──E──> VC(30)   [vampire castle]
  VC(30) ──E──> DE(31)   [desert road east]

DESERT CIRCUIT (Act VI)
  DE(31) ──E──> DC(32)   [caravan intercept]
  DC(32) ──N──> JU(33)   [jungle approach north toward Weimar]
  JU(33) ──E──> J2(44) ──E──> DE(31)   [Southern Road Cross corridor]

MYTHIC CIRCUIT (Act VII)
  GA(37) ──N──> KT(38)   [Camelot road]
  KT(38) ──E──> OP(39)   [Oriental Palace]
  OP(39) ──N──> J7(49) ──N──> HC(40)   [Sky Gate Spur corridor]
  HC(40) ──W──> J5(47) ──W──> AR(41)   [Arctic Overpass corridor]
  HC(40) ──N──> CO(42)   [sky road to Cosmic Realm, adjacent]
  AR(41) ──S──> SQ(35)   [arctic overland south to Weimar approach]

FINAL (Act VIII)
  CO(42) ──*──> [VICTORY]  [* = Codex reforged, game end]

EPIC BATTLEGROUNDS (Layer 39 — Dead-ends, no exits)
  FO(13) ──W──> EF(52)   [Thornwood Maw — WW override, deep forest]
  HL(14) ──E──> EH(53)   [Loch of the Drowned King]
  SW(15) ──W──> ES(54)   [Sunken Altar — WW override, black water west]
  HS(16) ──S──> EW(55)   [Hag Mother's Cradle]
  BE(17) ──E──> EB(56)   [Wreck of the Unbroken]
  DS(23) ──S──> EO(57)   [Leviathan's Eye — WW override, abyssal trench]
  IS(19) ──E──> EI(58)   [Isle of the Wyrm Crown — WW override, eastern sea]
  AT(20) ──S──> EA(59)   [Abyssal Scriptorium — WW override, below Atlantis]
  SC(21) ──W──> EC(60)   [Scholar Kings' Forge — WW override, underwater cave]
  FL(22) ──E──> EL(61)   [Sunken God's Throne]
  DS(23) ──SW─> ED(62)   [Trench Titan — WW override, hadal zone]
  MI(12) ──N──> EM(63)   [Noonwraith Queen's Field — WW override]
  DE(31) ──S──> EE(64)   [Pharaoh's Vault]
  DC(32) ──E──> EV(65)   [Djinn Lord's Palace]
  JU(33) ──E──> EJ(66)   [Canopy Cathedral]
  MT(50) ──E──> ET(67)   [Peak of the Eldest — WW override, above treeline]
  AR(41) ──N──> ER(68)   [Frost Warden's Throne — WW override, frozen waste]
  HC(40) ──W──> EK(69)   [Shattered Seraph's Spire — WW override, sky-adjacent; note: EK sits at C16, HC at C17]
  PC(27) ──S──> EP(70)   [Admiral's Last Cove — WW override, tidal cave]
  GC(26) ──SE─> EG(71)   [Void Shaman's Sanctum]

PAUL'S MEDITERRANEAN JOURNEY (§LXV–§LXIX — extended east, Act IV)
  LT(90) ──S──> J8(98) ──S──> SEA(97)   [Lystra south → Inner Sea hub]
  SEA(97) ──W──> PL(91)   [Philippi — dead-end]
  SEA(97) ──E──> EF2(94)  [Ephesus — dead-end]
  SEA(97) ──S──> J9(99) ──S──> J10(100)
  J10(100) ──E──> AE(92)  [Athens — dead-end]
  J10(100) ──S──> J11(101) ──S──> J12(102)
  J12(102) ──E──> KR(93)  [Corinth — dead-end]
  J12(102) ──S──> J13(103) ──S──> J14(104)
  J14(104) ──E──> ML(95)  [Malta — dead-end]
  J14(104) ──S──> ST(96)  [Rome — terminal; commission end]

LITTORAL COURTS (§SIREN-01 — extended south from DS, Act IV)
  DS(23) ──E──> LJ0(111)  [Deep Sea Trench east probe; arc entry]
  LJ0(111) ──S──> LC1(112) ──S──> LJ1(113) ──S──> LC2(114)
  LC2(114) ──S──> LJ2(115) ──S──> LC3(116) ──S──> LJ3(117)
  LJ3(117) ──E──> LSO(120)  [The Fog Bank — Overseer encounter; dead-end]
  LJ3(117) ──S──> LC4(118) ──S──> LCA(119)  [Southern Anchorage — arc terminal]
```

---

## COORDINATE INDEX — Alphabetical by Code

| Code | Node | Row | Col | Connects To |
|------|------|-----|-----|-------------|
| AL | 11 | R09 | C15 | DK(N), SE(S) |
| AR | 41 | R02 | C03 | SQ(S), J5(E), ER(N) |
| AT | 20 | R14 | C02 | IS(N), DS(E), EA(S) |
| BA | 04 | R06 | C18 | TV(N), CR(SW) |
| BE | 17 | R12 | C02 | J3(N), SC(W), OC(S), EB(E) |
| BK | 25 | R10 | C14 | SE(W), GC(E) |
| BQ | 34 | R03 | C04 | SQ(W), OU(E), JU(S) |
| CA | 29 | R10 | C12 | MC(W), VC(E) |
| SL | 51 | R04 | C16 | CI(S), DF(N), CQ(E) ⚠️ PLANNED |
| CI | 01 | R05 | C16 | SL(N), IN(E), CR(S), J1(W) |
| CQ | 77 | R04 | C17 | SL(W) only ⚠️ PLANNED — Layer 46 |
| RD | 78 | R09 | C14 | Act III road corridor (N/S) ⚠️ PLANNED — Layer 61 |
| CO | 42 | R01 | C18 | CI(S) |
| CR | 05 | R07 | C15 | CI(N), CY(S) |
| CY | 06 | R07 | C16 | CR(N), DK(S) |
| DC | 32 | R10 | C07 | DE(W), JU(N), EV(E) |
| DE | 31 | R10 | C05 | VC(W), DC(E), EE(S) |
| DF | 72 | R03 | C16 | SL(S), HM(E), GL(W) |
| DK | 07 | R08 | C15 | CY(N), MQ(E), AL(S), OC(W) |
| DS | 23 | R14 | C04 | AT(W), LJ0(E), EO(S), ED(SW) — east probe now reaches LJ0(111) |
| FL | 22 | R11 | C02 | JU(N), SC(S), EL(E) |
| FO | 13 | R05 | C03 | HL(N), J6(E), SW(S), EF(W) |
| GA | 37 | R03 | C20 | OU(W), KT(N) |
| GC | 26 | R10 | C15 | BK(W), PC(E), MC(S), EG(SE) |
| GL | 74 | R03 | C15 | DF(E) only |
| HC | 40 | R01 | C17 | CO(N), KT(S), J7(E), J5(W), EK(W) |
| HL | 14 | R04 | C03 | SQ(N), FO(S), EH(E) |
| HM | 73 | R03 | C17 | DF(W) only |
| HS | 16 | R07 | C03 | SW(N), J3(S), EW(S) |
| IN | 02 | R05 | C17 | CI(W), TV(S) |
| IS | 19 | R13 | C03 | OC(W), AT(S), EI(E) |
| JU | 33 | R10 | C02 | FL(S), J2(E), BQ(N), EJ(E) |
| KT | 38 | R02 | C21 | GA(S), OP(E) |
| MC | 28 | R11 | C12 | GC(N), CA(E) |
| MI | 12 | R05 | C08 | J6(W), J1(E), HL(N), EM(N) |
| MQ | 08 | R08 | C16 | DK(W), SF(E) |
| MS | 10 | R08 | C19 | DK(W) |
| MT | 50 | R04 | C05 | J6(S), ET(E) |
| OC | 18 | R13 | C01 | DK(E), IS(E), DS(S) |
| OP | 39 | R02 | C23 | KT(W), J7(N) |
| OU | 36 | R03 | C05 | BQ(W), GA(E) |
| PC | 27 | R10 | C16 | GC(W), EP(S) |
| SC | 21 | R12 | C01 | FL(N), BE(E), OC(S), EC(W) |
| SE | 24 | R10 | C13 | AL(N), BK(E), J4(W) |
| SF | 09 | R08 | C17 | MQ(W) |
| SQ | 35 | R03 | C03 | AR(N), HL(S), BQ(E) |
| SW | 15 | R06 | C03 | FO(N), HS(S), MI(E), ES(W) |
| TV | 03 | R06 | C17 | IN(N), BA(E) |
| VC | 30 | R11 | C11 | CA(W), DE(E) |
| J1 | 43 | R05 | C12 | CI(E), MI(W) |
| J2 | 44 | R10 | C04 | DE(E), JU(W) |
| J3 | 45 | R09 | C03 | HS(N), BE(S) |
| J4 | 46 | R12 | C08 | SE(E), DS(W) |
| J5 | 47 | R01 | C10 | HC(E), AR(W) |
| J6 | 48 | R05 | C05 | MT(N), YL(S), MI(E), FO(W) |
| YL | 75 | R06 | C05 | J6(N), YC(S) |
| YC | 76 | R07 | C05 | YL(N) only — fishing dead-end |
| J7 | 49 | R01 | C22 | HC(N), OP(E) |
| **EXTENDED AREA NODES** | | | | **NODE_COORDS r,c (off visual map — probe-computed connections)** |
| AE | 92 | r:31 | c:60 | J10(W) only |
| EF2 | 94 | r:27 | c:60 | SEA(W) only |
| KR | 93 | r:35 | c:60 | J12(W) only |
| LC1 | 112 | r:27 | c:14 | LJ0(N), LJ1(S) |
| LC2 | 114 | r:31 | c:14 | LJ1(N), LJ2(S) |
| LC3 | 116 | r:35 | c:14 | LJ2(N), LJ3(S) |
| LC4 | 118 | r:39 | c:14 | LJ3(N), LCA(S) |
| LCA | 119 | r:41 | c:14 | LC4(N) only — arc terminal |
| LJ0 | 111 | r:25 | c:14 | DS(W→E probe), LC1(S) |
| LJ1 | 113 | r:29 | c:14 | LC1(N), LC2(S) |
| LJ2 | 115 | r:33 | c:14 | LC2(N), LC3(S) |
| LJ3 | 117 | r:37 | c:14 | LC3(N), LC4(S), LSO(E) |
| LSO | 120 | r:37 | c:18 | LJ3(W) only — Overseer dead-end |
| ML | 95 | r:39 | c:60 | J14(W) only |
| PL | 91 | r:27 | c:52 | SEA(E) only |
| ST | 96 | r:41 | c:56 | J14(N) only — arc terminal |
| **EPIC BATTLEGROUNDS** | | | | **dead-end: one connection only** |
| EA | 59 | R15 | C02 | AT(N) only *(WW override)* |
| EB | 56 | R12 | C03 | BE(W) only |
| EC | 60 | R11 | C01 | SC(E) only *(WW override)* |
| ED | 62 | R15 | C03 | DS(NE) only *(WW override)* |
| EE | 64 | R11 | C05 | DE(N) only |
| EF | 52 | R05 | C02 | FO(E) only *(WW override)* |
| EG | 71 | R11 | C14 | GC(NW) only |
| EH | 53 | R04 | C04 | HL(W) only |
| EI | 58 | R13 | C04 | IS(W) only *(WW override)* |
| EJ | 66 | R10 | C03 | JU(W) only |
| EK | 69 | R01 | C16 | HC(E) only *(WW override)* |
| EL | 61 | R11 | C03 | FL(W) only |
| EM | 63 | R04 | C08 | MI(S) only *(WW override)* |
| EO | 57 | R15 | C04 | DS(N) only *(WW override)* |
| EP | 70 | R11 | C16 | PC(N) only *(WW override)* |
| ER | 68 | R01 | C03 | AR(S) only *(WW override)* |
| ES | 54 | R06 | C02 | SW(E) only *(WW override)* |
| ET | 67 | R04 | C06 | MT(W) only *(WW override)* |
| EV | 65 | R10 | C08 | DC(W) only |
| EW | 55 | R08 | C03 | HS(N) only |

---

## SLEEP NODES (Inn Beats)

| Night | Code | Location | Cost |
|-------|------|----------|------|
| 1 | IN | Birka inn (Node 2) | 5gp |
| 2 | MS | Ship berth (Node 10) | 3gp |
| 3 | HS | Crone's moss pile (Node 16) | free |
| 4 | FL | River trader's boat (Node 22) | 5gp or free |
| 5 | PC | Pirate hammock (Node 27) | 3gp |
| 6 | VC | Vampire guest room (Node 30) | free |
| 7 | BQ | Blacksmith bunkroom (Node 34) | 4gp |
| 8 | SQ | Observatory guest room (Node 35) | free |

---

## GATE LOCKS — ❌ REMOVED (Free-Movement Policy)

> **The `GATE_LOCKS` array and all item-gated passage checks are gone from the code** (verified 2026-07-03: `GATE_LOCKS` greps to 0 in `roll2hit-v3.html`; `cellMove` is a thin `Mover.move` caller with no gate branch). Movement is refused for exactly two reasons — `'oob'` and `'sea'` — per the Free-Movement / Mission-Gating Policy (CONTRIBUTING.md). The old CR→CY / SC→FL / AL→SE / VC→DE item gates and the CO shard gate no longer block *movement*; story gating happens at the *mission-listing* level only (quest `gate` / `activateCond` in `storyCheckQuests`).

---

## NODE_COORDS — Grid Placement Rules

Every node that should appear on the map canvas must have an entry in `NODE_COORDS`. The coordinate system is a flat integer grid: `r` = row (north → south, increasing), `c` = column (west → east, increasing).

### Hard constraints (enforced by WBAPI audit)

| rule | requirement |
|------|-------------|
| **Unique cell** | No two nodes may share the same `(r, c)` — `CELL_GRID` is a one-to-one mapping. |
| **No stored edge fields** | All direction fields (`N`, `S`, `E`, `W`, `SW`, `spire`, `portal`) stripped in §CELL-01 + §CELL-13. Exits are derived from grid adjacency at runtime only — do not add any. |
| **Axis alignment** | Two adjacent nodes should share the same column (N/S neighbors) or row (E/W neighbors) for minimap wire-glyph correctness. Off-axis pairs are passable but render without connecting glyphs. |
| **No junction intermediaries** | `cellMove` walks any gap freely — intermediate junction nodes are no longer required. The auto-generated J##### nodes were removed in §CELL-05. Named J1–J7 roadside nodes are retained as story locations. |

### Grid layout API

Use the WBAPI layout tools to validate or recompute coordinates:

```bash
# Audit current violations
curl "http://localhost:1367/api/audit/map?format=text"

# Solve a clean BFS layout (step=4 keeps all links ≤4 cells)
curl "http://localhost:1367/api/layout/solve?step=4&root=TLS" > layout.json

# Inspect: how many alignment/distance problems?
cat layout.json | jq '.validation'

# Apply the proposed layout
cat layout.json | jq '{coords: .proposed}' | \
  curl -XPOST http://localhost:1367/api/layout/apply \
    -H 'Content-Type: application/json' -d @-

# Fix individual coordinate
curl -XPUT http://localhost:1367/api/coords/BEL \
  -H 'Content-Type: application/json' -d '{"r":68,"c":80}'
```

### Audit rules for coordinates

| check | severity | description |
|-------|----------|-------------|
| `alignment` | warning | grid neighbors do not share a row or column |
| `axis_distance` | warning | axis-aligned neighbors are >4 cells apart |
| `long_link` | suggestion | Euclidean distance >4 — catches off-axis diagonal neighbors |
| `missing_coords` | suggestion | node exists in NODE_MAP but has no NODE_COORDS entry |

Run `POST /api/audit/map/fix` to auto-fix diagonal exits and one-way links. Coordinate positioning (alignment, axis_distance) must be corrected manually or via the layout solver.

---

## CELL GRID (§CELL-02, ✅ active)

The primary navigation data structure is `CELL_GRID` — a reverse lookup from grid coordinates to node code:

```js
// "r,c" → node code  (e.g. "5,16" → "CI")
const CELL_GRID = (() => {
  const g = {};
  for (const code of Object.keys(NODE_MAP)) {
    const coord = NODE_COORDS[code] || { r: NODE_MAP[code].r, c: NODE_MAP[code].c };
    if (coord && coord.r != null && coord.c != null)
      g[`${coord.r},${coord.c}`] = code;
  }
  return g;
})();
```

`cellMove(dir)` (§CELL-03) moves the player exactly one grid cell per keypress and uses `CELL_GRID` to find the destination. Open cells (no entry in `CELL_GRID`) are handled by `_enterEmptyCell()` (§CELL-04). Since §WALK-2, bounds/wrap/sea decisions live in the shared `mover.js` kernel — `cellMove` is a thin caller.

## ROAD NET & ROOM LAYER (§NAV-01, ✅ 2026-07-03)

> Full design + diagnosis: `lab-reports/lab-report-nav01-navigable-world.md`. Layer stack: `docs/notes/docs-node-network.md §13`.

### ROAD_RUNS — the fungal road net

`ROAD_RUNS` (game file, after `SEA_LANES`) is an RLE block `{row:[[c0,c1],…]}` exactly like `SEA_RUNS`; it builds the `ROAD_CELLS` Set at load. Shipped net: **400 road cells (1.4% of passable), 88 intersections/T-junctions**, connecting all 235 settlement cells in one component (verified by `check:roads` R1–R4 inside `npm run check:walk`).

- **Roads are terrain, not permissions** (Free-Movement, CONTRIBUTING.md): a road cell resolves to terrain `'road'` with **encounter rate 0** — a safe, legible highway. The open field stays fully walkable; roads are sugar, never required.
- Terrain precedence (client `_inferTerrain` + server `terrainAt`, parity-checked): `SEA_LANES → 'ocean'` ▸ `ROAD_CELLS → 'road'` ▸ majority-of-named-neighbors ▸ `'midlands'`. Sea-lanes stay `ocean` — crossings keep their 0.10 encounter risk as texture.
- Generated deterministically by `scripts/build-roads.js` (k-nearest ≤3 + MST + local loops ≤8; trunk-reuse Dijkstra costs settlement 2 / road 4 / virgin 10 / lane 14). **Never hand-edit ROAD_RUNS** — regenerate via ♻ Reweave (`PUT /api/roads` or `./api.sh reweave`); a red `check:roads` rolls the game file back automatically.
- User-authored net edits live in `roads-pins.json` `{pins, links, locked}` — pins are mandatory road vertices; `locked` city codes are never moved by geo-seed. Edited visually in worldbuilder.html (§NAV-01g/h): drag-&-lock cities, vertex drag → pin, ✚/┬ junction palette, 🔗 link toggle, 🗑 delete, ♻ Reweave Net.

### Room layer — every cell is a room

`describeCell(world, {r,c})` (ROOMS:CORE — `rooms.js`, inlined byte-identically into the HTML, `check:roomsparity`) returns `{icon, title, sub, prose, exits, signposts}`:

- **Deterministic prose** — 3–5 variants per terrain keyed by `hash(r,c)`, no `Math.random`; identical text single-player and on the MUD server (all four `session/*` look surfaces carry `room` via the shared `buildLook`; mud-harness section [M] asserts byte-equality).
- **Signage** — road cells name the next settlement along the road in each road direction (`E→ road — toward Visby (4)`); every empty cell lists nearest landmarks within BFS radius 12; region name replaces the old raw `Row r, Col c`.
- Rendered by `_enterEmptyCell` (🪧 signpost lines under the prose) and by the exits panel.

### Auto-travel & wayfinding

- **WP button = travel loop** (§NAV-01d): road-weighted `_roadGridPath` Dijkstra (road/lane cost 1 vs 2), ~120 ms/step; halts on encounter roll (`_encounterQueued`), arrival, any user input, or block. **Shift+WP** = single step. Quest "📍 Navigate →" (`storySetWaypoint`) starts travel.
- **Waypoint ★** drawn on the minimap and both world canvases (edge-of-window direction arrow when off-screen); journal + Navigate button show `(n steps, NE)` readouts.
- All routing originates from the **player's actual cell** (`_playerPos()`), never `NODE_COORDS[currentCode]`, with geo bounds `0≤r<90` and E/W wrap.

### Map surfaces (current census)

| Surface | Size | Roads | Waypoint ★ |
|---------|------|-------|------------|
| HUD minimap | 11×17 viewport | ✅ glyphs | ✅ (edge arrow off-screen) |
| Map tab | 15×21 + amenity icons | ✅ | ✅ |
| WORLD canvas | full world, gold viewport traces | ✅ | ✅ |
| GLOBE panel | entire world, story bottom bar | ✅ | — |

## CIRCUIT CORRIDORS (Layer 9) — ⚠️ SUPERSEDED for navigation

> The corridor travel system (`storyCorridorTravel`, Manhattan-distance gating, Hunt/Warp overlay) is **no longer the active navigation path**. `cellMove` replaced it in §CELL-03. The corridor infrastructure (`storyMove_LEGACY`, `buildCorridorMap`, `_buildNodeExits`, `CORRIDOR_CELLS`, `CORRIDOR_TERRAIN`, overlay HTML/CSS) was **fully removed in §CELL-05/§CELL-11A**.

Wire-glyph minimap rendering (`CORRIDOR_CELLS`) was removed in §CELL-05. `_renderMapGrid()` now renders plain node cells without wire overlays.

- **Junction nodes (J1–J7 + thousands of J##### auto-generated nodes):** to be bulk-deleted in §CELL-05
- **Active path highlight:** `_setActivePath()` still marks the last-traversed edge gold on the minimap; called by `cellMove`

See `docs/spec/spec-corridors.md` for the full historical spec.

---

## FOUR TOWNS ON THE MAP

| Town | Primary Node | Code | Grid | Role |
|------|-------------|------|------|------|
| Birka (Metropolis) | city | CI | R05,C16 | Story start, Auros, finale |
| Tilbury (Merchant) | docks | DK | R08,C15 | Magistra Muffat, Shard #1 |
| Visby (Enemy) | bar | BK | R10,C14 | Warlord Mordus, Shard #4 |
| Weimar (Scholar) | scholars_qtr | SQ | R03,C03 | Sweelinck, Shard #7 |

---

## NAVIGATION ENGINE — Function Reference (F1 Coverage)

> **Source of truth:** `roll2hit-v3.html`. This section documents all functions that read or write map/navigation state. Every function listed here is covered by at least one flowchart below.
>
> **CS architecture note:** `NODE_MAP` is a flat plain object keyed by node code — O(1) lookup. `CELL_GRID` is a sparse object keyed by `"r,c"` string — O(1) reverse lookup. `NODE_COORDS` is a flat object keyed by code — O(1). Navigation is a synchronous MUD-style state machine: one cell at a time, no concurrency, no stored edge data. `cellMove(dir)` is fully synchronous; the only async element is the `setTimeout` in `_enterEmptyCell` that delays encounter start by 300ms.

---

### FL1 — Story Navigation (Core Game Loop)

**Entry point:** Player clicks a d-pad direction button (or presses arrow key / WASD).

```
MILEPOINT A  Player clicks N/E/S/W → cellMove(dir) called
             (if auto-travel is running and this isn't the travel loop's own step → _travelStop)
MILEPOINT B  Mover.move(_moverWorld(), {r,c}, dir) — the shared mover.js kernel decides:
             band bounds (0 ≤ r < 90), E/W wrap at the antimeridian, sea/impassable check.
             Refusal reasons are exactly 'oob' | 'sea' — NO gate locks, NO quest checks
             (Free-Movement Policy, CONTRIBUTING.md)
             └─ blocked → storyBlock('No path leads that way.')
MILEPOINT C  S_story.playerR/playerC updated; visitedCells["r,c"] = true (timeless — no clock advance)
MILEPOINT D  destCode = res.destCodes[0]
             ├─ named node → _setActivePath(); currentCode = destCode; storyRender(node)
             └─ empty cell → _enterEmptyCell(nr, nc)  (currentCode unchanged; routing uses _playerPos())
MILEPOINT E  mpBeacon() — fire-and-forget presence beacon (no-op unless 🌐 connected)
```

**No special exits (§CELL-13, re-applied 2026-07-03):** Portal (`storyPortal`), transmort scroll (`storyUseTransmort`), hearth home, and the spire special-exit block are removed. The §CELL-13 removal had been partially reverted by a snapshot rollback; it was re-applied and grep-verified 2026-07-03 (user directive: jump travel must not be present). All travel is `cellMove` one step at a time; `checkpointNode` (death respawn) is the only warp.

---

### FL9 — Empty Cell Encounter

**Entry point:** Player steps onto a cell with no named node.

```
MILEPOINT A  cellMove() → _enterEmptyCell(nr, nc) called
MILEPOINT B  describeCell(_roomWorld(), {r,c}) — §NAV-01c room layer:
             deterministic terrain prose, region-name title, 🪧 road signage toward the
             next settlement, nearest-landmark line (replaces the old raw "Row r, Col c")
             (terrain precedence inside: SEA_LANES→ocean ▸ ROAD_CELLS→road ▸ neighbors ▸ midlands)
MILEPOINT C  Render room into the shared node shell; travel status strip if auto-travelling
MILEPOINT D  Roll random() vs TERRAIN_ENCOUNTER_RATE[room.terrain]   (road = 0 — safe highway)
             ├─ no encounter → panel stays
             └─ encounter → _weightedMonsterPick(terrain); _encounterQueued = true (halts travel)
                           → setTimeout 300ms → _startStoryBattle(monster, ...)
MILEPOINT E  _renderMiniMap() + _renderWorldMiniMap() + _renderGlobeMap() + _updateExitLinks()
```

*(§TIMELESS-01: the old Hunt/Stalk path — `storyQuickWait()`, `storyStalk()`, and the Hunt/Warp `#story-corridor-overlay` — was removed. Empty-cell movement now rolls a single `TERRAIN_ENCOUNTER_RATE` encounter, exactly as FL9 above.)*

---

### FL12 — Waypoint Auto-Travel (§NAV-01d/e)

**Entry point:** Player sets a waypoint (map overlay click or quest "📍 Navigate →"), then clicks WP.

```
MILEPOINT A  storySetWaypoint(nodeCode) — sets S_story.waypoint, starts auto-travel,
             draws the waypoint ★ (minimap + world canvases; edge arrow when off-screen)
MILEPOINT B  WP click → storyWaypoint(): toggle the travel loop (Shift+WP = single step)
MILEPOINT C  _roadGridPath(_playerPos(), waypoint) — road-weighted Dijkstra
             (road/lane cost 1, open land 2; geo bounds 0≤r<90, E/W wrap)
MILEPOINT D  _travelTick() — one cellMove per ~120 ms along the route; halts on:
             encounter roll (_encounterQueued) · arrival · any user input · blocked step
MILEPOINT E  Journal + Navigate button show "(n steps, NE)"; ★ clears on arrival
```

**Routing origin (§NAV-01a):** all routing starts from `_playerPos()` — the player's actual cell — never `NODE_COORDS[currentCode]`; correct for the entire wilderness leg where `currentCode` still points at the last named node. `_bfsGridPath`/`_bfsGridDir` use kernel-identical passability (band clamp + antimeridian wrap), not the pre-§WALK 500×500 bounds.

---

### F1 Function Reference Table

| Function | Purpose | Key Data Read | Key Data Written |
|----------|---------|---------------|-----------------|
| `cellMove(dir)` | **Primary movement handler** — thin caller over `Mover.move` (mover.js kernel: band bounds, E/W wrap, sea); halts auto-travel on user input; no gate checks | mover world (`CELL_GRID`, `IMPASSABLE_CELLS`), `NODE_MAP` | `S_story.playerR/playerC`, `visitedCells`, `currentCode` |
| `_enterEmptyCell(r,c)` | Renders the §NAV-01c room (`describeCell`: prose, signposts, region title); rolls encounter; refreshes all map panels | `ROAD_CELLS`, `SEA_LANES`, `WORLD_DB`, `TERRAIN_ENCOUNTER_RATE` | DOM; `_encounterQueued`; may trigger battle |
| `describeCell(world,pos)` | **ROOMS:CORE kernel** (`rooms.js`, inlined byte-identically; also served by MUD `session/*`) — deterministic room object `{icon,title,sub,prose,exits,signposts}` | road/sea sets, `CELL_GRID`, `NODE_MAP` | none (pure function) |
| `_inferTerrain(r,c)` | Terrain precedence: `SEA_LANES→ocean` ▸ `ROAD_CELLS→road` ▸ majority-of-named-neighbors ▸ `midlands` | `SEA_LANES`, `ROAD_CELLS`, `CELL_GRID`, `NODE_MAP` | none (pure function) |
| `_playerPos()` | `{r,c}` routing origin — the player's actual cell, never `NODE_COORDS[currentCode]` | `S_story.playerR/playerC` | none (pure function) |
| `_roadGridPath(from,toCode)` | Road-weighted Dijkstra (road/lane cost 1, open land 2) for auto-travel | `ROAD_CELLS`, `SEA_LANES`, `IMPASSABLE_CELLS` | none (pure function) |
| `_travelTick()` | Auto-travel loop — one `cellMove` per ~120 ms; halts on encounter/arrival/input/block | travel state, `_encounterQueued` | `S_story.playerR/playerC` (via cellMove) |
| `storyWaypoint()` | WP button — start/stop auto-travel along `_roadGridPath` (Shift+WP = single step) | `S_story.waypoint` | travel state; `S_story.waypoint` (clears on arrival) |
| `storySetWaypoint(nodeCode)` | Sets waypoint target, starts travel, draws waypoint ★ | `NODE_MAP` | `S_story.waypoint` |
| `_setActivePath(from,to,dir)` | Records last-traversed edge for minimap gold highlight | `NODE_COORDS` | `S_story.lastCorridorCells`, `lastExitDir`, `lastExitCode` |
| `_updateWaypointBtn()` | Refreshes waypoint button label and state | `S_story.waypoint` | DOM only |
| `storyMapToggle()` | Opens/closes map overlay panel | DOM state | DOM only |
| `_renderMapGrid()` | Renders 11×11 node grid in map overlay; click handler uses actual `playerR/C` for adjacency check | `NODE_MAP`, `NODE_COORDS`, `CELL_GRID`, `S_story.playerR/playerC` | DOM only |
| `_renderMiniMap()` | Renders compact inline minimap in node panel | `NODE_MAP`, `NODE_COORDS` | DOM only |
| `_renderWorldMiniMap()` | Renders world-level minimap with warmth tint | `NODE_MAP`, `S_story.actNumber` | DOM only |
| `_renderFinalMap()` | End-game map render at CO victory sequence | `NODE_MAP`, full S_story | DOM only |
| `_mapIcon(code)` | Returns glyph character for a node code | `NODE_MAP[code].name` | none (pure function) |
| `_mapAddExits(cell,code,overrideR?,overrideC?)` | Adds directional exit arrows to a map cell; uses `overrideR/C` when player is on empty cell, else `NODE_COORDS[code]` | `CELL_GRID`, `NODE_COORDS` | DOM only |
| `_updateExitLinks()` | Refreshes d-pad direction buttons for current node | `NODE_MAP[currentCode]` | DOM only |
| `_storyFindTerrainNode(terrain)` | Finds nearest node of given terrain type by Manhattan distance | `NODE_MAP`, `NODE_COORDS` | none (pure function) |
| `_getYaelLocation()` | Returns Yael's current patrol node code | `S_story.npcFavorability`, `S_story.currentCode` | none (pure function) |

---

### Map Data Structure Summary

| Constant | Type | Shape | Purpose |
|----------|------|-------|---------|
| `NODE_MAP` | plain object | `{code: {num,name,label,act,text,npc,battle,loot,sleep,...}}` | 422 named nodes; all N/S/E/W/portal/spire fields stripped (§CELL-01 + §CELL-13) — exits derived from CELL_GRID adjacency only |
| `NODE_COORDS` | plain object | `{code: {r,c}}` | Grid position for each node; drives CELL_GRID and map render. **Grid rules:** adjacent nodes should share the same row or column and be ≤ 4 cells apart. Junction intermediaries no longer needed. |
| `CELL_GRID` | plain object (computed) | `{"r,c": code}` | Reverse lookup: grid coordinate → node code; built at startup from NODE_COORDS |
| `ROAD_RUNS` / `ROAD_CELLS` | RLE object / computed Set | `{row:[[c0,c1],…]}` / `"r,c"` keys | §NAV-01b fungal road net (400 cells, 88 junctions) — terrain `'road'`, encounter rate 0. Regenerate via ♻ Reweave only |
| `SEA_RUNS` → `IMPASSABLE_CELLS` / `SEA_LANES` | RLE / Sets | same RLE shape | §WALK-1.5 sea mask + land-bridge lanes (lanes render as `ocean`, passable) |

*(`GATE_LOCKS` removed — no item-gated passages exist; movement refusals are exactly `'oob'`/`'sea'` per the Free-Movement Policy.)*

*(`HUNTING_GROUNDS` — the `{terrain: {displayName}}` map used by the old stalk/hunt overlays — was removed in §TIMELESS-01.)*

---

### Minimap Warmth Tint & Final Map Render

#### Minimap Warmth Tint (Layer 44, L44-G)

`_renderWorldMiniMap()` colors each visited node cell using `_getNodeMapColor(code)`. This is the warmth tint system added in Layer 44.

```js
// L44-G inside _renderWorldMiniMap()
const warmColor = _getNodeMapColor(code);
if (warmColor !== '#555') cell.style.background = warmColor;
```

- `#555` is the neutral/unvisited fallback — no tint applied
- Any other return value from `_getNodeMapColor` is applied directly as `cell.style.background`
- `_getNodeMapColor` reads `S_story` completion flags for the node and returns a hex color representing player progress (warm = completed, cool = visited-only, neutral = unvisited)
- The tint is re-applied every time the minimap re-renders (on every node move)

#### `_renderFinalMap()` (Layer 44)

Called from `storyCheckVictory()` (line 11229) when the player completes the Citadel Omega victory condition.

Behavior sequence:

| Time | Action |
|------|--------|
| 0 ms | Function called; simplified warmth grid built from `NODE_COORDS` |
| 3100 ms | Warmth grid fades in |
| 3100–8100 ms | Grid displayed for 5 seconds |
| 8100 ms | Grid fades out over 1500 ms |

- Uses `NODE_COORDS` for grid layout (same coordinate system as `_renderMapGrid()`)
- Applies the same warmth-tint color logic as `_renderWorldMiniMap()` — a final snapshot of the player's world coverage
- Rendered into the victory sequence overlay, not the standard map panel
- No interaction; display-only

**⚠️ PLANNED — S55 Map Caption (plan-archive.md §XXXI, Layer 66b):** A `<div id="final-map-caption">` is added to the overlay, centered below the warmth grid. Fades in at +400 ms after the grid (3500 ms total); fades out with the grid at 8100 ms. Text:

| Condition | Caption |
|-----------|---------|
| Base (always) | *"He walked every corridor. So did you. The map remembers."* |
| `s49SweelinckDelivered` | *"He walked every corridor. So did you. Sweelinck has the record."* |

Sets `s55MapLineDelivered = true` on render. Style: `color: #bbb; font-style: italic; font-size: 0.9em`.

---

## MULTIPLAYER ON THE MAPS (§MESH-01, ✅ 2026-07-02)

When the player opts in via the 🌐 toggle, other players appear on every map surface — a **display-only** layer (see `mechanics.md` "Multiplayer — Mesh Presence"; server mesh: `docs/notes/docs-node-network.md §12`). Remote players from other servers in the mesh flow through the same surfaces as local ones.

| Surface | Marker | Data source |
|---------|--------|-------------|
| Minimap (11×17 viewport) | ☺ dot on the player's cell | `pos.nearby` (viewport subset) + `player_moved` SSE between own steps |
| "Also here:" strip under `#story-move-msg` | names, cell-scoped | `pos.players` / SSE `player_arrived`/`player_left` |
| WORLD map (full canvas) + GLOBE panel | cyan dot per player, worldwide | `pos.world[]` (all live coords) + worldwide `player_moved` SSE |

- Repaints happen via `MP.remotes` (pid-keyed worldwide track) + `_mpRepaintMaps()` — a watcher's maps update with zero actions of their own.
- `player_moved` is the one **worldwide** SSE event (map dots need global scope); `player_arrived`/`player_left`/`chat` remain strictly cell-scoped (§WALK-5 co-presence property).
- Positions are beacon-validated server-side against the same passability rules as `cellMove` — no ghosts on sea cells or off-band rows.
- During a network split between servers, remote dots freeze at their last known cell (up to 90 s) and snap to true positions when the mesh heals.

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
