# Roll2Hit — The Shattered Codex: Document Index

**Project:** `roll2hit-v3.html` — single-file combat tracker + narrative RPG
**Status:** Layers 0–88 implemented · ~20,254 lines · 79 nodes · 378 monsters · 43 lab reports · FC01–FC08 ✅ · §RESEARCH-01 ✅ · §API-01+02 ✅ · SP4 ✅ · §DESIGN-02 ✅ · §DESIGN-03 ✅ · §DUNGEON-01 ✅ · §DUNGEON-02 ✅ · §XLIII ✅ · §XLIV ✅ · §XLV ✅ · §XLVI ✅ · §XLVII ✅ · §XLVIII ✅ · §XLIX ✅ · §L ✅
**Last updated:** 2026-05-27

### Doc Health Badge

| Metric | Value | Status |
|--------|-------|--------|
| HTML line count | ~20,254 | ✅ |
| Lab reports on disk | 43 | ✅ |
| Lab reports in index | 43 | ✅ |
| Node text rewrites (noir register) | 79 / 79 | ✅ YD (The Shale Drop) added Layer 87 |
| FC items pending | 0 (FC01–FC08 all ✅) | ✅ 2026-05-26 |
| Layers implemented | 0–88 | ✅ |
| Last sync pass | 2026-05-27 Layer 88 (§L — Fisherman three-state arc close + Weimar quest_wm_05 + Y. Gurt archive file) | ✅ |

> Update this table at the start of each session: recount lab reports with `ls lab-report-*.md | wc -l`, check HTML line count with `wc -l roll2hit-v3.html`, confirm FC item status.

---

## Project Directive

> Read this section at the start of every session.

**Adding = Planning.** Write a spec in `plan.md`. Assign a Layer number. Mark it `⚠️ PLANNED`. Do not touch `roll2hit-v3.html`.

**Implementing = Code + Sync.** Write JavaScript. Then sync every markdown doc that describes what changed. Both steps required.

**Two-Way Sync Rule.** Every item in the markdown docs traces back to `roll2hit-v3.html`. Everything in the HTML has a home doc. On each sync pass: verify world map consistency across `maps.md`, `story.md`, `world.md`.

**Lab Report Rule.** Write a `lab-report-<title>.md` for: major collections, multi-system redesigns, new narrative arcs (3+ nodes), pre-implementation design reviews, or session postmortems with non-obvious decisions. Do not write one for single-item additions or value corrections.

**Session Format.** One increment per "continue."

---

## The Game in One Paragraph

Roll2Hit is a single-file HTML application. It runs as a combat dice tracker (Battle Mode) and a 76-node narrative adventure game (Story Mode). The narrative game — *The Shattered Codex* — is a solo journey across 8 acts and 76 locations to collect 7 Codex Shards and seal the Void before Day 49. The player is a Level 1–20 Fighter Champion. Combat uses D&D 5e mechanics; story progression uses directional navigation across a node graph. MIT-licensed. No server. No build step.

---

## Document Index

### Core Reference

| File | Purpose | Status |
|------|---------|--------|
| `index.md` | This file — master index + cross-reference | ✅ Updated 2026-05-25 |
| `plan.md` | Implementation directive + constants ref + state fields (194) + pending FC items | ✅ Updated 2026-05-26 (~3,400 lines) |
| `mechanics-combat.md` | Battle Mode: combat flow, 1.5 AP economy, weapons, loot, leveling, defeat screens, save system | ✅ Split 2026-05-25 |
| `mechanics-economy.md` | Story Mode: vendor system, NPC favorability, EB, NG+, state fields, F4 function reference | ✅ Split 2026-05-25 |
| `combat.md` | Battle engine reference: initiative, overlay, Champion features, death saves, flee | ✅ §API-02 line-verified 2026-05-25 |
| `maps.md` | World map: 26×16 grid, 76 node codes + coordinates, N/E/S/W network, gate locks, corridors | ✅ Reviewed 2026-05-24 |
| `story.md` | Main quest narrative: 42 story nodes across 8 acts, 7 Epic NPC profiles, prologue, endings, NG+ | ✅ 76 nodes covered |
| `world.md` | DM manual: world history, 4 factions, 7 Epic NPC profiles, quest motivation, survival pressure | ✅ Reviewed 2026-05-24 |
| `monsters.md` | 370 monsters: stat blocks by tier and terrain pool, 20 EB bosses, fish pool | ✅ Verified 2026-05-24 |

### Story Arc Files

| File | Content | Intersection |
|------|---------|-------------|
| `story-flowchart.md` | Full story flowchart using two-letter node codes · arc overlays · intersection points ★ | All arcs |
| `story-arc-investigation.md` | §XVI Weimar Scholar Gate + §XVII Void Archaeology + §XXI Void Shaman chain | SQ · MT · CI |
| `story-arc-coastal.md` | §XIX Tilbury Harbor + §XX Visby Underground | DK · SF · GC |
| `story-arc-ngplus.md` | §XV NG+ Remembrance · Entry 42 · quest_ng_01/02/03 | CI · SQ · CO |
| `story-arc-npc-dialogues.md` | Birka Six NPC_DIALOGUES full transcript (120 quotes) · arc summary | CI · IN · TV · BA · CY |
| `story-arc-epic-battlegrounds.md` | Q52–Q71 EB quest-giver dialogue (5 fields × 20 entries) | 20 dead-end nodes |

### Content Files

| File | Content | Status |
|------|---------|--------|
| `froberger-journal-all-entries.txt` | All 41 Froberger journal entries verbatim | ✅ Verified 41/41 (2026-05-24) |
| `ux-first-battles.md` | First battles UX walkthrough, 10 UX fixes, wimper/flee flow | ✅ Accurate for L0–37 |
| `5thOrgan.html` | Standalone polyphonic pipe organ synthesizer (72 oscillators, Beethoven canon) | ✅ 2026-05-24 |

### Spec Documents *(historical — all implemented)*

| File | Scope |
|------|-------|
| `spec-engine.md` | Layers 0–20 narrative engine design — all marked IMPLEMENTED |
| `spec-corridors.md` | Layer 9 corridor system — all L9-A through L9-H ✅ |
| `spec-world.md` | WORLD_DB + MONSTER_POOL architecture — counts verified (66 terrains, 370 monsters) |
| `spec-combat.md` | Phase 0/2 combat arena spec — historical |
| `spec-migration.md` | Layers 0–8 IEEE migration report — all sections implemented |

---

## Lab Report Index (All 41 Reports)

### Architecture & Systems

| File | Layer(s) | Topic |
|------|---------|-------|
| `lab-report-architecture-full.md` | 0–45 | Complete IEEE function catalog — every function, all subsystems, flow charts |
| `lab-report-documentation-system-design.md` | — | Two-way sync architecture, plan.md purpose, task decomposition framework |
| `lab-report-sp4-documentation-sync-pass.md` | SP4 | SP4 sync pass — 20 PLANNED markers, 67 annotations, F4/F6 re-verification, FC01–FC08 archive |
| `lab-report-api-01-02-mechanics-combat-review.md` | §API-01+02 | IEEE API review: mechanics.md (36 points) + combat.md F6 drift (+163 to +3,115 lines) |
| `lab-report-plan-cleanup-world-builder-arc.md` | 48–77 | plan.md archaeology + arc from dice tracker to world builder |
| `lab-report-timeline-history-completed.md` | 0–45 | Complete layer-by-layer development timeline archive |
| `lab-report-prompt-migration-arena-to-prototype.md` | 0–13 | Arena → Prototype: specification gravity, Cooperative DM Principle |

### Combat & Mechanics

| File | Layer(s) | Topic |
|------|---------|-------|
| `lab-report-leveling-flashbang-condition-economy.md` | 18 | Level-up system, Flashbang, CONDITION_GOLD ×100, 0.5-action bonus phase |
| `lab-report-drop-rates-balance-and-health.md` | 12 | `reward = floor(0.1 × AC × maxHP)`, health economy, Cooperative DM Principle |
| `lab-report-loot-drop-weapon-economy.md` | 25 | Historical proposal — superseded by `_D100_TABLE`. Read for design context. |
| `lab-report-luck-seventh-stat.md` | 48 | §XIII Luck as seventh stat — d20 roll modifier, stat interaction |
| `lab-report-tattoo-progression-system.md` | 76 | §XLI Tattoo progression — character creation modal, HP tattoos, death persistence |
| `lab-report-kenickie-chronicle.md` | 75+77 | §XL Kenickie's black market + §XLII Chronicle System (careerStats/runStats) |

### World & Navigation

| File | Layer(s) | Topic |
|------|---------|-------|
| `lab-report-plan-cleanup-v13.md` | 9–13 | Spec archive Layers 9–13 — corridor, hunt, stalk, quest engine |
| `lab-report-plan-cleanup-v17.md` | 14–17 | Spec archive Layers 14–17 — conditions, shield, flee, 6 bug corrections |
| `lab-report-circuit-map-theory.md` | 9 | CS theory: sparse node mesh, junction concept, TSP framing, Hunt/Warp traces |
| `lab-report-battleground-circuit-path-quest.md` | 9–12 | Stalk mechanics, quest-coupled guaranteed encounters, XP methodology |
| `lab-report-epic-battlegrounds.md` | 39 | §0 20 EB dead-end nodes, `EB_NPC_DIALOGUE`, payment negotiation, return beats |

### Monsters & Fishing

| File | Layer(s) | Topic |
|------|---------|-------|
| `lab-report-fish-with-dnd.md` | 37 | Yugurt Lake — 20 rank fish, 2d20 cast roll, predator-as-combat design |
| `lab-report-fishing-bait-prompting.md` | 47 | §XII Fishing bait sub-system design — 5 bait tiers, biome zones, Luck integration |

### NPC & Narrative

| File | Layer(s) | Topic |
|------|---------|-------|
| `lab-report-birka-beginner-arc.md` | 41 | Birka Six NPCs, 7 quests, Rough Whiskey, Yael escort, pit fight |
| `lab-report-npc-dialogue-system.md` | 42 | 4-state dialogue system, `NPC_DIALOGUES` (6×4×5), `_missionComplete()` |
| `lab-report-friendships-with-magic.md` | 41–42 | Session postmortem — waypoint BFS highlight, Hunt Mode, EB negotiation |
| `lab-report-living-world.md` | 44 | World progression events, Gigault stall, NPC farewells, Act III desaturation |
| `lab-report-web-of-connections.md` | 45 | `FROBERGER_TRACES`, `NPC_CROSS_REFS` (17), Room 6, Yael patrol, cross-item triggers |
| `lab-report-ally-cat.md` | 44 | §IX Cat Quarter — 6-quest arc, Ally Cat hierarchy, Kenickie unlock |
| `lab-report-narrative-arcs-brynn-bruhns-yael.md` | 70+72+74 | §XXXV Brynn's Vigil + §XXXVII Bruhns CO scene + §XXXIX Yael Named Report |

### Quest Arcs

| File | Layer(s) | Topic |
|------|---------|-------|
| `lab-report-game-story-codex-of-conquest.md` | 40 | `FROBERGER_JOURNAL` (41 entries), curse arc, Pinker's Curse of Knowledge |
| `lab-report-endings-and-echoes.md` | 43 | Covenant ending system, curse score formula, epilogue scroll, NG+ state |
| `lab-report-ng-plus-remembrance.md` | 50 | §XV Entry 42, NPC_NG_MEMORY_LINES, quest_ng_01/02/03, priorQuestMinusOne |
| `lab-report-weimar-scholar-gate.md` | 51 | §XVI Scholar Gate — archive modal, tome items, Benedikt reading circle, First Researcher |
| `lab-report-void-archaeology.md` | 52 | §XVII Void Archaeology — 5 investigation sites, Constructor's Log, 4-author chain |
| `lab-report-tilbury-visby-arcs.md` | 54+55 | §XIX Tilbury Harbor + §XX Visby Underground — Rennau, Solvak, hollow_hands_guard |
| `lab-report-void-shaman.md` | 56 | §XXI Void Shaman "The Warden" — dual resolution, verb-tense mandate corruption |
| `lab-report-corelli-merchant.md` | 61 | §XXVI Corelli — 5-appearance wandering merchant, purchase-gated fav, last_cipher |
| `lab-report-quest-minus-one-world-creator.md` | 49 | §XIV Quest -1 — Level 21 undefined as invitation, World Creator Wizard |
| `lab-report-ceremonia-roll-skill-checks.md` | 79 | §DESIGN-03 Ceremonia Roll — `skill_check` quest type, `_rollCeremonia()`, Yael 5-act arc |
| `lab-report-dungeon-ten-themes.md` | 80 | §DUNGEON-01 — 10 dungeon themes, P1–P3+ tiers, Node MM, Tribble counter, Madness Table, voidFluxActive, Prior Carrier, Codex Core ending compat |
| `lab-report-la-riva-grief-arc.md` | 78 | §GR Grief Arc — La Riva / Fishmonger's Row, Connie/Aldo/Vinnie, corruption-grief chain, distributed grief subplot map |

### Writing & Design Philosophy

| File | Topic |
|------|-------|
| `lab-report-story-codoex-curse-of-knowedge.md` | Pinker framework — writing guide for terrain descriptions and NPC dialogue |
| `lab-report-Polyphonic-Organ-Synth.md` | `5thOrgan.html` — IIR biquad filter, ADSR, Beethoven canon construction, Web Audio API |
| `lab-report-ponies-unicorns-aspirations-future-ideas.md` | Future aspirations — DM's Companion Guide, Fishing Guide, Mission Explorer |
| `lab-report-meta-process-loop-expansion.md` | Meta-process — prompt→plan→lab-report recursive loop, 10 historical instances, session efficiency |

---

## Reverse Lookup — Keywords to Files

> Find any topic and the files that elaborate it. Every file has at least one inbound reference.

| Keyword / Topic | Primary File | Elaboration |
|----------------|-------------|-------------|
| **Action economy (1.5 AP)** | `mechanics-combat.md` | `lab-report-plan-cleanup-v17.md` |
| **Ability scores** | `mechanics-combat.md` | `plan.md §III` |
| **ASI table (d6)** | `mechanics-combat.md` | `plan.md §II` |
| **Antecedent / cage** | `story-arc-investigation.md` | `lab-report-void-archaeology.md` · `lab-report-void-shaman.md` |
| **Archive modal (Weimar)** | `story-arc-investigation.md` | `lab-report-weimar-scholar-gate.md` |
| **Benedikt Rasp** | `story-arc-investigation.md` | `lab-report-weimar-scholar-gate.md` · `lab-report-void-archaeology.md` |
| **Battle Mode engine** | `combat.md` | `lab-report-architecture-full.md` · `spec-combat.md` |
| **BFS pathfinding** | `maps.md` | `lab-report-circuit-map-theory.md` · `lab-report-battleground-circuit-path-quest.md` |
| **Birka Six NPCs** | `world.md` | `lab-report-birka-beginner-arc.md` · `story-arc-npc-dialogues.md` |
| **Brynn Clerambault** | `story-arc-npc-dialogues.md` | `lab-report-narrative-arcs-brynn-bruhns-yael.md` · `lab-report-living-world.md` |
| **Bruhns CO scene** | `story.md` | `lab-report-narrative-arcs-brynn-bruhns-yael.md` |
| **Career/run stats (Chronicle)** | `lab-report-kenickie-chronicle.md` | `plan.md §III (careerStats/runStats)` |
| **Cat Quarter / Ally Cat** | `story.md` | `lab-report-ally-cat.md` |
| **Codex Shards (7)** | `story.md` | `lab-report-game-story-codex-of-conquest.md` |
| **Conditions / CONDITION_GOLD** | `mechanics-combat.md` | `combat.md` · `lab-report-leveling-flashbang-condition-economy.md` |
| **Constructor's Log** | `story-arc-investigation.md` | `lab-report-void-archaeology.md` · `lab-report-void-shaman.md` |
| **Cooperative DM Principle** | `lab-report-drop-rates-balance-and-health.md` | `lab-report-prompt-migration-arena-to-prototype.md` |
| **Corelli merchant** | `story.md §XXVI stub` | `lab-report-corelli-merchant.md` · `story-arc-coastal.md` |
| **Corridor system** | `maps.md` | `spec-corridors.md` · `lab-report-circuit-map-theory.md` |
| **Curse score / Covenant Standing** | `story.md` | `lab-report-endings-and-echoes.md` · `lab-report-architecture-full.md` |
| **Daggers (offhand)** | `mechanics-combat.md` | `plan.md §II` |
| **Death saves** | `combat.md` | `lab-report-plan-cleanup-v17.md` |
| **defi_land cluster (DF/HM/GL)** | `maps.md` · `world.md` | `story-flowchart.md` |
| **Drop rates / reward formula** | `mechanics-combat.md` | `lab-report-drop-rates-balance-and-health.md` |
| **Entry 42** | `story-arc-ngplus.md` | `lab-report-ng-plus-remembrance.md` · `lab-report-void-archaeology.md` |
| **Epic Battlegrounds** | `story-arc-epic-battlegrounds.md` | `lab-report-epic-battlegrounds.md` · `story-flowchart.md` |
| **Endings / epilogue** | `story.md` | `lab-report-endings-and-echoes.md` |
| **Fighter Champion features** | `mechanics-combat.md` | `plan.md §II (FIGHTER_FEATURES)` |
| **First Researcher (Marta Eilene Vass)** | `story-arc-investigation.md` | `lab-report-weimar-scholar-gate.md` · `lab-report-void-archaeology.md` |
| **Fishing / Yugurt Lake** | `monsters.md` | `lab-report-fish-with-dnd.md` · `lab-report-fishing-bait-prompting.md` · `maps.md` |
| **Froberger journal (41 entries)** | `froberger-journal-all-entries.txt` | `lab-report-game-story-codex-of-conquest.md` · `story.md §PROLOGUE` |
| **Froberger traces** | `world.md` | `lab-report-web-of-connections.md` |
| **Gate locks (4 passages)** | `maps.md` · `story.md §Gate Locks` | `plan.md §II (GATE_LOCKS)` |
| **Hollow Hands sub-clan** | `story-arc-coastal.md` | `lab-report-tilbury-visby-arcs.md` · `lab-report-void-shaman.md` |
| **Hunt Mode / stalk** | `mechanics-combat.md` | `lab-report-battleground-circuit-path-quest.md` · `lab-report-friendships-with-magic.md` |
| **Inn Dreams** | `story.md §XXIII stub` | `lab-report-void-archaeology.md §H` |
| **Investigation chain arc** | `story-arc-investigation.md` | `story-flowchart.md` |
| **Isolde Voss (Archivist)** | `story-arc-investigation.md` | `lab-report-weimar-scholar-gate.md` |
| **Kenickie's market** | `lab-report-kenickie-chronicle.md` | `lab-report-ally-cat.md` |
| **Lab report policy** | `index.md` · `plan.md §I` | `lab-report-documentation-system-design.md` |
| **Level-up system** | `mechanics-combat.md` | `lab-report-leveling-flashbang-condition-economy.md` · `lab-report-architecture-full.md` |
| **Luck stat** | `mechanics-combat.md` | `lab-report-luck-seventh-stat.md` · `lab-report-fishing-bait-prompting.md` |
| **MIT License / Quest -1** | `story.md §XIV` | `lab-report-quest-minus-one-world-creator.md` |
| **Monster pool (370)** | `monsters.md` | `plan.md §II (MONSTER_POOL)` · `spec-world.md` |
| **Mordus (Warlord)** | `story.md` · `world.md` | `lab-report-tilbury-visby-arcs.md` |
| **MT Mountain Pass** | `maps.md` · `story-flowchart.md` | `story-arc-investigation.md` (§XVII + §XXI intersection) |
| **NPC cross-references** | `world.md` | `lab-report-web-of-connections.md` |
| **NPC dialogue system** | `story-arc-npc-dialogues.md` | `lab-report-npc-dialogue-system.md` · `lab-report-birka-beginner-arc.md` |
| **NPC favorability** | `world.md` | `lab-report-birka-beginner-arc.md` · `plan.md §III` |
| **NG+ system** | `story-arc-ngplus.md` | `lab-report-ng-plus-remembrance.md` · `lab-report-endings-and-echoes.md` |
| **Node map (76 nodes)** | `maps.md` | `plan.md §II (NODE_MAP)` · `story-flowchart.md` |
| **Pachelbel / Deacon** | `story-arc-npc-dialogues.md` | `lab-report-web-of-connections.md` |
| **Pit training / Weckmann** | `world.md` | `lab-report-birka-beginner-arc.md` · `lab-report-kenickie-chronicle.md` |
| **Polyphonic organ** | `5thOrgan.html` | `lab-report-Polyphonic-Organ-Synth.md` |
| **Potions (4 tiers)** | `mechanics-economy.md` | `plan.md §II (POTION_TIERS)` |
| **Quill / Couperin** | `story-arc-npc-dialogues.md` | `lab-report-web-of-connections.md` |
| **Quest -1 (Level 21)** | `story.md §XIV` | `lab-report-quest-minus-one-world-creator.md` |
| **Quest system** | `world.md` | `plan.md §II (QUEST_DB)` · `lab-report-architecture-full.md` |
| **Reward formula** | `mechanics-combat.md` | `lab-report-drop-rates-balance-and-health.md` |
| **Room 6 (joint NPC moment)** | `world.md` | `lab-report-web-of-connections.md` |
| **Save / load system** | `mechanics-combat.md` | `lab-report-architecture-full.md` · `plan.md §III` |
| **Shard origin stories** | `story.md §XXII stub` | `lab-report-void-archaeology.md` (shard notes table) |
| **Shields (6 tiers)** | `mechanics-combat.md` | `plan.md §II (SHIELD_ITEMS)` |
| **Specification gravity** | `lab-report-prompt-migration-arena-to-prototype.md` | `lab-report-documentation-system-design.md` |
| **State fields (194)** | `plan.md §III` | `lab-report-architecture-full.md` |
| **Story arc split** | `story-flowchart.md` | All `story-arc-*.md` files |
| **Sweelinck / endings** | `story.md` | `lab-report-endings-and-echoes.md` · `lab-report-npc-dialogue-system.md` |
| **Tattoos** | `lab-report-tattoo-progression-system.md` | `plan.md §III (S_story.tattoos)` |
| **Tilbury Harbor Arc** | `story-arc-coastal.md` | `lab-report-tilbury-visby-arcs.md` |
| **Tomes (item type)** | `story-arc-investigation.md` | `lab-report-weimar-scholar-gate.md` |
| **Void Archaeology** | `story-arc-investigation.md` | `lab-report-void-archaeology.md` |
| **Void pressure / Void Tide** | `mechanics-combat.md` | `plan.md §III (voidPressure)` · `lab-report-architecture-full.md` |
| **Void Shaman / The Warden** | `story-arc-investigation.md` | `lab-report-void-shaman.md` |
| **Visby Underground** | `story-arc-coastal.md` | `lab-report-tilbury-visby-arcs.md` |
| **Weapons (70 types)** | `mechanics-combat.md` | `plan.md §II (WEAPON_ITEMS)` |
| **Weimar Scholar Gate** | `story-arc-investigation.md` | `lab-report-weimar-scholar-gate.md` |
| **World builder arc** | `lab-report-plan-cleanup-world-builder-arc.md` | `lab-report-quest-minus-one-world-creator.md` |
| **World progression events** | `world.md` | `lab-report-living-world.md` |
| **XP / leveling** | `mechanics-combat.md` | `plan.md §II (XP_LEVELS)` · `lab-report-leveling-flashbang-condition-economy.md` |
| **Yael Scheidemann** | `story-arc-npc-dialogues.md` | `lab-report-narrative-arcs-brynn-bruhns-yael.md` · `lab-report-web-of-connections.md` |
| **Yugurt Lake / fishing** | `monsters.md` · `maps.md` | `lab-report-fish-with-dnd.md` |

---

## Town Cross-Reference

| Town | Two-letter hub | Act | Inn | Key quest nodes | Epic NPC |
|------|---------------|-----|-----|-----------------|----------|
| **Birka** | BI | I + VIII | IN | CI · SL · CQ · TV · BA · CR · CY | Commander Bruhns |
| **Tilbury** | TL | II | SF | DK · MQ · MS · AL | Magistra Muffat |
| **Visby** | VS | V | IS / PC | SE · BK · GC · MC · CA · VC | Warlord Mordus |
| **Weimar** | WM | VI | SQ | BQ · OU → GA · AR · MT | Archivus Sweelinck |

> See `story-flowchart.md` for full node-to-node movement graph and arc overlays.

---

## Known Cross-Document Issues

All previously logged conflicts resolved. Current known gaps:

| Gap | Files | Action |
|-----|-------|--------|
| index.md status line was "Layers 0–45" | `index.md` | ✅ Fixed 2026-05-25 |
| story.md EB dialogs and NPC dialogs were inline (2660 lines) | `story.md` | ✅ Extracted to `story-arc-*.md` files 2026-05-25 |
| Lab reports for Layers 48–77 missing from index | `index.md` | ✅ All 36 indexed 2026-05-25 |
| Reverse lookup table missing | `index.md` | ✅ Added 2026-05-25 |
| story-flowchart.md did not exist | — | ✅ Created 2026-05-25 |
| FC01–FC05 documentation queue | `plan.md §V-B` | ✅ All complete 2026-05-25 |
| F4 table line numbers all stale (+749–3119 drift) | `mechanics-economy.md` | ✅ All 26 entries corrected 2026-05-26 (SP4) |
| 8 HTML consts missing home docs (romance system, BRYNN_MAINTENANCE_TASKS, etc.) | `mechanics-economy.md` · `world.md` · `story.md` | ✅ Reverse-scan pass SP4 2026-05-26 |
| State fields count "107" stale; plan.md description "230 lines" stale | `index.md` | ✅ Fixed 2026-05-26 (SP4) |
| 20 stale ⚠️ PLANNED markers (Layers 46–74) in world.md + story.md | `world.md` · `story.md` | ✅ All cleared 2026-05-26 (SP4 stale-PLANNED scan) |
| 67 HTML public consts had no `// → doc:` pointer (27 → 94 total) | `roll2hit-v3.html` | ✅ Full reverse scan complete 2026-05-26 (SP4) |
| F4 table re-drifted (+9–53 lines) after SP4 annotation pass | `mechanics-economy.md` | ✅ All 29 entries re-verified 2026-05-26 |
| `surveyDeliveredToAuros` flag name wrong in world.md §Blue Shutters Archive | `world.md` | ✅ Corrected to `undercitySurveyDelivered` 2026-05-26 |
| 5 `// → doc:` annotations pointed to non-existent section names (§Inn Sleep, §Gate Locks, §Quiet Return, §Act III NPC Lines, §Sweelinck Naming Ceremony) | `roll2hit-v3.html` · `story.md` | ✅ All fixed 2026-05-26 — annotations corrected; `#### Gate Locks` section added to story.md |

---

*Last updated: 2026-05-26*
*Codebase: `roll2hit-v3.html` · ~19,577 lines · Layers 0–81 complete · 78 nodes · 370 monsters · 43 lab reports*
*MIT License — roll2hit.com — Copyright (c) 2026 — Free to use, modify, and share.*
