<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report — Layer 52: Void Archaeology "The Architecture"

**IEEE-Format Post-Mortem**  
**Date:** 2026-05-25  
**Layer:** 52  
**Section:** §XVII  
**Status:** ✅ Implemented  
**Codebase:** `roll2hit-v3.html` — single-file browser RPG

---

## Abstract

This report documents the design intent, implementation architecture, and narrative integration of Layer 52 — Void Archaeology, subtitled "The Architecture." This layer is a NG+-exclusive investigation arc that places five `[INVESTIGATE]` buttons at existing nodes (CI, SL, DF, WM, MT), each revealing a mark left by the First Researcher 200 years before the game's events. Collecting all five unlocks a fourth document in the Weimar archive — the Constructor's Log — which in turn enables opening the sealed MT tunnel, the only room in the game sealed before the Scholar Kings existed. The arc concludes at SQ where Benedikt delivers the "four-author chain" synthesis: the First Researcher built the cage, Froberger found the mechanism, the player closed it, and Entry 42 is the fourth link. `vaArchitectureKnown` gates a fifth ending variant at the CO victory screen, adding the addendum *"The story has four authors now."*

---

## I. Design Intent

### A. The Retroactive World

The First Researcher (revealed by name in §XVI as Marta Eilene Vass) predates the Scholar Kings by a generation. Her marks are at nodes the player has visited since Act I. She was at the Blue Shutters Archive (CI). She marked a corner building in the Slums (SL). The Defiant Fields battle (DF) happened at the exact coordinates she chose for the sealing mechanism. The Weimar archive holds her personnel file (WM). The MT tunnel was sealed by her from the inside.

The design goal of §XVII was retroactive recontextualization: the player has walked through five locations that were already hers. The `[INVESTIGATE]` buttons surface what was always true about the world. Nothing is retconned — the marks were always there. The player lacked the knowledge to see them.

This required the arc to be NG+-exclusive: a first-run player doesn't have `wmFirstResearcherKnown` (unlocked by §XVI's quest_wm_04) and hasn't engaged with the First Researcher's identity at all. The retroactive reading only lands if the player has already learned who she was before they encounter her marks.

### B. The Four-Author Chain

The closing synthesis, delivered by Benedikt at SQ, names four contributors to the Antecedent containment:

1. **The First Researcher** — built the cage; wrote the Constructor's Log; left no name
2. **Froberger** — found the mechanism; documented it in his field notes; died for it
3. **The player** — activated the sealing mechanism at DF (the Defiant Fields battle); closed the cage without knowing it
4. **Entry 42** — the player's own written entry; the fourth link that makes it a chain

The chain only has four links if the player wrote (or chose to leave blank) Entry 42. `vaArchitectureKnown` only sets when `entry42Written` is true. A player who skipped Entry 42 cannot complete quest_va_04. The arc requires self-authorship to close.

### C. The Sealed Tunnel

The MT tunnel is described from Act I in ambient lore as a sealed passage no one has opened. The Pilgrim NPC (line 11125) says *"Someone sealed that tunnel before the Scholar Kings existed. I've been trying to find out who for forty years."* The tunnel was always a known mystery. §XVII makes it answerable: the First Researcher sealed it from inside after the final field test of the containment structure. The six sentences on the far wall are her last operational notes.

---

## II. Implementation Architecture

### A. Gate Condition

The entire Void Archaeology block is guarded by a single three-flag condition (line 14382):

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

**Defined at line 14383–14389:**

| Node | Flag | Investigation Text Summary |
|------|------|---------------------------|
| `CI` | `vaCI` | Blue Shutters Archive shelf record — researcher category "Containment"; same shelf as archive letter |
| `SL` | `vaSL` | Carved marker on a corner building predating the city by 80 years; predates the Scholar Kings |
| `DF` | `vaDF` | Stone alignment spaced to a mathematical interval; the battle happened at the activation point |
| `WM` | `vaWM` | Document 3 in the lower archive — project codename now visible: ANTECEDENT CONTAINMENT PROTOCOL |
| `MT` | `vaMT` | Sealed access tunnel; never opened in any record; sealed from inside; intact |

Each site: on button click, sets `S_story[flag] = true`, displays the site text, removes the button, and checks if all five flags are now set. When all five are collected, `vaAllMarksFound = true` fires with a 600ms delayed message: *"Five marks. One pattern. She was everywhere before anyone was looking."* `quest_va_02` activates at this point.

The `[INVESTIGATE]` button attaches after the story text box via `insertAdjacentElement('afterend', invBtn)` — consistent with other contextual buttons in the render pipeline. The button self-removes after clicking.

### C. Quest Chain

**Defined in QUEST_DB — lines 8006–8030:**

| Quest | Title | Completion Condition | Reward |
|-------|-------|----------------------|--------|
| `quest_va_01` | The Architecture: Five Marks | `vaAllMarksFound` | (narrative only) |
| `quest_va_02` | The Architecture: Constructor's Log | `vaLogFound` | Constructor's Log (readable) + Antecedent Seal (relic) |
| `quest_va_03` | The Architecture: The Sealed Tunnel | `vaLastWardVisited` | +200gp |
| `quest_va_04` | The Architecture: The Chain | `vaArchitectureKnown` | (narrative only — closes the arc) |

**Activation sequence:**
- `quest_va_01` activates on first `[INVESTIGATE]` button encounter at any site (line 14416)
- `quest_va_02` activates when `vaAllMarksFound` fires (line 14407)
- `quest_va_03` activates when `vaLogFound` is true (line 14440)
- `quest_va_04` activates when `vaLastWardVisited` is true (line 14441)

### D. Constructor's Log as Document 4

The Weimar archive modal (`_storyWmArchiveModal()`) conditionally renders a fourth document when `vaAllMarksFound` is true (line 12405–12424). Document 4 — **The Constructor's Log** — contains seven entries in the First Researcher's handwriting, ending:

> *"If someone is reading this, the sealing mechanism has activated. The cage is closed. Whatever you sealed inside it — that is what I built this for. I am sorry. I did not have a better answer."*

Reading the Log:
- Sets `vaLogFound = true`
- Adds `The Constructor's Log` (readable item) and `Antecedent Seal` (relic) to inventory
- Activates `quest_va_03`

The Constructor's Log is thus discoverable in two ways: via the archive modal (Document 4 path) or via the quest_va_02 reward handler (line 13103). Both paths converge on the same state flag.

### E. MT Tunnel Opening

**Condition (line 14421–14435):** At MT node, if `vaLogFound` is true and `vaLastWardVisited` is false, the game checks for a key item:

```js
const _hasKey = (S_story.inventory || []).some(
  i => i.name === 'Antecedent Seal' || i.name === "Froberger's Field Notes"
);
```

Either item opens the tunnel. `Froberger's Field Notes` (the §XVI tome) is an alternative key — Froberger's notes reference the tunnel's design, and the seal on the Notes matches the tunnel's lock. The `Antecedent Seal` is the direct artifact; the Field Notes are the intellectual key.

On tunnel opening: `vaLastWardVisited = true`, and the chamber text renders describing cut stone, perfectly still air sealed for 200 years, and six sentences on the far wall — the First Researcher's final operational notes. The last line: *"The Antecedent was here. It is not anymore. You know where it is now."*

### F. Quest_va_04 Completion at SQ

**Lines 14444–14449:** On any SQ (Scholar's Quarter) visit where `vaLastWardVisited` is true, `entry42Written` is true, and `vaArchitectureKnown` is not yet set:

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

**Defined in `_S_DEFAULTS()` — lines 8432–8434:**

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `vaCI` | boolean | `false` | CI site investigated |
| `vaSL` | boolean | `false` | SL site investigated |
| `vaDF` | boolean | `false` | DF site investigated |
| `vaWM` | boolean | `false` | WM site investigated |
| `vaMT` | boolean | `false` | MT site investigated |
| `vaAllMarksFound` | boolean | `false` | All five sites found; unlocks Document 4 |
| `vaLogFound` | boolean | `false` | Constructor's Log read; unlocks MT tunnel |
| `vaLastWardVisited` | boolean | `false` | MT tunnel opened; activates quest_va_04 |
| `vaArchitectureKnown` | boolean | `false` | Four-author chain understood; gates fifth ending |

### H. CO Victory Screen Integration

**Lines 12837, 12857:**

`vaArchitectureKnown` gates a fifth Sweelinck question variant at the CO ending screen — overriding all other question branches:

```js
if (S_story.vaArchitectureKnown && S_story.entry42Written && (S_story.ngPlusRun || 0) >= 1) {
  sweelinckQ = '"What was inside the cage?"';
}
```

This question is only answerable by a player who has completed the entire arc. It is also unanswerable in-game — the cage contents are never specified. The question is Sweelinck's acknowledgment that the player knows what they did, not a prompt for an answer.

The addendum div appended below the ending text (line 12863):
> *"Froberger wrote 41 entries. You wrote one. She wrote 7, and no one counted them for 200 years. The cage is closed. You know what it holds. The story has four authors now."*

---

## III. Design Decisions and Trade-offs

### A. NG+-Exclusive Gate as Narrative Requirement

The triple gate (`ngPlusRun ≥ 1`, `wmFirstResearcherKnown`, `entry42Written`) is not a difficulty gate — it is a comprehension gate. The arc only works if the player has the reading context for it. A first-run player at the DF stone alignment would see a math puzzle. A player who knows that Marta Eilene Vass chose this spot 200 years ago and that the battle activated her sealing mechanism sees the same stone alignment as the closing of a two-century-long plan. The information changes the object.

### B. `entry42Written` as Required for `vaArchitectureKnown`

`quest_va_04` cannot complete without `entry42Written`. This means a player who skipped Entry 42 (possible even in NG+ if `priorQuestMinusOne` was false) cannot be told "Entry 42 is the fourth link." The chain has only three links without it, and Benedikt does not speak. The arc is structurally incomplete — intentionally. The player who did not write Entry 42 is not yet one of the authors.

### C. Two-Key MT Tunnel

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

- The five investigation sites do not highlight or indicate that they are now interactive when the player enters a qualifying node. A returning player who passes through CI, SL, or DF without opening the node panel will miss the `[INVESTIGATE]` button entirely. A subtle notification ("Something at this location looks worth examining.") would make the arc more discoverable.
- `vaMT` (the MT investigation site) and the MT tunnel opening are logically separate actions, but both occur at MT. A player investigating MT before finding the Log will set `vaMT` and later return to open the tunnel — two visits to the same node for conceptually related actions. The investigation text could foreshadow the tunnel more explicitly.
- Quest_va_04 has no explicit completion message beyond Benedikt's line. The quest panel shows `vaArchitectureKnown` as the completeFn check, but the player may not connect Benedikt's spoken synthesis to "quest complete." A small storyMsg after the setTimeout would close the loop visually.
- The `vaArchitectureKnown` flag is also checked in the Shard Notes (§XXII, line 4690) and Inn Dreams (§XXIII, line 11684) systems, but these cross-references are not discoverable without searching the codebase. A cross-reference table in this doc or plan.md would help future maintenance.

---

## V. File References

| File | Location | Content |
|------|----------|---------|
| `roll2hit-v3.html` | Lines 8006–8030 | quest_va_01 through quest_va_04 QUEST_DB entries |
| `roll2hit-v3.html` | Lines 8432–8434 | Void Archaeology state flags in `_S_DEFAULTS()` |
| `roll2hit-v3.html` | Lines 12405–12424 | Document 4 (Constructor's Log) in `_storyWmArchiveModal()` |
| `roll2hit-v3.html` | Lines 12836–12866 | CO fifth ending variant + victory screen addendum |
| `roll2hit-v3.html` | Lines 13101–13113 | Quest reward handlers — va_01 through va_04 |
| `roll2hit-v3.html` | Lines 14380–14449 | `[INVESTIGATE]` block — gate, sites, MT tunnel, quest chain |
| `roll2hit-v3.html` | Line 11125 | Pilgrim NPC — MT tunnel foreshadow |
| `plan.md` | §XVII | Original design directive |
| `lab-report-weimar-scholar-gate.md` | §II.C | `wmFirstResearcherKnown` origin — prerequisite for §XVII |
| `lab-report-ng-plus-remembrance.md` | §II.D | `entry42Written` origin — required for `vaArchitectureKnown` |
| `lab-report-void-shaman.md` | §II | MT tunnel extended use in §XXI — Warden encounter |

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
