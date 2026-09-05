<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — Layer 56: The Void Shaman, "The Warden"

**IEEE-format post-mortem · §XXI**
**Written:** 2026-05-25 · **Ship commit:** `194a810` (2026-05-25 09:10)
**Verified against HEAD:** 2026-08-13 (§DOC-02ao) — 80 days later
**Subject:** `play.html`, single-file browser RPG
**Status:** ✅ implemented · ❌ **never reachable in play** — see §VI

---

## Abstract

Layer 56 places a single antagonist in the Mountain Pass tunnel and asks the player to
resolve him with evidence rather than damage. The Warden is a goblin shaman executing a
two-hundred-year-old mandate that was corrupted in transcription: the seventeenth hand-copy
of *"open the tunnel to close the cage"* reads *"open the cage."* He has spent eleven years
faithfully trying to undo the thing the player already did. The arc offers two closes —
present the Constructor's Log (persuasion, +600gp) or fight him (`void_shaman`, AC 15 / HP 65)
— and both set `wardensLegacyKnown` and complete `quest_vs_warden`.

**Why the game wanted it.** By Act V the player has spent four acts learning that the Void is
an adversary you kill. Layer 56 is the counter-example the endgame needs: the first encounter
whose correct answer is a *document*. It is also the payoff for two long investigative arcs
that otherwise close without a scene — §XX (Visby Underground) and §XVII (Void Archaeology) —
so it converts two ledgers of flags into one conversation. The design goal, stated in one line
by the author: **an antagonist who is wrong, not evil.**

**What verification found.** Report-rot is near zero: **20 of 20 identifiers resolve, all four
node codes are clean renames of surviving nodes, and every quoted line of dialogue is
byte-verbatim at 80 days.** The arc is nonetheless unreachable, and has been since the hour it
shipped — its entry flag `vsShamanKnown` has never had a settable writer. Of eleven authored
surfaces, **three render, and all three arrived later by accident**, in a data-audit commit
that had nothing to do with this arc. The one place a player can meet The Warden today is as
an unnamed wandering encounter in a different shaman's sanctum.

---

## I. Design intent

### A. The corrupted mandate

The First Researcher planted a guardian at the tunnel before sealing it. Her instruction:
*open the tunnel to close the cage — when the sealing mechanism activates, confirm it and
stand down.* Copied by hand through seventeen generations of goblin shamanic tradition, a verb
tense shifted. The seventeenth copy says *open the cage.*

The Warden has been obeying that copy for eleven years, arming the Hollow Hands sub-clan as a
resource pool and telling them the weapons were tribute Mordus owed. None of it is malice. It
is misdirection so old the original direction is lost.

The persuasion path is therefore not diplomacy — it is disclosure. The Constructor's Log,
Entry 2, carries the original sentence: *"The cage must be opened before it can be closed."*
Read beside Entry 7 (*the sealing mechanism has activated*), the inversion is visible. The
mission completed two hundred years before he was born.

### B. The prerequisite stack — the arc is a convergence, not a node

| Line | Delivers | Flag |
|---|---|---|
| §XX Visby Underground | Hollow Hands → weapons debt → Yva's testimony | `vsShamanKnown` |
| §XVII Void Archaeology | the sealed tunnel, opened by the player | `vaLastWardVisited` |

Both are required. A player arriving with both knows *who* planted the guardian and *what* the
Hollow Hands are for. The Warden is not surprised — he expected someone.

This is the arc's whole playability argument and also its whole failure mode: an encounter
that exists only at the intersection of two ledgers inherits the reachability of the **weaker**
one. §VI measures that.

### C. Not the same as Kazrath

`TBS` (historical `GC`/`EG`) holds the epic battleground and Void High Shaman Kazrath — Act V's
main-quest villain, a separate `void_high_shaman@26410` statline (tier `deadly`, AC 16 / HP 255).
The Warden operates under an older and administrative mandate. *Kazrath's motivations are
aggressive; the Warden's are clerical.*

> **NOT AS SHIPPED (2026-06-04).** A data audit added `P.void_shaman` to the sanctum's own
> encounter roster. The two are now the same monster key in the same room. See delta D-8.

---

## II. As-built inventory (HEAD 2026-08-13)

### A. Monster and trophy

`void_shaman@5407` — `ac:15, hp:65, atk:6, dmgDie:6, dmgCount:2, dmgFlat:4`, all exact as
specified. `name:'The Warden'` so the battle overlay reads as a named encounter rather than a
type.

The scripted drop is still inline in the victory handler, not rolled:

```js
{ name:"The Warden's Token", icon:'🔑', type:'relic', sell:0,
  description:'Original Warden\'s seal, First Researcher\'s appointment. Recopied seventeen
  times. The seventeenth copy has a small error in the verb tense that changed everything.' }
```

The item description carries the entire premise of the arc in one sentence — which is the
point: a player who fights instead of reading still receives the explanation.

### B. Gate and first contact

```js
if (node.code === 'GVA' && S_story.vsShamanKnown@31696
    && S_story.vaLastWardVisited && !S_story.wardensLegacyKnown)
```

Registered as `{ id:'void-shaman-warden', nodes:['GVA']@34419` in `NODE_HOOKS`, dispatched in
place at `_runNodeHook('void-shaman-warden', node)@35131`. On the first qualifying visit,
`vshamanFound = true`, `quest_vs_warden` activates, and the intro fires:

> *"You came to stop me. Or to understand. Either is fine. I have been working for eleven years
> to do the right thing. I may be wrong about what the right thing is."*

That is the character in full, before the player chooses anything: not surprised, not hostile,
and genuinely unsure. It is also the line that makes the button group readable — you are being
invited to argue, not ambushed.

### C. Dual resolution

**Persuasion** — rendered only when `_hasLog = (S_story.inventory || []).some@31940` finds
*The Constructor's Log*. The Warden reads Entry 2, then Entry 7:

> *"The cage is closed. It was closed 200 years ago. I have been eleven years trying to re-open
> it."*
> *"Tell the clan the mission is complete. … This is — this is fine. I can stop."*

Sets `vsShamanPersuaded` + `wardensLegacyKnown`, grants the Token, pays **+600gp** inline.
Downstream fiction: *"The sub-clan walked back in. All of them. Mordus didn't ask what changed.
He logged them as returned."*

**Combat** — `storyPreBattle({ ...node, code:'MT_WARDEN'@31965`. Victory is caught by
`pb.nodeCode === 'MT_WARDEN'@25450`, which sets `vshamanDefeated` + `wardensLegacyKnown`, grants
the Token and pushes it to `dropsThisBattle`. The sub-clan **scatters** instead of returning —
the combat path disperses the Hollow Hands rather than reintegrating them.

> *"If I'm wrong, then I needed to be stopped. That's — that's actually fine."*

### D. State fields — all five live under their specified names

| Flag | Purpose | Writers at HEAD |
|---|---|---|
| `vshamanFound` | intro fired; `quest_vs_warden` activated | 1 (hook) |
| `vshamanDefeated` | combat close | 1 (victory handler) |
| `vsShamanPersuaded` | Log shown | 1 (button) |
| `wardensLegacyKnown` | arc complete, either path | 2 (both paths) + quest `onComplete` |
| `vsShamanBenediktDelivered` | Benedikt callback fired, once per run | 1 (callback) |

Declared contiguously at `vshamanFound: false@23173`. `vshamanDefeated` and
`vsShamanPersuaded` are mutually exclusive by construction; both set `wardensLegacyKnown`.

### E. Quest

`quest_vs_warden: { id:'quest_vs_warden'@13576` — migrated to UQF-1.0 by §ARCH-01 W7c:
`completion:{ flags:['wardensLegacyKnown'] }`, `activateNode:null` (hook-driven),
`waypointNode:'GVA', reward:600@13587`. The `onComplete` chain writes the flag, then a
`_legacy_fn` narrates the three-way close (persuaded / defeated / neither).

The hint is unchanged from the spec and is doing real work: *"Enter the MT tunnel and confront
the Warden. Bring the Constructor's Log if you have it."* A player reading the quest card knows
there is an item-based alternative **before** walking into an AC 15 fight.

### F. Benedikt callback

`node.code === 'NUE' && S_story.vsShamanPersuaded && _npcFavor('benedikt_rasp') >= 2@35134`.
Persuasion-only, once per run:

> *"She planted a guardian at the tunnel and didn't write it down anywhere official. … She
> thought she was planting a safeguard. She planted a 200-year misunderstanding. The difference
> between those things might be very small."*

This is the arc's intellectual close — the line that files the Warden under *the §XVI/§XVII
investigation* rather than under *combat*. See delta D-6: it cannot fire.

### G. Ambient cross-references

| Surface | Anchor | Keyed on |
|---|---|---|
| Town-crier news | `say the MT pass is open@26902` | `S_story.warden_resolved` — **no writer, ever** (D-5) |
| Shard Note **6** *The Chaconne Piece* | `flag:'wardensLegacyKnown', addText@27311` | `wardensLegacyKnown` |
| Inn dream | `flag:'vaArchitectureKnown'@27275` | `vaArchitectureKnown` — **independent of this arc** (D-7) |
| Froberger Entry 26 | `entryNum:26, nodeCode:'TRD'@27344` | none — always readable |

Entry 26 was written before Layer 56 existed and reads like the Warden seen from outside:
*"The data was on page seven. I wish I had taken longer with the first read."* It is the only
ambient reference in this table a player can actually reach.

---

## III. Design decisions, and how they aged

**A. Persuasion is gated by the item, not by a roll.** Deliberate. The Warden is not obstinate;
he lacks evidence. A player without the Log fights because they have no argument to make, not
because they failed a check. **Held** — no skill check was ever added.

**B. The combat path is honourable, not a punishment.** The Warden knew he might be stopped and
says so. The sub-clan scattering is the path's *consequence*, not its penalty. **Held.**

**C. `MT_WARDEN` as a synthetic battle code.** `S_story.defeatedBattles[pb.nodeCode] = true@25377`
runs before the Layer 56 handler, so a fight keyed to the real node would stamp
`defeatedBattles['GVA']` and corrupt a node the player revisits for §XVII and the callback.
Using a synthetic code keeps the node's state clean.

> **VERIFIED, AND PROMOTED TO AN INVARIANT.** This one-off trick is now a fenced contract:
> `check:noderegs` phase 6 requires every `code:` spread and `defeatedBattles[…]` key to
> resolve in `NODE_MAP` *or* appear in `SYNTHETIC_BATTLE_CODES`, where the arc is listed as
> `src/scripts/check-noderegs.js:Layer 56 — Void Shaman Warden@111`. A design
> decision that a CI gate now enforces is the best outcome a lab report can have.

**D. The callback is persuasion-only.** Combat leaves nobody to explain themselves, so Benedikt
has nothing to synthesise. Sound reasoning; see D-6 for why it never runs.

---

## IV. Spec → shipped delta table

Report claim on the left, HEAD on the right. **NOT SHIPPED** = never existed; **RETIRED** =
existed and was removed; **RENAMED** = the thing survived under a different key.

| # | Report says | HEAD | Verdict |
|---|---|---|---|
| D-1 | Gate at node `MT` | `GVA` — `GVA:{ num:50, code:'GVA'@8746`, *The Mountain Pass — High Crest*, `act:3` | **RENAMED.** `MT` was `num:50` with the identical label at `194a810`. Same node, new key. |
| D-2 | Benedikt callback at `SQ` | `NUE:{ num:35, code:'NUE'@8718`, *Scholar's Quarter — Weimar* | **RENAMED**, `num:35` both sides. |
| D-3 | Warrens / battleground at `GC` / `EG` | `TRD:{ num:26, code:'TRD'@8699` and `TBS:{ num:71, code:'TBS'@8792` | **RENAMED**, `num` preserved on both. |
| D-4 | `tier:'rare'` | `tier:"hard"` | **Transcribed exactly — and `rare` was never a legal value.** Fixed by `9df7a2b` (2026-06-04). See §V. |
| D-5 | *"News item `warden_resolved` fires on resolution"* | The line exists; `S_story.warden_resolved` has **no writer in the file's entire history** | **NOT SHIPPED, and wrong the day it was written.** → §AUDIT-03aq |
| D-6 | *"callback requires fav ≥ 2 (Dear Friend), i.e. `quest_wm_03`"* | `quest_wm_03` sets `npc:"benedikt_rasp", set:1@11112` — the **only** favor writer for Benedikt in 38,712 lines | **Unreachable.** `fav >= 2 ? '💛 Dear Friend'@23748` is the threshold. → §AUDIT-03ar |
| D-7 | *"Inn dream requires `wardensLegacyKnown` to precede it"* | `vaArchitectureKnown` is set at `node.code === 'NUE' && S_story.vaLastWardVisited@31920` — Warden not consulted | **Never true.** Good news: the fifth ending does not depend on this arc. |
| D-8 | *"`void_shaman` … not in the random drop table"*; §I.C *"connected only thematically"* | `monsters:[ P.goblin, P.hobgoblin, P.void_shaman ]@6363` + a 4-row `MONSTER_DROPS` table | **True when written** (`monsters:[]` at birth), **inverted by `9df7a2b`.** → §AUDIT-03as |
| D-9 | Shard Note **#5** | The `wardensLegacyKnown` conditional is on note **6**, *The Chaconne Piece* | **Wrong when written** — note 6 at the report's own tree. The cited *line* is exact. |
| D-10 | `completeFn:() => !!(S_story.wardensLegacyKnown)` | `completion:{ flags:['wardensLegacyKnown'] }` | Migrated by §ARCH-01 W7c. Contract identical. |
| D-11 | Quest `desc` as quoted | Rewritten; `hint` and `disposition` byte-verbatim | Prose revision, not rot. |
| D-12 | *"Reward: +600gp"* | `+600` inline **and** `reward:600` on the entry — but `q.reward` `is intentionally NOT read@37253` | **No double-pay.** Display-only field; the inline grant is the only payer. |

**Everything not in this table verified exact**, including all six statline fields, both Token
descriptions, the intro, both resolution monologues, the sub-clan outcomes, the quest hint and
disposition, and the Benedikt paragraph — 80 days and a whole format migration later.

---

## V. Risk register outcome

The report filed no risks. Three appear in hindsight; all three closed or are filed below.

| Risk | Outcome |
|---|---|
| `tier:'rare'` outside the five-value contract | **CLOSED and gated.** Every tier reader falls back silently — `_voidEnrage` gives the boss `{atk:1,dmg:1}`, initiative `+0` instead of `+3`, encounter weight a flat 10, and the threat badge renders `RARE`. `dx02g-monster-tier-contract.test.js` was written **because of this monster** and names it in its own header comment. *The single wrong value in this report is now the founding case of a CI gate.* |
| Exact name matching on `i.name === "The Constructor's Log"` (the report's own §IV worry) | **Still true, still fragile** — and now *two* grant sites push the item (`action:'grant',name:'The Constructor@11153` and `27868`). A rename in either breaks the persuasion path silently. Low risk while both are literal. |
| Intro fires once and never re-fires | **Verified as designed** (`if (!S_story.vshamanFound)`). A player who dismisses the render sees only the buttons afterwards. Cosmetic while the arc is unreachable; worth a re-read affordance if D-5/D-6 are fixed. |

---

## VI. Reachability — the finding

Implementation completeness and *playability* are different measurements, and this arc is the
program's cleanest separation of them. The census is 100 %. The playable surface is 27 %.

**The render node is fine.** `GVA:{r:23,c:186}@9654` is **alone in its cell** — no §AUDIT-03x
primacy problem, unlike seven of the nine §CROWN-01 nodes or three of four in Layers 54/55.

**The entry flag is not.** `vsShamanKnown` has exactly one writer in the file:

```
quest_vs_03  completion:{ flags:['vsDebtSettled'] }
             onComplete  set:['vsDebtSettled','vsShamanKnown']@13537
                 ↑
             the only writer of vsDebtSettled is
             S_story.vsDebtSettled = true;@34913
                 ↑
             inside  if (node.code === 'VS')
                 ↑
             VS:{r:12,c:198} shares its cell with BLT · CAN · VBY · NAS,
             and VBY:{ num:25, code:'VBY'@8684 is declared first,
             so VBY is list[0] and VS:{ num:279@9088 can never be currentCode.
```

`vaLastWardVisited` — the *other* prerequisite — is fully reachable, written at `GVA` by
`quest_va_03`. So the arc holds one live key and one dead key on an AND gate, which is the
same as holding none. **Layer 56 has never rendered in play, and could not have on the day it
shipped.** This is §AUDIT-03ao measured from the downstream end.

### Surface-by-surface

| # | Surface | Renders? |
|---|---|---|
| 1 | §XXI hook at `GVA` | ❌ `vsShamanKnown` unwritable |
| 2 | Persuasion button + monologue | ❌ inside 1 |
| 3 | Combat button | ❌ inside 1 |
| 4 | `MT_WARDEN` victory handler + Token | ❌ inside 1 |
| 5 | `quest_vs_warden` | ❌ `activateNode:null`; the hook is its only activator |
| 6 | Benedikt callback at `NUE` | ❌ **twice** — `vsShamanPersuaded` *and* `fav ≥ 2` |
| 7 | Town-crier `warden_resolved` | ❌ flag has no writer, ever |
| 8 | Shard Note 6 conditional | ❌ needs `wardensLegacyKnown` |
| 9 | `void_shaman` statline | ✅ via `epic_goblin_cave` at `TBS` |
| 10 | `MONSTER_DROPS.void_shaman` | ✅ same route |
| 11 | Froberger Entry 26 at `TRD` | ✅ independent of the arc |

**3 of 11 — and all three arrived in `9df7a2b` (2026-06-04), a data-audit commit with no
knowledge of Layer 56.** The audit filled an empty terrain roster and gave the statline a
trophy table. The net effect: the only way to meet The Warden in this game is to walk into
Kazrath's sanctum and roll him as a wandering monster — no dialogue, no Token, no mandate, no
choice. Everything the arc was *for* is the part that does not run.

**Withheld by the blockage:** 600gp, the Warden's Token, a two-path resolution, the Benedikt
synthesis, the Shard Note 6 line, the town-crier item, and the only encounter in the game whose
correct answer is a document.

**The fix is upstream and needs no design call.** §AUDIT-03ao's `VS`→`VBY` repoint restores
`vsDebtSettled` → `vsShamanKnown` → this arc's gate. `VBY`'s node text already seats Warlord
Kael Mordus and already discusses *"the shaman problem"* — the fiction is waiting there.

---

## VII. Dating and citation quality (method note)

The report is stamped 2026-05-25, the day the arc shipped at 09:10. Its line numbers date it
more precisely than that: five inline §II citations — `8070`, `11313`, `11684`, `11709`,
`11742` — are **exact at `e594848` (2026-05-25 13:29)** and at no committed tree before it. So
it was written against an uncommitted working tree roughly four hours after the ship, and its
inline pointers are the most accurate in the §DOC-02 corpus.

**Its §V File References table is a different artefact.** The same ten facts, restated: nine of
them land at **exactly −1** from the same tree (`4626`/4627, `8439`/8440, `10111`/10112,
`14611`/14612, `14723`/14724). The body was written with the file open; the table was
transcribed from the body afterwards and picked up a uniform off-by-one on the way.

> *Two passes over the same facts, four hours apart, one of them exact — the difference is
> whether the author was reading the file or reading their own draft.*

Both `nodeCode:'GC'` (Entry 26) and node code `MT` were **correct at that tree** and are
correct today under `TRD` and `GVA`. Per house rule, `docs/lab-reports/` is HISTORY: legacy codes
here are annotated, never rewritten.

---

## VIII. Post-mortem

### What worked

- **The opening line does the entire job of signalling optionality** without making combat feel
  like the wrong answer. The Warden does not plead. He states the situation and waits.
- **The Token description is the arc's failsafe.** A player who fights and never reads the Log
  still receives the verb-tense explanation, in an item they will open eventually. Redundant
  delivery of the one fact that matters is good content engineering.
- **`MT_WARDEN` was right, and is now enforced** (§III.C).
- **All five state fields, both helpers and every string survived §ARCH-01 and 80 days
  untouched.** When this arc is unblocked, nothing needs rewriting.

### What could be better

- The news item does not distinguish persuasion from combat — *"the pass is open"* is true
  either way, and the sub-clan walking back in to Mordus deserves its own line. (Moot until
  D-5 is fixed.)
- The Log check is name-based across two grant sites; a type+key check would be robust.
- No indicator tells a player the Benedikt callback exists or was missed.
- **Added by this pass:** the arc's own author filed three of the four self-criticisms above
  and was right about all three — but the *unfileable* problem, that no player has ever seen
  any of it, needed a reachability instrument the project did not have in May.

### Recommendation register

| # | Recommendation | Outcome |
|---|---|---|
| R1 | Distinguish the two outcomes in ambient news | **Open** (and blocked by D-5) |
| R2 | Type+key check for the Constructor's Log | **Open**, low cost |
| R3 | Re-read affordance for the intro | **Open**, cosmetic until §VI clears |

---

## IX. Defects filed

| Row | Sev | Summary |
|---|---|---|
| **§AUDIT-03ao** | 🟠 | *(existing, upstream)* `VS`→`VBY` / `STN`→`LCY` repoint. Unblocks this arc's entry flag. No design call. |
| **§AUDIT-03aq** | 🟠 | Three town-crier lines keyed to flags with **no writer in the file's history** — `warden_resolved`, `vs_hollow_seal_taken`, `tl_ori_account_read`, all born in `4c06f05` (Layer 62, 2026-05-24, the day *before* the arcs they describe). All three are the top of `qOrder`. No design call. |
| **§AUDIT-03ar** | 🟢 | `quest_wm_03` sets Benedikt's favor to **1** while announcing *"Benedikt is Dear Friend"* (threshold 2). Kills the Layer 56 callback and Benedikt's whole `dearFriend` dialogue pool. |
| **§AUDIT-03as** | 🟡 | `P.void_shaman` in the `epic_goblin_cave` roster makes The Warden a wandering encounter in Kazrath's sanctum, against §I.C. Small design call: separate key, or accept it. |
| **§AUDIT-03s** | — | *(existing, +2)* `say the MT pass is open@26902` and `"the DF node"` in the arc's intro — retired node codes in **player-facing strings**. |

**Doc rot found (filed, not repaired here):** `world.md:280` heads this arc **⚠️ PLANNED** while
`story.md:1697` heads it **✅**; both claim `void_shaman` is scripted-only / in no pool (D-8),
`story.md:1707` still says *"rare tier"* (D-4), `world.md:288` repeats the Dear Friend error
(D-6), `world.md:282` gives the Warden *"6 months"* in the tunnel (the engine says eleven years;
six months is the age of the carvings), and `index.md:714` reads *"Warden located at MT"*.
`docs/story/story-arc-investigation.md` — the maintained home doc — is correct and already
annotated throughout.

---

*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
