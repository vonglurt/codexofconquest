# Lab Report — NPC Dialogue System: World Truth, 4-State Speech, and the Groundhog Day Mechanic

*roll2hit.com / Codex of Conquest — Layer 42 Design Document*

> **Implementation note (SP2 2026-05-24):** Two details differ from the shipped HTML. (1) `NPC_DIALOGUES` pool selection: `questActive` fires when `_hasActiveQuestFor(npcKey)` is true regardless of fav level — not tied to fav=1. `dearFriend` fires at fav≥2; `friendly` at fav=1 with no active quest. (2) `_missionComplete()` evaluates 12 bits and returns `true` when **8 or more** are set (`>= 8`), not `.every(Boolean)` as this document specifies. The bit list also differs from the design version — see `story.md` FL8 Milepoint B for the implemented bit list.

---

## I. Design Philosophy

The problem with most RPG dialogue is that NPCs have **information**, not **perspective**. They tell you where the dungeon is. They don't have a theory about why people like you keep going into dungeons and what that says about the world.

The dialogue system in Codex of Conquest is built on three interlocking principles:

**1. Occupation as lens.** Every NPC has spent their working life developing a particular theory of how the world works. A guard captain believes power flows through enforced norms. An innkeeper believes survival comes from invisible maintenance. A fence believes morality is what you can afford. These are not just flavor — they are the specific angle from which each NPC sees the Curse of Knowledge playing out in real time. They may not name the curse. They live it.

**2. The curse weaves through personality.** The Curse of Knowledge says: once you know how to fix a thing, you can no longer remember not knowing. You see the fix before you see the person. Each NPC has their own version of this — their own version of becoming too capable, too efficient, too alone. The guard who stops seeing residents and sees patrol sectors. The innkeeper who stops feeling tired and just runs the deficit. The bard who stops playing music and starts calculating reach. Their dialogue reflects where they are on that arc — and shifts as they become your friend.

**3. Friendship changes the angle, not the voice.** Friendly NPCs don't become warmer and vague. They become warmer and more specific. An Impartial Yael says "move along." A Friendly Yael says "Varga changed his pigeon route three days before the last tax collection — that's his tell." The information is sharper because the trust is real. A Dear Friend NPC says things they've never said out loud before. Not performed confession — just the thing they've been thinking about for eleven years that finally has an audience.

---

## II. The 4-State Speech System

Every NPC has four distinct dialogue states. State is determined by `S_story.npcFavorability[npcKey]`:

```
0 = Impartial    (default, never interacted or quest not active)
1 = Quest-Active (player has their quest in journal, not complete)
2 = Friendly     (quest complete, npcFavorability set to 2)
3 = Dear Friend  (triggered by second interaction after Friendly; requires additional beat)
```

The transition from 2 to 3 (Friendly → Dear Friend) requires a specific trigger — not automatic. Usually: completing their second quest, surviving a hard fight with them, or returning to their node after a long journey.

### State Rendering Logic

```js
function _getNPCDialogue(npcKey) {
  const profile = NPC_DIALOGUES[npcKey];
  const fav = S_story.npcFavorability[npcKey] ?? 0;
  const questActive = _hasActiveQuestFor(npcKey);
  
  let pool;
  if (fav >= 3)          pool = profile.dearFriend;
  else if (fav >= 2)     pool = profile.friendly;
  else if (questActive)  pool = profile.questActive;
  else                   pool = profile.impartial;
  
  // Pick quote — not random; use (visitCount % pool.length) for cycling
  const visitKey = `${npcKey}_visits`;
  const idx = (S_story[visitKey] ?? 0) % pool.length;
  S_story[visitKey] = (S_story[visitKey] ?? 0) + 1;
  return pool[idx];
}
```

Cycling rather than random: this ensures the player sees all quotes over multiple visits, and the best quotes appear deliberately at specific visit counts.

---

## III. NPC Profiles — Full Dialogue Matrix

### YAEL STORMHOOK (CI — Guard Captain)

**Occupation:** City guard captain, 12 years. Enforces norms she partially designed.  
**World Truth:** Every riot that gets suppressed becomes three quiet riots that never make the papers.  
**Enemy:** City commissioners who erase evidence of unrest to keep the books clean.  
**Wound:** She filed the riot suppression report herself. She followed orders. She has read it approximately four times. She filed it correctly.  
**Curse Expression:** The guard who stops seeing people and sees patrol sectors. The soldier who gets so good at keeping order that she can no longer remember what order was for.  
**Mission Bit:** `yaelEscortUsed`  

---

**Impartial** *(fav = 0, no quest active)*  
```
"Keep moving. This district's quiet right now and I'd like to keep it that way."
"Papers if you're trading. Move along if you're not."
"You want information, you want the notice board. I'm not it."
"Conclave district east, market district west. If you don't know where you're going, you're already in the wrong place."
"Quiet night. I'd like it to stay quiet."
```

**Quest-Active** *(quest in journal, Ghetto cleanup active)*  
```
"You took the Ghetto work. Good. Most people say they want to help and mean it for about forty minutes."
"The east alley drains backed up again. If you clear them before I finish my patrol, I won't pretend I didn't notice."
"Don't antagonize Pachelbel's people while you're in there. They know which trouble is which."
"Merchants from the market district offered to 'assist' with the Ghetto cleanup. I told them we had it handled. We do have it handled?"
"Report back when the northern section's clear. I'll verify personally."
```

**Friendly** *(fav = 2)*  
```
"Varga changed his pigeon route three days before the last tax collection. That's his tell. If he changes it again, something's moving."
"Eleven years on this corner, the same guard. Nivers. She hasn't called in sick once. She's either a machine or she's scared. I keep watching."
"The Ghetto stabilized. I'm not thanking you publicly — city politics — but you'll notice the eastern patrol route added two stops."
"Gigault runs the bread stall on Conclave Way. She goes home an hour early when there's going to be trouble. I use her schedule to calibrate mine."
"The blue shutters on Scholar's Row — that's not a bookshop. It's a Scholar King archive. They call themselves private collectors. They are not private collectors."
```

**Dear Friend** *(fav = 3)*  
```
"There's a report I filed twelve years ago. Riot suppression, east quarter. I wrote it exactly as I was told. Every word accurate, every context removed. You know what I learned? Accurate and honest are different categories."
"I know every corner of this city and I don't know what it looks like when it's actually okay. I've been keeping order for so long I've forgotten what the order is supposed to protect."
"When they offered me the captain's post I thought: now I can make it better. Twelve years later the definition of 'better' has drifted considerably toward 'stable.' I'm not sure when that happened."
"You keep coming back. Most people don't. I think about that."
"The city doesn't need more capable guards. It needs guards who remember why they became guards. I'm working on that. It's slow."
```

---

### BRYNN FENN (IN — Innkeeper)

**Occupation:** Innkeeper, solo for 6 years. Runs a 14-bed inn with one part-time kitchen helper.  
**World Truth:** The thing that keeps a city running is the work no one names.  
**Enemy:** Anyone who benefits from infrastructure without acknowledging it exists.  
**Wound:** Baseline exhaustion so structural it reads as her personality. No one asks if she's okay because she's always managing.  
**Curse Expression:** The innkeeper who stops noticing she's tired and just tracks the deficit. Systems thinking as survival, until the system is all that's left.  
**Mission Bit:** `brynnsJournalRead`  

---

**Impartial**  
```
"Beds are four copper, meals three. Full board for a week, twenty-five. Sign the ledger."
"Fire's warm. Avoid the third step on the left — it creaks. Kitchen closes at ninth bell."
"Bring noise upstairs and I'll know it by morning. I always know."
"Take the corner room if you want quiet. The street-side one's for people who sleep hard."
"No tab. Payment at time of service. That's how this works."
```

**Quest-Active** *(journal delivery quest)*  
```
"She put that journal in the lockbox herself. Wouldn't tell me what was in it. Just — 'if the right person asks, give it to them.' You're apparently the right person."
"My daughter writes 'expedition' in very hard pencil. Like the word needs to be certain. I've stopped trying to explain what expeditions actually involve."
"The journal's got a cipher on the back pages. She learned it from the archivist on Scholar's Row. I don't know what she wrote. I think she wanted me not to know."
"You'll be careful with it. That's not a question."
"Come back when you've read it. I want to know what she said."
```

**Friendly**  
```
"Third step still creaks. It'll keep creaking until someone fixes it. Probably me, eventually, when there's a week with nothing else."
"I haven't slept past sixth bell in six years. I don't miss it. I miss missing it."
"The merchants in this district take infrastructure for granted the way they take weather for granted. It doesn't occur to them that someone made it."
"My daughter sent a letter. She's in the Heartwood. She said the trees are older than the city. She wanted me to know that."
"Free lodging, whenever you're back. Don't argue. I have the room."
```

**Dear Friend**  
```
"You ever get so competent at something that the competence starts feeling like the whole point? I run this inn perfectly. I don't know if I'm still running it for something or just... running it."
"When my husband died I told myself: you know how to do this. You've run the inn for twelve years, you know every system. And I did. I do. It turns out knowing how to manage grief and actually doing it are entirely separate skills."
"My daughter asked me why I stayed in Birka. I said: because someone has to run the inn. She looked at me for a long time. She's very patient. I'm working on better answers."
"The thing no one says about keeping everything running is that eventually the running becomes the thing and you forget what you were running toward. I think I knew, once."
"You came back. I started keeping the corner room. In case."
```

---

### TOMAS QUILL (TV — Bard)

**Occupation:** Unlicensed bard, 4 years. Performs at the Tavern while paying off a license debt that accrues faster than he earns.  
**World Truth:** Institutions license creativity to capture the upside; the downside falls to the creator.  
**Enemy:** The Bardic Guild licensing apparatus, specifically the debt collector who visits every third Tuesday.  
**Wound:** He's good enough to be licensed. The debt structure makes it functionally impossible. He has started doing math during performances.  
**Curse Expression:** The artist who gets so good at calculating reach that he stops playing music and starts playing audiences. Professionalization as slow disappearance.  
**Mission Bit:** `couperiSongReceived`  

---

**Impartial**  
```
"Request list is on the board. Standard fee, coin up front. I don't take trade."
"If you want the Scholar's Walk cycle, that's a long engagement — talk to the tavern keeper first."
"Can't do the Elven ballads without a permit. Guild rules. Don't ask me why, I didn't write them."
"The lute's new. The old one had a crack in the second fret. Still worked. New one is better. It's still not mine."
"Playing through ninth bell. After that I pack up."
```

**Quest-Active** *(license debt quest)*  
```
"You want to help with the debt? Fine. But I'm not paying off the Guild with stolen coin — that comes back worse."
"The collector's name is Boyvin. He's punctual. I'll give him that. Shows up every third Tuesday like the world owes him a schedule."
"There's a payment the Conclave made to the Guild that was supposed to credit my account. It didn't. I have the receipt. The Guild says they don't. Someone's math is wrong."
"If you find the discrepancy, bring me the document. Don't confront Boyvin. He has friends I don't have."
"I wrote a song about the debt. I haven't performed it. The Guild would cite me for something."
```

**Friendly**  
```
"Song's ready. I've been working on it since last month. It's specifically for you. Don't get used to that."
"The Rough Whiskey you didn't buy? I appreciate it. The lute strings are sensitive and I smell everything from up here."
"Boyvin came by. The discrepancy cleared. He didn't apologize. I didn't expect him to. The debt is mine alone now — which is actually better."
"I've started playing without counting the reach. Just... playing. It's been a while."
"Come back when you're in the city. I'll have something new."
```

**Dear Friend**  
```
"You know what I noticed? I started doing arithmetic during 'The Long March.' Three hundred and twelve bars, I've played it so many times I was calculating the evening's take during the bridge. I noticed. I stopped. I'm not sure when it started."
"The Guild system is designed so that I'm always one missed payment away from losing the license I don't technically have. That's not an accident. That's the product."
"My teacher said the best performers don't play the music, they become the music for the duration. I understand that. I can't always do it anymore. The math keeps interrupting."
"You fixed the one thing I couldn't fix myself. I've been thinking about what I owe you. The answer is: nothing, because that's not how it works, but also: everything, because that's how it feels."
"I have a song. It's about someone who keeps coming back to a city that doesn't seem to need them, and how the city actually does. I'm still finishing it. I'll play it when it's right."
```

---

### DEACON (BA — Fence)

**Occupation:** Fence. Runs a legitimate salvage front at BA. Strict moral code: no bodies, no children, no desperation goods.  
**World Truth:** The market doesn't have morality. The people in it do. Usually not enough.  
**Enemy:** Merchants who operate with moral plausible deniability — they didn't steal anything, they just bought it.  
**Wound:** Raison got arrested on a job Pachelbel passed to him. Pachelbel declined because the margin was thin. He didn't go to the trial.  
**Curse Expression:** The fence who gets so good at assessing risk that he stops assessing people. The moral code as armor that eventually becomes a wall.  
**Mission Bit:** `pachelbelPaidBack`  

---

**Impartial**  
```
"Salvage and surplus. What you've got, I'll look at. What I've got, posted on the board."
"No questions about provenance on standard goods. On specific goods, I ask once and believe the answer."
"I don't deal in desperate. If you're selling because you need the coin badly enough to take half price, come back when you don't."
"My code's on the wall. Read it. If your business fits inside it, we can talk."
"Market price plus ten percent for identification, minus twenty for obvious damage. That's baseline."
```

**Quest-Active** *(Raison's restitution quest)*  
```
"You want to square the debt. Fine. The family's in the east district. Don't tell them where the coin came from."
"Raison knew the risk. I knew the risk. The difference is I passed it to him. That's the part I can't square mathematically."
"The family doesn't know me. Keep it that way. This isn't about making me feel better."
"Bring me proof of delivery. Not because I don't trust you — because I want to know it's done."
"After this is finished, we're even. I don't mean you and me. I mean the other thing. The one I've been carrying."
```

**Friendly**  
```
"Market district bought a lot of 'salvaged antiques' last season. I can tell you exactly where they came from. I'm choosing not to, because I'd have to explain how I know."
"Moral plausible deniability is the operating principle of legitimate commerce. They didn't steal it. They just bought it from someone who did. Clean hands. The blood's upstream."
"I turned down a consignment last week. Good margin. Wrong provenance. My code said no. I said no. It felt like something."
"You kept your word about how the delivery went. I notice those things."
"I owe you a look at the back stock. Next time you need something specific, ask."
```

**Dear Friend**  
```
"Raison's kid is eight now. The family got stable. I found out from a contact — I didn't go see them. I don't know why. I know why."
"My code started as a set of minimums. Don't do the worst things. Over the years it became a comfort — I do the code, I'm okay. But the code doesn't do Raison. The code just tells me I didn't do anything wrong."
"I know what everything's worth. I've spent thirty years learning it. The things I don't know: what it would feel like to do the thing I should have done twelve years ago. I have a theory. I think it would feel like relief."
"You're the only person in this city I've told that to. I want you to know that's not nothing."
"If you find yourself on the wrong side of a deal and you need someone to know where you are — I'll know. That's the offer."
```

---

### CROV (CY — Pit Master)

**Occupation:** Pit master, 28 years. Runs the legal fights at CY. Quietly campaigns against illegal pits.  
**World Truth:** Pain is information. The question is whether you chose to receive it.  
**Enemy:** Pit operators who run illegal fights because the legal overhead cuts into margin.  
**Wound:** Lost Bruna at 23 to an illegal pit. The fight Bruna took was one Weckmann declined because the odds were too good.  
**Curse Expression:** The coach who gets so good at reading fighters that he stops seeing fighters and sees fighting. Bruna became a variable. That was before the pit.  
**Mission Bit:** `weckmannPitTrainingDone`  

---

**Impartial**  
```
"Entry fee's posted. Fight when your number's called. Don't tap the post — tap the mat."
"You want to watch, the benches are behind the rail. You want to fight, sign the book."
"No weapons. No outside bets. Both fighters walk out or neither walks out. Those are the rules here."
"I've seen every type come through here. Most of them fight fine. A few of them are good. You want to find out which you are?"
"Sign in if you're fighting. Move to the benches if you're not. This isn't complicated."
```

**Quest-Active** *(illegal pit tip quest)*  
```
"You know about an illegal operation and you're telling me instead of the guard. Good instincts."
"I don't want them arrested. I want them gone. Different things."
"The guard'll file it and lose it. You get me location and schedule, I have contacts who can make the operation nonviable. Quietly."
"These operators know the margins. They're not desperate — they just don't want to pay the legal overhead. That's the type I have the least patience for."
"When it's done, come back. We'll see what you can do in the pit."
```

**Friendly** *(post-quest)*  
```
"You showed up drunk. First time in eight years that's happened in the legal pit. I won't say I wasn't entertained."
"The whiskey didn't make you sloppy. It made you aggressive in ways you weren't calculating. Interesting to watch. Don't do it again."
"Training sessions: fifths bell, three days a week. You show up, I'll show you what I know. I don't do this for everyone."
"Bruna would have liked you. He liked people who showed up weird and meant it."
"The illegal pit's gone. They moved or stopped — I don't know which and I'm okay not knowing."
```

**Dear Friend**  
```
"Bruna was twenty-three. He took a fight at an illegal pit because the money was good and I'd told him he was ready. I believed it. I was right about his skill. I wasn't thinking about anything else."
"I became very good at reading fighters. Styles, patterns, tells. Bruna had a tell — he dropped his left when he was tired. I'd been watching it for two years. I mentioned it six times. I didn't think about what it meant in an illegal pit with no rules and an opponent who'd been watching too."
"I got so good at knowing what a fighter needed to know that I forgot to know them. That's the thing. He wasn't a fighter to me. He was. I mean, he was a person. But I was seeing the fighter so clearly."
"I run legal fights because rules protect people who don't know they need protecting yet. That's the whole reason. It's not complicated. I just had to lose someone first before I understood it."
"You keep coming back. Training, not fighting. That tells me something. The people who only want to fight don't become good. The people who want to understand it — sometimes they do."
```

---

### SERAPHINE AUROS (CY — Undercity Tech Researcher)

**Occupation:** Independent researcher, undercity access specialist. Works out of CY because the depth access is best here.  
**World Truth:** The infrastructure that holds a city up is built on infrastructure that was never meant to be permanent.  
**Enemy:** City planning officials who refuse to fund undercity surveys because the findings would create liability.  
**Wound:** Submitted a structural integrity report three years ago. It was reclassified. She found out because she kept a copy.  
**Curse Expression:** The researcher who gets so good at finding structural failure that she stopped imagining structural success. Diagnosis as worldview.  
**Mission Bit:** `bruhnsDepthsReported`  

---

**Impartial**  
```
"You're not here about the depths. Most people aren't. Move along."
"If you need CY access for training, talk to Weckmann. He handles the pit side. I handle the down side."
"My work isn't available for public viewing. If you know what you're looking for, you probably already know how to find me."
"Don't touch the survey equipment. It's calibrated."
"I'm busy."
```

**Quest-Active** *(undercity anomaly report)*  
```
"You actually went down. And came back. That's a better result than my last three contractors."
"The readings you brought are consistent with what I've been tracking. Which is not good news, but it's accurate news."
"The city planning office will ignore this. I need you to understand that before you get invested in what we're doing here."
"Froberger came back once. He didn't stay long. He said he'd seen something similar in three other cities. He left before I could ask what happened to those cities."
"The Void isn't just below us. It's been below us for a long time. Something's changed about the timeline."
```

**Friendly**  
```
"The report I submitted three years ago — if you're ever in the Scholar King archive, look for the reclassified shelf on sub-district drainage. It's there under a different title. They couldn't destroy it, so they buried it."
"Weckmann thinks I'm paranoid about the undercity. He's not wrong that I'm fixated. He's wrong that fixation and paranoia are the same thing."
"The structural failure modes I study — most of them happen slowly. You can see them coming for years if you're looking. The ones that kill people are the ones where no one was looking."
"You can access the depth records now. Everything I've documented. Use it carefully."
"Froberger had a theory about the Void. He didn't finish explaining it. I've been working on the rest of the theory for two years. I think I'm close."
```

**Dear Friend**  
```
"The report exists. The findings are real. The city is choosing not to know. I have spent three years being angry about this and I think I have arrived at something past anger. I'm not sure what it's called."
"I am very good at finding things that are wrong. I find them systematically. I document them thoroughly. I have submitted twenty-six reports in seven years. Four were acted on. The others are reclassified, delayed, or lost. I keep making them."
"Froberger looked at my data and said: 'this is what it looks like before.' I asked him before what. He looked at me for a long time. He said: 'before it's too late, or after.' I didn't understand. I think I do now."
"The Void Below — the thing in the depths — it responds to attention. Not to capability. To presence. That's the only thing I can't put in a report."
"You came back from the depths. Something down there is looking back up. I want you to know that, because most people who know it have either left or stopped talking."
```

---

### CRANE (SQ — The Watcher)

**Occupation:** Last of the Covenant Wardens. Maintains the Seal. Has been doing this for longer than the current city exists.  
**World Truth:** The covenant is not held by those who know how. It is held by those who remember why.  
**Enemy:** No enemy. Only a grief — that capability outlasts connection, and then what was the capability for.  
**Wound:** He trained the last generation of Covenant Wardens. He was very good at it. They became excellent. They left to use the excellence. He sealed the Void alone.  
**Curse Expression:** He IS the Curse of Knowledge, resolved into acceptance. He knows everything about the Seal and cannot feel it anymore. He watches others discover it for the first time and remembers, faintly, what it felt like.  

*(Sweelinck dialogue is curse-score-gated, not favorability-gated. See SWEELINCK_DIALOGUE_VARIANTS.)*

---

## IV. The Groundhog Day Mechanic

### Concept

The Curse of Knowledge, as a game mechanic, means: you sealed the Void. The work is done. But if you did it alone — if you were so efficient and capable that you skipped every connection, every unnecessary quest, every thing that didn't produce output — then the Void seals, and Sweelinck says:

*"The seal holds. You sealed it alone. The curse is not in the Void — it's in the person who sealed it. The next Warden will find the Void open again, and they will be you."*

The loop continues. The curse recurs. Not mechanically — there's no actual looping — but narratively. Sweelinck describes the cycle. The player is told: you did the work, and you became what you were warned against.

The TRUE win — transcending the curse — requires completing every mission bit. Not because the mission bits were the mission. Because they were the part of the mission that had no output. They were the part you did because you were there, and someone needed something, and you were the kind of person who noticed.

### `_missionComplete()` — All Mission Bits

```js
function _missionComplete() {
  const bits = [
    // Birka arc
    S_story.yaelEscortUsed,          // walked the city with Yael
    S_story.brynnsJournalRead,       // read the journal to Brynn
    S_story.couperiSongReceived,       // stayed for Quill's original song
    S_story.pachelbelPaidBack,          // delivered restitution for Raison
    S_story.weckmannPitTrainingDone,     // completed training arc with Weckmann
    S_story.bruhnsDepthsReported,     // brought depth readings to Auros
    
    // EB arc — all 20 returns completed
    S_story.ebReturnsCompleted >= 20,
    
    // Codex arc
    S_story.journalEntriesRead >= 17, // read all journal entries
    S_story.frobergerLastEntryRead,        // specifically: Entry 41 — "Come back"
    
    // General
    S_story.ebNegotiatedPayments > 0, // at least one EB NPC paid in coin, not combat
    
    // Optional but scored
    S_story.roughWhiskeyUsed,         // survived the drunk fight (tested yourself imperfectly)
    S_story.pitTrainingWins >= 3,     // kept coming back to Weckmann
  ];
  
  return bits.every(Boolean);
}
```

### Ending Variants (Nested with `_curseScore()`)

```
_missionComplete() && _curseScore() <= 0:
  → TRUE SEAL — "Covenant Keeper" ending
  → Sweelinck names every person you helped
  → The city is named in the seal
  → "The curse does not recur. You knew how, and you also knew why. That is the whole secret."

_missionComplete() && _curseScore() > 0:
  → IMPERFECT COVENANT — "The Work Isn't Clean"
  → Sweelinck acknowledges the completeness, notes the cost
  → "You helped everyone, but not freely. The seal holds. Watch the thing that made it difficult — it's the beginning of the next curse."

!_missionComplete() && _curseScore() <= 0:
  → EFFICIENT SEAL — "The Capable Warden"
  → Sweelinck: "You were excellent. The seal is strong."
  → Beat. "Froberger was excellent too."
  → "The curse does not end here. It waits in the next Warden who is very good at the work."

!_missionComplete() && _curseScore() >= 15:
  → CURSED SEAL — "The Loop Continues"
  → Sweelinck: "The Void is sealed."
  → "You will leave now. You'll take what you learned. And somewhere, sometime, someone will break because you couldn't slow down long enough to catch them."
  → "It's not a condemnation. It's a pattern. I've seen it seventeen times."
```

---

## V. Architectural Plan for Hundreds of NPC Quotes

### The Scale Problem

A full implementation with 8 major NPCs × 4 states × 8 quotes each = 256 quotes for Birka alone. Adding EB NPCs (20 × 3 states × 5 quotes) = 300 more. Total system at scale: 700+ quotes.

This cannot live as inline strings in a single const. It needs a structure that:
1. Loads quickly (no separate network requests)
2. Is easy to extend without touching game logic
3. Allows quote-by-quote editing without breaking other quotes
4. Cycles predictably so players encounter quotes across visits

### Data Structure

```js
const NPC_DIALOGUES = {
  // Keyed by npcKey (matches S_story.npcFavorability key)
  yael: {
    meta: {
      name: "Yael Scheidemann",
      occupation: "Guard Captain",
      worldTruth: "Every riot that gets suppressed becomes three quiet riots that never make the papers.",
      enemy: "City commissioners who erase evidence of unrest to keep the books clean.",
      missionBit: "yaelEscortUsed"
    },
    impartial: [
      "Keep moving. This district's quiet right now and I'd like to keep it that way.",
      "Papers if you're trading. Move along if you're not.",
      "You want information, you want the notice board. I'm not it.",
      "Conclave district east, market district west. If you don't know where you're going, you're already in the wrong place.",
      "Quiet night. I'd like it to stay quiet."
    ],
    questActive: [ /* quotes */ ],
    friendly: [ /* quotes */ ],
    dearFriend: [ /* quotes */ ]
  },
  brynn: { /* same structure */ },
  // ... all NPCs
};
```

### Rendering

```js
function renderNPCDialogueCard(npcKey) {
  const profile = NPC_DIALOGUES[npcKey];
  if (!profile) return '';
  
  const line = _getNPCDialogue(npcKey);
  const fav = S_story.npcFavorability[npcKey] ?? 0;
  const stateLabel = ['Impartial','Quest-Active','Friendly','Dear Friend'][Math.min(fav, 3)];
  const questActive = _hasActiveQuestFor(npcKey);
  const effectiveLabel = (fav < 2 && questActive) ? 'Quest-Active' : stateLabel;
  
  return `
    <div class="npc-dialogue-card state-${effectiveLabel.toLowerCase().replace(' ','-')}">
      <div class="npc-name">${profile.meta.name}</div>
      <div class="npc-state-badge">${effectiveLabel}</div>
      <div class="npc-speech">"${line}"</div>
      ${fav >= 2 ? `<div class="npc-world-truth">— ${profile.meta.worldTruth}</div>` : ''}
    </div>`;
}
```

### Adding Quotes (No-Touch Extension)

The system is designed so adding quotes = adding strings to arrays. No logic changes. No rendering changes. Steps to add 100 new quotes:

1. Open `roll2hit-v3.html`
2. Find `const NPC_DIALOGUES`
3. Locate the npcKey and state array
4. Push strings
5. Done

The visit-counter cycling (`visitCount % pool.length`) automatically exposes new quotes as players return to nodes.

### The Occupation-Truth Display

When favorability reaches 2 (Friendly), the NPC card exposes a small footer: their World Truth. This is not lore exposition — it's the line that crystallizes what they've been saying in indirect fragments all along. The player who has been paying attention recognizes it. The player who hasn't gets a hint at what they've been missing.

---

## VI. What Grinds Their Gears — Quest Log Disposition Field

The quest log entry for each NPC quest should include a **Disposition** line that surfaces the enemy field as player-facing text. Not neutral. Voiced.

```
QUEST: Walk the Beat
GIVER: Yael Scheidemann, Guard Captain
DISPOSITION: "Twelve years and the thing that still gets me? The commissioners who order the cleanup and then order the report scrubbed. They want a safe city without knowing anything about what safe costs. That's the part I can't enforce my way out of."
```

```
QUEST: The Debt Ledger
GIVER: Tomas Couperin, Unlicensed Bard
DISPOSITION: "The Guild isn't corrupt — they're perfectly functional. They just function to extract rent from people who make things. Every Tuesday, Boyvin shows up and he's punctual and he's polite and I think about how much easier it would be if he were just a villain."
```

```
QUEST: Raison's Restitution
GIVER: Pachelbel, Salvage Specialist
DISPOSITION: "I don't hate the merchants who buy clean goods with dirty origins. I know exactly what they're doing. I just wish they knew it too. Plausible deniability is a choice. They've made it so comfortable it doesn't feel like one anymore."
```

This pattern: the NPC's enemy is not a person, usually. It's a system, a structure, a pattern of incentives. The Curse of Knowledge is woven into each one — they can name the problem with perfect clarity. They often cannot change it. That gap between diagnosis and solution is exactly what Froberger faces at scale.

---

## VII. World Truth as Thematic Weave

Each NPC's world truth connects to the Curse of Knowledge arc:

| NPC | World Truth | Curse Connection |
|-----|-------------|-----------------|
| Yael | Suppressed riots become three quiet riots | Capability without transparency creates more problems invisibly |
| Brynn | Invisible labor keeps everything running | What you do in service of others can become indistinguishable from what you do to survive |
| Quill | Institutions capture creative upside, externalize downside | The systems that benefit from your talent are structured to make you feel the failure is personal |
| Pachelbel | The market has no morality; the people in it do | Moral code as minimum standard vs. moral code as comfort — the difference between ethics and excuse |
| Weckmann | Pain you chose to receive is information; pain imposed is destruction | The teacher who gets so good at preparing students for danger that he stops seeing the students |
| Auros | Permanent infrastructure built on temporary infrastructure | Every functional system has a substrate that nobody maintains, until it fails catastrophically |

These truths are not explained to the player. They emerge through repeated visits. The player who reads the fourth Dear Friend quote from Yael and the third Dear Friend quote from Weckmann in the same session will notice the pattern — the Curse of Knowledge is not one person's problem. It's a structural feature of becoming capable in a world that rewards capability.

The game does not explain this. Froberger's journal shows it in one person. The NPCs show it in six others. The player feels the pattern without being told it's a pattern.

That's the whole design.

---

*lab-report-npc-dialogue-system.md — Layer 42 design document*  
*Generated 2026-05-22 — roll2hit.com / Codex of Conquest*
