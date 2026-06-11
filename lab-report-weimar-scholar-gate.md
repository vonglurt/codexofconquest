<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->

# Lab Report — Layer 51: Weimar Scholar Gate

**IEEE-Format Post-Mortem**  
**Date:** 2026-05-25  
**Layer:** 51  
**Section:** §XVI  
**Status:** ✅ Implemented  
**Codebase:** `roll2hit-v3.html` — single-file browser RPG

---

## Abstract

This report documents the design intent, implementation architecture, and integration points of Layer 51 — the Weimar Scholar Gate. The Scholar Gate is a four-quest narrative arc set in Act VI at the Scholar's Quarter (SQ node) in Weimar. It introduces two named NPCs (Archivist Isolde Voss and ex-Scholar Benedikt Rasp), a new monster (`scholars_guard`), a new item category (tomes), and an in-game archive modal with three readable documents. The arc answers a structural question embedded in the world since Act I: who was Froberger, why was his access revoked, and what did he find that the Scholar Kings didn't want published? It also introduces the First Researcher — the character whose identity is fully revealed only by completing all four quests. This revelation directly enables Layer 52's Void Archaeology arc.

---

## I. Design Intent

### A. The Weimar Gap

The Scholar's Quarter (SQ) in Weimar existed in the node map as a passive story node: Archivus Ptolemy Sweelinck, the Weimar Fragment (Shard #7), and ambient lore about old books. There was no quest chain, no archive access mechanic, no reason to return after collecting the shard. The node had weight in the world (Froberger's journal references the Scholar Kings repeatedly) but no mechanical payoff.

The Scholar Gate fills this gap by making SQ the locus for Froberger's institutional history. The player arrives seeking shard #7 and discovers the bureaucratic record of why Froberger died: not because the Void killed him, but because the Scholar Kings revoked his access and left him without institutional backing.

### B. The Tome Category

The game's inventory had relics, consumables, and key items. It had no passive persistent bonuses from carried objects. Tomes address this: readable items with `type:'tome'` and a `bonus` field that modifies three combat stats (death saves, initiative, attack). The mechanic rewards quest completion with lasting numerical benefits rather than gold or one-use items.

The bonus structure was chosen to match the narrative of each tome:
- Froberger's Field Notes → `+1 death save` (his note: "The pressure is survivable if you know it's coming.")
- Scholar Kings' History → `+2 initiative` (Benedikt's maxim: "First knowledge, then decision, then action.")
- Benedikt's Annotated Copy → `+1 atk while quest active` (active scholarship improves performance)

### C. The First Researcher Problem

The Weimar arc needed a revelation that mattered. The Froberger revocation letter (Document 1) tells the player what happened to Froberger institutionally. The field report (Document 2) shows what the Scholar Kings dismissed as anecdote. But Document 3 — the personnel file — is redacted. The name of the researcher who came before Froberger, who built the containment structure, is hidden behind `[REDACTED]`.

Revealing that name required earning Benedikt's trust over three reading circle sessions, completing quest_wm_04, and then returning to the archive. The unredaction of Document 3 (replacing `[REDACTED]` with `Marta Eilene Vass`) is the arc's narrative climax. It unlocks §XVII's Void Archaeology arc by establishing who built the Antecedent Containment Protocol.

---

## II. Implementation Architecture

### A. New Monster — `scholars_guard`

**Defined in `MONSTER_POOL` — line 4623:**

```js
scholars_guard: { key:'scholars_guard', name:"Scholar's Guard", ac:14, hp:45,
  atk:5, dmgDie:8, dmgCount:1, dmgFlat:3, tier:'medium' }
```

**Drop table** (line 5049): `scholars_guard` → `"Scholar Kings' Seal"` (icon 🔏, sell:20).

**Terrain pool** (line 5411): added to `scholars_qtr` pool alongside homunculi, mages, liches, and library ghosts. Scholar's Seals drop from guards and serve as currency for archive access (quest_wm_01 gate: 3 Seals OR archive letter).

### B. Tome Item Category and `_tomeBonuses()`

**Function — line 8451:**

```js
function _tomeBonuses() {
  const out = { deathSave:0, initiative:0, atk:0 };
  const hasActiveQuest = Object.values(S_story.quests || {}).some(v => v === 'active');
  (S_story.inventory || []).forEach(item => {
    if (item.type !== 'tome' || !item.bonus) return;
    if (item.bonus.deathSave)             out.deathSave += item.bonus.deathSave;
    if (item.bonus.initiative)            out.initiative += item.bonus.initiative;
    if (item.bonus.atkWhileQuestActive && hasActiveQuest) out.atk += item.bonus.atkWhileQuestActive;
  });
  return out;
}
```

**Integration points:**

| System | Location | Effect |
|--------|----------|--------|
| Initiative roll | Line 6154 | `d20 + dexMod + _tomeBonuses().initiative` |
| Death saves | Line 6218 | `d20 + _tomeBonuses().deathSave + _kingsSealBonus` |
| Attack bonus | Line 9881 | `atkBonus + _tomeBonuses().atk` |

`atkWhileQuestActive` is condition-gated: it only contributes when at least one quest is in `'active'` state. This prevents the bonus from persisting into a completed-game state where all quests are done.

### C. State Flags

**Defined in `_S_DEFAULTS()` — lines 8428–8431:**

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `wmLowerArchiveUnlocked` | boolean | `false` | Gates the `[Open Archive]` button in SQ render |
| `wmDoc1Read` | boolean | `false` | Revocation Letter read |
| `wmDoc2Read` | boolean | `false` | Field Report read |
| `wmDoc3Read` | boolean | `false` | Personnel File read (redacted) |
| `wmDoc3Unredacted` | boolean | `false` | Personnel File unredacted after quest_wm_03 |
| `wmArchiveComplete` | boolean | `false` | All 3 docs read; triggers reading circle chain |
| `wmSessionsDays` | array | `[]` | Tracks gameDay values of each Benedikt session |
| `wmBenediktCircleComplete` | boolean | `false` | 3 sessions attended; triggers quest_wm_04 |
| `wmFirstResearcherKnown` | boolean | `false` | First Researcher's name learned; gates §XVII |

Also from line 8406: `archiveLetterObtained` — alternative access path to the lower archive (obtained from Yael at CI with favorability ≥ 1 and enough trust).

### D. Archive Documents (`WM_ARCHIVE_DOCS` — line 12359)

Three documents readable in the `_storyWmArchiveModal()` overlay:

| # | Key | Title | Content Summary |
|---|-----|-------|-----------------|
| 1 | `wmDoc1Read` | Froberger — Access Revocation Letter | Signed by Archivist I. Voss; revoked 6 months before Froberger's death; cites "speculative endangerment" |
| 2 | `wmDoc2Read` | Scholar Kings Field Report — Early Void Signs | Three independent observer reports dismissed as anecdote; Froberger's margin note: "I talked to the shepherd." |
| 3 | `wmDoc3Read` | Personnel File — The First Researcher [REDACTED] | Dates precede Scholar Kings' founding; name redacted; unredacted to "Marta Eilene Vass" after quest_wm_03 |

A fourth document — **The Constructor's Log** — appears in the modal when `vaAllMarksFound` is true (§XVII crossover, line 12405). This creates a single archive UI that grows to accommodate the Void Archaeology revelation without a separate interface.

### E. Archive Modal (`_storyWmArchiveModal()` — line 12381)

Toggle-style overlay (second call removes it). Renders documents in read/unread states with color coding: green border + checkmark for read, amber border + Read button for unread. Document 3 renders in two states: redacted (before quest_wm_03) and unredacted (after, replacing `[REDACTED]` with `Marta Eilene Vass`).

The modal button appears in SQ node render only when `wmLowerArchiveUnlocked` is true (line 14342).

### F. NPC Profiles

**Isolde Voss** (line 7657) — Senior Archivist First Tier. Node: SQ. Begins Neutral; advances to Friendly on quest_wm_02 completion. Key line at Dear Friend: *"He left his research notes in the lower archive. I moved them there myself. I told myself it was protocol. I've been thinking about that since you came in."* — her complicity in the Froberger revocation is acknowledged but never resolved.

**Benedikt Rasp** (line 7674) — ex-Scholar Tier 3, resigned. Runs reading circle from bookbinder's stall. Advances to Dear Friend on quest_wm_03 completion. Disposition at quest_wm_04: *"The Scholar Kings didn't erase her. They just stopped saying the name. Froberger said it in his margin notes every time. That's how I found her. And now you know how I found him."* — this line establishes the discovery chain: First Researcher → Froberger → Benedikt → player.

### G. Quest Chain

**Activation at SQ node (lines 14325–14365):**

```
quest_wm_01 activates when: actNumber >= 6, not yet active
quest_wm_02 activates when: quest_wm_01 complete
quest_wm_03 activates when: wmArchiveComplete (all 3 docs read)
quest_wm_04 activates when: wmBenediktCircleComplete
```

| Quest | Title | Completion | Reward |
|-------|-------|------------|--------|
| `quest_wm_01` | Isolde: The Revocation Record | 3 Scholar Seals consumed OR archiveLetterObtained | Lower archive unlocked; seals consumed |
| `quest_wm_02` | Isolde: Lower Archive | wmDoc1Read AND wmDoc2Read AND wmDoc3Read | Froberger's Field Notes (tome, +1 death save); Isolde → Friendly |
| `quest_wm_03` | Benedikt: The Reading Circle | wmSessionsDays.length ≥ 3 (different days) | Scholar Kings' History (tome, +2 initiative); Benedikt → Dear Friend; wmDoc3Unredacted |
| `quest_wm_04` | Benedikt: The First Researcher | wmFirstResearcherKnown | Benedikt's Annotated Copy (tome, +1 atk while quest active); +300gp |

**Reading circle mechanic (lines 14351–14373):** Each session stores `gameDay` in `wmSessionsDays`. The game checks that the current day is not already in the array before allowing a new session — three sessions must span at least three different in-game days. At 3 sessions, `wmBenediktCircleComplete` is set to `true`.

---

## III. Design Decisions and Trade-offs

### A. Two Access Paths for quest_wm_01

The archive access gate (3 Scholar Seals OR archive letter) provides a skill-based alternative to grinding the scholars_guard encounter. Players with high Yael favorability can obtain the letter at CI before reaching Weimar — rewarding prior relationship building. Players who ignored that NPC arc fight guards. Both paths complete the quest; neither is faster in all cases.

### B. Reading Circle as a Time Gate

Three sessions on different `gameDay` values is a soft time gate. The player must travel away from SQ and return twice. This prevents rushing Benedikt's arc immediately on arriving in Weimar — the reading circle mechanic implies that trust accrues over time, not in a single sitting. The `wmSessionsDays` array enforces this without a wall.

### C. `wmDoc3Unredacted` As a Separate Flag from `wmDoc3Read`

Document 3 can be read in redacted form (sets `wmDoc3Read`) without unredacting it. `wmDoc3Unredacted` only sets on quest_wm_03 completion. This distinction allows the archive modal to render the document twice — once as the institutional record the player found, once as the corrected version Benedikt enabled. A player who reads Document 3 before completing the reading circle gets the redacted version; they must return after quest_wm_03 to see the unredacted form.

### D. `atkWhileQuestActive` Condition

Benedikt's Annotated Copy provides `+1 atk` only while at least one quest is active. This prevents the bonus from inflating late-game numbers after all quests are complete. It also fits the narrative: studying actively, while engaged in a task, sharpens focus. A resting scholar doesn't swing harder.

---

## IV. Post-Mortem Notes

### What Worked

- The three-document reveal structure (bureaucratic record → dismissed evidence → redacted name) recreates the experience of archival research. Each document adds context without explaining everything; the player assembles the picture.
- The Isolde/Benedikt NPC pair divides the arc cleanly: Isolde represents institutional authority reluctantly reckoning with her choices; Benedikt represents the outside researcher who did what the institution wouldn't. The player navigates both to complete the arc.
- Connecting the archive modal to §XVII's Constructor's Log (as Document 4, visible when `vaAllMarksFound`) was the correct architectural choice. The archive is now a persistent interface that grows as the player learns more — the same place to return to across two layers of investigation.

### What Could Be Better

- The reading circle mechanic is invisible: the game tells the player there are three sessions, but there is no UI showing "Sessions attended: 2/3" or when the next session is available. A player who doesn't track in-game days can't tell how far along they are.
- `wmDoc3Unredacted` requires returning to the archive after quest_wm_03. There is no notification prompt. Players who don't backtrack will miss the unredacted name and the `wmFirstResearcherKnown` flag will not advance via normal play (it sets on quest_wm_04 completion, not on re-reading Document 3).
- Benedikt Rasp becomes Dear Friend at quest_wm_03 completion, but there are no further conversations with him in the base game after quest_wm_04. The Void Shaman arc (§XXI) adds a Benedikt callback for `vsShamanPersuaded` players, but the gap between quest_wm_04 and that callback is long.

---

## V. File References

| File | Location | Content |
|------|----------|---------|
| `roll2hit-v3.html` | Line 4623 | `scholars_guard` monster definition |
| `roll2hit-v3.html` | Line 5049 | `scholars_guard` drop → Scholar Kings' Seal |
| `roll2hit-v3.html` | Line 5411 | `scholars_qtr` terrain pool — includes scholars_guard |
| `roll2hit-v3.html` | Lines 7657–7668 | Isolde Voss NPC profile |
| `roll2hit-v3.html` | Lines 7674–7676 | Benedikt Rasp NPC profile |
| `roll2hit-v3.html` | Lines 7979–8005 | quest_wm_01 through quest_wm_04 QUEST_DB entries |
| `roll2hit-v3.html` | Lines 8428–8431 | Weimar state flags in `_S_DEFAULTS()` |
| `roll2hit-v3.html` | Line 8452 | `_tomeBonuses()` function |
| `roll2hit-v3.html` | Lines 6154, 6218, 9881 | Tome bonus integration: initiative, death saves, atk |
| `roll2hit-v3.html` | Lines 12359–12379 | `WM_ARCHIVE_DOCS` const — 3 documents |
| `roll2hit-v3.html` | Lines 12381–12455 | `_storyWmArchiveModal()` function |
| `roll2hit-v3.html` | Lines 13064–13099 | Quest reward handlers — tome grants, flag sets |
| `roll2hit-v3.html` | Lines 14325–14373 | Quest activation chain and reading circle logic at SQ |
| `plan.md` | §XVI | Original design directive |
| `lab-report-ng-plus-remembrance.md` | §II.B | `wmFirstResearcherKnown` cross-reference — Entry 42 prerequisite |

---
*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
