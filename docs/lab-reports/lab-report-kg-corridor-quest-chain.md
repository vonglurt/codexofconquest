<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — §KG Increment 3: The Corridor Quest Chain

### An eleven-quest honour-central on-ramp anchored to the five St. Petersburg → Moscow NPCs

**Authored** 2026-07-08 · **Shipped** `d6aeefd` · **Verified against HEAD** 2026-08-18 (§DOC-02cb)
**Class** design lock, pre-implementation. Its only commit *is* its ship commit, so all line citations were re-read at the parent build `dde78ca` as well as at HEAD; the report was never amended.
**Scope as authored** Increment 3 of 3 — eleven UQF-1.0 side quests + one reusable counter. No new nodes, monsters or terrains (Inc 2 shipped those).
**Predecessors** §KG-01 Hunt Mode + `_monsterLevel` (`8168f0e`) · §KG Inc 2 the zones (`65d65c0`, `dde78ca`).

---

## ABSTRACT

The specification was executed with unusual fidelity: 11/11 quests with the locked `npc` keys,
gates, completion shapes, XP and gold byte-for-byte as tabled; all five anchor nodes as assumed; all
six monster `AC·maxHP` products exact; the three engine edits verbatim.

It still fails as a description of a playable feature, for two independent reasons — **the counter
it introduced has no writer** (§IV), and **the XP model justifying its pacing is arithmetically
wrong, against the design** (§VI). The first blocks 19 quests across three arcs; the second lands
the band at Level 5.

The design is sound and the authoring disciplined. What was never checked is whether anything in the
engine could satisfy the completion clause the design depends on.

---

## I. INTENT — WHAT THE FEATURE IS FOR

*Restated from the original §1; it is the part still worth reading.*

Inc 2 built the corridor as a **place** — five zones, six training bots, five NPCs with one line
each. Inc 3 gives those five people something to **ask**. The playability argument:

- **A second front door.** roll2hit had one beginner ramp (Birka). A player who bounces off it has
  nowhere else to be at Level 1. The corridor is a parallel L1→~L6 band with its own voice, using
  Birka's technique transplanted east: **the arc runs alongside the main quest, never gates it.**
- **Grinding becomes a spine.** Levelling by wandering encounters is arithmetic. The same levelling
  framed as *Volkov signs your papers → Roshkova teaches you to lose → Grimka gives you a clean
  card → Iosif puts you in the chair → Lena points you at the quiet line* has a destination. **The
  reward is not the XP — the grinding already gives that. It is that five people in a
  Soviet-cyberpunk steppe know your name by the time you reach the dark station.**
- **Honour is load-bearing, not dressing.** Every job is a sanctioned bout or an honest delivery,
  never a mugging. Volkov's *"you fight who they match you against, nothing more"* is the arc's
  thesis and its lie; Roshkova's *"a cadet who cannot lose cleanly cannot win cleanly"* is **why**
  both skill checks are `retryable` — the theme is *lose cleanly*, not *lose permanently*, and the
  data shape follows the theme.
- **It hands the player off.** Lena's closing line — *"the line to Station 7 runs quiet these days —
  something out there stopped answering"* — seeds the existing SVO thread, delivering a now-capable
  character into content that already exists.
- **A Level-20 returner walks it in five minutes and is bored. That is correct.** Free-Movement is
  absolute: a `gate` defers a mission's *listing*, never a step. The band is offered, never walled.

Constraint accepted up front: compact scope — eleven quests, one mechanic, NPC favourability
explicitly deferred.

---

## II. METHOD

`git log` on the report (one commit, never amended) → line citations re-read at `d6aeefd^` → whole-
corpus census through `src/js/wbapi-core.js` (`W.load` → `questDb`/`nodeMap`/monster pool; **2,853
quests · 416 nodes · 398 monster keys** live), never a line regex → every tabled field diffed
one quest at a time → every derived figure re-derived from shipped values, never copied →
`git log -S "<symbol>" --all` with no pathspec on each symbol the census marked dead → and, for the
one claim no static read can settle, **a live acceptance test in the browser** (§IV).

---

## III. AS-BUILT INVENTORY

### A. The five anchors — all present, all resolving

Audit rule: `node.npc.toLowerCase().replace(/\s/g,'_') === q.npc`
(`src/js/wbapi-core.js:const norm = s => String(s).toLowerCase().replace(/\s/g,'_');@1072`). Hyphens
survive slugification because the replace touches whitespace only — the lock said so and was right.

| Node | Label | `node.npc` | Quest key | Role |
|------|-------|-----------|-----------|------|
| SPB | Nevsky Checkpoint | Recruiter Volkov | `recruiter_volkov` | enlistment |
| KMS | Komsomol School | Commissar-Instructor Roshkova | `commissar-instructor_roshkova` | the drill |
| ZVD | Gulag Gladiator Zavod | Pit-Master Grimka | `pit-master_grimka` | honour duels |
| FBR | The Skill Fabrika | Technician Iosif | `technician_iosif` | deliveries + capstone |
| TVR | Rzhev Transit Waystation | Quartermaster Lena | `quartermaster_lena` | resupply + Station 7 |

`SPB: { num:63991, name:"soviet_checkpoint", label:"Nevsky Checkpoint"@9390` still carries
`loot:"Sealed Recruit Manifest"`. Card battles exact:
`battle:{"label":"Honor Duel — Rusted Gladiator Bot","key":"gladiator_bot"@9394` and the FBR twin on
`trainer_bot_prime`.

### B. The chain — 11/11 shipped to the lock

Head: `quest_kg_01: { id:'quest_kg_01', type:'side', schema:'UQF-1.0'@13569`.

| # | id · giver | Completion | Gate | XP/gold → flag or item |
|---|-----------|-----------|------|------------------------|
| 1 | `kg_01` SPB Volkov | `countMin monsterKills.sparring_droid ≥3` | `{}` | 120/30 → `kgEnlisted` |
| 2 | `kg_02` SPB Volkov | `itemsAll [Sealed Recruit Manifest] @KMS` | `kgEnlisted` | 150/0 → `kgManifestDelivered` |
| 3 | `kg_03` KMS Roshkova | `countMin komsomol_cadet ≥4` | `kgManifestDelivered` | 200/40 · Red Star Pin |
| 4 | `kg_04` KMS Roshkova | WIS/Insight **DC 10** | `questsDone kg_03` | 180/0 → `kgFormsPassed` |
| 5 | `kg_05` ZVD Grimka | `countMin gladiator_bot ≥1` | `kgFormsPassed` | 250/50 → `kgFirstBout` |
| 6 | `kg_06` ZVD Grimka | `countMin gladiator_bot ≥3 ∧ zavod_sparbot ≥3` | `questsDone kg_05` | 300/60 · Clean-Card Trophy |
| 7 | `kg_07` ZVD Grimka | `itemsAll [Stripped Reactor Core] @FBR` | `questsDone kg_06` | 220/0 → `kgCoreDelivered` |
| 8 | `kg_08` FBR Iosif | `countMin fabrika_enforcer ≥3` | `kgCoreDelivered` | 250/50 · Cortex Shunt |
| 9 | `kg_09` FBR Iosif | `countMin trainer_bot_prime ≥1` | `questsDone kg_08` | 400/80 → `kgSimCleared` |
| 10 | `kg_10` TVR Lena | `itemsAll [Certified Skill-Chit] @TVR` | `kgSimCleared` | 220/40 · Field Ration `heal:20` |
| 11 | `kg_11` TVR Lena | INT/Investigation **DC 12** | `questsDone kg_10` | 500/100 → `kgCorridorCleared` |

Mix as specified: **4 cull · 3 delivery · 2 duel · 2 skill_check**. All eleven `schema:'UQF-1.0'`,
zero `_legacy_fn`. The `type` field carries `'side'` for nine and `'skill_check'` for two; the other
labels are the report's prose taxonomy, not engine values.

### C. The mechanic — three edits, all present

- **Default** — ✅ verbatim: `catKills: {}, monsterKills: {}, catKingDefeated: false,@23120`
- **Increment** — ✅ verbatim, and inert (§IV):
  `S_story.monsterKills[S.opp.key] = (S_story.monsterKills[S.opp.key] || 0) + 1;@25345`
- **HUD read** — ✅ verbatim, back-compat preserved:
  `const k = S_story[q.killCounter || 'catKills'] || {};@30759`

`catKills` is untouched behind its eight-key whitelist. The structural claim — *one generic counter,
not a per-arc clone* — is architecturally sound and remains the right call.

---

## IV. THE BLOCKING DEFECT — `S.opp.key` HAS NO WRITER

`S.opp` is declared with `adv · condition · cond · tier · hp · maxHp · dmgMod` and **no `key`**. The
combat loader assigns the monster key to the other half of the pair —
`S.enemy.key      = m.key;@8148`. Across the whole file `S.opp.key` has **four read sites and zero
write sites**, and `git log -S "catKills[S.enemy.key]" --all` returns **no commit, ever**. The guard
at `if (S.opp && S.opp.key) {@25342` has been false since the line was written.

**Live acceptance test** (Playwright, real page, no mocks): load the game, call
`loadWorldMonster(MONSTER_POOL.sparring_droid)`, zero both counters, run `_storyBattleVictory()`.

```
S.enemy.key = "sparring_droid"        S.opp.key = undefined
S_story.monsterKills = {}             S_story.catKills = {}
```

A full battle victory increments nothing.

**Blast radius.** Both arc heads (`quest_kg_01`, `quest_cat_01`) gate on `{}` and both are
uncompletable, so each chain severs at its first link. `frCatKillCount` and the Vincenzo's Net grant
sit under the same guard, taking §GR's payoff with them.

| Arc | Counter-gated | Transitively blocked |
|-----|--------------|---------------------|
| §KG corridor | 6 | **11** — the whole chain |
| Ally Cat / Layer 44 | 5 | **7** — the whole arc |
| §GR La Riva | 1 | **1** — `quest_la_riva_02`, the payoff |
| **Total** | **12** | **19** |

**Age.** `catKills[S.opp.key]` was born in the Ally Cat arc's own commit `4090c82` (2026-05-25); the
§KG chain copied the idiom 44 days later. Neither has ever incremented in live play.

**Why no gate caught it.** `check:questgraph` registers counters as resources —
`src/scripts/check-questgraph.js:out.resources.add('count:' + c.path.split('.')[0])@253` — then
classifies every `countMin` clause *monotone-satisfiable* because a counter only goes up. True, and
irrelevant: **a counter that never moves is monotone too.** The written-by-nothing detector covers
flags, not counters.

**Why no test caught it.** `src/tests/integration/kg-quest-chain.test.js` is a good test of the wrong
half: it sets `src/tests/integration/kg-quest-chain.test.js:S_story.monsterKills = {@63` by hand, then
proves `QuestRuntime.canComplete` honours it. The reader was verified; the writer never was.

**The fix is one identifier, four times:** `S.opp.key` → `S.enemy.key`. Filed as **§DX-02cy**.

> The corridor was authored so five people would know your name by the end of it. As shipped,
> Volkov never signs the papers, because the droids you beat were never counted.

---

## V. SPEC → SHIPPED DELTA TABLE

| # | Specified | Shipped | Verdict |
|---|-----------|---------|---------|
| 1 | 11 quests: ids, npc keys, activateNodes, gates, completion shapes | identical 11/11 | ✅ exact |
| 2 | XP + gold per quest (11 pairs) | identical 11/11 | ✅ exact |
| 3 | 7 flags `kgEnlisted`…`kgCorridorCleared` | all 7 | ✅ exact |
| 4 | 5 nodes: labels, NPC names, SPB `loot` | all 5 | ✅ exact |
| 5 | Card battles `{gladiator_bot,1}` / `{trainer_bot_prime,1}` | identical | ✅ exact |
| 6 | 5 representative dispositions | verbatim, minus emphasis marks; contractions expanded (*"didn't break"*→*"did not break"*) | ✅ substantive match |
| 7 | Six item grants incl. Field Ration as heal consumable | all six as `itemChain grant`; Field Ration `heal:20` | ✅ exact |
| 8 | Bout Token (kg_05) · Prime Core (kg_09) tabled as **items** | shipped as `mission_bit` **labels** | ⚠ form differs — kg_01's papers were correctly marked mission_bit; these two were not |
| 9 | skill_check `bits` with `onPass[…]` / `onFail[…]` | `onPass` populated, **`onFail:[]` on both** | ⚠ narrowed — a failed check is silent |
| 10 | *"the entire mechanical footprint of Inc 3"* | ship also widened the itemChain grant allow-list with `'dmgFlat', 'heal']) {@26183`, in lockstep across `worldbuilder.html:const GRANT_RICH = ['description','readText','readableKey'@8567` and `check-itemchain.js`, and repaired a pre-existing `_gateFlagSet` crash in that harness | ⚠ **understated at ship** — 5 sites tabled, 6 engine sites + 2 support files needed |
| 11 | §6 XP model → *"≈5,697, just past L6"* | **5,301** — 199 short of 5,500 | ❌ **wrong when written** (§VI) |
| 12 | *"Gold ≈ 550 across the chain"* | **450** | ❌ wrong when written |
| 13 | *"winning a node card battle … increments the kill counter"* | nothing increments the kill counter | ❌ **NOT SHIPPED** (§IV) |
| 14 | *"retires the need for the next arc to invent its own"* | 42 days on: **6 consumers, all §KG.** No second arc adopted it — but none minted a rival either (`frCatKillCount` predates it by six weeks) | ⚠ capability real, uptake zero |
| 15 | Integration test (§8 step 9) | `kg-quest-chain.test.js`, 4 tests, real `QuestRuntime` | ✅ shipped |
| 16 | Doc sync (§8 step 8) | `quest.md` §KG 11-row table · `mechanics.md` §Kill counters · `world.md` corridor | ✅ shipped — **but `mechanics.md` states *"Every battle win increments…"***, so the doc now propagates §IV |
| 17 | NPC favourability, explicitly deferred | still absent | ✅ correctly deferred — a preserved non-goal, not a defect |

---

## VI. THE XP MODEL, RE-DERIVED

`0, 400, 1000, 2000, 3500, 5500, 8000, 11000, 15000, 20000,@24419` — Level 6 = **5,500**, unchanged.
Kill XP is `const xpAward = Math.round((S.enemy.ac || 10) * (S.opp.maxHp || 10)@25292` × `partyMult`,
which is 1.0 solo: the report's `AC·maxHP` metric was and is correct. All six per-monster products
are exact as tabled — sparring_droid **45** · komsomol_cadet **96** · gladiator_bot **196** ·
zavod_sparbot **130** · fabrika_enforcer **208** · trainer_bot_prime **390**. Three errors follow
anyway.

| Term | Report | Re-derived | Δ |
|------|--------|-----------|---|
| Quest-completion XP | 2,990 | **2,790** | **−200** — addition error over eleven values the report itself lists |
| Battle XP, minimum path | 2,707 | **2,511** | **−196** — assumed `gladiator_bot ×4` (kg_05's 1 + kg_06's 3). The counter is cumulative and never resets, so kg_05's kill *counts toward* kg_06's ≥3; the true minimum is **×3** |
| **Total** | **5,697** | **5,301** | **−396 — the design lands at Level 5, 199 XP short** |
| Chain gold | ≈550 | **450** | −100 |

The report anticipated this failure and wrote the lever: *"the two capstone rewards (kg_09 400→450,
kg_11 500→600)."* That is **+150**, reaching 5,451 — **still 49 short.** The contingency was budgeted
against the wrong total, so it could not have worked either.

Two later mitigations, neither of them tuning and neither available on 2026-07-08: §XP-01 added
effort XP for misses and failed checks (`const EFFORT_XP_PCT = 0.25;@24426`, 2026-07-12) and §XP-02-A
added flat first-arrival exploration XP. A player walking the corridor today would clear Level 6 on
those grants plus incidental encounters. **The pacing survives by accident, not by design** — and it
is moot until §IV is fixed.

**Instrument.** Partition a paragraph's numbers by *how each was obtained*. Every figure a single
lookup answers — six AC·HP products, the L6 threshold, eleven reward pairs, the type mix — is exact.
**Every figure requiring the author to add a column is wrong**, and the one requiring a model of the
runtime (cumulative counters) is wrong in the direction that flatters the design.

---

## VII. INVARIANTS — SCORED

| Invariant | Outcome |
|-----------|---------|
| **Free-Movement** — a `gate` defers *listing*, never a step | ✅ holds. No §KG gate is read by the mover; the corridor is freely traversable |
| **API-first authoring** | ✅ holds — quests via the API; only the counter + HUD by hand |
| **Reuse over duplication** | ✅ holds — reused the Inc-2 card battles (no new `EPIC_BATTLES`), the `countMin` resolver, the §MATH-01 `node.loot` pattern; generalised rather than cloned the cat HUD |
| **UQF-only** | ✅ holds — 11/11 `UQF-1.0`, zero `_legacy_fn` |
| **State single-source-of-truth** | ✅ holds — `monsterKills` seeded in `_S_DEFAULTS()` |
| **No jump travel / mover / node / monster / terrain changes** | ✅ holds |
| **Compact scope** | ✅ holds — 11 quests within the 10–12 brief; favourability deferred, and still deferred |
| *(unstated)* the chain is **reachable and completable** | ❌ **fails twice.** Activation was dead until §AUDIT-03e's `code = key` backfill (2026-07-28): `node.code` was `undefined` at SPB, so `_questsByNode` returned nothing and the chain *"had never activated in live play"* (`quest.md` §Activation). Completion is dead today (§IV) |

Every invariant the report chose to state holds. The one it did not think to state failed twice,
independently. A design lock enumerates the properties its author was worried about; this author
worried about Free-Movement and scope creep, honoured both perfectly, in a chain no player has ever
finished.

---

## VIII. DEFECTS FILED

| Row | Defect |
|-----|--------|
| **§DX-02cy** 🔴 | `S.opp.key` read at 4 sites, written at 0 — **19 quests across §KG, Ally Cat and §GR La Riva unreachable**. Fix: `S.opp.key` → `S.enemy.key` ×4, then correct `mechanics.md` §Kill counters, which documents the broken behaviour as live |
| **§DX-02cz** 🟡 | `check:questgraph` treats every `countMin` clause as monotone-satisfiable and never asks whether the counter has a host writer — the class §DX-02cy hid in. Extend written-by-nothing from flags to `count:` resources |
| **§AUDIT-03bl** 🟡 | §KG XP re-tune: the minimum path is 199 XP short of the L6 promise. Design call — retune the capstones, or accept that §XP-01/§XP-02-A cover it and amend the band's stated target |
| **§DX-02da** 🟢 | `quest_kg_04`/`quest_kg_11` ship `onFail:[]` — a failed corridor skill check is silent. Roshkova's whole lesson is *"a cadet who cannot lose cleanly cannot win cleanly"*, and the arc's thematic centre has no failure text wired to it |
| **§DX-02db** 🟢 | Commit `3c86055` ("§KG Inc 3 follow-up") announces four game-file edits — road junctions J16–J21, a `monsterKills` revert, dropping SPB's stray loot — and **does not touch `roll2hit-v3.html` at all**; the file is byte-identical to `d6aeefd`. Only a milepoints *snapshot* carries the reverted text. J16–J21 do not exist at HEAD, so corridor walkability from TLL is an open question, and a `git log` search for `monsterKills` reports a revert that never happened |

---

## IX. VERDICT

**As a design document:** among the most faithfully executed locks in the corpus — eleven quests,
seven flags, five nodes, six statlines, two card battles and three engine edits, byte-exact against
the table a month later, with the locked `npc` slugs still resolving under an audit rule that has
since been *widened*. That is what a good lock buys.

**As a description of the shipped feature:** it describes something no player has reached. The
distance between those two sentences is one identifier.

**Retained lesson.** A design lock verifies **shape**; it has no instrument for **liveness**, and a
`completion` clause is exactly where the two diverge — it reads state the design document never
watches anything write.

> **For every counter, flag or item a `completion` clause reads, name its writer in the same
> increment and prove it fires — in the running game, not in a test that sets the value by hand.**

---

*Verified 2026-08-18 under §DOC-02cb. Claims that did not ship are marked NOT SHIPPED and kept — a
silently removed claim reads as one that held.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
