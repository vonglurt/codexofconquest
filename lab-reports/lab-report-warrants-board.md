<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->
# Lab Report — §BOARD-01 *The Warrant's Board*: rumor/bounty discovery

**Class:** design lock (IEEE-format spec written *before* implementation) · **Verified:** §DOC-02cv, 2026-08-22
**Original date:** 2026-07-21 · **Measured against:** `roll2hit-v3.html` @ `43bd09c` (`ENGINE_VER = r2h-3.104.0`, 37,271 lines) — *all three figures re-checked exact*
**Shipped:** `8dcca67` 2026-07-21 09:41, **the same commit that added this report** · **Pinned parent:** `8dcca67^` = `43bd09c`
**Parent seed:** `potential.md` §POT-H1 (prompts 11 · 31 · 35), with §POT-S1 "Bounty board" merged into it · **Track:** BACKLOG.md §BOARD-01
**Children (all eight extend this report):** FU1/FU2 `8b6327c` · FU3 `89133c4` · FU4/FU5 `8b12ed1` · FU6 `f7350b0`/`4878c3c`/`5a0cfdc`/`dbf62e0` · FU7 `e0051a8` (`lab-report-warrant-standing.md`) · FU8 `4af74b4` (`lab-report-void-tide-bounties.md`) · VOID-GATE `37f8ccb` · Inc C `0b7ba4a`

---

## Abstract

For 2,850 quests the game had exactly one way to tell a player that work existed: walk onto the
square where it lives. This report locks the design for the second way — a diegetic notice board run
by the Crimson Warrant, standing at the world's 38 rest nodes, posting hooks that point somewhere
else and pre-activating the mission through `unlock`, an opcode that had been written, contract-
validated, and never once called. The intention was never "add a quest log." It was to make the world
*speak first*, and to pay for it with a part the file already owned.

**Verification verdict (§DOC-02cv).** The cleanest anchor score the program has recorded to date:
**27 of 27 line references resolve to the construct they name, at offset zero** on the pinned parent —
including both *insertion points*, which §7 predicted to the line before the code existed.
The diff is **+90/−0 across two hunks**, exactly as claimed. All five ship-day test figures reproduce
on a rebuilt tree. `unlock` went **0 → 1 → 20 authors** in thirty-two days: the architectural bet paid.

**And §4 — the one section that makes a decision — measured the wrong population.** Every figure in
its type census is reproducible to the digit, because every figure came from a grep that could only
see half the corpus. The board-eligible pool at the pinned parent is **2,760 quests across six types**,
not the 249 across three that §4 reasons about; the four types it calls empty hold **164 quests**; the
item descriptors it was designed to keep out **are not QUEST_DB entries at all**. The counterexample
was not nearby. It was *on the line the report cites to prove the point*.

> *The Warrant learned to post work. It never learned to post work you could walk to before winter.*

---

## 1. The say/do gap — as stated, and as re-verified

Three grepped proofs opened the report. All three re-run on the pinned parent `43bd09c`:

| # | Claim as written | Re-measured at `43bd09c` | Verdict |
|---|---|---|---|
| 1 | `NODE_MAP.LHR.text` (8257) says *"Notices flutter on the board by the fountain"*; no board surface in 37,271 lines | quote is **verbatim on 8257**; `grep -icE "notice board\|job board\|bounty board"` → **0** | ✔ exact |
| 2 | The Crimson Warrant appears **10+ times**; `VOID_TIDE_EVENTS` #21 (21803) states the mechanic in past tense; `grep -c bounty` → **1** | `grep -c bounty` → **1**, and it *is* that line; 21803 carries the quoted sentence **verbatim**; but `Crimson Warrant` = **9 occurrences on 8 lines** | ⚠ see below |
| 3 | Discovery is 100% geographic; all **2,850** quests arrive via `activateNode` | **2,850** exact (real parser). But arrival skips `epic` by the report's own cited function | ⚠ 40 exceptions |

**Proof 2 is true of the institution and false of the phrase it bolds.** `Crimson Warrant` occurs
**9 times**, not 10+; count `Warrant` and it is **37 lines**. All six anchors resolve to a Warrant
line; only 26105 carries the literal phrase. ***State which you counted.***

**Proof 3 overshoots by 40.** `if (q.type === 'epic') return;` sits three lines below the guard the
report quotes, commented *"epic quests activate explicitly via modal/defeat"* — so epics already had
a non-geographic vector. The thesis holds (2,810 of 2,850 is still the whole world); the sentence
does not. Survives at HEAD as `q.type === 'epic' || !q.activateNode@37020`.

**The primitive was already built, and inert.** This is the part that held up perfectly:

- **`unlock` — contract-validated, ZERO authors.** Handler at 21778; contract at 21575 requiring a
  non-empty `quests`/`npcs` array. `grep -c "kind:'unlock'"` at the parent → **0** ✔ **exact**. It
  activates a quest *from anywhere* — literally "a rumor points you at a distant node."
- **No §VM-01 dependency.** `unlock` neither branches nor waits, so it ran on the straight-line
  `execBits` (21722) unchanged ✔ — the shipped diff adds no VM plumbing.
- **An ambient sibling already shipped.** `TOWN_CRIER_LINES` (26046) + `_getTownCrierLine` (26149)
  deliver flavour rumours on rest (35125). They point nowhere. The board is their *actionable* layer ✔.

**Theme.** The engine described a board it never let you read, and owned the opcode that would let it.
Sibling of §PLAY-01's Curse of Knowledge, and the same shape.

---

## 2. Method — measure → reuse → widen, never invent

1. **Measure the seam, don't design a new one.** Built entirely from parts already in the file: the
   dead `unlock` opcode (verb), `_mkSection`/`_mkCard` (surface), `QuestRuntime.canActivate` (gate),
   `_questNodes`-style QUEST_DB scanning (candidates), and the Warrant + Town-Crier fiction (register).
2. **Widen through the grammar (Host/Script Separation).** Acceptance routes through
   `QuestRuntime.execBits([{kind:'unlock',quests:[id]}],{})`, not a private `S_story` write. The board
   is a *consumer of the opcode table*. The payoff is **retiring a dead opcode by using it**.
3. **New surfaces go in the data-driven region (§VM-01-G).** A node-flag-gated `_mkSection` component
   modelled on `node.isFishingLake` (32965) — never a `node.code === 'XX'` special case.
4. **Determinism over `Math.random`.** FNV-1a over `(node.code, gameDay)`.
5. **Gate *listing*, never *movement*.** Nothing touches the mover, entry code, or any road.

**All five held.** Verified against the shipped diff — §6.

---

## 3. Concepts added

| # | Concept | Extends / reuses | Shipped as | Status at HEAD |
|---|---|---|---|---|
| C1 | remote quest activation as a player verb | the dead `unlock` opcode — **first live consumer** | `function _acceptBounty(id)@37227` | ✔ **20 `unlock` authors** |
| C2 | `NODE_MAP[code].board` opt-in host flag | `node.isFishingLake` (32965) | `function _boardHost(node)@37038` | ⚠ **0 authors, ever** |
| C3 | `QUEST_DB[id].rumor` one-line hook | falls back to synthesis; never to `hint` | `rumor: q.rumor \|\| null` in the selector | 0 at ship → **30 at HEAD** |
| C4 | postable-bounty predicate | `_questNodes()` scan + `canActivate` | `function _boardBounties(node, limit)@37183` | ✔ split out as `function _bountyPostable(q, node)@37149` |
| C5 | deterministic board rotation | the Town Crier's `gameDay % n` (26151) | `function _boardSeed(str)@37040` | ✔ unchanged |
| C6 | the board surface | `_mkSection`/`_mkCard` (32919/32932) | `story-board-section@35704` | ✔ unchanged |

**Not added (deliberately):** no new opcode, no new gate term, no new `S_story` execution field, no new
`Math.random` site, no movement gate, no jump travel. **All six abstentions verified against the diff**
— `Math.random(` appears **0** times in the added lines, and the only occurrences of the string are in
comments promising it is absent.

> ⚠ **C2 SHIPPED AS CODE AND HAS NEVER BEEN USED — at ship, and at HEAD thirty-two days later.**
> The only occurrence of `board:` anywhere in `roll2hit-v3.html` is the comment describing it. Every
> host is a host because `sleep === true`; the opt-in and the suppression have both been theoretical
> since the day they were written. **The report retired one zero-author seam by adding another** —
> and it is the same zero-author seam it opens by diagnosing in §1. *Latent capability is only a
> virtue when something eventually calls it. `unlock` waited and was rescued; `board:` is still waiting.*

---

## 4. Design decision — bounty eligibility (the §BOARD-01-0 call, MADE)

**Question:** which quest `type`s are postable — do main-line/story quests stay organic, or is
everything with a satisfied gate postable?

**Decision — an ALLOWLIST, not a denylist**, on the stated grounds that "a denylist over 40+ types
would leak item descriptors onto the board the first time a new type is added":

```js
BOUNTY_TYPES = { 'side', 'skill_check', 'craft',                        // "the live mission types (249 entries)"
                 'combat', 'hunt', 'delivery', 'escort', 'dialogue' }   // "0 today; future-proofed"
```

Shipped **byte-identical** as `const BOUNTY_TYPES@37036`, and byte-identical at HEAD.

> ⚠ **THE CENSUS THIS CALL RESTS ON MEASURED HALF THE CORPUS, AND EVERY NUMBER IN IT IS REPRODUCIBLE.**
> All **fourteen** of §4's counts are exactly `grep -o "type:'X'" | wc -l` over the whole file — 14 for
> 14, to the digit. That grep matches only the **single-quoted** spelling. The corpus carries two:
> `type:'skill_check',` (**106**) and `type:"skill_check",` (**2,378**). The imported half of QUEST_DB
> is double-quoted, and the author's instrument could not see it.
>
> | | §4 says | Real parser at `43bd09c` | |
> |---|---|---|---|
> | `skill_check` | 106 | **2,484** | 106 single + 2,378 double |
> | `side` | 131 | **142** | 131 + 11 |
> | `craft` | 12 | **0** | the 12 are `type:'craft'` on **inventory items**, not quests |
> | `combat` · `delivery` · `escort` · `dialogue` | **0, "future-proofed"** | **78 · 57 · 22 · 7** | **164 quests, live on day one** |
> | `hybrid` | *(never named)* | **13** | a real type **the allowlist excludes** |
> | `main` · `epic` | 7 · 40 | **7 · 40** | ✔ exact |
> | item descriptors (potion 18, weapon 9, misc 26, …) | *"`QUEST_DB` also stores"* them | **0 top-level entries** | nested `items:[…]` inside `reward` bits |
>
> **Board-eligible pool at the pinned parent: 2,760 quests across six types**, not 249 across three.

**Three consequences, and they do not run the same way.**

1. **The hazard did not exist.** The item descriptors are `{name, icon, sell, type, desc}` objects
   nested inside `reward` bits; `_boardBounties` iterates `Object.values(QUEST_DB)`, and a nested item
   is never a value of it. The shipped predicate's first guard is `q.schema !== 'UQF-1.0'` besides, and
   no item object has a schema. **A denylist would have leaked nothing.**
2. **The allowlist was right anyway, for a reason the report did not have.** By listing four types it
   believed empty it made **164 real quests postable from the first render**, which a three-type
   allowlist would have withheld. *Correct call, wrong reason, and the wrongness is what made it right.*
3. **`craft` is dead weight; `hybrid` is an unasked question.** `craft` has zero top-level entries at
   the parent and at HEAD; `hybrid` (13) is excluded and has never been named by this report or any of
   its eight children. → **§DX-02ej**.

> ⚠ **AND THE COUNTEREXAMPLE IS ON THE CITED LINE.** §4 dismisses the four types with *"the `_flav`
> map at 33178 is defensive for types that could exist but don't."* Line 33178 is
> `const _flav = ({ combat:@35579` — `combat: FIGHT · delivery: DELIVER · escort: ESCORT · dialogue:
> TALK` — a labelled button already built for each of the four, because the engine drew them every day
> for 164 quests. **Instrument 135, third consecutive sighting in this family**: §DOC-02cu found it 17
> lines above FU7's anchor; here it is *inside* the anchor. ***Absence is the one claim a citation
> cannot support — grep the line before you cite it as empty.***

**Secondary calls (locked, all verified).** Default host = **all 38 `sleep:true` nodes** ✔ **exactly 38
at the parent, at ship, and at HEAD**; slate size **4** ✔; synthesized rumour may fall back to a
generic Warrant line but **never to `hint`** (which states the DC outright — §POT-M2 honesty tension) ✔.

**Excluded on purpose:** `main` (main-line pacing stays organic — the board promises odd jobs, not
"skip to the finale"), `epic` (activates via modal/defeat), `misc`. All three abstentions shipped.

---

## 5. Data shapes (locked) — shipped verbatim

```js
// NODE_MAP entry — new optional field (C2). Absent ⇒ inherits default (sleep ⇒ board).
NODE_MAP.TLL = { …, sleep:true, board:true }      // explicit host      ← never authored
NODE_MAP.XX  = { …, sleep:true, board:false }     // explicit suppression ← never authored
// host(node) := node.board === true || (node.board !== false && node.sleep === true)

// QUEST_DB entry — new optional field (C3). Absent ⇒ synthesized rumor.
QUEST_DB.quest_x = { …, type:'side', activateNode:'VS', rumor:"The Warrant wants the Fence Quarter ledger read before the fence does." }

// The bounty view object the selector returns (transient, never persisted):
{ id, title, destCode, destShort, rumor, rewardStr }
```

The `host()` predicate shipped byte-identical (modulo a `!!` coercion) and is byte-identical at HEAD.
The view object shipped exactly as specified; FU5 later appended one field (`destTerrain`).

> ⚠ **`TLL` is the example and the first node the predicate selects — but §1's proof #1 is `LHR`, and
> `LHR` carries `sleep:false`.** The start node whose fountain notices open this document **hosts no
> board**, at ship or at HEAD. Measured in Chromium at both: `_boardHost('LHR')` → **false**;
> `storyRender(NODE_MAP.LHR)` → no `story-board-section`. The say/do gap that motivated the feature is
> still open **at the node used to prove it existed**, and one token of data closes it (`board:true`) —
> which is exactly what C2 was built for and has never been used for. → **§DX-02ej**.

---

## 6. Invariant compliance — re-verified against the shipped diff

| Invariant | Verdict |
|---|---|
| Free-Movement / Mission-Gating — gates *listing* only | ✔ two hunks, neither in mover/entry/road code |
| No jump travel | ✔ accept marks and lists; `checkpointNode` respawn remains the only warp |
| `unlock` never pre-activates out of sequence | ✔ **but only because of an edit §7 does not contain** — see §7 |
| No new game-state `Math.random` | ✔ **0** `Math.random(` in 90 added lines |
| Host/Script Separation | ✔ acceptance via `execBits`; no new opcode, no new term, no `_legacy_fn` |
| DUEL/MOVER/ROOMS:CORE untouched | ✔ **0** kernel sentinels in the added lines |

Six for six — the same clean sheet FU7 kept and FU8 broke (§DOC-02ct).

**Arrival safety, as claimed and as true.** `storyCheckQuests`'s `!S_story.quests[q.id]` guard (29360)
means a pre-accepted quest is never double-added, and its arrival narrative still fires. This is
asserted in §6, tested in §9, and **passes on the rebuilt ship-day tree**.

---

## 7. Implementation surface — spec → shipped delta

**Scope fence:** 7 files, **2 hunks in `roll2hit-v3.html`, +90/−0** — purely additive, exactly the
commit's claim. Both hunk headers name a function §7 named.

| §7 block | Specified | Shipped at `8dcca67` | Delta |
|---|---|---|---|
| `BOUNTY_TYPES` | 8-type `Set` | `const BOUNTY_TYPES@37036` | **byte-identical** |
| `_boardHost` | `return node && (…)` | `function _boardHost(node)@37038` | `!!node` coercion added |
| `_boardSeed` | `_boardSeed(code, day)`, builds `code+'\|'+day` inside | `function _boardSeed(str)@37040` | ⚠ **signature narrowed to one arg**; callers build the string; output identical |
| `_rewardStr(q)` | 8-line body | `function _boardReward(q)@37053` | ⚠ **renamed**; body byte-identical |
| `_boardBounties` — 6 guards | schema · type · distant `activateNode` · not started · dest exists · `canActivate` | all six present, reordered by one | **exact** |
| `_boardBounties` — sort + slice | `a._k - b._k \|\| (a.id<b.id?-1:1)`; `slice(0, limit \|\| 4)` | identical | **byte-identical** |
| `_acceptBounty` | 8-line body incl. `execBits` + toast + re-render | `function _acceptBounty(id)@37227` | `String()` coercion on the label; else identical |
| render block | after QUESTS (33293), before LOOT (33295) | inserted at **33295**, immediately above `// ── LOOT section` | **exact — the insertion point was predicted to the line** |
| render block — binding | `(function(id){ return () => _acceptBounty(id); })(b.id)` | `((id) => () => _acceptBounty(id))(b.id)` | arrow form; `bounties` → `_bounties` |
| — | *(not specified)* | **the `activateCond` guard** | ⚠ **an edit §7 does not contain** |
| — | *(not specified)* | `window._boardBounties = …; window._acceptBounty = …` | ⚠ **an edit §7 does not contain** |

> ⚠ **THE FIRST MISSING EDIT IS THE ONE §6 SILENTLY DEPENDS ON.** §6's third invariant —
> *"`unlock` never pre-activates out of sequence"* — is asserted ✔ **on the strength of §7's
> predicate**, which calls `canActivate` and nothing else. Arrival runs **two** gates: the legacy
> `q.activateCond()` closure first, then the declarative UQF gate. §7 specifies only the second. The
> implementer invented a seventh guard — `if (q.activateCond) { let ok; try { ok = q.activateCond(); }
> catch (e) { ok = false; } if (!ok) continue; }` — commented with the arrival lines **29361–29362**,
> which resolve exactly. At the pinned parent **14 board-eligible quests carry an `activateCond`**, so
> §7-as-written would have posted up to fourteen bounties arrival itself refuses. The guard survives
> verbatim at HEAD in `function _bountyPostable(q, node)@37149`. ***A predicate that must mirror
> another predicate is not specified until BOTH gates are named.***

> ⚠ **THE SECOND MISSING EDIT IS WHAT MAKES §9 RUNNABLE AT ALL.** §7's functions are plain declarations
> inside the inline `<script>`; §9's five behaviours all call them **from Playwright, in page context,
> from outside**. Nothing in §7 exports them. The ship added a line the lock does not contain —
> `if (typeof window !== 'undefined') { window._boardBounties = _boardBounties; window._acceptBounty = _acceptBounty; }`
> — without which every §9 test is a `ReferenceError`. Invisible from inside the report, because §9 was
> written as if the export already existed.

Both inventions are still in the file, unmodified, thirty-two days later. **Neither is a defect in the
ship; both are defects in the lock**, which bills §BOARD-01-A/B as *"pure mechanical transliteration of
§7."* ***A "pure transliteration" claim is falsified by any edit the implementer had to invent.***

---

## 8. UI as gameplay experience — measured in Chromium, not described

**What the feature adds to the game, in one sentence:** for the first time the world *initiates*.
Every other hook in 2,850 quests waits for you to step on it; the board walks up and offers you work,
and taking it is a *choice* rather than an accident of pathing. The `❗` on the map stops meaning
"something is here" and starts meaning *"you said yes to this."* That is the whole product, and it
shipped intact.

**Measured at the ship build `8dcca67` and again at HEAD, `TLL`, fresh game, day 0.** Both builds
agree on **every selection figure**, so the origin's selection core survived all eight follow-ups:

| | ship `8dcca67` | HEAD (+8 follow-ups) |
|---|---|---|
| nodes / hosts | 418 / **38** | 418 / **38** |
| candidate pool at `TLL`, day 0 | **1,081** | **1,081** |
| slate | 4 cards, deterministic across repeat calls | 4 cards, identical ids, identical order |
| day 0 → day 1 turnover | **3 of 4** | 3 of 4 |
| six hosts sampled, same day | **6 distinct slates** | 6 distinct slates |
| candidates carrying any reward string | **20 of 1,081 (1.9%)** | 20 of 1,081 |
| `LHR` hosts a board | **no** | **no** |

**What shipped and works.** Host gating, determinism, per-node variety and per-day rotation are all
exactly as §2/§5 promised, and the day counter is the real engine of variety — three of four cards
turn over overnight. Acceptance works: `📌 Bounty accepted: …`, the card drops, the mission is in the
journal, and it is the file's first live `unlock`.

**What §8 promised that day 0 did not deliver.** §8 describes a card carrying four things — title,
destination, **reward**, and **a one-line rumour in the Warrant's voice**. The day-0 `TLL` slate, at
ship and again at HEAD (same four quests, same order — only the telling changed):

```
ship 8dcca67                                              HEAD, +8 follow-ups
📜 Francesca's Book — Archive                              📜 Francesca's Book — Archive
   → Weimar Archive                                           → Weimar Archive · ~22 legs
   Posted by the Crimson Warrant.        [Take]                "The Crimson Warrant is hiring for Scholar's Quarter."
📜 The Gate's Three Steps — Palermo Convent                📜 The Gate's Three Steps — Palermo Convent
   → Palermo                                                  → Palermo · ~36 legs
📜 The Mast Agreement — Archive                            📜 The Mast Agreement — Archive
   → Weimar Archive                                           → Weimar Archive · ~22 legs
📜 Sarama's Truth — The Compassion Intelligence            📜 Sarama's Truth — …
   → Alexandria                                               → Alexandria · ~33 legs
📜 THE WARRANT'S BOARD                                     📜 The Warrant's Board — Unknown (0)
```

**Zero of four cards show a reward** (1.9% of the pool has one) and **zero show an authored rumour**
(`rumor` had **0** authors at ship — §3 says so plainly; §8 narrates it as present anyway). Two of the
four point at the same place. The Warrant's voice, four times, is one sentence.

**And the promise §8 could not have known it was breaking: the board has never posted a job you can
walk to.** §8's own walk-through picks `→ Visby Underground` — a neighbour. The predicate has **no
distance term**; it selects on legality and sorts on a hash. Swept over **thirty consecutive game
days at `TLL`, 120 postings**, using FU3's own `~N legs` label:

| min | median | mean | max | ≤ 5 legs | ≤ 10 legs | > 20 legs |
|---|---|---|---|---|---|---|
| **13** | **23** | **30.2** | **79** | **0** | **0** | **115 (96%)** |

The nearest job the Warrant has ever offered is **thirteen legs away**. This is not a bug in any line
of §7 — every guard is correct — it is a **population** error of the same family §DOC-02cu found in
FU7: *the predicate reasons about legality, the player experiences geography, and nothing in the lock
joins the two.* → **§DX-02ei**.

**Every visible change between those two columns is a follow-up closing a promise §8 made and §7
could not keep** — FU1 the reward preview, FU3 the `~N legs` label, FU4/FU5 the characterful
synthesized hook, FU7 the rank. The selection is byte-for-byte untouched; only the telling improved.
***The lock was right about the machine and optimistic about the card.***

**The durable product was the vector, not the board.** `unlock` had **0** authors at the parent, **1**
at ship — `_acceptBounty` itself — and **20** at HEAD, almost all §BOARD-01-FU6 referral-chain edges
where finishing one job posts the next. §2's bet — *retire a dead opcode by using it, not by deleting
it* — is the most vindicated claim in the document. **The board was the excuse; the opcode was the point.**

---

## 9. Test plan — as specified, as shipped, as re-run

Seven §9 bullets shipped as **five test bodies plus two manual gates**:

| §9 bullet | Shipped |
|---|---|
| determinism (C5) | `warrants-board.test.js:10` (fused with host gating, which §9 did not specify) |
| predicate legality (C4) | `warrants-board.test.js:32` |
| purity (A) | `warrants-board.test.js:66` |
| acceptance / first `unlock` / no double-add (B) | `warrants-board.test.js:79` |
| free-movement regression greps | manual — **verified: the diff adds no gate** |
| kernel sentinel diff | manual — **verified: 0 sentinels in 90 added lines** |
| — | `warrants-board.test.js:111` — **DOM render, which §9 never specified** |

**Re-run on a rebuilt ship-day tree** (`git archive 8dcca67` + the tree's own `node_modules`,
instrument 150):

- `warrants-board.test.js` — **5 passed**, exactly the ship commit's *"5/5"*. ✔
- `courier-map.smoke.test.js` **1/1** ✔ · `enemy-ai.test.js` **4/4** ✔ — both regression figures exact.
- ⚠ `quest-runtime-uqf.test.js` — the commit's *"15 pre-existing failures in this environment (proven
  identical with this change stashed)"* **does not reproduce**: **288 passed, 0 failed** on the
  rebuilt tree. The repo diagnosed it **1 d 9 h 17 min later** — `bd951d7` (§DX-01b), *"retire the
  quest-runtime-uqf 'env baseline' — it was 17 stale tests, not server clobber."* The ship commit's
  only red figure is the one that was never real, and the author was right to fence it off.

**`check:walk` ran six gates that day**, not the sixteen it runs now — the same count §DOC-02cu
measured for FU7 three hours later.

> **The DOM test is the one that could have caught §5's finding, and it was aimed one node away.**
> `warrants-board.test.js:111` asserts *"board renders as a section at a rest node."* It passes,
> correctly, at a rest node. `LHR` is not one — and `LHR` is the node §1 opens with.

---

## 10. Increment mapping

- **§BOARD-01-0** — this report. ✅ locked, the call made.
- **§BOARD-01-A** — §7's selector + render block. ✅ shipped `8dcca67`.
- **§BOARD-01-B** — `_acceptBounty` wired to "Take"; the file's first live `unlock`. ✅ shipped `8dcca67`
  (A and B landed in one commit, not two as §10 anticipates).
- **§BOARD-01-C** — authored `rumor:` strings. ✅ shipped `0b7ba4a` — **25 on the FU6 referral-network
  anchors**, not a general trickle. Coverage at HEAD is 30 of 2,760 board-eligible quests (1.1%).
- **§BOARD-01-D** — `unlock` as an `onComplete` reward bit (geography-jumping chains); codex/downtime
  merge (§POT-S4/M1). ✅ **the first half shipped as §BOARD-01-FU6** — 19 of the 20 `unlock` authors at
  HEAD are exactly this. The codex/downtime merge is **NOT SHIPPED**.
- **FU1–FU8 + VOID-GATE** — all eight extend this lock; see the header. Two carry their own reports
  (`lab-report-warrant-standing.md`, `lab-report-void-tide-bounties.md`).

---

## 11. Verification appendix (§DOC-02cv)

**Anchors — 27 distinct line references, 36 citations, scored against the pinned parent `43bd09c`.
All 27 resolve to the construct they name, at offset zero.** Code and table citations:
`unlock` handler 21778 · its contract 21575 · `canActivate` 21617 · `execBits` 21722 ·
`storyCheckQuests` 29355 and its guard 29360 · `_mkSection` 32919 · `_mkCard` 32932 ·
`node.isFishingLake` 32965 · `_flav` 33178 · the QUESTS close 33293 · the LOOT header 33295 ·
`_questNodes` 35801 · `_mapIcon` 35811 · `TOWN_CRIER_LINES` 26046 · `_getTownCrierLine` 26149 ·
its `% 2` rotation 26151 · the section-render header 32918. Prose citations: `LHR.text` 8257 and
`VOID_TIDE_EVENTS` #21 21803 both carry their **quoted sentence verbatim on the cited line**; the six
Warrant references (8513 · 11071 · 13191 · 26105 · 26113 · 31495) each resolve to a Warrant line; the
Town-Crier emit 35125 names the block whose `storyMsg` sits two lines in.

**27/27, against §DOC-02cs's 18/21 and §DOC-02cu's 14/15** — and clean on the hardest case: **both
insertion points were predicted to the line before the code existed** (33295, above LOOT; beside
`_questNodes` at 35801). *A lock grepped on the build it names, rather than recalled, looks like this.*

**⚠ INSTRUMENT 161 — A COUNT IS ONLY AS WIDE AS ITS QUOTING CONVENTION.** §4's fourteen figures are
each *exactly* `grep -o "type:'X'"` over `43bd09c` — reproducible to the digit seven months later, and
wrong about the world by an order of magnitude, because QUEST_DB is written in two spellings and the
grep knew one. `skill_check` is 106 single-quoted **and 2,378 double-quoted**. ***When a corpus has
been machine-imported, a hand-written grep measures the hand-written half. Use the parser the repo
already ships (`js/wbapi-core.js`) for any figure a decision rests on.***

**⚠ INSTRUMENT 162 — A SPEC WHOSE TEST PLAN REACHES IN FROM OUTSIDE IS INCOMPLETE UNTIL IT NAMES THE
EXPORT.** §9's behaviours call §7's functions from page context; §7 declares five and exports none.
With §7's invented `activateCond` guard, **the "pure mechanical transliteration" §10 promises required
two inventions** — one to keep §6's invariant, one to make §9 runnable — and both are still at HEAD.

**⚠ INSTRUMENT 160, CONFIRMED FROM THE PARENT SIDE.** §DOC-02cu found FU7 citing `VOID_TIDE_EVENTS`
#21 at **21803**, where 21803 points at a closing brace on FU7's parent. It is exact here, on *this*
report's parent, with the sentence verbatim — because this is where the number was measured. FU7
inherited a correct measurement across a build boundary and it decayed into a wrong one. ***The
instrument cuts both ways: a re-citation can be a stale measurement as easily as an inherited
prediction, and only the parent report tells you which.***

**⚠ §DX-02dz — SEVENTH INSTANCE AND NOW THE EARLIEST ON RECORD.** The ship commit says *"Inline script
parses clean (5.09 MB)."* The largest inline script is **5,090,896 UTF-16 code units** (`s.length /
1e6` → 5.09) and **5,128,670 bytes** — true **5.13 MB**. This predates §DOC-02cu's previous earliest
(FU7's *"5.10 MB"*) by **3 h 10 min on the same day**, and the family ladder is now fully explained
from its origin: 5.09 → 5.10 → 5.11, one instrument, every time. The tool is the liar, not the author.

**Corpus figures at the pinned parent**, real parser, for anyone re-deriving: **2,850** QUEST_DB
entries · **2,820** UQF-1.0 · **2,760** board-eligible · nine types present
(`skill_check` 2,484 · `side` 142 · `combat` 78 · `delivery` 57 · `epic` 40 · `escort` 22 ·
`hybrid` 13 · `main` 7 · `dialogue` 7) · **38** `sleep:true` nodes · **418** nodes.

**Rows filed:** **§DX-02ei** 🟡 (the board has never posted a job within ten legs — one design call) ·
**§DX-02ej** 🟢 (`board:` with zero authors and `LHR` therefore boardless; dead `craft` and unnamed
`hybrid` in the allowlist).

---

*Verified §DOC-02cv, 2026-08-22. Original 181 lines; this revision re-measures every claim against the
pinned parent `43bd09c`, the ship build `8dcca67`, and HEAD, and adds the browser measurement §8 was
written without.*

*© 2026 Paul Richeson — MIT License.*
