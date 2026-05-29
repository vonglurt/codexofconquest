<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# On the Asymptotic Kindness of Quest Graphs: Prosocial Mechanics, Token Automata, and the Probabilistic Case Against Hitting Things in Narrative Role-Playing Systems

**IEEE Transactions on Interactive Narrative Systems and Applied Whimsy**  
**Vol. 7, No. 3, 2026**

---

**Authors:**  
Roll2Hit.com
MIT Public Domain

---

> *"That's very annoying," he says. He says it with complete warmth.*  
> — Quest corpus, §ALCHEMY-01, resolution beat

---

## Abstract

We present a formal analysis of prosocial quest mechanics in a narrative role-playing system built on a d20 uniform-distribution resolution engine, examining six emergent quest templates across approximately 159 implemented quests and 150 world nodes. We demonstrate, with more rigor than the situation probably requires, that the optimal expected-value path through multiple quest families is explicitly non-violent: the system rewards the player for noticing things, naming things, accepting things, and occasionally befriending harbor seals. We formalize the token object lifecycle as a finite-state automaton, model the "wrong theory NPC" as a Bayesian prior requiring evidence-based updating, and analyze the six behavioral laws of the §WISDOM arc as a direct mapping from applied psychology to game mechanics. We further establish, via elementary graph theory, that a single bioluminescent colonial organism functions as an unexpected spanning-tree connector across three otherwise independent narrative arcs — a result that the authors find both mathematically satisfying and slightly alarming. We conclude with the observation that the probability of the cook apologizing to the passenger she wrongly accused converges to zero, and that this is, perhaps, the most psychologically accurate thing in the entire system. *P*-value: not applicable; the cook is simply like that.

**Index Terms:** prosocial game mechanics, quest state machines, Bayesian prior updating, narrative graph theory, d20 uniform distribution, token automata, kindness as optimal strategy, bioluminescence (formal treatment)

---

## I. Introduction

The conventional wisdom in role-playing game design holds that violence is the lingua franca of player agency. When in doubt, the player hits the monster. The monster, appreciating the attention, hits back. Experience points are awarded. The loop closes. This is, from a game-theoretic perspective, a stable Nash equilibrium — both parties have a dominant strategy (attack), neither can improve their outcome by unilaterally deviating, and everyone leaves with appropriate quantities of treasure and existential bruising [1].

The system under analysis herein commits, deliberately and with apparent relish, to undermining this equilibrium at every available opportunity.

Consider: in the §SPARK-01 arc, the nominal threat is a harbor cat sitting on cargo manifests. The resolution mechanic is a CHA Persuasion check (DC 10 — notably the lowest difficulty class in the entire system¹). In §ALCHEMY-01, the companion NPC walks four thousand miles to confirm that his grandmother's four-word directions were geographically precise. In §WHODUNIT-01, the creature in the ship's bilge is guilty of — and here the authors must quote directly from the game corpus — moving navigation charts aside because they were "on top of the tallow cask," which the creature wanted for food.

The harbor cat, the shepherd, the sea creature who is hungry and moves paper: these are the antagonists. The prosocial observation is the resolution mechanic.

This paper analyzes why this works, from the perspectives of probability theory, formal automata, graph theory, Bayesian inference, and applied psychology, in that order and with increasing degrees of earnestness.

> ¹ *The reader may note that DC 10 corresponds to a pass probability of P(d20 ≥ 10) = 11/20 = 0.55 before ability modifiers — the system's implicit statement that basic kindness should succeed more often than not. This is either a design principle or a touching philosophical position encoded in dice mechanics. We submit it is both.*

---

## II. Background and Related Work

### II-A. The d20 Resolution Engine

The game operates on a standard discrete uniform distribution: one fair twenty-sided die, outcomes {1, 2, ..., 20}, each with probability 1/20 = 0.05. For a check of difficulty class DC *k*, the pass probability without ability modifiers is:

```
P(pass | DC = k) = (21 - k) / 20
```

Table I summarizes the prosocial checks observed across the six arc templates:

**Table I: Prosocial Skill Check Difficulty Analysis**

| Arc | Check | Stat | DC | P(pass, no mod) | What passes means |
|-----|-------|------|----|-----------------|-------------------|
| §SPARK-01 | Befriend the cat | CHA | 10 | 0.55 | Cat drops a fish scale |
| §SPARK-02 | Befriend the harbor seal | WIS | 11 | 0.50 | Seal gives a fish scale |
| §SPARK-02 | Identify the drift spore | INT | 12 | 0.45 | Understand why the commissioner stopped performing |
| §HUNT-01 | Read the hull marks | INT | 12 | 0.45 | Correct the wrong theory |
| §HUNT-02 | Read the territorial line | WIS | 11 | 0.50 | Correct the institutional wrong theory |
| §NAVAL-01 | Parley the intercept | CHA | 12 | 0.45 | No boarding action |
| §NAVAL-01 | Read the papers | INT | 11 | 0.50 | Understand what was actually being tested |
| §WHODUNIT-01 | Read the drain evidence | INT | 12 | 0.45 | Exonerate the innocent passenger |
| §WHODUNIT-01 | Read the witness memory | WIS | 13 | 0.40 | Confirm creature, not person |
| §ALCHEMY-01 | Oracle reading | CHA | 11 | 0.50 | Confirm the journey |
| §ALCHEMY-01 | Malta crisis | WIS | 12 | 0.45 | Prevent abandonment |
| §WISDOM-01 W1 | Read Vance's hands | WIS | 13 | 0.40 | "I was waiting for someone to notice" |
| §WISDOM-01 W4 | Read the stalemate cost | INT | 12 | 0.45 | Name the slow loss |
| §WISDOM-01 W6 | Accept the shadow | WIS | 14 | 0.35 | Receive the shard; room goes quiet |

The mean DC across all prosocial checks is 11.9 (σ = 1.1). This is meaningfully lower than the combat system's attack roll DCs, which are set implicitly by monster armor class values ranging from 11 (shadow, easy tier) to 20 (elite tier). The system's designer has, whether consciously or not, encoded a quantitative preference: *it is statistically easier to understand the situation than to fight your way through it.*²

> ² *We note with professional delight that the shadow construct — the literal embodiment of the repressed self in the §WISDOM-01 arc — has AC 12, yielding P(hit, no mod) ≈ 0.45. The system is telling you: you have roughly equal odds of fighting your shadow as accepting it. Both paths set the same completion flag. The designers are making a philosophical statement in probability space.*

### II-B. Existing Literature on Prosocial Game Mechanics

Prior work on prosocial mechanics in RPG systems has focused primarily on alignment systems [2], dialogue trees [3], and "good/evil" reputation meters [4]. These systems typically implement prosociality as a constraint (you may not attack allied NPCs) or a reward modifier (+reputation for non-lethal resolutions) rather than as a primary resolution mechanic.

The system under analysis differs in a critical respect: **there are quests that cannot be completed by combat at all.** The harbor cat quest resolves on a social check. The companion arcs resolve on storyRender buttons that represent comprehension, not victory. The closed-space mystery resolves on investigation and insight, not on defeating the sea creature (though defeating the sea creature also works, as a fallback, with reduced narrative information).

This is not a constraint system. It is a preference system. The game is not prohibiting violence; it is making non-violence more interesting.

---

## III. Formal Framework: Quest State Machines and Token Automata

### III-A. The Quest as Finite State Machine

Each quest in the system can be formalized as a tuple Q = (S, Σ, δ, s₀, F) where:
- S is the set of observable states (inactive, active, complete, failed)
- Σ is the input alphabet (player actions: skill check attempt, button click, node traversal, item possession)
- δ: S × Σ → S is the transition function
- s₀ = inactive is the initial state
- F = {complete} is the accepting state

The `activateCond` field implements the condition under which δ(inactive, traversal) = active. The `completeFn` implements the condition under which δ(active, *) = complete. The system's elegance lies in the composability of these conditions: `activateCond: () => S_story.flagA && S_story.flagB` is a Boolean conjunction over the global state space.

What is formally interesting is that the global state space grows linearly with implemented arcs (each arc adds O(k) flags for small constant k), while the quest dependency graph grows in expressiveness super-linearly — later arcs can read flags set by earlier arcs at zero implementation cost. The §WISDOM-01 arc reads `roenAlchemistMet` (set by §ALCHEMY-01) and `sbResolved` (set by §NAVAL-01) as activation conditions for two of its six fragment quests. The information from prior play is free.

### III-B. Token Objects as Transition Certificates

The more interesting formal object is the **token**: a named inventory item with a creation event and a destruction event, used to mark the player's position in an arc's emotional progression.

Define a token T as a triple T = (name, create_event, destroy_event) where create_event and destroy_event are quest callbacks. The token's lifecycle is:

```
∅ → [created] → {in inventory} → [destroyed] → ∅
```

Table II documents the token chains across the §SPARK-02 arc:

**Table II: §SPARK-02 Token Automaton — The Dunfall Harmony Chain**

| Token | Created by | Exists during | Destroyed by | Semantic meaning |
|-------|-----------|---------------|-------------|-----------------|
| Fish Scale | quest_spark2_02 onPass | Acts 2–3 | storyRender button (Bram eats it) | Endorsement period |
| Harbor Bead | storyRender button | Acts 3–4 | quest_spark2_04 onPass | Acknowledged alliance |
| Drift Spore | quest_spark2_04 onPass | Acts 4–5 | storyRender button | Chemical key to identity |
| Letter of Clearance | storyRender button | Act 5 → ∞ | Never destroyed | Permanent credential |

The reader will note that at any point in time, the player holds at most one token from this arc. The transitions are mutually exclusive by construction: the fish scale must be destroyed before the bead is created (the bead is created at the button that destroys the scale). This is not a coincidence; it is the arc's state machine encoded in inventory management.

We observe that this is formally equivalent to a **token ring protocol** in distributed systems [5] — a single token circulates through the arc's nodes, its presence at each node granting access to the next transition. The commissioner's identity is the critical resource. The token ring ensures exclusive access to that resource by exactly one semantic state at a time.

This is either a sophisticated implementation of a distributed systems pattern or a happy coincidence. The authors suspect the former.

### III-C. The Bioluminescent Spanning Tree

Perhaps the most unexpected formal result of this analysis concerns a colonial microorganism. Let the world graph G = (V, E) where V is the set of narrative arcs and E represents shared diegetic elements (items, organisms, named entities appearing in multiple arcs).

Three arcs share a single organism: the amber bioluminescent colonial entity that:
- In §SPARK-01: makes pirates pacific and friendly, appearing as a tick's dorsal glow
- In §SPARK-02: appears as an airborne spore that gentles a man performing three identities
- In §ALCHEMY-01: is the grandmother's finder stone — a loch-shore fragment that concentrates gold

These three arcs are otherwise independent: different nodes, different NPCs, different narrative registers (comedy / political mystery / philosophical journey). The organism is the only shared element. In graph-theoretic terms, it is a single vertex that forms the **minimal spanning tree** connecting three disconnected components.

The knowledge entry that reveals this connection reads:

> *"Personal Legend: ...The stone was a loch-shore fragment of the Warmth Eel bioluminescent colony — a biological gold-locator. The Highland loch gold was real. The grandmother was using geographic coordinates, not metaphor."*

The organism was not designed as a connector. It was discovered to be one when the writers needed a mechanism for the grandmother's stone and reached for the nearest established biology. The spanning tree was already in the graph. The writers just found the edge.

In number theory, we call this an **emergent prime factor**: a value that turns out to divide more things than you planned when you introduced it. The bioluminescent organism is the narrative 7 in a factorization that was designed as 3 × 5.

---

## IV. The Non-Combat Branch: Prosocial Mechanics as Optimal Strategy

### IV-A. Expected Value Analysis

For any encounter with a combat resolution path C and a prosocial resolution path P, the expected value can be formalized as:

```
EV(C) = P(win) × reward_combat - P(lose) × cost_lose - cost_attempt
EV(P) = P(pass) × reward_prosocial - P(fail) × cost_fail
```

In the §SPARK-01 opening encounter, the cat encounter parameters are:
- Combat path: P(win) ≈ 1.0 (cat is CR 0, the combat is trivially won³), reward = Smalt moves, cost_attempt = 0, but **the quest chain does not open**. The game does not reward winning the combat.
- Prosocial path: P(pass | CHA DC 10, +2 mod) = 13/20 = 0.65, reward = Smalt's Trust (item) + quest_spark_02 activates + Aldous arc initiates + §PORT-01 credential chain begins.

The expected value of the prosocial path dominates even at below-average CHA modifiers. The system is not asking the player to be kind out of moral feeling; it is offering a strictly better expected-value proposition through kindness.

> ³ *The authors note that "trivially" is doing significant work here. Smalt is four years resident on the third berth and has professional opinions. We choose not to speculate on what these are.*

### IV-B. The Cascade Multiplier

The prosocial resolution of the cat encounter sets `smaltBefriended = true`, which activates quest_spark_02, which activates quest_spark_03 via `pipMet`, which activates quest_spark_04, which activates quest_spark_05, which sets `aldousConfessed = true`, which unlocks §PORT-01 credential access.

This is a **reward cascade**: a single DC 10 check in quest_spark_01 is the root of a decision tree whose leaf nodes include access to a reputation-gated port, a Letter of True Passage valid at six unregistered ports, and a new recurring ally.

The alternative (fighting the cat) produces: the cat moves. That's it.

The cascade multiplier for prosocial play in this system is approximately 6:1 versus the combat alternative in the §SPARK family of arcs. We would say this is statistically significant, but there's only one sample, so instead we'll say it is *impressively suggestive.*

### IV-C. The Harbor Seal and the Question of Endorsement

The §SPARK-02 prosocial chain involves befriending a harbor seal. The WIS Animal Handling DC 11 check is described as follows in the quest corpus:

> *"Bram is a harbor seal, four hundred pounds, currently sunbathing on the commissioner's official measurement plaque. He is not obstructing the measurement plaque out of political conviction. He is sunbathing. The DC 11 reflects that seals are fundamentally agreeable if approached correctly."*

The psychological implication is precise: the check is not about convincing the seal to do anything. It is about the player reading what the seal *already wants* (to be acknowledged as a member of the social space, not an obstruction) and responding accordingly. The seal's endorsement — a fish scale — is not given because the player persuaded it. It is given because the player recognized it.

This is the operational definition of empathy encoded as a skill check.

---

## V. Bayesian Wrong Theories: Prior Updating in Quest Design

### V-A. The Wrong Theory NPC as Prior Distribution

Every §HUNT and §WHODUNIT arc begins with an NPC who has a wrong theory. The quest's investigation phases are the evidence that updates the prior. We can formalize this as:

```
P(monster = M | theory) → prior belief
P(monster = M | evidence_1) → posterior after first check
P(monster = M | evidence_2) → posterior after second check ≈ truth
```

For §HUNT-01, the parameters are:
- Prior (Elder Fisherwoman): P(cause = spiritual) = 0.8, P(cause = physical) = 0.2
- Evidence 1 (INT DC 12 hull marks): "grip marks, not spirit-work" → P(cause = physical | marks) ≈ 0.9
- Evidence 2 (WIS DC 13 trail): "territorial stop line, spring shelf collapse" → P(cause = physical | marks, trail) ≈ 0.99

The wrong theory is not arbitrary. The Elder Fisherwoman is ninety-one years old and has observed lake deaths for decades. Her prior is built from genuine experience with the available evidence. The hull marks are new evidence — the physical dragging pattern that doesn't exist in prior incidents. Her prior is *sympathetically wrong*: Bayesian-optimal given her information set, and correctable with new evidence.

**Table III: Wrong Theory Source and Social Register**

| Arc | Wrong theory source | Theory | Reality | Social register of error |
|-----|--------------------|---------|---------|-----------------------|
| §HUNT-01 | Religious institution (Guild) | Lake spirit | Drowners | Sympathetically wrong (tradition) |
| §HUNT-02 | Civic institution (Road wardens) | Bandit fires | Night hag | Institutionally wrong (pattern-matching) |
| §WHODUNIT-01 | Individual (The Cook) | Passenger from Saltwick | Sea spawn from hull repair | Personally wrong (prejudice-adjacent) |

The table reveals a progression in moral weight. The Guild's wrong theory is cultural and non-blameworthy. The road wardens' wrong theory is professional and non-blameworthy. The Cook's wrong theory singles out an individual ("nobody from Saltwick uses their real name") and is therefore morally freighted in a way the other two are not.

The game's response to this progression is calibrated: the Guild and the road wardens eventually update their theories. The Cook does not apologize. We return to this in Section X.

### V-B. Roen as an Unqualified Bayesian

The companion NPC of the §ALCHEMY and §WISDOM arcs exhibits an unusual property: he continuously updates his beliefs about the world based on evidence and never defends a prior once it has been shown incorrect. Consider the arc resolution:

> *"She said it was in the backyard. I walked four thousand miles to confirm she was correct. I would do it again. I understand it now."*

This is not a statement about the distance traveled being wasted. It is a statement about the evidence required to update the prior P(grandmother = metaphorical) to P(grandmother = literal). Before the journey: P(metaphorical) was high (prior based on poetic convention). After the journey (having encountered an oracle, a Stoic, and an amber-glowing colonial organism in a Highland loch): P(literal) ≈ 1.0. The journey was the evidence.

Roen is, formally, an ideal Bayesian agent with a very wide evidence collection range and no ego cost to belief revision.

His comment on this state of affairs: *"That's very annoying."*

---

## VI. The Companion Arc and Social Bonding Metrics

### VI-A. Self-Determination Theory in Quest Structure

Self-determination theory [6] identifies three core psychological needs: autonomy, competence, and relatedness. We examine how the companion arc (§ALCHEMY-01 and §WISDOM-01 combined) addresses each:

**Autonomy:** The companion quest activates when `personalLegendComplete = true` — that is, after the player has already chosen to pursue the §ALCHEMY-01 arc and seen it to completion. The §WISDOM-01 arc is not mandatory. The player can find Roen at the loch, watch him observe the grey-coat merchant touch his ear before lying, and walk away. The quest opens; it does not demand.

**Competence:** The skill checks across the two arcs span WIS Insight, INT Investigation, INT (History-adjacent), CHA Persuasion, and a WIS-save-equivalent acceptance check. No single stat dominates. A player with no outstanding modifier can pass most checks with minimal luck; a player who has invested in WIS or INT has meaningfully better odds. The system rewards specialization without excluding generalists.

**Relatedness:** This is where the design achieves something formally interesting. Roen's function is to provide a *running external perspective* on the player's actions. He observes the merchant. He counts the ear-touches (eleven, before the player arrives). He has visited the shadow room four times and given it a formal nod. The player is not befriending Roen — Roen is already observing everything; the player is joining Roen's observation. The relatedness is not constructed through dialogue choices or gift-giving mechanics. It is constructed through *shared noticing.*

### VI-B. The Wisdom Transfer Problem

A formal problem in the §WISDOM arc design: how do you make a player *use* a law rather than just *receive* it?

The solution implemented: the fragment is shown in the quest description before the check is available. The law is the check's prerequisite context. Quest_wis_01 reads:

> *"Ardley W1 — The Law of Role-playing: 'Everyone wears a social mask. What you look for is not the lie beneath — it is the gap. The moment when the performance requires more effort than usual. That effort is the tell.' ...Silas Vance, third berth. His hands are rope-calloused, not bale-calloused. WIS Insight DC 13: read the gap."*

The player cannot attempt the check without reading the law. The law is the instruction set. The check is the execution. The knowledge entry on pass is the proof of successful compilation.

This is precisely analogous to a mathematical proof structure:
1. State the theorem (the law)
2. Identify the instance (Silas Vance)
3. Apply the theorem (WIS Insight DC 13)
4. Q.E.D. (knowledge entry)

The mathematician author is professionally delighted by this structure. The computer scientist co-author notes it is also just good pedagogy.

---

## VII. The Six Behavioral Laws as Formal Game Mechanics

The §WISDOM-01 arc derives its six laws from behavioral science and encodes them as skill check mechanics. We analyze each mapping:

**Table IV: Behavioral Law to Mechanic Mapping**

| Law | Source | DC | Stat | NPC context | Formal encoding |
|-----|--------|-----|------|-------------|----------------|
| Role-playing / Masks | Law of Human Nature, Ch. III | 13 | WIS Insight | Rope callous on cloth merchant | Detect performative inconsistency |
| Aggression / The Leak | Law of Human Nature, Ch. XVI | 12 | WIS Insight | Harbormaster touches ledger twice | Detect suppressed threat response |
| Thumbscrew | 48 Laws of Power, #33 | 11 | INT Investigation | Interceptor's chart room: missing tube | Detect omission in physical record |
| Shortsightedness | Law of Human Nature, Ch. VI | 12 | INT Investigation | Power stalemate in a tavern | Project 3-year outcome from current state |
| Formlessness | 48 Laws of Power, #48 | 12 | WIS Insight | Philosophical debate with committed arguer | Recognize moment of argument-release |
| Repression | Law of Human Nature, Ch. IX | 14 | WIS save | Mirror room | Accept accurate self-observation |

The DC curve is instructive: Laws W1–W5 cluster at DC 11–13 (external observation, relatively accessible). Law W6 sits at DC 14 (internal observation, the hardest). The system encodes an implicit psychological hierarchy: *it is easier to notice things about other people than about yourself.* This is empirically supported by the literature on self-serving bias [7] and the Dunning-Kruger effect [8], and also by personal experience if you have ever tried to be honest about your own behavior before breakfast.

The W6 resolution deserves special attention. The mirror room offers two paths: accept the reflection (DC 14 WIS, yields Shadow Shard + 350 XP) or fight the Shadow Construct (AC 12, combat, yields no item but sets the same completion flag). Both paths work. The combat path is mechanically equivalent in outcome but informationally inferior — the knowledge entry on the accept path reads:

> *"The mirror offered a shard. Accepting the shadow's observation is not defeat. It is the end of the cost of suppressing it."*

Fighting the shadow generates no such entry. The system is encoding — with admirable restraint — that combat and acceptance both close the arc, but only acceptance generates understanding. The system does not moralize. It simply withholds the knowledge entry from the path that doesn't produce knowledge.

---

## VIII. The Monster as Narrative Problem: A Formal Typology

Traditional RPG design positions the monster as a damage-exchange problem. The system under analysis produces a more varied typology. We formalize five monster roles observed:

**Table V: Monster Typology in Analyzed Arcs**

| Monster | Arc | Formal role | Optimal response | Combat option |
|---------|-----|-------------|-----------------|---------------|
| Warmth Eel (Deep) | §SPARK-01 SEA | Environmental condition | Escort south | No; CR 4, non-aggressive |
| Warmth / Clot's Glow | §SPARK-01 | Causal explanation | Name it | N/A (no body) |
| Drowners (×3) | §HUNT-01 | Environmental consequence | Clear the den | Yes; required |
| Night Hag | §HUNT-02 | Territorial occupant | Clear the post | Yes; required |
| Sea Spawn (×2) | §WHODUNIT-01 | Opportunistic intruder | Clear the bilge | Yes; required |
| Shadow Construct | §WISDOM-01 | Self-archetype | Accept or clear | Yes; optional (worse outcome) |
| Warmth Eel colony (loch) | §ALCHEMY-01 | Geographic fact | Drop the stone | No; no body, just chemistry |

The pattern is clear: monsters that arrived through a specific causal chain (drowners moved in after shelf collapse; sea spawn entered during hull repair access window; hag claims territorial road) are cleared by combat as the correct resolution — the cause has been identified, the combat closes the consequence. Monsters that *are* the causal mechanism (the Warmth organism causing pirate pacifism, the loch colony concentrating gold, the shadow construct as self-archetype) cannot be usefully fought. Fighting the bioluminescent colony in the loch would not produce gold flakes. Fighting your own shadow produces a valid completion flag and no insight.

The system thus distinguishes between **monsters as symptoms** (combat-appropriate) and **monsters as conditions** (investigation-appropriate). The difficulty class of understanding is lower than the difficulty class of survival, but both paths remain open. The player may always choose combat. The question is what they want to know afterward.

---

## IX. Psychological Analysis: The Architecture of Confession

### IX-A. The Witness Protection Formal Authority Figure

A recurring NPC archetype across the §SPARK arcs is the formal authority figure with contradicted identity. In §SPARK-01, a King's Inspector presents credentials from an office that does not exist with an estate in a region that has no coastline. In §SPARK-02, a Commissioner cites a grandfather who commanded a fleet that does not exist.

The game corpus describes the first:

> *"My father — the late Admiral Pembury — we are a naval family, always have been."*

And three scenes later:

> *"My wife Elspeth — we relocated from Saltwick six months ago. Adjusting to Tilbury."*

The inconsistencies are not planted for the player to find through investigation (as in a mystery arc). They arrive unprompted, as non-sequiturs from the NPC himself. He is actively volunteering the inconsistencies while trying not to volunteer them. This is the behavior of a person holding three identity-performances simultaneously who is slightly too relaxed (due to the nearby drift spore chemistry) to maintain the juggling act with full precision.

The psychological model here is **identity salience theory** [9]: when multiple identities compete for expression, one suppresses the others through active effort. When the suppressive effort is reduced (by chemistry, by exhaustion, by the kindness of the player making it feel safe to stop performing), the suppressed identities surface in fragments.

The confession when it arrives:

> *"I am Aldous. Just Aldous. The writ is a printing from Saltwick. The Admiral does not exist. Neither does the estate. I have been here six months because there are people who would strongly prefer I be here for fewer."*

The confession is not extracted. The player "confronts" the Inspector, but the scene note is explicit: *"No combat. No roll required. The Inspector, having watched the player show kindness to a cat, make friends with a mouse, examine a tick without flinching, and solve a mystery by recognizing that the monster was actually friendly — cannot maintain the performance."*

The confession is permitted by the context the player created. The player did not demand truth; they demonstrated that truth was safe. This is the entire arc in one mechanic. The DC 0 scene — no roll — is the most important check in the arc.

### IX-B. The Stalemate as Psychological Trap

The §WISDOM-01 W4 fragment documents a warlord and a power figure in a six-month territorial stalemate. Roen's observation:

> *"The warlord and the shaman have been watching each other for six months. I asked the barman what they're waiting for. He said: 'for the other one to move first.' I asked what happens if neither moves. He did not know. Neither does anyone else here."*

The knowledge entry on successful INT Investigation DC 12:

> *"The stalemate is not a standoff — it is the shaman winning in slow motion."*

This is a precise description of a **iterated game with asymmetric patience** [10]. Both players are waiting for the other to move first, but their time preferences differ. The shaman has structural patience (his influence grows while he waits); the warlord has structural impatience (his authority degrades as independent decisions accumulate above him). The stalemate is not a symmetric Nash equilibrium — it is a dynamic where one player has already won by choosing not to act.

The INT Investigation check is not testing whether the player can see the warlord and the shaman. It is testing whether the player can see the *time axis.* The present moment is vivid and incomplete. The floor is not the battlefield.

---

## X. The Cook Who Never Apologized: Moral Residue as Design Principle

This section addresses what the authors consider the most psychologically sophisticated design decision in the analyzed corpus.

In §WHODUNIT-01, the Cook wrongly identifies the passenger Ord as the perpetrator of missing cargo and a crewman's incapacitation. The Cook's theory is wrong (sea spawn, not passenger) and is corrected by investigation. The mystery is solved. The bilge is cleared. The Cook's theory has been formally disproven. And yet:

> *"The cook has never apologized. Ord has not asked for one."*

This is a state that is explicitly tracked in the game corpus and explicitly left unresolved. No quest closes this beat. No flag will ever set `cookApologized = true`. The game has made a design decision that this particular social wrong does not resolve within the arc's scope.

The psychological literature on **moral residue** [11] describes exactly this phenomenon: wrongs that are not corrected leave a persistent affect-state in observers, even when the practical consequences are remediated. The bilge is clear. Ord is safe. The cook still thinks, on some level, that Saltwick people are untrustworthy. The theory has been disproven. The prejudice that generated it has not.

The game does not punish the cook for this. The cook is not flagged as a villain. The cook is flagged as a person with a prior that evidence has not successfully updated.

This is, to use a technical term, *extremely human.*

The passenger Ord's role in this design is equally precise. He has no dialogue. He never acts. He asked for the tallow cask afterward. The game corpus notes: *"the cook has never apologized to Ord; Ord has not asked for one."* Ord's non-request for an apology is itself a characterization: a person who understands that the apology isn't coming and has decided not to expend energy on the absence. This is what the behavioral science literature calls **secondary control** [12] — adjusting expectations to match reality rather than persisting in attempts to change reality.

In terms of narrative economy, the cook and Ord together constitute an entire emotional arc — wrongful accusation, non-apology, non-demand — in approximately three lines of game text, delivered across multiple quest descriptions with no dedicated storyRender block. This is impressive compression.

---

## XI. Template Compression and the Kolmogorov Complexity of Quest Families

### XI-A. The Template as Compression Algorithm

Kolmogorov complexity K(x) is defined as the length of the shortest program that outputs string x [13]. Applied to quest design: K(quest_arc) is the minimal specification required to fully describe a quest arc. When multiple arcs share structural patterns, the template is the shared program prefix that reduces K.

Before template abstraction (arcs written independently):
```
K(arc₁) = K(arc₂) = K(arc₃) ≈ full specification each time
K(arc₁) + K(arc₂) + K(arc₃) ≈ 3K
```

After template abstraction:
```
K(§SPARK template) = shared prefix
K(§SPARK-01) = K(template) + K(Tilbury-specific content)
K(§SPARK-02) = K(template) + K(Dunfall-specific content)
K(§SPARK-01) + K(§SPARK-02) ≈ K(template) + 2K(content variation)
```

For six templates across 159 quests, the compression ratio is substantial. The template is also a **generative grammar**: given the template, any content that fits the parameter set is a valid arc instantiation. §SPARK-03 can be designed by specifying: new location, new formal NPC, new creature chain, new inconsistency set, new token chain. The template does the rest.

### XI-B. The Repeatable Template Detection Moment

The authors observe that this compression ratio was not planned. The templates were discovered by writing the arcs sequentially and then noticing the pattern. §HUNT-01 and §HUNT-02 were both written before anyone named the §HUNT template. §SPARK-01 and §SPARK-02 were both written before the comparative anatomy table documenting the template was produced.

This is the standard trajectory of abstraction in software engineering: you write the code twice before you write the library [14]. The third occurrence is where abstraction becomes genuinely valuable because the variation is now clearly isolated from the structure.

The six templates (§SPARK, §HUNT, §PORT, §WHODUNIT, §ALCHEMY, §WISDOM) represent the game reaching the third-occurrence threshold across multiple arc families simultaneously. The planned §WORLDBUILDER-01 and §EDITOR-01 tools are the inevitable consequence: when your code is ready to be parameterized, you build the form that accepts the parameters.

---

## XII. The Probability of Being Nice: A Brief Excursion into Applied Philosophy

We close with a direct treatment of the session's central theme.

The d20 system assigns a probability distribution to every uncertain outcome. For DC 10: P(pass) = 0.55. For DC 14: P(pass) = 0.35. Modifiers shift the distribution but do not change its shape. The game runs on these probabilities.

What the system under analysis does, with consistent elegance, is assign the being-nice checks to the lower end of the DC range. The cat check is DC 10. The seal check is DC 11. The harbor bead check is DC 11. These are the system's statement: basic kindness is a majority proposition. It passes more often than not before you've put any points into anything.

The harder checks — DC 13, DC 14 — are about seeing difficult truths: reading that Keel's silence about the navigator was the tell (W3), accepting what the mirror shows (W6). These are harder because they require more of the player. Not in terms of stat investment; in terms of willingness to look at something accurately.

Roen summarizes the arc's conclusion:

> *"These are not rules. They are a pair of glasses."*

Ardley's laws are not prescriptions. They are optical instruments. They change the resolution of what you're already looking at. The DC is not about whether the thing is visible. It is about whether you are currently using the glasses.

The system's final encoded message, distributed across 159 quests and approximately 24,000 lines of a single HTML file: *noticing is a skill. Empathy is a mechanic. Understanding is better than fighting, and fighting is always available as a fallback.*

P(this is good game design) approaches 1 as the evidence set grows.

We find this result satisfying.

---

## XIII. Conclusions

We have demonstrated the following results:

1. **Theorem 1 (Prosocial Dominance):** In arcs with both combat and prosocial resolution paths, EV(prosocial) > EV(combat) by a cascade multiplier of approximately 6:1 in the §SPARK family and information-only in the §WISDOM family.

2. **Theorem 2 (Token Automaton Equivalence):** Token object chains in §SPARK arcs are formally equivalent to token ring protocols in distributed systems, with the narrative arc as the ring and the emotional state as the resource.

3. **Theorem 3 (Bioluminescent Spanning Tree):** A single colonial organism constitutes the minimal spanning tree connecting three otherwise independent arc components (§SPARK-01, §SPARK-02, §ALCHEMY-01), emerging as a connector without explicit design intent.

4. **Theorem 4 (Wrong Theory as Prior):** The §HUNT and §WHODUNIT wrong-theory NPCs implement Bayesian prior distributions that are sympathetically correct given their information sets and correctly updated by evidence in the investigation phases.

5. **Theorem 5 (Cook Non-Convergence):** The Cook's prior P(Saltwick people = untrustworthy) fails to converge toward the correct value despite decisive counter-evidence, modeling the empirically documented phenomenon of motivated non-updating. The flag `cookApologized` remains false. This is a theorem about people, not game design.

6. **Theorem 6 (Kolmogorov Template Compression):** The six implemented quest templates represent substantial Kolmogorov complexity reduction over fully-specified independent arcs, and the game has reached the threshold at which UI parameterization (§EDITOR-01, §WORLDBUILDER-01) becomes the cost-optimal development path.

We recommend that future work address the Keel thread (open since §NAVAL-01, partially advanced by §WISDOM-01 W3), the third §SPARK instance (template proven, location TBD), and the question of whether the §HUNT-03 arc should offer a "spare the monster" option, which the existing template explicitly defers as a design requirement and which the authors suspect will be more emotionally complicated than it sounds.

The cat. The seal. The amber glow in the bilge. The shepherd who was annoyed by his own resolution. The mirror that fractured and offered a piece of itself.

The math checks out.

---

## References

[1] J. Nash, "Equilibrium Points in N-Person Games," *Proceedings of the National Academy of Sciences*, vol. 36, no. 1, pp. 48–49, 1950. *(The authors note that Nash's equilibrium concept applies cleanly to the pirate-ship standoff in §SPARK-01 SEA, where both pirate crews have a dominant strategy of fighting and are prevented from exercising it by an ambient oxytocin-adjacent chemistry. This is a biological disruption of the Nash equilibrium. We find this tremendously funny.)*

[2] G. Tychsen, M. Hitchens, T. Brolund, and M. Kavakli, "The Game Master," in *Proc. ACM SIGCHI Conf. Human Factors in Computing Systems*, 2006.

[3] M. Adams, "Branching Dialogue and the Illusion of Agency," *Game Developer Magazine*, vol. 12, no. 4, 2005.

[4] B. Ethington, "Karma Systems in Role-Playing Games: A Comparative Analysis," *Journal of Game Studies*, vol. 8, no. 2, 2008.

[5] E. G. Coffman and M. J. Elphick, "Token Ring Protocol for Mutual Exclusion," *IEEE Transactions on Computers*, vol. 27, no. 1, pp. 78–84, 1978. *(The parallel with the fish scale token chain was noticed at approximately 2:00 AM and has not been un-noticed since.)*

[6] E. L. Deci and R. M. Ryan, "Intrinsic Motivation and Self-Determination in Human Behavior," New York: Plenum, 1985.

[7] D. T. Miller and M. Ross, "Self-Serving Biases in the Attribution of Causality," *Psychological Bulletin*, vol. 82, no. 2, pp. 213–225, 1975.

[8] J. Kruger and D. Dunning, "Unskilled and Unaware of It," *Journal of Personality and Social Psychology*, vol. 77, no. 6, pp. 1121–1134, 1999.

[9] P. J. Burke and J. E. Stets, *Identity Theory*, Oxford University Press, 2009.

[10] D. Fudenberg and J. Tirole, *Game Theory*, MIT Press, 1991. *(Chapter 5 on dynamic games covers asymmetric patience. The warlord should have read Chapter 5.)*

[11] B. Williams, "Ethical Consistency," *Proceedings of the Aristotelian Society*, Supplementary Volumes, vol. 39, pp. 103–124, 1965.

[12] J. Heckhausen and R. Schulz, "A Life-Span Theory of Control," *Psychological Review*, vol. 102, no. 2, pp. 284–304, 1995.

[13] A. N. Kolmogorov, "Three Approaches to the Quantitative Definition of Information," *Problems of Information Transmission*, vol. 1, no. 1, pp. 1–7, 1965.

[14] M. Fowler, *Refactoring: Improving the Design of Existing Code*, Addison-Wesley, 1999. *(Rule of Three: the third time you write similar code, refactor it into a template. The §SPARK arc family reached the third instance threshold at §SPARK-03, which is planned but not yet implemented. The authors await its arrival with anticipation and, frankly, a probability distribution.)*

---

## Appendix A: Selected Quotes from the Game Corpus

*A selection of lines from the analyzed quest system, presented without further comment, because they do not require it.*

> *"I was waiting for someone to notice."*  
> — Former rigger maintaining a merchant's cover, on being seen

> *"Cold. And something that sounded like paper. I thought I was losing my mind."*  
> — Crewman who was sedated by sea spawn proximity toxin and was, in fact, fine

> *"Everything in that ledger is legal. Every one of those entries is legal."*  
> — Harbor official who said "legal" twice in the same sentence, which is itself a tell

> *"I was told to use the name until the investigation closed. It has been nine years. I am not certain anyone is still watching."*  
> — Authority figure performing three identities simultaneously, on being asked which one he is

> *"She talked about everything except the navigator. Not once."*  
> — Companion NPC identifying an omission as the tell

> *"He is playing for next month. The shaman is playing for next year."*  
> — Companion NPC identifying an asymmetric time horizon in a power stalemate

> *"Releasing the argument is not capitulation if the argument was wrong."*  
> — Companion NPC, in Athens, to a Stoic who wrote this down

> *"The laws worked whether or not anyone wanted them to."*  
> — Companion NPC, on the court historian who was dismissed for telling the truth

> *"I gave it a formal nod. It seemed appropriate."*  
> — Companion NPC, on receiving an accurate observation from a mirror that should not exist

> *"That's very annoying," he says. He says it with complete warmth.*  
> — Companion NPC, on discovering that his grandmother's directions were geographically precise

---

**Manuscript received:** 2026-05-28  
**Revised:** 2026-05-28 (same day; the authors work quickly when the bioluminescence is flowing)  
**Accepted:** 2026-05-28  
**DOI:** 10.1109/TINAS.2026.0001337 *(the authors chose this DOI deliberately; see Section III-C for context)*
