# 1367 Node Index

Canonical registry of all nodes added during the §IMPORT-01 API import phase.
Two-tier naming rule: cities = 3-letter IATA or city-derived code; specific locations = 4–5 char {CITY}{LOC} code.

---

## Tier 1 — Cities and Towns

| Code | City | Region | IATA basis | Coords (r,c) | Book | Notes |
|------|------|--------|-----------|-------------|------|-------|
| PSA | Florence / Pisa Gate | Tuscany, Italy | PSA (Pisa Galileo Galilei — nearest available; FLR taken by fantasy node) | 140,208 | BLQ | Starting city for Decameron quests |
| NAP | Naples — Harbor District | Campania, Italy | NAP (Naples International) | 176,220 | BLQ | Act 5 destination for BLQ-01 |
| PIS | Pistoia | Tuscany, Italy | derived (no dedicated airport; nearest PSA/FLR both taken or used) | 136,205 | BLQ | Starting city for BLQ-02 |
| PRA | Prato | Tuscany, Italy | derived (no dedicated airport; nearest PSA used for Florence) | 138,206 | BLQ | Destination city for BLQ-02 |
| GEN | Genoa | Liguria, Italy | GOA (Genova Cristoforo Colombo) | 132,196 | BLQ | Starting city for BLQ-03 (The Three Rings) |
| DBV | Ragusa / Dubrovnik | Dalmatia, Croatia | DBV (Dubrovnik Airport) | 148,216 | BLQ | Waypoint for BLQ-03 |
| CON | Constantinople | Byzantine Empire | IST taken; CON derived from city name | 152,228 | BLQ | Final destination BLQ-03; starting node BLQ-07 |
| BOL | Bologna | Emilia-Romagna, Italy | BLQ taken (used as book code); BOL derived | 128,208 | BLQ | Destination for BLQ-04 (The Coals) |
| VEN | Venice | Veneto, Italy | VCE (Marco Polo Airport) | 132,220 | BLQ | Final destination BLQ-05; used in FCO-04 (Buthrotum Register) |
| FRR | Ferrara | Emilia-Romagna, Italy | derived (no major dedicated IATA) | 128,216 | BLQ | Waypoint city for BLQ-05; Po Valley route node |
| RHD | Rhodes | Dodecanese, Greece | RHO (Diagoras Airport) | 168,236 | BLQ | Final destination BLQ-06; Hospitaller chapter house, Mandraki harbor |
| FAM | Famagusta | Cyprus | derived (main airports ECN/PFO serve west Cyprus; FAM = city-derived) | 172,236 | BLQ | Waypoint BLQ-07; Hospitaller commandery port stop on Rhodes galley route |
| ALE | Alexandria | Egypt | HBE (Borg El Arab); derived ALE from city name | 184,232 | BLQ | Final destination BLQ-07; Venetian consul Frankish quarter; Hospitaller chapter house |
| BRI | Brindisi | Apulia, Italy | Note: IATA BRI=Bari; BDS=Brindisi — derived BRI from city name to match quest spec | 180,224 | BLQ | Starting city BLQ-09; Rocco's harbor warehouse; sea-chest custody commission |
| BAR | Bari | Apulia, Italy | derived BAR from city name (IATA BRI taken by Brindisi in our game) | 176,222 | BLQ | Final destination BLQ-09; podestà's court; chest opening scene; questComplete |
| AVG | Avignon | Provence, France | AVG derived (AVI = Avignon-Caumont); Papal court city | 138,175 | BLQ | Act 2 node BLQ-11; Maître Abramo pawnshop; wedding ring recovery |
| MTP | Montpellier | Languedoc, France | MTP derived (MPL=Montpellier); university quarter | 140,172 | BLQ | Act 3+4 node BLQ-11; Maître Guillaume hidden practice; salt-flat road |
| MAR | Marseille | Provence, France | MRS=Marseille Provence; MAR derived from city name | 144,178 | BLQ | Act 5 node BLQ-11; consular court registry desk; questComplete |
| ROM | Rome | Lazio, Italy | derived (FCO=Fiumicino serves Rome; ROM from city name) | 163,213 | BLQ | All 5 acts BLQ-12; prefect court quarter; exoneration records |
| CHI | Chios | Aegean, Greece | CHI derived from city name (Chios island) | 160,233 | HAV | Acts 1-2 HAV-01; Genoese Maona harbor district; corsair articles notary |
| CAF | Caffa | Crimea (Genoese colony) | CAF derived from city name (Feodosiya/Caffa Genoese factor quarter) | 134,237 | HAV | Acts 1-2 HAV-03; Genoese factor quarter; commission usage attestation |
| TRB | Trebizond | Black Sea coast, Byzantine | TRB derived (TZX=Trabzon Airport) | 152,240 | HAV | Acts 3-4 HAV-03; Genoese registry quarter; Black Sea admiralty registration |
| TBZ | Tabriz | Azerbaijan (Jalayirid Persia) | TBZ derived (no major IATA) | 160,240 | AMS | Jalayirid scholar quarter; AMS-01 delivery / AMS-02, 03, 04, 05, 07 commission nodes |
| NIS | Nishapur | Khorasan, Eastern Persia | NIS derived (no major IATA) | 168,240 | AMS | AMS-01 commission city; Ahmad ibn Ibrahim's madrasa; chrysanthemum box origin |
| BGD | Baghdad | Iraq (Mamluk-Jalayirid border) | BGD derived (SDA=Baghdad Intl) | 182,238 | AMS | AMS-02 delivery; Sufi scholar quarter; Hafiz ibn Walid's study |
| SAM | Samarkand | Uzbekistan (Timurid approach) | SAM derived (SKD=Samarkand) | 157,240 | AMS | AMS-06 commission city; Silk Road scholar district; Brother Kenji's room |
| MRV | Merv | Turkmenistan (ancient city) | MRV derived (MYP=Mary Airport) | 165,240 | AMS | AMS-06 delivery; Central Asian music theory quarter; Hamid al-Sarakhsi's study |
| MRG | Maragha | Azerbaijan, NW Iran | MRG derived (no major IATA) | 162,238 | AMS | AMS-07 intermediate city; observatory district and road junction inn quarter |
| BUR | Bursa | Ottoman Anatolia (former capital) | BUR derived (BRS = Bristol IATA — reserved for SEN) | 154,228 | HTY | HTY-04 delivery city; Ottoman silk market; Haji Mehmed Arslan's warehouse; Armen's nephew dispute |
| GNJ | Ganja | Caucasus, Azerbaijan (Armenian community) | GNJ derived (no major IATA; city name) | 153,240 | HTY | HTY-06 commission city; Armenian monastery library; Brother Grigor's custody |
| BIS | Bistritz | Transylvania (Saxon district capital) | BIS derived from city name (Bistrița) | 137,224 | CLJ | CLJ-01 commission city; court physician Janos; compiled witness folio; CLJ-04/09 waypoint |
| KLZ | Klausenburg | Transylvania (administrative and court city) | KLZ derived from city name (Klausenburg/Cluj-Napoca) | 139,222 | CLJ | CLJ-02/03/05/08 commission city; archdeacon's court; property registry; contingency letter |
| SIB | Sibiu | Transylvania (Saxon administrative capital) | SIB derived (Hermannstadt/Sibiu) | 141,223 | CLJ | CLJ-02/04/05/07 waypoint city; archdeacon court; apothecary; shorthand documents |
| BDA | Buda | Hungary (royal capital and registry) | BDA derived from city name (Buda, before Budapest unification) | 138,217 | CLJ | CLJ-03 delivery city; Hungarian royal registry; Péter's enrollment desk |
| BOR | Borgo Pass | Carpathian Mountains (Transylvania–Moldavia route) | BOR derived from Borgo Pass location | 135,225 | CLJ | CLJ-06/07 waypoint; mountain pass inn; Brother Corneliu's earth box custody; Florescu's commission |
| SAU | Sant'Urbano alla Caffarella | Latium, Italy (Appian Way south of Rome) | SAU derived from church name | 165,213 | WAW | WAW_001 commission node; Appian Way monastery; Brother Rinaldo's secondary archive; Banquet Letter custody |
| VFM | Via Flaminia Apennine Section | Apennine Mountains (Rome–Bologna mountain road) | VFM derived from Via Flaminia | 148,210 | WAW | WAW_001 transit node; Apennine pass; brigand encounter on narrow mountain road |
| ANT | Antioch | Syria (Ottoman/late Byzantine frontier) | ANT derived from city name (Antakya) | 165,238 | WAW | WAW-06 commission node; Syrian monastery above the city; Brother Athanasius; Antioch Community Record Fragment custody |
| BLK | Black Sea Coastal Road | Anatolian Black Sea coast (Bosphorus to Trebizond) | BLK derived from Black Sea route | 151,234 | NWI | NWI_001 transit node; caravanserai on the coastal road; Venetian manuscript agent Marco Zane waystation |
| BTR | Bosphorus Thracian Noble Estate | Thrace (European side, near Bosphorus) | BTR derived from Bosphorus-Thracian | 148,229 | NWI | NWI_002 commission node; stone archive room; steward Dragomir; Seuthes Grant Record custody |
| SIN | Sinope | Northern Anatolia, Black Sea coast | SIN derived from city name (Sinope) | 151,236 | NWI | NWI-06 commission node; merchant quarter; Konstantinos; Cretan Archer's Dictation custody |
| ORC | Orchomenos | Boeotia, Greece (inland) | ORC derived from city name | 163,218 | NWI | NWI-03 commission node; monastery library; Brother Stavros; Proxenus's Letter custody |
| VAR | Varna | Bulgaria, Black Sea coast | VAR derived from city name | 147,225 | NWI | NWI-05 commission node; civic archive; Radu; Salmydessus Salvage Catalog custody |
| MYS | Mystras | Peloponnese, Greece (Byzantine Despotate of Morea) | MYS derived from city name | 167,218 | NWI | NWI-07 commission node; Peloponnesian monastery; Father Demetrios; Scillus Survey Transcription custody |
| AOI | Ancona | Marche, Italy (Adriatic coast) | AOI from IATA (Ancona Falconara); ANC code collision → AOI used | 143,214 | NWI | NWI-07 waypoint; Adriatic factor's quarter; Florentine humanist encounter; Greek noble family ambush road |
| REG | Regensburg | Bavaria, Germany | REG derived from city name (IATA ratisbon/REG); used for NWI-08 Regensburg notary | 120,208 | NWI | NWI-08 act_4 node; document intake office; Herr Friedrich Mühlberg; Anabasis cross-reference verification |
| LMO | Thessaloniki — Monastery of the Latomos | Macedonia, Greece (Byzantine) | LMO derived from Latomos monastery name | 160,219 | MLA | MLA-001 commission node; Father Simeon's scriptorium; The Third Comparison |
| THA | Thessaloniki — Harbor | Macedonia, Greece (Byzantine) | THA derived from Thessaloniki Harbor | 162,220 | MLA | MLA-001/MLA-05 node; Father Christodoulos; harbor quarter; The Nicias Correspondence |
| NXS | Naxos — Ducal Monastery Library | Cyclades, Greece (Latin Duchy) | NXS derived from Naxos city name | 167,229 | MLA | MLA-002 commission node; Brother Grigorios; The Missing Preface (Epaminondas/Scipio) |
| BLW | Blidworth | Nottinghamshire, England | BLW derived from Blidworth village | 104,152 | STN | STN-01/02 node; forest toll gate on the Sherwood road; Half-Sixpence delivery route |
| GMT | Gamston | Nottinghamshire, England | GMT derived from Gamston village | 106,154 | STN | STN-01 node; Ellen's village; rescue/wedding scene; Sheriff's men at the church |
| NGM | Nottingham Common | Nottinghamshire, England | NGM derived from Nottingham Common | 106,153 | STN | STN-02/06 node; Gallows Tree; scaffold scene; widow's sons indictment |
| EMT | Emmet Priory | Nottinghamshire, England | EMT derived from Priory of Emmet | 101,150 | STN | STN-03 node; ruined chapel; corrupt cellarer's hidden copy of Sir Richard's mortgage deed |
| LEA | Castle Lea | Nottinghamshire, England | LEA derived from Castle Lea | 104,149 | STN | STN-03 node; Sir Richard of the Lea's estate; debt delivery destination |
| NTN | Nottingham Town Fair | Nottinghamshire, England | NTN derived from Nottingham Town | 106,151 | STN | STN-04 node; fair grounds; Golden Arrow tournament; Sheriff's archery contest |
| KLN | Kirklees Nunnery | Yorkshire, England | KLN derived from Kirklees | 100,149 | STN | STN-07 node; gate chapel ruins; Robin Hood's death; last arrow scene |
| PAR | Palermo | Sicily, Italy (Kingdom of Sicily) | PAR derived from city name (no dedicated IATA; PMO = Palermo) | 187,210 | IST | IST-05 (Devol Treaty Copy) commission city; Norman archive district; Margherita di Ferro's family archive tower |
| KHR | Cairo — Booksellers' Quarter | Egypt (Mamluk Sultanate) | KHR derived from Al-Qahira (Arabic name for Cairo); CAI code collides with existing fantasy node | 193,230 | BGW | BGW-01–03/08 commission node; manuscript market near al-Azhar mosque; scholars_qtr terrain |
| TUN | Tunis — Monastery of the Two Saints | Tunisia (Hafsid Sultanate) | TUN derived from city name | 183,205 | BGW | BGW-05 commission node; monastery library north of Tunis; Brother Ilario's custody; city terrain |

---

## Tier 2 — Named Specific Locations

| Code | Full Name | City Anchor | Terrain | Coords (r,c) | Book | Story Role |
|------|-----------|------------|---------|-------------|------|-----------|
| PSAGLD | Florence — Guild Counting House | PSA | city | 141,208 | BLQ-01 | Where Ser Bardo Albizzi commissions the folio delivery; quest acts 1–4 fire here |
| PISNOT | Pistoia — Via dei Notai (Ser Taddeo's House) | PIS | city | 135,205 | BLQ-02 | Where retired judge Ser Taddeo Borghini certifies the statute modification; act 1 fires here |
| PISGAT | Pistoia — Eastern Gate | PIS | city | 137,205 | BLQ-02 | Where Nardo the clerk watches for the carrier; act 2 fires here |
| MONTTG | Montale — Toll Gate | (road between PIS and PRA) | road | 137,206 | BLQ-02 | Where toll officer Betto has been bribed; act 3 fires here |
| PRAAPR | Prato — City Approach Road | PRA | road | 139,206 | BLQ-02 | Where Iacopo and hired men block the road; act 4 (combat) fires here |
| PRACRT | Prato — Podestà Court Clerk Desk | PRA | city | 138,207 | BLQ-02 | Where Testa di Fattino receives the folio; act 5 fires here |
| GENWHS | Genoa — Wool Warehouse (Porta Soprana) | GEN | market_quarter | 133,196 | BLQ-03 | Where the Three Rings story begins; Saladin's merchant identity; act 1 fires here |
| CONREG | Constantinople — Galata Regent Hotel | CON | city | 153,228 | BLQ-03 | Where Saladin's agent meets the carrier; act 5 fires here |
| PSAFAB | Florence — Fabrizio's Road (Porta Romana) | PSA | city | 141,209 | BLQ-04 | Road south of Florence; relay point act 1 fires here |
| FSLINN | Fiesole–Scandicci — Roadside Inn | (road S of PSA) | inn | 139,209 | BLQ-04 | Where Rinaldo da Montecristo stages the shipment |
| MCRJN | Monte di Croce — Road Junction | (road PSA–BOL) | road | 135,209 | BLQ-04 | Brother Anselmo's monastery junction; act 3 fires here |
| FRZINN | Firenzuola — Border Inn | (road PSA–BOL) | inn | 132,209 | BLQ-04 | Apennine pass inn; act 4 fires here |
| BOLSAC | Bologna — Sacristy of San Petronio | BOL | city | 129,208 | BLQ-04 | Final delivery point; act 5 fires here |
| PSAFM | Florence — Federigo Farm (Eastern Gate) | PSA | midlands | 141,210 | BLQ-05 | Federigo degli Alberighi's farm; quest start and NPC home; act 1 fires here |
| FRRFRY | Ferrara — Po River Ferry Crossing | FRR | freshwater_lake | 129,216 | BLQ-05 | Where road agent Gasparo intercepts the carrier; act 2 fires here |
| MESFRY | Mestre — Mainland Ferry Landing | VEN | freshwater_lake | 132,219 | BLQ-05 | Where ferryman Ser Barnaba demands credentials; act 4 fires here |
| VENCTR | Venice — Ca' Tron Grand Canal | VEN | city | 133,221 | BLQ-05 | Where Madonna Taddea receives the deed; act 5 fires here; questComplete |

---

## Code Collision Register

Codes that were planned but found already occupied by existing game nodes:

| Planned | Was For | Found In Game As | Resolution |
|---------|---------|-----------------|-----------|
| FLR | Florence | "Wreck of the Unbroken" (fantasy ocean node) | Used PSA instead |
| LHR | London | "City Streets — Birka" (game city node) | Will use different code for London when CLJ imported |
| IST | Istanbul/Sardis | "Abyssal Scriptorium" (fantasy node) | Will use different code for Istanbul when NWI imported |
| OTP | Transylvania | "Trench Titan" (fantasy node) | Will use different code for Transylvania when CLJ imported |
| CLJ | Dracula starting city | "Vampire Castle Ruins" (game node) | Will use different code when CLJ imported |
| HAV | Havana | "Admiral's Last Cove" (game node) | Will use different code when HAV imported |
| BRS | Bursa (HTY-04 spec used BRS) | Reserved for Bristol (IATA BRS) for SEN/Treasure Island import | Used BUR for Bursa instead |
