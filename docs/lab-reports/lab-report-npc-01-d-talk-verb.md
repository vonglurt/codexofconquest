<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §NPC-01-D: A Talk Verb to Make Favor Reachable at Scale

**Original:** 2026-07-23 · design-lock, pre-implementation · subject `play.html` @ `4acafa0` (37,913 lines)
**Verified & rewritten:** 2026-08-21 (§DOC-02ck) against HEAD (38,712 lines) — 152 → 174 lines: the code
blocks came out, the measurements went in. The only §DOC-02 rewrite so far that grew, because the original
was already lean and had never been checked against the build it shipped from.
**Class:** design-lock. Implemented **12 minutes later** (`df990c3`, 20:01), closed out at `a824969` (20:03).

---

## Abstract

Two hundred NPCs had a line about what they were up against, and no player could ever hear it. This report
locked the smallest mechanic that opens them: a **Talk** button on the relationship card raising favor to
**Friendly and no further**, so the ⚔ *enemy* footer becomes earnable while the ✦ *worldTruth* footer stays
behind a real deed.

**It is the most accurate document in the §DOC-02 corpus, and it is wrong about the one thing its surface
argument rests on.** All **12 cited line numbers are byte-exact** against its own build, all four locked data
shapes shipped under their specified names, and its prescribed acceptance suite is **green at 22/22** today.
But §2 declares the NPC card *"currently carries no interactive controls"* — and that card had carried a
`<button>` with a click listener since the earliest surviving commit. The implementation found it anyway: the
shipped Talk chip copies that button style string **verbatim**, down to a border colour the spec never named.
*A design doc that cannot see the control already on the screen still ships, because the code reads the
screen.*

---

## I. Method

Line numbers were scored against the **parent build**: `4acafa0` is docs-only, so
`git show 4acafa0:play.html` is byte-identical to the file the author read. Counts were re-derived
with the real parser (`src/js/wbapi-core.js`), never a line regex. Reach and render were **executed in a browser
at HEAD**, because reading source cannot tell a painted branch from an unreached one.

| Instrument | Result |
|---|---|
| Cited line numbers vs parent build | **12 / 12 byte-exact** |
| Named symbols resolving at HEAD | **24 / 24** |
| Census figures vs real parser | **1 of 6 wrong** — and wrong on its own build |
| Locked data shapes shipped under their specified name | **4 / 4** |
| Report drift since ship | **0 bytes in 29 days** |
| Acceptance `src/tests/integration/npc-card-map.test.js` | **22 / 22 green** (16 at ship; §NPC-01-SF4 added 6) |

---

## II. Intent, and what it buys the player

The inspiration is the oldest social mechanic in tabletop play: **you learn what someone fears by coming
back.** §NPC-01-C built the payoff as a two-tier card reveal — Friendly shows their *enemy*, Dear Friend
their *worldTruth* — and §NPC-01-A/B/SF2/SF5/SF6 then multiplied the cards from ~20 to 204 without
multiplying the way to earn either tier. The content existed; the verb did not.

- **Patient, not transactional.** `TALK_TO_FRIENDLY = 3@23535` talks on distinct `S_story.day` values reach
  Friendly, and no day is *spent* — the cost is the days that pass while you travel and rest near someone.
  The ⚔ footer then reads as what it is: they opened up because you kept coming back.
- **It refuses to sell the whole ladder.** `_talkToNpc@23536` calls `_setNpcFavor@23495` at level **1** and
  never higher, so talk can never buy the ✦ line. The game keeps something that cannot be ground for.
- **It scales to the world, not to Birka.** Measured live at HEAD: **203 of the 204** NPCs in the derived
  render map get a Talk button. Before it, favor was authored for **13**. Second-order effects measured
  benign at ship: `favorMin` side quests become listable by befriending (mission gating, never movement
  gating), and talk-friends count toward `_lubeckFriends@23493`.

---

## III. The finding, re-measured against its own build

| Claim in §1 | Measured at `4acafa0` | Verdict |
|---|---|---|
| `kind:'favor'` bits in the whole quest corpus = 16 | **16** | ✅ exact |
| distinct NPCs those bits reach = 13 | **13** | ✅ exact |
| `dearFriendBits` auto-upgrade for ~6 NPCs | **6 when written; 5 since §DX-02gl** (`const DEAR_FRIEND_BITS = {@23497`) — auros's act never granted the step, because `quest_void_below` sets his favor to 2 absolutely | ✅ exact when written |
| `meta.enemy` declared by **202** NPCs | **202** of 213 dialogue entries | ✅ exact |
| `meta.worldTruth` declared by **219** NPCs | **213** | ❌ **wrong when written** |
| `onTalk` / `talkVerb` / `giftNpc` / `downtimeVerb` = 0 | **0** at both builds | ✅ exact |
| doom clock runs `S_story.day` 1 → 49 | `DAY_DEADLINE = 49@36356` | ✅ exact |

**The one bad number hides a better fact.** `NPC_DIALOGUES` holds 213 entries and **all 213** declare
`worldTruth` — universal, not merely common. The report invented six NPCs rather than noticing that the ✦
line is the one piece of characterisation every dialogue entry in the file carries. Its prose is likewise
approximate where it could have been exact: *"~203 card-bearing NPCs"* against **204 profiles / 213
dialogues**, *"~190 stuck at Impartial"* against **191**. Both tildes land; neither was measured.

---

## IV. As-built inventory — every locked shape, at HEAD

All four locked shapes shipped under their specified names and are byte-live today: `npcTalk: {}@23120` in
the defaults factory, the tunable `TALK_TO_FRIENDLY = 3@23535`, the handler `_talkToNpc@23536`, and the chip
`tb.className@23825` — gated on fav < 1 so it retires at Friendly, wired by `tb.addEventListener@23828`
rather than an inline onclick exactly as §3 required. The ceiling holds: `function _setNpcFavor@23505` is
called at level 1 and never higher, so `dlg.meta.enemy@23792` became earnable while `dlg.meta.worldTruth@23799`
did not move. The report was also right about the surface it *rejected*: the d-pad 🧙 is gated on the node-keyed
`const NPC_DIALOGUE = {@22473` (singular) routing to `function storyShowNpc@30385` — a far smaller map than
the npcKey-keyed cards in `function _renderNpcCard@23718`. §DX-02cv has since measured that map's cost.

---

## V. Spec → shipped delta table

| # | Locked | Shipped | Note |
|---|---|---|---|
| 1 | Escalating talk lines from `dlg.impartial[]` in order by `count` | **NOT SHIPPED** | every talk prints the same *warms to you a little (n/3)* line — Appendix A |
| 2 | `storyRender();` inside the handler | moved to the click site, with an argument | the spec form **threw** on the `node.act` read; the end-to-end test caught it pre-commit |
| 3 | Chip below the quote, **above** the footers | appended **below** them | moot: the chip needs fav < 1 and the footers fav ≥ 1, so they never co-render |
| 4 | Chip border `#8B4A2A` | `#7c4a1a` | the spec took the colour from the **card** border (`card.style.cssText@23759`); the code copied the Yael escort button |
| 5 | Constant sited "~23144, near the favor helpers" | sited beside the handler | improved; both are outside every fence |
| 6 | Verify item 5 — a `connie_tuna` un-gating guard | not added | non-risk; Appendix A |
| 7 | Verify items 1–4 | all four, plus a live-click end-to-end test | that extra test is what found delta 2 |

**Two process notes.** §6 says the cadence model must go to the user and *"do NOT default"* — while the
handler printed in §3 already encodes model (B) in full. And the report letters its cost models
**(A)/(B)/(C)** while the BACKLOG row letters its approaches **(a)/(b)/(c)**, so the ship record must read
*"approach (a) + cost model (B)"* to mean anything. *Option letters minted twice in one increment are option
letters for nothing* — the §DOC-02e node-code lesson, in a report that never touches a node code.

---

## VI. Invariant analysis — re-verified mechanically

**Free-Movement (#1) ✅** — `_talkToNpc@23536` makes no mover call and refuses no step; talking is not
movement. **Parity fences (#5) ✅** — the four `:CORE` blocks span 9914–9961, 9985–10217, 10238–10390 and
`QUEST:CORE:START@21988`–22334, and every symbol this increment touched sits above 22400; no `src/js/*.js` twin.
**Host/Script separation (#4) ✅** — no new bit kind, no `_legacy_fn`, no `QUEST_DB` opcode. **Seeded RNG (#6)
✅, but vacuously** — the clearance reasons *"lines are read in order by `count`, so no RNG"*; those lines
were never built, so the conclusion is right and its stated reason describes absent code.

One §3 argument did **not** survive contact. The report refuses to reuse `npcVisitCounts` because *"looking
at a card would raise favor"* — and the separate map does hold for favor. But `_talkToNpc@23536` opens by
calling `function _getNPCDialogue@23582`, which bumps `npcVisitCounts` as a side effect **including on both
early-return paths**: the passive counter it was protecting is advanced by the deliberate act, and by clicks
that do nothing at all. Filed as §DX-02dq.

---

## VII. Defects filed

- **§DX-02dq — the Talk verb advances the passive-visit counter it was designed not to touch.** 🟢 no design
  call. `function _checkFrobergerTrace@27789` gates six one-time memory texts on
  `const visits = (S_story.npcVisitCounts@27795` against `const FROBERGER_TRACES = {@27826`, so Talk clicks
  accelerate content meant to reward genuine revisits, and an already-Friendly NPC can be clicked forever for
  free increments. Two-line fix: hoist the favor and same-day guards above the `_getNPCDialogue` call.
- **§AUDIT-03bo — one NPC has a name, a node, an occupation and two quests, and renders nothing.**
  `watcher_gvw: { key@23021` is The Greenwood Watcher, quest-giver for `clr_01_act3@21964` and `clr_01_act4`,
  listed in the derived render map at `GVW`, with **no `NPC_DIALOGUES` entry** — so `function
  _renderNpcCard@23683` early-returns and the card is empty. **Verified in a browser: 203 of 204 derived NPCs
  render and get a Talk button; this one does neither.** §NPC-01-SF2 fixed the mirror case (dialogue without
  profile); this one has stayed open. Fix is one short dialogue entry with a `meta`.
- **Verified benign, recorded so it is not re-found:** `let S_story = {@23030` omits `npcTalk` while
  `const _S_DEFAULTS = () => ({@23092` declares it (both call sites guard), and
  the Dear-Friend act table was duplicated verbatim between `function _setNpcFavor@23505` and
  `function _checkDearFriendUpgrade@23516` until §DX-02gb hoisted it to one
  `const DEAR_FRIEND_BITS = {@23497`, which both now read.

---

## Appendix A — NOT SHIPPED, kept verbatim

Retained because a silently deleted claim reads as one that held.

> **§4, invariant #6:** *"Escalating talk lines are read from `dlg.impartial[]` **in order by `count`**
> (no RNG) — so nothing random touches game state."*

Never built. The three talks before Friendly are numerically distinguishable and narratively identical —
the one place this mechanic still feels like a counter rather than a conversation. The pools it names are
live and already ordered; feeding `dlg.impartial` into the progress message is the missing half of what the
report set out to buy: not just to *reach* Friendly, but to be told something on the way there.

> **§5, verify item 5:** *"Regression: a state-gated curated NPC (e.g. `connie_tuna` before `connieMet`) is
> unaffected — no un-gating (guards the SF6 invariant)."*

Not added under §NPC-01-D. The risk is real but structurally impossible here — Talk mutates favor, never the
key list `function _renderNpcCard@23718` is called with — and the §NPC-01-SF6 AMS gating tests in the same
file assert it directly.
