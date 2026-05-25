# Story Arc — The Investigation Chain (§XVI → §XVII → §XXI)

**Arc type:** Sequential investigation chain — three sections spanning Acts VI–NG+  
**Sections:** §XVI Weimar Scholar Gate · §XVII Void Archaeology · §XXI Void Shaman "The Warden"  
**Lab reports:** `lab-report-weimar-scholar-gate.md` · `lab-report-void-archaeology.md` · `lab-report-void-shaman.md`  
**Status:** All three sections implemented (Layers 51, 52, 56)

---

## Prerequisites Chain

| Section | Prerequisites | Key Flag Output |
|---------|--------------|-----------------|
| §XVI | `actNumber >= 6` | `wmFirstResearcherKnown` |
| §XVII | `ngPlusRun >= 1` + `wmFirstResearcherKnown` (§XVI) + `entry42Written` (§XV) | `vaLastWardVisited`, `vaArchitectureKnown` |
| §XXI | `vsShamanKnown` (§XX) + `vaLastWardVisited` (§XVII) | `wardensLegacyKnown` |

The chain is strictly sequential at the flag level. §XVII cannot begin without §XVI's terminal flag. §XXI cannot begin without §XVII's terminal flag. §XVI itself requires Act VI, placing the arc's entry point in the game's penultimate act cluster. §XVII is NG+-exclusive: the triple gate (NG+ generation + First Researcher identity + Entry 42 authored) is a comprehension gate, not a difficulty gate. The retroactive reading of the investigation sites only lands if the player knows who Marta Eilene Vass is before they see her marks.

---

## §XVI — Weimar Scholar Gate

**Layer:** 51  
**Node:** SQ (Scholar's Quarter, Weimar)  
**Act gate:** `actNumber >= 6`

### Summary

The Scholar's Quarter existed as a passive lore node — Archivist Sweelinck, Shard #7, ambient references to old books — with no quest chain and no reason to return. §XVI makes SQ the locus for Froberger's institutional history. The player arrives seeking the shard and discovers the bureaucratic record of why Froberger died: not because the Void killed him, but because the Scholar Kings revoked his access and left him without institutional backing.

The arc introduces two NPCs, a new monster, a tome inventory category, and a three-document archive modal. Its narrative climax is the unredaction of Document 3, revealing that the personnel file's `[REDACTED]` name is Marta Eilene Vass — the First Researcher whose containment structure predates the Scholar Kings by a generation. This revelation is the direct prerequisite for §XVII.

### Story Text (story.md Layer 51 stub)

Two new NPCs at the SQ node:

- **Archivist Isolde Voss** (`isolde_voss`) — controls access to the Lower Archive; impartial → friendly after Q-WM-02. Starts guarding the gate. Quote: *"The revocation was filed correctly. I stopped being certain it was right about three months after he died."*
- **Benedikt Rasp** (`benedikt_rasp`) — ex-Scholar Tier 3 (resigned); runs a reading circle from a bookbinder's stall; appears at SQ after `wmArchiveComplete`. Dear Friend after Q-WM-03.

Quest chain (all activated at SQ node, sequential):

- **Q-WM-01** "The Revocation Record" — collect 3 Scholar Kings' Seals OR use `archiveLetterObtained`. Reward: `wmLowerArchiveUnlocked`.
- **Q-WM-02** "Lower Archive" — read all 3 archive docs in `_storyWmArchiveModal()`. Reward: Froberger's Field Notes (Tome, +1 death save) + Isolde Friendly.
- **Q-WM-03** "Benedikt's Circle" — attend 3 reading circle sessions (one per `dayCounter` value). Reward: Scholar Kings' History (Tome, +2 initiative) + Benedikt Dear Friend + `wmDoc3Unredacted`.
- **Q-WM-04** "The First Researcher" — re-read unredacted Document 3 in archive (name: Marta Eilene Vass). Reward: Benedikt's Annotated Copy (Tome, +1 ATK while quest active) + 300gp + `wmFirstResearcherKnown`.

Tome bonus system: `_tomeBonuses()` helper computes aggregate bonuses from all `type:'tome'` inventory items. Applied at: `rollInitiative()` (initiative), `rollDeathSave()` (threshold), main attack roll in `doAllPlayerAttacks()` (ATK).

New monster: `scholars_guard` (medium, AC14/HP45/ATK+5/1d8+3) — added to `scholars_qtr` terrain. Drops Scholar Kings' Seal (🔏, sell:20).

Archive modal (`_storyWmArchiveModal()`): 3 documents with READ buttons; Document 3 shows unredacted after `wmDoc3Unredacted` set. Accessible via "Lower Archive" button at SQ when `wmLowerArchiveUnlocked`.

### NPC Profiles

**Archivist Isolde Voss** — Senior Archivist First Tier. Node: SQ. Begins Neutral; advances to Friendly on quest_wm_02 completion.

Key NPC lines by favorability state:
- Neutral: *"The revocation was filed correctly. I stopped being certain it was right about three months after he died."*
- Friendly (post quest_wm_02): *"He left his research notes in the lower archive. I moved them there myself. I told myself it was protocol. I've been thinking about that since you came in."*

Isolde represents institutional authority reluctantly reckoning with her choices. Her complicity in the Froberger revocation is acknowledged but never resolved. She caps at Friendly — she cannot become a Dear Friend because she still holds the position that revoked Froberger's access.

**Benedikt Rasp** — ex-Scholar Tier 3, resigned. Runs reading circle from bookbinder's stall. Node: SQ. Appears after `wmArchiveComplete`. Advances to Dear Friend on quest_wm_03 completion.

Key NPC line at quest_wm_04 disposition: *"The Scholar Kings didn't erase her. They just stopped saying the name. Froberger said it in his margin notes every time. That's how I found her. And now you know how I found him."*

This line establishes the discovery chain that §XVII will formalize: First Researcher → Froberger → Benedikt → player.

### State Flags

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `wmLowerArchiveUnlocked` | boolean | `false` | Gates [Open Archive] button in SQ render |
| `wmDoc1Read` | boolean | `false` | Revocation Letter read |
| `wmDoc2Read` | boolean | `false` | Field Report read |
| `wmDoc3Read` | boolean | `false` | Personnel File read (redacted) |
| `wmDoc3Unredacted` | boolean | `false` | Personnel File unredacted after quest_wm_03 |
| `wmArchiveComplete` | boolean | `false` | All 3 docs read; triggers reading circle chain |
| `wmSessionsDays` | array | `[]` | Tracks gameDay values of each Benedikt session |
| `wmBenediktCircleComplete` | boolean | `false` | 3 sessions attended; triggers quest_wm_04 |
| `wmFirstResearcherKnown` | boolean | `false` | First Researcher's name learned; gates §XVII |
| `archiveLetterObtained` | boolean | `false` | Alternative access path (from Yael at CI) |

Note: `wmDoc3Unredacted` is a separate flag from `wmDoc3Read`. Document 3 can be read in redacted form without unredacting it. `wmDoc3Unredacted` sets only on quest_wm_03 completion. A player who reads Document 3 before completing the reading circle gets the redacted version and must return after quest_wm_03 to see the unredacted form with the name Marta Eilene Vass.

### Quest Chain

| Quest | Title | Completion Condition | Reward |
|-------|-------|----------------------|--------|
| `quest_wm_01` | Isolde: The Revocation Record | 3 Scholar Seals consumed OR `archiveLetterObtained` | Lower archive unlocked; seals consumed |
| `quest_wm_02` | Isolde: Lower Archive | `wmDoc1Read` AND `wmDoc2Read` AND `wmDoc3Read` | Froberger's Field Notes (tome, +1 death save); Isolde Friendly |
| `quest_wm_03` | Benedikt: The Reading Circle | `wmSessionsDays.length >= 3` (different days) | Scholar Kings' History (tome, +2 initiative); Benedikt Dear Friend; `wmDoc3Unredacted` |
| `quest_wm_04` | Benedikt: The First Researcher | `wmFirstResearcherKnown` | Benedikt's Annotated Copy (tome, +1 atk while quest active); +300gp |

**Activation sequence:**

```
quest_wm_01 activates when: actNumber >= 6, not yet active
quest_wm_02 activates when: quest_wm_01 complete
quest_wm_03 activates when: wmArchiveComplete (all 3 docs read)
quest_wm_04 activates when: wmBenediktCircleComplete
```

**Reading circle mechanic:** Each session stores the current `gameDay` value in `wmSessionsDays`. The game checks that the current day is not already in the array before allowing a new session — three sessions must span at least three different in-game days. At 3 sessions, `wmBenediktCircleComplete` is set to `true`. This prevents rushing Benedikt's arc in a single visit; trust accrues over time.

### Archive Documents

| # | Key | Title | Content Summary |
|---|-----|-------|-----------------|
| 1 | `wmDoc1Read` | Froberger — Access Revocation Letter | Signed by Archivist I. Voss; revoked 6 months before Froberger's death; cites "speculative endangerment" |
| 2 | `wmDoc2Read` | Scholar Kings Field Report — Early Void Signs | Three independent observer reports dismissed as anecdote; Froberger's margin note: "I talked to the shepherd." |
| 3 | `wmDoc3Read` | Personnel File — The First Researcher [REDACTED] | Dates precede Scholar Kings' founding; name redacted; unredacted to "Marta Eilene Vass" after quest_wm_03 |
| 4 | `vaAllMarksFound` gate | The Constructor's Log | Appears in modal when `vaAllMarksFound` is true (§XVII crossover); 7 entries by Marta Eilene Vass |

Document 4 appears in the same archive interface after §XVII's investigation sites are all found. The archive modal is a persistent interface that grows as the player learns more — the same place to return to across two layers of investigation.

### New Monster

`scholars_guard` — Scholar's Guard. AC 14, HP 45, ATK +5, 1d8+3. Tier: medium. Defined in MONSTER_POOL. Added to `scholars_qtr` terrain pool alongside homunculi, mages, liches, and library ghosts.

Drop: Scholar Kings' Seal (icon 🔏, sell: 20). Three Seals are required to complete quest_wm_01 via the combat path. Alternative: `archiveLetterObtained` from Yael at CI with favorability ≥ 1, skipping the combat requirement.

### Tome Bonus System

`_tomeBonuses()` computes aggregate bonuses from all `type:'tome'` inventory items.

| Tome | Bonus | Source Mechanic |
|------|-------|-----------------|
| Froberger's Field Notes | +1 death save | Froberger's note: "The pressure is survivable if you know it's coming." |
| Scholar Kings' History | +2 initiative | Benedikt's maxim: "First knowledge, then decision, then action." |
| Benedikt's Annotated Copy | +1 atk while quest active | Active scholarship improves performance; condition-gated |

Integration points:
- Initiative roll: `d20 + dexMod + _tomeBonuses().initiative`
- Death saves: `d20 + _tomeBonuses().deathSave + _kingsSealBonus`
- Attack bonus: `atkBonus + _tomeBonuses().atk`

`atkWhileQuestActive` is condition-gated: it only contributes when at least one quest is in `'active'` state. A resting scholar (all quests complete) does not receive the bonus.

### Two Access Paths for quest_wm_01

The archive access gate (3 Scholar Seals OR archive letter) provides a skill-based alternative to grinding the scholars_guard encounter. Players with high Yael favorability can obtain the letter at CI before reaching Weimar — rewarding prior relationship building. Both paths complete the quest; neither is faster in all cases.

---

## §XVII — Void Archaeology

**Layer:** 52  
**Subtitle:** "The Architecture"  
**Nodes:** CI, SL, DF, WM, MT (investigation marks); SQ (arc close); WM archive modal (Document 4)  
**Act gate:** NG+-exclusive — requires `ngPlusRun >= 1` + `wmFirstResearcherKnown` + `entry42Written`

### Summary

§XVII is a NG+-exclusive investigation arc that places five `[INVESTIGATE]` buttons at nodes the player has visited since Act I. Each reveals a mark left by the First Researcher — Marta Eilene Vass — 200 years before the game's events. Collecting all five unlocks a fourth document in the Weimar archive, the Constructor's Log, which enables opening the sealed MT tunnel. The arc closes at SQ where Benedikt delivers the "four-author chain" synthesis. `vaArchitectureKnown` gates a fifth ending variant at the CO victory screen.

The design goal is retroactive recontextualization. The player has walked through five locations that were already hers. The `[INVESTIGATE]` buttons surface what was always true about the world. Nothing is retconned — the marks were always there. The player lacked the knowledge to see them.

### Story Text (story.md Layer 52 stub)

Prerequisites: `ngPlusRun >= 1` + `wmFirstResearcherKnown` (from §XVI) + `entry42Written` (from §XV).

- **Five investigation sites** — `[INVESTIGATE]` button at CI/SL/DF/WM/MT when prerequisites met. Each reveals one paragraph of the Antecedent Containment Protocol pattern. Flags: `vaCI`, `vaSL`, `vaDF`, `vaWM`, `vaMT`.
- **Q-VA-01** "Five Marks" — auto-activates on first investigation site visit; complete when all 5 visited (`vaAllMarksFound`).
- **Q-VA-02** "Constructor's Log" — activates when `vaAllMarksFound`; 4th document appears in `_storyWmArchiveModal()`; 7 entries written by Marta Eilene Vass (First Researcher); reward: The Constructor's Log (readable) + Antecedent Seal (relic) items.
- **Q-VA-03** "The Sealed Tunnel" — MT node gains `[Open the tunnel]` when `vaLogFound` + key item in inventory. Text chamber: 6 sentences + *"The Antecedent was here. It is not anymore."* Reward: `vaLastWardVisited` + 200gp.
- **Q-VA-04** "The Architecture" — Benedikt delivers message at SQ when `vaLastWardVisited + entry42Written`. Reward: `vaArchitectureKnown` + 500gp + lore addendum to Annotated Copy.
- **Fifth ending** — if `vaArchitectureKnown + entry42Written + ngPlusRun >= 1`: CO outro addendum *"Froberger wrote 41 entries. You wrote one. She wrote 7..."*; Sweelinck question: *"What was inside the cage?"* (overrides all other questions).
- **State flags (9):** `vaCI`, `vaSL`, `vaDF`, `vaWM`, `vaMT`, `vaAllMarksFound`, `vaLogFound`, `vaLastWardVisited`, `vaArchitectureKnown`.

### Gate Condition

```js
const _vaReady = (S_story.ngPlusRun || 0) >= 1
              && S_story.wmFirstResearcherKnown
              && S_story.entry42Written;
```

All three must be true. Until all three are true, `[INVESTIGATE]` buttons do not render, quest_va_01 does not activate, and the arc is entirely invisible. The triple gate is a comprehension gate: the retroactive reading only lands if the player has the context for it.

### Five Investigation Sites

| Node | Flag | Investigation Text Summary |
|------|------|---------------------------|
| CI | `vaCI` | Blue Shutters Archive shelf record — researcher category "Containment"; same shelf as archive letter |
| SL | `vaSL` | Carved marker on a corner building predating the city by 80 years; predates the Scholar Kings |
| DF | `vaDF` | Stone alignment spaced to a mathematical interval; the battle happened at the activation point |
| WM | `vaWM` | Document 3 in the lower archive — project codename now visible: ANTECEDENT CONTAINMENT PROTOCOL |
| MT | `vaMT` | Sealed access tunnel; never opened in any record; sealed from inside; intact |

On button click: sets the site flag, displays the site text, removes the button, checks if all five flags are now set. When all five are collected, `vaAllMarksFound = true` fires with a 600ms delayed message: *"Five marks. One pattern. She was everywhere before anyone was looking."* `quest_va_02` activates at this point.

### Quest Chain

| Quest | Title | Completion Condition | Reward |
|-------|-------|----------------------|--------|
| `quest_va_01` | The Architecture: Five Marks | `vaAllMarksFound` | narrative only |
| `quest_va_02` | The Architecture: Constructor's Log | `vaLogFound` | Constructor's Log (readable) + Antecedent Seal (relic) |
| `quest_va_03` | The Architecture: The Sealed Tunnel | `vaLastWardVisited` | +200gp |
| `quest_va_04` | The Architecture: The Chain | `vaArchitectureKnown` | narrative only — closes the arc |

**Activation sequence:**
- `quest_va_01` activates on first `[INVESTIGATE]` button encounter at any site
- `quest_va_02` activates when `vaAllMarksFound` fires
- `quest_va_03` activates when `vaLogFound` is true
- `quest_va_04` activates when `vaLastWardVisited` is true

### State Flags

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `vaCI` | boolean | `false` | CI site investigated |
| `vaSL` | boolean | `false` | SL site investigated |
| `vaDF` | boolean | `false` | DF site investigated |
| `vaWM` | boolean | `false` | WM site investigated |
| `vaMT` | boolean | `false` | MT site investigated |
| `vaAllMarksFound` | boolean | `false` | All five sites found; unlocks Document 4 |
| `vaLogFound` | boolean | `false` | Constructor's Log read; unlocks MT tunnel |
| `vaLastWardVisited` | boolean | `false` | MT tunnel opened; activates quest_va_04 |
| `vaArchitectureKnown` | boolean | `false` | Four-author chain understood; gates fifth ending |

### Constructor's Log (Document 4)

The Weimar archive modal renders a fourth document when `vaAllMarksFound` is true. Document 4 — **The Constructor's Log** — contains seven entries in the First Researcher's handwriting. The final entry (Entry 7):

> *"If someone is reading this, the sealing mechanism has activated. The cage is closed. Whatever you sealed inside it — that is what I built this for. I am sorry. I did not have a better answer."*

Reading the Log:
- Sets `vaLogFound = true`
- Adds The Constructor's Log (readable) and Antecedent Seal (relic) to inventory
- Activates `quest_va_03`

The Log is discoverable via the archive modal (Document 4 path) or via the quest_va_02 reward handler. Both paths converge on `vaLogFound`.

### MT Tunnel Opening

At MT, if `vaLogFound` is true and `vaLastWardVisited` is false, the game checks for a key item:

```js
const _hasKey = (S_story.inventory || []).some(
  i => i.name === 'Antecedent Seal' || i.name === "Froberger's Field Notes"
);
```

Either item opens the tunnel. Froberger's Field Notes (the §XVI tome) are an alternative key — Froberger's notes reference the tunnel's design, and the seal on the Notes matches the tunnel's lock. Both paths are accepted by the `.some()` check.

On tunnel opening: `vaLastWardVisited = true`. The chamber text renders describing cut stone, perfectly still air sealed for 200 years, and six sentences on the far wall — the First Researcher's final operational notes. The last line: *"The Antecedent was here. It is not anymore. You know where it is now."*

### Benedikt Synthesis Speech at SQ — Quest_va_04

On any SQ visit where `vaLastWardVisited` is true, `entry42Written` is true, and `vaArchitectureKnown` is not yet set:

> **Benedikt:** "She built it. You closed it. Froberger found the mechanism. You followed him. Entry 42 is the fourth link. Four links is a chain. A chain holds. That is the only kind of answer this work produces — not a solution, a chain."

`vaArchitectureKnown` sets immediately after the 700ms setTimeout registration — the flag is true before the message displays, preventing double-firing on rapid navigation. `quest_va_04` is marked complete. The five-hundred-gold reward is delivered.

This is the arc's structural close. Benedikt traces the chain backward — from Froberger's margin notes to the First Researcher, and now forward from the player's Entry 42 to the synthesis. He is the archivist of the archivist. His speaking the chain aloud is an institutional act: the reading circle has one more session.

### CO Victory Screen — Fifth Ending Variant

`vaArchitectureKnown` gates a fifth Sweelinck question variant at the CO ending screen, overriding all other question branches:

```js
if (S_story.vaArchitectureKnown && S_story.entry42Written && (S_story.ngPlusRun || 0) >= 1) {
  sweelinckQ = '"What was inside the cage?"';
}
```

The addendum appended below the ending text:

> *"Froberger wrote 41 entries. You wrote one. She wrote 7, and no one counted them for 200 years. The cage is closed. You know what it holds. The story has four authors now."*

This question is only askable to a player who has completed the entire arc. It is also unanswerable in-game — the cage contents are never specified. The question is Sweelinck's acknowledgment that the player knows what they did, not a prompt for an answer.

### `entry42Written` as Required for `vaArchitectureKnown`

`quest_va_04` cannot complete without `entry42Written`. A player who skipped Entry 42 cannot be told "Entry 42 is the fourth link." The chain has only three links without it, and Benedikt does not speak. The arc is structurally incomplete — intentionally. The player who did not write Entry 42 is not yet one of the authors.

---

## §XXI — Void Shaman "The Warden"

**Layer:** 56  
**Subtitle:** "The Antecedent's Last Warden"  
**Node:** MT (Mountain Pass tunnel) + SQ (Benedikt callback)  
**Prerequisites:** `vsShamanKnown` (§XX Visby Underground) + `vaLastWardVisited` (§XVII)

### Summary

§XXI activates at the MT tunnel when both investigation lines — the Visby debt chain and the Void Archaeology tunnel — converge. The player finds the Warden: a figure who has spent eleven years executing a corrupted mandate, believing they are working to re-open the Antecedent's cage. The arc offers two resolution paths (persuasion via the Constructor's Log, or combat) and closes the Hollow Hands sub-clan arc. Both paths set `wardensLegacyKnown`.

The arc's premise: the First Researcher planted a guardian at the MT tunnel. Her instruction was to open the tunnel to close the cage — when the sealing mechanism activates, confirm it and stand down. This instruction was copied by hand through seventeen generations of goblin shamanic tradition. The seventeenth copy contains a small error in the verb tense: the sentence now reads "open the cage." A pronoun shift in an oral tradition reinterpreted 200 years later. The Warden armed the Hollow Hands as a resource pool. None of this was malice. It was misdirection so old the original direction was lost.

### Story Text (story.md Layer 56 stub)

Prerequisites: `vsShamanKnown` (§XX) + `vaLastWardVisited` (§XVII). Both required; neither alone triggers the encounter.

MT tunnel node block gated by `vsShamanKnown && vaLastWardVisited && !wardensLegacyKnown`. On first visit sets `vshamanFound = true` and activates `quest_vs_warden`.

**The Warden:** *"You came to stop me. Or to understand. Either is fine. I have been working for eleven years to do the right thing. I may be wrong about what the right thing is."*

- **Persuasion path** — `[📜 Show them the Constructor's Log.]` available if The Constructor's Log is in inventory. Warden reads Entry 2 ("the cage must be opened before it can be closed") and Entry 7 ("if someone is reading this, the cage is closed") — realizes the mandate was fulfilled 200 years before they were born. Gives `warden_token` voluntarily; +600gp; `vsShamanPersuaded = true`; `wardensLegacyKnown = true`. Hollow Hands return to Mordus peacefully.
- **Combat path** — `[⚔️ Fight the Warden.]` triggers `storyPreBattle({code:'MT_WARDEN', battle:{label:'The Warden', key:'void_shaman', count:1}})`. Victory sets `vshamanDefeated = true`; `wardensLegacyKnown = true`; `warden_token` awarded. Warden's final words: "If I'm wrong, then I needed to be stopped. That's — that's actually fine." Hollow Hands scatter without leadership.
- **`void_shaman`** — AC15/HP65/ATK+6/2d6+4, rare tier. MONSTER_POOL scripted entry; not in any random terrain pool.
- **`warden_token`** — The Warden's Token (🔑, relic, sell:0). Description: "Recopied seventeen times. The seventeenth copy has a small error in the verb tense that changed everything."
- **`wardensLegacyKnown`** set on either outcome. Hollow Hands arc resolved.
- **Benedikt callback** — at SQ if `vsShamanPersuaded && benedikt_rasp fav >= 2 && !vsShamanBenediktDelivered`: "She planted a guardian at the tunnel and didn't write it down anywhere official. She planted a 200-year misunderstanding. The difference between those things might be very small."
- **State flags:** `vshamanFound`, `vshamanDefeated`, `vsShamanPersuaded`, `wardensLegacyKnown`, `vsShamanBenediktDelivered` in `_S_DEFAULTS()`.
- **`quest_vs_warden`** in QUEST_DB — completeFn: `wardensLegacyKnown`; reward: 600gp (delivered inline).

### Gate Condition

```js
if (node.code === 'MT' && S_story.vsShamanKnown
    && S_story.vaLastWardVisited && !S_story.wardensLegacyKnown)
```

On first qualifying MT visit, `vshamanFound = true` and `quest_vs_warden` activates. The Warden's introductory storyMsg fires: *"You came to stop me. Or to understand. Either is fine. I have been working for eleven years to do the right thing. I may be wrong about what the right thing is."*

This opening line is the Warden's character in full. It establishes that they are not surprised, not hostile, and genuinely uncertain about their own mission — before the player makes any choice.

### Dual Resolution Paths

#### Path 1 — Persuasion

**Gate:** The Constructor's Log must be in inventory (item-presence check, exact name match).  
**Button:** `📜 Show them the Constructor's Log.`

The Warden reads Entry 2: *"The cage must be opened before it can be closed."* They read Entry 7: *"If someone is reading this, the sealing mechanism has activated. The cage is closed."*

Warden's response:

> *"The cage is closed. It was closed 200 years ago. I have been eleven years trying to re-open it."*
> *"Tell the clan the mission is complete. That is the truth — the mandate was fulfilled 200 years before I was born. This is — this is fine. I can stop."*

State changes: `vsShamanPersuaded = true`, `wardensLegacyKnown = true`  
Reward: +600gp, Warden's Token added to inventory  
Sub-clan outcome: *"The sub-clan walked back in. All of them. Mordus didn't ask what changed. He logged them as returned."*

The persuasion path is gated by item presence, not social skill. The Warden cannot be talked out of their mandate — they are not being obstinate, they simply lack the evidence. The Log is the evidence.

#### Path 2 — Combat

**Button:** `⚔️ Fight the Warden.`

Triggers `storyPreBattle` with synthetic node code `MT_WARDEN` (not `MT`) — prevents the battle result from being stored under the actual MT node code, preserving MT's normal state for subsequent visits.

Monster stats: AC 15, HP 65, ATK +6, 2d6+4. Tier: rare. Named "The Warden" in MONSTER_POOL so the battle overlay reads as a named encounter.

On victory: `vshamanDefeated = true`, `wardensLegacyKnown = true`, Warden's Token added.

Warden's post-defeat line:

> *"If I'm wrong, then I needed to be stopped. That's — that's actually fine."*

The Warden passes the token without being asked. Sub-clan scatters rather than returning to Mordus — the combat path disperses the Hollow Hands instead of reintegrating them.

The combat resolution is honorable, not wrong. The Warden knew they might be stopped. They were not prepared to stop on their own without proof. Fighting them is a legitimate answer to "I cannot prove you're wrong, but you need to stop."

### The Corrupted Mandate: Verb-Tense Error

The Warden's Token description carries the entire premise in one sentence: *"Recopied seventeen times. The seventeenth copy has a small error in the verb tense that changed everything."*

A player who takes the combat path and never reads the Constructor's Log receives this artifact, whose description contains the arc's explanation. The premise is accessible from both paths.

### State Flags

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `vshamanFound` | boolean | `false` | Warden's intro text fired; quest_vs_warden activated |
| `vshamanDefeated` | boolean | `false` | Combat path taken and Warden defeated |
| `vsShamanPersuaded` | boolean | `false` | Persuasion path taken — Constructor's Log shown |
| `wardensLegacyKnown` | boolean | `false` | Arc complete (either path); completes quest_vs_warden |
| `vsShamanBenediktDelivered` | boolean | `false` | Benedikt's callback at SQ fired (one per run) |

`vshamanDefeated` and `vsShamanPersuaded` are mutually exclusive. Both set `wardensLegacyKnown`.

### Quest Definition

`quest_vs_warden`:

```js
{ id:'quest_vs_warden', type:'side', title:'The Warden',
  desc:'You have found the Void Shaman — the Antecedent\'s Last Warden,
    200 years misdirected. The mandate was corrupted in transmission.
    The question is whether they can be shown this.',
  hint:'Enter the MT tunnel and confront the Warden.
    Bring the Constructor\'s Log if you have it.',
  completeFn: () => !!(S_story.wardensLegacyKnown),
  disposition:'"If I\'m wrong, then I needed to be stopped.
    That\'s — that\'s actually fine." — The Warden' }
```

The hint explicitly directs the player to bring the Constructor's Log — making the persuasion path legible before the encounter.

### Benedikt Callback at SQ (Persuasion Path Only)

When `vsShamanPersuaded && _npcFavor('benedikt_rasp') >= 2 && !vsShamanBenediktDelivered`, visiting SQ triggers:

> *"You found the Warden. She planted them, didn't she — the First Researcher. She planted a guardian at the tunnel and didn't write it down anywhere official. I didn't know the chain went that far. Neither did she, I think — she thought she was planting a safeguard. She planted a 200-year misunderstanding. The difference between those things might be very small."*

**Conditions:** Only fires on the persuasion path. Requires Benedikt at Dear Friend (fav ≥ 2, i.e., quest_wm_03 completed). Fires once per run (`vsShamanBenediktDelivered`).

The Benedikt callback is the arc's intellectual close. He names the difference between a safeguard and a misunderstanding, and acknowledges the First Researcher may not have known which one she was building. It places the Warden's corruption in the §XVI/§XVII investigation context rather than treating it as a combat resolution.

The callback fires only on the persuasion path because the persuasion path left the Warden able to explain themselves. The combat path leaves no one to explain anything — the Warden is defeated, the sub-clan has scattered, and Benedikt doesn't know what happened.

### Ambient Cross-References

| System | Flag | Effect |
|--------|------|--------|
| News item | `warden_resolved` | *"Travelers on the northern road say the MT pass is open for the first time in forty years."* |
| Shard Note #5 | `wardensLegacyKnown` | addText: *"Placed by the first Warden, on the First Researcher's instruction. The chain goes back this far."* |
| Shard Note #6 | `wardensLegacyKnown` | addText: *"Placed by the original Warden, on the First Researcher's instruction."* |
| Inn Dream (SQ) | `vaArchitectureKnown` | SQ dream variant — Constructor's Log Entry 7 |
| Froberger Entry 26 | ambient | Written before Layer 56: *"The data was on page seven. I wish I had taken longer with the first read."* |

---

## Intersection Points (Cross-Reference Table)

| Node | §XVI | §XVII | §XXI | Cross-Arc |
|------|------|-------|------|-----------|
| SQ | All 4 quests; Benedikt/Isolde NPCs; archive modal | Benedikt synthesis speech (quest_va_04) | Benedikt callback (persuasion path only) | Entry 42 synthesis in §XVII requires §XV `entry42Written` |
| MT | — | `vaMT` investigation mark; tunnel opening (`vaLastWardVisited`) | Warden encounter; `MT_WARDEN` synthetic battle | `vaLastWardVisited` from §XVII is prerequisite for §XXI |
| CI | Alternative archive access path (Yael letter) | `vaCI` investigation mark (Blue Shutters shelf) | — | CI is also §XV Entry 42 modal location |
| WM | `wmFirstResearcherKnown` (Document 3 unredaction) | `vaWM` investigation mark + Document 4 (Constructor's Log) | — | Archive modal is the interface for both §XVI docs and §XVII Document 4 |
| GC | — | — | Hollow Hands sub-clan (combat outcome: scatter) | §XX `vsShamanKnown` gated by Yva testimony at GC |
| SL | — | `vaSL` investigation mark | — | — |
| DF | — | `vaDF` investigation mark (sealing mechanism site) | — | — |

---

## File References

| File | Location | Content |
|------|----------|---------|
| `roll2hit-v3.html` | Line 4623 | `scholars_guard` monster definition |
| `roll2hit-v3.html` | Line 4626 | `void_shaman` monster definition — named "The Warden" |
| `roll2hit-v3.html` | Lines 7657–7676 | Isolde Voss and Benedikt Rasp NPC profiles |
| `roll2hit-v3.html` | Lines 7979–8030 | quest_wm_01–04 + quest_va_01–04 QUEST_DB entries |
| `roll2hit-v3.html` | Lines 8069–8075 | quest_vs_warden QUEST_DB entry |
| `roll2hit-v3.html` | Lines 8428–8441 | Weimar + Void Archaeology + Void Shaman state flags in `_S_DEFAULTS()` |
| `roll2hit-v3.html` | Lines 12359–12455 | `WM_ARCHIVE_DOCS` + `_storyWmArchiveModal()` — 4 documents |
| `roll2hit-v3.html` | Lines 12836–12866 | CO fifth ending variant + victory screen addendum |
| `roll2hit-v3.html` | Lines 14325–14373 | §XVI quest activation chain and reading circle logic at SQ |
| `roll2hit-v3.html` | Lines 14380–14449 | §XVII `[INVESTIGATE]` block — gate, sites, MT tunnel, quest chain |
| `roll2hit-v3.html` | Lines 14611–14729 | §XXI render block — gate, vshamanFound, dual path, Benedikt callback |
| `lab-report-weimar-scholar-gate.md` | All | §XVI full implementation record |
| `lab-report-void-archaeology.md` | All | §XVII full implementation record |
| `lab-report-void-shaman.md` | All | §XXI full implementation record |
| `lab-report-ng-plus-remembrance.md` | §II.D | `entry42Written` origin — required for §XVII gate |
| `lab-report-tilbury-visby-arcs.md` | §II.C | `vsShamanKnown` origin — §XX prerequisite for §XXI |
