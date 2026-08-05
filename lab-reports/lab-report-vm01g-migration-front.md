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

**Ship hash:** `02ff4aa` (2026-08-05).

## 11a. G-FU-a ship addendum (2026-08-05) — the §CROWN-01 stack moved, and the plan's own re-read corrected two of its three shapes

**The slice plan held for the seven bare-button dispatches and was corrected by measurement on
the other two shapes.** (1) *"the combat verbs are G4d's shape verbatim"* — true for the SEVEN
bare buttons (HW1 kelpie/witch · HG1 mudcrab/octopus · HN1 spawn/demon · INN eel), which are
`NODE_VERBS` groups `crown-hw1`/`crown-hg1`/`crown-hn1`/`crown-inn`, dispatched in place. WG0's
gate trial is NOT that shape — its button lives INSIDE a `.sweelinck-variant` panel with its own
chrome, i.e. the staged-chain-panel row of §11's own table, so it moved to `NODE_HOOKS` verbatim
(G2's method) until the G4c-FU ask-2 chrome question is answered. (2) *"the HCA iodine pre-buff
is a 2-verb sequence"* — measured NO, for two reasons the plan couldn't see without reading the
grammar against the block: the burn writes a **numeric** field (`iodineBuffBonus = 5|3`) and
`flag_write` is boolean-only — no opcode expresses it — and the boss button renders
**visible-but-disabled** until a held salt burns, an interlock a `when`-gated verb cannot render
(absent ≠ disabled). Growing the grammar for one consumer would be the `itemsMinAny` failure, so
the Leviathan block is a `NODE_HOOKS` verbatim move too, its reasons stated in the hook header.
(3) *"the marks conversion is a NODE_PANELS once-panel with fn text"* — held, with the stated
rule that a **once**-panel's text fn may carry the block's original awards (the verbatim body);
a non-`once` panel's text must stay pure.

**Finding 1 — the Glut's Gift block was DEAD since it shipped (the §VM-01-G1-FIX AO class,
found by the migration's own gate re-read).** Its once-guard was `!visited['HG1']`, and
`storyCollectLoot` flips `visited[code]` unconditionally earlier in the same render — so the
condition was always false by the time the block ran. The jar was never granted, while HG1's own
node text promised it (*"She gives you the jar as you arrive. … It is warm in your hand."* — the
prose and the mechanics disagreed, and the prose was right). The panel's guard is now
`!glut_gift_held && !glutGiftReturned` (`glutGiftReturned` is the durable once-guard — set by
quest_glut_06's onComplete in the same write that clears `glut_gift_held`, so the pair cannot
re-fire after the return).

**Finding 2 — quest_glut_06 ("The Open Hand") was dead a SECOND way: circular completion.** It
completes on `flags:['glutGiftReturned']`, and the only writer of that flag was its own
`onComplete`. Invisible at HEAD because finding 1 meant the quest never even listed. The fix is
the one this track's own vocabulary supplies: the **`hg1-gift-return` verb** (*🍯 Return Glut's
Gift to the feeding pool*, group `crown-hg1`) writes the flag; the quest's own completion
pipeline does everything else — no QUEST_DB edit, no new grammar. Two rules the first
implementation got told by a test: the verb's `when` must read the flag its own chain writes
(the la_riva rule — the driver re-renders BEFORE the end-of-render completion pass, so quest
status and inventory are unchanged at that moment), and an `atNode`+`itemsAll` completion was
rejected at design time because `storyCheckQuests` activates and completes in ONE pass — the
quest would have granted and returned the jar in the same arrival.

**What stayed inline, on purpose:** the HW1 `whisperSaintSeen` latch — a silent state write with
nothing to render (quest_whisper_05 completes on it); the migration moves *surfaces*.

**Evidence.** Line-multiset diff: the WG0 and HCA-Leviathan hook bodies moved with **zero
unmatched lines** (byte-identical); the seven transformed buttons and two panels are pinned by a
37-authored-string sweep, every string surviving exactly once. Golden capture, 26 combos over
DOM+bbox+state, HEAD vs after: **14 byte-identical · 8 id-only** (`story-*` → `verb-*`, bboxes
equal) **· 4 named deltas** — two ARE the fix (hg1-fresh grants the jar and lists The Open Hand;
hg1-return-offered shows the new verb), two are G4d's re-render class (the clicked dispatch
button returns enabled behind the pre-battle overlay instead of staying disabled). Self-stability
26/26. §7½: 8 story-column PNGs, **6 byte-identical**, the 2 differing being the fix states,
both eyeballed. `uqf-node-verbs-crown.test.js` **11/11, 6 red on HEAD and the 5 greens exactly
the verbatim/unchanged-behaviour tests**. Three registry pins grown, each right to exist:
`uqf-node-hooks` (9→11, the crown hooks appended in source order), `uqf-npc-row-hooks` (the
npc-row block is contiguous but no longer the registry TAIL — the crown stack sits below it in
storyRender source order), `uqf-node-verbs-d1` (the label-verb pin excludes `crown-` groups,
which `uqf-node-verbs-crown.test.js` owns). `check:walk` 16/16 exit 0; full Playwright
**862 passed / 4 failed** (855+11 tests; the four = the documented `worldbuilder-crud-arrays`
set).

**Ship hash:** `56c08f1` (2026-08-05).

## 11b. G-FU-b ship addendum (2026-08-05) — the §HUNT-01/02 stack moved as a provable no-op, and the plan's "2 combat verbs" corrected the same way WG0 did

**The slice plan said "6 blocks at WRO/BNX/HFT/KSU/ALF/VAW: hooks + investigation panels +
2 combat verbs." The block census held (6 blocks, 8 `node.code ===` comparisons — WRO and HFT
carry two branches each); the shapes were corrected by measurement in two places, both by rules
this report already recorded.**

**Correction 1 — the "2 combat verbs" (BN hag, LD drowners) are not bare D1 buttons.** Both
battle buttons live INSIDE their `.sweelinck-variant` panels (`_bnDiv.appendChild(_bnBtn)`,
`_ldDiv.appendChild(_ldBtn)`) — the exact shape that moved WG0 out of §11's D1 row in G-FU-a.
Splitting text→panel + button→verb would move the button from inside the bordered chrome to a
full-width sibling below it (the G4c flex-column lesson: a DOM diff proves markup, not layout),
so both blocks moved to **`NODE_HOOKS` verbatim** (G2's method) until the G4c-FU ask-2 chrome
question is answered. This slice ships **zero verbs**, and that is the honest reading of its
material: all four button-carrying blocks (WRO/HFT hook panels, BNX/VAW battle panels) are the
panel-with-embedded-button shape.

**Correction 2 — WRO's done panel cannot go to `NODE_PANELS`, for a stacking reason measured
live.** `_renderNodePanels` runs EARLY in `storyRender` (`_renderNodePanels(node`), and at WRO
the junction vignette and the Corelli merchant button both co-render as story-text-box
'afterend' siblings, inserted LATER — so the panel table would re-stack the done panel BELOW
them, where the inline block (last insert wins the top) put it ABOVE. The done branch stays in
the `hunt-wro-relay` hook; the LIFO property is pinned by a test, G2's ZRH pattern. **HFT's done
panel has no co-rendering sibling** (golden-verified: every HFT/KSU/ALF/VAW combo renders the
hunt panel as the ONLY sibling), so it and the KSU/ALF investigation panels moved to
`NODE_PANELS` — five entries. The per-state chrome needed **no fn-valued `css`**: each 2-state
block is two entries sharing one DOM id with mutually exclusive `when`s (the DUS else-leg
precedent), each entry's `css` the state's *effective* style — the base cssText with the two
property overrides already applied, which serializes byte-identically. The §11 chrome note's
fn-css dissolution stays unanswered and unneeded at this size; it becomes real at G-FU-c/d's
larger multi-state panels.

**What this slice deliberately did not change:** the staged 400ms `storyPreBattle` beats (hooks
keep the block's own timing verbatim — the G4d same-beat delta applies only to verb
transformations, and there are none here); and the WRO/HFT hook buttons' click narratives, which
the end-of-render quest strip already overwrote on HEAD (the §BOARD-01-FU6 destroyed-narrative
class, observed in the golden capture's `wro-click`/`hft-click` combos) — recovering them means
transforming the blocks, which is the ask-2-blocked work, not this slice's.

**Evidence.** Golden capture, **22 combos** over sibling DOM + bounding boxes + message
text/class + pre-battle overlay/node + state, HEAD vs after: **22/22 byte-identical** — the
first slice in the family with no delta at all, because nothing transformed: verbatim hooks kept
ids, timings and chrome, and the five panel entries reproduce the inline divs' serialized styles
exactly (including HFT's done div carrying no id, reproduced by an id-less entry).
Self-stability 22/22. §7½: **8 story-column PNGs, 8/8 byte-identical**, wro-fresh and bnx-lair
eyeballed live (embedded buttons inside their panels; junction vignette + Corelli stacking
unchanged). 24-authored-string sweep, every string exactly once (the two double-counts are
pre-existing independent uses: BNX's own `node.battle` label, a quest hint naming the Elder
Fisherwoman). `uqf-node-hunt.test.js` **11/11 with 3 red on HEAD — exactly the registry/source
tests — and all 8 behaviour tests green BOTH ways** (G2's honest shape at its purest: a
verbatim move's behaviour tests must not depend on the change). `uqf-node-hooks` pin grown
11→15 (the hunt hooks appended in source order below the crown pair). Gate #13 phase 6 already
held `BN_NIGHTHAG`/`LD_DROWNERS` from the triage, so no classification change. `check:walk`
**16/16 exit 0**; full Playwright **873 passed / 4 failed** (877 tests; the run reported 872/5
and the fifth was the known `multiplayer-presence:171` flake, 7/7 alone; one BACKLOG.md anchor
hint refreshed by `anchors:fix` after the ~180-line shift above `storyRender`).

**Ship hash:** `cf2fec8` (2026-08-05).

## 11c. G-FU-c ship addendum (2026-08-05) — the §ALCHEMY-01/§WISDOM-01 stack moved as a second zero-delta no-op, and the "second `choice` consumer" is corrected by the rule the last two slices wrote

**The slice plan said "8 blocks, the Roen arc: staged verbs + panels; the VS shadow block is a
genuine D2 choice (accept vs fight) — the second `choice` consumer." The block census held
(8 blocks at KIR/MAN/SEN/PDL/MLA/ATH/VS — VS carries two); the shapes were corrected by
measurement, using exactly the rule G-FU-a and G-FU-b established.**

**Correction — the whole stack is panel-embedded, so this slice ships ZERO verbs and no
`choice`.** Every button in the eight blocks lives INSIDE its `.sweelinck-variant` chrome:
KIR's three staged states (`_aDiv.appendChild(_aBtn)` in each), MAN/SEN/ATH's single beats, the
VS underground descent, and the manuscript hub's hook/bind/shadow states. The VS shadow pair
has genuine D2 `choice` semantics — exclusive accept-vs-fight, no launcher button, exactly
Kern & Sable's shape — but its SURFACE is a bordered panel whose prompt text and both option
buttons share the chrome, and a `choice` verb's surface is `_uqfRunVerb`'s bare div mount
(`margin-top:8px`, no class, `_mkAmbientLine` prompt at 11px italic vs the panel's 12px
non-italic). Converting it changes chrome a DOM-of-the-options diff would misread as equivalent
— the G4c layout lesson — so the hub moved to **`NODE_HOOKS` verbatim** and the second `choice`
consumer is **G4c-FU ask-2-blocked work**, filed, not defaulted. Six hooks
(`alch-kir-dream` / `alch-man-noon` / `alch-sen-ship` / `alch-ath-stoic` /
`wis-vs-underground` / `wis-vs-hub`), registry tail, dispatched in place.

**What did leave the hooks: PDL and MLA, the stack's only button-less blocks** — 2-state
pure-text panels, four `NODE_PANELS` entries in the DUS else-leg shape (two entries share one
DOM id with mutually exclusive `when`s, each `css` the state's own cssText verbatim; both
inline divs carried their id in both states, so no id-less entry was needed). Sibling analysis
by the G-FU-b WRO rule, then golden-verified: **nothing co-renders afterend at PDL**, and MLA's
only co-render is `story-ml-snake`, which sits EARLIER in the panel table — so table order
preserves the inline LIFO (alch panel above the snake panel), pinned by a test. The §11 chrome
note's fn-css dissolution stays unneeded a second time: no state in either block overrides a
property after cssText, so each state's css IS the authored string.

**One shape worth naming: the `wis-vs-hub` hook carries the block's `VS_SHADOW → wisPage6`
latch, which runs on EVERY render** — the inline latch sat before the `node.code === 'VS'`
guard, so it fired wherever you rendered. `_runNodeHook` dispatches by id (`nodes` is tooling
metadata), and the dispatch call is unconditional at the source position, so the latch keeps
exactly that behavior. Same class as G-FU-a's HW1 `whisperSaintSeen` latch, except this one
lives inside the moved block's own braces, so it moves WITH the block rather than staying
inline. Pinned by a test (a won VS_SHADOW flips the page flag at the next render).

**Evidence.** Golden capture, **37 combos** — the family's largest, because the hub is 5-way and
the KIR block 4-way — over sibling DOM + bounding boxes + message text/class + pre-battle
overlay/node + state (roen chain flags, wisdom pages, knowledge, inventory), HEAD vs after:
**37/37 byte-identical**, the second zero-delta slice in a row. Self-stability 37/37. §7½:
**8 story-column PNGs, 8/8 byte-identical**, kir-stone and vs-shadow eyeballed live (the shadow
options inside the hub chrome; the quest hint on screen even says "Use the story panel at VS to
choose: accept or fight"). 23-authored-string sweep, every count equal to HEAD (the doubles are
pre-existing independent uses: QUEST_DB hints and journal prose quoting the same lines).
`uqf-node-alch.test.js` **16/16 with 3 red on HEAD — exactly the registry/source tests — and
all 13 behaviour tests green BOTH ways** (G2's honest shape). `uqf-node-hooks` pin grown 15→21;
`uqf-node-hunt`'s tail pin adjusted to the contiguous run (the alch stack now sits below it —
the same adjustment G-FU-a made to the npc-row pin). Gate #13 phase 6 already held `VS_SHADOW`
from the triage, so no classification change. `check:walk` **16/16 exit 0**; 25 anchor hints
refreshed by `anchors:fix` after the ~270-line shift (the G-FU-b lesson applied up front); full
Playwright **889 passed / 4 failed** (893 tests; the four are the documented
`worldbuilder-crud-arrays` set; the `multiplayer-presence:171` flake passed this run).

**Ship hash:** `7d8cb39` (2026-08-05).

## 11d. G-FU-d ship addendum (2026-08-05) — the harbor chains moved, the plan's D3 claim corrected by a STRING, and a second circular-dead beat surfaced

**The slice:** §SPARK-01/02 · §WHODUNIT-01 · §NAVAL-01 · §PORT-01/02 at LCY/SEN/GCI/DNF/MME —
seven surfaces in six blocks (~378 lines) → **six verbatim hooks + three `NODE_PANELS` entries,
ZERO verbs.** Hooks `spark-lcy-harmony` / `whodunit-sen-bilge` / `naval-gci-intercept` /
`port-dnf-access` / `spark-dnf-harmony` / `port-mme-saltwick`, registry run appended after the
alch stack (source order), dispatched in place.

**The plan's "GCI intercept = D3 concurrent menu → G4d's container mode" is corrected by
measurement, and the reason is new to the family: a STRING.** The intercept's three role buttons
are genuinely concurrent (D3's shape exactly), but parley and examine both write
`sbChosenRole = 'parley'|'examine'` — a string enum `flag_write` (boolean-only) cannot express,
the HCA `iodineBuffBonus` class in a second type. Growing the grammar for one consumer is the
`itemsMinAny` failure, so the block stays a verbatim hook and the D3 conversion is filed with
the G4c-FU asks. **The MME hull repair is the plan shape that HELD:** the seventh hand-written
gold site now pays through the `cost` leaf via `_uqfRunChain` (the junction-vignette consumer
shape) — refusal speaks Dorit's own line through `storyBlock` (the house shake, the one named
behavioural delta), success leaves every other line of the click verbatim minus the hand-written
`gold -= 200`.

**What left the hooks: the SEN Clot/Warmth panel, the stack's only button-less block** — three
`NODE_PANELS` entries sharing `story-spark-ms` with mutually exclusive `when`s (the DUS
else-leg shape), the solved state's `css` the block's effective serialized style. Sibling
analysis by the G-FU-b WRO rule, golden-verified: SEN's other afterend co-renders
(`story-whodunit2-ms`, the `alch-sen-ship` hook) insert later than the panels phase in both
worlds; no npc-row renders at SEN (no `BIRKA_NPC_PROFILES` profile homes there) and SEN is in
neither `KEY_EVENTS` nor `JUNCTION_VIGNETTES`.

**Finding 1 — the LCY counterfeit-writ beat was circular-dead since it shipped** (the G-FU-a
Glut's Gift class, second sighting): the panel's insertion guard was
`(kingsWritSeen || smaltBefriended)` and `kingsWritSeen`'s ONLY writer is the Inspector button
INSIDE that panel. The arc survived because `quest_spark_01` (gate `{}`) sets `smaltBefriended`
from the quest panel — skipping the Inspector's opening scene and the King's Writ (Counterfeit)
item entirely, while the Scene-5 confrontation still listed "the three claims" as if the first
had been witnessed. The prose and the mechanics disagreed and the prose was right. **Fix, in
the hook, marked inline:** the panel inserts whenever LCY renders (like every other state of
the chain), and the writ button gates on its own flag so the un-dead beat cannot stack
duplicate writs on its own re-render.

**Finding 2 — the Scene-5 confrontation DOUBLE-PAYS on HEAD, and this slice deliberately
preserves it:** the inline button and `quest_spark_05`'s `onComplete` each pay +400gp/+400 XP,
each remove the writ, and each grant a Letter of True Passage (the quest completes on
`aldousConfessed` in the same render — the §ARCH-01 W7b decomposition copied the closure into
the quest while the block kept its own). A verbatim no-op is not the place to fix content;
pinned as measured (gold +800, two Letters) by `uqf-node-harbor.test.js` and **filed as
§SPARK-01-FU**.

**One measured lie left standing:** the MME source comment says the hull panel sits "below" the
access panel; both insert `afterend` of `story-text-box`, so the LAST insert (hull) renders
ABOVE. The hook keeps the real order, a test pins it, and the hook header records the
discrepancy.

**Evidence:** 49-combo golden HEAD-vs-after over sibling DOM + bounding boxes + msg text/class
+ pre-battle overlay/node + state, incl. 13 click-outcome combos — **46/49 byte-identical, the
3 deltas exactly the two writ-fix states and the cost-leaf refusal channel** (same text,
`msg-block msg-shake` class); self-stability 49/49; §7½ **10 story-column PNGs, 8
byte-identical**, the 2 differing being the fix states, both eyeballed live; 38-authored-string
sweep, every count equal to HEAD; `uqf-node-harbor.test.js` **17/17 with 6 red on HEAD — the 3
registry/source tests + the 2 writ-fix tests + the refusal-channel test — and the 11 greens
exactly the verbatim/unchanged-behaviour ones**; `uqf-node-hooks` pin 21→27; **`uqf-node-alch`'s
own `slice(-6)` tail pin broke on this slice and was converted to the contiguous run — the
G-FU-c lesson biting the very file that wrote it**; gate #13 phase 6 already held `MS_BILGE` and
`SB_PRIVATEER`; `check:walk` **16/16 exit 0**; 25 anchor hints refreshed by `anchors:fix` up
front; full Playwright **906 passed / 4 failed** (910 tests; the four are the documented
`worldbuilder-crud-arrays` set; `multiplayer-presence:171` flaked in the full run and passed
7/7 alone).

**Ship hash:** `8cdda7b` (2026-08-05).

## 11e. G-FU-e ship addendum (2026-08-05) — the §LXX family moved, the family's first verb since G-FU-a, and all three of the stack's quests double-pay their own buttons

**The slice plan said "small verbs + done-panels" — measured: ONE verb, and it is the family's
only genuinely BARE D1 button.** Every other button in the stack (CAN document read · DA2 gate
placement · DA3 acknowledgement · DSJ channel clear) lives INSIDE `.sweelinck-variant` panel
chrome — the WG0 embedded-button rule, fourth application — and the DA2 gate additionally
writes a NUMERIC `abilityScores.int += 1`, the HCA `iodineBuffBonus` class in a third sighting,
so it could not be a verb even outside its chrome. Four blocks → **`NODE_HOOKS` verbatim**
(`lxx-can-doc` / `lxx-da2-gate` / `lxx-da3-depth` / `lxx-dsj-eels`, registry tail, dispatched
in place). The button-less surfaces → **`NODE_PANELS` ×3**: the DA2/DA3 done states (id-less
inline, id-less entries — the G-FU-b HFT precedent) and the DSF no-iodine note (keeps the
shared `story-dsf-smelt` id; mutually exclusive with the verb by the iodine test). Sibling
analysis by the G-FU-b WRO rule, golden-verified: **nothing co-renders afterend at any of the
five nodes** — no `BIRKA_NPC_PROFILES` profile homes there (the resident voices in
`NPC_DIALOGUE` render as a WORLD-section card inside `#story-info-row`, not a sibling), and
none of CAN/DA2/DA3/DSJ/DSF is in `KEY_EVENTS` or `JUNCTION_VIGNETTES`.

**The verb: DSF's smelt button** — the inline block inserted a bare `<button>` directly
afterend with no wrapper, exactly the G4c D1 shape, so `lxx-dsf-smelt` is a label verb
(`btnStyle:'margin-top:4px;'`, the inline spacing) with **fn-valued `bits`** for the
charged-preferred salt pick (the G4c precedent — the VM still receives a plain array;
`item_remove` on the absent name is a no-op, byte-identical to the inline splice-on-−1), then
`flag_write` + `reward{gold:400, items:[Sea Element]}` + `narrative`. `reward.items` carries
the full weapon object — no grammar growth needed.

**The finding — all three of the stack's own quests DOUBLE-PAY their buttons on HEAD (filed
§LXX-01-FU, the §SPARK-01-FU Aldous class ×3).** `quest_sunken_02`, `quest_depth_01` and
`quest_forge_02` each carry the button's ENTIRE effect in their `onComplete` and auto-complete
on the same arrival that draws the button (activation + completion in ONE `storyCheckQuests`
pass — the G-FU-a glut lesson), so the still-rendered button pays AGAIN: **DA2 grants a second
permanent INT point** (+500gp; measured 12→13 on arrival, →14 on click), **DA3 a second
+500 XP and a duplicate knowledge entry**, **DSF a second Sea Element** (+400gp). All three
preserved verbatim and pinned as measured — the migration is not the content fix.
`quest_ca_01` at CAN is the same pair done RIGHT (the button writes only flag + knowledge; the
quest's `onComplete` pays +300gp) — the la_riva/hg1 fix shape, already in the file, one arc
over.

**Evidence:** 25-combo golden HEAD-vs-after over sibling DOM + bounding boxes + msg text/class
+ `_preBattNode` + state incl. 13 click combos — **20/25 byte-identical** (every hook and
panel surface, all three double-pays to the byte), **1 id-only** (`story-dsf-smelt` →
`verb-lxx-dsf-smelt`, bounding box equal — the bare button's full-width flex stretch
preserved), **4 the same named delta**: the smelt narrative is READABLE after the click
(state and sibling DOM byte-equal; inline, its own bare re-render destroyed it — §BOARD-01-FU6
class, **fourth recovered narrative**). Self-stability 25/25 both sides; §7½ **25/25
story-column PNGs byte-identical**, dsf-ready and da2-ready eyeballed; 23-authored-string
sweep, every count equal to HEAD (the doubles are the quests' own shared strings);
`uqf-node-lxx.test.js` **15/15 with 5 red on HEAD — the 4 registry/source tests + the
recovered-narrative test — and the 10 greens exactly the verbatim/unchanged-behaviour ones**,
incl. the three §LXX-01-FU double-pay pins passing BOTH ways; `uqf-node-hooks` pin 27→31;
`uqf-node-verbs-d1`'s label-verb pin excludes `lxx-` (the G-FU-a crown precedent); gate #13
phase 6 already held `DSJ_EELS`; `check:walk` **16/16 exit 0**; 25 anchor hints refreshed by
`anchors:fix`; full Playwright **920 passed / 4 failed** (925 tests; the four are the
documented `worldbuilder-crud-arrays` set; `multiplayer-presence:171` flaked and retried
green).

**Ship hash:** `3dfdc26` (2026-08-05).

## 11f. G-FU-f ship addendum (2026-08-05) — the SSJ tournament moved as the family's THIRD zero-delta no-op, and the slice plan's block inventory is DONE

**The plan held exactly as written — the first slice in the family with zero corrections.**
"SSJ → `NODE_HOOKS` verbatim (no design call)" is what shipped: the §XLV tournament block
(124 lines — the census's ONE Class-E bespoke UI, an accordion state machine over
`NPC_TOUR_OPPONENTS` with per-opponent challenge cards, a stake-gated cast roll, and the
Bog losing beat) moved to `_nodeHookSsjTournament`, registry tail after the §LXX run,
dispatched in place. G2's method: **line-multiset 124/124, zero unmatched lines**, and the
git diff is +128/−124 — the 124 verbatim lines plus exactly the 2-line fn wrapper, 1 registry
entry, and 1 dispatch line.

**The ctx is the one new shape worth recording: three storyRender-local SECTION surfaces,
not one DOM node.** Unlike every prior hook (a div: `npcRowDiv`, `cqDiv`), this block renders
a `_mkSection` into `#story-info-row` between the Rest and World sections, using the
storyRender-local builders `_mkSection`/`_mkCard`. Those close over nothing — they are local
by placement, not by dependency — so the ctx passes them under their own names,
`{ row, _mkSection, _mkCard }`, and the body stays byte-verbatim (the G2b rule generalized:
pass exactly what the block already names, nothing renamed). In-place dispatch preserves the
Rest → Tournament → World section order by construction, so the G-FU-b sibling-analysis
question does not even arise — the block owns no afterend siblings.

**Evidence (the zero-delta standard, third time):** 16-combo golden HEAD-vs-after over the
full `#story-info-row` DOM + section bounding boxes + msg text/class + state (gold, beats,
title, bogDefeated, quests, inventory, saved gold), incl. **7 click combos** (accordion
open/close/toggle/walk-away, cast win/lose/tie, the Bog beat, the master sweep, the broke
re-arm, the engine-sole-completer quest chain) — **16/16 byte-identical**; self-stability
16/16 BOTH sides; §7½ **16/16 story-info-row PNGs byte-identical**, fresh and cast-win-bog
eyeballed live (title badge, BEAT strikethrough, quest chain advanced). 9-authored-string
sweep, every count equal to HEAD. `uqf-node-ssj.test.js` **10/10 with 3 red on HEAD —
exactly the registry/source tests — and all 7 behaviour tests green BOTH ways** (the G-FU-b
honest shape); `uqf-node-hooks` pin 31→32; `check:walk` **16/16 exit 0**; 23 anchor hints
refreshed by `anchors:fix` (the ~124-line shift above storyRender — the G-FU-b lesson,
run it in-slice); full Playwright **931 passed / 4 failed** (935 tests; the four are the
documented `worldbuilder-crud-arrays` set; no flake this run).

**Left as measured, filed not fixed:** `_tourRoll` draws `Math.random()` into persisted
state (gold, `yugurtTourBeat`) — a §DX-02m site, noted in the test header. The win path's
`storyCheckQuests(node)` is the §ARCH-01 W8c sole-completer contract working correctly —
pinned green both ways, no double-pay here (the §LXX/§SPARK class does NOT strike: the
button pays the stake, the quest pays only xpAward).

**With this slice the §11 slice plan's BLOCK INVENTORY IS COMPLETE** — every one of the
~38 below-front special-case blocks the triage censused now lives in a registry
(`NODE_HOOKS`/`NODE_PANELS`/`NODE_VERBS`) or is ask-blocked with its reason filed. What
remains of the second stack is not blocks but the **3 engine specials (6 sites)**, filed
as design calls in BACKLOG **§VM-01-G-FU-f2**, measured live this slice:
- **TLS `isFinal`** — the predicate `(node|waypointNode)==='TLS' && level>=20 && shards>=7`
  swaps `storyPreBattle` for `storyPreFinalBattle`, duplicated at THREE sites (encounter
  card + two quest-list Fight buttons). Ask: a node field (`finalBattle:{minLevel,minShards}`)
  vs stay. The duplication is the drift risk.
- **INN sleep pricing** — `freeBookingUnlocked` (written at `innmotherKindness >= 5`,
  completing `quest_inn_06`) zeroes `node.sleepCost` at three sites in the sleep flow, all
  guarded `node.code === 'INN'`. Ask: a node field (a cost-waiver flag name) vs stay.
- **Patrol ordered-visit** — three arrival-path lines write `patrolBA → patrolIN →
  patrolRouteComplete` in enforced LHR→TLL→MHQ order while `quest_city_watch_patrol` is
  active. The gate grammar has no ordered-visit leaf. Ask: a grammar leaf vs a 3-quest
  chain re-expression vs stay.

**Ship hash:** recorded in the docs follow-up (2026-08-05).
