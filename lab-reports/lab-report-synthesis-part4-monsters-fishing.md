<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report Synthesis — Part 4: Monsters & Fishing
**Cross-Reference of All Monsters & Fishing Lab Reports Against roll2hit-v3.html**
**Date:** 2026-06-16 · **HTML baseline:** 33,721 lines · **Source reports:** 2

---

## Purpose

Each entry reads the lab report against the live HTML and answers: what was documented, what is the current code, what still applies as working design knowledge. Reports are in `lab-reports/` untouched.

---

## Report 1 — `lab-report-fish-with-dnd.md`
**Original scope:** Layer 37 — Yugurt Lake predator encounter system; 2d20 range mechanic; 20-rank FISH_POOL; The Fisherman NPC (2026-05-22)
**Still active:** Partially — FISH_POOL is live; the roll mechanic was superseded

### What the report said

**The core mechanic: 2d20 range.** Click Cast a Line, roll two d20s independently. Lower die = rank floor, upper die = rank ceiling. Pick one fish at random from all fish with rank between floor and ceiling inclusive. When both dice match, you fight exactly that rank. When you roll 1 and 20, anything in the lake can answer. The mechanic was described as "honest" — it tells you exactly what you risked.

**The fish pool (20 ranks).** `FISH_POOL`: Needle Minnow (rank 1, AC 5, HP 4, 1d3) through Yugurt's Dread (rank 20, AC 20, HP 220, 4d12+9). Naming convention: poison, barb, or predator terms for all 20. None are passive catches.

**Node design.** BOO (Yugurt Lake, `isFishingLake:true`) has no battle, no loot, no NPC — only a Cast a Line chip. SSJ (Yugurt Cabin) has sleep at 0 cost, loot 'Fishing Rod', npc 'The Fisherman'. The Fisherman says one thing: *"...Nice Day For Fishing. Yugurt!"*

**Fish battles don't lock the node.** The flag `pb.fish = true` on the pending battle prevents `defeatedBattles[nodeCode]` from being set. The lake replenishes. You are not winning the lake.

**Rewards.** Standard tier-based XP and gold: `floor(0.1 × AC × maxHP)`. Full D&D 5e combat. Death saves active. The Fishing Rod grants the Hooked condition (Advantage on attack rolls) as a standard condition item.

### Current HTML relevance

**The 2d20 range mechanic was superseded.** The live `storyFishing()` (line 26,731) uses a four-phase roll system that replaced the lo/hi approach:

| Phase | Roll | What it determines |
|-------|------|--------------------|
| 1 DEX Cast | d20 + DEX mod vs DC 12 | castMod: −2 (clumsy) / 0 (clean) / +2 (perfect) |
| 2 Catch Roll | d20 + bait.catch + castMod + favBonus + rodBonus + lakeMagicBonus | Size tier (null/small/medium/large/very_large/legendary) |
| 3 Type Roll | d20 + bait.type + luckMod + eelBonus + nightMagicBonus | Rarity (common/rare/enchanted/golden/legendary) |
| 4 Fish Select | Random from `FISH_SIZE_TIERS` range | Specific fish from `FISH_POOL` |

`FISH_SIZE_TIERS` (line 24,387): small (ranks 1–4), medium (ranks 5–9), large (ranks 10–14), very_large (ranks 15–19), legendary (rank 20 only).

**FISH_POOL is live and mostly renamed.** (line 24,229) Twenty ranks are active. Several names changed from the original report:

| Rank | Original name | Live name |
|------|---------------|-----------|
| 3 | Spine Perch | Spine Dace |
| 4 | Venom Roach | Toxic Bleak |
| 5 | Razorback Carp | Venom Perch |
| 6 | Poison Bream | Barb-Back Roach |
| 7 | Barbed Tench | Poison Tench |
| 9 | Venom Pike | Envenomed Chub |
| 10 | Razorfin Zander | Poison Carp |
| 20 | Yugurt's Dread | Yugurt's Dread ✓ |

Names shifted toward more evocative prose ("Toxic Bleak", "Envenomed Chub", "Spine Dace"), but the top entry is unchanged.

**Note:** The doc comment at line 24,229 says `Yugurt's Leviathan` in parentheses but the actual rank-20 `name` field still reads `"Yugurt's Dread"`. The comment is wrong; the data is right.

**The Fishing Rod multiplied.** The original described one rod (from SSJ loot). Live system has FOUR rod tiers (line 24,403–24,406), sold from a rod shop at YC:

| Rod | Tier | rodBonus | Price |
|-----|------|----------|-------|
| Fishing Rod | 0 | +0 | 20gp / free via coupon |
| River Rod +1 | 1 | +1 Catch | 75gp |
| Deep Rod +2 | 2 | +2 Catch | 200gp |
| Master Rod +3 | 3 | +3 Catch | 600gp |

The `rodBonus` field adds directly to the Catch Roll.

**Node topology is accurate.** BOO (`isFishingLake:true`, line 8,010) and SSJ (`npc:'The Fisherman'`, loot:`'Fishing Rod'`, `sleep:true`, `sleepCost:0`, line 8,014) match the report exactly.

**`pb.fish = true` / no node lock is live.** Line 32,571: `if (won && pb && !pb.corridor && !pb.stalk && !pb.fish) S_story.defeatedBattles[pb.nodeCode] = true;` — the fish flag is correct and present.

**Night fishing added (§XLVIII).** The original report had no concept of nocturnal species. Live code adds:
- `isNight` flag: `(S_story.hour || 12) >= 20 || <= 5`
- `NIGHT_FISH_POOL` (line 24,251): 5 nocturnal species (ranks 6, 8, 10, 12, 14): Murk Darter, Void Gulper, Lantern Eel, Shadowfin Carp, Deepwater Lurker
- Night pool takes priority over day pool when `isNight && _nightInTier.length`

**The Fisherman grew substantially.** The report described one NPC with one line of dialogue. Live system has:
- Full NPC profile at line 21,049 with neutral/friendly/dearFriend arcs tracking relationship progression
- EB_NPC_DIALOGUE pool entry at line 9,322 with worldTruth, multi-state dialogue, and a quote
- Three-state portrait at line 20,789: changes based on `shaleDropFound` → `hornedSharkSlain` → default
- 6 quest chains attached to his node (Emmer Finch arc, tournament chain, fishing guide arc)

**Lake magic items replaced simple weapon drops.** The original described `floor(0.1 × AC × maxHP)` XP/gold and implied combat loot. Live system has `LAKE_MAGIC_DB` (line 24,261–24,269): 8 named permanent passive items dropped at rank thresholds (minRank 11–20). These have no sell value and grant bonuses via `_lakeMagicBonuses()`. The fishing guide (line 24,381) still documents the weapon bonus formula `floor(fish AC / 4) + max(0, Luck Mod)`, but this applies inside `_rollMonsterWeaponDrop` for fish combat, not as the primary reward loop.

**Special encounters added beyond the 20-rank pool.** Three non-FISH_POOL fish exist in `MONSTER_POOL` for specific quest encounters:
- `horned_shark` (AC 15, HP 120, 2d8+8, deadly) — §XLVII, quest_horned_shark, `hornedSharkSlain` flag
- `night_03` (Lantern Eel, AC 12, HP 38, 2d8+3, medium) — §XLVIII, quest_night_eel, `lanternEelLanded` flag
- `cave_lurker` (AC 15, HP 88, 3d8+5, hard) — §XLIX, at node MJF (The Shale Drop), `shaleDropFound` flag

These three are accessed via specific quest conditions, not the standard Cast a Line path.

### What still applies

- **`isFishingLake:true` is the gate.** Only BOO (node 75) has this flag. No other node routes to `storyFishing()`. Any new fishing node requires this flag.
- **FISH_POOL ranks 1–20 are the canonical predator tier list.** Size mapping (ranks 1–4 small, 5–9 medium, 10–14 large, 15–19 very_large, 20 legendary) is the live architecture.
- **`pb.fish = true` prevents node lock.** This is load-bearing. Any new fish battle initiated via the fishing system must set this flag via `_startFishBattle()`.
- **Death saves active while fishing.** The Fisherman will not be surprised. This is correct and should be preserved for any fishing node.
- **The Fisherman's dialogue is calibrated.** He notices the shark. He notices what happened underground. He says nothing until the relationship has earned it. Don't add tutorial dialogue or explanatory text to this NPC.

---

## Report 2 — `lab-report-fishing-bait-prompting.md`
**Original scope:** §XII-Y PLANNED — Yugurt Lake bait sub-system, Luck stat, zone gating, BAIT_FISH_POOL, global monster drop nerf; prompt methodology analysis (2026-05-24)
**Still active:** Partially — Luck is live, zone structure is live, bait system implemented differently

### What the report said

**The directive as type system.** `index.md` defines a two-phase workflow: Phase 1 (Adding = Planning, write to `plan.md`, mark PLANNED, no HTML touch) and Phase 2 (Implementing = code + sync). This was the report's central subject alongside the mechanical system.

**BAIT_FISH_POOL — 20 freshwater species.** A separate constant, distinct from `MONSTER_POOL`, with 20 freshwater species across 5 tiers. Bait fish were ammunition: no counterattack, one-hit catch, XP on catch not kill. Species included Fathead Minnow (Tier 1, +1 bait bonus) through Blacknose Dace (Tier 5, +5 bait bonus).

**Three zones gated by tacklebox contents.** Shore (ranks 1–7, Tier 2 required), Reeds (ranks 8–14, Tier 2 in tacklebox), Deep (ranks 15–20, Tier 4 required). Zone access was tied to tacklebox inventory, not catch progress.

**The predator formula:** `predatorRank = clamp(2d20 + baitBonus + LuckMod, 1, 20)`. Bait bonus ranged +0 (bare hook) to +5 (Tier 5). A maximally-built character with Tier 5 bait averaged rank 29, clamped to 20.

**CON save condition stack by rank.** Ranks 8–10: Poisoned (DC 12). Ranks 11–13: Poisoned + Restrained (DC 14). Ranks 14–16: Poisoned + Blinded (DC 16). Ranks 17–19: Poisoned + Paralyzed (DC 18). Rank 20: all three + Cursed (DC 20, all saves at Disadvantage).

**Magic weapon drop formula.** `weaponMagicBonus = floor(fish.ac / 4) + max(0, LuckMod)`. Capped at +6.

**Global monster drop nerf.** `_rollMonsterWeaponDrop()`: change bonus range from `[0,+3]` to `[-3,0]`. Monster drops become degraded gear (Rusted −3, Chipped −2, Worn −1, Salvaged 0). Fishing becomes the only positive magic loot vector.

**Luck — seventh stat.** `Luck = ⌈(STR×DEX×CON×INT×WIS×CHA)^(1/6)⌉`. Derived read-only; geometric mean penalizes neglected stats. Applied at 7 fishing roll points. Starting scores (STR 16, DEX 12, CON 14, INT 10, WIS 12, CHA 8) yield Luck 12, Mod +1.

**Prompt methodology taxonomy.** Seven command types: increment trigger ("continue"), data dump, constraint declaration, formula definition, isolation directive, structural command, synthesis command. The report analyzed how the directive in `index.md` shapes prompt interpretation.

### Current HTML relevance

**Luck is fully live — formula matches exactly.** `_calcLuck()` (line 21,519): `Math.ceil(Math.pow(product, 1/6))`. `_luckMod()` (line 21,525): `Math.floor((_calcLuck() - 10) / 2)`. Applies at:

| Roll point | Line | Application |
|------------|------|-------------|
| Bait search DC | 26,830 | `dc = Math.max(4, (fishingBaitSatchel ? 8 : 10) - _luckMod())` |
| Bare hook catch | 26,865 | `catch:_luckMod()` on bare hook object |
| Type roll | 26,895 | `typeTotal = tDie + bait.type + _luckMod() + eelBonus + ...` |
| Death saves | 23,724 | `d20 = Math.ceil(Math.random() * 20) + _luckMod()` |
| Loot drop | 22,498 | `Math.min(99, Math.floor(Math.random() * 100) + Math.max(0, _luckMod()))` |
| Lake magic bonus | 21,507 | `bonus = base + lv * levelScale + lm * luckScale` |
| Character sheet | 33,048 | Displayed as `Luck [mod]` with "geometric mean of all stats — read-only" note |

The 7-point integration from the lab report is accurate; the formula is exactly as documented.

**BAIT_FISH_POOL was not implemented.** No 20-species bait mini-game exists in the HTML. Instead: `BAIT_TABLES` (line 24,334) — three zones (bank/reeds/shallows), 6 entries each, 18 named bait items total. Bait is found via a Survival check and added as `type:'bait'` inventory items. These are consumed on cast.

| Zone | Bait items (catch bonus / type bonus / special) |
|------|------------------------------------------------|
| bank | Lakebed Worm +1C, Void Grub +2C, Shore Beetle +1C, Yugurt Pebble +1T, Void-Touched Moss +2T, Lakebed Pincher ADV |
| reeds | Reed Cricket +1C, Yugurt Dragonfly +2C, Lakeshore Web +0, Voidcap Mushroom +3T, Wetland Root +1T, Lakebank Snail +1C |
| shallows | Yugurt Frog +1C, Live Needle Minnow +3C, Void Glow Fly +2C, Sunken Chip +1T, Lake Moss +1T, Void Bloom ↑SizeUp |

The bait items grant `catch` (affects Catch Roll) or `type` (affects Type Roll) bonuses, or `advantage:true` (roll Catch twice), or `sizeUp:true` (result bumps one size tier after resolution).

**Zone unlocks implemented differently.** `tackleboxZoneUnlocks: {shore:true, reeds:false, deep:false}` exists (line 21,197). But the unlock condition is catch-progress based, not tacklebox-contents based (line 26,810–26,811):
- Reeds unlock: after 1st catch (`_catchLog.length >= 1`)
- Deep unlock: after landing a large fish (`_catchLog.some(c => ['large','very_large','legendary'].includes(c.size))`)

The planned design (Tier 2 bait required for Reeds, Tier 4 for Deep) was replaced with a simpler progress gate that doesn't require inventory checking.

**BAIT_FISH_POOL predator formula not implemented.** `predatorRank = clamp(2d20 + baitBonus + LuckMod, 1, 20)` does not exist. The Catch/Type/Size system replaced it. Bait bonuses (`catch`, `type`) add to their respective d20 rolls; size tier determines rank range.

**CON save condition table not implemented.** Fish battles use standard D&D 5e combat. No rank-gated condition stack (Poisoned at rank 8+, Restrained at rank 11+, etc.) is in `storyFishing()` or `_startFishBattle()`. Fish combat is standard combat — the fish has stats and attacks; conditions depend on equipped gear, not fish rank.

**Global monster drop nerf not implemented.** `_rollMonsterWeaponDrop()` (line 22,533) exists but the `[-3, 0]` range change from the lab report was not applied. Monster drops still use the original bonus range. Fishing is the preferred loot path via LAKE_MAGIC_DB, but not the exclusive one by system nerf.

**LAKE_MAGIC_DB replaced the weapon drop formula.** Instead of `floor(fish.ac / 4) + max(0, LuckMod)` as a weapon bonus on each kill, the live system drops 8 named passive items from `LAKE_MAGIC_DB` (line 24,261) at rank/level thresholds. These items persist in inventory and apply `_lakeMagicBonuses()` as passive combat stats. The weapon drop formula still appears in `FISHING_GUIDE_TEXT` (line 24,381) as flavor text but the magic economy runs through LAKE_MAGIC_DB.

**The tackle box singleton (`S_story.tacklebox`) was not implemented.** No `tacklebox: { [slug]: count }` dict exists. Bait is tracked as regular inventory items with `type:'bait'` and `count` fields. `fishingBaitSatchel` (bool, line 21,197) is a special flag that reduces the bait search DC from 10 to 8 — a different mechanism than the tackle box quiver concept.

**The directive analysis is still accurate and load-bearing.** The two-phase workflow (Planning = `plan.md`; Implementing = code + sync) described in the report is still the live project governance model. The `index.md` directive block at the top of the project file enforces it. The prompt taxonomy (increment trigger, data dump, constraint declaration, formula definition, isolation directive, structural command, synthesis command) still describes the actual session structure. This is not implementation code — it is design methodology — and it has been stable since 2026-05-24.

**Substantial fishing content was added after both reports.** Systems present in the live HTML that neither report documented:

| Addition | Layer | Description |
|----------|-------|-------------|
| Night fishing | §XLVIII | `NIGHT_FISH_POOL`, `isNight` flag, night modal header, night type bonus |
| Eel Skin Pouch | §XLVIII | `eelSkinPouchActive`: +1 Type on all casts (from Lantern Eel quest reward) |
| Lake magic items | §DROP-03 | `LAKE_MAGIC_DB`: 8 passive items, level+luck scaling, catch/atk/ac/firstStrike effects |
| Emmer Finch arc | §GUIDE-01 | 6-quest apprentice arc at SSJ/BOO; U-curve WIS check; `emmerStage4a` completion flag |
| Tournament chain | §XLV | 6-quest tournament at YC; 6 opponents culminating in The Fisherman (bonus +8, stake 1500gp) |
| Fishing guide | — | Readable item unlocked at quest_fishing_guide; reveals zone DCs |
| Rod shop | — | 4-tier rod shop at YC; rods grant `rodBonus` to Catch Roll |
| Horned Shark | §XLVII | Special MONSTER_POOL entry; quest_horned_shark; apex predator at the Noon Point |
| Shale Drop | §XLIX | Node MJF below BOO; Cave Lurker encounter; Y. Gurt Field Survey readable |
| Yugurt Favour | — | `fishingYugurtFavour` bool: +1 Catch on all casts |
| Free rod coupon | — | Notice in Lubeck; tearable coupon; redeemable at SSJ |

### What still applies

- **The directive is the living governance protocol.** Phase 1 = `plan.md` section + PLANNED stubs. Phase 2 = HTML code + markdown sync. This has not changed and continues to apply to every session.
- **Luck is the fishing economy's central variable.** The 7-point integration (DC reduction, bare hook, type roll, death save, loot, lake magic, character sheet) is confirmed live. A character who invested across all six stats is luckier at Yugurt Lake. This is intentional and should be preserved.
- **Bait items use `catch` and `type` fields.** Any new bait item added to `BAIT_TABLES` needs both fields (0 is valid), plus `advantage` and `sizeUp` booleans. This is the live interface.
- **Zone unlock is progress-based, not inventory-based.** The tacklebox gating design from the report was not implemented. Don't add tacklebox inventory checks — zones unlock by catch count and fish size, which is simpler and requires no additional UI.
- **The prompt taxonomy is a live design tool.** If you find yourself in a session adding features to `roll2hit.com`, these command types are what you are doing: increment trigger, data dump, constraint declaration, formula definition, isolation directive, structural command, synthesis command. Name them. It clarifies the scope.

---

## Monsters & Fishing Summary — What Is Structurally True Right Now

**Yugurt Lake runs on a Catch/Type/Size system, not 2d20 range.** The live `storyFishing()` is a four-phase sequence: DEX cast check → Catch Roll (determines size) → Type Roll (determines rarity) → fish selection from size tier. The 2d20 range mechanic in the original lab report was an early design that was superseded before implementation.

**FISH_POOL (20 ranks) is live at line 24,229.** Names differ from the original report in ranks 3–19. Rank 1 (Needle Minnow) and Rank 20 (Yugurt's Dread) are unchanged. The doc comment at 24,229 says "Yugurt's Leviathan" but the `name` field says "Yugurt's Dread" — trust the data.

**BAIT_TABLES replaces BAIT_FISH_POOL.** 18 named bait items across 3 zones (bank/reeds/shallows), found via Survival checks, consumed on cast. No 20-species bait mini-game. Bait grants `catch`, `type`, `advantage`, or `sizeUp` modifiers.

**Luck is live and load-bearing.** `_calcLuck()` / `_luckMod()` apply at 7 distinct fishing roll points. Do not remove or bypass them. The geometric mean formula (6th root of the product of all six ability scores) is correct.

**Zone unlocks are catch-progress gates, not inventory gates.** Reeds after first catch; Deep after first large-tier fish. `tackleboxZoneUnlocks` state is live; unlock logic is in `storyFishing()` lines 26,810–26,811.

**Lake magic items (LAKE_MAGIC_DB, 8 entries) are the primary fishing reward.** Weapon drops still exist but LAKE_MAGIC_DB items apply persistent passive bonuses (AC, ATK, firstStrike, catch, nightType, allAbility) scaled by level and luckMod. These are the endgame fishing rewards.

**Night fishing is a real mechanic.** `NIGHT_FISH_POOL` (5 species, ranks 6–14) takes priority over the day pool during hours 20–5. The Bioluminescent Gland lake magic item adds a night type bonus. The Lantern Eel (night_03) is a quest target. Night fishing is a distinct play mode, not just flavor.

**Three special encounters exist outside the Cast a Line path.** Horned Shark (§XLVII, quest_horned_shark), Lantern Eel (§XLVIII, quest_night_eel), Cave Lurker (§XLIX, at node MJF below BOO). All three are story-gated encounters with flags (`hornedSharkSlain`, `lanternEelLanded`, `shaleDropFound`) that drive The Fisherman's three-state portrait.

**The Fisherman has a complete relationship arc.** Neutral → friendly (hornedSharkSlain) → dear friend (shaleDropFound). His NPC profile at line 21,049 has distinct dialogue at each level. The Emmer Finch 6-quest arc (quest_guide_01–06) and tournament chain (quest_tour_01–06) run through SSJ. The coupon from Lubeck is redeemable here. He is not a set-piece. He is the hub of the entire fishing economy.

---

*Synthesis Part 4 of 7 · Next: Part 5 — NPC & Narrative · 2026-06-16*
