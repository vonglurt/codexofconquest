<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report Synthesis — Part 2: Combat & Mechanics

**Cross-reference of seven Combat & Mechanics lab reports against `roll2hit-v3.html`**

| | |
|---|---|
| **Written** | 2026-06-16 13:36:59 · commit `6be4180` (13:37:20) |
| **Stated baseline** | 33,721 lines — **exact** for `89fa13b`, the last HTML commit before it |
| **Verified** | 2026-08-13 · §DOC-02bc · against `89fa13b` (the file it read) **and** HEAD (38,712 lines) |
| **Source reports** | 7 |
| **Result** | 30 of 32 identifiers resolve · 33 of 37 line citations exact · **one register certifies the opposite of what its own line range contained** |

> **STATUS: HISTORY.** This document is not maintained as a description of the engine. It is kept
> because its *design rules* are still load-bearing and because the pattern of its errors is
> instructive. Per §DOC-02 policy, a claim that did not ship is marked **NOT SHIPPED** or
> **INVERTED** and **kept** — a silently deleted claim reads as one that held.

---

## Abstract

Seven lab reports written between 2026-05-21 and 2026-06-05 specified the combat and mechanics
layer of *The Shattered Codex*: character progression, the Flashbang, condition pricing, the
health/reward economy, the three-channel loot model, Luck as a seventh ability score, the tattoo
and chronicle persistence ledgers, and Kenickie's Black Market. This synthesis read all seven
against the live file and answered, per report, *what was documented · what the code now does ·
what still applies as design knowledge*. Verification 58 days later finds the **inventory
exact and the summaries composed**: every table anchor, every quoted statline and 33 of 37 line
citations land on the byte, while the errors are concentrated in sentences the author wrote in
their own words rather than copied. The sharpest result is Register 4, where the report certifies
`_D100_TABLE` as *"consumables only, no magic weapons"* and cites the exact 22-line range that, in
the file it was reading, held **ten weapon rows, nine of them positive-magic**. The purge it was
describing had been silently reverted eleven days earlier and did not return for another 68 days.

---

## I. Purpose, intent, and method

### I-A. What the original document was for

The seven source reports were written *as* the systems shipped, one per feature, each locking a
data shape before or beside the code. By 2026-06-16 there were 64 of them and no map. This
synthesis is the map: a single page that a future author could read to know **which mechanics are
canonical, which are superseded, and which design constraints must not be broken by the next
feature.** Its own stated method — *"each entry reads the lab report against the live HTML"* — is
exactly the method §DOC-02 now runs on the whole corpus, three months earlier and against a file
one-sixth the size. That is worth saying plainly: **the program verifying this document was this
document's idea.**

### I-B. Verification method (§DOC-02bc)

1. **Date it.** mtime → birth commit → the last HTML commit before it. That tree, not HEAD, is the
   reference for every *"current"* claim (instrument 8).
2. **Census.** Batch every named identifier through one `grep -c` loop at both trees before reading
   a line of prose; `git log -S` every dead one to split **RETIRED** from **NEVER SHIPPED**
   (instrument 4).
3. **Line-check every citation** at the birth tree, not at HEAD.
4. **Read the source reports at the birth commit** (`git show 6be4180:lab-reports/…`) — 6 of the 7
   have since been rewritten by this same program, so HEAD's copies are not what the author read.
5. **Re-derive every "N Xs"** with a counting pass, never from the document's own row count
   (instrument 50).
6. **Close over reachability** — a live symbol on a node no player can stand on is not a feature
   (instrument 19).

---

## II. Provenance — a twenty-one-second birth window

`stat` gives mtime **13:36:59**; the docs-only commit `6be4180` lands at **13:37:20**. **Twenty-one
seconds** — the program's second-tightest window after §DOC-02bb's nineteen, and the two are
siblings written twenty-two minutes apart. The HTML in the tree at that moment is `89fa13b`
(12:20:47), **33,721 lines, matching the report's stated baseline exactly**. Every "current state"
cell below is therefore checkable against a real file, which is not true of most reports in this
corpus.

Two hours fifty-four minutes later, `120d617` *("UI overhaul, gate removal, node-to-node travel,
geo-seed + reweave")* overwrote the tree with a stale working copy — the same commit that destroyed
§DOC-02ba's and §DOC-02bb's subjects. It did not touch the combat layer, which is why this
document aged far better than its two siblings: **its subject survived the afternoon.**

---

## III. Census

| Measure | Result |
|---|---|
| Distinct engine identifiers named | 32 |
| Resolve at HEAD | **30 (94 %)** |
| Line citations | 37 |
| Exact at `89fa13b` | **33 (89 %)** |
| Node codes cited | **0** — uniquely, nothing to rot |
| Quoted code fragments | 6 of 8 byte-exact |
| Aggregate figures ("N Xs") | 4 of 6 exact |

**The two dead identifiers.**

- **`_onStoryVictory()` — 0 commits in the file's entire history.** The victory host is and always
  was `function _storyBattleVictory() {@25280`. This is **inherited, not invented**: §DOC-02v found
  the identical fabrication in this register's own source report. A citation carries no evidential
  weight — copying a wrong name from a cited document reproduces it at full confidence.
- **`baitSatchel`** in the quoted fishing line — the field is `S_story.fishingBaitSatchel`. The rest
  of that line is byte-perfect, which is the tell: the author transcribed the expression and
  shortened the identifier from memory while doing it.

**The four missed line citations**, all in Registers 2 and 7: two point at
`const _S_DEFAULTS = () => ({` — the object's opening line — instead of the field, off by 20
(`knowledge:`) and 44 (`void_mercy_count:`); one names the loot roll where the reward formula is
99 lines earlier; one is off by 7 and honestly hedged with a tilde. **Every citation that names a
top-level declaration is exact.**

---

## IV. The seven registers

Each register below states the **design intent** (why the mechanic exists and what it does for
play), then the measured delta. Rows are scored against `89fa13b` unless marked *(HEAD)*.

---

### Register 1 — Levels, Flashbang, condition pricing
*Source: `lab-report-leveling-flashbang-condition-economy.md` (2026-05-21) · verified separately as §DOC-02t*

**Intent & playability.** Three systems that all defend the same thing: **the round is a
decision, and the decision must stay one decision.** Progression is automatic so the player never
leaves the fiction to shop in a menu; the Flashbang buys a guaranteed hit *inside* the existing
bonus phase rather than adding a new phase; and repricing conditions ×100 turns pre-battle setup
from pocket change into a real strategic spend. The 1.5-action economy — one main action plus one
bonus — is the structural spine every later combat feature had to fit inside, and it is the reason
combat reads as tactical rather than fiddly.

| Claim | Verdict |
|---|---|
| `XP_LEVELS` — 20 levels, 0 → 195,000 | ✅ **exact, and byte-identical at HEAD** (`const XP_LEVELS = [@24418`) |
| *"was 10 levels at report time"* | ⚠️ **UNVERIFIABLE / likely never shipped** — §DOC-02t measured the specified 10-level literal at **0 commits ever**; inherited claim |
| `CONDITION_GOLD` active, annotated `// → doc:` | ✅ exact, comment verbatim |
| *"specific values may have been rebalanced"* | ❌ **hedge, and wrong** — all 12 entries **byte-identical** from the earliest surviving build to HEAD (`const CONDITION_GOLD = {@24618`) |
| *"repriced … to hundreds"*, *"spends 300gp on Blinded/Restrained"* | ❌ live prices are **1,000–5,000gp**; Blinded (Smoke Bomb) is **2,000**, Restrained (Binding Web) **1,500** — the worked example is 5–7× low |
| `CONDITION_ITEMS` — *"11 conditions with name/icon/effect/sell"* | ❌ **12 entries**, fields `match / condition / effect / icon` — **there is no `sell` field**; prices live in the separate `CONDITION_GOLD` two thousand lines away (`const CONDITION_ITEMS = [@22409`) |
| `CONDITION_ADV` active | ✅ exact (`const CONDITION_ADV = {@7283`) |
| Flashbang `{weight:4, _type:'flashbang'}` | ✅ byte-exact then · **weight 6 at HEAD** |
| Flashbang `{name:'Flashbang', cost:150, sell:75}` | ✅ every field exact, then and now |
| `_checkLevelUp()` · `_lu_applyGiftsAndFinish()` | ✅ both exact |
| *"`_lu_applyGiftsAndFinish()` awards HP, gold, shield, tattoo"* | ⚠️ **half right** — it applies gold, the shield gift and the `levelUpLog` row (`function _lu_applyGiftsAndFinish(lvl, hp) {@38488`); **HP is applied by the modal's roll handlers** and the tattoo is written at a different site |
| *"the only guaranteed-ADV consumable"* | ⚠️ **true narrowly** — the Spell Scroll sets the same flag on a DC check, so the Flashbang is the only *unconditional* one; but a purchased condition grants ADV for the **whole battle**, which the same report priced one paragraph earlier |
| *"the 1.5 AP economy is the structural spine"* | ✅ enforced at every consumable (`function _storyUseFlashbang(invIdx) {@24934` guards on `usedMainAttack`/`usedBonusAction`) |

*Note kept from §DOC-02t:* `_playerHasBonusOptions()` tests five inventory conditions and then
returns `true` regardless — closing comment `// wimper always available`. The bonus phase is never
empty, by construction. The engine is more generous than its own predicate suggests.

---

### Register 2 — Health economy, reward formula, Cooperative DM
*Source: `lab-report-drop-rates-balance-and-health.md` (2026-05-21) · verified separately as §DOC-02j*

**Intent & playability.** The reward formula makes **harder enemies self-funding**: the same
expression pays the heal and the gold, so choosing a dangerous fight is choosing a bigger payday
and a bigger top-up, and the player is never punished for playing upward. Behind it sits the
Cooperative DM Principle — *the dungeon master is on your side* — which is not a mood but a
constraint: death is recoverable, encounters are winnable, and no mechanic may create a state the
player cannot leave by ordinary play. The Necklace of Knowledge adds the collector's thread: a
souvenir per location, evidence of where you have been, with no combat effect at all.

| Claim | Verdict |
|---|---|
| `XP = AC × maxHP` | ✅ exact — `xpAward = (S.enemy.ac) * (S.opp.maxHp)` |
| `reward = floor(0.1 × AC × HPLoss)` (prose) vs `× maxHP` (table) | ✅ **not a contradiction** — the report copied both halves of one line; the engine's own comment reads *"HPGive = goldDrop = 0.1 × AC × HPLoss (HPLoss = maxHP on kill)"* |
| Attributed to `_onStoryVictory()` at 23,244 | ❌ function **never existed**; the formula is at the head of `function _storyBattleVictory() {@25280`, 99 lines above the cited line |
| Checkpoint respawn preserves tattoos | ✅ exact, and byte-identical to its 2026-05-25 spec (`function storyRespawnFromCheckpoint()@23922`) |
| **Necklace: *"first arrival at each node awards a Knowledge Bead"*** | ❌ **INVERTED MECHANISM.** Beads are awarded on **rest**, not arrival — two call sites, both rest paths (`function _maybeAddKnowledgeBead(nodeCode) {@25808`, called from `storyShortRest` and `storyConfirmSleep`). **The source report says "rests" five times.** |
| *"Short rests (3/day, 50gp, partial heal)"* | ⚠️ 3/day ✅; **no gold cost has ever existed** (`shortRestCost` = 0 occurrences, then and now); heal is 25 % of max HP **at an inn** and **50 % away from one** (`const heal  = isInn ? base : base * 2;@25839`) |
| Long rest = full heal + day advance, cost varies by node | ✅ `sleepCost` 3–5gp per inn node |
| *"`void_mercy_count` prevents the Void Tide from killing a player who is actively playing"* | ❌ **materially overstated** — it is **one** reprieve, granted only at pressure 9 **and only with ≥5 of 7 shards** (`S_story.void_mercy_count = (S_story.shards >= 5) ? 1 : 0;@26984`), spent at the next tide with the line *"💤 You sleep fitfully. The Void holds its breath with you."* A player at 4 shards gets nothing. |
| *"Gate locks (e.g. DAM blind-days) must have a reachable resolution"* | ⚠️ corroborated by §DOC-02ba, which found the quoted DAM blind-days console trace has **no referent in the file** |

---

### Register 3 — The loot/weapon-economy diagnosis
*Source: `lab-report-loot-drop-weapon-economy.md` (2026-05-21) — a proposal, superseded by Register 4. Now in `archive/`.*

**Intent & playability.** A pure diagnosis: four ways the reward economy leaked — unreachable XP
thresholds, parallel uncoordinated drop rolls, unenforced magic tiers, and an offhand slot that
accepted a dagger and a shield at once. Its value to play is indirect but large: it is the document
that made the loot layer *legible* enough to be redesigned.

| Claim | Verdict |
|---|---|
| *"max 680,000 XP"* in the old table | ⚪ **UNVERIFIABLE** — `680000` has 0 occurrences in the file's entire committed history, but the report predates the earliest surviving build by three days (instrument 18) |
| XP table compressed to 0–195,000 over 20 levels | ✅ exact |
| `_D100_TABLE` unified all consumable drops | ⚠️ true of the *design*, **false of the file it was written against** — see Register 4 |
| `_magicTierAllowed()` gates on `S_story.level` | ✅ exact and unchanged: `return (S_story.level || 1) >= magic * 5;` (`function _magicTierAllowed(magic) {@24509`) |
| Offhand dagger and shield mutually exclusive | ✅ **enforced in both directions and twice over** — equipping either returns the other to inventory *("Dagger moved to inventory" / "Shield moved to inventory")*, and the offhand attack refuses outright while a shield is worn (`if (S_story.equippedShield) { _sboLog('🗡 Unequip shield to use offhand.'); return; }@25105`) |

---

### Register 4 — The three-channel drop model
*Source: `lab-report-loot-drop-system-v2.md` (2026-06-05) · verified separately as §DOC-02v*

**Intent & playability.** Every kill pays three ways: a **thematic trophy** so the corpse means
something, a **d100 consumable** so the tactical shelf refills, and a **base weapon at rolled
quality** so gear improves without ever handing out magic. The exclusion is the design: positive
magic (+1…+4) comes **only from fishing**, which gives Yugurt Lake a mechanically unique purpose
and makes a quiet activity the sole route to the best equipment in the game. It is a genuinely
elegant piece of economy design, and it is the register this report gets wrong.

| Claim | Verdict |
|---|---|
| Three channels, in that order, every kill | ✅ exact — trophy → `_rollD100Loot()` → `_rollMonsterWeaponDrop()` |
| `MONSTER_DROPS` anchor 5,232–5,699 | ✅ **both line numbers exact** |
| *"392+ entries"* | ✅ **exactly 392** at its own commit — and **398 at HEAD**, a perfect 1:1 with `MONSTER_POOL`, no gaps, no orphans |
| `_D100_TABLE` anchor 22,456–22,477 | ✅ **both line numbers exact** |
| **`_D100_TABLE` *"Active — consumables only, no magic weapons"*** | ❌ **INVERTED AT ITS OWN COMMIT.** That exact 22-line range held **16 rows**: 7 consumable and **9 weapon rows — 4 magic daggers (+1…+4), 1 base and 4 magic mainweapons.** See §V-A. |
| `_rollD100Loot()` at 22,485 | ✅ exact |
| `_rollMonsterWeaponDrop` → 1 base weapon, quality −4…0, never positive magic | ✅ exact at HEAD, comment included: `// FC06: monster drops capped at base tier` (`function _rollMonsterWeaponDrop(monsterDmgDie) {@24581`) |
| `LAKE_MAGIC_DB` the exclusive positive-magic source | ⚠️ true of the data; **no live grant path at HEAD** — see §VI |
| `LOOT_TABLE` *"dead code … marked in a comment"* | ❌ **the comment says the opposite.** `const LOOT_TABLE = [@24441` is annotated *"(d100 result → item; used by `_rollD100Loot()`)"* — naming a caller that reads `_D100_TABLE` instead. Zero readers, a comment asserting one. → **§DROP-01-FU (a)**, open |
| `GET /api/loot-drop` unified query | ✅ shipped (`js/wbapi-server.js` `loot-drop`), with three defects filed as **§DX-02ab** |

---

### Register 5 — Luck, the seventh stat
*Source: `lab-report-luck-seventh-stat.md` (2026-05-25) · verified separately as §DOC-02w*

**Intent & playability.** `Luck = ⌈⁶√(STR·DEX·CON·INT·WIS·CHA)⌉`, read-only, shown on the sheet
and explained nowhere. The geometric mean is the whole idea: one dumped stat drags the root down,
so a balanced build is quietly rewarded without a "balance bonus" button ever appearing. The
player becomes lucky without having chosen to be — which is the most charming reward design in the
file, and the one most in danger of being "cleaned up" by someone who prefers arithmetic means.

| Claim | Verdict |
|---|---|
| Formula and modifier | ✅ **byte-identical from birth to HEAD**, `product <= 0` guard included (`function _calcLuck() {@23438`, `function _luckMod()@23444`) |
| All six table rows (decl · loot · death save · fishing DC · sheet) | ✅ **6 of 6 line-exact** |
| Loot integration quote | ✅ exact in substance; the roll is now `_seededNext()` (§VM-01-B) |
| Death-save integration quote | ✅ **byte-identical at HEAD**, `Math.random()` and all — see §V-C |
| Fishing quote `(baitSatchel ? 8 : 10)` | ⚠️ field is `S_story.fishingBaitSatchel`; expression otherwise exact |
| *"wired into four systems … 4. corridor encounter rate"* | ❌ **NOT SHIPPED at the time of writing.** The corridor layer was deleted by `85cc43e` two days earlier and again by §CELL-14 at **09:39 the same morning — three hours fifty-eight minutes before this commit.** The report's own table lists six rows and correctly omits it. |
| *"`_luckMod()` is called 7+ times"* | ✅ true and understated — **10 calls** at that tree |
| *"the `// Layer 48:` markers should be preserved as provenance"* | ✅ **held exactly — 5 markers then, 5 markers now** |

---

### Register 6 — Tattoos and the Chronicle
*Source: `lab-report-tattoo-progression-system.md` (2026-05-25) · verified separately as §DOC-02am*

**Intent & playability.** A bifurcated inventory: **things drop on death, tattoos do not.** Every
level-up and every death is inked with a day, an hour and a place, so the character sheet becomes a
biography rather than a stat block, and death costs you your gear but never your history. The
Chronicle is the same idea in numbers — a career ledger that never resets beside a run ledger that
does. Presented, deliberately, without commentary: the game tells you what happened, not how you
did.

| Claim | Verdict |
|---|---|
| `tattoos: []` in `_S_DEFAULTS` at both paths | ✅ both lines exact |
| `careerStats` / `runStats`, **10 fields each** | ✅ **exact**, in the stated order (`careerStats: { kills:0@23146`, `runStats:    { kills:0@23147`) |
| `_survivingTattoos` / `_survivingCareerStats` on respawn | ✅ both exact |
| `kenickieMarketUsed` in `_S_DEFAULTS` | ✅ exact |
| `levelUpLog` is the machine-readable twin | ✅ written by the gifts handler |
| Sheet text *"…They outlive you — the body remembers."* | ✅ **verbatim** — but it renders on the **character-creation** screen (`id="charcreate-sub"@4963`), not the character sheet |
| Section header *"⚫ Your Tattoos"* | ❌ **0 occurrences, then or now.** The section is `makeSection('⚔ Character Tattoos');@31244` |
| Time-of-day: `hour` +1 per battle, +6 per sleep, 0–23 | ✅ both exact — the +1 fires at battle **start** (`function _storyRollInit() {@24624`), not at victory |
| *"Do not reset `careerStats` on death"* | ⚠️ upheld on death; **§CHRON-01** records that NG+ destroys it |

---

### Register 7 — Kenickie's Black Market and the game-over ledger
*Source: `lab-report-kenickie-chronicle.md` (2026-05-25) · verified separately as §DOC-02q*

**Intent & playability.** The **silent unlock**: finish the Cat-King chain and a fence who now
considers you crew starts selling discounted healing and bait — announced by one clause inside the
completion message and nothing else. No map pin, no fanfare, no new quest entry. The reward for
finishing a chain is that the world quietly behaves differently, which is a far better feeling than
a notification. The *sheet-swapper* pattern that implements it — same node, different NPC content
by quest state — is the correct model for every post-quest surface change since.

| Claim | Verdict |
|---|---|
| Unlock at `quest_cat_05 === 'complete'` | ✅ exact (cited line off by 7, hedged) |
| The single announcement *"Kenickie's Black Market is open"* | ✅ **verbatim**, inside the completion narrative bit at `Kenickie's Black Market is open.@13745` |
| `kenickieMarketUsed = true` on first purchase | ✅ exact (`S_story.kenickieMarketUsed = true;@33056`) |
| No quest entry, no map marker | ✅ still true |
| *"run stats first ('This run'), career stats second ('All time')"* at game-over | ❌ **three ways wrong.** The game-over modal shows **one** column — `<div class="goc-title">This Run` — with **nine** rows and **no career figures at all**, then and now (`function _populateGameoverChronicle() {@23852`). The two-column ledger lives on the **character sheet** (`function storyRenderCharSheet() {@37609`) and its headers are **"This Life" / "All Lives"**, the second suppressed until the first death. |
| *"presented without blame or judgment — just numbers"* | ✅ **exactly right** — nine labelled rows, no commentary anywhere |

---

## V. Findings

### V-A. The headline: a certification contradicted by its own line range

Register 4 states, in a table cell whose line numbers are **both exact**, that
`_D100_TABLE` (22,456–22,477) is *"Active — consumables only, no magic weapons."* At `89fa13b`
those 22 lines contain:

```js
{ weight:5,  _type:'dagger',     _magic:1 },   … +2, +3, +4
{ weight:8,  _type:'mainweapon', _magic:0 },
{ weight:6,  _type:'mainweapon', _magic:1 },   … +2, +3, +4
```

Nine weapon rows, **eight of them positive-magic**, and live: `_rollD100Loot()` branches on both
types, gated only by `_magicTierAllowed()`. Sixteen rows summing to 100, so a level-20 character
had a **2 % chance of a +4 mainweapon from any ordinary kill** and a level-5 character a 5 % chance
of a +1 dagger — while
the same page declares fishing the exclusive source of positive magic and instructs future authors
*"Do not add weapons to `_D100_TABLE`."*

Why: §DROP-01 shipped the purge at `440eb5d` (2026-06-05 10:41) and **`88d41d1` reverted it at
13:33 the same day** — a commit whose subject is *"POST /api/import/book: documentation + smoke
test cleanup"*, the silent stale-working-copy revert §DOC-02v caught red-handed. The purge did not
return until `0fffce7` on 2026-07-07, **68 days later**. So this document was written into the
gap, and its author read the *source report* rather than the range they cited.

***The lesson is not that the author was careless — every number on the page is right. It is that a
synthesis inherits its sources' intentions and re-publishes them as observations. When a document
says "reads the report against the live HTML," the one row where it did not is invisible, because
the citation next to it is perfect.***

### V-B. The mechanism restated in the summariser's own words is the one that changed

The Necklace of Knowledge is awarded on **first rest at a location**. The source report says so
five times (*"the first time the player rests at each unique location"*), and the engine agrees:
two call sites, both rest paths. This synthesis renders it as **"first arrival at each node"** —
and then builds a rule on the error: *"It should be the only reward for 'first visit' — do not
create a parallel 'first visit' mechanic."*

Both halves fail. There is no first-visit reward in the game at all (`visitedCells` feeds the
minimap and grants nothing), and the parallel mechanic the rule forbids **was already in the file**:
the Boyscout Token for a first short rest at a node (`// Boyscout Token — first short rest at this location@25849`)
and Boyscout Night for a first sleep — *"🏕 Boyscout Night! Double rolls"*. Three
first-time-here rewards keyed to the same act, and the rule written to prevent exactly that.

***A summary is the most dangerous sentence in a document, because it is the only one nobody
checks against a file.***

### V-C. The advice that is a trap: `_checkLevelUp()`

Register 1 closes with *"`_checkLevelUp()` is the single call site for all XP gate processing …
Any new XP source should call it."* Following that advice today produces a silent bug.
`_checkLevelUp()` is a **mutator that only queues**: it raises `S_story.level` and pushes the level
onto `_levelUpQueue`, while every benefit — the HP roll, the ASI, the Fighter feature, the gold and
shield gifts — is delivered by `_showLevelUpModal`. On the skill-check **pass** path the queue is
never drained, and `function _grantExplorationXp@30077` opens by clearing it, so the next step onto
new ground discards the pending entry: **the player keeps the level and loses everything in it.**
The *failing* branch, added later by §XP-01, does it correctly three lines away
(`The attempt was not wasted.@7014`) — so failing a Ceremonia Roll can open the level-up modal and
passing one cannot. Filed as **§DX-02p** (§DOC-02e), open, blast radius all 2,453 `skill_check`
quests. The advice is right about the call and silent about the drain, which is the whole defect.

### V-D. Three loot channels, two random streams

The report's unified-loot thesis is architecturally clean and **half-seeded**. `_rollD100Loot()`
and `_rollMonsterWeaponDrop()` both draw the seeded stream (§VM-01-B), so a save determines them.
The trophy channel does not: **13 of the 398 `MONSTER_DROPS` entries are arrays** — multi-drop
tables picked by `function _pickDrop(table) {@7041`, which rolls `Math.random()` and writes the
result to persisted inventory through `const _rawDrop = MONSTER_DROPS[S.enemy.key];@7049`. The
death save is the same shape: `let d20 = Math.ceil(Math.random() * 20) + _luckMod();@25896` decides
whether the character lives, off the unseeded stream, while the loot roll eleven hundred lines away
was converted. Both are instances of **§DX-02m** (open, 🟠), whose stated first job is to measure
how many of the file's **51** `Math.random()` sites reach persisted state; these are four of them,
in the most consequential paths in the game. `check:rng` cannot see it — gate #10 proves the three
mulberry32 streams agree with each other, never *which* stream a state write draws from.

### V-E. The copied half and the recalled half, in one document

Two of the report's function attributions are wrong (`_onStoryVictory`, and the game-over ledger
attributed to *"`storyAutoSave()` vicinity"*), and **both sit beside line numbers that are right**
— the second lands three lines inside `_populateGameoverChronicle()`. Line numbers get pasted;
function names get remembered. Instrument 9 in its most compact form: **the numbers a document
copies are its evidence; the words it supplies around them are its claims.**

### V-F. Corpus correction — `q.xpAward` is read

§DX-02n carries a sub-item stating that `q.xpAward` (53 occurrences) has **0 readers**. It has two:
`// §D02 xpAward on side-type quest completion@30201` in the quest-completion loop, shipped
2026-05-26 in a commit named *"ui stuff"*, and the Warrant's Board honest-reward preview, whose own
comment calls it *"the live payout"* and names `q.reward` as the dead field instead. Measured:
**51 quests carry `xpAward`, 46 of them `type:'side'` — the exact shape the reader requires.** The
field is live; the row's evidence line is not. → **§DX-02bw**.

---

## VI. Reachability closure (instrument 19)

A symbol can resolve, execute correctly, and still be unreachable. Measured over `CELL_GRID`
primacy at HEAD (416 nodes, `npm run stats`-reconciled):

| Surface | Reachable? |
|---|---|
| Levels · Flashbang · conditions · reward formula · beads · tattoos · chronicle | ✅ global, no node gate |
| Kenickie's Black Market (`CDG`) | ✅ **`CDG` is primary** in cell `21,182` of four occupants |
| Luck → loot roll, death save, sheet | ✅ live |
| Luck → fishing DC, catch, bait | ❌ stranded |
| **`LAKE_MAGIC_DB` — the entire positive-magic economy** | ❌ **no live grant path.** The only grant site is inside `storyFishing()`, reachable only at `BOO`, which is **second in cell `2,194` behind `LYR`** — §FISH-01 / §FISH-02 |
| Luck → corridor encounter rate | ⛔ deleted before the report was written |

So Register 4's exclusivity design is intact as data and **dead as an economy**: monster drops are
capped at base tier exactly as specified, and the fishing channel that was supposed to be the
compensation cannot be entered. *The invariant shipped perfectly; the exception it defers to is
behind a node nobody can stand on.*

---

## VII. The durable half — design rules that still govern

These survive verification and should constrain the next combat feature:

1. **The 1.5-action round is inviolable.** Main action + one bonus. Every addition since — offhand
   dagger, Action Surge, spell scroll, Flashbang, conditions — is an *option inside* the bonus
   phase. Nothing may add a third decision per round.
2. **Automatic, announced progression.** No build menus in the flow of play. *(Noted honestly: the
   level-up modal does ask for an HP roll and, at seven levels, an ASI — the design broke this
   constraint deliberately and, per §DOC-02t, was right to.)*
3. **`XP = AC × maxHP` and `reward = ⌊0.1 × AC × HPLoss⌋`.** Any new enemy must pay on this curve or
   the economy tilts. Harder is self-funding; that is the promise.
4. **Trophy → d100 → weapon-quality, in that order, and no positive magic from a kill.** Every
   monster needs a `MONSTER_DROPS` entry — **398 of 398 at HEAD, 84 days and six new monsters
   later. The best-kept rule in the document.**
5. **`_magicTierAllowed(tier)` before any tiered award.**
6. **Bifurcated inventory.** Achievements are tattoos (`sell:0`, never dropped); resources are
   inventory. Death writes a tattoo with day, hour and place. *(§DX-02ax: the tattoos are safe by
   container, not by the `drop:false` flag, which has zero readers.)*
7. **Career stats never reset; run stats reset on respawn.** New telemetry is a ledger field, not a
   new flag.
8. **The sheet-swapper.** Post-quest NPC changes swap content on the existing node; they do not mint
   a new node or quest entry.
9. **The silent unlock.** A payoff surface is announced by the completion message and nothing else.
10. **No inescapable states.** The Cooperative DM rule, and the one this report's own subject
    matter now violates in three places: §DX-02p (a level with no rewards), §FISH-01 (an economy
    behind a stranded node), §AUDIT-03an (a ledger that never resets after the first death).
11. **New, from this verification:** *for every "N Xs" in a design document, re-derive N against the
    file — and for every "the current code does X", open the range you are about to cite.*

---

## VIII. Defects filed

| Row | Grade | Substance |
|---|---|---|
| **§DX-02bw** (new) | 🟢 | §DX-02n's `q.xpAward` sub-item says **0 readers**; there are **2**, and 46 of the 51 carrier quests are the `type:'side'` shape the primary reader requires. Correct the row's evidence; the field is live, and the *engine's own comment* says which of the pair is dead (`q.reward`). |
| **§DX-02m** | 🟠 (extended) | Four named state-writing `Math.random()` sites in the combat core: the death save (`@25896`), the initiative pair in `_storyRollInit`, the spell-scroll DC, and `_pickDrop` (13 array-valued trophy tables → persisted inventory). Total sites reconciled at **51**, matching the row. |
| **§DROP-01-FU (a)** | open | Confirmed at HEAD: `LOOT_TABLE` declared, 20 entries, **0 readers**, comment still naming `_rollD100Loot()` as its caller. |
| **§DX-02p** | open | Re-confirmed at HEAD: no `_showLevelUpModal` on the skill-check pass path; `_grantExplorationXp` still clears the queue. |
| **§FISH-01 / §FISH-02** | open | Re-confirmed by cell primacy: `BOO` second in `2,194` behind `LYR`; no live positive-magic grant path exists. |
| **§DX-02ab · §CHRON-01 · §AUDIT-03an · §DX-02ax** | open | Re-confirmed, unchanged; recorded here for cross-reference. |

No new engine defect was found that an existing row does not already cover — which, for a
document this old, is the most flattering thing measurement can say about the subject.

---

## IX. Conclusion

Fifty-eight days after it was written, this synthesis is **94 % correct about what exists, 89 %
exact about where it lives, and wrong in exactly the places where it stopped copying and started
summarising.** Its tables are evidence; its prose is testimony. The single inverted claim —
`_D100_TABLE` certified as weapon-free while the cited range held nine positive-magic rows — is not
a transcription failure but a *category* failure: it reports an intention as an observation,
because the intention was published in a report and the observation was never made.

Its design half has aged extremely well. The 1.5-action round, the self-funding reward curve, the
three-channel drop model, the trophy bijection, the bifurcated inventory and the silent unlock all
still govern the file, and two of its stated rules — the `MONSTER_DROPS` entry per monster and the
`// Layer 48:` provenance markers — have held **without a single exception** across 5,000 added
lines. The tattoos still record every level-up decision, and they still outlive you.

*Verified 2026-08-13 · §DOC-02bc · Synthesis Part 2 of 7 · Next: Part 3 — World & Navigation*
