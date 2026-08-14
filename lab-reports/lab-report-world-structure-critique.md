<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — World Structure Critique
### Geographic Architecture, Node Density, and the IATA Anchor System in *The Shattered Codex*

**Project:** `roll2hit-v3.html` — single-file HTML5 game engine, MIT License
**Written:** 2026-06-16 15:22:50 · **Reference build:** `89fa13b` (12:20:47, 33,721 lines — the figure in the original status line, exact)
**Verified:** 2026-08-14 (§DOC-02bj) — measured at the reference build and again at HEAD
**Series:** World Architecture · Geographic Analysis · Structural Critique
**Classification:** Engineering · Cartography · Game Design · Structural Analysis

> **Status line, corrected.** The original read *"154 WORLD_DB nodes · 152 GEO-anchored cities · 33,721 HTML lines."*
> Only the third figure is right. `WORLD_DB` is the **terrain** table, not the node table; the node table is
> `NODE_MAP`, and it held **409** entries at this build (**416** at HEAD). `WORLD_DB` held **106** terrains
> (**110** at HEAD). The GEO table held **152** anchors, and that number is exact.
> **As built: 409 NODE_MAP nodes · 106 WORLD_DB terrains · 152 GEO anchors · 33,721 lines.**

---

## Abstract

This is the first dedicated structural critique of the game world of *The Shattered Codex*. Prior work
(`synthesis-part3`, `circuit-map-theory`) verified that navigation is *correct*. This report asked whether the
world is *shaped* correctly.

**Original hypothesis.** Node distribution, act structure and geographic anchoring reveal three emergent
properties: a "big middle" act imbalance, a geographic shadow problem (nodes with no lat/lon anchor sit outside
the map), and a density inversion (the narratively richest acts have the fewest nodes).

**Verified finding.** One of the three holds. **The geographic shadow problem was real, was correctly diagnosed,
and was correctly closed** — the GEO expansion is the report's durable contribution and it shipped. The **big
middle inverts** under measurement: Acts 3+4 hold 32 % of nodes, while **Act 1 alone holds more than both
together**. The **density inversion loses its evidence**: Act 6 has 44 nodes, not 11.

The report's geography is near-flawless and its arithmetic is not. Every coordinate, label and node code it
transcribed is byte-exact two months on; every number it composed from memory is wrong. It is the clearest
transcriber-versus-composer split the verification program has recorded in a document this short.

---

## I. Purpose — what the anchor system buys the player

The original stated its mechanism and left its motive implicit. The motive is the reason the row was worth
closing, so it belongs first.

**The world is Earth.** Every content node carries an IATA airport code placed at the approximate coordinates of
its real city. `LHR` is Birka (59.3, 17.6). `CON` is Constantinople (41.0, 28.9). `SAM` is Samarkand
(39.6, 66.9). All three verify exactly. The playable extent — lat −8→68, lon −25→72 — spans Cape Verde to
Arctic Scandinavia and Portugal to Uzbekistan: the medieval Eurasian world, sized to contain the 1367 AD
setting, the Norse arc, the Pauline arc and the naval expansion.

**Three things this buys, all of them felt in play:**

1. **Travel time means something.** Movement is node-to-node across a projected grid. If Amsterdam and
   Nuremberg are anchored at their real coordinates, the walk between them costs what the distance implies.
   Un-anchored, a node lands wherever the cell engine last left it, and the world's distances become arbitrary —
   the player learns that the map cannot be reasoned about, and stops reasoning about it.
2. **The map becomes a memory aid.** A player who learns that the Scholar's Quarter is south of Amsterdam and
   east of Paris is learning real geography, and it holds. That is the difference between a world you navigate
   and a menu you page through.
3. **It disciplines authoring.** You cannot add a node called "Dark Forest" without answering: *which* forest,
   near which city, at what latitude. The anchor system forces geographic accountability on every new place,
   which is why the world has stayed coherent across 400+ nodes.

The design's most interesting move is applying this to fantasy content too. `BKK` is not the Bangkok airport
dropped into medieval Europe; it is a fantasy location borrowing Bangkok's coordinates because that is where the
Far East begins on this map. **The Orient is real; the Dragon Palace is where the Orient is.** Anchoring `CDG`
does not put the Cat Quarter in a modern terminal — it puts it where medieval Paris sat, which is the only claim
the reweave needs.

**This report exists because the most important structural decision in the game's architecture had never been
written down.** That much is still true, and this document is still the place it is written down.

---

## II. Method

Reference build `89fa13b` (2026-06-16 12:20:47), the last commit touching the game file before the report's
15:22:50 mtime, and **exactly the 33,721 lines the report names**. Claims about the world's *past* are
adjudicated at the archive, not at HEAD; claims about *present* behaviour are re-run at HEAD.

Node and terrain censuses are taken with a **brace-depth walk that skips strings and comments**, not a line
regex. This matters: a `^CODE:\s*\{` regex returns **394** where the structural walk returns **409**, because
15 entries are written in a style the regex does not match. The original's counts were taken by eye, which is
the same failure with a larger residue.

---

## III. Verification summary

### III.A — What held (the transcribed half)

| Claim | Verdict |
|---|---|
| `33,721 HTML lines` | **EXACT** at `89fa13b` |
| Map bounds lat −8→68, lon −25→72 | **EXACT** — `minLon: -25` / `maxLon: 72`, `tools/worldmap.js` lines 226–227 |
| `LHR` 59.3/17.6 · `CON` 41.0/28.9 · `JAR` 31.8/35.2 · `SAM` 39.6/66.9 | **4 of 4 exact** |
| `NUE` 49.5/11.1 · `AMS` 52.4/4.9 · `CDG` 49.0 · `FRK` 48.9 | **4 of 4 exact** |
| `CVP` 38.7/−9.1 · `SDR` 43.4 · `MAD` 40.5 · `ACE` 29.0/−13.6 · `PDL` 37.7/−25.7 | **5 of 5 exact** |
| The 39 GEO additions named in §II.A | **39 of 39 real** |
| §II.B — 14 codes named as deliberately outside GEO | **14 of 14 outside GEO**, all real nodes |
| §V.C — `SAM` is the easternmost GEO anchor | **TRUE** (66.9 is the maximum longitude) |
| §IV — Epic Battlegrounds are 20 boss nodes | **EXACT** — 20 distinct `epic_*` nodes |
| Act 0 = 27 · Act 4 = 53 · Act 7 = 8 · Act 8 = 1 | **4 of 9 act rows exact** |
| `./api.sh reweave --execute` | **EXACT** — the documented usage line at the reference build |
| Limerick 52.7/−8.6 (proposed `LIM` anchor) | **Correct real-world coordinates** |

### III.B — Spec → shipped delta

| # | Original claim | Measured | Verdict |
|---|---|---|---|
| 1 | "154 WORLD_DB nodes" | `NODE_MAP` **409**; `WORLD_DB` **106 terrains** | **WRONG STRUCTURE + WRONG COUNT** |
| 2 | "80 of 154 … registered in GEO" | **76** of 409 | Corrected |
| 3 | "72 new GEO entries" | **76** — and §II.A's own table sums to 76 | Corrected; the table was right |
| 4 | §III act table | Sums to **168**; prose says 154; file says **409** | Corrected |
| 5 | "Acts 3 and 4 hold 90 of 154 — 58 %" | **129 of 409 — 32 %** | **Thesis inverts** |
| 6 | "Act 6 … has only 11 nodes" | **44** | Corrected |
| 7 | §V.A — Norwegian anchors "contain no named nodes" | All 4 are nodes | **NOT TRUE** |
| 8 | §V.B — "Iberian Peninsula is mapped but not occupied" | Both anchors are nodes | **NOT TRUE** |
| 9 | "Add to `PRIORITY_HIGHWAYS` in `api/wb.js`" | Deleted 26 h earlier | **RETIRED**, action shipped anyway |
| 10 | "CVP → ACE … approximately 1,500 km" | **1,155 km** great-circle | Corrected |
| 11 | "NUE and AMS … approximately 750 km" | **541 km** great-circle | Corrected |
| 12 | §V.D — seeding "will place them at the correct positions" | False for `PDL` | Corrected |
| 13 | §IV — "the Void Archaeology five-quest arc" in Act 6 | **4 quests, hosted at `GVA` (act 3)** | Corrected |
| 14 | §I — "Every node code in WORLD_DB is an IATA airport code" | Refuted by §II.B and by 42 `J*` junctions | Corrected |
| 15 | §II.B — `DFL` (Dunfall — Loch Harbor) | Correct then; `DNF` now | **RETIRED, not wrong** |

---

## IV. The GEO expansion, as built

This is the part that shipped, and it shipped well.

The anchor table is duplicated in two files that must agree — the map tool and the authoring server. Before the
expansion each held **76** entries; after, **152**, and the two key sets are **identical**. The expansion added
**76** anchors, not 72.

| Region | New | Key additions (all verified real) |
|---|---|---|
| British Isles | 12 | `LCY`, `STN`, `MAN`, `INV`, `GCI`, `GIB` |
| Scandinavia extended | 16 | `TRD`, `GOT`, `VBY`, `MOL`, `KSU`, `BOO` |
| W/C Europe | 19 | `CDG`, `AMS`, `NUE`, `GVA`, `ZRH`, `VIE`, `MUC` |
| E Europe / Balkans | 13 | `ATH`, `BEG`, `WAW`, `SOF`, `TLL`, `OTP` |
| Caucasus / Russia | 3 | `SVO`, `TBS`, `LCA` |
| Middle East / N Africa | 9 | `DAM`, `JRS`, `CAI`, `ADA`, `FEZ`, `DOH`, `RUH` |
| Atlantic Islands | 4 | `ACE`, `PDL`, `RAI`, `SID` |
| **Total** | **76** | 76 + 76 = **152** ✔ |

**Instrument note.** The table sums to 76 and the prose beside it says 72. When a document's data section and
its narrative disagree, check the data section first — here it was right, and it recovers the true value without
any further measurement.

**The shadow problem was real.** Before the expansion, `CDG` (Paris area, lat 49.0) sat at an arbitrary grid row
while `FRK` (Paris, lat 48.9) was anchored 18 km away by the Mercator formula — two nodes representing one
region, in different places, for no reason except that one was in the table and one was not. `AMS` (Amsterdam,
52.4) sat near the top of the grid, closer to Iceland than to the Low Countries. The expansion closed exactly
this, and the closure is why the row was worth doing.

**§II.B verified in full.** Fourteen codes are deliberately outside GEO and all fourteen check out: the
fantasy locations `DSF` (The Atlantean Forge), `DSJ` (The Kelp Channel), `HCA` (The Deeper Clearing), `LSO`
(The Fog Bank — Open Water); the out-of-bounds expansion codes `BKK`, `CAN`, `CTU`, `HKG`, `SEA`, `HAV`, `MSY`,
`BGI`; and `LIM` (`LIM:{ num:81, code:'LIM', name:'mimic_meadow', label:'The Mimic Meadows'@8815`), left out
because Lima, Peru is incoherent with a medieval European setting.

> **`DFL` — kept, not deleted.** The original's fifth fantasy code was correct at the reference build. The
> commit that published this report renamed `DFL` to `ZRH`, colliding with the live
> `ZRH:{ num:72, code:'ZRH', name:'defi_land', label:'The Unbanked Quarter'@8789` — and a JavaScript object
> literal keeps the last key, so the harbour node silently ceased to exist. It was recovered under a third code
> and is `DNF:{ num:143, code:'DNF', name:'highlands', label:'Dunfall — The Loch Harbor'@8739` today. The claim
> was true when written; only the code moved.

---

## V. Act distribution — the correction that reverses the thesis

| Act | Original | Measured @ `89fa13b` | @ HEAD | Role |
|---|---|---|---|---|
| 0 | 27 | **27** ✔ | 27 | Prelude / infrastructure |
| 1 | 14 | **131** | 138 | Birka and the opening world |
| 2 | 8 | **19** | 19 | Early travel |
| 3 | 37 | **76** | 76 | Midlands wilderness |
| 4 | 53 | **53** ✔ | 53 | Epic Battlegrounds + open world |
| 5 | 9 | **14** | 14 | Transition / specialist areas |
| 6 | 11 | **44** | 44 | Scholar arc / late game |
| 7 | 8 | **8** ✔ | 8 | Endgame approach |
| 8 | 1 | **1** ✔ | 1 | Resolution node |
| — | *(no row)* | **36 `act:NaN`** | 36 | §AUDIT-03t |
| **Total** | **168** (table) / 154 (prose) | **409** | **416** | |

**Four rows of nine are exact.** The three smallest acts and the Epic Battleground act were counted correctly;
the four large ones were estimated.

**The big middle is a big beginning.** Acts 3+4 hold **129 of 409 — 32 %**, not 58 %. **Act 1 alone holds 131**,
more than Acts 3 and 4 combined. And because `node.act || 1` silently gates the 36 `act:NaN` nodes as Act 1
(§AUDIT-03t), the runtime figure is **167 of 409 — 41 %**. The mass of this world is at its *start*.

This matters for the advice the original derived from it. *"Any new nodes added in Acts 3 or 4 deepen an
already-deep layer, while Acts 2, 5, 6, 7 are thin"* points authors away from the middle. The measured shape
says the opposite is the live risk: **Act 1 is the layer at risk of over-deepening**, and Acts 2 (19), 5 (14)
and 7 (8) are the genuinely thin ones. Act 3, at 76, is now the second-largest act in the game.

**The density inversion loses its evidence.** The claim — that narrative density and node count are inversely
correlated — rested on Act 6 having 11 nodes against Act 4's 53. Act 6 has **44**. The gap is 44 against 53, and
the correlation the section names is not visible in the data. Act 6 is still the most narratively concentrated
region in the game (`NUE:{ num:35, code:'NUE', name:'scholars_qtr'@8705` — the Weimar Scholar's Quarter, with
Sweelinck's archive, the Froberger journal and the Entry 42 mechanic), and the *design* argument for spatial
compactness is intact. Only the arithmetic supporting it is gone.

> **Also corrected:** §IV places the Void Archaeology arc in Act 6. It is a **four**-quest arc
> (`quest_va_01` … `quest_va_04`) hosted at `GVA:{ num:50, code:'GVA', name:'mountains', label:'The Mountain Pass — High Crest'@8733`,
> which is **act 3**.

---

## VI. The unoccupied regions are occupied — and the reason is one field

§V.A reported that the Norwegian corridor between Birka and the Norse arc "contains no named WORLD_DB nodes."
§V.B reported that "the Iberian Peninsula is mapped but not occupied." **Both are false, six codes for six**:

| Code | GEO says | The node actually is | Act |
|---|---|---|---|
| `TRD` | Trondheim | `TRD:{ num:26, code:'TRD', name:'goblin_cave',     label:'Goblin Warrens'@8686` | 5 |
| `MOL` | Molde | Lake Approach — West Shore | 3 |
| `KSU` | Kristiansund | The Lake Harbor | 3 |
| `MJF` | Mosjøen | `MJF:{ num:77, code:'MJF', name:'shale_drop',   label:'The Shale Drop'@8784` | 3 |
| `SDR` | Santander | `SDR:{ num:54, code:'SDR', name:'epic_swamp',           label:'Sunken Altar'@8745` | 3 |
| `MAD` | Madrid | `MAD:{ num:69, code:'MAD', name:'epic_heavenly_clouds', label:"Shattered Seraph's Spire"@8775` | 7 |

These are not thin waypoints. `TRD` is the Void Shaman's warrens with three goblin clans at war over which of
them a false god loves best; `MAD` is a Seraph suspended mid-fall. The report walked past a boss node to declare
the region empty.

**The claim is not merely wrong, it is structurally impossible.** Every GEO code is a `NODE_MAP` node —
**152 of 152** at the birth build, **155 of 155** at HEAD, zero orphans in either direction. The seeding phase
even says so out loud, skipping any anchor with no node and reporting the skip. "GEO-anchored but not a node" is
an empty set and always has been.

**The mechanism is measurable, and it is the finding worth carrying forward.** The GEO table's `label` column
holds the **real-world city name**, for author orientation. `NODE_MAP.label` holds the **game place name**.
They diverge in **148 of 152** entries at the birth build and **150 of 155** at HEAD.

The five that agree at HEAD are `STN`, `AMS`, `CDG`, `NUE` and `ACE` — and **those are precisely the codes §II
uses as its worked examples.** The author read the 3 % of the table where the anchor label happens to read like
a node, generalised the pattern, then hit `Trondheim` and `Madrid` and concluded, reasonably from that premise,
that they were anchors without places. *Nothing in either file says which kind of name you are looking at.*
→ filed as **§AUDIT-03bc**.

> Two entries in the same table are one city twice: `NID` (Nidaros) and `TRD` (Trondheim) are **27 km apart**,
> and Nidaros *is* medieval Trondheim. §V.A names `NID` as an existing Norse node and `TRD` as an empty anchor
> in the same paragraph. The "geographic gap" it describes is, in part, one place counted as two.
> (The band it calls "a four-degree band" spans lat 59–65 — **six degrees**.)

---

## VII. Projection edge cases

**One anchor lies outside the projection domain.** `PDL` (Ponta Delgada, Azores) is at lon **−25.7** against
`minLon: -25` (`tools/worldmap.js` line 226) — the only such entry of 155, at the reference build and at HEAD.
Two consequences, both silent:

- The region-membership test (`g.lon >= b.minLon`, `tools/worldmap.js` line 263) is a bare comparison with no
  clamp, so **`PDL` falls into no region cell at all**.
- The seeding phase *does* clamp, computing column **4** and pinning it to the grid minimum of **8**. `PDL` is
  placed, but on the west wall rather than at its coordinates.

So §V.D's assurance that seeding "will place them at the correct positions" fails for exactly one anchor, and it
is one of the four Atlantic islands that section is about. → filed as **§AUDIT-03bb**.

**Anchor contention is real but small.** Running the seeding arithmetic over all 152 anchors: **149 land in
distinct cells**; three pairs contend, and the tie-break shoves the loser east one column at a time. All three
are genuine same-place duplicates rather than projection failures:

| Cell | Contenders |
|---|---|
| 115, 134 | `LDN` (London — White Hill) · `BRK` (British Royal Ct) |
| 145, 255 | `KLZ` (Klausenburg) · `CLJ` (Cluj-Napoca) — the same city in two languages |
| 242, 313 | `JAR` (Jerusalem) · `JRS` (Jerusalem) — the same label twice, 11 km apart |

The engine's own help text names this behaviour ("moves collision losers to free cells"), so nothing here is
undiagnosed. It is recorded because a future expansion that doubles the anchor table will double the contention,
and duplicate *labels* are the cheapest to catch before they are placed.

---

## VIII. Recommendations, corrected

**1. Run the reweave.** ✅ **DONE — in the commit that published this report.** The 152 anchors were locked to
their Mercator positions and the corridor mesh rebuilt around them. `CDG`, `AMS`, `NUE`, `GVA`, `LCY` and `STN`
moved as predicted.

**2. Add the CVP → ACE priority highway.** ✅ **DONE, and the mechanism named was already gone.** The original
said to add an entry to `PRIORITY_HIGHWAYS` in `api/wb.js`. That constant was real on 2026-06-09 and was
**deleted on 2026-06-15 at 13:17 — twenty-six hours before this report was written**. It is RETIRED, not
imagined. The live surfaces are the `priorityHighways` request parameter on the reweave endpoint and the
`./api.sh highway <from> <to>` subcommand, which already existed and does exactly this.

The highway shipped regardless: **42 junctions** bridging Lisbon to the Canaries, and the node table grew from
**409 to 451** in that commit — `J14` through `J55`, forty-two of them, matching the recorded figure exactly.
The real-world span is **1,155 km**, not 1,500; still the longest single corridor in the game.

**3. Reconsider which acts are thin.** The original recommended expanding Acts 5/6 before Acts 3/4. **The
premise was wrong but the recommendation partly survives** — Act 5 (14) genuinely is thin, as are Act 2 (19) and
Act 7 (8). Act 6, at 44, does not need nodes. The live imbalance is **Act 1 at 131**, and the first thing worth
doing about it is not adding nodes anywhere: it is resolving the **36 `act:NaN`** entries (§AUDIT-03t), which
are inflating Act 1 by 36 at runtime and which no gate can see.

**4. `LIM` remains outside GEO.** Unchanged, and still an open decision. Limerick (52.7, −8.6) verifies as
correct real-world coordinates and would put the Mimic Meadows in the British Isles cluster — which may or may
not be where they belong. Worth noting that `LIM` is act **6**, so the choice is not purely cartographic.

**5. Label the anchor tables.** New, and the cheapest item here: one comment header on each GEO table stating
that `label` is the Earth city name rather than the node's name, and that every anchor is a node. Two sentences
would have prevented both false findings in §V. → **§AUDIT-03bc**.

---

## IX. Conclusion

**The geographic shadow problem was real, was correctly diagnosed, and was closed by the expansion this report
accompanied.** That is the finding worth having, and it holds. The remaining unanchored nodes are exactly what
the report says they are: fantasy locations with no Earth coordinate, and out-of-bounds codes held for
expansion.

The two structural theses do not survive contact with the data. The big middle is a big beginning — Act 1 holds
more of the world than Acts 3 and 4 together — and the density inversion's evidence disappears once Act 6 is
counted rather than estimated. Both were offered as properties that "emerged rather than were designed," and
that framing is worth keeping even though the numbers were not: **the world does have a shape nobody chose, and
naming it is still the right instinct. It is simply a different shape.**

**The strongest observation, restated so it is true:** the gap between intent and implementation was the GEO
shadow problem, it had been open since the first non-geographic node was added, and the expansion closed it.
What replaced it is smaller and quieter — a table whose `label` column means two different things depending on
the row, which is how a careful author came to walk past a boss node and call the region empty.

---

## Appendix A — Claims kept as corrected or NOT SHIPPED

Per the Lab Report Policy a failed claim is corrected in place and kept, never deleted. The delta table in
§III.B is that register; three items appear only here.

- **"The remaining 74"** (nodes outside GEO) — **333**. The trio 80/74/154 is internally consistent and
  externally unrelated to the file.
- **"Acts 1, 2, 5, 6, 7 and 8 together hold 51 nodes"** — **217**.
- **`const WORLD_DB@6279`** is the registry the status line meant to name — a terrain table, addressed as
  `WORLD_DB[node.name]` where `name` is the terrain key.

## Appendix B — Corroborated, not re-filed

- **§AUDIT-03t** — the 36 `act:NaN` nodes are the missing row in §III's table and the reason Act 1's runtime
  share is 41 %. Already filed; this report is a second independent encounter with its blast radius.
- **§AUDIT-03u** (as extended by §DOC-02ah) — the Level-20 disclosure tells the player *"the source file is
  16,024 lines of readable JavaScript. MONSTER_POOL has 423 entries. WORLD_DB has 67 terrain entries."* Live:
  38,712 / 398 / 110. It is the same defect class as this report's status line, in player-facing text, and it is
  already owned.
- **§AUDIT-03r** — `MJF` and `CDG` both carry `num:77`.
- **§AUDIT-03ba** — engine comments written in retired node vocabulary; the same root cause as §VI, on a
  different surface.

## Appendix C — Rows filed by this verification

- **§AUDIT-03bb** 🟡 — `PDL`'s anchor lies outside the projection domain; excluded from every region cell,
  clamped to the west wall by the seeding phase.
- **§AUDIT-03bc** 🟢 — the GEO tables' `label` column is an Earth gazetteer name, diverging from the node's own
  label in 150 of 155 rows, and nothing says so. Two comment headers.

---

*End of Lab Report — World Structure Critique*

*Written 2026-06-16 · verified 2026-08-14 (§DOC-02bj) at `89fa13b` and at HEAD*
*As built: 409 NODE_MAP nodes · 106 WORLD_DB terrains · 152 GEO anchors · 8 acts + 36 unassigned · lat −8→68 · lon −25→72*
