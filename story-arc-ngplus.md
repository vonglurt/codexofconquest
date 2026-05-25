# Story Arc — NG+ Remembrance (§XV)

**Source:** `lab-report-ng-plus-remembrance.md` · stubs in `story.md §XV`
**Lab Report:** `lab-report-ng-plus-remembrance.md`
**Sections:** `plan.md §XV` · Layer 50
**Intersection:** CI(01) · SQ(35) · CO(42) · all Dear Friend nodes (IN/TV/BA/CY)

> See `story-flowchart.md` for arc overlay. This arc is the structural prerequisite for §XVII (Void Archaeology): `entry42Written` must be true before `vaArchitectureKnown` can be set.

---

## Abstract

Layer 50 adds a remembrance system exclusive to NG+ runs. When a player carries at least three Dear Friends across the NG+ reset, three quests unlock: revisit each friend (quest_ng_01), write Entry 42 at CI (quest_ng_02), and find Froberger's sealed letter at CO (quest_ng_03). The arc's central mechanic — a freeform text entry at CI — makes the player a literal author in the world. Entry 42, written or left blank, becomes the fourth link in the chain Benedikt names in §XVII: Marta Eilene Vass built the cage, Froberger found the mechanism, the player closed it, and Entry 42 is the fourth author.

---

## I. Prerequisites

| Condition | Source | Notes |
|-----------|--------|-------|
| `ngPlusRun >= 1` | `storyNewGamePlus()` | Any NG+ run; resets most state |
| `priorQuestMinusOne == true` | Preserved from `questMinusOne` (§XIV) | Set when player reached Level 20 in a prior run |
| `npcFavorability[key] >= 2` × 3 NPCs | Preserved across NG+ reset | At least 3 Dear Friends carried over |
| `entry42Written == false` | `_S_DEFAULTS()` | Prevents modal from re-firing in same run |

**NG+ Preservation chain** (`storyNewGamePlus()`, line 8889–8910):

The following survive the NG+ reset:
- `npcFavorability` — all 6 NPC favorability levels
- `pitPerks` — pit training perks
- `ngPlusRun` — increments by 1
- `entry42Written`, `entry42Text` — player's written entry persists
- `priorQuestMinusOne` — captures `questMinusOne` before reset

Everything else resets via `_S_DEFAULTS()`.

---

## II. Quest Chain

### `quest_ng_01` — The Remembered Path
**Activation:** CI on first NG+ visit when prerequisites met.
**Objective:** Revisit 3 preserved Dear Friends.
**Tracking:** `S_story.ngMemoryDelivered[npcKey]` — fires when `ngPlusRun >= 1 && fav >= 2 && !ngMemoryDelivered[key]` on second visit to each NPC node (first visit delivers the NG+ greeting; second visit delivers the memory line).
**Completion:** `Object.keys(ngMemoryDelivered).length >= 3`
**Reward:** 500gp

### `quest_ng_02` — The Open Page
**Activation:** CI (alongside quest_ng_01) when `priorQuestMinusOne == true`.
**Objective:** Write Entry 42 at CI.
**Completion:** `entry42Written == true`
**Reward:** The act itself — no gold. Benedikt's synthesis in §XVII (`vaArchitectureKnown`) depends on this flag.

### `quest_ng_03` — The Letter
**Activation:** Auto-activates when `vaLastWardVisited == true` (§XVII progression).
**Objective:** Find Froberger's sealed letter at CO in NG+.
**Completion:** `frobergerLetterFound == true`
**Reward:** 300gp + letter in inventory

---

## III. The Entry 42 Modal (CI)

**Trigger condition** (line 14218–14221):
```js
if (node.code === 'CI' && (S_story.ngPlusRun || 0) >= 1
    && S_story.priorQuestMinusOne
    && !S_story.entry42Written
    && _lubeckFriends() >= 3)
```

The modal renders a `<textarea>` and two buttons:
- **"Write it."** — saves `S_story.entry42Text` from the textarea, sets `entry42Written = true`
- **"Leave it blank."** — saves `entry42Text = ""`, sets `entry42Written = true`

Either choice sets `entry42Written`. A blank entry is valid and accepted by the game. Benedikt's synthesis line in §XVII names Entry 42 regardless of content.

**Journal integration:** When `entry42Written`, the Froberger journal sidebar (`storyJournalToggle`) appends Entry 42 after entry 41. If blank: displayed as `[left blank]`. Sets `entry42Read = true` when opened.

---

## IV. NPC Memory Lines (`NPC_NG_MEMORY_LINES`)

One line per Dear Friend NPC. Fires once per run on second visit (after NG+ greeting). Tracked in `S_story.ngMemoryDelivered[key]`.

| NPC | Node | Memory theme |
|-----|------|-------------|
| `yael` | CI | What Yael remembers from the first run |
| `brynn` | IN | Brynn remembers the player's last night at the inn |
| `quill` | TV | Quill remembers the song they played |
| `pachelbel` | BA | Pachelbel remembers a specific transaction |
| `crov` (Weckmann) | CY | Weckmann remembers the pit fight that changed things |
| `auros` | CY | Bruhns remembers what the player brought back |

These lines are defined in `NPC_NG_MEMORY_LINES` const (line 11846). Each is a single sentence in the NPC's voice, specifically addressed to a returning player.

---

## V. Froberger's Sealed Letter (CO)

**Condition:** `node.code === 'CO' && S_story.ngPlusRun >= 1 && !S_story.frobergerLetterFound`

A button renders: `[Take the letter.]` — sets `frobergerLetterFound = true`, pushes a readable letter item to inventory.

The letter is Froberger's last entry — written to whoever completed the route he started. It is not Entry 42. It is the letter he wrote knowing someone else would have to finish what he began.

---

## VI. Structural Link to §XVII (Void Archaeology)

`entry42Written` is a hard prerequisite for `vaArchitectureKnown`:

```js
// quest_va_04 completion at SQ
if (S_story.vaLastWardVisited && S_story.entry42Written && !S_story.vaArchitectureKnown) {
    setTimeout(() => storyMsg(
        'Benedikt: "She built it. You closed it. Froberger found the mechanism. ' +
        'You followed him. Entry 42 is the fourth link. Four links is a chain. ' +
        'A chain holds. That is the only kind of answer this work produces — ' +
        'not a solution, a chain."'
    ), 700);
    S_story.vaArchitectureKnown = true;
}
```

A player who skips Entry 42 (possible even in NG+ if `priorQuestMinusOne` is false) cannot complete quest_va_04. Benedikt does not speak. The four-author chain has only three links. The arc is structurally incomplete — intentionally: the player who did not write Entry 42 is not yet one of the authors.

**Fifth ending dependency:** `vaArchitectureKnown && entry42Written && ngPlusRun >= 1` → Sweelinck asks *"What was inside the cage?"* at CO victory screen. This question has no in-game answer. It is Sweelinck's acknowledgment.

---

## VII. State Flags

| Flag | Type | Default | Set when |
|------|------|---------|---------|
| `ngPlusRun` | number | 0 | Increments at `storyNewGamePlus()` |
| `priorQuestMinusOne` | boolean | false | Preserved from `questMinusOne` at NG+ reset |
| `entry42Written` | boolean | false | Either button in Entry 42 modal pressed |
| `entry42Text` | string | `""` | Player's written text (or empty) |
| `entry42Read` | boolean | false | Journal sidebar opened with Entry 42 visible |
| `ngMemoryDelivered` | object | `{}` | `{npcKey: true}` per delivered memory line |
| `frobergerLetterFound` | boolean | false | Letter taken at CO in NG+ |

---

## VIII. Intersection Points

| Node | What happens here |
|------|------------------|
| **CI(01)** | Entry 42 modal (§XV) · Investigation mark vaCI (§XVII) · Yael NPC arc |
| **IN(02)** | Brynn NPC memory (§XV) · Brynn farewell §XXXV |
| **TV(03)** | Quill NPC memory (§XV) |
| **BA(04)** | Pachelbel NPC memory (§XV) |
| **CY(06)** | Weckmann + Auros NPC memories (§XV) |
| **SQ(35)** | Benedikt synthesis → vaArchitectureKnown (§XV gate for §XVII) · §XVI Scholar Gate · §XXI Warden callback |
| **CO(42)** | Froberger's sealed letter (§XV) · Quest -1 trigger §XIV · Fifth ending if vaArchitectureKnown |

---

## IX. File References

| File | Location | Content |
|------|----------|---------|
| `roll2hit-v3.html` | Line 14218–14221 | Entry 42 modal gate condition |
| `roll2hit-v3.html` | Line 11846 | `NPC_NG_MEMORY_LINES` const |
| `roll2hit-v3.html` | Lines 7960–8005 | quest_ng_01/02/03 QUEST_DB entries |
| `roll2hit-v3.html` | Lines 8424–8426 | NG+ state flags in `_S_DEFAULTS()` |
| `roll2hit-v3.html` | Lines 8889–8910 | `storyNewGamePlus()` preservation chain |
| `lab-report-ng-plus-remembrance.md` | Full document | Layer 50 IEEE post-mortem |
| `story-arc-investigation.md` | §II | §XVII prerequisite: `entry42Written` → `vaArchitectureKnown` |
| `story-flowchart.md` | NG+ arc overlay | CI · SQ · CO nodes in arc context |
