# Lab Report — §VM-01-E: *Prove the World Is Finishable* — the Soft-Lock Prover

**Increment:** §VM-01-E (the seventh-planned, the *actual prize* of the UQF migration)
**Status:** ✅ SHIPPED (Option A) — audit complete, blocker ported, checker built. See §9.
**Prereqs met:** §VM-01-C (scratch-state seam) + §VM-01-D (headless requireable kernel) — E is *doubly-unblocked by C+D*
**Author session:** 2026-07-22
**Policy:** Host/Script Separation (CONTRIBUTING.md §VM-01); Lab Report Policy (lock the child report before any HTML edit)

---

## 1. Purpose

The BACKLOG frames Inc E as the return on §ARCH-01 that "has never been collected":

> *A 2,850-quest DB nobody can prove completable is a liability; one you can prove is an asset.*

Reachability analysis over the quest graph — *for each quest, is there a state reachable from the start that satisfies its gate?* — is a normal model-checking problem **now that gates are data** (§VM-01-F compiled them to a boolean AST) and **effects are declared** (`BIT_CONTRACTS`). The BACKLOG names exactly one blocker:

> *The one blocker is `_legacy_fn`, which runs arbitrary code and defeats all static analysis (`quest_1367_f_plague` … rolls `Math.random() > 0.5` inside quest data).*

Inc E's scope is (1) **audit + port the surviving `_legacy_fn` bits**, then (2) build **`scripts/check-questgraph.js`** — the gate→effect DAG walker that reports unreachable quests, unsatisfiable gates, and the *written-by-nothing / read-by-nothing* flags (the typo detector §VM-01-C deferred here).

This report delivers **step (1): the `_legacy_fn` audit**, complete. It changes the increment's premise (§5) and surfaces the one design fork that shapes everything downstream (§6).

---

## 2. Method

- Extracted **every** `{ kind:'_legacy_fn', fn:… }` bit from the `QUEST_DB` region (`roll2hit-v3.html` lines **10492–21692**), brace-matched string/comment-aware, associating each with its enclosing quest `id:` and pulling the verbatim `fn` body. Three call signatures exist in the wild: `fn:() => {…}` (116), `fn:(S, ctx) => {…}` (3), `fn:S => {…}` (the rest). Scripts: `scratchpad/audit_legacy_fn.js`, `scratchpad/disposition.js` (throwaway; not committed).
- Classified each bit by a **single disposition** — what host surface it touches and whether an existing declarative opcode already expresses it.
- Cross-checked the declarative vocabulary against the live kernel (`js/quest.js` — the `QUEST:CORE` fence): `skill_check · flag_write · reward · combat · narrative · item_remove · item_check · mission_bit · favor · unlock · choice · _legacy_fn`.

**Ground truth:** `grep -cE "kind:\s*['\"]_legacy_fn['\"]"` → 122 by the naive form; the brace-matched extractor finds **125** (three use a spacing/signature variant the naive grep missed). **125 is the audited count.**

---

## 3. The census — 125 surviving `_legacy_fn` bits

| Disposition | Bits | Needs a new opcode? | What it is |
|---|---:|---|---|
| **PORT-EXISTING** | **63** | **No** | `flag_write` + `reward`(gold/xp/items/knowledge) + `narrative` + `item_remove` + enum-set. The §ARCH-01 W7c reward closures kept "verbatim as a single `_legacy_fn`" purely to avoid decomposing them. |
| **NEW-THRESHOLD** | **31** | Finding 2 | `_innKindness(n)` / `_addCroneMark()` — a counter (`innmotherKindness`/`croneMarks`) that fires a **one-shot reward at a cap** (≥5 → free-booking + Innmother's Key). |
| **NEW-COUNTER** | **14** | Finding 1 | Clamped/plain increment on a **track field**: `faith_*`, `faction_hansa`, `voidPressure`, `tribbleCount`, `mazeSolvedChecks` — `Math.min(5, x+1)` / `Math.max(-5, x-1)` / monotonic `if (x<n) x=n`. |
| **NEW-GUARD** | **5** | Finding 5 | A conditional effect that branches on **existing state** (no roll, no player input): `quest_wm_01` (spend 3 seals *iff* `!archiveLetterObtained`), `quest_lame_lystra` / `quest_vs_warden` (branch the completion message), `quest_forge_02` (charged-else-plain removal), `quest_d0209_a2` (default-set). |
| **NEW-HP** | **3** | Finding 4 | Live-sheet HP writes: `quest_stoning_lystra` (set HP→1), `quest_inquisitor_questions` (−10 clamp ≥1), `quest_spark_01` (bite −1). |
| **NEW-ABILITY** | **3** | Finding 3 | Guarded one-shot ability +1: `quest_sunken_02` (INT), `quest_guide_06` / `quest_scar_04` (WIS, gated on a "granted" flag, capped 20). |
| **NEW-DERIVED** | **2** | Finding 6 | `whisperCrownComplete` / `waneCrownComplete` = `Object.keys(quests).filter(whisper_*==='complete').length >= 5` — a flag **computed from quest counts** (a gate wearing a write's clothing). |
| **FAVOR** | **2** | No (existing `favor`) | `_setNpcFavor('yael',3)` / `_checkDearFriendUpgrade('auros')` — the `favor` opcode already wraps `E.setFavor`; the helpers embed an auto-Dear-Friend upgrade that reads other flags. |
| **NEW-ITEMEDIT** | **1** | Finding 7 (low) | `quest_va_04` appends a sentence to an existing inventory item's `.description`. Cosmetic; **gate-irrelevant**. |
| **NONDET** | **1** | Finding 0 (P0) | `quest_1367_f_plague` onFail: `if (Math.random() > 0.5) plague_exposed = true`. **The only nondeterministic bit in all of quest data.** |

**Sum = 125.** (The plague quest contributes *two* bits — a deterministic `faith_folk` counter in `onPass` and the coin-flip in `onFail` — so it appears in both NEW-COUNTER and NONDET.)

---

## 4. The findings (each missing kind is a §VM-01 row, not a blocker)

### Finding 0 — the blocker is ONE bit, and it's a mis-implementation (P0)
`quest_1367_f_plague` (`13831`), `onFail`:
```js
{ kind:'_legacy_fn', fn:() => { if (Math.random() > 0.5) S_story.plague_exposed = true; } }
```
This is **the entire literal blocker** cited by both the BACKLOG and CONTRIBUTING §VM-01 — the *only* `Math.random()` in the whole `QUEST_DB`. And it is **wrong**: two independent sources document the intended mechanic as a real save —
- the quest's own `failText`: *"Roll CON DC 13 or gain plague_exposed."*
- the `_S_DEFAULTS()` decl (`22964`): *"Set on failed CON DC 13 save. Grants Exhaustion 1 mission bit."*

The code rolls a modifier-free coin instead. **Port** (removes the blocker, fixes the fiction, and moves the roll onto §VM-01-B's seeded stream so it's replayable):
```js
onFail:[ { kind:'skill_check', stat:'CON', dc:13,
           onFail:[ { kind:'flag_write', set:['plague_exposed'] } ] } ]
```
`skill_check` already nests through `resolveSkillCheck → execBits`, synchronously, drawing `effects.rng()`. This is a ~1-line change with an outsized payoff: **it is the whole reachability blocker.**

### Finding 1 — `counter` opcode (the biggest lever)
`{ kind:'counter', field, add, min, max }` — a clamped named-track increment. **Directly absorbs the 14 NEW-COUNTER bits and is the spine of the 31 NEW-THRESHOLD** (a threshold is a counter + a cap-triggered reward). One opcode structurally covers ~45 bits and lets the checker read `field`/`add` instead of executing a closure. The `_S_DEFAULTS` tracks it writes (`faith_folk`, `faction_hansa`, `voidPressure`, …) are **read** by real gates (11–26 refs each) — this is live semantics, not dead code.

### Finding 2 — threshold one-shot (`_innKindness` / `_addCroneMark`)
A counter that at a cap fires a one-shot reward (mint + flag + msg). Two shapes: (2a) `counter` gains an `onReach:[bits]` sub-chain; (2b) keep the two helpers as **host effects the prober whitelists** (their write-set is small and fixed: `{innmotherKindness, freeBookingUnlocked, innmotherKeyGiven, croneMarks, inventory+Key}`). 31 bits.

### Finding 3 — ability bump (guarded one-shot)
`quest_sunken_02` / `quest_guide_06` / `quest_scar_04`: `abilityScores.X = Math.min(20, +1)`, gated once by a `…Granted` flag. → `reward` gains `{ ability:{wis:1}, cap:20 }`, the guard becomes a `flagEquals`/`notFlags` gate on the sub-chain. 3 bits.

### Finding 4 — HP / damage (host-fence)
3 bits write the live HP sheet — the same host-fence class as `_rollSkill` (§VM-01-C §4.3). A `damage`/`heal` kind, or leave them as whitelisted host effects. **The static reachability walker never executes them** (HP is not a gate predicate), so they are analytically inert — a portability nicety, not a blocker.

### Finding 5 — guarded / conditional effect
5 bits branch on **existing state** with no roll and no player input — a shape the grammar cannot say. `choice` branches on input; `skill_check` branches on a roll; there is **no branch-on-state**. → either a `when:{…gate…}` guard clause on any bit, or `flagEquals`-gated sub-chains. `quest_wm_01`'s "spend 3 seals iff you didn't take the letter route" is the canonical case (and its *gate* already got the §VM-01-F `{any}` treatment — the effect is the other half).

### Finding 6 — derived flag belongs in a gate, not a write
`whisperCrownComplete = (count of completed whisper_* ≥ 5)` is a **`countMin`-over-quests gate computed imperatively and stored**. The clean form writes nothing and puts the predicate in the consumer's gate. This is precisely the *written-by-nothing / read-by-something-that-could-recompute-it* class the graph checker is built to flag. 2 bits.

### Finding 7 — item-field edit (low priority)
`quest_va_04` appends prose to an item description. Cosmetic, gate-irrelevant, one bit. An `item_annotate` kind or just accept it as host. Defer.

---

## 5. What the audit corrects about the premise

The BACKLOG (and CONTRIBUTING §VM-01) describe `_legacy_fn` as code that *"runs arbitrary code and defeats all static analysis."* Post-§ARCH-01-W7, that is **true of exactly 1 of 125 bits.**

- **124/125 are deterministic.** They read known state and write known fields. A checker can learn each one's exact write-set **by executing it against a scratch state and diffing** — which is *precisely* the capability §VM-01-C (scratch-state env) + §VM-01-D (headless requireable kernel) shipped. E was gated on "the `_legacy_fn` purge"; the audit shows the *purge* — the part that actually blocks analysis — **is a single one-line bit.**
- The **63 PORT-EXISTING** bits need **no new opcode at all** — they are reward/flag/narrative closures kept whole for authoring convenience.
- The genuinely new grammar the *full* port would want is small and clustered: **one high-value opcode (`counter`, Finding 1)** covers ~45 bits; the rest is a long tail of 2–5-bit patterns.

This mirrors §VM-01-D's report, which corrected its own row's "mechanical" premise. **The premise here: E is not blocked by 125 arbitrary closures. It is blocked by one coin-flip, and everything else is analyzable-by-execution today.**

---

## 6. The design fork (LOCK FIRST — the user's call)

The audit exposes a real fork in **how much porting the soft-lock prover requires**, and the two ends have very different scope/risk. The checker can learn `_legacy_fn` write-sets **dynamically** (run each bit against scratch state, read the diff — deterministic bits are stable across two probes; the 1 nondet bit is flaky and auto-flagged) **or** demand every effect be **statically** declared.

- **Option A — Minimal unblock + dynamic effect-prober (recommended).** Port only Finding 0 (the coin-flip → seeded CON save). Build `check-questgraph.js` as: (i) a **dynamic prober** that executes each bit chain against a fresh scratch state and records its write-set (the flaky-diff check *is* the nondeterminism detector); (ii) the reachability walker + the written-by-nothing / read-by-nothing report. **New opcodes: 0.** Delivers the prize fastest; leaves the 124 deterministic fns in place, analyzed by execution. Aligns with "C+D doubly-unblock E" — the seams they built are *exactly* a dynamic prober.

- **Option B — Full declarative port.** Additionally land Findings 1–7 (~4 new opcodes: `counter`, `reward.ability`, `damage`, `when`-guard; refactor Finding 6 into gates), porting all 124 to declarative kinds, ending at **zero `_legacy_fn`** and a purely-static checker. The philosophical endpoint of the UQF migration and the strongest read of Host/Script Separation — but ~125 bit edits + 4 opcode designs, each its own veto-flagged decision, and a larger regression surface.

- **Option C — Hybrid.** Option A now (collect the prize), then land **Finding 1 (`counter`) only** as a fast-follow (~45 bits, the highest-ratio hygiene), deferring the long tail to individual §VM-01 rows.

**Second lock-first (from the BACKLOG, downstream of the fork):** what *"reachable"* means when a gate reads `favorMin` / `shardsMin` — a resource threshold makes it a planning problem, not pure graph reachability. Bound it (treat resources as monotonically accumulable → any threshold is reachable if any producer is reachable) or approximate it, and **say which** in the report the checker prints.

**RESOLVED 2026-07-22 — the user locked Option A.** Port only the blocker; build a dynamic effect-prober. The second lock-first was resolved as the **monotone bound**: `gateSat` treats `favorMin`/`shardsMin`/`battles`/`nodes`/`restedAtMin`/`countMin` as satisfiable-if-reachable and negations (`not`/`notFlags`) as satisfiable-by-absence, so a quest is judged reachable when its gate's *flag* and *quest-dependency* reads are provided by the accumulated write-pool. This over-approximates reachability (it can call a quest reachable that a full planner would not), which is the SOUND direction for the primary output — a quest reported **unreachable** is unreachable under any resource plan, because the missing read is a flag/quest nothing provides.

---

## 9. What shipped (Option A)

**Finding 0 — the blocker, ported (data-only; `QUEST:CORE` byte-identical).** `quest_1367_f_plague`'s `onFail` coin-flip →
```js
onFail:[{ kind:"skill_check", stat:"CON", dc:13, onFail:[{ kind:"flag_write", set:["plague_exposed"] }] }]
```
`QUEST_DB` is now **`Math.random`-free** (the region grep is clean); `_legacy_fn` bit count 125 → 124; the roll draws §VM-01-B's seeded stream, so the outcome is reproducible from a save. `check:questparity` confirms the kernel copies stayed identical (21,909 bytes) — this was a pure content change.

**`scripts/check-questgraph.js` — the dynamic soft-lock prover.** Loads the live `QUEST_DB` headlessly (worldbuilder `parseSanitized` pipeline) + the kernel (`require('../js/quest.js')`), then:
- **write-set per quest** — a tree-walk over the bit chain unioning *both* branches of every `skill_check`/`choice`; `_legacy_fn` closures are executed against a scaffolded scratch state (the real closure source, `new Function`'d over the bounded free-variable sandbox — `S_story`/`storyMsg`/`_innKindness`/`_addCroneMark`/`_setNpcFavor`/`_checkDearFriendUpgrade`/`_npcFavor`/`FISHING_GUIDE_TEXT`/`BIRKA_NPC_PROFILES`) and the state diff **is** the write-set;
- **nondeterminism detector** — each closure is probed **12×/seed × 2 seeds**; a divergent signature for the *same* seed = residual `Math.random` (the hard invariant). Over the real corpus: **0**;
- **reachability fixpoint** — monotone gate-tree `gateSat` from the start-state flags;
- **cross-ref** — *written-by-nothing* (gate reads it, no bit writes it → soft-lock/typo) and *read-by-nothing* (bit writes it, no gate reads it → dead-write/typo).
- `--selftest` validates the analyser on a synthetic graph (reachability · cross-ref · the ND detector catching a coin-flip closure while passing a deterministic one) — the CI-wired mode.

**Real-corpus report (2026-07-22):** 2,851 quests · 2,649 reachable (monotone) · 202 unreachable candidates · 114 written-by-nothing · 985 read-by-nothing · **0 prober-gaps · 0 residual nondeterminism.** The cross-ref lists are a **review artifact**, not a gate — they over-report because non-quest game code (fishing, town-crier, node arrival, combat kills, render) also touches flags, and threshold writes (`freeBookingUnlocked` at `innmotherKindness≥5`) aren't reached by a single-closure probe. The **binary** invariant the check enforces is **zero residual nondeterminism** — the one thing that is soundly a pass/fail.

**Wiring + tests.** `check:questgraph` (`--selftest && real-corpus`) added to `check:walk`; new `tests/integration/uqf-softlock.test.js` **3/3** (the port structure · the standing "no `_legacy_fn` carries `Math.random`" guard · three same-seed runs → byte-identical scratch state). `check:questparity` (21,909 bytes identical) / `check:gateast` (72) / `check:rng` green. **Regression `quest-runtime-uqf` — 0 NEW failures by git-stash-diff:** with the port, **286 passed / 17 failed**; the HTML port stashed, the same suite is **286 passed / 17 failed** — byte-identical failing set (the pre-existing render/retryable env baseline; the `check-bit-no-legacy-residue` Wave-4 test checks *top-level* `onPass`/`onFail` keys, which the *nested* CON-save port never adds). The Inc-A "engine change breaks test callers" hazard did **not** recur — this was data, and no test asserts the plague `onFail` shape.

**Deferred (unchanged by Option A):** the 124 deterministic `_legacy_fn` bits stay in place — analysable by execution, not a blocker. Findings 1–7 (the `counter`/`ability`/`damage`/`when`-guard opcodes + the derived-flag→gate refactor) remain available as follow-on §VM-01 rows if a *purely-static* checker is ever wanted; the dynamic prober makes them optional, not required. Triaging the 114 written-by-nothing / 985 read-by-nothing entries into real defects vs. non-quest-producer noise is a content pass, separate from this engine.

---

## 7. Test / verification plan (to be finalized once §6 locks)

- **Finding 0 port:** a `uxf`/integration assertion that `quest_1367_f_plague`'s `onFail` is a `skill_check{CON,13}` and that **no `_legacy_fn` in `QUEST_DB` contains `Math.random`** (a recursive scan — the standing guard that the blocker cannot return); the seeded d20 makes the outcome reproducible from a save.
- **`check-questgraph.js`** (new, wired into `check:walk`): builds the gate→effect graph over the live `QUEST_DB` via `require('./js/quest.js')` (Inc D's headless kernel); reports (a) quests whose gate is unsatisfiable from the start state, (b) flags/counters **written by nothing** or **read by nothing** (the typo detector), (c) — Option A — any bit whose two scratch-state probes disagree (residual nondeterminism).
- **Regression:** `quest-runtime-uqf` no-NEW-failures by git-stash-diff (the standing §VM-01 discipline); all four parity fences green (`MOVER/ROOMS/DUEL/QUEST` — the plague port is *data*, so `QUEST:CORE` stays byte-identical); `check:rng` green.

---

## 8. Anchors (re-grep before editing — they drift)

- `QUEST_DB` start: `10492` · region end `21692`
- `quest_1367_f_plague`: `13831` (the P0 bit's `onFail` is the last field of its single `skill_check`)
- `_legacy_fn` handler: `js/quest.js:349` (HTML `22025`); contract `js/quest.js:59` (HTML `21735`)
- Helpers: `_innKindness` `23181` · `_addCroneMark` `23191` · `_setNpcFavor` `23136` · `_checkDearFriendUpgrade` `23163`
- `plague_exposed` default-decl: `22964`

**Full per-bit dump:** `scratchpad/legacy_fn_dump.txt` (125 entries, quest id + disposition + verbatim body).

---

## 9. §VM-01-E-FU — the write-set completion pass (2026-07-22)

**The prize the Real-corpus report left uncollected.** §6/§8 shipped the prover but its cross-ref over-reported: the write-set tree-walk (§2, step 1) only sees flags a **quest bit** sets, so every gate flag that **non-quest code** provides looked like a soft-lock. The follow-on — "scan the whole file for flag writes" — closes that gap.

**`scanFlagWrites(html)`** (in `scripts/check-questgraph.js`, before `analyse`) scans the entire HTML for every flag-write form and folds the result into **both** the written-flag pool (cross-ref) and the reachability start pool. The forms:

- `S_story.flag = …` · `S_story.container[x] = …` (nested — catches `sleptAtNodes`) · `S_story['flag'] = …`;
- `missionBit:'…'` (NPC/data grants → `_grantMissionBit` → `S_story[flag]=true`) · `_grantMissionBit('…')`;
- `flag:` / `key:` / `flagBought:` record fields (consumed by the ten computed-key writers `S_story[rec.key]=` — catches the `wmDoc1Read` readable-doc registry);
- `set:[…]` / `clear:[…]` flag_write-bit literals — a real write wherever it sits, which also **back-stops the 2 quests `parseSanitized` drops** (`quest_sea_01`, `quest_sb_01`): their authored writes (e.g. `seaStrangenessNoticed`) are caught textually even though the object never reaches `db`.

It is a deliberately **broad textual over-approximation**: a flag written by any of these forms anywhere is treated satisfiable. This can only ever **shrink** the candidate list (never invent a soft-lock), and folding it into reachability keeps the *unreachable* verdict **sound** — a strictly larger pool marks only *more* quests reachable, so anything still unreachable is unreachable under any resource plan.

**Collapse (2026-07-22):** host flag-writers found **3,576** · written-by-nothing **114 → 48** · unreachable **202 → 47** · nondeterminism still **0**. The report now groups survivors by family. `--selftest` grew **7 → 21 assertions** (a host-provided gate flag is rescued without masking a real one; `scanFlagWrites` captures each of its eleven write forms).

**The 48 survivors are all genuine — and both axes point at the same root cause.** Written-by-nothing 48 and unreachable 47 are the **same four bulk-imported multi-act arcs** plus two singletons:

- **`waw` ×25 / `crl` ×7 / `nwi` ×8 / `mla` ×6 — a systemic step-to-step flag handoff mismatch.** Each act/chapter *gate* reads one name while the prior step *writes* another: `waw001_act3` gates on `waw001a2`, but `waw001_act2` writes `waw001Act2Passed`; `crl002_act1` gates on `crl001Complete`, but `crl001_act5` writes `crl001Act5Passed`. `waw001a1` only survives play because an NPC `missionBit` coincidentally grants it — the chain stalls at act 3. These are imported source-book arcs (`waw`/`crl`/`nwi`/`mla` = the 1367/MLA importer family) that were never wired: after the first step, **the arcs are unreachable and uncompletable.**
- **`voidFluxCleared`** — the `d0209` Void-flux arc completes on a flag whose own narrative says *"[voidFluxCleared flag set on visiting the chamber to proceed]"* — a documented-but-unimplemented mechanic; nothing sets it, so `d0209_a3+` can't complete.
- **`innDeparted`** — `quest_inn_05` completes on `innDeparted` + `atNode:'INN'`, but nothing sets `innDeparted`; the inn chain's last step can't close.

**Scope.** This increment is the **engine/analyser** completion — the shared `parseSanitized` was **not** touched (the drop is back-stopped textually instead). **Fixing the quest CONTENT** (re-wiring the four arcs' flag handoffs; implementing or retiring `voidFluxCleared`/`innDeparted`) is the content-triage pass §6 named as separate — now scoped to a concrete, deduped list of six items rather than 114 candidates. `check:questgraph` exit 0; `uqf-softlock.test.js` 3/3; `quest-runtime-uqf` unaffected (analyser-only, no HTML change).

**Anchors (§VM-01-E-FU):** `scanFlagWrites` + `analyse(db, startFlags, legacy, hostWrites)` in `scripts/check-questgraph.js`; the ten computed-key writers grep as `S_story\[[a-zA-Z_.]+\]\s*=` (`23262`/`23287`/`23323`/`23350`/`23794`/`25691`/`25745`/`27373`/`29556`/`31128`); `WM_ARCHIVE_DOCS` `27309`; `quest_sea_01` onComplete `flag_write` `12349`.
