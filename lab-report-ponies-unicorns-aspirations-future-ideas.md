# Lab Report — Ponies, Unicorns, and Aspirations: Future Ideas Beyond the Current Build
### Post-Game Aspirations and Companion Product Concepts for roll2hit.com
**Date:** 2026-05-24  
**Status:** 💭 ASPIRATIONAL — not a plan.md section; not a PLANNED layer; no HTML changes implied  
**Scope:** What this project could become after the current game is complete and polished  

---

## Abstract

This document captures aspirational ideas that sit outside the current implementation queue. Nothing here is PLANNED in the plan.md sense — there is no Layer number, no insertion spec, no state flags. These are "what if the game is complete and we want to go further" ideas: companion publications, tooling products, and interface concepts that would require significant work beyond `roll2hit-v3.html`. They are recorded here so they are not lost, not so they are acted on immediately.

The four major concepts explored are: (1) a **Dungeon Master's Companion Guide** — a full spoiler manual for GMs running roll2hit as a tabletop session; (2) a **Fishing Guide** — a standalone reference for the fishing system; (3) a **Mission Explorer** — a CRUD-style read interface for exploring mission arcs, monster data, and NPC dispositions with full debug metadata; and (4) a **Polyphonic Pipe Organ Synthesizer** — real-time background music computed from 72 sine wave oscillators (12-note polyphony × 6 harmonics per note), driven by MIDI or a JSON tablature sequencer, delivered as a standalone `roll2hit-organ.html` with no samples and no audio files. The Mission Explorer and Organ Synthesizer are the most technically concrete and each has a clear standalone implementation path.

---

## I. The Dungeon Master's Companion Guide

### A. The Concept

roll2hit runs as a solo player experience. But the world — 76 nodes, 8 acts, 6 named NPCs, 370 monsters, 41 Froberger journal entries, 7 Codex Shards, faction politics, Curse of Knowledge scoring — is rich enough to support a tabletop session where a human Dungeon Master runs it for a group of players. The game's HTML file is the adventure module. The DM's Guide is the thing that tells the DM what everything means.

A full DM's Guide would be 80–120 pages and would include:

### B. Contents

**Part I — The World Before the Players Arrive**
- The 49-day countdown explained (what happens each day mechanically; what the Void Tide represents narratively)
- Act-by-act world summary: what is true, what is changing, what the factions are doing off-screen
- The Froberger backstory told plainly (not through journal entries)
- The Scholar Kings' history — the First Researcher, the Warden, the suppression policy — told as a narrative, not as fragments

**Part II — NPC Profiles (Full Spoilers)**
One page per named NPC. For each:

| Field | Content |
|-------|---------|
| Name and node | Location, act range |
| Public face | What they say and present to any player |
| Hidden truth | What they know that the player doesn't (yet) |
| Agenda | What they want to happen in the world |
| Favorability gates | Exactly what triggers Impartial → Friendly → Dear Friend |
| All 20 dialogue quotes | Verbatim, by state, with DM context for each |
| Froberger connection | What this NPC knew about Froberger |
| Quest chain | Full beat-by-beat, with alternative paths noted |
| DM improvisation notes | How to handle off-script player actions; what this NPC would and wouldn't do |

This section covers: Yael, Brynn, Quill, Pachelbel, Weckmann, Auros, Sweelinck, Muffat, Mordus, Draketide, Izador, Leeuwenhoek, Rennau (§XIX), Vonn (§XIX), Solvak (§XX), Yva (§XX), Isolde Voss (§XVI), Benedikt Rasp (§XVI), Jimmy Two-Tails (§IX), and the Warden (§XXI).

**Part III — Monster Manual**
All 370 (or 372+) monsters, organized by terrain and tier. For each:
- Stat block (AC, HP, ATK, DMG, tier)
- Loot table (drop item, sell value)
- DM flavor text: what this creature is doing here; what it wants; how it fights
- Terrain notes: which WORLD_DB entries it appears in; what the encounter looks and feels like

**Part IV — Mission Architecture**
- All main-quest mission bits explained (the 12 `_missionComplete()` bits; what each one means narratively)
- All side quests (Q01–Q51) with DM context for why each quest exists in the world
- All Epic Battleground quests (Q52–Q71) with the full NPC profile, wound, opening, warning, negotiate, and return lines
- The Curse of Knowledge score formula explained plainly: what raises it, what lowers it, what the thresholds mean for each ending

**Part V — The Endings**
All four endings (plus the §XVII fifth ending addendum), with the specific score conditions that trigger each. What to say to the players after each ending. How to run NG+ in a tabletop context (the "everything is remembered" rule).

**Part VI — Dungeon Master Tooling**
- How to adjust monster difficulty (the AC/HP/ATK scaling principles)
- How to add a homebrew NPC using the existing NPC_DIALOGUES shape
- How to run a session without the computer (paper stat blocks, manual dice)
- The "Quest -1" invitation: what Level 21 means, and how a DM can write it

### C. Format

80–120 pages. Printed layout, or a long PDF. Designed to sit next to the laptop running the HTML file. Could also be a second HTML file (`roll2hit-gm-guide.html`) following the same "one file, no server" philosophy.

---

## II. The Fishing Guide

### A. The Concept

The fishing system — Yugurt Lake, the Fishing Rod, the 20-rank fish pool, the Hooked condition, the predator encounter mechanic — is complex enough to warrant its own standalone reference. The Fishing Overhaul (§XII, Layer 47 PLANNED) will add bait tiers, a tournament arc, and new predators. After implementation, a Fishing Guide would be the clean reference for all of it.

### B. Contents

**Section 1 — The Yugurt Lake System**
- How to reach Yugurt Lake (nodes YL, YC)
- What the Fishing Rod does mechanically
- The 2d20 roll table: what each bracket means (fish encounter vs. predator vs. nothing)
- The Hooked condition: how it applies, how it resolves

**Section 2 — The Fish Pool (Ranks 1–20)**
All 20 fish, organized by rank:
| Rank | Fish Name | HP | Description | Loot |
|------|-----------|----|-------------|------|
| 1 | ... | ... | ... | ... |
(all 20 entries, with the full descriptions added to monsters.md in SP2)

**Section 3 — Predator Encounters (§XII PLANNED)**
The BAIT_FISH_POOL apex predators: names, stats, bait requirements, loot drops. How bait tiers change the encounter odds. The predator attraction formula.

**Section 4 — The Tournament (§XII PLANNED)**
"Master of Yugurt" quest chain: the five tournament rounds, NPC judges, trophy items.

**Section 5 — Fishing as World Lore**
- The Fisherman NPC (no quest, no connection to the main arc — just a man who fishes)
- The connection between §XIX (Ori's ship and the ocean predator) and the lake system
- Why the Void Tide changes what lives in the water

### C. Format

20–30 pages. A standalone document, or a printable PDF. Could also be the in-game "Fishing Guide" item (a readable `type:'tome'` equivalent for the fishing arc — players find it in-game and can read the actual rules from it).

---

## III. The Mission Explorer — A GM Interface for roll2hit Data

### A. The Concept

The most technically ambitious idea. A read-only (or read-primary) interface for exploring everything in `roll2hit-v3.html` as structured data — not as gameplay, but as a database. The target user is a DM, a modder, or a curious developer who wants to understand the architecture without reading 14,377 lines of source.

The Mission Explorer is a second HTML file (`roll2hit-explorer.html`) that loads the same game constants and presents them through a detail-view browser.

### B. Interface Design — Views

**Monster Explorer**
A searchable table of all MONSTER_POOL entries. Click any monster to open a detail panel:

```
┌────────────────────────────────────────────────────────────────────┐
│  goblin_scout                                          [monster]   │
│  ─────────────────────────────────────────────────────────────────  │
│  Display name:    Goblin Scout                                      │
│  AC:              12          const MONSTER_POOL["goblin_scout"].ac │
│  HP:              8           .hp                                   │
│  ATK:             +3          .atk                                  │
│  Damage:          1d6+1       .die=6, .dieCount=1, .mod=1          │
│  Tier:            low         .tier                                 │
│  Icon:            👺          .icon                                 │
│  Key:             goblin_scout (string, index 0)                    │
│  Appears in:      alley, city_slums, goblin_cave (3 terrains)       │
│                   WORLD_DB["alley"].monsters[2]                     │
│                   WORLD_DB["city_slums"].monsters[0]                │
│                   WORLD_DB["goblin_cave"].monsters[1]               │
│  Drop:            Rusty Dagger (icon:🗡️, sell:5)                   │
│                   MONSTER_DROPS["goblin_scout"]                     │
│  XP value:        [calculated: floor(AC * HP * 0.1) = 9]           │
└────────────────────────────────────────────────────────────────────┘
```

Every field shows: the value, the JavaScript path to read it, the data type, and its position in any relevant array.

**Terrain Explorer**
A searchable table of all WORLD_DB entries (66 terrains). Click any terrain:

```
┌────────────────────────────────────────────────────────────────────┐
│  alley                                                 [terrain]   │
│  ─────────────────────────────────────────────────────────────────  │
│  Display name:    Alley                                             │
│  Key:             alley (string, WORLD_DB index 3)                  │
│  Monsters (7):    goblin_scout, street_rat, pickpocket, ...         │
│                   WORLD_DB["alley"].monsters[] — array[7]           │
│  Hunt weight:     HUNTING_GROUNDS["alley"] (if present)             │
│  Nodes using it:  SL, CQ (PLANNED), VS                              │
│                   NODE_MAP entries where terrain === "alley"        │
│  Epic:            false (.epic property)                            │
└────────────────────────────────────────────────────────────────────┘
```

**NPC Explorer**
All named NPCs — Birka Six, Epic NPCs, PLANNED NPCs. Detail view includes:

```
┌────────────────────────────────────────────────────────────────────┐
│  Yael Scheidemann                                       [npc]      │
│  ─────────────────────────────────────────────────────────────────  │
│  Node:            CI (City Intersection)                            │
│  State key:       yael (NPC_DIALOGUES["yael"])                      │
│  Favorability:    S_story.fav_yael (int, 0–2)                       │
│  worldTruth:      "Every riot that gets suppressed becomes three..."│
│  enemy:           "Commissioners who scrub evidence of unrest."     │
│  missionBit:      yaelEscortUsed (boolean)                          │
│  Quotes — impartial (5):  [expandable list]                         │
│  Quotes — questActive (5): [expandable list]                        │
│  Quotes — friendly (5):   [expandable list]                         │
│  Quotes — dearFriend (5): [expandable list]                         │
│  Quest:           quest_yael_escort                                 │
│                   QUEST_DB["quest_yael_escort"]                     │
│  Froberger trace: NPC_CROSS_REFS["yael"] (3 lines)                  │
│  EB connection:   none (Birka NPC only)                             │
└────────────────────────────────────────────────────────────────────┘
```

**Quest Explorer**
All QUEST_DB entries + EB_NPC_DIALOGUE entries. Filter by: side quest / EB quest / PLANNED. Detail view:

```
┌────────────────────────────────────────────────────────────────────┐
│  quest_yael_escort                                     [quest]     │
│  ─────────────────────────────────────────────────────────────────  │
│  Key:             quest_yael_escort (QUEST_DB, index 0)             │
│  NPC:             Yael (CI node)                                    │
│  Trigger flag:    yaelEscortUsed (S_story.yaelEscortUsed)           │
│  Complete flag:   yaelEscortDone (S_story.yaelEscortDone)           │
│  Requirement:     3 SL vermin kills                                 │
│  Reward:          200gp + Yael Friendly                             │
│  Mission bit:     bit 1 of _missionComplete() (index 0)            │
│  Curse score:     +1 if complete AND Yael Dear Friend               │
│  Status:          ✅ implemented — HTML line ~8200                   │
└────────────────────────────────────────────────────────────────────┘
```

**Mission Arc Browser**
A high-level view of the full story arc — all 8 acts, all 76 nodes, plotted on the world grid. Click any node for its NODE_MAP entry displayed as a detail record. Shows: text, npc, loot, battle, connections, act number, terrain.

**State Flag Browser**
All 107 `_S_DEFAULTS()` fields listed with:
- Variable name and JavaScript path
- Data type (boolean / int / string / array)
- Default value
- Which quest/arc sets it
- Which render functions read it

### C. The "Debug Metadata" Requirement

The user's requirement: *"give all the debug information about the variable name, about the data type, about its index and position where we can reference it to change it."*

Every detail view in the Mission Explorer shows three things for every field:

1. **JavaScript reference path** — exactly how to read it in the browser console: `MONSTER_POOL["goblin_scout"].ac`
2. **Data type** — `string`, `number`, `boolean`, `array[N]`, `object`
3. **Position** — array index, object key, or line number reference in the HTML

This makes the Explorer useful for modders and developers, not just DMs. A developer can open the Explorer, find the monster they want to change, and get the exact path to edit in the HTML.

### D. The CRUD Question

The user asks about CRUD — the Explorer is primarily **Read**. Write operations (C, U, D) are intentionally excluded from the initial design because:
- The HTML is the source of truth; edits belong in the source file
- A write interface would need validation, undo, and conflict resolution
- Read-only is safe and useful; writable is risky and complex

However, **one write-adjacent feature** is worth considering: **Export as JSON**. From any Explorer view, the user can export the displayed data as a JSON object. This doesn't change the HTML — it lets a modder take the current state of MONSTER_POOL (or any const) as a JSON file, edit it externally, and then paste it back into the HTML. This is a middle path: not in-browser editing, but structured export that makes editing tractable.

### E. Technical Implementation

The Mission Explorer is a second HTML file. It uses the same `<script>` block from `roll2hit-v3.html` (the data constants only — not the game rendering functions). Implementation approach:

1. Extract all `const` declarations (MONSTER_POOL, WORLD_DB, NODE_MAP, QUEST_DB, etc.) into a shared `roll2hit-data.js` file
2. `roll2hit-v3.html` includes this script
3. `roll2hit-explorer.html` also includes this script, plus its own UI
4. The Explorer's UI is a single-page app with tabbed views (Monster / Terrain / NPC / Quest / Arc / State)

**Cost:** This requires refactoring `roll2hit-v3.html` to externalize the data constants — a significant change to the "one file" architecture. If the one-file constraint is a hard requirement, the Explorer can instead read the HTML file as text (via FileReader API if opened locally) and parse the constants from the raw source.

**Alternative:** A single-file Explorer that the user opens, then drags-and-drops `roll2hit-v3.html` onto. The FileReader API reads the dropped file, eval()s the constants (in a sandboxed context), and builds the Explorer views from the extracted data. This preserves the one-file architecture for the game while giving the Explorer its data source.

---

## IV. Priorities and Dependencies

These three products have different prerequisites:

| Product | Prerequisite | Effort |
|---------|-------------|--------|
| DM's Companion Guide | Game must be content-complete (all PLANNED layers implemented) | HIGH — 80–120 pages of writing |
| Fishing Guide | §XII (Fishing Overhaul) must be implemented | MEDIUM — 20–30 pages; mostly extracting existing data |
| Mission Explorer | Architectural decision on data externalization | HIGH — new HTML file + JS extraction logic |

None of these can be started in the current session. The DM's Guide requires a complete game. The Fishing Guide requires §XII. The Mission Explorer requires an architectural decision about the one-file constraint.

**Suggested sequencing:**
1. Finish implementing all current PLANNED layers (Layers 44–58)
2. Write the Fishing Guide (Layers 47 is the trigger)
3. Decide on Mission Explorer architecture (one-file vs. externalized data)
4. Write the DM's Companion Guide last — after everything else is stable

---

## V. The Fishing Guide as an In-Game Item

One elegant possibility: the Fishing Guide does not need to be a separate document. It can be the `Fishing Guide` item already in the game (a `type:'readable'` item available at the Yugurt Lake vendor). The player picks it up in-game and reads the actual mechanics from it.

This would mean the Fishing Guide is written as a readable item — in-world prose that describes the system the way a character in the world would explain it. The DM version (with debug metadata and exact roll tables) would be an appendix to the main DM's Guide.

---

---

## VI. Polyphonic Pipe Organ Synthesizer — Background Music via Sine Waves

### A. The Concept

A real-time polyphonic pipe organ synthesizer running entirely in the browser via the Web Audio API. No samples. No audio files. Pure mathematics: sine waves mixed in the proportions that a real pipe organ produces, driven by a sequencer that reads a note file and plays it like a player piano — in the background, as the game is played.

**Why an organ?** Pipe organs are the ideal instrument to simulate with sine waves because their harmonic structure is precisely predictable. Each pipe produces a fundamental frequency plus a series of overtones that follow the harmonic series exactly. The timbre (the "color" of the organ's sound) comes from the relative volumes of those overtones — not from the complexity of the waveform itself. This means a convincing organ simulation requires no samples and no convolution: just oscillators, gain nodes, and a mixer.

**Why sine waves?** A sine wave is the fundamental unit of acoustic energy. Every sound — every instrument, every voice, every noise — can be expressed as a sum of sine waves at different frequencies and amplitudes (Fourier's theorem). For a pipe organ, the decomposition is not just theoretical: the instrument literally generates those sine wave components mechanically, one per pipe. Simulating it is reconstruction, not approximation.

---

### B. Harmonic Series — The Physics

When an organ pipe sounds a note at fundamental frequency *f*, it also generates overtones at integer multiples of *f*. The amplitude of each overtone decreases inversely with its order:

| Harmonic | Frequency | Amplitude (ratio) | Pipe organ stop analogy |
|----------|-----------|-------------------|------------------------|
| 1st (fundamental) | *f* | 1.000 | Principal 8' |
| 2nd | 2*f* (octave) | 0.500 | Principal 4' |
| 3rd | 3*f* (octave + fifth) | 0.333 | Quint 2⅔' |
| 4th | 4*f* (two octaves) | 0.250 | Principal 2' |
| 5th | 5*f* (two octaves + third) | 0.200 | Tierce 1⅗' |
| 6th | 6*f* (two octaves + fifth) | 0.167 | Larigot 1⅓' |

**For each note played:** create 6 oscillators (one per harmonic), each at frequency `n * f`, each with gain proportional to `1/n`. Sum through a master gain node. The result sounds like a principal organ stop.

**Polyphony:** 12 simultaneous notes × 6 harmonics each = **72 sine wave oscillators running simultaneously**. The Web Audio API handles this comfortably; modern browsers can sustain hundreds of concurrent oscillator nodes.

---

### C. Oscillator Architecture

```
For each active note N (up to 12 simultaneous):

  MIDI note → frequency f = 440 × 2^((note - 69) / 12)

  Oscillator 1 (fundamental):  freq = 1 × f,  gain = 1.000 × velocity × masterGain
  Oscillator 2 (2nd harmonic): freq = 2 × f,  gain = 0.500 × velocity × masterGain
  Oscillator 3 (3rd harmonic): freq = 3 × f,  gain = 0.333 × velocity × masterGain
  Oscillator 4 (4th harmonic): freq = 4 × f,  gain = 0.250 × velocity × masterGain
  Oscillator 5 (5th harmonic): freq = 5 × f,  gain = 0.200 × velocity × masterGain
  Oscillator 6 (6th harmonic): freq = 6 × f,  gain = 0.167 × velocity × masterGain

  All 6 → GainNode(note) → masterGainNode → AudioContext.destination

Total: 12 × 6 = 72 oscillators + 12 note GainNodes + 1 masterGainNode
```

**Stop simulation:** Different organ stops emphasize different harmonics. The mixer for each harmonic order is a GainNode whose value can be changed in real time:

```
stopMixer = {
  h1: 1.000,  // fundamental weight — increase for flute; keep at 1.0 for principal
  h2: 0.500,  // 2nd harmonic — decrease for flute; increase for reed
  h3: 0.333,  // 3rd harmonic — decrease for flute; emphasized for string stops
  h4: 0.250,  // 4th harmonic
  h5: 0.200,  // 5th harmonic — emphasized for mixture stops (brightness)
  h6: 0.167   // 6th harmonic
}
```

This gives the player a virtual drawbar organ (similar to a Hammond B3 but simulating pipe organ stops rather than a tonewheeel organ). Six sliders — one per harmonic order — control the timbre in real time.

---

### D. Input Format — MIDI vs. Custom

**MIDI** is the standard and the right choice. Reasons:
- `navigator.requestMIDIAccess()` (Web MIDI API) gives browser access to hardware MIDI controllers
- MIDI files (`.mid`) are the universal format for pre-composed sequences
- MIDI note numbers map directly to frequencies via the standard formula
- Tempo, timing, and channel assignment are already handled by the MIDI spec

**MIDI channels for this implementation:**
- Channel 1: Manual I (right hand / melody)
- Channel 2: Manual II (left hand / harmony)
- Channel 3: Pedal (bass — lowest octave; only fundamentals + 2nd harmonic, no high partials)
- Channels 4–16: reserved for expansion or polyphonic aftertouch

**16th note resolution at tempo:** MIDI files carry their own tempo in BPM. The sequencer reads the MIDI file's timing track (division, tempo change events) and schedules Web Audio API events using `AudioContext.currentTime` with sub-millisecond precision. No approximation needed — Web Audio scheduling is sample-accurate.

**If not MIDI:** A simple JSON tablature format works for hand-authored sequences:

```json
{
  "bpm": 108,
  "resolution": 16,
  "events": [
    { "beat": 0,    "note": 67, "duration": 1, "velocity": 0.8, "ch": 1 },
    { "beat": 0.5,  "note": 67, "duration": 1, "velocity": 0.8, "ch": 1 },
    { "beat": 1.0,  "note": 67, "duration": 1, "velocity": 0.8, "ch": 1 },
    { "beat": 1.5,  "note": 63, "duration": 4, "velocity": 1.0, "ch": 1 }
  ]
}
```

`beat` is in 16th-note units. `duration` is in 16th-note units. This is readable by hand and parseable by a single JSON.parse().

---

### E. Beethoven's 5th — The Example Sequence

The opening of Beethoven's 5th Symphony (the *da da da DOMMM* motif) is ideal as a test sequence:
- Short, immediately recognizable
- Demonstrates polyphony: the held note overlaps with the repeat of the motif
- Loops naturally: after the second phrase ends, it returns to the first

**Pitches:**
- First phrase: G4 G4 G4 Eb4 (short short short long) — MIDI: 67 67 67 63
- Second phrase: F4 F4 F4 D4 (short short short long) — MIDI: 65 65 65 62
- At 108 BPM, "short" = eighth note = 277ms; "long" = half note = 1111ms

**JSON tablature (16th note units at 108 BPM):**

```json
{
  "title": "Beethoven Symphony No. 5, Op. 67 — Opening Motif",
  "bpm": 108,
  "resolution": 16,
  "loop": true,
  "events": [
    { "beat": 0,  "note": 67, "duration": 2, "velocity": 0.85, "ch": 1 },
    { "beat": 2,  "note": 67, "duration": 2, "velocity": 0.85, "ch": 1 },
    { "beat": 4,  "note": 67, "duration": 2, "velocity": 0.85, "ch": 1 },
    { "beat": 6,  "note": 63, "duration": 8, "velocity": 1.00, "ch": 1 },
    { "beat": 14, "note": 65, "duration": 2, "velocity": 0.85, "ch": 1 },
    { "beat": 16, "note": 65, "duration": 2, "velocity": 0.85, "ch": 1 },
    { "beat": 18, "note": 65, "duration": 2, "velocity": 0.85, "ch": 1 },
    { "beat": 20, "note": 62, "duration": 8, "velocity": 1.00, "ch": 1 }
  ]
}
```

**With overlap:** If the long note (Eb4, 8 beats = half note) is held for its full duration and the second phrase begins at beat 14 while beat 6's note is still sounding, 2 notes are active simultaneously. The loop then begins again while the D4 is still ringing — demonstrating the organ's natural voice overlap and why 12-note polyphony is the right target (a full Bach chorale can have 4 simultaneous parts, each sustained into the next beat, easily reaching 8 simultaneous notes when phrases overlap).

---

### F. Architecture Diagram

```
                          ┌─────────────────────────────────┐
  MIDI file / JSON ──────►│         Sequencer               │
  (or MIDI keyboard)      │   reads beats at AudioContext   │
                          │   .currentTime; schedules start │
                          │   and stop events per note      │
                          └──────────────┬──────────────────┘
                                         │ noteOn(midi, velocity, time)
                                         │ noteOff(midi, time)
                                         ▼
                          ┌─────────────────────────────────┐
                          │       Voice Pool (12 slots)     │
                          │                                 │
                          │  slot 0: note=67, active        │
                          │  slot 1: note=63, active        │
                          │  slot 2: idle                   │
                          │  ...                            │
                          └──────────────┬──────────────────┘
                                         │ per active slot:
                                         ▼
                   ┌─────────────────────────────────────────────┐
                   │            Voice (per note)                 │
                   │                                             │
                   │  f = 440 × 2^((note-69)/12)                 │
                   │                                             │
                   │  OscNode(1×f) → GainNode(1.000 × h1stop)   │
                   │  OscNode(2×f) → GainNode(0.500 × h2stop)   │  ─┐
                   │  OscNode(3×f) → GainNode(0.333 × h3stop)   │   │
                   │  OscNode(4×f) → GainNode(0.250 × h4stop)   │   │ all → NoteGain
                   │  OscNode(5×f) → GainNode(0.200 × h5stop)   │   │
                   │  OscNode(6×f) → GainNode(0.167 × h6stop)   │  ─┘
                   │                                             │
                   │  NoteGain.gain ramps: attack 10ms,          │
                   │  release 200ms on noteOff (pipe organ       │
                   │  has fast attack, slow release)             │
                   └──────────────────────┬──────────────────────┘
                                          │ × 12 voices
                                          ▼
                          ┌──────────────────────────┐
                          │      MasterGain           │
                          │   (overall volume knob)   │
                          └──────────────┬────────────┘
                                         │
                                         ▼
                              AudioContext.destination
                                  (speakers / headphones)
```

---

### G. Implementation Notes

**Envelope:** A pipe organ has essentially no attack time (the pipe speaks immediately) and a medium release (the air column decays over ~200ms when the key is released). In Web Audio API terms:

```js
noteGain.gain.setValueAtTime(0, startTime);
noteGain.gain.linearRampToValueAtTime(velocity, startTime + 0.010); // 10ms attack
// on noteOff:
noteGain.gain.setValueAtTime(noteGain.gain.value, stopTime);
noteGain.gain.linearRampToValueAtTime(0, stopTime + 0.200);         // 200ms release
osc.stop(stopTime + 0.201); // stop all 6 oscillators after release
```

**Voice stealing:** When all 12 voice slots are occupied and a new note arrives, steal the oldest active note. Log a warning if voice stealing occurs — it means the composition has more than 12 simultaneous notes and the polyphony target should be raised.

**Tuning:** Equal temperament by default (the standard formula). Add an option for meantone or Pythagorean temperament for historically-accurate organ simulation — these slightly alter the frequency of non-fundamental harmonics and produce the characteristic "beating" between intervals that period instruments have.

**File format recommendation:** Use the JSON tablature format for hand-authored game loops (background music); use the Web MIDI API for live keyboard input. Both paths feed the same `noteOn(midi, velocity, time)` and `noteOff(midi, time)` functions in the Voice Pool.

**Standalone file:** Deliver as `roll2hit-organ.html` — a single HTML file following the same "no server, no build" philosophy as the main game. The Beethoven motif JSON is embedded inline as a `const DEMO_SEQUENCE`. The player can open it, hear it, adjust the stop sliders, and optionally connect a MIDI keyboard.

---

### H. Polyphony Budget — Why 12?

| Use case | Notes needed simultaneously |
|----------|-----------------------------|
| Simple melody | 1 |
| Melody + bass | 2 |
| Three-voice Bach invention | 3 |
| Four-voice chorale | 4 |
| Chorale with sustained notes across bar lines | 6–8 |
| Full organ texture (chorale + counterpoint + pedal) | 8–12 |
| With overlapping phrase releases | up to 12 |

12 notes covers all practical organ repertoire, including dense Baroque polyphony. 72 oscillators is well within the Web Audio API's capacity. The main constraint is CPU — but on a modern laptop, 72 oscillator nodes running simultaneously takes approximately 2–5% of a single CPU core.

---

*Section VI added 2026-05-24 — Polyphonic Pipe Organ Synthesizer concept: 72-oscillator sine wave engine (12-note polyphony × 6 harmonics), Web Audio API implementation, MIDI and JSON tablature input, harmonic series mixer (stop simulation), Beethoven's 5th opening motif as demo sequence.*
