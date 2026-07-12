<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# roll2hit — World Engine Architecture Specification
### Phase 3 Combat Utility Extension & Terrain-Based Monster Catalog System
**Document:** spec-world.md  
**Revision:** 1.0 — 2026-05-20  
**Project:** roll2hit.com — single-file combat assistant  

---

## Abstract

This document specifies the software architecture for Phase 3 of the roll2hit combat assistant: a browser-native, zero-dependency dice roller that executes entirely inside a single self-contained HTML file. Phase 3 introduces ten incremental feature additions (S1–S10) culminating in S11, a terrain-stratified world encounter system. The world engine partitions 329 unique monster stat-blocks across 42 terrain categories (expanded from the original 16 during later layers), exposes them through a two-level cascading dropdown UI, and integrates with the existing HP-tracking and dice-animation subsystems. This document covers data model design, interface architecture, the monster catalog, incremental implementation ordering, and forward-compatibility considerations. Code samples are given in ES2022 JavaScript; type annotations follow JSDoc convention.

> **Current state (2026-05-24):** MONSTER_POOL has grown to **370 entries**; WORLD_DB has **46 base + 20 epic = 66 terrain entries**. The 329/42 figures in this document reflect the Phase 3 snapshot. See `monsters.md` for live counts.

**Keywords:** encounter generation, terrain classification, cascading dropdown, single-page application, game engine, monster database, combat simulation

---

## I. Introduction

### I-A. Background

roll2hit is a self-contained single-file web application designed to assist a DM or player in executing combat mechanics at the table without requiring an internet connection, a login, or an app store. The entire runtime — markup, styles, state, and logic — is shipped as one `.html` file (6,700 lines at Layers 0–10; ~14,377 lines at current Layer 37). Phase 1 established core mechanics (d20 attack roll, damage, adv/dis mirror logic). Phase 2 introduced a 3-column arena layout, die-face SVG animation, history cards, and a per-die roll histogram. Phase 3 extends the tool with combat-state utilities (conditions, death saves, multi-attack, sneak attack, resistance/vulnerability, healing, initiative, on-die display, damage multiplier) and a world encounter engine that provides terrain-classified monster presets.

### I-B. Design Constraints

1. **Single-file deployment** — all data, style, and logic must remain in one `.html` file. No CDN, no `fetch()`, no build step.
2. **Zero network dependency** — all monster data is inlined as static JS object literals.
3. **Table-speed UX** — every action must be reachable in one click or one dropdown change during live play. No character-sheet registration, no account.
4. **Rules fidelity** — stat-blocks, tier assignments, and mechanical interactions (crit doubling, off-hand no-mod, sneak attack count by level, death-save nat-1/nat-20 rules) must be internally consistent.
5. **Incremental shippability** — each feature step (S1–S11) leaves the file in a fully working state with no regressions.

### I-C. Scope of This Document

- Full specification of the `WORLD_DB` data structure and terrain classification system (Section III)
- Complete monster catalog with stat-blocks for all 42 terrain categories (Section V; 329 monsters at Phase 3 — now 370; see `monsters.md`)
- UI architecture for the cascading terrain/monster dropdown (Section IV)
- Ordered implementation plan for Steps S1–S11 (Section VI)
- Forward-compatibility notes for a hypothetical multi-file v4 refactor (Section VII)

---

## II. System Architecture

### II-A. Component Model

The Phase 3 runtime is organized into seven logical subsystems. All subsystems share a single mutable state object `S` and communicate through direct function calls (no event bus, no reactive framework).

```
┌─────────────────────────────────────────────────────────────────┐
│                        roll2hit-v3.html                         │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │  STATE   │  │  DICE    │  │ ANIMATION │  │   HISTORY    │  │
│  │  S { }   │  │ ENGINE   │  │  ENGINE   │  │   CARDS      │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └──────┬───────┘  │
│       │             │              │                │           │
│  ┌────▼─────────────▼──────────────▼────────────────▼───────┐  │
│  │                    ROLL ACTIONS                           │  │
│  │  playerRoll · rollMainDamage · offhandRoll · oppRoll      │  │
│  │  rollInitiative · rollDeathSave · healRoll · bonusRoll    │  │
│  └────────────────────────────────┬──────────────────────────┘  │
│                                   │                             │
│  ┌────────────────────────────────▼──────────────────────────┐  │
│  │                   UI LAYER                                 │  │
│  │  left-panel · arena zones · config-scroll · history-panel │  │
│  └────────────────────────────────┬──────────────────────────┘  │
│                                   │                             │
│  ┌────────────────────────────────▼──────────────────────────┐  │
│  │                 WORLD ENGINE  (NEW — S11)                  │  │
│  │  WORLD_DB · populateTerrainEnemies · loadWorldMonster      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### II-B. State Object Schema (Phase 3 target)

```js
const S = {
  // ── core ──────────────────────────────────────────────
  round:        Number,   // increments on each oppRoll
  rollMode:     String,   // 'attack' | 'skill' | 'save'
  autoDamage:   Boolean,  // damage reduces HP when true
  lastHit:      { hit: Boolean, crit: Boolean, nat1: Boolean },
  dmgNotes:     { you: Array, opp: Array },
  dmgMultiplier: Number,  // S3 — 1|2|3|4

  // ── combatants ────────────────────────────────────────
  player: { adv: String, hp: Number, maxHp: Number, dmgMod: Number },
  opp:    { adv: String, hp: Number, maxHp: Number, dmgMod: Number },

  // ── character stats ───────────────────────────────────
  char: {
    level: Number, prof: Number, profOverride: Boolean, ac: Number,
    maxHp: Number, str: Number, dex: Number, con: Number,
    int: Number, wis: Number, cha: Number,
  },

  // ── equipment ─────────────────────────────────────────
  weapon:  { die: Number, count: Number, flatMod: Number, finesse: Boolean, prof: Boolean },
  offhand: { die: Number, count: Number, shield: Boolean },
  bonus:   { die: Number, count: Number, exploding: Boolean },
  heal:    { die: Number, count: Number, flatMod: Number },         // S5

  // ── class features ────────────────────────────────────
  sneak: { enabled: Boolean, active: Boolean, count: Number },      // S8
  multiAttack: Number,                                              // S9 — 1..4
  currentAttack: Number,

  // ── conditions ────────────────────────────────────────
  opp_condition:    String,   // S6 — 'none' | condition key
  player_condition: String,

  // ── death saves ───────────────────────────────────────
  deathSaves: { active: Boolean, successes: Number, failures: Number }, // S7

  // ── world engine ──────────────────────────────────────
  terrain: String,            // S11 — terrain key

  // ── enemy definition ──────────────────────────────────
  enemy: {
    key: String, name: String, ac: Number, maxHp: Number, atk: Number,
    dmgDie: Number, dmgCount: Number, dmgFlat: Number,
  },

  // ── histogram ─────────────────────────────────────────
  histoData: { 4:[], 6:[], 8:[], 10:[], 12:[], 20:[], 100:[] },
};
```

### II-C. Data Flow

All mutation follows the pattern:

```
User event → handler fn → mutate S → refresh display fn(s)
```

No two-way binding, no virtual DOM diffing. Display functions (`refreshLeftPanel`, `renderHistogram`, `appendCard`) are idempotent given the same `S` state. Roll actions are the only place HP changes; display functions never mutate state.

---

## III. World Data Model

### III-A. Monster Stat-Block Interface

Each monster entry is a plain JS object matching this interface:

```js
/**
 * @typedef {Object} MonsterEntry
 * @property {string}  key      — unique slug, snake_case
 * @property {string}  name     — display name
 * @property {number}  ac       — Armor Class
 * @property {number}  hp       — Hit Points (max)
 * @property {number}  atk      — attack bonus (d20 + atk vs player AC)
 * @property {number}  dmgDie   — damage die sides (4|6|8|10|12)
 * @property {number}  dmgCount — number of damage dice
 * @property {number}  dmgFlat  — flat damage modifier
 * @property {string}  tier     — 'trivial'|'easy'|'medium'|'hard'|'deadly'
 * @property {string}  [note]   — optional special mechanic reminder
 */
```

### III-B. Terrain Entry Interface

```js
/**
 * @typedef {Object} TerrainEntry
 * @property {string}          label    — display name shown in dropdown
 * @property {string}          icon     — single emoji prefix
 * @property {MonsterEntry[]}  monsters — sorted by AC asc within each tier
 */
```

### III-C. WORLD_DB Top-Level Structure

```js
/** @type {Object.<string, TerrainEntry>} */
const WORLD_DB = {
  city:           { label: 'City Streets',     icon: '🏙',  monsters: [...] },
  alley:          { label: 'Dark Alley',        icon: '🌑',  monsters: [...] },
  storefront:     { label: 'Market District',   icon: '🏪',  monsters: [...] },
  bar:            { label: 'Tavern Brawl',      icon: '🍺',  monsters: [...] },
  inn:            { label: 'Inn — Night',       icon: '🛏',  monsters: [...] },
  tavern:         { label: 'Tavern — Common',   icon: '🍷',  monsters: [...] },
  outhouse:       { label: 'Outhouse / Privy',  icon: '🪣',  monsters: [...] },
  sewers:         { label: 'Sewer Underbelly',  icon: '🐀',  monsters: [...] },
  crypt:          { label: 'Crypt',             icon: '⚰',   monsters: [...] },
  catacombs:      { label: 'Catacombs',         icon: '💀',  monsters: [...] },
  forest:         { label: 'Forest / Trees',    icon: '🌲',  monsters: [...] },
  desert:         { label: 'Desert Wastes',     icon: '🏜',  monsters: [...] },
  ocean:          { label: 'Ocean Depths',      icon: '🌊',  monsters: [...] },
  islands:        { label: 'Island Shore',      icon: '🏝',  monsters: [...] },
  arctic:         { label: 'Arctic Wastes',     icon: '❄',   monsters: [...] },
  heavenly_clouds:{ label: 'Heavenly Clouds',   icon: '☁',   monsters: [...] },
};
```

### III-D. Tier Classification

Tier labels map to challenge rating bands and intended party level:

| Tier | CR Band | Typical AC | Typical HP | `optgroup` label |
|---|---|---|---|---|
| `trivial` | CR 0 – ¼ | ≤ 12 | ≤ 15 | `⬥ Trivial` |
| `easy` | CR ½ – 1 | 10 – 14 | 5 – 35 | `◈ Easy` |
| `medium` | CR 2 – 5 | 11 – 16 | 22 – 100 | `◆ Medium` |
| `hard` | CR 6 – 11 | 13 – 18 | 65 – 180 | `◉ Hard` |
| `deadly` | CR 12+ | 15 – 22 | 135 – 546 | `★ Deadly` |

Within each tier the monsters array is sorted ascending by `ac`, then by `hp` as a tiebreaker.

### III-E. Sorting Algorithm

```js
/**
 * Sort a terrain's monster array: tier order first, then AC asc, then HP asc.
 * @param {MonsterEntry[]} arr
 * @returns {MonsterEntry[]}
 */
function sortMonsters(arr) {
  const T = { trivial: 0, easy: 1, medium: 2, hard: 3, deadly: 4 };
  return [...arr].sort((a, b) =>
    T[a.tier] - T[b.tier] || a.ac - b.ac || a.hp - b.hp
  );
}
```

### III-F. Monster Reuse Strategy

Many monsters appear in multiple terrains (e.g., `wolf` appears in `forest`, `arctic`, and `islands`). Rather than duplicating object literals, a shared **master pool** (`MONSTER_POOL`) is defined once and terrain arrays are assembled by reference:

```js
// Master pool — defined once
const MONSTER_POOL = {
  commoner:        { key:'commoner',        name:'Commoner',         ac:10, hp:4,   atk:2,  dmgDie:4,  dmgCount:1, dmgFlat:0,  tier:'trivial' },
  kobold:          { key:'kobold',          name:'Kobold',           ac:12, hp:5,   atk:4,  dmgDie:4,  dmgCount:1, dmgFlat:2,  tier:'trivial' },
  needle_blight:   { key:'needle_blight',   name:'Needle Blight',    ac:12, hp:11,  atk:3,  dmgDie:4,  dmgCount:1, dmgFlat:1,  tier:'trivial' },
  lemure:          { key:'lemure',          name:'Lemure',           ac:7,  hp:10,  atk:3,  dmgDie:6,  dmgCount:1, dmgFlat:1,  tier:'trivial' },

  bandit:          { key:'bandit',          name:'Bandit',           ac:12, hp:11,  atk:3,  dmgDie:6,  dmgCount:1, dmgFlat:1,  tier:'easy' },
  giant_rat:       { key:'giant_rat',       name:'Giant Rat',        ac:12, hp:7,   atk:4,  dmgDie:4,  dmgCount:1, dmgFlat:2,  tier:'easy' },
  skeleton:        { key:'skeleton',        name:'Skeleton',         ac:13, hp:13,  atk:4,  dmgDie:6,  dmgCount:1, dmgFlat:2,  tier:'easy' },
  zombie:          { key:'zombie',          name:'Zombie',           ac:8,  hp:22,  atk:3,  dmgDie:6,  dmgCount:1, dmgFlat:1,  tier:'easy' },
  thug:            { key:'thug',            name:'Thug',             ac:11, hp:32,  atk:4,  dmgDie:6,  dmgCount:2, dmgFlat:2,  tier:'easy' },
  wolf:            { key:'wolf',            name:'Wolf',             ac:13, hp:11,  atk:4,  dmgDie:4,  dmgCount:2, dmgFlat:2,  tier:'easy' },
  goblin:          { key:'goblin',          name:'Goblin',           ac:15, hp:7,   atk:4,  dmgDie:6,  dmgCount:1, dmgFlat:2,  tier:'easy' },
  imp:             { key:'imp',             name:'Imp (disguised)',  ac:13, hp:10,  atk:5,  dmgDie:4,  dmgCount:1, dmgFlat:3,  tier:'easy' },
  shadow:          { key:'shadow',          name:'Shadow',           ac:12, hp:16,  atk:4,  dmgDie:6,  dmgCount:2, dmgFlat:2,  tier:'easy' },
  spy:             { key:'spy',             name:'Spy',              ac:12, hp:27,  atk:4,  dmgDie:6,  dmgCount:1, dmgFlat:3,  tier:'easy' },
  aarakocra:       { key:'aarakocra',       name:'Aarakocra',        ac:12, hp:13,  atk:4,  dmgDie:4,  dmgCount:2, dmgFlat:2,  tier:'easy' },
  merfolk:         { key:'merfolk',         name:'Merfolk',          ac:11, hp:11,  atk:3,  dmgDie:6,  dmgCount:1, dmgFlat:1,  tier:'easy' },
  ice_mephit:      { key:'ice_mephit',      name:'Ice Mephit',       ac:11, hp:21,  atk:3,  dmgDie:6,  dmgCount:1, dmgFlat:1,  tier:'easy' },
  homunculus:      { key:'homunculus',      name:'Homunculus',       ac:13, hp:5,   atk:4,  dmgDie:4,  dmgCount:1, dmgFlat:2,  tier:'easy' },
  kenku:           { key:'kenku',           name:'Kenku',            ac:13, hp:13,  atk:4,  dmgDie:6,  dmgCount:1, dmgFlat:2,  tier:'easy' },
  jackalwere:      { key:'jackalwere',      name:'Jackalwere',       ac:12, hp:18,  atk:4,  dmgDie:4,  dmgCount:1, dmgFlat:2,  tier:'easy' },
  hippogriff:      { key:'hippogriff',      name:'Hippogriff',       ac:11, hp:19,  atk:5,  dmgDie:4,  dmgCount:2, dmgFlat:3,  tier:'easy' },

  orc:             { key:'orc',             name:'Orc',              ac:13, hp:15,  atk:5,  dmgDie:12, dmgCount:1, dmgFlat:3,  tier:'medium' },
  ghoul:           { key:'ghoul',           name:'Ghoul',            ac:12, hp:22,  atk:2,  dmgDie:6,  dmgCount:2, dmgFlat:3,  tier:'medium' },
  specter:         { key:'specter',         name:'Specter',          ac:12, hp:22,  atk:4,  dmgDie:6,  dmgCount:3, dmgFlat:0,  tier:'medium' },
  wererat:         { key:'wererat',         name:'Wererat',          ac:12, hp:33,  atk:4,  dmgDie:6,  dmgCount:1, dmgFlat:2,  tier:'medium' },
  gnoll:           { key:'gnoll',           name:'Gnoll',            ac:15, hp:22,  atk:4,  dmgDie:6,  dmgCount:2, dmgFlat:2,  tier:'medium' },
  giant_spider:    { key:'giant_spider',    name:'Giant Spider',     ac:14, hp:26,  atk:5,  dmgDie:8,  dmgCount:1, dmgFlat:3,  tier:'medium' },
  ghast:           { key:'ghast',           name:'Ghast',            ac:13, hp:36,  atk:5,  dmgDie:6,  dmgCount:2, dmgFlat:3,  tier:'medium' },
  hobgoblin:       { key:'hobgoblin',       name:'Hobgoblin',        ac:18, hp:11,  atk:3,  dmgDie:8,  dmgCount:1, dmgFlat:1,  tier:'medium' },
  mimic:           { key:'mimic',           name:'Mimic',            ac:12, hp:58,  atk:5,  dmgDie:8,  dmgCount:1, dmgFlat:3,  tier:'medium' },
  intellect_dev:   { key:'intellect_dev',   name:'Intellect Devourer',ac:12,hp:21, atk:5,  dmgDie:10, dmgCount:1, dmgFlat:3,  tier:'medium' },
  dire_wolf:       { key:'dire_wolf',       name:'Dire Wolf',        ac:14, hp:37,  atk:5,  dmgDie:6,  dmgCount:2, dmgFlat:3,  tier:'medium' },
  wight:           { key:'wight',           name:'Wight',            ac:14, hp:45,  atk:4,  dmgDie:6,  dmgCount:2, dmgFlat:3,  tier:'medium' },
  gargoyle:        { key:'gargoyle',        name:'Gargoyle',         ac:15, hp:52,  atk:4,  dmgDie:6,  dmgCount:1, dmgFlat:2,  tier:'medium' },
  doppelganger:    { key:'doppelganger',    name:'Doppelganger',     ac:14, hp:52,  atk:6,  dmgDie:6,  dmgCount:2, dmgFlat:4,  tier:'medium' },
  harpy:           { key:'harpy',           name:'Harpy',            ac:11, hp:38,  atk:3,  dmgDie:4,  dmgCount:2, dmgFlat:1,  tier:'medium' },
  brown_bear:      { key:'brown_bear',      name:'Brown Bear',       ac:11, hp:34,  atk:5,  dmgDie:6,  dmgCount:2, dmgFlat:4,  tier:'medium' },
  succubus:        { key:'succubus',        name:'Succubus/Incubus', ac:13, hp:66,  atk:5,  dmgDie:6,  dmgCount:1, dmgFlat:3,  tier:'medium' },
  cult_fanatic:    { key:'cult_fanatic',    name:'Cult Fanatic',     ac:13, hp:33,  atk:5,  dmgDie:6,  dmgCount:2, dmgFlat:2,  tier:'medium' },
  berserker:       { key:'berserker',       name:'Berserker',        ac:13, hp:67,  atk:5,  dmgDie:6,  dmgCount:2, dmgFlat:3,  tier:'medium' },
  ghost:           { key:'ghost',           name:'Ghost',            ac:11, hp:45,  atk:5,  dmgDie:6,  dmgCount:4, dmgFlat:0,  tier:'medium' },
  sea_hag:         { key:'sea_hag',         name:'Sea Hag',          ac:14, hp:52,  atk:3,  dmgDie:6,  dmgCount:2, dmgFlat:3,  tier:'medium' },
  sahuagin:        { key:'sahuagin',        name:'Sahuagin',         ac:12, hp:22,  atk:3,  dmgDie:4,  dmgCount:2, dmgFlat:1,  tier:'medium' },
  merrow:          { key:'merrow',          name:'Merrow',           ac:13, hp:45,  atk:6,  dmgDie:6,  dmgCount:2, dmgFlat:4,  tier:'medium' },
  giant_octopus:   { key:'giant_octopus',   name:'Giant Octopus',    ac:11, hp:52,  atk:5,  dmgDie:6,  dmgCount:2, dmgFlat:4,  tier:'medium' },
  lizardfolk:      { key:'lizardfolk',      name:'Lizardfolk',       ac:15, hp:22,  atk:4,  dmgDie:6,  dmgCount:2, dmgFlat:2,  tier:'medium' },
  owlbear:         { key:'owlbear',         name:'Owlbear',          ac:13, hp:59,  atk:7,  dmgDie:8,  dmgCount:2, dmgFlat:5,  tier:'medium' },
  ankheg:          { key:'ankheg',          name:'Ankheg',           ac:14, hp:39,  atk:5,  dmgDie:6,  dmgCount:2, dmgFlat:4,  tier:'medium' },
  giant_scorpion:  { key:'giant_scorpion',  name:'Giant Scorpion',   ac:15, hp:52,  atk:4,  dmgDie:8,  dmgCount:1, dmgFlat:2,  tier:'medium' },
  yuan_ti:         { key:'yuan_ti',         name:'Yuan-ti Pureblood',ac:11, hp:40,  atk:5,  dmgDie:6,  dmgCount:2, dmgFlat:3,  tier:'medium' },
  centaur:         { key:'centaur',         name:'Centaur',          ac:12, hp:45,  atk:6,  dmgDie:10, dmgCount:2, dmgFlat:4,  tier:'medium' },
  pegasus:         { key:'pegasus',         name:'Pegasus',          ac:12, hp:59,  atk:6,  dmgDie:6,  dmgCount:2, dmgFlat:4,  tier:'medium' },
  griffon:         { key:'griffon',         name:'Griffon',          ac:12, hp:59,  atk:6,  dmgDie:6,  dmgCount:2, dmgFlat:4,  tier:'medium' },
  displacer_beast: { key:'displacer_beast', name:'Displacer Beast',  ac:13, hp:85,  atk:6,  dmgDie:6,  dmgCount:2, dmgFlat:4,  tier:'medium' },
  werewolf:        { key:'werewolf',        name:'Werewolf',         ac:11, hp:58,  atk:4,  dmgDie:6,  dmgCount:2, dmgFlat:2,  tier:'medium' },
  wereboar:        { key:'wereboar',        name:'Wereboar',         ac:11, hp:78,  atk:5,  dmgDie:6,  dmgCount:2, dmgFlat:3,  tier:'medium' },
  yeti:            { key:'yeti',            name:'Yeti',             ac:12, hp:51,  atk:5,  dmgDie:6,  dmgCount:2, dmgFlat:4,  tier:'medium' },
  winter_wolf:     { key:'winter_wolf',     name:'Winter Wolf',      ac:13, hp:75,  atk:5,  dmgDie:6,  dmgCount:2, dmgFlat:5,  tier:'medium' },
  allosaurus:      { key:'allosaurus',      name:'Allosaurus',       ac:13, hp:51,  atk:6,  dmgDie:6,  dmgCount:2, dmgFlat:5,  tier:'medium' },
  water_weird:     { key:'water_weird',     name:'Water Weird',      ac:13, hp:58,  atk:3,  dmgDie:8,  dmgCount:3, dmgFlat:0,  tier:'medium' },
  revenant:        { key:'revenant',        name:'Revenant',         ac:13, hp:136, atk:7,  dmgDie:6,  dmgCount:2, dmgFlat:4,  tier:'medium' },
  manticore:       { key:'manticore',       name:'Manticore',        ac:14, hp:68,  atk:5,  dmgDie:8,  dmgCount:2, dmgFlat:3,  tier:'medium' },
  lamia:           { key:'lamia',           name:'Lamia',            ac:13, hp:97,  atk:5,  dmgDie:10, dmgCount:2, dmgFlat:3,  tier:'medium' },
  green_hag:       { key:'green_hag',       name:'Green Hag',        ac:17, hp:82,  atk:6,  dmgDie:8,  dmgCount:2, dmgFlat:3,  tier:'medium' },
  wraith:          { key:'wraith',          name:'Wraith',           ac:13, hp:67,  atk:6,  dmgDie:6,  dmgCount:4, dmgFlat:0,  tier:'medium' },
  cyclops:         { key:'cyclops',         name:'Cyclops',          ac:14, hp:138, atk:7,  dmgDie:10, dmgCount:3, dmgFlat:6,  tier:'medium' },

  bandit_captain:  { key:'bandit_captain',  name:'Bandit Captain',   ac:15, hp:65,  atk:6,  dmgDie:6,  dmgCount:3, dmgFlat:3,  tier:'hard' },
  vampire_spawn:   { key:'vampire_spawn',   name:'Vampire Spawn',    ac:15, hp:82,  atk:6,  dmgDie:6,  dmgCount:2, dmgFlat:3,  tier:'hard' },
  mummy:           { key:'mummy',           name:'Mummy',            ac:11, hp:58,  atk:5,  dmgDie:6,  dmgCount:2, dmgFlat:3,  tier:'hard' },
  troll:           { key:'troll',           name:'Troll',            ac:15, hp:84,  atk:7,  dmgDie:6,  dmgCount:2, dmgFlat:4,  tier:'hard' },
  wyvern:          { key:'wyvern',          name:'Wyvern',           ac:13, hp:110, atk:7,  dmgDie:6,  dmgCount:2, dmgFlat:4,  tier:'hard' },
  assassin:        { key:'assassin',        name:'Assassin',         ac:15, hp:78,  atk:7,  dmgDie:6,  dmgCount:2, dmgFlat:4,  tier:'hard' },
  veteran:         { key:'veteran',         name:'Veteran',          ac:17, hp:58,  atk:5,  dmgDie:8,  dmgCount:1, dmgFlat:3,  tier:'hard' },
  gladiator:       { key:'gladiator',       name:'Gladiator',        ac:16, hp:112, atk:7,  dmgDie:8,  dmgCount:2, dmgFlat:4,  tier:'hard' },
  knight:          { key:'knight',          name:'Knight',           ac:18, hp:52,  atk:5,  dmgDie:8,  dmgCount:2, dmgFlat:3,  tier:'hard' },
  night_hag:       { key:'night_hag',       name:'Night Hag',        ac:17, hp:112, atk:7,  dmgDie:6,  dmgCount:4, dmgFlat:2,  tier:'hard' },
  polar_bear:      { key:'polar_bear',      name:'Polar Bear',       ac:12, hp:42,  atk:7,  dmgDie:6,  dmgCount:2, dmgFlat:5,  tier:'hard' },
  young_remorhaz:  { key:'young_remorhaz',  name:'Young Remorhaz',   ac:14, hp:93,  atk:5,  dmgDie:6,  dmgCount:3, dmgFlat:4,  tier:'hard' },
  treant:          { key:'treant',          name:'Treant',           ac:16, hp:138, atk:10, dmgDie:6,  dmgCount:3, dmgFlat:8,  tier:'hard' },
  abom_yeti:       { key:'abom_yeti',       name:'Abominable Yeti',  ac:15, hp:137, atk:8,  dmgDie:10, dmgCount:2, dmgFlat:7,  tier:'hard' },
  frost_giant:     { key:'frost_giant',     name:'Frost Giant',      ac:15, hp:138, atk:9,  dmgDie:6,  dmgCount:4, dmgFlat:7,  tier:'hard' },
  wy_white_dragon: { key:'wy_white_dragon', name:'Young White Dragon',ac:17,hp:133, atk:7,  dmgDie:6,  dmgCount:2, dmgFlat:4,  tier:'hard' },
  hunter_shark:    { key:'hunter_shark',    name:'Hunter Shark',     ac:12, hp:45,  atk:6,  dmgDie:6,  dmgCount:3, dmgFlat:4,  tier:'hard' },
  t_rex:           { key:'t_rex',           name:'T-Rex',            ac:13, hp:136, atk:10, dmgDie:12, dmgCount:4, dmgFlat:7,  tier:'hard' },
  deva:            { key:'deva',            name:'Deva (Angel)',      ac:17, hp:136, atk:9,  dmgDie:8,  dmgCount:2, dmgFlat:7,  tier:'hard' },
  cloud_giant:     { key:'cloud_giant',     name:'Cloud Giant',      ac:14, hp:200, atk:12, dmgDie:8,  dmgCount:3, dmgFlat:8,  tier:'hard' },
  aboleth:         { key:'aboleth',         name:'Aboleth',          ac:17, hp:135, atk:9,  dmgDie:6,  dmgCount:2, dmgFlat:6,  tier:'hard' },

  stone_golem:     { key:'stone_golem',     name:'Stone Golem',      ac:17, hp:178, atk:7,  dmgDie:10, dmgCount:2, dmgFlat:5,  tier:'deadly' },
  vampire:         { key:'vampire',         name:'Vampire',          ac:16, hp:144, atk:9,  dmgDie:6,  dmgCount:2, dmgFlat:5,  tier:'deadly' },
  mummy_lord:      { key:'mummy_lord',      name:'Mummy Lord',       ac:17, hp:97,  atk:9,  dmgDie:8,  dmgCount:2, dmgFlat:5,  tier:'deadly' },
  lich:            { key:'lich',            name:'Lich',             ac:17, hp:135, atk:12, dmgDie:8,  dmgCount:4, dmgFlat:0,  tier:'deadly' },
  death_knight:    { key:'death_knight',    name:'Death Knight',     ac:20, hp:180, atk:11, dmgDie:6,  dmgCount:3, dmgFlat:8,  tier:'deadly' },
  marid:           { key:'marid',           name:'Marid (Genie)',     ac:17, hp:229, atk:9,  dmgDie:6,  dmgCount:2, dmgFlat:9,  tier:'deadly' },
  adult_blue:      { key:'adult_blue',      name:'Adult Blue Dragon', ac:19, hp:225, atk:12, dmgDie:10, dmgCount:3, dmgFlat:6,  tier:'deadly' },
  storm_giant:     { key:'storm_giant',     name:'Storm Giant',      ac:16, hp:230, atk:14, dmgDie:6,  dmgCount:6, dmgFlat:9,  tier:'deadly' },
  planetar:        { key:'planetar',        name:'Planetar (Angel)', ac:19, hp:200, atk:12, dmgDie:8,  dmgCount:4, dmgFlat:8,  tier:'deadly' },
  adult_silver:    { key:'adult_silver',    name:'Adult Silver Dragon',ac:19,hp:243,atk:13, dmgDie:10, dmgCount:2, dmgFlat:7,  tier:'deadly' },
  dragon_turtle:   { key:'dragon_turtle',   name:'Dragon Turtle',    ac:20, hp:341, atk:13, dmgDie:12, dmgCount:4, dmgFlat:7,  tier:'deadly' },
  kraken:          { key:'kraken',          name:'Kraken',           ac:18, hp:472, atk:17, dmgDie:8,  dmgCount:3, dmgFlat:10, tier:'deadly' },
  ancient_dragon:  { key:'ancient_dragon',  name:'Ancient Dragon',   ac:22, hp:546, atk:17, dmgDie:12, dmgCount:3, dmgFlat:8,  tier:'deadly' },
};
```

---

## IV. Interface Design

### IV-A. Cascading Dropdown Architecture

The terrain/monster selector replaces the existing flat `<select id="enemy-select">` with a two-row cascade. The first row selects terrain; the second row filters and re-renders monster options.

```
Config Panel — Opponent Section
┌─────────────────────────────────────────────────┐
│  Encounter Location                             │
│  [🏙 City Streets          ▾]  ← terrain-select │
│                                                 │
│  Select Monster                                 │
│  [ ── ⬥ Trivial ──────────  ]  ← optgroup      │
│  [ Commoner  AC10  HP4      ]                   │
│  [ ── ◈ Easy ─────────────  ]                   │
│  [ Bandit    AC12  HP11     ]                   │
│  [ Spy       AC12  HP27     ]                   │
│  [ ── ◆ Medium ────────────  ]                  │
│  [ Wererat   AC12  HP33     ]                   │
│  [ Doppelg.  AC14  HP52     ]                   │
│  [ Gargoyle  AC15  HP52  ▾  ]  ← monster-select │
│                                                 │
│  [  OR use Favorites preset: ──── ▾ ]           │
└─────────────────────────────────────────────────┘
```

### IV-B. HTML Structure

```html
<!-- Terrain cascade — replaces existing enemy-select row -->
<div class="cfg-field">
  <label>Encounter Location</label>
  <select id="terrain-select">
    <option value="">— choose terrain —</option>
    <option value="city">🏙 City Streets</option>
    <option value="alley">🌑 Dark Alley</option>
    <option value="storefront">🏪 Market District</option>
    <option value="bar">🍺 Tavern Brawl</option>
    <option value="inn">🛏 Inn — Night</option>
    <option value="tavern">🍷 Tavern — Common Room</option>
    <option value="outhouse">🪣 Outhouse / Privy</option>
    <option value="sewers">🐀 Sewer Underbelly</option>
    <option value="crypt">⚰ Crypt</option>
    <option value="catacombs">💀 Catacombs</option>
    <option value="forest">🌲 Forest / Trees</option>
    <option value="desert">🏜 Desert Wastes</option>
    <option value="ocean">🌊 Ocean Depths</option>
    <option value="islands">🏝 Island Shore</option>
    <option value="arctic">❄ Arctic Wastes</option>
    <option value="heavenly_clouds">☁ Heavenly Clouds</option>
  </select>
</div>
<div class="cfg-field">
  <label>Select Monster</label>
  <select id="terrain-enemy-select" disabled>
    <option>— select location first —</option>
  </select>
</div>
<div class="cfg-field">
  <label>Favorites</label>
  <select id="enemy-select"><!-- existing preset list unchanged --></select>
</div>
```

### IV-C. Cascade Handler

```js
/**
 * Rebuild the monster dropdown for a given terrain.
 * Groups by tier using <optgroup>, sorts by AC within each tier.
 * @param {string} terrainId  — key into WORLD_DB
 */
function populateTerrainEnemies(terrainId) {
  const sel = document.getElementById('terrain-enemy-select');
  sel.innerHTML = '';
  sel.disabled = !terrainId;
  if (!terrainId) { sel.innerHTML = '<option>— select location first —</option>'; return; }

  const terrain = WORLD_DB[terrainId];
  if (!terrain) return;

  const TIER_ORDER = ['trivial','easy','medium','hard','deadly'];
  const TIER_LABELS = {
    trivial: '⬥ Trivial',
    easy:    '◈ Easy',
    medium:  '◆ Medium',
    hard:    '◉ Hard',
    deadly:  '★ Deadly',
  };

  const byTier = {};
  for (const t of TIER_ORDER) byTier[t] = [];
  for (const m of terrain.monsters) byTier[m.tier]?.push(m);

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '— pick a monster —';
  sel.appendChild(placeholder);

  for (const tier of TIER_ORDER) {
    const group = byTier[tier];
    if (!group.length) continue;
    const og = document.createElement('optgroup');
    og.label = TIER_LABELS[tier];
    for (const m of group) {
      const opt = document.createElement('option');
      opt.value = m.key;
      opt.textContent = `${m.name}  AC${m.ac}  HP${m.hp}`;
      opt._monster = m;
      og.appendChild(opt);
    }
    sel.appendChild(og);
  }
}

/**
 * Load a WORLD_DB monster entry into the opponent state.
 * Mirrors the existing loadEnemyPreset() contract.
 * @param {MonsterEntry} m
 */
function loadWorldMonster(m) {
  S.enemy.key      = m.key;
  S.enemy.name     = m.name;
  S.enemy.ac       = m.ac;
  S.enemy.maxHp    = m.hp;
  S.enemy.atk      = m.atk;
  S.enemy.dmgDie   = m.dmgDie;
  S.enemy.dmgCount = m.dmgCount;
  S.enemy.dmgFlat  = m.dmgFlat;
  S.opp.hp         = m.hp;
  S.opp.maxHp      = m.hp;

  // Sync UI fields (same as existing loadEnemyPreset)
  document.getElementById('opp-custom-name').value  = m.name;
  document.getElementById('opp-custom-ac').value    = m.ac;
  document.getElementById('opp-custom-maxhp').value = m.hp;
  document.getElementById('opp-custom-atk').value   = m.atk;
  document.getElementById('opp-dmg-count').value    = m.dmgCount;
  document.getElementById('opp-dmg-flat').value     = m.dmgFlat;

  // Set opp die selector highlight
  document.querySelectorAll('#opp-die-sel .die-opt').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.die) === m.dmgDie);
  });
  S.enemy.dmgDie = m.dmgDie;
  refreshLeftPanel();
}
```

### IV-D. Event Wiring (additions only)

```js
// Terrain dropdown cascade
document.getElementById('terrain-select').addEventListener('change', e => {
  S.terrain = e.target.value;
  populateTerrainEnemies(S.terrain);
});

// Monster selection from terrain list
document.getElementById('terrain-enemy-select').addEventListener('change', e => {
  const opt = e.target.selectedOptions[0];
  if (opt?._monster) loadWorldMonster(opt._monster);
});
```

---

## V. Monster Catalog — Terrain Assignments

Each terrain array references monsters from `MONSTER_POOL` by key. Arrays are listed sorted by AC (trivial → deadly).

### V-A. city — City Streets

Urban encounter. Guards patrol; criminals skulk. Constructs may serve powerful wizards.

```js
monsters: [
  MONSTER_POOL.commoner,    // AC 10
  MONSTER_POOL.kobold,      // AC 12  (sewer escapee)
  MONSTER_POOL.bandit,      // AC 12
  MONSTER_POOL.spy,         // AC 12
  MONSTER_POOL.shadow,      // AC 12  (dark alley spill-over)
  MONSTER_POOL.thug,        // AC 11
  MONSTER_POOL.imp,         // AC 13  (disguised familiar)
  MONSTER_POOL.kenku,       // AC 13  (street thief)
  MONSTER_POOL.wererat,     // AC 12
  MONSTER_POOL.ghoul,       // AC 12  (escaped crypt)
  MONSTER_POOL.intellect_dev,// AC 12
  MONSTER_POOL.doppelganger,// AC 14
  MONSTER_POOL.wight,       // AC 14  (nobleman's bodyguard undead)
  MONSTER_POOL.gargoyle,    // AC 15  (roof guardian)
  MONSTER_POOL.assassin,    // AC 15
  MONSTER_POOL.gladiator,   // AC 16  (arena fighter)
  MONSTER_POOL.veteran,     // AC 17
  MONSTER_POOL.night_hag,   // AC 17
  MONSTER_POOL.knight,      // AC 18  (city watch captain)
  MONSTER_POOL.stone_golem, // AC 17  (guild construct)
  MONSTER_POOL.vampire,     // AC 16  (crime lord)
  MONSTER_POOL.lich,        // AC 17  (court archmage gone wrong)
]
```

### V-A2. city_slums — Birka Slums (Node SL, Act I)

Cramped alleys north of the Birka market. Refuse heaps, vermin, and livestock gone feral. Locals call this stretch **"The Vermin Pit"**. All 14 monsters are low-tier vermin and beasts — the slums offer easy early XP for level 1 fighters.

**Node code:** `SL` · `num: 51` · Connects south to CI (City Streets)  
**Terrain key:** `city_slums` *(the `HUNTING_GROUNDS` display-name map that surfaced "The Vermin Pit" in the stalk UI was removed in §TIMELESS-01; the name survives only as world lore here)*

```js
monsters: [
  P.rabid_dog,       P.aggressive_turkey, P.horned_goat,
  P.toilet_leech,    P.honeybucket_spider, P.cockroach_swarm,
  P.skittish_sheep,  P.swarming_wasps,    P.night_owl,
  P.raging_bull,     P.spooked_horse,     P.catnabbing_eagle,
  P.commoner,        P.giant_rat
]
```

All tier: trivial–easy. Good farming ground at levels 1–4 before notoriety climbs.

---

### V-B. alley — Dark Alley

Narrow, unlit. Ambush territory. High surprise-round encounters.

```js
monsters: [
  MONSTER_POOL.commoner, MONSTER_POOL.bandit, MONSTER_POOL.thug,
  MONSTER_POOL.spy, MONSTER_POOL.shadow, MONSTER_POOL.wererat,
  MONSTER_POOL.ghoul, MONSTER_POOL.kenku, MONSTER_POOL.intellect_dev,
  MONSTER_POOL.doppelganger, MONSTER_POOL.succubus,
  MONSTER_POOL.assassin, MONSTER_POOL.vampire_spawn,
  MONSTER_POOL.vampire, MONSTER_POOL.night_hag,
]
```

### V-C. storefront — Market District

Daytime trade. Disguised fiends, thieves, mimics.

```js
monsters: [
  MONSTER_POOL.commoner, MONSTER_POOL.bandit, MONSTER_POOL.spy,
  MONSTER_POOL.imp, MONSTER_POOL.homunculus, MONSTER_POOL.kenku,
  MONSTER_POOL.thug, MONSTER_POOL.mimic, MONSTER_POOL.intellect_dev,
  MONSTER_POOL.doppelganger, MONSTER_POOL.succubus,
  MONSTER_POOL.assassin, MONSTER_POOL.vampire,
]
```

### V-D. bar — Tavern Brawl

Fists and bottles. High-HP brawlers, lycanthropes in disguise.

```js
monsters: [
  MONSTER_POOL.commoner, MONSTER_POOL.thug, MONSTER_POOL.bandit,
  MONSTER_POOL.berserker, MONSTER_POOL.cult_fanatic,
  MONSTER_POOL.wererat, MONSTER_POOL.wereboar, MONSTER_POOL.werewolf,
  MONSTER_POOL.doppelganger, MONSTER_POOL.bandit_captain,
  MONSTER_POOL.gladiator, MONSTER_POOL.veteran,
]
```

### V-E. inn — Inn (Night)

Guests asleep; danger arrives quietly. Night hags, doppelgangers, spies.

```js
monsters: [
  MONSTER_POOL.commoner, MONSTER_POOL.bandit, MONSTER_POOL.spy,
  MONSTER_POOL.imp, MONSTER_POOL.wererat, MONSTER_POOL.succubus,
  MONSTER_POOL.doppelganger, MONSTER_POOL.shadow,
  MONSTER_POOL.vampire_spawn, MONSTER_POOL.night_hag,
  MONSTER_POOL.assassin, MONSTER_POOL.vampire,
]
```

### V-F. tavern — Tavern (Common Room)

Rowdier than the inn. Mix of brawlers and supernatural regulars.

```js
monsters: [
  MONSTER_POOL.commoner, MONSTER_POOL.thug, MONSTER_POOL.bandit,
  MONSTER_POOL.spy, MONSTER_POOL.berserker, MONSTER_POOL.cult_fanatic,
  MONSTER_POOL.wererat, MONSTER_POOL.doppelganger, MONSTER_POOL.succubus,
  MONSTER_POOL.bandit_captain, MONSTER_POOL.gladiator,
  MONSTER_POOL.night_hag, MONSTER_POOL.vampire,
]
```

### V-G. outhouse — Outhouse / Privy

Humor encounter. Tight space, foul conditions, mostly vermin.

```js
monsters: [
  MONSTER_POOL.commoner, MONSTER_POOL.giant_rat,
  MONSTER_POOL.kobold, MONSTER_POOL.wererat,
  MONSTER_POOL.zombie, MONSTER_POOL.ghoul,
]
```

### V-H. sewers — Sewer Underbelly

Dark, wet, dangerous. Undead, rats, aberrations, carrion feeders.

```js
monsters: [
  MONSTER_POOL.giant_rat, MONSTER_POOL.zombie, MONSTER_POOL.shadow,
  MONSTER_POOL.ghoul, MONSTER_POOL.wererat, MONSTER_POOL.specter,
  MONSTER_POOL.intellect_dev, MONSTER_POOL.ghast,
  MONSTER_POOL.mimic, MONSTER_POOL.water_weird,
  MONSTER_POOL.wight, MONSTER_POOL.wraith,
  MONSTER_POOL.vampire_spawn, MONSTER_POOL.vampire,
]
```

### V-I. crypt — Crypt

Single-chamber undead. Rises triggered by intrusion.

```js
monsters: [
  MONSTER_POOL.skeleton, MONSTER_POOL.zombie,
  MONSTER_POOL.shadow, MONSTER_POOL.ghoul, MONSTER_POOL.specter,
  MONSTER_POOL.ghost, MONSTER_POOL.ghast, MONSTER_POOL.wight,
  MONSTER_POOL.mummy, MONSTER_POOL.revenant, MONSTER_POOL.wraith,
  MONSTER_POOL.vampire_spawn,
]
```

### V-J. catacombs — Catacombs

Deep, sprawling undead complex. End-game undead and anti-paladins.

```js
monsters: [
  MONSTER_POOL.skeleton, MONSTER_POOL.zombie,
  MONSTER_POOL.shadow, MONSTER_POOL.ghoul, MONSTER_POOL.specter,
  MONSTER_POOL.ghost, MONSTER_POOL.ghast, MONSTER_POOL.wight,
  MONSTER_POOL.wraith, MONSTER_POOL.mummy, MONSTER_POOL.revenant,
  MONSTER_POOL.vampire_spawn, MONSTER_POOL.vampire,
  MONSTER_POOL.mummy_lord, MONSTER_POOL.death_knight, MONSTER_POOL.lich,
]
```

### V-K. forest — Forest / Trees

Wilderness. Predators, fey, druids, plant-monsters.

```js
monsters: [
  MONSTER_POOL.needle_blight, MONSTER_POOL.kobold, MONSTER_POOL.wolf,
  MONSTER_POOL.giant_rat, MONSTER_POOL.goblin, MONSTER_POOL.bandit,
  MONSTER_POOL.orc, MONSTER_POOL.gnoll, MONSTER_POOL.ghoul,
  MONSTER_POOL.giant_spider, MONSTER_POOL.harpy, MONSTER_POOL.brown_bear,
  MONSTER_POOL.dire_wolf, MONSTER_POOL.centaur, MONSTER_POOL.owlbear,
  MONSTER_POOL.displacer_beast, MONSTER_POOL.green_hag,
  MONSTER_POOL.troll, MONSTER_POOL.treant, MONSTER_POOL.bandit_captain,
]
```

### V-L. desert — Desert Wastes

Heat, sand, ancient curses. Yuan-ti, mummies, blue dragons.

```js
monsters: [
  MONSTER_POOL.kobold, MONSTER_POOL.jackalwere, MONSTER_POOL.zombie,
  MONSTER_POOL.skeleton, MONSTER_POOL.gnoll, MONSTER_POOL.hobgoblin,
  MONSTER_POOL.orc, MONSTER_POOL.yuan_ti, MONSTER_POOL.cult_fanatic,
  MONSTER_POOL.giant_scorpion, MONSTER_POOL.lamia,
  MONSTER_POOL.mummy, MONSTER_POOL.gargoyle, MONSTER_POOL.bandit_captain,
  MONSTER_POOL.troll, MONSTER_POOL.mummy_lord, MONSTER_POOL.adult_blue,
]
```

### V-M. ocean — Ocean Depths

Open water and underwater dungeons.

```js
monsters: [
  MONSTER_POOL.merfolk, MONSTER_POOL.sahuagin, MONSTER_POOL.harpy,
  MONSTER_POOL.giant_octopus, MONSTER_POOL.merrow,
  MONSTER_POOL.sea_hag, MONSTER_POOL.water_weird,
  MONSTER_POOL.hunter_shark, MONSTER_POOL.aboleth,
  MONSTER_POOL.marid, MONSTER_POOL.storm_giant,
  MONSTER_POOL.dragon_turtle, MONSTER_POOL.kraken,
]
```

### V-N. islands — Island Shore

Tropical hazard mix: dinosaurs, pirates, ancient ruins.

```js
monsters: [
  MONSTER_POOL.kobold, MONSTER_POOL.merfolk, MONSTER_POOL.bandit,
  MONSTER_POOL.lizardfolk, MONSTER_POOL.harpy, MONSTER_POOL.thug,
  MONSTER_POOL.gnoll, MONSTER_POOL.ankheg, MONSTER_POOL.sea_hag,
  MONSTER_POOL.giant_spider, MONSTER_POOL.allosaurus,
  MONSTER_POOL.manticore, MONSTER_POOL.cyclops,
  MONSTER_POOL.bandit_captain, MONSTER_POOL.t_rex,
  MONSTER_POOL.wyvern,
]
```

### V-O. arctic — Arctic Wastes

Frozen tundra. Cold-themed encounters, high HP, frost giants.

```js
monsters: [
  MONSTER_POOL.kobold, MONSTER_POOL.wolf, MONSTER_POOL.ice_mephit,
  MONSTER_POOL.skeleton, MONSTER_POOL.zombie,
  MONSTER_POOL.yeti, MONSTER_POOL.winter_wolf, MONSTER_POOL.polar_bear,
  MONSTER_POOL.revenant, MONSTER_POOL.young_remorhaz,
  MONSTER_POOL.abom_yeti, MONSTER_POOL.wy_white_dragon,
  MONSTER_POOL.frost_giant,
]
```

### V-P. heavenly_clouds — Heavenly Clouds

Celestial realms and sky platforms. Angelics, cloud giants, great wyrms.

```js
monsters: [
  MONSTER_POOL.aarakocra, MONSTER_POOL.hippogriff,
  MONSTER_POOL.pegasus, MONSTER_POOL.griffon,
  MONSTER_POOL.harpy, MONSTER_POOL.manticore, MONSTER_POOL.wyvern,
  MONSTER_POOL.cloud_giant, MONSTER_POOL.deva,
  MONSTER_POOL.storm_giant, MONSTER_POOL.planetar,
  MONSTER_POOL.adult_silver,
]
```

---

## VI. Incremental Implementation Plan

Steps are ordered by risk and dependency. Each step is independently testable; the file remains fully functional after every step.

### VI-A. Step Ordering and Rationale

```
S1  ✅ On-die display         No state change.  Pure HTML/CSS.          Risk: trivial
S2  ✅ Resist/Vuln            2 state fields.   Wraps HP-delta calls.   Risk: low
S3  ✅ Damage multiplier      1 state field.    Wraps dice count.       Risk: low
S4  ✅ Initiative             0 state change.   Display-only function.  Risk: trivial
S5  ✅ Healing roll           New state sub-obj. Mirrors Roll Damage.   Risk: low
S6  ✅ Conditions             2 state fields.   Auto-drives adv/dis.    Risk: low
S7  ✅ Death Saves            New state sub-obj. Zone overlay.          Risk: medium
S8  ✅ Sneak Attack           New state sub-obj. Appends to damage.     Risk: low
S9  ✅ Multi-attack           Loop in playerRoll.                       Risk: medium
S10 ✅ Cleanup/Refactor       No functional change.                     Risk: low
S11 ✅ World terrain DB       WORLD_DB + cascade dropdown.              Risk: low
```

### VI-B. Each Step's Atomic Contract

For every step, the following must hold before moving to the next:

1. File opens in browser with no JS console errors.
2. All existing roll actions (Roll Attack, Roll Damage, Off-hand, Opponent, Quick Dice) still work.
3. HP bars update correctly on damage.
4. History cards still append and auto-scroll.
5. Histogram still records and renders.

### VI-C. S11 Sub-Steps (terrain system is large enough to decompose)

```
S11-a  Define MONSTER_POOL object literal (no UI change yet)
S11-b  Define WORLD_DB terrain entries pointing into MONSTER_POOL
S11-c  Add HTML terrain/monster cascade selects in config panel
S11-d  Implement populateTerrainEnemies() and loadWorldMonster()
S11-e  Wire event listeners; test all 16 terrains  (Phase 3 target; final impl: 66 terrains)
S11-f  Style optgroup labels to match existing die-select aesthetic
S11-g  Add "Favorites" backward-compat passthrough for existing ENEMY_DB
```

---

## VII. Discussion and Forward Compatibility

### VII-A. Why Flat Data, Not Fetch

Fetching a monsters JSON file from a server would reduce initial page weight but break the core constraint: the app must work offline and without a server. Inlining `MONSTER_POOL` adds approximately 25 KB of JS source text — within budget for a sub-3000-line single file.

### VII-B. Key Lookup vs. Array Search

`MONSTER_POOL` is a flat object keyed by slug. Terrain monster arrays hold direct object references (not string keys). This means:

- Terrain lookup: `O(1)` — `WORLD_DB[terrainId]`
- Dropdown population: `O(n)` where `n ≤ 60` per terrain — negligible
- Monster stat lookup: `O(1)` — stored directly on `opt._monster`
- No string-based `find()` anywhere in the hot path

### VII-C. Expansion Budget

```
Phase 3 target: 42 terrains, 329 monsters in MONSTER_POOL
As of Layer 37 (historical): 66 terrains (46 base + 20 epic), 370 monsters in MONSTER_POOL
Live now (Layer 104, 2026-07-09): 111 terrains, 398 monsters — see monsters.md / index.md
Average entry size ≈ 120 bytes source text
Current MONSTER_POOL ≈ 370 entries × 120 B ≈ 44 KB
No practical budget ceiling at single-file scale — browser loads sub-100 KB JS trivially.
```

### VII-D. v4 Architecture Hints (out of scope for v3)

If the project outgrows single-file constraints, the natural split would be:

```
roll2hit-v4/
  index.html          ← shell (~200 lines)
  roll2hit.js         ← state + roll actions
  world_db.js         ← MONSTER_POOL + WORLD_DB (importable)
  styles.css
```

Until that migration, all Phase 3 code remains in one file. No module syntax, no import/export — the file must `<script>` tag cleanly.

---

## References

[1] Wizards of the Coast, *Systems Reference Document 5.1*, Creative Commons Attribution 4.0, 2023.  
[2] Wizards of the Coast, *Monster Manual*, 5th Edition, 2014.  
[3] ECMA International, *ECMAScript 2022 Language Specification*, ECMA-262, 13th Edition, June 2022.  
[4] World Wide Web Consortium, *HTML5 Living Standard*, WHATWG, 2024.  
[5] D. Knuth, *The Art of Computer Programming, Vol. 2: Seminumerical Algorithms*, 3rd ed. Addison-Wesley, 1997. (ring buffer, §2.2.2)

---

## Appendix A — Terrain Quick-Reference Card

| Terrain Key | Label | Power Range | Key Threats |
|---|---|---|---|
| `city` | City Streets | trivial → deadly | Assassin, Vampire, Lich |
| `alley` | Dark Alley | easy → deadly | Shadow, Wererat, Vampire |
| `storefront` | Market District | trivial → deadly | Mimic, Doppelganger |
| `bar` | Tavern Brawl | trivial → hard | Berserker, Gladiator, Wereboar |
| `inn` | Inn — Night | trivial → deadly | Night Hag, Vampire Spawn |
| `tavern` | Tavern — Common | trivial → deadly | Night Hag, Vampire |
| `outhouse` | Outhouse | trivial → easy | Giant Rat, Wererat |
| `sewers` | Sewer Underbelly | easy → deadly | Ghoul, Water Weird, Vampire |
| `crypt` | Crypt | easy → hard | Mummy, Wraith, Vampire Spawn |
| `catacombs` | Catacombs | easy → deadly | Lich, Death Knight, Vampire |
| `forest` | Forest / Trees | trivial → hard | Owlbear, Treant, Displacer Beast |
| `desert` | Desert Wastes | trivial → deadly | Mummy Lord, Adult Blue Dragon |
| `ocean` | Ocean Depths | easy → deadly | Aboleth, Dragon Turtle, Kraken |
| `islands` | Island Shore | trivial → hard | T-Rex, Cyclops, Wyvern |
| `arctic` | Arctic Wastes | trivial → hard | Frost Giant, Abominable Yeti |
| `heavenly_clouds` | Heavenly Clouds | easy → deadly | Planetar, Storm Giant, Adult Silver Dragon |

---

## Appendix B — Monster Count per Terrain

| Terrain | Trivial | Easy | Medium | Hard | Deadly | Total |
|---|---|---|---|---|---|---|
| city | 1 | 4 | 5 | 5 | 3 | 18 |
| alley | 1 | 3 | 5 | 3 | 3 | 15 |
| storefront | 1 | 4 | 3 | 2 | 1 | 11 |
| bar | 1 | 2 | 6 | 3 | 0 | 12 |
| inn | 1 | 3 | 4 | 3 | 1 | 12 |
| tavern | 1 | 3 | 5 | 3 | 1 | 13 |
| outhouse | 0 | 4 | 2 | 0 | 0 | 6 |
| sewers | 0 | 3 | 5 | 4 | 2 | 14 |
| crypt | 0 | 3 | 5 | 3 | 1 | 12 |
| catacombs | 0 | 3 | 7 | 3 | 3 | 16 |
| forest | 1 | 5 | 8 | 5 | 0 | 19 |
| desert | 1 | 4 | 7 | 4 | 2 | 18 |
| ocean | 0 | 3 | 5 | 3 | 2 | 13 |
| islands | 1 | 4 | 6 | 4 | 0 | 15 |
| arctic | 1 | 4 | 4 | 4 | 0 | 13 |
| heavenly_clouds | 0 | 4 | 3 | 3 | 2 | 12 |
| **TOTAL unique monsters in MONSTER_POOL** | | | | | | **329** |
> *Appendix B shows the original 16-terrain Phase 3 spec counts. Final implementation expanded to 66 terrains (46 base + 20 epic) and 370 monsters. See `monsters.md` for the complete verified current listing.*

---

*MIT License — Copyright (c) 2026 roll2hit.com*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
