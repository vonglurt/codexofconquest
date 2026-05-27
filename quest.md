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
| `quest_cy_madness_gate` | "The Maintenance Plate" | [SKILL CHECK]+[BATTLE] | 5 acts | `cyOriginKnown` + Name Plate item | [✅ LIVE §D02-07] |

**`quest_cy_madness_gate` — "The Maintenance Plate"** *(5-act, see §D02-07)*
*Node: CY. Trigger: first visit. Object: the copper maintenance plate dated 300 years ago.*
1. [STORY SKILL CHECK] WIS Perception DC 10 — notice the plate
2. [STORY SKILL CHECK] WIS Save DC 12 — madness gate (fail = Madness Table d10, flavor only)
3. [STORY GATING BATTLE] Data Wraith — AC 14 / HP 30
4. [STORY SKILL CHECK] INT Arcana DC 13 — decode the cipher
5. [STORY-DRIVING] CHA Persuasion DC 12 — accept the name on the log
- Reward: `Scholar King's Name Plate` (flavor item) + `cyOriginKnown: true`

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

### Mimic Meadows (MM) — NODE (PLANNED)

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_mimic_colony` | "Colony Curation" | [SKILL CHECK]+[BATTLE if provoked] | 5 acts | 200gp + Mimic's Wax + Baby Mimic + `tribbleGladesFed` | [PLANNED §D02-08] |

**`quest_mimic_colony` — "The Dropped Coin"** *(5-act, see §D02-08)*
*Node: MM. Trigger: first visit. Object: a shiny coin dropped by the baby chest mimic.*
1. [STORY SKILL CHECK] WIS Animal Handling DC 10 — pick up coin gently without pocketing
2. [STORY SKILL CHECK] WIS Animal Handling DC 12 — approach napping bookshelf mimic
3. [STORY GATING BATTLE] Mother Mimic AC 16 / HP 60 — triggered ONLY if a mimic was attacked
4. [STORY SKILL CHECK] WIS Animal Handling DC 14 — return coin to baby mimic in front of Mother
5. [STORY-DRIVING] CHA Persuasion DC 10 — accept the pet + name it
- Reward: `Mimic's Cache` + 3× Fuzzy Tribble + `Baby Mimic` item + `mimicPetName`

---

### Ceremonia Arc — Yael Scheidemann (BA, SL)

| Quest ID | Title | Node | Type | DC | Status |
|----------|-------|------|------|----|--------|
| `quest_ceremonia_yael_01` | "The Watch" | BA | [SKILL CHECK] CHA | 10 | [✅ LIVE §DESIGN-03] |
| `quest_ceremonia_yael_02` | "The Route" | BA | [SKILL CHECK] WIS | 12 | [✅ LIVE §DESIGN-03] |
| `quest_ceremonia_yael_03` | "The Crate" | SL | [SKILL CHECK] STR | 12 | [✅ LIVE §DESIGN-03] |
| `quest_ceremonia_yael_04` | "The Report" | BA | [SKILL CHECK] CHA | 14 | [✅ LIVE §DESIGN-03] |
| `quest_ceremonia_yael_05` | "The Name" | BA | [SKILL CHECK] CHA | 15 | [✅ LIVE §DESIGN-03] |

---

## WEIMAR — Act VII (Nodes: WM, scholars_qtr, SW)

### Weimar Archive (WM)

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_inquisitor` | "The Extended Hand" | [SKILL CHECK]+[BATTLE if lying] | 5 acts | Archive key + `inquisitorPassed` | [✅ LIVE §D02-02] |
| `quest_prior_carrier` | "The Worn Boots" | [SKILL CHECK]+[BATTLE] | 5 acts | Prior Carrier's Token + `priorCarrierSeen` | [✅ LIVE §D02-03] |

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

### Scholar King's Workshop (SW) — NODE (PLANNED)

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_scholar_workshop` | "The Blueprint Roll" | [SKILL CHECK]+[BATTLE/SPIRIT] | 5 acts | Prototype Wand + `aurosBlueprintKnown` + `scholarWorkshopComplete` | [PLANNED §D02-06] |

**`quest_scholar_workshop` — "The Blueprint Roll"** *(5-act, see §D02-06)*
*Node: SW. Trigger: first SW visit. Object: blueprint roll — plans for Auros's armor.*
1. [STORY SKILL CHECK] INT Investigation DC 10 — confirm the blueprint
2. [STORY SKILL CHECK] WIS Perception DC 11 — assess prototype wand stability
3. [STORY GATING BATTLE / SPIRIT] CHA DC 12 OR Spirit combat AC 12 / HP 25 — after second short rest
4. [STORY SKILL CHECK] WIS Insight DC 13 — understand Auros's armor weak point
5. [STORY-DRIVING] CHA Persuasion DC 13 — accept your name on the cover

---

## TILBURY — Act II (Nodes: docks, market_quarter, storefront, merchant_ship)

*(Existing quests live; no new specced quests at this time.)*

---

## VISBY — Act V (Nodes: alley, sewers, goblin_cave, pirate_cave, bar)

*(Existing quests live.)*

---

## EPIC BATTLEGROUNDS — Approach Quests (PLANNED per §D01-01 + §D02)

### Abyssal Scriptorium (AT)

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_scriptorium_approach` | "The Drowned Page" | [SKILL CHECK]+[BATTLE] | 5 acts | Shard path unlock + `scriptorium_approach_complete` | [✅ LIVE §D02-01] |

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
| `quest_void_maze` | "The Chalk Mark" | [SKILL CHECK]+[BATTLE] | 5 acts | `mazeSolvedChecks: 3` + boss room unlocked | [✅ LIVE §D02-05] |

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
| `quest_void_flux` | "The Spell Scroll" | [SKILL CHECK]+[BATTLE] | 5 acts | Dual-use scroll + `voidFluxCleared` | [✅ LIVE §D02-09] |

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
| `quest_memory_gate` | "The Journal Entry" | [SKILL CHECK]+[BATTLE bypass] | 5 acts | Passage + `memorGatePassedEntry` | [✅ LIVE §D02-04] |

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
| `quest_loop_heart` | "The Seventh Shard" | [SKILL CHECK]+[BATTLE] | 5 acts | Shard + ending variant set + `codexCoreChosen` | [✅ LIVE §D02-10] |

**`quest_loop_heart` — "The Seventh Shard"** *(5-act, see §D02-10)*
*Node: CO pre-boss chamber. Object: the seventh Shard inside the pulsing column.*
1. [STORY SKILL CHECK] WIS Perception DC 10 — sense the room's history
2. [STORY SKILL CHECK] INT Arcana DC 12 — read the three paths and their costs
3. [STORY GATING BATTLE] Commander Auros AC 22 / HP 300 / ATK+12 (or STR DC 15 Destroy bypass)
4. [STORY SKILL CHECK] Choice-dependent (WIS DC 12 / CHA DC 17 / none)
5. [STORY-DRIVING] CHA Persuasion DC 12 — Sweelinck's Last Question; honest answer passes

---

## QUEST COUNT SUMMARY

| Status | Count |
|--------|-------|
| ✅ Live | ~35 (story.md + HTML) |
| Planned §DESIGN-03 | 6 (4 Birka + 5 Yael Ceremonia) |
| Planned §DUNGEON-01/02 | 11 (10 themed + framework) |
| **Total new planned** | **17** |

---

## QUEST DESIGN PRINCIPLES (see §D02-11 for full framework)

1. Every quest is a 5-act Chrétien arc named for its object, not its goal.
2. Tag every act: `[STORY SKILL CHECK]` or `[STORY GATING BATTLE]`.
3. No permanent fail. Retry gates are day-advance, quest-state, or immediate.
4. The battle is Act III. Always.
5. Act V is always the story-driving Ceremonia Roll.
6. The object must arrive changed by Act V.
