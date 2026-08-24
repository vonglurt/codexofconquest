<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report: §CROWN-01 — The Three Crowns of the Swamp

**Designation:** CROWN-01 · Layer 105
**Filed:** 2026-05-28 · **Amendment A:** 2026-05-28
**Shipped:** `00fe35c` (arc) · `c0c952b` (Amendment A), both 2026-05-28
**Verified against HEAD:** 2026-08-11 (§DOC-02h)
**Classification:** Quest arc · node chain · two new meters

---

## Abstract

A nine-node chain in the deep swamp. Three Crones — Whisper (withholding), Glut
(smothering), Wane (draining) — each hold a Crown domain with a six-quest sequence;
an inn sits at the centre and an altar closes the arc. Two numeric meters run in
parallel: **Crone Marks** (one per Crown skill check passed, converted once at the
close) and **Kindness** (one per genuine act, never decrementing, three thresholds).
Amendment A adds the monster layer — a gate trial, three failure dispatches, four
hag commissions, a three-step iodine crafting track, and an arc boss.

**Verification result.** The arc shipped with near-total fidelity: **all 34 specified
quests live, all 23 monster statlines exact, every meter helper byte-identical, all quest
prose byte-identical, and every one of the nine node records exact in `num`, `label`,
`act`, terrain, battle and sleep cost.** Amendment A shipped in full function under
**different identifiers** than §A.4/§A.6/§A.8 name — those names have **zero commits
in the file's entire history**.

**The one failure is not the arc's and is total.** §II specified nine distinct grid
cells and argued the spacing cell-by-cell against four named neighbours. The archive
confirms all nine coordinates shipped exactly as specified. The §WALK/§NAV-01 90×360
migration then collapsed eight of the nine onto **one cell** — and under §WALK-1.5's
locale rule only `list[0]` can be arrived at. **Seven of the nine nodes can never
become `currentCode`, so 24 of the arc's 34 quests can never activate, the Crone Mark
conversion can never fire, and the §LXX Atlantean Shore entry quest behind it can
never list.** The report was right about every coordinate; the migration destroyed the
one property those coordinates existed to guarantee.

---

## I. Method

Ten instruments, §DOC-02a–g:

1. Batch census — all 118 named identifiers through one `grep -c` pass before re-reading.
2. Comment check — a symbol surviving only inside a comment counts as **dead**.
3. `git log -S "<symbol>" -- play.html` on every dead name, to separate
   **RETIRED** (shipped, later removed) from **NOT SHIPPED** (never existed).
4. Delta table **both ways** — a specified behaviour absent at HEAD is engine-rot, not
   report-rot, until the archive says otherwise.
5. Archive read — `git show 00fe35c:play.html` for every claim about the past.
6. Evidence weighting — **tables and function bodies are evidence, traces and
   narration are claims** (§DOC-02f, instrument 9).
7. Self-criticism is a claim like any other (§DOC-02g, instrument 10).
8. Corpus check — read against sibling reports, not only against HEAD.

Anchors are `` `symbol@line` `` against `play.html` at HEAD, audited by
`npm run anchors`. Legacy node codes in the prose below are **HISTORY** and are
annotated, never rewritten (`docs/lab-reports/` is a HISTORY class in
`src/scripts/legacy-codes.js`).

---

## II. As-built inventory

### A. Node chain — `NODE_MAP`

All nine live. `num`, `code`, `label`, `act:3`, terrain, battle and sleep fields are
exact against the §II table as originally filed.

| Code | Label | num | Terrain | Battle | Anchor |
|------|-------|-----|---------|--------|--------|
| WG0 | The Deeper Gate | 121 | `hag_swamp` | none | `` `WG0:{ num:121@8556` `` |
| HW1 | Whisper's Crown — The Still Water | 122 | `hag_swamp` | none | — |
| HJ1 | The First Mire | 123 | `hag_swamp` | Will-o'-Wisp ×2 | — |
| HG1 | Glut's Crown — The Feeding Pool | 124 | `hag_swamp` | none | — |
| HJ2 | The Second Mire | 125 | `hag_swamp` | Grave Hag ×2 + Crone Witch | — |
| HN1 | Wane's Crown — The Drained Mire | 126 | `hag_swamp` | none | — |
| HJ3 | The Dark Passage | 127 | `hag_swamp` | Young Black Dragon | — |
| INN | The Innmother's Hall | 128 | `inn` | none · `sleep:true`, `sleepCost:8` | — |
| HCA | The Deeper Clearing | 129 | `hag_swamp` | none | `` `HCA:{ num:129@8588` `` |

`hag_swamp` is used by **exactly these eight nodes and no others** in the file.

### B. State — `_S_DEFAULTS()`

All 13 specified fields shipped under their specified names:
`whisperCrownComplete`, `glutCrownComplete`, `waneCrownComplete`, `innmotherKindness`,
`innmotherNamed`, `freeBookingUnlocked`, `innmotherKeyGiven`, `croneMarks`,
`croneMarksBanked`, `glut_gift_held`, `innDeparted` (retired by §AUDIT-03bk),
`whisperSaintSeen`,
`glutGiftReturned`. Amendment A contributed four more —
`waneStoneDCReduced@23203`, `electricEelOrganHeld`, `atlanteanProcessKnown`,
`iodineBuffActive` — plus one the amendment never named, `iodineBuffBonus`.

### C. Helpers

`` `function _innKindness(n)@23530` `` and `` `function _addCroneMark()@23540` `` are
**byte-identical to §III.F**, including the ≥5 unlock, the storyMsg string, the
Innmother's Key push and the `innmotherKeyGiven` latch. Amendment A added
`` `function _burnIodineSalt(questId)@23545` `` — the §A.5 "burn a dose" sketch,
shipped with a live call site in the Ceremonia modal.

### D. Quests — `QUEST_DB`

All 34 specified quests are live, all `schema:'UQF-1.0'`. Every `desc`, `hint`,
`vignetteText`, `passText`, `failText` and `disposition` I sampled is **byte-identical
to §VI**, across 75 days and the §ARCH-01 format migration. All 18 Crown DCs, all 18
XP awards and all four stat/skill pairings per Crown match the filed spec exactly.

The **verbatim quest-text section (§VI, 490 lines) has been removed from this
report.** It was a transcription of `QUEST_DB`, it verified exact, and `QUEST_DB` is
the single source of truth (§ARCH-01). Reproducing it a second time creates a copy
that can rot; the measurement that it did *not* rot is recorded here instead.

### E. Panels, hooks and the arc close

| Surface | Shipped as | Anchor |
|---------|-----------|--------|
| HG1 first-visit gift | `NODE_PANELS` entry, `once:'glut_gift_held'` | `` `id:'story-hg1-gift'@31454` `` |
| HCA mark conversion | `NODE_PANELS` entry, `once:'croneMarksBanked'` | `` `id:'story-hca-marks'@31463` `` |
| WG0 gate trial | `NODE_HOOKS` block | `` `_wg0Div.id = 'story-wg0-trial'@33073` `` |
| HCA Leviathan | `_nodeHookHcaLeviathan@33090` | — |
| INN free sleep | inline cost override | `` `node.code === 'INN' && S_story.freeBookingUnlocked@36196` `` |

The conversion tiers are exact against §VII: **≥6** WIS +1; **≥10** WIS +1 + Crone
Bead into `S_story.knowledge`; **≥15** WIS +1 + Crone Bead + Crone Staff
(`🪄 sell:250, atkBonus:3, dmgDie:8`).

### F. Monsters

**23 of 23 statlines exact** — every `ac`, `hp` and `tier` in the §A.2 insert list and
the 20-row sea catalog verifies against `MONSTER_POOL` with no error. The seven
Amendment-A fights are synthetic battle codes (`WG0_TRIAL`, `HW1_KELPIE`, `HW1_WITCH`,
`HG1_MUDCRAB`, `HG1_OCTOPUS`, `HN1_SPAWN`, `HN1_DEMON`, `INN_EEL`, `HCA_BOSS`), all
nine classified in `` `src/scripts/check-noderegs.js:WG0_TRIAL:@113` `` and fenced by
`check:noderegs` phase 6.

---

## III. Spec → shipped delta table

| # | §  | Specified | At HEAD | Verdict |
|---|----|-----------|---------|---------|
| 1 | II | Nine distinct cells, `c:3`, rows 15–32, spacing argued against EC/SC/OC/AT/EA | **All 9 shipped exactly** (archive `00fe35c`); at HEAD **eight share `{r:25,c:206}`** and INN shares `{r:22,c:191}` with `KTM` | **ENGINE-ROT** — see §IV |
| 2 | II | Probe-based exits: `_buildNodeExits()` scans d=1..4 and writes N/S/E/W | `_buildNodeExits` = **0 occurrences**; §WALK/§NAV-01 replaced the probe mesh with the geo grid | RETIRED |
| 3 | II | The neighbour codes EC · SC · OC · AT · EA · J3 · J6, and the Crones' home HS | **All 8 resolve in neither registry at HEAD**; all 8 existed at `00fe35c` with the exact coordinates cited | STALE (correct when written) |
| 4 | III.D | Flat quest shape: `checkAbility`/`checkLabel`/`checkDC`/`checkPassFlag`/`checkFailFlag`/`xpAward`/`completeItems`/`onPass` closure | All seven survive **only inside §ARCH-01 migration comments**; re-expressed as `bits:[{kind:'skill_check', stat, skill, dc, onPass, onFail}]` | RETIRED (shape), thesis intact |
| 5 | III.D, IV | Progression gate `activateCond: () => (quests['prev']\|\|'') !== ''` — "attempted, pass or fail both qualify" | Shipped as `gate:{ questsAttempted:[…] }`; the compiler is **`(QS[id] \|\| '') !== ''`**, `` `g.questsAttempted@22061` `` — the same predicate, verbatim | SHIPPED (renamed) |
| 6 | III.E | INN `quoteFn`, five states, name reveal fires once inside the fn | **Byte-identical**, including `"Mère Boudine. Since you'll keep coming back anyway."` | SHIPPED |
| 7 | III.G | HG1 gift block "fires once (guarded by `!S_story.visited['HG1']`)" | The guard **never worked**: `storyCollectLoot` flips `visited[code]` earlier in the same render, so the block was dead from `00fe35c` until §VM-01-G-FU-a repointed it to `!glut_gift_held && !glutGiftReturned`. The engine records this in its own comment above `` `id:'story-hg1-gift'@31454` `` | **WRONG WHEN WRITTEN** — transcription exact, behaviour claim false |
| 8 | III.H | `storyCorridorTravel` hook sets `innDeparted` when `fromCode === 'INN'` | `storyCorridorTravel` = **0 occurrences** (deleted by §CELL-11A), which left `innDeparted` on `quest_inn_05` with no writer for 90 days. §AUDIT-03bk restored the beat as a general host record — `S_story.departedNodes[S_story.currentCode] = true@28365` in `storyMove`, read by `flagsPath:['departedNodes.INN']` — and retired the flag | **SHIPPED §AUDIT-03bk**, writer generalised |
| 9 | VI | `quest_whisper_06` / `quest_wane_06` set the Crown-complete flag when "all 6 resolved" | Both compute `…filter(complete).length >= 5` — a **five**-quest threshold | SHIPPED, threshold differs |
| 10 | VI | `quest_glut_06` sets `glutCrownComplete` | Set **unconditionally** by `onComplete`, not by a count — asymmetric with 9 | SHIPPED, mechanism differs |
| 11 | V | `ARC_CROWNS` / `runArcFrame(arcDef)` abstraction | **0 occurrences, 0 commits ever.** The report states it is not implemented | NOT SHIPPED (correctly self-reported) |
| 12 | A.4 | `quest_whisper_01_fail` · `quest_glut_01_fail` · `quest_wane_02_fail`, "activates if quest_X_0N resolved as **fail**" | Shipped as **`quest_whisper_kelpie` · `quest_glut_mudcrab` · `quest_wane_spawn`**; the three spec ids have **0 commits ever**. All three gate on `questsAttempted` — which fires on **pass or fail** | SHIPPED (renamed); **failure-gating NOT SHIPPED** — see §V.3 |
| 13 | A.6 | `quest_whisper_boss` · `quest_glut_boss` · `quest_wane_boss` · `quest_inn_boss` | Shipped as `quest_whisper_witch` · `quest_glut_octopus` · `quest_wane_demon` · `quest_inn_eel`; the four spec ids have **0 commits ever** | SHIPPED (renamed) |
| 14 | A.6 | Kill flags `seaWitchKilled`, `giantOctopusKilled`, `seaDemonKilled`, `giantEelKilled`; passage flags `glutEastPassageOpen`, `waneLowerPassageOpen`; `wg0TrialComplete`, `kelpieTracked`, `mudcrabReturned`, `seaSpawnCleared`, `swampKelpCount`, `leviathanBossFired`, `leviathanDefeated` | **All 13 have 0 occurrences and 0 commits ever.** Completion is expressed instead as `completion:{ battles:['<SYNTHETIC_CODE>'] }` against `defeatedBattles` | **NOT SHIPPED as named** — the mechanism shipped, the field list is narration |
| 15 | A.6 | `quest_wane_boss` opens a new **HN2 loot node** holding the Atlantean Kelp Scroll | `HN2` = **0 occurrences, 0 commits ever.** The scroll ships as a `reward.knowledge` string on `quest_wane_demon` — no node | NOT SHIPPED (node); reward SHIPPED |
| 16 | A.4 | Sea Spawn kill drops `quest_wane_02`'s DC from 13 to 10 | `waneStoneDCReduced` is **written once and read nowhere** (`set:['waneStoneDCReduced']@11994` → `waneStoneDCReduced: false@23203`, no third site). `quest_wane_02` is `retryable:false`, so there is no retry to discount either way | **NOT SHIPPED** → §DX-02n |
| 17 | A.5 | Iodine Salt +3 / Charged +5 to a skill check, spent before the roll | Live: `` `const iodineBonus = st.iodineBuffActive@22250` `` adds it inside `_rollSkill` and clears it | SHIPPED |
| 18 | A.5 | Marsh Seaweed 🪸 — a second gathered reagent | The item drops (`` `name:'Marsh Seaweed'@7061` ``, 5 monsters) and its `desc` says *"Burns to trace iodine salt at the inn hearth."* **It occurs exactly once in the file. No quest, craft or handler consumes it** | **SHIPPED HALF** → §DX-02n / §AUDIT-03v cluster |
| 19 | A.5 | Swamp Kelp drops from `sea_serpent`, `giant_eel`, `sea_witch` | Shipped for those three **plus** `sea_demon`, `kraken_spawn`, `sea_hag` — and `sea_hag` is in the `hag_swamp` roster, so kelp is obtainable from an ordinary swamp encounter | SHIPPED (expanded) |
| 20 | A.7 | Leviathan iodine burn → "+2 ATK and +3 flat damage for the duration of the fight" | The button consumes the item and sets `iodineBuffActive` (`@33131`); **the only reader is `_rollSkill`.** No combat code reads it. Its own label says *"(+5 ATK this fight)"* | **NOT SHIPPED** → §AUDIT-03v cluster; see §V.2 |
| 21 | A.7 | Leviathan defeat is the precondition for the conversion | Exact: `` `id:'story-hca-marks'@31463` `` requires `defeatedBattles['HCA_BOSS']` | SHIPPED |
| 22 | A.2 | HJ2 battle "Grave Hag × 2 + Crone Witch" | Label only — `battle.key` is `grave_hag`. The Crone Witch exists as **`crones_witch`** (ac:17 hp:143 hard) and is in the `hag_swamp` roster, but is not in this fight | SHIPPED as specified (the report calls `count` display-only) |
| 23 | III.C | INN sleep 8gp, waived by `node.code === 'INN' && freeBookingUnlocked` | Exact, at two sites (preview `@36213` and charge `@36250`) | SHIPPED |

---

## IV. The dominant finding — nine cells became two

§II is the strongest passage in the report. It gives nine coordinates and defends the
spacing against four named collisions: EC at `{r:19,c:2}` would have hijacked two
south probes, SC at `{r:19,c:4}` would have overridden HJ1 from the west, and the
lower chain uses even rows because OC/AT/EA sit at odd rows 23/25/27.

**Every one of those coordinates is exact against `00fe35c`** — the nine chain cells,
EC `{19,2}`, SC `{19,4}`, OC `{23,4}`, AT `{25,6}`, EA `{27,6}`. Nothing in §II was
written from memory.

At HEAD the nine cells are two:

```
25,206  →  HJ2 HCA HJ1 OTP HJ3 DBN MSY HG1 HN1 SDQ HW1 WG0     (12 nodes)
22,191  →  KTM INN                                              (2 nodes)
```

`` `const CELL_GRID = (() => {@9852` `` builds each cell as an **array** in `NODE_MAP`
declaration order, and `` `CELL_GRID[key]?.[0]@9861` `` — the primary — is what the
browser reads. `S_story.currentCode` is assigned at exactly two sites in the file
(`` `S_story.currentCode = destCode@28375` ``, where `destCode = res.destCodes[0]`,
and `` `S_story.currentCode = S_story.checkpointNode@26011` ``), both yielding the
primary. WG0 is first in `NODE_MAP` at `@8556`, so it takes cell `25,206`; INN
precedes KTM, so it takes `22,191`.

**Reachable: WG0 and INN. Unreachable: HW1, HJ1, HG1, HJ2, HN1, HJ3, HCA.**

Consequences, measured:

- `_uqfActivateAtNode@30139` keys on `node.code`. **HW1 carries 8 quests, HG1 8 and
  HN1 8 — 24 of the arc's 34 cannot activate.** The 10 that can are all at INN.
  A 35th `activateNode` sits on HCA and belongs to §LXX (see below).
- The 18-quest Crone Mark supply is entirely at HW1/HG1/HN1, so `croneMarks` cannot
  exceed 0 through the arc's own content.
- HG1's first-visit panel never runs, so **Glut's Gift is never granted** and
  `quest_glut_06` never lists — a second, independent instance of the same outcome
  §VM-01-G-FU-a had already repaired once at the panel level.
- The HCA conversion and the Leviathan hook never render, so **the arc cannot close**.
- `quest_shore_01` — the entry quest of the §LXX Atlantean Shore, `activateNode:'HCA'`
  with `gate:{battles:['HCA_BOSS']}` — **can never list**, stranding the arc's
  declared narrative doorway.
- Two of the three combat nodes (HJ1's Will-o'-Wisps, HJ2's Grave Hags, HJ3's dragon)
  never render their battle.

This is the §AUDIT-03x mechanism, and it is the first case in the §DOC-02 program
where a **complete, finished, correctly-authored arc** is the casualty. It is not
authorship rot: the design argued its geometry cell by cell and shipped it exactly.
A coordinate migration then merged cells that were separate *on purpose*, with no way
to know the separation was load-bearing.

---

## V. Risk register outcome

The report filed no explicit risk register. Three risks are implicit in its design
prose; all three are resolved here.

1. **"One accepted secondary connection: HW1.E finds J3 at d=3 … does not compromise
   arc gating."** Moot — the probe mesh, J3 and the whole junction class are gone
   (`check:invariants` I1/I2 now *fail* on `junction:true`). The concern was real and
   its subject no longer exists.

2. **§A.7's iodine/Leviathan coupling is the report's most confident untested claim,
   and it is the one that failed.** The burn button renders, consumes an Iodine Salt
   or Charged Iodine Salt, and labels itself *"+5 ATK this fight"*. `iodineBuffActive`
   has exactly one reader in 38,000 lines and it is `_rollSkill`. So the player pays a
   crafted item for a combat bonus that does not exist — **and the buff leaks**, since
   nothing at HCA consumes it, so it is silently spent by whatever unrelated skill
   check comes next. (Academic, given §IV: HCA is unreachable. It becomes live the
   moment §AUDIT-03x is resolved.)

3. **§A.4's thesis — "a failed skill check does not strand the player, it redirects
   them" — did not ship.** All three dispatches gate on `questsAttempted`, which the
   compiler defines as *any* non-empty status. A player who **passes** `quest_whisper_01`
   is dispatched after the Kelpie exactly as one who fails. The engine does record the
   distinction — `` `S_story.quests[questId] = 'failed'@7001` `` — but the activation
   grammar has no term that can read it (`questsFailed`, 0 occurrences). This is a
   **grammar gap**, not an authoring slip, and per invariant #4 the fix is a new leaf
   term, never a `_legacy_fn`. → **§DX-02r**.

---

## VI. Defects filed

| Row | Finding |
|-----|---------|
| **§AUDIT-03x** (extended) | The first complete arc measured end-to-end as a non-primary-cell casualty: 7 of 9 nodes unarrivable, 24 of 34 quests unable to activate, the arc close and the §LXX entry both stranded — with archive proof that the nine cells were distinct and deliberately spaced when shipped. |
| **§DX-02n** (two new members) | `waneStoneDCReduced` — 1 writer, 0 readers, and the quest it exists to discount is `retryable:false`. `Marsh Seaweed` — one occurrence in the whole file (its own push), 0 consumers, carrying a `desc` that promises a burn no code performs. |
| **§AUDIT-03v / §AUDIT-03w / §AUDIT-03y(b)** (fourth and fifth instances) | Two more player-facing strings naming a benefit with no bit behind them — and these **widen the proposed detector past gold**: the Leviathan burn button says *"+5 ATK this fight"* with no combat reader, and **charges** for it; Marsh Seaweed's `desc` names a craft that does not exist. |
| **§DX-02r** (NEW) | The activation-gate grammar can express *attempted* and *done* but not *failed*, though `'failed'` is a real written status — so three quests authored as failure consolation activate for everyone. Wants a `questsFailed` leaf beside `` `g.questsAttempted.every@22061` ``. |

---

## VII. What this report proves about design documents

**Instrument 9's gradient holds for a fourth consecutive report, and this one is the
cleanest instance yet.** Everything the author could *copy* is exact: nine node
records, nine grid coordinates, 23 monster statlines, two helper function bodies, five
INN dialogue states, 18 DCs, 18 XP awards, and every line of quest prose — a zero
error rate across roughly 600 transcribed facts. Everything the author *composed* is
where the errors are: §A.8's state-field list (13 of 17 names never existed), §A.4 and
§A.6's quest ids (7 of 7 never existed), §III.G's behaviour claim about a guard that
never worked, and §A.7's combat coupling that has no reader.

**And instrument 4 sharpens it.** Those 20 fabricated identifiers are not stale — they
have **0 commits in the file's entire history**. They were written the way a summary
gets written: from what the author meant, hours after writing the code that meant it.
The features are all there. Only the names are invented, and a name invented in a
design doc is exactly what a later reader greps for.

***The lesson: a report's INVENTORY sections earn trust and its SUMMARY sections do
not, even when the summary is one page later and by the same hand on the same day.
Verify the summary against the body it summarises before trusting either.***

---

*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
