# THE SHATTERED CODEX
### A Solo Journey — Story, Quest Map & Terrain Traversal Guide

---

## Abstract — What This Story Actually Is

*A system prompt for a world that has already decided what it thinks of you.*

The game is one HTML file. No server. No build step. No account. One file, distributable like a note slipped under a door. Everything in this document lives inside that file — the quest map, the monsters, the currency, the 6 named friends, the 20 Epic Battlegrounds, the 17 journal entries of a dead courier named Froberger. Everything. The architecture is its own argument: **the thing you make should be giveable.**

This is the story that runs on that architecture.

**The Curse of Knowledge.** Steven Pinker names it: once you know something, you can no longer remember what it was like not to know it. Froberger gathered the Shards before you did. He saw the Void clearly. He tried telling people. They couldn't hear it — not because they were stupid, but because understanding requires context you can't give by talking. So he stopped telling and started fixing. He became the only one who could do what needed doing. That — not the Void, not the Commander, not anything with teeth — is what destroyed him.

The player reads this in fragments. In journal margins. In the space between what Froberger wrote and what he stopped writing about.

**The Shards are surrender documents.** Seven Scholar Kings who said: *we will not let this world fall*, and gave everything so the line could hold. You are not retrieving artifacts. You are honoring a covenant made by people who died to make it possible for you to exist and not know that they did. The Void is not a fog of consuming darkness. It is a conqueror. It advances where the defenders are thin and retreats where they're strong. The Epic Battlegrounds are not side content — they are twenty specific failures that have been waiting for someone with your exact capability to arrive.

**Friendships with magic.** Not magic that wins battles. Magic that is the byproduct of choosing people over efficiency. The game tracks this directly — a Curse of Knowledge score measures not your combat performance but your willingness to treat knowledge as a burden to share rather than a credential to hoard. The four ending variants encode this: Covenant Keeper (friends + no curse), Standard Covenant, Groundhog Day Cursed (the Void sealed but you still trapped), and Mixed. The Covenant Keeper ending names each person helped by name. The Groundhog Day ending does not.

---

**Three lab reports built this story.** They are the engineering beneath the prose:

- `lab-report-game-story-codex-of-conquest.md` — The narrative architecture: Five-step quest template applied to the full arc. The Curse of Knowledge as both theme and structural constraint. 
- `lab-report-story-codoex-curse-of-knowedge.md` — Epic worldbuilding with iniciative positivity belief heroism adventuring humble writing principles applied to every node description. Sensory, motoric, visual. The claw marks that go *toward* you. The dust that's gone in the second chamber but perfect in the first. The difference between "crypt" and a place you can smell.
- `lab-report-friendships-with-magic.md` — The session postmortem that named the game's core philosophy. Eight hours in the loop. What it means to build something distributable. The NPC favorability system as the mechanical form of something the architecture can't quite say directly: *the people you choose are the score.*

---

> **How to use this document**
> Each terrain is a node on the quest map. The player moves from node to node by completing an objective and receiving an item or token. Battles are marked with `🎲 START BATTLE` / `🎲 END BATTLE` — the DM calls Initiative at that point. The story does not resolve the battle; the dice do. Epic NPCs each award one **Codex Shard**, the EPIC token that unlocks the next arc.

---

## PROLOGUE — THE COURIER

Before the map. Before the Codex. Before any of it.

His name is **Froberger**.

He is the person you grew up with — a sibling, or near enough. Brilliant with letters, terrible with swords, which is why he became a courier instead of a fighter. He had been working a job for the Ivory Circle for three years: locate the Codex Shards, map their positions, and carry that map to a scholar named Sweelinck in the mountains.

He found six of the seven.

The seventh would have required walking back through Birka. The Void's advance scouts — Void outriders — tracked him there. He knew they were following him. He ran anyway, because the map had to reach someone.

That someone is you.

You are in the streets of Birka when a young man in a brown courier's satchel rounds a corner too fast and collapses at your feet. His coat is dark with blood. He presses a folded, stained map into your hand and says one word before his eyes close:

*"Sweelinck."*

The map shows four towns and seven symbols in faded ink.

**For the DM:** Froberger's journal will be found at Node 2. Five entries may be read aloud at key nodes — Entry 7 (Docks), Entry 14 (Highlands), Entry 23 (Hag Swamp), Entry 31 (Desert), and Entry 41 (Weimar). Entry 41 must always be read. It reframes everything.

---

## THE PREMISE

The **Codex of Seven Seals** is an ancient tome that binds the Void — a dimension of consuming darkness beyond the Cosmic Realm. Seven scholar-kings each carried one Shard of the Codex into hiding across the world before dying. Centuries later the Seals are weakening. Monsters walk where they never walked. The sky over Birka flickers.

A dying courier collapses at your feet in the streets of Birka, pressing a bloodstained map into your hand and whispering one word: *"Sweelinck."*

You are alone. You have a sword, a coin purse, and this map.

---

## THE FOUR TOWNS

### 🏙 BIRKA — The Metropolis
*Near the Cosmic Convergence. Population: vast. Politics: fractured.*
The greatest city in the known world sits on a ley-line nexus where planar energy bleeds through. The lower districts have gone strange — neon-lit underground markets, corrupted tech gangs, and a crypt system that runs deeper than any map shows. The High Council rules from a spire that nobody has seen the top of.
- **Ruling Faction:** The High Council of Birka
- **Epic NPC:** High Commander Seraphine Bruhns *(see profiles)*
- **Key Terrains:** city, cyberpunk_streets, crypt, inn, tavern, bar

---

### ⚓ TILBURY — The Merchant Town
*At the harbor mouth. Population: industrious. Politics: money.*
Every trade route passes through Tilbury's docks. The Merchant's Conclave controls import licenses, which means they control food, weapons, and information. The market quarter never fully sleeps. The Magistra's office is above a spice warehouse that smells of cardamom and old blood.
- **Ruling Faction:** The Merchant's Conclave
- **Epic NPC:** Magistra Elara Muffat *(see profiles)*
- **Key Terrains:** docks, market_quarter, storefront, merchant_ship, inn

---

### 🌑 VISBY — The Enemy Town
*In the hollow between two dead hills. Population: rough. Politics: violent.*
Visby is not on official maps. It exists because the Crimson Warrant — a bandit coalition turned city-state — built it out of plunder and stubbornness. The alleys are a maze. The sewers are occupied. Three goblin clans pay tribute to Warlord Mordus. Outsiders are tolerated if they are useful and robbed if they are not.
- **Ruling Faction:** The Crimson Warrant
- **Epic NPC:** Warlord Kael Mordus *(see profiles)*
- **Key Terrains:** alley, sewers, goblin_cave, pirate_cave, bar

---

### 📚 WEIMAR — The Scholar Town
*In a mountain pass, above the clouds. Population: small. Politics: ancient.*
Weimar is reached by a single road that the scholars say is unmappable to those who haven't been invited. The Ivory Circle has studied the Codex for three generations. Archivus Sweelinck is the last living member who actually touched a Shard. The blacksmith quarter below the main hall forges enchanted instruments. There is an outhouse behind the observatory that contains, inexplicably, a portal to the desert.
- **Ruling Faction:** The Ivory Circle
- **Epic NPC:** Archivus Ptolemy Sweelinck *(see profiles)*
- **Key Terrains:** scholars_qtr, blacksmith_qtr, mountains, outhouse, arctic (pass above)

---

## THE SEVEN EPIC NPC PROFILES

---

### 1. Magistra Elara Muffat
**Role:** Spymaster disguised as Trade Minister of Tilbury
**Location:** Tilbury — above the spice warehouse, docks district
**Appearance:** 50s, silver-streaked auburn hair, always in merchant robes with a hidden dagger at the wrist. Eyes that catalogue everything.
**Personality:** Precise. Never wastes words. Trades information the way others trade coin. Trusts no one by default, respects competence immediately.
**Secret:** She was the courier's handler. She sent him to Birka. She knows what the dying man told you is only half the truth.
**Quest Role:** Gives the player the first real map and explains the Codex's history. Points toward Brother Aldric in the forest.
**EPIC Token — The Trade Seal:** A wax seal on red leather stamped with the Conclave mark. Opens locked doors in Tilbury and grants passage through the merchant ship lanes.
**Dialogue Hook:** *"The courier worked for me. Whatever he told you before he died — that was Act One. Welcome to Act Two."*

---

### 2. Brother Aldric the Unshorn
**Role:** Former scholar-knight, now forest hermit
**Location:** Forest hermitage, one day's walk east of the midlands road
**Appearance:** Enormous man, mid-60s, grey-bearded, bare feet regardless of terrain. Wears a monk's robe patched with bark and moss. Carries a gnarled staff.
**Personality:** Speaks slowly. Laughs unexpectedly. Has clearly been alone too long but is not broken by it. Dislikes cities. Loves animals.
**Secret:** He carried Shard #2 into the forest 40 years ago and buried it beneath a leshen's tree to keep it hidden from the Conclave. The leshen has been guarding it ever since — not friendly.
**Quest Role:** Sends the player to retrieve Shard #2 from the leshen's grove, then points toward the sea and Captain Draketide.
**EPIC Token — The Grove Token:** A carved wooden disc covered in runes. Allows safe passage through forest terrain (wild animals will not attack first).
**Dialogue Hook:** *"You'll want to go into that grove. I'd advise against it. You'll go anyway. Come back when you're done bleeding."*

---

### 3. Captain Selene Draketide
**Role:** Privateer captain, keeper of oceanic trade secrets
**Location:** Island harbor, somewhere in the island chain east of the ocean crossing
**Appearance:** Late 30s, deep brown skin, close-cropped white hair (not age — a curse). Scar across the throat from a failed hanging. Speaks in a low rasp.
**Personality:** Irreverent, fast-thinking, keeps score of every favor owed. Genuinely fond of the sea. Will sail into anything if the price is interesting.
**Secret:** Her ship's hold contains the sunken library of Atlantis — she raised it piece by piece from the sea floor. She has been reading the Codex's history without knowing what she had.
**Quest Role:** Ferries the player to Atlantis and the sea cavern. Has Shard #3 in her chart room, disguised as a nautical instrument.
**EPIC Token — The Tidal Rune:** An obsidian disc etched with wave patterns. Grants safe passage through ocean and sea terrain (sea monsters treat the player as neutral on first encounter).
**Dialogue Hook:** *"I've been sailing around that sunken city for six years. Never thought to ask what the shiny rock in my chart room was actually for."*
**EB Quest-Giver (Q59):** Also appears as the quest-giver for Q59 — EA | Abyssal Scriptorium (node AT, parent node). Her EB context shows her reading Scholar King construction notes in the archive. See §EPIC BATTLEGROUNDS — Quest-Giver Dialogue below.

---

### 4. Warlord Kael Mordus
**Role:** Ruler of Visby, arms dealer, reluctant keeper of a secret
**Location:** Visby — the Warrant Hall (top floor of the Broken Tooth tavern)
**Appearance:** 40s, thick-set, bald with a full black beard going grey. Missing the ring finger on his left hand. Always eating something.
**Personality:** Blunt, surprisingly fair in his own terms, despises waste. Will negotiate anything if the offer is serious. Has a code — it's just not the one anyone expects.
**Secret:** One of his goblin cave shamans has been worshipping the Void for years. Mordus didn't know until recently. The shaman has Shard #4 and has begun using it as a focus for Void rituals. Mordus wants it gone but can't touch it himself — it burned his ring finger off.
**Quest Role:** Offers the Shard in exchange for the player eliminating the shaman (START BATTLE). Won't betray the player after the deal is made.
**EPIC Token — The Crimson Warrant:** A blood-red coin stamped with a fist. Grants safe passage through Visby and all Crimson Warrant territory.
**EB Quest-Giver (Q71):** Also appears as the quest-giver for Q71 — EG | Void Shaman's Sanctum (node BK, parent node). The EB context reveals the shaman operated an intelligence network reporting to someone in Birka — expanding his main-quest role into a broader Void conspiracy thread. Return beat: "He was writing to someone in Birka." See §EPIC BATTLEGROUNDS — Quest-Giver Dialogue below.
**Dialogue Hook:** *"I run a tight operation. Whatever that thing in the caves is doing, it's bad for business. You fix it. I'll owe you something. I always pay my debts."*

---

### 5. Sandmage Izador al-Rashun
**Role:** Wandering desert scholar, master of elemental contracts
**Location:** Moving — always with the desert caravan but changes camels often
**Appearance:** Ageless. Could be 40 or 400. Amber eyes, shaved head, tattooed hands that glow faintly at dusk. Travels light.
**Personality:** Philosophical to the point of irritation. Asks more questions than he answers. Genuinely curious about everything. Has no fear of death, which makes him dangerous to argue with.
**Secret:** He created the djinn contract that originally bound Shard #5 into the desert sand. He can dissolve the contract but the djinn must consent — or be defeated.
**Quest Role:** Leads the player to the djinn's binding circle in the deep desert (START BATTLE or negotiation). Awards the Shard after the djinn is dealt with.
**EPIC Token — The Sand Cipher:** A brass tile etched with an equation that shifts every time you look away. Decodes the final inscription on the Codex.
**Dialogue Hook:** *"The djinn has had that Shard for two centuries. It considers the agreement perpetual. You will need to either convince it otherwise or convince it of nothing further. I recommend the former."*
**EB Quest-Giver (Q65):** Also appears as the quest-giver for Q65 — EV | Djinn's Apex Vault (node DC, parent node). The EB context reveals a separate incident — a djinn hierarchy figure renegotiating his two-century-old contract without consent. Both contexts establish Izador as someone with multiple ongoing elemental agreements, all based at DC. See §EPIC BATTLEGROUNDS — Quest-Giver Dialogue below.

---

### 6. Oracle Kassiphane
**Role:** Ancient oracle, last speaker of the Scholar Kings' language
**Location:** The Greek Agora — under the central temple, in the speaking chamber
**Appearance:** Appears as a young woman in white robes. Is not young. Eyes are solid gold. Sits cross-legged and does not move.
**Personality:** Speaks only in truths — not prophecies. States what is, not what will be. This is more disturbing than prophecy. Answers every question with exactly what you need to know and nothing else.
**Secret:** She is the Codex's index — a living table of contents. She knows where every Shard is and has been waiting for someone to ask. She cannot give Shard #6 directly; it is inside the Jade Construct guarding the Oriental Palace.
**Quest Role:** Tells the player the exact location and nature of all remaining Shards. Directs them to the Oriental Palace and then to Weimar.
**EPIC Token — The Olympian Key:** A golden disc inscribed with a library catalogue. Shows the location of any item the holder is seeking (single use).
**Dialogue Hook:** *"You have five Shards. The sixth is in a palace at the edge of the world, guarded by a jade machine that has never lost a fight. The seventh is with an old man who smells of ink and is running out of time. I suggest hurrying."*

---

### 7. Archivus Ptolemy Sweelinck
**Role:** Last living Ivory Circle scholar, keeper of the final Shard
**Location:** Weimar — the Observatory, top floor
**Appearance:** Ancient. 90s at least. Stick-thin, moves carefully, smells of ink and burned parchment. Wears reading spectacles that are cracked in one lens. Hands shake but eyes do not.
**Personality:** Sharp as a blade. Impatient with stupidity. Deeply kind when he thinks no one is watching. Has been waiting for someone to come for the Shard for twenty years and has prepared extensively.
**Secret:** He cannot give the player the Shard directly — it is sealed behind a riddle door. He wrote the riddle himself. He will give you the answer only if you prove you understand what the Codex is actually for. (The answer is: *"The world."*)
**Quest Role:** Final gatekeeper. After receiving Shard #7, he tells the player to return to Birka — to the Cosmic Realm convergence point — and reforge the Codex before the next new moon.
**EPIC Token — The Weimar Fragment:** The Shard itself, cold to the touch, hums at a frequency that makes dogs uncomfortable. The final piece.
**Dialogue Hook:** *"I wrote that riddle door when I still had good knees. The answer is obvious if you paid attention. Did you pay attention? You look like someone who paid attention."*

---

## NODE NETWORK MAP

> **Note:** This is a conceptual terrain topology map — not the canonical node grid. For the authoritative 26×16 grid with exact coordinates, node codes, and connections, see `maps.md`. This diagram predates junctions, EB nodes, and the defi_land cluster (DF/HM/GL).

```
                         [COSMIC REALM]
                               │
                    [HEAVENLY CLOUDS]
                          │        │
                    [CAMELOT]   [ORIENTAL PALACE]
                       │              │
[ARCTIC]──[MOUNTAINS/WEIMAR]──[GREEK AGORA]
    │          │        │
[HIGHLANDS] [BLACKSMITH][SCHOLARS QTR]
    │          │
[FOREST]──[MIDLANDS]──────────────────────[BIRKA/CITY]
    │          │                           │        │
[SWAMP]──[HAG SWAMP]              [CYBERPUNK]  [CRYPT]
    │                                          │
[JUNGLE]──[DESERT]──[DESERT CARAVAN]     [CATACOMBS]──[VAMPIRE CASTLE]
                │                              │
           [DESERT]──[SPHINX]          [SEWERS]──[GOBLIN CAVE]
                                            │
[BEACH]──[ISLANDS]──[OCEAN]──[DOCKS/TILBURY]──[MERCHANT SHIP]
    │         │        │            │
[SEA CAVERN] [ATLANTIS][DEEP SEA] [MARKET QTR]──[STOREFRONT]
    │                               │
[FRESHWATER LAKE]             [ALLEY/VISBY]──[PIRATE CAVE]
                                    │
                              [MONSTER CAVE]

INNS: city · docks (Tilbury) · Visby (bar) · Weimar (scholars_qtr)
      + every major terrain hub has an inn beat (rest is required)
```

**Travel Methods:**
- `─` Road (on foot or horse)
- `│` Mountain pass or tunnel
- Sea nodes connect via boat (Captain Draketide's ship or hired vessel)

---

## THE JOURNEY

---

# ACT I — BIRKA & THE FIRST NIGHT
*"The city that eats its own light."*

---

### NODE 1 — city (City Streets)
**Arriving in Birka.**
The player begins here. The city is enormous and slightly wrong — districts that shouldn't neighbour each other do, the sky has a faint violet cast at night, and there are more guards than usual on the main thoroughfare.

**Starting Kit:** You arrive with a 🪵 **Pointy Stick** (main hand, 1d4) and a 🗡 **Flint Dagger** (offhand, −3 to hit — crude, but it's what you have). Inventory holds a Rusted Dagger and 2 Minor Healing Potions. Gold: 150gp.

**NPC (Birka Arc):** Guard Captain Yael Scheidemann — activates `quest_slums_cleanup` (3 vermin clears in SL → 80gp + Yael Friendly). Escort mechanic unlocks at Friendly.

**Objective:** Locate the courier's body and recover the stained map.
**Item Found:** The Bloodstained Map — marks four towns and seven symbols in faded ink.
**NPC:** City Guard Captain (minor) — will question the player about the courier; must be persuaded or deceived to get the body released.

> 🛏 **SLEEP REQUIRED (Night 1)** — Introduction to the sleep mechanic. Find the nearest inn (east → Node 2). A room costs **5gp**. First sleep at any new location is a **Boyscout Night** — dice-based HP recovery (2×d10+CON). The innkeeper mentions strange lights at the docks last night.

**Exit Condition:** Map recovered. Head to the inn.
**Next Node →** inn (within city) · or north to Birka Slums

---

### NODE 51 — city_slums (Birka Slums)
**North of the city market. The Vermin Pit.**
The cramped alleys north of Birka market. Refuse heaps attract every pest the city produces. Children dare each other to touch the leech-covered gutter stones. No fixed battle here — only stalking.

**Hunting Ground:** "The Vermin Pit" — 14 monsters, all vermin and low-tier beasts (trivial–easy). Good early XP farming at levels 1–4. The ⏳ Wait button sends a random vermin straight at you.

**Boyscout Opportunity:** Short-resting here for the first time earns a 🏕 Necklace Token. Sleep south (at City Inn) after for Boyscout Night double rolls.

**Exit Condition:** N/A — stalk-only node. Return south to CI when done.
**Next Node →** south to City Streets (CI); east to CQ (Cat Quarter — ⚠️ PLANNED Layer 46)

---

### NODE 77 — cat_quarter (The Cat Quarter) ⚠️ PLANNED — Layer 46

> *Not yet in HTML. Accessible east of SL. Full design in `plan.md` Section IX. All dialogue below is beat-line only — no verbatim implementation text until Layer 46 build begins.*

**First visit:** A cardboard sign reads RAT PROBLEM. NOT RATS. CATS. WORSE. Jimmy Two-Tails (orange tabby fixer) auto-dialogues from a milk crate. He has a job. He needs someone who isn't a cat.

---

#### Q-CAT-01 — "New in the Neighborhood" ⚠️ PLANNED
- **Trigger:** First visit to CQ; Jimmy Two-Tails auto-dialogue
- **Beat:** Clear 5× Stray Alley Cats AND 3× Fluffy Cats from the CQ terrain
- **Dialogue register:** New York Goodfellas — short, clipped, very certain about everything
- **Return beat:** Jimmy nods. "You're alright." Sandy Scratchpad Mewlino unlocks.
- **Reward:** 150gp + Sandy unlocks at CQ

---

#### Q-CAT-02 — "The Fluffy Problem" ⚠️ PLANNED
- **Trigger:** Talk to Sandy Scratchpad Mewlino after Q-CAT-01
- **Beat:** Sandy's faction is losing ground to the Beefy Cats moving in from the east end. Defeat 4× Beefy Cats.
- **Dialogue register:** Sandy is Grease — big energy, fast talk, loyal to her girls
- **Return beat:** "Nobody pushes the Fluffies around. Nobody." Honcho territory revealed.
- **Reward:** 250gp

---

#### Q-CAT-03 — "Respect the Honcho" ⚠️ PLANNED
- **Trigger:** Auto-spawns after Q-CAT-02; Jimmy explains the hierarchy
- **Beat:** A Honcho is blocking the back corridor. You can fight it or negotiate (CHA DC 14). Both outcomes advance the quest.
- **Dialogue register:** The Honcho speaks in short declarative sentences. "This is my corner." "It has always been my corner." "It will always be my corner." "Okay."
- **Return beat:** The Don's territory opens. Kenickie's Black Market unlocks at CQ.
- **Reward:** 350gp + Kenickie's Black Market vendor chip

---

#### Q-CAT-04 — "Taz at the Door" ⚠️ PLANNED
- **Trigger:** Second visit to CQ after Q-CAT-03; CQ battle slot loads `taz_devil`
- **Beat:** A Taz Devil — two Honchos who merged and are now one very large, very fast, very offended entity — has claimed the center of the Quarter. It cannot be reasoned with. It is in the zone.
- **Dialogue register:** The Taz Devil does not speak. Jimmy: "You know what happens when two Honchos get close enough? Yeah. That."
- **Return beat:** The Quarter breathes again. The Cat-King appears on the horizon.
- **Reward:** 500gp + The Don's Signet Ring (sell:35)

---

#### Q-CAT-05 — "The Corrupted Cat" ⚠️ PLANNED
- **Trigger:** Auto-appears any time after Q-CAT-02; ties to DF Void pressure lore
- **Beat:** A cat near the DF border is acting wrong — too still, wrong eyes. Void pressure from the Unbanked Quarter is leaking. Player must investigate (visit DF) and return with a Corrupted Meme Fragment as evidence. Optional: exorcise the cat (INT DC 12) or let Jimmy handle it his way.
- **Dialogue register:** This one is quieter. Sandy: "He was a good boy." Jimmy: "Yeah." Long pause. "Yeah."
- **Reward:** 200gp + "Crossed Paws" lore item (sell:5)

---

#### Q-CAT-06 — "Cat-King" ⚠️ PLANNED
- **Trigger:** After Q-CAT-04 and Q-CAT-05 both complete; special CQ battle slot loads `cat_king`
- **Beat:** Three Taz Devils merged. The Cat-King is here. It is enormous. It is orange. It is specifically looking at you.
- **Dialogue register:** The Cat-King does not speak either. But Jimmy, watching from a fire escape: "Three of 'em. At once. I've never seen that before." He is writing it down.
- **Return beat:** The Quarter is stable. Jimmy hands you something wrapped in newspaper. It is a very small crown. "From the last one," he says. "We keep it around."
- **Reward:** 900gp + Cat-King Crown (unique, sell:50) + "Nine Lives" permanent flag (flavor; +1 to first death save per rest)

---

### NODE 2 — inn (First Night)
**The sleep mechanic is introduced here.**
The innkeeper is nervous. Two merchants disappeared from the harbor district. She gives the player a free breakfast if they look "like they know how to handle trouble."

**Item Found:** Merchant Ledger (left by missing merchants) — mentions Magistra Muffat in Tilbury.
**NPC:** Innkeeper Brynn — minor NPC, gossip source.

**NPC (Birka Arc):** Innkeeper Brynn Clerambault — activates `quest_brynn_ledger` (Worn Ledger Book from SL → free lodging + Brynn Friendly).

> 📖 **FINN'S JOURNAL FOUND** — Brynn sets a worn leather journal on the table alongside breakfast: *"He left this in the room. Paid three nights ahead, didn't sleep the third one. I kept it. Felt like someone would come asking."* The journal has 42 entries — one for every terrain Froberger visited or heard about. The DM may read relevant entries at key nodes throughout the journey.

**Exit Condition:** Rested. Read the ledger. Tilbury is two days west.
**Next Node →** tavern

---

### NODE 3 — tavern (Common Room)
**The tavern district of Birka.**
Rumors fly. Something came out of the crypt last week. A merchant who bought a map to Atlantis hasn't been seen. A bard sings a song about the Scholar Kings that seems to contain actual cipher text if you listen carefully.

**Item Found:** Cipher Scrap — partial translation of the Scholar Kings' inscription. Needed later at the Oracle.
**NPC:** Bard Tomas Couperin (minor) — will trade the cipher scrap for a drink and a silver coin.

**NPC (Birka Arc):** Bard Tomas Couperin — activates `quest_couperin_lute` (lute from Pachelbel at BA → 40gp + cipher scrap + Quill Friendly).

> 🎲 **START BATTLE: 2× Thug** *(two men who were watching you take the ledger)*
> Win: They flee. Proceed.
> Lose: Wake up robbed in the alley. Ledger is still in your boot; they missed it. -10gp, -half HP.
> 🎲 **END BATTLE**

**Exit Condition:** Cipher scrap obtained. Move toward the city's lower districts.
**Next Node →** bar

---

### NODE 4 — bar (Tavern Brawl District)
**The rougher drinking establishments near the crypt entrance.**
The bar closest to the crypt has a back room where the city's less official business happens. A fence offers to sell you information about the Tilbury Conclave. He's not wrong but he's definitely overcharging.

**Item Found:** Conclave Pass — a forged travel document that gets you into Tilbury without a cargo inspection. Costs 15gp from the fence.

**NPC (Birka Arc):** Fence Pachelbel — activates `quest_pachelbel_shipment` (Sealed Scholar Box from CR → 60gp + Pachelbel Friendly). Sells Rough Whiskey 5gp (drunk pit fight trigger at CY).

**Exit Condition:** Conclave Pass purchased. The crypt entrance is behind the bar.
**Next Node →** crypt

---

### NODE 5 — crypt (The Birka Underbelly)
**Below the bar. Dark. Smells like old stone and something worse.**
The crypt is where Birka buries its dead and, it turns out, its secrets. The first chamber has old tombs. The second has fresher ones. Something has been digging from below.

**Item Found:** Void Scratch — a stone wall with claw marks forming a symbol that matches one of the seven on the bloodstained map.

> 🎲 **START BATTLE: Skeleton × 3, Shadow × 1** *(disturbed by your torch)*
> Win: Proceed deeper.
> Lose: Forced back to the bar level. Can retry after a rest.
> 🎲 **END BATTLE**

**Item Found:** Crypt Key — an old iron key on a skeleton that shouldn't be there (too recent). Opens the locked passage toward the cyberpunk lower levels.

**Exit Condition:** Crypt Key found. Void symbol sketched in your journal. Report to Commander Auros.
**Next Node →** cyberpunk_streets (lower Birka)

---

### NODE 6 — cyberpunk_streets (Lower Birka — The Neon Undercity)
**Below the crypt. Not on any official city map.**
The undercity is not fantasy — it is something else. Neon-lit corridors, mechanical guards, corrupted data wraiths flickering through the walls. Someone built this below Birka without the Council knowing.

**NPC:** High Commander Seraphine Bruhns — she is already here. She was following the same trail.

**Auros Profile:** Tall, 40s, military bearing, close-cut dark hair going silver. Full plate under a civilian cloak. Carries a command baton that doubles as a weapon. Pragmatic. Has been fighting the Void's encroachment for three years and is running out of options.

**NPCs (Birka Arc):** Pit Master Weckmann — `quest_pit_training` (3 CY wins → Pit Legend Token + Friendly). Commander Auros — `quest_void_below` (requires Weckmann+Auros both Friendly; clear CY_VOID → EMP Grenade + Scholar's Note + Auros Dear Friend). Rough Whiskey triggers drunk pit fight at CY if held when entering battle.

> 🎲 **START BATTLE: Corrupted Android × 2, Data Wraith × 1** *(blocking the relay chamber)*
> Win: Access the relay chamber, learn the undercity was built by the Scholar Kings.
> Lose: Auros covers your retreat. Same outcome, but you owe her one.
> 🎲 **END BATTLE**

**Dialogue (Auros):** *"The Scholar Kings built this as a failsafe. It's been running without maintenance for three hundred years. Whatever is in those caves — find the Codex Shards. All seven. I'll hold Birka together while you do."*

**Item Found:** Commander's Token — Auros's personal seal. Grants military access in Birka on return.

> ⚡ **CONDITION ITEM: Signal Jammer** — Salvaged from the defeated Corrupted Android. A flat black box, palm-sized, three antennae. Auros identifies it: *"Warrant suppressor — jams coordinated tactical signals in a forty-foot radius. Military grade. Keep it."* — Condition: **Jammed** (enemy group tactics broken, DIS on attack rolls for 2 rounds; useless vs. organic enemies)
> ⚡ **CONDITION ITEM: EMP Pulse Grenade** — Auros pulls one from the cordon's supply: *"In case you find more of whatever built this place. Disrupts any electronic or magnetically-controlled system. Don't waste it on a goblin."* — Condition: **EMP Stunned** (constructs/androids incapacitated 1 round, ADV on attacks against them)

**Exit Condition:** Briefed by Auros. Head to Tilbury.
**Next Node →** docks (Tilbury)

---

# ACT II — THE COASTAL ROAD
*"Tilbury never stops moving and never tells you where it's going."*

> ⏳ **SURVIVAL PRESSURE — DAY 3:** Seven new moons until the Void breaks through completely. Approximately 49 days total. Three are spent. Every node skipped without rest advances the tide by one day. Skipping two consecutive nights makes NPCs in the region hostile or causes them to flee. Keep moving, but keep sleeping.

---

### NODE 7 — docks (Harbor Docks — Tilbury)
**Arriving in the merchant town. Salt air. Shouting. Seagulls.**
Tilbury's harbor is the busiest place the player has seen. Three ships unloading simultaneously. A harbormaster counting crates with suspicious intensity. The Conclave seal is on every building.

**NPC:** Magistra Elara Muffat — finds you before you find her. She was watching the dock gate.

**Dialogue (Muffat):** *"The courier worked for me. Whatever he told you before he died — that was Act One. Welcome to Act Two."*

**EPIC TOKEN RECEIVED — The Trade Seal** *(Codex Shard #1)*

> 💣 **CONDITION ITEM: Smoke Bomb** — Available from any dock vendor for 3gp. The player watches dockworkers use them during a fire drill — smoke fills the gap between vessels, forcing the "crew" to break cover or shoot blind. *"Smart people use them for other things,"* a dockhand says. — Condition: **Half Cover counter** (negates enemy cover, enemy attack rolls have DIS, 20-ft radius, 2 rounds)
> 📖 **FINN'S JOURNAL — Entry 7:** *"Magistra Muffat is terrifying in the best way. She handed me the Trade Seal and said 'don't lose it or I'll know.' I believe her. She believes in the Codex. I believe in her."*

Muffat hands over the Shard, which she's been keeping in a lead-lined box in her desk for six years. She explains the Codex, the seven Shards, and the Void. She provides names: Aldric (forest), Draketide (sea).

**Exit Condition:** Trade Seal received. Muffat directs you to the market quarter for supplies.
**Next Node →** market_quarter

---

### NODE 8 — market_quarter (Tilbury Market)
**Every ingredient, tool, and rumor for sale.**
Shops stack three stories in some places. A peculiar vendor sells "objects of uncertain origin" — including what appears to be a Codex fragment rubbing.

**Item Found:** Supply Pack — provisions for 3 days (spend 10gp or steal it). Also: Fragment Rubbing — partial Codex text. Matches the cipher scrap from Birka.
**NPC:** Vendor Mira (minor) — information broker who knows Aldric's forest location for a price (5gp).

> 💣 **CONDITION ITEM: Flash Powder** — Vendor Mira sells them 2 for 5gp from a basket near the stall entrance. She tosses one at a seagull to demonstrate — it flaps away in a startled spiral. *"Lords use it for party tricks. Stagehands use it for scene changes. Smart people use it for other things."* — Condition: **Blinded** (ADV on attacks against blinded target, their attack rolls have DIS, lasts 1 round)

**Exit Condition:** Supplies purchased. Aldric's location confirmed.
**Next Node →** storefront

---

### NODE 9 — storefront (Market District Shop)
**A specific shop — the one that shouldn't exist.**
Behind the spice stalls is a shop with no sign that sells maps, locks, and old keys. The proprietor recognises the Bloodstained Map and pales.

**Item Found:** The Real Map — a corrected, expanded version of the bloodstained map. Shows all 42 terrain nodes and their connections.
**NPC:** Proprietor Dusk (minor) — minor Ivory Circle contact who gives the Real Map for free and asks the player to tell Sweelinck that "the archive is nearly sorted."

**Exit Condition:** Real Map obtained.
**Next Node →** merchant_ship

---

### NODE 10 — merchant_ship (Aboard the *Tilbury Star*)
**A night passage on a trade vessel heading east.**
You've booked passage to the island chain. The ship is legitimate. The cargo is not. Somewhere below decks, something is alive that shouldn't be shipping.

> 🎲 **START BATTLE: Pirate × 3, Pirate Ghost × 1** *(mid-sea boarding attempt at 2am)*
> Win: Pirates repelled. Captain grateful. Free passage forward.
> Lose: Cargo thrown overboard to distract pirates. Lose supply pack, reach islands safely.
> 🎲 **END BATTLE**

> 🛏 **SLEEP REQUIRED (Night 2)** — Cramped bunk, 3gp. Innkeeper equivalent is ship's quartermaster. Rest until dawn.

**Item Found:** Cargo Manifest — lists "one navigational instrument, Draketide provenance." Captain confirms this matches the Island Harbor.
**Exit Condition:** Arrive at Island Shore.
**Next Node →** alley (Visby approach — optional detour, or skip to midlands)

---

### NODE 11 — alley (Dark Alley — Visby Approach)
**The edge of Visby. Enter if you choose.**
The road to Visby begins in a long alley behind a warehouse district. Warrant scouts watch every entrance. Flash the Conclave Pass and they let you through — or don't, and fight.

> 🎲 **START BATTLE: Thug × 2, Kenku × 1** *(Warrant border checkpoint)*
> Win OR Pass presented: Proceed into Visby.
> 🎲 **END BATTLE**

**Exit Condition:** Passage into Visby secured. (Full Visby arc comes in Act V.)
**BRANCH NODE** → Continue on main road to midlands (Act III), or enter Visby now (Act V).

---

# ACT III — THE VERDANT WILDS
*"The land remembers things that maps forget."*

> ⏳ **SURVIVAL PRESSURE — DAY 10:** Ten days in. One Shard secured. The Void Tide advances every 7 nodes without meaningful progress — if no Shard or Epic NPC has been reached recently, describe one world-worsening event: a previously safe inn is now locked, a docile road creature now attacks first, a village has quietly evacuated. The pressure is not an attack. It is erosion.

---

### NODE 12 — midlands (Plains & Midlands)
**Open road. Wide sky. Something is wrong with the fields.**
Farms are abandoned. Livestock wandered off. The road runs straight but feels watched. Peasants in the last village mentioned a "field woman" at noon.

**Item Found:** Abandoned Pack — previous traveler's gear. Contains a partial journal mentioning Brother Aldric's hermitage ("follow the crow-marked trees east of the crossroads").

> 🎲 **START BATTLE: Noonwraith × 1, Field Marshal Windbag × 1** *(appear at noon as you cross the open plain)*
> Win: Noonwraith dissolves. Road clears.
> Lose: Retreat to the tree line. Noonwraith returns at next midday.
> 🎲 **END BATTLE**

**Exit Condition:** Midlands road crossed. Crow-marked trees found.
**Next Node →** forest

> **Optional branch — Yugurt Lake:** From J6 (Western Wilds Crossroads), the player may go south to Yugurt Lake instead of east or west. See NODE 75 and NODE 76 below.

---

### NODE 13 — forest (Forest / Trees — Aldric's Territory)
**Ancient trees. Crow-marked trunks every 200 paces. Then a fire in the distance.**
Brother Aldric's hermitage is a stone hut beside a stream. He is boiling mushrooms. He has been expecting someone — just not necessarily you specifically.

**NPC:** Brother Aldric — gives the quest to retrieve Shard #2 from the leshen's grove.

**Item Found:** Aldric's Ward — a carved wooden charm. Gives advantage on first encounter with the leshen (DM notes: player rolls with ADV on Initiative).

> 🎲 **START BATTLE: Leshen × 1** *(guardian of the buried Shard — grove deep in the forest)*
> Win: Dig up the Shard. Leshen retreats.
> Lose: Retreat to Aldric. He draws the leshen away. Shard retrieved next attempt.
> 🎲 **END BATTLE**

> 🌿 **CONDITION ITEM: Earthbind Root** — Before sending the player to the leshen's grove, Aldric pulls a dried grey root from his coat and demonstrates on a tree stump: throws it at the base, and a tangle of roots erupts across a five-foot radius in under a second. *"Throw it at their feet. The root remembers being in the ground. It wants company."* He gives you two. — Condition: **Prone** (ADV on all melee attacks vs. prone target; target must spend half movement to stand)

**EPIC TOKEN RECEIVED — The Grove Token** *(Codex Shard #2)*
Aldric carves the Grove Token and gives it alongside the dug-up Shard. Points toward the highlands for a pass that leads to the sea road.

**Exit Condition:** Shard #2 secured.
**Next Node →** highlands

---

### NODE 14 — highlands (Irish Highlands)
**Rolling hills. Cold wind. Standing stones in patterns that don't match any cardinal direction.**
The highlands pass runs between the forest and the sea road. A village here — Dunfall — has been terrorised by a kelpie in the loch below. The locals bar their doors at dusk.

**NPC:** Elder Fionn (minor) — asks the player to deal with the kelpie. Reward: a horse for the journey.

> 🎲 **START BATTLE: Kelpie × 1, Cu Sidhe × 2** *(at the loch edge at dusk)*
> Win: Village relieved. Receive horse.
> Lose: Pulled into shallow water. Escape with half HP. Village gives horse anyway — grateful you tried.
> 🎲 **END BATTLE**

**Item Found:** Highland Horse — travel speed doubled on road terrain.

> 🪤 **CONDITION ITEM: Highland Snare Trap** — Elder Fionn gives one as part of the kelpie reward — the player watches it snap shut on a rabbit during the loch preparation. *"Ankle or wrist, doesn't matter. Once the wire closes, it tightens with movement. Still is the only way out, and still is hard when something's frightened."* — Condition: **Grappled** (target speed 0, ADV if no room to maneuver, until Strength DC 13)
> 📖 **FINN'S JOURNAL — Entry 14:** *"Elder Fionn's village gave me a horse. I cried a little when I crossed the pass. I don't think they noticed."*

**Exit Condition:** Pass cleared.
**Next Node →** swamp

---

### NODE 15 — swamp (Murky Swamp)
**The lowlands below the highlands. Thick fog. Every sound is the wrong sound.**
The road becomes a causeway. The causeway becomes a suggestion. A Drowner has been killing the bridge repair crews. There is a specific item in the swamp center — a Runed Stone — that matches one of the seven map symbols.

**Item Found:** Runed Stone — third Codex symbol confirmed.

> 🎲 **START BATTLE: Drowner × 2, Foglet × 1, Waterhag × 1** *(ambush at the central crossing)*
> Win: Crossing secured. Runed Stone retrieved.
> Lose: Stone retrieved but retreat through water. Lose supply pack. Rest required.
> 🎲 **END BATTLE**

**Exit Condition:** Runed Stone collected.
**Next Node →** hag_swamp

---

### NODE 16 — hag_swamp (The Hag's Domain)
**Deeper in. The water glows faintly green. Trees grow in wrong directions.**
This is hag territory. Three hags — the Crones — have been here for centuries. They know about the Codex. They will trade information for a favor: bring them the Runed Stone.

**NPC:** The Crones (Crone Witch × 3, named Whisper, Glut, and Wane) — minor NPCs but significant lore source. Trade the Runed Stone for the swamp road exit and a key that opens the sea cave.

**Item Found:** Sea Cave Key — brass, kelp-wrapped. Opens the deep entrance to the sea cavern.

> 🕸 **CONDITION ITEM: Crone's Binding Web** — Whisper hands over a black ceramic jar sealed with beeswax. She demonstrates on a passing rat "for scale" — the web closes over it instantly, tightening as it squirms. *"Smash it. The web remembers what it's for."* — Condition: **Restrained** (ADV, target attack rolls have DIS, speed 0 until Strength DC 14 — best vs. fast enemies and anything that would flee mid-combat)
> 📖 **FINN'S JOURNAL — Entry 23:** *"The Crones know I'm not you. They kept calling me 'the small one.' They said the real one would come eventually. I said there is no real one. They laughed for a long time."*

> 🛏 **SLEEP REQUIRED (Night 3)** — The Crones offer a "bed" (a moss pile). It is damp. It restores HP. It costs nothing but they will remember this.

**Exit Condition:** Sea Cave Key received. Exit through southern swamp road.
**Next Node →** beach

---

### NODE 17 — beach (Tropical Beach)
**First sight of the sea. Sun on water. Also pirates.**
The beach is the rendezvous point Muffat mentioned for finding Captain Draketide's contact. A dinghy is beached near a firepit. A note under the firepit: *"Signal with three torch flashes after dark."*

**Item Found:** Signal Torch — pre-soaked, lights immediately.

> 🎲 **START BATTLE: Pirate × 3, Sahuagin × 2** *(beach raiders before the signal can be sent)*
> Win: Beach secured. Send signal.
> Lose: Raiders take the torch. Find a second torch from the shipwreck debris nearby. Send signal anyway.
> 🎲 **END BATTLE**

**Exit Condition:** Signal sent. Draketide's skiff arrives at dawn.
**Next Node →** ocean

---

### NODE 75 — yugurt_lake (Yugurt Lake — Optional Detour, Act III)
**Mirror-flat water. No wind. No birds. A hand-painted sign on a stick at the shore: YUGURT. The surface moves once, slowly, then stops.**

Accessible by going south from J6 (Western Wilds Crossroads). Not on the main quest path. Something very large is in this lake and it knows you are here.

**Current Mechanic (Layer 37):** `isFishingLake:true` — `storyFishing()` triggers a standard encounter. The player rolls 2d20 to determine which fish (Rank 1–20) answers the line. Every cast is a fight. See `lab-report-fish-with-dnd.md` for full fish stat block table.

**No Codex Shard. No story battle. No NPC. No sleep.**  
**Next Node →** yugurt_cabin (south)

**[PLANNED — Layer 47] Fishing Overhaul — Four-Phase Mechanic**  
The current 2d20→fight system will be replaced by a four-phase loop:  
1. **Bait Search** (Survival DC 12–18) — find bait in the terrain; failed roll yields bare hook fallback  
2. **Cast** (auto) — drop line with equipped bait from `S_story.equippedBait` stack (mirrors arrow mechanic; depletes on use)  
3. **Type Roll** (2d20 + bait bonus) — determines fish rank 1–20; bare hook uses Luck in place of bait bonus  
4. **Catch Roll** (Dex check vs. fish AC) — success = inventory item; failure = fight the fish  
See `plan.md` §XII for full bait table, fish size tiers, gold value matrix, and 26-step implementation plan.

---

### NODE 76 — yugurt_cabin (Yugurt Cabin — Optional Detour, Act III)
**Smells like wood smoke and fish oil. A lifetime of tackle on the walls. Nets that haven't been cast in years. A rod propped by the door. He is always here in the morning.**

Dead-end south of YL. The Fisherman is here continuously. He says: *"...Nice Day For Fishing. Yugurt! ...Nice Day For Fishing. Yugurt!"* He says this continuously. Not to you specifically. Not to no one specifically.

**NPC:** The Fisherman — grants Fishing Rod (loot), free sleep (sleepCost:0).  
**Item Found:** Fishing Rod — required to trigger `storyFishing()` at YL.  
**Sleep:** Free at this node.

**[PLANNED — Layer 47] Yugurt Cabin Expanded — Tournament & Six Fishermen**  
Five additional NPCs will be present at YC alongside The Fisherman (who is the Master):

| NPC | Title | Competence | Signature |
|-----|-------|-----------|-----------|
| The Fisherman | Master of Yugurt | God-tier | "...Nice Day For Fishing. Yugurt!" |
| Dirk Troutslap | Commercial Trawler | Expert | Talks only in tonnage |
| Vera Hookline | Sport Angler | Skilled | Keeps a laminated rulebook |
| Bog Mudwhistle | Subsistence Fisher | Average | Always eating something unidentified |
| Pip | Kid | Novice | Using a stick and string |
| Renard Castwell | Accounting Department | Terrible | Here on a corporate "wellness retreat" |

**Tournament:** 1v1 betting, best-of-1 round. Player bets gold against opponent's stake. Opponent rolls their own cast using their competence tier as a bait bonus. Highest fish rank wins. Tie → Luck modifier tiebreaker. Win = gold + title upgrade. See `plan.md` §XII-N–XII-P for quest chain Q-TOUR-01 through Q-TOUR-06.

**[PLANNED — Layer 47] The Outsider Merchant — Q-BAIT-00: "Listen Closely"**  
A trader appears at the cabin door on the player's first visit to YC. He blocks entry until the player chooses [LISTEN]. He delivers a complete briefing on the fishing system — the bait loop, the zones, the predator conditions, the magic drops, the monster loot nerf — then is gone on every subsequent visit. No name. No farewell. The cabin door is open. The Fisherman is inside saying Yugurt.

*"You fish for bait. You use bait to fish... The quality depends on how lucky you are. Not how strong. Lucky. There's a difference. The lake knows the difference."*

- **Q-BAIT-00** — *Listen Closely*: The Outsider Merchant blocks the cabin door and recites his briefing — precise, numbered, mechanical, like a man who memorized every word. At the end he holds out a folded pamphlet: **YUGURT LAKE — FISHING GUIDE**. *"You can go now."* He leaves before you do. The Guide goes into inventory (readable, permanent, not sellable). While carried, zone DCs are shown in the fishing modal. → Obtain Fishing Rod → catch 1 bait fish → defeat 1 predator fish. Auto-completes on first predator win. Reward: Starter Tackle Pouch (3× Fathead Minnow, 2× Golden Shiner) + 75 XP. See `plan.md` §XII-Z for full beat structure, Guide text, and implementation notes.

**[PLANNED — Layer 47] Fishing Quest Stubs**  
- **Q-FISH-00** — *The Rod and the Lake*: Obtain Fishing Rod from The Fisherman; trigger first cast at YL  
- **Q-FISH-01** — *Master of Yugurt*: Land a Rank 15+ fish (Yugurt's Leviathan or higher) with bait (not bare hook)  
- **Q-TOUR-01** — *Pip's Challenge*: Beat Pip in a 1v1 tournament bet (competence: Novice)  
- **Q-TOUR-06** — *The Fisherman's Tournament*: Beat the Master. Reward: `master_of_yugurt` token (legendary)  
See `plan.md` §XII for full quest chain and reward table.

---

# ACT IV — THE DEEP
*"The sea keeps more secrets than any library."*

> ⏳ **SURVIVAL PRESSURE — DAY 18:** Nearly three weeks in. Two Shards secured. The sea arc is the longest leg of the journey — four nodes at minimum. Every inn beat matters. A missed night means DIS on the next two encounters. The Void tide does not pause for open water.

---

### NODE 18 — ocean (Ocean Depths — Aboard Draketide's Ship)
**Captain Selene Draketide. Her ship is called the *Cerulean Debt*. She is exactly what was advertised.**

**NPC:** Captain Selene Draketide — reviews the player's items, laughs about the Trade Seal, agrees to help. Shows her chart room. The "navigational instrument" is clearly a Codex Shard.

> 🎲 **START BATTLE: Sea Serpent × 1, Kraken Spawn × 2** *(mid-ocean, night crossing)*
> Win: Draketide is impressed. Cooperation solidified.
> Lose: Damage to ship. Detour to island for repairs.
> 🎲 **END BATTLE**

**Exit Condition:** Reach the island chain.

> 📜 **CONDITION ITEM: Feint Scroll** — Found in Draketide's chart room among the Atlantis fragments, sealed in a bone tube. *"Never learned to read it,"* she says. *"Something to do with misdirection — the Oracle's Voice told me when she came aboard three years ago."* The scroll contains a formalized feint: used at battle start, it strips any enemy in Dodge stance of their defensive posture. — Condition: **Dodge counter** (your attacks no longer have DIS vs. a dodging enemy, single use)

**Next Node →** islands

---

### NODE 19 — islands (Island Shore)
**A harbor island. Local population: fishermen, smugglers, retired pirates, one very old oracle's apprentice.**
The island tavern has information about the Atlantis location. Draketide knows the approach. The local oracle's apprentice delivers a sealed message from Kassiphane — she knows the player is coming.

**Item Found:** Kassiphane's Letter — sealed with gold wax. "Come to the Agora when you have five. I will tell you the rest." Seals the need for Act VI.

**Exit Condition:** Stocked up. Dive point located.
**Next Node →** atlantis

---

### NODE 20 — atlantis (Atlantis — Sunken City)
**Underwater approaches to the sunken library. Cold. Dark. Beautiful. Dangerous.**
Draketide's ship hovers above. The player descends via Draketide's diving bell. The sunken city has intact architecture, wandering Deep Ones, and at its center: the sunken library hall where Draketide has been pulling fragments.

**Item Found:** Atlantis Fragment — a waterproofed scroll case containing the full Scholar Kings' inscription. Completes the cipher started in Birka.

> 🎲 **START BATTLE: Deep One × 3, Aboleth × 1** *(library hall, guarding the scroll case)*
> Win: Scroll case retrieved.
> Lose: Case pulled deeper. Must deal with the Aboleth alone. START BATTLE again (smaller group next round — Deep Ones scatter after Aboleth is injured).
> 🎲 **END BATTLE**

**EPIC TOKEN RECEIVED — The Tidal Rune** *(Codex Shard #3)*
Draketide hands over the "navigational instrument" — now identified as Shard #3. She's oddly relieved to be rid of it.

**Exit Condition:** Shard #3 secured. Surface via diving bell.
**Next Node →** sea_cavern

---

### NODE 21 — sea_cavern (Sea Cavern)
**The coastal cave system that connects the ocean approach to the freshwater interior.**
The Sea Cave Key from the Crones opens the inner passage. This cavern was used by the Scholar Kings as a waypoint — there are carved markers on the walls pointing inward.

**Item Found:** Scholar King Marker — a wall inscription confirming the desert route and naming Izador as "sand-keeper."

> 🎲 **START BATTLE: Dragon Turtle × 1** *(blocking the inner passage — this is the hardest fight of Act IV)*
> Win: Inner passage open.
> Lose: Must find a secondary passage (costs 1 day's travel and one supply unit).
> 🎲 **END BATTLE**

**Exit Condition:** Inner passage navigated.
**Next Node →** freshwater_lake

---

### NODE 22 — freshwater_lake (Freshwater Lake & River)
**The river cave exits into a lake system. Peaceful. Briefly.**
A river system connects the sea cavern to the inland routes. The lake has a water shrine — a small stone circle half-submerged at the shore.

**Item Found:** Water Shrine Offering — place a silver coin in the shrine. Receive the River Blessing: free night's rest once (skip one inn payment).

> 🎲 **START BATTLE: Kappa × 2, River Troll × 1** *(protecting the shrine from looting)*
> Win: Shrine accessible.
> Lose: Blessing not received. Can return later.
> 🎲 **END BATTLE**

> 🛏 **SLEEP REQUIRED (Night 4)** — Use River Blessing (free) or pay 5gp to a river trader for a sleeping spot in their boat.

**Exit Condition:** Lake crossed. Road inland found.
**Next Node →** deep_sea

---

### NODE 23 — deep_sea (Deep Sea Trench — The Descent)
**Draketide takes the ship over the trench on the way back north. Something surfaces.**

This is an optional extended encounter. The trench contains the Leviathan. Draketide will not sail over it twice. This is the point of no return for the sea arc.

> 🎲 **START BATTLE: Charybdis × 1** *(trench whirlpool forms around the ship — everyone must act)*
> Win: Ship escapes. Draketide owes the player a favor (redeemable later as free ship passage anywhere).
> Lose: Abandon ship. Swim to shore. Lose 1 supply, reach beach safely with Draketide's skiff.
> 🎲 **END BATTLE**

**Exit Condition:** Deep sea survived. Return to harbor road.
**Next Node →** sewers (Visby — Act V)

---

# ACT V — VISBY & THE DARK
*"Cities without laws have different laws."*

> ⏳ **SURVIVAL PRESSURE — DAY 25:** Over halfway to the seventh new moon. Three Shards in hand. Four to go. Travelers on the road are fewer — some villages have shuttered. The Void is not a visible thing, but it is felt. People are afraid without knowing why. Don't stop moving.

---

### NODE 24 — sewers (Visby Sewer Underbelly)
**The way into Visby for those without a warrant.**
The sewers connect the lower road to Visby's goblin district. The smell is accurate. A network of goblin guides operate here for coin.

**NPC:** Goblin guide Gritch (minor) — will lead you to the Warrant Hall for 3gp. Won't go near the goblin cave.

> 🎲 **START BATTLE: Wererat × 2, Nekker × 3** *(sewer junction ambush)*
> Win: Passage to Warrant Hall.
> Lose: Gritch gets you out a different way. -1 day detour.
> 🎲 **END BATTLE**

**Exit Condition:** Warrant Hall approach found.
**Next Node →** bar (Visby — Broken Tooth Tavern)

---

### NODE 25 — bar (Broken Tooth Tavern — Visby)
**The Warrant Hall is upstairs. The bar downstairs is extremely lively.**

Meeting Warlord Mordus requires being announced. Order a drink. Wait. His lieutenant finds you in twenty minutes.

**NPC:** Mordus's Lieutenant (minor) — escorts you upstairs if you have the Crimson Warrant region pass or if you survived the sewer ambush and Gritch vouched for you.

**NPC:** Warlord Kael Mordus — upstairs. Explains the shaman problem.

**Dialogue (Mordus):** *"I run a tight operation. Whatever that thing in the caves is doing, it's bad for business. You fix it. I'll owe you something."*

**Exit Condition:** Quest to the goblin cave accepted.
**Next Node →** goblin_cave

---

### NODE 26 — goblin_cave (Goblin Warrens — Visby Depths)
**Three clans of goblins and one Void shaman who has convinced them all he's a god.**

The cave is occupied and layered. The outer warrens are manageable. The shaman's chamber is deep.

> 🎲 **START BATTLE: Goblin × 4, Hobgoblin × 2** *(outer warrens — Mordus's goblins standing aside, the shaman's loyalists blocking the path)*
> Win: Inner passage open.
> Lose: Retreat to outer warrens. Can restock with Gritch's help (+1 supply) and retry.
> 🎲 **END BATTLE**

> 🎲 **START BATTLE: Cult Fanatic (Void Shaman) × 1, Nekker × 4** *(shaman's chamber — Shard #4 is the shaman's ritual focus)*
> Win: Shaman defeated. Shard retrieved.
> Lose: Shaman flees deeper. Shard on the altar — take it.
> 🎲 **END BATTLE**

> ☠️ **CONDITION ITEM: Void Virus Canister** — Recovered from the shaman's altar after his defeat. A cracked glass cylinder with contents that move when the cylinder is still. Mordus won't touch it. *"Take it. Use it on whatever the Void sends next. It's theirs — they'll understand it."* — Condition: **Corrupted** (organic enemies waste their first action on a hallucinated target, ADV during that round — **do NOT use near a Codex Shard**)

**EPIC TOKEN RECEIVED — The Crimson Warrant** *(Codex Shard #4)*
Mordus meets you outside the cave entrance. He takes the dead shaman's ring (evidence) and hands you the Crimson Warrant coin. Pays you 20gp. Calls it square.

**Exit Condition:** Shard #4 secured. Mordus's territory is safe passage.
**Next Node →** pirate_cave

---

### NODE 27 — pirate_cave (Pirate Cave)
**A connected cave system off the goblin warrens runs to the coast.**
Visby's pirate faction stores their stolen goods here. Not hostile to Warrant passholders — but suspicious.

**Item Found:** Treasure Crate — contains 25gp and a Nautical Chart that matches Draketide's routes. Confirms the deep sea approach from Act IV.

> 🛏 **SLEEP REQUIRED (Night 5)** — Pirates will rent a hammock for 3gp. No questions. Breakfast optional at 1gp.

**Exit Condition:** Rested. Exit through the cave mouth to the coast road.
**Next Node →** monster_cave

---

### NODE 28 — monster_cave (Monster Den)
**The cave system between Visby and the highland road is occupied by something large.**
A zeugl — a massive tentacled horror — has been nesting here for three seasons. The road through is blocked. There is no route around.

> 🎲 **START BATTLE: Zeugl × 1, Greater Mutant × 2** *(cave junction — the zeugl is territorial, not malicious)*
> Win: Zeugl retreats. Den passable.
> Lose: Forced back to Visby. Take the highland road instead — adds 1 day.
> 🎲 **END BATTLE**

**Item Found:** Abandoned Scholar Pack — a previous Ivory Circle courier's pack. Contains a letter from Sweelinck to Aldric dated 30 years ago, mentioning "the sand approach."

**Exit Condition:** Monster cave navigated.
**Next Node →** catacombs

---

### NODE 29 — catacombs (Catacombs — The Old Road Below)
**The Scholar Kings built underground roads. Some still work. Some are occupied.**
The catacomb road below Visby connects to the old city network. It's faster than the surface road but the dead down here are restless.

**Item Found:** Catacomb Map — the Scholar Kings' underground road network. Shows routes to Weimar and to the coastal approach below Birka.

> 🎲 **START BATTLE: Wight × 2, Wraith × 1, Sluagh × 3** *(central catacomb junction)*
> Win: Road clear.
> Lose: Detour through a flooded passage — lose 1 supply.
> 🎲 **END BATTLE**

**Exit Condition:** Catacomb road identified.
**Next Node →** vampire_castle

---

### NODE 30 — vampire_castle (Vampire Castle — Ruins on the Eastern Road)
**No road bypasses it. Every road goes through it. That is not an accident.**
The castle was built to be unavoidable. The higher vampires inside collect tolls — not in coin but in blood debt. A cut palm and a promise. The castle's lord, a Bruxa, will let you pass if you agree to return one item she lost in the sea cavern.

**NPC:** Bruxa Elise Mourne (minor but memorable) — elegant, politely terrifying. Accepts the Sea Cave Key in trade for passage. (The Crones' key — its purpose fulfilled.) Gives a Toll Token.

**Item Found:** Toll Token — guarantees safe passage through the castle and all associated territory. Also grants 24-hour warning before any higher vampire moves against the player.

> 🛏 **SLEEP REQUIRED (Night 6)** — Bruxa Mourne offers a guest room. It is luxurious. It is free. Do not ask where the mattress came from.

**Exit Condition:** Toll paid. Toll Token received. Road east is open.
**Next Node →** desert (Act VI)

---

# ACT VI — THE BURNING LANDS
*"The desert does not care if you know where you're going."*

> ⏳ **SURVIVAL PRESSURE — DAY 30:** Thirty days. Nineteen remain. The desert slows everything — depleted supply packs add a full travel day between nodes. The caravan moves constantly. Intercepting Izador at the crossroads is time-sensitive. Keep the supply pack stocked and keep pace.

---

### NODE 31 — desert (Desert Wastes)
**Sand. Heat. Things that move faster than they should.**
Two days' walk from the castle road. The sandmage Izador is said to travel with the caravan. The caravan moves constantly — must be intercepted at the crossroads.

> 🎲 **START BATTLE: Mummy × 2, Sand Wraith × 1** *(the approach to the desert crossroads)*
> Win: Crossroads reached safely.
> Lose: Sand Wraith blinds you temporarily (disadvantage on next skill check). Reach crossroads anyway.
> 🎲 **END BATTLE**

**Item Found:** Desert Crossroads Marker — etched stone marking the route to the caravan's pattern of movement.

**Exit Condition:** Caravan route identified.
**Next Node →** desert_caravan

---

### NODE 32 — desert_caravan (Desert Caravan — Finding Izador)
**The caravan: 30 people, 12 camels, a physician, a cartographer, and somewhere in the middle, Sandmage Izador al-Rashun.**

**NPC:** Sandmage Izador — found meditating under a sun awning. Unsurprised. Has been expecting "something like you" for several months.

**Dialogue (Izador):** *"The djinn has had that Shard for two centuries. You will need to either convince it otherwise or convince it of nothing further."*

**Item Found:** Djinn Binding Circle Location — drawn in sand, then memorised. The circle is three hours southwest.

> 🎲 **START BATTLE: Djinn × 1** *(at the binding circle — negotiation is attempted first; if persuasion fails or is skipped, combat begins)*
> Negotiation: Spend the Cipher Scrap (matching the djinn's contract language). If presented, Djinn releases Shard voluntarily. No battle required.
> Combat: Djinn fought at full strength.
> Win (either): Shard released.
> Lose: Izador intervenes with a binding cantrip. Shard released. Izador is irritated.
> 🎲 **END BATTLE**

**EPIC TOKEN RECEIVED — The Sand Cipher** *(Codex Shard #5)*

> 📖 **FINN'S JOURNAL — Entry 31:** *"Izador asked me what the Codex actually protects. I said the world. He said 'that's the answer to a different question.' I've been thinking about it for two days. I still don't know what I got wrong."*

Izador formalises the receipt with a document. Points the player toward the Greek Agora — "the Oracle will see you now that you have five."

**Exit Condition:** Shard #5 secured.
**Next Node →** jungle

---

### NODE 33 — jungle (Dense Jungle — Road to the Agora)
**The southern passage to the ancient world runs through dense jungle.**
The Scholar Kings' road is overgrown but present. Arachas webs block every third stretch. Something large is moving parallel to the path.

> 🎲 **START BATTLE: Arachas × 2, Endrega × 3** *(ambush from above — dropping from canopy)*
> Win: Road clear.
> Lose: Webbed for one round then freed by a jungle herbalist (minor NPC). Lose 1 supply.
> 🎲 **END BATTLE**

**Item Found:** Ancient Road Marker — confirms the Greek Agora approach via the blacksmith quarter checkpoint.

> 🧪 **CONDITION ITEM: Jungle Neurotoxin Blade Dip** — Herbalist Mael gives one after the player helps clear the Arachas webs. He demonstrates by touching a spider with a dipped twig — it stops moving instantly. *"Stops voluntary muscle function in organisms over forty kilos for approximately four to six rounds. Works on contact through wound. Do not touch the open vial."* — Condition: **Paralyzed** (ADV, all melee hits within 5ft are auto-crits, up to 10 rounds — most powerful condition item; save for a boss)

**Exit Condition:** Jungle road navigated.
**Next Node →** blacksmith_qtr

---

### NODE 34 — blacksmith_qtr (Blacksmith Quarter — Weimar Approach)
**The industrial quarter below Weimar. Forges. Hammering. A golem blocking the main gate.**

The golem guards the gate to the scholars' quarter. It was built to recognise Ivory Circle tokens. The player doesn't have one — but the Cipher Scrap from Birka, the Atlantis Fragment, and the Abandoned Scholar Pack all have Ivory Circle marks.

**Item Found:** Present all three Ivory Circle items to the golem. It steps aside.

> 🎲 **START BATTLE: Forge Elemental × 1, Animated Armor × 2** *(the secondary gate — a second golem that doesn't recognise the cipher, only force)*
> Win: Inner gate open.
> Lose: Find the maintenance hatch (requires a skill check — DM sets DC). Same outcome.
> 🎲 **END BATTLE**

> 🛏 **SLEEP REQUIRED (Night 7)** — The blacksmith apprentices have a bunkroom. 4gp. They are very loud at 5am. HP restored.

> 💥 **CONDITION ITEMS: Thunderstone & EMP Grenade (Modified)** — Apprentice Dora Flint sells from the forge yard. She throws a Thunderstone at an anvil to demonstrate — the concussive crack rattles the whole quarter. *"Two-second fuse. Don't be inside the ten-foot radius. I learned this the hard way."* Also offers a modified EMP Grenade: *"The Commander's soldiers left the original. I improved the range. Don't ask how."*
> - **Thunderstone** (2 for 8gp) — Condition: **Stunned** (ADV, auto-hit against target, 1 full round; best vs. clusters or difficult solo enemies)
> - **EMP Grenade v2** (8gp) — Condition: **EMP Stunned** upgraded (constructs/androids incapacitated 1 round, improved 20-ft radius; combo with Signal Jammer for 3 full rounds of ADV)

**Exit Condition:** Weimar's lower gate open. Rest taken.
**Next Node →** scholars_qtr

---

### NODE 35 — scholars_qtr (Scholar's Quarter — Weimar)
**The real Weimar. Books. Silence. Very old people.**

**NPC:** Archivus Ptolemy Sweelinck — found in the observatory, exactly as Oracle Kassiphane described. He knows why you are here. He has been writing a letter to nobody for three years that he will now give to you.

**Dialogue (Sweelinck):** *"I wrote that riddle door when I still had good knees. The answer is obvious if you paid attention."*

**The Riddle Door:** What does the Codex protect?
**Answer:** *"The world."* (Or any reasonable synonym — DM's discretion.)
**Item Found:** Shard #7 is behind the door.

> 📖 **FINN'S JOURNAL — Entry 41:** *"Sweelinck calls me 'the fast one.' Affectionately, I think. He showed me the observatory door. He says he won't open it until someone comes who has earned the right. I asked if I'd earned it. He said: 'You found six. Your sibling will find seven.' I didn't tell him I don't have a sibling. He seemed very certain."*
> — **This entry must always be read aloud.** Sweelinck knew the player was coming before Froberger died. The Codex chose its carrier. Froberger believed in the player before the player knew the mission existed.

> 🛏 **SLEEP REQUIRED (Night 8)** — Sweelinck insists on a full night's rest before the final arc. Guest room in the observatory. Free. Warm. Sweelinck leaves a pot of tea.

**EPIC TOKEN RECEIVED — The Weimar Fragment** *(Codex Shard #7)* — held for Act VIII.
**Exit Condition:** Shard #7 secured. Sweelinck's letter to be delivered to Commander Auros. Head to the Agora.
**Next Node →** outhouse (Weimar shortcut)

#### ⚠️ PLANNED — Weimar Scholar Gate Quest Arc (plan.md §XVI, Layer 51)

Two new NPCs added to the WM node area:
- **Archivist Isolde Voss** — controls access to the Lower Archive; quest-giver for Q-WM-01 through Q-WM-03; holds the Froberger revocation record
- **Benedikt Rasp** — ex-Scholar, runs a reading circle; keeper of Froberger's early notes; quest-giver for Q-WM-03 and Q-WM-04

Quest chain: Q-WM-01 "The Revocation Record" → Q-WM-02 "Lower Archive" (3 documents; reveals the First Researcher) → Q-WM-03 "Benedikt's Circle" (3 sessions, day-gated) → Q-WM-04 "The First Researcher" (unredacted personnel file).

Three new Tome items (`type:'tome'`) — passive combat bonuses while held:
- `tome_void_pressure` (Q-WM-02): +1 death save rolls
- `tome_scholar_kings` (Q-WM-03): +2 initiative
- `tome_rasp_annotated` (Benedikt Dear Friend): +1 ATK while any quest active

New monster: `scholars_guard` (medium, AC14/HP45/ATK+5/1d8+3) — drops Scholar Kings' Seal (sell:20).

See plan.md §XVI for full NPC dialogue, quest beats, item shapes, and state flags.

---

### NODE 36 — outhouse (The Observatory Outhouse)
**Behind the observatory. A smell. A door. A portal.**
Sweelinck was not joking. The outhouse behind the observatory does contain a portal. It was installed by an Ivory Circle scholar who hated the mountain road. It leads to the desert — specifically to the desert crossroads — making the route to the Greek Agora two days shorter.

**Item Found:** Portal Key — a hook on the outhouse wall. Turn it left to activate the portal. Turn it right to close it.

**Exit Condition:** Step through.
**Next Node →** greek_agora

---

# ACT VII — THE MYTHIC CIRCUIT
*"The old world remembers what it built."*

> ⏳ **SURVIVAL PRESSURE — DAY 38:** Eleven days remain. Six Shards in hand. The Void is now visible as a bruise in the daytime sky over Birka, seen from the highlands. The mythic circuit is the final stretch before the reckoning. Move with purpose — every detour costs a day the world doesn't have.

---

### NODE 37 — greek_agora (Greek Agora)
**Columns. Heat. The sound of something vast breathing beneath the stones.**

**NPC:** Oracle Kassiphane — in the speaking chamber. Solid gold eyes. Cross-legged. Waiting.

**Dialogue (Kassiphane):** *"You have five Shards. The sixth is in a palace at the edge of the world, guarded by a jade machine that has never lost a fight."*
*(The player has 6 at this point — she sees what they have, not what she expected.)*
*"You have six. Faster than I anticipated. The seventh?"*
*(Player indicates Sweelinck.)*
*"Then you are nearly done. Go to the palace. Then to Birka."*

**EPIC TOKEN RECEIVED — The Olympian Key** *(Codex Shard #6 location revealed)*

> 🧿 **CONDITION ITEM: Basilisk Eye Flask** — Oracle's Voice Tesse points to a sealed alcove off the outer ring. A petrified dog sits near the entrance — it has been stone for decades. *"A Scholar King stored it here. The label says 'last resort.' That seemed appropriately dramatic at the time."* Preserved basilisk ocular extract, three hundred years old. Smash it at battle start for a 10-ft aerosol — Constitution save DC 16. — Condition: **Petrified** (ADV, all hits are auto-crits — **one use only, cannot be resupplied**; best used on the Jade Construct or the Void Warlord)

> 🎲 **START BATTLE: Sphinx × 1, Bronze Automaton × 2** *(Agora outer ring — guardians testing the player before the Oracle will speak)*
> Must pass these before entering the speaking chamber.
> Win: Audience granted immediately.
> Lose: Oracle speaks to you from behind a screen. Same information delivered. "Impressive that you attempted it."
> 🎲 **END BATTLE**

**Exit Condition:** Oracle consulted. Shard #6 location confirmed.
**Next Node →** camelot

---

### NODE 38 — camelot (Camelot — Arthurian Road)
**A legendary place made real — or a real place made legendary. The road splits here.**
The Camelot road connects the Agora route to the oriental palace approach. The castle ruins are occupied by a persistent death knight who challenges all travellers.

> 🎲 **START BATTLE: Death Knight × 1, Black Knight × 1** *(the castle gate — cannot proceed without answering the challenge)*
> Win: Road through the ruins.
> Lose: Yield. The Death Knight accepts honorable defeat. Road opens.
> 🎲 **END BATTLE**

**Item Found:** Knight's Favour — a token from the Death Knight. "Should you require a second in any duel." (Flavor item — gives +1 to next negotiation with any martial NPC.)

**Exit Condition:** Road through Camelot cleared.
**Next Node →** oriental_palace

---

### NODE 39 — oriental_palace (Oriental Dragon Palace)
**The edge of the known world. A palace built on cloud-stone. A jade construct at the gate.**
The Jade Construct has never lost a fight. Oracle Kassiphane confirmed this. She also confirmed it has a weakness: it cannot process simultaneous requests. The Olympian Key, when activated, asks it seven questions at once.

**Item Found:** Use the Olympian Key (single use) at the palace gate. The Jade Construct halts. Inside: a vault. Inside the vault: Shard #6.

> 🎲 **START BATTLE: Jade Construct × 1** *(backup gate guardian — the Olympian Key only stopped the outer one)*
> Win: Vault accessible.
> Lose: Vault accessible (the Construct is a guardian, not an executioner — it stands down after a significant loss of HP, having confirmed you are "worthy of passage").
> 🎲 **END BATTLE**

**Item Found:** Codex Shard #6 — cold, hums, smells faintly of jasmine.

**Exit Condition:** Shard #6 retrieved. Seven shards total in hand. Return to Birka.
**Next Node →** heavenly_clouds

---

### NODE 40 — heavenly_clouds (Heavenly Clouds — The Sky Road)
**There is a road above the world. The Scholar Kings built it. It is the fastest route back.**
The palace has a sky gate — a platform that launches into the cloud road. The cloud road is twelve hours of walking through sky terrain to reach the Birka spire landing.

> 🎲 **START BATTLE: Fallen Seraph × 1, Star Spawn × 2** *(mid-sky road — the Void is bleeding through here already)*
> Win: Road clear. Auros's signal fire visible from the cloud road.
> Lose: Forced down to the arctic pass. Takes 1 extra day. Arctic encounter follows.
> 🎲 **END BATTLE**

**Exit Condition:** Sky road traversed. Birka spire landing reached.
**Next Node →** arctic (if sky road lost) or cosmic_realm (if sky road clear)

---

### NODE 41 — arctic (Arctic Wastes — Detour Only)
**Triggered only if the sky road battle is lost.**
The arctic pass below the cloud road. Cold. White. Efficient.

> 🎲 **START BATTLE: Wendigo × 1, Ice Giant × 1** *(pass junction)*
> Win OR Lose: Both paths arrive at the Birka approach. Lose costs 1 supply.
> 🎲 **END BATTLE**

**Exit Condition:** Pass cleared.
**Next Node →** cosmic_realm

---

# ACT VIII — THE RECKONING
*"The Void is patient. It has time. You do not."*

> ⏳ **SURVIVAL PRESSURE — FINAL DAYS:** The seventh new moon is 1–3 days away. Every node from here is contested. The Void Tide has arrived in full — no more world-worsening previews. The sky over Birka is wrong at noon. The city is too quiet. Commander Auros has been holding the platform for days. Seven Shards in hand. One convergence point. Move.

---

### NODE 42 — cosmic_realm (Cosmic Realm — The Convergence)
**The spire above Birka. The sky turns black at noon. The Void is already here.**

Commander Auros is on the landing platform with a military cordon. She reads Sweelinck's letter. She nods once.

**NPC:** High Commander Seraphine Bruhns — coordinates the final convergence. Holds the platform.

**Item Found:** The Codex Cradle — a seven-slotted reliquary built into the spire wall that Auros's engineers uncovered in the cyberpunk undercity. The Scholar Kings built it here, beneath the city they knew would grow above it.

**The Reforging:**
Insert each Shard in order. The order is told by the Cipher Scrap (from Birka), completed by the Atlantis Fragment, and confirmed by the Sand Cipher.

Order: Trade Seal — Grove Token — Tidal Rune — Crimson Warrant — Sand Cipher — Olympian Key — Weimar Fragment.

Each insertion triggers one encounter.

> 🎲 **START BATTLE: Void Walker × 1 per Shard** *(seven sequential encounters as each Shard is placed — Void entities emerge to stop the reforging)*
> *Shards 1-4: Void Walker × 1 each.*
> *Shard 5: Void Walker × 1 + Star Spawn × 2.*
> *Shard 6: Void Walker × 2 + Death Tyrant × 1.*
> *Shard 7 (final): Void Warlord × 1 — the Void's champion, sent to prevent the final seal.*
> Win (Shard 7): Codex reforged. Void sealed. Done.
> Lose (Shard 7): Auros enters combat alongside you. Combined effort. Codex reforged.
> 🎲 **END BATTLE**

**THE CODEX IS REFORGED.**

The sky clears. The violet cast over Birka fades. The Leviathan in the deep sea sounds once and descends. Somewhere in the forest, a leshen plants a tree over a healed wound in the world.

Sweelinck's letter, read by Auros, contains three lines:
*"The world was the answer. It always was. Tell the adventurer I said well done."*

---

**⚠️ PLANNED — Quest -1: The Open Door** *(plan.md §XIV, Layer 49)*

After the victory screen resolves, if `S_story.level >= 20 && !S_story.questMinusOne`, a Froberger-style scroll (`🔓`) injects into the CO node description with the full Quest -1 text (verbatim in `plan.md §XIV-B`). The scroll explains:
- Level 21 is architecturally undefined — `XP_LEVELS[20]` does not exist
- The source file is readable JavaScript with named data structures
- The MIT License requires no permission to fork
- The mission bit (`S_story.questMinusOne = true; saveStory()`) is set via browser console
- The next quest has no NPC — the player is the NPC now

This injection is a one-time surface per run (not NG+-preserved). It fires only at CO after the Void is sealed. No journal entry. No reward. The console is the last dungeon.

*Implementation note:* Add `questMinusOne: false` to `_S_DEFAULTS()`. Gate in `storyRender()` at CO. See `plan.md §XIV-G` for the 7-step implementation sequence.

---

## QUEST ITEM INDEX

| Item | Where Found | Purpose |
|------|-------------|---------|
| Bloodstained Map | city (Node 1) | Starts quest, shows 7 symbols |
| Merchant Ledger | inn (Node 2) | Points to Tilbury / Muffat |
| Cipher Scrap | tavern (Node 3) | Partial Codex text; used in djinn negotiation |
| Conclave Pass | bar (Node 4) | Entry to Tilbury / Visby |
| Crypt Key | crypt (Node 5) | Opens cyberpunk undercity passage |
| Real Map | storefront (Node 9) | Full 42-node terrain map |
| Fragment Rubbing | market_quarter (Node 8) | Codex cipher, piece 2 |
| Cargo Manifest | merchant_ship (Node 10) | Confirms Draketide location |
| Sea Cave Key | hag_swamp (Node 16) | Opens sea cavern deep entrance |
| Signal Torch | beach (Node 17) | Summons Draketide's skiff |
| Atlantis Fragment | atlantis (Node 20) | Full Codex inscription |
| Scholar King Marker | sea_cavern (Node 21) | Confirms desert route + Izador |
| Abandoned Scholar Pack | monster_cave (Node 28) | One of three Ivory Circle gate items |
| Catacomb Map | catacombs (Node 29) | Underground road network |
| Toll Token | vampire_castle (Node 30) | Safe passage through vampire lands |
| Desert Crossroads Marker | desert (Node 31) | Locates the caravan route |
| Ancient Road Marker | jungle (Node 33) | Confirms Agora approach |
| Portal Key | outhouse (Node 36) | Activates Weimar–desert portal |
| Knight's Favour | camelot (Node 38) | +1 to next martial negotiation |
| Codex Cradle | cosmic_realm (Node 42) | Reforging receptacle |

---

## EPIC TOKEN LOG (CODEX SHARDS)

| # | Token | NPC | Node | Arc |
|---|-------|-----|------|-----|
| 1 | The Trade Seal | Magistra Elara Muffat | docks (Node 7) | Act II |
| 2 | The Grove Token | Brother Aldric | forest (Node 13) | Act III |
| 3 | The Tidal Rune | Captain Selene Draketide | atlantis (Node 20) | Act IV |
| 4 | The Crimson Warrant | Warlord Kael Mordus | goblin_cave (Node 26) | Act V |
| 5 | The Sand Cipher | Sandmage Izador al-Rashun | desert_caravan (Node 32) | Act VI |
| 6 | The Olympian Key | Oracle Kassiphane | greek_agora (Node 37) | Act VII |
| 7 | The Weimar Fragment | Archivus Ptolemy Sweelinck | scholars_qtr (Node 35) | Act VI |

---

## SLEEP LOG (Inn Beats)

| Night | Location | Cost | Node |
|-------|----------|------|------|
| 1 | City inn — Birka | 5gp | Node 2 |
| 2 | Ship berth — Tilbury Star | 3gp | Node 10 |
| 3 | Crone's moss pile — Hag Swamp | free (debt) | Node 16 |
| 4 | River trader's boat | 5gp or free (River Blessing) | Node 22 |
| 5 | Pirate hammock — Pirate Cave | 3gp | Node 27 |
| 6 | Guest room — Vampire Castle | free (unsettling) | Node 30 |
| 7 | Bunkroom — Blacksmith Quarter | 4gp | Node 34 |
| 8 | Observatory guest room — Weimar | free (Sweelinck) | Node 35 |

---

## TERRAIN COVERAGE CHECKLIST

| ✓ | Terrain | Node | Act |
|---|---------|------|-----|
| ✓ | city | 1 | I |
| ✓ | inn | 2 | I |
| ✓ | tavern | 3 | I |
| ✓ | bar | 4 / 25 | I / V |
| ✓ | crypt | 5 | I |
| ✓ | cyberpunk_streets | 6 | I |
| ✓ | docks | 7 | II |
| ✓ | market_quarter | 8 | II |
| ✓ | storefront | 9 | II |
| ✓ | merchant_ship | 10 | II |
| ✓ | alley | 11 | II |
| ✓ | midlands | 12 | III |
| ✓ | forest | 13 | III |
| ✓ | highlands | 14 | III |
| ✓ | swamp | 15 | III |
| ✓ | hag_swamp | 16 | III |
| ✓ | beach | 17 | III |
| ✓ | ocean | 18 | IV |
| ✓ | islands | 19 | IV |
| ✓ | atlantis | 20 | IV |
| ✓ | sea_cavern | 21 | IV |
| ✓ | freshwater_lake | 22 | IV |
| ✓ | deep_sea | 23 | IV |
| ✓ | sewers | 24 | V |
| ✓ | goblin_cave | 26 | V |
| ✓ | pirate_cave | 27 | V |
| ✓ | monster_cave | 28 | V |
| ✓ | catacombs | 29 | V |
| ✓ | vampire_castle | 30 | V |
| ✓ | desert | 31 | VI |
| ✓ | desert_caravan | 32 | VI |
| ✓ | jungle | 33 | VI |
| ✓ | blacksmith_qtr | 34 | VI |
| ✓ | scholars_qtr | 35 | VI |
| ✓ | outhouse | 36 | VI |
| ✓ | greek_agora | 37 | VII |
| ✓ | camelot | 38 | VII |
| ✓ | oriental_palace | 39 | VII |
| ✓ | heavenly_clouds | 40 | VII |
| ✓ | arctic | 41 | VII |
| ✓ | cosmic_realm | 42 | VIII |

---

## CONDITIONS IN PLAY — QUICK REFERENCE

> **How condition items work:** Before a `🎲 START BATTLE`, the player may use one Condition Item to afflict the primary enemy. The enemy enters battle with that condition already applied — player attacks with **ADV** while it persists. One item = one use. DIS conditions (Dodge, Half Cover) are enemy-applied; counter-items listed below negate them.

| # | Condition | Effect | Item | Node Found | Source |
|---|-----------|--------|------|-----------|--------|
| 1 | **Prone** | ADV melee; target uses ½ move to stand | Earthbind Root | 13 (Forest) | Brother Aldric |
| 2 | **Restrained** | ADV; target DIS attacks; speed 0 until Str DC 14 | Crone's Binding Web | 16 (Hag Swamp) | The Crones |
| 3 | **Blinded** | ADV; target DIS attacks; 1 round | Flash Powder | 8 (Market Quarter) | Vendor Mira (5gp/2) |
| 4 | **Paralyzed** | ADV; auto-crit melee 5ft; up to 10 rounds | Neurotoxin Blade Dip | 33 (Jungle) | Herbalist Mael |
| 5 | **Stunned** | ADV; auto-hit; 1 round | Thunderstone | 34 (Blacksmith Qtr) | Dora Flint (8gp/2) |
| 6 | **Grappled** | Speed 0; ADV if cornered; until Str DC 13 | Highland Snare Trap | 14 (Highlands) | Elder Fionn |
| 7 | **Petrified** | ADV; auto-crit; 1 round — **ONE USE ONLY** | Basilisk Eye Flask | 37 (Greek Agora) | Agora ruins (Tesse) |
| 8 | **Jammed** | Group tactics broken; enemy DIS attacks 2 rounds | Signal Jammer | 6 (Cyberpunk) | Defeated Android |
| 9 | **EMP Stunned** | Constructs incapacitated 1 round; ADV | EMP Pulse Grenade | 6 (Cyberpunk) | Commander Auros |
| 9b | **EMP Stunned** | As above, improved range | EMP Grenade v2 | 34 (Blacksmith Qtr) | Dora Flint (8gp) |
| 10 | **Corrupted** | Enemy wastes first action; ADV that round | Void Virus Canister | 26 (Goblin Cave) | Shaman's altar |
| 11 | **Dodge** counter | Negates enemy Dodge — your attacks no longer DIS | Feint Scroll | 18 (Ocean) | Draketide's chart room |
| 12 | **Half Cover** counter | Negates cover; enemy DIS attacks 2 rounds | Smoke Bomb | 7 (Docks) | Dock vendors (3gp) |

**Combo notes:**
- Flash Powder + Smoke Bomb = two-round ADV window against ranged/covered enemy
- EMP Grenade v2 + Signal Jammer = 3 full rounds of ADV vs. any electronic enemy
- Neurotoxin is the most powerful item — save it for a boss; Paralyzed allows auto-crits for up to 10 rounds
- Void Virus Canister: never use within 30ft of a Codex Shard (Void resonance risk)

---

## ENDING SYSTEM (Layers 40–43)

The ending is driven by `_curseScore()` — a measure of how many EB quest givers the player helped, abandoned, or ignored. The score is computed when `storyCheckVictory()` fires after the final boss defeat.

### Curse Score Formula

> **Source:** `_curseScore()`, HTML line 11102.

```
_curseScore():
  For each of 20 EB codes:
    returned (ebReturnDone[code] = true)    → 0
    started but not returned                 → +3
    never started                            → +1
  Bonus: all 20 returned → -5
  Net range: −5 (all 20 returned) to +60 (all 20 started but abandoned)
```

### Covenant Standing Tiers

> **Source:** `COVENANT_STANDING_LABELS`, HTML line 10480.

| Curse Score | Tier | Description |
|---|---|---|
| ≤ −6 | **Covenant Keeper** | "The people you helped are the reason this works." |
| ≤ 0 | **Warden** | "You carry the work with you. It shows." |
| ≤ 7 | **Keeper** | "The seal holds. The cost is visible." |
| ≤ 14 | **Watcher** | "You know what needs doing. You're still learning to stay." |
| > 14 | **Wanderer** | "The Void will open again. Not your fault. Not entirely." |

### Ending Variants

| Condition | Variant | Description |
|---|---|---|
| `!_missionComplete() && curseScore >= 15` | **Cursed Seal Echo** | Groundhog Day text — Sweelinck has seen this 17 times. Mission failed but Void sealed. |
| `_missionComplete() && curseScore <= -6` | **Covenant Keeper** | Full return. Sweelinck names every person the player helped. Epilogue scroll lists them. |
| `_missionComplete() && curseScore <= 0` | **Warden** | Partial returns. Sweelinck acknowledges the work without judgment. |
| Otherwise | **Standard** | Score-based tier; epilogue reflects breadth of engagement. |

**Note:** The `_covenantStanding()` function maps curse score to label using `COVENANT_STANDING_LABELS`. The epilogue scroll (`_buildEpilogueScroll()`) builds a named list of all returned EB NPCs — or substitutes the Cursed Seal Echo text when `!missionComplete && score ≥ 15`.

### Covenant Ceremony

Fires after final boss defeat. Sequence:
1. `_buildEpilogueScroll()` — builds named list of returned EB NPCs
2. SVG sigil animation (covenant seal drawn on screen)
3. `_renderFinalMap()` — map renders with all visited nodes highlighted
4. Victory modal opens with full run stats + `#victory-question` (Sweelinck's Last Question)

### Sweelinck's Last Question (`#victory-question`)

Appended to the victory modal. Variant determined by mission completion + curse score:
- Mission complete + curse ≤ 0: *"Will you come back?"*
- Curse ≤ 0: *"What would you have done differently?"*
- Curse ≥ 15: *"Were you alone by choice?"*
- Otherwise: *"Do you remember their names?"* + named list of known companions

### New Game+ (`storyNewGamePlus()`)

**Preserved across reset:** `npcFavorability`, `pitPerks`, `ngPlusRun` (incremented by 1)  
**Reset:** everything else via `_S_DEFAULTS()` (including saves — `r2h_autosave` and `r2h_checkpoint` wiped from localStorage)  
**Starting kit:** same as new game — Pointy Stick + Flint Dagger + 2× Minor Healing Potion  
**`frobergerNoteNode`:** re-randomized from EB pool on NG+ start  

**"Sweelinck is waiting."** overlay (`#ng-plus-title-overlay`) shows for 2100ms at the moment `storyNewGamePlus()` fires — not on first EB revisit. EB revisit lines are separate (`EB_NG_PLUS_LINES` — see below).

`ngPlusRun` counter increments by 1 per completed run; checked by `NPC_NG_PLUS_GREETINGS` (first NG+ visit per NPC key) and `QUILL_UNFINISHED_SONGS` gating (TV node, `ngPlusRun > 0 && quill Dear Friend`).

#### EB_NG_PLUS_LINES — First-Visit Lines on NG+ EB Return

When `ngPlusRun > 0` and the player re-enters an Epic Battleground node, a one-time ambient line fires after 600 ms. These are the 20 lines (`EB_NG_PLUS_LINES` const, HTML line 10924):

| Code | Line |
|------|------|
| EF | "The black bark again. It's the same." |
| EH | "The figures still walk below. They don't notice you're back." |
| ES | "The altar stones unchanged. The water hasn't moved in centuries. You have." |
| EW | "The smell is the same — older than anything you've faced since." |
| EB | "The hold still moves. Whatever survived last time has had more time." |
| EO | "You remember the shape. It doesn't know that changes anything." |
| EI | "The black rock, the changed stone. It's still here. So are you." |
| EA | "New inscriptions since last time. You weren't gone long enough for that." |
| EC | "The door. It opened once. It didn't reseal easily." |
| EL | "The throne is the same size. It was always this size. You just know that now." |
| ED | "Charybdis doesn't mark time the way you do. It's been waiting regardless." |
| EM | "Nothing grows here. You remember that." |
| EE | "Perfect preservation. It was waiting before. It's still waiting." |
| EV | "The palace exists again. Or still. The distinction isn't meaningful here." |
| EJ | "The light still comes through in columns. The dragon did a careful job." |
| ET | "Three hundred years, and whatever you did shortened it by nothing." |
| ER | "The throne carved from a glacier. The glacier is smaller." |
| EK | "The spire still stands. The Seraph is still falling, in the space between." |
| EP | "Low tide, same as before. He's been guarding it since he died." |
| EG | "Kazrath has been here since before the Codex shattered. This is a very long time." |

#### ⚠️ PLANNED — NG+ Remembrance Layer (plan.md §XV, Layer 50)

When `ngPlusRun >= 1` AND 3+ Dear Friends preserved AND `questMinusOne` was true at NG+ transition:

- **Entry 42 modal** fires on first CI arrival: player writes (or skips) the 42nd journal entry. Saved to `S_story.entry42Text`. Appears in FROBERGER_JOURNAL sidebar as "Entry 42 — Your Hand."
- **NPC_NG_MEMORY_LINES** — second-visit callbacks for each Dear Friend (fav ≥ 2 preserved); fires once per NG+ run per NPC.
- **Quest chain Q-NG-01 through Q-NG-03**: "The Next Froberger" — visit all 6 Dear Friends (Q-NG-01), read Entry 42 from journal (Q-NG-02), complete all 6 Birka quests again (Q-NG-03).
- **CO second scroll** fires after Void sealed if `nextFrobergerComplete = true`: *"The journal has 42 entries now. One of them is yours. This run is the second count."*
- See plan.md §XV for full quest text, state flags, and implementation steps.

---

#### ⚠️ PLANNED — Void Archaeology (plan.md §XVII, Layer 52)

Prerequisites: `ngPlusRun ≥ 1` + `wmFirstResearcherKnown` + `entry42Written`. Without all three, investigation sites are normal nodes.

- **Five investigation sites** — `[INVESTIGATE]` button at CI, DF, WM, SL, MT; first-visit overlay text reveals the Antecedent Containment Protocol pattern.
- **Q-VA-01: "Five Marks"** — visit all five sites; reward: `vaAllMarksFound`.
- **Q-VA-02: "The Constructor's Log"** — WM archive Document 4 (Constructor's Log, 7 entries, written by the First Researcher); reward: `constructor_log` + `void_architect_seal` items.
- **Q-VA-03: "The Sealed Tunnel"** — MT tunnel opened using `void_architect_seal` or `tome_void_pressure`; text chamber; reward: `vaLastWardVisited`.
- **Q-VA-04: "The Architecture"** — Benedikt Rasp (WM) delivers final message; reward: `vaArchitectureKnown` + 500gp.
- **Fifth ending addendum** — if `vaArchitectureKnown` + `entry42Written` + `ngPlusRun ≥ 1`: CO outro appends four-author chain text; Sweelinck question becomes: *"What was inside the cage?"*
- See plan.md §XVII for full Constructor's Log entries, item shapes, state flags, and insertion spec.

---

#### ⚠️ PLANNED — Living World: Junction Vignettes + Road Companion (plan.md §XVIII, Layer 53)

No prerequisites. Two texture layers added to open-world traversal.

- **Junction Vignettes** — J1–J7 junction nodes gain one NPC on first visit: Tessie (J1), Old Faeron (J2), Mira (J3, Act III+), The Cartographer (J4), Wren (J5), empty note (J6, Act VII+), child's toy (J7). Optional `[HELP]` (10gp donation; Curse of Knowledge credit). No quest, no state flags.
- **Road Companion** — one named traveler per act (Acts II–VI) delivers one lore line in the first corridor cell departing a hub node: Dessa (Act II, harbor ledger), Olaf (Act III, Scholar Kings lockout date), Maret (Act IV, Visby west gate), Pilgrim (Act V, MT sealed tunnel), empty road (Act VI). No state tracking.
- See plan.md §XVIII for full NPC dialogue, companion lines, and implementation spec.

---

#### ⚠️ PLANNED — Tilbury Harbor Arc (plan.md §XIX, Layer 54)

Nodes: TL (Tilbury) + SF (Storefront/docks). Two new NPCs, no new terrain monsters needed.

- **Harbor Master Rennau** (SF node) — keeps ledger of missing ships; starts Impartial; Dear Friend after Q-TL-03.
- **Adjutant Vonn** (TL node) — Conclave embargo enforcer; caps at Friendly; never breaks from Conclave position.
- **Q-TL-01: "The Ledger"** — obtain `ship_manifest` (readable item) from docks; `tlLedgerRead`; Rennau Friendly.
- **Q-TL-02: "The Embargo"** — three approaches: report to Muffat (Q65 cross-ref, 200gp), deliver to Birka contact (150gp), or leave it. Sets `tlEmbargoChallenged` or `tlEmbargoDismissed`.
- **Q-TL-03: "The Missing Ship"** — Act IV+ only: Ori (ship survivor) appears at SF; deliver her account to Rennau; `ori_account` readable item; cross-reference to §XII (fishing predators) and §XVI (Isolde Voss named in manifest). Rennau reaches Dear Friend.
- Ship_manifest cross-reference: if `wmFirstResearcherKnown`, an extra line reveals the manifest was consigned to Archivist Isolde Voss eleven months before her Froberger revocation.
- See plan.md §XIX for full NPC dialogue, quest beats, state flags, and insertion spec.

---

#### ⚠️ PLANNED — Visby Underground (plan.md §XX, Layer 55)

Nodes: VS (Visby) + GC (Goblin Caves). One new monster (`hollow_hands_guard`).

- **Debt Agent Solvak** (VS node) — Merchant's Conclave debt collector; has been outside Visby for 6 weeks; starts Impartial; Friendly after Q-VS-01; leaves VS after Q-VS-03.
- **Yva** (GC node) — goblin broker, formerly Mordus-aligned; Hollow Hands mark on her stall; 50gp to talk; Dear Friend after Q-VS-02.
- **Q-VS-01: "The Collector"** — speak to Mordus about 2,000gp weapons debt; `vsDebtProbed`; Solvak Friendly. Cross-reference: if `tlLedgerRead`, Solvak mentions the Harrow.
- **Q-VS-02: "The Broker"** — Yva reveals Hollow Hands diverted the weapons to a Void-aligned shaman; fight `hollow_hands_guard`; obtain `hollow_hands_seal`; `vsWeaponsFound`. Cross-reference: if `tlMissingShipSolved`, Yva confirms the Harrow was not the Hollow Hands.
- **Q-VS-03: "Mordus Pays"** — deliver seal to Solvak; Mordus settles via proxy cache; `vsDebtSettled`; 400gp. Mordus's follow-up sets `vsShamanKnown` — the Void shaman is named as a threat but not confronted.
- New monster: `hollow_hands_guard` (AC13/HP22/ATK+4/1d6+2/low) — Void-marked goblin sub-clan; drops `hollow_hands_seal` (sell:0).
- The shaman is not a character in §XX — they are the shadow. Their arc is Layer 56+.
- See plan.md §XX for full NPC dialogue, quest beats, state flags, monster spec, and insertion spec.

---

#### ⚠️ PLANNED — The Void Shaman: The Antecedent's Last Warden (plan.md §XXI, Layer 56)

Prerequisites: `vsShamanKnown` (§XX) + `vaLastWardVisited` (§XVII). Both required; neither alone triggers the encounter.

- **The Warden** — scripted encounter inside the MT tunnel; AC15/HP65/ATK+6/2d6+4 (rare/boss); drops `warden_token` (relic, sell:0) on any outcome.
- **Combat path** — fight `void_shaman`; Warden accepts defeat without bitterness; Hollow Hands scatter; Mordus regains GC territory; `vshamanDefeated`.
- **Persuasion path** — `[SHOW THEM THE LOG]` if `constructor_log` in inventory; Warden reads Constructor's Log Entry 2 and understands they were working in the wrong direction; gives `warden_token` voluntarily; Hollow Hands return to Mordus peacefully; `vsShamanPersuaded`.
- **Benedikt callback** — if `vsShamanPersuaded` + Benedikt Dear Friend (§XVI): next WM visit adds Benedikt's reflection on the 200-year misunderstanding.
- `void_shaman` monster is scripted only — `spawnsIn: []`, does not appear in random encounters.
- `wardensLegacyKnown` set on either outcome. Hollow Hands arc resolved.
- See plan.md §XXI for full Warden dialogue, both outcome texts, and insertion spec.

---

#### ⚠️ PLANNED — Codex Shard Origin Stories (plan.md §XXII, Layer 57)

No prerequisites. Seven readable items auto-added to inventory when each Codex Shard is collected.

| Shard | Name | Placer | Cross-reference |
|-------|------|--------|----------------|
| 1 | The Toccata Fragment | Elder Couperin (Quill's ancestor) | Quill Dear Friend dialogue |
| 2 | The Prelude Stone | Scholar Marzena (Conclave-adjacent) | §XIX Tilbury arc |
| 3 | The Fugue Seal | Researcher Aldric (unaffiliated) | §XVIII J4 Cartographer |
| 4 | The Cantata Mark | Archivist Hendrika (Scholar Kings defector) | Crimson Warrant choice |
| 5 | The Passacaglia Core | The First Researcher | If `wmFirstResearcherKnown`: name recognized |
| 6 | The Chaconne Piece | The original Warden | If `wardensLegacyKnown`: Warden recognized |
| 7 | The Sarabande Key | Froberger himself | If `entry42Written`: Entry 42 page connection |

Reading all 7 notes from inventory unlocks a FROBERGER_JOURNAL sidebar entry: *"Seven people carried the pieces. Five of them knew what they were carrying."* `shardNotesAllRead` gates SQ dream variant (§XXIII).
See plan.md §XXII for full shard note text and implementation spec.

---

#### ⚠️ PLANNED — Inn Dreams (plan.md §XXIII, Layer 58)

No prerequisites for base dreams. Flag-gated variants replace base when story conditions are met.

- **IN (Birka)** — 3 base variants (city quiet, door-on-door, counting days). Flag-gated: `frobergerLastEntryRead` → Entry 41 dream; `entry42Written` → journal heavier; `vaArchitectureKnown` → four authors.
- **SF (Tilbury)** — 3 base variants (harbor bell, shape in water, harbor board count). Flag-gated: `tlLedgerRead` → Rennau at the board; `tlMissingShipSolved` → Ori goes over the side.
- **IS (Visby)** — 3 base variants (caves counting, mark on wall, patient watcher). Flag-gated: `vsDebtProbed` → Mordus ledger; `vsShamanPersuaded` → counting stops; `wardensLegacyKnown` → mark recognized.
- **SQ (Weimar)** — 3 base variants (pages turning, name at margin, organized archive). Flag-gated: `wmFirstResearcherKnown` → name readable; `vaArchitectureKnown` → Constructor's Log Entry 7; `shardNotesAllRead` → seven handwritings.
- Fires after every rest. Cycle by `gameDay % 3`. No new state flags. No new monsters. No new items.
- See plan.md §XXIII for full dream text and render logic.

---

#### ⚠️ PLANNED — The Pressure Cascade: Visible Void Tide Events (plan.md §XXIV, Layer 59)

`voidPressure` (0–10) becomes visible in the world at three thresholds:

**Threshold 1 — First Crack (voidPressure ≥ 3):**
- One-line flavor text appended to node descriptions at city/wilderness/harbor/scholar nodes.
- Corridor grid: one adjacent `◈` crack cell per node visit (cosmetic, determined by day mod — not random per render).
- Example (Birka cluster): *"The cobblestones are colder than they should be."*

**Threshold 2 — Fracture (voidPressure ≥ 6):**
- Two new void-touched monsters injected into terrain encounter tables: `void_wolf` (dark forest / mountain) and `void_rat_swarm` (alley / sewers).
  - `void_wolf`: AC13/HP28/ATK+5/1d8+3/drop: Void Shard (◈, sell 25)
  - `void_rat_swarm`: AC12/HP18/ATK+4/2d4/drop: Void Shard (◈, sell 15)
- NPC pressure line activates for all 6 Dear Friend NPCs (see world.md §XXIV-F).
- Map header changes to: *"The Void stirs."*

**Threshold 3 — Imminent (voidPressure = 9):**
- One-time modal: "⚠️ THE VOID IS IMMINENT — Pressure 9/10. One more day without the Convergence and the Void breaks through."
- CO gate text augmented with urgency line.
- Mercy window: if shards ≥ 5 at pressure 9, one rest may be taken without pressure increase (`void_mercy_count = 1`). Rest text: *"You sleep fitfully. The Void holds its breath with you."*

**New state flags:** `voidCrackFired`, `voidFracturesFired`, `voidImminentWarned`, `void_mercy_count`.  
**No new quests or nodes.** Extend `lab-report-living-world.md` with appendix note on implementation.

---

#### ⚠️ PLANNED — The Homecoming: Act VIII Farewell Beats (plan.md §XXV, Layer 60)

Six one-time dialogue beats that fire when the player visits each NPC during Act VIII (`actNumber === 8`) with at least Friendly favorability (`fav ≥ 1`). Each fires once per run; reset (not preserved) on NG+. Rendered as a parchment modal (same style as Froberger journal overlays), not as a dialogue quote.

**Beat summary — each NPC's final note:**

| NPC | Node | Theme | Gift |
|-----|------|-------|------|
| Yael | CI | Builds a witness network while player was away; gives truth a vessel | None |
| Brynn | IN | Made too much bread — *"I always do when I'm worried"* | `brynns_loaf` (🍞, heal 8 HP, no sell) |
| Quill | BA | Ledger finally balances; understands Couperin's "just a number" | None |
| Pachelbel | SH | Was composing honestly for the first time; gives the player his unfinished sketch | `pachelbels_sketch` (📄, readable, no mechanical effect) |
| Weckmann | CR | Recognizes the player is a champion — the kind earned out in the world | `champions_tincture` (⚗️, advantage on next attack roll) |
| Auros | BK | *"Be ready. What you bring to it matters."* — the only beat that faces CO, not the past | None |

**New state flags:** `act8FarewellYael`, `act8FarewellBrynn`, `act8FarewellQuill`, `act8FarewellPachelbel`, `act8FarewellWeckmann`, `act8FarewellAuros`.

**No new quests or nodes.** New items: `brynns_loaf` (food/heal), `pachelbels_sketch` (readable), `champions_tincture` (consumable/advantage). See plan.md §XXV for full dialogue text and insertion spec.

---

#### ⚠️ PLANNED — Corelli the Wandering Merchant (plan.md §XXVI, Layer 61)

A new NPC archetype: a vendor-modal NPC who appears at 5 nodes across 5 acts, moving through the world on their own route. Favorability is purchase-gated (not conversation/quest-gated). Former Ivory Circle courier — connects the player's knowledge arc to the suppression of the First Researcher (§XVI/§XVII).

**Five encounters:**

| # | Node | Act | Opener | Unique Item |
|---|------|-----|--------|-------------|
| 1 | TL (Tilbury) | II | *"New in Tilbury? You have the look of someone who hasn't decided if they trust the harbor yet."* | `scholar_ink` (120g) — dismissed scholar's voidPressure notes; hints at §XXIV thresholds |
| 2 | RD (Roadside) | III | *"We meet again. I saw you in Tilbury. I remember everyone I sell to."* | `false_warrant` (200g) — skip one corridor encounter; disabled at voidPressure ≥ 7 |
| 3 | IS (Visby) | V | *"You look like you've been going places. I have too, just different ones."* | `encoded_letter` (80g) — partially decrypted Scholar King order mentioning "the Antecedent's route"; unreadable without Last Cipher |
| 4 | WM (Weimar) | VI | *"The Ivory Circle makes me nervous. I used to work adjacent to them."* | `kings_seal` (350g) — trinket: +1 to one saving throw per short rest |
| 5 | IN (Birka) | VIII | *"End of the road. Or the beginning of one."* | `last_cipher` — auto-given if fav = 3 (Dear Friend); decodes encoded_letter; reveals suppression order and the First Researcher's true work |

**The Revelation (fav = 3, 5th appearance):** Corelli reveals they were an Ivory Circle courier who accidentally read a sealed suppression order for "the Antecedent." Has been quietly redistributing her lost items ever since. Gives `last_cipher`. The cipher's final line (scratched with a nail, not written): *"She built it to save us. They hid it to save themselves."*

**`RD` Roadside node (new):** Minor junction waypoint between Tilbury and Visby. No battle/loot/sleep. Corelli appears here on 2nd encounter; otherwise empty passage.

**New state flags:** `fav_corelli` (int, 0–3), `corelli_purchase_count`, `corelli_encounter_count`, `corelliRevelationDelivered`.  
**Lab report needed before implementation:** `lab-report-corelli-merchant.md` (new vendor-NPC archetype, differs from NPC_DIALOGUES shape).

---

## BIRKA ARC SUMMARY (Layers 41–42)

Six Birka NPCs are fully interactive across all 8 acts. Each has a quest chain, 4 favorability states, and 20 dialogue quotes (5 per state). Favorability persists through New Game+.

| NPC | Node | Intro Quest | Dear Friend Unlock |
|---|---|---|---|
| Yael Scheidemann | CI | `quest_yael_escort` (3 SL vermin clears) | Escort + 5+ visits |
| Brynn Clerambault | IN | `quest_brynn_ledger` (Worn Ledger from SL) | Maintenance + 5+ visits |
| Quill / Couperin | TV | `quest_couperin_lute` (Lute from Pachelbel) | Song received + 5+ visits |
| Pachelbel / Deacon | BA | `quest_pachelbel_goods` (Pigeon route intel) | 15gp tip + 5+ visits |
| Weckmann | CY | `quest_pit_training` (5 pit wins) | Log + 5+ visits |
| Auros / Bruhns | CY | `quest_auros_depths` (Undercity survey) | Depths report + Act V |

At **Dear Friend+** (level 3), joint NPC moments unlock:
- Quill + Brynn at TV: joint ambient moment
- Weckmann + Auros at CY: mid-conversation the player interrupts
- Froberger traces fire (one-time NPC memory of Froberger per Dear Friend NPC)
- Entry 41 reaction lines at IN (Brynn) and SQ (Sweelinck) after `frobergerLastEntryRead`

---

### NPC_DIALOGUES — Full Transcript

> Source: `NPC_DIALOGUES` const in `roll2hit-v3.html` (line 7204). 6 NPCs × 4 states × 5 quotes = 120 lines. Each NPC entry also has a `meta` block with `worldTruth`, `enemy`, and `missionBit`. Dialogue state selection order: `dearFriend` (fav ≥ 2) → `questActive` (active quest) → `friendly` (fav ≥ 1) → `impartial`.

#### Yael Scheidemann — City Guard Captain (CI)
- **worldTruth:** "Every riot that gets suppressed becomes three quiet riots."
- **enemy:** Commissioners who scrub evidence of unrest.
- **missionBit:** `yaelEscortUsed`

**Impartial:**
1. "You — yes, you. Don't walk past me. You're new to Birka and it shows. Stand still for a moment and listen, because I am only going to say this once. Check your MAP. The known world has forty-two nodes and you can get lost in it, badly, fast. Open your QUEST LOG when you arrive somewhere new — quests are not optional, they are how the city tells you what actually matters. Watch your HP. Sleep at the Inn or any rest node before you are desperate; buy potions before you need them, not during. The First Inn is your Hearth — go there when the world gets loud. Pull up your CHARACTER SHEET. You are Level 1. Fighter. Strength carries you into the fight; Constitution keeps you upright afterward. Dexterity is built slowly — there is a fishing dock, if you have patience for a hook and a slow river. Your Charisma is not decoration: half this city speaks coin but listens to character, so talk to vendors, barter, negotiate. You came here to fight demons. You will. Real ones, with claws. But the ones behind your own eyes are older and meaner, and that is the real fight. The friends you make in these streets will not appear in your inventory. They will not show on a score screen because there is no score screen worth reading. There is only the loop — the same day, the same city, the same courier dying at the same crossroads — until you learn what you came here to learn. The loop ends when you decide it does. That is what it means to be a proud adventurer: you do not grind for points. You walk forward for the people beside you. Now get moving. I have a city to keep."
2. "If you see anything that shouldn't be in the Slums, you didn't see me not seeing it either."
3. "Patrol routes don't change without reason. The route changed twice this week."
4. "Skalder's been on that corner eleven years. Nivers, twenty-three. They're the city's memory. I'm the one who reads it."
5. "Three reports filed in the last month. The same report. The commissioners stamp it 'Noted.' Then they note nothing."

**Quest Active:**
1. "Three encounters cleared means the Slums are safe for another week. Possibly two. Thank you."
2. "I can't go in there officially. But you can. Whatever you find — I don't need details."
3. "The vermin aren't the problem. The vermin are a symptom. Clear them anyway."
4. "Four children live on the third alley. Their mother knows your name now. I told her you were reliable."
5. "You're making progress. Skalder noticed. That's the closest to a commendation you'll get around here."

**Friendly:**
1. "Nivers hasn't called in sick in twenty-three years. I asked her once why not. She said: 'The city doesn't get sick days.' I've been thinking about that for four years."
2. "There was a riot in the Lower Crypt district three months ago. I filed the report. The report disappeared. I filed a second one. Still have the copy."
3. "Varga — the information broker near the market — changed his pigeon route again. That's the third time this season. Coins are moving somewhere."
4. "The city talks if you know the language. Most people pass through and hear noise. The noise has a grammar."
5. "I've been here long enough to know which cracks in the wall are load-bearing. The one near the crypt entrance has been growing for two years. Nobody has asked me about it."

**Dear Friend:**
1. "I filed the second report. The one about the Void encroachment in the lower crypt district. The commissioners don't read second reports. I kept a copy. Someone should know it existed."
2. "The grammar of the city includes what people don't say. Skalder hasn't said anything about the eastern alley in three weeks. That alley talks constantly. Something changed."
3. "You know what the hardest part of this job is? The people who leave. You learn the city's grammar through the people in it. Every time someone goes, a word disappears."
4. "I walk the same route every morning. It used to be to see what changed. Now it's also to see what stayed. That's different. I didn't notice when it changed."

---

#### Brynn Clerambault — Innkeeper (IN)
- **worldTruth:** "Safety is a thing people carry in, not a thing rooms provide."
- **enemy:** Merchants who disappear without settling the account — not for the gold, for the not knowing.
- **missionBit:** `brynnsJournalRead`

**Impartial:**
1. "He left this in the room. Paid three nights ahead, didn't sleep the third one."
2. "Two merchants gone last week. Harbormaster Tula would know — she tracks the manifests."
3. "The good room is available. It has a window. Some guests prefer no window. I keep both."
4. "Breakfast is included. The innkeeper before me said breakfast was separate. He had fewer repeat customers."
5. "The journal was in the room. I kept it because it felt like something someone would come asking for."

**Quest Active:**
1. "The ledger has a crease on the third page — that's how I know it's mine. Worn spine, brown cover."
2. "If you find it in the Slums, bring it here first. Before you do anything else with it."
3. "I lent it to a merchant named Rove. He had good credit and bad judgment. The judgment was the problem."
4. "You don't have to explain how you got it. I don't need the story. I just need the ledger."
5. "The pages that matter are 23 through 31. The rest is routine. Those eight pages are not routine."

**Friendly:**
1. "My daughter wrote 'expedition' in her notebook last week. Very hard pencil. She means it."
2. "The inn has been in this building for forty years. The building has been here longer. The stories go with the walls, not the owners."
3. "I know which guests are running from something and which are running toward it. The ones toward something eat better."
4. "She asked about the Void. My daughter. I said: there are people who know more than me, and you should find them. She said: you know one. I said: yes."
5. "Rove came back once, months later. Didn't have the ledger. Didn't explain. Paid his tab in full and left. I appreciated that."

**Dear Friend:**
1. "She came back. My daughter. Three cities in six weeks. She had a notebook full of expedition notes and she asked me to read them." Brynn refills the cup. "I read them twice."
2. "The good room has had forty-seven guests in the last three years. I remember each one. You're the only one who came back more than twice without needing something specific."
3. "Safety is a thing people carry in. I've known that since the first week. Some guests arrive already safe. Some arrive carrying the absence of it. I can't fix the absence but I can make sure the room doesn't add to it."
4. "She asked me if you'd come back. My daughter. I said: I don't know. She said: I think they will. She's been right about these things before."

---

#### Quill (Tomas Couperin) — Unlicensed Bard (TV)
- **worldTruth:** "The best songs are the ones that take three listenings to understand."
- **enemy:** Licensed guild bards who play the same five songs on rotation and call it craft.
- **missionBit:** `couperiSongReceived`

**Impartial:**
1. "Song's old. Older than the city. The words are a lock waiting for a key. Yours for a drink and a silver."
2. "I don't have a guild license. The guild has standards. My standards are different from their standards."
3. "Three chords are sufficient for most human experience. The fourth chord is for the parts most people pretend aren't there."
4. "The bard before me played the same five songs for eleven years. People kept requesting them. I stopped playing requests."
5. "The cipher in the song is real. I didn't put it there. I just learned to play it."

**Quest Active:**
1. "Pachelbel has the lute because I owed him for a bottle. The bottle was poor value. The lute is not. Please retrieve it."
2. "It's tuned to a specific pitch. Don't let him retune it. He will try."
3. "I've been writing something without the lute. It's not the same. You can hear the absence of the right instrument in the silence."
4. "Tell him the tab is settled. I'll get him the coin by end of week. Tell him that specifically."
5. "The lute has a notch on the fourth fret. That's how you'll know it's mine. Pachelbel will claim otherwise."

**Friendly:**
1. "I've been working on something. Not the cipher song. Something I don't have a title for yet. It's about someone who keeps returning."
2. "The guild plays what people already know they like. I play what they'd like if they'd heard it before. It's a distinction that mostly matters to me."
3. "The cipher in the Scholar King's song is a navigational tool. The notes correspond to compass headings. I've been mapping it for six months."
4. "There's a woman who comes in on Tuesdays and cries quietly at the third verse. She has never explained why. I have never asked. Some responses are sufficient."
5. "I play better when someone is listening. Not because I perform differently — I play the same. But the listening makes it real in a different way."

**Dear Friend:**
1. "It's called The Returning Kind. I finished it last Friday. I play it every Friday now." He sets the instrument down. "It's about you. In the sense that the person in the song comes back and the city is still there and that turns out to matter."
2. "The first three listenings to a song are the surface. The fourth is where you hear what the composer didn't know they were saying. I'm on my fourteenth listen of mine. Still finding things."
3. "The guild sent someone to review my license status last month. He stayed for four songs, tipped well, and wrote 'non-compliant but substantial' in his report. I've framed it."
4. "The cipher song ends on a note that resolves to nothing. I used to think that was a flaw. Now I think it's the point. The resolution is something the listener has to supply."

**QUILL_UNFINISHED_SONGS** — 7 ambient snippets visible at TV (S45). Cycle index: `Math.floor(gameDay / 2) % 7`. Click "Ask about it." triggers a full Quill interaction.

| Index | Ambient text |
|-------|-------------|
| 0 | "A strange mode — augmented something. He keeps stopping and restarting." |
| 1 | "Something slow in a minor key. He mouths words but doesn't sing them." |
| 2 | "A quick pattern in a high register. He looks frustrated. Then plays it again." |
| 3 | "A single chord, held. Then a different chord, held. He writes something down." |
| 4 | "Something that sounds almost familiar, then doesn't." |
| 5 | "A two-bar phrase, repeated. He changes one note each time. Very slowly getting somewhere." |
| 6 | "Nothing he'd call a song yet. More like an argument between two intervals." |

---

#### Pachelbel (Deacon) — Fence / Information Broker (BA)
- **worldTruth:** "The difference between a loan and a gift is whether anyone admits which it was."
- **enemy:** Merchants who use credit as a weapon — the kind who extend it to people they know can't repay, then collect the debt as leverage.
- **missionBit:** `pachelbelPaidBack`

**Impartial:**
1. "No names, no receipts, no regrets. Show coin first."
2. "The crypt entrance is in the wall behind the bar. The information is five copper. The location is free because it's not information anymore."
3. "I know what's in most of the packs that come through this district. Knowledge is inventory."
4. "The Conclave Pass is fifteen gold. You could find one cheaper. The cheaper ones get flagged at the second gate."
5. "Three things I don't deal in: people, debts I didn't originate, and that box in the back corner. Ask about it again and we have a problem."

**Quest Active:**
1. "The box is sealed. Don't open it. I haven't opened it. That's the extent of my expertise on its contents."
2. "It came from the crypt district. A scholar courier, two years ago. He said 'hold this' and didn't come back. I've been holding it."
3. "I'm not asking questions about what it is. I'm asking you to take it out of my inventory. Those are different requests."
4. "The seal on it is Ivory Circle. Don't ask me how I know that. I know a lot of seals."
5. "When you find it at the crypt, it will be exactly where I described. I have good sources."

**Friendly:**
1. "Conclave Pass, second inspection gate — half price. You're not carrying anything that would flag it. Direct travel is faster."
2. "I know three people who owe the Conclave significant debts and don't know it yet. That's not a threat. That's context."
3. "The difference between a loan and a gift is whether anyone admits which it was. Most of the transactions in this district are loans that became gifts when nobody was watching."
4. "The lute situation was a miscommunication. Couperin's credit is good. I kept the lute because I thought he'd forgotten. He hadn't."
5. "I don't deal in people. Most fences do, eventually. I decided the margin wasn't worth it about ten years ago. Some decisions make themselves cleaner in retrospect."

**Dear Friend:**
1. "You're going north next, then west — the mountain road. The last person with your expression went the same way. They're in the county records now. I don't keep records. I keep observations."
2. "Rove — the merchant who took Brynn's ledger — owes me a debt that's become a gift at this point. I stopped expecting it. What I didn't stop is remembering the amount. Some things you hold without planning to collect."
3. "The box is with Auros now. Whatever was in it, it was meant for someone who could use it. That's a better outcome than it staying in my back corner for another year."
4. "The difference between knowing things and hoarding things is whether you ever let any of it move. I've been a fence for twenty years. I'm still figuring out which category I'm in."

---

#### Weckmann (Crov) — Pit Master (CY)
- **worldTruth:** "The body tells the truth about who you are when you're tired. Everything else is performance."
- **enemy:** Pit promoters who run fixed fights — not for the money, for the fact that they corrupt the one place where honesty is mandatory.
- **missionBit:** `crovPitTrainingWins`

**Impartial:**
1. "You can train here. First three rounds free. After that I charge for the floor."
2. "The pit is honest. Everything else in this district lies. The pit doesn't know how."
3. "I've seen five hundred fighters. The ones who get good share one thing: they don't argue with the floor when it comes up."
4. "Entry on your own risk. I don't mean that as a disclaimer. I mean it as a description."
5. "If you can't handle losing, the pit will teach you. That's a mercy, not a threat."

**Quest Active:**
1. "Three wins. That's the standard. Not because three is a significant number — because two is too few to see a pattern and four is too many to fake."
2. "Your footwork is the problem. You're treating the pit like a floor you're trying not to fall on. It's a floor you're trying to move across. Different posture."
3. "Win or lose, come back. That's the training. The winning is how you measure the training."
4. "I'm watching the left shoulder. Stop telegraphing. You know you're doing it. Stop."
5. "Two wins. One more. Take your time. The floor will be here."

**Friendly:**
1. "Your footwork is better. Still telegraphing the left shoulder but better. Three more rounds and you'll stop doing that without thinking about it."
2. "I had forty-six fighters. Three of them lasted a decade. You know what they had? They came back when they didn't have to."
3. "The honest version of a fight is one where both people are actually trying. Most fights aren't honest. The pit makes them honest."
4. "Auros came down here twice last month. She doesn't train — she watches. She's looking for something in the way people move when they think no one's measuring them."
5. "The promoters tried to run a fixed fight here last year. I closed the pit for a week rather than host it. Some costs are worth paying to keep the floor honest."

**Dear Friend:**
1. "I've trained forty-six fighters. Three lasted a decade. You know what they had in common? They came back to train when they didn't have to. When the quest was done. When there was no reason except wanting to know if they were still improving." He looks at you. "You're here."
2. "The body tells the truth about who you are when you're tired. Everything else is performance. I've watched you tired. You're better than you think you are when it matters."
3. "You fought drunk once. You still won." He says this without ceremony. "That's not a recommendation. That's an observation. The body knows things the strategy forgets."
4. "Come back when you're done with whatever comes next. The floor will still be honest. That's the thing about the pit — it doesn't care where you've been. It only asks if you're here now."

---

#### Auros (Commander Seraphine Bruhns) — Commander / Scholar King Archivist (CY)
- **worldTruth:** "The infrastructure that keeps cities standing is invisible until it fails."
- **enemy:** The Void — not as metaphor, as specific engineering problem. The Scholar King relay is degrading and no one alive knows the maintenance protocol.
- **missionBit:** `bruhnsDepthsReported`

**Impartial:**
1. "That's a Warrant suppressor. Forty-foot radius. Keep it."
2. "The Scholar Kings built this undercity as a failsafe three hundred years ago. It has been running unattended since."
3. "I've been tracking the Void's encroachment in the lower crypt district for eight months. The Council calls it 'ambient degradation.' They are not correct."
4. "Commander is a title. The work is archivist. I found that out three years ago when I opened the right wall panel."
5. "The signal relay is losing coherence. I don't know the maintenance protocol. The Scholar Kings didn't document it for people who didn't already know."

**Quest Active:**
1. "The corruption node is below the fourth chamber. I can't send anyone down there officially. You're not official."
2. "Two void walkers, possibly three. The node is the problem — clear that and the manifestations stop."
3. "Don't touch the relay architecture. Clear the corruption. Come back."
4. "I'll be at the terminal. When it's done, the relay readings will change. I'll know."
5. "The Council approved my maintenance request six months ago. They approved it in principle. The implementation is still 'under review.' Don't wait for the Council."

**Friendly:**
1. "The undercity predates Birka by three hundred years. The Scholar Kings built it as a secondary relay in case the Cosmic Realm signal degraded." She traces the map. "Someone needs to know this."
2. "I filed a report about the undercity last year. The commissioners don't read infrastructure reports. I filed a second one. I have both copies."
3. "The void intrusion in the lower crypt isn't random. It's finding the gaps in the relay coverage. Whatever built the coverage knew what it was covering against."
4. "Weckmann knows what he's doing. I sent three fighters from the security detail to train with him. They came back better and more honest about what they didn't know. That's the useful outcome."
5. "The relay needs maintenance I'm not qualified to perform. You have to understand something from the Scholar Kings to do it. That's not a metaphor."

**Dear Friend:**
1. "The depth readings are consistent now. Whatever you've been doing in the outer nodes is working." She turns from the terminal. "I filed a report. Included your name in the field observation section. Someone should know it happened."
2. "The Scholar Kings built infrastructure that outlasted them by three centuries. They didn't document the maintenance because they planned to be around to do it. That's the problem with making things that last — you have to also plan for not being there."
3. "I've been here three years. In that time I've filed fourteen reports and received twelve 'Noted' stamps and two genuine responses." She looks at the terminal. "You're the third genuine response."
4. "The relay will hold now. Not indefinitely — nothing holds indefinitely. But long enough. That's all infrastructure ever does: hold long enough for the next person to figure out the rest."

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

## PLANNED QUESTS — DeFi Land & Cat Quarter ⚠️ PLANNED (Layer 46)

> *Not yet in HTML. All entries below are beat-line stubs — no verbatim implementation text. See `plan.md` Sections IX and X for full dialogue and design.*

---

### Q-NEXUS-00 — HM | "The Overheard Conversation" ⚠️ PLANNED
**Trigger:** First visit to HM (Frequency Row); `nexusQuestSeen` flag not set.  
**Player option:** [Listen] — stay quiet, observe.  
**Beat:** Kern and Sable at the bar counter. Kern is citing Chapter 7 of *Don't Create The Torment Nexus* as a helpful blueprint. Sable agrees. They are taking notes. Neither has noticed that the title is a warning.  
**Outcome:** Sets `nexusQuestSeen:true`. Journal entry unlocked (flavor, no combat). No quest started.  
**Reward:** None (story beat only)

---

### Q-NEXUS-01 — HM | "Blueprints" ⚠️ PLANNED
**Trigger:** [Ask] option on first HM visit.  
**Beat:** Player asks what they're building. Kern explains at length. The explanation is very detailed and very wrong about the intent of the source material. Sable nods. The notebook (RAD IDEAS DO NOT READ) is consulted frequently.  
**Key dialogue beats:**
- "Chapter 7 had the most detail." "Very helpful author."
- Kern holds up the notebook. The cover says RAD IDEAS (DO NOT READ). He reads from it.
- Sable: "The warning parts had the most detail, actually." Kern: "Yeah. Really painted a picture."
**Outcome:** Sets `nexusQ01Active`. No combat. [Say nothing] or [Explain what a warning is] — latter branches to Q-NEXUS-02.

---

### Q-NEXUS-02 — HM | "Creative Literacy" ⚠️ PLANNED
**Trigger:** [Warn] option on HM visit, or choosing [Explain what a warning is] from Q-NEXUS-01.  
**Beat:** Player says: *"That book is a warning. Not a manual."*  
**Confrontation arc beats (in order):**
- Kern: "So when the Dark Knight used the city-wide sonar and The Trusted Friend quit…" Sable: "...that was bad."
- Kern: "The author was not impressed by the sonar. The author was concerned about the sonar."
- Sable: "Don't Create The Torment Nexus. The title was also a warning."
- Kern: "The title and the entire book." Sable: "Very consistent messaging."
- Both look at the notebook. Long pause. Kern closes it.
- Kern: "We should probably not build the Torment Nexus." Sable: "Upvote."
**Outcome:** Sets `nexusQ02Complete`. Kern hands player a folded Reddit printout — 2.7K upvotes. He has not read it. He kept it for a reason.  
**Reward:** `creative_literacy_token` (sell:27 — 2,700 upvotes ÷ 100, intentional)

---

## STORY ENGINE — Function Reference (F2 Coverage)

> **CS architecture note:** F2 contains the narrative layer of the engine — NPC dialogue dispatch, journal discovery, EB modal flow, and the ending chain. All F2 functions are synchronous except `_storyEbReturnBeat()`, which fires a `setTimeout` for the quiet receipt. NPC state is stored in `S_story.npcFavorability` (0–3 per key) and `S_story.npcVisitCounts`. Ending variant is determined solely by `_curseScore()` and `_missionComplete()` — no dice, no randomness. `storyNewGamePlus()` is the only function that resets `S_story` while preserving cross-run fields (`npcFavorability`, `pitPerks`, `ngPlusRun`).

---

### FL3 — Epic Battleground Quest Chain

```
MILEPOINT A  Player clicks EB node → _storyEbNpcModal(ebCode) called
             Reads EB_NPC_DIALOGUE[ebCode]: wound/opening/warning rendered to DOM
             paymentFloor displayed; negotiation button shown if paymentCeiling > paymentFloor

MILEPOINT B  Negotiation branch (optional)
             CHA check determines accepted gold (paymentFloor..paymentCeiling)
             Accepted amount written to S_story.ebNegotiatedPayments[ebCode]

MILEPOINT C  Player accepts quest → storyEpicPreBattle(node) called
             EPIC_BOSS_POOL[node.bossKey] loaded; _preBattNode._isEpicBattle = true
             Conditions panel + stealth check rendered (same pre-battle overlay as standard)

MILEPOINT D  [Battle Mode] — epic boss stats from EPIC_BOSS_POOL (AC/HP/ATK/dmg/epicDesc)
             storyApplyOutcome(won) fires on resolution
             Won: defeatedBattles[code] = true; XP + d100 loot drop

MILEPOINT E  Player travels back to EB node → _storyEbReturnBeat(ebCode) fires
             Checks ebReturnDone[ebCode] — idempotent; can only fire once
             Gold paid (negotiated amount if set, else paymentFloor); specialItem from EB_STORY_ITEMS pushed to inventory
             setTimeout(quietReceipt, 800) appends QUIET_RETURN_RECEIPTS[ebCode]

MILEPOINT F  ebReturnDone[ebCode] = true; quest_[code]_return set to 'complete'
             _curseScore() reflects one more completed return (−1 to startedNotReturned bucket)
```

---

### FL7 — NPC Dialogue Priority

```
MILEPOINT A  Player enters node → storyShowNpc(nodeCode) dispatches to _renderNpcCard(key, container)
             Checks NPC_DIALOGUE[nodeCode] (simple) vs. BIRKA_NPC_PROFILES[key] (rich card)

MILEPOINT B  _getNPCDialogue(npcKey) — reads NPC_DIALOGUES[key]; increments npcVisitCounts[key]
             Reads npcFavorability[key]; calls _hasActiveQuestFor(npcKey)
             Priority: fav≥2 → dearFriend pool | hasActiveQuest → questActive pool
                       fav≥1 → friendly pool | else → impartial pool

MILEPOINT C  Act III weight injection (one-time, fav≥1, actNumber≥3)
             Injects NPC_ACT_THREE_LINES[key]; sets actThreeLine_[key] = true to prevent repeat

MILEPOINT D  Froberger trace check — _checkFrobergerTrace(npcKey)
             Fires when: fav≥trace.minFav AND visits≥trace.visitTrigger AND not yet delivered
             One-time; sets frobergerTrace_[key]_delivered = true

MILEPOINT E  Cross-reference injection — NPC_CROSS_REFS[key]
             Eligible cross-refs filtered by fav tier; injected every 3rd visit (count % 3 === 0)
             crossRefIdx_[key] increments per injection; stops at eligible.length

MILEPOINT E2 One-time special injections (checked before pool fallthrough):
             • Brynn Room 6 line: if brynn && brynRoom6Line && !brynRoom6LineDelivered
               → "He didn't say goodbye…" (once; sets brynRoom6LineDelivered = true)
             • S29 Auros/Froberger theory: if bruhns && fav≥2 && frobergerLastEntryRead && !s29LineDelivered
               → "You found his note…" (once; sets s29LineDelivered = true)
             • Couperin debt degradation: if couperin && couperiDebtDegraded && fav === 0
               → injects "The number is a number now…" into impartial pool (persistent, not one-shot)

MILEPOINT F  _renderNpcCard() builds DOM card
             Whiskey reaction: _checkRoughWhiskeyReaction(key) overrides displayQuote if roughWhiskeyActive
             Badge text: 💛 Dear Friend | 🤝 Friendly | 📋 Quest Active | 👤 Impartial

MILEPOINT G  _checkDearFriendUpgrade(key) — fires if fav === 1 and NPC-specific bit is met
             Upgrade conditions per NPC: yael→yaelEscortUsed, brynn→journalEntry7,
             quill→couperiSongReceived, pachelbel→shipment quest complete,
             crov→pitTrainingWins≥3, auros→bruhnsDepthsReported
             On upgrade: npcFavorability[key] = 2; storyMsg fires "says your name" line
```

---

### FL8 — Ending Chain

```
MILEPOINT A  Player at CO with defeatedBattles['CO'] set → storyCheckVictory(node) fires
             Populates victory screen DOM: day/hp/gold/items/quests/level/xp/battles/shards/returns

MILEPOINT B  _missionComplete() — tallies 12 mission bits
             Bits: yaelEscortUsed, journal entry 7 read, couperiSongReceived, pachelbel quest done,
                   pitTrainingWins≥3, bruhnsDepthsReported, ≥5 ebReturnDone, ≥9 journal entries,
                   CO battle won, _lubeckFriends()≥3, _curseScore()<10, CI visited at Lv5+
             Returns true if ≥8 bits are set

MILEPOINT C  _curseScore() computes curse engagement score
             For each of 20 EB codes: started+not_returned → +3 | never started → +1 | returned → 0
             All 20 returned: −5 bonus applied; range roughly −5 to +55

MILEPOINT D  Ending variant selection (4 variants)
             missionDone && curse≤0  → Covenant Keeper ("names" ceremony via _buildSweelinckNamingSequence)
             !missionDone && curse<0 → Standard seal ("the covenant")
             curse≥15                → Groundhog Day / Cursed Seal Echo (Sweelinck's 17-run speech)
             else                    → Standard seal ("there are people still waiting")

MILEPOINT E  True Keeper check (_isTrue)
             Requires: missionDone && curse≤−6 && pitTrainingWins≥5 && ebNegotiatedPayments count≥5
             _covenantStanding() returns COVENANT_STANDING_LABELS entry by curse score bracket

MILEPOINT F  _buildEpilogueScroll() constructs per-NPC scroll
             Cursed Seal override: !missionDone && cs≥15 → returns Groundhog Day static text
             Otherwise: NPC_EPILOGUES[key] by fav tier (3/2/0); EB returns badge if ≥10 returns
             Froberger epilogue appended: covenant / imperfect / efficient based on mc + cs

MILEPOINT G  storyNewGamePlus() — NG+ reset
             Saves: npcFavorability, pitPerks, ngPlusRun counter
             Clears: localStorage autosave + checkpoint; resets S_story via _S_DEFAULTS()
             Restores saved fields; gives starter weapons + 2 Minor Healing Potions
             Randomises S_story.frobergerNoteNode from EB_POOL; renders CI
```

---

### F2 Function Reference Table

| Function | Line | Purpose | Key data read | Key data written |
|----------|------|---------|---------------|-----------------|
| `storyRender(node, prefix)` | 12127 | Master node render — text, items, NPC card, battle chip, map | `NODE_MAP[code]`, `S_story.hp/gold/day` | triggers all sub-renders |
| `storyShowNpc(nodeCode)` | 11376 | Dispatches NPC card for current node | `NPC_DIALOGUE[nodeCode]` | DOM npc-card-name/text |
| `_getNPCDialogue(npcKey)` | 7926 | Priority pool selection + trace/cross-ref injection | `NPC_DIALOGUES[key]`, `npcFavorability`, `npcVisitCounts` | `npcVisitCounts[key]++`, `actThreeLine_[key]`, `crossRefIdx_[key]` |
| `_renderNpcCard(key, container)` | 8007 | Builds NPC card DOM with dialogue + badge + action buttons | `BIRKA_NPC_PROFILES[key]`, `_getNPCDialogue()` result | DOM npc card element |
| `_hasActiveQuestFor(npcKey)` | 7983 | Returns true if player has active quest tied to NPC | `S_story.quests`, hardcoded npcQuests map | none |
| `_checkFrobergerTrace(npcKey)` | 10717 | One-time Froberger memory delivery per NPC | `FROBERGER_TRACES[key]`, `npcFavorability`, `npcVisitCounts` | `frobergerTrace_[key]_delivered = true` |
| `_checkDearFriendUpgrade(key)` | 7908 | Upgrades fav 1→2 when NPC-specific bit is met | `npcFavorability[key]`, NPC-specific S_story bits | `npcFavorability[key] = 2` |
| `storyCheckJournal(node)` | 11358 | Finds Froberger journal entry at node; shows modal or log line | `FROBERGER_JOURNAL`, `journalEntriesRead` | `journalEntriesRead.push(entryNum)`, `frobergerLastEntryRead` |
| `storyJournalToggle()` | 11689 | Opens/closes journal sidebar | DOM state | DOM story-journal-overlay |
| `storyUpdateJournalCount()` | 11714 | Updates journal badge count | `journalEntriesRead.length` | DOM journal-count badge |
| `storyShowFrobergerNote()` | 11090 | Renders parchment note at CO node | DOM froberger-note-overlay | `froberger_last_note_read = true` |
| `_storyEbNpcModal(ebCode)` | 11388 | Renders EB quest-giver modal (wound→opening→warning→negotiate) | `EB_NPC_DIALOGUE[ebCode]`, `EPIC_BOSS_POOL[bossKey]` | `_ebNpcCode`, DOM eb-npc-* elements |
| `_storyEbReturnBeat(ebCode)` | 11503 | Delivers return beat gold + specialItem on quest completion | `EB_NPC_DIALOGUE[ebCode]`, `ebNegotiatedPayments` | `ebReturnDone[ebCode]`, `S_story.gold`, inventory push |
| `storyEpicPreBattle(node)` | 13028 | Sets up pre-battle overlay for EB boss fight | `EPIC_BOSS_POOL[bossKey]`, `defeatedBattles` | `_preBattNode._isEpicBattle = true` |
| `storyShowRoom6()` | 10772 | Renders Room 6 modal (Layer 45) | DOM room6-overlay | DOM |
| `storyShowDeaconCode()` | 10806 | Renders Deacon's Code modal | DOM deacon-code-overlay | DOM |
| `storyShowBrynnLedger()` | 10814 | Renders Brynn's maintenance ledger | DOM brynn-ledger-overlay | DOM |
| `storyShowWeckmannLog()` | 10748 | Renders Weckmann training log (creates overlay dynamically) | `_buildWeckmannLog()` result | DOM weckmann-log-overlay |
| `_buildWeckmannLog()` | 10736 | Constructs Weckmann log text from pitTrainingWins | `S_story.pitTrainingWins`, `playerName`, `WECKMANN_TRAINING_LOG` | returns string |
| `_buildEpilogueScroll()` | 11026 | Constructs per-NPC epilogue scroll for ending | `NPC_EPILOGUES`, `npcFavorability`, `_missionComplete()`, `_curseScore()` | returns string[] |
| `_buildSweelinckNamingSequence()` | 11016 | Builds Sweelinck naming text for Covenant Keeper ending | `SWEELINCK_NAMING_LINES`, `npcFavorability` | returns string[] |
| `storyCheckVictory(node)` | 11116 | Checks win condition; populates victory screen; selects ending text | `defeatedBattles['CO']`, `_missionComplete()`, `_curseScore()` | DOM vic-* elements, endingEl |
| `_covenantStanding()` | 11011 | Returns covenant standing label from score bracket | `COVENANT_STANDING_LABELS`, `_curseScore()` | returns label object |
| `storyPreFinalBattle()` | 10981 | Pre-battle screen for Auros boss fight at CO | `BOSS_COMMANDER_AUROS`, `defeatedBattles` | `_preBattNode` for Auros |
| `storyMsg(txt)` | 11280 | Appends a message line to the node log | txt string | DOM story-log element |
| `_yaelEscortAction()` | 8057 | One-time Yael escort narration at CI; sets yaelEscortUsed | `yaelEscortUsed`, `npcFavorability.yael` | `yaelEscortUsed = true` |
| `storyNewGamePlus()` | 8186 | NG+ reset: preserve npcFavorability + pitPerks, reset all else | `npcFavorability`, `pitPerks`, `ngPlusRun` | full S_story reset + NG+ fields restored |

---

## ⚠️ PLANNED — The Froberger Memorial: A Living Stone at CI (plan.md §XXVIII, Layer 63)

An optional interactive stone at CI. One `[Examine Memorial]` button, two sub-actions ([Leave Flowers] 10gp / [Sign the Book] free). No combat, no quest, no vendor.

**Const:** `FROBERGER_MEMORIAL_TEXT` — object with 4 keys: `base` / `yael_friendly` / `dear_friend` / `post_cipher`. Plaque layers are additive; each appends when its condition is met.

**Plaque text layers:**
- Base: *"FROBERGER / Chronicler of the Road / Walked every corridor in Birka / His notes are still right"*
- Yael Friendly (`fav_yael >= 1`): Yael's inscription — *"He was the one who told me what was happening in the Unbanked Quarter before anyone else would."* — Y.S.
- Dear Friend any NPC (`any fav >= 2`): *"The Ivory Circle formally requested the stone be removed in 1312. The city refused."*
- Post-cipher (`corelliRevelationDelivered`): *"First Contact: F.B. — the chronicler who drew the map before the Circle drew the borders."*

**Memorial book:** 5 pre-written entries (unsigned / B.M. / W. of the Crossroads Forge / two unsigned). Player can [Sign the Book] once — chooses from "For the map." / "The covenant holds." / "The road was worth it." (NG+ adds "Still right."). Flag: `frobergerMemorialBookSigned`.

**[Leave Flowers]:** 10gp, one-time. Sets `frobergerMemorialFlowers = true`. In Act VIII, promotes the flowers town crier line to head of the cycling pool.

**Function:** `storyShowFrobergerMemorial()` — builds plaque text, renders overlay with book and action buttons.

**F2 reference:** Add `storyShowFrobergerMemorial()` row on implementation.

---

## ⚠️ PLANNED — The Pit Championship: Finals at Crossroads Forge (plan.md §XXIX, Layer 64)

One-time championship bout at CR node, triggered when `pitTrainingWins >= 5`. Weckmann offers the match; player faces Ogundimu, the Iron Standard — a retired city champion defined in const `PIT_CHAMPION_OGUNDIMU` (not in MONSTER_POOL). No XP, no gold, no drop.

**Trigger:** First CR visit after `pitTrainingWins >= 5` AND `!pitChampionOffered`. After offer fires, `pitChampionOffered = true`. Player can decline and re-accept via persistent [Challenge for the Title] button at CR.

**Opponent:** AC 16, HP 42, ATK +7, 1d10+4. Tier: elite. Human — no monster mechanics. `isChampion: true` flag used to suppress XP/gold/drop resolution.

**Win:** `pitChampionWon = true`. Weckmann training log gains a final entry ("Fight 6: Ogundimu, the Iron Standard — WIN"). Weckmann `dearFriend` dialogue pool gains one line: *"Ogundimu asked after you, the last time she came through. I told her you'd moved on. She said that was the right answer."*

**§XXV farewell patch:** Weckmann Act VIII farewell branch — `pitChampionWon === false` → *"…the kind earned in the world, not in a pit."* / `pitChampionWon === true` → *"…who earns it in the pit and then earns it again out here."*

**Loss:** Standard checkpoint respawn. [Challenge for the Title] persists. Ogundimu's loss text: *"Different day. Same champion."* — an invitation, not a dismissal.

**New state flags:** `pitChampionOffered` (boolean, default false, NG+-cleared) / `pitChampionWon` (boolean, default false, NG+-cleared).

**F2 reference:** Add rows for `_showPitChampionOffer()`, `_startPitChampionBattle()`, `_onPitChampionWin()`, `_onPitChampionLoss()` on implementation.

---

## ⚠️ PLANNED — The Entry 41 Echo: Brynn and Sweelinck (plan.md §XXX, Layer 65)

Two parallel one-time scenes triggered by `frobergerLastEntryRead === true` (set when Entry 41 is read at CO via `storyCheckJournal()`). Each fires independently on the first visit to its node after the flag is set. State flags `s49BrynnDelivered` and `s49SweelinckDelivered` already exist in `_S_DEFAULTS()`.

**Brynn's scene (IN node, `!s49BrynnDelivered`):** Player hands over the journal. Brynn reads Entry 41 twice (you can tell by the time it takes). She quotes one line — *"Come back"* — and says: *"He was right. They do need the person. Glad you're not done yet."* Sets `s49BrynnDelivered = true`. Const: `S49_BRYNN_SCENE`.

**Sweelinck's scene (SQ node, `!s49SweelinckDelivered`):** Player hands over the journal. Sweelinck reads Entry 41 standing. Closes it carefully. Says: *"He knew the shape of the absence... I'll keep it here. You know where to find me when you're done."* Does not give it back. Sets `s49SweelinckDelivered = true`. Const: `S49_SWEELINCK_SCENE`. Echoes NIGHT_AMBIENT SQ line: *"Sweelinck's lamp is on."*

**Covenant Keeper opening patch:** In `_buildSweelinckNamingSequence()`, if `s49SweelinckDelivered`, replace the standard formal opening with: *"You know where to find me. You found me. Good."* — turning the ending ceremony from a first meeting into a reunion.

**NG+ Sweelinck variant:** Sweelinck's closing line becomes *"Still here. Bring it back when you're done again."* (adds "again").

**Coexistence with §XXV:** If `act8FarewellBrynn` fires before the s49 scene (player reads Entry 41 in Act VIII after visiting IN), both scenes still deliver — farewell first, s49 on the same visit or the next. No conflict.

**F2 reference:** Add s49 trigger logic note to IN and SQ render functions; add `_buildSweelinckNamingSequence()` patch note on implementation.

---

## ⚠️ PLANNED — The Joint Witness and the Map Caption (plan.md §XXXI, Layers 66a+66b)

Two parallel S-suggestion systems. State flags `s54JointMomentDelivered` and `s55MapLineDelivered` already exist in `_S_DEFAULTS()`.

**S54 — Yael and Brynn at CI (Layer 66a):** Fires on first CI visit where `actNumber >= 7` AND `fav_yael >= 1` AND `fav_brynn >= 1` AND `!s54JointMomentDelivered`. Brynn is at the crossroads on a supply run; Yael is already there. The player catches the end of a conversation — *"Still the same light?" / "Still the same light."* — a private exchange about the First Inn light that has been burning all night since Act I. Both then address the player: *"You're later than I expected." / "She means that in the good way."* Sets `s54JointMomentDelivered = true`. Const: `S54_JOINT_MOMENT`. This is the only scene in the game where two Birka Six NPCs share the frame.

**S55 — The Map Caption (Layer 66b):** Fires inside `_renderFinalMap()` during the victory sequence. A single line appears centered below the warmth-tinted map grid at ~3500 ms, fading out with the grid at ~8100 ms. Base text: *"He walked every corridor. So did you. The map remembers."* Conditional variant (if `s49SweelinckDelivered`): *"He walked every corridor. So did you. Sweelinck has the record."* Echoes the Froberger Memorial inscription (§XXVIII). Sets `s55MapLineDelivered = true`. Rendered as `<div id="final-map-caption">` in the victory overlay.

**F2 reference:** Add CI node trigger note for s54; add `_renderFinalMap()` patch note for s55 caption on implementation.

---

## ⚠️ PLANNED — Two Intelligence Feeds: The Varga Watch and the Auros Theory (plan.md §XXXII, Layers 67a+67b)

Two S-suggestion systems. All four flags (`s8VargaWatches`, `s8VargaClueUnlocked`, `s8PachelbelTold`, `s29LineDelivered`) already exist in `_S_DEFAULTS()`.

**S8 — Varga Watch at BA (Layer 67a):** Varga is an Ivory Circle informant at BA who monitors the restricted shelves (Froberger and Void research materials). Three [Observe] clicks at BA across any visits escalate ambient description: watch 1 — *"A clerk at the far table has the same book open to the same page as last time. He isn't reading it."* / watch 2 — *"Today he wrote one line in a small notebook, then put it away immediately."* / watch 3 — pigeon launches north-northeast; `s8VargaClueUnlocked = true`; story log: *"The pigeon flew north-northeast. Pachelbel's district."*

**S8 — Pachelbel tell:** When `s8VargaClueUnlocked && fav_pachelbel >= 1`, [Tell Pachelbel about the pigeon] option appears at SH. Pachelbel: *"That's a forwarding route. The Circle uses them when they don't want a name attached... Was it the Froberger shelf?"* — she doesn't wait for the answer. +15gp; `s8PachelbelTold = true`. Cross-refs: Act I Town Crier line [3] (Varga's informants not showing); `yaelEscortDone` quest line (informants run off north end).

**S29 — Auros Theory at CY (Layer 67b):** Fires on first CY visit where `frobergerLastEntryRead && fav_auros >= 2 && !s29LineDelivered`. Auros reads Entry 41 and decodes it tactically: Froberger's last route covered Void-advance indicator sectors from Year Twelve, walked in the correct sequence. *"'The shape of the absence.' He finally understood — he'd been mapping the negative space of the Void all along... He got to the end of the map. Then the Tide arrived."* Const: `S29_AUROS_THEORY`. Sets `s29LineDelivered = true`.

**Six-system convergence:** S8 + S29 + §XXVIII (Memorial) + §XVII (Void Archaeology) + §XXVI (Corelli) + §XXX (Entry 41 Echo) together form the complete Froberger/Void/Circle intelligence picture. No single system states it explicitly.

**F2 reference:** Add BA observation logic (s8), SH tell option (s8), CY s29 trigger to their respective node render notes on implementation.

---

## ⚠️ PLANNED — The Archive and the Tools: Blue Shutters (S7) and Raison (S46) (plan.md §XXXIII, Layers 68a+68b)

Two S-suggestion systems. Pre-existing flags: `archiveVisited`, `archiveLetterObtained`, `archiveUndercitySurveyTaken`, `raisonToolsUsed`. One new flag: `surveyDeliveredToAuros`.

**S7 — Blue Shutters Archive at CI (Layer 68a):** Three-state button: blocked (Yael letter needed) → Yael writes letter ([Request a letter] when `fav_yael >= 1`; sets letter pending; next CI visit: `archiveLetterObtained = true`) → [Enter the Archive]. Inside: (1) Entry 33 added to journal immediately with archivist footnote: *"Filed under: Void Research / Public / Uncatalogued — per Circle directive 1309-VII. Entry author appears unaware of the correlation. No restriction required."* (2) `archive_letter` item pickup (flavor: *"A partial shelf record. 'Researcher Category: Containment, Date: [REDACTED].' Two archivists. The second stopped mid-sentence."*) — in §XVI (Weimar Scholar Gate), Isolde accepts this in place of 3 Scholar Kings' Seal items. (3) Undercity Survey (Partial) pickup → `archiveUndercitySurveyTaken = true`.

**Survey delivery to Auros (CY):** [Deliver survey] option when `archiveUndercitySurveyTaken && !surveyDeliveredToAuros`. Auros: *"This was taken in Year Ten. Four sectors match my Year Twelve Void-advance indicators. Someone decided it wasn't worth forwarding. +40gp, `surveyDeliveredToAuros = true`. If `s29LineDelivered`: adds *"Froberger walked the same sectors in Year Thirteen. One year after this survey was buried."*

**S46 — Raison's Tools (Layer 68b):** Sold by Pachelbel at BA, Dear Friend tier (fav >= 2), 50gp. Item: `raisons_tools` (usable). Using it: `raisonToolsUsed = true`, +30gp (*"The lens clarifies something you've been carrying."*), second log line: *"The handle has instructions written in tiny letters. Whoever taught Raison to do this was very careful about what not to forget."*

**Pachelbel's Ledger (BA, Dear Friend):** [Read Ledger] button when `fav_pachelbel >= 2`. Const: `PACHELBEL_LEDGER` entries 2 and 3. Entry 2: Raison's arrest at the north gate (*"They called it unauthorized research access... His eldest was brought in for 'evaluation.'"*). Entry 3: younger child escaped south by night (*"Someone had left a boat. I don't know who."*) → Vonn in §XIX (Tilbury, unnamed connection). Pachelbel bought the tools back at impound: *"I don't know what I'm going to do with them."*

**F2 reference:** Add archive overlay render, survey delivery at CY, Pachelbel ledger button, Raison's Tools use-handler on implementation.

---

## ⚠️ PLANNED — The Final Confrontation: Commander Bruhns's CO Scene (plan.md §XXXVII, Layer 72)

**Context:** Commander Seraphine Bruhns (key `'bruhns'` in NPC_DIALOGUES, key `'auros'` in BIRKA_NPC_PROFILES) is the final boss (`BOSS_COMMANDER_AUROS`, AC 22 HP 300). The player has known her as "Auros" at CY throughout the game. After Entry 41 fires read-aloud at CO and `NODE_ARRIVAL_QUOTES.CO` delivers the existing quote, the §XXXVII scene fires before the fight chip.

**Sequence at CO:** Entry 41 read-aloud → existing arrival quote (*"The cordon holds. We have maybe one hour..."*) → §XXXVII fav-gated scene → battle chip → fight → victory.

**fav 1 (Friendly):** *"You got this far. Froberger made it this far too, more than once."* / pause / *"He didn't finish. I need you to finish. So does the city."*

**fav 2 (Dear Friend):** Full Circle/Codex motivation reveal. Bruhns explains: she's held the cordon for 11 years to prevent the Ivory Circle from locking the Codex permanently. The Circle's rules: they can't remove a standing Commander without cause. A Commander defeated in direct engagement loses command legitimately. She has been waiting to be beaten by someone she trusts. *"I'm going to do everything I can to stop you. That's not negotiable. The Circle is watching and I need this to look like I meant it."*

**fav 2 + `s29LineDelivered` (Dear Friend + tactical theory):** Addendum — *"You understood the tactical model. That meant you understood what getting this wrong would cost. Anyone who understood that and still came here — I can trust them to open it."*

**Post-fight:** Existing victory flavor unchanged: *"Commander Bruhns lowers her sword and looks at you the way people look at history."* — lands differently at fav 2 because the player knows she was waiting to lower it.

**Const:** `BRUHNS_CO_SCENE` (keys: friendly, dearFriend, dearFriendWithTheory). **One new flag:** `bruhnsCoSceneDelivered: false`.

**Implementation note:** `undercitySurveyDelivered` (already in HTML ~line 12460) is the correct flag for the survey delivery to Auros — §XXXIII's `surveyDeliveredToAuros` name should be corrected to this on implementation.

**F2 reference:** Patch CO render after NODE_ARRIVAL_QUOTES.CO fires; check `!defeatedBattles['CO'] && !bruhnsCoSceneDelivered`; gate by `_npcFavor('bruhns')`.

---

## ⚠️ PLANNED — Epilogue Integration Layer: Arcs to Scroll (plan.md §XXXVI, Layer 71)

`_buildEpilogueScroll()` patch: after the `FROBERGER_EPILOGUE` push, iterate `ARC_EPILOGUE_CONDITIONS` (14 entries) and push matching lines. These are ADDITIVE — they appear alongside existing `NPC_EPILOGUES` tier lines, not in place of them.

**Arc-to-scroll map (trigger → epilogue line):**
- `defeatedBattles['CF']` → *"Ogundimu offered his hand after. You shook it. He says you were the floor, not the ceiling."*
- `s49BrynnDelivered && s49SweelinckDelivered` → *"Both of them have Entry 41. They don't need to compare notes."*
- `s49SweelinckDelivered only` → *"Sweelinck has the journal. He keeps it at the right height."*
- `s49BrynnDelivered only` → *"Brynn read it twice, quietly. She hasn't needed to mention it."*
- `s54JointMomentDelivered` → *"Brynn and Yael stood in the same light. The light held."*
- `s8PachelbelTold` → *"Pachelbel recognized the route. She hasn't mentioned Varga by name since."*
- `s29LineDelivered` → *"Auros's structural survey and tactical theory were filed together. That's new."*
- `archiveLetterObtained` → *"The archive letter is in Weimar. The footnote is on record."*
- `surveyDeliveredToAuros` → *"Auros has the Year Ten pressure data. She's drafting a unified report."*
- `quillQuestComplete && couperiDebtDegraded` → *"Quill plays 'the one that came back.' The lute is still in tune."*
- `quillQuestComplete && !couperiDebtDegraded` → *"Quill has the lute. He knows what a number means."*
- `brynnLightChoiceMade && brynnLightKept` → *"The lamp is still burning. Brynn checked it this morning."*
- `brynnLightChoiceMade && !brynnLightKept` → *"The lamp burned down quietly. Brynn says it did its work."*
- `brynnKeeperStoryTold && !brynnLightChoiceMade` → *"Brynn kept tending it anyway. It's still burning."*

**No new flags.** Implementation: define `ARC_EPILOGUE_CONDITIONS` const; add 4-line forEach block to `_buildEpilogueScroll()`.

---

## ⚠️ PLANNED — The First Inn Light: Brynn's Vigil Arc (plan.md §XXXV, Layer 70)

**Ambient:** IN node always displays *"A lamp burns in the corner. It has been lit since your first night here."* — no flag, no condition.

**Beat 1 — Inquiry (IN, fav_brynn ≥ 1, Act II+, !brynnKeeperStoryTold):** Option `[Ask Brynn about the lamp in the corner.]` Brynn: *"I lit it the night you arrived. Didn't know if you'd be back by morning, and it seemed wrong to let you come back to a dark room. So I kept it."* Follow-up option `[Why that night?]`: *"I've had guests before. Some didn't come back. I always meant to start a lamp then too. But you were the first time I actually did it."* Sets `brynnKeeperStoryTold = true`.

**Beat 2 — Choice (IN, fav_brynn ≥ 2, brynnKeeperStoryTold, !brynnLightChoiceMade):** Brynn: *"I've been thinking about what happens when you're done... I think it's your lamp as much as it is mine now. What do you want?"* Options: `[Let it keep burning.]` → `brynnLightKept = true`; `[It can rest when I'm done.]` → `brynnLightKept = false`. Both set `brynnLightChoiceMade = true`.

**§XXV farewell four-branch:** `!brynnKeeperStoryTold` → abbreviated story. `!brynnLightChoiceMade` → *"never asked."* `brynnLightKept` → *"still burning, checked this morning."* `!brynnLightKept` → *"I'll tend it until you come back. After that — well. After that."*

**Cross-refs:** §XXXI S54 "Still the same light?" — retroactive context, no §XXXI patch required. §XXVII TC_BRYNN_LAMP crier line fires once when brynnKeeperStoryTold.

**Three new flags:** `brynnKeeperStoryTold`, `brynnLightChoiceMade`, `brynnLightKept` — all add to `_S_DEFAULTS()`.

**F2 reference:** Patch IN node render (lamp ambient), Beat 1 option, Beat 2 option block, §XXV farewell branch, TC_BRYNN_LAMP crier line on implementation.

---

## ⚠️ PLANNED — The Couperin Ledger: Quill's Three-Beat Arc (plan.md §XXXIV, Layer 69)

**Trigger chain:** `quills_lute` item in inventory → Quill at TV → BA Act VIII farewell branch. No new state flags — all three (`couperiSongReceived`, `couperiDebtDegraded`, `quillQuestComplete`) pre-exist in `_S_DEFAULTS()`.

**Beat 1 — Lute Retrieval:** Player visits BA or SH with Pachelbel present (any fav tier). Option appears: *[Ask Pachelbel about Couperin's lute].* Pachelbel hands it over free of charge: *"He already knew someone would come for it."* Adds `quills_lute` (type:'quest') to inventory. Quest log: "Find Quill at the tavern."

**Beat 2 — Couperin's Song (at TV, fav_quill ≥ 1, quills_lute in inventory):** Quill notices the lute — *"Where did you—"* — then plays the family theme. Still in tune after two months. +40gp (the Couperin estate's last line-item pays itself out). Sets `couperiSongReceived = true`, `quillQuestComplete = true`. If `fav_quill < 2`: Dear Friend upgrade. Cross-ref §XXII: the note pattern echoes Shard 1.

**Beat 3 — Debt Degradation (at TV, quillQuestComplete && !couperiDebtDegraded):** Quill's reflection on the debt as just a number. Sets `couperiDebtDegraded = true`. Injects L44-E dialogue into Quill's impartial pool: *"Elder Couperin wrote 'just a number' on the original debt notice. Not minimizing. Describing. A debt that has done its work becomes just a number. That's when you can release it."* Town Crier quillQuestComplete line fires on next inn rest.

**Act VIII BA farewell cross-ref (plan.md §XXIV):** When Quill visits BA to close the Couperin estate ledger physically, if `quillQuestComplete`: Pachelbel adds a quiet line — *"He found the lute, then."*

**F2 reference:** Add QUEST_DB entry, Beat 2 TV render trigger, Beat 1 BA/SH option, Beat 3 TV render trigger, L44-E NPC_DIALOGUES injection, Act VIII BA farewell branch on implementation.

---

## ⚠️ PLANNED — Town Crier: Inn Rest World-News Lines (plan.md §XXVII, Layer 62)

When the player chooses to rest at an inn (`storyConfirmSleep()`), after the standard rest resolution a Town Crier ambient line fires — a single sentence of world-news flavor injected into the story log. No new node, no new NPC, no persistent flag. The line is ephemeral: displayed once, forgotten immediately.

**Priority selector** (`_getTownCrierLine()`): 4-tier cascade, highest wins:
1. **Critical void** — `voidPressure ≥ 9`: 2 lines referencing the Convergence going dark / guild silence
2. **Tension** — `voidPressure ≥ 6`: 3 lines of market fear and strange omens
3. **Quest-flag-specific** — 7 lines keyed to active quest flags (`ebQuestActive`, `corelli_encoded_letter` in inventory, `act8FarewellBrynn` set, etc.)
4. **Act-cycling** — 56 lines (7 per act × 8 acts), selected by `(actNumber - 1) * 7 + lineIdx` where `lineIdx` cycles via `_townCrierIdx++`

**Const:** `TOWN_CRIER_LINES` — object with keys `critical`, `tension`, `questFlag`, `act` (array of 8 arrays × 7 strings). Full content in `plan.md §XXVII`.

**Integration:** `storyConfirmSleep()` calls `_getTownCrierLine()` then `storyMsg('🔔 ' + line)` after the rest HP/gold update. No UI chrome beyond the log line.

**Design notes:** No deduplication between rests (repetition is intentional flavor); no player pronoun; Act VIII lines carry heavier finality tone without spoiling the ending; questFlag lines fire only once (checked and skipped if already fired via a `_townCrierFired[flagKey]` map, cleared on NG+).

**No new state** beyond `_townCrierIdx` (session-only integer, resets to 0 on new game) and `_townCrierFired` (session map). Extend `story.md §F2` with `_getTownCrierLine()` row on implementation.
