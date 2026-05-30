# quest-map.md — Cross-Source Quest Map


Very important. Use the API by running queries on curl to localhost 1367 by using node.js to start wbapi-server.js we can the query exiting cities,  and quests. Mission bits. If you can't get a request for your type, consider asking the user to add to plan.md 

*The thread that ties all book quests together. Read this before writing any new quest.*

> **Purpose:** Track the theme, location, and quest identity of every book we
> process. When writing new quests, read this file first — find what is already
> in the weave, avoid repeating themes, look for complementary angles.
> Cross-reference with `../story.md` for the game's actual city contexts and
> node aesthetics before placing a quest act in a city.

> **How it grows:** After writing each book's Quest API Stub, append one line:
> `{CODE} | {quest title} | Cycle N | {node/city} | {core theme in 5 words}`

---

## The Overarching Story We Are Building

These quests are not separate events. They are scenes in a single long story about
a Fighter who moves through the world carrying things — objects, words, obligations
— that belong to other people. The Fighter is not the hero of history. History
moves around them. They hold the token. They deliver it. They witness.

Each source book gives us one scene. Each scene adds one more kind of loyalty
tested, one more kind of grief carried, one more kind of courage proven in the
dark. Across all the books, the Fighter accumulates a life: the horn they kept
full, the shield they buried, the cloak that was torn, the garland that burned.

The game asks: what does it mean to keep your word when the world does not?

---

## Processed Quests

| Code | Quest Title | Cycle | Node/City | Core Theme |
|------|-------------|-------|-----------|------------|
| LHR | The Mere of Monsters | 1 | Heorot → monster-mere (northern coast) | Loyalty proven in the long watch |
| INV | The Shield of Gormur | 1 | Highland battlefield → Fingal's hall | Grief and the price of the warrior code |
| BHD | Fergus's Word | 1 | Scottish harbor → Emain Macha (Ulster) | The cost of a lord's broken oath |
| MSE | Emily's Garland | 1 | Athens tournament → Arcite's pyre | Love, fate, and the tournament of death |
| STN | The Half-Sixpence | 1 | Sherwood Forest → church at Doncaster | Loyalty disguised as small things |
| GDN | Hildigunna's Cloak | 1 | Iceland — Swinefell to Reykir | Objects that demand vengeance |
| MAD | The Cord and the Beard | 1 | Burgos → Toledo (Iberian road) | Honor carried through humiliation |
| TBS | Tinatin's Commission | 1 | Georgian court → wilderness road | Duty and love as messenger's trial |
| SDQ | Diana's Letter | 1 | Osbaldistone Hall → Glasgow Gallowgate | Love's last gift carried without breaking |
| LCY | The Fortune-Knot | 1 | Tilford Hall → Château Villefranche → Najera | Honor held in trust across three countries |
| LGW | The Barge of the Maid of Astolat | 1 | AST → RVP → WM | Dead love's truth delivered whole |
| MAN | The Sealed Jar | 1 | AHB → NRG → ROT | Healing carried through hostile law |
| SEN | The Oilcloth Chart | 1 | ADM → TL → VS → WM | The carrier becomes the hunted |

---

## Theme Threads Active

- **Loyalty under the long watch**: LHR, STN, TBS — the Fighter who stays when others leave
- **Grief carried in an object**: INV, BHD, GDN — a thing holds the dead
- **Honor vs. shame**: MAD, GDN, BHD — the cost of keeping a vow when the lord breaks it
- **Love and fate intertwined**: MSE, INV, BHD — love that ends in loss but is not diminished by it
- **Truth delivered posthumously**: LGW — a dead woman's words carried through a world that preferred silence
- **Healing carried through hostile law**: MAN — medicine that cannot announce its source; the physician who must stay behind
- **The carrier becomes the hunted**: SEN — an object of value marks its bearer; possession turns an innkeeper's boy into prey; delivery and survival are the same act
- **The token's journey**: ALL — the object passes hand to hand; its state marks the story's progress

---

## Location Grid — City Weave

Read `../story.md` for full city aesthetics before placing a quest act.
Game cities are canonical. Source-book settings are proposed new nodes.

### Game Cities (Canonical)

| City/Node | Code | Act | Texture | Theme Affinity |
|-----------|------|-----|---------|----------------|
| Birka | BK/CI/IN/CY | I + VIII | Nordic timber, frost, merchant smells, void undercity below | Commerce, loyalty, cold, the Shattered Codex |
| Corelli Quarter | CQ | — | Cobblestone alley, canal-water, cat-haunted rubble | Grief, corruption, old money |
| Fishmonger's Row | FR | — | Ruins, salt, seagull-cry, nets in rubble | Grief, witnessing, loss |
| Civil District | CI | I | Bureaucracy, candlelight, ink-stained stone | Obligation, patience, power through paperwork |
| Neon Undercity | CY | — | Void-lit corridors, mechanical hum, data wraiths | Corruption, transformation, the uncanny |
| Tilbury | TL/DK/SF | II | Harbor, rope-and-salt, sea-access, Magistra Muffat | Maritime, arrival, smuggled things |
| Visby | VS/GC/VC | V | Underground markets, stone cold, Warlord Mordus | Danger, underground trade, dark loyalties |
| Weimar | WM/SQ/MT | VI | Archive-haunted, scholarly, high-church, Archivus Sweelinck | Knowledge, investigation, the void's paper trail |

### Source-Book Nodes (Proposed)

| Source Location | Proposed Node | Terrain | Theme Affinity |
|----------------|---------------|---------|----------------|
| Heorot / monster-mere | HEO | Northern coast, mead-hall gold, bone and smoke | Loyalty, fame, grief, the long watch |
| Scottish Highland | HLD | Fog, bog, granite and heather, bard-song | Grief, warrior code, sacred oath |
| Ulster coast / Emain Macha | ULC | Stone-ringed dun, sea-crossing, betrayal | Oath-breaking, love's cost |
| Athens tournament field | ATH | Tournament dust, temple smoke, noble grief | Fate, love, the tournament of death |
| Sherwood Forest | SHW | Leaf-shadow, arrow-flight, yeoman warmth | Loyalty in small things, disguise |
| Iceland / Thingvellir | ISL | Fog, blood on stone, silence | Vengeance, the weight of objects |
| Castilian road / Toledo | IBR | Dust, court protocol, beard-honor | Pride, humiliation, long patience |
| Georgian mountain road | GEO | Shale, amber and gold, champion's fire | Duty, love, the commission |
| Scottish Highlands / Glasgow | SCT | Heather, Highland fog, Lowland commerce | Loyalty, divided allegiance |
| Astolat riverside manor | AST | Grey morning water, dock on still river, lanterns in willows | Honest love, grief, the thing unsaid while alive |
| River ford passage | RVP | Shallow ford, fast current, willow banks, midnight crossing | Contested passage, loyalty between rival claims |
| Ashby tournament grounds | AHB | Tournament field, Norman heraldry, armorer yards and pavilion streets | Identity concealed under competition; Norman power on display |
| Norman road checkpoint | NRG | Raised road, temporary timber gate, torchlight, cold flat country | Institutional authority at the threshold; contested passage |
| Rotherwood — Cedric's Saxon hall | ROT | Timber-and-rushes, oversized fire, Saxon pride, northern frost | Stubbornness as shelter; the Saxon holdout; old trust new necessity |
| Admiral Benbow Inn | ADM | Chalk cliff coastal village, dark sea below, lantern-lit common room, chalk road running inland | Arrival/departure, danger in ordinary places, the catalyst |

---

*When a new quest is written, append its row to the Processed Quests table.*
*When a new location is used, append its row to the Location Grid.*
