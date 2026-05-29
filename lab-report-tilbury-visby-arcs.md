<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report — Layers 54+55: Tilbury Harbor Arc + Visby Underground

**IEEE-Format Post-Mortem**  
**Date:** 2026-05-25  
**Layers:** 54 (§XIX) + 55 (§XX)  
**Sections:** §XIX — Tilbury Harbor Arc · §XX — Visby Underground  
**Status:** ✅ Implemented  
**Codebase:** `roll2hit-v3.html` — single-file browser RPG

---

## Abstract

This report covers two complementary arcs implemented together as a structural pair: Layer 54 (§XIX) — the Tilbury Harbor Arc ("The Conclave's Weight"), and Layer 55 (§XX) — the Visby Underground ("What Mordus Owes"). Both arcs operate in Acts II–V, both are centered on the Merchant's Conclave as an institutional presence, and both end at the same revelation: a Void-aligned shaman is operating inside Mordus's territory using a goblin sub-clan (the Hollow Hands) as a proxy. The Tilbury arc documents the Conclave's management of disappearing ships through paperwork; the Visby arc documents a Conclave debt that leads, through a goblin broker, to the same shaman. The two arcs are written and structured to be completable in any order, with one dialogue line in the Visby arc (`harrowNote`) conditionally appending a Tilbury cross-reference when `tlLedgerRead` is true.

---

## I. Design Intent

### A. §XIX: The Conclave as Paper

The harbor in Tilbury existed as a node (DK — Harbor Docks) with ambient description and Magistra Muffat's main quest beat. There was no institutional record of the shipping environment, no NPC whose job was the ledger, and no reason to return after collecting Shard #1. The design gap: the Merchant's Conclave is named throughout Act II as the power structure of Tilbury, but the player has no interaction with the Conclave as a bureaucratic system — only as a setting.

§XIX fills this by making the harbor ledger the entry point. Harbor Master Rennau keeps the record of ships that haven't come back. Ten ships are listed on the harbor board by name and day overdue. The most recent is the Harrow. The Conclave categorizes them as "weather losses." Rennau stopped using that category six weeks ago.

The arc's payoff is Ori — the sole survivor of the Harrow — who walks into Tilbury three weeks after the sinking and describes what boarded them. Not pirates, not a storm. A shape in the water that moved like it was looking for something. Her account connects the harbor mystery to the Void without naming it.

### B. §XX: The Debt as Investigation

The Visby Underground arc was designed to give Warlord Mordus a quest role beyond the main-quest monster-bounty beat. Mordus owns the Broken Tooth Tavern (BK) and controls Visby's criminal infrastructure. He is also in debt to the Merchant's Conclave for 2,000gp — the price of a weapons shipment that never arrived.

§XX makes the missing weapons the investigation: who received them, why, and what they did with them. The answer (Yva's testimony at GC) is that a goblin sub-clan called the Hollow Hands received the shipment because their Void-aligned shaman told them it was tribute Mordus owed. Mordus never paid tribute. The shaman invented a debt to arm a sub-clan. This is the §XXI setup: the Void Shaman operates as a corrupted warden whose mandate has drifted so far it now resources goblin factions.

### C. The Structural Pair

The two arcs share a thematic argument: the Merchant's Conclave is competent at paperwork and incompetent at the actual world. The harbor ledger accurately records ten missing ships; the Conclave classifies them as weather losses and closes the case. The weapons debt is a legitimate Conclave instrument; the Conclave hired Solvak to collect it without knowing the weapons were stolen by a Void entity. Both arcs end with a player who knows more than the institution that manages the affected territory.

---

## II. Implementation Architecture

### A. New Monster — `hollow_hands_guard` (§XX)

**Defined in `MONSTER_POOL` — line 4624:**

```js
hollow_hands_guard: { key:'hollow_hands_guard', name:'Hollow Hands Guard',
  ac:13, hp:22, atk:4, dmgDie:6, dmgCount:1, dmgFlat:2, tier:'easy' }
```

**Drop table** (line 5051): `hollow_hands_guard` → `"Hollow Hands Seal"` (icon 🖤, sell:0 — non-sellable quest item).

**Terrain pool** (line 5426): Added to `goblin_cave` pool alongside kobolds, goblins, hobgoblins, and bugbears. Functionally a goblin-tier easy encounter that signals Hollow Hands presence in the GC node territory.

### B. §XIX — Tilbury Harbor Arc

#### NPC Profiles

**Rennau** (line 7691) — Harbor Master, Merchant's Conclave Tier 2, node: SF. Begins Neutral; advances to Friendly on quest_tl_01, Dear Friend on quest_tl_03.

Key lines:
- Neutral: *"The ledger goes back eleven months. Every ship that's left, every ship that's come back, every ship that hasn't. The Conclave calls the ones that haven't 'weather losses.' I stopped calling them that six weeks ago."*
- Dear Friend: *"Ori said the thing that boarded them didn't have a name. Things that don't have names are the Void's specialty. I'm glad someone came back to tell us."*

**Vonn** (line 7706) — Adjutant, Merchant's Conclave Tier 3, node: TL. Static NPC; does not accumulate favorability. Represents institutional immovability — he enforces the embargo correctly and without malice.

#### Harbor Board Mechanic (lines 14458–14474)

On first SF visit with `!tlLedgerRead`, the game renders the harbor board as a storyMsg listing ten ships by name and days overdue:
> `HARROW (Day 17), SILVER MARCH (Day 24), CORMORANT (Day 31), BRINE OATH (Day 44)…`

If the Harrow Manifest is not already in inventory, it is added automatically at this point (the board visit constitutes finding the manifest). `quest_tl_01` activates at SF on arrival (line 14456) before the board reads.

#### State Flags

**Defined in `_S_DEFAULTS()` — line 8436:**

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `tlLedgerRead` | boolean | `false` | Harbor board read; manifest found; Rennau Friendly |
| `tlEmbargoChallenged` | boolean | `false` | Player reported manifest to Birka Council (+150gp) |
| `tlEmbargoDismissed` | boolean | `false` | Player chose to leave the manifest with Vonn |
| `tlMissingShipSolved` | boolean | `false` | Ori's account delivered to Rennau; Rennau Dear Friend |

#### Quest Chain

| Quest | Title | Completion | Reward |
|-------|-------|------------|--------|
| `quest_tl_01` | Rennau: The Ledger | `tlLedgerRead` | Harrow Manifest (readable); Rennau → Friendly |
| `quest_tl_02` | Rennau: The Embargo | `tlEmbargoChallenged` OR `tlEmbargoDismissed` | +150gp if challenged; nothing if dismissed |
| `quest_tl_03` | Rennau: The Missing Ship | `tlMissingShipSolved` | Ori's Account (readable) + 300gp; Rennau → Dear Friend |

**Activation sequence:**
- `quest_tl_01` activates immediately on SF node arrival
- `quest_tl_02` activates when `tlLedgerRead` (after board read)
- `quest_tl_03` activates when `tlLedgerRead` AND `actNumber ≥ 4` (Ori arrives in Act IV)

#### Vonn Choice (lines 14513–14541)

Clicking "Speak with Adjutant Vonn" at TL presents Vonn's dialogue and two buttons:
- **Report to Birka contacts** → `tlEmbargoChallenged = true`, +150gp
- **Leave it** → `tlEmbargoDismissed = true`

Both complete quest_tl_02. Neither changes Vonn's behavior. The choice records the player's stance on institutional accountability without gameplay consequence — the harbor stays closed either way.

#### Ori Encounter (lines 14482–14499)

Fires at SF when `tlLedgerRead && actNumber ≥ 4 && !tlMissingShipSolved`. A button "📜 Speak with Ori." renders. Clicking it delivers Ori's account as storyMsg and immediately sets `tlMissingShipSolved = true`, adds Ori's Account to inventory, sets Rennau to Dear Friend, and grants +300gp.

**Froberger cross-reference in Ori's Account:** If `"Froberger's Field Notes"` is in inventory, the readable text appends:
> *"Froberger wrote: 'The pressure is survivable if you know it's coming.' Ori survived because she knew the shape was there and went over the side before it hit."*

This ties the §XVI tome reward to the §XIX survivor testimony — a player who completed the Weimar arc before the Tilbury arc gets one additional line of synthesis.

---

### C. §XX — Visby Underground

#### NPC Profiles

**Solvak** (line 7722) — Debt Agent, Merchant's Conclave Tier 3, node: VS. Advances to Friendly on quest_vs_01 completion. Represents the Conclave's enforcement arm — competent, professional, and out of his depth.

Key line at Friendly: *"You talked to Mordus. He didn't have you removed. That's better than my last three visits combined."*

**Yva** (line 7735) — Goblin broker, formerly Mordus-aligned, node: GC. Advances to Friendly on paying 50gp for her intelligence. Former supply intermediary who unknowingly moved weapons to the Hollow Hands.

Key line: *"The shaman told them the weapons were tribute Mordus owed them. Mordus never paid tribute. The shaman invented a tribute that made the Hollow Hands feel owed. That's the part that scares me."*

#### State Flags

**Defined in `_S_DEFAULTS()` — line 8438:**

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `vsDebtProbed` | boolean | `false` | Player has spoken with both Solvak and Mordus |
| `vsWeaponsFound` | boolean | `false` | Yva's testimony obtained; Hollow Hands Seal in inventory |
| `vsDebtSettled` | boolean | `false` | Seal delivered to Solvak; debt resolved; +400gp |
| `vsShamanKnown` | boolean | `false` | Set simultaneously with vsDebtSettled; gates §XXI |

#### Quest Chain

| Quest | Title | Completion | Reward |
|-------|-------|------------|--------|
| `quest_vs_01` | Solvak: The Collector | `vsDebtProbed` | Solvak → Friendly; quest_vs_02 activates |
| `quest_vs_02` | Yva: The Broker | `vsWeaponsFound` | Hollow Hands Seal (quest item); Yva → Friendly |
| `quest_vs_03` | Mordus Pays | `vsDebtSettled` | +400gp; Solvak satisfied; vsShamanKnown set |
| `quest_vs_warden` | The Warden | `wardensLegacyKnown` | (handled in §XXI — resolved at MT tunnel) |

**Activation sequence:**
- `quest_vs_01` activates at VS when `actNumber ≥ 5`
- `quest_vs_02` activates after `vsDebtProbed` (Mordus dialogue complete)
- `quest_vs_03` activates after `vsWeaponsFound` (Yva paid)

#### Solvak/Mordus Dialogue Sequence (lines 14548–14562)

The VS node Solvak button delivers a two-beat dialogue with 800ms delay:
1. Solvak explains the debt and the player's leverage: *"He'll talk to you — you're not Conclave."*
2. Mordus (reported speech): *"The debt will be paid when the weapons are returned. The weapons will be returned when I know where they went. I do not know where they went." — He is telling the truth.*

The `harrowNote` conditional (line 14554): if `tlLedgerRead`, Solvak appends *"We lost a ship around the same time. The Harrow. Unrelated, probably."* This is the only dialogue cross-reference between the two arcs — a one-line connection placed naturally in an existing NPC conversation.

#### Yva Payment Gate (line 14593–14608)

Clicking "Find Yva (50gp)" at GC deducts 50gp (hard-gated: *"You don't have 50gp."* if insufficient) and delivers Yva's testimony. She adds a Tilbury cross-reference if `tlMissingShipSolved`:
> *"The Harrow. I heard about that ship. The Hollow Hands didn't touch it. Whatever got that ship wasn't them."*

This second cross-reference (Yva confirming the Harrow was NOT a Hollow Hands operation) separates the two mysteries: the weapons story and the sea creature story are not the same threat. Both lead back to the Void, but via different mechanisms.

#### Hollow Hands Seal Delivery (lines 14568–14583)

At VS with `vsWeaponsFound && !vsDebtSettled`, a button "Deliver the Hollow Hands Seal to Solvak." fires. Clicking removes the Seal from inventory, grants +400gp, sets `vsDebtSettled = true` and `vsShamanKnown = true` simultaneously. Mordus's delayed response (600ms):
> *"The Hollow Hands are mine to deal with now that I know what they are. You found what I needed to find them. That's worth something."*

`vsShamanKnown` being set at this point — not after defeating the shaman — is intentional: the player knows the shaman exists and operates in Mordus's territory. §XXI then surfaces at MT when both `vsShamanKnown` and `vaLastWardVisited` are true.

---

## III. Design Decisions and Trade-offs

### A. Arcs Completable in Any Order

§XIX and §XX were written so the Tilbury arc is not a prerequisite for the Visby arc. A player can complete the Visby debt investigation without having found the Harrow Manifest. The cross-references (Solvak's `harrowNote`, Yva's Harrow dismissal) are conditional on `tlLedgerRead` and `tlMissingShipSolved` respectively — they add synthesis for players who did both arcs, but the Visby arc is complete and coherent without them.

### B. Vonn Choice as Moral Marker

Quest_tl_02 presents a genuine choice (report or leave the manifest) with asymmetric rewards: reporting yields +150gp; leaving yields nothing except the flag. The choice does not affect the game state in any meaningful systemic way — the harbor stays closed, Vonn remains neutral, Rennau does not react differently. The choice is a moral marker, not a branch. A player who takes the money acknowledged the problem formally; a player who leaves it chose silence. Neither action changes Tilbury.

### C. Ori as a Non-Combat Resolution

Quest_tl_03 resolves entirely through dialogue. Ori does not need to be escorted or fought for — she walks into Tilbury on her own and needs only to be spoken with. Her account is the resolution: the player learns what happened to the Harrow through testimony rather than investigation. This matches the arc's theme (institutional record-keeping) — the answer is always available in what people who survived decided to say.

### D. `vsShamanKnown` Set at Settlement, Not at Defeat

`vsShamanKnown` sets when the debt is settled — when the player learns from the chain of evidence (weapons → Hollow Hands → shaman) that the shaman exists. It does not require entering §XXI's encounter. This preserves the correct information order: know the target exists, then seek them out. §XXI activates at MT because the player knows where the shaman is operating from the Yva investigation, not because they stumbled into a dungeon.

---

## IV. Post-Mortem Notes

### What Worked

- The harbor board listing ten ships by name and days-overdue makes the Conclave's scale of incompetence legible immediately. The player sees not one missing ship but ten, classified identically, before the arc begins.
- The Yva `tlMissingShipSolved` cross-reference — *"whatever got that ship wasn't them"* — is the correct resolution to the two-mystery structure. The arcs share a setting (the Conclave, the Void) but have separate explanations. Yva's dismissal prevents the player from conflating them.
- `vsDebtSettled` and `vsShamanKnown` setting simultaneously is the correct design: debt settlement is the moment the player understands the shaman's operation, not a separate reveal.

### What Could Be Better

- The Vonn choice (quest_tl_02) has no downstream consequences visible to the player. Players who choose "Leave it" correctly receive nothing, but there is no acknowledgment that their decision not to act was itself a decision. A small Rennau dialogue variant ("I didn't expect anything different from the Conclave") would close the loop.
- Ori appears at SF in Act IV but there is no in-world signal that she has arrived. A player who completed quest_tl_01 in Act II and returns to SF in Act IV will find the button without any prompt — Ori just appears. An ambient news item, harbor board update, or storyMsg on SF entry in Act IV would make her arrival feel like an event.
- The Hollow Hands Seal drops from `hollow_hands_guard` monsters in `goblin_cave`, but collecting it this way has no effect — `vsWeaponsFound` only sets through Yva's 50gp testimony. A monster-drop path to the same flag would reward players who explore GC before finding Yva.

---

## V. File References

| File | Location | Content |
|------|----------|---------|
| `roll2hit-v3.html` | Line 4624 | `hollow_hands_guard` monster definition |
| `roll2hit-v3.html` | Line 5051 | `hollow_hands_guard` drop → Hollow Hands Seal |
| `roll2hit-v3.html` | Line 5426 | `goblin_cave` terrain pool — includes hollow_hands_guard |
| `roll2hit-v3.html` | Lines 7691–7704 | Rennau NPC profile |
| `roll2hit-v3.html` | Lines 7706–7718 | Vonn NPC profile |
| `roll2hit-v3.html` | Lines 7722–7745 | Solvak and Yva NPC profiles |
| `roll2hit-v3.html` | Lines 8032–8067 | quest_tl_01–03 + quest_vs_01–03 + quest_vs_warden QUEST_DB entries |
| `roll2hit-v3.html` | Lines 8436, 8438 | Tilbury + Visby state flags in `_S_DEFAULTS()` |
| `roll2hit-v3.html` | Lines 13121–13158 | Quest reward handlers — tl_01–03, vs_01–03 |
| `roll2hit-v3.html` | Lines 14456–14542 | §XIX Tilbury render block — harbor board, Ori, Vonn choice |
| `roll2hit-v3.html` | Lines 14544–14609 | §XX Visby render block — Solvak, Mordus, Yva, seal delivery |
| `plan.md` | §XIX + §XX | Original design directives |
| `lab-report-void-shaman.md` | §II | `vsShamanKnown` downstream use — §XXI Warden encounter |
| `lab-report-weimar-scholar-gate.md` | §II.G | `tlLedgerRead` cross-reference via archiveLetterObtained path |
