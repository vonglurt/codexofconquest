<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Contributing — Development Policies & Directives

> **This file holds the *how-we-work* rules.** The list of outstanding work lives in **[BACKLOG.md](BACKLOG.md)**. Reference material lives in **[index.md](index.md)**. This file + BACKLOG.md were split out of the former `plan.md` on 2026-07-09.

## Directive

> You are an expert prompt interpreter with an electrical engineering / computer science background. Follow the policies below: implement ideas from **[BACKLOG.md](BACKLOG.md)**, or append new ideas to the end of that list when told about them. Work incrementally — present one step at a time and wait for "continue."

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

### WBAPI Authoring Hazards (learned 2026-07-08, §KG session — a full session of work was clobbered + recovered from a dangling git blob)

1. **The WBAPI server clobbers non-data edits when its in-memory buffer is stale.** The server holds the FULL file text from *when it started* and patches only data sections (NODE_MAP/QUEST_DB/MONSTER_POOL/…) into that buffer, then writes the whole thing back. If you edit CSS/JS **directly** (Edit tool / editor) while the server has been running since *before* those edits, the next `api.sh` WRITE (post/put/del node, highway, …) **re-saves the stale buffer and silently reverts your CSS/JS** — the advertised "auto-reload on external edit" only re-parses data sections, not the full text buffer. This ate this session's inventory/map/hunt work **and** pre-session §MP-MAPTABS at once (recovered via `git cat-file` of a dangling blob that had been staged mid-session — `git cat-file --batch-all-objects | grep` a known signature). **Rule: before any api.sh WRITE session, restart the server so it re-reads the current file** (`./wbapi-toggle.sh stop && start`); the monitor auto-restarts it, so **verify the PID is new AND a CSS/JS signature survives the first write** (`grep -c _monsterLevel roll2hit-v3.html`). When hand-editing CSS/JS, stop the server first. Commit early; keep a `/tmp` backup.
2. **`api.sh post monster` is BROKEN for this codebase — do NOT use it.** It echoes a correct entity in the JSON response but serializes a MALFORMED line into the **wrong section** (the trophy-drops map, not MONSTER_POOL), dropping `dmgDie/dmgCount/dmgFlat` and writing `tier:NaN` (coerces the string tier as a number). **Author new monsters via direct HTML edit** in MONSTER_POOL (`{key,name,ac,hp,atk,dmgDie,dmgCount,dmgFlat,tier}`); `post node` / `post quest` / field PUTs are fine.
3. **Node routability ≠ the legacy edge graph.** A node inserted on **land contiguous with the main landmass is automatically walk-routable in the live game** (the mover walks cell-by-cell; `./api.sh reachability` — the walk-graph BFS from LHR — is the authority, and the game's own `_roadGridPath` confirms). It is NOT automatically on the **road/highway** net. **Ignore `worldmap --route` / `cluster-bridge` for routability** — they report the abandoned explicit node-edge graph (409 "isolated clusters") the game stopped using in §NAV-01; a node only truly fails to route if placed on sea / a sea-locked island.
   - ⚠️ **`./api.sh highway <a> <b> --execute` does NOT lay road cells (learned 2026-07-08, §KG Inc 2).** Despite its "lays a road" framing, it adds **sparse `junction:true` waypoint NODES** every ~4 cells (J-codes) and **zero `ROAD_RUNS`/`ROAD_CELLS`** — the gaps between junctions stay plain terrain (encounters). Worse, each junction node **violates check:invariants** (I1 `junction` terrain absent from WORLD_DB → midlands fallback; I2 `junction:true`) and check:roads R2, and auto-names "The <label>–<label> Road" (a label starting with "The" → "The The…" double-article). Since a contiguous-land node is **already walk-reachable without any highway**, don't reach for `highway` just to connect corridor nodes. **To make a corridor genuine encounter-free road (`road:0` rate), edit `ROAD_RUNS` directly** — add `row: [[colStart,colEnd],…]` ranges tracing the path, avoiding node cells (R3), anchoring both ends to cells already on the net; the server reads `ROAD_RUNS` from the same file so client==server stays consistent (verify `check:terrain` A3 + `check:roads`).
   - ⚠️ **`./api.sh del node J##` is buggy for junction nodes (learned 2026-07-08).** It reports "deleted" and removes the entry from the server's in-memory model but does **NOT** patch the NODE_MAP/NODE_COORDS text out of the file → model/file desync. Remove junction entries (and their bidirectional `E:/W:` back-links on neighbor nodes) by hand, then restart the server to resync model=file.

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
