<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report: The Wisdom Arc — Robert Greene's Laws of Human Nature as Quest Mechanics

**Author:** Claude (Sonnet 4.6) + roll2hit.com design sessions  
**Date:** 2026-05-28  
**Classification:** Arc Design / Companion Quest / Behavioral Wisdom Systems  
**Audience:** Electrical Engineering / Computer Science background; video game designer / programmer  
**Depends on:** §ALCHEMY-01 complete (personalLegendComplete = true)

---

## Abstract

This report documents the design and mission structure for **§WISDOM-01: The Book of Human Nature** — a sequel arc for Roen, the shepherd-philosopher introduced in §ALCHEMY-01, in which he moves from self-knowledge (Personal Legend) to outward knowledge (human behavior). The source material is Robert Greene's *The Laws of Human Nature* (2018) and *The 48 Laws of Power* (1998). Six laws are extracted, adapted to D&D skill-check mechanics, and applied to six existing game nodes. Each law functions as a lens for a skill check that would not exist without it — the player does not collect wisdom passively but uses each law to read a real situation at a real location. This is the defining difference from §ALCHEMY-01 (wisdom-as-observation) versus §WISDOM-01 (wisdom-as-tool). Eight new quests are proposed, two new items, and one new named NPC (Master Fenn Ardley, deceased — the author of the text, documented through fragments). Roen's commentary on each law in his "Philosophy Stoner" register provides the arc's voice.

---

## I. Source Material — Robert Greene Extracted

### 1.1 The two relevant Greene works

| Work | Year | Frame | Core claim |
|------|------|-------|-----------|
| *The 48 Laws of Power* | 1998 | Strategic; amoral; historical examples | Human interaction follows predictable power dynamics; ignoring the laws puts you at a disadvantage |
| *The Laws of Human Nature* | 2018 | Psychological; observational; evolutionary | Humans are driven by forces they don't acknowledge; naming those forces gives you perspective on others and yourself |

Both works draw on historical figures (Machiavelli, Sun Tzu, Queen Elizabeth I, Howard Hughes, Pericles, Martin Luther King Jr.), philosophical traditions (Stoic, Jungian, Nietzschean), and behavioral science. The 48 Laws are prescriptive tactical rules; the Laws of Human Nature are descriptive psychological observations. D&D can use both registers.

### 1.2 Extraction criteria

A law is usable in *The Shattered Codex* if it meets all three conditions:

1. **Mechanizable** — can be expressed as a skill check stat/DC pair with a clear pass/fail meaning
2. **Observable in context** — the law can be enacted through an existing or minimally new NPC at an existing node
3. **Carries moral complexity** — the law is a tool, not a cheat code; using it does not make the player a manipulator but an accurate reader

### 1.3 Laws rejected and why

| Law | Reason rejected |
|-----|----------------|
| 48L-1: Never outshine the master | Requires court-hierarchy NPCs not yet in the world |
| 48L-6: Court attention at all costs | Too antagonistic to the game's tone |
| LHN-2: Transform self-love into empathy | Already enacted in §ALCHEMY-01 (Roen and the Malta fisherman) |
| LHN-11: Beware grandiosity | No existing NPC embodies the grandiose arc in a testable way |
| LHN-14: Resist conformity | Requires group-pressure scene; not available at current nodes |
| LHN-17: Seize the historical moment | Passive; no skill check available; deferred to narrative only |
| LHN-18: Meditate on mortality | Powerful but better as §LXXIII tidal chain flavor than a quest |

---

## II. The Six Selected Laws

### 2.1 Selection table

| Code | Law | Source | Stat | DC | Node |
|------|-----|--------|------|----|------|
| W1 | The Law of Role-playing — *See through masks* | LHN-3 | WIS Insight | 13 | DK |
| W2 | The Law of Aggression — *See the hostility around you* | LHN-16 | WIS Insight | 12 | SK |
| W3 | Discover Each Man's Thumbscrew | 48L-33 | INT Investigation | 11 | SB |
| W4 | The Law of Shortsightedness — *Elevate your perspective* | LHN-6 | INT History | 12 | BK |
| W5 | Assume Formlessness — *Adapt; rigidity is the vulnerability* | 48L-48 | WIS Insight | 12 | AE |
| W6 | The Law of Repression — *Confront your shadow* | LHN-9 | WIS Save | 14 | VS |

### 2.2 Why these six

**W1 (Masks/DK):** The game world already has two mask-wearing NPCs (Aldous Wren-Pembury, Halvard Fehn). A new merchant at DK who follows the same pattern is not redundant — it's the law in practice. The fragment teaches the player to see it before the deception completes.

**W2 (Aggression/SK):** Dorit at SK is polite and contained. Roen, watching the interaction during the player's quest_sk_02 follow-up, notices something the player missed. The law gives the player retroactive access: with the fragment, a new WIS check lets them soften what would otherwise become a harder negotiation.

**W3 (Thumbscrew/SB):** Vera Keel's test was about something specific. The Letter of Marque arc ended with an unresolved thread ("what she was looking for, who sent her"). The W3 fragment allows the player to read Keel's archived log in the chart room and understand *what* she was protecting. INT check. Does not fully resolve the Keel thread — that is deliberate — but names the mechanism.

**W4 (Shortsightedness/BK):** Birka (§DESIGN-03 planned) is a guild city. Guild elders make deals. The W4 fragment teaches the player to project outcomes — a guild deal that looks profitable in the short term has a pattern that names what it will cost. INT History: what has happened before when this kind of deal was made?

**W5 (Formlessness/AE):** Athens/Alexandria already has Roen's §ALCHEMY-01 alchemist beat. The W5 fragment triggers after roenAlchemistMet — the player can revisit AE with Roen and encounter a philosophical debate. The law teaches the player to release a committed position when the evidence has shifted. WIS Insight: recognize the moment when holding your argument becomes a liability.

**W6 (Repression/VS):** Visby underground (§DUNGEON-01 planned) will have a shadow/mirror element. The W6 fragment enables a non-combat resolution to the shadow encounter: accept what it reflects rather than fight it. WIS saving throw: the shadow tests whether you can receive its observation without flinching. The combat option remains. Accepting gives better loot.

---

## III. Mission Structure

### 3.1 Quest list

| Quest ID | Type | Node | Title | Mechanic | Flag set |
|----------|------|------|-------|----------|---------|
| quest_wis_00 | side | VS | The Manuscript Hook | storyRender button | wisHookReceived |
| quest_wis_01 | skill_check WIS DC 13 | DK | Mask Check | Insight: read Silas Vance | wisPage1_masks |
| quest_wis_02 | skill_check WIS DC 12 | SK | What Dorit Already Knew | Insight: read contained hostility | wisPage2_aggression |
| quest_wis_03 | skill_check INT DC 11 | SB | The Chart Room | Investigation: Keel's archived log | wisPage3_thumbscrew |
| quest_wis_04 | skill_check INT DC 12 | BK | Three Years Out | History: name the guild deal's outcome | wisPage4_sight |
| quest_wis_05 | skill_check WIS DC 12 | AE | The Philosopher's Pivot | Insight: release the argument | wisPage5_form |
| quest_wis_06 | skill_check WIS DC 14 | VS | The Shadow Room | Saving throw: accept the reflection | wisPage6_shadow |
| quest_wis_07 | side | VS | Ardley's Book | completeFn: all 6 wisPage flags | personalLegendMature |

**Total:** 8 quests. Running total after §WISDOM-01: ~159 live.

### 3.2 Activation chain

```
§ALCHEMY-01 complete (personalLegendComplete = true)
   → quest_wis_00 activates at VS
   → storyRender button: wisHookReceived = true; creates 'Pages of the Ardley Manuscript'
   
quest_wis_00 complete (wisHookReceived)
   → quest_wis_01–06 activate at their respective nodes
   → each can complete in any order (no sequential dependency)
   
All 6 wisPage flags set
   → quest_wis_07 completeFn passes
   → storyRender button at VS fires resolution
   → 'Pages of the Ardley Manuscript' consumed; 'Ardley's Complete Laws' created
   → personalLegendMature = true; +600 XP; knowledge entry
```

### 3.3 Flag specification

New flags to add to `_S_DEFAULTS()`:

```javascript
// §WISDOM-01: The Book of Human Nature
wisHookReceived: false,
wisPage1_masks: false,
wisPage2_aggression: false,
wisPage3_thumbscrew: false,
wisPage4_sight: false,
wisPage5_form: false,
wisPage6_shadow: false,
personalLegendMature: false,
```

### 3.4 Quest detail — per quest

---

**quest_wis_00** — The Manuscript Hook  
`type: 'side', node: VS, activateCond: () => S_story.personalLegendComplete`

*Roen appears at Visby with a tattered portfolio. He has been corresponding with the archivist of the underground guild — apparently the guild keeps a copy of a text that was quietly suppressed three decades ago. He says the author was a court historian named Ardley. He says Ardley documented things no one wanted documented. He says the title page calls it "A Complete Account of Human Nature in Its Unreformed State, Vol. I." He says there are at least six more volumes scattered across the world. He looks very happy about this.*

**storyRender button:** "Help Roen collect the pages"  
`wisHookReceived = true; inv.push({ name:'Pages of the Ardley Manuscript', icon:'📖', type:'misc', desc:'A growing portfolio of Ardley\'s fragments, collected by Roen. Six more sections needed.', sell:0 })`

XP: 100 on accept.

---

**quest_wis_01** — Mask Check (W1: The Law of Role-playing)  
`type: 'skill_check', stat: 'WIS', skill: 'Insight', dc: 13, node: DK, activateCond: () => S_story.wisHookReceived`

Fragment text (shown in quest description):  
*"Every person wears a social mask. The mask is not the lie — the mask IS the performance. What you are looking for is not the lie beneath the mask but the gap: the moment when the performance requires more effort than usual. That effort is the tell."*  
*— Master Fenn Ardley, 'A Complete Account,' Ch. III*

Roen's commentary: *"There is a cloth merchant at the Tilbury dock who holds bolts of fabric the way my grandfather held a lamb — which is to say, like something that could run. I find this interesting."*

**Context NPC:** Silas Vance, cloth merchant at DK. New NPC, no prior flags. His hands have rope callousing, not bale callousing — he was a rigger, not a merchant. He is not dangerous (no combat); he is running a quiet re-export scheme. Passing the check reveals his past and earns his cooperation (he knows a route discount at SK).

`onPass: () => { S_story.wisPage1_masks = true; S_story.gold += 150; }`  
`onFail: () => { S_story.wisPage1_masks = false; }` (retry available)  
XP: 250 pass.

---

**quest_wis_02** — What Dorit Already Knew (W2: The Law of Aggression)  
`type: 'skill_check', stat: 'WIS', skill: 'Insight', dc: 12, node: SK, activateCond: () => S_story.wisHookReceived && S_story.saltwickAccessed`

Fragment text:  
*"Aggression does not announce itself. It dresses as patience, as courtesy, as professional neutrality. You will see it only in small signals: the way someone's voice drops one register when they say a name, the way they touch an object on their desk before they answer. These are not accidents. They are the leak."*  
*— Master Fenn Ardley, 'A Complete Account,' Ch. XVI*

Roen's commentary: *"Dorit touched the docking ledger four times while you were talking. Not to write anything. Just to touch it. I have been thinking about what that means for several days."*

**Context:** Dorit at SK has always been slightly contained. The W2 fragment allows the player to read her properly: she is not hostile to the player but to the situation the player represents (irregular docking, memory of Aldous's era). Passing the check reveals what Dorit is actually protecting (the dry dock contracts, which are contingent on Aldous's old seal remaining unexamined). Does not unlock new content — but adds a knowledge entry that connects §PORT-01 to §SPARK-01 in a new way.

`onPass: () => { S_story.wisPage2_aggression = true; /* knowledge entry */ }`  
XP: 250 pass.

---

**quest_wis_03** — The Chart Room (W3: Discover Each Man's Thumbscrew)  
`type: 'skill_check', stat: 'INT', skill: 'Investigation', dc: 11, node: SB, activateCond: () => S_story.wisHookReceived && (S_story.sbResolved || S_story.sbPapersRead)`

Fragment text:  
*"Every person has one thing they are trying to protect above all others. It is not always what they say they are protecting. Look for the thing they never mention — the omission is usually more revealing than the declaration. Their thumbscrew is the thing that makes them go quiet."*  
*— Master Fenn Ardley, 'A Complete Account,' Ch. XXXIII*

Roen's commentary: *"Keel talked about the commission. She talked about the eastern run. She talked about the date. She did not talk about the navigator. Not once. In my experience, people do not avoid talking about things that are not important."*

**Context:** The chart room at SB has an archived log from the night of the intercept. Passing the check identifies what Keel was actually protecting: not the commission (void) and not the run (exploratory) but the navigator's notes, which contain survey data for a sea route that would reroute highland timber through the Eastern Reach and cut Tilbury out entirely. This partially resolves the Keel thread. Her "test" was to see if the player would notice. The navigator's notes are gone — Keel took them. But the player now knows the shape of what she wanted.

`onPass: () => { S_story.wisPage3_thumbscrew = true; /* knowledge entry about Keel's navigator */ }`  
XP: 300 pass.

---

**quest_wis_04** — Three Years Out (W4: The Law of Shortsightedness)  
`type: 'skill_check', stat: 'INT', skill: 'History', dc: 12, node: BK, activateCond: () => S_story.wisHookReceived && S_story.birkaAccessed`

Fragment text:  
*"The present moment is always vivid and always incomplete. The person who can force themselves to ask 'what will this look like in three years?' is rare, because the exercise requires abandoning the comfort of the immediate. The guild man who takes the good deal today rarely asks what it will cost his successor."*  
*— Master Fenn Ardley, 'A Complete Account,' Ch. VI*

Roen's commentary: *"The guild master is very pleased with the new Baltic contract. I asked him what happens when the Highland timber season fails. He said the timber season does not fail. I said it failed twice in the last thirty years. He said that is different. I have been thinking about what 'different' means."*

**Context:** Birka's guild council has struck a supply deal that ties their dock access to a single highland timber source (the same Dunfall-adjacent forest referenced in §PORT-02). INT History DC 12: name what happened to the last Birka guild that over-indexed on a single supplier (historical record, two generations back). Passing gives the guild master pause — not enough to stop the deal, but enough to add a contingency clause that opens the Nordic trade route for the player later.

`onPass: () => { S_story.wisPage4_sight = true; S_story.birkaRepImproved = true; }`  
XP: 300 pass.

---

**quest_wis_05** — The Philosopher's Pivot (W5: Assume Formlessness)  
`type: 'skill_check', stat: 'WIS', skill: 'Insight', dc: 12, node: AE, activateCond: () => S_story.wisHookReceived && S_story.roenAlchemistMet`

Fragment text:  
*"The man who has committed to a position and then found the position untenable has two choices: defend the position anyway, or release it. The first is called dignity. The second is called intelligence. They feel identical from the outside. Only the person inside knows which one they are doing."*  
*— Master Fenn Ardley, 'A Complete Account,' Ch. XLVIII*

Roen's commentary: *"The philosopher and I argued for two hours about whether gold has intrinsic value or whether value is a social agreement. I was right, then I was wrong, then I was right again from the other direction. At some point I stopped knowing which direction I was arguing from. This felt like progress."*

**Context:** The AE philosophical debate is new content at the Athens/Alexandria node. A local Stoic has a position on property rights that contradicts §ALCHEMY-01's resolution (the loch gold was Roen's because he found it, but was it the colony's because it grew it?). WIS Insight DC 12: recognize the moment when your argument has become circular and consciously release it. The Stoic, observing the release, opens a new dialogue branch about the nature of persistence — which yields a knowledge entry and the Stoic's letter of introduction to VS.

`onPass: () => { S_story.wisPage5_form = true; /* knowledge entry + stoic_letter flag */ }`  
XP: 300 pass.

---

**quest_wis_06** — The Shadow Room (W6: The Law of Repression)  
`type: 'skill_check', stat: 'WIS', saveType: 'save', dc: 14, node: VS, activateCond: () => S_story.wisHookReceived && S_story.visbyUnderground`

Fragment text:  
*"The parts of yourself you have refused to examine do not disappear. They operate below the surface. They surface as overreactions, as inexplicable preferences, as patterns you cannot explain. The shadow is not your enemy — it is the part of you that has been waiting to be named."*  
*— Master Fenn Ardley, 'A Complete Account,' Ch. IX*

Roen's commentary: *"There is a room in the lower level that I have been in four times now. It shows you something. I will not say what it showed me. It was accurate, though. I gave it a formal nod. It seemed appropriate."*

**Context:** VS underground has a mirror chamber (§DUNGEON-01 planned). This quest unlocks the non-combat resolution path. WIS Save DC 14: accept what the mirror reflects (the shadow observation names a pattern from the player's story — a recurring choice or avoidance). Pass: the mirror dissolves, yields `Shadow Shard` item (rare component, sell 25) + knowledge entry + wisPage6_shadow. Fail: combat encounter, Shadow Construct (medium difficulty), no item but wisPage6_shadow still sets on combat victory.

`onPass: () => { S_story.wisPage6_shadow = true; inv.push({ name:'Shadow Shard', icon:'🔮', type:'misc', desc:'A fragment of the VS mirror, offered freely. It reflects nothing — whatever was in it has been acknowledged.', sell:25 }); }`  
`completeFn: () => S_story.wisPage6_shadow` (combat path also counts)  
XP: 350 pass; 200 combat.

---

**quest_wis_07** — Ardley's Book  
`type: 'side', node: VS, activateCond: () => S_story.wisHookReceived`  
`completeFn: () => ['wisPage1_masks','wisPage2_aggression','wisPage3_thumbscrew','wisPage4_sight','wisPage5_form','wisPage6_shadow'].every(f => S_story[f])`

*Roen is sitting at a table in the Visby archive with all six sections laid out. He has been arranging them by theme, then by date, then by theme again. He says Ardley wrote all six sections in the same year — the year before he was dismissed from his court post. He says the dismissal happened because Ardley gave a lecture that named the court treasurer's behavior pattern in front of the full council. He says the treasurer had Ardley's library confiscated and the text dispersed. He says the treasurer's family held the city's dock contracts for sixteen more years, then lost them to a Baltic competitor who had read a copy of Ardley's text that had drifted east.*

*He says: "I suppose the laws work whether or not you want them to."*

**storyRender button:** "Bind the pages"  
```
const mIdx = inv.findIndex(i => i.name === 'Pages of the Ardley Manuscript');
if (mIdx !== -1) inv.splice(mIdx, 1);
inv.push({ name:"Ardley's Complete Laws", icon:'📚', type:'misc', desc:'All six sections of Master Fenn Ardley\'s \'A Complete Account of Human Nature in Its Unreformed State.\' The masks law. The aggression law. Each man\'s thumbscrew. The shortsightedness law. The formlessness law. The shadow law. Roen has added a foreword in his own handwriting. It says: "These are not rules. They are a pair of glasses."', sell:50 });
S_story.personalLegendMature = true;
S_story.gold += 400;
S_story.xp += 600;
S_story.knowledge.push('Ardley\'s Laws: Master Fenn Ardley documented six laws of human behavior and was dismissed from court service for naming the treasurer\'s behavior pattern publicly. The text was scattered; its dispersal east eventually cost the treasurer\'s family their dock contracts. The laws were proven by the act of suppressing them. Roen notes: these are a pair of glasses, not a rulebook.');
```

XP: 600 on completion.

---

## IV. Design Principles

### 4.1 Wisdom-as-tool, not wisdom-as-quote

In §ALCHEMY-01, Roen's wisdom beats are observational — he notices things, names them, moves on. The player receives the observation but does not use it mechanically. §WISDOM-01 inverts this: each fragment is a tool. The player reads the law, then the game immediately presents a situation where the law is applicable, and a skill check tests whether the player can apply it correctly.

The law is not a passive reward. It is a key. Each skill check only unlocks after the corresponding fragment has been found (wisHookReceived + quest order). A player who reaches DK without reading the fragment cannot make the Mask Check.

### 4.2 The Ardley story as secondary arc

The six fragments tell Ardley's story by implication: a court historian who watched people closely enough to document their patterns, named those patterns at the wrong moment to the wrong person, was dismissed, and had his work scattered. The treasurer's dynasty that destroyed him was itself eventually destroyed by someone who had read the scattered copy.

This is Ardley's ghost story: the laws work whether or not you want them to. The player never meets Ardley. They only meet what he saw.

### 4.3 Roen's voice

Roen's commentary on each law is not a paraphrase — it is a translation. He encounters the law through specific, concrete observations that are too specific to be wisdom (his goat, his cousin, his grandfather with the lamb) and too accurate to be coincidence. This is the "Philosophy Stoner" register: profound at the wrong scale, in the wrong register, with complete sincerity.

Each Roen commentary line is included in the quest description, not in a separate storyRender block. The law comes from Ardley (scholarly); the application comes from Roen (literal and slightly absurd); the test comes from the skill check (mechanical).

### 4.4 The unresolved Keel thread gets a shape

The W3 quest (Thumbscrew/SB) does not close the Keel thread — it names the mechanism. The navigator's notes are gone. Keel is gone. But the player now knows that her test was not about the commission or the run; it was about whether they would notice the thing she wasn't saying. This is a partial resolution that makes the full thread more interesting, not less.

---

## V. §WISDOM Template — First Instance

```
§WISDOM template:
  1. Hook: companion (Roen) has the title page and first clue at a knowledge-archive node
     → creates token item (incomplete manuscript; temporary)
     → hook activateCond: prior companion arc complete (personalLegendComplete)
  
  2. Fragment collection: 4–6 skill checks at distinct nodes
     → each check requires a different stat (WIS Insight × 3, INT × 2, WIS Save × 1)
     → each law is displayed in the quest description before the check
     → each check applies the law to a real NPC or situation (not hypothetically)
     → fragments can complete in any order (parallel activation)
  
  3. Resolution: return to hook node; companion binds the pages
     → completeFn checks all fragment flags
     → destroys incomplete manuscript; creates complete book (permanent)
     → knowledge entry synthesizes the arc
```

**Template differences from prior arcs:**

| Feature | §WISDOM | §ALCHEMY | §SPARK | §HUNT |
|---------|---------|----------|--------|-------|
| Companion? | Yes (Roen) | Yes (Roen) | No | No |
| New nodes required | 0 | 0 | 0–1 | 1–2 |
| Wrong theory? | No | No | Yes (NPC identity) | Yes (creature type) |
| Fragment collection? | Yes (6 fragments) | No | No | No |
| Order dependency? | Parallel | Sequential | Sequential | Sequential |
| Skill check purpose | Apply a law | Confirm wisdom | Identify creature | Investigate threat |

§WISDOM is the first arc with parallel fragment collection. The player can do fragments in any order because each law is independent — understanding masks does not require first understanding aggression. This creates a replayable arc where different players encounter the laws in different orders and through different scenes.

---

## VI. Items

| Item | Icon | Sell | Source | Significance |
|------|------|------|--------|-------------|
| Pages of the Ardley Manuscript | 📖 | 0 | quest_wis_00 | Created at hook; exists during fragment collection; consumed at resolution |
| Shadow Shard | 🔮 | 25 | quest_wis_06 (pass only) | VS mirror fragment; non-combat resolution reward |
| Ardley's Complete Laws | 📚 | 50 | quest_wis_07 | Permanent; complete 6-law text; Roen's foreword; "a pair of glasses" |

---

## VII. Arc Threading

§WISDOM-01 threads into existing arcs rather than creating new ones:

```
§ALCHEMY-01 (personalLegendComplete)
   → activates §WISDOM-01 hook at VS
   → Roen's characterization continues: self-knowledge → world-knowledge

§SPARK-01 (aldousConfessed)
   → quest_wis_01 (DK): Silas Vance echoes the Aldous pattern (mask-wearing)
   → does not reopen §SPARK-01; adds a second instance of the same law in a new NPC

§PORT-01 (saltwickAccessed)
   → quest_wis_02 (SK): Dorit's contained aggression retroactively explained
   → wisPage2_aggression adds a knowledge entry connecting §PORT-01 to §SPARK-01

§NAVAL-01 (sbResolved)
   → quest_wis_03 (SB): Keel's thumbscrew identified
   → Keel thread partially resolved; navigator note shape established

§PORT-02 / §DESIGN-03 (birkaAccessed)
   → quest_wis_04 (BK): Birka guild deal shortsightedness
   → birkaRepImproved flag: opens Nordic trade route possibility

§ALCHEMY-01 (roenAlchemistMet)
   → quest_wis_05 (AE): Stoic debate / formlessness
   → stoic_letter flag: letter of introduction to VS

§DUNGEON-01 (visbyUnderground — PLANNED)
   → quest_wis_06 (VS): shadow room non-combat resolution
   → Shadow Shard: rare material for future dungeon crafting
```

The threading principle: §WISDOM-01 does not add new lore — it adds new ways to read lore that already exists. Each skill check is a second look at a situation the player has already passed through. The arc rewards players who have done other arcs, because each fragment makes something from those arcs newly legible.

---

## VIII. NPC Inventory

| NPC | Node | Arc role | Status after arc |
|-----|------|----------|-----------------|
| Roen | VS/DK/SK/SB/BK/AE | Companion; curator of fragments; commentator | personalLegendMature; returns to HL |
| Master Fenn Ardley | (deceased) | Author of the text; present only through fragments | Partial vindication; still dead |
| Silas Vance | DK | New; mask-wearer (W1 application) | Aligned after Mask Check pass; route discount |

---

## IX. Open Questions

**Q1: Does §WISDOM-01 need a VS underground gate?**  
quest_wis_06 uses `activateCond: () => S_story.wisHookReceived && S_story.visbyUnderground`. This means §DUNGEON-01 (VS underground) must be at least partially implemented before W6 is reachable. Options: (a) make W6 activateCond just `wisHookReceived` and gate the shadow room within the VS storyRender; (b) wait for §DUNGEON-01 implementation. Recommendation: gate on wisHookReceived only, implement shadow room as a VS storyRender block that becomes available once the player has the fragment.

**Q2: Does Roen appear at every fragment node?**  
Implementation question. Option A: Roen is a permanent storyRender presence at all six nodes once wisHookReceived, visible as a small "Roen's note" panel. Option B: Roen only appears at hook and resolution; his commentary appears in quest descriptions only. Option B is simpler and prevents storyRender block proliferation at high-traffic nodes like DK and SK. Recommendation: Option B.

**Q3: What does personalLegendMature enable?**  
This flag is currently only set by §WISDOM-01 completion. Possible downstream uses: (a) activates a final Roen farewell at HL; (b) unlocks a §ALCHEMY-02 arc (a third Roen arc, if designed); (c) provides a passive description modifier when talking to philosophical NPCs. For now: set the flag, leave the downstream uses for the next session.

**Q4: The Keel thread — how much resolution is too much?**  
W3 names the shape of what Keel was protecting (the navigator's notes → Baltic route data) without closing the question of who sent her. This feels correct — the thread should have a shape before it has an answer. But if the navigator's notes are referenced in W3, a future arc will need to either confirm or deny the Baltic route hypothesis. This is a commitment, not a closure.

---

## X. Implementation Checklist

```
_S_DEFAULTS() additions:
  □ wisHookReceived: false
  □ wisPage1_masks: false
  □ wisPage2_aggression: false
  □ wisPage3_thumbscrew: false
  □ wisPage4_sight: false
  □ wisPage5_form: false
  □ wisPage6_shadow: false
  □ personalLegendMature: false

QUEST_DB additions (8 quests):
  □ quest_wis_00: side, VS, activateCond: personalLegendComplete
  □ quest_wis_01: skill_check WIS 13, DK, activateCond: wisHookReceived
  □ quest_wis_02: skill_check WIS 12, SK, activateCond: wisHookReceived + saltwickAccessed
  □ quest_wis_03: skill_check INT 11, SB, activateCond: wisHookReceived + sbResolved
  □ quest_wis_04: skill_check INT 12, BK, activateCond: wisHookReceived + birkaAccessed
  □ quest_wis_05: skill_check WIS 12, AE, activateCond: wisHookReceived + roenAlchemistMet
  □ quest_wis_06: skill_check WIS 14 (save), VS, activateCond: wisHookReceived
  □ quest_wis_07: side, VS, completeFn: all 6 wisPage flags

storyRender blocks needed:
  □ story-wis-vs: hook + resolution states
    (hooks when personalLegendComplete, !wisHookReceived OR completeFn)
  □ story-wis-wis01-dk: shows Roen's commentary on W1 when wisHookReceived + !wisPage1
    (minimal — one panel, one button links to quest)
  NOTE: Recommend quest-description-only for Roen commentary at DK/SK/SB/BK/AE
        Only VS needs full storyRender blocks (hook + resolution)

Items (inv operations in quest callbacks):
  □ quest_wis_00 onAccept: create 'Pages of the Ardley Manuscript' (📖)
  □ quest_wis_06 onPass: create 'Shadow Shard' (🔮)
  □ quest_wis_07 button: splice 'Pages of the Ardley Manuscript'; create 'Ardley's Complete Laws' (📚)

JS syntax validation after each edit block
```

---

**Filed:** 2026-05-28  
**Status:** Design complete; implementation pending  
**Depends on:** §ALCHEMY-01 (personalLegendComplete flag), birkaAccessed flag (§DESIGN-03), visbyUnderground flag (§DUNGEON-01)  
**Cross-references:** `plan.md §DESIGN-REF` · `lab-report-naval-campaign-layer.md §3.9` · `plan.md §ALCHEMY-01` · `quest.md`  
**Total new quests if implemented:** 8. Running total: ~159 live.  
**Total new items if implemented:** 3 (Pages, Shadow Shard, Complete Laws)  
**Total new NPCs:** 2 (Silas Vance, Master Fenn Ardley — deceased)

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
