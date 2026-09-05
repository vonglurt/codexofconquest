<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §VM-01-G4: Class D per-verb (the migration front's last slice)

> **Status: CLOSED — design locked `f340143` 2026-08-04 · ask answered (refuse-at-click) ·
> G4a `b905733` · G4b `f7a60a5` · G4c `4c2a831` · G4d `b0c2478`, all shipped 2026-08-04/05.**
> **Verified against live `play.html` on 2026-08-23 (§DOC-02dc)** — 618 → this. The design
> pass and its four ship addenda are compressed into §3–§7; every surviving number is re-measured,
> every dead one is marked. Parent: [`lab-report-vm01g-migration-front.md`](lab-report-vm01g-migration-front.md)
> (verified 2026-08-23, §DOC-02db). Policy: **Host/Script Separation** + **Lab Report Policy**
> (CONTRIBUTING.md).

---

## Abstract

The §VM-01 track replaces per-node `if (node.code === 'XYZ')` branches inside `storyRender` with
small declarative vocabularies. G4 was its last block class: **Class D — the conditional button
that costs something and changes the world.** This report's design pass made three calls that the
next twelve slices had to live with, and it made them from measurement rather than from the parent
report's taxonomy. Two of them were corrections *to* that taxonomy: the `choice` opcode shipped six
weeks earlier **had no host end and could only throw**, and "Class D" was not one shape but three,
only a third of which are choices at all. The third call was a single missing opcode — `cost`.

**Scored 19 days and eleven further slices later: the engineering held completely.** All 21 named
symbols resolve, four of five re-measurement figures reproduce byte-exact at their own cited
hashes, every test count in the addenda is exact (57/57 across six files), and `cost` was in fact
the last opcode the VM ever needed — `src/js/quest.js` has had **one commit since**, and the parity
gate still prints the same **25,030 bytes**. What did not hold is smaller and more interesting:
one inherited number is scope-mislabelled, one correction is right for the wrong reason, and
**three surfaces this report itself classified as choices were never given a slice** — while the
plan declares itself COMPLETE.

---

## 1. Intent, inspiration, and what it does for play

**The inspiration is a complaint about adventure games**: the moment a game stops telling you what
it wants and starts quietly withholding the option, you cannot play it — you can only guess at it.
The track's working phrase is **telling-vs-asking**. The whole §12 ask below is that phrase turned
into a design knob, and the user answered it the way the phrase implies.

**What the feature adds to the game, concretely:**

1. **The world can ask you a question and take your answer.** Before G4a, a branching beat had to be
   hand-built as raw DOM by whoever authored it. After it, `{kind:'choice', prompt, options}` renders
   real buttons, waits across a render, and applies **only the branch you picked**. Kern & Sable at
   `DUS` is the first conversation in this game's history that is *data*.
2. **The game says its price out loud.** `cost` refuses **at click**, never at render — an
   unaffordable verb still lists, still reads, and answers *"💰 You don't have 50gp."* An option you
   can see and cannot afford is information; an option that silently vanished is a bug the player
   cannot report.
3. **Narrative that used to be destroyed now survives.** `storyMsg` *replaces* `#story-move-msg`, so
   an inline handler that spoke and then re-rendered erased its own line. The verb driver buffers a
   chain's narrative and hands it to `storyRender` as the **prefix**. Six authored beats have become
   readable for the first time because of this — Yva's speech, Brynn's firewood, Kenickie's
   *"Yeah. Okay. I'll hold onto this,"* and three more in later slices.
4. **A beat that is data can be tested, and one that is DOM cannot.** Every surface moved here is
   now covered by a golden-DOM-plus-bounding-box diff and a pinned registry, so the class of rot the
   whole track exists to stop — *a beat that quietly stops firing and nobody notices* — is now a
   failing gate rather than a player's puzzled silence.

**A design constraint worth keeping in view:** the reason this report refuses to force `choice` onto
all of Class D is the same reason it refuses to invent a `prompt_text` ask for two sites. The
parent's warning — *forcing one tool onto five classes "is how `itemsMinAny` happened"* — is a
standing hazard in this repo, and §4 below is that warning being obeyed inside the slice written to
honour it.

---

## 2. Method

Read all 22 blocks end to end at `ca0113c`; no sampling. Verification (2026-08-23) added: every
named symbol through one batched `grep -c`; each re-measurement figure re-derived **at its own cited hash**
via `git show <hash>:play.html`; the six test files run at HEAD rather than trusted from the
ship record; and `git log -S` on the one symbol whose stated rationale looked wrong.

**Citation convention.** Section numbers of the form §4, §9.1, §9.3, §10, §12⅞ refer to the
**original 618-line report's** numbering and are kept so its four ship addenda and the
§VM-01-G4c-FU backlog row stay traceable. §-numbers without a decimal (§3-F1, §6-N2) are this
document's own.

---

## 3. The design pass — six findings, as locked

**F1 — `choice` had no host end.** Inc A built the suspending half correctly (`*execBits(bits, ctx)`,
`*choice(bit, ctx)`, the `_uqfPump` slot) and the half that *renders* an ask and resumes with an
answer was never written. `renderChoiceBlock` — the name the old comments promised — occurred **0
times** in the file and 0 times in `src/js/quest.js`. All four live `execBits` entry points wrapped in
`_uqfRunToCompletion`, which **throws** on an ask. So *"migrate the buttons to `choice`"* was two
steps, and the second was the prerequisite. **G4a therefore ships the host renderer with zero
content migrated.**

**F2 — "Class D" is three shapes.** The parent's description fit the *click handler* of all 22 blocks
and the *surface* of very few:

| | Shape | Count |
|---|---|---|
| **D1** | one button, no alternative, panel retired on use | 13 surfaces |
| **D2** | N mutually exclusive options; picking any retires the panel | 7 surfaces / 6 blocks |
| **D3** | concurrent verb menu — all visible at once, none exclusive | 1 surface, 5 verbs (`CDG`) |

`choice` is **exclusive by construction**. A D1 through it is a one-option choice — a labelled effect
chain with ceremony. A D3 through it is an outright behaviour change: three concurrent boss buttons
would become *pick one, the other two vanish*. So the vocabulary is a **verb** — `{id, node, when,
label, bits}` — of which `choice` is one possible bit.

**F3 — two blocks capture free text, and must not move.** Entry 42 (`LHR`) and the Secret Gate
void-toll rune (`ZRH`) render a `<textarea>` and persist the player's own prose (`entry42Text`,
`_voidTollSecret`), both read back by the ending. `choice`'s resume value is an index *"so the data
author never couples to presentation"*; free text couples by definition. **Both stay inline, and the
report records why rather than leaving them looking un-migrated.** Grow the shape at three
consumers, not two.

**F4 — `consume` already existed; only `cost` was missing, and it is three currencies.** `item_remove`
was already live and covered every consume site. What was missing: **gold** (Yva 50gp · junction Help
10gp · Kenickie's 18/28/45/135), **class resource** (Weimar Surge Lock, 1 `surgeCharges`), and **hp**
(Memory Gate force-through, `hp = max(1, hp − 15)`). Two properties a naive leaf would have broken:
affordability is tested **at click, not at render**; and `reward` would not do the job — `gold: -50`
"works" arithmetically with no test, no refusal, and the word *reward* on a price. That is a
real-but-wrong object, and **a write into a real-but-wrong object never throws** (WBAPI Hazard #2).
**hp is not a cost** — the Memory Gate's 15 is narrated damage on a branch that always succeeds.

**F5 — two Class-E blocks sat in G4's territory.** Kenickie's Black Market (71 lines, its own state
machine) and the Lower Archive launcher are `NODE_HOOKS` material, not verbs; each had fallen
between three slices. Recorded so neither is quietly dropped a fourth time.

**F6 — the act-leg thread closes for this region.** One act comparison remains, `node.code === 'NUE'
&& (S_story.actNumber || 1) >= 3`. **`NUE` is `act:6`**, so the leg is not dead — it is **vacuously
true**, and has been since it shipped. Nothing to fix; recorded so the next reader need not
re-derive it. *(§DOC-02db later proved the general case: `S_story.actNumber = node.act || 1@34822` is
the field's only writer, so every such test asks "am I standing on an act-N tile." → §DX-02ft.)*

**The ASK — one open knob.** *When a verb is unaffordable, show-and-refuse or hide/disable?*
Recommendation **(a) keep refuse-at-click**: it is the no-op, it is provable by golden diff, and the
alternative *"makes the world quieter about what it wants."* **User's call 2026-08-04: (a).**

---

## 4. As-built inventory

**In the QUEST:CORE fence** (`src/js/quest.js`, re-inlined; 13 opcodes total):
`src/js/quest.js:cost(bit, ctx)@359` — `{gold?, resource?, count?, refuse?}`, registered in
`BIT_CONTRACTS` beside `reward` because it is `reward`'s inverse. **Both currencies are tested
before either is spent**, so a mixed price can never part-pay. Chain failure is `ctx._halt`, set by a
handler and broken on by `execBits`; the flag is **deliberately never cleared in the loop**, because
`ctx` is shared with the nested `execBits` a `choice` option runs.

**Host layer, outside the fence:** `function _uqfRenderAsk(gen, ask, mount, step)@6896` ·
`function _verbBits(verb, st)@6919` · `function _uqfRunVerb(verb, mount)@6925` ·
`function _uqfRunChain(bits)@6960` · `function _mkAmbientLine(text)@6889`.

**The registry:** `const NODE_VERBS@34518`, rendered by
`function _renderNodeVerbs(node, st, group, container)@34762`, dispatched **in place** at each
block's former source position — 12 call sites, one per group, so LIFO stacking is preserved by
construction.

**Entry shape, decided by what the entry carries** (this grew past §9.1's sketch, and the reason is
the finding): a D2 exclusive choice **has no button** — the options *are* the surface — so giving it
a `label` would insert a click the player never had to make.

| Carries | Surface | Class |
|---|---|---|
| `label` + `bits` | a button; the chain runs on click | D1 |
| `bits`, no `label` | the chain **is** the surface: runs at render, **must** park on a `choice` | D2 |
| `ambient` | a flavour line for a state that offers nothing to do | aftermath beat |
| `group` | the dispatch position — every group has exactly one call site, **asserted** | all |
| `btnStyle` | the site's own spacing; a label-only verb **is** its button, no wrapper | D1 |
| `bits` as `fn(st)` | text computed at click, as the inline handlers did | D1/D3 |

Two lessons are carried in that table rather than in prose. **A refusal that leaves an empty div
behind is not a refusal** — a label-less chain whose first bit is not a `choice` is refused *before*
its mount is created; the first implementation refused after, and a test caught it. And **a DOM diff
proves markup, not layout** — a bare button afterend of `#story-text-box` is stretched by a flex
column, the identical button inside a block mount shrinks to its text, and the golden capture called
them identical until a screenshot disagreed. The bounding box is now part of the capture.

---

## 5. Spec → shipped

| # | Claim as locked | Live at HEAD 2026-08-23 | Verdict |
|---|---|---|---|
| 1 | `renderChoiceBlock` never existed; `_uqfPending` read by nothing | now read at `_uqfRenderAsk@6896` (l. 6897) and cleared in `storyRender` (l. 34624). `renderChoiceBlock` occurs **once** — in the comment recording that it never existed | ✅ **built, and it is the slice's point** |
| 2 | Only `cost` is missing; no other grammar | 13 opcodes; `cost` is the **last one added**. `src/js/quest.js` has **one commit since** (`b905733`); `check:quest-parity` still prints **25,030 bytes** | ✅ **held for 11 further slices** |
| 3 | `cost` is not single-use (bar: 2 consumers) | **3**, at three prices in three surfaces: Yva 50gp@34356 · junction 10gp@35257 · `MME` hull 200gp@33924 (§VM-01-G-FU-d) | ✅ **cleared** |
| 4 | Refuse-at-click, byte-identical | `src/js/quest.js:cost` sets `_halt` + `_refused` and emits `refuse`; never contributes to `when` | ✅ |
| 5 | `combat`'s `nodeCode` covers D3; no new grammar | 3 boss verbs share `group:'cdg-boss-menu'` into one container | ✅ |
| 6 | Free text stays inline (§3-F3) | `entry42Text@34901` block live at 34634; `_voidTollSecret` block at 34768 | ✅ **deliberate** |
| 7 | Kenickie + Lower Archive → `NODE_HOOKS` verbatim | `nue-lower-archive` before `void-archaeology`; `cdg-kenickie-market` between `codex-core-chamber` and `la-riva-row` — **both orderings exact** | ✅ |
| 8 | `NUE` act-leg vacuously true, not dead | at 34696 (was 34691); `NUE` is `act:6`@8705 | ✅ **drifted 5 lines, unchanged** |
| 9 | 13 D1 surfaces migrate as one unit (§10) | measured down to **4** in-slice; 9 blocked by three unnamed gaps → §VM-01-G4c-FU | ⚠ **self-corrected at ship** |
| 10 | 7 D2 surfaces are genuine choices | **2** shipped (Kern & Sable). 2 excluded by F3. **3 never sliced** — see §6-N3 | ⚠ **NOT SHIPPED** |
| 11 | §1 re-measurement table | 4 of 5 reproduce **byte-exact** at their own hashes; 1 scope-mislabelled — §6-N2 | ⚠ **4/5** |
| 12 | `set:1` not `add:1`, because `add` would lower a favor at 2 | shipped bit is right; the **rationale is wrong and was wrong when written** — §6-N4 | ⚠ **right answer, wrong reason** |
| 13 | Test counts in the addenda | 12 / 10 / 13 / 12, plus coroutine 5 + env 5 = **57, all green** | ✅ **exact** |
| 14 | All named symbols | **21 of 21 resolve**; 5 more added by later slices | ✅ **100%** |

---

## 6. Findings of the 2026-08-23 verification

**N1 — the front kept moving, and the report is why.** Measured on the report's own definition
(`storyRender` start → `_mkSection`):

| | Parent lock `cf2c17c` | This report `ca0113c` | HEAD |
|---|---|---|---|
| Special-case region | 2,445 lines | 1,006 | **753** |
| `storyRender` total | 4,412 lines | 2,973 | **1,490** |
| `node.code ===` in `storyRender` | 125 | 77 | **29** |
| `node.code ===` file-wide | 131 | 120 | **96** |

The region is **30.8%** of the parent's lock and **74.9%** of this report's. `storyRender` lost 66%
of itself while the file grew.

**N2 — the one wrong number is a scope mislabel, inherited.** §1's row *"`node.code ===` comparisons
(whole file) | 124 → 120"* is the only figure that does not reproduce. The parent's **124** is its
`storyRender`-scoped **code** count (125 raw); whole-file at `cf2c17c` is **131**. So the row compares
a `storyRender`-scoped figure to a whole-file one and reports −4 where the like-for-like deltas are
131→120 (file) or 125→77 (`storyRender`). The error is not drift — it is a citation taken from a
parent without re-deriving its scope, which is precisely the discipline the report's own preamble
claims: *"Everything below was measured live at `ca0113c`, not carried from the parent."* Four of the
five figures honour that sentence exactly. The fifth is the one that was carried.

**N3 — three surfaces this report classified as choices were never given a slice.** §3-F2 counts 7
D2 surfaces. Two are excluded by F3 (free text). Two shipped as the G4b pilot. The remaining
**three are still inline and unaddressed**: the **Memory Gate** (`CO` approach, 34960), the **Prior
Carrier** (`NUE`, 35009), and **TL Vonn** (34840) — the last of which §9.3 explicitly named *"the one
true multi-step case — the pilot for `choice`."* §10's four-slice plan covers the pilot, D1 and D3,
and the status block declares **"the slice plan is COMPLETE."** It is complete against §10; it is not
complete against §4. **Consequence: `kind:'choice'` has exactly two occurrences in the entire game,
both at `DUS`** — the opcode this whole report was written around still has one consumer surface, 19
days on. → **§DX-02fv**.

> **✅ RESOLVED 2026-09-03 (§DX-02fv), option (a) of three.** **TL Vonn is sliced** as
> `tl-vonn-manifest`/group `tl-vonn`, and `choice` has **two consumer surfaces** now (three entries,
> three occurrences). Vonn's answer rides in the choice's **`prompt`**, not a `narrative` bit ahead
> of it: `narrative` buffers into `_uqfRunVerb`'s message join and would land *after* the pick, and
> the answer is the context you decide against. **The other two ride their asks and are recorded
> here as blocked, not as done** — the Memory Gate needs §VM-01-G4c-FU ask 3 (a bit that *starts* a
> ceremonia) and the Prior Carrier needs ask 2 (panel chrome). **So §4 is now complete but for those
> two, and the §10 status line is true of §10 only** — which is what it always said and what this
> finding was about. **Found in the slicing, and it generalises past this beat:** a verb's chain ends
> in a re-render, and `_renderNodeVerbs` draws before `storyCheckQuests` marks a quest complete, so a
> `when` guarded on quest *status* alone redraws its own button live in the same pass — measured
> re-clickable for a second +150gp. Every other migrated verb already guards on its own outcome flag
> (`!st.tlMissingShipSolved`, `!st.vsWeaponsFound`, `!st.s49SweelinckDelivered`); this one now does
> too. Pinned by `src/tests/integration/dx02fv-tl-vonn-choice.test.js` 5/5.

**N4 — the `favor` correction is right, and its stated reason is wrong.** §12⅞ recorded: *"`add:1`
would have **lowered** a favor already at 2."* `function _setNpcFavor(key, level)@23505` opens
`if (level <= prev) return;` — **it cannot lower anything**. And the `favor` handler's `add` path
reads the live level through `E.getFavor` (bound `2026-07-22`, twelve days *before* G4c) and clamps
at 3, so `add:1` on a favor of 2 **raises it to Dear Friend**. `set:1` is still the correct bit — it
reproduces the inline handler exactly — but the behaviour it avoids is an unearned promotion, not a
demotion. The wrong reason is **in the shipped file**, as the comment at l. 34361. → **§DX-02fw**.

**N5 — ask 3's bar was already met, inside this report's own census.** §VM-01-G4c-FU ask 3 asks
whether to add a bit that *starts* a ceremonia check, recommending *"leave it until a second consumer
exists (the §5 free-text rule: grow the shape at three, not two)"* — two different bars in one
sentence. `_rollCeremonia` is called from **two button handlers in this region**: the Codex Inquisitor
(35067) **and the Memory Gate** (34980) — the latter censused by this very report, in §2 and again in
F4's hp row. The lower bar is cleared on the report's own data. *(Whether to act on it is still the
user's call; the correction is that the ask must be stated against two consumers, not one.)*

**N6 — the vocabulary outgrew the report that designed it.** `NODE_VERBS` holds **20 entries in 12
groups**; G4 shipped 11 in 8. The other 9 (`crown-hw1/hg1/hn1/inn`, `lxx-dsf-smelt`) arrived from
§VM-01-G-FU-a/e, in the second special-case stack **below** the front — a region this report never
censused, and whose existence it could not have known. The schema absorbed all nine **without
growing a field**.

**N7 — all three blocked classes are still blocked, and one is now load-bearing.** The delayed beat:
**8** `setTimeout(… storyMsg …)` sites still live in the region. Panel chrome: `.sweelinck-variant`
at 50 occurrences, and the source now carries the comment *"…so they stay hooks until the G4c-FU
ask-2"* at l. 33078 — **this report's open ask has become a comment inside the shipped engine.**
§DOC-02db independently scored the same ask as the cause of **five consecutive zero-verb slices**.
The cooldown class (Reading Circle, `wmSessionsDays`) is likewise untouched, as §9.3 deferred it.

**N8 — the §6 gold census converted 3 of 7.** Yva and the junction converted; **Kenickie's four
prices (18/28/45/135, verbatim at 33012–33020) did not** — the shop moved to `NODE_HOOKS` whole, so
its four hand-written affordability tests came along unchanged. The `MME` 200gp site added later
brings `cost` to three consumers by growth, not by conversion. Not a defect — a consequence of F5
being right — but the report's own gold table should not be read as a migration list.

---

## 7. Risk register outcome

| Risk as filed | Outcome |
|---|---|
| Free Movement untouched | ✅ no mover code, no quest state in a step |
| Parity fence — G4a is the only slice that edits `QUEST:CORE` | ✅ and stronger than filed: **the only slice in the whole track that ever did** |
| Seeded RNG — add no `Math.random()` site | ✅ (§DX-02m still open on pre-existing sites) |
| Hazard #1 — stop `:1367` before inline-JS hand-edits | ✅ |
| LIFO / remove-then-recreate | ✅ satisfied by construction via in-place dispatch |
| Baseline `check:walk` 16/16 · Playwright 804/4 | ✅ **16/16 today**; the Playwright figure is superseded — **935/4 (940)**, the same documented `worldbuilder-crud-arrays` four |

---

## 8. Conclusion

The report's value was not its plan — §10's four slices were re-cut twice on contact, once by the
author (13 D1 surfaces measured down to 4) and once by the shape nobody modelled (§DOC-02db's
panel-embedded button). Its value was **three refusals**: it refused to force `choice` onto D1, it
refused to invent a text ask for two sites, and it refused to call hp a price. Each refusal is a
term that never entered the VM's grammar, and the proof they were right is a number the author could
not have known: `src/js/quest.js` has not been touched since the day `cost` landed, and the parity gate
still prints **25,030 bytes**.

The instructive failure is the mirror image. The one figure it carried instead of measuring is the
one that is wrong (N2); the one correction it explained instead of testing is the one whose reason is
backwards (N4); and the design call it recorded most carefully — *`choice` is for D2, and there are
seven of them* — is the one its own slice plan then walked past (N3). **A report can be scrupulous
about the numbers it takes from the file and casual about the ones it takes from itself.**

---

## 9. Defects → BACKLOG

- **§DX-02fv 🟡 ✅ SHIPPED 2026-09-03** — the three unsliced D2 surfaces (Memory Gate · Prior
  Carrier · TL Vonn), and the status line that calls the plan COMPLETE without them. **Option (a):**
  TL Vonn sliced as `choice`'s second consumer surface; the other two recorded as blocked behind
  §VM-01-G4c-FU asks 3 and 2 respectively. See the resolution note in §N3 above.
- **§DX-02fw 🟢** — the wrong `favor` rationale in the shipped comment at `play.html` l. 34361
  (and §12⅞ of this report, corrected here). Keep `set:1`; fix the reason.
- **§VM-01-G4c-FU** — ask 3 amended in place: the second-consumer bar is already met (N5), and the
  ask states two different bars. Asks 1 and 2 stand as filed; ask 2 is now the track's most expensive
  open call (§DOC-02db).

---

## 10. Anchors

`function storyRender(node, prefix)@34816` · `function _mkSection(id, icon, label)@35528` ·
`const NODE_PANELS@31532` · `function _renderNodePanels(node, st)@31828` · `const NODE_HOOKS@34416` ·
`function _runNodeHook(id, node, ctx)@34480` · `const NODE_VERBS@34518` ·
`function _renderNodeVerbs(node, st, group, container)@34762` · `let _uqfPending@6835` ·
`function _uqfPump(gen, answer)@6838` · `function _uqfRunToCompletion(gen)@6851` ·
`function _mkAmbientLine(text)@6889` · `function _uqfRenderAsk(gen, ask, mount, step)@6896` ·
`function _verbBits(verb, st)@6919` · `function _uqfRunVerb(verb, mount)@6925` ·
`function _uqfRunChain(bits)@6960` · `*execBits(bits, ctx)@22251` · `*choice(bit, ctx)@22347` ·
`reward(bit, ctx)@22297` · `combat(bit)@22328` · `item_remove(bit, ctx)@22330` ·
`function _setNpcFavor(key, level)@23505` · `src/js/quest.js:cost(bit, ctx)@359`

---

*© 2026 Paul Richeson — MIT License.*
