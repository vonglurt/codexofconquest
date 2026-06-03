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
