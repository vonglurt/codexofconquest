<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — The Derivable NPC Card Map (§NPC-01, promotes §POT-R2)

> **Status:** ✅ **SHIPPED IN FULL** — A, B, C, D and side-findings SF1–SF6 all landed.
> Originally filed 2026-07-23 as ⚠️ PLANNED (spec only, no HTML edited), per the Lab Report Policy
> (`CONTRIBUTING.md`). It stopped being a plan **48 minutes later**.
>
> **Written:** 2026-07-23 against `roll2hit-v3.html` at `ENGINE_VER = 'r2h-3.104.0'`, 37,812 lines.
> **Ship commit:** `fed5ee4` (docs-only, so the parent build **is** the build it measured).
> **Verified:** 2026-08-21 (§DOC-02cl) against parent build `fed5ee4^` **and** live HEAD, with the
> engine driven in a real browser at both builds. The report has not drifted a byte in 29 days.
>
> **HISTORY doc — annotate, do not rewrite.** Claims that did not ship are marked **NOT SHIPPED** and
> kept. Bare numeric anchors from the original are preserved only where quoted; live pointers below
> use the `symbol@line` form (§DX-01e).

---

## Abstract

The game shipped a relationship system it could almost never show you. `NPC_DIALOGUES` held **213**
NPCs, each with a four-tier favor ladder, a signature quote, a `meta.worldTruth` payoff and a
`meta.enemy` grudge; `BIRKA_NPC_PROFILES` held **204** identities, every one declaring its own
`node`. The single renderer that could put any of it on screen, `_renderNpcCard`, was driven by one
hand-maintained literal covering **14 node codes** — and, browser-proved at the parent build,
**exactly 11 NPCs actually produced a card.** Nine more were wired into the map and rendered
*silently nothing*.

This report argued that the NPC-to-node mapping did not need to be derived from `QUEST_DB` at all,
because it was already declared, redundantly, on every profile — **121 distinct node codes, 0 of them
dead.** The render map was therefore a pure inversion query, and the only genuine engine defect was
that `_renderNpcCard` threw a `TypeError` on a profile with no per-tier greeting object.

Re-measured 29 days on: **the architecture was right and the arithmetic was not.** Twelve of fifteen
census rows are exact and every structural thesis holds. Three rows are wrong, and one of them —
counting "rich" profiles with an indentation-anchored line regex — hid **three** rich profiles,
including **The Fisherman**, whose missing card required its own follow-up increment (§NPC-01-SF5)
five and a half hours later. Live at HEAD: **125 of 416 nodes carry cards and 203 of 204 NPCs render**
— 11 → 203, an **18.5×** widening of the relationship surface.

---

## I. Intention and inspiration — why this matters to play

roll2hit is a **49-day doom clock**. Every step and every rest spends a day you cannot get back, so
the game constantly asks: *is this detour worth a day of the world.* The combat answer is legible
(XP, gold, a trophy). The **relationship** answer was not, because relationships had almost nowhere to
appear.

The NPC card is the whole visible surface of that answer. It is the thing that turns a node from a
place into **somebody's** place: a name, an occupation, a greeting, an italic line that changes as
you come back, and — at Dear Friend — a `worldTruth` the world tells nobody else. The design bet the
project had already made, in content, was that *the ending should notice what you shared, not just
what you killed.* Two hundred and thirteen NPCs had been authored to honour that bet.

Eleven of them could be met.

So the playability argument here is not "add a feature." It is **stop discarding the feature we
already paid for**:

- **It makes the day-cost of a detour legible.** Walking somewhere off the quest line now returns
  something the player can read and remember. An empty node is a wasted day; a node with a person in
  it is a decision.
- **It makes favor a real currency.** `favor` bits, the four dialogue tiers and `meta.worldTruth`
  were all mechanically live and practically unspendable, because the ladder had a top rung and
  almost no bottom rungs. Widening the card map gives the ladder somewhere to stand.
- **It rewards revisiting instead of only advancing.** `_getNPCDialogue` picks its line by a visit
  counter, so a second visit to the same person is a different sentence. That only reads as a system
  once more than eleven people exist to revisit.
- **It converts authored content into playable content at zero authoring cost.** No new writing was
  commissioned. The migration renders lines that already shipped.
- **It gives the doom clock an emotional counterweight.** A world that is ending is only frightening
  if it is populated. §NPC-01-C's later `⚔ meta.enemy` footer at Friendly makes that explicit: the
  relationship deepens from *what they are up against* to *what they know*.

The one honest hazard the report named up front — and it was right — is that widening a map is
cheap while **fixing the renderer it feeds is the actual work.** Hence the increment order.

---

## II. Method

Verification instruments used (§DOC-02 programme):

1. **Parent-build pinning.** `fed5ee4` is docs-only, so `git show fed5ee4^:roll2hit-v3.html`
   reproduces the exact 37,812-line file the report measured. Every cited line number is scored
   against that build, never against HEAD.
2. **Census by parser, never by line regex.** All entry counts re-derived with `wbapi-core`s
   comment-and-string-safe token scanner (`js/wbapi-core.js:_scanTokens: scanTokens@829`), brace-walking each literal at depth 1. This is the instrument the report
   itself lacked, and it is where two of its three arithmetic errors came from.
3. **Execution over reading.** The crash claim, the pre-migration reach and the HEAD reach were all
   proved by loading the build in Chromium and calling the renderer, not by reading source.
4. **Never-shipped proof.** `git log -S <symbol> --all` with no pathspec, so a symbol that lives only
   in prose is distinguishable from one that was removed.
5. **Acceptance re-run.** `tests/integration/npc-card-map.test.js` executed at HEAD.

---

## III. Measured facts — as written vs. re-measured

Scored against the parent build `fed5ee4^` (r2h-3.104.0, 37,812 lines — **both exact**).

| # | Report claim | Value written | Re-measured | Verdict |
|---|---|---|---|---|
| 1 | `birkaNpcs` render map | 14 node codes | 14 | ✅ exact |
| 2 | `_renderNpcCard` call sites | 1 | 1 | ✅ exact |
| 3 | `BIRKA_NPC_PROFILES` entries | 205, 204 unique | 205 / 204 | ✅ exact |
| 4 | — carrying a `node` field | all | 204 of 204 | ✅ exact |
| 5 | — "rich" (per-tier greeting object) | **10** | **13** | ❌ **short by 3** |
| 6 | — "lean" | **~194** | **191** | ❌ follows from row 5 |
| 7 | `NPC_DIALOGUES` entries | 213, 0 duplicate keys | 213, 0 dups | ✅ exact |
| 8 | — with `meta.worldTruth` | 213 | 213 | ✅ exact |
| 9 | — with `meta.enemy` | **203** | **202** | ❌ raw-grep artefact |
| 10 | `NODE_MAP` node codes | 418 | 418 (416 at HEAD) | ✅ exact when written |
| 11 | Distinct profile `.node` codes | 121 | 121 | ✅ exact |
| 12 | Profile `.node` absent from `NODE_MAP` | 0 | 0 | ✅ exact |
| 13 | Renderable candidates, profile ∩ dialogue | 203 | 203 | ✅ exact |
| 14 | `favor` bits across all quests | 16 | 16 (18 at HEAD) | ✅ exact when written |
| 15 | `_setNpcFavor` hardcoded call sites | 5 | 5 | ✅ exact |

**Twelve of fifteen exact.** All three misses are arithmetic, none is architectural, and each has a
traceable cause:

**Row 5 — the method was the defect.** The report counted rich profiles with
`grep -cE '^    neutral:'`. That regex demands exactly four leading spaces. Ten profiles satisfy it.
Three more declare their whole entry — key, name, occupation, node **and** their tier objects — on a
single line at two-space indentation, so the anchor never matched them:
`the_fisherman`, `connie_tuna` and `aldo_sardino`. A fourth rich entry, `idaeus_herald`, *was*
counted; the report calls it only "+1" in its §2 name list without naming it. The correct figures are
**13 rich / 191 lean**, and one of the thirteen has all four tiers absent in favour of three, so
**12** carry the full `neutral`+`friendly`+`dearFriend` set.

**Row 9 — the known raw-grep trap.** `grep -c enemy:` over the whole HTML returns 203; exactly one of
those hits sits outside `NPC_DIALOGUES`. Parsed at depth 3 inside `meta`, the answer is **202**. The
sibling report §NPC-01-D made the mirror mistake on `meta.worldTruth` (219 vs 213) in the same week.

**Row 6 — inherited.** 204 − 10 = 194 is correct arithmetic on a wrong input.

### III-A. Three inherited figures the report did not re-measure

The status block asserts that `43bd09c`s `potential.md` snapshot "has drifted: it claimed 401 nodes /
20 of 213 reachable / a flat 14-key literal — **all three are now stale**." Re-measured, **only the
first is:**

| Inherited claim | Re-measured at the parent build | Verdict |
|---|---|---|
| 401 nodes | 418 | ❌ stale, correctly flagged |
| 20 of 213 reachable | **20 keys are mapped** | ✅ exact — not stale |
| a flat 14-key literal | 14 keys | ✅ exact — and this report **agrees** in its own row 1 |

The report contradicted its own §1 table one paragraph earlier. Its objection to "flat" is fair —
`birkaNpcs` is assembled with state gating, not written flat — but that makes the adjective loose,
not the count stale.

**And the figure it accepted without checking is the one that was wrong.** §POT-R2’s headline,
quoted in this report’s own status line, is *"193 of 213 NPCs have a full four-tier relationship arc
that no node can render."* Parsed live: **201** of 213 entries carry all four of `impartial`,
`questActive`, `friendly` and `dearFriend`. The unlock was larger than the seed claimed.

### III-B. The number that mattered most was never stated

"20 of 213 reachable" counts **map entries, not cards.** Driven in Chromium at the parent build,
calling `_renderNpcCard` on all twenty mapped keys:

- **11 rendered a card** — `yael`, `brynn`, `quill`, `pachelbel`, `crov`, `auros`, `connie_tuna`,
  `aldo_sardino`, `emmer`, `gret`, `pier`.
- **9 rendered nothing at all** — `jimmy`, `sandy_cat`, `kenickie`, `isolde_voss`, `benedikt_rasp`,
  `rennau`, `vonn`, `solvak`, `yva`. No throw, no warning, no card: `if (!p) return`.
- **0 threw.**

So the true pre-migration reach was **11 of 213 (5.2%)**, not 20 of 213 (9.4%). The report *found*
this gap — it is SF2, and SF2 names nine of those nine — but it never folded the finding back into
its own headline. **The nine silent blanks were the second-largest defect on the surface it was
reviewing, and they were filed as a footnote.**

---

## IV. The crash — the one genuine engine defect, proved

> `staticProfile = fav >= 2 ? p.dearFriend : fav >= 1 ? p.friendly : p.neutral;`
> `… + staticProfile.greeting + …`

For a lean profile all three tier objects are `undefined`, so `staticProfile.greeting` throws.

**Proved by execution at the parent build** (Chromium, `file://` load, no page errors):

```
_renderNpcCard('ser_bardo', div)  →  THREW: Cannot read properties of undefined (reading 'greeting')
_renderNpcCard('yael',      div)  →  NO THROW; 832 bytes of HTML
lean profiles in the live object  →  191
lean profiles that also have a dialogue entry → 190
```

The claim *"rendering any lean profile today crashes the card"* is **exact**, and the increment order
it dictated — fallback first, widen second — was correct. The report says so plainly: *"Do not ship B
before A (B without A crashes on the first lean node)."* It was obeyed; A landed at 11:33 and B at
11:42, nine minutes apart.

---

## V. Locked shapes → shipped

| § | Locked shape | Outcome | Evidence |
|---|---|---|---|
| 3.1 | `_deriveNpcRenderMap()` — pure, memoized inversion of profiles on `.node` | ✅ **shipped under the exact specified name**, module-level cache, guard comment cites the same 121 / 0-dead measurement | `function _deriveNpcRenderMap@23672`; `33aa15f` |
| 3.2 | `NPC_RENDER_OVERRIDES = { node: (base, S) => [...] }` — derivation default, explicit override wins | ❌ **NOT SHIPPED.** The symbol appears in **zero** builds; `git log -S NPC_RENDER_OVERRIDES --all` returns only this report and its BACKLOG archive. **Superseded**, not dropped — see below | `_curatedGoverned = new Set@35166` |
| 3.3 | Greeting **synthesis** — `\|\| { greeting: <line from the tier pool> }` | ⚠️ **shipped as omission, not synthesis.** `greetingHtml` renders `''` when `staticProfile` is absent | `const greetingHtml@23718`; `76ad683` |
| 5-A | Lean-profile render fallback, additive, ~3 lines | ✅ shipped **48 minutes** after the lock | `76ad683` |
| 5-B | Derive + override, 14 legacy nodes byte-identical | ✅ shipped, curated-wins strategy | `33aa15f` |
| 5-C | `meta.enemy` at Friendly, mirroring the `worldTruth` footer | ✅ shipped under its own tag | `696539e` |
| 5-D | Favor reach — marked *design call, not mechanical* | ✅ shipped as the **Talk verb** the same evening | `df990c3`; own lab report |
| 6 | `scripts/check-npc-cardmap.js` added to `check:walk` | ❌ **NOT SHIPPED** — never existed in any build. Its three assertions are nonetheless covered: (a) and (c) by the integration test, (b) by `check:noderegs`, whose `NODE_FIELDS` list includes `node` | `scripts/check-noderegs.js:96` |
| 6 | `tests/integration/npc-card-map.test.js` | ✅ shipped, and grew 9 → 16 → **22** tests | re-run below |

**Why §3.2 was superseded rather than betrayed.** The locked design was *derive by default, override
per node.* What shipped is the inverse polarity — *curated literal wins, derived map fills in* — and
then, six hours later, §NPC-01-SF6 turned that into a **merge**: the curated list keeps authority over
the keys it governs (`_curatedGoverned`, the maximal flag-independent set), and the derived map
appends everything it does not shadow.

That change was forced by a defect the locked shape would have caused. Under literal-wins, a rich
profile whose `.node` pointed at a curated node rendered **nowhere** — the literal shadowed it
completely. Three NPCs were in exactly that position: `long_john_silver_sen` at TL, and
`archivus_sweelinck` + `ulrich_von_gessert` at NUE. **A fourth was The Fisherman at SSJ** — the same
NPC the §1 regex had failed to count as rich. The report’s §3.2 promised the 14 legacy nodes would be
"byte-identical," and it delivered that guarantee by making four rich cards invisible. SF5 fixed the
Fisherman by hand; SF6 generalized the root cause.

**The undercount and the follow-up are the same defect seen twice.** A rich profile the census could
not see is a rich profile the migration plan did not protect.

---

## VI. Invariant compliance — re-checked, not re-copied

| Invariant | Report | Re-measured |
|---|---|---|
| Free movement | ✅ render-only | ✅ **holds.** No mover code touched by any §NPC-01 commit; no quest state consulted in a step |
| Mission gating ≠ movement gating | ✅ N/A | ✅ holds — a card is display |
| No jump travel | ✅ N/A | ✅ holds |
| Parity fences | ✅ all three symbols outside the four kernels | ✅ **conclusion true, citations wrong** — see below |
| Seeded RNG | ✅ N/A, no rolls | ✅ holds, and **non-vacuously**: §3.3 warned that a randomized tier pick must draw `_seededNext()`. The shipped path picks nothing at random; `_getNPCDialogue` indexes its pool by a visit **counter**, so the hazard never arose |
| API-first | ⚠️ hand-edit of inline JS, Hazard #1 applies | ✅ correct and correctly flagged — §NPC-01 is engine JS, outside the API contract |

**The parity row cites three line numbers for the kernels and all three are wrong.** It gives
`9733/9804/10057` as the fences. In the parent build the actual sentinels are `MOVER:CORE:START` at
9791, `ROOMS:CORE:START` at 9862, `DUEL:CORE:START` at 10115 and `QUEST:CORE:START` at 21707. Of the
three numbers, one (9804) lands *inside* MOVER:CORE, one (10057) lands inside ROOMS:CORE, and one
(9733) is before every fence in the file.

The **claim** is nevertheless true: `_renderNpcCard` at 23317, `birkaNpcs` at 32097 and
`BIRKA_NPC_PROFILES` at 22386 all sit past `QUEST:CORE:END` at 22032, outside all four kernels. The
verdict was right; the evidence offered for it was not. This is the programme’s recurring shape —
**the errors are citations.**

---

## VII. Verification at HEAD

**Line-number score against the parent build: 18 of 22 exact.**

| Anchor set | Result |
|---|---|
| `_renderNpcCard` def 23317 · `birkaNpcs` 32097 · close 32101 · call site 32107 | ✅ 4 of 4 byte-exact |
| `BIRKA_NPC_PROFILES` 22386 · close 22670 · `NPC_DIALOGUES` 10273 · `NODE_MAP` 8313 · close 9289 | ✅ 5 of 5 byte-exact |
| Crash trace 23339, 23367 · guard 23334 · worldTruth footer 23371 | ✅ 4 of 4 byte-exact |
| Override logic 32087, 32090, 32098, 32099 | ✅ 4 of 4 byte-exact |
| `NODE_NPC_KEYS` 26954, quoted comment verbatim | ✅ exact |
| `_getNodeMapColor` "26822ish" | ❌ actual 27088 — the report hedged the number and the hedge was earned |
| Parity fences 9733 / 9804 / 10057 | ❌ 3 wrong (§VI) |

**Acceptance suite re-run in the browser, HEAD, WBAPI server stopped:**

```
npx playwright test tests/integration/npc-card-map.test.js
  22 passed (10.5s)
```

Covering §NPC-01-A, -B, -C, -D and SF2 / SF4 / SF5 / SF6. The `check:walk` reds the report told the
next agent to expect — I1/I2 J14/J15, R2/R3 TGS/SPB, the §BOARD-01-VOID-GATE red — were **all retired**
within days of the lock; `check:walk` has been 16/16 green since.

**Live reach at HEAD, driven in Chromium:**

| Measure | Parent build | HEAD |
|---|---|---|
| Nodes that can show a card | 14 mapped | **125 of 416 (30.0%)** |
| NPCs that produce a card | **11** | **203 of 204** |
| NPCs mapped but rendering blank | 9 | **1** (`watcher_gvw`, §AUDIT-03bo) |
| Renderer throws | 1 class, all 191 lean profiles | **0** |

**11 → 203.** The report predicted "~203" and hit it exactly. Its node figure was the one that
slipped: §5-B forecast "~107 new nodes," computed as 121 − 14. Only **9** of the 14 legacy codes are
also profile nodes (`CQ`, `SQ`, `GC`, `STN` and `VS` are not — the first three were dead codes with no
`NODE_MAP` entry at all, which §NPC-01-SF4 later remapped to `CDG`/`NUE`/`TRD`). The correct forecast
was **112**, and the union at HEAD is 125.

---

## VIII. Side-findings — all three resolved

- **SF1 — `euryclea_ithaca` duplicate key.** ✅ **Correct and fixed.** The parent build parses 205
  entries for 204 unique keys, the second declaration silently winning. `ed06625` deduped it;
  HEAD parses 204 / 204 / 0 duplicates. `check:dupkeys` (gate #11) now fails on the whole class.

- **SF2 — profile-less NPCs wired into `birkaNpcs` that never render.** ✅ **Correct, and
  under-weighted rather than wrong** (§III-B). Nine of its ten names are exact and browser-proved
  blank. The tenth, `don_fluffissimo`, is **not** wired into `birkaNpcs` — it is dialogue-only with
  `meta.node:'CDG'`, and CDG was not a mapped node at the time. The shipped fix synthesizes a lean
  profile from `dlg.meta` and its comment correctly says **nine**. `don_fluffissimo` still renders
  nowhere at HEAD → **§AUDIT-03bp**.

- **SF3 — `NODE_NPC_KEYS` stale comment.** ✅ **Correct and fixed.** The parent comment claimed the
  table was *"used by `_getNPCDialogue()` routing"*; its only readers were and are
  `function _getNodeMapColor@27562` and `function _getFarewell@27575`. `ed06625` rewrote the comment
  to *"read by `_getNodeMapColor()` + `_getFarewell()`"* — exactly the correction requested.

**Later side-findings the report did not anticipate**, each filed and shipped inside five days:
SF4 (dead codes `CQ`/`SQ`/`GC` remapped to `CDG`/`NUE`/`TRD`), SF5 (the Fisherman un-shadowed at SSJ),
SF6 (curated ∪ derived merge). SF5 and SF6 are downstream of §1 row 5 and §3.2 respectively.

---

## IX. Open questions — how each resolved

1. **Greeting source for lean profiles** — *"reuse the pooled tier line, or a templated framing."*
   **Resolved by choosing neither.** The shipped `greetingHtml` omits the line entirely when no tier
   object exists; name, occupation, quote and the footers carry the card. The A/B eyeball the report
   scheduled was answered by deletion, which is the cheapest answer available and preserves
   byte-identical HTML for the thirteen rich profiles.
2. **Multi-NPC nodes** — **resolved and then re-resolved.** Order is curated-first, then derived
   additions, deduped. The layout tolerates N cards: the row is a flex column at `gap:8px` with each
   card `width:100%`.
3. **SF2 resolution** — **resolved: yes, it was real.** The nine profile-less NPCs rendered nothing,
   and `ed06625` relaxed the `!p` guard almost exactly as the report proposed —
   `p = { name: dlg.meta.name, occupation: dlg.meta.occupation }` — with one addition the report did
   not specify, an early return when `dlg.meta.name` is itself missing.

---

## X. Findings filed by this verification

- **§AUDIT-03bp** — `don_fluffissimo` is dialogue-only, declares `meta.node:'CDG'`, has no
  `BIRKA_NPC_PROFILES` entry and is absent from CDG’s curated list, so it renders on no node at HEAD.
  It is the tenth name in SF2 and the one the shipped nine-NPC fix did not reach. Mirror image of
  §AUDIT-03bo (`watcher_gvw`: profile, no dialogue).
- **§DX-02dr** — this report’s two wrong census figures were **copied into the engine source**. The
  `_renderNpcCard` comment still says *"the ~194 non-Birka NPCs"* (191) and the `_deriveNpcRenderMap`
  header still says *"from ~20 NPCs to ~203"* (11 → 203). Annotation without verification launders a
  wrong claim into a confident-looking live one — here, out of a HISTORY doc and into the engine.

---

## XI. Verdict

**The thesis was right, the plan was right, the sequencing was right, and it shipped whole in nine
hours and sixteen minutes.** Every locked increment landed; the two shapes that did not — the override
layer and the check script — were superseded by better mechanisms rather than abandoned, and both
supersessions are documented in the source. The report correctly overturned §POT-R2’s proposed
`QUEST_DB` derivation, correctly identified the crash as the keystone, correctly ordered A before B,
and correctly predicted the 203.

Its failures are all measurement, and they cluster in one place: **it counted with greps where it
should have counted with a parser.** Three of the fifteen census rows are wrong; the raw-grep on
`enemy:` is a known trap; and the indentation-anchored regex on `neutral:` concealed three rich
profiles, one of whom — The Fisherman — the migration then rendered invisible for eleven days until
§NPC-01-SF5 put him back. A census error became a shipping defect by the shortest possible route.

*Locked 2026-07-23 at r2h-3.104.0. Verified 2026-08-21 (§DOC-02cl) at 38,712 lines.*
*© 2026 Paul Richeson — MIT License.*
