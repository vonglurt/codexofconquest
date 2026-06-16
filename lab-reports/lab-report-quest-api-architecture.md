<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report: Quest API Architecture & Universal Mission Format
**Document ID:** §ARCH-01  
**Status:** Design Specification — Pre-Implementation  
**Date:** 2026-05-28  
**Scope:** roll2hit-v3.html — Quest system unification, WBAPI runtime, live migration strategy

---

## Abstract

The current quest system in roll2hit-v3.html uses a heterogeneous flat-object format in QUEST_DB with two formal types (`skill_check`, `side`) and one implicit type (`main`), each using different field subsets. Logic that should belong to the quest definition is instead scattered across storyRender injection blocks, completeFn closures, and inline handlers. This document specifies:

1. A **Universal Quest Format (UQF v1.0)** — a single declarative schema for all mission types
2. A **Mission Bit Registry** — atomic, composable mechanics with typed contracts
3. A **WBAPI runtime layer** — callable from both the game and worldbuilder.html
4. A **live migration plan** — five phases that keep the game running throughout

---

## 1. Problem Statement

### 1.1 Current Format Fragmentation

Three quest types currently exist, each with incompatible field sets:

| Field | `main` | `side` | `skill_check` |
|-------|--------|--------|---------------|
| `activateCond` | JS function | JS function | JS function |
| `completeFn` | JS function | JS function | absent |
| `checkStat` | absent | absent | `'WIS'` / `'INT'` |
| `checkDC` | absent | absent | number |
| `checkPassFlag` | absent | absent | string or function |
| `onPass` / `onFail` | absent | absent | JS function |
| `retryable` | absent | absent | boolean |
| `disposition` | string | string | string |

The `completeFn` for a `side` quest can contain: flag writes, inventory mutations, XP awards, gold awards, knowledge entries, and NPC dialogue unlocks — all in an unstructured closure. The worldbuilder cannot safely edit these.

### 1.2 Logic Fragmentation

Quest behavior currently lives in three places simultaneously:

```
QUEST_DB         — activation conditions, completion check
storyRender      — button creation, narrative presentation
completeFn       — side effects (flags, items, XP)
```

A single mission arc like §WISDOM-01 requires coordinating entries in all three. Editing the quest title means finding the right storyRender block. Changing a DC means finding the QUEST_DB entry. Adding a new item reward means writing raw JS in a closure.

### 1.3 Parsing Opacity

`activateCond` and `completeFn` are live JS arrow functions. They cannot be:
- Serialized to JSON
- Safely diffed by the worldbuilder
- Statically analyzed for flag dependencies
- Validated for correctness before runtime

The WBAPI flag extraction currently relies on regex over raw source text as a workaround. This is fragile.

---

## 2. Design Goals

| Goal | Requirement |
|------|-------------|
| Single source of truth | All quest behavior defined in QUEST_DB, nothing in storyRender |
| Declarative | No JS closures in quest data — only typed field values |
| Composable | Quests are assembled from named mission bits |
| Parseable | The worldbuilder can read, diff, and write any quest field |
| Live migration | The game continues working at every migration phase |
| Versioned | Schema version stamped so old/new formats coexist |

---

## 3. Universal Quest Format (UQF v1.0)

### 3.1 Top-Level Structure

```javascript
{
  // Identity
  id:       'quest_wis_01',      // unique key (matches QUEST_DB key)
  schema:   '1.0',               // UQF version
  arc:      'wisdom',            // arc prefix
  layer:    112,                 // implementation layer

  // Lifecycle anchors
  activateNode:  'DK',           // node where quest appears in panel
  waypointNode:  'DK',           // map waypoint marker
  
  // Activation gate (declarative, replaces activateCond arrow function)
  gate: {
    flags:    ['wisHookReceived'],          // ALL must be true
    flagsAny: [],                           // ANY must be true (optional)
    notFlags: [],                           // NONE must be true (optional)
    nodes:    [],                           // player must have visited (optional)
  },

  // Mission bits — the mechanics this quest uses
  bits: [...],

  // Display
  title:       'The Rope Callous',
  hint:        'Study the merchant\'s hands.',
  disposition: '"I was waiting for someone to notice."',
  retryable:   false,
}
```

### 3.2 Mission Bit Definition

A **mission bit** is a typed, self-contained behavior unit. Each bit has:
- A **kind** (the bit type)
- A **contract** (required + optional fields for that kind)
- A **handler** (the runtime function that executes it)

A quest's `bits` array is an ordered list of bit objects. The runtime processes them in order.

---

## 4. Mission Bit Registry

### Bit: `skill_check`

The player must pass a D20 ability check.

```javascript
{
  kind:      'skill_check',
  stat:      'WIS',              // STR | DEX | CON | INT | WIS | CHA
  skill:     'Insight',          // optional — for display only
  dc:        13,
  adv:       false,              // advantage on the roll
  onPass:    [...bits],          // bits to execute on pass (nested!)
  onFail:    [...bits],          // bits to execute on fail
}
```

**Contract:** `stat` required, `dc` required, `onPass` or `onFail` required.  
**Runtime:** calls `rollD20(stat, prof) >= dc` → routes to `onPass` or `onFail` chain.

---

### Bit: `flag_write`

Sets one or more story state flags.

```javascript
{
  kind:   'flag_write',
  set:    ['wisPage1_masks'],     // flags to set true
  clear:  [],                    // flags to set false
}
```

**Contract:** at least one of `set` or `clear` required.  
**Runtime:** `S_story[flag] = true` for each entry in `set`.

---

### Bit: `reward`

Awards XP, gold, and/or items.

```javascript
{
  kind:    'reward',
  xp:      150,
  gold:    250,
  items:   [
    { id:'pages_ardley', name:'Pages of the Ardley Manuscript', icon:'📖', type:'token', sell:0 }
  ],
  knowledge: "I was waiting for someone to notice",   // knowledge log entry
}
```

**Contract:** at least one of `xp`, `gold`, `items`, `knowledge` required.  
**Runtime:** applies all rewards, triggers `storyMsg`, pushes to inventory and knowledge log.

---

### Bit: `combat`

Triggers a combat encounter.

```javascript
{
  kind:     'combat',
  key:      'shadow',
  label:    'Shadow — The Mirror Construct',
  count:    1,
  nodeCode: 'VS_SHADOW',         // custom combat code for defeatedBattles tracking
}
```

**Contract:** `key` required, `label` required.  
**Runtime:** calls `storyPreBattle({...currentNode, code:nodeCode, battle:{label,key,count}})`.

---

### Bit: `narrative`

Displays a message or storyRender block.

```javascript
{
  kind:     'narrative',
  msg:      'Roen folds the page carefully.',    // inline storyMsg
  template: 'wis_intro',                         // named template ID (for complex renders)
}
```

**Contract:** `msg` or `template` required.  
**Runtime:** calls `storyMsg(msg)` or renders the named template.

---

### Bit: `item_remove`

Removes a named item from inventory.

```javascript
{
  kind: 'item_remove',
  name: 'Pages of the Ardley Manuscript',
}
```

---

### Bit: `unlock`

Activates another quest or enables a dialogue branch.

```javascript
{
  kind:   'unlock',
  quests: ['quest_wis_02'],   // quest IDs to force-activate
  npcs:   [],                 // NPC keys whose favorability gates to open
}
```

---

### Bit: `choice`

Presents the player with a branching choice.

```javascript
{
  kind:    'choice',
  prompt:  'Accept the reflection, or fight it?',
  options: [
    { label: 'Accept the reflection', bits: [{ kind:'flag_write', set:['wisPage6_shadow'] }, ...] },
    { label: 'Fight it',              bits: [{ kind:'combat', key:'shadow', label:'Shadow — The Mirror Construct', count:1, nodeCode:'VS_SHADOW' }] },
  ],
}
```

**Contract:** `options` required, min 2. Each option must have `label` and `bits`.  
**Runtime:** renders button group; each button triggers its bit chain.

---

## 5. Complete Example: quest_wis_01 in UQF v1.0

**Legacy format (current):**
```javascript
quest_wis_01: {
  id:'quest_wis_01', type:'skill_check', title:'The Rope Callous',
  hint:'Study the merchant\'s hands.',
  activateNode:'DK', activateCond:()=>!!S_story.wisHookReceived,
  checkStat:'WIS', checkSkill:'Insight', checkDC:13,
  onPass:(S)=>{S_story.wisPage1_masks=true;S_story.gold+=150;...},
  onFail:(S)=>{...},
  retryable:false, xpAward:150, reward:150,
  disposition:'"I was waiting for someone to notice."',
},
```

**UQF v1.0 format:**
```javascript
quest_wis_01: {
  schema:'1.0', id:'quest_wis_01', arc:'wisdom', layer:112,
  activateNode:'DK', waypointNode:'DK',
  gate: { flags:['wisHookReceived'] },
  bits: [
    {
      kind:'skill_check', stat:'WIS', skill:'Insight', dc:13,
      onPass: [
        { kind:'flag_write', set:['wisPage1_masks'] },
        { kind:'reward', xp:150, gold:150, knowledge:'I was waiting for someone to notice' },
        { kind:'narrative', msg:'Silas Vance turns his palm up. "How long have you known?" He does not seem alarmed.' },
      ],
      onFail: [
        { kind:'narrative', msg:'The merchant shakes his head. "Bale callous. I haul cargo."' },
      ],
    }
  ],
  title:'The Rope Callous', hint:'Study the merchant\'s hands.',
  retryable:false, disposition:'"I was waiting for someone to notice."',
},
```

---

## 6. WBAPI Runtime Layer

The runtime is a singleton that processes UQF bit chains. It bridges the worldbuilder and the live game.

```javascript
const QuestRuntime = {
  SCHEMA_VERSION: '1.0',

  // Check if quest is available at current node
  canActivate(questId) {
    const q = QUEST_DB[questId];
    if (!q.gate) return true;
    const g = q.gate;
    if (g.flags    && !g.flags.every(f => S_story[f]))    return false;
    if (g.flagsAny && !g.flagsAny.some(f => S_story[f]))  return false;
    if (g.notFlags && g.notFlags.some(f => S_story[f]))   return false;
    return true;
  },

  // Execute a bit chain
  execBits(bits, context) {
    for (const bit of bits) {
      const handler = QuestRuntime.HANDLERS[bit.kind];
      if (!handler) { console.warn('Unknown bit kind:', bit.kind); continue; }
      handler(bit, context);
    }
  },

  // Execute pass/fail for a skill_check bit
  resolveSkillCheck(bit, context) {
    const roll = rollD20Stat(bit.stat);
    const pass = roll >= bit.dc;
    QuestRuntime.execBits(pass ? (bit.onPass||[]) : (bit.onFail||[]), context);
    return { roll, pass };
  },

  HANDLERS: {
    skill_check(bit, ctx) { QuestRuntime.resolveSkillCheck(bit, ctx); },
    flag_write(bit)       { (bit.set||[]).forEach(f => S_story[f] = true); (bit.clear||[]).forEach(f => S_story[f] = false); },
    reward(bit)           { if(bit.xp) S_story.xp = (S_story.xp||0)+bit.xp; if(bit.gold) S_story.gold+=bit.gold; (bit.items||[]).forEach(i=>S_story.inventory.push(i)); if(bit.knowledge) pushKnowledge(bit.knowledge); },
    combat(bit)           { storyPreBattle({...NODE_MAP[S_story.currentCode], code:bit.nodeCode||bit.key, battle:{label:bit.label, key:bit.key, count:bit.count||1}}); },
    narrative(bit)        { if(bit.msg) storyMsg(bit.msg); else renderNamedTemplate(bit.template); },
    item_remove(bit)      { const i=S_story.inventory.findIndex(x=>x.name===bit.name); if(i>-1) S_story.inventory.splice(i,1); },
    choice(bit, ctx)      { renderChoiceBlock(bit.prompt, bit.options, ctx); },
    unlock(bit)           { /* force quest panel refresh */ },
  },
};
```

---

## 7. Compatibility: Legacy Adapter

During the migration, old-format quests coexist with UQF quests. The adapter lets the runtime handle both:

```javascript
function adaptLegacyQuest(q) {
  if (q.schema) return q; // already UQF
  const adapted = {
    schema: '0.legacy',
    id: q.id, arc: q.id.split('_').slice(0,2).join('_'),
    activateNode: q.activateNode, waypointNode: q.waypointNode,
    gate: { _legacyFn: q.activateCond },  // wrapped, not parsed
    bits: [],
    title: q.title, hint: q.hint, retryable: q.retryable,
    disposition: q.disposition,
    _legacy: q,  // preserve original
  };
  if (q.type === 'skill_check') {
    adapted.bits.push({
      kind: 'skill_check', stat: q.checkStat, skill: q.checkSkill, dc: q.checkDC,
      onPass: [{ kind:'_legacy_fn', fn: q.onPass }],
      onFail: [{ kind:'_legacy_fn', fn: q.onFail }],
    });
  }
  return adapted;
}
```

The `_legacy_fn` bit kind falls through to the original function — preserving exact behavior with zero risk.

---

## 8. Migration Plan

### Phase 0: Anchors + WBAPI (✅ Complete)
Zero risk. Add `◆◆◆ WORLDBUILDER:*` anchors. Build worldbuilder.html. No game code changes.

### Phase 1: Schema + Runtime (No behavior change)
- Add `SCHEMA_VERSION = '1.0'` constant to game file
- Add `QuestRuntime` singleton (inactive — not yet called)
- Add `adaptLegacyQuest()` adapter function
- Add per-quest `schema: '0.legacy'` field to all existing QUEST_DB entries
- Add WBAPI to worldbuilder.html (reads both formats)

**Risk:** Zero. No game behavior changes. All new code is inert.

### Phase 2: New quests use UQF (Additive)
- All new quest arcs (§DUNGEON-01, §SPARK-03, §HUNT-03, §CEREMONY-03) written in UQF v1.0
- `QuestRuntime.execBits()` called for UQF quests; legacy path unchanged
- Worldbuilder gains full edit capability for UQF quests

**Risk:** Low. Only new code is on the UQF path. Legacy quests untouched.

### Phase 3: Migrate by arc (Incremental)
- One arc at a time, convert QUEST_DB entries from legacy to UQF
- Migrate corresponding storyRender block logic INTO the bit chain
- Add arc-by-arc integration tests (manual play-through checklist)
- Target order: §WISDOM-01 (cleanest) → §SPARK-01 → §ALCHEMY-01 → §HUNT arcs → main quest

**Risk:** Medium per arc. Each arc is independent. The adapter provides fallback.

### Phase 4: Deprecate legacy path
- All QUEST_DB entries are UQF v1.0
- `adaptLegacyQuest()` is a no-op (all `schema: '1.0'`)
- storyRender blocks that are now quest-driven are removed
- `schema: '0.legacy'` entries: zero

**Risk:** Medium-low. Full test pass before removal.

### Phase 5: Canonicalize
- QUEST_DB becomes the single source of truth for all quest behavior
- storyRender only handles pure display (node text, map travel) — no quest logic
- Worldbuilder can export a fully functional new arc as a JSON file that gets pasted into QUEST_DB

---

## 9. Mission Bit Controller / Checker

The **MissionBitController** validates a quest definition against its bit contracts before writing to QUEST_DB:

```javascript
const BIT_CONTRACTS = {
  skill_check: {
    required: ['stat', 'dc'],
    optional: ['skill', 'adv', 'onPass', 'onFail'],
    validate: b => ['STR','DEX','CON','INT','WIS','CHA'].includes(b.stat) && typeof b.dc === 'number',
  },
  flag_write: {
    required: [],
    optional: ['set', 'clear'],
    validate: b => (b.set||[]).length + (b.clear||[]).length > 0,
  },
  reward: {
    required: [],
    optional: ['xp', 'gold', 'items', 'knowledge'],
    validate: b => b.xp||b.gold||(b.items&&b.items.length)||b.knowledge,
  },
  combat: {
    required: ['key', 'label'],
    optional: ['count', 'nodeCode'],
    validate: b => typeof b.key === 'string' && typeof b.label === 'string',
  },
  narrative: {
    required: [],
    optional: ['msg', 'template'],
    validate: b => b.msg || b.template,
  },
  choice: {
    required: ['prompt', 'options'],
    optional: [],
    validate: b => b.options && b.options.length >= 2 && b.options.every(o => o.label && o.bits),
  },
};

function validateQuest(q) {
  const errors = [];
  if (!q.schema) errors.push('Missing schema version');
  if (!q.id) errors.push('Missing id');
  if (!q.bits || !q.bits.length) errors.push('No mission bits defined');
  for (const bit of (q.bits||[])) {
    const contract = BIT_CONTRACTS[bit.kind];
    if (!contract) { errors.push(`Unknown bit kind: ${bit.kind}`); continue; }
    if (!contract.validate(bit)) errors.push(`Bit "${bit.kind}" failed contract validation`);
    for (const req of contract.required) if (bit[req] === undefined) errors.push(`Bit "${bit.kind}" missing required field: ${req}`);
  }
  return { valid: errors.length === 0, errors };
}
```

The worldbuilder's Quest Editor runs `validateQuest()` before allowing export. Red fields = failed contract. Green = valid.

---

## 10. Worldbuilder Integration Points

| Worldbuilder Feature | Uses |
|----------------------|------|
| Quest list | `WBAPI.quests.all()` — reads both legacy and UQF |
| Quest editor | UQF bit-by-bit editor (Phase 2+); raw textarea for legacy |
| Chain graph | `WBAPI.quests.chain(id)` — uses declarative `gate.flags` instead of regex |
| Bit validator | `validateQuest()` — inline error display |
| Export | Generates UQF JS literal ready for paste into QUEST_DB |
| Diff/patch | UQF quests are fully JSON-serializable — clean diffs |

---

## 11. Arc Migration Checklist Template

For each arc being migrated from legacy → UQF:

```
□ Map all flags: what does each quest read / write?
□ Convert activateCond → gate.flags / gate.flagsAny / gate.notFlags
□ Identify primary mechanic → pick bit kind (skill_check / combat / choice)
□ Move onPass logic → [ flag_write bits, reward bits, narrative bits ]
□ Move onFail logic → [ narrative bits ]
□ Move completeFn side effects → bit chain in the quest's bits array
□ Remove corresponding storyRender block (the bit chain renders it)
□ Run play-through: activate quest, pass, verify flags + rewards
□ Run play-through: activate quest, fail, verify retry/lock behavior
□ Set schema: '1.0' on all migrated quests in the arc
```

---

## 12. Single Source of Truth: What Lives Where

After full migration:

| Data | Lives in |
|------|----------|
| Quest activation conditions | `gate` field in QUEST_DB |
| Quest narrative text | `bits[].narrative.msg` in QUEST_DB |
| Flag writes | `bits[].flag_write.set` in QUEST_DB |
| XP/gold rewards | `bits[].reward` in QUEST_DB |
| Combat encounters | `bits[].combat` in QUEST_DB |
| Item drops | `MONSTER_DROPS` keyed by monster key |
| Item effects | `bits[].reward.items` in QUEST_DB |
| Node text (scene flavor) | `NODE_MAP[code].text` (unchanged) |
| NPC dialogue | `BIRKA_NPC_PROFILES` (unchanged) |
| Terrain monsters | `WORLD_DB[terrain].monsters` (unchanged) |

---

## 13. Open Questions

1. **storyRender timing**: Some render blocks have complex conditional sub-states (e.g., `story-wis-vs` with 5 branches). Should multi-state nodes use `choice` bits, or stay as named templates? **Proposed:** named templates for node-wide display; `choice` bits only for quest-driven branches.

2. **checkPassFlag**: Currently a function or a string. In UQF it becomes `flag_write.set`. Confirm correct mapping for all existing `skill_check` quests before Phase 3.

3. **completeItems array**: Used to check if player holds a required item. Does this become `gate.items`? Needs a new bit kind: `item_check`. Add to contract registry in Phase 1.

4. **Retryable skill checks**: The `retryable` field controls whether a failed `skill_check` quest stays in the panel. The bit contract should inherit this from the quest root, not duplicate it in the bit.

5. **Saga-level gates**: Some quests activate based on complex multi-quest state (e.g., `personalLegendComplete && !wisHookReceived`). The `gate.flags + gate.notFlags` schema handles this declaratively for simple cases. For compound AND/OR logic, add a `gate.expr` field that is a simple boolean expression language (e.g., `"personalLegendComplete AND NOT wisHookReceived"`).

---

## 14. Implementation Schedule

| Phase | Target | Risk | Effort |
|-------|--------|------|--------|
| Phase 0 | ✅ Done | Zero | 1 session |
| Phase 1 | Next session | Zero | 1 session |
| Phase 2 | §DUNGEON-01 | Low | Per arc |
| Phase 3 | §WISDOM-01 first | Medium | 2–3 sessions |
| Phase 4 | After all arcs | Medium-low | 1 session |
| Phase 5 | Finalization | Low | 1 session |

---

*§ARCH-01 — Quest API Architecture & Universal Mission Format*  
*Author: World Builder — roll2hit.com*  
*Status: Pre-Implementation Design — awaiting Phase 1 kickoff*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
