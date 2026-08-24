<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — Layer 48: Luck, The Seventh Stat

**Original:** CodexOfConquest.com development session, 2026-05-25 · **Verified against HEAD:** 2026-08-12 (§DOC-02w)
**Subject:** `play.html` — single-file browser D&D RPG (17,631 lines at authoring; 38,712 at HEAD)
**Ship commit:** `3f11e5b` (2026-05-24 22:35) *"implement Layer 48: Luck — The Seventh Stat"*
**License:** MIT — CodexOfConquest.com — Copyright (c) 2026

---

## Abstract

Layer 48 adds **Luck**, a read-only seventh ability score computed as the ceiling of the geometric
mean of the six standard scores, yielding a modifier by the ordinary D&D rule
`floor((luck − 10) / 2)`. It is never stored; it is recomputed on demand. Seven surfaces were wired
to consume it.

This verification finds the **mechanism intact and the design unreached**. Both functions are
byte-identical from birth to HEAD across 79 days and 21,081 added lines, and the report's own File
References table resolves **11 of 11 line numbers exactly** against commit `0a131f5` — the cleanest
build record the §DOC-02 program has measured. What did not survive is everything the report says
Luck is *for*: its designated primary reward was deleted with the corridor layer, its largest
cluster is stranded behind §FISH-01, its two headline worked examples are wrong (one by a factor of
100, one because it reads a dead fallback literal as the starting statline), and — the finding that
outranks the rest — a deliberate 2026-06-05 design decision that scoped Luck to a *single* call site
was **silently reverted 2 h 48 min later by a commit about book imports**, while two maintained
mechanics documents have certified the reverted state ever since. A full enumeration of the shipped
point-buy space (191,587 legal builds) shows the balance incentive the stat exists to create is
**not expressible**: 99.84 % of characters who spend all 27 points land on exactly the same
modifier.

---

## I. Intent, Inspiration, and What It Buys the Player

### A. The problem

Six ability scores, set once at creation, modified by ASI at level-up. Most are passive references —
STR gates the attack bonus, CON gates HP. A player optimising STR and CON has no mechanical reason to
care about CHA, INT or WIS. The result is a min-maxing attractor that flattens character diversity:
every Fighter converges on the same three numbers and three shrugs.

### B. The design goal

A soft incentive toward balance that never announces itself as one. No visible "balance bonus," no
menu, no tutorial beat. Compute a seventh number *from* the six, show it quietly, and let it lean on
outcomes that already feel like fate.

### C. Why a geometric mean, and not an average

An arithmetic mean rewards a spike anywhere. A geometric mean punishes neglect: one score near zero
drags the product toward zero no matter how tall the others stand. A character with STR 20 and CHA 4
is *less* lucky than a character with all sixes at 12 — which is the entire argument in one line.

$$\text{Luck} = \left\lceil \sqrt[6]{\text{STR}\times\text{DEX}\times\text{CON}\times\text{INT}\times\text{WIS}\times\text{CHA}} \right\rceil$$

### D. What it adds to playability

Three things, in descending order of how much they survive contact with the shipped game:

1. **It turns six numbers into one legible sentence about who you are.** The character sheet's stat
   block is a wall of digits; `✦ LUCK 12 [+1]` is a *reading* of that wall. It costs the player
   nothing and gives the sheet a summary line it did not have.
2. **It is anti-dump-stat pressure with no lecture attached.** Nothing tells you to raise CHA. Luck
   just quietly notices that you did.
3. **It puts a thumb on the outcomes players already narrate as luck** — what falls out of a corpse,
   whether you wake up from a death save, whether a tied cast at a fishing tournament goes your way.
   That third one is not in the original design at all; it arrived later, and it is the most
   thematically honest thing the stat does.

> The design's stated primary hook was the *encounter-rate reduction*. Two of its three genuinely
> live consumers at HEAD are the death save and a tournament tie-break — i.e. exactly the colloquial
> meaning of "lucky," which the report reaches in §III-D almost apologetically. **The feature is
> better than its own thesis, and the thesis is what got deleted.**

---

## II. Method

Instruments applied from the §DOC-02 program:

- **4 / 8 / 18** — `git log -S` on every named symbol; the archive build `32c10c5` (2026-05-24)
  contains **zero** Luck occurrences, so the feature **postdates the archive** and its **birth
  commit `3f11e5b` is the reference**, not `32c10c5` and not HEAD.
- **12 / 15** — score *copied* passages separately from *composed* ones, and diff a suspect table
  per column.
- **7** — check the report against its siblings, not only against HEAD.
- **19** — run a reachability closure, not just a symbol census.
- **21** — read the diff, not the subject line.
- **New this pass (see §VI-B)** — where a design constant defines a *space* the player chooses
  inside, enumerate the whole space rather than sampling it.

Line-number dating was performed by binary-searching the 2026-05-25 commit series for the tree whose
`_luckMod` census matches the report's File References table.

---

## III. As-Built Inventory

**The mechanism — byte-identical from birth to HEAD, one commit ever**

`function _calcLuck() {@23439` · `function _luckMod() { return Math.floor((_calcLuck() - 10) / 2); }@23445`

`git log -S "_calcLuck"` returns exactly one commit in the file's entire history (`3f11e5b`). The
transcription in the original §II-A is exact, `product <= 0` guard included.

**Live and reachable consumers (4)**

| Site | Anchor | Behaviour at HEAD |
|---|---|---|
| d100 loot roll | `Math.max(0, _luckMod())); // Layer 48: Luck bonus@24547` | `min(99, u + max(0, L))`; now on the seeded stream (§VM-01-B) |
| Death saves | `let d20 = Math.ceil(Math.random() * 20) + _luckMod();@25897` | flat `+L`; **unseeded** — §DX-02m's named instance |
| Tournament tie-break | `outcome = _luckMod() > 0 ? 'win'@34112` | undocumented; added after this report; hosted at `SSJ:{r:4,c:192},@9430` |
| Character sheet | `✦ LUCK@37670` | `${_calcLuck()} [${m(_luckMod())}]` + the italic note, verbatim |

**Live but unreachable consumers (4)** — all behind **§FISH-01**

`Luck reduces Survival DC@30492` (and its title twin) · `bare hook uses LuckMod@30527` ·
`typeTotal  = tDie + bait.type + _luckMod()@30557` · `const lm = _luckMod();@23424` (§DROP-03
`luckScale`, added later).

`const hasFish = node.isFishingLake;@35348` is the only gate on the Fish button, and
`isFishingLake:true@8782` occurs on exactly one node — `BOO` (Yugurt Lake). `const CELL_GRID = (() => {@9852`
builds each cell in `NODE_MAP` declaration order and only `list[0]` can become `currentCode`;
`LYR` is declared 59 lines above `BOO`, and `BOO:{r:2,c:194},@9422` / `LYR:{r:2,c:194},@9423` share
a cell. `function storyFishing() {@30393` therefore never draws.

**Deleted consumer (1)**

Hunt-mode encounter chance, both the roll and its on-screen percentage. Removed with the corridor
layer by `85cc43e` (§CELL-11A, 2026-06-14). `storyCorridorTravel` and `CORRIDOR` are **0
occurrences** at HEAD.

---

## IV. Spec → Shipped Delta Table

| # | Report claim | Shipped at HEAD | Verdict |
|---|---|---|---|
| 1 | `_calcLuck()` body as transcribed | byte-identical, 1 commit ever | ✅ EXACT |
| 2 | `_luckMod()` body as transcribed | byte-identical | ✅ EXACT |
| 3 | Read-only, never stored in `S_story` | no `S_story.luck` field exists (0 occurrences) | ✅ EXACT |
| 4 | Loot roll `d100 + max(0, luckMod)` | live; `Math.random` → `_seededNext()` (§VM-01-B) | ✅ LIVE (stream changed) |
| 5 | Death save `d20 + luckMod` | live, verbatim | ✅ LIVE |
| 6 | Fishing Survival DC `max(4, base − luckMod)` | live code, **unreachable** (§FISH-01) | ⛔ STRANDED |
| 7 | Bare-hook catch = `luckMod` | live code, **unreachable** (§FISH-01) | ⛔ STRANDED |
| 8 | Fishing type roll `+= luckMod` | live code, **unreachable** (§FISH-01) | ⛔ STRANDED |
| 9 | Corridor encounter `chance −= luckMod × 0.5` | **deleted** `85cc43e` (§CELL-11A) | ❌ RETIRED |
| 10 | Character-sheet display + italic note | verbatim (colours recoloured for the light theme) | ✅ EXACT |
| 11 | Eleven File-References line numbers | **11 of 11 exact at `0a131f5`** | ✅ EXACT |
| 12 | "Starting Human Fighter STR 16 / DEX 12 / CON 14 / INT 10 / WIS 12 / CHA 8" | `_S_DEFAULTS()` has shipped `{str:10, dex:8, con:8, int:8, wis:8, cha:8}` since before this report | ❌ **WRONG WHEN WRITTEN** |
| 13 | "Starting Fighter → Luck 12, Mod +1" | real default → **Luck 9, Mod −1** | ❌ **WRONG WHEN WRITTEN** |
| 14 | Worked product `= 25,804,800` | true product = **2,580,480** | ❌ **WRONG WHEN WRITTEN** |
| 15 | "⁶√ ≈ 11.7 → 12" | 11.712 → 12 — correct **for the untyped product** | ✅ (conclusion right) |
| 16 | "Balanced high-stat char can reach Luck 14–15 (+2/+3)" | creation ceiling **Luck 13 / +1**; +2 needs L20 and every ASI spent on balance; +3 needs both quest WIS grants too | ❌ **UNREACHABLE AS STATED** |
| 17 | "Neglected stat at 8 drops Luck to ~10–11 (Mod 0)" | max-min-max builds land on **Luck 11, Mod 0** | ✅ EXACT |
| 18 | "Typically 8–18 for a starting Fighter" | legal creation range **8–13** | ❌ OVERSTATED |
| 19 | §III-C: "−luckMod × 0.5 … at +2 luck that's a 1 % reduction (18 % → 17 %)" | 0.5 is subtracted from a **probability**, not a percentage — at +2 the chance is pinned to the 5 % floor | ❌ **WRONG BY 100×, WHEN WRITTEN** |
| 20 | §IV: "no icon" on the sheet display | shipped with `✦` and a rule above it, at birth | ❌ WRONG WHEN WRITTEN |
| 21 | §IV: "no feedback confirms Luck influenced a roll" | still true — 0 occurrences, 0 commits ever | ✅ STILL OPEN |
| 22 | §IV recommendation: CHA/INT ≥ 12 tutorial line | 0 occurrences, **0 commits ever** | ⚠️ NOT SHIPPED (kept) |
| 23 | *(not in report)* Luck scoped to one call site, §DROP-02 | **reverted 2 h 48 min later**; 5 of 6 removals live again | 🔴 SEE §V-A |
| 24 | *(not in report)* tournament tie-break consumer | live at `SSJ`, undocumented in all three home docs | ➕ EXPANSION |

---

## V. Findings

### A. The design decision that was made, documented, and silently undone — instrument 21, third confirmed instance

On **2026-06-05 at 10:45**, `3f74596` shipped **§DROP-02: luck scoped to fishing loot rarity only**.
It is not an accident or a refactor; it is a design decision with a written rationale per removal:

> *Remove `_luckMod()` from 6 incorrect call sites:* d100 combat drops (*"luck doesn't improve
> monster loot"*), death saves (*"luck is not a survival stat"*), bait search DC (*"luck doesn't help
> finding bait"*), bare hook catch (*"luck doesn't make you a better caster"*), encounter rate
> (*"luck doesn't reduce how often enemies appear"*), tournament tie-breaker (*"luck doesn't win
> sporting events"*). **Single surviving call: fishing Type/Rarity roll. … That is the only place
> luck belongs.**

At **13:33 the same day**, `88d41d1` — subject ***"POST /api/import/book: documentation + smoke test
cleanup"***, body describing only a node deletion that produces zero lines — **restored all six
verbatim**, `+` for `+` against §DROP-02's `-` lines. Five of the six are live at HEAD; the sixth
(encounter rate) survived the revert and was deleted nine days later with the corridor, for entirely
unrelated reasons.

This is the **same commit** §DOC-02v caught reverting §DROP-01's loot-table migration and §DROP-03's
lake-magic bonuses. **`88d41d1` therefore reverted three tracks in one stroke, and §DROP-02 is the
only one that has never come back.** §DROP-01 returned 68 days later; §DROP-03 was rewritten in six.
Luck's scoping has now been silently un-shipped for **68 days and counting.**

**The doc half is worse, and it is why this went unnoticed.** Two maintained home docs certify the
reverted state as current:

> `mechanics.md:373` · `docs/mechanics/mechanics-combat.md:361` — *"Luck's sole mechanical role is
> improving what you get from a fish catch. All other former uses (bait search DC, d100 combat drops,
> death saves, encounter rate, tournament tiebreaker) were removed."*

Both were **true for 2 h 48 min.** Meanwhile `world.md:1180` lists **all seven** original
applications, including the corridor term that no longer exists. So the three home docs describe
three different games, and **none of them describes this one.**

> ***Corpus rule, §DOC-02v's, now on its second independent subject: when a doc and the code
> disagree, date both. "Fixing" `mechanics.md` here would launder a reverted design decision into a
> shipped one.*** The repair belongs in the HTML.

### B. The balance incentive is not expressible in the shipped point-buy — a new instrument

The stat exists to reward balance. Whether it *can* is a closed question, because character creation
is a finite space: `const _CC_COST = [0,1,2,3,4,5,7,9];@38546` with `const CC_BUDGET = 27;@38547` and
scores clamped to 8–15. Enumerating it exhaustively (191,587 legal allocations):

| Population | Luck Mod −1 | Luck Mod 0 | Luck Mod +1 | +2 or better |
|---|---|---|---|---|
| All legal allocations (191,587) | 960 (0.5 %) | 99,828 (52.1 %) | 90,799 (47.4 %) | **0** |
| **Allocations spending all 27 points (12,282)** | 0 | **20 (0.16 %)** | **12,262 (99.84 %)** | **0** |

The twenty exceptions are not a spectrum. They are the twenty permutations of **{15,15,15,8,8,8}** —
the single most extreme dump-stat build in the space — and they land on Luck 11, Mod **0**.

**So across every character a player can actually build, the geometric mean discriminates by exactly
one point of modifier, and only against the one build nobody needs a hidden stat to discourage.**
The creation ceiling is **Luck 13 / +1** (`12/12/12/13/13/13`, the max-product 27-point spend). Mod
**+2** requires level 20 with all seven ASIs spent on balance rather than on STR; Mod **+3** requires
that *plus* both quest-granted WIS points. The report's "+2/+3 for a balanced high-stat character" is
a level-20 corner case, not a build choice.

> ***New instrument (22): when a report claims a design constant creates an incentive, enumerate the
> space the player chooses inside before believing it. A formula can be perfectly correct about a
> gradient that the surrounding constants never let the player stand on.*** A geometric mean over a
> range clamped to 8–15 has a spread of well under one modifier step; the discriminating power was
> spent by the point-buy table, ~15,000 lines away, and nothing in either file names the other.

**And the sign is inverted at the default.** Both no-input paths — Hard mode
(`const scores = _cc_mode === 'hard'` → `{str:10, dex:8, con:8, int:8, wis:8, cha:8}`) and the
untouched custom panel (`let _cc_scores = { str:10, dex:10, con:10, int:8, wis:8, cha:8 };@38549`) —
yield **Luck 9, Mod −1**: a point *off* every death save, a point *onto* the fishing find DC, and an
automatic **loss** on every tournament tie. A player who clicks straight through is not un-lucky by
neglect; they are penalised by default. *A hidden reward for balance that hands the least engaged
player the worst value in the space is a hidden punishment wearing the reward's clothes.*

### C. The primary reward was wrong by two orders of magnitude — and it was on screen

§III-C nominates the corridor encounter reduction as *"the most impactful Luck application"* and
prices it: *"At +2 luck, that's a 1 % reduction (from e.g. 18 % to 17 %)."*

The shipped expression at the report's own commit, verbatim:

```js
const chance = Math.min(0.95, Math.max(0.05,
  0.1 + notoriety * 0.015 + activeQuestCount * 0.04 - _luckMod() * 0.5));
```

`chance` is a **probability in [0, 1]**. `_luckMod() * 0.5` at Mod +1 subtracts **fifty percentage
points**, not half of one. A default-Fighter build with Mod +1 needs `notoriety × 0.015 +
activeQuests × 0.04 > 0.45` — roughly **12 simultaneously active quests** — before the encounter
model produces any variation at all; below that it is pinned to the 5 % floor. At Mod +2 the
threshold doubles. The report's "18 % → 17 %" is, in the engine, "18 % → 5 %."

Two details make this the cleanest instrument-12 instance in the corpus:

1. **The author half-noticed.** The pre-change line was `Math.min(0.95, 0.1 + notoriety * 0.015 +
   activeQuestCount * 0.04)` with no floor. The birth commit *adds* `Math.max(0.05, …)` in the same
   hunk — a clamp that exists precisely because the new term blows through zero. **The code knew and
   the prose did not**, one file apart, same hand, same night.
2. **It rendered.** The sibling site printed the number to the player:
   `'Global hunt-mode encounter chance: ' + chance + '%'`. The overlay said **5 %** while the
   post-mortem said 17 %. This is not a subtle divergence between spec and behaviour; it is a
   post-mortem contradicting a string on the screen it is describing.

### D. A dead fallback literal became four documents' worth of wrong claims

`const s = S_story.abilityScores || { str:16, dex:12, con:14, int:10, wis:12, cha:8 };@23440`

That `||` branch is unreachable: `abilityScores: { str:10, dex:8, con:8, int:8, wis:8, cha:8 },@23047`
is declared in `_S_DEFAULTS()`, and `const scores = startScores || { str:10, dex:8, con:8, int:8, wis:8, cha:8 };@23953`
re-asserts it on every new game. The `16/12/14/10/12/8` statline **has never been a starting
character.** The same dead literal appears **8 times** across the file as a `||` fallback.

The author read it as the default and built the flagship worked example on it. That example then
propagated into `lab-report-fishing-bait-prompting.md`'s Appendix B, into `mechanics.md:356` and into
`docs/mechanics/mechanics-combat.md:344`, all four printing *"Default scores (STR:16, DEX:12,
CON:14…)"* — a character the game does not make.

> ***This is the §DX-02n (e) "dead alternative in a fallback chain" class in its most expensive
> form. A write-only field is dead weight. A dead `||` branch that names a plausible statline is a
> documentation hazard: it reads exactly like a declaration, and four documents believed it.***

### E. Instrument 7 — one arithmetic slip, two reports, two home docs, partially self-corrected

`16 × 12 × 14 × 10 × 12 × 8 = 2,580,480`. Four documents print **25,804,800** — one digit shifted.
`lab-report-fishing-bait-prompting.md` (2026-05-24, §DOC-02n) prints the shifted product **and** a
sixth root of 11.54; this report (2026-05-25) prints the shifted product and the root **11.7**, which
is correct for the *true* product. Both `mechanics.md` and `mechanics-combat.md` carry the fishing
report's pair verbatim: `⌈(25,804,800)^(1/6)⌉ = ⌈11.54⌉ = 12`.

All four reach **Luck 12, Mod +1**, which is what the engine yields — for a character that cannot
exist. The printed product would give ⌈17.19⌉ = **18**, Mod +4.

> ***So the later document silently corrected one of the two intermediates and inherited the other.
> The author checked the answer against the engine and never re-checked the arithmetic that reaches
> it — which is exactly the failure mode a worked example exists to prevent.***

The reference table shared by both home docs is instrument 15 per column: 3 of its 4 rows are exact
(`10×6 → 10/+0` ✓, `16/12/14/10/12/8 → 12/+1` ✓, `8×6 → 8/−1` ✓) and the fourth — the *illustrative
maximum* `20/18/20/16/18/14` — prints **17 / +3** against a true **17.53 → 18 / +4**. The composed
row is the wrong one, for the thirteenth consecutive report.

### F. Two clean results worth recording

**The build record is exact.** The report's File References table gives eleven line numbers. All
eleven resolve, to the line, against `0a131f5` (2026-05-25 13:35, *"Footpath Hunt guarantees quest
monster when targets present in corridor terrain"*) — and that tree contains **exactly eleven**
`_calcLuck`/`_luckMod` occurrences, so the census is complete as well as correct: nothing omitted,
nothing invented. §DOC-02u's baseline matched "within its own tilde"; this one matches to the line,
eleven times, and dates the document to a specific commit. **Zero fabricated identifiers.**

**The `Math.ceil` on a floating-point root is safe.** `Math.pow(v**6, 1/6)` errs *low* for every
integer 8–20 (`12⁶ → 11.999999999999998`), so the ceiling recovers the exact score rather than
overshooting by one. Checked at all thirteen values, because a hair of error the other way would
have promoted every exact-power build a full modifier step. Not a defect — but the kind of
correct-by-luck that is worth writing down before someone "cleans it up" into `Math.round`.

---

## VI. Recommendation Register

| # | Report's own item | Outcome at HEAD |
|---|---|---|
| 1 | "Luck modifier range is narrow in practice (+0 to +3)" | **CONFIRMED, and understated** — the real creation range is −1 to +1 (§V-B) |
| 2 | "No feedback confirms Luck influenced a roll" | **STILL OPEN** — 0 occurrences, 0 commits ever |
| 3 | "The display is easy to overlook… no icon" | **WRONG WHEN WRITTEN** — `✦ LUCK` shipped with the glyph and a separator rule in the birth commit |
| 4 | Tutorial line at CHA ≥ 12 / INT ≥ 12 | **NOT SHIPPED** — *"Your balanced training has brought something extra"* has 0 commits ever |

Three of four are still actionable, and item 1 is the one that matters: the author correctly felt the
range was too narrow and guessed the wrong bound in the safe direction.

---

## VII. Defects Filed

- **§DROP-02-FU (NEW, 🟡 small design call)** — `88d41d1` silently reverted §DROP-02's deliberate
  six-site scoping; five removals are live again at HEAD and two maintained docs certify the state
  the engine has not been in for 68 days. Default recommendation: **re-apply §DROP-02 to the code**,
  which makes both docs true without editing them, then correct `world.md:1180`'s dead corridor row.
  Do **not** repair the docs first — that laundry is the defect (§V-A).
- **§AUDIT-03ag (NEW, 🟡 design call)** — the balance incentive is unreachable through the shipped
  point-buy (99.84 % of full spends → Mod +1) and inverts at both no-input defaults (Mod −1). Three
  options: widen `_calcLuck`'s output scale, raise the point-buy cap, or accept Luck as flavour and
  stop wiring mechanics to it. Measurement in §V-B; do not build before the call.
- **§DX-02ac (NEW, 🟢 no design call)** — the 8 dead `|| { str:16, dex:12, con:14, int:10, wis:12,
  cha:8 }` fallback literals. Unreachable since before this report, and the direct cause of a wrong
  claim in four documents. Sixth widening of the proposed `check:deadconsts`: a **dead alternative
  in a fallback chain that names a plausible data shape** is a documentation hazard, not inert.
- **§DX-02m (existing, +confirmation)** — `let d20 = Math.ceil(Math.random() * 20) + _luckMod();@25897`
  and the Indomitable reroll three lines below remain the highest-stakes unseeded rolls in the file.
  Already filed by §DOC-02n; no new row.
- **§FISH-01 (existing, +4 stranded consumers)** — this row now gates **four** of Luck's nine call
  sites, on top of the fishing economy §DOC-02v measured. Two lines of reordering.
- **§DX-02v (existing, extended)** — `mechanics.md:683` still prices the bare hook at *"−3 Catch
  Roll"*, a value neither Layer 48 nor §DROP-02 ever shipped (§DROP-02 set it to `0`).

---

## VIII. File References

| Anchor | Content |
|---|---|
| `function _calcLuck() {@23439` | geometric-mean computation, byte-identical since `3f11e5b` |
| `function _luckMod() { return Math.floor((_calcLuck() - 10) / 2); }@23445` | standard modifier |
| `const s = S_story.abilityScores || { str:16, dex:12, con:14, int:10, wis:12, cha:8 };@23440` | the dead fallback (§V-D) |
| `abilityScores: { str:10, dex:8, con:8, int:8, wis:8, cha:8 },@23047` | the real default |
| `const scores = startScores || { str:10, dex:8, con:8, int:8, wis:8, cha:8 };@23953` | `storyNewGame` |
| `const _CC_COST = [0,1,2,3,4,5,7,9];@38546` · `const CC_BUDGET = 27;@38547` | the space enumerated in §V-B |
| `let _cc_scores = { str:10, dex:10, con:10, int:8, wis:8, cha:8 };@38549` | untouched-panel default → Mod −1 |
| `Math.max(0, _luckMod())); // Layer 48: Luck bonus@24547` | loot roll |
| `const _D100_TABLE = [@24517` · `const gp = Math.floor(_seededNext() * 200) + 50;@24557` | what luck's 1 pp actually moves |
| `let d20 = Math.ceil(Math.random() * 20) + _luckMod();@25897` | death saves |
| `outcome = _luckMod() > 0 ? 'win'@34112` · `SSJ:{r:4,c:192},@9430` | tournament tie-break (undocumented) |
| `Luck reduces Survival DC@30492` · `bare hook uses LuckMod@30527` · `typeTotal  = tDie + bait.type + _luckMod()@30557` | stranded fishing trio |
| `const lm = _luckMod();@23424` | §DROP-03 `luckScale`, also stranded |
| `function storyFishing() {@30393` · `const hasFish = node.isFishingLake;@35348` | the single entry point |
| `BOO:{r:2,c:194},@9422` · `LYR:{r:2,c:194},@9423` · `const CELL_GRID = (() => {@9852` | §FISH-01 |
| `✦ LUCK@37670` | character sheet |
| `_rarityFromRoll = (r) => r <= 5@30430` | rarity thresholds — home docs exact |
| `3f11e5b` · `0a131f5` · `3f74596` · `88d41d1` · `85cc43e` | birth · the report's tree · §DROP-02 · the revert · the deletion |

---

## Appendix — Worked Example, Corrected

For the character the game actually starts you with in Hard mode
(`STR 10, DEX 8, CON 8, INT 8, WIS 8, CHA 8`):

```
product = 10 × 8 × 8 × 8 × 8 × 8 = 327,680
⁶√327,680 = 8.442  →  Math.ceil  →  Luck 9
_luckMod() = floor((9 − 10) / 2) = −1
```

For the balanced 27-point spend that maximises the product (`13/13/13/12/12/12`):

```
product = 13³ × 12³ = 2,197 × 1,728 = 3,796,416
⁶√3,796,416 = 12.973  →  Math.ceil  →  Luck 13
_luckMod() = floor((13 − 10) / 2) = +1
```

**Two points of Luck and one point of modifier separate the best and worst characters the creation
screen can produce.** That is the feature, measured; everything else in this report is commentary on
what it was meant to be.

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
