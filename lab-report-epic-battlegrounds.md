<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report — Epic Battlegrounds
### Quest Architecture for Outdoor Terrain Bosses
**Date:** 2026-05-22
**Project:** roll2hit.com · story.md · maps.md · plan.md
**Framework:** Codex of Conquest × Steven Pinker writing principles

---

## THE CONCEPT

Epic Battlegrounds are dead-end nodes — places you go only because someone sent you there and you decided the reason was good enough. They don't connect to anywhere else. They are the end of a road, and the road matters because of who is standing at the beginning of it asking you to walk it.

Every outdoor terrain node in the game has exactly one NPC with a personal reason to send you deeper than the main path goes. Not a generic bounty. Not a notice on a board. A specific person with a specific problem that has been accumulating for a specific number of months, and they have run out of other options and you are standing in front of them.

The structure is:
1. **The NPC Quest** — at the terrain node, a named character with occupation and visible wound
2. **The Warning** — they tell you exactly how dangerous this is, because lying would be disrespectful
3. **The Negotiation** — they offer gold; the player can push for more; the NPC has a ceiling and a floor
4. **The Epic Battleground** — dead-end node, one boss, no tier selection, no warm-up
5. **The Return Quest** — come back to the NPC for payment; they have changed slightly; they pay and say something true

This gives the game something it doesn't currently have: a reason to go somewhere that isn't the main quest. People to come home to. Story beats that are not about the Void.

---

## WHAT MAKES AN EPIC BOSS DIFFERENT

Regular monsters appear in terrain pools and scale with notoriety. An Epic Boss is singular. One creature. One chamber. No alternatives. The NPC told you exactly what was there, which means you walked in knowing.

Epic Bosses are all deadly tier. AC 14–21, HP 195–472. No condition item will trivialize them (though the right one helps). The pre-battle screen shows a **DANGER: EPIC** banner in deep red and displays the boss's name and the NPC's warning verbatim.

This is the mechanical equivalent of the NPC squeezing your arm and saying: *I am not exaggerating.*

---

## THE MAP MESH — 20 NEW NODES

Each Epic Battleground attaches to its parent terrain node as a dead-end. The grid coordinates below use the existing 26×16 map system. Cells marked `(WW override)` replace water cells with accessible terrain — these represent deep forest, underwater caves, frozen wastes, or sky-adjacent locations that aren't traversable except through the parent node.

### New Node Coordinate Table

| Code | Name | Parent Node | Grid | WW Override? | Connection Direction |
|------|------|-------------|------|--------------|---------------------|
| EF | Thornwood Maw | FO (forest) | R05,C02 | Yes — deep forest | FO → W → EF |
| EH | Loch of the Drowned King | HL (highlands) | R04,C04 | No — open moor | HL → E → EH |
| ES | Sunken Altar | SW (swamp) | R06,C02 | Yes — black water west | SW → W → ES |
| EW | Hag Mother's Cradle | HS (hag_swamp) | R08,C03 | No — available land | HS → S → EW |
| EB | Wreck of the Unbroken | BE (beach) | R12,C03 | No — available coast | BE → E → EB |
| EO | Leviathan's Eye | DS (deep_sea) | R15,C04 | Yes — abyssal trench | DS → S → EO |
| EI | Isle of the Wyrm Crown | IS (islands) | R13,C04 | Yes — eastern sea | IS → E → EI |
| EA | Abyssal Scriptorium | AT (atlantis) | R15,C02 | Yes — below Atlantis | AT → S → EA |
| EC | Scholar Kings' Forge | SC (sea_cavern) | R11,C01 | Yes — underwater cave | SC → W → EC |
| EL | Sunken God's Throne | FL (freshwater_lake) | R11,C03 | No — available land | FL → E → EL |
| ED | Trench Titan | DS (deep_sea) | R15,C03 | Yes — hadal zone | DS → SW → ED |
| EM | Noonwraith Queen's Field | MI (midlands) | R04,C08 | No — available land | MI → N → EM |
| EE | Pharaoh's Vault | DE (desert) | R11,C05 | No — available land | DE → S → EE |
| EV | Djinn Lord's Palace | DC (desert_caravan) | R10,C08 | No — available land | DC → E → EV |
| EJ | Canopy Cathedral | JU (jungle) | R10,C03 | No — available land | JU → E → EJ |
| ET | Peak of the Eldest | MT (mountains) | R04,C06 | Yes — above treeline | MT → E → ET |
| ER | Frost Warden's Throne | AR (arctic) | R01,C03 | Yes — frozen waste north | AR → N → ER |
| EK | Shattered Seraph's Spire | HC (heavenly_clouds) | R01,C16 | Yes — sky-adjacent west | HC → W → EK |
| EP | Admiral's Last Cove | PC (pirate_cave) | R11,C16 | Yes — tidal cave south | PC → S → EP |
| EG | Void Shaman's Sanctum | GC (goblin_cave) | R11,C14 | No — available land | GC → SE → EG |

### Updated Map Grid (excerpt — changed rows only)

Additions to the 26×16 grid (WW overrides shown in `[]`):

```
R01: WW  WW  [ER] WW  WW  WW  WW  WW  WW  J5  WW  WW  WW  WW  WW  WW  [EK] HC  CO  WW  WW  J7  WW  WW  WW  WW
R04: WW  WW  HL  EH  MT [ET] WW  WW  EM  WW  WW  WW  WW  WW  WW  SL  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW
R05: WW [EF] FO  ..  J6  ..  ..  MI  ..  ..  ..  J1  ..  WW  WW  CI  IN  WW  WW  WW  WW  WW  WW  WW  WW  WW
R06: WW [ES] SW  ..  ..  ..  ..  ..  ..  ..  ..  ..  ..  WW  WW  ..  TV  BA  WW  WW  WW  WW  WW  WW  WW  WW
R08: WW  WW  ..  EW  ..  ..  ..  ..  ..  ..  ..  ..  ..  ..  DK  MQ  SF  WW  MS  WW  WW  WW  WW  WW  WW  WW
R10: WW  JU  EJ  J2  DE  ..  DC  EV  ..  ..  ..  CA  SE  BK  GC  PC  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW
R11: [EC] FL EL  ..  EE  ..  ..  ..  ..  ..  VC  MC  ..  EG [EP][EP]  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW
R12: SC  BE  EB  ..  ..  ..  ..  J4  ..  ..  ..  ..  ..  ..  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW
R13: OC  WW  IS [EI] WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW
R15: WW [EA][ED][EO] WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW  WW
```

---

## EPIC BOSS STAT BLOCKS

All bosses are **deadly tier**. They appear alone in their node — no tier picker, no warm-up encounter. The node's `battle` field points directly to the boss.

| Code | Boss Name | AC | HP | ATK | Damage | Key |
|------|-----------|----|----|-----|--------|-----|
| EF | Thornwood King | 18 | 240 | +10 | 3d8+8 | thornwood_king |
| EH | Highland Aboleth | 17 | 210 | +9 | 3d6+6 | highland_aboleth |
| ES | Elder Hydra | 15 | 225 | +9 | 4d8+5 | elder_hydra |
| EW | Grand Hag Queen | 19 | 195 | +9 | 4d8+5 | grand_hag_queen |
| EB | Vampire Pirate Lord | 17 | 200 | +9 | 3d8+6 | vampire_pirate_lord |
| EO | The True Leviathan | 20 | 420 | +17 | 4d8+10 | true_leviathan |
| EI | Ancient Sea Dragon | 19 | 300 | +13 | 3d10+7 | ancient_sea_dragon |
| EA | Index Guardian Aboleth | 18 | 250 | +11 | 3d8+7 | index_aboleth |
| EC | Forge Warden Dragon Turtle | 21 | 380 | +14 | 4d12+8 | forge_warden |
| EL | Storm Giant Titan | 16 | 320 | +15 | 6d8+10 | storm_titan |
| ED | Charybdis Prime | 20 | 472 | +17 | 4d8+10 | charybdis_prime |
| EM | Noonwraith Queen | 14 | 195 | +9 | 4d6+5 | noonwraith_queen |
| EE | Vault Pharaoh (Mummy Lord) | 18 | 220 | +9 | 3d8+6 | vault_pharaoh |
| EV | Elder Marid | 18 | 320 | +12 | 3d8+10 | elder_marid |
| EJ | Cathedral Wyrm (Green Dragon) | 19 | 207 | +10 | 3d10+6 | cathedral_wyrm |
| ET | Summit Wyrm (White Dragon) | 20 | 330 | +14 | 3d10+8 | summit_wyrm |
| ER | Frost Giant Jarl Kolvros | 16 | 285 | +11 | 4d8+8 | frost_jarl |
| EK | Fallen Seraph Variel | 20 | 250 | +13 | 4d10+9 | fallen_variel |
| EP | Admiral's Ghost (Wraith King) | 17 | 195 | +9 | 4d6+5 | admiral_ghost |
| EG | Void High Shaman Kazrath | 16 | 255 | +10 | 4d8+6 | void_high_shaman |

---

## THE 20 QUESTS — FULL PROFILES

Each profile follows the structure: **Who** (NPC appearance and occupation) → **What happened** (the specific wound) → **The ask** (what they want) → **The warning** (honest) → **The payment** (gold + story) → **The return beat** (what changes when you come back).

---

### EF — The Thornwood Maw
**Parent Node:** FO (forest)
**Boss:** Thornwood King (Treant corrupted by Void, AC 18, HP 240)

**NPC: Woodcutter Bram**
Stocky. Forties. He smells of pine resin and old sweat. Missing the last two fingers on his left hand from a childhood saw accident — he gestures with that hand constantly, as if the absence doesn't register. His logging crew of four went into the deep forest last Tuesday. He came back. They didn't. He's been sitting at the forest edge ever since, which is how you find him: a large man on a small rock, not moving.

He doesn't want revenge. He wants the bodies. The wood clearing is secondary.

**Opening dialogue:**
*"I'm not asking you to be a woodsman. I'm asking you to go where a woodsman can't."*

**The specific wound:**
*"They were good workers. Tomas had three kids. Henley was getting married in the spring. I knew them twelve years. I walked them into that grove because I thought I knew the forest."* He looks at his hands. *"I knew the forest I had worked. Not the one it became."*

**The Thornwood Maw itself:**
The deep forest west of the main path doesn't look different at first. The trees grow closer. The crow-marked trunks stop, replaced by something older with bark like blackened skin. The air smells of rot and iron. At the center, where the Scholar Kings buried something they shouldn't have, a treant has been growing for three hundred years, absorbing Void energy through the burial site. It is enormous. It is patient. The claw marks on the outer trees face outward — it has been extending its range.

The four bodies are still there. They are part of the root system now, held upright. The Thornwood King is using them as a warning.

**Warning:**
*"I saw it from the tree line. The roots move faster than you'd think. And it knows you're afraid — it was a Scholar King once, I think. There's a journal in a hollow at the entry. You'll want to read it."* A pause. *"You won't have time to read it on the way in. Read it on the way out."*

**Payment:** 220gp offered → negotiates to 300gp
**Special:** Froberger's Journal — **Entry 13 variant** (DM reads if player retrieves Bram's crew): *"The Scholar King buried here chose the tree specifically. He wrote in the margin: 'The wood remembers what the stone does not. Let it remember for me.' Three hundred years later the wood remembers everything."*

**Return beat (FO):**
Bram has four small markers carved from ash wood on the rock beside him. He's finishing the last one when you come back. The bodies are accounted for — he went in after you, once it was safe.

*"The families asked me what I told the man who went in."* He fits the last marker into the row. *"I said I told you the truth. They said that was unusual for people hiring fighters."* He pays without counting it. *"Count it yourself if you want. It's right."*

---

### EH — The Loch of the Drowned King
**Parent Node:** HL (highlands)
**Boss:** Highland Aboleth (AC 17, HP 210)

**NPC: Shepherd Rona**
Narrow woman. Sixties. White hair worn in a braid that she tightens when she's thinking. She's been a shepherd her whole life, which means she's spent sixty years watching hills and water, and she is very good at reading the difference between what water looks like when it's empty and what it looks like when it isn't.

Her husband Coll waded into the loch three months ago to retrieve a drowned sheep. He didn't drown. She can see him sometimes, from the bank — he's forty feet down, walking along the bottom in slow loops. He waves. She waves back. She hasn't told the village.

**Opening:**
*"I buried his coat in the churchyard last week. People thought it was strange. I thought it was practical. I need somewhere to go."*

**What happened:**
The aboleth climbed into the freshwater loch from a deep underground channel sixty years ago. It has been there ever since, slowly reshaping the local ecosystem. Cattle drink from the loch and come back with different eyes. Fish still swim in it, but they don't quite swim right. Coll went in after the sheep and the aboleth found him more interesting than the sheep. He's been down there since, remade, a slow addition to something the aboleth is building out of whatever catches its attention.

*"He's not suffering. I think. I can't tell from the bank."* She looks at the water. *"Whatever it's made of him isn't him. But he's waving. He recognizes me."*

**What she wants:**
She doesn't want him back. She wants him free. Whatever that means for something that has been underwater for three months. She doesn't pretend to know what it means.

**The loch itself:**
Cold. Very cold — even in summer, the loch is colder than highland water has any right to be. The aboleth lives in the deep basin, sixty feet down, in a chamber it has been building since it arrived. The chamber walls are coated with a substance that makes your skin itch to look at. Coll is there, and twelve others from the past sixty years, all walking slow loops in the dark.

**Warning:**
*"When it touches your mind — and it will — you'll remember things that aren't yours. An aboleth doesn't erase you. It adds itself. Don't try to sort the memories out. Just keep moving. The ones that belong to you will still be there when you're done."*

**Payment:** 260gp total (her silver brooch worth 180gp + 80gp savings)
**The brooch:** Her mother's. She has thought about this carefully.

**Return beat (HL):**
She's standing at the loch edge at noon. She came down alone. She's looking at the water. You can stand beside her for a moment before she says anything.

*"It's just water now. I can tell."* Long pause. *"He's not down there."* She puts the brooch in your hand. *"My mother wore it every day for forty years. She said it was for occasions that mattered."*

She doesn't say anything else. She doesn't need to.

---

### ES — The Sunken Altar
**Parent Node:** SW (swamp)
**Boss:** Elder Hydra of the Altar (AC 15, HP 225)

**NPC: Herbalist Gwynne**
Grey-green apron perpetually stained with something she's been processing. Clay-stained hands. She stands at the edge of the swamp road and reaches just past where she should, then stops — she's been gauging that distance for three seasons, since the Hydra came and the altar became unreachable. She trained at the altar for six years. She knows exactly which plants grow within sight of it and which don't grow anywhere else.

Her apprentice Luc went in last spring. He was twenty-two. He decided he was ready for field work without asking her whether she agreed. She found his satchel at the altar edge, still packed, nothing taken. She keeps it under her work table. She hasn't unpacked it.

**Opening:**
*"I didn't send him in. He decided."* A breath. *"I don't know if that makes it better. I've been asking myself."*

**The altar:**
The Scholar Kings chose the altar site for its convergence of ley lines, which made it excellent for binding rituals and also excellent for drawing an Elder Hydra, which arrived one hundred and fifty years after the binding ceremony and has been there since. Seven heads. Each head is named — you can see the names burned into the scales, in the Scholar Kings' script. The altar is intact beneath the water. The Hydra guards it as territory, not intention.

**Warning:**
*"Don't count the heads during the fight. You'll lose count and start questioning yourself. Count your own attacks instead. You know how many of those you've made."*

**Payment:** 240gp + complete herbalist's formulary (worth 60gp sold or kept as crafting reference)

**Return beat (SW):**
She's at the altar when you come back. Not at the edge — at the altar. She's kneeling beside Luc's satchel, which she brought from the work table. She's added his apprentice pin to the outside pocket.

*"The heads are mine now. To tend."* She means the scale-names. She's copying them into her record book. *"He would have been good at the altar work."* Pause. *"He was already good. I hadn't told him yet."*

She pays. *"I should have told him. That's not something you can put right. The only thing you can put right is this."*

---

### EW — The Hag Mother's Cradle
**Parent Node:** HS (hag_swamp)
**Boss:** Grand Hag Queen / Hag Primarch (AC 19, HP 195)

**NPC: Wane** (the Youngest Crone)
She looks about thirty. She is not thirty. She has been the youngest of the three Crones for a very long time and she has some feelings about this that she processes by being direct about things the other two Crones would be oblique about.

The Hag Primarch is older than the Crones. She is not part of their coven. She doesn't answer to their rules — which are, Wane acknowledges, not widely understood as rules, but they are rules. The Primarch takes children from the northern villages, which is causing soldiers to search the swamp, which is bad for everybody's privacy.

**Opening:**
*"We are not good. We have never claimed to be good. But there is a difference between what we do and what she does. She makes no distinction between useful and not useful. We make distinctions."*

**The Primarch:**
She predates recorded history, at least in this region. She doesn't look ancient — she looks like whatever you expect an authority figure to look like. She is currently in the form of a grandmother, which she will maintain throughout the negotiation. She will offer to negotiate. The negotiation is the fight. She doesn't stop negotiating until one of you is dead.

**Warning:**
*"She does not fight. She negotiates, always, until the negotiation is over. When it is over, she does not fight either. She becomes part of the environment. You will need to kill her while she is still talking. Do not feel badly about this. She knows exactly what she's doing."*

**Payment:** Crones' Swamp Blessing (swamp terrain encounters never have surprise round against you, permanent) + 200gp
**Special additional lore:** On return, Wane tells you where the children were kept — alive, disoriented, but unharmed. The soldiers find them within the week.

**Return beat (HS):**
Whisper taps Wane on the shoulder when you walk in. Wane doesn't look surprised. *"She asked you to let her finish her last sentence, didn't she."* Not a question.

If you waited: *"You waited."* Glut laughs, which is the sound of someone learning something they always suspected. *"The sentence was going to be another negotiation. She would have renegotiated the fight itself into something else. You were very polite."*

If you didn't: *"Good. The sentence wasn't going to end."*

She pays. *"The blessing is already done. You walked back through the swamp and nothing found you. Did you notice?"*

---

### EB — The Wreck of the Unbroken
**Parent Node:** BE (beach)
**Boss:** Captain Varek of the Unbroken / Vampire Pirate Lord (AC 17, HP 200)

**NPC: Harbormaster Tula**
Short. Sunburned permanently into something that looks like leather. Professional. She keeps a ledger of every ship that's gone missing in the past three years, and when she shows it to you, you understand that "professional" is the word she has chosen to stand in front of her rage so it doesn't burn everything.

She is not sentimental. She will tell you she is not sentimental several times, which tells you something.

**Opening:**
*"I'm not sentimental about this. The wreck is a business problem. You can be sentimental about it if you like. I'm paying you to solve it."*

**Captain Varek:**
He was a legitimate privateer before he became a vampire, ninety years ago. He considers his current occupation a humiliation but has been unable to leave the wreck since he died there. His crew has been with him the whole time. They don't fully understand why they feel increasingly tired. Varek will absolutely try to hire you as first mate before he tries to kill you. He's been saying he needs a first mate for ninety years. The previous applicants are still on the ship.

**The wreck:**
The best harbor approach runs past it. This is not an accident — Varek chose the location for tactical reasons, ninety years ago, and he's been right about it ever since. The wreck is intact. The masts are still standing. At night, lights move between the decks.

**Warning:**
*"He'll try to hire you first. His offer will be reasonable — he's still a professional, in his way. Don't accept. Previous applicants are still on the ship."* Beat. *"I know what happens to them. I've been sending boats to look for three years."*

**Payment:** 300gp offered → negotiates to 420gp
**Bonus:** +50gp from Tula's navigator (see return beat)

**Return beat (BE):**
Tula is already marking charts with the new approach lane when you get back. She was optimistic. Her navigator, Pell, is at the table across from her looking at you with an expression that is hard to read.

*"I had a bet with my navigator. I said you'd manage it. He said you'd end up crew."* She finishes the chart line without looking up. *"I've been telling widows their husbands were at sea. Now I can tell them something different."*

She pays. *"The extra's from Pell. He lost."* Pell nods. He doesn't look like he minds.

---

### EO — The Leviathan's Eye
**Parent Node:** DS (deep_sea)
**Boss:** The True Leviathan (AC 20, HP 420)

**NPC: Navigator Cassius**
Draketide's navigator. Grey-bearded, precise, never panics. He has been on the deep sea routes for thirty years, the last six of them mapping the trench. His brother's merchant ship went down here eleven years ago. He was on a different vessel. He watched it go.

He doesn't want revenge. He is a navigator. He wants the shipping lane open, because two islands in the chain are food-insecure and cargo can't get through, and that is a navigational problem with a navigational solution.

**Opening:**
*"The Charybdis is a reflex. What causes the reflex is something else. I've been down in the diving bell twice. I've seen it."* He folds his charts. *"Once was enough to know what it is. Twice was enough to know I'm not going back."*

**The True Leviathan:**
Not the Charybdis from the main story. The Charybdis was a symptom — the water displacement caused by something enormous moving in the trench below. The True Leviathan is pre-Void. It has been in this trench since before the Scholar Kings. It doesn't communicate. It breathes. Real breathing — slow, deep, in and out, like something enormous not-quite-asleep.

**Warning:**
*"It breathes. Real breathing, not fish-breathing. In and out, slowly, like something enormous asleep."* Pause. *"It's not asleep. I've never seen it asleep."*

**Payment:** 320gp + Draketide's personal ship warrant (free passage at all ocean/sea nodes, story value)

**Return beat (DS):**
Cassius is at the charts. He draws a single clear line across the trench — a route that was previously impossible to mark because something was always in the way. He says nothing for a long moment.

*"My brother would have been fifty this year."* He doesn't look up from the chart. *"I don't know if this helps with that. I think it might."* He pays without ceremony. *"The rest is from the two islands. They heard about the clearance before I did. News travels fast on the water when it's good."*

---

### EI — The Isle of the Wyrm Crown
**Parent Node:** IS (islands)
**Boss:** Ancient Sea Dragon (AC 19, HP 300)

**NPC: Island Elder Maris**
Seventy. Small. Carries a fishing staff that doubles as a walking stick, worn smooth where her hand grips it. Her family fished the eastern isle's waters for five generations — her great-grandmother, her grandmother, her mother, and then the dragon arrived when Maris was fourteen, and the generation ended there. Her granddaughter caught her first fish last week in the harbor shallows instead of the eastern shoals, where the water is best.

*"She should learn where her great-grandmother learned. That ground is ours by right of sweat, not law."*

**The Dragon:**
She's intelligent and knows it. She was born on the eastern isle and considers it her clutch ground by hereditary right, which is accurate — her family has used it for four hundred years. The fishing grounds above her clutch are excellent because she keeps the water ecosystem healthy. She hasn't considered this a service. She's considered it a coincidence.

She will absolutely try to negotiate. She will offer treasure from her hoard, and the offer is real. If you accept and leave, Maris will find someone else. She'll tell you this directly.

**Warning:**
*"She'll try to talk. She's intelligent enough that talking is her first tool. Listen or don't — but know that every exchange gives her more information about you."* Maris adjusts her grip on the staff. *"She's been talking to no one for forty years. She's had time to get very good at it."*

**Payment:** 280gp + grandfather's navigational chart (unlocks a hidden sea route shortcut, story value)

**Return beat (IS):**
Maris is mending nets. She doesn't look up when you walk in.

*"It's done, then."* She pulls the needle through. *"My husband used to say the eastern shoals run different at dawn — current patterns he'd memorized over thirty years."* She finishes the row. *"He's been gone twelve years. I want to find out if he was right."*

She pays. *"My grandfather made that chart the year he got married. He'd have wanted it used for something like this."*

She still doesn't look up. That's not coldness. That's a woman trying not to cry over her mending.

---

### EA — The Abyssal Scriptorium
**Parent Node:** AT (atlantis)
**Boss:** Index Guardian Aboleth (AC 18, HP 250)

**NPC: Captain Selene Draketide** (post-Shard #3)
After Shard #3 is received and Draketide is no longer "the person who had a rock in her chart room for six years," she becomes something else: a woman who has been reading footnotes for six years and just found the text.

*"The rubbing says 'the Index knows where everything is.' I thought that meant the library catalogue. I've been hearing something below the library floor at night for three months. It's not cataloguing."*

**The Abyssal Scriptorium:**
Below the sunken library — past the hall where the Aboleth guarded the scroll case, down through a passage the Scholar Kings sealed and then forgot to mark on their own maps — is the original archive. The blueprints. The construction notes for the Shards. The Index Guardian was placed there specifically to prevent anyone from accessing the archive without authorization. It has been waiting for three centuries. It is not bored. Aboleths don't get bored. They get creative.

**Warning:**
*"It communicates by rewriting your memories. Not adding to them — rewriting. You'll think you've already done this. You haven't. Keep count of your swings. Not the hits. The swings. Hits you can lose count of. Swings you can feel."*

**Payment:** 300gp + Draketide's charter rights to Atlantis (story value)

**Return beat (AT):**
Draketide is reading. She's been in the archive since you cleared it, sitting cross-legged on the floor with a lamp and six scrolls open around her. She looks up when you come back.

*"It's the construction notes."* She closes one scroll carefully. *"How they made the Shards. How they bound the Void. How they knew it would work and how they knew they wouldn't survive knowing it worked."* She looks at the scrolls. *"Six years I've been reading footnotes. This is the text."*

She pays without looking away from the archive. *"Worth every coin. Worth considerably more than every coin."*

---

### EC — The Scholar Kings' Forge
**Parent Node:** SC (sea_cavern)
**Boss:** Forge Warden Dragon Turtle (AC 21, HP 380)

**NPC: Runewright Ossian**
An old man with chalk-stained hands who appears from behind a carved column inside the sea cavern as though he was waiting for someone to read the Scholar King markers before revealing himself. He was. He's been in this cavern for three years, studying the Forge Warden from what he calculated was a safe distance. He was almost right about the distance.

He needs the forge. The Scholar Kings' tools are still in there. He can't make what he needs with modern equipment.

**Opening:**
*"I'm not asking you to steal anything. I'm asking you to convince the Warden that its instructions should change, or to inform it that the people who gave it those instructions are deceased."* Beat. *"It understands language. The Scholar Kings were very thorough. It just doesn't accept that they're gone."*

**The Dragon Turtle:**
Ancient. Placed at the forge by the Scholar Kings themselves, given language and specific instructions, and has been following those instructions for three hundred years because no one came to change them. It is not malicious. It is thorough. Its shell absorbs most conventional damage. The neck, when extended, is the target.

**Warning:**
*"The shell is everything. Your weapons will scratch it. Get inside the arc of the neck. That means close enough to be bitten. That's the intended risk."*

**Payment:** 250gp + Forge Rune (one-use item: advantage on any roll involving a Codex Shard or enchanted object) + crafted runic instrument worth 120gp

**Return beat (SC):**
Ossian is already in the forge when you come back. He's been in there since the Warden turned its attention to you.

*"I got in while it was occupied with you. I owe you a moral debt I'm going to settle with craftsmanship."* He holds up the instrument — something small and geometric and clearly made by someone who knows exactly what they're doing. *"The Scholar Kings built well. Everything in there still works. Even the bellows."*

He pays and gives you the instrument. *"The debt is partially settled. I'll owe you the rest."*

---

### EL — The Sunken God's Throne
**Parent Node:** FL (freshwater_lake)
**Boss:** Storm Giant Titan (AC 16, HP 320)

**NPC: River Trader Aldous**
Large. Jovial in the way that people who have been managing logistics problems for twenty years develop a jovial exterior as professional armor. Three boats down this season. He's been buying new boats, which is not a strategy so much as a coping mechanism.

*"My accountant told me to stop ordering boats. I told him they were an investment in the supply chain. He said that was the fourth time I'd called something a supply-chain investment this month. I said that was because I had a very supply-chain-focused month."*

**The Storm Giant:**
Fell into the deep part of the lake three hundred years ago during a battle with a Void surge and became something adjacent to a god in the dark water — not through divine appointment but through the simple fact that when you are enormous and ancient and alone in the dark for three centuries, the things that live in the water start to worship you whether you want them to or not. He has accepted the tribute. He has become possessive. This spring he started accepting the tribute and the boats.

**Warning:**
*"It's very large. I know that sounds like an obvious thing to say about a giant. I mean: it fills the chamber. The fight will happen at close range because there is no other range."*

**Payment:** 280gp + river trading pass (all freshwater tolls waived permanently)

**Return beat (FL):**
Aldous is inspecting the new boats. He ordered them before you came back, because he was being optimistic.

*"I ordered six. I told the shipwright they were for a supply-chain investment."* He looks at the boats. *"They are now, I suppose."* He pays. *"The pass is real. I've already told my toll men your name. They have a description. The description is slightly flattering, which I think is fair."*

---

### ED — The Trench Titan
**Parent Node:** DS (deep_sea)
**Boss:** Charybdis Prime (AC 20, HP 472)

**NPC: First Mate Darro**
Fifty-three. Seven fingers on his right hand, three on his left — not from combat, from twenty years of working lines on a ship in bad weather. He's been with Draketide since before the Charybdis appeared. He was on the ship twenty years ago when it first manifested. Draketide pulled them out. He watched her do it and he watched what she saw in the trench and he's been carrying that image for twenty years because Draketide doesn't talk about it and he doesn't know who else to tell.

**Opening:**
*"I'm fifty-three years old and I've never felt safe at sea. Not since that night."* He looks at the water. *"I'd like to feel safe before I die. That's the whole of it."*

**Charybdis Prime:**
Not the whirlpool from Act IV. The Charybdis was a reflex. This is the cause. Ancient. Pre-Void. Doesn't communicate, doesn't threaten, doesn't perform. Just occupies the hadal zone at the bottom of the trench the way a boulder occupies a hillside — the whirlpool isn't something it does intentionally, it's water displaced by something enormous moving slowly.

**Warning:**
*"Don't try to understand it. There's nothing to understand about it. Just keep hitting it until it stops. That's all I know how to say about it and I've had twenty years to think of a better way to say it."*

**Payment:** 320gp + Draketide endorsement (she becomes permanent ally — free passage anywhere, bonus context on all sea-node dialogue)

**Return beat (DS):**
Darro is standing at the ship's rail, looking down at the water. He's been there a while. You can stand beside him. The water is still.

*"I'm fifty-three years old."* Long pause. *"And I just felt safe."* He pays without turning around. The money is exact. *"The rest is from Draketide. She knew what you were going down there for. She didn't say anything. That means she approved."*

---

### EM — The Noonwraith Queen's Field
**Parent Node:** MI (midlands)
**Boss:** Noonwraith Queen (AC 14, HP 195)

**NPC: Farmer Wren**
Mid-thirties. Dry humor she uses like a walking stick — something to lean on when the ground is uneven. She has crow's feet from three years of squinting at the horizon of her own farm from a rented room in the village. She is a farmer. She does not rent rooms. She has a house.

The Noonwraith Queen arrived three years ago when drought-driven digging for a new well disturbed a Scholar King-era ritual site in the north field. The county sent soldiers. The soldiers came and went back. The church sent a cleric. The cleric left faster than the soldiers. Wren has been renting a room and filing requests since.

**Opening:**
*"You're the third option. I've exhausted the first two."* She passes you the county request folder. It's very thick. *"Read the soldiers' report if you want. The interesting part is where it stops mid-sentence."*

**The Queen:**
Not a seasonal phenomenon — a permanent one. The Queen was created by the failed ritual and has been in the north field ever since, brightest at noon, present but invisible at other times. She is not angry. She is not malicious. She is a disruption in the fabric of the place that has become self-sustaining.

**Warning:**
*"She's brightest at noon. You know that part. What they don't put in the reports is that she's not gone at other times — she's just harder to see. If you go in before dawn, she'll have an eight-hour head start on your eyes."* Wren folds her hands. *"I'd recommend noon. See your enemy clearly."*

**Payment:** 260gp total (farm deed worth 140gp + 120gp savings)

**Return beat (MI):**
Wren is standing at the edge of her field at noon. The field is just a field. Sun on old grass. She has a blanket over one arm and is looking at the farmhouse like she's re-introducing herself to it.

*"I was worried it would feel different."* She doesn't move toward it yet. *"It just feels like mine."* She pays. *"The deed's genuine. I had a lawyer draft it specifically so I could use it as payment for this. The lawyer thought that was unusual. I told him it was practical."*

---

### EE — The Pharaoh's Vault
**Parent Node:** DE (desert)
**Boss:** Vault Pharaoh / Mummy Lord (AC 18, HP 220)

**NPC: Caravan Master Zephyrine**
Twelve years on the desert crossroads route. She knows every rock and current of wind. The tomb was not there eighteen months ago — she has her old route maps to prove it. Three caravans have been attacked. Her employer's insurance adjuster has not been helpful.

*"I cannot file a claim for 'mummified pharaoh destroyed six camels.' I tried. The adjuster laughed. I did not find it funny."*

**The Pharaoh:**
He was not a pharaoh. He was a Scholar King who, over three centuries of unintended undeath, started calling himself one because there was nobody to argue with him about it. He's been alone in the vault for three hundred years. He has prepared several speeches for when someone finally arrives. He will absolutely deliver them.

**Warning:**
*"He's been alone for three hundred years. He will want to talk. He has several centuries of prepared speeches. You can listen or you can cut him off. He won't take the interruption personally once he's dead again. He might take it personally while he's still not-dead."*

**Payment:** 300gp + caravan escort contract (no random encounters in desert terrain for 3 in-game days)

**Return beat (DE):**
Zephyrine is at her desk with the insurance form. She's filling in the resolution field with the focused calm of someone who has been looking forward to this moment.

*"'Resolved by outside contractor.' The adjuster can assume what he likes."* She signs and pays. *"The escort is real. Tell my lead driver your name and what you did. He'll spread it to the others. You'll be welcomed on any desert road I run."*

---

### EV — The Djinn Lord's Palace
**Parent Node:** DC (desert_caravan)
**Boss:** Elder Marid (AC 18, HP 320)

**NPC: Izador al-Rashun** (post-Shard #5)
He has been in the desert long enough to find everything clarifying except this. Two centuries of careful contract work and someone else has noticed.

*"I made a local agreement. Someone higher in the hierarchy has noticed. His proxies have been renegotiating my terms without my consent. A contract renegotiated without consent is not a contract. It is a threat."*

He is philosophically opposed to violence. As a third resort, he is considerably more flexible. He has not yet needed to reach the third resort himself, but he has been watching you and has decided you are a reasonable third resort.

**The Elder Marid:**
He didn't create the binding. He inherited it when the previous Marid died. He considers the contract beneath his attention, which is why he's been sending proxies instead of addressing it directly. The proxies have been returning changed — not corrupted, just different. He's been rewriting the terms each time one comes back, because that's what you do when an agreement is beneath your attention: you delegate and adjust.

**Warning:**
*"He is immensely powerful and not very creative. This is a dangerous combination. Power without creativity means he will simply hit harder when the obvious solution isn't working, rather than trying something else."*

**Payment:** 350gp + Sand Cipher full decryption (story item) + Izador's written recommendation (negotiation bonus with all desert NPCs)

**Return beat (DC):**
Izador is rewriting the contract. He doesn't look up. The pen moves in careful, unhurried strokes — he has been writing contracts for two centuries and the muscle memory is very good.

*"The hierarchy is resolved. The binding holds without his interference."* He signs in three places. *"You have just made two centuries of my work considerably more stable."* He puts down the pen. *"I appreciate this more than I can currently express in any language I speak, and I speak eleven."*

He pays. He says nothing more. He picks the pen back up.

---

### EJ — The Canopy Cathedral
**Parent Node:** JU (jungle)
**Boss:** Cathedral Wyrm / Adult Green Dragon (AC 19, HP 207)

**NPC: Herbalist Mael** (post-main jungle quest)
He gave you the Neurotoxin Blade Dip. He's been gathering plants from the road edge ever since his teacher Thalia went into the Canopy Cathedral two years ago. He found her satchel at the temple edge, packed, nothing taken. Inside: a note dated six months after she entered. She had been living inside the temple, studying the interior plants, for six months before the dragon tired of her.

*"She knew she wasn't leaving. She stayed for six months and documented everything. The formulary is complete."* He holds the satchel. *"I need the formulary. The work she did in there is irreplaceable and I can't let it be lost because a dragon liked the acoustics."*

**The Dragon:**
She moved into the temple forty years ago because it has excellent acoustics and she enjoys the sound of her own breathing. She considers this a reasonable use of an uninhabited structure. She is intelligent and vain. She will absolutely offer to negotiate, and the negotiation will be genuine, and she will expect you to be flattered by her interest.

**Warning:**
*"Don't let the conversation go longer than three exchanges. By the third exchange she'll have you agreeing to something that sounded reasonable and wasn't. She's very good at the third exchange."*

**Payment:** 250gp + Thalia's complete jungle formulary (one free Neurotoxin Blade Dip per jungle terrain visit, crafting access)

**Return beat (JU):**
Mael holds the formulary without opening it. He just holds it.

*"She signed the last page."* He puts it in his satchel, carefully, beside the empty one. *"I have to read it soon."* He pays. *"The formulary access is inscribed inside the cover. My name, your name, and a date."* Long pause. *"She dated it the day she finished. She knew someone would come."*

---

### ET — The Peak of the Eldest
**Parent Node:** MT (mountains)
**Boss:** Summit Wyrm / Ancient White Dragon (AC 20, HP 330)

**NPC: Blacksmith Dora Flint** (at BQ)
She forges the Ivory Circle's instruments. The ore for the specific metallurgy she needs comes from one vein at the mountain summit. The vein has been blocked for three years, since the Ancient White Dragon decided the summit was hers.

Sweelinck has been patient about the delayed instrument. Dora is not Sweelinck.

*"He needs it for the Codex assembly. I can't make it with lowland iron. Lowland iron has the wrong memory — it remembers being underground, not being cold. The summit ore remembers cold."*

**The Dragon:**
She predates the Scholar Kings. She has no interest in the Void, the Codex, the quest, or anything happening below the treeline. She is territorial in the way very old things are territorial: not aggressively, just absolutely. The summit is hers. She's been there since before anyone alive was alive.

**Warning:**
*"Cold. The cold is the first weapon — she knows this and uses it. You'll be twenty feet away and already slow. Move before you feel it, not after."*

**Payment:** 300gp + Forged Runic Hammer (condition item: Stunned, upgraded — 2 full rounds instead of 1)

**Return beat (BQ):**
Dora is shaping the ore when you come back. She doesn't stop.

*"The miners went up while she was occupied with you. First shipment in three years."* She turns the piece. *"That ore has the right memory. Cold and patient and very hard."* She finishes the shape and looks up. *"The hammer was mine before I forged it. Literally — I made it for myself, three years ago, when I thought I'd solve this myself. Take it. It fits you better anyway."*

She pays. She goes back to the forge.

---

### ER — The Frost Warden's Throne
**Parent Node:** AR (arctic)
**Boss:** Frost Giant Jarl Kolvros (AC 16, HP 285)

**NPC: Fur Trader Sigrid**
Found traversing the arctic pass. Twenty years on the northern routes. She knows everyone who works the ice roads. She's been paying Kolvros's toll for eleven years — it started reasonable, a chest of food and trade goods monthly, and has been increasing.

The twelfth payment, last month, he took her lead trader instead of the chest.

*"I've paid his toll eleven times. The twelfth time he took Beron. I paid again. I don't know what the thirteenth time looks like and I am not finding out."*

**Kolvros:**
He was born in the frozen citadel. He has been there for eighty years. He charges toll because the ice road runs through his territory and he sees no reason why it shouldn't. He is honorable within his own terms. He will absolutely offer a fair fight — one on one, his terms, weapons on both sides. It is genuinely a fair fight. He is also eight feet tall and has been doing this for eighty years.

**Warning:**
*"He'll offer a fair fight. His terms. He means it — he's not tricking you, there's no trap. He's honorable. He's also enormous."* Sigrid adjusts her pack. *"Don't let being surprised by his honesty make you sentimental. Being honorable and being harmless are different things."*

**Payment:** 350gp + fur cache (100gp equivalent) + permanent arctic toll waiver

**Return beat (AR):**
Sigrid is already on the ice road when you come back. She's moving fast. She doesn't stop when she pays.

*"The posts have been waiting sixty days."* She counts the coin out at a run, which is impressive. *"I'm not making them wait sixty-one."* Over her shoulder: *"The furs are cached at the waystone three miles north. Take what you need. Leave the rest for the next traveler."*

She's gone before you can answer.

---

### EK — The Shattered Seraph's Spire
**Parent Node:** HC (heavenly_clouds)
**Boss:** Fallen Seraph Variel / Elder Fallen Planetar (AC 20, HP 250)

**NPC: Grounded Seraph Ithiel**
A seraph who stayed on the sky road when Variel fell five years ago and has been maintaining it since. He moves like someone who knows exactly how much strength he has left and is spending it carefully. He doesn't talk much. When he does, it's precise.

The Void corrupted Variel five years ago. Not completely — enough. He's been in the spire since. Ithiel cannot fight him. The covenant between them is older than language and it does not care about the Void.

**Opening:**
*"I cannot lift my hand against him. The covenant does not care about the Void. It cares about the covenant."* He looks toward the spire. *"He knows I cannot fight him. I do not know if he is waiting for me to find a solution or waiting for the spire to fail. I cannot ask."*

**Variel:**
He is in pain. You will see this clearly when you find him. The corruption is incomplete — a planetar partially consumed by Void energy, which means he is still himself enough to know what he is and what he's becoming. He will not ask you to stop. He will not fight you gently. He will fight you exactly as hard as a corrupted planetar fights, because anything less would be an insult to both of you.

**Warning:**
*"He is in pain. You will see that clearly. It will not help you, and knowing it will not help him. Move quickly. Do not give him time to speak. He will say something true and it will slow you down."*

**Payment:** Seraph's Star Fragment — made by Variel himself, before the corruption. One battle: unlimited ADV against Void creatures. Sells for 450gp.

**Return beat (HC):**
Ithiel puts his hand over his heart. He doesn't say "thank you." He says:

*"The covenant is resolved."* He doesn't explain how he knows. *"He made this before the corruption. He was saving it for something worthy."* He presses the Star Fragment into your hand. *"He knew you were coming. Not when — but eventually. He made this for eventually."*

Ithiel goes back to maintaining the sky road. He moves like he has slightly more strength than before.

---

### EP — The Admiral's Last Cove
**Parent Node:** PC (pirate_cave)
**Boss:** Admiral's Ghost / Wraith King (AC 17, HP 195)

**NPC: Fence Boss Carrick**
Runs the pirate faction's goods storage. Pragmatic to the bone. He has a younger brother named Pel who the Admiral took last month. He doesn't lead with this. He leads with the business problem, and then, when you're paying attention, mentions his brother.

*"I'm not sentimental about money. I am somewhat sentimental about my brother. These are not equal considerations but they both apply."*

**Admiral Varek's Ghost:**
Was a legitimate naval admiral. He died in the cove ninety years ago and became a ghost, and he considers his current occupation as a toll-charging wraith-king to be beneath his station but has been unable to leave. His crew is still with him. They're fading — after ninety years, ghost crew starts to thin — and he's been replacing them with whoever he can convince to stay. The sixty percent cut funds the replacement program.

Pel is alive. He's in the cove, locked in the captain's quarters, being offered a position on the permanent crew. He hasn't accepted yet. The Admiral has been very patient about it.

**Warning:**
*"He's a ghost. You know what that means for your weapons. Silver or magical only."* Carrick looks at your equipment. *"If you don't have either, I can sell you some. I'm a fence. It's what I do."*

**Payment:** 300gp + pirate supply cache access (one free restock at any pirate/sea node)

**Return beat (PC):**
Pel is there first. He's sitting at the barrel table with a mug of something, looking mildly shocked to be on the correct side of the cove. Carrick walks in, looks at him, looks at you.

*"Good."* Very long pause. *"I had a speech prepared for the other version. I didn't prepare anything for this one."* He pays. *"That was overconfident of me."*

Pel raises his mug. *"The Admiral asked me to give you something."* He slides a coin across the table — an old naval rank token. *"He said 'for someone worth promoting.' I think that was a joke. I'm not sure he made jokes."*

---

### EG — The Void Shaman's Sanctum
**Parent Node:** GC (goblin_cave)
**Boss:** Void High Shaman Kazrath (AC 16, HP 255)

**NPC: Warlord Mordus** (post-Shard #4)
He reads the dead shaman's journal carefully. Then he reads it again. Then he sets it down.

*"His name is in there forty times. 'The Master says.' 'The Master believes.' That's not religion. That's a reporting structure. Somewhere below my warrens, a Void shaman has been operating an intelligence network in my territory for three years. I don't tolerate that on principle."*

He also doesn't like the implication of where it's operating toward. The journal mentions Birka. Twice.

**Kazrath:**
He's been watching through his apprentice's rituals for three years. He knows what happened in the goblin cave. He knows you killed the apprentice. He is not angry — he is curious. You are more capable than the statistics suggested. He has been preparing for your arrival since the apprentice's death gave him the warning. His preparation has been thorough, because thoroughness is how you stay alive as a Void operative for three decades.

**Warning:**
*"He knows you're coming. The shaman's death was a signal. Whatever he's prepared — and he's been preparing for thirty days — go in assuming it's better than you expect."* Mordus puts the journal face-down. *"I'd say 'be careful,' but I don't think that covers it. Be ready for something new."*

**Payment:** 400gp + Crimson Warrant Elite Status (permanent pass, all Warrant territory) + Kazrath's journal (story item: reveals Void network in Birka, connects to Act I main quest lore)
**Bonus:** +100gp ("for information I didn't know I needed")

**Return beat (BK):**
Mordus reads Kazrath's personal journal for a very long time. The bar is quiet. When he puts it down, he doesn't look up immediately.

*"He was writing to someone in Birka."* He taps the cover. *"Someone specific. Someone currently in a position of authority. I'm going to need to think about what to do with that."* He looks up. *"You'll want to know too. When I've thought about it, I'll find you."*

He pays. *"The extra 100gp is for the journal. You brought me a problem I didn't know I had. That's worth money in my line of work."*

---

## QUEST SYSTEM ARCHITECTURE

### The Negotiation Mechanic

Every Epic Battleground quest has a **Payment Range**:
- **Floor:** minimum the NPC will pay (they won't go below this; it represents their self-respect)
- **Ceiling:** maximum they can actually afford
- **Opening offer:** always between floor and ceiling, usually 20-30% below ceiling
- **Player negotiation:** one attempt; success based on Charisma or quest completion record
- **Failure to negotiate:** not punished beyond losing the margin; NPC doesn't become hostile

**Example (Bram, EF):**
- Floor: 220gp (his savings)
- Ceiling: 300gp (if the player presses, acknowledging the danger)
- Opening: 220gp
- Negotiated: *"You're right. The families asked me to pay whatever it took. Whatever it took."* → 300gp

### The Return Quest

Every EB quest generates a **payment quest** automatically upon boss defeat:
- New quest entry: `id: 'quest_[code]_return'`
- activateNode: parent terrain node (the NPC)
- objectiveText: "Return to [NPC] at [terrain] for payment."
- reward: negotiated gold amount + any story items
- Waypoint automatically set to parent node on boss defeat

The return quest exists as a separate QUEST_DB entry, not just a dialogue flag. This means:
- It appears in the quest log
- The waypoint system can route back to it
- If the player sleeps before returning, the NPC mentions the delay in their return dialogue (flavor text variant)

### The Warning System

Each EB pre-battle screen includes:
- **DANGER: EPIC** banner (deep red, pulsing)
- Boss name and tier
- NPC's exact warning text (the line from the quest dialogue)
- No "are you sure?" prompt — the NPC already gave the warning; the player chose to proceed

The warning text on the pre-battle screen is the NPC's actual words, in quotation marks, attributed. This connects the boss fight to the person who sent you there.

---

## INTEGRATION WITH CODEX OF CONQUEST THEME

The twenty quests are not side content. They are the world learning that you exist.

By the time the player reaches the final convergence, they have not just collected seven Shards. They have cleared a loch for a shepherd who stood at the water every morning for three months. They have retrieved a formulary from a dragon for a dead woman's apprentice. They have given a navigator twenty years of peace.

The Codex of Conquest is not about defeating the Void. It is about all the specific, ordinary, irreplaceable things that the Void would have consumed: Wren's farm. Maris's fishing ground. Rona's version of what "it's just water now" sounds like.

The player is not a hero. They are a person who said yes to twenty specific requests from twenty specific people, and the world is measurably better in twenty specific ways.

That is the victory. The Codex reforging is just the last one.

---

*End of lab report. Implementation plan: see Layer 39 in plan.md.*


---
*© 2026 roll2hit.com — MIT License. See [LICENSE](LICENSE) for full text.*
