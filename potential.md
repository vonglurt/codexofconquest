<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# POTENTIAL — Backlog Seeds from the "40+ Solo RPG Prompts" Listicle

> **What this file is.** A source list of 44 solo-RPG prompts was read against `roll2hit-v3.html` @ `43bd09c` (`ENGINE_VER = 'r2h-3.104.0'`), one prompt at a time, and each was answered with *what the file actually does today* before any improvement was proposed. Seeds only — **nothing here is scoped work.** Promoting a seed = its own `§` entry in **[BACKLOG.md](BACKLOG.md)** (+ a `lab-reports/lab-report-*.md` locking data shapes before any HTML edit, per the Lab Report Policy in **[CONTRIBUTING.md](CONTRIBUTING.md)**).
>
> **Relation to §IDEA-01.** This is an §IDEA-01-*shaped* pass — found-text list → dedupe → per-line coverage table proving 100% coverage — but the source is **design prompts, not narrative found-text**, so the output is *engine/content capability rows here*, not quest-theme one-liners in `docs/notes/brainstorm-one-liners.md`. It is a sibling of S1–S3, not S4.
>
> **Legend:** `SHIPPED` the file already does this — do not rebuild · `DO-NOT-BUILD` a deliberate constraint; building it would damage something load-bearing · `BLOCKED` real, but gated on §VM-01 · `OPEN` real, actionable, unblocked.

## Method + evidence standard

Every count, line number, and liveness claim below was **measured from the live file**, not recalled — the repo's most expensive recurring lesson is that six arcs were planned as new work and closed as *already shipped* (`project_data01_reverted`: **grep before building**). Where a prompt is already answered, this file says so and proposes nothing.

Live counts measured this pass (`roll2hit-v3.html`, 37,271 lines / 5.3 MB):

| Structure | Live count | Note |
|---|---|---|
| `QUEST_DB` | **2,850** (2,820 UQF-1.0) | 30 non-UQF = the documented `blq_05–10` dead stubs + `quest_math_01–05` |
| `NODE_MAP` | **401** entries | 47 carry a `battle`, 53 a `loot`, 38 `sleep:true`, 71 `npc:null` |
| `MONSTER_POOL` | **398** | `EPIC_BOSS_POOL` **20** |
| `WORLD_DB` terrains | **110** | shape is `{label, icon, monsters[]}` — a terrain→encounter-pool table |
| `NPC_DIALOGUES` | **213** | each with `impartial`/`questActive`/`friendly`/`dearFriend` + `meta.worldTruth` + `meta.enemy` + `quote` |
| `skill_check` bits | **2,631** | `mission_bit` **2,448** · `reward` 156 · `_legacy_fn` 122 · `narrative` 101 · `flag_write` 45 · `favor` **16** |

## Headline finding — the listicle asks for a conversation; the engine has no `wait`

Sorted by what they actually require, **the 44 prompts collapse onto one bottleneck**. Prompts 22, 24, 25, 32, 42 and 44 — every "respond to my actions", "branching paths based on my dialogue choices", "I'll pick which ones to pursue" — need the engine to *ask the player something and wait*. It cannot:

- ~~`execBits` is a straight-line `for` loop — no branch, no suspend.~~ **✅ RETIRED by §VM-01-A/D:** `*execBits(bits, ctx)@22081` is a **generator** — it yields an `ask` envelope and is resumed by the driver. The suspend this whole section is built on lacking now ships.
- ~~`choice` has a **full contract** (requires `prompt` + ≥2 `options`) and an **empty handler** — the body is the comment `/* Phase 2: renderChoiceBlock(...) */`. `renderChoiceBlock` appears **once in the file: inside that comment.** It was never written.~~ **✅ RETIRED by §VM-01-A:** the contract stands (`required:['prompt','options']@21860`) and the handler is now the engine's **first suspending opcode** (`*choice(bit, ctx)@22154`) — it yields `{ask:'choice'}`, and only the picked option's bits apply, *after* the pick. `renderChoiceBlock` no longer occurs in the file at all. **Authors: still 0** — the capability ships, no quest uses it yet.
- Quest acceptance **has no accept step**. `storyCheckQuests` matches `activateNode`, evaluates the gate, and writes `S_story.quests[id] = 'active'`. The player is *told* (`📋 <title>`), never asked. (`lab-reports/lab-report-javascript-mud.md`.)

This is **exactly [§VM-01](BACKLOG.md#vm-01--the-quest-vm--no-word-for-wait-new-2026-07-16), already open, already the active track** — *"the VM has an opcode table and no jump instruction."* This pass adds independent confirmation from the content side and **two findings §VM-01 does not name**:

1. ~~**Four dead opcodes, not two.**~~ **→ three, re-measured 2026-08-03.** §VM-01 names `choice` (still **0** authors — but its handler is no longer empty, see above) and `item_check` (**0** authors; it writes `ctx._itemCheck`, and that identifier now occurs **exactly once in the file** — `item_check(bit, ctx)@22146` — so the write reads back *nowhere*). Still dead: **`combat`** (`combat(bit) { if (E.preBattle)@22135`) — a *working* handler, authored **0 times** (the 78 `type:"combat"` quests route through `node.battle` instead). **`unlock`** (`unlock(bit, ctx)@22147`) is **no longer dead — §BOARD-01 authored it 18 times.** That is **3 of 12 opcodes with zero authors.**
2. **The relationship engine is 91% unreachable** — see §POT-R2, the largest single content unlock in the file.

**Consequence for this file:** ~9 of 44 prompts are `BLOCKED` on **§VM-01 Inc A** (~30 lines, the keystone). They are logged below but must not be promoted independently — they would each grow a private branch mechanism, which is precisely the "new single-use term" the **Host/Script Separation Policy** forbids.

---

## Coverage table — all 44 prompts (100%)

| # | Prompt (abbrev.) | Verdict | Item |
|---|---|---|---|
| 1 | World-builder: kingdoms/cultures/politics/histories | OPEN | §POT-W1 |
| 2 | Steampunk: mechanized cities, airship pirates | DO-NOT-BUILD | §POT-W2 |
| 3 | Dark gothic horror, threats + safe havens | OPEN | §POT-W3 |
| 4 | Science-fantasy: tech + arcane magic | SHIPPED + OPEN | §POT-W4 |
| 5 | Post-apocalyptic wasteland, cataclysm, ruins | OPEN | §POT-W5 |
| 6 | Create [race/class] character | DO-NOT-BUILD + OPEN | §POT-C1 |
| 7 | Complex multi-layered villain | OPEN | §POT-C2 |
| 8 | Quirky NPC mentor / recurring ally | OPEN | §POT-C3 |
| 9 | Party of diverse adventurers | DO-NOT-BUILD + OPEN | §POT-C4 |
| 10 | Anti-hero / morally ambiguous protagonist | BLOCKED | §POT-C5 |
| 11 | Adventure hook: conspiracy / mystery / threat | OPEN | §POT-H1 |
| 12 | Epic journey across uncharted lands | OPEN | §POT-H2 |
| 13 | Mystery-driven adventure | OPEN | §POT-H3 |
| 14 | Escalating faction/nation conflict | BLOCKED | §POT-H4 |
| 15 | Locate legendary artifact + perils | SHIPPED | §POT-H5 |
| 16 | Populate wilderness w/ random encounters | SHIPPED | §POT-B1 |
| 17 | Encounter w/ stats, tactics, legendary, terrain | OPEN | §POT-B2 |
| 18 | Multi-stage boss battle, escalating stages | OPEN | §POT-B3 |
| 19 | Random encounter table per terrain + hazards | SHIPPED + OPEN | §POT-B1 / §POT-B2 |
| 20 | Skill-challenge, combat optional | SHIPPED + BLOCKED | §POT-B4 |
| 21 | Atmospheric scene, sensory detail, hooks | SHIPPED | §POT-R0 |
| 22 | Supportive GM, open-ended improvised RP | BLOCKED | §POT-R1 ⭐ |
| 23 | Play [NPC] w/ consistent voice + motivations | OPEN | §POT-R2 ⭐ |
| 24 | Tense social encounter, branching dialogue | SHIPPED (stat) + BLOCKED (branch) | §POT-R1 |
| 25 | Moral dilemma, nuanced perspectives | BLOCKED | §POT-R3 |
| 26 | Turning point → next story branches | SHIPPED | §POT-P1 |
| 27 | Factions respond to recent actions | BLOCKED | §POT-C2 / §POT-H4 |
| 28 | Area altered by [event] → new possibilities | OPEN | §POT-P2 |
| 29 | Shocking revelation / betrayal / twist | SHIPPED | §POT-P1 |
| 30 | Acquired [item/ally] → unintended consequences | OPEN | §POT-P3 |
| 31 | Frontier town: available quests / bounties | OPEN | §POT-S1 |
| 32 | Personal ambition → branches + obstacles | BLOCKED | §POT-S2 |
| 33 | Freeform: describe env, I declare actions | OPEN | §POT-S3 |
| 34 | Downtime in [city]: jobs, pastimes | OPEN | §POT-S4 |
| 35 | Randomized bounty board | OPEN | §POT-S1 |
| 36 | Encounter to practice specific mechanics | SHIPPED | §POT-M0 |
| 37 | Custom optimized character build | DO-NOT-BUILD | §POT-C1 |
| 38 | Fully randomized character | DO-NOT-BUILD | §POT-C1 |
| 39 | Stuck → creative solutions from resources | OPEN | §POT-M2 |
| 40 | Explain / clarify rules + mechanics | OPEN | §POT-M1 |
| 41 | Alternate-turn collaborative worldbuilding | SHIPPED (dev-only) | §POT-X1 |
| 42 | Premise → interconnected branching storyline | BLOCKED | §POT-X3 |
| 43 | Personal arc / inner demons | OPEN (design) | §POT-X2 |
| 44 | Narrate scene → I improvise → you adapt | BLOCKED | §POT-R1 |

**Tally (verdicts across 44 rows — 6 rows carry a compound verdict, so these sum to 50, not 44):** 11 SHIPPED · 5 DO-NOT-BUILD · 10 BLOCKED (all on §VM-01) · **24 OPEN**.

Of the 10 `BLOCKED` rows, **9 are blocked on §VM-01 Inc A** (prompts 10, 14, 20, 22, 24, 25, 27, 32, 44); the tenth (42) is blocked on **§VM-01-F**, the expression evaluator. The 6 compound rows (4, 6, 9, 19, 20, 24) are each *partly* shipped and partly not — the split is stated in the row.

---

## §POT-W — World-Building (prompts 1–5)

- [ ] **§POT-W2 — Steampunk: do not build** (prompt 2) `DO-NOT-BUILD` 🟢
  **Today:** `steampunk` 0 hits, `airship` 0. But the world **already spends an anachronism budget**: `cyberpunk_streets`, `soviet_checkpoint`, `komsomol_school`, `gladiator_zavod`, `skill_fabrika` terrains; HKG Neon Undercity; SVO Station 7; `techno_thug`/`hacker`/`corrupted_android`/`street_samurai`/`neon_golem`/`cyber_vampire`/`data_wraith`/`neural_predator`.
  **Potential:** none. §KG's design lesson is that anachronism ships **only behind a cover story** ("honor-central Soviet-cyberpunk … a Mercenary Guild Recruiter cover story"). A second, unrelated tech register with no such license would dilute the one the game has already paid for narratively. Re-open only if a cover story motivates it.

## §POT-C — Character Creation (prompts 6–10)

- [~] **§POT-C2 — 202 villains are authored, keyed to an NPC, and read by nothing** (prompts 7, 27) `RENDER SURFACE SHIPPED via §NPC-01-C` 🟡 *(was 🔴 highest content-per-line in the file)*
  **Today:** `BOSS_COMMANDER_AUROS` (`const BOSS_COMMANDER_AUROS@26070`, AC22/HP300) is the final villain. Underneath it, **202 of 213 NPCs declare `meta.enemy`** — a specific, named antagonist with stakes. Examples: *"Rival scholars in the Jalayirid court who prefer the source tradition he rejected and want his preface retracted"*; *"Road bandits on the Klausenburg mountain passes who know the Van Helsing contingency route."* ~~**Nothing reads the field.**~~ **✅ §NPC-01-C now renders `meta.enemy` as a `⚔` card footer at Friendly (fav ≥ 1), above the `✦` `worldTruth` footer at Dear Friend** — combined with §NPC-01-B's ~203-node render map, every authored enemy sketch on a card-bearing NPC now surfaces in play.
  **Potential:** ~~202 villain sketches already written and invisible. Cheapest honest surface mirrors the one that already works: render `meta.enemy` on the NPC card at Friendly (fav≥1)~~ **← done (§NPC-01-C).** The **larger** half of prompts 7/27 remains open: *factions responding to recent actions* — enemies that react to what you've done — which needs `choice`/influence (see §POT-P3 / §POT-H4). `meta.enemy` is now the visible raw material for who opposes whom.

- [ ] **§POT-C5 — The protagonist has no moral ledger** (prompt 10) `BLOCKED` 🟠
  **Today:** the PC is a blank courier — no alignment, no reputation. Meanwhile the *content* is saturated with moral ambiguity (the Nikephoros wound log and entry M.T.; Gret Orrens' stolen manuscript). `faith_folk`/`faith_reform`/`faith_orthodox` + `faction_hansa` exist as tracks, and `faith_folk >= 1` gates exactly one thing — §1367-G's capstone.
  **Potential:** the seed of a reputation system exists and serves one quest. **Blocked, and must stay blocked:** with no `choice`, a moral ledger only records what the quests did *to* you — it would measure a decision the player never made. Ships after §VM-01 Inc A, not before.

## §POT-H — Adventure Hooks & Quests (prompts 11–15)

- [ ] **§POT-H4 — Factions are named but have no state and never respond** (prompts 14, 27) `BLOCKED` 🟠
  **Today:** `faction_hansa` (8 refs), three `faith_*` tracks, and a `favorMin` gate term (3 uses). Factions are vocabulary, not actors.
  **Potential:** §PLAY-01-B established the pattern (enemies now respond per tier). Factions responding to your actions is the same idea one level up — but the prompt's *"opportunities to influence the outcome"* requires influence, i.e. `choice`. Blocked; also large. Pair with §POT-C2 (`meta.enemy` is the authored raw material for who opposes whom).

## §POT-B — Combat Encounters (prompts 16–20)

- [ ] **§POT-B4 — Skill challenges: shipped to saturation; the gap is the inverse of the prompt** (prompt 20) `SHIPPED + BLOCKED` 🟠
  **Today:** **2,484 of 2,850 quests are `skill_check`** (2,631 bits) — combat-optional problem-solving is not a gap, it is the file's dominant form.
  **Potential:** the prompt asks players to *"overcome obstacles through ability checks, clever problem-solving, or creative thinking"* — a **chain** of related checks where earlier results shape later ones. The file has 2,631 **isolated** checks. ~~because `execBits` cannot carry a result forward or branch. Blocked on §VM-01-A.~~ **✅ UNBLOCKED 2026-08-03 — §VM-01-A shipped `choice`;** the checks are still isolated because nothing has authored a chain yet, not because the engine can't. Do not author a chain by hand: `skill_check` already *"smuggles its own branch"* (`resolveSkillCheck(bit, ctx) {@22113` routes straight into `onPass`/`onFail`) and CONTRIBUTING names it **"the exception to retire, not the pattern to copy."**

## §POT-R — Roleplaying & Storytelling (prompts 21–25) — *the heart of the listicle*

- [ ] **§POT-R1 — ⭐ The keystone: the engine cannot ask a question** (prompts 22, 24, 44) `BLOCKED = §VM-01 Inc A` 🔴
  **Today:** *"Act as a supportive game master who … responds to my character's actions"* and *"branching paths based on my dialogue choices"* describe a loop ~~this engine does not have~~ **the engine now has, unused.** `choice` contract at `required:['prompt','options']@21860`; the handler is a live suspending generator (`*choice(bit, ctx)@22154`) since §VM-01-A, `renderChoiceBlock` is gone from the file, and authors are **still 0**. Note the split: the **stat** half of prompt 24 already ships — CHA/Persuasion/Deception/Intimidation checks are live (e.g. `mol001_act2`, CHA DC 13). It is only the **branch** that is missing.
  **Potential:** **§VM-01 Inc A (~30 lines) unblocks six operations and 9 of these 44 prompts.** Nothing in this section should be promoted ahead of it.

- [ ] **§POT-R3 — The best writing in the file is gated behind a d20 instead of a decision** (prompt 25) `BLOCKED` 🔴 *sharpest statement of §VM-01's cost*
  **Today:** the moral content is world-class — the surgeon's wound log and entry M.T.; *"The archive holds accurate records. It does not determine what to do with them."* But **every dilemma resolves by dice, not by decision**: you roll INT/WIS to *perceive* it, and the quest tells you what you concluded. `passText` narrates the insight; `failText` narrates missing it. The player never takes a side.
  **Potential:** `choice` would convert perception-rolls into decisions across the arcs where it matters. This is the clearest measure of §VM-01's cost: **the engine's finest content is a spectator sport.** Blocked on Inc A.

## §POT-S — Sandbox & Player-Driven (prompts 31–35)

- [ ] **§POT-S1 — Bounty board** (prompts 31, 35) `OPEN` → **merged into §POT-H1** (the dead `unlock` opcode is its engine).

- [ ] **§POT-S2 — Personal ambitions have no branches** (prompt 32) `BLOCKED` 🟡
  **Today:** `type:'craft'` = 12 quests — crafting exists as *quests*, not as a *system*. No faction joining, no fame track.
  **Potential:** *"provide potential branches to develop this storyline"* is the prompt's own word: branches. Blocked on §VM-01-A. §POT-C5's faith/faction tracks are the state it would move.

## §POT-X — Collaborative Worldbuilding (prompts 41–44)

- [ ] **§POT-X3 — Branching, interconnected storylines** (prompt 42) `BLOCKED` 🟠
  **Today:** gates express **sequence**, not **branch** — 1,618 `flags` terms and no disjunction, which is why `itemsMinAny` exists *for exactly one quest* (`quest_wm_01`).
  **Potential:** CONTRIBUTING already diagnoses this precisely: *"A term added per quest is the language asking for an expression evaluator (§VM-01-F). Before adding a gate term, check whether `{all|any|not}` nesting would say it instead."* The prompt's *"branching paths, layers of intrigue, narrative reversals"* is **§VM-01-F**, already scoped. Do not add gate terms to approximate it.

---

## Archived — Done · Promoted · Shipped-No-Build

> **What this section holds.** The rows that are *closed* as seeds — either **promoted** to a real `§` track in [BACKLOG.md](BACKLOG.md) (the seed's job is done; the work now lives + is tracked there) or verdicted **SHIPPED**, i.e. *the file already does this, do not rebuild*. Moved here 2026-07-23 so the active seed sections above show only **open / blocked** work. **They remain counted in the coverage table + tally** (this file's "100% coverage" promise is intact — every prompt still maps to an item, archived or not) and are still referenced by the highest-ratio table below.

### Promoted → a tracked `§` in BACKLOG.md

**Batch 2026-07-23 → [§POT-PROMOTE](BACKLOG.md#pot-promote--potentialmd-seed-batch--12-tracks--planned-2026-07-23) in BACKLOG.md.** The 16 OPEN + unblocked seeds below were promoted in one pass, merged where the seed itself said the work is one surface, into **12 fully-specced `§`-tracks** (Finding→Design→Increments→Invariants→Verify each) — the full elaboration now lives + is tracked in BACKLOG `§POT-PROMOTE`. Every anchor was **re-measured live 2026-07-23** at `r2h-3.104.0` (37,870 lines) during promotion; several `43bd09c` claims had drifted since §NPC-01 shipped (noted per-row). These stay counted in the coverage table + tally (100% coverage intact).

- [x] **§POT-W1 → §CODEX-01** (with §POT-S4 + §POT-M1) `OPEN → PROMOTED 2026-07-23` — a read-only **Codex** aggregating what the engine already knows (rules/glossary + gazetteer of authored `worldTruth`/node text + a "what this place offers" downtime board). The §PLAY-01 honesty class. *Drift:* the 219 `worldTruth` lines now render as the §NPC-01-C `✦` footer at Dear Friend, so "unreachable" softened — the codex is now an aggregation surface, not a fix for unread lore.
- [x] **§POT-S4 → §CODEX-01-C** `OPEN → PROMOTED 2026-07-23` — downtime verbs (fishing/vendor/rest/craft/Hunt) all ship with no hub; the codex's downtime-board pane is the "you have time; here's what's here" surface.
- [x] **§POT-M1 → §CODEX-01-A** `OPEN → PROMOTED 2026-07-23` — the game has **no rules surface at all** (`grep` for help/rules/glossary/codex = 0); the codex's Rules pane reflects the engine's own live constants (skill formula, magic tier, XP curve, loot weights). Cleanest honesty item.
- [x] **§POT-P2 → §TIDE-01** (with §POT-W5 + §POT-W4) `OPEN → PROMOTED 2026-07-23` — `node.textVariants` shipped (`85faf9b`) with a generic renderer (`textVariants:[{flag,text}] (authored via the API)@31729` / `for (const _v of (node.textVariants || []))@31732`) and ~~**exactly one consumer**~~ **two consumers** (`flag:'fishmongerRowRestored'@8689`, plus HKG's `cyMaintenanceDecoded` beat added by §TIDE-01-A); the track wires it as the "world changes after an event" rail. Best "zero code" ratio.
- [x] **§POT-W5 → §TIDE-01-B/C** `OPEN → PROMOTED 2026-07-23` — the Void apocalypse is narrated (`const VOID_TIDE_EVENTS@22203`) but never becomes world state; the terrain-rewrite increment flips `IMPASSABLE_CELLS`/cell state (policy-blessed), never gates a step. Lab-report-gated.
- [x] **§POT-W4 → §TIDE-01-A** `OPEN → PROMOTED 2026-07-23` — the 1367-vs-cyberpunk blend is unjustified in-world; one `textVariants` node beat gives it a diegetic account (zero code). *Smallest first slice.*
- [x] **§POT-H2 → §XP-02** `OPEN → PROMOTED 2026-07-23` — §XP-01 shipped 3 effort-XP grant sites but exploration (the game's core loop) grants nothing; add a fourth first-arrival grant on the `visited` false→true transition, bounded so it can't out-earn combat.
- [x] **§POT-H3 → §CLUE-01** `OPEN → PROMOTED 2026-07-23` — every mystery resolves in one roll; `S_story.knowledge[]` + the `reward.knowledge` field already exist, so cumulative multi-clue mysteries need **no new opcode** (a *branching* one would need §VM-01). Content pattern, not an engine change.
- [x] **§POT-B3 → §BOSS-01-A** (with §POT-B2) `OPEN → PROMOTED 2026-07-23` — `EPIC_BOSS_POOL` has no `phases:` (0 hits); §PLAY-01-B's one-time enrage (`S.opp.enraged`) **is** a working one-stage phase — generalize it into a declarative `phases:` field (data, not a single-use term).
- [x] **§POT-B2 → §BOSS-01-B** `OPEN → PROMOTED 2026-07-23` — terrain is in the room but never in the fight; add a terrain modifier in `_storyEnemyTurn` (outside `DUEL:CORE`, the §PLAY-01-B-proven-safe site).
- [x] **§POT-C1 → §CHAR-01** `DO-NOT-BUILD (classes/races) + OPEN → PROMOTED 2026-07-23` — the open slice only: a one-time point-buy/standard-array at `storyNewGame()` writing the existing `abilityScores` (no class, no race, **no DC rebalance**). `pointBuy`/`_ASI_LEVELS` = 0 hits confirmed.
- [x] **§POT-C4 → §MESH-01-HIRE** `DO-NOT-BUILD (party) + OPEN → PROMOTED 2026-07-23` — the open slice only: give the §MESH-01g hireling bot (`#hireling-section {@2862`) an `NPC_DIALOGUES` voice so the one "companion" isn't just a daily fee.
- [x] **§POT-P3 → §RIPPLE-01-A** (with §POT-W3) `OPEN → PROMOTED 2026-07-23` — 2,448 `mission_bit` receipts are read only by gates; nothing reacts to a token you carry. Now unblocked by §NPC-01-B's ~203 card-bearing NPCs, which gives the reaction a render surface.
- [x] **§POT-W3 → §RIPPLE-01-B** `OPEN → PROMOTED 2026-07-23` — rest is identical at all 38 `sleep:true` havens; let a haven's quality track its resident NPC's favor (legal — resting is not movement).
- [x] **§POT-S3 → §MUD-01** `OPEN → PROMOTED 2026-07-23` — `describeCell` (ROOMS:CORE) already returns full room prose + exits (exercised by `mud-harness.mjs` 269/269) but the player barely sees it; the **read** half (a MUD-style view) is a renderer over shipped output. The *"I declare"* input half stays a BLOCKED seed (= §POT-R1).
- [x] **§POT-M2 → §HINT-01** `OPEN → PROMOTED 2026-07-23 (design call first)` — 1,057 static `hint:` strings state the DC outright; a state-aware hint needs a design call because hiding the DC would be *less* honest (§PLAY-01 tension). Promoted as an ASK-gated track, not a loop item.
- [x] **§POT-X2 → §INNER-01** `OPEN → PROMOTED 2026-07-23 (design call + lab report)` — Yael promises an inner arc; the only shipped inner-arc mechanic is §GR-D's Froberger Entry 42 (`entry42Written: false, entry42Text:@22959`). Extending it is a new narrative arc → lab report + user design call first.
- [x] **§POT-C3 → §NPC-01-SF5** `OPEN → PROMOTED 2026-07-23 (re-scoped by drift)` — the Fisherman-card gap. *Drift since `43bd09c`:* `the_fisherman` now has a rich profile (`the_fisherman: { key:"the_fisherman"@22785`, `node:'SSJ'`) + dialogue (`the_fisherman: { meta:@10458`), so the real bug is that SSJ's curated `_ssjNpcs` literal (`const _ssjNpcs@32427`) shadows the derived render map — folded into the NPC-card track as **§NPC-01-SF5** (a one-line SSJ fix).

- [x] **§POT-H1 — Hooks reach you only by walking onto them — and the opcode for the alternative is already written and unused** (prompts 11, 31, 35) `OPEN → PROMOTED 2026-07-21 → §BOARD-01 in BACKLOG.md` 🔴
  **Today:** every hook is arrival-triggered: `storyCheckQuests` fires on arrival at `activateNode`. `rumor` = 7 hits, all prose. **There is no bounty board** — the single `bounty` hit in 37,271 lines is flavor text inside `VOID_TIDE_EVENTS` #21. With 2,850 quests across 401 nodes, discovery is **geographic, never social**: nobody ever tells you where to go.
  **Potential:** an NPC-delivered hook ("a rumor points you at a distant node") is **exactly what the dead `unlock` opcode does.** `unlock` (`unlock(bit, ctx)@22147`) is a working handler — `(bit.quests||[]).forEach(qid => … S_story.quests[qid] = 'active')` — ~~authored **zero times**~~ **now authored 18 times: §BOARD-01 became its first consumer, exactly as this row predicted.** This is a rare shape: the capability exists, is contract-validated (`unlock:      { required:[]@21858`), and needs no VM change (it does not branch or wait). A bounty/rumor board is the natural consumer. **Best unblocked ratio in this file.**

- [x] **§POT-R2 — ⭐ 193 of 213 NPCs have a full four-tier relationship arc that no node can render** (prompt 23) `OPEN → PROMOTED 2026-07-23 → §NPC-01 in BACKLOG.md` 🔴 *largest content unlock in the file*
  **Today, measured:** `NPC_DIALOGUES` holds **213 NPCs**, each with four favor-scaled pools (`impartial` / `questActive` / `friendly` / `dearFriend`), a `quote`, a `meta.worldTruth` payoff and a `meta.enemy`. `_getNPCDialogue` (`function _getNPCDialogue@23395`) implements the whole tier ladder. **But:**
  - `_renderNpcCard` has **exactly one call site** (`_renderNpcCard(k, npcRowDiv)@32470`), driven by `birkaNpcs` — a **hardcoded 14-key literal** (`LHR,TLL,MHQ,LLA,HKG,CQ,SQ,STN,TL,VS,GC,AMS,SSJ,NUE`).
  - **20 of 213 NPCs are reachable as cards. 193 are not.**
  - Favor — which gates the ladder and the `worldTruth` payoff — moves via only **16 `favor` bits across 2,850 quests** + 5 hardcoded `_setNpcFavor` calls.
  - `NODE_NPC_KEYS`' own comment claims it is *"used by `_getNPCDialogue()` routing."* **It is not** — its only consumers are `_getNodeMapColor` (`function _getNodeMapColor@27374`) and `_getFarewell` (`function _getFarewell@27387`). Stale doc comment, §PLAY-01-G class.
  - **Honest scope note:** those 193 NPCs are **not** unreachable content — 203 of 213 are referenced by ≥1 quest, so their *writing* reaches players as quest prose. What is unreachable is the **relationship** — the deepening ladder and the `worldTruth` earned at Dear Friend.
  **Potential:** **the render map is already derivable from data.** §PLAY-01-G's remap fixed `birkaNpcs`' dead codes *by reading each NPC's quest `activateNode`* — proving the NPC→node mapping is a **query, not a literal**. Computing `birkaNpcs` from `QUEST_DB` would take the relationship system from 20 NPCs to ~203 and give the 16-bit favor track, `meta.enemy` (§POT-C2) and 193 `worldTruth` lines (§POT-W1) somewhere to land. It is the same "hardcoded per-node special case → generic data-driven engine" migration the lab report identifies as the direction `storyRender` is already evolving in.
  > **Promoted 2026-07-23 → §NPC-01** (`lab-reports/lab-report-npc-card-map.md`). Re-measured live at `r2h-3.104.0` (37,812 lines) — and the thesis is **stronger** than the `43bd09c` snapshot said: the card *content* is not thin. **204 `BIRKA_NPC_PROFILES` entries** (`const BIRKA_NPC_PROFILES@22547`) and **213 `NPC_DIALOGUES` entries** (`const NPC_DIALOGUES@10283`) are authored, **203** have both. Two corrections that reshape the work: **(1)** the NPC→node mapping is **already declared on every profile's `.node`** (121 distinct codes, **all** resolving in `NODE_MAP` — 0 dead) — so the map is a pure *inversion*, no `QUEST_DB` derivation needed and no §PLAY-01-G dead-code risk; **(2)** the real engine change is that `_renderNpcCard` (`function _renderNpcCard@23518`) **crashed on a lean profile** (the site is now the §NPC-01-A guarded fallback, `staticProfile && staticProfile.greeting@23553`) and ~194 of 204 profiles are lean — so the keystone increment is a greeting fallback, *then* widen the map (with the current state-gated curation preserved as an override layer). Side-findings logged: `euryclea_ithaca` dup key (SF1), profile-less mapped NPCs (SF2), stale `NODE_NPC_KEYS` comment (SF3).

### Shipped — the file already does this, do not rebuild

- [x] **§POT-H5 — Legendary artifact: shipped** (prompt 15) `SHIPPED` 🟢
  **Today:** the 7 Shards *are* this quest, and §PLAY-01-A surfaced them — `SHARD_GOAL = 7`, the objective chip renders `🔮🔮🔮◇◇◇◇` with symbols darkening as each returns. Backstory + perils are authored. Nothing to build; the one soft gap (no per-shard backstory surface) is low priority and belongs to §POT-W1's codex if ever wanted.

- [x] **§POT-B1 — Random encounters by terrain and level: shipped, twice** (prompts 16, 19) `SHIPPED` 🟢
  **Today:** the best-served prompt in the listicle. `WORLD_DB` is **110 hand-authored terrain→monster tables**; `TERRAIN_ENCOUNTER_RATE` sets per-terrain rates; `_weightedMonsterPick` (`function _weightedMonsterPick@37701`) draws them; **§KG-01 Hunt Mode** biases 80% of picks to `_monsterLevel ≤ player level` while 20% still draws the full pool; `_monsterLevel` normalizes threat 1–20; `TIER_LABELS` (`const TIER_LABELS@8008`) shows the player ⬥Trivial→★Deadly. **Do not rebuild.**

- [x] **§POT-R0 — Atmospheric scene-setting: shipped, and it is the craft peak of the file** (prompt 21) `SHIPPED` 🟢
  **Today:** `ROOMS:CORE` (`◆◆◆ ROOMS:CORE:START ◆◆◆@9872`, parity-fenced) + `__ROOM_PROSE` (`const __ROOM_PROSE@9895`) generate per-cell prose with exits and sensory detail; 401 node texts carry the authored scenes. Nothing to build.

- [x] **§POT-P1 — Turning points, twists, story branches: shipped** (prompts 26, 29) `SHIPPED` 🟢
  **Today:** gates sequence arcs (`flags` 1,618 · `questsAttempted` 23 · `questsDone` 12 · `flagsPath` 5 · `sleptAt` 4 · `notFlags` 3 · `favorMin` 3 · `flagsAny` 2); the `narrative` bit (101 uses) delivers revelations; §PLAY-01-A's chip surfaces the goal. Note these gate **mission listing only, never movement** (Free-Movement policy).

- [x] **§POT-M0 — Practice encounters: shipped** (prompt 36) `SHIPPED` 🟢
  **Today:** `ENEMY_DB` (`const ENEMY_DB@5327`) covers *"all combat opponents incl. dummy/commoner"* — a training dummy exists — and **§KG is a purpose-built tutorial zone**: `sparring_droid` (`_monsterLevel` 1), the Komsomol School, and the Skill Fabrika (jack-in "brain-download" training), carrying a fresh L1 fighter to ~L6. Nothing to build.

- [x] **§POT-X1 — Collaborative worldbuilding: shipped, for developers** (prompt 41) `SHIPPED (dev-only)` 🟢
  **Today:** `worldbuilder.html` + the WBAPI server + `api.sh` are a full alternate-turns authoring loop, and the **API-First Development Policy** makes it the *preferred* way to change the world. Emits UQF-1.0 end-to-end (§EDITOR-03).
  **Potential:** the surface is dev-only; in-game player authoring is a different (large, speculative) product. Logged, not recommended.

---

## Promotion rules (read before acting on any row)

1. **Nothing here is scoped work.** Promoting a seed = a new `§` row in [BACKLOG.md](BACKLOG.md); anything that grows to a chain/faction/system also needs a `lab-reports/lab-report-*.md` **before any HTML edit** (Lab Report Policy).
2. **§VM-01 Inc A gates 9 of these prompts.** Do not promote a `BLOCKED` row by giving it a private branch/wait mechanism — that is the "new single-use term" the Host/Script Separation Policy forbids. Widen the grammar, never work around it.
3. **Re-grep before building.** Every claim above was measured at `43bd09c` and will drift. The repo's record is six arcs planned as new work and closed as already-shipped.
   > **Anchor pass 2026-08-03 (§DX-01e-FU).** All 36 bare line anchors in this file were migrated to the `` `symbol@1234` `` form (Doc-Anchor Policy, CONTRIBUTING.md) — **35 of the 36 pointed at unrelated code**; only `const ENEMY_DB@5327` had not moved. `check:walk` gate #15 now fails if any symbol named here is renamed or removed. **The pass re-measured only the anchored claims, and four had gone stale:** `execBits` is a generator, `choice`'s handler is implemented, `unlock` has 18 authors, and `textVariants` has two consumers — each corrected in place above. **The un-anchored claims in this file were NOT re-measured and are still `43bd09c`-era.** Rule 3 stands, and rule 2's `BLOCKED` markers in particular are stale — see §DX-01e-FU2 in BACKLOG.md.
4. **API-first.** Content-shaped rows (§POT-P2, §POT-W4/W5, §POT-H1) are authorable via `./api.sh` — confirm current state with `./api.sh audit` / `list` first. ⚠️ Restart the server before any write session (Hazard #1: a stale buffer silently reverts CSS/JS edits). *(`api.sh post monster` — the old Hazard #2 — was fixed 2026-07-30 by §DX-01c and is now the normal authoring path; all nine fields required, `tier` a string.)*
5. **Invariants that constrain several rows above:** movement is refused **only** for `'oob'`/`'sea'` — no quest/flag/bit may ever block a step (§POT-W5 must change *terrain state*, not gate a road); **no jump travel, ever** (`checkpointNode` respawn is the only warp); the three parity-fenced kernels (`◆◆◆ MOVER:CORE:START ◆◆◆@9801` · `◆◆◆ ROOMS:CORE:START ◆◆◆@9872` · `◆◆◆ DUEL:CORE:START ◆◆◆@10125`) are never edited in-place — edit `js/<mod>.js` and re-run `scripts/check-*-parity.js` (§POT-B2/B3).

### The four highest-ratio unblocked rows

| Row | Why it is cheap | Why it pays |
|---|---|---|
| **§POT-C3** Fisherman card **→ PROMOTED → §NPC-01-SF5** | one line in `_ssjNpcs` (drift: he now has a rich profile — the curated literal shadows the derived map) | completes §PLAY-01-D — the mentor the game points you at has no surface |
| **§POT-P2** use `textVariants` **→ PROMOTED → §TIDE-01** | **zero code** — pure authoring | a shipped, tested mechanism with 1 of 401 consumers |
| **§POT-H1** rumor/bounty board **→ PROMOTED → §BOARD-01** | `unlock` handler already written + contract-validated | the only hook vector that isn't "walk onto it"; kills a dead opcode |
| **§POT-R2** invert `BIRKA_NPC_PROFILES.node` → render map **→ PROMOTED → §NPC-01** | the mapping is already a `.node` field on all 204 profiles (0 dead codes) | 14 nodes → ~121; 20 → ~203 NPCs; gives §POT-C2, §POT-P3 and 193 `worldTruth` lines somewhere to land |

*© 2026 Paul Richeson — MIT License.*
