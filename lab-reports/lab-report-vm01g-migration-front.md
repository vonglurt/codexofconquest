<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — §VM-01-G: The Migration Front

## Retiring per-node special cases from `storyRender` into three small registries

**Authored:** 2026-07-28 (design lock) · **Ship addenda:** 2026-07-28 → 2026-08-05 · **Re-verified against `roll2hit-v3.html` @ `a66119f` on 2026-08-23 (§DOC-02db)**
**System:** `` `function storyRender(node, prefix) {@34567` `` and the registries `` `const NODE_PANELS = [@31318` ``, `` `const NODE_HOOKS = [@34190` ``, `` `const NODE_VERBS = [@34291` ``
**Status:** ✅ Design held · ✅ 11 slices shipped · ⚠️ 2 censused blocks unclaimed · ⚠️ 2 design asks still open

> **This is a HISTORY document.** It records what was *designed* on 2026-07-28, what each slice
> *shipped*, and what is *live* now. The maintained homes are `mechanics.md` (systems),
> `world.md` / `story.md` (content), and BACKLOG.md (open work). **Where those and this report
> disagree, they win.** Claims that did not survive are marked and kept, never deleted — a
> silently removed claim reads as a claim that held.

---

## 1. Abstract

`storyRender` had become two programs stacked in one function: a 2,445-line wall of hardcoded
`if (node.code === 'XX')` blocks, then a generic data-driven section engine. The boundary between
them — the *migration front* — was moving the wrong way: new content shipped as new bespoke
blocks because the render language had no vocabulary for the shapes content authors kept
reaching for. This report locks a design (three small registries, each matched to a class of
block), slices the migration into eleven independently shippable steps, and records what each
step actually found.

**Re-verified at 26 days: 79 of 79 named symbols resolve (100%).** `storyRender` is **4,412 →
1,489 lines (−66%)** while the file *grew* 37,953 → 38,712 lines; `node.code ===` comparisons are
**125 → 96**, and below the front **47 → 3**. The design decision (Option C, layered) held; the
*class-to-tool mapping* inside it did not — `NODE_HOOKS` absorbed 61 blocks against a predicted
~9, for a reason no slice could design around. Ten deltas and five new findings are recorded in
§10–§11, including one that takes the whole Act VIII homecoming off the board.

## 2. Method

Every claim was re-measured against the live file by `grep`, `sed` and `git show` — not carried
forward from the July text and not read off a doc table (§AUDIT-03m). Historical claims were
re-derived at the hashes the report itself cites, so a drifted anchor is distinguishable from a
wrong one. Behaviour was tested, not inferred: **147 assertions across 14 Playwright suites were
run at HEAD** (§9). The WBAPI server was **not** started; the working tree carries an in-flight
CSS recolor and a write session would have engaged Hazard #1.

**Counting convention.** A `node.code === 'XX'` occurrence inside a comment is prose, not a
comparison — the §AUDIT-03f lesson, now enforced by gate #13 phase 6. Raw textual counts are
given first, code counts in parentheses, so the two never quietly swap places.

---

## 3. Intention, inspiration, and what it buys the player

The original report justified this work as line reduction. That is the least interesting thing it
did, and the eleven ship records now show why.

**The thesis is a language thesis.** When a data language lacks a shape, the file does not stall —
it grows imperative code instead of vocabulary. Measured at lock time: **76 → 124 comparisons in
twelve days**, roughly four new hardcoded per-node branches per day, every one of them a small
private program with its own guards, its own DOM ids and its own idea of what "already happened"
means. None of that is visible to a player. All of it is visible in the bug rate.

**What the player gets is not architecture — it is the audit the architecture forced.** A block
cannot move until someone proves the move is a no-op, and proving that means reading the block
line by line against a golden capture. Eleven slices of that reading found things no bug report
ever surfaced:

- **Glut's Gift was never granted.** Its once-guard was `!visited['HG1']`, and `storyCollectLoot`
  flips `visited[code]` earlier in the same render — so the jar the node's own text promises
  (*"She gives you the jar as you arrive. … It is warm in your hand."*) never entered the
  inventory. The prose and the mechanics disagreed, and the prose was right.
- **`quest_glut_06` was dead a second way** — circular completion, its only flag writer being its
  own `onComplete`. Invisible, because the quest never listed in the first place.
- **The LCY counterfeit-writ beat was circular-dead since it shipped**, so the Scene-5
  confrontation listed "the three claims" when the first had never been witnessed.
- **The entire Visby and Tilbury arcs had never run**, because `NODE_MAP.VS` and `NODE_MAP.TL`
  carried no `code` field. Verified historically: `VS` gains `code:"VS"` in `c9f3946` and had it
  in no prior revision.
- **Six double-pays** — the Aldous confrontation paying +800gp and two Letters of True Passage,
  DA2 granting a *second permanent INT point*, DA3 a duplicate knowledge entry, DSF a second Sea
  Element, plus the Ori and seal-delivery pairs G3 found.
- **Six authored narratives that no player had ever read**, destroyed by their own handler's bare
  `storyRender` before the eye could reach them.

That is the return on this refactor: **ten beats that promised something and delivered nothing,
found by moving furniture.** The vocabulary is the mechanism; the reading pass is the payoff. And
the vocabulary keeps paying — a `NODE_PANELS` entry cannot have a dead once-guard, because it has
no guard of its own to get wrong.

**What it adds to the game.** 416 nodes that can each carry state-aware flavour, a one-time
arrival scene, a priced verb or a bespoke interface — authored as three lines of data instead of
forty lines of DOM code, and fenced by a gate that fails the build when a node code goes stale.
Density the player can walk into, with fewer places for it to quietly stop existing.

---

## 4. The finding, as locked (2026-07-28 @ `8973fd7`)

Re-derived at the cited hash; all three anchors verify exactly.

| Measure | Locked value | Re-derived 2026-08-23 |
|---|---|---|
| `storyRender` span | 30887–35298 = **4,412 lines** | ✅ exact |
| Migration front (`_mkSection` definition) | **33332** | ✅ exact |
| `node.code ===` in `storyRender` | **124** | 125 raw / **124 code** ✅ |
| …above the front (30887–33332) | 77 across ~58 named blocks | 78 raw / **77 code** ✅ |
| …inside the engine region (33332–35298) | **47** | ✅ exact |
| Drift since the row was written (2026-07-16) | 76 → 124, **~4/day** | consistent |

The front had moved **backward** by 48 comparisons in twelve days. §D01 dungeon gates, §SIREN-01,
§PAUL-01, La Riva and the §BOARD signposts all shipped as new bespoke blocks. The thesis was not
theoretical; it was a rate.

## 5. Block taxonomy

Five shapes cover the ~58 named blocks above the front.

| Class | Shape | Count | Data-expressible? |
|---|---|---|---|
| **A** State-gated flavour panel | remove-by-id → `if (code && flags)` → styled div → `insertAdjacentElement('afterend')` | ~22 | **Yes** — `{id, node, when, style, text}` |
| **B** One-time arrival scene | Class A plus a once-guard flag | ~8 | **Yes** — A + `{once}` |
| **C** Legacy quest auto-activation | `if (code) { if (!quests[id] && cond) quests[id]='active' + storyMsg }` | ~7 | **Yes** — this *is* `gate` + `activateNode` |
| **D** Effect-button (consent verb) | conditional button → gold cost, flag writes, item grant, favor, unlock | ~12 | **Mostly** — needs a `cost` leaf |
| **E** Bespoke UI | real interfaces with their own state machines | ~9 | **No** — the fix is *registration*, not data |

The 47 engine-region exceptions were logged as Class F, deferred, so the count stayed honest.

## 6. Two hazards that constrained every slice

1. **Insertion order is LIFO.** Every A/B/D block inserts `afterend` of `#story-text-box`, so
   *later blocks render above earlier ones*. Any dispatch must be order-preserving by
   construction, or every multi-panel node reshuffles visually.
2. **Remove-then-recreate.** `storyRender` is re-entrant; each block removes its old div by id
   before conditionally recreating it. The dispatcher must replicate: sweep, then create.

Both proved load-bearing. Hazard 1 alone kept four blocks out of `NODE_PANELS` across three
slices, and it is why every hook is dispatched **in place** rather than from one loop.

## 7. The design decision — Option C, layered (locked by the user, 2026-07-28)

Neither *all-bits* nor *all-render-fns* fits, because the classes want different tools; forcing
one tool onto all five is how `itemsMinAny` happened.

- **C1 `NODE_PANELS`** — ordered data table for A+B. Pure render data, no VM, `textContent` only
  (the §DATA-01 lesson).
- **C2 `NODE_HOOKS`** — registered render fns for E. Bodies move verbatim; behaviour unchanged.
- **C3 into the VM** — C becomes `gate` + `activateNode` + `onActivate`; D becomes `choice` and
  verbs, needing exactly one new opcode: a **`cost`** leaf, used by Yva, Corelli and ferry-class
  buttons alike.

**Rejected:** all-bits (a DOM-building opcode is the Host/Script Separation violation this track
exists to end) and all-render-fns (registering 58 functions relocates imperative code without
retiring it, and the front keeps moving).

---

## 8. Slice plan → shipped: the delta table

| Slice | Spec (2026-07-28) | Shipped | Hash | Verdict |
|---|---|---|---|---|
| **G1** | `NODE_PANELS` for A+B, ~700–900 lines → table + ~40-line renderer | 12 panels; two dead panels found and fixed (§LXII AO once-guard, §SIREN LJ3→LSO dead code) | `25c3710` `7a130cd` `bf6f486` | ✅ **as specified** |
| **G2** | `NODE_HOOKS` for E, one dispatch loop | 7 hooks, ~440 lines — but **in-place dispatch, not one loop**: Corelli's computed 5-node schedule has no single safe position (Hazard 1) | `f1ff031` | ⚠️ **shipped, design deviated** |
| **G3** | C → `gate` + `activateNode` per arc | 5 blocks, 15 quests + 3 adjacent. Premise was half-stale: most already carried an audit-appended `activateNode` and had been mass-activating with vacuous gates; `actNumber` proved to be node act, not progress, so **no `actMin` leaf was needed**; `VS`/`TL` had no `code` field and had never run | `c9f3946` | ⚠️ **shipped, premise rewritten** |
| **G2b** | blocked on "a ctx-argument design" | The ctx was **one field** — of 89 locals, the 29 Birka blocks read only `npcRowDiv`. 895 lines moved byte-for-byte | `bedf2c1` | ✅ **blocker dissolved by measurement** |
| **G4a–d** | D per-verb; own child report | `choice` gains a host end; `NODE_VERBS` invented (not in this design); `cost` leaf ships; CDG's concurrent menu | `b905733` `f7a60a5` `4c2a831` `b0c2478` | ✅ **child report, as required** |
| **G-FU** | "triage the 47 after G1–G4" | Count **held at 47**. Found a *second* special-case stack **below** the front (~1,200 lines, ~38 blocks) and shipped the fence first: gate #13 phase 6, 20 classified synthetic battle codes | `02ff4aa` | ✅ **+ one thesis correction** |
| **G-FU-a** §CROWN-01 | 8 blocks; combat verbs, iodine 2-verb sequence, marks once-panel | 7 verbs, 2 verbatim hooks, 2 panels. Two of three shapes corrected: WG0's button is panel-embedded; the iodine burn writes a **numeric** field `flag_write` cannot express | `56c08f1` | ⚠️ **2 of 3 shapes corrected** |
| **G-FU-b** §HUNT-01/02 | 6 blocks, "2 combat verbs" | **Zero verbs** — both battle buttons are panel-embedded (the WG0 rule, 2nd application); 5 panels; WRO's done panel stayed in its hook for a measured stacking reason | `cf2fec8` | ⚠️ **corrected; 22/22 zero-delta** |
| **G-FU-c** Roen arc | 8 blocks; "the second `choice` consumer" | **Zero verbs, no `choice`** — the VS shadow pair has real D2 semantics on ask-2-blocked chrome; 6 hooks, 4 panels | `7d8cb39` | ⚠️ **corrected; 37/37 zero-delta** |
| **G-FU-d** harbor chains | "GCI intercept = D3 menu" | Corrected **by a string**: `sbChosenRole` is an enum `flag_write` cannot express. 6 hooks, 3 panels, zero verbs. MME hull repair pays through the **`cost` leaf** — the 7th gold site, the plan shape that held | `8cdda7b` | ⚠️ **corrected; 46/49** |
| **G-FU-e** §LXX family | "small verbs + done-panels" | **One** verb (DSF smelt, the family's only bare button); 4 hooks, 3 panels | `3dfdc26` | ⚠️ **corrected; 20/25** |
| **G-FU-f** SSJ + specials | "SSJ → hooks verbatim, no design call" | Exactly that. 124 lines, line-multiset 124/124 | `6a571de` | ✅ **first slice with zero corrections** |

**One pattern dominates the "corrected" column**, and it was not in the taxonomy: the
**panel-embedded button** — a `<button>` appended *inside* a `.sweelinck-variant` div rather than
as a sibling. Splitting it into panel + verb moves the button out of its bordered chrome to a
full-width sibling below, *a difference a DOM diff cannot see and a screenshot can* (the G4c
lesson). Five slices met it; five slices deferred to `NODE_HOOKS`. That single unmodelled shape
is why hooks outgrew their forecast by ~7×.

---

## 9. Re-verification at HEAD (2026-08-23 @ `a66119f`)

| Measure | Lock (`8973fd7`) | HEAD | Δ |
|---|---|---|---|
| `storyRender` | 4,412 lines | **1,489** | **−66%** |
| …above the front | 2,445 lines / 78 (77) cmp | 753 lines / **25 (24)** cmp | −69% / −53 |
| …below the front | 1,966 lines / 47 cmp | 736 lines / **3** cmp | −63% / **−44** |
| File total | 37,953 lines | 38,712 | **+759** |
| `node.code ===` file-wide | 131 raw | **96 raw / 95 code** | −35 |
| Registry entries | 0 | **103** (22 panels · 61 hooks · 20 verbs) | — |

`storyRender` lost 2,923 lines while the file gained 759. The above-front residue is **24 code
comparisons — exactly the figure §11 predicted** ("24 above the front: the G4c-FU-blocked verbs,
the deliberate non-migrations, the delayed one-time beats").

**Symbols: 79 of 79 resolve (100%)** — every function, registry, flag, quest id and node field
this report names. **Tests: 147 of 147 pass** across the fourteen §VM-01-G suites (`uqf-node-`
`hooks · panels · verbs · verbs-d1 · verbs-d3 · verbs-crown · hunt · alch · harbor · lxx · ssj`,
`uqf-npc-row-hooks`, `uqf-quest-activation`, `vm01f2-finalbattle-field`), 104 + 43, no failures,
33.6 s. **Gate #13 green:** *"10 node-keyed registries, 3 function-local ones, 8 node fields, 1
route table, comparison literals and 20 classified battle codes all resolve against 416 live
nodes"*, and its selftest still catches a planted dead literal, an unlisted synthetic, a stale
classification, and — the negative control — declines to flag the same dead literal inside a
comment.

---

## 10. Deltas

**D1 — the design decision held; the class-to-tool mapping did not.** Option C shipped in all
three layers. But `NODE_HOOKS` carries **61** entries against Class E's forecast ~9, and
`NODE_PANELS` **22** against ~30 for A+B. The panel-embedded-button shape (§8) redirected five
slices' worth of material into hooks. *A registry that absorbs 7× its forecast is not a failure of
the registry; it is an unasked design question* — which is exactly what G4c-FU ask 2 is.

**D2 — `NODE_VERBS` is not in this design.** The third registry (`{id, group, nodes, when, label,
bits, ambient}`) was invented by G4b/c/d and is documented in its child report. This document
predates it; §7's C3 describes only "D becomes live `choice` renders."

**D3 — the three engine specials were answered and one shipped.** §11f filed TLS `isFinal` (×3),
INN sleep pricing (×3) and patrol ordered-visit (×3) as design calls. All three were answered
2026-08-06 (`9c9fe42`): TLS → node field, INN → **DECIDED-STAY**, patrol → **DECIDED-STAY**. TLS
now authors `` `finalBattle:{minLevel:20,minShards:7},@8727` `` read by the single helper
`` `function _finalBattleReady(code) {@27998` `` at three call sites. The other six sites survive
by decision, and are visible at HEAD as the only remaining comparisons outside `storyRender`.

**D4 — the four double-pays this report filed were fixed.** §SPARK-01-FU and §LXX-01-FU shipped
together in `3338def` (2026-08-06). Every button now writes only its flag (`aldousConfessed` ·
`tideGateOpened` · `antecedentDepthMet` · `seaElementCrafted`) and the quest's completion is keyed
on that flag — the `quest_ca_01` shape this report identified as "the pair done RIGHT, one arc
over."

**D5 — §11e's `lxx-dsf-smelt` description is now false.** It records *"fn-valued `bits` for the
charged-preferred salt pick."* At HEAD the entry carries a **plain two-bit array** (`flag_write` +
`narrative`); §LXX-01-FU moved the salt pick into `quest_forge_02`'s `_legacy_fn`. This is the
report's only claim about the file that no longer holds.

**D6 — §11f's "THE BLOCK INVENTORY IS COMPLETE" is overstated. NOT SHIPPED: two blocks.**
Below the front at HEAD, three comparisons remain. One is the HW1 `whisperSaintSeen` latch, kept
inline **on purpose** and documented in place. The other two were never claimed by any slice:
- **NWI — the §SPARK-01 SEA Warmth Eel block**, a 3-state `.sweelinck-variant` panel. It is
  named in §11's own census table (first entry of the multi-state row) and then falls between the
  arcs: G-FU-b took KSU/ALF, c took PDL/MLA, d took SEN, e took DA2/DA3 — nobody took NWI.
- **HKG — the Layer 41 "Void Below" descend chip**, gated on crov + auros favour and
  `quest_void_below` active.

The census was right at 47; the *arc partition* dropped two of them. **44 of 47 shipped.**

**D7 — NOT SHIPPED: fn-valued `css` on `NODE_PANELS`.** §11's chrome note predicted the per-state
`border-left-color` problem would force it. Three slices found it "unneeded" — each 2-to-3-state
block ships as sibling entries sharing one DOM id with mutually exclusive `when`s (the DUS
else-leg shape). The prediction was reasonable and the need never arrived.

**D8 — NOT SHIPPED: the second `choice` consumer.** Predicted by §5 (G4's premise), then by
§11's slice plan, then by §11c. `choice` still has exactly the consumers G4b/G4d gave it. Both
candidates (the VS shadow pair, the GCI intercept) are blocked on chrome or on a type the grammar
does not carry — a **string enum** and a **numeric field**, `flag_write` being boolean-only. That
type gap has now been sighted four times (HCA `iodineBuffBonus`, GCI `sbChosenRole`, DA2
`abilityScores.int`, and the marks conversion) and is the track's most-repeated unfiled shape.

**D9 — two design asks remain open.** §VM-01-G4c-FU (three asks: the delayed beat, panel chrome,
a ceremonia launch) and §VM-01-G2b-FU (the five act-gated Birka beats). Both `[ ]` in BACKLOG.md
at HEAD, both correctly filed rather than defaulted.

**D10 — the front stopped moving, but the test is weak.** From the last VM-01 ship (`9c9fe42`,
2026-08-06) to HEAD is 17 days: comparisons **96 → 96**, `storyRender` **1,489 → 1,489**,
registries unchanged at 22/61/20. Under the lock-time rate (~4/day) that window predicted ~+68.
**But the HTML took exactly one commit in those 17 days, +7/−2 lines** — the interval was a
documentation program, not a content push. This is a *no-regression* result, not a proof that the
vocabulary holds. The thesis gets its real test on the next content arc.

---

## 11. New findings

**F1 🔴 — The Homecoming cannot happen. Six Act VIII farewell beats, three gift items and ~11 KB
of authored prose are unreachable, and the reason is the mechanism §VM-01-G3 already named.**
`` `const ACT8_FAREWELL_BEATS = {@26883` `` fires from
`` `function _renderNpcCard(key, container) {@23683` `` when `` `const beat = ACT8_FAREWELL_BEATS[key];@23686` ``
and `(S_story.actNumber || 1) === 8`. But `` `  S_story.actNumber = node.act || 1;@34573` `` is the
**only** writer of that field, it runs at the top of `storyRender`, and `_renderNpcCard` is called
from exactly one place — `` `      keys.forEach(k => _renderNpcCard(k, npcRowDiv));@35179` `` —
downstream of it. The six NPCs are pinned to their profile nodes: yael `LHR`, brynn `TLL`, quill
`MHQ`, pachelbel `LLA`, crov and auros `HKG`. **Every one of those nodes is `act:1`.** And
`act:8` occurs exactly **once in the entire game — `TLS`, the Convergence platform**, where none
of them stands.

So the homecoming written to happen *before* the end can only trigger at the place you go to end
it. Lost: Yael's witness network (*"Go do the other kind."*), Brynn's *"I made too much bread
today — I always do when I'm worried,"* Quill's settled ledger, Pachelbel's sketch, Weckmann's
tincture, Auros's warning — plus **Brynn's Loaf** (heal 8), **Pachelbel's Sketch** (readable) and
the **Champion's Tincture** (advantage on next attack), none of which any save has ever held.
This extends §VM-01-G2b-FU from five dead beats to **eleven**. → **§DX-02ft**

**F2 — the root cause is larger than either row, and it is quantified.** `actNumber` is not
campaign progress; it is *the act of the tile you are standing on*, and `index.md`/`mechanics.md`
both say so correctly. Sixteen sites compare it against a threshold ≥ 2. **Seven sit inside a
node-pinned block, and not one of them is a real gate:** six are pinned to `act:1` nodes and are
permanently false (the five §VM-01-G2b-FU beats plus F1's `_renderNpcCard`); the seventh is
pinned to `NUE` (`act:6`) and is permanently true — vestigial, the same class G3 retired from the
quest stanzas. The remaining nine are unpinned and read "am I standing somewhere act-N-or-later,"
which is a proxy for progress that happens to correlate. *The mechanism is documented accurately
and used as if it were something else* — a rare, clean case where better docs would not have
helped. → **§DX-02ft**

**F3 — §VM-01-G2b-FU's "only writer" claim is literally wrong, and the correction strengthens
it.** `brynnKeeperStoryTold` has **two** writers: the dead Beat 1 at
`` `            S_story.brynnKeeperStoryTold = true;@32829` `` and a second inside
`ACT8_FAREWELL_BEATS.brynn.text()` at
`` `        S_story.brynnKeeperStoryTold = true;@26894` ``. The second is dead by F1, so the
cascade holds — but it holds for a different reason than the row states, and the second writer is
itself a hazard worth naming: **a text getter that mutates persisted save state.** A display path
with a side effect is invisible to every reader who greps for assignments in logic. → **§DX-02ft**

**F4 — the docs mark Layer 60 "✅ Implemented" and name a flag that does not exist.**
`world.md` § *The Homecoming* and `story.md` § *Act VIII Farewell Beats* both carry the
implemented badge; neither beat can fire. `world.md`'s flag list also names
`act8FarewellWeckmann` — **0 occurrences in the file**; the live flag is `act8FarewellCrov`
(`world.md` uses the character's name, the code uses the profile key). Both docs are annotated in
this increment rather than rewritten (§AUDIT-03m-FU: annotating an unverified claim launders it).

**F5 — two censused blocks belong to no slice** (see D6): NWI's Warmth Eel panel and HKG's Void
Below chip. Both are ordinary shapes the shipped vocabulary already expresses. → **§DX-02fu**

---

## 12. Lessons

1. **A design that survives contact is not one whose predictions all came true.** Nine of eleven
   slices corrected the plan, and every correction came from measuring the block rather than
   re-reading the plan. The plan's job was to be specific enough to be wrong in public.

2. **The shape you did not model is the one that reroutes the work.** Not `choice`, not `cost` —
   a button appended inside a div instead of beside it. It cost five slices their verbs, and it is
   still unanswered because it is a *visual* question a DOM diff cannot ask.

3. **`flag_write` being boolean-only is now a four-sighting gap.** Each sighting was correctly
   refused ("growing the grammar for one consumer is the `itemsMinAny` failure"), and four is past
   the project's own grow-at-three rule. Filing the shape is overdue.

4. **Verbatim moves need behaviour tests that pass on both sides.** The slices' honest signature —
   *"11/11 with 3 red on HEAD, exactly the registry/source tests, and all 8 behaviour tests green
   BOTH ways"* — is the only test shape that can distinguish a no-op from a rewrite.

5. **Ship the fence before you move anything.** Gate #13 phase 6 landed in the triage, before a
   single block moved. Every slice after it inherited a check that would have caught the §DOC-02c
   class of rot (0 of 49 node codes resolving) at authoring time.

6. **The migration moves surfaces, not state.** Latches with nothing to render stayed inline, and
   said so in a comment. That rule is why the residue above the front is 24 comparisons that each
   have a written reason, rather than 24 that nobody got to.

---

## 13. Ship record

| Slice | Hash | Date |
|---|---|---|
| Design lock | `cf2c17c` | 2026-07-28 |
| G1 (+2 fixes) | `25c3710` `7a130cd` `bf6f486` | 2026-07-28 |
| G2 | `f1ff031` | 2026-07-28 |
| G3 | `c9f3946` | 2026-07-28 |
| G2b | `bedf2c1` | 2026-08-04 |
| G4a–d | `b905733` `f7a60a5` `4c2a831` `b0c2478` | 2026-08-04/05 |
| G-FU triage | `02ff4aa` | 2026-08-05 |
| G-FU-a … f | `56c08f1` `cf2fec8` `7d8cb39` `8cdda7b` `3dfdc26` `6a571de` | 2026-08-05 |
| G-FU-f2 (post-report) | `9c9fe42` | 2026-08-06 |
| §SPARK-01-FU + §LXX-01-FU (post-report) | `3338def` | 2026-08-06 |

All sixteen hashes cited in this report resolve at HEAD.

**Open at re-verification:** §VM-01-G4c-FU (three asks) · §VM-01-G2b-FU (five beats, now eleven —
§DX-02ft) · §DX-02fu (two unclaimed blocks) · §DX-02m (`_tourRoll` and the CY Madness Gate write
persisted state off the unseeded stream).
