<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# quest.md — The Shattered Codex: Master Quest Register

> **Purpose:** Location-organized register of all quests — implemented, planned, and specced. For five-act quest elaborations see `plan.md §DUNGEON-02`. For skill check mechanic spec see `plan.md §DESIGN-03`. For grief arc quests see `plan.md §GR`.

---

## Quest Format

Each quest entry uses the following tags:
- **[SKILL CHECK]** — Ceremonia Roll: d20 + abilityMod + profBonus ≥ DC
- **[BATTLE]** — Gating combat; must win to proceed
- **[ACCOMPLISHMENT]** — Auto-fires on flag condition; no roll needed
- **[✅ LIVE]** — Implemented in HTML
- **[PLANNED]** — Specced, not yet in HTML

---

## BIRKA — Act I (Nodes: BA, SL, IN, TA, bar, CP, CY, CQ, FR, MM)

### City Streets (BA) — NODE 1

| Quest ID | Title | Type | Acts | Reward |
|----------|-------|------|------|--------|
| `quest_courier_release` | "The Released" | [SKILL CHECK] CHA DC 10 | 1 | Map + 50gp + 100 XP | [✅ LIVE §DESIGN-03] |
| `quest_city_watch_patrol` | "The Route" | [ACCOMPLISHMENT] | 1 | 50gp + 150 XP + Yael fav+1 | [✅ LIVE §DESIGN-03] |

**`quest_courier_release` — The Released**
*Node: BA. Trigger: arrive at Node 1 (game start). Object: the courier's body, unclaimed.*
- Act I: [STORY SKILL CHECK] Persuade City Guard to release the courier. CHA DC 10.
  - Pass: Map retrieved, 50gp saved. Fail: Pay 20gp bribe instead (map still retrieved).
- Reward: `Bloodstained Map` + 50gp + 100 XP.

---

### Birka Slums (SL) — NODE 51

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_slums_cleanup` | "The Vermin Pit" | [BATTLE] ×3 | 1 | 80gp + Yael Friendly | [✅ LIVE] |
| `quest_brynn_ledger` | "The Worn Ledger" | [ACCOMPLISHMENT] | 1 | Free lodging + Brynn Friendly | [✅ LIVE] |

---

### The Inn (IN) — NODE 2

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_brynn_firewood` | "The Firewood" | [ACCOMPLISHMENT] | 1 | Brynn fav+1 | [✅ LIVE] |

---

### Tavern (TA) — NODE 3

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_couperin_lute` | "The Lute" | [ACCOMPLISHMENT] | 1 | 40gp + cipher scrap + Quill Friendly | [✅ LIVE] |

---

### Bar District — NODE 4

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_pachelbel_shipment` | "The Sealed Box" | [ACCOMPLISHMENT] | 1 | 60gp + Pachelbel Friendly | [✅ LIVE] |

---

### The Crypt (CP) — NODE 5

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_crypt_survey` | "The Survey" | [SKILL CHECK] WIS DC 12 | 1 | 75gp + 200 XP + `cryptSurveyed` | [✅ LIVE §DESIGN-03] |

**`quest_crypt_survey` — The Survey**
*Node: CP. Trigger: first CP visit. Object: the surveyor's chalk, left by Froberger fifteen years ago.*
- Act I: [STORY SKILL CHECK] Map the second chamber. WIS (Perception) DC 12.
  - Pass: 75gp + 200 XP. Fail: Retry next day — the chalk is still where Froberger left it.

---

### Neon Undercity (CY) — NODE 6

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_pit_training` | "Pit Training" | [BATTLE] ×3 wins | 1 | Pit Legend Token + Weckmann Friendly | [✅ LIVE] |
| `quest_void_below` | "Void Below" | [BATTLE] CY_VOID clear | 1 | EMP Grenade + Scholar's Note + Auros Dear Friend | [✅ LIVE] |
| `quest_pit_debut` | "First Blood" | [ACCOMPLISHMENT] | 1 | 100gp + 250 XP + flavor | [✅ LIVE §DESIGN-03] |
| `quest_d0207_a1–a5` *(design: quest_cy_madness_gate)* | "The Maintenance Plate" | [SKILL CHECK]+[BATTLE] | 5 acts | `cyOriginKnown` + Name Plate item | [✅ LIVE §D02-07] |

**`quest_cy_madness_gate` — "The Maintenance Plate"** *(5-act, see §D02-07)*
*Node: CY. Trigger: first visit. Object: the copper maintenance plate dated 300 years ago.*
1. [STORY SKILL CHECK] WIS Perception DC 10 — notice the plate
2. [STORY SKILL CHECK] WIS Save DC 12 — madness gate (fail = Madness Table d10, flavor only)
3. [STORY GATING BATTLE] Data Wraith — AC 14 / HP 30
4. [STORY SKILL CHECK] INT Arcana DC 13 — decode the cipher
5. [STORY-DRIVING] CHA Persuasion DC 12 — accept the name on the log
- Reward: `Scholar King's Name Plate` (flavor item) + `cyOriginKnown: true`

---

### The Mathematics Pocket (EHZ, ZERO, MONS, CNTR) — NE of the Undercity — §MATH-01

*Four-node walkable pocket anchored on HKG "Neon Undercity" (29,246): EHZ "Event Horizon — Math Station" through the east panel (29,247), ZERO "The Zero Corridor" north of the station (28,247), MONS "The Monster's Manifold" east (29,248), CNTR "Cantor's Attic" northeast (28,248). All five quests are UQF collect quests — the document is the node's first-visit loot; completion fires at the collect node. Gold rides `onComplete` reward bits; XP is the engine's side-quest award. Design: `lab-reports/lab-report-math01-completions.md`.*

| Quest ID | Title | Type | Activate → Collect | Reward | Status |
|----------|-------|------|--------------------|--------|--------|
| `quest_math_01` | "The Number That Means Nothing" | [COLLECT] Zero Treatise | JRS → ZERO | 300gp + 350 XP | [✅ LIVE §MATH-01] |
| `quest_math_02` | "What the Snowflake Knows" | [COLLECT] 12-Symmetry Manuscript | EHZ → MONS | 350gp + 400 XP | [✅ LIVE §MATH-01] |
| `quest_math_03` | "The Quintic's Impossibility" | [COLLECT] Hamadani Failure Record | OST → EHZ | 350gp + 400 XP | [✅ LIVE §MATH-01] |
| `quest_math_04` | "The Counting Quest" | [COLLECT] Counting Document Bundle | JRS → ZERO | 500gp + 500 XP | [✅ LIVE §MATH-01] |
| `quest_math_05` | "The Moonshine Memo" | [COLLECT] Moonshine Memo | MONS → CNTR | 600gp + 600 XP | [✅ LIVE §MATH-01] |

---

### Cat Quarter (CQ) — NODE 77

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_cat_01` | "The New Scratch" | [BATTLE] ×8 cats | 1 | 200gp | [✅ LIVE] |
| `quest_cat_02` | "Beefy Business" | [BATTLE] ×3+drop | 1 | 350gp + Sandy NPC | [✅ LIVE] |
| `quest_cat_03` | "Honcho Problems" | [BATTLE] ×2 boss | 1 | 500gp + Rhinestone Collar | [✅ LIVE] |
| `quest_cat_04` | "When the Tornado Comes" | [BATTLE] Taz Devil | 1 | 750gp + Furball Crown | [✅ LIVE] |
| `quest_cat_05` | "Fat Cats Don't Tip" | [BATTLE] ×4+boss | 1 | 900gp + Don's Signet Ring | [✅ LIVE] |
| `quest_cat_06` | "The Cat-King Cometh" | [BATTLE] Cat-King | 1 | 1500gp + Cat-King's Claw + `catKingDefeated` | [✅ LIVE] |
| `quest_cat_void` | "Void Strays" | [BATTLE] ×5 | 1 | 400gp | [✅ LIVE] |

---

### Fishmonger's Row (FR) — NODE 79

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_la_riva_01` | "What Remains" | [ACCOMPLISHMENT] | 1 | `connieMet` | [✅ LIVE §GR] |
| `quest_la_riva_02` | "The Weight of a Net" | [BATTLE] ×5 + drop | 1 | 500gp + Aldo Friendly | [✅ LIVE §GR] |
| `quest_la_riva_03` | "The Account Book" | [ACCOMPLISHMENT] | 1 | Kenickie Dear Friend + `laRivaComplete` | [✅ LIVE §GR] |

---

### Mimic Meadows (MM) — NODE

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_d0208_a1–a5` *(design: quest_mimic_colony)* | "Colony Curation" | [SKILL CHECK]+[BATTLE if provoked] | 5 acts | 200gp + Mimic's Wax + Baby Mimic + `tribbleGladesFed` | [✅ LIVE §D02-08] |

**`quest_mimic_colony` — "The Dropped Coin"** *(5-act, see §D02-08)*
*Node: MM. Trigger: first visit. Object: a shiny coin dropped by the baby chest mimic.*
1. [STORY SKILL CHECK] WIS Animal Handling DC 10 — pick up coin gently without pocketing
2. [STORY SKILL CHECK] WIS Animal Handling DC 12 — approach napping bookshelf mimic
3. [STORY GATING BATTLE] Mother Mimic AC 16 / HP 60 — triggered ONLY if a mimic was attacked
4. [STORY SKILL CHECK] WIS Animal Handling DC 14 — return coin to baby mimic in front of Mother
5. [STORY-DRIVING] CHA Persuasion DC 10 — accept the pet + name it
- Reward: `Mimic's Cache` + 3× Fuzzy Tribble + `Baby Mimic` item + `mimicPetName`

---

### Ceremonia Arc — Yael Scheidemann (LHR, BMA)

| Quest ID | Title | Node | Type | DC | Status |
|----------|-------|------|------|----|--------|
| `quest_ceremonia_yael_01` | "The Watch" | LHR | [SKILL CHECK] CHA | 10 | [✅ LIVE §DESIGN-03] |
| `quest_ceremonia_yael_02` | "The Route" | LHR | [SKILL CHECK] WIS | 12 | [✅ LIVE §DESIGN-03] |
| `quest_ceremonia_yael_03` | "The Crate" | BMA | [SKILL CHECK] STR | 12 | [✅ LIVE §DESIGN-03] |
| `quest_ceremonia_yael_04` | "The Report" | LHR | [SKILL CHECK] CHA | 14 | [✅ LIVE §DESIGN-03] |
| `quest_ceremonia_yael_05` | "The Name" | LHR | [SKILL CHECK] CHA | 15 | [✅ LIVE §DESIGN-03] |

---

## WEIMAR — Act VII (Nodes: NUE `scholars_qtr`, SZG `workshop`)

### Weimar Archive (WM)

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_inquisitor_handshake` + `_questions` + `_final` *(design: quest_inquisitor)* | "The Extended Hand" | [SKILL CHECK]+[BATTLE if lying] | 3-quest gauntlet (NUE) | Archive key + `inquisitorPassed` | [✅ LIVE §D02-02] |
| *(node-woven at NUE — no quest ids; story-render interaction behind the Archive Key, sets `priorCarrierSeen/Spoke`)* | "The Worn Boots" | [STORY] | node interaction | Prior Carrier's Token + `priorCarrierSeen` | [✅ LIVE §D02-03] |

**`quest_inquisitor` — "The Extended Hand"** *(5-act, see §D02-02)*
*Node: WM. Trigger: `wmLowerArchiveUnlocked`. Object: the construct's outstretched hand.*
1. [STORY SKILL CHECK] CHA Persuasion DC 10 — volunteer to sit
2. [STORY SKILL CHECK] WIS Insight DC 12 — answer truthfully (matched against state flags)
3. [STORY GATING BATTLE] Inquisitor Construct AC 14 / HP 30 — triggered by two lies only
4. [STORY SKILL CHECK] CHA Persuasion DC 12 — third question ("Why are you still here?")
5. [STORY-DRIVING] INT Investigation DC 13 — find your own name in the record book

**`quest_prior_carrier` — "The Worn Boots"** *(5-act, see §D02-03)*
*Node: WM cell. Trigger: `inquisitorPassed`. Object: the Prior Carrier's worn boots.*
1. [STORY SKILL CHECK] WIS Perception DC 10 — notice the lock is on their side
2. [STORY SKILL CHECK] CHA Persuasion DC 11 — answer truthfully ("Did the Void open again?")
3. [STORY GATING BATTLE] Void Outrider AC 14 / HP 35 — tracking the Prior Carrier
4. [STORY SKILL CHECK] WIS Insight DC 12 — understand what the token means
5. [STORY-DRIVING] CHA Persuasion DC 13 — "How do you know my name?"

---

### Scholar King's Workshop (WK) — NODE

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_d0206_a1–a5` *(design: quest_scholar_workshop)* | "The Blueprint Roll" | [SKILL CHECK]+[BATTLE/SPIRIT] | 5 acts | Prototype Wand + `aurosBlueprintKnown` + `scholarWorkshopComplete` | [✅ LIVE §D02-06] |

**`quest_scholar_workshop` — "The Blueprint Roll"** *(5-act, see §D02-06)*
*Node: SW. Trigger: first SW visit. Object: blueprint roll — plans for Auros's armor.*
1. [STORY SKILL CHECK] INT Investigation DC 10 — confirm the blueprint
2. [STORY SKILL CHECK] WIS Perception DC 11 — assess prototype wand stability
3. [STORY GATING BATTLE / SPIRIT] CHA DC 12 OR Spirit combat AC 12 / HP 25 — after second short rest
4. [STORY SKILL CHECK] WIS Insight DC 13 — understand Auros's armor weak point
5. [STORY-DRIVING] CHA Persuasion DC 13 — accept your name on the cover

---

## TILBURY — Act II (Nodes: docks, market_quarter, storefront, merchant_ship)

*(Existing quests live. §SPARK-01 quests below: PLANNED — see plan.md §SPARK-01 for full spec.)*

### §SPARK-01 — The Harmony Chain (📋 PLANNED)

**Arc:** French vignette theater, 2 acts, 5 scenes. Objects created/destroyed as emotional tokens. Friendship chain: cat → mouse → blood tick → mind-control parasite → harmony. Authority figure (Inspector Wren-Pembury) has an impossibly inconsistent backstory — witness protection. Naval component at MS: "Steamboat Who Done It" — the monster is friendly.

| Quest ID | Title | Type | Node | Activation | Completion | Reward |
|----------|-------|------|------|-----------|------------|--------|
| `quest_spark_01` | "Smalt" | [SKILL CHECK] CHA DC 10 | DK | Always at DK | `smaltBefriended=true` | Smalt's Trust (token) + 100gp + 100 XP |
| `quest_spark_02` | "The Overture" | [ACCOMPLISHMENT] | DK | `smaltBefriended` | `pipMet=true` | Pip's Friendship Bead (token) + 150 XP |
| `quest_spark_03` | "Clot's Revelation" | [SKILL CHECK] WIS DC 13 | MS | `pipMet` | `bioluminescentParasiteFound=true` | Clot's Glow (1-use torch) + 200gp + 200 XP |
| `quest_spark_04` | "The Steamboat Who Done It" | [SKILL CHECK] INT DC 14 | MS | `bioluminescentParasiteFound` | `whodunitSolved=true` | Letter of Safe Passage + 300gp + 300 XP |
| `quest_spark_05` | "Aldous Comes Clean" | [ACCOMPLISHMENT] | DK | `whodunitSolved` + `wrenpemburyInconsistencyNoticed` | `aldousConfessed=true` | 400gp + 400 XP + Aldous recurring ally |

**`quest_spark_01` — "Smalt"** *(Scene 1: The Problem)*
*Node: DK. Trigger: always available at Harbor Docks. Object: Smalt's Trust (dried salt fish).*
- Inspector Wren-Pembury presents his King's Writ (Counterfeit). The harbor cat Smalt has been sitting on cargo manifests since Tuesday. The Inspector wants it removed.
- Act I: [STORY SKILL CHECK] CHA Persuasion DC 10 — befriend the cat. (On fail: Smalt bites for 1 damage, memorable; retry allowed. The Inspector looks vindicated. On pass: Smalt drops Smalt's Trust and begins following.)
- Act II: [ACCOMPLISHMENT] Inspector is displeased; backstory claim #1 delivered: "The Pembury estate, Eastern Reach, three hundred years."
- Act III: No battle. Smalt as the "obstacle" is defused by kindness.
- Act IV: Smalt's Trust created. First link in the chain.
- Act V: Inspector says *"This resolves nothing officially."* He is wrong.
- **Reward:** Smalt's Trust (quest token, destroyed in Scene 2) + 100gp + 100 XP.

**`quest_spark_02` — "The Overture"** *(Scene 2: The Unlikely Alliance)*
*Node: DK/MQ boundary. Trigger: `smaltBefriended`. Object: Pip's Friendship Bead (gnawed wooden bead).*
- Smalt leads the player to Pip the dock mouse. A cat and a mouse, sitting together near the MQ entrance.
- Act I: [ACCOMPLISHMENT] Meet Pip. The alliance is presented without explanation.
- Act II: Inspector reappears (tracking the Writ). Mentions his father "the Admiral." [INT DC 12 optional check — `wrenpemburyInconsistencyNoticed=true` — no fail state, retry until noticed]
- Act III: No battle. Pip's presence is the obstacle resolved by acceptance.
- Act IV: Pip gives the player its gnawed bead. Smalt eats the Smalt's Trust (endorsement of the alliance). Token: Smalt's Trust destroyed; Pip's Friendship Bead created.
- Act V: Vendor Mira, if encountered, notes "the calm mouse" with mild recognition.
- **Reward:** Pip's Friendship Bead (token, handed to Inspector in Scene 5) + 150 XP.

**`quest_spark_03` — "Clot's Revelation"** *(Scene 3: The Revelation)*
*Node: MS. Trigger: `pipMet`. Object: Clot's Glow (bioluminescent pustule from the blood tick Clot).*
- Pip travels with the player to the Tilbury Star. Brannick the rat catcher is in the hold, surrounded by rats who are not behaving like rats.
- Act I: [STORY SKILL CHECK] WIS Medicine/Nature DC 13 — examine the blood tick Clot on Pip's ear. On pass: Clot detaches cleanly; the pustule glows amber; The Warmth is identified as a colonial microorganism producing social bonding chemistry.
- Act II: [ACCOMPLISHMENT] Brannick testifies: *"They never bit me once."* The cargo hold smells unusual.
- Act III: No battle. The "monster" is first identified here — it is not hostile.
- Act IV: Clot's Glow created (1-use item: warm amber light, 30ft radius, 1 hour). Inspector appears on deck, mentions "Saltwick" unprompted — backstory claim #3.
- Act V: The Warmth is named. The mystery is not yet solved — the perfumes need investigation.
- **Reward:** Clot's Glow + 200gp + 200 XP.

**`quest_spark_04` — "The Steamboat Who Done It"** *(Scene 4: The Mystery)*
*Node: MS. Trigger: `bioluminescentParasiteFound`. Object: Letter of Safe Passage (from the captain, for solving the mystery).*
- The captain reports the imported perfume cargo has spoiled. Commercially useless. Smells "warm and extremely personal." She wants answers before port.
- Act I: [STORY SKILL CHECK] INT Investigation DC 14 — trace the Warmth colony: Clot → Pip's wandering → warm perfume vats → full colony bloom. The "murder victim" (the perfumes) was ruined by friendship.
- Act II: [ACCOMPLISHMENT] Brannick confirms the timeline. The rats are witnesses. The Inspector is aboard.
- Act III: No battle. The confrontation is with the Inspector: three inconsistent claims now on record. The player faces the mystery's human layer.
- Act IV: [ACCOMPLISHMENT] `whodunitSolved=true`. The captain accepts the explanation. The Warmth colony is not destroyed — it is transferred (in a sealed jar) to the player.
- Act V: Inspector, watching the resolution, says: *"You solved it without removing anything."* He is thinking about himself.
- **Reward:** Letter of Safe Passage (future gate use at port nodes) + 300gp + 300 XP.

**`quest_spark_05` — "Aldous Comes Clean"** *(Scene 5: The Confession)*
*Node: DK. Trigger: `whodunitSolved` + `wrenpemburyInconsistencyNoticed`. Object: Letter of True Passage (Aldous writes it).*
- The player confronts Aldous with the three inconsistencies: the Estate, the Admiral, Saltwick. No roll required. The player presents the evidence. Aldous has watched the player show kindness to a cat, make an alliance with a mouse, examine a tick without disgust, and solve a mystery by recognizing the monster was friendly. He cannot maintain the performance.
- Act I: [ACCOMPLISHMENT] Aldous tears the King's Writ (Counterfeit). Token destroyed.
- Act II: [ACCOMPLISHMENT] He returns Pip's Friendship Bead to the player ("I understand why you should have this"). Token transferred back.
- Act III: No battle. The confession is the climax.
- Act IV: [ACCOMPLISHMENT] He writes the Letter of True Passage (his real authority document, valid). Token created.
- Act V: *"My name is Aldous. I have contacts in six ports. If you need something that isn't on any manifest, I am who you speak to."* `aldousConfessed=true`. Aldous becomes a recurring ally NPC at DK.
- **Reward:** Letter of True Passage + 400gp + 400 XP + Aldous recurring ally (black market contacts in Tilbury, Visby, Malta).

---

**The Harmony Chain — complete arc reward:** All five links closed (Smalt + Pip + Clot + The Warmth + Aldous = five-creature harmony). Bonus flag: `harmonyChainComplete: true`. Future §SPARK arcs recognize this flag and give the player a reputation for kindness to small things.

---

### §SPARK-01 SEA Extension (📋 PLANNED — unscheduled, see plan.md §SPARK-01-H)

A Deep Warmth Eel (CR 4, non-aggressive) at open sea between DK and LW. Three-mile calm radius. Two pirate crews cooperating. Monster hunt: 4-phase structure. Resolution: escort the eel to deeper water. Reward: pirate crews owe a debt; sea route unlocks.

---

## VISBY — Act V (Nodes: alley, sewers, goblin_cave, pirate_cave, bar)

*(Existing quests live.)*

---

## EPIC BATTLEGROUNDS — Approach Quests (✅ ALL LIVE — §D01-01 + §D02)

### Abyssal Scriptorium (AT)

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_d0201_a1–a5` *(design: quest_scriptorium_approach)* | "The Drowned Page" | [SKILL CHECK]+[BATTLE] | 5 acts | Shard path unlock + `scriptorium_approach_complete` | [✅ LIVE §D02-01] |

**`quest_scriptorium_approach` — "The Drowned Page"** *(5-act, see §D02-01)*
*Node: AT approach. Trigger: first AT entry. Object: drowned manuscript page, Froberger's hand.*
1. [STORY SKILL CHECK] INT Investigation DC 10 — recognize Froberger's handwriting
2. [STORY SKILL CHECK] DEX Stealth DC 12 — cross flooded chamber silently
3. [STORY GATING BATTLE] Archivist's Guardian AC 16 / HP 40
4. [STORY SKILL CHECK] INT Arcana DC 13 — decode Scholar King cipher
5. [STORY-DRIVING] CHA Persuasion DC 14 — "What are you here to preserve?"

### Void Shaman's Sanctum (BK)

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_d0205_a1–a5` *(design: quest_void_maze)* | "The Chalk Mark" | [SKILL CHECK]+[BATTLE] | 5 acts | `mazeSolvedChecks: 3` + boss room unlocked | [✅ LIVE §D02-05] |

**`quest_void_maze` — "The Chalk Mark"** *(5-act, see §D02-05)*
*Node: BK approach — Void Fracture Maze. Object: chalk mark on the first wall.*
1. [STORY SKILL CHECK] DEX Sleight of Hand DC 10 — mark holds (auto 1 check)
2. [STORY SKILL CHECK] WIS Survival DC 14 — first wall shift
3. [STORY GATING BATTLE] Void Construct AC 15 / HP 40 — defeat auto-completes check 3
4. [STORY SKILL CHECK] INT Arcana DC 14 — read void runes on final panel
5. [STORY-DRIVING] STR/DEX Athletics DC 12 — dash through closing wall

### (Arcane Inversion Zone — AT mid-chamber or CY_VOID)

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_d0209_a1–a5` *(design: quest_void_flux)* | "The Spell Scroll" | [SKILL CHECK]+[BATTLE] | 5 acts | Dual-use scroll + `voidFluxCleared` | [✅ LIVE §D02-09] |

**`quest_void_flux` — "The Spell Scroll"** *(5-act, see §D02-09)*
*Node: AT mid-chamber or CY_VOID. Object: a spell scroll in the player's pack.*
1. [STORY SKILL CHECK] INT Arcana DC 10 — recognize inversion field
2. [STORY SKILL CHECK] INT Arcana DC 12 — choose immunization
3. [STORY GATING BATTLE] 3× Void-flux constructs AC 14 / HP 20
4. [STORY SKILL CHECK] INT Arcana DC 13 — stabilize the changed scroll
5. [STORY-DRIVING] DEX Acrobatics DC 12 — dash through rebound window

---

## COSMIC REALM — Act VIII (Node: CO)

### Sacrifice Gates — Catacombs Approach

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_d0204_a1–a5` *(design: quest_memory_gate)* | "The Journal Entry" | [SKILL CHECK]+[BATTLE bypass] | 5 acts | Passage + `memorGatePassedEntry` | [✅ LIVE §D02-04] |

**`quest_memory_gate` — "The Journal Entry"** *(5-act, see §D02-04)*
*Node: CO approach — catacombs. Object: a journal entry, chosen to be offered.*
1. [STORY SKILL CHECK] INT Arcana DC 10 — read the rune inscription
2. [STORY SKILL CHECK] WIS Insight DC 12 — identify which entry to surrender
3. [STORY GATING BATTLE] Gate Guardian AC 15 / HP 45 — bypass path if refusing to pay
4. [STORY SKILL CHECK] CHA Persuasion DC 13 — "I give this freely"
5. [STORY-DRIVING] INT Investigation DC 12 — examine the room on the other side

### Codex Core Chamber — Pre-Boss

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_d0210_a1–a5` *(design: quest_loop_heart)* | "The Seventh Shard" | [SKILL CHECK]+[BATTLE] | 5 acts | Shard + ending variant set + `codexCoreChosen` | [✅ LIVE §D02-10] |

**`quest_loop_heart` — "The Seventh Shard"** *(5-act, see §D02-10)*
*Node: CO pre-boss chamber. Object: the seventh Shard inside the pulsing column.*
1. [STORY SKILL CHECK] WIS Perception DC 10 — sense the room's history
2. [STORY SKILL CHECK] INT Arcana DC 12 — read the three paths and their costs
3. [STORY GATING BATTLE] Commander Auros AC 22 / HP 300 / ATK+12 (or STR DC 15 Destroy bypass)
4. [STORY SKILL CHECK] Choice-dependent (WIS DC 12 / CHA DC 17 / none)
5. [STORY-DRIVING] CHA Persuasion DC 12 — Sweelinck's Last Question; honest answer passes

---

## THE SAUL→PAUL ARC — Act IV (§LIX–§LXIX + §PAUL-01)
*(Live nodes: JRS, DAM, RUH, ADA, HTY, CI2, KYA, KVA, ATH, EF2, ZTH, MLA, FCO — design-era codes HR/KS/DR/TS/AO/LT/PL/AE/KR/EF/MT/ST from `lab-report-saul-paul-vignette-spec.md` shipped under real-world names. Full-chain doc sync 2026-07-07 (§FUTURE-01 audit): the 13 conversion-chain/Malta quests below were live but undocumented.)*

Skill checks use the Ceremonia Roll system; accomplishment quests complete on `S_story` flags set by node arrival (`storyRender` — the DAM conversion, the MLA snake), NPC first-interaction mutations (`NPC_DIALOGUE` quoteFn ladders — Anath, Barnach), or the sleep-day counters (`storyConfirmSleep` — 3 blind days at DAM, 15 Hellenist days at JRS). The conversion is the availability rewrite: every quest below (except the opener) is flag-gated downstream of `saulConverted`, set on first DAM arrival. Post-conversion, `Thorn (Permanent)` appears on the character sheet — no mechanical penalty, no tooltip, no removal quest.

| Quest ID | Title | Type | Check | DC | Pass Flag | XP | Status |
|----------|-------|------|-------|----|-----------|----|--------|
| `quest_road_damascus` | "The Light at Noon" | [ACCOMPLISHMENT] | — | — | `saulConverted` | 200 | [✅ LIVE §LIX — JRS→DAM; needs Three Jerusalem Warrants] |
| `quest_anath` | "The House on the Lower Road" | [ACCOMPLISHMENT] | — | — | `anathSightRestored` | 300 | [✅ LIVE §LIX — DAM; 3 blind sleep-days, Anath arrives day 3] |
| `quest_basket_damascus` | "Over the Wall" | [SKILL CHECK] | STR Athletics | 12 | `escapedDamascus` + `basketRopeComplete` | 150 | [✅ LIVE §LX — DAM; retryable, 1-day gate] |
| `quest_hellenists_jerusalem` | "Fifteen Days" | [ACCOMPLISHMENT] | — | — | `hellenistsThreaten` | 150 | [✅ LIVE §LXI — JRS; 15 sleep-days after Barnach vouches] |
| `quest_barnach_finds` | "A Year Looking" | [ACCOMPLISHMENT] | — | — | `barnachFoundPaul` | 100 | [✅ LIVE §LXI — ADA (Tarsus)] |
| `quest_antioch_commission` | "The Sending" | [ACCOMPLISHMENT] | — | — | `commissionReceived` | 150 | [✅ LIVE §LXII — HTY] |
| `quest_ezzir` | "The Sorcerer's Opposition" | [SKILL CHECK] | WIS Insight | 14 | `ezzirConfronted` | 200 | [✅ LIVE §LXIII — CI2; retryable, 1-day gate] |
| `quest_governor_cyprus` | "The Governor Listens" | [SKILL CHECK] | CHA Persuasion | 11 | `govCopperConverted` | 250 | [✅ LIVE §LXIII — CI2; retryable, same-day] |
| `quest_lame_lystra` | "The Gate" | [SKILL CHECK] | WIS Faith | 10 | `lameManHealed` | 200 | [✅ LIVE §LXIV — KYA; non-retryable, fail is narrative] |
| `quest_stoning_lystra` | "Left for Dead" | [SKILL CHECK] | STR Athletics | 13 | `stoningEvent` (both paths; fail → HP capped 1 at KYA) | 150 | [✅ LIVE §LXIV — KYA] |
| `quest_philippi` | "The Purple Merchant" | [ACCOMPLISHMENT] | — | — | `lyraConverted` | 150 | [✅ LIVE §LXV — KVA] |
| `quest_prison_phillam` | "Seven Stairs, Then Five" | [SKILL CHECK] | WIS Insight | 12 | `phillippiJailerConverted` | 200 | [✅ LIVE §PAUL-01 — KVA] |
| `quest_areopagus` | "To An Unknown One" | [SKILL CHECK] | CHA Persuasion | 13 | `areopagusSpeech` | 200 | [✅ LIVE §LXVI — ATH] |
| `quest_ephesus_riot` | "The Silversmith's Meeting" | [SKILL CHECK] | CHA Persuasion | 12 | `demetriusRiotEscaped` | 175 | [✅ LIVE §LXVII — EF2] |
| `quest_corinth_letters` | "Tent Canvas & Letters" | [ACCOMPLISHMENT] | — | — | `corinthLettersWritten` | 200 | [✅ LIVE §LXVIII — ZTH] |
| `quest_shipwreck_melta` | "Two Hundred and Seventy-Six" | [SKILL CHECK] | STR Athletics | 12 | `shipwreckSurvived` | 250 | [✅ LIVE §PAUL-01 — MLA] |
| `quest_snake_melta` | "It Did Nothing" | [ACCOMPLISHMENT] | — | — | `maltaSnakeEvent` | 150 | [✅ LIVE §PAUL-01 — MLA; fires on arrival, no roll, no explanation] |
| `quest_rome_arrest` | "The Rented House" | [ACCOMPLISHMENT] | — | — | `romeArrestBegun` | 300 | [✅ LIVE §LXIX — FCO] |

**Chain order (flag-gated availability, movement never gated):** `road_damascus` (warrants) → `saulConverted` → `anath` → `anathSightRestored` → `basket_damascus` · then `barnachVouchedHR` (JRS Barnach NPC) → `hellenists_jerusalem` → `barnach_finds` → `antioch_commission` → `commissionReceived` → `ezzir` → `governor_cyprus` · `philippi` → `prison_phillam` · `shipwreck_melta` → `snake_melta` → `rome_arrest`. `lame_lystra` → `stoning_lystra` (questsDone gate).

**`quest_philippi` — "The Purple Merchant"** *(Node: KVA — design PL. Object: the purple cloth arranged on the bridge stall.)*
Lyra has been watching from across the bridge for two days before she speaks. When she speaks, it is because she has already decided. NPC first-visit mutation sets `lyraConverted: true`. Quest completes on flag. The earthquake (every door of the city prison opens) is narrated in the NPC text; it is not a separate event.

**`quest_areopagus` — "To An Unknown One"** *(Node: ATH — design AE. Object: the inscription — TO AN UNKNOWN ONE.)*
The altar has been maintained for two hundred years. Paul has been standing in front of it for a long time. CHA Persuasion DC 13: begin with the altar, not with a correction. Pass: Dionysius stays; Damaris stays. Fail: the steward receives the interpretation politely; the council does not invite him to speak.

**`quest_ephesus_riot` — "The Silversmith's Meeting"** *(Node: EF2. Object: the guild meeting notice, larger than the hall.)*
Demetrius's argument is economic and theological simultaneously. The theater fills. CHA Persuasion DC 12: the city clerk reaches the front and names the legal position before the charges can be filed. Pass: the theater empties before dark; the charges are never filed. Fail: Paul leaves Ephesus the next morning.

**`quest_corinth_letters` — "Tent Canvas & Letters"** *(Node: ZTH — design KR. Object: the letters written at night, canvas on the frame behind.)*
Prisca and Akil hire him because he knows the trade. NPC first-visit mutation sets `corinthLettersWritten: true` and delivers the 18-month compressed narrative. Some of the letters written here are the most important things he will ever write. He does not know which ones yet.

**`quest_rome_arrest` — "The Rented House"** *(Node: FCO — design ST. Object: the door that cannot be opened from the inside.)*
Requires `maltaSnakeEvent: true` (Malta arc fires first on arrival at MLA). NPC first-visit mutation by Timael sets `romeArrestBegun: true`. Visitors every day. Letters every night. The arc does not end here. It stops here. Disposition: *"Where are you going next?"*

---

## THE LITTORAL COURTS — Act IV (§SIREN-01)
*(Nodes: LC1, LC2, LC3, LC4, LSO — implemented 2026-05-28)*

Sequential ocean-route arc. Entry: DS.E → LJ0 → LC1 south chain. Four court quests + one parallel Overseer quest. Betrayal mechanic: `checkFailFlag` sets `betrayalThought` / `betrayalWord` / `betrayalDeed` on skill-check fail. Arc-close at LCA reads betrayal count (0 / 1–2 / 3). See `lab-report-littoral-courts.md` for full design record.

| Quest ID | Title | Node | Type | Check | DC | Pass Flag | Fail Flag | XP | Status |
|----------|-------|------|------|-------|----|-----------|-----------|----|--------|
| `quest_aurel_tide` | "The Tidal Schedule" | LC1 | [SKILL CHECK] | WIS Insight | 12 | `aurelTideRead` | `betrayalThought` | 150 | [✅ LIVE §SIREN-01] |
| `quest_calice_bridge` | "The Wheel in the Courtyard" | LC2 | [SKILL CHECK] | INT Investigation | 13 | `caliceBridgeCrossed` | `betrayalWord` | 175 | [✅ LIVE §SIREN-01] |
| `quest_mireille_ami` | "Name Your Standing" | LC3 | [SKILL CHECK] | CHA Persuasion | 14 | `mireilleAmiNamed` | `betrayalDeed` | 200 | [✅ LIVE §SIREN-01] |
| `quest_solen_horizon` | "The Ship That Does Not Come" | LC4 | [SKILL CHECK] | WIS Insight | 13 | `solenSoonRead` | — | 225 | [✅ LIVE §SIREN-01] |
| `quest_sea_overseer` | "The Voice in the Fog" | LSO | [SKILL CHECK] | WIS Insight | 15 | `charmResisted` | `seaOverseerMet` | 250 | [✅ LIVE §SIREN-01] |

**`quest_aurel_tide` — "The Tidal Schedule"** *(Node: LC1 — Port Aurel. Object: the tide table, open on her desk.)*
BUSY (*Occupée*). She reads it while speaking. She speaks while reading it. Every appointment is borrowed from the schedule. WIS Insight DC 12: read that the schedule is calibration, not fact. Pass: you make yourself the appointment; she closes the table; the seal is given. Fail: you wait for the window; `betrayalThought` set; the seal comes eventually.

**`quest_calice_bridge` — "The Wheel in the Courtyard"** *(Node: LC2 — Port Calice. Object: the bridge chain, thick iron links, visible from the window.)*
MAYBE (*Peut-être*). "Perhaps at the evening tide." The wheel mechanism is in the courtyard below. It is not locked. INT Investigation DC 13: find the wheel; cross before the tide. Pass: you turn the wheel; you cross; the perhaps is over. Fail: you wait for the evening; `betrayalWord` set; the crossing happens but you are no longer the person who initiated it.

**`quest_mireille_ami` — "Name Your Standing"** *(Node: LC3 — Port Mireille. Object: the herald at the door, name on his tongue.)*
FRIEND (*Ami*). "My most trusted companion" — said before the herald can speak your name and title. The court nods. The frame is set. CHA Persuasion DC 14: address the court with name and title before the frame holds. Pass: the Lady looks at you differently; the seal is given from a different position. Fail: you counsel the court through the evening; `betrayalDeed` set; the role stays with you.

**`quest_solen_horizon` — "The Ship That Does Not Come"** *(Node: LC4 — Port Solen. Object: the ship on the horizon, three seasons unmoving.)*
SOON (*Bientôt*). She names the ship. The fishermen at the dock have been watching it for three seasons. No one asks them first. WIS Insight DC 13: go to the dock before the court; bring the specific fact back; require a date. Pass: she gives a real date; the letters come with a courier who exists. Fail: you wait; the season passes; the letters arrive eventually by a different path.

**`quest_sea_overseer` — "The Voice in the Fog"** *(Node: LSO — The Fog Bank. Object: the navigator's mouth, speaking in a second register.)*
The Overseer. It has been in the water since Port Aurel, in telepathic contact with the ship's navigator (who is not aware of this). It offers to arrange the fourth court differently. WIS Insight DC 15 (matching Succubus/Incubus charm DC). Pass (`charmResisted`): name the structure flat, without drama; go to the fourth court anyway; the fog lifts. Fail (`seaOverseerMet`): accept the offer; give the specific word at Port Solen; the frame shifts a degree you do not notice.

---

## §CROWN-01 — The Three Crowns of the Swamp [✅ LIVE Layer 105]

9-node arc extending the HS Crones' Domain south (WG0→HCA, c:3). Three Crown domains (Whisper/Glut/Wane) each with 6 quests + 4 junction nodes (3 combat, 1 inn) + arc-close altar. Mechanics: Kindness Meter (`innmotherKindness`), Crone Marks (`croneMarks`), free booking threshold, Mère Boudine name reveal. See `lab-report-crown-three-hags.md`.

| Quest ID | Title | Node | Type | Check | DC | onPass/onComplete | XP | Status |
|----------|-------|------|------|-------|----|----|----|----|
| `quest_whisper_01` | "The Unspoken Request" | HW1 | [SKILL CHECK] | WIS Insight | 12 | `_addCroneMark()` | 150 | [✅ LIVE §CROWN-01] |
| `quest_whisper_02` | "The Withheld Name" | HW1 | [SKILL CHECK] | INT Investigation | 13 | `_addCroneMark()` | 175 | [✅ LIVE §CROWN-01] |
| `quest_whisper_03` | "The Empty Gift" | HW1 | [SKILL CHECK] | WIS Perception | 12 | `_addCroneMark()` | 175 | [✅ LIVE §CROWN-01] |
| `quest_whisper_04` | "The Absent Warning" | HW1 | [SKILL CHECK] | WIS Insight | 14 | `_addCroneMark()` | 200 | [✅ LIVE §CROWN-01] |
| `quest_whisper_05` | "The Saint's Work" | HW1 | [COMPLETION] | — | — | `whisperSaintSeen`, `_innKindness(1)` | — | [✅ LIVE §CROWN-01] |
| `quest_whisper_06` | "The Forgiven Absence" | HW1 | [SKILL CHECK] | CHA Persuasion | 13 | `_addCroneMark()`, `whisperCrownComplete` | 225 | [✅ LIVE §CROWN-01] |
| `quest_glut_01` | "The Offered Feast" | HG1 | [SKILL CHECK] | WIS Insight | 13 | `_addCroneMark()` | 150 | [✅ LIVE §CROWN-01] |
| `quest_glut_02` | "The Smothering Gift" | HG1 | [SKILL CHECK] | CHA Persuasion | 13 | `_addCroneMark()` | 175 | [✅ LIVE §CROWN-01] |
| `quest_glut_03` | "The Locked Door" | HG1 | [SKILL CHECK] | INT Investigation | 14 | `_addCroneMark()` | 200 | [✅ LIVE §CROWN-01] |
| `quest_glut_04` | "The Endless Feeding" | HG1 | [SKILL CHECK] | WIS Insight | 13 | `_addCroneMark()` | 200 | [✅ LIVE §CROWN-01] |
| `quest_glut_05` | "The False Protection" | HG1 | [SKILL CHECK] | WIS Insight | 15 | `_addCroneMark()` | 225 | [✅ LIVE §CROWN-01] |
| `quest_glut_06` | "The Open Hand" | HG1 | [COMPLETION] | — | — | remove Glut's Gift, `glutGiftReturned`, `glutCrownComplete`, `_innKindness(1)` | — | [✅ LIVE §CROWN-01] |
| `quest_wane_01` | "The Carried Grief" | HN1 | [SKILL CHECK] | WIS Insight | 12 | `_addCroneMark()` | 150 | [✅ LIVE §CROWN-01] |
| `quest_wane_02` | "The Diminishing Task" | HN1 | [SKILL CHECK] | STR Athletics | 13 | `_addCroneMark()` | 175 | [✅ LIVE §CROWN-01] |
| `quest_wane_03` | "The Hopeless Errand" | HN1 | [SKILL CHECK] | INT Investigation | 13 | `_addCroneMark()` | 175 | [✅ LIVE §CROWN-01] |
| `quest_wane_04` | "The Burden" | HN1 | [SKILL CHECK] | WIS Insight | 14 | `_addCroneMark()` | 200 | [✅ LIVE §CROWN-01] |
| `quest_wane_05` | "The Drain" | HN1 | [SKILL CHECK] | WIS Insight | 13 | `_addCroneMark()` | 200 | [✅ LIVE §CROWN-01] |
| `quest_wane_06` | "The Refusal" | HN1 | [SKILL CHECK] | CHA Persuasion | 14 | `_addCroneMark()`, `waneCrownComplete` | 225 | [✅ LIVE §CROWN-01] |
| `quest_inn_01` | "The First Night" | INN | [COMPLETION] | — | — | `_innKindness(1)` | — | [✅ LIVE §CROWN-01] |
| `quest_inn_02` | "The Unrequested Thing" | INN | [SKILL CHECK] | WIS Insight | 12 | `_innKindness(1)` | 150 | [✅ LIVE §CROWN-01] |
| `quest_inn_03` | "The Correction" | INN | [SKILL CHECK] | CHA Persuasion | 13 | `_innKindness(1)` | 175 | [✅ LIVE §CROWN-01] |
| `quest_inn_04` | "The Tired Hour" | INN | [SKILL CHECK] | WIS Insight | 12 | `_innKindness(1)` | 150 | [✅ LIVE §CROWN-01] |
| `quest_inn_05` | "The Return" | INN | [COMPLETION] | — | — | `_innKindness(1)` (on innDeparted return) | — | [✅ LIVE §CROWN-01] |
| `quest_inn_06` | "The Free Booking" | INN | [THRESHOLD] | Kindness ≥5 | — | `freeBookingUnlocked`, Innmother's Key | — | [✅ LIVE §CROWN-01] |

**Kindness Meter thresholds:** ≥3 first register shift · ≥5 free booking + Innmother's Key · ≥7 `innmotherNamed = true` ("Mère Boudine.")

**Crone Mark conversion at HCA:** 6–9 → WIS +1 · 10–14 → WIS +1 + Crone Bead · 15–18 → WIS +1 + Crone Bead + Crone Staff (🪄 +3 ATK, 1d8)

**`quest_whisper_05` — "The Saint's Work"** *(Node: HW1. Object: the cairn at the still water's edge.)*
NOTHING (*Rien*). Whisper tends a small cairn without mention or invitation. Fires on any HW1 return visit after quest_01 attempted. No check. `whisperSaintSeen = true`, `_innKindness(1)`.

**`quest_glut_06` — "The Open Hand"** *(Node: HG1. Object: Glut's Gift jar, warm in the coat.)*
MORE (*Encore*). The jar given at first arrival. Completion: player holds Glut's Gift and is at HG1. No check. Item removed, `glutGiftReturned = true`.

**`quest_inn_03` — "The Correction"** *(Node: INN. Object: the spoon, held incorrectly for the third time.)*
MINE (*À moi*). She corrects it again. The correction is the same each time. CHA Persuasion DC 13: set the spoon down; say you are not leaving. Pass: the correction produces a response she did not have a category for; `_innKindness(1)`. Fail: you apologize; the corrections continue.

---

## §1367 — Historical 1367 AD Integration ✅ LIVE (Events A–G)

Seven standalone historical vignettes grounded in real 1367 AD events, each a single-fighter quest with a Project Gutenberg primary source (Event G's source is the unseen pen itself — it does not sign its work). Design + full four-act vignettes: `Year1367AD.md`. Placed 2026-07-07 at nearest-thematic nodes (relocated off the `HKG` integration placeholder). **Event G "The Unseen Pen" (LXVII67) shipped 2026-07-07** — the seventh, meta faith-puzzle (the scribe Claude, no combat; "the story of the system that wrote the other six"). It was authored by promoting the pre-existing `quest_lxvii67` "The Jester's Crossroads" folk-wisdom quest into the arc: relocated off `HKG` → `FRO` (Aldric's Forest), re-themed to the *al-qalam al-ghaib* framing, and its `faith_folk` reward bumped +1 → +2 per the design doc. A single quest — no duplicate answer-67 puzzle.

| Quest ID | Title | Node | Type | Check | DC | Track / Reward | XP | Protagonist · Source | Status |
|----------|-------|------|------|-------|----|----|----|----|----|
| `quest_1367_a_najera` | "The Free Company" | MLA | [BATTLE] | STR | 12 | `faction_hansa` −1 | 150 | Renaud le Bâtard · Froissart PG61710 | [✅ LIVE §1367] |
| `quest_1367_b_tamerlane` | "The Warlord on the Eastern Wind" | DAM | [SKILL CHECK] | WIS Perception | 13 | `faith_folk` +1 | 120 | Marta of Ragusa · Mandeville PG782 | [✅ LIVE §1367] |
| `quest_1367_c_ottoman` | "The Patchwork of Adrianople" | ATH | [SKILL CHECK] | CHA Deception | 14 | `faith_orthodox` +1 | 130 | Bogdan · Arabian Nights PG128 | [✅ LIVE §1367] |
| `quest_1367_d_hansa` | "The Amber Embargo" | BK | [SKILL CHECK] | CHA Persuasion | 15 | `faction_hansa` +2 (fail −1) | 140 | Hilde Magnusdóttir · Mandeville PG782 | [✅ LIVE §1367] |
| `quest_1367_e_wycliffe` | "The Sealed Pamphlet" | LGW | [SKILL CHECK] | CHA Deception | 13 | `faith_reform` +1 | 110 | Thomas Cobb · Chaucer PG2383 | [✅ LIVE §1367] |
| `quest_1367_f_plague` | "The Empty Village" | CDG | [BATTLE] | STR | 12 | `faith_folk` +1 (fail `plague_exposed` risk) | 160 | Cécile Aubert · Boccaccio PG23700 | [✅ LIVE §1367] |
| `quest_lxvii67` | "The Unseen Pen" | FRO | [SKILL CHECK] | WIS Insight | 10 | `faith_folk` +2 | 67 | Claude the scribe · none (the pen does not sign) | [✅ LIVE §1367-G] |

Events A–F use `gate:{}` (always listed on arrival) and `retryable:true`. **Event G "The Unseen Pen"** uses a load-bearing `activateCond: faith_folk >= 1` behind a `gate:{_legacyFn:true}` — the meta-capstone lists only after you have walked at least one of the six faith paths (the puzzle "requires two"; you are the second). No anachronisms; historical figures (Black Prince, Wycliffe, Murad I, Tamerlane) appear as distant authority, never as early combatants.

---

## §KG — Russia "Kindergarten" Corridor 🔜 Quest chain is Increment 3 (nodes LIVE)

**§KG Increment 2 (zones) is LIVE** — the St. Petersburg → Moscow corridor nodes (SPB/KMS/ZVD/FBR/TVR), 6 low-level "training" monsters (mLevel 1–4), and 5 Soviet-cyberpunk terrains all shipped. See world.md §"The St. Petersburg → Moscow Corridor" + monsters.md §"Soviet-Cyberpunk Training Tier."

**Increment 3 (PLANNED): ~10–12 UQF-1.0 quests**, each anchored to a corridor NPC (audit enforces `npc`) — deliveries / talk / cull-3 / mini-boss, honor-central Soviet-cyberpunk. Anchors ready: **Recruiter Volkov** (SPB, cover story), **Commissar-Instructor Roshkova** (KMS, drill), **Pit-Master Grimka** (ZVD, honor duels), **Technician Iosif** (FBR, jack-in deliveries), **Quartermaster Lena** (TVR, road to Station 7). Each NPC currently carries a single signature `NPC_DIALOGUE` line; full dialogue trees land with the chain. Design: `lab-reports/lab-report-kg-russia-kindergarten-zones.md`.

---

## QUEST COUNT SUMMARY

| Status | Count |
|--------|-------|
| ✅ Live (main story) | ~35 |
| ✅ Live §DESIGN-03 | 9 (4 Birka Ceremonia + 5-act Yael arc) |
| ✅ Live §DUNGEON-01/02 | 43 quests (8 five-act `d02xx` arcs + 3-quest Inquisitor gauntlet) + node-woven Prior Carrier + D02-11 framework |
| ✅ Live §GR | 3 (La Riva: Q-FR-01/02/03) |
| ✅ Live §MATH-01 | 5 (Mathematical World collect quests — Undercity pocket) |
| ✅ Live §LIX–§LXIX + §PAUL-01 | 18 (Saul→Paul arc — conversion chain + Mediterranean journeys; full-chain doc sync 2026-07-07) |
| ✅ Live §SIREN-01 | 5 (Littoral Courts + Overseer) |
| ✅ Live §CROWN-01 | 24 (Whisper ×6, Glut ×6, Wane ×6, Inn ×6) |
| ✅ Live §CROWN-01 Amendment A | 10 (3 failure dispatches + 4 hag commissions + 3 iodine track) |
| ✅ Live §LXX | 4 (Shore Road + Tide Register + Forge Mechanism + Smelting) |
| ✅ Live §LXXI | 2 (Sunken Hall inscription + Tide Gate activation) |
| ✅ Live §LXXII | 1 (Conclave Annex post-event note) |
| ✅ Live §LXXIII | 1 (The Depth — 18 Meters: both-chains closure) |
| **Total live** | **~128** |
| ✅ Live §SPARK-01 | 5 (Smalt + Overture + Clot + Who Done It + Aldous Comes Clean) |
| ✅ Live §SPARK-01 SEA | 3 (Calm Sea + Warmth Eel + The Escort) |
| ✅ Live §HUNT-01 | 4 (Hook + Hull Investigation + Trail + Den Confrontation) |
| ✅ Live §HUNT-02 | 4 (Relay Warning + Road Read + Sleeping Post + Night Hag) |
| ✅ Live §PORT-01 | 3 (The Unwritten Port + The Missing Consignment + The Cracked Strake) |
| ✅ Live §PORT-02 | 2 (The Open Harbor + The Salt Price) |
| ✅ Live §NAVAL-01 | 4 (Approach + Parley CHA DC 12 + Examine INT DC 11 + Board and Clear) |
| ✅ Live §1367 | 7 (Historical 1367 AD vignettes A–G; Event G "The Unseen Pen" shipped by promoting `quest_lxvii67`) |
| **Total live** | **~141** (Event G re-themed an existing quest — no net new quest object) |
| Planned | 0 |

---

---

## §HUNT-01 — What's In The Lake ✅ LIVE (Layer 111)

**Nodes:** LS → LH → LN → LD (new). **Monster:** Drowner × 3. **Key item:** Drowned Compass.  
**NPC:** The Elder Fisherwoman (LS). **Wrong theory:** Guild spirit offerings.  
**Design principle (REF-04):** Setup gives wrong theory → investigation chain corrects → confrontation → resolution with salvage item.

| ID | Title | Type | Node | Cond | Reward |
|----|-------|------|------|------|--------|
| `quest_hunt_01` | Something in the Lake | [ACCOMPLISHMENT] | LS | arrive + speak | +100 XP; opens quest_hunt_02 |
| `quest_hunt_02` | Scale Marks on the Hull | [SKILL CHECK] INT Investigation DC 12 | LH | huntHookReceived | lakeClueFound + knowledge entry + 200 XP |
| `quest_hunt_03` | Drag Tracks North | [SKILL CHECK] WIS Perception DC 13 | LN | lakeClueFound | lakeLairLocated + 250 XP; unlocks LD |
| `quest_hunt_04` | The North Den | [BATTLE] Drowner × 3 | LD | lakeLairLocated | 500gp + 500 XP + Drowned Compass + knowledge entry |

**`quest_hunt_01` — Something in the Lake**
*Node: LS. Trigger: arrive at south shore. Object: three missing boats.*
- Act I: [STORY] The Elder Fisherwoman states the facts — three boats, spring collapse, Guild offerings, her disagreement with the Guild theory.
- Act II: storyRender button "Speak to the Elder Fisherwoman" → huntHookReceived, +100 XP. Quest chain opens.
- Act III: No battle here. Investigation begins at LH.
- Act IV: Guild master at LH presents spirit mark theory (on boat hull).
- Act V: Elder Fisherwoman's words remain the accurate framing. "Something that eats a boat is not a spirit."

**`quest_hunt_02` — Scale Marks on the Hull**
*Node: LH. Trigger: huntHookReceived. Object: recovered boat hull.*
- Act I: [SKILL CHECK] INT Investigation DC 12. The marks are at the waterline, port side.
- Act II: On fail — "Marks unclear. More evidence on the north shore path." Not retryable; player must proceed to LN.
- Act III: On pass — lakeClueFound, knowledge push: *physical claw drag, not spirit-made*. +200 XP.
- Act IV: Harbor Guild Master reads the hull a second time: "Those are grip-marks. Something held the boat."
- Act V: Object changed — the hull goes from evidence of a mystery to evidence of a creature.

**`quest_hunt_03` — Drag Tracks North**
*Node: LN. Trigger: lakeClueFound. Object: disturbed north shore path.*
- Act I: [SKILL CHECK] WIS Perception DC 13. Path mud, shelf edge worn. Repeated passage pattern.
- Act II: On fail — "Pattern unclear from path. Move further along the shelf." Not retryable; move along LN.
- Act III: On pass — lakeLairLocated. LD unlocked. +250 XP.
- Act IV: storyRender at LN updates: "Trail read. Three of them — from track spacing. Den at the shelf collapse."
- Act V: Object changed — the path goes from disturbed ground to a location. North Shore Den is now accessible.

**`quest_hunt_04` — The North Den**
*Node: LD. Trigger: lakeLairLocated. Object: the den itself.*
- Act I: [STORY] storyRender at LD — shelf collapse, flooded chamber, boat timbers present. Drowners not hidden.
- Act II: Button "Enter the den — clear the drowners" → storyPreBattle(LD_DROWNERS).
- Act III: [GATING BATTLE] Drowner × 3 — The North Den.
- Act IV: On win — drownersDefeated, +500gp +500 XP, Drowned Compass added, knowledge push.
- Act V: Elder Fisherwoman at LS closes the arc: "It was the rock fall that brought them — not the boats. The boats were just the nearest thing. You got to them before they established range north."

## QUEST DESIGN PRINCIPLES (see §D02-11 for full framework)

1. Every quest is a 5-act Chrétien arc named for its object, not its goal.
2. Tag every act: `[STORY SKILL CHECK]` or `[STORY GATING BATTLE]`.
3. No permanent fail. Retry gates are day-advance, quest-state, or immediate.
4. The battle is Act III. Always.
5. Act V is always the story-driving Ceremonia Roll.
6. The object must arrive changed by Act V.

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
