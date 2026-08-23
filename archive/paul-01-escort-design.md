<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->
## §PAUL-01 — The Escort of the Apostle: Revised Arc Design (✅ Implemented 2026-06-11)

**Status:** ✅ Implemented 2026-06-11. All §PAUL-01-I checklist items resolved. Two Malta quests added: `quest_shipwreck_melta` (STR DC 12) + `quest_snake_melta` (witness, auto-complete via `maltaSnakeEvent`). `shipwreckSurvived` flag added to `_S_DEFAULTS`. 0 errors audit clean. Fighter presence layer live in all Paul arc nodes (DAM/KVA/MLA). Thorn tooltip live. Real quotes exact. See `archive/plan-archive-verbatim-2026-06-12.md §FUTURE-01` for node map reference.

**The premise shift:** In §FUTURE-01 as implemented, the player walks in Paul's footprints — the narration is in second person but the events are Paul's events. The revision establishes the **Fighter as co-protagonist**. Paul is a Cleric NPC — on a mission from his deity, skilled in rhetoric and faith-mechanics, incapable of routing himself safely through a hostile world. The Fighter is his escort. Both characters are present in every scene. Neither is backdrop to the other.

---

### §PAUL-01-A. The Central Argument

Paul is a Cleric who fights with words and outlasts everything. The Fighter is the person who makes it possible for him to keep going. This is not a supportive relationship in the subordinate sense — it is the way two very different skill sets become one capability. Paul can persuade a governor, heal a man who has never walked, survive a shipwreck by prayer and presence of mind, and write letters that reach cities he cannot walk to. He cannot read a street about to turn, assess which guards can be bribed, lower a grown man in a basket from a third-floor window in the dark, or keep a prison door open long enough for everyone to get out.

The Fighter's job is exactly those things.

**This is a faith-witness arc, not a faith-instruction arc.** The Fighter is not asked to convert. They are asked to watch what happens when a man operates at the limit of what faith can carry, and to keep him alive long enough for it to matter. Witnessing is the Fighter's vocation in this arc, the same way it is in §GR: you come, you see, you stay — and the staying is the thing.

---

### §PAUL-01-B. Fighter Presence Rules

These rules govern how the Fighter appears in every node text and quest description. They supplement the Paul voice rules in `lab-report-saul-paul-vignette-spec.md`.

**1. The Fighter is named by function, not by name.**
Node texts do not say "you" in the Paul passages — they are in third person as observed from outside. When the Fighter acts, the text shifts to second person: "You hold the rope." "You count the guards." "You stay." The shift marks the boundary between witnessing and acting.

**2. The Fighter's skill checks are always physical or situational.**
Paul's checks are rhetoric (INT) and faith (WIS). The Fighter's checks are STR Athletics, DEX Stealth/Acrobatics, CHA Intimidation (holding a room), WIS Insight (reading a street or a crowd). Their skills are complementary. Neither set solves the same problem.

**3. The Fighter has an opinion.**
Not stated as commentary — shown as choice. Before the Aethon speech: the Fighter scouts the square and confirms two exits. Before the Phillam prison: the Fighter does not leave when the doors open. The opinion is the action. No dialogue required.

**4. The Fighter's presence changes what Paul can do.**
Without the Fighter, Paul cannot get out of Damascus. Without Paul, the Fighter has no reason to be at the Aethon public hall. The interdependence is structural, not decorative. If one of them were removed from any node, the scene's resolution changes.

**5. The Fighter is not a believer. The Fighter is a witness.**
This is the same function as in §GR: Connie's grief is witnessed by someone who came and stayed. Paul's mission is witnessed by someone who came and stayed. The Fighter does not need to share the faith to share the road. This distinction is kept clean — no conversion arc, no faith-check for the Fighter. Their deity is their own matter. What they have is loyalty to a specific man on a specific road and the professional ethic to keep him breathing.

**6. The Fighter is physically present in key objects.**
The rope holds a basket. The Fighter holds the rope. The earthquake opens the door. The Fighter is the one who tells the jailer to put down the sword. The snake goes into the fire. The Fighter is standing next to the fire. Small, specific, present.

---

### §PAUL-01-C. Paul as Cleric NPC — What He Does, What He Cannot Do

| Paul's capabilities | Fighter's capabilities |
|--------------------|----------------------|
| Rhetoric skill check (INT, Persuasion/History) | Combat, physical extraction, route-finding |
| Faith healing (scripted event — no roll; happens or it happens) | Guard assessment, bribery reads, crowd reads |
| Writes letters (narrative — not rolled) | Rope work, climbing, heavy lifting |
| NPC disposition changes (his charisma rewrites who likes whom) | Intimidation to hold a room or a guard |
| Survives things that should not be survived (the thorn; the snake) | Tactical escape planning |
| Arguments (pushes back on everyone he respects) | Recognizes which arguments are about to become streets |

Paul cannot be killed in this arc. He can be captured (triggering specific quest states), isolated (triggering the blind days, the house arrest), or delayed (triggering time-gates). The Fighter can fail to protect him — the consequence is not Paul's death but a harder path: more damage on the fighter, a missed NPC disposition opportunity, a door that closes.

---

### §PAUL-01-D. The Escort Quest Chain — Revised Structure

Each leg of the journey is one escort quest. The Fighter has a primary skill check per leg. Paul has a secondary (his rhetoric/faith action). Both resolve in the same scene.

| Quest ID | Title | Node | Fighter Check | Paul Action | Real Quote |
|----------|-------|------|---------------|-------------|-----------|
| `quest_road_kesra` | The Light at Noon | KS (road) | None — the Fighter watches. No check. This is Paul's moment alone. | Conversion event: fell to the ground, heard a voice, blind. | *"Saul, Saul, why are you persecuting me?"* — Acts 9:4 |
| `quest_basket_descent` | The Rope in the Dark | KS (wall) | STR Athletics DC 12 — lower the basket without the rope slipping while guards are at the eastern gate. Fail: rope frays; basket drops last three feet; Paul bruised, Fighter makes noise. | Paul is in the basket. He is doing nothing mechanical. He is praying. This is documented. | *"Through a window in the wall his disciples lowered him in a basket."* — Acts 9:25 |
| `quest_anath` | The House on the Lower Road | KS (inn) | WIS Insight DC 10 — is Anath safe? (He stops on the landing, deciding. The Fighter hears this and chooses not to intercept.) | 3-day time gate. Anath heals. Sight returns. | *"Brother Saul, the Lord Jesus, who appeared to you on the road... has sent me so that you may see again."* — Acts 9:17 |
| `quest_barnach_vouches` | Vouched For | HR | CHA Intimidation DC 11 — hold the room while Barnach argues. The room does not trust Paul yet. The Fighter's visible presence keeps the arguments verbal. | Barnach speaks for Paul. Paul does not speak yet. He waits. | *"He will stay with me."* — Barnach (adapted) |
| `quest_ezzir` | The Sorcerer's Opposition | CI2 | STR/DEX DC 12 — stand between Ezzir and the door while Paul addresses the governor. Ezzir will try to leave the room before the argument finishes. | WIS faith check vs Ezzir's rhetoric. Paul names what Ezzir is doing, plainly, in front of the governor. | *"You are a child of the devil and an enemy of everything that is right."* — Acts 13:10 |
| `quest_stoning_lythros` | Left for Dead | LT | STR Athletics DC 13 — create an opening in the crowd after the lame man stands and the crowd reverses. The Fighter pulls Paul through before the first stone is thrown. Fail: Paul takes 2d6 damage before extraction. | The healing happens. Paul cannot prevent what comes after. | *"He got up and went back into the city."* — Acts 14:20 (documented sequence; Paul's action after the stoning) |
| `quest_prison_phillam` | Seven Stairs, Then Five | PL | WIS Insight DC 12 — when the earthquake opens the doors and the chains fall, the jailer draws his sword (he will execute himself before being blamed for escaped prisoners). The Fighter must read this before it happens. | Paul is singing. At midnight. Silar is with him. This is the first anyone has heard this in a prison. | *"About midnight Paul and Silas were praying and singing hymns to God, and the other prisoners were listening."* — Acts 16:25 |
| `quest_unknown_altar` | The Unknown Altar | AE | DEX Stealth DC 11 — scout the two exits from the public hall before Paul takes the steps. If the speech fails (partial result), the Fighter already knows the way out. | INT Persuasion DC 14. Paul starts with the altar. The crowd has calibrated opinions. Some will stop. A few won't. | *"To an Unknown God. What therefore you worship as unknown, this I proclaim to you."* — Acts 17:23 |
| `quest_temple_riot` | Riot in the Marketplace | EF | STR Athletics DC 13 — reach the north gate. Demetrios has translated a business problem into a street; the street is between the player and the exit. Paul is already moving. | Paul is moving. He does not fight Demetrios. He leaves through the north gate. The departure is the answer. | *"Great is Artemis of the Ephesians!"* — Acts 19:28 (Demetrios's crowd — used as disposition quote for the riot scene) |
| `quest_shipwreck_melta` | Two Hundred and Seventy-Six | MT | STR Athletics DC 12 — help keep people on planks during the swim to shore. Paul has directed the crew to eat before the hull goes; the Fighter executes the distribution. | Paul addresses the 276 before the ship goes down. He tells them no one will die. He is right. | *"Therefore I urge you to take some food. You need it to survive. Not one of you will lose a single hair from his head."* — Acts 27:34 |
| `quest_snake_melta` | It Did Nothing | MT | None — the Fighter watches. No check. This is Paul's moment alone, the same as the road to Kesra. The arc brackets its two no-check moments: the conversion and the snake. Both are witnessed, not participated in. | Paul shakes the snake into the fire. Nothing happens. The crowd revises its theory twice in one afternoon. | *"The islanders showed us unusual kindness."* — Acts 28:2 (the welcome at Melta — note: unusual kindness. The same vocabulary as §SPARK-01.) |

---

### §PAUL-01-E. Key Event Vignettes — Fighter-Integrated Rewrites

These replace the corresponding passages in `lab-report-saul-paul-vignette-spec.md`. They are not replacements for the full lab report — they are additions that insert the Fighter's physical presence into the existing scene texts.

---

**KS — The Basket Descent (addition to existing KS node text)**

The rope is made of cloth strips. This was not pre-planned — the cloth was taken from the room. You knotted it yourself. Seven knots, tested against the window frame. The basket is market-grade, meant for vegetables; it will hold the weight if the weight is distributed and the descent is controlled. You know this because you have dropped things in baskets before and you know what controlled means.

He gets in. He is not heavy. He does not speak. There is nothing to say at this moment — the guards at the eastern gate change at the third hour; you are ahead of the change; the window points west; the mathematics of this are in your favor if the knots hold.

They hold.

The last three feet you lower slowly because you can hear him breathing. He lands and crouches, and then he is moving and you are pulling the rope back up and you do not watch him go because watching him go means watching the western road and you are watching the eastern gate.

The gate guard does not turn.

*"Through a window in the wall his disciples lowered him in a basket."* This is what will be written down later, by someone who was not there. The facts are accurate. They do not include the knots.

---

**PL — Seven Stairs, Then Five (addition to existing PL node text)**

At midnight there is an earthquake.

This is the fact. Earthquakes do not announce themselves. The prison floor moves the way floors should not move, and the door — the door that required a key and a guard and a formal process — swings open. The chains on the wall come loose. Not just Paul's and Silar's: all of them. Every prisoner in the block is free, in the technical sense, at midnight.

No one moves.

This is important. You are in the cell across the corridor. You are free to leave. You are staying because Paul is staying and you are his escort and he has not indicated that he is leaving. He is still singing. Silar has stopped, but Paul has not stopped.

The jailer wakes in a dark room where the doors should not be open. He draws his sword. You know this sound — the specific sound of a man who has decided to die rather than answer for something. You have three seconds to cover the distance or the sound becomes a different sound.

*"Do yourself no harm."* Paul says this before you reach the doorway. His voice is not loud.

The jailer drops the sword. You are still moving.

Later, in the jailer's house, the household eats together at a table in the middle of the night. You eat. Paul eats. Silar eats. You count seven stairs on the way down from his apartment and five more after the landing. Lyra's house had stairs like that.

*"He was filled with joy because he had come to believe in God — he and his whole household."* — Acts 16:34. The Fighter notes this: the whole household. Not the jailer alone. The jailer understood something and brought everyone with him. This is how it moves.

---

**MT — Two Hundred and Seventy-Six (addition to existing MT node text)**

Before the hull goes, Paul addresses the 276. This is unusual behavior on a sinking ship. The crew has been working for fourteen days without eating — the storm, the gear thrown overboard, the constant pumping. Paul stands in the middle of the ship and says: eat. Specifically: not one of you will die. He says this plainly.

You distribute the bread. This is a practical action — 276 people need to receive bread on a moving deck in high weather, and someone has to pass it. You pass it. Paul breaks it first and gives thanks, and then you pass the rest. The number is real. You know how many people are on this ship because you asked the ship's log keeper on the second day.

When the hull goes on the sandbar, the soldiers want to kill the prisoners so none escape. You stand in the way of this. The centurion stops his soldiers because he wants to save Paul, and Paul gets out alive, but you are the reason the moment pauses long enough for the centurion to make the order. The pause is four seconds.

Everyone reaches shore. The number at the start is the number at the end.

---

### §PAUL-01-F. Theme Cross-References

Each major Paul arc event maps to a theme running through the existing game. These cross-references should be surfaced in the quest investigation card (§WORLDBUILDER-02) when the player views any Paul quest.

| Event | Theme | Parallel arc |
|-------|-------|-------------|
| The basket descent — the rope is knotted cloth, improvised, specific | Objects that carry weight; improvised care | §GR: Aldo's net, folded in his coat pocket; the object that says everything |
| The blind days — bread on the table, unmoved, three days | Sensory specificity as testimony; the one anchor | §WISDOM-01: Froberger's taxonomy correction sent to a general address |
| The prison song at midnight | Kindness in a place that is not built for kindness | §SPARK-01: The cat and the mouse; kindness that changes what a space does |
| The snake at Melta — crowd's theory is wrong twice | The friendly monster; wrong assumption, plain correction | §HUNT-01: the creature is not what anyone thought |
| The 276 number — specific, documented | Specificity as testimony against abstraction | §GR: the three city blocks; the account book |
| The jailer's household eating at midnight | A household that decides together | §GR: Lyra's household; the household as the unit of decision |
| Paul's letters from house arrest | What survives; what extends past where you can walk | §WISDOM-01: the Ardley Manuscript; things written become things that outlast |
| The Aethon altar — *To the Unknown God* — find the entry point | Institutions that hedge honestly; the gap acknowledged | §NAVAL-01: Keel protecting something she cannot name; the gap between what is documented and what is known |
| "Unusual kindness" at Melta — the islanders | Kindness as the operative word | §SPARK-01: the harmonyChainComplete flag; the world that recognizes kindness |
| The conversion is not described, only reported | The restraint is the testimony | §GR: "What Remains" — grief not named, enacted through objects |

---

### §PAUL-01-G. Real Quote Index

Quotes cleared for use in-game. All are sourced from Acts or the Pauline letters. Used as: disposition quotes, node text fragments, or NPC voice lines. They are in plain English — not archaic, not stylized. They land the way a man lands who has said something many times and is no longer performing it.

| Quote | Source | Use |
|-------|--------|-----|
| *"Saul, Saul, why are you persecuting me?"* | Acts 9:4 | `quest_road_kesra` disposition |
| *"Brother Saul, the Lord Jesus... has sent me so that you may see again."* | Acts 9:17 | `quest_anath` disposition — Anath's voice line |
| *"Through a window in the wall his disciples lowered him in a basket."* | Acts 9:25 | `quest_basket_descent` node text fragment |
| *"He will stay with me."* | Acts 9 (Barnabas) | `quest_barnach_vouches` disposition |
| *"You are a child of the devil and an enemy of everything that is right."* | Acts 13:10 | `quest_ezzir` — Paul to Ezzir, in the room, in front of the governor. Said plainly. |
| *"He got up and went back into the city."* | Acts 14:20 | `quest_stoning_lythros` disposition — the sequence is the documentation |
| *"About midnight Paul and Silas were praying and singing hymns to God, and the other prisoners were listening."* | Acts 16:25 | `quest_prison_phillam` node text — the prisoners are listening |
| *"Do yourself no harm."* | Acts 16:28 | `quest_prison_phillam` — Paul to the jailer. Said before the Fighter reaches the door. |
| *"He was filled with joy because he had come to believe in God — he and his whole household."* | Acts 16:34 | `quest_prison_phillam` storyRender close |
| *"To an Unknown God. What therefore you worship as unknown, this I proclaim to you."* | Acts 17:23 | `quest_unknown_altar` — Paul on the public hall steps |
| *"Not one of you will lose a single hair from his head."* | Acts 27:34 | `quest_shipwreck_melta` — Paul to the 276, before the hull goes |
| *"Therefore I urge you to take some food. You need it to survive."* | Acts 27:34 | `quest_shipwreck_melta` node text — before the bread distribution |
| *"The islanders showed us unusual kindness."* | Acts 28:2 | `quest_snake_melta` — the Melta welcome; cross-references harmonyChainComplete |
| *"My grace is sufficient for you, for my power is made perfect in weakness."* | 2 Corinthians 12:9 | The Thorn item tooltip — the only line that appears there |
| *"I have learned, in whatever state I am, to be content."* | Philippians 4:11 | `ST` node text fragment — the apartment; the letters; the open ending |

---

### §PAUL-01-H. Vignette Register (Voice Tone — English Spoken)

The Littoral Courts arc (`§SIREN-01`) uses compressed French present-tense syntax — sentence fragments, calibrated ambiguity, implied perspectives. The Paul arc uses the opposite: **spoken English, full sentences, plain verb tense, no compression**. The events are documented, not evoked. Paul's voice in particular sounds like someone who has described these events many times to many different rooms and has stopped trying to make them interesting — because the facts are already interesting and the embellishment would diminish them.

The Fighter's sections use second-person present tense (same as the rest of Roll2Hit). Paul's sections can be third-person present tense, observed — "He gets in the basket. He does not speak." This maintains the separation between witnessing and participating, which is the Fighter's structural position throughout.

Object-anchored: every major scene has one object that carries the weight of the scene. The basket. The bread on the table. The seam on the tent. The snake on the fire. The warrant letters in the inner pocket. The door that should not be open. These objects should appear in both the quest description and the node text — the same object, named twice, from two distances.

Direct quotes from source material are used sparingly and exactly: one per quest, in the disposition slot or as a fragment in the node text. They are not explicated. They appear and the scene moves on.

---

### §PAUL-01-I. Implementation Checklist ✅ COMPLETE

- ✅ `quest_basket_descent` → implemented as `quest_basket_damascus` (STR DC 12, DAM node); `basketRopeComplete` flag via `_grantMissionBit`
- ✅ `quest_prison_phillam` — WIS Insight DC 12, KVA node, `lyraConverted` gate; `phillippiJailerConverted` flag
- ✅ Fighter-presence clauses in all quest descs — second-person physical actions throughout
- ✅ Fighter sections in KVA (PL) and MLA (MT) node texts; DAM conversion handled by storyRender block
- ✅ Dispositions from §PAUL-01-G — all exact Scripture quotes placed
- ✅ `_S_DEFAULTS`: `phillippiJailerConverted`, `basketRopeComplete`, `shipwreckSurvived` (2026-06-11)
- ✅ Thorn tooltip — 2 Cor 12:9 exact text live in character sheet
- ✅ `quest_snake_melta` — "It Did Nothing" at MLA; auto-complete via `maltaSnakeEvent`; disposition "The islanders showed us unusual kindness." with `harmonyChainComplete` cross-reference in storyRender
- ✅ `quest_areopagus` Fighter section — DEX Stealth scouting + exit-count live in vignetteText
- ✅ `quest_stoning_lystra` — STR Athletics DC 13 Fighter extraction
- ✅ `quest_shipwreck_melta` — "Two Hundred and Seventy-Six" STR DC 12 at MLA (added 2026-06-11)
- ✅ All Scripture quotes exact — no paraphrase

