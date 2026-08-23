<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report: Quest API Architecture & the Universal Quest Format (UQF-1.0)

**Document ID:** §ARCH-01
**Original:** 2026-05-28 — Design Specification, Pre-Implementation (577 lines)
**Verified:** 2026-08-12 — §DOC-02ag, re-measured against live `roll2hit-v3.html` (38,712 lines · 2,853 quests)
**Status:** ✅ **SHIPPED AND CLOSED.** Thesis executed at 13.6× the specified scale. Four delta clusters recorded below.

---

## Abstract

This is the specification that turned quest content from **code** into **data**. In May 2026 a
mission's behaviour lived in three places at once — a `QUEST_DB` entry, a `storyRender` injection
block, and a `completeFn` closure — so adding one quest meant writing JavaScript in three files'
worth of one file, and no tool could read a quest without executing it. §ARCH-01 proposed a single
declarative schema (**UQF-1.0**), an opcode registry of composable *mission bits*, a runtime host
(`QuestRuntime`) to execute them, and a five-phase live migration.

**It shipped.** At HEAD, **2,803 of 2,853 quests (98.2 %) carry `schema:'UQF-1.0'`**, one runtime
executes all of them, and the runtime is a **parity-fenced module** (`src/js/quest.js`) that runs
headless on the server — a capability the spec did not ask for. The spec was written against a
**210-quest** database; the format it defined now carries **2,853**.

This verification finds report-rot concentrated exactly where instrument 12 predicts — in the one
passage the author *composed* rather than *copied* — and engine-rot in three places where a
promised payoff was implemented and then silently outgrown.

---

## Method

1. Census: every identifier, field, bit kind, node code and quest id named in the report, batched
   through one `grep -c` pass, then partitioned live / dead.
2. `git log -S "<symbol>" -- roll2hit-v3.html` on every dead symbol, to separate **RETIRED**
   (shipped, later removed) from **NEVER SHIPPED** (0 commits ever).
3. Archive adjudication (instrument 8): the report entered the repo at **`2d42ea2`
   (2026-05-29 09:50)**, one day after its stated date. Every *"currently"* claim is scored against
   `git show 2d42ea2:roll2hit-v3.html`, never against HEAD.
4. Delta table run **both ways** — report-rot *and* engine-rot.
5. Reachability (instrument 19) and census cross-check (instrument 14): totals reproduced against
   `npm run stats` and `check:dupkeys` before any delta was derived.

> **Instrument 14 fired on this pass and changed a headline.** A first, unscoped
> `grep -o "type:'…'"` returned 42 distinct `type` values at the archive and made §1.1 look
> catastrophically wrong. Those were mostly *inventory item* types. Re-scoped to the
> `WORLDBUILDER:QUEST_DB` anchors, the real answer is **four** — and §1.1 is wrong by exactly one
> type, which is a finding worth keeping instead of a scandal that was not true.

---

## 1. Intention, and what it buys the player

The report's own argument, restated because it is still the right one:

> *"Quest behavior currently lives in three places simultaneously… Editing the quest title means
> finding the right `storyRender` block. Changing a DC means finding the `QUEST_DB` entry. Adding a
> new item reward means writing raw JS in a closure."* — §1.2

That is an authoring complaint, but it was really a **content-volume** argument, and the number
proves it. A format where one quest costs three hand-edits in a 14,000-line file has a ceiling
somewhere around a few hundred quests; a format where a quest is a JSON-shaped literal has
essentially none. **210 → 2,853 in 75 days** is the whole case for UQF, and it was made before the
content existed to justify it.

**What the player actually got from this document:**

| Player-facing consequence | Mechanism UQF made possible |
|---|---|
| **A world with 2,853 missions instead of ~210** | quests became bulk-authorable data; `src/scripts/uqf-bulk-migrate.js` moved 2,600+ of them mechanically |
| **The Warrant's Board** (§BOARD-01) — a discovery surface that lists what you can *actually* start | a board can only rank missions whose availability is a readable `gate:{…}`, never a closure it would have to run |
| **Missions that charge you** (the `cost` opcode, §VM-01-G4a) | a new *mechanic* is one opcode + one contract row, and every existing quest can use it the same day |
| **Choices that are real choices** (Kern & Sable at DUS) | `choice` suspends the bit chain and applies **only** the picked branch, *after* the pick — closing a tab mid-choice writes no partial state |
| **A quest that misfires is caught before you meet it** | `validateQuest` + `check:questgraph` + `check:questparity` can inspect a quest without running the game |

The last one is the quiet win. Under the old format, the only validator for a quest was *a player
walking into it.*

---

## 2. As-built inventory

The runtime is one fenced region, `// ◆◆◆ QUEST:CORE:START ◆◆◆@21965` → `QUEST:CORE:END`,
byte-identical to `src/js/quest.js` and asserted by `check:questparity` (gate #8 of 16).

| Spec element | As built | Anchor |
|---|---|---|
| Schema constant | `SCHEMA_VERSION` | `const SCHEMA_VERSION = 'UQF-1.0';@21966` |
| Bit contract registry | 13 kinds (spec: 6) | `const BIT_CONTRACTS = {@21970` |
| Contract checker | pure, no side effects | `function validateQuest(q) {@22004` |
| Legacy adapter | retired to identity (W7d) | `function adaptLegacyQuest(id, q) {@22026` |
| Runtime factory | host-injected (§VM-01-D) | `function createQuestRuntime(host) {@22180` |
| Activation gate | compiled boolean tree | `canActivate(questId) {@22193` |
| Completion gate | **not in the spec** | `canComplete(questId) {@22205` |
| Bit-chain executor | **a generator** (§VM-01-A) | `*execBits(bits, ctx) {@22223` |
| Roll | seeded stream, not `Math.random` | `_rollSkill(stat) {@22242` |
| Skill-check resolver | name exact | `resolveSkillCheck(bit, ctx) {@22256` |
| Opcode table | 13 handlers (spec: 8) | `HANDLERS: {@22264` |
| Live binding | 12 injected effects | `const QuestRuntime = createQuestRuntime({@22341` |
| Activation leaf | ~15 declarative terms | `function _matchActivationLeaf(g, st) {@22048` |

**Opcode usage across all 2,853 quests** (authored bit kinds, not contract rows):

| kind | uses | | kind | uses |
|---|---:|---|---|---:|
| `skill_check` | 2,623 | | `favor` | 18 |
| `mission_bit` | 2,449 | | `unlock` | 14 |
| `reward` | 151 | | `combat` | 10 |
| `narrative` | 138 | | `item_remove` | 8 |
| `_legacy_fn` | 115 | | `cost` | 3 |
| `flag_write` | 58 | | `choice` | 2 |
| | | | **`item_check`** | **0** |

Structural totals: **2,803** quests stamped `UQF-1.0` · **2,823** carry `gate:` and `bits:` ·
**189** carry a declarative `completion:` · **105** an `onComplete:` chain · **163** a
`waypointNode` · **50** never migrated.

---

## 3. Spec → shipped delta table

Both directions. **RS** = report-side rot (the report is wrong), **ES** = engine-side (the engine
declined or outgrew the spec), **✅** = shipped as specified.

| # | Spec claim (§) | Shipped | Verdict |
|---|---|---|---|
| 1 | `schema:'1.0'` (§3.1) | `schema:'UQF-1.0'`, 2,803× | ES — value changed, field kept |
| 2 | `arc:` on every quest (§3.1) | **3 quests of 2,853** | ES — abandoned |
| 3 | `layer:` on every quest (§3.1) | **1 quest of 2,853** | ES — abandoned |
| 4 | `type` field dropped (§3.1 omits it) | **`type:` on 2,853 of 2,853** | ES — never left; it drives the roll card |
| 5 | `gate:{flags,flagsAny,notFlags,nodes}` | all four ✅ + `flagEquals`, `questsDone`, `questsAttempted`, `items`, `battles`, `restedAtMin`, `atNode`, … | ✅ + widened to ~15 terms |
| 6 | `gate.expr` string language (Open-Q #5) | **0 commits ever** — shipped as `{all}/{any}/{not}` object composition | ES — better answer, same problem |
| 7 | `QuestRuntime.canActivate/execBits/resolveSkillCheck/HANDLERS` | all four ✅ under their exact names | ✅ |
| 8 | `SCHEMA_VERSION`, `BIT_CONTRACTS`, `validateQuest`, `adaptLegacyQuest` | all four ✅ | ✅ |
| 9 | `rollD20Stat(bit.stat)` (§6) | **0 commits ever** → `_rollSkill(stat) {@22242` | RS — invented name |
| 10 | `pushKnowledge(bit.knowledge)` (§6) | **0 commits ever** → inline `st.knowledge.push` | RS — invented name |
| 11 | `renderNamedTemplate(bit.template)` (§6) | **never a function** — survives only in a comment; `template:` has **0** authored uses | ES — NOT SHIPPED |
| 12 | `renderChoiceBlock(prompt, options, ctx)` (§6) | never existed; the host end shipped 2026-08-04 as `_uqfRunVerb` (§VM-01-G4a) | ES — 71 days inert |
| 13 | `MissionBitController` (§9 heading) | **0 commits ever**; the function under it shipped as `validateQuest` | RS — invented name for a real thing |
| 14 | Eight opcodes (§4) | 13: + `cost`, `mission_bit`, `favor`, `item_check`, `_legacy_fn` | ✅ + widened |
| 15 | `unlock` handler = *"force quest panel refresh"* (§6, a stub) | fully implemented: writes `st.quests[qid]='active'` | ES — the stub grew a body |
| 16 | `adaptLegacyQuest` wraps `gate:{_legacyFn: q.activateCond}` | shipped as a **marker** `gate:{_legacyFn:true}` on 15 quests; the function itself is a W7d no-op | ES — shape survived, mechanism inverted |
| 17 | Phase 4: *"`schema:'0.legacy'` entries: zero"* | `'0.legacy'` **retired** (2 commits) — but **46 `activateCond` closures with 2 live readers** and **115 `_legacy_fn` bits** remain | ES — goal met by renaming, not by removing |
| 18 | Design Goal *"No JS closures in quest data"* (§2) | **144 of 2,853 quests (5.0 %) still carry one** | ES — 95 % achieved |
| 19 | `WBAPI.quests.all()` / `.chain(id)` (§10) | both ✅ under their exact names | ✅ |
| 20 | §10: chain graph *"uses declarative `gate.flags` instead of regex"* | still 100 % regex — **see Finding 3** | ES — the stated payoff |
| 21 | §12 *"lives where"* table (10 rows) | `MONSTER_DROPS` ✅ · `BIRKA_NPC_PROFILES` ✅ · `WORLD_DB[t].monsters` ✅ · `NODE_MAP[code].text` ✅ · all six `bits[]` rows ✅ | ✅ 10/10 |
| 22 | Open-Q #3: *"add a new bit kind `item_check`"* | kind shipped, contract shipped, handler shipped, **0 quests use it**; the real answer was a completion-gate `items` term | ES — built both, used one |
| 23 | Open-Q #4: *"`retryable` inherits from the quest root, not the bit"* | exactly so — **0 bits carry `retryable`**; `retryGateDays` added later (67 uses) | ✅ answered as proposed |
| 24 | Phase 2 target arcs: §DUNGEON-01, §SPARK-03, §HUNT-03, §CEREMONY-03 | §DUNGEON-01 ✅ shipped; the other three **do not exist** (§SPARK-01/02 and the hunt arcs shipped under other tags) | RS — three aspirational tags |
| 25 | Phase 3 order: WISDOM → SPARK → ALCHEMY → HUNT → main | WISDOM-01 **was first**, exactly as argued (`d7505ff`); the rest reordered (spark 9th, hunt 12th, alch 15th) — all four migrated | ✅ on the thesis |
| 26 | §11 per-arc manual play-through checklist | replaced by `src/scripts/uqf-bulk-migrate.js` + golden-diff + Playwright | ES — see Finding 4 |
| 27 | §14 schedule: *"Phase 1 — next session"* | Phase 1 landed **30 days later** (`80bc1f4`, 2026-06-28 13:01) | RS |
| 28 | §14 schedule: Phase 3 = *"2–3 sessions"* | Phase 1 → Phase 2 → first migrated arc in **28 minutes**; all ~2,850 quests in **2 days** | ES — 20× faster than planned |
| 29 | `activateNode:'DK'` (§3.1, §5) | **a survival, not a dead code** — archive `DK:{num:7, "Magistra Muffat is terrifying in the best way…"}` is HEAD's `LCY`, `num` / text / NPC byte-identical | ✅ right when written |

---

## 4. Findings

### Finding 1 — §1.1's problem statement undercounts its own problem by one whole type

> *"Three quest types currently exist, each with incompatible field sets."* — §1.1

Scoped to `QUEST_DB` at the birth commit `2d42ea2`, there were **210 quests and four types**:

| type | archive count | HEAD count |
|---|---:|---:|
| `side` | 104 | 142 |
| `skill_check` | 59 | 2,484 |
| **`epic`** | **40** | **40** |
| `main` | 7 | 7 |

`epic` — **19 % of the database, the second-largest formal type** — is absent from §1.1's table and
from every migration phase in §8. It is also the one type that never grew: **still exactly 40, 75
days later**, which is the §EPIC-01 orphan set. The report also calls `main` *"implicit"*; it was a
literal `type:'main'` string on seven quests, and those seven are also unchanged at HEAD.

*A specification that omits a type does not fail loudly. It just never mentions it again.*

### Finding 2 — the worked example is the fabricated part (instrument 12, purest form)

§5 presents *"Legacy format (current)"* for `quest_wis_01` as a transcription. Against the archive
it is **4 of 9 fields wrong, plus one omission and one invention**:

| §5 says | Archive `2d42ea2` says | |
|---|---|---|
| `title:'The Rope Callous'` | `title:'Mask Check'` | ❌ **0 commits ever** for the report's title |
| `hint:'Study the merchant's hands.'` | `hint:'Read Silas Vance\'s hands at the Tilbury docks. WIS Insight DC 13.'` | ❌ |
| `checkStat:'WIS'` | `checkStat:'wis'` | ❌ case — and the case mattered: `§SKILLFIX-02` (`fc040cd`) is a whole migration wave about it |
| `xpAward:150, reward:150` | `xpAward:0`, no `reward` field | ❌ invented |
| *(omitted)* | `checkPassFlag:'wisPage1_masks'` | ❌ omitted from the very listing §1.1 says defines the type |
| `activateNode:'DK'`, `activateCond:()=>!!S_story.wisHookReceived`, `checkSkill:'Insight'`, `checkDC:13`, `retryable:false`, `disposition` | all exact | ✅ |

The §5 **UQF conversion** then carries the error forward — it specifies `reward{xp:150}` where the
legacy `onPass` awarded **250**. The engine, migrating for real 31 days later, took the *archive's*
number: `{ kind:'reward', gold:150, xp:250,@13360`.

And every string the author could **copy** survived intact. `quest_wis_01: { id:'quest_wis_01',
schema:'UQF-1.0'@13351` still holds the `desc`, the `hint`, the 👁️ pass narration and the fail
line **byte-identical to the archive across 75 days and a total format migration**. The
`disposition` — *"I was waiting for someone to notice." — Silas Vance, third berth* — is verbatim
too; the report quotes it correctly everywhere except where it truncates the attribution.

Even the invented reward item obeys the rule: `Pages of the Ardley Manuscript` is real (4
occurrences, then and now), while its stated `id:'pages_ardley'` and `type:'token'` are not — the
live record has **no `id` field at all** and is `type:'misc'`. ***The name was copied; the schema
around it was remembered.***

### Finding 3 → §DX-02ar — the migration's stated payoff inverted, and it disarmed a safety guard

§1.3 filed the defect: *"The WBAPI flag extraction currently relies on regex over raw source text
as a workaround. This is fragile."* §10 promised the fix: the chain graph *"uses declarative
`gate.flags` instead of regex."*

At HEAD the regex is **unchanged and unaccompanied**:
`src/js/wbapi-core.js:this._questFlags[id] = { reads, writes };@797` still derives every dependency
edge from `src.matchAll(/S_story\.(\w+)/)` over raw quest source, and
`src/js/wbapi-core.js:chain(id) {@1089` reads nothing else. There is no `gate.flags` branch anywhere
in the file.

Migrating to a declarative format therefore made the analyser **blind**, because a declarative gate
contains no `S_story.` token to match. Measured over all 2,853 quests:

- **104** quests contain any `S_story.` read; **66** contain a write.
- **1,680** quests carry declarative dependency terms (`gate.flags` / `flagsAny` / `notFlags` /
  `questsDone` / `questsAttempted`).
- **1,624 of those are invisible to the regex** — no `S_story.` token anywhere in the entry.
- `WBAPI.quests.chain(id)` therefore returns `{upstream:[],downstream:[]}` for **2,749 of 2,853
  quests (96.4 %)**. The 2,449 `mission_bit` grants are equally invisible: the flag is written by a
  host effect, not by an assignment in the quest's own text.

**The consequence is not cosmetic.** `src/js/wbapi-core.js:const d=WBAPI._deps.quest(k);
if(d.downstream.length)@1107` is the **delete guard** — the check that refuses to delete a quest
other quests depend on. It is fed by that same empty chain, so for 96 % of the database the guard
passes vacuously. `advise` reports the empty chain as fact.

*This is the §DX-02n family inverted once more: not a reader with no writers, but an analyser
still reading the format its own document retired.*

### Finding 4 — the plan that shipped is not the plan that was written, and that is why it shipped

§11 is a **13-line manual checklist per arc**, ending *"Run play-through: activate quest, pass,
verify flags + rewards / …fail, verify retry/lock."* §14 budgets Phase 3 at *"2–3 sessions."* With
~210 quests that is defensible. It does not survive contact with 2,853.

What actually happened, from the commit stream:

| | commit | time |
|---|---|---|
| Phase 1 — inert runtime | `80bc1f4` | 2026-06-28 **13:01** |
| Phase 2 — dual-path dispatch | `f5117ca` | **13:21** |
| Phase 3 — first arc, `quest_wis_01` | `d7505ff` | **13:29** |
| Waves 1a–1v — 22 hand-migrated arcs | `24becb6` … `cdc788f` | 06-28 14:32 → 06-29 08:29 |
| **Wave 2a — "stand up bulk migrator"** | `ae4f6de` | 06-29 **08:41** |
| Waves 2b–2l+ — families of 30–235 acts each | `8cf47e9` … | 06-29 08:49 → |

**Twenty-eight minutes from inert runtime to first migrated arc**, and the migration only reached
2,853 quests because Wave 2a stopped following §11 and wrote a codemod
(`src/scripts/uqf-bulk-migrate.js`) instead. The document's own §8 has no such step. Its correctness
argument — *"the adapter provides fallback"* — was replaced by a stronger one it never proposed:
**mechanical transform + golden diff + a Playwright pin per family.**

*A migration plan sized to the content that exists cannot survive the content the migration
enables. §11 was right about what to check and wrong about who checks it.*

### Finding 5 → §DX-02as — four contract rows validate green and do nothing

§9's premise is that `BIT_CONTRACTS` is the authority on what a bit may contain. Four entries
accept a field or a kind that no code path consumes:

| Surface | Contract says | Reality |
|---|---|---|
| `skill_check.adv` | optional | `_rollSkill(stat)@22242` never reads `bit.adv`; **0** authored uses. Advantage is unreachable through UQF. |
| `narrative.template` | optional | `narrative(bit, ctx) { if (!bit.msg) return;@22301` — a `template`-only bit is a **silent no-op**; `renderNamedTemplate` never shipped; **0** authored uses |
| `unlock.npcs` | optional, and it *satisfies* the validator on its own | `unlock(bit, ctx) { (bit.quests@22312` ignores it entirely — `{kind:'unlock', npcs:['x']}` validates ✅ and does nothing |
| `item_check` (whole kind) | required `name` | `item_check(bit, ctx) {@22311` writes `ctx._itemCheck`, which **nothing reads**; **0** authored uses — the job went to the completion gate's `items` term |

None is live-broken today, because nothing authors them. All four are **traps for the next author**,
and `unlock.npcs` is the sharpest: it is the one case where the invalid thing passes validation
*because of* the dead field.

### Finding 6 — an engine comment miscounts the population it describes (→ §DX-02as (e))

`function adaptLegacyQuest(id, q) {@22026` carries a comment stating the surviving non-UQF entries
are *"quest_math_01–05 §MATH-01 gap + the 30 dead blq_05–10 book-stubs"* — **35**. Measured: **50**.
The fifteen it omits are `quest_1367_a`–`f` (6), `quest_lxvii67`, `quest_guide_04`,
`quest_scar_01`–`04`, and `quest_void_tide_21/35/42`. Nine of the fifteen are named in Wave 1r/1v
commit messages *as migrated* — `ac9ef23` (`§ARCH-01 Wave 1r: migrate scar arc … → UQF`) and
`cdc788f` (`Wave 1v … lxvii67/guide_04 → UQF`) — so their bits and gates were converted and the
`schema:` stamp was not applied. `advise` flags each one individually
(*"not schema UQF-1.0 — legacy quests have no completion path post-W7d"*), so the population is
visible; only the summary is wrong.

***A migration commit's own comment is a claim about the present as well as the past, and it is the
claim least likely to be re-measured.***

### Finding 7 → §DX-02at — one vocabulary, two hand-maintained copies, already drifted

The report's whole §1 is an argument against a definition living in more than one place. HEAD keeps
the bit vocabulary twice: `const BIT_CONTRACTS = {@21970` in the game (13 kinds) and
`edit.html:const OPERAND_CONTRACTS = {@1413` in the editor (11 kinds), whose own comment
says it *"mirrors the game's BIT_CONTRACTS."*

It no longer does. **Missing: `cost`** — the §VM-01-G4a price leaf, a live opcode with three
authored uses — **and `_legacy_fn`**, with 115. The editor cannot describe the newest mechanic in
the language it exists to edit.

### Finding 8 — `validateQuest` shipped, and shipped somewhere else

> *"The worldbuilder's Quest Editor runs `validateQuest()` before allowing export. Red fields =
> failed contract. Green = valid."* — §9

`validateQuest` has roughly **150 call sites and every one is a test.**
`src/tests/integration/quest-runtime-uqf.test.js` alone calls it ~140 times, including whole-corpus
sweeps (*"if (!validateQuest(q).valid) bad.push(id + ':invalid')"*), and
`uqf-quest-core.test.js:45` proves it works under a bare `require()`.

The authoring path does not call it. `src/js/wbapi-core.js:advise(id)` — the function
`prompt.md` §4 tells every author to run — checks `activateNode`, `waypointNode`, `npc`, the
`schema` stamp, a `skill_check`-without-a-`skill_check`-bit mismatch, and retired
`completeFn`/`completeItems`, then returns `WBAPI.quests.chain(id)`. It never touches
`BIT_CONTRACTS`. **A malformed bit therefore reaches `QUEST_DB` and is caught by the Playwright
suite, not by the tool at the point of authorship.**

This is not scored as a defect. The contract checker became the **regression fence** for 2,803
quests, which is a larger job than the export gate it was specified for, and §DX-02as/§DX-02at
name the two places where wiring it into `advise` would now pay.

### Finding 9 — reachability (instrument 19): the flagship is live

`quest_wis_01`'s `activateNode:'LCY'` occupies cell **18,180** with `STN` and `SEN`, and **`LCY` is
`list[0]`** — the primary, so it can become `currentCode` and the quest activates. Node/cell totals
reproduced exactly: **416 nodes across 244 cells**, matching `npm run stats` and §AUDIT-03x.
`LCY`'s NPC is `Magistra Elara Muffat`, matching the quest's `npc:"magistra_elara_muffat"`. No
§AUDIT-03x casualty in this arc.

---

## 5. The Open Questions register (§13), adjudicated

The report's most valuable section, because it names five things its author knew he did not know.
**Four of five were answered; the answers are better than the proposals in three cases.**

| # | Question | Outcome |
|---|---|---|
| 1 | Named templates vs `choice` bits for multi-state nodes | **Neither.** `template` never shipped; multi-state node surfaces became `NODE_PANELS`/`NODE_HOOKS`/`NODE_VERBS` (§VM-01-G4b–d). `story-wis-vs`'s 5-branch block still renders from `const _wisVsOld = document.getElementById('story-wis-vs')@33450` — the one §1.2 fragmentation the migration never reached |
| 2 | `checkPassFlag` → `flag_write.set` mapping | **Refined:** it became `mission_bit{flag,label}` (a *kept receipt*), not `flag_write`. Usage proves the call: 2,449 `mission_bit` vs 58 `flag_write` |
| 3 | `completeItems` → `gate.items` or a new `item_check` bit? | **Both were built; only the gate term is used.** `completeItems` retired W7d. See Finding 5 |
| 4 | `retryable` at the quest root, not in the bit | **Shipped exactly as proposed.** 0 bits carry it |
| 5 | Compound AND/OR — proposed a `gate.expr` string language | **Rejected in favour of a better shape.** `{all}/{any}/{not}` object composition over ~15 leaf terms, compiled once and memoised by `_gatePred`. A string language would have needed a parser and would not be JSON-diffable — losing Design Goal 4 to solve Goal 3 |

---

## 6. Phase register (§8), outcomes

| Phase | Spec | Outcome |
|---|---|---|
| 0 — Anchors + WBAPI | ✅ claimed complete | **True.** 24 `◆◆◆ WORLDBUILDER:*` anchors live; `edit.html` shipped `2d42ea2`, the same commit that added this report |
| 1 — Schema + inert runtime | *"next session"* | ✅ **`80bc1f4`, 30 days later** |
| 2 — New quests use UQF | 4 named arcs | ✅ **`f5117ca`** (20 min after Phase 1); 1 of 4 named arcs exists |
| 3 — Migrate by arc | *"2–3 sessions"* | ✅ **2 days**, 34+ waves, via a codemod the plan does not contain |
| 4 — Deprecate legacy path | *"`0.legacy`: zero"* | ✅ on the letter (W7d retired `completeFn`, `completeItems`, `_rollCeremonia`'s roll body, the adapter); ⚠️ 46 `activateCond` + 115 `_legacy_fn` closures survive |
| 5 — Canonicalize | `QUEST_DB` sole source of truth | ✅ for behaviour; the `storyRender` display split is real but not total (Open-Q #1) |

**Beyond the spec:** the runtime became a *host-injected kernel*. `createQuestRuntime(host)@22180`
names no global, so `src/js/quest.js` runs under `require()` on the server and in tests, and
`check:questparity` asserts the inlined copy is byte-identical. §6 asked for a layer *"callable
from both the game and edit.html"*; it got one callable from the game, the server, the MUD
harness and the test suite. `execBits` also became a **generator**, which is what made a suspending
`choice` possible at all — a capability §4's `choice` contract implied and §6's straight-line
`for` loop could not have delivered.

---

## 7. Defects filed

| Row | Severity | Summary |
|---|---|---|
| **§DX-02ar** | 🟡 | `WBAPI.quests.chain()` derives dependencies from an `S_story.` regex; 1,624 declaratively-gated quests are invisible, 96.4 % of the corpus returns an empty chain, and the quest **delete guard** passes vacuously as a result |
| **§DX-02as** | 🟢 | Four contract surfaces validate green and do nothing — `skill_check.adv`, `narrative.template`, `unlock.npcs`, the whole `item_check` kind — plus (e) the `adaptLegacyQuest` comment's 35-vs-**50** miscount of the un-migrated set |
| **§DX-02at** | 🟢 | `edit.html:OPERAND_CONTRACTS` mirrors `BIT_CONTRACTS` by hand and has drifted: **`cost` and `_legacy_fn` missing** |

---

## 8. Verdict

**§ARCH-01 is the most consequential document in the corpus and one of the most faithfully
implemented.** Every runtime symbol it named under a name it could not have copied — `QuestRuntime`,
`canActivate`, `execBits`, `resolveSkillCheck`, `HANDLERS`, `SCHEMA_VERSION`, `BIT_CONTRACTS`,
`validateQuest`, `adaptLegacyQuest` — exists at HEAD under exactly that name, 75 days and 13.6×
the content later. Its four design goals hold. Its rejected alternatives were rejected for better
reasons than it gave.

Its errors are all in the same place: **the one section that describes something that already
existed.** §1.1 miscounts the types it is reforming; §5 misquotes the quest it is converting; §6's
two helper names were remembered rather than read. Everything the author was *inventing* is right,
and most of what he was *reporting* is wrong — the inverse of the corpus's usual gradient, and a
sharper form of instrument 12 than the program had yet seen.

> *"The `_legacy_fn` bit kind falls through to the original function — preserving exact behavior
> with zero risk."* — §7

Still true, and still there. 115 times.

---

*§ARCH-01 — Quest API Architecture & Universal Quest Format · verified §DOC-02ag, 2026-08-12*
*Author: World Builder — CodexOfConquest.com*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
