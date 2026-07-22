<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §VM-01-D: `QUEST:CORE`, the Fourth Kernel (host-injected)

**Track:** §VM-01 — The Quest VM → *No Word for Wait*
**Increment:** D — *The fourth kernel*: `QUEST:CORE` + parity
**Status:** LOCKED 2026-07-22 (design-review-before-implementation, per the Lab Report Policy). Boundary design call resolved by the user: **full runtime via dependency injection** (not the minimal validation-only fence).
**Anchors (re-grepped live this session — they drift):** `SCHEMA_VERSION` `21706` · `BIT_CONTRACTS` `21710` · `validateQuest` `21738` · `adaptLegacyQuest` `21760` · `const QuestRuntime = {` `21764` · end of literal `21965`. Existing parity sentinels: `MOVER:CORE` `9791`/`9838` · `ROOMS:CORE` `9862`/`10094` · `DUEL:CORE` `10115`/`10267`. Host driver `_uqfRunToCompletion` `6840`; the 5 `execBits` call sites `6880`/`6883`/`21915`/`29574`/`36213`.

---

## 1. Abstract

`js/` holds `mover.js`, `rooms.js`, `duel.js` — and no `quest.js`. The 258-line engine that runs all 2,850 quests is the one engine the server cannot `require()`. This increment gives the quest VM the same parity-fenced kernel treatment the other three carry: a `// ◆◆◆ QUEST:CORE ◆◆◆` sentinel block inlined **byte-identically** into `roll2hit-v3.html` and mirrored in `js/quest.js`, asserted by `scripts/check-quest-parity.js` wired into `npm run check:walk`.

**The one thing this report exists to record: the row's premise — *"mechanical; the pattern exists three times"* — is only half true.** `MOVER`/`ROOMS`/`DUEL` were **pure from birth** — world-injected, returning plain data, naming no module global. `QuestRuntime` is not: it is an object literal that closes over `S_story`, `QUEST_DB`, `NODE_MAP`, and **ten host functions** (`_seededNext`, `_lakeMagicBonuses`, `_checkLevelUp`, `mpMintStamp`, `storyPreBattle`, `storyMsg`, `_grantMissionBit`, `_setNpcFavor`, `_npcFavor`, and the driver `_uqfRunToCompletion`). §VM-01-C moved the *state writes* to `ctx.state`; it did **not** touch those ten calls. C was necessary but not sufficient. So "fence it" is impossible as stated — the fenced code would reference undefined names in Node.

**The resolution (user-selected): dependency injection.** `QuestRuntime` becomes the return value of a factory `createQuestRuntime({ getState, effects })`. The kernel names no global; the live game injects `getState: () => S_story` and an `effects` table of thin, individually-guarded thunks around the ten host fns. On the live path every thunk calls the same host fn it replaced and `getState() === S_story`, so the change is a **provable no-op** — the whole regression is the proof.

---

## 2. The finding (verified this session, not recalled)

`grep` of the live `QuestRuntime` (`21764`–`21965`) for every free name that is neither a parameter nor a local:

| Reference | Where | Kind | Injected as |
|---|---|---|---|
| `S_story` | gates ×~30, `execBits` default, `_rollSkill`, `combat` | live progress state | `getState()` |
| `QUEST_DB` | `canActivate`/`canComplete` id-lookup | quest DB | `effects.getQuest(id)` |
| `NODE_MAP` | `combat` handler | node table | `effects.getNode(code)` |
| `_seededNext` | `_rollSkill` d20 | §VM-01-B rng | `effects.rng()` |
| `_lakeMagicBonuses` | `_rollSkill` | host bonus | `effects.lakeMagic()` |
| `_checkLevelUp` | `reward` | host effect | `effects.checkLevelUp()` |
| `mpMintStamp` | `reward` | host effect | `effects.mint(it)` |
| `storyPreBattle` | `combat` | host effect | `effects.preBattle(n)` |
| `storyMsg` | `narrative` fallback | host effect | `effects.msg(t)` |
| `_grantMissionBit` | `mission_bit` | host effect | `effects.grantMissionBit(f,l,st)` |
| `_setNpcFavor` / `_npcFavor` | `favor` | host effect | `effects.setFavor` / `effects.getFavor` |
| `_uqfRunToCompletion` | `resolveSkillCheck` inner pump | host driver | kernel-internal `_questRunToCompletion` (pure twin) |

The **four genuinely-pure** members (`SCHEMA_VERSION`, `BIT_CONTRACTS`, `validateQuest`, `adaptLegacyQuest`, `21706`–`21762`) already name no global and move into the block unchanged. The **four pure handlers** (`flag_write`, `item_remove`, `item_check`, `unlock`) and the `choice` mechanism are already pure post-C (they touch only `ctx.state`). Everything else is one of the twelve rows above.

**The server has no quest runtime today.** `js/wbapi-server.js` treats `QUEST_DB` only as a worldbuilder *data* section (field/node-ref validation, `4425`–`4846`); it has no `execBits`, no gate evaluation, no `QuestRuntime`. So D's headline payoff ("server authoritative over quest state") has **no consumer yet** — this increment builds the requireable substrate a future §MESH quest increment will consume. That is a deliberate build-ahead, chosen by the user over the minimal validation-only fence.

---

## 3. The change

### 3.1 The `QUEST:CORE` block (pure; byte-identical in both files)

```
// ◆◆◆ QUEST:CORE:START ◆◆◆
const SCHEMA_VERSION = 'UQF-1.0';
const BIT_CONTRACTS = { …unchanged… };
function validateQuest(q) { …unchanged… }
function adaptLegacyQuest(id, q) { return q; }
function _questRunToCompletion(gen) { …pump; throw on ask… }   // pure twin of the host driver
function createQuestRuntime(host) {
  const E = (host || {}).effects || {};
  const S = () => (typeof (host||{}).getState === 'function' ? host.getState() : undefined);
  const rt = {
    SCHEMA_VERSION, _schema: SCHEMA_VERSION,
    canActivate(questId) { const q = E.getQuest && E.getQuest(questId); … reads S() … },
    canComplete(questId) { … reads S() … },
    *execBits(bits, ctx) { const c = ctx||{}; if (!c.state) c.state = S(); … dispatch rt.HANDLERS … },
    _rollSkill(stat)     { const st = S(); … E.rng() … E.lakeMagic() … },
    resolveSkillCheck(bit, ctx) { … _questRunToCompletion(rt.execBits(…)) … },
    HANDLERS: { … pure handlers touch ctx.state; impure ones call E.* … },
    validateQuest, adaptLegacyQuest,
  };
  return rt;
}
// ◆◆◆ QUEST:CORE:END ◆◆◆
```

The kernel closes over `E` + `S` (the factory params) and the block-level pure consts. Handler self-references (`skill_check` → `resolveSkillCheck`, `choice` → `execBits`) go through the returned `rt`.

### 3.2 The host wiring (HTML only, outside the sentinels)

```
const QuestRuntime = createQuestRuntime({
  getState: () => S_story,
  effects: {
    getQuest: id => QUEST_DB[id],  getNode: c => NODE_MAP[c],
    rng: () => _seededNext(),      lakeMagic: () => (typeof _lakeMagicBonuses === 'function' ? _lakeMagicBonuses() : {}),
    checkLevelUp: () => { if (typeof _checkLevelUp === 'function') _checkLevelUp(); },
    mint: it => { if (typeof mpMintStamp === 'function') mpMintStamp(it); },
    preBattle: n => { if (typeof storyPreBattle === 'function') storyPreBattle(n); },
    msg: t => { if (typeof storyMsg === 'function') storyMsg(t); },
    grantMissionBit: (f,l,st) => { if (typeof _grantMissionBit === 'function') _grantMissionBit(f,l); else if (st) st[f] = true; },
    setFavor: (npc,lv) => { if (typeof _setNpcFavor === 'function') _setNpcFavor(npc,lv); },
    getFavor: npc => (typeof _npcFavor === 'function' ? _npcFavor(npc) : 0),
  },
});
```

Each thunk carries the **exact `typeof` guard** the original handler had, so guard semantics are preserved verbatim. `getState`/`getQuest`/`getNode` are thunks (deferred lookups), so the factory can be built before `S_story`/`QUEST_DB`/`NODE_MAP` exist (they are declared later in the file; every gate/handler call happens at runtime, long after). Window exposure (`window.QuestRuntime`/`validateQuest`/`BIT_CONTRACTS`) is unchanged. The **4 outer** `execBits` call sites (`6880`/`6883`/`29574`/`36213`) keep the host driver `_uqfRunToCompletion` (it renders + parks `_uqfPending`); only `resolveSkillCheck`'s **inner** synchronous pump moves to the kernel's pure `_questRunToCompletion` (same semantics: pump plain chains, throw on an unresolved ask).

### 3.3 `js/quest.js`

Header comment (outside sentinels) → the identical `QUEST:CORE` block → `if (module?.exports) module.exports = { createQuestRuntime, validateQuest, adaptLegacyQuest, BIT_CONTRACTS, SCHEMA_VERSION };`.

---

## 4. §6 design calls (LOCKED + veto-flagged)

1. **Injection over a shared singleton** — the kernel takes `{getState, effects}`, not a captured `state`. **Why `getState()` and not `state`:** the live path resolves the state at call time so C's per-call `execBits(chain, {state: scratch})` seam survives, and so a future load that mutates (not reassigns) `S_story` is always seen. *Rejected:* capturing `state` once at factory time (breaks the scratch-state seam and any reassignment).
2. **Guards live in the host thunks, not the kernel** — the kernel calls `E.preBattle(…)` unconditionally-ish (`E.x && …`); the `typeof storyX === 'function'` check moved into the injected thunk. This keeps the kernel free of host names while preserving byte-for-byte the defensive behavior (missing host fn → no-op), and lets the server inject real or no-op effects freely. `mission_bit`'s env-write fallback is preserved by threading `ctx.state` into the thunk.
3. **`resolveSkillCheck` uses a kernel-internal pure `_questRunToCompletion`, not the host driver** — so a `require('./quest')` server can resolve a `skill_check`'s onPass/onFail synchronously with no host driver present. It is the pure twin of `_uqfRunToCompletion` (Inc A §6.2): pump to done, throw on ask. Plain chains (all live skill_check chains — scope-fenced against `choice`) pump identically. The outer host driver is untouched.

**No new opcode, gate term, `S_story` field, or save-migration.** Kernels `MOVER`/`ROOMS`/`DUEL` untouched. No new `Math.random()` (the kernel's `_rollSkill` draws `E.rng()` = the §VM-01-B seeded stream; a `Math.random()` fallback exists only for a server that injects no rng, never on the live path). No new movement-refusal.

---

## 5. No-op proof + test plan

- **Regression as the no-op proof:** `quest-runtime-uqf` full suite drives every handler + both gates + `_rollSkill` through `QuestRuntime.*`. Target = the §VM-01-A/B/C env baseline **exactly** (286 passed / 17 env-quirk failures = 0 NEW). Verified by the disciplined **git-stash-diff** (Inc A's mandate): run with the change, stash *only the HTML*, re-run, compare failing sets. Method surface is unchanged (`canActivate(id)`/`canComplete(id)`/`execBits(bits,ctx)`/`_rollSkill(stat)`/`resolveSkillCheck(bit,ctx)`/`HANDLERS`) → the Inc-A signature-break hazard does **not** recur; no test caller needs adapting.
- **New `tests/integration/uqf-quest-core.test.js`** — the payoff proof: `require('../../js/quest.js')`, build a runtime over a **scratch** state + **stub** effects (no DOM, no host), and assert (a) `validateQuest` accepts/rejects; (b) `canActivate`/`canComplete` evaluate gates against the injected state; (c) `execBits` runs a `flag_write`+`reward`+`unlock` chain and mutates only the scratch state; (d) a `skill_check` with an injected deterministic `rng` routes onPass/onFail; (e) a `combat`/`favor`/`narrative` chain calls the injected effect stubs (proving the host seam). **The engine runs headless in Node — the thing that was structurally impossible.**
- **`scripts/check-quest-parity.js`** (mirror of `check-mover-parity.js`) → `check:quest` in `npm run check:walk`: the inlined `QUEST:CORE` block is byte-identical to `js/quest.js`.
- **Gates:** `node --check js/quest.js`; inline HTML parses clean; `check:rng` green; the two pre-existing `check:walk` reds (`check:invariants` J14/J15, `check:roads` R2/R3) remain the only reds; `uqf-coroutine`/`rng-seed`/`uqf-env`/`warrants-board` green.

---

## 6. Scope fence

- **No server consumer is wired in this increment.** `js/wbapi-server.js` is not modified; it does not yet `require('./quest')`. D delivers the *substrate* (a requireable, headless-runnable kernel + the parity fence); the first consumer is a future §MESH quest increment or §VM-01-E's static gate walker.
- **Gate readers move into the kernel but keep their exact logic** — no new gate term, no expression AST (that is §VM-01-F). `itemsMinAny` and the single OR-group are transcribed verbatim.
- **`_legacy_fn` still runs arbitrary code** — it calls `bit.fn(ctx.state, ctx)`. Making the engine requireable does not make it *analyzable*; that remains §VM-01-E's blocker. D does not purge legacy fns.

---

## 7. Verdict

**Locked and ready to implement.** The change is the four pure members + a factory wrapper (~identical body to the current literal with `S_story`→`S()` and host-fn→`E.*`) + a host wiring block + a parity checker + a headless test. The risk is entirely in the regression being a true no-op, which the stash-diff is built to prove. The premise correction stands: this was never the mechanical fence the row assumed — it is the dependency-injection refactor the ten host calls always required, and C was its prerequisite.

*© 2026 Paul Richeson — MIT License.*
