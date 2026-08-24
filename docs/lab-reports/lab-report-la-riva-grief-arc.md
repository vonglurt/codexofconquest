<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — La Riva: Grief as a Causal Mechanic, and the Vignette Layer

**Project:** CodexOfConquest.com — *The Shattered Codex* · **Designation:** GR-01 (Layer 78)
**Original session:** 2026-05-26 · **Verification pass:** 2026-08-12 (§DOC-02s)
**Category:** Narrative architecture · grief-as-mechanic · French vignette technique · romance layer

> **STATUS — VERIFIED, AND THE STRONGEST SURVIVAL IN THE §DOC-02 PROGRAM TO DATE.** This is a
> HISTORY document; the 2026-05-26 text has been re-measured claim-by-claim against live
> `play.html` and rewritten short. Claims that did not ship are marked **NOT SHIPPED** and
> **kept** — a silently deleted claim reads as one that held. **43 of 46 named identifiers resolve
> (93 %), every quoted string is verbatim after 78 days, and the arc is fully reachable** — the
> first §DOC-02 increment in six to find no §AUDIT-03x casualty. The deltas are three: a retired
> hour-counter row, a favor write that bypasses its own host helper, and one deferred item that is
> still deferred and now matters more than it did.

---

## Abstract

This report documents the grief arc for *The Shattered Codex* — Layer 78, "La Riva" — and the
distributed vignette technique it generalised into. Three inputs: the French vignette tradition as
practised by Chrétien de Troyes; grief-transcript analysis, specifically the object-centering and
peripheral precision characteristic of bereaved speech; and the existing HTML, which already
contained every causal and narrative element the arc needed. **The work was excavation, not
invention.**

The central thesis: **grief is not a decorative layer over the combat system — it is the human
register of the same void-corruption mechanism that drives combat and exploration.** The arc adds no
lore. It makes existing lore legible.

Re-measured at 78 days, the thesis holds and the implementation is intact. The report also documents
the romance architecture (`ROMANCE_QUOTES`, `NPC_ROMANCE_PREAMBLES`, `NPC_ROMANCE_VIGNETTES`,
`INN_DREAMS`), which applies the same compression to a different register — attachment rather than
loss — and the hour-counter wiring that made elapsed time a resource rather than a display.

---

## I. Intention, Inspiration, and What This Adds to the Game

*(Drawn from the original Abstract, §I, §X and §XI, and stated here as one argument rather than four.)*

### I-A. The intention

Most games treat grief as cutscene material: a death happens, a character emotes, the player
proceeds. The stated intent of Layer 78 was the opposite — **make grief a downstream consequence of
a mechanic the player has already been operating**, so that the emotional layer and the systems layer
are the same layer viewed from different ends.

### I-B. The inspiration, and what each source contributed

| Source | What it supplied | Where it lands in the engine |
|---|---|---|
| **Chrétien de Troyes** — *Erec et Enide*, *Yvain*, *Cligès*, *Lancelot* | Emotion encoded as a **prior observable act**, never declared. Erec watches the gate after she has passed through it; Lancelot hesitates two steps before the cart and does not know he did | The six `const NPC_ROMANCE_PREAMBLES = {@27481` — *"She looks up before you reach the corner."* · *"The cup is already on the table."* All six verbatim at HEAD |
| **Grief-transcript analysis** | Bereaved speech exhibits (a) extreme precision about peripheral facts as a containing structure, (b) surviving objects carrying the relationship | Froberger Entry 12's avalanche guide, who *"sealed the cracks with accuracy"*; Connie's counting ritual — *"Everything I could still name by shape"* |
| **The five-act object form** | Five acts, each named for one surviving object; two perspectives per act; the gap between them carries the charge | `story.md §GRIEF AND CORRUPTION` — net → crate → account book → key → market |

**The derived design principle, unchanged and still governing:**

> **Never declare the emotion. Name the object. Name what the person does with it. The gap between
> two people doing different things with the same object is the emotion.**

### I-C. What it adds to playability

1. **It converts a boss kill into a consequence.** Defeating the Cat-King already paid XP and gold.
   `S_story.catKingDefeated = true;@25375` now also opens a chain, so the fight acquires an aftermath
   the player chooses whether to walk into. **The combat reward is unchanged; what changed is that
   the fight now has a place to point at.**
2. **It gives a repeatable encounter a non-combat reason to be repeated.** The five Corrupted Cats at
   AMS use `corridor:true@31911` with `count:1` — deliberately trivial. The player is not being
   challenged; they are being **paced**. Difficulty would have been the wrong axis.
3. **It makes an item's uselessness the point.** Both arc items ship `sell:0` and are consumed by the
   chain. Vincenzo's Net and the Account Book are the only things in the arc the player can hold, and
   neither can be monetised — which is the mechanical statement of the arc's thesis.
4. **It closes on witnessing rather than restoration.** `laRivaComplete` + `fishmongerRowRestored`
   fire together, and the Row does not rebuild. **This is the design's sharpest claim and it is the
   one the engine now backs hardest** — see delta 8: the restoration payoff shipped six weeks later
   (2026-07-07) as a `textVariants` node-text swap that says *"two of the three blocks are still
   rubble."*
5. **It retrofits meaning onto dialogue the player has already read.** Kenickie's *"My guy Vinnie's
   got more next week. Maybe."* was written before the arc existed and was not modified. After the
   arc, the trailing *"maybe"* reads as grief. **Zero content cost, and it only works because nothing
   was changed.**
6. **It made elapsed time legible.** §VIII wired `hoursElapsed` / `hoursSinceSlept`, which had existed
   and never incremented. That counter has since become **load-bearing** (delta 10).

### I-D. The main points and their rationale, collected

| # | Point | Rationale |
|---|---|---|
| 1 | Grief is causally downstream of void corruption, not parallel to it | A second, decorative system would be cuttable. A consequence of an existing system is not |
| 2 | The arc introduces no new lore | Every element (Vinnie, the Cat-King, the three blocks, Corrupted Cats) was already in the file. Retrofit costs nothing and cannot contradict itself |
| 3 | Objects, not symbols | *"The net is not a symbol of Vincenzo. The net is the net he said to hang at dawn."* A symbol invites interpretation; a record does not |
| 4 | The gap between perspectives is the content | Two characters do different things with the same object and neither tells the other. The reader completes it; the text never does |
| 5 | Resolution is witnessing | The Row does not rebuild, Aldo keeps carrying the net, Kenickie does not say the name. Someone came. That is the whole change |
| 6 | The technique generalises down-register | The same compression drives the romance layer and the NPC quest dispositions — one revealing self-statement instead of a plot summary |

---

## II. The Corruption-Grief Chain

Every link was already present in the HTML before Layer 78:

```
Void pressure (CY → live HKG)
  → Merchant Cats deploy Corrupted Cat enforcers
  → void-accelerated merges produce Taz Devils
  → Taz Devils merge under the Cat-King
  → Cat-King destroys Fishmonger's Row (three blocks)
  → Vincenzo "Vinnie" Tuna dies (already named, in two unrelated Kenickie lines)
  → Connie + Aldo grieve unwitnessed
  → Corrupted Cats colonize the rubble — void and grief occupy the same ground
  → the Row becomes a second pressure node adjacent to the Cat Quarter
```

**The Vincenzo retrofit is the structural insight.** Both pre-existing Kenickie references survive at
HEAD, unmodified, 78 days on: the profile line *"My guy Vinnie's got a contact who knows a cat…"* and
the shop line *"Good choice. My guy Vinnie's got more next week. Maybe."* 🤌 The arc did not touch
them. It only made them connectable.

---

## III. The Five-Act Structure — Design Record

**The prose itself lives in `story.md §GRIEF AND CORRUPTION` (§LA RIVA — THE ROW, Acts I–V),
verified present and marked ✅ Implemented 2026-05-26.** That file is the maintained home doc, so the
act text is *not* duplicated here — only the design record it does not carry.

| Act | Object | Its function | The gap |
|---|---|---|---|
| I | **The Net** | The record of the last moment before the before — hung at dawn on Vincenzo's instruction, down when Connie reached the door | Aldo found it, folded it, carries it, has not told her. His logic — *"she hasn't asked, so she isn't ready"* — protects the carrier more than the protected. The reader sees this; neither character does |
| II | **The Crate** | Registers the Corrupted Cats as grief-colonizers, not just combat: the void settled where the grief settled | Connie's counting ritual is invisible to Sandy; Sandy's theory is invisible to Connie. The cats are the only element in both views |
| III | **The Account Book** | The material record of the Row's existence; Vincenzo's page is the last completed entry, the pages after it blank | Aldo has the record. Kenickie knows what it means. Neither has moved. They are not in the same room |
| IV | **The Key** | A bronze fish-stamped key that opens nothing; a persistence ritual older than the catastrophe | Two objects, two carriers, one shared understanding neither will name. The dignity of not requiring the other to perform grief is also a form of isolation |
| V | **The Market** | The act of witnessing. Nothing rebuilds | The player's arrival is the only change. The Covenant Keeper ending names each person helped — not to celebrate them, but to confirm that what they were carrying was seen |

*(Retained per the §DOC-02n precondition: `story.md` holds the prose but not the per-act object
function or gap analysis, so this table is the specification of record and deleting it would destroy
the only copy.)*

---

## IV. As-Built Inventory

| Structure | Shipped as | Status |
|---|---|---|
| Node FR — Fishmonger's Row | `AMS:{ num:79, code:'AMS'@8801` — `name:'ruins'`, `label:"Fishmonger's Row"`, `act:1`, node text byte-identical to birth | ✅ renamed, all fields preserved |
| Quest 1 — "What Remains" | `quest_la_riva_01: { id:'quest_la_riva_01'@13785`, `completion:{ flags:['connieMet'] }`, `waypointNode:'AMS'` | ✅ live (title now NPC-prefixed) |
| Quest 2 — "The Weight of a Net" | `quest_la_riva_02: { id:'quest_la_riva_02'@13795`, `countMin:[{path:'frCatKillCount',min:5}]@13795` + `itemsAll:["Vincenzo's Net"]`, `reward:500` | ✅ live, condition and reward exact — **§DX-02cm 2026-08-24 added `atNode:'AMS'` and moved the arc's six AMS effects into an `onComplete` chain; `reward:500` is still the dead display field (`q.reward` is intentionally NOT read@37032), the paying bit is `kind:'reward',gold:500`** |
| Quest 3 — "The Account Book" | `quest_la_riva_03: { id:'quest_la_riva_03'@13807`, `completion:{ flags:['laRivaComplete'] }`, `reward:0` | ✅ live |
| Activation | `S_story.catKingDefeated = true;@25375` → 2500 ms `setTimeout` → `S_story.quests['quest_la_riva_01'] = 'active';@25379` | ✅ delay exact as specified |
| Repeatable encounter | `corridor:true@31911`, `count:1`, `key:'corrupted_cat'` | ✅ exact |
| Item 1 | `name:"Vincenzo's Net", icon:'🎣', type:'key_item', sell:0@25360` — `description` **byte-identical** to the report's quotation | ✅ exact |
| Item 2 | `name:'Old Tuna Account Book',icon:'📒',type:'key_item',sell:0@13805` | ✅ exact — **§DX-02cm 2026-08-24 moved it out of the AMS render hook into the quest's own `onComplete` `reward` bit; the object is byte-identical, including the `description:` key the inventory renderer does not read (it reads `item.desc@31213` → §DX-02gd)** |
| State fields | `connieMet: false, fishmongerRowRestored: false, laRivaComplete: false, frCatKillCount: 0,@23123` — all four, **on one line, in the specified order** | ✅ exact |
| NPCs | `connie_tuna` + `aldo_sardino`, both with `node:"AMS"` in profile and dialogue | ✅ live |
| Delivery + Kenickie favor | `id:'cdg-la-riva-delivery'@34388` — a `NODE_VERBS` verb; `{ kind:'favor', npc:'kenickie', set:3 }@34397` | ✅ live, migrated to the VM (§VM-01-G4) |
| Romance layer | `const ROMANCE_QUOTES@22380` (**21**) · `const NPC_ROMANCE_PREAMBLES@27481` (**6**) · `const NPC_ROMANCE_VIGNETTES@27491` (**6**) · `const INN_DREAMS@27133` | ✅ all four, counts exact |
| Journal | `const FROBERGER_JOURNAL = [@27186` — **41 entries**, unchanged since the earliest surviving build | ✅ exact |
| Hour counter | `function _storyRollInit() {@24626` · `const _updateHeal = () => {@7134` · `function storyShortRest@25819` · `hoursElapsed  = (S_story.hoursElapsed  || 0) + 8@36283` / `S_story.hoursSinceSlept = 0;@36284` | ⚠️ 4 of 5 rows — see delta 9 |

**Census: 43 of 46 identifiers resolve (93 %).** The three that do not are `storyQuestHunt` and
`storyMove` (both **RETIRED**, delta 9) and `partial_market` (**never built**, and correctly filed as
deferred — delta 8).

---

## V. Spec → Shipped Delta Table

| # | Original claim | Shipped | Verdict |
|---|---|---|---|
| 1 | Node `FR` east of `CQ`, created this pass; `CQ.E = 'FR'` | **Right when written.** At the birth commit `dcb72cb` the file carries `FR:{ num:79, code:'FR', name:'ruins', label:"Fishmonger's Row", act:1, W:'CQ' …}`. §WALK/§NAV-01 renamed it `AMS` preserving `num`, terrain key, label and text, and deleted the compass fields | ✅ **RENAME, not error** (instrument 8, 6th consecutive) |
| 2 | Full activation sequence, 8 steps | Every step verifies, including the 2.5 s delay and the exact Kenickie line (*"you should go see what's left of the Row. Fishmonger's Row, one block east. Connie's still there."*) | ✅ EXACT |
| 3 | `activateCond` / `completeFn` as the activation mechanism | Both retired by §ARCH-01. All three quests ship `activateNode:null` with UQF `completion:{}`, driven by explicit `S_story.quests[…]` writes and a `NODE_VERBS` verb | ⚠️ MECHANISM MIGRATED, behaviour preserved |
| 4 | Quest titles "What Remains" / "The Weight of a Net" / "The Account Book" | Shipped NPC-prefixed: *"Kenickie: What Remains"*, *"Connie: The Weight of a Net"*, *"Aldo: The Account Book"* | ⚠️ COSMETIC |
| 5 | Rewards — 0gp / 500gp + Aldo Friendly / 0gp + Kenickie fav 3 | 500 and 0 exact; Kenickie `set:3` exact; Aldo `+1`, and the live tier scale is `>= 1` friendly, `>= 2` dearFriend, so **Friendly is correct** | ✅ EXACT |
| 6 | Vincenzo's Net `description` (quoted in full) | Byte-identical at HEAD | ✅ EXACT |
| 7 | Kenickie's closing line *"Yeah. Okay. I'll hold onto this."* | Byte-identical, as both `disposition` and delivery narrative | ✅ EXACT |
| 8 | §XI: `fishmongerRowRestored` "does not currently trigger any visual change at FR… deferred. Potential extension: terrain `ruins` → `partial_market`" | **The deferral shipped — under a different mechanism.** `textVariants:[{flag:'fishmongerRowRestored'@8802` swaps the node text to *"Two of the three blocks are still rubble. The third has a market in it — one stall…"*. `partial_market` has **0 occurrences**: the terrain swap was never built and did not need to be | ✅ **SHIPPED, better** — the flag went from write-only to read |
| 9 | §VIII hour table, five action types | `storyConfirmSleep` +8 / reset ✅ exact · `storyShortRest` +1/+1 ✅ · **battle** +1/+1 shipped at battle **start** (`_storyRollInit`), not victory · **`storyQuestHunt` +2/+2 RETIRED** by §TIMELESS-01 (`7952752`; 3 commits, born `e594848`) · **`storyMove` RETIRED** by §WALK/§NAV-01 (0 occurrences, 2 commits) | ⚠️ **3 of 5 rows stale — all RETIRED, none never-shipped** |
| 10 | §VIII: "Display thresholds (existing CSS, now active): 16h → `warn`, 24h → `danger`" | Exact (`aw >= 24 ? ' danger' : aw >= 16 ? ' warn'@36103`) — **and no longer display-only.** `0) >= 24) {@25048` imposes combat **disadvantage** at 24h without sleep, surfaced in the pre-battle warning | ✅ **UNDERSTATED** — the counter became a mechanic |
| 11 | §XI: Kenickie naming line for the Covenant Keeper ending "deferred" | `const SWEELINCK_NAMING_LINES = {@27239` holds exactly six keys — `yael · brynn · quill · pachelbel · crov · auros`. **Kenickie is not among them**, and the report's own suggested line has 0 occurrences | ❌ **NOT SHIPPED** — 78 days; see §VII |
| 12 | §V-E: fifth ending gated on `vaArchitectureKnown` + `entry42Written` + `ngPlusRun ≥ 1` | `if (S_story.vaArchitectureKnown && S_story.entry42Written && (S_story.ngPlusRun \|\| 0) >= 1) {` at two sites; text `Froberger wrote 41 entries. You wrote one.@28297` verbatim (report clipped the tail) | ✅ EXACT |
| 13 | §XI: Froberger Entries 17 and 29 need no further hooks | Both live, both quoted verbatim (*"The taxonomy stands corrected in any case"*, *"only gets worse with additional documentation"*) | ✅ EXACT |
| 14 | §VI romance counts — 21 quotes / 6 preambles / 6 vignettes | 21 / 6 / 6 | ✅ EXACT |
| 15 | §VII quest dispositions rewritten in character voice (3 quoted) | All three verbatim: `quest_brynn_ledger`, `quest_pit_training`, `quest_couperin_lute` | ✅ EXACT |
| 16 | Baseline *"18,324 lines at session close"*; Vinnie references at *"lines 7857, 15265"* | **No committed build matches.** The session's own commit `dcb72cb` is 18,462; the preceding commit `213d14b` is 18,130, with the Vinnie lines at **7855** and **15250**. All three numbers describe an **uncommitted working tree** | ⚠️ **UNVERIFIABLE, not wrong** — see §VIII |

---

## VI. Reachability

Applying the §DOC-02r closure (cell primacy + gate-flag writers): **the arc is fully reachable.**

- `AMS` is **alone** in cell `17,184` — the only node there, so it is unconditionally `list[0]`.
- `CDG` is `list[0]` in cell `21,182` (ahead of `LIM`/`FRK`/`FRS`), independently confirmed by §DOC-02q.
- Every gate flag has a live writer: `catKingDefeated` at `CQ_KING` victory; `connieMet` in the AMS
  block; `frCatKillCount` on `pb.nodeCode === 'AMS'` corrupted-cat kills; `laRivaComplete` /
  `fishmongerRowRestored` in the CDG delivery verb.
- The Entry-42 addendum is appended **after** ending selection, not inside the curse-score branch, so
  it is unaffected by §ENDING-01.

**This is the first §DOC-02 increment in six to find no §AUDIT-03x casualty**, and the reason is
structural rather than lucky: the arc occupies two nodes, one of which was authored as a dedicated
one-node locale.

---

## VII. The One Defect That Matters

**Kenickie is raised to Dear Friend by this arc's own final quest and cannot be named by the ending
the arc exists to feed.**

`{ kind:'favor', npc:'kenickie', set:3 }@34397` promotes him past the `>= 2` dearFriend threshold at
the moment he receives the account book. `const SWEELINCK_NAMING_LINES = {@27239` — the Covenant
Ceremony's per-NPC fav-gated witness lines — carries six keys and not his.

Act V states the design purpose in one sentence: *"The Covenant Keeper ending names each person
helped by name. This is why. Not to celebrate them. To confirm that the things they were carrying
were seen."* **The arc's entire stated payoff is a naming line that was deferred and never written.**

**The six keys are exactly the six curated Birka NPCs** — the same set as `NPC_ROMANCE_PREAMBLES`.
So the ceremony names the six *distributed* grief subplots of §V and omits the one *concentrated*
grief arc, which is the arc this report is named for. The generalisation shipped; the origin did not.

Two compounding facts: the Covenant Keeper ending is *itself* currently unreachable (§ENDING-01 — the
curse-score floor of 20), so the missing line sits behind a screen no player can reach; and the
report **filed this correctly as deferred**, with a suggested text. It is a clean NOT SHIPPED, not an
oversight discovered late. → **§GR-FU**.

Second, smaller defect: Aldo's promotion was a **raw increment** into `S_story.npcFavorability`,
bypassing `function _setNpcFavor(key, level) {@23463` — the absolute, only-ever-raises setter that
the CDG verb's own comment cites as canonical and that emits the tier-change line. **Within one arc,
one NPC was promoted through the host and the other by a direct write into the ledger.** → **§DX-02x**.

> **⚠ Corrected 2026-08-24 (§DX-02cm).** The site is now `{kind:'favor',npc:'aldo_sardino',add:1}@13805`
> — the second of the four bits in `quest_la_riva_02.onComplete` — so both promotions in the arc go
> through `_setNpcFavor`. §DX-02x's remaining scope is the corpus-wide sweep and the writers-only gate,
> not this site. The tier line it now emits reads **`aldo_sardino`**, not *Aldo Sardino*: `_setNpcFavor`
> resolves display names from `BIRKA_NPC_PROFILES` alone, which holds 9 keys and not this one → **§DX-02gc**.

---

## VIII. Corpus Note — Numbers From an Uncommitted Tree

The report's three hard numbers are internally consistent and match **no commit**:

| Claim | Nearest committed build | Delta |
|---|---|---|
| 18,324 lines "at session close" | `213d14b` 14:00 = 18,130 · `dcb72cb` 16:49 = 18,462 | falls between |
| Vinnie at line 7857 | 7855 at `213d14b`, 7953 at `dcb72cb` | +2 / −96 |
| Vinnie at line 15265 | 15250 at `213d14b`, 15448 at `dcb72cb` | +15 / −183 |

All three sit just above the pre-session build and below the session's own commit — i.e. they were
read off a **working tree that was never committed**, mid-session. ***The durable rule: a report's
line numbers and line-count baseline can be mutually consistent and still match nothing in git. Score
them UNVERIFIABLE rather than wrong — and do not use them to date a report; use the birth commits of
the things it describes.*** (Instrument 18, third refinement.)

Note also that the romance layer §VI documents shipped at `9684ff6` (10:39) and `28dae66`
(two days earlier), while La Riva shipped at `dcb72cb` (16:49) — **one report, three build moments.**

---

## IX. Summary Statistics — Then and Now

| Item | Claimed 2026-05-26 | Measured 2026-08-12 |
|---|---|---|
| New nodes | 1 (FR) | 1 (`AMS`, `num:79` preserved) ✅ |
| New NPCs | 2 | 2 ✅ |
| New quests | 3 | 3 ✅ |
| New items | 2 | 2, both `sell:0` ✅ |
| New state fields | 4 | 4, one line, specified order ✅ |
| NPC favor changes | 1 (kenickie → 3) | 2 (kenickie → 3, aldo → 1) — the report undercounts its own work |
| Hour-counter action types wired | 5 | 4 live, 1 retired, 1 relocated to battle start |
| `ROMANCE_QUOTES` | 21 | 21 ✅ |
| `FROBERGER_JOURNAL` | 41 | 41 ✅ |
| HTML lines | 18,324 | 38,712 (uncommitted-tree baseline — §VIII) |

---

## X. What Was Not Changed — Re-verified

- Both Kenickie "my guy Vinnie" lines: **unmodified at HEAD**, 78 days on. The retrofit still works
  by making them legible in retrospect.
- The Corrupted Cat combat mechanic: unchanged; AMS uses the shared pool at `count:1`.
- No non-La-Riva favorability values altered.

---

## XI. Residual — Re-scored

| Item | 2026-05-26 status | 2026-08-12 |
|---|---|---|
| Froberger Entries 17 / 29 | Carried by the entries themselves; no hooks needed | ✅ Holds — both live and verbatim |
| NG+ Entry 42 | "Full implementation deferred" | ✅ **Shipped** — full loop verified 2026-07-07 |
| `fishmongerRowRestored` visual payoff | Deferred; proposed `partial_market` terrain | ✅ **Shipped as `textVariants`**, a better mechanism; `partial_market` never built and not needed |
| Kenickie Covenant naming line | Deferred | ❌ **STILL NOT SHIPPED** → §GR-FU |

Three of four deferred items closed. **The one that did not is the arc's own stated payoff.**

---

## References

[1] Chrétien de Troyes, *Erec et Enide*, *Yvain (Le Chevalier au Lion)*, *Cligès*, *Le Chevalier de la Charrette*, c. 1170–1191.
[2] C. S. Lewis, *The Allegory of Love*, Oxford, 1936. (On the prior-act convention in courtly narrative.)
[3] B. Williams, "Ethical Consistency," *Proc. Aristotelian Society*, Supp. vol. 39, pp. 103–124, 1965. (Moral residue — the unwitnessed loss.)

---

**Original session:** 2026-05-26 · **Verified and rewritten:** 2026-08-12 (§DOC-02s)
**Reference builds:** `dcb72cb` (La Riva) · `9684ff6` (romance layer) · `28dae66` (`INN_DREAMS`)
**Measured against:** HEAD, 38,712 lines. Where this document and `play.html` disagree, the file is right.

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
