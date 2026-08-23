<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — World Builder API (WBAPI)

**Filed:** 2026-05-29 · **Ship commit:** `2d42ea2` · **Retrofitted:** `77c517f` (2026-06-05), Appendix A added `8b75986` (2026-06-05)
**Verified against HEAD:** 2026-08-13 (§DOC-02aq)
**Subject:** the authoring layer over `play.html` — `wbapi-core.js` · `wbapi-server.js` · `edit.html` · the CLI

---

## Abstract

The game is one file. That is a promise to the player — no install, no build step, no dead CDN, no
version drift; you open an HTML file and you are in Birka — and it is a **tax on the author**, who
must edit a 24,138-line JavaScript literal by hand to add one monster. This report records the
instrument built to pay that tax: a text-level read/write layer that parses the game's data sections
without executing the game, exposes them as CRUD, and refuses edits that would break referential
integrity.

**The report is a ship-note, not a survey** — it was committed *in the same commit as the code it
describes*, and it shows: every count, every worked example, every line number in it is byte-exact
at its own tree. Verification 76 days later finds the architecture intact and the inventory
superseded, plus **four defects, two of them still live**: a quest-dependency graph that answers
`{}` for 98.2 % of quests while reporting success, a node-index duplicate that has inflated the
delete-cascade guard since the day the system shipped, a save contract that has since inverted, and
a prompt-cache promise that cannot fire at the model it targets.

---

## I. Intention and inspiration — what this buys the player

Nothing in WBAPI ships to the player. That is the point of it.

The single-file constraint is the game's most player-facing decision and its most author-hostile
one. Every alternative — a bundler, a database, a CMS — would move the cost off the author and onto
the person trying to play. WBAPI moves it back, by making the file editable **as data** rather than
as text:

| The author's tax before | What WBAPI made it |
|---|---|
| Find `MONSTER_POOL` in 24k lines, count braces by eye | `./api.sh post monster key=dock_rat …` |
| Rename a monster in 20 terrain rosters by hand | `monsters.rename('commoner', 'Rabid Monkey')` — one call, all 20 |
| Delete a node and discover the orphaned quests at runtime | `nodes.delete('CY')` → `{ok:false, blockedBy:{…}}` |
| "Which quests are at this node?" — grep and hope | `location.get(code)` — node + terrain + monsters + quests + NPCs |

The measurable result is the only argument that matters. Between filing and verification:

| | At filing (2026-05-29) | At HEAD (2026-08-13) | |
|---|---:|---:|---|
| Quests | 210 | **2,853** | 13.6× |
| Nodes | 144 | **416** | 2.9× |
| Terrains | 69 | **111** | 1.6× |
| Named NPCs | 6 | **204** | 34× |
| File size | 1.77 MB | 5.51 MB | 3.1× |

Thirteen times the content, and the shipped artifact never stopped being one openable file. The tax
did not go away; the threshold at which it stops content being written moved, and everything above
is what fit through the gap.

---

## II. Method

Verification re-measured every claim at **two** trees: the report's own (`2d42ea2`, the commit that
introduced it) and HEAD. Numbers were produced by loading each tree's HTML through the current
`src/js/wbapi-core.js` parser and counting keys — the same parser the `:1367` server uses — never by
reading a figure off a document.

**Dating (instruments 18 / 34).** The header says 2026-05-29 and the git author date agrees
(09:50:57 −0700). Two independent artifacts confirm it and sharpen it. The commit's own tree
contains `play-20260529-162839.html` — the exact filename this report quotes as `save()`
output — and 16:28:39 **UTC** is 09:28:39 −0700, twenty-two minutes before the commit. The report
pasted a real file from a real session and then committed it.

*But the header is now true only of the prose.* `77c517f` (2026-06-05 13:21) rewrote **47 lines and
deleted 16**, substituting `./api.sh` for every CLI example, and `8b75986` (14:36 the same day) added
all 109 lines of Appendix A. A third of this document is a week younger than its own date, and §V
records what that retrofit walked past.

---

## III. As-built inventory

### III-A. The artifacts

| File | Role | At HEAD |
|---|---|---|
| `wbapi-core.js` | parse + CRUD + save/export/sync | ✅ `src/js/wbapi-core.js` |
| `wbapi-server.js` | HTTP layer, port 1367 | ✅ `src/js/wbapi-server.js` |
| `edit.html` | browser UI — Map, Bestiary, NPCs, Quests, Dice Lab, ⚙ API tab | ✅ |
| `api.sh` / `src/api/wb.js` | primary CLI — queued HTTP, auto-nonce, retry, `--ai` | ✅ *(retrofit — see §II)* |
| `wbapi-cli.js` | low-level CLI — direct in-process | ❌ **retired** (`5e48dd7`) |
| `wbapi-help.md` | field reference + cheatsheet | ✅ `docs/api/wbapi-help.md` |

> *The original opened "Three artifacts that form a complete read/write data layer" above a table of
> four, and `wbapi-server.js` — shipped in the same commit — was not in it. The prose was counting
> the pieces the author had in mind; the table was counting the files.*

### III-B. The anchor scheme

All game data lives inside `<script>` tags as object literals. WBAPI reads the file as **text** and
never executes it. **14 anchor comments** mark 7 sections:

```
◆◆◆ WORLDBUILDER:{SECTION}:START ◆◆◆
◆◆◆ WORLDBUILDER:{SECTION}:END ◆◆◆
```

| Section | Lines (at `2d42ea2`) | Contents | ✔ |
|---|---|---|:-:|
| MONSTER_POOL | 4868–5700 (832) | 392 monsters | ✅ |
| MONSTER_DROPS | 5303–5699 (396) | loot tables (nested inside MONSTER_POOL) | ✅ |
| WORLD_DB | 5708–5791 (83) | 69 terrains, each with a monster list | ✅ |
| NODE_MAP | 7582–7883 (301) | 144 nodes | ✅ |
| NODE_COORDS | 7888–7959 (71) | canvas x/y per node | ✅ |
| QUEST_DB | 8483–10597 (2114) | 210 quests | ✅ |
| BIRKA_NPC | 11472–11530 (58) | 6 named NPCs with dialogue trees | ✅ |

**14 of 14 line numbers exact; 7 of 7 sections exact; the anchor count is exactly 14.** This table
was transcribed, and it shows.

> ⚠️ **The header's `~11,530 lines` is this table's last cell.** The file was **24,138 lines** at
> this tree. `11530` is `BIRKA_NPC`'s END line, read as the file length. The companion figure —
> *1.7 MB* — is exact (1,771,988 B). One number was measured and one was glanced at, on the same
> line, by the same hand.

### III-C. The pipeline

```
raw HTML text
     │  extrSection(src, 'SECTION')          ← slice between anchors
     │  extractObj(block, varName)           ← comment-aware balanced-brace extractor
     ▼
┌───────────────────────────────────────────────────────────────┐
│ parseSimple     new Function('return ('+obj+')')   MONSTER_POOL, NODE_MAP, NODE_COORDS
│ parseWithP      new Function('P', …)(Pp)           WORLD_DB   (P.monsterKey refs)
│ parseSanitized  removeFns(obj) then eval           QUEST_DB, BIRKA_NPC
└───────────────────────────────────────────────────────────────┘
     ▼  _buildIndexes()                      ← 4 lookup maps
```

All three parsers and all four helpers verify at both trees (`src/js/wbapi-core.js:function extractObj@146`,
`src/js/wbapi-core.js:function removeFns@175`, `src/js/wbapi-core.js:function parseSimple@280`,
`src/js/wbapi-core.js:function parseSanitized@293`).

**Why `extractObj` is comment-aware.** `NODE_COORDS` contains
`/* Paul's Journeys — Mediterranean serial chain */`; the apostrophe was read as a string delimiter
and threw off the brace counter. The fix skips `//` and `/* */` **before** testing for quotes or
braces — verified in that order at both trees. *This is the repo's most consequential eleven lines:
the same four-state scanner is what §AUDIT-03f later found a second, non-comment-aware copy of, and
that copy silently ate whole quest entries. Writing the algorithm once did not make the codebase
safe; it made these call sites safe.*

**Why `WORLD_DB` needs a P proxy.** Rosters reference monsters as `P.commoner`, and in an isolated
`new Function()` scope `P` is undefined. `src/js/wbapi-core.js:const Pp = new Proxy(P@290` returns
`{ key: String(k) }` for any unknown key — **byte-identical archive → HEAD**.
*(Corpus note: the same-day sibling `lab-report-wbapi-evolution.md` describes this proxy as returning
a bare string. It does not. Where two siblings disagree, this is the one that read the file.)*

**Why `QUEST_DB` needs `removeFns`.** Quests embed closures (`completeFn: (S) => {…}`) that cannot be
safely eval'd in the worldbuilder context. `removeFns` is a character scanner replacing
`: (args) => expr` and `: function(){…}` with `: null`, preserving every other field. Mutations then
patch `_rawSrc` (the raw text), so the function bodies survive the round trip untouched.

### III-D. The API surface

The full command reference is `docs/api/wbapi-help.md` + `docs/api/API-README.md` and is maintained
there; this table records only whether each surface the report specified still exists.

| Surface | Specified as | At HEAD |
|---|---|:-:|
| GET single | `nodes/quests/monsters/npcs.get(idOrName)` via `_findKey` | ✅ (ordering caveat, §VI-3) |
| Composite | `location.get(code)` → node · terrainKey · terrain · monsters · quests · npcs | ✅ |
| LIST | `quests.byNode` · `byType` · `monsters.byTerrain` · `npcs.byNode` · `nodes.byAct` · `worlds.monsterList` | ✅ (`byNode` double-counts, §VI-2) |
| Chain | `quests.chain(id)` → `{upstream, downstream}` from `_flagToQuests` | ⚠️ returns, empty — §VI-1 |
| Patch | `editField` → `patchStringField` (targeted string replace in `_rawSrc`) | ✅ |
| Patch | `put()` — merge fields, recorded in `DIFF` | ✅ in-memory only |
| Rename | `monsters.rename(key, display)` — key unchanged, all rosters keep working | ✅ |
| Fork/swap | `monsters.fork()` + `worlds.swapMonster()` — terrain-local variant | ✅ |
| DELETE | cascade guard: node ← quests/NPCs · quest ← flag readers · monster ← rosters · npc ← raw refs | ⚠️ flag leg empty — §VI-1 |
| MOVE | rename a node code, re-link quest + NPC refs | ✅ |
| Export | `save()` · `exportWorld()` · `syncWorld()` · `DIFF.json()` | ⚠️ `save()` inverted — §VI-4 |

`node.name` is the **terrain key**; `node.label` is the display name. The report records this as the
root cause of its own `terrain:null` bug, and it is still the rule an author must know (see the
node-creation terrain-key rule in `prompt.md` §4).

---

## IV. Census at the report's own tree — 21 of 21 exact

Everything the report states as a number was correct on the day it was written.

| Claim | Measured at `2d42ea2` | |
|---|---|:-:|
| 144 nodes · 210 quests · 392 monsters · 6 NPCs · 69 terrains | 144 · 210 · 392 · 6 · 69 | ✅ |
| 108 quest arcs · 711 terrain↔monster links · 141 flag links | 108 · 711 · 141 | ✅ |
| Quest types — side 104, skill_check 59, epic 40, main 7 | identical (Σ = 210) | ✅ |
| Largest arcs — quest 24, quest_wis 8, mq 7, quest_alch 7, quest_whisper 6 | identical | ✅ ¹ |
| `quests.byNode('CY')` → 3 at Neon Undercity | 3 | ✅ |
| `quests.byType('skill_check')` → 59 | 59 | ✅ |
| `monsters.byTerrain('market_quarter')` → 16 | 16 | ✅ |
| `npcs.byNode('CI')` → 2 at City Streets | 2 | ✅ |
| `location.get('CI')` → 28 monsters, 6 quests, 2 NPCs, act 1 | all four | ✅ |
| `quest_governor_cyprus` → 23 upstream / 32 downstream | 23 / 32 | ✅ |
| `rename('commoner')` → "all 20 terrain references" | 20 | ✅ |
| `rename('npc_merchant')` → `['market_quarter','desert_caravan']` | identical, in order | ✅ |
| `quests.get('The Question')` → `quest_antecedent_01` | title matches | ✅ |

¹ *The 5th row is one of a four-way tie at 6 (`quest_whisper`, `quest_glut`, `quest_wane`,
`quest_inn`). Correct, not exhaustive.*

### The one table that does not add up — and it was reporting a real defect

The tier distribution reads **trivial 30 · easy 56 · medium 148 · hard 123 · deadly 33**. All five
are exact. They sum to **390**, against the 392 the report states four lines above.

The missing two are not a typo. They are `void_shaman` (*The Warden*) with `tier:'rare'` and
`void_rat_swarm` with `tier:'low'` — **two values outside the five-member enum**, in a field that is
not cosmetic: it drives Void-enrage magnitude, initiative, encounter weight and the threat badge,
and every one of those readers falls back silently on an unknown value.

The arithmetic gap in a summary table was the earliest visible symptom of a defect this repo did not
diagnose until **§DX-02g on 2026-07-31** (`f229ede` — *"two monsters carried a tier the engine has no
entry for, and every reader answered with a wrong number instead of an error"*). Sixty-three days
sat between the symptom and the diagnosis, in a table nobody re-added. **RETIRED — fixed, and HEAD's
five tiers now sum to 398 of 398.**

---

## V. Spec → shipped delta

| § | Claim as filed | At HEAD | Verdict |
|---|---|---|---|
| Header | *1.7 MB* | 1,771,988 B at own tree | ✅ exact |
| Header | *~11,530 lines* | 24,138 lines | ❌ **wrong when written** — §III-B |
| Artifacts | *Three artifacts* | four rows, five files shipped | ❌ prose ≠ its own table |
| Artifacts | `wbapi-cli.js` | removed by `5e48dd7` | 🕳 **RETIRED** |
| Pipeline | 3 parsers · 14 anchors · 7 sections | all present, all exact | ✅ |
| Pipeline | P proxy returns `{key:'k'}` | `{ key: String(k) }` | ✅ byte-identical |
| Query | `_findKey` searches *`key` → `label` → `name` → `title`, in that order* | key first, then **one pass** testing `[label,name,title].some(…)` per entry | ⚠️ **set right, order fictional** — §VI-3 |
| Query | quest chain tracing, `quest_governor_cyprus` = 23/32 | **0 / 0**; 52 of 2,853 quests have any chain | ❌ **LIVE DEFECT** — §VI-1 |
| Patch | *All mutations … patch `_rawSrc`* | `put()` is in-memory only, as the same section says two paragraphs later | ⚠️ self-contradictory |
| Patch | `patchStringField` regex, quoted | real regex anchors on `${entryKey}\s*:` — the key's own **declaration**, not any occurrence of its text | ⚠️ near-verbatim, not verbatim |
| Delete | cascade guard blocks on quests/NPCs/terrains/flags | still there; quest list **double-counts** and the flag leg is empty | ❌ **LIVE DEFECT** — §VI-1, §VI-2 |
| Export | `DIFF.json()` shape | `edit.html:const DIFF = {@2448`, `json()` returns exactly that shape | ✅ — *browser-side, not a `wbapi-core` export* |
| Export | *The original file is **never modified**. Every `save()` produces a new timestamped copy.* | **inverted** — writes persist per-write via `saveGameFile()`; `src/js/wbapi-core.js:save() requires a destination path@1662` refuses the argless call | 🕳 **RETIRED** — §VI-4 |
| Export | `wbapi-cli.js export ./world` / `sync ./world` | `src/js/wbapi-core.js:exportWorld(dir) {@1694` / `src/js/wbapi-core.js:syncWorld(dir) {@1743` | ✅ mechanism survives its CLI |
| Browser | ⚙ API tab: GET/PUT/DELETE/MOVE, schema tables, pre-fill | all present | ✅ |
| Bugs | 3 bugs found during testing | all three fixes verified in place | ✅ 3/3 |
| Node codes | `CY`, `CI` | `CY`→**`HKG`**, `CI`→**`LHR`** (by `num`) | ⚠️ **`CI` is worse-than-dead** — §VI-5 |

---

## VI. Findings

### VI-1 🔴 LIVE — the dependency graph reports success and returns nothing

`quests.chain()` is the report's flagship read: *"23 quests must complete before it activates, and it
unlocks 32 downstream."* At HEAD that same call returns **`{upstream: [], downstream: []}`**, and it
is not an outlier — **52 of 2,853 quests (1.8 %) have any chain at all**, and the absolute number of
traced flags has gone **down** (141 → 93) while the corpus grew 13.6×.

The cause is in this report's own §"Quest chain tracing", stated as a design note: the graph is
*"extracted by regex from the raw QUEST_DB source text."* §ARCH-01 moved every quest to declarative
UQF-1.0, where flags live in `bits[].flag` and `gate.flags` — shapes an `S_story.(\w+)` regex cannot
see. `src/js/wbapi-core.js:chain(id) {@1089` reads `_questFlags` / `_flagToQuests` and nothing else.

`_questFlags` has an entry for all 2,853 quests. **It is built for every quest and empty for 98.2 %
of them** — a 100 % index in front of a dead consumer, which is why nothing ever went red. And
because `_deps.quest()` feeds the DELETE cascade from the same index, **the guard this report
documents — "blocked by any quest that reads a flag this quest writes" — is unenforced for 98.2 % of
quests.** A safety mechanism did not fail; it quietly stopped applying.

→ **§DX-02ar** (already open). This increment contributes the coverage figure.

### VI-2 🔴 LIVE — the node index counts a quest twice, and has since day one

`src/js/wbapi-core.js:this._questsByNode[q[field]].push(id);@775` sits inside
`for (const field of ['activateNode','waypointNode'])` with no dedupe. A quest whose two node fields
name the same node is indexed **twice**.

**49 of 416 nodes are affected** (worst: `NUE`, 9 duplicates in a 186-entry list). Every consumer
inherits it — `./api.sh list quest --node X` double-lists, `location.get(X).quests` over-counts, and
`_deps.node()` reports the same blocker twice in the delete guard.

It was there at filing: this report's own DELETE example returns
`blockedBy.quests: ['quest_antecedent_01', …]`, and the elided tail is `quest_signal_01` **listed
twice**. The ellipsis hid a live bug for 76 days. → **§DX-02bd NEW.**

### VI-3 ⚠️ The precedence that never existed

*"`_findKey` searches: `key` → `label` → `name` → `title` (in that order)."* The **set** is right and
key-first is right. The rest is not: `src/js/wbapi-core.js:_findKey(col, idOrTitle) {@833` makes a single
pass over the collection testing `[v?.label, v?.name, v?.title].some(…)` **per entry**, so if one
entry's `title` matches and another's `label` matches, the winner is whichever comes first in
insertion order. Byte-identical archive → HEAD: **wrong when written, wrong now.** A four-word
parenthetical invented an ordering guarantee out of a list.

### VI-4 🕳 RETIRED — and the retrofit inserted the contradiction

*"The original file is **never modified**."* At `2d42ea2` this was **exact** — `save()` fell back to
`getStampedName()` and wrote only a dated copy. §DX-02k inverted it: writes now persist to the game
file per write via `saveGameFile()` (temp + atomic rename), `saveStamped()` is the deliberate backup,
and the argless `save()` this report demonstrates **is refused outright**.

The sharp part is not the drift. It is that `77c517f` — editing this very file on 2026-06-05 —
inserted `# (auto-save fires after each PUT; prefer batching in a single session)` **nine lines
below** the never-modified sentence and left it standing. *A document edited on the day a claim
became false is not thereby a document that survived review. Read the retrofit's diff, not its date.*

### VI-5 ⚠️ `CI` in a runnable block returns a confident wrong answer

By `num`, all three node codes this report and its sibling use resolve cleanly: `CY`(6) → `HKG`,
`CI`(1) → `LHR`, `BK`(25) → `VBY`. But the two behave differently at the keyboard:

- `CY` is **gone** at HEAD — `./api.sh location CY` fails loudly. Harmless.
- **`CI` still exists**, as `num:429`, *"Chancery Court — The Officer's Pen"* — a different place in a
  different act. `./api.sh location CI` returns a fast, confident, completely wrong answer.

As filed, this report handed out `CI` in **six runnable fenced blocks** — including the
`world/CI/npcs/yael/…` export tree and the `sync` example — and `CY` in eleven more. Per §AUDIT-03m a
fenced block **is code** and is never annotated by gate #16, so a dead code inside a copy-pasteable
example is invisible to the gate by construction.

This rewrite retires those blocks rather than annotating them: the live, maintained command surface
is `docs/api/wbapi-help.md` and `docs/api/API-README.md`, and a second copy in a history document was
only ever a way to hand an author a stale node code. **The claims those blocks carried are preserved
as verification rows in §III-D and §IV — nothing is deleted, it is moved into the delta table.** The
corpus-wide census — how many other reports still hand out a worse-than-dead code in a runnable
block — is filed as **§DX-02be NEW**.

---

## VII. Appendix A — the NPC Speak endpoint (added `8b75986`, 2026-06-05)

`GET /api/npc/{id}/speak?prompt=…&state=neutral|friendly|dearFriend` returns a voiced NPC line.

**Mechanically, this appendix is flawless.** Its endpoint comment is byte-identical to the server's
own; `FEATURE INCOMPLETE — NEED TO SETUP SAFE SEEDS` is verbatim; the three states are exactly the
three the handler accepts; the default model `claude-haiku-4-5-20251001` and the
`--model claude-sonnet-4-6` override are both still live in
`src/js/wbapi-server.js:claude-haiku-4-5-20251001@10607` and `src/api/wb.js`; port 1367 is right; and the
`.env` activation guide is exact down to `wbapi-toggle.sh` line 31 — the `PASTE-YOUR-KEY-HERE` guard
that skips the placeholder so an unedited `.env` breaks nothing. Its **152 NPC greetings** was
*measured* — `BIRKA_NPC` held exactly 152 entries at that tree.

**And the stub shipped.** The endpoint now carries a real Claude call, falling back to seed replay
with `src/js/wbapi-server.js:SEED FALLBACK — set ANTHROPIC_API_KEY@10623` when no key is set. The
*"wired and waiting for an API key"* promise held.

### 🔴 The one table that was reasoned rather than copied

| Claim | Measured |
|---|---|
| *"NPC system prompt cached 5 min — repeated calls cost ~10 % of first call"* | The code does set `src/js/wbapi-server.js:cache_control: { type: 'ephemeral' }@10659`. **Claude Haiku 4.5's minimum cacheable prefix is 4096 tokens; this system block measures 451–546.** Below the minimum the API caches nothing and reports nothing — no error, `cache_creation_input_tokens: 0`. All 20 calls in `milepoints/npc-speak.log` show cache_read **and** cache_write at 0. |
| *"Repeat calls (cache hit): ~0.002¢"* | That is 250 input tokens × 0.1, i.e. **the input only**. It drops the 60-token reply the same paragraph specifies — which at Haiku's output rate is ~0.03¢, an order of magnitude larger than the whole figure. |
| *"10,000 NPC greetings ≈ $0.20"* | ~**$3** at the report's own token counts, and the cache discount it assumes never applies. |

*Message Batches at 50 %, the 5-minute default TTL, and the ~0.1× cache-read multiplier are each
correct in isolation.* The failure is compositional: three true facts, one impossible precondition,
and a cost model that priced the prompt and forgot the answer.

The pending design questions the appendix closes on — how many seed lines lock the register, whether
Claude may invent lore, what `dearFriend` needs from game state, how to guard the noir tone — remain
open and remain the right questions. → **§DX-02ak** (the cache), **§DX-02al** (the registry join).

---

## VIII. Defects filed

| Row | Finding | Status |
|---|---|---|
| **§DX-02bd** 🟢 NEW | `_questsByNode` pushes once per node field with no dedupe — 49 of 416 nodes carry duplicates, inflating `list quest --node`, `location.get()` and the delete-cascade guard. Present since `2d42ea2`. | filed |
| **§DX-02be** 🟡 NEW | Retired node codes inside **runnable fenced examples** across the lab-report corpus are invisible to `check:legacycodes` by construction. `CI` is the worse-than-dead case: live at HEAD as a different node. Census, then annotate. | filed |
| §DX-02ar | Quest dependency graph reads the format §ARCH-01 retired. **New evidence: 52 of 2,853 quests (1.8 %) have any chain; traced flags fell 141 → 93 while the corpus grew 13.6×.** | open, evidence added |
| §DX-02ak | The NPC-speak prompt cache has never written a token. **New evidence: this report's Appendix A is the second document to promise the 10× saving, and it builds a cost estimate on it.** | open, evidence added |
| §DX-02al | `worldTruth` / `enemy` live in the registry the speak endpoint does not read. | open |
| §DX-02g | Two off-enum monster tiers — **first visible as this report's tier table summing to 390 against its own 392.** | ✅ `f229ede` |
| §DX-02k | `save()` argless wrote a 5.4 MB snapshot into the process CWD per write. | ✅ `2ead185` |

---

## IX. Conclusion

Seventy-six days is a long time in a repo that grew 13.6× in content, and the interesting result is
**which half of a document survives it**. Every architectural claim here held: the anchor scheme, all
three parsers, the P proxy, the comment-aware brace counter, the cascade-protection design, the
DIFF shape, the export/sync surface, the browser tab. Every inventory claim is superseded, which is
what inventory does.

The four defects sit precisely where the author stopped copying and started composing. The line
count came from a table cell. The `_findKey` ordering came from a list. The cost model came from
three true facts multiplied in the wrong order. The tier table came from real data and its own
arithmetic was the alarm — one nobody heard for sixty-three days, because a summary that is 5-for-5
correct does not invite you to add it up.

**The durable lesson is the one the retrofit taught.** `77c517f` opened this file, rewrote a third of
it, and set a new claim nine lines under a claim it had just falsified — without noticing, because a
retrofit certifies only its own charter. The header still says *Filed: 2026-05-29*, and of the prose
that is true.

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
