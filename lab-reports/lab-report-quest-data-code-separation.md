# Lab Report: Quest Data–Code Separation
**§ARCH-02 Data Integrity Pass — 2026-06-16**

---

## Summary

A data object that contains executable functions is not data. It is a program pretending to be data. This session enforced the boundary. The result: `QUEST_DB` is now auditable, serializable, and safe to render. `QUEST_EFFECTS` is declarative. `QUEST_HOOKS` is the engine.

---

## What Was Wrong

### 1. Code in data (QUEST_DB)

`QUEST_DB` held 92 `onPass` and 35 `onFail` arrow functions inline — anonymous JavaScript embedded in the same object literal as quest titles, NPC names, hint strings, and XP values. There was no boundary between "what a quest is" and "what happens when it completes."

The practical consequences:

- **Unauditable**: No tool can enumerate what a quest outcome does without executing it. You cannot diff two quest outcomes or validate them structurally.
- **Untestable in isolation**: The outcome functions close over the live game state (`S_story`, `storyMsg`, `_grantMissionBit`, `S_story.inventory`). Extracting one to inspect it pulls the entire runtime.
- **Unmaintainable at scale**: 127 anonymous arrow functions buried in a 20,000-line object literal. No names, no contracts, no registry of "what can a quest actually do."

### 2. innerHTML rendering of quest text

`q.title`, `q.desc`, and `q.hint` were interpolated directly into `innerHTML`:

```js
div.innerHTML = '<div class="quest-title"><span>' + q.title + '</span>' + badge + '</div>'
  + '<div class="quest-desc">' + q.desc + '</div>'
  + (completed ? '' : '<div class="quest-hint">▶ ' + q.hint + '</div>' + ...);
```

Any string field in QUEST_DB reaching `innerHTML` is a code-execution path. If a quest title or description ever contained `<img onerror=...>` or `<script>`, it would execute. The audit confirmed zero current violations — but the structural risk was live.

### 3. The NPC dialogue bug (quoteFn never called)

`storyShowNpc` was reading `d.quote` (a static string field) but every NPC in `NPC_DIALOGUE` stores its text in `d.quoteFn` (a function returning a string, often with side effects):

```js
// Was:
document.getElementById('npc-card-text').textContent = d.quote; // always undefined

// Fix:
document.getElementById('npc-card-text').textContent =
  typeof d.quoteFn === 'function' ? d.quoteFn() : d.quote;
```

Effect: every NPC button in the game showed blank text. No NPC quote ever rendered. No NPC state change ever fired. The Damascus arc (`§LIX`) was completely blocked — `Anath.quoteFn()` sets `anathSightRestored = true`, which gates the blind-days exit. With `quoteFn` never called, `anathSightRestored` stayed `false` forever. The player was trapped at the DAM node regardless of how many days passed (`blindDaysKS` could reach 100, the gate would never open).

This was the immediate presenting bug. The console logs showed: `BLOCKED: DAM blind-days gate {saulConverted: true, anathSightRestored: false, blindDaysKS: 12}`.

### 4. Duplicate node code (ZRH)

`ZRH` was defined twice in both `NODE_MAP` and `NPC_DIALOGUE`. JavaScript object literal semantics: the second definition wins silently.

| | First (won by second) | Second (active) |
|---|---|---|
| NODE_MAP | Dunfall — The Loch Harbor (act:3, highlands) | The Unbanked Quarter (act:1, defi_land) |
| NPC_DIALOGUE | Mairén Fionn (`quoteFn` returning `dfBarterLearned`) | Grimshaw (static `quote:`) |

All 11 quests with `activateNode:'ZRH'` and `dunfallAccessed` context activated at the wrong node. The `KIR → ZRH` gate routed to Zurich, not Dunfall. Mairén Fionn was permanently unreachable.

Fix: renamed Dunfall to `DFL`, placed at `(83,223)` north of KIR. All quest references, NPC_DIALOGUE entry, gate check, and three `node.code` UI panels updated.

### 5. One passText as function

One `passText` in QUEST_DB was an arrow function:

```js
passText:() => 'The loop closes...' + (S_story.priorCarrierSeen ? '\n\n"The blank page..."' : ''),
```

Code embedded in a text field. Converted to the full static string — the final quest, where the Prior Carrier encounter is always complete before reaching it.

---

## What Was Built

### QUEST_EFFECTS — declarative outcome data

```js
const QUEST_EFFECTS = {
  quest_df_02: {
    onPass: [
      { e:'flag', key:'dfBarterLearned' },
      { e:'gold', amount:100 },
      { e:'xp',  amount:250 },
      { e:'item', name:'Highland Herb Pouch', icon:'🌿', type:'consumable', desc:'...', sell:40 },
      { e:'msg',  text:'The exchange Mairén is looking for...' },
    ],
  },
  quest_stoning_lystra: {
    onFail: [{ e:'hp-min', value:1 }],
  },
  quest_whisper_01: {
    onPass: [{ e:'hook', name:'croneMark' }],
  },
  // ... 89 entries
};
```

**No executable code.** Effect descriptors enumerate what should happen. The data can be read, compared, serialized, and validated without running anything.

### Effect type registry

| Type | Meaning |
|------|---------|
| `flag` | `S_story[key] = value ?? true` |
| `xp` | `S_story.xp += amount; _checkLevelUp()` |
| `gold` | `S_story.gold += amount` |
| `msg` | `storyMsg(text)` |
| `item` | push to inventory |
| `item-swap` | remove by name, then push |
| `knowledge` | push to knowledge array |
| `mbit` | `_grantMissionBit(flag, label)` |
| `hp-min` | `S_story.hp = Math.min(S_story.hp||1, value)` |
| `hook` | `QUEST_HOOKS[name]()` |

The registry is exhaustive. A quest outcome can only do these ten things. To add a new capability, you add a new case to `applyQuestEffects` — one place, named, visible.

### QUEST_HOOKS — named engine functions

```js
const QUEST_HOOKS = {
  croneMark:    () => _addCroneMark(),
  innKindness1: () => _innKindness(1),
  quest_df_02_onPass: () => {
    S_story.dfBarterLearned = true;
    S_story.gold = (S_story.gold||0) + 100;
    // ... full handler
  },
  // ... 91 entries total
};
```

Complex quest outcomes — those with conditional logic, inventory surgery, multi-flag writes, or knowledge entries — live here as **named functions**. Changing a quest outcome means editing a function you can find by name. The hook is referenced from `QUEST_EFFECTS` as `{e:'hook', name:'quest_df_02_onPass'}` — the data names the intent; the engine provides the implementation.

### applyQuestEffects — single dispatch

```js
function applyQuestEffects(effs) {
  for (const ef of effs) {
    switch (ef.e) {
      case 'flag':     S_story[ef.key] = ef.value !== undefined ? ef.value : true; break;
      case 'xp':       S_story.xp = (S_story.xp||0) + ef.amount; _checkLevelUp(); break;
      // ... 10 cases
      case 'hook':     QUEST_HOOKS[ef.name](); break;
    }
  }
}
```

The executor calls `applyQuestEffects(_qe.onPass)` and `applyQuestEffects(_qe.onFail)` — never directly invoking anything from `QUEST_DB`.

### innerHTML → textContent

```js
// Before (XSS risk):
div.innerHTML = '<div class="quest-title"><span>' + q.title + '</span>' + badge + '</div>'
  + '<div class="quest-desc">' + q.desc + '</div>' + ...;

// After (safe):
const _titleSpan = document.createElement('span');
_titleSpan.textContent = q.title;
_titleDiv.appendChild(_titleSpan);
_titleDiv.insertAdjacentHTML('beforeend', badge); // badge is code-generated, not data

const _descDiv = document.createElement('div');
_descDiv.className = 'quest-desc';
_descDiv.textContent = q.desc;
```

Code-generated HTML (`badge`, `wpBtnHtml`, `huntBtnHtml`) still uses `insertAdjacentHTML` — those are built from node codes and game state, not from user-supplied or data-originated strings.

---

## Why the Boundary Matters

The distinction between data and code is not aesthetic. It has operational consequences:

**Serializability.** `QUEST_EFFECTS` can be exported to JSON, sent over an API, stored in a database, diff'd between versions. `QUEST_DB` with inline functions cannot — `JSON.stringify` drops functions silently.

**Auditability.** You can read `QUEST_EFFECTS` and know what a quest does. You cannot read an anonymous arrow function and know what game state it touches without tracing through the runtime.

**The rendering attack surface.** A function embedded in a data field is executable. A string that reaches `innerHTML` is executable. Both are paths from "content" to "code." The structural goal is to ensure that quest data never reaches an execution context — not because current data is malicious, but because the guarantee should not depend on the current content of the data.

**The NPC bug as evidence.** The gap between `d.quote` (data field) and `d.quoteFn()` (executable) was invisible at the call site. `storyShowNpc` was written as if NPC quotes were strings. They were always functions. The mismatch was undetectable without testing the specific path — and the path appeared to work (the modal opened, just with blank text). The separation between "data you read" and "code you call" was not enforced at the type level, so the bug lived silently.

---

## Non-Obvious Decisions

**Why keep complex handlers in QUEST_HOOKS rather than converting them to effect chains?**
Some handlers have conditional logic (`if (!S_story.voidFluxImmunityChoice)`), item replacement (remove-then-push), and multi-flag cascades. Converting these to effect chains would require extending the effect DSL with conditional operators — adding complexity to the interpreter to avoid complexity in the hooks. The hook pattern is the right boundary: declarative where possible, named engine functions where not.

**Why 77 inline effects and 89 hooks, not more inline?**
The classifier converted everything it could prove was atomic: single flag sets, single XP awards, single mbit grants, the hp-min pattern, and the two named helpers (`croneMark`, `innKindness1`). Everything else went to a hook. The classifier did not guess.

**The extraction parser bug (skipBlock).**
The initial character-level parser incremented depth for `(`, `[`, `{` but only decremented for the specific closing bracket of the outer block type. So `foo()` inside `{ ... }` — where `(` incremented depth but `)` did not decrement it — caused the depth counter to never return to 0. Function bodies containing any function call were extracted as the entire rest of the file. The fix: count only the matching bracket pair (`{` tracks only `}`, `(` tracks only `)`).

---

## Files Changed

- `roll2hit-v3.html` — `storyShowNpc` fix; `DFL` node rename; `ZRH` deduplication; `QUEST_DB` onPass/onFail removed; `QUEST_EFFECTS` + `QUEST_HOOKS` + `applyQuestEffects` inserted; `innerHTML` → `textContent` for quest panel; executor updated

---

*Lab report count: 64 · Date: 2026-06-16 · §ARCH-02 data integrity pass*
