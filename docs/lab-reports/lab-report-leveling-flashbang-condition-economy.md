<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Layer 18 — Character Progression, the Flashbang, and the Condition Gold Economy

**CodexOfConquest v3 — Engineering Design Record · Verification Pass**
**Classification:** Game Mechanics · Combat Action Economy · Progression Design
**Original:** 2026-05-21 · **Verified against `play.html` (38,712 lines):** 2026-08-12 (§DOC-02t)
**Original status claim:** *"Complete — Layer 18 implemented and verified against `play.html` (8,236 lines)"*
**Verified status:** **Three of four subsystems live and largely exact; the fourth — character progression — was replaced wholesale, by a design this report's own §II.A explicitly forbade.**

> **HISTORY DOCUMENT.** Per the Lab Report Policy this file is annotated, never rewritten to match
> HEAD. Every claim below that did not ship is marked **NOT SHIPPED** and **kept** — a silently
> deleted claim reads as one that held.

---

## Abstract

This report specified Layer 18 of *The Shattered Codex* combat layer: (1) a ten-level character
progression system consuming the existing XP counter, (2) the **Flashbang**, a guaranteed-advantage
bonus-action consumable, (3) a **×100 repricing** of `CONDITION_GOLD`, and (4) a unifying analysis of
the *item-as-half-action* economy.

Re-measured 83 days later: **42 of 44 named identifiers resolve (95 %)**, and of the report's own
22-row Verification Manifest **15 hold outright, 5 are present but semantically changed or inert, and
2 never shipped at all**. The two dead identifiers — `XP_LEVELS` as specified and `_LEVEL_REWARDS` —
return **0 commits ever**. The condition repricing is the durable result: `CONDITION_GOLD` is
**byte-identical at the earliest surviving build and at HEAD**, unchanged across 79 days and 24,476
lines of file growth. The progression system is the casualty: what shipped is a D&D Fighter
advancement track to **level 20** delivered through an interactive modal with player-allocated
ability-score improvements — the precise shape §II.A ruled out.

---

## I. Intent, Inspiration, and What It Buys the Player

*(Restated from the original Abstract, §I, §II.A and §VII, because it is the part of this document
that survived best and is the reason the work was done.)*

**The inspiration** is tabletop D&D compressed to a browser tab. CodexOfConquest's story battle is a
**rapid-play** interface: the player makes 2–4 decisions per round, and a full battle resolves in
under two minutes. Where tabletop spends its time on dice, narration and table consensus, CodexOfConquest
spends it on *decision clarity*. The governing constraint the report set for itself:

> **Every mechanical addition must pay for itself in decision density per second of play, not in
> absolute mechanical richness.**

**The playability problem each subsystem solves:**

| Subsystem | The playability gap it closes | Why it makes the game better to play |
|---|---|---|
| **Character levels** | XP had accrued since Layer 12 with **no downstream effect** — a counter the player could watch but draw no inference from. A motivational dead end. | Closes the reward loop. Every fight now advances something the player can feel in the *next* fight, so grinding a corridor of trivial encounters stops being pure time-spend. |
| **Flashbang** | Spell Scrolls were the only ADV-setup item and they **fail 25–60 % of the time**, so setup play was unreliable exactly when it mattered (a boss). | Adds a *certainty* option beside the *efficiency* option. The player now chooses a risk posture, not just an item — the decision is denser at identical UI cost. |
| **`CONDITION_GOLD` ×100** | At 10–50 gp a condition item cost less than a healing potion while granting ADV **plus** a status for three rounds. Using one was never a real choice. | Restores contest to the pre-battle screen. "Spend or save" becomes a genuine fork, which is the only thing that makes the pre-battle screen worth opening. |
| **The 0.5-action rule** | Nothing unified potions, scrolls, shields and grenades, so each addition risked a new special case. | One rule — *every item costs the bonus action* — means no item is unconditionally optimal, and **emergent** strategy (the three-potion arc, the shield-vs-items trade) appears without a dedicated mechanic for it. |

**The design rule extracted from all four, and still the correct one:** *deepen the decisions the
player already makes; do not add new ones.* Layer 18 adds options to the existing bonus phase and
power to the existing attack roll. It adds **zero** decision points per round. That principle is
intact at HEAD — and it is precisely the principle the shipped progression system traded away.

---

## II. Method

Per §DOC-02 program instruments:

1. **Batch census** — all 44 named identifiers through one `grep -c` pass before reading the report.
2. **`git log -S` on every dead symbol** — separates **RETIRED** (shipped, later removed) from
   **NOT SHIPPED** (never existed under that name).
3. **Archive adjudication** — this report predates the earliest surviving build, so `32c10c5`
   (2026-05-24, 14,377 lines) is read as the nearest witness, three days downstream.
4. **Copy-vs-compose** — transcribed data is weighted as evidence; composed illustrations as claims.
5. **Census cross-check** — every extraction total reconciled against `npm run stats` before any
   delta was derived from it.

**Dating caveat (corpus rule, instrument 18).** The report's baseline — *"8,236 lines, Layers 0–18
complete"* — **matches no commit**; the first surviving build is 14,377 lines. This document
describes a working tree that was never committed, so its own line citations (`~5979–5983`) are
scored **UNVERIFIABLE**, not wrong, and the report is dated by the birth of the things it describes.

---

## III. As-Built Inventory (HEAD, 2026-08-12)

**Condition economy — exact.**
`const CONDITION_GOLD = {@24620` · `const CONDITION_ITEMS = [@22410` · `function storyPreBattle(node) {@36382`

**Flashbang — exact.**
`const COMBAT_ITEMS = [@24467` · `function storyBuyFlashbang() {@24368` ·
`function _renderSboSpells() {@24911` · `function _storyUseFlashbang(invIdx) {@24936` ·
`function _playerHasBonusOptions() {@24979` · `{ weight:6, _type:"flashbang" },@24524`

**Progression — shipped under a different architecture.**
`const XP_LEVELS = [@24420` (20 entries) · `const FIGHTER_FEATURES = {@25506` (19 entries, Lv2–20) ·
`const _ASI_LEVELS = new Set([4, 6, 8, 12, 14, 16, 19]);@25528` ·
`function _showLevelUpModal(lvl) {@25617` · `function _checkLevelUp() {@25673` ·
`function _extraAttackCount() {@24997` · `const critMin = _lv >= 20 ? 17@25029`

**Integration points named by the report.**
`function _storyBattleVictory() {@25282` · `_levelUpQueue = [];   // reset before each battle resolution@25298` ·
`const lvlAtk@25032` · `function _calcPlayerAc() {@24612` ·
`const nextThresh = XP_LEVELS[curLv];@25471` · `const lvEl = document.getElementById('s-level');@36119`

---

## IV. Spec → Shipped Delta Table

Two-way: **REPORT-ROT** = the report aged. **ENGINE-ROT** = HEAD lost something specified.
**NOT SHIPPED** = never existed. **EXPANDED** = HEAD exceeds the spec.

| # | Report claim (§) | HEAD | Verdict |
|---|---|---|---|
| 1 | `CONDITION_GOLD` ×100, all 12 values (§IV.C) | All 12 exact, byte-identical at archive **and** HEAD | ✅ **EXACT — 79 days unchanged** |
| 2 | Condition item source = *"Pre-existing inventory"* (§V.A) | Not inventory-gated: `// All condition items available for gold purchase (not inventory gated)@36386` | **NOT SHIPPED — superseded, and it strengthens §IV** |
| 3 | Cheapest condition = Feint Scroll 1,000 gp (§IV.C) | Live hint string names exactly that | ✅ EXACT |
| 4 | `COMBAT_ITEMS` Flashbang `cost:150, sell:75` (§III.B) | Byte-identical | ✅ EXACT |
| 5 | Flashbang = vendor purchase, scroll = loot drop (§III.B contrast) | Flashbang is **also** a 6 % `_D100_TABLE` loot row | **REPORT-ROT — EXPANDED** |
| 6 | Flashbang guards: attack first · free hand · splice · `spellAdvantageReady` · enemy turn (§III.B/VI) | All five, in order | ✅ EXACT |
| 7 | Spell scroll DC = `d20 ≥ AC − 2` (§III.A) | Live tooltip: *"d20 vs your AC−2"* | ✅ EXACT |
| 8 | `_playerHasBonusOptions()` flashbang check (§VI) | Line present — but **every branch returns true** | ⚠️ **PRESENT BUT INERT** |
| 9 | `XP = OpponentAC × OpponentMaxHP` (§II.B) | Live, plus a party multiplier | ✅ EXACT — EXPANDED |
| 10 | §II.B tier AC/HP/XP *"empirical range"* table | Misses at the archive **and** HEAD | ❌ **WRONG WHEN WRITTEN** (Finding 5) |
| 11 | `XP_LEVELS = [0, 500, … 90000]`, 10 levels (§II.C) | 20 entries, every threshold different; specified literal = **0 commits ever** | ❌ **NOT SHIPPED** |
| 12 | `_LEVEL_REWARDS` flat hp/atk/ac table (§II.D) | **0 commits ever**; replaced by `FIGHTER_FEATURES` | ❌ **NOT SHIPPED** |
| 13 | *"Rewards are automatic — zero player overhead"* (§II.A.3, §VII) | Modal requires an HP roll click, an optional bonus-d10, and 2 ASI allocations at 7 levels | ❌ **REVERSED** (Finding 1) |
| 14 | `_checkLevelUp()` applies rewards + populates `#svo-levelup` (§II.E) | Queues only; caller writes the banner; rewards live in `_showLevelUpModal` | ⚠️ **PARTIAL** |
| 15 | `_checkLevelUp()` recursive + max-level guard (§II.E) | Both exact, guard now reads level 20 | ✅ EXACT |
| 16 | `_checkLevelUp()` called in `_storyBattleVictory()` after XP award (§II.E) | Exact | ✅ EXACT |
| 17 | `S_story.atkBonus` = *"permanent attack modifier from leveling"* (§II.E) | Repurposed: it is now the **STR modifier** | ⚠️ **SEMANTICS INVERTED** (Finding 3) |
| 18 | `S_story.acBonus` = *"permanent AC modifier from leveling"*, +4 by L10 (§II.D/E) | Declared twice, read once, **written nowhere** — at HEAD and at the archive | ❌ **NOT SHIPPED — born dead** (Finding 2) |
| 19 | `_calcPlayerAc(): base + shield + acBonus` (§II.E) | Shape survives, plus a §DROP-03 lake term; the `acBonus` term is permanently 0 | ⚠️ PARTIAL |
| 20 | `#s-level`, `#svo-levelup`, `#svo-xp-total` surfaces (§II.F/VI) | All three live; `#svo-xp-total` format exact; `#svo-levelup` text changed to a deferred-count line | ✅ / ⚠️ |
| 21 | Bare identifier `shieldBonus` (§II.E) | 0 commits ever — a paraphrase of `equippedShield.acBonus`, not a symbol | — (not a defect) |
| 22 | Level cap 10; L10 = 90,000 XP; *"casual players reach 4–5"* (§II.C, §VII) | Cap **20**; L10 = **20,000** XP (4.5× cheaper); L20 = 195,000 | **NOT SHIPPED** |

**Manifest score: 15 ✅ · 5 ⚠️ · 2 ❌.**

---

## V. Findings

### Finding 1 — The progression system that shipped is the one this report ruled out

§II.A constraint 3 reads: *"**No new UI complexity**: Levels should not require the player to make
build choices, allocate stat points, or read a menu. Rewards are automatic and announced."* §VII
scores it ✅ twice more (*"Rewards are automatic — zero player overhead per level-up"*, *"Does not add
decision points"*).

HEAD ships a dedicated `story-levelup-modal` in which the player **clicks to roll a d10 for HP**,
sometimes **clicks a bonus d10**, and at seven levels **allocates two ability-score points by hand**
(`const _ASI_LEVELS = new Set([4, 6, 8, 12, 14, 16, 19]);@25528`). `function _showLevelUpModal(lvl) {@25617`
gates each section behind the previous one; `function _checkLevelUp() {@25673` now only *queues*.

This is not rot. `FIGHTER_FEATURES`, `_ASI_LEVELS` and the modal are **already present in the earliest
surviving build three days later**, while the specified `XP_LEVELS` literal and `_LEVEL_REWARDS` have
**0 commits ever**. The 10-level flat-bonus table was superseded before it could be committed.

**Why the reversal was right, and worth recording as design history.** The report optimised for *zero
overhead*; the shipped system optimised for *the level-up being an event*. Levels also stopped being
scalar: `function _extraAttackCount() {@24997` turns the main action into 2/3/4 rolls at L5/11/20 and
`const critMin = _lv >= 20 ? 17@25029` widens the crit window at L3/15/20 — changes to the *structure*
of a round, which no flat `+1 ATK` table can express. The report's own rule (*deepen existing
decisions*) is better served by the design that broke its constraint than by the one it specified.
***13th instrument: a design doc's prohibition is a claim like any other — verify it against what
shipped, because the reversal is usually the interesting part.***

### Finding 2 → §DX-02y — `S_story.acBonus` is a read-only field with no writer, and the home doc says otherwise

Two declarations — `acBonus: 0,` *(deleted, §DX-02y)* inside `_S_DEFAULTS()`, and again in the `S_story` seed
literal at `level: 1, atkBonus: 0, acBonus: 0,` *(deleted, §DX-02y)* — exactly **one reader**
— the `(S_story.acBonus || 0)` *(deleted, §DX-02y)* term inside `function _calcPlayerAc() {@24612` — and **zero
writers in 38,712 lines**. The same holds at `32c10c5`: the field was **born dead**, not retired. The
specified +1 AC at L5, +1 at L8 and +2 at L10 therefore never accrue; a level-20 character's AC comes
entirely from shield and lake-magic terms.

`docs/mechanics/mechanics-combat.md:313` states the opposite outright — *"`atkBonus` and `acBonus` in
`S_story` are updated immediately"* — the §DOC-02j `LOOT_TABLE` rot direction, and the more dangerous
one: a reader greps the doc and concludes the field works.

> **✅ CLOSED 2026-08-26 by §DX-02y, option (a).** The field and its `_calcPlayerAc` term are deleted.
> Nothing in the shipped design grants AC by level, so there was nothing to wire it to — Layer 18's
> +1/+1/+2 is a specification that was never built, and the honest form of that is an absent field,
> not a present one reading 0. `_calcPlayerAc()` is now `baseAc + equippedShield.acBonus +
> _lakeMagicBonuses().ac`, and **the number the player sees is unchanged**, because the deleted term
> was provably `+ 0` for every state the game can reach. **The doc claim above had been corrected in
> `mechanics-combat.md` and left standing in its sibling `docs/design/mechanics.md`** — a one-sided
> correction, found only because this row went to delete the field. Both now say the same thing.

This is the **inverse** of the §DX-02n write-only class: dead weight there, a **broken dependency**
here. A `check:deadconsts` scoped to unread fields walks straight past it, which is the standing
argument for censusing **readers and writers separately** and failing on either being zero.

### Finding 3 → §AUDIT-03ae — `atkBonus` was repurposed, and three surfaces now disagree about the attack roll

The report defined `S_story.atkBonus` as a *level* bonus and specified the integration point
`atkTotal = d20Val + atkMod + profB + (S_story.atkBonus || 0)`. Both halves are still here; the
meaning underneath one of them changed.

At HEAD the field carries the **STR modifier**: seeded at character creation by
`S_story.atkBonus = Math.max(0, Math.floor((scores.str - 10) / 2));@23960` and grown only by an ASI
STR bump (`if (strDelta > 0) S_story.atkBonus@38523`). The specified integration point survives as
`const lvlAtk@25032`. Two individually-correct changes compose into three disagreeing surfaces:

- **The battle engine** reads its ability modifier from the dice-roller's own control, which is
  `<option value="dex" selected>@3719`. The story→simulator sync at
  `document.getElementById('char-level').value = _slv;@24677` writes the level, AC, max HP and all six
  ability scores — but **never repoints that select**. So a story attack rolls
  **d20 + DEX mod + prof + STR mod + weapon/tome/lake/ally**: both abilities, every swing.
- **The character sheet** uses `const atkTotal = strMod + profBonus + (S_story.atkBonus || 0);@37600`
  — and since `atkBonus` *is* the STR mod, **STR is counted twice**.
- **The sheet's own printed breakdown** renders the bonus term as `atkBonus − strMod`, i.e. `+0`, so
  the displayed components sum to `strMod + prof` while the displayed total is `2 × strMod + prof`.

Worked example (STR 16, DEX 12, prof +2): the character sheet prints **"+8 (STR+3 + Prof+2 +
bonus+0)"** — a total its own parts sum to 5 — while combat actually rolls at **+6**.

**No single-symbol census finds this**: every identifier resolves and every line is live. It is
visible only by asking what the field *means* at each reader.

### Finding 4 — The condition repricing is the report's durable result, and it ships stronger than specified

`const CONDITION_GOLD = {@24620` is **byte-identical at `32c10c5` and at HEAD** — all 12 entries,
unchanged across 79 days while the file grew from 14,377 to 38,712 lines. It is the most durable
thing this report produced.

It also carries more weight than the report knew. §V.A files condition items under *source:
pre-existing inventory*; HEAD does not gate on possession at all
(`// All condition items available for gold purchase (not inventory gated)@36386`), so **gold is the
only brake on the strongest pre-battle effect in the game** and the ×100 multiplier is doing the
entire balancing job §IV.B argued for. The mechanism reaches every entry point: both the pre-battle
overlay (`function storyPreBattle(node) {@36382`) and the in-page battle accordion price from the same
table.

Two residues:

- **Stale comment, one line above the code that contradicts it:**
  `// filtered CONDITION_ITEMS matching current inventory@36378`.
- **A latent price bypass → §DX-02z.** All five cost lookups read `CONDITION_GOLD[…] || 20`. Today
  all 12 `CONDITION_ITEMS` have a price row, so the fallback is unreachable — but a 13th condition
  added without one is **silently priced at 20 gp**, the retired pre-Layer-18 scale, re-creating the
  exact defect §IV.B was written to fix. Nothing pairs the two tables.

Also worth stating: §IV.C's arithmetic understates its own case. A Basilisk Eye at 5,000 gp is not
*"roughly the full gold reward"* from a deadly kill — at HEAD's median deadly statline (AC 18, HP
210) the kill pays `floor(0.1 × 18 × 210)` = **378 gp**, so the Eye costs about **13 median deadly
kills**. The pricing is a heavier investment than the report claimed, in the direction it wanted.

### Finding 5 — §II.B's "empirical range" table was wrong when written (instrument 12)

The table is presented as measurement (*"Empirical range"*) and is in fact a composed illustration.
Measured over `MONSTER_POOL` (398 entries at HEAD, 370 at the archive; both reconciled against
`npm run stats`):

| Tier | Report AC | Live AC (med) | Report HP | Live HP (med) | Report XP | Live XP range (med) |
|---|---|---|---|---|---|---|
| Trivial | 9–11 | 1–16 (7) | 10–20 | 1–12 (6) | 90–220 | 1–176 (40) |
| Easy | 12–13 | 4–16 (12) | 20–35 | 5–39 (18) | 240–455 | 40–507 (195) |
| Medium | 14–15 | 6–19 (13) | 35–60 | 11–138 (52) | 490–900 | 176–1,932 (624) |
| Hard | 16–17 | 11–20 (15) | 60–100 | 40–200 (105) | 960–1,700 | 504–3,060 (1,575) |
| Deadly | 18–20 | 15–22 (18) | 100–150 | 97–546 (225) | 1,800–3,000 | 1,649–**12,012** (3,800) |

The medians barely moved in 79 days (medium XP 624 → 624), so **the misses are not rot** — the table
did not match the pool it claimed to be empirical about, on the day it was written. The deadly band is
the sharpest: the live **median** (3,800) exceeds the report's stated *maximum* (3,000), and
`ancient_dragon:  { key:'ancient_dragon'@5529` pays **12,012** — 4× the ceiling. Trivial is inverted:
claimed 90–220, actual median 40.

Because §II.C set the (never-shipped) thresholds from this table's *"35-battle playthrough ≈
25,000–35,000 XP"*, the one composed section is the one that propagated. ***A section labelled
"empirical" is a claim, not a measurement, unless the numbers can be traced to the table they
summarise.***

### Finding 6 — `_playerHasBonusOptions()` is a constant-true function

`function _playerHasBonusOptions() {@24979` tests the shield, offhand, scrolls, flashbangs and
potions in turn — and then closes with `return true;  // wimper always available@24986`. Only the
opening `usedBonusAction` guard can return false, so **every inventory test in the body is inert**.
The manifest row *"`_playerHasBonusOptions()` flashbang check ✅"* is honest about the line and
misleading about the behaviour.

Impact is small and bounded: the single consumer picks between two log strings. Recorded because it is
the §DOC-02f class in miniature — *the symbol resolves, the branch is unreachable* — and because
§V.C's claim that *"the player is never presented with an invalid option in an enabled state"* is not
enforced here, whatever else enforces it.

---

## VI. What Held, Verbatim

The Flashbang is the cleanest implementation in the report — **11 of 11 manifest rows hold**, most
byte-exact:

- `{ name:'Flashbang', icon:'💥', type:'flashbang', cost:150, sell:75 }` — every field.
- `function _storyUseFlashbang(invIdx) {@24936` — the guard order is exactly as specified: *must have
  attacked* → *free hand required* → splice → `spellAdvantageReady = true` → `usedBonusAction = true`
  → enemy turn. §III.C's one-round-delay framing (*throw in round 1, ADV lands in round 2*) is a
  direct consequence and is live.
- Vendor row, `#btn-buy-flashbang` listener, orange-bordered no-DC button in `_renderSboSpells`, the
  💊 Consumables filter, and `'flashbang'` in `knownTypes` — all present.
- **Expanded beyond spec:** `{ weight:6, _type:"flashbang" },@24524` makes it a 6 % loot drop, so the
  report's Flashbang-vs-Scroll contrast row (*vendor purchase* vs *loot drop value*) no longer
  distinguishes them. The **guarantee premium** argument survives; the **exclusivity** claim does not.

The XP formula, the post-battle heal, the `#svo-xp-total` line format, the `#s-level` status row and
the queue-then-show victory sequencing all verify exact.

---

## VII. Recommendation & Risk Register — Outcome

| Item | Report's position | Outcome |
|---|---|---|
| Levels must be session-completable (§II.A.1) | 30–40 battles → Lv 5–7 | **Superseded** — 20 levels, thresholds cut 4.5× at L10 |
| Rewards tangible in battle (§II.A.2) | ✅ | **Held, and exceeded** — extra attacks and crit range, not just +1s |
| No build choices / no menu (§II.A.3) | ✅ | **Reversed** — ASI allocation + a modal (Finding 1) |
| Flashbang reuses `spellAdvantageReady` (§VII) | ✅ | **Held exactly** |
| Condition pricing restores the choice (§IV.D) | ✅ | **Held, and load-bearing** (Finding 4) |
| One rule for all consumables (§V.B) | ✅ | **Held** |
| *(unfiled risk)* `acBonus` never wired | — | **Realised** — born dead (Finding 2) |
| *(unfiled risk)* `atkBonus` semantics | — | **Realised** — repurposed under a live reader (Finding 3) |

**The pattern across §DOC-02:** the report's *narrated* sections (the §II.B "empirical" table, the
§II.E integration prose, the §VII self-scoring checklist) carry every error; its *transcribed* data
(`CONDITION_GOLD`, `COMBAT_ITEMS`, the Flashbang guard sequence) is exact. Copy-vs-compose, again.

---

## VIII. Defects Filed

| Row | Defect | Design call? |
|---|---|---|
| **§DX-02y** ✅ shipped 2026-08-26 | `S_story.acBonus` — 2 declarations, 1 reader, **0 writers**, born dead; `mechanics-combat.md:313` claims it is written. Widens `check:deadconsts` to census readers and writers **separately**. **Closed by deletion** — the reader/writer census widening stays open under §DX-02u. | 🟢 No — but *how* to wire it (or delete it) is a small call |
| **§AUDIT-03ae** | Attack-roll three-way disagreement: engine adds DEX **and** STR; the character sheet double-counts STR; the sheet's own breakdown does not sum to its own total. Player-visible. | 🟢 No |
| **§DX-02z** | `CONDITION_GOLD[…] \|\| 20` in 5 sites with no gate pairing `CONDITION_ITEMS` ↔ `CONDITION_GOLD`; a 13th condition ships silently at the retired pre-Layer-18 price. | 🟢 No |
| **Doc fixes** | `mechanics-combat.md:313` (`acBonus` claim) · `:254` bare archive-era anchor *"HTML line 8608"* for a const now at 24418 · `// filtered CONDITION_ITEMS matching current inventory@36378` contradicted 8 lines below. | 🟢 No |

---

## IX. Design Material Retained

Kept because no maintained doc carries it and this report is its only copy:

- **The 0.5-action single rule and its three consequences** (§V.B): no item is unconditionally
  optimal; the shield is a *trade*, not a buff, because holding it forfeits the item slot; and the
  three-potion arc — one heal per round, three rounds, three enemy attacks absorbed — is **emergent
  from one consistent rule**, never a coded mechanic. It remains the cleanest statement of why the
  action economy is a single rule rather than a table of exceptions.
- **The Cooperative DM Principle as applied to pricing** (§IV.D): the game must never create
  unwinnable states, *and* must never trivialise a choice. Under-priced conditions violated the
  second clause. This is the rationale future price changes should be argued against.
- **The rapid-play checklist** (§VII): uses an existing counter · low per-event overhead · tangible in
  play · adds no decision points · scales with session length. Four of five still describe HEAD; the
  one that does not (Finding 1) was traded deliberately.

---

*Original report 2026-05-21 (Layer 18: Character Levels, Flashbang 150 gp, `CONDITION_GOLD` ×100).*
*Verified and rewritten 2026-08-12 under §DOC-02t against `play.html` at 38,712 lines.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
