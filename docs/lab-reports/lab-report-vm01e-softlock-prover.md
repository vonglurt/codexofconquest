<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §VM-01-E: Prove the World Is Finishable (the Soft-Lock Prover)

**Increment:** §VM-01-E · **Status:** ✅ SHIPPED (Option A), `354b20a` 2026-07-22 15:00 · **Author session:** 2026-07-22
**Prereqs claimed:** §VM-01-C (scratch-state seam) + §VM-01-D (headless kernel) — see §10 D6, which corrects this
**Policy:** Host/Script Separation (CONTRIBUTING.md §VM-01); Lab Report Policy
**Verified against HEAD 2026-08-22** (§DOC-02cq) — see §10. Ship-day figures re-measured on the pinned build `354b20a^`.

---

## Abstract

A quest database nobody can prove completable is a liability; one you can prove is an asset. This increment
audited the 125 surviving `_legacy_fn` closures in `QUEST_DB`, found that **exactly one** of them defeats static
analysis, ported that one, and built `src/scripts/check-questgraph.js` — a reachability prover that executes the
remaining 124 deterministic closures against a scratch state and reads their write-sets from the diff. The
prover found **48 gate flags nothing writes** and **47 unreachable quests**, and named their shared root cause:
four bulk-imported arc families whose act-to-act flag handoffs never matched. Every numeric claim in the
original report has been re-measured; seven are corrected in §10, and the increment's central result stands.

---

## 1. Purpose, Intention, and What It Buys the Player

**The problem is invisible by construction.** A soft-lock is not a crash. The game runs, the quest list renders,
the node loads — and one quest simply never becomes available, because its gate reads a flag no code anywhere
writes. Neither the engine nor CI notices. The only detector the project had was a player getting far enough
into an arc to be disappointed, and 2,853 quests is far more than anyone can play-test by hand.

**Why it matters for playability.** The game's implicit promise is that an arc you start is an arc you can
finish. Break it once and the cost is not one quest but the player's trust that any long chain is worth
beginning. §VM-01-E-FU measured the damage: four multi-act arc families (`waw`, `crl`, `nwi`, `mla`) stall
after their first step, stranding authored prose no player can reach. The prover turns that class of defect
from *undiscoverable* into *a line in `check:walk`*.

**Why it became possible now.** Reachability analysis — *for each quest, is there a state reachable from the
start that satisfies its gate?* — is standard model-checking once gates are **data** (§VM-01-F compiled them to
a boolean AST at `c6be7f8`, 1 h 26 min before this ship) and effects are **declared** (`BIT_CONTRACTS`). The
BACKLOG named one obstacle:

> *The one blocker is `_legacy_fn`, which runs arbitrary code and defeats all static analysis
> (`quest_1367_f_plague` … rolls `Math.random() > 0.5` inside quest data).*

**The second thing it buys is honesty in a single quest.** `quest_1367_f_plague` told the player *"Roll CON DC
13 or gain plague_exposed"* and then flipped an unmodified coin. Porting it made the fiction true and put the
roll on §VM-01-B's seeded stream, so a save replays identically. A player who invests in CON now gets what the
text promised — a bug fix, a design fix, and an architecture fix in one line.

**Scope:** (1) audit + port the surviving `_legacy_fn` bits; (2) build `src/scripts/check-questgraph.js` — the
gate-to-effect walker reporting unreachable quests, unsatisfiable gates, and *written-by-nothing /
read-by-nothing* flags (the typo detector §VM-01-C deferred here).

---

## 2. Method

- Extracted every `{ kind:'_legacy_fn', fn:… }` bit from the `QUEST_DB` region (`const QUEST_DB = {@10615` to
  `WORLDBUILDER:QUEST_DB:END@21952`; lines 10492–21692 on the ship-day build) with a string- and
  comment-aware brace matcher, associating each with its enclosing quest `id:` and pulling the verbatim body.
- Classified each bit by a **single disposition**: what host surface it touches, and whether an existing
  declarative opcode already expresses it.
- Cross-checked the vocabulary against the live kernel (`src/js/quest.js`, the `QUEST:CORE` fence). Twelve kinds,
  confirmed byte-for-byte against `BIT_CONTRACTS`: `skill_check · flag_write · reward · combat · narrative ·
  item_remove · item_check · mission_bit · favor · unlock · choice · _legacy_fn`.

**Ground truth — 125 bits.** `grep -cE "kind:\s*['\"]_legacy_fn['\"]"` reports 122; the brace-matched
extractor finds **125**. The gap is *not* a signature variant (see §10 D1): `grep -c` counts **matching
lines**, and quest entries are one-per-line, so the three entries carrying two `_legacy_fn` bits each —
`quest_1367_d_hansa: {@13961`, `quest_1367_f_plague: {@13965`, `quest_scar_03: {@14015` — are counted once.
The same regex with `-o` returns 125. Signature split: `fn:() => {…}` 116, `fn:(S, ctx) => {…}` 3,
`fn:S => {…}` 6 — sums to 125.

---

## 3. Census — 125 surviving `_legacy_fn` bits

| Disposition | Bits | New opcode? | What it is |
|---|---:|---|---|
| **PORT-EXISTING** | 63 | No | `flag_write` + `reward` + `narrative` + `item_remove` + enum-set. §ARCH-01 W7c reward closures kept whole purely to avoid decomposing them. |
| **NEW-THRESHOLD** | 31 | Finding 2 | `_innKindness(n)` / `_addCroneMark()` — a counter that fires a one-shot reward at a cap (≥5 → free booking + Innmother's Key). |
| **NEW-COUNTER** | 14 | Finding 1 | Clamped increment on a track field: `faith_folk`, `faction_hansa`, `voidPressure`, `tribbleCount`, `mazeSolvedChecks`. |
| **NEW-GUARD** | 5 | Finding 5 | Conditional effect branching on existing state, no roll and no input: `quest_wm_01`, `quest_lame_lystra`, `quest_vs_warden`, `quest_forge_02`, `quest_d0209_a2`. |
| **NEW-HP** | 3 | Finding 4 | Live-sheet HP writes: `quest_stoning_lystra`, `quest_inquisitor_questions`, `quest_spark_01`. |
| **NEW-ABILITY** | 3 | Finding 3 | Guarded one-shot ability +1: `quest_sunken_02` (INT), `quest_guide_06` / `quest_scar_04` (WIS, capped 20). |
| **NEW-DERIVED** | 2 | Finding 6 | `whisperCrownComplete` / `waneCrownComplete` — a flag computed from quest counts; a gate wearing a write's clothing. |
| **FAVOR** | 2 | No | `_setNpcFavor(key, level)@23463` / `_checkDearFriendUpgrade(key)@23490` — the `favor` opcode already wraps `E.setFavor`. |
| **NEW-ITEMEDIT** | 1 | Finding 7 | `quest_va_04` appends a sentence to an item description. Cosmetic, gate-irrelevant. |
| **NONDET** | 1 | Finding 0 (P0) | `quest_1367_f_plague` onFail: `if (Math.random() > 0.5)`. The only non-deterministic bit in all of quest data. |

**Sum = 125** (verified). `quest_1367_f_plague` contributes two bits — a deterministic `faith_folk` counter in
`onPass` and the coin-flip in `onFail` — so it appears in both NEW-COUNTER and NONDET.

---

## 4. Findings

**Finding 0 — the blocker is one bit, and it is also a bug (P0).** `quest_1367_f_plague: {@13965`, `onFail`:

```js
{ kind:'_legacy_fn', fn:() => { if (Math.random() > 0.5) S_story.plague_exposed = true; } }
```

This is the entire literal blocker cited by the BACKLOG and CONTRIBUTING §VM-01 — the only `Math.random()` in
`QUEST_DB`. Two independent sources document the intended mechanic as a real save: the quest's own `failText`
(*"Roll CON DC 13 or gain plague_exposed"*) and the `_S_DEFAULTS` declaration at `plague_exposed: false,@23291`
(*"Set on failed CON DC 13 save"*). The code rolls a modifier-free coin instead. `skill_check` already nests
through `src/js/quest.js:resolveSkillCheck(bit, ctx)@322` into `execBits`, synchronously, drawing the injected
seeded stream at `src/js/quest.js:const d20  = Math.ceil(E.rng() * 20)@314`. A one-line change with an outsized
payoff: it is the whole reachability blocker.

**Finding 1 — a `counter` opcode (the biggest lever).** `{ kind:'counter', field, add, min, max }` absorbs the
14 NEW-COUNTER bits and is the spine of the 31 NEW-THRESHOLD, so one opcode structurally covers ~45 bits and
lets the checker read `field`/`add` instead of executing a closure. *The original justification for this
finding was wrong and the finding survives anyway — see §10 D4: no quest gate reads these tracks, because the
gate term set cannot express a counter comparison. That is a stronger argument for the opcode, not a weaker
one.*

**Findings 2–7 — the long tail.** Each is a §VM-01 row, not a blocker. None is required under Option A.

| # | Bits | Shape | Proposed grammar |
|---|---:|---|---|
| 2 | 31 | Counter that mints a one-shot reward at a cap | `counter` gains `onReach:[bits]`, or `function _innKindness(n)@23530` and `function _addCroneMark()@23540` stay whitelisted host effects — their write-set is small and fixed |
| 3 | 3 | `abilityScores.X = Math.min(20, +1)`, gated once by a `…Granted` flag | `reward` gains `{ ability:{wis:1}, cap:20 }`; the guard becomes a gate on the sub-chain |
| 4 | 3 | Live HP-sheet writes, the host-fence class of `_rollSkill` | A `damage`/`heal` kind, or leave as host. HP is not a gate predicate, so the walker never executes them — analytically inert |
| 5 | 5 | Branch on existing state, no roll and no input | The grammar cannot say this: `choice` branches on input, `skill_check` on a roll, and there is no branch-on-state. → a `when:{…gate…}` clause or `flagEquals`-gated sub-chains |
| 6 | 2 | `whisperCrownComplete` — a `countMin`-over-quests predicate computed imperatively and stored | Write nothing; put the predicate in the consumer's gate. Precisely the class the cross-ref was built to flag |
| 7 | 1 | Appends prose to an item description | An `item_annotate` kind, or accept as host. Cosmetic and gate-irrelevant — defer |

---

## 5. What the Audit Corrected About the Premise

The BACKLOG described `_legacy_fn` as code that *"runs arbitrary code and defeats all static analysis."*
Post-§ARCH-01-W7 that is true of **1 of 125 bits**. The other 124 are deterministic, so a checker can learn
each write-set by executing it against a scratch state and diffing; 63 need no new opcode at all; and the
grammar a *full* port would want is small and clustered — one opcode covers ~45 bits, the rest is a tail of
2–5-bit patterns.

**The premise: E is not blocked by 125 arbitrary closures. It is blocked by one coin-flip, and everything
else is analysable-by-execution today.**

---

## 6. The Design Fork — and the Lock

The checker can learn write-sets **dynamically** (execute each bit against scratch state, read the diff) or
demand every effect be **statically** declared. **A** — minimal unblock plus dynamic prober; port Finding 0
only, zero new opcodes (recommended). **B** — full declarative port; land Findings 1–7 (~4 new opcodes),
ending at zero `_legacy_fn` and a purely-static checker, at the cost of ~125 bit edits and a large regression
surface. **C** — A now, Finding 1 (`counter`) as a fast-follow.

**Second lock — what "reachable" means when a gate reads `favorMin` / `shardsMin`.** A resource threshold makes
this a planning problem, not pure graph reachability.

> **RESOLVED 2026-07-22 — the user locked Option A**, with the **monotone bound** for the second question:
> `src/scripts/check-questgraph.js:function gateSat@273` treats `favorMin`/`shardsMin`/`battles`/`nodes`/
> `restedAtMin`/`countMin`/`dayMin`·`dayMax` as satisfiable-if-reachable and negations as satisfiable-by-absence,
> so a quest is reachable when its gate's *flag* and *quest-dependency* reads are supplied by the accumulated
> write-pool. This **over-approximates** reachability, which is the sound direction for the primary output: a
> quest reported **unreachable** is unreachable under any resource plan, because the missing read is a flag or
> quest that nothing provides.

---

## 7. What Shipped (Option A)

**Finding 0, ported — data-only, `QUEST:CORE` byte-identical.** One line of `play.html` changed:

```js
onFail:[{ kind:"skill_check", stat:"CON", dc:13, onFail:[{ kind:"flag_write", set:["plague_exposed"] }] }]
```

`QUEST_DB` went `Math.random`-free (measured: 1 → 0 in the region, and still 0 at HEAD); `_legacy_fn` bits
125 → 124. The roll draws §VM-01-B's seeded stream, so the outcome replays from a save.

**`src/scripts/check-questgraph.js` — the dynamic soft-lock prover.** Loads the live `QUEST_DB` headlessly
(worldbuilder `parseSanitized` pipeline), then:

- **write-set per quest** — a tree-walk over the bit chain unioning *both* branches of every
  `skill_check`/`choice`; `_legacy_fn` closures are executed against a scaffolded scratch state (the real
  closure source, `new Function`'d over a bounded free-variable sandbox) and the state diff **is** the
  write-set;
- **non-determinism detector** — each closure probed 12× per seed × 2 seeds; a divergent signature for the
  *same* seed is residual `Math.random`. Over the real corpus: **0**;
- **reachability fixpoint** — monotone `gateSat` from the start-state flags;
- **cross-ref** — *written-by-nothing* (a gate reads it, nothing writes it) and *read-by-nothing* (a bit
  writes it, no gate reads it);
- `--selftest` validates the analyser on a synthetic graph — the CI-wired mode.

**Real-corpus report, ship day (pre-FU):** 2,851 quests · 2,649 reachable · 202 unreachable · 114
written-by-nothing · 985 read-by-nothing · 0 prober-gaps · 0 residual non-determinism. The cross-ref lists are
a **review artifact, not a gate** — they over-report, because non-quest code also touches flags. The binary
invariant enforced is **zero residual non-determinism**, the one thing that is soundly pass/fail.

---

## 8. §VM-01-E-FU — the Write-Set Completion Pass (same day)

The write-set tree-walk only sees flags a **quest bit** sets, so every gate flag provided by **non-quest code**
looked like a soft-lock. `src/scripts/check-questgraph.js:function scanFlagWrites@302` scans the whole HTML for
every flag-write form and folds the result into **both** the written-flag pool and the reachability start pool.
**Ten forms** across seven regexes (see §10 D3): `S_story.flag =`, `S_story.container[x] =`,
`S_story['flag'] =`, `missionBit:`, `_grantMissionBit(…)`, the `flag:` / `key:` / `flagBought:` record fields
consumed by the computed-key writers, and `set:[…]` / `clear:[…]` bit literals.

It is a deliberately **broad textual over-approximation**. This can only ever **shrink** the candidate list,
never invent a soft-lock, so folding it into reachability keeps the *unreachable* verdict sound.

**Collapse (measured on the ship-day tree):** host flag-writers **3,576** · written-by-nothing **114 → 48** ·
unreachable **202 → 47** · non-determinism still **0**. `--selftest` grew **7 → 21 assertions**.

**The 48 survivors are all genuine, and both axes point at the same root cause** — four bulk-imported multi-act
arc families plus two singletons, summing exactly to 48:

- **`waw` ×25 · `crl` ×7 · `nwi` ×8 · `mla` ×6 — a systemic step-to-step flag handoff mismatch.** Each
  act gate reads one name while the prior step writes another: `waw001_act3` gates on `waw001a2`, but
  `waw001_act2` writes `waw001Act2Passed`. After the first step the arcs are unreachable and uncompletable.
  *(Two claims in this bullet were later corrected — see §10 D7.)*
- **`voidFluxCleared`** — the `d0209` Void-flux arc completes on a flag whose own narrative says
  *"[voidFluxCleared flag set on visiting the chamber to proceed]"*. Nothing sets it. Now §DX-02u.
- **`innDeparted`** — `quest_inn_05` completes on `innDeparted` + `atNode:'INN'`; nothing sets `innDeparted`.

**Scope.** This was the **engine/analyser** completion. The shared `parseSanitized` was not touched — its
two-quest drop was back-stopped textually instead. **Fixing the quest content** is a separate pass. *It was
never opened as a row for 27 days; it is now §AUDIT-03bj — see §10 D7.*

---

## 9. Verification (as shipped, re-measured on the pinned build)

| Check | Reported | Re-measured at `354b20a` | |
|---|---|---|---|
| `check:questgraph --selftest` | 21 assertions | 21 passed, 0 failed | ✅ |
| `check:questgraph` real corpus | 2,851 · 2,804 · 47 · 48 · 985 · 0 · 0 | identical, all seven | ✅ |
| `check:questparity` | 21,909 "bytes" identical | 21,909 chars, parent ≡ ship | ✅ (unit: see §10 D5) |
| `check:gateast` | 72 | 72 assertions, 25 leaf terms | ✅ |
| `check:rng` | green | green | ✅ |
| `src/tests/integration/uqf-softlock.test.js` | 3/3 | 3/3 (also 3/3 at HEAD) | ✅ |
| `quest-runtime-uqf` no-NEW-failures | 286 passed / 17 failed, both sides | suite holds 303 cases; 286 + 17 = 303 | ✅ (label: §10 D2) |

The git-stash-diff showed a byte-identical failing set with and without the port: **0 new failures**. The
Inc-A "engine change breaks test callers" hazard did not recur — this was data, and no test asserts the plague
`onFail` shape.

**Deferred by Option A:** the 124 deterministic bits stay in place, analysable by execution. Findings 1–7
remain available as follow-on §VM-01 rows if a purely-static checker is ever wanted; the dynamic prover makes
them optional, not required.

---

## 10. Verification of This Report (§DOC-02cq, 2026-08-22)

Every figure re-measured against the pinned ship-day build (`git show 354b20a^:play.html`; parent and
ship are both 37,783 lines, so **anchor offset is zero** between them) and against HEAD.

**Confirmed exactly (19):** all 13 original anchors resolve on the ship-day build · `_legacy_fn` 125 → 124
(and 124 at HEAD) · signature split 116/3/6 · census table sums to 125 · the 12-kind vocabulary matches
`BIT_CONTRACTS` byte-for-byte · `Math.random` in `QUEST_DB` 1 → 0 → still 0 at HEAD · `QUEST:CORE` 21,909
identical parent ≡ ship, so "data-only" is directly verified · `check:gateast` 72 · selftest 21 · all seven
real-corpus figures · the family breakdown sums to 48 · pre-FU 2,649 + 202 = 2,851 · the shipped code block is
byte-exact · `parseSanitized` drops exactly `quest_sea_01` and `quest_sb_01` at ship-era (2,851 = 2,853 − 2).

**Corrections (7).**

| # | Section | The report says | Measured | Verdict |
|---|---|---|---|---|
| D1 | §2 | The 122-vs-125 gap is "three use a spacing/signature variant the naive grep missed" | `grep -c` counts *lines*; three quest lines carry two bits each. The same regex with `-o` returns 125 | Count right, **reason wrong** |
| D2 | §7/§9 | The 17 failures are "the pre-existing render/retryable **env baseline**" | `bd951d7`, 3 h 58 min later the same day, retired it: *"17 stale tests, not server clobber"* — 16 were fixed outright | Arithmetic and verdict **stand**; the label was **falsified same-day** |
| D3 | §8 | `scanFlagWrites` "captures each of its **eleven** write forms" | **Ten** forms across seven regexes; the selftest makes **eleven** assertions because `set:[…]` is exercised with two flags | **Off by one** — flags counted as forms |
| D4 | §4 F1 | The counter tracks "are read by real gates (11–26 refs each)" | **Zero** quest gates read any of the five, at ship-day and at HEAD. `tribbleCount` occurs 6× in the whole file. The one intended gate read was demoted — `is not expressible in canActivate@13974` says so in the file | **Wrong**; conclusion survives, see §11 |
| D5 | §7 | `check:questparity` "21,909 **bytes**" | The number is exact, but the gate prints `a.length` — UTF-16 code units. 21,909 chars = **22,135 UTF-8 bytes** | Figure right, **unit mislabelled by the tool itself** |
| D6 | §5/§7 | E consumes §VM-01-D's kernel — "the kernel via `require('../js/quest.js')`" | `src/scripts/check-questgraph.js:const Q = require@63` binds `Q`, and `Q` occurs **exactly once in the file: on that line** — at ship-era and at HEAD. The prover rolls its own `gateSat` and `src/scripts/check-questgraph.js:function matchBrace@66`, and never calls the kernel | **The import is decorative.** C's scratch-state *concept* is used; D's code is not. Now §DX-02dx |
| D7 | §8 | `waw001a1` "only survives play because an NPC `missionBit` coincidentally grants it — the chain stalls at **act 3**" | §AUDIT-03bj measured both halves false: `meta.missionBit` has **zero readers** (§DX-02cx), so the scan over-credits it, and the first dead rung is **act 2** in all eight chains | **Both halves wrong** |

**Drift since ship (not errors).** `check:gateast` 72 → **76** (`37f8ccb` added the `dayMin`/`dayMax` leaf the
next day, 25 → 27 leaf terms) · `QUEST:CORE` 21,909 → **25,030** chars · corpus 2,851 → **2,853** quests
(the `parseSanitized` two-quest drop has since been **fixed**, so the textual back-stop is now belt-and-braces)
· unreachable 47 → **49** · written-by-nothing 48 → **50** (new: `maltaSnakeEvent`, `saulConverted`) ·
read-by-nothing 985 → **982** · host writers 3,576 → **3,575**.

**Status at HEAD.** Residual non-determinism is still **0** — the standing invariant has held for a month, and
`uqf-softlock.test.js` is **3/3**. `quest-runtime-uqf` is now **303/303 green**. But **all 48 original
survivors are still present** and two more have joined: the content triage this report scoped out was never
performed. §AUDIT-03bj puts the true blast radius at **138 quests** — the head count of 47–50 understates it
2.8×, because nobody had computed the transitive closure.

---

## 11. Follow-On Rows Filed by This Verification

- **§DX-02dy** — 14 quests carry `gate:{_legacyFn:true}`, opaque to `gateSat`, which returns `true` by
  fallthrough. Sound for the *unreachable* verdict, but §1's premise that "gates are data" has 14 exceptions,
  and the reason is D4's: the term set cannot express `faith_folk >= 1`. A `counterMin` gate leaf is
  Finding 1's real justification.
- **§DX-02dz** — `src/scripts/check-quest-parity.js:quest parity: QUEST:CORE identical@25` prints `a.length`
  labelled "bytes". The mislabel propagates into every ship record that quotes the fence size.

**Cited, deliberately not re-filed** (instrument 7): §AUDIT-03bj (the content triage and the 138-quest
closure) · §DX-02u (`voidFluxCleared`) · §DX-02bs (the `once:` blind spot) · §DX-02cz (the detector covers
flags only) · §DX-02dx (D6, the dead require) · §DX-02dw (`const d20  = Math.ceil(E.rng() * 20)@22249` is the
one unguarded effect call in the kernel this report's port routes through).

---

## 12. Anchors (HEAD, 2026-08-22)

`const QUEST_DB = {@10615` · `WORLDBUILDER:QUEST_DB:END@21952` · `quest_1367_f_plague: {@13965` ·
`quest_1367_d_hansa: {@13961` · `quest_scar_03: {@14015` · `plague_exposed: false,@23291` ·
`_legacy_fn(bit, ctx)@22328` · `_legacy_fn:  { required:@22000` ·
`const d20  = Math.ceil(E.rng() * 20)@22249` · `function _innKindness(n)@23530` ·
`function _addCroneMark()@23540` · `function _setNpcFavor(key, level)@23463` ·
`function _checkDearFriendUpgrade(key)@23490` · `const WM_ARCHIVE_DOCS = [@27788` ·
`seaStrangenessNoticed@12491` · `is not expressible in canActivate@13974` · `S_story[ngEbKey] = true;@35290`
(the eleventh computed-key writer, omitted from the original §9-FU list of ten) ·
`src/js/quest.js:resolveSkillCheck(bit, ctx)@322` · `src/js/quest.js:const d20  = Math.ceil(E.rng() * 20)@314` ·
`src/scripts/check-questgraph.js:const Q = require@63` · `src/scripts/check-questgraph.js:function matchBrace@66` ·
`src/scripts/check-questgraph.js:function gateSat@273` · `src/scripts/check-questgraph.js:function scanFlagWrites@302` ·
`src/scripts/check-quest-parity.js:quest parity: QUEST:CORE identical@25` ·
`src/scripts/check-gate-parity.js:const rt = Q.createQuestRuntime@32` (§VM-01-F — the kernel's genuine first
consumer, per D6).

*Ship-day anchors, superseded but recorded — all verified to resolve on `354b20a^`: QUEST_DB 10492–21692 ·
plague 13831 · handler src/js/quest.js:349 (HTML 22025) · contract src/js/quest.js:59 (HTML 21735) · helpers 23181 /
23191 / 23136 / 23163 · default-decl 22964 · WM_ARCHIVE_DOCS 27309 · quest_sea_01 write 12349 · the ten
writers 23262 / 23287 / 23323 / 23350 / 23794 / 25691 / 25745 / 27373 / 29556 / 31128.*

**Full per-bit dump:** `scratchpad/legacy_fn_dump.txt` (125 entries) — throwaway, not committed.
