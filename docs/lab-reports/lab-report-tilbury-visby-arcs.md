<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — Layers 54 + 55: Tilbury Harbor Arc + Visby Underground

**IEEE-format post-mortem · §DOC-02an verification pass**

| Field | Value |
|-------|-------|
| **Original date** | 2026-05-25 |
| **Ship commit** | `194a810` (2026-05-25 09:10:55 −0700) — verified |
| **Layers** | 54 (§XIX Tilbury Harbor Arc) · 55 (§XX Visby Underground) |
| **Codebase** | `play.html` — single-file browser RPG |
| **Verified against** | HEAD, 2026-08-12 (`a962c2a`), 79 days after ship |
| **Status** | ⚠️ **SHIPPED BUT UNREACHABLE** — 32/32 identifiers resolve; **1 of 7 quests is completable in play** |

> *Everything in this arc was built. Almost none of it can be reached. The two facts are
> independent, and only one of them is visible to a grep.*

---

## Abstract

Two arcs implemented as a structural pair. **Layer 54 (§XIX) — the Tilbury Harbor Arc
("The Conclave's Weight")** makes the Merchant's Conclave legible as a *bureaucracy* rather than a
setting: Harbor Master Rennau keeps a ledger of ten ships that never came back, the Conclave files
them as "weather losses," and a survivor of the most recent one walks into town three weeks later
with an account of what actually boarded her. **Layer 55 (§XX) — the Visby Underground ("What
Mordus Owes")** turns a 2,000gp Conclave debt into an investigation whose answer is that a
Void-aligned shaman invented a tribute in order to arm a goblin sub-clan. Both arcs converge on the
same revelation and were written to be completable in either order, with two conditional
cross-references rewarding the player who does both.

This pass re-measures every claim against HEAD. **Report-rot is near zero: all 32 named identifiers
resolve, every quoted line of dialogue is byte-verbatim at 79 days, the monster statline and drop
are exact, and the design's mechanism is intact end to end.** The defect is elsewhere. Four
independent blockers — one present on the day of shipping — mean the arcs' surfaces almost never
render: three of the four node codes the render blocks key on are **non-primary** in their map cells
(§AUDIT-03x), and the Tilbury arc's entire chain hangs on a flag with **no writer outside its own
completion handler**. The Void Shaman payoff both arcs exist to deliver has never been reachable.

---

## I. Design intent and what it buys the player

### A. §XIX — the Conclave as paper

Before Layer 54 the Tilbury harbor was scenery: a docks node with ambient text and one main-quest
beat, and no reason to return after Shard #1. Act II names the Merchant's Conclave as the region's
power structure, and the player could not *touch* it.

The arc's answer is a ledger. The harbor board lists ten ships by name and days overdue — **HARROW
(Day 17) … SUNDRESS (Day 107)** — all filed identically. **The playability argument is that scale
is legible before the story starts:** the player does not learn there is a missing ship, they see
ten, and the institution's failure is a *quantity* rather than an assertion. Rennau supplies the
one line that turns a list into a grievance — *"I stopped calling them that six weeks ago."*

The payoff, Ori, is a **non-combat resolution**: the sole survivor of the Harrow walks in on her own
and only has to be spoken with. In a game whose default verb is a d20, an arc that resolves entirely
through testimony widens the vocabulary of what "finishing something" can feel like.

### B. §XX — the debt as investigation

Warlord Mordus existed only as a main-quest bounty beat. Layer 55 gives him a *position*: he owes
the Conclave 2,000gp for a weapons shipment that never arrived, and he cannot pay because he does
not know where the weapons went. **The player's leverage is being nobody** — Solvak cannot get in
the door, and you can, because you are not Conclave.

The chain is Solvak → Mordus → Yva → the Hollow Hands → the shaman, and each link is a person
rather than a lock. Yva's line is the arc's thesis in one sentence:

> *"The shaman told them the weapons were tribute Mordus owed them. Mordus never paid tribute. The
> shaman invented a tribute that made the Hollow Hands feel owed. That's the part that scares me."*

### C. The structural pair

Both arcs argue the same thing: **the Conclave is competent at paperwork and incompetent at the
world.** The ledger records ten losses accurately and closes the case; the debt instrument is
legitimate and was written against weapons stolen by a Void entity. Both end with a player who knows
more than the institution that governs the territory — which is the emotional precondition for the
Act V–VIII shard hunt, where no institution is coming to help.

**Why the pair matters mechanically:** the two arcs share no gate, so they are order-independent, and
they cross-reference each other in exactly two places. That is the cheapest possible form of
narrative reward — a player who did both gets one extra sentence in each direction and nothing is
withheld from a player who did one.

---

## II. Method

1. Batch census of every identifier the report names (`grep -cF`), partitioning it into resolves /
   dead before reading the prose (§DOC-02b instrument).
2. `git log -S` on every claim that looked absent, to separate **RETIRED** from **NEVER SHIPPED**
   (instrument 4).
3. Archive reads at `32c10c5` (2026-05-24, earliest surviving build) and at the arc's own ship
   commit `194a810`, because HEAD cannot adjudicate a claim about 2026-05-25 (instrument 8/11).
4. **Call-path trace for every specified behaviour, not just symbol resolution** (instrument 31) —
   which is what found the headline.
5. Cell-primacy computation over `NODE_MAP` declaration order (§AUDIT-03x method) for all six nodes
   the arcs touch.

---

## III. As-built inventory (verified at HEAD)

### A. Monster layer — exact

| Item | Spec | HEAD | Verdict |
|------|------|------|---------|
| Statline | `ac:13 hp:22 atk:4 dmgDie:6 dmgCount:1 dmgFlat:2 tier:'easy'` | `name:'Hollow Hands Guard'@5408` | **byte-exact** |
| Drop | → "Hollow Hands Seal", 🖤, `sell:0` | `hollow_hands_guard:   { name:'Hollow Hands Seal'@5850` | **byte-exact** |
| Terrain pool | added to `goblin_cave` | `P.hollow_hands_guard ] }@6312`, 13th of 13 | **live** |

### B. State fields — 8 of 8 live under their specified names

`tlLedgerRead: false@23136` (with `tlEmbargoChallenged` · `tlEmbargoDismissed` ·
`tlMissingShipSolved`) and `vsDebtProbed: false@23138` (with `vsWeaponsFound` · `vsDebtSettled` ·
`vsShamanKnown`). Cross-arc: `wardensLegacyKnown: false@23140`, `vaLastWardVisited: false@23134`.

### C. NPC profiles — 4 of 4 live, canonical keys

| Key | Name | Node (spec → HEAD) |
|-----|------|--------------------|
| `rennau: { meta: { name:"Harbor Master Rennau"@10411` | Harbor Master, Conclave Tier 2 | SF → **STN** |
| `vonn: { meta: { name:"Adjutant Vonn"@10412` | Adjutant, Tier 3 | TL → **TL** (a different TL — §V-B) |
| `solvak: { meta: { name:"Debt Agent Solvak"@10413` | Debt Agent, Tier 3 | VS → **VS** (likewise) |
| `yva: { meta: { name:"Yva"@10414` | Goblin broker | GC → **TRD** |

All four survived §AUDIT-03n's key audit under the keys the favor ledger actually writes — no
surname split. Every quoted line verifies verbatim: Rennau's *"The ledger goes back eleven
months…"*, Rennau at Dear Friend (*"…didn't have a name"*), Solvak's *"He didn't have you
removed"*, Yva's *"I don't know who they answer to."*

### D. Quest chain — 7 of 7 live as UQF-1.0

| Quest | Title | Completion (HEAD) | Payout |
|-------|-------|-------------------|--------|
| `quest_tl_01: { id:'quest_tl_01'@11170` | Rennau: The Ledger | `flags:['tlLedgerRead']` | Harrow Manifest, Rennau → Friendly |
| `quest_tl_02` | Rennau: The Embargo | `flagsAny:['tlEmbargoChallenged','tlEmbargoDismissed']` | +150gp if challenged |
| `quest_tl_03` | Rennau: The Missing Ship | `flags:['tlMissingShipSolved']` | +300gp, Ori's Account, Dear Friend |
| `quest_vs_01: { id:'quest_vs_01'@13504` | Solvak: The Collector | `flags:['vsDebtProbed']` | Solvak → Friendly |
| `quest_vs_02` | Yva: The Broker | `flags:['vsWeaponsFound']` | Hollow Hands Seal, Yva → Friendly |
| `quest_vs_03` | Mordus Pays | `flags:['vsDebtSettled']` | +400gp, sets `vsShamanKnown` |
| `quest_vs_warden: { id:'quest_vs_warden'@13549` | The Warden | `flags:['wardensLegacyKnown']` | +600gp, Warden's Token |

All seven migrated cleanly through §ARCH-01 (`a79c76a`, Wave 7c), which replaced a 61-id hardcoded
effects block with per-quest `onComplete` bit chains.

### E. Player-facing surfaces — all built, all verbatim

- **Harbor board**, ten ships: `Harbor Board — Empty berths: HARROW (Day 17)@34815` — identical to
  the report's transcription, including the Harbor Master's appended note.
- **Vonn's two-button choice** at `if (node.code === 'TL') {@34838` — Report (+150gp) / Leave it.
- **Ori**, migrated to the verb registry: `id:'stn-ori'@34344`.
- **Solvak + Mordus** two-beat dialogue at `if (node.code === 'VS') {@34878`, 800 ms delay intact;
  the cross-reference `const harrowNote = S_story.tlLedgerRead@34890` is byte-verbatim.
- **Yva**, migrated to the verb registry as the **first price in the game paid through the `cost`
  opcode**: `{ kind:'cost', gold:50, refuse:@34356`. Her Tilbury cross-reference
  (*"Whatever got that ship wasn't them"*) is verbatim inside the same bit chain.
- **Seal delivery** at VS, 600 ms Mordus response, verbatim.
- **§XXI Warden hook**: `function _nodeHookVoidShamanWarden(node) {@31694`, gated on
  `node.code === 'GVA' && S_story.vsShamanKnown@31696` — the specified information order
  (know the shaman exists, *then* seek them) survived a full re-architecture unchanged.

---

## IV. Spec → shipped delta table

| # | Spec claim | HEAD | Verdict |
|---|-----------|------|---------|
| 1 | 32 named identifiers | 32 resolve | **100 % — the strongest census in the program** |
| 2 | All quoted dialogue | verbatim at 79 days | **exact** |
| 3 | Node **SF** (Rennau, board) | retired; = `label:'The Map Shop'@8636` (`STN`, `num:9`) | **remapped, correct by `num`** |
| 4 | Node **DK** (the harbor, §I-A) | retired; = `label:'Harbor Docks — Tilbury'@8632` (`LCY`, `num:7`) | **remapped** |
| 5 | Node **GC** (Yva) | retired; = `TRD`, `num:26`, `goblin_cave` | **remapped** |
| 6 | Node **MT** (the Warden) | retired; = `GVA`, `num:50` | **remapped** |
| 7 | Node **BK** (Broken Tooth Tavern) | = `label:'Broken Tooth Tavern'@8684` (`VBY`, `num:25`); live `BK` is a *Birka beach* | **§AUDIT-03y — resolves, wrong place** |
| 8 | Node **TL** (Vonn) | **never existed at `194a810`** | **BORN DEAD** → §V-B |
| 9 | Node **VS** (Solvak/Mordus) | **never existed at `194a810`** | **BORN DEAD** → §V-B |
| 10 | `quest_tl_01` activates on SF arrival | `activateNode:'STN'`, `gate:{}` | shipped |
| 11 | `quest_tl_03` activates at `actNumber ≥ 4` | leg deleted — `actNumber` is `node.act`, constant per node, so the test could never change | **NOT SHIPPED — structurally dead when written**; replaced by `questsDone:['quest_tl_02']` |
| 12 | `quest_vs_01` activates at `actNumber ≥ 5` | same defect: `VS` is an act-2 node | **NOT SHIPPED — dead when written** |
| 13 | Vonn "does not accumulate favorability" | profile now carries a `friendly:` tier, and **nothing anywhere writes favor for `vonn`** | **delta — unreachable dialogue** (→ §DX-02az) |
| 14 | Yva paid 50gp, hard-gated refusal | `cost` opcode, refuse-at-click | **upgraded** — a hand-written price became the VM's first `cost` |
| 15 | "the board visit constitutes finding the manifest" | the board grants the item and **does not set `tlLedgerRead`** | **the arc's central defect** → §V-A |
| 16 | Seal drops from `hollow_hands_guard` but "has no effect" | still true, and the drop now mints an item **sharing a name** with the quest item | **open** → §AUDIT-03ap |
| 17 | "no in-world signal Ori has arrived" (§IV rec. 2) | shipped: `quest_tl_02.onComplete` narrates *"a survivor of the Harrow, three weeks on foot…"* | **CLOSED by a later pass** |
| 18 | Two-arc cross-references | both live and verbatim | shipped |
| 19 | `plan.md` (§V references) | deleted `5e48dd7`; content in `BACKLOG.md` / `plan-archive.md` | stale pointer |

---

## V. Reachability analysis — the finding

The report says *"Status: ✅ Implemented,"* and it is right. Implemented and **reachable** are
different predicates, and nothing in the 2026-05-25 toolchain could tell them apart.

### A. Blocker 1 — `tlLedgerRead` has no writer outside its own completion handler

`quest_tl_01`'s completion condition is `flags:['tlLedgerRead']`. The **only** write to that flag in
38,712 lines is `{ kind:'flag_write', set:['tlLedgerRead'] }@11172` — inside that same quest's
`onComplete`, which by definition runs *after* the completion test passes.

**The flag is its own precondition.** The harbor board — the surface the report names as the thing
that sets it — grants the Harrow Manifest and never touches the flag (`if (!S_story.tlLedgerRead) {@34809`
through the `hbBtn.remove()` that ends the handler).

**This is not migration rot.** At the arc's own commit `194a810` the shape was identical:
`completeFn:() => !!(S_story.tlLedgerRead)` with the sole writer inside the id-keyed reward block.
Instrument 8 verdict: **wrong the day it was written.**

Consequence: `tlLedgerRead` is permanently `false`, so `quest_tl_02`'s gate never opens, Vonn's block
(`S_story.tlLedgerRead && _tqs['quest_tl_02'] === 'active'@34841`) never renders, `quest_tl_03` is
never unlocked, Ori's verb never renders, Rennau never advances past Neutral, and Vonn never appears
in the NPC row (`TL:S_story.tlLedgerRead ? ['vonn'] : []@35145`). **The Harrow Manifest is obtainable;
the arc is not.**

This is the second instance of the class §AUDIT-03ai named on `quest_ng_02` — *the write-only defect
inverted: a completion flag nobody can write.* Two instances make it a pattern, and the pattern is
invisible to every existing gate: the symbol resolves, the quest parses, the bit contract validates.

### B. Blocker 2 — three of four render nodes are non-primary

`CELL_GRID` maps a cell to an **array** built in `NODE_MAP` declaration order, `cellCode` returns
`CELL_GRID[key]?.[0]`, and `S_story.currentCode = destCode;@28373` can only ever be that primary
(§AUDIT-03x). A `node.code === 'XX'` block on a non-primary node is unreachable code.

| Node | Cell | Occupants (declaration order) | Primary? |
|------|------|-------------------------------|----------|
| `STN` (Rennau, board, Ori) | 18,180 | **LCY** · STN · SEN | ❌ 2nd of 3 |
| `TL` (Vonn) | 18,177 | **HOR** · BHD · HAV · LRD · HVY · TL · … | ❌ 6th of 13 |
| `VS` (Solvak, Mordus, seal) | 12,198 | **VBY** · NAS · CAN · BLT · VS | ❌ 5th of 5 |
| `TRD` (Yva) | 6,190 | **TRD** · NID | ✅ |
| `GVA` (the Warden) | 23,186 | **GVA** | ✅ |

Corpus-wide: **172 of 416 nodes are non-primary across 244 cells.**

**The provenance of `TL` and `VS` is worth recording in full**, because three separate repairs each
fixed a real defect and none of them reached play:

1. **2026-05-25 `194a810`** — the arc ships. `NODE_MAP` contains no `TL` and no `VS`. The two render
   blocks are dead on arrival (§AUDIT-03p "born dead" class).
2. **2026-06-03 `cb0fc35`** — a worldbuilder import titled *"2 new nodes (KHR/TUN)"* adds **four**:
   KHR, TUN, and — unmentioned in its own message — `TL: { num:278, name:"docks", label:"Bristol
   Harbor — Tilbury Docks"@9085` and `VS: { num:279, name:"market_quarter", label:"Visby Underground
   — Fence Quarter"@9088`. The dead references silently resolve again.
3. **2026-07-28 `c9f3946` (§VM-01-G3)** — correctly diagnoses that `NODE_MAP.VS` carried no `code`
   field and repairs it, recording in `world.md` that the arc "had shipped as code but was ENTIRELY
   DEAD in play." Cell primacy was not part of the diagnosis, so the blocks are still dead.

Both home docs mark the arcs live on the strength of step 3 — `quest.md:473`/`:560` carry `[✅ LIVE]`
on all six rows, and `world.md:204`/`:263` head both sections **✅ LIVE** with a *"revived §VM-01-G3
2026-07-28"* note.

**And the fix the arcs need is written in this report's own first paragraph.** §I-A opens with *"The
harbor in Tilbury existed as a node (DK — Harbor Docks)"* — `DK` is `num:7`, which is **`LCY`, the
primary of the very cell `STN` is buried in.** Likewise `VS` sits behind `VBY`, the **Broken Tooth
Tavern**, whose node text already seats Warlord Kael Mordus at his corner table. Repointing the
Tilbury block `STN → LCY` and the Visby block `VS → VBY` makes both arcs reachable **and** puts each
scene in the fiction it was written for: the harbor board in a harbor instead of a map shop, and the
Mordus debt inside Mordus's tavern. No design call required.

### C. Blocker 3 — the one live path, and the character who is invisible on it

`quest_vs_02` is reachable, but not by the route the report specifies. Its gate
(`flags:['vsDebtProbed']`) is unsatisfiable, because `S_story.vsDebtProbed = true;@34894` lives in the
dead VS block. What saves it is a later pass: §BOARD-01-FU6 gave `quest_pachelbel_shipment:@21278`
and `quest_couperin_lute` each an `{ kind:'unlock', quests:['quest_vs_02'] }` edge, and
`unlock(bit, ctx)@22312` sets a quest active **without consulting its gate**. Both source quests
complete at MHQ and LLA, which are primaries.

So Yva's verb fires, the 50gp is paid, the Seal is granted, and `quest_vs_02` completes. **This is
the only one of the seven quests a player can finish.**

One casualty on that path: the NPC row gates Yva's *card* on a different condition from her *button*
— `TRD:S_story.vsDebtProbed && !S_story.vsWeaponsFound@35146`. On the live route `vsDebtProbed` is
false, so **the button to talk to Yva renders and Yva does not.** Two surfaces for one character,
gated on two conditions, one of them dead.

### D. Blocker 4 — the shared payoff is unreachable

`vsShamanKnown` is written at exactly one site: `quest_vs_03`'s `onComplete`. That quest completes on
`vsDebtSettled`, written only at `S_story.vsDebtSettled = true;@34913` — inside the dead VS block.
So `vsShamanKnown` is permanently false, the Warden hook's guard at `@31696` never opens,
`quest_vs_warden` never activates, the `MT_WARDEN` battle has no other entry point, and the
Warden's Token, the 600gp, and the three-way resolution (persuade / fight / neither) are all
unreachable.

**Both arcs were built to converge on this scene. It has never been played.**

### E. Scorecard

| Quest | Completable at HEAD | Why not |
|-------|---------------------|---------|
| `quest_tl_01` | ❌ | `tlLedgerRead` unwritable (§V-A) **and** `STN` non-primary |
| `quest_tl_02` | ❌ | gate needs `tlLedgerRead`; `TL` non-primary |
| `quest_tl_03` | ❌ | needs `tl_02` done; `STN` non-primary |
| `quest_vs_01` | ❌ | `vsDebtProbed` written only in the dead `VS` block |
| `quest_vs_02` | ✅ | §BOARD-01-FU6 referral unlock → `TRD` verb |
| `quest_vs_03` | ❌ | `vsDebtSettled` written only in the dead `VS` block |
| `quest_vs_warden` | ❌ | hook gated on `vsShamanKnown` |

**1 of 7.** Withheld from the player: 850gp of quest rewards, two readable items, one relic, four
favor advancements, ten lines of the best dialogue in Act II, and the Void Shaman reveal.

---

## VI. Design decisions — re-adjudicated

| Decision | 2026-05-25 rationale | Verdict at HEAD |
|----------|---------------------|-----------------|
| **Arcs completable in any order** | no shared gate; two conditional cross-refs | **Sound and intact.** The design survived a total quest-format migration untouched — the cheapest form of cross-arc reward there is. |
| **Vonn choice as moral marker** | asymmetric rewards, no systemic branch | **Sound, unverifiable in play.** Both flags have live writers and are read only by `quest_tl_02`'s completion; nothing downstream reads either, exactly as designed. |
| **Ori as non-combat resolution** | testimony, not investigation | **Sound.** It also made the verb migration trivial: `stn-ori` is a two-bit chain (narrate, set flag). Simple designs migrate. |
| **`vsShamanKnown` at settlement, not defeat** | preserve information order | **Correct and load-bearing** — and it is precisely why §V-D propagates: a single flag carries the whole hand-off between Layers 55 and 56. |

---

## VII. Post-mortem register — the report's own three self-criticisms, verified

Per instrument 10, a report's self-criticism is a claim like any other.

1. **"The Vonn choice has no downstream consequences."** ✅ **Correct and still open.** Neither
   `tlEmbargoChallenged` nor `tlEmbargoDismissed` is read outside `quest_tl_02`'s completion test.
   The suggested Rennau variant was never authored.
2. **"No in-world signal that Ori has arrived."** ✅ **Correct, and CLOSED by a later pass.**
   `quest_tl_02`'s `onComplete` now narrates *"Then the docks deliver what no protocol could: a
   survivor of the Harrow, three weeks on foot, asking for the Harbor Master by name. Ori."* — the
   exact fix the register asked for, shipped by §BOARD-01-FU6's referral pass rather than by anyone
   reading this register. **1 of 3 recommendations shipped; the medium was narration attached to an
   existing chain, which is the 26th instrument's cheap-medium prediction holding.**
3. **"The Seal drops from `hollow_hands_guard` but collecting it has no effect."** ✅ **Correct and
   still open** — and now slightly worse: the trophy drop and Yva's `reward` bit mint two items with
   the identical name `Hollow Hands Seal`, while the delivery step strips them by name
   (`filter(i => i.name !== 'Hollow Hands Seal')@34914`). → §AUDIT-03ap.

---

## VIII. Defects filed

| ID | Severity | Summary |
|----|----------|---------|
| **§AUDIT-03ao** | 🟠 | Layers 54 + 55 unreachable: `tlLedgerRead` self-referential, and `STN`/`TL`/`VS` non-primary. Fix: give the harbor board the flag write; repoint the render blocks `STN → LCY` and `VS → VBY`. No design call. |
| **§AUDIT-03x** | — | Extended with the two arcs — the first case where **both** halves of a paired design are stranded, and the first where the correct destination is the *primary* of the same cell. |
| **§AUDIT-03ap** | 🟢 | `hollow_hands_guard`'s trophy drop shares a name with Yva's quest item; the delivery filter removes both, and the drop path still grants no flag. |
| **§DX-02az** | 🟢 | `vonn`'s `friendly:` dialogue tier has no favor writer anywhere in the file — an unreachable dialogue tier, a shape `check:deadconsts` does not yet cover. |
| **§DX-02q** | — | Extended: `TL`/`VS` were born dead, then **re-minted by an unrelated importer** as different nodes, so `check:noderegs` resolves them cleanly. A code that dies and is later reissued is worse than one that stays dead. |

---

## IX. References

| Target | Anchor |
|--------|--------|
| Monster | `name:'Hollow Hands Guard'@5408` · drop `hollow_hands_guard:   { name:'Hollow Hands Seal'@5850` · pool `P.hollow_hands_guard ] }@6312` |
| Nodes | `label:'Harbor Docks — Tilbury'@8632` · `label:'The Map Shop'@8636` · `label:'Broken Tooth Tavern'@8684` · `TL: { num:278@9085` · `VS: { num:279@9088` |
| NPCs | `rennau: { meta: { name:"Harbor Master Rennau"@10411` … `yva: { meta: { name:"Yva"@10414` |
| Quests | `quest_tl_01: { id:'quest_tl_01'@11170` · `quest_vs_01: { id:'quest_vs_01'@13504` · `quest_vs_warden: { id:'quest_vs_warden'@13549` |
| State | `tlLedgerRead: false@23136` · `vsDebtProbed: false@23138` · `wardensLegacyKnown: false@23140` |
| Render | `Harbor Board — Empty berths: HARROW (Day 17)@34815` · `if (node.code === 'TL') {@34838` · `if (node.code === 'VS') {@34878` · `id:'stn-ori'@34344` · `id:'trd-yva'@34352` |
| Engine | `unlock(bit, ctx)@22312` · `S_story.currentCode = destCode;@28373` · `function _nodeHookVoidShamanWarden(node) {@31694` |
| Home docs | `world.md` §Layer 54 / §Layer 55 · `quest.md` §Tilbury Harbor Arc / §Visby Underground Arc · `docs/story/story-arc-coastal.md` |
| Siblings | `docs/lab-reports/lab-report-void-shaman.md` (§XXI downstream of `vsShamanKnown`) · `docs/lab-reports/lab-report-weimar-scholar-gate.md` (`archiveLetterObtained` path) |

*(Original §V line numbers — 4624, 5051, 5426, 7691, 8436, 14458 — are history against a
17k-line file and are preserved only in the archive; HEAD pointers are above.)*

---

*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
