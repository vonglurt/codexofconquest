<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — §FUTURE-01 Source Reference: Paul of Tarsus, a Designer's Node Map

**IEEE-format source reference · verified rewrite**
**Original:** undated (the corpus's only report with no header block); companion to `lab-report-saul-paul-vignette-spec.md` (2026-05-27). Arc birth commit **`8f8dc2a`** (2026-05-27 10:01:51, *"Layer 98 §LIX: HR + KS — The Road to Kesra opens"*).
**Verified:** 2026-08-12 (§DOC-02ai) against `play.html` @ `29c8a35` — 38,712 lines, 416 nodes, 2,853 quests
**Status:** ✅ **BUILT — 14 nodes, 18 quests, 23 state flags, 13 of 14 nodes reachable.** Coverage of the source: **14 of 38 specified stops (37 %)**. The arc's naming policy shipped **half-applied** and has been that way for 75 days.

---

## Abstract

This document is not a specification and never was. It is a **primary-source reference** — the historical and scriptural research from which the §FUTURE-01 Saul-to-Paul arc was written, organised as 38 travel "nodes" from Tarsus to Rome. It names no engine symbol and asserts nothing about `play.html`, which makes it the first document in the §DOC-02 program that cannot be scored for accuracy against HEAD at all.

So the delta table runs the other way. Instead of *"did its claims survive?"* the question is **"of the 38 stops it researched, which became world?"** — and, for the one section where the document stops being history and starts making design promises (§FLAGGED DETAILS: Game Designer's Special Index), *"which promises became mechanics?"*

Both answers are measured below. The arc shipped, it is nearly all reachable, and it is faithful to this document in a way that turned out to be expensive: **the two numbers this reference quotes most memorably — three days blind at Damascus, fifteen days with Peter at Jerusalem — were implemented as literal in-game days, and together they cost 37 % of a 49-day world.**

> *"When I am weak, then am I strong."* The engine agrees, and charges eighteen nights for the privilege.

---

## I. What this document is, and how it was verified

Five instruments applied; three carried the increment:

- **Instrument 18 (dating).** The file carries no date, no `§` tag, no status line and no cross-references — the only report in 107 with no header block at all. It was dated from its subject: the arc was born at `8f8dc2a` (2026-05-27) and its sibling vignette spec is dated the same day.
- **Instrument 7 (corpus).** The sibling `lab-report-saul-paul-vignette-spec.md` shares this report's mtime block and its subject. Read against each other they explain a defect neither can show alone (§III).
- **Instrument 4 (`git log -S`).** Separates *retired* from *never shipped*. It is what proves the fictional place names were **built and then reverted**, not merely proposed.
- **Instrument 19 (reachability).** A shipped node is not a reachable node. Scored per cell in §IV.
- **Instrument 6 (both directions).** The Design Index's promises are scored against HEAD, and HEAD is the reference for whether a specified mechanic exists.

**What was deliberately not attempted:** this pass makes no claim about the report's scriptural accuracy. Acts 9:19 does not live in this repository, cannot rot, and is outside the program's competence. Where the document reads a source (*"the 'we' passages begin here"*, *"πολιτάρχης — a title confirmed by inscriptions"*), it is left as written. **The corpus rule that applies is instrument 27's: a citation carries no evidential weight — but neither does an unverifiable challenge to one.**

---

## II. Design intent — an Acts arc inside a 1367 dungeon crawl

### A. Why it is here

codexofconquest is a D&D Fighter walking a 90×360 world under a 49-day doom clock. Nothing in that premise wants a first-century missionary. The arc exists because of what it does to the **verb set**.

Every other track in the game resolves through the same three motions: fight it, roll against it, or carry it somewhere. The Saul arc is the only content built around a protagonist whose defining actions are **being blinded, being vouched for, being stoned and getting up, and writing letters** — none of which the combat engine can express. It forces the game to prove that its declarative quest VM can carry a scene where nothing is defeated.

### B. What it buys the player, concretely

1. **A conversion the engine actually models.** `` `of Tarsus fell.@31337` `` is a `NODE_PANELS` entry with `once:'saulConverted'` — it fires exactly once, on arrival, and every downstream surface in the arc reads that flag. The player does not choose it and cannot repeat it. That is the only irreversible identity change in the game.
2. **The name change as a diegetic event.** `` `He is called Paul here for the first time.@31332` `` fires on the first post-commission arrival at Antioch and never again. The panel's own closing line — *"He will be called Saul again once, by someone who does not know the road. It will not fit."* — is the whole character design in one sentence, delivered as UI.
3. **Two real day-clock mechanics in a game that mostly ignores time.** Three sleeps blind at Damascus; fifteen at Jerusalem. The doom clock is normally a background pressure; here it is the mechanic. (Whether fifteen is the *right* number is §VII.)
4. **A failure state that is not death.** `` `story-lt-stoning@31339` `` sets HP to 1 and refuses healing above 1 while in Lystra. The player is not killed and is not restored — they are left at the floor and asked to walk out. *"He got up and went back into the city."*
5. **A permanent status the player carries to the end screen.** `` `Thorn (Permanent)@37659` `` on the character sheet, gated on `saulConverted`, quoting 2 Cor 12:9. What it does is §VI.

### C. The arc's own thesis, restated

The source document's structural section names three patterns, and the engine kept the first two:

- **The Rejection Pattern** — synagogue → welcome → response → opposition → pivot → expulsion. *"So regular it could be mechanized as a game loop."* It was: `hellenistsThreaten`, `stoningEvent`, `demetriusRiotEscaped` and `ezzirConfronted` are four instances of one shape.
- **The Legal Escalation Arc** — each imprisonment reaches a higher authority. Shipped as the Philippi → Rome spine (`quest_prison_phillam` → `quest_rome_arrest`).
- **The Two-Front Threat** — simultaneous hostile forces with incompatible motives. **Not shipped as a mechanic**; every arc quest has one opposition.

---

## III. THE FINDING — a naming policy applied to places and not to people

The sibling vignette spec opens with: *"All proper nouns use the fictionalized names from `plan.md §FUTURE-01 Name Translation Table`."* The arc was built that way. `git show 8f8dc2a` has it in the world:

```
HR:{ num:84, code:'HR', name:'herath', label:'Herath — Lower Court'  }
KS:{ num:85, code:'KS', name:'kesra',  label:'Kesra — Lower City'    }
```

At **`c1d5a94`** (2026-05-29 22:45, *"story books"*) every place reverted to history. **Every person did not.** Measured at HEAD:

| Class | Policy in force | Count | Evidence |
|---|---|---|---|
| **Places** | **History** | **13 of 13** | Jerusalem 48 · Damascus 55 · Antioch 43 · Athens 42 · Malta 24 · Arabia 19 · Cyprus 15 · Lystra 13 · Corinth 12 · Ephesus 11 · Philippi 10 · Tarsus 9 · Rome 93 |
| Fictional place names | **retired** | **0 of 5** | `Herath` · `Kesra` · `Tarsis` · `Aethon` · `Phillam` — all **0 occurrences** |
| **People** | **Fiction** | **7 of 7** | `Barnach` 23 · `Timael` 17 · `Ezzir` 13 · `Anath` 8 · `Silar` 8 · `Lyra` 8 · `Joach` 5 |
| **The protagonist** | **History** | — | `Paul` 52 · `Saul` 7 |

So the shipped world is one in which **Saul of Tarsus walks the road from Jerusalem to Damascus and has his sight restored by a man named Anath.** Fourteen of twenty-one proper nouns are historical; seven are not; and the document that authorised the split — `plan.md §FUTURE-01` — **was deleted by `5e48dd7`.** These two lab reports are now the only surviving record of the policy, which is the argument for this rewrite existing at all.

**The reversion also left fossils, in four different registers**, none of which any gate can see:

| Register | Fossil | Live target |
|---|---|---|
| Engine comments | `// ── §LIX: Jerusalem + Damascus`, and the `KS`/`LT`/`AO` shorthand around it | `DAM` · `KYA` · `HTY` |
| DOM element ids | `` `story-ks-conversion@31334` `` · `` `story-lt-stoning@31339` `` · `` `story-ao-namechange@31329` `` | same |
| State field names | `` `saulConverted: false, blindDaysKS: 0@23175` `` · `barnachVouchedHR` · `hrHellenistDays` | `DAM` · `JRS` |
| Quest ids | `quest_shipwreck_melta` · `quest_snake_melta` | Malta |

None is a defect — `KS`, `HR`, `LT`, `AO` were never `NODE_MAP` keys after `c1d5a94`, so nothing resolves wrongly; `check:noderegs` phase 6 is comment-aware **by design** and DOM ids are not node references. They are recorded because a future reader will otherwise reconstruct a node map that does not exist.

**One straggler is player-facing, and it is in the arc's best scene.** `quest_stoning_lystra`'s `passText` reads *"The road northeast runs out of **Lythros** past the south gate marker"* (`` `runs out of Lythros@11417` ``) — one occurrence in 38,712 lines, standing at a node labelled *Lystra — The East Gate*. Its origin is exact: the vignette spec's Voice Rule 3 says *"After the stoning at Lythros: he gets up."* The passText was transcribed from the spec verbatim, and the transcription carried a retired identifier through the rename with it.

> ***The lesson, and it generalises past this arc: a verbatim copy is faithful to the source's ERRORS and to its RETIRED VOCABULARY, and a rename pass that greps the world will not find the word sitting inside a quest's prose.***

---

## IV. Coverage — 38 source stops → 14 world nodes

The document's nodes are **design** nodes, not `NODE_MAP` codes. The mapping, measured:

| Source stop | Shipped as | Cell | Primary? |
|---|---|---|---|
| 00 Tarsus (origin) · 05 Tarsus (silent years) | `` `ADA:{ num:87, code:'ADA'@8463` `` *Tarsus — The Tentmaker's Quarter* | 33,215 | ✅ alone |
| 01 Jerusalem (persecutor) · 04 Jerusalem visit #1 · 17 Council · 33 arrest | `` `JRS:{ num:84, code:'JRS'@8443` `` *Jerusalem — Lower Court* | 38,215 | ✅ first of 5 |
| 02 Damascus Road · 03 Damascus (Ananias, basket) | `` `DAM:{ num:85, code:'DAM'@8467` `` *Damascus — Lower City* | 36,216 | ✅ alone |
| — Arabia (Gal 1:17, flagged as an Acts omission) | `` `RUH:{ num:86, code:'RUH'@8472` `` *Arabia*, `sleepCost:0` | 45,226 | ✅ alone |
| 06 Antioch (base) · 07 commissioning · 16 report · 18 the split | `` `HTY:{ num:88, code:'HTY'@8458` `` *Antioch — The Mixed Quarter* | 33,216 | ✅ first of 2 |
| 08 Salamis · 09 Paphos | `CI2` *Cyprus — Harbor District* | 35,213 | ✅ first of 2 |
| 13 Lystra (stoning) · 19 Lystra (Timothy) | `KYA` *Lystra — The East Gate* | 32,212 | ✅ alone |
| 22 Philippi | `KVA` *Philippi — The River Quarter* | 29,204 | ✅ alone |
| **25 Athens / the Areopagus** | `` `ATH:{ num:92, code:'ATH'@8487` `` *Athens — The Market Hill* | **32,203** | 🔴 **NON-PRIMARY** |
| 26 Corinth | `ZTH` *Corinth — The East Harbor* | 32,200 | ✅ alone |
| 28 Ephesus (three years) | `EF2` *Ephesus — The Silver Quarter* | 32,207 | ✅ alone |
| 35 shipwreck | `` `SEA:{ num:97, code:'SEA'@8477` `` *The Inner Sea* | 32,203 | ✅ (and see below) |
| 36 Malta | `MLA` *Malta — The Shore* | 34,194 | ✅ alone |
| 37 Rome | `FCO` *Rome — House Arrest* | 28,192 | ✅ first of 3 |

**Not built — 12 named cities and 3 itineraries:** Perga · Pisidian Antioch · Iconium · Derbe · Troas (both visits, including Eutychus and the Macedonian vision) · Thessalonica · Berea · Miletus (the farewell speech) · Caesarea (two years before Felix) · Assos/Mitylene/Chios/Samos · Cos/Rhodes/Patara/Tyre/Ptolemais · Syracuse/Rhegium/Puteoli. Each has **0 occurrences** in the file.

**One survives as a letter destination rather than a place.** Thessalonica's single occurrence in 38,712 lines is inside the Corinth workshop scene: *"He writes letters in the evenings. Some go to Thessalonica."* The document's §NODE 26 established that 1–2 Thessalonians were written **from Corinth**; the engine kept the geography by putting it in a quote instead of on the map. That is the correct compression, and worth naming as a technique: **when a stop cannot afford a node, it can still afford a sentence at the node that references it.**

**Two selections are worth defending.** The document's single most-flagged divergence — §NODE 03's *"KEY DESIGN NOTE — The Arabian Interlude"*, the three-year gap Acts omits entirely and Galatians asserts — is the one stop that got a **node of its own** (`RUH`, and it is the only free rest in the arc, `sleepCost:0`). Meanwhile the whole return leg of the first journey, four cities across two sections, got nothing. **A source's flagged uncertainty is a better predictor of what becomes content than its narrative volume.**

### Reachability (instrument 19)

**13 of 14 nodes are `list[0]` in their cell and render. `ATH` is not.** Cell `32,203` holds **seventeen** nodes — the same cell §DOC-02u measured for §SIREN-01 — and `CELL_GRID` builds each cell in `NODE_MAP` declaration order, so the primary is whichever was declared first. `` `SEA:{r:32,c:203}@9774` `` is declared at line 8477; `` `ATH:{r:32,c:203}@9786` `` at 8487. **Athens is blocked by the arc's own sea node, ten lines earlier in the same authored block.**

Consequences, all measured: `quest_areopagus` carries `activateNode:'ATH'` and therefore **cannot activate**, so the Areopagus speech — the scene this document analyses at greatest length, and the only speech in the arc calibrated for a non-Jewish audience — never fires; `ATH` is `sleep:true, sleepCost:5`, so a checkpoint that can never be set; and a player walking to Athens arrives at *The Inner Sea*, a shipboard scene, on dry land in Achaia.

This is **already on the books** — `ATH`←`SEA` was recorded by §DOC-02r and §DOC-02z under §AUDIT-03x. What this pass adds is *which* content it costs. **It is also the cheapest instance in that whole row**, because both nodes belong to one block and the fix is a two-line reorder rather than a design call about locales.

---

## V. As-built inventory

**18 quests**, all UQF-1.0, all under `QUEST_DB`:

`quest_road_damascus` · `quest_anath` · `quest_basket_damascus` · `quest_hellenists_jerusalem` · `` `quest_barnach_finds: { id:'quest_barnach_finds'@11345` `` · `quest_antioch_commission` · `quest_ezzir` · `quest_governor_cyprus` · `quest_lame_lystra` · `quest_stoning_lystra` · `quest_philippi` · `quest_prison_phillam` · `` `quest_areopagus: { id:'quest_areopagus'@11461` `` · `quest_corinth_letters` · `quest_ephesus_riot` · `quest_shipwreck_melta` · `quest_snake_melta` · `quest_rome_arrest`

**23 state flags** in one contiguous `_S_DEFAULTS()` block (`` `saulConverted: false, blindDaysKS: 0@23175` ``), split §LIX–§LXIII / §LXV–§LXIX. **Every one has at least one reader except `silarJoined`** — see §IX.

**14 terrains** under `` `Mediterranean Real-World Locations (§FUTURE-01 Saul to Paul arc)@6366` ``, each with its own monster roster (Damascus draws djinn/ifrit/genie; Tarsus draws boar/panther/basilisk).

---

## VI. The Design Index — which promises became mechanics

This is the only section of the original that makes claims the repo can adjudicate. Scored:

| Promise | Original wording | HEAD |
|---|---|---|
| **The Thorn in the Flesh** | *"a mechanical debuff that cannot be removed — three prayer attempts failed"* | 🔴 **A CAPTION.** `` `Thorn (Permanent)@37659` `` renders on the character sheet under `saulConverted` with the 2 Cor 12:9 quote beneath it. **There is no debuff.** No stat penalty, no roll modifier, no reader anywhere in 38,712 lines. |
| **Roman citizenship** | *"a key mechanical asset"*, invoked three times, the third consuming it | 🔴 **NOT SHIPPED.** No citizenship flag, no invocation, no legal-protection effect. `quest_prison_phillam` resolves the Philippi jail on a skill check with no appeal to status. |
| **Tentmaking** | five source references; economic independence as policy | ⚠️ **PARTIAL — flavour, not economy.** `` `loot:'Tentmaking Tools'@8465` `` at Tarsus, plus the Corinth workshop scene. It never earns gold and never offsets a cost. |
| **Meals and food** (6 catalogued) | the Eucharistic echo at the shipwreck; the jailer's midnight meal | ⚠️ **Narrative only.** Present in prose; no food, hunger or shared-meal mechanic. |
| **Companion NPC roster** (13) | Barnabas, Silas, Timothy, Luke, Priscilla & Aquila, John Mark, Aristarchus, Trophimus, Erastus, Mnason, Philip, Onesimus, Titus | ⚠️ **5 of 13.** Barnach · Silar · Timael · Prisca & Akil. The other eight have **0 occurrences**. |
| **Hostile roster** (7) | Bar-Jesus, Demetrius, the slave girl's owners, the Sanhedrin, the 40 conspirators… | ⚠️ **2 of 7** as characters (`Ezzir`; Demetrius as `demetriusRiotEscaped`). |
| **The Rejection Pattern** | *"so regular it could be mechanized as a game loop"* | ✅ **Four instances of one shape** — see §II.C. |

**The Thorn is the sharpest result and it belongs to a known cluster.** §AUDIT-03v/w/y(b) collects player-facing strings that name a mechanical effect nothing implements; every prior member **promised the player something** (a free room, a 20-gold bribe, a +5 ATK buff). This is the first that promises a **penalty**. A player reading *"Thorn (Permanent)"* on their own character sheet concludes they are carrying a permanent debuff and plays around a number that does not exist. **The cluster's detector must scan for named effects in both directions, not just for unpaid rewards.**

> The document's own line: *"It defines Paul's ministry posture: 'when I am weak, then am I strong.'"* At HEAD he is neither.

---

## VII. The fifteen-day wall — fidelity as a cost

Two of this document's most quotable numbers were implemented literally, as sleeps:

- **§NODE 03, Acts 9:9 — *"Three days without sight, eating nothing, drinking nothing."*** → `` `S_story.blindDaysKS = (S_story.blindDaysKS || 0) + 1;@36273` ``, incremented on each sleep at `DAM` while converted and unhealed. Anath arrives on day 3. `DAM` is `sleepCost:3`. **Cost: 3 days, 9 gold.**
- **§NODE 04, Gal 1:18 — *"he abode with him fifteen days."*** → `` `if (S_story.hrHellenistDays >= 15) S_story.hellenistsThreaten = true;@36276` ``, incremented on each sleep at `JRS`. `JRS` is `sleepCost:5`. **Cost: 15 days, 75 gold.**

`quest_barnach_finds` gates on `flags:['hellenistsThreaten']`, and it is the hinge: it opens Tarsus, which opens the Antioch commissioning, which opens the first journey. **Sixteen of the arc's eighteen quests sit behind those fifteen sleeps.**

The world ends on **Day 49**. This is Act 4 content, so a player reaching it has already spent days getting there. The arc's mandatory floor is **18 sleeps — 37 % of the total world lifespan — plus 84 gold**, before any of it is optional.

**Nothing here is a bug.** Every line does exactly what it was written to do, the counters are read, the gates resolve, and no test fails. It is a **design consequence of faithfulness**: a source reference's most memorable figure is memorable because it is *specific*, and specificity is precisely what does not survive translation into a resource the player must spend.

> ***A number that is load-bearing in the source is not automatically affordable in the game. Fidelity is a budget decision, and this one was never priced.***

Filed as **§AUDIT-03aj** with three options (§IX).

---

## VIII. The historical reference, compressed

The scholarship below is the arc's writing bible and the only surviving record of its research. It is kept, tightened, and **left unadjudicated** — see §I.

**Origin.** Tarsus, Cilicia. Roman citizen by birth (Acts 22:28), so the citizenship predates him. Three registers at once: *"a Hebrew of Hebrews"* (Phil 3:5), Pharisee of Benjamin, and a Greek-educated Diaspora Jew trained under Gamaliel (Acts 22:3). Trade: σκηνοποιός — leather-worker or goat-hair weaver (*cilicium*, named for his province), not necessarily tents. **The skill travels; that is its design value.** Appearance is never described canonically; 2 Cor 10:10 has opponents calling his *"bodily presence weak"*, and the 2nd-century *Acts of Paul and Thecla* gives *"a man small of stature, with a bald head and crooked legs… eyebrows meeting and nose somewhat hooked, full of friendliness"* — plausibly early tradition, since unflattering traits are unlikely inventions.

**Jerusalem, the persecutor.** Stephen's stoning (Acts 7:54–8:1) is the hinge. Saul is the garment-watcher — *"the witnesses laid down their clothes at a young man's feet"* — and Acts 8:1 removes the ambiguity immediately: *"And Saul was consenting unto his death."* He then *"made havoc of the church"* (8:3). He leaves carrying the high priest's letters (Acts 9:1–2), ~240 km north-northeast.

**The Damascus road.** *"Saul, Saul, why persecutest thou me?"* / *"Who art thou, Lord?"* / *"I am Jesus whom thou persecutest."* Midday (22:6), a light *"above the brightness of the sun"* (26:13), blindness, three days without food or drink. Acts tells it **three times** and the versions disagree in detail — the companions hear a sound but see no one (9:7) or see the light but hear no voice (22:9) — which the original correctly reads as a design note rather than an embarrassment: *each retelling emphasises different details for different audiences.*

**Damascus.** Lodged at the house of Judas on the Street called Straight — a real colonnaded Roman street, still partially visible, and the only locatable address in the itinerary. Ananias is told *"he is a chosen vessel unto me"* (9:15) and comes anyway, afraid. First recorded meal follows the baptism (9:19). Escape by basket over the wall, told twice: Acts 9:24–25 blames Jewish conspirators; **Paul's own account (2 Cor 11:32–33) blames the governor under Aretas IV** — the two-front threat, and evidence that the Arabian years (Gal 1:17) had irritated Nabataean authority.

**Jerusalem, visit one.** Barnabas vouches for him (9:27) — *"without Barnabas vouching, Saul had no entry"*, which the engine kept as `barnachVouchedHR`. Fifteen days with Peter (Gal 1:18, ἱστορῆσαι Κηφᾶν, *"to get to know Cephas"*); of the other apostles only James. Escorted out to Caesarea and shipped home when the Hellenists move to kill him.

**Tarsus, ~8–10 silent years.** No narrative record. The third-heaven vision (2 Cor 12:2–4, *"fourteen years ago"* from ~57 CE) lands here, and the thorn (12:7) arrives as its direct consequence: σκόλοψ τῇ σαρκί, *"a stake in the flesh."* Three requests for removal, refused: *"My grace is sufficient for thee."*

**Antioch on the Orontes.** Barnabas travels 160 km to retrieve him. One year of teaching; the first formally mixed church; *"the disciples were called Christians first in Antioch"* — probably a Roman administrative label (*-ianus*). Agabus predicts the Claudian famine, datable via Josephus to ~46–48 CE.

**First journey (~46–48 CE).** Cyprus (Salamis, then Paphos): the proconsul **Sergius Paulus** converts and the sorcerer **Bar-Jesus/Elymas** is struck temporarily blind — *"the mirror is striking: Paul himself was blinded at conversion."* From Paphos onward Acts writes *"Paul and Barnabas"* instead of *"Barnabas and Saul."* Perga: **John Mark deserts**, unexplained, and it ends the partnership two years later. Gal 4:13's *"infirmity of the flesh"* is often placed here — malaria driving him inland to Pisidian Antioch's 1,200 m plateau, so **the Galatian churches were founded during an illness-driven retreat to altitude.** Pisidian Antioch: the fullest synagogue sermon (13:16–41) and the programmatic pivot — *"lo, we turn to the Gentiles."* Iconium: the largest single response, then a stoning plot. **Lystra**: a lame man healed, the crowd calls Barnabas Zeus and Paul Hermes *"because he was the chief speaker"*, the natural-theology refusal (14:15–17, no scripture quoted), then agitators arrive from two cities and Paul is stoned and left for dead. *"He rose up, and came into the city."* Derbe, then a deliberate return **back through every hostile city** to appoint elders.

**Jerusalem Council (~49 CE).** Titus attends as an uncircumcised test case and is not compelled. James rules; the Apostolic Decree issues; *"the right hands of fellowship"* divide the mission territorially. Then **the Antioch incident** (Gal 2:11–14), which Acts omits: Peter withdraws from Gentile tables when *"certain came from James"*, Barnabas follows, and Paul *"withstood him to the face."*

**Second journey (~49–52 CE).** The Mark dispute is παροξυσμός — a medical word for an acute crisis. Barnabas takes Mark to Cyprus and leaves the narrative permanently. Timothy joins at Lystra and is **circumcised as social strategy, not doctrine** — remarkable so soon after the Council. Then navigation by exclusion: forbidden Asia, refused Bithynia, arriving at Troas with no plan until the Macedonian vision — and at Acts 16:10 the narrator switches to **"we."** Philippi: Lydia the purple-seller, first European convert and the first host; the exorcised slave girl and her economically injured owners; the beating, the stocks, the midnight hymns, the earthquake, the jailer's meal — and then the legal move, **citizenship invoked only after the fact**, deliberately, to leave the church protected. Thessalonica: the charge is political — *"there is another king, one Jesus."* Berea: *"more noble… searched the scriptures daily."* **Athens**: the Areopagus address, the one speech that quotes Greek poets and no Hebrew scripture, stopped by the resurrection. Corinth, eighteen months: Aquila and Priscilla, tentmaking, and **Gallio's refusal to adjudicate** (18:14–15) — the single most important chronological anchor in Pauline studies and a de facto Roman precedent that Christianity is an internal Jewish matter.

**Third journey (~53–57 CE).** Ephesus, three years: two of them five hours a day in the hall of Tyrannus, the Sceva brothers (*"Jesus I know, and Paul I know; but who are ye?"*), 50,000 drachmas of magical books burned, and Demetrius's silversmiths rioting for two hours over lost trade in Artemis shrines — economic hostility, not theological. Troas: Eutychus falls from the third storey during a sermon that runs past midnight and is restored. Miletus: the only speech in Acts addressed to Christians, and the only place Paul quotes a Jesus saying found in no gospel — *"It is more blessed to give than to receive."*

**Arrest and Rome.** Jerusalem: the Temple riot, the tribune, Greek then Hebrew, citizenship invoked to stop a flogging (*"But I was free born"*), the Sanhedrin split deliberately on resurrection, the nephew's warning, and a 470-man night escort to Caesarea. Two years before Felix, who *"trembled"* and then waited for a bribe; then Festus; then Agrippa — *"Almost thou persuadest me to be a Christian"* — and the irony Agrippa states himself: *"This man might have been set at liberty, if he had not appealed unto Caesar."* The shipwreck narrative (Acts 27) is the most detailed travel account in ancient literature: the Euroclydon gregale, undergirding the hull, jettisoning cargo then tackle, fourteen days without sun or stars, the meal for **276 people** in Eucharistic language before the wreck, and Julius overruling the soldiers *"willing to save Paul."* Malta: the viper, the reversal from murderer to god, Publius *"the first man of the island"* — a title matched by the inscriptional *primus Melitensium.* Rome: two years in a hired house, *"no man forbidding him"*, and an ending that stops before the verdict.

**Letters by origin** (the table the arc's Corinth scene draws on): 1–2 Thessalonians and Romans from Corinth; 1 Corinthians and the lost "Previous Letter" from Ephesus; 2 Corinthians from Macedonia; the prison epistles — Philemon, Philippians, Colossians, Ephesians — from Rome or an Ephesian imprisonment. **Romans predates the arrest**: it is a statement of intent toward Spain, not a report.

---

## IX. Defects filed

- **§AUDIT-03aj (NEW, 🟡)** — the fifteen-sleep Jerusalem wall (§VII). 16 of 18 arc quests behind 18 mandatory sleeps = 37 % of the 49-day clock, plus 84 gold. **Design call, three options:** (a) reduce `>= 15` to a playable figure and keep the fifteen days in the prose where they cost nothing; (b) let any sleep anywhere advance `hrHellenistDays` once `barnachVouchedHR` is set, so the wait runs concurrently with other play; (c) accept the price and **tell the player**, since nothing currently states that the gate is a day count. **Recommend (b)** — it preserves the number exactly, keeps the doom clock honest, and costs one condition.
- **§FUTURE-01-FU (NEW, 🟡)** — finish or reverse the naming reversion (§III). Places and the protagonist are historical; seven person-names are not; the authorising document is deleted. **Design call**, plus one mechanical sub-item that needs no call: the `Lythros` straggler in `quest_stoning_lystra`'s `passText`. **Recommend finishing the reversion** — 14 of 21 proper nouns already went that way and a half-applied policy is the only outcome that cannot be defended.
- **§DX-02n extended** — `` `S_story.silarJoined = true;@22535` `` is **write-only**: one writer, zero readers. Silas is the source's second-journey partner and the structural replacement for Barnabas; the player recruits him and the engine never consults it. Same class as `ebReturnsCompleted` — it saves, reloads, and is never read, so a round-trip test passes it green.
- **§AUDIT-03v/w/y(b) cluster extended** — `` `Thorn (Permanent)@37659` `` is the cluster's first **penalty** with nothing behind it (§VI). Widens the wanted detector past unpaid rewards to unapplied costs.
- **§AUDIT-03x — consequence recorded, not a new row.** `ATH`←`SEA` was already filed by §DOC-02r/§DOC-02z. This pass names what it costs (`quest_areopagus`, an unreachable `sleep:true` checkpoint) and notes it is the **cheapest instance in the row** — both nodes are in one block, ten lines apart, so a declaration-order swap fixes it without touching the locale design call.

---

## X. File references

| File | Anchor | Content |
|---|---|---|
| `play.html` | `` `Mediterranean Real-World Locations (§FUTURE-01 Saul to Paul arc)@6366` `` | the 14 arc terrains |
| `play.html` | `` `JRS:{ num:84, code:'JRS'@8443` `` … `` `SEA:{ num:97, code:'SEA'@8477` `` | the 14 arc nodes |
| `play.html` | `` `saulConverted: false, blindDaysKS: 0@23175` `` | the 23 arc state flags |
| `play.html` | `` `if (S_story.hrHellenistDays >= 15) S_story.hellenistsThreaten = true;@36276` `` | the fifteen-day gate |
| `play.html` | `` `of Tarsus fell.@31337` `` · `` `He is called Paul here for the first time.@31332` `` | conversion + name change |
| `play.html` | `` `Thorn (Permanent)@37659` `` | the character-sheet caption |
| `lab-report-saul-paul-vignette-spec.md` | — | the fictionalized twin — voice rules and node texts |
| ~~`plan.md` §FUTURE-01 Name Translation Table~~ | — | **DELETED** by `5e48dd7`; these two reports are the only surviving record |

*Historical note: this document carried no header block, no date and no `§` tag. Those are supplied above from the arc's birth commit and its sibling; the body's scriptural citations are preserved as written and were not adjudicated — see §I.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
