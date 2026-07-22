<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §VM-01-A · *Give the VM a `yield`*: `execBits` → coroutine

> **Child lab report of** `lab-reports/lab-report-javascript-mud.md` (the structural read that opened §VM-01) and of the §VM-01 track in **[BACKLOG.md](../BACKLOG.md)**. **Type:** *Design review before implementation* (Lab Report Policy row 4 — "IEEE-format spec locking data shapes and flow before any HTML edit"). Per the §VM-01 preamble: *"every increment locks its own child lab report (data shapes + flow) before any HTML edit."* **This is that lock for Inc A. No product code is touched by this report.**
>
> **Theme (matched to `story.md` / the track's *No Word for Wait*):** the engine *tells* and cannot *ask*. Inc A gives the VM the single missing instruction — a `yield` — so a quest can, for the first time, **wait for an answer**. Everything else in the track is a consumer of this one word.
>
> **Anchors below were grepped from the live `roll2hit-v3.html` this session (37,618 lines, 5.11 MB, working tree at branch `feat/board-01-warrants-board`).** They have already drifted from the values in the BACKLOG §VM-01 rows (which were measured at `43bd09c`): `execBits` moved `21722 → 21825`, the `choice` handler `21779 → 21882`, `unlock` `21778 → 21881`. **Re-grep before editing — these will drift again.**

---

## 1. Abstract

`execBits` (`21825`) is the quest VM's instruction pump: a straight-line `for` loop that looks up `HANDLERS[bit.kind]`, calls `h(bit, ctx)`, and discards the return value. It has **no branch and no suspend**. This one absence is the root cause named by the parent report — *"the VM has an opcode table and no jump instruction"* — and it is why three opcodes are inert or smuggled:

| Opcode | Contract | Handler | Status |
|--------|----------|---------|--------|
| `choice` | `21680` — rigorous: requires `prompt` + `options`, each option a `label` + `bits[]` | `21882` — **empty**: `choice(bit, ctx) { /* Phase 2: renderChoiceBlock(...) */ }` | **0 authors** — a synchronous `for` loop cannot wait for a human |
| `item_check` | `21672` — "lab Open-Q #3" | `21880` — writes `ctx._itemCheck = …`; **nothing reads it back** (full-file grep = one line) | a conditional in a language with no `if` — evaluates and evaporates |
| `skill_check` | `21660` | `21859 → resolveSkillCheck 21850` — branches by **hardcoding it inside the leaf**: `execBits(pass ? bit.onPass : bit.onFail, ctx)` (`21853`) | the sole conditional in the language, baked into one instruction rather than available to it |

**Inc A converts `execBits` into a generator, adds a driver that pumps it, and lets a handler suspend by `yield`ing an `ask` envelope.** This is `coroutine.yield` transliterated. It is ~30 lines of engine change plus a mechanical wrap of five existing call sites, and it must be *observably a no-op* on the 2,850 live quests (none of which yield today). It ships **the mechanism** and **one proof** (a real `choice` chain driven end-to-end in a new test) — it deliberately does **not** ship choice UI content, a quest-acceptance rewrite, or the skill_check un-smuggle; those are downstream consumers enabled by, but out of scope for, this keystone (§10).

---

## 2. Method

A structural read of the `QuestRuntime` block (`21713`–`21899`) and every live `execBits` call site, grepped and quoted verbatim below — not recalled. No quest-by-quest audit; the defect is in the engine, and there is exactly one of it.

**The engine today, in full (`21824`–`21831`):**

```js
/* Execute an ordered bit chain. Unknown kinds are warned + skipped. */
execBits(bits, ctx) {
  for (const bit of (bits || [])) {
    const h = QuestRuntime.HANDLERS[bit.kind];
    if (!h) { console.warn('[UQF] unknown bit kind:', bit.kind); continue; }
    h(bit, ctx || {});
  }
},
```

**The one branch in the language, smuggled into a leaf (`21850`–`21855`):**

```js
resolveSkillCheck(bit, ctx) {
  const r = QuestRuntime._rollSkill(bit.stat);
  const pass = r.total >= bit.dc;
  QuestRuntime.execBits(pass ? (bit.onPass || []) : (bit.onFail || []), ctx);  // ← the sole conditional
  return { d20: r.d20, total: r.total, pass };
},
```

**The empty handler whose contract already validates (`21882`):**

```js
choice(bit, ctx) { /* Phase 2: renderChoiceBlock(bit.prompt, bit.options, ctx) */ },
```

The Phase-2 comment is a note-to-self that was never actionable, because there was no state in which the VM could be *waiting* for the render to resolve. Inc A creates that state.

---

## 3. Concepts added (three, all additive)

| Concept | Shape | Where it lives | Persisted? |
|---------|-------|----------------|-----------|
| **`ask` envelope** | `{ ask:'choice', prompt:string, options:string[] }` — the value a suspending handler `yield`s | produced by handlers, consumed by the driver | **never** (it is a transient yield value) |
| **generator `execBits`** | `function*` — `yield* r` when a handler is itself a generator | `QuestRuntime.execBits` (replaces `21825`) | n/a |
| **the driver** | `pump(gen, ctx)` + `runToCompletion(gen)` | module-level, **host layer**, beside `_resolveQuestUQF` (`6799`) — **not** in a kernel | the in-flight generator is **module state, never in `S_story`** |

No new opcode. No new gate term. No new `S_story` field. No new persisted state. `BIT_CONTRACTS` (`21659`) is untouched — `choice`'s contract (`21680`) already exists and already validates; Inc A only makes its handler real.

---

## 4. The transformation

### 4.1 `execBits` becomes a generator

```js
/* Execute an ordered bit chain. A handler that is itself a generator may
   suspend (yield an `ask`); a plain handler runs to completion as before. */
function* execBits(bits, ctx) {
  for (const bit of (bits || [])) {
    const h = QuestRuntime.HANDLERS[bit.kind];
    if (!h) { console.warn('[UQF] unknown bit kind:', bit.kind); continue; }
    const r = h(bit, ctx || {});
    if (r && typeof r.next === 'function') yield* r;   // handler suspended → propagate its yields
  }
}
```

Plain handlers (all eleven live ones — `flag_write` `21860`, `reward` `21861`, `unlock` `21881`, …) return `undefined`; the `if` skips them; behaviour is byte-identical. Only a handler written as a `function*` can suspend.

### 4.2 `choice` becomes real (the contract already validates it)

```js
*choice(bit, ctx) {
  const picked = yield { ask:'choice', prompt: bit.prompt, options: bit.options.map(o => o.label) };
  yield* execBits(bit.options[picked].bits, ctx);   // apply ONLY the chosen option's bits — after the pick
}
```

The effect (`options[picked].bits`) is applied **only after** the driver resumes the generator with the picked index. Nothing is written on the way *in*. This is the property that makes the save decision (§6.3) safe.

### 4.3 The driver — two entry points

```js
// Resume a suspended generator with the player's answer; returns when it next
// suspends or finishes. Renders whenever the generator yields an `ask`.
function pump(gen, answer) {
  let step = gen.next(answer);
  while (!step.done) {
    if (step.value && step.value.ask) { _uqfPending = { gen, ask: step.value }; return step.value; }
    step = gen.next();               // a non-ask yield is a pass-through (none defined in Inc A)
  }
  _uqfPending = null; return null;   // chain complete
}

// Migration shim: pump to completion, THROW on an unanswered ask. Used at every
// synchronous call site — none of which contains a choice bit today, so this is
// behaviourally identical to the old straight-line execBits.
function runToCompletion(gen) {
  const step = pump(gen);
  if (step) throw new Error('[UQF] runToCompletion hit an unresolved ask: ' + step.ask);
}
```

`_uqfPending` is a **single module-level slot** holding `{ gen, ask }`. When the player picks an option in the rendered `choice` block, the click handler calls `pump(_uqfPending.gen, index)`. This slot is the entire "waiting for an answer" state — and it lives outside `S_story` on purpose (§6.3).

### 4.4 Migration — wrap five call sites, change no behaviour

Because a generator function returns an iterator instead of running, every existing caller must wrap the call in `runToCompletion(...)`. The complete set (grepped this session):

| Site | Line | Chain executed | Contains a `choice` today? |
|------|------|----------------|:--:|
| `_resolveQuestUQF` onPass | `6829` | `sc.onPass` | no |
| `_resolveQuestUQF` onFail | `6832` | `sc.onFail` | no |
| `resolveSkillCheck` | `21853` | `pass ? onPass : onFail` | no |
| `storyCheckQuests` completion | `29498` | `q.onComplete` (array) | no |
| `_acceptBounty` (§BOARD-01-B) | `36137` | `[{kind:'unlock', …}]` | no |

Each becomes `runToCompletion(QuestRuntime.execBits(chain, ctx))`. Since none of the five chains contains a suspending bit, `runToCompletion` pumps straight through with zero yields → **identical side effects, identical message order**. This is the guarantee the regression asserts (§9). `_rollCeremonia` (`23044`) reaches the engine through `resolveSkillCheck`/`_resolveQuestUQF`, so it needs no separate wrap.

---

## 5. Data shapes to lock

**The `ask` envelope (locked shape):**

```
{ ask: 'choice', prompt: string, options: string[] }
```

- `ask` is a **discriminator** — `'choice'` is the only value Inc A emits. `'confirm'` (a degenerate 2-option choice) and `'prompt'` (free-text input) are **additive later** without touching the driver: `pump` already branches on `step.value.ask`; a new kind is a new render arm, not an engine change. **Locked: Inc A ships `choice` only.** (Decision §6.1.)
- `options` is `string[]` of labels — the render layer's concern; the resume value is the **index**, so the data author never couples to presentation.
- The envelope is **never persisted** — it is a yield value consumed within the turn.

**The `choice` bit (author-facing — already contracted at `21680`, unchanged):**

```js
{ kind:'choice', prompt:'…', options:[ { label:'…', bits:[ …bits… ] }, { label:'…', bits:[ …bits… ] } ] }
```

Inc A authors **zero** `choice` bits into `QUEST_DB` — the first authored choice (quest acceptance, moral forks) is downstream content work. The test (§9) constructs one in-fixture to drive the mechanism.

---

## 6. Design decisions — LOCKED (all three flagged for veto)

The §VM-01-A "Lock first" clause names three questions. The recommended answers are derivable from the code read above; each is locked here and **flagged for the user's veto on the next `continue`** (house precedent: §BOARD-01-0, §BOARD-01-FU7/FU8 — design calls made in the lab report, veto-flagged).

### 6.1 Which `ask` shapes exist? → **`choice` only in Inc A; envelope discriminated for `confirm`/`prompt` later.**
**Rationale:** `choice`'s contract already exists and already validates (`21680`) — it is the shape with zero implementation cost beyond the mechanism. `confirm` is expressible as a two-option `choice` today; `prompt` needs a text-input widget (a UI build, not an engine change) and buys nothing Inc A's consumers need. Discriminating on `ask` from day one means adding them later is purely additive. **Veto axis:** ship `confirm`/`prompt` now instead of deferring.

### 6.2 Where does the driver live? → **A module-level pump in the host layer, beside `_resolveQuestUQF` (`6799`); never in a kernel.**
**Rationale:** the driver must render (touch the DOM) to present a `choice`, so it cannot sit inside a pure parity-fenced kernel (`MOVER`/`ROOMS`/`DUEL` take a `world` and return data, never touch DOM). But `QuestRuntime` is explicitly *the host*, not a kernel — its handlers already call `storyMsg`/`storyPreBattle` (`21870`/`21869`). The driver belongs exactly where quest resolution already lives. **This keeps the Host/Script Separation Policy intact:** `QUEST_DB` is script, `QuestRuntime` + driver is host; the boundary is unchanged, it just gained a `yield`. **Veto axis:** put `pump`/`runToCompletion` as methods on the `QuestRuntime` object vs. free module functions (cosmetic; either preserves the boundary).

### 6.3 How does an un-answered `ask` survive a save/reload? → **It doesn't — and that is the design, not a gap.**
**This is the real decision.** Persistence is proven by the code: autosave is `localStorage.setItem('r2h_autosave', JSON.stringify(S_story))` (`23238`); load is `Object.assign(S_story, _S_DEFAULTS(), JSON.parse(raw))` (`23251`, `23267`). **A generator object is not JSON-serializable** — so a suspended coroutine *cannot* be captured by a save even in principle.

The lock turns that constraint into an invariant:

1. **The in-flight generator lives only in `_uqfPending` (module state), never in `S_story`.** It is therefore structurally impossible to serialize — the desired property, not a limitation.
2. **A `choice` resolves within a single interaction turn** — render → click → resume → complete — before control returns to the movement/rest paths where autosave fires (`23238` fires on step/rest, not mid-render). **No autosave or checkpoint call may run while `_uqfPending` is non-null.** The driver holds the turn; the test asserts an autosave taken mid-suspension never captures a generator.
3. **Effects apply only after the pick** (§4.2), so a player who closes the tab mid-choice has written **no partial state**. On reload the quest is exactly where it was; its `choice` re-offers on the next interaction. Idempotent, no rollback, **no save-migration** (nothing new persists — unlike §VM-01-B's `rngState`).

**Veto axis:** the alternative is a *serializable* suspension — store `{ questId, bitPath, awaitingAsk }` in `S_story` and rebuild the generator on load. That is a materially larger change (every suspending handler must be resumable from a data cursor, not a live stack frame) and buys only cross-save choices, which no content needs. **Recommendation: reject it for Inc A; suspend within a render turn only.** Revisit only if a future feature needs a choice to survive a reload.

---

## 7. Exact anchors (live file, this session)

| Symbol | Line | Note |
|--------|-----:|------|
| `BIT_CONTRACTS` | `21659` | opcode table; `choice` contract `21680`, `item_check` `21672`, `skill_check` `21660`, `unlock` `21678` |
| `QuestRuntime` object | `21713` | the host |
| `canActivate` | `21720` | declarative gate (untouched by Inc A) |
| `canComplete` | `21774` | Open-Q #5 comment `21772`; the OR-group `21790` (→ §VM-01-F's `or`) |
| **`execBits`** | **`21825`** | **the target — `for` loop → `function*`** |
| `resolveSkillCheck` | `21850` | smuggled branch at `21853` |
| `HANDLERS` | `21858` | `flag_write` `21860`, `reward` `21861`, `item_check` `21880`, `unlock` `21881`, **`choice` `21882`** |
| `_resolveQuestUQF` | `6799` | call sites `6829`/`6832` — driver's natural home |
| `storyCheckQuests` completion | `29498` | `onComplete` chain exec |
| `_acceptBounty` (§BOARD-01) | `36137` | fifth call site; already routes through `execBits` |
| `_S_DEFAULTS` | `22573` | fresh-state shape — **unchanged** (no new field) |
| autosave / load | `23238` / `23251` / `23267` | the serialization boundary the §6.3 lock respects |
| test dir | `tests/integration/` | new file `uqf-coroutine.test.js`; regression `quest-runtime-uqf.test.js` |

---

## 8. Invariants preserved (all load-bearing — [CONTRIBUTING.md](../CONTRIBUTING.md))

- **Host/Script Separation.** `QUEST_DB` stays script; `QuestRuntime` + driver stays host. The boundary gains a `yield`; it does not move. Control flow moves *into the VM* (`execBits`) and *out of the leaf* — the exact direction the policy's first rule mandates ("Control flow belongs to the VM, never to a leaf handler … `skill_check` … is the exception to retire, not the pattern to copy").
- **Three kernels untouched.** `MOVER:CORE`/`ROOMS:CORE`/`DUEL:CORE` sentinels are not in the edit region (`execBits`/`HANDLERS` are ~11,000 lines below the kernels). Gate: git-diff shows **0 kernel sentinels**; `npm run check:walk` parity unchanged.
- **Free-Movement / Mission-Gating.** Inc A touches quest *effect execution*, never the mover. No `S_story`/flag/bit is added that any movement code reads. **No new movement-refusal** (still `'oob'`/`'sea'` only). No jump travel.
- **No new game-state `Math.random()`.** Inc A adds no randomness (the seeded-stream work is §VM-01-B). `_rollSkill`'s `Math.random()` at `21842` is untouched by this increment.
- **Purity claims stay honest.** `execBits` was never labelled pure; as a generator it still isn't (handlers mutate `S_story`). No purity comment is added that the code would falsify.

---

## 9. Test plan

**New: `tests/integration/uqf-coroutine.test.js`** — drives a *real* `choice` chain end-to-end:

1. **Suspend-and-resume.** A fixture quest with a `choice` bit (2 options, each option's `bits` sets a distinct flag). Pump `execBits`; assert it yields `{ ask:'choice', options:[…] }` and that **neither** option's flag is set yet (nothing applied on the way in). Resume with index `1`; assert **only** option 1's flag is set.
2. **`runToCompletion` throws on an unanswered ask.** Same fixture through `runToCompletion`; assert it throws `[UQF] runToCompletion hit an unresolved ask`.
3. **Plain chains are unchanged.** A `flag_write`+`reward`+`narrative` chain through `runToCompletion`; assert identical side effects and message order to the pre-Inc-A `execBits` (a golden-output check).
4. **Save cannot capture a suspension (§6.3 invariant).** With `_uqfPending` non-null (mid-choice), take an autosave; assert `JSON.parse(localStorage.r2h_autosave)` contains **no** generator/`_uqfPending` field and round-trips cleanly.
5. **`item_check` becomes readable (bonus proof).** Show a `choice` whose branch is chosen by a preceding `item_check` result — proving the write-only `ctx._itemCheck` (`21880`) is now consumable by a following bit. *(If this exceeds ~30 lines it moves to the follow-on; the mechanism is what Inc A must prove.)*

**Regression (the whole point — must be a no-op):**
- `quest-runtime-uqf.test.js` — **full pass** (target **302/302**; the five wrapped call sites must change no observable behaviour). ⚠️ *Env caveat carried from §BOARD-01: this suite reports **15 pre-existing failures in this environment**, proven identical with the HTML change git-stashed (a story-tab default-view quirk, not a regression). Run bare + read the summary line from a file (Test-Run Rule 1); stop the WBAPI server first (Rule 2). The Inc A verdict is "no NEW failures vs. the stashed baseline," not an absolute count.*
- `warrants-board.test.js` (**25/25**) — `_acceptBounty`'s `execBits` is one of the five wrapped sites.
- `courier-map` 1/1 · `enemy-ai` 4/4 · `kg-quest-chain` 4/4.
- Inline script parses clean (`node --check` on the extracted `<script>`); **0 kernel sentinels** in the diff; **no new movement-refusal**.

---

## 10. Scope fence — what Inc A does NOT do

Inc A ships the **mechanism** (`yield` + driver + `ask` envelope) and **one proof** (the test's `choice` chain). It explicitly defers, to keep the diff ~30 lines and the regression a clean no-op:

- **Choice UI content** — no authored `choice` bit lands in `QUEST_DB`. The render block for a live on-screen `choice` (the `renderChoiceBlock` the `21882` comment imagined) is the first *consumer*, shipped next.
- **Quest-acceptance rewrite** — §PLAY-01's "the engine tells, never asks" is *fixed by* this seam (acceptance becomes a `choice` bit at the head of a chain), but the acceptance flow itself is a follow-on, not Inc A.
- **Un-smuggling `skill_check`** — `resolveSkillCheck` (`21850`) keeps its in-leaf branch for Inc A (wrapped in `runToCompletion`). Making it a `function*` that `yield*`s so a skill_check branch can *suspend* is the enabling follow-on — mechanical once the generator exists, but out of Inc A's blast radius.
- **`'abandoned'` status / transactional rollback** — both become expressible once a stage can suspend/branch; neither is built here.

**Forward pointers (dependency order from the BACKLOG §VM-01 preamble):** A · B · C independent (A is the keystone). D needs C. E needs C + the `_legacy_fn` purge. F answers `canComplete`'s own `or` question (`21772`/`21790`). G needs A + F to be worth doing.

**Prior art (from the track preamble):** Ink (Inkle) compiles narrative to bytecode on a small VM and **suspends at a `ChoicePoint`** — structurally exactly this. Yarn Spinner for dialogue. (CEL / JSONLogic are Inc F's expression-AST reference, not Inc A's.)

---

## 11. Verdict

**Locked and ready to implement on the next `continue`**, pending veto of the three §6 calls. The change is ~30 engine lines + five one-line call-site wraps; the risk is entirely in the regression being a true no-op, which the test plan is built to prove. Inc A is the keystone: once the VM can `yield`, every "the engine can't do that" in the §VM-01 track becomes "author it in data."

*© 2026 Paul Richeson — MIT License.*
