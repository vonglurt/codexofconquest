<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Lab Report — §PLAY-01 *The Honest Floor*: systems and play review

**Track:** BACKLOG.md §PLAY-01, the **parent review** of a seven-face program (A–G) ·
**Authored:** 2026-07-12 · one commit, `3a0db52` · **never amended in 40 days** ·
**Parent build:** `3a0db52^` — 36,933 lines (the ship commit is docs-only, so parent = ship) ·
**Re-verified:** 2026-08-21 against HEAD (38,712 lines, +1,779 / 40 days) — §DOC-02ci.

**Scope.** A systems-and-feel review of the *core engine* — onboarding, combat resolution,
enemy AI, the XP/heal/gold economy, the time/Void deadline model, and progression gating.
Explicitly **not** a quest-by-quest audit and **not** a narrative review.

**Children:** each face has its own verification — §DOC-02ce (A) · cf (B) · cg (C) ·
ch (D) · cc (F/§DEATH-01). Face detail lives there; this document owns the **framing,
the priority table, and the negatives** — the claims of the form *"the engine never does X."*

---

## Abstract

The review's thesis is that `story.md`'s subject — transmission failure — is committed by the
engine itself: the game *knows* things it will not tell, and the prose says one thing while the
systems do another. It named six faces of that one sin, gave each a diegetic name, and ranked
them by whether they were **honesty fixes** (ship freely) or **enactment fixes** (design weight).

Re-measured at 40 days, this is the **fastest spec-to-ship document in the corpus**: A, B, C, D
and G all shipped on **2026-07-12, the same day the review was written**, F was already scoped as
§DEATH-01, and E was correctly predicted to fall out of B+C. The track closed `verified 6/6`.
The framing held; the engineering held; **12 of 12 line anchors are byte-exact** at the parent
build, and both economy formulas are quoted verbatim, comments included.

The failures are all of one kind, and it is not a design kind. **Four evidentiary claims are
wrong in ways that survive re-verification**: a literal string that occurs zero times where the
report says once; a node code that has never existed; two functions called *deleted* that were
never written. Three of the four are in the two faces the report rated *lowest risk* — the
"pure honesty, no design call" tier — and the most consequential of them, §PLAY-01-D, **shipped
its fix in three hours and aimed the game's only tutorial speech at a subsystem that cannot be
reached**. The review was right about the engine and careless about its own citations, and the
carelessness propagated: one of these errors is live in `mechanics.md` today, installed there by
the review's own fix.

---

## I. Intent, inspiration, and what the program does for playability

**The design problem.** The engine had accumulated genuine depth — a 1.5-AP action economy, a
49-day doom clock, a seven-Shard win condition, a relationship system that decides the ending —
and had told the player almost none of it. Depth the player cannot perceive is not depth; it is
overhead. Meanwhile the *opposition* had not kept pace: the player held a full toolkit and faced
enemies that could only stand still and swing.

**The inspiration, and it is the game's own text.** Froberger saw the Void clearly, tried to tell
people, and could not — *"not because they were stupid, but because understanding requires
context you can't give by talking."* Pinker's **Curse of Knowledge**: once you know a thing, you
can no longer remember not knowing it. The review's move was to notice that **the engine commits
that exact sin**, and to make it the organising principle rather than filing six unrelated bugs.
The north star is Sweelinck's closing line: ***"Come back when you're ready. The floor will be
honest."***

**Why this improves the game rather than merely documenting it.**

- **A goal the player can see converts atmosphere into agency.** Before A, a new character woke in
  Birka with beautiful prose and no stated purpose; the deadline existed only in the text that
  fired when you had already lost to it. A persistent objective chip makes every subsequent
  decision — sleep, grind, travel — a decision *about something*.
- **An enemy that makes a decision converts arithmetic into a duel.** B is the difference between
  a "Deadly" enemy being bigger numbers and being a different problem. It also makes the creature
  the prose describes the creature you actually fight.
- **A clock that bites gives the toolkit back its weight.** This is E, and the review's sharpest
  structural call: potions and conditions are vestigial *not* because they are mispriced but
  because nothing pressures you. Fix pressure and the economy re-inflates for free — no repricing,
  no content.
- **Honesty is a feature, not hygiene.** F and G are framed as playability work because a death
  message that lies and a spec that misdescribes its own code both cost the player trust, which is
  the resource the ending spends.

**The reprioritisation is the review's real contribution.** Sorting by *kind* — honesty vs
enactment — rather than by severity is what let five faces ship in a single day: the honesty tier
needs no design authority, so it never queued behind an ASK.

---

## II. Method

1. Pin the parent build. `3a0db52` is docs-only, so parent = ship = **36,933 lines**; every line
   citation is scored there, and every anchor in *this* rewrite is re-pinned to HEAD.
2. Re-resolve all 12 cited line numbers at the parent build.
3. Re-derive every quantity with the real parser (`js/wbapi-core.js`), never a line regex — a
   line-regex quest census returns 295 against a true 2,850.
4. Separate *never shipped* from *deleted* with `git log -S <symbol> --all`, **no pathspec**, then
   re-run scoped to `*.html`.
5. Test the negatives. A claim of the form *"the engine never does X"* is the only kind that can
   be falsified by a single counter-example, so each was attacked directly.
6. Delegate face-level ship verification to the five child reports rather than repeating it.

---

## III. As-built inventory (HEAD)

| Claim in the review | Measured at HEAD | Verdict |
|---|---|---|
| Win condition: 7 Shards + Level 20 + beat the Commander | `function _finalBattleReady(code) {@27998`, and TLS carries `minLevel:20, minShards:7` | ✅ exact |
| Final boss AC 22 / HP 300 | `const BOSS_COMMANDER_AUROS = {@26246` — `ac: 22, hp: 300` | ✅ exact |
| Void Tide on days 3/7/14/21/28/35/42 | `const VOID_TIDE_EVENTS = {@22368` — exactly those 7 keys | ✅ exact |
| Sleeping is the only day advance | `S_story.day = Math.min(49, S_story.day + 1);@36270` | ✅ exact |
| voidPressure 10 = defeat | `S_story.voidPressure = Math.min(10, prev + n);@26978` | ✅ exact |
| XP = AC × maxHP | `function _storyBattleVictory() {@25280` — the code comment reads *"XP = AC × maxHP"* | ✅ verbatim |
| Heal and gold each = 0.1 × AC × maxHP | same function — *"HPGive = goldDrop = 0.1 × AC × HPLoss"* | ✅ verbatim |
| 20 Epic Battleground bosses | `const EPIC_BOSS_POOL = {@26257` — 20 entries | ✅ exact |
| `WEAPON_ITEMS` is 70 | `const _BASE_WEAPONS = [@24471` (14) × `const WEAPON_ITEMS = [0, 1, 2, 3, 4]@24494` | ✅ exact |
| `_magicTierAllowed` = level ≥ magic × 5 | `function _magicTierAllowed(magic) {@24509` | ✅ exact |
| ~2,848 quests | 2,850 at the parent build, 2,853 at HEAD | ✅ within its own hedge |
| 6 curated Birka NPCs | `const birkaNpcs = {@35139` — Yael, Brynn, Quill, Pachelbel, Weckmann, Bruhns | ✅ exact |
| Start node is `LHR` | `LHR:{ num:1,@8427` | ✅ exact |
| Final fight at **node CO** | `CO` resolves in no build, ever; the node is `TLS:{ num:42,@8726` | ❌ **§VII** |
| The literal `"49 days"` appears **once** | occurs **zero** times, parent and HEAD | ❌ **§VI** |
| `_rollMainWeaponDrop` / `_rollWeaponDrop` **deleted** | 0 commits ever, in any `*.html` | ❌ **§VIII** |
| All +1…+4 gear is **fishing-exclusive** | no live grant path exists, fishing included | ❌ **§V** |

**Line anchors:** all **12 of 12** cited line numbers resolve byte-exact at the parent build —
`23159` · `36858` · `24278` · `24347` · `24376` · `34771` · `34860` · `25999` · `23740` · `23668`
· `23096` · `8149`. For a document written the same day it cites, this is the expected result;
it is also the reason the four content errors are dangerous, because the citation discipline
around them looks impeccable.

---

## IV. Spec → shipped delta

| Face | Diegetic name | Shipped | Commit (2026-07-12) | Outcome |
|---|---|---|---|---|
| **A** | The Courier's Map | ✅ | `b46d3f0` | goal surfaced whole; a later design reversal landed on one of its two surfaces (§DOC-02ce) |
| **B** | The Conqueror's Hand | ✅ | `0883fa9` spec → `8eb909e` | Void enrage live at `S.opp.enraged@24639`; the mundane-flee half has never once returned true (§DOC-02cf) |
| **C** | No Postponements | ✅ | `caa489e` | user chose **option (c)** — reframe the deadline honest; 10/10 shipped, 5/5 deferrals still deferred (§DOC-02cg) |
| **D** | Friendships With Magic | ✅ | `cfdeb21` | signpost through Yael — **and see §V** (§DOC-02ch) |
| **E** | The Tools Regain Their Weight | ⏸ by design | — | correctly predicted to fall out of B+C; no standalone work |
| **F** | The Floor Is Honest | ✅ | §DEATH-01 `a52f9cd` | the cleanest ship in the corpus at 37 days (§DOC-02cc) |
| **G** | The Map Matches the Territory | ✅ | `ac651a3` + `a6a1ce7` | doc sync + Birka NPC remap — **and see §VII–IX** |

Track closed `f2e8d44` (2026-07-23), *"verified 6/6"*.

---

## V. Finding 1 — the one false finding is the one that shipped fastest, and it aimed the tutorial at a locked door

§PLAY-01-D states that **all** +1…+4 weapons and daggers are *fishing-exclusive*, and concludes
that the magic path is *hidden behind* an optional mini-game. The first half is false and the
second half is false in a more expensive way.

**Measured:** there is **no live grant path for positive-magic equipment of any kind** — and that
includes fishing.

- `function _rollMonsterWeaponDrop(monsterDmgDie) {@24581` caps its pool at `magicBonus === 0` and
  degrades it to −4…0. That part the review describes correctly.
- The second vector, `function _rollD100Loot() {@24533`, *does* branch on `dagger` and
  `mainweapon` with a magic tier — but `const _D100_TABLE = [@24516` holds **seven rows totalling
  weight 100** (potions, scroll, flashbang, gold) and contains **neither type**. Both branches were
  already unreachable **at the parent build**: the table is 7 rows there too. `_magicTierAllowed`
  is reachable from nowhere else.
- The specified fishing grant, `_fishingMagicWeaponDrop`, has **0 commits ever**. It was never
  built. Fishing pays out in *sell value* and in §DROP-03's eight passive `LAKE_MAGIC_DB`
  trinkets — **0 of which are weapons**.
- `const DAGGER_ITEMS = [@24458` — the four magic daggers, priced to 8,000 gp — has exactly one
  consumer in 38,712 lines: the unreachable branch. No vendor stocks them.

So of the 70 generated main weapons, **56 have no grant path**, and so do 4 of 4 magic daggers.
§DOC-02ch later proved this by execution: 20,000 `_rollD100Loot()` calls at level 20 returned
**0 mainweapons and 0 daggers**; 20,000 monster-drop calls returned **0 positive-bonus weapons**.

**Why this matters more than a wrong sentence.** The review's recommendation — *signpost the
fishing path through a person* — shipped **three hours later** as `cfdeb21`, rewriting Yael's
Level-1 monologue, the first substantial text every new character reads, to say: *"Go north to
Yugurt, to the cabin… The smiths in this city cannot sell it; the lake can."* Per §FISH-01 the
lake node `BOO` is declared 59 lines too late and loses its cell to another node, so **the
fishing surface never renders**. The honesty fix made a vague pointer specific, and what it now
points at, precisely, is a subsystem the player cannot enter to collect a reward that was never
implemented.

*The review set out to stop the engine from promising what it would not deliver, and its
cheapest, lowest-risk face taught the engine to promise it louder.* That is not an argument
against the fix — it is the strongest possible argument for testing a negative before building on
it. Owned by **§FISH-01** (unblocks) and **§FISH-02** (the design call).

---

## VI. Finding 2 — the evidence for the flagship finding cannot be re-checked, because the string does not exist

§PLAY-01-A rests on a memorable measurement: *the literal string `"49 days"` appears **exactly
once in the entire 37k-line file**, in the Day-49 defeat flavor text.*

The file size is right (36,933 → *"37k"*). The cited line `23096` is right, and is byte-exact.
The count is not: **`"49 days"` occurs zero times**, at the parent build and at HEAD. What line
23096 actually contains is *"Day 49."* and *"forty-nine days"* — the number spelled out, in prose,
inside the message that fires when you have already lost.

**The finding is not weakened by this; it is strengthened.** The deadline was never rendered in
the digit form a player scans for — the review understated its own case. But the *evidence* was
recorded in a form that fails on re-check: a maintainer grepping `"49 days"` to confirm the gap
still exists finds nothing and may reasonably conclude it was closed. A claim about a literal
string is the cheapest kind to verify and the cheapest kind to get wrong, and this one was
transcribed from a line the author had open.

---

## VII. Finding 3 — the report prints a dead node code, in the document that flags dead node codes

§1 places the final battle *"at node CO."* **`CO` resolves in no build** — not the parent, not
HEAD, and it is not in `NODE_MAP` in any tree searched. The final battle is at
`TLS:{ num:42,@8726`, *Cosmic Realm — The Convergence*, reached through
`_isFinalBoss: true };@28011`.

This is §AUDIT-03m's rule — *never read a node code off a doc table* — and the review broke it in
§1 while **correctly diagnosing the same class in §7 (G)**, where it flags the docs for citing a
start node of `CI` when the real one is `LHR`.

And the G diagnosis is itself half-wrong, in the opposite direction. **`CI` is a live node** —
`CI: { num:429, name:"city"@9229`, *Chancery Court* — at the parent build and at HEAD. It is not
a stale code; it is a real node that is simply **not** the start node. The distinction is not
pedantry: it is why `const birkaNpcs = {@35139` was broken. The literal keyed Yael to `CI`, so her
card did not *fail* to render — it rendered **at the wrong node**, which is a different bug with a
different signature, and is what §DOC-02ch had to separate in a browser to establish. Of the five
original Birka keys, `IN`/`TV`/`BA`/`CY` are genuinely dead; `CI` never was.

Both belong to **§AUDIT-03ba**, whose census already scopes `CI` and `CO`.

---

## VIII. Finding 4 — two functions were called *deleted* that were never written, and the fix installed that error in `mechanics.md`, where it is live today

§PLAY-01-G reports that `mechanics.md` documents drop rates for `_rollMainWeaponDrop()` (15 %) and
`_rollWeaponDrop()` (12 %), and concludes: ***"Both functions are deleted."***

All four quoted doc claims are verbatim at the parent build — `mechanics.md:490` *"42 entries"*,
`:494` `minLevel = baseLv + magic × 4`, `:496` *"15 % per battle"*, `:511` *"12 % per battle"* —
and all four were genuinely wrong about the code. The review's *conclusion* is the error.

`git log -S` across **all** refs with **no pathspec** finds both symbols in exactly seven commits,
every one of them a documentation commit (`BACKLOG.md`, `plan-archive.md`, `mechanics.md`,
`mechanics-combat.md`, and this report). Re-run scoped to `*.html`: **zero commits, ever.**
Neither function has existed in the engine at any point in its recorded history. `mechanics.md`
was not describing deleted code — it was describing an API that was never implemented.

**The error outlived the fix and was promoted by it.** `ac651a3` corrected the numbers, and while
doing so wrote the review's diagnosis into the doc as fact. At HEAD, `mechanics.md:231` reads
*"The old parallel 15%/12% separate dagger and weapon rolls are retired"* and `:530` reads *"the
old `_rollWeaponDrop()` 12%/battle path is **deleted**."* A doc that had one wrong claim now has a
confident, sourced, wrong claim — §AUDIT-03m-FU exactly: **annotation without verification
launders a wrong claim into a live one.** → new row **§DX-02dn**.

---

## IX. Finding 5 — G fixed the code and left the doc, and the gate that would have caught it is switched off by classification

`a6a1ce7` remapped `birkaNpcs` to live codes (`LHR`/`TLL`/`MHQ`/`LLA`/`HKG`/`CDG`). Forty days
later `mechanics.md:854` still reads: *"The six curated Birka NPCs: Yael (CI), Brynn (IN),
Quill/Couperin (TV), Pachelbel/Deacon (BA), Weckmann (CY), Auros/Bruhns (CY)"* — the pre-remap
codes, four of which resolve to nothing.

The count is right and the cast is right; only the addresses are stale. This is a **live instance
of §AUDIT-03ab**: `mechanics.md` is listed in `HISTORY_FILES` in `scripts/legacy-codes.js`, whose
contract is *annotate, never rewrite* — so gate #16 **cannot report this line by classification**,
in the one file `prompt.md` §2 step 6 requires every increment to sync. → corroborates
**§AUDIT-03ab**, no new row.

A rider worth recording: the boss's rendered name is **Commander Seraphine Bruhns**
(`const BOSS_COMMANDER_AUROS = {@26246`); *"Commander Auros"* is the identifier and survives in
five prose strings. The review's *"Commander Auros (AC 22 / HP 300)"* has the statline exactly
right and the player-visible name wrong — the final-battle button reads *"Commander Bruhns."*
Already owned by the §AUDIT-03n naming cluster.

---

## X. What the review got right, and it is the load-bearing part

Every **design** judgement in this document survived contact with the engine.

- **The enemy-AI diagnosis is fair and complete.** `function _storyEnemyTurn() {@25191` at the
  parent build is, as described, roll `d20 + atk`, apply damage, end turn — no heal, no flee, no
  defend, no condition application. The only other actors in it are the player's own hireling and
  sentry. Summarising a 69-line function as three operations is a fair reading, not a lazy one.
- **The economy diagnosis is quoted verbatim from the code's own comments** — including the
  observation that movement and combat are timeless while sleep alone advances the clock, so the
  49-day doom is self-imposed. The user picked the review's option (c).
- **E was correctly predicted to be downstream, not standalone.** It never needed its own work.
- **The unifying theme is not decoration.** Sorting by honesty-vs-enactment is what shipped five
  faces in a day, and the theme has held up well enough that five child reports still use its
  vocabulary 37 days on.

The pattern across all four defects is worth naming, because it is the opposite of the usual one:
**this document is more reliable about the engine than about itself.** Its structural readings —
what combat *is*, what the economy rewards, why the toolkit feels light — are correct at 40 days.
Its four errors are all *citations*: a string count, a node code, a deletion that was not one, and
a scope word (*"exclusive"*) applied to a set with no members. Three sit in the tier marked
**"pure honesty fix — no design call"**, which is precisely the tier that ships without review.

---

## XI. Defects filed by this re-verification

| Row | Status | Substance |
|---|---|---|
| **§DX-02dn** | 🟠 NEW | `mechanics.md:231` and `:530` assert that `_rollMainWeaponDrop()` and `_rollWeaponDrop()` were retired/deleted; neither has ever appeared in any `*.html` in the repo history. Installed by `ac651a3`, the §PLAY-01-G fix. Two-line prose correction to *never implemented*. |
| **§AUDIT-03ab** | corroborated | `mechanics.md:854` documents the six Birka NPCs at four dead node codes, unreportable by gate #16 because `mechanics.md` is classified HISTORY. First concrete player-facing instance. |
| **§AUDIT-03ba** | corroborated | adds `CO` (never a node, cited as the final-battle location) and clarifies `CI` as a **live but wrong** node rather than a dead one. |
| **§FISH-01 / §FISH-02** | corroborated | this review is the **origin** of the tutorial pointer that makes §FISH-01 player-facing; raises its priority above content-backlog weight. |
| **§AUDIT-03n** | corroborated | `BOSS_COMMANDER_AUROS` renders as *Commander Seraphine Bruhns*. |

---

## XII. Dating appendix

- Report authored and shipped `3a0db52`, 2026-07-12; **no subsequent commit has touched it** —
  byte-exact at 40 days.
- Parent build `3a0db52^` = ship build (docs-only commit), 36,933 lines.
- Faces shipped the same day: `b46d3f0` (A) · `0883fa9`+`8eb909e` (B) · `caa489e` (C) ·
  `cfdeb21` (D) · `ac651a3`+`a6a1ce7` (G). F = §DEATH-01 `a52f9cd`. Track archived `f2e8d44`,
  2026-07-23.
- All 12 original line citations verified at the parent build; all 23 anchors in this rewrite
  re-pinned to HEAD (38,712 lines).

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
