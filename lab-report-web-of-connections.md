<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — The Web of Connections: Froberger's Traces, NPC Cross-Relationships, and Hidden Histories

*roll2hit.com / Codex of Conquest — Layer 45 Design Document*

---

## I. The Design Principle

The player arrives in Birka having never been there. But Froberger was there before them. And the NPCs didn't start existing when the player walked in — they have histories with each other, debts and warmth and twelve-year-old arguments that were never fully resolved.

The web of connections is the thing the player discovers when they stay long enough. Not in a quest. Not in a journal entry. In Yael mentioning Weckmann offhand. In Brynn knowing Froberger's room number without being asked. In Quill and Pachelbel having a complicated history the player never gets the full story of.

The world is not assembled for the player's benefit. It predates them. They're discovering what's already there.

---

## II. Froberger's Traces

Froberger was in Birka. He stayed at Brynn's inn. He talked to Yael. He probably sat in the pit to watch a fight. He asked Auros about the depths.

Each major NPC has one memory of Froberger. It is delivered exactly once — never in the impartial state, never as a quest hook. It surfaces at Friendly or Dear Friend, on a specific visit, and then becomes part of their permanent pool. Once it's said, it doesn't disappear — it cycles with the rest of their dialogue.

The player who talks to every NPC enough times will reconstruct Froberger from the outside. Not the journal Froberger — the real-world Froberger, the one who left traces in people before the Void became urgent.

### FROBERGER_TRACES Const

```js
const FROBERGER_TRACES = {
  yael: {
    minFav: 2,
    visitTrigger: 3, // third Friendly visit
    text: "A researcher came through once. Froberger, he said. Knew every patrol route by the second day. Left without saying why. I assumed it was urgent. It usually is, with that type."
  },
  brynn: {
    minFav: 3,
    visitTrigger: 1, // first Dear Friend visit
    text: "He stayed in room 6. Very quiet. Read all night — I could see the light under the door. I brought him water twice. He said thank you both times. He left early. He didn't say goodbye, but he left the room cleaner than he found it. I think that's what he could manage."
  },
  couperin: {
    minFav: 2,
    visitTrigger: 2,
    text: "He came in once, sat at the back, didn't request anything. Just listened. At the end he said: 'You're good.' I said thank you. He said: 'I mean technically. There's something else. You'll find it or you won't.' And he left. I've been thinking about what the something else is ever since."
  },
  pachelbel: {
    minFav: 2,
    visitTrigger: 2,
    text: "He looked at the code on the wall for a long time. Then he said: 'You mean it.' Not a question. I said yes. He said: 'That's rarer than you think.' He bought one item. Left. I ran his description past three contacts afterward. Nobody had a file on him. I respected that."
  },
  weckmann: {
    minFav: 3,
    visitTrigger: 2,
    text: "Watched three fights. Didn't place a bet. At the end he asked me how long I'd been running the pit. I told him. He said: 'You still grieve it, don't you. That's why you run it clean.' I asked how he knew. He said: 'You watch the fighters like you're watching for something specific.' He wasn't wrong. I didn't ask him how he knew that."
  },
  bruhns: {
    minFav: 2,
    visitTrigger: 1,
    text: "He read my whole depth survey in one session. Three hours. No questions. At the end he said: 'The rate of change is accelerating. You have maybe two years before the first surface event.' I asked what he meant. He said he'd seen it three other places. He left before I could ask what happened to those places. I've been assuming the worst ever since. The data supports it."
  }
};
```

### Delivery Logic

```js
function _checkFrobergerTrace(npcKey) {
  const trace = FROBERGER_TRACES[npcKey];
  if (!trace) return null;
  if (S_story[`frobergerTrace_${npcKey}_delivered`]) return null;
  const fav = S_story.npcFavorability[npcKey] ?? 0;
  if (fav < trace.minFav) return null;
  const visits = S_story.npcVisitCounts?.[npcKey] ?? 0;
  if (visits < trace.visitTrigger) return null;
  // Deliver
  S_story[`frobergerTrace_${npcKey}_delivered`] = true;
  return trace.text;
}
```

When a Froberger trace is delivered, it replaces the normal dialogue for that visit. It does not consume a visit-count slot. After delivery, the trace text is added to the NPC's permanent Friendly/Dear Friend pool so it can resurface naturally.

### The Composite Picture

A player who collects all six Froberger traces knows:
- He was methodical (Yael: knew every patrol route in two days)
- He was gentle and somewhat defeated by the end (Brynn: left the room clean; couldn't manage a goodbye)
- He heard something in Quill that Quill still can't name
- He read Pachelbel's code and believed it was real
- He could see grief from the outside (Weckmann)
- He knew the timeline (Auros: two years; three other cities; didn't say what happened)

Together: a portrait of someone who was very good and very tired and running out of time and still stopping to say thank you when water was brought.

The journal shows Froberger's self-report. The traces show him through six other pairs of eyes. Neither is complete. Both are true.

---

## III. NPC Cross-References

NPCs who know each other mention each other. Not constantly — once or twice, at the right moment. The player builds the web by collecting mentions.

### The Connection Map

```
Yael ←→ Brynn    (Yael knows Brynn is tired; Brynn knows Yael is more than she shows)
Yael ←→ Weckmann     (mutual respect; Yael uses Weckmann's training record to assess fighters)
Yael — Pachelbel    (professional awareness; Yael knows what Pachelbel does; doesn't move on it)
Brynn ←→ Quill   (Brynn sometimes requests songs; Quill plays them for free)
Quill — Pachelbel   (complicated history around debt and a loan that was and wasn't a favor)
Weckmann ←→ Auros    (share the CY node; know each other's work; quiet mutual acknowledgment)
All → Gigault      (everyone mentions Gigault; Gigault mentions no one)
All → Froberger       (everyone has a trace; Froberger mentions no one who is still living)
```

### Cross-Reference Lines — Sample

These surface in the Friendly/Dear Friend pools as naturally cycling dialogue. Not triggered — just there, waiting.

**Yael on Brynn:**
- Friendly: "Brynn's been running that inn alone for six years. Nobody asks if she's managing. I ask. She says fine. I ask again. She says fine and pours tea. I count the tea as the real answer."
- Dear Friend: "If something happens to this city, Brynn will keep the inn open. That's not a prediction — that's a fact about who she is. I've been making sure the CI district stays stable partly because of that."

**Brynn on Yael:**
- Friendly: "Yael comes in on Tuesday nights. Always the corner table. Doesn't want food. Sits for an hour. I don't ask. I just make sure the fire's warm and nobody bothers her."
- Dear Friend: "She filed something last month. Wouldn't tell me what. She looked like someone who had just done the thing they should have done ten years ago. I know that look. I've been working on my version of it."

**Yael on Weckmann:**
- Friendly: "Weckmann's pit is one of the only clean operations in the district. I don't go in — conflict of interest — but I pay attention to who comes out. Mostly they come out standing. That's not nothing."

**Weckmann on Yael:**
- Friendly: "The guard captain checks on the pit results without checking on the pit. Smart. She knows what she needs to know without knowing what she can't unknow. I respect the line she's drawn."

**Brynn on Quill:**
- Friendly: "I asked Quill to play something slow last month. He came by the next evening. Didn't charge me. Played for forty minutes. He knows exactly when to stop."
- Dear Friend: "Quill is going to be fine. He's already fine, actually. He just doesn't know it yet because the debt number is still in his head. Once that's gone — he'll play like he used to. I heard him play before the Guild, once. Different sound. He'll get back to it."

**Quill on Pachelbel:**
- Friendly: "Pachelbel and I have a history. He lent me money when the Guild first came after me. He says it wasn't a loan. I say it was. We've been having this argument for four years. I think we both like having it."
- Dear Friend: "Pachelbel's code is real. I've tested it — accidentally. He turned down a deal I set up for a mutual contact because the margin was wrong by his code's standards. He didn't tell me he was turning it down. He just did. I found out later. That's when I understood the code isn't performance."

**Quill on Brynn:**
- Friendly: "Brynn asked for something slow last Tuesday. I was there Wednesday. She was doing the books while I played. She didn't look up. She looked less tired by the time I stopped. I count that."

**Pachelbel on Quill:**
- Friendly: "Quill says it wasn't a loan. It was. I let him say it wasn't because the alternative is that it was a gift, and Quill's too proud for gifts. So it's a loan we both know will never be repaid. That works fine."
- Dear Friend: "He's going to pay it back eventually. Not because he has to — because he'll want to. When he does I'll tell him to put it toward the next license payment. He'll argue. I'll win. It'll be fine."

**Weckmann on Auros:**
- Friendly: "Auros does her surveys at the bottom of the CY access shaft. I hear the equipment. I don't ask. She doesn't ask about the pit. We work in parallel. That's a good arrangement."
- Dear Friend: "She found something down there six months ago. I could tell by the way she came back up. She didn't say what. I didn't ask. But I've been keeping the pit fighters away from the north corner of the shaft since then."

**Auros on Weckmann:**
- Friendly: "Weckmann cleared the north access corridor last season without being asked. I think he knew I needed it clear. He didn't say anything. That's his way."
- Dear Friend: "I've been using the fighters he trains for depth security when the survey goes past the first threshold. They're calm under pressure. Whatever he's teaching them, it works down there too."

---

## IV. Nivers — The Eleven-Year Guard

Yael mentions Nivers in her Friendly pool: *"Eleven years on this corner. Same guard. Nivers. She hasn't called in sick once. She's either a machine or she's scared. I keep watching."*

Nivers exists at a minor intersection node between CI and IN — a patrol point that is traversable but not a full node. She is present every time the player passes through.

She has one line of dialogue.

```js
const MAREN_DIALOGUE = "Evening.";
```

That's it. She says "Evening." regardless of time of day. She has been saying it for eleven years. She will say it again.

If the player has Yael at Dear Friend: Yael's Dear Friend pool gains one addition — delivered once, after the player has passed Nivers's node at least three times:

*"Nivers's been on that corner for eleven years. You know what that takes? Not skill. Presence. The willingness to be there every single day when the world is not watching. I've tried to understand it. I think it's the thing I should be learning from her instead of the other way around."*

Nivers never gets a name tag. The game calls her "The Guard on the Corner." If the player asks Yael about her (a dialogue option in Yael's Friendly state): Yael says her name is Nivers. The player's journal gains a note: *"The guard on the corner — Nivers. Eleven years."* No quest. No reward. A name, given.

---

## V. Yael's Patrol — The Spatial Puzzle

Yael is stationed at CI. But she's on patrol. At certain times — morning (game day, even), afternoon (odd), evening (specific quest states) — Yael appears at secondary patrol nodes rather than at CI.

The player who visits CI and doesn't find Yael: she's somewhere else. The player who learns the pattern finds her in the field — one line of dialogue per field location, not available any other way.

### Patrol Node Table

| Condition | Yael's Location | Field Line |
|-----------|----------------|------------|
| Early game day (even) | CI (home) | Normal pool |
| Late game day (odd) | SW corridor entry | "Eastern check. You're traveling late." |
| After Ghetto quest complete | SL (Ghetto node) | "Showing my face. They should see someone who isn't making a report." |
| After escorting player | IN area | "I walk this route now. It adds six minutes. Worth it." |
| Dear Friend + Act III+ | TV/BA corridor | "Checking on Quill. Don't tell him." |
| EB quest active at ER | ER adjacent | "I know about the Redwater situation. I'm watching it from outside my jurisdiction. Don't ask me to do anything official." |

### Implementation

```js
const YAEL_PATROL_NODES = [
  {
    condition: () => S_story.gameDay % 2 === 1,
    nodeSlug: 'SW_ENTRY', // corridor node near SW
    line: "Eastern check. You're traveling late."
  },
  {
    condition: () => S_story.yaelGhettoQuestComplete,
    nodeSlug: 'SL',
    line: "Showing my face. They should see someone who isn't making a report."
  },
  {
    condition: () => S_story.yaelEscortUsed,
    nodeSlug: 'IN_APPROACH',
    line: "I walk this route now. It adds six minutes. Worth it."
  },
  {
    condition: () => (S_story.npcFavorability.yael ?? 0) >= 3 && S_story.actNumber >= 3,
    nodeSlug: 'TV_APPROACH',
    line: "Checking on Quill. Don't tell him."
  }
];
```

A player who figures out that Yael moves — and learns when and where — can collect lines that CI never shows. This is not a secret quest. It's just: Yael has a job. She does it. The player who pays attention finds her doing it.

---

## VI. Weckmann's Training Log — Readable Object

At the CY pit: a battered notebook hanging from a hook near the training mat. "📓 The training log."

The log is formatted as dated entries, earliest to latest. Bruna appears in entries from years ago. The player's own training appears near the bottom.

### Log Text (Full Rendering)

```
CROV'S TRAINING LOG — CY Fighting Pit
—————————————————————————————————————

Year 6, Day 14
New fighter — Cabanilles. Strong, untrained. Good instincts, no patience.
Note: patience is teachable. Instincts aren't. Worth the time.

Year 6, Day 31
Cabanilles left for the east contracts. Said he'd be back. He wasn't.
Good fighter. Hope he's using it.

Year 12, Day 8
Bruna — first session. Best natural footwork I've seen in six years.
He drops his left when he's tired. Told him. He'll fix it.

Year 12, Day 23
Bruna — pushed too far.
Note for next time: when a fighter says they're fine, check the footwork.
If they're still dropping the left, they're not fine.

[gap of two years]

Year 14, Day 3
Back.
Running legal fights only.

[twelve years of entries — fighters' names, brief notes, outcomes]

[Game Day 1, current run]
New fighter — [PLAYER_NAME]. Showed up without signing in.
Good instincts. Overcorrects left (different reason than Bruna).
Potential. Will see.

[Updates after each training win:]
Day 3: Better. Starting to listen.
Day 7: Reading the room now. Not just reacting.
Day 12: Controlled. Still aggressive at the wrong moments. Getting there.
Day 18: Good. Starting to feel like a real session.
Day 25: The lesson's in. Don't know when it happened. That's when you know.
```

The player's name is filled from `S_story.playerName`. Their log entries update after each `pitTrainingWins` increment. Bruna's entry is there, with no drama, in handwriting that got slightly shakier after day 23 and then steadied again by year 14.

The gap of two years is blank. No explanation. Weckmann said: *"Back."*

---

## VII. Room 6 — The Empty Room

Available at IN after Brynn reaches Dear Friend (`npcFavorability.brynn >= 3`). Below the maintenance interactions: **"🚪 Room 6."**

The room is at the end of the hall. The description when entered:

---

*Room 6.*

*It's clean. Brynn keeps all the rooms clean, but this one is slightly more so — the way a room gets when someone tidies it out of care rather than routine.*

*There's a mark on the wall near the window: a small sigil, scratched into the plaster. Not defacement — done carefully, at eye level, the kind of mark someone makes when they want to be able to find a place again.*

*The bed has two pillows. Brynn added the second one after the fact. She doesn't know exactly why. She changed the pillowcase last week even though no one had slept on it.*

*On the windowsill, almost under the sill itself, a scrap of paper. Not Froberger's journal pages — different paper, smaller. It slipped off the desk and was never found. In the same handwriting as the journal, but lighter:*

---

*— still here.*

---

*That's all.*

*You can't take it. It's not an item. It's a note that fell and stayed and will probably stay until the building does something else.*

*You look at it for a while.*

*You close the door behind you.*

---

After visiting Room 6, Brynn's Dear Friend pool gains one permanent addition:

*"He didn't say goodbye. I used to think that was the hard part. Now I think the hard part was that he thought he was coming back."*

---

## VIII. Cross-Item Connections

Items that connect NPC knowledge to player discovery.

### Froberger's Note + Auros

If the player has `froberger_last_note_read = true` AND visits Auros at Dear Friend:

Auros has a one-time dialogue trigger (delivered before her normal pool, consumed after delivery):

*"You found one of his notes. He left several. I found one in the depth access shaft — it described a structural feature that took me a year to verify was real. He'd been there in maybe three hours. He always knew exactly what to look for. I sometimes think the curse isn't that he couldn't connect — it's that he could see everything else so clearly that people just looked slow by comparison."*

This is the only in-game moment where someone explicitly names the Curse of Knowledge as a thing that happened to Froberger, from the outside. Every other reference is oblique. Auros is a researcher. She names things.

### Rough Whiskey + Brynn (seeing Pachelbel's stock)

When `roughWhiskeyInInventory = true` and the player visits IN:

Brynn (Friendly or higher) has a one-time triggered line:

*"Pachelbel's selling that now? He used to turn it away — said the margin didn't justify the trouble it causes. Must have changed his policy. Things do."*

This is one sentence connecting two nodes, two characters, one item. The world is denser for it. Brynn doesn't know why Pachelbel changed his policy. She noticed that he did.

### Fighter's Token + Weckmann (post-illegal-pit-quest)

After the illegal pit operation is shut down (Weckmann's quest complete), a new exploration appears at the now-closed lot:

A collapsed tarpaulin over a dirt fighting ring. Searching: one item drops — **Fighter's Token** (key item, no sell value). Small stamped metal disc with a fighter's number.

Bringing it to Weckmann at CY:

```
[Weckmann holds it for a long time.]
"I know this number. This is from Fischer's operation — 
he ran fights before I opened the legal pit. 
The fighter who had this token went on to 
compete legally. They're okay. They moved on."

[He sets it on the counter. Doesn't give it back.]

"Don't ask me how I know. I've been watching 
these numbers for twenty years."
```

Weckmann keeps the token. It's not in the loot pool after this interaction. It sits on Weckmann's counter for the rest of the game. A small thing that belongs there now.

---

## IX. The Composite Truth

When all of this is assembled — the six Froberger traces, the NPC cross-references, Nivers's Evening, Yael in the field, Weckmann's training log, Room 6, the cross-item connections — the player has built a portrait of Birka that the game never narrated directly.

They know:
- Froberger was here. He was good and tired and ran out of time.
- These people have known each other for years before the player arrived.
- The city is running because of things that happen at night, alone, without anyone watching.
- The debt gets worse if you leave it. The third step creaks until someone fixes it. The ledger is in the red.
- Nivers says Evening. She's been saying it for eleven years.
- There's a note in Room 6 that reads *"— still here."*

None of this was a quest. None of it was required. All of it is true about the place.

The Curse of Knowledge says: once you know how to fix things, you stop seeing the things that don't need fixing. You stop seeing things that just need witnessing.

The web of connections is the witness.

---

*lab-report-web-of-connections.md — Layer 45 design document*  
*Generated 2026-05-22 — roll2hit.com / Codex of Conquest*


---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
