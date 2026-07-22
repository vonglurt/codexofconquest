<!-- §VM-01-C child lab report — locked BEFORE the HTML edit (CONTRIBUTING.md Lab Report Policy). -->
<!-- Parent structural read: lab-report-javascript-mud.md. Prior increments: -vm01a-execbits-coroutine.md, -vm01b-client-rng-seed.md. -->

# Lab Report — §VM-01-C · *Pass the state, don't close over it*: the `_ENV` fix

**Track:** §VM-01 — The Quest VM → *No Word for Wait* · **Increment:** C (third; independent of A and B, both shipped)
**Status:** design LOCKED → SHIPPED (see §11)
**Date:** 2026-07-22
**Author decision on file (BACKLOG §VM-01-C 🟠 ASK):** *flag registry — defer.* The user chose the pure `_ENV` refactor; the enumerable-namespace / typo→error registry is **out of scope this increment** and lands in §VM-01-E's `check-questgraph.js`, where the gate→effect DAG already needs a "written-by-nothing / read-by-nothing" pass (the typo detector) as a static check rather than a runtime throw.

---

## 1. Abstract

Every `QuestRuntime.HANDLERS` effect handler reaches the `S_story` module global by name. The clearest instance is the one the backlog calls out:

```js
flag_write(bit) { (bit.set || []).forEach(f => S_story[f] = true); … }
```

Quest data — untrusted, authored content — writes arbitrary named keys onto a host global. That is not a host API; it is handing a script a raw pointer to host memory. In a Lua embedding you would set the script's `_ENV` to a table holding exactly what it may touch. This increment does the equivalent one layer up from the kernels: the handlers stop closing over the `S_story` global and instead read/write **`ctx.state`**, an env threaded in by `execBits`. The env **defaults to the live `S_story`**, so on the live path nothing changes — a provable no-op — while D and E gain the one thing they both require: the ability to **run a quest against a state that is not the live one**.

This is the same move already made inside the three parity kernels (MOVER/ROOMS/DUEL:CORE take state as a parameter instead of closing over a singleton), applied to the quest VM's effect layer.

## 2. Method

`execBits` (established in §VM-01-A as the sole entry to every handler — confirmed by grep: no handler is invoked anywhere except line 21883) normalises its `ctx` once, seeding `ctx.state` with the live `S_story` when a caller does not supply one. Each **state-touching** handler then reads/writes `ctx.state` instead of `S_story`. **Host-effect** handlers — the ones whose job is to render, launch a battle, mint over the network, run the favor-clamp helper, roll the dice, or check level-up — keep reaching their live singletons, because they *are* the host, not the script's memory. That split is the Host/Script Separation Policy, stated in terms of state ownership.

Because every real call site (6 production + every test) already passes a `ctx` object and **none** passes `.state`, defaulting `ctx.state = S_story` reproduces current behaviour byte-for-byte. The whole test is that `quest-runtime-uqf` stays the §VM-01-A/B env baseline exactly (0 NEW failures).

## 3. Concepts added (zero new fields, zero new handlers, one seam)

| Thing | Where | What |
|---|---|---|
| `ctx.state` | normalised in `execBits`; read by the state handlers | the `_ENV`: the object a bit chain's effects write into / read from. Defaults to the live `S_story`. |

No new `S_story` field. No new handler kind (the `HANDLERS` key-set is pinned by `quest-runtime-uqf.test.js:28` and stays exactly the 12 current kinds). No new opcode. The change is a **parameterisation**, not a feature.

## 4. The transformation

### 4.1 The seam — `execBits` seeds the env once

```js
*execBits(bits, ctx) {
  const c = ctx || {};
  if (!c.state) c.state = S_story;          // §VM-01-C: the _ENV — defaults to the live state (no-op on the live path)
  for (const bit of (bits || [])) {
    const h = QuestRuntime.HANDLERS[bit.kind];
    if (!h) { console.warn('[UQF] unknown bit kind:', bit.kind); continue; }
    const r = h(bit, c);                     // was: h(bit, ctx || {})
    if (r && typeof r.next === 'function') yield* r;
  }
}
```

Note the pre-existing form built a fresh `{}` **per bit** when `ctx` was undefined; the new form shares one `c` across the chain. This is observationally identical (every call site supplies a `ctx` object, so the undefined branch was never taken) and is in fact the correct shape for the `item_check → ctx._itemCheck` pattern, which needs the shared object.

### 4.2 The state handlers — read/write `ctx.state`

Seven handlers change (only the state access; all other logic is verbatim):

| Handler | Before | After |
|---|---|---|
| `flag_write` | `S_story[f] = true/false` | `st[f] = …` where `st = ctx.state` |
| `reward` | `S_story.xp/gold/inventory/knowledge` | `st.xp/gold/inventory/knowledge` (host calls `_checkLevelUp()`, `mpMintStamp()` unchanged) |
| `item_remove` | `S_story.inventory` | `ctx.state.inventory` |
| `mission_bit` | fallback `S_story[bit.flag] = true` | fallback `ctx.state[bit.flag] = true` (host `_grantMissionBit` unchanged) |
| `item_check` | reads `S_story.inventory` | reads `ctx.state.inventory` (still writes the predicate to `ctx._itemCheck`) |
| `unlock` | `S_story.quests[qid] = 'active'` | `ctx.state.quests[qid] = 'active'` |
| `_legacy_fn` | `bit.fn(S_story, ctx)` | `bit.fn(ctx.state, ctx)` — legacy fns now receive the env |

### 4.3 The host-fence handlers — unchanged, by design

`combat` (`storyPreBattle` + `NODE_MAP[S_story.currentCode]`), `narrative` (`storyMsg` / `ctx.pushMsg`), `favor` (`_setNpcFavor` / `_npcFavor` clamp helpers), and the `skill_check` roll (`_rollSkill`, which reads the live character sheet, advances the persisted §VM-01-B rng, and consumes the one-shot iodine buff) all keep their live-singleton access. These are host effects. A static reachability check (§VM-01-E) never executes them — it walks `onPass`/`onFail` as both-reachable and reads the *declared* reward/combat data, not its execution. Routing them through a scratch env would buy nothing and would falsely imply the host could be redirected. `_legacy_fn` still runs arbitrary code and remains E's blocker; giving it `ctx.state` only makes it consistent, not analysable.

## 5. Why this is the enabler for D and E

Both downstream increments need to *evaluate a quest chain against a hypothetical state*:

- **§VM-01-D** (whatever consumes the seam — replay / preview / server-side verification) needs to run effects into a scratch object and compare, without mutating the player's live save.
- **§VM-01-E** (the soft-lock prover) needs to ask "is there a state reachable from the start satisfying this gate?" — which means applying effect chains to candidate states, not the live one.

Before this increment neither is expressible: the effects hard-write `S_story`. After it, `execBits(bits, { state: scratch })` runs the exact same chain into `scratch` and leaves `S_story` untouched. That is the entire deliverable.

## 6. Design decisions — LOCKED

### 6.1 Env scope — **the effect handlers only; gate readers and the roll stay on `S_story` this increment.** (flagged for veto)
`canActivate` / `canComplete` read `S_story` directly (dozens of terms). They are **evaluators**, not effect handlers, and §VM-01-E builds its own *static* gate walker over the gate→effect DAG rather than calling them at runtime — so threading them now would be speculative surface with no consumer. `_rollSkill` stays on the live sheet/rng (host roll; E does not roll). **Rejected axis:** "thread `ctx.state` through everything that names `S_story`" — larger blast radius, breaks the clean no-op (the roll's rng/iodine mutations would move), and serves no increment on the board.

### 6.2 Env default — **live `S_story`, seeded in `execBits`, never in `S_story` itself.** (flagged for veto)
The env is a *call-time* parameter, not persisted state. It must never ride a save (a scratch state in `S_story` would serialise and corrupt the real one). Seeding it in `execBits` — the sole handler entry — guarantees every handler sees a defined `ctx.state` without touching any call site. **Rejected axis:** a persisted `S_story.env` pointer (serialises; and a self-reference `S_story.env === S_story` is a `JSON.stringify` cycle).

### 6.3 Registry — **deferred to §VM-01-E** (the ASK, answered by the user).
An enumerable flag namespace where a typo throws is the natural companion, but it is a *behaviour* change, not a no-op: it would surface any existing dead/mistyped flag as a new runtime error, muddying this increment's verdict. The same defect is better caught **statically** by §VM-01-E's `check-questgraph.js` "written-by-nothing / read-by-nothing" pass, which reports typos as findings without breaking a live playthrough. So the pointer-safety half ships here; the namespace-safety half ships in E.

## 7. Exact anchors (live file, this session — re-grep before editing; they drift each increment)

| Symbol | Line |
|---|---|
| `*execBits(bits, ctx)` | `21881` |
| `resolveSkillCheck` | `21910` (unchanged — passes `ctx` to `execBits`) |
| `HANDLERS` block | `21918`–`21957` |
| `flag_write` | `21920` |
| `reward` | `21921` |
| `item_remove` | `21931` |
| `mission_bit` | `21932` |
| `item_check` | `21940` |
| `unlock` | `21941` |
| `_legacy_fn` | `21956` |
| Sole handler entry (`h(bit, …)`) | `21885` |

## 8. Invariants preserved (all load-bearing — [CONTRIBUTING.md](../CONTRIBUTING.md))

- **Host/Script Separation** — *advanced*, not just preserved: the script layer no longer names a host global; it writes into an env the host hands it. Host effects stay host.
- **Free-Movement / Mission-Gating** — untouched (no gate logic changes; movement code not in scope).
- **Parity kernels** — MOVER/ROOMS/DUEL:CORE untouched; 0 kernel sentinels in the diff.
- **§STATE-INIT** — `_S_DEFAULTS()` unchanged (no new field).
- **§VM-01-A coroutine contract** — `execBits` stays a generator; `ctx.state` is set before the loop, so a suspending `choice` resumes against the same env. No change to `_uqfPump` / `_uqfRunToCompletion` / `_uqfPending`.
- **§VM-01-B seeded rng** — `_rollSkill` / `_seededNext` untouched.

## 9. Test plan

New `tests/integration/uqf-env.test.js`:

1. **Live-path no-op** — `execBits` with a plain `ctx` (no `.state`) mutates the live `S_story` exactly as before (flag_write / reward / unlock land on `S_story`).
2. **The payoff — run against a scratch state** — `execBits(chain, { state: scratch })` writes flags/xp/quests into `scratch` and leaves `S_story` **untouched**. This is the seam D/E need, proven directly.
3. **`ctx.state` threads through recursion** — a `choice` whose picked branch is a `flag_write` writes into the *same* env the outer `execBits` was given (scratch stays scratch across the suspend/resume).
4. **`item_check` reads the env** — an item placed only in `scratch.inventory` satisfies `item_check` when run with `{ state: scratch }`, and does not when run live.
5. **`_legacy_fn` receives the env** — a legacy `fn(state)` sees `scratch`, not `S_story`, when run with an explicit env.

Regression: full `quest-runtime-uqf` (2,850 quests) via the disciplined **git-stash-diff** — verdict is 0 NEW failures vs the stashed-HTML 17-fail env baseline, never an absolute count. `warrants-board`, `uqf-coroutine`, `rng-seed` green. `check:walk` (incl. `check:rng`) shows only the two pre-existing baselines.

## 10. Scope fence — what Inc C does NOT do

- **No flag registry / typo→error** — deferred to §VM-01-E (§6.3).
- **No gate-reader threading** — `canActivate` / `canComplete` still read `S_story` (§6.1); E builds a static walker.
- **No `_rollSkill` / rng threading** — the roll stays a host concern (§6.1).
- **No host-effect redirection** — `combat` / `narrative` / `favor` / `_checkLevelUp` / `mpMintStamp` / `_grantMissionBit` keep live-singleton access (§4.3).
- **No `_legacy_fn` purge** — that is §VM-01-E's blocker; C only hands it the env.
- **No new field, no save-migration, no new opcode, no authored content.**

## 11. Verdict — **SHIPPED** (2026-07-22; not committed, user rule)

The `_ENV` seam is in place: `execBits` seeds `ctx.state` (defaulting to the live `S_story`) and the seven state handlers write/read it; the four host-fence handlers and the roll keep their live singletons. **8 edits, all inside the QuestRuntime region (21872–21964); 0 kernel sentinels; no new field, handler, or opcode.**

**Tests:**
- **New `tests/integration/uqf-env.test.js` — 5/5.** (1) live-path no-op — a plain `ctx` mutates the live `S_story` as before; (2) **the payoff** — `execBits(chain, { state: scratch })` writes flags/xp/quests/items into `scratch` and leaves `S_story` **provably untouched**; (3) `ctx.state` survives a `choice` suspend/resume (picked branch writes the scratch env, live state pristine); (4) `item_check` reads the env inventory (hits under `{state:scratch}`, misses live); (5) `_legacy_fn` receives `ctx.state`, not the global.
- **Regression `quest-runtime-uqf` 286 passed / 17 failed = the §VM-01-A/B env baseline EXACTLY (0 NEW failures)** — the 17 are the same render-path / forced-outcome tests (Ceremonia/FIGHT/typed-card renders, non-retryable-FAIL locks), none of which touch the state-env seam. The Inc A signature-change hazard does **not** recur here: `execBits(bits, ctx)` keeps its arity, and no caller (production or test) breaks.
- **`uqf-coroutine` 5/5 · `warrants-board` 25/25 · `rng-seed` 5/5.**
- **`check:rng` green** (client `_seededNext` ≡ server `seededNext` ≡ `__duelRng`, 6000 draws — untouched by this increment); **MOVER/ROOMS/DUEL:CORE byte-identical**; **0 kernel sentinels** in the diff. `check:walk`'s only reds remain the two pre-existing baselines (`check:invariants` J14/J15, `check:roads` R2/R3).

**Outcome:** the script layer no longer names a host global. `flag_write` and its six siblings write into an env the host hands them; the same bit chain now runs against a scratch state without touching the player's save. §VM-01-D and §VM-01-E's precondition — *run a quest against a state that isn't the live one* — is met. The flag registry (namespace typo→error) is deferred to §VM-01-E's static `check-questgraph.js` pass, per §6.3 and the user's decision.
