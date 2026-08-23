<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->

# Story Arc — Coastal Underground (§XIX + §XX)

**Arc type:** Structural pair — two complementary investigation arcs completable in any order  
**Sections:** §XIX Tilbury Harbor Arc · §XX Visby Underground  
**Lab report:** `lab-report-tilbury-visby-arcs.md`  
**Status:** Both sections implemented (Layers 54 + 55)

---

## Overview

§XIX and §XX were designed and implemented together as a structural pair. Both arcs operate in Acts II–V. Both are centered on the Merchant's Conclave as an institutional presence. Both end at the same revelation: a Void-aligned shaman is operating inside Mordus's territory using a goblin sub-clan (the Hollow Hands) as a proxy.

The Tilbury arc documents the Conclave's management of disappearing ships through paperwork. The Visby arc documents a Conclave debt that leads, through a goblin broker, to the same shaman. The two arcs are written and structured to be completable in any order, with conditional dialogue cross-references appended when the other arc has been started or completed.

Shared thematic argument: the Merchant's Conclave is competent at paperwork and incompetent at the actual world. The harbor ledger accurately records ten missing ships; the Conclave classifies them as weather losses and closes the case. The weapons debt is a legitimate Conclave instrument; the Conclave hired Solvak to collect it without knowing the weapons were stolen by a Void entity. Both arcs end with a player who knows more than the institution that manages the affected territory.

---

## Prerequisites

| Section | Prerequisite | Earliest Act |
|---------|-------------|--------------|
| §XIX — Tilbury Harbor Arc | None (beyond Act II) | Act II |
| §XX — Visby Underground | `actNumber >= 5` | Act V |
| §XXI — The Warden (downstream) | `vsShamanKnown` (from §XX) + `vaLastWardVisited` (from §XVII) | NG+ |

§XIX has no quest prerequisites and is available from the moment the player reaches Tilbury in Act II. §XX is Act V-gated and the Solvak quest activates automatically on VS node arrival. Neither arc has a prerequisite on the other — the cross-references are conditional dialogue additions, not gates.

---

## §XIX — Tilbury Harbor Arc

**Layer:** 54  
**Subtitle:** "The Conclave's Weight"  
**Nodes:** `STN` (historical `SF`) (Storefront/docks) + TL (Tilbury)  
**Act gate:** Act II+ (no explicit actNumber check; node access governed by route)

### Summary

The harbor in Tilbury existed as a node (`LCY` (historical `DK`) — Harbor Docks) with ambient description and Magistra Muffat's main quest beat. There was no institutional record of the shipping environment, no NPC whose job was the ledger, and no reason to return after collecting Shard #1.

§XIX fills this gap by making the harbor ledger the entry point. Harbor Master Rennau keeps the record of ships that haven't come back. Ten ships are listed on the harbor board by name and day overdue. The most recent is the Harrow. The Conclave categorizes them as "weather losses." Rennau stopped using that category six weeks ago.

The arc's payoff is Ori — the sole survivor of the Harrow — who walks into Tilbury three weeks after the sinking and describes what boarded them. Not pirates, not a storm. A shape in the water that moved like it was looking for something. Her account connects the harbor mystery to the Void without naming it.

### Story Text (story.md Layer 54 stub)

Nodes: TL (Tilbury) + `STN` (historical `SF`) (Storefront/docks). Two new NPCs, no new terrain monsters needed.

- **Harbor Master Rennau** (`rennau`) — `STN` (historical `SF`) node; NPC card rendered on `STN` (historical `SF`) visits; impartial → friendly (Q-TL-01) → dear friend (Q-TL-03). Quote: *"The ledger is the only record that's honest."*
- **Adjutant Vonn** (`vonn`) — TL node; rendered when `tlLedgerRead`; caps at Friendly; holds Conclave position.
- **Q-TL-01** "The Ledger" — Harbor Board button at `STN` (historical `SF`); clicking reveals 10 empty berths + awards The Harrow Manifest (📄, readable). `tlLedgerRead = true`. If `wmFirstResearcherKnown`: manifest shows Isolde Voss as consignee.
- **Q-TL-02** "The Embargo" — Vonn interaction at TL; two choices: [Report to Birka contacts] (+150gp, `tlEmbargoChallenged`) or [Leave it] (`tlEmbargoDismissed`).
- **Q-TL-03** "The Missing Ship" — Ori encounter at `STN` (historical `SF`) (Act IV+, `tlLedgerRead`); one-click delivery to Rennau; awards Ori's Account (📜, readable) + 300gp + Rennau Dear Friend. If `Froberger's Field Notes` in inventory: extra lore line in account.
- **State flags (4):** `tlLedgerRead`, `tlEmbargoChallenged`, `tlEmbargoDismissed`, `tlMissingShipSolved`.

### NPC Profiles

**Harbor Master Rennau** — Merchant's Conclave Tier 2, node: `STN` (historical `SF`). Begins Neutral; advances to Friendly on quest_tl_01 completion; Dear Friend on quest_tl_03 completion.

Key dialogue lines by favorability state:
- Neutral: *"The ledger goes back eleven months. Every ship that's left, every ship that's come back, every ship that hasn't. The Conclave calls the ones that haven't 'weather losses.' I stopped calling them that six weeks ago."*
- Friendly (post quest_tl_01): *"The ledger is the only record that's honest."*
- Dear Friend (post quest_tl_03): *"Ori said the thing that boarded them didn't have a name. Things that don't have names are the Void's specialty. I'm glad someone came back to tell us."*

Rennau represents the institutional insider who has privately stopped believing the official explanation but continues to operate within the system. He does not challenge the Conclave publicly; he just stopped using their category six weeks ago.

**Adjutant Vonn** — Merchant's Conclave Tier 3, node: TL. Static NPC; does not accumulate favorability. Rendered only when `tlLedgerRead`. Represents institutional immovability — he enforces the embargo correctly and without malice.

Vonn is not a villain. He holds the Conclave position because it is his job. The player can report the manifest to Birka contacts (+150gp) or leave it with him. Neither choice changes his behavior. The harbor stays closed either way.

### State Flags

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `tlLedgerRead` | boolean | `false` | Harbor board read; manifest found; Rennau Friendly |
| `tlEmbargoChallenged` | boolean | `false` | Player reported manifest to Birka Council (+150gp) |
| `tlEmbargoDismissed` | boolean | `false` | Player chose to leave the manifest with Vonn |
| `tlMissingShipSolved` | boolean | `false` | Ori's account delivered to Rennau; Rennau Dear Friend |

### Quest Chain

| Quest | Title | Completion Condition | Reward |
|-------|-------|----------------------|--------|
| `quest_tl_01` | Rennau: The Ledger | `tlLedgerRead` | Harrow Manifest (readable); Rennau Friendly |
| `quest_tl_02` | Rennau: The Embargo | `tlEmbargoChallenged` OR `tlEmbargoDismissed` | +150gp if challenged; nothing if dismissed |
| `quest_tl_03` | Rennau: The Missing Ship | `tlMissingShipSolved` | Ori's Account (readable) + 300gp; Rennau Dear Friend |

**Activation sequence:**
- `quest_tl_01` activates immediately on `STN` (historical `SF`) node arrival
- `quest_tl_02` activates when `tlLedgerRead` (after board read)
- `quest_tl_03` activates when `tlLedgerRead` AND `actNumber >= 4` (Ori arrives in Act IV)

### Harbor Board Mechanic

On first `STN` (historical `SF`) visit with `!tlLedgerRead`, the harbor board renders as a storyMsg listing ten ships by name and days overdue:

> `HARROW (Day 17), SILVER MARCH (Day 24), CORMORANT (Day 31), BRINE OATH (Day 44)...`

If the Harrow Manifest is not already in inventory, it is added automatically at this point. `quest_tl_01` activates on `STN` (historical `SF`) arrival before the board reads.

The harbor board listing ten ships by name and days-overdue makes the Conclave's scale of incompetence legible immediately. The player sees not one missing ship but ten, classified identically, before the arc begins.

### Vonn Choice (quest_tl_02)

At TL, clicking "Speak with Adjutant Vonn" presents Vonn's dialogue and two buttons:
- **Report to Birka contacts** — `tlEmbargoChallenged = true`, +150gp
- **Leave it** — `tlEmbargoDismissed = true`

Both complete quest_tl_02. Neither changes Vonn's behavior or Rennau's dialogue. The choice records the player's stance on institutional accountability without gameplay consequence — the harbor stays closed either way. This is a moral marker, not a branch.

### Ori Encounter (quest_tl_03)

Fires at `STN` (historical `SF`) when `tlLedgerRead && actNumber >= 4 && !tlMissingShipSolved`. Button: "📜 Speak with Ori." Clicking delivers Ori's account as storyMsg and immediately sets `tlMissingShipSolved = true`, adds Ori's Account to inventory, advances Rennau to Dear Friend, grants +300gp.

Ori is the sole survivor of the Harrow. She walks into Tilbury three weeks after the sinking. Her account is delivered through testimony, not investigation — the player learns what happened to the Harrow through what the person who survived decided to say.

Quest_tl_03 resolves entirely through dialogue. Ori does not need to be escorted or fought for.

### Froberger Cross-Reference in Ori's Account

If `"Froberger's Field Notes"` is in inventory when Ori's Account is read, the readable text appends:

> *"Froberger wrote: 'The pressure is survivable if you know it's coming.' Ori survived because she knew the shape was there and went over the side before it hit."*

This ties the §XVI tome reward to the §XIX survivor testimony. A player who completed the Weimar arc before the Tilbury arc gets one additional line of synthesis.

### Harrow Manifest — `wmFirstResearcherKnown` Cross-Reference

If `wmFirstResearcherKnown` is true when quest_tl_01 completes, the Harrow Manifest shows Isolde Voss as consignee. This connects the §XVI Weimar arc directly to the Tilbury shipping record: the Senior Archivist who signed Froberger's revocation letter is named in a harbor document as the recipient of a cargo that never arrived. The manifest does not explain the connection — the player holds that knowledge from §XVI.

---

## §XX — Visby Underground

**Layer:** 55  
**Subtitle:** "What Mordus Owes"  
**Nodes:** VS (Visby) + `TRD` (historical `GC`) (Goblin Caves) + `VBY` (historical `BK`) (Broken Tooth Tavern)  
**Act gate:** `actNumber >= 5`

### Summary

The Visby Underground arc gives Warlord Mordus a quest role beyond the main-quest monster-bounty beat. Mordus owns the Broken Tooth Tavern (`VBY` (historical `BK`)) and controls Visby's criminal infrastructure. He is also in debt to the Merchant's Conclave for 2,000gp — the price of a weapons shipment that never arrived.

§XX makes the missing weapons the investigation: who received them, why, and what they did with them. The answer (Yva's testimony at `TRD` (historical `GC`)) is that a goblin sub-clan called the Hollow Hands received the shipment because their Void-aligned shaman told them it was tribute Mordus owed. Mordus never paid tribute. The shaman invented a tribute to arm a sub-clan. This is the §XXI setup.

### Story Text (story.md Layer 55 stub)

Nodes: VS (Visby) + `TRD` (historical `GC`) (Goblin Caves). One new monster (`hollow_hands_guard`).

- **Debt Agent Solvak** (`solvak`) — VS node; rendered until `vsDebtSettled`; impartial → friendly (Q-VS-01). Quote: *"I've been outside Visby for six weeks."*
- **Yva** (`yva`) — `TRD` (historical `GC`) node; rendered when `vsDebtProbed && !vsWeaponsFound`; 50gp to talk; friendly after Q-VS-02.
- **Q-VS-01** "The Collector" — activated at VS (Act V+); Solvak button → Mordus dialogue → `vsDebtProbed`. If `tlLedgerRead`: Solvak mentions the Harrow.
- **Q-VS-02** "The Broker" — Yva 50gp interaction at `TRD` (historical `GC`); reveals Hollow Hands + shaman; awards Hollow Hands Seal (🖤, quest_item). If `tlMissingShipSolved`: Yva confirms Harrow was not Hollow Hands.
- **Q-VS-03** "Mordus Pays" — deliver seal to Solvak at VS; 400gp; `vsDebtSettled = true`, `vsShamanKnown = true`. Mordus follow-up: *"The Hollow Hands are mine to deal with now."*
- New monster: `hollow_hands_guard` (AC13/HP22/ATK+4/1d6+2/easy) — added to `goblin_cave` terrain; drops Hollow Hands Seal (🖤, sell:0).
- The shaman is named (`vsShamanKnown`) but not confronted — Layer 56 §XXI.
- **State flags (4):** `vsDebtProbed`, `vsWeaponsFound`, `vsDebtSettled`, `vsShamanKnown`.

### NPC Profiles

**Debt Agent Solvak** — Merchant's Conclave Tier 3, node: VS. Renders at VS until `vsDebtSettled`. Begins Neutral; advances to Friendly on quest_vs_01 completion. Represents the Conclave's enforcement arm — competent, professional, and out of his depth.

Key dialogue lines by favorability state:
- Neutral: *"I've been outside Visby for six weeks. Mordus won't see me directly. The debt is 2,000gp for a weapons shipment. The shipment arrived at the docks and then it didn't arrive at Mordus."*
- Friendly (post quest_vs_01): *"You talked to Mordus. He didn't have you removed. That's better than my last three visits combined."*

**Yva** — Goblin broker, formerly Mordus-aligned, node: `TRD` (historical `GC`). Renders when `vsDebtProbed && !vsWeaponsFound`. 50gp payment required to receive testimony. Advances to Friendly after payment.

Key line (delivered after 50gp payment):

> *"The shaman told them the weapons were tribute Mordus owed them. Mordus never paid tribute. The shaman invented a tribute that made the Hollow Hands feel owed. That's the part that scares me."*

Yva is a former supply intermediary who unknowingly moved weapons to the Hollow Hands. She provides the chain of evidence: weapons → Hollow Hands → shaman. Her testimony is the mechanism by which `vsShamanKnown` eventually sets — the debt investigation is the path to naming the target.

### New Monster

`hollow_hands_guard` — Hollow Hands Guard. AC 13, HP 22, ATK +4, 1d6+2. Tier: easy.

Drop: Hollow Hands Seal (icon 🖤, sell: 0 — non-sellable quest item). Added to `goblin_cave` terrain pool alongside kobolds, goblins, hobgoblins, and bugbears. Functionally a goblin-tier easy encounter that signals Hollow Hands presence in the `TRD` (historical `GC`) node territory.

Note: collecting the Hollow Hands Seal via monster drop has no direct quest effect — `vsWeaponsFound` sets only through Yva's 50gp testimony. The drop is narrative texture; the testimony is the gate.

### State Flags

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `vsDebtProbed` | boolean | `false` | Player has spoken with both Solvak and Mordus |
| `vsWeaponsFound` | boolean | `false` | Yva's testimony obtained; Hollow Hands Seal in inventory |
| `vsDebtSettled` | boolean | `false` | Seal delivered to Solvak; debt resolved; +400gp |
| `vsShamanKnown` | boolean | `false` | Set simultaneously with vsDebtSettled; gates §XXI |

`vsShamanKnown` sets at debt settlement — not after defeating the shaman. The player knows the shaman exists from the chain of evidence before seeking them out. §XXI activates at `GVA` (historical `MT`) because the player knows where the shaman operates from the Yva investigation, not because they stumbled into a dungeon.

### Quest Chain

| Quest | Title | Completion Condition | Reward |
|-------|-------|----------------------|--------|
| `quest_vs_01` | Solvak: The Collector | `vsDebtProbed` | Solvak Friendly; quest_vs_02 activates |
| `quest_vs_02` | Yva: The Broker | `vsWeaponsFound` | Hollow Hands Seal (quest item); Yva Friendly |
| `quest_vs_03` | Mordus Pays | `vsDebtSettled` | +400gp; Solvak satisfied; `vsShamanKnown = true` |

**Activation sequence:**
- `quest_vs_01` activates at VS when `actNumber >= 5`
- `quest_vs_02` activates after `vsDebtProbed` (Mordus dialogue complete)
- `quest_vs_03` activates after `vsWeaponsFound` (Yva paid)

### Solvak/Mordus Dialogue Sequence

The VS node Solvak button delivers a two-beat dialogue with 800ms delay:

1. Solvak explains the debt and the player's leverage: *"He'll talk to you — you're not Conclave."*
2. Mordus (reported speech): *"The debt will be paid when the weapons are returned. The weapons will be returned when I know where they went. I do not know where they went." — He is telling the truth.*

The `harrowNote` conditional: if `tlLedgerRead`, Solvak appends *"We lost a ship around the same time. The Harrow. Unrelated, probably."* This is the only dialogue cross-reference between the two arcs — a one-line connection placed naturally in an existing NPC conversation.

### Yva Payment Gate

Clicking "Find Yva (50gp)" at `TRD` (historical `GC`):
- Deducts 50gp (hard-gated: *"You don't have 50gp."* if insufficient)
- Delivers Yva's testimony
- Sets `vsWeaponsFound = true`
- Adds Hollow Hands Seal (quest item) to inventory

**Tilbury cross-reference in Yva's testimony:** If `tlMissingShipSolved`, Yva appends:

> *"The Harrow. I heard about that ship. The Hollow Hands didn't touch it. Whatever got that ship wasn't them."*

This second cross-reference separates the two mysteries. The weapons story and the sea creature story are not the same threat. Both lead back to the Void, but via different mechanisms. Yva's dismissal prevents the player from conflating them.

### Hollow Hands Seal Delivery

At VS with `vsWeaponsFound && !vsDebtSettled`, the button "Deliver the Hollow Hands Seal to Solvak." renders. Clicking:
- Removes the Seal from inventory
- Grants +400gp
- Sets `vsDebtSettled = true` and `vsShamanKnown = true` simultaneously

Mordus's delayed response (600ms):

> *"The Hollow Hands are mine to deal with now that I know what they are. You found what I needed to find them. That's worth something."*

The `vsDebtSettled` and `vsShamanKnown` flags setting simultaneously is the correct design: debt settlement is the moment the player understands the shaman's operation, not a separate reveal. The Hollow Hands are named. The shaman is known. §XXI at `GVA` (historical `MT`) is now available once `vaLastWardVisited` also holds.

---

## Arc Cross-References

### §XIX ↔ §XX Dialogue Cross-References

| Flag Gate | Location | Line |
|-----------|----------|------|
| `tlLedgerRead` | Solvak at VS (§XX) | *"We lost a ship around the same time. The Harrow. Unrelated, probably."* |
| `tlMissingShipSolved` | Yva at `TRD` (historical `GC`) (§XX) | *"The Harrow. I heard about that ship. The Hollow Hands didn't touch it."* |
| `wmFirstResearcherKnown` | Harrow Manifest (§XIX) | Manifest shows Isolde Voss as consignee |
| `Froberger's Field Notes` in inventory | Ori's Account (§XIX) | Extra lore line: Froberger on surviving the pressure |

The arcs are designed to be completable in any order. The cross-references add synthesis for players who did both arcs but the Visby arc is complete and coherent without them.

### §XX → §XXI Downstream

`vsShamanKnown` (set at quest_vs_03 completion) is one of two prerequisites for §XXI. The Warden encounter at `GVA` (historical `MT`) does not trigger until both `vsShamanKnown` (§XX) and `vaLastWardVisited` (§XVII Void Archaeology) are true. The Visby debt investigation names the target; the Void Archaeology tunnel opening establishes the location. §XXI requires both investigation lines to converge.

### §XIX Cross-Link to §XVI

The Harrow Manifest's `wmFirstResearcherKnown` gate creates a direct connection from the Weimar Scholar Gate arc to the Tilbury harbor record. Isolde Voss — the Senior Archivist who signed Froberger's revocation letter and the NPC who controls archive access in §XVI — appears as a named consignee in the harbor ledger. The manifest does not explain what this means; the player holds that knowledge from §XVI and draws the connection themselves.

---

## Nodes and Terrain

| Node | Code | NPCs | New Content |
|------|------|------|-------------|
| Tilbury Harbor (docks) | `STN` (historical `SF`) | Rennau, Ori (Act IV+) | Harbor Board mechanic; Harrow Manifest item |
| Tilbury (town) | TL | Vonn | Embargo choice (quest_tl_02) |
| Visby | VS | Solvak | Debt dialogue; seal delivery |
| Goblin Caves | `TRD` (historical `GC`) | Yva | Yva testimony; `hollow_hands_guard` in terrain pool |

---

## File References

| File | Location | Content |
|------|----------|---------|
| `index.html` | Line 4624 | `hollow_hands_guard` monster definition |
| `index.html` | Line 5051 | `hollow_hands_guard` drop — Hollow Hands Seal |
| `index.html` | Line 5426 | `goblin_cave` terrain pool — includes hollow_hands_guard |
| `index.html` | Lines 7691–7704 | Rennau NPC profile |
| `index.html` | Lines 7706–7718 | Vonn NPC profile |
| `index.html` | Lines 7722–7745 | Solvak and Yva NPC profiles |
| `index.html` | Lines 8032–8067 | quest_tl_01–03 + quest_vs_01–03 QUEST_DB entries |
| `index.html` | Lines 8436, 8438 | Tilbury + Visby state flags in `_S_DEFAULTS()` |
| `index.html` | Lines 13121–13158 | Quest reward handlers — tl_01–03, vs_01–03 |
| `index.html` | Lines 14456–14542 | §XIX Tilbury render block — harbor board, Ori, Vonn choice |
| `index.html` | Lines 14544–14609 | §XX Visby render block — Solvak, Mordus, Yva, seal delivery |
| `lab-report-tilbury-visby-arcs.md` | All | §XIX + §XX full implementation record |
| `lab-report-void-shaman.md` | §II | `vsShamanKnown` downstream use — §XXI Warden encounter |
| `lab-report-weimar-scholar-gate.md` | §II.G | `tlLedgerRead` cross-reference; archiveLetterObtained path |

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
