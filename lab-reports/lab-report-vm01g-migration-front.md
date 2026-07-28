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
(stop the `:1367` server) applies to every inline-JS edit. Baseline reds J14/J15 + TGS/SPB expected
unchanged throughout.

## 7. Open knob for the user (the ASK) — ANSWERED, design LOCKED 2026-07-28

1. **Lock Option C (layered) vs all-bits vs all-render-fns?** → **Option C — layered** (user
   selected via Ask). NODE_PANELS for A/B, NODE_HOOKS for E, C/D migrate into the VM per-arc.
2. **Slice order G1→G2→G3→G4 confirmed?** → **Confirmed** (G1 first = biggest win, lowest risk).
3. **G4 scope veto:** → **OK in principle, but G4 gets its own child design pass** (child lab
   report before implementation, as §5 already flags). G1–G3 proceed regardless.
