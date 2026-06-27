# Lab Report — §WBAPI-01 ph3: full structured-field PATCH (arrays/objects/scalars)

**Status:** DESIGN LOCKED → implementing
**Date:** 2026-06-27
**Scope:** the "full-array PATCH" item from §WBAPI-01 phases 3–5. (ph4 worldbuilder write-tab and ph5 standalone Node module remain separate.)

## 1. The gap

`PUT /api/{type}/{key}` (wbapi-server.js ~8899) edits fields per value type:

```js
if (typeof value === 'string' || value === null) {
  WBAPI.editField(type, key, field, value);        // ← source-level patch of _rawSrc; PERSISTS
} else {
  ns.put(key, { [field]: value });                  // ← in-memory only; note: "call /api/save to persist"
}
```

But `save()` writes the **patched `_rawSrc` text** (full re-serialization is impossible — it would destroy QUEST_DB function bodies; see `lab-report-wbapi-architecture.md` §6). `ns.put` updates the in-memory object **without patching `_rawSrc`**, so **array/number/boolean field edits never reach source and are silently lost on save.** `editField`→`patchStringField` only matches quoted scalars (`field:"…"`/`'…'`/`` `…` ``), so it cannot edit a non-string field.

**Editable array fields that exist today** (QUEST_DB): `completeItems` (180 — `['Item (Shard #1)']`), `targetMonsterKeys` (6 — `['k1','k2']`), `killGoals` (5 — `[{key:'k',need:5,label:'L'}]`), `notation` (1). NODE_MAP has no array fields; MONSTER_POOL matches were key false-positives.

## 2. Design

Add a **source-level literal patcher** that serializes any JSON-safe value (array, flat object, number, boolean, null, string) to codebase-style JS-literal text and replaces the field's value in the entry body — bracket/brace/string/comment-aware, reusing the same tokenizer style as `_stripFieldsFromEntryBody` / `findEntryBounds`.

- **`serializeJsLiteral(v)`** (wbapi-core.js): string → single-quoted + escaped (`\\`, `\'`, `\n`); number/boolean → `String(v)`; null → `'null'`; array → `[a,b,…]`; flat object → `{key:val,…}` (unquoted identifier keys, else quoted). **Rejects** functions/undefined/nested-too-deep (returns `{ok:false}`) — function-valued fields are §DATA-01 territory, out of scope.
- **`patchLiteralField(sectionSrc, entryKey, field, literal)`**: `findEntryBounds` → locate `field:` → determine the existing value extent (bracket-depth for `[`/`{`, string-skip for quotes, scan-to-delimiter for primitives) → splice in the new literal. Returns `null` if entry/field not found.
- **`editStructuredField(type, idOrTitle, field, value)`** (WBAPI core): mirrors `editField` — serialize, `patchLiteralField` (insert via the existing append path if the field is absent), update in-memory (`ns.put`) so reads are consistent, return `{ok, field, strategy:'editStructuredField'}`.
- **Wiring** (server ~8905): the `else` branch → if `Array.isArray(value) || typeof value === 'number' || typeof value === 'boolean'`, call `editStructuredField` (persists) instead of the in-memory-only `ns.put`. Objects stay on the `ns.put` path for now unless top-level (flat objects are supported by the serializer but full nested-object node bodies are out of scope).

## 3. Contract / edge cases

- **Round-trip fidelity**: serialize → patch → reload → re-read must equal the input (verified by harness).
- **Quote style**: single quotes to match the codebase; escape embedded quotes/newlines.
- **Idempotent**: re-PATCHing the same value is a no-op diff.
- **Absent field**: inserted before the entry's closing brace (raw literal, no surrounding quotes — unlike `insertStringField`).
- **Out of scope (ph3)**: append/splice/merge ops (full-replace only), function-valued fields, deeply nested structures, NODE_COORDS (separate `PUT /api/coords`).

## 4. Test plan

Throwaway server (stdlib harness, never touches :1367): PATCH `quest_*` `completeItems` (string array), `targetMonsterKeys`, and `killGoals` (object array) → assert response ok + `strategy:'editStructuredField'` → `POST /api/save` → reload → re-GET equals input → `npm run check:walk` green (no structural breakage) → diff shows only the patched array literals. Negative: PATCH a function-valued field (`completeFn`) → rejected with a clear error.
