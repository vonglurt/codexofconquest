<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# AGENTS.md — how an agent works this repo

**Full procedure: [`resume.md`](resume.md) §0.** This file is the short card.

## The two files people confuse

- **`play.html`** (38,700 lines) — **the game.** Everything you fix lives here.
- **`index.html`** (505 lines) — the public landing page. Not the game.

## Read before touching anything

1. [`resume.md`](resume.md) — the procedure, and §3, the row-selection rule.
2. [`docs/backlog/BACKLOG.md`](docs/backlog/BACKLOG.md) — routing index + §RESUME chronology.
3. **[`docs/design/index.md`](docs/design/index.md)** — the master doc index. Doc Health Badge, Lab Report Index, Reverse Lookup, Design Constants, `S_story` fields. **Almost every "where does this live" question is one lookup here.** Read it before the row, update it with the row.
4. The phase file the row lives in — `docs/backlog/BACKLOG-{1..6}-*.md`.

## The loop

```
first row by §3  →  plan, then goal  →  implement  →  close  →  commit  →  push  →  say.sh  →  next row
```

**Do not stop at row boundaries.** The loop runs until the user stops it. Finish the row you are on, then take the next.

**After every commit:** `git push`, then `src/bin/say.sh "<summary written for the ear>"` — never raw macOS `say`.

## The write path — API only

```bash
make wbapi && ./bin/api ping     # restart before EVERY write session
./bin/api get node CLJ
./bin/api put node CLJ battle='{"label":"…","key":"…","count":1}'
./bin/api list quest --q keyword
./run.sh stop                    # before any Playwright run
```

World data goes through `./bin/api`. **Never hand-edit `play.html`'s data sections. Never `curl`.** If the API cannot express it, **add the endpoint to `src/js/wbapi-server.js` first** — that is a real instruction, not a formality. `play.html` directly is for engine JS/CSS only, server stopped first.

The server holds the file text from when it started. A write after a hand-edit silently reverts the hand-edit.

## Verify — in this order

```bash
./bin/api get <type> <id>              # round trip, AFTER a reload, from disk — never "GET agrees with me"
npm run check:walk --prefix src        # 17 gates in parallel, ~10s; the final ✓ N/N line is the verdict
./run.sh stop && npm test --prefix src # 1023 tests, server stopped
```

**Never pipe a test run** — a pipe returns the last stage's exit code. Redirect to a file and read the counts. `check:walk` exists only in `src/package.json`. Each gate carries a **120 s deadline**, so a stuck gate now fails by name instead of hanging (`--timeout` / `GATE_TIMEOUT_MS`, `--jobs` / `GATE_JOBS`; `check:walk:serial` runs the old one-at-a-time chain).

## Non-negotiables

- **Free movement is inviolable.** No quest, flag or item blocks a road. `gate` is *mission-list* metadata, read only in `storyCheckQuests`.
- **Cell = location.** Positions are `{r,c}` via `CELL_GRID`. Never navigate by `N/E/S/W`.
- **Parity-fenced kernels** (`mover`/`rooms`/`duel`) — edit `src/js/*.js`, never the inlined copy, then re-run the checker.
- **Comments: default zero.** Never narrate the change. Survival test — still true and useful in a year to someone who never saw the diff?
- **Anchors name a symbol, not a line:** `` `symbol@1234` ``. Verify the symbol exists — `node src/scripts/resolve-anchors.js <symbol>` — before writing it.
- **No background processes. No subagents.** Synchronous, in-conversation.

## What "done" means — all six

1. Change is in `play.html` (or the named tool/doc) · 2. made **through the API** · 3. **verified** by round trip + gate + test · 4. **row paragraph edited in place** with the number before, the change, the number after · 5. marked `[x] ✅ SHIPPED <date> <sha>` and **cut out of the phase file into `plan-archive.md`** · 6. **§RESUME entry** + `BACKLOG.md` pointer row.

## Two rules that keep the backlog trustworthy

- **Grep to DISPROVE the row first.** Rows go stale. Several have closed as ALREADY SHIPPED — that closure is real work.
- **Anything found on the path becomes a NEW ROW at the TOP of its phase file's open items.** Never done inline. Never dropped.

## If the ground disproves the plan

Say so and replan. Do not implement a plan you have stopped believing. Record the disproof in the row — a measurement that kills a plan is the increment's real product.

## Decision tags

🟢 implement it · 🟡 decide yourself and record the evidence in the row · 🟠 🔴 **ASK** present options with a recommendation and stop.

Ask only when the answer would be **a guess dressed as a decision**. Story answers come from, in order: the adjacent row → `docs/design/` + `docs/story/` + `docs/world/` → `vendor/1367-sources/` (elaboration, never transcription) → the user.
