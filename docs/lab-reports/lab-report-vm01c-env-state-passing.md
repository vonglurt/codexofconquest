<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
<!-- §VM-01-C child lab report — locked BEFORE the HTML edit (CONTRIBUTING.md Lab Report Policy). -->
<!-- Parent structural read: lab-report-javascript-mud.md. Siblings: -vm01a-execbits-coroutine.md, -vm01b-client-rng-seed.md. -->

# Lab Report — §VM-01-C · *Pass the state, don't close over it*: the `_ENV` fix

**Track:** §VM-01 — The Quest VM → *No Word for Wait* · **Increment:** C (third; independent of A and B)
**Status:** design LOCKED → SHIPPED `c22f4f0` (2026-07-22) · **verified 30 days on, §12**
**Author decision on file (BACKLOG §VM-01-C 🟠 ASK):** *flag registry — defer.* The user chose the pure `_ENV` refactor; the enumerable-namespace / typo→error registry lands in §VM-01-E instead, as a static check rather than a runtime throw (§7.3).

> **§DOC-02co verification pass — 2026-08-21.** Re-measured against live `roll2hit-v3.html` (**38,712** lines), against the ship build `c22f4f0` (**37,694**) and its parent (**37,618**), 30 days and six increments after the ship. Original text 152 lines; this rewrite is the same lock, shortened, with an anchor ledger, a spec→shipped delta table and an errata section. **Nothing was deleted for being wrong** — a claim that did not hold is marked and kept.

---

## 1. Abstract

Every `QuestRuntime.HANDLERS` effect handler reached the `S_story` module global **by name**. The clearest instance is the one the backlog called out:

```js
flag_write(bit) { (bit.set || []).forEach(f => S_story[f] = true); … }
```

Quest data — untrusted, authored *content* — writes arbitrary named keys onto a host global. That is not a host API; it is handing a script a raw pointer to host memory. This increment threads an **env** through the effect layer instead: handlers read and write **`ctx.state`**, seeded once by `execBits`. The env **defaults to the live `S_story`**, so the live path is a provable no-op — while §VM-01-D and §VM-01-E gain the one thing both require: **the ability to run a quest against a state that is not the player's save.**

**Result, measured 30 days on: the seam shipped exactly as locked and both predicted consumers arrived.** Seven handlers changed, four host-fence handlers did not, no field was added, and `src/scripts/check-questgraph.js` — the soft-lock prover that tells us the world is finishable — runs on this seam today.

## 2. Inspiration, and why a player cares

The idea is borrowed wholesale from Lua embedding: you do not let a sandboxed script see your globals, you set its `_ENV` to a table holding exactly what it may touch. The same move was already made three times in this repo — MOVER/ROOMS/DUEL:CORE take state as a parameter instead of closing over a singleton. This increment applies it one layer up, to the quest VM's effect layer.

**The playability argument is entirely second-order, and it is the strongest kind.** No player will ever see `ctx.state`. What a player sees is a game that can be *checked before they play it*:

- **A quest chain can be rehearsed without being lived.** Before this change, the only way to find out what a bit chain does was to run it into the player's save and look. After it, the same chain runs into a scratch object — so a tool can ask *"what does this quest actually write?"* and get an answer without a playthrough.
- **That is what makes soft-lock detection possible at all.** §VM-01-E's prover walks the world asking *is there a reachable state satisfying this gate?* — which means applying effect chains to candidate states. At HEAD it analyses **2,853 quests**, finds **2,804 reachable**, and reports **0 residual nondeterminism**. A player who reaches Act 8 and finds the last quest un-completable is the worst bug an RPG can ship; this seam is the reason we can look for that class of bug mechanically instead of hoping.
- **It made the prover *cheaper*, not just possible.** §VM-01-E's ship record names the reason it could take the light option: *"C's scratch-state seam + D's headless requireable kernel ARE a dynamic prober."* The 124 deterministic `_legacy_fn` closures never had to be ported to new opcodes, because they could simply be **executed against a scratch state and diffed**.

The one-line version: *the game got safer to change, and a game that is safe to change is a game that keeps getting content.*

## 3. Method

`execBits` is the sole entry to every handler (grep-confirmed: no handler is invoked anywhere else). It normalises its `ctx` once, seeding `ctx.state` with the live `S_story` when a caller does not supply one. Each **state-touching** handler then reads/writes `ctx.state`. **Host-effect** handlers — the ones whose job is to render, launch a battle, mint over the network, clamp favor, or roll the dice — keep reaching their live singletons, because they *are* the host, not the script's memory. That split is the Host/Script Separation Policy stated in terms of state ownership.

Because every real call site already passes a `ctx` object and **none** passes `.state`, defaulting `ctx.state = S_story` reproduces prior behaviour byte-for-byte.

## 4. The transformation

### 4.1 The seam — `execBits` seeds the env once

The pre-change form built a fresh `{}` **per bit**; the new form shares one `c` across the chain. That is observationally identical (every call site supplies a `ctx`, so the undefined branch was never taken) and is the correct shape for the `item_check → ctx._itemCheck` pattern, which needs the shared object.

As shipped at `c22f4f0`, and structurally unchanged at HEAD (`*execBits(bits, ctx) {@22223`, `if (!c.state) c.state = S();@22225`):

```js
*execBits(bits, ctx) {
  const c = ctx || {};
  if (!c.state) c.state = S_story;   // §VM-01-C: the _ENV — handlers write/read c.state, defaulting to the live S_story
  for (const bit of (bits || [])) {
    const h = QuestRuntime.HANDLERS[bit.kind];
    if (!h) { console.warn('[UQF] unknown bit kind:', bit.kind); continue; }
    const r = h(bit, c);                        // was: h(bit, ctx || {})
    if (r && typeof r.next === 'function') yield* r;
  }
},
```

### 4.2 The state handlers — read/write `ctx.state`

Seven handlers change; **only the state access changes, all other logic is verbatim.** All seven verified byte-exact at `c22f4f0` and live at HEAD.

| Handler | Before | After | HEAD anchor |
|---|---|---|---|
| `flag_write` | `S_story[f] = true/false` | `st[f] = …` where `st = ctx.state` | `flag_write(bit, ctx)@22268` |
| `reward` | `S_story.xp/gold/inventory/knowledge` | `st.xp/gold/inventory/knowledge` | `reward(bit, ctx) {@22269` |
| `item_remove` | `S_story.inventory` | `ctx.state.inventory` | `item_remove(bit, ctx) {@22302` |
| `mission_bit` | fallback `S_story[bit.flag] = true` | fallback `ctx.state[bit.flag] = true` | `mission_bit(bit, ctx) {@22303` |
| `item_check` | reads `S_story.inventory` | reads `ctx.state.inventory` | `item_check(bit, ctx) {@22311` |
| `unlock` | `S_story.quests[qid] = active` | `ctx.state.quests[qid] = active` | `unlock(bit, ctx) {@22312` |
| `_legacy_fn` | `bit.fn(S_story, ctx)` | `bit.fn(ctx.state, ctx)` | `_legacy_fn(bit, ctx) {@22327` |

### 4.3 The host-fence handlers — unchanged, by design

`combat(bit) { if (E.preBattle)@22300`, `narrative(bit, ctx) {@22301`, `favor(bit) {@22306` and the `skill_check(bit, ctx) {@22265` roll keep host access. These are host *effects*. A static reachability check never executes them; routing them through a scratch env would buy nothing and would falsely imply the host could be redirected. `_legacy_fn` still runs arbitrary code and remains E's stated blocker — giving it `ctx.state` makes it consistent, not analysable.

## 5. Anchor ledger — the §7 table, re-scored

The original §7 carried the disclaimer *"live file, this session — re-grep before editing; they drift each increment."* **They drifted during the increment**, and the drift is legible: measured against the ship build `c22f4f0`, the ten anchors form a **strictly monotonic staircase** — 0, −2, −2, −4, −5, −5, −5, −5, −5 — the signature of a measurement taken part-way through this increment's own insertion. **Not one anchor is dead.**

| Symbol | Reported | At `c22f4f0` | Δ |
|---|---|---|---|
| `*execBits(bits, ctx)` | 21881 | 21881 | **0 — exact** |
| Sole handler entry `h(bit, …)` | 21885 | 21887 | −2 |
| `resolveSkillCheck` | 21910 | 21912 | −2 |
| `HANDLERS` block | 21918 | 21920 | −2 |
| `reward` | 21921 | 21925 | −4 |
| `item_remove` | 21931 | 21936 | −5 |
| `mission_bit` | 21932 | 21937 | −5 |
| `item_check` | 21940 | 21945 | −5 |
| `unlock` | 21941 | 21946 | −5 |
| `_legacy_fn` | 21956 | 21961 | −5 |

The seam anchor is exact, and it is the one the ship record in `plan-archive.md` re-measured and published. The maximum drift, 5, is this increment's own net insertion below the seam.

## 6. Why this is the enabler for D and E — **confirmed, with named consumers**

Both downstream increments needed to evaluate a quest chain against a hypothetical state, and both now do, in code that exists today:

| Consumer | Call | Increment |
|---|---|---|
| `src/tests/integration/uqf-quest-core.test.js:117` | `run(rt, […], { state: scratch })` | §VM-01-D |
| `src/tests/integration/uqf-softlock.test.js:81` | `execBits(onFail, { state: scratch, … })` | §VM-01-E |
| `src/tests/integration/uqf-env.test.js` | five sites | §VM-01-C (this report) |

**One correction the report could not make about itself.** §6 of the original closed *"That is the entire deliverable."* §VM-01-D's ship record amends it directly and fairly: *"§VM-01-C moved the state writes to `ctx.state`; it did not touch those ten calls — **C was necessary, not sufficient**."* `QuestRuntime` also closed over ten *host functions*, and fencing it required D's full dependency injection. **The seam was the precondition, not the whole enabling.** Recorded, not defended.

## 7. Design decisions — LOCKED, and scored 30 days on

### 7.1 Env scope — the effect handlers only; gate readers and the roll stay on `S_story`
`canActivate(questId) {@22193` / `canComplete(questId) {@22205` are **evaluators**, not effect handlers, and threading them then would have been speculative surface with no consumer. **Rejected axis:** *"thread `ctx.state` through everything that names `S_story`"* — larger blast radius, breaks the clean no-op.

> **Outcome: the deferral was right and the rejected axis was never taken.** §VM-01-D *did* thread the gate readers eight days later — but through `function createQuestRuntime(host) {@22180` and a call-time `getState()`, not through `ctx.state`. The engine comment records the debt in the right direction: *"resolved at CALL time, so §VM-01-C's per-call `execBits(chain,{state})` seam survives."* When a consumer finally arrived it wanted a **different shape** — which is exactly the argument §7.1 made for waiting.

### 7.2 Env default — live `S_story`, seeded in `execBits`, never in `S_story` itself
The env is a *call-time* parameter, not persisted state. It must never ride a save: a scratch state stored in `S_story` would serialise and corrupt the real one, and a self-reference is a `JSON.stringify` cycle.

> **Outcome: HELD, verified at HEAD.** `const _S_DEFAULTS = () => ({@23062` carries no `state` and no `env` field, 30 days and six increments on.

### 7.3 Registry — deferred to §VM-01-E (the ASK, answered by the user)
An enumerable flag namespace where a typo throws is the natural companion, but it is a *behaviour* change, not a no-op: it would surface every existing dead or mistyped flag as a new runtime error, muddying this increment's verdict. Better caught **statically**.

> **Outcome: SHIPPED where promised, and the destination names this report as the source.** `src/scripts/check-questgraph.js:detector §VM-01-C deferred here.@36`. It runs green today and reports **50 written-by-nothing** and **982 read-by-nothing** flags as a review artifact. *A deferral is only honest if someone writes down where it went; this one is cited by name in the file that received it.*

## 8. Invariants preserved

- **Host/Script Separation** — *advanced*, not merely preserved: the script layer no longer names a host global.
- **Parity kernels** — **0 kernel sentinels in the `c22f4f0` diff**, measured, not asserted.
- **§STATE-INIT** — `_S_DEFAULTS()` unchanged; still true at HEAD (§7.2).
- **§VM-01-A coroutine contract** — `execBits` stays a generator; `ctx.state` is set before the loop, so a suspending `choice` resumes against the same env.
- **§VM-01-B seeded rng** — `_seededNext` untouched. (The roll has since moved to the injected `const d20  = Math.ceil(E.rng() * 20)@22248` under §VM-01-D — still a host concern, new plumbing.)
- **No new bit kind.** The `HANDLERS` key-set was pinned at **12** by `src/tests/integration/quest-runtime-uqf.test.js:28` and stayed exactly 12. *(At HEAD it is 13 — `cost`, added by §VM-01-G4a. Growth after the fence, not through it.)*

## 9. Test plan and result

`src/tests/integration/uqf-env.test.js` — five tests, one per claim, **all five shipped as planned and all five green in Chromium at HEAD (3.6 s, run this session)**:

| # | Claim | Result |
|---|---|---|
| 1 | Live-path no-op — a plain `ctx` mutates the live `S_story` as before | ✅ |
| 2 | **The payoff** — `execBits(chain, { state: scratch })` writes into `scratch`, `S_story` untouched | ✅ |
| 3 | `ctx.state` threads through a `choice` suspend/resume | ✅ |
| 4 | `item_check` reads the env inventory | ✅ |
| 5 | `_legacy_fn` receives the env, not the global | ✅ |

**Regression at HEAD:** `quest-runtime-uqf` **303/303**, `uqf-coroutine` **5/5**, `warrants-board` **25/25**, `rng-seed` **5/5** — all green.

## 10. Scope fence — what Inc C does NOT do, scored

| Fence | Held? |
|---|---|
| No flag registry / typo→error | **Held** — shipped in §VM-01-E as a static check (§7.3) |
| No gate-reader threading | **Held** — threaded later by D, via a different mechanism (§7.1) |
| No `_rollSkill` / rng threading | **Held** — the roll stayed a host concern; D made it an injected one |
| No host-effect redirection | **Held at HEAD** — `combat` / `narrative` / `favor` never took the env |
| No `_legacy_fn` purge | **Held** — and §VM-01-E later found the blocker was **1 bit, not 125** |
| No new field, save-migration, opcode, or authored content | **Held** — verified at HEAD |

**Six for six.** One qualification, recorded: `mission_bit` at HEAD passes `ctx.state` *into* the host grant as a third argument — the env crossed the fence, deliberately, by D's hand, in the direction the fence was designed to permit.

## 11. Errata — figures this report got wrong

Per §DOC-02 policy, wrong claims are corrected in place and **kept**, never silently removed. Every error below is in **framing prose**; the anchor table, the handler table and the code blocks have a **zero** error rate.

1. **"2,850 quests" → the real figure is 2,853**, measured with the `wbapi-core` parser at the ship build, its parent, *and* HEAD. The same wrong figure appears in the sibling §VM-01-A report: **one measurement, inherited twice.** Authors re-measure what they are about to *cite* and inherit what they are only *decorating with*.
2. **"the sole handler entry … line 21883" (§2) contradicts "21885" (§7).** §7 is correct; 21883 is the `HANDLERS[bit.kind]` **lookup**, not the call. The table was right and the sentence was wrong.
3. **"SHIPPED (2026-07-22; not committed, user rule)" is false.** This file is in `c22f4f0`, its first and only commit — committed by the very landing it describes. *A report can be wrong about whether it exists.* (Second sighting: the sibling §VM-01-A report carries the identical false disclaimer.)
4. **The "17-fail env baseline" was disproved the same working day.** §9 and §11 built a git-stash-diff ceremony around *"the §VM-01-A/B env baseline"* of 17 failures, treating them as environmental noise. **`bd951d7`, committed 8 h 24 min after `c22f4f0`, retired that baseline entirely** — *"it was 17 stale tests, not server clobber (17→1)"*, of which 16 were simply fixed. The suite held **303** tests at the ship, so 286 + 17 = 303 was internally consistent; what was wrong was the *word* **baseline**. **The method still returned the right answer** — 0 NEW failures, and C was a genuine no-op — but the evidence was interpreted through a fiction that the repo audited out of existence before dinner.

> *A baseline is a claim like any other. It is simply the one claim a report never thinks to re-measure.*

## 12. Verdict — SHIPPED, and it held

The `_ENV` seam is in place and intact 30 days on. `execBits` seeds `ctx.state`; the seven state handlers write and read it; the four host-fence handlers and the roll keep host access. **8 edits, all inside the QuestRuntime region; 0 kernel sentinels; no new field, handler, or opcode** — every one of those figures re-measured and confirmed.

**What the verification adds to the original verdict:**

- **The design locks all three held**, and §7.1 held in the most instructive way available: the axis it rejected was still the wrong axis when a consumer finally needed one.
- **Both predicted consumers exist by name**, and the prover consumes the seam so directly that it changed *how* §VM-01-E was implemented — the light option was available only because a chain could be run somewhere safe.
- **The anchors did not rot**; they were published mid-edit, and the offset is arithmetic.
- **The four errors are all in prose written last.** The tables, the code and the handler inventory — the parts an author *pastes* rather than *recalls* — are exact.

**Outcome, restated for the player:** the script layer no longer names a host global. `flag_write` and its six siblings write into an env the host hands them, and the same bit chain now runs against a scratch state without touching a save. That is why the repo can assert, mechanically and on every `check:walk`, that its **2,853 quests** contain **no residual nondeterminism** and that **2,804** of them are reachable. *The player never sees the env. They see a world that finishes.*
