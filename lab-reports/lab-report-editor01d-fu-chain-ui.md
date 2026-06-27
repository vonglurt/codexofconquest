# Lab Report — §EDITOR-01-D-FU (a): visual drag-reorder chain editor

**Status:** DESIGN LOCKED → implementing
**Date:** 2026-06-27
**Scope:** §EDITOR-01-D-FU item (a) only — replace the pipe-delimited `itemChain` **textarea** with an interactive step-list widget (add / remove / **reorder** action rows, per-action field inputs) on both the Quest Creator and the CRUD quest form. Item (b) — the 58-branch reward-ladder migration — is explicitly **out of scope** here (it overlaps §DATA-01-REVERTED and stays open).

This is a pure **authoring-UI** change. The persisted data shape (`q.itemChain: Step[]`), the runtime applier (`_applyItemChain`), and the persistence path (ph3 `editStructuredField`) are unchanged from §EDITOR-01-D core. Nothing in roll2hit-v3.html / wbapi-core.js / wbapi-server.js changes.

## 1. The gap

§EDITOR-01-D core ships `itemChain` authoring as a **free-text textarea** in two places:
- Quest Creator — `#ed-itemChain` (worldbuilder.html **8942**), consumed by `parseItemChainText(edVal('ed-itemChain'))` in `edBuildQuestObj` (**9277**).
- CRUD quest form — `CRUD_TYPES.quest.fields` entry `{key:'itemChain', arr:'itemchain', ta:true}` (**6040**); rendered as a generic textarea by `renderDetailForm` (**6243**) and parsed back by `collectFormData` via `textToArr('itemchain', …)` → `window.parseItemChainText` (**6285/6141**).

The pipe grammar (`grant|name|icon|type|sell|desc` · `take|name|all?` · `grantBit|flag|label` · `takeBit|flag`) is compact but **lossy to author**: positional fields (a stray empty `||` shifts `sell` into `desc`), no per-kind affordance (every kind is one undifferentiated line), no discoverability of which fields a kind takes, and no reorder except hand-editing line order. The `once` idempotency flag is **not expressible at all** in the text grammar (`parseItemChainText` never sets it; the runtime just defaults `once:true`).

## 2. Design — the widget (LOCKED)

A single **factory** `buildChainEditor(host, opts)` lives in the editor IIFE next to the codec (after `itemChainToText`, ~9142) and is **window-bridged** (`window.buildChainEditor`) so the CRUD IIFE reuses it — same pattern as `window.parseItemChainText`. It returns an **instance** (NOT a singleton — Quest Creator and CRUD can be mounted simultaneously):

```js
const ed = buildChainEditor(hostEl, { initial: Step[], onChange: fn });
ed.getSteps()        // → Step[]  (live read of the rows, in DOM order)
ed.setSteps(arr)     // replace all rows from a Step[]  (used by reset + CRUD seed)
ed.el                // the root element (already appended into host by the factory)
```

### 2.1 Row model

Each step is a `.chain-row` containing, left→right:
- **drag handle** `⠿` (`draggable=true` on the row) — primary reorder affordance;
- **kind `<select>`** — `grant | take | grantBit | takeBit`;
- **fields container** — re-rendered on kind change (mirrors `edAddBitCard`'s `renderFields`, worldbuilder.html 9079), each input tagged `data-cf="<field>"`;
- **▲ / ▼ buttons** — keyboard-free, deterministic reorder (move row up/down one slot); the **canonical reorder path for tests** (drag is a progressive enhancement);
- **✕ remove**.

Below the rows: a **`+ Add step`** button (defaults a new row to `grant`).

### 2.2 Per-kind field schema (LOCKED — superset of the text grammar)

| kind | fields (`data-cf`) |
|------|--------------------|
| `grant` | `name`* (text) · `icon` (text) · `type` (text) · `sell` (number) · `desc` (text) · `once` (checkbox, **default checked**) |
| `take` | `name`* (text) · `all` (checkbox) |
| `grantBit` | `flag`* (text) · `label` (text) |
| `takeBit` | `flag`* (text) |

`*` = required (empty → that field omitted; a row whose required field is blank is dropped from `getSteps()`, matching `parseItemChainText`'s `.filter(Boolean)`).

### 2.3 `getSteps()` → Step[] contract (LOCKED — byte-identical to the codec's output)

Read rows in DOM order; per row build the discriminated object exactly as `parseItemChainText` does, with two deliberate refinements the textarea couldn't express:
- **`once`** — emit `once:false` **only when the checkbox is unchecked** (runtime defaults `true`, so omitting it ⇒ `true`; this keeps the serialized JSON minimal and matches existing `itemChain` literals). `grant` is the only kind with `once`.
- **`sell`** — `+value || 0` only when the field is non-empty (same as codec line 9109).

So for any chain authored through the **text** grammar, `buildChainEditor({initial: parseItemChainText(text)}).getSteps()` ≡ `parseItemChainText(text)`. The widget is a strict superset (adds `once`).

### 2.4 Reorder

- **▲/▼** — swap the row with its previous/next sibling; disabled at the ends. Canonical + testable.
- **Drag** — `dragstart` stamps the row index; `dragover` (preventDefault) + `drop` on a target row reinserts the dragged row before/after the target. Pure DOM reorder; `getSteps()` re-reads order, so no model bookkeeping. Drag is **additive** — if it regresses, ▲/▼ still fully drive the feature.

Every mutation (add / remove / reorder / field input / kind change) calls `opts.onChange?.()`.

## 3. Integration (LOCKED)

### 3.1 Quest Creator
- **Markup:** replace the `#ed-itemChain` `<textarea>` (8942) with a host `<div id="ed-itemChain-editor">`. Keep the section header + grammar hint line (now a "fields per kind" legend).
- **Instance:** create once at IIFE init — `const edChain = buildChainEditor(EG('ed-itemChain-editor'), { onChange: edSchedule })`. The `onChange:edSchedule` replaces this id's slot in the `liveIds` input-listener loop (9531) — **remove `'ed-itemChain'` from `liveIds`** (the element is gone).
- **Build:** `edBuildQuestObj` (9277) → `const ic = edChain.getSteps();` (drop `parseItemChainText(edVal('ed-itemChain'))`).
- **Reset:** wherever the form clears (`edApplyPreset` blank-loop 9473 lists `'ed-itemChain'`; the live-preview id lists 9531) — drop the id and call `edChain.setSteps([])` in the reset path.
- **Export:** `edGenerateExport`'s `itemChain:[…]` branch already serializes from the Step[]; point it at `edChain.getSteps()`. The codec (`itemChainToText`) **stays** — still used by the export's text form and the tests.

### 3.2 CRUD quest form
- **Render:** in `renderDetailForm` (6243), special-case `f.arr === 'itemchain'` **before** the generic textarea branch: mount `buildChainEditor(wrap, { initial: entity?.itemChain || [] })` and stash the instance on the host (`wrap._chainEd = ed`) so collect can find it. (All other `arr` fields keep the textarea + `arrToText`/`textToArr` path untouched.)
- **Collect:** in `collectFormData` (6285), special-case `f.arr === 'itemchain'`: read the stashed instance's `getSteps()`; emit `out[f.key]` only when non-empty (matches the existing `if (a.length)` guard). All other `arr` fields unchanged.
- The CRUD `arrToText`/`textToArr` `itemchain` branches (6131/6141) become **dead for the form** but stay for `window.__crudTest` codec coverage + any external caller.

## 4. Why keep the codec

`parseItemChainText` / `itemChainToText` remain the canonical **Step[] ⇄ text** mapping. They still back: the JS export serializer's text form, the `__crudTest` round-trip suite, and a new **codec-parity** assertion (widget `getSteps()` ≡ codec parse of the equivalent text). Keeping them means the visual editor and the text grammar can never silently diverge.

## 5. Increment plan

- **Inc 1 (this report)** — design lock.
- **Inc 2** — `buildChainEditor` factory in the editor IIFE + `window.buildChainEditor` bridge; headless tests: `setSteps(arr)` → rows → `getSteps()` round-trips all 4 kinds; ▲/▼ + drag reorder; required-field drop; `once` superset; **codec parity** (`getSteps()` ≡ `parseItemChainText`). No form wiring yet.
- **Inc 3** — wire into Quest Creator (markup swap, `edBuildQuestObj`/reset/`liveIds`/export) + Playwright: author a mixed chain via the widget, assert `edBuildQuestObj().itemChain`; reorder via ▲/▼; reset clears.
- **Inc 4** — wire into CRUD form (`renderDetailForm` + `collectFormData` special-case) + Playwright: seed an entity's `itemChain`, assert the widget renders N rows in order, reorder, assert `collectFormData().itemChain`. **Closes §EDITOR-01-D-FU (a).** Item (b) ladder migration remains open.

## 6. Non-goals / risks

- **(b) reward-ladder migration** — untouched; still open under §EDITOR-01-D-FU, overlaps §DATA-01-REVERTED.
- **No data-shape change** → no `check-itemchain.js` change, no server change, no migration. The widget is a strict authoring superset; existing `itemChain` literals load unchanged.
- **Risk — two live instances:** the singleton trap. Mitigated by the factory returning per-mount instances (no `window.chainEditor` global state).
- **Risk — drag flakiness in Playwright:** mitigated by making ▲/▼ the canonical reorder; tests never depend on native drag.
