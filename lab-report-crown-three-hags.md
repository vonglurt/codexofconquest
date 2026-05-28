# Lab Report: §CROWN-01 — The Three Crowns of the Swamp

**Report Designation:** CROWN-01  
**Layer:** 105 (PLANNED)  
**Date:** 2026-05-28  
**Classification:** Quest Arc / Node Chain / New Mechanic  
**Audience:** EE/CS background; implementation from this report directly

---

## Abstract

This report locks all data shapes for §CROWN-01 before any HTML edit. It covers NODE_COORDS for 9 new nodes, known probe-computed exit collisions, node number assignments, monster key resolution, all 24 quest IDs, all 10 state field names, all new item definitions, and the two new numeric mechanics (Kindness Meter, Crone Marks). Implementation proceeds from this document without returning to plan.md for schema decisions.

---

## I. NODE_COORDS — Exact Grid Positions

**Entry method:** HS (existing, `{r:15, c:6}`) west probe reaches column 2 at d=4. WG0 placed at `{r:15, c:2}` to make HS.W = WG0 bidirectionally. Chain proceeds south at column 2.

| Code | Label | r | c | num |
|------|-------|---|---|-----|
| WG0 | The Deeper Gate | 15 | 2 | 121 |
| HW1 | Whisper's Crown — The Still Water | 17 | 2 | 122 |
| HJ1 | The First Mire | 19 | 2 | 123 |
| HG1 | Glut's Crown — The Feeding Pool | 21 | 2 | 124 |
| HJ2 | The Second Mire | 23 | 2 | 125 |
| HN1 | Wane's Crown — The Drained Mire | 25 | 2 | 126 |
| HJ3 | The Dark Passage | 27 | 2 | 127 |
| INN | The Innmother's Hall | 29 | 2 | 128 |
| HCA | The Deeper Clearing | 31 | 2 | 129 |

All 9 nodes at column 2. Column 2 is unoccupied in the existing NODE_COORDS at rows 15–31. Littoral Courts chain at column 14 is 12 cells east — no probe conflict. Column 2's west probe lands at column 1 or lower for all nodes — nothing there, all W exits null.

---

## II. Known Secondary Probe Connections (Accept as Designed)

`_buildNodeExits()` probes up to 4 cells in each cardinal direction and takes the first hit. At column 2, the east probe (c=3,4,5,6) finds existing nodes in two rows:

| Node | Row | East probe finds | At d | Decision |
|------|-----|-----------------|------|---------|
| HW1 | 17 | J3 (Coastal Fork) | 4 | **Accept.** J3 already connects N=HS, creating a navigational triangle: HS↔WG0↔HW1↔J3↔HS. Adds alternative entry/exit. Does not compromise arc gating. |
| HJ1 | 19 | BE (Tropical Beach) | 4 | **Accept.** HJ1 is a combat junction. BE exit is a back-path out of the combat area, not a shortcut past it. Players arriving from BE side get dropped into the First Mire, which is appropriate. |

HG1 through HCA east probes (rows 21–31, c=3–6): nothing. No further secondary connections.

North probe from WG0 (`{r:15,c:2}`): probes r=14,13,12,11 at c=2 — nothing listed. WG0.N = null. ✓  
ES at `{r:13,c:4}` south probe: r=14,15 at c=4 — not c=2, no conflict. ✓

---

## III. Monster Key Resolution

### HJ1 — The First Mire

**Planned:** Will-o'-Wisp × 2  
**Key:** `will_o_wisp` — **confirmed in MONSTER_POOL** (AC:19, HP:22, ATK:+3, 2d8, tier:medium)  
**Drop:** `will_o_wisp` → "Will-o'-Wisp Spark", icon:'💡', sell:14 — confirmed in MONSTER_DROPS  
**Status:** Use as-is. No new entry required.

### HJ2 — The Second Mire

**Planned:** Bog Hag × 2 + Swamp Horror  
**`bog_hag` status:** NOT in MONSTER_POOL. `swamp_horror` also absent.  
**Resolution:** Use existing hag keys that fit the excess/smothering archetype:

| Battle slot | Key | Name | AC | HP | ATK | Dmg | Tier |
|-------------|-----|------|----|----|-----|-----|------|
| Main × 2 | `grave_hag` | Grave Hag | 15 | 112 | +7 | 3d6+3 | hard |
| Third | `crones_witch` | Crone Witch | 17 | 143 | +9 | 3d8+5 | hard |

`grave_hag` and `crones_witch` both confirmed in MONSTER_POOL and in hag_swamp terrain. Battle label: **"Grave Hag × 2 + Crone Witch"**. Drops confirmed in MONSTER_DROPS.

### HJ3 — The Dark Passage

**Planned:** Shadow Drake (solo boss)  
**`shadow_drake` status:** NOT in MONSTER_POOL.  
**Resolution:** Use `young_black_dragon` (confirmed in hag_swamp terrain; strong solo boss):

| Key | Name | Tier | Note |
|-----|------|------|------|
| `young_black_dragon` | Young Black Dragon | hard | Already in hag_swamp WORLD_DB entry. Solo. Fits "darkness that dims the passage." |

Battle label: **"The Dark Passage — Young Black Dragon"**. No new monster entry required.

---

## IV. Quest ID Freeze

All 24 quest IDs locked. Field names in `QUEST_DB` must match exactly.

### Whisper Quests (HW1)

| ID | Title | Type | checkAbility | DC |
|----|-------|------|-------------|-----|
| `quest_whisper_01` | The Unspoken Request | skill_check | wis | 12 |
| `quest_whisper_02` | The Withheld Name | skill_check | int | 13 |
| `quest_whisper_03` | The Empty Gift | skill_check | wis | 12 |
| `quest_whisper_04` | The Absent Warning | skill_check | wis | 14 |
| `quest_whisper_05` | The Saint's Work | completion | — | — |
| `quest_whisper_06` | The Forgiven Absence | skill_check | cha | 13 |

`quest_whisper_05` has no skill check. `activateCond` requires `quest_whisper_01` complete. `completeFn`: player visits Whisper's sacred site sub-location (a specific object in HW1 node; first-visit trigger). Sets `whisperSaintSeen: true`, fires Kindness +1 via `_innKindness(1)` helper.

### Glut Quests (HG1)

| ID | Title | Type | checkAbility | DC |
|----|-------|------|-------------|-----|
| `quest_glut_01` | The Offered Feast | skill_check | wis | 13 |
| `quest_glut_02` | The Smothering Gift | skill_check | cha | 13 |
| `quest_glut_03` | The Locked Door | skill_check | int | 14 |
| `quest_glut_04` | The Endless Feeding | skill_check | wis | 13 |
| `quest_glut_05` | The False Protection | skill_check | wis | 15 |
| `quest_glut_06` | The Open Hand | item_completion | — | — |

`quest_glut_06` has no skill check. Completes when player has `glut_gift` in inventory AND is at HG1. `completeFn: () => S_story.glut_gift_held && S_story.currentCode === 'HG1'`. On complete: removes `glut_gift` from inventory, sets `glutGiftReturned: true`.

### Wane Quests (HN1)

| ID | Title | Type | checkAbility | DC |
|----|-------|------|-------------|-----|
| `quest_wane_01` | The Carried Grief | skill_check | wis | 12 |
| `quest_wane_02` | The Diminishing Task | skill_check | str | 13 |
| `quest_wane_03` | The Hopeless Errand | skill_check | int | 13 |
| `quest_wane_04` | The Burden | skill_check | wis | 14 |
| `quest_wane_05` | The Drain | skill_check | wis | 13 |
| `quest_wane_06` | The Refusal | skill_check | cha | 14 |

`quest_wane_02` uses STR (the only STR check in the Crown arc — the task is physical, not interpretive). Acceptable variant: INT 13. Decision: use STR 13 as specced. If player lacks STR proficiency the DC still applies; Ceremonia Roll formula handles it.

### Inn Quests (INN)

| ID | Title | Type | checkAbility | DC | Kindness |
|----|-------|------|-------------|-----|---------|
| `quest_inn_01` | The First Night | sleep_completion | — | — | +1 |
| `quest_inn_02` | The Unrequested Thing | skill_check | wis | 12 | +1 |
| `quest_inn_03` | The Correction | skill_check | cha | 13 | +1 |
| `quest_inn_04` | The Tired Hour | skill_check | wis | 12 | +1 |
| `quest_inn_05` | The Return | movement_completion | — | — | +1 |
| `quest_inn_06` | The Free Booking | threshold | — | — | unlock |

`quest_inn_01` completion trigger: first sleep at INN. `activateCond: () => true`. `completeFn: () => S_story.sleptAtNodes['INN']`. Fires Kindness +1 automatically on sleep.

`quest_inn_05` completion trigger: `S_story.visited['INN'] && S_story.lastExitCode === 'INN' && S_story.currentCode === 'INN'`. Simplified: player departs INN (any direction) and returns. Use `S_story.innDeparted` flag set on first exit.

`quest_inn_06` has no traditional completion — it is the Kindness threshold gate. `activateCond: () => S_story.innmotherKindness >= 5`. On activate: fires `freeBookingUnlocked = true`, delivers storyRender injection, Innmother gives Innmother's Key item.

---

## V. State Field Names — Frozen

All `S_story` fields for §CROWN-01. Add to `_S_DEFAULTS()`.

```javascript
// §CROWN-01: The Three Crowns of the Swamp
whisperCrownComplete: false,   // all 6 Whisper quests resolved (pass or fail)
glutCrownComplete: false,      // all 6 Glut quests resolved
waneCrownComplete: false,      // all 6 Wane quests resolved
innmotherKindness: 0,          // kindness meter (integer, 0–7+, never decrements)
innmotherNamed: false,         // she said her name (fires when innmotherKindness >= 7)
freeBookingUnlocked: false,    // permanent free sleep at INN (innmotherKindness >= 5)
innmotherKeyGiven: false,      // Innmother's Key delivered; HCA S-exit unlocked
croneMarks: 0,                 // total skill-check passes across all 18 Crown quests
croneMarksBanked: false,       // HCA conversion fired; prevents double-application
glut_gift_held: false,         // Glut's Gift item in inventory; set on HG1 first visit
innDeparted: false,            // player has left INN at least once (quest_inn_05 gate)
whisperSaintSeen: false,       // quest_whisper_05 completion flag
glutGiftReturned: false,       // quest_glut_06 completion flag
```

Total: 13 new fields.

**Helper function:** `_innKindness(n)` — called wherever Kindness increments. Increments `S_story.innmotherKindness` by n, then checks thresholds:
- If ≥5 and !freeBookingUnlocked: set freeBookingUnlocked, trigger unlock storyRender.
- If ≥7 and !innmotherNamed: set innmotherNamed, update INN quoteFn to reveal name.

Called from: `quest_whisper_05.completeFn`, all six `quest_inn_*` pass paths, and each of the 18 Crown quest `checkPassFlag` handlers.

---

## VI. Crone Mark Mechanic — Implementation

Each skill_check PASS (not completion) among the 18 Crown quests increments `S_story.croneMarks`. Use `checkPassFlag` field + an `onPass` callback, or wire in `storySkillCheckResult()` to call `_addCroneMark()` when the quest ID prefix is `quest_whisper_`, `quest_glut_`, or `quest_wane_`.

**`_addCroneMark()`:** increments `croneMarks` by 1. No cap — theoretical max is 18.

**At HCA storyRender (arc close):**

```javascript
if (!S_story.croneMarksBanked) {
  S_story.croneMarksBanked = true;
  const m = S_story.croneMarks;
  if (m >= 15) { /* ASI +1, Crone Bead, Crone Staff */ }
  else if (m >= 10) { /* ASI +1, Crone Bead */ }
  else if (m >= 6)  { /* ASI +1 (ability score of choice) */ }
  // 0–5: no mark conversion; arc still narratively closes
}
```

ASI +1 delivery: add 1 to a player-chosen ability score. Use existing ASI modal (already in HTML for level-up). Gate: `croneMarks >= 6`.

---

## VII. Item Definitions

### Glut's Gift
```javascript
{ name:"Glut's Gift", icon:'🍯', sell:0, drop:false }
```
Obtained: first visit to HG1, added to inventory automatically via storyRender IIFE. Sets `S_story.glut_gift_held = true`. Not sellable. Removed on quest_glut_06 completion.

### Innmother's Key
```javascript
{ name:"Innmother's Key", icon:'🗝', sell:0, drop:false }
```
Obtained: quest_inn_06 unlock (Kindness ≥ 5). Not sellable. Required for HCA south exit? No — HCA is always accessible after INN. The Key is a narrative item that signals the arc close; it also functions as a trophy for quest tracking.

### Crone Bead
```javascript
{ name:'Crone Bead', icon:'🟤', sell:0, type:'knowledge', effect:'Swamp-lore knowledge bead — one question of the swamp answered' }
```
Added to `S_story.knowledge` array. Uses existing Necklace of Knowledge display system. No new inventory slot — integrates into existing bead display.

### Crone Staff
```javascript
{ name:'Crone Staff', icon:'🪄', sell:250, atkBonus:3, dmgDie:8, dmgCount:1, dmgFlat:0, type:'weapon', minLevel:1 }
```
Delivered as loot via storyRender at HCA when `croneMarks >= 15`. Push to `S_story.inventory`. WIS-scaling flavor is narrative; mechanically it is a standard +3 weapon (ATK +3, 1d8). Uses existing weapon equip system.

---

## VIII. Kindness Meter — Threshold Summary

| Threshold | Effect | Flag set |
|-----------|--------|---------|
| 3 | Innmother's name first available in quoteFn (but not revealed until 7) | — |
| 5 | Free Booking unlocked; sleep at INN costs 0gp permanently | `freeBookingUnlocked` |
| 7 | `innmotherNamed = true`; quoteFn delivers name line ("Mère Boudine.") | `innmotherNamed` |

The name at threshold 7 fires only once. quoteFn IIFE pattern:
```javascript
INN: { name:'The Innmother', quoteFn:() => {
  if (S_story.innmotherKindness >= 7 && !S_story.innmotherNamed) {
    S_story.innmotherNamed = true;
    return '"Mère Boudine. Since you\'ll keep coming back anyway."';
  }
  if (S_story.innmotherNamed) return '"The room is yours. The south path is open."';
  if (S_story.innmotherKindness >= 5) return '"Sleep is free. The meals are still what they are."';
  if (S_story.innmotherKindness >= 3) return '"You keep coming back." She says it like an accusation. She says everything like an accusation. It is the only register she has."';
  return '"The room is at the end of the hall. The second bed is the one that works. I don\'t know why you\'re still standing here."';
}}
```

---

## IX. Non-Obvious Design Decisions

1. **Kindness does not decrement.** Failing a skill check at the Inn does not reduce the meter. Rudeness or passivity simply don't add — they don't subtract. This is a deliberate design choice: the arc models genuine kindness as accumulative, not positional. There is no way to lose ground once genuine attention has been given.

2. **Crone Marks and Kindness are separate systems.** Passing a Crown quest adds 1 Crone Mark AND 1 Kindness (+1 from _innKindness call). Failing adds nothing to either. This means a player who passes all 18 Crown quests enters INN with Kindness already at 18+ and all thresholds cleared before reaching any Inn quest. The Inn quests still fire in narrative sequence but their Kindness additions are excess. This is acceptable — it rewards thorough engagement with the Crown arcs.

3. **`quest_whisper_05` and `quest_glut_06` have no skill check.** They are completion quests. This breaks the uniformity of "6 skill checks per crone" from the plan spec, but it was always the intent: the Saint's Work (witnessing without being asked) and the Open Hand (returning the gift) are not tests of ability. They are tests of attention and action. The DC=0 pattern is cleaner than assigning an arbitrary DC to something that should be automatic if the player pays attention.

4. **`will_o_wisp` at HJ1 is medium-tier despite being the first combat.** The Littoral Courts used 2 sea_serpents (which are hard) at LJ1. Matching that difficulty here. Medium-tier at HJ1 is appropriate — the player has cleared SW (hard) and HS (no battle) to reach this point.

5. **`young_black_dragon` replacing `shadow_drake` at HJ3.** The dragon fits the "darkness that dims" narrative — black dragons in 5e mythology are associated with acid, swamps, and corrupting water. The game already references it in the hag_swamp terrain pool. No new monster key reduces MONSTER_POOL scope. If a genuine `shadow_drake` is desired in a future layer, that becomes a separate addition.

6. **WG0 has no quest, no NPC, no battle.** It is a pure junction — entry narration only. This mirrors LJ0 in the Littoral Courts. The narrative weight of the entry lands in the WG0 node text, not in a quest. The player should feel the swamp deepen before the first Crown, not be immediately put into a skill check.

7. **INN uses `act:3`** (matching the existing HS node's act). All Crown arc nodes use act:3. The arc is geographically within the Act III swamp region even though its narrative complexity spans act-4 territory.

---

## X. Node Text Register Notes

- **WG0:** Entry narration. Past HS, the trees stop being trees in the way that trees are trees. They become vertical. They do not branch. No flavor; pure threshold.
- **HW1:** Still water that holds sky-reflection. Whisper at the edge, not looking at you.
- **HJ1:** Will-o'-wisp combat in shallow dark water. Node text: short; the lights arrive before anything explains them.
- **HG1:** Warm pool, warmth-film on the surface. Glut standing in the shallows; water at waist height.
- **HJ2:** Grave Hag + Crone Witch combat. The water here is thicker. The hags are not threatening — they are thorough.
- **HN1:** Colorless mire. Wane on a stone that remembers being sat on.
- **HJ3:** Dragon combat. The passage narrows. The darkness thickens before the dragon appears.
- **INN:** Functional inn, all terrible. The fire works. The bed (second one) works. The innkeeper does not.
- **HCA:** The clearing. Color returns gradually. Crone Mark conversion fires here.

---

## XI. Implementation Checklist

- [ ] Add 13 new fields to `_S_DEFAULTS()`
- [ ] Add 9 new nodes to `NODE_MAP` (WG0–HCA, codes as listed)
- [ ] Add 9 new entries to `NODE_COORDS`
- [ ] Add 24 new quests to `QUEST_DB` (whisper 01–06, glut 01–06, wane 01–06, inn 01–06)
- [ ] Write `_innKindness(n)` helper function
- [ ] Write `_addCroneMark()` helper function
- [ ] Add `glut_gift_held = true` IIFE trigger in HG1 storyRender first-visit block
- [ ] Add `Glut's Gift` to inventory via storyRender IIFE at HG1
- [ ] Add Innmother's Key delivery in quest_inn_06 unlock handler
- [ ] Add Crone Mark conversion block in HCA storyRender
- [ ] Add INN quoteFn with 5-state IIFE (as specced in §VIII)
- [ ] Add NPC_DIALOGUE entries for HW1, HG1, HN1, INN, HCA
- [ ] Verify INN node code does not collide with `IN` node (existing) — confirmed distinct strings
- [ ] Verify secondary connections HW1.E=J3 and HJ1.E=BE are acceptable after `_buildNodeExits()` runs
- [ ] Add `// §CROWN-01` comment block above first WG0 node in NODE_MAP

---

**Filed:** 2026-05-28  
**Cross-references:** `plan.md §CROWN-01` · `quest.md` (update after implementation) · `index.md` (update node count 121→130, lab reports count)
