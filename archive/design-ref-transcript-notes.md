## §DESIGN-REF — Transcript Design Principles Reference

*Working notes distilled from 4 design transcripts. Items marked ⚙️ are actionable for future arcs. Items marked ✅ are already applied.*

---

### REF-01: Improv in D&D (Flutes Loot)

| Principle | Applied | Notes |
|-----------|---------|-------|
| Yes, and — accept and build | ✅ §SPARK-01 (cat/mouse/tick chain rewards acceptance) | Future: skill-check fail states should feel like "yes, and" not dead ends |
| Make others look good | ✅ §SPARK-01 (player gives Aldous space to confess) | ⚙️ Co-op NPC moments: other NPCs help when player does the right thing |
| Let go and play / Fail Big | ⚙️ Partially (Smalt bites on fail, 1 dmg) | ⚙️ Fail states should be more memorable than pass states in SPARK arcs |
| Find common ground | ✅ §SPARK-01 (cat-mouse models player-Inspector dynamic) | ⚙️ Future SPARK arcs: chain the unlikely pair to a human relationship |
| Play on assumptions | ✅ §SPARK-01 SEA (monster = friendly eel); ✅ §HUNT-01 (monster = spiritual? No.) | ⚙️ Every HUNT arc: setup with wrong assumption, investigation corrects |
| Contrasting energy | ✅ Smalt (indifferent) vs Inspector (formal) | ⚙️ Pair high-formality NPCs with very low-stakes creatures in SPARK arcs |
| Make statements not questions | ⚙️ NPC dialogue principle — use in all new quoteFn | "You look like you've been following something" not "What are you doing?" |
| Seek themes | ⚙️ SPARK theme: kindness → harmony. HUNT theme: fear → understanding | Each arc family should have one thematic answer |
| Approaching resolutions | ⚙️ Every quest disposition quote should be a closing statement | Already enforced by disposition field convention |

---

### REF-02: Side Quest Structure (World Anvil — 4-Point Template)

**Template:** Hook/setup → Investigation/exploration → Twist/complication → Choice/resolution

| Phase | Applied | Notes |
|-------|---------|-------|
| Hook | ✅ All quests have activateNode + activateCond | ⚙️ Hooks should feel like "a question you can't ignore" not a chore |
| Investigation | ✅ skill_check quests are investigation phase | ⚙️ Skill checks should give partial info on fail, not just "try again" |
| Twist | ✅ §SPARK-01 (parasite is friendly), §HUNT-01 (ghost is drowners) | ⚙️ Twist should contradict the initial NPC's belief, not contradict facts |
| Choice/resolution | ⚠️ Currently most quests have one outcome | ⚙️ FUTURE: add "spare the monster" or "side with X" option in HUNT arcs |

**World Anvil key insight:** Side quests feel like detours unless anchored to worldbuilding. Every quest should change something permanent in the world state (flag, NPC relationship, knowledge entry, item in world).

**NPC archetypes to maintain per hub:**
- **Go-to** (knows everything, sends you to others): Muffat (DK), Elder Fisherwoman (LS), Aldous (DK post-confession)
- **Outcast with heart of gold**: Aldous (pre-confession), Brannick (rat catcher)
- **Quest giver**: Guild Master (LH), Inspector Wren-Pembury (ironic: he gives quests he doesn't mean)
- **Upgrader**: Atlantean Forge (DSF), Vendor Mira (MQ) — ⚙️ MQ could get a proper upgrade mechanic
- **Thief**: Aldous (post-confession) — ⚙️ expand to Visby black market link

---

### REF-03: Naval Campaigns

| Element | Applied | Notes |
|---------|---------|-------|
| Travel problems (handcrafted not random) | ✅ OW (Warmth Calm blocks trade route) | ⚙️ Next travel problem: storm damage → hull repair quest |
| Ship-to-creature combat | ✅ MS (ghost in hold + pirates), OW (eel) | ⚙️ Add one ship-to-ship combat node with roles: Captain, Gunner, Lookout |
| Boarding combat | ⚙️ Not yet implemented | ⚙️ Two-gangplank choke-point map node between two ship nodes |
| 3-5 interesting ports | Tilbury (DK/MQ), Lake Harbor (LH), Malta (existing) | ⚙️ Need 2 more distinct ports with cultural identity |
| NPCs traveling with party | ✅ Aldous (can escort on sea route) | ⚙️ Brannick could travel as ship NPC post-resolution |
| Fast travel between ports | ✅ Junction system handles distance | ⚙️ Add "charter a ship" option at DK for long-range fast travel |

---

### REF-04: Monster Hunt (Ben Byrne — 4-Phase Structure)

**Template:** Setup (symptoms, not monster) → Investigation (skill checks, clues) → Confrontation (combat, exploiting weaknesses) → Resolution/Reward

| Phase | Applied | Notes |
|-------|---------|-------|
| Setup — NPC reports symptoms | ✅ §HUNT-01 (Elder Fisherwoman, missing boats) | ⚙️ NPC should give WRONG theory; investigation corrects |
| Investigation — clue chain | ✅ §HUNT-01 (INT DC 12 scales → WIS DC 13 trail → lair) | ⚙️ Each clue should lower effective DC by 2 for the confrontation |
| Confrontation | ✅ §HUNT-01 (LD — Drowner ×3 den) | ⚙️ Prep rewards: monster has weakness player can exploit if they investigated |
| Resolution | ✅ §HUNT-01 (Guild allies, Drowned Compass) | ⚙️ Always: one salvageable item + one permanent world change |

**Ben Byrne key insight:** The monster hunt is most fun when the setup gives the WRONG monster. Players investigate, correct the theory, then confront. The investigation is not optional — skipping it makes the fight harder.

**Play on assumptions in HUNT arcs:**
- §HUNT-01: "Lake spirit / ghost" → actually Drowners (physical, territorial)
- §HUNT-02 (✅ Layer 111): Road warden says bandits → actually Night Hag (riding relay horses from sleeping post at J1.N bend)
- Pattern: the quest-giver's folk theory is always sympathetically wrong

---
