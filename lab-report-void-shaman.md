# Lab Report — Layer 56: The Void Shaman "The Warden"

**IEEE-Format Post-Mortem**  
**Date:** 2026-05-25  
**Layer:** 56  
**Section:** §XXI  
**Status:** ✅ Implemented  
**Codebase:** `roll2hit-v3.html` — single-file browser RPG

---

## Abstract

This report documents the design intent, implementation architecture, and dual-resolution mechanic of Layer 56 — The Void Shaman, subtitled "The Warden." The arc activates at the MT (Mountain Pass) node when `vsShamanKnown` and `vaLastWardVisited` are both true — requiring completion of §XX (Visby Underground) and §XVII (Void Archaeology) as prerequisites. At MT, the player finds the Warden: a figure who has spent eleven years executing a corrupted mandate, believing they are working to re-open the Antecedent's cage. The arc offers two resolution paths — show the Warden the Constructor's Log (persuasion, +600gp) or fight (`void_shaman` monster, combat path). Both paths set `wardensLegacyKnown` and complete `quest_vs_warden`. The Warden's corruption was not malice but a transcription error: the seventeenth copy of the original mandate contains a verb-tense change that inverted the original instruction.

---

## I. Design Intent

### A. The Corrupted Mandate Premise

The First Researcher planted a guardian at the MT tunnel before sealing it. Her instruction was: *open the tunnel to close the cage — when the sealing mechanism activates, confirm it and stand down.* This instruction was copied by hand through seventeen generations of goblin shamanic tradition. The seventeenth copy contains a small error in the verb tense: the sentence now reads *open the cage.* A pronoun shift in an oral tradition reinterpreted 200 years later.

The Warden has been executing the corrupted mandate faithfully. For eleven years, working from the goblin warrens (GC), they have been trying to find a way to re-open the Antecedent's containment — the same containment the player activated at the Defiant Fields. The Warden armed the Hollow Hands sub-clan as a resource pool. The Warden convinced the sub-clan the weapons were tribute Mordus owed them. None of this was malice. It was misdirection so old the original direction was lost.

The design goal: an antagonist who is wrong, not evil. The persuasion path is not diplomacy — it is showing evidence. The Constructor's Log, Entry 2, contains the original sentence: *"The cage must be opened before it can be closed."* When the Warden reads this in context of Entry 7 (the sealing mechanism confirmed), they understand the inversion. The mission was completed 200 years before they were born.

### B. The Prerequisite Stack

§XXI sits at the convergence of two investigative lines:
- **§XX (Visby):** The Hollow Hands sub-clan → the weapons debt → Yva's testimony → `vsShamanKnown`
- **§XVII (Void Archaeology):** The MT tunnel sealed by the First Researcher → opened by the player → `vaLastWardVisited`

A player who completed §XX knows the Warden operates inside Mordus's territory. A player who completed §XVII has been inside the tunnel and seen the First Researcher's final notes. The encounter at MT synthesizes both investigation lines: the player arrives knowing who planted the guardian and knowing the Hollow Hands are the Warden's resource. The Warden is not surprised — they expected someone to come.

### C. Not the Same as Kazrath

The GC node has a separate Void-aligned presence: the epic battleground at EG houses Void High Shaman Kazrath — the primary villain of Act V's main quest arc. The Warden at MT is a distinct entity operating under a separate (and older) mandate. The two Void shamans are connected only thematically: both are figures whose relationship to the Void was established before the current crisis. Kazrath's motivations are aggressive; the Warden's are administrative. The game does not explicitly connect them — the Warden's token mentions the First Researcher's appointment, not Kazrath.

---

## II. Implementation Architecture

### A. Monster Definition

**Defined in `MONSTER_POOL` — line 4626:**

```js
void_shaman: { key:'void_shaman', name:'The Warden', ac:15, hp:65,
  atk:6, dmgDie:6, dmgCount:2, dmgFlat:4, tier:'rare' }
```

The monster's `name` is "The Warden" — not "Void Shaman" — so the battle overlay reads as a named encounter, not a generic type. Stats: AC 15, HP 65, 2d6+4 damage, tier:'rare'. Mechanically in line with a late-Act V boss encounter.

**Drop:** Scripted inline via combat outcome handler (line 10115) — not in the random drop table. On defeat, the Warden's Token is added programmatically:

```js
{ name:"The Warden's Token", icon:'🔑', type:'relic', sell:0,
  description:'Original Warden\'s seal, First Researcher\'s appointment.
  Recopied seventeen times. The seventeenth copy has a small error in the
  verb tense that changed everything.' }
```

The item description carries the entire explanation of the arc's premise in one sentence.

### B. Gate Condition and `vshamanFound`

**Condition at MT (line 14612):**
```js
if (node.code === 'MT' && S_story.vsShamanKnown
    && S_story.vaLastWardVisited && !S_story.wardensLegacyKnown)
```

On first qualifying MT visit, `vshamanFound = true` and `quest_vs_warden` activates (line 14613–14615). The Warden's introductory storyMsg fires:
> *"You came to stop me. Or to understand. Either is fine. I have been working for eleven years to do the right thing. I may be wrong about what the right thing is."*

This line is the Warden's character in full. It establishes that they are not surprised, not hostile, and genuinely uncertain about their own mission — before the player makes any choice.

### C. Dual Resolution Paths

A button group renders with up to two options (line 14619):

#### Path 1 — Persuasion (Constructor's Log)

**Condition:** `_hasLog = (S_story.inventory || []).some(i => i.name === "The Constructor's Log")`

Button: `📜 Show them the Constructor's Log.`

The Warden reads Entry 2: *"The cage must be opened before it can be closed."* They read Entry 7: *"If someone is reading this, the sealing mechanism has activated. The cage is closed."* Their response (rendered as storyMsg, line 14627):

> *"The cage is closed. It was closed 200 years ago. I have been eleven years trying to re-open it."*
> *"Tell the clan the mission is complete. That is the truth — the mandate was fulfilled 200 years before I was born. This is — this is fine. I can stop."*

**State changes:** `vsShamanPersuaded = true, wardensLegacyKnown = true`  
**Reward:** +600gp, Warden's Token added to inventory  
**Sub-clan outcome:** *"The sub-clan walked back in. All of them. Mordus didn't ask what changed. He logged them as returned."*

The Log button only renders if the Constructor's Log is in inventory. A player who completed §XVII but sold or consumed the Log cannot use this path. (The Log has `sell:0` — it cannot be sold — but the check is still item-presence based.)

#### Path 2 — Combat

Button: `⚔️ Fight the Warden.`

Triggers `storyPreBattle` with a synthetic node entry:
```js
{ ...node, code:'MT_WARDEN', battle:{ label:'The Warden', key:'void_shaman', count:1 } }
```

Using `code:'MT_WARDEN'` (not `'MT'`) prevents the combat result from being stored under the actual MT node code, preserving the MT node's normal state. On victory (line 10111–10122), `vshamanDefeated = true, wardensLegacyKnown = true`, Warden's Token added.

The Warden's post-defeat line (rendered in combat victory handler):
> *"If I'm wrong, then I needed to be stopped. That's — that's actually fine."*

They pass the token without being asked. The sub-clan scatters rather than returning to Mordus — the combat path disperses the Hollow Hands instead of reintegrating them.

### D. State Flags

**Defined in `_S_DEFAULTS()` — lines 8439–8441:**

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `vshamanFound` | boolean | `false` | Warden's intro text fired; quest_vs_warden activated |
| `vshamanDefeated` | boolean | `false` | Combat path taken and Warden defeated |
| `vsShamanPersuaded` | boolean | `false` | Persuasion path taken — Constructor's Log shown |
| `wardensLegacyKnown` | boolean | `false` | Arc complete (either path); completes quest_vs_warden |
| `vsShamanBenediktDelivered` | boolean | `false` | Benedikt's callback at SQ fired (one per run) |

`vshamanDefeated` and `vsShamanPersuaded` are mutually exclusive — only one path can be taken. Both set `wardensLegacyKnown`.

### E. Quest Definition

**`quest_vs_warden` — line 8070:**

```js
quest_vs_warden: { id:'quest_vs_warden', type:'side', title:'The Warden',
  desc:'You have found the Void Shaman — the Antecedent\'s Last Warden,
    200 years misdirected. The mandate was corrupted in transmission.
    The question is whether they can be shown this.',
  hint:'Enter the MT tunnel and confront the Warden.
    Bring the Constructor\'s Log if you have it.',
  completeFn:() => !!(S_story.wardensLegacyKnown),
  disposition:'"If I\'m wrong, then I needed to be stopped.
    That\'s — that\'s actually fine." — The Warden' }
```

The hint explicitly directs the player to bring the Constructor's Log — making the persuasion path legible before the encounter. A player reading the quest card knows there is an item-based alternative to combat.

### F. Benedikt Callback (lines 14723–14729)

When `vsShamanPersuaded && _npcFavor('benedikt_rasp') >= 2 && !vsShamanBenediktDelivered`, visiting SQ triggers a delayed Benedikt message:

> *"You found the Warden. She planted them, didn't she — the First Researcher. She planted a guardian at the tunnel and didn't write it down anywhere official. I didn't know the chain went that far. Neither did she, I think — she thought she was planting a safeguard. She planted a 200-year misunderstanding. The difference between those things might be very small."*

**Conditions:** Only fires on the persuasion path (`vsShamanPersuaded`). Requires Benedikt at Dear Friend (fav ≥ 2, i.e., quest_wm_03 completed). Fires once per run (`vsShamanBenediktDelivered`).

This callback is the arc's intellectual close: Benedikt names the difference between a safeguard and a misunderstanding, and acknowledges the First Researcher may not have known which one she was building. It places the Warden's corruption in the context of the §XVI/§XVII investigation rather than treating it as a combat resolution.

### G. Ambient Cross-References

The Warden's resolution propagates to several passive systems:

- **News item** (line 11313): `warden_resolved` → *"Travelers on the northern road say the MT pass is open for the first time in forty years."* — appears in ambient news without attribution
- **Shard Note #5** (line 11709): `wardensLegacyKnown` addText → *"Placed by the first Warden, on the First Researcher's instruction. The chain goes back this far."*
- **Inn Dream** (line 11684): `vaArchitectureKnown` (which requires `wardensLegacyKnown` to precede it in the quest chain) adds a dream variant at SQ
- **Froberger Entry 26** (line 11742): Written before Layer 56 was implemented, this GC journal entry reads like the Warden's perspective from the outside — *"The data was on page seven. I wish I had taken longer with the first read."*

---

## III. Design Decisions and Trade-offs

### A. Persuasion Requires the Item, Not Skill

The persuasion path is gated by Constructor's Log presence, not by a favorability check or dialogue skill. This was intentional: the Warden cannot be talked out of their mandate by social skill — they are not being obstinate, they simply lack the evidence. The Log is the evidence. A player without the Log fights because they have no other argument to make, not because they failed a persuasion roll.

### B. Combat Path Is Honorable, Not Wrong

The Warden's post-combat line — *"If I'm wrong, then I needed to be stopped. That's — that's actually fine."* — makes the combat resolution equally valid. The Warden knew they might be stopped. They were not prepared to stop on their own without proof. Fighting them is a legitimate answer to "I cannot prove you're wrong, but you need to stop." The sub-clan scatters rather than returns — this is the combat path's downstream consequence, not its punishment.

### C. `MT_WARDEN` as Synthetic Node Code

The combat trigger uses `code:'MT_WARDEN'` to prevent the battle result from being stored in `S_story.defeatedBattles['MT']`. MT is a real node the player will visit again (for §XVII, §XXI, and §XXI's Benedikt callback). Corrupting the MT node's battle state would break future renders. The synthetic code is consumed by the combat system but never written to a real node entry.

### D. Benedikt Callback Persuasion-Only

The Benedikt callback fires only on `vsShamanPersuaded`. A player who fought the Warden does not get Benedikt's synthesis. This is a soft reward for the investigation path: Benedikt can comment on the Warden's story because the persuasion path left the Warden able to explain themselves. The combat path leaves no one to explain anything — the Warden is defeated, the sub-clan has scattered, and Benedikt doesn't know what happened.

---

## IV. Post-Mortem Notes

### What Worked

- The Warden's opening line — *"You came to stop me. Or to understand. Either is fine."* — immediately signals that combat is not the only option without making combat feel wrong. The Warden does not plead; they acknowledge the situation and wait.
- The verb-tense explanation embedded in the Warden's Token description is the correct resolution for players who take the combat path and never read the Log. They receive the artifact whose description contains the entire explanation. A player who reads inventory items gets the arc's premise even from the combat path.
- The `MT_WARDEN` synthetic node code is architecturally clean — it allows the combat system to operate normally without contaminating the MT node state.

### What Could Be Better

- The news item (`warden_resolved`) fires generically without distinguishing persuasion from combat outcomes. *"The MT pass is open for the first time in forty years"* is true either way, but the persuasion path ending — the sub-clan walking back in to Mordus — is a more interesting outcome that doesn't get ambient acknowledgment beyond the inline storyMsg.
- The Constructor's Log check uses exact name matching (`i.name === "The Constructor's Log"`). If the item name were ever changed elsewhere, the persuasion path would silently break. A type+key check would be more robust.
- `vshamanFound` sets the Warden's intro message and activates the quest, but if the player navigates away from MT and returns, the intro message does not re-fire. A player who accidentally closes the node render before reading the intro will see only the button group on subsequent visits.
- The Benedikt callback requires fav ≥ 2 (Dear Friend), which requires completing quest_wm_03. A player who completed the Visby arc without completing the Weimar reading circle will miss the callback despite having all other prerequisites. There is no indicator that the callback is available or missed.

---

## V. File References

| File | Location | Content |
|------|----------|---------|
| `roll2hit-v3.html` | Line 4626 | `void_shaman` monster definition — named "The Warden" |
| `roll2hit-v3.html` | Lines 8069–8075 | `quest_vs_warden` QUEST_DB entry |
| `roll2hit-v3.html` | Lines 8439–8441 | Void Shaman state flags in `_S_DEFAULTS()` |
| `roll2hit-v3.html` | Lines 10111–10122 | Combat outcome handler — vshamanDefeated + wardensLegacyKnown |
| `roll2hit-v3.html` | Lines 14611–14650 | §XXI render block — gate, vshamanFound, dual path buttons |
| `roll2hit-v3.html` | Lines 14621–14638 | Persuasion path — Constructor's Log read, vsShamanPersuaded |
| `roll2hit-v3.html` | Lines 14641–14648 | Combat path — MT_WARDEN synthetic node trigger |
| `roll2hit-v3.html` | Lines 14723–14729 | Benedikt callback at SQ — vsShamanPersuaded + fav≥2 |
| `roll2hit-v3.html` | Line 11313 | `warden_resolved` ambient news item |
| `roll2hit-v3.html` | Line 11709 | Shard Note #5 wardensLegacyKnown addText |
| `plan.md` | §XXI | Original design directive |
| `lab-report-tilbury-visby-arcs.md` | §II.C | `vsShamanKnown` origin — §XX prerequisite |
| `lab-report-void-archaeology.md` | §II.E | `vaLastWardVisited` origin — §XVII prerequisite |
| `lab-report-weimar-scholar-gate.md` | §II.D | Constructor's Log — §XVI archive source |
