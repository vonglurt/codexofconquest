<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report: From `grep` to WBAPI — How Roll2Hit Got a Write Path

**Author:** Claude (Sonnet 4.6) + paulr@sdf.org
**Filed:** 2026-05-29 · **Verified:** 2026-08-13 (§DOC-02ap)
**Classification:** Architecture / Developer Tooling / Data-Access Evolution
**Audience:** CS/EE background; shell, Node.js, REST

> **Verification stamp.** This is a HISTORY document, re-measured against the live
> `roll2hit-v3.html` 76 days after filing. Claims that verified are kept and anchored;
> claims that did not are **marked and kept**, never deleted — a silently removed claim
> reads as one that held. §II dates the document; §VII is the delta table.

---

## Abstract

Roll2Hit ships as **one static HTML file**. That is the product promise, not a
preference: a player, a friend, or an archaeologist opens the file in a browser and
plays, forever, with no server, no install, and no build step. The promise is easy to
make and expensive to keep, because it means every monster, node, quest and line of
dialogue is a JavaScript object literal inside a single `<script>` tag — and by the
day this report was filed that tag was already **1.5 MB**.

This report documents how the project got a **safe write path into that file**, and
argues that the write path is what makes the single-file promise survivable at scale.
It traces six approaches — `grep`, `sed`, Perl, Python, bare Node `eval`, and finally
a purpose-built text parser (`wbapi-core.js`) fronted by a local REST server
(`wbapi-server.js`) — records why each of the first five failed, and specifies the
architecture that stuck: anchor-delimited sections, a comment-aware brace scanner,
whole-section re-serialization, and a nonce handshake in front of destructive writes.

**The verification result, in one line:** the *architecture* is intact and the
*inventory* is not. Every mechanism this report identifies as load-bearing is still
load-bearing at 3× the file, but the report's own worked examples were invented rather
than transcribed, and it is wrong about its parser's central trick.

---

## I. Intent — why a build tool is a playability feature

The constraint is stated in the original directive:

> *The entire game — all data, all logic, all UI — is fully playable in a browser with
> only `roll2hit-v3.html`. No Node, no server, no dependencies.*

The naive reading is that this is an aesthetic, in the demoscene tradition, or a
homage to single-file tools like `htmx`. The operational reading is harsher: **the
single-file constraint is a tax paid by the author so the player pays nothing.** No
version drift, no dead CDN, no "install these seven things first," no moment five years
from now when the asset server stops answering. The file is the game and the game is the
file.

That tax has a threshold. Below some volume of content, hand-editing a giant literal is
merely tedious. Above it, the constraint becomes the thing that *stops content from
being written* — because the failure mode is not a compile error, it is a missing comma
that turns the entire `<script>` block into a syntax error and the game into a blank
page. One bad brace and the player gets nothing.

**WBAPI is what moved that threshold, and the measurement is the argument.** At filing
the game held **211 quests**; at verification it holds **2,853** — a 13.5× expansion of
the content a player can actually walk into, across 416 nodes instead of 144, without
the shipped artifact ever stopping being one openable file. The tooling never appears
on screen. It is the reason there is so much on screen.

The design question this report answers is therefore not "how do we edit an HTML file."
It is: **how do you add a thousand quests to a 1.5 MB JavaScript literal without a typo
silently killing the game?**

---

## II. Dating the document

This report was **born in commit `daa60af`, 2026-05-29 16:53** ("WBAPI: port→1367,
wizard tab, help system") — so it is a ship-note describing what its own commit added,
not a survey of standing code. Three independent instruments converge on a **59-minute
window**:

| Instrument | Evidence | Window |
|---|---|---|
| Collection counts (§III table) | `NODE_MAP` 144 · `QUEST_DB` 211 · `MONSTER_POOL` 392 · `WORLD_DB` 107 hold **simultaneously at exactly one tree**, `064aef8` (15:41) | 15:41 → 18:31 |
| `exit(67)` described as shipped | **0 occurrences** at `064aef8`; **5** at `daa60af`. Born in `15ae00d`, 15:54 | ≥ 15:54 |
| Birth commit of the file itself | `daa60af` | = 16:53 |

All four counts are exact. That is the strongest dating result in the verification
corpus to date, and it costs one `git show` per candidate tree.

**The document was then retro-fitted, and this matters more than the birth date.**
Commit `77c517f` (2026-06-05 13:21, "§API-CLI-01: api.sh wrapper") rewrote **218 of its
lines — 97 insertions, 121 deletions** — substituting `./api.sh …` for the raw `curl`
invocations throughout, and adding the "New rules (as of api.sh v1)" note. The header
still reads *Filed: 2026-05-29*, and it is true of the prose and false of every command
example.

The sharp part: `7e2239a` retired the exit-67 restart protocol at **06:37 that same
morning**. The retrofit landed **six hours and forty-four minutes later**, touched a
third of the document, and left §IV's exit-67 paragraph standing untouched.

> ***A retro-fit pass certifies only its own charter.*** A document edited on the day a
> mechanism it describes was retired is not thereby a document that survived review.
> Read the retrofit's **diff**, not its date.

---

## III. The six phases

Phases 1–5 are recollection, not transcription; they are reported here as the design
argument they are, with the failure modes stated rather than the code re-litigated.

| # | Approach | Why it broke |
|---|---|---|
| 1 | `grep` | Line-addressed. A monster spans 1–3 lines, a quest 5–15. A hit tells you a string exists, never whether it sits in `MONSTER_POOL`, in a comment, or in a quest description that merely *mentions* the monster. |
| 2 | `sed` insert-before-anchor | Cannot count braces. A missing comma kills the whole `<script>`; `sed -i` has no undo. |
| 3 | Perl `-0777` slurp + `/s` regex | Multi-line matching at last, but the pattern must span a 2,000-line object. Any regex metacharacter in a description field breaks the match. Regex is not a parser: no string escaping, no template literals, no nesting. |
| 4 | Python `re` + `ast` | JS object literals are not JSON. Keys are unquoted (`ac:11`); values reference other variables (`monsters:[P.goblin]`). `ast.literal_eval` chokes on line one. Python has no JS runtime. |
| 5 | Bare Node `eval()` | The block is browser-context script, not a module: it touches `document`, `localStorage`, `addEventListener`, and runs init on load. Stubbing the DOM well enough means writing a browser. `eval` in global scope also collides with `Buffer`/`process`/`require`. |
| 6 | **Text parser (`wbapi-core.js`)** | **Shipped.** Never executes the game. Reads it as structured text, evaluates only pure data literals. |

The Phase-6 insight is that the big collections are **pure data** — no calls, no DOM,
no side effects — so they can be located structurally and evaluated in isolation. That
insight held. The mechanism described for it did not, in two particulars (§VII).

---

## IV. Architecture as-built

```
roll2hit-v3.html      — single source of truth (game + all data)
src/js/wbapi-core.js      — parser + serializer          [1,814 lines]
src/js/wbapi-server.js    — REST server over the core    [11,671 lines]
src/api/wb.js (./api.sh)  — the authoring CLI: queue, auto-nonce, retry, --ai
wbapi-toggle.sh       — process manager: start · stop · restart · status · fg
edit.html     — developer UI (✦ Wizard tab)
```

*(The three JS files sat at repo root when this was written; `cc35c08` moved them under
`src/js/`, and `api.sh` became a three-line shim over `src/api/wb.js`.)*

### The HTML as a document database

| Constant | At filing | At verification |
|---|---|---|
| `NODE_MAP` | 144 | 416 |
| `QUEST_DB` | 211 | 2,853 |
| `MONSTER_POOL` | 392 | 398 |
| `WORLD_DB` | 107 | 111 |
| `BIRKA_NPC` — **not `BIRKA_NPCS`** (§VII-1) | 6 | 204 profiles |
| `FISH_POOL` / `NIGHT_FISH_POOL` | 20 | (`FISH_DB` anchor) |
| `LAKE_MAGIC_DB` | ~20 | live, 1 reader |
| **File** | 1.79 MB / 24,280 lines | 5.51 MB / 38,712 lines |

The primary key of every table is its object key — node code, snake\_case monster key,
quest ID — and all cross-references are by key string. The server loads the database
into memory on startup, serves reads from memory, and writes by mutating memory and
re-serializing to file: SQLite's WAL bargain, one process deep.

### Anchor markers

```javascript
// ◆◆◆ WORLDBUILDER:MONSTER_POOL:START ◆◆◆
const MONSTER_POOL = { … };
// ◆◆◆ WORLDBUILDER:MONSTER_POOL:END ◆◆◆
```

`◆` is **U+25C6 BLACK DIAMOND** — verified — chosen because it cannot occur in a JS
identifier, string template or operator, so it is unambiguously a marker and never a
token. Nine sections carried anchors at filing; **twelve do now** (`NPC_DIALOGUES`,
`ITEM_DB`, `D100_TABLE` were added later). The pair is also the last-resort escape
hatch: with the server down, `grep -n "◆◆◆" roll2hit-v3.html` still prints every
section boundary. Anchor `` `◆◆◆ WORLDBUILDER:BIRKA_NPC:START@22711` ``.

A write finds the `:START`/`:END` pair, reconstructs the whole block from in-memory
state, and splices. **Every save is a full-section rewrite, never a surgical line
edit** — which is the safety property: the serializer always regenerates from
authoritative state, so a partial write cannot leave a section half-formed.

### The comment-aware brace scanner — verified, and the lesson is not the one expected

The scanner tracks four states — inside a string, inside `//`, inside `/* */`, or in
code — and counts braces only in the last. This report called it the core innovation.
It was right, it was implemented correctly at its own tree, and it is still correct at
HEAD, relocated into the shared tokenizer at
`` `src/js/wbapi-core.js:§AUDIT-03f silent-drop class@50` ``.

**And the repo was bitten by exactly the hazard it prevents anyway.** §AUDIT-03f: a
section comment containing an arrow-function example silently ate two whole quests —
because the duplicate-key gate carried a *second, independent* scanner that was not
comment-aware. The header now says so out loud: *"Two scanners drift, and a scanner
that disagrees with the parser is exactly the §AUDIT-03f silent-drop class."*
(`` `src/js/wbapi-core.js:Two scanners drift@49` ``)

> ***A verified safety mechanism confers safety on its call sites, not on the
> codebase.*** When a document names a hazard-preventing algorithm as its core
> innovation, census how many independent implementations of it exist. This one was
> right the first time and cost two quests to its own copy.

---

## V. Single-writer model and the nonce handshake

**Why single writer.** World data is not a high-frequency workload: one developer, one
terminal, a few writes a session. Optimistic locking, conflict resolution and
distributed consensus would all be machinery for a problem that does not exist. One
Node process owning in-memory state and serializing writes is correct and sufficient.

**The claim that aged badly.** This report asserts the server *prevents* editor/API
races "by being the only writer." It does not. The server holds the whole file text
from the moment it started and re-writes it on every data write, so a hand-edit to CSS
or JS made while the server was up **is silently reverted by the next `put`**. That is
now CONTRIBUTING **Hazard #1**, learned the hard way, and the working rule is the
opposite of a guarantee: restart before any write session, verify a fresh PID, and
confirm a CSS signature survived the first write. The architecture was right; the
safety claim was optimism.

**The nonce.** Verified in every particular but one:

| Claim | Verdict |
|---|---|
| 16-character token | ✅ `` `src/js/wbapi-server.js:function nonceIssue@50` `` |
| 5-minute expiry | ✅ `` `src/js/wbapi-server.js:const NONCE_TTL = 5 * 60 * 1000@48` `` |
| Single-use | ✅ consumed on validate |
| Bound to one `{type, id}` | ✅ `` `src/js/wbapi-server.js:Nonce was issued for@61` `` |
| "16-character **random** token" | ⚠️ salted SHA-512 of `type:key:salt`, sliced to 16 — random-*seeded*, and the identity binding is baked into the token itself |
| DELETE requires a nonce | ✅ `` `src/js/wbapi-server.js:DELETE requires a nonce token@11245` `` |
| POST "accepts nonces optionally" | ⚠️ POST consumes no nonce at all; only DELETE and the snapshot sweep do |
| PUT requires none | ✅ |

The rationale stands and is worth restating, because it is a design position rather
than a security one: writes to the game file are permanent (git is the undo), so the
nonce is a **confirmation handshake**, not a cryptographic control. It costs a
round-trip and it buys a moment in which the developer must name the exact entity they
intend to destroy. It also defeats the mistyped `curl`, the replayed browser tab, and
the automation script running on stale data. `./api.sh` fetches it for you, which is
the point: ceremony for the machine, none for the human.

### Restart — **NOT SHIPPED at HEAD (retired)**

This report specifies: `POST /api/restart` saves state, **exits with code 67**, and
`wbapi-toggle.sh`'s restart loop relaunches. That shipped, in this document's own
commit, and lived **seven days**. `7e2239a` (2026-06-05) replaced it with in-memory
hot-reload; `wbapi-toggle.sh` no longer contains a restart loop at all. The server now
states the repudiation in its own source: *"The server never exits with code 67. All
restart/relaunch is handled by an external process… POST /api/restart exits 0."*
(`` `src/js/wbapi-server.js:The server never exits with code 67@11638` ``)

The commit/reset **cycle** survived its mechanism: writes still persist per-operation
(`` `src/js/wbapi-server.js:const r = WBAPI.save(tmp)@1465` ``, §DX-02k), and on-disk state
is still the authority a restart re-parses. → **§DX-02ba** (a live doc still teaches
the dead protocol).

---

## VI. The API surface

The original §V/§VI of this report were a hand-copied alphabetical catalogue of ~30
endpoints. That catalogue is **retired here**, for the reason the report itself argues
in its conclusion: the API is self-documenting, so a transcription of it is a second
source of truth with a shorter half-life than the first. `GET /api/help[/{topic}]`,
`./api.sh help`, and `docs/api/API-README.md` are the live reference. The server now
routes **150+** endpoints.

What verification measured instead — whether the surface this report *described* is
still there:

- **Every endpoint named still routes.** `audit` · `export` · `fish` · `flags` ·
  `help` · `lake-magic` · `list` · `location` · `ping` · `quest/{id}/chain` ·
  `schema` · `source` · `nonce` · `reload` · `restart` · `save` · `terrain` ·
  `monster` (+`/fork`, `/rename`) · `node` (+`/move`) · `npc` · `terrain/{key}/swap`
  — 0 dead.
- **Help topics: 14 of 14 survive**, plus four added (`cli`, `coords`, `import`,
  `workflow`).
- **Audit severities: 4 of 4** — `error` · `warning` · `suggestion` · `parse`.
- **Both "api.sh v1" audit rules are live and near-verbatim**:
  *"quest has no npc field — every quest must be anchored to an NPC"*
  (`` `src/js/wbapi-server.js:every quest must be anchored to an NPC@4681` ``) and
  *"has no quests — NPC has no gameplay function"*
  (`` `src/js/wbapi-server.js:NPC has no gameplay function@4721` ``). Note for readers:
  §AUDIT-03b later established that `q.npc` is **authoring metadata only** — the engine
  does not route on it — so the ERROR rule enforces bookkeeping, not behaviour.
- **The ✦ Wizard tab: 6 of 6 steps exact** — Vignette · Token · Location · Monster ·
  Quest Arc · Review + Create (`` `edit.html:wdlbl-6@1204` ``,
  `` `edit.html:Step 6: Review + Create@1383` ``). The claim that it adds no
  capability the endpoints lack, and exists only to enforce creation order
  (terrain → node → monster → quest → save) while showing the payloads beside the
  narrative, still holds.
- **Three endpoints are still not wrapped.** This report flagged
  `monster/{key}/fork`, `node/{code}/move` and `terrain/{key}/swap` as "not yet wrapped
  in api.sh" and told the reader to use raw `curl`. **Seventy-six days later, all three
  are still unwrapped** — a standing exception to invariant #7. → **§DX-02bc**.

---

## VII. Spec → shipped delta table

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| 1 | `BIRKA_NPCS` is the NPC table | **NOT SHIPPED — never existed** | 0 commits ever in the game file's history. The anchor is **`BIRKA_NPC`**, singular; the in-engine roster is the function-local `birkaNpcs`. The sibling report filed the same day has it right (§VIII). |
| 2 | Pipeline step 1: extract `<script>` text with one regex | **NOT SHIPPED — never existed** | 0 commits ever in `wbapi-core.js`. The parser has always anchored directly on `◆◆◆` in the raw HTML — which this report's own §III describes correctly. It contradicts itself, and §III is the half that cites the mechanism. |
| 3 | `P = new Proxy({}, { get: (_, k) => k })` → `P.dock_rat` is the string `"dock_rat"` | **Wrong when written** | Actual, byte-identical archive → HEAD: `` `src/js/wbapi-core.js:const Pp = new Proxy(P@290` `` proxies the **real** `P` and falls back to an **object** `{ key: String(k) }`, not a string. |
| 4 | *"`goblin: { name:'Goblin', ac:13, hp:7, atk:4, dmg:5, xp:50, tier:1 }` … // 391 more entries"* | **3 of 7 fields wrong when written** | Actual, byte-identical archive → HEAD: `` `goblin:        { name:'Goblin'@5339` `` is `ac:15 … dmgDie:6, dmgCount:1, dmgFlat:2`, and `tier:'easy'` — a **string**, from a five-member enum (`` `src/js/wbapi-server.js:values:['trivial','easy','medium','hard','deadly']@1306` ``). `dmg` and `xp` are not monster fields. The count "391 more" is **exact**. |
| 5 | Monster creation takes `cr=1/8` | **NOT SHIPPED — never existed** | `cr:` — 0 at HEAD, 0 at the archive, 0 commits ever. |
| 6 | The `<script>` block is **300 KB** (stated 3×) | **Wrong when written, by 5.1×** | 1,539,946 bytes at its own tree; whole file 1.79 MB. Never true: the earliest surviving build (2026-05-24) is already 0.86 MB. |
| 7 | `GET /api/source` is how `edit.html` loads the game file | **Wrong when written** | 1 hit at the archive, 1 at HEAD — a documentation row. The UI drove typed endpoints then (`/api/schema` ×10, `/api/list` ×9) and drives them now (`/api/list` ×56, `/api/count` ×33). |
| 8 | `POST /api/restart` → exit 67 → toggle relaunches | **RETIRED** (shipped, lived 7 days) | §V. |
| 9 | The server *prevents* editor/API write races | **Wrong** — it is the cause of one | CONTRIBUTING Hazard #1. |
| 10 | Node codes `CY`, `BK` as example primary keys | **Both retired; `BK` is worse than dead** | §IX. |

**And the finding that reframes the rest.** Ten worked-example identifiers —
`dock_rat`, `silver_pike`, `rod_of_fortune`, `fog_docks`, `drowned_sailor`,
`harbour_rat`, `goblin_champion`, `quest_chest_01`, `sealed_merchant_chest`,
`questChestDelivered` — have **0 commits, ever, all ten.** In a design doc that would be
a catastrophe. Here it is *correct by construction*: a reference manual's examples are
supposed to be fictional, and a man page that documented `POST /api/monster` against a
real monster would be worse, not better.

> ***In a REFERENCE document, invented identifiers are the healthy case. Score it by its
> quoted file excerpts, never by its worked examples.*** The one specimen this report
> dressed as a transcript — `goblin`, with `// … 391 more entries …` as the tell — is
> the one it got wrong, and it got the *count* in that ellipsis exactly right. The
> author knew the real total and invented the statline anyway.

---

## VIII. Corpus check — the sibling filed the same day

`lab-report-wbapi.md` covers the same system, same date, same author. Two reports, one
morning, one file; they disagree, and each disagreement is informative:

| | This report | Sibling | Truth |
|---|---|---|---|
| NPC table | `BIRKA_NPCS` | **`BIRKA_NPC`** | Sibling. One `grep` settles it. |
| `WORLD_DB` | 107 | 69 | **Both** — 69 before `064aef8` (15:41), 107 after |
| `QUEST_DB` | 211 | 210 | **Both** — 210 before `403c453` (12:34), 211 after |
| File size | *300 KB* | **1.7 MB** | Sibling: 1,793,649 B |
| File lines | — | *~11,530* | 24,280. The sibling's figure is **its own table's last row** (`BIRKA_NPC | 11472–11530`) misread as the file length |

The counts do not conflict; they **timestamp**. Two reports written hours apart bracket
a commit from opposite sides, and the pair dates itself more precisely than either can
alone.

The size figures do conflict, and the mechanism is the durable part: the sibling's
1.7 MB sits in a **header table** — a field to fill from `ls` — and is exact. This
report's 300 KB sits in **running prose**, three times, and is 5.1× low. Same author,
same day, same file: **one measured it and one remembered it.** Round numbers in prose
are recollection wearing a lab coat.

---

## IX. Node codes — instrument 31 (`num` is the identity)

Both example codes are retired, and the archive resolves them in one step because
`num` was preserved across the 26×16 → 90×360 world migration:

- **`CY`** (archive `num:6`, *cyberpunk_streets*, "Neon Undercity") → **`HKG`**,
  `` `HKG:{ num:6@8439` ``. Corroborated independently by the engine's own remap
  comment in `birkaNpcs`.
- **`BK`** (archive `num:25`, "Broken Tooth Tavern", Visby) → **`VBY`**,
  `` `VBY:{ num:25@8684` ``.

`BK` is the §AUDIT-03m *worse-than-dead* class in pure form. A code that no longer
exists fails loudly. **`BK` still exists** — as `` `BK: { num:241@9011` ``, "Birka
Shore — Northern Longship Landing", a beach in a different act on the other side of the
map. A reader who runs this report's `./api.sh location BK` gets a confident, correct,
completely wrong answer. Existence checks pass; the sentence stays false.

---

## X. Why this architecture is right for this problem

| Constraint | Consequence | WBAPI's answer |
|---|---|---|
| Single file must stay playable | Data cannot leave the HTML | Parse in place; serialize back in place |
| No build step | Data is JS literals, not JSON | Comment-aware brace scanner; `P` proxy for key references |
| One author writing world data | No concurrency needed | One process owns all in-memory state |
| Writes are high-value, infrequent | Mistakes are expensive | Nonce handshake; dependency checks before DELETE |
| Author must understand state first | Blind writes are dangerous | Full read API; `audit`; self-documenting help |
| Server restarts mid-session | State must survive | The HTML *is* the state; restart re-parses from disk |

The anti-patterns declined, and why each would have cost the promise in §I:

- **External database** — the file stops being self-contained. The promise dies at the
  first sentence.
- **Template/build pipeline** — the game is no longer giveable as source.
- **JSON sidecars** — splits the truth. The browser and the API then need
  synchronization logic, and two sources of truth are two sources of bugs.
- **Editor edits during a live server session** — a write race. This one was declined
  in principle and shipped in practice; see Hazard #1.

The single-file HTML is the discipline. WBAPI is the tooling that lets an author keep
it without hand-writing JSON into a multi-megabyte `<script>` block.

---

## XI. Conclusion

The evolution from `grep` to WBAPI is a story about matching a tool to a constraint.
Each early phase failed not because it was a bad tool but because it was the wrong tool
for this specific combination: JavaScript-literal syntax, DOM-dependent init code, the
single-file requirement, and the need for safe in-place writes. `grep` treats the file
as a bag of lines. The file is not a bag of lines; it is an AST serialized as text, and
nothing that refuses to know that can edit it safely.

The final architecture is unusual — a REST API whose database is an HTML file, read by
locating anchors in raw text and written by splicing whole sections back between them —
but it is unusual in precisely the way the constraint is unusual. **It has now survived
3× the file, 13.5× the quests, and 76 days of active development with zero dead
endpoints.** The parts this report identified as load-bearing all are.

What verification adds is the corrective. The mechanisms held; the *particulars*
did not. Two identifiers here never existed, the parser's central trick is described
backwards, the headline file size is 5× low, and the one code specimen dressed as a
transcript was invented — all of it on the day of filing, by an author who had the file
open. The document is a good architecture paper and an unreliable citation, and those
two verdicts are independent.

And the closing sentences still earn their place, because they are the reason any of
this exists:

> *The game is always in a state where it can be opened in a browser and played. The API
> exists to help a developer keep it that way.*

Everything above is engineering in service of that. Nobody who plays this game will ever
see a nonce, an anchor marker, or a brace counter. They will see 2,853 quests in one
file that opens.

---

**Filed:** 2026-05-29 · **Retro-fitted:** 2026-06-05 (`77c517f`) · **Verified:** 2026-08-13 (§DOC-02ap)
**Follow-ups filed:** §DX-02ba · §DX-02bb · §DX-02bc
**Cross-references:** `src/js/wbapi-core.js` · `src/js/wbapi-server.js` · `src/api/wb.js` ·
`wbapi-toggle.sh` · `edit.html` · `docs/api/API-README.md` ·
`lab-report-wbapi.md` (same-day sibling) · `lab-report-wbapi-architecture.md` ·
`lab-report-meta-process-loop-expansion.md` · CONTRIBUTING Hazard #1 · §AUDIT-03b ·
§AUDIT-03f · §AUDIT-03m · §DX-02k

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
