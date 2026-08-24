<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — Layer 61, §XXVI: Corelli the Wandering Merchant

**File:** `play.html`
**Original:** 2026-05-25 · **Verified against HEAD:** 2026-08-11 (§DOC-02g)
**Status:** Shipped, with three defects live at HEAD
**Format:** IEEE post-mortem, verification-revised

> **Revision note.** The 2026-05-25 text is retained where it verified and corrected where it did not. §2 records the survival measurement; §3 is the spec→shipped delta table. A claim that never shipped is marked **NOT SHIPPED** and kept, not deleted. Line numbers in the original are all stale and are not reproduced; anchors below are `symbol@line` (§DX-01e).

---

## Abstract

Corelli is a cross-act vendor appearing at most once per act window across five nodes. His inventory feeds the §XVI/§XVII Antecedent arc: three readable lore items, one consumable, one trinket, and a free fifth-appearance cipher gated on purchase-derived favorability. Verification finds the **mechanism intact and the geography broken**: 19 of 20 named identifiers resolve, every state field and helper survives under its original name, and the purchase→favorability→revelation spine is byte-for-byte the design — but **0 of 5 node codes are correct at HEAD**, one of the five resolves to a *different live place*, and the item at that stop is unobtainable. Two live sources (an engine comment and `world.md`) record the arc's own history wrongly; **this report holds the correct record**, settled from the archive.

---

## 1. Verification Method

1. Grep every identifier the report names against HEAD.
2. `git log -S` every dead symbol — this separates **RETIRED** (shipped, later removed) from **NEVER SHIPPED** (§DOC-02c instrument).
3. For claims *about the past*, read the archive rather than HEAD (`git show <sha>:play.html`) — HEAD cannot adjudicate what a prior version did (§DOC-02f instrument 8).
4. Resolve every node code against `NODE_MAP` **and check what it names**, not merely that it resolves.

The birth commit is **`194a810`**; the repoint commit is **`c1d5a94`**.

---

## 2. Survival Summary

| Measure | Result |
|---|---|
| Identifiers named / resolving at HEAD | **19 / 20 (95%)** — the highest survival measured in the §DOC-02 program |
| State fields surviving under original name | **4 / 4** |
| Helper functions surviving under original name | **2 / 2** |
| Item keys surviving | **5 / 5**, all five `readText` strings verbatim |
| Node codes correct at HEAD | **0 / 5** |
| Dead identifiers | 1 — `storyCorridorTravel` (**RETIRED**, not never-shipped) |
| Retired node property the design depends on | `junction:true` — **0 occurrences** at HEAD |

**The internal gradient repeats §DOC-02f's finding.** Everything the author could have *transcribed* — field names, item keys, prices, the favorability formula, the RD node record — is exact. Everything *narrated* — the UI shape, the pacing critique, "remains readable" — is wrong, and three of those were wrong **on the day the report was written**, not by drift.

---

## 3. Spec → Shipped Delta Table

| # | Report claim | HEAD | Class |
|---|---|---|---|
| 1 | Appearances at `DK`→`RD`→`BK`→`SQ`→`IN` | `LCY`→`WRO`→`BK`→`NUE`→`TLL` | Repointed by `c1d5a94` after §WALK retired the 26×16 codes |
| 2 | Stop 3 = `BK` = Broken Tooth Tavern, Visby | `BK` = **Birka Shore — Northern Longship Landing**, a beach, act 1 | **LIVE DEFECT** — correct target is `VBY` |
| 3 | Stop 3 fires when the player stands there | `BK` shares cell (10,197) with `LHR` and is non-primary — **it can never be arrived at** | **LIVE DEFECT** (§AUDIT-03x) |
| 4 | `encoded_letter` purchasable at stop 3 for 80gp | Its only grant path is stop 3 → **unobtainable** | **LIVE DEFECT**, consequence of 2+3 |
| 5 | `false_warrant` auto-consumes to skip a corridor encounter, disabled at `voidPressure >= 7` | Host `storyCorridorTravel` deleted by `85cc43e` (§CELL-11A). Item still sells for **200gp** with no reader | **RETIRED** — shipped at birth, removed later |
| 6 | The item "remains in inventory and remains readable" (§3.3) | `readableItems` filters `type === 'readable'`; `false_warrant` is `type:'consumable'` → **no Read button, ever** | **NOT SHIPPED** — untrue at birth too |
| 7 | Vendor UI and revelation are **modals** | Both are `storyMsg()` lines into the story log plus buttons inserted via `insertAdjacentElement('afterend')` on `#story-text-box` | **NOT SHIPPED** — untrue at birth too |
| 8 | Revelation "fires before the vendor UI" on stop 5; player is "immediately asked to interact with a shop" (§2.5, §4.2) | Stop 5 has `itemLabel:null` and the branch **`return`s** after the revelation. There is no shop | **NOT SHIPPED** — the critique describes behavior the code cannot produce, at birth or now |
| 9 | RD is `junction:true`, "keeping it lightweight" (§3.6) | Node deleted by §WALK; **`junction:true` has 0 occurrences** and violates `check:invariants` I1/I2 | Banned design |
| 10 | `CORELLI_ITEMS` and `CORELLI_APPEARANCES` both at lines 11130–11163 | Two structures cannot share one range; both numbers were wrong at birth as well | Report-internal error |
| 11 | The block lives inline in `storyRender` | Migrated into `_nodeHookCorelliMerchant(node)`, one call site, order preserved | Refactor (§VM-01-G-FU) |
| 12 | — (not covered) | `corelliRevelationDelivered` has **three readers the report never mentions**, all present at birth: a Warrant's Board rumor, the victory-screen `qOrder`, and `FROBERGER_MEMORIAL_TEXT.post_cipher` | Coverage gap, not drift |

**Verified unchanged (no delta):** all four state fields and their defaults; `fav_corelli = min(3, corelli_purchase_count)`; the `count < index` monotonic gate; the three-tier opener selection at fav ≥ 2 / ≥ 1 / else; all five item names, icons, types, prices and `readText` bodies; `kings_seal`'s +1 death-save bonus; the `encoded_letter` decoded footnote; the revelation's `fav >= 3` gate and its full monologue.

---

## 4. Finding 1 — The report is the correct record; two live sources are wrong

The engine comment above `CORELLI_APPEARANCES` states: *"The old header named the 26×16 codes TL/RD/IS/WM/IN."* `world.md` repeats it: *"the doc's old `TL/RD/IS/WM/IN` were the retired 26×16 names."*

The archive disagrees. At `194a810` and at `c1d5a94^`, the `nodeCode` values are **`DK`, `RD`, `BK`, `SQ`, `IN`** — exactly what this report says. There was no header comment above the structure to misread; none existed until `c1d5a94` wrote one. **Three of the five old codes in both live sources are wrong, and the lab report is right.**

This is the second corpus correction of a live source by a §DOC-02 verification, and the first where the wrong source is the **engine itself**. The generalizable rule:

> **A migration commit's own comment is a claim about the past, and it is usually written from memory rather than from the diff.** Verify it against `git show <sha>^` like any other claim. The doc being "in the code" confers no authority about history.

The error is not cosmetic. The migrator believed stop 3's old code was `IS`; it was `BK` — and `BK` is *still a live key*. That belief is the mechanism of Finding 2.

---

## 5. Finding 2 — The `BK` collision is a live defect, and it is not confined to Corelli

`BK` is the §AUDIT-03m **"worse than dead"** class: the code resolves, so `check:noderegs` passes, while the sentence is wrong.

| | Report's `BK` (2026-05-25) | HEAD's `BK` |
|---|---|---|
| Label | Broken Tooth Tavern, Visby | Birka Shore — Northern Longship Landing |
| `name` | `bar` | `beach` |
| `act` | 5 | 1 |
| Live key | `VBY` | `BK` |

Corelli's stop-3 dialogue is unambiguous about which it means — *"Visby. Well."* and *"Mordus runs a tight tavern."* `VBY`'s own node text is the Mordus scene, and `VBY` carries `npc:'Warlord Kael Mordus'`.

**The same mis-repoint hit at least two more registries:**

- `NPC_DIALOGUE.BK` = *Warlord Kael Mordus*, whose quote opens **"You're not from Visby. But you're here"** — keyed to a Birka beach. `VBY` appears nowhere in that registry.
- `VENDOR_NODES` contains `'BK'` — a vendor at a longship landing with no vendor in its text.

Direct references at HEAD: **9 × `activateNode:'BK'`, 2 × `waypointNode:'BK'`, 1 × `nodeCode:'BK'`.** Each needs individual adjudication — some may legitimately mean the Birka shore. Filed as **§AUDIT-03y**.

---

## 6. Finding 3 — Stop 3 is unreachable independently of the collision

`NODE_COORDS` places `BK` and `LHR` in the same cell, **(10, 197)**. `LHR` is declared first in `NODE_MAP`, so it is `list[0]` for that cell; per §AUDIT-03x, `S_story.currentCode` is assigned only from `list[0]`, so `node.code` is never `'BK'` and `_checkCorelliAppearance` can never match stop 3.

Consequences, in order of severity:

1. **`encoded_letter` is unobtainable.** Stop 3 is its only grant path. This kills design decision §3.4 — the retroactive decode — which §4.1 named as the feature that tested best. The footnote code at `it._decoded@31178` is live and correct and can never fire from a purchased letter.
2. **The arc still completes.** The gate is `count < index`, so stops 4 and 5 fire with `count` at 2 and 3; three purchases remain available (`scholar_ink`, `false_warrant`, `kings_seal`), so `fav_corelli` still reaches 3 and the revelation is attainable. The failure is silent — a missing stop, not a broken chain.
3. Repointing stop 3 to `VBY` fixes 1 and 2 together. This is the cheap fix and it does **not** wait on §AUDIT-03x's design call.

---

## 7. Finding 4 — `false_warrant` is a 200gp purchase with no surface

It shipped working. `194a810` carried the exact mechanic described: a `findIndex` on inventory inside the hunt-mode encounter branch, `splice`, the narration *"The patrol glances at your papers and waves you through"*, and the `voidPressure < 7` disable. `85cc43e` (§CELL-11A, corridor dead-code removal) deleted the host function and took the mechanic with it.

At HEAD the item is still sold at stop 2 — **which is reachable** — for 200gp, and:

- it renders in the **💊 Consumables** section (`type === 'consumable'`),
- it has **no Use button** (the only consumable handler tests `effect === 'advantage_next_attack'`, which it lacks),
- it has **no Read button** (`readableItems` filters `type === 'readable'`).

A player can buy it and never interact with it again. This is the §AUDIT-03v/§AUDIT-03w class — a player-facing price with nothing behind it — and the third instance in four increments, which is why that family now wants a detector rather than another hand-filed row. Filed as **§AUDIT-03y** (b).

---

## 8. Design Intent (verified, condensed)

Corelli delivers Antecedent lore at plausible diegetic sources rather than by exposition dump, and is fully optional. Three intents, all shipped:

1. **Reward engagement over time** — one encounter yields an item; five yield the cipher key.
2. **Tie inventory to active systems** — `scholar_ink` explains voidPressure P3/P6/P9 breakpoints the player is already living through; `kings_seal` grants +1 to death saves at `const _kingsSealBonus@7502`. *(The third leg, `false_warrant`'s corridor effect, is Finding 4.)*
3. **Make the fifth encounter earned** — gated on `fav >= 3`, i.e. three prior purchases.

Two design decisions verify exactly and remain sound: favorability derives from **purchases, not encounters** (seeing Corelli without buying moves nothing), and `last_cipher` is **free and non-purchasable**, so the fifth meeting is a gift rather than a transaction.

---

## 9. Architecture as Shipped

**State** (`fav_corelli: 0@23144`) — `fav_corelli` (0–3, always derived), `corelli_purchase_count`, `corelli_encounter_count`, `corelliRevelationDelivered`.

**Selection** (`function _checkCorelliAppearance@23448`) — first entry where `nodeCode` matches, `actNumber >= actMin`, and `corelli_encounter_count < index`. Because every encounter raises the floor, an appearance can be *skipped* but never taken out of order.

**Voice** (`function _corelliOpener@23453`) — `openerTrusted` at fav ≥ 2, `openerFriendly` at fav ≥ 1, else `opener`.

**Data** (`const CORELLI_ITEMS@26588`, `const CORELLI_APPEARANCES@26610`).

**Surface** (`function _nodeHookCorelliMerchant@31739`) — renders a `🛒 Traveling Merchant` button after `#story-text-box`. On click: increment encounter count, emit the opener, then either the stop-5 revelation branch (deliver `last_cipher`, set `corelliRevelationDelivered`, mark any owned letter `_decoded`, **return**) or a buy/pass button pair that debits gold and recomputes favorability.

**Appearances at HEAD:**

| # | Code | Node at HEAD | actMin | Item | Verdict |
|---|---|---|---|---|---|
| 1 | `LCY` | Harbor Docks — Tilbury | 2 | `scholar_ink` 120gp | ✅ matches the described place |
| 2 | `WRO` | Midlands Road Fork | 3 | `false_warrant` 200gp | ⚠️ place OK, item inert (Finding 4) |
| 3 | `BK` | Birka Shore — beach | 5 | `encoded_letter` 80gp | ❌ wrong place, unreachable (Findings 2–3) |
| 4 | `NUE` | Scholar's Quarter — Weimar | 6 | `kings_seal` 350gp | ✅ matches the described place |
| 5 | `TLL` | The First Inn | 8 | `last_cipher` free | ✅ matches the described place |

**The retired RD node** (§2.7 of the original) verifies **5/5** against the archive — `num:78`, `act:3`, `W:'J6'`, `E:'MI'`, `junction:true`, `NODE_COORDS r:5,c:6`. `J6` and `MI` are both absent at HEAD; `RD` was deleted with the junction stubs and stop 2 reassigned to `WRO` (§AUDIT-03j).

---

## 10. Post-Mortem, Reassessed

**Held up.** Purchase-count favorability needs no in-game documentation because the behavior is intuitive, and it survived five months and a world-coordinate migration untouched. The `last_cipher` line — *"She built it to save us. They hid it to save themselves."* — is verbatim at HEAD, including the detail that it is scratched with a nail.

**Held up but unreachable.** The `encoded_letter` retroactive decode is well-built and cannot currently be experienced (Finding 3).

**Still open.** The Act II→III gap between stops 1 and 2 remains the longest, with no ambient reminder.

**Withdrawn.** The pacing critique — *revelation, then immediately a shop* — describes a sequence the code has never produced (delta 8). The `false_warrant` legibility complaint is superseded: the item has no effect to surface (Finding 4). The `kings_seal` price critique stands on its own terms, but note the bonus **does** apply and is not documented anywhere the player can read.

**New, from verification.** RD was built as infrastructure for one NPC and then deleted by a world migration, taking stop 2 with it until §AUDIT-03j caught it. Stop 3 was lost the same way and was **not** caught, because its code still resolved. The lesson is the one this increment adds to the program:

> **A code that resolves is not a code that is right.** After any key-space migration, verify what each surviving code *names*, not merely that it looks up.

---

## 11. Backlog Filed

- **§AUDIT-03y (a)** — repoint `CORELLI_APPEARANCES` stop 3 and `NPC_DIALOGUE` from `BK` to `VBY`; adjudicate `VENDOR_NODES` and the 12 `BK` field references individually. No design call for the two Visby-texted ones.
- **§AUDIT-03y (b)** — `false_warrant`: restore an effect or stop charging 200gp. Design call, and it should close with §AUDIT-03v/§AUDIT-03w as one detector.
- **§DX-02q** — a `check:noderegs` phase for **semantic** collisions: a node code whose surrounding content contradicts the node it resolves to.
- Correct the `TL/RD/IS/WM/IN` claim in `world.md` and in the engine comment (done this increment).

---

*Layer 61, §XXVI — Corelli the Wandering Merchant. Verified against `play.html` at HEAD, 2026-08-11.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
