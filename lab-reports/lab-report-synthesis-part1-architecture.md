<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report Synthesis — Part 1: Architecture & Systems

**Original:** 2026-06-16 · cross-reference of 12 Architecture & Systems lab reports against `roll2hit-v3.html`
**Verified:** 2026-08-13 (§DOC-02bb) · reference commit `89fa13b` (2026-06-16 12:20:47, 33,721 lines) · HEAD 38,712 lines
**Verdict:** the citations hold; the roll-ups do not. Every figure this document **measured or transcribed** is exact. Every figure it **totalled, rounded, or borrowed** is wrong.

---

## Abstract

This document was written to answer one question a solo author of a 38,712-line single-file game cannot answer from memory: *which of the things we wrote down about this architecture are still true?* It read twelve architecture lab reports beside the live HTML and gave each a three-part verdict — what the report said, what the code looks like now, what still applies.

Re-measured 58 days later, it splits cleanly along one seam. Its twenty `symbol@line` citations are **20 of 20 line-exact**; its file baseline (33,721 lines), its `// → doc:` census (94), its `completeFn` count (166), its `activateCond` arrow-function count (1,731), its `QUEST_HOOKS` count (91) and its ten-case dispatch listing are all exact at the reference commit. Its **summary sentences** are where it fails: *nine* anchored data sections when the file had **twelve**, *1,695+* quests when `QUEST_DB` held **2,834**, *pure data* for an object containing **1,897 arrow functions it had itself just counted**, and an eight-item Mission Bit taxonomy whose **cardinality is exactly right and whose eight names have never existed** — not in the source report, not in the HTML, not once in the file's entire history.

The architecture it certifies as "structurally true right now" was true for **three hours and sixteen minutes**. `QUEST_EFFECTS`, `QUEST_HOOKS` and `applyQuestEffects` occur **0 times at HEAD**. The predictions it filed almost as afterthoughts, by contrast, all came in: two migrations it called "future" were delivered in full, one audit it called overdue is still overdue at 175× the scope it named, and one contract it called a contract has not moved a single byte in two months.

---

## 1. Intent, inspiration, and what it buys the player

**The intent.** roll2hit.com is one static HTML file with no build step, no modules, and no framework. That constraint is not a limitation the project tolerates; it is the design. But it has a cost: there is no compiler, no import graph, and no type checker to tell an author which parts of a 38,712-line file still mean what the docs say they mean. The documentation corpus *is* the type system, and like any type system it goes stale silently. This synthesis was the corpus's first attempt to type-check itself.

**The inspiration** is stated plainly in the source it draws from: *specification gravity*. A set of interlocking documents that exert coherent pressure on implementation decisions, so that a feature added in month three cannot quietly contradict a decision made in month one. A cross-reference is the instrument that measures whether the gravity is still holding.

**Why a player cares.** Nothing in this document renders on screen, and it would be dishonest to pretend otherwise. Its contribution to playability is structural, and it is real:

- **The two-engine split is why the game can be balanced at all.** Battle Mode (`S`, reset every refresh) and Story Mode (`S_story`, persisted) share the dice library — `roll(` 18 sites, `resolveAdv` 8 — and never merge state. A designer can retune a monster's damage die without any risk of corrupting a save, because the two engines meet at exactly two documented seams. Both are unchanged in structure since the report.
- **The anchor contract is why 2,853 quests exist.** Twelve `WORLDBUILDER:*:START/END` comment pairs let the WBAPI find and rewrite a data section in a five-megabyte file without a parser for the rest of it. Every quest, node, monster and NPC authored since is authored through that seam. Hand-editing at this scale is not slower — it is impossible.
- **The Cooperative DM Principle is the part a player actually feels**, and it is the oldest claim in the document: enemies must always be beatable, death must always be recoverable. All three of its named mechanisms are live and player-reachable at HEAD — `const _D100_TABLE@24516` (loot that always gives *something*), `void_mercy_count--@36366` (the void's one free pass), and `function storyRespawnFromCheckpoint@23922`, wired to the game-over button. Two months, five thousand lines, and a total quest-format migration later, the promise the game makes to a losing player is byte-for-byte the promise it made in May.

The finding in §6 is the counterweight: on the day this document certified the quest architecture sound, **36 quests across nine chains and twelve nodes could not advance**, for a reason the document itself describes in the abstract one page earlier.

---

## 2. Method

Nine instruments, in the order they mattered.

1. **Date it.** `git log --diff-filter=A` for the report; the nearest preceding HTML commit is the reference. HEAD cannot adjudicate a claim about 2026-06-16.
2. **Read the sources as they were.** Seven of the twelve source reports have since been rewritten by this same verification program. Comparing this document against their *current* text produces false findings; it was checked against `git show 7d3615a:<source>` throughout. This caught two would-be errors that were not errors.
3. **Resolve every `symbol@line`** against the reference snapshot, not by search.
4. **Re-derive every total with `grep -c` against the file** — never by counting the document's own table rows. This is where it broke.
5. **Separate transcribed from composed.** A number lifted from a source report and a number summed by the author have different error rates.
6. **Run the delta both ways.** A specification absent from HEAD may be report-rot or engine-rot.
7. **`git log -S` on every dead symbol** — retired and never-shipped are different verdicts.
8. **Execute the suspect shape.** §6's failure was confirmed by running it, not by reading it.
9. **Check the predictions.** A document that says "this will drift" is making a falsifiable claim.

---

## 3. Dating — a nineteen-second birth and a three-hour architecture

| Event | Commit | Time | Δ |
|---|---|---|---|
| Reference HTML state | `89fa13b` | 12:20:47 | — |
| Report file mtime | — | 13:15:16 | +54 m 29 s |
| Report committed | `7d3615a` | 13:15:35 | **+19 s** |
| Subject architecture destroyed | `120d617` | 16:31:20 | **+3 h 15 m 45 s** |

Nineteen seconds is the tightest mtime→birth window in the verification program. The reference state is unambiguous: `7d3615a` is a docs-only commit, so the HTML the author read is `89fa13b` byte for byte — **33,721 lines, matching the report's stated baseline exactly.**

`120d617` is the same 22-bullet feature commit that erased §DATA-01 three and a quarter hours later, and its message names none of what it deleted. That is not this document's failure — it is the reason this document exists. The lesson generalises past the accident: *a synthesis is a photograph, and its shutter speed is the interval before the next commit.* Scored against HEAD alone, this report reads as broken. Scored against the file it was actually looking at, it was right about nearly everything it looked at.

---

## 4. What held — the citations

**20 of 20 `symbol@line` citations line-exact** at `89fa13b`; all six anchor line-ranges byte-exact.

| Claim | Line | Result |
|---|---|---|
| `const S = {` | 4,720 | ✅ exact |
| `const _S_DEFAULTS = () => ({` | 21,157 | ✅ exact |
| `storyAutoSave()` | 21,800 | ✅ exact |
| `storyLoadSave(key)` | 21,808 | ✅ exact |
| `storyRender(node, prefix)` | 27,668 | ✅ exact |
| `cellMove(dir)` | 26,002 | ✅ exact |
| `storyCheckQuests()` | 26,291 | ✅ exact |
| `const SCHEMA_VERSION = 'UQF-1.0'` | 20,474 | ✅ exact |
| `const QuestRuntime = {` | 20,476 | ✅ exact |
| `const QUEST_EFFECTS = {` | 19,837 | ✅ exact |
| `const QUEST_HOOKS = {` | 20,141 | ✅ exact |
| `function applyQuestEffects(effs)` | 19,819 | ✅ exact |
| `NODE_MAP` anchors | 7,654–8,613 | ✅ exact |
| `QUEST_DB` anchors | 9,365–19,816 | ✅ exact |
| `MONSTER_POOL` · `WORLD_DB` · `NODE_COORDS` · `NPC_DIALOGUES` · `BIRKA_NPC` · `D100_TABLE` · `FISH_DB` | 7 ranges | ✅ all exact |

And the counts it took the trouble to measure:

| Census | Claimed | Measured at `89fa13b` | |
|---|---|---|---|
| HTML baseline | 33,721 lines | 33,721 | ✅ |
| `// → doc:` annotations | 94 | 94 | ✅ |
| `completeFn` in `QUEST_DB` | 166 | 166 | ✅ |
| `activateCond` **arrow functions** | 1,731 | 1,731 | ✅ |
| `QUEST_HOOKS` entries | 91 | 91 | ✅ |
| `applyQuestEffects` dispatch cases | 10 | 10 | ✅ |
| `onPass`/`onFail` purged from `QUEST_DB` | 127 | 92 + 35 = 127 | ✅ |
| `QUEST_DB` anchor span | ~10,450 lines | 10,451 | ✅ |
| HTML growth since §API-02 | +16,013 / +91 % | +16,013 / +90.4 % | ✅ |
| `storyMove()` removed | 0 occurrences | 0 | ✅ |
| Lab reports archived | 64 | 64 | ✅ |
| Source reports still on disk | 12 | 12 | ✅ |

The `activateCond` figure deserves its own note, because it is *more* precise than a naive census would be. The field occurs 1,767 times; the report says **1,731 arrow functions**, and 1,731 is exactly the count of `activateCond: () =>`. The author distinguished the function-valued field from the 36 that were not function-valued. What the author did not do was ask *why* 36 of them weren't. That question is §6.

**A conservation law, verified.** The report gives `QUEST_EFFECTS` as "121 declarative entries" — a number matching neither the object's 89 keys nor its 122 descriptors, which reads like an error until you count the arrays: **86 `onPass:` + 35 `onFail:` = 121**, against exactly 121 closures removed from `QUEST_DB`. The migration conserved 1:1. The number is right; only the noun is wrong.

---

## 5. Where it failed — every error is an aggregate

Not one citation is wrong. Not one *total* is right.

**(a) "Nine WORLDBUILDER-anchored data sections."** The file had **twelve**, and 24 anchor comments, at the reference commit. The nine rows the report tabulated are all byte-exact; the three it missed — `MONSTER_DROPS`, `LAKE_MAGIC`, `ITEM_DB` — are the three outside the table it inherited from its source. The total was read off the list instead of off the file.

That the missing one is `MONSTER_DROPS` is not a neutral detail. `MONSTER_DROPS` is nested *inside* `MONSTER_POOL`'s anchors, and that nesting later cost the repo a real bug: `./api.sh post monster` spliced malformed lines into the trophy-drops map while reporting success, and the incident is now CONTRIBUTING Hazard #2. **The section a census cannot see is a fair predictor of the section a write path will land in by mistake.**

**(b) "14 WORLDBUILDER anchor comment pairs."** The source report says *14 anchor **comments*** marking 7 sections — 7 × 2 = 14. Transcribed as "pairs", the figure silently doubles. One noun, 100 % error.

**(c) "`QUEST_DB` (pure data, 1,695+ quests)."** Four words, two errors.

- **1,695+ → 2,834.** Undercounts the game's largest structure by 1,139 quests, 40 %. Traced: `1695` is `index.md`'s own footer at that commit — a footer whose adjacent line-count claim was *~43,736 lines*, contradicting this report's own verified header by 10,015 lines. The author measured the file to get the header and trusted another document to get the quest count.
- **"pure data"** — while `QUEST_DB` held **166 `completeFn` + 1,731 `activateCond` = 1,897 arrow functions**, both counts stated correctly by this same report, one page earlier. The Summary contradicts the body it summarises.

**(d) "64 entries (including this synthesis)."** 64 is correct **excluding** it; the directory held 65, and `index.md` at the same commit says 65. An off-by-one in a parenthetical.

**(e) "`_S_DEFAULTS()` now ~194 fields."** Measured: **187**. Flagged approximate, so scored as a near-miss (+3.7 %); the companion figure "was ~107 at report time" is the source report's and is not re-litigated here.

> **50th instrument — a total read off your own table measures the table, not the world.**
> Distinct from instrument 27 (*a citation carries no evidential weight*): nothing in (a) was borrowed. Nine rows were measured, and all nine were right, and the word "nine" was still wrong, because an enumeration was mistaken for a census. **For every "N Xs" in a document, re-derive N with a `grep -c` against the file — never by counting the document's own rows.**

---

## 6. The taxonomy that was counted correctly and named entirely from memory

The report's account of Report 11 reads:

> *Mission Bit Registry: 8 atomic bit kinds (flag_set, flag_check, item_grant, item_take, xp_award, gold_award, npc_dialog, battle_gate) with typed contracts.*

**The count is exact.** The source report has precisely eight `### Bit:` sections.

**All eight names are fabrications.** Each occurs **0 times** in the source report, **0 times** in the HTML at the reference commit, and **0 times at HEAD** — never authored, in the file's entire history.

The source's actual eight, and what became of them:

| Real kind (source report) | `kind:'…'` at `89fa13b` | at HEAD |
|---|---|---|
| `skill_check` | 0 | **2,623** |
| `reward` | 0 | 151 |
| `narrative` | 0 | 138 |
| `flag_write` | 0 | 58 |
| `unlock` | 0 | 15 |
| `combat` | 0 | 10 |
| `item_remove` | 0 | 8 |
| `choice` | 0 | 2 |
| **8 of 8 shipped** | **0** | **3,005** |

Zero at the reference commit because the schema was designed and not yet instantiated — so a census taken that day could see neither the real names nor the invented ones, and nothing on the page distinguished them.

The report then compounds it, declaring *"the Mission Bit type taxonomy is correct"* and mapping five of its invented names onto `QUEST_EFFECTS` — introducing, in the parenthesis, a ninth name absent from its own list of eight: `mission_bit`. **That ninth is the only one that was real.** It stands at 2,449 instances at HEAD, the engine's second most-used bit kind.

The eight names offered as the taxonomy: zero, forever. The one tossed in as a gloss: 2,449. There is no better illustration of instrument 9 — *the predictor is not whether a passage cites code, but whether the author could copy it.* The eight-item list looks like the most rigorous sentence on the page. It is the only sentence in the document with a 0 % hit rate.

---

## 7. The playability finding — 36 quests, 9 chains, 12 nodes, one duplicate key

The report's account of the WBAPI parser (Report 9) states the hazard exactly right:

> *`removeFns` is why `completeFn` and `activateCond` are not round-trippable through the WBAPI — they survive in the HTML but don't survive a WBAPI read-write cycle unless handled specially.*

At the commit it was measuring, that hazard had already fired **36 times**, and the report did not look. Those are the 36 `activateCond` fields §4 noted as not function-valued.

**The shape.** Thirty-six `QUEST_DB` entries carry `activateCond` **twice** — the authored arrow function, then a re-serialised string copy:

```js
ath_c1a2: { id:"ath_c1a2", …, activateCond:() => !!S_story.athC1A1Done,
            activateCond:"() => !!S_story.athC1A1Done" },
```

In a JavaScript object literal the last key wins, so the effective value is a **string**. The write-back appended where it should have replaced.

**The consequence.** The activation site at line 26,297 reads `if (q.activateCond && !q.activateCond()) return;`. A string is truthy, so the guard passes and the call throws. Confirmed by execution rather than inspection:

```
typeof effective activateCond : string
truthy?                       : true
THROWN: TypeError: x.activateCond is not a function
```

It throws inside a bare `Object.values(QUEST_DB).forEach(…)` with no `try`, so the exception escapes the callback and **aborts `storyCheckQuests` for that node entirely** — not just the one quest. Everything downstream in the same call, including the completion loop, never runs.

**The blast radius.** All 36 are continuation steps (`a2`–`a5`) of nine archive chains — `ath_` ×4, `zth_` ×4, `cid_` ×28 across seven sub-chains — reachable at **twelve nodes**: `IDC` · `SKN` · `WM` · `ITH` · `PHC` · `BGZ` · `TOL` · `CDN` · `VLC` · `CON` · `NUE` · `VEN`. The openers carry no `activateCond`, so **every chain could be started and none could advance**, and at those twelve nodes no quest activated or completed at all. Nine arcs, visibly begun, silently sealed — which is precisely why it survived: a chain that opens and stops reads as unwritten content, not as a crash.

**Status: RESOLVED, and not by anyone who read this report.** `activateCond:"` is **0 at HEAD**; the §ARCH-01 UQF migration rewrote the field out of existence. `check:dupkeys` shipped 2026-07-28 (`fc40bd4`, §AUDIT-03a) as `check:walk` gate #11 and would now catch the shape on sight — six weeks after the casualties were already gone. Filed here as history, not as an open row.

---

## 8. The predictions — the half of the document that aged best

Four forward-looking claims, all falsifiable, checked at HEAD.

| Prediction | Outcome |
|---|---|
| *"A future WBAPI-02 could convert `completeFn`/`activateCond` to declarative predicates"* | ✅ **Delivered** by §ARCH-01 UQF. `completeFn:` 166 → **3**; `activateCond:` 1,767 → **46**. 98 % / 97 % converted. |
| *"`QuestRuntime.adaptLegacyQuest()` remains the bridge… Phase 3–5 is the next architecture milestone"* | ✅ **Delivered.** `QuestRuntime` 1 → 21 occurrences; the "stub" is now the sole execution surface (`const QuestRuntime@22341`). |
| *"WORLDBUILDER anchor pairs are a contract"* | ✅ **Held perfectly.** 24 comments / 12 sections at the reference commit; **byte-identical at HEAD** two months and 4,991 lines later. Not one collection was added without its anchor. |
| *"An §API-03 review of `combat.md`'s function reference would find all entries stale"* · *"SP5 is overdue"* | ⚠️ **Correct, unactioned, and 175× larger than described** → §DX-02bv. Zero commits mention SP5 or §API-03. |

That last row is the report's best call, and it undersold it. It named one table in one document. Measured repo-wide, **six maintained home docs carry `| Function | Line |` tables totalling 175 line-numbered rows**:

| Document | Rows | Exact | Stale | Unresolvable |
|---|---|---|---|---|
| `docs/spec/combat.md` | 55 | 0 | 52 | 3 |
| `world.md` | 29 | 0 | 29 | 0 |
| `docs/mechanics/mechanics-economy.md` | 29 | 0 | 29 | 0 |
| `story.md` | 27 | 0 | 22 | 5 |
| `mechanics.md` | 26 | 0 | 26 | 0 |
| `monsters.md` | 9 | 0 | 9 | 0 |
| **Total** | **175** | **0** | **167** | **8** |

**A 0 % hit rate.** Sampled drift on `docs/spec/combat.md` runs +934 to +1,284 lines; every claimed line now lands inside `MONSTER_POOL` data rather than the function it names.

The sting is that the repo built a gate for exactly this. `check:anchors` walks all six files — `scripts/resolve-anchors.js:const DOC_ROOTS@43` covers `.`, `docs` and `lab-reports` — and reports 2,721 anchors across 59 docs with **0 dead**. It cannot see a single one of the 175 rows, because `scripts/resolve-anchors.js:const ANCHOR_RE@48` matches only `` `symbol@line` `` inside backticks. The two-column table form is not stale to the gate; it is invisible. *Both statements are true at once: zero dead anchors, and 167 stale line references, in the same files, on the same run.*

---

## 9. What still applies

- **The one-file, one-scope model is permanent**, and every pattern that looks unusual is downstream of it. Unchanged.
- **The two-engine split** (`S` / `S_story`, shared dice, never-merged state) governs the codebase. Unchanged in structure at 38,712 lines.
- **`_S_DEFAULTS()` is the canonical new-game/NG+ reset** — `const _S_DEFAULTS@23062`, 187 → 193 fields. Still the single source of truth for save initialisation.
- **The anchor pair is a contract.** If you add a top-level data collection, add the pair. Two months of perfect compliance is evidence it works.
- **Never `JSON.parse` a JS object literal from the HTML.** Unquoted keys, trailing commas, arrow functions. `extractObj` + `removeFns` + comment-aware brace counting, all live in `js/wbapi-core.js`.
- **`removeFns` is a data-loss boundary, not a formatting detail.** §7 is what it costs when the round trip is assumed rather than tested — and the standing acceptance test for any write path remains: *save, re-parse, assert the change survived.*
- **The two-way sync rule** — every doc item traces to the HTML, every HTML constant has a home doc — is the invariant. `// → doc:` 94 → 93 at HEAD.
- **Do not hardcode live totals in prose.** `1,695+` is what that habit costs, and it is why `npm run stats` exists.

---

## 10. Delta table

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| 1 | 20 `symbol@line` citations | ✅ **20/20 exact** | resolved at `89fa13b` |
| 2 | HTML baseline 33,721 lines | ✅ exact | `git show 89fa13b` |
| 3 | 9 anchor line-ranges | ✅ 9/9 byte-exact | — |
| 4 | 94 `// → doc:` annotations | ✅ exact | 93 at HEAD |
| 5 | 166 `completeFn` | ✅ exact | 3 at HEAD |
| 6 | 1,731 `activateCond` arrow fns | ✅ exact | of 1,767 occurrences |
| 7 | 91 `QUEST_HOOKS` | ✅ exact | — |
| 8 | 10-case `applyQuestEffects` | ✅ exact | all ten labels verified |
| 9 | 127 `onPass`/`onFail` purged | ✅ exact | 92 + 35 |
| 10 | `QUEST_EFFECTS` "121 entries" | ⚠️ **right number, wrong noun** | 121 arrays / 89 keys / 122 descriptors |
| 11 | "Nine anchored data sections" | ❌ **twelve** | 24 comments; missed `MONSTER_DROPS`, `LAKE_MAGIC`, `ITEM_DB` |
| 12 | "14 anchor comment **pairs**" | ❌ **14 comments, 7 sections** | source says comments |
| 13 | "1,695+ quests" | ❌ **2,834** | −40 %; borrowed from `index.md` |
| 14 | "`QUEST_DB` (pure data)" | ❌ **1,897 arrow functions** | contradicts rows 5–6 |
| 15 | "8 bit kinds (flag_set, …)" | ❌ **count exact, 0 of 8 names ever existed** | real 8 shipped, 3,005 instances |
| 16 | "64 entries (incl. this synthesis)" | ⚠️ **64 excluding, 65 including** | `index.md` says 65 |
| 17 | `_S_DEFAULTS` "~194 fields" | ⚠️ **187** | +3.7 %, flagged approximate |
| 18 | 3-layer quest architecture "structurally true right now" | ❌ **0 at HEAD** | `QUEST_EFFECTS`/`QUEST_HOOKS`/`applyQuestEffects` all 0; lifetime 3 h 16 m |
| 19 | Cooperative DM mechanisms | ✅ **3/3 live and reachable** | `_D100_TABLE`, `void_mercy_count`, checkpoint respawn |
| 20 | 36 `activateCond` non-functions | ❌ **NOT MEASURED** — 12 nodes' quest processing dead | §7; resolved at HEAD |
| 21 | "future WBAPI-02 / §DATA-02" | ✅ **delivered** | 98 % / 97 % converted |
| 22 | anchor contract | ✅ **held byte-identical** | 24/12 then and now |
| 23 | "§API-03 would find all entries stale" · SP5 | ⚠️ **correct, unactioned, 175 rows** | → §DX-02bv |
| 24 | *"Reports are in `lab-reports/`, untouched"* | ⚠️ **no longer true** | 3 of 12 moved to `archive/`; 7 of 12 rewritten by §DOC-02 |

---

## 11. Defects filed

**§DX-02bv 🟡 — 175 line-numbered doc rows that `check:anchors` is structurally unable to see.**
Six maintained home docs carry `| Function | Line |` tables: 175 rows, **0 exact, 167 stale, 8 unresolvable**. `scripts/resolve-anchors.js:const DOC_ROOTS@43` already walks every one of those files and `check:anchors` passes clean, because `scripts/resolve-anchors.js:const ANCHOR_RE@48` only recognises `` `symbol@line` `` inside backticks. Fix is mechanical and needs no design call: convert the `| Line |` column to the anchor form, then `npm run anchors:fix`. Sub-item: `index.md`'s footer hardcodes four live totals, two already drifted (37,950 vs 38,712 lines; ~2,848 vs 2,853 quests) — the exact habit that produced delta #13, and `npm run stats` is the replacement.

This row is the report's own §API-03 prediction, confirmed and scoped. It is filed under §DX-02 rather than as a new §API row because the defect is not the drift — drift in a line number is inevitable — but the **gate blind spot** that lets 167 of them pass green.

---

## 12. Conclusion

Twelve reports, three verdicts each, and the document splits along a seam its author could not have seen from inside it: **everything it read is right, and everything it added up is wrong.** Twenty citations, twenty hits. Six totals, six misses. The eight-item taxonomy — the single most rigorous-looking sentence on the page — has a hit rate of zero, while the ninth name, thrown into a parenthesis as a gloss, went on to become the engine's second most-used identifier.

It is worth being fair about what that means. A cross-reference is not a census, and this one never claimed to be; its job was to say *which of these twelve documents can I still trust*, and on that question it was right twenty times out of twenty. Its failure is narrower and more interesting: **it counted its own table and called the result a measurement.**

The predictions redeem it. Every "someone should" it filed almost in passing was correct — two migrations arrived in full under the names its sources specified, one contract has not moved a byte, and one audit is still owed at 175 times the scope it named. A document that is unreliable about the present and accurate about the future is a strange artifact, but not a useless one. It knew what was fragile. It was simply wrong about what was there.

And under all of it, the promise the architecture was built to keep is intact: loot still always gives something, the void still grants its one mercy, and the game-over button still puts you back on your feet. The scaffolding was rebuilt twice. The floor held.

---

*§DOC-02bb · verified against `89fa13b` (33,721 lines) and HEAD (38,712 lines) · 2026-08-13*
*Synthesis Part 1 of 7 · Next: Part 2 — Combat & Mechanics*
