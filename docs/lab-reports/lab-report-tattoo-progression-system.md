<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — Tattoo Progression & Chronicle: Persisting Character Identity Across the Death Boundary

**IEEE Game Design & Systems Analysis — Technical Report**
**CodexOfConquest.com · Layer Reference: §XLII – §XLVII**
**Original:** 2026-05-25 · **Ship commits:** `1445fc4` · `cab8865` · `e1c91e8` · `aef1650`
**Verified against HEAD:** 2026-08-12 (§DOC-02am) · original 608 lines → 492
**Status:** ✅ SHIPPED, mechanism intact at 79 days · ⚠ 3 specified behaviours absent, 1 live defect

---

## Abstract

This report specifies and verifies two interlocking persistence systems that answer a single design
question: *when the player dies and loses everything, what should they be allowed to keep?*

The **Tattoo System** answers "who you decided to become." Progression choices — starting scores,
ability-score improvements, hit-point rolls, and death events — are written to `S_story.tattoos[]`,
an array that lives outside the droppable inventory and therefore survives the death strip
unconditionally. The **Chronicle System** answers "what you have actually done," maintaining two
parallel ledgers of passive telemetry: `runStats` for the current life and `careerStats` for all
lives. A time-of-day clock supplies sub-day resolution so a death can be stamped with an hour as
well as a day.

Both systems are deliberately **passive**: they add no verbs, no buttons, and no decisions. Their
entire contribution to playability is *legibility* — they make the game's harshest moment produce a
readable artifact instead of only a loss.

Verification at 79 days finds the architecture sound and the mechanism durable: **55 of 59 named
symbols resolve (93 %)**, `storyRespawnFromCheckpoint()` is byte-identical to its specification, and
all **14 Chronicle hook sites are live**. Three specified behaviours did not ship — two tattoo
subtypes (`asi`, `hp_roll`, **0 commits ever**) and the reconstruction algorithm that depended on
them — and one live defect is recorded: **the death that writes a tattoo is the one death that never
resets the run ledger.**

**Index Terms** — ability score improvement, career statistics, character persistence, death
mechanics, hit point progression, meta-progression, roguelite design, tattoo ledger.

---

## I. Introduction — The Problem the Tattoo Solves

The system employs an item-drop death penalty: on death, carried inventory and all gold are left on
a corpse at the death location, recoverable by returning to it. This is the intended source of
tension — it makes retreat a real decision and makes a deep push a real wager.

The penalty has a failure mode. If *progression* is expressed as items, then death does not merely
cost the player their loot; it costs them their character. Hours of accumulated identity evaporate
in one failed death save, and the player's rational response is to stop taking risks — which
disables the mechanic the penalty existed to create.

The Tattoo System resolves the tension by **bifurcating the inventory by container, not by flag**.
Standard items occupy `S_story.inventory[]` and are subject to the drop rule. Progression decisions
are written to `S_story.tattoos[]`, a sibling array that the death routine simply never touches.

> *"Your tattoos record every level-up decision. They outlive you — the body remembers."*
> — `charcreate-sub@4963`, the character-creation screen, which states the entire contract in
> nineteen words.

The Chronicle System extends the same split to statistics, and adds the observation that a roguelite
has two legitimate time horizons: how *this* life is going, and how *all* lives have gone.

**Contributions verified by this report:**

1. The tattoo as an inventory object with defined fields, render rules, and death-survival semantics.
2. The Chronicle schema, hook sites, reset semantics, and display architecture.
3. A balance comparison of Hard Mode (10/8/8/8/8/8) against point-buy Custom Build.
4. A death tattoo encoding temporal (day + hour) and spatial (node) coordinates.
5. **New in this revision:** a spec→shipped delta table and four defect rows.

---

## II. Verification Method

Per the §DOC-02 program:

1. **Batch census first.** All 59 named symbols run through one `grep -cF` loop against
   `play.html` before reading a line of the report body.
2. **Instrument 4** — `git log -S` on every symbol the census marks dead, separating **RETIRED**
   (shipped, later removed) from **NEVER SHIPPED** (written from intent).
3. **Instrument 8** — claims about the past adjudicated against the archive
   (`git show aef1650:play.html`), never against HEAD.
4. **Reachability** — for every specified behaviour, the *call path* is traced, not just the symbol.
   This is what produced Finding 1.
5. **Instrument 12** — worked examples and illustrations scored separately from transcribed data,
   on the copy-vs-compose axis. This is what produced Finding 5.

---

## III. As-Built Architecture

### III-A. The Persistence Tiers — Four, Not Three

The original report specified three tiers. HEAD has four; the droppable tier is split by item type.

| Tier | Store | Death behaviour | Anchor |
|---|---|---|---|
| 1 | `S_story.tattoos[]` | Survives unconditionally — never touched by the death routine | `const _survivingTattoos@23926` |
| 2 | `careerStats` / `runStats` | `careerStats` snapshot-restored; `runStats` reset *on one path only* (§V-A) | `const _STAT_ZERO = () => ({ kills:0@23916` |
| 3a | `inventory` where `type ∈ {shard, key}` | **Survives** — filtered out before the strip | `const critTypes = new Set(['shard', 'key']);@25967` |
| 3b | all other `inventory` + all gold | Moved to the corpse quest; replaced by a fresh starter dagger | `S_story.inventory = [...critItems, Object.assign({}, STARTER_DAGGER)];@25994` |

Equipped weapons also survive, because they live in `equippedWeapon` / `equippedMainWeapon` rather
than in the inventory array. The player is told this truthfully in the death message
(`§DEATH-01 Inc A (finding #1a)`): *"Your equipped gear and Codex shards stayed with you."*

### III-B. Tattoo Object Schema — Three Writers, Two Subtypes

There are exactly three sites in 38,712 lines that write a tattoo.

```js
// 1. Baseline — storyNewGame(), subtype:'baseline'@23966
{ type:'tattoo', subtype:'baseline', icon:'🌑', lvl:0, name:'Origin', sell:0, drop:false,
  desc:'Baseline · STR 10 · DEX 8 · CON 8 · INT 8 · WIS 8 · CHA 8',
  baselineScores: Object.assign({}, scores) }

// 2. Level-up — one per level, NO subtype field, keyed on FIGHTER_FEATURES[lvl]@38665
{ type:'tattoo', icon: feat.icon, name: tattooName, lvl, feature: feat.name, desc, sell:0,
  hpResult, bonusHpRoll, asiChanges, goldGift, shieldGift }

// 3. Death — _storyDeathSaveFall(), subtype:'death'@25982
{ type:'tattoo', subtype:'death', icon:'💀', lvl:S_story.level, name:'Fallen', sell:0, drop:false,
  desc:'Day 12 · 14:00 · Birka Slums',
  deathDay, deathHour, deathNode, deathNodeName, corpseQuestId: corpseQuest.id }
```

The level-up tattoo is a **merge** of the two subtypes the original specified separately. It carries
the ASI delta (`asiChanges`) and the HP roll (`bonusHpRoll`, `hpResult`) on one record, and it is
richer than either: it also names the Fighter feature earned at that level and any gold or shield
gift. A level-4 tattoo is a single line reading *Iron Discipline · HP d10:7+1CON=8 · ASI: STR+2*.

### III-C. Reconstruction — a Property, Not a Routine

The original stated that the ledger is "the canonical source of truth for character statistics" and
that a character "can be fully reconstructed from tattoos alone." **Neither is implemented.**
`S_story.abilityScores` and `S_story.hpMax` are the live stores; tattoos are written *from* them at
level-up and are never read back. No code sums `asiChanges` or `bonusHpRoll` across the ledger.

The ledger is a **derived, append-only audit log** — which is a perfectly good thing to be, and is
what every one of its three readers actually treats it as. The reconstruction claim is aspiration
recorded as fact. **NOT SHIPPED — kept.**

### III-D. Respawn Preservation

`function storyRespawnFromCheckpoint()@23924` is **byte-identical** to the original specification
across 79 days, save for one comment. It snapshots both survivors, loads the older checkpoint, keeps
whichever tattoo set is longer, carries `careerStats` forward unconditionally, and zeroes `runStats`
and `hour`.

---

## IV. Starting Modes

### IV-A. Hard Mode — `str:10, dex:8, con:8, int:8, wis:8, cha:8`

52 points against the standard array's 72. Verified byte-exact at four sites, including
`const _S_DEFAULTS = () => ({@23063`. Hard Mode's purpose is ledger legibility: with a flat floor,
**every point above 8 in the final sheet is traceable to a tattoo**, so the ledger reads as pure
player choice rather than as character-creation noise.

### IV-B. Custom Build — Point-Buy

Verified verbatim, 4 of 4 symbols:

```js
const _CC_COST = [0,1,2,3,4,5,7,9];   // @38564
const CC_BUDGET = 27;                  // @38565
function _ccCost(score) { return _CC_COST[Math.max(0, Math.min(7, score - 8))]; }
function _ccSpent() { return Object.values(_cc_scores).reduce((s,v) => s + _ccCost(v), 0); }
```

**Table I — Mode Comparison**

| Property | Hard Mode | Custom Build |
|---|---|---|
| Starting total | 52 pts | ~65–72 pts |
| Agency at creation | None (fixed) | Full (point-buy) |
| STR 20 reached | Lv 14 | Lv 8 |
| Ledger baseline | Fixed | Player-defined |
| Recommended for | Experienced players | New players |

---

## V. Chronicle System

### V-A. Schema and Hooks

`_STAT_ZERO()` ships with all 10 specified fields, byte-exact, and `function _statTally(key, n)@23917`
null-guards both ledgers for backward compatibility with pre-Chronicle saves.

**Table II — Hook Site Verification: 14 of 14 live**

| Stat | Site | Anchor |
|---|---|---|
| `battlesAttempted` | all battle types | `_statTally('battlesAttempted', 1);@24644` |
| `attacksAttempted` ×2 | main + offhand, per swing | `@25057` · `@25108` |
| `attacksHit` ×2 | main + offhand hit branch | `@25081` · `@25128` |
| `dmgDealt` ×2 | main + offhand hit branch | `@25080` · `@25127` |
| `dmgReceived` ×2 | enemy turn + EB negotiation fail | `@25243` · `@30312` |
| `kills` | battle victory | `@25295` |
| `deaths` | death fall | `_statTally('deaths', 1);@25997` |
| `exitsTaken` | grid move | `_statTally('exitsTaken', 1);@28367` |
| `sleeps` + `daysAdventuring` | sleep confirm | `@36297` · `@36298` |

**One host name is stale, and the hook is not.** The original named `storyMove()` as the
`exitsTaken` site. `storyMove` was deleted as `storyMove_LEGACY` by `85cc43e` (§CELL-11A), but the
hook was **re-homed** into the §WALK/§NAV-01 grid mover at `function cellMove(dir)@28347`. Behaviour
correct, name RETIRED.

`deaths` is tallied **after** the inventory strip (`@25992` strips, `@25995` tallies), not before as
the original's condition column stated. The *tattoo* is written before the strip; the original
conflated the two writes.

### V-B. The Time-of-Day Clock

`S_story.hour` (0–23), +1 per battle at `@24649`, +6 per sleep at
`S_story.hour = ((S_story.hour || 0) + 6) % 24;@36282`. Verified. The clock is decoupled from the
49-day void timer and affects no balance system — it exists solely so a death tattoo can say
*14:00* instead of only *Day 12*.

### V-C. Display — Three Surfaces, Not Two

| Surface | Reads | Anchor |
|---|---|---|
| Game-over modal, "This Run" | `runStats`, 9 rows + hit rate | `function _populateGameoverChronicle()@23854` |
| Character sheet, Progression | level-keyed tattoos | `const tattooByLvl = {};@37610` |
| Character sheet, Deaths | death tattoos | `const deathTattoos = (S_story.tattoos || []).filter@37686` |
| Character sheet, Chronicle | both ledgers, two columns | `const isFirstRun@37831` |
| **Inventory sheet, Character Tattoos** | **all tattoos, newest first** | `makeSection('⚔ Character Tattoos');@31247` |

The inventory sheet section is an **undocumented expansion** — the original claimed two render
locations. It is the only surface that shows the whole ledger in one list.

`_populateGameoverChronicle()` matches its specification row-for-row, including the `hasData` guard
that suppresses the panel on an instant death with nothing to report.

---

## VI. Spec → Shipped Delta Table

| # | Specified | At HEAD | Verdict |
|---|---|---|---|
| 1 | 4 tattoo subtypes | 2 subtypes, 3 writers | **NEVER SHIPPED** (`asi`/`hp_roll`, 0 commits) |
| 2 | Ledger is canonical, reconstructable | Derived append-only log; no reader sums it | **NOT SHIPPED** |
| 3 | `drop:false` checked by death routine | 5 writes, **0 readers** | **NEVER SHIPPED** (§V-C findings) |
| 4 | `sell:0` checked by vendor | Vendor reads `inventory`; tattoos are not in it | **INERT — correct by container** |
| 5 | Tier 3 "inventory cleared on death" | shard/key survive + free dagger granted | **WRONG WHEN WRITTEN** (instrument 8) |
| 6 | `runStats` reset on respawn | One reset site, unreachable from the main death | **DEFECT → §AUDIT-03an** |
| 7 | `hour` reset on respawn | Same site, same reachability | Behaviourally benign (§VII-A) |
| 8 | `_S_DEFAULTS()` calls `_STAT_ZERO()` | Hand-written literals ×2 | **DRIFT → §DX-02ay** |
| 9 | `exitsTaken` at `storyMove()` | Re-homed to `cellMove()` | **RETIRED name, live hook** |
| 10 | `deaths` tallied before strip | Tallied after | Stale detail |
| 11 | 10 Chronicle fields | 10, byte-exact | ✅ |
| 12 | 14 hook sites | 14, all live | ✅ |
| 13 | ASI at 4/6/8/12/14/16/19 | Exactly 7 `asi:true` at those levels | ✅ |
| 14 | Point-buy `[0,1,2,3,4,5,7,9]`, 27 pts | Verbatim | ✅ |
| 15 | Hard Mode 10/8/8/8/8/8 | Verbatim ×4 | ✅ |
| 16 | `storyRespawnFromCheckpoint()` body | Byte-identical | ✅ |
| 17 | Death tattoo written before strip | Verbatim, in position | ✅ |
| 18 | 2 render surfaces | 4 sections across 3 sheets | **EXPANSION** |
| 19 | §IX-C level-20 HP totals | Omits 4 bonus-d10 levels | **WRONG → §VII-B** |

---

## VII. Findings

### VII-A. FINDING 1 — The death that writes the tattoo is the death that never resets the run

`S_story.runStats    = _STAT_ZERO();@23935` and `S_story.hour        = 0;@23936` occur at
**exactly one site each**,
both inside `storyRespawnFromCheckpoint()`. That function has two callers:

1. `btn-gameover-respawn@38310` — the game-over modal button.
2. `_onPitChampionLoss()@27930` — losing the optional Birka pit championship.

Combat death does not reach either. The death-save mini-game resolves to `_storyDeathSaveCrawl()`
(3 successes → survive at 1 HP) or `function _storyDeathSaveFall()@25952` (3 failures). The fall
path writes the death tattoo, tallies `deaths`, strips the player, and **respawns inline** —
`S_story.currentCode = S_story.checkpointNode || 'LHR'` followed by `storyEnter()`. It never opens
the game-over modal and never calls the respawn function.

**Consequence.** After the first ordinary death, `runStats` keeps accumulating. `isFirstRun` goes
false, so the character sheet lifts the suppression on the "All Lives" column — and then renders
**two columns that are element-for-element identical**, labelled *This Life* and *All Lives*. The
two-horizon design that is the Chronicle's entire reason for having two ledgers collapses to one
ledger displayed twice, at precisely the moment the second column is first shown.

The specification is not wrong about the mechanism — `storyRespawnFromCheckpoint()` does exactly
what §III-D says. It is wrong about the **path**, and no symbol census could see that: every
identifier resolves, the function is correct, and the call simply is not made. Filed **§AUDIT-03an**.

*The hour clock is the benign half of the same wiring.* Never resetting a world clock is arguably
more correct than resetting it, so the same missing call costs nothing there. Recorded, not filed.

### VII-B. FINDING 2 — Two subtypes were never authored, and the algorithm that needed them went with them

`subtype:'asi'` and `subtype:'hp_roll'` return **0 commits ever** in every spacing variant —
NEVER SHIPPED, not retired. What shipped instead is better as data (one richer record per level,
carrying the Fighter feature and gifts the original never mentioned) and worse as a contract: with
no discriminator, §III-C's *"Σ delta for all ASI tattoos"* cannot be expressed without inspecting
`Object.keys(t.asiChanges).length`, and nothing does.

This is the corpus's ordinary shape — **the invented parts of a design doc are the parts most likely
to be wrong**, because they were composed rather than copied. What is unusual here is that the merge
was an *improvement* the report never got to record.

### VII-C. FINDING 3 — Both protective flags are ornamental, and two real items trust them

`drop:false` appears 5 times and is **read 0 times**. The original's §III-B says it "is checked by
`_storyDeathSaveFall()`" in the same sentence that says the routine "never touches
`S_story.tattoos[]`" — the two halves contradict each other, and the second is correct.
`sell:0` is equally inert on tattoos: the vendor filters `S_story.inventory.filter(i => i.sell > 0)`
and tattoos are never in that array.

For tattoos this costs nothing — they are safe by container. But **two ordinary inventory items also
carry `drop:false`**, and the death routine filters on `type`, not on `drop`:

- `name:"Innmother's Key"@23536` — granted when Innmother kindness reaches 5. Carries no `type`, so
  `critTypes.has(undefined)` is false and the key goes to the corpse. It is also **read 0 times**:
  the free-room effect runs entirely on `S_story.freeBookingUnlocked`, set the line above. The item
  is a prop, and so is `S_story.innmotherKeyGiven = true;@23537`, a third marker for the same fact
  with no reader either. → **§DX-02n +2**.
- `name:"Glut's Gift", icon:'🍯'@31459` — a **real gated item**, tested by
  `some(i => i.name === "Glut's Gift")@34445` and consumed by `quest_glut_06`. Also untyped, so a
  death while carrying the jar sends it to the corpse. Recoverable by reclaiming the body, so this
  is a stumble rather than a soft-lock — but it is exactly the failure `drop:false` was written to
  prevent, on the one item that needs it.

Filed **§DX-02ax**: either teach `_storyDeathSaveFall()` to honour `drop:false`, or delete the flag
and give the two items `type:'key'`. The present state — a documented protection that does nothing —
is the worst of the three, because the next author will trust it.

*(Reachability note, correcting §DOC-02h: Glut's Gift is no longer blocked by a dead once-guard —
`§VM-01-G-FU-a-FIX` repaired that with `glutGiftReturned`. It is now blocked one level up, because
HG1 is non-primary in cell 25,206 per §AUDIT-03x. The item is still never granted; the reason
changed.)*

### VII-D. FINDING 4 — Tier 3 was wrong on the day it was written

Instrument 8. At `aef1650` — the report's own *"and current"* commit, 2026-05-25 10:35:21 — the death
routine already carried the identical `critTypes = new Set(['shard', 'key'])` filter and the same
`[...critItems, STARTER_DAGGER]` replacement. The three-tier model was never an accurate description
of the file it was describing; it is a simplification of the author's own code, not rot.

### VII-E. FINDING 5 — The HP volatility example omits a mechanic the report itself documents

§IX-C compared CON 14 against CON 8 at level 20 and reported **145 HP · 87 HP · 58 differential**.
The engine grants **four bonus d10 rolls** at levels 7, 10, 13 and 18 (`bonusHpRoll:true` on
`FIGHTER_FEATURES`), applied with no CON modifier — and the tattoo record has a `bonusHpRoll` field
precisely to log them.

Correct arithmetic — L1 = `10 + CONmod`, levels 2–20 = 19 × (5.5 + CONmod), plus 4 × 5.5 bonus:

| CON | Mod | Expected level-20 hpMax |
|---|---|---|
| 14 | +2 | **176.5** |
| 8 | −1 | **116.5** |
| — | — | **differential 60** |

All three published figures are wrong, and wrong in one direction, because the illustration was
composed to make a point about CON rather than computed from the level table. The differential is
independent of the bonus rolls, so even that number should have survived — it did not.

### VII-F. FINDING 6 — The ledger shape is declared three times

`const _STAT_ZERO = () => ({ kills:0@23916` is the specified factory, but
`careerStats: { kills:0@23147` and `runStats:` on the line below hand-write the same ten fields
inside `_S_DEFAULTS()` rather than calling it. Three copies now exist and all three currently agree
— which is the only reason this is a hazard rather than a bug.

There is no ordering obstacle: `_S_DEFAULTS` is itself an arrow const and is first *called* at
`S_story = _S_DEFAULTS();@23404`, long after the factory is defined. This is the §STATE-INIT drift
class one object deeper, and the file's own comment at `@22999` warns against exactly it. Filed
**§DX-02ay**.

---

## VIII. Recommendation Register — Original §X-D, Scored at 79 Days

| # | Proposed extension | Outcome |
|---|---|---|
| 1 | Feat tattoos (`subtype:'feat'`) | **NOT SHIPPED.** Superseded — the level-up tattoo already carries `feature: feat.name` for all 20 levels, which delivers the intent without a subtype. |
| 2 | Story tattoos for narrative events | **NOT SHIPPED.** No writer outside the three in §III-B. |
| 3 | Negative tattoos (scars) | **PARTIALLY, ELSEWHERE.** `Thorn (Permanent)@37659` (§FUTURE-01) is a permanent character-sheet caption — the shape, arriving outside this system. |
| 4 | Cross-run ancestral record in NG+ | **NOT SHIPPED.** `storyNewGamePlus()@24003` calls `_S_DEFAULTS()`, discarding the ledger. The "you fell here before" warning does not exist. |
| 5 | Chronicle analytics (K/D, dmg per battle) | **PARTIALLY.** Hit rate ships on the game-over modal; no derived metric reaches the character sheet, which shows raw counters only. |

**0 of 5 shipped as specified, 1 delivered by a better mechanism, 1 arrived from another arc.** The
pattern matches the program's 26th instrument: this register's deliverable medium is *content and
UI polish*, and those do not ship on their own momentum.

---

## IX. Playability Assessment — What These Systems Buy

**They make death legible instead of only expensive.** The drop-on-death rule supplies the tension;
the tattoo supplies the record. A player who reads *"💀 Day 5 · 08:00 · Birka Slums / 💀 Day 12 ·
14:00 · The Cat Quarter / 💀 Day 23 · 21:00 · Void Antechamber"* is reading their own campaign in
three lines: an early stumble at home, a mid-game overreach into a new zone, a late push into the
place that was always going to kill them. That is a narrative the game never wrote and never had to.

**They make the build audit itself.** Hard Mode's flat 8s exist so the ledger has signal: every
point above the floor is a decision with a tattoo attached. A player who dumped CON at creation and
is now dying to attrition can scroll their own HP rolls and see the reason in their own handwriting,
rather than suspecting the difficulty curve.

**They cost the player nothing.** No verb, no button, no resource, no decision. Both systems are
pure observation — which is why 79 days and a total quest-format migration went by without touching
them.

**Where the delivery falls short of the design.** Finding 1 is the load-bearing one: the two-horizon
Chronicle is the feature's most interesting claim, and on the ordinary death path the second horizon
never separates from the first. The player sees two identical columns and correctly concludes the
feature is broken — which is worse than not shipping the second column at all. Finding 3 is smaller
but sharper-edged: a protection that is documented, written five times, and enforced nowhere.

---

## X. Conclusion

The Tattoo and Chronicle systems shipped, and the parts that matter shipped intact: 93 % symbol
survival, a byte-identical respawn routine, 14 of 14 telemetry hooks live, and every balance
constant — the point-buy table, the ASI schedule, the Hard Mode floor — verbatim at 79 days. The
architecture's central idea, *protect progression by putting it in a different container*, is
correct and is what actually protects it.

The failures are instructive and consistent. Everything the report **transcribed** is right.
Everything it **composed** — the four-subtype union, the reconstruction algorithm, the three-tier
diagram, the HP worked example, the flag-based protection story — is wrong, and three of those five
were wrong the day they were written. The single behavioural defect (§AUDIT-03an) was invisible to
every symbol-level check, because it is not a missing symbol but a missing **call**.

> The body remembers. The ledger, it turns out, remembers a little too well — it has never once
> forgotten a previous life, which is exactly the thing it was built to do.

---

## References

[1] *D&D Player's Handbook*, 5th ed. Renton, WA: Wizards of the Coast, 2014.
[2] FromSoftware, *Dark Souls*, Namco Bandai Games, 2011.
[3] M. Toy, G. Wichman, K. Arnold, J. Lane, *Rogue*, UC Berkeley, 1980.
[4] ZA/UM, *Disco Elysium*, ZA/UM, 2019.
[5] D. Kahneman and A. Tversky, "Prospect Theory: An Analysis of Decision under Risk,"
    *Econometrica*, vol. 47, no. 2, pp. 263–291, Mar. 1979.
[6] J. Schell, *The Art of Game Design: A Book of Lenses*, 3rd ed. Boca Raton: CRC Press, 2019.

---

## Appendix A — Implementation Checklist, Re-Scored

Original claimed 30 of 30 ✅. Re-measured: **26 ✅ · 2 ⚠ · 2 ❌**.

| # | Task | 2026-05-25 | 2026-08-12 |
|---|---|---|---|
| A1–A3 | Hard Mode floor · creation modal · point-buy | ✅ | ✅ verbatim |
| A4 | Baseline tattoo at `storyNewGame()` | ✅ | ✅ |
| A5 | ASI tattoo at level-up confirm | ✅ | ⚠ merged into the level tattoo; no `asi` subtype |
| A6 | HP roll tattoo at level-up confirm | ✅ | ⚠ merged; no `hp_roll` subtype |
| A7 | Tattoo section in char sheet | ✅ | ✅ + an undocumented inventory-sheet section |
| A8 | Tattoos excluded from death drop | ✅ | ✅ by container |
| A9 | Tattoos excluded from vendor | ✅ | ✅ by container; `sell:0` inert |
| A10 | Tattoos survive respawn | ✅ | ✅ |
| A11–A12 | Ledgers in `_S_DEFAULTS()` · `_STAT_ZERO` + `_statTally` | ✅ | ✅ shape · ⚠ declared 3× (§DX-02ay) |
| A13–A20 | All 14 Chronicle hooks | ✅ | ✅ 14/14 (`exitsTaken` re-homed to `cellMove`) |
| A21–A22 | Hour clock +1 battle · +6 sleep | ✅ | ✅ |
| A23 | Hour reset on respawn | ✅ | ❌ unreachable from the main death path |
| A24 | Death tattoo at `_storyDeathSaveFall()` | ✅ | ✅ verbatim |
| A25–A28 | Death filter · Deaths section · Chronicle section · game-over panel | ✅ | ✅ |
| A29 | Hit rate in run summary | ✅ | ✅ |
| A30 | `careerStats` snapshot/restore | ✅ | ✅ |
| — | `runStats` reset on respawn | *(unlisted)* | ❌ **§AUDIT-03an** |

---

## Appendix B — Defects Filed

| Row | Severity | Summary |
|---|---|---|
| **§AUDIT-03an** | 🟠 | `runStats` never resets on the ordinary combat death; the character sheet renders *This Life* and *All Lives* as identical columns from the first death onward. |
| **§DX-02ax** | 🟡 | `drop:false` — 5 writes, 0 readers; two untyped inventory items (Innmother's Key, Glut's Gift) rely on it and are dropped on death. |
| **§DX-02ay** | 🟢 | The 10-field ledger shape is declared three times; `_S_DEFAULTS()` hand-writes both ledgers instead of calling `_STAT_ZERO()`. |
| **§DX-02n +2** | 🟢 | `Innmother's Key` (1 occurrence, 0 readers) and `innmotherKeyGiven` (2 occurrences, 0 readers) — both redundant with `freeBookingUnlocked`. |

---

*Report prepared for internal design documentation of CodexOfConquest.com. Not submitted to any external
publication venue. IEEE formatting applied for structural clarity.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
