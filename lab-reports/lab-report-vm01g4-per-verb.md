<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §VM-01-G4: Class D per-verb (the migration front's last slice)

> **Status: DESIGN LOCKED `f340143` · ASK ANSWERED (refuse-at-click) · G4a ✅ SHIPPED `b905733` ·
> G4b ✅ SHIPPED `f7a60a5` · G4c ✅ SHIPPED `4c2a831` · G4d ✅ SHIPPED `b0c2478` — **the slice plan
> is COMPLETE** — see the §12½, §12¾, §12⅞ and §12⁹⁄₁₆ addenda. §1–§12 below are the design pass as written before any edit and are left
> unrewritten; the addendum is where what actually shipped is recorded.** This is the child
> design pass the parent report's §7 design lock required before G4 may be built
> (*"G4 OK in principle, but G4 gets its own child design pass first"*). Parent:
> [`lab-report-vm01g-migration-front.md`](lab-report-vm01g-migration-front.md). Track policy:
> **Host/Script Separation** (CONTRIBUTING.md), **Lab Report Policy** (design shapes locked
> before any edit).
>
> **Everything below was measured live at `ca0113c`, not carried from the parent.** Where the
> parent's numbers have drifted, the drift is recorded rather than quietly corrected — for the
> same reason §VM-01-G3 recorded it: *the drift is the evidence that the thesis is real.*

---

## 1. Re-measurement — the front has moved, and it moved because of this track

| | Parent lock (2026-07-28) | Now (`ca0113c`) |
|---|---|---|
| `storyRender` start | 30887 | **32696** |
| Migration front (`_mkSection`) | 33332 | **33702** |
| Special-case region | **2,445 lines** | **1,006 lines** |
| `node.code ===` comparisons (whole file) | 124 | **120** |
| …of those, in the region | 77 | **29** |

The region is **41% of what the parent measured** — G1 (12 panels), G2 (7 hooks), G2b (29 npc-row
hooks) and G3 (5 activation stanzas) account for the difference. The parent's warning that *"the
front moves backward ~4/day"* no longer holds inside the region: the front moved **forward** by
1,439 lines in seven days. G4 is what is left.

**Registries in the house style G4 must match** (both live, both already load-bearing):
`NODE_PANELS` (`const NODE_PANELS@31313`, rendered by `_renderNodePanels(node, st)@31588`) and
`NODE_HOOKS` (`const NODE_HOOKS@34185`, dispatched in place by `_runNodeHook(id, node, ctx)@34248`).

---

## 2. The census — 22 blocks, 838 classified lines

Read end-to-end, not sampled. Ranges are inclusive of each block's leading comment.

| Lines | Node | Block | Class |
|---:|---|---|---|
| 40 | LHR | Entry 42 journal (§XV) | **D — free text** |
| 45 | NUE/TLS | Sweelinck age line · map line · S49 reveal | A ×2 + **D** ×1 |
| 71 | NUE | Weimar: Surge Lock · Lower Archive · Reading Circle | **D** ×2 + E ×1 |
| 35 | ZRH | Secret Gate void-toll rune | **D — free text** |
| 48 | STN | Harbor Board · Ori | **D** ×2 |
| 39 | TL | Vonn → nested choice | **D — nested** |
| 46 | VS | Solvak probe · Seal delivery | **D** ×2 |
| 28 | TRD | Yva (50gp) | **D — cost** |
| 8 | NUE | Benedikt callback | A |
| 21 | TLS | Froberger sealed letter (NG+) | **D** |
| 32 | TLS | Memory Gate | **D — cost (hp)** |
| 15 | TLS | Bruhns CO scene | A |
| 45 | NUE | Prior Carrier | **D** |
| 24 | NUE | Codex Inquisitor | **D** |
| 13 | BK | EB approach panel | A *(order-blocked in G1)* |
| 144 | CDG | 3 boss buttons · Kenickie market · la_riva delivery | **D** ×4 + E ×1 |
| 76 | DUS | Kern & Sable | **D** |
| 50 | junctions | Junction Vignettes | data *(already a registry)* |
| 13 | HKG/TLL | cross-item lines | A |
| 18 | TLL | firewood button | **D** |
| 21 | MHQ/EB | Quill beats 2/3 · EB NG+ line | A |
| 6 | KRN | Sealed Scholar Box auto-spawn | data |

**838 lines across 22 blocks. ~667 are D-ish, 70 are leftover Class A, 56 are already data.**

---

## 3. Finding 1 — the keystone Inc A shipped has no host end. `choice` cannot be driven from
anywhere in the game today.

This is the finding that reorders the whole slice, and it was not visible from the parent report.

Inc A built the coroutine seam and built it correctly: `execBits` is a generator
(`*execBits(bits, ctx)@22223`), `choice` is a suspending handler that yields an `ask` envelope
(`*choice(bit, ctx)@22319`), and the host has a driver that parks the generator in a module slot
(`function _uqfPump(gen, answer)@6827`, `let _uqfPending = null@6824`).

**What was never built is the other half of the driver — the part that renders the ask and resumes
with an answer.** Measured:

- `_uqfPump` has exactly **one** caller in the game: `_uqfRunToCompletion@6840`, which **throws**
  on an unresolved ask.
- All **four** live `execBits` entry points wrap in that thrower — `_resolveQuestUQF`'s onPass
  (`6880`) and onFail (`6883`), `storyCheckQuests`' onComplete (`30017`), and the board's unlock
  shim (`36843`). The fifth, `skill_check`'s internal branch (`22116`), uses the kernel's own
  `_questRunToCompletion` and carries a comment saying so in as many words: *"a choice in
  onPass/onFail throws, by scope-fence."*
- `_uqfPending` is **read by nothing** in `roll2hit-v3.html`. Its only readers are two integration
  tests (`uqf-coroutine.test.js`, `uqf-env.test.js`), which drive `_uqfPump(gen, index)` by hand.
- `renderChoiceBlock` — the name the parent's proof #1 quotes from the old empty-handler comment —
  occurs **0 times** in `roll2hit-v3.html` and **0 times** in `js/quest.js`. It has never existed
  as code. (§DX-01e-FU2 reached the same conclusion from the anchor side; this confirms it from
  the call-graph side.)
- `kind:'choice'` occurs **0 times** in `QUEST_DB`. G4 is still `choice`'s first content consumer,
  exactly as the parent said — but it is *also* its first **host** consumer, which the parent did
  not say.

**Consequence:** a `choice` bit placed in any live quest today does not render a choice. It throws.
So "migrate the buttons to `choice`" is not one step, it is two, and the second one is the
prerequisite. **G4's first slice is the host choice renderer, and it ships with zero content
migrated** — which is the right shape anyway, because it can be proven against the existing
coroutine tests before a single player-facing block moves.

---

## 4. Finding 2 — "Class D" is three shapes, and only a third of the surfaces are choices

The parent classed these as one thing: *"conditional button → click runs {gold cost, flag writes,
item grant, favor, quest unlock, storyMsg}"*. Reading all 22 blocks, that description fits the
**click handler** of every one of them and the **surface** of very few. Three distinct shapes:

**D1 — single verb (13 surfaces).** One button, no alternative offered, panel removed on use.
S49 Sweelinck reveal · Surge Lock · Reading Circle · Harbor Board · Ori · Solvak probe · Seal
delivery · Yva · Froberger letter · Codex Inquisitor · la_riva delivery · firewood · Junction
Vignette `[Help — 10gp]`.

**D2 — exclusive choice (7 surfaces in 6 blocks).** A panel offering N mutually exclusive options;
picking any removes the panel. Entry 42 (2) · ZRH Secret Gate (2) · Memory Gate (2) · Prior Carrier
(3) · Kern & Sable first meeting (3) · Kern & Sable follow-up (2) · TL Vonn (1 → 2, nested).

**D3 — concurrent verb menu (1 surface, 5 verbs).** CDG's `cq-boss-buttons` div holds the Taz
Devil, Don Fluffissimo and Cat-King confrontations plus the Kenickie launcher and the la_riva
delivery — **all visible at once, none exclusive, the div persisting across renders.**

**Why this matters, and it is the report's central design finding:** `choice` is *exclusive by
construction*. It suspends, takes one index, runs that option's bits and discards the rest. Mapping
a D1 onto it would mean a one-option choice — which is not a choice, it is a labelled effect chain
with ceremony. Mapping D3 onto it would be an outright **behaviour change**: three concurrent boss
buttons would become "pick one, the other two vanish."

So the vocabulary G4 needs is **not** `choice` for Class D. It is a **verb** — `{id, node, when,
label, bits}` — of which `choice` is one possible *bit*, used only where the block is genuinely
exclusive. 13 of 21 D surfaces need no `choice` at all; 7 need it; 1 (CDG) needs the opposite of it.

This is the same mistake the track exists to stop, one layer along: the parent warned that forcing
one tool onto five classes *"is how `itemsMinAny` happened — a shape grown for the wrong layer."*
Forcing `choice` onto all of Class D would be that warning coming true inside the slice written to
honour it.

---

## 5. Finding 3 — two blocks capture free text, which `choice` cannot express and should not

`Entry 42` (LHR) and the `Secret Gate` void-toll rune (ZRH) both render a `<textarea>` and persist
the player's own prose — `S_story.entry42Text@34651` and `S_story._voidTollSecret@34763`. Both are
read back by the ending. `choice`'s resume value is *"an index, so the data author never couples to
presentation"* (`22152`); a free-text answer couples to presentation by definition.

These are **not** G4 material. Adding a `prompt_text` ask to satisfy two blocks would be a
single-use term in the VM's grammar — the exact thing the Host/Script Separation Policy forbids and
`itemsMinAny` is the standing example of. **Recommendation: both stay inline, and G4 records why
rather than leaving them looking un-migrated.** (If a third free-text site ever appears, that is
the moment to grow the shape — with three consumers, not two.)

---

## 6. Finding 4 — `consume` already exists; only `cost` is missing, and it is three currencies

The parent named the missing grammar as *"a `cost` leaf (gold≥N, consume) — ONE new opcode."* Half
of that is already shipped: **`item_remove`** is a live handler (`item_remove(bit, ctx)@22302`) and
covers every consume site measured (Hollow Hands Seal, Old Tuna Account Book).

What is genuinely missing is the **cost** half, and it is not one currency:

| Currency | Sites | Shape |
|---|---|---|
| **gold** | Yva 50gp (`33096`) · Junction Vignette Help 10gp (`33625`) · Kenickie's four prices (18/28/45/135) | `if (gold < N) { msg; return; } gold -= N;` |
| **class resource** | Weimar Surge Lock — 1 `surgeCharges`, spent permanently (`32860`) | gated at render (`surgeCharges > 0`), decremented on click |
| **hp** | Memory Gate force-through — `hp = max(1, hp - 15)` (`33171`) | no affordability test; it is a *consequence*, not a price |

Two properties of the shipped behaviour that a naive `cost` leaf would silently change:

1. **Affordability is tested at CLICK, not at render.** Yva's button always shows and refuses with
   *"💰 You don't have 50gp."*; Kenickie's Buy always shows and refuses with `storyBlock`. A `cost`
   leaf that hides or disables the unaffordable verb is a **UX change**, not a no-op — and the
   telling-vs-asking thesis of this whole track argues the current behaviour is the better one
   (the game says what it wants; it does not quietly withhold the option).
2. **`reward` will not do the job.** `reward(bit, ctx)@22269` does `st.gold = (st.gold||0) + bit.gold`,
   so `gold: -50` "works" arithmetically — with no affordability test, no refusal message, and the
   word *reward* on a price. That is a real-but-wrong object, and per WBAPI Hazard #2's standing
   lesson, **a write into a real-but-wrong object never throws.**

**Recommended shape:** one leaf, one currency field, refuse-at-click preserved:
`{ kind:'cost', gold?:N, resource?:'surgeCharges', count?:N, refuse?:'…' }` — fails the chain (and
emits `refuse`) when unaffordable, spends when not. **hp is NOT a cost** — the Memory Gate's 15 hp
is narrated damage on a branch that always succeeds, so it belongs in that option's bits as an
effect, not as a price. Recording that distinction is the point of measuring all three.

---

## 7. Finding 5 — two Class-E blocks are sitting in G4's territory and belong to G2's vocabulary

**Kenickie's Black Market** (`33325`–`33395`, **71 lines**) is a shop with its own state machine — a
stock table, a live-updating gold line, per-row buy handlers, a close button. It is Class E by the
parent's own definition (*"real interfaces with their own state machines … the fix is
registration, not data"*). **The Lower Archive** button (`32870`–`32885`) is a launcher for
`_storyWmArchiveModal`, already a separate function — the same shape.

Neither is a verb and neither should enter the VM. They are `NODE_HOOKS` entries that G2 and G2b
each passed over for a defensible reason (G2's deferral list named the Kenickie shop; G2b then
found it *"is a CDG surface in G3's territory"* — true, and G3 migrated quest activation, not UI,
so it fell between three slices). **Recommendation: they move to `NODE_HOOKS` in G4's mechanical
slice, using G2's verbatim-extraction method, not G4's VM method.** Recorded here so the count is
honest and neither is quietly dropped a fourth time.

---

## 8. Finding 6 — the act-leg thread §VM-01-G2b opened is now closed for this region

G2b found five narrative beats gated on `actNumber >= N` at nodes whose `act` is 1, and therefore
permanently dead (`S_story.actNumber = node.act || 1@34568`, assigned every render). Swept for the
same shape across G4's region: **one act comparison remains** —
`node.code === 'NUE' && (S_story.actNumber || 1) >= 3@34691` (Sweelinck's "map before the city"
line). **NUE is `act:6`**, so the leg is not dead — it is **vacuously true**, and has been since it
shipped. It is not staging; arriving at NUE at all satisfies it.

Nothing to fix and nothing to file: a no-op condition on a once-flagged line is harmless, and
deleting it would be an unverified rewrite of authored intent (§AUDIT-03m-FU's laundering lesson).
**Recorded so that the next reader does not have to re-derive it, and so the class is measured as
closed rather than assumed to be.** (The other act reference in the region, `33595`, *selects*
vignette text by act — it gates nothing.)

---

## 9. The design

### 9.1 `NODE_VERBS` — the third small vocabulary, matched to D1/D3

Same house style as `NODE_PANELS`/`NODE_HOOKS`: an **ordered** registry plus one renderer,
dispatched **in place** at the source position the block occupies (G2's rule — LIFO stacking is
preserved by construction, so no per-block order analysis is needed).

```js
{ id:'trd-yva',  nodes:['TRD'], anchor:'story-text-box',
  when: st => (st.quests||{})['quest_vs_02'] === 'active' && !st.vsWeaponsFound,
  label:'💬 Find Yva (50gp).',
  bits: [ { kind:'cost', gold:50, refuse:"💰 You don't have 50gp." },
          { kind:'narrative', msg:'Yva: "Fifty gold. …' },
          { kind:'flag_write', set:['vsWeaponsFound'] },
          { kind:'favor', npc:'yva', add:1 },
          { kind:'reward', items:[{ name:'Hollow Hands Seal', … }] },
          { kind:'unlock', quests:['quest_vs_03'] } ] }
```

Every bit in that chain but `cost` is a **shipped opcode**. That is the measured claim the parent
made for the class and it holds: across all 13 D1 surfaces the only grammar gap is `cost`.

A **D3 menu** is just several `NODE_VERBS` entries sharing a `group` id, rendered into one
container — which is what `cq-boss-buttons` already is. The three CDG confrontations become
`{ kind:'combat', key:'taz_devil', label:'…', nodeCode:'CQ_TAZ' }`; **`combat`'s optional
`nodeCode` field already exists** (`combat(bit)@22300`) and is exactly the synthetic-code spread
those buttons hand to `storyPreBattle` today, so no grammar is needed for them either.

### 9.2 The choice driver — the host half Inc A left unbuilt

One function, host layer, never a parity-fenced kernel:

- `_uqfRunVerb(verb, node)` starts `QuestRuntime.execBits(verb.bits, ctx)` and pumps it.
- On an `{ask:'choice', prompt, options}` envelope it renders a panel of option buttons in place of
  the verb's own button and returns; the click handler calls `_uqfPump(gen, index)` and repeats.
- On completion it re-renders the node.

Three properties that must be designed in, not discovered:

1. **`_uqfPending` is a single module-level slot.** Inc A's comment justifies that with *"a choice
   resolves within one interaction turn, so no autosave ever captures a suspension."* A **node**
   choice breaks that premise — it can sit on screen across a render. The driver must therefore
   **abandon any pending generator when `storyRender` runs** (drop the slot, re-render the verb
   from `when`), which is safe precisely because `choice` applies *only the picked option's bits,
   after the pick* — an abandoned suspension has written nothing.
2. **Re-entrancy.** `storyRender` is re-entrant (G1's hazard #2). Verb divs are removed by managed
   id first, then recreated from the registry — same as `_renderNodePanels`.
3. **The scope fence stays.** `skill_check`'s onPass/onFail keep `_questRunToCompletion`; a choice
   nested inside a skill-check branch still throws. G4 does not widen that, and the Codex Inquisitor
   verb (button → `_rollCeremonia`) is the reason it does not need to: the verb *starts* the check,
   it does not contain it.

### 9.3 What does NOT move

| Block | Why |
|---|---|
| Entry 42 · ZRH Secret Gate | free text — §5 |
| Kenickie market · Lower Archive | Class E — §7, goes to `NODE_HOOKS` |
| Reading Circle | day-cooldown counter (`wmSessionsDays`, 3 sessions); the repeat/cooldown notion lives in quests (`retryable`/`retryGateDays`), not in verbs. Defer with a reason rather than grow a `cooldown` field for one site. |
| Junction Vignettes | already a data registry; its `[Help — 10gp]` verb is a **`cost` consumer to convert later**, not a block to move |
| TL Vonn nested choice | the one true multi-step case — **the pilot for `choice`**, but only after §10-slice 1 |

---

## 10. Slicing (four, each independently shippable and provable)

- **G4a — the host choice driver + `cost` leaf. No content moves.** Build `_uqfRunVerb` and the
  ask renderer; add `cost` to `BIT_CONTRACTS` + `HANDLERS` in `js/quest.js`, re-inline, extend
  `check:questparity`. **Provable with zero player-visible change**: the existing
  `uqf-coroutine`/`uqf-env` tests already drive the generator by hand and must stay green, plus new
  tests that drive a choice through the *host* path end to end. This is the slice that turns Inc A
  from a seam into a feature.
- **G4b — Kern & Sable → the pilot.** 76 lines, three options then two, **no cost, no combat, no
  free text, one node, one flag pair** — the cleanest `choice` in the file. Golden-DOM/state diff
  across the block's three states.
- **G4c — the 13 D1 verbs → `NODE_VERBS`,** in the G1 method (ordered table, in-place dispatch,
  golden-DOM combo diff). Includes converting the Junction Vignette Help button to the new `cost`
  leaf, which proves `cost` is not single-use — the parent's stated bar for adding it.
- **G4d — CDG's D3 menu + the two Class-E strays.** The menu becomes grouped `NODE_VERBS`
  (`combat` bits, no `choice`); Kenickie and Lower Archive go to `NODE_HOOKS` verbatim.

Order matters: **G4a is a hard prerequisite for every other slice**, and G4b before G4c so the
first `choice` in the game's history ships alone and can be eyeballed (§7½) without 13 other
migrations in the same diff.

---

## 11. Invariants and hazards

- **Free Movement untouched** — verbs and choices are not movement steps; no mover code, no quest
  state consulted in a step.
- **Parity fence.** G4a edits `QUEST:CORE` — the *only* slice in this track that does. Edit
  `js/quest.js`, re-inline, re-run `check-quest-parity.js`; the driver and renderer are **host**
  code and must stay outside the fence (`_uqfPump` already is).
- **Seeded RNG.** No new rolls. Note that `§DX-02m` is open over unseeded `Math.random()` in
  state-writing paths; G4 must not add a site.
- **Hazard #1** — stop `:1367` before any inline-JS hand-edit.
- **LIFO / remove-then-recreate** — the parent's two load-bearing hazards apply unchanged; in-place
  dispatch (G2's method) satisfies the first by construction.
- **Baseline:** `check:walk` **16/16 exit 0** and Playwright **804 passed / 4 failed** (the
  documented `worldbuilder-crud-arrays` four). Any other red in G4 is a real regression.

## 12. The ASK — one open knob for the user

Everything above is decided by measurement except one thing, and it is a **design** call because it
changes what the player sees:

> **When a verb is unaffordable, should the button be shown-and-refusing (today's behaviour, at all
> six gold sites) or hidden/disabled?**

- **(a) Keep refuse-at-click** — byte-identical behaviour, `cost` fails the chain and emits
  `refuse`. Consistent with the track's telling-vs-asking thesis: the game states the price rather
  than quietly withholding the option.
- **(b) Gate at render** — `cost` also contributes to the verb's `when`, so unaffordable verbs do
  not list. Tidier UI, but it is a real behaviour change at six sites and it makes the world
  quieter about what it wants.

**Recommendation: (a).** It is the no-op, it is provable by golden diff, and (b) can be added later
as an opt-in `hideWhenUnaffordable` field if play argues for it. G4a should not start until this is
answered, because the `cost` leaf's contract differs between them.

---

## 12½. ADDENDUM — the ASK is answered and G4a is SHIPPED (2026-08-04, `b905733`)

**Answer: (a) refuse-at-click.** The user's call, matching this report's recommendation. `cost`
therefore never contributes to a verb's `when`; a `hideWhenUnaffordable` opt-in remains available
later if play argues for it, and adding it would not change any behaviour shipped here.

**What shipped (G4a — driver + leaf, zero content moved, as sliced in §10):**

- **`cost` in the kernel** (`js/quest.js`, inside the QUEST:CORE fence → re-inlined; parity green at
  25,030 bytes). Contract `{ gold?, resource?, count?, refuse? }`, registered in `BIT_CONTRACTS`
  beside `reward` because it is `reward`'s inverse. Both currencies are **tested before either is
  spent**, so a mixed price can never part-pay — a property this report measured for but did not
  name, and the only one a naive implementation gets wrong silently.
- **Chain failure**, the mechanism the leaf needed: a handler may set `ctx._halt`, and `execBits`
  breaks on it. The flag is **deliberately never cleared** in the loop — `ctx` is shared with the
  nested `execBits` a `choice` option runs, so a halt inside a branch aborts the chain it belongs
  to instead of letting the outer bits run on unpaid. One `ctx` per run is what makes a sticky flag
  safe, and both drivers build a fresh one.
- **The host half of the coroutine** (`_uqfRunVerb`/`_uqfRenderAsk` beside `_uqfPump`, outside the
  fence). §3's finding made real: an `{ask:'choice'}` envelope now renders as one button per option
  in the verb's own mount, resumes the same generator with the picked index, and on completion
  removes the mount and re-renders the node with the chain's narrative as `storyRender`'s prefix
  (`_resolveQuestUQF`'s route — storyRender's tail `storyMsg` would otherwise overwrite it).
- **The abandonment rule §9.2 required**: `storyRender` drops `_uqfPending` beside the sweep that
  takes the panel's DOM, and an option button re-checks that the slot still holds *its* generator,
  so a stale panel is inert rather than resuming a dropped chain.

**Evidence.** `uqf-verb-driver.test.js` **12/12**, and the **positive control is the shape that
matters**: against HEAD **10 of 12 fail, and the 2 that pass are exactly the two asserting
*unchanged* behaviour** — a chain with no `cost` runs every bit, and a `choice` inside
`skill_check` still throws. `check:walk` **16/16 exit 0** (`check:questparity` byte-identical),
Playwright **816 passed / 4 failed** — the documented `worldbuilder-crud-arrays` four.

**Unchanged by design:** §5 (the two free-text blocks stay inline), §7 (Kenickie + Lower Archive go
to `NODE_HOOKS` in G4d), §8 (the act-leg thread stays closed). **Next: G4b** — Kern & Sable, the
first `choice` in the game's history, shipping alone so it can be eyeballed.

---

## 12¾. ADDENDUM — G4b is SHIPPED: the first `choice` in the game's history (2026-08-04)

**What shipped.** `NODE_VERBS` — the third small vocabulary §9.1 locked — plus `_renderNodeVerbs`,
and Kern & Sable's 76 inline lines at DUS as its three entries. Nothing else moved.

**The schema grew one field beyond §9.1's sketch, and the reason is worth recording.** §9.1 wrote
`{id, nodes, anchor, when, label, bits}` — a **button** verb, which is the D1 shape. A D2 exclusive
choice has no button: the options *are* the surface, with no intermediate click. Giving Kern & Sable
a `label` would have inserted a click the player never had to make. So the entry shape is decided by
what it carries:

| Carries | Surface | Class |
|---|---|---|
| `label` + `bits` | a button; the chain runs on click | D1 (G4c) |
| `bits`, no `label` | the chain **is** the surface: it runs at render and **must** park on a `choice` | D2 |
| `ambient` | a flavour line for a state that offers nothing to do | the aftermath beat |

The label-less mode needs a guard rather than a convention, because running a chain at render is
exactly how you get side effects on every draw of a node. A label-less chain whose first bit is not
a `choice` is **refused with a warning, before its mount is created** — the second half of that
sentence is the part the test caught: the first implementation refused *after* inserting the mount,
so a refusal still changed the page. **A refusal that leaves an empty div behind is not a refusal.**

**The two behaviour deltas, both named rather than discovered:**

1. **The driver re-renders on completion**, so the Q-NEXUS-01 follow-up now appears in the same beat
   as [Ask] instead of on the next arrival, and the aftermath line appears the moment Q-NEXUS-02
   completes. The inline handlers ended with `hmDiv.remove()` and no re-render. The fiction supports
   it — they are still at the counter, waiting — and it is asserted in the test file rather than left
   to be noticed. `story.md`'s "next `DUS` visit" wording is kept and annotated as authored intent.
2. **The empty 8px spacer is gone.** The inline block always inserted its `hmDiv`, so the "listened
   and walked away" state rendered an empty bordered-nothing with a top margin. The registry renders
   nothing there.

**Evidence.** Three artifacts, in the order they were built:
- **A multiset diff of the authored strings** between HEAD's block and the new table: **14 vs 14,
  identical, nothing added or lost**, with the three ambient lines unwrapped from the `innerHTML`
  wrapper the old block hand-built. This is the G2b line-multiset-diff method adapted to a block
  that *could not* be moved verbatim — its shape changed, so only its content can be pinned, and
  pinning the content is what proves no prose was retyped.
- **A golden-DOM diff of all four DUS states** against HEAD (temp harness, deleted). Text and button
  labels **byte-identical**, including the 6px/4px button spacing — `_uqfRenderAsk` was given the
  first-button 6px the hand-written panels all used, so the migration is pixel-identical rather than
  merely equivalent. The remaining deltas are the mount's `id`, a `data-uqf-option` attribute, one
  redundant wrapper `<div>` + `<em>` dropped from an already-italic `.npc-ambient` (CSS 2122 — zero
  pixels), and delta 2 above.
- **`uqf-node-verbs.test.js` 10/10**, with **all 10 failing at HEAD**. That is *not* the "some tests
  assert unchanged behaviour and pass both ways" shape G2b had, and the difference is honest: the
  surface's DOM identity changed with the migration, so the equivalence proof has to live in the
  golden diff, not in the after-state contract.

Plus `check:walk` **16/16 exit 0** (`check:questparity` **25,030 bytes — the kernel was not touched**;
this slice is entirely host code), full Playwright **826 passed / 4 failed** = the documented
`worldbuilder-crud-arrays` four, and **§7½ eyeballed**: all three states screenshotted in the running
game, the sidebar ITEMS counter ticking 0→1 as the token lands through the `reward` bit.

**One thing measured and left alone.** `_mkAmbientLine` was factored out so a `choice`'s `prompt` and
a `NODE_VERBS` `ambient` cannot drift apart — one shape, one definition. The `<em>` the inline blocks
wrapped their ambient in is not reproduced: only 3 of the 10 `.npc-ambient` sites in the file use it,
the class is already `font-style:italic`, and keeping it would have meant two markup shapes inside
one new renderer.

**Not migrated, unchanged from §9.3:** the free-text blocks (§5), Kenickie + Lower Archive (§7).
**Next: G4c** — the 13 D1 verbs → `NODE_VERBS`, plus converting the Junction Vignette `[Help — 10gp]`
to `cost`, which is the parent's stated bar for the leaf not being single-use.

---

## 12⅞. ADDENDUM — G4c is SHIPPED `4c2a831`: the button mode gets its first consumers, and the D1
count was measured down from 13 to 4 (2026-08-04)

**What shipped.** Four D1 surfaces become `NODE_VERBS` button entries — Sweelinck's S49 scene at
`NUE`, Ori at `STN`, Yva at `TRD`, Brynn's firewood at `TLL` — and the Junction Vignette's
`[Help — 10gp]` keeps its block and swaps its hand-written price for the **`cost`** leaf. That
second one is §10's stated bar for the leaf not being single-use, and it is now met: **two live
consumers, at two different prices, in two different surfaces.**

**The finding is the count.** §4 listed 13 D1 surfaces and §10 sliced them as one unit. Reading all
13 against the shipped grammar rather than against the census, **only 4 are expressible today**, and
the other 9 are blocked by three gaps this report measured toward but never named:

| Blocked by | Surfaces | What is actually missing |
|---|---|---|
| **a delayed second beat** | Harbor Board · Solvak probe · Seal delivery | each ends `setTimeout(() => storyMsg(…), 400–800)`. `storyMsg` **replaces** `#story-move-msg`, so the first line is *destroyed* after the beat — that pacing is authored. `narrative` has no timing and the kernel is pure (it cannot schedule), so folding both lines into the buffer would make a transient line permanent. |
| **panel chrome** | Surge Lock · Froberger letter · Codex Inquisitor | each hand-builds a `.sweelinck-variant` div with its own `border-left-color`, title colour, wrapper `margin-top` (8 vs 10), title `margin-bottom` (4 vs 6), body `margin-bottom` (6 vs 8) and, at Surge Lock, a button `background`. A *byte-identical* generic panel would need to carry all six as registry fields — that is a CSS struct smuggled into a vocabulary, not a vocabulary. |
| **a ceremonia launch** | Codex Inquisitor (also) | its button calls `_rollCeremonia(questId)` — it *starts* a skill check rather than containing one, which is precisely why §9.2 said the scope fence does not need widening; but there is no bit that starts one. |

Plus the two already recorded: the Reading Circle (§9.3, a day cooldown) and the la_riva delivery,
which lives inside CDG's `cq-boss-buttons` container and therefore belongs to **G4d** with the menu
it shares a div with. **13 = 4 shipped + 3 delay + 3 panel + 1 cooldown + 1 D3-resident + Codex
Inquisitor counted once in the panel column.** Each of the three gaps is a *design call*, not a
build step — filed as **§VM-01-G4c-FU** with a recommendation, because inventing an answer to any
of them inside this slice is exactly the `itemsMinAny` failure §4 exists to prevent.

**Three schema growths, each with a measured reason:**

1. **`group`** — the dispatch position. G4b had one call site rendering the whole table; four blocks
   in four different source positions cannot share one, and LIFO stacking is preserved only by
   dispatching **where the block sat**. `group` is §9.1's own D3 word ("several `NODE_VERBS` entries
   sharing a group id"), so G4d inherits it. Every group has exactly one call site and every call
   site names a live group — **asserted**, because an entry with no call site renders nowhere, which
   is the silent rot this whole track exists to stop.
2. **`bits` may be a fn(st)** — the same `string | fn` shape `ambient` and `when` already have in
   this registry. Yva's line grows a paragraph once the Harrow is solved; Sweelinck's closes
   differently on NG+ (`_getS49SweelinckScene()`), and the inline handlers computed that text **at
   click**. The VM's grammar is untouched: `execBits` is handed a plain declarative array either way.
3. **`btnStyle`, and a label-only verb IS its button — no wrapper at all.** This is the one the
   evidence caught rather than the design. Every D1 block inserted a **bare button** afterend of
   `#story-text-box`, whose parent is a **flex column**: a direct-child button is stretched to the
   column's full width, and the identical button inside G4b's block mount shrinks to its own text.
   **The golden-DOM capture reported that as identical** — same tag, same class, same label, same
   style — and the §7½ screenshot showed a full-width bar on one side and a small left-aligned chip
   on the other. So the button is the managed element (it carries the mount's `id`, and if such a
   chain ever suspends the driver swaps it for a div first), and `btnStyle` carries the site's own
   spacing — 8/4/6/6px, one per site. **The lesson is the one this track keeps relearning in a new
   dimension: a DOM diff proves markup, not layout.** The bounding box is now part of the capture.

**One `cost` correction against §9.1's sketch:** it wrote `{ kind:'favor', npc:'yva', add:1 }`.
`_setNpcFavor` takes an **absolute** level and only ever raises it, so `add:1` would have *lowered*
a favor already at 2. The shipped bit is `set:1`, and the case is pinned by a test.

**Evidence — a 23-combo golden capture of every affected state, HEAD vs after**, over DOM (markup
**and** bounding box), message text, message class, gold, hp, inventory, favor, quests and flags.
**11 states are byte-identical · 5 differ only by the `id` the button now carries** — every
"offered" state and the refusal, box included, so the four migrated surfaces are **pixel-identical**
— **and 7 carry the delta below.** All four DUS states are byte-identical (G4b untouched) and all
three junction states are byte-identical, including the `msg-block` shake class on the refusal,
which is what proves the price conversion is a no-op rather than a rewrite. **6 of the 9 §7½
screenshots are byte-identical PNGs**; the 3 that differ are the click outcomes. Every remaining
delta is **one class, already named by G4b**: the
driver re-renders when a chain ends, so a quest the verb satisfies **completes in the same beat**
instead of on the next arrival — `quest_tl_03` pays its 300gp and Ori's Account while the player is
still looking at the verb, `quest_vs_02` closes on the same click. It is paid **exactly once** either
way (§VM-01-G3 moved those payouts into the quests' own `onComplete` for exactly this reason), and
the migration *recovers* two narratives the inline handlers destroyed: at Yva, `_setNpcFavor`'s
`🤝 …looks at you differently now.` used to overwrite her whole speech; at the firewood,
`storyCheckQuests`' own messages did. The driver buffers the chain's narrative and hands it to
`storyRender` as the **prefix**, so both survive, joined.

**One consequence worth recording rather than discovering.** At `NUE` the re-render advances
`npcVisitCounts['sq_revisit']`, because that block counts a **render**, not an arrival — so
Sweelinck's once-per-run age line now lands immediately after the S49 click instead of on the next
visit. It still fires exactly once. The per-render counter is pre-existing (any `storyRender`
re-entry at NUE already ticks it); it is filed under §VM-01-G4c-FU rather than fixed here, because
changing it is a content-timing decision, not a migration step.

**Tests:** `uqf-node-verbs-d1.test.js` **13/13**, and the positive control is the honest shape —
**7 of 13 fail at HEAD, and the 6 that pass are exactly the ones asserting *unchanged* behaviour**
(Yva's full chain, the favor floor, Sweelinck's NG+ closing, and both junction states). `check:walk`
**16/16 exit 0** with `check:questparity` at **25,030 bytes — the kernel was not touched again**;
`uqf-node-verbs.test.js` 10/10 with two pins updated (the DUS trio is now the table's *head*, not
the whole of it — updating a pin that exists to catch exactly this is part of the fix).

**Next: G4d** — CDG's D3 concurrent menu as grouped `NODE_VERBS` with `combat` bits, plus the two
Class-E strays (Kenickie's market, the Lower Archive launcher) to `NODE_HOOKS` verbatim, and the
la_riva delivery that shares their container. Then **§VM-01-G4c-FU**, once its three design calls
are answered.

---

## 12⁹⁄₁₆. Addendum — §VM-01-G4d ✅ SHIPPED 2026-08-05 `b0c2478` (the D3 menu + the two Class-E strays)

**What shipped, exactly as §10 sliced it.** The three CDG confrontations (Taz Devil ·
Don Fluffissimo · Cat-King) are `NODE_VERBS` entries sharing **group `cdg-boss-menu`**, rendered
into the same `#cq-boss-buttons` container the inline block built — `_renderNodeVerbs` grew a
4th `container` argument for the D3 mode (§9.1's own sketch: *"several entries sharing a group
id, rendered into one container"*). Each is `narrative` + `combat` with the synthetic
`nodeCode:'CQ_*'` — §9.1's claim that **no new grammar is needed for D3 held**: the kernel was
not touched a third time (`check:questparity` still **25,030 bytes**). The **la_riva_03
delivery** is a fourth verb in its own group `cdg-la-riva`, dispatched *after* the Kenickie hook
so the container's five children keep their order by construction (`item_remove` + `flag_write`
+ `favor set:3` + `narrative` — every bit shipped grammar). **Kenickie's Black Market (71 lines)
and the NUE Lower Archive launcher moved to `NODE_HOOKS` verbatim** (G2's method; the Kenickie
hook takes `{ cqDiv }` as ctx — the G2b one-field rule again, measured not designed: the only
other storyRender local the block reads is `qs`, which the hook re-derives in one line).
Registry order stays by-former-source-position: `nue-lower-archive` slots *before*
`void-archaeology`, `cdg-kenickie-market` between `codex-core-chamber` and `la-riva-row`.

**Two named deltas, both the classes earlier slices already carry:** (1) the kernel's `combat`
handler opens the pre-battle overlay **in the same beat as the click** — the inline handlers'
400ms `setTimeout` between the rumble line and the overlay is gone; the line rides the render
prefix and still reads when the overlay closes. (2) the delivery message **survives** — the
inline handler's `storyMsg` was followed one line later by a bare `storyRender` whose tail
overwrites `#story-move-msg` (§BOARD-01-FU6), so on HEAD the player never read Kenickie's
*"Yeah. Okay. I'll hold onto this."* at all. The G4c recovered-narrative delta, third
occurrence.

**One gate finding:** the synthetic battle codes were the first `nodeCode:` literals gate #13
ever scanned that are deliberately NOT places — `check-noderegs.js` grew
`SYNTHETIC_BATTLE_CODES` (explicit list with a reason, `nodeCode:`-scoped ONLY; a synthetic code
in `activateNode` still fails, asserted by a new selftest plant).

**Evidence:** 20-combo golden HEAD-vs-after over DOM + bounding box + msg + overlay +
`_preBattNode` + gold/inv/favor/quests/flags — **12 byte-identical · 7 differ only by the
button's new `id` (+ an empty `style=""`), with every bounding box equal → pixel-identical · 1
(`cdg-taz-clicked`) carries the same-beat re-render advancing Jimmy's rotating card quote one
pick**; after-vs-after2 self-stability **20/20** (the §VM-01-G2b double-run rule). **All 6 §7½
story-column screenshots byte-identical PNGs** (full-page shots differ only in the map
canvases). Line-multiset diff: **zero Kenickie/Lower-Archive body lines fail to reappear**; the
removed-only residue is exactly the four handlers now expressed as VM data. Authored-string
counts all `n → n`. `uqf-node-verbs-d3.test.js` **12/12 with 6 red on HEAD and the 6 that pass
exactly the unchanged-behaviour ones** (Kenickie shop ×2, Lower Archive ×2, empty-menu,
menu-order — the G2b honest shape). `check:walk` 16/16.

---

## 13. Anchors touched by this report

`storyRender(node, prefix)@34562` · `_mkSection(id, icon, label)@35315` ·
`const NODE_PANELS@31313` · `_renderNodePanels(node, st)@31588` · `const NODE_HOOKS@34185` ·
`_runNodeHook(id, node, ctx)@34248` · `let _uqfPending@6824` · `function _uqfPump(gen, answer)@6827` ·
`function _uqfRunToCompletion(gen)@6840` · `*execBits(bits, ctx)@22223` · `*choice(bit, ctx)@22319` ·
`combat(bit)@22300` · `item_remove(bit, ctx)@22302` · `reward(bit, ctx)@22269`

**Added by G4b (§12¾):** `const NODE_VERBS@34286` · `function _renderNodeVerbs(node, st, group, container)@34508` ·
`function _mkAmbientLine(text)@6878` · `function _uqfRunVerb(verb, mount)@6914` ·
`function _uqfRenderAsk(gen, ask, mount, step)@6885`

**Added by G4c (§12⅞):** `function _verbBits(verb, st)@6908` · `function _uqfRunChain(bits)@6949`
*(`_renderNodeVerbs` grew its `group` argument in this slice — gate #15 caught the old anchor as a
DEAD symbol the moment the signature changed, which is exactly what a symbol anchor is for.)*

---

*© 2026 Paul Richeson — MIT License.*
