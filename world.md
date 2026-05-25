# WORLD BUILDERS REFERENCE
### roll2hit.com — Campaign Setting, NPCs, Conditions & Quest Architecture

> This document covers everything that is not monster stats or terrain descriptions. It is the DM's backstage manual: world history, factions, every named NPC, the 13 condition items and exactly how they enter the story, the survival pressure system, and the motivation architecture that makes the player care about winning.

---

## PART ONE — THE WORLD

### History in Three Lines
Three hundred years ago, seven Scholar Kings sealed the Void behind the **Codex of Seven Seals** at the cost of their lives. They trusted seven successors to hide one Shard each. The successors hid them well — so well that the knowledge of where they were was nearly lost. The Seals are now cracking. No Scholar King remains. Only their students' students' students are left, and one courier, and you.

### The Void
The Void is not evil in the way a monster is evil. It is not motivated. It is the absence of structure — a consuming entropy that unmakes whatever it touches. When it bleeds through, creatures near its edges become corrupted: constructs glitch, organic things rage without cause, undead wake without being summoned. The closer the player gets to the Cosmic Realm, the more the world feels wrong. Shadows fall in the wrong direction. Compasses spin. Animals flee in silence.

The Void does not send an army. It sends **pressure**. Everything that was already dangerous becomes more so.

### The Timeline — Survival Pressure
The Void breaks through completely on the **seventh new moon** from the story's start. That is approximately **49 days**.

| Resource | Cost of Skipping |
|----------|-----------------|
| Skip 2 inn rests (exhaustion cycle) | DIS on next 2 battles AND +1 Void Pressure |
| Void Tide event (days 3/7/14/21/28/35/42) | +1 Void Pressure per event on sleep |
| Void Pressure reaches 10 | **Void Defeat** — the Void has fully breached |
| Day 49 sleep attempt (no 7 shards) | **Time Defeat** — the seventh moon has risen |
| Inn sleep | 2×d10+CON HP (first sleep at node) / 1×d10+CON (revisit); min 50% hpMax; 3 short rests reset; day advances |
| Short rest (at any node) | Heals 25% max HP; 3 uses per day; first short rest at a node earns a **Necklace Token** collectible |

**Void Tide Events** fire at days 3, 7, 14, 21, 28, 35, and 42 — triggered by sleeping on those days. Each adds +1 Void Pressure and shows a world-worsening narrative event. A player who sleeps on all 7 event days accumulates 7 pressure from tides. Three additional exhaustion cycles (2 skipped inns each) push pressure to 10 and trigger Void Defeat.

**Defeat Screens:** Both Time Defeat and Void Defeat show a run summary (level, XP, day, shards, gold, battles won) with only a New Game option — no respawn. Combat death (HP → 0) retains the checkpoint respawn system.

---

### Act I — Birka Starting Area (Nodes CI, IN, TV, BA, CR, CY, SL, DF, HM, GL)

The player begins in Birka. Node CI (City Intersection, #1) is the starting node.

**Node connections from CI (verified against `NODE_MAP`):** N→SL · E→IN · S→CR · W→J1

- **North (SL):** Birka Slums — `city_slums` terrain, Node #51. The Vermin Pit: hunting ground for 12 trivial/easy vermin monsters (rabid dogs, cockroach swarms, a CatNabbing Eagle, etc.). No story battle, no NPC gate. Safest early grinding location. SL connects further north to DF (the defi_land cluster — see below).
- **East (IN):** The First Inn — Innkeeper Brynn, sleep mechanic intro, Froberger's Journal.
- **South (CR):** Birka Crypt — skeletons, Crypt Key. Connects south to CY (Undercity) via Crypt Key gate.
- **West (J1):** Junction node — Midlands Road Fork corridor leading to MI (open plains) and the island interior.

---

### The Defi_Land Cluster — Extended Birka (Nodes DF, HM, GL)

Three `defi_land` nodes north of SL at grid row R03. Reached by going N from SL→N→DF. The cluster is not on any city register. No faction controls it. It predates the current city administration by an unclear amount of time.

**DF — The Unbanked Quarter (Node 72, R03,C16)**
Hub of the cluster. Connects S→SL, E→HM, W→GL.

> *"A district that exists on no city register. No tax collector has ever returned from this block. Hand-lettered signs in cracked windows read NO COIN · NO TRUST · NO THANKS. A shortwave signal repeats on every frequency. Nobody is answering. The rats here are wrong."*

- **NPC:** Grimshaw — unaffiliated, does not explain himself
- **Battle:** NGMI Swarm ×3 + Rug Spider (story battle — clears once won)
- **Loot:** Corrupted Meme Fragment ×2
- **Terrain notes:** The signal Grimshaw references is real. The rats are wrong in a specific way that the game does not elaborate on.

**HM — Frequency Row (Node 73, R03,C17)**
Dead-end east of DF.

> *"Storage units converted into listening posts, each bristling with improvised antenna arrays. Cable runs between them in defiance of physics and permits. A woman sits outside updating a frequency log in a composition notebook. She is on volume forty-one. At the far end of the row, two figures slouch at a jury-rigged bar counter — a ration crate with a neon strip zip-tied to it — taking notes on something with great enthusiasm."*

- **NPC:** Bertha No-Bank — has been logging frequencies since before the Void pressure began; has not found a pattern; is not looking for one
- **Battle:** None
- **Loot:** None
- **Terrain notes:** The composition notebooks are stacked floor-to-ceiling inside the first unit. Volumes 1–40 are unreadable. Volume 41 is in progress.

**[PLANNED — Layer 46]** At the bar counter: **Kern** (mirrored ski goggles, notebook labeled RAD IDEAS DO NOT READ) and **Sable** (t-shirt reading FUTURE PROOF with FUTURE crossed out in marker). Quest trigger Q-NEXUS-00/01/02 — "The Torment Nexus Overture." See `plan.md` Section X for full dialogue and quest design. On visit: player can [Listen], [Ask], or [Warn]. The confrontation arc ("Creative Literacy") rewards `creative_literacy_token` (sell:27 — 2.7K upvotes ÷ 100).

**GL — Old Guard's Corner (Node 74, R03,C15)**
Dead-end west of DF.

> *"Three alleys converge at an improbable angle. A wooden folding chair. A man in it. A laminated sign that says GET OFF. Off of what is not specified. He has outlasted four city administrations, two plagues, and one Void surge without moving."*

- **NPC:** Zeke 'The Signal' — the laminated sign is load-bearing; do not remove it
- **Battle:** None
- **Loot:** None
- **Terrain notes:** The corner predates the alleys. The alleys were built around it. No city engineer has been able to explain the angle.

> **DM note:** The defi_land cluster has no Codex Shard, no inn sleep, no vendor, and no connection to the main quest. It is an optional dead-end district for players who go north past the Slums. The battle at DF is the only mechanical reward. Grimshaw has nothing to say about Froberger, the Void, or the Ivory Circle. Bertha No-Bank has volume 41.

---

### **[PLANNED — Layer 46]** The Cat Quarter (Node CQ, R04,C17)

East of SL (Birka Slums). Not yet in HTML. Full design in `plan.md` Section IX.

**CQ — The Cat Quarter (Node 77, R04,C17)**
Dead-end east of SL. `cat_quarter` terrain.

A sub-district invisible to city records. Entry sign (hand-lettered on a cardboard box): **"RAT PROBLEM. NOT RATS. CATS. WORSE."** The Ally Cat community runs this block through a strict hierarchy — strays at the bottom, Honchos at the top, and the Cat-King rotating through every Taz Devil merge event. Nobody human runs anything here. The cats have opinions about this.

- **NPC:** Jimmy "Two-Tails" Carbonara — orange tabby fixer; speaks like he's been in the business forever; quest-giver for the arc
- **Secondary NPC (unlocks after Q-CAT-01):** Sandy "Scratchpad" Mewlino — tortoiseshell; runs the Fluffy faction; Grease-queen energy
- **Terrain:** `cat_quarter` — 10 cat monsters from Stray to Cat-King
- **Quest chain:** Q-CAT-01 through Q-CAT-06 (Levels 3–5); New York dialect; Goodfellas × Grease Broadway tonal register
- **Cat hierarchy:** Stray → Fluffy → Beefy → Honcho → Taz Devil (Honcho merge) → Cat-King (3× Taz Devil merge)
- **Loot:** Cat-King drops The Don's Signet Ring; vendor chip "Kenickie's Black Market" unlocks after Q-CAT-03

> **DM note:** CQ has no Codex Shard and no connection to the main quest. It is optional Act I content — a full side arc for players who explore east of the Slums before heading to Tilbury. The Corrupted Cat sub-quest ties to DF node Void pressure lore.

---

### Act III Optional Detour — Yugurt Lake (Nodes YL, YC)

Reached by going south from J6 (Western Wilds Crossroads, Node 48) in the Midlands. Not on any quest path. The lake has no Codex Shard, no faction presence, and no road. The hand-painted sign on a stick at the shore says YUGURT. Nobody put it there recently.

**YL — Yugurt Lake (Node 75, R06,C05)**

> *"Mirror-flat water. No wind. No birds. The surface moves once, slowly, then stops. Something very large is in this lake and it knows you are here."*

- **Mechanic:** `isFishingLake:true` — triggers `storyFishing()` instead of a standard encounter
- **No NPC. No sleep. No vendor. No Codex Shard.**
- **Current system (Layer 37):** 2d20 cast roll → fish rank 1–20 → immediate combat. Every cast is a fight.

**YC — Yugurt Cabin (Node 76, R07,C05)**

> *"Smells like wood smoke and fish oil. A lifetime of tackle on the walls. Nets that haven't been cast in years. A rod propped by the door. He is always here in the morning."*

- **NPC:** The Fisherman — present continuously; says *"...Nice Day For Fishing. Yugurt!"* on loop; not to you specifically; not to no one specifically
- **Loot:** Fishing Rod — required to trigger `storyFishing()` at YL
- **Sleep:** Free (sleepCost:0)

> **DM note:** The Fisherman is not a quest-giver in the current build. He is ambient world — a human who made a choice about how to spend his time and is at peace with it. He has no backstory the player can unlock. He has no connection to the Void, Froberger, or the Ivory Circle. He fishes.

**[PLANNED — Layer 47]** Yugurt Lake Fishing Overhaul — Extended Community

Five additional NPCs join The Fisherman at YC for the tournament arc. The Fisherman becomes *Master of Yugurt* — a title with mechanical weight (the hardest tournament opponent, Luck Mod +4). The other five range from Expert Angler to Accounting Department (here on a wellness retreat, deeply out of his depth). Tournament mechanic: 1v1 betting, best-of-1 round, Luck Mod tiebreaker. Full design in `plan.md` §XII.

**[PLANNED — Layer 47]** The Outsider Merchant (Q-BAIT-00 — *"Listen Closely"*)

A one-shot NPC who appears only on the player's first visit to YC. He stands at the cabin door. He is from somewhere else. He does not say where. He delivers a complete mechanical briefing on the fishing system — the bait loop, the three zones, predator conditions, magic weapon drops, and the fact that road monsters now drop junk — then never appears again. His dialogue is the game's only explicit tutorial for the fishing sub-system.

He is not a vendor. He is not a quest-giver in the traditional sense. He speaks in the precise, slightly mechanical cadence of someone reciting from memory — because he is. He memorized the Fishing Guide before he came here. Every tier number, every DC, every warning about Rank 14 is lifted verbatim from a small folded pamphlet he has carried for a long time.

At the end of the briefing he hands the Guide to the player. He no longer needs it.

> *"His name is Yugurt. The lake. Not the man at the cabin. I don't think the man has a name."*
>
> *He holds out the pamphlet. The cover reads:* **YUGURT LAKE — FISHING GUIDE.**
>
> *"You can go now." He leaves before you do.*

**The Fishing Guide** is a permanent readable inventory item. It displays the zone DCs, bait tier table, predator condition summary, and the drop formula — the same text the merchant recited, formatted as a folded pamphlet. While it is in the player's inventory, zone DCs are visible in the fishing modal. Without it, they are hidden.

He does not have a name. The DM should not give him one. The Guide should not have an author line.

The lake itself does not change. The fish are still there. The sign still says YUGURT.

---

## PART TWO — FACTIONS

### The High Council of Birka
**What they want:** Stability. Their city is the hub of everything and they know it.
**What they fear:** The Void making their city uninhabitable — which would end their power entirely.
**Their leverage:** Military force, law, infrastructure. Commander Auros is the only Council member who understands the actual threat.
**Player relationship:** Cautiously supportive. They will not obstruct the player but will not volunteer help either, except through Auros.

### The Merchant's Conclave (Tilbury)
**What they want:** Every trade route open and profitable.
**What they fear:** The Void disrupting the supply chains they've spent decades building.
**Their leverage:** Information networks, harbor access, forged documents, and Magistra Muffat's intelligence apparatus.
**Player relationship:** Transactional at first; genuinely invested once Muffat believes the player is serious.

#### ⚠️ PLANNED — Tilbury Harbor Arc (plan.md §XIX, Layer 54)

Two new named NPCs in the Tilbury harbor district (nodes TL + SF):
- **Harbor Master Rennau** (SF docks) — keeps the ledger of ships that haven't come back; starts Impartial; Dear Friend after Q-TL-03. He has the ledger Road Companion Dessa (§XVIII) references.
- **Adjutant Vonn** (TL adjutant's office) — Conclave embargo enforcer; starts Impartial; caps at Friendly; holds the Conclave's position throughout.

Quest chain Q-TL-01 through Q-TL-03: "The Conclave's Weight"
- Q-TL-01: obtain `ship_manifest` readable item (the *Harrow*, a missing ship carrying Scholar Kings correspondence consigned to Isolde Voss eleven months ago); `tlLedgerRead`.
- Q-TL-02: choose how to handle the harbor embargo — report to Muffat (Q65 cross-ref), deliver to Birka contact, or leave it; sets `tlEmbargoChallenged` or `tlEmbargoDismissed`.
- Q-TL-03: Act IV+ only; Ori (Harrow survivor) appears at SF docks; her account cross-references §XII apex predators if fishing overhaul is implemented; `ori_account` readable item; Rennau reaches Dear Friend.

The `ship_manifest` cross-references §XVI: if `wmFirstResearcherKnown`, the consignee (Isolde Voss) is recognized. No new monsters. Two new readable items. See plan.md §XIX for full dialogue and state flags.

### The Ivory Circle (Weimar)
**What they want:** Knowledge preserved and the world stable enough to keep studying it.
**What they fear:** Sweelinck dying before the Shard is passed on. The Circle is down to one active member.
**Their leverage:** Ancient knowledge, the portal network, the golem gate, Weimar's inaccessibility.
**Player relationship:** Reluctant trust. They will help anyone Sweelinck approves of.

#### ⚠️ PLANNED — Weimar Scholar Gate (plan.md §XVI, Layer 51)

Two new named NPCs within the Weimar lower district — outside the Ivory Circle hierarchy, adjacent to it:
- **Archivist Isolde Voss** — Scholar Kings First Tier; controls gate access; holds Froberger's revocation record; Friendly after Q-WM-02; never reaches Dear Friend in first run
- **Benedikt Rasp** — ex-Scholar, Tier 3 (resigned); runs informal reading circle; starts Friendly; Dear Friend after Q-WM-03; gives `tome_rasp_annotated`

New item category **Tomes** (`type:'tome'`): passive inventory bonuses, unsellable, NG+-persistent. Three tomes available through the Scholar Gate quest chain. Bonus applied by `_applyTomeBonuses()` at battle start.

New monster `scholars_guard` (medium) added to WM-area terrain. Drops Scholar Kings' Seal (sell:20).

Q-WM-04 reveals a "First Researcher" who preceded Froberger — unnamed by the Scholar Kings, documented only in a redacted personnel file that Benedikt can unredact. See plan.md §XVI for full quest chain and state flags.

#### ⚠️ PLANNED — Void Archaeology (plan.md §XVII, Layer 52)

Prerequisites: NG+ run + `wmFirstResearcherKnown` + `entry42Written`.

The First Researcher did not merely study the Void — she built the Antecedent Containment Protocol: a pressure cage designed to hold something she called the Antecedent. The Void Tide is the cage expanding. The CO victory activated the sealing mechanism. Five existing nodes (CI, DF, WM, SL, MT) gain `[INVESTIGATE]` overlays in NG+ that reveal the cage's construction and the First Researcher's identity across a four-quest investigation arc (Q-VA-01 through Q-VA-04).

New items: `void_architect_seal` (type: `relic`, sell: 0) and `constructor_log` (type: `readable`, sell: 0) — both NG+-persistent. No new monsters. No new nodes.

The **Constructor's Log** (7 entries, First Researcher's own words) surfaces as Document 4 in the WM lower archive after all five sites are visited. Benedikt Rasp delivers the final confirmation of the four-author chain: First Researcher → Froberger → Benedikt → player (Entry 42).

See plan.md §XVII for the full Constructor's Log text, investigation site descriptions, state flags, and CO outro addendum.

#### ⚠️ PLANNED — Living World: Junction Vignettes (plan.md §XVIII, Layer 53)

J1–J7 junction nodes gain one first-visit NPC encounter: Tessie (J1), Old Faeron (J2), Mira (J3, Act III+), The Cartographer (J4), Wren (J5, Scholar Kings courier who stopped reading the messages), a pinned note reading *"Paid in full. —S."* (J6, Act VII+), and a child's toy with no explanation (J7). Optional `[HELP]` interaction at J1–J5 (10gp; Curse of Knowledge credit). No state flags, no quests.

**Road Companion** — one named traveler per act section (Acts II–VI) appears in the first corridor cell departing a hub node; delivers one piece of world lore, then is gone. No state tracking. See plan.md §XVIII for full dialogue and implementation spec.

### The Crimson Warrant (Visby)
**What they want:** Visby to remain independent, profitable, and ungoverned by outsiders.
**What they fear:** The Void shaman's influence spreading through the goblin clans — it's already destabilizing Mordus's control.
**Their leverage:** Military strength, labyrinthine territory, and the respect of every bandit between the mountains and the coast.
**Player relationship:** Strictly transactional. Mordus keeps deals. He expects the same.

#### ⚠️ PLANNED — Visby Underground (plan.md §XX, Layer 55)

Two new NPCs and one new monster in the Visby/Goblin Caves area (nodes VS + GC):
- **Debt Agent Solvak** (VS node, outside Crimson Warrant perimeter) — Merchant's Conclave debt collector; has been waiting 6 weeks; starts Impartial; Friendly after Q-VS-01; leaves VS permanently after Q-VS-03.
- **Yva** (GC node, inside caves) — goblin broker, formerly Mordus-aligned; Hollow Hands mark on her stall; 50gp to talk; Dear Friend after Q-VS-02. Cross-reference: if `tlMissingShipSolved` (§XIX), she confirms the Harrow was not the Hollow Hands.

New monster: `hollow_hands_guard` — Void-marked goblin sub-clan (AC13/HP22/ATK+4/1d6+2); drops `hollow_hands_seal` (sell:0). The Hollow Hands broke from Mordus 6 months ago; they are armed with the weapons shipment that Mordus never received (the debt Solvak is collecting).

Quest chain Q-VS-01 through Q-VS-03: "What Mordus Owes"
- Q-VS-01: speak to Mordus about the debt; Mordus's answer is the truth: the weapons never reached him; `vsDebtProbed`. Cross-reference: if `tlLedgerRead` (§XIX), Solvak mentions the Harrow.
- Q-VS-02: Yva reveals the Hollow Hands' Void-aligned shaman; fight `hollow_hands_guard`; obtain `hollow_hands_seal`; `vsWeaponsFound`.
- Q-VS-03: deliver seal to Solvak; Mordus pays via proxy cache; `vsDebtSettled`; 400gp. Mordus's follow-up sets `vsShamanKnown` — the Void shaman exists as a named shadow threat but is not confronted in §XX.

The shaman is Layer 56+ content. §XX names the threat; it does not resolve it. See plan.md §XX for full dialogue, state flags, monster spec, and insertion spec.

#### ⚠️ PLANNED — The Void Shaman: The Antecedent's Last Warden (plan.md §XXI, Layer 56)

Prerequisites: `vsShamanKnown` (§XX) + `vaLastWardVisited` (§XVII). The Warden has been living in the MT tunnel for 6 months.

**The Warden** — the current holder of a goblin title appointed 200 years ago by the First Researcher. She planted a guardian clan (the proto-Hollow Hands) at the Mountain Pass with the mandate: "if the cage starts to fail, open the tunnel." In 200 years of oral retransmission, "open the tunnel to stabilize the cage from inside" became "open the cage." The Warden has been working to release the Antecedent, believing this is what the First Researcher wanted. They are wrong about the direction. The CO victory already activated the sealing mechanism — the Warden has been working toward something that already happened, from the wrong side.

Two outcomes: combat (fight `void_shaman` AC15/HP65) or persuasion (show `constructor_log` from §XVII; Warden reads Entry 2 + Entry 7 and understands). Either way: `wardensLegacyKnown` set, Hollow Hands resolved, `warden_token` relic obtained.

If persuaded: Benedikt Rasp (WM, Dear Friend after §XVI) reflects on the First Researcher planting the Warden without documenting it — *"She thought she was planting a safeguard. She planted a 200-year misunderstanding."*

`void_shaman` monster is scripted only (`spawnsIn: []`). See plan.md §XXI for full dialogue, both outcome texts, and insertion spec.

#### ⚠️ PLANNED — Codex Shard Origin Stories (plan.md §XXII, Layer 57)

Seven readable items auto-added to inventory when each Codex Shard is collected. Each names the person who placed that shard and why. The 7 placers: Elder Couperin (Quill's ancestor), Scholar Marzena (Conclave-adjacent), Researcher Aldric (unaffiliated), Archivist Hendrika (Scholar Kings defector), the First Researcher (Shard 5, MT), the original Warden (Shard 6, WM — recognized if `wardensLegacyKnown`), and Froberger himself (Shard 7, CO — *"I couldn't carry it any further. Someone else will have to finish."*).

Reading all 7 notes unlocks a FROBERGER_JOURNAL sidebar entry. No new monsters, quests, or nodes. See plan.md §XXII for full shard note text.

### The Crones' Covenant (Hag Swamp)
**What they want:** The swamp to remain theirs. The old ways to continue.
**What they fear:** The Void consuming the wet dark places where they draw their power.
**Their leverage:** Ancient magic, the binding web, knowledge of every cursed item in the region, and three hundred years of accumulated debt from people who came to them for favors.
**Player relationship:** Eerily cooperative — they sense the player is important. They help in exchange for the Runed Stone, which feeds their ritual fire.

---

## PART THREE — THE PERSONAL STAKES (Why the Player Cares)

### Froberger
The courier who dies at your feet in Node 1 is not a stranger.

His name is **Froberger**. He is the player's younger sibling — or closest childhood friend, at the DM's discretion. He was brilliant with letters and terrible with swords, so he became a courier for the Ivory Circle's network, running messages between Sweelinck, Muffat, and the other keepers. He had been working on locating the Shards for three years. He was **one Shard away from completing the map** when Void agents — the advance scouts of the Void Warlord — tracked him down in Birka.

The bloodstained map is Froberger's. He made it himself, over three years, one discovered location at a time.

**Froberger's Journal:** Found in the inn pack at Node 2 among his belongings the innkeeper saved. Contains 42 short entries — one per terrain he visited or heard about. The DM may read relevant entries at terrain nodes as discovery moments. Selected entries:

> **Froberger's Journal — Entry 7, The Docks:** *"Magistra Muffat is terrifying in the best way. She handed me the Trade Seal and said 'don't lose it or I'll know.' I believe her. She believes in the Codex. I believe in her."*

> **Froberger's Journal — Entry 14, The Highlands:** *"Elder Fionn's village gave me a horse. I cried a little when I crossed the pass. I don't think they noticed."*

> **Froberger's Journal — Entry 23, The Hag Swamp:** *"The Crones know I'm not you. They kept calling me 'the small one.' They said the real one would come eventually. I said there is no real one. They laughed for a long time."*

> **Froberger's Journal — Entry 31, The Desert Caravan:** *"Izador asked me what the Codex actually protects. I said the world. He said 'that's the answer to a different question.' I've been thinking about it for two days. I still don't know what I got wrong."*

> **Froberger's Journal — Entry 41, Weimar:** *"Sweelinck calls me 'the fast one.' Affectionately, I think. He showed me the observatory door. He says he won't open it until someone comes who has earned the right. I asked if I'd earned it. He said: 'You found six. Your sibling will find seven.' I didn't tell him I don't have a sibling. He seemed very certain."*

**Why this matters for the DM:** Froberger's journal entries give the player emotional grounding in each terrain. They are not mandatory to read aloud — the DM should judge which entries land. The final entry (41) should always be read. It reframes the entire journey: Sweelinck knew the player was coming before Froberger died. The Codex chose.

---

## PART FOUR — ALL NAMED NPCs

### EPIC NPCs (Story Anchors — hold or give Codex Shards)

| Name | Location | Shard | First Appearance |
|------|----------|-------|-----------------|
| Magistra Elara Muffat | Tilbury — docks | #1 Trade Seal | Node 7 |
| Brother Aldric the Unshorn | Forest hermitage | #2 Grove Token | Node 13 |
| Captain Selene Draketide | Islands harbor / aboard ship | #3 Tidal Rune | Node 18 |
| Warlord Kael Mordus | Visby — Broken Tooth Tavern | #4 Crimson Warrant | Node 25 |
| Sandmage Izador al-Rashun | Desert caravan (moving) | #5 Sand Cipher | Node 32 |
| Oracle Kassiphane | Greek Agora — speaking chamber | #6 Olympian Key | Node 37 |
| Archivus Ptolemy Sweelinck | Weimar — Observatory | #7 Weimar Fragment | Node 35 |
| High Commander Seraphine Bruhns | Birka — Cyberpunk undercity | Final anchor | Node 6 |

---

### NON-EPIC NAMED NPCs (Supporting Cast)

---

**Innkeeper Brynn**
- **Location:** City inn, Birka (Node 2)
- **Role:** Information, rest mechanic introduction, Froberger's effects custodian
- **Motivation:** She runs the only inn near the crypt entrance and has seen too many strange things to be surprised. She is protective of her guests in the way of someone who has lost one before.
- **Secret:** She recognized Froberger when he passed through. She saved his journal. She gives it to anyone asking about the courier "as a kindness."
- **Dialogue Hook:** *"He left this in the room. Paid three nights ahead, didn't sleep the third one. I kept it. Felt like someone would come asking."*
- **Notable:** Knows Birka better than any map. Can redirect the player if they seem lost.

---

**Bard Tomas Couperin**
- **Location:** Tavern, Birka lower district (Node 3)
- **Role:** Delivers the Cipher Scrap, ambient world-building
- **Motivation:** Tomas collects songs that are actually ciphers — he doesn't know why some old songs have structure that feels mathematical. He's been collecting for fifteen years.
- **Secret:** He has three complete cipher songs. He's only sold one. The other two may matter in a future campaign.
- **Dialogue Hook:** *"Song's old. Older than the city, older than the Conclave. The melody's simple but the words are a lock waiting for a key. Yours for a drink and a silver."*

---

**City Fence (No-Name)**
- **Location:** Bar back room, Birka (Node 4)
- **Role:** Sells the Conclave Pass; ambient underworld presence
- **Motivation:** Profit. Purely profit. He will sell anything to anyone if the coin is right.
- **Secret:** He also sells information to the Void agents. He doesn't know what they are — he thinks they're just very well-paying clients from out of town.
- **Notable:** If the player is observant, they notice he has two sets of records. DM may flag this as a future complication.

---

**Bruxa Elise Mourne**
- **Location:** Vampire Castle (Node 30) — permanent resident
- **Role:** Toll collector; exchanges Sea Cave Key for passage
- **Motivation:** She has been in the castle for four hundred years. She owns the road. She charges because she can. She is not malicious — she is simply ancient and bored and very precise about her agreements.
- **Secret:** She knows about the Codex. She was alive when the Scholar Kings sealed the Void. She helped them — not out of loyalty but because the Void would have destroyed her castle. She has been waiting for someone to fix the seals ever since.
- **Notable:** If the player shows her the Trade Seal, she upgrades the Toll Token to a **Lifemark** — which gives immunity to vampire charmed condition for the rest of the campaign.
- **Dialogue Hook:** *"Four hundred years. Every thirty, someone walks that road with a map and a purpose. You're the first to have both at the same time."*

---

**Goblin Guide Gritch**
- **Location:** Visby sewers (Node 24) — freelance
- **Role:** Navigation, comic relief, reliable minor ally
- **Motivation:** Gritch has a family of seventeen and charges by the head. He is completely mercenary and completely trustworthy about it.
- **Secret:** He used to be the Void shaman's assistant before the Void visions started. He left because "it smelled wrong." He can give the player a layout of the shaman's chamber if asked.
- **Dialogue Hook:** *"Gritch knows every pipe, every rat, every wrong smell. You smell like someone who does not know where they are going. Gritch knows where you are going. Three gold."*

---

**Elder Fionn**
- **Location:** Dunfall Village, Highlands (Node 14)
- **Role:** Quest giver (kelpie problem), gives Highland Horse
- **Motivation:** His village is dying. People won't fish, won't travel, won't trade. The kelpie has been in the loch for two seasons and three people have drowned.
- **Secret:** One of those three people was his grandson. He has not cried since. He is very quiet about it.
- **Notable:** If the player asks about Froberger, Elder Fionn says: *"Aye, quick lad. Brown satchel. Went south. Asked the same thing about the loch."*

---

**Jungle Herbalist — Mael**
- **Location:** Deep jungle, on the overgrown Scholar Kings' road (Node 33)
- **Role:** Gives the Neurotoxin Blade (Paralyzed condition item)
- **Motivation:** Mael has lived in the jungle for twenty years studying plants no one else will touch. He is perfectly sane and perfectly dangerous.
- **Secret:** He was Izador's student before the desert and jungle had a falling out (metaphorically — Izador was too abstract, Mael too empirical).
- **Dialogue Hook:** *"This compound stops muscle function in organisms above forty kilos. It wears off in about five minutes. I'd suggest using the five minutes productively."*

---

**Draketide's First Mate — Corvin Saltz**
- **Location:** Aboard the *Cerulean Debt* (Nodes 18–23)
- **Role:** Ship operations, night watch, exposition during ocean transit
- **Motivation:** Completely loyal to Draketide. Has been sailing with her for twelve years. Trusts her judgment even when he doesn't understand it.
- **Secret:** He can't swim. Not even a little. He has never told anyone.
- **Dialogue Hook:** *"Cap'n says you're alright. Cap'n's rarely wrong. Don't be the exception."*

---

**Blacksmith Apprentice — Dora Flint**
- **Location:** Blacksmith Quarter, Weimar (Node 34)
- **Role:** Sells the Thunderstone and EMP Grenade; rest facilitation
- **Motivation:** Dora wants to become a full smith but Weimar's Circle doesn't admit tradespeople to their academic structure. She is frustrated and excellent.
- **Secret:** She already understands the Codex construction better than any current Circle member. Sweelinck knows this. He's trying to change the rules.
- **Dialogue Hook:** *"Thunderstone's concussive, range about ten feet, fuse is two seconds. The EMP thing the Commander's soldiers left — I modified it. Better range. Don't ask how."*

---

**Mordus's Lieutenant — Rael**
- **Location:** Broken Tooth Tavern, Visby (Node 25)
- **Role:** Gatekeeper to Mordus
- **Motivation:** Keeps Mordus's operation running. Deeply loyal to the Warrant.
- **Secret:** He had a sister who joined the Ivory Circle. She was the one who first sent Froberger to Visby. The family connection between the factions is a thread the DM can pull.
- **Dialogue Hook:** *"Warrant doesn't deal with the curious. It deals with the useful. Are you useful?"*

---

**Oracle's Voice — Tesse**
- **Location:** Greek Agora upper ring (Node 37), outside the speaking chamber
- **Role:** Translates/announces visitors to Kassiphane; gives Basilisk Eye Flask location
- **Motivation:** She has served the Oracle for thirty years. She is calm about everything and unsettling about nothing.
- **Secret:** She is the Oracle's granddaughter. The gold eyes are hereditary, just not yet fully expressed.
- **Dialogue Hook:** *"She has been expecting a visitor for some time. The guardians at the outer ring will challenge you. She asks that you try to avoid killing them — they are difficult to replace."*

---

## PART FOUR-B — THE BIRKA SIX (Layers 41–45)

These six NPCs are fully implemented with `npcFavorability` states, `NPC_DIALOGUES` pools, and a quest chain each. They persist across NG+. Their favorability is preserved into New Game+.

| NPC | Node | Role | Quest |
|---|---|---|---|
| **Yael** | CI | City watch patrol | `quest_slums_cleanup` — clear vermin from SL; win 3 stalks; reward 80gp |
| **Brynn** | IN | Innkeeper | `quest_brynn_ledger` — find Worn Ledger Book in SL; return to IN; reward: free lodging |
| **Quill (Couperin)** | TV | Bard | `quest_couperin_lute` — retrieve Quill's pawned lute from Pachelbel at BA; reward 40gp |
| **Pachelbel** | BA | Fence | `quest_pachelbel_shipment` — find Sealed Scholar Box in CR crypt; return to BA; reward 60gp |
| **Weckmann** | CY | Pit trainer | `quest_pit_training` — win 3 pit fights at CY → pit perks |
| **Auros / Bruhns** | CY | Commander | `quest_void_below` — defeat Void corruption node at `CY_VOID`; reward: Scholar's Note + EMP Grenade; sets `bruhnsDepthsReported` |

### Favorability States

- **0 Impartial** — default. NPC is present but unengaged.
- **1 Friendly** — quest completed. New dialogue pool. NPC farewell on departure.
- **2 Dear Friend** — enough visits after Friendly. Personal revelations, Froberger traces.
- **3 Dear Friend+** — post-Act IV or NG+. Second-act content, joint NPC moments.

### Key Interactions

**Rough Whiskey** (BA vendor item) — buy and give to Brynn. Triggers one-time drunk pit fight event at CY. `roughWhiskeyUsed` prevents repeat. At Brynn Dear Friend+, a daughter's letter appears at IN (S2).

**Blue Shutters Archive** (CI, gated by Yael letter) — three-state button: blocked → ask Yael → enter. Grants Entry 33, Undercity Survey (Partial) key item. Survey deliverable to Auros at CY.

**Varga at BA** (S8) — three-click observation mechanic. Watch count escalates ambient description. After 3 watches: pigeon-route clue unlocks. Tell Pachelbel → 15gp reward. `s8VargaWatches` tracks progress.

**Weckmann Training Log** — available at CY after Dear Friend. Shows pit fight history. `_buildWeckmannLog()` builds it dynamically. Contains personal combat philosophy.

**Pit Training Perks** (`PIT_PERK_UNLOCKS`, HTML line 10457) — unlocked sequentially by `_checkPitPerkUnlock()` as `pitTrainingWins` accumulates. One perk per win threshold. Five total, in order:

| # | Key | Title | Weckmann's line | Combat effect (`_applyPitPerks`) |
|---|---|---|---|---|
| 1 | `controlledAggression` | Controlled Aggression | "You're not swinging harder. You're swinging when it counts." | `combatState.controlledAggression = true` |
| 2 | `readTheRoom` | Read the Room | "Bruna could tell a fighter's gas tank by the third exchange." | `combatState.readTheRoom = true` |
| 3 | `groundGame` | Ground Game | "When you put them down, keep them down." | `combatState.groundGame = true` |
| 4 | `cornerWork` | Corner Work | "The corner is where you recover. Go to the corner." | `combatState.cornerWork = true` (CY/DK nodes only) |
| 5 | `crovsLesson` | Weckmann's Lesson | "When everything goes wrong — stop, breathe, start again." | `combatState.crovsLesson = true` |

Perks persist through NG+. Character sheet shows "Weckmann's Student" badge when all 5 are held.

**Room 6** — locked room at CY. `storyShowRoom6()`. Available at Weckmann Dear Friend. Contains Froberger's last fighting note.

**Deacon's Code** — `storyShowDeaconCode()`. Available at Pachelbel Dear Friend. Opened via a button at the BA node when fav ≥ 2. Full text (`DEACON_CODE_TEXT` const):

> Pachelbel's Code — posted on the back wall of the salvage front
>
> One. No goods taken by force from people who couldn't refuse.
>
> Two. No goods that would leave a family without means to eat.
>
> Three. Ask once about provenance. Believe the answer. If the answer turns out wrong, that's on the person who lied, not on me. If I had reason to doubt and didn't ask harder, that's on me.
>
> Four. No desperate goods. If someone is selling because they need the coin badly enough to take half price, come back when they don't. If they come back again at half price, ask what's wrong. If they won't say, give them fair price and ask again next time.

**Brynn's Ledger** — `storyShowBrynnLedger()`. Shows maintenance costs and guest records. Contains Froberger's room charge.

**City at Night** (`NIGHT_AMBIENT`) — when `gameDay % 4 >= 2`, each Birka node shows a blue-tinted night ambient paragraph. Different per node.

**Blue Shutters Archive entry** (`archiveVisited`) — set true the first time the player enters the archive (CI, gated by Yael letter). Used by the archive survey quest chain.

**Raison's Tools** (`raisonToolsUsed`) — a key item sold at BA by Pachelbel (Dear Friend tier, 50gp). Using it from inventory sets `raisonToolsUsed = true` and provides a salvage bonus. Raison was Pachelbel's previous fence partner — the tools carry that history. Pachelbel's journal entries 2 and 3 describe what happened to Raison's family afterward.

**S29 — Auros/Froberger theory** (`s29LineDelivered`) — one-time dialogue injection. Fires when the player visits Auros at CY after: (1) Froberger's last journal entry has been read AND (2) Auros is at Dear Friend (fav ≥ 2). Auros connects Froberger's final courier route to the Void advance, explains what the entry means in tactical terms. Fires once; `s29LineDelivered` prevents repeat.

**S49 — Entry 41 delivery** (`s49BrynnDelivered`, `s49SweelinckDelivered`) — two parallel one-time scenes that fire after Froberger's last entry is read. At IN: Brynn reads a line aloud and goes quiet. At SQ: Sweelinck takes the journal, closes it, and doesn't give it back. Each fires independently, once per NPC, on the next visit after `frobergerLastEntryRead = true`.

### Froberger Traces

`FROBERGER_TRACES` — 6 one-time NPC memories of Froberger. Each gated by fav ≥ 2 and sufficient visit count. Delivered via `_checkFrobergerTrace(npcKey)` priority injection in `_getNPCDialogue()`.

#### ⚠️ PLANNED — NPC_NG_MEMORY_LINES (plan.md §XV, Layer 50)

Second-visit callbacks for Dear Friends in qualifying NG+ runs (ngPlusRun ≥ 1, fav ≥ 2 preserved, `questMinusOne` was set). Fires once per NPC per NG+ run (`ngMemoryDelivered[npcKey]`). A separate 6-entry const — not part of `NPC_DIALOGUES`. Each line acknowledges that the player was there before, that something changed, and that the NPC knows it. See plan.md §XV-E for full line text.

### Cross-References

`NPC_CROSS_REFS` — 17 dialogue lines where NPCs mention each other. Injected every 3rd visit at fav ≥ 1. Reveals the pre-existing web of relationships in Birka.

---

## PART FIVE — THE CONDITION ITEMS CODEX

> **How Condition Items Work:**
> Before a `🎲 START BATTLE`, the player may use one Condition Item to afflict the primary enemy with a condition. The enemy enters the battle with that condition already applied. The DM sets the condition on the enemy in the combat tracker, and the player attacks with **ADV** (advantage) while that condition persists. Conditions with duration are marked. One item = one use.
>
> **DIS conditions (Dodge, Half Cover)** are not player-applied — they are enemy-applied against the player. Counter-items are noted for each.

---

### 1. PRONE — **Earthbind Root**

**What it looks like:** A dried grey root, thumb-length, wrapped in moss. Smells of earth after rain.
**Where found:** Brother Aldric gives one to the player at the Forest hermitage (Node 13). He grows them.
**Story context:** Aldric says: *"Throw it at their feet. The root remembers being in the ground. It wants company."* A practical earth-magic he developed for felling deer without arrows.
**How to use:** Throw at the enemy's feet before battle starts (within 30 ft). Root erupts into vines across a 5-ft radius. Target is knocked Prone.
**Condition effect:** Target is Prone. Melee attacks against them have **ADV**. Target must spend half their movement to stand.
**Duration:** Until end of target's next turn (they stand).
**Re-supply:** Aldric will give one more if revisited. Otherwise, not for sale — he only trades them.
**Best used against:** Giants, large beasts, mounted enemies, anything that relies on charging.

---

### 2. RESTRAINED — **Crone's Binding Web**

**What it looks like:** A black ceramic jar sealed with beeswax, about the size of a fist. Smells like nothing at all, which is worse than a bad smell.
**Where found:** Hag Swamp — the Crones give one to the player in exchange for the Runed Stone (Node 16).
**Story context:** Whisper (the eldest Crone) hands it over without ceremony: *"Smash it. The web remembers what it's for."* The jar contains concentrated spider-spirit essence distilled over fifty years.
**How to use:** Smash the jar in the enemy's path before battle (5-ft radius on impact). Web erupts. Target entering the area is Restrained.
**Condition effect:** Target is Restrained. Attack rolls against them have **ADV**. Their attack rolls have DIS. Their speed is 0.
**Duration:** Until they succeed on a Strength check (DC 14) — DM rolls each turn.
**Re-supply:** The Crones will trade another for a "useful secret" — any piece of story information the player has gathered that they don't already know.
**Best used against:** Fast enemies (vampires, draconids, anything that would kite or flee mid-combat).

---

### 3. BLINDED — **Flash Powder**

**What it looks like:** A paper twist of silver-grey powder about the size of a coin. Standard merchant quarter goods.
**Where found:** Market Quarter, Tilbury (Node 8). Vendor Mira sells them 2 for 5gp. She calls them "theatrical powder for stage effects."
**Story context:** The player may or may not immediately recognize the tactical use. Mira says: *"Lords use it for party tricks. Stagehands use it for scene changes. Smart people use it for other things."* A knowing look.
**How to use:** Throw at enemy's face or into their field of vision before battle. Detonates on impact with light.
**Condition effect:** Target is Blinded. Attack rolls against them have **ADV**. Their attack rolls have DIS.
**Duration:** 1 round (or until end of their next turn if they have no action to clear it).
**Re-supply:** Available at most market terrains for 3gp per twist.
**Best used against:** Ranged enemies, guards with line-of-sight coordination, enemies in fortified positions.
**Combo note:** Flash Powder + Smoke Bomb (see Half Cover counter) = two-round ADV window.

---

### 4. PARALYZED — **Jungle Neurotoxin Blade Dip**

**What it looks like:** A small sealed vial of clear liquid. One dip coats a blade or arrowhead.
**Where found:** Jungle (Node 33) — Herbalist Mael gives one to the player who helps clear the road of Arachas webs.
**Story context:** Mael explains the compound clinically: *"It stops voluntary muscle function in organisms over forty kilos for approximately four to six rounds. It works on contact through skin or wound. Do not touch the open vial."*
**How to use:** Apply to a weapon before battle. On the first successful hit, target must make a Constitution save (DC 15, DM rolls). On failure: Paralyzed.
**Condition effect:** Target is Paralyzed — can't move or take actions. Attack rolls against them have **ADV** and all hits from melee within 5ft are automatic critical hits.
**Duration:** 1 minute (10 rounds) or until save is made (repeat each turn, DC 12 after first).
**Re-supply:** Mael will send more via the Ivory Circle mail route if the player leaves a message at Weimar. Takes 3 days.
**Best used against:** Boss-tier enemies, single large threats. The most powerful condition item — save accordingly.

---

### 5. STUNNED — **Thunderstone**

**What it looks like:** A smooth grey stone about the size of an egg. Warm to the touch. A faint vibration.
**Where found:** Blacksmith Quarter, Weimar (Node 34). Dora Flint sells them 2 for 8gp.
**Story context:** Dora: *"Concussive, ten-foot radius, two-second fuse. Hold for one count after you pull the pin. Don't be inside the radius. I learned this the hard way."*
**How to use:** Throw into enemy cluster or at a single target. Detonates on impact or timer.
**Condition effect:** Target is Stunned — can't move, action, or reaction. Attack rolls against them have **ADV** and all hits score automatically.
**Duration:** Until end of their next turn (one full round of stunned).
**Re-supply:** Dora ships them through the blacksmith quarter network. Can be ordered at any forge node.
**Best used against:** Groups of medium enemies; opening a difficult encounter with a free-action window.

---

### 6. GRAPPLED — **Highland Snare Trap**

**What it looks like:** A coiled wire loop with a trigger pin and anchor stake. Fits in a belt pouch.
**Where found:** Dunfall Village, Highlands (Node 14). Elder Fionn gives one as part of the kelpie reward — "in case you meet more water things."
**Story context:** Fionn: *"Ankle or wrist, doesn't matter. Once the wire closes, it tightens with movement. Still is the only way out, and still is hard when something's frightened."*
**How to use:** Set in the enemy's path before battle (takes 1 action to deploy pre-combat). When the enemy walks into it (DM adjudicates based on positioning), triggered.
**Condition effect:** Target is Grappled — speed becomes 0. Attack rolls against them have **ADV** if they have no room to maneuver.
**Duration:** Until they spend an action to free themselves (Strength DC 13, DM rolls).
**Re-supply:** Any blacksmith or hunting supply merchant carries these. Cost: 3gp.
**Best used against:** Fast-moving terrain enemies, creatures that flee or charge, mounted opponents.

---

### 7. PETRIFIED — **Basilisk Eye Flask**

**What it looks like:** A sealed glass flask containing a cloudy amber fluid with something that looks like an iris floating in it. Unsettling.
**Where found:** Greek Agora ruins (Node 37) — in a sealed alcove off the outer ring. Tesse (Oracle's Voice) points the player to it: *"A Scholar King stored it here. The label says 'last resort.' That seemed appropriately dramatic at the time."*
**Story context:** The fluid is preserved basilisk ocular extract — the active compound behind the petrification gaze, rendered inert until aerosolized. It has been waiting three hundred years.
**How to use:** Smash the flask immediately before battle starts. Aerosol cloud in 10-ft radius. Organic targets in range must make a Constitution save (DC 16). On failure: Petrified.
**Condition effect:** Target is Petrified — transformed to stone. Incapacitated. Automatically fails Strength and Dexterity saves. Attack rolls against them have **ADV**. All hits are critical.
**Duration:** Until end of their next turn (magical brevity — full stone is too final for story purposes).
**Re-supply:** One use only. Cannot be re-supplied in this campaign.
**Best used against:** The Jade Construct (Oriental Palace), the Void Warlord opener, or any single devastating enemy that is otherwise near-unbeatable. Treat as a narrative ace in the hole.

---

### 8. JAMMED — **Signal Jammer (Cyberpunk Undercity Device)**

**What it looks like:** A flat black box the size of a deck of cards. One red button. Three small antennae. Recovered from a Corrupted Android in the undercity.
**Where found:** Cyberpunk Streets, Birka (Node 6) — salvaged from the defeated Corrupted Android.
**Story context:** Auros identifies it during the debrief: *"That's a Warrant suppressor — jams coordinated tactical signals in a forty-foot radius. Military grade. Whoever built this undercity wanted control over electronic communications."* She lets the player keep it.
**How to use:** Activate before or at the start of a battle. Any enemy using electronic coordination (androids, cyber constructs, Corrupted entities) loses their group tactics. Their attack rolls have DIS for the first 2 rounds.
**Condition effect:** Target(s) are Jammed — group coordination broken. Enemy attack rolls have DIS. In game terms: the DM plays them as acting independently rather than tactically (no flanking bonuses, no coordinated focus fire).
**Duration:** 2 rounds, then battery depletes.
**Re-supply:** Dora Flint at Weimar can recharge it for 5gp and 1 day's time.
**Best used against:** Cyberpunk Streets encounters, Corrupted Android packs, any enemy with "coordinated" in its description. Useless against organic/non-electronic enemies.

---

### 9. EMP STUNNED — **EMP Pulse Grenade**

**What it looks like:** A dull silver sphere, palm-sized, with a recessed trigger. Carries a static charge that makes nearby hair stand up.
**Where found:** Cyberpunk Streets (Node 6) — Commander Auros provides one from the military cordon's supply before the player leaves Birka: *"In case you find more of whatever built this place."* Also: Dora Flint (Blacksmith Quarter, Node 34) has a modified version with better range.
**Story context:** Auros: *"EMP disrupts any electronic or magnetically-controlled system. Constructs, androids, automated defenses. Anything organic is completely unaffected. Don't waste it on a goblin."*
**How to use:** Detonate at battle start. 20-ft radius.
**Condition effect:** Electronic/construct targets are EMP Stunned — incapacitated for 1 round. Cannot move, act, or react. Attack rolls against them have **ADV**.
**Duration:** 1 round (system reboot).
**Re-supply:** Dora Flint's modified version available once at Weimar (8gp). Original military version: cannot be re-supplied.
**Best used against:** Neon Golem, Corrupted Android clusters, Jade Construct (if Basilisk Flask was saved for elsewhere), cyberpunk-tier enemies.
**Combo note:** EMP Grenade + Signal Jammer = 3 full rounds of ADV against any electronic enemy. Nearly guarantees a clean fight against a difficult mechanical opponent.

---

### 10. CORRUPTED — **Void Virus Canister**

**What it looks like:** A cracked glass cylinder sealed with void-black resin. The contents move slightly even when the cylinder is still.
**Where found:** Goblin Cave (Node 26) — recovered from the Void shaman's altar after his defeat. Mordus won't touch it. The player takes it.
**Story context:** The shaman was using Void corruption to scramble the goblin clan's decision-making — they would fight each other rather than resist him. The canister concentrates this effect into a deployable gas.
**How to use:** Smash or puncture the canister immediately before battle. 15-ft gas cloud, persists 1 round.
**Condition effect:** Organic enemies in range are Corrupted — their memory of the immediate situation scrambles. Their first action on their first turn is wasted (they act against a hallucinated target, DM narrates). Attack rolls against them have **ADV** during the corruption round.
**Duration:** 1 round of active effect, but some enemies may continue to act irrationally at DM's discretion.
**Re-supply:** Cannot be re-supplied. The Void is not a vendor.
**Warning:** Auros strongly recommends against using this item near any Codex Shard — the Void resonance could interfere with the Shard's seal. Do not use in the Cosmic Realm final sequence.
**Best used against:** Humanoid enemy groups (bandits, cultists, goblin reinforcements), large organic monsters that rely on pattern behavior.

---

### 11. DODGE (Enemy buff — opponent evading, gives player DIS)
**Counter-item: Feint Scroll**

**What it looks like:** A small scroll in a bone tube. Text is in Scholar Kings' notation.
**Where found:** Aboard the *Cerulean Debt*, Draketide's chart room (Node 18). Among the Atlantis fragments she's been collecting, found in a sealed tube.
**Story context:** Draketide: *"Never learned to read it. Something to do with misdirection — the Oracle's Voice told me that when she came aboard three years ago."* The scroll contains a formalized feint — a half-second of false movement that forces a dodging opponent out of defensive stance.
**How to use:** Read the scroll at battle start (uses your action). Until end of your next turn, any enemy in Dodge stance loses the condition — your attack rolls against them are normal (not DIS).
**When is Dodge encountered in the story?**
- **Vampire Castle (Node 30):** Bruxa Elise Mourne uses Dodge when retreating during her guardian challenge.
- **Oriental Palace (Node 39):** Jade Construct uses a dodge protocol when below half HP.
- **Heavenly Clouds (Node 40):** Fallen Seraph enters Dodge when flanked.
**Re-supply:** Single use. The scroll crumbles after reading. Cannot be replaced.

---

### 12. HALF COVER (Enemy buff — opponent behind cover, gives player DIS)
**Counter-item: Smoke Bomb**

**What it looks like:** A small ceramic ball, ash-grey, that releases dense white smoke on impact.
**Where found:** Docks, Tilbury (Node 7). Standard harbor goods — used for ship-to-ship signaling and fire suppression. 3gp each from any dock vendor.
**Story context:** The player observes dockworkers using them for fire drills. The tactical application is obvious: smoke fills cover positions, forcing enemies to break cover or fight blind.
**How to use:** Throw into the enemy's cover position before or at battle start. 20-ft smoke radius, persists 2 rounds.
**Condition effect:** Enemies in Half Cover have their cover negated — the cover is now obscured, they cannot effectively use it, and their attack rolls have DIS (they are shooting blind through smoke). The player's attacks against them no longer have DIS from cover.
**When is Half Cover encountered in the story?**
- **Goblin Cave (Node 26):** Goblins fire from behind crates and stone formations — classic Half Cover.
- **Camelot (Node 38):** Black Knight fights from behind castle ruin walls.
- **Pirate Cave (Node 27):** Pirates use barrel-stacks as fortified firing positions.
**Re-supply:** Available at any dock, market, or mercenary supply node. 3gp each.

---

### 13. PETRIFIED (via STUNNED before battle — already covered above)
See item 7 (Basilisk Eye Flask) and item 5 (Thunderstone) above.

---

## PART SIX — CONDITION ITEM STORY INTRODUCTION MAP

The following table shows **when each condition mechanic is first introduced as a story beat**, what triggers the discovery, and the dialogue moment that teaches the player the mechanic exists.

| Condition | Item | Node Introduced | Trigger Moment |
|-----------|------|----------------|----------------|
| **Prone** | Earthbind Root | 13 — Forest (Aldric) | Aldric demonstrates it on a tree stump before giving it to the player |
| **Restrained** | Binding Web | 16 — Hag Swamp (Crones) | Whisper demonstrates it on a passing rat "for scale" |
| **Blinded** | Flash Powder | 8 — Market Quarter | Vendor Mira tosses one at a seagull, which flaps away confused |
| **Paralyzed** | Neurotoxin Dip | 33 — Jungle (Mael) | Mael touches a spider with a dipped twig; it stops moving |
| **Stunned** | Thunderstone | 34 — Blacksmith Qtr (Dora) | Dora throws one at an anvil in the forge yard to demonstrate |
| **Grappled** | Snare Trap | 14 — Highlands (Fionn) | Player watches it catch a rabbit during the kelpie preparation |
| **Petrified** | Basilisk Eye Flask | 37 — Greek Agora | Player finds a petrified dog near the alcove. Tesse explains |
| **Jammed** | Signal Jammer | 6 — Cyberpunk Streets | Corrupted Android's coordination breaks when player picks it up |
| **EMP Stunned** | EMP Grenade | 6 — Cyberpunk (Auros) | Auros deactivates a malfunctioning android to demonstrate |
| **Corrupted** | Void Virus Canister | 26 — Goblin Cave | Player watches goblins fight each other before realizing the canister is the cause |
| **Dodge** (counter) | Feint Scroll | 18 — Ocean (Draketide) | Draketide demonstrates a feint on Corvin during a sparring drill |
| **Half Cover** (counter) | Smoke Bomb | 7 — Docks | Harbor fire drill — dockworkers use smoke to simulate clearing a blocked vessel |

---

## PART SEVEN — QUEST MOTIVATION ARCHITECTURE

### The Three Layers of Why

Every good quest has three layers of motivation operating simultaneously. This story uses:

**Layer 1 — Personal (Why the player acts at all):**
Froberger is dead. He died completing a mission that only makes sense if someone finishes it. Every Shard collected is a step toward meaning in his death — a transformation of loss into purpose. The player is not saving the world for the world. They are finishing what their brother started.

**Layer 2 — Relational (Why other people help):**
Every Epic NPC has something to lose from the Void — and they all, in their own way, had a relationship with Froberger. Muffat handled him. Aldric taught him. Draketide gave him passage. Mordus tolerated him. Izador argued with him. Kassiphane prophesied him. Sweelinck loved him like a son and never said so. The player walks a path already warmed by someone who came before. People help because Froberger was good, and goodness leaves marks.

**Layer 3 — Existential (Why it matters beyond the personal):**
The Void does not distinguish between people worth saving and people not worth saving. It consumes everything with equal indifference. Every village the player passes through, every innkeeper, every harbor worker, every goblin who just wants to not be enslaved by a shaman — they all exist in a world that ends if the Codex is not sealed. The player cannot save Froberger. They can save everyone Froberger would have wanted to save.

### The Emotional Arc Beat Sheet

| Node | Emotional Beat | What Changes |
|------|---------------|-------------|
| 1 (city) | Grief trigger — Froberger dies | Player has a mission but no understanding of its weight |
| 2 (inn) | Discovery — Froberger's journal found | Grief becomes inheritance; the mission becomes personal |
| 7 (docks) | Trust established — Muffat | Player is no longer alone; has a network |
| 13 (forest) | Wonder — Aldric's world is genuinely different | The journey is real, not just a task |
| 16 (hag_swamp) | Unease — the Crones knew the player was coming | Fate is in play; the player matters more than they thought |
| 20 (atlantis) | Awe — the scale of what was built to protect the world | The Codex is real and the Scholar Kings were extraordinary |
| 26 (goblin_cave) | Anger — the Void corrupts everything it touches | Personal reason to stop it beyond grief and duty |
| 30 (vampire_castle) | Unexpected grace — Mourne's history | The world contains more than the player assumed |
| 35 (scholars_qtr) | Revelation — Sweelinck knew the player was coming | Froberger believed in the player before the player knew the mission existed |
| 42 (cosmic_realm) | Completion — the Codex is sealed | Grief resolved into legacy; Froberger's mission finished |

---

## PART EIGHT — SPELL-AS-STORY: HOW CONDITIONS BECOME MOMENTS

The condition items are not just mechanics. Each one is a **story beat** — a moment where the world teaches the player something about how it works.

### The Pattern
1. The player encounters a situation that would be harder without the trick.
2. An NPC or environment demonstrates the trick.
3. The player receives the item.
4. Later, in a battle, the player chooses to use it — or not.
5. The choice matters. Saving the item for the right moment is half the game.

### Condition Items as Spells
In fiction, spells are described as knowing what the world wants to do and asking it nicely. These items follow the same logic:
- The Earthbind Root *remembers being in the ground* and wants to return — it takes the target with it.
- The Binding Web *remembers what it was made for* — restraint is its nature.
- The Flash Powder *remembers fire* — it gives a moment of false sun.
- The Neurotoxin *interrupts the conversation between brain and body* — it is chemistry as command.
- The Thunderstone *borrows from thunder* — brief, total, and immediately over.
- The Snare *waits* — the most patient of all the tools.
- The Basilisk Flask *carries a gaze that has forgotten it was a gaze* — trapped sight, weaponized.
- The Signal Jammer *speaks silence into the frequency* — it says nothing, loudly.
- The EMP Grenade *reminds electricity that it answers to no one* — it shuts the door on all commands at once.
- The Void Virus *seeds doubt where certainty lived* — it is the Void's own mechanism, turned against its servants.

### Using Conditions to Tell the Encounter's Story
When a player uses a condition item before a battle, they are narrating the first sentence of the fight. The DM should acknowledge this in the scene description:

> *"You smash the Crone's jar at the vampire's feet. For a moment nothing happens — then the web closes over the creature's legs in a sound like tearing silk. It looks down. Then at you. Then it smiles, though less comfortably than before."*

> *"You thumb the jammer to life. The three androids' formation stutters — they halt mid-step, turn to look at each other in a way that has no recognition behind it. Their target acquisition is gone. They're individuals now, and individuals are slow."*

The condition is not a cheat. It is the player being smart. Reward it in the narration.

---

## APPENDIX — QUICK REFERENCE

### Condition Items by When You Get Them

| Node | Item | Condition |
|------|------|-----------|
| 6 | Signal Jammer | Jammed |
| 6 | EMP Grenade (from Auros) | EMP Stunned |
| 7 | Smoke Bomb (from docks) | Half Cover counter |
| 8 | Flash Powder (from market) | Blinded |
| 13 | Earthbind Root (from Aldric) | Prone |
| 14 | Snare Trap (from Fionn) | Grappled |
| 16 | Binding Web (from Crones) | Restrained |
| 18 | Feint Scroll (from Draketide) | Dodge counter |
| 26 | Void Virus Canister (from shaman) | Corrupted |
| 33 | Neurotoxin Dip (from Mael) | Paralyzed |
| 34 | Thunderstone (from Dora) | Stunned |
| 34 | EMP Grenade v2 (from Dora) | EMP Stunned (upgraded) |
| 37 | Basilisk Eye Flask (Agora ruins) | Petrified |

### Condition Items by Enemy Type

| Enemy Type | Best Condition(s) |
|------------|------------------|
| Large beasts / Giants | Prone (Earthbind Root) |
| Fast creatures / Vampires | Restrained (Binding Web) |
| Ranged / Guards with sight lines | Blinded (Flash Powder) |
| Boss enemies / Single threats | Paralyzed (Neurotoxin) |
| Clustered groups | Stunned (Thunderstone) |
| Moving / Charging enemies | Grappled (Snare Trap) |
| Nearly-unbeatable single target | Petrified (Basilisk Flask) |
| Cyberpunk / Android groups | Jammed (Signal Jammer) |
| Constructs / Mechanical enemies | EMP Stunned (EMP Grenade) |
| Humanoid groups / Cultists | Corrupted (Void Virus) |
| Dodging / Evading enemies | Feint Scroll |
| Cover-using enemies | Smoke Bomb |

---

## WORLD ENGINE — Function Reference (F3 Coverage)

> **CS architecture note:** F3 contains the world-state layer — NPC favorability, quest progression, rest/void cycle, world events, and save/load. All NPC favorability is stored as integers 0–3 in `S_story.npcFavorability`; 0 = Impartial, 1 = Friendly, 2 = Dear Friend, 3 = Dear Friend+ (covenant ceremony). The void pressure system (`S_story.voidPressure` 0–10) is advanced by missed sleep and void tide events; at 10 it triggers game-over. Save/load uses two localStorage keys: `r2h_autosave` (written on every `storyAutoSave()` call) and `r2h_checkpoint` (written only on confirmed inn sleep). Checkpoint is the respawn point on death; autosave is the continue point on restart.

---

### FL4 — Rest & Void Tide

```
MILEPOINT A  Player clicks "Sleep" at inn node → storySleep(node) called
             Requires node.sleep truthy; checks gold ≥ sleepCost
             If day ≥ 49 → storyVoidDefeat('time') immediately (no rest offered)
             Shows HP preview: first sleep = Boyscout Night (2×d10+CON), revisit = 1×d10+CON
             Minimum recovery always ≥ 50% hpMax

MILEPOINT B  Player confirms → storyConfirmSleep() fires
             Deducts gold; rolls d10(s) + CON mod; clamps to hpMax
             day++; gameDay++; sleptAtNodes[code] = true
             Long rest resets: shortRests → 3; surgeCharges → 1 (2 at Lv17+); indomitableCharges → 1 (Lv9+)
             roughWhiskeyActive cleared; missedSleeps + countedMissedInns reset

MILEPOINT C  storySaveCheckpoint() — writes S_story to localStorage 'r2h_checkpoint'
             Sets checkpointNode = nodeCode (respawn point for next death)

MILEPOINT D  _checkWorldProgressionEvents() — iterates WORLD_PROGRESSION_EVENTS array
             Fires any event whose condition() returns true and id not in worldEventsFired
             Appends ev.journalNote to S_story.log if present; marks ev.id in worldEventsFired

MILEPOINT E  storyCheckVoidTide() — looks up VOID_TIDE_EVENTS[day]
             Populates void modal (day badge, title, text); shows void overlay
             voidPressure + 1 (capped at 10); storyUpdateStatus()

MILEPOINT F  storyCheckMissedSleep() — fires on node entry at inn if NOT sleeping
             Counts distinct inns skipped (countedMissedInns[code] prevents double-count)
             At missedSleeps ≥ 2: battleDis = 2 (DIS next 2 battles); voidPressure + 1
             If voidPressure ≥ 10 → storyVoidDefeat('void')
```

---

### FL7 — NPC Favorability (F3 side)

> FL7 is documented in full in `story.md` (F2 — NPC Dialogue Priority). F3 owns the favorability primitives that feed into the dialogue priority chain.

```
MILEPOINT A  _npcFavor(key) — one-line read; returns npcFavorability[key] || 0

MILEPOINT B  _lubeckFriends() — counts NPCs with fav ≥ 1; used by _missionComplete() bit 10
             Also gates SWEELINCK_DIALOGUE_VARIANTS to the "Birka variant" when count ≥ 3

MILEPOINT C  _setNpcFavor(key, level) — only ever increases (level ≤ prev → no-op)
             Sets npcFavorability[key]; fires storyMsg upgrade line
             On level 1: immediately checks dearFriendBits[key] — may auto-advance to 2 if bit met

MILEPOINT D  _checkDearFriendUpgrade(key) — checks fav === 1 and NPC-specific mission bit
             Fires after quest completions that satisfy the bit condition
             On match: npcFavorability[key] = 2; "says your name" message fires
```

---

### FL8 — Ending Chain (F3 side)

> FL8 is documented in full in `story.md` (F2 — Ending Chain). F3 owns the mission accounting and NG+ reset.

```
MILEPOINT A  _missionComplete() — tallies 12 boolean bits
             Bits 1-12: yaelEscortUsed | journal entry 7 read | couperiSongReceived
                        pachelbel quest done | pitTrainingWins≥3 | bruhnsDepthsReported
                        ≥5 ebReturnDone | ≥9 journal entries | defeatedBattles['CO']
                        _lubeckFriends()≥3 | _curseScore()<10 | CI visited at Lv5+
             Returns true if ≥8 bits set (partial completion still wins)

MILEPOINT B  _curseScore() — EB engagement audit across all 20 EB codes
             Per code: returned → 0 | started+not_returned → +3 | never started → +1
             All 20 returned: −5 bonus; range approx −5 to +55
             Used by ending variant selector and _missionComplete() bit 11
```

---

### FL9 — EB Quest Return Completion

> Triggers `ebReturnsCompleted[ebCode] = true` (and simultaneously `ebReturnDone[ebCode] = true`). Both flags are set in the same call.

```
TRIGGER  Player clicks "💰 RETURN [NPC] awaits" chip at the NPC's home node
         Chip renders only when: quest_[code]_return === 'active' OR 'complete'
         AND player is currently at d.npcNode (the NPC's home node code)
         AND ebReturnDone[ebCode] is NOT yet true

MILEPOINT A  _storyEbReturnBeat(ebCode) called
             Guard: if ebReturnDone[ebCode] is true → return immediately (idempotent)

MILEPOINT B  Both flags set simultaneously:
             ebReturnDone[ebCode]      = true  ← guards re-fire; read by completeFn checks
             ebReturnsCompleted[ebCode] = true  ← legacy write; kept for save forwards-compat

MILEPOINT C  Gold payment resolved:
             negotiated = ebNegotiatedPayments[ebCode] if set (player accepted lower offer)
             otherwise   d.paymentFloor (fixed base reward)
             gold > 0 → S_story.gold += gold; storyMsg(d.returnBeat + '\n\n+Xgp received.')
             gold ≤ 0 → storyMsg(d.returnBeat) only

MILEPOINT D  Optional special item:
             if d.specialItem → looks up EB_STORY_ITEMS[d.specialItem]
             Pushes { name, desc, icon } into S_story.inventory

**EB_STORY_ITEMS** (HTML line 10084) — 11 special rewards, type `eb_reward`:

| Key | Name | Icon | Quest-Giver | sell | Description |
|---|---|---|---|---|---|
| `forge_rune` | Forge Rune | 🔱 | Dora Flint (EI) | 200 | One use: advantage on enchanted-object or Shard assembly roll |
| `runic_hammer` | Runewright's Hammer | 🔨 | Dora Flint (EI) | 180 | Dora's teaching hammer. Forged for someone who would use it right |
| `star_fragment` | Star Fragment | ⭐ | Grounded Seraph Ithiel (EK) | 0 | A seraph made this for eventually. Glows faintly, always warm |
| `swamp_blessing` | Swamp Blessing | 🌿 | Hazel (EJ) | 0 | The Crones marked you. Nothing in the swamp will find you first again |
| `river_pass` | River Pass | 📜 | Aldous (ET) | 60 | Aldous's toll men know your name. Any river crossing east of the Lake is free |
| `ship_warrant` | Ship Warrant | ⚓ | Cassius (EO) | 80 | Cassius marked the new lane. Any licensed ship will honor this passage |
| `escort_contract` | Escort Contract | 🐪 | Zephyrine (EL) | 75 | Zephyrine signed it. You are welcomed on any desert road she runs |
| `sand_cipher` | Sand Cipher | 🏺 | Izador al-Rashun (EV) | 220 | The djinn contract, rewritten in your favor. Izador considers the debt partially settled |
| `pirate_cache` | Pirate Cache | 💰 | Carrick (EM) | 150 | Carrick's fence surplus — worth more melted down than fenced |
| `crimson_warrant` | Crimson Warrant | 📋 | Warlord Mordus (EG) | 0 | Kazrath's journal. Someone in Birka is named twice |
| `kazrath_journal` | Kazrath's Journal | 📖 | Warlord Mordus (EG) | 0 | Thirty years of Void intelligence. Most of it is about Birka |

MILEPOINT E  Quest marked complete:
             quest_[ebCode.toLowerCase()]_return → 'complete'
             (The quest was activated at the EB node; return is the second leg)

MILEPOINT F  QUIET_RETURN_RECEIPTS[ebCode] shown after 800 ms delay (ambient line)
             storyUpdateStatus(); storyAutoSave()
```

**Chip state table** (all displayed at NPC's home node):

| `ebReturnDone` | return quest state | chip shown |
|---------------|-------------------|-----------|
| true | any | ✅ "[NPC] — Paid" (no click action) |
| false | `active` or `complete` | 💰 "[NPC] awaits" (click → `_storyEbReturnBeat`) |
| false | `active` | ⚔ "[EB label] awaits" (at EB node, not home node) |
| false | none | 🗡 "[NPC] (occupation)" (click → NPC briefing modal) |

---

### FL15 — NG+ Reset

```
MILEPOINT A  Victory screen triggers NG+ → storyNewGamePlus() called
             NG+ title overlay shown (CSS animation, 2.1 s fade)

MILEPOINT B  Preservation snapshot
             savedFavorability = Object.assign({}, S_story.npcFavorability)
             savedPitPerks = S_story.pitPerks.slice()
             savedNgRun = (S_story.ngPlusRun || 0) + 1

MILEPOINT C  localStorage cleared: r2h_autosave + r2h_checkpoint removed
             Object.assign(S_story, _S_DEFAULTS()) resets all 107 fields to initial values

MILEPOINT D  Saved fields restored: npcFavorability, pitPerks, ngPlusRun
             frobergerNoteNode seeded to random EB node (20-code pool, re-randomised each run)
             Starter loadout applied: Pointy Stick + Flint Dagger + Rusted Dagger + 2 Minor Potions

MILEPOINT E  _continueChecked = true (suppresses continue modal on render)
             storyUpdateStatus(); storyRender(NODE_MAP['CI']) — world resets at Birka CI
```

---

### FL16 — Night Atmosphere (S52)

`NIGHT_AMBIENT` is a dictionary of 6 city nodes with atmosphere lines that render only at night.

**Condition:** `(S_story.gameDay || 0) % 4 >= 2`

`gameDay` starts at 0 and increments by 1 on every inn sleep (same as `day`). The `% 4` cycle produces a repeating 4-day window:

| gameDay % 4 | Time | NIGHT_AMBIENT shown? |
|-------------|------|---------------------|
| 0 | Day | No |
| 1 | Day | No |
| 2 | Night | Yes |
| 3 | Night | Yes |

The ambient text renders as an italic blue chip below the NPC row at the qualifying node. It replaces nothing — it is additive.

| Node | Line |
|------|------|
| CI | "The Katharinen gate district is quiet. The usual foot traffic is gone. The guard posts are half-staffed." |
| IN | "The inn is quieter than usual. Two tables. A low fire. Brynn is doing accounts." |
| TV | "The tavern crowd has thinned. Quill is still playing. Long after the regular crowd left." |
| BA | "The rough bar is loud even at this hour. Louder, maybe. Some people do their best business at night." |
| CY | "The official pit is closed. The unofficial sparring is not. Weckmann pretends not to notice." |
| SQ | "The Oude Kerk square is empty. Sweelinck's lamp is on." |

All six are Birka city nodes. No other nodes have NIGHT_AMBIENT entries.

---

### F3 Function Reference Table

| Function | Line | Purpose | Key data read | Key data written |
|----------|------|---------|---------------|-----------------|
| `_npcFavor(key)` | 7879 | Returns favorability int for NPC key | `S_story.npcFavorability[key]` | none (read-only) |
| `_lubeckFriends()` | 7880 | Count of NPCs at fav ≥ 1 | `S_story.npcFavorability` values | none (read-only) |
| `_setNpcFavor(key, level)` | 7881 | Upgrades NPC fav; fires storyMsg; may auto-advance to Dear Friend | `npcFavorability[key]`, dearFriendBits | `npcFavorability[key]` |
| `_checkDearFriendUpgrade(key)` | 7908 | Upgrades fav 1→2 when NPC-specific bit is met | `npcFavorability[key]`, NPC mission bits | `npcFavorability[key] = 2` |
| `_checkRoughWhiskeyReaction(npcKey)` | 11059 | Returns whiskey-reaction quote when roughWhiskeyActive | `roughWhiskeyActive`, `npcFavorability` | none (returns string) |
| `_checkPitPerkUnlock()` | 11069 | Unlocks next pit perk when pitTrainingWins > pitPerks.length | `pitTrainingWins`, `pitPerks`, `PIT_PERK_UNLOCKS` | `S_story.pitPerks` push |
| `_applyPitPerks(combatState)` | 11081 | Injects pit perk flags into battle combat state | `S_story.pitPerks` | `combatState.*` flags |
| `_checkWorldProgressionEvents()` | 10670 | Fires off-screen world events on day advance | `WORLD_PROGRESSION_EVENTS`, `worldEventsFired` | `worldEventsFired` push, `S_story.log` |
| `_applyActThreeWeight()` | 10684 | One-time Act III body class + state flag | `actNumber`, `actThreeWeightApplied` | `actThreeWeightApplied = true`; `document.body.classList.add('act-three')` |
| `_getFarewell(fromCode, toCode)` | 10661 | Returns farewell line when leaving Friendly+ NPC node | `NODE_NPC_KEYS[from]`, `npcFavorability`, `NPC_FAREWELLS` | none (returns string\|null) |
| `_getGigaultState()` | 10644 | Returns Petra stall state (present/absent/gone) | `PETRA_STALL_STATES`, `gameDay % 3` | none (returns state object) |
| `storyCheckQuests(node)` | 11325 | Activates quests at node; completes quests when conditions met | `QUEST_DB`, `S_story.quests`, `S_story.inventory` | `quests[id]` → active/complete; gold/inventory side effects; `_setNpcFavor` calls |
| `storyQuestToggle()` | 11720 | Opens/closes quest sidebar overlay | DOM state | DOM story-quest-overlay |
| `storyRenderQuests()` | 11733 | Renders active/done/failed quest list | `S_story.quests`, `QUEST_DB` | DOM quest list |
| `storyCreateCustomQuest()` | 13804 | Creates player-defined custom quest entry | player input | `S_story.quests` + DOM |
| `_missionComplete()` | 7990 | Returns true if ≥8 of 12 mission bits are set | 12 S_story fields + `_lubeckFriends()`, `_curseScore()` | none (read-only) |
| `_curseScore()` | 11100 | Curse engagement score from EB audit | `_EB_CODES`, `defeatedBattles`, `ebReturnDone`, `S_story.quests` | none (read-only) |
| `storySleep(node)` | 12882 | Shows sleep preview modal; guards gold/day checks | `node.sleep`, `node.sleepCost`, `S_story.gold/day/hp/hpMax` | DOM sleep-overlay |
| `storyConfirmSleep()` | 12920 | Executes long rest: HP heal, day++, resets, checkpoint | `node.sleepCost`, `abilityScores.con`, `hp/hpMax/level` | `hp`, `day`, `gameDay`, `shortRests`, `surgeCharges`, `indomitableCharges`, `sleptAtNodes`, `checkpointNode` |
| `storyCheckVoidTide()` | 12970 | Shows void tide event modal for current day | `VOID_TIDE_EVENTS[day]` | `voidPressure + 1` |
| `storyCheckMissedSleep()` | 12982 | Tracks skipped inns; applies exhaustion DIS + void pressure | `node.sleep`, `sleptAtNodes`, `countedMissedInns`, `missedSleeps` | `missedSleeps++`, `battleDis`, `voidPressure++` |
| `storyAutoSave()` | 8066 | Writes S_story to localStorage 'r2h_autosave' | `S_story` | localStorage |
| `storySaveCheckpoint()` | 8070 | Writes S_story to localStorage 'r2h_checkpoint' | `S_story` | localStorage |
| `storyLoadSave(key)` | 8074 | Loads JSON from localStorage key into S_story | localStorage[key] | `S_story` (Object.assign) |
| `storyCheckContinue()` | 8086 | On startup: checks for autosave; shows continue or gameover modal | localStorage 'r2h_autosave', `save.hp` | DOM modals; `_continueChecked = true` |
| `storyRespawnFromCheckpoint()` | 8146 | Loads checkpoint save; sets hp = max(1, hpMax/2); renders current node | localStorage 'r2h_checkpoint' | `S_story.hp`; calls `storyRender` |
| `storyLoadContinue()` | 8155 | Loads autosave; renders at currentCode; resumes pending battle if any | localStorage 'r2h_autosave' | full `S_story`; calls `storyRender` |
| `storyNewGame()` | 8164 | Full reset: clears localStorage, `_S_DEFAULTS()`, starter loadout, renders CI | `_S_DEFAULTS()`, `STARTER_*` consts | full `S_story` reset |
| `storyNewGamePlus()` | 8186 | NG+ reset: preserves npcFavorability + pitPerks + ngPlusRun; resets all else | `npcFavorability`, `pitPerks`, `ngPlusRun` | full `S_story` reset + preserved fields |

---

## **[PLANNED — Layer 48]** Luck — The Seventh Stat

Luck is a read-only derived stat. It has no entry in `_S_DEFAULTS()` and is never stored in `S_story`. It is recalculated on every call from the six live ability scores.

**Formula:** `Luck = ⌈(STR × DEX × CON × INT × WIS × CHA)^(1/6)⌉`  
**Luck Modifier:** `floor((Luck − 10) / 2)` — same scale as all other modifier functions.

**World flavor:** Luck is not something the Shattered Codex world calls by name. Froberger never mentions it. No NPC will explain it. It is the ambient harmonic of everything working in your favor at once — or not. A fighter who has trained every muscle, kept their wits sharp, and knows when to run has more of it than one who ignored half their gifts. The geometric mean punishes extreme neglect more than linear averaging would. A score of 0 in any stat collapses Luck entirely.

**Applications:** See `mechanics.md` Luck stub for the full application table (bare hook fishing, tournament tiebreaker, bait search DC, d100 loot, corridor encounter, death saves).

**Implementation note:** `getLuck()` is a pure function. It takes nothing and returns nothing — it reads `S_story.abilityScores` directly. Adding Luck to the character sheet requires no new state field, only a display call. See `plan.md` §XIII for the 13-step implementation plan.

---

## ⚠️ PLANNED — The Pressure Cascade: Void-Touched Monsters and NPC Reactions (plan.md §XXIV, Layer 59)

`voidPressure` reaching thresholds (3, 6, 9) produces visible world changes. See `story.md §XXIV stub` for the full flavor text and threshold event table. This section covers the world-layer additions: void-touched monster variants and NPC pressure responses.

### Void-Touched Monsters

Two new entries added to `MONSTER_POOL` at Layer 59. Injected into terrain encounter tables at runtime when `voidPressure ≥ 6` via `_applyVoidPressureMonsters()`:

| Monster | Terrain | AC | HP | ATK | DMG | Drop |
|---------|---------|----|----|-----|-----|------|
| `void_wolf` | dark_forest, mountain_pass, GL wilderness | 13 | 28 | +5 | 1d8+3 | Void Shard (◈, sell 25) |
| `void_rat_swarm` | alley, city_slums, sewers | 12 | 18 | +4 | 2d4 | Void Shard (◈, sell 15) |

**Void Shard** is a sellable lore relic, not a Codex Shard. Flavor text: *"A fragment of something that shouldn't exist."*

### NPC Pressure Reactions — Dear Friend Lines (voidPressure ≥ 6)

Stored in `NPC_VOID_PRESSURE_LINES`. Fires when `fav[npc] ≥ 2` and `voidPressure ≥ 6`. Replaces one Dear Friend quote during that visit:

| NPC | Pressure line |
|-----|--------------|
| Yael | *"The city is holding its breath. Even the rioters have gone quiet."* |
| Brynn | *"My candles won't stay lit past midnight. I've started leaving the fire banked all night."* |
| Quill | *"The numbers in the ledger keep adding up wrong. I've checked them four times."* |
| Pachelbel | *"Three students fainted in the atelier today. The air feels thick. Like before a storm that never breaks."* |
| Weckmann | *"I've been keeping the forge running later than usual. It feels wrong to let the fire go out."* |
| Auros | *"Something is moving in the Convergence. Not the Commander. Something older."* |

**No new nodes, quests, or named NPCs.** Extend `lab-report-living-world.md` with a §XXIV implementation note on completion.

---

## ⚠️ PLANNED — Corelli the Wandering Merchant (plan.md §XXVI, Layer 61)

A new NPC archetype — vendor-modal, not fixed to a single node. Corelli appears at 5 nodes across 5 acts (TL/RD/IS/WM/IN), moving through the same world as the player on their own route. Favorability is purchase-gated: one increment per purchase, cap 3. No quest needed. The relationship is built through commerce.

**Backstory (revealed at fav = 3):** Former Ivory Circle courier. Carried sealed documents for six years without opening them. One seal broke in the rain. Read the order inside: a suppression directive for a researcher the Circle called "the Antecedent." Has been redistributing her lost materials commercially ever since — not to expose anyone, but because the right things should find the right hands.

**Fav levels:**
- 0 — Stranger: standard vendor header, no memory between visits
- 1 — Regular: remembers last purchase; one observation about the road
- 2 — Trusted Client: shares road intelligence; at WM: *"I kept their seal. It still opens most of their archives."*
- 3 — Dear Friend: Revelation modal + `last_cipher` auto-gift at 5th appearance (IN, Act VIII)

**Unique items across appearances:** `scholar_ink` (voidPressure lore notes), `false_warrant` (skip corridor encounter), `encoded_letter` (partial suppression order), `kings_seal` (+1 saving throw trinket), `last_cipher` (decodes encoded_letter; reveals First Researcher suppression). `encoded_letter` + `last_cipher` interaction: reading both unlocks a decoded footnote appended to the encoded_letter text.

**Cross-references:** §XVI (First Researcher = "the Antecedent"), §XVII (Antecedent Containment Protocol), §XXII (shard 5 placed by First Researcher), §XXIV (scholar_ink hints at pressure thresholds).

**New RD node:** Minor roadside junction between Tilbury and Visby; Corelli's 2nd appearance. No battle/loot/sleep.

**Lab report required before implementation:** `lab-report-corelli-merchant.md`.

---

## ⚠️ PLANNED — The Homecoming: Act VIII NPC Farewell Beats (plan.md §XXV, Layer 60)

Six one-time beats fire in Act VIII (actNumber === 8) when a player with Friendly or Dear Friend favorability visits each NPC's node. Each fires from a parchment modal before the normal dialogue, then sets its flag and returns the NPC to standard rotation. Not preserved on NG+.

| NPC | Act VIII Final Note | Gift |
|-----|--------------------|----|
| Yael (CI) | Spent the player's absence building a witness network — names of people who will tell the truth after. *"Go do the other kind [of victory]."* | None |
| Brynn (IN) | Has bread waiting. Was worried since Act III. Doesn't say so directly. | `brynns_loaf` — heals 8 HP, cannot be sold |
| Quill (BA) | The Couperin ledger is settled. Understood the lesson: debts that served their purpose can be released. | None |
| Pachelbel (SH) | Gives the player an unfinished composition sketch — the first honest work since the debt was cleared. *"Maybe you'll leave it for someone else to read."* | `pachelbels_sketch` — readable, no mechanical effect, cannot be sold |
| Weckmann (CR) | Recognizes the player as the rare kind of champion — the kind earned in the world, not in a pit. Kept a tincture for this. | `champions_tincture` — advantage on next attack roll, cannot be sold |
| Auros (BK) | *"Be ready. What you bring to it matters. Not just the Shards."* — the only beat that looks toward CO rather than back. Ambiguous in retrospect, given her role in the final battle. | None |

**Flags:** `act8FarewellYael/Brynn/Quill/Pachelbel/Weckmann/Auros` (6 booleans, default false, not NG+-preserved).  
**New items:** `brynns_loaf`, `pachelbels_sketch`, `champions_tincture`. Full dialogue text in `plan.md §XXV`.

---

## ⚠️ PLANNED — The Froberger Memorial: World Context (plan.md §XXVIII, Layer 63)

The Froberger memorial stone sits at the CI crossroads. It has been there since before the game begins — the players arrive in a world where this stone already exists and is already tended.

**Geography:** Northwest quadrant of the CI intersection, set slightly back from the main road. Visible from the inn door. The same bench Weckmann mentions in his book entry ("the bench across the road") is the forge bench — Weckmann's forge is at CR, but Froberger apparently watched training from the CI side. This is consistent: a chronicler would sit where he could observe without interfering.

**The Ivory Circle removal request (1312):** The Circle requested the stone's removal through the city administrative council. The city declined. No vote was recorded; no commissioner filed a formal response. The request simply went unanswered until the deadline passed. This is the only documented instance of the city of Birka collectively ignoring an Ivory Circle directive. It is not commemorated anywhere official — only on the stone itself (layer 3, Dear Friend unlock).

**Who tends the stone:** Yael brings water every week (her unsigned memorial book entry). Brynn extended credit through the last day. The unnamed author of *"He was right about the Tide"* may be anyone — the Tilbury fishing community, a corridor runner, someone from the Unbanked Quarter. The memorial is communal in a way no NPC orchestrates.

**Cross-references:** §XXVI (Corelli `last_cipher` / `corelliRevelationDelivered` unlocks layer 4); §XXVII (Act VIII town crier flower line references the stone); §XV (Entry 42 is Froberger's final journal note — the player may reach the memorial with 41 entries already read); §XVI (Ivory Circle suppression context).

**No new nodes, NPCs, items, or quests.** No new persistent world state beyond 3 player-local flags (`frobergerMemorialVisited/Flowers/BookSigned`).

---

## ⚠️ PLANNED — Pit Championship: World Context (plan.md §XXIX, Layer 64)

**Ogundimu, the Iron Standard** — non-dialogue NPC. No favorability, no quest, no fixed node. She appears once at CR for the championship bout and is never seen again. She is real in the world — Weckmann knows her, she has a history with the city's pit circuit — but she is not a recurring presence.

**Background:** Former city pit champion. Lost the title in a contested bout she disputes. Has been taking irregular exhibition matches since. Known to Weckmann through the forge/training network. When Weckmann contacts her, she says yes.

**The pit circuit:** The CY pit training bouts are informal affairs — traveling fighters, neighborhood challengers, occasional visiting professionals. The championship is a step above: Ogundimu is the standard by which serious fighters are measured. Reaching her requires five documented wins in the circuit. Weckmann is the one who knows when a fighter has earned the right to ask.

**Post-championship world:** After `pitChampionWon = true`, the world does not change visibly — no new NPCs, no changed nodes, no altered terrain. Ogundimu passes through. The fight happened. Weckmann's log records it. The player's favorability status with the world does not shift. This is intentional: the championship is recognized by those who would know, invisible to those who wouldn't.

**No new nodes, monsters, items, or quests.** New state: `pitChampionOffered` / `pitChampionWon` (both boolean, player-local, NG+-cleared).

---

## ⚠️ PLANNED — Town Crier Ambient Lines: World State (plan.md §XXVII, Layer 62)

The Town Crier lines in `TOWN_CRIER_LINES` draw on existing world state already tracked in `S_story` — no new persistent fields added to the world model.

**World state read (existing fields only):**
- `voidPressure` — gates critical (≥9) and tension (≥6) tiers
- Active quest flags (`ebQuestActive`, inventory contents for `corelli_encoded_letter`, act8 farewell flags) — gates quest-flag tier
- `actNumber` — selects the act-cycling pool (1–8)

**No new nodes, NPCs, items, or quests.** The crier exists only as text in the story log.

**Act flavor reference (for world consistency):**
- Acts I–II: trade routes open, minor border disputes
- Acts III–IV: guild rationing, increasing void rumors
- Acts V–VI: evacuation talk, Ivory Circle silence
- Act VII: Convergence visible at night, road closures
- Act VIII: stillness, waiting — lines imply the world knows something is ending

**Cross-references:** §XXIV (voidPressure thresholds), §XXVI (Corelli encoded_letter quest flag), §XXV (act8 farewell flags). No new cross-references to add to world.md beyond these pointers to existing planned sections.

---
*© 2026 roll2hit.com — MIT License. See [LICENSE](LICENSE) for full text.*
