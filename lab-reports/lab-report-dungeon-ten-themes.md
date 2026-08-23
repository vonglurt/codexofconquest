<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->

# Lab Report — §DUNGEON-01: Ten Dungeon Themes Applied to The Shattered Codex

**Layer:** 80 · **Spec ref:** §DUNGEON-01 + §DUNGEON-02 (plan.md, now split into CONTRIBUTING.md + BACKLOG.md)
**Written:** 2026-05-26 as a PRE-IMPLEMENTATION LOCK · **Verified against HEAD:** 2026-08-11 (§DOC-02k)

> **Verification note.** This is a *pre-implementation* design lock. Everything below was written
> before any HTML edit, so the delta table runs **both ways**: a spec line HEAD does not satisfy is
> a live gap as often as it is a stale claim. Original claims that did not ship are marked
> **NOT SHIPPED** and **kept** — a silently deleted claim reads as one that held.

---

## Abstract

The ten themes were built. §DUNGEON-01 was closed in a later pass as *already shipped*, and this
verification confirms that at the identifier level: **49 of 57 named identifiers resolve (86 %)**,
and **all 26 fields of the §New State Fields Summary table shipped under their specified names, in
the specified order, in one contiguous block** headed `// §DUNGEON-01: Ten Dungeon Themes@23157`.
Both P3+ nodes deferred as "a later layer if needed" also shipped: `SZG:{ num:80@8811` (Scholar
King's Workshop) and `LIM:{ num:81@8815` (Mimic Meadows).

Three results are worth the reader's time. **(1)** The one state-field name that does not resolve
is the one this document spells **two ways within itself**, and the engine followed the summary
table rather than the prose list. **(2)** Two of the eight shipped five-act chains **die at Act III**
— `quest_d0209` on a flag with zero writers, `quest_d0205` on a battle key that was repointed onto a
node with no battle — and no CI gate can see either. **(3)** §3's Tribble lore revision is the only
section HEAD **contradicts in its own player-facing text**: the decision it reverses was never
implemented in the first place, and the content it deletes shipped anyway.

**All 8 dead identifiers have 0 commits in the file's entire history** — every one **NEVER SHIPPED**,
none retired. Nothing here is report-rot from the code moving.

---

## 1. Method

| # | Instrument | Applied to |
|---|---|---|
| 1 | Batch `grep -c` of every named identifier before reading a line of prose | 57 identifiers, one command |
| 2 | `git log -S "<sym>" -- roll2hit-v3.html` on every dead identifier | 8 symbols → separates RETIRED from NEVER SHIPPED |
| 3 | Occurrence-site read (declaration · writer · reader) for every *live* field | 26 state fields |
| 4 | Grep for the code that **reveals** a surface, never the surface's own id | the three §D01-04 gates, the CY panel |
| 5 | Two-way delta table — HEAD is not the reference | §3 (below) |

**Node-code caveat.** This report was written in the retired 26×16 coordinate space. **0 of its 8
place codes are correct as written**, and one is worse than dead: `BK` still resolves, onto a
different node (see Finding 2b). Mapping, for reading the sections below:

| In this report | Live at HEAD | |
|---|---|---|
| `CY` Neon Undercity | `HKG` | `CO` Codex / Convergence → `TLS` |
| `WM` Weimar archive | `NUE` | `AT` Abyssal Scriptorium → `RAI` |
| `MM` Mimic Meadows | `LIM` | `SW` Scholar King's Workshop → `SZG` |
| `DF` Defiant Fields | `ZRH` | `IN` inn → `TLL` |
| `BK` maze approach | **`BK` — a *different* node** | `CY_VOID` battle key → live, unchanged |

---

## 2. As-built inventory

**State (`_S_DEFAULTS()`).** 26 fields, one contiguous block, `// §DUNGEON-01: Ten Dungeon
Themes@23157` through `scriptorium_approach_complete: false, mimicColonyEntered: false@23169`.
Names, order and defaults match §New State Fields Summary exactly.

**Nodes.** `SZG:{ num:80@8811` (`name:'workshop'`, act 7, `battle:null`, `sleep:true`,
loot = Prototype Wand) · `LIM:{ num:81@8815` (`name:'mimic_meadow'`, act 6, `battle:null`,
loot = Fuzzy Tribble). Terrain `mimic_meadow:  { label:@6365`, roster `[ P.mimic ]`.

**Quests.** Eight five-act chains as UQF-1.0 — `quest_d0201/d0204/d0205/d0206/d0207/d0208/d0209/d0210`
`_a1`–`_a5`. §D02-02 (Inquisitor) and §D02-03 (Prior Carrier) shipped **not** as chains but as
node-woven story-render surfaces, which is what §1 predicted for them.

**Hooks.** `function _nodeHookCodexCoreChamber@31810` · `function _nodeHookBirkaCyMadnessGate@32529`
· the CY maintenance plate and NG+ line · the Prior Carrier three-branch block at `NUE` ·
the Inquisitor button · `§D01-01: Themed Dungeon Doctrine@31417` as `NODE_PANELS` entries
(IST/TBS/MCT) plus one inline at BK · three §D01-04 gates: `§D01-04: Class Gate@34716`,
`§D01-04: Secret Gate@34767`, and the Memory Gate at `S_story.memorGateBypassUsed = true;@34984`.

---

## 3. Spec → shipped delta table

Both directions. **SHIPPED** = built as specified (node rename aside). **EXPANDED** = shipped
larger than spec. **NOT SHIPPED** = specified, absent, 0 commits ever. **DEFECT** = shipped and
broken. **CONTRADICTED** = HEAD does the opposite of the locked decision.

| # | § | Specified | At HEAD | Verdict |
|---|---|---|---|---|
| 1 | §1 P1 | §D01-01 flavor gated by `!defeatedBattles[ebCode]` | `NODE_PANELS`, `when:st => !st.defeatedBattles['IST']` | **SHIPPED**, gate shape byte-exact |
| 2 | §1 P1 | §D01-07 CY WIS save on first visit, 3 new flags | `function _nodeHookBirkaCyMadnessGate@32529`, DC 12, d10 table, actor `'VOID'` | **SHIPPED** |
| 3 | §1 P1 | gated by `!S_story.visited?.['CY']` | gated by `!S_story.cyMadnessRoll` | **EXPANDED** — self-latching, strictly better |
| 4 | §1 P1 | §D01-10 pre-boss roll at CO, `codexCoreChosen` + 3 branches | `_nodeHookCodexCoreChamber@31810`, `shards >= 6`, 3 buttons | **SHIPPED** |
| 5 | §1 P1 | §D01-03 Prior Carrier, text/state only, no NPC profile | 3 branches at `NUE`; 0 hits in `BIRKA_NPC_PROFILES`/`NPC_DIALOGUES` | **SHIPPED** exactly |
| 6 | §1 P1 | §D01-09 `voidFluxActive` in the combat damage loop | 2 sites, **both healing**; no combat-loop site | **NOT SHIPPED** (damage half) |
| 7 | §1 P2 | §D01-02 Inquisitor 3-question chain, `wmLowerArchiveUnlocked` gate | live, migrated to UQF-1.0 by §ARCH-01 W1l | **SHIPPED** |
| 8 | §1 P2 | §D01-04 three toll gates | three: Class (surge charge), Secret (a typed secret), Memory (15 HP) | **SHIPPED** — see #9 |
| 9 | §1 P2 | toll = `journalEntriesRead` **removal** ("novel") | 14 occurrences, **`push`/`includes` only, no removal anywhere** | **NOT SHIPPED** — three other currencies instead |
| 10 | §1 P2 | §D01-05 maze, `mazeSolvedChecks` + 3 rolls at BK | 3 writers, **0 readers**; chain dead at Act III | **DEFECT** — Finding 2b |
| 11 | §1 P2 | §D01-08 `quest_mimic_colony`, Animal Handling checks | shipped as `quest_d0208_a1`–`_a5`; the literal id has **0 commits ever** | **SHIPPED** under another id |
| 12 | §1 P3+ | Node SW deferred to "a later layer if needed" | `SZG:{ num:80@8811` | **SHIPPED** |
| 13 | §1 P3+ | Node MM deferred likewise | `LIM:{ num:81@8815` | **SHIPPED** |
| 14 | §2 | 4 passive `MONSTER_POOL` mimics (baby/bookshelf/floor/mother) | **0 hits, 0 commits each**; terrain holds one `P.mimic` (ac 12 hp 58) | **NOT SHIPPED** |
| 15 | §2 | `passive:true` flag + `_isPassiveTerrain(terrain)` helper | 0 hits, 0 commits | **NOT SHIPPED** |
| 16 | §2 | the meadow is encounter-free by default | achieved — `battle:null` on the node | **SHIPPED**, different mechanism |
| 17 | §2 | all four mimics appear at MM | as **prose** in the node text, verbatim in spirit | see Finding 3 |
| 18 | §3 | Tribbles do **not** multiply; not Star Trek | item desc ×4: *"Multiplying."* / *"fairly certain it is multiplying"@21850* | **CONTRADICTED** |
| 19 | §3 | `tribbleCount` is a bare counter, no inventory slots | counter **and** `S_story.inventory.push({name:'Fuzzy Tribble'…})` | **CONTRADICTED** |
| 20 | §3 | decreases when spent as mimic-bait; bait reduces DC by 4 | 4 occurrences, **no decrement anywhere**; no bait surface | **NOT SHIPPED** |
| 21 | §3 | thresholds 1–2 / 3–4 / 5+ with a CY flavour line | `>= 5` and `>= 10`, in the LIM panel only; no CY line | **NOT SHIPPED** as specified |
| 22 | §3 | `tribbleOverflow` removed from `_S_DEFAULTS()` | **0 commits ever** — never there to remove | **NOT SHIPPED** (vacuous) |
| 23 | §3 | the Brynn "on the ceiling" line is removed | ships at `_tc >= 10` | **CONTRADICTED** |
| 24 | §4 | madness = flavour only, no HP/AC/condition/blocking | exact — one `_appendStoryHcard` and done | **SHIPPED** |
| 25 | §4 | the *only* persistent effect is `cyMadnessRoll` | also persists `cyMadnessTable` (**0 readers**) | minor **DEFECT** |
| 26 | §4 | on NG+ the save does not fire; a remembered line shows instead | the line ships; NG+ resets `cyMadnessRoll` → **both** fire | **partly NOT SHIPPED** |
| 27 | §5 | insertion after the damage roll, before HP subtraction | no such site exists | **NOT SHIPPED** |
| 28 | §5 | must not touch condition-item stat math | held — it never reaches that code | **SHIPPED** by omission |
| 29 | §5 | healing inversion in `storyBuyPotion` / `storyShortRest` | in the **inventory Drink/Eat** path instead | **SHIPPED**, relocated |
| 30 | §5 | `hp = max(1, hp - floor(heal*0.5))` — heal becomes damage | `hp + heal - half - half` → nets **+0/+1** | **DEFECT** — inversion is a nullification |
| 31 | §6 | Prior Carrier distinct; no profile, no dialogue entry | 0 hits in either registry | **SHIPPED** exactly |
| 32 | §6 | three branches Yes/No/Ignore; Ignore leaves `priorCarrierSpoke` false | all three; `priorCarrierSpoke = false` on Ignore | **SHIPPED** byte-exact |
| 33 | §6 | Token is `flavor` type — unsellable, unusable | `type:'flavor', sell:0` (`Prior Carrier's Token@35026`) | **SHIPPED** byte-exact |
| 34 | §7 | `sealedVoid: !!(defeatedBattles['CO'])` is the only CO check | `sealedVoid: !!(S_story.defeatedBattles && S_story.defeatedBattles['TLS'])@23658` | **SHIPPED** |
| 35 | §7 | 12 conditions, 8 required | 12 keys, `>= 8` | **SHIPPED**, exact |
| 36 | §7 | neither `catKingDefeated` nor `sevenShards` is checked | correct — `sevenShards` 0 hits; `catKingDefeated` live elsewhere, absent here | **claim VERIFIED** |
| 37 | §7 | Destroy sets `defeatedBattles['CO']`, `codexCoreChosen`, `curseScore += 5` | all three, at `S_story.defeatedBattles['TLS'] = true;@31845` and the two lines under it | **SHIPPED** byte-exact |
| 38 | §7 | Claim keeps the Auros fight | keeps it, **plus** CHA DC 17, surge +2, voidPressure +3 | **EXPANDED** |
| 39 | §7 | Stabilize unchanged | unchanged | **SHIPPED** |
| 40 | §Phases | `cyMadnessDecoded` | **0 commits ever**; `cyMaintenanceDecoded` is live | **Finding 1** |
| 41 | §Phases | §D01-10/§D01-08 "uses existing `_rollCeremonia()`" | quest bits do; the two hand-built hooks roll `Math.random()` | **Finding 5** |

---

## 4. Findings

### Finding 1 — the only field-name miss is this document disagreeing with itself

§Implementation Phases lists `cyMadnessDecoded`; the §New State Fields Summary table lists
`cyMaintenanceDecoded`. **The engine followed the table** — `cyMaintenanceDecoded: false,
cyOriginKnown: false@23167`, five occurrences, a writer and three readers — while
`cyMadnessDecoded` has **0 commits in the file's entire history**.

That is 26 of 26 table rows shipped and 26 of 27 prose-list rows, and it sharpens the corpus's
current error predictor. The predictor is **copy-vs-illustration**, not table-vs-prose: this table
is a *specification* meant to be transcribed, so it was, character for character; the phase list is
*narrated implementation order*, so one name in it came from memory. A table composed to persuade
fails; a table composed to be pasted does not.

### Finding 2 — two of the eight chains die at Act III, for two unrelated reasons

**(a) `quest_d0209` — a gate leaf with zero writers.** Act III is
`completion:{ flags:['voidFluxCleared'] }@21636`, and `g.flags` resolves against `S_story` directly
(`g.flags.every(f => !!st[f])`). **`voidFluxCleared` occurs 5 times in 38,712 lines: one default,
one quest desc, three gate reads — and no writer at all.** Act IV gates on it, Act V gates on Act
IV's flag, so **Acts III–V are unreachable**.

The consequence is worse than a stalled chain. Act I sets `S_story.voidFluxActive = true`, and the
**only** clearing site is Act V's pass. A player who passes a DC 10 Arcana check is therefore
**permanently inside the inversion field**: every potion and every Brynn's Loaf for the rest of the
run routes through the `[Void Flux] Heal → Hurt` branch and nets +0 or +1 HP. → **§DX-02u**.

This is the *inverse* of the §DX-02n family. Those fields are write-only (saved, reloaded, never
consulted). This one is **read-only** — a broken dependency, not dead weight — and a
`check:deadconsts` scoped to unread fields would step straight over it.

**(b) `quest_d0205` — the maze was repointed onto a node with no battle.** Act III is
`completion:{ battles:['BK'] }@21579` and Act IV gates on the same key. At HEAD,
`BK: { num:241@9011` is *"Birka Shore — Northern Longship Landing"*, a beach whose record carries
**no `battle` field**, and **nothing in the file ever writes `defeatedBattles['BK']`**. Acts III–V
are unreachable, and `S_story.mazeSolvedChecks = 3;@21582` — the Act III `onComplete` — can never
run.

This is §AUDIT-03y's *worse-than-dead* class doing mechanical damage rather than narrative damage:
the code **resolves**, so `check:noderegs` passes it perfectly. It is also independent of
§AUDIT-03x — repointing BK's cell would not create the battle. → folded into **§AUDIT-03y**.

### Finding 3 — §3's lore revision is contradicted by HEAD's own player-facing text

§3 is the report's longest section and its most confident: Tribbles *"do NOT multiply"*, are
*"not Star Trek references"*, have *"no `tribbleCount` growth formula"*, *"do not occupy inventory
slots"*, and the Brynn overflow line *"is removed from the IN node render block"*.

At HEAD every Fuzzy Tribble is an inventory object whose `desc` asserts the opposite —
*"You are fairly certain it is multiplying"@21850* and *"Soft. Multiplying."* ×3 — the counter and
the inventory items are both incremented, and the Brynn line ships at `_tc >= 10` (relocated from
the inn to the meadow panel, which is why a search of the IN block would have found nothing).

And instrument 2 supplies the reason the section reads as authoritative: **`tribbleOverflow` has 0
commits ever.** The flag §3 declares it is removing was never implemented. **A design doc's
*reversal* is a claim like any other** — this one describes undoing something that had never been
done, and the content it believed it was deleting shipped under a different threshold in a
different block. *(13th instrument for the §DOC-02 program.)*

The §2 mimic roster is the same shape with the opposite outcome: the four passive statlines have
0 commits each, yet all four creatures live at `LIM` **as prose** — baby chest mimics, a napping
bookshelf mimic, a mossy floor mimic, the Mother at the centre. The narrative was copied; the
invented statblocks were not.

### Finding 4 — a two-surface promise with no reader (§AUDIT-03v/w cluster, 7th instance)

`aurosBlueprintKnown` occurs 4 times: the default, one writer, and **two readers that only render
the promise back at the player** — Act IV's passText (*"In the CO boss fight, Auros's left pauldron
has -4 AC"*) and a persistent node panel, `_wkHint.textContent = '📜 Blueprint known@31964`, that
repeats it for the whole run. **No combat code reads the field.** Auros's AC is never reduced.

First instance in the cluster where the same unbacked mechanic is stated **twice**, once in a
surface that persists until the fight it names.

### Finding 5 — invariant #6 broken in the two hand-built hooks, correct three registries away

`const _cyRoll = Math.ceil(Math.random()@32534` and both Codex Core rolls draw the **unseeded**
stream and write persisted state: `cyMadnessRoll`, `cyMadnessTable`, `codexCoreChosen`,
`defeatedBattles['TLS']`, `curseScore`. The UQF `skill_check` path used by all eight chains draws
the seeded one — `const d20  = Math.ceil(E.rng() * 20)@22248`.

So within one feature the quest-authored rolls obey invariant #6 and the two hand-authored hooks do
not, because §VM-01-B moved the d20 in `_resolveQuestUQF` and never reached surfaces that rolled
their own. Named instance for **§DX-02m**.

### Finding 6 — six zero-reader fields (§DX-02n)

| Field | Writers | Readers | Note |
|---|---|---|---|
| `voidFluxImmunityChoice` | 1 (always `'fire'`) | 0 | Act II's entire reward |
| `spiritDefeated` | 1 — `S_story.spiritDefeated = false;@21799` | 0 | writes **`false`** on the defeat |
| `mazeSolvedChecks` | 3 | 0 | third writer unreachable (Finding 2b) |
| `voidMazeEntered` | 1 (`flag_write`) | 0 | unreachable |
| `tribbleGladesFed` | 1 | 0 | — |
| `cyMadnessTable` | 1 | 0 | contradicts §4's own "only persistent effect" |

`spiritDefeated` is the sharpest: a `_legacy_fn` that sets a defeat flag to `false` at the moment of
victory. It is inert either way, so no test and no gate can distinguish the bug from the intent.

---

## 5. Risk / decision register outcome

| Locked decision | Outcome |
|---|---|
| §3 — Tribbles are corruption, not multipliers | **reversed in shipped text** (Finding 3) |
| §4 — madness is flavour only | **held**, exactly |
| §5 — `voidFluxActive` must not touch condition math | **held** — vacuously; the combat half never shipped |
| §6 — the Prior Carrier is a separate entity with no profile | **held**, exactly |
| §7 — only the Destroy path needs the manual `defeatedBattles` injection | **held**, all three lines byte-exact |

Four of five held. The one that did not is the only one that was a *narrative* decision rather than
a data-shape decision — nothing in the schema enforced it, so the item `desc` drifted freely.

---

## 6. Defects filed

- **§DX-02u** (new) — `voidFluxCleared` has zero writers; `quest_d0209` acts III–V unreachable and
  `voidFluxActive` becomes permanent. No design call: either write the flag on the RAI battle
  victory or repoint Act III's `completion` at `battles:['RAI']`, matching its five siblings.
- **§AUDIT-03y** (extended) — `battles:['BK']` on `quest_d0205_a3`; BK carries no battle and nothing
  writes `defeatedBattles['BK']`. Independent of §AUDIT-03x.
- **§AUDIT-03v/w/y(b)/aa cluster** (7th instance) — `aurosBlueprintKnown`'s −4 AC promise, stated in
  two surfaces, read by none.
- **§DX-02n** (+6) — the zero-reader table in Finding 6; and the **read-only** shape in Finding 2a,
  which the proposed `check:deadconsts` scope does not cover.
- **§DX-02m** (named instance) — the two unseeded `Math.random()` d20s in Finding 5.
- **§DUNGEON-01-FU** (new) — the §3 Tribble text contradiction: four item `desc` strings and one
  threshold line assert a mechanic the design lock removed. Copy fix, one design call (keep the
  lore revision or retire it).

Pre-existing and recorded in the engine's own comments, not re-filed: `skill_check` quests never
reach status `'complete'`, so `quest_d0208_a4`/`_a5`'s `onComplete` narratives never fire —
*"⚠ dead in legacy too … (§DUNGEON-01 gap)"*.

---

## 7. Preserved original claims (NOT SHIPPED, kept)

Retained verbatim in intent so no reader mistakes absence for success:

1. `MONSTER_POOL` gains `baby_chest_mimic` / `bookshelf_mimic` / `floor_mimic` / `mother_mimic`,
   all `passive:true`, and a `_isPassiveTerrain(terrain)` helper suppresses auto-spawn where every
   monster in `WORLD_DB[terrain].monsters` is passive.
2. `tribbleCount` decrements when a Tribble is offered as mimic-bait, reducing the Animal Handling
   DC by 4.
3. Tribble display thresholds 1–2 / 3–4 / 5+, the 5+ band being a **CY** node line
   (*"The Tribbles in your pack pulse slightly faster here."*).
4. The §D01-04 toll is the **removal of a read journal entry** from `journalEntriesRead`.
5. `voidFluxActive` wraps combat damage resolution, retagging fire → cold on the hcard label.
6. On NG+ the CY WIS save is suppressed rather than re-rolled.
7. Healing under Void Flux is a net **loss** (`hp -= floor(heal*0.5)`), not a nullification.

---

*Verified 2026-08-11 (§DOC-02k) against `roll2hit-v3.html` @ `4eb1dc6`. 326 → 295 lines.*

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
