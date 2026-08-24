<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Drop Rate Calibration, Health Economy, and the Rest Architecture in *The Shattered Codex*

**CodexOfConquest v3 — Laboratory Report**
**Classification:** Game Balance · Economy Design · Rest Mechanics
**Written:** 2026-05-21 · **Verified against HEAD:** 2026-08-11 (§DOC-02j)
**Status:** Design specification — **verified, corrected, and re-scored**

---

## Abstract

This report specified three coupled systems: a stat-derived kill reward
(`reward = floor(0.1 × AC × maxHP)`) driving XP, healing and gold from one product; a
d20 loot table as a per-kill healing floor; and a Layer-13 rest architecture (short-rest
allowance, Necklace of Knowledge, Boy Scouts Camping Award) that its own Appendix A
declared **unimplemented**. Re-measured 82 days later: **the reward formula shipped
verbatim, the rest architecture shipped in full, and the loot table shipped as a
different structure.** The report's Appendix A is now the stalest thing in it — six of
its seven "📋 Planned" rows are live code. The measured error is concentrated in the
report's **illustrative** passages: of five worked monster examples, **two name monsters
that have never existed** and two carry wrong stats, while the transcribed data
(sell values, potion heals, bead record shape) is exact.

---

## I. Method

Instruments applied (§DOC-02 house method): batch `grep -c` census before reading the
prose; `git log -S` on every dead symbol to separate **RETIRED** (shipped, later removed)
from **NOT SHIPPED** (never existed); archive adjudication at `32c10c5` (2026-05-24,
earliest surviving build) for every claim about the past; **the delta table run both
ways** — HEAD checked for a specified behaviour before any row is marked NOT SHIPPED;
and a home-doc cross-check against `docs/mechanics/mechanics-combat.md` and
`mechanics-economy.md`.

A claim that did not ship is marked **NOT SHIPPED** and **kept**. Lab reports are
HISTORY: nothing is silently deleted.

---

## II. Census

| Class | Resolves at HEAD | Note |
|---|---|---|
| Named state fields | 3 / 4 | `hearthHome` RETIRED (§CELL-13) |
| Named functions / structures | 4 / 6 | `LOOT_TABLE` declared but unread; `shortRestHealAmt` never existed |
| Monster statlines (§II-A table) | 1 / 5 exact | 2 never existed, 2 wrong stats |
| Loot-table sell values | 4 / 4 exact | 25 · 75 · 200 · 500 |
| Potion heal values | 4 / 4 exact | 10 · 25 · 50 · 100 |
| Bead record shape (§III-D-1) | byte-exact | `{ name, icon, node, type:'knowledge' }` |
| Appendix A "📋 Planned" rows | **6 of 7 shipped** | the inverse of its own status |

**Overall: 21 of 30 measurable claims hold (70%).** Every failure is in a passage the
author **composed**; every passage the author could **copy** is exact.

---

## III. As-Built Inventory

**Kill reward** — `_storyBattleVictory`, one block:
`const reward` is `Math.floor(...)` over `S.opp.maxHp || 10) * 0.1@25310`;
`// heal stays at base@25311`; `const goldDrop = Math.floor(reward * partyMult)@25312`.
XP is `S.enemy.ac` × `S.opp.maxHp` × `partyMult`, rounded, one line above.

**Loot** — `const _D100_TABLE =@24517` (7 weighted rows, total 100),
`function _rollD100Loot@24534`, `const POTION_TIERS = {@24307`.
`const LOOT_TABLE =@24442` — the 20-entry d20 array this report documents — is still
declared and has **no reader**.

**Rest (Layer 13)** — `function storyShortRest@25818`, `const base  = Math.floor(S_story.hpMax * 0.25)@25839`,
`const heal  = isInn ? base : base * 2@25840`, `if (_lv >= 2) S_story.surgeCharges@25845`,
`Boy Scouts Award — doubled!@25859`.
**Necklace** — `function _knowledgeIcon@25789`, `function _maybeAddKnowledgeBead@25809`,
`S_story.knowledge.push({ name, icon@25815`, defaults `shortRests: 3, knowledge: []@23076`,
render `makeSection('🔮 Necklace of Knowledge')@31232`.
**Long rest** — `const _rollCount = _isFirstSleep ? 2 : 1@36237`,
`_healTotal = Math.max(_healTotal@36245`, `S_story.day = Math.min(49, S_story.day + 1)@36252`,
`S_story.shortRests = 3@36288`, `Boyscout Night! Double rolls@36299`.
**Gate leaf** — `if (g.restedAtMin)@22075`, consumed by exactly one quest:
`quest_d0206_a3: { id:@21791`, `restedAtMin:{ SZG:1 }@21794`.

---

## IV. Spec → Shipped Delta Table

| # | Report claim | HEAD | Verdict |
|---|---|---|---|
| 1 | `XP = AC × maxHP` | same, `× partyMult`, rounded | ✅ + party term |
| 2 | `reward = floor(0.1 × AC × maxHP)` | identical | ✅ **verbatim** |
| 3 | `healAmt = reward` | identical | ✅ **verbatim** |
| 4 | `goldDrop = reward` | `floor(reward × partyMult)` | ⚠️ party term (§MESH-01f) |
| 5 | Heal scales with difficulty without limit | capped `min(hpMax, …)` | ❌ **saturates — see F2** |
| 6 | d20 `LOOT_TABLE`, 4 potion rows | array exists, **0 readers**; live roll is `_D100_TABLE` | ❌ **documents dead code** |
| 7 | Loot sell values 25/75/200/500 | identical | ✅ **verbatim** |
| 8 | Potion heals 10/25/50/100 | identical | ✅ **verbatim** |
| 9 | Expected potion heal **28.75 HP/kill** | **21.0 HP** live; 27.75 from its own table | ❌ **overstated 37%** |
| 10 | Minor Potion costs 50 gp to buy, sells 25 | identical | ✅ **verbatim** |
| 11 | `MONSTER_DROPS` trophy layer → vendor gold | live | ✅ |
| 12 | Goblin Cutpurse AC 11 HP 7 | **0 commits ever** | ❌ **never existed** |
| 13 | Orc Warlord AC 16 HP 93 | **0 commits ever** | ❌ **never existed** |
| 14 | Wererat AC 13 HP 33 | `ac:12, hp:33` — also 12 at archive | ❌ **wrong when written** |
| 15 | Vampire Spawn AC 15 HP 82 | identical | ✅ **verbatim** |
| 16 | Ancient Dragon AC 22 HP 367 | `hp:546` — also 546 at archive | ❌ **wrong when written** |
| 17 | 3 short rests/day, reset on inn sleep | identical | ✅ |
| 18 | Short rest = flat % of `hpMax` | `floor(hpMax × 0.25)` | ✅ |
| 19 | …"scaled by CON modifier or level proxy" | flat, **no CON term** | ❌ NOT SHIPPED |
| 20 | `shortRestHealAmt` field | **0 commits ever** | ❌ never existed |
| 21 | Boy Scouts: 2× heal at non-inn nodes | identical | ✅ **verbatim** |
| 22 | Award message *"Roughing it…"* | **0 commits ever** | ❌ NOT SHIPPED |
| 23 | Award is "display-only at the mechanical level" | it is mechanical (`base * 2`) | ❌ self-contradictory |
| 24 | Inn rest (DGQR) = **full HP** | `d10 + CON` rolls, floor 50% `hpMax` | ❌ **NOT SHIPPED — see F3** |
| 25 | Inn sleep advances calendar 1 day | identical, clamped to 49 | ✅ |
| 26 | Inn sleep sets Hearth Home | `hearthHome` **RETIRED** (§CELL-13) | ❌ retired |
| 27 | Necklace bead `{ name, icon, node, type }` | identical | ✅ **byte-exact** |
| 28 | Beads stored in `S_story.inventory` | own top-level `S_story.knowledge` | ⚠️ relocated |
| 29 | One bead per unique rest location, no dupes | identical | ✅ |
| 30 | Beads display-only, not usable/sellable | identical | ✅ |
| 31 | Six named example beads | all **0 commits ever**; names derived from `node.label` | ❌ never existed |
| 32 | Knowledge section in inventory overlay | live | ✅ |
| 33 | Quest-boosted encounters, 6× weight | `_stalkedMonsterPick` deleted | ❌ **RETIRED** (§TIMELESS-01) |
| 34 | Checkpoint respawn at **½ HP** | `hp = 1` — also 1 at archive | ❌ **wrong when written** |
| 35 | 42-node world | **416** nodes | ❌ stale (§AUDIT-03u) |
| 36 | 8 inn nodes | **38** `sleep:true` nodes | ❌ stale |
| 37 | 49-day clock, 7 Codex Shards | identical | ✅ |

---

## V. Findings

### F1 — The Appendix A inversion

Appendix A lists seven Layer-13 mechanics as *"described in this report but not yet
implemented."* **Six shipped and the seventh shipped in altered form.** The whole layer
exists under `LAYER 13: Short Rests & Necklace of Knowledge@25786`, and the specified
bead record shipped **byte-exact** to the field list in §III-D-1.

This is the first report in the program whose **own status block** is its stalest
section — and the cleanest argument for the two-way delta rule: read against HEAD alone,
every one of these rows reads as a live gap.

### F2 — The self-funding thesis holds on two axes of three

§II-A's central claim — *"XP, HP healed, and gold earned are all proportional to the
same enemy stat product… no tradeoff between challenging fight and good reward"* — is
true for XP and gold and **false for healing**, because the heal is clamped:
`S_story.hp = Math.min(S_story.hpMax, …)`.

`hpMax` starts at `10 + CON mod` and grows by `d10 + CON mod` per level, so a level-20
character sits near 155 HP. The heal axis therefore **saturates** wherever
`0.1 × AC × maxHP ≥ hpMax` — at level 1 (`hpMax` ≈ 12) that is any monster with
`AC × HP ≥ 120`, i.e. nearly the whole pool. **Four of the report's own five example rows
are simply "full heal" at level 1**, and §II-A's *"the dragon fight… also heals you for
807 HP"* can never occur at any level.

A heal capped at maximum HP is correct behaviour, so this corrects the report's rhetoric,
not the engine: **it treats a saturating axis as a linear one and builds its anti-grind
argument on it.**

### F3 — The rest architecture shipped inverted, and promises full HP in two strings

§III-B explicitly sets aside the model: *"Rather than Hit Die rolls, short rests
restore a flat HP amount."* HEAD does exactly that — **and ships Hit Die rolls on the
long rest instead**: `2 × d10 + CON` on a first visit, `1 × d10 + CON` on a revisit,
floored at 50% `hpMax`. The specified `S_story.hp = S_story.hpMax` never shipped.

The consequence is player-facing. The sleep overlay states
`full HP recovery@35741` and `heal to full & advance a day@35740` — **a promise the code
does not keep.** This is the §AUDIT-03v/w/y(b) class (a player-facing string naming a
mechanical effect with nothing behind it), and the **sixth instance in six increments**,
confirming §DOC-02h's finding that the class is not confined to gold. → **§AUDIT-03v/w
cluster**

### F4 — "Boy Scouts" names two different mechanics with opposite rationales

The award shipped **twice**:

- **Short rest** — `Boy Scouts Award — doubled!@25859`, fired when `!isInn`. This is the
  spec's rationale exactly: sleeping rough is harder, so the game doubles the heal.
- **Long rest** — `Boyscout Night! Double rolls@36299`, fired when `_isFirstSleep`. This
  is a **first-visit** bonus that fires **at an inn** — inverting the spec's own framing
  (*"a ranger sleeps better under stars than in a tavern"*).

One name, two mechanics, opposite meanings, two spellings (`Boy Scouts` / `Boyscout`),
and no doc distinguishes them. The report's own name for it — *"Boy Scouts Camping
Award"* — has **0 commits ever**. → **§AUDIT-03aa**

### F5 — The short rest is implemented twice, and the copies have already diverged

`storyShortRest@25818` is the canonical Layer-13 path. A second, independent copy lives
in the post-battle return row at `const _rests = () => S_story.shortRests@7133`, with
`const base = Math.floor(S_story.hpMax * 0.25)@7145` and
`const heal = isInn ? base : base * 2@7146` — the heal math byte-identical.

Everything else diverges. The battle-return copy spends the same allowance but does
**not**:

- grant the Necklace bead (`_maybeAddKnowledgeBead` uncalled) — **so resting here builds no necklace**;
- set `shortRestedAtNodes`, so no Necklace Token is earned **and no `restedAtMin` gate credit accrues** —
  `quest_d0206_a3` (`restedAtMin:{ SZG:1 }@21794`) cannot be opened by this path;
- restore Action Surge charges (`if (_lv >= 2) S_story.surgeCharges@25845` has no twin);
- print the Boy Scouts message, **though it applies the 2× multiplier anyway**.

Two copies of one formula, silently disagreeing on four consequences. → **§DX-02t**

### F6 — §II-B documents a table no surviving build has ever read

`const LOOT_TABLE =@24442` is a 20-entry d20 array, exactly as described, and the
transcription is near-exact: **all four sell values (25/75/200/500) and three of four
slot counts (5 Healing, 3 Greater, 2 Superior) are correct.** The single error is an
**edit** — the array's 2 Spell Scroll slots are dropped and folded into Minor Healing
Potion (8 → 10), which is precisely the 1.0 HP gap between the report's stated
**28.75 HP** and the **27.75 HP** its own source table yields.

But the array has **one occurrence in the file — its own declaration — and had exactly
one at `32c10c5` as well.** No surviving build has ever contained a reader. Live rolls go
through `_D100_TABLE` (potion weights 35/18/14/6 of 100), whose expected potion heal is
**21.0 HP per kill** — 27% below the report's figure, with **27% of rolls returning no
potion at all**. The roll adds `_luckMod()` and the potion rows sit at the low end of the
table, so **higher Luck shifts the roll away from healing** toward scroll/flashbang/gold:
the report's "floor" shrinks as Luck rises.

Two doc-side defects fall out. Both home docs state the array is gone —
`mechanics-economy.md:253` (*"(removed) … definition now a comment stub"*) and
`mechanics-combat.md:193` — **while HEAD still declares it in full**; and its own FC05
pointer comment claims it is *"used by `_rollD100Loot()`"*, which reads `_D100_TABLE`.
Three sources, three different claims. → **§DX-02n (f)**

### F7 — The illustration/transcription gradient, sharpened

The transcription/narration gradient holds a fifth consecutive time, but this report
refines it. The failing passage is a **table** — §II-A's five worked examples — the form
the rule predicts should be *safe*. Every value in it is invented or misremembered, while
§II-B's table, §III-D-1's record shape and the formula appendix are exact.

**The predictor is not table-versus-trace; it is whether the passage is a COPY of a
source or an ILLUSTRATION composed to make a point.** §II-A's monsters were chosen to
show a difficulty gradient, so they were written from memory: two invented outright, two
with stats bent toward the curve being argued for. **A table composed to persuade fails
exactly like a reconstructed trace.**

---

## VI. Appendix A Resolved

Scored in delta rows 17–32: **six of seven shipped.** Fully — the 3/day counter, the flat
short-rest heal, the 2× off-inn award, the Necklace, bead acquisition on both rest paths,
and the inventory section. Partially — inn sleep, whose short-rest reset shipped and whose
**full-HP restoration did not** (F3). Dropped on the way: the CON scaling, the
`shortRestHealAmt` field, the *"Roughing it"* message and all six example bead names.
The report was never updated, so it has read as an open specification for 82 days.

---

## VII. Defects Filed

| Row | Premise | Design call |
|---|---|---|
| **§DX-02t** | Short rest implemented twice; the battle-return copy withholds bead, token, `restedAtMin` credit and surge refresh (F5) | No |
| **§AUDIT-03aa** | "Boy Scouts" names two mechanics with opposite rationales and two spellings (F4) | Small (which keeps the name) |
| **§DX-02n (f)** | `LOOT_TABLE` still declared with 0 readers; both home docs say it was removed; its pointer names a false consumer (F6) | No |
| **§AUDIT-03v/w** | Sleep overlay promises *"full HP recovery"* / *"heal to full"* against a dice heal — 6th instance, not gold (F3) | With the cluster |

Already covered, noted not filed: `Math.random()` in the sleep and level-up HP rolls
(§DX-02m); *"42-node"* player-facing strings (§AUDIT-03u); the inert dagger/mainweapon
branches of `_rollD100Loot` (documented at `mechanics-economy.md:341` as the §FC06 nerf).

---

## Appendix A — Formula Reference (corrected)

| Variable | Report | HEAD |
|---|---|---|
| XP per kill | `AC × maxHP` | `round(AC × maxHP × partyMult)` |
| HP healed per kill | `floor(0.1 × AC × maxHP)` | identical, then clamped to `hpMax` |
| Gold per kill | `floor(0.1 × AC × maxHP)` | `floor(reward × partyMult)` |
| Loot roll | `d20 → LOOT_TABLE[0..19]` | `d100 + luck → _D100_TABLE` |
| Expected potion heal/kill | `28.75 HP` | **21.0 HP** |
| Short rest heal | TBD — % of `hpMax` | `floor(hpMax × 0.25)`, ×2 off-inn |
| Short rests per day | 3 | 3 |
| Long rest heal | full `hpMax` | `n × (d10 + CON)`, floor 50% `hpMax` |
| Checkpoint respawn HP | ½ `hpMax` | **1** |
| Inn count · world size | 8 · 42 nodes | 38 · 416 nodes |

---

## Appendix B — Worked Examples, Re-measured

| Enemy | Report AC/HP | Actual AC/HP | Actual XP | Actual reward |
|---|---|---|---|---|
| Goblin Cutpurse | 11 / 7 | **never existed** | — | — |
| Wererat | 13 / 33 | 12 / 33 | 396 | 39 |
| Orc Warlord | 16 / 93 | **never existed** | — | — |
| Vampire Spawn | 15 / 82 | 15 / 82 ✅ | 1,230 | 123 |
| Ancient Dragon | 22 / 367 | 22 / **546** | 12,012 | 1,201 |

§II-D's median-enemy analysis follows: a Wererat yields **+39 HP / +39 gp** (not 42) and
**21.0 HP** of deferred potion (not 28.75) — about **60 HP** of total recovery, not 70.
Its one exact sub-claim survives: 39 gp still buys ~0.8 Minor Healing Potions at the
live 50 gp price.

---

*Report written 2026-05-21 · verified against `play.html` 2026-08-11 (§DOC-02j)*
*Design intent preserved verbatim; every measured claim re-scored against the live file.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
