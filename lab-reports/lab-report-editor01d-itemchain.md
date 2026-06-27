# Lab Report — §EDITOR-01-D: declarative `itemChain` (token item manager)

**Status:** DESIGN LOCKED → implementing
**Date:** 2026-06-27
**Scope:** §EDITOR-01-D "Token item manager (visual chain editor for inv.push/splice sequences)." User decision (2026-06-27): build the **clean declarative path** — add an `itemChain` quest field the runtime compiles into inventory mutations — rather than a fragile regex function-body editor. Partial overlap with §DATA-01-REVERTED / §ARCH-01 (UQF), but strictly narrower: this declares *item* effects only, leaves all other handler logic alone, and is additive.

## 1. The gap

Quest item grants/removals are hand-coded JS in two places the worldbuilder/WBAPI cannot address:

1. **Function bodies** — inside quest `onPass` (skill_check path), `onComplete`, `onFail`, `completeFn`. Representative literal (roll2hit-v3.html ~30534):
   ```js
   const inv = S_story.inventory = S_story.inventory || [];
   const fishIdx = inv.findIndex(i => i.name === "Smalt's Trust");
   if (fishIdx !== -1) inv.splice(fishIdx, 1);
   inv.push({ name: "Pip's Friendship Bead", icon:'🪵', type:'misc',
              desc:"…", sell:1 });
   ```
2. **The reward id-ladder** — a **58-branch `if (id === '…') { … }`** block inside `storyCheckQuests` (roll2hit-v3.html ~25835–26054), each branch inlining `S_story.inventory.push({…})` / `.filter(…)` / gold / favor / `msgs.push`.

The source-patch API (`editStructuredField`, ph3) can only replace a whole **field value**; it cannot reach inside a function body or the `id` ladder. So a "visual chain editor" is impossible while chains live as code. **`itemChain` is greenfield** — 0 references in roll2hit-v3.html / worldbuilder.html / wbapi-core.js / wbapi-server.js.

## 2. The two completion paths (where item effects actually fire)

| Path | Function | Site | Fires |
|------|----------|------|-------|
| skill_check | `_rollCeremonia(questId)` | roll2hit-v3.html **6246–6251** | sets `quests[id]='done'`; calls `_grantMissionBit`, xp/gold, then `q.onPass()` |
| item / completeFn / killGoals | `storyCheckQuests(node)` | roll2hit-v3.html **25820–25829** | guards `quests[id]==='active'`, sets `='complete'`, calls `q.onComplete()`, then the 58-branch ladder |

Both transition the quest out of `'active'`/into a terminal state exactly once, so a hook in each fires **once per completion** (the `'active'` guard at 25821 + the `'done'` set at 6247 prevent re-entry). `q.onComplete` is defined on **27** quests; `_takeMissionBit` does **not** exist yet (a §MBIT-02 follow-up).

## 3. Design — persisted data shape (LOCKED)

`q.itemChain: Step[]` — an ordered array of action steps. Each `Step` is one of four kinds (discriminated by `action`):

```js
// grant — add an inventory item (idempotent by default)
{ action:'grant', name:'Pip's Friendship Bead', icon:'🪵', type:'misc', sell:1, desc:'…', once:true }
// take — remove inventory item(s) by exact name
{ action:'take', name:"Smalt's Trust", all:false }
// grantBit — wrap _grantMissionBit (mission-bit token + flag)
{ action:'grantBit', flag:'harmonyChainComplete', label:'Harmony Chain' }
// takeBit — wrap _takeMissionBit (clears flag + removes the token)
{ action:'takeBit', flag:'harmonyChainComplete' }
```

Field contracts:
- **grant** — `name` required. Defaults applied at runtime: `icon:'📦'`, `type:'misc'`, `sell:0`, `desc` omitted if absent. `once` defaults **true** → skip if an item with the same `name` is already present (belt-and-suspenders against double-grant).
- **take** — `name` required, **exact** match. `all` defaults false (splice first match); `all:true` filters every match.
- **grantBit / takeBit** — `flag` required; `label` optional (falls back to `_flagToLabel`).

This is a JSON-safe array of flat objects → **patches cleanly through the existing ph3 `serializeJsLiteral` → `patchLiteralField` → `_rawSrc` path** (same mechanism that already persists `killGoals`'s `{key,need,label}` objects). **No server change required.**

## 4. Runtime applier (LOCKED)

```js
function _takeMissionBit(flagName) {            // NEW — also advances §MBIT-02
  if (!flagName) return;
  S_story[flagName] = false;
  if (S_story.inventory)
    S_story.inventory = S_story.inventory.filter(
      i => !(i.type === 'mission_bit' && i.flagRef === flagName));
}

function _applyItemChain(q) {                    // returns msg[] for the caller to surface
  if (!q || !Array.isArray(q.itemChain)) return [];
  const inv = S_story.inventory = S_story.inventory || [];
  const msgs = [];
  for (const s of q.itemChain) {
    switch (s.action) {
      case 'grant': {
        if (s.once !== false && inv.some(i => i.name === s.name)) break;
        const item = { name:s.name, icon:s.icon||'📦', type:s.type||'misc', sell:s.sell||0 };
        if (s.desc) item.desc = s.desc;
        inv.push(item);
        msgs.push((item.icon) + ' ' + s.name + ' obtained.');
        break;
      }
      case 'take':
        if (s.all) S_story.inventory = inv.filter(i => i.name !== s.name);
        else { const i = inv.findIndex(x => x.name === s.name); if (i !== -1) inv.splice(i, 1); }
        break;
      case 'grantBit': _grantMissionBit(s.flag, s.label); break;   // already emits its own storyMsg
      case 'takeBit':  _takeMissionBit(s.flag); break;
      default: break;                                              // unknown action: skip, never throw
    }
  }
  return msgs;
}
```

**Hook points** (additive, after the existing handler call so authored functions still run first):
- `_rollCeremonia` — after `if (q.onPass) q.onPass();` (6251): `_applyItemChain(q).forEach(m => storyMsg(m));` (skill_check uses hcards + `storyMsg`, not the `msgs[]` array).
- `storyCheckQuests` — after `if (q.onComplete) q.onComplete();` (25829): `msgs.push(..._applyItemChain(q));` (feeds the existing completion `msgs[]`).

## 5. Authoring (worldbuilder) — codec

`itemChain` is an array of flat objects → reuse the `arr` codec pattern that already serves `killGoals` (`arr:'objlines'`). Add a new codec kind **`arr:'itemchain'`** with a line-based, **pipe-delimited** text grammar (pipes chosen so `desc` may contain `:` and prose):

```
grant   | <name> | <icon> | <type> | <sell> | <desc>
take    | <name> | <all?>
grantBit| <flag> | <label>
takeBit | <flag>
```

- One step per non-blank line; first `|`-segment is `<action>` (trimmed, lowercased-matched).
- Trailing segments optional; `grant` `desc` is last so prose is safe (a literal `|` inside desc is the one documented limitation).
- `arrToText('itemchain', arr)` re-emits this grammar; `textToArr('itemchain', txt)` parses it into the §3 objects (numeric `sell` coerced via `+`; `once` always serialized true unless explicitly `grant!` … **v1: `once` is implicit-true, not surfaced in the codec** — authored grants are idempotent; revisit if a deliberate duplicate-grant case appears).

Wired into **both** authoring surfaces:
- **Quest Creator** (`edBuildQuestObj`, worldbuilder.html ~9082) — new `#ed-itemChain` textarea → `q.itemChain` via the parser; flows to Export JS + POST.
- **CRUD edit form** — add `itemChain` to `CRUD_TYPES.quest.fields` with `arr:'itemchain'`; `renderDetailForm` seeds it via `arrToText`, `collectFormData` parses via `textToArr`. The existing PUT dispatch (wbapi-server.js ~8905) routes the resulting array to `editStructuredField` → source patch. Exposed on `window.__crudTest` for the headless test.

The richer drag-to-reorder *visual* chain UI is explicitly a **later increment / follow-up** (§EDITOR-01-D-FU); v1 delivers the data layer + runtime + the textarea codec on both surfaces, matching the killGoals precedent.

## 6. API path — no server change

`itemChain` (array of flat objects) is handled end-to-end by ph3:
`PUT /api/quest/{id}` → server type-switch (Array branch) → `WBAPI.editStructuredField('quest', id, 'itemChain', [...])` → `serializeJsLiteral` (object-array literal) → `patchLiteralField` patches/inserts in `_rawSrc` → `save()` writes source. Verified-by-precedent: `killGoals` object arrays already round-trip this path (§WBAPI-01 ph3 + ph4-FU).

## 7. Migration policy — purely additive (v1)

- The 58-branch id-ladder and all 27 `onComplete` / `onPass` handlers stay **untouched** and keep working. `itemChain` is the *new* declarative vector for newly authored or edited quests.
- No quest uses `itemChain` after this work (the runtime is **inert** until data is authored) — zero behavioral change on `main`.
- A future mechanical migration of the ladder's *pure* item branches into `itemChain` is **out of scope** (many branches mix gold/favor/conditional/msg logic that isn't pure item ops) — tracked as **§EDITOR-01-D-FU**, candidate to fold into §DATA-01-REVERTED.

## 8. Divergence / risk notes

- **SP-only:** `itemChain` runs in the single-player engine (roll2hit-v3.html). The WBAPI server has no quest-completion runtime, so there's no MP parity surface to keep (unlike §WALK-5 encounters).
- **`takeBit` adds `_takeMissionBit`** — a §MBIT-02 deliverable lands here as a side effect (minimal, flag-clear + token-splice by `flagRef`). Logged so §MBIT-02 doesn't double-implement.
- **Ordering:** authored handler (`onPass`/`onComplete`) runs *before* `itemChain`, so a handler that itself pushes the same item + `once:true` grant = single copy. Documented contract.
- **Unknown action** → skipped silently (forward-compatible), never throws into the completion path.

## 9. Test plan

- **`scripts/check-itemchain.js`** (Node, no server; mirrors `scripts/check-array-patch.js`): extract `_applyItemChain` + `_takeMissionBit` from the HTML, eval in a sandbox with a mock `S_story` + stub `_grantMissionBit`; assert grant (with defaults + `once` idempotency), take (single + `all`), grantBit/takeBit; assert `serializeJsLiteral(itemChainArray)` (from wbapi-core) round-trips. New `npm run check:itemchain` + CI `paths:` entry.
- **`tests/integration/worldbuilder-itemchain.test.js`** (Playwright): codec round-trip (`arrToText`∘`textToArr` = identity on a 4-action fixture) + DOM form → `collectFormData` emits the object array (via `window.__crudTest`).
- **Headless smoke** (Chromium): page loads with 0 console errors; `_applyItemChain`/`_takeMissionBit` defined; a synthetic quest with an `itemChain` completes and mutates `S_story.inventory` as specified; `hoursElapsed` untouched.
- **Live round-trip:** `PUT /api/quest/{throwaway}` with an `itemChain` array, confirm `save()` writes the object-array literal to source, then revert.
- `npm run check:walk` stays green throughout.

## 10. Increment plan

1. **Lab report** (this) — design lock. ← *here*
2. **Runtime** — `_takeMissionBit` + `_applyItemChain` helpers; hook into 6251 + 25829; inert (no quest data). `scripts/check-itemchain.js` + `npm run check:itemchain`; headless smoke.
3. **Quest Creator authoring** — `#ed-itemChain` textarea + `itemchain` codec in `edBuildQuestObj`/Export/POST.
4. **CRUD edit authoring** — `itemChain` field in `CRUD_TYPES.quest.fields` (`arr:'itemchain'`), `arrToText`/`textToArr` codec branch, `renderDetailForm`/`collectFormData`, `window.__crudTest`; Playwright spec + live server round-trip.
5. **(FU)** Visual drag-reorder chain UI; mechanical ladder→itemChain migration (→ §EDITOR-01-D-FU / §DATA-01-REVERTED).

---
*© 2026 Paul Richeson — MIT License.*
