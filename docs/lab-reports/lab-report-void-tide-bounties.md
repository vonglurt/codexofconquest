<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §BOARD-01-FU8: Void-Tide Bounties (tie the board to the clock)

> **Status: SHIPPED and VERIFIED.** Design lock written 2026-07-21; implementation shipped the same
> day in `4af74b4` (15:35:15 −0700), pinned parent `f53b249` (12:51). Re-measured end to end on
> 2026-08-22 under **§DOC-02** against the pinned parent, a rebuilt ship-day tree, and live HEAD in
> Chromium. **Every design claim held. One invariant claim did not, and the repo caught it 1 d 21 h
> 53 min later.** §§1–8 are the original lock, corrected in place; §§9–13 are the verification record.

---

## Abstract

The Warrant's Board posts bounties keyed to geography (§BOARD-01) and, since FU7, to reputation. It
was not keyed to the one thing the game is actually about: the 49-day Void clock. This increment
adds three clock-gated Warrant hunts that surface as a single pinned `⚠️ VOID` posting — one at a
time, inside disjoint day windows (21→35→42, continuous to day 49) — with threat (DC 13→15→17) and
reward (⭐150→220→320 XP plus Warrant standing 🗡️+2/+3/+4) escalating with the tide. The lock's
central architectural claim is that the window belongs in **one** gate consulted by **both** the
arrival path and the board, never in a bespoke board branch. That claim was right, and it aged well:
two days later §BOARD-01-VOID-GATE moved the window out of a per-quest closure and into a
`dayMin`/`dayMax` **gate-grammar leaf**, preserving behaviour exactly while making the doom clock
legible to the soft-lock prover. The mechanism was replaced; the reasoning that chose it survived.

---

## 1. Problem and motivation

`const VOID_TIDE_EVENTS@22366` is a table of seven day-keyed dread beats (days 3, 7, 14, 21, 28, 35,
42) fired on sleep by `function storyCheckVoidTide()@36349`, reached from
`function storyConfirmSleep()@36235`. Beat **#21** narrates a Warrant bounty the engine never
modelled:

> *"A Void Walker was spotted north of Visby. It moved through a stone wall without slowing. The
> Warrant put a bounty on it. Nobody collected."* — `VOID_TIDE_EVENTS[21]`, title *First Walker
> Sighted*

The board narrated a clock-driven bounty economy and modelled none of it — the §BOARD-01 thesis one
layer up. **The inspiration is that single sentence.** *Nobody collected* is a complaint about an
absent mechanic, written by the world about itself. FU8's job is to make it collectable.

---

## 2. Design calls (made by the user, 2026-07-21)

1. **A bounty is a real quest flagged "featured"**, not a synthetic display table — accepted through
   the existing path, completed by travelling to the node, accruing standing like any other job
   (Host/Script Separation). *Ground-truth correction, re-verified at the pinned parent:* the reuse
   roster is **empty**. `quest_void_below` and `quest_cat_void` carry **no `activateNode`** (they are
   NPC/battle-driven, so the board's predicate skips them) and *Void Shaman's Sanctum* is
   `quest_eg_primary`, **`type:'epic'`** (excluded). The on-policy path is therefore the option's
   second clause: **author new hunts** — which is also the thematically right move, since it makes
   beat #21 real.
2. **Reward and threat escalate with the clock** — an early tide posts a modest skirmish, a late tide
   a premium hunt. Pairs with §PLAY-01-B/C (a clock that finally bites).
3. **Closing window / missable** — a hunt is live only inside its tide window; miss it and it is gone
   (echoing *"Nobody collected"*).

---

## 3. As-built inventory

| name | kind | anchor (HEAD) | purpose |
|---|---|---|---|
| `VOID_TIDE_FEATURED` | const map, tideDay → `{quest, standing, rumor}` | `const VOID_TIDE_FEATURED@37095` | the featured roster, per-quest standing bonus, dread hook |
| `VOID_FEATURED_IDS` | derived `Set` | `const VOID_FEATURED_IDS@37100` | ids excluded from the normal rotation pool |
| `quest_void_tide_21/35/42` | 3 UQF `combat` quests | `quest_void_tide_21@21311` · `quest_void_tide_35@21314` · `quest_void_tide_42@21317` | the completable featured bounties |
| `_bountyPostable(q,node)` | pure predicate | `function _bountyPostable(q, node)@37140` | shared legality gate; deliberately excludes the FU7 reward ceiling |
| `_voidFeatured(node)` | pure selector | `function _voidFeatured(node)@37154` | the active featured bounty, or `null` |
| `_voidBonus(id)` | pure lookup | `function _voidBonus(id)@37102` | escalated standing for a Void bounty, else 1 |

**No new `S_story` field.** FU7's `warrantStanding: 0, warrantAccepted: {}@23082` already carries the
reputation state; the escalated bonus is derived from the const table at credit time. **Verified:**
the shipped diff adds no state field, and the two fields sit on one source line.

---

## 4. The window model — and the two shapes it has had

Each hunt carries a **disjoint, continuous** day window covering 21→49.

| tide | window | as shipped `4af74b4` | at HEAD (`37f8ccb`, 2026-07-23) |
|---|---|---|---|
| 21 | `21 ≤ d < 35` | `activateCond` closure | `gate:{ dayMin:21, dayMax:35 }` |
| 35 | `35 ≤ d < 42` | `activateCond` closure | `gate:{ dayMin:35, dayMax:42 }` |
| 42 | `d ≥ 42` | `activateCond` closure | `gate:{ dayMin:42 }` |

`dayMax` is **exclusive** — `if (g.dayMax != null && d >= g.dayMax) return false;@22095` in
`function _matchActivationLeaf(g, st)@22046` — so the migration is behaviour-preserving to the day.

The architectural claim is unchanged by the migration: **one** source of truth is consulted by
**both** places that ask *is this quest available* — the arrival guard inside
`function storyCheckQuests(node, indexFresh)@30181`, and `_bountyPostable`. What falls out for free:

- **Missable.** Once the day crosses 35, the day-21 hunt is neither pinnable nor organically
  activatable. Unless it was already accepted — a taken bounty lives in `S_story.quests` and finishes
  on its own schedule. *Taking it is beating the window.*
- **No pre-tide leak.** Excluded from the rotation pool, a Void hunt can never appear before its
  tide. It exists only as the pin, only in-window.
- **Consistent organic discovery.** A player who simply walks to `VS` during [21,35) still meets the
  Walker; it just does not accrue standing, exactly as FU7 defined.

`_voidFeatured` therefore needs no day arithmetic of its own: disjointness guarantees at most one
entry is `_bountyPostable`, and it returns the first that is.

---

## 5. Reward and threat model

| tide | quest | node | DC | reward XP | standing |
|---|---|---|---|---|---|
| 21 | *The Uncollected Bounty* | VS — Visby Underground, Fence Quarter | 13 | 150 | +2 |
| 35 | *The Thing at the Signal-Fire* | ECF — Eclipse Farm, Coast North of Stiklestad | 15 | 220 | +3 |
| 42 | *The Outriders at the Crossing* | RVP — River Ford, Willow-Bank Crossing | 17 | 320 | +4 |

Every cell above was re-measured against the shipped `QUEST_DB` entries and `NODE_MAP` labels: **the
table is exact.** Threat climbs by DC and by fiction (a drifting Walker → a thing learning that the
signal fire is only a fire → an outrider who holds a ford the way the tide holds it). Reward climbs
two honest ways: the quest's own `reward` XP bit, read by the existing `function _boardReward@37044`
path (never fake gold, per FU1), and the escalated standing applied at
`function _creditWarrant(id)@37108`. Standing is host bookkeeping, not an economy change.

**Reconciliation with the FU7 reward ceiling** (a deliberate refinement of design call #2, flagged
for veto at lock time and never vetoed). The option text mused that deep-tide rewards should top the
ceiling so only high-standing players see them. Taken literally alongside call #3, that
**double-locks** the climactic content: a low-standing player at day 42 would be denied the day-42
hunt *and* it would then expire — unreachable forever, for exactly the players who most need
standing. Resolution: **the pin bypasses the ceiling.** Escalation is delivered by threat and
standing, not by hiding the card. Verified in the browser at HEAD: at standing 0 the tier is
*Unknown* (`rewardCap: 250@37066`, slate 4) and the day-42 pin still renders **⭐320 xp** as a fifth
row. The bypass works, and because Void hunts are excluded from the pool, 320 never pollutes the FU7
ceiling tests either.

---

## 6. Selection and render wiring

- `function _boardBounties(node, limit)@37174`: (a) the loop's legality checks were factored into
  `_bountyPostable`; (b) one skip added — `if (VOID_FEATURED_IDS.has(q.id)) continue;@37182`; (c)
  after distance labelling, `const vf = _voidFeatured(node);@37208` and `shown.unshift(vf);@37212`.
  The pin is an **extra** row, unshifted past the slate slice, always first. Pure and read-only.
- Render, at `lbl: b.void ?@35698` inside `function storyRender(node, prefix)@34565`: the card
  branches on `b.void` — label `⚠️ VOID` (else `BOUNTY`), a `⚠️ ` prefix on the main line, a
  `· 🗡️+N standing` tail on the sub-line, button `Hunt it` (else `Take`), and the roster's `rumor`
  as the hint.
- `_acceptBounty` is **unchanged** — a Void bounty is a real quest, so the generic accept tags it as
  Warrant work and sets the waypoint like any other.
- `_creditWarrant`: `+ 1` → `+ _voidBonus(id)`.

**All four wiring claims verified against the shipped diff, and the render verified in Chromium.**
What a player at a rest node actually reads on day 21, captured live at HEAD:

```
⚠️ VOID
⚠️ The Uncollected Bounty
→ Visby Underground · ~28 legs · ⭐150 xp · 🗡️+2 standing
⚠️ The Crimson Warrant reposts an old price: a Void Walker, sighted north of Visby. Nobody collected. Yet.
[ Hunt it ]
```

That trailing *"Yet."* is the whole increment in one word.

---

## 7. Invariants — outcome per claim

| invariant | verdict |
|---|---|
| Free-Movement / Mission-Gating — the pin gates *listing*, never reachability | ✅ held |
| No jump travel — accepting sets a waypoint, never moves the player | ✅ held, asserted by test |
| `unlock` never activates out of sequence — `_bountyPostable` still calls `canActivate` | ✅ held |
| No new game-state `Math.random()` — the pin is a pure function of `S_story.day` and a const table | ✅ held, zero added |
| Data-driven, no per-node `if` — the pin rides the node-flag path via `function _boardHost(node)@37029` | ✅ held |
| Pure selection — `_boardBounties`/`_voidFeatured` mutate no `S_story` | ✅ held, asserted by test |
| **Host/Script Separation — "fully in-grammar, no bespoke path"** (design call #1) | ❌ **VIOLATED at ship.** See §10.1 |

---

## 8. Test plan, and what shipped

Six behaviours were specified; they shipped as **three** test bodies in
`src/tests/integration/warrants-board.test.js`, and every one of the six assertions is present:

| specified behaviour | shipped in |
|---|---|
| dormant before day 21 | test 1 — *dormant before day 21; the pin appears and escalates in-window* |
| appears in-window, escalates | test 1 |
| closing window / missable | test 2 — *closing window / missable* |
| excluded from the normal pool | test 2 |
| escalated standing at the real `onPass` site | test 3 — *completing a Void hunt accrues the ESCALATED standing* |
| purity and no-move | test 3 (`pure` and `posAfter` equals `posBefore`) |

---

## 9. Verification record (§DOC-02, 2026-08-22)

**Method.** Pinned parent `f53b249` and ship `4af74b4` extracted with `git show`; a ship-day tree
rebuilt with `git archive 4af74b4 scripts js package.json play.html tests playwright.config.js`
and the repo's `node_modules` symlinked, so the day's own tooling runs as it ran; HEAD probed in
Chromium through Playwright.

**Scope fence.** 4 files, 10 HTML hunks, **+82/−16**. HTML 37,472 → 37,538 lines: net **+66**, which
is the file's own delta — the change is exactly what the diff says it is. Tests **+209/−0**;
BACKLOG **+8/−3**; this report **+137/−0**, committed alongside the code it locks.

**Gates re-run.**

| gate | at ship (rebuilt tree) | at HEAD |
|---|---|---|
| `warrants-board.test.js` | **21/21** — exactly §9's claim | **25/25** |
| `courier-map.smoke.test.js` | **1/1** | — |
| `enemy-ai.test.js` | **4/4** | — |
| `kg-quest-chain.test.js` | **4/4** | — |
| `node --check` on the extracted inline script | **0 errors** | — |
| `check:questgraph` (soft-lock prover) | did not exist yet | ✅ green |
| `check:invariants` | I1/I2 J14–J15 red | pre-existing, retired later by `fa8f9e4` |

**Player-facing behaviour, sampled in the browser at HEAD.** Days 1 and 20: four cards, none `void`.
Days 21 and 34: five cards, pin `quest_void_tide_21`, ⭐150, 🗡️+2. Days 35 and 41: pin
`quest_void_tide_35`, ⭐220, 🗡️+3. Days 42 and 49: pin `quest_void_tide_42`, ⭐320, 🗡️+4. **Exactly
one window is live at every sampled day**, and every boundary flips on the correct day. Disjointness
and continuity are not an argument in this report; they are a measurement.

**Anchor audit.** The lock carried nine bare line numbers, measured on an uncommitted working tree.
Six resolve **exactly** at the pinned parent plus a constant **+7**, and that +7 is precisely the one
FU6 hunk (`@@ -20981 +20981,8 @@`, the `quest_brynn_ledger` two-target fork) that the same commit
landed from the working tree. Because FU8's own `QUEST_DB` insertion (a further +7, lower in the
file) is **absent** from the offset, the tree the author measured contained FU6 and **not** FU8 —
which proves from line numbers alone that **the design lock predates the implementation**, even
though git shows one commit. Three anchors miss: the two FU7 state fields (both live on a single
source line, so two different numbers cannot both be right, and neither is) and the arrival guard.
Those three preserve their mutual arithmetic exactly, so they came from one earlier measurement
carried across from the FU7 session — a build that matches no commit in the repository.

---

## 10. Corrections

### 10.1 The invariant the lock claimed and the increment broke

Design call #1 promised *"fully in-grammar, no bespoke path (Host/Script Separation)"*, and §4
reasoned that putting the clock gate in `activateCond` rather than in a board branch satisfied it.
**`activateCond` is the host escape hatch that invariant exists to retire.** Measured:

- `quest-runtime-uqf.test.js:8502` — *"all 78 type:combat quests are UQF-1.0, valid, skill_check bit,
  no legacy residue"* — is **green at the pinned parent** and **red at the ship commit**, with
  exactly three entries: `quest_void_tide_21:residual-activateCond`, `…_35`, `…_42`.
- The same test's `expect(r.total).toBe(78)` also breaks: the corpus is **81** `type:'combat'` quests
  after this increment (counted in-browser at HEAD).
- §9 of the original lock listed four green gates and **did not run that suite**. The report reported
  its own gates faithfully; the suite it needed was not among them.
- `37f8ccb` (§BOARD-01-VOID-GATE, 2026-07-23 13:28) fixed it **1 d 21 h 53 min later** by widening
  the grammar rather than moving the code, taking the suite **302/1 → 303/0**.

> **Instrument.** *"Reuse the shared existing path"* and *"stay inside the declarative grammar"* are
> different tests, and a report can pass the first while failing the second in the same sentence.
> Score an in-grammar claim against the **grammar's own term list**, never against the alternative
> the author rejected.

### 10.2 The prover could not see the window at all

`src/scripts/check-questgraph.js`, the soft-lock prover, was born `354b20a` on 2026-07-22 — **one day
after** this increment and **one day before** the fix. It contains **zero** occurrences of
`activateCond`, at birth and at HEAD: it reads only the declarative gate tree. So for two days the
three Void hunts looked unconditionally activatable to the tool whose entire job is proving the world
finishable. Its silence about them was **indistinguishable from a proof**. After the migration,
`src/scripts/check-questgraph.js:284` names the leaf explicitly — *"dayMin·dayMax — monotone-satisfiable
(the clock always reaches the window)"* — and the same verdict is now *derived* instead of
*unexamined*.

> **Instrument.** A static prover that cannot parse a construct does not report a gap; it reports a
> pass. When a lock argues *"the gate lives in X, so one source of truth enforces it,"* check whether
> the **tools** that read gates can read X.

### 10.3 `retryGateDays: 0` is inert

All three hunts carry `retryable:true, retryGateDays:0` — the author's notation for *no cooldown*.
The single consumer is `S_story.day < att.lastDay + (q.retryGateDays || 1)@6813`, and `0` is falsy,
so the coercion yields the **one-day default**. Measured at HEAD: after a forced failure on day 42
the retry is blocked the same day and unblocked on day 43. **42 `QUEST_DB` entries carry
`retryGateDays: 0` and every one of them is inert.** Filed as **§DX-02ee**.

> **✅ CLOSED 2026-08-26 by §DX-02ee, call (b).** All 42 zeros were deleted through `./bin/api put quest <id> retryGateDays=null`, and the `|| 1` coercion was kept, so the field now carries exactly one meaning and the data says what the engine does. The three Void-tide hunts still take the one-day gate — **the behaviour above is unchanged, and it is now written down**. Removing them exposed a second defect on the write path: `=null` cleared **quoted** values only, so a numeric or boolean field was refused as *not found* — `src/js/wbapi-core.js:function removeStringField@437` gained an unquoted-scalar pass. Pinned by `src/tests/integration/dx02ee-scalar-field-clear.test.js` 8/8.

*The accident is a better threat model than the design.* Because the clock advances at exactly one
site — `S_story.day = Math.min(49, S_story.day + 1)@36261`, inside `storyConfirmSleep` — a retry
costs one sleep, and a sleep costs one day of the window. Failing the day-42 hunt costs a seventh of
the time left to pass it. The lock promised escalation through danger and got it through arithmetic.

### 10.4 What a failed hunt actually costs

Measured at HEAD on the day-42 hunt: HP, gold, day and standing are all unchanged, the quest stays
`active`, and `onFail` is empty. The only movement is §XP-01 effort XP — `const EFFORT_XP_PCT@24430`
= 0.25 of the pass reward, paid **once per quest** (80 of the 320; a second failure pays nothing).
The measured delta was 90, of which the remaining 10 is `const EXPLORE_XP@24439` for first arrival at
the node. Design call #2's word *"lethal"* is fiction, not mechanics: nothing about a failed hunt is
lethal, and the report should not have used the word.

### 10.5 Smaller items

- **`5.11 MB`** in the ship commit's gate line is `s.length` of the extracted inline script —
  **5,114,102 UTF-16 code units**. The true size is 5,152,148 bytes = **5.15 MB**. This is the
  §DX-02dz "bytes-that-are-characters" hazard's **earliest** known instance and the first found in a
  commit message rather than a report. `node --check` at 0 errors reproduces exactly.
- **The engine comment this increment shipped carries a line number that was wrong the day it was
  written.** `beats at 21821@37089` points at `VOID_TIDE_EVENTS`, which sits at **21822** in the very
  build that comment shipped in, and at **22368** today. Nothing can catch it: the anchor gate walks
  `*.md` only (`src/scripts/resolve-anchors.js:65`). Filed as **§DX-02ef**.
- **Three parity fences, not four.** §9's *"0 kernel sentinels (`MOVER`/`ROOMS`/`DUEL:CORE`
  untouched)"* is **exact** — every hunk sits at line 20981 or later, and the sentinel blocks end
  at 10216. It names three because `QUEST:CORE` did not exist yet; it arrived the next day with
  §VM-01-D. That day's `check:walk` ran six gates; it runs sixteen now.
- **Test arithmetic.** The suite went 17 → 21 at this commit. §9's *"prior 18 + FU8"* counts as prior
  the FU6-branch test that **this commit added**; the true split is 17 pre-existing + 1 FU6-branch + 3
  FU8.
- **Beat 28 gets no bounty.** `VOID_TIDE_EVENTS` has seven beats and FU8 features three, so the
  windows are 14 / 7 / 8 days rather than the even ladder the escalation prose implies. Not a defect —
  the day-21 hunt simply stays posted through beat 28 — but the lock never says so.
- **No home doc was synced.** The increment touched `BACKLOG.md`, the HTML, the tests and this report.
  `quest.md:199` carries the three ids today because §AUDIT-03g re-anchored them on 2026-07-29, eight
  days later.

---

## 11. What the player got

**Immediately:** a card. On day 20 the Warrant's Board is four ordinary jobs; on day 21 it is five,
and the new one is at the top with a warning label and a button that says *Hunt it* instead of
*Take*. The doom clock stops being a number in the corner of the HUD and starts putting work on a
board, which is the only way a clock in an RPG becomes a threat rather than a countdown.

The fit is better than the lock knew. The day badge has turned amber at day 35 and red at day 42
since the initial commit — `dayEl.className@36096` — so FU8's second and third windows open on
exactly the days the HUD already changed colour. The player was being told the tide was rising two
months before there was anything to do about it.

**Later, and this is the part the lock could not have planned:** its real product was not the three
quests. It was **stating a doom-clock window as a fact about a quest.** For two days that fact lived
in three arrow functions, where nothing but the game itself could read it. §BOARD-01-VOID-GATE moved
it into the gate grammar, and the tool that guarantees the world is finishable can now reason about
it: it knows the tide rises on day 21, and it knows a player arriving on day 43 is not quietly locked
out. *A design lock's durable output is often not the feature — it is the sentence the next increment
gets to write down in a language the tools can read.*

---

## 12. Defects filed

| row | severity | summary |
|---|---|---|
| **§DX-02ee** | ✅ shipped 2026-08-26 | `retryGateDays: 0` is unreachable through `(q.retryGateDays \|\| 1)`; 42 quests silently take the one-day default — closed by call (b), all 42 zeros deleted, coercion kept |
| **§DX-02ef** | 🟢 no design call | Two doom-clock references that are provably wrong: the inline `beats at 21821` comment, unfenced because the anchor gate reads `*.md` only, and `prompt.md:196`'s *"travel cost days"* |

**Retired by measurement, not filed:** the Host/Script Separation violation of §10.1 — fixed by
`37f8ccb` on 2026-07-23, verified green at HEAD.

---

## 13. Reproduction

```bash
git show f53b249:play.html   > parent.html          # pinned parent
git archive 4af74b4 scripts js package.json play.html tests playwright.config.js \
  | tar -x -C shipworld && ln -sfn "$PWD/node_modules" shipworld/node_modules
cd shipworld && npx playwright test src/tests/integration/warrants-board.test.js        # 21/21
npx playwright test src/tests/integration/quest-runtime-uqf.test.js -g "type:combat"    # RED at ship
npm run check:questgraph                                                            # green at HEAD
```

*"Posted a week. Still posted. That is not a bounty, that is an accusation."* — the Crimson Warrant,
`quest_void_tide_21`. It is also a fair review of a lab report that names an invariant and ships a
closure. The board got its clock; the grammar got the word two days later.
