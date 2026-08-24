<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — Friendships with Magic
### Session Postmortem, Layers 41–42 + Five Systems — Verified Against HEAD

**Subject:** `play.html` — single-file HTML5 D&D game engine, MIT License
**Written:** 2026-05-22 (updated 2026-05-24) · **Verified:** 2026-08-12 (§DOC-02o)
**Source state at writing:** 12,637 lines · Layers 0–42
**State at verification:** 38,712 lines · 416 nodes · 398 monsters · 111 terrains · 2,853 quests
**Classification:** Session record · Implementation audit · Design rationale

---

## Abstract

This report recorded one eight-hour session: verification of Layers 39–40, implementation of
Layers 41–42 (Birka NPC Favorability; the NPC world-truth dialogue system and four-branch victory
screen), and five new systems — waypoint exit highlighting, a Hunt Mode toggle, an Epic-Battleground
CHA negotiation check, guaranteed monster weapon drops, and a roll line shown on both outcomes.

Re-measured 82 days later: **34 of 40 named identifiers resolve (85 %)**, every surviving one under
its originally specified name, and the two most heavily specified systems (3 and 5) are byte-exact
including their colour values, damage-line format and button label. **Zero authoring errors were
found in any transcribed passage.** Every error in the document is in a *composed* one — a summary
figure, an invented DOM id, a paraphrased line of prose.

The finding is not about the document. **The report's central design claim — that the loop ends when
the player chooses people over efficiency — is no longer executable.** `_curseScore()` is
byte-identical to the day it was written, but the field it subtracts from has had no reachable writer
since 2026-05-29. Its value now has a hard floor of **20**, so of the four ending variants this
session shipped, **three are unreachable and the one that always fires is Groundhog Day Cursed**.
Separately, the "Covenant Keeper (True)" standing has been unreachable **since birth** by an
off-by-one: the score floor is −5 and the gate is ≤ −6.

A second design claim — System 4's *Finders Keepers* rule — was **deliberately reversed** by a later
layer, and the reversal left the original rationale standing as a live comment three lines above the
call that violates it.

---

## I. Method

Per §DOC-02 house method. Instruments applied: full-name batch census before reading (2); `git log -S`
on every dead symbol to separate RETIRED from NEVER SHIPPED (4); archive diff against
`git show 32c10c5:play.html`, the earliest surviving build, 2026-05-24 (8); copy-vs-compose as
the error predictor (12); a report's self-criticism and its reversals are claims (10, 13); a census
total cross-checked against a gate that counts the same set (14); both legs of a stated trade (16).

The delta table runs **both ways** (6): a specified behaviour absent from HEAD is an engine defect,
not a stale claim, until the archive says otherwise.

---

## II. Design Intent — and What Each System Was For

The session's thesis, stated once in the report and nowhere in the game: **Friendships with Magic.**
Not magic that wins battles — magic that becomes reachable because the player chose people over
efficiency. Every system below was built to make that choice *cost something and show something*.
This section is retained because it is the specification the delta table is measured against.

| System | Playability problem it solves | Mechanism |
|---|---|---|
| **1 · Waypoint exit highlighting** | The player knew *where* the waypoint was and not *which door*. Consulting the quest overlay on every step taxed the walk, which is the game's primary verb. | Tint the exit row leading toward the waypoint and tag it `▶ WP`. No new mode, no tutorial — a green rectangle. |
| **2 · Hunt Mode toggle** | A modal asked "Hunt or Warp?" on every long move. A per-trip question for what is really a standing preference. | Convert the decision into a persistent state bit. Configuration once, no friction after. |
| **3 · EB negotiation CHA check** | Asking for more money was a free button. No texture, no cost. | Roll CHA vs DC 17. **The NPC pays the ceiling either way** — the check prices *the asking*, not the money. Failure is a narrative beat with 1d4 non-lethal damage, not a denial. |
| **4 · Monster weapon drops** | Loot arrived only through a gated economy table, so the world never surprised the player. | Every kill drops a weapon whose die is bounded by the monster's. Auto-equip if better; last weapon unsellable. *"The market has restrictions. The world does not."* |
| **5 · Roll line on pass** | The roll appeared only on failure, so success felt like the system hiding its work. | Same panel, same format, different colour, both outcomes. Information density without decision density. |
| **Layer 41–42 · Favorability + endings** | Relationship needed a *readable consequence*, or helping people is decoration. | Four relationship tiers; a 12-bit `_missionComplete()` at ≥ 8; four endings, the best of which names each person helped. |

The through-line: **each system converts a decision into either information or configuration, and
never into a new screen.** That principle held — none of the five added an overlay, and four of the
five are still doing their job at HEAD.

---

## III. As-Built Inventory (HEAD, 2026-08-12)

**Live — 34 identifiers**, each under its originally specified name:
`function _weaponScore(w) {@24579` · `function _isLastWeapon(item) {@24600` ·
`const _wpDrop = _rollMonsterWeaponDrop@25430` · `const _monDmgDie = S.opp@25429` ·
`function _updateHuntBtn() {@38057` · `function storyToggleHunt() {@38068` ·
`function _curseScore() {@28193` · `const _EB_CODES = ['PRN'@28032` ·
`function _lubeckFriends()@23462` · `const FROBERGER_JOURNAL = [@27186` ·
`const _BASE_WEAPONS = [@24473` · `const WEAPON_ITEMS = [0, 1, 2, 3, 4]@24496` ·
`#eb-npc-cha-roll-line.cha-pass@3388` · `He's Fine — Continue →@4915` ·
`.exit-waypoint { background@2841` · `_updateExitLinks` · `_updateWaypointBtn` ·
`_missionComplete` · `_checkDearFriendUpgrade` · `storyCheckVictory` · `_getNPCDialogue` ·
`NPC_DIALOGUES` · `BIRKA_NPC_PROFILES` · `EPIC_BOSS_POOL` · `EB_NPC_DIALOGUE` ·
`SWEELINCK_DIALOGUE_VARIANTS` · `_npcFavor` · `_setNpcFavor` · `_renderNpcCard` ·
`npcFavorability` · `huntMode` · `surpriseAdvantage` · `roughWhiskeyUsed` · `yaelEscortUsed` ·
`_storyBattleVictory`.

**Dead — 6 identifiers**, all resolved by instrument 4:

| Symbol | Verdict | Evidence |
|---|---|---|
| `_bfsPath` | **RETIRED** | 5 occurrences at the archive, 7 commits, 0 at HEAD. Replaced by `_roadGridDir` on the 90×360 geo grid (§WALK/§NAV-01). |
| `storyCorridorTravel` | **RETIRED** | 2 at the archive, 3 commits, 0 at HEAD. Deleted by §CELL-11A. |
| `_stalkedMonsterPick` | **RETIRED** | 3 at the archive, 5 commits. Survives at HEAD only as the tombstone `_stalkedMonsterPick) removed with the Hunt feature@38252`. |
| `"⚡ Warped → …"` | **RETIRED, now FORBIDDEN** | 2 commits. Jump travel is invariant #3 — *no jump travel, ever*. The system as specified could not be re-shipped. |
| `btn-hunt-toggle` | **RETIRED** | 3 at the archive, 3 commits. HEAD's element id is `btn-hunt`. |
| `btn-dpad-stalk` | **NEVER SHIPPED** | **0 commits ever, 0 at the archive.** No element ever carried this id. |

---

## IV. Spec → Shipped Delta Table

Runs both directions. ✅ = shipped as specified · ⚠️ = shipped, changed · ❌ = specified, absent
(engine side) · **NOT SHIPPED** = claimed, never existed.

| # | Report claim | HEAD | Verdict |
|---|---|---|---|
| 1 | `_updateExitLinks()` computes the first step toward the waypoint before rendering exits | Does exactly this, via `wpDir = _roadGridDir(@37507` | ⚠️ contract kept, mechanism replaced |
| 2 | The whole `.exit-line` row becomes clickable, not just the link | `el.setAttribute('onclick', "cellMove('…')")` on every active row | ✅ |
| 3 | Waypoint row gets class `exit-waypoint`, `#22cc66` border | Class exact; border is now `var(--grn-lt)` = `#3A7A3A` | ⚠️ colour changed |
| 4 | A `▶ WP` pill badge marks the row | `<span class="exit-wp-tag">▶ WP</span>`, both render paths | ✅ byte-exact |
| 5 | `_updateWaypointBtn()` calls `_updateExitLinks()` at the end | Last statement of the function | ✅ |
| 6 | Exits are derived from the BFS path over `NODE_MAP` | Exits are **one cell only**, from the geo grid; the comment `// Waypoint BFS direction (§CELL-09)@37503` sits directly above a `_roadGridDir` call | ⚠️ stale comment, see F3 |
| 7 | `btn-dpad-stalk` was the center button being replaced | No such id, ever | **NOT SHIPPED** |
| 8 | `btn-hunt-toggle` replaces it; `S_story.huntMode` (default `false`) is the single state bit | The field is live and still defaults `false`; the element is `btn-hunt` | ⚠️ id renamed |
| 9 | `storyCorridorTravel()` rewritten to 18 lines, no modal | Function deleted entirely (§CELL-11A) | ❌ RETIRED |
| 10 | Hunt off ⇒ footpath travel warps instantly | Warp is **banned** (invariant #3) | ❌ RETIRED + forbidden |
| 11 | Hunt on ⇒ encounter weighted 6× toward quest-target monsters via `_stalkedMonsterPick()` | Hunt on ⇒ `baseRate * 2` capped at 0.8, and an 80 % bias toward monsters at/below the player's level | ⚠️ **different mechanic, same name** (§KG-01) |
| 12 | `_updateHuntBtn()` paints amber (warp) or green glow (hunt) | Live; toggles class `hunting` and rewrites `title` | ✅ contract kept |
| 13 | Negotiation rolls 1d20 + `floor((cha − 10) / 2)` vs DC 17 | `const roll   = Math.floor(Math.random() * 20) + 1;@30294`, `total >= 17` | ✅ byte-exact |
| 14 | CHA 8 ⇒ −1 modifier, needs a natural 18 | 18 − 1 = 17 ≥ 17 | ✅ arithmetic exact |
| 15 | Pass panel `#44ee88` / `#051a0d` / `#22cc66` | `#eb-npc-cha-roll-line.cha-pass@3388`, all three values | ✅ byte-exact |
| 16 | Fail: anger block — *knee, elbow, face-first, two seconds, stands over you* | Shipped text is *knee, **fist**, face-first, stands over you, chest heaving*; no "two seconds" | ⚠️ paraphrase, see F6 |
| 17 | Damage line `💢 N non-lethal damage — HP X / Y` | Byte-exact format string | ✅ |
| 18 | 1d4, minimum 1, HP cannot drop below 1 | `S_story.hp     = Math.max(1, (S_story.hp || 1) - dmg);@30313` | ✅ |
| 19 | "He's Fine — Continue →" button restores the payment section | Label byte-exact; handler restores both hidden sections | ✅ |
| 20 | The NPC pays the ceiling in **all** cases | Both branches set `paymentCeiling` | ✅ |
| 21 | Panel reset at modal open, not at exit | Reset block at `@30261` | ✅ |
| 22 | Roll line moved to a sibling above the fail panel, shown on both outcomes | DOM order and both display paths exact | ✅ |
| 23 | `_weaponScore(w) = die × count + magicBonus × 2` | Byte-identical archive → HEAD, 82 days | ✅ |
| 24 | `_isLastWeapon()` blocks selling into an empty weapon slot; filters `storySellAll` / `storySellEquipment` | Both filters present, and the guard was **widened** to the off-hand `weapon` slot the report did not mention | ✅ + extended |
| 25 | Drop pool = `w.die <= monsterDmgDie` and tier not owned; **no `minLevel`, no `_magicTierAllowed()`** | Pool adds `&& w.magicBonus === 0`; the level gate is still absent — because a base-tier cap makes it moot | ⚠️ **REVERSED**, see F2 |
| 26 | Flat-random across eligible entries | `_seededNext()` (invariant #6, §VM-01-B) | ⚠️ improved |
| 27 | *"A Level 3 player fighting a berserker (dmgDie 12) could receive a +4 Lance"* | True at the archive (`+4_lance` has `minLevel: 20`, bypassed). **Impossible at HEAD.** | ⚠️ correct when written |
| 28 | Auto-equip when `_dropScore > _curScore`; old weapon to inventory; `_autoEquipped: true`; green `svo-drop.auto-equipped` with `— ⚔ Equipped!` | Every element byte-exact | ✅ |
| 29 | Layer 41 adds `BIRKA_NPC_PROFILES`, six full portraits | Live; §NPC-01-B took it to **204 profiles** | ✅ scaled ×34 |
| 30 | Layer 42 adds `NPC_DIALOGUES` — 6 NPCs × 4 states × 5 quotes | 4 states exact (`impartial` 213 / `friendly` 212 / `dearFriend` 209 / `questActive` 201); **213 keys** | ✅ scaled ×35 |
| 31 | *"Pit-Fighter Weckmann"* is one of the six | Shipped under key **`crov`** | ⚠️ the §AUDIT-03n two-name split, present here too |
| 32 | `_missionComplete()` evaluates 12 mission bits, true at ≥ 8 | 12 bits, `>= 8`, byte-exact | ✅ — but see F1 |
| 33 | Four ending variants branch in `storyCheckVictory()` | All four branches present in source | ⚠️ **3 unreachable**, see F1 |
| 34 | Groundhog Day fires when the Void is sealed and curse ≥ 15 | `curse >= 15` is the branch, and it is now **always true** | ⚠️ see F1 |
| 35 | Journal: **17 entries** (§I and §VII) | **41** — at HEAD *and* at the archive | ❌ wrong when written; the same report says 41 in §IV |
| 36 | Weapons: **70 (14 base × 5 magic tiers)** | `_BASE_WEAPONS` = 14, `WEAPON_ITEMS` = 14 × 5 = **70** | ✅ exact, 82 days |
| 37 | Monsters 370 across 66 terrain entries | Exact at the archive; **398 / 111** at HEAD | ⚠️ scaled |
| 38 | Nodes 71 (42 story + 7 junctions + MT + SL + 20 EB) | Internally consistent; 76 at the archive two days later; **416** at HEAD. `junction:true` is now a CI failure (`check:invariants` I1/I2) | ⚠️ scaled; one component forbidden |
| 39 | §III thesis: *"Every BFS use is the same BFS — `_bfsPath(from, to)`, the graph is `NODE_MAP`"* | `_bfsPath` 0 occurrences; routing is road-weighted over a 90×360 cell grid | ❌ RETIRED |
| 40 | §III thesis: *"Every new mode is a boolean in `S_story` and `_S_DEFAULTS()`"* | All four named fields live and still declared in `_S_DEFAULTS()` | ✅ holds |
| 41 | §III thesis: *"the stat block is self-contained — `_rollMonsterWeaponDrop()` reads `S.opp.dmgDie` without a lookup"* | `const _monDmgDie = S.opp@25429` — the only `S.opp.dmgDie` read in the file | ✅ holds |
| 42 | §V lineage: 18 lab reports | All 18 existed when written; **3 deleted by `120d617`** | ✅ correct when written, see F5 |

---

## V. Findings

### F1 — Three of the four endings are unreachable, and the one that always fires is the failure ending. → §ENDING-01

`function _curseScore() {@28193` is **byte-identical between the archive and HEAD** — 82 days, zero
drift. It partitions the 20 Epic Battlegrounds into returned / started-not-returned / never-started
and returns `(startedNotReturned × 3) + (neverStarted × 1) − (allComplete ? 5 : 0)`.

`returned` reads `S_story.ebReturnDone`. Its only writer is
`S_story.ebReturnDone[ebCode] = true;@30365` inside `function _storyEbReturnBeat(ebCode) {@30360`,
which **§EPIC-01 proved unreachable**: `c1d5a94` (2026-05-29) renamed the `NODE_MAP` keys and left the
forty `QUEST_DB` epic ids as `quest_ef_*`, so every site that *computes* `'quest_' + code.toLowerCase()
+ '_return'` now addresses a phantom namespace. Independently re-confirmed here: `quest_prn_primary`
has 0 occurrences, `quest_ef_primary` exactly 1.

With `returnsComplete` pinned at 0, the arithmetic collapses to a closed form:

> **curse = 20 + 2 × (EB bosses defeated)**, range **20 … 60**.

Consequences, all measured at HEAD:

- `if (missionDone && curse <= 0)` — **Covenant Keeper, dead.** The one ending that names each person
  the player helped; the payoff the whole Layer-42 relationship system exists to deliver.
- `else if (curse <= 0)` — **Standard Covenant, dead.**
- `else if (curse >= 15)` — `Sweelinck sets the journal on the table@28260`, *"The Void is sealed. The
  curse is not in the Void."* — **fires 100 % of the time.**
- The final `else` (Mixed) is dead: the window `0 < curse < 15` cannot be entered.
- Sweelinck's Last Question collapses the same way — always `Were you alone by choice?@28278`.
- **2 of the 12 mission bits are permanently false**: `allEbReturns: Object.keys(NPC_DIALOGUES)@23657`
  (needs ≥ 5 returns) and `noHighCurse: _curseScore() < 10@23661` (floor 20). `_missionComplete()`
  still needs 8, now out of an effective 10.

**Verdict: engine-rot, dated.** At the archive the epic ids resolved, so all 20 returns were
achievable and `curse = −5` was reachable. The endings worked when this report was written and broke
75 days ago. Fixing §EPIC-01 restores all three.

**F1b — a separate, born-broken off-by-one.** `const _isTrue = missionDone && curse <= -6@28231`
gates the *"Covenant Keeper (True)"* standing. The best attainable score in a fully working engine is
`0 + 0 − 5 = −5` — the `(allComplete ? 5 : 0)@28206` bonus is the only negative term and it is worth
exactly 5. **`curse <= -6` is unsatisfiable by construction**, and the same threshold is present at
the archive. This one does **not** wait on §EPIC-01: it has never been winnable.

### F2 — *Finders Keepers* was deliberately reversed, and its rationale is still in the code. → §FISH-02 (origin document)

The archive's `_rollMonsterWeaponDrop` is byte-exact to this report's spec, comment included:
`// Finders Keepers: no level/magic restrictions — die constraint only`. HEAD's is not:

- `WEAPON_ITEMS.filter(w => w.die <= monsterDmgDie && w.magicBonus === 0@24589` — magic tiers excluded.
- `const deg = Math.min(0, d6 - 5)@24594` — a −4…0 degradation roll, prefixing *Wrecked / Rusted /
  Chipped / Worn*.
- Justified in place by `FC06: monster drops capped at base tier@24588`, which continues *"fishing is
  the only source of +bonus weapons"* — the giving half §DOC-02n measured as never built.

**The call site still carries the original rationale.** `no level/magic gate (Finders Keepers)@25428`
sits one line above `const _wpDrop = _rollMonsterWeaponDrop@25430`. Two comments in one call chain
assert opposite contracts, ~800 lines apart, both live.

**Census correction (instrument 14).** §DOC-02n / §FISH-02 record *"48 of 60 `WEAPON_ITEMS`"*.
`const _BASE_WEAPONS = [@24473` holds **14** entries and `const WEAPON_ITEMS = [0, 1, 2, 3, 4]@24496`
is a `flatMap` over five tiers: the set is **70**, and the unreachable count is **56 of 70**. Same
fact, corrected figures — only the 14 `magicBonus: 0` entries have a live grant path.

**F2b — the penalty is applied and not disclosed.** A degraded weapon carries `magicBonus: -1…-4`,
which `S.weapon.flatMod = mw.magicBonus@24671` feeds straight into attack and damage. Three of the
four surfaces that render a bonus print it **only when positive** — `_wpCopy.magicBonus > 0 ? ' +'@25444`
(victory drop line), `const tag = mw.magicBonus > 0 ? dieStr@30920` (inventory tag),
`it.magicBonus > 0 ? ' +' + it.magicBonus + ' atk/dmg'@31097` (item detail). Only the Character Sheet
Main Hand row signs it. **A "Wrecked Long Sword" reads as a plain Long Sword everywhere the player
picks it up**, while quietly costing −4 to hit and damage. The display code was written when a bonus
could only be ≥ 0; the nerf did not revisit it.

### F3 — A tombstone that outlived its own corpse

`_updateHuntBtn / storyToggleHunt removed@38096` states that §TIMELESS-01 removed both functions.
`function _updateHuntBtn() {@38057` and `function storyToggleHunt() {@38068` are declared **39 and 28
lines above that comment**, are live, and `_updateHuntBtn()` is called from `storyRender`. §KG-01
re-minted both names in place for a *different* mechanic and left the tombstone standing.

This is §DOC-02c's retired-vocabulary hazard in its sharpest live form — the collision is not merely
undated, it is **contradicted within one screenful**. Two milder instances found the same pass:
`// Waypoint BFS direction (§CELL-09)@37503` sits directly above a `_roadGridDir` call, and
`no level/magic gate (Finders Keepers)@25428` (F2).

### F4 — The journal count is wrong twice, in the summary, and right once, in the prose

§I and the §VII metrics table both state **17** journal entries. §IV states **41**.
`const FROBERGER_JOURNAL = [@27186` holds **41 at HEAD and 41 at the archive** — §DOC-02i measured it
as the only design constant in the corpus that has not moved in 79 days. So **17 was wrong on the day
it was written**, twice, and the report contains its own correction.

This inverts §DOC-02h's rule rather than confirming it: here the *narrative* passage is right and the
*metrics table* is wrong. Consistent with instrument 12 — the 41 in §IV is quoted from the artifact
while arguing a point about it; the 17 is a summary figure recalled to fill a row.

### F5 — The lineage table had zero authoring errors; three of its entries have since been deleted

15 of 18 files exist. `lab-report-loot-drop-weapon-economy.md`, `lab-report-plan-cleanup-v13.md` and
`lab-report-plan-cleanup-v17.md` do not — and all three have **2 commits each: a create and a delete
by `120d617`**, the commit §DOC-02b/§DOC-02i already recorded as removing six lab reports. The
misspelled entry `lab-report-story-codoex-curse-of-knowedge.md` is the **actual filename on disk**,
not a citation error. *A missing file is not a wrong citation — instrument 4 is what separates them.*

### F6 — Instrument 12, on the finest grain the program has measured

Every measured error in this document is in a composed passage; nothing transcribed is wrong.

| Passage kind | Facts checked | Errors |
|---|---|---|
| Formulae quoted from code (`_weaponScore`, CHA modifier, DC 17) | 6 | **0** |
| DOM ids, class names, colour triples, format strings, button labels | 14 | **1** (`btn-dpad-stalk`, 0 commits ever) |
| Numeric summary rows (§VII table) | 9 | **2** (17 journal entries; the 71-node breakdown) |
| Paraphrased prose (anger block, §IV) | 1 | **1** (elbow / "two seconds") |

The single fabricated identifier and the single bad paraphrase sit in the two sentences that were
*narrated* rather than pasted. `btn-hunt-toggle`, named in the same sentence as `btn-dpad-stalk`,
is real — **half the sentence was copied and half was recalled.**

---

## VI. Corpus Note — Two Same-Day Reports Specify Opposite Negotiation Semantics

`lab-report-epic-battlegrounds.md`, also dated 2026-05-22, specifies that failing the negotiation is
**not punished**; §EPIC-03 was filed against HEAD on that basis. **This report explicitly designs the
punishment** — *"the NPC still pays but expresses their displeasure physically"*, 1d4 non-lethal,
floor 1 — and the engine implements this one, line for line.

So §EPIC-03's "is the damage intended?" half is **answered by measurement**: it is a deliberate,
documented override, made the same day. What survives as a real defect is the half this report never
considered — **the ceiling equals the floor on 16 of the 20 contracts**, so on those 16 negotiating
can only cost HP and can never gain gold. The design is coherent exactly where ceiling > floor: 4 of 20.

Also traceable to this specification: `const roll   = Math.floor(Math.random() * 20) + 1;@30294` and
the 1d4 at `@30311` are **two unseeded `Math.random()` calls writing persisted `S_story.hp`**
(invariant #6 · §DX-02m · §EPIC-03). Both predate §VM-01-B, which moved the quest-path d20 to the
seeded stream and never reached surfaces that roll their own.

---

## VII. State Then and Now

| Metric | 2026-05-22 (claimed) | Archive `32c10c5` | HEAD 2026-08-12 |
|---|---|---|---|
| Lines | 12,637 | 14,377 | 38,712 |
| Nodes | 71 | 76 | 416 |
| Monsters / terrains | 370 / 66 | 370 / 66 | 398 / 111 |
| NPC dialogue sets | 6 | 6 (`crov`, not `weckmann`) | 213 (204 profiles) |
| Journal entries | 17 *(and 41 in §IV)* | **41** | **41** |
| Weapons | 70 (14 × 5) | 70 | **70** |
| Ending variants | 4 | 4 reachable | **4 declared, 1 reachable** |
| Quests | — | — | 2,853 |

The report's line/node figures cannot be checked at 2026-05-22 — no build survives from that day; the
nearest is two days later. Both are internally consistent and are recorded as unverifiable, not wrong.

---

## VIII. Defects Filed

| Row | Premise | Design call? |
|---|---|---|
| **§ENDING-01** *(new)* | `_curseScore()` floor is 20 because `ebReturnDone` has no reachable writer → Covenant Keeper, Standard Covenant and Mixed are all unreachable; Groundhog Day Cursed is the only ending the game can produce; 2 of 12 mission bits permanently false. **Resolved by fixing §EPIC-01** — sequence behind it. | No |
| **§ENDING-01 (b)** *(new)* | `missionDone && curse <= -6@28231` against a score floor of −5: the *"Covenant Keeper (True)"* standing is unsatisfiable and always has been. One-character fix, but which threshold is intended is the author's call. | Small |
| **§FISH-02** *(extended)* | Denominator corrected: **56 of 70** `WEAPON_ITEMS` unreachable, not 48 of 60. Adds **F2b**: negative `magicBonus` is applied to attack/damage but hidden on 3 of 4 render surfaces. Adds the live-comment contradiction (`Finders Keepers@25428` vs `FC06@24588`). | Existing |
| **§AUDIT-03aa** *(extended)* | Second instance of the class, and stronger: `_updateHuntBtn / storyToggleHunt removed@38096` is refuted by declarations 39 and 28 lines above it. Adds the stale `// Waypoint BFS direction (§CELL-09)@37503`. Argues the wanted detector is *"a comment asserting removal of a symbol that resolves"* — mechanically checkable. | No |
| **§EPIC-03** *(narrowed)* | The damage-on-fail half is **answered**: deliberate, specified by this report, implemented faithfully. What remains open is ceiling == floor on 16 of 20, which makes negotiation strictly dominated there. | Small |
| **§FISH-01** *(impact note)* | Yael's Level-1 tutorial monologue directs every new player to *"go north to Yugurt, to the cabin, and find the old man… the water gives up what no shop stocks."* Per §FISH-01 the lake node can never render its fishing surface. The tutorial points at the unreachable feature. | No |

---

## Appendix — Lineage Table, Re-Checked

The §V lineage list cited 18 reports. **All 18 existed when written**; 15 are still on disk. The
three that are not each carry exactly two commits — a create and a delete by `120d617`:
`lab-report-loot-drop-weapon-economy.md` (weapon tiers; sell/buy asymmetry),
`lab-report-plan-cleanup-v13.md` (spec lifecycle) and `lab-report-plan-cleanup-v17.md` (shield
stacking; spell DC inflation). The misspelled `lab-report-story-codoex-curse-of-knowedge.md` is the
literal filename on disk. Five of the surviving entries have since been verified by this program:
§DOC-02c, §DOC-02d, §DOC-02f, §DOC-02j, §DOC-02l, §DOC-02m.

---

## Conclusion

The engineering in this session has aged unusually well. Two systems are byte-exact 82 days on, one
survived a total world-coordinate migration with its contract intact and every line rewritten, and
the relationship architecture it introduced scaled from 6 characters to 213 without a change to the
shape it defined. Nothing the author transcribed was wrong.

What did not survive is the thesis. *Friendships with Magic* names a payoff — an ending that reads
back the name of every person you stopped for — and that ending is currently unreachable, because a
rename in a different subsystem orphaned the quest ids a curse score is computed from. The player
still helps Yael, still wins Quill's cipher, still seals the Void, and is still told: *the curse is
not in the Void. Come back when you're ready.*

The report closes on the observation that a check nobody runs reports green. This is the same failure
one level down: **a payoff nothing tests reports shipped.** All four endings are in the source. Three
of them are decoration.

---

*Report written 2026-05-22, updated 2026-05-24. Verified against HEAD 2026-08-12 (§DOC-02o).*
*Original claims are preserved; nothing measured as unshipped has been deleted.*

---

*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
