<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report — Roll2Hit Architecture: A Full Technical Review
### IEEE-Format Architectural Review of a 14,377-Line Single-File Browser RPG
**Date:** 2026-05-22 (updated 2026-05-24)  
**Source file:** `roll2hit-v3.html`  
**File size:** 14,377 lines, ~580 KB  

---

## Abstract

This document is a full architectural review of `roll2hit-v3.html`, a browser-native RPG built on D&D 5e mechanics. The game runs two distinct engines — a standalone dice combat tracker (Battle Mode) and a 76-node narrative campaign (Story Mode) — inside a single HTML file with no build step, no CDN dependencies, no JavaScript modules, and no server component. The player is a Level 1–20 Fighter Champion who travels a 26×16 grid world across 8 acts, collects 7 Codex Shards, and seals the Void before Day 49 in a campaign called *The Shattered Codex*.

The "one file" constraint is not an accident of size; it is a deliberate design philosophy. The game can be emailed, copied to a USB drive, opened on an airplane, or hosted on a static server with no build chain. Everything — 370 monster entries, 76 story nodes, 41 journal entries, 6 NPC voice profiles, 66 terrain types (46 base + 20 epic), the full fighter ruleset from Level 1 to Level 20, and all UI — lives in one place. The architectural cost of that choice is a 14,377-line monolith. The benefit is a self-contained software artifact that works everywhere HTML5 does.

---

## I. Introduction

### A. What the Game Is

Roll2Hit is a D&D 5e combat calculator that grew a narrative skeleton. Battle Mode — the original engine — is a configurable dice roller and combat tracker: you pick a character, set an opponent, pick terrain, and roll through combat rounds. Story Mode extends this into a complete RPG: you travel named nodes on a hand-built world map, collect loot, manage inventory and gold, pursue quests, fight escalating monsters, rest at inns, and race a 49-day Void Pressure clock to seal the world's doom.

The two modes share a common dice library and combat resolution layer. Story Mode uses the same `roll()`, `resolveAdv()`, and damage functions that Battle Mode exposes. The difference is context: Battle Mode is stateless-per-session (refresh resets it); Story Mode carries persistent state through `localStorage`.

### B. The Two-Mode Engine

Battle Mode state lives in `S` — a flat mutable object updated by UI events and rendered by explicit repaint calls. Story Mode state lives in `S_story` — an ~107-field object initialized by `_S_DEFAULTS()`, persisted by `storyAutoSave()`, and loaded back by `storyLoadContinue()`. The two objects never merge. When Story Mode starts a combat, it copies the relevant fields (equipped weapon, opponent stats, conditions) into `S` temporarily, runs the battle overlay, then reads back the result.

### C. Why a Single Mutable State Object

A centralized state object makes the "one file, no framework" constraint tractable. There is no Vuex store, no Redux reducer, no observable stream. There is a plain JavaScript object. When a button fires, the handler reads from `S_story`, mutates it, and calls the render function for the section that changed. If you want to know what the player's HP is, you read `S_story.hp`. There is no selector, no getter, no subscription. The entire state is always reachable by any function, because all functions live in the same file scope.

The tradeoff is exactly what you'd expect: a function 3,000 lines from the state object can mutate it silently. There are no enforced invariants. The discipline is entirely in the programmer's head.

### D. The Design Constraint

No build step. No CDN. No modules. One HTML file. This is not a prototype; it is a finished, shipped product. Understanding the architecture means understanding every pattern in the codebase through this lens: when something looks unusual — a 700-line render function, inline SVG generation, manual DOM buffer replacement — the question is not "why didn't they use React?" The question is "what problem does this solve in a file that must open without a server?"

---

## II. Data Architecture

The game's data layer is a collection of top-level `const` declarations, all in file scope, all readable by every function. There is no database, no API, no import. There are objects.

### A. Battle Mode State: `S`

```js
const S = {
  round: 0,
  rollMode: 'normal',      // 'adv' | 'dis' | 'normal'
  autoDamage: false,
  player: { hp, hpMax, ac, name },
  opp:    { hp, hpMax, ac, name },
  char:   { str, dex, con, int, wis, cha, level, prof },
  weapon: { die, count, mod, name },
  offhand:{ die, count, mod, name },
  bonus:  { die, count, mod },
  heal:   { die, count, mod },
  enemy:  { ac, hp, hpMax, name },
  histoData: {}            // sides → roll frequency map
};
```

`S` is shallow. Every Battle Mode function reads from it or writes to it directly. There is no encapsulation, because there is no need for it in a single-threaded synchronous UI with one active combat at a time.

### B. Story Mode State: `S_story` and `_S_DEFAULTS()`

`S_story` is initialized by calling `_S_DEFAULTS()` and then optionally merged with a saved JSON string from `localStorage`. At approximately 107 fields, it is the most structurally significant object in the codebase. Representative fields:

```
hp, hpMax, gold, day, shards, voidPressure, xp, level
atkBonus, acBonus
abilityScores: { str, dex, con, int, wis, cha }
inventory: []              // array of { name, qty } objects
quests: {}                 // quest slug → { active, done }
defeatedBattles: {}        // node slug → count
hearthHome: nodeCode
checkpointNode: nodeCode
battleTurn: 'player'|'enemy'
battleRound: 0
equippedShield: null|item
equippedWeapon: null|item
equippedMainWeapon: null|item
pendingBattle: null|{ ... }
surgeCharges: 0|1|2
indomitableCharges: 0|1
tattoos: {}
npcFavorability: {}        // npc key → -2..3
journalEntriesRead: []
ebReturnsCompleted: {}
ebNegotiatedPayments: {}
```

S-Suggestion flags (added as the game's narrative was extended through 53 targeted additions):

```
s29LineDelivered, s49BrynnDelivered, archiveVisited,
s8VargaWatches, frobergerLastEntryRead,
pitWins, actThreeWeightDone, gigaultStateCache, ...
```

`_S_DEFAULTS()` is the canonical reset. `storyNewGame()` calls it directly. `storyNewGamePlus()` calls it but preserves some flags. Knowing that every field has a default defined in one function means that adding new state is always a two-step: add the field to `_S_DEFAULTS()`, then use it anywhere.

### C. `MONSTER_POOL`

370 entries, each keyed by a slug string:

```js
'goblin': {
  name: 'Goblin', ac: 15, hp: 7, dmgDie: 6, dmgCount: 1,
  cr: '1/4', xpVal: 50, terrain: ['forest','grassland','dungeon']
}
```

The pool is the game's encyclopedia. Every combat — corridor encounter, node battle, stalk, fishing, epic boss fight — pulls from it. The terrain array controls which monsters appear in which biome.

### D. `WORLD_DB`

66 terrain types — 46 base (e.g. `'forest'`, `'city'`, `'arctic'`, `'defi_land'`) + 20 epic battlegrounds — each with a `monsters[]` array of slugs pointing into `MONSTER_POOL`. `WORLD_DB` is the join table between terrain and monster.

### E. `NODE_MAP`

76 story nodes, each a plain object:

```js
{ num: 12, name: 'birka', label: 'Birka', act: 1,
  N: 'CY', E: null, S: 'LB', W: 'TK',
  sleep: true, battle: 'goblin', loot: 'chest_birka',
  isEpicBattleground: false, bossKey: null }
```

Cardinal directions hold neighboring node codes. `sleep` marks the node as an inn. `battle` is the default encounter slug. `isEpicBattleground` and `bossKey` gate Epic Boss encounters.

### F. `NODE_COORDS`

A parallel mapping from node code to `{r, c}` grid coordinates on the 26×16 world map. Used by `_renderWorldMiniMap()`, `_renderMapGrid()`, `buildCorridorMap()`, and the BFS pathfinder.

### G. `QUEST_DB`

Each quest entry:

```js
{
  activateNode: 'birka',
  objectiveText: 'Find the missing courier',
  reward: { gold: 50, xp: 100 },
  completionCheck: (s) => s.defeatedBattles['cryptDead'] > 0,
  waypointNode: 'CY',
  disposition: 'neutral'
}
```

`completionCheck` is a function that receives `S_story` and returns a boolean. This means quest completion logic lives in the data, not scattered across render functions.

### H. Supporting Constants

- **`GATE_LOCKS`** — 4 passage locks (e.g. "you need the Trade Seal to pass") + the final shard gate. Each lock names a fromCode, toCode, required item or condition, and a failure message.
- **`CORRIDOR_CELLS`** — computed sparse grid (`"r,c"` → cell data) built once at startup by `buildCorridorMap()`. Not defined statically; derived from `NODE_MAP` adjacency and `NODE_COORDS`.
- **`NPC_DIALOGUES`** — 6 NPCs × 4 favorability states (`hostile/neutral/friendly/dear`) × 5 quotes each. 120 quote strings total, addressable by `[npcKey][state][index]`.
- **`FROBERGER_JOURNAL`** — 41 entries: 10 that are read-aloud (rendered as ambient text when entering a node) and 31 that are collectible and added to the journal overlay when found.
- **`EPIC_BOSS_POOL`** — 20 named boss monsters with custom stat blocks; keyed by `bossKey` from `NODE_MAP`.
- **`EB_NPC_DIALOGUE`** — 20 quest givers, each tied to one Epic Boss, with pre-battle, mid-quest, and return dialogue.
- **`BIRKA_NPC_PROFILES`** — 6 named NPCs specific to the Birka hub, with backstory and flavor used by `_renderNpcCard()`.
- **`SWEELINCK_DIALOGUE_VARIANTS`** — 5 ending-variant dialogue objects, keyed by curse score bracket. The final NPC's speech to the player changes depending on how ethically the player engaged with the Epic Boss quest system.
- **Item tables** — `POTION_TIERS`, `SHIELD_ITEMS`, `DAGGER_ITEMS`, `WEAPON_ITEMS` drive vendor inventory and loot rolls. `FIGHTER_FEATURES` maps level to unlocked abilities. `XP_LEVELS` maps level to XP threshold. `CONDITION_ITEMS` and `CONDITION_GOLD` support pre-battle condition selection. `LOOT_TABLE` and `_D100_TABLE` power the post-combat reward roll.

---

## III. The Battle Mode Engine

### A. Dice Primitives

```js
roll(sides)                         // Math.random → 1..sides
rollN(sides, count)                 // returns array of count rolls
rollNExploding(sides, count)        // each max roll adds another die
```

`rollNExploding` is used for damage rolls that can chain — a 6 on a d6 triggers another d6. `rollN` is used for standard multi-die expressions (2d6, 4d6 drop lowest). All three call `roll()`, which is the only function that calls `Math.random`. Centralizing randomness here means `recordRolls()` only needs to intercept one function to build the histogram.

### B. Character Math

```js
abilityMod(score)      // floor((score - 10) / 2)
getProfBonus()         // 2 + floor((S.char.level - 1) / 4)
getAtkAbilityMod()     // STR or DEX depending on finesse flag
getDmgMod()            // ability mod + magic bonus
```

These are stateless pure functions that read from `S.char`. They are called on every attack resolution, not cached. At 14,377 lines, the cost of recalculating an ability modifier is zero.

### C. Attack Resolution

```js
resolveAdv(pm, om)     // net advantage/disadvantage from player/opponent modifiers
rollD20(advState)      // if adv: max(roll,roll); if dis: min(roll,roll); else roll
```

`resolveAdv` takes two bitmask-style modifier objects and returns a single state string (`'adv'`, `'dis'`, or `'normal'`). Advantage and disadvantage cancel: if both apply, the result is `'normal'`. `rollD20` reads the state and either rolls once or rolls twice and takes the appropriate extreme.

### D. The Round Loop

```
playerRoll()
  ├─ doPlayerAttack(1, total)
  │   ├─ resolveAdv(pm, om) → rollD20(advState)
  │   ├─ hit? → rollMainDamage()
  │   │          └─ crit? → dmgMultiplier = 2
  │   └─ miss → log miss card
  ├─ [multi-attack: doPlayerAttack(2..N, total) per _extraAttackCount()]
  ├─ offhandRoll()
  ├─ bonusRoll()
  └─ oppRoll()
       └─ battKillEvent() if opp.hp ≤ 0
            └─ newCombat() or end
```

`playerRoll()` is the top-level handler for the player's turn button. It calls `doPlayerAttack(attackNum, total)` once per available attack. `doPlayerAttack` handles the full hit/miss/crit decision tree: resolve advantage, roll the d20, compare to AC, roll damage if hit, apply the damage multiplier (2× on crit), log the result as a card.

`offhandRoll()` handles the bonus action off-hand attack when a light weapon is equipped in the off hand — this attack does not add the ability modifier to damage, per 5e rules.

`bonusRoll()` handles any configured bonus damage roll (Sneak Attack, Divine Smite, etc.).

`oppRoll()` handles the enemy's counterattack with the same resolution path as the player's, then calls `battKillEvent()` if the opponent's HP drops to zero.

`battKillEvent()` fires the kill animation, logs the kill, and either calls `newCombat()` (if more enemies are queued) or ends the encounter.

### E. Healing and Conditions

```js
rollHeal(sides, count)             // positive HP delta; clamps to hpMax
freeRoll(sides, count)             // utility roll, no combat context
applyCondition(side, condKey)      // sets condition flag on S.player or S.opp
resetDmgMultiplier()               // clears crit multiplier after each attack
applyDmgMod(rawDmg, mod)          // applies resistance (×0.5), vulnerability (×2), etc.
```

### F. Death Saves

```js
rollInitiative()                   // d20 + DEX mod; sets first turn
enterDeathSaves()                  // triggered at hp ≤ 0
exitDeathSaves()                   // on healing, potion, or Indomitable
rollDeathSave()                    // d20; 10+ = success; 1 = two failures; 20 = 1 hp
updateDsPips()                     // re-renders the three success/fail pip dots
```

Three successes before three failures = stable. Three failures = dead, fires `storyGameOver()`. A natural 1 counts as two failures. A natural 20 recovers 1 HP and exits death saves immediately. All of this is in `rollDeathSave()`; `updateDsPips()` is purely a DOM sync.

### G. UI Sync and Render

```js
syncCharFromUI()          // reads all #char-* inputs → S.char
syncWeaponFromUI()        // reads #weapon-* inputs → S.weapon
syncOffhandFromUI()
syncBonusFromUI()
syncHealFromUI()
syncOppFromUI()
refreshLeftPanel()        // rebuilds opponent stat block display
refreshAbilityMods()      // updates all derived mod labels
disableAllRollBtns(bool)  // prevents input during animation
```

These six sync functions are called before any combat calculation that depends on UI input — they are the bridge between the DOM and `S`. The pattern is: event fires → sync function pulls DOM into `S` → combat function reads `S` → render function pushes `S` back to DOM. There is no two-way binding.

### H. Card Rendering and Histogram

```js
recordRolls(sides, rolls)   // updates S.histoData[sides]
renderHistogram()           // rebuilds the histogram SVG from S.histoData
buildCard(entry)            // creates a DOM node for a roll result
appendCard(entry)           // appends card to #history-cards; no scroll-to
dieSVG(sides, value, size, glowClass)  // generates an inline SVG die face
animateDie()                // CSS keyframe trigger on latest die
animateChips()              // bounces the chip row on new loot
appendChips()               // adds chip icons to the chip tray
```

`buildCard` and `appendCard` form a strictly append-only log. Old cards are never removed by the render cycle (they scroll off view). This is intentional: the combat log is a permanent record, never rewritten.

### I. Enemy Loading

```js
loadEnemyPreset(key)              // loads a named enemy from MONSTER_POOL
populateTerrainEnemies(terrainId) // fills the enemy picker from WORLD_DB
loadWorldMonster(m)               // loads a MONSTER_POOL entry into S.enemy
setupDieSelector(containerId, onSelect)  // builds a clickable die-face picker
sneakAutoCount()                  // calculates Sneak Attack dice count
setOutcomeDie()                   // sets the die display after a roll resolves
```

`populateTerrainEnemies` uses `WORLD_DB[terrainId].monsters` to build a dropdown of all valid enemies for that terrain, then calls `loadEnemyPreset` when one is selected. This is the closest Battle Mode has to a data-driven enemy system; the deeper version is in Story Mode's `_weightedMonsterPick`.

---

## IV. The Story Mode Engine — Navigation & World

### A. Entry Points

```js
storyEnter()     // mounts Story Mode: loads/initializes S_story, calls storyRender()
storyExit()      // unmounts: hides story panel, returns to Battle Mode
storyToggle()    // toggles between modes
```

`storyEnter()` is the gate. It calls `storyCheckContinue()` to detect a saved game, loads it if present, resolves the starting node, and hands off to `storyRender()`. Everything after this is driven by `storyRender()` responding to navigation events.

### B. `storyRender(node, prefix)` — The Main Render Function

This is the largest and most structurally significant function in the codebase. It is called on every navigation, every battle return, every rest, and every loot event. Its structure, in execution order:

```
storyRender(node, prefix)
  1. Build node description text → write to #story-desc innerHTML
  2. storyCheckQuests(node)       → activate/complete quests
  3. storyCheckJournal(node)      → find Froberger journal entries
  4. _renderNpcCard(key, container) × N NPCs present at node
  5. Combat chips (battle/stalk/fish buttons)
  6. Loot chips (chest/item pickup buttons)
  7. Vendor chip (if node has a vendor)
  8. Navigation buttons (N/E/S/W, gated by GATE_LOCKS)
  9. _renderMiniMap() → local node adjacency map
 10. _renderWorldMiniMap() → full world overview
 11. storyUpdateStatus() → #s-* DOM element sync
```

The function writes a fresh HTML string to `#story-desc` on every call. It does not diff. It does not cache. Every navigation throws away the previous node's DOM and builds new DOM from scratch. This is the defining architectural choice of Story Mode's render layer.

### C. Navigation

```js
storyMove(dir)
  ├─ gate check via GATE_LOCKS
  ├─ corridor? → storyCorridorTravel(fromCode, destCode, dir)
  │               ├─ encounter probability roll
  │               │   └─ triggerCorridorEncounter(terrain, destCode, questHunt)
  │               │         └─ storyPreBattle(node)
  │               └─ arrive → storyRender(destCode)
  └─ direct → storyRender(newNode)
               ├─ storyCheckQuests()
               ├─ storyCheckJournal()
               ├─ _renderNpcCard() × N
               └─ storyUpdateStatus()
```

`storyMove(dir)` reads `NODE_MAP[currentNode][dir]` to find the destination code. If the destination is adjacent only through corridor cells (i.e. the two nodes are not directly connected but share a grid path), the move triggers `storyCorridorTravel`. If it is a direct node connection, `storyRender` is called immediately.

`storyCorridorTravel(fromCode, destCode, dir)` computes the encounter probability, rolls against it, and either calls `triggerCorridorEncounter` (which hands off to `storyPreBattle`) or calls `storyRender` on arrival. The encounter probability is not fixed; it scales with notoriety and active quest count.

### D. Map Systems

```js
_renderMiniMap()          // 3×3 or 5×5 local adjacency map centered on current node
_renderWorldMiniMap()     // full 26×16 grid; visited nodes shown, unvisited dark
_renderMapGrid()          // shared grid builder used by both mini-maps
_renderFinalMap()         // end-game revealed full map with all node labels
_updateExitLinks()        // marks which exits are passable vs. locked
_terrainLabel(nodeName)   // maps a node name to a display terrain string
_wireGlyph(dirs)          // generates the ASCII/Unicode junction glyph for a corridor cell
_mapIcon(code)            // returns the icon character for a node type
_mapAddExits(cell, code)  // attaches exit-direction data to a map cell element
```

`_renderWorldMiniMap()` builds the full grid on every call. Each cell is a `<div>` appended to a `DocumentFragment`, then the fragment replaces the grid container's contents. The fog-of-war layer tracks `S_story.visitedNodes`; unvisited cells render dark.

### E. Corridor Infrastructure

```js
buildCorridorMap()                        // called once at startup
_routeSegments(r1, c1, r2, c2, first)    // recursive segment router
_corridorTerrain(fromCode, toCode)        // terrain type for encounter rolls
_setActivePath(fromCode, toCode, dir)     // highlights the active corridor in the mini-map
```

`buildCorridorMap()` walks every edge in `NODE_MAP`, finds the two nodes' `NODE_COORDS`, and calls `_routeSegments` to fill in the intermediate `CORRIDOR_CELLS` entries. `_routeSegments` is recursive: it moves one step toward the destination, writes a cell, and recurses. Each cell stores which directions have passable exits (used by `_wireGlyph`) and which terrain it inherits (used by `_corridorTerrain`).

### F. Pathfinding and Waypoints

```js
_bfsPath(fromCode, toCode)   // BFS across NODE_MAP adjacency; returns node code array
storyWaypoint()              // navigate one step toward active waypoint
storySetWaypoint(nodeCode)   // set a destination; stores in S_story.waypointNode
_updateWaypointBtn()         // updates #s-waypoint button label
```

`_bfsPath` is a standard breadth-first search over `NODE_MAP` edge lists. It returns the shortest node-to-node path. `storyWaypoint()` calls `_bfsPath(current, waypoint)` and then calls `storyMove` with the direction of the first step. The waypoint system exists because a 76-node world with 8 acts of content is too large for players to navigate manually toward a distant objective.

### G. Status and Utilities

```js
storyUpdateStatus()    // updates #s-hp, #s-gold, #s-level, #s-notoriety, etc.
storyPortal()          // teleport mechanic at specific nodes
storyMsg(txt)          // appends a text message to the story log panel
storyMapToggle()       // opens/closes the full-screen world map overlay
```

`storyUpdateStatus()` touches approximately 15 separate `#s-*` DOM elements. It is called at the end of `storyRender()` and after every event that changes `S_story` (combat, rest, loot, purchase). It is never called on its own without a reason to have changed state.

---

## V. The Story Mode Engine — Combat Bridge

Story Mode combat is not Battle Mode with a different skin. It is a separate overlay engine that borrows Battle Mode's dice functions, wraps them in a full-screen fight UI, manages AP (action points), handles potion and spell scroll consumption, tracks conditions, and then resolves the outcome back into `S_story`.

### A. Pre-Battle Setup

```js
storyPreBattle(node)         // entry: shows pre-battle tab panel
storyEpicPreBattle(node)     // variant for Epic Boss fights
_renderPreBatt()             // builds the pre-battle condition picker
_switchPreBattTab(tab)       // switches between Info/Conditions/Tactics tabs
_selectedCondsTotalCost()    // sum of gold costs for selected conditions
_toggleCond(i)               // toggles a condition on/off; re-renders summary
_updatePreBattSummary()      // updates the pre-battle cost/effect summary line
storyRunAway()               // exits pre-battle cleanly without entering combat
```

The pre-battle panel is where the player buys conditions (`CONDITION_ITEMS`, `CONDITION_GOLD`) — things like Darkness (enemy gets disadvantage) or Poisoned (player has disadvantage). Conditions have gold costs and are deducted from `S_story.gold` when the player commits.

### B. Committing to Battle

```js
storyCommitBattle()
```

This function does the heaviest lifting before the first die rolls. It selects the monster: for normal battles, it calls `_weightedMonsterPick(terrain)` to draw from `MONSTER_POOL` by notoriety-adjusted weights. For epic battles, it reads `EPIC_BOSS_POOL[bossKey]` directly. It builds `S_story.pendingBattle` — the object that encapsulates everything the overlay will need: monster stats, conditions, terrain, starting HP. It then calls `_storyRollInit()`.

```js
_storyRollInit()
```

Rolls initiative for both sides using `roll(20) + DEX_mod`. Sets `S_story.battleTurn` to `'player'` or `'enemy'` accordingly. Then calls `_showBattleOverlay()`.

### C. The Battle Overlay

```js
_showBattleOverlay()        // populates #story-battle-overlay, sets display:'flex'
_updateBattleOverlay()      // DOM sync: HP bars, condition chips, AP row state
```

The overlay is a pre-existing hidden `<div>` in the HTML. `_showBattleOverlay()` writes the monster name and starting stats into it, copies `S_story.equippedMainWeapon` into `S.weapon`, then reveals the overlay. From this point on, the battle loop is driven by button clicks on overlay buttons.

### D. The Round Loop

```
[Round loop:]
├─ YOUR TURN:
│   ├─ _overlayPlayerAttack()
│   │   └─ loop _extraAttackCount() times
│   │       ├─ resolveAdv() → rollD20()
│   │       ├─ hit? → rollMainDamage()
│   │       └─ crit range check (18–20 at Lv20, 19–20 at Lv15)
│   ├─ _storyAdvanceToBonus(source)
│   └─ bonus actions:
│       ├─ _overlayOffhandAttack()
│       ├─ _storyDrinkPotion(tier)
│       ├─ _storyUseSpellScroll(invIdx)
│       ├─ _storyUseFlashbang(invIdx)
│       └─ flee (clean exit)
└─ ENEMY TURN:
    ├─ _storyEnemyTurn()
    └─ player hp ≤ 0? → enterDeathSaves() or storyGameOver()
Victory: _storyBattleVictory()
```

```js
_overlayPlayerAttack()       // executes main attack loop
_overlayOffhandAttack()      // bonus action off-hand strike
_storyEnemyTurn()            // enemy attacks once; applies damage; checks player death
_storyAdvanceToBonus(source) // transitions from main phase to bonus phase
_extraAttackCount()          // returns 1, 2, 3, or 4 based on level + Action Surge
_playerHasBonusOptions()     // true if any bonus action is available
```

`_extraAttackCount()` is the multiplier that drives the Extra Attack feature. At Level 5 it returns 2. At Level 11, 3. At Level 20, 4. When Action Surge is active, the count doubles (Surge gives a full extra main action). The loop in `_overlayPlayerAttack()` calls `doPlayerAttack()` that many times in sequence.

### E. Potions, Scrolls, and Utility Actions

```js
_storyDrinkPotion(tier)          // heals based on tier; removes from inventory
_renderSboPotions()              // rebuilds potion buttons in SBO (Story Battle Overlay)
_renderSboSpells()               // rebuilds spell scroll buttons
_storyUseFlashbang(invIdx)       // gives player advantage on next attack; removes item
_storyUseSpellScroll(invIdx)     // executes scroll effect; removes from inventory
_disableSboActions(forceDisable) // disables all bonus-action buttons after one is used
_sboLog(msg)                     // appends a line to the in-overlay combat log
_renderSboShield()               // shows/updates shield info in overlay
_calcPlayerAc()                  // computes total AC: base + shield + acBonus + DEX mod
```

### F. Battle Resolution

```js
storyApplyOutcome(won)       // applies win/loss to S_story; triggers appropriate flow
storyShowOutcome()           // renders the outcome card (win or loss details)
_storyBattleVictory()        // handles XP, gold, loot, quest credit, level up check
storyGameOver()              // player HP reaches 0 with no death save saves remaining
storyVoidDefeat(type)        // Void Pressure ≥ 10 or Day 49 exceeded
storyRespawnFromCheckpoint() // loads last checkpoint; partial penalty
```

`_storyBattleVictory()` implements the full post-combat reward pipeline:

```
_storyBattleVictory()
  ├─ goldReward = floor(0.1 × AC × maxHP)
  ├─ xpReward  = AC × maxHP
  ├─ S_story.gold += goldReward
  ├─ S_story.xp   += xpReward
  ├─ _rollD100Loot()
  ├─ _rollMonsterWeaponDrop(monsterDmgDie)
  ├─ quest credit: defeatedBattles[node]++
  ├─ EB defeat: auto-waypoint → quest giver node
  └─ _checkLevelUp() if xp crosses threshold
```

XP is directly proportional to `AC × maxHP`. This formula rewards fighting harder enemies (higher AC and HP both scale the reward) and naturally scales across the game's monster difficulty range.

---

## VI. Loot, Economy & Progression

### A. The D100 Loot Pipeline

```js
_rollD100Loot()               // entry: rolls d100, passes to _d100Result()
_d100Result(r)                // maps roll to a loot table entry via _D100_TABLE
_magicTierAllowed(magic)      // filter: blocks magic items above player's level
```

`_D100_TABLE` maps numeric ranges to loot types: nothing, gold, potion tier 1, potion tier 2, common magic item, uncommon magic item, and so on. `_magicTierAllowed` gates the higher-tier items behind level thresholds. If a rolled entry is blocked by the filter, `_rollD100Loot` rerolls up to 3 times before settling for nothing. This creates a soft probability curve: high-level players don't just hit the ceiling more often, they hit it more reliably.

### B. Weapon Drops

```js
_rollMonsterWeaponDrop(monsterDmgDie)   // chance-based weapon drop from monster's die
_isLastWeapon(item)                     // true if removing this would leave no weapons
_weaponScore(w)                         // numerical quality score for auto-sell comparison
```

Monsters drop weapons matching their damage die. A monster with a d8 attack die can drop a d8 weapon. `_rollMonsterWeaponDrop` checks a probability threshold (scaled by notoriety), generates the weapon item, and pushes it to `S_story.inventory`. `_weaponScore` is used by `_autoSellDuplicates` to identify which copy of a redundant weapon to sell.

### C. Level Up

```js
_checkLevelUp()                    // compares xp to XP_LEVELS[level+1]
_showLevelUpModal()                // fires the level-up celebration UI
_rollLevelHp()                     // d10 + CON mod; minimum 1
_applyASI(delta)                   // applies Ability Score Improvement (+2 to one stat or +1/+1)
_grantMagicShield(gift)            // bonus gift at specific levels (Lv7, Lv10, Lv13, Lv18)
_lu_applyGiftsAndFinish(lvl, hp)   // applies fighter feature unlocks; closes modal
_lu_refreshStats(changed)          // syncs derived stats after ability score changes
_statMod(score)                    // alias for abilityMod(); used in level-up context
```

Every level-up is driven by `FIGHTER_FEATURES[level]` which specifies which features unlock. `_lu_applyGiftsAndFinish` reads this entry and applies the effects: new surgeCharges, new indomitableCharges, extended crit range, extra attack tier. The player is always a Fighter Champion; the progression is linear.

### D. The Economy

```js
storyRenderVendor()             // rebuilds vendor panel completely on open
storyVendorToggle()             // shows/hides vendor panel
_renderVendorShields()          // shield section within vendor
_renderPachelbelSpecials()      // special items at the Pachelbal node vendor
storyBuyPotion(tier)            // deducts gold, adds to inventory
storyBuyShield(tier)            // deducts gold, equips or stores
storyBuyFlashbang()
storyBuyWhiskey()               // "Rough Whiskey" — the debt-trigger item
storySellAll()                  // sells all non-equipped, non-essential inventory
storySellEquipment()            // sells non-equipped weapons and shields
_autoSellDuplicates()           // sells lower-scored duplicate weapons automatically
storyCollectLoot(node)          // processes chest loot at a node; one-time per node
```

The economy is tight by design. Gold comes from combat (10% of `AC × maxHP`) and chest loot. It drains into potions (the main consumable), shields, vendor specials, and condition costs at pre-battle. There is no gold sink loop — you cannot lose money except by spending it — but the survival pressure of Void Tide means you can run out before you have enough.

### E. Inventory Display

```js
storyRenderInventory()      // rebuilds entire inventory panel on every open
storyInventoryToggle()      // shows/hides inventory panel
_itemIcon(n)                // returns emoji/character for an item name
_itemType(n)                // returns 'weapon'|'shield'|'potion'|'misc' for an item
_hasItem(keyword)           // true if inventory contains an item matching keyword
```

`storyRenderInventory()` uses two inner closure functions: `makeSection(title)` creates a collapsible section header, and `makeItemRow(item, extraBtns)` creates a row with equip/sell/use buttons as appropriate for item type. The entire panel is rebuilt on every open call. There is no incremental update — the assumption is that inventory opens infrequently enough that a full rebuild is faster to implement and maintain than a diff.

---

## VII. Quest & Narrative Systems

### A. Quest Lifecycle

```js
storyCheckQuests(node)    // called in storyRender(); activates and completes quests
storyQuestToggle()        // shows/hides quest overlay
storyRenderQuests()       // rebuilds quest panel
```

`storyCheckQuests(node)` iterates `QUEST_DB`. For each inactive quest whose `activateNode` matches the current node, it sets `S_story.quests[slug].active = true`. For each active quest, it calls `completionCheck(S_story)` and marks done if it returns true. Quest state lives entirely in `S_story.quests`; `QUEST_DB` is read-only data.

### B. The Froberger Journal

```js
storyCheckJournal(node)        // finds FROBERGER_JOURNAL entries at this node
storyJournalToggle()           // shows/hides journal overlay
storyUpdateJournalCount()      // updates the journal badge count in the UI
```

`storyCheckJournal(node)` scans `FROBERGER_JOURNAL` for entries whose trigger node matches. Found entries are pushed to `S_story.journalEntriesRead`. When entry 41 is found, `S_story.frobergerLastEntryRead` is set — this flag is checked by `_getNPCDialogue()` to gate Froberger-specific NPC responses. The journal is a trail of breadcrumbs; the narrative payoff of collecting all entries is that specific NPCs respond to having been read about.

### C. NPC Favorability

```js
_npcFavor(key)                 // returns current favorability level for an NPC
_setNpcFavor(key, level)       // sets favorability; clamps to -2..3
_lubeckFriends()               // true if all 6 Birka NPCs are at Friendly+
_renderNpcCard(key, container) // renders an NPC interaction card in the story panel
_hasActiveQuestFor(npcKey)     // true if any active quest is linked to this NPC
_checkDearFriendUpgrade(key)   // checks if NPC relationship can advance to Dear Friend
```

NPC favorability is a six-level scale per NPC, stored in `S_story.npcFavorability`. It drives `_getNPCDialogue()`'s state selection (`hostile/neutral/friendly/dear`) and gates which interaction buttons appear on the NPC card. Reaching `Dear Friend` with all 6 Birka NPCs (`_lubeckFriends()`) is a component of the Covenant Keeper ending.

### D. The Dialogue Priority Chain

`_getNPCDialogue(npcKey)` does not simply return `NPC_DIALOGUES[key][state][index]`. It runs a waterfall of priority checks before falling through to the normal pool:

```
_getNPCDialogue(npcKey):
  1. Rough Whiskey debt degradation check
     → if player bought whiskey on credit and hasn't paid: NPC-specific debt dialogue
  2. Act III weight injection (one-time at Friendly+)
     → _applyActThreeWeight(): returns an NPC_ACT_THREE_LINES entry
  3. Froberger trace (_checkFrobergerTrace)
     → gated: fav ≥ 1 AND visitCount ≥ 2 AND specific journal entry read
     → returns a FROBERGER_TRACES entry for this NPC
  4. NPC cross-reference (every 3rd visit)
     → NPC_CROSS_REFS: NPC mentions another NPC by name
  5. Room 6 trigger (at CY node, fav ≥ 1)
     → storyShowRoom6() narrative moment
  6. S29: Auros/Froberger special
     → gated: at bruhns node, fav ≥ 2, frobergerLastEntryRead = true
  7. Normal pool: NPC_DIALOGUES[key][state][visitCount % 5]
```

This chain is why NPC conversations feel contextually aware despite being written as static arrays. The priority gates ensure that each special event fires at most once, at the right relationship depth, with the right narrative prerequisites satisfied.

### E. Special NPC Actions and Systems

```js
_yaelEscortAction()               // Yael follows player to specific nodes
_checkRoughWhiskeyReaction(npcKey) // triggers debt degradation if applicable
_checkPitPerkUnlock()             // checks if Pit arena wins unlock NPC perks
_applyPitPerks(combatState)       // applies combat bonuses from Pit reputation
_missionComplete()                // returns true if ≥8 of 12 mission bits are set
_curseScore()                     // curse engagement score; actual formula: (startedNotReturned×3) + (neverStarted×1) − (allComplete?5:0); range −5 to ~+55
_covenantStanding()               // returns COVENANT_STANDING_LABELS entry by curseScore bracket (5 tiers: Keeper/Warden/Keeper/Watcher/Wanderer)
_buildSweelinckNamingSequence()   // builds the ceremony NPC-naming sequence
_buildEpilogueScroll()            // assembles the epilogue text from all ending variables
```

`_missionComplete()` is the broadest completion check: it counts 12 distinct mission flags and returns true at 8 or more. This allows the ending to trigger without a perfect run.

`_curseScore()` is the most morally significant function in the codebase. It reads `S_story.quests` to evaluate each of the 20 EB quest pairs. The implemented formula (HTML line 11102): `(startedNotReturned × 3) + (neverStarted × 1) − (allComplete ? 5 : 0)`. Range: −5 (all 20 returned, full bonus) to ~+55 (20 quests started, none returned). The resulting score selects from `COVENANT_STANDING_LABELS` (5 tiers), meaning the ending reflects the player's choices computationally rather than conditionally.

### F. Epic Boss Quest System

```js
_storyEbNpcModal(ebCode)      // shows the EB quest giver dialog
_storyEbReturnBeat(ebCode)    // quest return interaction and reward
```

Each of the 20 Epic Boss encounters has a quest giver in `EB_NPC_DIALOGUE`. The player can find the quest giver before the fight (activates the quest, gives narrative context), fight the boss, then return to the quest giver (closes the quest, reduces curse score). Skipping the return, or never finding the quest giver, increases the curse score. It is possible to clear all 20 Epic Bosses with a perfect `_curseScore()` by engaging with every quest giver on both sides of the fight.

### G. World Progression and Ending

```js
_checkWorldProgressionEvents()    // fires story beats tied to act transitions
_applyActThreeWeight()            // injects Act III NPC dialogue weight
_getGigaultState()                // returns current state of the Gigault NPC arc
_getFarewell(fromCode, toCode)    // NPC_FAREWELLS: goodbye line when leaving a node
_getNodeMapColor(nodeSlug)        // color for world map node by completion state
storyCheckVictory(node)           // the ending resolver
storyShowNpc(nodeCode)            // renders NPC profile modal
storyShowFrobergerNote()          // renders the Froberger courier's last letter
storyShowWeckmannLog()            // renders the Weckmann investigation log
storyShowRoom6()                  // fires the Room 6 narrative moment
storyShowDeaconCode()             // renders the Deacon's encoded message
storyShowBrynnLedger()            // renders Brynn's financial ledger (S49)
_checkFrobergerTrace(npcKey)      // tests whether Froberger-trace dialogue should fire
_getYaelLocation()                // returns current node for the Yael escort NPC
_buildWeckmannLog()               // assembles the Weckmann log text dynamically
```

`storyCheckVictory(node)` is the ending resolver. It fires when the player arrives at the final seal node with all 7 shards. It calls `_curseScore()`, `_covenantStanding()`, `_missionComplete()`, `_buildSweelinckNamingSequence()`, and `_buildEpilogueScroll()` in sequence. The epilogue text is assembled from variables — NPC names, outcomes, curse brackets — and rendered as a scrolling ceremony. Nothing about the ending is hardcoded text; it is built at runtime from the state the player created.

---

## VIII. Stalk, Hunting & Corridor Systems

### A. Manual Stalk

```js
storyStalk(nodeCode)               // manual trigger; calls _stalkedMonsterPick(terrain)
_stalkedMonsterPick(terrain)       // quest-target BOOST + notoriety weights
```

`storyStalk` lets the player hunt at their current node without moving. It calls `_stalkedMonsterPick` which applies a multiplier of 6× to any monster that matches an active quest target (from `_getQuestTargetKeys()`). This biases the pool heavily toward quest targets without making them the only possible encounter. You can stalk for the wolf your quest demands and still pull a different predator.

### B. Corridor Encounters

```js
_weightedMonsterPick(terrain)      // random pick from WORLD_DB, notoriety-weighted
_notoriety()                       // level × 3 + floor(battlesWon / 2)
_notorietyWeights(n)               // returns tier weight object for notoriety bracket n
_getQuestTargetKeys()              // returns slugs of all active quest monster targets
triggerCorridorEncounter(terrain, destCode, questHunt)  // fires pre-battle
storyCorridorTravel(fromCode, destCode, dir)            // travel + encounter check
```

The encounter system is the game's primary difficulty scaling mechanism. `_notoriety()` produces a single integer that increases as the player levels and wins battles. `_notorietyWeights(n)` returns a tier weight table — at low notoriety, the weights heavily favor trivial and easy monsters; at high notoriety, deadly monsters become possible and their weight increases. `_weightedMonsterPick` draws from this weighted pool.

The corridor encounter probability formula:

```
encounterChance = min(95, 10 + notoriety × 1.5 + activeQuestCount × 4)
```

Active quests raise the encounter chance because questing means moving toward objectives, and objectives are in dangerous places. A high-level player pursuing three active quests simultaneously has roughly a 50–60% chance of a corridor encounter per move.

### C. Quick Actions at Nodes

```js
storyQuickWait(nodeCode)    // wait in place; may trigger encounter; advances time
storyFishing()              // fishing minigame entry point
_startFishBattle(fish, hasRod)  // initiates a fish combat; fish are in MONSTER_POOL
storyToggleHunt()           // toggles hunt mode for increased stalk frequency
_updateHuntBtn()            // syncs the hunt button label/state
storyCreateCustomQuest()    // generates a custom bounty quest from available monsters
_storyFindTerrainNode(terrain)  // finds the nearest node with the requested terrain
```

Fishing uses the combat system. Fish are entries in `MONSTER_POOL` with low stats and specific biome tags. `_startFishBattle` picks a fish from the local terrain pool and calls `storyPreBattle` with it. A fishing rod in inventory improves the encounter chance. The combat is resolved normally; winning yields the fish as an inventory item.

---

## IX. Rest, Save & Persistence

### A. Sleep and Recovery

```js
storySleep(node)           // opens sleep preview (cost, heal preview, Void warning)
storyConfirmSleep()        // commits the sleep: heals, advances day, saves checkpoint
storyShortRest()           // 25% HP heal; 3 uses per long rest
storyCheckVoidTide()       // fires Void Pressure event on specific days
storyCheckMissedSleep()    // applies exhaustion for missing inn sleep
```

```
storySleep(node)
  └─ storyConfirmSleep()
       ├─ firstSleepAtNode? → roll 2×(d10 + CON mod) HP
       ├─ revisit?          → roll 1×(d10 + CON mod) HP
       ├─ cap at 50% hpMax
       ├─ S_story.day++
       ├─ storyCheckVoidTide() — +1 Void Pressure on days 3/7/14/21/28/35/42
       ├─ storyCheckMissedSleep() — 2 missed inn sleeps → disadvantage + pressure
       ├─ shortRests = 3  (reset to max)
       ├─ surgeCharges restored (Indomitable charges do NOT restore here)
       └─ storySaveCheckpoint()
```

The Void Pressure clock is pitiless. It ticks on specific sleep events regardless of player skill. The only way to reduce pressure is by collecting shards (shards do not reduce it) — there is no mechanical relief valve. Pressure ≥ 10 ends the game via `storyVoidDefeat('pressure')`. Day 49 without 7 shards ends it via `storyVoidDefeat('time')`.

### B. Save System

```js
storyAutoSave()               // triggered after major events; writes S_story to localStorage
storySaveCheckpoint()         // writes a recoverable checkpoint; called on sleep
storyLoadSave(key)            // loads from localStorage[key]; merges into S_story
storyCheckContinue()          // checks if a save exists; offers Continue on start screen
storyLoadContinue()           // loads the most recent autosave
storyNewGame()                // resets S_story via _S_DEFAULTS(); clears storage
storyNewGamePlus()            // starts fresh but preserves NG+ flags
autoSaveMaybe()               // called after combat: saves if S_story.day has changed
```

The save format is `JSON.stringify(S_story)`. There is no schema version, no migration, no backward compatibility layer. This is the cost of the one-file architecture: if the field names in `_S_DEFAULTS()` change, old saves break silently on load (missing fields default to `undefined`). The mitigation is that `_S_DEFAULTS()` initializes every field — a loaded save is merged with defaults, so new fields added after a save was made get their default values.

### C. Hearthing and Teleport

```js
storySetHearthHome(nodeCode)   // stores nodeCode as hearthHome
storyUseTransmort()            // teleports player to hearthHome; costs gold
```

---

## X. Render Architecture & DOM Buffer Model

### A. The "Full Rewrite" Pattern

The game has no virtual DOM. It has no diffing algorithm. Its rendering pattern is: when state changes, rewrite the relevant section completely.

`storyRender(node, prefix)` writes `innerHTML` directly to `#story-desc`. The entire node description — text, NPC cards, action buttons, navigation — is rebuilt on every call. There is no caching of DOM nodes, no reconciliation, no incremental patch. This means a navigation event replaces approximately 40–80 DOM elements in one assignment. On modern hardware, for a document of this size, this is imperceptibly fast.

### B. Section-by-Section Render Inventory

| UI Section | DOM target | Update trigger | Pattern |
|---|---|---|---|
| Story description | `#story-desc` | Every navigation | Full innerHTML rewrite |
| NPC cards | container div | `storyRender()` | Clear + append |
| Battle overlay | `#story-battle-overlay` | Combat start | Populate + `display:'flex'` |
| Vendor panel | `#story-vendor` | Toggle open | Full rebuild on open |
| Inventory panel | `#story-inventory` | Toggle open | Full rebuild on open |
| Mini-map (local) | `#mini-map-grid` | Every navigation | Fragment replace |
| World map | `#world-map-grid` | Every navigation | Fragment replace |
| Status elements | `#s-hp`, `#s-gold`, etc. | After any state change | Individual `textContent` |
| Journal overlay | `#story-journal-overlay` | Toggle open | Full rebuild on open |
| Character sheet | `#story-char-overlay` | Toggle open | `storyRenderCharSheet()` rebuild |
| Combat history | `#history-cards` | After each roll | Append-only; never rewritten |

### C. The Event Model

There is no event bus. There is no observable pattern. There is no framework-managed lifecycle. The event model is:

1. User clicks a button.
2. The `onclick` or `addEventListener` handler fires.
3. The handler reads from `S` or `S_story` directly.
4. The handler mutates `S` or `S_story` directly.
5. The handler calls the render function for the affected section.
6. The render function reads from `S` or `S_story` and writes to the DOM.

Every flow through the application follows this exact pattern. Step 3 and 5 are never separated by anything asynchronous. There are no promises in the render path. There are no timeouts in the state mutation path (animations use CSS). The entire application is synchronous from click to pixel.

---

## XI. Mechanics Deep Dive

### A. The 1.5 AP Action Economy

Story Mode combat uses a 1.5 AP round structure — not named as such in the code, but implemented through three boolean flags:

```
Round state: usedMainAttack=false, usedBonusAction=false, usedRealAttack=false

Main phase (1.0 AP):
  Attack → sets usedMainAttack; opens bonus phase; sets usedRealAttack=true
  Wimper → sets usedMainAttack (no attack); opens bonus phase; usedRealAttack=false
  Flee⚠  → enemy gets free attack; combat ends; no bonus phase

Bonus phase (0.5 AP):
  Offhand → requires usedRealAttack=true (no off-hand after Wimper)
  Potion / Spell Scroll / Flashbang → does not require prior attack
  Shield   → defensive item use
  Flee✓    → clean exit, no enemy response
  Pass     → skips to enemy turn
```

The `usedRealAttack` flag is the rules-accurate enforcement of the off-hand bonus attack restriction: you can only make a bonus off-hand attack if you attacked with your main hand on the same turn. Wimper (a partial action) does not satisfy this.

### B. Fighter Champion Features

All features are data-driven from `FIGHTER_FEATURES`:

```
Level 2:  Action Surge → surgeCharges = 1
Level 4:  ASI → _applyASI(+2 to one stat)
Level 5:  Extra Attack I → _extraAttackCount() returns 2
Level 9:  Indomitable → indomitableCharges = 1; reroll failed death save
Level 11: Extra Attack II → _extraAttackCount() returns 3
Level 15: Champion Crit 19–20 → crit range expands
Level 17: Action Surge improves → surgeCharges = 2
Level 19: ASI → _applyASI(+2)
Level 20: Extra Attack III + Champion Crit 18–20 → _extraAttackCount() returns 4
```

`_extraAttackCount()` reads `S_story.level` against the feature table and returns the loop count for `_overlayPlayerAttack()`. The crit range check in `_overlayPlayerAttack()` tests the d20 result against a threshold that changes at Levels 15 and 20. Both are computed from live state, not cached constants.

### C. Notoriety and Dynamic Scaling

```
notoriety = level × 3 + floor(battlesWon / 2)

_notorietyWeights(n):
  0–9:   trivial=5, easy=4, medium=2, hard=1, deadly=0
  10–19: trivial=3, easy=4, medium=3, hard=2, deadly=0
  20–29: trivial=2, easy=3, medium=3, hard=2, deadly=1
  30+:   trivial=1, easy=2, medium=3, hard=3, deadly=2

Corridor encounter chance = min(95, 10 + notoriety × 1.5 + activeQuestCount × 4)
```

The notoriety formula creates a compound scaling: level advances both directly (3× multiplier) and through the XP gating that makes each level require more victories. A Level 10 player with 50 battles won has a notoriety of 55, which places them fully in the deadly-inclusive tier even on a quiet corridor walk.

### D. Void Tide Survival Pressure

```
voidPressure: integer 0–10

Increments on specific day-sleep triggers: days 3, 7, 14, 21, 28, 35, 42
  → storyCheckVoidTide() fires on each of these sleeps
  → +1 voidPressure per event (regardless of shards collected)

Missed sleep penalty (2 consecutive nights away from inn):
  → S_story.exhaustion++ (displayed as Disadvantage on attacks)
  → storyCheckMissedSleep() +1 voidPressure per exhaustion cycle

voidPressure ≥ 10 → storyVoidDefeat('pressure')
Day 49 with < 7 shards on sleep → storyVoidDefeat('time')
```

The Void Pressure system is not a timer you outrun. It is a rhythm you work within. There are 7 pressure events in the 49-day window, which means a player who hits every Void Tide event exactly and manages exhaustion perfectly can arrive at Day 49 with `voidPressure = 7` — still 3 under the ceiling. The pressure is real but not punitive unless the player abandons inn sleep, which compounds via exhaustion.

### E. Curse Score and Endings

```
_curseScore():
  for each EB quest (20 total):
    quest started but return not completed: +2
    quest never started:                   +1
    return completed:                      -1

  range: -20 (all returned) to +40 (none started)

_covenantStanding():
  curseScore ≤ -6 + pitWins ≥ 5 + ebNegotiated ≥ 5 → 'Covenant Keeper (True)'
  curseScore ≤ -2                                  → 'Covenant Keeper'
  curseScore ≤ +5                                  → 'Sealed'
  curseScore ≤ +15                                 → 'Compromised'
  curseScore >  +15                                → 'Doomed'
```

`ebNegotiatedPayments` tracks how many EB quest givers the player negotiated a reduced fee with rather than paying in full. This is a separate ethical axis from quest completion — you can complete all quests but extract maximum value from each NPC. The True Covenant Keeper ending requires quest completion, arena reputation, *and* fair dealing with quest givers. It is not achievable by fighting alone.

---

## XII. S-Suggestions System (S1–S60)

The S-Suggestions system is the record of how 53 targeted narrative and UX additions were layered into the game without restructuring the architecture. Each suggestion follows the same pattern:

1. Add one or more flags to `_S_DEFAULTS()` to track the new state
2. Add a new const dict at the top of the file for the new content
3. Inject both into `storyRender()` and/or `_getNPCDialogue()` behind guard conditions

Representative additions:

**New state flags in `_S_DEFAULTS()`:**
```
s29LineDelivered       // tracks whether the S29 Auros/Froberger line has fired
s49BrynnDelivered      // tracks the Brynn ledger delivery beat
archiveVisited         // Blue Shutters archive first-visit flag
s8VargaWatches         // Varga watchman ambient trigger
frobergerLastEntryRead // set when entry 41 is collected; gates NPC reactions
pitWins                // count of Pit arena victories
actThreeWeightDone     // prevents Act III NPC weight from firing twice
```

**New ambient constant dictionaries:**
```
NIGHT_AMBIENT              // time-of-day flavor text variants
EB_NG_PLUS_LINES           // EB dialogue additions for New Game Plus
QUILL_UNFINISHED_SONGS     // ambient text for the Quill musician NPC
BLUE_SHUTTERS_ARCHIVE_TEXT // lore text for the archive node
FROBERGER_TRACES           // NPC-specific reactions to Froberger's journal
NPC_CROSS_REFS             // inter-NPC reference lines (fired every 3rd visit)
NPC_FAREWELLS              // departure lines when leaving an NPC's node
NPC_ACT_THREE_LINES        // Act III narrative weight injections per NPC
```

The S-Suggestions system demonstrates that the one-file architecture's flatness — which is its main cost — is also its main extensibility advantage. Adding a new narrative beat requires touching exactly two places: `_S_DEFAULTS()` and the render path where the beat should appear. There is no component tree to navigate, no import graph to update, no state management layer to extend. The flat scope is the extension API.

---

## XIII. Conclusion

The architecture of `roll2hit-v3.html` teaches something that framework-heavy development obscures: most of the complexity in a web application is not in the rendering layer or the state management layer. It is in the domain. A complete D&D 5e combat engine, a 76-node narrative campaign, 370 monsters, 20 Epic Boss quests, a 49-day survival clock, a five-axis ending system, and 6 voiced NPCs — these are hard problems. How they are bundled (one file, no build step) is almost beside the point.

### A. What the One-File Constraint Enables

Zero deployment friction. The game can be opened from a file system, emailed, mirrored, or hosted on any static server. No build chain means no broken build chain. No modules means no import resolution errors, no version conflicts, no bundler configuration. The cognitive overhead of "how do I run this?" is exactly zero.

The flat scope is a feature for solo development. When every function and every data structure are in the same file, navigation is `Ctrl+F`. Refactoring is search-and-replace. There is no indirection to trace. For a project maintained by one person, this is faster than any module system.

### B. What It Costs

A 14,377-line file with a linear function organization. Functions are not grouped by domain in any enforced way — the grouping exists by convention, not by module boundary. A function like `_buildWeckmannLog()` lives 12,000 lines from `_S_DEFAULTS()` and mutates the same state. The only thing preventing unintended coupling is the programmer's knowledge of the full file. There is no tree-shaking. There is no dead code elimination. Everything ships.

The render architecture — full section rewrite on every navigation — is correct for this scale but would not survive 10× growth. At 76 nodes and ~107 state fields, rebuilding `#story-desc` on every navigation is imperceptibly fast. At 500 nodes or 800 fields, the cost would compound.

### C. What the Architecture Teaches

The game exists as a finished, complete software artifact. It does not depend on infrastructure that might go away. It does not require a build environment to be re-created. The choices that look like limitations — no framework, no modules, no build step — are exactly the choices that make it durable.

There is a category of software that is better served by directness than by abstraction. A D&D combat calculator that grew into a full narrative RPG, maintained by one person, designed to open anywhere — this is that software. The architecture is not a compromise. It is the correct tool for the problem.

The lesson is not "single files are good." The lesson is: choose your constraints deliberately, design everything inside them cleanly, and know exactly what you are trading. Roll2Hit trades build-time optimization for run-time simplicity, trades module isolation for flat visibility, trades framework tooling for zero dependency risk. The trades are explicit. The artifact lasts.

---

*End of report.*


---
*© 2026 roll2hit.com — MIT License. See [LICENSE](LICENSE) for full text.*
