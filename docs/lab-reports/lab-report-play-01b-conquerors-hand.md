<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §PLAY-01-B *The Conqueror's Hand*: enemy behaviour at low HP

**Parent:** `docs/lab-reports/lab-report-play-review.md` §PLAY-01-B · **Track:** BACKLOG.md §PLAY-01 (face **B** of *The Honest Floor*)
**Written:** 2026-07-12 12:11:32 (`0883fa9`, spec awaiting sign-off) · **Shipped:** 2026-07-12 12:40:44 (`8eb909e`, +29 min)
**Class:** enactment — carries design weight · **Status:** ✅ SHIPPED, re-verified 2026-08-18 (§DOC-02cf) at **37 days**
**Re-verification verdict:** the lock shipped whole and has not drifted a byte; **half of its classifier has never once returned true.**

---

## 1. Abstract

Before this increment, `_storyEnemyTurn` was the entire single-player enemy AI: roll `d20 + atk`, deal damage,
end turn. It contained no branch on the enemy's remaining HP, its tier, or what kind of creature it was. A
"Deadly ⚠" monster and a kobold executed the identical eleven lines; the difference between them was arithmetic
and nothing else. Meanwhile `story.md` told the player the Void *"advances where the defenders are thin and
retreats where they're strong."* The engine enacted neither half of that sentence.

This report specifies, and the ship commit delivers, an **additive low-HP branch**: at ≤30 % HP a Void-touched
enemy **presses** (a one-time, tier-scaled enrage) and a mundane beast **flees** (a per-turn escape chance that
ends the fight without a kill, but pays effort XP). The branch is confined to `_storyEnemyTurn`; the
`DUEL:CORE` PvP kernel is untouched.

Re-measured 37 days later against live `play.html` (38,712 lines · 416 nodes · 398 monsters · 2,853
quests): **the shipped code is byte-identical to the day it landed**, the acceptance suite is **4/4 green**, and
`DUEL:CORE` hashes identically at the parent build, the ship build and HEAD. Three defects surfaced, none of
which the acceptance test could have caught, and all three are about **classification, not combat**.

---

## 2. Intention and inspiration — what this buys the player

The §PLAY-01 review found six faces of one sin: **the engine knows things it will not transmit or enact.** That
is the game's own subject turned on itself — `story.md` is about Froberger seeing the Void, failing to tell
anyone, and fixing it alone until it killed him. The review's north star is Sweelinck's line: ***"the floor will
be honest."***

Face **B** is the *enactment* half of that programme rather than the *honesty* half. The prose describing the
Void is unusually specific, and it is a description of **behaviour**:

> *"The Void is not a fog of consuming darkness. It is a conqueror. It advances where the defenders are thin and
> retreats where they're strong."* — `story.md:126`

That sentence is a design spec sitting in a lore file. The report's contribution is to notice that it is
**already an AI**, and that the engine had simply never read it. The title, *The Conqueror's Hand*, is taken
from the same line.

**What it adds to playability, concretely:**

1. **Tier stops being a synonym for arithmetic.** `MONSTER_POOL` carries a five-value `tier` field on all 398
   monsters, and before this increment tier was consumed only by the initiative modifier and the encounter
   weighting — never by the enemy's *conduct*. After it, "Deadly" is the tier that presses hardest (`+4 atk /
   +4 dmg / +1 damage die`) and the tier that will not run. The label finally predicts an experience.
2. **A fight can now end in a way that is neither victory nor death.** The flee branch is the engine's first
   *losable win*: the player was winning, and the reward left the field anyway. That is a third outcome in a
   system that had exactly two, and it is the mechanic §PLAY-01-E was waiting on ("a world that presses makes
   the tools matter again").
3. **It is the engine's only combat phase-change.** BACKLOG §EPIC-01 measured `EPIC_BOSS_POOL` and found
   `grep -c "phases:"` = **0** — twenty flat stat blocks. §PLAY-01-B's one-time enrage is therefore the *only*
   staged escalation anywhere in combat, and §EPIC-01 cites it **by name** as the safe pattern to generalise:
   *"§PLAY-01-B added its AI branch in `_storyEnemyTurn` — outside the kernel. Do the same here."*
4. **It minted the dial that carries a whole other track.** The flee had to pay *something*, and the answer the
   user gave — *effort XP* — was not one of the three options this report offered. `const EFFORT_XP_PCT@24426`
   ships here and now has **three read sites**: this report's flee grant, §XP-01's failed-skill-check grant, and
   §XP-01's miss cap. **The constant reaches more of the game than the feature that minted it.**

---

## 3. Method

| # | Instrument | Applied to |
|---|---|---|
| 108 | Pin the PARENT build before scoring any line number | `git show 8eb909e^:play.html` → 37,049 lines, extracted first |
| 84 | `git diff <ship> HEAD -- <report>` before reading | empty — the report has not been touched since the ship commit |
| 4 | `git log -S <symbol> --all` with **no pathspec** | `hpMax` · `voidTainted` — separates NOT SHIPPED from RETIRED |
| 51 | Census with the real parser, never a line regex | `src/js/wbapi-core.js` `W.load(GAME)` over `MONSTER_POOL` and `NODE_MAP` |
| 70 | Re-run the report's own acceptance test | `src/tests/integration/enemy-ai.test.js` — 4/4 |
| 88 | Prove the behaviour in the RUNNING GAME | three throwaway Playwright probes, run and deleted |
| 124 | A one-time guard is two claims: that it fires **and** that it resets | two consecutive encounters driven live |
| 7 | Check the report against its SIBLINGS, not only HEAD | §DOC-02cd (§XP-01), §DX-02g, §EPIC-01, `mechanics.md` |

The report has exactly **two** commits: `0883fa9` (birth, spec, docs-only) and `8eb909e` (the ship, which
rewrote only its status line). `0883fa9` touched no HTML, so the build the author was reading is the ship
commit's parent — one file, one author, 29 minutes apart.

---

## 4. Citation audit — the dating result

Every line number in the original text, scored against `8eb909e^` (37,049 lines):

| Cited as | Parent build line | Verdict |
|---|---|---|
| `_storyEnemyTurn()` is the whole enemy AI | 24365 = `function _storyEnemyTurn() {` | ✅ byte-exact |
| `MONSTER_POOL` shape | 5338 = `const MONSTER_POOL = {` | ✅ byte-exact |
| `DUEL:CORE` kernel start | 10025 = the `DUEL:CORE:START` sentinel | ✅ byte-exact |
| `DUEL:CORE` kernel end | 10177 = the `DUEL:CORE:END` sentinel | ✅ byte-exact |
| existing `S.opp.cond` machinery | 24409 = `S.opp.cond = '';` | ✅ byte-exact |

**5 of 5 byte-exact — the programme's third perfect dating result**, after §DOC-02cd (13/13) and §DOC-02ce
(6/6). The kernel bounds are *more* precise than the BACKLOG row that summarises them, which opens the range at
`10019` (the §MESH-01j comment header) rather than at the sentinel. Where the two disagree, believe the report.

---

## 5. As-built inventory (HEAD, 2026-08-18)

The ship added **77 lines in four regions**, none of them inside the kernel:

| Symbol | Anchor | Role |
|---|---|---|
| the effort dial | `const EFFORT_XP_PCT@24426` | `0.25` — fraction of a full success a partial action earns |
| per-encounter reset | `S.opp.enraged                = false@24639` | inside `_storyRollInit`, the guard's only writer-to-false |
| Void vocabulary | `const _VOID_ENEMY_RE@25143` | 24 alternatives matched against monster name + key |
| terrain vocabulary | `const _VOID_TERRAIN_RE@25144` | 10 alternatives matched against node terrain and `_inferTerrain` |
| the classifier | `function _isVoidEnemy@25145` | name-or-terrain heuristic; the only caller of both regexes |
| press magnitude | `function _voidEnrage@25154` | trivial +1/+1 … deadly +4/+4 and an extra damage die |
| flee probability | `function _fleeChance@25164` | trivial 0.6 · easy 0.5 · medium 0.35 · hard 0.2 · deadly 0.1 |
| the escape | `function _storyEnemyFlees@25170` | closes the overlay, grants effort XP, no loot, node not cleared |
| the effort grant | `const xp = Math.max(1, Math.round((S.enemy.ac@25171` | `round(AC × maxHp × 0.25)`, floor 1 |
| the branch | `if (S.opp.hp > 0 && S.opp.hp <= Math.ceil((S.opp.maxHp@25208` | the whole feature, at the top of `_storyEnemyTurn@25191` |
| guard set | `S.opp.enraged = true@25211` | the one-time latch |
| the press line | `⚫ The Void presses in — the wound only makes it worse@25216` | player-visible, proved painted |
| the flee line | `🏃 The beast breaks and bolts@25185` | player-visible |

**Zero drift.** `_storyEnemyFlees` and the low-HP branch both `diff` **identical** from `8eb909e` to HEAD, 37
days and roughly 1,600 file-lines of unrelated growth later.

**`DUEL:CORE` integrity:** `sha1` of the block between the sentinels is `511b93cc1b21…` at the **parent**, at
the **ship**, and at **HEAD** — identical across all three. The report's hardest constraint held, and it is
still holding.

---

## 6. Spec → shipped delta

| Spec item (§2 of the original) | Shipped | Note |
|---|---|---|
| new branch at the top of `_storyEnemyTurn` | ✅ | `@25208`, first statement after the ally strikes |
| gated on ≤30 % HP | ✅ | `S.opp.hp <= Math.ceil(S.opp.maxHp * 0.3)` |
| gated on `S.opp.hp / S.opp.hpMax` | ⚠ **name never existed** | see §7 defect D0 |
| gated on the monster kind tag | ✅ | `_isVoidEnemy@25145` |
| gated on `S.opp.tier` | ✅ | field is real and written at `S.opp.tier       = m.tier@8158` |
| press = one-time escalation | ✅ | latched by `S.opp.enraged`, proved once-per-fight |
| press = enrage `+atk` / extra die | ✅ | `_voidEnrage@25154`; the debuff alternative was not taken |
| flee = per-turn chance, ends the fight | ✅ | `_fleeChance@25164` → `_storyEnemyFlees@25170` |
| tier scales press magnitude | ✅ | five-value table, all five contract tiers covered |
| tier scales flee-resistance | ◐ **for mundane beasts only** | a Void enemy never flees at *any* tier — the branch is `else if`, so classification decides flee and tier only modulates it |
| everything else in the turn unchanged | ✅ | pure insertion; nothing removed or reordered |
| the branch lives ONLY in `_storyEnemyTurn` | ◐ **the branch does; the increment did not** | four regions touched — the dial, the reset in `_storyRollInit`, five module-scope helpers, and the branch. The *intent* (stay out of the kernel) held exactly; the wording did not describe the diff |
| `DUEL:CORE` and mesh replay untouched | ✅ | hash-identical at three builds |

---

## 7. The three design decisions — and what the menu missed

The report shipped as an **ASK**: three questions, ten lettered options, no code until sign-off. All three were
answered in the 29 minutes between `0883fa9` and `8eb909e`. Two answers came off the menu. One did not.

**Q1 — how is an enemy classified? → (b) heuristic.** Options were (a) a new per-monster `void:true` field over
"the ~30–40 Void-aligned entries", (b) infer from name and terrain, (c) tier-only. The user chose (b)
explicitly to avoid the data pass.

> **The estimate was excellent.** `_VOID_ENEMY_RE@25143` classifies **34 of 398 monsters (8.5 %)** — dead centre
> of the report's own "~30–40" guess for the field it decided not to build. Measured through
> `src/js/wbapi-core.js`, confirmed live in a browser at a neutral node.

**Q2 — does a fleeing beast deny the kill, and its loot and XP? → none of the above.** The menu offered (a) no
loot and no XP, (b) XP only and no drop, (c) purely cosmetic. What shipped is nearest (b), but the *quantum* was
a new invention: a world-percentage constant, `EFFORT_XP_PCT = 0.25`, applied to the full kill formula. **The
user's answer created a track.** §XP-01 *Universal Effort XP* — "all action earns XP; you never lose XP" — was
spun out of this single question and closed the same day.

> ***A three-option ask is a hypothesis about the answer space, and this one was wrong in the most productive
> direction available.*** The report offered three ways to make a flee cheaper; the user asked for a rule about
> what effort is worth.

**Q3 — press = enrage or debuff, and how hard? → (a) enrage, one-time, tier-scaled.** The debuff alternative
(reusing `S.opp.cond`) was not taken. The report's stated reason for the one-time constraint — *"so it reads as
a turn of the screw, not an oppression spiral"* — survives as the design rationale in `mechanics.md`.

**D0 — the spec named a field that has never existed on either object.** §2 locks the gate on
`S.opp.hp / S.opp.hpMax`. **`S.opp.hpMax` returns 0 hits at the parent build, at the ship build and at HEAD.**
The token `hpMax` is real and appears 50 times — but it is the **player's** field (`S_story.hpMax`, 47 reads).
The enemy's is `maxHp` (`S.opp.maxHp`, 20 reads at HEAD). The spec fused the two objects' vocabularies into a
name belonging to neither. **The implementation silently used the correct field**, so this never reached the
engine and is a review defect only — but it is the same mixed-object shape as §DX-02cy, caught here by the
implementer instead of by a gate. *Not filed: nothing to fix in code.*

---

## 8. Verification record — the report's own §4 plan, re-run at 37 days

| # | Planned check | 2026-08-18 result |
|---|---|---|
| 1 | inline script parses, 0 errors | ✅ **0 page errors** across three independent browser runs |
| 2 | `src/tests/integration/enemy-ai.test.js` at scripted HP | ✅ **4/4 in 3.5 s** — helpers, press-once, flee-closes-fight, full-HP regression |
| 3 | `DUEL:CORE` byte-identical | ✅ hash-identical parent = ship = HEAD |
| 4 | drive a real low-HP fight of each kind | ✅ done live, both kinds, transcript below |

**Press, proved painted (deadly Void, `#sbo-log`):**

> `⚔ Enemy hit! 19 vs your AC 16 — 17 dmg taken!`
> `⚫ The Void presses in — the wound only makes it worse. (+4 atk, +4 dmg, +1d8)`

atk 5 → 9, dmgFlat 3 → 7, dmgCount 1 → 2, exactly `_voidEnrage('deadly')`.

**Instrument 124 — the guard fires AND it resets, and the reset is in the object the branch reads.** Two
consecutive live encounters: `S.opp.enraged` **false** after `_storyRollInit`, **true** after the first press,
**false** again after the next `_storyRollInit`, and the second Void enemy pressed normally. All three combat
entry paths call it — `_startPitChampionBattle@27914`, the pre-battle overlay commit, and
`_startStoryBattle@38259` — so there is no encounter that skips the reset.

**No pool contamination.** The enrage mutates `S.enemy.atk/dmgFlat/dmgCount` in place, which would be
catastrophic if `S.enemy` aliased the pool entry. It does not: `function loadWorldMonster@8147` copies
field-by-field. Proved live — after a deadly enrage, `MONSTER_POOL.void_wolf.atk` was still `5`.

**Instrument 70 note — the suite is honest but blind in one axis.** Test 1's own comment reads
*"classification heuristic (name/terrain)"*, and all three of its assertions exercise the **name** half. Its
only terrain touch is the negative case (*"rat at Birka city — not void"*), which passes **because** the
terrain half never fires. No test in the file can distinguish a working terrain branch from a dead one.

---

## 9. Findings → BACKLOG

### D1 — the terrain half of the classifier has never returned true (§DX-02di 🟡)

`_isVoidEnemy@25145` has two terrain call sites: `_VOID_TERRAIN_RE.test(node.name)` and the same regex over
`_inferTerrain@28383`. Both draw from one vocabulary — `NODE_MAP[*].name` is the **terrain key** (repo rule:
`name` is the terrain key, `label` is the display name), plus the three literals `ocean`, `road`, `midlands`
that `_inferTerrain` can return directly.

**Measured:** `_VOID_TERRAIN_RE` matches **0 of 111 `WORLD_DB` terrains** and **0 of the 109 terrain keys in
use on nodes**. **Browser-proved:** a mundane monster stood at **all 416 nodes** classifies Void at **none** of
them; `_inferTerrain` swept over the 90×360 grid returns **47 distinct terrains, 0 void-ish**.

The two vocabularies were minted independently and **share not one word**. The regex asks for `graveyard`,
`tomb`, `blight`, `wither`, `abyss`, `necro`, `dread`, `ash`, `void`, `corrupt`. The world spells its decay as
`catacombs`, `crypt`, `sewers`, `ruins`, `monster_cave`, `vampire_castle`, `drowned_shore`, `sunken_hall`,
`fog_bank`, `cosmic_realm`. **Half the shipped classifier is a constant-false predicate, and it has been one
since 2026-07-12.**

> ***A new gate class.*** This is not a dead const (§DX-02n) and not an unread field (§DX-02y): the const is
> live, its reader is live, and the reader is called on every enemy turn. What is dead is the **outcome**. A
> `check:deadconsts` scoped to unread symbols cannot see it; catching this needs the regex's alternatives
> intersected with the terrain roster — cheap, and exactly the kind of cross-table census the §DX-02 through-line
> already argues for.

### D2 — an alignment field exists, on two monsters, with zero readers (§DX-02dj 🟡)

§1 of the original states flatly: ***"No alignment/kind field exists."*** **False the day it was written.**
`voidTainted:true` was already on two `MONSTER_POOL` entries at the parent build — `void_wolf@5652` and
`void_rat_swarm@5653` — and `git log -S "voidTainted" --all` traces it back through fifteen commits to
`1b84f1f`, long before this report.

So §3's option (a) — *"a new per-monster `void:true` field … but a data pass"* — proposed inventing something
that existed and was **2/398 populated**. The user declined the data pass in favour of a heuristic, and
`_isVoidEnemy` **does not read `voidTainted`** (proved live: the field name does not occur in the function
source). Both tagged monsters classify Void anyway, **by name**, so there is no gameplay defect — but the repo
now carries two competing answers to one question, one of which nothing consults. Classic Hazard #2, and the
field's own sibling `void_rat_swarm` is already the subject of §DX-02h.

### D3 — the vocabulary tags four things it should not and misses twenty-two it should (§AUDIT-03bn 🟡)

With the terrain half inert, **the name regex is the entire classifier**, and it is a literary instrument doing
a taxonomic job.

**False positives — 4 of the 34 tagged (11.8 %), and three of them are fish:**

| Monster | Key | Tier | Matched on |
|---|---|---|---|
| Dread Catfish of Yugurt | `fish_19` | deadly | `Dread` |
| Yugurt's Dread | `fish_20` | deadly | `Dread` |
| Shadowfin Carp | `night_04` | medium | `Shadow` |
| Fiend Beast | `fiend_beast` | hard | `Fiend` |

`fish_19` and `fish_20` are ranks 19 and 20 of the twenty-rank lake progression — the **apex of the fishing
ladder**, which §FC06 makes the *sole* source of +1..+4 gear, so every player who wants magic weapons fights
them. `function _startFishBattle@30627` routes through the pre-battle overlay, i.e. straight into
`_storyEnemyTurn`. **Proved live at `BOO` (terrain `yugurt_lake`)**, driving the real loader:

> `⚔ Enemy hit! 26 vs your AC 16 — 47 dmg taken!`
> `⚫ The Void presses in — the wound only makes it worse. (+4 atk, +4 dmg, +1d12)`

atk 12 → 16. A **catfish** is announced to the player as the Void, at the hardest press in the table, in the
one fight the magic-gear economy funnels everybody through. A creature named `Fiend Beast` — the word *beast*
is in its name — presses instead of fleeing for the same reason.

**False negatives — 22 unambiguous undead the regex does not see, including four `deadly`:**

| Tier | Missed |
|---|---|
| deadly | Vampire · Mummy Lord · Death Knight · The Bruxa of Corvo Bianco |
| hard | Vampire Spawn · Mummy · Banshee · Spirit Naga · Bruxa (Higher Vampire) · Grave Hag · Mummy Priest · Cyber-Vampire · Vampire (Higher) · Woodland Spirit |
| medium | Ghost · Hym (Curse Spirit) · Pirate Ghost · Bone Naga · Library Ghost · Graveir |
| easy | Zombie · Protofleder |

The 24-alternative regex includes `wight`, `lich`, `revenant` and `wretch` but not `zombie`, `vampire`,
`mummy`, `ghost`, `banshee` or `bone`. **Hym (Curse Spirit) misses by a single letter** — the regex asks for
`cursed`. The consequence is not cosmetic: these are classified **mundane beasts**, so at ≤30 % HP they roll
`_fleeChance`. **A Death Knight breaks and runs.** The engine reaches **34 of the 56** monsters the game's own
naming calls Void or undead — **61 % recall**.

> The report predicted exactly this. §3(b): *"Zero data pass, but **fuzzy and can mis-tag**."* It was chosen
> with the risk stated, the risk landed, and nothing was watching for it. The fix is cheap and content-shaped:
> widen the name vocabulary, exclude the `fish_*` / `night_*` pools, and either read `voidTainted` (D2) or
> retire it.

### D4 — this increment created two of §DX-02g's four silent-fallback readers (corroborated, not re-filed)

§1 states `tier ∈ {easy, medium, hard, deadly}`. At the parent build the real distribution was **trivial 32 ·
easy 60 · medium 148 · hard 123 · deadly 33 · rare 1 · low 1**. The enumeration missed `trivial` — 32 monsters,
8 % of the pool — and both off-contract values.

The implementer caught the first: `_voidEnrage` and `_fleeChance` both ship a `trivial` row the spec never
mentioned. Nobody caught the second, and both helpers answer an unknown tier with a plausible number rather
than an error — `_voidEnrage` with the **weakest** press, `_fleeChance` with `0.4`. §DX-02g (`f229ede`,
2026-07-31) found this 19 days later across four readers; **two of them were born here.**

The measurable consequence: `void_shaman` — *"The Warden"*, the one monster in the pool whose key literally
says Void — shipped as `tier:'rare'`, so for 19 days the game's most explicitly Void-keyed enemy pressed at
`+1/+1`, the trivial-tier magnitude, instead of the `+3/+3` it now gets. It also sits in a §KG quest chain.
`mechanics.md` already carries the ⚠ note; §DX-02g is closed; nothing to re-file.

---

## 10. Risk register outcome

| Risk the report filed | Outcome at 37 days |
|---|---|
| PvP determinism if the kernel is touched | ✅ **never at risk** — hash-identical at three builds |
| an enrage becoming an "oppression spiral" | ✅ held — one-time latch proved, reset proved on all three entry paths |
| the heuristic "can mis-tag" | ❌ **landed** — 4 false positives, 22 false negatives (D3) |
| "a deadly bear would press like the Void" (the objection to option c) | ◐ **inverted** — option (b) shipped and a deadly *catfish* presses like the Void |

The one risk this report named and did not schedule a check for is the one that failed. That is the programme's
most repeated result, and this is its cleanest instance: the failure mode was **written down, chosen with eyes
open, and then never measured** — not for 37 days, not by the acceptance suite, and not by any gate.

---

## 11. What actually reached the player

- **364 of 398 monsters** can now break and run at ≤30 % HP; **34** press instead.
- **The dial outgrew the feature.** `EFFORT_XP_PCT` was a footnote to Q2 and is now read by the flee grant, the
  failed-skill-check grant and the miss cap — it is the calibration constant for §XP-01 and §XP-02.
- **The pattern outgrew the feature too.** BACKLOG §EPIC-01 — the largest open combat row — names §PLAY-01-B as
  its precedent for both halves of its design, on the strength of one property: *the branch is outside the
  kernel.*
- **The prose and the mechanics finally agree** — for 34 monsters. Getting the other 22 is D3, and it is a
  vocabulary edit, not an engine change.

> The floor is honest about what the Void does. It is still guessing about who the Void is.

---

## 12. Provenance

- **Birth:** `0883fa9` 2026-07-12 12:11:32 — spec, awaiting sign-off, docs-only (43 lines).
- **Ship:** `8eb909e` 2026-07-12 12:40:44 — `play.html` +77, `src/tests/integration/enemy-ai.test.js` +112,
  `mechanics.md` +11, BACKLOG +20, and a 2-line status edit to this file.
- **Untouched since.** `git diff 8eb909e HEAD` over this report was empty before the §DOC-02cf rewrite.
- **Re-verified 2026-08-18 (§DOC-02cf).** Docs-only; `play.html` not modified. Three Playwright probes
  were written, run and deleted. Siblings consulted: §DOC-02cd (§XP-01, which cites this increment's
  `EFFORT_XP_PCT` and `S.opp.enraged` lines and dated both byte-exact), §DX-02g, §DX-02h, §EPIC-01,
  `mechanics.md` §Enemy Low-HP Behavior.
