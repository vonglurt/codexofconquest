<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# From Arena to Prototype: The Architectural Evolution of *The Shattered Codex*

**A Study in Prompt-Driven Game Engine Development — Verified Against the Live Engine**

**Roll2Hit v3 — Post-Implementation Retrospective**
**Series:** Laboratory Reports on Narrative Engine Architecture
**Classification:** Software Architecture · Game Design · Specification Methodology
**Written:** 2026-05-21 · **Verified:** 2026-08-12 (§DOC-02af)
**Status:** VERIFIED — 36 of 52 named identifiers resolve at HEAD (69 %)

---

## Abstract

This report was written to answer a designer's question, not an engineer's: *what did thirteen layers of prompt-driven development actually build, and what did it come to believe?* It traces Roll2Hit from a four-panel combat dice tracker to *The Shattered Codex* — a solo PVE narrative adventure inside one HTML file — and argues that the project's real contribution is **specification gravity**: a family of interlocking documents exerting coherent pressure on every implementation choice. Its thesis is that the game encodes a philosophical position, the **Cooperative DM Principle**, not as flavour text but as arithmetic in the reward formula.

**The 2026-08-12 verification finds the thesis intact and the arithmetic exact.** `reward = floor(0.1 × AC × maxHP)` is byte-identical after 83 days and a 5.2× growth in file size; so are the 25 %/50 % short-rest heals, the 3-per-day allowance, the 49-day doom clock, the 8-act structure, and the `XP = AC × maxHP` product. The report's *own* measurements survive at a rate the program has rarely seen.

**Every quantitative claim it borrowed from another lab report is wrong.** That is the headline, and it is new: this is the corpus's first pure **synthesis** document, and its error profile is not its author's — it is inherited. Two figures copied from sibling reports carry those siblings' defects verbatim; a third silently *corrects* a sibling. Nothing in the prose distinguishes the two cases. **A citation carries no evidential weight.**

---

## I. Introduction — the intent, and why it matters to play

### I-A. What the project was trying to solve

Roll2Hit began as a response to friction at a real table: tracking a D&D combat encounter in real time, without a second screen or physical dice. The first build was a **tool** — HP bars, a d20 roller, a damage panel, a history log. No state machine, no persistence, no narrative.

One constraint shaped everything after: **a single `.html` file with no external dependencies**, imposed by the deployment target (open in any browser, share as a file, no server). There was nowhere to put complexity except inside the file, which meant complexity had to earn its position.

### I-B. Why each layer was a playability decision

The report's own framing is that features were never added for their own sake — each answered a friction point. Verified at HEAD, that framing holds, and it is worth restating in playability terms, because it is the argument for why any of this made the game better to *play*:

| Layer | The friction | What the player got |
|---|---|---|
| III — World engine | "Why must I retype every stat block?" | Terrain-stratified monster pools: pick a place, get an appropriate fight |
| IV — Narrative engine | "What if combat were part of a story?" | A world with acts, a journal, and a reason to be somewhere |
| IV — Doom clock | Exploration had no cost | Day 49 makes time a resource; every detour is a budget decision |
| IX — Rest system | Attrition with no recovery verb | 3 short rests/day: recovery you *spend*, not recovery you're given |
| IX — Boy Scouts Award | Sleeping rough felt punished | Double heal off-inn: the harder choice pays more |
| IX — Necklace of Knowledge | A run left no trace | A bead per place slept — the run becomes a geography |
| XII — Reward formula | Tier XP ignored the actual enemy | Heal and gold scale with `AC × maxHP`: a hard fight funds its own recovery |

The through-line is the **Cooperative DM Principle** — in a solo PVE game the system is structurally on the player's side. Difficulty is texture, not obstruction. The report's best line survives verification and is worth keeping: *"A dice tracker is an instrument. A game is an argument."*

### I-C. What this verification asked

Three questions, per the §DOC-02 method: does the named machinery still exist; are the numbers right; and — for a report that cites other reports — **are the borrowed numbers right?**

---

## II. Method

Per §DOC-02 (26 instruments; the 27th is filed here):

1. **Batch census first.** All 52 named identifiers through one `grep -c` loop before reading a line of the report.
2. **`git log -S` on every dead symbol** — the only way to separate **RETIRED** (shipped, later removed) from **NEVER SHIPPED** (0 commits ever).
3. **Archive comparison** at `32c10c5` (2026-05-24, earliest surviving build) for claims about the past.
4. **Sibling cross-check** (instrument 7), extended: for each figure this report attributes to another lab report, read that report *at its pre-verification commit* and compare all three — source, synthesis, engine.
5. **Two-way delta table** (instrument 6): HEAD is not the reference. A behaviour the report specifies and HEAD lacks is a live defect, not a stale claim.

**Instrument 8's limit, stated rather than discovered.** This report is dated **2026-05-21**; the repository's first commit is **2026-05-24**. Phases 0–II and the whole §VI timeline therefore sit outside every instrument the program has. They are not stale and not never-shipped — they are **unadjudicable**, and this report says so rather than scoring them.

---

## III. Census

**36 of 52 named identifiers resolve (69 %)** — between §DOC-02f's 48 % and §DOC-02e's 82 %.

**Live (36):** `_storyRollInit` · `_storyEnemyTurn` · `_storyBattleVictory` · `storyApplyOutcome` · `_maybeAddKnowledgeBead` · `_knowledgeIcon` · `storyShortRest` · `CONDITION_ITEMS` · `CONDITION_GOLD` · `POTION_TIERS` · `MONSTER_DROPS` · `NODE_COORDS` · `LOOT_TABLE` · `S_story.shortRests` · `S_story.knowledge` · `storyMsg` · `storyUpdateStatus` · `loadWorldMonster` · `WORLD_DB` · `MONSTER_POOL` · `NODE_MAP` · `QUEST_DB` · `S_story` · `S.opp.tier` · `S.opp.cond` · `#story-battle-overlay` · `#story-prebatt-overlay` · `#story-victory-overlay` · `#sbo-refocus-bar` · `#svo-heal` · `#svo-gold` · `#s-rests` · `.rest-chip` · `.inv-item-knowledge` · "Necklace of Knowledge" · "Boy Scouts".

**Dead — RETIRED, 12 (shipped, later removed; the report was true when written):**

| Symbol | Removed by | Tombstone |
|---|---|---|
| `HUNTING_GROUNDS` | §TIMELESS-01 | `§TIMELESS-01: HUNTING_GROUNDS removed@10392` |
| `storyStalk` · `_stalkedMonsterPick` · `_getQuestTargetKeys` | §TIMELESS-01 | `§TIMELESS-01: Stalk Helpers@38269` |
| `CORRIDOR_CELLS` · `buildCorridorMap` · `#story-corridor-overlay` | §CELL-05 / §CELL-11A / §CELL-14 | superseded by §WALK/§NAV-01 |
| `storyPortal` · `hearthHome` · `storyUseTransmort` | §CELL-13 | `storyPortal removed@28457` |
| `XP_BY_TIER` | §DX-02i | `XP_BY_TIER = { trivial:25@24403` |
| `GATE_LOCKS` | §CELL-05 (gate removal) | 2 commits, no tombstone |

**Dead — NEVER SHIPPED, 4 (0 commits in the file's entire history):** `rollAttack` · `rollDamage` · `rollEnemyAttack` · `DGQR` / *"Double Good Quality Rest"*.

**Node codes: 1 of 8.** `MT` is a legacy code that maps to a live node — **`GVA`, "The Mountain Pass — High Crest" (`num:50`)**. The node survived; only the key was renamed. `J1`–`J7` are not merely absent: `junction:true` is now **CI failure I1/I2**, so the report's junction layer is a *forbidden* design, not a retired one.

---

## IV. Spec → Shipped delta

| # | Report claim (2026-05-21) | HEAD (2026-08-12) | Verdict |
|---|---|---|---|
| 1 | `reward = floor(0.1 × AC × maxHP)` | `Math.floor((S.enemy.ac@25309`, identical | ✅ **exact, 83 days** |
| 2 | `XP = AC × maxHP` | `(S.enemy.ac\|\|10) * (S.opp.maxHp\|\|10)`; `XP_BY_TIER` deleted as never-read | ✅ exact |
| 3 | `healAmt = reward` | `healAmt = reward` | ✅ exact |
| 4 | "HP recovered = gold looted, **always equal**" | `reward * partyMult@25311` — gold only | ❌ **half-retired** (Finding 3) |
| 5 | Short rest = `floor(hpMax × 0.25)` | `Math.floor(S_story.hpMax * 0.25)@25838` | ✅ exact |
| 6 | Off-inn = `× 2` | `Boy Scouts Award — doubled!@25858` | ✅ exact, message included |
| 7 | 3 short rests/day, reset at inn | `shortRests: 3`, `restEl.textContent = S_story.shortRests@36112` | ✅ exact |
| 8 | Short rests are **free** (no gold, no day) | `+1h` each; ≥24h awake ⇒ **disadvantage** | ❌ **invariant reversed** (Finding 4) |
| 9 | Inn message *"Double Good Quality Rest"* | 0 hits, **0 commits ever** | ❌ NOT SHIPPED |
| 10 | `LOOT_TABLE` = d20, 50/25/15/10 | d20, **40/10/25/15/10** — 2 Spell Scroll rows dropped | ❌ inherited (Finding 1) |
| 11 | Expected potion heal **28.75 HP/kill** | **21.0 HP** live (`_D100_TABLE` is canonical; `LOOT_TABLE` has 0 readers) | ❌ inherited, +37 % |
| 12 | `encounterChance = min(0.9, 0.1 + activeQuestCount × 0.05)` | never shipped in that form | ❌ inherited (Finding 1) |
| 13 | Stalk quest boost `6×` | `BOOST = 6` shipped (since retired) — **and the cited source says `3`** | ✅ **corrects its own source** |
| 14 | Necklace beads: display-only, no cost, no limit | `sell:0`, no carry cap, purely additive | ✅ **invariant holds** |
| 15 | Bead record `{name, icon, node, type:'knowledge'}` | `function _maybeAddKnowledgeBead@25808`, byte-exact | ✅ exact |
| 16 | `S_story.knowledge` = the bead array | 14 of 15 writers push a **bare string** | ❌ **§DX-02aq** (Finding 2) |
| 17 | Goblin AC 11 / HP 7 → reward 7 | `ac:15, hp:7` at HEAD **and archive** → 10 | ❌ wrong when written |
| 18 | Ancient Dragon AC 22 / HP 367 → reward 807 | `ac:22, hp:546` at HEAD **and archive** → 1,201 | ❌ wrong when written |
| 19 | 7,465 lines | **38,712** (5.51 MB) | 5.2× |
| 20 | 42 story nodes / 50 total | **416** | 8.3× |
| 21 | 329 monsters | **398** | +21 % |
| 22 | 42 terrains | **111** | 2.6× |
| 23 | "8+ quests" | **2,853** | — |
| 24 | 8 acts | **8** | ✅ unchanged |
| 25 | 49-day Void Tide clock | `Day 1/49`, `Day N of 49` | ✅ unchanged |
| 26 | 26×16 grid | 90×360 geo grid (§WALK/§NAV-01) | superseded |
| 27 | "No modules, no imports, no build system" | true at **play** time; 7 `js/*.js` twins at **author** time | ⚠️ split (Finding 6) |

---

## V. Findings

### Finding 1 — **27th instrument: a citation carries no evidential weight.**

This is the corpus's first pure **synthesis** report — it summarises three sibling lab reports rather than reading the file. Its error profile is therefore not its author's, and the pattern is exact:

- **Inherited defect.** Appendix B's `encounterChance = min(0.9, 0.1 + activeQuestCount × 0.05)` is character-for-character `lab-report-circuit-map-theory.md:378` as it stood at `ffe7720^`. §DOC-02f measured the shipped formula as `min(0.95, 0.1 + notoriety × 0.015 + activeQuestCount × 0.04)` — a whole missing term, invalidating all five rows of the source's probability table and this report's restatement of it.
- **Inherited defect.** The 28.75 HP/kill loot EV and the 50/25/15/10 distribution both come from `lab-report-drop-rates-balance-and-health.md`. §DOC-02j measured 21.0 HP live and 27.75 from that report's own table, and identified the cause: **the two Spell Scroll rows were folded into Minor** to make the distribution round. This report copies the rounded version.
- **Silent correction.** Its stalk boost is `6×`. The source it cites, `lab-report-battleground-circuit-path-quest.md`, states `const QUEST_BOOST = 3` in **two** places. §DOC-02f measured `BOOST = 6` shipped. **The synthesis is right and its source is wrong.**

Three borrowings, two wrong, one right — and **nothing in the prose distinguishes them.** Both wrong figures sit in a formal appendix table; the right one sits in running narrative. Form does not predict; provenance does not certify.

> ***A cited figure must be verified at the same cost as an uncited one. The corpus's error rate is not independent across reports — it is correlated by copying, and a synthesis document is where the correlation becomes invisible.***

This also refines instrument 12 (copy-vs-illustration): a **copy of the wrong source** is as bad as an illustration, and looks considerably more authoritative.

### Finding 2 → **§DX-02aq NEW (🟡): the Necklace of Knowledge is a minority writer into its own array.**

Layer 13's centrepiece shipped exactly as specified — `function _maybeAddKnowledgeBead@25808` writes `{ name, icon, node, type:'knowledge' }`, byte-exact to the spec.

It is now **1 of 15 writers.** The other fourteen push a **bare string** — investigation lore notes accumulated across the Warmth arc, the Relay Road, the Lake, Ardley's Laws, the Crone Bead, the Cycle-4 archive note — plus the UQF `reward` bit's `knowledge` field, which forwards whatever the quest author wrote.

The inventory renderer at `S_story.knowledge.forEach(bead@31231` has no type test:

```js
S_story.knowledge.forEach(bead => {          // @31231
  div.innerHTML = '<span class="inv-icon">' + bead.icon + '</span>'
    + '<span class="inv-name">' + bead.name + '</span>'
    + '<span class="inv-tag">memory</span>';
```

On a string, `.icon` and `.name` are `undefined`. **Every lore note renders under 🔮 Necklace of Knowledge as the literal row `undefinedundefined memory`** — one row per note, player-visible, in the panel whose entire purpose is to be a legible record.

**No gate can see it.** It is a *field-shape* contract, not a node or NPC reference: `check:noderegs`, `check:npcregs` and `check:dupkeys` are all blind to it. And both designs are documented — BACKLOG's mystery-arc row already treats `S_story.knowledge[]` as the clue store for cumulative mysteries, citing the same `.inv-item-knowledge` CSS. **Two features were designed onto one field, independently, and neither knows about the other.** This is §DX-02n's dead-consts family inverted: not a field with no readers, but **one reader serving two incompatible writer shapes**.

### Finding 3 — the self-funding invariant now holds on one leg.

Appendix B states it as an invariant: *"HP recovered = gold looted, always equal."* At HEAD:

```js
const reward   = Math.floor((S.enemy.ac || 10) * (S.opp.maxHp || 10) * 0.1);   // @25309
const healAmt  = reward;                              // heal stays at base
const goldDrop = Math.floor(reward * partyMult);      // §MESH-01f
```

`function _partyLootMult@28656` returns +10 % per ally, capped +20 %. With any ally present the two legs diverge by design — the engine comment even explains why (*"party bonus is loot, not survivability"*). The decision is defensible; what is missing is that **a stated invariant was retired and nothing recorded the retirement.** The report is the only surviving statement of the original contract.

### Finding 4 — "short rests are free" is no longer true, and what made it untrue is a combat penalty.

§IX and Theme 5 both assert it, the second as prohibition: *"Charging gold or days for short rests would mean that rest is a resource the game controls against the player. The Cooperative DM Principle prohibits this."*

`function storyShortRest@25817` now advances `hoursElapsed` and `hoursSinceSlept` by 1, and:

```js
if (S_story.battleDis > 0 || (S_story.hoursSinceSlept || 0) >= 24) {   // @25046
  adv = (adv === 'adv') ? 'normal' : 'dis';
}
```

Twenty-four hours awake imposes **disadvantage on every attack roll**, surfaced by a pre-battle warning. Three rests spend 3 h of a 24 h budget, so the magnitude is small — but the *direction* is the one the principle forbids, and rest is now a resource the game meters. **Not filed as a defect: it is a later design decision (P3 exhaustion) that traded a stated invariant without a written trade.** Recorded here because this report is the only place the original invariant is written down.

### Finding 5 — the report's first two deliverables have never existed in this repository.

`roll2hit.html` and `roll2hit-v2.html` — the Arena and the 3-column refactor, Phases I and II, the *"From Arena"* half of the title — have **0 commits in the entire git history** and are absent from disk. The first commit (`32c10c5`, 2026-05-24) is three days *after* this report and already holds **14,377 lines and 81 nodes**, roughly double the 7,465 lines / 42 nodes recorded here as *"Current State."*

This is why the three arena function names could be invented without ever being contradicted: **there was no file to check them against.** `rollAttack` / `rollDamage` / `rollEnemyAttack` have 0 commits ever; §VII's "What Stayed" argues that the original dice engine survives untouched and names three functions that never existed under those names. The engine it describes *is* there — `function roll(sides)@6417`, `function rollN@6421`, `function rollD20@6496`, `function rollInitiative@7437`, `function rollMainDamage@7566` — so the **thesis is right and every identifier supporting it is wrong.** Instrument 12 in its purest form: §VII is the report's most narrative section and its only never-shipped one.

### Finding 6 — the single-file thesis survives at play time and was retired at author time.

The shipped artifact still opens in any browser with zero dependencies: one file, 38,712 lines, 5.51 MB, no build step, no CDN. Theme 1 holds where it mattered.

But the repo now carries **seven `js/*.js` modules**, four of them **parity fences** (`MOVER:CORE`, `ROOMS:CORE`, `DUEL:CORE`, `QUEST:CORE`) — byte-identical twins of inlined regions, asserted by `scripts/check-*-parity.js` and hand re-inlined after every edit. The report's own argument produced the exception: *"there was no place to put complexity except inside the file — which meant complexity had to earn its position."* At 38,712 lines the kernel earned a testable twin, and the constraint was split rather than broken — **portability at play time, modularity at author time.**

### Finding 7 — three of four philosophical invariants still bind.

| Invariant | Status |
|---|---|
| The reward formula must be self-funding | ⚠️ heal leg holds; gold leg diverges with allies (Finding 3) |
| Short rests must be free | ❌ reversed by P3 exhaustion (Finding 4) |
| The Necklace must have no cost | ✅ `sell:0`, no carry limit, purely additive |
| Boy Scouts must **double** healing, not halve the penalty | ✅ verbatim — though §AUDIT-03aa records that the *name* now labels a second, opposite mechanic (`Boyscout Night!`, which fires **at** an inn) |

---

## VI. What survived, in playability terms

The report's own comparative table, re-measured:

| Dimension | Arena (Phase I) | Report's Prototype (2026-05-21) | HEAD (2026-08-12) |
|---|---|---|---|
| State | one `S`, ~15 fields | `S` + `S_story` | same two objects; `S_story` ~318 depth-1 fields |
| World | one encounter | 50 nodes, 8 acts, 49 days | **416 nodes**, 8 acts, 49 days |
| Monsters | manual stat entry | 329 across 42 terrains | **398 across 111** |
| Missions | — | "8+ quests" | **2,853**, all UQF-1.0 on one VM |
| Economy | none | gold, potions, trophies | same, + `cost` opcode (prices refuse at click) |
| Memory | session only | knowledge beads | beads + 14 lore-note writers (§DX-02aq) |
| Travel | — | corridors, junctions, Warp | free walk on a 90×360 grid; **no jump travel, ever** |
| Philosophy | neutral (it's a tool) | the DM is on your side | 3 of 4 invariants still enforced |

The two systems the report was proudest of took opposite paths. **The reward economy is the survivor**: the formula that made a hard fight fund its own recovery is byte-identical 83 days and 8× the world later, and it still does the playability work it was built for — a player who engages with the game as intended always has enough to continue. **The geography layer is the casualty**: corridors, junctions and Hunt/Warp are gone, and two of them are now *prohibited* (invariant #3 no jump travel; `junction:true` a CI failure). What replaced them serves the same intent better — you walk the world cell by cell rather than choosing a dialog between hunting and skipping it — but the report's §V thesis (*"the choice is the mechanic"*) describes a dialog that §DOC-02f proved was **built, styled, and never once shown**.

> *"The arena was a tool. The prototype is a position."* — the closing line, and it still audits true. The position is in the arithmetic: `floor(0.1 × AC × maxHP)`, unchanged.

---

## VII. Defects filed

| Row | Severity | Summary |
|---|---|---|
| **§DX-02aq** (NEW) | 🟡 | `S_story.knowledge` carries two incompatible shapes; 14 of 15 writers push strings; the inventory renderer reads `.icon`/`.name` with no type test, so every lore note renders as `undefinedundefined memory`. No gate can see a field-shape contract. |

**Not filed, deliberately:** Findings 3 and 4 are *design reversals*, not defects — later layers traded stated invariants knowingly. They are recorded here because this report is the only surviving written form of the original contract, and a reversal nobody wrote down is indistinguishable from a bug.

**Already open, confirmed by this pass:** §DX-02n (`LOOT_TABLE` has 0 readers — its own comment names `_rollD100Loot()`, which reads `_D100_TABLE`) · §DX-02t (the short rest is implemented twice; the post-battle copy at `const base = Math.floor(S_story.hpMax * 0.25)@7145` duplicates the heal arithmetic byte-for-byte and withholds four consequences) · §AUDIT-03aa (*"Boy Scouts"* names two opposite mechanics).

---

## Appendix A — Document inventory resolved

The report's 17-row inventory, adjudicated:

- **All five `spec-*.md` are live**, relocated to `docs/spec/` by `5e48dd7` (repo-root reorganisation).
- **`plan.md` no longer exists** — split into `CONTRIBUTING.md` + `BACKLOG.md` by the same commit. (`1367-sources/plan.md` is a different, live tracker.)
- **`lab-report-plan-cleanup-v13.md` was moved, not deleted** — it lives in `archive/`. *A missing file is not a missing document*, the filing-cabinet form of §DOC-02f's *"a missing field is not a missing feature."*
- `index.md` · `mechanics.md` · `world.md` · `story.md` · `maps.md` · `monsters.md` — all live at root.
- All three cited lab reports are live **and all three have since been verified by this program**: `circuit-map-theory` (§DOC-02f), `battleground-circuit-path-quest` (§DOC-02c), `drop-rates-balance-and-health` (§DOC-02j). Two of the three are the sources of Finding 1.

---

## Appendix B — Formula reference, corrected

| Formula | Report | HEAD | |
|---|---|---|---|
| `XP = AC × maxHP` | ✔ | `(S.enemy.ac\|\|10) * (S.opp.maxHp\|\|10)` | ✅ |
| `reward = floor(0.1 × AC × maxHP)` | ✔ | `Math.floor((S.enemy.ac@25309` | ✅ |
| `healAmt = reward` | ✔ | identical | ✅ |
| `goldDrop = reward` | ✔ | `reward * partyMult@25311` | ⚠️ diverges with allies |
| `shortRestHeal = floor(hpMax × 0.25)` | ✔ | `Math.floor(S_story.hpMax * 0.25)@25838` | ✅ |
| `shortRestHeal = floor(hpMax × 0.50)` off-inn | ✔ | `base * 2` | ✅ |
| `encounterChance = min(0.9, 0.1 + aq × 0.05)` | ✘ | never shipped in that form | ❌ inherited |
| Stalk boost `6×` | ✔ | `BOOST = 6` (retired with the mechanic) | ✅ beat its source |
| Expected potion heal `28.75 HP/kill` | ✘ | **21.0 HP** | ❌ inherited, +37 % |

---

*Report written 2026-05-21 · verified against `roll2hit-v3.html` 2026-08-12 (§DOC-02af)*
*Codebase at writing: 7,465 lines, Layers 0–13 (unverifiable — predates the repository)*
*Codebase at verification: 38,712 lines · 416 nodes · 398 monsters · 111 terrains · 2,853 quests · 8 acts*
*Philosophy: the Cooperative DM Principle — three of its four invariants still bind*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
