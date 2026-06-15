<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
## I. Directive

> You are an expert prompt interpreter with an electrical engineering / computer science background. Follow the sections below: use the suggestions in II, III, IV to implement ideas from the list, or append new ideas to the end of the list when told about them. Work incrementally — present one step at a time and wait for "continue."

### API-First Development Policy

**Preferred workflow for any data addition or edit to `roll2hit-v3.html`:**

1. **Check API first** — before editing HTML, use `./api.sh` to confirm current state: `./api.sh ping`, `./api.sh list <type>`, `./api.sh audit`. Direct HTML edits are a fallback only when the API cannot yet express the operation.
2. **Write the API method first** — if the operation isn't yet supported, add the endpoint to `wbapi-server.js` and restart before touching the HTML.
3. **Create/modify via API, not HTML** — preferred: `./api.sh post <type> [k=v ...]` or `./api.sh put <type> <id> [k=v ...]`. The tool handles nonces automatically and queues all requests with retry.
4. **Restart server after adding endpoints** — `./wbapi-toggle.sh restart` (or `start` if stopped).
5. **When adding items to plan.md** — cross-reference current state with `./api.sh audit` and `./api.sh list <type>` to confirm what actually exists vs. what the plan assumes. Do not add a plan item without verifying the API-reported current state.

**CLI quick reference (`./api.sh`):**
```bash
./api.sh ping                              # health check
./api.sh get node LHR                      # fetch node + connections + _meta
./api.sh list quest --node LHR             # quests at a node
./api.sh list npc --node LHR               # NPCs at a node
./api.sh list monster --terrain city       # monsters by terrain
./api.sh put quest quest_wis_01 passText="..." # update field
./api.sh post quest id=q_foo npc=aldric type=side activateNode=CY title="..." # create
./api.sh del quest quest_old_01            # delete (nonce auto-handled)
./api.sh audit                             # full integrity scan
./api.sh chain quest_wis_01               # quest dependency chain
./api.sh export quest_db --out quests.json # dump collection to file
./api.sh location CY                       # composite node view
./api.sh --ai "how do I link two nodes?"  # ask Claude (ANTHROPIC_API_KEY)
```

**Goal state:** All large JS arrays in `roll2hit-v3.html` (`NODE_MAP`, `QUEST_DB`, `WORLD_DB`, `MONSTER_POOL`, `MONSTER_DROPS`, `FISH_POOL`, `LAKE_MAGIC_DB`, `CONDITION_ITEMS`, `EPIC_BOSS_POOL`, etc.) are exportable via the API. The HTML file is the single source of truth — it should be possible to run all game logic on Node/V8 by feeding API-extracted code sections, without a browser. See `§WBAPI-01` for the export roadmap.

`roll2hit-v3.html` is the single source of truth. The API reads its text directly and writes mutations back into it in-place. The entire game — all data, all logic, all UI — is fully playable in a browser with only `roll2hit-v3.html`: no Node, no `worldbuilder.html`, no server, no dependencies. The HTML is pure JavaScript running on the DOM. `wbapi-server.js` and `worldbuilder.html` are authoring tools that read and write the same file; they add nothing the game requires at runtime.

### Cell-First Navigation Policy

**Cell = Location.** All map locations are identified by `(r, c)` cell coordinates. The two-letter node code is a lookup alias for a named cell, not a location pointer. Use `CELL_GRID["r,c"]` to resolve coordinates to node codes. Do not navigate by chasing `N/E/S/W` pointer fields — those were stripped in §CELL-01. When writing new features:

- Positions travel as `{ r, c }` pairs.
- Node codes are resolved from position: `CELL_GRID[\`${r},${c}\`]`.
- "Adjacent" means `(r±1, c)` or `(r, c±1)` — not stored edge links.
- Quest activation checks: `CELL_GRID[\`${s.r},${s.c}\`] === quest.activateNode`.

### Incremental Recitation Rule

While writing vignette content, speak short segments aloud via `say` as you produce them — every page or every couple of paragraphs. Read the element type first, then its text. Examples:

Run `say` blocking (no `&`) so each announcement completes before writing continues:

```bash
say "Source hook. King John the Second of France was captured at Poitiers in 1356." &
say "Scene, Act One. A narrow Damascus house, morning. The library is being catalogued for dissolution." &
say "Quest message. Carry the installment certificate from Périgueux to the Bordeaux English Registry." &
say "Pass text. The temporal independence of the two documents makes their agreement evidential." &
say "Fail text. The certificate and the entry match. That is necessary but not sufficient." &
say "Archive category. Confiscation Records — Property Inventories Compiled After Political Purges." &
```

Write to file incrementally — after each act, save and run the next `say` call. Do not write all five acts before speaking. After every full vignette, commit and speak the commit subject.

---

### Loop vs. Ask Rule

Before starting any task:

- **Loop tasks** (no user input needed — clear next step): begin immediately, state what you are doing in one sentence.
- **Ask tasks** (user decision required): present a yes/no or choice prompt. Then run:
  ```bash
  say "If you say yes: <one sentence describing the intention and outcome of yes>"
  ```
  Read the purpose of yes aloud before the user answers.

---

### Commit + Speak Rule

After every git commit, immediately run:

```bash
say "<commit subject line>"
```

Read the **subject line only** (first line of the commit message) aloud via macOS `say`. This confirms the commit completed and anchors the session.

---

### Lab Report Policy

Write a new `lab-report-<title>.md` when any of the following is true:

| Trigger | Examples |
|---------|---------|
| Major collection added or redesigned | New monster group, terrain cluster, NPC faction, item economy |
| Large redesign touching multiple systems | Weapon drop overhaul, Luck Stat, fishing bait sub-system |
| New narrative theme or arc | New quest chain spanning 3+ nodes, new named faction, new NPC arc |
| Design review before implementation | IEEE-format spec locking data shapes and flow before any HTML edit |
| Session postmortem with non-obvious decisions | Choices that won't be recoverable from code or core docs alone |

Do **not** write a lab report for: a single monster/quest addition (sync core docs instead), a value correction (add an implementation note to the existing report), or small additions that fit cleanly in an existing doc section.


## II + III. Design Constants & State Fields

> **Moved to `index.md`** — see "Design Constants Quick Reference" and "State Fields Quick Reference (S_story)" sections there. Updated 2026-06-14 to reflect §CELL-01–§CELL-12.
---

## V. Suggestions for Further Development

> FC01–FC08 all ✅ 2026-05-25/26. Full record in `lab-report-sp4-documentation-sync-pass.md`. Add new FC items here as §XLIII+ work is planned.

---

> §API-01 + §API-02 extracted to `lab-report-api-01-02-mechanics-combat-review.md` (2026-05-26).

---

## §FUTURE — Long-Range Ideas (not scheduled)

> Speculative world expansions. No implementation layer assigned. Record the concept and canonical source material while the idea is fresh.

---

## §WORLDBUILDER-01 — The World Builder Editor (📋 PLANNED)

**What it is:** A browser-based CRUD editor for the game's node architecture. The game world currently lives as a JavaScript object (`NODE_MAP`) with ~150 nodes, each having coordinates, exits, NPC, battle, loot, and sleep fields. Editing requires reading raw JS. The World Builder makes this visual and interactive.

**Why now:** The world has reached a scale where new arcs require cross-referencing 6–8 nodes at a time to check exit availability, coordinate positions, and verify that new nodes don't collide with existing ones. The grid is large enough that a visual overview is no longer optional — it is necessary for safe world expansion.

---

### §WORLDBUILDER-01-A. The Three Views

**1. Grid View (World Map)**  
A 2D rendered grid of all nodes at their `{r, c}` coordinates. Each cell shows the node code, label abbreviation, and act number (color-coded by act). Exits rendered as directional arrows between cells. Clicking a node enters Detail View.

- Zoom in/out (the full grid spans ~50 rows × 60 columns)
- Filter by act (show only act 1, act 2, etc.)
- Highlight: orphan nodes (no exits), terminal nodes (one exit), hub nodes (4 exits)
- Empty cells are potential insertion points — clicking an empty cell opens a "New Node" form with coordinates pre-filled

**2. Detail View (Node Inspector)**  
Full debug readout for a selected node:

```
Node: [code]  Label: [label]  Act: [n]  Num: [n]
Coordinates: r:[n] c:[n]
Exits: N:[code or null]  S:[code or null]  E:[code or null]  W:[code or null]

NPC: [name]  quoteFn: [3-state / inline / none]
Battle: [label]  key:[key]  count:[n]
Loot: [items list]
Sleep: [true/false]

Attached Quests: [list of quest IDs where activateNode === this code]
Attached storyRender blocks: [list of block IDs]
Flags set by quests here: [list]
Flags read by quests here: [list]
```

All fields are editable in place. Changes tracked in a "pending edits" diff panel before export.

**3. Edit Mode (Node Form)**  
Full form UI for creating or editing a node:

| Field | Input type | Notes |
|-------|-----------|-------|
| code | text (4 chars) | Uniqueness check against existing codes |
| num | number | Auto-increments from current max |
| name | text | Internal key name |
| label | text | Display label |
| act | 1–8 select | |
| r, c | number | Validated against grid collision |
| N/S/E/W exits | node selector (dropdown of all existing codes) | Bidirectional update option: "also update target node's reverse exit" |
| text | textarea | The node's prose description |
| npc | text | NPC name |
| battle.label | text | |
| battle.key | dropdown of MONSTER_POOL keys | |
| battle.count | number | |
| loot | text | |
| sleep | checkbox | |

---

### §WORLDBUILDER-01-B. Quest Cross-Reference Panel

For any selected node, show a panel listing all quests where `activateNode === nodeCode`:

```
Quests active at this node:
  quest_hunt_01    [side]      activateCond: always       — "Missing Boats"
  quest_hunt_02    [skill WIS] activateCond: huntHookReceived  — "Hull Marks"
  quest_wis_04     [skill INT] activateCond: wisHookReceived   — "The Stalemate Cost"
```

Clicking a quest ID opens a quest detail panel (links to the Quest Editor, §EDITOR-01).

---

### §WORLDBUILDER-01-C. Export Format

The editor does not modify the live HTML file directly. It outputs a **diff block** showing:

1. The modified NODE_MAP entry as a valid JS object literal
2. Any exit updates to adjacent nodes (bidirectional changes)
3. A checklist of manual steps required (e.g., "Add storyRender block at HL for new arc")

Export format is JS-object-literal (not JSON) because the `quoteFn` and `completeFn` fields are functions. The editor generates template functions with placeholder bodies:

```javascript
quoteFn: () => S_story.newFlag ? 'Post-quest dialogue.' : 'Pre-quest dialogue.',
```

The user pastes the diff into the game file. A future version could write directly to the file via a local server endpoint.

---

### §WORLDBUILDER-01-D. Implementation Notes

- Runs as a standalone HTML file (`worldbuilder.html`) that imports a JSON snapshot of NODE_MAP (auto-generated at build time, or pasted manually)
- No server required — purely client-side JS + Canvas or CSS grid
- State: the editor's working copy of NODE_MAP is stored in localStorage; export clears the diff queue
- Responsive to the game's coordinate system (r/c grid, not pixel positions)
- Node text field supports multi-line editing with live character count

---

## §EDITOR-01 — The Quest Creator / Generic Mission Maker (📋 PLANNED)

**What it is:** A form-based UI for creating, editing, and cross-referencing quest objects of any type (`side`, `skill_check`). Outputs valid JS quest object literals ready to paste into `QUEST_DB`. Eliminates the need to hand-write the boilerplate for each quest while preserving full flexibility.

**Why now:** Six quest templates are proven (`§SPARK`, `§HUNT`, `§PORT`, `§WHODUNIT`, `§ALCHEMY`, `§WISDOM`). Each template has a predictable field set. The quest boilerplate is repetitive to write and error-prone (flag name typos, unmatched braces, missing `activateCond`). A form editor with type-aware field display reduces the error surface and makes new arc creation accessible without reading existing quest code.

---

### §EDITOR-01-A. Quest Type Field Sets

The editor shows different fields depending on the selected quest type:

**All quest types:**
| Field | Input | Notes |
|-------|-------|-------|
| id | text | Uniqueness check against QUEST_DB keys |
| type | select: side / skill_check | Determines which additional fields appear |
| title | text | |
| desc | textarea | Fragment texts, Roen commentary, etc. |
| hint | text | Quest panel hint line |
| activateNode | node selector | Dropdown of all NODE_MAP codes |
| activateCond | flag selector + operator | e.g., `flagA && flagB`; builds the function |
| waypointNode | node selector | |
| reward | number | Gold reward on complete |
| disposition | text | The closing quote line |

**Additional for `skill_check`:**
| Field | Input | Notes |
|-------|-------|-------|
| checkStat | select: wis / int / cha / str / dex / con | |
| checkSkill | select: Insight / Investigation / Nature / Persuasion / Perception / Medicine / Animal Handling | |
| checkDC | number | |
| retryable | checkbox | |
| checkPassFlag | flag selector | Must exist in `_S_DEFAULTS` or can create new |
| onPass body | textarea (JS) | Function body; editor wraps in `onPass:() => { ... }` |
| onFail body | textarea (JS) | |
| xpAward | number | 0 if XP awarded inside onPass |

**Additional for `side`:**
| Field | Input | Notes |
|-------|-------|-------|
| completeItems | item name list | Items that must be in inventory to complete |
| completeFn body | textarea (JS) | Function body |
| onComplete body | textarea (JS) | Optional |

---

### §EDITOR-01-B. Flag Dependency Graph

Every quest reads flags (in `activateCond`, `completeFn`) and writes flags (in `onPass`, `onComplete`, `checkPassFlag`). The editor maintains a live dependency map:

```
quest_wis_03
  READS:  wisHookReceived (set by quest_wis_00)
          sbResolved (set by quest_sb_01 / quest_sb_02 / quest_sb_fight)
  WRITES: wisPage3_thumbscrew
  DOWNSTREAM: quest_wis_07 reads wisPage3_thumbscrew
```

The flag graph surfaces:
- Circular dependencies (quest A waits for flag set by quest B waits for quest A)
- Orphan flags (set but never read)
- Missing flags (read but not set by any quest)

---

### §EDITOR-01-C. storyRender Block Generator

For each quest, the editor can generate a skeleton `storyRender` block:

```javascript
// §[ARC-ID]: [NODE] — [quest title]
{ const _[id]Old = document.getElementById('[id]'); if (_[id]Old) _[id]Old.remove();
  if (node.code === '[activateNode]' && S_story.[activateCond]) {
    const _div = document.createElement('div');
    _div.id = '[id]'; _div.className = 'sweelinck-variant';
    _div.style.cssText = 'margin-top:10px;border-left-color:#[color];color:#[color];font-size:12px;';
    _div.textContent = '[desc text here]';
    // [button if needed]
    document.getElementById('story-text-box').insertAdjacentElement('afterend', _div);
  }
}
```

The generator fills in the known fields and leaves `[desc text here]` as a placeholder. The user writes the narrative prose in the editor's textarea and it gets embedded.

---

### §EDITOR-01-D. Token Item Manager

For arcs with token objects (§SPARK, §ALCHEMY, §WISDOM pattern), a visual chain editor:

```
Token chain:
  [Item Name] [icon] [sell] → Created by: [quest_id onPass / storyRender button]
                            → Destroyed by: [quest_id / storyRender button]
  + Add token
```

The manager generates the `inv.push(...)` and `inv.splice(...)` code for each transition and embeds it in the appropriate quest callback bodies.

---

### §EDITOR-01-E. Export Format

Output is a single JS object literal block ready to paste into `QUEST_DB`:

```javascript
  quest_XXXX: { id:'quest_XXXX', type:'skill_check',
    title:'...',
    desc:'...',
    hint:'...',
    activateNode:'XX', activateCond:() => !!(S_story.flagA && S_story.flagB),
    checkStat:'wis', checkSkill:'Insight', checkDC:13, retryable:false,
    checkPassFlag:'flagC',
    onPass:() => {
      S_story.flagC = true;
      S_story.xp = (S_story.xp||0) + 250;
      storyMsg('...');
    },
    onFail:() => { storyMsg('...'); },
    xpAward:0,
    disposition:'...' },
```

The output window shows the complete object, validates brace matching, and highlights any unfilled placeholder fields in red before allowing copy.

---

### §EDITOR-01-F. Template Presets

One-click presets that pre-fill the field set for each proven template:

| Preset | Pre-fills |
|--------|-----------|
| §SPARK hook | type:side, disposition style, activateCond: always at node |
| §SPARK skill_check | WIS Animal Handling DC 11, token item fields, onPass creates item |
| §HUNT setup | type:side, wrong-theory disposition, storyRender skeleton |
| §HUNT investigation | INT Investigation DC 12, retryable:false, knowledge entry in onPass |
| §WHODUNIT drain | INT Investigation DC 12, storyMsg pattern |
| §ALCHEMY beat | type:side, wisdom beat desc pattern, +XP in completeFn |
| §WISDOM fragment | desc: Ardley-text + Roen-commentary pattern, knowledge entry onPass |

---

### §EDITOR-01-G. Implementation Notes

- Runs as a standalone HTML file (`questeditor.html`), no server required
- QUEST_DB imported as a JSON-serializable snapshot (functions serialized as template strings, deserialized on load)
- The function serialization problem: JS functions in `onPass`, `completeFn` etc. cannot be stored as JSON. The editor stores them as **template strings** with named slots (`{{flagName}}`, `{{xpAmount}}`, `{{itemName}}`), and generates the final JS function body at export time
- Side-by-side preview: left panel = editor form; right panel = rendered quest card as it would appear in the game's quest panel UI
- All flag names validated against a loaded snapshot of `_S_DEFAULTS()`

---

## §EDITOR-02 — Generic Quest Chain Inserter: Mission Builder (📋 PLANNED)

**Status:** 📋 PLANNED — written 2026-05-29  
**Reference:** `API-README.md §Use Case: Generic Mission Builder`

**What it is:** A repeatable API-driven workflow for inserting new quest arcs one mission at a time. Not a UI — a workflow pattern and a server-side extension that makes the pattern executable. The insight from the Paul arc implementation: every new arc is a sequence of these moves: check the node → add a state flag → verify the schema → POST the quest → GET it back → PUT any text corrections → check the chain → save. That sequence can be formalized.

**Why now:** Without a pattern, each arc requires re-learning the API from scratch. With a pattern, a new arc is a checklist. The Paul arc was the first arc implemented this way — 12 quests, 13 nodes, each verified individually before the next was added. The pattern worked. It should be the standard method.

---

### §EDITOR-02-A. The Seven-Step Arc Insertion Protocol

This is the canonical workflow for adding any quest chain via the API. It applies whether you are adding 2 quests or 20. The steps are invariant; the content changes.

```bash
# Step 0: confirm node exists and terrain is correct
./api.sh location {startNode}

# Step 1: register new flags in _S_DEFAULTS (manual, one-time edit in roll2hit-v3.html)

# Step 2: inspect quest schema before writing
./api.sh get quest --schema    # or: ./api.sh --ai "what fields does a quest need?"

# Step 3: create one quest (nonce auto-handled; NPC field required)
./api.sh post quest id=quest_{arc}_{nn} type=side npc={npc_key} activateNode={code} title="..."

# Step 4: verify quest is readable and all fields set
./api.sh get quest quest_{arc}_{nn}

# Step 5: patch text fields if needed
./api.sh put quest quest_{arc}_{nn} passText="..." failText="..."

# Step 6: repeat steps 3–5 for each quest in the chain

# Step 7: verify dependency graph is connected end-to-end
./api.sh chain quest_{arc}_{nn}

# Step 8: run audit — must be clean before save
./api.sh audit

# Step 9: commit to timestamped HTML
# (auto-save fires after each POST/PUT; explicit save via server restart or worldbuilder.html Save button)
```

**One session per arc.** All POSTs and PUTs in the chain must happen in a single server session before Step 8. Each `save()` produces a new timestamped file. The next session loads that timestamped file as `ROLL2HIT_FILE`.

---

### §EDITOR-02-B. Mission Type → Canonical Field Template

Every mission type has a minimum required field set. These are the templates. Copy, fill in the narrative fields (`desc`, `hint`, `vignetteText`, `passText`, `failText`, `disposition`), then POST.

**Template: `talk_chain` (NPC conversation, no roll)**
```json
{
  "id": "quest_{arc}_{nn}",
  "type": "side",
  "title": "...",
  "desc": "...",
  "hint": "...",
  "activateNode": "{nodeCode}",
  "activateCond": "{priorFlag}",
  "checkPassFlag": "{arcFlag}",
  "xpAward": 100,
  "reward": 0
}
```

**Template: `skill_check` (Fighter ability check)**
```json
{
  "id": "quest_{arc}_{nn}",
  "type": "skill_check",
  "title": "...",
  "desc": "...",
  "hint": "...",
  "activateNode": "{nodeCode}",
  "activateCond": "{priorFlag}",
  "checkAbility": "{str|dex|con|int|wis|cha}",
  "checkLabel": "{Skill name}",
  "checkDC": 12,
  "retryable": false,
  "xpAward": 150,
  "vignetteText": "...",
  "passText": "...",
  "failText": "...",
  "checkPassFlag": "{arcFlag}",
  "disposition": "..."
}
```

**Template: `hunt` (kill-count mission — uses `completeFn`)**
```json
{
  "id": "quest_{arc}_{nn}",
  "type": "side",
  "title": "...",
  "desc": "...",
  "hint": "Kill {N} × {monsterKey} at {nodeCode}.",
  "activateNode": "{nodeCode}",
  "activateCond": "{priorFlag}",
  "completeItems": [],
  "checkPassFlag": "{arcFlag}",
  "xpAward": 200,
  "reward": 0
}
```
*Note: `completeFn` (kill count check against S_story counter) cannot be posted via the API's current text fields — it requires a manual source edit for the JS closure. For kill-count quests, POST the non-function fields, then manually add the `completeFn` in the game file.*

**Template: `escort` (companion travel — no roll, completion at destination)**
```json
{
  "id": "quest_{arc}_{nn}",
  "type": "side",
  "title": "...",
  "desc": "...",
  "hint": "Reach {destinationNode} with {npcKey}.",
  "activateNode": "{startNode}",
  "waypointNode": "{destinationNode}",
  "activateCond": "{priorFlag}",
  "checkPassFlag": "{arcFlag}",
  "xpAward": 150,
  "reward": 0
}
```

**Template: `collect` (item delivery)**
```json
{
  "id": "quest_{arc}_{nn}",
  "type": "side",
  "title": "...",
  "desc": "...",
  "hint": "Bring {itemName} to {npcKey} at {nodeCode}.",
  "activateNode": "{nodeCode}",
  "waypointNode": "{deliveryNode}",
  "activateCond": "{priorFlag}",
  "completeItems": ["{itemName}"],
  "checkPassFlag": "{arcFlag}",
  "xpAward": 150,
  "reward": 0
}
```

---

### §EDITOR-02-C. Pre-flight Checklist (run before POST /api/save)

Before saving any quest chain, verify all three of these pass:

1. **All `activateCond` flags exist in `_S_DEFAULTS`:**
   - Check flags: `./api.sh export _s_defaults --raw` (or grep: `grep -o 'flagName: false' roll2hit-v3.html`)
   - Every flag referenced in `activateCond` must be listed there

2. **All `checkPassFlag` values are unique:**
   - `GET /api/quest/{flagName}` — if it returns a quest, that flag name is taken by another quest
   - Naming convention: `{arcPrefix}_{nodeCode}_{nn}` avoids collisions

3. **All `activateNode` and `waypointNode` values exist:**
   - `GET /api/node/{code}` for each node referenced in the chain

4. **Chain is connected:**
   - `GET /api/quest/{firstQuestId}/chain` — downstream array lists all expected quests

---

### §EDITOR-02-D. Needed API Extensions ✅ ALL COMPLETE

These additions to `wbapi-server.js` and `wbapi-core.js` are required to make §EDITOR-02 fully executable without manual file edits:

- [x] **`POST /api/quest`** — create a new quest object in QUEST_DB. *(✅ implemented — line 10882 wbapi-server.js)*

- [x] **`POST /api/node`** — create a new NODE_MAP entry. *(✅ implemented — same dispatch block)*

- [x] **`GET /api/quest/{id}/chain`** — expose the existing `WBAPI.quests.chain()` method as an HTTP endpoint. *(✅ implemented — line 11510 wbapi-server.js)*

- [x] **`GET /api/flags`** — list all flags currently in `_S_DEFAULTS`. *(✅ implemented — line 9779 wbapi-server.js)*

- [x] **`POST /api/flags`** — add a new flag to `_S_DEFAULTS` with a default value. *(✅ implemented as `POST /api/flags` — plural)*

- [x] **`GET /api/quest?node={code}`** — filter quests by `activateNode`. *(✅ implemented as `GET /api/list/quest?node=`)*

---

### §EDITOR-02-E. Worldbuilder UI Integration

Once §EDITOR-02-D extensions exist, the Mission Builder can be a tab in worldbuilder.html:

```
[ Mission Builder ]

Starting node:  [ KS — Damascus ▾ ]
Arc prefix:     [ paul_ ]

Mission 1:  [ talk_chain ▾ ]  Title: [ The House on the Lower Road ]  Flag: [ anathSightRestored ]
Mission 2:  [ skill_check ▾ ] Title: [ Over the Wall ]  Stat: [ STR ▾ ] DC: [ 12 ]  Flag: [ escapedDamascus ]
Mission 3:  [ skill_check ▾ ] Title: [ Vouched For ]    Stat: [ CHA ▾ ] DC: [ 11 ]  Flag: [ barnachVouchedHR ]

[ + Add Mission ]

[ Preview Chain ]   [ Validate ]   [ POST All ]   [ Save ]
```

**Preview Chain** renders the full quest sequence in order with flag dependency arrows.  
**Validate** runs the pre-flight checklist (§EDITOR-02-C) and shows pass/fail per check.  
**POST All** sends each quest in sequence, stopping if any POST fails.  
**Save** calls `POST /api/save` only if all POSTs succeeded.

---

## §ARCH-01 — Quest API Architecture & Universal Mission Format (📋 PLANNED — Next Implementation Phase)

**Lab Report:** `lab-report-quest-api-architecture.md`  
**Scope:** Unification of all quest types into Universal Quest Format (UQF v1.0); WBAPI runtime layer; live 5-phase migration

### Core Problem
QUEST_DB currently has three incompatible formats (main/side/skill_check), logic scattered across storyRender + completeFn closures, and JS arrow functions that cannot be serialized, diffed, or safely edited by the worldbuilder.

### §ARCH-01-A. Universal Quest Format (UQF v1.0)

Every quest becomes a declarative object with:
- `schema: '1.0'` — version stamp
- `gate: { flags, flagsAny, notFlags }` — replaces `activateCond` arrow function
- `bits: [...]` — ordered array of typed mission bit objects

### §ARCH-01-B. Mission Bit Registry

Atomic, composable mechanics — each bit is a typed contract:

| Kind | Contract | Replaces |
|------|----------|---------|
| `skill_check` | `stat`, `dc`, `onPass`, `onFail` | `checkStat/checkDC/onPass/onFail` |
| `flag_write` | `set[]`, `clear[]` | `S_story.flag = true` in closures |
| `reward` | `xp`, `gold`, `items[]`, `knowledge` | XP/gold/item lines in completeFn |
| `combat` | `key`, `label`, `count`, `nodeCode` | `storyPreBattle(...)` calls |
| `narrative` | `msg` or `template` | `storyMsg(...)` calls |
| `choice` | `prompt`, `options[{label,bits}]` | Accept/Fight button pairs in storyRender |
| `item_remove` | `name` | `inv.splice(idx,1)` calls |
| `unlock` | `quests[]` | quest chain activation side effects |

### §ARCH-01-C. Migration Plan (5 Phases, Zero-Downtime)

| Phase | Description | Risk |
|-------|-------------|------|
| 0 | Anchors + worldbuilder (✅ Done) | Zero |
| 1 | `QuestRuntime` singleton + `adaptLegacyQuest()` adapter + `schema:'0.legacy'` stamps (✅ Done) | Zero |
| 2 | New arcs written in UQF; runtime serves both formats | Low |
| 3 | Arc-by-arc migration (§WISDOM-01 first) | Medium |
| 4 | All arcs UQF; legacy path removed | Medium-low |
| 5 | QUEST_DB is single source of truth; storyRender is display-only | Low |

### §ARCH-01-D. MissionBitController

Validates quest definitions against bit contracts before writing to QUEST_DB. Runs inside worldbuilder.html Quest Editor. Required fields, optional fields, and a `validate()` function per bit kind.

### §ARCH-01-E. Implementation Checklist

- [x] Phase 1: Add `SCHEMA_VERSION`, `QuestRuntime`, `adaptLegacyQuest()` to game file (inert — no behavior change) *(✅ 2026-06-12)*
- [x] Phase 1: Add `BIT_CONTRACTS` and `validateQuest()` to worldbuilder.html Quest Editor *(✅ 2026-06-12)*
- [x] Phase 2: §D01-07 "The Maintenance Plate" arc (quest_d0207_a1–a5 at HKG) migrated from NPC_DIALOGUE dead-code to QUEST_DB — now activatable via storyCheckQuests. WIS Perception DC 10 → auto WIS save → Data Wraith battle → INT Arcana DC 13 cipher → CHA Persuasion DC 12 identity reveal. Scholar King's Name Plate reward. StoryRender plate-state indicator added. *(✅ 2026-06-14)*
- [ ] Phase 3-a: Migrate §WISDOM-01 (8 quests) — cleanest arc, well-documented
- [ ] Phase 3-b: Migrate §SPARK-01, §SPARK-02 arcs
- [ ] Phase 3-c: Migrate §ALCHEMY-01, §HUNT arcs
- [ ] Phase 3-d: Migrate main quest chain
- [ ] Phase 4: Remove `completeFn` / `onPass` closure pattern; confirm storyRender blocks are display-only
- [ ] Phase 5: Export format in worldbuilder generates paste-ready UQF JS literals

---

## §ARCH-02 — Quest Operand Registry & Full Cycle API (📋 PLANNED)

**Depends on:** §ARCH-01 Phase 1 complete  
**Lab report:** `lab-report-wbapi.md` (WBAPI system — import, patch, export)  
**Source data:** 210 quests across 4 types (side:104, skill_check:59, epic:40, main:7)

### Core Problem §ARCH-02 Solves

§ARCH-01 defines UQF format (gate + bits[]). §ARCH-02 defines **what those bits mean at execution time** — the operand vocabulary that every quest is made from. Without this, UQF is a schema with no runtime semantics, and world creation is still freeform. With it, every quest is a declared sequence of typed operands, each with a contract, a gate condition, and a completion signal.

---

### §ARCH-02-A. Operand Registry — The Complete Vocabulary

An **operand** is a discrete unit of player action with:
- **required fields** — must be present to be valid
- **optional fields** — modify behaviour when present
- **gate** — condition checked before the operand activates
- **complete** — condition checked to consider this operand done
- **runtime handler** — what the game does when the operand fires

**Scan of existing 210 quests reveals these execution fingerprints:**

| Pattern | Quest count | Notes |
|---|---|---|
| Node travel (activate ≠ waypoint) | 126 | Most common — player must move between nodes |
| In-place (activate == waypoint) | 62 | Talk, roll, receive at same node |
| Skill check | 59 | `checkAbility` + `checkDC` + `passText` + `failText` |
| Flag gate | 22 | `activateCond` reads `S_story.flag` |
| Inventory give | 15 | `inv.push(item)` in `completeFn` |
| Choice branch | 6 | Accept/Fight or multi-option branches |
| Inventory take | 4 | `inv.splice` / `inv.filter` — item consumed |
| Party/companion | 2 | NPC in `S.party`, not at a node |

---

#### Operand 1 — `talk_at`
Travel to node, interact with NPC or object.

```javascript
{
  kind: 'talk_at',
  node: 'CI',           // required — node code where interaction occurs
  npcKey: 'yael',       // optional — NPC key (verified against BIRKA_NPC + NODE_MAP)
  objectKey: 'stone',   // optional — non-NPC interactable
  requiresItem: 'Map',  // optional — item must be in S.inv to proceed
  dialogue: '...',      // optional — overrides NPC default greeting
}
```

**Gate:** `S.currentNode === bit.node`  
**Complete:** `S_story[talked_${npcKey || objectKey}_at_${node}] === true`  
**Covers:** 62 in-place side quests, most §SPARK intro quests

---

#### Operand 2 — `skill_check`
Roll stat vs DC. Existing `checkAbility`/`checkDC` fields become this operand.

```javascript
{
  kind: 'skill_check',
  ability: 'wis',       // required — wis | int | str | dex | con | cha
  dc: 14,               // required
  label: 'Ancient Text Knowledge',  // required — shown to player
  retryable: false,     // optional — default false
  retryGateDays: 3,     // optional — days before retry allowed
  passText: '...',      // required
  failText: '...',      // required
  passFlag: 'wisdomRead', // optional — S_story flag set on pass
}
```

**Gate:** player is at activateNode  
**Complete:** rolled, result recorded  
**Covers:** all 59 `skill_check` type quests  
**Stats breakdown from live data:** wis:11, int:9, cha:4, undefined:35 (to be filled)

---

#### Operand 3 — `navigate`
Player must move from one node to another. Pure location gate.

```javascript
{
  kind: 'navigate',
  fromNode: 'CI',       // required
  toNode: 'CY',         // required
  hint: '...',          // optional — shown in quest strip
}
```

**Gate:** `S.currentNode === bit.fromNode`  
**Complete:** `S.currentNode === bit.toNode`  
**Covers:** 126 quests with `activateNode ≠ waypointNode`

---

#### Operand 4 — `kill_at`
Defeat a specific enemy at a specific node. Combat is not embedded in QUEST_DB — it is triggered by the node's `battle` field. This operand declares the *intent*, which the runtime maps to the node's combat trigger.

```javascript
{
  kind: 'kill_at',
  node: 'CY',                        // required — node with battle field
  monsterKey: 'corrupted_android',   // required — must match MONSTER_POOL key
  count: 2,                          // optional — default 1
  targetLabel: 'Android ×2',        // optional — display override
  killFlag: 'androidsClear',         // optional — S_story flag set on completion
}
```

**Gate:** `S.currentNode === bit.node && nodeMap[bit.node].battle`  
**Complete:** `S_story[bit.killFlag || killed_${monsterKey}_at_${node}] === true`  
**Validation:** monsterKey must exist in MONSTER_POOL; node must have `battle` field  
**Covers:** hunt quests, §DUNGEON-01 combat encounters

---

#### Operand 5 — `escort`
NPC joins the player's party and must be delivered to a destination. The NPC is held as a party slot — not at a fixed node, but traveling with the player.

```javascript
{
  kind: 'escort',
  npcKey: 'aldric',     // required — NPC key; NPC "picked up" at fromNode
  fromNode: 'CY',       // required — where NPC joins party
  toNode: 'CI',         // required — where NPC must be delivered
  partySlot: 'escort',  // optional — S.party slot key, default 'escort'
  combatRisk: true,     // optional — combat may trigger during transit
  failFlag: 'escortFailed', // optional — set if NPC dies or player leaves zone
}
```

**Gate:** `S.currentNode === bit.fromNode && !S.party[bit.partySlot]`  
**Complete:** `S.currentNode === bit.toNode && !!S.party[bit.partySlot]`  
**NPC-as-item model:** NPC is stored in `S.party[slotKey] = npcKey` on pickup, cleared on delivery  
**Covers:** 2 existing party-pattern quests; new escort arc template

---

#### Operand 6 — `talk_party`
NPC is already in party. Conversation is available regardless of current node. This is the key distinction from `talk_at` — the NPC travels *with* the player rather than waiting at a fixed location.

```javascript
{
  kind: 'talk_party',
  npcKey: 'aldric',       // required — NPC must be in S.party
  partySlot: 'escort',    // optional — which slot to check
  trigger: 'inventory',   // optional — how conversation is initiated
  dialogue: '...',        // optional — what NPC says
  talkFlag: 'aldricBriefed', // optional — S_story flag set after talk
}
```

**Gate:** `S.party?.[bit.partySlot] === bit.npcKey || S.inv?.includes(bit.npcKey)`  
**Complete:** `S_story[bit.talkFlag] === true`  
**Player experience:** accessible from inventory/party panel, not map navigation  
**Covers:** companion quest arcs, §SPARK-style "NPC follows you" sequences

---

#### Operand 7 — `deliver`
Carry an item from one location to another. Item must be in inventory when arriving at destination.

```javascript
{
  kind: 'deliver',
  item: 'Bloodstained Map',  // required — must match S.inv entry
  toNode: 'CY',              // required — destination node
  fromNode: 'CI',            // optional — where item was picked up
  recipient: 'bruhns',       // optional — NPC key to hand item to
  consumeOnDeliver: true,    // optional — default true, removes from inv
}
```

**Gate:** `S.inv.includes(bit.item)`  
**Complete:** `S.currentNode === bit.toNode`  
**Covers:** quest_mq_1 (Bloodstained Map), any §ALCHEMY token delivery

---

#### Operand 8 — `collect_item`
Quest completion grants an item to inventory.

```javascript
{
  kind: 'collect_item',
  item: 'Drowned Compass',  // required — name added to S.inv
  icon: '🧭',               // optional
  sell: 40,                 // optional — gold value if sold
  unique: true,             // optional — only one allowed in inv
}
```

**Gate:** previous operand complete  
**Complete:** `S.inv.includes(bit.item)`  
**Covers:** 15 quests that push items — §SPARK tokens, §HUNT relics, §ALCHEMY reagents

---

#### Operand 9 — `consume_item`
Requires item in inventory, removes it as cost/condition.

```javascript
{
  kind: 'consume_item',
  item: 'Antidote',         // required — must exist in S.inv
  failText: '...',          // optional — shown if item not found
}
```

**Gate:** `S.inv.includes(bit.item)`  
**Complete:** item removed from inv  
**Covers:** 4 quests that remove items (quest_forge_02 pattern)

---

#### Operand 10 — `investigate`
Examine a location or object. Precedes `kill_at` in the §HUNT 4-phase template — investigation reveals the real enemy before the player commits to combat.

```javascript
{
  kind: 'investigate',
  node: 'LD',               // required — investigation location
  target: 'shore_markings', // required — what is examined
  skillCheck: { ability:'int', dc:12 }, // optional — DC to learn more
  reveals: 'drowner',       // optional — monster key unlocked by investigation
  narrativeText: '...',     // optional — what is discovered
  investigateFlag: 'shoreInvestigated', // optional
}
```

**Gate:** `S.currentNode === bit.node`  
**Complete:** `S_story[bit.investigateFlag] === true`  
**Covers:** §HUNT investigation phase, §WHODUNIT clue collection

---

#### Operand 11 — `flag_gate`
Not an action — a prerequisite block. Declares the flags that must be set before this quest or operand is reachable. Replaces inline `activateCond` arrow functions.

```javascript
{
  kind: 'flag_gate',
  requires: ['questDone_01'],       // ALL must be true
  requiresAny: ['spark_path_a', 'spark_path_b'], // ANY one must be true
  blocks: ['questDone_02'],         // none of these may be true
}
```

**Gate:** evaluated against `S_story`  
**Complete:** gate passes (this is a gate, not an action)  
**Covers:** 22 quests with flag-dependent `activateCond`

---

#### Operand 12 — `choice`
Branching decision. Each option contains its own operand sub-sequence. Merges into a `choice` bit in UQF v1.0.

```javascript
{
  kind: 'choice',
  prompt: 'What do you do?',
  options: [
    { label: 'Accept',  bits: [ /* operand sequence */ ] },
    { label: 'Fight',   bits: [ /* operand sequence */ ] },
    { label: 'Flee',    bits: [ /* operand sequence */ ] },
  ],
}
```

**Gate:** previous operand complete  
**Complete:** one option chosen and its bit sequence resolved  
**Covers:** 6 existing choice quests (quest_sb_01 pattern), §SIREN betrayal mechanic

---

### §ARCH-02-B. Operand Composition Rules

Every quest is a **linear or branching sequence of operands**. The runtime walks the sequence, testing each operand's gate before exposing it to the player.

```
quest = {
  gate:  flag_gate operand    ← when does this quest appear?
  bits:  [
    operand_1,                ← first player action
    operand_2,                ← second (unlocked when 1 completes)
    ...
    collect_item,             ← reward
    flag_write,               ← mark completion
  ]
}
```

**Composition constraints enforced by MissionBitController:**
- `kill_at` must reference a node with `battle: true` in NODE_MAP
- `escort.fromNode` and `escort.toNode` must exist in NODE_MAP
- `deliver.item` must match a prior `collect_item` or existing inv item
- `talk_at.npcKey` must exist in BIRKA_NPC or as inline `node.npc`
- `talk_party.npcKey` must match a prior `escort` operand's `npcKey`
- `skill_check.ability` must be one of: `str dex con int wis cha`
- Every quest must end with either `collect_item`, `flag_write`, or `choice`

---

### §ARCH-02-C. Existing Quest → Operand Map

| Quest type | Count | Primary operand sequence |
|---|---|---|
| `skill_check` | 59 | `flag_gate?` → `talk_at` → `skill_check` → `collect_item?` |
| `side` (in-place) | ~62 | `flag_gate?` → `talk_at` → `collect_item?` → `flag_write` |
| `side` (travel) | ~42 | `flag_gate?` → `navigate` → `talk_at` → `flag_write` |
| `epic` | 40 | `flag_gate` → `navigate` → `choice` → `skill_check` → `collect_item` → `flag_write` |
| `main` (mq_1–7) | 7 | `navigate` → `deliver?` → `flag_write` → `unlock` |
| §HUNT template | 4 arcs | `flag_gate` → `navigate` → `investigate` → `kill_at` → `collect_item` → `flag_write` |
| §SPARK template | 2 arcs | `flag_gate` → `talk_at` → `skill_check` → `collect_item` → `talk_party?` |
| §ALCHEMY template | 1 arc | `flag_gate` → `navigate` → `collect_item` → `deliver` → `flag_write` |
| §ESCORT (new) | 0 | `flag_gate` → `talk_at` → `escort` → `navigate` → `talk_party` → `flag_write` |

---

### §ARCH-02-D. NPC-as-Party-Member Model

When an NPC joins the player's party, they shift from a **world object** (at a fixed node) to a **carried object** (in `S.party`). This is the conceptual bridge between `talk_at` (NPC at location) and `talk_party` (NPC traveling with player).

**State model:**
```javascript
S.party = {
  escort: 'aldric',       // NPC key in this slot
  companion: null,        // permanent party slot (future)
}
```

**Lifecycle:**
```
1. talk_at (fromNode)          → NPC met at node; offer to join
2. collect_item 'Aldric'       → NPC added to S.inv as token
   + flag_write: aldricJoined  → S_story flag set
3. escort operand active       → S.party.escort = 'aldric'
4. talk_party (any node)       → available while NPC in party
5. navigate (toNode)           → player travels with NPC
6. deliver at toNode           → S.party.escort cleared
   + consume_item 'Aldric'     → token removed from inv
   + flag_write: aldricDelivered
```

**Why item + flag + party slot:**  
Three redundant signals ensure robustness across save/load, UI display, and runtime checks. The item shows in inventory so the player knows they're carrying someone. The flag enables downstream quest gates. The party slot enables `talk_party` gates without scanning inventory.

---

### §ARCH-02-E. World Creation Advisory Layer

The **Advisory Layer** is the creative half of MissionBitController. It validates not just field types but *world logic* — whether the operands refer to things that actually exist in the game world.

**Checks run on every quest PUT/create:**

| Check | Operand(s) | Error if |
|---|---|---|
| Node exists | `talk_at`, `kill_at`, `navigate`, `escort`, `investigate` | Node code not in NODE_MAP |
| Node has battle | `kill_at` | `nodeMap[node].battle` is null/false |
| Monster exists | `kill_at` | monsterKey not in MONSTER_POOL |
| Monster in terrain | `kill_at` | monsterKey not in `_terrainToMonsters[node.name]` |
| NPC exists | `talk_at`, `escort`, `talk_party` | npcKey not in BIRKA_NPC and not `node.npc` |
| NPC at node | `talk_at` | NPC's node field ≠ operand's node |
| Item coherence | `deliver`, `consume_item` | item not granted by prior `collect_item` in same quest |
| Party coherence | `talk_party` | no prior `escort` operand grants this npcKey |
| Flag uniqueness | `flag_write` | flag already written by another quest in same arc |
| Stat validity | `skill_check` | ability not in `[str,dex,con,int,wis,cha]` |
| DC range | `skill_check` | DC < 5 or DC > 25 (advisory, not block) |

**Advisory (warn, don't block):**
- Quest with no `collect_item` or `flag_write` at end — player gets no signal of completion
- `skill_check` with no `passFlag` — downstream quests can't gate on this result
- `navigate` with no `hint` — player has no waypoint guidance
- `escort` with `combatRisk: true` but no `killFlag` — combat outcome untracked

---

### §ARCH-02-F. Full Cycle API

The complete round-trip from world creation intent to saved game file:

```
1. DESIGN
   WBAPI.quests.create({
     id: 'quest_escort_aldric',
     type: 'escort',
     title: 'The Archivist Walks',
     gate: { requires: ['aldricMet'] },
     bits: [
       { kind: 'talk_at',     node: 'CY', npcKey: 'aldric' },
       { kind: 'collect_item', item: 'Aldric', icon: '👴' },
       { kind: 'escort',      npcKey: 'aldric', fromNode: 'CY', toNode: 'CI' },
       { kind: 'talk_party',  npcKey: 'aldric', talkFlag: 'aldricBriefed' },
       { kind: 'navigate',    fromNode: 'CY', toNode: 'CI' },
       { kind: 'flag_write',  set: ['aldricDelivered'] },
       { kind: 'consume_item', item: 'Aldric' },
       { kind: 'collect_item', item: 'Archivist Key', icon: '🗝', sell: 0 },
     ]
   })

2. VALIDATE
   WBAPI.quests.validate('quest_escort_aldric')
   // → { ok:true, warnings:['navigate has no hint'] }

3. ADVISORY CHECK
   WBAPI.quests.advise('quest_escort_aldric')
   // → checks: node CY exists ✓, NPC aldric exists ✓, aldricMet flag writable ✓

4. EDIT (text fields via file or inline)
   WBAPI.editField('quest', 'quest_escort_aldric', 'title', 'Walk With Me')
   // or: ./api.sh put quest quest_escort_aldric title="Walk With Me"

5. CHAIN CHECK
   WBAPI.quests.chain('quest_escort_aldric')
   // → { upstream: ['quest_aldric_intro'], downstream: [] }

6. EXPORT (for human review)
   ./api.sh export quest_db --out world/quests.json
   // or full tree export: node wbapi-cli.js export ./world
   //     world/CY/npcs/aldric/quests/quest_escort_aldric/

7. AUDIT + SAVE
   ./api.sh audit              // must be clean before save
   // then save via worldbuilder.html Save button or wbapi-cli.js save
```

---

### §ARCH-02-G. WBAPI Methods to Add

New methods needed in `wbapi-core.js` and `worldbuilder.html`:

```javascript
// Quest creation with operand validation
WBAPI.quests.create(questObj)          // validates operands before adding
WBAPI.quests.validate(idOrTitle)       // run MissionBitController checks
WBAPI.quests.advise(idOrTitle)         // run world-logic advisory checks
WBAPI.quests.toOperands(idOrTitle)     // parse legacy quest into operand array

// Operand registry
WBAPI.operands.list()                  // all 12 operand types
WBAPI.operands.contract(kind)          // required/optional fields for a kind
WBAPI.operands.validate(bit)           // validate a single operand object

// World advisory
WBAPI.worlds.validateNodeForCombat(code)    // node has battle field + monsters
WBAPI.worlds.npcAtNode(npcKey, nodeCode)    // NPC is correctly placed
WBAPI.worlds.flagUniqueInArc(flag, arcId)  // flag not reused across arc
```

---

### §ARCH-02-H. Implementation Checklist

**Phase 1 — Operand Registry (inert, no behavior change)** *(✅ 2026-06-12)*
- [x] Define `OPERAND_CONTRACTS` object with all 12 operand kinds, required/optional fields
- [x] Add `WBAPI.operands.list()` / `.contract(kind)` / `.validate(bit)`
- [x] Add `WBAPI.quests.validate(id)` — field-level checks only
- [x] Add `WBAPI.quests.advise(id)` — world-logic cross-reference checks
- [x] Add `WBAPI.quests.toOperands(id)` — parse existing quest fields into operand array
- [x] Wire validate + advise into API tab in worldbuilder.html

**Phase 2 — Quest creation flow**
- [ ] Add `WBAPI.quests.create(questObj)` — validates then adds
- [ ] Add operand builder UI in worldbuilder.html Quest Editor (one card per operand)
- [ ] Add `WBAPI.quests.chain()` to show upstream/downstream in Quest Editor

**Phase 3 — Escort + party operand runtime (new execution paths)**
- [ ] Add `S.party` to game state model
- [ ] Implement `escort` pickup/dropoff in storyRender
- [ ] Implement `talk_party` trigger in inventory/party panel
- [ ] Add `talk_party` detection to `_questsByNode` — these quests appear everywhere

**Phase 4 — Legacy quest conversion**
- [ ] `quests.toOperands()` used to audit all 210 quests
- [ ] Generate operand arrays for all 59 `skill_check` quests (most uniform, lowest risk)
- [ ] Convert §HUNT-01 (4 quests) as escort+kill_at proof-of-concept
- [ ] Convert §SPARK-01 arc as collect_item+talk_party proof-of-concept

**Phase 5 — Full advisory enforcement**
- [ ] `quests.create()` hard-blocks on world-logic failures (node not found, NPC not placed)
- [ ] World Builder CLI: `./api.sh audit` advise mode — `./api.sh get quest <id>` + chain check in one call

---

## §WORLDBUILDER-02 — Investigation Mode: Cross-Reference Explorer (📋 PLANNED)

**Status:** 📋 PLANNED — written 2026-05-29

**What it is:** A second interaction mode for worldbuilder.html that shifts emphasis from editing to *investigation*. The current worldbuilder is CRUD-first: you find an entity, you change its fields. Investigation Mode is knowledge-first: you find an entity and immediately see all of its relationships — what it's connected to, what depends on it, what references it — so that design decisions are made from a full picture rather than a partial one.

**Why this matters:** The game has 210 quests, 144 nodes, 392 monsters, 69 terrains. At this scale, editing a quest's activateNode without knowing what else activates at that node, or renaming a monster without knowing which terrains it appears in, creates invisible breakage. Investigation Mode makes the graph visible before any change is made.

---

### §WORLDBUILDER-02-A. The Quest Detail Card (Full Cross-Reference View)

The current quest display shows title + text. The investigation card adds:

```
┌─────────────────────────────────────────────────────────────────┐
│  quest_wis_03                                [skill_check / WIS] │
│  "The Stalemate Cost"                                            │
│  Node: SB  (Senate Building — Birka)                             │
├─────────────────────────────────────────────────────────────────┤
│  NPC: Magistra Voss (yael)   Stat: WIS  DC: 12                  │
│  Retryable: no               XP: 100   Gold: 0                  │
├─────────────────────────────────────────────────────────────────┤
│  UPSTREAM FLAGS (must be set before this activates):            │
│    wisHookReceived    ← written by quest_wis_00                 │
│    sbResolved         ← written by quest_sb_01 or quest_sb_fight│
│  DOWNSTREAM FLAGS (set by this quest, read by):                 │
│    wisPage3_thumbscrew → read by quest_wis_07, quest_wis_09     │
├─────────────────────────────────────────────────────────────────┤
│  ARC: quest_wis (Wisdom arc)   [8 quests total, this is #3]     │
│  Sibling quests in arc: wis_00 wis_01 wis_02 [this] wis_04...   │
└─────────────────────────────────────────────────────────────────┘
```

Clicking any node code, NPC key, flag name, or arc quest ID navigates to that entity's card.

---

### §WORLDBUILDER-02-B. Mission Classification — Proposed Type Taxonomy

Current quest types in QUEST_DB: `side`, `skill_check`, `epic`, `main`.

These 4 types carry too much semantic weight for a 210-quest corpus. A finer taxonomy makes it possible to filter by what the player actually does:

| Proposed Class | Description | Existing examples |
|----------------|-------------|-------------------|
| `hunt` | Kill N enemies of type X | quest_hunt_01–04 |
| `collect` | Acquire item(s) and return them | quest_la_riva_02, quest_basket_damascus |
| `escort` | Companion must survive to destination | §SPARK-01 (Caspian) |
| `skill_check` | Roll stat vs DC (already exists) | all skill_check quests |
| `talk_chain` | Dialogue with NPC sequence (no combat required) | quest_wis_00, quest_la_riva_01 |
| `lore_collect` | Gather scattered journal/map fragments | Froberger arc, §ALCH |
| `gate_pass` | Reach a node while a condition is met | quest_governor_cyprus |
| `survival` | Reach a state with HP > threshold | quest_stoning_lystra |
| `investigation` | Read clues from multiple nodes, synthesize at one | §WHODUNIT |
| `epic` | Multi-step, multi-node arc capstone (already exists) | mq quests |
| `main` | Story-gate progression key (already exists) | quest_antecedent_01 |

**Classification rule:** a quest's operational class is determined by the primary completion signal — the single thing that fires `completeFn`. Secondary effects (a skill check inside a hunt) do not change the class.

---

### §WORLDBUILDER-02-C. Filter + Search Interface

Investigation Mode adds a persistent filter bar above the main content area:

```
[ Type ▾ all ] [ Arc ▾ all ] [ Node ▾ all ] [ NPC ▾ all ]  [ Search... ]
```

Filtering by node shows all quests that activate OR waypoint at that node — the full mission picture for a location. Filtering by NPC shows every quest that NPC is involved in. Filtering by arc shows the full chain in order with flag dependencies inline.

**Location Profile card** (per node, aggregates all entities):

```
Node: CI — City Streets – Birka  (Act 1, terrain: city)
  Quests active here:  6  (3 side, 2 skill_check, 1 talk_chain)
  NPCs:                Yael Scheidemann, Crov (inline)
  Monsters:            city_guard, thief, pickpocket, shadow_agent... (28 total)
  Terrains:            city
  Adjacent nodes:      CI2 (S), CY (N), CO (E), IN (W)
  Flags set by quests: connieMet, wisHookReceived, labHookReceived
  Flags read by quests: catKingDefeated, govCopperConverted
```

---

### §WORLDBUILDER-02-D. Relationship Graph (Visual)

A secondary panel showing the selected entity's immediate neighborhood as a small force-directed graph:

- Quest node → connected to: its activateNode, waypointNode, NPC key, arc siblings, upstream/downstream quests (by flag)
- Node → connected to: all adjacent nodes (N/S/E/W), all quests at that node, all NPCs at that node
- NPC → connected to: their home node, all quests that reference their key
- Monster → connected to: all terrains that include it, all nodes where that terrain is active

The graph is not a map replacement — it is a relationship surface for the selected entity. Nodes in the graph are clickable (navigate to that entity's investigation card).

---

### §WORLDBUILDER-02-E. Implementation Phases

**Phase 1 — Quest investigation card (no graph)** ✅ 2026-06-12
- [x] Extend quest detail pane in worldbuilder.html to show: arc siblings, upstream/downstream flags with originating quest IDs, NPC key → NPC name lookup, activateNode → node label lookup
- [x] Add arc-filter to quest sidebar (filter by arc prefix extracted from quest ID)
- [x] Add "Location Profile" button on node detail that shows all quests + NPCs + monsters at that node

**Phase 2 — Mission classification layer** *(✅ 2026-06-12)*
- [x] Add `_classifyQuest(q)` to wbapi-core.js — returns operational class from `§WORLDBUILDER-02-B` table based on field inspection
- [x] Add `WBAPI.quests.byClass(cls)` list method
- [x] Expose in worldbuilder: class filter dropdown with 10 operational classes + class badge in quest list
- [x] Show operational class badge alongside QUEST_DB type in quest card header

**Phase 3 — Location Profile card** *(✅ 2026-06-12)*
- [x] `WBAPI.location.profile(nodeCode)` — extends existing `location.get()` with: quest list with classes, NPC list with quest counts, flag reads/writes at this node
- [x] Render Location Profile card in worldbuilder when clicking a node (replaces simple node detail pane)

**Phase 4 — Relationship graph panel** *(✅ 2026-06-12)*
- [x] Add lightweight SVG graph panel inline in detail pane (node profile accordion, quest detail, NPC detail)
- [x] Populate from `WBAPI.location.profile()` + `WBAPI.quests.chain()` + `_questsByNpc` data
- [x] Nodes clickable → switchTab + selectQuest/selectMapNode/selectNpc; hover highlight

---

### §WORLDBUILDER-02-F. Architectural Suggestion List

Items that arise from the investigation-mode design and should feed into §ARCH-01/§ARCH-02:

1. **Quest operational class field** — add `_class` to UQF schema (§ARCH-01). Derived at load time by `_classifyQuest()`, not stored in source. Classification is deterministic from existing fields.

2. **Arc ID field** — quests currently encode arc membership in their key prefix (e.g., `quest_wis_03` → arc `quest_wis`). Make this explicit: add `arc: 'quest_wis'` as a first-class UQF field. Enables arc-level sorting, ordering, and chain queries without string-splitting heuristics.

3. **NPC–quest relationship index** — WBAPI already has `_questsByNode` but no `_questsByNpc`. Add `_questsByNpc` index (NPC key → quest IDs that reference it) in `_buildIndexes()`. Currently this is done by regex scan of raw source; a first-class index makes it O(1).

4. **Terrain–node index** — `WBAPI.worlds.monsterList(terrain)` exists but there is no `WBAPI.worlds.nodeList(terrain)` — the list of all nodes whose `name` field equals a terrain key. Add this to `_buildIndexes()` as `_nodesByTerrain`.

5. **Waypoint-node second index** — `_questsByNode` currently indexes only `activateNode`. Add `_questsByWaypoint` for `waypointNode` so both activation point and completion point are reachable in O(1). This makes the Location Profile card complete.

6. **Flag-to-class map** — for a given flag (e.g., `catKingDefeated`), show: which quest class wrote it, and which quest classes read it. Supports Investigation Mode's "what does changing this flag break?" view.

7. **Mission brief export** — `WBAPI.quests.brief(id)` returns a human-readable one-paragraph summary of a quest: class, node, NPC, stat check if any, upstream deps, downstream effects. Used in investigation card and exportable as game design doc.
- [ ] worldbuilder.html Quest Editor shows real-time advisory warnings while editing

---

## §BACKLOG — Outstanding Tasks (updated 2026-06-12)

A consolidated register of all open work across the project. Organized by domain. Items carry a priority tier: **P1** (blocks other work or has active dependencies), **P2** (planned, sequenced), **P3** (unscheduled / speculative).

---

### BACKLOG-A. Tooling — WBAPI + Worldbuilder

**P1 — Immediately actionable:**

- [x] **§WORLDBUILDER-02 Phase 2 — Mission classification:** Add `_classifyQuest(q)` to wbapi-core.js (10 operational classes; survival not auto-detectable). Add `WBAPI.quests.byClass(cls)`. Class filter in worldbuilder sidebar. Class badge in quest list and detail header. *(✅ 2026-06-12)*

- [x] **§WORLDBUILDER-02 Phase 3 — Location Profile card:** `WBAPI.location.profile(nodeCode)` — extends `location.get()` with quest list w/ classes, NPC quest counts, flag reads/writes at node. Render as Location Profile card in worldbuilder. Also: `_questsByNpc` + `_questsByWaypoint` indexes added to wbapi-core.js; `/api/location/:code` enriched with same data. *(✅ 2026-06-12)*

- [x] **§WORLDBUILDER-02 Phase 4 — Relationship graph panel:** SVG radial graph in node/quest/NPC detail panes. Node→adjacent+quests+NPCs; Quest→activateNode/waypointNode/NPC/arc siblings/upstream/downstream; NPC→home node+quests. Clickable nodes navigate via switchTab. `selectNpc()` helper added. *(✅ 2026-06-12)*

- [ ] **§ARCH-02 Phase 2 — Quest creation flow:** Add `WBAPI.quests.create(questObj)` (validates then adds). Add operand builder UI in worldbuilder Quest Editor. Show `quests.chain()` upstream/downstream in Quest Editor. *(Depends on: §ARCH-02 Phase 1.)*

- [ ] **§WORLDBUILDER-01 — Visual grid editor:** Full canvas-based node map editor with node detail inspector, exit bidirectional editing, collision detection. See full spec in §WORLDBUILDER-01-A through -D. *(Depends on: §WORLDBUILDER-02 Phase 1 for cross-ref panel integration.)*

- [ ] **§EDITOR-01 — Quest creator UI:** Form-based quest creator with type-aware fields, flag dependency graph, storyRender block generator, token item manager, template presets. See full spec in §EDITOR-01-A through -G. *(Depends on: §ARCH-02 Phase 1 for operand validation.)*

**P2 — Deferred / unscheduled:**

- [x] **§WORLDBUILDER-02 Phase 4 — Relationship graph:** Canvas/SVG graph panel showing entity neighborhood. Nodes clickable. *(✅ 2026-06-12 — SVG radial graph implemented)*
- [ ] **§ARCH-02 Phase 3 — Escort + party runtime:** `S.party`, `escort` pickup/dropoff, `talk_party` in inventory panel. *(Depends on: Phase 2.)*
- [ ] **§ARCH-02 Phase 4 — Legacy quest conversion:** Audit all 210 quests with `toOperands()`. Convert 59 skill_check quests first (most uniform). Convert §HUNT-01 and §SPARK-01 as proof-of-concept. *(Depends on: Phase 2.)*
- [ ] **§ARCH-01 Phases 2–5:** Migrate quest arcs to UQF one by one (WISDOM → SPARK → ALCHEMY → main chain). Remove `completeFn`/`onPass` closure pattern. Export UQF JS literals from worldbuilder. *(Long-term.)*

---

### BACKLOG-B. Game Content — Unimplemented Arcs

**P1 — Specced and ready:**

- [x] **§SPARK-01 — The Harmony Chain (5 quests):** IMPLEMENTED. All 5 quests in QUEST_DB, full storyRender UI at LCY + SEN nodes, all flags (smaltBefriended → pipMet → bioluminescentParasiteFound → whodunitSolved → aldousConfessed → harmonyChainComplete) and tokens complete. *(✅ 2026-06-14)*

- [x] **Combined monster rename save:** commoner → "Rabid Monkey", npc_merchant → "Badger" — applied in one `node -e` session, single save. *(✅ 2026-06-12)*

**P2 — Unscheduled:**

- [x] **§SPARK-01-H — Naval Extension (Deep Warmth Eel):** IMPLEMENTED. `quest_sea_01/02/03` at NWI ("Open Water — The Warmth Calm"). Three-quest arc: strange stillness → INT DC 13 investigation → WIS DC 14 escort south into trench depth. Flags: `seaStrangenessNoticed`, `warmthEelFound`, `warmthEelEscorted`, `pirateCrew_allied`. Reward: Joint Pirate Debt Note, +400gp/xp. NWI storyRender UI shows live state. Connection to §SPARK-01 via knowledge entry ("same organism as Clot's Glow, different scale"). *(✅ 2026-06-14)*

- [ ] **§WISDOM-01 — Keel thread close:** quest_wis_03 identified that Keel was protecting Baltic sea route survey data from the navigator's notes. This is a partial resolution only — Keel took the notes, their destination is unknown, the navigator is missing. A future arc (unspecced) must close this thread. Candidate: an arc at an eastern Baltic node where the survey data surfaces. *(Unspecced — requires new arc design.)*

- [ ] **§GR-D Froberger Entry 42 (NG+ deferred):** The blank page filled on second playthrough. Deferred from §GR implementation. *(Requires NG+ state tracking, currently unsupported.)*

- [ ] **Covenant Keeper Ending:** Referenced across §GR-D (all six grief arcs converge here; each person's name is spoken as a receipt of witnessing). Not yet implemented as a narrative endpoint. Requires: all six grief arcs complete, a final node or storyRender event, the "naming ceremony" dialogue. *(Depends on: §GR complete, §SPARK-01 complete for Aldous/harmony thread.)*

---

### BACKLOG-C. Design + Architecture Decisions (non-implementation)

- [ ] **Arc ID as first-class UQF field:** Currently arc membership is inferred from quest key prefix (`quest_wis_03` → arc `quest_wis`). Add explicit `arc: 'quest_wis'` field to UQF schema. Enables arc-level sorting without heuristics. *(Feed into §ARCH-01 Phase 1.)*

- [ ] **`_questsByNpc` index in WBAPI:** NPC key → quest IDs that reference it. Currently done by regex scan; a first-class index makes it O(1) and enables investigation card NPC panels. *(Feed into §WORLDBUILDER-02-F item 3.)*

- [ ] **`_nodesByTerrain` index in WBAPI:** Terrain key → list of node codes whose `name` field equals that terrain. No lookup currently exists. *(Feed into §WORLDBUILDER-02-F item 4.)*

- [ ] **`_questsByWaypoint` second index:** Currently `_questsByNode` indexes only `activateNode`. Add `_questsByWaypoint` for `waypointNode`. Makes Location Profile cards complete for completion-point queries. *(Feed into §WORLDBUILDER-02-F item 5.)*

- [ ] **§FUTURE-01 Saul/Paul arc — canonical placement decision:** This arc is fully specced and was implemented (§FUTURE-01 section). The design decision outstanding is how its tone and register sits relative to the Birka/Tilbury/Visby world — specifically whether Acts-fidelity creates a tonal discontinuity. See §BACKLOG-D thematic audit note. If the arc is to remain, the integration point is the existing Malta/Rome nodes; if pulled, those nodes should stand alone.

---

### BACKLOG-D. Thematic Audit Note

*See §BACKLOG-E below for the full theme review. Outstanding design question:*

The current game has two registers that coexist:

1. **Chrétien register** — grief enacted through objects, silence, small domestic actions. Brynn's cup. Connie's key ring. The void that expresses itself through supply chains and cat factions. The Harmony Chain (kindness → harmony, monster = friendly). Keel's omission. Inspector Wren-Pembury's impossible backstory. This register is character-first, and its resolutions are receipts, not victories.

2. **Acts fidelity register** — §FUTURE-01, conversion mechanics, Acts/Pauline canon adherence. This register is history-first and its resolutions are transformations.

These two registers are currently adjacent without a seam. The question is whether to write a seam (a bridging character who exists in both registers) or to let them be two distinct world zones. The Covenant Keeper ending is the natural seam candidate — it names people from both zones.

*Decision deferred. Flag for next major arc design session.*

---

### BACKLOG-E. Unified Theme Review (2026-05-29)

Every major implemented arc and every PLANNED arc was reviewed against the project's core thematic vocabulary. Summary:

**Core vocabulary (all arcs that use it):**

| Theme | Arcs |
|-------|------|
| Grief enacted through objects, not declared | §GR, §SPARK-01 (Inspector), §WHODUNIT-01, §WISDOM-01 |
| Corruption as infrastructure (void moves through supply chains) | §GR, §DUNGEON-01 (CY/CQ corruption chain), all Cat faction arcs |
| Kindness as the operative skill (not violence) | §SPARK-01, §SPARK-02, §HUNT-01 ("fear → understanding"), §HUNT-02 |
| Institutions that fail silently | §NAVAL-01 (Keel), §PORT-01 (Saltwick suppressed history), §WISDOM-01 (Senate Building) |
| Witnessing as resolution | §GR (Connie/Aldo scene; Kenickie receipt), Covenant Keeper ending, §WHODUNIT-01 |
| The friendly monster (assumptions inverted) | §SPARK-01 (Warmth eel), §HUNT-01 (creature is spiritual, not feral), §DUNGEON-01 (mimic meadows) |

**Arcs with strong thematic coherence:** §GR, §SPARK-01, §SPARK-02, §HUNT-01, §HUNT-02, §NAVAL-01, §PORT-01, §WHODUNIT-01, §ALCHEMY-01, §WISDOM-01, §DUNGEON-01 (thematically anchored via hero origin + shadow room + sacrifice gate).

**Arcs with partial or conditional coherence:**

- **§SPARK-01-H (Naval Extension):** Uses the "friendly monster" theme correctly. The eel as the resolution agent for a human social problem (pirate cooperation) is thematically sharp. *Coherent.*

- **§FUTURE-01 (Saul/Paul arc):** Uses transformation as its primary register, not grief-through-objects. The conversion mechanic is conceptually distinct from the witnessing model. *See §BACKLOG-D.* The road-to-Damascus section is internally coherent; the question is whether "transformation that rewrites identity" and "grief that does not resolve" are in productive tension or in contradiction. The arc currently treats them as separate world zones rather than as two expressions of a shared theme. This is fine architecturally but could be richer if the tension were made explicit.

- **§DUNGEON-01 — Loop Heart choice room + Sacrifice Gates:** These are mechanically the most game-like sections. They fit thematically via "what you carry shapes what you find" (the sacrifice gate asks the player to give up something they value to advance). *Thematically coherent, mechanically legible.*

**One gap:** No arc currently addresses the *restoration* side of witnessing. All grief resolutions are receipts (acknowledgment), not rebuilds. Fishmonger's Row does not rebuild. The Covenant Keeper ending names people, does not heal them. The §SPARK-01 chain does not undo the Inspector's lost years. This is structurally correct for the Chrétien register — but it means the world has no arc about what comes after witnessing. The Keel thread close (BACKLOG-B) is the natural candidate for this: if the Baltic survey data is recovered, something lost to institutional silence actually returns. *Suggestion: design the Keel closure arc explicitly as the "after witnessing" arc.*

---

### BACKLOG-F. API-CLI Tooling Follow-Ups (2026-06-05)

- [ ] **`wb import` endpoint verification:** `wb import` calls `POST /api/import/book` — verify the endpoint is actually wired into the server route table (`wbapi-server.js`) and test with a real book JSON before relying on it in production.
- [ ] **`wb import` synopsis line:** Update `HELP` text in `wb` / `api.sh` to match the full flag set (verify `--out` and others pass through correctly).

---

### §MBIT-02-E. Token as gate key (alternative to separate `_hasItem` condition)

The existing `_hasItem('Trade Seal')` pattern and `KEY_EVENTS[].item` patterns could unify with mission bit tokens. A quest with `checkPassFlag:'tradeSealReceived'` would produce a "Trade Seal Received Token" — but the token's `name` doesn't match `_hasItem('Trade Seal')` since the naming differs.

Resolution options:
1. Add `keyPhrase` field to token: `{ ..., keyPhrase:'Trade Seal' }` — `_hasItem` checks both `name` and `keyPhrase`
2. Keep the two systems separate: KEY_EVENTS use named items; mission bits use tokens. They serve different purposes.

**P3 — Decision pending. Leaning toward keeping systems separate: KEY_EVENTS items are physical objects found or purchased; mission bit tokens are event receipts. Different ontology.**

---

## §FISH-01 — Fish + Lake Magic in Worldbuilder + API (2026-05-29)

### Implemented

**WORLDBUILDER anchors (roll2hit-v3.html):**
- `// ◆◆◆ WORLDBUILDER:FISH_DB:START/END ◆◆◆` — wraps `FISH_POOL` (20 day fish, rank 1–20) and `NIGHT_FISH_POOL` (5 nocturnal species, ranks 6–14)
- `// ◆◆◆ WORLDBUILDER:LAKE_MAGIC:START/END ◆◆◆` — new `LAKE_MAGIC_DB` const with 8 lake magic items

**wbapi-core.js:**
- `extractArr(block, name)` — array-literal parser (like `extractObj` but for `[...]`), with `//` and `/* */` comment skipping
- `parseArr(block, name)` — wraps `extractArr` for safe eval
- `WBAPI.fishPool`, `WBAPI.nightFishPool`, `WBAPI.lakeMagicDb` — loaded on `WBAPI.load()`

**wbapi-server.js API routes:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET`  | `/api/fish` | List all 25 fish; filter `?rank=N` or `?night=true/false` |
| `GET`  | `/api/fish/:key` | Single fish + connections (drop, monster) |
| `POST` | `/api/fish` | Create new fish (day or night pool) |
| `POST` | `/api/fish/simulate` | Run full 3-phase fishing roll server-side; returns fish + monster stats |
| `GET`  | `/api/lake-magic` | List all 8 magic items; filter `?effect=` or `?minRank=` |
| `GET`  | `/api/lake-magic/:key` | Single magic item |
| `POST` | `/api/lake-magic` | Create new magic item |

**SCHEMAS:** `fish` and `lake_magic` schemas added to `GET /api/schema`.

**worldbuilder.html — Fishing Sim Easter Egg (Dice Lab):**
- "🪣 Yugurt Lake Fishing Sim" collapsible section in the Dice Lab
- 5 modifier inputs: DEX mod, Bait Catch, Bait Type, Luck mod, Rod bonus
- Calls `POST /api/fish/simulate` → renders 3 accordion rows (Phase 1 Cast, Phase 2 Catch, Phase 3 Type) plus final result card with fish name + monster stats
- Offline fallback: local rolls if API unavailable

**LAKE_MAGIC_DB schema:**
```
effect: ac_bonus | atk_bonus | fishing_dc | first_strike | night_type | all_ability
bonus formula: base + floor(level × levelScale) + floor(luckMod × luckScale)
```

**Implemented (P2 — completed):**
- §DROP-03 ✅ COMPLETE 2026-06-12: `_lakeMagicBonuses()` implemented. All 6 effect types live. Grant path live in `battKillEvent()` — 20–55% chance by rank, unique per item. ✅ LAKE_MAGIC_DB effects are dropped in-game.

**Pending (P3 — unscheduled):**
- Add `POST /api/fish/simulate?advantage=true` for bait advantage rolls
- Worldbuilder quest pane: "Produces: 🪬 Token" display (§MBIT-02-C P3)

---

## §WBAPI-01 — Full Array Export + API-First Write Workflow (📋 PLANNED)

**Status:** 📋 PLANNED — written 2026-05-29  
**Goal:** Make every large data array in `roll2hit-v3.html` readable and writable via `wbapi-server.js`. The HTML is the single source of truth; all creation and mutation goes through the API. Direct HTML edits are a fallback of last resort.

### §WBAPI-01-A. Problem Statement

Currently, most data writes still happen by editing `roll2hit-v3.html` directly. This is fragile: a missed comma, wrong key name, or quote mismatch can silently break the game. The WBAPI already supports `POST /api/save` (write back to disk) and `POST /api/reload`, and has `PUT` for node/quest/monster/npc/terrain entities. What's missing:

1. **Create endpoints** for terrain, monster, and condition items (WORLD_DB, MONSTER_POOL, CONDITION_ITEMS)
2. **Bulk export** of every array as raw JSON and as pasteable JS literal
3. **Full-array PATCH** — replace or merge a complete named constant via the API
4. **Node.js / V8 runability** — extracted code sections should execute as standalone modules

### §WBAPI-01-B. Array Export Targets

| Constant | Current API coverage | Target |
|----------|---------------------|--------|
| `NODE_MAP` | `GET /api/list/node`, `GET /api/node/:id`, `PUT` | ✅ readable; add `GET /api/export/node_map` (raw JS literal) |
| `QUEST_DB` | `GET /api/list/quest`, `GET /api/quest/:id`, `PUT`, `POST` | ✅ readable; add `GET /api/export/quest_db` |
| `MONSTER_POOL` | `GET /api/list/monster`, `GET /api/monster/:id`, `PUT`, fork, rename | ✅ readable; add `GET /api/export/monster_pool` + `POST /api/monster` (create) |
| `MONSTER_DROPS` | `GET /api/monster/:id` (included in detail) | Add `GET /api/export/monster_drops` + `PUT /api/monster/:id/drop` |
| `WORLD_DB` | `GET /api/list/terrain`, `GET /api/terrain/:id`, `PUT` | Add `POST /api/terrain` (create) + `GET /api/export/world_db` |
| `CONDITION_ITEMS` | none | Add `GET /api/list/condition`, `GET /api/condition/:id`, `PUT`, `POST`, `GET /api/export/condition_items` |
| `EPIC_BOSS_POOL` | none | Add `GET /api/list/epic_boss`, `GET /api/epic_boss/:id`, `PUT`, `POST` |
| `FISH_POOL` + `NIGHT_FISH_POOL` | `GET /api/fish`, `GET /api/fish/:id`, `POST` | Add `GET /api/export/fish_pool` |
| `LAKE_MAGIC_DB` | `GET /api/lake-magic`, `GET /api/lake-magic/:id`, `POST` | Add `GET /api/export/lake_magic` |
| `NPC_DIALOGUES` | `GET /api/list/npc`, `GET /api/npc/:id` | Add `PUT /api/npc/:id/dialogue` (per-state patch) |
| `FROBERGER_JOURNAL` | none | Add `GET /api/list/journal`, `GET /api/journal/:id`, `POST /api/journal` |
| `_S_DEFAULTS` | none | Add `GET /api/defaults` — read-only snapshot of all 194 story flags with types and defaults |

### §WBAPI-01-C. `GET /api/export/:collection` — Raw JS Literal Endpoint

Returns the named constant as a raw JS literal string that can be pasted directly into `roll2hit-v3.html` or `require()`d by a Node script:

```bash
# Export full WORLD_DB as pasteable JS literal
./api.sh export world_db

# Export MONSTER_POOL as JSON
./api.sh export monster_pool --format json

# Export all collections as a standalone Node module
./api.sh export all --format module --out world.js
node -e "const W = require('./world.js'); console.log(Object.keys(W.MONSTER_POOL).length);"
```

`?format=module` wraps the export in `module.exports = { NODE_MAP, QUEST_DB, MONSTER_POOL, ... }` so it runs on Node without a browser.

### §WBAPI-01-D. `POST /api/terrain` — Create Terrain Entry

```bash
./api.sh post terrain key=forum_romanum label="Forum Romanum — Ancient Civic Heart" \
  icon=🏛 monsters='["golem","graveir","penitent","higher_vampire"]'
```

Server validates monster keys against `MONSTER_POOL`, writes entry to `WORLD_DB` anchor block, calls `POST /api/save` automatically.

### §WBAPI-01-E. API-First Workflow — Reference Curl Sequences

**Add a terrain entry:**
```bash
./api.sh post terrain key=new_terrain label="New Place" icon=🗺 monsters='["goblin","bandit"]'
./wbapi-toggle.sh restart
./api.sh audit
```

**Create a quest (NPC required):**
```bash
./api.sh post quest id=quest_my_01 type=main npc=aldric title="My Quest" \
  activateNode=CY objectiveText="Do the thing."
```

**Inspect before planning:**
```bash
./api.sh audit --raw | jq '.items[] | select(.level=="error")'
./api.sh list terrain --raw | jq '.[].key'
./api.sh list node --raw | jq '.[].code'
```

### §WBAPI-01-F. Implementation Checklist

- [ ] **Phase 1 — Create endpoints for missing types:** *(partial — terrain + monster done)*
  - [x] `POST /api/terrain` — *(✅ implemented)*
  - [x] `POST /api/monster` — *(✅ implemented)*
  - [ ] `GET /api/list/condition` + `GET /api/condition/:id` + `PUT` + `POST`
  - [ ] `GET /api/list/epic_boss` + `GET /api/epic_boss/:id`
  - [ ] `GET /api/list/journal` + `GET /api/journal/:id` + `POST /api/journal`
  - [x] `GET /api/flags` — read all `_S_DEFAULTS` flags. *(✅ implemented as `GET /api/flags` + `POST /api/flags`)*

- [x] **Phase 2 — Export endpoints:** *(✅ implemented)*
  - [x] `GET /api/export/:collection` — `node_map`, `quest_db`, `monster_pool`, `monster_drops`, `world_db`, `fish_pool`, `lake_magic`, `condition_items` *(✅)*
  - [x] `?format=json` (default) — JSON array/object *(✅)*
  - [x] `?format=js` — raw JS literal *(✅)*
  - [x] `?format=module` — `module.exports = { ... }` wrapper for Node require *(✅)*

- [ ] **Phase 3 — Full-array PATCH:**
  - [ ] `PUT /api/collection/:name` — replace or deep-merge a complete named constant
  - [ ] Validates structure against known schema before writing
  - [ ] Backs up original block to `.bak` comment before writing

- [ ] **Phase 4 — worldbuilder.html write tab:**
  - [ ] "Create" forms for terrain, monster, quest using API-first workflow
  - [ ] Shows curl equivalent for each action (copy button)
  - [ ] "Export" panel: select collection, format, download or copy to clipboard

- [ ] **Phase 5 — Standalone Node module:**
  - [ ] `GET /api/export/all?format=module` produces a complete game-logic module
  - [ ] Add `wbapi-extract.js` CLI: `node wbapi-extract.js --out=world.js` (no server needed; reads HTML directly like `parse-nodes.js`)
  - [ ] Document how to run game logic in Node: `const W = require('./world.js'); W.NODE_MAP['CY']`

---

## §1367 — The Year Is 1367 AD: Historical Setting Canon (📋 PLANNED)

**Canonical game year: 1367 AD.**

All in-game time, political factions, cities, trade routes, and named historical figures should be consistent with the world as it existed in 1367 AD. This section maps the six major historical events of that year to quest design opportunities, and poses the clarification questions that must be answered before integration begins.

---

### §1367-A. Historical Anchor — What Was True in 1367 AD

| Event | Where | Significance to the game |
|-------|-------|--------------------------|
| **Battle of Nájera** (Apr 3) | Castile, Spain | Edward the Black Prince leads English mercenaries to victory. Routier companies are everywhere. |
| **Tamerlane rising** | Transoxiana (Central Asia) | 31 years old, consolidating power. The eastern threat is not yet war — it is whisper and rumor. |
| **Ottoman expansion** | Balkans | Murad I holds Adrianople (Edirne) as European capital. The Balkans are actively contested. |
| **Hanseatic League peak** | Baltic / North Sea | Birka and Visby are Hanseatic-adjacent cities. Trade, wool, amber, salt, herring. Political leverage. |
| **John Wycliffe at Oxford** | England | Early heresy. Questioning papal authority. Not yet condemned — dangerous ideas moving through clergy. |
| **Black Death aftermath** | All of Europe | ~1/3 of Europe dead since 1347. Cities undermanned. Inheritance disputes. Plague pits. Survivor guilt. |

**Visby note:** Visby was sacked by Valdemar IV of Denmark in 1361. By 1367 it is six years into its decline from a Hanseatic powerhouse to a contested, partially ruined port. This is already in the game — the arc structure fits perfectly.

**Birka note:** Historically Birka was abandoned ~970 AD. In this game it is treated as a persistent fictional city in the Hanseatic Baltic world, elevated to 1367 status. No apology needed — this is D&D 5e, not a textbook.

---

### §1367-B. The Six Events as Quest Seeds

#### 1. The Routiers — Mercenary Companies (from Nájera)

The *routiers* (French) and *condottieri* (Italian) are freelance mercenary bands roaming Europe after every truce and treaty. They are soldiers with no war — dangerous, experienced, and available for hire or extortion.

**Design seed:** A routier company has set up near a node and is extracting "protection" from local merchants. The player can fight them, hire them, or expose who is paying them. One routier captain may be a named NPC with a Hundred Years' War backstory.

**Clarification needed:**
- [ ] Is the routier faction a one-off quest or a recurring faction with multiple nodes?
- [ ] Does the Black Prince himself appear (as NPC, rumor, or distant authority), or only his soldiers?
- [ ] Do routiers have a home node, or do they migrate between nodes seasonally?

---

#### 2. Tamerlane — The Eastern Whisper

Tamerlane is not yet the destroyer of cities he will become by 1380. In 1367 he is a warlord consolidating Transoxiana — present as rumor, refugee, and displaced scholar rather than direct threat.

**Design seed:** A refugee scholar from Samarkand arrives at a Mediterranean node carrying a scroll Tamerlane's men were hunting. The scroll contains something (a map, a heresy, a formula). The quest is to understand what it contains before Tamerlane's agents arrive.

**Clarification needed:**
- [ ] Is Tamerlane a named villain who eventually appears (in a late-act node), or kept permanently offscreen as rumor?
- [ ] Does the eastern threat connect to the Shattered Codex arc (the Codex itself could be what Tamerlane seeks)?
- [ ] Which node receives the Samarkand scholar — a Mediterranean city (Jerusalem, Athens) or a trade hub (Visby, a Hanseatic port)?

---

#### 3. The Ottoman Balkans — Murad I's Expansion

The Balkans in 1367 are a patchwork of contested Christian kingdoms and Ottoman-held territory. Adrianople is Ottoman. Murad I is methodical and patient. Local Serbian and Bulgarian lords are making desperate deals.

**Design seed:** A Balkan noble is at a node, negotiating secretly with an Ottoman envoy. The player stumbles into this. The quest branches: expose the negotiation (destabilize the region, gain a reward from the Church), assist it (gain Ottoman favor, anger the Church), or steal the treaty document and sell it to the highest bidder.

**Clarification needed:**
- [ ] Does the Ottoman faction have a node on the map, or appear only as quest NPCs?
- [ ] Is Murad I a named NPC (distant, political) or kept as a historical backdrop force?
- [ ] Does the Balkan arc connect to the existing Middle East map nodes (Jerusalem, Athens)?

---

#### 4. The Hanseatic League — Trade as Power

The Hanseatic League in 1367 is at its apex. It controls Baltic and North Sea trade — wool, herring, amber, salt, timber. It has its own navy, its own legal system, and its own foreign policy. Birka and Visby sit in its orbit.

**Design seed:** A Hanseatic factor (merchant-agent) at Birka is withholding grain shipments to a northern node as a political lever. The local population is hungry. The quest is to break the embargo — by theft, negotiation, forgery of trade documents, or finding an alternative supply route.

**Clarification needed:**
- [ ] Is the Hanseatic League a faction with a disposition score (like a merchant guild), or purely quest-context flavor?
- [ ] Does Visby's 1361 sacking appear as past lore in node descriptions, or as an active unresolved quest arc?
- [ ] Are there Hanseatic trade route nodes — ports along the Baltic coast — that should be added to the map?

---

#### 5. John Wycliffe — The Heresy at Oxford

Wycliffe is teaching that the Bible should be in English (not Latin), that the Pope's temporal power is illegitimate, and that clergy who sin forfeit their authority. This is not yet the Protestant Reformation — it is one dangerous scholar at one university, and the Church is watching.

**Design seed:** A traveling friar arrives at a node carrying a handwritten pamphlet in the vernacular. He asks the player to deliver it to a local monastery without the bishop's men intercepting it. The pamphlet's content is Wycliffe's argument — the player may read it, burn it, deliver it, or sell it to the bishop.

**Clarification needed:**
- [ ] Is Wycliffe's heresy a single quest or a recurring philosophical thread (a book that reappears across acts)?
- [ ] Does the Church appear as an antagonist faction with quests on both sides (heresy vs. orthodoxy)?
- [ ] Does this connect to the existing Codex arc — could the Shattered Codex itself be a suppressed vernacular scripture?

---

#### 6. The Black Death Aftermath — The Hollow World

By 1367 the first wave is twenty years past but recurring outbreaks continue. One third of Europe is dead. The survivors live in a world of:
- Inherited land with no heirs — abandoned manor nodes
- Flagellant processions — NPCs performing public penance
- Plague pits that were never properly sealed
- Labor scarcity — peasants have leverage they never had before
- Survivor guilt — characters who lived when their families did not

**Design seed:** A node has been abandoned — its population died in a 1363 recurrence. A merchant wants to claim the land. The player must clear the node (the dead were not buried correctly — undead encounter), determine who the legal heir is (a quest chain through Church records), and decide who gets the land: the merchant, the distant heir, or the Church.

**Clarification needed:**
- [ ] Does plague appear as an active mechanic (infection risk, quarantine nodes), or only as historical backdrop in node descriptions?
- [ ] Are flagellants an NPC type — wandering, hostile to merchants and rationalists, occasionally violent?
- [ ] Does the abandoned node exist as a map location (a hollow/ruined terrain type), or only in quest flavor text?

---

### §1367-C. Universal Setting Directives

Once the above clarifications are resolved, these changes become universal across the game:

1. **Year stamp** — add `const GAME_YEAR = 1367;` to `_S_DEFAULTS`. Display in UI as "Anno Domini MCCCLXVII" or simply "1367 AD" in appropriate nodes.

2. **Node description anachronism audit** — scan all 144 node `desc` fields for technology, language, or political references inconsistent with 1367 AD. Flag and rewrite.

3. **Faction system** — introduce a lightweight faction disposition table for: `Hanseatic League`, `The Church`, `Ottoman Court`, `Routier Companies`, `Crown of England`. Each quest that touches a faction shifts disposition ±1. Disposition gates certain quest options.

4. **Calendar events** — the Battle of Nájera is April 3. If the game tracks months (via the existing hour system), certain historical events could trigger as the player's in-game date passes the anniversary. Optional.

5. **Named historical figures as NPCs** — candidates: Edward the Black Prince (distant authority, Nájera rumor), John Wycliffe (the scholar, Oxford), Murad I (Ottoman envoy, not direct), Tamerlane (offscreen threat, refugee NPCs only). None appear as combatants in Act I.

---

### §1367-D. Clarification Queue — **ANSWERED ✓**

All 8 questions answered. Integration may proceed.

| # | Question | **Answer** |
|---|----------|-----------|
| 1 | Literal 1367 or fantasy-analog? | **Literal.** Real place names kept — Birka, Visby, Adrianople, Ragusa, Oxford, Castile. This is 1367 AD on the actual Earth, rendered as a D&D 5e adventure world. |
| 2 | Which events become major arcs? | **All 6.** Every event ties to existing node codes. No event is background-only. Each vignette becomes a quest arc anchored to a node already on the map or a new Baltic trade node. |
| 3 | Historical figures as NPCs or offscreen? | **Named NPCs, on stage.** The Black Prince, Wycliffe, Murad I, and Tamerlane appear as named figures the player can encounter, receive orders from, or work against. Not combatants in Act I — they are distant authority or quest-givers. By Act III they are present. |
| 4 | Black Death gameplay mechanic or lore only? | **Full mechanic.** Plague Walkers are combat encounters. Infection is a state flag (`plague_exposed`). Exposure triggers a CON save (DC 13). Failed save adds `Exhaustion 1` and a mission bit. Cure requires a quest. Nodes in the aftermath zone have modified monster tables. |
| 5 | Hanseatic League faction disposition? | **Yes.** `faction_hansa` disposition score (−5 to +5). Affects: trade quest availability, node entry permissions in Baltic ports, NPC dialogue, prices. Score changes on quest outcomes. |
| 6 | Tamerlane connects to the Shattered Codex? | **Yes.** The Codex fragments originate in Transoxiana. Tamerlane's consolidation of Samarkand scattered its keepers westward — that is why the Codex is shattered and its pieces are in Europe. The Codex backstory gains a paragraph pointing east. |
| 7 | Add Baltic coast trade route nodes? | **Yes, more trade routes.** New nodes: Lübeck (LB), Danzig (DZ), Riga (RG), Bruges corridor waypoint (BG). Connected to existing Birka (BK) and Visby (VS) nodes. Trade route quest chain threads through all of them. |
| 8 | Church as dual-sided faction? | **Yes — and more.** The Church is not just a faction: it is the total human condition. Devotion, allegiance, fear, mercy, guilt, transcendence. Two sub-tracks: `faith_orthodox` (inquisitor, bishop, pilgrim quests) and `faith_reform` (Wycliffe pamphlet, itinerant preacher, heresy trial quests). A third track `faith_folk` covers saints, relics, magic springs, and monster-lore. All three interact. A player deep in `faith_folk` gets different dialogue from priests than a player deep in `faith_orthodox`. Monster encounters in church ruins have modified outcomes based on faith tracks. Fantasy and adventure — especially those with monsters — live inside the religious world of 1367, not outside it. |

### §1367-E. Locked Design Decisions (derived from answers)

1. **`const GAME_YEAR = 1367;`** added to `_S_DEFAULTS`. Display: `"Anno Domini MCCCLXVII"`.
2. **Plague mechanic:** `plague_exposed` flag + CON DC 13 save + `Exhaustion 1` mission bit. Cure quest required to clear.
3. **Hanseatic faction:** `faction_hansa` score (−5 to +5) stored in player state. Affects trade nodes BK, VS, LB, DZ, RG, BG.
4. **Faith triple-track:** `faith_orthodox`, `faith_reform`, `faith_folk` — each ±5. Stored in player state. Affects NPC dialogue, quest availability, monster encounter modifiers.
5. **New nodes to add:** LB (Lübeck), DZ (Danzig), RG (Riga), BG (Bruges waypoint) — trade route chain.
6. **Shattered Codex backstory:** Add one paragraph in Codex lore pointing origin to Transoxiana/Samarkand. Tamerlane's rise as the inciting event that scattered keepers westward.
7. **Historical NPCs in NPC schema:** Add Black Prince (BP), John Wycliffe (JW), Murad I (MI), Tamerlane (TL) to `BIRKA_NPCS` or equivalent NPC table.
8. **All 6 vignettes from `Year1367AD.md`** map to QUEST_DB entries. Node codes from those vignettes are authoritative.
9. **Node `LXVII67` — The Jester's Crossroads.** Secret easter egg node. `faith_folk` only. See §1367-F.

---

### §1367-F. Node LXVII67 — The Double Dab Faith Puzzle

**Code:** `LXVII67`  
**Name:** The Jester's Crossroads  
**Label:** LXVII  
**Faith track:** `faith_folk` (gated — requires `faith_folk >= 1` to enter)  
**API easter egg:** `GET /api/67` — returns node metadata and the puzzle hint

**The Lore:**  
At the edge of a forest road stands a painted post. No sign. A jester sits on a stone beside it, tossing a coin. He does not speak first. He does not ask a question aloud. He holds up two fingers — not in greeting, not in peace. Just two. Then he looks away.

**The Mechanic — Double Dab:**  
Two characters must each arrive at this node **separately** (not as a group action, no Help action allowed) and each independently:

1. **Self-serve:** Make a DC 10 Wisdom (Insight) check alone. No assistance.  
2. **Answer the unasked question:** Choose an option the jester never voiced. The correct answer is 67. It is not listed anywhere. It must be known.

On the **first** successful solo arrival → `faith_folk_seed` mission bit granted. Jester nods once.  
On the **second** successful solo arrival (same or different character) → `faith_folk_dab` mission bit granted. Jester dabs. The post opens. Reward drops.

**The Reward:**  
- `faith_folk +2` for both characters  
- A carved wooden coin stamped `LXVII` — a misc inventory item, no mechanical value, infinite bragging rights  
- Unlocks the jester as a recurring NPC in other `faith_folk` nodes (he remembers you)

**Quest entry:**
```
id:            quest_lxvii67
type:          skill_check
title:         The Jester's Crossroads
activateNode:  LXVII67
dc:            10
skill:         Wisdom (Insight)
retryable:     true
retryGateDays: 0
missionBits:   [faith_folk_seed, faith_folk_dab]
notes:         Two solo attempts required. No Help action. No hints given in-game.
```

**`GET /api/67`** returns:
```json
{
  "ok": true,
  "year": 1367,
  "leet": 1337,
  "port": 1367,
  "node": "LXVII67",
  "note": "67 > 69. self-serve. double dab. taps chest.",
  "faith": "faith_folk",
  "puzzle": "two must arrive alone and answer the same question without conferring. the jester does not ask it aloud.",
  "dab": "⁶⁷"
}
```

---

**Status:** ✅ ANSWERED — integration may begin  
**Cross-references:** `plan.md §GR` · `plan.md §FUTURE-01` (Saul to Paul arc, Middle East map) · `quest.md` · `lab-report-wbapi-evolution.md` · `Year1367AD.md`

---

## §TTS — macOS Text-to-Speech Session Protocol

When working in this project, Claude should follow these TTS conventions so the user can monitor progress without watching the screen.

### Git commits

After every `git commit`, run `say` with the commit message before moving on:

```bash
git commit -m "message" && say "message"
```

The automated hook in `~/.claude/settings.json` also fires `say` with the committed file names and a pipeline seed count after each commit.

### Asking the user to continue

Whenever the protocol calls for asking the user to type "continue" (e.g. mid-book processing, end of a work block, or before a major next step), first run:

```bash
say "continue, continue, continue!"
```

Then output the written prompt. This lets the user hear the pause point without reading the screen.

### Example — end of a processing pass

```bash
say "continue, continue, continue!"
# then output: "FCO part 2/3 done — Books 4–8 covered. Type 'continue' for part 3."
```

### Data audit loop — api-data-audit.md

The audit loop (`api-data-audit.md`) runs `/api/next-error` to find missing quest text and patches it via PUT. Each PUT now uses `saveAndVerify` (saves, reloads in-memory, confirms the written value — no process restart, no silent failures). The loop runs until `found: false` on both errors and warnings.

After each book completes:

```bash
git add -A && git commit -m "BOOK IMPORTED — BookName: N quests patched"
say "Book done. Commit sent. Continuing loop." &
```

Mid-loop after each individual PUT, speak the result:

```bash
say "Fixed quest_id. Verified on disk." &
```

Run `say` blocking — no `&` — so each announcement completes before the next request. Always announce commits and loop transitions out loud.

---

## §AUDIT-02 — NPC/Quest Connection Gap (📋 INVESTIGATE)

**Logged:** 2026-06-05 — discovered via new `./api.sh audit` validator rules  
**Status:** 📋 INVESTIGATE — do not fix blindly; understand patterns first

### Finding 1: 985 quests have no `npc` field (ERROR)

Every quest must be anchored to an NPC. The validator now flags this as an ERROR. The scope breaks down as:

**All 21 completed book imports — 35 quests each, 0 NPCs wired:**

| Book arc | Quests missing npc |
|----------|--------------------|
| lhr, lcy, lgw, gci, inv, bhd, sdq, plw, gdn, boo | 35 each |
| alf, ksu, cdg, vie, erf, hft, rkv, ost, arn, vby, rix | 35 each |
| blq (Decameron — partial) | 20 |

**Legacy arcs (pre-import, never had NPCs):**

| Arc | Count |
|-----|-------|
| quest (misc 24 unnamed) | 24 |
| quest_wis | 8 |
| mq (main quests) | 7 |
| quest_alch | 7 |
| quest_whisper, quest_glut, quest_wane, quest_inn, quest_cat, quest_tour | 6 each |

**Root cause:** The import scripts (`import_*.py`) created quest stubs but never populated `npc`. The NPC role was implicit in the vignette text but not stored as a structured field.

**Investigation questions before fixing:**
1. Do the book-arc nodes (e.g. `LHR`, `LCY`) already have NPCs registered in BIRKA_NPC who should own these quests?
2. For arcs with no named NPC, should a new NPC be created per-arc, or should quests reference the inline `node.npc` string?
3. Can `./api.sh list npc --node {CODE}` for each arc's `activateNode` reveal an already-registered NPC to wire in?

**Suggested fix workflow (when ready):**
```bash
# For each book arc, find the node and any existing NPC:
./api.sh location LHR     # shows NPCs registered at that node
./api.sh list npc --node LHR
# If an NPC exists, patch all quests for that arc:
./api.sh list quest --node LHR --raw | jq '.[].id' | xargs -I{} ./api.sh put quest {} npc=yael
# Run audit after each arc to confirm errors reduce
./api.sh audit --raw | jq '.errors | length'
```

---

### Finding 2: 13 NPCs have no quests (WARNING)

These NPCs exist in BIRKA_NPC with full dialogue entries but give no quests. They have no gameplay function beyond ambient dialogue.

| NPC key | Name | Node | Notes |
|---------|------|------|-------|
| `yael` | Guard Captain Yael Scheidemann | LHR | Core Birka — has NPC_DIALOGUES arc; quest arc planned (§CEREMONIA-03?) |
| `brynn` | Innkeeper Brynn Clerambault | TLL | Core Birka — has NPC_DIALOGUES arc; quest arc planned |
| `quill` | Bard Tomas Couperin | MHQ | Core Birka — has NPC_DIALOGUES arc; quest arc planned |
| `pachelbel` | Fence Pachelbel | LLA | Core Birka — has NPC_DIALOGUES; fencing/trade arc unwritten |
| `crov` | Pit Master Weckmann | HKG | Core Birka — pit combat arena NPC |
| `auros` | Commander Seraphine Bruhns | HKG | Core Birka — has story arc notes elsewhere |
| `ser_bardo` | Ser Bardo Albizzi | PSAGLD | Decameron import — created as NPC stub, no quests written yet |
| `ser_taddeo` | Ser Taddeo Borghini | PISNOT | Decameron import — same |
| `abramo_simone` | Abramo di Simone | GENWHS | Decameron import — same |
| `lapo_matteo` | Lapo di Ser Matteo | PSAFAB | Decameron import — same |
| `kyriakos_philanthropenos` | Kyriakos Philanthropenos | TRB | Book import stub |
| `georgios_sphrantzes` | Georgios Sphrantzes | CON | Book import stub — Byzantine node |
| `hamid_al_sarakhsi` | Hamid al-Sarakhsi | MRV | Book import stub |

**Two distinct groups:**

- **Core Birka 6 (yael/brynn/quill/pachelbel/crov/auros):** These are deeply characterised. They have NPC_DIALOGUES, story arcs planned in other §sections, and are waiting for their quest arcs to be written. Do not add placeholder quests. Write the real arcs.
- **Book-import stubs (ser_bardo etc.):** Created during Decameron/Byzantine imports. The quests exist in QUEST_DB but have no `npc` field pointing back to them (Finding 1). Fix: wire the existing quests → NPC, not create new quests.

**Quick check to run when investigating:**
```bash
# See what quests activate at each orphaned NPC's node:
./api.sh location PSAGLD    # ser_bardo's node — what quests are already there?
./api.sh location CON        # georgios_sphrantzes — Byzantine node
./api.sh --ai "which quests at node CON have no NPC, and which NPC at CON should own them?"
```

---

---

## §CELL — Overland MUD Cell-Map Redesign

> **Vision:** Roll2Hit becomes a MUD. The world map is a grid of cells. You walk one cell at a time — N, E, S, W — with no teleporting, no corridor warps, no junction-hopping. Every location is identified by its row/column position. Connections between locations are not stored in data — they are derived at runtime from physical adjacency. The server supports multiple simultaneous players. This is a traditional overland MUD with a 1367 AD skin.

**Design Principles:**
1. **Cell = atom.** All navigation is one cell per move. No concept of "distance ≥ 3 = corridor."
2. **Coordinate = identity.** A location's primary key is `(r, c)`. The two-letter code is a lookup alias, not a link pointer.
3. **No explicit edges.** `N`, `E`, `S`, `W` fields are removed from `NODE_MAP`. The engine computes neighbors by `(r-1,c)`, `(r,c+1)`, `(r+1,c)`, `(r,c-1)`.
4. **No junctions.** Auto-spawned J-nodes are abolished. Place real content or leave cells empty. Empty cells are traversable terrain (encounters possible, no quests).
5. **Live derivation.** Anything the old system computed from N/E/S/W links (BFS paths, heatmaps, reachability) is recomputed from the live 2D grid.
6. **MUD server.** `wbapi-server.js` gains a session layer: multiple players, each with a live `(r, c)` position, can connect and move concurrently.

---

### §CELL-01: Core Data Schema — Remove Explicit Edge Fields ✅ COMPLETE (2026-06-14)

**What changes:** Strip `N`, `E`, `S`, `W`, `SW`, `spire`, `portal` direction fields from every `NODE_MAP` entry. Each node becomes a self-describing record with only position + content.

**New minimum node record:**
```js
CODE: {
  code:    'CODE',      // 2–4 char lookup alias
  r:       <int>,       // row (1–N, north = 1)
  c:       <int>,       // column (1–M, west = 1)
  name:    '<terrain>', // WORLD_DB terrain key
  label:   '<str>',     // display name
  act:     <1–8>,
  text:    '<str>',     // story text (empty cells have no text)
  npc:     '<str>|null',
  battle:  {…}|null,
  loot:    '<str>|null',
  sleep:   <bool>,
  sleepCost: <int>,
  // Optional flags (no navigation role):
  junction:            // REMOVED — no more junction concept
  isEpicBattleground:  true,
  isFishingLake:       true,
  bossKey:             '<str>',
}
```

**Files to change:**
- `roll2hit-v3.html` — strip `N/E/S/W/SW/spire/portal` from all `NODE_MAP` entries
- `wbapi-server.js` — remove all code that reads/writes `node.N`, `node.E`, `node.S`, `node.W`
- `docs-node-network.md` — rewrite Section 3 (Connection Object) with new schema
- `maps.md` — remove N/E/S/W column from the full node table

**Migration path:** Do not change node codes or `r/c` values. Only strip the direction pointers. All ~449 nodes already have `r` and `c` in `NODE_COORDS` — that data stays as-is and becomes the sole position authority.

**Verification:** `./api.sh audit` should pass with 0 edge-related errors after this change. A grep for `\.N\b|\.E\b|\.S\b|\.W\b` on node reads in JS should return only combat stats (not direction reads).

---

### §CELL-02: CELL_GRID Registry ✅ COMPLETE (2026-06-13)

**What changes:** Add a `CELL_GRID` lookup that maps `(r, c)` → node code (or `null`). This replaces the role of N/E/S/W as the movement routing table.

**Data structure:**
```js
// Computed at game start from NODE_MAP entries
const CELL_GRID = {};  // key: "r,c" → 'CODE' | null
for (const code of Object.keys(NODE_MAP)) {
  const node = NODE_MAP[code];
  if (node.r != null && node.c != null) {
    CELL_GRID[`${node.r},${node.c}`] = code;
  }
}

// Also define passability: water cells are impassable
// WATER_CELLS: Set of "r,c" strings read from the existing WW grid
```

**Passability rules:**
- Cell occupied by a node → passable, player enters that node
- Cell not in CELL_GRID but within map bounds → "open terrain" (passable, no node, random encounter possible)
- Cell outside map bounds → blocked ("You reach the edge of the known world.")
- Cell explicitly water (derived from existing `WW` grid in `maps.md`) → blocked ("The sea is impassable on foot.")

**Where to store WATER_CELLS:** Add `IMPASSABLE_CELLS` as a `Set` of `"r,c"` strings, populated from the WW cells in the existing 26×16 grid definition (already documented in maps.md).

**Files to change:**
- `roll2hit-v3.html` — add `CELL_GRID` and `IMPASSABLE_CELLS` constants, populated on `DOMContentLoaded`
- `wbapi-server.js` — add `buildCellGrid(nm)` helper that builds the same map from the live `NODE_MAP`
- `spec-world.md` — add CELL_GRID and IMPASSABLE_CELLS to the constants reference

---

### §CELL-03: Movement Engine Rewrite — storyMove → cellMove ✅ COMPLETE (2026-06-13)

**What changes:** Replace `storyMove(dir)` with `cellMove(dir)`. Remove all corridor travel logic. Every move is strictly `(r±1, c)` or `(r, c±1)`.

**Current system (to remove):**
- `storyMove(dir)` — reads `NODE_MAP[current].N/E/S/W` to find destination
- Corridor distance check: `if (dist >= 3) _showCorridorPrompt(…)`
- `_showCorridorPrompt(from, to, dir)` — "Time-Warp Footpath" overlay
- `storyCorridorTravel(from, to, dir)` — warp/hunt choice
- `CORRIDOR_TERRAIN` constant — terrain per corridor pair
- `CORRIDOR_CELLS` constant — computed corridor grid

**New system:**
```js
function cellMove(dir) {
  const deltas = { N:[-1,0], S:[1,0], E:[0,1], W:[0,-1] };
  const [dr, dc] = deltas[dir];
  const nr = S_story.playerR + dr;
  const nc = S_story.playerC + dc;

  if (isOutOfBounds(nr, nc))   return _showMsg("You reach the edge of the known world.");
  if (IMPASSABLE_CELLS.has(`${nr},${nc}`)) return _showMsg("The sea is impassable on foot.");

  const destCode = CELL_GRID[`${nr},${nc}`];
  S_story.playerR = nr;
  S_story.playerC = nc;

  if (destCode && NODE_MAP[destCode]) {
    S_story.node = destCode;
    _enterNode(destCode);         // existing node entry logic
  } else {
    _enterEmptyCell(nr, nc);      // new: open terrain cell
  }
}
```

**State fields to add:**
- `S_story.playerR` — current row (replaces implicit derivation from `S_story.node`)
- `S_story.playerC` — current column (same)
- These are always kept in sync: on `_enterNode(code)` → set `playerR = NODE_MAP[code].r`, `playerC = NODE_MAP[code].c`

**Files to change:**
- `roll2hit-v3.html` — replace `storyMove` with `cellMove`; remove `_showCorridorPrompt`, `storyCorridorTravel`, `CORRIDOR_TERRAIN`, `CORRIDOR_CELLS`
- `docs-node-network.md` — rewrite Section 4 (Corridor Travel System) as Section 4 (Cell Movement)
- `mechanics.md` — remove corridor/warp/hunt travel description
- `spec-corridors.md` — mark SUPERSEDED; add note pointing to §CELL-03

---

### §CELL-04: Empty Cell Traversal ✅ COMPLETE (2026-06-13)

**What changes:** When the player moves to a cell with no node (`CELL_GRID` miss), the game describes the terrain and allows random encounters. This replaces junctions as the "routing glue" of the map.

**Empty cell behavior:**
```js
function _enterEmptyCell(r, c) {
  const terrain = _inferTerrain(r, c);  // from neighboring nodes / zone
  const zone    = _inferZone(r, c);
  _renderEmptyCellUI(r, c, terrain, zone);
  // Random encounter: same probability as corridor Hunt, based on terrain
  if (Math.random() < TERRAIN_ENCOUNTER_RATE[terrain]) {
    _triggerWildEncounter(terrain);
  }
}
```

**Terrain inference (`_inferTerrain`):**
- Check N/E/S/W neighbors in CELL_GRID; return majority terrain, or nearest node's terrain
- Fallback: zone-based default from `ZONE_DEFAULT_TERRAIN` (arctic→arctic, midlands→midlands, etc.)

**Empty cell display:**
- Show coordinates: `[R:${r} C:${c}]` — a MUD-style position indicator
- Show compass: which of N/E/S/W have nodes visible (within 1 cell)
- Short ambient description from terrain type (not story text — just "Open plains stretch in every direction.")
- Available actions: move N/E/S/W, look, camp (short rest if applicable)

**Files to change:**
- `roll2hit-v3.html` — add `_enterEmptyCell`, `_inferTerrain`, `_inferZone`, `_renderEmptyCellUI`, `ZONE_DEFAULT_TERRAIN`, `TERRAIN_ENCOUNTER_RATE`
- `mechanics.md` — document empty cell traversal rules

---

### §CELL-05: Abolish Junction Nodes ✅ COMPLETE (partial — see §CELL-05b)

> **§CELL-05b needed:** 268 J-stubs with `junction:false` and no `r,c` survived the bulk-delete (endpoint only targeted `junction:true`). They're inert (not in `CELL_GRID`, unreachable by `cellMove`) but should be purged. Add `POST /api/admin/delete-junction-terrain` that deletes all nodes where `name === 'junction'` AND `!node.r`. Run before §CELL-06.

**What changes:** Remove all J-nodes (J1–J7 in old system; auto-spawned J##### in current system). Any J-node that exists in `NODE_MAP` becomes either:
  - (a) **Promoted** to a named location with content (text, encounter), OR
  - (b) **Deleted** — the cell becomes an empty traversable cell handled by §CELL-04

**Decision rule for each J-node:**
1. Does the cell sit on an important geographic path (mountain pass, ford, crossroads)? → Write a short text and terrain, promote to named location.
2. Is it a pure routing stub with no geographic significance? → Delete. The grid handles routing now.

**In wbapi-server.js:**
- Remove all `junction: true` logic from audit, heatmap, density, and reweave passes
- Remove `_spawnJunction` / auto-junction-creation endpoints
- Remove "spawn junctions every X" heuristic from any map generation

**In roll2hit-v3.html:**
- Remove `junction: true` flag handling from `_enterNode`, `_renderMiniMap`, minimap CSS classes
- Remove `junction` terrain from `WORLD_DB` (the `junction: { label:'Crossroads Junction' …}` entry)

**Files to change:**
- `roll2hit-v3.html` — remove junction handling
- `wbapi-server.js` — remove junction spawn logic, junction audit passes
- `maps.md` — remove Junction Nodes section
- `docs-node-network.md` — remove Node Types table row for junctions
- `lab-report-junction-reweave-overhaul.md` — add §SUPERSEDED note

---

### §CELL-06: BFS and Heatmap — Grid Walk Rewrite ✅ 2026-06-14

> **Urgency note:** The server-side snail's `bfsPath` reads `nm[cur]?.[d]` (node.N/S/E/W). After §CELL-01 stripped those fields from stored HTML, `bfsPath` returns `[]` for every query. The reweave-all endpoint is **currently broken**. §CELL-06 fixes this.

**Code locations in `wbapi-server.js` to change (grounded, 2026-06-14):**

| Location | Line | What to change |
|----------|------|---------------|
| `undirAdj` build loop | ~4050–4060 | Replace `node[d]` loop with CELL_GRID neighbor probe |
| `degree()` function | ~4061 | Count CELL_GRID cardinal neighbors instead of `n[d]` slots |
| `freeDirs()` function | ~4066 | Remove (slot concept gone — grid has no "free" direction) |
| `/api/graph/reachability` BFS | ~4173 | Already uses `undirAdj` — fixing `undirAdj` fixes this |
| Snail `bfsPath(from,to)` | ~7196 | Replace `DIRS4` edge-walk with grid BFS using `coords` + `buildCellGrid` |
| Snail `walk3` | ~7294 | **DELETE** — walk3 heated junction nodes; no junctions remain |
| Reweave-all `bfsPath` | ~5860 | Same replacement as snail bfsPath |
| Reweave-all degree functions | ~5087, 5165, 5325, 5359 | Replace with CELL_GRID neighbor count |
| Reweave-all `freeSlots` | ~5110, 5187, 5336 | Remove (no edge slots in grid system) |
| Bidirectional audit check | ~2466–2476 | **DELETE** — grid implies bidirectionality |
| Bidirectional fix endpoint | ~2940 | **DELETE** |
| `linkedNodes` in GET /api/node | ~258 | Replace with `derived_exits` from CELL_GRID neighbors |

**`buildCellGrid(nm, coords)`** already exists at line 2517. A module-level `const MOVES4 = [[-1,0],[1,0],[0,1],[0,-1]];` needs to be added near it.

**New BFS pattern (replaces all DIRS4 node-edge walks):**
```js
const cellGrid = buildCellGrid(nm, WBAPI.nodeCoords);
const MOVES4   = [[-1,0],[1,0],[0,1],[0,-1]];

function gridBfsPath(fromCode, toCode) {
  const coords = WBAPI.nodeCoords;
  const start = coords[fromCode]; const end = coords[toCode];
  if (!start || !end) return [];
  const prev = new Map(); prev.set(`${start.r},${start.c}`, null);
  const queue = [start];
  while (queue.length) {
    const {r, c} = queue.shift();
    for (const [dr,dc] of MOVES4) {
      const nr=r+dr, nc=c+dc;
      const k=`${nr},${nc}`;
      if (prev.has(k) || nr<1 || nc<1 || nr>300 || nc>300) continue;
      prev.set(k, {r,c});
      if (nr===end.r && nc===end.c) {
        // Reconstruct path of node codes only
        const path=[]; let cur={r:nr,c:nc};
        while (cur) {
          const code=cellGrid[`${cur.r},${cur.c}`];
          if (code) path.unshift(code);
          cur=prev.get(`${cur.r},${cur.c}`);
        }
        return path;
      }
      queue.push({r:nr,c:nc});
    }
  }
  return [];
}
```

**Reweave-all status:** The reweave-all endpoint's job was to create junction edges. Junction nodes don't exist in the cell system. The endpoint should be **deprecated** — mark the route as `// §CELL-06: reweave-all deprecated — junction system removed` and return a 410 Gone with a message. The underlying Phase 1–6 steps (density, coord assignment, `connect` endpoint) remain useful for placing new named nodes; only Phase 7 (wither-snail) is dead.

**Heatmap change:** Replace junction-heat output with a 2D grid. Each cell on a BFS path from hub to a quest node gets `+1`. Output as `{ grid: {"r,c": count}, maxHeat, timestamp }`.

**Files to change:**
- `wbapi-server.js` — replace `undirAdj`/`degree`/`freeDirs`, rewrite snail `bfsPath`, delete walk3, delete bidirectional, deprecate reweave-all, update `linkedNodes` → `derived_exits`
- `api.sh` — remove `fix-bidirectional`; add `grid reachability`, `grid heatmap`
- `docs-node-network.md §7` — already has `_bfsGridPath` documented for client; add server-side note
- `wbapi-help.md` — update reachability/heatmap sections

---

### §CELL-07: MUD Server — Multi-Session Architecture ✅ COMPLETE (2026-06-14)

**What changes:** `wbapi-server.js` gains a session layer. Multiple players can connect, each with their own `(r, c)` position and state. This is the multiplayer MUD layer.

**Session model:**
```js
// In-memory session store (no persistence yet — Phase 1)
const SESSIONS = new Map();  // sessionId → { id, playerName, r, c, nodeCode, state, lastSeen }

// Session lifecycle
POST /api/session/start    { name: 'PlayerName' }  → { sessionId, r, c, node }
POST /api/session/move     { sessionId, dir: 'N'|'E'|'S'|'W' } → { r, c, node, desc, exits }
GET  /api/session/look     { sessionId }            → { r, c, node, desc, exits, players: [] }
GET  /api/session/who                               → [{ id, name, r, c, node }]
POST /api/session/say      { sessionId, msg }       → broadcast to same-cell players
POST /api/session/end      { sessionId }            → remove session
```

**Broadcast mechanism:** Server-Sent Events (SSE) — each session subscribes to an event stream. When a player enters a cell, all players in the same cell get a `player_arrived` event. When someone says something, all same-cell players get a `chat` event. No WebSocket dependency — SSE works over HTTP/1.1.

**Starting position:** New sessions spawn at the game's default starting node (currently `LHR` / City Streets — Birka, at its grid coordinates).

**Concurrency:** Each `POST /api/session/move` is a synchronous operation against in-memory state. No async conflict — Node.js is single-threaded. Add a per-session mutex only if WebSocket upgrade added later.

**Persistence (Phase 2 — not this increment):** Sessions are ephemeral in Phase 1. Phase 2 adds `sessions.json` write on move, read on server restart.

**Files to change:**
- `wbapi-server.js` — add SESSIONS store, SSE endpoint, and all `/api/session/*` routes
- `wbapi-help.md` — add Session API section
- `API-README.md` — add multiplayer session documentation

---

### §CELL-08: WBAPI Cell Endpoints ✅ COMPLETE (2026-06-14)

**What changes:** Add REST endpoints for cell-based queries. Authors and tools can ask "what's at (r, c)?" and "what are the neighbors of (r, c)?" without scanning NODE_MAP manually.

**New endpoints:**
```
GET  /api/cell/:r/:c              → { code, node, terrain, exits: {N,E,S,W} }
GET  /api/cell/:r/:c/neighbors    → { N:{…}, E:{…}, S:{…}, W:{…} }  (each: code|null, terrain, passable)
GET  /api/grid/region?r1=&c1=&r2=&c2=  → 2D array of cells in bounding box
POST /api/node                    → create node; fields: code, r, c, terrain, label, text (NO N/E/S/W)
PUT  /api/node/:code              → update node; reject if N/E/S/W/junction fields submitted (deprecated)
GET  /api/grid/heatmap            → 2D cell-heat grid (from §CELL-06 algorithm)
GET  /api/grid/reachability       → all cells reachable from default start; unreachable cells listed
```

**Node creation rule:** `POST /api/node` accepts `r` and `c`. If `CELL_GRID["r,c"]` is already occupied, return 409. No automatic junction insertion. The node is placed and CELL_GRID updated live.

**Deprecation:** `GET /api/node/:code` still works but its response omits `N/E/S/W` fields (they are derived, not stored). The response includes a `derived_exits` field:
```json
{
  "code": "CI",
  "r": 5, "c": 16,
  "derived_exits": { "N": "SL", "E": "IN", "S": null, "W": null }
}
```

**Files to change:**
- `wbapi-server.js` — add all cell endpoints
- `wbapi-help.md` — document new endpoints
- `api.sh` — add `cell` and `grid` subcommands

---

### §CELL-09: Quest System — Cell-Driven Triggers ✅ COMPLETE (2026-06-14)

**What changes:** Quest activation and completion checks remain node-code based (`activateNode: 'CI'`) but the trigger mechanism changes: instead of "did the player navigate to this code via the edge graph?", the trigger is "did the player's `(r, c)` land on the cell for this code?"

**No schema change needed for QUEST_DB** — `activateNode` is still a node code. The engine just checks `CELL_GRID[playerR,playerC] === quest.activateNode` on each `cellMove`.

**BFS pathfinding for quest waypoints:** The existing "highlight path to quest objective" feature used node-edge BFS. Replace with grid BFS:
```js
function bfsPath(fromR, fromC, toR, toC) {
  // Standard BFS over (r,c) grid; returns array of {r,c} pairs
}
```

**Hunt mode:** The existing "Hunt — guaranteed encounter on path" feature used corridor terrain. Replace with: Hunt mode activates on any empty cell move; terrain is inferred from `_inferTerrain(r, c)`.

**Gate locks:** Gate lock checks (`GATE_LOCKS`) check whether player has the required item when `cellMove` would enter the locked cell. No change to lock data — just the trigger location.

**Files to change:**
- `roll2hit-v3.html` — update `cellMove` to check quest triggers on arrival; replace waypoint BFS
- `quest.md` — note that `activateNode` triggers on cell arrival, not edge traversal
- `docs-node-network.md` — remove "waypoint BFS highlight" section; add cell-BFS pathfinding doc

---

### §CELL-10: Minimap — Live Player Cursor ✅ COMPLETE (2026-06-14)

**What changes:** The minimap already renders from `(r, c)` coordinates. Update it to show:
1. **Player position** — a blinking cursor at `(playerR, playerC)`
2. **Empty cells** — dim traversable cells (not just named nodes)
3. **Visited cells** — cells the player has stepped on, persisted in `S_story.visitedCells`
4. **Remove corridor overlays** — `CORRIDOR_CELLS` CSS classes and rendering removed

**New state field:** `S_story.visitedCells` — `Set<"r,c">` of all cells stepped on. Persisted in save. Used for minimap "fog of war" reveal.

**Minimap rendering:** Currently renders only named node cells. New behavior: render all cells in a viewport around player (`playerR ± 5`, `playerC ± 8`). Named nodes get their code label. Empty cells get a terrain glyph. Water/impassable cells shown in blue. Unvisited cells outside the viewport are fog.

**Files to change:**
- `roll2hit-v3.html` — update `_renderMiniMap()` and `_renderWorldMiniMap()`; add `visitedCells` to `_S_DEFAULTS()`; remove corridor CSS

---

### §CELL-11: Documentation Sync Pass ✅ COMPLETE (2026-06-14)

Full sync of all markdown docs after §CELL-01 through §CELL-10 are complete. Also includes HTML dead-code cleanup (corridor system remnants).

#### Part A — HTML dead-code removal (roll2hit-v3.html)

These are confirmed present in the file as of 2026-06-14. All are safe to delete because `cellMove` never calls them.

| Symbol | Line | Size | Why removable |
|--------|------|------|--------------|
| `storyMove_LEGACY(dir)` | 37413 | ~92 lines | No UI callers; superseded by `cellMove` |
| `_showCorridorPrompt()` | 44846 | ~40 lines | Only called by `storyMove_LEGACY` |
| `storyCorridorTravel()` | 44888 | ~80 lines | Only called by corridor overlay buttons |
| `_wireGlyph()` | 44970 | ~5 lines | Only called by `buildCorridorMap` |
| `_corridorTerrain()` | 44974 | ~3 lines | Only called by `buildCorridorMap` + stubs |
| `_routeSegments()` | 44978 | ~30 lines | Only called by `buildCorridorMap` |
| `buildCorridorMap()` | 45009 | ~40 lines | Populates `CORRIDOR_CELLS` which minimap no longer uses |
| `_buildNodeExits()` | 45059 | ~20 lines | Re-adds N/E/S/W in memory at startup — dead weight since `cellMove` uses `CELL_GRID`, not `node[dir]`. **Critical:** removing this stops the unnecessary in-memory re-population of N/E/S/W |
| `CORRIDOR_TERRAIN` const | 20788 | ~31 lines | Only read by `_corridorTerrain()` |
| `CORRIDOR_CELLS = {}` const | 20819 | 1 line | Dead after removing `buildCorridorMap` |
| `_corridorPendingFrom/To/Dir` | 33162–33164 | 3 lines | Only set/read by `_showCorridorPrompt`/`storyCorridorTravel` |
| `<div id="story-corridor-overlay">` HTML | 4331 | ~10 lines | Never shown (overlay never added `.visible` without storyMove_LEGACY) |
| `#story-corridor-overlay` CSS | 3143 | ~2 lines | Goes with the HTML |
| `Object.entries(CORRIDOR_CELLS).forEach(...)` | 44783 | ~8 lines | In `_setActivePath` — sets `S_story.lastCorridorCells` which is never read |
| `'story-corridor-overlay'` in modal reset arrays | 35284, 44767 | 2 entries | Remove from both arrays |
| `_buildNodeExits()` call | 45083 | 1 line | Call site |
| `buildCorridorMap()` call | 45084 | 1 line | Call site |

**After removing:** `storyRender` (which calls `_renderMiniMap`) and `_enterEmptyCell` are the only paths that update the display. The game is fully cell-based at that point with no dead startup cost.

**Verify:** After removal, search for `CORRIDOR_CELLS`, `storyMove_LEGACY`, `story-corridor-overlay` — should return zero hits.

#### Part B — Markdown docs

**Files requiring updates:**
- `index.md` — "Node map (121 nodes)" → "Cell map (420 named nodes)"; update `maps.md` and `docs-node-network.md` descriptions; remove corridor system row from cross-ref table; add §CELL lab report entry
- `mechanics.md` — remove "Corridor Travel" section; add "Cell Movement" paragraph (one cell per keypress, empty cell traversal, terrain inference, hunt mode)
- `spec-corridors.md` — add `> **⚠️ SUPERSEDED by §CELL-03.** Archived for reference.` header
- `world.md` — remove junction node references; remove "highway mesh" and "Time-Warp Footpath" mentions
- `story.md` — grep for "junction", "highway", "take the road" — rephrase as geographic directions
- `story-flowchart.md` — add note: edges are grid adjacency, not stored links
- `API-README.md` — add cell + session endpoints (from §CELL-08, §CELL-07)
- `wbapi-help.md` — update reachability/heatmap sections; add Cell & Grid Endpoints; add MUD Session API

**Files to add:**
- `lab-report-cell-map-mud-redesign.md` — lab report per Lab Report Policy (large multi-system redesign touching 11 sections)

---

### §CELL Implementation Order

Process one section per "continue." Each section is a self-contained increment that leaves the game playable.

| Order | Section | Dependency | Risk | Status |
|-------|---------|-----------|------|--------|
| 1 | §CELL-02 | none | Low — additive only | ✅ 2026-06-13 |
| 2 | §CELL-03 | §CELL-02 | High — replaces storyMove | ✅ 2026-06-13 |
| 3 | §CELL-04 | §CELL-03 | Medium — new UI path | ✅ 2026-06-13 |
| 4 | §CELL-01 | §CELL-03 | Medium — strips NODE_MAP fields | ✅ 2026-06-14 |
| 5 | §CELL-05 | §CELL-01, §CELL-04 | Medium — deletes J-nodes | ✅ complete (partial) |
| 5b | §CELL-05b | §CELL-05 | Low — purge 268 zombie stubs | ✅ 2026-06-14 |
| 6 | §CELL-09 | §CELL-03 | Low — quest trigger is additive | ✅ 2026-06-14 |
| 7 | §CELL-10 | §CELL-02, §CELL-04 | Low — visual only | ✅ 2026-06-14 |
| 8 | §CELL-06 | §CELL-02 | Medium — server-side only | ✅ 2026-06-14 |
| 9 | §CELL-08 | §CELL-06 | Low — additive endpoints | ✅ 2026-06-14 |
| 10 | §CELL-07 | §CELL-08 | Medium — new server feature | ✅ 2026-06-14 |
| 11A | §CELL-11 Part A | §CELL-05b | Medium — removes live startup cost (`_buildNodeExits`+`buildCorridorMap`) | ✅ 2026-06-14 |
| 11B | §CELL-11 Part B | §CELL-06, §CELL-07, §CELL-08 | Low — docs only | ✅ 2026-06-14 |

**Parallel track:** §CELL-06 / §CELL-07 / §CELL-08 are server-only changes and can proceed independently of the client-side §CELL-05b / §CELL-11A. Recommended order: §CELL-05b → §CELL-11A → §CELL-06 → §CELL-08 → §CELL-07 → §CELL-11B.

**Note on §CELL-11A urgency:** `_buildNodeExits()` runs every page load and patches `NODE_MAP[code].N/S/E/W` in memory. This is invisible during gameplay (cellMove never reads it) but means the browser's in-memory NODE_MAP always has N/E/S/W populated — which could confuse any future code that checks those fields. Remove it as soon as §CELL-05b is done.

---

### §CELL-12: Session Prune Timer + getCellGrid Cache ✅ COMPLETE (2026-06-14)

Two reliability fixes for the MUD session layer.

1. **Prune timer** — `setInterval(sessionPrune, SESSION_TTL / 2).unref()` fires every 15 minutes so crashed clients release their slots without requiring a new API hit. `.unref()` keeps the interval from blocking a clean `POST /api/restart`.
2. **`getCellGrid()` cache** — reference-equality wrapper around `buildCellGrid(nm, coords)`. Returns cached grid until `WBAPI.nodeMap` or `WBAPI.nodeCoords` reference changes (i.e. after `WBAPI.load()`). Hot paths in `buildLook()` (called on every look/move) and `nodeConnections()` (called on every node GET) use it. Algorithm-internal calls keep `buildCellGrid()` directly.

**Files changed:** `wbapi-server.js`

---

### §CELL — What to Preserve

These concepts are unchanged by the cell redesign:

| Concept | Status | Reason |
|---------|--------|--------|
| Node codes (CI, LHR, etc.) | **Keep** | Used by quests, saves, NPCs — stable identifiers |
| NODE_MAP content fields (text, npc, battle, loot, sleep) | **Keep** | Content unaffected |
| QUEST_DB / WORLD_DB / MONSTER_POOL | **Keep** | No dependency on edge fields |
| Gate locks | **Keep** — trigger check updates | Checked on cell arrival |
| Epic Battlegrounds | **Keep** — access method changes | Accessed by entering their cell |
| Fishing lakes (YL, YC) | **Keep** | Normal named nodes |
| Act grouping | **Keep** | Narrative structure unchanged |
| Save / load system | **Keep** — add playerR/playerC fields | Backward-compatible |
| BFS pathfinding concept | **Keep** — algorithm changes | Grid BFS replaces edge BFS |
| Hunt mode encounters | **Keep** — trigger changes | Cell move triggers, not corridor |
| Minimap rendering | **Keep** — extended | Already cell-based, enhanced |

---

## §UNIFY — Unified In-Game Experience (📋 INVESTIGATE → IMPLEMENT)

**Goal:** The player should experience one coherent game, not a collection of loosely coupled panels. Two dimensions need work: (A) the visual/interaction feel across game modes, and (B) the code architecture patterns that produce those modes.

**Prerequisite:** Every item below requires an audit pass before implementation. The single-file architecture means call-site counts and DOM shape must be verified before changing anything. Audit findings supersede the estimates here.

**Work order:** Audit all items first (§UNIFY-A). Then implement in the sequence below — UI items first because they are independent; architecture items second because they touch save/load.

---

### §UNIFY-A — Audit Pass ✅ COMPLETE (2026-06-15)

Before any edit, run grep sweeps across `roll2hit-v3.html` to establish ground truth:

```bash
# Call-site counts
grep -c "storyMsg("           roll2hit-v3.html
grep -c "storyUpdateStatus("  roll2hit-v3.html
grep -c "_updateExitLinks("   roll2hit-v3.html
grep -c "_itemType("          roll2hit-v3.html
grep -c "_grantMissionBit("   roll2hit-v3.html
grep -c "S_story\."           roll2hit-v3.html   # state mutation density

# Show/hide mechanisms in use
grep -oP '\.classList\.(add|remove|toggle)\("[^"]+"\)' roll2hit-v3.html | sort | uniq -c | sort -rn | head -30

# Direct display writes
grep -n 'style\.display' roll2hit-v3.html | wc -l

# storyUpdateStatus missing after known mutators
grep -n "S_story\.hp\s*=" roll2hit-v3.html | head -20
grep -n "S_story\.gold\s*=" roll2hit-v3.html | head -20
grep -n "S_story\.shards\s*=" roll2hit-v3.html | head -20
```

**Deliverable:** A findings note (can be inline in this section) that confirms or revises each item's scope estimate before work begins.

---

### §UNIFY-01 — Empty Cell vs Named Node Parity ✅ COMPLETE (2026-06-15)

**Problem:** `_enterEmptyCell(r, c)` renders a minimal hardcoded div. Named nodes get the full `storyRender` pipeline: act badge, node header, terrain icon, story text, exit links, minimap. The gap is jarring mid-journey — the player visually leaves the game when stepping off a named node.

**Target state:** Empty cells should use the same DOM skeleton as named nodes. Terrain-specific icon, a location header (`[Row r, Col c] — Forest` → `🌲 Deep Forest`), a one-line narrative stub, and exit links built identically to the named-node path. No new gameplay, just structural parity.

**Implementation sketch:**
1. Extract the named-node header/icon block from `storyRender` into a shared `_renderNodeShell(icon, title, subtitle)` helper.
2. Call `_renderNodeShell` from both `storyRender` and `_enterEmptyCell`.
3. Confirm `_updateExitLinks()` is called in both paths (audit first).

**Skillset needed:** Read (find `_enterEmptyCell` and `storyRender` bodies), Edit, `/verify`.

---

### §UNIFY-02 — `storyMsg` vs Direct DOM Mutation (📋 TODO)

**Problem:** Player-visible feedback arrives through at least three channels:
- `storyMsg(text)` — writes to `#story-move-msg`
- Direct `innerHTML` / `textContent` writes to named DOM elements
- `console.log` / `console.warn` (invisible to player)

A player moving through a story beat may see feedback in different visual positions depending on which code path triggered.

**Target state:** One entry point for player-visible soft messages (`storyMsg`). DOM element writes are acceptable only for structural content (the story panel itself, the status bar). `console` stays for developer logs.

**Implementation sketch:**
1. Audit: find all direct `.innerHTML =` and `.textContent =` writes that carry player-facing narrative text (not structural panel content).
2. For each, determine whether the content belongs in `storyMsg` or is structural.
3. Route narrative writes through `storyMsg`; leave structural writes in place.

**Skillset needed:** Bash grep, Read, Edit.

---

### §UNIFY-03 — `storyUpdateStatus()` Call Discipline ✅ COMPLETE (2026-06-15)

**Problem:** `S_story.hp`, `S_story.gold`, `S_story.shards`, and `S_story.day` may be mutated without a subsequent `storyUpdateStatus()` call, causing the status bar to show stale values until the next render cycle.

**Target state:** Every mutation path that changes a status-bar field ends with `storyUpdateStatus()`. Alternatively, `storyUpdateStatus()` is called once at the end of `cellMove()` and `storyRender()` so individual mutation sites don't need to remember.

**Implementation sketch:**
1. Audit: `grep -n "S_story\.hp\s*=" roll2hit-v3.html` — check each site for a following `storyUpdateStatus()`.
2. If the "call at cellMove/storyRender exit" pattern is cleaner, add it there and remove redundant call sites.
3. Add a Playwright assertion: after a battle that changes HP, the status bar DOM reflects the new value.

**Skillset needed:** Bash grep, Read, Edit, Playwright test.

---

### §UNIFY-04 — Exit Link Rendering Consistency ✅ COMPLETE (2026-06-15)

**Problem:** `_updateExitLinks()` may produce different button states at named nodes vs empty cells (available exits, waypoint tinting, disabled states). The exit affordance is the primary navigation UI — it must feel identical everywhere.

**Target state:** `_updateExitLinks()` is the single source of exit UI truth, called from both `storyRender` and `_enterEmptyCell`. All four directions always render; unavailable directions are visually dimmed; waypoint direction is tinted green, regardless of whether the player is on a named node or an empty cell.

**Implementation sketch:**
1. Confirm `_updateExitLinks()` is called in `_enterEmptyCell` (audit — it appears to be, but verify).
2. Check whether the function uses `S_story.currentCode` or `S_story.playerR/C` to determine exits — it should use `CELL_GRID` from current `playerR/C`, not `currentCode`, when on an empty cell.
3. Verify waypoint tinting logic runs in both branches.

**Skillset needed:** Read (find `_updateExitLinks` body), Bash grep for call sites, Edit if needed.

---

### §UNIFY-05 — Modal/Overlay Class Pattern (📋 TODO)

**Problem:** Show/hide for different overlays likely uses a mix of `.visible`, `.active`, and direct `style.display` writes. This makes CSS animation and focus trapping inconsistent and makes the show/hide logic hard to audit.

**Target state:** One pattern: `element.classList.toggle('open', bool)` (or `data-open` attribute). CSS transitions are defined once on `.modal[data-open]`. Focus is trapped in a single `trapFocus(el)` utility.

**Scope note:** This is the riskiest UI change — touches every overlay. Do the audit (§UNIFY-A) first to count mechanisms and decide whether a full unification is worth the blast radius, or whether a smaller "new overlays use the pattern" rule is sufficient.

**Skillset needed:** Bash grep (count mechanisms), `/frontend-design` skill for CSS, Edit, `/verify`.

---

### §UNIFY-06 — `ITEM_TYPES` Registry ✅ COMPLETE (2026-06-15)

**Problem:** `_itemType(name)` is a regex dispatch function. The type strings `'shard'`, `'mission_bit'`, `'weapon'`, `'armor'`, etc. are implicit contracts — they appear in `_itemType`, in `storyCollectLoot`, in inventory rendering, and in quest conditions, with no single authoritative list.

**Target state:** A top-level `const ITEM_TYPES = { SHARD:'shard', WEAPON:'weapon', … }` object. `_itemType` returns `ITEM_TYPES.X` values. All downstream consumers reference `ITEM_TYPES.X`, not string literals.

**Implementation sketch:**
1. Extract all distinct type strings returned by `_itemType` (audit).
2. Define `ITEM_TYPES` near the top of the constant layer (after `ACT_NAMES`).
3. Update `_itemType` return values and all `=== 'shard'` / `=== 'mission_bit'` comparisons to reference the registry.
4. No behavior change — purely a naming consolidation.

**Skillset needed:** Bash grep, Read, Edit.

---

### §UNIFY-07 — Quest vs Mission Bit Gate Boundary (📋 TODO)

**Problem:** `S_story.quests[id] = 'active'|'complete'` and `_grantMissionBit`/`_takeMissionBit` both represent player-held flags that gate content, but with different APIs and no documented boundary for when to use which.

**Target state:** Either (a) converge on one system, or (b) write a clear documented rule: "quests gate narrative progression; mission bits gate inventory-driven state." Whichever is chosen, the rule must be in `plan.md` and enforced in new code.

**Implementation sketch:**
1. Audit: list all `_grantMissionBit` call sites and what they unlock vs all `S_story.quests[id] = 'complete'` sites and what they unlock.
2. Determine whether there is a functional overlap or whether they truly serve different purposes.
3. If overlap: migrate one system to the other. If distinct: document the boundary here.

**Note:** This is a design decision, not a code change, until the audit reveals the answer.

**Skillset needed:** Bash grep, Read, judgment call on system boundary.

---

### §UNIFY-08 — `loot` String Format ✅ COMPLETE (2026-06-15)

**Problem:** `node.loot = "Codex Shard #1 · Iron Sword"` is split on `" · "` and type-inferred by regex in `storyCollectLoot`. The delimiter and format are implicit — a loot entry with an unexpected character silently breaks collection.

**Target state:** Either (a) a `parseLoot(str)` utility with a single definition that is the only place the `" · "` delimiter is handled and `_itemType` is called, or (b) a structured `loot: [{name, type}]` array in `NODE_MAP` (bigger migration, requires WBAPI support).

**Recommended first step:** Option (a) — extract `parseLoot` without changing the data format. This makes the implicit contract explicit and gives one place to add validation later.

**Skillset needed:** Read (`storyCollectLoot` body), Edit, unit test for `parseLoot`.

---

### §UNIFY-09 — State Mutation Discipline (📋 TODO)

**Problem:** `S_story.x = y` mutations are scattered throughout the codebase. There is no guarantee that autosave (`storySave()`) fires after every meaningful mutation. A mutation that doesn't trigger a save is a data-loss risk.

**Target state:** Autosave is guaranteed to fire at the end of every player action (cellMove, storyRender, combat resolution). Individual mutation sites do not need to call `storySave()`. The three entry points listed become the only autosave call sites.

**Implementation sketch:**
1. Audit: find all `storySave()` call sites. Are they in action-entry functions or scattered in helpers?
2. If scattered: consolidate to the three action entry points and remove call sites from helpers.
3. Add a Playwright test: set `S_story.gold = 999`, trigger a `cellMove`, reload page, confirm gold is 999 in the restored state.

**Skillset needed:** Bash grep, Read, Edit, Playwright test.

---

### §UNIFY-10 — Error / Warning Channel (`_gameWarn`) ✅ COMPLETE (2026-06-15)

**Problem:** Soft errors and player-visible warnings use at least four channels: `storyMsg()`, `console.log()`, silent `return`, and direct DOM writes. A player hitting a gate lock or an unreachable waypoint may or may not see a message depending on which path triggered.

**Target state:** A `_gameWarn(msg)` function that routes to `storyMsg` for player-visible soft errors. `console.warn` for developer-only diagnostics. Silent `return` only for truly expected no-op conditions.

**Implementation sketch:**
1. Audit: find all `storyMsg` calls that carry error-tone text (`'No path'`, `'sealed'`, `'You cannot'`, etc.) — these are correct.
2. Find silent `return` statements in navigation/quest code that should be player-visible.
3. Introduce `_gameWarn(msg)` as a thin wrapper for `storyMsg` with a distinct visual style (dim text, no icon) — then route existing error-tone messages through it so they can be styled separately from narrative messages.

**Skillset needed:** Bash grep, Read, Edit, `/frontend-design` for visual style.

---

### §UNIFY — Implementation Order

| Priority | Item | Dependency | Blast radius |
|---|---|---|---|
| 0 | §UNIFY-A audit | none | read-only |
| 1 | §UNIFY-06 ITEM_TYPES registry | audit | low — naming only |
| 2 | §UNIFY-08 parseLoot utility | audit | low — one function |
| 3 | §UNIFY-03 storyUpdateStatus discipline | ✅ done | |
| 4 | §UNIFY-01 empty cell parity | ✅ done | |
| 5 | §UNIFY-04 exit link consistency | ✅ done | |
| 6 | §UNIFY-10 _gameWarn channel | ✅ done | |
| 7 | §UNIFY-02 storyMsg discipline | audit + §UNIFY-10 | medium |
| 8 | §UNIFY-09 state mutation / autosave | audit | high — save/load |
| 9 | §UNIFY-07 quest/missionbit boundary | audit | design decision first |
| 10 | §UNIFY-05 modal class pattern | audit | high — all overlays |

---

*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
