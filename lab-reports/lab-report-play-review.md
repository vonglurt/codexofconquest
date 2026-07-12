<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — §PLAY-01: Systems & Play Review
### How the game is meant to be played, and where the systems can be improved
**Date:** 2026-07-12
**Project:** roll2hit.com — The Shattered Codex
**Scope:** A systems-and-feel review of the *core engine* — onboarding, combat resolution, enemy AI, the XP/heal/gold economy, the time/Void deadline model, and progression gating. Grounded in a direct read of `roll2hit-v3.html` (combat loop, enemy turn, level-up, new-game/char-create) cross-checked against `mechanics.md` / `README.md`. **Not** a quest-by-quest audit of the ~2,848 UQF quests, nor a narrative-arc review — those are separate gates.

> **Lab-report policy trigger:** *a mechanic redesign touching combat / economy / progression / UI.* The findings below propose changes to enemy AI, the time economy, and the onboarding surface — each a real system change, so they are locked here before any HTML edit, per the Lab Report Policy (CONTRIBUTING.md). This report is **diagnostic**: it defines the problem space and proposed increments; each increment that ships gets its data shapes locked in its own follow-up section (or a child report) before code.

---

## 1. THE INTENDED LOOP (what the game asks of the player)

1. **Create a character** — point-buy (stats 8–15 on a budget) or "Hard" mode (all 8s). `roll2hit-v3.html:36858`
2. **Wake in Birka** (node `LHR`, "City Streets — Birka", Act 1) — a Fighter Champion with a Pointy Stick, a crude −3 Flint Dagger, 2 Minor potions, 150 gold. `storyNewGame`, `23159`
3. **Explore a MUD-style world** — N/E/S/W move one cell; roads are safe (encounter rate 0), wilderness rolls the terrain rate; **movement is timeless** (no clock advance). Click a distant tile to auto-travel.
4. **Fight** with the 1.5-AP action economy — Attack / Wimper / offhand / potion / scroll / shield / flee. Win → `XP = AC × maxHP`, plus a **free heal and gold each equal to `0.1 × AC × maxHP`** (`_storyBattleVictory`, `24347`).
5. **Level up** the Fighter Champion (d10 HD, ASIs, Action Surge, Extra Attack, crit widening) toward the **Level 20** cap.
6. **Deepen NPC bonds** (6 Birka NPCs) — the ending "notices what you shared, not what you killed."
7. **Beat the deadline** — win condition: **7 Codex Shards** + **Level 20** + defeat **Commander Auros** (AC 22 / HP 300) at node CO, all before **Day 49**. Sleeping advances the day (`34771`); Void Tide events hit on days 3/7/14/21/28/35/42; `voidPressure` 10 = defeat.

Supporting systems: a fishing mini-game (the **only** source of positive-magic gear), 20 Epic Battleground bosses, ~2,848 quests, opt-in mesh multiplayer, New Game+.

---

## 2. WHAT IS WORKING WELL (do not regress)

- **The 1.5-AP action economy is genuine tactical design.** Wimper→heal and Wimper→clean-flee routes, the "offhand requires a real attack first" anti-exploit, and the risky-flee vs safe-flee split are elegant and legible. `mechanics.md:75–96`
- **Free + timeless movement** removes travel tedium without removing danger (roads safe, wild rolls).
- **Death is recoverable, not a wipe** — corpse-run + checkpoint respawn is player-kind.
- **Content volume and architecture** — data-driven UQF quests, a coherent world model, atmospheric prose.

The through-line of the critique: **the systems are richer than their legibility and their opposition.** The player gets a deep toolkit and a dramatic deadline, but is never told the goal (§A), never faces an enemy that uses a toolkit back (§B), and never feels the deadline bite (§C).

---

## 2.5 THE UNIFYING THEME — *The Honest Floor* (closing the say/do gap)

`story.md`'s subject is **transmission failure**. Froberger saw the Void clearly, tried to tell people, and couldn't — *"not because they were stupid, but because understanding requires context you can't give by talking"* — so he stopped telling and started fixing, became the only one who could, and that destroyed him. The **Curse of Knowledge** (Pinker, cited in the Abstract): once you know a thing, you can no longer remember not knowing it.

**Every finding below is that same sin, committed by the engine.** The game *knows* things it refuses to transmit or enact — the story SAYS one thing and the systems DO another. This is not six unrelated bugs; it is one theme with six faces. The north star is Sweelinck's closing line: ***"Come back when you're ready. The floor will be honest."*** The engine's floor is not yet honest. The improvement program is not "add features" — it is **make the systems tell the truths the prose already tells.**

| # | Mechanical name | Diegetic name (matches `story.md`) | The say/do gap it closes |
|---|---|---|---|
| **A** | Objective HUD | **The Courier's Map** | The engine commits the Curse of Knowledge *literally* — knows the goal, won't tell you. Transmit it the way the story already does: the bloodstained map, seven symbols in faded ink that darken as Shards return. |
| **B** | Enemy AI per tier | **The Conqueror's Hand** | Prose: the Void "advances where defenders are thin and retreats where they're strong." Mechanics: enemies stand and trade blows. Make Void-touched enemies press at low HP; mundane beasts flee. Enact the conqueror the prose describes. |
| **C** | Time cost | **No Postponements** | Prose: "The Void does not grant postponements"; Froberger "sealed it seventeen times… each time less present." Mechanics reward that exact failure — grind to capability, never be present. Make the clock bite so the player faces Froberger's choice. |
| **D** | Signpost fishing gear | **Friendships With Magic** | Prose: "magic that is the byproduct of choosing people over efficiency." The magic-gear vector must reach the player *through a person*, not by stumbling on a sub-menu. The soft-lock is a transmission failure. |
| **E** | Potions/conditions | **The Tools Regain Their Weight** | Resolves as a *consequence* of B+C: when the world presses and time is scarce, out-healing and out-grinding stop working, so the tactical tools mean something again. |
| **F** | §DEATH-01 | **The Floor Is Honest** | The respawn message *lies* about what death takes; NG+ silently eats your corpse. Death must tell the truth, and the loop must carry the right things (people — favorability already persists). |
| **G** | mechanics.md sync | **The Map Matches the Territory** | "The thing you make should be giveable." A giveable artifact whose docs lie about its own code betrays the architecture-as-argument. Make the map honest about the territory. |

**The claim:** the story is philosophically complete; the engine has not caught up to it. This reprioritizes the work — **A, F, G are pure honesty fixes** (no design call, ship freely); **B and C are where the engine finally enacts the Void** instead of narrating it (B needs a data-shape follow-up; C is an ASK because it changes what the game *is*).

---

## 3. FINDINGS (grounded, prioritized)

> Each finding carries its **diegetic name** (from §2.5) alongside the mechanical one. The diegetic frame is the design intent; the mechanical detail is the implementation surface.

### §PLAY-01-A — *The Courier's Map* — 🔴 The player is never told the goal *(highest leverage)*
> **Theme:** the engine commits the Curse of Knowledge literally. Transmit the goal the way the story already does — the bloodstained map pressed into your hand.
The whole win condition — 7 shards, Level 20, beat Auros, before Day 49 — is **never surfaced**. The literal string "49 days" appears **exactly once in the entire 37k-line file**, in the *Day-49 defeat* flavor text (`23096`). There is no opening framing of the Void, no persistent main-objective tracker, no "0/7 shards · Day 3/49" chip. A new player is dropped into Birka with atmospheric prose and no stated purpose.
**Proposed (diegetic):** the goal is delivered as **Froberger's map** — the prologue already has the dying courier press "a folded, stained map… four towns and seven symbols in faded ink" into your hand (`story.md:159–163`). Make that literal: an opening framing card in the courier's voice, and a persistent **map/objective chip** — `🔮 Shards 2/7 · ⭐ Lv 8 · ☀ Day 12/49` — whose seven symbols are faded and **darken as each Shard returns**. The HUD is not a sterile tracker; it is the map, and the map is the covenant.
**Type:** UI + one intro overlay. Lowest effort, highest comprehension payoff. Pure honesty fix — no design call.

### §PLAY-01-B — *The Conqueror's Hand* — 🔴 Enemies never make a decision
> **Theme:** the prose calls the Void a conqueror that "advances where defenders are thin." Make the enemies behave like it.
`_storyEnemyTurn` (`24278`) is the *entire* enemy AI: roll `d20 + atk`, apply damage, end turn. Enemies never heal, flee, defend, apply conditions, or vary behavior. **All** tactical richness (conditions, stealth, wimper timing, shields, potions, offhand) lives on the player's side only. A "Deadly ⚠" enemy is not a *tactical* threat — it is bigger numbers. Combat is arithmetic, not a duel.
**Proposed (diegetic):** behavior split along the story's own line between *mundane* and *Void-touched*. **Void-corrupted enemies advance where you are thin** — press harder when your HP is low (enrage under ~30%), or land a one-time debuff that punishes a weak defender. **Mundane beasts retreat where you are strong** — flee at low HP, never press. Even one behavior per tier converts fights from an HP race into a duel, and — crucially — makes the *creature the prose describes* the creature you actually fight.
**Type:** additive branch inside `_storyEnemyTurn` (`24278`), keyed off `S.opp.tier` and a Void/mundane tag; **must not** touch the DUEL:CORE / mesh replay path (client-authoritative). Lock the per-tier behavior descriptors in a §PLAY-01-B child report before code.

### §PLAY-01-C — *No Postponements* — 🟠 Heal-on-kill quietly defeats the time economy
> **Theme:** "The Void does not grant postponements." Froberger "sealed it seventeen times… each time less present." The mechanics reward exactly his failure.
Every kill heals `floor(0.1 × AC × maxHP)` **and** pays equal gold (`24376`), and movement/combat are timeless. **Sleeping is the only thing that advances the day** (`34771`), and the day is the only thing that pushes the Void deadline. So a competent player heals off kills, grinds XP/gold indefinitely, and sleeps only when *they* choose. The intended "rush-vs-grind under a ticking clock" tension is **self-imposed** — the clock ticks only when the player volunteers it. The framing (49-day doom) and the mechanics (time is nearly free) disagree.
**Proposed (pick one, ASK) — each framed by the theme:** (a) advance time per N cells / per battle, so the Void's clock runs while you fight — *the conqueror advances while you grind*; (b) a slow passive `voidPressure`/day drift — *the breach widens whether or not you are present*; (c) reframe the deadline as generous and drop the doom language — *accept that this run is not the loop*. The richest is any option that ties time spent on raw capability to the **Curse-of-Knowledge / curse score** the game already tracks: grinding for power over people is *literally* Froberger's failure, and the Groundhog Day ending already punishes it — the clock should make the player *feel* that trade in the moment, not only at the epilogue.
**Type:** tuning + one new time-advance hook. Interacts with §DEATH-01 (checkpoint), Void Tide pacing, and `_curseScore()`. **ASK** — it changes what the game is.

### §PLAY-01-D — *Friendships With Magic* — 🟠 Positive-magic gear is hidden behind an optional mini-game
> **Theme:** "magic that is the byproduct of choosing people over efficiency." The magic path should reach you through a person, not a stumbled-upon sub-menu.
By deliberate design (§FC06), **all** +1…+4 weapons/daggers are *fishing-exclusive*; monster kills only drop base-tier −4..0 gear (`_rollMonsterWeaponDrop`, `23740`). A player who never discovers fishing is **permanently capped at base weapons** through the whole game, including Auros (AC 22 / HP 300) — the single most important power vector sits behind an easily-missed sub-system.
**Proposed (diegetic):** the magic path already *starts* with a person — the Fisherman hands you the rod free, the Outsider Merchant recites the guide from memory (Curse of Knowledge: he *knows* and can only transmit by giving you the pamphlet). Lean all the way in: make an **NPC point you to the magic** as a relationship beat, so the single most important power vector is felt as "someone chose to help you," not "a menu you happened to open." Alternatively/additionally, a small reliable secondary vector woven into the covenant NPCs' quests. Either way, **preserve** the "fishing gives a permanent edge" intent — do not re-open generic magic drops.
**Type:** content signposting through NPC dialogue and/or a handful of authored relationship rewards.

### §PLAY-01-E — *The Tools Regain Their Weight* — 🟡 Potions and conditions are near-vestigial for a skilled player
Potions are exponentially priced to track HP, but heal-on-kill already refills you free every fight. Conditions cost 1,000–5,000 gold, but you rarely need them because enemies are passive (§B) and you out-heal. A large slice of the gold economy is a sink with weak pull. Fixing §B and §C would restore purpose to potions/conditions without touching their pricing.
**Type:** falls out of §B/§C; no standalone work unless those stall.

### §PLAY-01-F — *The Floor Is Honest* — 🟡 Death-system gaps → already scoped as §DEATH-01
> **Theme:** "Come back when you're ready. The floor will be honest." Death currently lies about what it takes, and the loop silently discards what should carry over.
Confirmed the `BACKLOG.md` §DEATH-01 findings: the respawn message *lies* (equipped gear survives death, message says you keep only a dagger); 100% gold loss is brutal for a fresh L1; the corpse-signal chip CSS exists but no JS renders it; entering NG+ **permanently deletes** un-recovered corpses; death is not atomically saved. These remain the right fixes; §DEATH-01 owns them.
**Type:** see §DEATH-01 (blocked on 3 user design calls).

### §PLAY-01-G — *The Map Matches the Territory* — 🟢 Documentation drift (maintenance risk, not a play bug)
> **Theme:** "The thing you make should be giveable." A giveable artifact whose docs lie about its own code betrays the architecture-as-argument.
The docs have diverged from code and self-contradict:
- `mechanics.md` §Main Hand Weapons claims "42 entries" + "15% drop via `_rollMainWeaponDrop()`"; §Dagger Drops claims "12% via `_rollWeaponDrop()`". **Both functions are deleted** — only `_rollMonsterWeaponDrop` exists (`23740`) — and `WEAPON_ITEMS` is 70. The same doc's Loot Table section correctly says weapons are fishing-exclusive, contradicting itself.
- `_magicTierAllowed` is `level ≥ magic × 5` in code (`23668`); the §Weapons section says `minLevel = baseLv + magic × 4`.
- Docs reference start node code "CI"; the actual node is `LHR` (labeled "City Streets — Birka").
**Type:** a `mechanics.md` sync pass (two-way doc-sync policy). Low effort, restores spec trust.

---

## 4. PRIORITY ORDER

The theme reprioritizes by *kind*: the **honesty fixes** (A, F, G) ship freely; the **enactment fixes** (B, C) are where the engine finally does what the prose says, and carry design weight.

| # | Finding (diegetic) | Kind | Effort | Payoff | Blocker |
|---|---------|------|--------|--------|---------|
| 1 | §PLAY-01-A *The Courier's Map* | honesty | Low | Massive comprehension | — |
| 2 | §PLAY-01-B *The Conqueror's Hand* | enactment | Med | Combat becomes a duel | design follow-up |
| 3 | §PLAY-01-C *No Postponements* | enactment | Med | Restores core tension | **ASK** (a/b/c) |
| 4 | §DEATH-01 (=§PLAY-01-F *The Floor Is Honest*) | honesty | Med | Closes last real feature | **ASK** (3 calls) |
| 5 | §PLAY-01-D *Friendships With Magic* | honesty | Low–Med | Fixes hidden soft-lock | — |
| 6 | §PLAY-01-G *The Map Matches the Territory* | honesty | Low | Restores spec trust | — |

**Recommended first slice:** §PLAY-01-A *The Courier's Map* — pure honesty, no design call, no balance risk, and the single biggest comprehension win. Then take the §PLAY-01-C *No Postponements* ASK to the user, since it reframes what the game *is*.

---

## 5. EVIDENCE (file:line)

- `storyNewGame` / char-create: `roll2hit-v3.html:23159`, `36858`
- Enemy AI (whole): `_storyEnemyTurn`, `24278`
- Victory heal + gold + XP: `_storyBattleVictory`, `24347` / reward `24376`
- Day advance (sleep-only): `34771`; Void Tide dispatch `34860`; voidPressure clamp `25999`
- Fishing-exclusive weapon drop: `_rollMonsterWeaponDrop`, `23740`; tier gate `_magicTierAllowed`, `23668`
- "49 days" appears once (Day-49 defeat flavor): `23096`
- Start node identity: `LHR` = "City Streets — Birka", `8149`

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
