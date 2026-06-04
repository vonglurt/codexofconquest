<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report — §DESIGN-03: Ceremonia Roll + Skill Check Quest System

**Date:** 2026-05-26  
**Layer:** §DESIGN-03 (Layer 78+)  
**Status:** Pre-implementation spec lock — all fields below are final before any HTML edit  
**Scope:** New quest type `skill_check` · `_rollCeremonia()` engine · Retry state mechanic · UI render · 4 Birka quests · 5-act Yael Ceremonia Arc

---

## 1. QUEST_DB Data Shape — `type: 'skill_check'`

### Required fields

```js
{
  id:            'quest_ceremonia_yael_01',   // string — unique key
  type:          'skill_check',               // distinguishes from 'main'|'side'|'epic'
  title:         'The Watch',                 // display name in quest sheet
  hint:          '...',                       // one-line hint shown in quest card sub
  activateNode:  'BA',                        // node code where quest activates
  checkAbility:  'cha',                       // 'str'|'dex'|'con'|'int'|'wis'|'cha'
  checkLabel:    'Persuasion',                // display name in button + hcard
  checkDC:       10,                          // target number
  retryable:     true,                        // boolean — daily retry gate on fail
  vignetteText:  '...',                       // 2–3 sentence prose shown before roll button
  passText:      '...',                       // one sentence shown on pass
  failText:      '...',                       // one sentence shown on fail
  completeItems: [],                          // required by storyCheckQuests(); always [] for skill_check
}
```

### Optional fields

```js
{
  activateCond:    () => boolean,   // gate on top of activateNode; both must pass to activate
  retryGateDays:   1,               // days until retry (default 1; only used if retryable: true)
  checkPassFlag:   'string',        // S_story flag set to true on pass (optional)
  checkFailFlag:   'string',        // S_story flag set to true on fail (optional, non-retryable quests)
  xpAward:         100,             // XP awarded on pass (optional; default 0)
  goldAward:       50,              // gold awarded on pass (optional; default 0)
  onPass:          () => void,      // callback after pass state is applied (optional)
}
```

### Incompatible fields (do not add to skill_check quests)

- `waypointNode` — not used (Ceremonia Rolls have no navigation target)
- `completeFn` — not used (completion is handled by `_rollCeremonia()`, not storyCheckQuests)
- `killGoals` / `targetMonsterKeys` — not used

---

## 2. `_rollCeremonia(questId)` — Function Spec

**Signature:** `function _rollCeremonia(questId)`  
**Returns:** void  
**Side effects:** mutates `S_story.quests`, `S_story.skillCheckAttempts`, `S_story.xp`, `S_story.gold`, fires `storyRender()`

```
1. Guard: pull q = QUEST_DB[questId]; return if not found or type !== 'skill_check'
2. Compute:
     abilityVal  = (S_story.abilityScores || {})[q.checkAbility] || 10
     mod         = Math.floor((abilityVal - 10) / 2)
     prof        = 2 + Math.floor(((S_story.level || 1) - 1) / 4)
     d20         = Math.ceil(Math.random() * 20)
     total       = d20 + mod + prof
     passed      = total >= q.checkDC
3. Build hcard entry:
     actor    = 'ROLL'
     formula  = 'd20(' + d20 + ') + ' + q.checkLabel + '(' + (mod >= 0 ? '+' : '') + mod + ') + Prof(+' + prof + ')'
     outcome  = total + ' vs DC ' + q.checkDC + ' — ' + (passed ? 'PASS ✓' : 'FAIL')
     dmg      = passed ? q.passText : q.failText
4. Push hcard to story log via _appendStoryHcard(entry)
5a. If passed:
       S_story.quests[questId] = 'done'
       if q.checkPassFlag → S_story[q.checkPassFlag] = true
       if q.xpAward → S_story.xp += q.xpAward; _checkLevelUp()
       if q.goldAward → S_story.gold += q.goldAward
       if q.onPass → q.onPass()
5b. If failed:
       if q.retryable:
         attempts = S_story.skillCheckAttempts = S_story.skillCheckAttempts || {}
         prev = attempts[questId] || {}
         attempts[questId] = { lastDay: S_story.day, failures: (prev.failures || 0) + 1 }
       else:
         S_story.quests[questId] = 'failed'
         if q.checkFailFlag → S_story[q.checkFailFlag] = true
6. storyRender()
```

---

## 3. `_appendStoryHcard(entry)` — Helper Spec

A new story-only hcard push that does not contaminate the battle log (`#hcard-container`).

```js
function _appendStoryHcard(entry) {
  const sc = document.getElementById('story-hcard-container');
  if (!sc) return;
  const card = buildCard(entry);
  sc.appendChild(card);
  const scards = sc.querySelectorAll('.hcard');
  scards.forEach((c, i) => {
    c.style.opacity = Math.max(0.3, 1.0 - (scards.length - 1 - i) * 0.07);
  });
  while (sc.children.length > 30) sc.removeChild(sc.firstChild);
  sc.scrollTop = sc.scrollHeight;
}
```

`buildCard()` already exists and accepts `{ round, actor, formula, outcome, dmg }`.  
Use `round: 'Day ' + S_story.day` for Ceremonia Roll cards.

---

## 4. Retry State Mechanic — `S_story.skillCheckAttempts`

**Field:** `S_story.skillCheckAttempts` — object, keyed by quest ID.

```js
// Structure:
S_story.skillCheckAttempts = {
  'quest_ceremonia_yael_01': { lastDay: 3, failures: 2 },
  'quest_crypt_survey':      { lastDay: 5, failures: 1 },
}
```

**Retry gate check** (in QUESTS section render):
```js
function _ceremoRetryBlocked(questId) {
  const q = QUEST_DB[questId];
  if (!q || !q.retryable) return false;
  const att = (S_story.skillCheckAttempts || {})[questId];
  if (!att) return false;
  const gap = q.retryGateDays || 1;
  return S_story.day < att.lastDay + gap;
}
```

**Collision prevention with existing quest fields:**  
`skillCheckAttempts` is a new top-level field on `S_story`, not nested inside `S_story.quests`. There is no collision with `S_story.quests[id] = 'active'|'done'|'failed'`. A retryable quest stays `'active'` even after failed attempts; only `_ceremoRetryBlocked()` gates the button.

**Default in `_S_DEFAULTS()`:**
```js
skillCheckAttempts: {},
```

---

## 5. UI Render Spec — Quest Cards in `storyRenderSections()`

**Location:** `storyRenderSections()`, QUESTS section, after the `_mkCard()` call for each active quest.

**Existing quest card render:**
```js
activeEntries.forEach(({ id, q }) => {
  body.appendChild(_mkCard({
    lbl: q.type === 'main' ? 'MAIN' : 'SIDE',
    main: ..., hint: ..., btn, btnClass, btnClick
  }));
});
```

**Extension for `type: 'skill_check'`:**

```
if q.type === 'skill_check':
  const blocked = _ceremoRetryBlocked(id);
  const mod = Math.floor(((S_story.abilityScores || {})[q.checkAbility] - 10) / 2) || 0;
  const prof = 2 + Math.floor(((S_story.level || 1) - 1) / 4);
  const modStr = (mod + prof >= 0 ? '+' : '') + (mod + prof);
  
  // Three states:
  // State 1 — Ready to roll:
  btn      = 'Roll Ceremonia — ' + q.checkLabel + ' DC ' + q.checkDC
  btnClass = 'btn-talk'
  btnClick = () => _rollCeremonia(id)
  sub      = vignetteText (prose shown in card body)
  hint     = q.checkLabel + ' (' + modStr + ') vs DC ' + q.checkDC
  
  // State 2 — Retry blocked (failed, locked until tomorrow):
  btn      = '⏳ Retry tomorrow — ' + q.checkLabel + ' DC ' + q.checkDC
  btnClass = 'btn-rest'   (greyed out / disabled appearance)
  btnClick = null
  hint     = 'Next attempt available: Day ' + (att.lastDay + (q.retryGateDays || 1))
  
  // State 3 — Failed (non-retryable, quest status 'failed'):
  → quest status 'failed' removes from activeEntries; not shown here
```

**lbl for skill_check quests:** `'ROLL'` (distinct from MAIN/SIDE).

**Vignette text display:** Push `q.vignetteText` as `sub` on the `_mkCard()`. This appears below the title in the card body as a description paragraph.

---

## 6. Quest Activation — `storyCheckQuests()` patch

Add `activateCond` check to the activation loop:

```js
Object.values(QUEST_DB).forEach(q => {
  if (q.type === 'epic') return;
  if (!S_story.quests[q.id] && q.activateNode === node.code) {
    if (q.activateCond && !q.activateCond()) return;  // NEW: gate check
    S_story.quests[q.id] = 'active';
    msgs.push('📋 ' + q.title);
  }
});
```

This change is backward-compatible — existing quests without `activateCond` are unaffected.

---

## 7. XP Award Hook — Integration with `_checkLevelUp()`

**Path:** Skill check XP goes through the existing `S_story.xp` increment, then `_checkLevelUp()`.

`_checkLevelUp()` already exists and fills `_levelUpQueue` with newly earned levels. The level-up modal fires from `_levelUpQueue` on next render cycle.

For story-mode skill check XP, after `S_story.xp += q.xpAward`:
1. Call `_checkLevelUp()` — fills `_levelUpQueue` if threshold crossed
2. If `_levelUpQueue.length > 0`: show level-up modal immediately (same as `storyApplyOutcome()` flow)
3. No XP banner needed (unlike battle XP which shows in victory overlay)

**XP awards are a separate channel from battle XP** — no `xpLastBattle` update needed. The stat panel `_updateStorySidebar()` already displays `S_story.xp` directly, so it reflects immediately after `storyRender()`.

---

## 8. `quest_courier_release` — Gating Assessment

**Current state:** Node BA (City Streets) has prose describing a city guard blocking the courier's body. The text implies persuasion or bribery. No quest currently wraps this action.

**Assessment — optional parallel quest, NOT a main flow gate:**

Gating Node 1 main flow behind a skill check would break the L1 experience for players with low CHA (e.g., STR-build fighters who start with CHA 8). DC 10 with CHA 8 = mod −1 + prof +2 = +1 total; 45% failure rate. A retryable gate here would be annoying rather than meaningful.

**Decision:** `quest_courier_release` runs as an **optional parallel quest** that activates at BA (game start):
- Quest is active from game start
- Player can roll CHA DC 10 to recover the map + 50gp (Pass) or pay 20gp bribe (Fail)  
- The bribe path: on fail, push a prompt offering the 20gp bribe. If `S_story.gold >= 20`, player can take the bribe path for the map minus 20gp. If `S_story.gold < 20` (unlikely at start) — retry next day.
- Fail with no gold: retry gate (retryable: true)
- The quest does NOT block any other node actions; main story progression is untouched.

**Fail path detail:** Add `onFail` callback (separate from `checkFailFlag`):
```js
onFail: () => {
  if ((S_story.gold || 0) >= 20) {
    // offer bribe in a storyMsg; handled inline
    S_story.quests['quest_courier_release'] = 'bribe_available';  // special state
  }
}
```

Or simpler: just show the bribe option in the quest card when in fail state. The `'failed'` status gets special rendering for this quest: a secondary button "Pay 20gp Bribe" that completes the map acquisition at reduced reward.

---

## 9. Prose — All 5 Yael Arc Acts (LOCKED)

### Act I — "The Watch" (CHA DC 10 · BA · retryable)

**vignetteText:**  
*She checks her watch once more while you are talking. Quarter-hour. She has been doing this since before you arrived. You say what you came to say. She does not look up from the logbook. The watch is back in her coat pocket. You have thirty seconds before the shift changes.*

**passText:**  
*She writes something in the logbook. You do not see what.*

**failText:**  
*The logbook closes. "Next time," she says, which means: try again.*

---

### Act II — "The Route" (WIS DC 12 · BA · retryable)

**vignetteText:**  
*She passes close enough that you see the edge of paper where she keeps the patrol route — rolled tight in her left sleeve, the way a soldier carries a map that must survive the weather. She pulls it out without being asked. She smooths it against the wall beside you. She is not looking at you.*

**passText:**  
*You read it the way she intended. She rolls it back up.*

**failText:**  
*You are still looking when she rolls it back. You have the shape of the district but not the detail.*

---

### Act III — "The Crate" (STR DC 12 · SL · retryable)

**vignetteText:**  
*The crate is half her height. She has it moving on the cobblestones — dragging, not lifting, her hands wrapped in a leather cord. You are at the corner. She has not looked up. The crate stops at a seam in the stone. She straightens, breathes once, bends again.*

**passText:**  
*The crate reaches the far wall. She looks at her hands. She does not say anything.*

**failText:**  
*It moves another meter. She does not stop, and you do not try again today.*

---

### Act IV — "The Report" (CHA DC 14 · BA · NOT retryable)

**vignetteText:**  
*The captain has the log. Your name is in today's entries — wrong district, recorded by someone who noticed. Yael is at the table. The pen is in her hand. The captain is waiting for her to sign. She has not yet.*

**passText:**  
*The pen moves. Your name is not there when the captain reads it back.*

**failText:**  
*The pen moves. Your name stays. She does not look at you.*

*Note: On Act IV fail, set `S_story.ceremonia_yael_04_failed = true`. Quest status = `'failed'`. Act V still unlocks via `activateCond`, but Act V's vignetteText has a variant (see Act V below).*

---

### Act V — "The Name" (CHA DC 15 · BA · NOT retryable · requires Yael fav ≥ 3)

**vignetteText (default — Act IV passed):**  
*You told her your name outside the mortuary, the first morning. She has not used it since. Now it is the end of shift. She is putting on her coat. She says it — your name, not the title, not "you" — the way you say a word you have been holding for a while to make sure you had it right.*

**vignetteText (Act IV failed variant — rendered when `S_story.ceremonia_yael_04_failed`):**  
*"I heard about the report," she says. She is putting on her coat. The name in the duty log is your problem now, not hers. You are still here. So is she.*

**passText:**  
*She finishes buttoning her coat. She goes.*

**failText:**  
*She finishes buttoning her coat. She goes. She does not look back.*

*Note: vignetteText variant is selected at render time in `storyRenderSections()` — not a QUEST_DB field. Use: `const vText = S_story.ceremonia_yael_04_failed ? q.vignetteTextAlt : q.vignetteText;`*

---

## 10. New State Fields — `_S_DEFAULTS()` additions

```js
skillCheckAttempts: {},       // { questId: { lastDay, failures } }
ceremoniaYaelAct: 0,          // 0=not started; 1–5 = act N complete; mirrors quests[q.id]==='done' state
ceremonia_yael_04_failed: false,
ceremonia_yael_complete: false,
cryptSurveyed: false,         // quest_crypt_survey pass flag
```

---

## 11. QUEST_DB Entries — New Quests

### `quest_courier_release` (BA · CHA DC 10 · retryable)

```js
quest_courier_release: {
  id: 'quest_courier_release', type: 'skill_check', title: 'The Released',
  hint: 'Persuade the city guard to release the courier\'s belongings.',
  activateNode: 'BA', activateCond: null,
  checkAbility: 'cha', checkLabel: 'Persuasion', checkDC: 10, retryable: true,
  xpAward: 100, goldAward: 50,
  vignetteText: 'The guard has the courier\'s pack. The body is unclaimed — no next of kin on record. He is not required to release the effects, but he is bored, and you are standing here. The bloodstained map is folded inside.',
  passText: 'He pushes the pack across. "Sign here."',
  failText: '"Come back with twenty gold or a writ." He means it.',
  completeItems: [],
  checkPassFlag: 'courierReleased',
}
```

### `quest_city_watch_patrol` (BA→IN→TA · accomplishment)

```js
quest_city_watch_patrol: {
  id: 'quest_city_watch_patrol', type: 'side', title: 'The Route',
  hint: 'Walk Yael\'s patrol route: BA, IN, TA in sequence.',
  activateNode: 'BA', activateCond: () => (S_story.npcFavorability || {}).yael >= 1,
  completeFn: () => !!(S_story.patrolRouteComplete),
  completeItems: [],
}
```

*(Patrol route completion flag `patrolRouteComplete` is set in `storyCheckQuests()` when player arrives at TA while `quest_city_watch_patrol` is active and has visited IN since activating. Trigger logic: in `storyCheckQuests()` for TA node, if quest active and `S_story.patrolBA && S_story.patrolIN`, set `S_story.patrolRouteComplete = true`.)*

### `quest_crypt_survey` (CP · WIS DC 12 · retryable)

```js
quest_crypt_survey: {
  id: 'quest_crypt_survey', type: 'skill_check', title: 'The Survey',
  hint: 'Map the second chamber for the surveyor\'s guild.',
  activateNode: 'CP', activateCond: null,
  checkAbility: 'wis', checkLabel: 'Perception', checkDC: 12, retryable: true,
  xpAward: 200, goldAward: 75,
  vignetteText: 'The chalk marks are still here — the surveyor who made them fifteen years ago is not. The second chamber runs deeper than the first, and something has been digging from below since the last report. The guild wants the measurements updated.',
  passText: 'The chamber is mapped. The marks you make are a cleaner hand than Froberger\'s.',
  failText: 'The light fails before you finish. The chalk is still here tomorrow.',
  completeItems: [],
  checkPassFlag: 'cryptSurveyed',
}
```

### `quest_pit_debut` (CY · accomplishment)

```js
quest_pit_debut: {
  id: 'quest_pit_debut', type: 'side', title: 'First Blood',
  hint: 'Win your first pit fight at the Neon Undercity.',
  activateNode: 'CY', activateCond: null,
  completeFn: () => (S_story.pitTrainingWins || 0) >= 1,
  completeItems: [],
}
```

*(Completion reward hook in `storyCheckQuests()`: `if (id === 'quest_pit_debut') { S_story.gold += 100; S_story.xp += 250; _checkLevelUp(); msgs.push('🥊 First Blood! +100gp +250 XP — The Pit knows your face now.'); }`)*

---

## 12. Yael Arc QUEST_DB Entries (5 acts)

### `quest_ceremonia_yael_01`

```js
quest_ceremonia_yael_01: {
  id: 'quest_ceremonia_yael_01', type: 'skill_check', title: 'The Watch',
  hint: 'Yael is sizing you up. Make the thirty seconds count.',
  activateNode: 'BA',
  activateCond: () => (S_story.npcFavorability || {}).yael >= 1
                   && (S_story.quests || {}).quest_slums_cleanup === 'done',
  checkAbility: 'cha', checkLabel: 'Persuasion', checkDC: 10, retryable: true,
  xpAward: 75, checkPassFlag: 'ceremoniaPassed_yael_01',
  vignetteText: 'She checks her watch once more while you are talking. Quarter-hour. She has been doing this since before you arrived. You say what you came to say. She does not look up from the logbook. The watch is back in her coat pocket. You have thirty seconds before the shift changes.',
  passText: 'She writes something in the logbook. You do not see what.',
  failText: 'The logbook closes. "Next time," she says, which means: try again.',
  completeItems: [],
  onPass: () => { S_story.ceremoniaYaelAct = 1; },
}
```

### `quest_ceremonia_yael_02`

```js
quest_ceremonia_yael_02: {
  id: 'quest_ceremonia_yael_02', type: 'skill_check', title: 'The Route',
  hint: 'The patrol route is in her sleeve. Read it correctly.',
  activateNode: 'BA',
  activateCond: () => !!(S_story.ceremoniaPassed_yael_01),
  checkAbility: 'wis', checkLabel: 'Insight', checkDC: 12, retryable: true,
  xpAward: 100, checkPassFlag: 'ceremoniaPassed_yael_02',
  vignetteText: 'She passes close enough that you see the edge of paper where she keeps the patrol route — rolled tight in her left sleeve, the way a soldier carries a map that must survive the weather. She pulls it out without being asked. She smooths it against the wall beside you. She is not looking at you.',
  passText: 'You read it the way she intended. She rolls it back up.',
  failText: 'You are still looking when she rolls it back. You have the shape of the district but not the detail.',
  completeItems: [],
  onPass: () => { S_story.ceremoniaYaelAct = 2; },
}
```

### `quest_ceremonia_yael_03`

```js
quest_ceremonia_yael_03: {
  id: 'quest_ceremonia_yael_03', type: 'skill_check', title: 'The Crate',
  hint: 'She is moving a crate across the Slums square. She is not asking.',
  activateNode: 'SL',
  activateCond: () => !!(S_story.ceremoniaPassed_yael_02),
  checkAbility: 'str', checkLabel: 'Athletics', checkDC: 12, retryable: true,
  xpAward: 100, checkPassFlag: 'ceremoniaPassed_yael_03',
  vignetteText: 'The crate is half her height. She has it moving on the cobblestones — dragging, not lifting, her hands wrapped in a leather cord. You are at the corner. She has not looked up. The crate stops at a seam in the stone. She straightens, breathes once, bends again.',
  passText: 'The crate reaches the far wall. She looks at her hands. She does not say anything.',
  failText: 'It moves another meter. She does not stop, and you do not try again today.',
  completeItems: [],
  onPass: () => { S_story.ceremoniaYaelAct = 3; },
}
```

### `quest_ceremonia_yael_04`

```js
quest_ceremonia_yael_04: {
  id: 'quest_ceremonia_yael_04', type: 'skill_check', title: 'The Report',
  hint: 'Your name is in the wrong column of today\'s duty log.',
  activateNode: 'BA',
  activateCond: () => !!(S_story.ceremoniaPassed_yael_03),
  checkAbility: 'cha', checkLabel: 'Persuasion', checkDC: 14, retryable: false,
  xpAward: 125,
  checkPassFlag: 'ceremoniaPassed_yael_04',
  checkFailFlag: 'ceremonia_yael_04_failed',
  vignetteText: 'The captain has the log. Your name is in today\'s entries — wrong district, recorded by someone who noticed. Yael is at the table. The pen is in her hand. The captain is waiting for her to sign. She has not yet.',
  passText: 'The pen moves. Your name is not there when the captain reads it back.',
  failText: 'The pen moves. Your name stays. She does not look at you.',
  completeItems: [],
  onPass: () => { S_story.ceremoniaYaelAct = 4; },
}
```

### `quest_ceremonia_yael_05`

```js
quest_ceremonia_yael_05: {
  id: 'quest_ceremonia_yael_05', type: 'skill_check', title: 'The Name',
  hint: 'She has been carrying your name since the first morning.',
  activateNode: 'BA',
  activateCond: () => !!(S_story.ceremoniaPassed_yael_04 || S_story.ceremonia_yael_04_failed)
                   && (S_story.npcFavorability || {}).yael >= 3,
  checkAbility: 'cha', checkLabel: 'Persuasion', checkDC: 15, retryable: false,
  xpAward: 150,
  checkPassFlag: 'ceremonia_yael_complete',
  vignetteText: "You told her your name outside the mortuary, the first morning. She has not used it since. Now it is the end of shift. She is putting on her coat. She says it — your name, not the title, not \"you\" — the way you say a word you have been holding for a while to make sure you had it right.",
  vignetteTextAlt: "\"I heard about the report,\" she says. She is putting on her coat. The name in the duty log is your problem now, not hers. You are still here. So is she.",
  passText: 'She finishes buttoning her coat. She goes.',
  failText: 'She finishes buttoning her coat. She goes. She does not look back.',
  completeItems: [],
  onPass: () => {
    S_story.ceremoniaYaelAct = 5;
    S_story.ceremonia_yael_complete = true;
    _setNpcFavor('yael', 3);
    S_story.inventory = S_story.inventory || [];
    S_story.inventory.push({ name: "Yael's Watch Token", icon: '🪙', type: 'token', sell: 0,
      desc: 'A small brass coin, worn smooth. Guard issue, retired. She gave it to you without explanation.' });
  },
}
```

---

## 13. Implementation Phases — Confirmed

| Phase | Scope | Status |
|-------|-------|--------|
| **P1** | `_S_DEFAULTS()` new fields + `_appendStoryHcard()` + `_rollCeremonia()` + `_ceremoRetryBlocked()` + `storyCheckQuests()` `activateCond` patch | PLANNED |
| **P2** | QUEST_DB: `quest_courier_release` + `quest_crypt_survey` + `storyCheckQuests()` completion reward hooks | PLANNED |
| **P3** | QUEST_DB: `quest_city_watch_patrol` + `quest_pit_debut` + patrol flag logic in `storyCheckQuests()` | PLANNED |
| **P4** | QUEST_DB: 5 Yael arc entries + `storyRenderSections()` skill_check render branch (vignette prose, retry state, Act V variant text) | PLANNED |

---

*Lab report complete. Implementation may begin at P1.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
