<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->

# Lab Report — Layer 44: The Ally Cat Arc ("Nine Lives, Capisce?")

**Authored:** 2026-05-25 (pre-implementation spec) · **Shipped:** 2026-05-25
**Layer:** 44 · **Section:** §IX · **Node:** `CDG` — The Cat Quarter
**Status:** ✅ Implemented · **Re-verified against `roll2hit-v3.html` @ `a7867e3` on 2026-08-11**

> **This is a HISTORY document** (`scripts/legacy-codes.js` classification). It records what
> was *designed* in May 2026 and what is *live* now. The maintained home docs for this arc are
> `story.md` §NODE 77 (quest-by-quest) and `world.md` §Layer 46 (node/terrain). Where this
> report and those disagree, they win.
>
> **The node shipped as `CQ` and is `CDG` today** — the §WALK/§NAV-01 geo-grid recode
> (`CQ`→`CDG`, `SL`→`BMA`, `DF`→`ZRH`, `CY`→`HKG`). Every code below is the live one unless
> marked *historical*. The `CQ_` prefix survives in three **synthetic battle codes**, which are
> not node codes and are classified as such in `check:noderegs` phase 6.

---

## 1. Abstract

A Goodfellas × Grease mob-cat faction arc reachable in Act I: one node, a ten-rung monster
hierarchy (Stray → Fluffy → Beefy → Honcho → Taz Devil → Cat-King), a seven-quest chain, and a
black-market vendor unlocked by the chain's midpoint. The design shipped essentially intact;
this revision records the **six deltas** between spec and code (§4) and the **defects the
2026-08-11 verification found** (§6), each of which is now a BACKLOG row rather than a note.

## 2. Method

Every claim below was re-measured against the live HTML by `grep`/`sed` — not carried forward
from the 2026-05-25 text, and not read off a doc table (§AUDIT-03m: *never read a node code off
a doc table*). Claims that could not be confirmed in the file are marked **NOT SHIPPED** and
retained rather than deleted, because a silently removed claim reads as a claim that held.

---

## 3. As-built inventory

### 3.1 Node — `` `CDG:{ num:77@8798` ``

| Field | Live value | vs. spec |
|---|---|---|
| `num` / `code` / `name` | `77` / `CDG` / `cat_quarter` | code recoded from `CQ` |
| `label` / `act` | `The Cat Quarter` / `1` | ✅ |
| `npc` / `loot` / `sleep` | `Jimmy Two-Tails` / `Tiny Fedora` / `false` | ✅ |
| `battle` | `{label:'Beefy Tom × 3', key:'beefy_tom', count:3}` | ✅ |
| Position | `` `CDG:{r:21,c:182}@9619` `` (90×360 geo grid) | spec's `r:4,c:17` is the retired 26×16 grid |
| Connections | **none** — `NODE_MAP` carries no `N`/`S`/`E`/`W` fields at all | spec's `W:'SL'` / `SL.E='CQ'` wiring was retired wholesale by §WALK; travel is the `ROAD_RUNS` net + `mover.js` kernel |
| `text` | rewritten post-ship (longer; the fedora/guest-register passage) | spec text is superseded |

### 3.2 MONSTER_POOL — 10 entries, `` `stray_alley_cat:  { key:'stray_alley_cat'@5395` ``

**All ten shipped with the specified statline, unchanged.**

| Key | Name | AC | HP | ATK | Damage | Tier |
|---|---|---|---|---|---|---|
| `stray_alley_cat` | Stray Alley Cat | 11 | 6 | +3 | 1d4+1 | trivial |
| `fluffy_cat` | Fluffy Cat | 12 | 9 | +4 | 1d4+2 | trivial |
| `beefy_tom` | Beefy Tom | 13 | 18 | +4 | 1d6+2 | easy |
| `fat_merchant_cat` | Fat Merchant Cat | 11 | 22 | +3 | 1d6+1 | easy |
| `honcho_cat_m` | Honcho Cat (Capo) | 14 | 32 | +5 | 1d8+3 | medium |
| `honcho_cat_f` | Boss Lady Honcho | 15 | 36 | +6 | 1d8+4 | medium |
| `corrupted_cat` | Corrupted Cat | 13 | 28 | +5 | 1d6+3 | medium |
| `taz_devil` | Taz Devil — Furball Tornado | 16 | 70 | +8 | 2d8+4 | hard |
| `fat_cat_boss` | Don Fluffissimo | 17 | 90 | +7 | 2d6+5 | hard |
| `cat_king` | The Cat-King | 19 | 160 | +10 | 3d8+6 | deadly |

### 3.3 MONSTER_DROPS — 10 entries, `` `stray_alley_cat:      { name:'Flea-Dusted Pelt'@5837` ``

All ten shipped with the specified name/icon/sell: Flea-Dusted Pelt 🐱 1 · Tuft of Fluff 🐾 2 ·
Cracked Claw 🦴 4 · Embossed Coin Pouch 💰 12 · Tiny Fedora 🎩 8 · Rhinestone Collar 💎 10 ·
Void-Singed Whisker ⚡ 7 · Furball Crown 🌀 18 · The Don's Signet Ring 💍 35 · Cat-King's Claw
Fragment 👑 50.

### 3.4 WORLD_DB terrain

- `` `cat_quarter:      { label:'The Cat Quarter'@6286` `` — 10 pool slots, `fluffy_cat` listed
  twice (intentional spawn weighting), `cat_king` **absent** (reserved for the `CQ_KING`
  encounter). Shipped exactly as specified.
- `` `alley:            { label:'Dark Alley'@6287` `` — the 7 specified keys appended
  (`stray_alley_cat`, `fluffy_cat`, `beefy_tom`, `honcho_cat_m`, `honcho_cat_f`,
  `corrupted_cat`, `taz_devil`); `fat_merchant_cat` / `fat_cat_boss` / `cat_king` correctly
  remain CDG-exclusive. The predicted pool widening for *all* alley nodes is real and stands.

### 3.5 QUEST_DB — 7 entries, `` `quest_cat_01: { id:'quest_cat_01'@13689` ``

All seven are **UQF-1.0** (migrated by §ARCH-01; authored in 2026-05 as hand-written blocks).
Gating is `gate.questsDone`, not a hand-compared `=== 'complete'` string.

| ID | Gate | Completion (live) | Reward (live) |
|---|---|---|---|
| `quest_cat_01` | *(none)* — activates on arrival at `CDG` | `catKills.stray_alley_cat ≥ 5` ∧ `catKills.fluffy_cat ≥ 3` | 200gp |
| `quest_cat_02` | `quest_cat_01` | `catKills.beefy_tom ≥ 3` ∧ hold 3× Cracked Claw | 350gp; Sandy card appears |
| `quest_cat_03` | `quest_cat_02` | `catKills.honcho_cat_m ≥ 1` ∧ `catKills.honcho_cat_f ≥ 1` | 500gp + Rhinestone Collar |
| `quest_cat_04` | `quest_cat_03` | `battles:['CQ_TAZ']` | 750gp + Furball Crown |
| `quest_cat_05` | `quest_cat_02` | `catKills.fat_merchant_cat ≥ 4` ∧ `battles:['CQ_BOSS']` | 900gp + Don's Signet Ring; Kenickie unlocks |
| `quest_cat_06` | `quest_cat_04` ∧ `quest_cat_05` | `flags:['catKingDefeated']` | 1500gp + Cat-King's Claw Fragment |
| `quest_cat_void` | `quest_cat_02` | `catKills.corrupted_cat ≥ 5` | 400gp |

Kill tracking is a dedicated counter object, `` `catKills: {}, monsterKills: {}@23120` ``, keyed
by **monster key** (not node code — see §6.3).

### 3.6 Boss encounters

Three exclusive-by-quest-state buttons, migrated from inline `storyRender` handlers to
`NODE_PANELS` by §VM-01-G4d as a **deliberately concurrent** group (`group:'cdg-boss-menu'`) —
`` `cdg-boss-taz@34383` ``, `cdg-boss-don`, `cdg-boss-king`. Each emits a `narrative` bit then a
`combat` bit carrying the synthetic code. Victory is handled at
`` `if (pb && pb.nodeCode === 'CQ_KING')@25372` `` and siblings, which write `catKingDefeated`
and open the §Layer-78 La Riva chain.

### 3.7 NPCs

- **Node auto-text:** `` `CDG: { name:'Jimmy Two-Tails'@22696` `` — Jimmy's "It ain't a monster.
  It's a SITUATION" opener, verbatim as specified.
- **`NPC_DIALOGUES` profiles:** `` `occupation:"Cat Quarter fixer"@10403` `` (`jimmy`),
  `sandy_cat`, `don_fluffissimo` — plus **`kenickie`**, promoted to a full profile later
  (Layer 75 §XL). Four, not three.
- **Card roster:** `` `const _cqNpcs = ['jimmy']@35128` `` — `sandy_cat` on `quest_cat_02`
  complete, `kenickie` on `quest_cat_05` complete. `CDG` was one of the codes repaired by
  §PLAY-01-G, when `birkaNpcs` was found keyed to pre-§WALK sublocation codes that rendered
  nowhere.
- **Tommy No-Ears DeVito** remains encounter-only (`storyMsg` beats, no profile) — as specified.
- **Profile shape is favor-tiered, not state-tiered:** `{meta, impartial[], friendly[],
  dearFriend[], quote}`. The spec's hostile/neutral/friendly/dear tone table never existed as a
  data shape; `don_fluffissimo` carries `impartial` only, which realises the spec's intent
  ("friendly not accessible — he is the antagonist") by omission.

### 3.8 State flags — `_S_DEFAULTS()`

`catKingDefeated:false` shipped as specified. Two more were added that the spec did not name:
**`catKills:{}`** (the counter the chain is built on) and **`kenickieMarketUsed:false`**.

### 3.9 Vendor — Kenickie's Black Market

Shipped Layer 75 §XL; migrated to `` `cdg-kenickie-market@34196` `` (`NODE_HOOKS`) by
§VM-01-G4d. Gated on `quest_cat_05` **complete**. Four SKUs: Sardine Pack ×3 (18gp, catch +2),
Live Shallows Minnow (28gp, catch +3, size↑), Minor Healing Potion (45gp), Healing Potion
(135gp). The "10% discount" is real but applies only to the two potions — 45 vs. `POTION_TIERS`
`minor.cost 50`, 135 vs. `healing.cost 150`; the baits are exclusive stock with no list price
to discount.

---

## 4. Design → shipped deltas

| # | Spec claim (2026-05-25) | Live | Note |
|---|---|---|---|
| 1 | Q-CAT-01 pays "200gp **+ Tiny Fedora trophy**" | 200gp only | **NOT SHIPPED.** Tiny Fedora exists as `CDG.loot` and the `honcho_cat_m` drop, never as a quest grant. |
| 2 | Q-VOID pays "400gp **+ Void-Singed Whisker ×3**" | 400gp only | **NOT SHIPPED.** Whisker is the `corrupted_cat` drop; the chain grants none. |
| 3 | Q-CAT-03 "merge mechanic — if both Honchos appear in one battle, second wave loads `taz_devil`" | absent | **NOT SHIPPED.** No merge/second-wave code exists. The Taz is a separate scripted encounter (`quest_cat_04` / `CQ_TAZ`); the merge survives only as narration. |
| 4 | Quest levels 3/3/4/4/4/5 | no `level` or `minLevel` field on any of the 7 | Design intent, **unenforced by the engine**. `world.md`'s "Levels 3–5" is likewise descriptive. |
| 5 | Vendor chip "added to CQ node's vendor array" | a `NODE_HOOKS` launcher, not a node field | The node has no vendor array; the shape landed as a hook. |
| 6 | 1 new `HUNTING_GROUNDS` entry | registry **deleted** | §TIMELESS-01 removed Hunt/Stalk; `` `// §TIMELESS-01: HUNTING_GROUNDS removed@10392` ``. |

**Post-ship migrations** (none of which the arc requested; each rewrote how it executes):
§WALK/§NAV-01 code + grid recode → §ARCH-01 UQF-1.0 quest migration → §TIMELESS-01 hunt removal
→ §PLAY-01-G NPC-card repair → §EDITOR-01-D-FU(b) `itemChain` trophies → §VM-01-G3 (the
storyRender activation stanzas retired; chain sequencing moved into `gate`, which fixed an
appended-duplicate `activateNode` bug that had made the whole chain activate at once) →
§VM-01-G4d (boss buttons → `NODE_PANELS`, Kenickie → `NODE_HOOKS`).

The spec's §9 "insertion order" and §10 "documentation updates on completion" tables are
retired: both describe a build procedure that no longer applies (steps 11–12 authored
`storyRender` stanzas that §VM-01-G3/G4d deleted, and `plan.md` was split into
CONTRIBUTING.md + BACKLOG.md on 2026-07-09).

---

## 5. Risk register — outcome

| Risk (as filed) | Outcome |
|---|---|
| "`num:77` — verify no existing node uses 77" | ❌ **REALIZED.** `MJF` (The Shale Drop, act 3) and `CDG` both carry `num:77`. See §6.1. |
| "`SL` patch must not overwrite an existing `E`" | ✅ Moot — compass connections were removed from `NODE_MAP` entirely. |
| "`alley` pool widening for all alley nodes" | ✅ Occurred as predicted and accepted. |
| "`fluffy_cat` double entry is intentional" | ✅ Still double-listed. |
| "`jimmy` key collision" | ✅ No collision; `jimmy` is unique and is the canonical profile key (`wbapi-core.js:1040` records the `jimmy_two-tails` → `jimmy` alias resolution). |

---

## 6. Defects found by this verification

Each is filed as a BACKLOG row; none is fixed here (this pass is documentation-only).

1. **`num:77` is held by two nodes** — `MJF` and `CDG`. `node.num` is display-only (three read
   sites: the HUD node number, the trail list, the travel destination line), so the collision is
   cosmetic today, but it is a duplicate identity in a field that reads like a primary key.
   Already noted in `maps.md`; now a row. → **§AUDIT-03r**
2. **Dead node codes in player-facing engine strings** — 7 occurrences the doc-side
   `check:legacycodes` gate cannot see, because it scans `*.md` only, and that
   `check:noderegs` phase 6 cannot see, because it scans comparison literals only. Five are this
   arc's (`sandy_cat` dialogue, `quest_cat_void` `desc`/`disposition`/`failText`, the `CQ_BOSS`
   victory `storyMsg`) and all say *"the DF node"* for what is now `ZRH`; two more are elsewhere
   (a `CY` quest `desc`, a `DF` tunnel `storyMsg`). → **§AUDIT-03s**
3. **`index.md` mis-describes `S_story.catKills`** as "nodeCode → kill count". It is keyed by
   **monster key** (`catKills.stray_alley_cat`), which is what all four `countMin` gates read.
   Corrected in this increment.
4. **`world.md` §Layer 46 carries stale pointers** — "HTML line 8026" (actual `8798`) and
   "QUEST_DB lines ~11799–11885" (actual `13689`–`13785`), both bare numbers of the kind §DX-01e
   retired, plus the 26×16 coordinate `R04,C17`. Corrected in this increment.

---

## 7. Anchors

`` `CDG:{ num:77@8798` `` · `` `CDG:{r:21,c:182}@9619` `` ·
`` `stray_alley_cat:  { key:'stray_alley_cat'@5395` `` ·
`` `stray_alley_cat:      { name:'Flea-Dusted Pelt'@5837` `` ·
`` `cat_quarter:      { label:'The Cat Quarter'@6286` `` ·
`` `alley:            { label:'Dark Alley'@6287` `` ·
`` `quest_cat_01: { id:'quest_cat_01'@13689` `` ·
`` `catKills: {}, monsterKills: {}@23120` `` ·
`` `CDG: { name:'Jimmy Two-Tails'@22696` `` ·
`` `occupation:"Cat Quarter fixer"@10403` `` · `` `const _cqNpcs = ['jimmy']@35128` `` ·
`` `cdg-boss-taz@34383` `` · `` `cdg-kenickie-market@34196` `` ·
`` `if (pb && pb.nodeCode === 'CQ_KING')@25372` `` ·
`` `// §TIMELESS-01: HUNTING_GROUNDS removed@10392` ``

**See also:** `story.md` §NODE 77 · `world.md` §Layer 46 · `monsters.md` (Ally Cat Arc) ·
`lab-reports/lab-report-kenickie-chronicle.md` (the market's own arc) ·
`lab-reports/lab-report-vm01g4-per-verb.md` §4 (the D3 concurrent-menu classification that moved
the three boss buttons).

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
