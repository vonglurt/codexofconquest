<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — Layer 52: Void Archaeology, "The Architecture"

**IEEE-format post-mortem**
**Written:** 2026-05-25 · **Revised:** 2026-07-07 (§VI bug fix) · **Verified against HEAD:** 2026-08-17 (§DOC-02bz)
**Layer:** 52 · **Section:** §XVII · **Track:** plan-archive.md §XVII
**Status:** ✅ Implemented and structurally intact · ⚠️ **not reachable in play** — see §VII
**Codebase:** `play.html` (single-file browser RPG)

> **Historical node codes.** Written before the §WALK/§NAV world rewrite renamed every node to
> airport-style codes. Throughout: **CI → `LHR`** (City Streets — Birka; the Blue Shutters Archive),
> **SL → `BMA`** (Birka Slums), **DF → `ZRH`** (`defi_land`, the Defiant Fields), **WM / SQ → `NUE`**
> (Scholar's Quarter — Weimar; the archive *is* the Quarter), **MT → `GVA`** (Mountain Pass — High
> Crest), **CO → `TLS`** (the victory screen's node). This is a HISTORY doc: the retired codes are
> annotated, never rewritten.

---

## I. Abstract

Layer 52 is an NG+-exclusive investigation arc built entirely out of places the player has already
walked through. Five `[INVESTIGATE]` buttons appear at `LHR`, `BMA`, `ZRH`, `NUE` and `GVA`, each
revealing a mark left by the First Researcher — Marta Eilene Vass — two centuries before the game
opens. Collecting all five unlocks a fourth document in the Weimar archive, the Constructor's Log,
which opens the sealed Mountain Pass tunnel, which closes at the Scholar's Quarter with Benedikt
Rasp's four-author synthesis. `vaArchitectureKnown` then gates a fifth ending variant.

This revision re-measures every claim against HEAD 82 days after the arc shipped. **The
implementation is exact** — 39 of 39 acceptance assertions pass, all five site texts are
byte-identical to their birth commit, and every cited line number was correct at the tree this
report was revised on. **Three claims are corrected** (§V), and the arc's real defect turned out to
be upstream of everything this document describes: **its three gate flags cannot all be true in
normal play** (§VII).

---

## II. Design Intent — and what it buys the game

### A. Retroactive recontextualization, at zero world cost

The First Researcher predates the Scholar Kings by a generation. Her marks are at nodes the player
has visited since Act I: she worked in the Blue Shutters Archive; she carved a marker on a corner
building in the Slums that predates the city by eighty years; the Defiant Fields battle happened at
the coordinates she chose for the sealing mechanism; her personnel file is in the Weimar archive;
she sealed the Mountain Pass tunnel from the inside.

The `[INVESTIGATE]` buttons surface what was always true. Nothing is retconned — *the player lacked
the knowledge to see them.* **The layer adds no nodes, no monsters and no terrain.** It is flags,
text and one CSS class hung on geography that already existed, which is why the 90×360 grid
migration had nothing of it to break: all five sites are the sole occupant or the primary of their
cell at HEAD, so §AUDIT-03x's 172-node co-location problem never touches it. *Structural minimalism
as a survival trait — the third measured instance in the corpus.*

### B. Why it improves playability

1. **It gives a finished world a second reading.** NG+ otherwise repeats content. This layer makes
   the *same five rooms* mean something different, so the replay is a re-reading rather than a
   re-grind — the cheapest possible way to buy a second act out of an existing map.
2. **It is the only content gated on the player having authored something.** `vaArchitectureKnown`
   cannot be set unless `entry42Written` is true. A player who skipped Entry 42 is told nothing,
   because the chain genuinely has only three links. Self-authorship is a *mechanical*
   precondition, not a flourish.
3. **It answers a question the game has been asking since Act I.** The Pilgrim on the road has been
   saying `Someone sealed that tunnel before the Scholar Kings existed@26714` — *"I've been trying
   to find out who for forty years."* Layer 52 makes a piece of ambient furniture answerable.
4. **It pays out.** +200gp for the tunnel, +500gp and two permanent items for the chain, plus a
   lore annotation appended to a tome the player already owns.
5. **It hands the endgame a fifth voice.** The victory screen's Sweelinck question and the
   four-author addendum only exist for a player who finished this arc.

### C. The four-author chain

Benedikt names four contributors to the Antecedent containment: **the First Researcher** built the
cage and wrote the Log; **Froberger** found the mechanism and died for it; **the player** activated
it at the Defiant Fields without knowing; **Entry 42** is the fourth link, and it is the player's
own handwriting. Four links is a chain. *"That is the only kind of answer this work produces — not a
solution, a chain."*

---

## III. As-Built Inventory

All anchors verified at HEAD, 2026-08-17.

### A. Dispatch and gate

| Element | Anchor | Note |
|---|---|---|
| Hook body | `_nodeHookVoidArchaeology(node) {@31855` | **Migrated out of `storyRender` by §VM-01-G2** (2026-07-28), verbatim |
| Registration | `id:'void-archaeology', nodes:['LHR','BMA','ZRH','NUE','GVA']@34418` | `nodes` is tooling metadata; the hook body owns the real gate |
| Call site | `_runNodeHook('void-archaeology', node)@35011` | In place, so DOM order is preserved by construction |
| Gate | `const _vaReady = (S_story.ngPlusRun || 0) >= 1@31858` | `ngPlusRun ≥ 1` **and** `wmFirstResearcherKnown` **and** `entry42Written` |

### B. The five sites

`const _vaSites = {@31859` — five entries, byte-identical to the 2026-05-25 birth commit `194a810`;
only the keys were ever edited.

| Node | Flag | Mark |
|---|---|---|
| `LHR` | `vaCI` | Blue Shutters shelf record — Researcher Category: Containment |
| `BMA` | `vaSL` | Carved marker on a building eighty years older than the city |
| `ZRH` | `vaDF` | Stone alignment on a mathematical interval — the activation point |
| `NUE` | `vaWM` | Document 3's project codename: ANTECEDENT CONTAINMENT PROTOCOL |
| `GVA` | `vaMT` | A sealed access tunnel. *"The seal is intact. It is waiting."* |

Completion fires on `['vaCI','vaSL','vaDF','vaWM','vaMT'].every(f => S_story[f])@31877` → 600 ms →
`Five marks. One pattern.@31881` and `quest_va_02` activates. The button is created with
`.inv-investigate-glow {@1937` (gold pulse, added by the 2026-07-07 fix) and self-removes on click.

### C. Quest chain — `QUEST_DB`, UQF-1.0

| Quest | Completion flag | Reward |
|---|---|---|
| `quest_va_01` | `vaAllMarksFound` | narrative only |
| `quest_va_02` | `vaLogFound` | `itemChain`: Constructor's Log (readable) + Antecedent Seal (relic) |
| `quest_va_03` | `vaLastWardVisited` | **+200gp** |
| `quest_va_04` | `vaArchitectureKnown` | **+500gp** + an annotation appended to *Benedikt's Annotated Copy* — `📙 +500gp. The Architecture is known.@11175` |

All four carry `activateNode:null`; the hook activates them imperatively rather than through
`_uqfActivateAtNode`.

### D. Constructor's Log as Document 4

`_storyWmArchiveModal(wrap) {@27950` renders a fourth document once `vaAllMarksFound` is set:
`Document 4: The Constructor@28029`. Reading it runs `S_story.vaLogFound = true;@28006`,
pushes both items, and activates `quest_va_03`. Entry 7 is quoted verbatim in the modal:

> *"If someone is reading this, the sealing mechanism has activated. The cage is closed. Whatever
> you sealed inside it — that is what I built this for. I am sorry. I did not have a better answer."*

### E. The `GVA` tunnel — two keys

`i.name === 'Antecedent Seal' || i.name === "Froberger's Field Notes"@31898`. Either opens it: the
Seal is the artifact, the Field Notes (the §XVI tome) are the intellectual key. Opening sets
`vaLastWardVisited` and prints the chamber — cut stone, air still for two hundred years, six
sentences of operational notes on the far wall, then: *"The Antecedent was here. It is not anymore.
You know where it is now."*

### F. Closure and ending

`S_story.vaArchitectureKnown = true;@31924` fires at `NUE` when `vaLastWardVisited && entry42Written`,
with Benedikt's line on a 700 ms delay so the node text lands first; the flag is set *before* the
timer resolves, which is what prevents a double-fire on rapid navigation. Downstream:
`sweelinckQ = '"What was inside the cage?"'@28420` (overriding all other ending questions) and the
addendum *"Froberger wrote 41 entries. You wrote one. She wrote 7, and no one counted them for 200
years… The story has four authors now."* The flag is also read as an inn-dream conditional at `TLL`
and `NUE`.

### G. State

`vaCI: false, vaSL: false, vaDF: false, vaWM: false, vaMT: false,@23166` and
`vaAllMarksFound: false, vaLogFound: false@23167` — nine booleans, all declared in `_S_DEFAULTS()`,
none carried across the NG+ transition.

---

## IV. Verification Ledger (2026-08-17)

**Acceptance test: 39 assertions, 39 pass.** The §VI simulation was re-run at HEAD by extracting the
hook verbatim and driving it in a stub DOM: five sites render and collect, `vaAllMarksFound` and the
payoff line fire, both tunnel keys work and a non-key does not, Benedikt closes the arc, and each of
the three gate flags is independently load-bearing (three negative controls). The **control run with
the pre-fix `WM` key still never completes the arc.**

| Class | Result |
|---|---|
| `_vaSites` keys resolve in `NODE_MAP` | **5/5** |
| `.every()` list ≡ the five site flags | exact |
| Completion flags declared in `_S_DEFAULTS()` | **4/4** |
| Site texts vs. birth commit `194a810` | **5/5 byte-identical** |
| Line citations at the 2026-07-07 revision tree `0179687` | **12/12 exact** (`_vaReady` 30234, `_vaSites` 30235–30241, quests 10727–10758, flags 22202–22203, modal 26563, Log read 26619–26630, tunnel 30273–30288, Benedikt 30296–30302, ending 27014 / 27033–27043, Pilgrim 25381, CSS 1849) |
| Quoted strings verbatim | **4/4** (Log Entry 7, the payoff line, Benedikt's synthesis, the addendum) |
| Cell primacy of the five sites | **5/5 primary** (416 nodes / 244 cells / 172 non-primary, corpus figure reproduced) |

---

## V. Spec → Shipped Deltas

Both directions. A claim that did not hold is corrected here and kept, not deleted.

| # | Report said | HEAD says | Verdict |
|---|---|---|---|
| 1 | `quest_va_04` reward: *"narrative only"* | `{ kind:'reward', gold:500 }` plus a `_legacy_fn` annotating *Benedikt's Annotated Copy* | **Wrong when written.** `reward:500` is present at the birth commit `194a810` and unchanged since. `story.md:1640` had it right the whole time |
| 2 | *"Quest_va_04 has no explicit completion message beyond Benedikt's line"* | `onComplete` ends with `📙 +500gp. The Architecture is known. The chain holds.` | **Wrong when written** — same line, same tree |
| 3 | *"The Constructor's Log is discoverable in two ways… both paths converge"* | One discovery path. `quest_va_02` completes **on** `vaLogFound`, whose only writer is the archive modal, so its `itemChain` can only run after the Log is already in inventory — and `if (s.once !== false && inv.some(i => i.name === s.name)) break;@26309` makes the re-grant a no-op | **Corrected.** Harmless, but it is one path with an idempotent echo, not two |
| 4 | The block lives *"inside `storyRender`"* | `_nodeHookVoidArchaeology(node) {@31855`, a registered `NODE_HOOKS` entry | **Stale, by design** — §VM-01-G2 moved it verbatim 2026-07-28 |
| 5 | *"read… in the dream/shard-note systems"* | Both reads are `INN_DREAMS` conditionals (`TLL` and `NUE`); the shard-note flag is a neighbouring row, not a reader | **Corrected** |
| 6 | §VI: four keys survived *"because the site text was re-authored"* | The texts were **never** re-authored — all five are byte-identical from birth to HEAD | **Corrected.** See §VI |
| 7 | §IV: the sites *"do not highlight"* | Fixed 2026-07-07; `.inv-investigate-glow` is live at HEAD | **Closed** |
| 8 | §IV: *"a cross-reference table… would help"* | `index.md` State Fields lists all nine flags; `story.md:1632–1642` carries the full layer record | **Closed** (with a caveat — §VIII row 3) |
| 9 | §E: *"NG+ **is** supported"* | `const savedPriorQuestMinus1@24086` and neighbours: `ngPlusRun` is incremented, six fields survive the reset | **Holds** |

---

## VI. The 39-Day Outage — a dead node code in a five-entry map

**Symptom.** `[INVESTIGATE]` sat on the open-gaps list as *"documented as not working; root cause
unknown."* A qualifying player could collect some marks and the arc never closed.

**Cause, measured.** At the birth commit `194a810` (2026-05-25) all five `_vaSites` keys were the
logical codes `CI/SL/DF/WM/MT`. On **2026-05-29 22:45**, commit `c1d5a94` (*"story books"*) swept
four of them to the new world's codes and **left `WM` alone**. It is a single missed token in a
five-line object literal, and the site text beside it is byte-identical before and after — so the
report's own explanation (*"the site text was re-authored"*) is not what happened; nothing was
re-authored, one key was skipped.

**Blast radius.** `_vaSites[node.code]` never matched at `NUE`, so the button never rendered, `vaWM`
could never be set, `vaAllMarksFound` could never fire, and `quest_va_02`, `quest_va_03` and
`quest_va_04` — the Log, the tunnel, the chain and the fifth ending — were all unreachable. **The
back half of the arc was dead for 39 days**, and this document's own tables still said `WM`, so
nobody had a reason to look.

**Fix (`0179687`, 2026-07-07).** One token, `WM:` → `NUE:`, plus the `.inv-investigate-glow` class.

**The class is now fenced.** `check:noderegs` phase 5 (§AUDIT-03p, 2026-08-04) reads *function-local*
object literals whose keys are all code-shaped, and `_vaSites` is classified explicitly:
`src/scripts/check-noderegs.js:'_vaSites'@80`. A dead node code in this map is now a CI failure. *The
defect that took 39 days to notice would now take one push.*

---

## VII. Reachability — the finding this report could not make about itself

The arc is correct. It is also, at HEAD, **unreachable in normal play**, for two independent reasons
that both sit upstream of everything above.

**(1) `wmFirstResearcherKnown` has no writer that is not its own consequence.** The flag's only
writer is `set:['wmFirstResearcherKnown'] }, { kind:'reward', gold:300 }@11122`, inside the
`onComplete` of the very quest whose completion condition is
`completion:{ flags:['wmFirstResearcherKnown'] }@11121`. The quest cannot complete until the flag is
set, and nothing else sets it. Tracked as **§AUDIT-03au** (the fix is one line, and the quest's own
hint says where the grant belongs). `_vaReady` inherits the block whole.

**(2) `entry42Written` sits behind a browser console.** The chain, measured end to end:

| # | Requirement | Where it comes from |
|---|---|---|
| 1 | Level 20 at `TLS` | `when:st => (st.level || 1) >= 20 && !st.questMinusOne@31617` — Layer 49's "Quest −1" disclosure panel |
| 2 | `questMinusOne` | **The player types `S_story.questMinusOne = true; storyAutoSave();@31645` into a browser console.** That string literal is the flag's only writer in 38,712 lines |
| 3 | Start NG+ | `ngPlusRun` +1; `questMinusOne` carries over as `const savedPriorQuestMinus1@24086` |
| 4 | ≥3 preserved Dear Friends | `if (_e42Dear >= 3) {@34885` — an undocumented fourth gate (**§AUDIT-03ah**) |
| 5 | Stand at `LHR`, click either button | `S_story.entry42Written    = savedEntry42Written;@24095` then keeps it forever |
| 6 | Re-earn `wmFirstResearcherKnown` in the new run | blocked by (1) |

Step 2 is deliberate *for Quest −1* — *"Level 21 is undefined. That is not a bug. That is the
door… The game will not know whether you earned it. That is also intentional."* Nothing suggests it
was meant to become the load-bearing precondition of an entire NG+ layer and the game's best ending.
**That transitive consequence is the design call in §VIII row 1.**

Downstream of this arc, `node.code === 'GVA' && S_story.vsShamanKnown@31931` — Layer 56's Warden
encounter — needs `vaLastWardVisited`, so it is blocked here *and* separately by §AUDIT-03x/§DOC-02an.

---

## VIII. Defects Filed

| Row | Weight | Summary |
|---|---|---|
| **§AUDIT-03bh** | 🟡 | **The self-satisfying completion flag is a class, not an incident.** 23 of 2,853 quests write a flag in `onComplete` that their own `completion` gates on; for **five** of them that write is the flag's *only* writer, so the quest can never complete. `quest_muffat_02` → `quest_muffat_03` → `quest_signal_01` → `quest_antecedent_01` is a **four-quest cascade behind one deadlock**, on primary nodes, with no other cause. Wants a `check:questgraph` phase. §AUDIT-03au is member 1; do not duplicate its fix |
| **§AUDIT-03bi** | 🟡 | **A browser console is a load-bearing precondition of a layer and an ending** (§VII, step 2). Design call: grant `questMinusOne` on the L20 Void Warlord kill *in addition to* the console route, or drop `priorQuestMinusOne` from the Entry 42 gate, or document it honestly |
| **§DX-02cw** | 🟢 | **`index.md` is classified HISTORY in `src/scripts/legacy-codes.js`**, so its State Fields quick reference — the table `prompt.md` tells you to look constants up in — is exempt from gate #16 by classification rather than by blind spot. Five Void rows still describe the marks as *"found at CI/SL/DF/WM/MT"* |

**Corroborated, not re-filed** (instrument 7): §AUDIT-03au · §AUDIT-03ah · §AUDIT-03u (the Quest −1
panel's stale literals — 16,024 lines, 423 monsters, 67 terrains, and a `plan.md` that no longer
exists) · §DX-02m (`S_story.frobergerNoteNode = _ebPool@24038` draws the unseeded stream) ·
§AUDIT-03x/§DOC-02an (Layer 56, and `quest_tl_01`'s `STN` non-primacy).

**Doc sync in this increment:** `world.md`'s Void Archaeology section still read ⚠️ PLANNED while
`story.md:1632` read ✅ Implemented — corrected, the §XVI repair repeated one layer down.

---

## IX. File References

*(HEAD line numbers, 2026-08-17. Anchors resolve by symbol — `npm run anchors` audits them.)*

| Location | Content |
|---|---|
| `_nodeHookVoidArchaeology(node) {@31855` | The whole hook: gate, five sites, tunnel, quest activation, Benedikt |
| `id:'void-archaeology', nodes:['LHR','BMA','ZRH','NUE','GVA']@34418` | `NODE_HOOKS` registration |
| `quest_va_02: { id:'quest_va_02'@11151` | Quest chain, UQF-1.0 (`quest_va_01`–`_04`) |
| `vaCI: false, vaSL: false, vaDF: false, vaWM: false, vaMT: false,@23166` | The nine state flags |
| `_storyWmArchiveModal(wrap) {@27950` | Document 4 |
| `sweelinckQ = '"What was inside the cage?"'@28420` | Fifth ending question + addendum |
| `.inv-investigate-glow {@1937` | Button highlight (2026-07-07) |
| `story.md:1632` · `world.md:241` | Maintained home docs — the layer record and the arc summary |
| `lab-report-weimar-scholar-gate.md` | `wmFirstResearcherKnown` origin — §XVI, the prerequisite |
| `lab-report-ng-plus-remembrance.md` | `entry42Written` origin — Entry 42 |
| `lab-report-void-shaman.md` | §XXI — the `GVA` tunnel's second tenant |

---

## X. Conclusion

Layer 52 is the strongest survival result the Void family has produced: 82 days, one total world
re-coordinate, one UQF format migration and one hook extraction later, every constant, string and
control-flow branch is where this document says it is, and its own acceptance test still passes
39 for 39. The three corrections in §V are all sentences the author *composed* rather than *copied* —
a reward summarised from memory, a discovery path reasoned about rather than traced, and a cause
narrated rather than diffed. The tables were right; the prose about the tables was not.

The lesson worth keeping is §VI's. A five-entry object literal lost one key in a bulk rename and
took the back half of an arc with it for thirty-nine days, silently, while this report's own tables
agreed with the broken code. Nothing in the engine threw. The fix was one token. **The fence that
now makes it impossible arrived two months later and cost less than the outage did** — which is the
argument for classifying a registry the day you write it, not the day it breaks.

And the arc is still waiting. She sealed the tunnel from the inside; we sealed it again, twice, from
the outside — once with a missing key, once with a flag that grants itself.

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
