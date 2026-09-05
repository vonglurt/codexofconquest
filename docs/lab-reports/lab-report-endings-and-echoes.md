<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Lab Report — Endings and Echoes: The Covenant Arc

*CodexOfConquest.com / Codex of Conquest — Layer 43 design lock, re-verified against the live engine*

| | |
|---|---|
| **Original** | Layer 43 design document, dated **2026-05-22** (report footer) |
| **First commit** | `32c10c5` 2026-05-24 17:34:49 — the repository's **initial commit**; the whole feature set is already present in it |
| **Ship build** | `32c10c5:play.html` — **14,377 lines / 859,773 bytes** |
| **HEAD build** | 2026-08-22 — the same nine subsystems, at **5.5×** the file |
| **Verified** | §DOC-02cx, 2026-08-22 — source census + exhaustive arithmetic + Chromium (Playwright/`@playwright/test`, 5 measurement specs, 231 state partitions) |
| **Status** | **HISTORY doc.** Legacy 26×16 node codes (`SQ`, `CY`, `DK`, `BA`, `CO`) are left as written — annotate, don't rewrite (§DX-02c / §AUDIT-03n) |

> **⚠️ KEY-DRIFT NOTE (2026-07-31, §AUDIT-03n).** The design-time tables below key their per-NPC entries to the profiles' **surnames** — `couperin` / `weckmann` / `bruhns`. The favor ledger never writes those, so every one of those entries was unreachable in live play until §AUDIT-03n renamed them. Read them as **`quill`** (Bard Tomas Couperin, MHQ) · **`crov`** (Pit Master Weckmann, HKG) · **`auros`** (Cmdr Seraphine Bruhns, HKG). The six canonical keys are `yael` · `brynn` · `quill` · `pachelbel` · `crov` · `auros`, fenced by `check:npcregs` (`check:walk` gate #14). *Re-confirmed 2026-08-22: `_checkRoughWhiskeyReaction('couperin' | 'weckmann' | 'bruhns')` returns `null` at HEAD; the three profile keys return their authored line.* The design intent was never wrong — only the spelling.

---

## Abstract

Layer 43 specifies nine subsystems that turn the game's *relationship* ledger — who you helped, who you came back for — into the text that closes the run: a covenant ceremony, a naming sequence, per-NPC epilogues, a Groundhog-Day echo for the player who sealed alone, a social consumable, a character-sheet standing, a pit-training perk tree, a found note, and New Game+ memory hooks. This re-verification finds the arc **shipped essentially whole**: **23 of 23** named symbols resolve at HEAD, every authored string block is **byte-identical** to the spec, and the ceremony renders in Chromium exactly as drawn. The value is in six deltas, and the largest is arithmetic. `_curseScore()`'s reachable minimum is **−5**; the top Covenant Standing label and the "Covenant Keeper (True)" ending both require **≤ −6**. Across all 231 reachable states, "Covenant Keeper" is returned **zero** times — the perfect 20-of-20 run is labelled *Warden*. Both `_curseScore` and `COVENANT_STANDING_LABELS` are byte-identical from the repository's first commit to HEAD, so **the game's best ending has been one point out of reach for its entire recorded history.** Four further deltas: the five pit perks write five flags that nothing reads; the eighteen Rough Whiskey reactions are reachable only by *losing* the fight that arms them; §VII's stated emotional payoff (Sweelinck speaking your standing back to you) is in no ending branch; and the spec's own named state field, `ebReturnsCompleted`, was created, written, and never read.

---

## I. Introduction — what the feature is for

Everything in the game points at one moment: the seal is placed, the Void is closed, and someone walks out. The question the ending system answers is **who are you when you walk out?**

Not good or bad — the game doesn't grade character. But the ending knows who helped Yael and who didn't. It knows if Quill got to play his song. It knows how many Epic Battleground people were paid in coin instead of blood. Those facts already exist in `S_story`; Layer 43 is the argument that they should be *spoken back*.

**Why this matters for playability.** For most of a run the game measures you the way a combat engine measures: XP, shards, battles won, days remaining against a 49-day clock. Layer 43 is the only system that reads the other ledger. Concretely it adds **54 authored lines that exist for no mechanical purpose** — 12 naming lines, 18 epilogue lines, 18 whiskey reactions, 6 NG+ greetings — every one of them gated on `npcFavorability`, none of them reachable by fighting. It is the payoff that makes NPC favor a *system* rather than a dialogue tint. And it is cheap: no new opcodes, no new movement rules, no gate on the road (invariant #1 is untouched — nothing here ever refuses a step).

The nine subsystems: **(II)** the Covenant Ceremony · **(III)** Sweelinck's dynamic naming · **(IV)** NPC epilogues · **(V)** the Cursed Seal echo · **(VI)** Rough Whiskey as a social item · **(VII)** Covenant Standing on the character sheet · **(VIII)** Pit Training as a perk tree · **(IX)** Froberger's Last Note · **(X)** New Game+ memory hooks.

---

## II. Method

1. **Symbol census** — every construct the report names, grepped at HEAD and at the report's own build (`git show 32c10c5:play.html`).
2. **Byte-diff against the ship build** — the design-time text blocks compared line for line across 90 days.
3. **Exhaustive arithmetic** — `_curseScore()`'s reachable range enumerated over all 231 partitions of the 20 Epic Battlegrounds into `returned` / `started-not-returned` / `never-started`.
4. **Chromium proof** — five measurement specs run through the repo's own Playwright harness (`seedAndLoad` + `dismissContinue`), asserting the arithmetic *through the engine's own functions* rather than a re-implementation, plus a rendered screenshot of the ceremony overlay.
5. **Reader trace** — for every state field and flag the spec introduces, the write sites and the read sites counted separately. A field with writers and no readers is the finding.

---

## III. Result — spec → shipped delta

**23 of 23 named symbols resolve at HEAD.** No section of this report failed as a description of the engine.

| § | Subsystem | Shipped? | Delta |
|---|---|---|---|
| II | Covenant Ceremony | ✅ | Sigil is **amber `#FEA712`**, not "white against black"; **no pulse** keyframe; duration is 6.5 s / 13.2 s, not "8 seconds" (**F6**). Spec's CSS would have mis-drawn it (**F7**) |
| III | Sweelinck's naming | ✅ byte-identical | Gate `missionDone && curse <= 0` is reachable **only at −5** — i.e. it silently requires **all 20** EB returns |
| IV | NPC epilogues | ✅ byte-identical | EB block ships as **one summary count line**, not "one line each"; the gate field the spec names is the dead twin (**F4**) |
| V | Cursed Seal echo | ✅ byte-identical | Predicate `!mc && cs >= 15` shipped exactly as written; `FROBERGER_EPILOGUE.cursed` had no selector (**F5**) — ✅ §DX-02eo appended it to this block's tail 2026-08-26, which is the state it was written for |
| VI | Rough Whiskey | ✅ 18/18 lines | **NOT SHIPPED: the use path.** `roughWhiskeyActive` has one writer, and the fight that sets it clears it on victory (**F3**) |
| VII | Covenant Standing | ✅ sheet row | Unlock is `shards >= 1` (**Act II**), not "after Act III"; **NOT SHIPPED: the payoff** — no ending speaks the label (**F2**); the top rung is dead (**F1**) |
| VIII | Pit Training perks | ⚠️ half | Unlock, message, persistence, badge all ship. **1 of 5 combat effects shipped 2026-09-05** — Weckmann's Lesson (**F8** ✅ §DX-02eq); `readTheRoom` retired as ungrantable, the other three are §DX-02is |
| IX | Froberger's Last Note | ✅ | Item, seeding, loot injection, read panel, 5-line body — all present; seeded with `Math.random()` (**F9**) |
| X | NG+ memory hooks | ✅ greetings + overlay | **NOT SHIPPED:** "the tree resets and unlocks one win faster each run." Perks are *carried over* instead; the spec contradicts itself on this in adjacent sentences |

Anchors at HEAD: `const SWEELINCK_NAMING_LINES = {@27371` · `const NPC_EPILOGUES = {@27408` · `const FROBERGER_EPILOGUE = {@27441` · `const NPC_NG_PLUS_GREETINGS = {@27448` · `const PIT_PERK_UNLOCKS = {@27467` · `const COVENANT_STANDING_LABELS = [@27490` · `const ROUGH_WHISKEY_REACTIONS = {@27498` · `function _covenantStanding()@28173` · `function _buildSweelinckNamingSequence()@28178` · `function _buildEpilogueScroll()@28261` · `function _checkRoughWhiskeyReaction(npcKey)@28301` · `function _checkPitPerkUnlock()@28311` · `function _applyPitPerks(combatState)@28327` · `function _curseScore()@28340` · `function storyCheckVictory(node)@28356`.

---

## IV. Findings

### F1 — "Covenant Keeper" is unreachable, and always has been ⚠️ *the headline*

```js
// function _curseScore()@28191 — byte-identical at 32c10c5 and at HEAD
return (startedNotReturned * 3) + (neverStarted * 1) - (allComplete ? 5 : 0);
```

The bonus for returning to all twenty Epic Battleground contacts is **−5**. A run with any contact unreturned scores ≥ +1. So the reachable set is `{ −5 } ∪ [1, 58] ∪ { 60 }` — **0 is not reachable either.**

> **Corrected 2026-08-25 (§DX-02en), and it is this report's own arithmetic that was one value out.** The band was written here as `[1, 60]`. **59 is not reachable either**: it needs `3s + n = 59` with `s + n ≤ 20`, and `s = 19` leaves room for only `n = 2`. Nothing in F1's argument turns on it — the gap is at the *abandoned* end, not the covenant end — but the assertion that caught it, in `src/tests/integration/dx02en-covenant-standing.test.js`, is the reason the set is now re-derived on every run instead of being transcribed.

```js
// const COVENANT_STANDING_LABELS = [@27356 — also byte-identical since 32c10c5
{ maxScore: -6, label: "Covenant Keeper", desc: "The people you helped are the reason this works." },
```

`_covenantStanding()` returns the first bracket satisfying `score <= maxScore`. Nothing satisfies `≤ −6`. The same threshold gates the "Covenant Keeper (True)" ending: `const _isTrue = missionDone && curse <= -6`@28231.

**Measured in Chromium over all 231 partitions, through the engine's own `_curseScore()` and `_covenantStanding()`:**

| Label reached | Partitions | Requires |
|---|---|---|
| **Covenant Keeper** | **0** | score ≤ −6 — *unreachable* |
| Warden | 1 | score = −5 → **all 20 returns** |
| Keeper | 14 | ≥ 13 returns, none abandoned |
| Watcher | 30 | ≥ 6 returns, none abandoned |
| Wanderer | 186 | everything else — **including the default** |

The player who does the hardest thing the game asks — twenty return journeys, no one left waiting — is handed *"You carry the work with you. It shows."* The line written for them, *"The people you helped are the reason this works,"* is in the file, unreachable, and has been since the first commit. **A design lock whose numbers were correct on the day and whose arithmetic was never run.** → **§DX-02en** 🟡

> **✅ CLOSED 2026-08-25 by §DX-02en.** `Covenant Keeper` moved to `maxScore: -5` and `_isTrue` to `curse <= -5`, so the perfect 20-of-20 run is handed the line written for it. `Warden` moved from `maxScore: 0` to `maxScore: 3` rather than being left decorative: at `-5` its bracket was provably empty, and an unearnable rung is the defect this finding names, not a smaller version of it. The ladder now reads **1 · 4 · 10 · 30 · 186** across the 231 partitions, every rung earned by at least one run. **F2 closed in the same pass** — all four `endingEl` branches now append `_covenantStanding().label`. **Latent until §EPIC-01:** `ebReturnDone` still has no reachable writer, so in *play* the score floor remains 20 (§ENDING-01 (a)); this finding was always about the threshold, and the threshold is now inside the arithmetic's reach.

### F2 — §VII's payoff is in no ending branch

The report's argument for Covenant Standing is explicit and it is the best sentence in the document:

> *"The player sees 'Warden' in their character sheet for 40 hours, then Sweelinck says 'you were a Warden' in the final scene — and they understand. The game never explains the connection. The player makes it."*

`storyCheckVictory` writes four ending texts. **None of them names the player's standing.** The word *Warden* is spoken in exactly one branch — the Cursed Seal echo, *"the Warden who arrived here was capable, dedicated, and efficient"* — as a generic role noun, and that branch fires at `curse >= 15`, where the player's sheet reads **Wanderer**. The connection the player was meant to make cannot be made. → **§DX-02en**

### F3 — 18 whiskey reactions, reachable only by losing ⚠️

`S_story.roughWhiskeyActive` has exactly **one** writer and **two** clearers:

| | Site | Effect |
|---|---|---|
| set `true` | `if (_pb41 && _pb41.nodeCode === 'HKG' && !S_story.roughWhiskeyUsed@24738` | entering the pit fight at HKG (historical `CY`), once per run |
| set `false` | `S_story.roughWhiskeyActive = false;@25341` | **battle victory** |
| set `false` | `storyConfirmSleep` | resting |

The spec's opening — *"consuming Rough Whiskey before visiting any named NPC triggers a unique response"* — has no code. There is no use-item path; the bottle is consumed by walking into one specific fight. Win that fight and the window closes in the same function call that opened it. `_storyFleeClean` / `_storyFleeMutual` do **not** clear the flag, so the only way to hear any of the eighteen authored lines is to **flee or lose the drunk pit fight and then go talk to someone.**

The vendor even promises otherwise, in the game's own voice: `storyMsg('🥃 Bought Rough Whiskey. ★ Social — each NPC reacts differently if you visit them@24447`.

What *did* ship is exact: disadvantage on every attack roll (`if (S_story._drunkFight) adv = 'dis';@25094`), `const drunkBonus = S_story._drunkFight ? 3 : 0;@25121`, and Weckmann delighted — *"You absolute idiot. I'm counting it."* — with a favor bump to Friendly on the win. → **§DX-02ep** 🟡

### F4 — the spec's own state field was created, written, and never read

§IV gates the EB epilogue block on `ebReturnsCompleted >= 10`. The implementer created that field (`journalEntriesRead: [], ebReturnsCompleted: {},` *(the twin deleted, §DX-02eo)*), writes it on every return (`S_story.ebReturnsCompleted[ebCode] = true;` *(deleted, §DX-02eo)*) — and then gated **every** consumer on the sibling `ebReturnDone`, which has nine live readers. `ebReturnsCompleted` has **zero**. A perfect parallel ledger, maintained for 90 days, that nothing has ever consulted.

> **✅ CLOSED 2026-08-26 (§DX-02eo).** Deleted whole — declaration, guard and write — rather than
> repointed, because the spec's `>= 10` gate already exists and already works off `ebReturnDone`.
> `world.md` had rationalised the second write as *"legacy write; kept for save forwards-compat"*,
> which only means something if some reader is waiting for it; corrected there too.

*(The block itself also ships as one summary line — `${ebReturns} of 20 EB contracts fulfilled. The people who sent you those contracts know your name.` — not "one line each" as §IV specifies.)* → **§DX-02eo** 🟢

### F5 — a fourth epilogue key with no selector

`FROBERGER_EPILOGUE` authors four states. `_buildEpilogueScroll` selects three:

```js
if (mc && cs <= 0) lines.push(FROBERGER_EPILOGUE.covenant);
else if (mc)       lines.push(FROBERGER_EPILOGUE.imperfect);
else               lines.push(FROBERGER_EPILOGUE.efficient);
```

`.cursed` — *"Froberger never finished his last entry… That someone was also very good at their work. They did not stay long either."* — is unreachable, because the state it was written for (`!mc && cs >= 15`) returns the Groundhog block earlier in the same function, before the Froberger append. The best line in the set is fenced off by the branch it belongs to. → **§DX-02eo**

> **✅ CLOSED 2026-08-26 (§DX-02eo).** Appended to the Groundhog block's own tail — the cheapest
> honest fix this finding named, and the only one that puts the line in the state it describes.
> All four `FROBERGER_EPILOGUE` keys are now selectable, pinned by
> `src/tests/integration/dx02eo-epilogue-and-twin.test.js` over four `(missionComplete, curseScore)`
> pairs.

### F6 — the ceremony is not eight seconds, and it does not pulse

§II: *"The ceremony is 8 seconds. Not cinematic — precise… the sigil holds for 2 seconds, then slowly pulses — once — and fades."*

Measured: `const sigilDelay = missionDone && curse <= 0@28475` is `4000 + names × 1200 + 2000` ms in the naming branch (**13,200 ms** at six names) and a flat **6,500 ms** otherwise, then an 800 ms fade, then 8,800 ms of final-map render before the victory modal — **16.1 s / 22.8 s** from boss defeat to modal. The stylesheet defines `@keyframes sigil-fade-in@2029`, `@keyframes sigil-draw@2035` and `name-fade`; enumerated at runtime, **there is no pulse rule**. And the stroke has been amber (`#FEA712`) since `32c10c5`, never white.

In the non-naming branches this reads as **~7 seconds of black screen with nothing on it but a sigil** — the ceremony's whole text surface is the naming block, and the naming block only renders at `curse <= 0`.

### F7 — a credit: the implementer fixed the spec's CSS

§II specifies `stroke-dasharray: 600` on every path. The shipped markup carries a per-element custom property instead — `--d:251` on the circle, `--d:80` on each of the four lines. Those are the actual path lengths: 2π·40 = 251.3 for the `r=40` circle, exactly 80 for the two axials, 79.2 for the diagonals. A flat 600 would have drawn the five strokes at five different rates over the same 3 s. *A design lock can be wrong in a way only the geometry can tell you.*

**Rendered proof** (Chromium, animations pinned to their end state, six Dear-Friend names): amber sigil, circle + four interior lines, six italic lines beneath on black. §II and §III render exactly as designed.

### F8 — five perks, five flags, zero readers

```js
// function _applyPitPerks(combatState)@28181 — called from _showBattleOverlay
if (perks.includes('readTheRoom'))          combatState.readTheRoom = true;
if (perks.includes('cornerWork') && ['HKG','LCY'].includes(...)) combatState.cornerWork = true;
if (perks.includes('controlledAggression')) combatState.controlledAggression = true;
if (perks.includes('groundGame'))           combatState.groundGame = true;
if (perks.includes('crovsLesson'))          combatState.crovsLesson = true;
```

Each of the five names occurs **exactly twice in the whole file** — once in `perkList`, once in the assignment above. **Nothing reads any of them.** So all five §VIII effects are NOT SHIPPED:

| # | Perk | Specified effect | At HEAD |
|---|---|---|---|
| 1 | Controlled Aggression | +1 to attack when flanking | flag only |
| 2 | Read the Room | pre-combat enemy HP tier | flag only |
| 3 | Ground Game | free shove on a crit | flag only |
| 4 | Corner Work | 1d4 HP between rounds at DK/CY | flag only (node gate ships correctly as `['HKG','LCY']`) |
| 5 | Weckmann's Lesson | once per rest, cancel disadvantage | flag only |

What *does* ship: sequential unlock at one win per perk, the unlock message in Weckmann's voice, persistence through NG+, and the `Weckmann's Student` badge on the character sheet at 5/5. So the tree is a fully-built ceremony around five no-ops — the player earns it, is told about it, sees it on their sheet, and it changes nothing. `world.md`'s perk table faithfully documents the *write* (`combatState.groundGame = true`) as the effect, which is honest and is also why nobody noticed. → **§DX-02eq** 🟡

> **✅ RESOLVED 2026-09-05 (§DX-02eq) — one wired, four retired, and the row's own recommendation half-disproved.** The row proposed wiring *the two cheapest*, `readTheRoom` and `crovsLesson`. **`readTheRoom` cannot be granted:** its specified effect — row 2's *"pre-combat enemy HP tier"* — is `function _renderPreBatt()`'s threat badge, which renders `TIER · AC · HP ~ · ATK +` for **every** player whenever the monster resolves. Making it a perk means *withholding* it from players who lack the perk, which is a removal of shipped information and the §PLAY-01 defect class this report's own thesis is built on. It is retired.
>
> **Weckmann's Lesson is wired**, and it is the only one §VIII argues for by name. `_applyPitPerks` now decides as well as applies: it spends the charge **only when exhaustion is actually biting** (so a rested fight does not burn it), latches `S.recomposed` for the encounter (so re-entering the overlay mid-fight neither re-announces nor loses it), and `storyConfirmSleep` returns it beside `surgeCharges` and `indomitableCharges`. The exhaustion test itself is named once, as `_isExhausted()`, and the pre-battle warning says the perk will cancel it rather than leaving the player to discover it mid-fight.
>
> **The other three writes were deleted, not left waiting.** +1 when flanking, free shove on a crit and 1d4 between rounds are three combat systems that do not exist, and a flag nothing reads is the defect this row was filed about. They are **§DX-02is**. What survives untouched is everything that was already real: the sequential unlock, the five lines in Weckmann's voice, NG+ persistence, and the badge at 5/5. Pinned by `src/tests/integration/dx02eq-pit-perks.test.js`.

### F9 — the note is seeded off the unseeded stream

`S_story.frobergerNoteNode = _ebPool@24038` **✅ CLOSED by §DX-02er 2026-08-26** — both this line and the NG+ twin now draw `_seededNext()`, so the placement is reproducible from a seed; pinned in `rng-seed.test.js`. (and again in the NG+ path). Invariant #6 requires that randomness affecting game state draw the seeded stream (`_seededNext()`). Which of twenty nodes holds a key item is game state. The value is persisted at new-game time, so a *save* still determines the future — the violation is narrow, but it is a violation of a fence the repo enforces elsewhere. → **§DX-02er** 🟢

### F10 — §I names the wrong node, and it was wrong on the build it was written against

§I opens: *"the covenant at SQ… someone walks out of the cave."*

At `32c10c5`, `storyCheckVictory` reads `if (node.code !== 'CO') return;`. `SQ` (→ `NUE`) is the **Scholar's Quarter — Weimar**, Sweelinck's library. `CO` (→ `TLS`) is the **Cosmic Realm — The Convergence**, an open spire platform where the NPC on station is Commander Bruhns, not Sweelinck. The covenant has never happened at SQ, and it has never happened in a cave.

The error survived 90 days because §I is prose and no gate reads prose. It is also exactly the shape §AUDIT-03m-FU warned about: a legacy-code sweep would have rewritten `SQ` into a tidy, confident `` `NUE` `` — **annotation without verification launders a wrong claim into a live one.** This file is classified HISTORY, and the tool refuses to annotate HISTORY, so the fence saved it by construction rather than by anyone noticing.

### F11 — two bare doc anchors that were exact when written

| Doc | Anchor as written | At `32c10c5` | At HEAD |
|---|---|---|---|
| `world.md` §Pit Training Perks | `PIT_PERK_UNLOCKS`, HTML line **10457** | **10457** ✔ exact | 27333 |
| `story.md` §Covenant Standing Tiers | `COVENANT_STANDING_LABELS`, HTML line **10480** | **10480** ✔ exact | 27356 |

Both were *correct measurements* that decayed by ~16,880 lines. `check:anchors` (gate #15) cannot see them: they are prose (`HTML line 10480`), not the `` `symbol@line` `` form the gate resolves. Both corrected to anchor form in this increment.

---

## V. Playability assessment

**What the arc adds, and it is real.** The covenant ceremony is the only place in ~2,850 quests where the game stops measuring and starts *reporting*. Six people are named by what they did rather than what they gave you; six epilogues say what happened after; a note left by a dead man tells you to go ask someone who knew you before. Rendered in Chromium it lands exactly as drawn — a slow amber sigil on black, then six italic sentences, one at a time. It is the payoff that retroactively justifies every `favor` bit in the game.

**What the player actually experiences, measured on the character sheet in Chromium:**

| Run | Curse | Standing shown |
|---|---|---|
| Act I, no shards | — | `Unknown` |
| First shard, EBs untouched | **20** | **Wanderer** — *"The Void will open again. Not your fault. Not entirely."* |
| All 20 EBs started, none returned | 60 | Wanderer |
| All 20 returned | −5 | **Warden** |

The scale has **no neutral**. A player who beats the main story without engaging a system the report never names as mandatory carries *"The Void will open again"* on their character sheet from Act II onward. The first rung above Wanderer (**Watcher**) already costs six completed return chains; **Keeper** costs thirteen; **Warden** costs all twenty — and the rung above that, written to be the reward for exactly that run, cannot be reached.

The same threshold gates §III: `missionDone && curse <= 0` is satisfiable **only at −5**, so the naming ceremony — the best thing in this report — is a 20-of-20 all-or-nothing prize the spec presents as a soft "curse score ≤ 0". Six lines of authored text per NPC sit behind the hardest gate in the game, and 186 of 231 reachable states get the Wanderer text instead.

**The three fixes are all small.** Moving one threshold from `-6` to `-5` makes the top label and the True ending live. Wiring five booleans that are already computed makes an entire perk tree do something. Adding a use-item path for a 5gp bottle makes eighteen authored lines reachable without losing a fight. None of them touches the road, the mover, the VM, or the save format.

---

## VI. Doc corrections applied in this increment

- **`story.md` §Covenant Standing Tiers** — the section stated *"Net range: −5 (all 20 returned) to +60"* six lines above a tier table whose top row is `≤ −6`. The contradiction sat in one screen for 90 days. Tier table and the Ending Variants table now carry the measured note; the `≤ −6` rows are marked unreachable rather than deleted.
- **`story.md`** — *"The epilogue scroll builds a named list of all returned EB NPCs"* is false; it appends one summary count line. Corrected.
- **`story.md` / `world.md`** — the two bare `HTML line NNNN` anchors of **F11** converted to `` `symbol@line` `` form so gate #15 can see them.
- **`world.md` §Pit Training Perks** — the "Combat effect" column documented the *write*; it now states that the flag has no reader, with a pointer to §DX-02eq.
- **NOT applied, filed instead:** `const COVENANT_STANDING_LABELS = [@27490` carries `→ doc: docs/mechanics/mechanics-economy.md §Covenant Standing`, and that file contains **zero** occurrences of the string; the live home is `story.md §Covenant Standing Tiers`. Fixing it edits `play.html`, whose working tree carries the user's uncommitted CSS recolor. → **§DX-02er**

---

## VII. Rows filed

| Row | Weight | Premise |
|---|---|---|
| **§DX-02en** | 🟡 one design call | "Covenant Keeper" and the True ending are unreachable by one point; §VII's payoff line is in no branch |
| **§DX-02eo** ✅ shipped 2026-08-26 | 🟢 | `ebReturnsCompleted` is a write-only twin of `ebReturnDone`; `FROBERGER_EPILOGUE.cursed` has no selector |
| **§DX-02ep** | 🟡 one design call | The whiskey window is opened and closed by the same fight; 18 lines reachable only on a loss |
| **§DX-02eq** | 🟡 implement-or-retire | Five pit perks set five flags nothing reads |
| **§DX-02er** | 🟢 | `Math.random()` seeds the note node; one dead `→ doc:` pointer |

**No test covers the ending system.** `grep -rl` across `src/tests/` finds no spec touching `_curseScore`, `_covenantStanding`, `_buildEpilogueScroll` or the perk tree. The cheapest possible fence is a five-line spec pinning the reachable bounds of `_curseScore()` and asserting every `COVENANT_STANDING_LABELS` entry is returned by at least one state — it would have failed on the day this report was written. Folded into §DX-02en.

---

## VIII. Conclusion

Layer 43 is the strongest design lock the verification program has scored on *fidelity*: nine subsystems, 23 of 23 symbols live, every authored string block byte-identical across 90 days and a 5.5× file growth, and the centrepiece rendering in the browser exactly as specified. Its failures are all of a single kind — **claims the document could not check about itself.** The arithmetic of its own scoring function; the readers of the flags it defines; the second writer of a state field it names; the node its first paragraph names. Every one of those is a five-minute measurement, and none of them was made, because the report is a *design* document and design documents are graded on whether the code matches the spec, never on whether the spec closes.

> *"He believes the eighteenth will be different. He believes that about all of them, until the evidence arrives."*

The evidence has now arrived, for the first time in ninety days, and the finding is that the game's kindest ending was always one point away.

---

*lab-report-endings-and-echoes.md — Layer 43 design lock · original 2026-05-22 · verified §DOC-02cx 2026-08-22*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
