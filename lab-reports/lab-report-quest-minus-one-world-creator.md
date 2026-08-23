<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->

# Lab Report — Layer 49: Quest −1 "The Open Door" + the World Creator Wizard

**IEEE-format post-mortem · verified rewrite**
**Original:** 2026-05-25 · Layer 49 · §XIV · authored against `0a131f5`
**Verified:** 2026-08-12 (§DOC-02ah) against `roll2hit-v3.html` @ `fe74868` — 38,712 lines, 416 nodes, 398 monsters, 111 terrains, 2,853 quests
**Status:** ✅ **SHIPPED AND STILL RENDERING.** 18 of 18 identifiers resolve (100 %). 0 of 2 node codes resolve. Every *mechanical* claim holds; every *quantitative* claim in the shipped text has rotted, and one was wrong the hour it was written.

---

## Abstract

Layer 49 is the game's answer to its own level cap. At Level 20 the Fighter Champion progression is exhausted, so instead of a second congratulation the game opens a panel that tells the player what the file they are playing is made of, hands them three shell commands, and states that Level 21 is undefined *on purpose*. Its companion concept — the World Creator Wizard — was specified as an in-game guided authoring modal and deliberately **not** built.

This rewrite re-measures every claim. The mechanism is intact: the state fields, the New-Game-Plus carry-over, the trigger, the styling and the Entry 42 pairing all survive under their original names across 79 days, a total quest-format migration (§ARCH-01) and a world-coordinate migration (§WALK/§NAV-01). What has failed is the **content of the disclosure itself** — the panel whose entire rhetorical premise is *"here are the exact facts about this file"* now states three facts about the file, of which **one is off by 22,688 lines, one names a file that no longer exists, and one describes a quest schema that was retired in June.** And the wizard the report declined to build shipped anyway, in a medium the document never enumerated.

> *"Level 21 is undefined. That is not a bug. That is the door."* — still verbatim at `` `That is not a bug. That is the door.@31397` ``, 79 days on. The line survived. The numbers around it did not.

---

## I. Verification method

Nine instruments from the §DOC-02 program were applied. Three did the work here:

- **Dating (instrument 18/11).** The report's five File-Reference line citations were resolved against every 2026-05-25 build. **All five land line-exact at `0a131f5` (2026-05-25 13:35:07, 17,631 lines)** — that commit, not HEAD and not the earliest archive, is this report's reference build, and every "currently" claim is scored against it.
- **`git log -S` (instrument 4).** Separates *retired* from *never shipped*. The disclosure block has **exactly one commit in the file's entire history** — `194a810` (2026-05-25 09:10:55, *"css block flex issues"*) — and **has never been edited since**. Whatever it said on day one, it still says.
- **Reachability (instrument 19).** A 100 % symbol census does not prove a surface renders. Checked separately, and here it passes: see §V.

---

## II. Design intent — and what it buys the player

### A. The Level 20 problem

`const XP_LEVELS = [@24418` has twenty entries. `const FIGHTER_FEATURES = {@25504` is keyed 2 → 20. There is no L21 threshold and no `FIGHTER_FEATURES[21]` — verified absent at HEAD. A player at L20 has a live doom clock (Day 49) and a dead reward loop.

The obvious patch — a "You Win" banner — was rejected because the game already has a victory screen: `function storyCheckVictory@28207`, fired at the same node. A second congratulation would compete with the real ending.

### B. Why this is a playability feature and not a developer's aside

Three concrete contributions, all measurable in the shipped file:

1. **It gives the cap a terminal beat that is not a second ending.** The victory screen answers *"did you save the world?"*. Quest −1 answers a different question — *"what is this world made of?"* — so the two never fight for the same moment even though they occupy the same node.
2. **It is diegetic, and that is the load-bearing choice.** The panel renders with `el.className = 'sweelinck-variant';@31602` — the same olive-bordered treatment as Sweelinck's dialogue variants and the Froberger journal. A fourth-wall break styled as a UI element reads as a bug report; styled as a found document it reads as the last page of the journal. That decision is why the layer survives as fiction.
3. **It seeds New Game Plus with content only a completionist can reach.** `priorQuestMinusOne` is the one flag in `_S_DEFAULTS()` that means *"this player has been to the end of the source."* It is the mechanical bridge to Layer 50's Entry 42, and it is the reason the game's final authored beat is the player writing a page rather than reading one.

The layer's actual thesis: **the MIT License is a game mechanic.** Quest −1 opens the door; Entry 42 asks what you found behind it.

---

## III. As-built inventory (verified @ `fe74868`)

| Element | Anchor | Verdict |
|---|---|---|
| Trigger node | `` `TLS:{ num:42, code:'TLS'@8726` `` — *Cosmic Realm — The Convergence*, `act:8` | ✅ same node, renamed from `CO` |
| Panel registration | `` `Layer 49: §XIV Quest -1@31380` `` — a `NODE_PANELS` entry, `nodes:['TLS']` | ✅ migrated by §VM-01-G1 |
| Trigger condition | `` `>= 20 && !st.questMinusOne@31382` `` | ✅ contract preserved |
| Styling | `` `el.className = 'sweelinck-variant';@31602` `` + `css:'border-left-color:#556b2f'` | ✅ verbatim intent |
| Run-once flag | `` `questMinusOne: false@23123` `` | ✅ specified name |
| NG+ carry flag | `` `priorQuestMinusOne: false@23126` `` | ✅ specified name |
| NG+ capture | `` `const savedPriorQuestMinus1@24027` `` | ✅ byte-identical to reference build |
| NG+ restore | `` `S_story.priorQuestMinusOne = savedPriorQuestMinus1@24035` `` | ✅ byte-identical |
| Completion path | `` `S_story.questMinusOne = true; storyAutoSave();@31410` `` — console only | ✅ by design |
| NG+ pairing | `` `quest_ng_02: { id:'quest_ng_02'@11048` `` | ✅ now declarative UQF-1.0 |
| Victory screen | `` `if (!S_story.defeatedBattles['TLS']) return;@28209` `` | ✅ the guard §VII.1 wants, three thousand lines away |

**Census: 18 of 18 named identifiers resolve — 100 %.** That is the program's first clean sweep, though the census is small (the report names 18 symbols, against §DOC-02b's 197). **Node codes: 0 of 2.**

Two mechanical details in the disclosure prose were checked and are **exact**: *"The crit window is 17–20"* matches `` `const critMin = _lv >= 20 ? 17@25027` ``, and *"Indomitable has been yours for eleven levels"* matches `FIGHTER_FEATURES[9] = Indomitable I` (20 − 9 = 11). The author counted.

---

## IV. Spec → shipped delta table (both directions)

| # | Report claim | HEAD | Verdict |
|---|---|---|---|
| 1 | Fires at node **`CO`** | Fires at **`TLS`** | ⚠️ **RENAMED, not moved.** `TLS` is `num:42`, label *Cosmic Realm — The Convergence* — the same node. `CO` is not a `NODE_MAP` key. |
| 2 | `quest_ng_02` activates at **`CI`** | Activates at **`LHR`** | 🔴 **§AUDIT-03m "worse than dead".** `CI` *is* a live key — a **different** node (Chancery Court — The Officer's Pen, `num:429`, `act:NaN`). An existence check passes while the sentence stays wrong. The intended `CI` (City Inn) was remapped to `LHR` by §PLAY-01-D/G. |
| 3 | Trigger is `node.code === 'CO' && …` inline in `storyRender` | `NODE_PANELS` entry with `nodes:['TLS']` + `when:st => …` | ✅ **Contract preserved, expression relocated** by §VM-01-G1. The node test became registry data. |
| 4 | Disclosure states *"exact line count"* | States **16,024**; file is **38,712** | 🔴 See §V. |
| 5 | Disclosure states `MONSTER_POOL` size | States **423**; live **398** | 🔴 See §V — and it was never 423. |
| 6 | Disclosure states `WORLD_DB` size | States **67**; live **111** | 🔴 Exact when written, stale now. |
| 7 | *"QUEST_DB has a completion function for each quest"* | **Zero** quests have one | 🔴 **RETIRED, not never-shipped.** At `0a131f5`, 67 of 76 quests carried `completeFn` — an honest ~88 %. §ARCH-01 replaced all of it with declarative UQF-1.0; `completeFn` and `completionCheck` are both 0× at HEAD. |
| 8 | *"plan.md §XIV describes the World Creator Wizard"* | `plan.md` **does not exist** | 🔴 Deleted by `5e48dd7` (split into `CONTRIBUTING.md` + `BACKLOG.md`). The pointer is in a **player-facing string** at `` `plan.md §XIV describes the World Creator@31407` ``. |
| 9 | Grep recipe `grep -c "key:'"` handed to the player | Returns **565**, meaning nothing | 🔴 §DOC-02i already recorded this recipe unreliable — it mixes items, nodes and monsters. `npm run stats` is the answer. The other two recipes still work. |
| 10 | `sweelinck-variant` styling | Applied by the renderer, not the block | ✅ Survived the migration intact. |
| 11 | State flags `questMinusOne` / `priorQuestMinusOne` | Both live, `@23123` and `@23126` | ✅ **Still exactly three lines apart, 79 days later.** |
| 12 | NG+ preservation, cited at lines 8902–8910 | Same nine lines at `@24027`–`@24035` | ✅ Byte-identical. |
| 13 | Interactive wizard UI **not implemented** | **It shipped** — as `worldbuilder.html` + `./api.sh` | ⚠️ **Delta in the other direction.** See §VI. |
| 14 | Quest −1 called a "quest" | No `QUEST_DB` entry exists | ⚠️ Naming only. It never lists in the journal and never counts toward `vic-quests`. The disclosure's *"To mark this quest complete"* refers to nothing the engine tracks — which the report frames as the point. |

---

## V. The three numbers — measured at four builds

The disclosure's second paragraph is its evidential core. It has one commit in history and has never been touched.

| Literal shipped in the panel | `4090c82` 07:30 | `194a810` 09:10 (birth) | `0a131f5` 13:35 (report ref) | HEAD |
|---|---|---|---|---|
| *"the source file is 16,024 lines"* | **16,024 ✅** | 17,182 | 17,631 | **38,712** |
| *"MONSTER_POOL has 423 entries"* | 382 | 385 | 385 | **398** |
| *"WORLD_DB has 67 terrain entries"* | **67 ✅** | **67 ✅** | **67 ✅** | **111** |

Three separate outcomes from one sentence, and each names a different failure:

1. **The line count was a real measurement that went stale before it shipped.** `4090c82` — *"Layer 44: Ally Cat Arc"* — is **exactly 16,024 lines**. The author measured, then wrote three more layers, then committed at `194a810` **100 minutes later and 1,158 lines heavier.** Nothing was invented; the number was simply never re-taken.
2. **423 matches no build, ever.** `MONSTER_POOL` runs **372 → 382 → 385 → 398** across the whole history and has never held 423. Neither does the unscoped `grep -c "key:'"` recipe the same paragraph recommends (485 at that build, 565 at HEAD). This is instrument 12 in its purest form: the copied number is exact, the illustrated number is fiction.
3. **67 was exact and is now wrong anyway.** Terrains went 67 → 111. Correctness at authoring time buys a hardcoded literal nothing.

The report's own §II-B calls this content *"exact line count, MONSTER_POOL size, WORLD_DB size."* **One of three was exact at its reference build. Zero of three are exact now.** The self-description is a claim like any other (instrument 10), and it is the claim that failed hardest.

> The panel's rhetorical move is: *this file is knowable, here is proof, go read it.* Every number in the proof is now wrong. The invitation still works; the evidence for it does not.

**Reachability (instrument 19): 100 %.** `` `TLS:{r:26,c:181}@9680` `` is the **sole** occupant of its cell, so it is `list[0]` and can become `currentCode` — this arc is untouched by §AUDIT-03x. `_renderNodePanels(node, S_story)` is called unconditionally in `storyRender`, and the panel's `when` has no dead dependency. The disclosure renders exactly as specified.

---

## VI. The World Creator Wizard — the option the document did not enumerate

§III of the original poses a two-way choice and defends the loser:

> *"An interactive wizard inside the game would be fragile (coupling the game's UI to its own source code), whereas the grep commands and plan.md directions are durable and honest about requiring external tools."*

Both legs are now falsified, and by the same evidence:

- **The "fragile" leg.** The wizard shipped. `worldbuilder.html` (2026-07-08) is a browser world editor; `js/wbapi-server.js` + `./api.sh` are the authoring API. Every step §III.A specified has a live endpoint — `./api.sh post monster`, `./api.sh post node`, `./api.sh post quest`, and a verification loop (`./api.sh audit` · `./api.sh advise <id>` · `npm run check:walk`) far stronger than the grep loop it replaced.
- **The "durable" leg.** `plan.md` was deleted, one of the three grep recipes now returns a meaningless number, and the *"markdown files in this directory"* the panel points at have been reorganised into `docs/`.

The escape was a **third option the two-way framing hid**: build the wizard *beside* the game rather than inside it. That keeps the game's UI decoupled — the stated worry — while still shipping the tool. A two-option trade-off table reads as exhaustive precisely when a third option exists (§DOC-02's 22nd instrument), and this is the cleanest instance the corpus has produced, because the third option is now the repo's primary authoring surface.

**Verdict: the design goal shipped and the design document's reasoning did not.** Not report-rot — a live design decision that measurement reverses.

---

## VII. Recommendation register

The report closes with three self-criticisms. Instrument 10 says a post-mortem's apology is a claim to be verified. **All three verify as correct, and all three are still open 79 days later.**

| # | Original recommendation | Status @ HEAD |
|---|---|---|
| 1 | Guard the disclosure on `defeatedBattles['CO']` so it cannot pre-empt the story climax | 🔴 **OPEN, and cheaper than stated.** `TLS` is the final-battle node; `storyCheckVictory` already tests `` `if (!S_story.defeatedBattles['TLS']) return;@28209` ``. Because movement is free (invariant #1), an L20 player can walk to `TLS` and read the developer disclosure before ever fighting the Void Warlord. The fix is one clause copied from a function in the same file. |
| 2 | The grep commands assume the source is on disk; a browser player cannot run them | 🔴 **OPEN.** No view-source surface exists (`grep -c "view-source"` → 0). |
| 3 | Link the repository URL to make *"the markdown files in this directory"* concrete | 🔴 **OPEN.** No `github.com` URL occurs anywhere in the game file. |

Three correct recommendations, zero converted into tracked rows, zero shipped. §DOC-02i's lesson repeats: **a recommendation that does not become a `§`-row is a recommendation that does not happen.** Filing them is part of this increment (§VIII).

---

## VIII. Defects filed

- **§AUDIT-03u (extended)** — the stale-player-facing-literal class. That row already flagged two *"forty-two nodes"* strings and noted the wider class was unmeasured; the Quest −1 disclosure is the measurement. Four literals in one panel: `16,024 lines`, `423 entries`, `67 terrain entries`, and `plan.md §XIV`. Same fix discipline: **describe scale without a literal, or compute it** — a fresh hardcoded 38,712 rots by the next commit.
- **§AUDIT-03ai (NEW, 🟡)** — `quest_ng_02` can activate into a state it cannot leave. The quest gates on `ngPlusRun ≥ 1 && priorQuestMinusOne` and completes on `` `completion:{ flags:['entry42Written'] }@11048` ``. The **only** writer of `entry42Written` is the inline LHR journal surface, which carries an *additional* undeclared condition — `` `const _e42Dear@34638` ``, three of six named NPCs at favour ≥ 2. A qualifying NG+ player below that threshold sees the quest listed, is told *"Visit the City Inn to find the open page,"* arrives, and finds nothing. Gate and completion surface disagree.
- **§DX-02au (NEW, 🟢)** — the three recommendations in §VII, filed as tracked work so they stop being prose.

---

## IX. File references (corrected)

| File | Anchor | Content |
|---|---|---|
| `roll2hit-v3.html` | `` `questMinusOne: false@23123` `` | run-once flag in `_S_DEFAULTS()` |
| `roll2hit-v3.html` | `` `priorQuestMinusOne: false@23126` `` | NG+ carry flag |
| `roll2hit-v3.html` | `` `const savedPriorQuestMinus1@24027` `` | NG+ capture |
| `roll2hit-v3.html` | `` `Layer 49: §XIV Quest -1@31380` `` | the disclosure panel |
| `roll2hit-v3.html` | `` `quest_ng_02: { id:'quest_ng_02'@11048` `` | the Entry 42 pairing |
| `worldbuilder.html` · `js/wbapi-server.js` · `api.sh` | — | the World Creator Wizard, as shipped |
| ~~`plan.md` §XIV~~ | — | **NOT SHIPPED / DELETED** by `5e48dd7`; superseded by `CONTRIBUTING.md` + `BACKLOG.md` |
| `lab-report-ng-plus-remembrance.md` | — | Layer 50 — Entry 42 and `quest_ng_02` |

*Historical note: the original's own citations — lines 8423, 8426, 8902–8910, 14261, 14732 — are **all exact against `0a131f5`** and are preserved here as history. Per §DOC-02 policy, lab-report line numbers are never trusted and never rewritten; the `symbol@line` anchors above are the live pointers.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
