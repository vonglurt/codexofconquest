<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §BOARD-01-FU7 *Warrant Standing*: reputation as a board-quality gate

**Parent:** BACKLOG.md §BOARD-01-FU7 (promotes `potential.md` §POT-H4 / §POT-C5 / §POT-P3 — the faction/reputation seed the game lacks) · **Builds on:** `lab-report-warrants-board.md` (the board), §BOARD-01-FU6 (the referral network this reputation rewards)
**Date:** 2026-07-21 · **Class:** design review before implementation (IEEE-format spec — locks data shapes + flow before any HTML edit) · **Measured against:** `roll2hit-v3.html` @ `4878c3c` (`ENGINE_VER = r2h-3.104.0`, 37,422 lines)
**Status:** LOCKED — both design calls MADE by the user (2026-07-21): standing gates **slate size + a reward-ceiling ("premium jobs")**; only **board-accepted** completions accrue. §7 is a mechanical transliteration of these; the tier ladder in §5 is tunable numbers, verified non-empty by the §9 test.

> **What this report is.** The §BOARD-01-FU7-0 gate. It fixes the two new `S_story` fields, the tier table, the accrual hook (which sits at **both** completion sites), and the two board-selection gates standing controls — so the implementation is pure transliteration. Every line number was grepped from the live file this session, not recalled (`project_data01_reverted`: **grep before building**).

## 1. The say/do gap (verified in code)

FU6 made the board a **network** — three referral chains (the Mathematician's Road, Rennau's Harrow, the cross-region 1367 Chronicle) — and its prose already promises reputation. The 1367 Chronicle's referral lines gesture at *the Warrant vouching for you*; `VOID_TIDE_EVENTS` #21 (`21803`) narrates the Warrant putting out bounties as an institution with standing. **But nothing accrues.** Grepped proofs:

1. **No faction/standing scalar exists.** `grep -c "warrantStanding\|warrantAccepted\|reputation\|standing" roll2hit-v3.html` over `_S_DEFAULTS` (`22478`) → **0**. The only relationship state is `npcFavorability` (`22501`, per-*NPC*, not per-*faction*) and `pitPerks`/`ngPlusRun` — none is a faction reputation.
2. **Every board bounty is equal forever.** `_boardBounties` (`35897`) posts a fixed slate of **4** with an unconditional candidate pool — a level-1 stranger and a veteran who has cleared 30 Warrant jobs see the identical board. Completing bounties (the whole FU6 loop) changes **nothing** about the board. There is no progression surface anywhere the player earns *access*, only XP.
3. **The reward mechanism FU6 built has no earner.** FU6 gave the board *outputs* (referrals). The board still has no notion of the player having *earned* anything from it — the referral says "the Warrant vouches for you" but no state ever records that it should.

**Theme (sibling of §BOARD-01's Curse-of-Knowledge, matched to `story.md`):** the board hands out work and remembers none of it. FU7 gives the Crimson Warrant a memory — you earn its trust by doing its work, and trust widens what it will show you.

## 2. Method — measure → reuse → widen, never invent

1. **One scalar + one tag, no new opcode.** Accrual is a host-level credit (`_creditWarrant`) called from the two places a quest already finishes — **not** a new VM opcode, because standing is host bookkeeping, not a quest effect. (Contrast FU6, which *was* a quest effect and correctly used `unlock`.) The board *reads* standing in its existing pure selector; it never needs the grammar to *carry* it.
2. **Reuse the two completion sites verbatim.** A board bounty finishes at exactly one of two grepped points depending on type — the FU6 onComplete/onPass split, now on the earning side (§3). The hook is a one-line call at each, guarded and idempotent.
3. **Gate QUALITY, never a step (Free-Movement / the FU7 invariant).** Standing changes only *which* bounties list and *how many* — the pure read-only selection surface (`_boardBounties`). It never gates a move, a node, or a quest step; every destination stays reachable on foot at standing 0. The economy is untouched: rewards are the quests' own; standing changes visibility, not payout (this is why the user's "reward multiplier" option was declined — it would move the economy, not the listing).
4. **Determinism preserved.** Standing feeds `limit` and a numeric ceiling into the *existing* FNV-1a-seeded selection; it introduces no `Math.random` and stays replayable per `(node, gameDay, standing)`.
5. **State in one place (§STATE-INIT).** The two new fields go only in `_S_DEFAULTS()` (`22478`), the single source of truth — so a fresh game, a load-merge (`23155`/`23171`), and a checkpoint reset (`23263`) all get them for free.

## 3. Concepts added

| # | Concept | What it is | Extends / reuses | New? |
|---|---------|------------|------------------|------|
| C1 | **`S_story.warrantStanding`** | integer count of completed board-accepted bounties | new faction scalar (cf. per-NPC `npcFavorability`) | new state field |
| C2 | **`S_story.warrantAccepted{}`** | `id → true` set on accept; flipped to `'credited'` on payout | mirrors `effortXpQuests{}` guard-map idiom (`6841`) | new state field |
| C3 | **`WARRANT_TIERS` + `_warrantTier(n)`** | ordered rank table → `{name, slate, rewardCap}` for a standing | pure lookup, like the `_flav`/`WARRANT_RUMOR_TPL` tables | new const + pure fn |
| C4 | **`_creditWarrant(id)`** | idempotent host credit called from both completion sites; returns a tier-up line or `''` | the two existing completion points (`29408`, `6829`) | new host fn |
| C5 | **`_boardRewardXp(q)`** | numeric reward (mirrors `_boardReward`'s string scan) for the ceiling gate | `_boardReward` (`35860`) — same pools, returns the number | new pure fn |
| C6 | **Standing-gated selection** | `_boardBounties` reads tier → slate size + reward ceiling | the existing pure selector (`35897`) — two new lines | extends C4 of the board report |

**Not added (deliberately):** no new opcode, no new gate term, no `Math.random`, no movement/entry gate, no economy change (reward values untouched), no jump-travel. The board stays a pure read-only listing surface; only the *inputs* to the listing widened.

## 4. Design decisions (the §BOARD-01-FU7-0 calls — MADE by the user)

**Call 1 — What does rising standing unlock? → BIGGER SLATE + PREMIUM JOBS.**
Each tier (a) grows the slate 4→7 and (b) lifts a **reward-ceiling** so the Warrant's high-value bounties surface only once you've earned its trust — the mechanical form of the 1367 Chronicle's *"the Warrant vouches for you."* Both are pure listing/quality gates over the **existing** candidate pool: no new content, no economy change. *(Declined: "eligible types" — 0 combat/hunt/… quests exist today so it has no live effect; "reward multiplier" — it moves the economy, breaking the FU7 invariant.)*

**Call 2 — What counts toward standing? → ONLY BOARD-ACCEPTED BOUNTIES.**
Standing accrues only for quests taken *through the board* (`warrantAccepted[id]`, set in `_acceptBounty`). Organic geographic discovery never counts — you earn the Warrant's trust by doing **its** work. This makes the board a genuine accept→complete→rank-up loop and keeps the faction identity tight.

**Secondary calls (locked, tunable):** the reward-ceiling is on **xp** (the only reward `_boardReward` honestly surfaces — gold is dead/display-only per the FU1 note); tier-0 ceiling is set generously so a newcomer's board is never emptied (verified by §9); the header shows the current rank + count for progression legibility.

## 5. Data shapes (locked)

```js
// _S_DEFAULTS() additions (22478) — the ONLY place these are seeded (§STATE-INIT).
warrantStanding: 0,     // C1 — completed board-accepted bounties
warrantAccepted: {},    // C2 — id → true (live) | 'credited' (paid out; idempotency sentinel)

// Ordered ascending; _warrantTier() returns the highest tier whose `min` is met.
// slate = cards shown; rewardCap = max reward-xp a bounty may carry to be postable
// (Infinity ⇒ everything; a const table, never serialized, so Infinity is safe).
const WARRANT_TIERS = [
  { min: 0,  name: 'Unknown',       slate: 4, rewardCap: 250 },
  { min: 3,  name: 'Marked',        slate: 5, rewardCap: 350 },
  { min: 7,  name: 'Trusted',       slate: 6, rewardCap: 500 },
  { min: 12, name: 'Sworn',         slate: 6, rewardCap: Infinity },
  { min: 20, name: "Warrant's Own", slate: 7, rewardCap: Infinity },
];
```

## 6. Invariant compliance (each checked against CONTRIBUTING.md + the FU7 invariant)

- **Gates listing/quality only, never a step.** Standing feeds only `_boardBounties` (`limit` + a candidate filter). No quest/flag/bit refuses a move; every destination is reachable on foot at standing 0. The reward-ceiling only ever *hides high-reward* bounties — the destination was reachable and stays reachable. ✔
- **No jump travel.** Nothing here moves the player. `_creditWarrant` mutates only two `S_story` fields; `currentCode`/`playerR`/`playerC` are untouched (asserted in §9). ✔
- **Economy untouched.** Reward values are the quests' own; standing changes *which* bounties list, never *what they pay*. ✔
- **No new game-state `Math.random`.** Selection remains FNV-1a-seeded; standing is a deterministic input. ✔
- **Host/Script Separation.** Standing is host bookkeeping, credited at the two host completion points — no new opcode, no control flow in a leaf handler. Accrual is idempotent (the `'credited'` sentinel) so a re-run of either completion site cannot double-credit. ✔
- **§STATE-INIT single-source-of-truth.** Both fields live only in `_S_DEFAULTS()`; fresh game, load-merge, and checkpoint reset inherit them. ✔
- **DUEL:CORE / MOVER:CORE / ROOMS:CORE untouched.** Render + top-level fns + two one-line credit calls; no kernel entry. Asserted by git-diff in the gate. ✔

## 7. Implementation surface (exact anchors — the increment is transliteration of this)

**(a) State** — two fields into `_S_DEFAULTS()` (after `waypoint`/`customQuestTerrain`, `22496`):
```js
warrantStanding: 0, warrantAccepted: {},   // §BOARD-01-FU7 — Warrant reputation
```

**(b) Tier table + helpers** — top-level, beside `_boardReward` (`35860`):
```js
const WARRANT_TIERS = [ /* §5 */ ];
function _warrantTier(standing){ let t = WARRANT_TIERS[0]; const s = standing||0;
  for (const w of WARRANT_TIERS) if (s >= w.min) t = w; return t; }
function _boardRewardXp(q){                       // numeric twin of _boardReward's xp scan
  const pools = [q.bits, Array.isArray(q.onComplete)?q.onComplete:null];
  for (const b of (q.bits||[])) if (b && Array.isArray(b.onPass)) pools.push(b.onPass);
  const r = pools.filter(Array.isArray).flat().find(b => b && b.kind==='reward');
  if (r && r.xp) return r.xp;
  if (q.type==='side' && q.xpAward) return q.xpAward;
  return 0;
}
function _creditWarrant(id){                       // called from BOTH completion sites
  const wa = S_story.warrantAccepted;
  if (!wa || wa[id] !== true) return '';           // untagged (organic) or already credited
  wa[id] = 'credited';                             // idempotency sentinel — never twice
  const before = _warrantTier(S_story.warrantStanding).name;
  S_story.warrantStanding = (S_story.warrantStanding||0) + 1;
  const after = _warrantTier(S_story.warrantStanding);
  return after.name !== before
    ? '🗡️ The Crimson Warrant marks your name. Standing: ' + after.name + '.' : '';
}
```

**(c) Selection gate** — inside `_boardBounties` (`35897`): read the tier, apply the ceiling in the candidate loop, drive slate size from the tier when no explicit `limit`:
```js
const tier = _warrantTier(S_story.warrantStanding);            // near the top, after `day`
// …inside the for-loop, after `if (!dest) continue;`:
if (_boardRewardXp(q) > tier.rewardCap) continue;             // premium gate — reserved for higher standing
// …the slice:
const shown = out.slice(0, limit || tier.slate);              // was: limit || 4
```

**(d) Accept tag** — in `_acceptBounty` (`35938`), right after the `unlock` execBits:
```js
(S_story.warrantAccepted = S_story.warrantAccepted || {})[id] = true;   // §BOARD-01-FU7
```

**(e) Credit hooks** — one line at each completion site:
- `storyCheckQuests` side/craft path (after the xpAward grant, `29408`):
  ```js
  { const _wp = _creditWarrant(id); if (_wp) msgs.push(_wp); }          // §BOARD-01-FU7
  ```
- `_resolveQuestUQF` PASS branch (after `execBits(sc.onPass…)`, `29829`→`6829`):
  ```js
  { const _wp = _creditWarrant(questId); if (_wp) _passMsgs.push(_wp); } // §BOARD-01-FU7
  ```

**(f) Header** — in the render block (`33310`), show the rank:
```js
const _t = _warrantTier(S_story.warrantStanding);
const { sec, body } = _mkSection('story-board-section', '📜',
  "The Warrant's Board — " + _t.name + ' (' + (S_story.warrantStanding||0) + ')');
```

## 8. UI as gameplay experience

At standing 0 the board reads **📜 The Warrant's Board — Unknown (0)** and posts four modest jobs; the Warrant's richest bounties are simply not there. Complete a few and the header ticks — **Marked (3)**, then **Trusted (7)** — the slate widens, and postings you never saw before appear: *the Warrant's best work, now that it trusts you.* At **Warrant's Own** the ceiling is gone and the full seven-card slate is premium-eligible. Nothing about the map changed; every node was always walkable. What changed is that the faction that runs the board now knows your name — the reputation the 1367 Chronicle's referrals were already narrating, finally modeled. The accrual toast (*"The Crimson Warrant marks your name. Standing: Trusted."*) fires exactly on a rank-up, riding the same completion message the quest already prints.

## 9. Test plan (`tests/integration/warrants-board.test.js`, appended)

- **Accrual — `_creditWarrant` (C4):** untagged id → `''`, no bump; a `warrantAccepted[id]===true` id → `standing+1` and tag flips to `'credited'`; a second call → `''`, no further bump (idempotent). A rank-up boundary (crossing `min`) returns the announcement; a within-tier credit returns `''`.
- **Accept tags (C2):** `_acceptBounty(id)` sets `warrantAccepted[id]===true`.
- **Integration at the real onPass site:** accept a board skill_check bounty, force a PASS via `_rollCeremonia` (dc=−100, the FU6 idiom), assert `warrantStanding===1` and the tag is `'credited'` — proving the hook fires at `_resolveQuestUQF`, not just in a unit.
- **Tier gates slate SIZE:** `_boardBounties(node)` (no explicit limit) returns `tier.slate` cards — length grows as `warrantStanding` climbs 0→20 (4 → up to 7), never exceeding the tier slate.
- **Tier gates reward CEILING (premium):** over a wide candidate pull, the max `_boardRewardXp` present at standing 0 is `≤` tier-0 `rewardCap`; at `Warrant's Own` a bounty with reward `>` tier-0 cap is postable. **Non-empty guard:** the tier-0 board at TLL still has `>0` cards (the ceiling never starves a newcomer).
- **Invariant:** `_creditWarrant` changes no position field (`currentCode`/`playerR`/`playerC` deep-equal before/after) — gates quality, never a step.
- **Regression:** all 13 existing board tests stay green (the ceiling changes *which* cards show, never their legality/determinism/purity); `courier-map` / `enemy-ai` remain green; `node --check` on the extracted inline script is clean; git-diff shows no kernel-sentinel change.

## 10. Increment mapping

- **§BOARD-01-FU7-0** — this report. ✅ locked (both calls made).
- **§BOARD-01-FU7** — §7 (a)–(f) + the §9 tests. Gate: parse clean · new accrual/tier/ceiling/invariant tests · all 13 prior board tests green · regression · kernel diff.
- **§BOARD-01-FU7-FU (future, optional):** authored premium-bounty flags (a `premium:true` opt-in beyond the reward-xp heuristic); a standing decay/betrayal axis; fold standing into the FU6 referral prose so the vouch line is literally conditioned on rank.

*© 2026 Paul Richeson — MIT License.*
