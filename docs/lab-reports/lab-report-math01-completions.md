<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §MATH-01: Completion Design for the Mathematical World Arc

**Designed:** 2026-07-07 08:58 (design lock, pre-implementation) · **Shipped:** 2026-07-07 09:22 `32d7bb0`
**Verified:** 2026-08-17 (§DOC-02by) against `play.html` at HEAD, 42 days on
**Scope:** make `quest_math_01`–`05` completable, and make the four nodes they live on reachable.

> ⚠ **Two documents in one file.** §I–§IV are the original 2026-07-07 design lock, corrected in place.
> §V–§X are the 2026-08-17 verification and were not in the shipped report. Read §IV's verdict column
> as later evidence, not as something the designer knew.

---

## Abstract

The Mathematical World is a four-node pocket — Event Horizon Station, the Monster's Manifold, the Zero
Corridor, Cantor's Attic — where the fiction *is* the mathematics: zero arriving from Baghdad, the
quintic that defeats every radical, a snowflake and a monster sharing twelve symmetries, and the
196,883/196,884 coincidence that has no right to be so exact. It shipped on 2026-06-15 with all four
nodes, all five quests, and full prose. It shipped **unplayable in two independent ways**: the quests
were legacy activate-only, carrying no `completion` term of any kind, and three of the four nodes were
piled onto Jerusalem's grid cell where the client's movement kernel could never land on them.

This report locked the repair before a line of HTML was edited: relocate the four nodes into a free
2×2 pocket north-east of the Neon Undercity, and migrate the five quests to UQF-1.0 collect quests
whose completion is `{itemsAll:[<document>], atNode:<collect node>}`. Both halves shipped 23 minutes
after the lock.

**Verification verdict: shipped in full and intact at 42 days.** Every coordinate, gold value, XP
value, item name, node label and narrative line is byte-exact at HEAD. All five acceptance tests are
green. The design's one accepted edge case is still the only one. The report carries **one premise
error** — it declared that no NPC existed to receive the documents while the Event Horizon Station's
own node text already named the scholar sitting at its console — and that error is now a live,
player-visible gap (§IX).

---

## I. Introduction — intention, inspiration, and what it buys the player

**The inspiration.** Each node is one idea in the history of mathematics, staged as a place rather than
explained as a lecture. The station speaks in conservation law because it is standing next to an event
horizon and time is not behaving; the Manifold's walls are irritated that you can only perceive three
of their dimensions; Cantor's shade waits in an attic reached by an infinite ladder that you climb
anyway, because ℵ₀ has a floor.

**The defect the arc had.** Prose is not play. Before this increment the arc could be *read* and never
*finished*. A player could walk the pocket, learn everything it had to teach, and watch five quest
lines sit in the journal forever, because §ARCH-01's engine completes a quest only through a
declarative `completion` gate and these five had none. Worse, most players never got that far: three
of the four nodes were unreachable, so two of the five quests could not even *activate*.

**What the design buys.** The repair converts a reading experience into a five-step loop the player
can actually close:

1. **Discovery has a route.** Every hint in the arc names a direction — *"through the Neon Undercity
   east panel"*, *"north of the Event Horizon Station"*, *"one step east"*. The relocation makes all
   six of those directions **literally true on the grid**, so the hint text is navigation instead of
   decoration.
2. **Collection has a verb.** The documents were already lying on the nodes as `node.loot`; the
   migration gives them a *consumer*. Arriving grants the item and closes the quest in the same render.
3. **Effort has a payout.** 2,100 gp and 2,250 XP across the five, none of which was reachable before.
4. **Free movement is preserved.** The design-era plan gated the pocket behind *"carry three math
   documents"*. That is a movement gate and was rejected outright (D2). Nothing in the arc stops the
   player from walking anywhere; the panel, the rope and the infinite ladder stay fiction.

**Reuse over invention.** The audit's central finding is that nothing new had to be built — the whole
increment is four coordinates and one field per quest, which is why it took 23 minutes.

---

## II. Verification method (2026-08-17)

| # | Instrument | Applied to |
|---|---|---|
| 1 | Archive read at the **design-lock build** `32d7bb0^` | every `~L` citation in §III |
| 2 | Archive read at the **ship build** `32d7bb0` | the census and gate figures the commit claimed |
| 3 | Hunk-level diff of the ship commit | D2's "no mover/terrain/IMPASSABLE change" (a negative claim, adjudicable) |
| 4 | The project's own parser (`src/js/wbapi-core.js`) | node, quest and NPC censuses — never a line regex |
| 5 | Independent brace-depth walk, comment- and string-aware | the non-UQF residue, cross-checked against 4 |
| 6 | The report's own acceptance suite, run live | §IV D3/D5 and the §VII outcome |

---

## III. As-built findings at design time (2026-07-07) — all verified

**1. The collection mechanism already existed.** `` `function storyCollectLoot(node) {@30247` `` splits
`node.loot` on ` · ` and pushes each entry into `S_story.inventory` under its exact name. It is a
strict once-ever grant, guarded by
`` `if (S_story.visited[node.code] || !node.loot)@30249` ``. All five documents were already on the
nodes:

| Node | `loot` | Verified |
|---|---|---|
| EHZ — Event Horizon — Math Station | `Hamadani Failure Record` | ✅ byte-exact |
| MONS — The Monster's Manifold | `12-Symmetry Manuscript` | ✅ |
| ZERO — The Zero Corridor | `` `loot:"Zero Treatise · Counting Document Bundle"@9398` `` | ✅ |
| CNTR — Cantor's Attic | `Moonshine Memo · ∞-Fragment` | ✅ |

**2. Evaluation order supports same-visit completion.** `storyRender` calls
`` `const lootMsg  = storyCollectLoot(node);@34824` `` before
`` `const questMsgs = storyCheckQuests(node, true);@36217` ``, and inside `storyCheckQuests` activation is
the *first* statement — `` `msgs.push(..._uqfActivateAtNode(node, indexFresh));@30324` `` — ahead of the
completion loop. Arrive, receive the loot, complete on the same render. **Verified at HEAD**, and it
survived the §VM-01-F-FU refactor that replaced the per-render activation scan with an index.

**3. Three of the four nodes were unreachable.** At the design-lock build, `EHZ`, `MONS` and `ZERO`
all sat at `(38,215)` — a copy of Jerusalem's cell — alongside `JRS`, `PKR`, `JAR`, `OLN` and `JER`,
eight codes on one cell. `CELL_GRID` treats `list[0]` as the arrival code, and the client has exactly
one walking entry point: `` `const destCode = res.destCodes[0] || null;@28505` `` feeding
`` `S_story.currentCode = destCode;@28525` ``. The only other writer in the whole file is the death
respawn, `` `S_story.currentCode = S_story.checkpointNode || 'LHR';@26142` ``. **A non-primary code on
a shared cell is therefore unreachable, permanently** — so `quest_math_02` (activates at EHZ) and
`quest_math_05` (activates at MONS) could never fire, and three nodes' loot could never be granted.
`CNTR` alone at `(37,215)` was reachable. *Corrected:* the report calls this a "copy-paste of
Jerusalem's cell"; the mechanism is §WALK-1.5's 1° locale merge, and the same trap holds 172 nodes
repo-wide (§AUDIT-03x).

**4. The prose already specified the correct placement.** HKG "Neon Undercity" sits at
`` `HKG:{r:29,c:246},@9752` ``, and at the design-lock build its north-east quadrant —
`(29,247)`, `(28,247)`, `(29,248)`, `(28,248)` — was **entirely free**: no sea run, no road cell, no
`NODE_COORDS` occupant. Re-measured against the parent tree: **4 of 4 free, confirmed.** *Corrected:*
`IMPASSABLE_CELLS` is *derived from* `SEA_RUNS`, not a second independent set, so the report's
"not in SEA_RUNS/IMPASSABLE_CELLS" is one condition stated twice.

**5. The UQF collect shape was already proven** by `quest_brynn_ledger` and `quest_couperin_lute`:
`schema:'UQF-1.0', gate:{}, bits:[], completion:{itemsAll:[name], atNode:CODE}`, gold paid through an
`onComplete` reward bit, XP paid by the engine from the top-level `xpAward`. Both templates are
live and unchanged.

**6. Test pins.** The activate-only status was pinned three times in
`` `src/tests/integration/quest-runtime-uqf.test.js:the full non-UQF residue is exactly@9389` `` and its
two holdout lists. All three cited line numbers are **exact at the design-lock build**.

**7. Register check — passes.** The station still says *"I have been waiting five hundred and twelve
years. Time runs differently near an event horizon — which is here, technically"*
(`` `I have been waiting five hundred and twelve years@9396` ``), still explains that it speaks using
Noether's theorem, the Manifold's walls still complain that you perceive only three of their
dimensions, and Cantor's shade still stands at the window. **4 of 4 live at HEAD.**

---

## IV. Design decisions, with 42-day verdicts

| # | Decision | Verdict at HEAD |
|---|---|---|
| **D1** | Relocate to the Undercity pocket: EHZ `(29,247)`, ZERO `(28,247)`, MONS `(29,248)`, CNTR `(28,248)`, one code per cell | ✅ **Exact.** `` `EHZ:{r:29,c:247},@9753` `` · `` `ZERO:{r:28,c:247},@9735` `` · `` `MONS:{r:29,c:248},@9754` `` · `` `CNTR:{r:28,c:248},@9736` ``. Each is still the sole occupant of its cell; none is sea or road |
| **D2** | Free-Movement upheld — the *"carry 3 documents to enter"* gate **rejected**; no mover, terrain or `IMPASSABLE` change | ✅ **Proved by the diff.** The ship commit's HTML change is exactly three hunks: one `NODE_COORDS` line, three more `NODE_COORDS` lines, and the `QUEST_DB` block. Zero hunks in `SEA_RUNS`, `ROAD_RUNS`, `IMPASSABLE_CELLS` or the mover |
| **D3** | Five UQF completions `{itemsAll:[document], atNode:collect node}`; gold 300/350/350/500/600 via `onComplete` reward bits; `xpAward` 350/400/400/500/600 engine-paid; **no `itemChain`** | ✅ **Byte-exact**, e.g. `` `completion:{itemsAll:['Zero Treatise'],atNode:'ZERO'},@21922` `` and `` `completion:{itemsAll:['Moonshine Memo'],atNode:'CNTR'},@21958` ``. ⚠ The stated *reason* for "no `itemChain`" is wrong — see §IX |
| **D4** | `gate:{}` everywhere; independent side quests, no sequencing | ⚠ **Letter holds, spirit superseded.** All five gates are still `{}` — and §BOARD-01-FU6 (`f7350b0`, +14 d) added four `` `unlock(bit, ctx) { (bit.quests@22340` `` edges making 01→02→03→04→05 a forward chain, plus `rumor` fields putting all five on the Warrant's Board. A mechanism D4 could not have weighed, because it did not exist |
| **D5** | `atNode` = the collect node, uniformly; accepted edge — both ZERO documents drop on one visit, so a late-activated `quest_math_04` completes on a re-visit | ✅ **Still the only edge**, and it is pinned by a test that deliberately exercises it |
| **D6** | Five `onComplete` narrative lines, recited before writing | ✅ **5 of 5 byte-identical** at HEAD, including *"the north wall, grudgingly: 'You perceived three of them correctly. That deserves something.'"* and *"the difference between 196,883 and 196,884 is 1. The gold, however, is real."* |
| **D7** | No new state fields; a `mathArcComplete` capstone flag is out of scope | ✅ `mathArcComplete` = **0 occurrences**, 42 days on |

---

## V. Verification ledger

| Claim | Measured at HEAD | Result |
|---|---|---|
| Four coordinates | 4 of 4 | ✅ exact |
| One code per cell, all passable | 4 of 4 sole occupants; 0 sea, 0 road | ✅ |
| Five `completion` shapes | 5 of 5 | ✅ exact |
| Gold / XP values | 300·350·350·500·600 / 350·400·400·500·600 | ✅ 10 of 10 |
| Five narrative lines (D6) | 5 of 5 | ✅ byte-identical |
| Four `node.loot` strings | 4 of 4 | ✅ byte-identical |
| Directional hints made true by D1 | 6 of 6 (east panel · north · east · NE · north-of-Manifold ×2) | ✅ |
| Register check (§III.7) | 4 of 4 voices live | ✅ |
| Non-UQF residue after migration ("35 → 30") | **30**, exactly the `blq_05`–`10` stubs | ✅ (two independent instruments; see §IX) |
| §III line citations, read at `32d7bb0^` | 5 of 5 | ✅ exact — see the note below |
| Acceptance suite (§MATH-01 describe) | **5 passed / 0 failed**, 3.4 s | ✅ |
| Census pin (`expect(r.ids.length).toBe(30)`) | passes live | ✅ |
| Ship-commit gate figure "quest-runtime-uqf 293/293" | 293 `test(` sites at `32d7bb0` | ✅ exact |
| Report's planned gate "mud-harness 270/270" | 270 `check(` sites at `32d7bb0` | ✅ exact |

**Note on the `~L` citations.** All three of §III's approximations —
`storyCollectLoot` ~L28628, the `storyRender` call ~L29803, `storyCheckQuests(node)` ~L34066 — are
wrong at the report's own ship commit by a **uniform +30**, and **byte-exact at `32d7bb0^`**. The
uniform offset is the tell: three citations sharing one delta is a build boundary, not three errors.
This is a design-lock document, so its measurements belong to the tree it was written against. The
`~` was unearned modesty; the numbers were copied, not remembered.

---

## VI. Delta table — specification versus shipped

| # | Specified | Shipped | Direction |
|---|---|---|---|
| 1 | Four `PUT /api/coords` moves | Same, and nothing else in the world data | ✅ as specified |
| 2 | Five `PUT /api/quest` migrations, prose untouched | Same; every `desc`/`hint`/`failText` preserved | ✅ |
| 3 | Legacy `reward` field kept "for display parity" | Kept, values mirror the `onComplete` gold exactly | ✅ |
| 4 | Test plan: flip the pins, add a §MATH-01 describe | Shipped as **5 tests**, including the D5 edge and an `atNode`-holds negative | ✅ exceeded |
| 5 | Docs plan: `quest.md` rows + `index.md` registry/test/report rows | All shipped — `` `docs/design/quest.md:The Mathematics Pocket (EHZ, ZERO, MONS, CNTR)@343` `` carries five `[✅ LIVE §MATH-01]` rows with gold and XP correct | ✅ |
| 6 | — | **A WBAPI defect surfaced mid-flight**: `PUT` routed plain-object fields (`gate`, `completion`) to a memory-only path that a file-watch reload discarded. Fixed the same commit as `editStructuredField` source-level persistence | ➕ undocumented in the report; recorded here |
| 7 | — | The ship commit also carried an **unrelated road-editor pin** into `src/config/roads-pins.json` at `(36,176)`. Benign: `ROAD_RUNS` was not regenerated in that commit, and when it later was, the cell attached to an existing highway | ➕ stray, no defect |
| 8 | "No sequencing" (D4) | Four `unlock` edges added 14 days later | ⟳ superseded, in the player's favour |
| 9 | "No recipient NPC exists" (D3) | **False when written** — see §IX | ❌ premise error |

---

## VII. Playability outcome

**The loop closes.** All five quests activate, complete, and pay. Measured live: arriving at ZERO with
`quest_math_01` and `quest_math_04` active grants both documents *and* completes both in the same
render, XP and gold included; `quest_math_02` activates at EHZ, declines to complete there, and
completes at MONS on pickup; holding the Moonshine Memo away from CNTR completes nothing. That last
one is the test that matters — `atNode` is what stops a collect quest from resolving in a tavern
three countries away.

**The prose became navigation.** Six directional hints, six true statements about the grid. A player
who reads *"the panel is in the east wall of the Neon Undercity"* can step east and be there.

**The arc became a chain (unplanned).** §BOARD-01-FU6's `unlock` bits turned five independent
fetch-quests into a guided sequence: finishing the Zero Treatise in the Corridor immediately activates
*What the Snowflake Knows*, and so on to the Moonshine Memo. Before that, `quest_math_02` was only
reachable by physically standing at EHZ. The design's D4 reasoning — *"spatial activation already
sequences the arc naturally"* — was correct but fragile; the referral chain made it robust.

**The pocket grew a road (unplanned).** On 2026-07-28 `fa8f9e4` re-ran the road generator, which laid
`(29,249)` — directly east of the Manifold. MONS and CNTR are now highway-adjacent, and road cells
carry an encounter rate of zero. The eastern half of the pocket has a safe approach that nobody
designed. (`` `410 road cells, 89 junctions.@9894` `` — the generator stamps its own count above the
data it writes, which is why that figure can be trusted.)

**The documents cannot be lost.** `storyCollectLoot` mints them without a `sell` field, and both sell
paths filter on `` `S_story.inventory.filter(i => i.sell > 0 && !_isLastWeapon(i))@24339` ``. A player
cannot accidentally vendor a quest document into a soft-lock — a real hazard for a once-ever grant,
closed by accident rather than by design, but closed.

---

## VIII. Risk and known-edge register — outcome

| Risk stated | Outcome |
|---|---|
| D5's double-grant at ZERO forces a re-visit for a late-activated `quest_math_04` | **Live and accepted.** Pinned by test 3 of the §MATH-01 describe, which asserts the *same-visit* case; the re-visit case follows from the same `atNode` rule used everywhere in `QUEST_DB` |
| `∞-Fragment` stays quest-less flavour | **Held.** 1 occurrence in the file, the CNTR loot string |
| `mathArcComplete` capstone out of scope | **Held.** 0 occurrences |
| PKR/JAR/OLN/JER remain sub-locations of JRS — "pre-existing, not math-related" | ⚠ **Held, and it is the report's most expensive dismissal.** Those four are still non-primary on `` `JRS:{r:38,c:215},@9837` `` at HEAD, and **28 quests are authored to activate on them** (JAR 12, PKR 10, OLN 5, JER 1). §MATH-01 fixed three instances of this class 35 days before it was filed as §AUDIT-03x |

---

## IX. Defects and disposition

**(a) The premise error — `npc` (→ new row §DX-02cv).** D3 reasoned: *"No `itemChain` — the documents
are keepsakes; no recipient NPC exists ('Collect it' is the whole contract)."* The second clause was
false at the design-lock build. EHZ already carried `` `npc:"Johannes von Weisheit"@9396` `` and gave
him four paragraphs of node text: *"He looks like a man who has been calculating the exact probability
of your arrival and found it satisfying."* CNTR carries `npc:"Cantor's Shade"`. Both render an NPC
chip; **neither can be talked to**, because the Talk button is gated on
`` `!(node.npc && NPC_DIALOGUE[node.code])@36120` `` and neither code is a key in that table. Measured
through the project's parser: **71 of 416 nodes carry an `npc` chip; 6 have no dialogue entry, and two
of the six are this arc's.** The design decision (no delivery step) may still be the right one — but
it was made on a wrong fact, and the visible result is a named scholar in a room full of documents
about him who cannot be addressed. Filed 🟡, small design call.

**(b) `§DX-02as` (e) is wrong, and this report is what proves it.** §3 predicted the non-UQF residue
would fall 35 → 30 and be exactly the `blq_05`–`10` stubs. §DX-02as (e), filed five weeks later,
asserts the true figure is **50** and names 15 additional ids. All 15 carry `schema:"UQF-1.0"` at
HEAD; `play.html` has not changed since that row was written; and two independent instruments
return **30** — a comment- and string-aware brace walk over all 2,853 entries, and the live assertion
`` `src/tests/integration/quest-runtime-uqf.test.js:expect(r.ids.length).toBe(30);@9400` `` running in the
real JS engine. The 15 mis-counted entries are single lines of 1,436–2,655 characters with `schema:`
near the *end*. **The newer measurement was not the better one.** Row corrected in place, not re-filed.

**(c) Two engine comments still describe the world this increment ended** (→ appended to §DX-02as).
`` `q.schema === 'UQF-1.0' && q.completion && QuestRuntime.canComplete(id)@30343` `` sits directly
beneath a comment stating that *"the remaining non-UQF entries (quest_math_01–05 §MATH-01 gap …) never
had a completion mechanism and stay activate-only"* — three lines above the code that completes them.
The `adaptLegacyQuest` copy of the same sentence is already tracked as §DX-02as (e); this is its
second site.

**(d) §AUDIT-03x has an executed precedent and did not know it** (→ appended to §AUDIT-03x). The row
is open as a 🟡 design call. §MATH-01 is the only increment that has ever repaired an instance of it:
four `PUT /api/coords` moves into free land, zero engine changes, hint text made true by the
relocation, and a regression test that pins one-code-per-cell. That is the shape, and it is proven.

**Not filed (instrument 7 — prior art found and scored):** `johannes_von_weisheit` as a quest `npc`
key with no registry entry is deliberate and documented (§AUDIT-03g anchors it explicitly, *"the Math
Station speaks in-arc"*; the no-registry-entry class is §AUDIT-03i). `index.md`'s stale `~2,848 quests`
belongs to §DX-02s.

---

## X. Conclusion

This is a small increment that did an unusual amount of work, and it did it by finding rather than
building. The collection mechanism, the evaluation order, the completion grammar and the payout path
all already existed; what was missing was four coordinates and one field per quest. The whole
implementation is three diff hunks. Forty-two days later every number in it still measures exact, its
five acceptance tests are green, and two things it never planned — a referral chain and a road — have
made the arc easier to play than the design imagined.

Its one real fault is a sentence, not a mechanism: *"no recipient NPC exists"* was written about a room
whose own text names the man sitting in it. The design that followed from it is defensible; the fact
was not checked. That is the failure mode a design lock is supposed to prevent, and the reason this
one is otherwise so durable is that every *other* premise in it was measured before it was written
down.

> *"Conservation law: what is said here is conserved."* — the station, on being found.
> It was right about the report, too.
