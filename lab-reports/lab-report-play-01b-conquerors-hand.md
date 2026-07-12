<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
# Lab Report — §PLAY-01-B *The Conqueror's Hand*: enemy AI per tier

**Parent:** `lab-reports/lab-report-play-review.md` §PLAY-01-B · **Track:** BACKLOG.md §PLAY-01
**Date:** 2026-07-12 · **Class:** enactment (carries design weight) · **Status:** ✅ SHIPPED 2026-07-12 — user decisions: **(1) name/terrain heuristic · (2) flee earns effort XP → spun off §XP-01 · (3) one-time enrage**. See BACKLOG.md §PLAY-01-B for the ship record.

## 1. The say/do gap (verified in code)

`_storyEnemyTurn()` (`24365`) is the **entire** single-player enemy AI: roll `d20 + S.enemy.atk`, on hit deal `dmgCount·dmgDie + dmgFlat`, end turn. There is **no** branch on HP, tier, or monster kind — enemies never heal, flee, defend, or debuff. So a "Deadly ⚠" enemy differs from a kobold only in **bigger numbers**, never in behavior. Meanwhile `story.md` says the Void "advances where defenders are thin and retreats where they're strong" — the mechanics enact neither.

Monster shape today (`MONSTER_POOL`, `5338`): `{ key, name, ac, hp, atk, dmgDie, dmgCount, dmgFlat, tier }` where `tier ∈ {easy, medium, hard, deadly}`. **No alignment/kind field exists.**

## 2. Proposed design — press vs. flee, additive and safe

Two behaviors, mapped to the story's two halves:

- **Void-touched enemies *press* at low HP** (advance where you're thin): at ≤30% HP, a **one-time** escalation — either enrage (`+atk` / an extra damage die for the rest of the fight) or a single debuff on the player. One-time so it reads as a turn of the screw, not an oppression spiral.
- **Mundane beasts *flee* at low HP** (retreat where you're strong): at ≤30% HP, a per-turn chance to disengage and escape, ending the fight.

**Implementation surface (locked):** a new additive branch at the **top of `_storyEnemyTurn()`**, gated on `S.opp.hp / S.opp.hpMax`, the monster's kind tag, and `S.opp.tier`. Everything else in the turn is unchanged. **Hard constraint:** the branch lives ONLY in `_storyEnemyTurn` — it must **not** touch the `DUEL:CORE` kernel (`10025`–`10177`) or the mesh duel replay path (PvP determinism depends on that kernel being byte-identical to the server).

**Tier scaling** (so "Deadly" feels like a duel): press magnitude / flee-resistance scale with tier — e.g. `deadly` Void enemies enrage harder and never flee; `easy` mundane beasts flee readily.

## 3. Open design decisions — NEED SIGN-OFF (this is why it's an ASK-adjacent enactment)

1. **How is an enemy classified Void-touched vs. mundane?**
   - (a) **New per-monster `void:true` field** on the ~30–40 Void-aligned entries in `MONSTER_POOL` (explicit, authorable, but a data pass). Everything unmarked = mundane beast.
   - (b) **Heuristic** — infer from terrain (Void/corrupted terrains → Void) and/or name keywords. Zero data pass, but fuzzy and can mis-tag.
   - (c) **Tier-only** — treat `hard`/`deadly` as "Void-touched press", `easy`/`medium` as "mundane flee". Simplest, no new data, but conflates difficulty with alignment (a deadly bear would "press like the Void").
2. **Does a fleeing beast deny the kill — and its loot/XP?**
   - (a) Flee = enemy escapes, **no loot, no XP** (a real cost — you let it get away). Highest tension.
   - (b) Flee = enemy escapes but you still get **partial** (XP only, no drop). Softer.
   - (c) Flee is **cosmetic** — it "tries to flee" but you get one free parting strike / it's run down, normal rewards. No economic impact (safest; pure flavor).
3. **Press = enrage or debuff, and how hard?**
   - (a) **Enrage** — `+atk` and/or an extra damage die for the rest of the fight (simple, numeric).
   - (b) **One-time debuff** on the player (e.g. a single disadvantage/condition round — reuses the existing `S.opp.cond` machinery, `24409`).
   - (c) Both, scaled by tier.

## 4. Verification plan (once shapes are signed off)
1. Inline-script parse — 0 errors.
2. New `tests/integration/enemy-ai.test.js` driving `_storyEnemyTurn` at scripted HP: a Void `deadly` enemy presses once at ≤30% (stat delta applied exactly once, not per-turn); a mundane `easy` beast flees within N turns at ≤30% and the fight resolves with the chosen loot/XP rule; a full-HP enemy behaves exactly as today (regression).
3. **DUEL:CORE untouched** — assert the kernel block is byte-identical (mesh duel replay + `worldbuilder`/mud-harness parity stay green).
4. Screenshot / drive a real low-HP fight of each kind.
