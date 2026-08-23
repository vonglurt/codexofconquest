<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# Birka Roots: The Beginner Arc and the NPC Favorability System

**Lab Report — IEEE Style · CodexOfConquest: The Shattered Codex (`play.html`)**
**Original date:** 2026-05-22 · **Classification:** Content Design / Relationship-State Systems
**Verification pass:** 2026-08-11 (§DOC-02d) — every claim re-measured against HEAD.

> **HISTORY DOCUMENT.** This is the design record as believed on 2026-05-22, not a description of
> the current engine. Claims that did not ship, or that shipped and were later removed, are marked
> **NOT SHIPPED** / **RETIRED** and **kept** — a silently deleted claim reads like one that held.
> Its node codes are the retired 26×16 space; per §AUDIT-03m, `docs/lab-reports/` is HISTORY —
> **annotate, never rewrite**. Treat no code listing below as live source.

---

## Abstract

The report specified a six-NPC, seven-quest starter arc in Birka and, under it, the mechanism the
rest of the game's relationship content was later built on: **NPC Favorability**, a per-NPC integer
that permanently changes an NPC's greeting and dialogue. The design thesis was that the arc's value
is not XP or gold but *five names* — five people whose loss the player can feel when the Void
arrives — and that this is the gentlest possible seeding of the Curse of Knowledge.

**Verification result: this is the strongest survival in the §DOC-02 corpus so far.** Of **32**
named symbols, **29 resolve at HEAD (91%)**, and the three that do not are cosmetic or inert. Every
state field shipped under its specified name (`npcFavorability`, `roughWhiskeyUsed`,
`yaelEscortUsed`), every function shipped under its specified name (`_setNpcFavor`, `_npcFavor`,
`_renderNpcCard`), six of the seven quests shipped, and the system **outgrew its own spec by an
order of magnitude** — §NPC-01-B derived the card-render map from `BIRKA_NPC_PROFILES` and took the
relationship surface from ~20 NPCs to **204 profiles / 213 dialogues**.

The failure mode here is not rot; it is **naming**. All **8 node codes are dead as written** and
five of them were **born dead** — no `NODE_MAP` entry for `CI`/`IN`/`TV`/`BA`/`CY` ever existed —
and the report's own inconsistency between *Couperin* and *Quill* minted two keys for one character,
a defect §AUDIT-03n had to spend a whole row fixing fourteen months of engine-time later.

**Keywords:** relationship state, NPC favorability, starter arc, design-record verification,
identifier drift

---

## I. Method

Four measurements, all from HEAD (`play.html`, 38,707 lines, coc-3.104.0, 416 nodes / 2,853
quests / 204 NPC profiles):

1. **Symbol census.** Every constant, state field, function, quest id, item name and DOM string the
   report names, batched through one `grep -c` loop (§DOC-02 accelerator 3).
2. **Node-code resolution.** All 8 codes tested against live `NODE_MAP` keys **and** against the
   `docs/maps/node-index.md` remap table.
3. **Mechanism re-read.** Each behavioural claim read at its live definition, not from the report —
   quest `onComplete` chains, the drunk-fight branch, the favor ladder, the escort handler.
4. **History probe.** `git log -S` on every absent symbol, to separate **RETIRED** from
   **NEVER-SHIPPED** (§DOC-02c's instrument).

---

## II. As-Built Inventory — What Survives

| Claim | Status at HEAD | Anchor |
|---|---|---|
| `BIRKA_NPC_PROFILES`, 6 entries, fields `{key, name, occupation, node, neutral, friendly, dearFriend}` | **exact** — all six shipped, all fields present, `special` used exactly once (Yael) | `const BIRKA_NPC_PROFILES@22712` |
| `S_story.npcFavorability` — `npcKey` → 0 / 1 / 2 | **exact**, declared in `_S_DEFAULTS()` | `npcFavorability: {}@23087` |
| `_setNpcFavor(npcKey, level)` + its two log lines | **exact**, both strings verbatim: *"looks at you differently now"* / *"says your name when you walk in"* | `function _setNpcFavor@23462` |
| `_npcFavor(npcKey)` selects the card variant | **exact** — 42 call sites | — |
| `_renderNpcCard(npcKey)` | **exact** (signature grew a `container` argument) | `function _renderNpcCard@23683` |
| `S_story.roughWhiskeyUsed` — one-time drunk-fight latch | **exact** | `roughWhiskeyUsed: false@23054` |
| `S_story.yaelEscortUsed` | **exact**, and load-bearing in four more places than specified | `yaelEscortUsed: false@23055` |
| Rough Whiskey — 5gp at the bar, `consumable_misc`, sell 2gp | **exact, all three** | `Rough Whiskey',icon:'🥃',type:'consumable_misc',sell:2@24380` |
| Six of seven quests: slums cleanup · ledger · lute · shipment · pit training · void below | **all live as UQF-1.0** | `quest_slums_cleanup@21217` … `quest_void_below@21317` |
| Gold rewards 80 / 40 / 60 | **exact, all three** | `gold:80@21218`, `gold:40@21263`, `gold:60@21279` |
| Items: Worn Ledger Book · Sealed Scholar Box · Pit Legend Token · EMP Grenade · Scholar's Note · Cipher Scrap · Conclave Pass | **all seven live** | `itemChain`@21242/21270/21288/21298/21324 |
| Pachelbel hands the lute over on request, no fight — with his line verbatim | **exact**, including *"it didn't look like something that should be left under a chair in here"* | `key === 'pachelbel' && S_story.quests@23769` |
| Sweelinck's four curse-score variants **plus** a fifth Birka variant at ≥3 friends | **exact structure** — 5 entries, the 5th flagged `birka:true` | `const SWEELINCK_DIALOGUE_VARIANTS@27229` |
| Player starts with 150gp | **exact** | `gold: 150@23005` |
| Auros → Dear Friend on Void Below; the arc's only fav-2 grant | **exact** (`{kind:'favor', npc:'auros', set:2}`) | `quest_void_below@21317` |

**Live: 29 of 32.**

---

## III. Spec → Shipped Delta Table

Sixteen deltas. Each is **NOT SHIPPED** (never existed), **RETIRED** (shipped, later removed), or
**CHANGED** (survived under altered contract).

| # | Report claim | Outcome | Measured at HEAD |
|---|---|---|---|
| 1 | **`BIRKA_QUESTS`** — a named const holding the 7 quests | **NOT SHIPPED** | `grep -c` = 0; `git log -S` = **0 commits ever**. The quests were authored directly into `QUEST_DB`, which is the correct home (§ARCH-01). Harmless. |
| 2 | **`quest_drunk_fight`** — the 7th quest, "auto-trigger, no activation" | **NOT SHIPPED — and left dangling** | No `QUEST_DB` entry; `git log -S` = 1 commit, the reference itself. It is listed in `_hasActiveQuestFor`'s `npcQuests` under `crov:['quest_pit_training','quest_drunk_fight']@23644`, so the lookup is permanently `undefined` and the entry is inert. **The drunk fight shipped as an engine event, not a quest.** See §V-3. |
| 3 | **Drunk Pit Fight mechanics** — disadvantage on all attacks · +3 damage on a hit · one-time · item consumed | **SHIPPED, exactly** | `if (S_story._drunkFight) adv = 'dis'@25044`; `const drunkBonus = S_story._drunkFight ? 3 : 0@25071`; latch + inventory filter at `roughWhiskeyUsed = true@24690`. |
| 4 | **Drunk fight — the natural-20 flavor line** (*"…something underneath the training that knows exactly what it's doing"*) | **NOT SHIPPED** | 0 hits, **0 commits ever**. No crit branch exists in the drunk path. |
| 5 | **Drunk fight — Weckmann's two reactions**; loss reaction *"Next time sober. Or come back drunk…"* | **CHANGED / NOT SHIPPED** | The **win** line shipped compressed — *"You absolute idiot. I'm counting it."@25401* (the *"most technically incorrect win"* beat cut). The **loss** line has **0 commits ever**: `_drunkFight` is consumed only in `_storyBattleVictory`, so **losing the drunk fight produces no Weckmann reaction at all**. |
| 6 | **First drunk win grants the Pit Legend Token early**, regardless of Quest 5 | **NOT SHIPPED** | The victory branch does exactly one thing beyond the message: `if (_npcFavor('crov') < 1) _setNpcFavor('crov',1)@25400`. **No token.** The favor half of the claim shipped; the item half did not. |
| 7 | **Pit Legend Token — "+5gp trade value at BA"** | **CHANGED** | `sell:30`, flat, everywhere. No node-specific trade bonus exists in the engine for any item. |
| 8 | **Quest 5 requires 1+ Birka quest complete; Quest 6 requires Auros AND Weckmann both Friendly** | **NOT SHIPPED — both** | Both carry `gate:{}`. The gate shape exists and is used by a *sibling* quest in the same block (`quest_brynn_firewood` gates on `favorMin:{brynn:1}`), so this is an authoring omission, not a missing capability. **The arc's intended ordering is unenforced: Void Below is available on arrival.** |
| 9 | **Slums Cleanup grants a "Guard Favor token (story item)"** | **NOT SHIPPED** | No inventory item. The phrase survives only inside the narrative string *"💰 +80gp from Yael. Guard Favor granted."* — 1 occurrence, 1 commit. The favor itself is granted (`favor npc:'yael' set:1`); the *token* was never minted. |
| 10 | **Brynn's Ledger reward: "free lodging for 3 nights"** | **NOT SHIPPED** | `onComplete` emits *"🛏 Brynn offers 3 free nights"* and stops. No counter, no flag, no state. `storySleep` charges `node.sleepCost` unless `node.code === 'INN' && S_story.freeBookingUnlocked@36213` — an unrelated flag on a different node. **TLL charges `sleepCost:5` before and after the quest.** See §V-2. |
| 11 | **Rough Whiskey can be consumed from inventory (−5% max HP, flavor)** | **NOT SHIPPED** | No consume path exists. The item's *only* consumer is the `pendingBattle.nodeCode === 'HKG'` auto-trigger, which removes it. |
| 12 | **Rough Whiskey NPC reactions** — two authored (Quill refuses; Weckmann *"After the fight."*) | **CHANGED — expanded 2 → 18** | `const ROUGH_WHISKEY_REACTIONS@27364` covers **all six** NPCs × three tiers, read through `_checkRoughWhiskeyReaction@28159` and gated by a *second*, separate flag `roughWhiskeyActive` cleared on sleep and on battle victory. **Neither authored line survives verbatim** — Quill's became *"the lute strings are sensitive and I can smell everything from up here."* |
| 13 | **Three favorability states** — neutral / friendly / dear friend; **"one quest is enough"** | **CHANGED — four tiers, and two ways up** | The dialogue registry is keyed `impartial · questActive · friendly · dearFriend`; **`questActive`** is a fourth tier the report does not specify, selected by `_hasActiveQuestFor@23641`. §NPC-01-D then added a second route to Friendly with no quest at all: `TALK_TO_FRIENDLY = 3@23513` deliberate talks on distinct game-days. Fav 2 remains quest/personal-act earned, so the report's *"one quest is enough"* is now *"one quest **or** three conversations."* |
| 14 | **`S_story.lubeckFriends`** — a derived count state field | **CHANGED** | Shipped as a **function**, `function _lubeckFriends()@23461`, not a field. **The name is a fossil**: the city is Birka, and `Lübeck` survives only as an unrelated live node, `LBC` — the Hansa Gate, Act 2. A reader who greps `lubeck` lands in the wrong city. |
| 15 | **Escort mechanic** — a *"special node-description overlay on the corridors from CI"*, firing on the **next move** to an adjacent node, with the blue-shutters / Varga's-pigeons narration verbatim | **CHANGED — three ways** | (a) There are **no corridors** — §WALK/§NAV-01 deleted that layer entirely (§DOC-02c delta 3), so it renders as a **modal fired on click**, `function _yaelEscortAction@23796`; (b) the narration is a **different, shorter text** — Skalder's corner, Nivers at the fountain, the unread riot report — none of the specified paragraphs shipped; (c) `yaelEscortUsed` and the *"🛡 Walk the beat"* re-view both shipped exactly, and the flag grew **four more readers** the report never anticipated: Yael's dear-friend second act, a `_missionComplete` bit, a journal beat, and an Act-5 records line. |
| 16 | **Void Below combat: "Void Horror or equivalent, drawn from the WORLD_DB void pool"** | **CHANGED** | *"Void Horror"* has **0 occurrences**. The fight is a **synthetic battle code**: `code:'CY_VOID'@35917` — two `void_walker`, classified in `check-noderegs.js`'s `SYNTHETIC_BATTLE_CODES` as *"Layer 41 — Void Below descend at HKG"*. |
| 17 | **Auros's rune-tablet reading** — *"the second district boundary… We are currently at the third district boundary."* — the arc's Step 4 "New Information" | **NOT SHIPPED** | Both phrases: 0 hits, **0 commits ever**. The Sealed Scholar Box is delivered to Pachelbel and the chain ends there. **The report's Step 4 has no scene.** |

### III-A. Node-code resolution — 0 of 8, and 5 born dead

| Code | Report says | HEAD says |
|---|---|---|
| `CI` | Yael; "the city"; the arc's entry point | Remaps to **`LHR`** (City Streets — Birka). **`CI` is ALSO a live key** — `num:429`, *Chancery Court — The Officer's Pen*, an entirely different node. |
| `IN` | Brynn's inn | → **`TLL`** (The First Inn) |
| `TV` | Quill's tavern | → **`MHQ`** (Birka Tavern) |
| `BA` | Pachelbel's rough bar | → **`LLA`** (The Rough Bar) |
| `CY` | Weckmann's pit + Auros | → **`HKG`** (Neon Undercity) |
| `SL` | The slums | → **`BMA`** (Birka Slums) |
| `CR` | The crypt | → **`KRN`** (The Birka Crypt) |
| `SQ` | Sweelinck, Act VI | → **`NUE`** (Scholar's Quarter — Weimar) |

`CI` is the §AUDIT-03m hazard in its purest form: it passes any *"does this code exist?"* check while
every sentence containing it stays wrong. The remaining seven are cleanly dead.

**The five NPC codes were born dead.** The engine records this in its own source, at the `birkaNpcs`
literal that carries the fix: *"No NODE_MAP entry ever existed for CI/IN/TV/BA/CY, so these cards
previously rendered nowhere"* (`const birkaNpcs@35139`, §PLAY-01-G). These codes came from the
`maps.md` legend, not from the world — the §AUDIT-03p **born-dead** class, and the reason
`docs/maps/node-index.md` (`npm run nodes`) is now the only place a node code may be read.

---

## IV. Three Names for One Bard — the Origin of §AUDIT-03n

The report is internally inconsistent about who its characters are, and **the inconsistency shipped
as keys**:

- The bard is introduced as **"Bard Tomas Couperin"** in his profile section and then called
  **"Quill"** in fourteen subsequent places, including his own quest name. At HEAD he is *three*
  identifiers at once: key `quill`, `name:'Bard Tomas Couperin'`, quest id `quest_couperin_lute`.
- **"Pit Master Weckmann"** shipped under the key **`crov`** — a token that appears nowhere in this
  report, and which no reader of it could guess.
- **"Auros"** shipped as key `auros` with `name:'Commander Seraphine Bruhns'`. The report's heading
  says **"THE SIX BIRKA NPCs"** and then gives **five** profile sections — Auros appears only in the
  arc prose, never characterised, and is listed in the implementation notes as an afterthought
  (*"Auros-extended"*). The document's own count of its cast is wrong.

**§AUDIT-03n (2026-07-31) measured the bill.** Seven engine registries had been keyed to the
*surnames* — `couperin` / `weckmann` / `bruhns` — which the favor ledger never writes: **21 authored
entries unreachable**, plus six live code references, including the victory screen's own `npcOrder`,
so the ending showed the **stranger** epilogue for Quill, Weckmann and Bruhns at any favor. §AUDIT-03k
then found the mirror in the other direction (display-name slugs minting rival keys) and added
`WBAPI.NPC_ALIASES` plus `check:npcregs` phase 5.

*Durable lesson, and the one this report is worth keeping for: **a design doc that uses two names for
one character mints two keys.** The engine cannot tell that Couperin and Quill are the same person,
and a favor written under one is invisible to a gate reading the other. Fix the name in the doc
before the doc becomes the schema.*

---

## V. Defects Filed

1. **§AUDIT-03u — the world has 416 nodes; two player-facing strings still say forty-two.**
   Both are stale by 10×, and both are load-bearing onboarding text: STN's Map Shop sets down *"the
   Real Map beside it — **all forty-two nodes** — and pushes it toward you"* (`STN:{ num:9@8636`),
   and Yael's Level-1 tutorial monologue opens *"Check your MAP. The known world has **forty-two
   nodes** and you can get lost in it, badly, fast"* (`yael: { meta:@10397`). Forty-two was the
   report-era battleground count in the retired 26×16 space (§DOC-02c Appendix A lists exactly 42).
   `npm run stats` says **416**. Mechanical, but Yael's line is the game's first paragraph of
   instruction — rewrite it to describe scale without a number, rather than swapping in one that
   will rot the same way.

2. **§AUDIT-03v — Brynn promises a free room twice and charges 5gp both times.** `TLL`'s node text
   has her say *"'Free,' she says. 'The room's free too, if you need it.'"* (`TLL:{ num:2@8431`),
   and `quest_brynn_ledger.onComplete` narrates *"🛏 Brynn offers 3 free nights"* (`@21234`).
   `storySleep` charges `node.sleepCost` — **5gp** at TLL — with a single exemption hardcoded to a
   *different* node (`node.code === 'INN' && S_story.freeBookingUnlocked@36213`). So the game states
   a price of zero in prose, restates it as a quest reward, and bills the player at both. **Small
   design call:** grant the three nights (a `brynnFreeNights` counter decremented in `storySleep`,
   the shape `freeBookingUnlocked` already models) **or** rewrite both strings. Do not do neither.

3. **§DX-02o — one quest-id string literal in the engine resolves to nothing, and no gate can see
   it.** `quest_drunk_fight@23644` has no `QUEST_DB` entry; `S_story.quests['quest_drunk_fight']` is
   permanently `undefined`, so `_hasActiveQuestFor('crov')` silently drops half its roster — the
   `questActive` dialogue tier can only ever fire for `quest_pit_training`. Census over the whole
   file: **302 distinct `quest_*` literals, 301 resolve, 1 does not** (the two other misses,
   `quest_whisper_` / `quest_wane_`, are legitimate `startsWith` prefixes and must be exempted).
   **The gap is structural, not incidental:** `check:questgraph` walks `QUEST_DB` against itself and
   never reads engine JS; `check:noderegs` mentions `QUEST_DB` **zero** times. This is exactly the
   §AUDIT-03j class — *a missed lookup renders nothing* — in the **quest-id** dimension, which has no
   fence. Wants a `check:questrefs` phase resolving every `'quest_*'` literal outside `QUEST_DB`
   against the live id set, with an explicit `NOT_A_QUEST_ID` classification list in the
   §AUDIT-03j/n/m house style. Mechanical; the measurement above is the whole scope.

---

## VI. What the Report Got Right

The design half of this document is its durable half, and it held for 81 days and 6.1× the file:

- **Favorability as a small integer with permanent, visible effects, not a meter.** Shipped exactly,
  and it is now the substrate for **204 NPC profiles and 213 dialogue sets** — §NPC-01-B derived the
  render map from `BIRKA_NPC_PROFILES` rather than hand-listing it, taking the relationship surface
  from ~20 NPCs to ~203 with no change to the mechanism this report specified.
- **The two log lines.** *"[Name] looks at you differently now."* / *"[Name] says your name when you
  walk in."* — verbatim in `_setNpcFavor` at HEAD. Both are still the only thing that announces a
  relationship change anywhere in the game.
- **The dear-friend "second personal act."** The report implies it; the engine formalised it as a
  six-entry `dearFriendBits` table (escort used · journal Entry 7 read · Quill's song received ·
  shipment complete · 3 pit wins · depths reported), checked in two places so the upgrade fires
  whether the act or the quest lands second. **Every one of the six is an act this report invented.**
- **The Sweelinck payoff, and it is stronger than specified.** `_birkaVar` is resolved **first** and
  overrides all four curse-score bands, so at three or more friends the Birka variant is what the
  player gets, unconditionally. The text is a paraphrase — the pen business and the *"I'm not telling
  you that's better"* beat were cut for *"He carried the Shards. You've been carrying something
  heavier."* — but the report's claim that this is *the one place the game says the friends mattered*
  is true at HEAD, and the precedence rule makes it truer than the spec asked for.
- **`_missionComplete`'s twelve bits are this report's thesis in executable form.** Eight of twelve
  are Birka relationship acts — `yaelEscortUsed`, `brynnsJournalRead`, `couperiSongReceived`,
  `pachelbelPaidBack`, `crovPitTrainingWins`, `bruhnsDepthsReported`, `atLeastThreeFriends`,
  `noHighCurse` — and the ending needs **8 of 12**. *"Not experience points. Not gold. Five names."*
  is not a mood statement in the shipped game; it is a threshold.

---

## VII. Scope Note

Retained as the design record for a system that is **fully live and much larger than described**.
Its value at HEAD is threefold: it is the origin of the favorability mechanism every later NPC track
inherited unchanged; it is the clearest evidence in the §DOC-02 corpus that **the design half of a
lab report outlives the addressing half** — 91% of its symbols resolve while 0% of its node codes do;
and it is the traceable origin of the identifier drift §AUDIT-03n and §AUDIT-03k spent two rows
repairing. Where §DOC-02b found a report that contradicted itself about code, this one contradicts
itself about **people** — and that turned out to be the more expensive kind.

---

## References

[1] §NPC-01-B/C/D — derived NPC card render map; the ⚔/✦ footers; the Talk-to-Friendly path
    (`TALK_TO_FRIENDLY = 3`). Extends this report's mechanism to 204 profiles.
[2] §AUDIT-03n — npc-key registry audit (`check:npcregs`, gate #14). 21 unreachable entries from the
    surname/first-name split traced in §IV.
[3] §AUDIT-03k — `WBAPI.NPC_ALIASES` + `check:npcregs` phase 5; the display-name-slug mirror.
[4] §PLAY-01-D/G — the CI→LHR and IN/TV/BA/CY remaps; source of the born-dead finding in §III-A.
[5] §WALK / §NAV-01 — navigation-core redesign. Deleted the corridor layer the escort overlay of
    delta 15 was specified against.
[6] §ARCH-01 — Universal Quest Format 1.0. The six shipped quests are UQF-1.0; `BIRKA_QUESTS` was
    never needed.
[7] §BOARD-01-FU6 — the ledger fork and the lute/box confluence; three of this arc's quests became
    the Warrant network's first branch and first in-degree-2 merge.
[8] §DOC-02b / §DOC-02c — prior verification passes; source of the `git log -S` instrument and the
    *"the half of a document that points at code is the half that is right"* lesson, which this
    report inverts.

---

## Appendix A — Kept, NOT SHIPPED (verbatim 2026-05-22 record)

Retained because a deleted claim reads like one that held. None of the following exists at HEAD.

- **Auros's rune-tablet scene (Step 4).** *"This is a maintenance log for the signal jammer below the
  undercity. It was written three hundred years ago. It says the device requires calibration if the
  Void advance reaches the second district boundary."* … *"We are currently at the third district
  boundary."*
- **Yael's escort narration.** The Scholar King archive with blue shutters, converted to a registry
  office twenty years ago; Varga's post, eleven years, and the pigeons that change route before
  anything happens at ground level — *"Captain, I've been right fourteen times."*
- **Drunk fight, natural 20.** *"Even drunk, even against the odds, there's something underneath the
  training that knows exactly what it's doing."*
- **Weckmann on a drunk loss.** *"Next time sober. Or come back drunk. I genuinely cannot decide
  which is more useful for your development."*
- **Rough Whiskey, given away.** To Quill: *"I've seen what that does to lute strings."* To Weckmann:
  *"After the fight."* (He doesn't specify whose fight.)
- **Quest 5b's early token** and **Quest 1's Guard Favor story item**.
- **Brynn's three free nights** as a mechanic.

---

*© 2026 Paul Richeson — MIT License. See [LICENSE](../LICENSE) for full text.*
