<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Story Arc — Epic Battlegrounds (Q52–Q71)
**Source:** Extracted from `story.md` — canonical EB quest-giver dialogue
**Elaboration:** `lab-report-epic-battlegrounds.md`
**Intersection:** 20 dead-end nodes off main-path nodes; each accessible from one parent node only

> Each Q entry has 5 fields: wound (.W), opening (.O), warning (.WA), negotiate (.N), return (.R).
> See `story-flowchart.md` for which main-path nodes attach to which EB dead-ends.

---

## EPIC BATTLEGROUNDS — Quest-Giver Dialogue

> Source: `EB_NPC_DIALOGUE` in `roll2hit-v3.html`. Each entry has five fields indexed by **Q-code** (`Q{nodeNum}.{field}`): `.W` wound · `.O` opening · `.WA` warning · `.N` negotiate · `.R` return. Payment ranges: floor → ceiling (negotiation raises opening toward ceiling via CHA check DC17). Special items are inventory rewards beyond gold.
>
> **Dual-role note:** Q59 (Draketide), Q65 (Izador), and Q71 (Mordus) are also Epic NPCs — see their profiles earlier in this document. Their EB dialogue gives a second context for the same character. Both contexts must remain consistent.

---

### Q52 — EF | Thornwood Maw
**NPC:** Woodcutter Bram · *logger* · parent node FO · boss: Thornwood King (Treant)  
**Payment:** 220–300gp · Special item: none

**Q52.W — Wound**
> His crew of four went into the deep forest last Tuesday. He came back. They didn't. He's been sitting at the forest edge on a small rock, not moving.

**Q52.O — Opening**
> "I'm not asking you to be a woodsman. I'm asking you to go where a woodsman can't."

**Q52.WA — Warning**
> "I saw it from the tree line. The roots move faster than you'd think. And it knows you're afraid. There's a journal in a hollow at the entry. You won't have time to read it on the way in. Read it on the way out."

**Q52.N — Negotiate**
> "You're right. The families asked me to pay whatever it took. Whatever it took."

**Q52.R — Return**
> Bram has four small ash-wood markers on the rock beside him, finishing the last one. He went in after you, once it was safe. "Count it yourself if you want. It's right."

---

### Q53 — EH | Loch of the Drowned King
**NPC:** Shepherd Rona · *shepherd* · parent node HL · boss: Highland Aboleth  
**Payment:** 260gp (fixed) · Special item: none

**Q53.W — Wound**
> Her husband Coll waded into the loch three months ago to retrieve a drowned sheep. He's still down there — forty feet down, walking in slow loops. She can see him from the bank. She waves. He waves back.

**Q53.O — Opening**
> "I buried his coat in the churchyard last week. People thought it was strange. I thought it was practical. I need somewhere to go."

**Q53.WA — Warning**
> "When it touches your mind — and it will — you'll remember things that aren't yours. Don't try to sort the memories out. Just keep moving. The ones that belong to you will still be there when you're done."

**Q53.N — Negotiate**
> "This is everything."

**Q53.R — Return**
> Rona stands at the loch edge at noon. "It's just water now. I can tell." She puts her mother's silver brooch in your hand. "My mother wore it every day for forty years. She said it was for occasions that mattered."

---

### Q54 — ES | Sunken Altar
**NPC:** Herbalist Gwynne · *herbalist* · parent node SW · boss: Elder Hydra  
**Payment:** 240gp (fixed) · Special item: none

**Q54.W — Wound**
> Her apprentice Luc went into the swamp last spring. He was twenty-two. She found his satchel at the altar edge, still packed, nothing taken. She keeps it under her work table.

**Q54.O — Opening**
> "I didn't send him in. He decided. I don't know if that makes it better. I've been asking myself."

**Q54.WA — Warning**
> "Don't count the heads during the fight. You'll lose count and start questioning yourself. Count your own attacks instead. You know how many of those you've made."

**Q54.N — Negotiate**
> "This is everything."

**Q54.R — Return**
> She's at the altar, kneeling beside Luc's satchel. She's added his apprentice pin to the outside pocket. "He would have been good at the altar work. I hadn't told him yet."

---

### Q55 — EW | Hag Mother's Cradle
**NPC:** Wane · *youngest crone* · parent node HS · boss: Grand Hag Queen  
**Payment:** 200gp (fixed) · Special item: `swamp_blessing`

**Q55.W — Wound**
> The Hag Primarch predates recorded history and is taking children from northern villages. The soldiers searching the swamp are bad for everyone's privacy. The Crones have rules. The Primarch has none.

**Q55.O — Opening**
> "We are not good. We have never claimed to be good. But there is a difference between what we do and what she does. She makes no distinction between useful and not useful. We make distinctions."

**Q55.WA — Warning**
> "She does not fight. She negotiates, always, until the negotiation is over. When it is over, she does not fight either. She becomes part of the environment. You will need to kill her while she is still talking."

**Q55.N — Negotiate**
> "This is everything."

**Q55.R — Return**
> "She asked you to let her finish her last sentence, didn't she." The Swamp Blessing is already done — you walked back through the swamp and nothing found you. "Did you notice?"

---

### Q56 — EB | Wreck of the Unbroken
**NPC:** Harbormaster Tula · *harbormaster* · parent node BE · boss: Vampire Pirate Lord  
**Payment:** 300–420gp · Special item: none

**Q56.W — Wound**
> Three years of missing ships, all on the best harbor approach route — the one that runs past the wreck. She keeps a ledger. When she shows it to you, you understand that "professional" is standing in front of her rage.

**Q56.O — Opening**
> "I'm not sentimental about this. The wreck is a business problem. You can be sentimental about it if you like. I'm paying you to solve it."

**Q56.WA — Warning**
> "He'll try to hire you first. His offer will be reasonable — he's still a professional, in his way. Don't accept. Previous applicants are still on the ship."

**Q56.N — Negotiate**
> "You're right. I've been telling widows their husbands were at sea. Whatever it takes."

**Q56.R — Return**
> Tula is already marking charts with the new approach lane. "I had a bet with my navigator. I said you'd manage it. He said you'd end up crew." She pays. "The extra's from Pell. He lost."

---

### Q57 — EO | Leviathan's Eye
**NPC:** Navigator Cassius · *navigator* · parent node DS · boss: The True Leviathan  
**Payment:** 320gp (fixed) · Special item: `ship_warrant`

**Q57.W — Wound**
> His brother's merchant ship went down over the trench eleven years ago. Cassius was on a different vessel. He watched it go. He doesn't want revenge — he wants the shipping lane open.

**Q57.O — Opening**
> "The Charybdis is a reflex. What causes the reflex is something else. I've been down in the diving bell twice. I've seen it. Once was enough to know what it is."

**Q57.WA — Warning**
> "It breathes. Real breathing, not fish-breathing. In and out, slowly, like something enormous asleep. It's not asleep. I've never seen it asleep."

**Q57.N — Negotiate**
> "This is everything."

**Q57.R — Return**
> Cassius draws a single clear line across the trench — a route that was previously impossible to mark. "My brother would have been fifty this year. I don't know if this helps with that. I think it might."

---

### Q58 — EI | Isle of the Wyrm Crown
**NPC:** Island Elder Maris · *elder and fisher* · parent node IS · boss: Ancient Sea Dragon  
**Payment:** 280gp (fixed) · Special item: none

**Q58.W — Wound**
> The dragon arrived when Maris was fourteen. Five generations of her family fished the eastern shoals. Her granddaughter is learning the harbor shallows instead — the only water she's ever had access to.

**Q58.O — Opening**
> "She should learn where her great-grandmother learned. That ground is ours by right of sweat, not law."

**Q58.WA — Warning**
> "She'll try to talk. She's intelligent enough that talking is her first tool. Listen or don't — but know that every exchange gives her more information about you. She's been talking to no one for forty years."

**Q58.N — Negotiate**
> "This is everything."

**Q58.R — Return**
> Maris is mending nets. She doesn't look up. "It's done, then." Long silence. "My grandfather made that chart the year he got married. He'd have wanted it used for something like this." She still doesn't look up.

---

### Q59 — EA | Abyssal Scriptorium
**NPC:** Captain Selene Draketide · *ship captain* · parent node AT · boss: Index Guardian Aboleth  
**Payment:** 300gp (fixed) · Special item: none  
**⚠️ Also Epic NPC #3** — see full profile in "The Seven Epic NPC Profiles" section above. Her EB wound establishes that she has been at the Atlantis archive for months before the player arrives — consistent with her Epic NPC profile ("Her ship's hold contains the sunken library of Atlantis").

**Q59.W — Wound**
> The rubbing says "the Index knows where everything is." Something below the library floor has been making noise at night for three months. It's not cataloguing.

**Q59.O — Opening**
> "I thought that meant the library catalogue. I've been hearing something below the library floor at night for three months. It's not cataloguing."

**Q59.WA — Warning**
> "It communicates by rewriting your memories. Not adding to them — rewriting. You'll think you've already done this. You haven't. Keep count of your swings. Not the hits. The swings."

**Q59.N — Negotiate**
> "This is everything."

**Q59.R — Return**
> Draketide is reading in the archive, cross-legged on the floor with six scrolls open. "It's the construction notes. How they made the Shards. Six years I've been reading footnotes. This is the text." She pays without looking away.

---

### Q60 — EC | Scholar Kings' Forge
**NPC:** Runewright Ossian · *runewright* · parent node SC · boss: Forge Warden Dragon Turtle  
**Payment:** 250gp (fixed) · Special item: `forge_rune`

**Q60.W — Wound**
> He's spent three years studying the Forge Warden from a safe distance, waiting for someone to clear it. He needs the Scholar Kings' tools inside. Modern equipment won't do.

**Q60.O — Opening**
> "I'm not asking you to steal anything. I'm asking you to convince the Warden that its instructions should change, or to inform it that the people who gave it those instructions are deceased."

**Q60.WA — Warning**
> "The shell is everything. Your weapons will scratch it. Get inside the arc of the neck. That means close enough to be bitten. That's the intended risk."

**Q60.N — Negotiate**
> "This is everything."

**Q60.R — Return**
> Ossian was already in the forge before you finished — he went in while it was occupied with you. "The Scholar Kings built well. Everything in there still works. Even the bellows." He gives you the runic instrument. "The debt is partially settled."

---

### Q61 — EL | Sunken God's Throne
**NPC:** River Trader Aldous · *river trader* · parent node FL · boss: Storm Giant Titan  
**Payment:** 280gp (fixed) · Special item: `river_pass`

**Q61.W — Wound**
> Three boats down this season. He's been replacing them, which is not a strategy so much as a coping mechanism. His accountant has stopped arguing.

**Q61.O — Opening**
> "I ordered six new boats. I told the shipwright they were for a supply-chain investment. He said that was the fourth time I'd called something that this month."

**Q61.WA — Warning**
> "It's very large. I know that sounds like an obvious thing to say about a giant. I mean: it fills the chamber. The fight will happen at close range because there is no other range."

**Q61.N — Negotiate**
> "This is everything."

**Q61.R — Return**
> Aldous is inspecting the new boats — he ordered them before you came back, because he was being optimistic. "The pass is real. I've already told my toll men your name. The description is slightly flattering, which I think is fair."

---

### Q62 — ED | Trench Titan
**NPC:** First Mate Darro · *first mate* · parent node DS · boss: Charybdis Prime  
**Payment:** 320gp (fixed) · Special item: none  
**Lore note:** Darro was aboard Draketide's ship twenty years ago when the Charybdis first appeared (Q57). He watched what she saw. He has carried it since because she doesn't speak of it.

**Q62.W — Wound**
> He was on Draketide's ship twenty years ago when the Charybdis first manifested. He watched what she saw in the trench. He's been carrying that image for twenty years because Draketide doesn't talk about it.

**Q62.O — Opening**
> "I'm fifty-three years old and I've never felt safe at sea. Not since that night. I'd like to feel safe before I die. That's the whole of it."

**Q62.WA — Warning**
> "Don't try to understand it. There's nothing to understand about it. Just keep hitting it until it stops. That's all I know how to say about it and I've had twenty years to think of a better way to say it."

**Q62.N — Negotiate**
> "This is everything."

**Q62.R — Return**
> Darro is at the ship's rail, looking down at the water. The water is still. "I'm fifty-three years old. And I just felt safe." He pays without turning around. "The rest is from Draketide. She approved."

---

### Q63 — EM | Noonwraith Queen's Field
**NPC:** Farmer Wren · *farmer* · parent node MI · boss: Noonwraith Queen  
**Payment:** 260gp (fixed) · Special item: none

**Q63.W — Wound**
> The Noonwraith Queen arrived three years ago when digging for a new well disturbed a ritual site. The county sent soldiers; the church sent a cleric. Both left. Wren has been renting a room and filing requests since.

**Q63.O — Opening**
> "You're the third option. I've exhausted the first two. Read the soldiers' report if you want. The interesting part is where it stops mid-sentence."

**Q63.WA — Warning**
> "She's brightest at noon. What they don't put in the reports: she's not gone at other times — she's just harder to see. I'd recommend noon. See your enemy clearly."

**Q63.N — Negotiate**
> "This is everything."

**Q63.R — Return**
> Wren stands at the edge of her field at noon. Just a field now. "I was worried it would feel different. It just feels like mine." She pays. "The deed's genuine. I had a lawyer draft it specifically for this."

---

### Q64 — EE | Pharaoh's Vault
**NPC:** Caravan Master Zephyrine · *caravan master* · parent node DE · boss: Vault Pharaoh (Mummy Lord)  
**Payment:** 300gp (fixed) · Special item: `escort_contract`

**Q64.W — Wound**
> The tomb appeared eighteen months ago. Three caravans attacked. Her employer's insurance adjuster has not been helpful about "mummified pharaoh destroyed six camels."

**Q64.O — Opening**
> "I cannot file a claim for 'mummified pharaoh destroyed six camels.' I tried. The adjuster laughed. I did not find it funny."

**Q64.WA — Warning**
> "He's been alone for three hundred years. He will want to talk. He has centuries of prepared speeches. You can listen or cut him off. He won't take the interruption personally once he's dead again."

**Q64.N — Negotiate**
> "This is everything."

**Q64.R — Return**
> Zephyrine fills in the insurance resolution field with focused calm: "Resolved by outside contractor." She signs and pays. "The escort is real. Tell my lead driver your name. You'll be welcomed on any desert road I run."

---

### Q65 — EV | Djinn Lord's Palace
**NPC:** Izador al-Rashun · *sandmage and djinn-binder* · parent node DC · boss: Elder Marid  
**Payment:** 350gp (fixed) · Special item: `sand_cipher`  
**⚠️ Also Epic NPC #5** — see full profile in "The Seven Epic NPC Profiles" section above. His EB wound (someone higher in the hierarchy renegotiating his contract) is a separate incident from his Epic NPC role (dissolving the djinn's binding for Shard #5). Both scenes share the DC node and establish Izador as someone who has multiple ongoing agreements with djinn.

**Q65.W — Wound**
> He made a local agreement two centuries ago. Someone higher in the hierarchy has noticed and been renegotiating his terms without consent. A renegotiated contract without consent is not a contract. It is a threat.

**Q65.O — Opening**
> "Someone higher in the hierarchy has noticed. His proxies have been renegotiating my terms without my consent. A contract renegotiated without consent is not a contract. It is a threat."

**Q65.WA — Warning**
> "He is immensely powerful and not very creative. This is a dangerous combination. Power without creativity means he will simply hit harder when the obvious solution isn't working."

**Q65.N — Negotiate**
> "This is everything."

**Q65.R — Return**
> Izador rewrites the contract in careful, unhurried strokes. "You have just made two centuries of my work considerably more stable. I appreciate this more than I can express in any language I speak, and I speak eleven." He pays. He picks the pen back up.

---

### Q66 — EJ | Canopy Cathedral
**NPC:** Herbalist Mael · *herbalist* · parent node JU · boss: Cathedral Wyrm (Green Dragon)  
**Payment:** 250gp (fixed) · Special item: none

**Q66.W — Wound**
> His teacher Thalia went into the Canopy Cathedral two years ago. He found her satchel at the edge, packed. Inside: a note dated six months after she entered. She had been documenting the interior plants the whole time.

**Q66.O — Opening**
> "She knew she wasn't leaving. She stayed for six months and documented everything. I need the formulary. The work she did is irreplaceable and I can't let it be lost because a dragon liked the acoustics."

**Q66.WA — Warning**
> "Don't let the conversation go longer than three exchanges. By the third exchange she'll have you agreeing to something that sounded reasonable and wasn't. She's very good at the third exchange."

**Q66.N — Negotiate**
> "This is everything."

**Q66.R — Return**
> Mael holds the formulary without opening it. "She signed the last page." He puts it carefully beside the empty satchel. "She knew someone would come." Long pause. He pays.

---

### Q67 — ET | Peak of the Eldest
**NPC:** Blacksmith Dora Flint · *blacksmith* · parent node BQ · boss: Summit Wyrm (White Dragon)  
**Payment:** 300gp (fixed) · Special item: `runic_hammer`  
**Lore note:** Dora Flint is the blacksmith of Weimar's lower quarter (BQ node). Her EB quest directly serves Sweelinck — she needs summit ore to forge the Codex instrument he requires for the sealing ceremony. This ties the ET Epic Battleground into the main quest chain.

**Q67.W — Wound**
> The mountain summit ore vein has been blocked for three years. She can't forge Sweelinck's Codex instrument without it. Lowland iron has the wrong memory — it remembers being underground, not cold.

**Q67.O — Opening**
> "He needs it for the Codex assembly. I can't make it with lowland iron. Lowland iron has the wrong memory. The summit ore remembers cold."

**Q67.WA — Warning**
> "Cold. The cold is the first weapon — she knows this and uses it. You'll be twenty feet away and already slow. Move before you feel it, not after."

**Q67.N — Negotiate**
> "This is everything."

**Q67.R — Return**
> Dora is shaping ore when you come back — the miners went up while the dragon was occupied with you. "The hammer was mine before I forged it. Three years ago, when I thought I'd solve this myself. Take it. It fits you better."

---

### Q68 — ER | Frost Warden's Throne
**NPC:** Fur Trader Sigrid · *fur trader* · parent node AR · boss: Frost Giant Jarl Kolvros  
**Payment:** 350–450gp · Special item: none  
**Note:** One of three EB entries with a negotiable payment range (others: Q52/EF and Q71/EG). Negotiate line is unique — not "This is everything" but a specific acknowledgement.

**Q68.W — Wound**
> Eleven months of tolls paid to Kolvros, starting reasonable. Last month he took her lead trader Beron instead of the chest. She paid again. She doesn't know what the thirteenth payment looks like.

**Q68.O — Opening**
> "I've paid his toll eleven times. The twelfth time he took Beron. I paid again. I don't know what the thirteenth time looks like and I am not finding out."

**Q68.WA — Warning**
> "He'll offer a fair fight. His terms. He means it — there's no trap. He's honorable. He's also enormous. Don't let being surprised by his honesty make you sentimental."

**Q68.N — Negotiate**
> "Beron was worth more than that. You're right."

**Q68.R — Return**
> Sigrid is already on the ice road when you come back, moving fast. She pays at a run — impressive. "The posts have been waiting sixty days. I'm not making them wait sixty-one." The furs are cached at the waystone three miles north.

---

### Q69 — EK | Shattered Seraph's Spire
**NPC:** Grounded Seraph Ithiel · *sky road keeper* · parent node HC · boss: Fallen Seraph Variel  
**Payment:** 0gp ★ · Special item: `star_fragment`  
**★ Zero-gold entry:** The only EB quest with no gold reward. paymentFloor = paymentCeiling = paymentOpening = 0. The `_storyEbNpcModal()` function handles this gracefully: when `d.paymentFloor === 0`, the payment display reads "No gold — a greater reward awaits." and the accept button shows "✓ Accept Quest" (not "💰 Accept 0gp"). The Negotiate button is hidden (`canNegotiate = false` when floor ≥ ceiling). The `star_fragment` special item is the sole reward. The covenant between Ithiel and Variel is the emotional core.

**Q69.W — Wound**
> Variel fell five years ago — Void corruption, incomplete. He's in the spire since. Ithiel cannot fight him. The covenant between them is older than language and it does not care about the Void.

**Q69.O — Opening**
> "I cannot lift my hand against him. The covenant does not care about the Void. It cares about the covenant. He knows I cannot fight him. I cannot ask if he's waiting for me to find a solution."

**Q69.WA — Warning**
> "He is in pain. You will see that clearly. It will not help you, and knowing it will not help him. Move quickly. Do not give him time to speak. He will say something true and it will slow you down."

**Q69.N — Negotiate**
> "There is no gold. There is only this."

**Q69.R — Return**
> Ithiel puts his hand over his heart. "The covenant is resolved." He presses the Star Fragment into your hand. "He knew you were coming. Not when — but eventually. He made this for eventually." He goes back to the sky road.

---

### Q70 — EP | Admiral's Last Cove
**NPC:** Fence Boss Carrick · *pirate fence* · parent node PC · boss: Admiral's Ghost (Wraith King)  
**Payment:** 300gp (fixed) · Special item: `pirate_cache`

**Q70.W — Wound**
> His younger brother Pel was taken by the Admiral last month. Carrick leads with the business problem, and then — when you're paying attention — mentions his brother.

**Q70.O — Opening**
> "I'm not sentimental about money. I am somewhat sentimental about my brother. These are not equal considerations but they both apply."

**Q70.WA — Warning**
> "He's a ghost. You know what that means for your weapons. Silver or magical only. If you don't have either, I can sell you some. I'm a fence. It's what I do."

**Q70.N — Negotiate**
> "This is everything."

**Q70.R — Return**
> Pel is already there, mildly shocked to be on the right side of the cove. Carrick walks in. "Good. I had a speech prepared for the other version. I didn't prepare anything for this one. That was overconfident of me." He pays.

---

### Q71 — EG | Void Shaman's Sanctum
**NPC:** Warlord Kael Mordus · *warlord* · parent node BK (Broken Tooth Tavern) · boss: Void High Shaman Kazrath  
**Payment:** 400–500gp · Special item: `crimson_warrant`  
**⚠️ Also Epic NPC #4** — see full profile in "The Seven Epic NPC Profiles" section above. His EB wound gives the backstory for his main-quest role: the shaman in the goblin caves had Void allegiances and a reporting structure connecting to Birka authority. His return beat — "He was writing to someone in Birka. Someone in a position of authority." — is a direct plot thread pointing toward the High Council.

**Q71.W — Wound**
> He reads the dead shaman's journal. The shaman's name appears forty times. "The Master says." "The Master believes." That's not religion — that's a reporting structure in his own territory.

**Q71.O — Opening**
> "Somewhere below my warrens, a Void shaman has been operating an intelligence network in my territory for three years. I don't tolerate that on principle."

**Q71.WA — Warning**
> "He knows you're coming. The shaman's death was a signal. Whatever he's prepared — and he's been preparing for thirty days — go in assuming it's better than you expect. Be ready for something new."

**Q71.N — Negotiate**
> "The journal mentions Birka. Twice. You're right to press. Find out what he knows and we'll both pay better."

**Q71.R — Return**
> Mordus reads Kazrath's journal for a long time. "He was writing to someone in Birka. Someone in a position of authority. When I've thought about it, I'll find you." He pays. "The extra 100gp is for the journal. That's worth money in my line of work."

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
