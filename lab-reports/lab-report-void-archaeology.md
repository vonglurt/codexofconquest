<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — Layer 52: Void Archaeology "The Architecture"

**IEEE-Format Post-Mortem**  
**Date:** 2026-05-25 · **Revised:** 2026-07-07  
**Layer:** 52  
**Section:** §XVII  
**Status:** ✅ Implemented — **arc-blocking bug fixed 2026-07-07** (see §VI)  
**Codebase:** `roll2hit-v3.html` — single-file browser RPG

> **⚠️ Node-code note (2026-07-07):** this report was written before the §WALK/§NAV world rewrite renamed every node to airport-style codes. The original logical codes used throughout the prose map to current node codes as: **CI → `LHR`** (City Streets — Birka; the Blue Shutters Archive), **SL → `BMA`** (Birka Slums), **DF → `ZRH`** (name `defi_land`, the Defiant Fields), **WM → `NUE`** (Scholar's Quarter — Weimar; the lower archive), **MT → `GVA`** (Mountain Pass — High Crest), **SQ → `NUE`** (same node as WM — the Weimar archive *is* the Scholar's Quarter). `CO` = the victory/ending screen (not a graph node). Tables and file references below have been updated to current codes and line numbers; §VI records the bug the stale `WM` code caused.

---

## Abstract

This report documents the design intent, implementation architecture, and narrative integration of Layer 52 — Void Archaeology, subtitled "The Architecture." This layer is a NG+-exclusive investigation arc that places five `[INVESTIGATE]` buttons at existing nodes (`LHR`, `BMA`, `ZRH`, `NUE`, `GVA`), each revealing a mark left by the First Researcher 200 years before the game's events. Collecting all five unlocks a fourth document in the Weimar archive (`NUE`) — the Constructor's Log — which in turn enables opening the sealed Mountain Pass (`GVA`) tunnel, the only room in the game sealed before the Scholar Kings existed. The arc concludes at the Scholar's Quarter (`NUE`) where Benedikt delivers the "four-author chain" synthesis: the First Researcher built the cage, Froberger found the mechanism, the player closed it, and Entry 42 is the fourth link. `vaArchitectureKnown` gates a fifth ending variant at the victory screen, adding the addendum *"The story has four authors now."*

---

## I. Design Intent

### A. The Retroactive World

The First Researcher (revealed by name in §XVI as Marta Eilene Vass) predates the Scholar Kings by a generation. Her marks are at nodes the player has visited since Act I. She was at the Blue Shutters Archive (`LHR`). She marked a corner building in the Slums (`BMA`). The Defiant Fields battle (`ZRH`) happened at the exact coordinates she chose for the sealing mechanism. The Weimar archive holds her personnel file (`NUE`). The Mountain Pass (`GVA`) tunnel was sealed by her from the inside.

The design goal of §XVII was retroactive recontextualization: the player has walked through five locations that were already hers. The `[INVESTIGATE]` buttons surface what was always true about the world. Nothing is retconned — the marks were always there. The player lacked the knowledge to see them.

This required the arc to be NG+-exclusive: a first-run player doesn't have `wmFirstResearcherKnown` (unlocked by §XVI's quest_wm_04) and hasn't engaged with the First Researcher's identity at all. The retroactive reading only lands if the player has already learned who she was before they encounter her marks.

### B. The Four-Author Chain

The closing synthesis, delivered by Benedikt at the Scholar's Quarter (`NUE`), names four contributors to the Antecedent containment:

1. **The First Researcher** — built the cage; wrote the Constructor's Log; left no name
2. **Froberger** — found the mechanism; documented it in his field notes; died for it
3. **The player** — activated the sealing mechanism at the Defiant Fields (`ZRH`) battle; closed the cage without knowing it
4. **Entry 42** — the player's own written entry; the fourth link that makes it a chain

The chain only has four links if the player wrote (or chose to leave blank) Entry 42. `vaArchitectureKnown` only sets when `entry42Written` is true. A player who skipped Entry 42 cannot complete quest_va_04. The arc requires self-authorship to close.

### C. The Sealed Tunnel

The Mountain Pass (`GVA`) tunnel is described from Act I in ambient lore as a sealed passage no one has opened. The Pilgrim NPC (~line 25381) says *"Someone sealed that tunnel before the Scholar Kings existed. I've been trying to find out who for forty years."* The tunnel was always a known mystery. §XVII makes it answerable: the First Researcher sealed it from inside after the final field test of the containment structure. The six sentences on the far wall are her last operational notes.

---

## II. Implementation Architecture

### A. Gate Condition

The entire Void Archaeology block is guarded by a single three-flag condition (~line 30234, inside `storyRender`):

```js
const _vaReady = (S_story.ngPlusRun || 0) >= 1
              && S_story.wmFirstResearcherKnown
              && S_story.entry42Written;
```

All three must be true:
- **ngPlusRun ≥ 1** — NG+ run (world knowledge presumed)
- **wmFirstResearcherKnown** — identity of the First Researcher known (§XVI quest_wm_04 complete)
- **entry42Written** — player has engaged the Entry 42 modal (even if they chose blank)

Until all three are true, `[INVESTIGATE]` buttons do not render, quest_va_01 does not activate, and the arc is entirely invisible.

### B. Five Investigation Sites

**Defined in the `_vaSites` map, ~lines 30235–30241:**

| Node | Flag | Investigation Text Summary |
|------|------|---------------------------|
| `LHR` | `vaCI` | Blue Shutters Archive shelf record — researcher category "Containment"; same shelf as archive letter |
| `BMA` | `vaSL` | Carved marker on a corner building predating the city by 80 years; predates the Scholar Kings |
| `ZRH` | `vaDF` | Stone alignment spaced to a mathematical interval; the battle happened at the activation point |
| `NUE` | `vaWM` | Document 3 in the lower archive — project codename now visible: ANTECEDENT CONTAINMENT PROTOCOL |
| `GVA` | `vaMT` | Sealed access tunnel; never opened in any record; sealed from inside; intact |

> **The `vaWM` site key was the arc-blocking bug (fixed 2026-07-07).** It was keyed `WM` — a logical code that ceased to exist after the §NAV rename — so `_vaSites[node.code]` never matched at the Weimar archive, the button never rendered, `vaWM` could never be set, and `vaAllMarksFound` (which requires all five flags) could never fire. Corrected to `NUE`, the current code for the Scholar's Quarter / Weimar archive. See §VI.

Each site: on button click, sets `S_story[flag] = true`, displays the site text, removes the button, and checks if all five flags are now set. When all five are collected, `vaAllMarksFound = true` fires with a 600ms delayed message: *"Five marks. One pattern. She was everywhere before anyone was looking."* `quest_va_02` activates at this point.

The `[INVESTIGATE]` button attaches after the story text box via `insertAdjacentElement('afterend', invBtn)` — consistent with other contextual buttons in the render pipeline. The button self-removes after clicking.

### C. Quest Chain

**Defined in QUEST_DB — lines 10727–10758 (UQF-1.0):**

| Quest | Title | Completion Condition | Reward |
|-------|-------|----------------------|--------|
| `quest_va_01` | The Architecture: Five Marks | `vaAllMarksFound` | (narrative only) |
| `quest_va_02` | The Architecture: Constructor's Log | `vaLogFound` | Constructor's Log (readable) + Antecedent Seal (relic) |
| `quest_va_03` | The Architecture: The Sealed Tunnel | `vaLastWardVisited` | +200gp |
| `quest_va_04` | The Architecture: The Chain | `vaArchitectureKnown` | (narrative only — closes the arc) |

**Activation sequence (all in the `[INVESTIGATE]` block, ~lines 30268–30294):**
- `quest_va_01` activates on first `[INVESTIGATE]` button encounter at any site
- `quest_va_02` activates when `vaAllMarksFound` fires
- `quest_va_03` activates when `vaLogFound` is true
- `quest_va_04` activates when `vaLastWardVisited` is true

### D. Constructor's Log as Document 4

The Weimar archive modal (`_storyWmArchiveModal()`, ~line 26563) conditionally renders a fourth document when `vaAllMarksFound` is true (Log read / `vaLogFound` set at ~lines 26619–26630). Document 4 — **The Constructor's Log** — contains seven entries in the First Researcher's handwriting, ending:

> *"If someone is reading this, the sealing mechanism has activated. The cage is closed. Whatever you sealed inside it — that is what I built this for. I am sorry. I did not have a better answer."*

Reading the Log:
- Sets `vaLogFound = true`
- Adds `The Constructor's Log` (readable item) and `Antecedent Seal` (relic) to inventory
- Activates `quest_va_03`

The Constructor's Log is thus discoverable in two ways: via the archive modal (Document 4 path) or via the `quest_va_02` reward `itemChain` (grant Log + Antecedent Seal, ~line 10738). Both paths converge on the same state flag.

### E. Mountain Pass (`GVA`) Tunnel Opening

**Condition (~lines 30273–30288):** At the Mountain Pass (`GVA`) node, if `vaLogFound` is true and `vaLastWardVisited` is false, the game checks for a key item:

```js
const _hasKey = (S_story.inventory || []).some(
  i => i.name === 'Antecedent Seal' || i.name === "Froberger's Field Notes"
);
```

Either item opens the tunnel. `Froberger's Field Notes` (the §XVI tome) is an alternative key — Froberger's notes reference the tunnel's design, and the seal on the Notes matches the tunnel's lock. The `Antecedent Seal` is the direct artifact; the Field Notes are the intellectual key.

On tunnel opening: `vaLastWardVisited = true`, and the chamber text renders describing cut stone, perfectly still air sealed for 200 years, and six sentences on the far wall — the First Researcher's final operational notes. The last line: *"The Antecedent was here. It is not anymore. You know where it is now."*

### F. Quest_va_04 Completion at the Scholar's Quarter (`NUE`)

**~Lines 30296–30302:** On any Scholar's Quarter (`NUE`) visit where `vaLastWardVisited` is true, `entry42Written` is true, and `vaArchitectureKnown` is not yet set:

```js
setTimeout(() => storyMsg(
  'Benedikt: "She built it. You closed it. Froberger found the mechanism. You followed him. ' +
  'Entry 42 is the fourth link. Four links is a chain. A chain holds. ' +
  'That is the only kind of answer this work produces — not a solution, a chain."'
), 700);
S_story.vaArchitectureKnown = true;
```

The 700ms delay gives the node text time to render before Benedikt speaks. `vaArchitectureKnown` sets immediately after the setTimeout registration — the flag is true before the message displays, preventing double-firing on rapid navigation.

### G. State Flags

**Defined in `_S_DEFAULTS()` — lines 22202–22203:**

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `vaCI` | boolean | `false` | CI site investigated |
| `vaSL` | boolean | `false` | SL site investigated |
| `vaDF` | boolean | `false` | DF site investigated |
| `vaWM` | boolean | `false` | WM site investigated |
| `vaMT` | boolean | `false` | MT site investigated |
| `vaAllMarksFound` | boolean | `false` | All five sites found; unlocks Document 4 |
| `vaLogFound` | boolean | `false` | Constructor's Log read; unlocks the Mountain Pass (`GVA`) tunnel |
| `vaLastWardVisited` | boolean | `false` | `GVA` tunnel opened; activates quest_va_04 |
| `vaArchitectureKnown` | boolean | `false` | Four-author chain understood; gates fifth ending |

### H. Victory Screen Integration

**Lines 27014 (fifth question), 27033–27043 (addendum):**

`vaArchitectureKnown` gates a fifth Sweelinck question variant at the victory/ending screen — overriding all other question branches:

```js
if (S_story.vaArchitectureKnown && S_story.entry42Written && (S_story.ngPlusRun || 0) >= 1) {
  sweelinckQ = '"What was inside the cage?"';
}
```

This question is only answerable by a player who has completed the entire arc. It is also unanswerable in-game — the cage contents are never specified. The question is Sweelinck's acknowledgment that the player knows what they did, not a prompt for an answer.

The addendum div appended below the ending text (~line 27040):
> *"Froberger wrote 41 entries. You wrote one. She wrote 7, and no one counted them for 200 years. The cage is closed. You know what it holds. The story has four authors now."*

---

## III. Design Decisions and Trade-offs

### A. NG+-Exclusive Gate as Narrative Requirement

The triple gate (`ngPlusRun ≥ 1`, `wmFirstResearcherKnown`, `entry42Written`) is not a difficulty gate — it is a comprehension gate. The arc only works if the player has the reading context for it. A first-run player at the DF stone alignment would see a math puzzle. A player who knows that Marta Eilene Vass chose this spot 200 years ago and that the battle activated her sealing mechanism sees the same stone alignment as the closing of a two-century-long plan. The information changes the object.

### B. `entry42Written` as Required for `vaArchitectureKnown`

`quest_va_04` cannot complete without `entry42Written`. This means a player who skipped Entry 42 (possible even in NG+ if `priorQuestMinusOne` was false) cannot be told "Entry 42 is the fourth link." The chain has only three links without it, and Benedikt does not speak. The arc is structurally incomplete — intentionally. The player who did not write Entry 42 is not yet one of the authors.

### C. Two-Key `GVA` Tunnel

Accepting either `Antecedent Seal` or `Froberger's Field Notes` as the tunnel key was a deliberate UX choice: a player who found the Log in the archive and consumed it to get the Seal has the Seal. A player who completed §XVI but hasn't yet opened the archive has the Field Notes. Neither path blocks tunnel access. The check uses `.some()` rather than checking a specific item.

### D. Benedikt as the Chain Narrator

Having Benedikt deliver the four-author synthesis (rather than a game message or the player's own journal) grounds the revelation in the social world of the game. Benedikt is the scholar who traced the chain backward: from Froberger's margin notes to the First Researcher, and now forward from the player's Entry 42 to the synthesis. He is the archivist of the archivist. His speaking the chain aloud is an institutional act — the reading circle has one more session.

---

## IV. Post-Mortem Notes

### What Worked

- The retroactive mark system — placing investigation sites at nodes the player has visited since Act I — creates the strongest possible experience of the arc's core insight: she was always there. No new nodes were required. The world already contained her work.
- The four-author chain is mechanically enforced: `vaArchitectureKnown` cannot be set without `entry42Written`. The player who is told "Entry 42 is the fourth link" has, by definition, already engaged with the act of writing Entry 42. The synthesis lands because the player has already done the thing the synthesis is about.
- The Constructor's Log appearing as Document 4 in the existing Weimar archive modal — rather than a new interface — correctly positions the revelation as a continuation of §XVI's investigation rather than a separate arc.

### What Could Be Better

- ~~The five investigation sites do not highlight or indicate that they are now interactive when the player enters a qualifying node.~~ **Partially addressed 2026-07-07:** the 🏛️ Investigate button now carries an `.inv-investigate-glow` class (gold `inv-investigate-pulse` box-shadow, CSS ~line 1849) that visually distinguishes it from ordinary utility buttons on node entry. A returning player who never opens the node panel could still miss it — a map-tab marker or a "Something here looks worth examining." node-entry `storyMsg` remains a possible further improvement.
- `vaMT` (the Mountain Pass investigation site) and the tunnel opening are logically separate actions, but both occur at `GVA`. A player investigating `GVA` before finding the Log will set `vaMT` and later return to open the tunnel — two visits to the same node for conceptually related actions. The investigation text could foreshadow the tunnel more explicitly.
- Quest_va_04 has no explicit completion message beyond Benedikt's line. The quest panel shows `vaArchitectureKnown` as the completeFn check, but the player may not connect Benedikt's spoken synthesis to "quest complete." A small storyMsg after the setTimeout would close the loop visually.
- The `vaArchitectureKnown` flag is also read as a text-variant condition in the dream/shard-note systems (~lines 25924, 25935), but these cross-references are not discoverable without searching the codebase. A cross-reference table in this doc or plan.md would help future maintenance.

---

## V. File References

*(Line numbers current as of the 2026-07-07 revision; the file grows, so treat them as anchors — grep the symbol if a number has drifted.)*

| File | Location | Content |
|------|----------|---------|
| `roll2hit-v3.html` | Lines 10727–10758 | quest_va_01 through quest_va_04 QUEST_DB entries (UQF-1.0; `itemChain` grants Log+Seal at 10738) |
| `roll2hit-v3.html` | Lines 22202–22203 | Void Archaeology state flags in `_S_DEFAULTS()` |
| `roll2hit-v3.html` | `_storyWmArchiveModal()` ~26563; Log read ~26619–26630 | Document 4 (Constructor's Log) |
| `roll2hit-v3.html` | Lines 27013–27043 | Fifth ending Sweelinck question + victory screen addendum |
| `roll2hit-v3.html` | ~Lines 30232–30303 | `[INVESTIGATE]` block — gate, `_vaSites` (5 sites, `NUE` fix), MT/`GVA` tunnel, quest chain |
| `roll2hit-v3.html` | ~Line 1849 | `.inv-investigate-glow` button-highlight CSS (added 2026-07-07) |
| `roll2hit-v3.html` | Line 25381 | Pilgrim NPC — `GVA` tunnel foreshadow |
| `plan.md` | §XVII / UI gaps row | Original design directive + 2026-07-07 close |
| `project_open_gaps` (memory) | "Undocumented UI behaviors" | `[INVESTIGATE]` root-cause + fix record |
| `lab-report-weimar-scholar-gate.md` | §II.C | `wmFirstResearcherKnown` origin — prerequisite for §XVII |
| `lab-report-ng-plus-remembrance.md` | §II.D | `entry42Written` origin — required for `vaArchitectureKnown` |
| `lab-report-void-shaman.md` | §II | `GVA` tunnel extended use in §XXI — Warden encounter |

---

## VI. Addendum — 2026-07-07 Arc-Blocking Bug Fix

### A. Symptom

`[INVESTIGATE]` was on the open-gaps list as "buttons do not highlight on node entry — documented as not working; root cause unknown." A qualifying NG+ player could investigate some marks but the arc never closed.

### B. Root Cause — a dead node code

The `_vaSites` map keyed its five sites by node code. Four keys (`CI/SL/DF/MT` in original terms) survived the §WALK/§NAV world rewrite as their renamed equivalents *because the site text was re-authored*, but the fifth key was left as the **logical** code `WM` — which is not a node code in the current graph. The Weimar archive / lower archive is node **`NUE`** (Scholar's Quarter — the archive *is* the Quarter). So `_vaSites[node.code]` never matched at `NUE`:

- the 🏛️ Investigate button never rendered there,
- `vaWM` could never be set,
- `vaAllMarksFound` (requires all five of `vaCI/vaSL/vaDF/vaWM/vaMT`) could never fire,
- and therefore **`quest_va_02`, `quest_va_03`, and `quest_va_04` were all unreachable** — the entire back half of the arc (Constructor's Log → sealed tunnel → four-author chain → fifth ending) dead-ended.

This is a textbook consequence of a doc/code node-code drift: the report's own tables still said `WM`, so nobody caught that the code no longer resolved.

### C. Fix

1. **`_vaSites` key `WM:` → `NUE:`** (one token). All five sites now resolve to real nodes (`LHR/BMA/ZRH/NUE/GVA`); `vaWM` becomes settable and the five-mark completion fires.
2. **Button highlight** — added `.inv-investigate-glow` (gold `inv-investigate-pulse` box-shadow, CSS ~line 1849) to the 🏛️ Investigate button so it stands out from ordinary utility buttons on node entry (partially closing §IV.B's first "What Could Be Better").

### D. Verification

- Whole inline script re-parses clean (0 syntax errors).
- All five `_vaSites` keys confirmed to be real node codes; the completion `.every([...])` list confirmed to match the five site flags exactly.
- Hermetic simulation of the click-handler completion path: visiting `LHR/BMA/ZRH/NUE/GVA` sets all five flags → `vaAllMarksFound = true` → `quest_va_02` activates → payoff message fires. A control run with the old `WM` key confirms the arc *never* completed pre-fix.

### E. Side-correction — NG+ *is* supported

While tracing the gate, confirmed that `S_story.ngPlusRun` **is** incremented at the NG+ restart (~line 22970), so `_vaReady`'s `ngPlusRun >= 1` term is reachable. An earlier memory note (§GR-D) claimed "NG+ tracking is currently unsupported" — that was wrong and has been corrected. This arc, the Entry 42 write-prompt, and the fifth ending are all live for a qualifying NG+ run.

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
