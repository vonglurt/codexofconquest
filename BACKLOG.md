<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->
# BACKLOG — Outstanding Work (routing index)

> **This file was split into six phase backlogs on 2026-08-23.** It no longer carries rows itself — it carries the directive, the routing table, and the cross-phase §RESUME chronology. Every row, track record, theme bucket and history entry from the former single file lives verbatim in exactly one of the six; the split was verified line-exact (0 lines lost, 0 duplicated).

> **This file is the list of outstanding activities.** The *how-we-work* rules live in **[CONTRIBUTING.md](CONTRIBUTING.md)**; closed/shipped work is archived in **[plan-archive.md](plan-archive.md)**. Split out of the former `plan.md` on 2026-07-09.
>
> **⚠️ Before starting ANY row — Existing-Work-First (CONTRIBUTING.md § Existing-Work-First Policy):** `git status` + `git log` first (uncommitted/fresh work matching the row = it's done or in progress — finish it, don't redo it); check for a second live session (`ps aux | grep claude`) before editing shared files; grep to *disprove* the row's premise (rows go stale — four rows have closed as ALREADY SHIPPED). A §RESUME entry says where the last session *stopped*, not what the tree looks like *now*.
>
> **Legend:** `[ ]` open · `[~]` in-progress / recurring · `[x]` closed (kept here for context; migrate to plan-archive.md over time).

> **⚠️ Existing-Work-First now spans six files.** `grep -n '§DX-02xx' BACKLOG*.md` before you conclude a row is unclaimed — a row and the §RESUME entry that closed it may sit in different phase files.

## Standing Directive — Code Comments (user directive 2026-08-23)

> **Binding on every increment in this file.** Where this and a §-row's own instructions disagree, this wins.

**The failure this prevents:** writing a comment that narrates the change being made right now. That context is real, but it expires the instant the change merges — the defect it describes no longer exists, so the comment becomes a story about a problem no future reader can observe. It is a changelog entry in the wrong file, and a third copy of text already required in the commit body and the PR description.

- **CC-1 (MUST NOT)** Write a comment describing a change, a fix, a defect, its cause, or what the code used to do. No *"was / now / previously / instead of"*, no *"this fixes"*, no *"needed because otherwise"*, no *"note that we no longer"*.
- **CC-2 (MUST)** Apply the **survival test** to every comment before writing it: *would this still be true and useful to someone reading this file a year from now, who never saw the diff?* If it only makes sense beside the diff, it is changelog — delete it and put it in the commit body.
- **CC-3 (MUST)** Default to **zero** comments. Declarative config — Terraform, DNS records, k8s manifests, CI YAML, Helm values — is self-describing and takes none. A resource named `dmarc-example-com` does not need a comment saying it is the DMARC record.
- **CC-4 (MAY)** Comment only when a future editor would actively break something without it: a non-obvious external constraint, a required out-of-band manual step, an invariant the surrounding code cannot show. **One line.** If it needs a paragraph it belongs in a design doc, not inline.
- **CC-5 (MUST)** Before every commit, re-read the comment lines added: `git diff --cached | grep '^+' | grep -E '#|//|/\*'`. Each hit must pass CC-2 on its own. **Deleting is always an acceptable outcome.** *"I already wrote it"*, *"it is only one line"*, and *"this one is genuinely useful"* are not exemptions — the last one is the exact thought that precedes every violation.
- **CC-6 (MUST)** Applies to comments **edited** as well as added. When a change invalidates an existing comment, the default action is **DELETE**, not rewrite it into a new narrative.

> **⚠️ KNOWN TENSION, flagged not resolved — needs a user call.** This repo currently runs an *opposite* convention in `index.html`: **§AUDIT-03n / §DX-02c "annotate, don't rewrite"**, which deliberately preserves defect history inline (e.g. `const NODE_NPC_KEYS`'s 8-line comment explaining that 21 of 26 rows named retired node codes, or `_renderFinalMap`'s §AUDIT-03e note on why the node filter is held at the historical set). Those are exactly the *"what the code used to do"* narratives CC-1 forbids, and several are load-bearing: they are the only record of why a value is held where it is, and deleting them would re-open closed audit rows. **Until the call is made, the working rule is:** CC-1..CC-6 bind all **new** comments; existing §AUDIT-/§DX-annotated blocks are **not** swept under CC-6 — they are a documented archaeology convention, not accidental changelog. Filed as **§DX-02fa** below.

---

## The Six Phase Backlogs

Split by **subsystem**, not by track prefix (121 of the 175 sections were `§DX-02`, so prefix would not have divided anything). Each file restates the directive above in full and is self-contained: its own open rows, its own track records, its own §RESUME history.

| Phase | Backlog | Open rows | History | Scope |
|---|---|---:|---:|---|
| **1** | [Playable Truth](BACKLOG-1-playable-truth.md) | 13 | 0 | Shipped content the player can never reach or complete: unreachable act-gated beats, inert counters, gate flags with no writer, quest deadlocks, endings out of range. |
| **2** | [Engine & Systems](BACKLOG-2-engine-systems.md) | 49 | 51 | Rules and mechanics: combat math, XP and economy, progression and New Game+, save/state defaults, the render pipeline, the quest VM and its migration fronts. |
| **3** | [Content & Narrative](BACKLOG-3-content-narrative.md) | 19 | 41 | Authored strings and the people who say them: NPC dialogue and relationships, favor scales, arc beats, epilogue and ending prose, lines with no lookup path. |
| **4** | [World & Navigation](BACKLOG-4-world-navigation.md) | 8 | 20 | The map and moving on it: node registration and labels, terrain tables and encounter rates, GEO anchors and projection bounds, road nets, movement results. |
| **5** | [Platform & Tooling](BACKLOG-5-platform-tooling.md) | 25 | 21 | Everything outside the game loop: the WBAPI server and its endpoints, the worldbuilder and editors, the HTML parse/export layer, multiplayer mesh, the NPC-speak service. |
| **6** | [Verification & Documentation](BACKLOG-6-verification-docs.md) | 45 | 17 | What proves the rest is true: CI gates and parity fences, Playwright and MUD suites, the anchor resolver, engine comments, maintained-doc rot, and the §DOC-02 lab-report verification program. |

> **Phase order is a suggested work order, not a dependency chain.** Phase 1 is content the player cannot reach — the defects that make shipped work invisible — so it pays first. Phase 6 is what proves the other five stayed true. Any phase can be picked up on its own.

---

## Open at a Glance — where each track now lives

The per-track glance bullets moved with their tracks. This table says which file to open.

| Track | Phase backlog |
|---|---|
| §DOC-02 — Lab-report verification program | [Phase 6 — Verification & Documentation](BACKLOG-6-verification-docs.md) |
| §VM-01 — The Quest VM → *No Word for Wait* | [Phase 2 — Engine & Systems](BACKLOG-2-engine-systems.md) |
| §BOARD-01 — The Warrant’s Board | [Phase 2 — Engine & Systems](BACKLOG-2-engine-systems.md) |
| §POT-PROMOTE — 12 planned tracks | [Phase 2 — Engine & Systems](BACKLOG-2-engine-systems.md) |
| §DX-01 — Developer-Experience & repo-health | [Phase 6 — Verification & Documentation](BACKLOG-6-verification-docs.md) |
| §DX-02 — engine/data contract tails | [Phase 5 — Platform & Tooling](BACKLOG-5-platform-tooling.md) |
| §AUDIT-03d + h/i/j/k/m — quest-data appended-field rot | [Phase 1 — Playable Truth](BACKLOG-1-playable-truth.md) |
| §MESH-01-REVIEW tails | [Phase 5 — Platform & Tooling](BACKLOG-5-platform-tooling.md) |
| §IDEA-01 — Idea Generator | [Phase 3 — Content & Narrative](BACKLOG-3-content-narrative.md) |
| §NAV-01-FU — deferred map centering | [Phase 4 — World & Navigation](BACKLOG-4-world-navigation.md) |

Closed tracks (full records in `plan-archive.md`): §NPC-01 (2026-07-28) · §PLAY-01 · §DEATH-01 · §XP-01 · §CLEANUP-01 · §KG · §1367 · §GR/§GR-D · §MBIT-02 · §MESH-01/-02 · §MP-CHAT-GLOBAL/§MP-MAPTABS/§MAP-NAV · §NAV-01 · §WALK · §ARCH-01 · §BOARD-01-FU1–8.

---

## §RESUME — cross-phase chronology

> **149 entries, original order, newest first.** This index is the handoff log: read it top-down for *what happened last*, then open the phase file named in the right-hand column for the entry in full. The entries themselves were distributed by the subsystem each increment was about, so consecutive sessions often land in different files — this table is the only place the true chronology survives.

> **Latest (2026-08-23) — §DX-01g:** this split itself. Full entry in [Phase 6 — Verification & Documentation](BACKLOG-6-verification-docs.md); the finding it raised is **§DX-02fx** in the same file. The 149 rows below are the log as it stood before the split.

| # | Date | Increment | Headline | Full entry in |
|---:|---|---|---|---|
| 1 | 2026-08-23 | §DOC-02dc | the child design pass whose one missing opcode was the last one the VM ever needed, whose only carried nu… | [P2](BACKLOG-2-engine-systems.md) |
| 2 | 2026-08-23 | §DOC-02db | the design that survived eleven slices and 26 days at 100% of its symbols, whose one unmodelled shape was… | [P2](BACKLOG-2-engine-systems.md) |
| 3 | 2026-08-23 | §DOC-02da | the report whose architecture survived 85 days and a 3.15× file intact, whose operations were reversed fo… | [P5](BACKLOG-5-platform-tooling.md) |
| 4 | 2026-08-23 | §DOC-02cz | the most completely-shipped lock the program has scored, whose best Froberger trace has never been read b… | [P3](BACKLOG-3-content-narrative.md) |
| 5 | 2026-08-23 | §DOC-02cy | the most faithfully-transcribed lock the program has scored, whose off-screen character is named by nobod… | [P3](BACKLOG-3-content-narrative.md) |
| 6 | 2026-08-22 | §DOC-02cx | the design lock whose every string survived ninety days byte-for-byte, whose best ending has never once f… | [P3](BACKLOG-3-content-narrative.md) |
| 7 | 2026-08-22 | §DOC-02cw | the content report whose every number survived 45 days, whose road was laid by the method it forbids, who… | [P4](BACKLOG-4-world-navigation.md) |
| 8 | 2026-08-22 | §DOC-02cv | the origin lock with a perfect anchor score and a census that measured half the corpus, whose two "pure t… | [P2](BACKLOG-2-engine-systems.md) |
| 9 | 2026-08-22 | §DOC-02cu | the design lock whose data table shipped byte-identical and is still byte-identical a month later, whose … | [P2](BACKLOG-2-engine-systems.md) |
| 10 | 2026-08-22 | §DOC-02ct | the design lock that named an invariant in its first design call and violated it in its fourth section, a… | [P2](BACKLOG-2-engine-systems.md) |
| 11 | 2026-08-22 | §DOC-02cs | eighteen of twenty-one anchors exact and the three misses are exactly the three the author hedged with a … | [P2](BACKLOG-2-engine-systems.md) |
| 12 | 2026-08-22 | §DOC-02cr | the design lock whose code shipped byte-identical and is still byte-identical a month later, and whose sp… | [P2](BACKLOG-2-engine-systems.md) |
| 13 | 2026-08-22 | §DOC-02cq | every one of the prover's own seven corpus figures reproduced exactly on the pinned build, and the increm… | [P2](BACKLOG-2-engine-systems.md) |
| 14 | 2026-08-22 | §DOC-02cp | eighteen line numbers, eighteen exact — the cleanest anchor result the program has scored — and the one p… | [P2](BACKLOG-2-engine-systems.md) |
| 15 | 2026-08-21 | §DOC-02co | the lock held whole, both consumers it predicted arrived by name, and the one thing it never re-measured … | [P2](BACKLOG-2-engine-systems.md) |
| 16 | 2026-08-21 | §DOC-02cn | 27 of 28 line numbers correct against a build that was never committed, and all four wrong figures are in… | [P2](BACKLOG-2-engine-systems.md) |
| 17 | 2026-08-21 | §DOC-02cm | every code block byte-exact, 33 of 33 anchors resolving, the acceptance suite still 5/5 thirty days on — … | [P2](BACKLOG-2-engine-systems.md) |
| 18 | 2026-08-21 | §DOC-02cl | the thesis was right, the plan was right, it shipped whole in nine hours — and the one census row it coun… | [P3](BACKLOG-3-content-narrative.md) |
| 19 | 2026-08-21 | §DOC-02ck | the most accurate document in the corpus is wrong about the one sentence its whole surface argument rests… | [P3](BACKLOG-3-content-narrative.md) |
| 20 | 2026-08-21 | §DOC-02cj | the report got four of its own counts wrong and three of its four open questions right, and the repo buil… | [P2](BACKLOG-2-engine-systems.md) |
| 21 | 2026-08-21 | §DOC-02ci | the parent review shipped five of seven faces the day it was written, and every one of its four errors is… | [P2](BACKLOG-2-engine-systems.md) |
| 22 | 2026-08-18 | §DOC-02ch | the string is byte-exact at 37 days, the reason given for the fix beside it is false, and the road it sig… | [P3](BACKLOG-3-content-narrative.md) |
| 23 | 2026-08-18 | §DOC-02cg | the increment shipped ten of ten and deferred five of five, and the sentence it put on the opening screen… | [P2](BACKLOG-2-engine-systems.md) |
| 24 | 2026-08-18 | §DOC-02cf | the lock has not drifted a byte in 37 days, and half of what it shipped has never once returned true.… | [P2](BACKLOG-2-engine-systems.md) |
| 25 | 2026-08-18 | §DOC-02ce | shipped the goal whole, and then a design reversal landed on one of its two surfaces.… | [P2](BACKLOG-2-engine-systems.md) |
| 26 | 2026-08-18 | §DOC-02cd | the corpus's first perfect dating result, on a feature that ships the XP and withholds the telling.… | [P2](BACKLOG-2-engine-systems.md) |
| 27 | 2026-08-18 | §DOC-02cc | the cleanest ship in the corpus, and every failure in it is a claim about its own surroundings.… | [P2](BACKLOG-2-engine-systems.md) |
| 28 | 2026-08-18 | §DOC-02cb | the most faithfully executed lock in the corpus, describing a feature no player has ever reached.… | [P3](BACKLOG-3-content-narrative.md) |
| 29 | 2026-08-18 | §DOC-02ca | four of five recommendations shipped inside 28 days, every derived number is wrong, and the fifth recomme… | [P5](BACKLOG-5-platform-tooling.md) |
| 30 | 2026-08-17 | §DOC-02bz | the arc is built exactly as written, and it has never been playable.… | [P3](BACKLOG-3-content-narrative.md) |
| 31 | 2026-08-17 | §DOC-02by | a design lock written 23 minutes before the code, exact in every number six weeks on, and wrong about one… | [P4](BACKLOG-4-world-navigation.md) |
| 32 | 2026-08-17 | §DOC-02bx | seven locked decisions, four non-goals, forty-two days, and the only thing that drifted was the labels.… | [P5](BACKLOG-5-platform-tooling.md) |
| 33 | 2026-08-17 | §DOC-02bw | every increment it planned shipped in four days, every constant and formula still measures exact, and the… | [P5](BACKLOG-5-platform-tooling.md) |
| 34 | 2026-08-17 | §DOC-02bv | 2026-08-17 — §DOC-02bv ✅ SHIPPED: the corpus's best-verified report, and the only one whose entire forwar… | [P5](BACKLOG-5-platform-tooling.md) |
| 35 | 2026-08-17 | §DOC-02bu | a method document scored against the corpus it produced — the tables are perfect, the census is wrong by … | [P5](BACKLOG-5-platform-tooling.md) |
| 36 | 2026-08-17 | §DOC-02bt | every statistic in the diagnosis re-derives exactly, and the one sentence nobody filed as a row cost four… | [P4](BACKLOG-4-world-navigation.md) |
| 37 | 2026-08-17 | §DOC-02bs | the report was exact on every number it counted, and its subject was deleted six days after it closed.… | [P5](BACKLOG-5-platform-tooling.md) |
| 38 | 2026-08-17 | §DOC-02br | (`4a97e50`): a design lock that scored twelve of twelve and had its runtime three minutes later — and the… | [P5](BACKLOG-5-platform-tooling.md) |
| 39 | 2026-08-17 | §DOC-02bq | the design was right, the encoding was inert, and the engine had been demonstrating the correct form seve… | [P5](BACKLOG-5-platform-tooling.md) |
| 40 | 2026-08-17 | §DOC-02bp | the miscount was fixed inside a day, in a gate, and four documents were never told.… | [P5](BACKLOG-5-platform-tooling.md) |
| 41 | 2026-08-14 | §DOC-02bo | the report's own census counts a sentence of prose as a field, and the patcher it designs is immune to ex… | [P5](BACKLOG-5-platform-tooling.md) |
| 42 | 2026-08-14 | §DOC-02bn | the corpus's most accurate report, and the one sentence in it nobody measured is the origin of §AUDIT-03x… | [P4](BACKLOG-4-world-navigation.md) |
| 43 | 2026-08-14 | §DOC-02bm | two hours from spec to closed series, twelve of twelve pointers exact, and the one assertion that is red … | [P6](BACKLOG-6-verification-docs.md) |
| 44 | 2026-08-14 | §DOC-02bl | the removal shipped completely, and was undone twelve days later by a track that reused every one of its … | [P4](BACKLOG-4-world-navigation.md) |
| 45 | 2026-08-14 | §DOC-02bk | the program's first FULLY-SHIPPED verdict, its highest symbol score (43/43 node codes), and the one excep… | [P4](BACKLOG-4-world-navigation.md) |
| 46 | 2026-08-14 | §DOC-02bj | its geography is byte-perfect and its arithmetic reverses its own thesis. THE 2026-06-16 BLOCK IS NOW EMP… | [P4](BACKLOG-4-world-navigation.md) |
| 47 | 2026-08-14 | §DOC-02bi | every filename it catalogued is real, and it counted sixty-five of seventy-one.… | [P6](BACKLOG-6-verification-docs.md) |
| 48 | 2026-08-14 | §DOC-02bg | 59 of 62 citations exact and six node codes wrong, and the engine's own comments are why.… | [P3](BACKLOG-3-content-narrative.md) |
| 49 | 2026-08-13 | §DOC-02be | an unusually strong transcriber and an unreliable narrator — 31 of 31 citations exact, and every error in… | [P4](BACKLOG-4-world-navigation.md) |
| 50 | 2026-08-14 | §DOC-02bd | everything it borrowed is exact, everything it counted is wrong, and the world it describes is three time… | [P4](BACKLOG-4-world-navigation.md) |
| 51 | 2026-08-13 | §DOC-02bc | the one row it certified in its own words is the one row its own line numbers disprove.… | [P2](BACKLOG-2-engine-systems.md) |
| 52 | 2026-08-13 | §DOC-02bb | everything it read is right, and everything it added up is wrong.… | [P2](BACKLOG-2-engine-systems.md) |
| 53 | 2026-08-13 | §DOC-02ba | the diagnosis outlived the remedy by two months; the remedy lasted four hours.… | [P2](BACKLOG-2-engine-systems.md) |
| 54 | 2026-08-13 | §DOC-02az | the report is correct and the ground moved.… | [P4](BACKLOG-4-world-navigation.md) |
| 55 | — | §DOC-02ax | the algorithm the report describes is real, and it is in the caller.… | [P4](BACKLOG-4-world-navigation.md) |
| 56 | — | §DOC-02av | the repair reported success and wrote it to a different file.… | [P4](BACKLOG-4-world-navigation.md) |
| 57 | 2026-08-13 | §DOC-02au | the phases were right and the brakes were prose — every loop cap in the "All limits prevent runaway" tabl… | [P3](BACKLOG-3-content-narrative.md) |
| 58 | — | §DOC-02at | the report was right about every number and wrong about what the numbers meant, because it chose a conver… | [P4](BACKLOG-4-world-navigation.md) |
| 59 | 2026-06-09 | §DOC-02as | the last file in the `2026-06-09 11:06:54` block, and the corpus's best node-code result sits on top of a… | [P3](BACKLOG-3-content-narrative.md) |
| 60 | 2026-08-13 | §DOC-02ar | a 100 % identifier census over an arc that has never been completable past its second quest, and the repo… | [P3](BACKLOG-3-content-narrative.md) |
| 61 | 2026-08-13 | §DOC-02aq | the most accurate document the program has measured, dated to twenty-two minutes by a file inside its own… | [P5](BACKLOG-5-platform-tooling.md) |
| 62 | 2026-08-13 | §DOC-02ap | the tightest dating result in the corpus, a reference manual whose invented examples are the healthy part… | [P5](BACKLOG-5-platform-tooling.md) |
| 63 | — | §DOC-02ao | a perfect census, an arc nobody has played, and three surfaces that render only by accident.… | [P3](BACKLOG-3-content-narrative.md) |
| 64 | 2026-08-12 | §DOC-02an | a 100 % census beside an arc that has never been played.… | [P3](BACKLOG-3-content-narrative.md) |
| 65 | 2026-08-12 | §DOC-02am | the defect was a missing CALL, not a missing SYMBOL.… | [P2](BACKLOG-2-engine-systems.md) |
| 66 | 2026-08-12 | §DOC-02al | its drafts died and its ideas shipped.… | [P3](BACKLOG-3-content-narrative.md) |
| 67 | 2026-08-12 | §DOC-02ak | a verification pass tests what it CHANGES and assumes what it LEAVES.… | [P6](BACKLOG-6-verification-docs.md) |
| 68 | 2026-08-12 | §DOC-02aj | a spec that enumerates names ships its names; a spec that specifies voice ships nothing but its names.… | [P3](BACKLOG-3-content-narrative.md) |
| 69 | 2026-08-12 | §DOC-02ai | a world where Saul of Tarsus walks from Jerusalem to Damascus and is healed by a man named Anath. *(Its T… | [P3](BACKLOG-3-content-narrative.md) |
| 70 | 2026-08-12 | §DOC-02ah | the panel whose whole premise is being exact shipped a line count that was already 1,158 lines stale, and… | [P5](BACKLOG-5-platform-tooling.md) |
| 71 | 2026-08-12 | §DOC-02ag | the document that turned quest content from code into data, and the one section of it that describes some… | [P5](BACKLOG-5-platform-tooling.md) |
| 72 | 2026-08-12 | §DOC-02ae | the roadmap that said "none of these can be started in this session," and shipped one of them thirty-thre… | [P3](BACKLOG-3-content-narrative.md) |
| 73 | 2026-08-12 | §DOC-02ad | a finished instrument, a silent game, and a default registration that is a Flute wearing a Principal's la… | [P3](BACKLOG-3-content-narrative.md) |
| 74 | 2026-08-12 | §DOC-02ab | the schema shipped and scaled 35×, the script shipped 0 of 120 lines, and the ending it was written to ea… | [P3](BACKLOG-3-content-narrative.md) |
| 75 | 2026-08-12 | §DOC-02aa | a flag written and read eleven lines apart deleted the middle layer of a three-layer design, and nobody n… | [P2](BACKLOG-2-engine-systems.md) |
| 76 | 2026-08-12 | §DOC-02z | the program's most faithful content spec, into a world that moved out from under four of its nodes.… | [P4](BACKLOG-4-world-navigation.md) |
| 77 | 2026-08-12 | §DOC-02y | three companion arcs almost perfectly intact, and an engine comment that denies eight node records while … | [P3](BACKLOG-3-content-narrative.md) |
| 78 | 2026-08-12 | §DOC-02x | the report that wrote the repo's operating manual, audited by the program it recommended.… | [P6](BACKLOG-6-verification-docs.md) |
| 79 | 2026-08-12 | §DOC-02w | the mechanism is perfect, the design is unreachable, and the decision that scoped it was reverted by a co… | [P2](BACKLOG-2-engine-systems.md) |
| 80 | 2026-08-12 | §DOC-02v | the migration shipped complete, was silently reverted the same afternoon by a commit about book imports, … | [P2](BACKLOG-2-engine-systems.md) |
| 81 | 2026-08-12 | §DOC-02u | a near-perfect implementation of an arc that no player can enter — the program's FIRST 100 % casualty.… | [P3](BACKLOG-3-content-narrative.md) |
| 82 | 2026-08-12 | §DOC-02t | the design the report explicitly FORBADE is the design that shipped — and two Layer-18 stat fields drifte… | [P2](BACKLOG-2-engine-systems.md) |
| 83 | 2026-08-12 | §DOC-02s | the strongest survival the program has measured, fully reachable — and the arc's own stated payoff is the… | [P3](BACKLOG-3-content-narrative.md) |
| 84 | 2026-08-12 | §DOC-02r | a 100 % symbol census over a feature that is 55 % unreachable — and the arc's hardest check is a button.… | [P2](BACKLOG-2-engine-systems.md) |
| 85 | 2026-08-12 | §DOC-02q | a shop that works exactly as written, and a statistics ledger that forgets everything at the one boundary… | [P3](BACKLOG-3-content-narrative.md) |
| 86 | 2026-08-12 | §DOC-02p | the origin specification of the Curse Score, implemented almost perfectly, describing a system that has n… | [P3](BACKLOG-3-content-narrative.md) |
| 87 | 2026-08-12 | §DOC-02o | the report's thesis names a payoff, and the payoff is unreachable — the game declares four endings and ca… | [P3](BACKLOG-3-content-narrative.md) |
| 88 | 2026-08-12 | §DOC-02n | the design was a TRADE — take magic weapons away from monsters, give them back through fishing — and only… | [P2](BACKLOG-2-engine-systems.md) |
| 89 | 2026-08-12 | §DOC-02m | the report's design premise was right, was built, and was then extended fourfold — and nobody can reach a… | [P2](BACKLOG-2-engine-systems.md) |
| 90 | 2026-08-12 | §DOC-02l | 2026-08-12 — §DOC-02l ✅ SHIPPED `62b162a`: the spec shipped almost perfectly, then a rename broke the one… | [P3](BACKLOG-3-content-narrative.md) |
| 91 | 2026-08-11 | §DOC-02k | the one field-name this design lock got wrong is the one it spells two ways WITHIN ITSELF — and the engin… | [P3](BACKLOG-3-content-narrative.md) |
| 92 | 2026-08-11 | §DOC-02j | a report whose own appendix says its subject was never built, and six of its seven mechanics are live cod… | [P2](BACKLOG-2-engine-systems.md) |
| 93 | 2026-08-11 | §DOC-02i | the report that designed the documentation system was right about every number it measured and wrong abou… | [P6](BACKLOG-6-verification-docs.md) |
| 94 | 2026-08-11 | §DOC-02h | the most faithfully implemented arc in the program is 70% unplayable, and the report got every coordinate… | [P3](BACKLOG-3-content-narrative.md) |
| 95 | 2026-08-11 | §DOC-02g | a code that RESOLVES is not a code that is RIGHT — and the lab report was the only source in the repo tha… | [P3](BACKLOG-3-content-narrative.md) |
| 96 | 2026-08-11 | §DOC-02f | the accuracy of a design document is not uniform across it — the transcribed half had a zero error rate a… | [P4](BACKLOG-4-world-navigation.md) |
| 97 | 2026-08-11 | §DOC-02e | the first report in the program that was RIGHT about something HEAD still gets wrong — and the first pair… | [P2](BACKLOG-2-engine-systems.md) |
| 98 | 2026-08-11 | §DOC-02d | the strongest survival in the program — 91% of its symbols resolve, 0% of its node codes do, and the repo… | [P3](BACKLOG-3-content-narrative.md) |
| 99 | 2026-08-11 | §DOC-02c | the first report in the program that fails as a description of the engine — and it fails at the thesis, n… | [P3](BACKLOG-3-content-narrative.md) |
| 100 | 2026-08-11 | §DOC-02b | the biggest report in the directory turned out to be a survival result, not a rot result — and its most u… | [P6](BACKLOG-6-verification-docs.md) |
| 101 | 2026-08-11 | §DOC-02a | the lab-report verification program opens on the oldest report, and the arc it checked shipped almost exa… | [P3](BACKLOG-3-content-narrative.md) |
| 102 | 2026-08-06 | §VM-01-G-FU-f2 | the three engine-special asks ANSWERED by the user (each per the filed recommendation) and the one that c… | [P2](BACKLOG-2-engine-systems.md) |
| 103 | 2026-08-06 | §SPARK-01-FU | + §LXX-01-FU ✅ SHIPPED `3338def`: the four double-pays die in one slice — LCY Aldous + DA2/DA3/DSF each p… | [P2](BACKLOG-2-engine-systems.md) |
| 104 | 2026-08-05 | §VM-01-G-FU-f | the SSJ tournament (Yugurt Cabin, §XLV) moved as the family's THIRD zero-delta no-op — one 124-line verba… | [P2](BACKLOG-2-engine-systems.md) |
| 105 | 2026-08-05 | §VM-01-G-FU-e | the §LXX family (CAN/DA2/DA3/DSJ/DSF) moved — four verbatim hooks + three NODE_PANELS entries + the famil… | [P2](BACKLOG-2-engine-systems.md) |
| 106 | 2026-08-05 | §VM-01-G-FU-d | the harbor chains (§SPARK-01/02 · §WHODUNIT-01 · §NAVAL-01 · §PORT-01/02 at LCY/SEN/GCI/DNF/MME) moved — … | [P2](BACKLOG-2-engine-systems.md) |
| 107 | 2026-08-05 | §VM-01-G-FU-c | the §ALCHEMY-01/§WISDOM-01 Roen-arc stack moved as the family's SECOND zero-delta no-op — six verbatim ho… | [P2](BACKLOG-2-engine-systems.md) |
| 108 | 2026-08-05 | §VM-01-G-FU-b | the §HUNT-01/02 stack moved as a PROVABLE NO-OP — four verbatim hooks, five NODE_PANELS entries, zero ver… | [P2](BACKLOG-2-engine-systems.md) |
| 109 | 2026-08-05 | §VM-01-G-FU-a | the §CROWN-01 stack moved — seven combat verbs, two verbatim hooks, two once-panels — and the arc's own g… | [P2](BACKLOG-2-engine-systems.md) |
| 110 | 2026-08-05 | §VM-01-G-FU | ✅ SHIPPED `02ff4aa`: the engine-region Class-F tail censused end to end, ZERO dead references, and gate #… | [P2](BACKLOG-2-engine-systems.md) |
| 111 | 2026-08-05 | §VM-01-G4d | the D3 concurrent menu + the two Class-E strays, and the §VM-01-G4 slice plan is COMPLETE. On "continue" … | [P2](BACKLOG-2-engine-systems.md) |
| 112 | 2026-08-04 | §VM-01-G4c | the button mode gets its first consumers, and "13 D1 verbs" measured down to 4. On "continue" took the bo… | [P2](BACKLOG-2-engine-systems.md) |
| 113 | 2026-08-04 | §VM-01-G4b | the first `choice` in the game's history, and the schema grew one mode because a choice has no button. On… | [P2](BACKLOG-2-engine-systems.md) |
| 114 | 2026-08-04 | §VM-01-G4a | the `choice` opcode has a host end at last, and the `cost` leaf says the price out loud. On "continue" th… | [P2](BACKLOG-2-engine-systems.md) |
| 115 | 2026-08-04 | §VM-01-G4 | CHILD LAB REPORT ⚠️ DESIGN LOCKED PENDING ONE ASK `f340143` (the ASK is now ANSWERED — see NEWEST): the `… | [P2](BACKLOG-2-engine-systems.md) |
| 116 | 2026-08-04 | §VM-01-G2b | the ctx design that blocked this slice was ONE FIELD — and moving the 29 blocks read five narrative beats… | [P2](BACKLOG-2-engine-systems.md) |
| 117 | 2026-08-04 | §AUDIT-03q | the born-dead code class is a gate now — and the reading pass that filed this row had itself left one beh… | [P6](BACKLOG-6-verification-docs.md) |
| 118 | 2026-08-04 | §AUDIT-03m-FU | the PENDING tail is empty, and the two docs that were already "swept" turned out to be gate-green over 35… | [P6](BACKLOG-6-verification-docs.md) |
| 119 | 2026-08-04 | §AUDIT-03p | the Void's "first crack" line now reaches 13 nodes instead of 5, and gate #13 can finally see inside a fu… | [P3](BACKLOG-3-content-narrative.md) |
| 120 | 2026-08-04 | §AUDIT-03m | the two live narrative docs stop speaking 26×16, and the sweep is a measured tool with a gate — but the c… | [P6](BACKLOG-6-verification-docs.md) |
| 121 | 2026-08-04 | §DX-02l-FU | the assertion went red on the prose that records the defect it checks for. It now flags only what an auth… | [P5](BACKLOG-5-platform-tooling.md) |
| 122 | 2026-08-04 | §AUDIT-03k | Yael was two people. The alias map collapses all seven display-name splits, and gate #14's new phase make… | [P3](BACKLOG-3-content-narrative.md) |
| 123 | 2026-08-03 | §DX-02l | the deliberate-backup endpoint got the `./api.sh` wrapper it never had — and the sweep the row asked for … | [P5](BACKLOG-5-platform-tooling.md) |
| 124 | 2026-08-03 | §DX-02k | the argless `save()` was not a stray test call. It was the server's own per-write path, and it wrote a 5.… | [P5](BACKLOG-5-platform-tooling.md) |
| 125 | 2026-08-03 | §DX-02h | + §DX-02i ✅ SHIPPED TOGETHER `a047348`: the row said one monster was unreachable; 55 are. The doc that ma… | [P5](BACKLOG-5-platform-tooling.md) |
| 126 | 2026-08-03 | §DX-01e-FU | the seed inbox's 36 pointers were migrated, and 35 of them pointed at unrelated code. The four claims the… | [P6](BACKLOG-6-verification-docs.md) |
| 127 | 2026-07-31 | §DX-01e | a doc anchor now names a SYMBOL, and 43 of the 50 anchors in the live docs were pointing somewhere else. … | [P6](BACKLOG-6-verification-docs.md) |
| 128 | 2026-07-31 | §DX-02g | two monsters carried a tier the engine has no entry for, and all four readers of that field answered with… | [P2](BACKLOG-2-engine-systems.md) |
| 129 | 2026-07-31 | §AUDIT-03n | the ending called three of your six friends strangers no matter how you played. The row named 12 dead ent… | [P3](BACKLOG-3-content-narrative.md) |
| 130 | 2026-07-31 | §AUDIT-03j | the engine's own node references resolve, and gate #13 keeps them that way. The row named 9 dead keys in … | [P4](BACKLOG-4-world-navigation.md) |
| 131 | 2026-07-30 | §DX-01d | + §DX-01i ✅ SHIPPED TOGETHER: every `del` in the API reported success and changed nothing on disk. Not ju… | [P6](BACKLOG-6-verification-docs.md) |
| 132 | 2026-07-30 | §DX-02f | the two undocumented reds were STALE TESTS, not mechanic drift. The Playwright red set is now four, in on… | [P6](BACKLOG-6-verification-docs.md) |
| 133 | 2026-07-30 | §DX-01c | `./api.sh post monster` works. WBAPI Hazard #2 is retired, and with it the standing API-first exception t… | [P5](BACKLOG-5-platform-tooling.md) |
| 134 | 2026-07-30 | §AUDIT-03h | the last 10 display-name `npc` values are keys now — and the one the row could not resolve turned out not… | [P3](BACKLOG-3-content-narrative.md) |
| 135 | 2026-07-29 | §AUDIT-03l | the node-code reference is generated now, and the 26×16-era tables are quarantined instead of quietly wro… | [P4](BACKLOG-4-world-navigation.md) |
| 136 | 2026-07-29 | §AUDIT-03c | the `710bb75` remap audit closes — 6 of 8 remaps were right, and the *table that caused them* is the real… | [P4](BACKLOG-4-world-navigation.md) |
| 137 | 2026-07-29 | §DX-02e | the §KG corridor road was never broken — the test had pinned generated coordinates. One of the two carrie… | [P4](BACKLOG-4-world-navigation.md) |
| 138 | 2026-07-29 | §AUDIT-03g | the last 68 quests get an NPC anchor — `./api.sh audit` reports `errors: 0` for the first time, and not o… | [P3](BACKLOG-3-content-narrative.md) |
| 139 | 2026-07-29 | §AUDIT-03e | the `code = key` backfill — 287 nodes stop sharing ONE `undefined` state slot, and five §KG NPCs speak fo… | [P4](BACKLOG-4-world-navigation.md) |
| 140 | 2026-07-29 | §AUDIT-03b | all 203 `long_john_silver_sen` mis-stamps re-anchored; the NPC-key vocabulary and the WBAPI field patcher… | [P3](BACKLOG-3-content-narrative.md) |
| 141 | 2026-07-28 | §AUDIT-03b | , ZERO EDITS MADE — ⚠️ INCOMPLETE, paused to save tokens. The whole derivation is recorded in the §AUDIT-… | [P3](BACKLOG-3-content-narrative.md) |
| 142 | 2026-07-28 | §AUDIT-03f | `removeFns` is comment-aware — `quest_sea_01` + `quest_sb_01` restored to the WBAPI parse; parse-parity i… | [P5](BACKLOG-5-platform-tooling.md) |
| 143 | 2026-07-28 | §AUDIT-03a | same session as §DX-01a below: `check:dupkeys` is gate #11 of `check:walk`; the last-key-wins rot class i… | [P6](BACKLOG-6-verification-docs.md) |
| 144 | 2026-07-28 | §DX-01a | `check:walk` is fully green for the first time since 2026-07-08 (§JUNK-01 closed with it). On "continue" … | [P6](BACKLOG-6-verification-docs.md) |
| 145 | 2026-07-28 | §DX-01f | the `[x]`-row bulk migration — BACKLOG.md is now genuinely-open work only. On "continue" took the backlog… | [P6](BACKLOG-6-verification-docs.md) |
| 146 | 2026-07-28 | §VM-01-G3 | Class-C quest activation is declarative — and the silent-rot thesis proved out three more times. On "cont… | [P2](BACKLOG-2-engine-systems.md) |
| 147 | 2026-07-28 | §VM-01-G2 | NODE_HOOKS — 7 Class-E bespoke blocks (~440 lines) leave storyRender as verbatim registered hooks, proven… | [P2](BACKLOG-2-engine-systems.md) |
| 148 | 2026-07-28 | §VM-01-G | (`cf2c17c`) + G1 NODE_PANELS SHIPPED (`25c3710`) + 2 dead-panel fixes (`bf6f486`, `7a130cd`). Resumed `fe… | [P2](BACKLOG-2-engine-systems.md) |
| 149 | 2026-07-28 | §NPC-01-SF4 | dead codes `CQ`/`SQ`/`GC` remapped to `CDG`/`NUE`/`TRD` — §NPC-01 is now FULLY CLOSED (A–D + SF1–6 all sh… | [P3](BACKLOG-3-content-narrative.md) |

---

## Archived §RESUME entries

> *§RESUME entries for 2026-07-22/23 (§NPC-01-D Talk verb · §NPC-01-SF6 · §POT-PROMOTE · the cleanup/prompt.md-polish passes · §DX-01b/g · §BOARD-01-VOID-GATE · §VM-01 A/B/C/D/E/F/F-FU) moved verbatim → plan-archive.md §"Archived 2026-07-28 — §DX-01f".*
>
> *Earlier §RESUME entries — **2026-07-21 and before** (§VM-01 Inc-A-open + track-open, all §BOARD-01-FU, §CLEANUP-01 landing, §PLAY-01/§DEATH-01/§XP-01, §MESH-01/02, and the older operational notes) — archived verbatim to **plan-archive.md** § "Archived 2026-07-23 — §RESUME snapshots". Standing operational guidance lives in CONTRIBUTING.md; the no-jump-travel invariant in prompt.md §6.*


---

> **Archive:** all closed / completed work (§WALK, §TIMELESS-01, §WBAPI-01, §EDITOR-01-D / -02 / -FU, §CELL-14, the full §ARCH-01 wave-by-wave history, **§NAV-01 Inc a–g + diagnosis/layer-stack/data-shapes, §MESH-01 in full, §MESH-02 (a)–(j), the five 2026-07-07 Game Content closes (§GR · §DESIGN-03 · §DUNGEON-01 · §MATH-01 · §FUTURE-01) + the fishmongerRowRestored payoff + the §MBIT-02 bitLabel record**, and prior §RESUME snapshots) lives in **[plan-archive.md](plan-archive.md)** — the 2026-07-03 sections, the three 2026-07-06 sections, the **2026-07-07 section** (§MESH-02 + Game Content close pass), the **2026-07-23 sections** (§PLAY-01 + the pre-07-22 §RESUME snapshots), and the **2026-07-28 §DX-01f section** (the closed-`[x]`-row bulk: §NPC-01 · §CLEANUP-01 body · §VM-01 A–F-FU · §BOARD-01 0/A/B/C + FU1–8 · Mechanics · Multiplayer · Game Content · the 07-22/23 §RESUME snapshots) each record the verification (commits + greps + green gates) run before their blocks were moved.

---

*© 2026 Paul Richeson — MIT License.*
