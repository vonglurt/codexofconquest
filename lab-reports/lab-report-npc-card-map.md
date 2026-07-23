<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — The Derivable NPC Card Map (§NPC-01, promotes §POT-R2)

> **Status:** ⚠️ PLANNED — spec only, **no HTML edited**. This report **locks the data shapes** before any engine change, per the Lab Report Policy (CONTRIBUTING.md). Promotes `potential.md` seed **§POT-R2** ("193 of 213 NPCs have a full four-tier relationship arc that no node can render").
>
> **Measured:** 2026-07-23 against the **live** `roll2hit-v3.html` — `ENGINE_VER = 'r2h-3.104.0'`, **37,812 lines**. Every count and line anchor below was greased from the file this pass, not recalled. `43bd09c` (potential.md's snapshot) has drifted: it claimed 401 nodes / "20 of 213 reachable" / a flat 14-key literal — all three are now stale (see §1). **Re-grep every anchor before editing; they drift.**

---

## 0. One-paragraph thesis

`_renderNpcCard` (`23317`) is the **only** NPC-card renderer, and its node→NPC list, `birkaNpcs` (`32097`), is a hand-maintained literal covering **14 nodes**. Meanwhile the *content* it would render is already authored at scale: **204 `BIRKA_NPC_PROFILES` entries** (`22386`), each carrying its own `node:` field, and **213 `NPC_DIALOGUES` entries** (`10273`) with the four favor tiers + `meta.worldTruth` + `meta.enemy`. The NPC→node mapping is therefore **not a thing to derive from `QUEST_DB`** (potential.md's proposed source) — it is **already declared, redundantly, on every profile's `.node`**, and all **121** distinct profile node codes resolve to real `NODE_MAP` entries (**0 dead codes**). So the render map is a pure inversion query. The one genuine *engine* change is that `_renderNpcCard` crashes on a **lean** profile (no static-greeting object) — and ~194 of the 204 profiles are lean. This report locks: (1) the derived-map shape, (2) the state-gated **override layer** that must survive the migration, and (3) the lean-profile greeting fallback.

---

## 1. Measured facts (2026-07-23, r2h-3.104.0)

| Fact | Value | Anchor / method |
|---|---|---|
| `birkaNpcs` render map | **14 node codes**, dynamically built with state-gated NPC lists | `32097`–`32101` |
| `_renderNpcCard` call sites | **1** (the Birka NPC-card row) | `32107`; def `23317` |
| `BIRKA_NPC_PROFILES` entries | **205** (**204 unique** — see SF1) | `22386`; close `22670` |
| — carrying a `node:` field | **205 / 205** | grep `node:['"]…['"]` in block |
| — "rich" (carry `neutral/friendly/dearFriend` greeting objects) | **10** | `grep -cE '^    neutral:'` |
| — "lean" (`{key,name,occupation,node}` only) | **~194** | 204 − 10 |
| `NPC_DIALOGUES` entries | **213** (0 duplicate keys) | `10273`; keys diff |
| — with `meta.worldTruth` | **213** | `grep -c worldTruth:` |
| — with `meta.enemy` | **203** | `grep -c enemy:` |
| `NODE_MAP` node codes | **418** (potential.md said 401) | `8313`–`9289` |
| Distinct profile `.node` codes | **121** | inversion domain |
| Profile `.node` codes **absent from `NODE_MAP`** | **0** | `comm -23` |
| Renderable candidates (profile ∩ dialogue) | **203** | key-set intersection |
| `favor` bits across all quests | **16** | `grep -c "kind:'favor'"` |
| `_setNpcFavor` hardcoded call sites | **5** | grep |

**What this overturns in §POT-R2's framing (in the migration's favor):**
- potential.md worried the reachable *content* might be thin. It is not — the card body (`name`, `occupation`, four tiers, `worldTruth`, `enemy`) is authored for **203** NPCs. The bottleneck is **purely the render map** plus **one render-function crash**.
- The proposed derivation source (`QUEST_DB.activateNode`, per §PLAY-01-G) is **unnecessary**: `BIRKA_NPC_PROFILES[key].node` is a direct, already-authored NPC→node field, and unlike the old hardcoded map (`CI/IN/TV/BA/CY` dead codes, the §PLAY-01-G bug), **every** derived code resolves. Inverting profiles is strictly safer than deriving from quests.

---

## 2. The three name/node carriers (the shape trap)

There are **three** structures that each partially describe "which NPC, where, and how they greet you." Any migration must reconcile them:

1. **`BIRKA_NPC_PROFILES[key]`** (`22386`) — the card's identity + (for 10 NPCs) its greeting.
   - *Rich* (`yael`, `brynn`, `quill`, `pachelbel`, `crov`, `auros`, `emmer`, `gret`, `pier`, +1): `{key, name, occupation, node:'LHR', neutral:{greeting,dialogue}, friendly:{…}, dearFriend:{…}}`.
   - *Lean* (~194, e.g. `ser_bardo`): `{ key:"ser_bardo", name:"Ser Bardo Albizzi", occupation:"Guild Merchant", node:"PSAGLD" }` — **no** `neutral/friendly/dearFriend`.
2. **`NPC_DIALOGUES[key]`** (`10273`) — the four favor-tier line pools + `quote` + `meta:{name, occupation, node, worldTruth, enemy, missionBit}`. **`_getNPCDialogue` returns only `{quote, meta, fav}` — never a greeting.**
3. **`birkaNpcs`** (`32097`) — the render map itself: `{ nodeCode: [npcKey, …] }`, 14 nodes, with **state gating** baked in (see §4).

**The crash:** `_renderNpcCard` reads the greeting from carrier #1 only:
```
23339  const staticProfile = fav >= 2 ? p.dearFriend : fav >= 1 ? p.friendly : p.neutral;
23367  … + staticProfile.greeting + …
```
For a lean profile all three of `p.dearFriend/friendly/neutral` are `undefined` → `staticProfile` is `undefined` → `staticProfile.greeting` throws `TypeError`. **Rendering any lean profile today crashes the card.** This is why the map cannot simply be widened — the renderer must first learn to build a greeting from carrier #2.

---

## 3. Locked data shapes

### 3.1 The derived render map — `_deriveNpcRenderMap()`
A **pure, memoized** function inverting `BIRKA_NPC_PROFILES` on `.node`:
```
node → [ every profile key whose .node === node, in profile declaration order ]
```
- Domain: the 121 profile node codes; each guaranteed ∈ `NODE_MAP` (§1).
- Every emitted key has a profile **by construction**, so the widened set never re-introduces the `!p` early-return for its own entries.
- Computed **once** (module-load or first-use WeakMap/singleton), not per-render — `storyRender` runs hot. (Mirrors the §VM-01-F-FU lesson: an index is fine **if** its source is immutable; `BIRKA_NPC_PROFILES` is a frozen literal, so — unlike the reverted activateNode cache under runtime `QUEST_DB` injection — a build-once cache here is safe.)

### 3.2 The override layer — `NPC_RENDER_OVERRIDES` (curation must survive)
The current `birkaNpcs` is **not** a plain literal — it encodes appearance *conditions* that a naive inversion would destroy:
```
32087  if (quests['quest_cat_02'] === 'complete') _cqNpcs.push('sandy_cat');
32090  if (S_story.wmArchiveComplete)               _sqNpcs.push('benedikt_rasp');
32098  TL: S_story.tlLedgerRead ? ['vonn'] : [],
32099  VS: S_story.vsDebtSettled ? [] : ['solvak'],   // solvak DISAPPEARS after settlement
32099  GC: S_story.vsDebtProbed && !S_story.vsWeaponsFound ? ['yva'] : [],
```
Locked design: **derivation is the default; an explicit per-node override wins.** Shape:
```js
NPC_RENDER_OVERRIDES = {
  <nodeCode>: (base, S) => [...],   // add-when / remove-when / reorder; receives derived base + state
}
```
Final list = `NPC_RENDER_OVERRIDES[node] ? NPC_RENDER_OVERRIDES[node](base, S_story) : base`. The 14 legacy nodes migrate their exact current logic into this layer verbatim → **byte-identical behaviour on those nodes** (the migration's parity anchor). Everything else gets the derived base.

### 3.3 The lean-profile greeting fallback
`_renderNpcCard` gains a fallback when `staticProfile` is absent:
```
staticProfile = (fav>=2 ? p.dearFriend : fav>=1 ? p.friendly : p.neutral)
              || { greeting: <a line drawn from _getNPCDialogue's tier pool for this fav> };
```
Source of the synthesized greeting: the same tier `_getNPCDialogue` already selected (`dlg.quote` is the italic line; the greeting can reuse the pooled tier line or a neutral framing like the NPC's `meta.occupation`). **No new content authored** — it renders lines that already ship. Rich profiles keep their bespoke greeting unchanged (the `||` only fires when the object is missing).

---

## 4. Invariant compliance (the non-negotiables)

| Invariant | Status |
|---|---|
| **Free movement** (step refused only for `oob`/`sea`) | ✅ Untouched — this is **render-only**; no mover code, no quest-state consulted in a step. |
| **Mission gating ≠ movement gating** | ✅ N/A — cards are display, not gates. |
| **No jump travel** | ✅ N/A. |
| **Parity fences** (`MOVER/ROOMS/DUEL/QUEST:CORE`) | ✅ `_renderNpcCard` (`23317`), `birkaNpcs` (`32097`), `BIRKA_NPC_PROFILES` (`22386`) are **all outside** the four kernels (`9733/9804/10057`, `QUEST:CORE`). No `js/*.js` twin involved — this is inline engine JS, edited directly. |
| **Seeded RNG** | ✅ N/A — no rolls. (If a "pick a tier line" ever randomizes, it must draw `_seededNext()`, not `Math.random()`.) |
| **API-first** | ✅ N/A for the engine change (API-first governs world *data*: nodes/quests/monsters). ⚠️ **Hazard #1 applies**: this is a hand-edit of inline JS, so **stop the WBAPI server first** (a stale buffer silently reverts JS edits on the next `put/post`), and commit early. |

---

## 5. Increment plan (smallest coherent slices)

- **§NPC-01-A — Lean-profile render fallback (the keystone; unblocks everything).** Add the §3.3 greeting fallback to `_renderNpcCard`. Ship *without* widening the map yet. Verify no regression on the 14 current nodes. This is the only real engine change and it is additive (~3 lines).
- **§NPC-01-B — Derive + override.** Introduce `_deriveNpcRenderMap()` (§3.1) + `NPC_RENDER_OVERRIDES` (§3.2); migrate the 14 legacy nodes' logic into overrides; replace the `birkaNpcs` literal with `override ?? derivedBase`. **Acceptance: the 14 legacy nodes render byte-identically** (parity anchor); ~107 new nodes now render cards.
- **§NPC-01-C — `meta.enemy` at Friendly (folds in §POT-C2).** Once B lands, render `dlg.meta.enemy` at `fav>=1`, mirroring the `worldTruth` footer at `fav>=2` (`23371`). Pure additive render.
- **§NPC-01-D — favor reach (folds in §POT-P3 groundwork).** With ~203 NPCs now card-bearing, the 16-favor-bit track and `meta.worldTruth` finally have somewhere to land; a follow-up can widen favor sources. *Design call — not part of the mechanical migration.*

Increment A is independently shippable and de-risks B. Do **not** ship B before A (B without A crashes on the first lean node).

---

## 6. Verification plan

- **New check** (`scripts/check-npc-cardmap.js`, add to `check:walk`): assert (a) every key in the derived map has a `BIRKA_NPC_PROFILES` entry **and** an `NPC_DIALOGUES` entry; (b) every profile `.node` ∈ `NODE_MAP`; (c) the 14 legacy nodes' resolved NPC sets equal a golden snapshot (parity).
- **Integration test** (`tests/integration/npc-card-map.test.js`): visit a node that had **no** card pre-migration (e.g. one of the 107 newly-covered), assert a card renders and **does not throw** (guards §3.3); assert a legacy node (LHR) is unchanged.
- **Eyeball (§7½):** open the game, walk to a newly-covered node, confirm the card shows name/occupation/greeting/quote and — at Dear Friend — the `worldTruth` footer.
- **Baseline:** `npm run check:walk` (know the pre-existing reds: I1/I2 J14/J15, R2/R3 TGS/SPB, the 1 deferred §BOARD-01-VOID-GATE red). `node --check js/wbapi-server.js` does **not** cover inline `<script>` — the Playwright load does.

---

## 7. Side-findings (→ BACKLOG sub-rows, per "every tangent becomes a row")

- **SF1 — `euryclea_ithaca` is a duplicate key in `BIRKA_NPC_PROFILES`** (205 entries, 204 unique). The second declaration silently overrides the first (JS object-literal semantics). Data hygiene; fix independently of the migration.
- **SF2 — profile-less NPCs are wired into the current `birkaNpcs` but appear not to render.** `jimmy`, `sandy_cat`, `kenickie`, `isolde_voss`, `benedikt_rasp`, `rennau`, `vonn`, `solvak`, `yva`, `don_fluffissimo` have an `NPC_DIALOGUES[key]` (with `meta.name/occupation/node`) but **no `BIRKA_NPC_PROFILES` entry**, so `_renderNpcCard`'s `if (!p) return` (`23334`) early-returns for them. Either they render via a path not yet traced, or this is a latent "mapped but never rendered" gap. **Verify during §NPC-01-A**; if real, the §3.3 fallback plus a `p = BIRKA_NPC_PROFILES[key] || {name: dlg.meta.name, occupation: dlg.meta.occupation}` relaxation fixes it.
- **SF3 — `NODE_NPC_KEYS` stale comment** (`26954`): claims it is "used by `_getNPCDialogue()` routing." It is not — its only consumers are `_getNodeMapColor` (`26822`ish) and `_getFarewell`. §PLAY-01-G doc-drift class. (Already noted in potential.md §POT-R2.)

---

## 8. Open questions (resolve at implementation, not now)

1. **Greeting source for lean profiles** — reuse the pooled tier line, or a templated framing (`"<name> looks up."` + `meta.occupation`)? A/B in the eyeball pass; content-neutral either way.
2. **Multi-NPC nodes** — several of the 121 nodes will resolve to >1 NPC (e.g. HKG already has `crov`+`auros`). Order = profile declaration order; confirm the card row layout tolerates N cards.
3. **SF2 resolution** — settle whether the 10 profile-less mapped NPCs currently render before deciding whether §NPC-01-A must also relax the `!p` guard.

---

*Locked 2026-07-23 at r2h-3.104.0. © 2026 Paul Richeson — MIT License.*
