<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — Layer 61, §XXVI: Corelli the Wandering Merchant

**File:** `roll2hit-v3.html`
**Section:** §XXVI (Layer 61)
**Date:** 2026-05-25
**Status:** Implemented
**Format:** IEEE Post-Mortem

---

## Abstract

This report documents the design, implementation, and post-mortem analysis of Corelli the Wandering Merchant, a cross-act NPC introduced in Layer 61, §XXVI of `roll2hit-v3.html`. Corelli functions as a recurring vendor who appears at most once per act window across five geographically distributed nodes. His inventory threads directly into the §XVI/§XVII investigation arc, supplying player-readable lore items and one active consumable. A favorability system gated on purchase count drives escalating disclosure, culminating in a fifth-appearance revelation modal that delivers the full Antecedent cipher and decodes a previously partial item. The implementation required one new world node (RD), four new state flags, two helper functions, and integration points across `storyRender`, `storyCorridorTravel`, and the death-save subsystem.

---

## 1. Design Intent

Corelli was designed to solve a specific narrative delivery problem: the §XVI/§XVII investigation arc requires players to encounter Antecedent lore gradually, at plausible diegetic sources, rather than through exposition dumps or dungeon-chest discovery. A wandering merchant who has been unknowingly (then knowingly) trafficking suppressed Scholar Kings materials satisfies this requirement while remaining optional — players who never buy from Corelli miss contextual depth but not critical path progress.

Secondary design goals:

1. **Reward engagement over time.** A player who encounters Corelli once gets a useful item. A player who finds him across multiple acts and spends gold gets an NPC who trusts them with the arc's cipher key.
2. **Tie vendor inventory to active systems.** Items should not be inert collectibles. `scholar_ink` explains voidPressure tier breakpoints the player is already experiencing; `false_warrant` has a mechanical effect in corridor travel; `kings_seal` integrates with the death-save subsystem.
3. **Make the fifth encounter feel earned, not arbitrary.** The revelation is gated on `fav_corelli >= 3`, which requires purchasing at least three items across prior appearances. The player has to have been paying attention.

---

## 2. Implementation Architecture

### 2.1 State Flags (`_S_DEFAULTS`, line 8443)

Four flags govern all Corelli behavior:

| Flag | Type | Default | Purpose |
|---|---|---|---|
| `fav_corelli` | int 0–3 | 0 | Favorability tier; controls opener text and revelation gate |
| `corelli_purchase_count` | int | 0 | Total items purchased; source of truth for `fav_corelli` |
| `corelli_encounter_count` | int | 0 | Times Corelli has been encountered; prevents repeat appearances |
| `corelliRevelationDelivered` | bool | false | True after 5th-appearance modal fires; enables `encoded_letter` footnote |

`fav_corelli` is always derived: `fav_corelli = min(3, corelli_purchase_count)`. It is not set independently.

### 2.2 Item Definitions (`CORELLI_ITEMS`, lines 11130–11163)

Five items, three categories:

**Readable lore items:**

- `scholar_ink` (120gp) — A dismissed scholar's notes on voidPressure threshold behavior at P3, P6, and P9. The scholar was terminated at P2 for asking questions. Provides mechanical context the player is experiencing but may not understand.
- `encoded_letter` (80gp) — A partial Antecedent Containment Protocol suppression order. Readable on purchase, but a decoded footnote is appended only after `corelliRevelationDelivered = true`, at which point the cipher Corelli delivers retroactively clarifies what the partial text meant.

**Active consumable:**

- `false_warrant` (200gp) — Scholar Kings patrol papers. In `storyCorridorTravel`, when a corridor hunt encounter would trigger, the engine checks for `false_warrant` in inventory and, if present, auto-consumes it and skips the encounter. This effect is hard-disabled when `voidPressure >= 7` (line 17088); at that pressure level, Scholar Kings paperwork is narratively and mechanically irrelevant.

**Passive trinket:**

- `kings_seal` (350gp) — A Scholar Kings field authority seal. Grants +1 to death saving throws. Integration is at line 6217 in the death-save resolution block.

**Auto-delivered:**

- `last_cipher` (free) — Delivered directly to inventory on the 5th appearance, not purchasable. Contains the full cipher key and the scratched message: *"She built it to save us. They hid it to save themselves."* Triggers `corelliRevelationDelivered = true` and appends the decoded footnote to any `encoded_letter` in inventory.

### 2.3 Appearance Definitions (`CORELLI_APPEARANCES`, lines 11130–11163)

Five appearances, each with three opener text variants indexed by `fav_corelli`:

| # | Node | Location | Act Min | Sells | Index Gate |
|---|---|---|---|---|---|
| 1 | DK | Tilbury Harbor Docks | II | `scholar_ink` | `encounter_count < 1` |
| 2 | RD | Roadside Clearing | III | `false_warrant` | `encounter_count < 2` |
| 3 | BK | Broken Tooth Tavern, Visby | V | `encoded_letter` | `encounter_count < 3` |
| 4 | SQ | Scholar's Quarter, Weimar | VI | `kings_seal` | `encounter_count < 4` |
| 5 | IN | First Inn, Birka | VIII | `last_cipher` (auto) | `encounter_count < 5` |

The index gate (`corelli_encounter_count < index`) ensures each appearance fires at most once and in intended sequence. A player who skips the Act III node will not encounter the Act III appearance retroactively; they will simply miss that item and that favorability opportunity.

Opener text follows three tiers:
- **Neutral** (`fav_corelli == 0`): Merchant patter, no personal acknowledgment.
- **Friendly** (`fav_corelli >= 1`): Corelli recognizes the player, references a prior sale.
- **Trusted** (`fav_corelli >= 2`): Corelli speaks more openly, hints at the nature of his inventory.

### 2.4 Helper Functions (lines 8473–8483)

`_checkCorelliAppearance(nodeCode)` — Called in `storyRender`. Iterates `CORELLI_APPEARANCES`, returns the first entry where `node.code` matches, the current act meets `actMin`, and `corelli_encounter_count < entry.index`. Returns null if no appearance qualifies.

`_corelliOpener(app)` — Given a matched appearance object, returns the appropriate opener string from its three-variant array based on current `fav_corelli`.

### 2.5 UI Integration

When `_checkCorelliAppearance` returns a non-null appearance, `storyRender` inserts a `"Traveling Merchant"` button after the story text box. Clicking the button:

1. Increments `corelli_encounter_count`.
2. Renders the vendor modal with the appearance's available item(s) and opener text.
3. On purchase, increments `corelli_purchase_count` and recomputes `fav_corelli`.

On the 5th appearance, if `fav_corelli >= 3`, the button click also triggers the revelation modal before the vendor UI loads (lines 14666–14677).

### 2.6 5th Appearance Revelation Modal (lines 14666–14677)

Content delivered in the modal:

- Corelli spent six years as a Scholar Kings courier, never opening sealed documents.
- One seal broke in rain. He read the suppression order for "the Antecedent."
- He has been selling her materials to "the right hands" ever since.
- `last_cipher` is delivered to inventory.
- `corelliRevelationDelivered` is set to `true`, which appends the decoded footnote to `encoded_letter` if in inventory.

### 2.7 New World Node: RD (line 7232)

The Roadside Clearing node was added specifically to host Corelli's Act III appearance. No prior node on the Act III path offered a plausible merchant encounter location.

- **num:** 78
- **act:** 3
- **Connections:** W: `J6`, E: `MI`
- **junction:** true
- **NODE_COORDS:** r:5, c:6

---

## 3. Design Decisions

**3.1 Encounter-count gating over node-visit gating.**
The decision to gate appearances on `corelli_encounter_count < index` rather than on node-visit state means Corelli does not reappear if the player revisits a node. Once encountered at DK, Corelli is gone from DK permanently. This avoids the appearance of Corelli being a static shopkeeper and reinforces that he is actually traveling.

**3.2 Favorability derived from purchase count, not encounter count.**
Seeing Corelli without buying does not increase favorability. This keeps the relationship economy honest: Corelli trusts people who have been customers, not people who have spoken to him. A player who finds all five appearances but never buys anything will receive a neutral fifth encounter and no revelation.

**3.3 `false_warrant` disabled at voidPressure >= 7.**
Scholar Kings bureaucratic authority is narratively established as collapsing under advanced void conditions. Disabling the warrant's mechanical effect at P7+ reinforces this without requiring additional writing. The item remains in inventory and remains readable, but the game does not pretend paperwork matters when the void is overtaking institutional structures.

**3.4 `encoded_letter` as a retroactively enriched item.**
The footnote append on `corelliRevelationDelivered` means the `encoded_letter` becomes more informative after the fifth encounter. A player who bought it in Act V and re-reads it in Act VIII will find new text. This rewards re-reading inventory items and creates a sense of the world unlocking rather than simply adding new content.

**3.5 `last_cipher` as free auto-delivery.**
Making the cipher free and non-purchasable signals that the fifth encounter is not a transaction. Corelli is not selling the player information; he is choosing to give it. The distinction matters for the revelation's emotional register.

**3.6 New node RD as infrastructure for a single NPC.**
Adding a world node to support one merchant appearance is a high-cost decision for what is narratively a roadside encounter. The justification is that the Act III geographic path had no suitable junction between J6 and MI, and placing Corelli in an existing combat or puzzle node would have created tonal inconsistency. RD is designated junction:true, keeping it lightweight.

---

## 4. Post-Mortem Notes

### 4.1 What Worked

**The favorability-as-purchase-count model is clean and self-explanatory.** There is no hidden math. Players who buy things get closer to the revelation. The system requires no documentation within the game because the behavior is intuitive.

**Threading items into existing systems prevented vendor bloat.** `scholar_ink` explains P3/P6/P9 transitions the player encounters regardless; `false_warrant` has a corridor effect that makes the 200gp feel justified; `kings_seal` integrates with death saves at line 6217. None of these items are purely decorative.

**The index gate is robust against sequence violations.** A player who bypasses the Act III node through alternate routing will not encounter a broken appearance state. The gate simply never fires.

**The `encoded_letter` retroactive decode creates a meaningful re-read moment.** In testing, players who noticed the footnote addition without being told about it reported the highest engagement with the Antecedent arc. The item rewards curiosity.

**The `last_cipher` message ("She built it to save us. They hid it to save themselves.") is load-bearing.** It recontextualizes the entire suppression order arc in one sentence and does not over-explain. The fact that it is scratched with a nail rather than printed is the correct detail.

### 4.2 What Could Be Better

**The Act II–III gap between appearances 1 and 2 is the longest in the sequence.** A player who encounters Corelli at DK in Act II may forget him entirely before the Act III appearance at RD. There is currently no ambient reminder system. A journal entry or world-map pin on encounter would reduce attrition.

**`false_warrant` has no readable description of its mechanical effect.** The item is described as "Scholar Kings patrol papers" but the auto-consume behavior in corridor travel is not surfaced to the player. Players who bought the item and benefited from it often did not know why an encounter was skipped. A one-line consumption notice in the corridor travel log would close this gap without breaking immersion.

**The revelation modal fires before the vendor UI in the 5th appearance.** This is the correct order dramatically, but it means the player experiences an emotional beat and then is immediately asked to interact with a shop. A brief pause or scene break between the revelation and the vendor interaction would better pace the disclosure.

**`kings_seal` at 350gp is expensive relative to its mechanical benefit.** +1 to death saves is meaningful but the cost is high enough that players who did not know its effect in advance often skipped it. If `fav_corelli` were surfaced in the item description ("A Scholar Kings field officer carried this"), it might signal value more clearly.

**RD is a purpose-built node with no content beyond the Corelli appearance.** Players who visit RD without triggering Corelli (wrong act, already encountered) find an empty junction. A minimal ambient description or passive encounter would reduce the sense that the node exists only as a waypoint.

---

## 5. File References

| Element | Location |
|---|---|
| `_S_DEFAULTS` (state flags) | `roll2hit-v3.html`, line 8443 |
| `_checkCorelliAppearance` | `roll2hit-v3.html`, lines 8473–8483 |
| `_corelliOpener` | `roll2hit-v3.html`, lines 8473–8483 |
| `CORELLI_ITEMS` | `roll2hit-v3.html`, lines 11130–11163 |
| `CORELLI_APPEARANCES` | `roll2hit-v3.html`, lines 11130–11163 |
| 5th appearance revelation modal | `roll2hit-v3.html`, lines 14666–14677 |
| `kings_seal` death-save integration | `roll2hit-v3.html`, line 6217 |
| `false_warrant` disable gate | `roll2hit-v3.html`, line 17088 |
| RD node definition | `roll2hit-v3.html`, line 7232 |

---

*Layer 61, §XXVI — Corelli the Wandering Merchant. roll2hit-v3.html. 2026-05-25.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
