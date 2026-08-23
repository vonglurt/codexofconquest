<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->
# Lab Report — §WBAPI-01 ph3: Source-Level PATCH for Structured Fields

**Track:** §WBAPI-01 phase 3 · **Status:** SHIPPED (`a105e0e`) · **Filed:** 2026-06-27 (UTC) = 2026-06-26 17:48 PDT
**Scope as written:** the "full-array PATCH" item of §WBAPI-01 phases 3–5. ph4 (worldbuilder write tab) and ph5 (standalone Node module) were held separate; both closed the same evening.
**Verification pass:** §DOC-02bo, 2026-08-14. Reference tree `a105e0e^`; as-built compared against HEAD.

---

## Abstract

This repository authors a multi-megabyte single-file game through a REST API rather than by hand
(prompt.md invariant #7). That guarantee had a hole: `PUT /api/{type}/{key}` persisted **string and
null** field values and nothing else. Array, number and boolean values took a second branch that
updated the in-memory object and returned `ok:true` — while `save()` writes the *patched raw source
text*, not a re-serialization of the model. The write was therefore reported as a success and
discarded at the next save.

This report specifies the repair: a **source-level literal patcher** that serializes a JSON-safe
value into codebase-style JS-literal text and splices it over the field's existing value in the raw
buffer, bracket-, string- and comment-aware. Three functions are locked (`serializeJsLiteral`,
`patchLiteralField`, `WBAPI.editStructuredField`), the server's PUT dispatch is rewired to them, and
the acceptance criterion is a **round trip** — patch, save, reload, re-read, compare.

The defect class is the one this repo keeps rediscovering and which CONTRIBUTING later named as
Hazard #2 and Hazard #5: *a write into a real-but-wrong place never throws.* Nothing here failed
loudly. An author edited a quest's `killGoals`, saw a green tick, saved, restarted, and found the old
array — with no error anywhere in the chain to blame.

---

## Method (verification pass)

1. **Dating.** `stat` on the report file, then `git log --follow` for its birth commit; both compared
   against the stated header date.
2. **Census replay.** The §1 field inventory re-measured against `git show a105e0e^:roll2hit-v3.html`
   — both by regex and by loading the archived file through `js/wbapi-core` itself, so a prose match
   cannot be counted as a field.
3. **Symbol resolution.** Every named function located at HEAD; signatures compared token by token.
4. **Line citations.** The two `~NNNN` server pointers replayed against `a105e0e^` and `a105e0e`.
5. **Behavioural replay.** Each §3 contract clause executed against HEAD in a detached in-process
   `wbapi-core` instance (read-only; the game file was never written).
6. **Gate execution.** The report's own acceptance gate run, plus the three sibling stdlib gates that
   share its CI job.
7. **Forward history.** `git log -S` on each new symbol, read *past* the ship commit — the only way to
   see a later, differently-tagged track reverse a scope decision this report made.

---

## 1. The gap (as written — verified)

At `a105e0e^`, `js/wbapi-server.js` line **8899** opened the PUT field loop, and line **8902** split it
by value type. Both citations in the original are exact. The shape:

```js
if (typeof value === 'string' || value === null) {
  WBAPI.editField(type, resolvedKey, field, value);   // source-level patch of _rawSrc — PERSISTS
} else {
  ns.put(resolvedKey, { [field]: value });            // in-memory only
  // response literally read: 'non-string; call POST /api/save to persist'
}
```

The response note was the cruellest part: it told the author to call the very endpoint that would
throw the edit away. `save()` writes the patched `_rawSrc`; `ns.put` never touches `_rawSrc`.

**Why not just re-serialize the section?** Because QUEST_DB entries carry function bodies, and the
parser nulls every one of them on the way in (`removeFns`, so Node never evaluates browser globals).
Re-emitting the parsed object would write those nulls to disk and delete the game's logic. The
original cites `lab-report-wbapi-architecture.md` **§6** for this; **the claim is right and the
section is wrong** — §6.1 says the opposite, that non-string fields *"require Path B (full section
re-serialization)"*. The sentence actually relied on is in **§3.2**: *"Full re-serialization of the
QUEST_DB object would destroy all function bodies (since they were nulled during parse)."* Corrected
here. A reader who followed the original pointer would have landed on the prescription this report
exists to refuse.

`editField` cannot cover the gap either: `js/wbapi-core.js:function patchStringField(sectionSrc, entryKey@345`
locates a value with a regex anchored on an opening `"`, `'` or `` ` ``. A field whose value opens
with `[` is invisible to it — verified at HEAD.

### 1.1 The editable-field census, re-measured

Measured at `a105e0e^` (2,839 quests) both by regex and through `wbapi-core`'s own parse:

| Field (QUEST_DB) | Report | Measured | Verdict |
|---|---|---|---|
| `completeItems` | 180 | **180** | exact |
| `targetMonsterKeys` | 6 | **6** | exact |
| `killGoals` | 5 | **5** | exact |
| `notation` | 1 | **0** | **FALSE POSITIVE — kept, not deleted** |
| NODE_MAP array fields | "none" | **0** | exact |
| MONSTER_POOL | "key false-positives" | **0 fields**; the hits are `MONSTER_DROPS` keys | exact |

Three of four counts are byte-exact and both stated negatives hold. `notation` is not a field
anywhere in the file, at that build or this one. It is prose, inside a `passText` string on
`jrs_11_act2`: *"…marks each gap with a bracket notation: [unclear — 3 words approx]…"*. A `notation:`
followed by a `[`, in a sentence about a notary.

The irony is load-bearing rather than decorative. The same sentence **correctly** discounts the
MONSTER_POOL matches as false positives — those are `MONSTER_DROPS` entry *keys*, which live nested
inside MONSTER_POOL's anchors and would go on to cause a real defect a month later (§DX-01c's trophy-map
splice). One naive-grep artifact was caught and the one three columns to its left was not. And the
patcher the report goes on to design is **immune to exactly this class by construction** — §2 requires
it to be string-aware. Replayed at HEAD:

```
editStructuredField('quest','jrs_11_act2','notation',['x'])
  → { ok:true, inserted:true }      // no top-level field found: it INSERTED one
  → the passText prose is byte-identical afterwards
```

The implementation refutes the census that motivated it. *The design was better than its own
evidence.*

---

## 2. Design (as locked) → as built

- **`serializeJsLiteral(v)`** — string → single-quoted and escaped (`\\`, `\'`, `\n`, `\r`);
  number/boolean → `String(v)`; `null` → `'null'`; array → `[a,b,…]`; object → `{key:val,…}` with
  identifier keys unquoted. Rejects functions and `undefined`.
- **`patchLiteralField(sectionSrc, entryKey, field, literal)`** — `findEntryBounds` → token-walk the
  entry body at top level → determine the existing value's extent → splice the new literal. `null` if
  the entry or a *top-level* `field:` is not found.
- **`editStructuredField(type, idOrTitle, field, value)`** — mirrors `editField`: serialize, patch,
  insert if absent, update the in-memory model so reads stay consistent.
- **Wiring** — the server's `else` branch routes `Array.isArray(value) || typeof value === 'number' ||
  typeof value === 'boolean'` to `editStructuredField`. Plain objects stay on `ns.put` for now.

**As built** (all four shipped in `a105e0e`, same commit as this report):

| Symbol | Location at HEAD | Signature |
|---|---|---|
| `serializeJsLiteral` | `js/wbapi-core.js:function serializeJsLiteral(v) {@447` | identical |
| value-extent scanner | `js/wbapi-core.js:function _valueEnd(body, i) {@473` | (unnamed in spec) |
| `patchLiteralField` | `js/wbapi-core.js:function patchLiteralField(sectionSrc, entryKey@506` | identical |
| `editStructuredField` | `js/wbapi-core.js:editStructuredField(type, idOrTitle, field, value) {@1323` | identical |
| server dispatch | `js/wbapi-server.js:const r = WBAPI.editStructuredField(type, resolvedKey@11133` | as specified |

The `~8905` wiring pointer is exact to the line: at `a105e0e`, line 8905 is the new
`} else if (Array.isArray(value) …` branch itself.

---

## 3. Contract and edge cases — outcomes

| Clause | Outcome | Evidence |
|---|---|---|
| Round-trip fidelity | **HOLDS** | 8 of the gate's 13 checks are patch → reload → compare |
| Single-quote style, escapes | **HOLDS** | `targetMonsterKeys:['New Item A','O\'Brien\'s Token','multi\nline']` asserted in `_rawSrc` |
| Idempotent, no-op diff | **HOLDS, measured** | all **23** live array-field carriers at HEAD re-patched with their own value → `_rawSrc` byte-identical, first patch included: the serializer's output form *is* the codebase's own form |
| Absent field inserted before the closing brace | **HOLDS** | gate checks 10–11; raw literal, no surrounding quotes |
| Reject function-valued fields | **HOLDS** | returns `{ok:false, error:'… not JSON-serializable …'}` — the spec said `{ok:false}`, the *serializer* returns `null` and the caller wraps it |
| Reject "nested-too-deep" | **NOT SHIPPED — and not needed** | no depth limit exists; `{a:{b:{c:[1,{d:'e'}]}}}` serializes, patches and round-trips exactly |
| Out of scope: append/splice/merge | **HOLDS** | full-replace only at HEAD; no array-op endpoint |
| Out of scope: NODE_COORDS | **HOLDS** | still `PUT /api/coords/{code}`, 1 node per cell |
| Out of scope: plain objects | **REVERSED — see §5** | |

Six of seven contract clauses hold ten weeks on. The seventh is a capability the implementation
quietly exceeded: the spec promised a depth limit and shipped full recursion instead, which is why the
object extension of §5 needed no serializer work at all.

---

## 4. Test plan → what shipped

The plan specified a throwaway HTTP server on a temp copy of the game file, never touching `:1367`.
What was committed is one level lower and considerably more useful:
**`scripts/check-array-patch.js`** (`npm run check:arraypatch`), which loads the committed HTML
**read-only** into a detached `wbapi-core` and round-trips through `load(text)` — 13 checks:
escape-heavy string array, object array (`killGoals`), plain string array, two `_rawSrc` literal-shape
assertions, three reload-and-compare assertions, function-value rejection, absent-field insert plus its
round-trip, and a number scalar plus its round-trip. The HTTP end-to-end run was performed once by hand
and is recorded in the ship commit; it was not committed as a test.

**Green at HEAD, 2026-08-14:** `✓ §WBAPI-01 ph3 structured-field PATCH: all 13 checks pass`.

The gate carries its own repair history in a comment: it originally rode `completeItems`, and
`scripts/check-array-patch.js:// §ARCH-01 repoint (2026-07-06)@21` records the day §ARCH-01's W7d/W8a
swept that field out of QUEST_DB entirely and the string-array cases were moved to
`targetMonsterKeys`. *A gate that documents why it changed subject is worth two that do not.*

**Where the gate runs matters.** `check:arraypatch` is a **separate step in the CI `invariants` job**
and is **not** part of `npm run check:walk`. A session that verifies with `check:walk` — which is what
prompt.md §7 tells it to do — has not run this gate. Three sibling stdlib gates sit in the same
position (`check:itemchain`, `check:laddermigration`, `check:worlddiff`); all four were run for this
pass and all four are green (29, 148 and "all assertions hold" respectively). See §7.

---

## 5. What happened next — the deferred branch

> "Objects stay on the `ns.put` path for now."

That sentence was defensible when written and is the report's one consequential error. Measured at
`a105e0e^`, QUEST_DB held **zero** object-valued top-level fields — there was nothing for the branch to
serve. NODE_MAP, however, already carried **45** `battle:{…}` object fields, and every one of them
remained on a path that reports success and persists nothing.

Eleven days later §MATH-01 (`32d7bb0`, 2026-07-07) walked into it while authoring the five
Mathematics-Pocket collect quests, whose completion shape is a plain object
(`completion:{itemsAll:[…], atNode:'…'}`). Its own commit message records the diagnosis and the fix in
one line: *"PUT routed plain-object fields (gate/completion) to a memory-only path silently lost on
file-watch reload → now `editStructuredField` source-level persistence."*

The scale of what the deferral would have blocked only becomes visible against §ARCH-01's UQF
migration. Top-level structured fields, both builds, counted through `wbapi-core`:

| | `a105e0e^` (2026-06-26) | HEAD (2026-08-14) |
|---|---|---|
| quests | 2,839 | 2,853 |
| array fields | `completeItems` 180 · `targetMonsterKeys` 6 · `killGoals` 5 | `bits` 2,823 · `onComplete` 105 · `itemChain` 27 · `targetMonsterKeys` 12 · `killGoals` 11 |
| object fields | **none** | `gate` 2,823 · `completion` 189 · `onActivate` 5 |
| quests carrying ≥1 structured field | 180 (6.3 %) | **2,823 (98.9 %)** |

A patcher specified for 191 field instances on 180 quests is now the only source-level writer for a
data model in which **essentially every quest is a structured object**. `completeItems`, the field that
supplied 94 % of the original justification, has **zero live carriers** at HEAD — retired by §ARCH-01 in
favour of `completion.itemsAll`, which is an object field, which is the branch this report deferred.

The `ns.put` path is gone entirely: `put-memory-only` has **0 occurrences** at HEAD and the final
`else` is now an explicit `unsupported value type` refusal. Better to fail out loud than to succeed
into memory.

**One place the generic path is actively wrong, and the engine says so.** §DX-02h (`a047348`,
2026-08-03) needed to write terrain rosters and deliberately did **not** reuse `editStructuredField`:
`WORLD_DB`'s `monsters` array holds *code identifiers* (`P.giant_rat`), so `serializeJsLiteral` would
emit `["giant_rat"]` — which re-parses without error, and then drives `_monsterLevel` to 1 for the whole
terrain. It built `js/wbapi-core.js:editTerrainRoster(terrainKey, monsterKeys) {@1360` instead, reusing
`patchLiteralField` under its own serializer and adding a re-parse-before-commit guard. The lesson is
this report's own defect class returning by the front door: *JSON-safe is not the same as
source-correct.*

---

## 6. Why this matters to the game

This is authoring infrastructure, not a player-facing feature, and the honest chain to playability is
one link long: **the API is the only sanctioned way to change the world, so anything the API cannot
express is content that does not get made.** Before ph3 an author who wanted a quest to track kills, or
to name its target monsters, or a node whose description changes after an event, had exactly two
options — hand-edit a several-megabyte HTML file (the thing the entire tooling layer exists to prevent)
or write through the API and lose the edit at the next save without being told.

What ph3 unblocked, in shipped content:

- **Kill-goal and hunt-target missions** — `killGoals` and `targetMonsterKeys`, the arrays this report
  was written to serve, now on 11 and 12 quests (from 5 and 6).
- **Collect-at-node quests** — §MATH-01's five Mathematics-Pocket missions, whose
  `completion:{itemsAll, atNode}` shape forced the object branch open eleven days later. The pattern is
  now the canonical one in prompt.md §4.
- **Nodes that remember** — `NODE_MAP.textVariants` (0 array fields at the reference build, 2 at HEAD)
  is how the §GR grief arc restores Fishmonger's Row and how §TIDE-01 re-reads the Neon Undercity as
  Scholar-King engineering. Both were authored through `editStructuredField` in-process.
- **`finalBattle:{minLevel:20,minShards:7}` on TLS** — §VM-01-G-FU-f2 replaced three hand-copied
  predicates with one node field, written the same way. A node without the field is never final.
- **The worldbuilder's own CRUD form** — ph4-FU put `completeItems`/`targetMonsterKeys`/`killGoals`
  inputs on the quest form and needed **no server change**, because this dispatch already routed them.

And one durable methodological dividend. ph3's acceptance criterion — *patch, save, reload, re-read,
compare* — is exactly the rule CONTRIBUTING Hazard #5 would state **34 days later**, after `DELETE`
was found reporting success without persisting (§DX-01d/i) and `PUT /api/terrain` was found doing the
same with `GET` corroborating the lie (§DX-02h). This report got there first and wrote the gate that
proves it, which is why ph3 is the one member of that family that has never had to be repaired.

---

## 7. Defects and follow-ups

Filed this pass (BACKLOG grepped first; neither existed):

- **§DX-02cc** 🟢 — `check:arraypatch` never exercises the object branch. Its 13 checks were written
  when plain objects still went to `ns.put`; §MATH-01 moved them onto `editStructuredField` and added
  no assertion. Objects are now the **larger** population (`gate` 2,823, `completion` 189) and the shape
  the §MATH-01 fix existed for. Two checks close it — a bare object field patched and reloaded, and a
  nested one — both verified to pass today, so this is coverage, not a red.
- **§DX-02cd** 🟢 — prompt.md §7 names **none** of the four stdlib gates that CI runs beside
  `check:walk` (`check:arraypatch`, `check:itemchain`, `check:laddermigration`, `check:worlddiff`). A
  session that verifies as §7 instructs can push a change that fails CI in a job it was never told
  about — the §DX-02ca failure mode with a different job. Same row carries a figure correction:
  `index.md` records `check:itemchain` as **19 checks**; it reports **29**.

Repaired in place, no row owed: the §6 → §3.2 citation; the `notation` census entry (kept and
annotated, not deleted); the `{ok:false}` / `null` return-shape wording; the "nested-too-deep"
rejection marked NOT SHIPPED.

Corroborated without re-filing: §DX-02h (the `sectionMap` had no `terrain` entry — already owned and
fixed), §DX-01c (`MONSTER_DROPS` nested in MONSTER_POOL's anchors), §MATH-01, §ARCH-01 W7d/W8a.

---

## 8. Verification record

**Dating.** File mtime `2026-06-26 17:48:18 -0700`; birth commit `a105e0e` `2026-06-26 17:55:07 -0700`
— a **seven-minute** window, and the commit contains the implementation, the gate, the CI wiring and
this report together. The header's *2026-06-27* is the same instant in **UTC** (`2026-06-27T00:55:07Z`),
not a slipped date; `plan-archive.md` dates the whole ph3–ph5 block 2026-06-27 for the same reason.
The status line *"DESIGN LOCKED → implementing"* was true for about seven minutes.

**Scores.** Line citations **2 of 2 exact** (`~8899`, `~8905`). Named symbols **3 of 3 shipped**, all
three signatures token-identical. Census **3 of 4 exact**, the fourth a prose false positive. Stated
negatives **2 of 2 correct**. Contract clauses **6 of 7 hold**, the seventh exceeded. Scope deferrals
**3 of 4 hold**, the fourth reversed by a later track for cause.

**Gates run for this pass** (individually — the chained `check:walk` detaches past 400 s):
`check:arraypatch` 13/13 · `check:itemchain` 29/29 · `check:laddermigration` 148/148 ·
`check:worlddiff` all assertions · `check:anchors` 0 dead. `roll2hit-v3.html` **untouched** — every
replay ran read-only in a detached `wbapi-core` instance and the working tree's only diff is the user's
uncommitted 9+/9− combat recolor, unchanged.

---

*History document — annotate, don't rewrite. Bare line numbers in the original prose have been
replaced with `symbol@line` anchors (§DX-01e); numbers are cached hints and the symbol is the pointer.*
