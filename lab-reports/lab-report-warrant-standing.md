<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §BOARD-01-FU7 *Warrant Standing*: reputation as a board-quality gate

**Class:** design lock (IEEE-format spec written *before* implementation) · **Verified:** §DOC-02cu, 2026-08-22
**Original date:** 2026-07-21 · **Measured against:** `roll2hit-v3.html` @ `4878c3c` (`ENGINE_VER = r2h-3.104.0`, 37,422 lines) — *both figures re-checked exact*
**Shipped:** `e0051a8` 2026-07-21 12:51, **the same commit that added this report** · **Pinned parent:** `e0051a8^` = `4878c3c`
**Parent item:** BACKLOG.md §BOARD-01-FU7 (promotes `potential.md` §POT-H4 / §POT-C5 / §POT-P3) · **Builds on:** `lab-report-warrants-board.md`, §BOARD-01-FU6 · **Superseded by:** §BOARD-01-FU8 (`lab-report-void-tide-bounties.md`)

---

## Abstract

The Warrant's Board handed out work and remembered none of it. This report locks the design that
gives the Crimson Warrant a memory: a single integer, `warrantStanding`, incremented when the player
completes a bounty they took **through the board**, and a five-rung tier ladder that widens the
board's slate and lifts a reward-ceiling as that integer climbs. Two design calls were put to the
user and both were answered before any HTML was edited.

**Verification verdict (§DOC-02cu).** The transliteration is among the most faithful in the program:
the §5 tier table shipped **byte-identical** and is byte-identical at HEAD a month later; four of the
six §7 code blocks shipped byte-identical; 14 of 15 line anchors resolve exactly on the pinned parent;
the scope fence closes to the line (+53/−3 = net +50 = the file's own delta); and every test and
regression figure in the ship commit reproduces exactly on a rebuilt ship-day tree.

**And the feature is half-inert in play, which no test in the report can see.** Design call 1 had two
halves. The first — *the slate widens 4 → 7* — works, and is proved in Chromium at the ship build and
at HEAD. The second — *premium bounties surface only once earned* — shipped correct, passes its test,
and **has zero observable effect**: over sixty consecutive game days at maximum standing the board
never once posted a bounty the tier-0 ceiling would have hidden. The gate filters a 1,076-entry
candidate pool; the player reads a 7-entry slice; and the two are joined by a hash that has never
heard of standing.

> *The Warrant learned your name. It did not learn to put its best work on top.*

---

## 1. The say/do gap (as stated, and as re-verified)

§BOARD-01-FU6 made the board a **network** — three referral chains, including the cross-region 1367
Chronicle whose prose has the Warrant *vouching for you*. Nothing accrued. The report's three grepped
proofs, re-run on the pinned parent:

| # | Claim as written | Re-measured at `4878c3c` | Verdict |
|---|---|---|---|
| 1 | no faction/standing scalar in `_S_DEFAULTS` (`22478`) | `warrantStanding\|warrantAccepted\|reputation\|standing` inside the defaults block → **0** | ✔ exact |
| 2 | `_boardBounties` (`35897`) posts a fixed slate of **4** | `out.slice(0, limit || 4)`; sole caller `_boardBounties(node, 4)` | ✔ exact |
| 3 | the board records nothing the player earned from it | no read of player history anywhere in the selector | ✔ |

One wording correction. §1 called the candidate pool *"unconditional."* It is not — the loop carries
six guards (schema, `const BOUNTY_TYPES@37036` membership, a distant `activateNode`, not-already-
started, destination exists, and both activation gates). What is unconditional is that **no guard
consults the player's history with the board**, which is the point being made and is correct.

**Theme.** Sibling of §BOARD-01's Curse-of-Knowledge: the board hands out work and remembers none of
it. FU7 gives it a memory. You earn the Warrant's trust by doing its work, and trust widens what it
will show you.

---

## 2. Method

1. **One scalar + one tag, no new opcode.** Accrual is host bookkeeping called from the two points a
   quest already finishes — not a VM opcode. The board *reads* standing in its existing pure selector.
2. **Reuse both completion sites verbatim.** A one-line guarded, idempotent call at each.
3. **Gate QUALITY, never a step.** Standing changes only which bounties list and how many. Every
   destination stays reachable on foot at standing 0.
4. **Determinism preserved.** Standing feeds `limit` and a numeric ceiling into the existing FNV-1a
   selection; no `Math.random`, replayable per `(node, gameDay, standing)`.
5. **State in one place (§STATE-INIT).** Both fields go only in `const _S_DEFAULTS@23062`, so a fresh
   game, a load-merge and a checkpoint reset inherit them for free.

All five held. See §6.

---

## 3. Concepts added

| # | Concept | What it is | Shipped as |
|---|---|---|---|
| C1 | `S_story.warrantStanding` | integer count of completed board-accepted bounties | `warrantStanding: 0, warrantAccepted: {}@23082` |
| C2 | `S_story.warrantAccepted{}` | `id → true` on accept, flipped to `'credited'` on payout | *(same line)* |
| C3 | `WARRANT_TIERS` + `_warrantTier(n)` | ordered rank table → `{name, slate, rewardCap}` | `const WARRANT_TIERS = [@37074` · `function _warrantTier(standing)@37081` |
| C4 | `_creditWarrant(id)` | idempotent host credit, returns a rank-up line or `''` | `function _creditWarrant(id)@37117` |
| C5 | `_boardRewardXp(q)` | numeric twin of the display reward scan | `function _boardRewardXp(q)@37089` |
| C6 | standing-gated selection | tier drives slate size + reward ceiling | `const tier = _warrantTier(S_story.warrantStanding)@37186` |

**C1 and C2 shipped as one physical line.** This matters downstream: see §11.

**Not added (deliberately):** no new opcode, no new gate term, no `Math.random`, no movement or entry
gate, no economy change. All six abstentions verified against the diff.

---

## 4. Design decisions (the §BOARD-01-FU7-0 calls — MADE by the user)

**Call 1 — What does rising standing unlock? → BIGGER SLATE + PREMIUM JOBS.**
Each tier (a) grows the slate 4 → 7 and (b) lifts a **reward-ceiling** so the Warrant's high-value
bounties surface only once you have earned its trust — the mechanical form of the 1367 Chronicle's
*"the Warrant vouches for you."* Both are pure listing gates over the existing pool.

> ⚠ **One of the two options declined here was declined on a false premise.** The report reads:
> *"Declined: 'eligible types' — 0 combat/hunt/… quests exist today so it has no live effect."*
> Measured with the real parser at the pinned parent, the board-eligible pool is **2,760 quests across
> six types**: `skill_check` 2,454 · `side` 142 · **`combat` 78** · **`delivery` 57** · **`escort` 22**
> · **`dialogue` 7**. Only `hunt` and `craft` are empty. **The declined option would have gated 164
> quests.** The counterexample was seventeen lines above the report's own `function _boardReward(q)@37053`
> anchor, in `const BOUNTY_TYPES@37036` — which names all eight types the board will post. A combat
> bounty (*"The Hammer Returns"*) sits on the measured slate at standing 3 and above.
> *(Instrument 135, again: grep the function you are about to edit — the counterexample is usually inside it.)*

**Call 2 — What counts toward standing? → ONLY BOARD-ACCEPTED BOUNTIES.**
Standing accrues only for quests taken through the board (the tag set in
`function _acceptBounty(id)@37227`). Organic geographic discovery never counts. ✔ shipped as specified.

**Secondary calls (locked, tunable):** the ceiling is on **xp**; the tier-0 ceiling is set generously
so a newcomer's board is never emptied (verified — see §9); the header shows rank + count.

---

## 5. Data shapes (locked) — **byte-identical at ship and at HEAD**

```js
warrantStanding: 0,     // C1 — completed board-accepted bounties
warrantAccepted: {},    // C2 — id → true (live) | 'credited' (paid out; idempotency sentinel)

const WARRANT_TIERS = [
  { min: 0,  name: 'Unknown',       slate: 4, rewardCap: 250 },
  { min: 3,  name: 'Marked',        slate: 5, rewardCap: 350 },
  { min: 7,  name: 'Trusted',       slate: 6, rewardCap: 500 },
  { min: 12, name: 'Sworn',         slate: 6, rewardCap: Infinity },
  { min: 20, name: "Warrant's Own", slate: 7, rewardCap: Infinity },
];
```

All five rows, all four fields, shipped verbatim from this block. Diffed at `e0051a8` and at HEAD
(`rewardCap: 250@37075`) — **zero deltas in thirty-two days.**

> ⚠ **The ladder has a dead rung.** `Sworn` (min 12) carries **the same slate as `Trusted`** — 6 —
> and its only other effect is lifting a ceiling that gates five quests out of 1,076. Measured in the
> browser, the board at standing 7 and the board at standing 12 are **the same six cards in the same
> order**. Five more completed bounties buy a rank name and nothing else. §8's own walk-through skips
> `Sworn` — it names Marked, Trusted and Warrant's Own — because there is nothing to narrate.

---

## 6. Invariant compliance — re-verified against the shipped diff

| Invariant | Verdict |
|---|---|
| Gates listing/quality only, never a step | ✔ standing feeds only `limit` and one `continue` |
| No jump travel | ✔ `_creditWarrant` mutates two `S_story` fields; position untouched (asserted in §9) |
| Economy untouched | ✔ no reward value changed anywhere in the diff |
| No new game-state `Math.random` | ✔ zero occurrences in the diff |
| Host/Script Separation | ✔ no new opcode, no control flow in a leaf handler; idempotent via the `'credited'` sentinel |
| §STATE-INIT single source of truth | ✔ one hunk in `const _S_DEFAULTS@23062`, nowhere else |
| DUEL:CORE / MOVER:CORE / ROOMS:CORE untouched | ✔ 0 kernel sentinels in 9 hunks |

Seven for seven. Notably, this is the invariant section the *next* increment failed: §BOARD-01-FU8
named Host/Script Separation in its first design call and then put a clock window in `activateCond`
(§DOC-02ct). FU7 claimed the same invariant and kept it.

**One consequence worth stating that the report does not.** Because the tag is the sole eligibility
key, a save created **before** `e0051a8` restores with `warrantAccepted: {}` from defaults, so any
board bounty already in flight can never accrue. Correct by design ("organic never counts"), but it
means every pre-FU7 save starts the ladder at zero with its in-progress Warrant work unpayable.

---

## 7. Implementation surface — spec → shipped delta

| §7 block | Specified | Shipped | Delta |
|---|---|---|---|
| (a) state | two fields after `waypoint`/`customQuestTerrain` (`22496`) | `warrantStanding: 0, warrantAccepted: {}@23082` | **exact**; comment lengthened |
| (b) tier table | `WARRANT_TIERS` §5 | `const WARRANT_TIERS = [@37074` | **byte-identical** |
| (b) `_warrantTier` | 2-line form | `function _warrantTier(standing)@37081` | reflowed to 4 lines, semantics identical |
| (b) `_boardRewardXp` | 8-line body | `function _boardRewardXp(q)@37089` | identical modulo spacing |
| (b) `_creditWarrant` | 9-line body | `function _creditWarrant(id)@37117` | identical; one inline comment promoted to a block |
| (c) ceiling | `if (_boardRewardXp(q) > tier.rewardCap) continue;` | `if (_boardRewardXp(q) > tier.rewardCap) continue@37192` | **byte-identical** |
| (c) slate | `out.slice(0, limit \|\| tier.slate)` | `const shown = out.slice(0, limit@37203` | **byte-identical** |
| (d) accept tag | one line after the `unlock` execBits | `(S_story.warrantAccepted = S_story.warrantAccepted@37232` | **byte-identical** |
| (e) hook A | `{ const _wp = _creditWarrant(id); … }` | `const _wp = _creditWarrant(id)@30203` | **byte-identical** |
| (e) hook B | `{ const _wp = _creditWarrant(questId); … }` | `const _wp = _creditWarrant(questId)@6993` | **byte-identical** |
| (f) header | `const _t = …` | `const _wt = _warrantTier(S_story.warrantStanding)@35703` | variable renamed `_t` → `_wt` |
| — | *(not specified)* | `const _bounties = _boardBounties(node)@35701` | ⚠ **an edit §7 does not contain** |

**Scope fence:** 4 files (this report, `roll2hit-v3.html`, `warrants-board.test.js`, BACKLOG.md),
**9 hunks, +53/−3**, net **+50** — **exactly the file's own line delta** (37,422 → 37,472). Every hunk
header names a function §7 named.

> ⚠ **THE MISSING EDIT, and it is load-bearing.** §7(c) specifies `limit || tier.slate` and §7(f)
> shows only the header line. At the pinned parent the **sole** caller in the game was
> `_boardBounties(node, 4)` — an explicit `limit`. Had the increment been the *"pure transliteration"*
> the report promises, `limit` would have stayed 4 forever and **the entire slate-size half of design
> call 1 would have been inert.** The implementer caught it and changed the call site; the lock did not.
> **A spec that gates on a default (`x || fallback`) is incomplete until it names the call sites that
> pass an explicit `x`.** The omission was invisible from inside the report because §9's own test
> bullet was already written against the new signature — *"`_boardBounties(node)` (no explicit limit)"*.

> **A second, smaller mis-description, and it runs the other way — the report UNDERSELLS itself.**
> §7(e) labels hook A the *"`storyCheckQuests` side/craft path."* It is not. The hook sits inside
> `QuestRuntime.canComplete(id)@30187`, whose guard is `q.schema === 'UQF-1.0' && q.completion &&
> canComplete(id)` — **type-agnostic**. The `q.type === 'side'` line above it is the preceding
> statement, not the enclosing branch. So the hook covers the full declarative completion surface
> (2,760 board-eligible quests), not 142 side quests plus zero craft quests. *A hook described by the
> line above it has been described by its neighbour, not by its guard.*

**A stale comment FU7 introduced and no gate can see.** `run it ONLY over the ≤4 shown cards@37206`
is a §BOARD-01-FU3 comment defending a BFS cost bound. FU7 raised that bound to 7 and did not update
it; it still says `≤4` at HEAD, thirty-two days later. Comments in `roll2hit-v3.html` are outside the
`.md`-only reach of `scripts/resolve-anchors.js:65` — the same blind spot §DX-02ef was filed for.

---

## 8. UI as gameplay experience — **measured in Chromium, not described**

Proved at the ship build `e0051a8` and re-proved at HEAD, at `TLL`, on a fresh game, day 0. Both
builds agree on every figure.

| Standing | Rank shown in the header | Cards | Ceiling | Pool | Max reward-xp *in the pool* |
|---|---|---|---|---|---|
| 0 | `The Warrant's Board — Unknown (0)` | **4** | 250 | 1,071 | 250 |
| 3 | `— Marked (3)` | **5** | 350 | 1,072 | 350 |
| 7 | `— Trusted (7)` | **6** | 500 | 1,075 | 500 |
| 12 | `— Sworn (12)` | **6** | ∞ | 1,076 | 600 |
| 20 | `— Warrant's Own (20)` | **7** | ∞ | 1,076 | 600 |

**What shipped and works.** The header reads exactly as §8 promised, rank name and count, at every
rung. The slate widens 4 → 5 → 6 → 6 → 7. The tier-0 board is never emptied. The whole ladder is
legible in the fiction and costs the player nothing but work.

**What shipped and cannot be felt.**

- **The four cards a newcomer sees are still the first four cards at every rank, in the same order.**
  New cards append at the bottom. The sort key is `(daySeed ^ _boardSeed(q.id + '|' + day))` — it does
  not know about standing — so widening the slice never reorders it. The player is not shown a
  different board; they are shown the same board with more of it.
- **Every card on the measured slate scores `_boardRewardXp` = 0**, at all five ranks, including the
  full seven-card `Warrant's Own` slate. So does the display string: `rewardStr` is empty on all seven.
- **Of the 1,076 candidates, 35 (3.3%) carry any reward-xp and 5 (0.46%) exceed the tier-0 cap.**
  Those five sort to positions **265, 461, 828, 859 and 887**. None is in the top seven.
- **Swept across sixty consecutive game days at `Warrant's Own`: days on which the board posted a
  bounty the tier-0 ceiling would have hidden = 0.** Days showing any reward-xp at all = 6.

**So design call 1's second half is correct code with no reach.** It removes five candidates from a
pool of 1,076 and the player reads a slice of seven chosen by a hash. This is not a coding error —
`_boardRewardXp` is right, the ceiling is right, the test is right. It is a **population** error: the
gate acts on the eligible set, the experience is the shown set, and the report reasoned about the
first while promising the second.

> **The tell was written down in the report itself.** §9's ceiling test says: *"inspect the CANDIDATE
> POOL (huge limit so the slice can't hide it)."* The test author knew the slice hides it, and tested
> around it. That parenthetical is the most valuable sentence in the document.

**What the day counter was already doing, and still does.** At standing 0 the top four turn over
completely between day 0 and day 1. Board variety is `gameDay`, and always was — shipped in the
original §BOARD-01. **Standing appends; the day reshuffles.** Which leaves a pleasing accident: on
day 14 the board posts a skill-check quest titled *"Name Your Standing."*

---

## 9. Test plan — as specified, as shipped, as re-run

Six specified behaviours (plus regression) shipped as **four test bodies** — consolidation, with every
assertion present:

| §9 bullet | Shipped |
|---|---|
| accrual + idempotence + rank-up boundary | `tests/integration/warrants-board.test.js:436` |
| accept tag **+** integration at the real `onPass` site | `tests/integration/warrants-board.test.js:471` |
| tier gates slate SIZE **+** reward CEILING **+** non-empty guard | `tests/integration/warrants-board.test.js:501` |
| invariant: credit moves no position field | `tests/integration/warrants-board.test.js:535` |

**Re-run on a rebuilt ship-day tree** (`git archive e0051a8 …` + symlinked `node_modules`, instrument 150):

- `warrants-board.test.js` — **17 passed**, exactly the ship commit's *"17/17 (13 prior + 4 FU7)"*. ✔
- `courier-map.smoke.test.js` **1/1** · `enemy-ai.test.js` **4/4** · `kg-quest-chain.test.js` **4/4** — all three regression figures exact. ✔
- At HEAD the same file is **25 passed** (FU8 and Inc C added eight). ✔

*(One naming note for anyone reproducing this: the ship commit calls it "courier-map"; the file is
`courier-map.smoke.test.js`.)*

**`check:walk` ran six gates that day**, not the sixteen it runs now, and `check:duelparity` existed
in `package.json` but was in no automated path — the condition later filed as §DX-02ec.

---

## 10. Increment mapping

- **§BOARD-01-FU7-0** — this report. ✅ locked, both calls made.
- **§BOARD-01-FU7** — §7 (a)–(f) + §9 tests. ✅ shipped `e0051a8`.
- **§BOARD-01-FU7-FU** — proposed: authored `premium:true` flags; a standing decay axis; folding
  standing into the FU6 referral prose. **NOT SHIPPED.** What shipped the next day instead was
  §BOARD-01-FU8, which spent FU7's `warrantStanding` on Void-tide bounty escalation — the first
  consumer of this scalar, and the proof it was the right shape.

---

## 11. Verification appendix (§DOC-02cu)

**Anchors.** Fifteen bare line numbers, scored against the pinned parent `4878c3c`:
**14 exact** — `_S_DEFAULTS` 22478 · `waypoint/customQuestTerrain` 22496 · `npcFavorability` 22501 ·
`effortXpQuests` 6841 · `execBits(sc.onPass…)` 6829 · `xpAward` 29408 · `_boardReward` 35860 ·
`_boardBounties` 35897 · `_acceptBounty` 35938 · the header block 33310 · both load-merges
23155/23171 · the checkpoint reset 23263. Offset **zero** — this report was measured on the parent
build and written before the edit, which is what a design lock should look like.

**One miss.** `VOID_TIDE_EVENTS #21 (21803)` points at a closing brace; the table opens at 21807 and
beat 21 is at 21811 (−4 / −8). It is the only prose citation in the report, and the only one wrong —
consistent with instrument 9: **tables and function bodies get copied; narrative citations get
reconstructed.** A stray `29829→6829` in §7(e) is the author's own visible self-correction; the
surviving value resolves exactly.

**⚠ THE ANCHOR FINDING, and it closes an item §DOC-02ct had to leave open.** ct could not place the
pair `22488`/`22497` that §BOARD-01-FU8 cited for *"FU7's `warrantStanding`/`warrantAccepted`"*.
Both are now placed, and the answer is better than an offset. At FU8's parent `f53b249` the true
location is **one line, 22498**, holding both fields — so ct was right that neither number can be
correct. **`22497` is *this* report's own §7(a) insertion pointer**: *"after `waypoint`/`customQuestTerrain`,
`22496`"* — measured correctly on the parent, plus one for the insertion. FU8's author read a
**prediction** out of a design lock and recorded it as a **measurement**, then minted a second number
so that two fields would have two anchors. ***A spec anchor is a claim about where something will go.
The next increment inherits it as a claim about where something is, and no amount of scoring that
increment alone can catch it — you have to read the parent report.***

**The byte figure.** The ship commit says *"node --check clean (5.10 MB)."* The largest inline script
is **5,103,921 UTF-16 code units** and **5,141,866 bytes** — true size **5.14 MB**. This is
§DX-02dz's **sixth** instance and the **earliest** on record, one day before FU8's *"5.11 MB."* The
FU-series ladder (FU6 5.10 · FU7 5.10 · FU8 5.11) is now fully explained: it is `s.length / 1e6` on
the extracted script, every time. The tool is the liar, not the author.

**Corpus figures at the pinned parent**, real parser (`js/wbapi-core.js`), for anyone re-deriving:
**2,850** quests · **2,820** UQF · **2,760** board-eligible · six non-empty eligible types.

**Rows filed:** §DX-02eg 🟡 (the ceiling that filters a pool the player never reads) · §DX-02eh 🟢
(the `Sworn` rung that changes nothing, and the stale `≤4` comment).

---

*Verified §DOC-02cu, 2026-08-22. Original 163 lines; this revision re-measures every claim against
the pinned parent `4878c3c`, the ship build `e0051a8`, and HEAD.*

*© 2026 Paul Richeson — MIT License.*
