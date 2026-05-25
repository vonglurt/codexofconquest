# Lab Report: Companion Narrative Arc Layers 70, 72, 74
## §XXXV The First Inn Light / §XXXVII Commander Bruhns's CO Scene / §XXXIX Yael's Named Report Scene
**roll2hit-v3.html — Single-File Browser RPG**
**Date:** 2026-05-25 | **Status:** Implemented | **Format:** IEEE Post-Mortem

---

## Abstract

This report documents the design, implementation, and post-mortem analysis of three companion narrative arc layers added to roll2hit-v3.html: Layer 70 (§XXXV, Brynn's Vigil Arc), Layer 72 (§XXXVII, Commander Bruhns's CO Scene), and Layer 74 (§XXXIX, Yael's Named Report Scene). Each layer is a self-contained scene const plus render patch with no new nodes, monsters, or items. Together they pursue a single editorial objective: elevate the three most structurally significant NPCs from functional companions into characters whose arcs close on the player's terms. The implementation relies on boolean state flags per layer (three for Brynn, one each for Bruhns and Yael), scene-const string objects carrying variant text, and targeted injection into existing node render paths. No gameplay systems were modified. The post-mortem for each layer covers trigger logic, variant branching, cross-layer dependencies, and design intent.

---

## 1. Design Philosophy

roll2hit-v3.html resolves its companion relationships through favor scores (`fav_brynn`, `_npcFavor('bruhns')`, `_npcFavor('yael')`) accumulated across the act structure. Prior to these layers, favor scores unlocked mechanical benefits — dialogue variants, escort availability, Act VIII farewell text — but did not produce scenes that acknowledged the companion's inner life independently of the player's immediate action. The three layers documented here address that gap.

The shared design constraint is structural minimalism: each layer must fit the single-file architecture without adding nodes, modifying combat tables, or touching the MONSTER_POOL/WORLD_DB schemas. Narrative weight is achieved entirely through scene-const string objects injected into existing node render functions at precisely conditioned moments. A companion only speaks when the game has earned that speech — when favor is high enough, act number is late enough, and the player has done something that warrants acknowledgment.

The three layers are ordered by their position in the node graph. Brynn's arc (§XXXV) anchors to the IN node, the game's domestic center. Bruhns's arc (§XXXVII) anchors to the CO node, the game's authority center. Yael's arc (§XXXIX) anchors to the CI node and spills into the SW patrol node, crossing node boundaries for the first time in the companion arc system.

---

## 2. Layer 70, §XXXV — The First Inn Light: Brynn's Vigil Arc

### 2.1 Implementation

**Scene const:** `BRYNN_KEEPER_STORY` at line 11573. The object carries Beat 1 narrative text, Beat 2 prompt text with two labeled choice strings (`keep`, `rest`), the ambient lamp line, and the four farewell variants.

**State flags introduced** (line 8419):

| Flag | Type | Set when |
|---|---|---|
| `brynnKeeperStoryTold` | boolean | Beat 1 fires |
| `brynnLightChoiceMade` | boolean | Player selects either Beat 2 option |
| `brynnLightKept` | boolean | Player selects `keep` in Beat 2 |

**Beat 1 trigger:** IN node render, conditions `fav_brynn >= 1` AND `actNumber >= 2` AND `!brynnKeeperStoryTold`. On fire, `brynnKeeperStoryTold = true`. Scene: Brynn explains, without being asked, that she keeps the first lamp burning — the one by the entrance — for travelers who haven't come back yet. She does not editorialize. She just keeps it.

**Beat 2 trigger:** IN node render, conditions `fav_brynn >= 2` AND `brynnKeeperStoryTold` AND `!brynnLightChoiceMade`. Player receives two choices. `keep`: the player leaves the lamp alone and says so. `rest`: the player gives a practical response. Both set `brynnLightChoiceMade = true`. Only `keep` sets `brynnLightKept = true`.

**Ambient lamp line:** Rendered at the IN node unconditionally once `brynnLightChoiceMade` is true. A single sentence. Always present for the remainder of the run as a quiet visible artifact of the scene.

**§XXV Act VIII farewell:** Four-branch table resolved by `(brynnKeeperStoryTold, brynnLightKept)`:

| storyTold | lightKept | Farewell variant |
|---|---|---|
| false | — | Default (pre-arc) |
| true | false | Story-aware, practical choice acknowledged |
| true | true | Story-aware, lamp-kept — Brynn notes the lamp is still lit |
| (story not told, light somehow set) | — | Fallback to default; state guard prevents this case |

**§XXVII Town Crier line:** `TC_BRYNN_LAMP` injects into ambient inn news when `brynnLightChoiceMade`. The Crier references the lamp in passing — not the conversation, just the lamp, as a fact of the inn.

### 2.2 Post-Mortem

The arc's structural decision was to split the emotional moment across two beat triggers separated by at least one act gate. Beat 1 is pure delivery — Brynn speaks, the player receives. Beat 2 is the only moment the player acts on what Brynn said. Keeping them separate means the player has time to forget before the choice appears, which is intentional: the choice is slightly surprising, which is appropriate for its subject.

The ambient lamp line was the final addition during implementation and the most load-bearing. Without it, the arc closes at Beat 2 and leaves no trace. With it, every subsequent IN visit carries a one-sentence residue that the player either notices or doesn't. That asymmetry is the point.

The Town Crier integration (`TC_BRYNN_LAMP`) was straightforward but worth noting: it is the first instance of a companion arc state flag appearing in the ambient news layer. It establishes a pattern available to future arcs.

The four-branch farewell table has one inert branch (the fallback when storyTold is false but lightKept is somehow true), which is unreachable by design. It was retained rather than removed because removing it would require a guard that obscures the branching logic. The dead branch costs nothing.

---

## 3. Layer 72, §XXXVII — Commander Bruhns's CO Scene

### 3.1 Implementation

**Scene const:** `BRUHNS_CO_SCENE` at line 12625. Three variant objects: `friendly`, `dearFriend`, `dearFriendWithTheory`. Each carries a distinct text block. The `dearFriendWithTheory` variant appends an addendum line to `dearFriend` rather than replacing it — the base speech is identical; only the final line changes.

**State flag introduced** (line 8420):

| Flag | Type | Set when |
|---|---|---|
| `bruhnsCoSceneDelivered` | boolean | Any variant fires |

**Trigger:** CO node render, injected after `NODE_ARRIVAL_QUOTES` and before the fight chip render. Guard: `!bruhnsCoSceneDelivered`.

**Variant selection:**

| Condition | Variant |
|---|---|
| `_npcFavor('bruhns') >= 1` | `friendly` |
| `_npcFavor('bruhns') >= 2` | `dearFriend` |
| `_npcFavor('bruhns') >= 2` AND `s29LineDelivered` | `dearFriendWithTheory` |

Variant selection is evaluated top-to-bottom with the highest condition winning. `s29LineDelivered` refers to the Auros Theory scene state flag from §XXXII, which is set when the player has completed the full Auros Theory beat with the relevant NPC. This cross-dependency is the only inter-layer reference in this group of three.

**Scene content — `dearFriend` variant:** Bruhns explains that the Ivory Circle commissioned the Codex consolidation. Their belief was that bringing the Shards together would seal the Void. She signed on because she believed them. She is no longer sure that belief was correct. She says this before the fight. She does not ask the player to respond.

**Scene content — `dearFriendWithTheory` addendum:** Bruhns confirms that the theory about the Antecedent — the one the player encountered through the Auros Theory scene — is correct. She knew the source. She does not explain why she withheld it. The addendum is a single sentence appended to the `dearFriend` speech without structural separation, so the full scene reads as one continuous statement.

**Character note from plan.md:** Commander Seraphine Bruhns and Commander Auros are the same character. The CO boss fight is a confrontation with the NPC the player has been building favor with across the arc. The scene exists precisely because of this identity — it transforms the boss fight from a mechanical endpoint into a conversation between two people who have, by this point, earned directness with each other.

### 3.2 Post-Mortem

The injection point — after arrival quotes, before fight chip — is the tightest window in any node render path in the game. The fight chip render must not be delayed or the UI enters a broken interstitial state. The scene const text is therefore rendered synchronously with no await, no animation, no confirmation prompt. Bruhns speaks. The fight chip appears. This is correct for the scene's tone.

The `dearFriendWithTheory` variant presented the primary design problem: it must not feel like a reward for having completed §XXXII, because that framing makes Bruhns's confession transactional. The solution was to make the addendum confirmatory rather than revelatory — the player already knows the theory is correct; Bruhns is acknowledging that she knew too. The weight shifts from information to complicity.

The `bruhnsCoSceneDelivered` flag prevents the scene from repeating on node re-entry. Because the CO node is a terminal node (the boss fight resolves the run), re-entry after scene delivery is only possible through debug state manipulation. The flag is nonetheless correct to include; it maintains the architectural consistency of the companion arc pattern.

The `friendly` variant exists for completeness and to ensure players with moderate Bruhns favor receive some acknowledgment at the CO node. It is intentionally brief. Players who reached the CO node with `fav == 1` have had a different relationship with Bruhns, and the scene should reflect that without expanding into content that only makes sense for `fav >= 2`.

---

## 4. Layer 74, §XXXIX — Yael's Named Report Scene

### 4.1 Implementation

**Scene const:** `YAEL_NAMED_REPORT_SCENE` at line 12611. Object contains setup text, a decision line, and two labeled player choice strings.

**State flag introduced** (line 8421):

| Flag | Type | Set when |
|---|---|---|
| `yaelNamedReportDelivered` | boolean | Either player choice selected |

**Trigger:** CI node render, conditions `_npcFavor('yael') >= 2` AND `actNumber >= 6` AND `yaelEscortUsed`. Guard: `!yaelNamedReportDelivered`.

`yaelEscortUsed` is an existing state flag set by the escort mechanic. Its presence as a trigger condition is intentional: Yael's arc closes only for players who have actually used her as an escort, not merely accumulated favor through ambient interaction. The named report is not a general announcement; it is something she tells this specific player because of what they did together.

**Scene content:** Yael tells the player she filed a named report — her name on it, not anonymous — about riot suppression evidence from three years ago. She is not watching to see if it disappears. She wanted the player to know she did it. She does not explain why she is telling the player this now, at the CI node, in the middle of an act. The timing is hers.

**Player choices:**

| Choice label | Subtext | Effect |
|---|---|---|
| Affirm | Acknowledges the act as meaningful | Sets `yaelNamedReportDelivered = true` |
| Acknowledge risk | Acknowledges the danger without framing it as a mistake | Sets `yaelNamedReportDelivered = true` |

Both choices set the flag. Neither choice branches the scene further. The distinction between them is tonal, not consequential. This is a deliberate departure from the Beat 2 choice structure in Brynn's arc, where `brynnLightKept` produced a downstream branch. Yael's scene does not need a downstream branch because her action is already complete — the report is filed. The player is responding to a fact, not making a decision that determines an outcome.

**`YAEL_PATROL_NODES` addendum (line 12306):** The SW node receives an additional patrol ambient line when `yaelNamedReportDelivered` is true. Yael does not reference the report directly in this line. She references the weather, or the shift schedule, or something equally mundane. The mundanity is the point — she filed the report, she told someone, and now she is back on patrol. This is how she carries it.

**§XXXVI epilogue scroll:** `yaelNamedReportDelivered` adds a single line to the epilogue text block. The line notes that a named report was filed and entered the record. It does not attribute an outcome. The record is the outcome.

### 4.2 Post-Mortem

The trigger condition triple (`fav >= 2` AND `actNumber >= 6` AND `yaelEscortUsed`) is the most restrictive of the three arc triggers, and correctly so. Yael's scene is the most private of the three — it is not a story Brynn is keeping, not a confession Bruhns is making to contextualize a fight. It is a person telling someone else that they did something they can't take back. The conditions exist to ensure the player has been in the relationship long enough to be the right person to hear it.

The choice not to branch on player response was contested during planning. The argument for branching: players should be able to affect Yael's confidence in her decision. The argument against: Yael already filed the report. The player cannot affect what she did; they can only affect how they receive it. Giving the player a choice that changes the outcome of a fait accompli would misrepresent the scene's power structure. The current implementation keeps that power structure accurate.

The SW patrol addendum (line 12306) is the layer's most architecturally novel feature — the first instance of a companion scene state flag propagating to a patrol node ambient line rather than a farewell or a Crier reference. The precedent is worth noting. Patrol nodes are visited frequently and low-stakes; they are the right place for a companion to be simply present after something significant has happened.

The epilogue line is intentionally passive voice: "a named report was filed." Yael's name is not in the epilogue text. Her name is on the report. The epilogue records the fact; the record is where her name lives.

---

## 5. Cross-Layer Summary

| Layer | Section | Node | Const | Flags | Cross-dependency |
|---|---|---|---|---|---|
| 70 | §XXXV | IN | `BRYNN_KEEPER_STORY` (L11573) | 3 (L8419) | None |
| 72 | §XXXVII | CO | `BRUHNS_CO_SCENE` (L12625) | 1 (L8420) | `s29LineDelivered` (§XXXII) |
| 74 | §XXXIX | CI, SW | `YAEL_NAMED_REPORT_SCENE` (L12611) | 1 (L8421) | `yaelEscortUsed` (escort mechanic) |

Layer 72 is the only layer with a cross-arc dependency (`s29LineDelivered`). This dependency is one-directional and read-only: §XXXVII reads the §XXXII flag but does not modify it. No circular dependencies exist in the three-layer group.

---

## 6. Conclusion

Layers 70, 72, and 74 close the primary companion arcs of roll2hit-v3.html by giving Brynn, Bruhns, and Yael scenes that exist on their terms rather than the player's. Brynn keeps a lamp burning for people who haven't come back. Bruhns is not sure she believed the right people. Yael put her name on a document and went back to work. None of these scenes require the player to do anything except show up with enough favor and enough acts behind them. The arcs close because the characters close them. The player witnesses.

No nodes, monsters, or items were added. The single-file architecture was not structurally modified. The implementation cost is eight state flags, three scene const objects, and targeted injection into three existing node render paths.

---

*IEEE Post-Mortem Format. roll2hit-v3.html companion arc series. Layers 70, 72, 74. 2026-05-25.*
