<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report: §WISDOM-01 — The Book of Human Nature

**Original filing:** 2026-05-28 · Claude (Sonnet 4.6) + roll2hit.com design sessions
**Classification:** Arc design / companion quest / behavioural-wisdom systems
**Verified:** 2026-08-13 (§DOC-02as) against `roll2hit-v3.html` @ 38,712 lines
**Depends on:** §ALCHEMY-01 (`personalLegendComplete`)
**Status:** ✅ SHIPPED `e339aeb` (2026-05-28 21:25:08 −0700) · ⛔ **UNREACHABLE at HEAD — 8 of 8 quests**

---

## Abstract

This report specified **§WISDOM-01: The Book of Human Nature**, a sequel arc for Roen — the
shepherd-philosopher of §ALCHEMY-01 — moving him from self-knowledge to the reading of other
people. Six laws are extracted from Robert Greene's *The Laws of Human Nature* (2018) and *The 48
Laws of Power* (1998), each adapted to one skill check at one existing node, plus a hook, a
resolution and three items.

**Verification result.** The arc shipped **the same evening the report was filed** — the report's
own `Status: implementation pending` was superseded within four hours — and it shipped with unusual
fidelity: **8 of 8 quest IDs, 8 of 8 state-flag names and 5 of 6 stat/DC pairs are byte-exact
against the birth tree**, and survived the whole §ARCH-01 UQF migration intact. One law was
re-scened at birth (W4), one was never built as a roll (W6), and three named symbols never existed.

**And none of it can be played.** The arc's hub is Visby (`VS`), which was **not a `NODE_MAP` key
on the night it shipped**, was accidentally re-minted three days later by an unrelated import, and
sits today as the **5th of 5 occupants of cell `12,198`** — so `storyRender` never reaches it. The
flag `wisHookReceived` has exactly one writer, inside that block. All eight quests are therefore
dead: three by node, five by flag. The arc has been live and unplayable for **77 days**.

> The report closes with Roen saying *"I suppose the laws work whether or not you want them to."*
> They do. So does cell primacy.

---

## I. Intent, inspiration, and what it adds to play

**The inspiration.** Greene's two books are the arc's source, and the extraction is disciplined
rather than decorative. The 48 Laws are *prescriptive and tactical*; the Laws of Human Nature are
*descriptive and psychological*. The report keeps both registers and states the admission criteria
up front — a law is usable only if it is **mechanizable** (a stat/DC pair with a real pass/fail
meaning), **observable in context** (enactable through an NPC at a node that already exists), and
**morally complex** (a tool, not a cheat code: it makes the player an accurate reader, not a
manipulator).

**What the feature adds to the game.** *The Shattered Codex* gives the player three verbs — walk,
fight, talk. §WISDOM-01 adds a fourth: **read a person.** Its design claim is the sharpest in the
companion-arc family:

- **Wisdom-as-tool, not wisdom-as-quote.** §ALCHEMY-01's beats are observational — Roen notices
  something, names it, moves on. §WISDOM-01 inverts that: each fragment is a *key*. The law is
  printed in the quest description, then the game immediately produces a situation where the law
  applies, then a skill check tests whether the player can apply it. A player who reaches the
  Tilbury docks without the fragment cannot make the Mask Check at all.
- **It adds no lore — it adds new ways to READ lore that already exists.** Every fragment is a
  second look at a scene the player has already walked through: Dorit's politeness at Saltwick,
  Keel's omission aboard the Intercept, the warlord's corner table at the Broken Tooth. This is the
  cheapest content in the game per unit of felt depth, because it re-uses the world rather than
  extending it. **Nodes required: 0.**
- **It rewards having played the rest of the game.** Four of six fragments gate on another arc's
  completion flag (`saltwickAccessed`, `sbResolved`, `roenAlchemistMet`, `personalLegendComplete`),
  so the arc's difficulty curve is *narrative coverage*, not level.
- **It is the corpus's first parallel collection.** Five fragments activate at once and complete in
  any order — a replayable shape in which two players meet the laws in different sequences. (§V
  measures how far that thesis survived contact with the build.)
- **Roen's voice is the payload.** The law arrives from Ardley in a scholar's register; the
  application arrives from Roen in the "Philosophy Stoner" register — profound at the wrong scale,
  with total sincerity: *"There is a cloth merchant at the Tilbury dock who holds bolts of fabric
  the way my grandfather held a lamb — which is to say, like something that could run. I find this
  interesting."*

**The secondary arc, told entirely by implication.** Master Fenn Ardley — court historian, never
met, dead before the game starts — documented six behaviour patterns, named the court treasurer's
one out loud to the full council, and was dismissed before the applause finished. The treasurer
scattered the text and held the city dock contracts for sixteen more years, then lost them to a
Baltic competitor who had read a dispersed copy. *The laws were proven by the act of suppressing
them.* The player never meets Ardley. They only meet what he saw.

---

## II. Method

Fourteen instruments from the §DOC-02 program. The load-bearing ones here:

| # | Instrument | Applied |
|---|-----------|---------|
| 1 | Batch census — every named symbol through one `grep -c` before reading a line | 36 names, one pass |
| 4 | `git log -S <symbol>` separates **RETIRED** from **NOT SHIPPED** | 5 dead names, all 0 commits |
| 7 | Check the report against its **siblings**, not only HEAD | `lab-report-kindness-calculus.md` §IV |
| 8/18 | HEAD cannot adjudicate the past — read the **birth tree** | `git show e339aeb:` (same-day) |
| 19 | **Reachability** — can the player stand where the content is? | `CELL_GRID` primacy, all 6 nodes |
| 31 | `num` is the node's identity; a code is a citation | **6 of 7 codes recovered by `num`** |
| 37 | For every flag: who writes it, who reads it, **can the writer run** | `wisHookReceived`, `wisArchiveLetter` |

---

## III. As-built inventory

| Structure | Shipped as | Anchor |
|---|---|---|
| 8 quests | `quest_wis_00`–`_07`, all `schema:'UQF-1.0'` | `quest_wis_00: { id:'quest_wis_00'@13333` |
| 10 state flags | 8 specified + `visbyUnderground` + `wisArchiveLetter` | `// §WISDOM-01: The Book of Human Nature@23275` |
| Hub surface | one node hook, four exclusive states | `_runNodeHook('wis-vs-hub', node);@36029` |
| Underground | separate hook, one descent button | `S_story.visbyUnderground = true;@33439` |
| Hook writer | **the arc's only entry point** | `S_story.wisHookReceived = true;@33520` |
| Resolution | +400gp, +600 XP, item swap, knowledge entry | `S_story.personalLegendMature = true;@33472` |
| Shadow branch A | accept — flag, Shadow Shard, +350 XP | `Accept the reflection (receive the shadow@33489` |
| Shadow branch B | fight — synthetic battle code `VS_SHADOW` | `label:'Shadow — The Mirror Construct'@33506` |
| 3 items | Pages 📖 · Shadow Shard 🔮 · Complete Laws 📚 | all three live, `sell:0/25/50` as specified |

The three quests carrying no roll (`_00`, `_06`, `_07`) ship as `type:'side'` with declarative
`completion` gates. Both shadow paths converge correctly: `completion:{ flagsAny:['wisPage6_shadow'],
battles:['VS_SHADOW'] }@13480` is a genuine OR — `_matchCompletionLeaf`'s `flagsAny` + `battles`
form **one OR-group**, and the resolution quest's five-flag `flags` list is AND'd against it, which
is exactly the compound the migration comment claims. **The gate semantics are correct.**

---

## IV. Spec → shipped delta table

| # | Report claim | HEAD | Verdict |
|---|---|---|---|
| 1 | 8 quests `quest_wis_00`–`_07` | all 8 present | ✅ exact |
| 2 | 8 flags in `_S_DEFAULTS()` | all 8, verbatim names | ✅ exact |
| 3 | W1 WIS Insight 13 · W2 WIS Insight 12 · W3 INT Investigation 11 · W5 WIS Insight 12 | identical | ✅ 4/4 |
| 4 | §2.1: **W4 = INT History 12 @ BK** | INT **Investigation** 12 — skill changed **at birth** | ⚠️ delta |
| 5 | §2.2: W4 = *"Birka … a guild city"*, timber-supply deal, `birkaAccessed`, `birkaRepImproved` | **Never built.** Shipped as the Mordus/shaman stalemate at Visby's Broken Tooth, retitled *"The Stalemate Cost"* | ❌ NOT SHIPPED (see §VI) |
| 6 | §2.1: **W6 = WIS Save 14 @ VS** | `quest_wis_06` is `type:'side'`, `bits:[]`; the accept path is an unconditional button. **No d20 anywhere.** | ❌ NOT SHIPPED → §AUDIT-03ad |
| 7 | W5 sets `stoic_letter` | shipped as `{ kind:'flag_write', set:['wisArchiveLetter'] }@13457` — **1 writer, 0 readers** | ⚠️ renamed + inert |
| 8 | W6 fail → *"Shadow Construct (medium)"* | `MONSTER_POOL.shadow`, ac 12 / hp 16, `tier:'easy'` — no such monster name; tier one band lower | ⚠️ delta |
| 9 | Hook grants +100 XP on accept | `S_story.xp = (S_story.xp||0) + 100;@33521` | ✅ exact |
| 10 | Resolution: +600 XP, +400gp, splice Pages, push Complete Laws, knowledge entry | all five, in order | ✅ exact |
| 11 | Item table (3 rows: icon, sell, source) | all three exact | ✅ 3/3 |
| 12 | *"Running total after §WISDOM-01: ~159 live"* | **2,853 quests** at HEAD (17.9×) | 🕰 corpus grew |
| 13 | §V thesis: *"first arc with parallel fragment collection … any order"* | **True for W1–W5, false for W6** — the shadow choice renders only at `_allFive` | ⚠️ thesis partial |
| 14 | Q1: gate W6 in a VS `storyRender` block rather than on §DUNGEON-01 | shipped exactly that way | ✅ recommendation adopted |
| 15 | Q2: Roen commentary in quest descriptions only (Option B) | shipped exactly that way | ✅ recommendation adopted |
| 16 | Q3: `personalLegendMature` downstream *"left for the next session"* | it got one — the §ALCHEMY-01 epilogue at `KIR` reads it | ✅ resolved |
| 17 | Q4: Keel thread *"shape before answer"* | W3's knowledge entry names the Baltic survey data and stops | ✅ as designed |

**Instrument 4 — five names, zero commits in the file's entire history.** `birkaAccessed`,
`birkaRepImproved`, `stoic_letter`, `"Three Years Out"`, `"Shadow Construct"`. **NOT SHIPPED, not
retired** — they were written from intent and never existed for one commit. Kept here, per program
rule, because a silently deleted claim reads as one that held.

---

## V. Reachability — the arc is 100 % dead (instrument 19)

`CELL_GRID` builds each cell in `NODE_MAP` declaration order and **only `list[0]` is ever
reachable**, because `S_story.currentCode` is assigned at exactly two sites (§AUDIT-03x / §DX-02w).
Re-derived this pass: **244 cells, reproduced exactly.**

| Node | Cell | Occupants | Primary | Arc content |
|---|---|---|---|---|
| **`VS`** | `12,198` | 5 | **`VBY`** | ⛔ hook · shadow room · resolution — `quest_wis_00/_06/_07` |
| `LCY` | `18,180` | 3 | `LCY` | ✅ reachable — W1 |
| `MME` | `15,178` | 1 | `MME` | ✅ reachable — W2 |
| `GCI` | `20,177` | 2 | `GCI` | ✅ reachable — W3 |
| **`BK`** | `10,197` | 2 | **`LHR`** | ⛔ W4 (and the wrong node anyway — §VI) |
| **`ATH`** | `32,203` | 17 | **`SEA`** | ⛔ W5 |
| `KIR` | `17,170` | 1 | `KIR` | ✅ reachable — the §ALCHEMY-01 handoff |

**The failure is not five separate accidents — it is one flag.** `wisHookReceived` has exactly one
writer, `S_story.wisHookReceived = true;@33520`, and it sits inside
`if (node.code === 'VS' && S_story.personalLegendComplete) {@33454`. `VS` is never `currentCode`, so
the flag is `false` forever, so **W1/W2/W3/W5 never list even though their own nodes are fine**, and
W4/W6 inherit it transitively. Three quests die by node, five by flag, and **the three reachable
nodes hold quests that can never be offered.**

The cruelty is in the signpost. At `KIR` — the one node in the arc a player can definitely stand on
— Roen says: *"A library in Visby has a copy. I am going to go find it."* Every word of that is
true. The library is the 5th of 5 occupants of its cell.

> Corroborates `lab-report-kindness-calculus.md` §IV (§DOC-02r), which reached the identical 8-of-8
> verdict independently; this pass adds the cell arithmetic, the single-writer proof and §VI.

**Born dead, then accidentally revived (instrument 18).** `VS` is **absent from `NODE_MAP` in the
arc's own birth tree** — `grep -c "^  VS:" e339aeb` returns **0**. Every `node.code === 'VS'` guard
in `e339aeb` was unrunnable the minute it shipped (the §AUDIT-03p born-dead class). On 2026-06-03,
`cb0fc35` — a worldbuilder import whose message names two other nodes — added `VS: { num:279@9088`
*"Visby Underground — Fence Quarter"*, a label so apt that nothing looked wrong. The arc went
**born-dead → accidentally resolved → cell-stranded**, and was playable at no point in between.

---

## VI. Node-code forensics — six of seven recovered, and one that came true (instrument 31)

The report's codes are 26×16-era; five are dead at HEAD. Resolved by `num` against the birth tree,
where the arc's `activateNode` fields used **exactly the report's §2.1 codes**:

| Report | `num` | Birth label | HEAD | Label at HEAD |
|---|---|---|---|---|
| `DK` | 7 | Harbor Docks — Tilbury | `LCY` | Harbor Docks — Tilbury |
| `SK` | 142 | Saltwick — The Unwritten Port | `MME` | Saltwick — The Unwritten Port |
| `SB` | 144 | The Intercept — Three Miles Out | `GCI` | The Intercept — Three Miles Out |
| `AE` | 92 | Athens — The Market Hill | `ATH` | Athens — The Market Hill |
| `HL` | 14 | Irish Highlands | `KIR` | Irish Highlands |
| `BK` | 25 | **Broken Tooth Tavern** (`name:'bar (Visby)'`, act 5) | **`VBY`** | **Broken Tooth Tavern** |
| `VS` | — | *(not a key)* | `VS` | Visby Underground — Fence Quarter |

**Six of seven, every label byte-identical** — the corpus's best node-code result, and it is the
whole argument for instrument 31: the letters rotted, the `num` did not.

### The `BK` result

The report's §2.1 table says **W4 is at `BK`**. Its §2.2 prose glosses that as *"Birka (§DESIGN-03
planned) is a guild city"* and designs a highland-timber supply deal, `birkaAccessed`,
`birkaRepImproved`. **At the report's own tree, `BK` was the Broken Tooth Tavern in Visby.** The
report mis-glossed its own code.

The implementer resolved the code correctly and, the same evening, wrote the *tavern* — Warlord Kael
Mordus and the shaman, six months of neither moving first, retitled **"The Stalemate Cost"**, INT
Investigation rather than History. §ARCH-01 later migrated it faithfully. Every string in the
shipped quest says Visby (`hint:'Read the Mordus-shaman stalemate at Visby\'s Broken Tooth
Tavern.'@13426`), and the hub's own fragment tally agrees: *"W4 at Visby Tavern (INT 12)."*

Then the world moved. §WALK/§NAV-01 remapped the four codes that **broke** — `DK`→`LCY`,
`SK`→`MME`, `SB`→`GCI`, `AE`→`ATH` — and skipped the one that still **resolved**. Today
`activateNode:'BK', gate:{ flags:['wisHookReceived'] }@13427` points at `BK: { num:241@9011`,
**"Birka Shore — Northern Longship Landing"**, a beach.

> ***38th instrument — a migration repairs the references that BREAK and walks past the one that
> survives wrongly, so the worse-than-dead code is the one the sweep GUARANTEES it will leave
> behind.*** Corollary, and the reason this one is worth recording: **the report's error came true
> seventy days later by a mechanism that had nothing to do with the report.** The prose wrongly said
> Birka; the code correctly said Visby; the implementer followed the code; the world then re-minted
> the code as Birka. A wrong document was made retroactively "right" by an unrelated world edit, and
> `check:noderegs` is green throughout because the code resolves.

This adjudicates one of the nine `activateNode:'BK'` sites §AUDIT-03y left open: **`quest_wis_04`
means `VBY`, unambiguously, and repointing it needs no design call.** It also buys more than it
costs — `VBY` is the **primary** of cell `12,198`, so W4 would become the arc's only standable
surface.

---

## VII. Risk register and open questions — outcome

| Filed | Outcome |
|---|---|
| **Q1** *"Does W6 need a §DUNGEON-01 gate?"* — recommended a VS `storyRender` block | ✅ **Built as recommended.** `_nodeHookWisVsUnderground` ships a descent button writing `visbyUnderground`; `quest_wis_06` gates on that flag, whose only writer already requires the hook. |
| **Q2** *"Does Roen appear at every fragment node?"* — recommended Option B | ✅ **Option B.** Roen's commentary lives in the six `desc` strings; no per-node panels. |
| **Q3** *"What does `personalLegendMature` enable?"* — deferred | ✅ **Answered by (a).** `if (S_story.personalLegendMature) {@33463` and the `KIR` epilogue both read it: *"Roen sits at the loch on Tuesdays. He reads."* |
| **Q4** *"How much Keel resolution is too much?"* | ✅ **Held.** W3 names the Baltic survey data and closes nothing. |
| *(unfiled)* | ⚠️ **The risk nobody filed: can the player stand at `VS`?** Every reachability assumption in the report is implicit, and it is the only one that failed. |

**Two live defects the register could not have caught, because both live in the writer/reader
relation rather than the name space** (instrument 37):

1. **`wisArchiveLetter` — one writer, zero readers.** Three occurrences in 38,712 lines: the
   migration comment, `wisArchiveLetter: false,@23284`, and the `flag_write` that sets it. The
   Stoic's letter of introduction to the Visby archive is written, saved across reloads, and
   consulted by nothing — and its stated destination is the room the player must already be
   standing in for the arc to have started. §DX-02n's write-only class.
2. **W6 is not parallel and says nothing about it.** `quest_wis_06` activates the moment
   `visbyUnderground` is set, and its `hint` says *"Use the story panel at VS to choose: accept or
   fight."* That panel's choice branch is
   `} else if (S_story.wisHookReceived && _allFive && !_p6) {@33485` — it renders **only after the
   other five fragments are complete**. Before that the player sees a fragment tally and no buttons,
   with an active quest telling them to press one. So the arc's headline design property —
   "fragments in any order" — holds for five of six, and the sixth is silently last.

---

## VIII. Defects filed

| Row | Class | Call |
|---|---|---|
| **§AUDIT-03y extended** | `quest_wis_04.activateNode:'BK'` adjudicated → **`VBY`**; repoint moves W4 onto the arc's only primary node | 🟢 none |
| **§DX-02n extended** | `wisArchiveLetter` — 1 writer, 0 readers (write-only class, new member) | 🟢 none |
| **§AUDIT-03ad extended** | same block, second defect: W6's choice branch is `_allFive`-gated while its quest activates early and points at it | 🟡 small |
| **§DOC-02as-DOC (new)** | **15 shipped quests across §WISDOM-01 + §ALCHEMY-01 have no row in any maintained home doc** — `quest.md` 0/8 and 0/7, `story.md`/`world.md` zero mentions of Roen or Ardley, while `index.md:175` still lists §WISDOM-01 as future work | 🟢 none |
| **§AUDIT-03s corroborated** | `// §ALCHEMY-01: HL — The Shepherd's Dream@33283` guards `if (node.code === 'KIR') {@33285` — retired code surviving in an engine comment, gate-invisible by design | 🟢 none |

Already on the board and **corroborated, not re-filed**: §AUDIT-03x / §DX-02w (`VS`←`VBY`,
`BK`←`LHR`, `ATH`←`SEA`), §AUDIT-03ad (the DC 14 that is not a roll), §DX-02q (the reissued-code
class — `VS` is a member).

---

## IX. Conclusion

As a **design document** this is one of the strongest in the corpus. Its extraction criteria are
stated and applied; it lists the laws it **rejected** and why; its data shapes shipped byte-exact
and survived a whole-format migration; three of its four open questions were resolved by the build
in the direction it recommended. The one measurable authoring error — glossing `BK` as Birka — was
caught and corrected by the implementer *the same evening*, from the report's own code table.

As a **shipped feature** it is worth nothing to a player, and the reason is one line of geometry no
section of the report was asked to consider. Six laws, eight quests, three items, two knowledge
entries and Roen's best writing sit behind a flag whose only writer renders at a node that is fifth
in its cell.

**The repair is small and disproportionately valuable.** Making `VS` primary (or moving the hook
writer to a node that is) restores **eight quests, three items, a companion arc's second act and the
`personalLegendMature` epilogue at `KIR`** — one of the best content-per-edit ratios the §DOC-02
program has measured, second only to §AUDIT-03at. Repointing `quest_wis_04` to `VBY` is one
identifier and independently correct.

> *"These are not rules. They are a pair of glasses."* — Roen's foreword, shipped verbatim at
> `inv.push({ name:"Ardley's Complete Laws"@33478`, written for a book no save file has ever
> contained.

---

## Appendix A — NOT SHIPPED claims, retained

Per §DOC-02 rule, kept rather than deleted:

- **W4 as designed** (Birka guild timber deal, INT History, `birkaAccessed`, `birkaRepImproved`,
  *"Three Years Out"*, the Nordic-trade-route contingency clause). Superseded at birth by the
  Broken Tooth stalemate. 0 commits for all four identifiers.
- **W6 as a WIS saving throw DC 14.** Never a roll. → §AUDIT-03ad.
- **`stoic_letter`.** Shipped renamed as `wisArchiveLetter`, and inert.
- **"Shadow Construct", medium difficulty.** The fight uses `MONSTER_POOL.shadow` — *Shadow*, ac 12,
  hp 16, `tier:'easy'`.
- **Silas Vance's route discount at Saltwick.** Narrative only; no discount mechanic exists
  (`routeDiscount` / `discountRoute`: 0 hits).
- **The `storyRender` block `story-wis-wis01-dk`** in §X's checklist. Never built — correctly, per
  the report's own Q2 recommendation two pages earlier.

## Appendix B — the six laws as shipped

| | Law | Source | Check | Node (spec → HEAD) | Scene |
|---|---|---|---|---|---|
| W1 | Role-playing — *see through masks* | LHN-3 | WIS Insight 13 | `DK` → `LCY` ✅ | Silas Vance's rope callousing |
| W2 | Aggression — *see the hostility around you* | LHN-16 | WIS Insight 12 | `SK` → `MME` ✅ | Dorit touches the ledger |
| W3 | Each man's thumbscrew | 48L-33 | INT Investigation 11 | `SB` → `GCI` ✅ | the navigator Keel never mentioned |
| W4 | Shortsightedness — *elevate your perspective* | LHN-6 | INT Investigation 12 | `BK` → **`BK`** ❌ (means `VBY`) | Mordus vs. the shaman, six months |
| W5 | Formlessness — *rigidity is the vulnerability* | 48L-48 | WIS Insight 12 | `AE` → `ATH` ✅ | the Stoic's three incompatible layers |
| W6 | Repression — *confront your shadow* | LHN-9 | **none shipped** | `VS` → `VS` | the obsidian mirror, accept or fight |

Rejected laws, retained from §1.3 as the record of the extraction discipline: 48L-1 (no court
hierarchy), 48L-6 (too antagonistic for the tone), LHN-2 (already enacted in §ALCHEMY-01), LHN-11
(no grandiose NPC), LHN-14 (no group-pressure scene), LHN-17 (passive, no check available), LHN-18
(better as tidal-chain flavour).

---

**Filed:** 2026-05-28 · **Shipped:** `e339aeb`, 2026-05-28 · **Verified:** 2026-08-13 (§DOC-02as)
**Cross-references:** `lab-report-kindness-calculus.md` §IV (the independent 8-of-8 verdict) ·
BACKLOG §AUDIT-03x · §AUDIT-03y · §AUDIT-03ad · §DX-02n · §DX-02q · §DX-02w

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
