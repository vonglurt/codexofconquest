<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

```
 lp -o page-top=48 -o page-bottom=48 -o page-left=12 -o page-right=12 -o cpi=18 -o lpi=9 lab-report-littorial-courts-story.txt
```
# Lab Report — The Four Courts of the Littoral Sea

**Project:** roll2hit.com — *The Shattered Codex*
**Report Designation:** SIREN-01 (Littoral Courts Arc — Layer 104)
**HTML Baseline:** `roll2hit-v3.html` — ~21,200 lines at session close
**Session Date:** 2026-05-28
**Category:** Narrative Architecture · Manipulation Psychology · French Vignette Technique · Social Skill Checks · Parallel-Quest Design

---

## Abstract

This report documents the design and implementation of the Littoral Courts arc (§SIREN-01) for *The Shattered Codex*. The arc is a sequential ocean-route quest chain — 10 nodes from the deep-sea entry point (DS.E) to the Southern Anchorage (LCA) — in which a knight on diplomatic commission navigates four coastal courts, each ruled by a Lady who uses one of four words as a social instrument: BUSY (*Occupée*), MAYBE (*Peut-être*), FRIEND (*Ami*), SOON (*Bientôt*).

The arc's source material is a psychology-of-relationship-dynamics transcript that identifies these four words as tools of indirect interpersonal framing — what the transcript calls "the quietest weapon" because "it leaves no fingerprints." The D&D implementation translates this into skill-check quest mechanics: each word corresponds to a WIS Insight, INT Investigation, or CHA Persuasion check; each check tests whether the knight can read the frame without being shaped by it.

The arc's combat content is entirely with sea creatures — three crossings, escalating from Sea Spawn to Deep Ones to a solo Sea Serpent. The Ladies never fight. The ocean does.

A parallel quest introduces the Overseer (node LSO — The Fog Bank), a telepathic entity drawn from Succubus/Incubus lore who has been administering all four courts from the water ahead of the knight since Port Aurel. The Overseer's quest (WIS Insight DC 15) asks the knight to name the meta-structure they have been navigating and refuse the "helpful offer" at its end.

All court prose and NPC voice is written in compressed present-tense French vignette register. The betrayal mechanic (three flags: `betrayalThought`, `betrayalWord`, `betrayalDeed`) tracks skill-check failures and feeds a three-variant arc-close storyRender injection at LCA.

---

## I. Source Material and Design Derivation

### I-A. The Four Words — Source Transcript

The arc derives from a psychology-of-social-dynamics transcript organized around four words that operate as interpersonal framing tools rather than as statements of fact:

| Word | Mechanism (transcript) | D&D Translation |
|------|----------------------|-----------------|
| **BUSY** | "Not measuring her schedule. Measuring you." Intermittent reinforcement: warmth given in short unpredictable bursts, watching whether the other person adjusts downward. | Lady Aurel — the tidal schedule. Every appointment is borrowed from a schedule she administers. She sees you exactly as often as she has decided to. |
| **MAYBE** | "A soft, subtle cage. Keeps you emotionally available without requiring commitment." The other person stays circling while she checks her options. | Lady Calice — the drawbridge. "Perhaps at the evening tide." The wheel that lowers the bridge is in the courtyard. It is not locked. No one mentions it. |
| **FRIEND** | "The sharpest downgrade delivered without sounding cruel." The knight is introduced to court as "my most trusted companion" before he can introduce himself. The role is assigned, not offered. | Lady Mireille — the court introduction. Name and title remain. The frame, however, has been set. |
| **SOON** | "A future that never arrives because it was never meant to." Temporal delay reinforcement. Hope is fed precisely enough that the absence of a real date is not noticed. | Lady Solen — the ship on the horizon. Named, specific, three seasons unmoving. The fishermen at the dock know. No one asks them first. |

The transcript's core argument — "the danger isn't the word, it's the man's willingness to surrender his emotional center" — translates mechanically into the skill check system: the check tests whether the knight holds their position (PASS) or adjusts to fit the frame (FAIL). The betrayal flags are the mechanical record of that adjustment.

The arc does not moralize. The three-variant arc-close at LCA witnesses the score without judgment. A knight who accumulated three betrayals is not punished — they simply arrive having been shaped, and the text names the shape clearly.

### I-B. The Three-Betrayal Mechanic — Succubus/Incubus Source

The Overseer character and the betrayal mechanic draw from Succubus/Incubus D&D lore (MM p.349), specifically:

- **Three betrayals — thought, word, deed** — are sufficient for a soul to belong to the fiend. The arc maps these onto the first three skill-check fails.
- **Telepathic Bond** — "ignores range restriction on telepathy when communicating with a Charmed creature; the two don't even need to be on the same plane." The Overseer has been in contact with the ship's navigator since the first crossing. The navigator is not aware of this.
- **Shape-changing** — the Overseer has no fixed form; it appears through the navigator's second register and then directly in the fog.
- **Charm (DC 15 WIS)** — the Overseer quest uses WIS Insight DC 15, matching the charm save DC from the stat block.

The Overseer is not a battle encounter. It is a dialogue encounter in a fog bank (node LSO, east branch from LJ3). The pass condition is naming the structure aloud — not accusation, not drama, flat acknowledgment — and going to the fourth court anyway.

The fail condition: accepting the "helpful offer." The voice asks for a single word — a specific framing at Port Solen. The word is not wrong. It gives the Overseer a small piece of the frame.

### I-C. Writing Register — French Vignette

All court node text and NPC voice follows the compressed present-tense vignette register established in the grief arc (§GR) and Paul arc (§LIX–§LXIX):

- **Two perspectives implied per encounter** — the Lady's calibration and the knight's position — without either being named.
- **The gap between perspectives is the subject.** The text never declares what the manipulation is. The skill check vignette text frames the moment.
- **Objects carry the weight.** The tide table. The bridge chain. The herald at the door. The ship on the horizon. The wheel in the courtyard. None of these are symbolic. They are the specific facts of the specific situation.
- **No editorial comment.** The arc-close does not say the knight was manipulated. It says: "you gave something at each harbor that you did not mean to give." That is the observation. The interpretation belongs to the player.

The sea crossing nodes invert the register: minimal court prose, maximum physical fact. The sea is not atmospheric. It is a classification on a chart and a creature that enters from the wrong direction.

---

## II. Arc Architecture

### II-A. Node Chain

All nodes at column 14, 2-row steps south. Entry via DS(r:25,c:10).E probe → LJ0(r:25,c:14).

| # | Code | Label | r | c | Type | Content |
|---|------|-------|---|---|------|---------|
| 111 | `LJ0` | The Littoral Passage | 25 | 14 | Junction | Entry from DS.E |
| 112 | `LC1` | Port Aurel — The Tide Keep | 27 | 14 | Court | `quest_aurel_tide` WIS DC 12 |
| 113 | `LJ1` | First Crossing | 29 | 14 | Battle | Sea Spawn × 2 (`sea_serpent`, count:2) |
| 114 | `LC2` | Port Calice — The Drawbridge Court | 31 | 14 | Court | `quest_calice_bridge` INT DC 13 |
| 115 | `LJ2` | Second Crossing | 33 | 14 | Battle | Deep One × 3 (`deep_one`, count:3) |
| 116 | `LC3` | Port Mireille — The Cape Court | 35 | 14 | Court | `quest_mireille_ami` CHA DC 14 |
| 117 | `LJ3` | The Serpent Passage | 37 | 14 | Battle | The Serpent of the Passage (`sea_serpent`, count:1) |
| 118 | `LC4` | Port Solen — The Far Harbor | 39 | 14 | Court | `quest_solen_horizon` WIS DC 13 |
| 119 | `LCA` | The Southern Anchorage | 41 | 14 | Terminal | storyRender arc-close (betrayal count) |
| 120 | `LSO` | The Fog Bank — Open Water | 37 | 18 | Branch | `quest_sea_overseer` WIS DC 15 |

LSO at (r:37,c:18) branches east from LJ3(r:37,c:14), gap=4 — within probe range. LSO is the Overseer encounter, optional but thematically structuring.

### II-B. Quest Table

| Quest ID | Node | Type | Ability | DC | Pass Flag | Fail Flag | XP |
|----------|------|------|---------|----|-----------|-----------|----|
| `quest_aurel_tide` | LC1 | skill_check | WIS Insight | 12 | `aurelTideRead` | `betrayalThought` | 150 |
| `quest_calice_bridge` | LC2 | skill_check | INT Investigation | 13 | `caliceBridgeCrossed` | `betrayalWord` | 175 |
| `quest_mireille_ami` | LC3 | skill_check | CHA Persuasion | 14 | `mireilleAmiNamed` | `betrayalDeed` | 200 |
| `quest_solen_horizon` | LC4 | skill_check | WIS Insight | 13 | `solenSoonRead` | — | 225 |
| `quest_sea_overseer` | LSO | skill_check | WIS Insight | 15 | `charmResisted` | `seaOverseerMet` | 250 |

Note: `quest_solen_horizon` has no fail flag — the letters come regardless at Port Solen; the fail condition is narrative (you waited; the season passed) rather than a state mutation.

### II-C. NPC Voice Table

All NPCs use multi-state `quoteFn` with state mutation on first visit:

| Node | NPC | Pass state | In-progress state | Pre-event state |
|------|-----|-----------|------------------|-----------------|
| LC1 | Lady Aurel | `aurelTideRead` | `betrayalThought` | default |
| LC2 | Lady Calice | `caliceBridgeCrossed` | `betrayalWord` | default |
| LC3 | Lady Mireille | `mireilleAmiNamed` | `betrayalDeed` | default |
| LC4 | Lady Solen | `solenSoonRead` | — | default |
| LCA | Harbor Keeper | `littorialComplete` (set on first visit) | — | — |
| LSO | The Overseer | `charmResisted` | `seaOverseerMet` | default (pre-encounter) |

### II-D. State Flags

All added to `S_story` defaults:

```javascript
// §SIREN-01: Littoral Courts
aurelTideRead: false, betrayalThought: false,
caliceBridgeCrossed: false, betrayalWord: false,
mireilleAmiNamed: false, betrayalDeed: false,
solenSoonRead: false, littorialComplete: false,
seaOverseerMet: false, charmResisted: false,
```

### II-E. storyRender Injections

**LJ3 — Navigator trigger** (fires once, pre-encounter):
```
id: 'story-lso-trigger'
Condition: node.code === 'LJ3' && !S_story.seaOverseerMet && !S_story.charmResisted
Effect: inserts panel describing navigator's second register; prompts player to investigate the fog bank east
```

**LCA — Arc close** (fires on every visit):
```
id: 'story-lca-close'
Condition: node.code === 'LCA'
Logic: counts (betrayalThought + betrayalWord + betrayalDeed)
  0 betrayals → "You gave them nothing but your position."
  1–2 betrayals → "You have been shaped by the crossing. You notice it now that the water is still."
  3 betrayals → "You gave something at each harbor you did not mean to give. The water is still."
```

---

## III. The Overseer — Design Rationale

### III-A. Why a Parallel Quest

The four Ladies are not architects. They are administrators of patterns they have used before and will use again. What the four-court structure implies — a coordinated sequence of tests, each targeting a different susceptibility — suggests a layer above the courts: something that constructed the sequence, not merely deployed it.

The Overseer is that layer. It has been ahead of the knight since Port Aurel: in the water, in the navigator's second register, in the fog bank that has no seasonal explanation.

The reveal is placed at LJ3 — the hardest sea crossing, after three courts, before the fourth. The knight has navigated the pattern (with whatever score) and is now, for the first time, given a direct encounter with the thing that set it.

### III-B. The Offer

The Overseer offers to "arrange the fourth court differently." The offer is reasonable. It is warm. It costs "nothing." It requires only a single word — a specific framing — at Port Solen.

This is the fifth test, and it is harder than the four courts because it is transparent. The Overseer does not conceal what it is doing. It presents the offer plainly. The difficulty is not deception — it is the knight's willingness to accept assistance from something that has been instrumentalizing them.

DC 15 (vs. DC 12–14 in the courts) reflects this. The charm DC in the stat block is also 15.

### III-C. Fail Condition Design

The fail flag for the Overseer is `seaOverseerMet` (not `charmResisted`). This is intentional: failing the Overseer check means you accepted the offer — you met the Overseer on its terms. The pass flag (`charmResisted`) names the refusal.

On subsequent visits to LSO, the NPC voice changes depending on which flag is set:
- `charmResisted`: the fog is thinner; the navigator is normal; nothing is in the water here
- `seaOverseerMet`: the offer is still open; it waits

---

## IV. World Geography

The Littoral Sea is the open water south and west of the main continent's deep-sea nodes. The Littoral Passage (LJ0) connects to the existing DS (Deep Sea Trench) node via the east probe — the same ocean that contains the Charybdis and the Leviathan's silhouette.

The four harbor-courts are coastal fortresses on a southward littoral chain. They are not on any existing political map. They predate the Conclave. Their architecture is described through the specific objects the node texts name: the harbormaster's tower, the drawbridge chain, the cape court fire, the harbor window facing south.

The Southern Anchorage (LCA) is open water — the first node in the arc with nothing requiring anything from the player. This is noted in the node text and the arc-close alike.

---

## V. Non-Obvious Decisions

**1. Why the sea battles are not with the Ladies.**
The source material is explicit: "women aren't the enemy." The battles are with the sea because the sea is genuinely hostile — no frame, no instrument, no calibration. The contrast between court encounters (skill checks, language, indirect pressure) and sea encounters (direct, physical, mortal) is structural. The sea is what the manipulative dynamic is not: honest about what it wants from you.

**2. Why `quest_solen_horizon` has no fail flag.**
Port Solen (SOON) is the fourth pattern, and by the time the player reaches it they have either accumulated betrayals or not. The fishermen are at the dock regardless. The letters come regardless. The fail condition at Port Solen is not a state mutation — it is a narrative acknowledgment that the player waited. The arc-close at LCA does not need a fourth betrayal flag because the three-flag counting already produces a meaningful score.

**3. Why the betrayal flags set on `checkFailFlag` rather than in the failText handler.**
The `checkFailFlag` field is already supported by the skill-check handler at line 6203. Using it is structurally cleaner than custom logic in the failText string. The flags set automatically on fail without requiring special-case code in the renderer.

**4. Why the Overseer appears at LJ3 and not LC4.**
LJ3 is the last sea crossing — the solo serpent, the hardest battle, the deepest point in the ocean before the final court. The navigator's second register has been present since the first crossing; the player encounters it here because this is the first moment after the third court where the pattern has sufficient shape to be named. The Overseer offers the shortcut at the exact moment when shortcuts look most attractive: one more court, after three, after a long battle.

**5. Why `littorialComplete` is set by the Harbor Keeper's first-visit NPC mutation rather than a quest.**
The arc completion is a commission stamp, not an adventure. LCA is a terminal rest node; the arc-close is in the storyRender injection. The Harbor Keeper's NPC mutation handles the completion flag cleanly without requiring a separate quest entry that would add noise to the quest log.

---

## VI. Implementation Checklist

| Item | Status |
|------|--------|
| 10 NODE_MAP entries (LJ0–LCA + LSO) | ✅ |
| NODE_COORDS for 10 nodes | ✅ |
| 5 QUEST_DB entries | ✅ |
| `checkFailFlag` used for betrayal flags | ✅ (supported at HTML line ~6203) |
| 6 NPC_DIALOGUE entries (LC1–LC4, LCA, LSO) | ✅ |
| 10 S_story state flags | ✅ |
| LJ3 storyRender injection (navigator trigger) | ✅ |
| LCA storyRender injection (arc-close, betrayal count) | ✅ |
| plan.md §SIREN-01 spec | ✅ |
| maps.md sync | ⚠️ PENDING — increment 3 |
| story.md sync | ⚠️ PENDING — increment 4 |
| world.md sync | ⚠️ PENDING — increment 5 |
| quest.md sync | ⚠️ PENDING — increment 2 |
| index.md sync | ⚠️ PENDING — increment 6 |

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
