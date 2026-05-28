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

### Mimic Meadows (MM) — NODE

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_mimic_colony` | "Colony Curation" | [SKILL CHECK]+[BATTLE if provoked] | 5 acts | 200gp + Mimic's Wax + Baby Mimic + `tribbleGladesFed` | [✅ LIVE §D02-08] |

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

### Scholar King's Workshop (WK) — NODE

| Quest ID | Title | Type | Acts | Reward | Status |
|----------|-------|------|------|--------|--------|
| `quest_scholar_workshop` | "The Blueprint Roll" | [SKILL CHECK]+[BATTLE/SPIRIT] | 5 acts | Prototype Wand + `aurosBlueprintKnown` + `scholarWorkshopComplete` | [✅ LIVE §D02-06] |

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

## EPIC BATTLEGROUNDS — Approach Quests (✅ ALL LIVE — §D01-01 + §D02)

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

## PAUL'S MEDITERRANEAN JOURNEYS — Act IV (§LXV–§LXIX)
*(Nodes: PL, AE, EF2, KR, ST — implemented 2026-05-28)*

All quests activate on first node visit. All use Ceremonia Roll skill-check system or side-quest `completeFn` flag checks. NPC dialogue mutations handle state on first interaction.

| Quest ID | Title | Type | Check | DC | Pass Flag | XP | Status |
|----------|-------|------|-------|----|-----------|----|--------|
| `quest_philippi` | "The Purple Merchant" | [ACCOMPLISHMENT] | — | — | `lyraConverted` | 150 | [✅ LIVE §LXV] |
| `quest_areopagus` | "To An Unknown One" | [SKILL CHECK] | CHA Persuasion | 13 | `areopagusSpeech` | 200 | [✅ LIVE §LXVI] |
| `quest_ephesus_riot` | "The Silversmith's Meeting" | [SKILL CHECK] | CHA Persuasion | 12 | `demetriusRiotEscaped` | 175 | [✅ LIVE §LXVII] |
| `quest_corinth_letters` | "Tent Canvas & Letters" | [ACCOMPLISHMENT] | — | — | `corinthLettersWritten` | 200 | [✅ LIVE §LXVIII] |
| `quest_rome_arrest` | "The Rented House" | [ACCOMPLISHMENT] | — | — | `romeArrestBegun` | 300 | [✅ LIVE §LXIX] |

**`quest_philippi` — "The Purple Merchant"** *(Node: PL. Object: the purple cloth arranged on the bridge stall.)*
Lyra has been watching from across the bridge for two days before she speaks. When she speaks, it is because she has already decided. NPC first-visit mutation sets `lyraConverted: true`. Quest completes on flag. The earthquake (every door of the city prison opens) is narrated in the NPC text; it is not a separate event.

**`quest_areopagus` — "To An Unknown One"** *(Node: AE. Object: the inscription — TO AN UNKNOWN ONE.)*
The altar has been maintained for two hundred years. Paul has been standing in front of it for a long time. CHA Persuasion DC 13: begin with the altar, not with a correction. Pass: Dionysius stays; Damaris stays. Fail: the steward receives the interpretation politely; the council does not invite him to speak.

**`quest_ephesus_riot` — "The Silversmith's Meeting"** *(Node: EF2. Object: the guild meeting notice, larger than the hall.)*
Demetrius's argument is economic and theological simultaneously. The theater fills. CHA Persuasion DC 12: the city clerk reaches the front and names the legal position before the charges can be filed. Pass: the theater empties before dark; the charges are never filed. Fail: Paul leaves Ephesus the next morning.

**`quest_corinth_letters` — "Tent Canvas & Letters"** *(Node: KR. Object: the letters written at night, canvas on the frame behind.)*
Prisca and Akil hire him because he knows the trade. NPC first-visit mutation sets `corinthLettersWritten: true` and delivers the 18-month compressed narrative. Some of the letters written here are the most important things he will ever write. He does not know which ones yet.

**`quest_rome_arrest` — "The Rented House"** *(Node: ST. Object: the door that cannot be opened from the inside.)*
Requires `maltaSnakeEvent: true` (Malta arc fires first on arrival at ML). NPC first-visit mutation by Timael sets `romeArrestBegun: true`. Visitors every day. Letters every night. The arc does not end here. It stops here. Disposition: *"Where are you going next?"*

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

## QUEST COUNT SUMMARY

| Status | Count |
|--------|-------|
| ✅ Live (main story) | ~35 |
| ✅ Live §DESIGN-03 | 9 (4 Birka Ceremonia + 5-act Yael arc) |
| ✅ Live §DUNGEON-01/02 | 11 (10 five-act chains + D02-11 framework) |
| ✅ Live §GR | 3 (La Riva: Q-FR-01/02/03) |
| ✅ Live §LXV–§LXIX | 5 (Mediterranean Paul arc) |
| ✅ Live §SIREN-01 | 5 (Littoral Courts + Overseer) |
| ✅ Live §CROWN-01 | 24 (Whisper ×6, Glut ×6, Wane ×6, Inn ×6) |
| **Total live** | **~92** |
| Planned | 0 |

---

## QUEST DESIGN PRINCIPLES (see §D02-11 for full framework)

1. Every quest is a 5-act Chrétien arc named for its object, not its goal.
2. Tag every act: `[STORY SKILL CHECK]` or `[STORY GATING BATTLE]`.
3. No permanent fail. Retry gates are day-advance, quest-state, or immediate.
4. The battle is Act III. Always.
5. Act V is always the story-driving Ceremonia Roll.
6. The object must arrive changed by Act V.
