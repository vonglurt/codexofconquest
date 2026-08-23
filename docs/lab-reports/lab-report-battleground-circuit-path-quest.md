<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Battleground Architecture, Circuit Corridors, and Quest-Coupled Terrain

**Lab Report — IEEE Style · CodexOfConquest: The Shattered Codex (`play.html`)**
**Original date:** 2026-05-21 · **Classification:** Design Methodology / Game Systems Architecture
**Verification pass:** 2026-08-11 (§DOC-02c) — every claim re-measured against HEAD.

> **HISTORY DOCUMENT.** This is the design record as believed on 2026-05-21, not a description of
> the current engine. Claims that did not ship, or that shipped and were later removed, are marked
> **NOT SHIPPED** / **RETIRED** and **kept** — a silently deleted claim reads like one that held.
> Its node codes are the retired 26×16 space; per §AUDIT-03m, `docs/lab-reports/` is HISTORY —
> **annotate, never rewrite**. Treat no code listing below as live source.

---

## Abstract

The report proposed a structural fix for the "lost in a field" problem: make *"where do I find
enemy X"* a lookup rather than a search. Three components carried the thesis — `HUNTING_GROUNDS`
(a bijective terrain→node table), **Layer 9 Circuit Corridors** (a wire-mesh of the node graph with
per-edge terrain and a Hunt/Warp travel dialog), and the **Stalk** mechanic (a guaranteed encounter
at a battleground node, weighted 3× toward active-quest targets).

**Verification result: this is the first report in the §DOC-02 program to fail as a description of
the engine.** Of **38** named symbols it specifies, **16 resolve at HEAD and 22 do not** — 42%
survival, against the 91% measured for the whole-file architectural review (§DOC-02b). All three
named components are gone: `HUNTING_GROUNDS` and Stalk were deleted by **§TIMELESS-01** (`7952752`,
2026-06-26), and the entire corridor layer by **§WALK/§NAV-01**. Of the **49** node codes it
tabulates, **none resolve correctly**, and one (`CI`) is worse than dead — it resolves to a
*different* live node. What survived is the substrate the thesis was built on, not the thesis:
`WORLD_DB`'s `{label, icon, monsters}` shape is byte-exact, the five-tier vocabulary is now a
CI-pinned contract, and the battle pipeline the Stalk path fed still runs.

**Keywords:** battleground design, encounter architecture, quest coupling, terrain classification,
design-record verification

---

## I. Method

Four measurements, all from HEAD (`play.html`, 38,707 lines, coc-3.104.0):

1. **Symbol census.** Every function, constant, field and DOM id the report names, batched through
   one `grep -c` loop. This partitions the report before a line of it is read (§DOC-02 accelerator 3).
2. **Node-code resolution.** All 49 codes in Appendix A + §III-C tested against live `NODE_MAP` keys.
3. **Formula re-read.** Each arithmetic claim read at its live definition, not from the report.
4. **History probe.** For symbols absent at HEAD, `git log -S` to distinguish *removed later* from
   *never existed* — the distinction the report cannot make about itself.

---

## II. As-Built Inventory — What Survives

| Claim | Status at HEAD | Anchor |
|---|---|---|
| `WORLD_DB` flat object keyed by terrain string, fields `{label, icon, monsters}` | **exact, unchanged** | `const WORLD_DB@6279` |
| `monsters` arrays hold **direct object references**, no string lookup at encounter time | **exact** (via the `P` proxy) | `const WORLD_DB@6279` |
| `NODE_MAP` flat, keyed by code; `name` is the terrain key linking node→`WORLD_DB` | **exact** — the one load-bearing link that held | `const NODE_MAP@8425` |
| `NodeEntry` fields `num` · `code` · `name` · `label` · `act` · `text` · `npc` · `battle` · `loot` · `sleep` | **all 10 present** | `const NODE_MAP@8425` |
| Five tier values `trivial\|easy\|medium\|hard\|deadly` | **exact** — now a pinned contract (§DX-02g) | `function _notorietyWeights@38212` |
| `_weightedMonsterPick` | **name survives; signature and body both replaced** — see §III | `function _weightedMonsterPick@38237` |
| `S_story.quests` as a key→status map | **exact** | — |
| Battle pipeline `loadWorldMonster` → `pendingBattle` → prebattle overlay → `storyApplyOutcome` | **live**, though entered from `_startStoryBattle` | `function _startStoryBattle@38259` |
| `MONSTER_POOL`, `QUEST_DB`, `storyRender`, `storyPreBattle`, `_renderPreBatt`, `storyGameOver` | **live** | — |

**Live: 16 of 38.**

---

## III. Spec → Shipped Delta Table

Twelve deltas. Each is **NOT SHIPPED** (never existed), **RETIRED** (shipped, later removed), or
**CHANGED** (survived under altered contract).

| # | Report claim | Outcome | Measured at HEAD |
|---|---|---|---|
| 1 | **`HUNTING_GROUNDS`** — bijective 42-terrain→42-node table; "the architectural backbone" | **RETIRED** | Deleted by §TIMELESS-01 (`7952752`, 2026-06-26). One tombstone comment remains: `§TIMELESS-01: HUNTING_GROUNDS removed@10392`. **Nothing replaced it** — see §V-2. |
| 2 | **Stalk mechanic** — `stalkModal(node)` + `_stalkedMonsterPick` + `[Wait for Prey]`, guaranteed encounter, 3× quest-target boost | **RETIRED** | `§TIMELESS-01: Stalk Helpers@38269`. **But the §IX-C code listing never existed as written**: `git log -S` returns **0 commits** for `stalkModal`, `#story-stalk-overlay`, `#stalk-terrain-name`. The feature shipped 2026-05-24 (`32c10c5`) under different names — `storyStalk(nodeCode)`, `#story-stalk-modal`, `#btn-stalk-wait`. §TIMELESS-01's own removal inventory records that modal as *"already never shown — legacy/dead."* |
| 3 | **Layer 9 Circuit Corridors** — `CORRIDOR_CELLS`, `CORRIDOR_TERRAIN`, `buildCorridorMap()`, `_routeSegments()`, `storyCorridorTravel()`, `_wireGlyph()`, `_corridorOnComplete` | **RETIRED — all 7** | `grep -c` = **0** for every one. Replaced by §WALK/§NAV-01: a 90×360 geo grid with cell-by-cell `Mover` movement and a real road net, `const ROAD_RUNS@9883`. The box-drawing wire mesh of Appendix C has no successor. |
| 4 | **Warp travel mode** — "instant transit, no encounter" (§III-E table) | **RETIRED, then forbidden** | Hard invariant #3 is now **"No jump travel, ever"**; the engine states it in source: `no jump travel. checkpointNode@26048`. The report's Warp is not merely removed — it is a **banned design**. |
| 5 | **Junction nodes J1–J7** with `junction:true`, "purely navigational waypoints" | **RETIRED, then made a CI failure** | **0** nodes carry `junction:true`. The two survivors of the class (J14/J15) failed `check:invariants` I1/I2 and were removed by §DX-01a; `./api.sh highway --execute`, which minted them, is **deprecated and refused** (§DX-01d). *(The two live `junction` string hits are a `TERRAIN_ENCOUNTER_RATE` key and an NPC key — not the node field.)* |
| 6 | **`N`/`S`/`E`/`W` directional edge fields** on `NodeEntry` — the directed edge set the wire mesh was drawn from | **RETIRED** | **0** occurrences in `NODE_MAP`. §WALK deleted the compass graph outright. The corridor layer had no graph left to render even had it survived. |
| 7 | **Quest-to-terrain coupling** — `targetTerrain`, `targetKeys`, `killCount`, `key`, `name` on `QuestEntry` (§V) | **NOT SHIPPED** | `targetTerrain` and `targetKeys` occur **0** times, at HEAD and in history. Quests are **UQF-1.0** (§ARCH-01): `id` · `schema` · `bits` · `gate` · `activateNode`. **The closed information loop of §V-A — the report's Principle 3 — has no data to run on and never did.** |
| 8 | **Tier weights** fixed at `{trivial:35, easy:35, medium:25, hard:4, deadly:1}`; the ~32/32/23/4/1 distribution of §VII-D and Appendix B | **CHANGED** | Weights are now **notoriety-scaled across 6 bands** (Layer 23), `function _notorietyWeights@38212`. The report's fixed vector matches **no band** — the lowest is `40/35/20/4/1`. At high notoriety `trivial` reaches **0** and `deadly` **30**. Appendix B's fixed distribution is wrong everywhere. |
| 9 | **`Math.random()`** in both pickers; "Stalk does not call `Math.random()`" as a design property | **CHANGED** | Both draws moved to the **seeded stream** `_seededNext()` (§VM-01-B) — now hard invariant #6, and replayable against the server's `seededNext`. |
| 10 | **Hunt encounter probability** `min(0.90, 0.10 + activeQuestCount × 0.05)`, quest-scaled | **NOT SHIPPED** | No such expression exists at HEAD or in history. Encounter rate is **per-terrain data** (`const TERRAIN_ENCOUNTER_RATE@9892`), roads at 0, halved when travelling with co-present allies (§MESH-01f). *(§DOC-02b measured the same class of invented formula in the corridor section of the architectural review — the two reports agree, and both are wrong.)* |
| 11 | **`storyMove(dir)`** intercepts non-adjacent destinations | **RETIRED** | **0** occurrences. Movement is `cellMove` over the `MOVER:CORE` kernel; a non-adjacent click is refused, not intercepted. |
| 12 | **Scale claims** — 42 terrains · 42+7 nodes · "216+" monsters · 6,330 lines · 11×11 viewport | **CHANGED, all five** | **111** terrains · **416** nodes · **398** monsters · **38,707** lines (6.1×) · a **15×21** window (§NAV-01e) onto the 90×360 grid. |

### III-A. Node-code resolution — 0 of 49

Appendix A's 42 battleground codes and §III-C's 7 junction codes were all written in the retired
26×16 space. **None resolves to the node it names.** One is the §AUDIT-03m hazard class in its
purest form:

| Code | Report says | HEAD says |
|---|---|---|
| `CI` | "The Thieves' Den", `city`, Act I, `HUNTING_GROUNDS['city']` | **`num:429`, "Chancery Court — The Officer's Pen"** — a live but *entirely different* node |

`CI` therefore passes any *"does this code exist?"* check while every sentence containing it stays
wrong. The other 48 are cleanly dead. **This is why a node code is never read off a doc table**
(`npm run nodes` → `docs/maps/node-index.md`).

---

## IV. The Two Hunts — a Name Collision

The report's **Hunt** is a corridor travel mode (probabilistic encounter on a road leg, chosen
against Warp in a dialog). It was deleted whole by §TIMELESS-01 on 2026-06-26.

**Twelve days later, §KG-01 (`8168f0e`, 2026-07-08) introduced a different mechanic under the same
name.** Live "Hunt Mode" is a d-pad toggle (`huntMode: false@23083`) that doubles the wilderness
encounter rate to a 0.8 cap (`if (S_story.huntMode) baseRate@28440`) and biases 80/20 toward
monsters at or below the player's level via `function _monsterLevel@38231`. It has no dialog, no
corridors, no Warp counterpart, and no quest-target weighting.

**The two share only the word.** A reader who greps `huntMode` from this report will land on a
mechanic it does not describe. The state field name itself is a fossil — §TIMELESS-01 kept
`slStalksWon` "to avoid a save migration", and §KG-01 then re-used `huntMode` for the new meaning.
*Durable lesson: a retired feature's vocabulary is not free to re-use — the doc that named it does
not get updated, so the collision is silent and permanent.*

---

## V. Defects Filed

1. **§AUDIT-03t — 36 nodes carry `act:NaN`, and two render `undefined` to the player.** Traced
   directly from this report's `NodeEntry` typedef claim *"`act` — story act (1–8)"*. Verified:
   36 `NODE_MAP` entries have `act:NaN` (`num` 181–443, incl. `CI`/`DNG`/`BOR`/`RON`). The three
   readers fail in three different ways — `S_story.actNumber = node.act || 1@34573` silently
   coerces to Act 1 (NaN is falsy); `ACT_NAMES[node.act]@34602` yields `undefined`, so the act
   badge renders **"— undefined —"** and `#s-node-act` renders **"undefined"**; the map panel
   renders **"Act NaN"**. `const ACT_NAMES@9417` is a 9-element array with no NaN slot. Player-visible
   at 36 of 416 nodes (8.7%). No design call.

2. **§DESIGN-04 — nothing answers *"where do I find monster X?"*** The report's thesis question.
   `HUNTING_GROUNDS` was deleted and **no successor exists**: there is no bestiary locator, no
   terrain index, no per-monster habitat surface. With 398 monsters across 111 terrains and 416
   nodes, the lost-in-a-field failure mode the report was written to eliminate is, by its own
   criteria, **currently unaddressed**. Whether that matters is a design call — the modern game may
   answer it through quest `activateNode` and the Warrant's Board (§BOARD-01) instead.

---

## VI. What the Report Got Right

The substrate claims all held for 82 days and 6.1× the file:

- **`WORLD_DB` as flat terrain-keyed table with pre-resolved monster object references.** Exact.
  No string lookup at encounter time, as specified.
- **`NODE_MAP.name` is the terrain key.** The single link between place and monster pool — the one
  structural relation in the report that every later track preserved.
- **The five-tier vocabulary.** Specified here as a weight table; now load-bearing across
  Void-enrage magnitude, initiative, encounter weight and the threat badge, pinned in both
  directions by CI (§DX-02g).
- **Story-vs-grinding as distinct XP layers** (§II-B, §VII-A). The *taxonomy* survives even though
  the battleground layer that sat between them does not: scripted `node.battle` and wilderness
  encounters are still separate systems with separate loot rules.
- **Principle 2** — *"guaranteed encounters are not incidental"* — remains the correct statement of
  why one mechanic cannot serve both intents, and is why §KG-01's Hunt Mode is a *bias*, not a
  guarantee.

---

## VII. Scope Note

This document is retained as the design record for a subsystem that **no longer exists**. Its value
at HEAD is threefold: it is the origin of the `WORLD_DB`/`NODE_MAP` terrain link that all later
navigation work preserved; it names the design question §DESIGN-04 re-opens; and it is the clearest
case in the §DOC-02 corpus of a report whose *code listings* were written from intent rather than
from the file — §IX-C specifies a function that never existed under that name while the feature it
describes shipped two days later under another. **The half of a document that points at code is the
half that is right** (§DOC-02b's lesson, confirmed here from the other direction).

---

## References

[1] §TIMELESS-01 removal spec — `docs/lab-reports/lab-report-timeless-movement-hunt-removal.md`,
    2026-06-26. Removes the Hunt/Stalk subsystem; records the shipped stalk modal as never shown.
[2] §WALK / §NAV-01 — navigation-core redesign (geo grid, `MOVER:CORE`, `ROAD_RUNS`); supersedes
    Layer 9 entirely. `plan-archive.md`, `docs/lab-reports/lab-report-nav01-navigable-world.md`.
[3] §ARCH-01 — Universal Quest Format 1.0; replaces the `QuestEntry` shape of §V-B.
[4] §KG-01 — Hunt Mode + monster-level metric (`8168f0e`, 2026-07-08). The name collision of §IV.
[5] §AUDIT-03l / §AUDIT-03m — dead node codes in docs; `docs/maps/node-index.md` is the live
    reference. Source of the `CI` finding in §III-A.
[6] Wizards of the Coast, *Systems Reference Document 5.1*, CC-BY-4.0, 2023. Monster stat-block
    conventions underlying `MONSTER_POOL`.

---

## Appendix A — The 49 Node Codes (NOT SHIPPED, kept)

Retained verbatim as the 2026-05-21 record. **None of these codes resolves to the node named.**

**Battlegrounds (42):** `CI` Thieves' Den · `AL` Visby Dark Alleys · `DK` Tilbury Harbor ·
`MQ` Market Quarter · `BQ` Weimar Forge District · `SQ` Ivory Circle Quarter · `CY` Neon Undercity ·
`SF` Tilbury Storefronts · `BA` Broken Tooth Tavern · `IN` Birka Inn · `TV` Birka Tavern Row ·
`OU` Observatory Outhouse · `MS` Tilbury Star · `CR` Birka Undercrypt · `CA` Scholar Kings'
Catacombs · `VC` Mourne's Castle · `SE` Visby Sewer Underbelly · `GC` Goblin Warrens · `PC` Visby
Pirate Caves · `MC` Zeugl's Den · `SC` Scholar Kings' Sea Cavern · `FO` Aldric's Forest ·
`JU` Dense Jungle Road · `SW` Murky Swamp · `HS` Crones' Domain · `BE` Tropical Beach ·
`MI` Plains & Midlands · `HL` Irish Highlands · `DE` Desert Wastes · `DC` Izador's Caravan Route ·
`MT` Weimar Pass · `AR` Arctic Wastes · `OC` Open Ocean · `IS` Island Shore · `AT` Sunken Atlantis ·
`FL` River Lake · `DS` Deep Sea Trench · `GA` Greek Agora Ruins · `KT` Camelot Ruins ·
`OP` Oriental Dragon Palace · `HC` Heavenly Cloud Road · `CO` Cosmic Convergence.

**Junctions (7):** `J1` Midlands Road Fork · `J2` Southern Road Cross · `J3` Coastal Fork ·
`J4` Deep Road Split · `J5` Arctic Overpass · `J6` Western Wilds Crossroads · `J7` Sky Gate Spur.

---

*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
