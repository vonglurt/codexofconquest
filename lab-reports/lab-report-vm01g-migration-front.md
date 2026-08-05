# Lab Report — §VM-01-G: The Migration Front (per-node special cases → node hooks)

**Date:** 2026-07-28 · **Status:** LOCKED 2026-07-28 (user decisions in §7; Lab Report Policy — this
is the biggest and riskiest §VM-01 increment, deliberately last) · **Anchors:** measured live at HEAD
`8973fd7` — re-grep before every edit; they will drift.

---

## 1. The finding, re-measured (the row's anchors had drifted — and the drift IS the finding)

`storyRender` is now **30887–35298 = 4,412 lines** (row said 30502–34862 / 4,360). The migration
front — the boundary where hardcoded per-node blocks give way to the generic `_mkSection`/`_mkCard`
data engine — is now at **33332** (row said 32918).

**`node.code === 'XX'` comparisons inside storyRender: 124** (row said 76). Distribution:

- **77 above the front** (30887–33332, the 2,445-line special-case stack), across **~58 named
  blocks** (Layer/S/§-tagged). Top nodes: NUE ×11, TLL ×9, LHR ×9, TLS ×7, HKG ×7, MHQ ×5, LLA ×5 —
  the Birka legacy nodes dominate, exactly the nodes whose NPC-card literal §NPC-01 just retired.
- **47 inside the engine region** (33332–35298, 1,966 lines) — inline per-node exceptions *within*
  the data-driven sections (ENCOUNTER/QUESTS/WORLD/Key Events), a separate and smaller disease.

**The front moved backward: 76 → 124 comparisons since the row was written (2026-07-16).** Twelve
days of content (§D01 dungeon gates, §SIREN-01, §PAUL-01, La Riva, §BOARD signposts…) shipped as new
bespoke blocks because the render language still lacks the shapes. The row's thesis — *"when the
data language lacks a shape, the file grows imperative code instead of vocabulary"* — is not
theoretical; it is measurable at ~4 new comparisons/day.

## 2. Block taxonomy (what the 2,445 lines actually are)

Read across all ~58 blocks; five shapes cover them:

| Class | Shape | Count (approx) | Examples | Data-expressible today? |
|---|---|---|---|---|
| **A. State-gated flavor panel** | remove-old-div → `if (code && flags)` → styled div → `insertAdjacentElement('afterend', textbox)` | **~22 blocks** — the largest, most uniform class | §LXII AO name-change (`30990`), §LXIV LT stoning, §SIREN LJ3/LCA, Water Palace approach, §D01-01 EB flavor, S52 night ambient | **YES** — pure data: `{id, node, when, style, text}` |
| **B. One-time arrival scene** | Class A + sets a flag (once-guard) | **~8 blocks** | §LIX KS conversion (`31003`, sets `saulConverted`), §ML Malta snake, S36 EB NG+ line | **YES** — Class A + `{once: flag}` |
| **C. Legacy quest auto-activation** | `if (code) { if (!quests[id] && cond) quests[id]='active' + storyMsg }` | **~7 blocks** | Layer 51 WM gate (`31140`), Layer 44 cat arc (`31905`), Layer 55 VS (`31425`), Layer 50 NG+ CI | **YES** — this is exactly `gate:` + `activateNode` + an `onActivate` msg; these blocks predate UQF gates. `storyCheckQuests` + §VM-01-F-FU's `_questsByNode` index already run per render |
| **D. Effect-button (consent verb)** | conditional button → click runs {gold cost, flag writes, item grant, favor, quest unlock, storyMsg} | **~12 blocks** | Yva 50gp (`31469`: −50 gold + flag + item + favor + unlock — every line an existing opcode), Solvak, Surge Lock (`31160`), CO Memory Gate, boss-confront buttons | **MOSTLY** — Inc A's suspending `choice` + existing opcodes (`reward`/`flag_write`/`unlock`/`favor`/`combat`); missing leaves: gold-cost/consume |
| **E. Bespoke UI** | real interfaces with their own state machines | **~9 blocks** | Kenickie shop (`31976`), Blue Shutters archive, Froberger memorial, Pachelbel/Couperin ledgers, Pit Championship | **NO** — irreducible render code; the fix is *registration*, not data |

Engine-region inline exceptions (the 47) are class F — out of scope for the first slices; logged as
a follow-up so the count is honest.

## 3. Two hazards the row didn't name (found by reading, both load-bearing)

1. **Insertion order is LIFO.** Every Class A/B/D block inserts via
   `story-text-box → insertAdjacentElement('afterend')`, so **later blocks render ABOVE earlier
   ones**. Any table-driven dispatch must iterate in the *same order as the current source blocks*
   or every multi-panel node reshuffles visually. The migration must be order-preserving by
   construction (the table is ordered; iterate it forward inserting after the same anchor —
   replicating LIFO — or insert before the previous panel).
2. **Remove-then-recreate semantics.** Each block removes its old div by id before conditionally
   recreating (render is re-entrant — storyRender runs on every arrival/resolution). The dispatcher
   must replicate: remove all managed ids first, then create the active set.

## 4. The design call (the 🟢 ASK of the row): hook mechanism

The row poses `[bits]` (reuse the VM) vs registered render fns. Measured against the taxonomy,
**neither alone fits — the classes want different tools**, and forcing one tool onto all five
classes is how `itemsMinAny` happened (a shape grown for the wrong layer).

**Recommended: Option C — layered, three small vocabularies, each matched to its class:**

- **C1. `NODE_PANELS` — an ordered data table for Classes A+B** (~30 blocks, the bulk):
  `{ id, node, when(st), once?, style?, title?, text }`, rendered by ONE loop at the exact source
  position the first panel block occupies today (order-preserving). Pure render data — no VM, no
  parity fence, no movement gate. `textContent` only (the §DATA-01 lesson); the few `innerHTML`
  panels keep title/body fields instead. This is the same move as `textVariants` (§GR) one level up.
- **C2. `NODE_HOOKS[code] = [fn, …]` — a registered-render-fn escape hatch for Class E** (~9
  blocks): the bespoke UIs move out of storyRender verbatim into named functions registered per
  node; storyRender gains one dispatch loop. Zero behavior change; storyRender shrinks by the
  block's length per hook. (This is the row's "registered render fns" — right answer for E only.)
- **C3. Class C/D migrate INTO THE VM** — per-arc, behavior-preserving, later slices: C becomes
  `gate:`+`activateNode` (+ a small `onActivate` message field storyCheckQuests already knows how
  to emit); D becomes live `choice` renders on Inc A's seam (its first content consumer, which the
  §VM-01 track has awaited since A shipped). New grammar needed: a `cost` leaf (gold≥N, consume) —
  ONE new opcode, used by Yva/Corelli/ferry-class buttons alike (not single-use).

**Rejected: all-bits** (Class E as bits = a DOM-building opcode = the VM grows a render arm —
exactly the Host/Script Separation violation the track exists to end). **Rejected: all-render-fns**
(Classes A–D are data; registering 58 fns just relocates the imperative code and the front keeps
moving backward).

## 5. Slicing (each independently shippable, provable, ordered by risk)

- **G1 — `NODE_PANELS` (Classes A+B).** Biggest line win (~700–900 lines → one table + ~40-line
  renderer), most uniform, zero quest-state writes (B's once-flags move into the renderer's
  `once` handling, same flags). **Provable no-op: golden-DOM parity** — a harness renders every
  affected node across a state matrix before/after and diffs `#story-*` panel HTML byte-for-byte.
- **G2 — `NODE_HOOKS` (Class E).** Mechanical extraction, verbatim function bodies; golden-DOM
  parity again. After G1+G2 the special-case stack is ~7 quest-activation + ~12 button blocks.
- **G3 — Class C per-arc** (WM, cat, VS, NG+ CI): quests gain real `gate`/`activateNode`;
  activation parity proven per arc by the existing arc tests + `check:questgraph` reachability.
- **G4 — Class D per-verb** (the `cost` leaf + live `choice` render — Inc A's first content
  consumer). Riskiest (real UX change: buttons become VM choices); needs its own child report.
- **G-FU — the 47 engine-region inline exceptions** (Class F): triage after G1–G4.

## 6. Invariants

Free-Movement untouched (panels/hooks/choices are not movement steps). G1/G2 are render-only —
outside all four parity fences; G3 touches quest *data* (QUEST:CORE stays byte-identical; data
edits only); G4 adds one gate/opcode leaf → kernel edit in `js/quest.js` + re-inline +
`check:questparity`/`check:gateast` extension in lockstep. Seeded RNG N/A for G1–G3. Hazard #1
(stop the `:1367` server) applies to every inline-JS edit. ~~Baseline reds J14/J15 + TGS/SPB expected
unchanged throughout.~~ **[STALE as of 2026-07-28 — §DX-01a retired both baselines; `check:walk` is
fully green (11 gates, incl. the new `check:dupkeys`). For G2b/G4: expect NO reds — any red is a
real regression.]**

## 7. Open knob for the user (the ASK) — ANSWERED, design LOCKED 2026-07-28

1. **Lock Option C (layered) vs all-bits vs all-render-fns?** → **Option C — layered** (user
   selected via Ask). NODE_PANELS for A/B, NODE_HOOKS for E, C/D migrate into the VM per-arc.
2. **Slice order G1→G2→G3→G4 confirmed?** → **Confirmed** (G1 first = biggest win, lowest risk).
3. **G4 scope veto:** → **OK in principle, but G4 gets its own child design pass** (child lab
   report before implementation, as §5 already flags). G1–G3 proceed regardless.

## 8. G2 ship addendum (2026-07-28) — one design deviation, recorded honestly

**G2 shipped: 7 Class-E blocks → `NODE_HOOKS`** (Void Archaeology · Void Shaman Warden · Corelli
Merchant · Codex Core Chamber · La Riva row · Scholar Workshop · Mimic Meadows; ~440 lines out of
storyRender). **Deviation from §4-C2's sketch:** the "single dispatch loop" is **order-UNSAFE** —
Corelli's gate is the computed `_checkCorelliAppearance` schedule (any of 5 nodes), so no single
dispatch position exists from which it cannot cross a same-node co-firing block (the §3-1 LIFO
hazard); a keyed `NODE_HOOKS[code]` map cannot even express its gate. **Shipped shape:** verbatim
self-gating hook fns + an ordered `NODE_HOOKS` registry (with `nodes` as tooling metadata, `null`
= computed schedule) + **in-place dispatch** — `_runNodeHook(id, node)` sits at the exact source
position each block occupied, so stacking order is preserved **by construction** and the G1
order-safety rule needs no per-block exclusion analysis. **Proof:** 14-combo golden-DOM
before/after diff **byte-identical** (story-column HTML + move-msg + quest/flag probes, 0 page
errors both sides); `uqf-node-hooks.test.js` 4/4; `quest-runtime-uqf` 303/303 (+ panels 7 +
npc-card-map 22 = 332/332); all four parity fences byte-identical; every `check:walk` gate green
except the documented J14/J15 + TGS/SPB baselines. **Deferred to G2b:** the Birka-region nested
UIs (Blue Shutters, Froberger Memorial, Pachelbel/Couperin ledgers, Pit Championship, Kenickie
shop, Kern & Sable) — they anchor to `npcRowDiv` / nest inside the Layer-41 scope and need a ctx
argument design; and the CDG/Tilbury/Visby mixed blocks, which are G3's quest-activation
territory. Side-finding: fresh SZG legitimately renders no workshop panel — the node's own `loot`
auto-grants the Prototype Wand on arrival, gating the wand button off (test probe adjusted, not a
regression).

## 9. G3 ship addendum (2026-07-28) — the row's premise was half-stale, and the drift WAS the work

**G3 shipped: the 5 Class-C activation blocks (NG+/WM/TL/VS/cat, 15 quests + 3 adjacent) are real
`gate:` + `activateNode` data.** But grep-before-building rewrote the premise before a line moved:

1. **Most of the 15 already HAD an `activateNode`** — appended by the `a721254`/`ea02faf` audit
   waves as a duplicate key below the authored `activateNode:null` (last-key-wins). Result: the
   whole cat chain, `tl_02/03`, `vs_02/03/warden`, `la_riva_02/03` mass-activated at their nodes
   with vacuous `gate:{}` — **the legacy stanzas' staged sequencing had already silently died**;
   only their bespoke messages still mattered. `710bb75`'s "SF→LCY" dead-code remap sent
   `tl_01`/`tl_03` to the wrong node entirely (SF = the Storefront = STN).
2. **`actNumber` is `node.act`, not campaign progress** (`storyRender` line 6), so every act-gated
   leg (`vs_01` "Act V+", `tl_03` "Act IV+") was structurally dead; `wm_01`'s "Act VI+" was
   vestigially always-true at NUE. No `actMin` leaf was needed — nothing real to express.
3. **`NODE_MAP.VS` and `NODE_MAP.TL` had no `code` field** — the entire VS arc and the TL Vonn
   path (tl_02's only completion) had NEVER run. Fixed via `./api.sh put node` — the Solvak/Vonn
   buttons render for the first time ever. Reviving them exposed two latent **double-pay** bugs
   (Ori and the seal-delivery buttons duplicated their quests' W7c onComplete grants) — both
   buttons now narrate + set the completion flag and the quest chain pays exactly once, keyed on
   the quest being ACTIVE.

**Mechanism shipped:** `_uqfActivateAtNode(node)` — the activation loop extracted from
storyCheckQuests and ALSO run at the START of storyRender (idempotent; its msgs join the strip in
the same position), because per-node UI keyed on `'active'` must see same-arrival activations, as
the retired inline stanzas guaranteed. New per-quest fields the host understands: **`onActivate`**
(absent → `📋 title` · `null` → silent · `{msg, delayMs}` → bespoke delayed narration, verbatim
from the old blocks) and **`boardExempt`** (the NG+ remembrance set never posts). The gate grammar
needed ZERO new leaves — `countMin` on `ngPlusRun`, `questsDone`, `notFlags`, `flags` covered
everything.

**Board consequence (deliberate):** real gates make `_bountyPostable`'s "gate satisfied ⇒
in-sequence" promise TRUE — the slate sheds exactly the out-of-sequence chapters
(cat_02–06/void, tl_03, vs_02/03/warden, la_riva_02/03); chain heads still post. The FU6
legitimacy tests were updated from "canActivate on a fresh game" (satisfiable only by vacuous
gates) to **in-sequence at referral time**; Yva's button re-keyed on `quest_vs_02` active heals
the referral route's dead-end.

**Proof:** 20-combo golden-state harness (pre-captured at HEAD, re-diffed after) — **14/20
byte-identical, 6 intended diffs, 0 unexpected** (VS revival ×2, cat staging ×4); permanent
`uqf-quest-activation.test.js` 8/8; `quest-runtime-uqf` 303/303; warrants-board 25/25 +
npc-card-map 22/22 + panels 7 + hooks 4 + gate-ast/coroutine/env/softlock/quest-core + 4 smokes =
**410 tests in the final runs**; all four parity fences byte-identical (`QUEST:CORE` untouched —
the host change is storyCheckQuests/storyRender, outside the fence); `check:walk` green except the
documented J14/J15 + TGS/SPB baselines; §7½ eyeballed (VS shows Solvak's card + button + listed
quest; CDG staged). **Left for G-FU/backlog:** the `ath05_act3/4`-class imported multi-act chains
still mass-activate per node corpus-wide (pre-existing, now visible at VS); the 201×
`npc:"long_john_silver_sen"` mis-stamp from `ea02faf`; a corpus-wide duplicate-key audit.

## 10. G2b ship addendum (2026-08-04) — the ctx design was one field, and the migration read five dead beats out of the region

**The blocker G2 recorded was "these need a ctx-argument design."** It was answered by
measurement rather than by design: of the 89 `storyRender` locals in scope at the region, the 29
Birka blocks read **exactly one** — `npcRowDiv`, the `#story-npc-cards-row` element. (The scan's
apparent `n` / `row` / `txt` / `fav` hits were `\n` escapes inside strings, a word inside a
comment, and block-local declarations; `keys` and `_npcNodeKey`, the two candidates one would
expect, are read by **none** of them.) So the ctx is `{ npcRowDiv }` and nothing else, built once
beside the anchor it carries. `_runNodeHook(id, node, ctx)` forwards it; the **21** hooks that
append destructure it in the signature (`function _nodeHookBirkaX(node, { npcRowDiv })`), the
**8** that write no DOM here take `(node)` alone and are asserted never to name the anchor.

**Two safety properties checked before the move, not after.** (1) **No top-level `return`** — all
13 `return`s in the region sit inside click handlers, so a `return` that used to exit *nothing*
cannot now exit a hook early. (2) **No `var`** — nothing hoists out of a block into the function
scope for a later block to read. Both were mechanical scans, and both were the reason a verbatim
move is legitimate here at all.

**Bodies moved byte-for-byte — not even re-indented.** The strongest evidence is a line-multiset
diff of the two revisions: **nothing was removed except the 2 old `_runNodeHook` lines**, and
everything added is scaffolding (29 function headers, 29 closers, 29 registry entries, 29
dispatch calls, 13 comment lines, the ctx declaration, the 2 new dispatch lines). Every one of
the 895 moved lines is identical on both sides.

**Proof of no-op: a 17-combo golden-DOM/state diff, 16 byte-identical.** The 17th (`HKG-base`)
differs — and differs again between **two runs of the same code**, because the CY Madness Gate
draws `Math.random()` (unseeded) and writes the result to two persisted `S_story` fields. That is
a **pre-existing violation of invariant #6**, not a regression; filed as **§DX-02m** (51
`Math.random()` sites; `check:rng` guards stream *parity*, so nothing gates *which* stream a
state write draws from).

**The finding: five act-gated beats in this region cannot fire, and one of them takes a second
beat down with it.** `storyRender` assigns `S_story.actNumber = node.act || 1` on every render,
before this region; every Birka node is `act:1`. So `birka-lamp-inquiry` (`>= 2`),
`birka-brynn-heartwood-letter` (`>= 4`), `birka-yael-named-report` (`>= 6`),
`birka-s54-joint-witness` (`>= 7`) and `birka-quill-couperin-farewell` (`=== 8`) are unreachable
— the same structurally-dead act leg **§VM-01-G3** retired from the quest stanzas, still standing
in five narrative beats. `birka-lamp-choice` gates on `brynnKeeperStoryTold`, whose **only writer
is the dead Beat 1**, so the whole §XXXV lamp arc past its ambient line is unreachable. Note the
Yael scene also disagrees with its own design doc on the **node** (`world.md` §XXXIX says
`LLA`/`HKG` at Act IV+; the code says `LHR` at Act VI+) — which is exactly why this is filed as
**§VM-01-G2b-FU** (design call) and not guessed at: §AUDIT-03m-FU's lesson is that annotating or
"fixing" an unverified claim launders it. `world.md` and `story.md` are annotated at all five
sites; the defect is pinned by a test so the follow-up must update it.

**The anchor class is now empty, and G2's deferral list was approximate.** After the move the only
`npcRowDiv` references left in `storyRender` are the element's own three construction lines, the
ctx, and the final `insertAdjacentElement` — **zero** block bodies. Of the six UIs G2 named as
deferred, four are inside the 29 (Blue Shutters and Froberger Memorial as their own hooks; **Pit
Championship** is a sub-block of `birka-weckmann-log`; the ledgers are `birka-pachelbel-ledger` /
`birka-brynn-maintenance`), but **Kern & Sable is not an npc-row block at all** — it sits
immediately *after* the row's insert on a different anchor, and **Kenickie** is a CDG NPC whose
surface belongs to the mixed CDG/Tilbury/Visby blocks G2 assigned to G3's territory. Both are
Class-E candidates for a later slice, not residue of this one. **What remains above the front is
G4 (Class D per-verb, needs its own child report) and the G-FU engine-region exceptions.**

## 11. G-FU triage (2026-08-05) — the engine region censused, the "front" metaphor breaks below the engine, and the fence ships before any block moves

**The row said "the 47 engine-region inline exceptions (Class F): triage after G1–G4." G1–G4 are
complete, so this is the triage — and the count held: 47.** Re-measured live at `513df2b`: the
file carries **115** `node.code ===` comparisons (+1 in a comment). They split **36** registry
self-gates (the migrated `NODE_PANELS`/`NODE_HOOKS` bodies' own verbatim guards — by design) ·
**24** above the front (G4 territory: the G4c-FU-blocked verbs, the deliberate non-migrations,
the delayed one-time beats) · **48** below the front inside `storyRender` (**47** special-case +
1 generic `q.waypointNode` comparison, which compares against *data* and is the engine done
right) · **6** outside `storyRender` (the `quest_city_watch_patrol` ordered-visit writes ×3 in
`storyCheckQuests`; the INN kindness-discount pricing ×3 in `storySleep`/`storyConfirmSleep`).

**Finding 1 — the "migration front" metaphor breaks below `_mkSection`.** The parent's model was
two programs stacked: special cases, then the generic engine. Reading the engine region end to
end shows a THIRD layer: after the generic sections (Fish / Encounter / Quests / Board / Loot /
Rest / World / EB chips / Key Events, all data-driven) sits a **second special-case stack —
~1,200 lines, ~38 blocks** — accreted by the newer content arcs: §CROWN-01 (WG0/HW1/HG1/HN1/INN/
HCA), §LXX–LXXIII (CAN/DA2/DA3/DSJ/DSF), §SPARK-01/02 + §WHODUNIT-01 + §NAVAL-01 + §PORT-01/02
(LCY/SEN/GCI/DNF/MME), §HUNT-01/02 (WRO/BNX/HFT/KSU/ALF/VAW), §ALCHEMY-01 + §WISDOM-01 (KIR/MAN/
SEN/PDL/MLA/ATH/VS), plus the §XLV SSJ tournament. The front did not merely stop moving backward
— **new content started accreting BELOW it**, in the same five shapes the §2 taxonomy already
names. Every block is the `.sweelinck-variant` house pattern: a state-multiplexed colored panel,
usually with one or two effect buttons, several launching a staged `setTimeout(storyPreBattle,
400)` fight under a **synthetic defeatedBattles code**.

**Finding 2 — zero dead references. The rot thesis has not struck below the front, and the reason
is age, not architecture.** Verified against the live registries: all **36** unique compared node
codes resolve in `NODE_MAP`; all **12** referenced quest IDs exist in `QUEST_DB`; all **14**
battle keys exist in `MONSTER_POOL`; every flag these blocks read has a writer (the four
apparent orphans — `hagDefeated2`, `drownersDefeated`, `seaStrangenessNoticed`,
`whodunit2Solved` — are written by `flag_write` bits in the `set:[…]` array shape). The two
unresolved hits the sweep raised are both **comments** (`node.code === 'XX'` in the NODE_PANELS
header; `defeatedBattles['CF']` in the Pit Championship note) — the §AUDIT-03f lesson biting the
sweep itself. This stack is young content authored against live codes. `birkaNpcs` was young
once too.

**Finding 3 — nothing fenced any of it, and that is the shippable half.** Gate #13 scanned
registries, node-valued *fields* and routes — never a **comparison literal**, and never the
**synthetic battle code** family (`code:'WG0_TRIAL'` spreads, `defeatedBattles['…']` guards,
`battles:[…]` completion gates, `nodeCode ===` overlay guards — the exact shapes G4d's ship
record noted "this gate never scanned"). **Shipped: `check-noderegs.js` phase 6.** Comment-aware
by construction (comments → spaces, offsets preserved); every literal in the four shapes must
resolve in `NODE_MAP` **or** be classified in `SYNTHETIC_BATTLE_CODES`, which grew 3 → **20**
(each with its arc named); a classified code the file stops mentioning is a **stale entry** and
fails in the other direction. Selftest grew 8 → **11**: a planted dead comparison caught, an
unlisted synthetic caught, a stale classification caught, and the **negative control** — the
same dead literal inside a comment is prose, not a finding. Stated limit, in the §AUDIT-03q
house style: the scan is textual, so a comparison through an alias (`const c = node.code;
c === 'XX'`) is not caught — stated rather than left as silence that reads like coverage.

**Classification of the 47 (by the §2 taxonomy, read against the *shipped* grammar):**

| Shape | Count | Sites | Expressible today? |
|---|---|---|---|
| D1 combat-dispatch verb (the G4d shape: `narrative` + `combat` w/ synthetic code) | ~14 | WG0 · HW1×2 · HG1×2 · HN1×2 · INN · HCA boss · BN hag · LD drowners · DSJ eels · SB fight leg · VS shadow fight leg | **YES** — G4d shipped this exact shape |
| Multi-state colored panel (Class A at 2–5 states, `fn(st)` text + style) | ~12 | NWI · KSU · ALF · PDL · MLA · done-states of DA2/DA3/WRO/HFT · SEN spark | **YES if** `NODE_PANELS` takes fn-valued `text`/`style` — G4c's `bits:fn(st)` precedent |
| Staged chain panels (panel + 1–3 staged effect buttons) | ~14 | LCY · SEN whodunit · DNF×2 · MME · KIR · MAN · SEN ship · ATH · CAN · DA2 gate · DA3 · DSF · HG1 gift · HCA marks | **MOSTLY** — verbs are label+bits; the chrome question is G4c-FU ask 2 |
| D3 concurrent menu | 1 | GCI intercept (3 role buttons) | **YES** — G4d's container mode |
| Class E bespoke UI | 1 | SSJ tournament (accordion state machine over `NPC_TOUR_OPPONENTS`) | **NO** — `NODE_HOOKS` verbatim, G2's method |
| Genuine engine specials | 5 | TLS `isFinal` framing · INN sleep pricing ×3 · patrol ordered-visit ×3 (counted as 2 blocks) | **Design calls** — node-field vs grammar |

One census correction to G4: **MME's hull-repair button is a seventh hand-written gold site**
(`200gp`, refuse-at-click, `if (gold < 200) { storyMsg(refuse); return }`) — G4 counted six.
It is a `cost`-leaf consumer waiting, and it confirms the leaf's contract generalizes.

**Slice plan (locked; each independently shippable, per-arc so every slice has one fiction):**
- **G-FU-a — §CROWN-01** (8 blocks at WG0/HW1/HG1/HN1/INN/HCA): the combat verbs are G4d's
  shape verbatim; the HCA iodine pre-buff is a 2-verb sequence; the marks conversion is a
  `NODE_PANELS` once-panel with fn text. Largest uniform win, no design call.
- **G-FU-b — §HUNT-01/02** (6 blocks at WRO/BNX/HFT/KSU/ALF/VAW): hooks + investigation panels
  + 2 combat verbs. No design call.
- **G-FU-c — §ALCHEMY-01 + §WISDOM-01** (8 blocks, the Roen arc): staged verbs + panels; the
  VS shadow block is a genuine **D2 choice** (accept vs fight) — the second `choice` consumer.
- **G-FU-d — the harbor chains** (§SPARK-01/02 · §WHODUNIT-01 · §NAVAL-01 · §PORT-01/02 at
  LCY/SEN/GCI/DNF/MME): the GCI menu is D3; the MME hull repair converts to `cost` in place.
- **G-FU-e — the §LXX family** (CAN/DA2/DA3/DSJ/DSF): small verbs + done-panels.
- **G-FU-f — the engine specials + SSJ**: SSJ → `NODE_HOOKS` verbatim (no design call); TLS
  `isFinal` / INN pricing / patrol need their **design calls** (node field vs grammar vs stay)
  — filed, not defaulted.
- Panel chrome note: every block above uses per-state `border-left-color`/`color` on
  `.sweelinck-variant`. If `NODE_PANELS.style` (G1's own field) is accepted per-state via
  `fn(st)`, the chrome question **dissolves** for this stack — it is G4c-FU ask 2's
  `.sweelinck-variant` *builder* case, not its six-knob generic-panel case. To be re-read at
  G-FU-a ship time, not answered here.

**What this triage deliberately did not do:** move a block (the fence had to exist first — the
§DX-02g "durable half" order), answer G4c-FU's asks (they are the user's), or pin the 47 count
in a test (**pin the property, never the incident** — the property is "every literal resolves or
is classified," and it is now gate #13 phase 6, which the count will pass through as it shrinks).
