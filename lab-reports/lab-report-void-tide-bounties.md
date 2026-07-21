<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §BOARD-01-FU8: Void-Tide Bounties (tie the board to the clock)

> Child lab report for **§BOARD-01-FU8** (BACKLOG.md). Locks data shapes, the featured-selection
> rule, the reward/threat model, and the test plan **before** any HTML edit — per the Lab Report
> Policy in CONTRIBUTING.md, exactly as §BOARD-01-FU7 (`lab-report-warrant-standing.md`) did.
> Line anchors were grepped from the live file this session (`feat/board-01-warrants-board`,
> `r2h`-current) and will drift — re-measure before building.

## 1. Problem

The Warrant's Board (§BOARD-01) posts bounties keyed to **geography** and, since FU7, to **standing**.
It is not keyed to the one thing the whole game is about: the **Void clock**. `VOID_TIDE_EVENTS`
(`21815`) are day-keyed dread beats fired on sleep by `storyCheckVoidTide` (`35203`) off `S_story.day`
(the 1→49 doom clock). Event **#21** (`21819`) literally narrates a Warrant bounty the engine never
modelled: *"A Void Walker was spotted north of Visby… The Warrant put a bounty on it. Nobody collected."*
The board narrates a clock-driven bounty economy and models **none** of it — the exact §BOARD-01 thesis,
one layer up.

## 2. Design calls (MADE by the user, 2026-07-21)

1. **Bounty shape = a real quest, flagged "featured"** — not a synthetic display table. Accept via the
   existing `unlock`, complete by walking to the node, accrue Warrant standing — fully in-grammar, no
   bespoke path (Host/Script Separation). *Ground-truth correction:* the reuse roster is **empty** —
   `quest_void_below`/`quest_cat_void` carry **no `activateNode`** (NPC/battle-driven, so `_boardBounties`'
   predicate skips them) and "Void Shaman's Sanctum" is `quest_eg_primary`, **type `epic`** (excluded).
   So the on-policy path is the option's second clause: **author new Void-tide bounty quests** — which is
   also the thematically-right move, since it makes event #21's narrated-but-unmodelled bounty *real*.
2. **Reward + threat escalate with the clock** — an early tide posts a modest Void skirmish; a late tide
   posts a lethal, premium-reward hunt. Pairs with §PLAY-01-B/C (a clock that finally bites).
3. **Closing window / missable** — a Void bounty is live only inside its tide window; miss it and it is
   gone (echoing #21's *"Nobody collected"*).

## 3. Concepts added

| name | kind | where | purpose |
|---|---|---|---|
| `VOID_TIDE_FEATURED` | const map (tideDay → `{quest, standing, rumor}`) | beside `_boardReward` | the featured roster + per-quest standing bonus + dread hook |
| `VOID_FEATURED_IDS` | derived `Set` | beside the map | ids to **exclude from the normal rotation pool** (clock-gated, pin-only) |
| `quest_void_tide_21/35/42` | 3 UQF `combat` quests | QUEST_DB, before `quest_void_below` | the real, completable featured bounties |
| `_bountyPostable(q,node)` | pure predicate | factored out of `_boardBounties`' loop | shared legality gate (schema/type/distinct dest/not-started/activateCond/canActivate); **excludes** the FU7 reward-ceiling |
| `_voidFeatured(node)` | pure selector | beside `_boardBounties` | the active featured bounty object, or `null` |
| `_voidBonus(id)` | pure lookup | beside `_creditWarrant` | escalated standing for a Void bounty (else 1) |

**No new `S_story` field.** FU7's `warrantStanding`/`warrantAccepted` (`22488`/`22497`) already carry
the reputation state; the escalated bonus is derived from the const table at credit time.

## 4. The window model (closing / missable), and why it lives in `activateCond`

Each featured quest carries an `activateCond` window:

- `quest_void_tide_21` — `d >= 21 && d < 35`
- `quest_void_tide_35` — `d >= 35 && d < 42`
- `quest_void_tide_42` — `d >= 42`

Windows are **disjoint and continuous 21→49**. Putting the clock gate in `activateCond` (not in a bespoke
board branch) means **one** source of truth enforces it in **both** places that ask "is this quest available":
`storyCheckQuests`' arrival guard (`29361`) *and* `_bountyPostable`. Consequences that fall out for free:

- **Missable.** Once day crosses 35, `quest_void_tide_21`'s cond is false → not pinnable **and** not
  organically activatable → gone (unless already accepted — a taken bounty lives in `S_story.quests`
  and completes on its own schedule; taking it *is* beating the window).
- **Clock-tied, no pre-tide leak.** Excluded from the normal pool (`VOID_FEATURED_IDS`), a Void quest can
  never rotate onto the board before its tide — it appears **only** as the pin, **only** inside its window.
- **Consistent organic discovery.** A player who simply walks to VS during [21,35) still meets the Void
  Walker (arrival activates it) — it just doesn't accrue standing (untagged), exactly like FU7.

`_voidFeatured` therefore needs no day math of its own: it returns the single featured entry whose quest
is `_bountyPostable` (disjoint windows ⇒ at most one qualifies).

## 5. Reward / threat model (escalation, kept honest)

| tide | quest | node | DC | reward (xp) | Void standing |
|---|---|---|---|---|---|
| 21 | `quest_void_tide_21` — *The Uncollected Bounty* | VS (Visby Underground) | 13 | 150 | +2 |
| 35 | `quest_void_tide_35` — *The Thing at the Signal-Fire* | ECF (Coast North of Stiklestad) | 15 | 220 | +3 |
| 42 | `quest_void_tide_42` — *The Outriders at the Crossing* | RVP (Willow-Bank Crossing) | 17 | 320 | +4 |

- **Threat** climbs via the DC (13→15→17) and the fiction (a lone drifting Walker → a thing testing the
  signal-fire → an outrider that holds a crossing and will not yield).
- **Reward** climbs two honest ways: the quest's own `reward` xp bit (150→220→320 — read by the existing
  `_boardReward`/`_boardRewardXp`, never fake gold, per FU1) **and** an escalated **Warrant standing**
  bonus (+2/+3/+4 vs the ordinary +1) applied at `_creditWarrant`. Standing is host bookkeeping, not an
  economy change — the FU7-honest premium lever.

**Reconciliation with the FU7 reward-ceiling (a documented refinement of design-call #2).** The option
text mused that deep-tide rewards "top the FU7 ceiling so only high-standing players see them." Taken
literally with design-call #3 (missable), that would **double-lock** the climactic content: a low-standing
player at day 42 would be denied the day-42 bounty *and* it would then expire — unreachable forever, for
exactly the players who most need standing. Resolution: **the pin bypasses the reward-ceiling.** The
clock's bounty always shows when its window is live and the quest is completable. Escalation is delivered
by threat (DC) + the standing bonus, not by hiding the card. (The day-42 quest's 320 xp does exceed the
Unknown-tier cap of 250 — but because Void quests are excluded from the normal pool, that number never
pollutes the FU7 ceiling tests either.) *This is the one place FU8 refines the literal option text; flagged
for veto.*

## 6. Selection & render wiring

- `_boardBounties` (`35951`): (a) factor the loop's legality checks into `_bountyPostable`; (b) add one
  skip — `if (VOID_FEATURED_IDS.has(q.id)) continue;` — so Void quests never rotate normally; (c) after the
  distance-labelling loop, `const vf = _voidFeatured(node); if (vf) { …legs…; shown.unshift(vf); }`. The pin
  is an **extra** row (unshifted after the slice), always first. Pure/read-only throughout.
- Render (`33322`): branch the card on `b.void` — label `⚠️ VOID` (else `BOUNTY`), main `⚠️ ` prefix,
  a `· 🗡️+N standing` tail on the sub-line, button `Hunt it` (else `Take`). `hint` = the dread `rumor`.
- `_acceptBounty` is **unchanged** — a Void bounty is a real quest; the generic accept tags it Warrant work
  and sets the waypoint like any other.
- `_creditWarrant` (`35920`): `+ 1` → `+ _voidBonus(id)`.

## 7. Invariants (all load-bearing — CONTRIBUTING.md)

- **Free-Movement / Mission-Gating.** The pin gates *listing* only; the destination was always reachable.
- **No jump travel.** Accepting sets a waypoint, never moves the player (FU2 path, unchanged; test asserts).
- **`unlock` never activates out of sequence.** `_bountyPostable` still calls `canActivate` + `activateCond`.
- **No new game-state `Math.random()`.** The pin is a pure function of `S_story.day` + the const table.
- **Data-driven, no per-node `if`.** The pin is a node-flag path (`_boardHost`), same as every other section.
- **Pure selection.** `_boardBounties`/`_voidFeatured` mutate no `S_story` (purity test extended).

## 8. Test plan (`tests/integration/warrants-board.test.js`, additive)

1. **dormant before day 21** — at the default day (1) the pin never appears; `_voidFeatured` is `null`;
   the board's cards are all `BOUNTY` (guards every pre-FU8 test's assumptions).
2. **appears in-window, escalates** — set `S_story.day` to 21/35/42: the pinned bounty is the mapped quest,
   `void:true`, carries the mapped `rewardStr`/standing, is `canActivate`, at a real distinct node.
3. **closing window / missable** — at day 35 the day-21 quest is neither pinned nor `_bountyPostable`
   (organic arrival would refuse it too); at day 42 only `quest_void_tide_42` is live.
4. **excluded from the normal pool** — with a huge limit and day forced past every window, none of the three
   ids appears as a *normal* (non-`void`) card.
5. **escalated standing on completion** — accept a Void bounty (tags it), force a pass at the real onPass
   site (`_rollCeremonia` → `_resolveQuestUQF`), assert standing rose by the mapped bonus (+2/+3/+4), tag
   flipped to `credited`, idempotent.
6. **purity + no-move** — `_boardBounties` with a live tide mutates no `S_story`; crediting never moves.

## 9. Gates

`node --check` on the extracted inline script (0 errors); `warrants-board.test.js` full green (prior 18 +
FU8); regression `courier-map` 1/1 + `enemy-ai` 4/4 + `kg-quest-chain` 4/4. Diff = HTML additive + test
additive, **0 kernel sentinels** (`MOVER/ROOMS/DUEL:CORE` untouched), **no new movement-refusal**.
