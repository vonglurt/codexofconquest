# MAPS — The Shattered Codex
### Island World Grid Map & Node Network Reference

> **Grid system:** Columns C01–C26 (west→east), Rows R01–R16 (north→south). Each cell is a 2-letter code. `WW` = water (ocean, impassable without boat). Sky nodes (CO, HC) float above the island. Mythic-east nodes (GA, KT, OP) are a distant island reached by portal or sky road — their grid position reflects relative east direction, not walking distance. Node connections are governed by the **Node Network** section below, not raw grid adjacency.

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

*Two-letter node codes. `WW` = water. Non-node land cells shown as `..`. Epic Battleground nodes (E*) appear at WW cells only where the terrain has a logical override (deep forest, underwater cave, frozen waste, sky-adjacent spire). Mythic-east nodes shown at far right; reach via portal (OU→GA) or sky road.*

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
| OU | 36 | outhouse | VI | R03,C05 | Observatory outhouse — portal to GA |
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

> **Junction note:** J1–J7 are navigation waypoints with no battle or loot. They appear as `✛` on the map. MT is the only terrain node reachable only via J6.N — it exists purely as a Hunting Ground for the `mountains` terrain. J6 also connects S→YL (Yugurt Lake) — a fishing-only dead-end branch that does not appear on the main quest path.

> **Yugurt Lake cluster note (Nodes 75–76):** YL (Yugurt Lake, R06,C05) and YC (Yugurt Cabin, R07,C05) occupy cells south of J6 at the Western Wilds Crossroads. YL has `isFishingLake:true` — `storyFishing()` triggers here instead of a standard encounter. YC has The Fisherman NPC and a free sleep (sleepCost:0) with a Fishing Rod loot drop. Neither node has a main quest battle or Codex Shard. The Yugurt fish pool (fish_01–fish_20) is documented in `monsters.md` and `lab-report-fish-with-dnd.md`.

> **Epic Battleground note:** E* nodes (EF–EW, Nodes 52–71) are dead-ends with a single deadly-tier boss, no tier picker, no stalk mechanic. They are accessible only from their parent node. WW-override cells represent terrain that is accessible by specific lore (deep forest passage, underwater cave, frozen waste, sky-adjacent spire, tidal cave) but not traversable by normal travel. The `isEpicBattleground:true` flag in NODE_MAP gates the DANGER:EPIC pre-battle overlay and auto-waypoint-return system (Layer 39).

> **Duplicate terrain note:** `BA` = bar, Node 4 (Birka, R06,C18). `BK` = bar (Broken Tooth), Node 25 (Visby, R10,C14). Same terrain type, different nodes and codes. DS(23) has two EB dead-ends: EO (south, Leviathan's Eye) and ED (SW, Trench Titan) — both are separate encounters with separate quest givers.

> **Defi_land cluster note (Nodes 72–74):** DF/HM/GL are three `defi_land` terrain nodes north of SL in the extended Birka Slums district. They occupy R03,C15–C17, cells previously shown as WW. DF (The Unbanked Quarter) is the hub — HM (Frequency Row) hangs off its east, GL (Old Guard's Corner) off its west. Both HM and GL are dead-ends. DF has one story battle (NGMI Swarm ×3 + Rug Spider) and NPC Grimshaw. None of these nodes have a Codex Shard, inn sleep, or vendor.

> **⚠️ PLANNED — Cat Quarter note (Node 77, Layer 46):** CQ (The Cat Quarter) is planned at R04,C17 — one cell east of SL (Birka Slums). It extends the Birka Slums district eastward. CQ will be a `cat_quarter` terrain node with a 6-quest arc (Q-CAT-01 through Q-CAT-06) and the Ally Cat hierarchy (strays → fluffies → beefies → honchos → Taz Devils → Cat-King). Not yet in HTML. See `plan.md` Section IX for full design.

---

## NODE NETWORK — Travel Connections

*Derived from the story. These are the valid moves, not grid adjacency. North/South/East/West labels give movement direction convention for the MUD engine.*

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
  OU(36) ──*──> GA(37)   [* = portal, instant teleport]
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
| DS | 23 | R14 | C04 | AT(N), OC(W), J4(E), EO(S), ED(SW) |
| FL | 22 | R11 | C02 | JU(N), SC(S), EL(E) |
| FO | 13 | R05 | C03 | HL(N), J6(E), SW(S), EF(W) |
| GA | 37 | R03 | C20 | OU(W/portal), KT(N) |
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
| OU | 36 | R03 | C05 | BQ(W), GA(E/portal) |
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

## GATE LOCKS — Item-Gated Passages

Four passages require a specific item in inventory to traverse. The lock is **one-directional**: the reverse passage is always open (you can jump down, but not climb up without the key).

| # | From | To | Direction | Required Item | Blocked Message |
|---|------|----|-----------|--------------:|-----------------|
| 1 | CR (Crypt) | CY (Undercity) | South | Crypt Key | "The lower passage is sealed. You need the Crypt Key to descend." |
| 2 | SC (Sea Cavern) | FL (Freshwater Lake) | North | Sea Cave Key | "The inner passage is blocked. The Crones' Sea Cave Key opens it." |
| 3 | AL (Alley) | SE (Sewers) | South | Conclave Pass | "Checkpoint blocked. Show your Conclave Pass to the scouts." |
| 4 | VC (Vampire Castle) | DE (Desert) | East | Toll Token | "Bruxa Mourne's toll gate. Offer the Toll Token to pass." |

**Shard gate (separate):** Node CO (Node 42, Cosmic Realm) requires all 7 Codex Shards. Attempting to enter without them displays: *"The Codex Cradle remains dark. Seven Shards must be gathered before the Void can be sealed."*

**One-way note:** These gates create asymmetric traversal — e.g., you can fall from FL down to SC freely, but cannot climb from SC to FL without the Sea Cave Key. This is the "One Way Wall" mechanic: jump down freely, climb up only with the key.

> Verified against `GATE_LOCKS` array in `roll2hit-v3.html`. All 4 entries match exactly.

---

## CIRCUIT CORRIDORS (Layer 9)

The `CORRIDOR_CELLS` computed grid provides animated transit between non-adjacent nodes. When the player moves between two nodes that are ≥ 2 grid cells apart (Manhattan distance), `storyCorridorTravel()` fires — the player walks cell-by-cell through the corridor rather than jumping directly.

- **Cell data:** key `"r,c"` → `{dirs, glyph, terrain, edges}` — each cell knows its navigable directions and visual glyph
- **Junction nodes (J1–J7):** grid crossroads that stitch together corridor paths from multiple directions
- **MT node:** dedicated hunting ground at grid (4,5), accessible only from J6 — has a 🎯 STALK chip
- **Active path highlight:** the last-traversed corridor path glows gold in the map overlay

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
> **CS architecture note:** `NODE_MAP` is a flat plain object keyed by 2-letter node code — O(1) lookup. `CORRIDOR_CELLS` is a sparse object keyed by `"r,c"` string — also O(1). `GATE_LOCKS` is a 4-entry array — linear scan. `NODE_COORDS` is a flat object keyed by code — O(1). Navigation is a synchronous MUD-style state machine: one node at a time, no concurrency. The only async element is `storyCorridorTravel()` which uses `setTimeout` for per-cell animation.

---

### FL1 — Story Navigation (Core Game Loop)

**Entry point:** Player clicks a d-pad direction button.

```
MILEPOINT A  Player clicks direction → storyMove(dir) called
MILEPOINT B  GATE_LOCKS.find() — does this passage require an item?
             ├─ item absent → storyMsg() blocked message; return
             └─ item present → proceed
MILEPOINT C  Compute Manhattan distance via NODE_COORDS[from] and NODE_COORDS[to]
             ├─ distance ≤ 1 → direct move → storyRender(destNode)
             └─ distance > 1 → storyCorridorTravel(from, dest, dir)
MILEPOINT D  storyCorridorTravel() walks cell-by-cell via _routeSegments()
             Each step: _wireGlyph() for glyph, _corridorTerrain() for terrain
             Possible encounter: triggerCorridorEncounter() per step
MILEPOINT E  Arrive at destination node → storyRender(node)
             → storyCheckQuests() → storyCheckJournal() → storyShowNpc()
MILEPOINT F  _updateExitLinks() refreshes d-pad buttons for new node
             _setActivePath() marks gold path on map overlay
```

**Special case — portal:** `storyPortal()` is called at OU node; bypasses `storyMove()` entirely; jumps directly to GA with no corridor animation.

---

### FL9 — Hunt & Corridor Encounter

**Entry point:** Player toggles Hunt Mode ON, then moves between nodes.

```
MILEPOINT A  storyToggleHunt() → S_story.huntMode = !huntMode
             _updateHuntBtn() refreshes UI state
MILEPOINT B  storyMove(dir) → storyCorridorTravel() begins
MILEPOINT C  Each corridor step calls triggerCorridorEncounter(terrain, dest, questHunt)
             ├─ huntMode=true  → _stalkedMonsterPick(terrain) — quest-target filtered
             └─ huntMode=false → _weightedMonsterPick(terrain) — notoriety-weighted
MILEPOINT D  Encounter triggers → storyPreBattle() with picked monster
MILEPOINT E  Post-travel: _setActivePath(from, to, dir) marks gold corridor on map
```

---

### FL12 — Waypoint BFS Walk

**Entry point:** Player sets a waypoint destination, then clicks the waypoint button.

```
MILEPOINT A  Player clicks a node on the map overlay → storySetWaypoint(nodeCode)
             Sets S_story.waypointTarget; calls _updateWaypointBtn()
MILEPOINT B  Player clicks ✦ waypoint button → storyWaypoint()
MILEPOINT C  _bfsPath(currentCode, waypointTarget) runs BFS over NODE_MAP adjacency graph
             Returns ordered array of node codes: [current, n1, n2, ..., target]
MILEPOINT D  storyWaypoint() iterates path: calls storyMove(dir) for each step
             Each storyMove fires the full FL1 flow (gate checks, corridor travel, render)
MILEPOINT E  _updateWaypointBtn() clears waypoint display on arrival
```

**BFS implementation note:** `_bfsPath()` builds adjacency from `NODE_MAP[code].N/S/E/W` fields at runtime — no separate graph structure. Junction nodes (J1–J7) are traversed normally. EB dead-ends are excluded from BFS paths (no outbound edges from EB nodes).

---

### F1 Function Reference Table

| Function | Purpose | Key Data Read | Key Data Written |
|----------|---------|---------------|-----------------|
| `storyMove(dir)` | Single-direction navigation; gate check; dispatches corridor or direct | `NODE_MAP[code].N/S/E/W`, `GATE_LOCKS`, `NODE_COORDS` | `S_story.currentCode` |
| `storyPortal()` | Instant OU→GA teleport; bypasses corridor system | `NODE_MAP.OU` | `S_story.currentCode` |
| `storyCorridorTravel(from,dest,dir)` | Animates cell-by-cell walk via setTimeout; fires encounter checks per step | `CORRIDOR_CELLS`, `NODE_COORDS` | `S_story.currentCode` (per step) |
| `triggerCorridorEncounter(terrain,dest,questHunt)` | Rolls for random encounter during corridor transit | `HUNTING_GROUNDS`, `S_story.huntMode` | `S_story.pendingBattle` |
| `buildCorridorMap()` | Computes `CORRIDOR_CELLS` sparse grid at startup from `NODE_MAP` and `NODE_COORDS` | `NODE_MAP`, `NODE_COORDS` | `CORRIDOR_CELLS` (write-once at init) |
| `_bfsPath(from,to)` | BFS shortest path between two node codes; returns ordered code array | `NODE_MAP` adjacency | none (pure function) |
| `storyWaypoint()` | Iterates BFS path; calls `storyMove()` per step | `S_story.waypointTarget` | `S_story.waypointTarget` (clears on arrival) |
| `storySetWaypoint(nodeCode)` | Sets waypoint target; updates button; highlights BFS path | `NODE_MAP` | `S_story.waypointTarget` |
| `_setActivePath(from,to,dir)` | Marks last-traversed corridor gold on map overlay | `NODE_COORDS` | DOM only (map overlay cells) |
| `_updateWaypointBtn()` | Refreshes waypoint button label and state | `S_story.waypointTarget` | DOM only |
| `storyMapToggle()` | Opens/closes map overlay panel | DOM state | DOM only |
| `_renderMapGrid()` | Renders full 26×16 node grid in map overlay | `NODE_MAP`, `NODE_COORDS`, `CORRIDOR_CELLS` | DOM only |
| `_renderMiniMap()` | Renders compact inline minimap in node panel | `NODE_MAP`, `NODE_COORDS` | DOM only |
| `_renderWorldMiniMap()` | Renders world-level minimap with warmth tint (Layer 44) | `NODE_MAP`, `S_story.actNumber` | DOM only |
| `_renderFinalMap()` | End-game map render at CO victory sequence | `NODE_MAP`, full S_story | DOM only |
| `_mapIcon(code)` | Returns glyph character for a node code (e.g. `🏙` for city) | `NODE_MAP[code].name` | none (pure function) |
| `_mapAddExits(cell,code)` | Adds directional exit arrows to a map cell element | `NODE_MAP[code].N/S/E/W` | DOM only |
| `_updateExitLinks()` | Refreshes all four d-pad direction buttons for current node | `NODE_MAP[currentCode]`, `GATE_LOCKS` | DOM only |
| `_wireGlyph(dirs)` | Returns corridor wire character (`─`, `│`, `┼`, etc.) from direction set | none | none (pure function) |
| `_routeSegments(r1,c1,r2,c2,first)` | Decomposes a route into horizontal + vertical corridor segments | none | none (pure function) |
| `_corridorTerrain(from,to)` | Returns terrain type string for a corridor segment between two nodes | `NODE_MAP` | none (pure function) |
| `_storyFindTerrainNode(terrain)` | Finds nearest reachable node of given terrain type via BFS | `NODE_MAP`, `HUNTING_GROUNDS` | none (pure function) |
| `_getYaelLocation()` | Returns Yael's current patrol node code (Layer 45) | `S_story.npcFavorability`, `S_story.currentCode` | none (pure function) |

---

### Map Data Structure Summary

| Constant | Type | Shape | Purpose |
|----------|------|-------|---------|
| `NODE_MAP` | plain object | `{code: {num,name,label,act,N,S,E,W,text,npc,battle,loot,sleep,...}}` | 76 nodes; single source for connections AND content |
| `NODE_COORDS` | plain object | `{code: {r,c}}` | Grid position for each node; drives corridor routing and map render |
| `CORRIDOR_CELLS` | plain object (computed) | `{"r,c": {dirs,glyph,terrain,edges}}` | Sparse grid of traversable corridor cells; built once at startup by `buildCorridorMap()` |
| `GATE_LOCKS` | array | `[{from,to,item,label}]` | 4 item-gated one-way passages; checked in `storyMove()` |
| `HUNTING_GROUNDS` | plain object | `{terrain: {displayName}}` | 42 + 20 EB terrain display names; used in stalk/hunt overlays |

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

**⚠️ PLANNED — S55 Map Caption (plan.md §XXXI, Layer 66b):** A `<div id="final-map-caption">` is added to the overlay, centered below the warmth grid. Fades in at +400 ms after the grid (3500 ms total); fades out with the grid at 8100 ms. Text:

| Condition | Caption |
|-----------|---------|
| Base (always) | *"He walked every corridor. So did you. The map remembers."* |
| `s49SweelinckDelivered` | *"He walked every corridor. So did you. Sweelinck has the record."* |

Sets `s55MapLineDelivered = true` on render. Style: `color: #bbb; font-style: italic; font-size: 0.9em`.


---
*© 2026 roll2hit.com — MIT License. See [LICENSE](LICENSE) for full text.*
