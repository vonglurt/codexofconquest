<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report — The Living World: Off-Screen Life, World Progression, and Map Memory

*roll2hit.com / Codex of Conquest — Layer 44 Design Document*

---

## I. The Design Principle

Most RPG worlds wait. The city pauses when you leave. The NPCs freeze in their last position. The debt doesn't grow. The structural report doesn't get filed. Nothing happens until the player triggers it.

The Codex of Conquest world doesn't wait.

This isn't a simulation. Auros doesn't actually file her report on a timer. Quill's debt doesn't accrue in real seconds. But the *impression* that these things are happening — that the world has momentum independent of the player — is achievable with a small number of carefully placed state transitions triggered by game milestones (act transitions, specific node visits) rather than by player action.

The goal is this feeling: you came back to Birka and it was still running without you. Brynn's inn is open. Yael is on patrol. Quill's debt is worse than you left it, if you left it. The city doesn't need you. It just happens to be glad you came back.

This is the antidote to the Curse of Knowledge. The world is not a problem waiting for you to solve it. It's a world. It was going before you arrived. It'll go after you leave.

---

## II. The Off-Screen Character — Gigault

Gigault is mentioned by two NPCs:
- Yael (Friendly): "Gigault runs the bread stall on Conclave Way. She goes home an hour early when there's going to be trouble. I use her schedule to calibrate mine."
- Brynn (Friendly): "Gigault's the one who notices when the city is wrong before anyone else does. I don't know how. She just does."

Gigault is never interactable. The player can visit the market node and see her stall — a visual element, bread displayed, sign up — but she is always:
- Mid-conversation with a customer (back turned)
- Just left (stall unattended, still warm)
- Out of stock (sign reads "Tomorrow")

She has no dialogue. She has no quest. She cannot be interacted with.

She is named by two people. She affects the world (Yael calibrates her patrol to Gigault's schedule). She exists.

### Why Gigault Works

The Curse of Knowledge makes capable people into problem-solvers. The game teaches the player: not everything is a problem. Some things are just there. Some people are just living. Gigault is not a quest giver. She's not a merchant. She's not a source of information. She's a person in the city who goes home early when trouble is coming.

The player who tries to interact with her and can't will feel either frustrated (if they want everything to be useful) or delighted (if they understand the game is showing them something about the scale of the world). This is intentional. Gigault is the test.

### Implementation

```js
// At market node: render Gigault's stall as a static HTML element
// No click handler. No NPC profile.
// Three variants based on time-of-day or game-day parity:

const PETRA_STALL_STATES = [
  `<div class="npc-ambient">Gigault's bread stall — a customer is blocking your view of the counter. You can see fresh loaves. You can smell them.</div>`,
  `<div class="npc-ambient">Gigault's bread stall — unattended. The loaves are still warm. A handwritten sign: <em>Back at ninth bell.</em></div>`,
  `<div class="npc-ambient">Gigault's bread stall — sold out. The sign reads: <em>Tomorrow</em>. The stall is clean.</div>`
];

function _getGigaultState() {
  return PETRA_STALL_STATES[S_story.gameDay % 3];
}
```

The stall cycles through states. Gigault is never there. She's always just been there.

---

## III. World Progression Events

These are state transitions that trigger at game milestones regardless of player action. They are not quests. They don't appear in the journal as quests. Some of them appear as journal notes — brief, atmospheric, unrewarded.

### Event Table

| Trigger Condition | Event | Journal Note |
|------------------|-------|--------------|
| Act III reached + `bruhnsDepthsReported = true` | Auros submits structural survey | "Structural assessment submitted — Auros's name on the cover page." |
| Act V reached + Quill quest never started | Quill's debt threshold crossed | No journal note — Quill's dialogue changes silently |
| Act IV reached + `pachelbelPaidBack = true` | Raison's family stabilizes | "A courier delivered something to BA. Pachelbel signed for it." |
| Act III reached + `brynnsJournalRead = true` | Daughter sends a letter | "A letter arrived for Brynn at the inn. The seal is from the Heartwood district." |
| Act V reached + `yaelEscortUsed = true` | Second report filed | "City records show a new internal affairs submission. Source: anonymous. It wasn't anonymous." |
| Act VI reached + Weckmann at Dear Friend | Thursday class starts | "Weckmann added a second training session. Thursdays, younger fighters." |

### Rendering

World progression events render as journal entries of a distinct type: `type: 'world'`. They have a different visual treatment — smaller text, no quest tag, no reward line.

```js
const WORLD_JOURNAL_STYLE = `
  .journal-entry.world {
    font-style: italic;
    opacity: 0.75;
    border-left: 2px solid #4a6;
    padding-left: 8px;
    font-size: 0.88em;
  }
`;
```

The player may miss these entirely if they don't check the journal. They will miss them. The world doesn't stop to make sure you noticed.

### Quill's Debt Degradation

```js
function _updateCouperiDebt() {
  if (S_story.quillQuestComplete) return; // debt resolved
  const actThreshold = 4; // Act IV
  if (S_story.actNumber < actThreshold) return;
  if (!S_story.couperiDebtDegraded) {
    S_story.couperiDebtDegraded = true;
    // Silently add flag — no journal entry, no notification
    // Quill's impartial pool now includes:
    // "The number is a number now. I don't look at it anymore."
  }
}
```

This is called at each act transition. No fanfare. No message. Quill's dialogue is just different when you find him in Act IV.

---

## IV. Map as Memory — Warmth Gradient

The minimap in the current game shows visited/unvisited nodes in standard colors. Extension: add a second color layer based on what happened at each node.

### Color Logic

```js
function _getNodeMapColor(nodeSlug) {
  const baseColor = S_story.visitedNodes.has(nodeSlug) ? '#555' : '#222';
  
  // Warm tint for NPC friendship
  const npcKey = NODE_NPC_KEYS[nodeSlug]; // lookup: which NPC lives here?
  const fav = npcKey ? (S_story.npcFavorability[npcKey] ?? 0) : 0;
  const warmth = fav * 20; // 0, 20, 40, 60 units of warmth
  
  // Glow for returned EB quests
  const ebReturned = S_story.ebReturns?.[nodeSlug] ?? false;
  
  if (ebReturned) return '#3a7a5a'; // green-tinted glow
  if (fav >= 3)   return '#8a6a3a'; // warm amber (Dear Friend)
  if (fav >= 2)   return '#6a5a3a'; // warm copper (Friendly)
  if (fav >= 1)   return '#5a4a3a'; // faint warm (Quest-Active)
  return baseColor;
}
```

### NODE_NPC_KEYS Lookup

```js
const NODE_NPC_KEYS = {
  CI: 'yael',
  IN: 'brynn',
  TV: 'quill',
  BA: 'deacon',
  CY: 'crov', // also 'auros' — use max of both
  SQ: 'crane',
  // EB nodes: keyed to their NPC slug
};
```

The minimap becomes a record of what the player did without labeling it. A player who helped everyone sees a warm map. A player who killed everything sees a cold one. The map is not a score — it's a memory.

---

## V. Corridor Farewell System

When a player leaves a node where a Friendly NPC lives, the first corridor panel shows a one-line farewell from that NPC. Small italic header at the top of the corridor card.

### Data Structure

```js
const NPC_FAREWELLS = {
  yael: {
    CI_to_SW: "Yael: 'Watch the southern road. It floods after rain and the footing's bad.'",
    CI_to_IN: "Yael: 'Brynn's fine. Don't fuss at her. She doesn't want fussing.'",
    CI_to_SQ: "Yael: 'Long road to Tilbury. Come back with news.'",
    default:  "Yael: 'Move well.'"
  },
  brynn: {
    IN_to_CI: "Brynn: 'Yael knows this city better than the map does. Trust her.'",
    IN_to_TV: "Brynn: 'Tell Quill to eat something.'",
    default:  "Brynn: 'The room'll be here when you get back.'"
  },
  couperin: {
    TV_to_CI: "Quill: 'Yael's on the south corner at seventh bell. She knows the quiet routes.'",
    TV_to_DK: "Quill: 'Reims keep's got a different sound. You'll know what I mean when you hear it.'",
    default:  "Quill: 'Safe roads.'"
  },
  pachelbel: {
    BA_to_CI: "Pachelbel: 'Yael's all right. Don't tell her I said so.'",
    BA_to_CY: "Pachelbel: 'Weckmann runs a clean pit. Don't embarrass yourself.'",
    default:  "Pachelbel: 'Watch what you carry.'"
  },
  weckmann: {
    CY_to_SW: "Weckmann: 'Ground's soft on the SW road past the second marker. Step wide.'",
    CY_to_DK: "Weckmann: 'Reims keep's not hard. It's just dark. Different problem.'",
    default:  "Weckmann: 'Come back standing.'"
  },
  bruhns: {
    CY_to_IS: "Auros: 'The Ironshell node has subsidence in the northwest corner. Don't stand there.'",
    default:  "Auros: 'Document what you see.'"
  }
};

function _getFarewell(fromNode) {
  for (const [npcKey, farewells] of Object.entries(NPC_FAREWELLS)) {
    const fav = S_story.npcFavorability[npcKey] ?? 0;
    if (fav < 2) continue; // only Friendly+ NPCs send farewells
    const homeNode = Object.keys(NODE_NPC_KEYS).find(k => NODE_NPC_KEYS[k] === npcKey);
    if (homeNode !== fromNode) continue;
    // Find route-specific or use default
    // ... route lookup logic
    return farewells.default; // simplified
  }
  return null;
}
```

The farewell renders as a single italic line at the top of the corridor card. It disappears after one step. The NPC doesn't know they said it. It's just the kind of thing they'd say.

---

## VI. The Third Act Weight

After Act III, the world shifts. This is already planned (sky color change). Extension: NPC dialogue registers the weight.

### Third Act Dialogue Pool

Every Friendly+ NPC gets a small Act-III-specific dialogue injection — one line that cycles into their pool only after `S_story.actNumber >= 3`.

```js
const NPC_ACT_THREE_LINES = {
  yael:   "Rough stretch. I can see it in how you're moving.",
  brynn:  "You look tired. Sit down for a minute. The world can wait one minute.",
  quill:  "[Quill just nods when you arrive. Starts a slower song without asking.]",
  deacon: "You've been east. I can tell. Take a breath before you tell me what you need.",
  crov:   "You're carrying something. Not in your pack. Come train. It helps.",
  auros:  "The readings are worse. I know you know. Sit down."
};
```

These lines cycle into the Friendly pool at Act III. They don't replace the existing pool — they're added to it, so the player may see them on any visit after Act III. The world acknowledges what's happening without narrating it.

### The Visual Shift

Beyond dialogue: NPC card backgrounds get a very subtle color desaturation (CSS `filter: saturate(0.85)`) after Act III. Not enough to be jarring — just enough that the player feels it before they notice it. The world is heavier. The image is slightly grayer. The text is still the same.

---

## VII. Brynn's Maintenance — Optional Helpfulness

At the IN node, after becoming Friendly with Brynn, a new interaction appears below the NPC card: **"🔧 Help with the inn."**

This is not a quest. It has no quest tag. There is no reward. Three maintenance options cycle, one available per game day:

```js
const BRYNN_MAINTENANCE_TASKS = [
  {
    label: "Fix the third step",
    action: () => { S_story.brynThirdStepFixed = true; },
    narration: "The step still creaks slightly. You've reduced it from a complaint to a murmur. Brynn notices. She doesn't say anything. She doesn't need to.",
    brynn_after: "It's better. Not perfect. Better is enough."
  },
  {
    label: "Bring firewood from the market",
    cost_gold: 2,
    action: () => { S_story.brynFirewoodBrought = true; },
    narration: "The fire burns better tonight. The kitchen is warmer than usual. Two guests comment on it.",
    brynn_after: "I was going to do that. Thank you."
  },
  {
    label: "Restock the kitchen pantry",
    cost_gold: 3,
    action: () => { S_story.brynPantryRestocked = true; },
    narration: "The ledger updates. The balance is still in the red — about five copper less red than before. Small correction. The kind that adds up.",
    brynn_after: "[She looks at the pantry for a moment.] I'll make soup tomorrow."
  }
];
```

### The Ledger

Inspecting the IN node has a secondary click target: the ledger on Brynn's counter. It opens a text panel:

```
BRYNN'S INN — MONTH LEDGER
—————————————————————————
Room nights (14 beds × 28 days avg 60% fill): 235 copper
Meals served: 84 copper  
Kitchen staff (part-time): 45 copper
Supplies (food, candles, soap, linen): 112 copper
Repairs (ongoing): 24 copper
—————————————————————————
BALANCE: -8 copper
```

The balance fluctuates based on player actions (restocking adds 3, firewood adds 2 to the meals figure, fixing the step reduces the repairs line by 4). The deficit can be brought to zero but not into surplus — Brynn keeps prices fair.

If the player brings the ledger to zero: one-time dialogue from Brynn. Not dramatic. Just: "Oh. That's the first time in three years." Beat. "Thank you."

This is all the reward. It is enough.

---

## VIII. Quiet Return Receipts

When an EB quest is completed and the player returns to the return node, the current system shows a quest-complete notification. Extension: replace or supplement this with a **quiet receipt** — a one-line acknowledgment from the relevant NPC or environment.

Not "Quest Complete!" Not a fanfare. Just:

```js
const QUIET_RETURN_RECEIPTS = {
  // EB quest returns — keyed to EB node slug
  ER: "The ranger takes the report without looking at it. Then looks at it. 'You actually went in.'",
  EF: "The forester marks something on her map. 'That's been undocumented for six years.'",
  ES: "The sea-watcher nods once. 'The tide knows you were there.'",
  // ... 17 more
  
  // Birka quest returns
  yael_ghetto:  "Yael marks two stops on the patrol route. She doesn't explain why in front of you.",
  quill_debt:   "Quill sets down the lute for a moment. Just for a moment.",
  deacon_redd:  "[Pachelbel holds the receipt for a long time. Then puts it in his coat.]",
  crov_pit:     "Weckmann says nothing. He sets up the training mat.",
  auros_depths: "Auros saves the data without looking up. Then: 'That's what I needed.'"
};
```

The quest-complete banner can remain for mechanical confirmation. The quiet receipt appears directly in the NPC card, as the NPC's dialogue for this visit — it cycles into their pool as a one-time entry, consumed after display.

The player who returns Yael's quest sees her mark the patrol route. Then she moves on. The world registers it without ceremony.

---

## IX. Pachelbel's Moral Code — Readable Object

At the BA node, below the vendor interface, a small element: **"📋 The code on the wall."**

Click to open a text panel:

---

*Pachelbel's Code — posted on the back wall of the salvage front, written in Pachelbel's handwriting, framed*

**One.** No goods taken by force from people who couldn't refuse.

**Two.** No goods that would leave a family without means to eat.

**Three.** Ask once about provenance. Believe the answer. If the answer turns out wrong, that's on the person who lied, not on me. If I had reason to doubt and didn't ask harder, that's on me.

**Four.** No desperate goods. If someone is selling because they need the coin badly enough to take half price, come back when they don't. If they come back again at half price, ask what's wrong. If they won't say, give them fair price and ask again next time.

---

This is displayed before the player ever interacts with Pachelbel. The code is public. He posted it on the wall.

Players who read it understand him. Players who don't will learn him differently — through quests, through dialogue. Both paths are complete. The code just skips to the thesis.

It is also the best description of how to play the game ethically. The game does not say this.

---

## X. The Void's First Sign

In Act I, at the WW cell nearest to SQ (which is the seal node) — one specific cell that will become traversable later — the minimap shows a faint flicker. Not a node, not a path. Just a pixel that isn't quite the same color as the water around it.

The player who clicks on it: nothing happens. The path calculation fails silently. No message.

By Act III: the flicker is gone. The cell is just WW.

By Act V: the cell is accessible — a one-tile traversable space with one line of text: *"You saw this before. It was waiting for you to be ready."*

No combat. No loot. A marker that the player either noticed or didn't. Either way, the marker was always there.

```js
// In minimap render function:
function _renderMinimapCell(r, c) {
  const slug = _getNodeAtCell(r, c);
  // ... standard render ...
  
  // Void's First Sign: special case
  if (r === VOID_SIGN_ROW && c === VOID_SIGN_COL && S_story.actNumber === 1) {
    return `<div class="minimap-cell void-flicker" 
                 style="animation: void-flicker 4s ease-in-out infinite;"></div>`;
  }
}

// CSS:
// @keyframes void-flicker {
//   0%, 100% { background: #1a1a2a; }
//   50% { background: #1e1e36; }  /* barely different */
// }
```

The flicker is barely visible. Players who stare at the map will notice. Players who use the map as a tool will not. The game offers it either way.

---

## XI. The Final Map Render

The last image of every ending variant (after the epilogue scroll, before credits) is the map, rendered in full.

All visited nodes visible. EB nodes that were returned glow green-tinted. NPC nodes glow by favorability tier (amber for Dear Friend, copper for Friendly). Unvisited nodes remain dark. The WW cells are dark blue — water, closed, no threat. SQ glows white.

```js
function _renderFinalMap() {
  // Full-screen overlay
  // Render every node in NODE_COORDS with color from _getNodeMapColor()
  // 3-second fade in
  // Hold for 5 seconds
  // Fade to black
  // Credits begin
  
  // No text on the map itself
  // No legend
  // Just: the picture of what you did
}
```

The player sees, in the shape of the light, what they visited and who they knew. A run where they helped everyone: a warm, partially lit map, glowing in the places where people lived. A run where they killed everything: a cold map, all visited nodes the same gray-green of cleared combat.

The map doesn't judge. It just shows.

---

*lab-report-living-world.md — Layer 44 design document*  
*Generated 2026-05-22 — roll2hit.com / Codex of Conquest*


---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
