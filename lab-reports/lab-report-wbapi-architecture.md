<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->

# Lab Report — WBAPI Architecture

## The World Builder API: parsing pipeline, buffer model, and the single-file source of truth

**Authored:** 2026-05-30 · **Annotated:** 2026-08-03 (§DX-02k) · **Re-verified against `roll2hit-v3.html` + `js/wbapi-{core,server}.js` @ `7ee4d6d` on 2026-08-23 (§DOC-02da)**
**System:** `js/wbapi-core.js` (1,814 lines) + `js/wbapi-server.js` (11,671 lines) · Node.js HTTP, port 1367
**Status:** ✅ Architecture live · ⚠️ **§4 lifecycle inverted** — the original write-on-save model was replaced by write-through (§DX-02k)

> **This is a HISTORY document.** It records what was *designed* in May 2026 and what is *live*
> now. The maintained homes are `docs/api/API-README.md` (endpoint reference), `docs/api/wbapi-help.md`
> (CLI), and CONTRIBUTING.md § *API hazards* (the binding rules). **Where those and this report
> disagree, they win.** Claims that did not survive are marked and kept, never deleted — a
> silently removed claim reads as a claim that held.

---

## 1. Abstract

WBAPI is a local REST server that reads and writes game data stored as JavaScript object
literals inside a single HTML file. There is no database, no ORM, and no build step: the file is
simultaneously the game runtime, the data store, and the source of truth. This report describes
the parsing pipeline that turns 5.5 MB of HTML into live objects without a DOM, the in-RAM
buffer that write-back is served from, the mutation paths, and the nonce protocol.

Re-verified at 85 days: **48 of 48 named symbols still resolve (100%)**, all four parse
strategies are unchanged, and the load-time prediction held at 3.15× the file size. **Section 4
— the request-to-persistence lifecycle — is inverted**, and four of the nine stated design
principles no longer describe the system. Eleven defects were found and filed (§7).

## 2. Method

Every claim was re-measured against the live files by `grep`, `sed`, and in-process `node`
harness runs — not carried forward from the May text and not read off a doc table (§AUDIT-03m).
Behavioural claims were tested, not inferred: the parse-failure claim in §6.2 of the original was
falsified by deliberately corrupting a section and observing the loader (§7.1). The WBAPI server
was **not** started for this pass; the working tree carries an in-flight CSS recolor, and a write
session would have engaged Hazard #1.

---

## 3. Intention, inspiration, and what it buys the player

The original report justified WBAPI as a developer convenience — *"eliminates the need for the AI
to hand-edit 1.75 MB of JavaScript."* That undersells it, and the 85-day measurement now shows why.

**The single-file constraint is a promise made to the player, not to the programmer.** One file,
zero dependencies, drag-and-drop into any browser: the game works offline, works in ten years,
works on a school laptop with no install rights, and cannot rot when a CDN expires or a package
is unpublished. Nothing about that promise is negotiable, and it is the reason the project
refuses a database.

**But that promise has a content ceiling, and the ceiling is human patience.** Data stored as
object literals in a 38,712-line file is data that must be edited by hand — and hand-editing
scales badly in exactly the way that kills a story game. Each new quest is another chance to
drop a brace, mangle a Unicode em-dash, or delete a function body you did not know was there.
The failure mode is not a crash; it is a quest that silently stops existing.

WBAPI is what makes the promise affordable to keep. It is the *authoring* half of a
*deployment* decision — an escape hatch that lets the file stay dumb while the tooling gets
smart. The measured payoff, spec-date to now:

| | 2026-05-30 | 2026-08-23 | |
|---|---|---|---|
| Quests | 213 | **2,853** | **13.4×** |
| Nodes | 144 | **416** | 2.9× |
| Monsters | 392 | 398 | 1.0× |
| Terrains | 107 | 111 | 1.0× |
| File size | 1.75 MB | **5.51 MB** | 3.15× |
| Quests with a dangling `activateNode` | *"11 audit errors"* | **0 of 2,844** | — |

What this adds to the game is **density**: 2,853 quests across 416 nodes is the difference
between a world you finish and a world you keep finding things in. A player who walks into
Birka, the Cat Quarter, or the Neon Undercity meets a place with more to say than one
playthrough can exhaust — and every one of those quests reached the file through an API call
that could not drop a brace. The last row is the sharpest evidence: a 13× content expansion
landed with a *lower* integrity error count than the 213-quest version had, because the writer
was a parser and not a pair of hands.

*"No database, no ORM, no build step"* was the design boast. The honest version is: no database,
no ORM, no build step, **and a REST server doing the job all three would have done** — which is
a trade, made deliberately, and worth restating as one.

---

## 4. As-built inventory

### 4.1 Anchored data sections — 9 named, 12 live

The report named nine `◆◆◆ WORLDBUILDER:<NAME>:START ◆◆◆` sections. **All nine survive under
their original names.** Three were added since:

| Section | Status | Parsed into |
|---|---|---|
| `MONSTER_POOL` · `MONSTER_DROPS` · `WORLD_DB` · `NODE_MAP` · `NODE_COORDS` · `BIRKA_NPC` · `FISH_DB` · `LAKE_MAGIC` · `QUEST_DB` | ✅ as named | 10 collections |
| `ITEM_DB` | 🆕 added — **0 entries** (§7.4) | `itemDb` |
| `NPC_DIALOGUES` | 🆕 added — 213 entries | `npcDialogues` |
| `D100_TABLE` | 🆕 added — 7 entries | `d100Table` |
| `EB_NPC_DIALOGUE` | 🆕 **unanchored** — read off raw source, 20 entries | `ebNpcDialogue` |

Twelve anchored sections yield fourteen collections (`FISH_DB` yields two; `EB_NPC_DIALOGUE`
adds one from outside the markers). The `◆` sentinel choice held: **64 `◆◆◆` runs in the file,
all 64 accounted for** — 24 in WORLDBUILDER markers, 8 in the four `*:CORE` parity-module
markers (`MOVER`, `ROOMS`, `DUEL`, `QUEST`) that arrived later and reused the convention. Zero
collisions with game content in 85 days. The Unicode-diamond bet paid.

**Undocumented in the original:** `MONSTER_DROPS` is nested *inside* `MONSTER_POOL`'s anchors,
so the loader splits it out by hand — `` `js/wbapi-core.js:parseSimple(extrSection(src,'MONSTER_POOL').split@731` ``.
This is the shape behind CONTRIBUTING.md's hazard #2, and the report never mentioned it.

### 4.2 The parsing pipeline — unchanged

All four strategies survive with **identical signatures and identical bodies**:

| Function | Anchor | Now also used for |
|---|---|---|
| `parseSimple` | `` `js/wbapi-core.js:function parseSimple(block, name)@280` `` | + `ITEM_DB` |
| `parseArr` | `` `js/wbapi-core.js:function parseArr(block, name)@284` `` | + `D100_TABLE` |
| `parseWithP` | `` `js/wbapi-core.js:function parseWithP(block, name, P)@288` `` | still `WORLD_DB` only |
| `parseSanitized` | `` `js/wbapi-core.js:function parseSanitized(block, name)@293` `` | + `NPC_DIALOGUES`, `EB_NPC_DIALOGUE` |

The `P`-proxy trick — binding a `Proxy` over `monsterPool` so `monsters: [P.goblin]` resolves
live during parse instead of in a second pass — is intact and still the only external binding
injected into `new Function`. `goblin` and `skeleton` both still resolve.

The `new Function` vs `eval` argument (§5.2 of the original) is correct and still correct:
`new Function` bodies close over the global scope only and cannot capture a parser-local, which
is the right call for evaluating a 5.5 MB literal.

### 4.3 Buffer model — unchanged

`_rawSrc` is still the whole file in RAM and still the authority for write-back
(`` `js/wbapi-core.js:load(filePathOrText)@715` ``). The stated invariant — *every mutation must
update both `_rawSrc` and the parsed object* — is still the invariant the system is built on.

### 4.4 Indexes — 5 documented, 8 live

`` `js/wbapi-core.js:_buildIndexes()@759` `` builds eight, not five. The report's five all
survive; three were added by §AUDIT-03k and the waypoint work:

`_terrainToMonsters` · `_monsterToTerrains` · `_questsByNode` · `_questFlags` · `_flagToQuests`
· `_questArcs` · **`_questsByNpc`** 🆕 · **`_questsByWaypoint`** 🆕

`_questFlags` still works exactly as described — a regex sweep of `_rawQuestSrc` for
`S_story.*` reads and writes, run against the *pre-sanitization* text so the function bodies
`removeFns` strips are still visible to it. That two-pass arrangement is the cleverest thing in
the file and the report was right to single it out.

---

## 5. The lifecycle inversion — §4 of the original no longer holds

This is the one section a reader must not trust. The original stated the model plainly:

> *"The file is **not touched** until `POST /api/save` is called explicitly. […] Unsaved
> mutations exist only in RAM. If the server is killed between a mutation and a save, those
> mutations are lost. **This is a feature, not a bug** — it provides a discard mechanism."*

**Every clause of that is now false.** §DX-02k replaced write-on-save with write-through:

| | May 2026 (as reported) | Live at `7ee4d6d` |
|---|---|---|
| When disk is touched | only on `POST /api/save` | **on every successful write** |
| Write mechanism | `writeFileSync` stamped → `copyFileSync` over primary | temp + `renameSync` — `` `js/wbapi-server.js:function saveGameFile()@1463` `` |
| Reload mechanism | `process.exit(67)` → toggle-script relaunch | **in-process** `WBAPI.load()` — `` `js/wbapi-server.js:function saveAndRestart(res, status, payload)@1517` `` |
| Dated backups | one per save, automatic, accumulating | **opt-in only**, via `` `js/wbapi-core.js:saveStamped(dir)@1687` `` |
| Discard-by-kill | supported, documented as a feature | ❌ **gone — there is no undo** |
| `WBAPI.save()` signature | `save()` — no argument | `` `js/wbapi-core.js:save(outputPath)@1659` `` — **destination required** |

The exit-67 rationale (*"a clean slate — module cache cleared, all globals reset"*) was sound
reasoning that lost to a stronger constraint: a full process restart per write costs a
reconnect, and the multiplayer session store (§CELL-07) does not survive one. In-process reload
keeps the socket up. The stale-closure risk the original worried about was addressed by
re-reading every collection from disk rather than by restarting the process.

**The consequence the report could not have anticipated:** because each write now saves *and*
re-parses, every field edit pays a full `load()` — measured below.

### 5.1 Load time — the prediction held

> *"Total wall time: typically 80–200 ms for a 1.75 MB file on a modern M-series Mac."*

Measured 2026-08-23, five runs at 5,513,613 bytes: **170 · 176 · 180 · 188 · 242 ms, median
180 ms.** The parse stayed inside the predicted band at **3.15× the file size** — the pipeline
really is linear with a small constant, exactly as claimed.

That is a good prediction and a rising cost. In May, 180 ms was paid once per save session.
Under write-through it is paid **per write**, alongside a 5.5 MB disk rewrite. The mitigation
exists — `` `js/wbapi-core.js:beginPatchQueue()@1397` `` / `` `js/wbapi-core.js:flushPatches()@1403` ``
batch many edits into one `respliceSection` — but it is wired for **node edits only**
(`` `js/wbapi-core.js:batchEditNode(edits)@1428` ``). `QUEST_DB`, at 2,853 entries the largest
section by far, has no batch path (§7.6).

### 5.2 Concurrency — right answer, wrong reason

> *"Node.js is single-threaded. […] There is no possibility of two handlers running concurrently
> in the same process."*

The conclusion (**no mutex needed**) is correct. The reason is not. The handler is
`` `js/wbapi-server.js:const server = http.createServer@11457` `` — an **`async`** function that
`await`s `readBody(req)` before mutating. Handler A suspended at that `await` interleaves freely
with handler B. What actually protects `_rawSrc` is narrower and worth stating precisely: **no
*synchronous* mutation block is ever interleaved**, and every mutation path — patch, resplice,
save, reload — runs to completion in one event-loop turn without awaiting. The invariant is real;
"handlers cannot overlap" is not.

### 5.3 Nonces — intact

`` `js/wbapi-server.js:const NONCE_TTL@48` `` is `5 * 60 * 1000`. Single-use, bound to one
`{type, key}` pair, consumed on use, purged lazily. The report's characterisation is exactly
right and worth preserving verbatim:

> *"The nonce system is therefore **not a concurrency lock**. It is an intent gate — a two-step
> protocol that forces the caller to explicitly declare their intent before a destructive
> operation proceeds. The nonce TTL is a timeout on declared intent, not a lock timeout."*

Three defects in the *documentation* of that gate are filed as §7.8–§7.10.

---

## 6. Mutation paths — 2 documented, 5 live

The report described Path A (in-place string patch) and Path B (full section re-serialization).
Both survive. Three more were added, and Path A's stated limits are obsolete.

| Path | Purpose | Anchor |
|---|---|---|
| **A** — string patch | edit a string field | `` `js/wbapi-core.js:function patchStringField(sectionSrc, entryKey, field, newValue)@345` `` |
| **B** — re-serialize | add / delete an entry | `` `js/wbapi-core.js:function respliceSection(rawSrc, sectionName, newContent)@633` `` |
| **C** 🆕 — literal patch | number / boolean / array / object fields, in place | `` `js/wbapi-core.js:function patchLiteralField(sectionSrc, entryKey, field, literal)@506` `` |
| **D** 🆕 — insert / remove | add or strip one field on an existing entry | `` `js/wbapi-core.js:editField(type, idOrTitle, field, value)@1263` `` |
| **E** 🆕 — deferred batch | many node edits, one resplice | `` `js/wbapi-core.js:flushPatches()@1403` `` |

> **§6.1 of the original is superseded.** *"It does not work for number, boolean, or
> object-valued fields — those require Path B."* Path C does exactly that, in place, preserving
> function bodies. The single lazy regex the report printed —
> `` `/(${entryKey}\s*:[\s\S]*?\b${field}\s*:\s*)(["`'])(.*?)\2/` `` — **is gone entirely**,
> replaced by brace-depth entry bounds (`` `js/wbapi-core.js:function findEntryBounds(sectionSrc, entryKey)@385` ``),
> a depth-0 comment- and string-aware field locator
> (`` `js/wbapi-core.js:function firstTopLevelMatch(body, re)@305` ``), an escape-aware quote
> scanner, and newline/quote escaping on the incoming value. Three distinct corruption classes
> were fixed there, each after it fired in production:
>
> - **§AUDIT-03b** — first-textual-match won, so `put quest <id> npc=…` on a quest whose `bits`
>   contained `{kind:'favor', npc:'…'}` patched the *nested* favor and left the real field alone.
>   Six quests hit this.
> - **newline injection** — a multi-paragraph value wrote a raw line break into the literal.
> - **`\"` in the old value** — the lazy `(.*?)` terminated on an escaped quote inside quoted
>   dialogue and left a corrupt tail.
>
> The report's regex was honest about what it did. It was not honest about what it would meet.

**Gap:** Path C's `sectionMap` has no `terrain` entry, so `WORLD_DB` has a string writer but no
structured writer. Verified in-process: `editStructuredField('terrain','city','testNum',5)` →
`{ok:false, error:'unknown type'}` → HTTP 422. It fails loudly rather than silently, which is
the §DX-02h lesson correctly applied — but the error names the *type* as unknown when the type
is fine and the *strategy* is missing (§7.5).

---

## 7. Defects found this pass

Each is filed as a BACKLOG row. Nos. 1–4 are behaviour; 5–7 are gaps; 8–11 are documentation
the server ships to its own users.

**7.1 — §DX-02fi 🔴 A corrupt data section loads silently as an empty collection.**
The report's stated safety net does not exist:

> *"If the save produced an unparseable file, the server will fail to start — the terminal shows
> a parse error, and the developer has the timestamped backup to roll back to."*

All four parse strategies `catch(e) { return {}; }`. Verified by harness: a deliberately
syntax-broken `QUEST_DB` produced `load() threw? false` · `questDb entries: 0` · `loaded: true`.
**2,853 quests become zero, and nothing raises.** `` `js/wbapi-server.js:function reload()@928` ``
prints the counts but asserts nothing, so the only signal is a human reading `quests: 0` in a
terminal. This was survivable in May, when a save left a dated backup and restarted the process.
Under write-through (§5) it is not: the write lands on the primary file, no dated backup is
taken, and the in-process reload cannot fail. **Fix:** assert non-empty (or within a tolerance
band) per collection after reload, and fail the write rather than the file.

**7.2 — §DX-02fj 🟡 `saveAndRestart` does not verify what it wrote.** The `saveAndVerify` path
(`` `js/wbapi-server.js:function saveAndVerify(res, status, payload, expectedFields@1545` ``) does a
genuine post-write round trip — save, reload from disk, read the fields back, 422 on mismatch.
This is a real improvement on the original's *"verification is implicit."* But it is the minority
path: **20+ write endpoints call `saveAndRestart`**, which reloads and returns 200 without
comparing anything. Route the structural writers through `saveAndVerify`, or give
`saveAndRestart` a minimal count assertion (which also closes §7.1).

**7.3 — §DX-02fk 🟢 `export/condition_items` is a phantom collection.**
`` `js/wbapi-server.js:condition_items: () => WBAPI.conditionItems@9834` `` is the **only**
occurrence of `WBAPI.conditionItems` in the repo — `load()` never sets it. The endpoint returns
`200 {"data":{}}` and logs "0 records", which is indistinguishable from an empty-but-real
collection. Delete the getter or wire the field.

**7.4 — §DX-02fl 🟢 `ITEM_DB` is an anchored, parsed, exported section with zero entries.**
`const ITEM_DB = { // General item definitions — weapons, amulets, consumables, readables. };`
— `` `const ITEM_DB = { // General item definitions@26549` ``. Not a parse failure — the section is genuinely empty. Decide: seed
it, or retire the anchor. As it stands it is 0-entry infrastructure that reads as a live surface,
and §7.1 means an emptied `ITEM_DB` and a *corrupted* `ITEM_DB` look identical.

**7.5 — §DX-02fm 🟡 `WORLD_DB` has no structured-field writer.** `editStructuredField`'s
`sectionMap` omits `terrain`, so any non-string terrain field 422s with `unknown type`. Add
`terrain:'WORLD_DB'` (the roster guard in `editField` already shows the pattern), or reword the
error to name the missing strategy rather than blaming the type.

**7.6 — §DX-02fn 🟡 The patch queue is node-only.** `editField` queues only when
`type === 'node'`, so `QUEST_DB` — 2,853 entries, the largest section — pays a full 5.5 MB write
plus a 180 ms re-parse *per field edit*. A 40-field quest pass costs ~7 s of parse alone.
Extend `batchEditNode`'s grouping to quests.

**7.7 — §DX-02fo 🟢 `export/all` is not all.** The export map omits `BIRKA_NPC`, `NODE_COORDS`,
`ITEM_DB`, `NPC_DIALOGUES`, and `MONSTER_DROPS`. `all` is 7 of 14 collections. Either complete it
or rename it.

**7.8 — §DX-02fp 🟢 `GET /api/help` prints `"expires": "60s"`** (`` `js/wbapi-server.js:"expires": "60s"@2032` ``), two
lines below its own correct *"expires in 5 minutes."* `NONCE_TTL` is 300 s.

**7.9 — §DX-02fq 🟢 Both help blocks name a response field that does not exist.** They print
`"expires": "60s"` and `"expires": 300`; the endpoint returns **`expiresAt`**, an ISO-8601 string
(`` `js/wbapi-server.js:const expiresAt = new Date(Date.now() + NONCE_TTL)@3129` ``). Anyone following the help and reading `.expires` gets `undefined`.

**7.10 — §DX-02fr 🟢 `GET /api/help/nonce` documents a type that 400s and omits one that works.**
It lists `node | quest | monster | npc | terrain`; `validTypes` is
`['node','quest','monster','npc','snapshot']`. **`terrain` is rejected**, and `snapshot` — which
the §DX-02l sweep requires — is undocumented.

**7.11 — §DX-02fs 🟢 The help still teaches the retired save step.** *"Step C — save (always
required after any write)"* (`` `js/wbapi-server.js:Step C — save (always required after any write)@2040` ``) predates §DX-02k. Writes auto-save.
`POST /api/save` now means *"take a dated snapshot,"* which is a different thing and should say so.

---

## 8. Claims that were wrong when written

Two, distinct from the twelve that merely aged out.

**8.1 — `removeFns` was not comment-aware.** The report called it a *"critical property"*:

> *"`removeFns` is itself comment-aware and string-aware. If a string contains the text
> `"onActivate: () => {"`, it will not be treated as a function."*

String-awareness was real. **Comment-awareness shipped 2026-07-28** — commit `6a69087`,
*"feat(§AUDIT-03f): removeFns is comment-aware — quest_sea_01 + quest_sb_01 restored to the WBAPI
parse."* For **59 days** the property was asserted and absent, and the cost is recorded in the
code that fixed it: a `foo:()=>…` example inside a section comment made the stripper swallow the
whole next entry up to the first depth-0 comma, *"silently dropping quest_sea_01/quest_sb_01 from
every WBAPI parse."* Two quests were invisible to every audit, every count, and every chain
query — and the report said they could not be. Both resolve today.

**8.2 — The audit-error diagnosis outlived the errors.** §8 reported *"11 errors, 35 warnings
(e.g., quests referencing node codes that do not exist in `NODE_MAP`)."* That class is now
**0 of 2,844** quests carrying an `activateNode`. The example codes moved rather than broke:
`CY` → `HKG` (Neon Undercity), `WS` → `LCY`, `NAJ` → `MLA`, all by the §WALK/§NAV-01 geo-grid
recode, and every quest was re-anchored with them.

---

## 9. Stale examples in §7.1

The command *verbs* held perfectly — all thirteen (`list` `get` `location` `audit` `chain`
`advise` `post` `put` `ping` `save` `snapshots` `reachability` `broken`) still dispatch from
`api/wb.js`. Only the arguments rotted:

| Example as written | Live |
|---|---|
| `./api.sh location CY` | `CY` retired → **`HKG`** |
| `./api.sh list npc --node CY` | same recode |
| `./api.sh list monster --terrain dungeon` | no `dungeon` terrain (nor `cave`); `forest` still resolves |
| `post quest … npc=aldric activateNode=NAJ` | quest is live at **`MLA`**, npc is **`auros`** |
| `get quest quest_wis_01` → *"The Hermit"* | live, retitled **"Mask Check"**, at `LCY`, npc `magistra_elara_muffat` |

`quest_wis_01` and `quest_1367_a_najera` both still exist under their original IDs, 85 days and
2,640 quests later. The ID convention held even where the prose did not.

---

## 10. Verdict — design principles at 85 days

| Principle | Verdict |
|---|---|
| Single source of truth (`_rawSrc`) | ✅ intact |
| No DOM required | ✅ intact — still zero `jsdom`/`puppeteer` |
| **Write-on-save only** | ❌ **inverted** — write-through (§5) |
| **Restart as reload** | ❌ **retired** — in-process reload |
| In-place patch for edits | ✅ intact, and extended to literals (Path C) |
| Re-serialization for structure | ✅ intact |
| No concurrent writers | ⚠️ **right conclusion, wrong reason** (§5.2) |
| Nonce as intent gate | ✅ intact — best-stated idea in the report |
| **Backup accumulation** | ❌ **reversed** — §DX-02k found six orphaned files (~32 MB); backups are opt-in |

**Five of nine hold; four were reversed by a single track.** Every reversal is §DX-02k, and every
one of them made the system safer — atomic rename over copy, no CWD litter, guards before the
write. The report's *architecture* was right and its *operations* were provisional, which is the
correct way for a design document to be wrong.

What the original got right is the part that mattered most and is easiest to overlook: it chose a
character-state-machine parser over a regex, and said why — *"a regex cannot reliably match
nested braces."* Three months, twelve sections, and a 13× content expansion later, every parse
defect this repo has paid for lived in a **regex somebody added later** (§6, §8.1). The parser
the report specified has never been the thing that broke.

---

## 11. Scope note

This pass verified structure, counts, symbol liveness, the lifecycle, and the mutation paths. It
did **not** audit the 48 surviving symbols for behavioural drift beyond the paths named above — a
function that still exists under its old name may do something else now. It did not exercise the
live HTTP surface (no server was started, §2), so all endpoint claims are read from source and
from in-process harness runs. It did not re-derive §5.2's browser/Node boundary argument or §7.2's
`worldbuilder.html` description beyond confirming that file still calls `/api/source` and
`/api/save`.

---

**Cross-references:** `docs/api/API-README.md` · `docs/api/wbapi-help.md` · CONTRIBUTING.md
§ *API hazards* · `lab-report-wbapi-evolution.md` · BACKLOG.md §DX-02fi–fs
**Port 1367:** matches the canonical game year, 1367 AD.

*End of verified report. Original 659 lines; verified 2026-08-23 (§DOC-02da).*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
