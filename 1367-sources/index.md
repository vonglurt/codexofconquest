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
