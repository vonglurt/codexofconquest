<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — §KG Increment 3: The Corridor Quest Chain
### An 11-quest honor-central on-ramp anchored to the five St. Petersburg → Moscow NPCs
**Date:** 2026-07-08
**Project:** roll2hit.com — §KG low-level content band (L1→~L6)
**Scope:** Increment 3 of 3 — **the quests**. Eleven UQF-1.0 side quests + one small *generic, reusable* counter mechanic. No new nodes, monsters, or terrains (all shipped in Inc 2).
**Predecessors:** §KG-01 ✅ (Hunt Mode + `_monsterLevel`, `8168f0e`) · §KG Inc 2 ✅ (the zones, `65d65c0` + `dde78ca`).

> **Lab-report policy trigger:** *new narrative theme or arc — a quest chain spanning 3+ nodes, a new NPC arc.* This is the whole §KG story layer; it gets its own gate per the Inc 2 report's explicit hand-off ("Increment 3 is a separate lab-report-gated block").

---

## 1. CONCEPT

Inc 2 built the corridor as a place: five zones, six training-tier bots, five NPCs who each say one line. Inc 3 gives those five people something to *ask* — a chain of small, honorable jobs that walks a fresh Level-1 fighter east from the Nevsky Checkpoint to the dead station outside Moscow, and delivers them to the real game at roughly Level 6.

This is the **Birka technique, transplanted east** (`lab-report-birka-beginner-arc.md`): the arc does not gate the main quest, it runs *alongside* it. The player can skip every quest here — Free-Movement is absolute (plan.md §Free-Movement / §Mission-Gating: a `gate` defers a mission's *listing*, never a step). The band is *offered* to a low-level player via Hunt Mode + level-scaled pools; a Level-20 returner walks it in five minutes and is bored, which is fine.

What the chain adds over raw grinding is the same thing Birka adds: **names and a spine**. The spine is honor. Every job is framed as a *sanctioned bout* or an *honest delivery*, never a mugging — Volkov's cover story ("you fight who they match you against, nothing more"), Roshkova's drill ("a cadet who cannot lose cleanly cannot win cleanly"), Grimka's clean card ("no poison, no ganging — you lose, you lose standing up"), Iosif's chair, Lena's quiet line to Station 7. The reward for finishing is not the XP (the grinding gives that); it is that five people in a Soviet-cyberpunk steppe know your name by the time you reach the dark station.

The chain also **seeds the existing SVO / Station-7 thread** at its tail (Lena: *"the line to Station 7 runs quiet these days — something out there stopped answering"*), handing a now-capable player off to content that already exists.

---

## 2. THE FIVE ANCHORS — resolved `npc` keys (LOCKED)

A quest's `npc` field must resolve against the giver node per the audit rule (`wbapi-core.js` ~L797): `node.npc.toLowerCase().replace(/\s/g,'_') === q.npc`. The Inc-2 nodes carry npc **display names**, so the quest keys are the slugified forms — verified against live node data:

| Node | Label | `node.npc` (display) | **Quest `npc` key (locked)** | Role in the chain |
|------|-------|----------------------|------------------------------|-------------------|
| SPB | Nevsky Checkpoint | Recruiter Volkov | `recruiter_volkov` | Cover story / enlistment |
| KMS | Komsomol School | Commissar-Instructor Roshkova | `commissar-instructor_roshkova` | The drill (spar + lose cleanly) |
| ZVD | Gulag Gladiator Zavod | Pit-Master Grimka | `pit-master_grimka` | Honor duels (clean card) |
| FBR | The Skill Fabrika | Technician Iosif | `technician_iosif` | Jack-in deliveries + sim capstone |
| TVR | Rzhev Transit Waystation | Quartermaster Lena | `quartermaster_lena` | Resupply + road to Station 7 |

> Hyphens survive slugification (`replace(/\s/g,'_')` touches whitespace only): `commissar-instructor_roshkova`, `pit-master_grimka` are correct as written. **Verify each with `./api.sh advise <quest_id>` after authoring** — a mismatch surfaces as `npc "…" not found in BIRKA_NPC or NODE_MAP`.

---

## 3. THE CHAIN — 11 quests, W→E, honor-central (LOCKED)

Sequenced by `gate` (mission *listing*, never movement). Each quest lists at its `activateNode` once the prior link's flag/`questsDone` is satisfied. Types vary per the Inc-2 brief ("deliveries / talk / cull-3 / mini-boss"): **4 cull · 3 delivery · 2 mini-boss duel · 2 skill-check**.

| # | id | Node · NPC | Type | Completion (exact shape) | Gate | Reward (xp/gold + item) |
|---|-----|-----------|------|--------------------------|------|--------------------------|
| 1 | `quest_kg_01` | SPB · Volkov | cull | `countMin:[{path:'monsterKills.sparring_droid',min:3}]` | `{}` | 120 / 30 · **Guild Enlistment Papers** (mission_bit) → flag `kgEnlisted` |
| 2 | `quest_kg_02` | SPB · Volkov | delivery | `itemsAll:['Sealed Recruit Manifest'], atNode:'KMS'` | `{flags:['kgEnlisted']}` | 150 / 0 → flag `kgManifestDelivered` |
| 3 | `quest_kg_03` | KMS · Roshkova | cull | `countMin:[{path:'monsterKills.komsomol_cadet',min:4}]` | `{flags:['kgManifestDelivered']}` | 200 / 40 · **Red Star Pin** |
| 4 | `quest_kg_04` | KMS · Roshkova | skill_check | WIS/Insight **DC 10** ("lose cleanly") | `{questsDone:['quest_kg_03']}` | 180 / 0 → flag `kgFormsPassed` |
| 5 | `quest_kg_05` | ZVD · Grimka | mini-boss duel | `countMin:[{path:'monsterKills.gladiator_bot',min:1}]` | `{flags:['kgFormsPassed']}` | 250 / 50 · **Bout Token** → flag `kgFirstBout` |
| 6 | `quest_kg_06` | ZVD · Grimka | cull | `countMin:[{path:'monsterKills.gladiator_bot',min:3},{path:'monsterKills.zavod_sparbot',min:3}]` | `{questsDone:['quest_kg_05']}` | 300 / 60 · **Clean-Card Trophy** |
| 7 | `quest_kg_07` | ZVD · Grimka | delivery | `itemsAll:['Stripped Reactor Core'], atNode:'FBR'` | `{questsDone:['quest_kg_06']}` | 220 / 0 → flag `kgCoreDelivered` |
| 8 | `quest_kg_08` | FBR · Iosif | cull | `countMin:[{path:'monsterKills.fabrika_enforcer',min:3}]` | `{flags:['kgCoreDelivered']}` | 250 / 50 · **Cortex Shunt** |
| 9 | `quest_kg_09` | FBR · Iosif | mini-boss duel | `countMin:[{path:'monsterKills.trainer_bot_prime',min:1}]` | `{questsDone:['quest_kg_08']}` | 400 / 80 · **Prime Core** → flag `kgSimCleared` |
| 10 | `quest_kg_10` | TVR · Lena | delivery | `itemsAll:['Certified Skill-Chit'], atNode:'TVR'` | `{flags:['kgSimCleared']}` | 220 / 40 · **Field Ration** (heal consumable) |
| 11 | `quest_kg_11` | TVR · Lena | skill_check | INT/Investigation **DC 12** ("why the line went quiet") | `{questsDone:['quest_kg_10']}` | 500 / 100 → flag `kgCorridorCleared` |

**Delivery items** follow the established §MATH-01 pattern (memory: *collect-at-node = node.loot + itemsAll/atNode*):

- `kg_02` **Sealed Recruit Manifest** — set as **SPB `node.loot`** (picked up when the player is at SPB, where the quest activates), completed by carrying it to KMS. `atNode:'KMS'`.
- `kg_07` **Stripped Reactor Core** — granted on `kg_06` completion via `onComplete` `itemChain:[{action:'grant',…}]` (Grimka hands you the decommissioned core), completed at FBR. `atNode:'FBR'`.
- `kg_10` **Certified Skill-Chit** — granted on `kg_09` completion (Iosif certifies you), completed at TVR (the giver node = the delivery node; Lena stamps it). `atNode:'TVR'`.

> **Delivery-item note:** `itemsAll` completion checks the item is in inventory *at the node* — it does not consume it. Where the narrative wants the item "handed over," the `onComplete` narrative says so and a later `itemChain:[{action:'take',…}]` (or leaving it as a keepsake) is a per-quest call; default is keepsake (no consume), matching the low-friction beginner tone.

**Mini-boss duels reuse the Inc-2 node card battles.** ZVD's card battle is `{key:'gladiator_bot',count:1}` and FBR's is `{key:'trainer_bot_prime',count:1}` — winning a node card battle runs through the same battle-win handler (L24291) that increments the kill counter, so `kg_05`/`kg_09` complete off the card fight **or** off any wild encounter of that key. No new EPIC_BATTLES / `completion.battles` entries are needed (unlike the cat chain's `CQ_TAZ`) — the count-based completion is simpler and doubles as a Hunt-Mode grind path.

---

## 4. THE ONE NEW MECHANIC — a generic `monsterKills` counter (reusable)

The chain needs per-monster kill quotas. The **only** existing per-monster kill counter is `S_story.catKills`, incremented at **L24291-24292** and read by the killGoals HUD at **L29566** — both hard-coded to the Cat Quarter. Rather than clone a bespoke `zavodKills`/`kgKills` object (arc-specific coupling, the anti-pattern the drop/economy work kept fighting), introduce **one generic counter every arc can use**:

**(a) Increment — L24291 area (battle-win handler), add alongside the existing catKills line:**
```js
if (!S_story.monsterKills) S_story.monsterKills = {};
S_story.monsterKills[S.opp.key] = (S_story.monsterKills[S.opp.key] || 0) + 1;
```
Fires on **every** battle win (wild encounter, Hunt-Mode encounter, or node card battle), keyed by `S.opp.key`. `catKills` stays untouched (cat quests unchanged); `monsterKills` is a superset going forward.

**(b) Default — `_S_DEFAULTS()`:** add `monsterKills: {}` next to `catKills: {}` (L22294) so fresh loads and the save schema carry it (§STATE-INIT rule: `_S_DEFAULTS()` is the single source of truth).

**(c) killGoals HUD — L29566:** the live "Stray 2/5" progress chip currently reads `S_story.catKills`. Generalize to read the quest's declared counter, defaulting to `catKills` for back-compat:
```js
const counter = S_story[q.killCounter || 'catKills'] || {};
```
§KG quests set `killCounter:'monsterKills'` (+ `targetMonsterKeys`/`killGoals` mirrors of the `countMin` paths, exactly as the cat quests carry them) so the same HUD renders "Sparring Droid 2/3" for the corridor. Cat quests omit `killCounter` → unchanged.

**`completion.countMin` already reads arbitrary dotted paths** (`resolvePath('monsterKills.sparring_droid')`, per the QuestRuntime resolver used by `catKills.beefy_tom` etc.) — no completion-engine change; only the counter's existence, default, and the HUD read are new. **This is the entire mechanical footprint of Inc 3.**

*Non-goal for Inc 3 (explicitly deferred):* an NPC **favorability** layer (the Birka `npcFavorability` friendly/dear-friend shift). The audit only requires `npc` resolve to a node — the chain is complete without a favor system, and the five NPCs already carry signature lines. A favor pass can be a clean follow-up; folding it in now would break the "compact" scope the user set.

---

## 5. NPC VOICE — expanding the five anchors

Inc 2 gave each NPC one signature `NPC_DIALOGUE` line. Inc 3 does **not** require a full three-state dialogue tree (that's the deferred favor layer) — the quest `desc`/`hint`/`disposition`/`passText`/`failText` fields carry the voice, exactly as the cat and Birka chains do. Each quest's `disposition` is the NPC speaking in-character at hand-off; each `passText` is the honorable close. House style: concrete, present-tense, honor shown-not-told, ≤ the length of the cat-chain exemplars.

Representative dispositions (full text drafted at build, one per quest):

- **kg_01 · Volkov:** *"Three droids, clean. The Guild does not sign softness. You fight who we match you against — that is the honor of it, and you just earned your papers."*
- **kg_04 · Roshkova:** *"You lost the third form and you lost it *straight* — no excuse, no flinch. A cadet who cannot lose cleanly cannot win cleanly. The School corrects you. It does not judge you. Go east."*
- **kg_05 · Grimka:** *"These bots were gladiators before the Zavod stripped their reactors. We fight them with honor because they fought us with it. One bout down. No poison, no ganging. You lost nothing standing up."*
- **kg_09 · Iosif:** *"The regulator failed and the Trainer-Bot fought you at full — a sim overload, the chair writing faster than it reads. You held. Half the district is still in that chair. You walked out. Prime Core is yours."*
- **kg_11 · Lena:** *"You read it right — the line to Station 7 didn't break, it *stopped answering*. Something out there chose the quiet. Refill, resupply, and go see. You're not a recruit anymore; you're whatever the east makes."*

---

## 6. XP ECONOMY — tuned to land the player at ~L6 (5,500 cumulative)

`XP_LEVELS` (L23470): L6 = **5,500** cumulative. Battle XP = `AC·maxHP` per kill (Inc-1/Inc-2 metric). The chain is tuned so **quest-completion XP + the battle XP from the quotas** clears L6 with margin (over-kill from Hunt-Mode grinding is upside, never required):

- **Quest-completion XP** (sum of the reward column): 120+150+200+180+250+300+220+250+400+220+500 = **≈ 2,990 XP**.
- **Battle XP from the quotas** (per-kill AC·HP × quota):
  sparring_droid 3×45 = 135 · komsomol_cadet 4×96 = 384 · gladiator_bot ≥4×196 ≈ 784 (kg_05 ≥1 + kg_06 ≥3) · zavod_sparbot 3×130 = 390 · fabrika_enforcer 3×208 = 624 · trainer_bot_prime 1×390 = 390 → **≈ 2,707 XP**.
- **Total ≈ 5,697 XP** on the minimum path → just past L6, before any Hunt-Mode over-kill or the two skill-check quests' incidental fights. Gold ≈ 550 across the chain funds beginner gear.

If a smoke test shows the minimum path landing short of 5,500, the lever is the two capstone rewards (kg_09 400→450, kg_11 500→600) — cull quotas stay as authored so the *pacing* (not the arithmetic) drives level-up.

---

## 7. DATA-SHAPE SUMMARY (the lock)

| Artifact | Location | Count | Method |
|----------|----------|-------|--------|
| Quests | QUEST_DB (near the other side-quest blocks) | 11 | `./api.sh post quest` (nodes/quests are API-clean) + field PUTs; `_legacy_fn`-free (pure UQF descriptors) |
| Delivery item on node.loot | SPB `node.loot` | 1 | `./api.sh put node SPB loot=…` (or direct if the API can't express the loot object) |
| `monsterKills` increment | battle-win handler L24291 | 1 block | direct HTML edit (JS logic — server stopped first per Hazard #1) |
| `monsterKills` default | `_S_DEFAULTS()` L22294 | 1 field | direct HTML edit |
| killGoals HUD generalization | L29566 | 1 line | direct HTML edit |

**Skill-check quests (kg_04, kg_11):** authored as `type:'skill_check'` with a `bits:[{kind:'skill_check', stat, skill, dc, onPass:[…], onFail:[…]}]` descriptor array — pure UQF, no `_legacy_fn` (the sb_parley shape at L12278 is the reference, minus the legacy closure). `retryable:true` for a beginner-friendly ramp (the honor theme is "lose cleanly," not "lose permanently").

**No changes to:** monsters, terrains, nodes (beyond SPB.loot), the mover, the road net, Hunt Mode, `_monsterLevel`, or the completion engine.

---

## 8. BUILD ORDER (Increment 3)

1. **Restart WBAPI server** so it re-reads the current file (Hazard #1); confirm new PID **and** that a JS signature survives the first write (`grep -c _monsterLevel roll2hit-v3.html` before/after). Commit early; `/tmp` backup.
2. **Mechanic first (direct HTML, server stopped):** the `monsterKills` increment (L24291), the `_S_DEFAULTS` field (L22294), the killGoals HUD read (L29566). Parse-check (`node -e` inline-script extract). Restart server, re-verify signatures.
3. **SPB `node.loot`** = Sealed Recruit Manifest (via `./api.sh put node SPB …`, or direct if the loot object can't be expressed by the endpoint).
4. **`post quest` ×11** (kg_01…kg_11) with the exact shapes in §3; then `put` the prose fields (desc/hint/disposition/passText/failText — mind the **WBAPI newline-PUT hazard**: literal `\n` two-char escapes only, never JSON-string-literal form, per plan.md §RESUME + `patchStringField` fix).
5. **Wire the two `onComplete` `itemChain` grants** (kg_06 → Stripped Reactor Core, kg_09 → Certified Skill-Chit) and the mission-bit / flag writes.
6. **Audit each:** `./api.sh advise quest_kg_0X` — confirm `npc` resolves (no "not found" warning), `activateNode`/`waypointNode` in NODE_MAP, schema UQF-1.0. Fix any npc-key slug mismatch.
7. **Verify (real-game drive):** enlist at SPB → walk the corridor → confirm (a) each quest lists only after its gate flag/`questsDone`, (b) the `monsterKills` HUD chip renders "Sparring Droid 2/3", (c) node card battles at ZVD/FBR satisfy kg_05/kg_09, (d) deliveries complete at the right node, (e) the two skill checks roll and branch, (f) finishing the chain lands the player at ~L6. Screenshot the journal mid-chain.
8. **Docs sync (two-way, per the sync directive):** quest.md §KG (11 rows + the `monsterKills` note), a mechanics.md line for the generic counter, world.md/monsters.md cross-refs if the quota framing adds anything. Flip the plan.md §KG row Inc 3 `PLANNED`→`SHIPPED` with the commit + gate results.
9. **Test:** extend `tests/integration/kg-zones.test.js` (or a new `kg-quest-chain.test.js`) — the 11 quests exist + are UQF-1.0, npc keys resolve, the `gate` sequence unlocks in order, `monsterKills` increments + completes a `countMin` quest, a delivery completes at `atNode`, a skill_check pass/fail branches. Keep the WBAPI server **stopped** for the Playwright run (Test-Run Rule 2); read the summary line from a redirected file, not a piped tail (Rule 1).

---

## 9. INVARIANTS HONORED

- **Free-Movement:** every `gate` defers a mission's *listing*, never a step. No quest/flag/item is ever read by the mover. The corridor stays freely traversable; the chain is *offered*, not *walled*.
- **API-first:** quests via `./api.sh post quest` + field PUTs; only the JS counter mechanic + HUD (which the API can't express) goes in by hand, server-restart-guarded (Hazard #1).
- **Reuse over duplication (grep-before-building):** reused the Inc-2 node card battles for the two mini-bosses (no new EPIC_BATTLES), the existing `countMin` dotted-path resolver, the §MATH-01 node.loot delivery pattern, and the cat-chain killGoals HUD (generalized, not cloned). The `monsterKills` counter is the single new mechanic and it is *generic*, retiring the need for the next arc to invent its own.
- **UQF-only authoring:** all 11 quests are schema `UQF-1.0`, descriptor-array `bits`/`onComplete`, zero `_legacy_fn`. QuestRuntime is the sole execution surface (§ARCH-01).
- **State single-source-of-truth:** `monsterKills` added to `_S_DEFAULTS()` so fresh loads + saves carry it (§STATE-INIT).
- **No new jump travel, no mover changes, no new nodes/monsters/terrains.**
- **Compact scope preserved:** 11 quests (within the 10–12 brief), one tiny mechanic, favorability explicitly deferred.

---

*End of lab report. Implementation: §KG Increment 3 in plan.md — this is the gate; no HTML edit precedes it. Increment 3 closes the §KG feature.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
