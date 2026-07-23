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

- `execBits` (`21722`) is a straight-line `for` loop — no branch, no suspend.
- `choice` has a **full contract** (`21577`, requires `prompt` + ≥2 `options`) and an **empty handler** (`21779` — the body is the comment `/* Phase 2: renderChoiceBlock(...) */`). `renderChoiceBlock` appears **once in the file: inside that comment.** It was never written.
- Quest acceptance **has no accept step**. `storyCheckQuests` matches `activateNode`, evaluates the gate, and writes `S_story.quests[id] = 'active'`. The player is *told* (`📋 <title>`), never asked. (`lab-reports/lab-report-javascript-mud.md`.)

This is **exactly [§VM-01](BACKLOG.md#vm-01--the-quest-vm--no-word-for-wait-new-2026-07-16), already open, already the active track** — *"the VM has an opcode table and no jump instruction."* This pass adds independent confirmation from the content side and **two findings §VM-01 does not name**:

1. **Four dead opcodes, not two.** §VM-01 names `choice` (0 authors) and `item_check` (0 authors; writes `ctx._itemCheck`, which the **only** other mention of that identifier in the file never reads back). Also dead: **`unlock`** (`21778`) — a *working* handler that sets quests active, authored **0 times**; and **`combat`** (`21766`) — a *working* handler, authored **0 times** (the 78 `type:"combat"` quests route through `node.battle` instead). That is **4 of 12 opcodes (33%) with zero authors.**
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

- [ ] **§POT-W1 — The world's politics exist as prose and cannot be read by anything, including the player** (prompt 1) `OPEN` 🟠
  **Today:** `WORLD_DB`'s 110 terrains are `{label, icon, monsters[]}` — an encounter table with **no cultural, political, or historical field**. Kingdoms, tensions and histories are real but live entirely as strings: 401 `NODE_MAP[].text` bodies + **213 `meta.worldTruth` lines**. `worldTruth` renders in exactly one place — `_renderNpcCard` at `23102`, gated `fav >= 2` (Dear Friend). Since only 20 NPCs can render a card at all (§POT-R2), **~193 worldTruths are unreachable at any favor level.**
  **Potential:** a read-only **Codex/Gazetteer** surface aggregating lore that is *already written* — not new lore, a renderer. Pairs naturally with §POT-M1 (rules surface); both are §PLAY-01-A "honesty" class: *surface what the engine already knows.* **Do not** add `culture:`/`power:` fields to `WORLD_DB` first — that is authoring, and the authored content already exists unread.

- [ ] **§POT-W2 — Steampunk: do not build** (prompt 2) `DO-NOT-BUILD` 🟢
  **Today:** `steampunk` 0 hits, `airship` 0. But the world **already spends an anachronism budget**: `cyberpunk_streets`, `soviet_checkpoint`, `komsomol_school`, `gladiator_zavod`, `skill_fabrika` terrains; HKG Neon Undercity; SVO Station 7; `techno_thug`/`hacker`/`corrupted_android`/`street_samurai`/`neon_golem`/`cyber_vampire`/`data_wraith`/`neural_predator`.
  **Potential:** none. §KG's design lesson is that anachronism ships **only behind a cover story** ("honor-central Soviet-cyberpunk … a Mercenary Guild Recruiter cover story"). A second, unrelated tech register with no such license would dilute the one the game has already paid for narratively. Re-open only if a cover story motivates it.

- [ ] **§POT-W3 — The gothic register is live; the safe haven is not a haven** (prompt 3) `OPEN` 🟠
  **Today:** the Void *is* the gothic engine — `_VOID_ENEMY_RE` (`24455`) encodes **24 gothic stems** (`void|corrupt|wraith|shade|revenant|spectr|phantom|wight|ghoul|lich|undead|skeleton|necro|hollow|dread|abyss|blight|cursed|haunt|wretch|shadow|demon|fiend`) and drives real per-tier enemy AI (§PLAY-01-B). Safe havens = 38 `sleep:true` nodes.
  **Potential:** the prompt's *"potential allies or safe havens"* pairs shelter with **people**, and the file has a whole relationship model to hang it on. Rest is currently identical at all 38 nodes and costs nothing. A haven whose quality tracks the resident NPC's favor would reuse the near-dead favor track (§POT-R2) and give `sleep` a social meaning. **Invariant check: legal** — resting is not movement, so this does not touch the Free-Movement policy (no quest/flag may ever refuse a *step*; nothing here does).

- [ ] **§POT-W4 — Science-fantasy is already the game; it is simply never explained** (prompt 4) `SHIPPED + OPEN` 🟢
  **Today:** shipped in substance — a 1367 AD historical frame (§1367, Events A–G) + cyberpunk nodes + the Void as cosmic force + fishing-exclusive lake magic. No planets/spacefaring, and none wanted.
  **Potential:** the blend is **unjustified in-world** — a 1367 courier walks into HKG "Neon Undercity" with no diegetic account. §1367 already found and fixed this exact defect once: Events A–F were *"parked at the `HKG` cyberpunk node — an integration placeholder"* and had to be relocated to thematic nodes. One node-text beat giving the anachronism an account would close it, using the shipped `node.textVariants` mechanism (§POT-P2). **Do not add planets or realms.**

- [ ] **§POT-W5 — The apocalypse is narrated in past tense and never becomes world state** (prompt 5) `OPEN` 🔴 *strongest world item*
  **Today:** `apocalyp` 0 literal hits, but the Void is a slow apocalypse — `VOID_TIDE_EVENTS` narrate it (#21: *"A Void Walker was spotted north of Visby… The Warrant put a bounty on it. Nobody collected."*). `_addVoidPressure` + sleep advance a counter. **No node has ever become ruined.** The Void advances only in prose.
  **Potential:** both required mechanisms **already ship**, and the policy **explicitly blesses this shape**. CONTRIBUTING's Free-Movement policy: *"If a future feature needs a place to feel impassable until something happens, it must do so by **changing terrain/`CELL_GRID`/`IMPASSABLE_CELLS` state** (the cell genuinely becomes/stops-being sea), not by consulting quest state inside the mover."* And §GR shipped `node.textVariants:[{flag,text}]`, recorded as *"reusable for any 'node changes after an event'."* So a Void tide that genuinely rewrites terrain + node text is **already legal and already implemented** — it has never been used. Note the trap: this must change *terrain state*, never gate a step.

## §POT-C — Character Creation (prompts 6–10)

- [ ] **§POT-C1 — Races/classes: do not build. The real gap is that you never choose your own ability scores** (prompts 6, 37, 38) `DO-NOT-BUILD + OPEN` 🟠
  **Today:** Fighter-only **by explicit design** — `FIGHTER_FEATURES` (`24816`); the level-10 entry states it outright: *"No style choice in this world — your body has become the weapon."* No race system. `abilityScores` (STR/DEX/CON/INT/WIS/CHA) exist and drive **all 2,631 `skill_check` bits** via `_rollSkill` (`21734`).
  **Potential:** adding classes/races would **invalidate the DC curve across 2,850 quests** — every DC is balanced against one progression, and the prose argues for the constraint. Do not build. **But** `abilityScores` default to flat 10s and move only via `_ASI_LEVELS` and one-off `_legacy_fn` bumps — so the player never authors the character the 2,631 checks are *about*. A one-time point-buy / standard-array at `storyNewGame()` is the honest, bounded slice (fits `_S_DEFAULTS()` per §STATE-INIT; no class, no race, no DC rebalance).

- [~] **§POT-C2 — 202 villains are authored, keyed to an NPC, and read by nothing** (prompts 7, 27) `RENDER SURFACE SHIPPED via §NPC-01-C` 🟡 *(was 🔴 highest content-per-line in the file)*
  **Today:** `BOSS_COMMANDER_AUROS` (`25558`, AC22/HP300) is the final villain. Underneath it, **202 of 213 NPCs declare `meta.enemy`** — a specific, named antagonist with stakes. Examples: *"Rival scholars in the Jalayirid court who prefer the source tradition he rejected and want his preface retracted"*; *"Road bandits on the Klausenburg mountain passes who know the Van Helsing contingency route."* ~~**Nothing reads the field.**~~ **✅ §NPC-01-C now renders `meta.enemy` as a `⚔` card footer at Friendly (fav ≥ 1), above the `✦` `worldTruth` footer at Dear Friend** — combined with §NPC-01-B's ~203-node render map, every authored enemy sketch on a card-bearing NPC now surfaces in play.
  **Potential:** ~~202 villain sketches already written and invisible. Cheapest honest surface mirrors the one that already works: render `meta.enemy` on the NPC card at Friendly (fav≥1)~~ **← done (§NPC-01-C).** The **larger** half of prompts 7/27 remains open: *factions responding to recent actions* — enemies that react to what you've done — which needs `choice`/influence (see §POT-P3 / §POT-H4). `meta.enemy` is now the visible raw material for who opposes whom.

- [ ] **§POT-C3 — The game's designated mentor has no card** (prompt 8) `OPEN` 🔴 *smallest item here; completes shipped work*
  **Today:** §PLAY-01-D shipped on the thesis that *"the magic vector now reaches the player through a chain of people (Yael → the Fisherman, who gives freely)"* — Yael's onboarding monologue personally signposts the Fisherman. Measured: **`the_fisherman` is referenced by no quest and rendered by no card** — one of only 3 NPCs in the file with neither. Yael has a card. **The chain's second link has no surface.**
  **Potential:** add `the_fisherman` to the `birkaNpcs` map at the lake/cabin node. Tiny, and it finishes a shipped feature whose whole point was that the mentor is a person. Same defect class as the §PLAY-01-D/G `CI`→`LHR` and `IN/TV/BA/CY` remaps: *an NPC card that renders nowhere.*

- [ ] **§POT-C4 — Party: do not build. The hireling is a fee, not a person** (prompt 9) `DO-NOT-BUILD + OPEN` 🟢
  **Today:** no party — the protagonist is solo and `DUEL:CORE`, `S_story` and the XP model are all single-combatant. Two answers already exist: the **§MESH-01g hireling guide bot** (`4546` — "single-player companion, daily fee") and **MESH multiplayer** (remote players render on all three map panes, §MP-MAP).
  **Potential:** a party would touch every parity-fenced kernel — do not build; MESH is the better answer and already ships. Small honest gap: the hireling has no `NPC_DIALOGUES` entry, so the one "companion" in the game is a daily charge with no voice. Giving it a dialogue key would make it a character.

- [ ] **§POT-C5 — The protagonist has no moral ledger** (prompt 10) `BLOCKED` 🟠
  **Today:** the PC is a blank courier — no alignment, no reputation. Meanwhile the *content* is saturated with moral ambiguity (the Nikephoros wound log and entry M.T.; Gret Orrens' stolen manuscript). `faith_folk`/`faith_reform`/`faith_orthodox` + `faction_hansa` exist as tracks, and `faith_folk >= 1` gates exactly one thing — §1367-G's capstone.
  **Potential:** the seed of a reputation system exists and serves one quest. **Blocked, and must stay blocked:** with no `choice`, a moral ledger only records what the quests did *to* you — it would measure a decision the player never made. Ships after §VM-01 Inc A, not before.

## §POT-H — Adventure Hooks & Quests (prompts 11–15)

- [x] **§POT-H1 — Hooks reach you only by walking onto them — and the opcode for the alternative is already written and unused** (prompts 11, 31, 35) `OPEN → PROMOTED 2026-07-21 → §BOARD-01 in BACKLOG.md` 🔴
  **Today:** every hook is arrival-triggered: `storyCheckQuests` fires on arrival at `activateNode`. `rumor` = 7 hits, all prose. **There is no bounty board** — the single `bounty` hit in 37,271 lines is flavor text inside `VOID_TIDE_EVENTS` #21. With 2,850 quests across 401 nodes, discovery is **geographic, never social**: nobody ever tells you where to go.
  **Potential:** an NPC-delivered hook ("a rumor points you at a distant node") is **exactly what the dead `unlock` opcode does.** `unlock` (`21778`) is a working handler — `(bit.quests||[]).forEach(qid => … S_story.quests[qid] = 'active')` — authored **zero times**. This is a rare shape: the capability exists, is contract-validated (`21575`), and needs no VM change (it does not branch or wait). A bounty/rumor board is the natural consumer. **Best unblocked ratio in this file.**

- [ ] **§POT-H2 — "Uncharted lands" aren't modeled, and walking somewhere new earns nothing** (prompt 12) `OPEN` 🟠
  **Today:** the journey is the engine's strength — 401 nodes, free movement, road net, auto-travel. But `S_story.visited` is a bare boolean per node whose only consumer is map tinting (`_getNodeMapColor`, `26819`). No fog-of-war, no discovery reward.
  **Potential:** **this is an unfinished §XP-01.** That track's user directive was *"all action earns XP"* and it shipped three grant sites (fled enemy, missed attack, failed check) — yet **exploration, the one thing the game is built around, grants nothing.** First-arrival XP is a direct, in-principle completion of a closed track, using its existing dials.

- [ ] **§POT-H3 — Every mystery resolves in exactly one roll** (prompt 13) `OPEN` 🟠
  **Today:** mysteries are the file's best content (`quest_scar_01` "The Open Ledger" — INT/Investigation DC 8 to notice a 17-year plagiarism). But the shape is always `skill_check` → pass/fail → done. No clue accumulation, no partial knowledge. **`S_story.knowledge[]` already exists** as a clue store (the `reward` bit's `knowledge` field, `21764`).
  **Potential:** multi-clue mysteries — several `knowledge` grants, then a `gate.flags` reveal. **Needs no new opcode** and no VM change; the parts are all shipped. (A *branching* mystery does need §VM-01; a *cumulative* one does not.)

- [ ] **§POT-H4 — Factions are named but have no state and never respond** (prompts 14, 27) `BLOCKED` 🟠
  **Today:** `faction_hansa` (8 refs), three `faith_*` tracks, and a `favorMin` gate term (3 uses). Factions are vocabulary, not actors.
  **Potential:** §PLAY-01-B established the pattern (enemies now respond per tier). Factions responding to your actions is the same idea one level up — but the prompt's *"opportunities to influence the outcome"* requires influence, i.e. `choice`. Blocked; also large. Pair with §POT-C2 (`meta.enemy` is the authored raw material for who opposes whom).

- [x] **§POT-H5 — Legendary artifact: shipped** (prompt 15) `SHIPPED` 🟢
  **Today:** the 7 Shards *are* this quest, and §PLAY-01-A surfaced them — `SHARD_GOAL = 7`, the objective chip renders `🔮🔮🔮◇◇◇◇` with symbols darkening as each returns. Backstory + perils are authored. Nothing to build; the one soft gap (no per-shard backstory surface) is low priority and belongs to §POT-W1's codex if ever wanted.

## §POT-B — Combat Encounters (prompts 16–20)

- [x] **§POT-B1 — Random encounters by terrain and level: shipped, twice** (prompts 16, 19) `SHIPPED` 🟢
  **Today:** the best-served prompt in the listicle. `WORLD_DB` is **110 hand-authored terrain→monster tables**; `TERRAIN_ENCOUNTER_RATE` sets per-terrain rates; `_weightedMonsterPick` (`36796`) draws them; **§KG-01 Hunt Mode** biases 80% of picks to `_monsterLevel ≤ player level` while 20% still draws the full pool; `_monsterLevel` normalizes threat 1–20; `TIER_LABELS` (`7950`) shows the player ⬥Trivial→★Deadly. **Do not rebuild.**

- [ ] **§POT-B2 — Terrain is in the room but never in the fight; no legendary or lair actions exist** (prompts 17, 19) `OPEN` 🟠
  **Today:** stats are rich (398 full blocks). Tactics: §PLAY-01-B's press/flee is the entire enemy AI. **Legendary abilities: none** — every `legendary` hit is the Legendary Shield item or a fish size tier. **Lair actions: 0 hits. Environmental advantage: none** — combat reads terrain in exactly one place, the `_VOID_TERRAIN_RE` name heuristic that classifies Void-vs-mundane. The `ROOMS` kernel knows terrain (`terrainAt`, `9794`); the fight never asks.
  **Potential:** terrain-conditioned encounters (the prompt's *"environmental advantages they may utilize"*) with a ready-made safe pattern: **§PLAY-01-B added its AI branch in `_storyEnemyTurn`, outside the kernel, leaving `DUEL:CORE` git-diff-verified untouched.** Same move applies here. ⚠️ `DUEL:CORE` is parity-fenced (`10057`) — never edit the inlined copy; edit `js/duel.js` and re-run `scripts/check-duel-parity.js`.

- [ ] **§POT-B3 — Multi-stage bosses: the first stage already ships; generalize it** (prompt 18) `OPEN` 🟠
  **Today:** `EPIC_BOSS_POOL` is **20 flat stat blocks** (`{ac, hp, atk, dmgCount, dmgDie, dmgFlat, epicDesc}`) — no phases, no transitions. The only staging in the file is §PLAY-01-B's **one-time enrage at ≤30% HP**, tier-scaled (easy +1/+1 … deadly +4/+4 + an extra damage die), guarded by `S.opp.enraged` and reset per encounter in `_storyRollInit`.
  **Potential:** enrage **is** a one-stage boss phase with working state. A declarative `phases:[{atPct, atk, dmg, msg}]` field on `EPIC_BOSS_POOL` generalizes shipped code into data — squarely with the **Host/Script Separation Policy** (new shapes go in the grammar/data, never a new single-use term), and it reuses `S.opp.enraged`'s lifecycle rather than inventing one.

- [ ] **§POT-B4 — Skill challenges: shipped to saturation; the gap is the inverse of the prompt** (prompt 20) `SHIPPED + BLOCKED` 🟠
  **Today:** **2,484 of 2,850 quests are `skill_check`** (2,631 bits) — combat-optional problem-solving is not a gap, it is the file's dominant form.
  **Potential:** the prompt asks players to *"overcome obstacles through ability checks, clever problem-solving, or creative thinking"* — a **chain** of related checks where earlier results shape later ones. The file has 2,631 **isolated** checks, because `execBits` cannot carry a result forward or branch. Blocked on §VM-01-A. Do not author a chain by hand: `skill_check` already *"smuggles its own branch"* (`21750`) and CONTRIBUTING names it **"the exception to retire, not the pattern to copy."**

## §POT-R — Roleplaying & Storytelling (prompts 21–25) — *the heart of the listicle*

- [x] **§POT-R0 — Atmospheric scene-setting: shipped, and it is the craft peak of the file** (prompt 21) `SHIPPED` 🟢
  **Today:** `ROOMS:CORE` (`9804`, parity-fenced) + `__ROOM_PROSE` (`9827`) generate per-cell prose with exits and sensory detail; 401 node texts carry the authored scenes. Nothing to build.

- [ ] **§POT-R1 — ⭐ The keystone: the engine cannot ask a question** (prompts 22, 24, 44) `BLOCKED = §VM-01 Inc A` 🔴
  **Today:** *"Act as a supportive game master who … responds to my character's actions"* and *"branching paths based on my dialogue choices"* describe a loop this engine does not have. `choice` contract at `21577`, empty handler at `21779`, **0 authors**, and `renderChoiceBlock` exists only inside that handler's comment. Note the split: the **stat** half of prompt 24 already ships — CHA/Persuasion/Deception/Intimidation checks are live (e.g. `mol001_act2`, CHA DC 13). It is only the **branch** that is missing.
  **Potential:** **§VM-01 Inc A (~30 lines) unblocks six operations and 9 of these 44 prompts.** Nothing in this section should be promoted ahead of it.

- [x] **§POT-R2 — ⭐ 193 of 213 NPCs have a full four-tier relationship arc that no node can render** (prompt 23) `OPEN → PROMOTED 2026-07-23 → §NPC-01 in BACKLOG.md` 🔴 *largest content unlock in the file*
  **Today, measured:** `NPC_DIALOGUES` holds **213 NPCs**, each with four favor-scaled pools (`impartial` / `questActive` / `friendly` / `dearFriend`), a `quote`, a `meta.worldTruth` payoff and a `meta.enemy`. `_getNPCDialogue` (`22943`) implements the whole tier ladder. **But:**
  - `_renderNpcCard` has **exactly one call site** (`31835`), driven by `birkaNpcs` — a **hardcoded 14-key literal** (`LHR,TLL,MHQ,LLA,HKG,CQ,SQ,STN,TL,VS,GC,AMS,SSJ,NUE`).
  - **20 of 213 NPCs are reachable as cards. 193 are not.**
  - Favor — which gates the ladder and the `worldTruth` payoff — moves via only **16 `favor` bits across 2,850 quests** + 5 hardcoded `_setNpcFavor` calls.
  - `NODE_NPC_KEYS`' own comment claims it is *"used by `_getNPCDialogue()` routing."* **It is not** — its only consumers are `_getNodeMapColor` (`26822`) and `_getFarewell` (`26833`). Stale doc comment, §PLAY-01-G class.
  - **Honest scope note:** those 193 NPCs are **not** unreachable content — 203 of 213 are referenced by ≥1 quest, so their *writing* reaches players as quest prose. What is unreachable is the **relationship** — the deepening ladder and the `worldTruth` earned at Dear Friend.
  **Potential:** **the render map is already derivable from data.** §PLAY-01-G's remap fixed `birkaNpcs`' dead codes *by reading each NPC's quest `activateNode`* — proving the NPC→node mapping is a **query, not a literal**. Computing `birkaNpcs` from `QUEST_DB` would take the relationship system from 20 NPCs to ~203 and give the 16-bit favor track, `meta.enemy` (§POT-C2) and 193 `worldTruth` lines (§POT-W1) somewhere to land. It is the same "hardcoded per-node special case → generic data-driven engine" migration the lab report identifies as the direction `storyRender` is already evolving in.
  > **Promoted 2026-07-23 → §NPC-01** (`lab-reports/lab-report-npc-card-map.md`). Re-measured live at `r2h-3.104.0` (37,812 lines) — and the thesis is **stronger** than the `43bd09c` snapshot said: the card *content* is not thin. **204 `BIRKA_NPC_PROFILES` entries** (`22386`) and **213 `NPC_DIALOGUES` entries** (`10273`) are authored, **203** have both. Two corrections that reshape the work: **(1)** the NPC→node mapping is **already declared on every profile's `.node`** (121 distinct codes, **all** resolving in `NODE_MAP` — 0 dead) — so the map is a pure *inversion*, no `QUEST_DB` derivation needed and no §PLAY-01-G dead-code risk; **(2)** the real engine change is that `_renderNpcCard` (`23317`) **crashes on a lean profile** (`staticProfile.greeting`, `23367`) and ~194 of 204 profiles are lean — so the keystone increment is a greeting fallback, *then* widen the map (with the current state-gated curation preserved as an override layer). Side-findings logged: `euryclea_ithaca` dup key (SF1), profile-less mapped NPCs (SF2), stale `NODE_NPC_KEYS` comment (SF3).

- [ ] **§POT-R3 — The best writing in the file is gated behind a d20 instead of a decision** (prompt 25) `BLOCKED` 🔴 *sharpest statement of §VM-01's cost*
  **Today:** the moral content is world-class — the surgeon's wound log and entry M.T.; *"The archive holds accurate records. It does not determine what to do with them."* But **every dilemma resolves by dice, not by decision**: you roll INT/WIS to *perceive* it, and the quest tells you what you concluded. `passText` narrates the insight; `failText` narrates missing it. The player never takes a side.
  **Potential:** `choice` would convert perception-rolls into decisions across the arcs where it matters. This is the clearest measure of §VM-01's cost: **the engine's finest content is a spectator sport.** Blocked on Inc A.

## §POT-P — World & Story Progression (prompts 26–30)

- [x] **§POT-P1 — Turning points, twists, story branches: shipped** (prompts 26, 29) `SHIPPED` 🟢
  **Today:** gates sequence arcs (`flags` 1,618 · `questsAttempted` 23 · `questsDone` 12 · `flagsPath` 5 · `sleptAt` 4 · `notFlags` 3 · `favorMin` 3 · `flagsAny` 2); the `narrative` bit (101 uses) delivers revelations; §PLAY-01-A's chip surfaces the goal. Note these gate **mission listing only, never movement** (Free-Movement policy).

- [ ] **§POT-P2 — The "world changes after an event" mechanism shipped with one consumer** (prompt 28) `OPEN` 🔴 *high ratio*
  **Today:** §GR shipped `node.textVariants:[{flag,text}]` (`85faf9b`), recorded as *"display-only, API-authored; **reusable for any 'node changes after an event'**."* Measured: **exactly one node uses it** (`8630`) — the `fishmongerRowRestored` payoff. The renderer (`30537`, `30540`) is generic and idle.
  **Potential:** a built, tested, API-authorable mechanism with 1 of 401 possible consumers. Every "the area was altered by [event]" beat — including §POT-W5's Void tide and §POT-W4's anachronism account — is already expressible **with no code change at all.** Pure authoring against shipped rails.

- [ ] **§POT-P3 — 2,448 tokens record everything you did; nothing ever reacts to them** (prompt 30) `OPEN` 🟠
  **Today:** `mission_bit` is the file's second-most-authored opcode — **2,448 bits**, described in §MBIT-02-E as *permanent receipts* (not spent goods), with a `_flagToLabel` rewrite covering 2,420 of them, `token.day` timeline grouping, and `_takeMissionBit` gate-safety all shipped. But mission bits are read **only by gates** — i.e. only to decide whether a *later mission lists*.
  **Potential:** the prompt asks what *ripples* from an acquisition. The game holds a 2,448-entry ledger of witnessed events and consults it exclusively as a prerequisite check. NPCs reacting to tokens you carry is the natural payoff — and lands on §POT-R2's bottleneck again (only 20 NPCs can say anything).

## §POT-S — Sandbox & Player-Driven (prompts 31–35)

- [ ] **§POT-S1 — Bounty board** (prompts 31, 35) `OPEN` → **merged into §POT-H1** (the dead `unlock` opcode is its engine).

- [ ] **§POT-S2 — Personal ambitions have no branches** (prompt 32) `BLOCKED` 🟡
  **Today:** `type:'craft'` = 12 quests — crafting exists as *quests*, not as a *system*. No faction joining, no fame track.
  **Potential:** *"provide potential branches to develop this storyline"* is the prompt's own word: branches. Blocked on §VM-01-A. §POT-C5's faith/faction tracks are the state it would move.

- [ ] **§POT-S3 — The room-description engine is better than the surface that shows it** (prompt 33) `OPEN` 🟡
  **Today:** `ROOMS:CORE`'s `describeCell` produces full room prose + per-direction exits with `__roadDestination` hints. Player-facing use is thin: node text plus the §NAV-01-FU road-hover tooltip. The prose engine's full output is exercised mainly by `tests/mud-harness.mjs` (269/269).
  **Potential:** *"describe a vivid environment and I declare how my character interacts with it"* is close to what `describeCell` already returns; a text/MUD-style view would mostly be a **renderer over shipped output**. The *"I declare"* half is §POT-R1. Modest, and pleasingly cheap for the half that's unblocked.

- [ ] **§POT-S4 — Downtime exists as scattered verbs with no hub** (prompt 34) `OPEN` 🟡
  **Today:** `downtime` = 0 hits, but the *activities* all ship: fishing (20 ranks + a nocturnal pool), 5 vendor nodes, 38 rest nodes, Hunt Mode, 12 craft quests.
  **Potential:** the prompt wants *"help us plan out potential side activities"* — a "you have time; here's what this place offers" surface. Honesty class again (§PLAY-01-A): the verbs exist and the game never mentions them. Overlaps §POT-M1 and §POT-W1 — likely one surface, not three.

## §POT-M — Meta & Mechanics (prompts 36–40)

- [x] **§POT-M0 — Practice encounters: shipped** (prompt 36) `SHIPPED` 🟢
  **Today:** `ENEMY_DB` (`5327`) covers *"all combat opponents incl. dummy/commoner"* — a training dummy exists — and **§KG is a purpose-built tutorial zone**: `sparring_droid` (`_monsterLevel` 1), the Komsomol School, and the Skill Fabrika (jack-in "brain-download" training), carrying a fresh L1 fighter to ~L6. Nothing to build.

- [ ] **§POT-M1 — The game has no rules surface at all** (prompt 40) `OPEN` 🔴 *cleanest honesty item*
  **Today:** measured — **no help screen, no rules tab, no glossary** anywhere in 37,271 lines. The entire tutorial is **one NPC monologue** (`yael.impartial[0]`), and §PLAY-01-D had to add a **special-case guarantee** (`yaelOnboardingSeen`) purely to ensure it is delivered once, because the auto-active Slums quest shadowed it. `mechanics.md` is a *developer* doc the player never sees. Meanwhile the engine privately knows: `_magicTierAllowed` = `level ≥ magic × 5`, `XP_LEVELS`, `CONDITION_ADV`, `_monsterLevel`, `EFFORT_XP_PCT`/`EFFORT_MISS_PCT`, the d100 loot weights.
  **Potential:** **the textbook §PLAY-01 finding** — *the engine knows things it won't transmit.* §PLAY-01-A proved the pattern (objective chip: surface the known, diegetically, UI-only, zero balance risk). A rules/codex surface is the direct analogue and is the same class of no-design-call, no-balance-risk work. Merge with §POT-W1 + §POT-S4 into **one codex surface**.

- [ ] **§POT-M2 — Hints are static and always-on** (prompt 39) `OPEN` 🟡
  **Today:** quests carry a `hint:` field, widely authored (e.g. *"See through the mockery — WIS Insight DC 11"*), and it states the stat + DC outright.
  **Potential:** the prompt wants *"think through potential creative solutions using available party abilities and resources"* — i.e. a hint that knows **your** state (inventory, level, favor). Today's hint is a constant string. Low priority; note the design tension with §PLAY-01's honesty theme (a hint that hides the DC would be *less* honest, not more) — this one needs a design call before it is worth anything.

## §POT-X — Collaborative Worldbuilding (prompts 41–44)

- [x] **§POT-X1 — Collaborative worldbuilding: shipped, for developers** (prompt 41) `SHIPPED (dev-only)` 🟢
  **Today:** `worldbuilder.html` + the WBAPI server + `api.sh` are a full alternate-turns authoring loop, and the **API-First Development Policy** makes it the *preferred* way to change the world. Emits UQF-1.0 end-to-end (§EDITOR-03).
  **Potential:** the surface is dev-only; in-game player authoring is a different (large, speculative) product. Logged, not recommended.

- [ ] **§POT-X2 — The game states an inner arc and has no mechanics for it** (prompt 43) `OPEN (design call)` 🟠
  **Today:** Yael's monologue promises it outright — *"You came here to fight demons. You will. Real ones, with claws. **But the ones behind your own eyes are older and meaner, and that is the real fight.**"* There is no mechanic for that fight. The one shipped inner-arc mechanic is §GR-D's Froberger Entry 42 (`entry42Written`/`entry42Text` carried across NG+, the blank page you may fill at ≥3 dear friends) — which is genuinely this prompt, done once, at the very end of the game.
  **Potential:** Entry 42 is the proof the shape works and the template for more. **This is a design call, not a loop task** — and per the Lab Report Policy it needs a lab report locking data shapes first (new narrative arc).

- [ ] **§POT-X3 — Branching, interconnected storylines** (prompt 42) `BLOCKED` 🟠
  **Today:** gates express **sequence**, not **branch** — 1,618 `flags` terms and no disjunction, which is why `itemsMinAny` exists *for exactly one quest* (`quest_wm_01`).
  **Potential:** CONTRIBUTING already diagnoses this precisely: *"A term added per quest is the language asking for an expression evaluator (§VM-01-F). Before adding a gate term, check whether `{all|any|not}` nesting would say it instead."* The prompt's *"branching paths, layers of intrigue, narrative reversals"* is **§VM-01-F**, already scoped. Do not add gate terms to approximate it.

---

## Promotion rules (read before acting on any row)

1. **Nothing here is scoped work.** Promoting a seed = a new `§` row in [BACKLOG.md](BACKLOG.md); anything that grows to a chain/faction/system also needs a `lab-reports/lab-report-*.md` **before any HTML edit** (Lab Report Policy).
2. **§VM-01 Inc A gates 9 of these prompts.** Do not promote a `BLOCKED` row by giving it a private branch/wait mechanism — that is the "new single-use term" the Host/Script Separation Policy forbids. Widen the grammar, never work around it.
3. **Re-grep before building.** Every claim above was measured at `43bd09c` and will drift. The repo's record is six arcs planned as new work and closed as already-shipped.
4. **API-first.** Content-shaped rows (§POT-P2, §POT-W4/W5, §POT-H1) are authorable via `./api.sh` — confirm current state with `./api.sh audit` / `list` first. ⚠️ Restart the server before any write session (Hazard #1: a stale buffer silently reverts CSS/JS edits), and never use `api.sh post monster` (Hazard #2 — writes malformed entries into the wrong section).
5. **Invariants that constrain several rows above:** movement is refused **only** for `'oob'`/`'sea'` — no quest/flag/bit may ever block a step (§POT-W5 must change *terrain state*, not gate a road); **no jump travel, ever** (`checkpointNode` respawn is the only warp); the three parity-fenced kernels (`MOVER:CORE` `9733` · `ROOMS:CORE` `9804` · `DUEL:CORE` `10057`) are never edited in-place — edit `js/<mod>.js` and re-run `scripts/check-*-parity.js` (§POT-B2/B3).

### The four highest-ratio unblocked rows

| Row | Why it is cheap | Why it pays |
|---|---|---|
| **§POT-C3** Fisherman card | one key in the `birkaNpcs` map | completes §PLAY-01-D — the mentor the game points you at has no surface |
| **§POT-P2** use `textVariants` | **zero code** — pure authoring | a shipped, tested mechanism with 1 of 401 consumers |
| **§POT-H1** rumor/bounty board **→ PROMOTED → §BOARD-01** | `unlock` handler already written + contract-validated | the only hook vector that isn't "walk onto it"; kills a dead opcode |
| **§POT-R2** invert `BIRKA_NPC_PROFILES.node` → render map **→ PROMOTED → §NPC-01** | the mapping is already a `.node` field on all 204 profiles (0 dead codes) | 14 nodes → ~121; 20 → ~203 NPCs; gives §POT-C2, §POT-P3 and 193 `worldTruth` lines somewhere to land |

*© 2026 Paul Richeson — MIT License.*
