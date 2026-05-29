<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Lab Report — Layer 44: The Ally Cat Arc ("Nine Lives, Capisce?")

**Date:** 2026-05-25  
**Layer:** 44  
**Section:** §IX  
**Status:** ✅ Implemented 2026-05-25 (duplicate QUEST_DB block removed 2026-05-25)

---

## 1. Scope

Adds the Ally Cat Arc — a Goodfellas × Grease mob-cat faction arc accessible from Act I via the Birka Slums (SL) node. Deliverables:

- 1 new world node: **CQ — The Cat Quarter**
- 10 new monster entries
- 10 new drop entries
- 1 new WORLD_DB terrain (`cat_quarter`)
- 7 monsters appended to existing `alley` terrain
- 7 quest entries (`quest_cat_01` through `quest_cat_06` + `quest_cat_void`)
- 3 new NPC dialogue profiles (`jimmy`, `sandy_cat`, `don_fluffissimo`)
- 1 new HUNTING_GROUNDS entry

---

## 2. New Node: CQ — The Cat Quarter

| Field | Value |
|---|---|
| `num` | 77 |
| `code` | `CQ` |
| `name` | `cat_quarter` |
| `label` | `The Cat Quarter` |
| `act` | 1 |
| `N` | null |
| `S` | null |
| `E` | null |
| `W` | `SL` |
| `npc` | `Jimmy Two-Tails` |
| `battle` | `{label:'Beefy Tom × 3', key:'beefy_tom', count:3}` |
| `loot` | `Tiny Fedora` |
| `sleep` | false |
| NODE_COORDS | `CQ:{r:4, c:17}` (one east of SL at r:4, c:16) |

Wire change: SL node gets `E:'CQ'` added to its connection object.

Node text: *"Narrow brick lanes, broken glass, discarded fish bones. Every surface is scratched. Not vandalism — territorial markings, dense as wallpaper. A large orange tabby sits on an overturned crate wearing what appears to be a very small fedora. He sees you and doesn't move."*

---

## 3. Monster Pool (10 new entries)

Insertion point: after `rug_spider` block (Layer 44 section), new `// ── Ally Cat Arc ──` comment block.

| Key | Name | AC | HP | ATK | Damage | Tier |
|---|---|---|---|---|---|---|
| `stray_alley_cat` | Stray Alley Cat | 11 | 6 | +3 | 1d4+1 | trivial |
| `fluffy_cat` | Fluffy Cat | 12 | 9 | +4 | 1d4+2 | trivial |
| `beefy_tom` | Beefy Tom | 13 | 18 | +4 | 1d6+2 | easy |
| `fat_merchant_cat` | Fat Merchant Cat | 11 | 22 | +3 | 1d6+1 | easy |
| `honcho_cat_m` | Honcho Cat (Capo) | 14 | 32 | +5 | 1d8+3 | medium |
| `honcho_cat_f` | Boss Lady Honcho | 15 | 36 | +6 | 1d8+4 | medium |
| `corrupted_cat` | Corrupted Cat | 13 | 28 | +5 | 1d6+3 | medium |
| `taz_devil` | Taz Devil — Furball Tornado | 16 | 70 | +8 | 2d8+4 | hard |
| `fat_cat_boss` | Don Fluffissimo | 17 | 90 | +7 | 2d6+5 | hard |
| `cat_king` | The Cat-King | 19 | 160 | +10 | 3d8+6 | deadly |

### Monster Drops (10 entries)

| Key | Drop Name | Icon | Sell |
|---|---|---|---|
| `stray_alley_cat` | Flea-Dusted Pelt | 🐱 | 1 |
| `fluffy_cat` | Tuft of Fluff | 🐾 | 2 |
| `beefy_tom` | Cracked Claw | 🦴 | 4 |
| `fat_merchant_cat` | Embossed Coin Pouch | 💰 | 12 |
| `honcho_cat_m` | Tiny Fedora | 🎩 | 8 |
| `honcho_cat_f` | Rhinestone Collar | 💎 | 10 |
| `corrupted_cat` | Void-Singed Whisker | ⚡ | 7 |
| `taz_devil` | Furball Crown | 🌀 | 18 |
| `fat_cat_boss` | The Don's Signet Ring | 💍 | 35 |
| `cat_king` | Cat-King's Claw Fragment | 👑 | 50 |

---

## 4. WORLD_DB Changes

### 4a. Append to existing `alley` terrain monsters array

Add these 7 keys to the existing `alley` terrain's `monsters` array:
```
P.stray_alley_cat, P.fluffy_cat, P.beefy_tom, P.honcho_cat_m,
P.honcho_cat_f, P.corrupted_cat, P.taz_devil
```

Note: `fat_merchant_cat`, `fat_cat_boss`, and `cat_king` are CQ-exclusive — not added to generic `alley`.

### 4b. New `cat_quarter` terrain entry

```js
cat_quarter: { label:'The Cat Quarter', icon:'🐱', monsters:[
  P.stray_alley_cat, P.fluffy_cat, P.beefy_tom, P.fluffy_cat,
  P.honcho_cat_m, P.honcho_cat_f, P.fat_merchant_cat,
  P.corrupted_cat, P.taz_devil, P.fat_cat_boss
] }
```

Note: `fluffy_cat` appears twice (higher spawn weight per spec). `cat_king` is reserved for the Q-CAT-06 boss encounter and not in the random pool.

---

## 5. Quest Chain (7 entries)

All quests use existing QUEST_DB structure. Flags stored in `S_story.quests[key]`.

| ID | Key | Level | Trigger | Reward |
|---|---|---|---|---|
| Q-CAT-01 | `quest_cat_01` | 3 | First CQ visit; Jimmy auto-dialogue | 200gp + Tiny Fedora trophy |
| Q-CAT-02 | `quest_cat_02` | 3 | `quest_cat_01 === 'complete'` | 350gp + Sandy unlocks at CQ |
| Q-CAT-03 | `quest_cat_03` | 4 | `quest_cat_02 === 'complete'` | 500gp + Rhinestone Collar trophy |
| Q-CAT-04 | `quest_cat_04` | 4 | `quest_cat_03 === 'complete'` | 750gp + Furball Crown + Tommy appears |
| Q-CAT-05 | `quest_cat_05` | 4 | `quest_cat_02 === 'complete'`; Sandy gives | 900gp + Don's Signet Ring + vendor chip |
| Q-CAT-06 | `quest_cat_06` | 5 | Both `quest_cat_04` AND `quest_cat_05 === 'complete'` | 1500gp + Cat-King's Claw Fragment + `catKingDefeated:true` |
| Q-VOID | `quest_cat_void` | — | After Q-CAT-02; CQ board auto-appears | 400gp + Void-Singed Whisker ×3 |

### Quest mechanic notes

- **Q-CAT-01:** Kill target = 5× stray_alley_cat AND 3× fluffy_cat in CQ terrain. Track via kill counters in QUEST_DB.
- **Q-CAT-03 merge mechanic:** If honcho_cat_m and honcho_cat_f appear in same battle, second wave loads `taz_devil`. Quest fails the "clean kill" condition; player gets credit for killing each separately.
- **Q-CAT-05 vendor chip:** "Kenickie's Black Market" — fish bait + minor potions at 10% discount. Add to CQ node's vendor array on quest completion.
- **Q-CAT-06 flag:** `catKingDefeated:true` added to `_S_DEFAULTS()`. Parallels `pitChampionWon` pattern.

---

## 6. NPC Characters

### 6a. NPC_DIALOGUE (node auto-text on first visit)

**CQ node entry** — Jimmy Two-Tails opening quote (fires on first CQ visit):
> *"Listen. LISTEN. I'm gonna tell you somethin' and I'm only gonna say it once. The Taz Devil? It ain't a monster. It's a SITUATION. Two Honchos merge and boom — situation. You wanna help? You help by makin' sure they don't get within three blocks of each other. Capisce?"*

### 6b. NPC_DIALOGUES profile entries

Three new keys: `jimmy`, `sandy_cat`, `don_fluffissimo`.

**`jimmy` — Jimmy "Two-Tails" Carbonara (Orange tabby, fedora, fixer)**

| State | Tone |
|---|---|
| hostile | Suspicious; doesn't talk to strangers without a reference |
| neutral | Street-formal; lots of "Listen" and "Capisce" |
| friendly | Warm-gruff; treats player like a made guy |
| dear | Calls player honorary Ally Cat; final Q-CAT-06 speech |

**`sandy_cat` — Sandy "Scratchpad" Mewlino (Tortoiseshell, Grease-queen)**

| State | Tone |
|---|---|
| hostile | Dismissive; "Who sent you, sweetheart?" |
| neutral | Sharp; calls out merge culture as disrespect |
| friendly | Conspiratorial; trusts player with Merchant Cat intel |
| dear | Gives Q-CAT-05; rallies around Corrupted Cat concern |

**`don_fluffissimo` — Don Fluffissimo (Persian, speaks very soft, very slow)**

| State | Tone |
|---|---|
| hostile | "Unfortunate" opener; bodyguards appear |
| neutral | Measured; counts everything you haven't brought him |
| friendly | Not accessible — he's always the antagonist of Q-CAT-05 |
| dear | N/A — he's a boss fight, not an ally |

*Note: Tommy No-Ears DeVito and Kenickie Clawnickie Mancuso are encounter/dialogue NPCs, not full profile NPCs. Their lines appear as storyMsg beats at quest completion milestones, not as NPC_DIALOGUES entries.*

---

## 7. New State Flags

Added to `_S_DEFAULTS()`:

```js
catKingDefeated: false,
```

Quest keys (`quest_cat_01` through `quest_cat_06`, `quest_cat_void`) handled by existing QUEST_DB machinery — no explicit default flags needed.

---

## 8. HUNTING_GROUNDS Entry

```js
cat_quarter: { displayName:"The Cat Quarter" }
```

---

## 9. Insertion Order for `roll2hit-v3.html`

| Step | Target | Location hint |
|---|---|---|
| 1 | MONSTER_POOL: 10 new entries | After `rug_spider` block, new `// ── Ally Cat Arc ──` block |
| 2 | MONSTER_DROPS: 10 new entries | After `rug_spider` drop |
| 3a | WORLD_DB `alley` terrain: append 7 monsters | Existing `alley:` entry |
| 3b | WORLD_DB `cat_quarter` terrain: new entry | After `defi_land` entry |
| 4 | NODE_MAP: CQ entry (num:77) | End of node list; also patch SL to add `E:'CQ'` |
| 5 | NODE_COORDS: `CQ:{r:4, c:17}` | Coords object |
| 6 | QUEST_DB: 7 quest entries | After existing side quests |
| 7 | NPC_DIALOGUE: CQ auto-text | CQ entry |
| 8 | NPC_DIALOGUES: `jimmy`, `sandy_cat`, `don_fluffissimo` | After existing NPC profiles |
| 9 | HUNTING_GROUNDS: `cat_quarter` | HUNTING_GROUNDS object |
| 10 | `_S_DEFAULTS()`: `catKingDefeated:false` | State factory |
| 11 | storyRender: Q-CAT-01 auto-dialogue at CQ | Node render block for `'CQ'` |
| 12 | storyRender: Quest progression beats (Q-CAT-02 through Q-CAT-06) | Node render blocks |

---

## 10. Documentation Updates on Completion

| File | Update |
|---|---|
| `monsters.md` | Add Ally Cat Arc section (10 entries); update header count; update Source Groups row |
| `story.md` | Add CQ node entry; add 7 quests; add Jimmy/Sandy/Don NPC profiles |
| `maps.md` | Add CQ to node grid (r:4, c:17); wire SL↔CQ connection |
| `world.md` | Add `cat_quarter` terrain entry; note Corrupted Cat/DF node overlap |
| `index.md` | Add CQ to node cross-reference; note cat community arc |
| `plan.md` | Update §IX from PLANNED to ✅ Implemented |

---

## 11. Risk Notes

- **Node num:77** — verify no existing node uses 77. Current highest observed is Layer 69's nodes in the 70s range; confirm with grep before insertion.
- **SL patch** — SL node already has E/W/N/S connections; adding `E:'CQ'` must not overwrite an existing `E` value. Check SL node definition before patching.
- **`alley` terrain** — adding 7 new cats to the existing `alley` terrain widens random encounter pool for all alley nodes (not just CQ). Acceptable per spec (alley encounters are intended to include cat types), but note the pool expansion.
- **`fluffy_cat` double entry** in `cat_quarter` monsters array is intentional (higher spawn weight).
- **NPC_DIALOGUES `jimmy` key** — confirm no collision with existing NPC keys named `jimmy` or `Jimmy`.
