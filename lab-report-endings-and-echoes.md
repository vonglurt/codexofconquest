<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report — Endings and Echoes: Extended Mechanics for the Covenant Arc

*roll2hit.com / Codex of Conquest — Layer 43 Design Document*

---

## I. The Design Principle

Everything in the game has been pointing toward one moment: the covenant at SQ. The seal is placed, the Void is closed, and someone walks out of the cave knowing what they did.

The question the ending system answers is: **who are you when you walk out?**

Not good or bad — the game doesn't grade character. But the ending knows who helped Yael and who didn't. The ending knows if Quill got to play his song. The ending knows how many EB NPCs were paid in coin instead of blood. These facts exist. The ending uses them.

This lab report designs:
1. The Covenant Ceremony animation
2. Sweelinck's dynamic naming of the people the player helped
3. NPC Epilogue sequences — what happens to each person after
4. The Cursed Seal echo — the Groundhog Day epilogue for those who sealed alone
5. Rough Whiskey as a social item — how every NPC reacts differently
6. Covenant Standing — the curse score surfaced as a character sheet element
7. Pit Training as a skill tree — Weckmann's lessons as permanent unlocks
8. Froberger's Last Note — the item that exists purely to be found
9. New Game+ memory hooks

---

## II. The Covenant Ceremony

### Visual Design

The ceremony is 8 seconds. Not cinematic — precise.

When `_curseScore()` is calculated and the ending branch is resolved, the SQ combat area fades to black. Then: a single SVG sigil traces itself over 3 seconds — a circle with four interior lines, drawn from center outward. The stroke is white against black.

CSS animation:
```css
.covenant-sigil path {
  stroke-dasharray: 600;
  stroke-dashoffset: 600;
  animation: sigil-draw 3s ease-in-out forwards;
}
@keyframes sigil-draw {
  to { stroke-dashoffset: 0; }
}
```

Then: Sweelinck speaks. The screen remains dark with the sigil glowing.

Then: the sigil holds for 2 seconds, then slowly pulses — once — and fades. The victory screen resolves.

The sigil does not change between endings. The ceremony is the same. The words change. The silence after changes.

---

## III. Sweelinck's Dynamic Naming

In the Covenant Keeper ending (`_missionComplete() && _curseScore() <= 0`), Sweelinck names each person the player helped. A stricter "Covenant Keeper (True)" variant also exists in the implementation: `missionDone && curse <= -6 && pitTrainingWins >= 5 && ebNegotiatedPayments >= 5` — this is beyond the Layer 43 spec and activates the full ceremony with the covenant sigil animation. The list is generated at runtime from `npcFavorability`.

### Naming Lines by NPC and State

```js
const SWEELINCK_NAMING_LINES = {
  yael: {
    2: "Yael, who keeps the city honest with her own hands.",
    3: "Yael, who told you about the report she wishes she hadn't filed — and filed a second one because of you."
  },
  brynn: {
    2: "Brynn, who runs the inn because someone has to and because she is very good at it.",
    3: "Brynn, who remembered, at the end, what she was running toward."
  },
  couperin: {
    2: "Tomas Couperin, who is still in debt and still playing.",
    3: "Quill, who wrote a song for you. Who plays it every Friday."
  },
  pachelbel: {
    2: "Pachelbel, who paid a debt he didn't owe because his code required it.",
    3: "Pachelbel, who went to see the family. After. He didn't tell you."
  },
  weckmann: {
    2: "Weckmann, who teaches because Bruna needed a teacher and there wasn't one.",
    3: "Weckmann, who said, when you asked: 'You're the best student I've had since him. I needed you to know that.'"
  },
  bruhns: {
    2: "Seraphine Bruhns, who keeps filing the reports.",
    3: "Auros, who finished the theory Froberger started. She's going to submit it."
  }
};
```

### Rendering

```js
function _buildSweelinckNamingSequence() {
  const lines = [];
  for (const [key, states] of Object.entries(SWEELINCK_NAMING_LINES)) {
    const fav = S_story.npcFavorability[key] ?? 0;
    if (fav >= 3 && states[3]) lines.push(states[3]);
    else if (fav >= 2 && states[2]) lines.push(states[2]);
    // Impartial NPCs are not named
  }
  return lines;
}
```

The naming sequence is spoken one line at a time, fading in and out. If the player helped everyone at Dear Friend level, Sweelinck names six people. If they helped no one, Sweelinck says:

*"The covenant holds. You sealed it yourself."*

Beat.

*"That is what the last one did too."*

---

## IV. NPC Epilogues

After the naming sequence, a scroll-style panel appears: **What happened after.**

Each entry is one or two sentences, populated based on `npcFavorability`. The entries appear in order: Yael, Brynn, Quill, Pachelbel, Weckmann, Auros. Then: EB NPCs who were returned to (one line each, if `ebReturnsCompleted >= 10`). Then: Froberger.

### Epilogue Text by NPC and State

```js
const NPC_EPILOGUES = {
  yael: {
    0: "You passed through. She's still there.",
    2: "Yael filed the second report under her own name. It was acted on.",
    3: "Yael filed the second report. She kept three copies. The city commissioned an inquiry. She testified. The commissioner resigned. She went back to the corner."
  },
  brynn: {
    0: "Brynn doesn't know your name.",
    2: "Brynn's daughter came home for two weeks. They stayed up late.",
    3: "Brynn's daughter came home. She sat in the kitchen and watched her mother run the inn and said, finally: 'You're very good at this.' Brynn said: 'I know. I'm figuring out what else I am.'"
  },
  couperin: {
    0: "Quill is still in debt. He's still playing.",
    2: "Quill settled the debt. He's playing without counting the reach now.",
    3: "Quill settled the debt. He plays the song every Friday. He's working on a second one. It's about staying."
  },
  pachelbel: {
    0: "Pachelbel is still there. He still has a code.",
    2: "Pachelbel sent coin to Raison's family. Anonymous. He didn't go see them.",
    3: "Pachelbel went to see the family. Raison's kid is eight. He sat with them for an hour. He didn't say who he was. He said he knew Raison. The kid asked what Raison was like. Pachelbel said: 'Better at the work than me.'"
  },
  weckmann: {
    0: "Weckmann is still running the pit.",
    2: "Weckmann trains three fighters now. The illegal operation didn't come back.",
    3: "Weckmann started a second class on Thursdays. Younger fighters, twelve to sixteen. He teaches them the rules first, before anything else. He says it's because someone taught him that way. He knows that's not true. He does it anyway."
  },
  bruhns: {
    0: "Auros submitted another report. It was reclassified.",
    2: "Auros completed the structural survey. She submitted it through a different channel.",
    3: "Auros finished the theory. She submitted it jointly with a Scholar King archivist who had independent data. The city planning office acted on it. Not everything — half. She says half is how it starts."
  }
};
```

### Froberger's Epilogue (Always Last)

```js
const FROBERGER_EPILOGUE = {
  covenant: "Froberger's last entry was Entry 41: Come back. He wrote it in the same ink as the others. He left it where you'd find it. He did not come back. But he wrote it down so you would know it was possible.",
  imperfect: "Froberger's last entry was a warning. You read it. You almost heeded it. Almost is how most things start.",
  efficient: "Froberger's last entry was a warning. You did not read it, or read it and did not stop. The warning is still there. The next one will find it.",
  cursed:    "Froberger never finished his last entry. Someone found it and left it where you found it. That someone was also very good at their work. They did not stay long either."
};
```

---

## V. The Cursed Seal Echo (Groundhog Day Epilogue)

When `!_missionComplete() && _curseScore() >= 15`, the epilogue panel reads differently.

No names. No people. Just:

---

*The Void is sealed.*

*You sealed it alone, or nearly alone. The work is complete. The covenant holds.*

*Sweelinck has seen this pattern seventeen times. In seventeen runs of the cycle, the Warden who arrived here was capable, dedicated, and efficient. They knew what needed doing. They did it.*

*In sixteen of those runs, the Void opened again within a generation.*

*In the seventeenth — not yet. That one is still running.*

*He believes the eighteenth will be different.*

*He believes that about all of them, until the evidence arrives.*

---

Then: the victory screen. Same as Covenant. The Void is sealed. You win. The game does not deny you the win. It asks you to sit with what kind of win it was.

---

## VI. Rough Whiskey as Social Item

Currently: Rough Whiskey (5gp, BA vendor) triggers drunk fight at CY — disadvantage + +3 flat damage, Weckmann delighted. 

Extension: consuming Rough Whiskey before visiting any named NPC triggers a unique response. The item is consumed on use (or on entering a combat). If the player uses it and then visits an NPC before the combat effect expires, the NPC reacts.

The effect window: until the player rests or completes one combat.

### NPC Responses to Rough Whiskey

```js
const ROUGH_WHISKEY_REACTIONS = {
  yael: {
    impartial: "You've been drinking. Come back when you haven't.",
    friendly:  "I'm going to pretend I don't smell that. Walk with me — the cold'll fix it by second check.",
    dearFriend: "Oh, that's Weckmann's Rough Whiskey. I know the smell. What happened?"
  },
  brynn: {
    impartial: "Water's free. You need water. Sit down.",
    friendly:  "[She pours water without asking. Sets it in front of you. Says nothing. Watches until you drink it.]",
    dearFriend: "Was it the pit or was it something else? Either way — water first. Talk after if you want."
  },
  couperin: {
    impartial: "Ha! The lute strings are sensitive and I can smell everything from up here. Come back sober.",
    friendly:  "You showed up like this once before. Different kind of night, I think. The request list is still on the board.",
    dearFriend: "[Quill plays something slow without being asked. Doesn't make eye contact. Plays until the song ends.] Better?"
  },
  pachelbel: {
    impartial: "Come back when you can track your decisions. I'm not dealing with this.",
    friendly:  "I don't deal with people in altered states. Not a moral thing — a precision thing. Come back tomorrow.",
    dearFriend: "Sit down. Not for business. Just — sit down. There's a chair."
  },
  weckmann: {
    impartial: "I know that bottle. You're not fighting tonight. Come back straight.",
    friendly:  "[Weckmann looks at you for a long moment.] You want to fight like this again? I'm not stopping you. I'm also not impressed.",
    dearFriend: "[Weckmann pours his own glass. Sets it on the counter. Doesn't drink it.] I keep this one for after. Sit."
  },
  bruhns: {
    impartial: "The depth survey requires a clear head. Come back when you have one.",
    friendly:  "Rough Whiskey before a research briefing. Bold choice. What's going on?",
    dearFriend: "Froberger used to do that. Before the hard caves. I asked him once why. He said: 'so I don't overthink it.' Did it work for you?"
  }
};
```

### Rendering Logic

```js
function _checkRoughWhiskeyReaction(npcKey) {
  if (!S_story.roughWhiskeyActive) return null;
  const reactions = ROUGH_WHISKEY_REACTIONS[npcKey];
  if (!reactions) return null;
  const fav = S_story.npcFavorability[npcKey] ?? 0;
  if (fav >= 2) return reactions.dearFriend || reactions.friendly;
  if (fav >= 1) return reactions.friendly;
  return reactions.impartial;
}
```

If a reaction exists, it replaces the normal NPC dialogue for this visit (does not consume a visit-count cycle — the player doesn't lose a regular quote slot). After the reaction, the whiskey effect can still trigger combat at CY.

The item teaches you who these people are. You see their care — or their professionalism — or their concern — in four sentences.

---

## VII. Covenant Standing — Character Sheet Element

`_curseScore()` is never displayed as a number. Instead, after Act III, the character sheet gains a new row: **Covenant Standing**.

The value is one of five strings, mapped to score brackets:

```js
const COVENANT_STANDING_LABELS = [
  { maxScore: -6,  label: "Covenant Keeper",  desc: "The people you helped are the reason this works." },
  { maxScore:  0,  label: "Warden",            desc: "You carry the work with you. It shows." },
  { maxScore:  7,  label: "Keeper",            desc: "The seal holds. The cost is visible." },
  { maxScore: 14,  label: "Watcher",           desc: "You know what needs doing. You're still learning to stay." },
  { maxScore: Infinity, label: "Wanderer",     desc: "The Void will open again. Not your fault. Not entirely." }
];

function _covenantStanding() {
  const score = _curseScore();
  return COVENANT_STANDING_LABELS.find(b => score <= b.maxScore);
}
```

The character sheet row:

```
Covenant Standing:  Warden
                    "You carry the work with you. It shows."
```

The labels appear in Sweelinck's ending speech. The player sees "Warden" in their character sheet for 40 hours, then Sweelinck says "you were a Warden" in the final scene — and they understand. The game never explains the connection. The player makes it.

The label unlocks at Act III rather than immediately, because before that, there's not enough data to meaningfully evaluate. Before Act III, the sheet shows: `Covenant Standing: Unknown`.

---

## VIII. Pit Training as Skill Tree

Weckmann's training (tracked via `pitTrainingWins`) unlocks a 5-perk tree. The perks are permanent — they live in `S_story.pitPerks: []` and are applied at combat start.

### The Five Perks

| Visits | Perk Name | Effect |
|--------|-----------|--------|
| 1st | Controlled Aggression | +1 to attack rolls when flanking (adjacent ally or terrain advantage) |
| 2nd | Read the Room | Before combat begins, see the enemy HP tier (Low / Mid / High / Dread) |
| 3rd | Ground Game | On critical hit, bonus action: shove attempt (no action cost) |
| 4th | Corner Work | At DK or CY nodes: recover 1d4 HP between combat rounds |
| 5th | Weckmann's Lesson | Once per rest: when HP drops below 20%, bonus action: Recompose — cancel disadvantage on next attack |

### Unlock Flow

```js
function _checkPitPerkUnlock() {
  const wins = S_story.pitTrainingWins;
  const perks = S_story.pitPerks ?? [];
  const perkList = ['controlledAggression','readTheRoom','groundGame','cornerWork','crovsLesson'];
  const nextPerk = perkList[perks.length];
  if (wins > perks.length && nextPerk) {
    S_story.pitPerks = [...perks, nextPerk];
    _showPerkUnlock(nextPerk); // overlay: "CROV'S LESSON UNLOCKED — [description]"
  }
}
```

### The Unlock Overlay Text

```js
const PIT_PERK_UNLOCKS = {
  controlledAggression: {
    title: "Controlled Aggression",
    crov:  "You're not swinging harder. You're swinging when it counts. That's the difference."
  },
  readTheRoom: {
    title: "Read the Room",
    crov:  "Bruna could tell a fighter's gas tank by the third exchange. You're getting there."
  },
  groundGame: {
    title: "Ground Game",
    crov:  "When you put them down, keep them down. First rule of the pit."
  },
  cornerWork: {
    title: "Corner Work",
    crov:  "The corner is where you recover. Go to the corner. Let the corner do what the corner does."
  },
  crovsLesson: {
    title: "Weckmann's Lesson",
    crov:  "When everything goes wrong — and it will — you stop, you breathe, you start again. That's the whole lesson."
  }
};
```

Each unlock is voiced by Weckmann. The last one — Weckmann's Lesson — is the perk that most directly saves your life. It's also the one that sounds the most like something Weckmann needed to hear himself.

---

## IX. Froberger's Last Note — The Item That Is Only Found

**Item:** `froberger_last_note`  
**Icon:** 📜  
**Type:** `key_item` (no sell value, cannot be dropped)  
**Description:** *A scrap of parchment. Froberger's handwriting — but lighter than the journal. Like it was written carefully. Like it was meant to last.*

**Text (rendered in full when inspected):**

---

*If you find this — you're somewhere difficult.*

*The person you're becoming is visible from outside. People can see the shape of it before you can.*

*Check in with someone who knew you before you got good at this. Ask them what's different.*

*They'll tell you something true. It might not be comfortable. That's how you know it's true.*

*Whatever they say — stay long enough to hear the second sentence.*

*— F*

---

**Where it's found:** One EB node, chosen at save-seed initialization. Different each run. Cannot be in an EB node the player has already visited (so it's always reachable, always discoverable). Located in the loot of that node's combat — not a quest drop, not a vendor purchase. Just there, in the chest.

If the player inspects it before speaking to any NPC: Froberger's warning predates the relationships. The player is told to check in before they have anyone to check in with.

If the player inspects it after reaching Dear Friend with anyone: they have someone to ask. The parchment means something different.

The game doesn't track which moment the player reads it. Froberger didn't design the timing. He just left it.

---

## X. New Game+ Memory Hooks

NG+ preserves `npcFavorability`, `pitPerks`, and `ngPlusRun`. On first visit to relevant nodes, NPCs have alternate first lines that acknowledge the return.

### NG+ First-Visit Lines

```js
const NPC_NG_PLUS_GREETINGS = {
  yael:      "You again. I wondered if you'd come back. I set the patrol route to account for it.",
  brynn:     "Oh. You're back. The corner room's been ready. I don't know why I kept it.",
  couperin:  "I thought you might. I've been working on something new. It's not done. Come back when you've been to the pit.",
  pachelbel: "I know what you're here for. The code hasn't changed. Neither have I. That's not a bad thing.",
  weckmann:  "Back for more. Good. The tree starts over — we build what you've earned again, right.",
  bruhns:    "The depths are different this run. I have new data. I need your eyes again."
};
```

The pit perk tree resets on NG+ (the perks were earned in a different life) but unlocks faster — each perk requires one fewer training win than the previous run. By the third run, Weckmann's Lesson unlocks after one session.

The game says nothing about why. Weckmann doesn't explain. He just nods when you arrive and says: "Faster this time. That happens."

### The Title Screen — NG+ Overlay

On NG+ run start, before the title animation completes:

```
Sweelinck is waiting.
```

Fades before the title appears. Can't be paused or screenshot. It's there for one breath.

---

*lab-report-endings-and-echoes.md — Layer 43 design document*  
*Generated 2026-05-22 — roll2hit.com / Codex of Conquest*


---
*© 2026 roll2hit.com — MIT License. See [LICENSE](LICENSE) for full text.*
