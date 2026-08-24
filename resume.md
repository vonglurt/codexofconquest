<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# resume.md — how to re-enter the backlog loop

> **What this file is.** A restatement, in full, of the standing directive this
> repository is worked under, plus the exact prompt to paste into a fresh session
> to resume the loop. It is written for a reader with no conversation history:
> everything needed to pick up the next row and ship it is either here or named
> here by path.
>
> **This file is a procedure, not a record.** It does not track which rows are
> done — the six `docs/backlog/BACKLOG-*.md` files and `docs/backlog/plan-archive.md`
> do that. Written 2026-08-23.

---

## 1. The prompt — paste this to resume

The directive in full. Everything below §1 is the same instruction expanded; this
block is the whole of it, and a cold session needs nothing else to start.

```
Read resume.md, docs/design/index.md and docs/backlog/BACKLOG.md, then resume the
backlog loop.

ONE ROW PER "CONTINUE". Take exactly one open row, take it as far as it goes, and
stop. Never start a second row without being asked.

Pick it by the selection rule: an unfinished increment first (git status dirty, or
the newest §RESUME entry names a row still open), then a gating row, then phase
order 1→6 and top-to-bottom within the file, preferring 🟢 over 🟡 over 🟠/🔴.

Prove the ground before you touch it — git status, git log, one live session only,
and grep to DISPROVE the row. Rows go stale; a row that turns out already shipped
is closed as ALREADY SHIPPED, and that closure is real work.

Measure the number the row claims, re-derived at HEAD, before you change anything.

Decide on behalf of the backlog wherever the evidence is in the repo. 🟢 implement
it. 🟡 make the call yourself and record the evidence in the row. 🟠/🔴/ASK: present
the options with a recommendation and stop. Ask only when the answer would be a
guess dressed as a decision.

Write world data through ./bin/api only — never by hand-editing play.html's data
sections, never by curl. If the API cannot express it, add the endpoint to
src/js/wbapi-server.js first. Restart the server before any write session. Stop it
before Playwright. play.html directly only for engine JS/CSS, server stopped first.

Verify by round trip: re-read through the API after a reload, then the gates. Never
"GET agrees with me". Tests run in the foreground, never piped.

Measure the same number again and show it moved.

Anything found on the path that is not this row becomes a NEW ROW in the phase file
whose subsystem it belongs to. It does not get done inline and it does not get
dropped. That rule is why this backlog is trustworthy.

Read docs/design/index.md before the row and update it with the row — the badge, the
Lab Report Index, the constants. Write every reference as a noun with the verb
intended on it, one line, with the command that measured any number beside it.

Close the row properly: edit the paragraph in place with what shipped and the
evidence, mark it [x] ✅ SHIPPED <date> <sha>, CUT IT OUT of the phase file and paste
it into plan-archive.md, add the §RESUME entry and the BACKLOG.md pointer row.

Then commit, push, and speak the summary with src/bin/say.sh — never raw macOS say.

Then HAND OFF: a numbered next-steps list in the reply, and STOP. Ask me before
taking the next row. I will say "next" or "continue".

No background processes. No subagents. Everything synchronous, in this conversation.
```

Shorter form, once a session is warm:

```
next
```

That single word means: **close the increment you are on if it is not closed, then
take the next row by the selection rule and run the full procedure on it.** It is
not permission to start three rows, and it is not permission to skip the hand-off.

---

## 2. What I understand the directive to be

### 2.1 The shape of the work

This repository is a single-file game — **`play.html`**, 5.5 MB, 38,712 lines, 416
nodes, 2,853 quests, 398 monsters, 111 terrains, 204 NPC profiles, no build step,
no server at runtime. Everything else in the repo exists to *author*, *verify*, or
*describe* that one file. `edit.html` is the visual editor; the WBAPI server on
`localhost:1367` is the write path; `docs/` is the two-way-synced description of
what the file contains.

The outstanding work is a backlog of **175 sections** split across six phase files:

| Phase | File | Scope |
|---|---|---|
| 1 | `docs/backlog/BACKLOG-1-playable-truth.md` | shipped content the player can never reach |
| 2 | `docs/backlog/BACKLOG-2-engine-systems.md` | combat math, XP, progression, save state, the quest VM |
| 3 | `docs/backlog/BACKLOG-3-content-narrative.md` | authored strings and the people who say them |
| 4 | `docs/backlog/BACKLOG-4-world-navigation.md` | the map and moving on it |
| 5 | `docs/backlog/BACKLOG-5-platform-tooling.md` | WBAPI server, editors, parse/export, mesh |
| 6 | `docs/backlog/BACKLOG-6-verification-docs.md` | CI gates, suites, anchors, doc rot, §DOC-02 |

`docs/backlog/BACKLOG.md` is no longer a row list — it is the **routing index**: the
directive, the phase table, and the cross-phase §RESUME chronology (149 entries,
newest first). Read it top-down to learn *what happened last*; open the phase file
named in the right-hand column for the entry in full.

### 2.2 The loop

**One increment per "continue."** Not two. Not a sweep. The user says `next` or
`continue`; I take exactly one row, take it as far as it goes, and stop with a
hand-off. Every increment must survive a context switch — if the session were
killed the moment I stopped, the next session must be able to pick up from the
committed tree, the edited row, and the §RESUME entry alone.

**Decisions are mine to make where the backlog authorizes it.** Rows are tagged:

- 🟢 **no design call** — mechanical. I implement it without asking.
- 🟡 **one design call** — I make the call myself if the row, the sibling rows, the
  design docs, or the source texts settle it; I state the call and the evidence in
  the row. I ask only when the answer would be a *guess dressed as a decision*.
- 🟠 / 🔴 / **ASK** — I present the options with a recommendation and stop.

The standing instruction is to **decide on behalf of the backlog wherever the
evidence is in the repo**, and to escalate only what genuinely needs the author.
Where I must guess between two readings that produce materially different content,
I read further — more backlog rows, `docs/design/`, `docs/story/`, `docs/world/`
— and only then ask.

### 2.3 Where story answers come from

When a row needs *content* and not just a fix — a line of dialogue, a mission's
premise, a name, a reason a thing happens — the answers are drawn, in this order:

1. **The backlog itself** — an adjacent row usually already names the intent.
2. **The maintained design docs** — `docs/design/index.md` (the master index,
   design constants, `S_story` field table), `docs/design/`, `docs/story/`,
   `docs/world/`, `docs/mechanics/`, `docs/maps/`.
3. **The source corpus** — `vendor/1367-sources/`, in particular
   **`vendor/1367-sources/All Phases Imported/`** (350 files: the public-domain
   texts each region's arcs were imported from — the *Iliad* at ATH, the *Kalevala*
   at ALF, the *Ramayana* at ADA, *Genji* at AMS, *Knights of the Cross* at ARN,
   Mandeville at BEY, and so on), plus `vendor/stories/` (the Froberger journal,
   the Littoral Courts story, Saul→Paul). `vendor/1367-sources/index.md` is the
   canonical node registry for the 1367 AD historical layer, with the two-letter
   / three-letter code rule and each node's book of origin.
   **These are for elaboration, not transcription** — the named artifacts inspire
   the storyline; they do not get pasted into it.
4. **The user** — a direct question, when the above does not settle it.

The world is 1367 AD, historically anchored, with a Void/Codex-Shard fantasy spine
over it. New content must sound like it belongs to the region and the book its
node was imported from.

### 2.3a Read the index, and write references the way this repo reads them

> **Reiterated by the user 2026-08-23, and binding on every increment.**

**Read `docs/design/index.md` at the start of every session, before touching a
row.** It is the master index: the Doc Health Badge (recount it — `wc -l play.html`,
`ls docs/lab-reports/*.md | wc -l`), the Repository Structure map, the Lab Report
Index, the Reverse Lookup keyword table, the Design Constants and the `S_story`
field table. Almost every "where does this live" question is answered there in one
lookup, and a session that skips it re-derives what the file already knows.

**Maintain the references it holds — concise, and keyed the way you would reach for
them.** A reference here is a *noun with the verb intended on it*: name the thing,
then say what is done to it. `` `symbol@1234` `` names the noun and the line is a
refreshable hint; `./bin/api get quest <id>` names the verb on the noun; a Lab
Report Index row names the file and then what the report *does*. Write new
references in that shape and keep them short enough to scan:

- **Noun first, verb on it.** *"`storyCheckQuests` reads `gate`"*, not *"gating is
  read in one place"*. The grep target belongs in the sentence.
- **One line per reference.** If it needs a paragraph, the paragraph belongs in the
  row or the lab report, and the index keeps the pointer.
- **Every count is measured, and the command that measured it is beside it.** A bare
  number in the index rots silently; a number with its command is re-checkable in
  one keystroke.
- **Update the index in the same increment that invalidates it.** New lab report →
  its Lab Report Index row and the badge, in the same commit. This is the two-way
  sync rule applied to the index itself.

### 2.4 What "done" means

A row is not done when the code works. A row is done when **all six** are true:

1. The change is in `play.html` (or the tool/doc the row names).
2. It was made **through the API** where the API can express it (§2.5).
3. It is **verified** — a round trip, a gate, a test, or a measured re-read. Never
   "GET agrees with me."
4. The **row paragraph is edited in place** to record what shipped, with evidence:
   the measurement before, the change, the measurement after, and anything found
   en route that did not fit the row (which becomes a new row).
5. The row is marked `[x] ✅ SHIPPED <date> <sha>` and **moved out of the phase
   backlog into `docs/backlog/plan-archive.md`**, leaving the phase file shorter.
6. A **§RESUME entry** is added, and the cross-phase table in `BACKLOG.md` gets its
   one-line pointer.

**Anything found on the path and not shipped goes to the backlog as a new row.** It
does not get done inline and it does not get dropped. That rule is why the backlog
has 175 sections and why it is trustworthy.

### 2.5 API-first — the hard rule

> **All world data is written through `./bin/api`. Never by hand-editing the data
> sections of `play.html`, and never by raw `curl`.**

```bash
make wbapi          # or: ./run.sh server   — start the WBAPI server on :1367
./bin/api ping      # ✓ server alive  http://localhost:1367
./bin/api help      # the full CLI reference
./run.sh stop       # stop server + monitor
```

- If the API **cannot express** the operation, **add the endpoint to
  `src/js/wbapi-server.js` first**, restart, and then use it. Do not fall back to
  hand-editing and do not fall back to curl. "Request an API refactor" is the
  documented path and it is a real instruction, not a formality.
- **Restart the server before any write session.** It holds the whole file text
  from when it started and patches data sections into that stale buffer — a write
  after a hand-edit to CSS/JS silently reverts the hand-edit. A full session of
  work was lost this way once and recovered from a dangling git blob.
- **Every write path's acceptance test is a round trip**: save, re-parse, assert
  the change survived — *and nowhere else*. This lesson has now been proved in
  four directions (create §DX-01c, delete §DX-01d/i, update §DX-02h, destination
  §DX-02k). The failures are silent because nothing ever throws.

Full reference: `docs/api/API-README.md`, `docs/api/wbapi-help.md`,
`docs/api/api-user-guide.md`, `docs/api/api-data-audit.md`.

### 2.6 Standing constraints that bind every increment

- **Code comments (CC-1..CC-6).** Default to **zero** comments. Never write a
  comment that narrates the change being made — no *was/now/previously*, no *this
  fixes*. Survival test: would it still be true and useful to someone reading the
  file in a year who never saw the diff? If not, it belongs in the commit body.
  *Known tension, unresolved and filed as §DX-02fa:* `play.html` runs an opposite
  "annotate, don't rewrite" convention (§AUDIT-03n / §DX-02c) whose comments are
  load-bearing audit history. Working rule: CC-1..CC-6 bind **new** comments;
  existing §AUDIT-/§DX-annotated blocks are not swept.
- **Free movement is inviolable.** The world is freely traversable. A step is
  refused for exactly two reasons — off-grid, or sea. **No quest, flag, mission
  bit, or item may ever block a road.** Gating applies to the *mission list* only:
  a quest's `gate` decides whether a mission is *offered* when you arrive, and is
  read in exactly one place, `storyCheckQuests`.
- **Cell = location.** Positions travel as `{r,c}`; node codes are a lookup alias
  resolved through `CELL_GRID["r,c"]`. Never navigate by `N/E/S/W` pointers — they
  were stripped in §CELL-01.
- **Host/script separation.** `QUEST_DB` is script, `QuestRuntime` is the host.
  Widen the boundary **through the grammar**, never around it. No new `_legacy_fn`.
  No handler that branches or loops internally. No `Math.random()` in any path
  that affects game state — the seeded stream (`_seededNext`) is the only source.
- **Parity-fenced kernels.** `mover` / `rooms` / `duel` are byte-identical between
  `play.html` and `src/js/*.js`, asserted by `src/scripts/check-*-parity.js`.
  **Never edit an inlined copy** — edit the module, re-run the checker.
- **Doc anchors name a symbol, not a line.** Write `` `symbol@1234` ``; the number
  is a cached hint refreshed by `npm run anchors:fix`. A bare line number rots —
  43 of 50 were stale when the policy was written.
- **Tests run in the foreground, never piped.** A piped Playwright run returns the
  *last pipe stage's* exit code; 46 failures once reported `exit 0` twice. Redirect
  to a file and read the summary counts. **Stop the WBAPI server before running
  Playwright suites**, restart after.
- **Existing-Work-First.** Before starting any row: `git status` + `git log`, check
  for a second live session, and grep *to disprove the row*. Four rows have closed
  as ALREADY SHIPPED. A row that turns out done still gets closed properly — that
  closure is real work.
- **Commit + speak.** After every commit, `src/bin/say.sh "<subject line>"` (the
  repo queue daemon — never raw macOS `say`).
- **No background processes. No subagents.** Everything runs synchronously in the
  foreground, in this conversation.

### 2.7 Lab reports

Write `docs/lab-reports/lab-report-<title>.md` when an increment is: a major
collection added or redesigned, a redesign touching multiple systems, a new
narrative arc of 3+ nodes, a pre-implementation design lock, or a postmortem with
decisions not recoverable from the code. **Per major backlog section, not per row.**
Do *not* write one for a single quest addition or a value correction.

There are 78 reports today, and `docs/design/index.md` §"Lab Report Index" lists
them all. The §DOC-02 program (Phase 6) is the standing effort that verifies each
one against the code it describes — it is the source of most `§DX-02*` rows.

---

## 3. Row selection rule — "what is next up"

The backlogs carry no single `NEXT` marker. Next-up is derived, in this order:

1. **An unfinished increment.** If `git status` is dirty or the newest §RESUME
   entry names a row still marked `[ ]` / `[~]`, that row is next. Finish it.
2. **An explicitly gating row.** Some rows say another row blocks them
   (e.g. §SIREN-01-FU is *"blocked behind §AUDIT-03x"*; §DX-02cm is *"BLOCKED on
   §DX-02cy"*). A gating row outranks its dependents.
3. **Phase order, then file order.** Phase 1 first — it is content that exists and
   cannot be reached, so it pays the most per line — then 2, 3, 4, 5, 6. Within a
   file, top to bottom, first `[ ]` wins.
4. **Within that, prefer 🟢 over 🟡 over 🟠/🔴.** A mechanical row ships in one
   increment; a design call may cost a whole session and a user round-trip.

At the time of writing, by that rule, the first open row is
**§VM-01-G2b-FU** (Phase 1, line 45) — five act-gated Birka narrative beats that can
never fire, and the cascade behind `brynnKeeperStoryTold`. It is tagged **ASK**,
because the act leg *is* the staging and something has to replace it. The first
**🟢 no-design-call** row in Phase 1 is **§DX-02cy** — `S.opp.key` read at four
sites and written at none, so every kill counter is inert and 19 quests can never
complete — and it is also the row that unblocks §DX-02cm.

---

## 4. The per-increment procedure

Run all eleven steps, in order, every time.

```
 1. PROVE THE GROUND      git status; git log --oneline -5
                          ps aux | grep -c ' claude$'      (>1 → stop and ask)
 2. START THE API         make wbapi ; ./bin/api ping
 3. DISPROVE THE ROW      grep for the thing the row says is missing
                          ./bin/api list <type> --q ... ; ./bin/api audit
                          → if it already exists: close as ALREADY SHIPPED (still real work)
 4. MEASURE BEFORE        the exact number the row claims, re-derived at HEAD
 5. DECIDE                🟢 do it · 🟡 decide and record the evidence
                          🟠🔴ASK present options + recommendation, stop
 6. IMPLEMENT             through ./bin/api for data; play.html directly only for
                          engine JS/CSS (server stopped first)
 7. VERIFY                round trip: re-read through the API after a reload
                          npm run check:walk --prefix src      (the gate chain)
                          npm test --prefix src                (server stopped)
 8. MEASURE AFTER         the same number, moved
 9. EDIT THE ROW IN PLACE what shipped, the evidence, and what was found en route
10. ARCHIVE               mark [x] ✅ SHIPPED <date> <sha>; cut the row out of the
                          phase file and paste it into plan-archive.md; add the
                          §RESUME entry and the BACKLOG.md pointer row
11. COMMIT + PUSH        git commit; git push; src/bin/say.sh "<subject>"; then
    + SPEAK + STOP        HAND OFF: a numbered next-steps list in the reply, and
                          STOP — ask the user before taking the next row. One row
                          per "continue", removed from the phase file as it ships.
```

New findings from step 3, 4, 7 or 8 that are not this row become **new rows**,
appended to the phase file whose subsystem they belong to.

---

## 5. Missions — the authoring recipe

A "mission" is a **quest** in `QUEST_DB`, executed by `QuestRuntime` through the
`BIT_CONTRACTS` opcode table. 2,853 of them exist; the ratio of data to engine is
43:1. The six types are `main | side | combat | skill_check | mission_bit | hunt`.

```bash
# 1. never guess an id — search first
./bin/api list quest --q "keyword"
./bin/api list quest --arc shk --node BK --type skill_check
./bin/api get quest shk6_act1

# 2. the node must exist and be stood-on-able before the quest points at it
./bin/api location TLL
./bin/api get node TLL

# 3. create — required: id type title activateNode
./bin/api post quest \
  id=sq_birka_rat type=combat title="The Rat Problem" \
  desc="Brynn wants the cellar cleared." \
  hint="Head to the cellar beneath the inn." \
  passText="The cellar is quiet now." \
  failText="The rats are still down there." \
  activateNode=TLL waypointNode=TLL npc=brynn

# 4. complex bodies — pipe JSON (this is how UQF gate/bit structures go in)
cat <<'EOF' | ./bin/api post quest
{"id":"quest_x_01","type":"skill_check","title":"…","activateNode":"MHQ",
 "waypointNode":"LCY","checkStat":"INT","checkDC":14,
 "desc":"…","hint":"…","passText":"…","failText":"…"}
EOF

# 5. verify — round trip, then the gates
./bin/api get quest sq_birka_rat        # after a reload, not from memory
./bin/api audit                          # → errors 0
./bin/api chain sq_birka_rat             # dependency chain / canDelete
npm run check:walk --prefix src          # the full gate chain
```

**Traps that have each cost a session:**

- A quest naming an `activateNode` that resolves but **cannot be stood on** is
  invisible in play and green in every gate (§DX-02w). Check cell primacy.
- A `gate` flag with **no writer** means the quest never lists — 55 such flags and
  138 unreachable quests are filed as §AUDIT-03bj.
- An `onComplete` that sets the flag its own `completion` waits on is a **deadlock**
  — five exist, and three of them are a chain stranding four quests (§AUDIT-03bh).
- `gate` is **mission metadata**. If it is ever read by movement code, that is a
  hard invariant violation, not a bug report.

A `make missions` target and a companion prompt for inserting and verifying
mission types are the next tooling increment; when they land they are documented
here and in `docs/api/API-README.md`.

---

## 6. Files to read, in order, at the start of a session

| Order | File | Why |
|---:|---|---|
| 1 | `resume.md` *(this file)* | the procedure |
| 2 | `docs/backlog/BACKLOG.md` | the routing index + §RESUME chronology |
| 3 | the phase file the next row lives in | the row itself, in full |
| 4 | `CONTRIBUTING.md` | the policies, verbatim and binding |
| 5 | `docs/design/index.md` | the master doc index, design constants, `S_story` fields — **read it before the row, update it with the row** (§2.3a) |
| 6 | `docs/api/API-README.md` | the write path |
| 7 | `vendor/1367-sources/index.md` + `All Phases Imported/` | where story answers come from |

---

*© 2026 Paul Richeson — MIT License.*
