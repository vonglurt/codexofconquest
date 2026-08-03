<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Contributing — Development Policies & Directives

> **This file holds the *how-we-work* rules.** The list of outstanding work lives in **[BACKLOG.md](BACKLOG.md)**. Reference material lives in **[index.md](index.md)**. This file + BACKLOG.md were split out of the former `plan.md` on 2026-07-09.

## Directive

> You are an expert prompt interpreter with an electrical engineering / computer science background. Follow the policies below: implement ideas from **[BACKLOG.md](BACKLOG.md)**, or append new ideas to the end of that list when told about them. **Before implementing any row, verify the work doesn't already exist — see the Existing-Work-First Policy below.** Work incrementally — present one step at a time and wait for "continue."

### Existing-Work-First Policy (learned 2026-07-28 — two live sessions independently started §VM-01-G2)

**Never start a row without first proving the work isn't already done, in progress, or half-shipped.** This failure mode is recurring and measured: §GR-D, §DESIGN-03, §DUNGEON-01, and §FUTURE-01 were each opened as build work and closed as **ALREADY SHIPPED** after an audit (the only real fix was usually a doc sync); §DX-01b's entire premise was disproved by measurement; and on 2026-07-28 two concurrently running sessions both picked up §VM-01-G2 from the same §RESUME entry — the second one caught the collision only because its greps stopped matching its own earlier reads mid-survey.

Before starting any BACKLOG row, in order:

1. **`git status` + `git log --oneline -5` first.** Uncommitted changes or fresh commits matching the row mean the work exists — a prior session shipped it uncommitted, or another session is doing it *now*. Evaluate and finish/commit what exists; do not redo it.
2. **Check for a concurrent session before editing shared files:** `ps aux | grep -c ' claude$'`. More than one live session → stop and ask the user which session proceeds. Two agents editing `roll2hit-v3.html` (or BACKLOG.md) concurrently will clobber each other.
3. **Grep-before-building, in the disprove-the-row direction.** The row's premise is a claim about the code; grep for the feature/flag/panel it says is missing. The row may predate work that already landed (rows drift stale; ship records lag).
4. **Cross-check data claims against the live file:** `./api.sh audit` / `./api.sh list <type>` (this is API-First rule 5 — it applies to *reading* a row, not just writing one).
5. **Mid-session drift is a red flag, not noise.** If a grep or read stops matching what you read minutes ago, do not shrug and continue — re-run `git status`, compare mtimes, and check for the concurrent session (rule 2). The file changing under you is how the 2026-07-28 collision was caught.

A row that turns out to be already done still gets closed properly: record the audit evidence in the row, sync the docs, and mark it `[x]` "CLOSED as ALREADY SHIPPED" — that closure is real work and prevents the *next* session from starting it again.

### API-First Development Policy

**Preferred workflow for any data addition or edit to `roll2hit-v3.html`:**

1. **Check API first** — before editing HTML, use `./api.sh` to confirm current state: `./api.sh ping`, `./api.sh list <type>`, `./api.sh audit`. Direct HTML edits are a fallback only when the API cannot yet express the operation.
2. **Write the API method first** — if the operation isn't yet supported, add the endpoint to `wbapi-server.js` and restart before touching the HTML.
3. **Create/modify via API, not HTML** — preferred: `./api.sh post <type> [k=v ...]` or `./api.sh put <type> <id> [k=v ...]`. The tool handles nonces automatically and queues all requests with retry.
4. **Restart server after adding endpoints** — `./wbapi-toggle.sh restart` (or `start` if stopped).
5. **When adding items to BACKLOG.md** — cross-reference current state with `./api.sh audit` and `./api.sh list <type>` to confirm what actually exists vs. what the plan assumes.

> *«cli-quick-reference» archived to plan-archive.md (2026-07-02). Day-to-day: ./api.sh help. Full reference: docs/api/wbapi-help.md + docs/api/API-README.md.*

**Single source of truth:** `roll2hit-v3.html` is the entire game. The API reads its text directly and writes mutations back in-place. `wbapi-server.js` and `worldbuilder.html` are authoring tools — the game requires neither at runtime.

### Cell-First Navigation Policy

**Cell = Location.** All map locations are identified by `(r, c)` cell coordinates. The two-letter node code is a lookup alias for a named cell, not a location pointer. Use `CELL_GRID["r,c"]` to resolve coordinates to node codes. Do not navigate by chasing `N/E/S/W` pointer fields — those were stripped in §CELL-01. When writing new features:

- Positions travel as `{ r, c }` pairs.
- Node codes are resolved from position: `CELL_GRID[\`${r},${c}\`]`.
- "Adjacent" means `(r±1, c)` or `(r, c±1)` — not stored edge links.
- Quest activation checks: `CELL_GRID[\`${s.r},${s.c}\`] === quest.activateNode`.

### Free-Movement / Mission-Gating Policy

**The world is freely traversable. Quests never block movement. "Gating" applies only to the *mission list*, never to a *road*.**

This is a hard invariant, not a preference. Two distinct, non-overlapping mechanisms — keep them separate:

1. **Movement gating = terrain/geometry ONLY.** A step is refused for exactly two reasons (`mover.js` / inlined `moverMove`): `'oob'` (off the grid) and `'sea'` (destination cell is in the `impassable` set — sea + `IMPASSABLE_CELLS`). **No quest, flag, `S_story` field, mission bit, or item may ever cause a step to be refused.** There is no "blocked road," no "locked gate on a path," no "come back when you've done quest X to pass here." Water crossings are carried as **SEA_LANES land bridges** (passable cells), not as conditional barriers. If a future feature needs a place to feel impassable until something happens, it must do so by **changing terrain/`CELL_GRID`/`IMPASSABLE_CELLS` state** (the cell genuinely becomes/stops-being sea), *not* by consulting quest state inside the mover.

2. **Mission gating = quest `gate` ONLY (listing, not traversal).** A quest's `gate` (UQF) / legacy `activateCond` decides **whether a mission is *offered/listed* when you arrive at its `activateNode`** — consulted in exactly one place, `storyCheckQuests` (`if (q.schema==='UQF-1.0' && !QuestRuntime.canActivate(q.id)) return;`). An unsatisfied gate means the quest simply isn't added to your journal yet (e.g. act 2 of an arc lists only after act 1 passes — sequential **mission availability**). You always reached the node freely; only the *listing* was deferred. `gate:{}` = always listed; `gate:{flags:[…]}` = listed once the prior flag is set. **`gate` is mission metadata; it must never be read by the mover or any movement/entry code.**

**Allowed:** gating mission *listing* (sequential arc unlock, prerequisite missions, flag/node/battle-conditioned availability). **Forbidden:** gating *movement* on quest/flag state (a quest that bars a road, an exit that won't open until a mission is done, an NPC who physically blocks a cell).

> *«free-movement-enforcement-audit» archived to plan-archive.md (2026-07-02). Re-run the mover-gate greps (archived) before shipping any movement or quest-availability change.*

> *«incremental-recitation-rule» archived to plan-archive.md (2026-07-02). Applies only when writing vignette content: say each segment aloud, write incrementally, commit + speak per vignette.*

### Host/Script Separation Policy (§VM-01)

**`QUEST_DB` is script; `QuestRuntime` is the host. That boundary is the architecture — widen it through the grammar, never around it.**

The file already runs this split twice, and both are worth protecting:

1. **The three parity-fenced kernels** — `MOVER:CORE:START@9801` · `ROOMS:CORE:START@9872` · `DUEL:CORE:START@10125`. Pure, world-injected, byte-identical to `js/{mover,rooms,duel}.js`, asserted by `scripts/check-*-parity.js`. They take a `world` and return plain data; they never read `S_story` and never touch the DOM.
2. **The UQF VM** — 2,850 quests (11,106 lines) executed by a 258-line `QuestRuntime` through the `BIT_CONTRACTS` opcode table (`const BIT_CONTRACTS@21839`). A 43:1 data-to-engine ratio. This is an embedded scripting host in the Lua sense, and it should be treated as one.

The rules that keep those true:

- **Control flow belongs to the VM, never to a leaf handler.** `skill_check` currently smuggles its own branch (`resolveSkillCheck` → `execBits(pass ? bit.onPass : bit.onFail)`, `execBits(pass ?@22116`) because `execBits` has no conditional of its own. That is the exception to retire (§VM-01-A), **not** the pattern to copy. Do not author a handler that branches, loops, or waits internally.
- **New shapes go in the grammar, not in a new single-use term.** The gate grammar has an expression evaluator (§VM-01-F, shipped): a gate node may be `{all:[…]}` / `{any:[…]}` / `{not:…}` over the existing leaf terms, and a bare gate is an implicit `all`. `itemsMinAny` (added for exactly one quest, `quest_wm_01`, because an OR was inexpressible in OR position) has been **deleted** — `quest_wm_01` now says it as `{any:[{flagsAny:…}, {itemsAll:[{name,min}]}]}`. **Before adding a gate term, express it with `{all|any|not}` nesting over the terms that exist.** A new leaf term is justified only when it names a *new state predicate* nothing existing can read — never to get a boolean shape the grammar already provides.
- **No arbitrary code in quest data.** `_legacy_fn` (contract at `_legacy_fn:  {@21862`) is a *closing* escape hatch, not an extension point. Every `_legacy_fn` in `QUEST_DB` is a quest the soft-lock prover (§VM-01-E) cannot see through — e.g. `quest_1367_f_plague` (`quest_1367_f_plague: {@13833`), whose `fn` reaches straight into `S_story.faith_folk`. **Do not author new ones.** Port to a declarative bit, or open a §VM-01 row for the bit kind that's missing.
- **Game-state randomness must come from the seeded stream.** The server rolls encounters from `seededNext(s)` off `s.rngState` (`js/wbapi-server.js:function seededNext@1147`, mulberry32, replayable), and **since §VM-01-B shipped the client draws the same stream for the same event** (`_seededNext() < baseRate@28255` off `S_story.rngState`), so a save fully determines the encounter/skill/loot rolls that follow it. What still diverges is the *weighting*, not the stream: the MUD session tracks no progression, so it uses flat tier weights where the client scales them with notoriety — the server's own comment (`js/wbapi-server.js:a known SP/MP@1156`) calls that *"a known SP/MP divergence."* **Do not add `Math.random()` calls that affect game state** — encounter, skill roll, loot, drop, monster pick. Cosmetic/presentational randomness is fine and stays fine.
- **Shared client/server logic uses the parity pattern or it does not ship.** Sentinel comments + a `js/*.js` twin + a `scripts/check-*-parity.js` wired into `npm run check:walk`. In a single file with no build step there is no fourth way to share code. **Never edit an inlined copy** — edit `js/<mod>.js`, then re-run the checker.
- **Purity claims must be true.** `_rollSkill` is labelled *"Pure roll"* (`Pure roll@22092`) and consumes the one-shot iodine buff and reads the live sheet through `getState` — the label was never true, and §VM-01-B moving its d20 off `Math.random()` onto the injected seeded stream did not make it so. If a comment says pure, the function takes its inputs as arguments and returns its outputs — no exceptions, no "pure means single-source-of-the-math."

> **Diagnosis + evidence:** `lab-reports/lab-report-javascript-mud.md` (structural read: five layers, four execution traces) plus the verification recorded in the §VM-01 track in **[BACKLOG.md](BACKLOG.md)**. One-line summary: *the VM has an opcode table and no jump instruction.*

### Loop vs. Ask Rule

Before starting any task:

- **Loop tasks** (no user input needed — clear next step): begin immediately, state what you are doing in one sentence.
- **Ask tasks** (user decision required): present a yes/no or choice prompt. Then run:
  ```bash
  say "If you say yes: <one sentence describing the intention and outcome of yes>"
  ```

### Commit + Speak Rule

After every `git commit`, immediately run:

```bash
say "<commit subject line>"
```

Read the **subject line only** aloud via macOS `say`. This confirms the commit completed and anchors the session.

### Test-Run Rules (learned 2026-07-03, §NAV-01h session)

1. **Never trust a piped test run's exit code.** `npx playwright test … | tail -N` (or `| grep`, `| tee` without `pipefail`) returns the LAST pipe stage's exit code — a suite with 46 failures reported `exit 0` twice this way and the failure list scrolled past the tail window. Either run the suite bare and check `$?`, or redirect to a file (`> run.txt 2>&1; echo exit=$?`) and read the summary line (`N failed / N passed`) from the file. The pass/fail verdict comes from the summary counts, never from a truncated tail.
2. **Stop the WBAPI server before running Playwright suites** (`./wbapi-toggle.sh stop`). A live server on :1367 lets the boot-time `probeServer()` auto-load replace the injected mock world in every non-hermetic describe — 46 false failures + ~8 min retry burn; the same walk suite is 89/89 in 22 s with the server stopped. (Known inverse: 2–3 `worldbuilder-crud-arrays.test.js` itemChain tests currently *need* the server to dismiss the welcome screen — §NAV-01 follow-up 5 migrates them to the hermetic pattern.) Restart the server after the run.

### Doc-Anchor Policy — an anchor names a SYMBOL, not a line (§DX-01e, 2026-07-31)

**Every pointer from a doc into the code is written as one token: `` `symbol@1234` ``.** The **symbol** is the pointer — any literal substring of the line you mean (`` `const WORLD_DB@6279` ``, `` `execBits(pass ?@22116` ``, or file-qualified `` `js/wbapi-server.js:function seededNext@1147` ``). The **number is a cached hint**, refreshed mechanically.

Why: a bare line number is *generated* by every edit above it. When this policy was written, **43 of the 50 anchors in the live docs were stale** and a 14-anchor sample had **9 pointing at unrelated code** — `21556` for `BIT_CONTRACTS` was off by 283 lines, `27685` for the client encounter roll by 559. A rotted anchor is worse than none: it reads as authoritative and sends the next session to the wrong place. Same lesson §DX-02e and §DX-02f each landed on from the test side — **pin the property, never the generated coordinate.**

```bash
npm run anchors                            # audit every doc  (= check:walk gate #15)
npm run anchors:fix                        # refresh every drifted line hint
node scripts/resolve-anchors.js <symbol>   # where does this live NOW?
```

- **The gate fails on a DEAD symbol** — one that is nowhere in the HTML, i.e. renamed or removed with the doc still naming it. It resolves at identifier boundaries, so `XP_BY_TIER` → `XP_BY_TIER_RETIRED` stays dead instead of matching by prefix.
- **It only WARNS on a drifted number.** Failing there would re-create the per-increment tax the policy exists to remove.
- **`` `symbol@1234` `` is the documented placeholder** and is skipped by the tool — a doc can show the convention without `--fix` re-pointing the example.
- **Closed ship records and lab reports keep their bare numbers — history is annotated, not rewritten** (the §DX-02c / §AUDIT-03m precedent). Never trust a number in `plan-archive.md`; re-resolve the symbol.
- **Every LIVE doc is migrated as of 2026-08-03 (§DX-01e-FU).** `potential.md` — the seed inbox, whose anchors are read to *build from* — was the last one, and 35 of its 36 anchors pointed somewhere else by the time they were measured. What is still bare is history by construction: `plan-archive.md` (211) and the lab reports (~300). **A doc you write anchors in is a live doc; use the symbol form from the first draft.**

### WBAPI Authoring Hazards (learned 2026-07-08, §KG session — a full session of work was clobbered + recovered from a dangling git blob)

1. **The WBAPI server clobbers non-data edits when its in-memory buffer is stale.** The server holds the FULL file text from *when it started* and patches only data sections (NODE_MAP/QUEST_DB/MONSTER_POOL/…) into that buffer, then writes the whole thing back. If you edit CSS/JS **directly** (Edit tool / editor) while the server has been running since *before* those edits, the next `api.sh` WRITE (post/put/del node, highway, …) **re-saves the stale buffer and silently reverts your CSS/JS** — the advertised "auto-reload on external edit" only re-parses data sections, not the full text buffer. This ate this session's inventory/map/hunt work **and** pre-session §MP-MAPTABS at once (recovered via `git cat-file` of a dangling blob that had been staged mid-session — `git cat-file --batch-all-objects | grep` a known signature). **Rule: before any api.sh WRITE session, restart the server so it re-reads the current file** (`./wbapi-toggle.sh stop && start`); the monitor auto-restarts it, so **verify the PID is new AND a CSS/JS signature survives the first write** (`grep -c _monsterLevel roll2hit-v3.html`). When hand-editing CSS/JS, stop the server first. Commit early; keep a `/tmp` backup.
2. **`api.sh post monster` — ✅ FIXED 2026-07-30 (§DX-01c); the hand-edit exception is retired.** Author monsters through the API like everything else:
   ```bash
   ./api.sh post monster key=dock_rat name="Dock Rat" ac=11 hp=6 atk=2 dmgDie=4 dmgCount=1 dmgFlat=0 tier=trivial
   ```
   All nine fields are **required** and validated; `tier` is a **string** (`trivial|easy|medium|hard|deadly`). An incomplete or wrong-schema body is now rejected **422 with the field list, nothing written** — it no longer half-writes. A new monster is created with **no terrain**; place it with `./api.sh put terrain <key> monsters=[…]`.
   *What it used to do (the old Hazard #2, kept because it names a defect class):* it echoed a correct entity in the JSON response while splicing a malformed line into the **wrong section** — the trophy-drops map, not MONSTER_POOL — because `MONSTER_DROPS` is **nested inside** MONSTER_POOL's anchors, so "the last `};` before MONSTER_POOL:END" was the drops map's brace. It also dropped `dmgDie/dmgCount/dmgFlat` entirely and ran the string tier through `Number()` → `tier:NaN`. **The lesson that outlives it: a write that lands in a real-but-wrong object never throws.** Section-close arithmetic now goes through `WBAPI._sectionCloseIdx`, which stops at the first nested START anchor; `tests/integration/dx01c-monster-create.test.js` pins both the placement and the trap.
   ✅ **`./api.sh del monster <key>` — FIXED 2026-07-30 (§DX-01i); see Hazard #5 below for the whole DELETE family.**
3. **Node routability ≠ the legacy edge graph.** A node inserted on **land contiguous with the main landmass is automatically walk-routable in the live game** (the mover walks cell-by-cell; `./api.sh reachability` — the walk-graph BFS from LHR — is the authority, and the game's own `_roadGridPath` confirms). It is NOT automatically on the **road/highway** net. **Ignore `worldmap --route` / `cluster-bridge` for routability** — they report the abandoned explicit node-edge graph (409 "isolated clusters") the game stopped using in §NAV-01; a node only truly fails to route if placed on sea / a sea-locked island.
   - ✅ **`./api.sh highway <a> <b> --execute` — DEPRECATED and REFUSED 2026-07-30 (§DX-01d).** It now dies up front (before the coordinate fetch, so it needs no server) with the road recipe below; **route planning still runs free** without the flag. *What it used to do, kept because the class recurs:* despite its "lays a road" framing it added **sparse `junction:true` waypoint NODES** every ~4 cells (J-codes) and **zero `ROAD_RUNS`/`ROAD_CELLS`** — the gaps between junctions stayed plain terrain (encounters). Each junction node **violated check:invariants** (I1 `junction` terrain absent from WORLD_DB → midlands fallback; I2 `junction:true`) and check:roads R2, and auto-named "The <label>–<label> Road" (a label starting with "The" → "The The…" double-article). J14/J15 — the two invariant reds that sat red until §DX-01a — came from exactly this. Since a contiguous-land node is **already walk-reachable without any highway**, there was never a reason to reach for it. **To make a corridor genuine encounter-free road (`road:0` rate), edit `ROAD_RUNS` directly** — add `row: [[colStart,colEnd],…]` ranges tracing the path, avoiding node cells (R3), anchoring both ends to cells already on the net, then `node scripts/build-roads.js --apply`; the server reads `ROAD_RUNS` from the same file so client==server stays consistent (verify `check:terrain` A3 + `check:roads`).
   - ✅ **`./api.sh del node J##` — FIXED 2026-07-30 (§DX-01d).** The defect was never junction-specific; see Hazard #5.
5. **DELETE persists at source level — ✅ FIXED 2026-07-30 (§DX-01d/i). The defect class is worth keeping.** Every `WBAPI.<collection>.delete()` used to be one line — `delete WBAPI.<collection>[key]` — and nothing more. `save()` writes `_rawSrc`, which was never touched, and the server's generic `DELETE` handler never called `saveAndVerify` at all, so **the entry came back on the next parse while the operator had already been told `✓ deleted`.** Measured live on a copy of the shipped file: `monster`, `quest` **and** `node` all returned `ok:true`, all left `_rawSrc` byte-identical, all three survived save+reload. It was filed as a `del monster` bug and a junction-only `del node` bug; it was **neither — it was the whole DELETE family, for every key**, and `WBAPI.deleteNodeSource` (the one function that did patch the source) was **dead code nothing called**.
   **This is the exact mirror of Hazard #2's create bug — a write path that reports success without persisting — and the standing lesson holds in both directions: the failure is silent because nothing ever throws.** Whenever you add a write path, the acceptance test is a **round trip**: save, re-parse, and assert the change is still there (or still gone).
   Now: `WBAPI.deleteEntrySource(section, key)` is the single source-level deleter, sharing **one** comment/string-safe scanner with `check:dupkeys` (`WBAPI._scanTokens`) so the audit gate and the writer can never disagree about what an entry is. It is **verify-or-revert** — after the splice, the section's depth-1 key multiset must differ by exactly one instance of `key`, or the splice is rolled back and the delete fails loudly instead of corrupting the section. Deletes **cascade**: a node takes its `NODE_COORDS` row, a monster takes its `MONSTER_DROPS` trophy, so no orphan is left for `./api.sh audit` to find. The dependency guards (`blockedBy`) are unchanged, and a blocked or refused delete writes **nothing**. Pinned by `tests/integration/dx01di-delete-persists.test.js` (8 cases, incl. the 20 largest nested UQF bodies).

6. **Terrain PUT persists at source level — ✅ FIXED 2026-08-03 (§DX-02h). Hazard #5's class in a fifth write path, and the read path was corroborating the lie.** `PUT /api/terrain/{key}` set `WBAPI.worldDb[key][field]` in memory, returned `ok:true` with the updated entity echoed, and **never called `save()`**. Unlike the DELETE family — where the entry visibly came back on the next parse — the mutation lived in the loaded model, so **`GET /api/terrain/{key}` read the phantom edit back for the rest of the process's life**; only a restart revealed that nothing had been written. Root cause: `editField`/`editStructuredField` both carried a `sectionMap` with no `terrain` entry, so **`WORLD_DB` had no source-level writer at all** and the handler had nothing to call. Now `terrain` is in the map, and rosters get their own writer — **`WBAPI.editTerrainRoster(key, monsterKeys)`**, because `WORLD_DB` is the one collection whose array field holds **code identifiers** (`monsters:[ P.giant_rat, … ]`) rather than JSON: routing it through the generic `editStructuredField` would emit `["giant_rat"]`, which re-parses to a string array. Nothing throws — `_buildIndexes` maps strings fine — but the **game** reads `WORLD_DB[t].monsters` as stat blocks, so `_monsterLevel` would score every entry 1 and `_weightedMonsterPick` would weight on `undefined`. It validates every key against `MONSTER_POOL`, **re-parses the patched section and proves the roster reads back before committing** (refuse-rather-than-corrupt, as `deleteEntrySource` does), and the server verifies the whole thing again after the disk reload. Duplicates are **allowed, not rejected** — `cat_quarter` ships one (`fluffy_cat` ×2), and a writer that cannot express what the corpus already holds cannot round-trip it; it warns instead. **The standing lesson is now proved in three directions (create §DX-01c, delete §DX-01d/i, update §DX-02h): a write path's acceptance test is a ROUND TRIP — save, re-parse, assert the change survived — and "GET agrees with me" is not that test.**

7. **`WBAPI.save()` requires a destination — ✅ FIXED 2026-08-03 (§DX-02k). A write path can also fail by writing somewhere you were never told about.** `save(outputPath)` used to fall back to `getStampedName()`, which returns a **bare filename** (`roll2hit-v3-YYYYMMDD-HHMMSS.html`); `fs.writeFileSync` resolves a bare name against the **process CWD**, so every argless caller dropped a ~5.4 MB copy of the whole game wherever it happened to be running, and nothing ever removed it. The row that filed this assumed the argless callers were stray scripts — **the server's own per-write path was argless.** `saveAndRestart`/`saveAndVerify` ran `WBAPI.save()` → dated snapshot in the CWD → `copyFileSync(snapshot, GAME_FILE)` → snapshot **left behind, once per successful PUT/POST/DELETE**. The snapshot was never a backup of the pre-write state (it holds the *new* text); its only job was to be the byte source of the copy. It read as "the repo root" only because that is where the server runs, and it was invisible because `roll2hit-v3-2*.html` is gitignored. **Now the destination is always explicit:** `save(dest)` writes exactly there and **refuses** with no argument · `WBAPI.saveStamped()` is the deliberate dated backup and lands **beside the source file**, not the CWD (`POST /api/save`, `wbapi save`, the bulk-fix and junction-nuke endpoints) · the server's per-write persist is **`saveGameFile()`** — a temp beside the game file plus an **atomic rename**, which also means a reader can never catch a half-written game file, and on failure the temp is kept and its path returned. Snapshots for the `milepoints/patches` chain still come from where the workflow always said they did: a deliberate `cp` (or `POST /api/save`), not a side effect of authoring. Pinned by `tests/integration/dx02k-save-destination.test.js` (6 cases; the durable one is the inverse assertion that **no shipped code calls `WBAPI.save()` with no destination**). **The lesson: "did it persist?" is only half of a write path's acceptance test — the other half is "and nowhere else."** A stray write throws nothing, changes no behaviour, and is found only by looking at the directory. **§DX-02l (2026-08-03) closed the reporting half:** that directory is gitignored, so `./api.sh snapshots` is now the only thing that will ever tell you what is in it, and `./api.sh save` is the wrapper the deliberate-backup endpoint never had (verifying §DX-02k needed raw `curl` — the golden rule read from the other end). The sweep **refuses a snapshot the `milepoints/patches` chain has never patched**, because `archive-snapshots.sh` records a delta *and then* removes the file: an unarchived snapshot is the only copy of that state, so discarding it takes `--force`.

### Lab Report Policy

Write a new `lab-reports/lab-report-<title>.md` when any of the following is true:

| Trigger | Examples |
|---------|---------|
| Major collection added or redesigned | New monster group, terrain cluster, NPC faction, item economy |
| Large redesign touching multiple systems | Weapon drop overhaul, Luck Stat, fishing bait sub-system |
| New narrative theme or arc | New quest chain spanning 3+ nodes, new named faction, new NPC arc |
| Design review before implementation | IEEE-format spec locking data shapes and flow before any HTML edit |
| Session postmortem with non-obvious decisions | Choices that won't be recoverable from code or core docs alone |

Do **not** write a lab report for: a single monster/quest addition, a value correction, or small additions that fit in an existing doc section.

### Design Constants & State Fields

> **Moved to `index.md`** — see "Design Constants Quick Reference" and "State Fields Quick Reference (S_story)" sections there.

---

*© 2026 Paul Richeson — MIT License.*
