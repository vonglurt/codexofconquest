<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — §KG Increment 2: The St. Petersburg → Moscow Corridor
### Low-level "kindergarten" zones — Soviet-cyberpunk cover story, honor-central
**Date:** 2026-07-08
**Project:** roll2hit.com — §KG low-level content band (L1→~L6)
**Scope:** Increment 2 of 3 — **the zones** (nodes + terrains + low-level monsters + NPC anchors). The ~10–12 quest chain is Increment 3.
**Predecessor:** §KG-01 ✅ (Hunt Mode + `_monsterLevel` metric, `8168f0e`).

> **Lab-report policy trigger:** new monster group + new terrain cluster + new narrative theme/arc + IEEE-format data-shape lock before HTML edits. All four apply.

---

## 1. CONCEPT

A fresh character starts at Birka (LHR/BK, cell `10,197`) with the seven-shard main quest immediately available and completely over their head at Level 1 — exactly as the Birka Roots arc (`lab-report-birka-beginner-arc.md`) intends. §KG adds a **second on-ramp running east**: a compact, honor-central band of Soviet-cyberpunk zones stretched along a St. Petersburg → Moscow corridor, paced so the low-level fighter can grind cleanly from L1 to ~L6 (5,500 cumulative XP; battle XP = AC·maxHP) with **Hunt Mode** (§KG-01) biasing encounters to their level.

The cover story is a lie the world tells the player, then peels back — same technique as Birka's "clear the vermin" opening over a three-hundred-year infrastructure failure. Here: a **Mercenary Guild Recruiter** at the St. Petersburg gate is signing up warm bodies for "honest work in the east." The honest work is the **Gulag Gladiator Zavod** (honor duels against decommissioned low-tier gladiator bots) and the **Skill Fabrika** (a cyberpunk jack-in "brain-download" trade school that pays in deliveries and fights). Soviet dressing throughout — **Commissar, Komsomol, Zavod** (Зaвoд, "factory/works").

The honor theme is the spine: every zone frames combat as a *sanctioned bout*, not a mugging. You do not kill vermin in an alley; you are *matched* against a sparring droid whose serial number is stencilled on its chestplate. The Zavod runs a clean fight (Weckmann's ethic, transplanted east). The point of the band is the same as Birka's: not XP, but a handful of names and a place that feels lived-in while you get strong enough for the real game.

**This is a second beginner ramp, not a gate.** Free-Movement is absolute (plan.md §Free-Movement): nothing here blocks a road. The corridor is *offered* to a low-level player via Hunt Mode + level-appropriate encounters; a Level-20 returner can walk it freely and be bored, which is fine.

---

## 2. GEOGRAPHY — the corridor (LOCKED coords, sea-checked at build)

Projection (from plan.md / `NODE_COORDS`): `col = 180 + °lon`, `row ≈ 69.75 − °lat`. Verified against live nodes: Birka/LHR `10,197`, Tallinn/TLL `10,204`, Moscow/SVO `14,217`, The Tungas/TGS `7,217`.

The band runs from the existing **TLL (The First Inn, `10,204`)** southeast to the existing **SVO (Station 7, `14,217`)** — a monotone SE diagonal so every leg is a clean 1-step-per-axis road. Five NEW nodes fill it:

| # | Code | Label | Cell (r,c) | Real analogue | Terrain key (`name`) | NPC anchor |
|---|------|-------|-----------|---------------|----------------------|------------|
| — | TLL | The First Inn *(exists)* | 10,204 | Tallinn | inn | Innkeeper Brynn |
| 1 | **SPB** | Nevsky Checkpoint | **10,210** | St. Petersburg 59.9N,30.3E | `soviet_checkpoint` | Recruiter Volkov |
| 2 | **KMS** | Komsomol School | **11,211** | Veliky Novgorod 58.5N,31.3E | `komsomol_school` | Commissar-Instructor Roshkova |
| 3 | **ZVD** | Gulag Gladiator Zavod | **12,213** | (steppe) | `gladiator_zavod` | Zavod Pit-Master Grimka |
| 4 | **FBR** | The Skill Fabrika | **13,215** | (steppe) | `skill_fabrika` | Fabrika Technician Iosif |
| 5 | **TVR** | Rzhev Transit Waystation | **13,216** | Tver 56.9N,35.9E | `soviet_transit` | Quartermaster Lena |
| — | SVO | Station 7 (Dark) *(exists)* | 14,217 | Moscow | station_7 | — |

> **⚠️ ROUTE DRIFT NOTE (2026-07-29, §DX-02e) — the corridor promise holds; the *cells* it runs on have moved.** `ROAD_RUNS` is **generated** (`scripts/build-roads.js`), and §DX-01a's `--apply` regen rerouted the **TLL→SPB** leg off the Gulf-of-Finland sea cell `10,207` (a `check:roads` R3 violation) onto the **row-8 corridor through TUO** — `10,204 → 9,204 → 8,204…8,210 → 9,210 → 10,210`. The old row-10/11 run was not re-laid, so four cells this report's original road-lay implied (`10,205`, `10,209`, `11,210`, `14,216`) are no longer road. **Re-measured live 2026-07-29:** the road-weighted router auto-travel uses (`_roadGridPathCore`) walks **all six legs entirely on road** — every intermediate cell of `TLL→SPB→KMS→ZVD→FBR→TVR→SVO` is a `ROAD_CELLS` member — so *"encounter-free travel between the zone nodes"* is still literally true. `kg-zones.test.js` used to pin the six hardcoded sample cells and had been red on four of them; it now asserts the **property** against the engine's own route, so a future re-lay can only turn it red by actually breaking the corridor. **Do not treat the cell ranges below as current** — they are the build-time lay, not the live net; render the window with `node scripts/render-region.js 8 16 195 220`.

**Road net (highways laid at build):** `TLL → SPB → KMS → ZVD → FBR → TVR → SVO`. Each leg via `./api.sh highway <a> <b> --execute`. Consequence of `_inferTerrain` (verified L27191): **road cells return `'road'` → encounter rate 0**, so travel *between* nodes is safe; an off-road empty cell adjacent to a zone node inherits that node's low terrain pool. The corridor is therefore uniformly low-level with zero extra per-cell terrain painting.

**Coords are provisional-pending-sea-check.** At build I POST each node, run `./api.sh reachability` (the walk-graph BFS from LHR — the authority per plan.md WBAPI Authoring Hazard #3), and if any node lands on sea/an island I shift it to the nearest land cell (±1) and re-verify. Target: reachability count rises by exactly 5 with no regressions (currently 413/413 with TGS). The Gulf-of-Finland stretch TLL→SPB is the sea-risk leg; the `highway --execute` road-lay carries land bridges where needed (same mechanism that routed TGS→SVO).

---

## 3. MONSTERS — the low-level "training" pool (mLevel 1–4)

Authored by **direct HTML edit in MONSTER_POOL** (L5252–6160) — `api.sh post monster` is BROKEN (writes malformed into the trophy map, `tier:NaN`; plan.md Hazard #2). Shape: `{ key, name, ac, hp, atk, dmgDie, dmgCount, dmgFlat, tier }`. Each also gets a **trophy-drop row** in the drops map (L5816+): `<key>:{ name, icon, sell }`.

`_monsterLevel` (§KG-01, verified this session): `score = AC + 0.35·HP + 1.5·avgHitDmg`, `avgHitDmg = dmgCount·(dmgDie+1)/2 + dmgFlat`, `mLevel = clamp(round((score−15)/7.2 + 1), 1, 20)`. Six new monsters, calibrated to a clean 1→4 ladder:

| key | name | ac | hp | atk | dmg | tier | **mLevel** | trophy (sell) |
|-----|------|----|----|-----|-----|------|-----------|---------------|
| `sparring_droid` | Sparring Droid | 9 | 5 | 1 | 1d4 | trivial | **1** | Cracked Servo (3) |
| `komsomol_cadet` | Komsomol Cadet | 12 | 8 | 3 | 1d6+1 | trivial | **2** | Red Kerchief (4) |
| `zavod_sparbot` | Zavod Spar-Bot | 13 | 10 | 3 | 1d6+2 | easy | **2** | Dented Plating (5) |
| `gladiator_bot` | Rusted Gladiator Bot | 14 | 14 | 4 | 1d6+2 | easy | **3** | Bent Gladius (7) |
| `fabrika_enforcer` | Fabrika Enforcer | 13 | 16 | 4 | 1d8+1 | easy | **3** | Cortex Shunt (8) |
| `trainer_bot_prime` | Malfunctioning Trainer-Bot | 15 | 26 | 5 | 2d6+1 | easy | **4** | Prime Core (12) |

Calibration check (worked, matches the table): Sparring Droid score 14.5→**1**; Komsomol Cadet 21.55→**2**; Zavod Spar-Bot 24.75→**2**; Gladiator Bot 27.15→**3**; Fabrika Enforcer 26.85→**3**; Trainer-Bot Prime 36.1→**4**. All ≤ the existing weakest cyberpunk monster (Techno-Thug, mLevel ~4) — this pool *is* the "training tier" §KG-01 flagged as missing.

Honor framing lives in the names and prose, not the stats: these are decommissioned/rusted/sparring units, matched bouts, not predators. `trainer_bot_prime` is the zone mini-boss (a training unit whose difficulty regulator has failed — "malfunctioning" = it fights at full).

---

## 4. TERRAINS — WORLD_DB entries (one per node)

Added to `WORLD_DB` (L6162+). Shape `<key>:{ label, icon, monsters:[P.…] }`. `name` on each node points here (node-creation-terrain-key rule: `name` = terrain key, `label` = display name).

```
soviet_checkpoint:{ label:'Nevsky Checkpoint', icon:'☭', monsters:[ P.sparring_droid, P.komsomol_cadet, P.commoner ] },
komsomol_school:  { label:'Komsomol School',   icon:'🎖', monsters:[ P.komsomol_cadet, P.sparring_droid, P.zavod_sparbot ] },
gladiator_zavod:  { label:'Gulag Gladiator Zavod', icon:'⚙', monsters:[ P.zavod_sparbot, P.gladiator_bot, P.trainer_bot_prime ] },
skill_fabrika:    { label:'The Skill Fabrika', icon:'🧠', monsters:[ P.fabrika_enforcer, P.gladiator_bot, P.trainer_bot_prime ] },
soviet_transit:   { label:'Rzhev Transit Waystation', icon:'🚉', monsters:[ P.komsomol_cadet, P.zavod_sparbot, P.commoner ] },
```

`P.commoner` (Rabid Monkey, mLevel 1) pads the two gentlest pools. Pools deepen west→east (checkpoint mLevel 1–2 → Fabrika 3–4) so the corridor itself is a difficulty ramp. Hunt Mode's 80% at-or-below-level bias (§KG-01) keeps a L1–2 player mostly on droids/cadets even at the Zavod, while the 20% full-pool draw still surfaces the occasional Trainer-Bot for a real fight.

Worldbuilder dropdown `<option>` rows (L3915/4426 area) get the five new terrains appended so the authoring tool can target them — cosmetic, non-load-bearing.

---

## 5. NODES — NODE_MAP entries + NPC anchors

Created via **`./api.sh post node`** (nodes are the one entity type the API handles cleanly; restart server first per Hazard #1). Each node: `{ num, code, name:<terrain key>, label, act:1, text, npc, battle, loot, sleep }`.

**Signature battles** (fixed encounter on the node card, like HKG's Android×2):
- **ZVD** — `battle:{ label:'Honor Duel — Rusted Gladiator Bot', key:'gladiator_bot', count:1 }` — the sanctioned first bout; the honor-duel framing of the whole Zavod.
- **FBR** — `battle:{ label:'Sim Overload — Malfunctioning Trainer-Bot', key:'trainer_bot_prime', count:1 }` — a jack-in gone wrong; the band's mLevel-4 capstone fight.
- **SPB / KMS / TVR** — `battle:null` (talk/hub nodes; encounters come from the terrain pool on adjacent off-road cells + Hunt Mode).

**NPC anchors — Increment 2 depth = name + one signature line** (NODE npc-quote map, L21591 pattern: `CODE:{ name, quote }`). Full dialogue trees + the favorability/quest arcs are **Increment 3** (each quest anchored to its NPC; audit enforces `npc`). The five anchors, honor-central Soviet-cyberpunk voice:

- **SPB · Recruiter Volkov** (Mercenary Guild) — the cover story. *"Guild pays in silver and skills, friend. Sign here. The east is honest work — you fight who they match you against, nothing more, nothing less. That's the honor of it."*
- **KMS · Commissar-Instructor Roshkova** (Komsomol School) — the drill. *"You arrive soft. The School does not judge soft — the School corrects it. Three forms, then you spar. A cadet who cannot lose cleanly cannot win cleanly."*
- **ZVD · Pit-Master Grimka** (Gulag Gladiator Zavod) — the clean fight (Weckmann-east). *"These bots were gladiators before the Zavod stripped their reactors. We fight them with honor because they fought us with it. Three duels. No poison, no ganging. You lose, you lose standing up."*
- **FBR · Technician Iosif** (Skill Fabrika) — the jack-in trade. *"Sit. The chair reads what you know and writes what you don't — slowly, and it costs. Half the district trained here. The other half is still in the chair. Don't be the other half."*
- **TVR · Quartermaster Lena** (Rzhev Waystation) — the road to Moscow. *"Last stop before the dead station. Refill, resupply, send your letters — the line to Station 7 runs quiet these days. Something out there stopped answering."* (Seeds the SVO/Station-7 thread that already exists.)

Node prose (the `text` field) follows the house style: concrete, present-tense, the Soviet-cyberpunk world stated as fact, the honor theme shown not told. Drafted at build, ≤ the length of the HKG/SVO exemplars.

---

## 6. DATA-SHAPE SUMMARY (the lock)

| Artifact | Location | Count | Method |
|----------|----------|-------|--------|
| Monsters | MONSTER_POOL L5252+ | 6 | direct HTML edit (post monster BROKEN) |
| Trophy drops | drops map L5816+ | 6 | direct HTML edit |
| Terrains | WORLD_DB L6162+ | 5 | direct HTML edit |
| WB dropdown options | L3915 / L4426 | 5×2 | direct HTML edit (cosmetic) |
| Nodes | NODE_MAP / NODE_COORDS | 5 | `./api.sh post node` (server restarted first) |
| Highways | ROAD net | 6 legs | `./api.sh highway --execute` |
| NPC quote lines | npc-quote map L21591+ | 5 | direct HTML edit |

**No new state fields, no new mechanics** — Increment 2 is pure content on existing systems (`_monsterLevel`, Hunt Mode, `_inferTerrain`, `_weightedMonsterPick`, node/terrain/road machinery all shipped). Increment 3 adds the UQF quest chain (and may add favorability entries) on top.

---

## 7. BUILD ORDER (Increment 2)

1. **Restart WBAPI server** so it re-reads the current file (Hazard #1); verify new PID + a CSS/JS signature survives the first write (`grep -c _monsterLevel roll2hit-v3.html`).
2. **Direct HTML edits** (server stopped or immediately re-verified after): 6 monsters + 6 trophy rows + 5 terrains + WB options + 5 NPC quote lines. Parse-check (`node -e` inline-script extract) after.
3. **`post node` ×5** (server up) → **`reachability`** after each (sea-check; shift to land if needed).
4. **`highway --execute` ×6** legs; rename any "The The …" double-article (Hazard #3).
5. **Verify:** reachability +5 (418/418 target), `check:invariants`, a real-game drive to a zone node confirming (a) low-level encounters fire from the new pools, (b) `_monsterLevel` reads 1–4, (c) Hunt Mode biases correctly, (d) node cards render NPC + prose. Screenshot the corridor on the map.
6. **Docs sync** (two-way, per the sync directive): monsters.md (new pool + mLevels), world.md/maps.md (terrains + corridor), a quest.md note that the §KG quest chain is Increment 3. Commit + `say` the subject line.
7. **Test:** extend `tests/integration/` with a §KG zone smoke (nodes exist + reachable, monsters at expected mLevels, terrain pools resolve). Increment 3's quest tests come later.

---

## 8. INVARIANTS HONORED

- **Free-Movement:** no node/quest/flag ever refuses a step; the corridor is *offered* (Hunt Mode + level-scaled pools), never *gated*. Signature battles are node-card encounters, not road blocks.
- **API-first:** nodes + highways via `./api.sh`; only the monster/terrain/NPC-prose data (which the API can't safely express — post monster broken, terrain/quote maps not endpoint-backed) goes in by hand, server-restart-guarded.
- **Node terrain-key rule:** every node `name` is a terrain key; `label` is the display name.
- **Grep-before-building:** reused the existing `commoner`/`station_7` low tier and the HKG/SVO cyberpunk anchors rather than duplicating; confirmed no pre-existing SPB/KMS/ZVD/FBR/TVR codes.
- **No new jump travel, no new state, no mover changes.**

---

*End of lab report. Implementation: §KG Increment 2 in plan.md. Increment 3 (quest chain) is a separate lab-report-gated block.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
