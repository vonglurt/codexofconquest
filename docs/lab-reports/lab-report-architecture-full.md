<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — CodexOfConquest Architecture: A Full Technical Review

**Original:** 2026-05-22 (updated 2026-05-24) · **Verified against HEAD:** 2026-08-11 (§DOC-02b)
**Source file:** `play.html` — reviewed at 14,377 lines / ~580 KB; **measured at HEAD: 38,707 lines / 5.51 MB** (`npm run stats`, engine `` `const ENGINE_VER = 'coc-3.104.0'@9907` ``)

> **HISTORY DOCUMENT — annotate, never rewrite.** This report described the file as it stood on 2026-05-22. Eleven weeks and roughly a dozen `§`-tracks later, the *thesis* still holds and most of the *inventory* does not. The 2026-08-11 pass re-measured every quantitative and structural claim against HEAD and records the result as a delta table. A claim that no longer describes the code is marked **STALE** or **SUPERSEDED** and **kept** — it is the record of what the architecture was, and of which review claims were wrong even then.

---

## Abstract

`play.html` is a browser-native D&D RPG that ships as one static HTML file: no build step, no CDN, no JavaScript modules, no server required to play. It runs two engines — a standalone dice combat tracker (Battle Mode) and a narrative campaign (Story Mode) — over a shared dice and combat-resolution layer, with all state in two plain mutable objects and all rendering done by full-section rewrite.

The original review measured 76 nodes, 370 monsters, 66 terrains and a 26×16 grid. **At HEAD the same architecture carries 416 nodes, 398 monsters, 111 terrains, 2,853 quests and 204 NPC profiles on a 90×360 equirectangular grid** — a ~5.5× growth in the file with the *architectural pattern unchanged*. That is the review's central prediction under test, and it survived: the flat-scope, full-rewrite, single-state-object design absorbed the growth. What did not survive is nearly every concrete data shape the review documented, because four tracks (§WALK/§NAV-01, §ARCH-01, §VM-01, §CELL-13) replaced the navigation graph, the quest format, the execution model and the teleport system respectively.

---

## I. Method

Verification was by direct measurement of HEAD, never from a doc table (§AUDIT-03m discipline):

1. **Symbol census.** All 197 function and constant names the report enumerates were `grep -c`'d against the HTML. **17 are dead.**
2. **Shape census.** Each claimed object literal (`S`, `S_story`, `MONSTER_POOL`, `NODE_MAP`, `QUEST_DB`) was brace-matched out of the file and its field names counted, so *"entry has field X"* is a number rather than an impression.
3. **Formula reading.** Every arithmetic claim (XP, gold, notoriety, notoriety weights, curse score, encounter chance, AC) was read at its live definition and compared literally.
4. **Registry counts.** Every *"N entries"* claim was counted by brace-matching the declaration.

Counts below are from HEAD on 2026-08-11 with the working tree carrying only the user's uncommitted CSS recolor (no data change).

---

## II. Delta Table — as-reviewed (2026-05-22) → as-built (2026-08-11)

### A. Scale

| Claim (2026-05-22) | Measured at HEAD | Verdict |
|---|---|---|
| 14,377 lines, ~580 KB | 38,707 lines, 5.51 MB | **STALE** — 2.7× lines, 9.5× bytes |
| 76 story nodes | **416** (`` `const NODE_MAP@8425` ``) | **STALE** |
| 370 monsters | **398** (`` `const MONSTER_POOL@5355` ``) | **STALE** |
| 66 terrains (46 base + 20 epic) | **111** (`` `const WORLD_DB@6279` ``) | **STALE** |
| 6 NPC voice profiles | **204** profiles / **213** dialogue entries | **STALE** — §NPC-01-B derived the render map from the profiles' own `node` field |
| 41 journal entries, 10 read-aloud + 31 collectible | **41**, `readAloud:true` on exactly **10** | **HOLDS** |
| 8 acts · 7 Codex Shards · Day 49 | 8 · 7 · 49 | **HOLDS** |
| `S_story` ≈ 107 fields | **193** top-level fields (`` `const _S_DEFAULTS = () => ({@23063` ``) | **STALE** |
| 26×16 world grid | **90×360** (`` `const GEO_PROJ = { ROWS: 90, COLS: 360 }@9902` ``) | **SUPERSEDED** by §WALK |
| 20 Epic Bosses · 20 EB quest givers · 5 Sweelinck variants | 20 · 20 · 5 | **HOLDS** |
| 19-level `FIGHTER_FEATURES` table | levels **2–20**, 19 entries (`` `const FIGHTER_FEATURES@25506` ``) | **HOLDS** in shape (contents differ — §II.E) |

### B. Data shapes — the four that were replaced wholesale

| Structure | As reviewed | As built | Verdict |
|---|---|---|---|
| `MONSTER_POOL` entry | `{name, ac, hp, dmgDie, dmgCount, cr, xpVal, terrain[]}` | `{key, name, ac, hp, atk, dmgDie, dmgCount, dmgFlat, tier}` — **`cr`, `xpVal` and `terrain` occur 0 times**; `tier`/`atk`/`dmgFlat` occur 398× | **STALE**. Terrain→monster is a one-way join held by `WORLD_DB`, not a field on the monster. `tier` is one of exactly five strings and drives five readers (§DX-02g). |
| `NODE_MAP` entry | `{num, name, label, act, N, E, S, W, sleep, battle, loot, isEpicBattleground, bossKey}` | Same minus the compass: **`N:`/`E:`/`S:`/`W:` occur 0 times**. `num` 416×, `act` 417×, `sleep` 147×, `battle` 133×, `loot` 141×, `npc` 140×, `isEpicBattleground`/`bossKey` 20× each | **SUPERSEDED**. §NAV-01 removed the adjacency graph outright; movement is cell-by-cell over `NODE_COORDS` + `ROAD_RUNS`. |
| `QUEST_DB` entry | `{activateNode, objectiveText, reward, completionCheck:(s)=>bool, waypointNode, disposition}` | UQF-1.0: **`objectiveText` 0×, `completionCheck` 0×**; `schema:` 2,823×, `bits:` 2,824×, `gate:` 2,836×, `completion:` 189×, `onComplete` 124×. 16 `_legacyFn` escapes remain. `disposition` (201×) and `waypointNode` (164×) survive | **SUPERSEDED** by §ARCH-01. The review's *"quest completion logic lives in the data"* was right about the intent and wrong about the mechanism: the closure was the thing §ARCH-01 removed, replacing it with a declarative opcode list executed by `QuestRuntime`. |
| `NODE_COORDS` | node code → `{r,c}` on 26×16 | node code → `{r,c}` on 90×360 (`` `const NODE_COORDS@9421` ``) | **STALE** in range, **HOLDS** in shape |

### C. Removed subsystems — code that no longer exists

| Reviewed subsystem | Status | Cause |
|---|---|---|
| `GATE_LOCKS` — 4 passage locks + the final shard gate | **0 occurrences** | Invariant #1 (Free Movement). A step is now refused for exactly two reasons: off-grid or sea. There is no locked gate on a road. |
| `CORRIDOR_CELLS`, `buildCorridorMap()`, `_routeSegments()`, `_corridorTerrain()`, `_wireGlyph()` | **0 occurrences** each | §WALK — replaced by the `MOVER:CORE` kernel and the `ROAD_RUNS` / `ROAD_CELLS` net |
| `storyMove(dir)`, `storyCorridorTravel()`, `triggerCorridorEncounter()` | **0 occurrences** | §NAV-01 auto-travel |
| `_bfsPath()` | **0 occurrences** | replaced by the road-weighted router |
| `storyPortal()`, `storySetHearthHome()`, `storyUseTransmort()`, `S_story.hearthHome` | **0 occurrences** — only the removal comments survive (`` `storyPortal removed@28459` ``) | §CELL-13, re-applied 2026-07-03. **Standing user rule: no jump travel, ever.** `checkpointNode` respawn is the only warp. The review's §IX.C "Hearthing and Teleport" section is entirely dead. |
| `storyStalk()`, `storyQuickWait()`, `storyRunAway()`, `_applyASI()` | **0 occurrences** | renamed/absorbed; `_ASI_LEVELS` (`` `const _ASI_LEVELS = new Set([4, 6, 8, 12, 14, 16, 19])@25528` ``) now drives ASI |
| `storyShowRoom6()`, `storyShowFrobergerNote()`, `storyShowWeckmannLog()`, `storyShowDeaconCode()`, `storyShowBrynnLedger()` | **0 occurrences** | the five narrative-modal launchers were absorbed into the node registries (`NODE_HOOKS` / `NODE_PANELS`, §VM-01-G-FU) |

**180 of the 197 named symbols still resolve.** For an 11-week window that changed the world model, the quest format and the execution engine, that is the review's strongest empirical result: the *names* are stable because the flat scope makes renaming expensive and rewriting cheap.

### D. Formulas

| Formula as reviewed | As built | Verdict |
|---|---|---|
| XP = `AC × maxHP` | `Math.round(AC × maxHp × partyMult)` (`` `function _storyBattleVictory()@25282` ``) | **HOLDS** at `partyMult=1`; §MESH-01f added the party share |
| gold = `floor(0.1 × AC × maxHP)` | `Math.floor(AC × maxHp × 0.1) × partyMult` | **HOLDS**, same caveat |
| notoriety = `level × 3 + floor(battlesWon / 2)` | identical, but `battlesWon = Object.keys(defeatedBattles).length + dropsCollected` (`` `function _notoriety()@38190` ``) | **HOLDS** in form; the input widened |
| `_notorietyWeights(n)`: 4 brackets (0–9 / 10–19 / 20–29 / 30+), weights 5/4/2/1/0 … deadly=0 below 20 | **6 brackets** (≤5 / ≤10 / ≤20 / ≤30 / ≤40 / else), percentage-scale weights `40/35/20/4/1` → `0/5/25/40/30` (`` `function _notorietyWeights(n)@38195` ``) | **STALE**. **Deadly is never 0** — a level-1 player already carries a 1% deadly draw. The review's *"at low notoriety deadly is impossible"* was never true of the shipped table. |
| `encounterChance = min(95, 10 + notoriety × 1.5 + activeQuestCount × 4)` | **no such expression exists.** Encounter rate is per-terrain data (`TERRAIN_ENCOUNTER_RATE`, `encounterRate(t)`), applied only on `destKind === 'empty'` steps, roads at rate 0 | **NOT SHIPPED / SUPERSEDED**. Active quest count has never fed encounter probability. |
| `_calcPlayerAc()` = base + shield + acBonus + **DEX mod** | base + shield + acBonus + `_lakeMagicBonuses().ac` — **no DEX term** (`` `function _calcPlayerAc()@24612` ``) | **STALE** (and likely wrong when written) |
| `_rollD100Loot()` rerolls up to 3× "before settling for nothing" | 3 attempts, then falls back to **Minor Healing Potion**, and draws from the **seeded** stream with a Luck modifier (`` `function _rollD100Loot()@24535` ``) | **STALE** — the floor is an item, not nothing |
| `_extraAttackCount()` returns 1/2/3/4; **"Action Surge doubles the count"** | returns 1/2/3/4 by level only — **no surge branch** (`` `function _extraAttackCount()@24997` ``) | **1/2/3/4 HOLDS; the doubling claim is NOT SHIPPED.** Action Surge resets the main action; it does not multiply the attack loop. |
| Void Pressure ticks on days 3/7/14/21/28/35/42, ≥10 ends the run | **exact** (`` `const VOID_TIDE_EVENTS@22369` ``, `` `function storyCheckVoidTide()@36341` ``) | **HOLDS** |
| *"there is no mechanical relief valve"* for Void Pressure | Layer 59 added a **mercy window** — `void_mercy_count` consumes a tide event instead of adding pressure | **STALE** — a relief valve now exists |

### E. Fighter progression

The reviewed table listed 9 levels. The live table has 19 (levels 2–20) and disagrees on two entries the review called out by name:

| Reviewed | As built |
|---|---|
| Level 15: Champion Crit 19–20 | **Level 3: Improved Critical (19–20)**; Level 15 is **Superior Critical** |
| Level 20: Extra Attack III + Champion Crit 18–20 | Level 20 is **Extra Attack III** only; the 18–20 range comes from Superior Critical at 15 |
| ASI at 4 and 19 | ASI at **4, 6, 8, 12, 14, 16, 19** |
| (not mentioned) | Levels 7 *Remarkable Athlete* (bonus HP roll), 10 *Fighting Style*, 13 *Indomitable II*, 18 *Survivor* |

**Verdict: STALE.** The crit-range claim was the review's, not the code's — improved crit has been a Level 3 feature.

### F. Narrative systems

| Claim | Measured | Verdict |
|---|---|---|
| `_curseScore()` = `(startedNotReturned×3) + (neverStarted×1) − (allComplete ? 5 : 0)`, range −5…+55 (§VII.E) | **exact** (`` `function _curseScore()@28193` ``) | **HOLDS** |
| `_curseScore()` = `+2 / +1 / −1`, range −20…+40 (§XI.E) | contradicted by the above | **NOT SHIPPED** — see §IV |
| `_covenantStanding()` → 5 tiers Keeper/Warden/Keeper/Watcher/Wanderer (§VII.E) | **exact**, `maxScore` −6 / 0 / 7 / 14 / ∞ (`` `const COVENANT_STANDING_LABELS@27358` ``) | **HOLDS** |
| `_covenantStanding()` → `Covenant Keeper (True)` gated on `pitWins ≥ 5` + `ebNegotiated ≥ 5` (§XI.E) | **no such tier and no such gate exist** | **NOT SHIPPED** — see §IV |
| `_missionComplete()` — 12 bits, true at ≥8 | **exact**, 12 keys, `>= 8` (`` `function _missionComplete()@23649` ``) | **HOLDS** |
| `_lubeckFriends()` — *"true if all 6 Birka NPCs are at Friendly+"* | returns a **count** of every NPC at favor ≥1 across the whole 204-profile table; `_missionComplete` tests it `>= 3` (`` `function _lubeckFriends()@23462` ``) | **STALE** — a boolean claim about a counter, and the "6 Birka NPCs" scope is 34× wider |
| NPC favorability states `hostile/neutral/friendly/dear` | `impartial` / `questActive` / `friendly` / `dearFriend`, selected by `fav ≥ 2` → `hasActiveQuest` → `fav ≥ 1` → fallthrough (`` `function _getNPCDialogue(npcKey)@23561` ``) | **STALE** — there is no hostile pool; `questActive` is a *tier*, which the review's model has no room for |
| `_getNPCDialogue()` runs a 7-step priority waterfall *before* the normal pool | Pool tier is chosen **first**, then **nine** one-time injections run over it (Yael onboarding §PLAY-01-D, Quill debt, Act III weight, Froberger trace, cross-ref every 3rd visit, Brynn Room 6, Weckmann championship, Isolde Gurt, …). S29 moved out of this function to the node render entirely | **STALE in order and count; HOLDS in principle.** The waterfall grew, and the review's insight — that static arrays feel context-aware because gated injections short-circuit them — is exactly what the live code does. |

### G. Render and event model

| Claim | Measured | Verdict |
|---|---|---|
| `storyRender()` is the largest function; full innerHTML rewrite, no diff, no cache | **1,490 lines** (34,562–36,051), 28 `innerHTML` writes per pass (`` `function storyRender(node, prefix)@34550` ``) | **HOLDS** — the defining pattern is intact at 5.5× the data |
| The 11-step render order (desc → quests → journal → NPC cards → combat → loot → vendor → nav → minimap → world map → status) | Order now opens with §CELL-03 position sync and `_uqfActivateAtNode()` (§VM-01-G3 — quest activation runs *before* the body so per-node UI keyed on `'active'` renders in the same arrival), and the nav step is gone with the compass | **STALE** in sequence, **HOLDS** in shape |
| Render-target table naming `#story-desc`, `#story-vendor`, `#story-inventory`, `#story-journal-overlay`, `#story-char-overlay`, `#history-cards` | **all six ids occur 0 times.** The live main target is `story-text-box` (26 references inside `storyRender` alone); overlays are `story-vendor-overlay`, `story-eb-npc-modal`, `story-fishing-modal` | **STALE** — 6 of 11 rows point at nothing |
| No event bus, no observables, synchronous click→pixel | intact | **HOLDS** |

### H. The "one file" claims

| Claim | Measured | Verdict |
|---|---|---|
| No CDN, no external assets | **0** external `<script src>`, **0** external `<link href="http…">` | **HOLDS** |
| No build step | **HOLDS at play time.** Author time now has one: the `MOVER:CORE` / `ROOMS:CORE` / `DUEL:CORE` / `QUEST:CORE` parity modules must be re-inlined from their `src/js/*.js` twins after editing | **QUALIFIED** |
| No server component | **HOLDS for single-player.** Two servers now exist beside the file: the WBAPI authoring server (`:1367`, author-time only) and the opt-in §MESH-01 multiplayer mesh (12 `fetch`/`WebSocket` sites in the HTML) | **QUALIFIED** — the offline-single-file guarantee is intact; "no server exists" is no longer the same sentence |
| `roll()` is **the only** function that calls `Math.random` | **54 `Math.random` sites** in the file (`` `function roll(sides)@6417` `` still uses it). Story-Mode game state draws the **seeded** stream instead (`` `function _seededNext()@6434` ``, `S_story.rngState`, mulberry32 — §VM-01-B) | **NOT SHIPPED as stated.** Invariant #6 now requires seeded RNG for anything that persists; the centralization the review praised was real for Battle Mode only. **§DX-02m tracks the 51 remaining unseeded sites — it is an open row, not a closed one.** |
| Save format is `JSON.stringify(S_story)`, no schema version, missing fields default via `_S_DEFAULTS()` merge | intact | **HOLDS** |
| "would not survive 10× growth … at 500 nodes or 800 fields the cost would compound" | at **416 nodes / 193 fields / 5.5× file size**, the full-rewrite render is still the shipped pattern with no measured complaint | **UNDER TEST** — the prediction has not fired yet, and the file is now ~80% of the way to its own stated node ceiling |

---

## III. Defects found during verification

Two dead-data defects surfaced that no gate currently catches. Both are filed to BACKLOG.

1. **`LOOT_TABLE` is dead data with a comment that claims otherwise.** `` `const LOOT_TABLE@24443` `` is declared with the trailing note *"used by `_rollD100Loot()`"* — and the identifier `LOOT_TABLE` occurs **exactly once in the whole file**: on its own declaration line. `_rollD100Loot()` reads `_D100_TABLE` instead. A doc comment asserting a reader that does not exist is worse than no comment, because it is what a reader greps for. → **§DX-02n**.

2. **`S_story.ebReturnsCompleted` is a write-only shadow of `ebReturnDone`.** Both are initialised in `_S_DEFAULTS()` (`` `ebReturnsCompleted: {}@23087` ``) and both are written by the same function (`` `S_story.ebReturnDone[ebCode] = true@30365` `` and the line after it). `ebReturnDone` has **12 readers** — `_curseScore()`, `_missionComplete()`, the 20 `quest_e*_return` completions, the victory screen. `ebReturnsCompleted` has **zero**. It persists into every save file and means nothing. This is the Hazard-#2 class in its quietest form: *a write into a real-but-wrong object never throws*, and here the write is into a real-but-**unread** object, so even a round-trip test would pass. → **§DX-02n**.

Both were in the reviewed file's lineage but neither is mentioned in the original report, which is the honest finding about a 1,009-line architectural review: it enumerated the file exhaustively and still could not see a constant with no readers.

---

## IV. Internal contradictions in the original report

The review contradicts itself twice, in both cases between §VII (Quest & Narrative Systems) and §XI (Mechanics Deep Dive). HEAD resolves both against §XI:

| | §VII.E | §XI.E | HEAD |
|---|---|---|---|
| `_curseScore()` weights | `×3 / ×1 / −5 if all` | `+2 / +1 / −1` | **§VII.E is correct** |
| `_curseScore()` range | −5 … +55 | −20 … +40 | **§VII.E is correct** |
| `_covenantStanding()` labels | Keeper / Warden / Keeper / Watcher / Wanderer | Keeper (True) / Keeper / Sealed / Compromised / Doomed | **§VII.E is correct** |

§VII.E carries a live line pointer (*"HTML line 11102"*) and §XI.E carries none. **The half of the report that cited the code was right and the half written from the design intent was wrong** — which is the whole argument for the `symbol@line` anchor discipline (§DX-01e) that this repo adopted two months later. §XI.E's `pitWins ≥ 5` + `ebNegotiated ≥ 5` True-Keeper gate is not a stale claim; it never shipped.

---

## V. What the review got right

Stated plainly, because the delta table above is long enough to mislead:

- **The thesis survived a 5.5× scale-up.** Flat file scope, one mutable state object per mode, full-section rewrite on state change, synchronous click-to-pixel — all four are unchanged at 38,707 lines, and none of them is what any of the eleven intervening tracks had to fix.
- **The extensibility claim was tested and held.** §XII predicted that adding a narrative beat costs exactly two edits: a flag in `_S_DEFAULTS()` and a guarded injection in the render path. `_S_DEFAULTS()` went 107 → 193 fields by precisely that route, and the three registries §VM-01 later added (`NODE_HOOKS`, `NODE_PANELS`, `NODE_VERBS`) are the *formalisation* of that pattern, not a replacement for it.
- **The cost it named is the cost that came due.** *"A function 3,000 lines from the state object can mutate it silently. There are no enforced invariants. The discipline is entirely in the programmer's head."* Every gate in `npm run check:walk` — all 16 — exists to move one of those invariants out of the programmer's head and into CI. The review diagnosed the failure mode correctly and the repo spent three months building the instruments.
- **The conclusion needs no correction.** *"Choose your constraints deliberately, design everything inside them cleanly, and know exactly what you are trading."* The trades are still explicit. The artifact still opens anywhere.

---

## VI. Scope note

This pass verified structure, counts, formulas and symbol liveness. It did **not** re-derive the review's qualitative sections (§I.C on single mutable state, §X.C on the event model, §XIII on the one-file argument) beyond confirming the code they describe still exists — those are design arguments, and a design argument is not falsified by a count. It also did not audit the ~180 surviving symbols for *behavioural* drift; a function that still exists under its old name may do something else now. That is a larger row than one report.

---

*End of verified report. Original 1,009 lines; verified 2026-08-11 (§DOC-02b).*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
