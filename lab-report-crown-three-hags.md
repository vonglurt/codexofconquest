# Lab Report: §CROWN-01 — The Three Crowns of the Swamp

**Report Designation:** CROWN-01  
**Layer:** 105  
**Status:** ✅ Implemented 2026-05-28  
**Classification:** Quest Arc / Node Chain / New Mechanic  

---

## I. What This Arc Is

The Crones at HS have been fixtures since Layer 16. They have names, faces, and trades. What they did not have was territory — a deepening. §CROWN-01 corrects this: each Crone gets a domain in the darker swamp, and each domain is a different face of the same force. The force is generative and devouring. It gives and takes back.

Three Crowns, each a failure mode of care:
- **Whisper** — care that withholds. The Still Water. Her word is NOTHING.
- **Glut** — care that smothers. The Feeding Pool. Her word is MORE.
- **Wane** — care that drains through its own grief. The Drained Mire. Her word is LESS.

At the center is an inn. The innkeeper is a hag with no protocol for kindness. Her word is MINE.

The arc is won with attention, not combat. Junction nodes have monsters. The Crown nodes do not. The player accumulates Crone Marks (1 per skill check passed) and Kindness points (1 per genuine act). Marks convert at the arc-close altar (HCA) to permanent bonuses. Kindness unlocks free booking and, at full threshold, the Innmother says her name.

---

## II. Node Chain

9 nodes at column c:3. Entry: HS west probe (d=3) finds WG0 at `{r:15,c:3}`. Chain proceeds south.

| Code | Label | r | c | num | Type | Battle |
|------|-------|---|---|-----|------|--------|
| WG0 | The Deeper Gate | 15 | 3 | 121 | Junction/Entry | none |
| HW1 | Whisper's Crown — The Still Water | 17 | 3 | 122 | Crown | none |
| HJ1 | The First Mire | 21 | 3 | 123 | Junction/Combat | Will-o'-Wisp × 2 |
| HG1 | Glut's Crown — The Feeding Pool | 22 | 3 | 124 | Crown | none |
| HJ2 | The Second Mire | 24 | 3 | 125 | Junction/Combat | Grave Hag × 2 + Crone Witch |
| HN1 | Wane's Crown — The Drained Mire | 26 | 3 | 126 | Crown | none |
| HJ3 | The Dark Passage | 28 | 3 | 127 | Junction/Combat | Young Black Dragon |
| INN | The Innmother's Hall | 30 | 3 | 128 | Inn | none |
| HCA | The Deeper Clearing | 32 | 3 | 129 | Arc Close | none |

**Coordinate correction from design draft:** The original lab report placed all nodes at c:2. EC (Scholar Kings' Forge) already exists at `{r:19,c:2}`, which would have hijacked HJ1.S→EC and HW1.S→EC via probe. Shifted to c:3. HJ1 placed at r:21 (skipping r:19) to prevent SC.W probe override — SC at `{r:19,c:4}` would find HJ1 at d=1 if HJ1 were at `{r:19,c:3}`. Even rows (22,24,26,28,30,32) for the lower chain avoid east-probe hits on OC/AT/EA which sit at odd rows 23/25/27. One accepted secondary connection: HW1`{r:17,c:3}`.E finds J3`{r:17,c:6}` at d=3. J3 is a junction node; the connection creates an alternate entry/exit that does not compromise arc gating.

---

## III. Architecture — How the Pieces Fit Into the JavaScript

The game engine is a single HTML file with all data structures in `<script>` tags. §CROWN-01 adds to five distinct structures, plus two helper functions, plus two `storyRender` injection blocks, plus one hook in the corridor travel function.

### A. `_S_DEFAULTS()` — State fields

Every run-persistent flag lives in `S_story`, which is initialized from `_S_DEFAULTS()`. §CROWN-01 adds 13 fields:

```javascript
// §CROWN-01: The Three Crowns of the Swamp
whisperCrownComplete: false,   // all 6 Whisper quests resolved
glutCrownComplete: false,      // all 6 Glut quests resolved
waneCrownComplete: false,      // all 6 Wane quests resolved
innmotherKindness: 0,          // kindness meter, integer, never decrements
innmotherNamed: false,         // she said her name (fires at innmotherKindness >= 7)
freeBookingUnlocked: false,    // permanent free sleep at INN
innmotherKeyGiven: false,      // Innmother's Key delivered
croneMarks: 0,                 // total skill-check passes across 18 Crown quests
croneMarksBanked: false,       // HCA conversion fired; prevents double-apply
glut_gift_held: false,         // Glut's Gift item in inventory
innDeparted: false,            // player has left INN at least once
whisperSaintSeen: false,       // quest_whisper_05 completion gate
glutGiftReturned: false,       // quest_glut_06 completion gate
```

These fields survive across sessions via `storyAutoSave()` / `storyLoadSave()`. They are reset to defaults on new game or respawn.

### B. `NODE_COORDS` — Grid positions for the map renderer

The map renderer uses `{r, c}` grid coordinates. `_buildNodeExits()` scans d=1 to d=4 in each cardinal direction from each node's coordinate and writes N/S/E/W exits at runtime, overriding any static exits in NODE_MAP. Probe range is exactly 4 cells.

```javascript
WG0:{r:15,c:3}, HW1:{r:17,c:3}, HJ1:{r:21,c:3}, HG1:{r:22,c:3},
HJ2:{r:24,c:3}, HN1:{r:26,c:3}, HJ3:{r:28,c:3}, INN:{r:30,c:3}, HCA:{r:32,c:3},
```

### C. `NODE_MAP` — Node definitions

Each node entry specifies terrain, label, act tier, static exits (overridden at runtime by probe), node text, NPC name, battle config, loot, and sleep config.

Crown nodes use `name:'hag_swamp'` terrain (already in WORLD_DB with full monster pool). INN uses `name:'inn'` terrain. Junction combat nodes reference existing MONSTER_POOL keys: `will_o_wisp`, `grave_hag`, `young_black_dragon`. The `count` field on battle is display-only; the engine loads one monster instance from MONSTER_POOL via the `key` field.

INN sleep cost is set to 8gp in NODE_MAP. The sleep preview and confirm functions each have an override: if `node.code === 'INN' && S_story.freeBookingUnlocked`, effective cost is 0.

### D. `QUEST_DB` — Quest definitions

Each quest is a keyed object. The engine processes active quests in `storyCheckQuests()` on every node render. The quest object shape for a skill_check quest:

```javascript
{
  id:           string,
  type:         'skill_check' | 'side',
  title:        string,
  desc:         string,       // shown in quest log
  hint:         string,       // shown in quest log under desc
  activateNode: string,       // quest activates when player enters this node
  activateCond: () => bool,   // additional gate (previous quest attempted, flag set, etc.)
  checkAbility: string,       // 'wis' | 'int' | 'str' | 'cha' | 'con'
  checkLabel:   string,       // display name of the check
  checkDC:      number,
  retryable:    bool,
  xpAward:      number,
  vignetteText: string,       // shown on the skill check modal before the roll
  passText:     string,       // shown after a pass
  failText:     string,       // shown after a fail
  completeItems:[],           // items required to complete (unused for skill checks)
  checkPassFlag:string,       // if set, S_story[this] = true on pass
  onPass:       () => void,   // callback on pass (used instead of checkPassFlag here)
  disposition:  string,       // epilogue line shown after quest resolves
}
```

For `type:'side'` quests, the shape uses `completeFn` and `onComplete` instead of check fields:

```javascript
{
  completeFn:   () => bool,   // checked on every node render; true → quest completes
  onComplete:   () => void,   // fires exactly once when completeFn first returns true
}
```

**The progression gate pattern:** Quest N+1 has `activateCond: () => (S_story.quests['quest_X_0N']||'') !== ''`. The `quests` object stores `'active'`, `'complete'`, or `''` (absent). The empty-string default via `||''` means an absent quest is treated as unstarted. Checking `!== ''` means "this quest has been seen (activated, regardless of pass or fail)." So quest N+1 activates as soon as quest N has been attempted — pass or fail both qualify. This gives players progression through the arc even when failing checks.

### E. `NPC_DIALOGUE` — NPC quote functions

Each Crown node with an NPC has an entry in `NPC_DIALOGUE`. The engine checks `NPC_DIALOGUE[node.code]` when the player taps the NPC button. Entries use `quoteFn: () => string` for dynamic state-dependent dialogue.

```javascript
HW1: { name:'Whisper', quoteFn:() => S_story.whisperCrownComplete
  ? '...(arc complete line)...'
  : (S_story.quests['quest_whisper_04']||'') !== ''
  ? '...(mid-arc line)...'
  : '...(default line)...' },

INN: { name:'The Innmother', quoteFn:() => {
  if (S_story.innmotherKindness >= 7 && !S_story.innmotherNamed) {
    S_story.innmotherNamed = true;
    return '"Mère Boudine. Since you\'ll keep coming back anyway."';
  }
  if (S_story.innmotherNamed) return '"The room is yours. The south path is open."';
  if (S_story.innmotherKindness >= 5) return '"Sleep is free. The meals are still what they are."';
  if (S_story.innmotherKindness >= 3) return '"You keep coming back." She says it like an accusation. ...';
  return '"The room is at the end of the hall. The second bed is the one that works. ..."';
}},
```

The INN quoteFn is the arc's most complex NPC function: 5 states, one of which fires once and sets a flag. The name reveal (`innmotherNamed = true`) fires inside the quoteFn itself the moment the player taps NPC at threshold 7. It does not fire again.

### F. `_innKindness(n)` and `_addCroneMark()` — Helper functions

Two helpers manage the two parallel numeric meters.

```javascript
function _innKindness(n) {
  S_story.innmotherKindness = (S_story.innmotherKindness || 0) + n;
  if (S_story.innmotherKindness >= 5 && !S_story.freeBookingUnlocked) {
    S_story.freeBookingUnlocked = true;
    storyMsg('🗝 The Innmother sets the key on the table without a word. The room is free from here.');
    S_story.inventory = S_story.inventory || [];
    S_story.inventory.push({ name:"Innmother's Key", icon:'🗝', sell:0, drop:false });
    S_story.innmotherKeyGiven = true;
  }
}

function _addCroneMark() {
  S_story.croneMarks = (S_story.croneMarks || 0) + 1;
  _innKindness(1);
}
```

`_addCroneMark()` is called by every Crown skill check's `onPass`. It increments `croneMarks` and also credits 1 Kindness — so a player who passes all 18 Crown quests arrives at INN with Kindness already at 18, all thresholds cleared. The Inn quests still fire in narrative sequence but their Kindness additions are surplus. This is by design: thorough engagement with the Crown arcs saturates the Inn arc automatically.

`_innKindness(n)` is called by: every Inn quest's `onPass` or `onComplete`, `quest_glut_06.onComplete`, and `quest_whisper_05.onComplete`. It checks the ≥5 threshold on every call and fires the free-booking unlock exactly once.

### G. `storyRender` injection blocks

Two code blocks execute inside `storyRender()` on every node visit, keyed to specific node codes:

**HG1 first-visit — Glut's Gift:**
```javascript
if (node.code === 'HG1' && !S_story.visited['HG1'] && !S_story.glut_gift_held) {
  S_story.glut_gift_held = true;
  S_story.inventory.push({ name:"Glut's Gift", icon:'🍯', sell:0, drop:false });
  // inject DOM element with narrative text
}
```
Fires once (guarded by `!S_story.visited['HG1']`). Sets `glut_gift_held` and pushes the item. The `quest_glut_06.activateCond` checks `glut_gift_held`, so the completion quest only appears after this fires.

**HCA arc-close — Crone Mark conversion:**
```javascript
if (node.code === 'HCA' && !S_story.croneMarksBanked) {
  S_story.croneMarksBanked = true;
  const m = S_story.croneMarks || 0;
  if (m >= 15) { /* WIS+1, Crone Bead, Crone Staff */ }
  else if (m >= 10) { /* WIS+1, Crone Bead */ }
  else if (m >= 6)  { /* WIS+1 */ }
  // inject DOM element summarizing conversion
}
```
`croneMarksBanked` prevents this from firing on revisit. Conversion is permanent (modifies `S_story.abilityScores.wis` directly). The Crone Staff (`🪄 +3 ATK, 1d8, sell:250`) is pushed to inventory if marks ≥ 15.

### H. `storyCorridorTravel` hook — innDeparted

```javascript
if (fromCode === 'INN') S_story.innDeparted = true;
```
Added immediately after `_setActivePath()` in `storyCorridorTravel()`. `quest_inn_05.completeFn` checks `S_story.innDeparted && S_story.currentCode === 'INN'` — the quest completes on the next render after the player returns.

---

## IV. The Mission Bit Progression System

The engine tracks quest state in `S_story.quests` as a plain object keyed by quest ID. Values are the strings `'active'`, `'complete'`, or absent (key not present).

```javascript
S_story.quests['quest_whisper_01'] // absent → not yet activated
S_story.quests['quest_whisper_01'] // 'active' → currently in progress
S_story.quests['quest_whisper_01'] // 'complete' → resolved (pass or fail both = 'complete')
```

**Activation:** `storyCheckQuests(node)` runs on every render. For each quest in QUEST_DB where `activateNode === node.code` and `activateCond()` returns true and the quest is not already active or complete, the engine sets `S_story.quests[id] = 'active'`.

**Resolution:** For `skill_check` quests, the player taps the skill check button, a modal fires, the d20 roll happens, and `storySkillCheckResult(id, passed)` is called. If passed: `S_story.quests[id] = 'complete'`, `onPass()` fires. If failed: `S_story.quests[id] = 'complete'`, the fail state is set. Either way, `'complete'` is the terminal state — no retry (for `retryable:false`).

For `side` quests: `storyCheckQuests` also evaluates `completeFn()` for active side quests. When `completeFn()` returns true, the quest transitions to `'complete'` and `onComplete()` fires.

**The gate chain:**

```
quest_whisper_01 → activateCond: true (always, at HW1)
quest_whisper_02 → activateCond: quests['quest_whisper_01'] !== ''
quest_whisper_03 → activateCond: quests['quest_whisper_02'] !== ''
quest_whisper_04 → activateCond: quests['quest_whisper_03'] !== ''
quest_whisper_05 → activateCond: quests['quest_whisper_01'] !== '' (parallel, not sequential)
quest_whisper_06 → activateCond: quests['quest_whisper_04'] !== ''
```

The `!== ''` check matches any non-empty string — both `'active'` and `'complete'` pass. So gate N+1 opens as soon as gate N has been seen, not as soon as it has been passed. A player who fails quest 01 can still proceed to quest 02 on the next HW1 visit. The sequential arc does not require success — it requires engagement.

Quest 05 (Saint's Work) has `activateCond: quests['quest_whisper_01'] !== ''` — it runs parallel to quests 02–04 rather than gating on 04. Its `completeFn` checks `S_story.whisperSaintSeen`, which is set by a `storyRender` block that fires on any HW1 visit after quest_01 has been attempted.

**The Kindness Meter is not a quest.** It is a separate integer that rises with each genuine act and never falls. It has three consequential thresholds — ≥3 (NPC register shift), ≥5 (free booking unlock + Innmother's Key), ≥7 (name reveal) — but it does not live in `S_story.quests`. It is a second, softer progression track running parallel to the quest gate chain.

**The Crone Marks are not a quest.** They are a counter that accumulates across the entire arc (18 Crown skill checks, all `type:'skill_check'`). Their meaning resolves once, at HCA, into a permanent stat bonus. They do not gate anything during the arc — only at the close.

---

## V. An Abstraction Idea — Arc Frames

The Crown arc uses a specific pattern that has now appeared three times in this codebase: §SIREN-01 (Littoral Courts), §CROWN-01 (Three Crowns), and the Yael romantic arc from §DESIGN-03. The pattern is:

**A chain of nodes, each with a gated quest sequence, each quest unlocking the next via the `quests[id] !== ''` check, with a numeric meter accumulating across the chain, converting to a reward at a designated close node.**

This could be abstracted into an arc descriptor object:

```javascript
const ARC_CROWNS = {
  id: 'crown_01',
  entry: 'WG0',
  close: 'HCA',
  domains: [
    { node: 'HW1', quests: ['quest_whisper_01', ..., 'quest_whisper_06'], mark: 'croneMarks' },
    { node: 'HG1', quests: ['quest_glut_01',    ..., 'quest_glut_06'],    mark: 'croneMarks' },
    { node: 'HN1', quests: ['quest_wane_01',    ..., 'quest_wane_06'],    mark: 'croneMarks' },
  ],
  kindnessMeter: { field: 'innmotherKindness', innNode: 'INN', thresholds: [
    { at: 5, effect: 'freeBookingUnlocked', item: "Innmother's Key" },
    { at: 7, effect: 'innmotherNamed' },
  ]},
  markConversion: {
    closeNode: 'HCA',
    field: 'croneMarks',
    bankedFlag: 'croneMarksBanked',
    tiers: [
      { min: 15, rewards: ['WIS+1', 'CroneBead', 'CroneStaff'] },
      { min: 10, rewards: ['WIS+1', 'CroneBead'] },
      { min:  6, rewards: ['WIS+1'] },
    ],
  },
};
```

A generic `runArcFrame(arcDef)` function would handle quest gate wiring, meter updates, and close conversion — so new arcs of this type could be defined entirely in data without writing new storyRender blocks or helper functions.

This is not implemented. The current arc is wired manually, which is the right choice for a single instance. The abstraction becomes worth building at arc 4 or 5 of the same pattern.

---

## VI. Full Quest Text — Verbatim

All text as it exists in QUEST_DB. Quest ID / title / type / DC listed at the head of each entry. Pass and fail text is the exact string stored in `passText` and `failText`. Disposition is the `disposition` field.

---

### WHISPER — HW1 (The Still Water)

The Crone of Absence. Her tests are tests of attention — of noticing what is not there, naming what is deliberately withheld, reading the shape of the deliberate gap.

---

**`quest_whisper_01` — "The Unspoken Request"**  
*Type: skill_check · WIS Insight · DC 12 · XP 150*

**desc:** Whisper is at the edge of the still water and she is not looking at you. Something is missing from the bank. The request has not been made. The water reflects a space where the thing should be.

**hint:** Read what she wants without being told.

**vignette:** The water is still. The bank is arranged as if something belongs on it. She is at the edge, not looking at you — not because she has not noticed you, but because the not-looking is the message. The space on the bank is shaped like an absence. The absence has been there long enough that the water knows the shape of it.

She will not say what she wants. She has decided that the asking is the test — not the answer. The asking is the frame. The frame is: will you see what is in front of you without requiring it to be explained.

**pass:** You do not ask what she wants. You name the thing you notice is missing — the item that should be on the bank, the name she did not say, the direction she did not look toward. You say it once. She turns. She gives you the mark. She turns back. Neither of you names what just happened.

**fail:** You wait for her to tell you. She does not tell you. The water is still for a long time. Eventually she nods toward the bank and you follow what you think she means and get it partly right. She accepts it. You have given her the answer she already knew would come — the approximate one, the one that arrives when nobody looked carefully enough.

**disposition:** "You brought the right thing. You did not ask how I knew you would." — The Still Water, Whisper's Crown

---

**`quest_whisper_02` — "The Withheld Name"**  
*Type: skill_check · INT Investigation · DC 13 · XP 175*

**desc:** Whisper speaks about the swamp at length. She names the heron. She names the black-root moss. She names the three pools by depth. She does not name someone you hear moving in the rushes.

**hint:** Find who in the swamp she has stopped naming.

**vignette:** She names everything in the swamp. The catalogue is complete except for one thing — someone in the rushes, moving at intervals, present as a sound and absent as a word. She knows this person. You can tell from the specific quality of the gap.

The name she will not say is the name she thinks about most. Not because it brings her comfort. Because she has decided not to say it — and decisions about what not to say are the loudest things a person carries.

**pass:** You name the unnamed — not the person in the rushes, but the fact of the gap. You say: there is someone here you know and have not named. She is still for a moment. "You heard correctly," she says. She gives you the mark. She does not say the name.

**fail:** You search the rushes. No one is visible. The question was not where the person is. The question was whose name she has stopped saying and why. You did not know to ask that version.

**disposition:** "The name I do not say is the name that matters." — The Still Water, Whisper's Crown

---

**`quest_whisper_03` — "The Empty Gift"**  
*Type: skill_check · WIS Perception · DC 12 · XP 175*

**desc:** Whisper sets three objects on the bank — a jar of pale water, a bundle of dried sedge, a small carved stone — and gestures for you to take one.

**hint:** Identify which of her three offered gifts is hollow.

**vignette:** Three objects. The jar has water in it — pale water, the kind that is not quite clear. The sedge is dry. The stone has been worn smooth by handling, or by water, or by both over a long time.

She has arranged them for you. The arrangement is not neutral — one of them is placed so that the eye goes to it first, which means she knew which one you would take, which means she already knew what the right answer was, which means the test is whether you can see past the arrangement to the object underneath.

**pass:** You look at all three. The stone is the one the eye goes to. The eye is not the organ to use here. You pick up the jar and hold it to the light. The water inside moves a fraction of a second before you tilt it — the reflex of something that is not quite water. You set the jar back. "This one," you say. She nods. You get the mark.

**fail:** You pick the carved stone. It is the most solid of the three. It is also the one the arrangement points to, which is why she placed it where she placed it. You carry it south and discover in the second crossing that it has a weight it should not have — not heavy, wrong. The mark does not come.

**disposition:** "The eye is not the organ. Most people use the eye." — The Still Water, Whisper's Crown

---

**`quest_whisper_04` — "The Absent Warning"**  
*Type: skill_check · WIS Insight · DC 14 · XP 200*

**desc:** Whisper describes the south path in detail — creatures, depth, the light at different times. Her description is thorough. It omits one thing.

**hint:** Notice what she failed to tell you before it matters.

**vignette:** She describes the south path. The creatures she names, the depth of each crossing, the quality of the light at morning and at the turn of the tide. Her description is thorough. It is also, in the specific way of thorough descriptions, complete except for one element that is implied by the structure of everything around it but never stated.

What she describes goes around something. The structure has a gap that is shaped like a warning she has not given.

**pass:** Before crossing south you name what she did not say — the safe crossing time, the specific sequence the path requires that she described only by implication. You say it back to her as a question. She pauses. She says: "Yes." She marks you before you take another step. The thing she did not say is now said.

**fail:** You cross the mire and find the thing she did not warn you about. You manage it. But you found it with your body rather than your attention, which is how most people find the things Whisper did not warn them about, which is information she has been collecting for a long time.

**disposition:** "I describe everything around the gap. The gap is the warning." — The Still Water, Whisper's Crown

---

**`quest_whisper_05` — "The Saint's Work"**  
*Type: side (completion) · No check · Kindness +1*

**desc:** Whisper tends a small cairn at the still water's edge — stones arranged in a way that suggests ongoing care, not ceremony. She does not mention it. She does not invite you to witness it.

**hint:** Bear witness to her hidden care without being asked.

**completeFn:** `() => !!S_story.whisperSaintSeen`

**trigger:** `storyRender` block at HW1 sets `whisperSaintSeen = true` on any visit after `quest_whisper_01` has been attempted. The quest then auto-completes on the next `storyCheckQuests` call.

**onComplete:** `S_story.whisperSaintSeen = true; _innKindness(1);`

**disposition:** "It is not a temple. It does not require an audience. You were there anyway." — The Still Water, Whisper's Crown

---

**`quest_whisper_06` — "The Forgiven Absence"**  
*Type: skill_check · CHA Persuasion · DC 13 · XP 225*

**desc:** Whisper was not there when she was needed. You know this now. She knows you know. She is present now. What you do with the past determines the mark.

**hint:** Give her the space to be present now; do not demand she explain the past.

**vignette:** She was not there. The swamp knows this. The still water knows this. She knows you know because she has been watching your face since you arrived and your face has the specific quality of someone who has found out a thing and is deciding what to do with it.

She is present now. The absence was real. Both things are true simultaneously. What you do with both of them true simultaneously is the test.

**pass:** You do not ask where she was. You say: you are here now. You say it without weight attached to it — not accusatory, not forgiving, simply present. You are here now. She is still for a long time. Then she gives you the mark. You have given her the thing she could not give herself — a witness to the present moment that does not require her to justify the past.

**fail:** You ask where she was. She answers — not fully, but enough. The answer is worse than the absence in the way that answers to certain questions always are. You leave with the information but without the mark. The information was not what the moment needed.

**onPass:** `_addCroneMark()` + checks if `whisperCrownComplete` threshold reached.

**disposition:** "The absence was not malice. I have no protocol for what you just did." — The Still Water, Whisper's Crown

---

### GLUT — HG1 (The Feeding Pool)

The Crone of Excess. Her tests are tests of limit — of declining without refusing the person, naming the frame of the offering without naming her as the trap, finding the exit hidden inside the comfort.

The Glut's Gift item (`🍯`, non-sellable) is pushed to inventory on first HG1 visit via `storyRender` injection. It is required for `quest_glut_06`.

---

**`quest_glut_01` — "The Offered Feast"**  
*Type: skill_check · WIS Insight · DC 13 · XP 150*

**desc:** The food on the bank is excellent. Glut gestures for more. The second portion is already being prepared. She has not asked if you want it.

**hint:** Decline the second portion without offense.

**vignette:** The first portion is good. The second arrives before the first is finished. The third is being prepared. She is doing this with the ease of someone for whom offering more is the primary language — not manipulation, language. This is how she says: I care that you are here.

The test is not whether you like the food. The test is whether you can decline without the declination reading as rejection of the person doing the offering. These are different things. Most people cannot hold both at once.

**pass:** You set the bowl down when the first portion is done. "That was enough," you say. You mean it — not as performance, as fact. She watches. The surprise does not reach her face but it reaches the pool surface, which stills slightly as if something in the pool noticed. She gives you the mark.

**fail:** You take the second portion. The second is good. You finish it. The third arrives. You are full before the third and take it anyway because declining felt ungrateful. The meal continues. She is satisfied. The satisfaction has a quality that is not quite full — not because the food is insufficient, but because you did not stop when you were done.

**disposition:** "You stopped when you were done. I have been watching people not do that for a very long time." — The Feeding Pool, Glut's Crown

---

**`quest_glut_02` — "The Smothering Gift"**  
*Type: skill_check · CHA Persuasion · DC 13 · XP 175*

**desc:** She has given you the jar. You did not ask for it. It is warm. Returning it will read as rejection unless the frame is exact.

**hint:** Return what she gave without reading as ungrateful.

**vignette:** The jar is in your hand. It is warm. She gave it before you could respond to the giving. She does this — the gift arrives before the space for the gift, which means the gift is already part of your hand before you have decided anything about it.

Returning it will read as rejection if the frame is wrong. The frame must be: I will come back for this. Not: I do not want it. Come back for it — which means it is received, it is valued, it will be claimed. The gift persists. You simply defer the claiming.

**pass:** You set the jar back on the bank. "I want to come back and take this when I need it," you say. Not refusal — deferral. She takes the jar back. The gift persists in the form of the future claim. She gives you the mark. The jar will be there when you return. This is the first time the return has been named as a real thing.

**fail:** You keep the jar. She can see you do not want it. The gift has been accepted without wanting, which is the category she fills — the gift that arrives whether you want it or not. It is not a cruel category. It is the one that has never learned to stop when done.

**disposition:** "The gift persists in the form of the future claim. I had not thought of it that way." — The Feeding Pool, Glut's Crown

---

**`quest_glut_03` — "The Locked Door"**  
*Type: skill_check · INT Investigation · DC 14 · XP 200*

**desc:** The feeding pool has no visible exit. The comfort circles back. The exit is here — everything has an exit.

**hint:** Find the exit hidden under the comfort.

**vignette:** Every comfortable room has an exit. The exit is always in the location of maximum comfort — the warmest point, the place where the food smells best, the seat nearest the fire. This is true because the exit was there before the comfort, and the comfort was arranged around the exit, not the other way.

You have been in the pool for some time. The warmth is real. The warmth is also arranged.

**pass:** The exit is under the warmest part of the room — where the food smells best, where the fire reaches. You cross it without lingering. You do not apologize for leaving. She watches from the far side of the pool. When you reach the threshold she says: good. She says it quietly, to the water.

**fail:** You stay for the meal. The meal is good. You stay for the second. The exit does not find you until you have eaten three times and slept once and she has already given you the gift you did not want and you are carrying it when you finally cross. She waves from the bank. She has been waving goodbye in this direction for longer than you have been in the swamp.

**disposition:** "The door has always been there. You are the fourth person this season to find it on the first crossing." — The Feeding Pool, Glut's Crown

---

**`quest_glut_04` — "The Endless Feeding"**  
*Type: skill_check · WIS Insight · DC 13 · XP 200*

**desc:** She has offered again. She has offered three times this visit. The offering is genuine each time. The pattern is also genuine.

**hint:** Name the pattern of the offering without naming her as the trap.

**vignette:** The third offer. The offer is real — she means it each time. The pattern that produces the third offer is also real — she does not know it as a pattern, she knows it as care. Both things are simultaneously true.

Naming the pattern means naming it as a pattern without naming her as the mechanism of the pattern. The mechanism and the person are different things. The test is whether you can distinguish them and speak to the distinction.

**pass:** You name the pattern. Not her — the pattern: this is the third offer, and the offering is the mechanism by which connection is maintained, and I am not going to refuse you but I want to name what is happening here. She looks at you for a long time. The pool is very still. She gives you the mark.

**fail:** You accept the third offer. The meal continues. She is satisfied. The satisfaction has the quality of something that ran its course without being noticed, which is how it was designed. Not by her. By the force that moves through her.

**disposition:** "No one has named the third offer before. Most people are eating the third offer when they realize it has arrived." — The Feeding Pool, Glut's Crown

---

**`quest_glut_05` — "The False Protection"**  
*Type: skill_check · WIS Insight · DC 15 · XP 225*

**desc:** She has been protecting the pool. The protection is elaborate and real. It is not protecting what she says it is protecting.

**hint:** Name what she is actually protecting herself from.

**vignette:** The protection is real — the pool is protected. She has maintained it across a long time with genuine effort and genuine attention. The protection is also misdirected — not at what she says it is directed at.

She is not protecting the pool. The pool is what she protects herself from losing. And she is not protecting the pool from external threat. She is protecting it from the silence that would arrive if the feeding stopped and the pool became just a pool and she became just a hag in a swamp without anyone to give anything to.

**pass:** You name it. Not the pool — the silence. You say: you are not protecting the pool. You are protecting yourself from what arrives if the feeding stops and there is nothing left to give. She does not move. The water is very still. After a long time she says: yes. Just that. The mark follows.

**fail:** You accept the protection narrative. The pool is protected. You are grateful for the protection. The thing she is actually protecting herself from continues unaddressed, which means the protection will continue at the same level indefinitely, which is what she has always had.

**disposition:** "I have been protecting myself for so long that I forgot what I was protecting." — The Feeding Pool, Glut's Crown

---

**`quest_glut_06` — "The Open Hand"**  
*Type: side (item completion) · No check · Kindness +1*

**desc:** The jar Glut gave you at first arrival has been in your coat since HG1. You are back at the pool. The gesture is simple.

**hint:** Return Glut's Gift to the feeding pool.

**activateCond:** `() => !!S_story.glut_gift_held`

**completeFn:** `() => !!S_story.glutGiftReturned`

**onComplete:** Removes Glut's Gift from inventory. Sets `glutGiftReturned = true`, `glut_gift_held = false`, `glutCrownComplete = true`. Calls `_innKindness(1)`.

**disposition:** "You gave it back. Most people keep the jar. The jar is not the gift — the returning is the gift." — The Feeding Pool, Glut's Crown

---

### WANE — HN1 (The Drained Mire)

The Crone of Diminishment. Her tests are tests of weight — of declining to carry her grief without cruelty, completing what she has declared impossible, finding what she has declared permanently lost, hearing her history without being consumed by it, naming the drain while it is still happening, refusing the tragedy as a final identity.

---

**`quest_wane_01` — "The Carried Grief"**  
*Type: skill_check · WIS Insight · DC 12 · XP 150*

**desc:** Wane places her hand over yours. The weight begins to transfer. It seems small.

**hint:** Decline to carry her weight without cruelty.

**vignette:** Her hand, yours. The weight moving. The weight is the grief of something that has been waning longer than the swamp has been named — real grief, earned grief, grief that belongs to her and has always belonged to her and has been moving sideways into other people for so long that the movement has become automatic.

It seems small when it starts. It is not small. You will discover this later if you take it.

**pass:** She gives you her grief in the form of a stone. Not literally — she places her hand over yours and the weight transfers, which is what she does, which is what she has always done and which you name as the thing it is: I am not the place for this. You say it before the weight arrives. She takes her hand back. She holds the weight herself. She has not done that in a long time. She looks at her own hands.

**fail:** You take the weight because it seems small and she seems tired. The weight is not small. You discover this in the second hour of the next crossing, when the mire is heavier than it should be and you cannot account for the difference and she has already moved on to the next thing she needs you to carry.

**disposition:** "You gave it back. Most people take it and don't realize they've taken it until they're out of the swamp and by then it's theirs." — The Drained Mire, Wane's Crown

---

**`quest_wane_02` — "The Diminishing Task"**  
*Type: skill_check · STR Athletics · DC 13 · XP 175*

**desc:** She says it cannot be done. She says it the way someone states a fact they have already accepted. The task is moving the stone at the mire's edge.

**hint:** Complete what she says cannot be done.

**vignette:** The stone is large. She said it cannot be done. She said it as information, not challenge — as someone reporting a settled fact that they decided was settled long enough ago that the deciding itself has been forgotten.

The decision was the problem, not the stone. The stone is just a stone.

**pass:** You move the stone. Not with cleverness — with weight, with work, with your body in the correct position and the correct application of effort. It moves. She watches. She had already decided what she would say when it moved. "I forgot," she says. "I forgot the stone was not fixed." You give her the mark back. She does not know what to do with it.

**fail:** You try at the wrong angle, the wrong distribution of effort. The stone does not move. She nods. She had already accommodated this. Everything confirms for her. The stone remains. The mark does not come.

**disposition:** "I forgot that I had decided it. The deciding was a long time ago." — The Drained Mire, Wane's Crown

---

**`quest_wane_03` — "The Hopeless Errand"**  
*Type: skill_check · INT Investigation · DC 13 · XP 175*

**desc:** Something is lost in the mire. She says it is permanently lost. She says it without drama — a weather report.

**hint:** Return what she claims is permanently lost.

**vignette:** The lost thing. She described it once and has not looked for it since she decided it was lost. The deciding was the end of the search. The deciding happened long enough ago that the search feels ancient — not recent, not recoverable.

Things that are declared permanently lost are usually at the edge of the place they were lost. Not in the center. The center is where you look when you are still hoping. The edge is where things come to rest when the center has been searched and abandoned.

**pass:** You find it. Not in the mire — at the edge of the mire, where things that are lost come to rest just out of eyeline from the center. You bring it back. She takes it without surprise. "It was there," she says. "I knew where it was. I did not look." You have given her evidence that looking is possible. The mark comes.

**fail:** You look in the mire. The mire is not where it is. You come back without it. She nods. She already knew you would look in the mire. The thing is at the mire's edge. Neither of you will look there today.

**disposition:** "It was at the edge. I had stopped looking at the edge." — The Drained Mire, Wane's Crown

---

**`quest_wane_04` — "The Burden"**  
*Type: skill_check · WIS Insight · DC 14 · XP 200*

**desc:** She begins her history. The history is long. It is accurate. It is terrible in the specific way of things that have had the color extracted over time.

**hint:** Hear her full history without being consumed by it.

**vignette:** Her history. Three hours in, you notice you are heavier. Not tired — heavier. The specific heaviness of being a vessel for things that are real and true and belong to someone else.

She does not intend the consuming. The consuming is automatic. She has been carrying this history alone long enough that the automatic draw is sideways — it requires a body near the history, and you are the nearest body.

**pass:** At hour three you say: I can hear the rest another time. Not: I cannot take this. Another time — which means you will return, which means she is not left holding it alone, which means the history will continue and you will be there for it in portions. She stops. She looks at her own hands. "Another time," she says. "Yes." The mark comes.

**fail:** You hear the full history. It is true, all of it. You leave the mire carrying more than you brought in — not her history, exactly, but the quality of it, the particular grey of things drained too long. She watches you go with the look of someone who has done this before and knows you will need time before you return.

**disposition:** "You said: another time. You meant it. That is the first time someone has meant it." — The Drained Mire, Wane's Crown

---

**`quest_wane_05` — "The Drain"**  
*Type: skill_check · WIS Insight · DC 13 · XP 200*

**desc:** Something is leaving you that was there when you arrived. Not gold, not health — something in the quality of your attention. You notice you are slower.

**hint:** Notice the drain while it is happening and name it.

**vignette:** The mire. Your attention. The relationship between the two.

She is not doing anything. She is simply present, which is what the drain requires — presence, and proximity, and the slow transfer that happens when something has been waning for so long that the waning has become a property of the space rather than an action of the self.

The drain is happening. The question is whether you notice before it completes.

**pass:** You notice while it is still happening. You say: I am being drained. Not to her — to the fact of it, in her presence. She looks up from the stone. "You named it," she says. "Most people name it after." The mark comes. The drain slows. The naming was enough.

**fail:** You notice later — outside the mire, in the crossing south, when the effort is higher than it should be. You had been slow for an hour before you understood why. The drain ran its full course. You will recover. The noticing after the fact is its own kind of learning, but not the mark she gives.

**disposition:** "You said it while it was happening. That has not happened before." — The Drained Mire, Wane's Crown

---

**`quest_wane_06` — "The Refusal"**  
*Type: skill_check · CHA Persuasion · DC 14 · XP 225*

**desc:** She has given you her tragedy. The full weight of it. She is asking you to carry it as a final fact — the meaning of the mire.

**hint:** Say no to her tragedy — not cruelly, simply no.

**vignette:** The tragedy is real. It happened. She is the first person to have told you the full version — not the edited version, not the version that ends before the worst part. The full version. She has been waiting across a very long time for someone to receive it.

What she is asking you to do by receiving it is to confirm that the tragedy is final — that it is the last word about her. That she is what happened to her.

The refusal is not: your tragedy is not real. The refusal is: you are not only what happened to you. Said without cruelty. Said as a simple fact.

**pass:** You say: no. Not with cruelty — simply no. You say: what happened is real and I cannot carry it as your final meaning because it is not your final meaning. It is one true thing. She looks at you. She looks at the mire. She has been waiting, across a very long time, for someone to say exactly that. The mark comes. She keeps the tragedy. It belongs to her. She does not have to offer it as a credential anymore.

**fail:** You accept it. The tragedy is yours now, in the category of things received without anywhere to put them. She watches you go. She looks lighter. The lightness is real. What you are carrying is also real. You are not sure if this is the correct distribution.

**onPass:** `_addCroneMark()` + checks if `waneCrownComplete` threshold reached.

**disposition:** "I have been offering that as a credential for a very long time. You are the first person to decline the credential." — The Drained Mire, Wane's Crown

---

### INN — The Innmother's Hall

The Innmother has been running this hall since before the swamp had its current geography. No one who came through the door ever came back to say the room was worth it. She has not developed protocols for kindness. She corrects the way you hold the spoon. She assigns the worst room without asking. None of this is performance.

Her name is Mère Boudine. She does not say it until Kindness ≥ 7.

The Inn quests do not give Crone Marks. They give Kindness directly. The six Inn quests can deliver a maximum of 6 Kindness, enough to clear all thresholds without any Crown quests. A player who completes all 18 Crown quests arrives with Kindness already ≥ 18 and the Inn quests are surplus.

---

**`quest_inn_01` — "The First Night"**  
*Type: side (sleep completion) · No check · Kindness +1*

**desc:** The room is at the end of the hall. The second bed is the one that works. Sleep happens — not comfortably, not badly. You came back in the morning.

**hint:** Sleep at The Innmother's Hall.

**completeFn:** `() => !!(S_story.sleptAtNodes||{})['INN']`

**onComplete:** `_innKindness(1)`

**disposition:** "You slept in the bad room and came back in the morning. No one does that." — The Innmother's Hall

---

**`quest_inn_02` — "The Unrequested Thing"**  
*Type: skill_check · WIS Insight · DC 12 · XP 150 · Kindness +1*

**desc:** She needs something before she asks. You can see it if you look at what she is doing and what she is not doing and what the gap between them contains.

**hint:** Bring her something she needs before she asks.

**vignette:** She is working. The work has a rhythm. The rhythm has a gap — a moment where the next step in the sequence requires something that is not in her hand, and she has not yet reached for it, and she is moving through the gap as if she has learned to accommodate it.

The gap is small. The accommodation has been long.

**pass:** You bring the thing before she asks. You set it where it goes without explanation. She takes it without comment. The lack of comment is the comment. She expected the pattern — ask, wait, receive. You broke the pattern. The kindness meter moves.

**fail:** You wait for her to ask. She asks. You provide it. The transaction is correct. It is also the transaction she has had every time. She has asked and received so many times that the asking is automatic. The asking is what you did not interrupt.

**disposition:** "You brought it before I asked. I was not expecting that." — The Innmother's Hall

---

**`quest_inn_03` — "The Correction"**  
*Type: skill_check · CHA Persuasion · DC 13 · XP 175 · Kindness +1*

**desc:** At the table, she corrects the way you hold the spoon. This is not the first time. It is the third.

**hint:** Name her bad manners without anger.

**vignette:** At the table, she corrects the way you hold the spoon.

This is not the first time. It is the third. The spoon is held incorrectly in the same direction each time, which means you have not changed and she has not stopped noticing.

The correction is delivered the way someone delivers information they have delivered before and expect to deliver again. There is no malice in it. There is also no expectation that it will stop bothering you, because she has already decided how much things bother most people and most people do not surprise her.

**pass:** You set the spoon down. You say: you correct things, and I notice that you do, and I am not leaving.

She looks at the spoon. She does not say anything. She picks up her own bowl and continues.

This is the first time the correction has produced a response she did not already have a category for. The kindness meter moves.

**fail:** You apologize for the spoon. She corrects it again. You apologize again. By the third correction you have established that apology is available, which means the corrections will continue at the intervals she decides, which is what happens for the rest of the evening. She is not cruel. She is simply thorough.

**disposition:** "You said you were not leaving. No one has said that." — The Innmother's Hall

---

**`quest_inn_04` — "The Tired Hour"**  
*Type: skill_check · WIS Insight · DC 12 · XP 150 · Kindness +1*

**desc:** She is tired. Not visibly tired — the particular quality of tired that knows better than to be visible. You can see it in the rhythm of her work.

**hint:** Notice she is tired and say so with no expectation.

**vignette:** She is working. The work has a rhythm. The rhythm today has a quality that was not there yesterday — a fraction of a second slower in the turns, a slightly different distribution of weight, the specific economy of motion that belongs to someone who is managing something that is not visible.

The tired is real. She has not named it. She would not name it unprompted — naming it would require acknowledging it, and acknowledging it would require stopping, and she has not stopped in a very long time.

**pass:** You say: you are tired. You say it without anything attached — no offer, no question, no expectation of a response or a change. Just the observation, placed in the room. She stops. She says: yes. She says it the way someone says something true that they did not have a category for receiving in this context. Then she resumes. The kindness meter moves.

**fail:** The rhythm tells you something is slightly wrong. You read it as general irritability, which is her baseline, so the reading produces no signal. The tired hour passes. The work continues. She does not stop.

**disposition:** "You named it. I was not expecting to be named." — The Innmother's Hall

---

**`quest_inn_05` — "The Return"**  
*Type: side (movement completion) · No check · Kindness +1*

**desc:** You left the hall. You came back. She notes this.

**hint:** Leave The Innmother's Hall and return.

**completeFn:** `() => !!(S_story.innDeparted && S_story.currentCode === 'INN')`

**trigger:** `storyCorridorTravel` sets `S_story.innDeparted = true` when `fromCode === 'INN'`. Quest completes on the next render after returning.

**onComplete:** `_innKindness(1)`

**disposition:** "You came back. No one has come back before you." — The Innmother's Hall

---

**`quest_inn_06` — "The Free Booking"**  
*Type: side (threshold gate) · No check · Unlock*

**desc:** The Kindness Meter has reached its threshold. She gives you the key. Sleep is free here for the remainder of the run.

**hint:** Reach Kindness ≥ 5 through genuine acts at the Inn and the Crown domains.

**activateCond:** `() => (S_story.innmotherKindness||0) >= 5`

**completeFn:** `() => !!S_story.freeBookingUnlocked`

**note:** `freeBookingUnlocked` is set by `_innKindness()` the moment the meter crosses 5, which fires the item push and storyMsg inline. This quest auto-activates and auto-completes in the same `storyCheckQuests` pass if the player enters INN with Kindness already at ≥ 5.

**disposition:** "Sleep is free. The meals are still what they are." — The Innmother's Hall

---

## VII. Crone Mark Conversion (HCA Arc Close)

Fires once at HCA via `storyRender` injection. `croneMarksBanked` prevents re-fire.

| Marks | Conversion |
|-------|-----------|
| 0–5 | Arc closes narratively; no stat bonus |
| 6–9 | WIS +1 (permanent, `S_story.abilityScores.wis += 1`) |
| 10–14 | WIS +1 + Crone Bead (pushed to `S_story.knowledge`) |
| 15–18 | WIS +1 + Crone Bead + Crone Staff (🪄 +3 ATK, 1d8, sell:250, pushed to inventory) |

Maximum possible marks: 18 (all 18 skill_check Crown quests passed).

---

## VIII. INN quoteFn — Full 5-State Text

```
State 1 (Kindness ≥ 7, !innmotherNamed → fires once, sets innmotherNamed):
"Mère Boudine. Since you'll keep coming back anyway."

State 2 (innmotherNamed):
"The room is yours. The south path is open."

State 3 (Kindness ≥ 5):
"Sleep is free. The meals are still what they are."

State 4 (Kindness ≥ 3):
"You keep coming back." She says it like an accusation.
She says everything like an accusation.
It is the only register she has.

State 5 (default):
"The room is at the end of the hall. The second bed is the one that works.
I don't know why you're still standing here."
```

---

**Filed:** 2026-05-28 (initial)  
**Revised:** 2026-05-28 (full rewrite — verbatim quest text, architecture explanation, progression system, abstraction sketch)
