<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# The Four Courts of the Littoral Sea — §SIREN-01

**Project:** CodexOfConquest.com — *The Shattered Codex* · **Designation:** SIREN-01 (Layer 104)
**Classification:** Narrative Architecture · Social Skill Checks · Parallel-Quest Design
**Original:** 2026-05-28 · `roll2hit-v3.html` ~21,200 lines · ship commit **`42c2f82`**
**Verified against HEAD (38,712 lines):** 2026-08-12 (§DOC-02u)
**Verified status:** **Every authored artifact survives — quests byte-exact through a total format migration — and not one node of the arc can be reached by any player.**

> **HISTORY DOCUMENT.** Annotated, never rewritten to match HEAD. Claims that did not ship are
> marked **NOT SHIPPED** and **kept**; a silently deleted claim reads as one that held.

---

## Abstract

§SIREN-01 is a sequential ocean-route chain of ten nodes in which a knight on diplomatic commission
navigates four coastal courts, each ruled by a Lady who uses one word as a social instrument:
**BUSY** (*Occupée*), **MAYBE** (*Peut-être*), **FRIEND** (*Ami*), **SOON** (*Bientôt*). Each word is
a skill check — WIS Insight, INT Investigation, CHA Persuasion — testing whether the knight can read
a frame without being shaped by it. Three sea crossings separate the courts; a fifth, optional
encounter in a fog bank (LSO) reveals the Overseer, the thing that arranged the sequence.

Re-measured 76 days later: **the implementation is one of the most faithful in the §DOC-02 corpus and
the arc is 100 % unreachable.** All five quests survive the §ARCH-01 UQF migration **byte-exact** —
every DC, stat, skill, pass flag, fail flag and XP award; all ten state flags shipped in the specified
order in one contiguous block; all six NPC `quoteFn` state machines intact. But four of the ten nodes
were deleted, and **all six survivors are non-primary occupants of shared cells**, so none can ever
become `S_story.currentCode`. Zero of five quests can activate. The arc-close cannot render.

Two things went wrong, thirteen days apart, and neither was a decision about this arc.

---

## I. Intent, Inspiration, and What It Buys the Player

*(Restated from the original Abstract, §I and §V — the part of this document that survived best, and
the reason the work was done.)*

**The inspiration** is a psychology-of-relationship-dynamics transcript identifying four ordinary
words that operate as interpersonal *framing tools* rather than statements of fact. The transcript
calls this **"the quietest weapon,"** because **"it leaves no fingerprints."**

| Word | Mechanism | The court that is it |
|---|---|---|
| **BUSY** | Intermittent reinforcement — warmth in short unpredictable bursts, watching whether you adjust downward. *"Not measuring her schedule. Measuring you."* | **Lady Aurel**, the tide keep. Every appointment is borrowed from a schedule she administers. |
| **MAYBE** | *"A soft, subtle cage."* Keeps you available without requiring commitment. | **Lady Calice**, the drawbridge. *"Perhaps at the evening tide."* The wheel that lowers the bridge is in the courtyard. It is not locked. No one mentions it. |
| **FRIEND** | *"The sharpest downgrade delivered without sounding cruel."* The role is assigned, not offered. | **Lady Mireille**, the cape court. You are introduced as *"my most trusted companion"* before you can introduce yourself. |
| **SOON** | *"A future that never arrives because it was never meant to."* | **Lady Solen**, the far harbor. A named ship on the horizon, three seasons unmoving. The fishermen at the dock know. No one asks them first. |

**Why this is a game mechanic and not an essay.** The transcript's thesis — *"the danger isn't the
word, it's the man's willingness to surrender his emotional center"* — maps onto a d20 with no
translation loss. **PASS = you held your position. FAIL = you adjusted to fit the frame.** The three
betrayal flags (`betrayalThought` · `betrayalWord` · `betrayalDeed`) are the mechanical record of that
adjustment, and the arc-close at LCA reads the count back without judgement:

> **0 betrayals —** *"You gave them nothing but your position."*
> **3 betrayals —** *"You gave something at each harbor that you did not mean to give."*

**What it adds to the game, concretely:**

1. **A skill check that is not a lock.** Most `skill_check` quests gate a reward; these gate *who you
   were at the end*. Failing still gets you the seal — Lady Aurel was always going to give it — so the
   check measures a cost the quest log cannot show you.
2. **Failure with a memory.** Three fails become a state carried to a terminal node and narrated back.
   Almost nothing else in the engine accumulates a *character* score across an arc.
3. **The sea as control group.** The Ladies never fight; the ocean does — and the source material is
   blunt about why: **"women aren't the enemy."** The sea is what the manipulative dynamic is *not*:
   honest about what it wants. The serpent passage put it best — the charts name that water *la mer
   des serpents*, **"not as a warning but as a classification."**
4. **A final check that is harder for being transparent.** After three courts, the thing that built
   them offers help. It costs *"nothing"* — one word, one framing, at Port Solen. DC 15, matching the
   Succubus charm save (MM p.349). *"The most effective intervention is the one that appears to be
   assistance."*

**The register.** Compressed present-tense French vignette, inherited from the grief arc (§GR) and the
Paul arc (§LIX–§LXIX): two perspectives implied per encounter and neither named; **objects carry the
weight** (the tide table, the bridge chain, the herald at the door, the ship on the horizon); **no
editorial comment.** The arc never says *you were manipulated.* It says what happened and hands the
interpretation to the player.

---

## II. Method

Program instruments applied: batch symbol census before reading · `git log -S` on every dead symbol ·
**instrument 18** (the earliest surviving build `32c10c5` *predates* this report by four days, so the
reference is the arc's own **birth commit `42c2f82`**) · **instrument 19** (a reachability closure over
`CELL_GRID`, run because the report describes a multi-quest chain) · **instrument 14** (the closure's
totals reconciled against `check:dupkeys`' node count before any delta was derived).

---

## III. As-Built Inventory (HEAD)

**Nodes — 6 of 10 survive.** `LC1:{ num:112, code:'LC1'@8531` · `LC2:{ num:114, code:'LC2'@8535` ·
`LC3:{ num:116, code:'LC3'@8539` · `LC4:{ num:118, code:'LC4'@8543` ·
`LSO:{ num:120, code:'LSO'@8547` · `LCA:{ num:119, code:'LCA'@8551`.
**Deleted:** `LJ0` · `LJ1` · `LJ2` · `LJ3`.

**Quests — 5 of 5, UQF-1.0.** `quest_aurel_tide: { id:'quest_aurel_tide'@11560` ·
`quest_calice_bridge: { id:'quest_calice_bridge'@11576` ·
`quest_mireille_ami: { id:'quest_mireille_ami'@11592` ·
`quest_solen_horizon: { id:'quest_solen_horizon'@11608` ·
`quest_sea_overseer: { id:'quest_sea_overseer'@11624`.

**State — 10 of 10, contiguous.** `// §SIREN-01: Littoral Courts@23181` …
`solenSoonRead: false, littorialComplete: false,@23185`.

**Voice — 6 of 6 `quoteFn` state machines.** `LC1: { name:'Lady Aurel', quoteFn:() => S_story.aurelTideRead@22541` ·
`LCA: { name:'Harbor Keeper', quoteFn:() => S_story.littorialComplete@22559` ·
`LSO: { name:'The Overseer', quoteFn:() => S_story.charmResisted@22562`.

**Panels — 2 of 2.** `{ id:'story-lso-trigger', nodes:['LSO'],@31345` (repointed — Finding 3) ·
`{ id:'story-lca-close', nodes:['LCA'],@31350` with `const _bc = (st.betrayalThought ? 1 : 0)@31353`.

---

## IV. Spec → Shipped Delta Table

| # | Report claim (§) | HEAD | Verdict |
|---|---|---|---|
| 1 | 5 quests: IDs, nodes, stats, skills, DCs 12/13/14/13/15, pass+fail flags, XP 150/175/200/225/250 (§II-B) | Every field exact, through the §ARCH-01 migration | ✅ **BYTE-EXACT, 25/25 fields** |
| 2 | `quest_solen_horizon` has no fail flag (§II-B, §V.2) | Ships `onFail:[]`; the migration comment says so independently | ✅ EXACT |
| 3 | 10 `S_story` flags in the listed order (§II-D) | One contiguous block, specified order, specified comment header | ✅ EXACT |
| 4 | 6 NPC multi-state `quoteFn` entries (§II-C) | All six, with the pass / in-progress / default structure | ✅ EXACT |
| 5 | `littorialComplete` set by the Harbor Keeper's first-visit mutation, not a quest (§V.5) | Exactly that, inside the LCA `quoteFn` | ✅ EXACT |
| 6 | 10 nodes, `NODE_COORDS` for all 10, column 14 in 2-row steps (§II-A) | **10/10 exact at the birth commit**; 4 nodes since deleted; coordinates since migrated to the 90×360 grid | ✅ **at birth** → **RETIRED** |
| 7 | 3 sea crossings: Sea Spawn ×2, Deep One ×3, the Serpent (§II-A) | **All three byte-exact at birth; all three deleted.** Every surviving node is `battle:null` | ❌ **RETIRED — the whole combat layer** (Finding 2) |
| 8 | LJ3 navigator trigger fires pre-encounter, pointing east to the fog (§II-E) | Repointed to `LSO` — the node it points *at* | ⚠️ **MISDIRECTED** (Finding 3) |
| 9 | LCA arc-close, 3-way betrayal count (§II-E) | Live and exact, all three variants | ✅ EXACT — but unreachable |
| 10 | Betrayal flags set via `checkFailFlag`, "supported at line ~6203" (§V.3, §VI) | Field **retired** by §ARCH-01; 3 hits, **all in migration comments** | **RETIRED — rationale is now archaeology** |
| 11 | Baseline *"~21,200 lines at session close"* (header) | `42c2f82` = **21,242 lines** | ✅ **EXACT within its own tilde** |
| 12 | maps.md / story.md / world.md / quest.md / index.md sync ⚠️ PENDING (§VI) | **All five closed** | ✅ **CLOSED — verify by measurement** |
| 13 | Arc is playable from DS.E to LCA (§Abstract, §II-A) | **0 of 6 nodes reachable; 0 of 5 quests can activate** | ❌ **ENGINE-ROT, TOTAL** (Finding 1) |
| 14 | `littorialComplete` (sic) | Shipped with the misspelling, permanently | ⚠️ **the doc became the schema** (Finding 5) |

---

## V. Findings

### Finding 1 → §AUDIT-03x extended — the first 100 % casualty in the program

`const CELL_GRID = (() => {@9852` groups nodes by cell in `NODE_MAP` **declaration order**, and only
`list[0]` can ever be reached: `S_story.currentCode` is assigned at exactly two sites, and the one
that matters is `S_story.currentCode = destCode;@28373`, which always yields the primary. Measured
closure over all 416 nodes (**244 cells, 172 non-primary** — exact against §AUDIT-03x's recorded
figures):

| Node | Cell | Position | Reachable? |
|---|---|---|---|
| LC1 Port Aurel | `32,203` | 3rd of 17 | ❌ `list[0]` = `SEA` |
| LC2 Port Calice | `32,203` | 4th of 17 | ❌ |
| LC3 Port Mireille | `32,203` | 5th of 17 | ❌ |
| LC4 Port Solen | `32,203` | 6th of 17 | ❌ |
| LSO The Fog Bank | `32,203` | 7th of 17 | ❌ |
| LCA Southern Anchorage | `35,213` | 2nd of 2 | ❌ `list[0]` = `CI2` |

`LC4:{r:32,c:203},@9773` and `LCA:{r:35,c:213},@9812` are the coordinates that did it. Since
`function _uqfActivateAtNode(node) {@30137` keys on `node.code`, **all five quests are stranded**;
since the arc-close is a node panel, **the ending cannot render either**.

**This is the largest proportional casualty §AUDIT-03x has produced.** §CROWN-01 lost 24 of 34 quests
and kept two reachable nodes; §DOC-02r's prosocial family lost 28 of 51. §SIREN-01 loses **6 of 6
nodes and 5 of 5 quests — everything.** There is no partial experience to salvage and no entry point
that still works. ***And nothing in the repo says so:*** `quest.md` lists all five as **"✅ LIVE
§SIREN-01"**, which is true of `QUEST_DB` and false of the game. That gap is exactly what §DX-02w
(`check:cellprimacy`) exists to close.

### Finding 2 — the ocean was deleted by a commit about memory allocation

The report's structural thesis is one sentence: **"The Ladies never fight. The ocean does."** At the
birth commit all three crossings are present and byte-exact to §II-A —
`battle:{label:'Sea Spawn × 2', key:'sea_serpent', count:2}`,
`battle:{label:'Deep One × 3', key:'deep_one', count:3}`,
`battle:{label:'The Serpent of the Passage', key:'sea_serpent', count:1}` — carried on the four
junction nodes LJ0–LJ3.

They were removed on **2026-06-10 by `a61d6eb`**, whose subject line is *"fix: P5 batchEditNode O(M)
rewrite + P6.5 DELTA key crash"* and whose body describes, in detail, an O(N×M) string-allocation
rewrite and a `DELTA['N']` key-casing crash. **It says nothing about world content.** Four nodes and
an entire combat layer left in the same diff as a garbage-collection yield.

Two consequences worth separating:

- **The arc's contrast is gone.** Every surviving node is `battle:null`. What remains is four courts
  and a fog bank — the language half of a design whose whole point was the alternation.
- **The design is now FORBIDDEN, not merely absent.** The crossings were `junction:true`, which
  `check:invariants` **I2 fails outright** (*"junctions were bulk-deleted in §WALK-1/§CELL-05"*). So
  restoring them verbatim is a CI failure; the sea has to come back some other way.

***A deletion that is correct as tooling and catastrophic as content will not describe itself in the
commit message. Read the diff, not the subject line.***

### Finding 3 → §AUDIT-03af — the engine's own comment is wrong about the past, and the wrong diagnosis produced the wrong fix

Live at `§VM-01-G1-FIX: originally keyed to 'LJ3', a dead@31341`, the comment reads:

> *"originally keyed to `'LJ3'`, a dead node code **no NODE_MAP entry ever carried**, so this panel
> had **NEVER rendered**; remapped to LSO … the quest's own `activateNode`."*

**Both clauses are false.** At `42c2f82`:
`LJ3:{ num:117, code:'LJ3', name:'junction', label:'The Serpent Passage', act:4 …}` — a real
`NODE_MAP` entry carrying the arc's hardest battle. The panel therefore **did render**, for thirteen
days, exactly where it was designed to. `LJ3` was **RETIRED** on 2026-06-10, not born dead.

The correction matters because it is **causal**. The teaser exists to tell you there is something in
the water *to the east* and send you to find it. Believing it had never worked, the fix pointed it at
`LSO` — **the fog bank itself**. It now announces the discovery to a player standing inside it:

> *"They are also, in a second and quieter register, speaking to something in the water to the east."*

This is §DOC-02g's rule in its live form, and its second confirmed instance: ***a migration commit's
own comment is a claim about the past, usually written from memory rather than from the diff. Being
"in the code" confers no authority about history.*** The general shape: **a dead node code is usually
a RETIREMENT, and diagnosing it as born-dead licenses a remap that a retirement would forbid.**

### Finding 4 — instrument 18, and a rare clean result: this report was written from the file

The header claims *"~21,200 lines at session close."* `42c2f82` is **21,242** — exact within its own
tilde, and **the first §DOC-02 baseline in three increments to match a real commit** (§DOC-02s and
§DOC-02t both described working trees that were never committed). §II-A's ten coordinates are
**10 of 10 exact at birth** — column 14 in 2-row steps from LJ0 (25,14) to LCA (41,14), plus LSO at
(37,18), *"gap = 4, within probe range"* included. **Zero fabricated identifiers, zero invented
statlines.** Instrument 12's usual gradient never appears, because there is nothing composed here to
be wrong: this document is a build record, not an argument.

### Finding 5 — the misspelling that became the schema

`littorialComplete` — not *littoral* — is live in `_S_DEFAULTS()` and in both branches of the LCA
`quoteFn`. The report spells it that way **consistently**, including in the `lp` print command in its
own header (`lab-report-littorial-courts-story.txt`), while the arc, every node label, all five home
docs and the report's own title say **Littoral**.

§DOC-02d's lesson in field-name form: ***fix the spelling in the doc before the doc becomes the
schema.*** Cosmetic, and effectively permanent — the field is persisted to `localStorage`, so renaming
it breaks every existing save. Recorded, not filed.

### Finding 6 — five deferred sync items, all closed, verified by doing it

§VI marks maps.md · story.md · world.md · quest.md · index.md as **⚠️ PENDING — increments 2–6.**
All five carry §SIREN-01 content at HEAD, and one is better than closed: `world.md:493` already
annotates the dead crossing as **"`LJ3` (historical — no live node)"** — the §AUDIT-03m annotation
pass doing its job on this very arc. ***Re-score a residual list every pass; §DOC-02j and §DOC-02s
both found status blocks stale in the "already shipped" direction, and this is the third.***

### Finding 7 — `checkFailFlag` is retired, and the migration left a receipt

§V.3 argues the betrayal flags should ride `checkFailFlag` because *"the field is already supported by
the skill-check handler."* §ARCH-01 retired it. Three hits remain, **all inside comments** — dead by
the standing rule. But the comment that replaced it is a model of how to retire a field:
`retryable:false so the fail flag grants once). xpAward→reward. solen_horizon had no@11557` and
`and the LJ3/betrayalCount blocks — mission_bit sets the flag + grants the token identically.@11559`
record the whole translation, including the `onFail:[]` special case — **independently confirming
§II-B's note about Port Solen 71 days later.** ***A migration that writes down what it mapped to what
is the reason this report's quest table could be scored 25/25 instead of guessed at.***

---

## VI. Defects Filed

| Row | Defect | Design call? |
|---|---|---|
| **§AUDIT-03x** *(extended)* | §SIREN-01 is the first **100 %** casualty: 6 of 6 nodes non-primary, 5 of 5 quests unable to activate, arc-close unable to render. Five nodes sit in the 17-node cell `32,203`. | 🟠 Yes — the standing §AUDIT-03x call |
| **§AUDIT-03af** | The `§VM-01-G1-FIX` comment states `LJ3` was a code *"no NODE_MAP entry ever carried"* and *"had NEVER rendered"*; both are false at `42c2f82`. The false diagnosis licensed remapping the navigator teaser onto `LSO`, the node it exists to point at. Correct the comment (🟢); re-place the panel (🟡 small call). | 🟡 Mixed |
| **§SIREN-01-FU** | The arc's entire combat layer died with the junction nodes, and `junction:true` is now CI failure **I2**, so it cannot be restored as written. Decide: re-express the three crossings as `battle` fields on real nodes, or accept a court-only arc and cut the "the ocean does" thesis from the docs. | 🟠 Yes |
| **Doc note** | `quest.md` marks all five quests **"✅ LIVE"** — true of `QUEST_DB`, false of the game. Not an error to fix by hand; it is the argument for **§DX-02w** (`check:cellprimacy`). | 🟢 No |

---

## VII. Design Material Retained

Kept because no maintained doc carries it and this report is its only copy:

- **The four-word source table** (§I above) and the mapping rule that makes it mechanical: *the check
  tests whether the knight holds their position or adjusts to fit the frame.*
- **Why the Overseer is a parallel quest, not a boss** (§III-A/B): the four Ladies are administrators
  of a pattern, not its architects. The Overseer is the layer above, and its test is harder precisely
  because it is **transparent** — it does not conceal the offer. *"A hostile voice can be refused. A
  helpful voice requires a different kind of refusal."*
- **Why the fail flag is `seaOverseerMet` and the pass flag is `charmResisted`** (§III-C): failing
  means you met it on its terms. The asymmetry is the point.
- **Why Port Solen has no fail flag** (§V.2): the letters come regardless. The fourth pattern's
  failure is narrative — you waited — and three flags already produce a meaningful score.
- **Why the Overseer appears at the last crossing** (§V.4): *"The Overseer offers the shortcut at the
  exact moment when shortcuts look most attractive: one more court, after three, after a long
  battle."* Worth preserving as a placement principle even though the node it names is gone.
- **The dispositions**, which are the arc in miniature:
  *"The tide keeps its own schedule. Everything else negotiates."* — Port Aurel ·
  *"The evening tide is reliable. The question is whether you need it to be."* — Port Calice ·
  *"He addressed the court directly. It was unexpected. I found it clarifying."* — Lady Mireille ·
  *"The fishermen remember. They always remember."* — the dock at Port Solen.

---

*Original report 2026-05-28, ship commit `42c2f82`.*
*Verified and rewritten 2026-08-12 under §DOC-02u against `roll2hit-v3.html` at 38,712 lines.*
*Four courts, five quests, ten flags, every string intact — and a sea that is no longer there.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
