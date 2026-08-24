<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — §KG Increment 2: The St. Petersburg → Moscow Corridor
### A second beginner ramp — low-level "kindergarten" zones, Soviet-cyberpunk cover story, honor-central

**Original design lock:** 2026-07-08 · **Shipped:** `65d65c0` 2026-07-08 18:20:38 (same commit)
**Pinned parent:** `65d65c0^` = **`89745ee`** (2026-07-08 17:44) · 36,758 lines
**Amended:** `b2fe418` 2026-07-29 11:51 (route-drift note) · **Re-measured:** §DOC-02cw, 2026-08-22, against HEAD (38,712 lines)
**Predecessor:** §KG-01 `8168f0e` 2026-07-08 17:02 — Hunt Mode + the `_monsterLevel` metric, **78 minutes earlier**
**Successor:** §KG Increment 3 `d6aeefd` 2026-07-08 21:21 — the 11-quest chain

> **Document class.** This is a **content/zone report**, not an engine design lock. It introduced no new
> state field, no new mechanic, and no new code path — five nodes, six monsters, five terrains, eleven
> road cells, and five lines of dialogue, all riding machinery that already existed. It is therefore
> scored on its **census** (does the data still match the table?) and on **survival** (did the zones
> outlive §WALK, §NAV-01 and §CELL-13?), not on a spec→code transliteration.

---

## ABSTRACT

A fresh character begins at Birka with a seven-shard main quest that is comprehensively over their head.
§KG Increment 2 adds a **second on-ramp running east**: a compact honor-central band of Soviet-cyberpunk
zones along a St. Petersburg → Moscow corridor, paced so a Level-1 fighter can grind cleanly toward
Level 6 with Hunt Mode biasing encounters to their level.

**Re-measured 45 days after ship, the data half of this report is close to flawless.** All five nodes sit
on their locked cells with their locked terrain keys, labels, NPCs and battles; all six monsters carry
byte-identical stats and reproduce all six `_monsterLevel` scores to two decimal places; all five terrain
pools match in content *and order*; every corpus delta the lock predicted (+5 nodes, +6 monsters, +5
terrains, +11 road cells, 5×2 dropdown options) reproduces exactly; and seven of eight line anchors
resolve at offset zero on the pinned parent.

**Three claims do not survive, and they are all about the road and the talking.** (1) The corridor was
**not** laid with `./api.sh highway --execute` as §6, §7 and §8 assert — the ship commit lays it as a
direct one-line `ROAD_RUNS` replacement, and its own message records the API path as broken; the
"API-first" invariant this report self-certifies was therefore not honoured. (2) The ship's claim of
*"0 new violations"* is **false for one of the four gates it names**: rebuilt ship-day trees put
`check:roads` R3 at **0 at the parent and 1 at the ship** — `road cell 10,207 is impassable sea`, the
Gulf of Finland, on precisely the leg §2 flagged as the sea-risk leg. Three pre-existing R2 failures held
the exit code at 1 on both sides, so the new red was invisible to a pass/fail reading. (3) The five NPC
signature lines shipped **inert** and stayed inert for **20 days 16 hours 45 minutes** — proven in a
browser at both builds — because `NPC_DIALOGUE[node.code]` resolved to `undefined` on all five.

---

## I. INTENTION AND INSPIRATION — what this band is for

**The problem.** Birka's opening is a good opening, but it is one opening. A player who bounces off the
Birka Roots arc, or who simply wants to *fight* before they want to *investigate*, had nowhere obvious to
go. §KG-01 had shipped Hunt Mode 78 minutes earlier and immediately exposed the gap it existed to serve:
the cyberpunk ladder had no rungs below Level 4. Hunt Mode promises *"a fair or easy fight"* and the
world could not supply one.

**The design answer, and why it is a corridor rather than a dungeon.** A ramp should be a *place you walk
through*, not a room you clear. Six road legs from The First Inn to Station 7 give the band a direction,
a beginning and an end, and — because road terrain rolls no encounters — make the *travel* free so the
*stopping* is the game. You choose to step off the road to fight. That is the whole loop.

**The cover story, and the peel-back.** The world tells the player a lie and then withdraws it — the same
technique Birka uses when "clear the vermin" turns out to be three centuries of infrastructure failure.
Here, a **Mercenary Guild Recruiter** at the St. Petersburg gate is signing warm bodies for "honest work
in the east." The honest work is the **Gulag Gladiator Zavod** — honor duels against decommissioned
gladiator bots — and the **Skill Fabrika**, a jack-in trade school that bills in deliveries and fights.
Soviet dressing throughout: *Commissar, Komsomol, Zavod* (Зaвoд, "factory/works").

**Honor is the spine.** Every zone frames combat as a *sanctioned bout* rather than a mugging. You are
not knifing vermin in an alley; you are *matched* against a sparring droid with its serial number
stencilled on its chestplate. Weckmann's clean-fight ethic, transplanted east:

> *"These bots were gladiators before the Zavod stripped their reactors. We fight them with honor because
> they fought us with it. Three duels. No poison, no ganging. You lose, you lose standing up."*
> — Pit-Master Grimka, ZVD

**What it adds to the game.** Three things, and the third is the one that lasted. *(a)* A **difficulty
floor** — the pool occupies mLevels 1·2·2·3·3·4, and before it the weakest cyberpunk monster in the
corpus was Techno-Thug at exactly 4. Hunt Mode's promise became satisfiable. *(b)* A **second act-1
geography** with five named faces, so a returning player has somewhere else to start. *(c)* A **shape**
the next increment could hang eleven quests on — every §KG quest is anchored to one of these five NPCs.

**What it deliberately is not.** A gate. Free-Movement is absolute: nothing here refuses a step. The
corridor is *offered* to a low-level player through Hunt Mode and level-scaled pools; a Level-20 returner
may walk it and be bored, and that is the correct outcome.

---

## II. METHOD (§DOC-02cw re-measurement)

| Instrument | Applied as |
|---|---|
| Census via the real parser | `src/js/wbapi-core.js` `W.load()` on parent, ship and HEAD — never a line regex |
| Anchor scoring on the pinned parent | `git show 89745ee:play.html`, all eight cited lines read directly |
| Ship-day tree rebuild | `git archive 65d65c0 \| tar -x`, symlinked `node_modules`, gates run as they ran that day |
| Behaviour proved in a browser | Chromium, both builds, seeded save at each of the five nodes |
| Acceptance test re-run | `src/tests/integration/kg-zones.test.js` at HEAD |

> The ship tree is **flat** — the `src/scripts/` and `src/js/` reorganisation is later — so an unprefixed path in
> the original text is correct for its day and is not scored as an error.

---

## III. THE LOCKED DESIGN, AS SHIPPED

**Projection** (`col = 180 + °lon`, `row ≈ 69.75 − °lat`). Verified live: Birka LHR `10,197`,
Tallinn TLL `10,204`, Moscow SVO `14,217`, The Tungas TGS `7,217` — all four exact.

| # | Code | Label | Cell (r,c) | Analogue | Terrain key | NPC anchor | Battle |
|---|---|---|---|---|---|---|---|
| — | TLL | The First Inn *(pre-existing)* | 10,204 | Tallinn | `inn` | Innkeeper Brynn | — |
| 1 | **SPB** | Nevsky Checkpoint | 10,210 | St. Petersburg | `soviet_checkpoint` | Recruiter Volkov | none |
| 2 | **KMS** | Komsomol School | 11,211 | Veliky Novgorod | `komsomol_school` | Commissar-Instructor Roshkova | none |
| 3 | **ZVD** | Gulag Gladiator Zavod | 12,213 | (steppe) | `gladiator_zavod` | Pit-Master Grimka | Honor Duel — `gladiator_bot` ×1 |
| 4 | **FBR** | The Skill Fabrika | 13,215 | (steppe) | `skill_fabrika` | Technician Iosif | Sim Overload — `trainer_bot_prime` ×1 |
| 5 | **TVR** | Rzhev Transit Waystation | 13,216 | Tver | `soviet_transit` | Quartermaster Lena | none · `sleep:true` |
| — | SVO | Station 7 (Dark) *(pre-existing)* | 14,217 | Moscow | `station_7` | — | — |

**The training pool.** `_monsterLevel` (§KG-01): `score = AC + 0.35·HP + 1.5·avgHitDmg`, then
`clamp(round((score − 15) / 7.2 + 1), 1, 20)`.

| key | name | ac | hp | dmg | tier | score | mLevel | trophy (sell) | kill XP |
|---|---|---|---|---|---|---|---|---|---|
| `sparring_droid` | Sparring Droid | 9 | 5 | 1d4 | trivial | 14.50 | **1** | Cracked Servo (3) | 45 |
| `komsomol_cadet` | Komsomol Cadet | 12 | 8 | 1d6+1 | trivial | 21.55 | **2** | Red Kerchief (4) | 96 |
| `zavod_sparbot` | Zavod Spar-Bot | 13 | 10 | 1d6+2 | easy | 24.75 | **2** | Dented Plating (5) | 130 |
| `gladiator_bot` | Rusted Gladiator Bot | 14 | 14 | 1d6+2 | easy | 27.15 | **3** | Bent Gladius (7) | 196 |
| `fabrika_enforcer` | Fabrika Enforcer | 13 | 16 | 1d8+1 | easy | 26.85 | **3** | Cortex Shunt (8) | 208 |
| `trainer_bot_prime` | Malfunctioning Trainer-Bot | 15 | 26 | 2d6+1 | easy | 36.10 | **4** | Prime Core (12) | 390 |

**Terrain pools**, deepening west→east, at `const WORLD_DB = {@6279`; `P.commoner` (Rabid Monkey,
mLevel 1) pads the two gentlest. All five verified order-exact:

```
soviet_checkpoint  →  sparring_droid · komsomol_cadet · commoner
komsomol_school    →  komsomol_cadet · sparring_droid · zavod_sparbot
gladiator_zavod    →  zavod_sparbot  · gladiator_bot  · trainer_bot_prime
skill_fabrika      →  fabrika_enforcer · gladiator_bot · trainer_bot_prime
soviet_transit     →  komsomol_cadet · zavod_sparbot  · commoner
```

---

## IV. VERIFICATION — spec → shipped → HEAD

### A. Corpus deltas (parser census, all three builds)

| Quantity | Parent `89745ee` | Ship `65d65c0` | Predicted Δ | Actual Δ | HEAD |
|---|---|---|---|---|---|
| NODE_MAP entries | 413 | 418 | **+5** | **+5** ✓ | 416 |
| NODE_COORDS entries | 413 | 418 | +5 | +5 ✓ | 416 |
| MONSTER_POOL entries | 392 | 398 | **+6** | **+6** ✓ | 398 |
| Trophy drop rows | — | — | +6 | +6 ✓ | present, all six |
| WORLD_DB terrains | 106 | 111 | **+5** | **+5** ✓ | 111 |
| Worldbuilder options | — | — | 5×2 | **10** ✓ | 10 |
| ROAD_CELLS | 400 | 411 | **+11** | **+11** ✓ | 410 |

The "reachability rises by exactly 5, to 418" target is **exact**. HEAD's 416 is two unrelated later
removals; all five §KG nodes are still present.

### B. Anchors on the pinned parent — **7 of 8 exact at offset zero**

| # | Cited | What the parent line actually holds | Verdict |
|---|---|---|---|
| 1 | `L3915` worldbuilder option row | `<option value="cyberpunk_streets">` — a terrain option row | ✓ exact |
| 2 | `L4426` second dropdown | the same row in the second selector | ✓ exact |
| 3 | `L5252` MONSTER_POOL | `const MONSTER_POOL = {` | ✓ **offset zero** |
| 4 | `L5816+` drops map | a `key:{ name, icon, sell }` trophy row | ✓ exact |
| 5 | `L6160` MONSTER_POOL close | a banner comment; **MONSTER_POOL closes at 5681** | ✗ **wrong by 479** |
| 6 | `L6162+` WORLD_DB | the `WORLDBUILDER:WORLD_DB:START` marker; decl at 6163 | ✓ exact |
| 7 | `L21591` npc-quote pattern | the first `CODE:{ name, quote }` entry | ✓ exact |
| 8 | `L27191` `_inferTerrain` | `function _inferTerrain(r, c) {` | ✓ **offset zero** |

### C. Engine claims — all exact at HEAD

| Report claim | Live | Verdict |
|---|---|---|
| road cells return `road`, encounter rate 0 | `const TERRAIN_ENCOUNTER_RATE = {@9892` holds `road:0` | ✓ |
| off-road cell adjacent to a node inherits that terrain | `function _inferTerrain(r, c) {@28385` — orthogonal-neighbour majority | ✓ |
| Hunt Mode 80/20 at-or-below bias | `if (S_story.huntMode && _seededNext() < 0.8) {@38228` | ✓ |
| Hunt Mode roughly doubles the rate | `if (S_story.huntMode) baseRate = Math.min(0.8, baseRate * 2);@28442` | ✓ |
| battle XP = AC · maxHP | `const xpAward = Math.round((S.enemy.ac@25294` | ✓ |
| Level 6 costs 5,500 XP | `const XP_LEVELS = [@24420` — index 5 is 5,500 | ✓ **exact** |
| all six at or below Techno-Thug, *"mLevel ~4"* | Techno-Thug is **exactly** 4; band max is 4 | ✓ |
| node prose ≤ the HKG/SVO exemplars | §KG 635–739 chars; HKG 953, SVO 1,192 | ✓ |

### D. Acceptance and gates at HEAD

`src/tests/integration/kg-zones.test.js` — **5/5 green**. `check:roads` — green (R1 244/244 · R2 single
component · R3 0 · R4 410 cells). `check:anchors` — 4,423 anchors across 106 docs resolve.
`check:legacycodes` — OK. The corridor survived §WALK, §NAV-01 and §CELL-13 intact.

---

## V. FINDINGS

### F1 — The road was not laid through the API, and the invariant that says it was is this report's own

§6 tables the road as *"6 legs · `./api.sh highway --execute`"*; §7 step 4 repeats it; §8 certifies
*"API-first: nodes + highways via `./api.sh`"*. The ship diff contains **no highway calls**. It contains a
single-line replacement of `const ROAD_RUNS = {@9883` adding runs on rows 10–14, totalling the eleven
cells the census confirms. The commit message states why, as a lesson:

> *"`./api.sh highway` lays sparse `junction:true` nodes (violate check-invariants I1/I2, ugly 'The The…'
> names) and ZERO road cells — and the nodes were already walk-reachable on contiguous land. Correct
> road-paving is a direct `ROAD_RUNS` edit."*

The lesson was learned at ship and never carried back into the design lock. **Nodes** did go through
`./api.sh post node`, so the invariant is half-honoured; as written it is not.

### F2 — *"0 new violations"* is false for one of the four gates the ship record names ⚠ **NEW INSTRUMENT**

Both trees rebuilt (instrument 150) and the gates run as they ran that day:

| Gate | Parent `89745ee` | Ship `65d65c0` | New? |
|---|---|---|---|
| `check-invariants` | I2 ×1, I1 ×1 (J14/J15 junctions) | identical | none ✓ |
| `check-terrain-parity` | green, ROAD_CELLS 400 | green, ROAD_CELLS 411 | none ✓ |
| `check-mover-parity` | green (1,847 bytes) | green (1,847 bytes) | none ✓ |
| **`check-roads`** | **R3 = 0** | **R3 = 1** | ✗ **one new** |

The violation: `✗ R3: road cell 10,207 is impassable sea`. That is the Gulf of Finland, on the TLL→SPB
leg — **the exact leg §2 identified as the sea-risk leg**, in the same paragraph that promised the
road-lay "carries land bridges where needed." The risk was named, then shipped into.

It went unseen because the gate was **already red**: three pre-existing R2 failures (settlements 7,217 /
8,217 / 9,217, the Tungas spur) make the process exit 1 at the parent *and* at the ship. Nothing in the
exit status changed. Only the violation **count** changed.

> ***A pre-existing red makes the exit code blind to a new one. When a ship record claims "0 new
> violations" against a baseline, run the gate on BOTH builds and diff the violation LIST — the count is
> the signal, never the status.*** This is instrument 147's family with a new face: not a baseline that
> went stale, a baseline that **masked**.

The R3 violation lived until `f08f70f`-era road regeneration — §DX-01a's `build-roads.js --apply` rerouted
the leg through the row-8 TUO corridor.

### F3 — The five signature lines shipped mute, for twenty days ⚠ proven in a browser at both builds

§5's whole contribution is *"name + one signature line"* per node. At ship, none of them could be heard.
The render path is `const _npcDial = NPC_DIALOGUE[node.code];@35801`, the d-pad gate is
`!(node.npc && NPC_DIALOGUE[node.code])@35907` — and none of the five NODE_MAP
entries carries a `code:` field. `NPC_DIALOGUE[undefined]` is `undefined`.

Measured in Chromium, seeded at each node:

| Build | `node.code` | dialogue found | Talk buttons | d-pad NPC | *"Has dialogue"* |
|---|---|---|---|---|---|
| Ship `65d65c0` | **undefined** ×5 | **false** ×5 | **0** ×5 | **disabled** ×5 | **0** ×5 |
| HEAD | SPB…TVR ×5 | true ×5 | 1 ×5 | enabled ×5 | 1 ×5 |

The NPC card still drew the name — *🧙 Recruiter Volkov* — with no button under it. The rescue is
`if (!NODE_MAP[k].code) NODE_MAP[k].code = k;@9415`, one
normalisation line shipped by **`f08f70f` §AUDIT-03e on 2026-07-29 11:06:46** — an unrelated repo-health
increment. **Inert for 20 days, 16 hours, 45 minutes.**

Two twists make this the increment's sharpest lesson:

1. **The fixer knew.** `f08f70f`'s own message says *"all five §KG NPC_DIALOGUE lookups failed —
   Volkov/Roshkova/Grimka/Iosif/Lena had never been talkable."* The defect was diagnosed by name.
2. **This report was edited 45 minutes later and said nothing.** `b2fe418` landed at **11:51:11** the
   same morning, amending **§2** of this very file about roads — while **§5** of the same file had just
   been silently un-broken by a commit 45 minutes upstream.

> ***When a report carries a dated amendment, diff what else landed in the repo that day. The amendment's
> author was standing next to a fix for a different section of the same document.***

### F4 — The route-drift note counts the failing test's sample, not the population ⚠ **NEW INSTRUMENT**

§2's 2026-07-29 note states that *"four cells this report's original road-lay implied (`10,205`,
`10,209`, `11,210`, `14,216`) are no longer road."* Measured at HEAD against the eleven cells the ship
commit actually laid:

**Nine of eleven are no longer road** — `10,205 · 10,206 · 10,207 · 10,208 · 10,209 · 11,210 · 12,212 ·
13,214 · 14,216`. Exactly **two survive**: `11,212` and `12,214`.

The four the note names are the four that made `kg-zones.test.js` red — the test sampled six cells and
four of them failed. The note transcribed the assertion list as if it were a census of the lay.

> ***A drift note written from a failing test measures the SAMPLE, not the POPULATION. Re-derive the
> population from the diff that created it.***

**The same note also declines to name the author of the defect it describes.** It correctly reports that
§DX-01a rerouted the leg *"off the Gulf-of-Finland sea cell `10,207` (a `check:roads` R3 violation)"* —
without noting that the violation was shipped by the increment the note is written inside (F2).

### F5 — The corridor is no longer the monotone diagonal §2 promised

§2 specifies *"a monotone SE diagonal so every leg is a clean 1-step-per-axis road."* True of the node
*placement*; no longer true of the *route*. Measured with the engine's own router (`_roadGridPathCore`,
the §NAV-01d road-weighted Dijkstra auto-travel walks):

| Leg | Steps | Route |
|---|---|---|
| TLL → SPB | **9** | north to row 8, east through TUO, back south — the sea-cell detour |
| SPB → KMS | 1 | 10,211 |
| KMS → ZVD | 2 | 11,212 · 11,213 |
| ZVD → FBR | 2 | 12,214 · 12,215 |
| FBR → TVR | **0** | adjacent cells |
| TVR → SVO | 1 | 13,217 |

**Fifteen steps end to end, every intermediate cell on road.** The *promise* — encounter-free travel
between the zone nodes — is literally true and is now asserted as a property rather than as coordinates,
so a future regeneration can only redden it by actually breaking the corridor. The *geometry* prose is
stale, and FBR/TVR being adjacent means one "leg" of a six-leg corridor is a single step.

### F6 — The five zone terrains have no encounter rate of their own

None of `soviet_checkpoint`, `komsomol_school`, `gladiator_zavod`, `skill_fabrika`, `soviet_transit`
appears in `const TERRAIN_ENCOUNTER_RATE = {@9892`. All five fall through the `?? _default` guard to
**0.15 — the generic midlands rate**, doubled to 0.30 under Hunt Mode. The report never specifies a rate,
so nothing was violated; but a band whose entire purpose is to be *ground* paces identically to open
wilderness, while `city` (0.05) and `forest` (0.25) are deliberately tuned. → **§DX-02ek**

### F7 — Every §KG node renders its own name twice

§4 gives each terrain the node's display name as its `label` (`soviet_checkpoint:{ label:@6294`), and §5 gives the node the same string. The header composes
`nodeLabel · terrainLabel`, so all five stutter:

```
Nevsky Checkpoint · Nevsky Checkpoint          ← §KG
Gulag Gladiator Zavod · Gulag Gladiator Zavod  ← §KG
City Streets — Birka · City Streets            ← LHR, the house pattern
The First Inn · Inn — Night                    ← TLL
Station 7 (Dark) · Station 7 — Hidden Waypoint ← SVO
```

Every exemplar this report cites gets it right: the terrain label names the *kind of place*, the node
label names *the place*. Corpus-wide **26 of 416** nodes stutter — and **five of those twenty-six were
minted here**, 19% of the class in one increment. §7 step 5(d) said *"node cards render NPC + prose"*;
they do, with the name said twice. → **§DX-02el**

### F8 — The five nodes never reached their own home doc

`NODE_MAP` and `NODE_COORDS` both carry `// → doc: maps.md`. §7 step 6 named *"world.md/maps.md"*.
`monsters.md`, `world.md` and `quest.md` all synced correctly and remain accurate at HEAD — the
monsters.md table still reproduces every stat and mLevel. **`maps.md` contains zero occurrences of SPB,
KMS, ZVD, FBR or TVR**, 45 days on. The ship commit's own doc list omits it, so the miss is consistent —
and undetected. → **§DX-02em**

### F9 — The Level-6 promise is true here and false one increment later

§1 promises *"grind cleanly from L1 to ~L6 (5,500 cumulative XP)"*. Both halves check out: L6 is exactly
5,500 and kill XP is exactly AC·maxHP. As a claim about **grinding**, which is unbounded, it is honest.
§AUDIT-03bl (already filed) scored the *chain* in Increment 3 and found its minimum path lands at **5,301
— 199 short**. The two claims are different claims: **the zones let you reach L6; the quest chain does not
pay you there.** Nothing in this report is falsified by that row, and the distinction is worth preserving.

---

## VI. PLAYABILITY — what the band actually delivers

**The grind surface is nine cells.** A cell is huntable only if it is off-road, unoccupied, passable, and
inherits a §KG terrain from `_inferTerrain`. Across rows 8–16, columns 203–220, there are exactly nine:

| Node | Huntable cells |
|---|---|
| SPB | 2 — `10,209` · `11,210` |
| KMS | **1** — `12,211` |
| ZVD | 2 — `12,212` · `13,213` |
| FBR | 2 — `13,214` · `14,215` |
| TVR | 2 — `12,216` · `14,216` |

Everything else in the window is road (rate 0), a settlement (arrival, not a roll), or sea. The Komsomol
School — the zone whose entire fiction is *sparring practice* — offers **one** cell on which a cadet can
be met.

**The arithmetic of the ramp.** 5,500 XP to Level 6. Kill XP runs 45 · 96 · 130 · 196 · 208 · 390, mean
177.5, so the band is roughly **31 average kills**, or 123 Sparring Droids, or 15 Trainer-Bots for
someone who can survive one. At 0.30 hunting, with node arrivals not rolling, that is about one fight per
6.7 steps — call it **~200 steps of deliberate oscillation** between a zone node and the cell beside it.
Exploration XP (`const EXPLORE_XP = 10;@24437`) and effort XP (`const EFFORT_XP_PCT = 0.25;@24428`, added
four days later) both shorten it; neither existed on the day this was designed.

**Hunt Mode does what the report says.** `function _weightedMonsterPick(terrain) {@38220` filters to
monsters at or below the player level on 80% of picks. At the Zavod a Level-1 player therefore meets the
Spar-Bot far more often than the Trainer-Bot, while the 20% full-pool draw still surfaces the mLevel-4
capstone for a genuine fight. Notoriety weighting is flat inside the band — trivial 40 / easy 35 — because
every §KG monster is one or the other, so the pool composition alone drives the ramp. **This is the
mechanism working exactly as designed, and it is the report's best idea.**

**What the player actually experiences at HEAD.** Arriving at ZVD renders the node card with *Honor
Duel — Rusted Gladiator Bot*, four buttons (Fight · Waypoint · Short Rest · Talk), and Grimka's line
in full behind the Talk accordion. Verified in a browser this session. **For the first three weeks of its
life the Talk button was not there.**

---

## VII. INVARIANTS — re-scored

| # | Claimed | Verdict |
|---|---|---|
| 1 | **Free-Movement** — no node/quest/flag refuses a step | ✓ **held**. No gate shipped; signature battles are node-card encounters, not road blocks. |
| 2 | **API-first** — nodes and highways via `./api.sh` | ⚠ **half**. Nodes yes; the road was a direct `ROAD_RUNS` edit (F1). |
| 3 | **Node terrain-key rule** — `name` is a terrain key, `label` is display | ✓ **held** on all five, verified by parser. |
| 4 | **Grep-before-building** — reuse, no duplicate codes | ✓ **held**. `commoner` and `station_7` reused; no prior SPB/KMS/ZVD/FBR/TVR. |
| 5 | **No new jump travel, no new state, no mover changes** | ✓ **held**. `check-mover-parity` byte-identical across the ship boundary. |

Four of five clean. The one that failed is the one the report certified about its own method.

---

## VIII. STATUS AND FOLLOW-UPS

**Live and healthy.** All five zones, six monsters, five terrains and eleven-cell corridor are in the
game at HEAD, 45 days on, with `kg-zones.test.js` green and the corridor property-asserted rather than
coordinate-pinned. Increment 3's quest chain shipped the same evening (`d6aeefd`) and is **blocked**
for unrelated reasons — see §DX-02cy (the `monsterKills` counter has no writer) and §AUDIT-03bl.

**Filed by this re-measurement:** §DX-02ek 🟡 (zone encounter rates, F6) · §DX-02el 🟢 (the duplicated
node header, F7) · §DX-02em 🟢 (`maps.md` never synced, F8).

**Not filed, because already tracked:** §DX-02cy 🔴 · §AUDIT-03bl 🟡 · §AUDIT-03e (closed — it is the fix
in F3).

---

## IX. WHAT THIS REPORT TEACHES

A content report is easy to score and hard to falsify: the data either matches or it does not, and here it
matches almost perfectly. Every number in §2, §3 and §4 reproduces 45 days later, several of them to two
decimal places. **The failures are all at the seams** — the road the API could not lay, the gate whose
existing red hid a new one, the dialogue whose lookup key did not exist, the home doc nobody wrote to.

Which is the useful shape of it. **A design lock is verified by grepping the data; a design lock is
falsified by running the thing.** The census would never have found that Volkov could not be talked to.
Only opening the game did.

> *"You arrive soft. The School does not judge soft — the School corrects it."*
> — Commissar-Instructor Roshkova, KMS

---

*Original design lock 2026-07-08 · shipped `65d65c0` · amended `b2fe418` · re-measured §DOC-02cw 2026-08-22.*
*Increment 3 (the quest chain) is a separate lab-report-gated block: `lab-report-kg-corridor-quest-chain.md`.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
