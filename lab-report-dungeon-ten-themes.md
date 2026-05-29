<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report — §DUNGEON-01: Ten Dungeon Themes Applied to The Shattered Codex

**Layer:** 80  
**Spec ref:** §DUNGEON-01 + §DUNGEON-02 in plan.md  
**Date:** 2026-05-26  
**Status:** PRE-IMPLEMENTATION LOCK — do not begin HTML edits until all 7 items below are resolved and signed off

---

## 1. Priority Tier Assignment (P1 vs P3+)

### P1 — Low-hanging fruit, existing infrastructure only

| Theme | §D01-# | Why P1 |
|-------|--------|--------|
| Themed Dungeon Doctrine | §D01-01 | Flavor sections in existing EB `storyRender()` — no new nodes, just `!defeatedBattles[ebCode]` gates |
| CY Madness Gate + Hero Origin Reveal | §D01-07 | WIS save on first CY visit already follows `!visited['CY']` pattern; d10 table is flavor hcard only; 3 new state flags |
| Codex Core Chamber (Loop Heart) | §D01-10 | Pre-boss Ceremonia Roll at CO node; `codexCoreChosen` flag + 3 outcome branches; uses existing `_rollCeremonia()` |
| Prior Carrier NPC (text/state only) | §D01-03 | State flags `priorCarrierSeen`, `priorCarrierSpoke`; dialog tree in WM node's `storyRender()`; no new NPC profile needed |
| Void Flux Chamber (state flag) | §D01-09 | `voidFluxActive` boolean inserted into combat loop pre-existing damage resolution; combat inversion table is a state-check wrapper |

### P2 — Moderate effort, no new nodes

| Theme | §D01-# | Why P2 |
|-------|--------|--------|
| Codex Inquisitor at Weimar | §D01-02 | New QUEST_DB entries (§D02-02, 3-question chain); uses `activateCond` + `wmLowerArchiveUnlocked` gate |
| Sacrifice Gates (3 toll gates) | §D01-04 | 3 separate QUEST_DB/trigger hooks at CO, WM, void node; `journalEntriesRead` removal logic is novel |
| Void Fracture Maze | §D01-05 | `mazeSolvedChecks` counter + 3 Ceremonia Rolls; applied as EB approach room at BK; no new node |
| Mimic Colony quest (no new node) | §D01-08 | `quest_mimic_colony` as a QUEST_DB entry; Tribble counter; Animal Handling checks via `_rollCeremonia()` |

### P3+ — Require new nodes in WORLD_DB and node graph

| Theme | §D01-# | Why P3+ |
|-------|--------|---------|
| Scholar King's Workshop (Node SW) | §D01-06 | New `WORLD_DB` entry `workshop`, new `NODE_MAP`/node connection from WM or CO; new node render function |
| Node MM — Mimic Meadows | §D01-08 | New `WORLD_DB` entry `mimic_meadow`, new passive monster flags, node graph connection from NODE 33 |

**Implementation order for this layer (Layer 80):**
P1 themes first (§D01-07 CY madness, §D01-10 Codex Core, §D01-03 Prior Carrier text), then P2 (§D01-02 Inquisitor, §D01-08 colony quest), then P3+ (Node SW, Node MM) in a later layer if needed.

---

## 2. Node MM (Mimic Meadows) Data Shape

### WORLD_DB entry (locked):

```js
mimic_meadow: {
  label: 'The Mimic Meadows',
  icon: '🪣',
  monsters: [
    P.baby_chest_mimic,
    P.bookshelf_mimic,
    P.floor_mimic,
    P.mother_mimic,
  ],
},
```

### MONSTER_POOL entries (new, passive-flagged):

```js
baby_chest_mimic:  { name:'Baby Chest Mimic',  ac:10, hp:8,  atk:'+2', dmg:'1d4',  xp:25,  icon:'🪣', passive:true },
bookshelf_mimic:   { name:'Bookshelf Mimic',    ac:12, hp:18, atk:'+3', dmg:'1d6',  xp:50,  icon:'📚', passive:true },
floor_mimic:       { name:'Floor Mimic',        ac:13, hp:22, atk:'+4', dmg:'1d8',  xp:75,  icon:'🟫', passive:true },
mother_mimic:      { name:'Mother Mimic',       ac:16, hp:60, atk:'+7', dmg:'2d8+3',xp:200, icon:'🗃', passive:true },
```

### `passive` flag implementation:

The `passive` flag is new to MONSTER_POOL. In `storyEnter()` / the battle start function, before spawning a random encounter at Node MM, check: if the terrain is `mimic_meadow` AND all monsters in the pool have `passive:true`, do not auto-spawn a battle. The node is encounter-free by default. The Mother Mimic battle triggers only if `quest_mimic_colony` Act III condition fires (any mimic was attacked). Implementation: a `_isPassiveTerrain(terrain)` helper that returns `true` if all monsters in `WORLD_DB[terrain].monsters` have `passive:true` in MONSTER_POOL.

### Node MM access:

Node MM is not in the current NODE_MAP (Layer 80 scope defers new node graph wiring to P3+). For P1/P2 work, the Mimic Colony quest (`quest_mimic_colony`) and Tribble mechanic are implemented as if reachable; the actual node connection from NODE 33 is P3+ work. Quest activates via `activateNode:'MM'` once the node exists.

---

## 3. Tribble Lore Revision — Corruption, Not Multiplication

**Decision: Tribbles do NOT multiply. They are void-corruption made soft.**

The original plan.md spec described Tribbles as Star Trek-style harmless multipliers. This is revised. In The Shattered Codex, Tribbles are not cute nuisances — they are a visible symptom of the Void's corrupting influence on living matter. Small, warm, fuzzy things that emit a low bioluminescent pulse. They appear near areas of high Void pressure. The Mimic Meadows are full of them because mimics eat them — Tribbles are the primary food source that keeps the mimic colony passive and well-fed.

**The mimics are the ecosystem pressure that controls the Tribble population.** Without the mimics eating them, Tribbles would accumulate near Void-heavy nodes. The Mimic Meadows exist precisely because something keeps them contained there.

### What Tribbles ARE in this lore:

- Corruption made tactile — the Void produces them as a byproduct of reality deteriorating at the edges
- Warm and soft to the touch; they pulse faintly with bioluminescent void-light
- Non-hostile, non-multiplying, non-dangerous in small numbers
- The mimics find them irresistible and eat them; this is why the Mimic Meadows is peaceful
- If the mimic colony is disturbed or the meadows are cleared, Tribble accumulation at CY and CO would increase — a consequence the game does not mechanically track but the lore holds

### What Tribbles ARE NOT:

- Multiplying creatures (no rest hook, no `tribbleCount` growth formula)
- Cute pets or harmless collectibles
- Star Trek references

### State field: `tribbleCount: 0`

`tribbleCount` is a simple acquisition counter — how many Tribbles the player is carrying. It does not grow on rest. It decreases if Tribbles are offered as mimic-bait (consumed on use). It has no upper bound in the mechanical sense, but flavor text changes above threshold.

### Acquisition:

Tribbles are dropped at Node MM from the floor_mimic Animal Handling pass and from Mimic's Cache. Each acquisition adds 1 to `tribbleCount`. They do not occupy inventory slots — `tribbleCount` is a bare counter.

### Tribble-as-mimic-bait:

At Node MM, offering a Tribble to a mimic before an Animal Handling check consumes 1 (`tribbleCount--`) and reduces the effective DC by 4. The mimic eats it. That is what they do with Tribbles.

### Display thresholds (flavor text only, no mechanics):

| `tribbleCount` | Flavor note |
|---------------|-------------|
| 1–2 | Carried without incident. They pulse faintly. |
| 3–4 | Visible in your pack. People look at them. |
| 5+ | CY node flavor line: *"The Tribbles in your pack pulse slightly faster here. The Void is close."* |

### `tribbleOverflow` flag: REMOVED

The previous spec had `tribbleOverflow: true` trigger a Brynn line ("Those things are on the ceiling"). This is cut — it was predicated on multiplication, which no longer happens. `tribbleOverflow` state field removed from `_S_DEFAULTS()`. The Brynn overflow line is removed from the IN node render block.

---

## 4. Madness Table: Flavor-Only Confirmed

**Decision: No mechanical penalties. Flavor hcard only.**

The CY madness result (`cyMadnessTable`) is a single d10 roll producing one flavor string. It fires as an `_appendStoryHcard()` entry with actor `'VOID'` and is immediately done. It does not:
- Reduce HP, AC, or any stat
- Apply a condition item
- Block any action
- Persist beyond the hcard display

The only persistent effect of failing the WIS DC 12 save is `cyMadnessRoll: 'fractured'` (vs `'clear'`). This flag affects NG+ flavor text only — on NG+, the WIS save does not fire and instead shows a one-time "you should not remember it" line.

**Rationale:** §D01-07 spec text explicitly states "flavor only — no mechanical penalties past flavor." The madness table is atmospheric; adding penalties would punish players for visiting CY first, which contradicts the "no permanent fail" design principle.

---

## 5. `voidFluxActive` Inversion Logic Location

### Where to insert:

The combat damage resolution lives in the main battle loop function (approximately lines 6500–7050). The attack/damage application happens in the `S.round` increment block. The `voidFluxActive` check must be inserted **after** the base damage roll and **before** HP is subtracted.

**Specific insertion point:** After `const dmg = ...` (raw damage value) and before `S.player.hp -= dmg` (or equivalent enemy HP reduction). The check wraps the `dmg` value:

```js
// Void Flux inversion — fires only during voidFluxActive combat
if (S_story.voidFluxActive) {
  // check condition items on current attack for fire/heal/buff tags
  if (activeCondition && activeCondition.element === 'fire') {
    // fire → cold: same numeric damage, add slow label to hcard
    conditionLabel = '[Void Flux] Fire → Cold';
  }
  // healing items handled in storyShortRest / potion use paths separately
}
```

### How to avoid breaking existing condition item calculations:

**Key constraint:** The condition item system (`S_story.condition`, applied as stat modifiers to attack/defense rolls) operates before damage values are resolved. `voidFluxActive` must not touch condition item stat math — it only modifies the narrative label and applies a secondary effect (slow, repositioning text) **after** all dice math is complete.

**Implementation rule:** `voidFluxActive` only modifies hcard output labels and applies secondary flavor effects (e.g., tagging the next hcard as cold damage). It does NOT re-roll dice, modify `atk`, `ac`, or condition modifiers. This ensures zero interference with existing condition item calculations.

**Healing inversion:** In the potion use path (`storyBuyPotion` result block and the `storyShortRest` item-use section), a single check:
```js
if (S_story.voidFluxActive) {
  const inverDmg = Math.floor(healAmt * 0.5);
  S_story.hp = Math.max(1, S_story.hp - inverDmg);
  // hcard: "Heal → Hurt [Void Flux]"
}
```
This is self-contained and does not affect any non-voidFlux heal paths.

---

## 6. Prior Carrier NPC — Separate Entity Confirmation

**The Prior Carrier is NOT an existing NPC and does NOT share state with the player.**

### Confirmed distinct from existing cast:

| Existing NPC | Why not the Prior Carrier |
|-------------|--------------------------|
| Sweelinck | Still active, historically placed; not imprisoned |
| Froberger | Deceased (established lore); journal-only presence |
| Brynn | Inn-keeper; no Weimar connection |
| Yael | City watch; living, present-tense |
| Couperin | Musician NPC; no Scholar King connection |
| Pachelbel | Merchant/quest NPC; no Weimar lower archive presence |

### Implementation:

The Prior Carrier has **no `BIRKA_NPC_PROFILES` entry** and **no `NPC_DIALOGUES` entry**. They are rendered entirely through story-mode node text in the WM node's `storyRender()` block, gated by `inquisitorPassed: true`. Their dialog is three fixed branches (Yes/No/Ignore) wired as inline `storyMsg()` calls, not through the NPC dialogue system.

### State fields belonging to player (not shared):

- `priorCarrierSeen: boolean` — player's flag; set when player sees the Prior Carrier's cell
- `priorCarrierSpoke: boolean` — player's flag; set when player answers the question

The Prior Carrier has no HP, no favor system, no inventory interaction. Their "Prior Carrier's Token" is a `flavor` type inventory item — it cannot be sold, used, or equipped. It exists only to appear in the inventory panel as narrative artifact.

---

## 7. Codex Core Chamber — Ending System Compatibility

### `_missionComplete()` analysis:

```js
sealedVoid: !!(S_story.defeatedBattles && S_story.defeatedBattles['CO']),
```

This is the only CO-relevant check. `_missionComplete()` does NOT check for `catKingDefeated` or `sevenShards` — it checks 12 separate conditions and requires 8 to be true. `sealedVoid` is one of those 12.

### Problem with the "Destroy" path:

The "Destroy" path bypasses the Auros fight (STR DC 15 smashes the housing). If Auros is never fought, `defeatedBattles['CO']` is never set, and `sealedVoid` is `false`. This would break `_missionComplete()` for the Destroy path.

### Fix (locked):

After a successful "Destroy" Ceremonia Roll (STR DC 15), set:
```js
S_story.defeatedBattles['CO'] = true;
S_story.codexCoreChosen = 'destroy';
S_story.curseScore = (S_story.curseScore || 0) + 5;
```

This treats the housing destruction as equivalent to defeating the CO EB for mission-complete purposes. Auros is "freed from compulsion" (flavor) rather than defeated in combat, but the seal is broken either way.

### "Claim" path:

The "Claim" path still requires the Auros fight (the spec says "Auros fight still required but Auros is confused"). So `defeatedBattles['CO']` is set normally via the existing combat win path. No compatibility fix needed.

### "Stabilize" path:

Standard path — Auros fight proceeds normally. No change needed.

### Summary: only the "Destroy" path needs the manual `defeatedBattles['CO'] = true` injection.

---

## Implementation Phases (§DUNGEON-01 Layer 80)

### P1 — Layer 80, Phase 1 (HTML changes)

1. **`_S_DEFAULTS()` additions:**
   - `cyMadnessRoll: null`, `cyMadnessTable: null`
   - `inquisitorMet: false`, `inquisitorPassed: false`
   - `priorCarrierSeen: false`, `priorCarrierSpoke: false`
   - `mazeSolvedChecks: 0`, `voidMazeEntered: false`
   - `voidFluxActive: false`, `voidFluxCleared: false`, `voidFluxImmunityChoice: null`, `voidFluxScrollChanged: false`
   - `codexCoreChosen: null`, `codexCoreEntered: false`
   - `tribbleCount: 0`, `mimicPetName: null`, `tribbleGladesFed: false`
   - `memorGateBypassUsed: false`, `memorGatePassedEntry: false`
   - `cyMadnessDecoded: false`, `cyOriginKnown: false`
   - `aurosBlueprintKnown: false`, `scholarWorkshopComplete: false`, `spiritDefeated: false`
   - `scriptorium_approach_complete: false`
   - `mimicColonyEntered: false`

2. **CY Madness Gate (§D01-07):** WIS save block in CY node `storyRender()`, gated by `!S_story.visited?.['CY']`. d10 table as array. Fires `_appendStoryHcard()`.

3. **Codex Core Chamber (§D01-10):** Pre-boss Ceremonia Roll section in CO node render, gated by counting shards >= 6. Three-branch choice room with `_rollCeremonia()` hooks. "Destroy" path sets `defeatedBattles['CO'] = true`.

4. **Prior Carrier text (§D01-03):** WM node render block gated by `inquisitorPassed`. Three inline response branches.

5. **`voidFluxActive` inversion (§D01-09):** State flag only in Phase 1 — set/clear logic added to AT and CY_VOID EB approach rooms. Full inversion table in combat loop is Phase 2.

### P2 — Layer 80, Phase 2

6. **§DUNGEON-02 QUEST_DB entries** (D02-01 through D02-10): All 10 five-act quests as QUEST_DB entries using the `skill_check` + `side` type patterns from §DESIGN-03. D02-02 Inquisitor, D02-03 Prior Carrier, D02-10 Codex Core are the highest narrative priority.

7. **Tribble counter (acquisition only):** `tribbleCount` incremented when Tribbles are received as loot. No rest multiplication. See §3 revision.

8. **`quest_mimic_colony`:** QUEST_DB entry for Node MM. Animal Handling Ceremonia Rolls for each mimic type. `mimicPetName` text entry.

### P3+ — Later layer

9. **Node SW (Scholar King's Workshop):** New `WORLD_DB` entry, new node in graph.
10. **Node MM (Mimic Meadows):** New `WORLD_DB` entry, MONSTER_POOL additions, node graph connection from NODE 33.
11. **Full `voidFluxActive` combat inversion:** Wrap damage resolution in combat loop.

---

## New State Fields Summary

| Field | Type | Default | §D01-# |
|-------|------|---------|--------|
| `cyMadnessRoll` | `'clear'\|'fractured'\|null` | `null` | §D01-07 |
| `cyMadnessTable` | `string\|null` | `null` | §D01-07 |
| `inquisitorMet` | `boolean` | `false` | §D01-02 |
| `inquisitorPassed` | `boolean` | `false` | §D01-02 |
| `priorCarrierSeen` | `boolean` | `false` | §D01-03 |
| `priorCarrierSpoke` | `boolean` | `false` | §D01-03 |
| `mazeSolvedChecks` | `number` (0–3) | `0` | §D01-05 |
| `voidMazeEntered` | `boolean` | `false` | §D01-05 |
| `voidFluxActive` | `boolean` | `false` | §D01-09 |
| `voidFluxCleared` | `boolean` | `false` | §D01-09 |
| `voidFluxImmunityChoice` | `string\|null` | `null` | §D01-09 |
| `voidFluxScrollChanged` | `boolean` | `false` | §D01-09 |
| `codexCoreChosen` | `'stabilize'\|'destroy'\|'claim'\|null` | `null` | §D01-10 |
| `codexCoreEntered` | `boolean` | `false` | §D01-10 |
| `tribbleCount` | `number` | `0` | §D01-08 |
| `mimicPetName` | `string\|null` | `null` | §D01-08 |
| `tribbleGladesFed` | `boolean` | `false` | §D01-08 |
| `memorGateBypassUsed` | `boolean` | `false` | §D01-04 |
| `memorGatePassedEntry` | `boolean` | `false` | §D01-04 |
| `cyMaintenanceDecoded` | `boolean` | `false` | §D02-07 |
| `cyOriginKnown` | `boolean` | `false` | §D02-07 |
| `aurosBlueprintKnown` | `boolean` | `false` | §D02-06 |
| `scholarWorkshopComplete` | `boolean` | `false` | §D02-06 |
| `spiritDefeated` | `boolean` | `false` | §D02-06 |
| `scriptorium_approach_complete` | `boolean` | `false` | §D02-01 |
| `mimicColonyEntered` | `boolean` | `false` | §D02-08 |

---

*Lab report complete. Proceed with HTML implementation (Phase 1 first) after this file is committed.*
