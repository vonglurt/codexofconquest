<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report: Map Audit, Grid Layout Solver, and Tooling Infrastructure

**Author:** Claude (Sonnet 4.6) + Paul Richeson
**Original:** 2026-06-04 / 2026-06-05 · §11 appended 2026-06-09
**Verified & rewritten:** 2026-08-13 (§DOC-02av) — 448 → this
**Classification:** Engineering / Developer Tooling / Map Graph Validation
**Status:** **HISTORY.** The subject architecture (the N/S/E/W edge graph) was deleted by §WALK-1/§CELL-01. Annotate, never rewrite.

---

## Abstract

Five interlocking systems built across one evening and the following morning: (1) a file-based TTS
queue that serializes speech across parallel callers; (2) a patch-sidecar system that binds each
snapshot diff to the log lines that produced it; (3) nearest-green-line click-to-speak in
`monitor-snapshots.py`; (4) map-graph validation with auto-fix — diagonal-exit detection,
bidirectional repair, and two new grid-placement rules; and (5) a BFS grid layout solver
(`GET /api/layout/solve`) with a mass coordinate-apply endpoint. All five feed one loop:
**write → snapshot → diff → sidecar.**

**Verification verdict (2026-08-13).** The transcribable half is close to flawless: every code
block re-measured is byte-identical to its source, the three headline warning counts (**36 / 9 /
55**) reproduce exactly at the birth commit, and **13 of 13 node codes are byte-identical in `num`
and `label` from the archive to HEAD — the corpus record.** Three claims do not survive. One of them
matters: **§4.2's repaired 36 one-way links were never written to the game file.** The endpoint
saved them to a dated sibling and reported success — CONTRIBUTING Hazard #5, observed eight weeks
before the repo had a name for it.

---

## I. Intent, and what it bought the player

None of this is a player-facing feature. All of it exists so that player-facing work could be
**trusted**, and the thing being protected is the project's first invariant (`prompt.md` §6.1):
**the world is always freely traversable.**

At the time of writing that invariant was enforced by a hand-maintained edge graph, and a hand-
maintained edge graph rots in ways nothing announces. A diagonal exit is not read by the corridor
builder, so the door is simply not there. A one-way link is a road you can walk down and not back
up. An off-axis pair renders no corridor at all. **Every one of these failures is silent** — the map
draws, the game loads, and a city the designer wired last week is quietly unreachable. The audit
rules turned each of those into a line of output with a `fix` object attached. The solver is the
same argument one level up: if a constraint is mechanical, a human should not be placing 305 nodes
by hand against it. The TTS queue and patch sidecar are the loop's memory — the diff says *what
changed*, the sidecar says *why*, and the speech narrates it while the work happens rather than
after.

> The design principle the whole session runs on: **a broken map should be loud.** Everything here
> is a way of making a silent failure say something.

---

## II. Method

Per §DOC-02: census every named symbol first, then read. Dating by instrument 18 — a report is
measured at **its own** commit, never at HEAD. Archive extraction with
`git show "${c}:path"` (quoted; see the zsh `:r` hazard in §DOC-02at). Graph figures were
re-derived by re-implementing the published algorithms against the extracted archive files, so
every count below is reproducible rather than recalled.

---

## III. Provenance — a report with two birth commits

§1–§10 are referenced to **`bb522a6` (2026-06-05 11:15)**; §11 to **`1bfe7a6` (2026-06-09 17:36)**,
24 minutes after the file's mtime of `2026-06-09 17:12:46`. Both were uncommitted-tree filings. The
session's own timeline is what makes the verdicts below decidable:

| Commit | Time | What |
|---|---|---|
| `c1d5a94` | 05-29 22:45 | the three diagonal exits are born |
| `a4372e4` | 06-04 19:08 | `say.sh` + `sayd.sh` created |
| `7f640ab` | 06-04 20:18 | **diagonals nulled — "null out 3 nodes, drop from worldbuilder editor"** |
| `c743aa7` | 06-04 20:27 | `diagonal_exit` rule + `stripDiag` + `POST /api/audit/map/fix` |
| `47a6bbb` | 06-04 21:26 | `alignment` + `axis_distance` + `/api/layout/{solve,apply}` |
| `62613d4` | 06-05 08:09 | Worldbuilder audit + layout panels (`_layoutProposed`) |
| `df9306f` | 06-05 08:42 | **`say.lock` — the fcntl mutex** |
| `9b12c9f` | 06-05 09:05 | **random voices, rate 190** |
| `bb522a6` | 06-05 11:15 | **the report is committed** |
| `14919b3` | 06-05 19:47 | `corner_misalign` — a 12th rule, 8 h later |

***Note the two bold rows above the filing.*** They are the subject of §V-B.

---

## IV. As-built inventory and delta

### A. TTS queue — `say.sh` / `sayd.sh`

**The problem, as filed:** the NPC audit loop calls `say.sh` several times per second. Synchronous
`say` blocked the caller and truncated the previous line; worse, three simultaneous callers each
read an empty PID file — the daemon had forked but not yet written it — and each started a daemon.
Three voices at once.

**The design, verified exact at HEAD today:**

| Claim | Status |
|---|---|
| `say.sh` enqueues and returns; `tee -a` to `milepoints/say.log` | ✅ `say.sh:24` |
| monotonic `say.seq` breaks same-second filename ties | ✅ `say.sh:27–31` |
| queue file `YYYYMMDD-HHMMSS-000NNN.txt` | ✅ `say.sh:31` |
| `pgrep -qf "sayd\.sh"` instead of a PID file — the kernel table is consistent immediately after `fork()` | ✅ `say.sh:34` |
| daemon started detached via `disown` | ✅ `say.sh:34` |
| `sayd.sh` writes its PID, `trap` removes it on exit | ✅ `sayd.sh:30–31` |
| atomic claim by `mv FILE FILE.speaking` — two daemons can never double-speak | ✅ `sayd.sh:41` |
| `MAX_IDLE=34` hardcoded, ≈10 s of silence; the `bc -l` startup latency it replaced | ✅ `sayd.sh:22`, comment intact |

**Delta 1 — `say -v Samantha -r 185` is NOT SHIPPED, and it was already false when the report was
committed.** HEAD and both birth commits carry a **13-voice array chosen at random per message** at
`RATE=190`, spoken through a Python `fcntl.LOCK_EX` on `milepoints/say.lock`. The change landed at
`9b12c9f` (06-05 09:05) — **two hours and ten minutes before `bb522a6`.** The `-r 185` string has
one commit in the file's history and it is the one that removed it.

**Delta 2 — §1.4's file table omits `milepoints/say.lock`.** That file *is* the mutual exclusion.
The report's own thesis sentence promises a queue "without a daemon lock race"; by the time it was
filed there was a lock, deliberately added an hour earlier (`df9306f`, *"Voice lock: prevent
overlapping say calls between monitor and sayd"*) because `pgrep` solves the **daemon-start** race
and not the **speaker** race. The document describes the version of the design it had finished
thinking about.

> Both deltas point the same way, and the direction is the interesting part: **the author described
> the files they had touched *first*, and the files they touched *last* are the ones the description
> is wrong about.** By the time you write the report you have stopped re-reading the thing you
> already understand.

### B. Patch sidecar — `monitor-snapshots.py`

**Verified byte-exact at HEAD, ten weeks on** (`monitor-snapshots.py:325–326`, `:446–474`): offsets
seeded from `stat().st_size` at startup so pre-monitor lines are excluded; seek → `readlines()` →
`tell()`; sidecar written to `<stem>.patch.log` only if either log has content; both logs truncated
to `""`; both offsets reset to 0. The lifecycle diagram in §2.3 is accurate as drawn.

**Delta 3 — §2.4's *"All transient files excluded"* is false, and was false when written.**
`.gitignore` at HEAD carries `*.patch`, `*.patch.log`, `_base.html.gz` and `wbapi-server*.log`. It
has **never** carried `milepoints/patches/_last.html` or `_last.name`. Both are **tracked in git**,
committed by `1d2661d` (2026-06-04 11:27) — a *licence-header sweep*, eight hours before this
session began — and `_last.html` is **5.35 MB** of scratch state that ships with every clone.

*A `.gitignore` line cannot un-track a file that is already committed.* The report asserted an
exclusion for two files that had been in the index since that morning. → **§DX-02bj**.

### C. Nearest-green-line click

§3's Python block is **byte-identical** to `monitor-snapshots.py:680–691` at HEAD, including the
`+++` guard and the `min(..., key=lambda r: abs(r - my))` distance rule. Single-click still stops
speech (`elif bstate & curses.BUTTON1_CLICKED: _stop_say()`). No delta.

### D. Map graph validation

**§4.1 diagonal exits — exact in every particular.** Exactly three nodes carried diagonal keys —
`SID.SW='OTP'`, `BEL.SE='LIM'`, `LIM.NW='BEL'` — born together at `c1d5a94` and removed together at
`7f640ab`, whose message reads *"remove NW/NE/SW/SE exits — null out 3 nodes, drop from worldbuilder
editor."* Measured diagonal-key count: **3 at every commit through 06-04 20:10, 0 from `7f640ab`
onward.** The `diagonal_exit` rule and the editor's `['N','S','E','W']` restriction both shipped.

**§4.3 / §4.4 — the two new rules, and the numbers hold.** Both code blocks are byte-identical to
`47a6bbb`. Re-deriving the rules against that archive:

| Report | Measured at `47a6bbb` | |
|---|---|---|
| `alignment` — 9 violating pairs | **9** | ✅ exact |
| named examples `KIR↔NUE`, `HKG↔LCY`, `GOT↔SFT` | all three in the measured set | ✅ 3/3 |
| `axis_distance` — 55 violating pairs | **55** | ✅ exact |
| largest: `TLS↔LHR`, 40 cells, same column, rows 4 and 44 | `TLS{r:4,c:112}` · `LHR{r:44,c:112}` | ✅ exact |

*(One footnote the report could not have wanted: `TLS↔LHR` at 40 cells is a **tie**, not a maximum —
`GIB↔TRF` is also 40.)*

**§4.6's summary block is a genuine paste, and it can be proved.** `bidirectional:36`,
`alignment:9`, `axis_distance:55` all reproduce, and the tally is emitted in **rule-declaration
order** — `long_link` before `market_proximity` before `missing_coords`, exactly as the source
pushes them. A hand-written mock would not have got the ordering right. `missing_coords:105` is the
one figure that does not reproduce from source text (78 `NODE_MAP` codes lack a `NODE_COORDS` entry
at that commit); the divergence is in the parser's coords model, not in the report's honesty.

**§4.5 — the fix endpoint.** `stripDiag`'s regex surgery on `_rawSrc` and the `editField('node',
target, OPP[dir], code)` back-link path are both described correctly. Body `{}` does mean *fix all*.
Everything about the mechanism is right. What happened when it ran is §V-A.

### E. Worldbuilder panels

**8 of 8 DOM identifiers live at HEAD**, unchanged: `btn-map-audit` · `btn-map-fix-all` ·
`map-audit-list` · `layout-step` (`min=4 max=32 value=8`) · `layout-root` (`placeholder="TLS"`) ·
`btn-layout-solve` · `btn-layout-apply` · `layout-result`. `runMapAudit()` and
`_auditEnableServer()` behave as described.

**Delta 4 — §5.2's stats block is a mockup, not a paste, and §4.6 is the control that proves it.**
Its `Step 4` contradicts the input's own `value="8"`; re-running the published algorithm against
`c743aa7` at `step=4, root=TLS` gives `Nodes placed 305 / 305` (**exact**), `Orphans 225` (vs 220),
`100 ok · 40 over` (vs `99 ok · 46 over`) — and **`0 misaligned` is not achievable**: the orphan row
misaligns every cross-link it touches, which the report's own §10 explains. Two code blocks, same
typography, same document — one pasted, one composed. The composed one is the one with the round
numbers.

### F. Grid layout solver

**§6.2's algorithm verifies step by step** against `47a6bbb`: root seeded at its existing coord
rounded to the nearest `step` (or `(100,100)`), BFS over N/S/E/W, collision resolved by sliding
**further along the same axis** — preserving the alignment guarantee by construction — with
`attempts < 64`, and orphans placed in a row at `maxR + step*3`. Every clause, including the
constant.

**§6.5's `NODE_COORDS` rewrite block is byte-identical to the shipped code and still is** —
`src/js/wbapi-server.js:7607–7617`, sorted by `(r, c)`, blank line between row bands of 8. It is the
oldest surviving code this report describes.

**Delta 5 — §6.3's connectivity figures.** Measured at `47a6bbb` over 307 nodes:

| Report | Measured | |
|---|---|---|
| 160 disconnected components | **167** | ≈ (4 % low) |
| largest component ~120, reachable from LHR | **116**, and it *is* the LHR component | ✅ |
| remaining ~185 nodes | **191** | ✅ |
| Paul's Journeys = 20 nodes · Littoral Courts = 10 | 2nd component **17** · 3rd component **10** | 1 of 2 |
| **~105 nodes with no N/S/E/W connections at all** | **164** | ✗ **36 % understated** |

The last row is the only badly wrong number in the document, and it is `missing_coords:105` from
§4.6 one page earlier — *a different property of a different set*. The audit printed a count of
nodes without **coordinates**; the prose reused it as the count of nodes without **links**. Nothing
in the session ever measured the second quantity, so the nearest available number was borrowed.

### G. Rule table and grid rules

**§8's table is 11 of 12.** All eleven rules exist under the names given, with the severities given.
`corner_misalign` was added at `14919b3` the same evening — the table was one rule stale eight hours
after publication, which is a fair description of the pace.

**§9's canonical rules verify.** The 4-cell limit is real: `buildCorridorMap`'s probe is
`for (let d = 1; d <= 4; d++)`. Exits are N/S/E/W only, collisions 409 on `PUT /api/coords/{code}`,
and the "silently drops corridor segments" characterisation is correct — which is the whole reason
the audit rules were written.

---

## V. Findings

### A. The headline: the repair reported success and wrote to a different file

§4.2 states: *"36 one-way connections were found and repaired via `POST /api/audit/map/fix` with
body `{}` (fix all)."*

**The finding is exact. The repair never happened.** Measured across every commit touching
`play.html` from 06-04 18:02 to 06-05 20:47, the one-way count is:

```
36 36 36 36 … 36 37 36 36 36 36   (06-04 18:02 → 20:47)
50 49 49 49 44 44 44 44 44 44 …   (06-04 21:41 → 06-05 20:47, as book imports add nodes)
```

**It is never 0, and never below 36.** The mechanism is three lines of the handler:

```js
const stamp = WBAPI.getStampedName();   // → "play-20260604-202700.html"
const sv    = WBAPI.save(stamp);        // wbapi-core.js:573 → dest = stamp → writeFileSync(dest)
await WBAPI.load(stamp);                // the server now serves the dated sibling
```

`save(outputPath)` writes to `outputPath`. The handler passes it a **timestamped filename**. All 36
back-links were written correctly — into `play-20260604-<hhmmss>.html` — and the response
returned `ok:true, saved:true, note:'Changes saved and reloaded.'` while the game file was never
touched. The diagonal fix in the same session persisted only because it had been done **by hand** at
`7f640ab`, nine minutes before the endpoint that would have done it existed.

This is CONTRIBUTING **Hazard #5** — *a write path that reports success without persisting* — and
the repo would not name it until §DX-01d/i (2026-07-30) and §DX-02k (2026-08-03, *"the argless
`save()` was not a stray test call — it was the server's own per-write path, stamping 5.4 MB per PUT
into whatever directory it started in"*). **This report is the earliest written record of a repair
performed through it**, and it records the repair as done.

> The standing lesson, restated because this is where it started: **the acceptance test for a write
> path is a round trip — save, re-parse, assert the change survived.** Nothing throws when it
> doesn't.

### B. Two hours is enough

§IV-A's two deltas share a cause worth naming. The report was committed at 11:15 describing scripts
whose behaviour had changed at 08:42 and 09:05 — same author, same morning, same terminal. Not rot
over months: **rot over two hours and ten minutes, the corpus's shortest interval.** The sharpening
this gives instrument 18: *dating a report tells you which claims to distrust, and the ones to
distrust hardest are about the files edited **latest** in its own session.*

### C. Corpus: a ten-phase pipeline, and both reports list nine

§11 and its sibling `lab-report-mega-reweave.md` (verified as §DOC-02au, four hours apart, same
author, same subject) each publish a nine-row phase table. **They are not the same nine.**

| | this report | `mega-reweave` |
|---|---|---|
| rows | P0, P1, **P1.5**, P4, P5, P2, P3, P6, P7 | P0 … **P8** |
| missing | P8 — final check | P1.5 — coord-scan |

Both omitted phases are real at `1bfe7a6`: `phaseBanner('P1.5: coord-scan', …)` appears nine times,
and `// PHASE 8 — final check` is there. **The pipeline has ten phases and neither document says
so** — which corrects §DOC-02au's *"all 9 phases (P0–P8) verify."* Nine of ten verified; the tenth
was in the other file the whole time.

***41st instrument — WHEN TWO DOCUMENTS TABULATE THE SAME PIPELINE, THE ONE IN THE UGLIER ORDER IS
THE COPIED ONE.*** This report's table runs P0, P1, P1.5, **P4, P5, P2, P3**, P6, P7 — which looks
like an error and is instead the **execution** order, confirmed by the pipeline's own banner:
`Road: 1/geo-seed → 2/rip-connect → 3/coord-scan → 4/fix-broken → 5/fix-bidir`. The sibling's tidy
P0→P8 table has been re-sorted by hand, and *a hand that re-sorts also drops rows and invents them*.
Neither document is internally inconsistent. Only the pair is falsifiable.

The rest of §11 — grid expansion, `GRID_MARGIN=4`'s outer-row guard, junction backfill, promotion at
4 connections, the Tarjan articulation-point bridge check, the `∑` accumulators — is accurate for
`1bfe7a6` and entirely retired. See `lab-report-mega-reweave.md` for the pipeline's own verification
and for the loop caps that failed to hold it.

---

## VI. Status at HEAD (2026-08-13)

**The architecture is gone.** §WALK-1/§CELL-01 replaced the edge graph with a terrain-field land
flood. In `NODE_MAP` at HEAD there are **zero** `N:`/`S:`/`E:`/`W:` link fields and **zero**
`junction:true` nodes across 416 nodes. `POST /api/graph/reweave-all`, `rip-and-connect` and
`fill-gap` all return **410**. `GRID_MARGIN`, `p4Deferred`, `nextNodeNum` and the Tarjan check have
0 occurrences repo-wide; only `nextJCode` survives, still used by `spawn-junction`.

**The tooling did not go with it, and that is the problem.** All twelve audit rules still run, and
eight of them are edge-driven — `diagonal_exit`, `max_connections`, `dangling_link`, `bidirectional`,
`direction_sign`, `long_link`, `alignment`, `axis_distance` — so the Worldbuilder's **Map Audit**
button now reports a clean bill of health over an **empty relation**. This is the same shape
§DOC-02at filed as §DX-02bf for `./api.sh fix-bidirectional`: an invariant enforced perfectly
against an exception that cannot fire.

**And the solver is worse than inert.** Re-running `GET /api/layout/solve?step=8&root=TLS` against
HEAD's data: **415 of 416 nodes are orphans**, validation prints `0 ok · 0 misaligned / 0 ok · 0
over` — a perfect score over nothing — and the panel renders *"415 disconnected nodes will be placed
below the main grid"* before revealing the **Apply Layout** button. `POST /api/layout/apply` has no
guard beyond a numeric type-check and rewrites the whole `NODE_COORDS` section. One click collapses
the entire world into a single horizontal row and destroys the §WALK-1.5 geo grid. → **§DX-02bi.**

**Node codes (instrument 31) — 13 of 13 byte-identical in `num` and `label`, `bb522a6` → HEAD.**
`SID`(23) · `OTP`(62) · `BEL`(33) · `LIM`(81) · `KIR`(14) · `NUE`(35) · `HKG`(6) · `LCY`(7) ·
`GOT`(11) · `SFT`(24) · `TLS`(42) · `LHR`(1) · `BEG`(61). The corpus record, beating §DOC-02at's
12 of 12. The report cited codes because it was reading the file, not because it recognised them.

---

## VII. Defects filed

| Row | Sev | Premise |
|---|---|---|
| **§DX-02bi** | 🟠 | `Apply Layout` is a live one-click destroyer of `NODE_COORDS`: solve returns 415/416 orphans over a link-free `NODE_MAP`, apply is unguarded, the geo grid is gone. |
| **§DX-02bj** | 🟢 | `milepoints/patches/_last.html` (5.35 MB) and `_last.name` are tracked in git; the `.gitignore` lines this report claims for them were never added. |
| **§AUDIT-03ay** | 🟢 | `GET /api/audit/map` runs 8 edge-driven rules over 0 edges and reports success — second site of §DX-02bf's class, now including the Worldbuilder UI and its `Fix All` button. |

---

## VIII. Known limitations (as filed — all four verified accurate, preserved)

Collision resolution *produces* `axis_distance` violations (another full `step` puts the node at 8
cells, reflected in `distBad`) · orphan placement is linear, right for the no-connection nodes and
wrong for the isolated arcs, and the field is mislabelled **"Orphans (disconnected)"** when it also
holds nodes the BFS reached and failed to place · applying a layout is irreversible without
`_base.html.gz` + patches — §DX-02bi is this limitation outliving its own architecture ·
`alignment`/`axis_distance` have no auto-fix, and their `fix.curl` points at the solver instead.

---

## IX. Conclusion

Two hundred lines of graph-repair tooling, built well, for a graph that no longer exists. The parts
that survive are the ones that were never about the graph: the speech queue still narrates every
commit, and the patch sidecar still binds each diff to the reason for it. The `NODE_COORDS` writer
in §6.5 is byte-identical ten weeks later.

The session's own instinct was right — **a broken map should be loud** — and the audit rules did
exactly that for as long as there were edges to audit. What it could not check was itself. The one
repair it reported as done was written to a file nobody read, and the fifty-line rule that found the
problem outlived the three lines that were supposed to fix it.

> The phases were right; the brakes were prose (§DOC-02au). Here the diagnosis was right and the
> **treatment went to the wrong address.**
