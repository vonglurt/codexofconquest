<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report: The Naval Campaign Layer — Ports, Intercepts, Hunts, and the Harmony Chain at Sea

**Author:** Claude (Sonnet 4.6) + roll2hit.com design sessions  
**Date:** 2026-05-28  
**Classification:** Arc Design / Naval Systems / Quest Architecture  
**Audience:** Electrical Engineering / Computer Science background; video game designer / programmer  

---

## Abstract

This report documents the design process for the naval campaign layer of *The Shattered Codex*, built across three context sessions from four design transcripts: an improv-in-D&D transcript (Flutes Loot), a side quest structure transcript (World Anvil), a naval campaigns transcript, and a monster hunt transcript (Ben Byrne). The transcripts were processed in three stages: (1) principle extraction into §DESIGN-REF, (2) selection of one transcript to implement first, (3) sequential implementation of derived arcs. Session 3 added a retrospective multipass: §SPARK-02 (The Dunfall Harmony Chain — second friendship arc template at DF), §WHODUNIT-01 (The Bilge Mystery — steamboat monster mystery at MS), and §ALCHEMY-01 (The Personal Legend — world-spanning escort quest following Roen the shepherd through six existing nodes). Nine new nodes were added (OW, SK, SB, DF, LD, BN, and the DA3/§LXXIII tidal chain). Thirty-four new quests were added across §SPARK-01 SEA, §NAVAL-01, §PORT-01, §PORT-02, §HUNT-01, §HUNT-02, §SPARK-02, §WHODUNIT-01, and §ALCHEMY-01. This report documents what was built, the principles that shaped each decision, the arc threading that connects them, and the remaining ⚙️ items.

---

## I. Source Transcripts and Extraction Process

### 1.1 What the transcripts contained

The four source transcripts were not game design documents — they were lectures, tutorials, and videos about general tabletop RPG design. The extraction process was:

```
TRANSCRIPT (general RPG design advice)
   └─► [Filter] → what applies to this specific game
               └─► [Map to existing systems] → what can be implemented now
               └─► [Defer] → what requires new systems → plan.md §DESIGN-REF ⚙️ entry
```

The key filter was **existing system compatibility**: principles that could be applied to existing QUEST_DB structure, existing node architecture, and existing state flags were implemented. Principles requiring new UI systems (e.g., "charter a ship" fast travel option at DK) were deferred as ⚙️ entries.

### 1.2 The four transcripts and their core contributions

| Transcript | Source | Core principle extracted | Primary application |
|-----------|--------|------------------------|---------------------|
| Improv in D&D | Flutes Loot | Yes-and; fail states memorable not dead ends; contrasting energy | §SPARK-01 arc design |
| Side Quest Structure | World Anvil | Hook → Investigation → Twist → Choice; worldbuilding anchor | §HUNT-01/02 arc template |
| Naval Campaigns | (unnamed) | Handcrafted travel problems; crew roles; distinct port culture | §NAVAL-01, §PORT-01/02 |
| Monster Hunt | Ben Byrne | Wrong theory setup; investigation corrects; confrontation rewarded | §HUNT-01/02 4-phase template |

### 1.3 The one-transcript-first protocol

After extracting all four transcripts into §DESIGN-REF, the decision was made to implement **one transcript first** rather than all four simultaneously. The Ben Byrne monster hunt transcript was selected because:

1. It had the most concrete mechanical template (4 phases, named)
2. It required the fewest new systems (existing skill_check quest type + storyPreBattle pattern)
3. It produced a repeatable arc template (§HUNT-01 → §HUNT-02 → future §HUNT-N)

The other three transcripts' implementations followed in subsequent passes, each drawing on the infrastructure established by the first.

---

## II. What Was Built

### 2.1 Node inventory

| Node | Num | Label | Connection | Purpose |
|------|-----|-------|-----------|---------|
| OW | 139 | Open Water — The Warmth Calm | MS.E ↔ LW.W | §SPARK-01 SEA warmth eel encounter |
| SK | 142 | Saltwick — The Unwritten Port | MS.S | §PORT-01 reputation-gated port |
| SB | 144 | The Intercept — Three Miles Out | MS.N | §NAVAL-01 ship-to-ship with crew roles |
| DF | 143 | Dunfall — The Loch Harbor | HL.W ↔ EH.E | §PORT-02 kelpie-gated barter port |
| LD | 140 | North Shore Den | LN.N | §HUNT-01 drowner den confrontation |
| BN | 141 | The Eastern Bend | J1.N | §HUNT-02 night hag relay road |
| DA3 | 138 | The Depth — 18 Meters | DA2.S | §LXXIII tidal chain terminus |

**MS now has three exits:** W (DK, original), E (OW → LW), S (SK), N (SB). The Tilbury Star is the central sea hub.

### 2.2 Quest inventory

| Arc | Quest IDs | Type | Location | Key mechanic |
|-----|-----------|------|----------|-------------|
| §SPARK-01 SEA | quest_sea_01–03 | side + 2× skill_check | OW | INT DC 13 identify eel; WIS DC 14 escort |
| §HUNT-01 | quest_hunt_01–04 | side + 2× skill_check + side | LS/LH/LN/LD | INT DC 12 hull; WIS DC 13 trail |
| §HUNT-02 | quest_hunt2_01–04 | side + 2× skill_check + side | J1/BN | WIS DC 11 road; INT DC 13 sleeping post |
| §PORT-01 | quest_sk_01/02 + quest_sk_hull | side + skill_check + side | SK | CHA DC 12 consignment; 200gp hull repair |
| §PORT-02 | quest_df_01/02 | side + skill_check | DF | WIS DC 11 barter insight |
| §NAVAL-01 | quest_sb_01 + parley/examine/fight | side + 2× skill_check + side | SB | CHA DC 12 parley; INT DC 11 papers |
| §SPARK-02 | quest_spark2_01–05 | 3× side + 2× skill_check | DF | WIS DC 11 animal handling; INT DC 12 nature |
| §WHODUNIT-01 | quest_bilge_01–04 | 2× side + 2× skill_check | MS | INT DC 12 drain; WIS DC 13 witness |
| §ALCHEMY-01 | quest_alch_01–07 | 5× side + 2× skill_check | HL/MI/MS/IS/ML/AE | CHA DC 11 oracle; WIS DC 12 Malta crisis |

**Total new quests this layer:** ~34. Running total: ~151 live.

### 2.3 Items introduced

| Item | Icon | Sell | Source arc | Significance |
|------|------|------|-----------|-------------|
| Joint Pirate Debt Note | ⚓ | 0 | §SPARK-01 SEA | Credential at SK; two crew allegiances |
| Drowned Compass | 🧭 | 80 | §HUNT-01 | Guild captain's compass; proof of wrong theory |
| Relay Station Token | 🪙 | 20 | §HUNT-02 | Brass token; relay road cleared |
| Saltwick Bill of Lading | 📄 | 0 | §PORT-01 | Valid at 6 unregistered ports |
| Highland Herb Pouch | 🌿 | 40 | §PORT-02 | Dunfall-only; moorland herbs |
| Letter of Marque (Keel) | 📜 | 0/15 | §NAVAL-01 | Same item, 3 different meanings by path |
| Bram's Fish Scale | 🐟 | 0 | §SPARK-02 | Token 1 of 4: endorsement, temporary |
| Oat's Harbor Bead | 🪡 | 0 | §SPARK-02 | Token 2 of 4: acknowledgment, temporary |
| Dunfall Drift Spore | ✨ | 0 | §SPARK-02 | Token 3 of 4: proof of Fehn's gentling |
| Highland Letter of Clearance | 📃 | 0 | §SPARK-02 | Token 4 of 4: permanent; Halvard Jesst credential |
| Sea Spawn Scale Fragment | 🐚 | 13 | §WHODUNIT-01 | Evidence of hull breach; case closed |
| Shepherd's Fortune Slip | 📜 | 0 | §ALCHEMY-01 | Token 1: prophecy receipt; exists only for the duration of the journey |
| Loch Gold Flake | ✨ | 30 | §ALCHEMY-01 | Token 2: permanent; bioluminescent colony surfaced gold; grandmother spoke literally |

---

## III. Design Principles Applied — Per Arc

### 3.1 §SPARK-01 SEA — The Warmth Calm (OW)

**Source transcript:** Improv in D&D (Flutes Loot) + Naval Campaigns.

**Principle applied: Play on assumptions.**  
The setup is "two wanted pirate ships at anchor with no hostility between them." The player's assumption is that this is a threat encounter. The reality is that something large and warm below the surface has made conflict feel pointless to both crews. The player must investigate (identify the eel) and resolve (escort it south) without fighting either pirate crew.

**Principle applied: Contrasting energy.**  
The Redmast Quartermaster is practical and wary ("eight days and I haven't hit anyone; I don't know what to do with that"). The warmth eel has no agenda — it simply is. The contrast between the pirate's anxiety about his own non-violence and the eel's indifference to the whole situation is the scene's emotional core.

**Arc threading: OW → SK.**  
The Saltwick Dockmasters' brig is one of the two ships at OW. Their First Mate signs the Joint Pirate Debt Note alongside the Redmast Quartermaster. This note becomes the player's credential at SK — the pirateCrew_allied flag opens Saltwick's dock gate. The naval travel problem (Warmth Calm blocks trade route) resolves into the port reputation system (Saltwick accepts the pirate alliance as currency).

### 3.2 §HUNT-01 — What's In The Lake (LD)

**Source transcript:** Ben Byrne monster hunt, 4-phase template.

**Phase application:**

| Phase | Implementation | Wrong theory corrected |
|-------|---------------|----------------------|
| Setup | Elder Fisherwoman at LS: three boats missing, Guild places spirit offerings | Guild theory: spirit; Reality: physical drowners |
| Investigation | INT DC 12 hull marks (physical claw drag) → WIS DC 13 north shore trail (territorial stop line) | Marks are grip marks, not spirit-work |
| Confrontation | LD: Drowner ×3, storyPreBattle(LD_DROWNERS) | Den at shelf collapse after spring rock fall |
| Resolution | Drowned Compass + Guild captain found + knowledge entry | Guild adjusts theory over two seasons |

**Design decision: the wrong theory is sympathetically wrong.**  
The Guild master is not foolish — spirit offerings are the traditional response to unexplained lake deaths. The Elder Fisherwoman is not prescient — she has ninety-one years of lake experience that reads physical evidence correctly. Neither character is diminished by the investigation's conclusion.

**Design decision: storyMove gate on LN→LD.**  
The lair (LD) is not accessible until lakeLairLocated is set. This enforces the investigation — the player cannot skip directly to the fight without reading the trail. The gate message uses the correct tone: it names what the player sees (disturbed path) without naming what they haven't found yet (the lair).

### 3.3 §HUNT-02 — The Eastern Bend (BN)

**Source transcript:** Ben Byrne monster hunt, second application.

**Difference from §HUNT-01:** The wrong theory source is institutional (road wardens, not a village elder), the creature is psychological rather than physical (night hag vs. drowners), and the investigation reads invisible evidence (territorial marking, spiral tether wear, heel-only handprint) rather than physical evidence (hull marks, drag tracks).

**Design decision: Tessie's existing dialogue as the hook.**  
The J1 junction already has Tessie as an EB_NPC who says "Watch the eastern bend — something spooked the relay horses yesterday." §HUNT-02 builds the entire arc from that single existing line. The hook is already in the world — the investigation arc simply answers the question the game had already asked.

**Principle applied: the wrong theory is institutional.**  
Road wardens say bandit fires. This is a credible theory — old mills do attract squatters. The tell is the precision: every horse stopped at the same point, not at random points along the road. Bandit fear is diffuse. Territorial marking is precise. The INT skill check reads the stopping line as evidence of the hag's territory, not the bandits' position.

### 3.4 §PORT-01 — Saltwick (SK)

**Source transcript:** Naval Campaigns — distinct port culture, reputation-gated access.

**Cultural identity: reputation as currency.**  
Saltwick's access system uses three existing arc states as credentials:
- pirateCrew_allied (§SPARK-01 SEA): Both pirate crews vouch for you
- aldousConfessed (§SPARK-01): Aldous's Letter of True Passage names Saltwick as one of his six ports
- Neither: dock gate stays closed

This means Saltwick is inaccessible on a first playthrough until at least one prior arc is resolved. The port rewards completionist play without gating content behind a single mandatory quest.

**Arc threading: Saltwick → Aldous → Inspector.**  
quest_sk_02 (the missing consignment) reveals that the buyer used a "Pembury" shipping address — a chandler's shop that closed the morning of the delivery. This connects §PORT-01 back to §SPARK-01 (Aldous Wren-Pembury's false identity) without naming the connection directly. The player who remembers Aldous's backstory understands what Dorit is telling them. The player who doesn't gets a mystery thread.

**The hull repair as travel problem.**  
The Tilbury Star's cracked strake is a handcrafted travel problem (REF-03 template). It doesn't block movement — the ship still runs — but it creates a pending consequence. The repair at Saltwick costs 200gp and ties the dry dock to the Highland timber trade: "Highland timber from Dunfall — better grain than lowland oak." This cross-reference connects §PORT-01 and §PORT-02 through the dock worker's dialogue, making the world feel consistent rather than modular.

### 3.5 §PORT-02 — Dunfall (DF)

**Source transcript:** Naval Campaigns — distinct port culture, access gated by world state.

**Cultural identity: barter economy, pre-commerce.**  
Dunfall's market runs on acknowledgment, not gold. The WIS Insight DC 11 check in quest_df_02 is not about reading Mairén — it's about understanding what the exchange requires. The fail state makes this explicit: "Come back when you've walked the ford path. Not the road — the ford." The market does not open until the player demonstrates they understand why the doors were barred.

**Access gated by §HL battle completion.**  
HL already has the kelpie + Cú Sídhe battle. Clearing it sets defeatedBattles['HL']. The storyMove gate at HL→DF checks this flag. Dunfall is therefore a **consequence** of the kelpie fight, not a separate quest — the player clears the loch, and the village opens. The causal chain was already in HL's node text ("the doors in Dunfall bar from the inside" when the standing stones go gold).

**Node insertion:** DF is inserted between HL and EH (Loch of the Drowned King epic battleground). The player can now: clear the kelpie (HL) → visit Dunfall (DF) → continue west to the epic loch (EH). The three nodes form a natural progression along the highland loch.

### 3.6 §NAVAL-01 — The Intercept (SB)

**Source transcript:** Naval Campaigns — ship-to-ship combat, crew roles.

**The crew role design decision.**  
REF-03 calls for "Captain, Gunner, Lookout, Quartermaster" crew roles. The implementation simplified to three branching buttons because the node is a single encounter, not a sustained campaign:
- Go to the rail (Parley) → CHA DC 12 diplomatic resolution
- Take the helm (Examine) → INT DC 11 document analysis
- Go below (Fight) → immediate battle

All three paths yield the same item (Letter of Marque, Keel). The **meaning** of the item differs by path:
- Parley: Keel gave it willingly — she wanted to be bought off
- Examine: Keel threw it across the gap — the test was whether you'd read the date
- Fight: Recovered from the chart room — the Commission was already void when she presented it

The item is identical. The player's understanding of Keel is not.

**The unresolved thread.**  
Keel's motivation is never explained. She was "testing the eastern run for something." The Eastern Reach seal connects to Aldous (Wren-Pembury's false estate). What Keel was looking for — and who sent her — is left as an open thread. This is deliberate per REF-02: "the twist should contradict the initial NPC's belief, not contradict facts." Keel's belief about the Star's cargo is left intact. The player doesn't know if she found what she was looking for.

### 3.7 §SPARK-02 — The Dunfall Harmony Chain (DF)

**Source transcript:** Improv in D&D (Flutes Loot) — second application of the §SPARK template.

**Design decision: second instance proves the template is repeatable.**  
§SPARK-01 used Tilbury/DK as the location, Inspector Wren-Pembury as the formal NPC, and the cat → mouse → tick → parasite → harmony sequence. §SPARK-02 uses Dunfall/DF, Commissioner Halvard Fehn, and a cat → mouse → drift spore → harmony sequence. Different creatures, different location, same underlying arc shape: unlikely kindness chain, contrasting energy NPCs, token objects created and destroyed.

**The four-token vignette chain:**

| Token | Created | Destroyed | Meaning |
|-------|---------|-----------|---------|
| Bram's Fish Scale | WIS DC 11 pass | storyRender button (Bram eats it as endorsement) | Act 2: formal acknowledgment |
| Oat's Harbor Bead | storyRender button (Follow Bram) | INT DC 12 onPass (used as specimen holder) | Act 3: acknowledged alliance |
| Dunfall Drift Spore | INT DC 12 pass | storyRender button (Fehn opens vial as proof) | Act 4: chemical key to Fehn's identity |
| Highland Letter of Clearance | storyRender button (Fehn confrontation) | — (kept) | Act 5: real credential, real name |

**The French vignette structure:** Objects enter and leave as physical markers of emotional state. The Bram's Fish Scale exists only for the time between Act 2 and Act 3 — it represents the endorsement period. Once Bram has led you to Oat, it has done its work and is consumed. The vignette structure ensures the player's inventory is a timeline of the arc, not a permanent record of it.

**Halvard Fehn's three inconsistencies:**  
1. The Western Revenue Office, Third Circuit — closed 13 years ago (seal on his appointment certificate)
2. The Highland Fleet his grandfather commanded — no Highland Fleet exists
3. His uncle's rank of Commodore-Provisional in the Northern Admiralty — no Northern Admiralty exists, rank doesn't exist

Each inconsistency is introduced in NPC dialogue during the arc, attached to the moment when the player makes progress (befriending Bram, meeting Oat, identifying the drift spore). The inconsistencies are not accusations — they arrive as non-sequiturs from Fehn himself, who is trying to maintain all three identities simultaneously while standing in a drift spore radius that makes him slightly too agreeable to keep the performance tight.

**The drift spore as narrative device:**  
The spore is not a villain's tool and not a McGuffin. It is context. Fehn's inconsistencies are not caused by the spore — he would have them anyway. The spore makes him *willing to let them show*. This is the difference between coercion and gentling. The spore does not make him confess; it makes him stop performing. The confrontation works because the player collected the evidence, not because a chemical did the work for them.

**Arc threading: §SPARK-02 → §PORT-01.**  
Halvard Jesst's real credential (Ninth Circuit seal) is valid at Saltwick. This gives the Highland Letter of Clearance a mechanical use beyond the Dunfall arc — it functions as an alternative credential to pirateCrew_allied and aldousConfessed for SK access. The arc threading now has three credential paths to Saltwick instead of two.

### 3.8 §WHODUNIT-01 — The Bilge Mystery (MS)

**Source transcript:** Ben Byrne monster hunt 4-phase template, applied to a closed-space ship setting.

**Design decision: no new node required.**  
§HUNT-01 and §HUNT-02 each required a new confrontation node (LD and BN) gated by investigation. §WHODUNIT-01 required no new node because MS had no free exits left (N: SB, S: SK, E: OW, W: DK all occupied) and because all four phases can be implemented within a single node via storyRender progression. The battle trigger fires via `storyPreBattle(MS_BILGE)` without a geographic move.

**The wrong theory source is social, not institutional:**  
In §HUNT-01, the wrong theory came from a religious institution (the Guild's spirit offerings). In §HUNT-02, from a civic institution (road wardens). In §WHODUNIT-01, from an individual (the cook). The cook's theory is circumstantially coherent — the passenger came from Saltwick, nobody from Saltwick uses their real name. The theory is wrong for a reason that the cook cannot perceive: the creature entered not through a person but through the hull repair window.

**The two investigation skill checks:**

| Check | Stat | DC | Evidence found | Wrong theory addressed |
|-------|------|-----|----------------|----------------------|
| The Port Drain | INT Investigation | 12 | Sea spawn scale on port grate | Cook's theory wrong — passenger in cabin |
| What Delt Remembers | WIS Insight | 13 | Cold from below; "reading sound" = spawn moving charts | Confirms creature, not person |

Investigation 1 (physical evidence) corrects the theory; Investigation 2 (witness memory) confirms the creature's nature and closes the remaining ambiguity about Delt's condition.

**The passenger Ord as structural element:**  
Ord has no dialogue and never acts. He is a named absence — someone who came from Saltwick (therefore suspicious to the cook), stayed in his cabin (therefore irrelevant to the investigation), and asked for the tallow cask afterward (therefore humanizing). The cook has never apologized. Ord has not asked for one. This is the arc's final beat, delivered in the `onComplete` narrative rather than in any interactive element.

**Connection to the hull repair:**  
The sea spawn entered during the Saltwick hull repair (quest_sk_hull). This creates a consequential relationship between arcs: the repair fixed a structural problem and created a temporal access window that the creature used. Players who repaired the hull at Saltwick and then return to MS encounter a direct consequence of that decision. Players who did not repair the hull encounter the same mystery but without the causal explanation — the knowledge entry still names the mechanism.

### 3.9 §ALCHEMY-01 — The Personal Legend (HL/MI/MS/IS/ML/AE)

**Source inspiration:** Paulo Coelho's *The Alchemist* + Toltec wisdom (Don Miguel Ruiz, *The Four Agreements*). The "Philosophy Stoner" — an escortee who is simultaneously earnest, profound, and slightly absurd about everything.

**Design decision: world-spanning escort with zero new nodes.**  
§ALCHEMY-01 threads through six existing nodes (HL, MI, MS, IS, ML, AE) that span roughly four thousand miles of the game world. No new nodes were required. This is the template's defining structural characteristic: the arc is long in narrative distance but free in geographic cost. The escort is implemented as a storyRender block at each node that activates when the correct prior flag is set and the player has not yet reached the next beat.

**The Four Agreements threading:**

| Beat | Node | Toltec agreement | Implementation |
|------|------|-----------------|----------------|
| Hook | HL | Be impeccable with your word | Grandmother gave coordinates, not metaphor |
| Noon plain | MI | Don't take anything personally | Midlands merchant dismisses Roen; Roen observes it passes |
| Ship | MS | Don't make assumptions | Roen assumes the sea will be hostile; it is not |
| Oracle | IS | — (skill check) | CHA DC 11 Persuasion: convince the fortune teller to read |
| Malta crisis | ML | Always do your best | WIS DC 12 Insight: Roen wants to give up; the fisherman's lesson applies |
| Alchemist | AE | All four, in synthesis | The stone was the finder all along |

Each wisdom beat is attached to a real scene at a real node — the agreements are never stated directly by Roen or the game text, only enacted. A player who knows Ruiz will recognize them. A player who doesn't gets a philosophical travel companion who notices things.

**The two-token structure:**

| Token | Created | Destroyed | Meaning |
|-------|---------|-----------|---------|
| Shepherd's Fortune Slip | HL hook (storyRender button) | AE alchemist beat (storyRender button) | The journey record; the fortune teller's slip; exists only while searching |
| Loch Gold Flake | HL return (storyRender button) | — (permanent) | The grandmother was using geographic coordinates; the gold was always there |

The Shepherd's Fortune Slip is held for five nodes and six stages before being relinquished. This is the longest token arc in the game — it outlasts Bram's Fish Scale (2 stages), the Oat's Harbor Bead (2 stages), and the Letter of Marque (1 stage). Its persistence is deliberate: Roen carries it as proof that the journey was real, not as a claim that the prophecy is true.

**The bioluminescence resolution:**  
The Philosophy Stone (Roen's grandmother's stone) is a loch-shore fragment of the Warmth Eel bioluminescent colony — the same organism family as Clot's Glow (§SPARK-01) and the Dunfall Drift Spore (§SPARK-02). The colony concentrates trace gold from highland runoff through its biological process. When Roen drops the stone into the loch, the colony below responds: the Loch Gold Flake surfaces. This makes three arcs share a single underlying organism: §SPARK-01 (Clot's Glow on the Tilbury Star), §SPARK-02 (Dunfall Drift Spore at DF), and §ALCHEMY-01 (grandmother's finder stone, Highland loch). A player who reads all three knowledge entries can reconstruct the organism's range.

**The grandmother's instruction was literal.**  
"The gold is in the loch" is the hook. The fortune teller at IS confirmed it. Roen traveled four thousand miles expecting metaphor, preparing to be disappointed by literalism. The arc's resolution is that the grandmother was using the stone as a geographic locator — a finder's device for a bioluminescent colony that concentrates gold. She spoke literally, precisely, and with complete accuracy. Roen says "That's very annoying" with complete warmth. This is the correct ending.

**No new nodes, one new NPC, two items.**  
§ALCHEMY-01 adds Roen (shepherd, ~40, earnest, mildly ridiculous) and two items to the world. The arc threads through the heaviest-traveled nodes in the game without adding geographic weight. The design lesson: an escort arc does not need its own geography — it borrows the world's.

---

## IV. Arc Threading Map

The naval campaign layer is not a set of independent arcs — they form a thread chain:

```
§SPARK-01 (DK/MS)
   → aldousConfessed, pirateCrew_allied, Letter of True Passage
   
§SPARK-01 SEA (OW)
   → pirateCrew_allied = true (Joint Pirate Debt Note)
   → Saltwick First Mate allied
   
§PORT-01 (SK)
   → credential check: pirateCrew_allied OR aldousConfessed
   → quest_sk_02: "Pembury" address (silent callback to §SPARK-01)
   → quest_sk_hull: hull repair uses Dunfall timber (silent callback to §PORT-02)
   
§NAVAL-01 (SB)
   → Eastern Reach seal connects to §SPARK-01 (Aldous's estate claim)
   → Letter of Marque: valid at three eastern ports (expands navigation options)
   → Keel's test: unresolved thread
   
§PORT-02 (DF)
   → gated by §HL kelpie battle
   → Highland timber → Saltwick dry dock (connects to §PORT-01)
   → Dunfall opens EH epic battleground approach
   
§HUNT-01 (LD)
   → self-contained; anchored at lake area
   → Drowned Compass: Guild captain's name (offline consequence)
   
§HUNT-02 (BN)
   → uses Tessie's existing J1 dialogue (retroactive worldbuilding)
   → Night Hag: relay road open, downstream travel facilitated
```

```
§SPARK-02 (DF)
   → dunfallHarmonyComplete, Highland Letter of Clearance
   → fehnConfessed → Halvard Jesst identified (Ninth Circuit seal)
   → Letter of Clearance valid at SK: third credential path to Saltwick
   
§WHODUNIT-01 (MS)
   → activateCond: saltwickAccessed (passenger came from Saltwick)
   → whodunit2Solved: bilge cleared, port drain sealed
   → Sea Spawn Scale Fragment: evidence of hull breach
   → causal chain: quest_sk_hull (hull repair at SK) → bilge access window → sea spawn entry

§ALCHEMY-01 (HL → MI → MS → IS → ML → AE → HL)
   → activateCond: () => true (always available at HL)
   → roenMet → roenMidlandsWisdom → roenAtSea → roenOracleRead → roenMaltaCrisis → roenAlchemistMet → personalLegendComplete
   → Shepherd's Fortune Slip: created at HL, destroyed at AE
   → Loch Gold Flake: created on HL return; bioluminescent colony connection to §SPARK-01 and §SPARK-02
   → philosophy stone = same organism as Clot's Glow (§SPARK-01) and Dunfall Drift Spore (§SPARK-02)
```

The chain reads: §SPARK-01 → SEA → PORT-01 → NAVAL-01 (all on the Tilbury/MS hub). §PORT-02 and §HUNT arcs are spurs from existing combat nodes. §SPARK-02 runs at DF and feeds back into SK (new third credential path). §WHODUNIT-01 runs at MS and requires SK to be completed first (saltwickAccessed as activateCond). The hub-and-spoke structure allows any arc to be completed without the others, but completing them in the chain order adds meaning at each step.

---

## V. Design Decisions That Could Have Gone Differently

### 5.1 OW between MS and LW vs. as an MS spur

OW was inserted between MS and LW on the main sea route (MS.E was updated from 'LW' to 'OW'). The alternative was to make OW accessible as MS.S or as a junction spur.

The inline insertion was correct because the Warmth Calm is described as blocking the trade lane — "the sea goes calm between Tilbury and the lake approach." An MS.E traversal that now requires resolving OW before reaching LW correctly models the blockage as a travel problem. A spur would have made it optional and ignored.

### 5.2 Saltwick as MS.S vs. as a separate sea approach

SK was placed at MS.S rather than as a junction off OC or BE. This keeps Saltwick on the Tilbury Star's route — it's a port the Star knows about, approaches from the south side, and has been avoiding the official inspection records for eleven years. The geography is consistent with the text.

### 5.3 The Intercept at MS.N vs. between MS and OW

SB was placed at MS.N (above MS, three miles out) rather than inserting between MS.E and OW. The reason: the Intercept is an optional encounter, not a required crossing. Inserting it between MS and OW would make it mandatory for all sea routes. Placing it at MS.N makes it accessible to players who explore north of the Star, while keeping the MS→OW→LW route unblocked.

### 5.4 Dunfall between HL and EH vs. as HL spur

DF was inserted between HL.W and EH (updating both HL.W and EH.E) rather than adding it as a diagonal connection off HL. The inline insertion was correct because it creates a natural geographic sequence: Highland road → village at the loch edge → the loch's deep waters. A diagonal spur would have broken the geographic logic.

### 5.5 Night Hag at BN vs. at an existing node

§HUNT-02 uses a new node (BN) rather than retrofitting an existing node with a monster hunt overlay. The reason: the §HUNT template requires the confrontation node to be gated (accessible only after investigation). Existing nodes with null exits (J1.N) provide the cleanest gate point without modifying main-route traversal.

---

## VI. What REF-03 Still Requires

| Item | Status | Notes |
|------|--------|-------|
| Travel problems (handcrafted) | ✅ Hull repair at SK | Storm damage → hull repair complete |
| Ship-to-ship combat | ✅ §NAVAL-01 (SB) | 3-path crew role selection |
| Boarding combat (two-gangplank) | ⚙️ Not implemented | Requires dedicated combat map node |
| 3–5 interesting ports | ✅ Saltwick + Dunfall added | Total: Tilbury, LH, Saltwick, Dunfall, Malta, IS = 6 ports |
| NPCs traveling with party | ⚙️ Brannick as ship NPC | Requires `travelCompanion` state system |
| Charter a ship at DK | ⚙️ Not implemented | Fast travel; requires new UI element or junction trigger |

The REF-03 "2 more distinct ports" item is now fully satisfied (Saltwick + Dunfall). The two remaining ⚙️ items (boarding combat, charter a ship) require new systems rather than new nodes and are deferred.

---

## VII. What REF-04 Still Requires

| Item | Status | Notes |
|------|--------|-------|
| Wrong theory in setup | ✅ §HUNT-01 (spirit), §HUNT-02 (bandits) | Pattern established |
| Investigation corrects theory | ✅ Both arcs | Skill check chain in both |
| Confrontation rewarded by investigation | ⚙️ No DC reduction implemented | Investigating should lower confrontation DC |
| Salvageable item + world change | ✅ Both arcs | Compass + Relay Token |
| Spare the monster option | ⚙️ Not implemented | §HUNT-03+ should offer choice |

The one missing mechanical piece from REF-04: the investigation should make the confrontation **easier**, not just unlockable. Currently the investigation gates access to the confrontation node but does not modify the monster's effective stats. A future implementation: if the player completes both investigation skill checks, add `storyPreBattle` advantage (or -2 to monster AC) as a flag check. This is a §HUNT-03 design requirement.

---

## VIII. NPC State Summary

| NPC | Node | New flags | Final state |
|-----|------|-----------|-------------|
| Redmast Quartermaster | OW | pirateCrew_allied, warmthEelEscorted | Allied; can be called in at SK |
| Harbormaster Dorit | SK | saltwickAccessed, saltwickJobAccepted, shipRepaired | Allied; Pembury thread planted |
| Mairén Fionn | DF | dunfallAccessed, dfBarterLearned | Allied; Dunfall market open |
| Captain Vera Keel | SB | sbParleySucceeded / sbPapersRead / sbResolved | Resolved (all paths); Letter issued |
| Elder Fisherwoman | LS | huntHookReceived, drownersDefeated | Allied; Guild theory corrected |
| Tessie | J1 | huntHook2Received, hagDefeated2 | Relay road clear; route unobstructed |
| Commissioner Halvard Fehn | DF | spark2HookReceived → fehnConfessed | Revealed as Halvard Jesst; Letter of Clearance issued |
| The Cook | MS | whodunit2HookReceived (trigger) | Still wrong; has not apologized to Ord |
| Crewman Delt | MS | whodunit2WitnessRead | Recovered; proximity sedation dispersed |
| Passenger Ord | MS | (structural element only) | Owed an apology; will not receive one |
| Roen | HL→MI→MS→IS→ML→AE→HL | roenMet → personalLegendComplete | Journey complete; Philosophy Stone dropped; Loch Gold Flake found; "That's very annoying" |

---

## IX. §SPARK Template — Comparative Anatomy

Two instances of the §SPARK template now exist. Their shared structure and divergences:

| Feature | §SPARK-01 (DK/MS/OW) | §SPARK-02 (DF) |
|---------|----------------------|----------------|
| Formal NPC | Inspector Aldous Wren-Pembury | Commissioner Halvard Fehn |
| NPC's real identity | Aldous, fencer, witness protection | Halvard Jesst, harbor informant |
| Creature chain | Cat → Mouse → Tick → Parasite | Cat → Mouse → Drift Spore |
| Chemistry link | Clot's Glow → Warmth Eel | Dunfall Drift Spore (same family) |
| Token chain length | 3 (Writ, Trust, Bead) | 4 (Scale, Bead, Spore, Letter) |
| Final item | Letter of True Passage | Highland Letter of Clearance |
| Arc location | City hub (DK) + ship (MS) | Port town (DF) |
| Threading | SK access via aldousConfessed | SK third credential via Jesst seal |
| Inconsistency trigger | Writ from Saltwick, naval family, estate | Revenue office, Highland Fleet, Northern Admiralty |

The template is now proven as repeatable. Both instances are self-contained but thread into the same SK credential system. A third instance (§SPARK-03) at a future location would follow the same shape: a formal NPC with contradicting identities, a creature kindness chain, 3–4 token objects created and destroyed, and a final credential item with downstream mechanical use.

## X. §WHODUNIT Template — First Instance

§WHODUNIT-01 establishes a new template distinct from §HUNT and §SPARK:

```
§WHODUNIT template:
  1. Missing item + dazed witness (hook: wrong theory from a credible NPC)
  2. Physical evidence check (INT Investigation) → creature theory replaces person theory
  3. Witness memory check (WIS Insight) → creature type confirmed, nature of harm clarified
  4. Confrontation (storyPreBattle at existing node, no new node required)
  5. Resolution: wrong-theory NPC retains wrong theory in social behavior (cook never apologizes)
```

The key design difference from §HUNT: §WHODUNIT confrontation does not require a gated node. The investigation phases and battle all happen at the same node (MS), with the battle triggered by a button in the storyRender block. This is appropriate for ship settings where "deeper into the ship" is not a geographic move but a vertical descent — modeled as a button trigger rather than a cardinal direction.

The cook who doesn't apologize is load-bearing. In §HUNT, the wrong-theory NPC (Guild, road wardens) eventually updates their theory. The cook does not. This creates a persistent off-note in the resolution — the mystery is solved, the bilge is clear, but the social wrong has not been corrected. This is more realistic and more interesting than a clean bow.

---

## XI. §ALCHEMY Template — First Instance

§ALCHEMY-01 establishes a fifth reusable template, distinct from §HUNT, §SPARK, §PORT, and §WHODUNIT:

```
§ALCHEMY template:
  1. Hook: escortee meets player at home location with a received prophecy
     → creates Token 1 (the prophecy record; temporary)
  2. Journey beats: wisdom observation at each node (no skill checks, just flavor + state flag)
     → 2–3 nodes, one beat each, each anchored to a real scene
  3. Oracle: skill check (CHA Persuasion) — receive confirmation or redirection
  4. Crisis: skill check (WIS Insight) — escortee wants to abandon; player reads why they shouldn't
  5. Alchemist: the synthesis beat — no new content, just recognition
     → destroys Token 1
  6. Return: treasure-was-home resolution
     → creates Token 2 (permanent; physical evidence that the prophecy was literal)
     → knowledge entry names the mechanism
```

**Key differences from other templates:**

| Feature | §ALCHEMY | §SPARK | §HUNT | §WHODUNIT |
|---------|----------|--------|-------|-----------|
| New nodes required | 0 | 0–1 | 1–2 | 0 |
| Wrong theory | None — prophecy is true | NPC identity | Creature type | Cargo thief |
| Skill checks | 2 (CHA + WIS) | 2 (WIS + INT) | 2 (INT + WIS) | 2 (INT + WIS) |
| Resolution | Literal geography | Identity revealed | Creature defeated | Creature defeated |
| Companion NPC | Yes (travels with you) | No | No | No |
| Token flow | 2 sequential | 3–4 chain | — | — |

**The §ALCHEMY template runs against the player's expectation.** Every other resolution arc either corrects a wrong theory (§HUNT, §WHODUNIT) or reveals a hidden identity (§SPARK). §ALCHEMY presents a prophecy and then fulfills it literally. The Alchemist's irony is that the sophisticated thing (the journey, the wisdom, the crisis) turns out to have served a simple claim that was always true. The grandmother said the gold was in the loch. It was. The journey was necessary not to find the gold but to understand how to surface it.

**The Philosophy Stoner tone:**  
Roen applies wisdom frameworks to mundane situations with complete sincerity. He is not mocking the frameworks. He is not a comic-relief character. He genuinely believes that understanding why the Midlands merchant dismissed him without taking it personally is a useful exercise in self-knowledge, and he is correct. The absurdity is not that he is wrong — it is that he is right at the wrong scale, in the wrong register, with complete earnestness. This creates a companion who is both annoying and useful, which is the correct companion energy for a quest about learning to value what you already have.

---

## XII. Conclusion

The naval campaign layer (Sessions 1–3) adds 7 nodes, ~34 quests, 13 items, and 9 new NPCs to *The Shattered Codex*. It is architecturally a single connected graph centered on the Tilbury Star (MS), with spurs to the Highland (DF), the relay road (BN), and the lake (LD). The arc threading runs from §SPARK-01 through §PORT-01 and §NAVAL-01 via the reputation/credential system, from §HL combat through §PORT-02 via the kelpie-gate, from §PORT-01 (hull repair) through §WHODUNIT-01 (bilge entry) via the repair access window, and from the Warmth Eel bioluminescent colony (§SPARK-01) through the Dunfall Drift Spore (§SPARK-02) to the Philosophy Stone (§ALCHEMY-01) — one organism, three arcs.

Five reusable templates have been established and instantiated:
- **§SPARK** (improv friendship arc): 2 instances — DK/MS/OW and DF
- **§HUNT** (4-phase monster hunt): 2 instances — LD and BN
- **§PORT** (reputation-gated port culture): 2 instances — SK and DF
- **§WHODUNIT** (closed-space mystery): 1 instance — MS bilge
- **§ALCHEMY** (world-spanning escort; prophecy fulfilled literally): 1 instance — HL→MI→MS→IS→ML→AE→HL

Each template has a proven implementation. The next session can instantiate any of them at a new location with new characters without re-engineering the underlying quest architecture. §ALCHEMY-01 in particular demonstrates that a world-spanning arc requires no new nodes — six existing nodes at different geographic scales serve as waypoints for a companion whose journey crosses them all.

The three unresolved threads are Vera Keel (what she was testing, who sent her), the cook who did not apologize, and Keel's Eastern Reach connection to Aldous Wren-Pembury. All three are deliberate. None are documented here because none are yet decided.

---

**Filed:** 2026-05-28  
**Retrospective multipass added:** 2026-05-28  
**§ALCHEMY-01 added:** 2026-05-28  
**Cross-references:** `plan.md §DESIGN-REF` · `plan.md §NAVAL-01` · `plan.md §PORT-01/02` · `plan.md §HUNT-01/02` · `plan.md §SPARK-02` · `quest.md §HUNT-01` · `lab-report-meta-process-loop-expansion.md §III`  
**Nodes added:** OW(139), LD(140), BN(141), SK(142), DF(143), SB(144), DA3(138)  
**Total live quests after this layer:** ~151
