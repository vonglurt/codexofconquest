<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# The Ceremonia Roll: A Skill-Check Quest Type and Its Five-Act Consumer

**Lab Report — IEEE Style · Roll2Hit: The Shattered Codex (`roll2hit-v3.html`)**
**Original date:** 2026-05-26 · **Layer:** §DESIGN-03 · **Classification:** Systems Design / Quest-Type Specification
**Verification pass:** 2026-08-11 (§DOC-02e) — every claim re-measured against HEAD.

> **HISTORY DOCUMENT.** This is the design record as believed on 2026-05-26, not a description of
> the current engine. Claims that did not ship, or that shipped and were later removed, are marked
> **NOT SHIPPED** / **RETIRED** and **kept** — a silently deleted claim reads like one that held.
> Its node codes are the retired 26×16 space; per §AUDIT-03m, `lab-reports/` is HISTORY —
> **annotate, never rewrite**. Treat no code listing below as live source.

---

## Abstract

The report specified a new quest type — `type:'skill_check'`, resolved by a `d20 + abilityMod +
profBonus ≥ DC` roll it named the **Ceremonia Roll** — together with its engine (`_rollCeremonia`),
its retry-gate state, its card renderer, four Birka missions and a five-act Yael Scheidemann arc.

**Verification result: the content survived intact and the container was replaced under it.** Of
**61** named symbols, **50 resolve at HEAD (82%)**; all **9** quests are live; and **every one of the
fifteen Yael prose strings shipped verbatim**, including the Act IV-failed variant. What died is the
*data shape*: §ARCH-01's Universal Quest Format retired all nine flat `check*`/`*Award`/`complete*`
fields in one pass and re-expressed the whole type as a `bits:[{kind:'skill_check', …}]` opcode. The
mechanic then outgrew its spec by three orders of magnitude — **7 skill-check quests specified,
2,453 at HEAD**.

Two findings outrank the census. First, **§7 of this report specified a behaviour the engine still
does not have**: a level earned by *passing* a Ceremonia Roll advances `S_story.level` but never
opens the level-up modal, so the HP roll, the ASI and the fighter feature are silently lost — while
the *failing* path, added later by §XP-01, does it correctly. Second, this report and §DOC-02d's
share a node-code space and **disagree with each other on three of six codes**: `BA` is City Streets
here and the Rough Bar there.

**Keywords:** skill-check quest type, seeded RNG, format migration, design-record verification,
write-only state

---

## I. Method

Four measurements, all from HEAD (`roll2hit-v3.html`, 38,707 lines, r2h-3.104.0, 416 nodes / 2,853
quests):

1. **Symbol census.** Every constant, field, function, quest id, item name, DOM id and CSS class the
   report names, batched through one `grep -c` loop (§DOC-02 accelerator 3). A symbol surviving only
   inside a comment is counted **dead** — the migration notes name every retired field.
2. **Node-code resolution.** All 6 codes tested against live `NODE_MAP` keys, then cross-checked
   against §DOC-02d's table for the same code space.
3. **Mechanism re-read.** Each behavioural claim read at its live definition — the resolver, the
   retry gate, the hcard helper, the card renderer, the level-up queue — never from the report.
4. **History probe.** `git log -S` on every absent symbol, to separate **RETIRED** from
   **NEVER-SHIPPED** (§DOC-02c's instrument).

---

## II. As-Built Inventory — What Survives

| Claim | Status at HEAD | Anchor |
|---|---|---|
| The Ceremonia Roll formula: `d20 + ⌊(score−10)/2⌋ + 2+⌊(level−1)/4⌋ ≥ DC` | **exact, all three terms** | `_rollSkill(stat)@22242` |
| `_rollCeremonia(questId)` | **live as a name** — now a 4-line dispatcher; see delta 2 | `function _rollCeremonia@7024` |
| `_appendStoryHcard(entry)` — a story-only hcard channel that never touches `#hcard-container` | **shipped**, four line-level details inverted (delta 5) | `function _appendStoryHcard@6796` |
| `#story-hcard-container` + `buildCard(entry)` reuse | **exact** — the container exists and `buildCard` is unchanged | `<div id="story-hcard-container">@4814` |
| `_ceremoRetryBlocked(questId)` | **exact**, body identical modulo one inlined local | `function _ceremoRetryBlocked@6806` |
| `S_story.skillCheckAttempts = { questId: { lastDay, failures } }` | **exact shape**, declared in `_S_DEFAULTS()`; `failures` is never read (delta 12) | `skillCheckAttempts: {}@23149` |
| `retryable` + `retryGateDays` (default 1) | **exact**, both read by the live gate | `q.retryGateDays@6811` |
| `activateCond` patch to the activation loop | **exact and still live**, at 2 call sites; 66 quests carry one | `if (q.activateCond && !q.activateCond()) return;@30154` |
| Card label `'ROLL'` for skill-check quests | **exact** — and now the *default* of a five-way typed table | `verb:'Roll Ceremonia'@35583` |
| `btn-talk` on the roll button | **exact** | `cls:'btn-talk'@35582` |
| All 5 `_S_DEFAULTS()` fields: `skillCheckAttempts` · `ceremoniaYaelAct` · `ceremonia_yael_04_failed` · `ceremonia_yael_complete` · `cryptSurveyed` | **all five, under their specified names** | `skillCheckAttempts: {}@23149` … `cryptSurveyed: false@23154` |
| All 9 quests: courier release · crypt survey · watch patrol · pit debut · yael 01–05 | **all live, all UQF-1.0** | `quest_courier_release@21333` … `quest_ceremonia_yael_05@21415` |
| **All 15 Yael prose strings** — 5 vignettes, 5 pass, 5 fail | **verbatim, every one** | `@21368`–`@21424` |
| `vignetteTextAlt` + its selection rule (`ceremonia_yael_04_failed`) | **exact**, and the report's *"selected at render time, not a QUEST_DB field"* note is wrong twice over — it **is** a field, and it is selected at render time | `q.vignetteTextAlt && S_story.ceremonia_yael_04_failed@35571` |
| Yael arc DCs and stats: CHA 10 · WIS 12 · STR 12 · CHA 14 · CHA 15 | **exact, all five** | `@21371`, `@21384`, `@21397`, `@21410`, `@21425` |
| Yael arc XP: 75 · 100 · 100 · 125 · 150 | **exact, all five** | same lines |
| `retryable` per act: true · true · true · **false** · **false** | **exact, all five** | `@21367`–`@21420` |
| Act V's `onPass`: `ceremoniaYaelAct=5` · `_setNpcFavor('yael',3)` · push **Yael's Watch Token** (🪙, `type:'token'`, `sell:0`) with its full `desc` | **exact, all four, including the description string verbatim** | `Yael's Watch Token@21430` |
| Crypt Survey prose — all three strings incl. *"a cleaner hand than Froberger's"* | **verbatim** | `@21344`–`@21346` |
| Patrol route as a three-node ordered visit tracked in `storyCheckQuests` | **shipped**, with the nodes remapped (delta 16) | `§DESIGN-03: Track patrol route@30171` |
| `pitTrainingWins >= 1` completes Pit Debut; its reward message | **exact**, message verbatim: *"🥊 First Blood! +100gp +250 XP — The Pit knows your face now."* | `quest_pit_debut@21355` |

**Live: 50 of 61.**

---

## III. Spec → Shipped Delta Table

Seventeen deltas. Each is **NOT SHIPPED** (never existed), **RETIRED** (shipped, later removed), or
**CHANGED** (survived under an altered contract).

| # | Report claim | Outcome | Measured at HEAD |
|---|---|---|---|
| 1 | **The §1 flat data shape** — `checkAbility` · `checkLabel` · `checkDC` · `checkPassFlag` · `checkFailFlag` · `xpAward` · `goldAward` · top-level `onPass` · `completeItems` | **RETIRED — all nine, in one pass** | §ARCH-01 re-expressed the type as `bits:[{ kind:'skill_check', stat, skill, dc, onPass:[…], onFail:[…] }]`. `checkAbility`/`checkLabel`/`checkDC`/`checkPassFlag`/`checkFailFlag`/`completeItems`/`completeFn` survive **only inside migration comments**; `goldAward` is 0 hits (9 commits — retired, not born dead). The mapping is recorded in-file: *"`checkPassFlag`→`mission_bit{flag}` … `xpAward`→`reward{xp}`"*`@21437`. |
| 2 | **`_rollCeremonia`'s body** — the 6-step guard/compute/hcard/apply/render procedure of §2 | **RETIRED (§ARCH-01 W7d)** | The function is now four lines: dispatch to `_resolveQuestUQF` when `schema==='UQF-1.0'`, else `console.warn` and no-op. Its own comment: *"the legacy roll body … is RETIRED"*`@7028`. The 30 dead `blq_05–blq_10` book-stubs are the only quests that still reach the warn. **The specified procedure survives — line for line — inside `_resolveQuestUQF`**`@6962`, under a different name. |
| 3 | **`d20 = Math.ceil(Math.random() * 20)`** | **CHANGED — and the spec as written is now a banned shape** | `Math.ceil(E.rng() * 20)@22248` — the seeded mulberry32 stream. Invariant #6 (*seeded RNG for game state*) makes the report's line a defect today. It was correct when written; §VM-01-B moved it. |
| 4 | **`total = d20 + mod + prof`** | **CHANGED — two addends added** | `total: d20 + mod + prof + iodineBonus + lmAll`. §CROWN-01 added **Iodine Salt** (+3, or +5 charged), burned by a dedicated button *inside* the roll card and consumed by the roll itself; §DROP-03's lake-magic passives added `allAbility` (`_lakeMagicBonuses@23420`). The three specified terms are untouched. |
| 5 | **`_appendStoryHcard`'s body** — `appendChild` · opacity `1 − (len−1−i)·0.07` · trim `firstChild` · `scrollTop = scrollHeight` | **CHANGED — all four inverted, for one reason** | Shipped as `prepend` · opacity `1 − i·0.07` · trim `lastChild` · `scrollLeft = 0`. The container is a **horizontal, newest-first** row (`flex-direction: row; overflow-x: auto`@2741), not a vertical log. Every line-level difference is the mirror of the spec because the axis changed. The *contract* — a story channel that never touches `#hcard-container`, capped at 30, faded by age — shipped exactly. |
| 6 | **§5's three card states** | **CHANGED — replaced by an accordion (§CEREMO-ACC)** | The card button no longer rolls. Tapping it slides down a panel carrying the vignette, the roll breakdown, a **pass-odds readout** (`~N% to pass`), the Iodine button and a `← Not yet` cancel; the roll is confirmed inside. The specified string survives **verbatim on the confirm button**: `' DC ' + _dc@35648`. |
| 7 | **State 1: `sub` = vignetteText on the card body** | **CHANGED** | `vignetteText` renders inside the accordion (`.ceremonia-vignette`), not as the card's sub-line. The card's `hint` is the specified `<skill> (<+mod>) vs DC <n>` — **exact**. |
| 8 | **State 2: a greyed `btn-rest` button reading `⏳ Retry tomorrow — …`, hint `Next attempt available: Day N`** | **CHANGED** | Blocked renders **no button at all** (`btn: blocked ? null : …`@35600) and the hint compresses to `'⏳ Retry available: Day ' + retryDay`@35597. A disabled button was never shipped; the affordance is simply absent. |
| 9 | **§7 step 1 — XP goes through `S_story.xp` then `_checkLevelUp()`** | **SHIPPED** | The `reward` handler does exactly this: `if (bit.xp) { st.xp = (st.xp \|\| 0) + bit.xp; if (E.checkLevelUp) E.checkLevelUp(); }@22271`, wired at `checkLevelUp: () =>@22348`. |
| 10 | **§7 step 2 — *"If `_levelUpQueue.length > 0`: show level-up modal immediately"*** | **NOT SHIPPED — and it is a live defect** | The pass path never drains the queue. **See §IV.** |
| 11 | **`_updateStorySidebar()`** — named in §7 as the live stat-panel updater | **NOT SHIPPED** | 0 hits, **0 commits ever**. The function is `storyUpdateStatus()`@36053. A name written from memory. |
| 12 | **`skillCheckAttempts[id].failures`** — a per-quest failure counter | **CHANGED — write-only** | Incremented at `@6999` and **read by nothing**. `_ceremoRetryBlocked` consults only `lastDay`. Filed under §DX-02n. |
| 13 | **`storyRenderSections()`** — named as the render function the §5 patch lands in | **NOT SHIPPED** | **0 commits ever.** The name survives at HEAD in exactly one place: an HTML comment, `<!-- storyRenderSections() writes .story-section divs here -->`@4278 — a pointer to a function that has never existed. The sections are written by `storyRender`. |
| 14 | **§8's bribe path** — a `'bribe_available'` quest status, a *"Pay 20gp Bribe"* secondary button, an `onFail` callback offering it | **NOT SHIPPED — and the prose still bills for it** | `bribe_available`: 0 hits, **0 commits ever**. `quest_courier_release`'s skill-check bit carries `onFail:[]` — the empty array. But the shipped `failText` restates the price: *"Twenty gold or a writ from the Watch Commander."* **The player is quoted a price the engine cannot accept.** See §V-2. |
| 15 | **Courier Release prose** — the §9/§11 vignette, pass and fail strings | **CHANGED — none of the three survives** | Rewritten around the morning log rather than the pack: *"The guard has noted the courier's name in the morning log…"* / *"Released to local agent. No further inquiry."* The **crypt** quest's three strings, authored in the same section, shipped verbatim — so this was a deliberate rewrite, not drift. |
| 16 | **Patrol route `BA → IN → TA`, flags `patrolBA`/`patrolIN`** | **CHANGED — nodes remapped, flag names left as fossils** | The route is `LHR → TLL → MHQ`@30168-30170 and the hint names them in full. The **flags still carry the dead codes**: `S_story.patrolBA` is set at LHR, `S_story.patrolIN` at TLL. Same class as §DOC-02d's `_lubeckFriends` — a reader who greps `patrolBA` looks for a node that does not exist. |
| 17 | **The five Yael `onPass` callbacks** (`S_story.ceremoniaYaelAct = N`) | **SHIPPED — as `_legacy_fn` closures writing a field nothing reads** | Each act's `onPass` ends in `{ kind:'_legacy_fn', fn:() => { S_story.ceremoniaYaelAct = N } }`. **`ceremoniaYaelAct` has 5 writes, 1 default and 0 readers.** The report predicted this in §10 — it declared the field as one that *"mirrors `quests[q.id]==='done'` state"* — and a mirror is what shipped. Deleting all five closures is a provable no-op that clears 5 of the file's 154 `_legacy_fn` residues. See §V-3. |

### III-A. Node-code resolution — 0 of 6, and a collision with §DOC-02d

| Code | Report says | HEAD says |
|---|---|---|
| `BA` | "City Streets"; the courier guard; Yael Acts I, II, IV, V | → **`LHR`** (City Streets — Birka) |
| `IN` | patrol stop 2 | → **`TLL`** (The First Inn) |
| `TA` | patrol stop 3 | → **`MHQ`** (Birka Tavern) |
| `SL` | the Slums; Yael Act III | → **`BMA`** (Birka Slums) |
| `CP` | the crypt | → **`KRN`** (The Birka Crypt) |
| `CY` | the Pit / Neon Undercity | → **`HKG`** (Neon Undercity) |

None of the six is a live `NODE_MAP` key, so unlike §DOC-02d's `CI` none is *worse* than dead — each
fails cleanly. **The interesting failure is between the two reports.** They were written four days
apart against the same world and they do not agree:

| Code | This report (05-26) | §DOC-02d's report (05-22) | HEAD |
|---|---|---|---|
| `BA` | City Streets | Pachelbel's **rough bar** | `LHR` vs `LLA` — **two different nodes** |
| `TA` / `TV` | tavern = `TA` | tavern = `TV` | both → `MHQ` |
| `CP` / `CR` | crypt = `CP` | crypt = `CR` | both → `KRN` |

Three of six codes are used inconsistently across the pair. The engine resolved it correctly — every
`activateNode` in this arc points at the node the *prose* describes, not the node the *code* names —
which means the codes were never load-bearing here, only misleading. This is §AUDIT-03m's thesis from
the other side: the codes in a design doc are not a namespace, they are shorthand, and shorthand
minted twice is shorthand for nothing. `docs/maps/node-index.md` (`npm run nodes`) is the only place
a node code may be read.

---

## IV. The Level-Up That Never Opens

**§7 step 2 of this report is correct, unimplemented, and the gap is player-visible.**

`_checkLevelUp()` is not a query. It **advances `S_story.level` immediately** and pushes the new level
onto `_levelUpQueue`@25671; every *benefit* of that level — the hit-die roll for max HP, the Ability
Score Improvement at levels 4/6/8/12/14/16/19, the Fighter feature, the level-2/9/17
surge and indomitable charges — is delivered by `_showLevelUpModal`@25615 and its continue handler.
The queue is the only channel between them.

Every `_levelUpQueue` drain in the file:

| Site | Path |
|---|---|
| `@7015` | skill-check **FAIL** — §XP-01 effort XP |
| `@25187` | `_storyEnemyFlees` |
| `@25300` | battle victory overlay |
| `@30080` | `_grantExplorationXp`, deferred |
| `@38442` | victory-overlay return button |
| `@38676` | level-up modal, chaining to the next queued level |

**The skill-check PASS path is not among them.** `_resolveQuestUQF`'s pass branch runs `execBits`,
credits the warrant, and calls `storyRender` — it never checks the queue. So passing a Ceremonia Roll
that crosses an XP threshold raises the player's level number and stops there.

It is worse than deferral. `_grantExplorationXp` — which fires on **any** step onto new ground —
opens with `_levelUpQueue = []`@30078 and then re-runs `_checkLevelUp()`, which returns immediately
because `S_story.level` was already advanced. The pending entry is **discarded, not deferred**: the
level is kept, its rewards are gone.

The asymmetry is the tell. The failing path was written later, by §XP-01, and does it correctly at
`@7015` — reset, check, `if (_levelUpQueue.length > 0) _showLevelUpModal(_levelUpQueue.shift())`.
Three lines, on the branch beside the broken one. **Failing a Ceremonia Roll can open the level-up
modal; passing one cannot.**

Blast radius is the whole quest type, not this arc: **2,453 `skill_check` quests** carry the shape at
HEAD. Filed as §DX-02p.

*Durable lesson: `_checkLevelUp()` reads like a predicate and is a mutator. Any new XP grant must
either drain the queue or hand it to something that will — and the fact that this report specified
that step, and the step was dropped in migration, is the argument for the spec→shipped delta table
being a permanent instrument rather than a one-time audit.*

---

## V. Defects Filed

1. **§DX-02p — a level earned by passing a skill check delivers no level-up.** Full measurement in
   §IV. `_resolveQuestUQF`'s pass branch@6989 needs the same three lines the fail branch already has
   at `@7015`. Affects all **2,453** `skill_check` quests. Mechanical; the fix is a copy of the
   sibling branch, and the regression pin is *"cross a threshold on a pass, assert the modal
   opened"* — a property, not an incident.

2. **§AUDIT-03w — the courier guard quotes a bribe the engine cannot take.** `quest_courier_release`
   ships `onFail:[]` and a `failText` reading *"Twenty gold or a writ from the Watch Commander."
   He turns the log face-down."*@21338 — a stated price with no transaction behind it. §8 of this
   report designed the path in detail (a `'bribe_available'` status, a *"Pay 20gp Bribe"* button);
   **0 commits ever**. This is §AUDIT-03v's class exactly — prose that states a price the engine
   never bills or honours — and it is the second instance found in two increments, which makes it a
   pattern worth a gate rather than two rows. **Small design call:** implement the 20gp bribe as a
   `cost` bit in a `choice` on the fail branch (the opcode grammar has supported this since
   §VM-01-G4a and `refuse` covers the can't-afford case), **or** rewrite `failText` to refuse without
   naming a number. Do not do neither.

3. **§DX-02n (extended) — three more write-only structures, all found in this arc.** The row already
   carries `LOOT_TABLE` and `ebReturnsCompleted`; add:
   - **`S_story.ceremoniaYaelAct`** — 5 writes, 1 default, **0 readers**. Its five writers are
     `_legacy_fn` closures, so removing the field removes five invariant-#4 residues with it.
   - **`S_story.skillCheckAttempts[id].failures`** — incremented on every failed retryable check,
     read by nothing.
   - **`q.xpAward`** — **53 occurrences at HEAD, 33 of them on UQF-1.0 quests, and no reader
     anywhere.** Every live `xpAward` mention outside a quest body is a migration comment; the sole
     code hit is an unrelated battle-local `const xpAward`@25292. This is the undocumented twin of
     `q.reward`, which the engine *does* label — *"`q.reward` is intentionally NOT read — it is a
     dead/display-only field"*@37045. **An author reading `xpAward:200` beside a `reward{xp:200}`
     bit cannot tell which one pays.** The proposed `check:deadconsts` phase should cover quest-entry
     fields, not just top-level consts.

---

## VI. What the Report Got Right

- **The Ceremonia Roll formula, unchanged in 77 days and 2,453 consumers.** `d20 + ⌊(score−10)/2⌋ +
  2+⌊(level−1)/4⌋ ≥ DC` is still exactly what `_rollSkill` computes. Two optional bonuses were added
  on top; not one specified term was altered. The report's most consequential decision was to write
  the 5e formula plainly instead of inventing one.
- **Refusing to gate the main flow on a skill check (§8).** The reasoning — *"DC 10 with CHA 8 = +1
  total; 45% failure rate. A retryable gate here would be annoying rather than meaningful"* — reads
  today as an early, independent derivation of hard invariants #1 and #2 (free movement; mission
  gating is not movement gating), which were not written down for another two months. The arc ships
  as optional parallel content, and every one of the 2,453 quests that inherited the type does too.
- **Retry as a day gate on a quest that stays `'active'`.** §4's collision analysis — a separate
  top-level field, never a new `S_story.quests` status — is the shipped design, verbatim, and it is
  why `skillCheckAttempts` needed no migration when UQF replaced everything around it. The one
  status the report *did* invent, `'bribe_available'`, is the one that never shipped.
- **A story-only hcard channel.** `_appendStoryHcard` exists because the report insisted the roll not
  contaminate the battle log. It now serves the Void saves, the STR/CHA node checks and every typed
  UQF resolver — five callers this report never imagined, all reusing the separation it drew.
- **Fifteen prose strings, verbatim, across 77 days and a total format migration.** The Yael arc's
  text moved through §ARCH-01's rewrite of every field around it without losing a comma, including
  `vignetteTextAlt` — a branch the report specified for a *failure* state, which is the kind of
  content that normally dies first in a migration. The arc's thesis, that a five-act relationship can
  be carried entirely by d20 rolls against a guard who does not look up, is intact and playable.

---

## VII. Scope Note

Retained as the design record for the quest type with the **largest consumer base in the game**. Its
value at HEAD is threefold: it is the origin of the roll every one of 2,453 skill-check quests
executes; it is the §DOC-02 corpus's clearest case of **content outliving container** — 100% of its
prose and 0% of its field names survive, the exact inverse of §DOC-02b's finding that the half of a
document pointing at code is the half that is right; and its §7 is the first instance in the program
of a lab report **specifying a behaviour correctly that the shipped engine still lacks**. Where
§DOC-02d found a report that contradicted itself about people, this one is internally consistent and
contradicts its *sibling* — and the collision on `BA` is why a node code in prose is now a citation,
not an identifier.

---

## References

[1] §ARCH-01 — Universal Quest Format 1.0. Retired all nine flat fields of §1 (Waves 1j–1m, 7c, 7d,
    8a) and moved the §2 procedure into `_resolveQuestUQF` under `QuestRuntime`.
[2] §VM-01-B — moved `_rollSkill`'s d20 onto the seeded stream; the reason delta 3 is a banned shape.
[3] §VM-01-G4a — the `cost` opcode and the host end of `choice`; the grammar §V-2's bribe path needs.
[4] §XP-01 — effort XP on a failed check. Added the correct level-up drain to the branch beside the
    defective one (§IV).
[5] §CROWN-01 Amendment A / §CEREMO-ACC — Iodine Salt and the roll-card accordion; deltas 4 and 6.
[6] §DOC-02d (`lab-report-birka-beginner-arc.md`) — the sibling report. Source of the `BA`/`TA`/`CP`
    collision in §III-A and of the `_lubeckFriends` fossil-name class that delta 16 repeats.
[7] §AUDIT-03m / §AUDIT-03l — legacy node codes in doc prose; `docs/maps/node-index.md` as the only
    live code reference.
[8] §DX-02n — write-only structures; extended by §V-3.
[9] §AUDIT-03v — Brynn's free room. The same prose-states-a-price defect §V-2 found in the courier
    quest four days earlier in report time.

---

## Appendix A — Kept, NOT SHIPPED (verbatim 2026-05-26 record)

Retained because a deleted claim reads like one that held. None of the following exists at HEAD.

- **The bribe path.** *"Player can roll CHA DC 10 to recover the map + 50gp (Pass) or pay 20gp bribe
  (Fail) … If `S_story.gold >= 20`, player can take the bribe path for the map minus 20gp."* — with
  the `'bribe_available'` status and the *"Pay 20gp Bribe"* secondary button.
- **`_updateStorySidebar()`** and **`storyRenderSections()`** — two function names, zero commits
  between them. The second still has a comment in the HTML pointing at it.
- **The disabled retry button.** *"`btn-rest` (greyed out / disabled appearance)"*, hint *"Next
  attempt available: Day N"*.
- **The immediate level-up modal on a passing roll** (§7 step 2) — specified, never built, and the
  subject of §IV.
- **Courier Release's original prose.** *"The guard has the courier's pack. The body is unclaimed —
  no next of kin on record. He is not required to release the effects, but he is bored, and you are
  standing here. The bloodstained map is folded inside."* / *"He pushes the pack across. 'Sign
  here.'"* / *"'Come back with twenty gold or a writ.' He means it."*
- **`goldAward: 50`** on the courier quest as a flat field (the 50gp itself ships, as a `reward` bit).
- **§1's "incompatible fields" claim.** *"`waypointNode` — not used (Ceremonia Rolls have no
  navigation target)"*: **4 `skill_check` quests carry a `waypointNode` at HEAD** (`quest_guide_04`,
  `quest_scar_01/02/03`). `killGoals` / `targetMonsterKeys` on a skill-check: still 0, as specified.

---

*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
