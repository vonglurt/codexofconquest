<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# The Art of Resuming: Architecting a Prompt Payload as a Scavenger Hunt Over a Corpus Larger Than the Window

**Codex of Conquest — Process & Method Report**
*2026-08-23*

---

## Abstract

This report describes the method by which a session with no conversation history re-enters a long-running engineering loop over a repository whose readable surface is several times larger than any context window that can hold it. The naive framing — *load the project, then work* — is unavailable and has never been available; the corpus measures **13.6 MB across documentation and the artefact it describes**, against a window that must also hold the reasoning, the tool output, and the work itself. What replaces it is a **staged, indexed retrieval** we call a *scavenger hunt*: a small fixed core read in full, a routing index that names where everything else is, and situated reads that are bounded at the point of the call rather than trimmed after the fact. We give the measured sizes of every text in the read set, the topology of the hunt, and the read trace of the session that produced this document — including **two retrieval failures**, in which unbounded searches over the backlog produced 248.6 KB and 36.5 KB of output that had to be spilled to disk rather than read. We identify a pathological case in this repository: **a single line of Markdown 234,650 bytes long** — roughly 59,000 tokens, or an estimated 10 % of a large window — sitting in the section of a file explicitly designed to be skimmed first. Finally we state the **100 k refresh**: a cadence rule requiring the core to be re-read whenever accumulated context passes each 100,000-token boundary, on the grounds that a directive read once at token zero is a directive being recalled, not read, by token 300,000.

**Index Terms** — context windows, retrieval, prompt engineering, session resumption, working memory, documentation architecture, long-running agents, bounded reads.

---

## 1. Introduction

A session begins empty. Whatever the last one knew, this one does not, and the only inheritance is what was written to disk before the previous session stopped. This is the ordinary condition of the work in this repository — the standing directive is *one increment per continue*, each increment must survive a context switch, and the hand-off is a file, not a memory.

The instinct is to solve this by reading more. It does not scale, and the reason is arithmetic rather than technique. The documentation tree alone is **8,108,581 bytes across 173 Markdown files**; the artefact it describes, `play.html`, is a further **5,513,582 bytes in 38,712 lines**. At an approximate four bytes per token for English prose, that is on the order of **3.4 million tokens** of readable material — and a context window is not a library card, it is a desk. Everything on it competes: the corpus, the tool output, the reasoning, and the work product.

So the question is not *how much can be loaded* but *what is worth a slot*. The answer this repository has converged on is a hunt with three tiers — a **core** read whole, an **index** that routes, and **situated reads** that are bounded at the call — plus a cadence rule that re-reads the core as the session lengthens. What follows is that architecture, measured.

The framing matters. A scavenger hunt is not a search. A search asks the corpus a question and hopes the corpus answers; a hunt follows a prepared trail, where each station names the next one and carries just enough to be useful on its own. The trail here was laid deliberately, over many sessions, by the same loop that consumes it — every increment that ships is required to leave its station behind. That property, not any individual document, is what makes resumption cheap.

---

## 2. The Corpus, Measured

All figures re-derived at `dc3c438` on 2026-08-23.

| Text | Bytes | Lines | Est. tokens | Role |
|---|---:|---:|---:|---|
| `resume.md` | 22,395 | 421 | ~5,600 | **Core** — the procedure and the directive |
| `CONTRIBUTING.md` | 30,064 | 186 | ~7,500 | **Core** — the policies, verbatim and binding |
| `docs/design/index.md` | 112,130 | 880 | ~28,000 | **Core** — master index, constants, `S_story` fields |
| `docs/backlog/BACKLOG.md` | 39,342 | 249 | ~9,800 | **Core** — routing index + §RESUME chronology |
| **Core subtotal** | **203,931** | **1,736** | **~51,000** | read in full, every session |
| `BACKLOG-1-playable-truth.md` | 333,805 | 356 | ~83,000 | situated |
| `BACKLOG-2-engine-systems.md` | 567,917 | 1,143 | ~142,000 | situated |
| `BACKLOG-3-content-narrative.md` | 304,747 | 624 | ~76,000 | situated |
| `BACKLOG-4-world-navigation.md` | 158,708 | 334 | ~40,000 | situated |
| `BACKLOG-5-platform-tooling.md` | 262,347 | 586 | ~66,000 | situated |
| `BACKLOG-6-verification-docs.md` | 634,844 | 581 | ~159,000 | situated |
| **Six phase backlogs** | **2,262,368** | **3,624** | **~566,000** | 180 `###` sections |
| `plan-archive.md` | 613,635 | 1,030 | ~153,000 | situated, rarely |
| `docs/lab-reports/` (115 files) | 2,700,590 | — | ~675,000 | situated, one at a time |
| `docs/` total (173 files) | 8,108,581 | — | ~2,027,000 | — |
| `play.html` | 5,513,582 | 38,712 | ~1,378,000 | never read whole |
| `vendor/` (350 imported source texts) | ~64,147,000 | — | — | gitignored; consulted by name |

Two observations carry the rest of this report.

**The core is 2.5 % of the documentation and answers most questions.** Fifty-one thousand tokens buys the directive, the policies, the master index and the routing chronology. Everything else in the tree is reachable *by name* from those four files, which is a property they were given on purpose and which has to be maintained on purpose.

**No phase backlog is safely readable in full.** `BACKLOG-6` alone is an estimated 159,000 tokens. A session that opens one to find one row has spent more of its window on the container than the entire core costs, and has learned less.

---

## 3. The Read Set: Core, Index, Situated

### 3.1 The core, read in full and in order

1. **`resume.md`** — the procedure. Its §1 is the directive stated whole, self-contained, so a session that reads nothing else can still run the loop correctly.
2. **`docs/backlog/BACKLOG.md`** — *what happened last*. Since the six-way split it carries no rows, only the directive, the phase routing table, and the 151-entry cross-phase §RESUME chronology, newest first.
3. **`docs/design/index.md`** — *where things live*. The Doc Health Badge, the repository map, the Lab Report Index, the Reverse Lookup keyword table, the design constants, the `S_story` field table.
4. **`CONTRIBUTING.md`** — the policies, when the increment touches one.

The order is not decorative. Reading the procedure first establishes what a row *is*; reading the chronology second establishes which row is *next*; reading the index third establishes where the row's evidence *lives*. Reversing any pair costs a re-read.

### 3.2 The index tier

Between the core and the corpus sit three routing artefacts, each of which converts an unbounded search into a named lookup:

- **`BACKLOG.md`'s phase table** — six files, named by subsystem, with open-row counts. Converts *"what is next"* into *"open this file"*.
- **`index.md`'s Reverse Lookup** — keywords to files. Converts *"where is the fishing logic documented"* into a filename.
- **`index.md`'s Lab Report Index** — 86 rows, each naming a report and what it *does*. Converts *"has this been written up"* into a scan.

The index tier is the part that rots, because it is the part nothing executes. `§DX-01j` was filed the same day this report was written for exactly that reason: the Lab Report Index listed **80 of 115** reports, and its header claimed 78 over a table of 79.

### 3.3 Situated reads

Everything else is read at the moment a specific question needs it, in the smallest slice that answers it, and bounded at the call. §5 is about how.

---

## 4. Topology of the Hunt

A resumed session traverses a fixed shape. Each station is cheap, and each names the next.

```
  resume.md §1 ─────────────► the directive, whole (~5.6k tokens)
        │
        ▼
  git status; git log -8 ───► is there an unfinished increment? (~0.2k)
        │                     dirty tree outranks every other rule
        ▼
  BACKLOG.md §RESUME ───────► what happened last, and in which phase file (~9.8k)
        │
        ▼
  <phase file>, sliced ─────► the row itself, bounded (~1–3k)
        │                     sed -n 'A,Bp' | cut -c1-600
        ▼
  grep to DISPROVE ─────────► the row's premise, against the code (~0.5k)
        │
        ▼
  index.md, sliced ─────────► the badge, the constants, the field table (~1–2k)
        │
        ▼
  the artefact, by symbol ──► grep -n 'symbol' play.html, never the file (~0.3k)
```

Total for a routine increment: **on the order of 20,000 tokens of retrieval** against a corpus of 3.4 million. The ratio is the whole point — approximately **0.6 %** of the readable surface, selected rather than sampled.

The trail is maintained by the loop it serves. Step 10 of the per-increment procedure requires the row to be edited in place with its evidence, cut into `plan-archive.md`, and given a §RESUME entry plus a `BACKLOG.md` pointer. That is four writes whose only purpose is to make the *next* traversal cheap. A session that ships code and skips them has completed the work and destroyed the trail.

---

## 5. Bounded Reads, and Two Failures

### 5.1 The failures, as they happened

This session opened with a reasonable-looking question — *does the backlog already have a row about DNS or GitHub Pages?* — and asked it in the obvious way:

```bash
grep -rn -i "apex\|github pages\|DNS" docs/backlog/*.md | head -40
```

The `head -40` was the mistake, and it is a subtle one. `head` bounds the number of **lines**, and the lines in these files are not line-shaped: the median line in `BACKLOG-6` is 192 bytes, but the maximum is **234,650**. Forty lines of a file like that is not a preview, it is an unbounded read wearing a limit. The call returned **248.6 KB**, which the harness spilled to a file rather than deliver.

The second attempt made the same assumption in a different place — `sed -n '50,140p'` on a phase file, ninety lines — and produced **36.5 KB**, spilled again.

The third attempt worked, and the difference is one clause:

```bash
awk 'NR>=57 && NR<=100' BACKLOG-6-verification-docs.md | cut -c1-600
```

`cut -c1-600` bounds **bytes per line**, which is the dimension that actually varies. Six hundred characters is enough to read a row's headline, its verdict and its first measurement — which is enough to decide whether to read more.

### 5.2 The pathological case

`docs/backlog/BACKLOG-6-verification-docs.md:39` is a single line of **234,650 bytes** — an estimated **59,000 tokens**, more than the entire core read set, on one line. It is the `§DOC-02` glance bullet, and it sits in the *"Open at a Glance"* section: the part of the file whose stated purpose is to be skimmed before anything else.

Across the six phase backlogs, **64 lines exceed 4,000 bytes** and **4 exceed 10,000**. This is not a formatting nit. It means that in this corpus, *line count is not a proxy for size*, and every tool whose bound is expressed in lines — `head`, `tail`, `sed -n 'A,Bp'`, an editor's page-down — is an unbounded read until proven otherwise.

Filed as **§DX-01k**.

### 5.3 The rules that follow

- **Bound the dimension that varies.** `cut -c1-N` on any read of a backlog or archive file. `head` bounds lines; lines here are not the unit of size.
- **Grep for a filename before grepping for a concept.** `grep -rn "ieee-dns" docs` returns a handful of hits; `grep -rn -i "DNS" docs/backlog` returns a quarter of a megabyte. The narrower question is usually the one you actually have.
- **Count before you read.** `grep -c`, `wc -l`, `ls | wc -l` cost nothing and convert an unknown read into a decision.
- **Read the artefact by symbol, never by range.** `play.html` is 38,712 lines; the doc-anchor convention (`` `symbol@1234` ``) exists precisely so that a citation resolves by *name* with the number as a refreshable hint. The gate `check:anchors` holds 4,713 anchors across 119 documents, zero dead.

---

## 6. The 100 k Refresh

> **Re-read the core whenever accumulated context passes each 100,000-token boundary.**

The argument is not about forgetting, which is the wrong model. Nothing falls out of a context window that has not been truncated. The argument is about **salience decay**: a directive read at token zero and then buried under 300,000 tokens of tool output, file slices, diffs and reasoning is still present and no longer *loud*. What follows is the observable failure mode — a session that keeps working correctly in the small while drifting in the large. It stops cutting rows into the archive. It starts doing side findings inline instead of filing them. It answers the row it is on and forgets the hand-off. Each of those is a violation of a rule it read, correctly, and has not consulted since.

The cadence is cheap because the core is small. Fifty-one thousand tokens is a re-read that costs less than one unbounded grep of the kind §5.1 documents, and it restores the directive to the position it had at token zero.

**The rule, stated operationally:**

1. At each 100 k boundary, re-read **`resume.md §1`** — the directive whole, ~5.6 k tokens. This is the minimum and it is non-negotiable.
2. At each 200 k boundary, add **`BACKLOG.md`'s §RESUME head** and the row currently in flight. Sessions drift on *which row they are on* before they drift on *how to work*.
3. Before the closing sequence of any increment — archive, commit, push, speak, hand off — re-read **`resume.md §4`**, the eleven steps. The closing sequence is the part most often abbreviated, because it happens when the interesting work is already done.
4. On any context summarisation event, treat the resumed context as **token zero** and read the full core again. A summary preserves conclusions and discards the trail; the trail is what the next station needs.

**What is deliberately *not* re-read:** the phase file, the archive, the lab reports, and the artefact. Those are situated, and re-reading them is how a session spends 200 k tokens learning what it already decided.

---

## 7. The Resume Prompt as an Engineered Artefact

The entry point to all of the above is a single pasteable block, `resume.md §1`. It is worth stating what makes such a block work, because the version this file replaced did not.

The prior §1 was five lines: read two files, start the API, pick a row, implement, hand off. Every clause was true. It was still inadequate, and the diagnostic is precise — **it summarised the procedure to a reader who had the procedure, for a reader who does not.** A cold session pasting it would have missed one-row-per-continue, disprove-the-row, measure-before-and-after, findings-become-rows, update-the-index-with-the-row, cut-the-row-into-the-archive, push, speak, and the hand-off stop. Nine rules, all of them written down elsewhere in the same file, none of them reachable by a reader who stopped where the prompt stopped.

The properties that fixed it:

- **Self-containing.** A session that reads *only* the prompt runs the loop correctly. Everything below §1 is the same instruction expanded, not additional instruction. This is the single highest-value property and it is testable: delete everything after §1 and ask whether the loop still runs.
- **Imperative, not descriptive.** *"Take exactly one open row"*, not *"the loop is one row at a time"*. A description invites interpretation; an instruction does not.
- **The prohibitions are explicit.** *"Never by curl"*, *"never piped"*, *"not permission to start three rows"*. Every one of those exists because it was violated once, and the cost is recorded in the backlog.
- **The stop is stated.** A loop without an explicit terminator runs until the window ends. *"Then HAND OFF … and STOP"* is a line of the directive, not an implication of it.
- **It names its own escape hatch.** *"Ask only when the answer would be a guess dressed as a decision"* — which resolves the standing tension between deciding on behalf of the backlog and escalating, without requiring a judgement call about judgement calls.

---

## 8. Failure Modes and First Diagnostic

| Failure | Symptom | First diagnostic |
|---|---|---|
| Unbounded read | Tool output spilled to a file; a "preview" instead of an answer | Was the bound expressed in **lines** over a file with 4 kB lines? Re-issue with `cut -c1-600`. |
| Redoing shipped work | A row's premise does not reproduce | `git status` + `git log` first; **grep to disprove** the row. Four rows have closed as ALREADY SHIPPED. |
| Salience decay | Correct in the small, drifting in the large; the closing sequence gets abbreviated | Past a 100 k boundary without a core re-read? Re-read `resume.md §1`. |
| Trail destruction | The work shipped; the next session cannot find it | Was the row cut into `plan-archive.md`, with a §RESUME entry and a `BACKLOG.md` pointer? |
| Index rot | The index names a count that no command reproduces | Every number in `index.md` must carry the command that measured it. See §DX-01j. |
| Stale citation | A cited line number points at unrelated code | Anchors name a **symbol**; the number is a hint. `npm run check:anchors`. |
| Scope drift | Findings handled inline; the increment grows | Findings become **rows**. The rule is what makes the backlog trustworthy. |

---

## 9. Verification: This Session's Trace

The method is stated above; this is what it actually cost, measured on the session that produced this report.

| Station | Read | Bytes retrieved | Outcome |
|---|---|---:|---|
| 1 | `resume.md`, full | 22,395 | the directive |
| 2 | `git status` + `git log -8` + session count | ~600 | **dirty tree → selection rule 1 fired** |
| 3 | `docs/README.md` diff + report head, 40 lines | ~4,900 | the unfinished increment identified |
| 4 | `BACKLOG.md`, head 120 | ~19,000 | routing table + chronology |
| 5 | `grep -rn -i "apex\|DNS" docs/backlog` | **248,600 — spilled** | ✗ failure, §5.1 |
| 6 | `sed -n '50,140p'` on a phase file | **36,500 — spilled** | ✗ failure, §5.1 |
| 7 | `awk 'NR>=57 && NR<=100' \| cut -c1-600` | ~7,800 | ✓ the row, bounded |
| 8 | `index.md`, three slices | ~9,400 | badge, index header, section list |
| 9 | `pages.yml` + report §7 | ~4,300 | **the finding: no `CNAME`, hazard live** |
| 10 | six `comm`/`grep -c` measurements | ~1,200 | 80 of 115 listed → §DX-01j |

**Retrieved successfully: ~69,600 bytes (~17,400 tokens) — 0.5 % of the readable corpus.** Spilled: 285,100 bytes, four times what was read on purpose, from two calls out of roughly thirty. The failures were not expensive in tokens, because the harness caught them; they were expensive in **hops**, and hops are the currency of a hunt.

The increment that trace produced shipped as `9b28184`: a lab report registered in three references, two findings filed as rows, and a doc-health badge re-measured. Gates green — `check:legacycodes` exit 0, `check:anchors` 4,713 anchors across 119 documents, zero dead.

---

## 10. Conclusion

Resumption is not a memory problem, and treating it as one produces the wrong architecture — bigger loads, longer prompts, more summarisation. It is a **retrieval-order** problem, and the corpus is a data structure whose access pattern can be designed.

Three properties do the work. A **small core, read whole**, that costs 2.5 % of the documentation and answers most questions. A **routing tier** that converts searches into lookups, maintained by the same loop that consumes it, so that every increment that ships leaves its station behind. And **bounded situated reads**, bounded in the dimension that actually varies — which in this corpus is bytes per line, not lines, a fact one 234,650-byte line makes unambiguous.

To those the **100 k refresh** adds the only thing the structure cannot supply on its own: the directive stays loud. A rule read once and buried is a rule that will be violated correctly-seeming late in a long session, and the cheapest possible defence is to read the smallest text in the tree again.

The self-check is a single question, and it is answerable at any moment: *if this session ended now, could the next one pick up from the committed tree, the edited row, and the §RESUME entry alone?* If yes, the trail holds. If no, the work is not finished regardless of what the code does.

---

## Appendix A — The Read Commands

```bash
# 0. The core, in order. Read these whole.
cat resume.md                                  # 22 KB — the directive
sed -n '1,120p' docs/backlog/BACKLOG.md        # routing table + newest §RESUME
sed -n '1,130p' docs/design/index.md           # badge, structure, directive
# CONTRIBUTING.md when the increment touches a policy

# 1. Prove the ground before anything else.
git status --short; git log --oneline -8
ps aux | grep -c ' claude$'                    # >1 → stop and ask

# 2. Size a file before opening it. Lines lie in this corpus.
wc -c docs/backlog/BACKLOG-6-verification-docs.md
awk '{if(length>m){m=length;n=NR}} END{print m, "at :"n}' <file>

# 3. Locate a row without reading its file.
grep -n '^### §' docs/backlog/BACKLOG-*.md     # section headers only
grep -rn '§DX-02xx' docs/backlog/BACKLOG*.md   # all six — Existing-Work-First

# 4. Read it bounded. cut -c bounds the dimension that varies.
awk 'NR>=57 && NR<=100' <file> | cut -c1-600

# 5. Read the artefact by symbol, never by range.
grep -n 'functionName' play.html
npm run check:anchors --prefix src             # 4,713 anchors, zero dead

# 6. Count instead of reading, wherever a count decides.
ls docs/lab-reports/*.md | wc -l
grep -c '<li><a href=' index.html
```

## Appendix B — The Core, Re-read Cadence

| Boundary | Re-read | Cost |
|---|---|---:|
| every 100 k tokens | `resume.md §1` — the directive whole | ~5.6 k |
| every 200 k tokens | + `BACKLOG.md` §RESUME head + the row in flight | ~12 k |
| before every close-out | `resume.md §4` — the eleven steps | ~1.5 k |
| after any summarisation | the full core — treat as token zero | ~51 k |

---

## References

1. `resume.md` — the standing directive and the eleven-step per-increment procedure.
2. `CONTRIBUTING.md` — API-first, cell-first, free-movement, test-run and doc-anchor policies.
3. `docs/design/index.md` — master document index, Doc Health Badge, Lab Report Index, Reverse Lookup.
4. `docs/backlog/BACKLOG.md` — routing index and the 151-entry cross-phase §RESUME chronology.
5. `docs/backlog/BACKLOG-6-verification-docs.md` §DX-01g — the six-way split, verified line-exact.
6. `docs/lab-reports/lab-report-ieee-dns-apex-github-pages-community.md` — the increment whose read trace §9 records.
7. `src/scripts/resolve-anchors.js` — the anchor gate: symbols resolve, numbers are hints.

---

*© 2026 Paul Richeson — MIT License.*
