<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §VM-01-G4: Class D per-verb (the migration front's last slice)

> **Status: ⚠️ DESIGN — LOCKED PENDING ONE ASK (§12). No HTML edited.** This is the child
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
`NODE_PANELS` (`const NODE_PANELS@31139`, rendered by `_renderNodePanels(node, st)@31268`) and
`NODE_HOOKS` (`const NODE_HOOKS@32654`, dispatched in place by `_runNodeHook(id, node, ctx)@32692`).

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
(`*execBits(bits, ctx)@22081`), `choice` is a suspending handler that yields an `ask` envelope
(`*choice(bit, ctx)@22154`), and the host has a driver that parks the generator in a module slot
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
the player's own prose — `S_story.entry42Text@32779` and `S_story._voidTollSecret@32937`. Both are
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
of that is already shipped: **`item_remove`** is a live handler (`item_remove(bit, ctx)@22137`) and
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
2. **`reward` will not do the job.** `reward(bit, ctx)@22126` does `st.gold = (st.gold||0) + bit.gold`,
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
permanently dead (`S_story.actNumber = node.act || 1@32702`, assigned every render). Swept for the
same shape across G4's region: **one act comparison remains** —
`node.code === 'NUE' && (S_story.actNumber || 1) >= 3@32819` (Sweelinck's "map before the city"
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
`nodeCode` field already exists** (`combat(bit)@22135`) and is exactly the synthetic-code spread
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

## 13. Anchors touched by this report

`storyRender(node, prefix)@32696` · `_mkSection(id, icon, label)@33702` ·
`const NODE_PANELS@31139` · `_renderNodePanels(node, st)@31268` · `const NODE_HOOKS@32654` ·
`_runNodeHook(id, node, ctx)@32692` · `let _uqfPending@6824` · `function _uqfPump(gen, answer)@6827` ·
`function _uqfRunToCompletion(gen)@6840` · `*execBits(bits, ctx)@22081` · `*choice(bit, ctx)@22154` ·
`combat(bit)@22135` · `item_remove(bit, ctx)@22137` · `reward(bit, ctx)@22126`

---

*© 2026 Paul Richeson — MIT License.*
