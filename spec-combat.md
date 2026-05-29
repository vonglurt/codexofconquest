<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# roll2hit — Plan 0
*Single-file dice roller. No external scripts. Self-contained HTML.*

---

## UI Overview

Two files ship from this plan:
- `roll2hit.html` — Phase 0 reference build (4-quadrant layout)
- `roll2hit-v2.html` — **current implementation** (Phase 2, 3-column arena layout)

Phase 2 structure:
1. **Playfield** — fixed viewport-height, 3 columns: left panel · center arena · history panel
2. **Config Panel** — scrolls below the playfield; character sheet, weapon, enemy settings, histogram

---

## Playfield Layout — Phase 2 (Current)

```
┌──────────────────┬─────────────────────────────┬──────────────────────┐
│   LEFT PANEL     │       CENTER ARENA           │   HISTORY PANEL      │
│   (~210px fixed) │       (flex, grows)          │   (~210px fixed)     │
│                  │                              │                      │
│  [Opp name/AC]   │  ┌──────────────────────┐   │  ┌────────────────┐  │
│  [Opp HP bar]    │  │  OPPONENT ZONE (top) │   │  │ R3  OPP        │  │
│  [DIS|NORM|ADV]  │  │  d20 SVG + glow      │   │  │ 9+3=12         │  │
│  [Roll Opponent] │  │  outcome banner      │   │  │ vs AC 13  MISS │  │
│  ─────────────── │  │  damage chip row     │   │  └────────────────┘  │
│  [Your HP bar]   │  ├──────────────────────┤   │                      │
│  [AC · PROF pip] │  │  YOU ZONE (bottom)   │   │  ┌────────────────┐  │
│  [DIS|NORM|ADV]  │  │  d20 SVG + glow      │   │  │ R4  YOU        │  │
│  [Adv badge]     │  │  mod breakdown       │   │  │ 17+2=19        │  │
│                  │  │  outcome banner      │   │  │ vs AC 12  HIT  │  │
│  ┌────────────┐  │  │  damage chip row     │   │  │ dmg [4,5]+2=11 │  │
│  │ ROLL ATK   │  │  └──────────────────────┘   │  └────────────────┘  │
│  │  (large)   │  │                              │                      │
│  └────────────┘  │  Free-roll results appear    │  ← newest at bottom  │
│  [🗡 Roll Damage]│  in YOU zone, labeled FREE   │    auto-scrolls down │
│  [Auto-Damage]   │                              │                      │
│  [↩ Off-hand]    │                              │                      │
│  [+ Bonus Roll]  │                              │                      │
│  ─────────────── │                              │                      │
│  Quick Dice row  │                              │                      │
│  d4 d6 d8 d10   │                              │                      │
│  d12 d20 d100   │                              │                      │
│  2d6            │                              │                      │
└──────────────────┴─────────────────────────────┴──────────────────────┘
   [Config panel scrolls below — Roll Mode, Character Sheet, Weapon,   ]
   [Off-hand, Bonus, Opponent, Histogram (last section)                ]
```

**Left panel** — all controls; Roll button label updates with Roll Mode tab.  
**Center arena** — display only; opponent zone top, player zone bottom.  
**History panel** — card entries, newest at bottom, auto-scroll.

---

## Advantage / Disadvantage Model

Each side has an independent 3-state toggle: `DIS | NORM | ADV`

- **Player toggle** — conditions on the player's attack roll (Reckless Attack, flanking, poisoned…)
- **Opponent toggle** — conditions the opponent carries that affect the player's roll against them (Dodge, prone, paralyzed…)

**Key principle: the two toggles are mirror opposites.**  
Opponent DIS = the player effectively has ADV (attacker rolls with advantage against a disadvantaged target).  
Opponent ADV = the player effectively has DIS (e.g., opponent uses Dodge).  
Both toggles feed into a single resolved roll state for the player.

**Double advantage / double disadvantage:**  
No advantage stacking — two sources of advantage are still just advantage.  
- Player ADV + Opponent DIS = two ADV sources → resolves as **Advantage** (not cancelled)
- Player DIS + Opponent ADV = two DIS sources → resolves as **Disadvantage** (not cancelled)
- Player ADV + Opponent ADV = ADV meets its mirror DIS → **Normal** (cancel)
- Player DIS + Opponent DIS = DIS meets its mirror ADV → **Normal** (cancel)

**UI rule:** clicking any non-NORM button on one side auto-resets the other side to NORM.  
This prevents accidental double states and keeps the UI honest — since double ADV still resolves to ADV, there is no gameplay reason to allow both sides non-NORM simultaneously.

**Full resolution table** (Opponent column header reflects its *effective* meaning for the player):

| Player \ Opp (as effective) | NORM | ADV *(= DIS on player)* | DIS *(= ADV on player)* |
|---|---|---|---|
| **NORM** | Normal | **Disadvantage** | **Advantage** |
| **ADV** | **Advantage** | Normal *(cancel)* | **Advantage** *(double → single)* |
| **DIS** | **Disadvantage** | **Disadvantage** *(double → single)* | Normal *(cancel)* |

A **result badge** below the player toggles shows the resolved state:
- `✦ ADVANTAGE` — roll 2d20, keep high (dropped die shown grayed/struck)
- `⚖ NORMAL ROLL`
- `✗ DISADVANTAGE` — roll 2d20, keep low

---

## History Panel (Card Format) — Phase 2

Each roll event becomes a self-contained card appended to the right history panel:

```
┌─────────────────────────────┐
│  R4  YOU                     │  ← gold left-border
│  17+2=19 vs 12  ✓ HIT       │
│  dmg [4,5]+2 = 11            │
└─────────────────────────────┘

┌─────────────────────────────┐
│  R3  OPP                     │  ← red left-border
│  9+3=12 vs AC13  ✗ MISS     │
└─────────────────────────────┘

┌─────────────────────────────┐
│  FREE                        │  ← blue-grey left-border
│  FREE 2d6: [4, 5] = 9       │
└─────────────────────────────┘
```

- Newest card at **bottom**; panel auto-scrolls to keep it visible
- Left-border color: gold = YOU, red = OPP, purple = BONUS/off-hand, blue-grey = FREE
- Older cards fade (opacity steps down, min 0.3); max 30 cards in DOM, oldest pruned
- Actor tags: `YOU`, `YOU(OH)` (off-hand), `OPP`, `FREE`, `BONUS`

---

## Config Panel Sections

### A — Roll Mode (3 tabs)

| Tab | Ability Used | Proficiency | Target | Roll Button Label |
|---|---|---|---|---|
| Attack Roll | STR (melee) or DEX (ranged/finesse) | Proficient w/ weapon checkbox | Target AC | `⚔ ROLL ATTACK` |
| Skill Check | Governing ability (auto from skill) | Proficient in skill checkbox | DC | `🎲 ROLL CHECK` |
| Saving Throw | Save type ability | Class save proficiency checkbox | Save DC | `🛡 ROLL SAVE` |

The large roll button in the left panel **relabels itself** whenever the active tab changes, so it always tells the player exactly what the next roll does.

Natural 1 = auto-miss regardless of modifiers.  
Natural 20 = auto-hit + critical (damage dice doubled).

### B — Character Sheet

- Level (1–20) → auto-calculates proficiency bonus; manual override checkbox
- Your AC input
- 6 ability cards: STR DEX CON INT WIS CHA
  - Score input (1–20)
  - Modifier displayed (auto-calc: `⌊(score-10)/2⌋`)
  - Save proficiency checkbox per stat

Proficiency bonus by level: `⌊(level-1)/4⌋ + 2`  
(+2 levels 1–4, +3 levels 5–8, +4 levels 9–12, +5 levels 13–16, +6 levels 17–20)

### C — Weapon / Damage

- Weapon name (text, optional)
- Damage die: `d4 / d6 / d8 / d10 / d12 / d20`
- Number of dice (1–10)
- Damage modifier (separate from attack roll modifier)
- Proficient with weapon checkbox
- Finesse checkbox (uses DEX instead of STR)

### C2 — Off-hand / Second Attack

Available only when no shield is equipped (shield checkbox in Config Panel toggles this section on/off).

- **Off-hand weapon die** — separate die selector (`d4 / d6 / d8 / d10 / d12`)
- **Off-hand dice count** — defaults to 1
- **No ability modifier on off-hand damage** — per standard rules, the STR or DEX bonus is NOT added to off-hand damage. Only the raw dice are rolled; no modifier field for damage.
- Off-hand attack still uses the normal attack roll (d20 + ability mod + proficiency if applicable) — only the *damage* calculation omits the ability modifier.
- Off-hand roll is a separate button/trigger that fires after the main attack.

### C4 — Quick Dice Roller (Free Rolls)

A compact button row in the **left panel** (below the secondary roll buttons) for one-off rolls unconnected to combat. Results never apply to HP.

- **Die buttons:** `d4 · d6 · d8 · d10 · d12 · d20 · d100 · 2d6`
- `2d6` is a fixed preset — rolls two d6s simultaneously
- **Single-die result:** one full hero-size (88px) SVG die animates in the YOU zone
- **Multi-die result (2d6):** both dice shown side-by-side at medium size (60px each) in the YOU zone hero slot, each animating independently with a slight stagger; outcome banner shows `2d6: [4, 5] = 9`
- Logged in history as a `FREE` card with no vs-AC or HP line
- Does not advance the round counter

### C3 — Damage Rolls & Auto-Damage Toggle

**Decoupled attack / damage flow:**
- `⚔ ROLL ATTACK` — rolls d20 only; resolves HIT / MISS / CRIT; never touches HP.  
  Outcome banner prompts "Roll Damage" after a hit/crit.  
  Each new Roll Attack clears all sticky damage notes in the YOU zone.
- `🗡 Roll Damage` — rolls main weapon damage (crit doubles dice if `S.lastHit.crit` is set).  
  Shows result as a sticky note in the YOU zone. Only reduces enemy HP if **Auto-Damage is ON**.
- `↩ Off-hand` — still rolls d20 (bonus action attack) + off-hand damage if hit.  
  Off-hand damage also only reduces HP if Auto-Damage is ON.

**Auto-Damage toggle:**
- Single toggle button in the left panel: `Auto-Damage: OFF` / `Auto-Damage: ON`
- **OFF (default):** damage rolls display numbers and sticky notes but enemy HP is unchanged — useful for tracking damage manually or for partial/conditional damage (e.g., half damage on a successful save).
- **ON:** every damage roll immediately reduces the appropriate HP bar.

**Sticky damage notes (arena overlays):**
- Absolutely positioned in the top-right corner of each zone, stacked vertically.
- Each damage roll in a turn appends one note (label + value).
- When two or more notes exist, a running total note appears at the bottom: `= N`.
- Cleared when a new `Roll Attack` fires.

**Bonus / Extra Damage Roll:**
- A `+ Bonus Roll` button fires an additional independent damage roll.
- Uses a separate die selector and count (e.g. `2d6` fire damage on top of weapon damage).
- Supports **exploding dice**: a checkbox labeled `Exploding` — when checked, any die that rolls its maximum value spawns one additional die of the same type, recursively, until no max results remain.
- Multi-arrow / burst: set count to the number of arrows/hits; each die rolls independently and all totals sum.

### D — Opponent / Enemy Selector

Dropdown with `<optgroup>` tiers. Selecting a preset auto-fills all stats and sets Target AC.

---

## Enemy Table (Full AC Range)

| Key | Name | AC | AC Tier | HP | Atk+ | Damage | Notes |
|---|---|---|---|---|---|---|---|
| `dummy` | Training Dummy | 1 | Masochism | 999 | — | — | Never attacks |
| `prone_commoner` | Prone Commoner | 4 | Helpless | 4 | +0 | 1d2 | |
| `giant_rat` | Giant Rat | 5 | Feeble | 7 | +4 | 1d4+2 | |
| `zombie` | Zombie | 8 | Shambling | 22 | +3 | 1d6+1 | |
| `kobold` | Kobold | 10 | Unarmored | 5 | +4 | 1d4+2 | |
| `npc_vendor` | Human NPC Vendor | 10 | Unarmored | 4 | +2 | 1d4 | |
| `cultist` | Cultist | 12 | Robes | 9 | +3 | 1d6+1 | |
| `giant_spider` | Giant Spider | 12 | Chitin | 26 | +5 | 1d8+3 | |
| `wolf` | Wolf | 13 | Pack Hunter | 11 | +4 | 2d4+2 | |
| `skeleton` | Skeleton | 13 | Bone Plate | 13 | +4 | 1d6+2 | |
| `orc` | Orc | 13 | Hide Armor | 15 | +5 | 1d12+3 | |
| `goblin` | Goblin | 15 | Nimble | 7 | +4 | 1d6+2 | |
| `hobgoblin` | Hobgoblin | 15 | Chain Mail | 11 | +3 | 1d8+1 | |
| `gnoll` | Gnoll | 15 | Hide Armor | 22 | +4 | 2d6+2 | |
| `berserker` | Orc Berserker | 16 | Brute | 52 | +5 | 2d6+3 | |
| `bandit_captain` | Bandit Captain | 17 | Half-Plate | 65 | +5 | 2d6+3 | |
| `troll` | Troll | 17 | Hide+Regen | 84 | +7 | 2d6+4 | |
| `veteran` | Veteran Soldier | 18 | Plate Mail | 58 | +5 | 2d8+3 | |
| `knight` | Knight | 19 | Full Plate | 52 | +5 | 2d8+4 | |
| `stone_golem` | Stone Golem | 20 | Living Rock | 178 | +8 | 3d8+5 | Magic resistance |
| `ancient_dragon` | Ancient Dragon | 22 | Godlike | 546 | +14 | 4d6+9 | Fear aura |
| `custom` | Custom | — | — | — | — | — | All fields editable |

Dropdown optgroups: **Trivial (1–8)** · **Easy (9–12)** · **Medium (13–16)** · **Hard (17–19)** · **Godlike (20+)**

---

## Action Plan

### Step 1 — HTML Skeleton ✅
- Single `roll2hit.html`
- Page structure: header, playfield (4 quads + log), config panel
- CSS grid: 3-column × 2-row playfield, config scrolls below

### Step 2 — CSS Layout & Theme ✅
- CSS custom properties color system (gold, red, dark navy)
- 4-quadrant grid, log column, config sections
- Mobile breakpoint: 2-col playfield, log stacks below

### Step 3 — Dice Engine
- `rollDie(n)` — cryptographically simple, uniform 1–n
- `rollWithMode(mode)` — returns `{ result, both[], kept }` for adv/dis/normal
- `resolveAdvMode(playerMode, oppMode)` — combination matrix
- `rollDamage(count, die, mod, crit)` — returns `{ rolls[], total }`
- Critical: doubles `count`, re-rolls all dice

### Step 4 — Character Sheet State
- JS state object: scores, level, profBonus, ac, hp, proficiencies
- `abilityMod(score)`, `profBonus(level)` pure functions
- All config inputs live-bind to state object
- Modifier breakdown display updates reactively

### Step 5 — Enemy Database & Opponent Logic
- Full 22-entry ENEMIES object
- Opponent state with hp tracking
- Dropdown populates opponent; custom fields on "Custom"
- HP bars track damage taken

### Step 6 — Roll Logic by Phase
- Attack Roll: d20 + abilityMod + profBonus (if proficient) vs target AC
- Skill Check: same formula, skill→ability mapping, vs DC
- Saving Throw: same formula + save proficiency, vs DC
- Natural 1/20 override logic
- Opponent auto-rolls attack on their button
- **Off-hand attack:** same d20 roll formula, but damage = dice only (no STR/DEX mod added); only available when shield checkbox is unchecked
- **Auto-Damage toggle:** damage rolls show numbers and sticky notes regardless; only reduce HP when toggle is ON (default OFF)
- **Bonus damage roll:** fires independently of the main roll; supports exploding dice (recursive max-value rerolls); all dice in a burst/multi roll individually and sum
- **Advantage/Disadvantage:** `resolveAdvMode(playerMode, oppMode)` maps opponent state as its mirror (Opp DIS → effective ADV, Opp ADV → effective DIS); two same-effective-direction sources stay as single ADV or DIS; opposite directions cancel; UI enforces one side non-NORM at a time

### Step 7 — Roll Log
- `rollHistory[]` array, newest first
- Render on each roll event, max 20 visible
- Format: compact 1-line + sub-line for damage

### Step 8 — Round/Turn Flow
- Round counter increments each time opponent rolls
- Player rolls damage auto-triggers on HIT or CRIT
- HP tracking: damage applied to target HP bar

### Step 9 — Polish
- Crit banner + doubled damage dice display
- Nat 1 auto-miss label
- Advantage: both dice shown, dropped one grayed/struck
- Spell save DC formula display: `8 + prof + spellcasting mod`
- New Combat button resets HP and log

### Step 10 — Animation (Last)
- CSS `@keyframes` shake on roll
- Number count-up animation on result
- SVG polygon die face icons (icosahedron wireframe, no CDN)
- Optional: canvas tumble on nat20/nat1

---

## Phase 2 — Arena Redesign

### Goals

- Replace the cramped 4-quadrant grid with a cinematic 3-column layout that mirrors a real tabletop: two players across from each other, dice landing between them.
- Promote the combat log from a narrow sidebar to a wide history panel with legible "card" entries.
- Add rich die-face visuals with a randomization animation before settling.
- Persist a per-die histogram at the bottom of the config scroll area.
- Left panel keeps only what is absolutely needed for a roll — **make the Roll Attack button visually dominant (larger)**.
- Config panel stays as a scrollable section below the playfield (unchanged from Phase 0).

---

### Phase 2 Layout

```
┌──────────────────┬─────────────────────────────┬──────────────────────┐
│   LEFT PANEL     │       CENTER ARENA           │   HISTORY PANEL      │
│   (fixed ~210px) │       (flex, grows)          │   (fixed ~210px)     │
│                  │                              │                      │
│  [Opp name/AC]   │  ┌──────────────────────┐   │  ┌────────────────┐  │
│  [Opp HP bar]    │  │  OPPONENT ZONE (top) │   │  │ R3  OPP        │  │
│  [DIS|NORM|ADV]  │  │  die faces tumble    │   │  │ 9+3=12         │  │
│  [Roll Opponent] │  │  d20 · dmg dice      │   │  │ vs AC 13  MISS │  │
│  ─────────────── │  │  result banner       │   │  └────────────────┘  │
│  [Your HP bar]   │  ├──────────────────────┤   │                      │
│  [Your AC/stats] │  │  YOU ZONE (bottom)   │   │  ┌────────────────┐  │
│  [DIS|NORM|ADV]  │  │  die faces tumble    │   │  │ R3  YOU BONUS  │  │
│  [Adv badge]     │  │  d20 · dmg dice      │   │  │ 2d6 = [4,5]=9  │  │
│                  │  │  result banner       │   │  └────────────────┘  │
│  ┌────────────┐  │  └──────────────────────┘   │                      │
│  │ ROLL ATK   │  │                              │  ┌────────────────┐  │
│  │  (large)   │  │  ── Quick Dice ──────────── │  │ R4  YOU        │  │
│  └────────────┘  │  free roll results appear   │  │ 17+2=19        │  │
│  [🗡 Roll Damage]│  in YOU zone, labeled FREE  │  │ vs AC 12  HIT  │  │
│  [Auto-Damage]   │                              │  │ dmg 2d6+2 = 11 │  │
│  [↩ Off-hand]    │                              │  └────────────────┘  │
│  [+Bonus Roll]   │                              │                      │
│  [New Combat]    │                              │  ← newest at bottom  │
│                  │                              │    auto-scrolls down │
└──────────────────┴─────────────────────────────┴──────────────────────┘
         [Config panel scrolls below — histogram is the last section  ]
```

**Left panel** — all interactive controls, both HP bars, both adv/dis toggles. Roll Attack button is visually large and dominant. Config panel remains below as a scrollable section.  
**Center arena** — display-only; top half belongs to opponent, bottom half to player. Visual boundary (subtle dividing line or gradient) separates the two territories. Quick Dice free-roll results appear in the YOU zone.  
**Right history panel** — stacked card entries, **newest at bottom**, auto-scrolls to keep latest visible. Each card is a self-contained block.

---

### Phase 2 — Die Face Visualization

Each die result shows as a styled polygon with the landed face visible.

- **Randomization animation:** before settling, the die face cycles through 4–6 random values at ~80 ms intervals for ~500 ms total, then snaps to the real result. Done purely in JS (`setInterval` → `clearInterval`) — no CSS keyframe dependency. **No click-to-bypass** — animation always plays fully.
- **Die shapes (inline SVG, no CDN):**
  - `d4` — triangle
  - `d6` — square/cube face
  - `d8` — diamond (two triangles)
  - `d10 / d12` — stylized pentagon
  - `d20` — icosahedron face (triangle with inner lines)
  - `d100` — circle with `%` label
- Numbers sit centered inside the SVG shape.
- Nat 20: gold glow pulse. Nat 1: red glow. Crit hit: shape briefly scales up.
- Multiple damage dice shown as a row of smaller face chips.

---

### Phase 2 — History Panel (Card Format)

Each roll event becomes a card block:

```
┌─────────────────────────────┐
│  R4  YOU  [Attack Roll]      │
│  [d20 face: 17] +2 = 19     │
│  vs AC 12  ✓ HIT            │
│  dmg  [d6:4][d6:5]+2 = 11   │
└─────────────────────────────┘
```

- Cards stack top-to-bottom, **newest at bottom**; panel auto-scrolls to keep latest card visible.
- Card width fills the right panel; height is content-driven.
- Actor color coding: gold left-border (YOU), red left-border (OPP), purple left-border (BONUS/FREE).
- Older cards fade slightly (lower opacity) to keep focus on recent events.
- Max 30 cards in DOM; oldest pruned as new ones arrive.

---

### Phase 2 — Dice Histogram

Tracks the last 100 rolls per die type, displayed as a section at the bottom of the config scroll area (the last card in the config panel, scrolled to naturally).

**Data structure:**
- `historyRing[dieType]` — a ring buffer capped at 100 entries per die type
- On each individual die roll, push value into the ring, evict oldest if over 100
- `histogram[dieType][faceValue]` derived by counting the ring buffer

**Display:**
- Last section inside the config panel scroll area — scroll down past the config sections to reach it
- Die types that have been rolled appear as **columns in a row**, side by side, so distributions are visually comparable
- Each column = one die type's bar chart (face values on x-axis, bar height on y-axis)
- Column width scales to the number of faces: d4 is narrow, d20 is wide, d100 is widest

**Scale — normalized to unity:**
- The tallest bar in each histogram is always rendered at full height (100%)
- All other bars in that die's chart are `count / maxCount` of that die — relative, not absolute
- This means a d20 with one face at 8 rolls and another at 2 rolls would show 100% vs 25%
- Unity normalization makes the shape of the distribution visible at any sample size
- A perfectly flat distribution (ideal RNG) produces equal-height bars

**Labels and metadata:**
- Die type label above each column (e.g. `d20`)
- Sample count below each column (e.g. `n=47`)
- Face value labels on bars (for small dice d4–d12); for d20 and d100 use tick marks at intervals
- d100 bucketed into 10-value groups (1–10, 11–20 … 91–100) — 10 bars total

**Behavior:**
- Histogram persists across combats within a session
- "Clear Stats" button resets all ring buffers
- Free rolls and bonus rolls are counted the same as combat rolls

---

### Phase 2 — Action Plan

#### Step P1 — Layout Restructure ✅
- Replace 4-quadrant CSS grid with 3-column layout: `left-panel | arena | history-panel`
- **Left panel** (~210px fixed): flex-column — opp stats/HP/toggles, Roll Opponent button, divider, your HP/stats/toggles, **large roll button** (dominant size, ~2× normal) whose label updates with the active Roll Mode tab (`⚔ ROLL ATTACK` / `🎲 ROLL CHECK` / `🛡 ROLL SAVE`), then `🗡 Roll Damage` / `Auto-Damage` toggle / `↩ Off-hand` / `+ Bonus Roll` / New Combat as smaller secondary buttons below
- **Arena**: flex-column, `opp-zone` (top 50%) + `you-zone` (bottom 50%), subtle center divider; display-only
- **History panel** (~210px fixed): flex-column, overflow-y scroll, newest card appended to bottom, auto-scrolls on new entry
- Config panel remains unchanged below the playfield (scrollable)
- Histogram is the last section inside the config panel (same scroll area as Roll Mode, Character Sheet, etc.)

#### Step P2 — Die Face SVG Components ✅
- `dieSVG(sides, value, size, glowClass)` — returns inline SVG for each die shape (triangle d4, square d6, diamond d8, pentagon d10/d12, tri-with-lines d20, circle d100)
- Numbers centered in SVG viewBox; font-size scales with string length
- CSS classes for glow states: `.glow-nat20` (gold drop-shadow), `.glow-nat1` (red drop-shadow), `.glow-crit` (gold drop-shadow + scale)
- **Three sizes:** `hero` (88px) for the d20 hero slot, `med` (60px) for multi-die free rolls shown side-by-side, `chip` (36px) for damage dice rows

#### Step P3 — Randomization Animation (no bypass) ✅
- `animateRoll(el, sides, finalValue, onDone)` — `setInterval` at 80 ms cycling random face values, auto-stops at ~500 ms, then sets `finalValue` and calls `onDone`
- HP changes and log card insertion happen inside `onDone`, not before
- Multiple damage dice run their intervals in parallel; all call `onDone` — gate on a promise counter so HP/card only fires after the last die settles
- No click-to-skip — animation always completes

#### Step P4 — History Panel Cards ✅
- `buildCard(entry)` — returns a `<div class="hcard">` DOM node from a log entry
- Card left-border color: gold (YOU), red (OPP), purple (BONUS/FREE)
- Appended to bottom of history panel; `scrollTop = scrollHeight` after append
- Older cards get lower opacity via `:nth-last-child` CSS rule (most recent = full opacity)
- Prune to max 30 cards; remove `firstChild` when over limit

#### Step P5 — Histogram Engine ✅
- `histRing[dieType]` — array capped at 100, push new value and shift oldest when full
- `histCounts(dieType)` — derive `{face: count}` map from the ring
- `renderHistogram()` — clears and rebuilds histogram strip; one column per die type that has data
- Each column: die label, bar chart (bars as `<div>` with `height: N%` where N = count/maxCount × 100), sample count `n=X`
- d100 bucketed into 10 groups before rendering
- "Clear Stats" button calls `histRing = {}` and re-renders

#### Step P6 — Quick Dice Integration ✅
- Quick Dice buttons in left panel (compact row): `d4 d6 d8 d10 d12 d20 d100 · 2d6`
- Free-roll result animates into YOU zone; labeled `FREE ROLL` in arena and history card
- `recordRoll(die, value)` called for each die face — counts toward histogram ring

---

## Phase 3 — Combat Utility Features (roll2hit-v3.html)

### Goals

Extend the arena with real-time combat-state tracking while keeping the interface fast to use. No character-sheet focus — every addition must be reachable in one click or one dropdown during a fight. Features are added one atomic step at a time; each step leaves the file in a working state.

**File:** `roll2hit-v3.html` — started as a direct copy of `roll2hit-v2.html`.

---

### Phase 3 — Feature Overview

| # | Feature | Where it lives | One-line description |
|---|---|---|---|
| S1 | On-die display ✅ | Arena outcome banners | Show raw d20 value + "NAT 20" badge separately from the modified total |
| S2 | Resistance / Vulnerability ✅ | Arena zone header chips | ½ / ×2 buttons per zone; applied at HP-reduction step |
| S3 | Damage multiplier ✅ | Left panel near Roll Damage | ×1 ×2 ×3 ×4 row multiplies weapon dice count for one roll |
| S4 | Initiative ✅ | Top of left panel | d20+DEX vs d20+enemy; displays who acts first this round |
| S5 | Healing roll ✅ | Left panel | Rolls configurable die+mod; adds to player HP if Auto-Damage ON |
| S6 | Conditions ✅ | Config panel + arena badges | Dropdown per side; auto-sets adv/dis; shows active badge in zone |
| S7 | Death Saves ✅ | Arena YOU zone | HP=0 triggers 3-pip save tracker; d20 roll with nat-1/nat-20 rules |
| S8 | Sneak Attack ✅ | Config panel (Weapon section) | Checkbox + auto die-count (level/2 d6s); added to Roll Damage |
| S9 | Multi-attack ✅ | Left panel | 1–4 counter fires N sequential Roll Attack passes, tallies hits |
| S10 | Cleanup / Refactor ✅ | Whole file | Dead-code removal, CSS audit, comment pass, rename for consistency |
| S11 | World / Terrain Monster Tables ✅ | Config panel (Opponent) | MONSTER_POOL + WORLD_DB; terrain cascade dropdown → monster list |

---

### Phase 3 — Detailed Step Specs

#### Step S0 — File copy ✅
```bash
cp roll2hit-v2.html roll2hit-v3.html
```
No code changes. All Phase 3 work targets `roll2hit-v3.html` only.

---

#### Step S1 — On-die Display  ✅  `roll2hit-v3.html`

**What changed:**
- Outcome banner converted from a single text node to a `flex-column` container with two child spans.
- Line 1 (`.ob-die`, 36px, font-weight 900): raw d20 value. `NAT 20` in gold glow; `NAT 1` in red glow.
- Line 2 (`.ob-total`, 12px): modifier breakdown + hit/miss verdict, e.g. `+5+3(prof) = 21  ✓ HIT vs AC 13 — Roll Damage`.
- Non-d20 outcomes (damage, bonus, free roll) use a single `.ob-total` span — preserves flex alignment without the big number.
- All d20 roll paths wired: `playerRoll()`, `oppRoll()`, `offhandRoll()`.
- Helper `setOutcomeDie(el, dieVal, totalLine, outcomeClass)` centralises the two-line HTML construction.

**CSS added:**
```css
.ob-die        — 36px, font-weight 900
.ob-die.nat20  — var(--gold-lt) + text-shadow glow
.ob-die.nat1   — var(--red-lt) + text-shadow
.ob-total      — 12px, font-weight 700, opacity 0.9
.adv-badge.show-cancelled — dim badge for "NORM (cancelled)" state (bug fix)
```

**State changes:** none.

---

#### Step S2 — Resistance / Vulnerability  ✅  `roll2hit-v3.html`

**What changed:**
- Each arena zone has a `½ RES · NORM · ×2 VULN` button row, absolutely positioned bottom-right of the zone.
- `S.opp.dmgMod` and `S.player.dmgMod` hold `0.5 | 1 | 2` (default 1).
- `applyDmgMod(rawDmg, mod)` — resistance: `Math.max(1, Math.floor(raw × 0.5))`; vulnerability: `raw × 2`; normal: unchanged.
- `dmgModLabel(mod)` — returns `' [½ RES]'`, `' [×2 VULN]'`, or `''` for history cards.
- All three HP-reduction paths updated: `rollMainDamage()` (opp), `offhandRoll()` (opp), `oppRoll()` (player).
- History card damage lines show `14→7 [½ RES]` or `14→28 [×2 VULN]` when mod ≠ 1.
- Outcome banner shows `14→7` inline on the damage line.
- Zone gets `.zone-res` (faint blue tint) or `.zone-vuln` (faint red tint) class.
- `newCombat()` resets both dmgMod values and clears all button/zone states.
- `.adv-badge.show-cancelled` CSS bug fix also included (was fighting inline style).

---

#### Step S3 — Damage Multiplier ✅

**What changes:**
- A compact `×1 ×2 ×3 ×4` button row directly below the `🗡 Roll Damage` button
- Active selection stored in `S.dmgMultiplier` (default 1)
- `rollMainDamage()` uses `S.weapon.count * S.dmgMultiplier` as the dice count
- Does NOT stack with crit doubling — crit doubles independently first, then multiplier applies: `count = weapon.count × crit_factor × multiplier`
- Multiplier resets to ×1 after each Roll Attack (same as clearing sticky notes)
- History card notes: `3× 1d8+3 = 27`
- Use case: Divine Smite (add ×2 or ×3 dice to one hit), Fireball applied to multiple targets manually, etc.

**State changes:** `S.dmgMultiplier = 1`

**HTML additions:** `<div class="dmg-mult-row">` with four `.dmg-mult-btn` buttons

**CSS additions:** `.dmg-mult-btn`, `.dmg-mult-btn.active` (gold border)

**JS changes:** `rollMainDamage()` reads multiplier; `playerRoll()` resets it.

---

#### Step S4 — Initiative Roll ✅

**What changes:**
- A `⚡ INITIATIVE` button at the very top of the left panel (above the opponent section), or as a small row below "New Combat"
- Rolls `d20 + DEX mod` for player, `d20 + enemy.atk` for opponent (enemy atk bonus used as initiative proxy)
- Displays result in a compact banner above the left panel or in a toast overlay
- Winner gets a `▶ GOES FIRST` badge; loser gets a muted `SECOND` badge
- Ties go to player
- Appends an `INITIATIVE` history card (actor: `FREE`)
- Does not lock any buttons — purely informational

**State changes:** none persistent (display only)

**HTML additions:** `#initiative-bar` — one-line banner above the divider at the top of left panel

**JS additions:** `rollInitiative()` function

---

#### Step S5 — Healing Roll ✅

**What changes:**
- `💚 Heal` button in left panel (after `↩ Off-hand`)
- Config section "Healing" (in config scroll, after Weapon): die selector `d4/d6/d8/d12`, count (1–6), flat mod (e.g. CON mod)
- On click: animates chips in YOU zone hero slot; outcome banner shows `+ HEAL: 12`
- If `S.autoDamage` ON: adds to `S.player.hp` (capped at maxHp); refreshes HP bar
- If OFF: shows number only, no HP change
- Sticky note in YOU zone uses green `💚 12` style
- History card: actor `HEAL`, green left-border

**State changes:** `S.heal = { die: 8, count: 1, flatMod: 0 }`

**HTML additions:** `#heal-die-sel`, `#heal-count`, `#heal-flat` inputs in new config section; `heal-btn` in left panel

**CSS additions:** `.ob-heal` (green), `.hcard-heal` (green left-border), `.dmg-note-heal` (green note chip)

---

#### Step S6 — Conditions ✅

**What changes:**
- Each side (Opp + You) gets a `Condition:` dropdown in the left panel (below their adv row), pre-filled with common combat conditions
- Selecting a condition automatically sets the adv/dis toggle to the correct value and shows a small badge inside the zone
- Multiple conditions: the dropdown can only hold one at a time (most impactful condition wins)
- Condition badges shown inside the arena zone (top area, alongside zone label)
- `Clear` option in dropdown resets to NORM

**Condition → adv/dis mapping:**

| Condition | Effect on attacker's roll |
|---|---|
| Prone (opp) | ADV to melee attackers within 5 ft |
| Restrained (opp) | ADV to all attackers |
| Paralyzed (opp) | ADV + auto-crit on melee within 5 ft |
| Blinded (opp) | ADV to attackers |
| Poisoned (you) | DIS on attack rolls |
| Frightened (you) | DIS on attack rolls while source visible |
| Exhausted (you) | DIS on attack rolls |
| Invisible (you) | ADV on all attacks |
| Dodge (opp) | DIS to all attackers |
| Dodge (you) | Not applicable to attack |
| None | NORM |

**State changes:** `S.opp.condition = 'none'`, `S.player.condition = 'none'`

**HTML additions:** `<select id="opp-condition">` and `<select id="player-condition">` in left panel; `.condition-badge` overlay in each zone

**JS additions:** `applyCondition(side, condition)` — sets adv/dis and badge; called on dropdown change

**Note:** Conditions that say "ADV to attackers" set `S.opp.adv` to match; conditions that say "DIS on attacks" set `S.player.adv`.

---

#### Step S7 — Death Saves ✅

**What changes:**
- When `S.player.hp` reaches 0 (from enemy damage or Roll Damage hit), YOU zone switches to death-save mode:
  - The outcome banner is replaced by a death-save UI: three `○` success pips and three `○` failure pips
  - A `💀 DEATH SAVE` roll button appears (replaces Roll Attack in left panel, temporarily)
  - Rolls `d20` (no mods, no adv/dis unless conditions say otherwise): 10+ = success, nat 20 = stabilize at 1 HP and reset, nat 1 = two failures
  - Three successes = stable (unconscious, not dying)
  - Three failures = dead
- Stabilizing or healing re-shows the normal arena
- `New Combat` also resets death save state

**State changes:** `S.deathSaves = { successes: 0, failures: 0, active: false }`

**HTML additions:** `#death-save-ui` overlay inside YOU zone (hidden by default, shown when active)

**JS additions:** `enterDeathSaves()`, `rollDeathSave()`, `exitDeathSaves()`

---

#### Step S8 — Sneak Attack ✅

**What changes:**
- New subsection in the Weapon config section: `Sneak Attack`
- Checkbox: `Enable Sneak Attack`
- Auto-computed die count: `⌊level / 2⌋` d6s (displayed read-only, no input needed)
- Manual override count input (in case you want to specify directly)
- Active checkbox: `Sneak Attack this hit` — must be ticked per-hit (player decides when it applies)
- When ticked: `rollMainDamage()` adds `sneak_count d6` to the damage roll chips; separate chip color (purple)
- No ability mod on sneak attack dice; they are added raw
- History card shows: `🗡 DMG: 14 + SNEAK: 9 = 23`

**State changes:** `S.sneak = { enabled: false, active: false, count: 3 }`

**JS changes:** `rollMainDamage()` checks `S.sneak.active`, appends extra d6 rolls, resets `S.sneak.active` to false after each roll

---

#### Step S9 — Multi-attack ✅

**What changes:**
- `Attacks: 1 2 3 4` chip row in the left panel (below Roll Attack button)
- Stored in `S.multiAttack` (default 1)
- When > 1: `playerRoll()` fires sequentially — attack 1 animates, shows result, then auto-triggers attack 2 after 400 ms pause, etc.
- Between attacks a small counter banner shows `Attack 2 of 3`
- Each attack is independent (separate d20 rolls, separate adv/dis)
- Roll Damage button still applies to the last resolved attack (or player clicks after each hit)
- History card per attack: `YOU — Atk 2/3: d20(14)+5=19 ✓ HIT`

**State changes:** `S.multiAttack = 1`, `S.currentAttack = 0`

**JS changes:** wrap `playerRoll()` in a recursive chain that decrements `S.remainingAttacks` and re-fires after animation settles.

---

#### Step S11 — World / Terrain Monster Tables ✅

**What changes:**
- Replace the single flat `enemy-select` dropdown with a two-level cascade: **Terrain** → **Monster**
- `WORLD_DB` object keyed by terrain ID, each value an array of monster stat-blocks sorted by AC, grouped into tiers
- 16 terrain categories (see `spec-world.md` for full catalog); max 60 monsters per terrain
- Terrain selector: `<select id="terrain-select">` with 16 `<option>` entries
- Monster selector: `<select id="terrain-enemy-select">` repopulates on terrain change; uses `<optgroup>` for tier bands
- Selecting any monster calls `loadEnemyPreset()`-equivalent using the WORLD_DB entry
- Existing hand-keyed `ENEMY_DB` and `enemy-select` remain as a "Favorites" option in the terrain selector for backward compatibility
- Full catalog spec and data structures documented in `spec-world.md`

**Terrains:** city · alley · storefront · bar · inn · tavern · outhouse · sewers · crypt · catacombs · forest · desert · ocean · islands · arctic · heavenly-clouds

**State changes:** `S.terrain = 'city'`

**HTML changes:** replace `<select id="enemy-select">` area with two-row cascade; terrain row + monster row

**JS additions:** `WORLD_DB`, `populateTerrainEnemies(terrainId)`, `loadWorldMonster(entry)`

---

#### Step S10 — Cleanup / Refactor ✅

**What changes:**
- Remove any dead CSS classes (especially leftover from Phase 1/2 rewrites)
- Rename all `S.autoHit` remnants (already done), ensure no stale variable names
- Extract repeated DOM-lookup patterns into cached references or micro-helpers
- Consolidate `refreshLeftPanel()` — it currently does many things; split into focused sub-refreshes called only where needed
- Audit all `disableAllRollBtns()` calls — multi-attack and death saves introduce new timing complexity
- CSS audit: consolidate `.btn-sm`, `.btn-sm-red`, `.auto-dmg-toggle` into a single parameterized button utility class with modifier variants
- Comments pass: add a one-line section header above each major function group
- Final line count target: keep under 2 600 lines

---

### Phase 3 — Left Panel Layout (target after all steps)

```
┌──────────────────────┐
│  ⚡ INITIATIVE        │  ← S4, compact one-line
│  [Opp name·AC·HP]    │
│  [Opp HP bar]        │
│  [DIS|NORM|ADV]      │
│  [Condition: ▾]      │  ← S6
│  [Roll Opponent]     │
│  ────────────────    │
│  [Your HP bar]       │
│  [AC · PROF]         │
│  [DIS|NORM|ADV]      │
│  [Condition: ▾]      │  ← S6
│  [Adv badge]         │
│  ┌──────────────┐    │
│  │ ⚔ ROLL ATK  │    │  ← large dominant button
│  └──────────────┘    │
│  [Attacks: 1 2 3 4]  │  ← S9
│  [🗡 Roll Damage]    │
│  [×1  ×2  ×3  ×4]   │  ← S3
│  [Auto-Damage: OFF]  │
│  [↩ Off-hand]        │
│  [💚 Heal]           │  ← S5
│  [+ Bonus Roll]      │
│  ────────────────    │
│  Quick Dice row      │
└──────────────────────┘
```

---

### Phase 3 — Config Panel Additions (target after all steps)

New sections added to the scrollable config panel:

- **Healing** — die selector, count, flat mod  (S5)
- **Sneak Attack** — enable checkbox, die count display, per-hit active checkbox  (S8)
- Existing Weapon section gains a note about Sneak Attack count auto-calc

---

---

## Phase 4 — Story Mode Combat System (roll2hit-v3.html, Layers 11–37)

This section documents the story-mode battle overlay that supersedes the standalone simulator for in-game encounters. The standalone simulator (Phases 0–3 above) remains fully functional; story mode adds a full-screen overlay on top of it with its own state and economy.

---

### Action Economy

Base round = **1.5 AP**. Two action types per round; bonus phases never combine into a main action.

| Phase | AP | Trigger |
|-------|----|---------|
| Main action | 1.0 | ⚔ Attack or 😬 Wimper |
| Bonus phase | 0.5 | Unlocked after any main action |

**Bonus phase options:** offhand attack (requires `usedRealAttack`), potion, spell scroll, flashbang, shield equip, flee (safe), pass.

**Action Surge** (Lv2+) grants +1.0 AP main + +0.5 AP bonus = **+1.5 AP** for the round.

| Level | Surge charges/short rest | Max attacks per round (with Surge) |
|-------|--------------------------|-------------------------------------|
| 1 | 0 | 1 main |
| 2–4 | 1 | 2 main |
| 5–10 | 1 | 4 (2 actions × 2 Extra) |
| 11–16 | 1 | 6 (2 actions × 3 Extra) |
| 17–19 | 2 | 9 (3 actions × 3 Extra) |
| 20 | 2 | 12 (3 actions × 4 Extra, crits on 17–20) |

**State fields:** `S_story.surgeCharges` (int, 0–2); `S_story.usedMainAttack`; `S_story.usedBonusAction`; `S_story.usedRealAttack`

---

### Fighter Features by Level — `FIGHTER_FEATURES`

Defined as a keyed object (`FIGHTER_FEATURES[lvl]`). Levels not listed (3→Improved Critical, 4,6,8,12,14,16,19→ASI) are handled by the `asi` flag and crit-range check in `_storyPlayerAttack()`.

| Lv | Feature | Mechanic | Rest gate | Bonus HP roll |
|----|---------|----------|-----------|--------------|
| 2 | Action Surge I | `surgeCharges`: spend 1 → reset main action | short rest | — |
| 3 | Improved Critical | crits on 19–20 | passive | — |
| 4 | ASI | +2 stat points (player allocates) | — | — |
| 5 | Extra Attack I | `_extraAttackCount()` → 2 rolls/action | passive | — |
| 6 | ASI | +2 | — | — |
| 7 | Remarkable Athlete | — | level-up | **+d10 HP** |
| 8 | ASI | +2 | — | — |
| 9 | Indomitable I | `indomitableCharges`: reroll failed death save | long rest | — |
| 10 | Fighting Style | — | level-up | **+d10 HP** |
| 11 | Extra Attack II | `_extraAttackCount()` → 3 rolls/action | passive | — |
| 12 | ASI | +2 | — | — |
| 13 | Indomitable II | — | level-up | **+d10 HP** |
| 14 | ASI | +2 | — | — |
| 15 | Superior Critical | crits on 18–20 | passive | — |
| 16 | ASI | +2 | — | — |
| 17 | Action Surge II | `surgeCharges` pool → 2/short rest | short rest | — |
| 18 | Survivor | — | level-up | **+d10 HP** |
| 19 | ASI | +2 | — | — |
| 20 | Extra Attack III | `_extraAttackCount()` → 4 rolls/action; crits 17–20 | passive | — |

**`_extraAttackCount()`**: returns 1 (Lv1–4), 2 (Lv5–10), 3 (Lv11–19), 4 (Lv20). Used in `_overlayPlayerAttack()` loop.

**Crit range**: Lv1–2: nat20 only. Lv3–14: 19–20. Lv15–19: 18–20. Lv20: 17–20.

---

### Death Saves — Story Mode

Story mode uses its own death save implementation (`_storyEnterDeathSaves()`, `_storyRollDeathSave()`) integrated into `#sbo-death-save-panel`, separate from the standalone `rollDeathSave()`.

**Indomitable I (Lv9):** When a death save roll < 10, if `S_story.indomitableCharges > 0`, the save is rerolled automatically and the higher result kept. Charge decrements. Resets to 1 on long rest (inn sleep).

```
_storyRollDeathSave():
  d20 roll
  if d20 < 10 and indomitableCharges > 0:
    reroll → keep higher; indomitableCharges--
    log "🛡 Indomitable! rerolled N → M"
  3 successes → stabilize
  3 failures  → game over
```

---

### Short Rest vs Long Rest — Charge Resets

| Resource | Short Rest reset | Long Rest reset |
|----------|-----------------|----------------|
| `surgeCharges` | restored to full (1 or 2 by level) | restored |
| `indomitableCharges` | — | restored to 1 (if Lv9+) |
| `shortRests` | — | reset to 3 |
| Player HP | 0 (no heal from short rest directly) | 2×d10+CON first visit / 1×d10+CON revisit |

**Short rest HP:** each short rest charge heals `floor(hpMax × 0.25)` HP.

---

### Starting Equipment (New Game)

| Slot | Item | Stats |
|------|------|-------|
| Main weapon (`equippedMainWeapon`) | Pointy Stick | 1d4, magicBonus:0 |
| Offhand (`equippedWeapon`) | Flint Dagger | atkBonus:−3 |
| Inventory | Rusted Dagger, 2× Minor Healing Potion | — |

---

## License

MIT License

Copyright (c) 2026 roll2hit.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
