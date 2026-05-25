# Lab Report — Yugurt Lake & Fishing With D&D Dice
### A Predator Fish Encounter System for roll2hit.com
**Date:** 2026-05-22
**Project:** roll2hit.com · story mode
**Framework:** Codex of Conquest × mechanical honesty

---

## THE CONCEPT

Yugurt Lake is a mirror-flat body of water south of the Western Wilds Crossroads. No wind. No birds. A hand-painted sign on a stick at the shore says: YUGURT. The surface moves once, slowly, then stops.

Something very large is in this lake, and it knows you are there.

Fishing in most games is a patience mechanic — wait, press button, get fish. That is not what this is. This is a **predator encounter system** dressed as fishing. The rod is bait. The fish are what answer.

Every fish in Yugurt Lake is a combatant. Rank 1 is a Needle Minnow (AC 5, HP 4). Rank 20 is Yugurt's Dread (AC 20, HP 220, 4d12+9 per turn). The lake doesn't sort them. You cast a line and something answers.

---

## THE FISHERMAN

At Yugurt Cabin, south of the lake, there is an NPC called The Fisherman. He walks circuits around the cabin and says two things:

> *"...Nice Day For Fishing. Yugurt! ...Nice Day For Fishing. Yugurt!"*

He says this continuously. The cabin is free to sleep in. He charges nothing.

The Fisherman is an Epic NPC in the mechanical sense — he appears in the `EB_NPC_DIALOGUE` pool alongside Woodcutter Bram and Captain Rhistle and the rest — but he has no epic quest. He doesn't send you anywhere. He doesn't need anything. He is simply there, fully present, announcing the condition of the day.

The cabin has a Fishing Rod in its loot. You can take it.

---

## THE FISHING ROD

The Fishing Rod is an inventory item of type `item`. It has one mechanical function: it grants the **Hooked** condition when selected in the pre-battle screen before a fish encounter. Hooked gives Advantage on attack rolls for that battle, representing the fish's impaired movement during the hook-and-line struggle.

The rod has no sell value. It doesn't break. It stays in your inventory indefinitely, which is correct — it's a fishing rod.

---

## THE 2d20 RANGE MECHANIC

When you click **Cast a Line** at Yugurt Lake, two d20s are rolled independently. This is not a standard D&D roll. There is no advantage/disadvantage logic. Both dice count, and they establish a **range**:

- **Lower die** = rank floor (minimum fish rank eligible)
- **Upper die** = rank ceiling (maximum fish rank eligible)

From all fish with rank between floor and ceiling inclusive, one is selected at random.

**Examples:**

| Roll | Range | Eligible Ranks | Effect |
|------|-------|----------------|--------|
| 1, 20 | 1–20 | All 20 | Any fish possible |
| 1, 1 | 1–1 | Rank 1 only | Needle Minnow guaranteed |
| 20, 20 | 20–20 | Rank 20 only | Yugurt's Dread guaranteed |
| 7, 14 | 7–14 | Ranks 7–14 | 8 fish eligible |
| 19, 20 | 19–20 | Ranks 19–20 | Only the two deadliest |

When both dice match, it's a certainty — you are fighting exactly that rank of fish. When you roll 1 and 20, the lake decides. You put the hook in, and whatever lives in that water comes up.

This is honest. The mechanic tells you exactly what you risked.

---

## THE FISH POOL (All 20 Ranks)

Each fish has poison, barb, or predator naming to signal that none of these are passive catches.

| Rank | Name | AC | HP | Atk | Damage | Tier |
|------|------|----|----|-----|--------|------|
| 1 | Needle Minnow | 5 | 4 | +2 | 1d3 | trivial |
| 2 | Barbed Gudgeon | 6 | 7 | +2 | 1d4 | trivial |
| 3 | Spine Perch | 7 | 11 | +3 | 1d4 | trivial |
| 4 | Venom Roach | 8 | 16 | +3 | 1d6 | trivial |
| 5 | Razorback Carp | 9 | 22 | +4 | 1d6 | easy |
| 6 | Poison Bream | 9 | 28 | +4 | 1d6+1 | easy |
| 7 | Barbed Tench | 10 | 35 | +5 | 1d8 | easy |
| 8 | Spike Eel | 11 | 44 | +5 | 1d8+1 | easy |
| 9 | Venom Pike | 11 | 50 | +5 | 1d8+2 | medium |
| 10 | Razorfin Zander | 12 | 60 | +6 | 1d8+2 | medium |
| 11 | Barb-Tail Catfish | 13 | 72 | +6 | 2d6+1 | medium |
| 12 | Poison Asp Eel | 13 | 85 | +7 | 2d6+2 | medium |
| 13 | Razorcrown Bass | 14 | 100 | +7 | 2d6+3 | hard |
| 14 | Spine Lurker | 15 | 115 | +8 | 2d8+1 | hard |
| 15 | Venom Maw | 15 | 132 | +8 | 2d8+3 | hard |
| 16 | Deepbarb Gharial | 16 | 150 | +9 | 2d10+2 | hard |
| 17 | Yugurt's Fang | 17 | 168 | +10 | 3d8+3 | deadly |
| 18 | Razorscale Elder | 18 | 188 | +11 | 3d10+4 | deadly |
| 19 | Barbed Leviathan | 19 | 205 | +12 | 4d10+6 | deadly |
| 20 | Yugurt's Dread | 20 | 220 | +13 | 4d12+9 | deadly |

Fish ranks 1–4 are trivial: something you could beat at level 1 before your stats developed. Fish ranks 17–20 are deadly: comparable to Epic Battleground bosses. Rank 20 hits as hard as most Epic Bosses and has more HP than the base Auros fight.

The lake does not grade on a curve.

---

## WHY THE FISH DON'T LOCK THE NODE

Normal combat marks `defeatedBattles[nodeCode] = true` after a win. That flag prevents you from fighting at that node again — it's what makes each terrain battle a one-time event.

Fish battles don't do this. The flag is `pb.fish = true` and the lock check reads:

```js
if (won && pb && !pb.corridor && !pb.stalk && !pb.fish) S_story.defeatedBattles[pb.nodeCode] = true;
```

This is correct. Yugurt Lake has 20 different fish. You cast a line every time you want to fish. The lake replenishes. You are not winning the lake — you are fishing in it.

---

## THE D&D RULESET CONNECTIONS

The fishing mechanic is built entirely from existing roll2hit combat infrastructure:

- **2d20 → fish selection**: Pure dice math. No external lookup tables, no random number fudging. Roll it, compute the range, pick from the eligible pool.
- **Pre-battle screen**: Same overlay used for regular terrain battles. Conditions apply. Stealth applies. The Fishing Rod grants Hooked (Advantage) as a standard condition item.
- **Combat**: Full D&D 5e combat rules. The fish rolls initiative, has AC, makes attack rolls, takes conditions, can be flanked with off-hand daggers.
- **Victory rewards**: Standard tier-based XP and gold formula (`floor(0.1 × AC × maxHP)`). A rank-20 Yugurt's Dread pays out comparably to a hard dungeon boss.
- **Death saves**: If a rank-20 fish drops you to 0 HP, the death save system activates. You can die fishing. The Fisherman will not be surprised.

---

## THE NARRATIVE LOGIC

Yugurt Lake exists south of the Western Wilds Crossroads at node J6, which is act 3 content — mid-to-late game. You walk south. The lake is there. A cabin is further south.

The Fisherman doesn't explain the lake. He doesn't warn you. He says it's a nice day for fishing. He has been saying this for a long time.

The lake's name is Yugurt because the Fisherman named it. Yugurt's Dread lives there because the Fisherman has met it. He is still fishing.

This is the correct emotional register for an optional act-3 side location: a man who knows exactly what is in the water, considers it a nice day, and is grateful you showed up.

---

## DESIGN NOTES

**Why 2d20 instead of 1d20?**
One d20 means you have equal probability of any fish. That's fine but flat — the lake feels featureless. Two d20s create a distribution that clusters toward the middle when dice spread apart, and nails extremes only when dice converge. Rolling 1 and 20 gives you the widest possible range. Rolling two identical numbers gives you certainty. It rewards attention to what you rolled, not just the outcome.

**Why not a fishing minigame?**
Roll2hit is a D&D combat engine. A timing-based click mechanic would be a different game. The 2d20 system converts fishing into the same mechanical language as everything else — dice, ranges, outcomes. The Fishing Rod gives you the same agency as any combat condition item. Everything talks to everything else.

**Why is rank 20 named Yugurt's Dread?**
Because the Fisherman named it too. He has been here longer than you.

---

## CONNECTED NODES

```
J6 (Western Wilds Crossroads, act 3)
 └── S → YL (Yugurt Lake, r:6 c:5) — isFishingLake:true
           └── S → YC (Yugurt Cabin, r:7 c:5) — sleep:true, loot:'Fishing Rod', npc:'The Fisherman'
```

YL has no battle, no NPC, no loot in the NODE_MAP sense. It has one chip: **Cast a Line**. That chip opens the fishing system. Everything else in the node is the text.

YC has sleep at 0 cost. No vendor. The Fisherman is there.

---

## FISH POOL IMPLEMENTATION

```js
const FISH_POOL = [
  { rank:1,  key:'fish_01', name:'Needle Minnow',       desc:'Tiny. Barbed across every fin.' },
  { rank:2,  key:'fish_02', name:'Barbed Gudgeon',       desc:'Bottom feeder with spines along the dorsal ridge.' },
  // ... through rank 20 ...
  { rank:20, key:'fish_20', name:"Yugurt's Dread",       desc:'The apex predator of every lake that ever existed.' },
];
```

The fishing mechanic: roll two d20s (`d1`, `d2`), set `lo = Math.min(d1,d2)`, `hi = Math.max(d1,d2)`, filter `FISH_POOL` for `rank >= lo && rank <= hi`, pick at random, route to `_startFishBattle(fish, hasRod)`.

`_startFishBattle` creates a synthetic `_preBattNode` with `_isFishBattle: true` and `pb.fish = true` on the pending battle — the flags that route to fish-specific monster loading and prevent node lock.

---

## WHAT THE FISHERMAN KNOWS

He knows. He has always known. He considers it a nice day.

---


---
*© 2026 roll2hit.com — MIT License. See [LICENSE](LICENSE) for full text.*
