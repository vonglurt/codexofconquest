<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Battleground Architecture in Single-File RPG Design: Structured Encounter Zones, Circuit Pathfinding, and Quest-Coupled Terrain in Roll2Hit: The Shattered Codex

**Lab Report — IEEE Style**  
**Addressed to:** Architectural Engineer, Game Engine Design  
**Project:** Roll2Hit: The Shattered Codex — `roll2hit-v3.html`  
**Date:** 2026-05-21  
**Classification:** Design Methodology / Game Systems Architecture

---

## Abstract

Open-world RPG design consistently produces a class of UX failure informally known as the "lost in a field" problem: players with a kill quest or XP objective wander procedurally generated or large-scale environments searching for a specific enemy type that the terrain is supposed to supply but does not reliably surface. This report describes a structural solution implemented in Roll2Hit: The Shattered Codex — a single-file HTML RPG operating under zero-CDN, zero-build-step constraints — in which every terrain type in `WORLD_DB` maps to a named, navigable battleground node, connected by a wire-mesh corridor network (Layer 9 — Circuit Corridors) that restricts freeform movement to a finite graph. The thesis is that **corridors plus designated battlegrounds equals guided freedom**: the player retains agency in navigation and encounter selection while the system eliminates aimless search. A Stalk mechanic provides guaranteed intentional encounters at battleground nodes, distinct from probabilistic corridor Hunt encounters. Quest-to-terrain coupling creates a closed information loop in which a quest's activation node, its target terrain, and its optimal grinding location are all derivable from a single data structure. The architecture is specified as a set of interconnected data objects (`WORLD_DB`, `NODE_MAP`, `HUNTING_GROUNDS`) and runtime functions (`_stalkedMonsterPick`, `stalkModal`, `storyPreBattle`), all coexisting within a single self-contained HTML document of approximately 6,330 lines.

**Keywords:** battleground design, encounter architecture, wire-mesh navigation, quest coupling, intentional encounter, XP loop, single-file game engine, terrain classification

---

## I. Introduction: The Lost-In-A-Field Problem

### I-A. The UX Failure Mode

In open-world role-playing games, a standard quest template presents the player with an objective of the form: "Kill N enemies of type X." The game world is large. Enemy X belongs to a terrain type — forest wolves, desert bandits, ocean sea creatures — but the game does not consistently communicate where that terrain is concentrated, what density to expect, or how long the player must walk before encountering a qualifying target.

The result is a navigation problem masquerading as a design choice. The field is notionally infinite. The enemy is present but rare. The player walks. Nothing happens. The player continues walking. This is not exploration — it is search. The player is not exercising agency; they are waiting for the world to generate content.

This failure mode is not inherent to open-world design. It is a consequence of two separable architectural decisions: (1) terrain is defined continuously rather than discretely, and (2) there is no navigation primitive that answers the question "where do I find enemy X?"

### I-B. The Discrete Alternative

Roll2Hit: The Shattered Codex is a story-driven RPG implemented as a 6,330-line single-file HTML document (`roll2hit-v3.html`) with no external dependencies. Its world is not continuous. The world is a finite graph of 42 named terrain nodes (`NODE_MAP`), connected by a directed edge set, rendered as an 11×11 viewport grid. Every node has exactly one terrain type. Every terrain type has exactly one monster pool (`WORLD_DB[terrain].monsters`). Every terrain type has exactly one designated battleground node.

In this architecture, "where do I find enemy X" is not a search problem. It is a lookup. The player identifies the terrain type associated with enemy X, identifies the battleground node for that terrain, navigates to it via the corridor network, and activates the Stalk mechanic. The encounter is guaranteed.

This report describes the data structures, algorithms, and design principles underlying that architecture.

### I-C. Scope

This report covers:
- The battleground as architectural primitive (Section II)
- The Circuit Corridor system as pathfinding infrastructure (Section III)
- The Stalk mechanic as guaranteed intentional encounter engine (Section IV)
- Quest-to-terrain coupling as closed information loop (Section V)
- The full data architecture (Section VI)
- The three-layer XP loop (Section VII)
- Pathfinding clarity as the combined result (Section VIII)
- Implementation in `roll2hit-v3.html` (Section IX)

---

## II. The Battleground as Architectural Primitive

### II-A. Definition

A **battleground** is a named node in `NODE_MAP` designated as the canonical encounter location for a specific `WORLD_DB` terrain type. It satisfies three properties:

1. **Terrain specificity.** The node's terrain key maps to exactly one `WORLD_DB` entry. The monster pool drawn at that node is always from that terrain — no spillover from adjacent biomes.
2. **Demand satisfaction.** A Stalk mechanic at that node guarantees an encounter on demand. The encounter probability is 100%, not a probabilistic roll.
3. **Quest preference.** If the player has an active quest whose target terrain matches the node's terrain, the Stalk resolver applies a 3× weight to matching monsters in the pool, increasing the probability of drawing a quest-relevant enemy.

Every terrain type in `WORLD_DB` has exactly one designated battleground node. This is a one-to-one mapping, enforced by the `HUNTING_GROUNDS` lookup table.

### II-B. Battleground vs. Story Node

The distinction between a battleground and a story node is architectural:

| Property | Story Node | Battleground Node |
|---|---|---|
| Battle trigger | Scripted (node.battle) | Player-initiated (Stalk) |
| Encounter pool | Named specific enemy | Full terrain pool |
| Encounter limit | One-shot (loot/shard) | Infinite (repeatable) |
| Loot type | Unique item / Codex Shard | Random terrain drop |
| XP classification | Narrative XP | Grinding XP |

Story nodes drive the plot. Battlegrounds sustain the player between plot beats. Together they define a complete XP economy.

### II-C. The HUNTING_GROUNDS Lookup

The battleground system requires a lookup structure that maps terrain types to their canonical nodes:

```js
const HUNTING_GROUNDS = {
  city:             { nodeCode: 'CI', displayName: 'The Thieves\' Den' },
  alley:            { nodeCode: 'AL', displayName: 'Visby Dark Alleys' },
  docks:            { nodeCode: 'DK', displayName: 'Tilbury Harbor' },
  market_quarter:   { nodeCode: 'MQ', displayName: 'The Market Quarter' },
  blacksmith_qtr:   { nodeCode: 'BQ', displayName: 'Weimar Forge District' },
  scholars_qtr:     { nodeCode: 'SQ', displayName: 'Ivory Circle Quarter' },
  cyberpunk_streets:{ nodeCode: 'CY', displayName: 'Neon Undercity' },
  storefront:       { nodeCode: 'SF', displayName: 'Tilbury Storefronts' },
  bar:              { nodeCode: 'BA', displayName: 'Broken Tooth Tavern' },
  inn:              { nodeCode: 'IN', displayName: 'Birka Inn' },
  tavern:           { nodeCode: 'TV', displayName: 'Birka Tavern Row' },
  outhouse:         { nodeCode: 'OU', displayName: 'Observatory Outhouse' },
  merchant_ship:    { nodeCode: 'MS', displayName: 'Tilbury Star' },
  crypt:            { nodeCode: 'CR', displayName: 'Birka Undercrypt' },
  catacombs:        { nodeCode: 'CA', displayName: 'Scholar Kings\' Catacombs' },
  vampire_castle:   { nodeCode: 'VC', displayName: 'Mourne\'s Castle' },
  sewers:           { nodeCode: 'SE', displayName: 'Visby Sewer Underbelly' },
  goblin_cave:      { nodeCode: 'GC', displayName: 'Goblin Warrens' },
  pirate_cave:      { nodeCode: 'PC', displayName: 'Visby Pirate Caves' },
  monster_cave:     { nodeCode: 'MC', displayName: 'Zeugl\'s Den' },
  sea_cavern:       { nodeCode: 'SC', displayName: 'Scholar Kings\' Sea Cavern' },
  forest:           { nodeCode: 'FO', displayName: 'Aldric\'s Forest' },
  jungle:           { nodeCode: 'JU', displayName: 'Dense Jungle Road' },
  swamp:            { nodeCode: 'SW', displayName: 'Murky Swamp' },
  hag_swamp:        { nodeCode: 'HS', displayName: 'Crones\' Domain' },
  beach:            { nodeCode: 'BE', displayName: 'Tropical Beach' },
  midlands:         { nodeCode: 'MI', displayName: 'Plains & Midlands' },
  highlands:        { nodeCode: 'HL', displayName: 'Irish Highlands' },
  desert:           { nodeCode: 'DE', displayName: 'Desert Wastes' },
  desert_caravan:   { nodeCode: 'DC', displayName: 'Izador\'s Caravan Route' },
  mountains:        { nodeCode: 'MT', displayName: 'Weimar Pass' },
  arctic:           { nodeCode: 'AR', displayName: 'Arctic Wastes' },
  ocean:            { nodeCode: 'OC', displayName: 'Open Ocean' },
  islands:          { nodeCode: 'IS', displayName: 'Island Shore' },
  atlantis:         { nodeCode: 'AT', displayName: 'Sunken Atlantis' },
  freshwater_lake:  { nodeCode: 'FL', displayName: 'River Lake' },
  deep_sea:         { nodeCode: 'DS', displayName: 'Deep Sea Trench' },
  greek_agora:      { nodeCode: 'GA', displayName: 'Greek Agora Ruins' },
  camelot:          { nodeCode: 'KT', displayName: 'Camelot Ruins' },
  oriental_palace:  { nodeCode: 'OP', displayName: 'Oriental Dragon Palace' },
  heavenly_clouds:  { nodeCode: 'HC', displayName: 'Heavenly Cloud Road' },
  cosmic_realm:     { nodeCode: 'CO', displayName: 'Cosmic Convergence' },
};
```

This table is the architectural backbone of the battleground system. Given any terrain key from `WORLD_DB`, the system can immediately resolve the canonical battleground node and its display name.

**Note on node MT:** The `mountains` terrain introduces node MT as a new `NODE_MAP` entry associated with Weimar Pass. All 42 terrain types in `WORLD_DB` are covered by this mapping.

---

## III. Corridors as Pathfinding Infrastructure

### III-A. The Open-Field Problem in Graph Form

Without corridors, the 42-node graph presents a UX problem analogous to the open-world search problem: the player sees isolated node icons on a grid with no visual indication of the roads between them. Movement is D-pad directional; the player can reach any reachable node by pressing directions, but the routing is opaque. There is no "road" to follow — only grid arithmetic.

Layer 9 (Circuit Corridors) solves this by rendering the edge set of the graph as a visible wire mesh on the 11×11 map viewport. Every connection between nodes is drawn as a box-drawing character path — horizontal (`─`), vertical (`│`), corner (`┌ ┐ └ ┘`), T-junction (`├ ┤ ┬ ┴`), or crossing (`┼`) — computed by `buildCorridorMap()` at startup.

### III-B. The Wire Mesh Architecture

`CORRIDOR_CELLS` is a global constant (initialized empty, populated once at startup) that maps grid coordinates to corridor cell descriptors:

```js
/**
 * @type {Object.<string, CorridorCell>}
 * key: "r,c"
 *
 * @typedef {Object} CorridorCell
 * @property {Set<string>}                  dirs    — 'N'|'S'|'E'|'W' wire directions
 * @property {string}                       glyph   — box-drawing character
 * @property {string}                       terrain — WORLD_DB key for Hunt encounters
 * @property {Array<{from:string,to:string}>} edges — which NODE_MAP edges pass through
 */
```

`buildCorridorMap()` iterates every `(nodeCode, direction, destCode)` triple in `NODE_MAP`. For each non-adjacent pair (Manhattan distance ≥ 2 on the grid), it computes an L-shaped route using `_routeSegments()` and writes intermediate cells to `CORRIDOR_CELLS`. Adjacent pairs (distance ≤ 1) need no corridor cells. Portal connections are skipped.

Each edge is processed once (deduplication by canonical ordered pair). Crossing cells merge their direction sets and recompute the glyph. Node cells are never overwritten.

### III-C. Junction Nodes

Seven junction nodes (J1–J7) are inserted into `NODE_MAP` to serve as navigable waypoints at strategic corridor midpoints:

| Code | Label | Grid | Edges Connected |
|---|---|---|---|
| J1 | Midlands Road Fork | R05, C12 | CI ↔ MI |
| J2 | Southern Road Cross | R10, C04 | DE ↔ JU |
| J3 | Coastal Fork | R09, C03 | HS ↔ BE |
| J4 | Deep Road Split | R12, C08 | DS ↔ SE |
| J5 | Arctic Overpass | R01, C10 | AR ↔ CO |
| J6 | Western Wilds Crossroads | R05, C05 | MI ↔ FO |
| J7 | Sky Gate Spur | R01, C22 | OP ↔ HC |

Junction nodes have `junction: true` in their `NODE_MAP` entry, no battle, no loot, and no NPC. They render in the map viewport with a crossroads glyph (`✛`) and their code label. Their purpose is purely navigational: to break long corridors into waypoint-to-waypoint hops, making the route legible.

### III-D. Corridor Terrain Assignments

Each corridor edge carries a terrain string that determines the monster pool for Hunt-mode encounters on that corridor:

```js
const CORRIDOR_TERRAIN = {
  'CI-MI': 'midlands',   'MI-CI': 'midlands',
  'MI-FO': 'forest',     'FO-MI': 'forest',
  'MI-HL': 'highlands',  'HL-MI': 'highlands',
  'HS-BE': 'forest',     'BE-HS': 'forest',
  'OC-IS': 'ocean',      'IS-OC': 'ocean',
  'IS-AT': 'ocean',      'AT-IS': 'ocean',
  'OC-DS': 'ocean',      'DS-OC': 'ocean',
  'DS-SE': 'ocean',      'SE-DS': 'ocean',
  'VC-DE': 'desert',     'DE-VC': 'desert',
  'DC-JU': 'jungle',     'JU-DC': 'jungle',
  'JU-BQ': 'jungle',     'BQ-JU': 'jungle',
  'KT-OP': 'heavenly_clouds', 'OP-KT': 'heavenly_clouds',
  'OP-HC': 'heavenly_clouds', 'HC-OP': 'heavenly_clouds',
  'HC-AR': 'arctic',     'AR-HC': 'arctic',
  'AR-CO': 'arctic',     'CO-AR': 'arctic',
  // Fallback: 'midlands'
};
```

The corridor terrain is not the terrain of either endpoint node — it is the biome of the road between them, independently specified. A road through forest between two non-forest nodes is still a forest encounter.

### III-E. Travel Modes

When `storyMove(dir)` detects that the destination is ≥ 2 Manhattan grid cells from the current node, it intercepts the move and calls `storyCorridorTravel(fromCode, toCode, dir)`. This function presents a Hunt/Warp dialog:

| Mode | Encounter Roll | Day Cost | Description |
|---|---|---|---|
| Warp | None | 0 | Instant transit, no encounter |
| Hunt | Quest-scaled probability | 0 | Optional corridor battle |

Hunt-mode encounter probability scales with active quest count:

```
encounterChance = min(0.90, 0.10 + activeQuestCount × 0.05)
```

| Active Quests | Encounter Chance |
|---|---|
| 0 | 10% |
| 2 | 20% |
| 8 | 50% |
| 16 | 90% (cap) |

The quest-scaled probability is a design signal: a player heavily invested in quests faces more incidental encounters en route. It also makes Hunt mode a meaningful choice — a player with 16 active quests who chooses Hunt is accepting near-certain combat.

---

## IV. The Stalk Mechanic: Guaranteed Intentional Encounters

### IV-A. Motivation

Corridor Hunt mode is probabilistic: the encounter may or may not fire. This is appropriate for incidental encounters on roads between destinations. It is not appropriate when the player's explicit goal is to find and kill a specific type of enemy.

The Stalk mechanic solves this. At any designated battleground node, the player may activate Stalk — a guaranteed encounter with a monster drawn from that node's terrain pool, with quest-preference weighting applied.

### IV-B. UI Specification

The Stalk button appears in `storyRender()` when `S_story.currentCode` matches any value in `HUNTING_GROUNDS` (i.e., when the player is standing on a designated battleground node). Pressing it opens the Stalk modal overlay.

**Stalk modal contents:**
- Terrain name (e.g., "Forest / Trees")
- Active quest targets matching this terrain, listed by name
- `[Wait for Prey]` button — initiates the encounter

**Stalk overlay example:**

```
┌─────────────────────────────────────────┐
│  🎯 Stalking...                         │
│  ─────────────────────────────────────  │
│  Location: Aldric's Forest (forest)     │
│                                         │
│  Active Quest Targets Here:             │
│  • Kill the Leshen (quest: Grove Token) │
│  • Clear Aldric's Road (quest: active)  │
│                                         │
│  [Wait for Prey]                        │
│  [Leave]                                │
└─────────────────────────────────────────┘
```

### IV-C. Stalk Mechanics

Three properties distinguish Stalk from corridor Hunt:

1. **Guaranteed encounter.** `Math.random()` is not called. The encounter always fires. Stalk is not a gamble — it is a navigation decision.
2. **No day cost.** The creature comes to the player. Stalking is instant.
3. **Player can still flee.** Once combat begins, the existing flee mechanic applies. Stalk initiates the encounter; it does not trap the player.

### IV-D. Quest-Preference Weighting

The Stalk resolver (`_stalkedMonsterPick`) extends the base weighted sampler (`_weightedMonsterPick`) with a quest-preference boost:

```js
/**
 * Picks one monster from pool with tier weights and quest-preference boost.
 * Tier weights: trivial/easy 35 each, medium 25, hard 4, deadly 1.
 * Quest-preference: any active quest whose target terrain matches the current
 * node's terrain applies 3× weight multiplier to matching monsters.
 *
 * @param  {MonsterEntry[]} pool        — WORLD_DB[terrain].monsters
 * @param  {string}         terrain     — current terrain key
 * @param  {string[]}       activeKeys  — monster keys targeted by active quests
 * @returns {MonsterEntry|null}
 */
function _stalkedMonsterPick(pool, terrain, activeKeys) {
  const WEIGHTS = { trivial: 35, easy: 35, medium: 25, hard: 4, deadly: 1 };
  const QUEST_BOOST = 3;
  const activeSet = new Set(activeKeys);
  const weighted = [];
  pool.forEach(m => {
    const base = WEIGHTS[m.tier] || 10;
    const w = activeSet.has(m.key) ? base * QUEST_BOOST : base;
    for (let i = 0; i < w; i++) weighted.push(m);
  });
  if (!weighted.length) return null;
  return weighted[Math.floor(Math.random() * weighted.length)];
}
```

**Design implication:** A quest targeting the Leshen at `forest` terrain does not guarantee the Leshen spawns on every Stalk — but it triples the Leshen's representation in the weighted pool. Tier weights still apply (harder monsters remain rare). The player has a strongly elevated probability of drawing the quest target without a deterministic lock that would trivialize the encounter.

**Quest-preference activation criteria:** An active quest contributes `activeKeys` entries only if its `targetTerrain` field matches the current battleground node's terrain. A city-terrain quest does not inflate forest monster weights at `FO`.

---

## V. Quest-to-Terrain Coupling

### V-A. The Closed Loop

The battleground system derives its navigational clarity from a closed information loop:

```
QUEST activates at NODE
  → NODE has terrain T
    → WORLD_DB[T] defines monster pool
      → HUNTING_GROUNDS[T] gives battleground node
        → Player navigates to battleground
          → Stalk draws from WORLD_DB[T] with quest-preference boost
```

Every link in this chain is a data lookup with no ambiguity. The player never has to search — they have to navigate.

### V-B. QUEST_DB Structure

Quests are stored in `QUEST_DB`, referenced by `S_story.quests` (a key→status map). Each quest entry carries a `targetTerrain` field that the Stalk resolver uses for quest-preference activation:

```js
/**
 * @typedef {Object} QuestEntry
 * @property {string}   key           — unique quest identifier
 * @property {string}   name          — display name
 * @property {string}   activateNode  — NODE_MAP code where quest becomes active
 * @property {string}   targetTerrain — WORLD_DB terrain key for monster coupling
 * @property {string[]} targetKeys    — MONSTER_POOL keys that qualify as kills
 * @property {number}   killCount     — required kill count (0 = non-kill quest)
 */
```

**Example — the forest quest coupling:**

The Grove Token quest activates at node `FO` (Aldric's Forest, forest terrain). Its `targetTerrain` is `'forest'`. Its `targetKeys` include `leshen`. The player activates at `FO`, which happens to be the `HUNTING_GROUNDS['forest']` battleground — the canonical grinding location for forest monsters. The quest's activation node and optimal battleground are the same node. This is not a coincidence; it is the intended design. Quests should activate at or near their natural grinding location wherever the story permits.

For quests that activate far from their grinding location — for example, a desert quest activated at `CI` (city) — the player navigates from the activation node to `HUNTING_GROUNDS['desert']` (node `DE`, Desert Wastes) via the corridor network. The corridor system makes this routing legible; the player can see the road from city to the desert.

### V-C. Node → Terrain → Battleground Table (Selected)

| Activation Node | Terrain | HUNTING_GROUNDS Battleground | Display Name |
|---|---|---|---|
| CI | city | CI | The Thieves' Den |
| DK | docks | DK | Tilbury Harbor |
| FO | forest | FO | Aldric's Forest |
| SE | sewers | SE | Visby Sewer Underbelly |
| GC | goblin_cave | GC | Goblin Warrens |
| VC | vampire_castle | VC | Mourne's Castle |
| DE | desert | DE | Desert Wastes |
| OC | ocean | OC | Open Ocean |
| HC | heavenly_clouds | HC | Heavenly Cloud Road |
| CO | cosmic_realm | CO | Cosmic Convergence |

---

## VI. Data Architecture

### VI-A. WORLD_DB

`WORLD_DB` is a flat object keyed by terrain string. Each entry has three fields:

```js
/**
 * @typedef {Object} TerrainEntry
 * @property {string}          label    — display name
 * @property {string}          icon     — emoji prefix
 * @property {MonsterEntry[]}  monsters — direct references into MONSTER_POOL
 */

/** @type {Object.<string, TerrainEntry>} */
const WORLD_DB = {
  city:              { label: 'City Streets',      icon: '🏙', monsters: [...] },
  alley:             { label: 'Dark Alley',         icon: '🌑', monsters: [...] },
  docks:             { label: 'Harbor Docks',       icon: '⚓', monsters: [...] },
  market_quarter:    { label: 'Market Quarter',     icon: '🛒', monsters: [...] },
  blacksmith_qtr:    { label: 'Blacksmith Quarter', icon: '🔨', monsters: [...] },
  scholars_qtr:      { label: 'Scholar\'s Quarter', icon: '📚', monsters: [...] },
  cyberpunk_streets: { label: 'Neon Undercity',     icon: '⚡', monsters: [...] },
  storefront:        { label: 'Market District',    icon: '🏪', monsters: [...] },
  bar:               { label: 'Tavern Brawl',       icon: '🍺', monsters: [...] },
  inn:               { label: 'Inn — Night',        icon: '🛏', monsters: [...] },
  tavern:            { label: 'Tavern — Common',    icon: '🍷', monsters: [...] },
  outhouse:          { label: 'Outhouse / Privy',   icon: '🪣', monsters: [...] },
  merchant_ship:     { label: 'Merchant Ship',      icon: '🚢', monsters: [...] },
  crypt:             { label: 'Crypt',              icon: '⚰', monsters: [...] },
  catacombs:         { label: 'Catacombs',          icon: '💀', monsters: [...] },
  vampire_castle:    { label: 'Vampire Castle',     icon: '🏰', monsters: [...] },
  sewers:            { label: 'Sewer Underbelly',   icon: '🐀', monsters: [...] },
  goblin_cave:       { label: 'Goblin Cave',        icon: '👺', monsters: [...] },
  pirate_cave:       { label: 'Pirate Cave',        icon: '🏴‍☠️', monsters: [...] },
  monster_cave:      { label: 'Monster Den',        icon: '🦎', monsters: [...] },
  sea_cavern:        { label: 'Sea Cavern',         icon: '🦑', monsters: [...] },
  forest:            { label: 'Forest / Trees',     icon: '🌲', monsters: [...] },
  jungle:            { label: 'Dense Jungle',       icon: '🌴', monsters: [...] },
  swamp:             { label: 'Murky Swamp',        icon: '🌿', monsters: [...] },
  hag_swamp:         { label: 'Hag\'s Domain',      icon: '🕸', monsters: [...] },
  beach:             { label: 'Tropical Beach',     icon: '🏖', monsters: [...] },
  midlands:          { label: 'Plains & Midlands',  icon: '🌾', monsters: [...] },
  highlands:         { label: 'Irish Highlands',    icon: '⛰', monsters: [...] },
  desert:            { label: 'Desert Wastes',      icon: '🏜', monsters: [...] },
  desert_caravan:    { label: 'Desert Caravan',     icon: '🐪', monsters: [...] },
  mountains:         { label: 'Mountain Pass',      icon: '🗻', monsters: [...] },
  arctic:            { label: 'Arctic Wastes',      icon: '❄', monsters: [...] },
  ocean:             { label: 'Ocean Depths',       icon: '🌊', monsters: [...] },
  islands:           { label: 'Island Shore',       icon: '🏝', monsters: [...] },
  atlantis:          { label: 'Sunken Atlantis',    icon: '🔱', monsters: [...] },
  freshwater_lake:   { label: 'Freshwater Lake',    icon: '💧', monsters: [...] },
  deep_sea:          { label: 'Deep Sea Trench',    icon: '🌑', monsters: [...] },
  greek_agora:       { label: 'Greek Agora',        icon: '🏛', monsters: [...] },
  camelot:           { label: 'Camelot Ruins',      icon: '⚔', monsters: [...] },
  oriental_palace:   { label: 'Oriental Palace',    icon: '🏯', monsters: [...] },
  heavenly_clouds:   { label: 'Heavenly Clouds',    icon: '☁', monsters: [...] },
  cosmic_realm:      { label: 'Cosmic Realm',       icon: '🌌', monsters: [...] },
};
```

`WORLD_DB` contains 42 terrain entries. Each `monsters` array holds direct object references into `MONSTER_POOL` (216+ entries). There is no string-key lookup at encounter time — the objects are already resolved.

### VI-B. NODE_MAP

`NODE_MAP` is a flat object keyed by node code. Each entry has the terrain key that links it to `WORLD_DB`:

```js
/**
 * @typedef {Object} NodeEntry
 * @property {number}       num    — sequential node number (1–49 including junctions)
 * @property {string}       code   — node code (e.g. 'CI', 'FO', 'J1')
 * @property {string}       name   — WORLD_DB terrain key
 * @property {string}       label  — display name
 * @property {number}       act    — story act (1–8)
 * @property {string|null}  N,S,E,W — adjacent node codes (directional connections)
 * @property {string}       text   — story text shown in storyRender()
 * @property {Object|null}  npc    — NPC descriptor if present
 * @property {Object|null}  battle — scripted battle descriptor if present
 * @property {Object|null}  loot   — loot descriptor if present
 * @property {boolean}      sleep  — whether this node is a sleep location
 * @property {boolean}      [junction] — true for J1–J7 nodes
 */
```

The `name` field (terrain key) is the link between `NODE_MAP` and `WORLD_DB`. `NODE_MAP['FO'].name === 'forest'` → `WORLD_DB['forest']` is the monster pool for that node.

### VI-C. The 42-Terrain × 42-Node Mapping

The `HUNTING_GROUNDS` lookup provides a bijective (one-to-one and onto) mapping between all 42 `WORLD_DB` terrain keys and 42 `NODE_MAP` entries. Node MT is added for `mountains` terrain to complete the mapping:

```js
// NODE_MAP entry for mountains (node MT — added to complete terrain coverage)
MT: {
  num: 43, code: 'MT', name: 'mountains',
  label: 'Weimar Mountain Pass',
  act: 6,
  N: 'SQ', S: null, E: null, W: null,
  text: 'The pass above Weimar. Permanent frost. The scholar road runs through here — barely. Something large moved in the snowfield last night and the tracks are too widely spaced to be anything human.',
  npc: null, battle: null, loot: null, sleep: false,
}
```

(Junction nodes J1–J7 use `name: 'junction'`, which does not map to any `WORLD_DB` terrain. They are not battleground nodes and do not appear in `HUNTING_GROUNDS`.)

### VI-D. The Stalk Resolver

The Stalk resolver is the runtime function that activates when the player presses `[Wait for Prey]` at a battleground node:

```
Stalk resolver logic:
  1. terrain ← WORLD_DB key for current node (NODE_MAP[S_story.currentCode].name)
  2. pool    ← WORLD_DB[terrain].monsters
  3. activeKeys ← all MONSTER_POOL keys targeted by quests in S_story.quests
               where quest.targetTerrain === terrain AND quest.status === 'active'
  4. monster ← _stalkedMonsterPick(pool, terrain, activeKeys)
  5. → storyPreBattle(monster) → loadWorldMonster(monster) → battle → storyApplyOutcome
```

The resolver is synchronous and deterministic given its inputs (the randomness is in `_stalkedMonsterPick`). It does not consult the corridor system or the Hunt probability function. It does not advance the Void Tide timer.

---

## VII. The XP-Loop Architecture

### VII-A. Three Layers

The XP economy of Roll2Hit: The Shattered Codex has three distinct layers, each serving a different play mode:

| Layer | Source | Repeatability | Probability | Player Intent |
|---|---|---|---|---|
| Story | Story nodes (scripted battles, loot, Codex Shards) | Finite (one-shot per node) | 100% (scripted) | Narrative progression |
| Battleground | Battleground nodes (Stalk mechanic) | Infinite | 100% (guaranteed) | Intentional grinding |
| Corridor | Corridor edges (Hunt mode) | Infinite | Quest-scaled (10–90%) | Ambient, incidental |

### VII-B. Layer Interactions

The three layers are not mutually exclusive — they interact by design:

- A player completing Act I story nodes (CI, IN, TV, BA, CR, CY) accumulates narrative XP and unique loot.
- Between story nodes, the player may use corridor Hunt mode to accumulate incidental XP on the road.
- If a story quest requires grinding (e.g., multiple forest enemy kills before the leshen), the player navigates to `FO` and Stalks.

The battleground layer exists specifically to support the grinding use case without requiring the player to use corridor Hunt mode (probabilistic, potentially frustrating) or to replay story nodes (finite, breaks narrative flow).

### VII-C. The Optimized XP Player

A player who explicitly optimizes for XP uses all three layers deliberately:

1. **Narrative layer:** Complete all story nodes in act order. This maximizes unique loot, condition items, and Codex Shard acquisition.
2. **Battleground layer:** After each major terrain unlock, visit the corresponding battleground and Stalk for 3–5 encounters. This levels the player for the next story arc.
3. **Corridor layer:** When moving between distant nodes, always choose Hunt mode. The probabilistic encounter costs nothing and may yield useful drops.

The system supports this without requiring explicit guidance. The navigation primitives (map overlay, corridor wire mesh, `HUNTING_GROUNDS` display) make the optimal strategy legible to an attentive player.

### VII-D. XP Tier Distribution

Battleground Stalk encounters draw from `_stalkedMonsterPick`, which applies the same tier weights as corridor Hunt (`_weightedMonsterPick`):

| Tier | Weight | Encounter Fraction |
|---|---|---|
| trivial | 35 | ~32% |
| easy | 35 | ~32% |
| medium | 25 | ~23% |
| hard | 4 | ~4% |
| deadly | 1 | ~1% |

(Fractions are approximate and vary by pool composition. Quest-preference boost shifts these fractions toward quest-target monsters without eliminating tier weighting.)

This distribution ensures that a player grinding at a high-tier battleground (e.g., `CO` — Cosmic Realm) still faces mostly manageable enemies, with hard and deadly encounters as meaningful variance rather than constant threat.

---

## VIII. Pathfinding Clarity: From Maze to Network

### VIII-A. The Before State

Before Layer 9 (Circuit Corridors), the player sees the 42-node map as isolated squares. The connections exist in `NODE_MAP` (N/S/E/W fields) but are invisible on the map. The player navigates by pressing D-pad directions and watching the node indicator change. There is no road. There is no trail. There is no "where am I going."

For a new player trying to reach a specific node — say, Aldric's Forest (FO) for a forest quest — the process is:
1. Know or discover that FO is "to the west" of the Midlands (MI)
2. Navigate to MI
3. From MI, attempt to move west
4. Find that MI.W now connects to junction J6 (Western Wilds Crossroads)
5. From J6, move west to FO

Without the corridor display, step 4 requires knowing the junction exists. Without the `HUNTING_GROUNDS` table, the player may not even know FO is the correct destination.

### VIII-B. The After State

After Layer 9 + Battleground system, the same navigation is:
1. Open map overlay — see the wire mesh connecting CI → J1 → MI → J6 → FO
2. Identify FO as the `HUNTING_GROUNDS['forest']` node (displayed in the Stalk button's tooltip)
3. Navigate west through J1, MI, J6 to FO via D-pad or corridor travel
4. Activate Stalk at FO
5. Encounter guaranteed

The wire mesh reduces the routing problem from graph search to visual tracing. The junction waypoints provide named intermediate checkpoints. The `HUNTING_GROUNDS` display gives the battleground node a name that matches the quest's terrain. The entire pipeline from "I have a forest quest" to "I am fighting a forest enemy" is navigational, not exploratory.

### VIII-C. The Full Navigation Triangle

The combination of corridor wire mesh, junction waypoints, and `HUNTING_GROUNDS` lookup creates what may be termed the **Navigation Triangle**:

```
QUEST (what to kill)
   ↓ targetTerrain
TERRAIN (where to go)
   ↓ HUNTING_GROUNDS
BATTLEGROUND NODE (exact location)
   ↓ corridor wire mesh
ROUTE (how to get there)
```

Each vertex of the triangle is an O(1) lookup. No search. No wandering. No guessing.

**Example — the forest quest path:**

```
Quest: "Grove Token" → targetTerrain: 'forest'
  → HUNTING_GROUNDS['forest'] = { nodeCode: 'FO', displayName: "Aldric's Forest" }
    → corridor wire: CI → J1 → MI → J6 → FO
      → stalkModal at FO → _stalkedMonsterPick with leshen 3× boost
        → 100% encounter → battle → XP
```

No field was wandered in the production of this encounter.

---

## IX. Implementation in roll2hit-v3.html

### IX-A. The HUNTING_GROUNDS Const

`HUNTING_GROUNDS` is declared as a `const` in the data section of `roll2hit-v3.html`, after `WORLD_DB` and `NODE_MAP` are defined. It is read-only after declaration. It is consumed by:
- `storyRender()` — to determine whether to show the Stalk button at the current node
- `stalkModal()` — to display the battleground name and active quest targets
- Any UI component that needs to display "optimal battleground for terrain X"

### IX-B. The Stalk Button in storyRender()

In `storyRender(node)`, after the standard node content is rendered, the system checks whether the current node is a designated battleground:

```js
// Inside storyRender(node):
const hg = HUNTING_GROUNDS[node.name];
if (hg && hg.nodeCode === node.code) {
  // Show the Stalk button
  const stalkBtn = document.getElementById('btn-stalk');
  if (stalkBtn) {
    stalkBtn.style.display = 'block';
    stalkBtn.onclick = () => stalkModal(node);
  }
}
```

The condition `hg.nodeCode === node.code` ensures the Stalk button only appears at the canonical battleground for that terrain, not at every node of that terrain type (if multiple nodes share a terrain, which is currently the case for terrain types like `bar` appearing at both BA and the Visby bar).

### IX-C. The stalkModal Overlay

`stalkModal(node)` constructs and displays the Stalk overlay:

```js
function stalkModal(node) {
  const terrain = node.name;
  const hg = HUNTING_GROUNDS[terrain];
  const pool = (WORLD_DB[terrain] || WORLD_DB['midlands']).monsters;

  // Identify active quest targets for this terrain
  const activeKeys = [];
  Object.entries(S_story.quests).forEach(([qKey, status]) => {
    if (status !== 'active') return;
    const q = QUEST_DB[qKey];
    if (q && q.targetTerrain === terrain) {
      activeKeys.push(...(q.targetKeys || []));
    }
  });

  // Populate modal UI
  document.getElementById('stalk-terrain-name').textContent =
    WORLD_DB[terrain]?.label || terrain;
  document.getElementById('stalk-location-name').textContent =
    hg?.displayName || node.label;

  const targetsEl = document.getElementById('stalk-quest-targets');
  targetsEl.innerHTML = '';
  if (activeKeys.length) {
    activeKeys.forEach(key => {
      const m = MONSTER_POOL[key];
      if (m) {
        const li = document.createElement('li');
        li.textContent = m.name;
        targetsEl.appendChild(li);
      }
    });
  } else {
    targetsEl.innerHTML = '<li class="dim">No active quest targets here</li>';
  }

  // Wire the Wait for Prey button
  document.getElementById('btn-stalk-confirm').onclick = () => {
    document.getElementById('story-stalk-overlay').classList.remove('visible');
    const monster = _stalkedMonsterPick(pool, terrain, activeKeys);
    if (!monster) return;
    _corridorOnComplete = () => storyRender(NODE_MAP[S_story.currentCode]);
    S_story.pendingBattle = {
      nodeCode: node.code,
      name: monster.name,
      label: hg?.displayName || node.label,
      isStalk: true,
    };
    loadWorldMonster(monster);
    _renderPreBatt();
    document.getElementById('story-prebatt-overlay').classList.add('visible');
  };

  document.getElementById('story-stalk-overlay').classList.add('visible');
}
```

### IX-D. The _stalkedMonsterPick Function

`_stalkedMonsterPick` is the Stalk-specific variant of `_weightedMonsterPick`. Both functions share the same tier weight constants. `_stalkedMonsterPick` adds the `QUEST_BOOST` multiplier for quest-targeted monsters:

```js
function _stalkedMonsterPick(pool, terrain, activeKeys) {
  const WEIGHTS = { trivial: 35, easy: 35, medium: 25, hard: 4, deadly: 1 };
  const QUEST_BOOST = 3;
  const activeSet = new Set(activeKeys);
  const weighted = [];
  pool.forEach(m => {
    const base = WEIGHTS[m.tier] || 10;
    const w = activeSet.has(m.key) ? base * QUEST_BOOST : base;
    for (let i = 0; i < w; i++) weighted.push(m);
  });
  if (!weighted.length) return null;
  return weighted[Math.floor(Math.random() * weighted.length)];
}
```

`_weightedMonsterPick` (used by corridor Hunt) is identical except it omits the `activeSet` logic and `QUEST_BOOST`:

```js
function _weightedMonsterPick(pool) {
  const WEIGHTS = { trivial: 35, easy: 35, medium: 25, hard: 4, deadly: 1 };
  const weighted = [];
  pool.forEach(m => {
    const w = WEIGHTS[m.tier] || 10;
    for (let i = 0; i < w; i++) weighted.push(m);
  });
  if (!weighted.length) return null;
  return weighted[Math.floor(Math.random() * weighted.length)];
}
```

### IX-E. Battle Flow Integration

The Stalk encounter integrates with the existing battle pipeline identically to a corridor encounter, with `isStalk: true` on `S_story.pendingBattle` as the distinguishing flag:

```
stalkModal → _stalkedMonsterPick → loadWorldMonster
  → S_story.pendingBattle = { ..., isStalk: true }
  → _renderPreBatt() → story-prebatt-overlay (visible)
  → [START BATTLE] → combat → storyApplyOutcome(won)
    → if pb.isStalk: fire _corridorOnComplete → storyRender(currentNode)
    → if won: XP + random drop (no Codex Shard — Stalk is grinding, not story)
    → if lost: storyGameOver() or flee path
```

The `isStalk` flag in `storyApplyOutcome` distinguishes Stalk outcomes from story-node battle outcomes. A won Stalk battle does not advance the story, does not award unique loot, and does not modify `S_story.visited` for the current node (the player stays at the battleground, ready to Stalk again).

---

## X. Conclusion

### X-A. Summary of Contributions

This report has described the battleground architecture of Roll2Hit: The Shattered Codex as a structural solution to the lost-in-a-field problem in RPG design. The architecture consists of three interdependent components:

1. **HUNTING_GROUNDS** — a bijective lookup table mapping all 42 terrain types to 42 named battleground nodes, making "where do I fight X" a zero-search O(1) query.

2. **Layer 9 Circuit Corridors** — a wire-mesh navigation graph rendered on the 11×11 map viewport, eliminating open-field wandering by constraining movement to named, visually represented roads with terrain-typed encounter pools.

3. **Stalk mechanic** — a guaranteed intentional encounter trigger at designated battleground nodes, with quest-preference weighting that biases the random pool toward quest-relevant targets without eliminating tier-based variance.

### X-B. Design Principles Demonstrated

Three design principles are instantiated in this architecture:

**Principle 1: Navigation, not search.** Every question of the form "where do I find X" must be answerable by navigating to a known location, not by searching an area. The battleground system achieves this by making every terrain type addressable by name on the navigable graph.

**Principle 2: Intentional encounters are not guaranteed; guaranteed encounters are not incidental.** The corridor Hunt mechanic provides probabilistic ambient encounters — appropriate for travel. The Stalk mechanic provides guaranteed intentional encounters — appropriate for grinding. They are architecturally distinct and serve different player intents.

**Principle 3: Quest, terrain, and battleground form a closed loop.** A quest must encode its terrain type. A terrain must have exactly one designated battleground. A battleground must be reachable from the quest's activation node via the corridor network. If any link in this chain is broken, the player faces a search problem rather than a navigation problem.

### X-C. Generalization

The architecture described here is not specific to Roll2Hit. It generalizes to any game with:
- A finite set of enemy types classified by terrain or biome
- A navigable world graph (nodes + edges)
- A quest system that requires killing specific enemy types

In any such game, the battleground system — designated terrain nodes with guaranteed encounter mechanics and a lookup table connecting terrain types to node locations — eliminates the lost-in-a-field failure mode at the data structure level. The player is never lost. The prey is always findable. The quest always has an answer.

---

## References

[1] Roll2Hit project architecture documentation, `spec-world.md`, 2026-05-20. Defines `WORLD_DB`, `MONSTER_POOL`, terrain classification, and tier system.

[2] Roll2Hit Layer 9 specification, `spec-corridors.md`, 2026-05-21. Defines `CORRIDOR_CELLS`, `CORRIDOR_TERRAIN`, `buildCorridorMap()`, `storyCorridorTravel()`, junction node architecture, and `_weightedMonsterPick()`.

[3] Roll2Hit corridor plan, `plan.md`, 2026-05-21. Layer 9 implementation status, Hunt/Warp travel mode specifications, and active path highlight architecture.

[4] Roll2Hit story and quest map, `story.md`. Defines the 42-node quest structure, NODE_MAP codes, terrain coverage checklist, and EPIC token (Codex Shard) flow.

[5] Roll2Hit world reference, `world.md`. Defines quest motivation architecture, faction structure, condition item system, and NPC profiles.

[6] Roll2Hit implementation, `roll2hit-v3.html`, 6,330+ lines. Single-file source containing all data structures, logic, and markup referenced in this report.

[7] Wizards of the Coast, *Systems Reference Document 5.1*, Creative Commons Attribution 4.0, 2023. Monster stat-block conventions (AC, HP, attack bonus, damage dice) underlying `MONSTER_POOL` entries.

[8] ECMA International, *ECMAScript 2022 Language Specification*, ECMA-262, 13th Edition, June 2022. JavaScript language features (const, Set, Object.entries, arrow functions) used throughout the implementation.

---

## Appendix A — Terrain-to-Node Coverage Table (Complete)

| # | WORLD_DB Terrain Key | NODE_MAP Code | Battleground Display Name | Act |
|---|---|---|---|---|
| 1 | city | CI | The Thieves' Den | I |
| 2 | alley | AL | Visby Dark Alleys | II |
| 3 | docks | DK | Tilbury Harbor | II |
| 4 | market_quarter | MQ | The Market Quarter | II |
| 5 | blacksmith_qtr | BQ | Weimar Forge District | VI |
| 6 | scholars_qtr | SQ | Ivory Circle Quarter | VI |
| 7 | cyberpunk_streets | CY | Neon Undercity | I |
| 8 | storefront | SF | Tilbury Storefronts | II |
| 9 | bar | BA | Broken Tooth Tavern | V |
| 10 | inn | IN | Birka Inn | I |
| 11 | tavern | TV | Birka Tavern Row | I |
| 12 | outhouse | OU | Observatory Outhouse | VI |
| 13 | merchant_ship | MS | Tilbury Star | II |
| 14 | crypt | CR | Birka Undercrypt | I |
| 15 | catacombs | CA | Scholar Kings' Catacombs | V |
| 16 | vampire_castle | VC | Mourne's Castle | V |
| 17 | sewers | SE | Visby Sewer Underbelly | V |
| 18 | goblin_cave | GC | Goblin Warrens | V |
| 19 | pirate_cave | PC | Visby Pirate Caves | V |
| 20 | monster_cave | MC | Zeugl's Den | V |
| 21 | sea_cavern | SC | Scholar Kings' Sea Cavern | IV |
| 22 | forest | FO | Aldric's Forest | III |
| 23 | jungle | JU | Dense Jungle Road | VI |
| 24 | swamp | SW | Murky Swamp | III |
| 25 | hag_swamp | HS | Crones' Domain | III |
| 26 | beach | BE | Tropical Beach | III |
| 27 | midlands | MI | Plains & Midlands | III |
| 28 | highlands | HL | Irish Highlands | III |
| 29 | desert | DE | Desert Wastes | VI |
| 30 | desert_caravan | DC | Izador's Caravan Route | VI |
| 31 | mountains | MT | Weimar Pass | VI |
| 32 | arctic | AR | Arctic Wastes | VII |
| 33 | ocean | OC | Open Ocean | IV |
| 34 | islands | IS | Island Shore | IV |
| 35 | atlantis | AT | Sunken Atlantis | IV |
| 36 | freshwater_lake | FL | River Lake | IV |
| 37 | deep_sea | DS | Deep Sea Trench | IV |
| 38 | greek_agora | GA | Greek Agora Ruins | VII |
| 39 | camelot | KT | Camelot Ruins | VII |
| 40 | oriental_palace | OP | Oriental Dragon Palace | VII |
| 41 | heavenly_clouds | HC | Heavenly Cloud Road | VII |
| 42 | cosmic_realm | CO | Cosmic Convergence | VIII |

**Total:** 42 terrain types, 42 battleground nodes, 100% terrain coverage.

---

## Appendix B — XP Layer Comparison

| Property | Story Layer | Battleground Layer | Corridor Layer |
|---|---|---|---|
| Trigger | Node arrival + scripted condition | Stalk button (player-initiated) | Hunt button (player-initiated) |
| Encounter probability | 100% (scripted) | 100% (guaranteed) | 10–90% (quest-scaled) |
| Enemy source | Named specific enemy | `WORLD_DB[terrain].monsters` | `WORLD_DB[corridorTerrain].monsters` |
| Quest-preference boost | N/A | Yes (3×) | No |
| Repeatability | One-shot per node | Infinite | Infinite |
| Loot type | Unique item / Codex Shard | Random terrain drop | Random terrain drop |
| Day cost | 0 | 0 | 0 |
| Void Tide advance | Contextual | No | No |
| Player intent | Follow the story | Grind for XP / quest targets | Ambient encounter on the road |

---

## Appendix C — Wire Glyph Reference

The corridor wire mesh uses standard Unicode box-drawing characters, computed by `_wireGlyph(dirs)`:

| Dir Set (sorted) | Glyph | Description |
|---|---|---|
| E,W | `─` | Horizontal through |
| N,S | `│` | Vertical through |
| E,N | `└` | Corner: from south, exits east |
| N,W | `┘` | Corner: from south, exits west |
| E,S | `┌` | Corner: from north, exits east |
| S,W | `┐` | Corner: from north, exits west |
| E,N,S | `├` | T-junction: west wall |
| N,S,W | `┤` | T-junction: east wall |
| E,N,W | `┴` | T-junction: south entrance |
| E,S,W | `┬` | T-junction: north entrance |
| E,N,S,W | `┼` | Crossing / four-way |

Active (last-traveled) corridor cells render in `var(--gold-lt)` with `text-shadow: 0 0 6px var(--gold)`. Visited corridor cells (both endpoint nodes visited) render in `#5a5aaa`. Unvisited corridor cells render in `#2a2a4a` at 50% opacity.

---

*Document complete.*  
*Roll2Hit: The Shattered Codex — single-file HTML RPG, `roll2hit-v3.html`*  
*MIT License — Copyright (c) 2026 roll2hit.com*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
