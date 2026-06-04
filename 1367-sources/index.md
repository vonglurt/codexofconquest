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
