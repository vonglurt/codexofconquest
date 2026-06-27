# Lab Report — §EDITOR-02: Mission Builder (form-based arc insertion)

**Status:** DESIGN LOCKED → implementing
**Date:** 2026-06-26
**Scope:** §EDITOR-02 "Mission Builder tab in worldbuilder.html — form-based arc insertion with Preview Chain + POST All." The existing §EDITOR-01 Quest Creator builds **one** quest at a time. Mission Builder builds a **multi-step arc** (an ordered chain of linked quests) in one form, auto-wires the chain flags between steps, previews the resolved chain, and POSTs every step. Strictly a tooling layer on top of the existing single-quest `WBAPI.quests.create` path — **no game-engine change, no server change.**

## 1. The gap

Authoring an arc today means filling the §EDITOR-01 form N times and hand-maintaining the inter-quest plumbing:

- **Sequential IDs** — `quest_yael_1`, `_2`, `_3`… typed by hand (arc-prefix convention is what `_questArcs` groups on: id with a trailing `_N` or `_xx` stripped — wbapi-core.js:588, worldbuilder.html:1653).
- **Flag chaining** — step *k* gates on step *k−1*'s result. A skill_check writes `checkPassFlag`; the next quest reads it via `activateCond:(s)=>s.someFlag`. Get one flag name wrong and the chain silently never activates. (The Audit tab already flags this: "skill_check with no checkPassFlag — downstream quests cannot gate on this result" worldbuilder.html:1969; "flag never written by any quest" :2301.)
- **No whole-arc view before commit** — you only see the chain *after* posting all steps, via the Quests tab `chain()` derivation.
- **All-or-nothing failure** — post step 3 of 5, hit a validation error, and you've left a half-built arc in the file.

Mission Builder closes all four: one form for the whole arc, auto-generated IDs + auto-wired flags, a **Preview Chain** render of the resolved arc, and **POST All** with per-step results and stop-on-first-error.

## 2. What an "arc" is, mechanically (grounded)

A mission arc is an ordered list of quests that:
1. Share an **arc prefix** (`q.arc` + the `<prefix>_<n>` id convention `_questArcs` buckets on).
2. **Chain via flags** — `WBAPI.quests.chain(id)` (wbapi-core.js:727) derives upstream/downstream purely from flag reads vs. writes (`_questFlags`, `_flagToQuests`). So the *only* thing that links step k→k+1 is: step k **writes** a flag that step k+1 **reads** in its `activateCond`.
3. Each step is a normal quest object — same shape `edBuildQuestObj` produces (worldbuilder.html:9146), validated by the same `WBAPI.quests.advise`/`create` (:1996) the single-quest path uses.

There is **no dedicated "arc" runtime object** — an arc is an emergent property of correctly-wired flags. Mission Builder's whole job is to generate those flags correctly.

## 3. Design — the builder's in-memory model (LOCKED)

The tab holds an **arc draft**: a header + an ordered `steps[]` array.

```
arcDraft = {
  arcId:      'quest_yael',        // prefix; step ids become quest_yael_1, _2, …
  arcLabel:   'Yael romance',      // q.arc display value on every step
  activateNode: 'BRK',            // default node for steps that don't override
  steps: [ Step, Step, … ]
}
Step = {                           // a thin authoring row, NOT the final quest obj
  type:   'skill_check'|'side'|… ,
  title:  '…',
  desc:   '…',
  // skill_check: checkStat/checkSkill/checkDC/xpAward/onPass/onFail
  // side:        completeItems/targetMonsterKeys/killGoals/completeFn/passText
  itemChain: '…',                  // §EDITOR-01-D textarea grammar, per step
  activateNode: '' ,               // optional per-step override of arc default
  gateMode: 'auto'|'manual'|'none' // how this step's activateCond is wired (§4)
}
```

The draft is the single source of truth; **Build Chain** (§4) compiles it into N final quest objects, **Preview Chain** (§5) renders them, **POST All** (§6) creates them.

## 4. Auto-chaining — the compile step (LOCKED)

`buildArcQuests(arcDraft) → questObj[]` produces the final quests:

- **id** = `<arcId>_<n>` (1-based). **arc** = `arcLabel`.
- **flag wiring**, per step's `gateMode`:
  - `auto` (default, step ≥ 2): step *k* gates on step *k−1*'s completion flag.
    - The **producer flag** for a step is: its `checkPassFlag` if skill_check (auto-named `<arcId>_<n>_passed` when blank), else an auto mission-bit-style flag `<arcId>_<n>_done`.
    - Step *k* gets `activateCond: (s) => s.<prevflag>` — emitted as a real arrow-function source string (the Audit guard at wbapi-core.js:1195 rejects bare-identifier activateConds, so we MUST emit `(s)=>s.flag`, never the bare name).
  - `manual`: author supplied their own `activateCond` / flag — passed through untouched.
  - `none`: step 1, or a parallel step — no `activateCond`.
- **producer flag is always set**: skill_check → ensure `checkPassFlag`; non-skill step → append a `grantBit|<arcId>_<n>_done` to its `itemChain` (reuses §EDITOR-01-D's runtime — the bit is what the next step reads). This is why §EDITOR-02 *depends on* §EDITOR-01-D being shipped: non-skill steps chain through itemChain `grantBit`/flags rather than `checkPassFlag`.
- Per-step `itemChain` is parsed with the shared `parseItemChainText` codec (window-bridged, worldbuilder.html:9094) — identical grammar to the Quest Creator.

The compile is **pure** (no I/O) so it's unit-testable head-lessly and drives both Preview and POST.

## 5. Preview Chain (LOCKED)

Renders the compiled `questObj[]` as a vertical chain using the existing `.chain-link` styling (worldbuilder.html:146) — one row per step showing `id · title · [type badge]`, an `↓ reads <flag>` connector between consecutive steps, and a per-step validation badge from `WBAPI.quests.advise` (missing node, unknown npc, dangling flag). A red badge anywhere disables POST All. This is the whole-arc view that doesn't exist today, rendered *before* anything is written.

## 6. POST All (LOCKED)

Sequential, **stop-on-first-error**, reusing the single-quest path verbatim:

```
for (const q of buildArcQuests(arcDraft)) {
  const res = await WBAPI.quests.create(q);   // worldbuilder.html:1996 — same validation+POST
  report(q.id, res);
  if (!res.ok) break;                          // leave the rest unposted, surface the error
}
```

No batch server endpoint is added — `create` already does id/type/title/activateNode checks, bit-contract validation, world-logic advisory hard-block, and POSTs to `/api/quest` (or in-memory + DIFF when no server). Each `create` reload/clobber concern is the server's existing behavior; the builder posts one at a time. After a full success, refresh indexes + the Quests list (as `edPostQuest` does at :9395).

## 7. API path — no server change, no engine change

- **Engine (`roll2hit-v3.html`):** untouched. Arcs are just quests; the runtime already runs them. §EDITOR-01-D's `_applyItemChain` already ships the `grantBit` mechanic the non-skill chaining leans on.
- **Server (`wbapi-server.js`):** untouched. `POST /api/quest` per step is the existing route.
- **`wbapi-core.js`:** untouched. `quests.create`/`advise`/`chain` reused as-is.
- All new code is **worldbuilder.html** (a new tab + builder IIFE logic) — a pure authoring tool. Consistent with [[feedback_api_only_connections]] (mutations still go through the server's quest endpoint) and the API-First rule.

## 8. Divergence / risk notes

- **Bare-identifier activateCond** is a save-aborting error (wbapi-core.js:1195). The compiler MUST emit `(s)=>s.flag`. Locked into `buildArcQuests` + covered by a test asserting the emitted string matches `/^\(s\)\s*=>\s*s\./`.
- **Flag name collisions** across arcs: auto flags are namespaced by `arcId` (`<arcId>_<n>_passed|done`), so two arcs can't collide unless they share an arcId — which would also collide their quest ids, caught by `create`'s "already exists" guard (:2002).
- **Partial POST**: stop-on-first-error can leave steps 1..k−1 posted. That's acceptable and visible (the report shows exactly which succeeded); re-running after fixing the bad step will hit "already exists" on the posted ones — so POST All skips ids already in `questDb` with an `already-posted` note rather than erroring.
- **Not in scope (→ §EDITOR-02-FU):** branching arcs (a step gating on >1 upstream), drag-reorder of steps (shares the §EDITOR-01-D-FU visual-editor work), and UQF export of a whole arc (that's §EDITOR-03).

## 9. Test plan

Headless (node-vm / pure-fn) where possible, Playwright for the DOM:
1. `buildArcQuests` — 3-step skill_check arc: ids `_1/_2/_3`, step 2/3 `activateCond` = `(s)=>s.quest_x_<n-1>_passed`, every emitted activateCond matches the arrow-fn shape (not bare ident).
2. `buildArcQuests` — mixed arc (skill_check → side → skill_check): the side step gets an appended `grantBit|…_done` and the following step reads `…_2_done`.
3. `gateMode:'none'`/`'manual'` pass-through — no auto activateCond injected.
4. Preview disables POST All when any step `advise` returns an error.
5. Playwright: fill a 2-step arc in the tab, Build Chain, assert the preview renders 2 `.chain-link` rows + the connector flag; `collect`-equivalent returns 2 well-formed quest objects.
6. POST All stop-on-first-error + already-posted skip (mock `create`).

## 10. Increment plan

- **Inc 1** — this lab report (design lock). *(current)*
- **Inc 2** — `buildArcQuests` compiler + `arcDraft` model + headless tests (the pure core; no UI yet). This is the load-bearing, testable piece.
- **Inc 3** — the Mission Builder tab UI: nav tab, arc-header form, add/remove step rows, Build Chain + Preview Chain render.
- **Inc 4** — POST All wiring (sequential create, per-step report, stop-on-error + already-posted skip) + Playwright DOM test; close §EDITOR-02 core.
- **FU (§EDITOR-02-FU)** — branching arcs, drag-reorder (shares §EDITOR-01-D-FU), whole-arc UQF export (→ §EDITOR-03).
