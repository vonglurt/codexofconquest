<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com -->
## I. Directive

> You are an expert prompt interpreter with an electrical engineering / computer science background. Follow the sections below: use the suggestions in II, III, IV to implement ideas from the list, or append new ideas to the end of the list when told about them. Work incrementally — present one step at a time and wait for "continue."

### API-First Development Policy

**Preferred workflow for any data addition or edit to `roll2hit-v3.html`:**

1. **Check API first** — before editing HTML, use `./api.sh` to confirm current state: `./api.sh ping`, `./api.sh list <type>`, `./api.sh audit`. Direct HTML edits are a fallback only when the API cannot yet express the operation.
2. **Write the API method first** — if the operation isn't yet supported, add the endpoint to `wbapi-server.js` and restart before touching the HTML.
3. **Create/modify via API, not HTML** — preferred: `./api.sh post <type> [k=v ...]` or `./api.sh put <type> <id> [k=v ...]`. The tool handles nonces automatically and queues all requests with retry.
4. **Restart server after adding endpoints** — `./wbapi-toggle.sh restart` (or `start` if stopped).
5. **When adding items to plan.md** — cross-reference current state with `./api.sh audit` and `./api.sh list <type>` to confirm what actually exists vs. what the plan assumes.

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
./api.sh audit                             # full integrity scan (includes §ARCH-02 bits advisory)
./api.sh chain quest_wis_01               # quest dependency chain
./api.sh advise quest_wis_01              # quest fields + chain + advisory in one call
./api.sh export quest_db --out quests.json # dump collection to file
./api.sh location CY                       # composite node view
./api.sh --ai "how do I link two nodes?"  # ask Claude (ANTHROPIC_API_KEY)
```

**Single source of truth:** `roll2hit-v3.html` is the entire game. The API reads its text directly and writes mutations back in-place. `wbapi-server.js` and `worldbuilder.html` are authoring tools — the game requires neither at runtime.

### Cell-First Navigation Policy

**Cell = Location.** All map locations are identified by `(r, c)` cell coordinates. The two-letter node code is a lookup alias for a named cell, not a location pointer. Use `CELL_GRID["r,c"]` to resolve coordinates to node codes. Do not navigate by chasing `N/E/S/W` pointer fields — those were stripped in §CELL-01. When writing new features:

- Positions travel as `{ r, c }` pairs.
- Node codes are resolved from position: `CELL_GRID[\`${r},${c}\`]`.
- "Adjacent" means `(r±1, c)` or `(r, c±1)` — not stored edge links.
- Quest activation checks: `CELL_GRID[\`${s.r},${s.c}\`] === quest.activateNode`.

### Incremental Recitation Rule

While writing vignette content, speak short segments aloud via `say` as you produce them — every page or every couple of paragraphs. Read the element type first, then its text.

Run `say` blocking (no `&`) so each announcement completes before writing continues. Write to file incrementally — after each act, save and run the next `say` call. After every full vignette, commit and speak the commit subject.

### Loop vs. Ask Rule

Before starting any task:

- **Loop tasks** (no user input needed — clear next step): begin immediately, state what you are doing in one sentence.
- **Ask tasks** (user decision required): present a yes/no or choice prompt. Then run:
  ```bash
  say "If you say yes: <one sentence describing the intention and outcome of yes>"
  ```

### Commit + Speak Rule

After every `git commit`, immediately run:

```bash
say "<commit subject line>"
```

Read the **subject line only** aloud via macOS `say`. This confirms the commit completed and anchors the session.

### Lab Report Policy

Write a new `lab-report-<title>.md` when any of the following is true:

| Trigger | Examples |
|---------|---------|
| Major collection added or redesigned | New monster group, terrain cluster, NPC faction, item economy |
| Large redesign touching multiple systems | Weapon drop overhaul, Luck Stat, fishing bait sub-system |
| New narrative theme or arc | New quest chain spanning 3+ nodes, new named faction, new NPC arc |
| Design review before implementation | IEEE-format spec locking data shapes and flow before any HTML edit |
| Session postmortem with non-obvious decisions | Choices that won't be recoverable from code or core docs alone |

Do **not** write a lab report for: a single monster/quest addition, a value correction, or small additions that fit in an existing doc section.

---

## II + III. Design Constants & State Fields

> **Moved to `index.md`** — see "Design Constants Quick Reference" and "State Fields Quick Reference (S_story)" sections there.

---

## §FUTURE — Long-Range Ideas (not scheduled)

> Speculative world expansions. No implementation layer assigned. Record the concept while the idea is fresh.

---

## §WORLDBUILDER-01 — Visual Grid Editor (📋 PLANNED)

**What it is:** Canvas-based in-browser editor for the node map. Click a node to inspect and edit it. Click an empty cell to create a new node. Wire exits bidirectionally. Collision detection against existing coordinates.

**Why:** The Walk tab gives spatial navigation; this gives spatial authoring. Dragging a node to a new cell, clicking empty cells to create nodes, and clicking exits to link them is faster than any form flow for map expansion work.

**Key capabilities:**
- 2D canvas of all nodes at `{r, c}` coordinates; color-coded by act
- Empty cells are insertion points — click opens New Node form with `r,c` pre-filled
- Bidirectional exit wiring: link node A → B and the reverse link is offered automatically
- Node detail inspector inline: all content fields editable in place
- Collision detection: alert if `r,c` already occupied

**Depends on:** §WORLDBUILDER-02 Phase 1 (cross-ref panel) ✅ complete.

---

## §EDITOR-02 — Arc Insertion Workflow (📋 REFERENCE + PLANNED UI)

### §EDITOR-02-A. The Seven-Step Arc Insertion Protocol

The canonical workflow for adding any quest chain via the API. Steps are invariant; content changes.

```bash
# Step 0: confirm node exists and terrain is correct
./api.sh location {startNode}

# Step 1: register new flags in _S_DEFAULTS (manual edit in roll2hit-v3.html)

# Step 2: inspect quest schema
./api.sh get quest --schema

# Step 3: create one quest
./api.sh post quest id=quest_{arc}_{nn} type=side npc={npc_key} activateNode={code} title="..."

# Step 4: verify quest readable
./api.sh get quest quest_{arc}_{nn}

# Step 5: patch text fields
./api.sh put quest quest_{arc}_{nn} passText="..." failText="..."

# Step 6: repeat steps 3–5 for each quest in chain

# Step 7: verify dependency graph
./api.sh chain quest_{arc}_{nn}

# Step 8: run audit — must be clean before save
./api.sh audit

# Step 9: commit to timestamped HTML
```

**One session per arc.** All POSTs and PUTs must happen in a single server session before Step 8.

---

### §EDITOR-02-B. Mission Type → Field Templates

**`talk_chain`** (NPC conversation, no roll):
```json
{ "id":"quest_{arc}_{nn}", "type":"side", "title":"...", "desc":"...", "hint":"...",
  "activateNode":"{code}", "activateCond":"{priorFlag}", "checkPassFlag":"{arcFlag}", "xpAward":100 }
```

**`skill_check`**:
```json
{ "id":"quest_{arc}_{nn}", "type":"skill_check", "title":"...", "desc":"...", "hint":"...",
  "activateNode":"{code}", "activateCond":"{priorFlag}", "checkAbility":"{str|dex|con|int|wis|cha}",
  "checkLabel":"{Skill}", "checkDC":12, "retryable":false, "xpAward":150,
  "passText":"...", "failText":"...", "checkPassFlag":"{arcFlag}", "disposition":"..." }
```

**`escort`** (companion travel):
```json
{ "id":"quest_{arc}_{nn}", "type":"side", "title":"...", "desc":"...",
  "hint":"Reach {dest} with {npc}.", "activateNode":"{start}", "waypointNode":"{dest}",
  "activateCond":"{priorFlag}", "checkPassFlag":"{arcFlag}", "xpAward":150 }
```

**`collect`** (item delivery):
```json
{ "id":"quest_{arc}_{nn}", "type":"side", "title":"...", "desc":"...",
  "hint":"Bring {item} to {npc} at {code}.", "activateNode":"{code}", "waypointNode":"{dest}",
  "activateCond":"{priorFlag}", "completeItems":["{item}"], "checkPassFlag":"{arcFlag}", "xpAward":150 }
```

---

### §EDITOR-02-C. Pre-flight Checklist

Before `POST /api/save`:

1. All `activateCond` flags exist in `_S_DEFAULTS`
2. All `checkPassFlag` values are unique across QUEST_DB
3. All `activateNode` and `waypointNode` codes exist in NODE_MAP
4. Chain is connected: `./api.sh chain {firstQuestId}` shows all expected quests downstream

---

### §EDITOR-02-D. Planned UI (📋 PLANNED)

Mission Builder tab in worldbuilder.html — not yet built. Form to create multi-quest arcs with Preview Chain / Validate / POST All / Save buttons. See original §EDITOR-02-E spec in git history for the full mockup.

---

## §ARCH-01 — UQF Migration (📋 PLANNED — Phases 2–5)

**Scope:** Migrate all QUEST_DB entries to Universal Quest Format (gate + bits[]). Phases 1–2 done. Remaining:

- [ ] **Phase 3-a:** Migrate §WISDOM-01 (8 quests) — cleanest arc
- [ ] **Phase 3-b:** Migrate §SPARK-01, §SPARK-02
- [ ] **Phase 3-c:** Migrate §ALCHEMY-01, §HUNT arcs
- [ ] **Phase 3-d:** Migrate main quest chain
- [ ] **Phase 4:** Remove `completeFn` / `onPass` closure pattern; storyRender blocks become display-only
- [ ] **Phase 5:** worldbuilder Export generates paste-ready UQF JS literals

---

## §ARCH-02-A — Operand Reference (✅ Complete — Active Reference)

The 12 operand kinds for quest `bits[]` arrays. Used when creating new quests via ✏ Editor or API.

| Kind | Required fields | Optional fields |
|------|----------------|----------------|
| `talk_at` | `node` | `npcKey`, `objectKey`, `requiresItem`, `dialogue` |
| `skill_check` | `ability`, `dc`, `label`, `passText`, `failText` | `retryable`, `passFlag` |
| `navigate` | `fromNode`, `toNode` | `hint` |
| `kill_at` | `node`, `monsterKey` | `count`, `killFlag` |
| `escort` | `npcKey`, `fromNode`, `toNode` | `partySlot`, `combatRisk`, `failFlag` |
| `talk_party` | `npcKey` | `partySlot`, `talkFlag`, `dialogue` |
| `deliver` | `item`, `toNode` | `fromNode`, `recipient`, `consumeOnDeliver` |
| `collect_item` | `item` | `icon`, `sell`, `unique` |
| `consume_item` | `item` | `failText` |
| `investigate` | `node`, `target` | `skillCheck`, `reveals`, `investigateFlag` |
| `flag_gate` | `requires` OR `requiresAny` | `blocks` |
| `choice` | `prompt`, `options[]` | — |

**Composition rule:** every quest must end with `collect_item`, `flag_write`, or `choice`. See `WBAPI.quests.advise(id)` for live checks.

---

## §WALK-G — Planned Walk Tab Extensions

- [ ] **Node creation in-context:** click an empty cell on the mini-map → New Node form with `r,c` pre-filled; POST via `/api/node`
- [ ] **Terrain-color mini-map dots:** color dots by terrain type (urban=blue, forest=green, sea=teal, plains=yellow, dungeon=red) using `WORLD_DB` terrain keys
- [ ] **Quest waypoint overlay:** toggle to highlight `waypointNode === current` nodes in a secondary color on the mini-map
- [ ] **Move-history breadcrumb:** track last 10 visited nodes; render a fading trail on the mini-map
- [ ] **Act filter:** button row to grey-out nodes from other acts
- [ ] **Fit-to-neighborhood zoom:** keyboard shortcut to set `SCALE` so current node + neighbors fill canvas
- [ ] **storyRender live preview:** sandbox iframe showing game-accurate view of edited node
- [ ] **Compass rose:** N/S/E/W overlay on the canvas corner

---

## §WBAPI-01 — Remaining API Work (📋 PLANNED)

Phase 2 (export endpoints) ✅ complete. Open:

- [ ] **Phase 3 — Full-array PATCH:** `PUT /api/collection/:name` to replace or deep-merge a named constant; validates structure; backs up original block
- [ ] **Phase 4 — worldbuilder write tab:** Create forms for terrain/monster/quest; shows curl equivalent; Export panel
- [ ] **Phase 5 — Standalone Node module:** `GET /api/export/all?format=module`; `wbapi-extract.js` CLI (no server needed)
- [ ] **Condition/epic/journal endpoints:** `GET/PUT/POST /api/condition/:id`, `GET/PUT/POST /api/epic_boss/:id`, `GET/POST /api/journal`

---

## §1367 — Historical Setting Canon (📋 PLANNED)

**Canonical game year: 1367 AD.** All clarification questions answered. Integration may begin.

### Locked Design Decisions

1. `const GAME_YEAR = 1367;` → display `"Anno Domini MCCCLXVII"`
2. **Plague mechanic:** `plague_exposed` flag + CON DC 13 save + Exhaustion 1. Cure quest required.
3. **Hanseatic faction:** `faction_hansa` score (−5 to +5); affects BK, VS, LB, DZ, RG, BG nodes
4. **Faith triple-track:** `faith_orthodox`, `faith_reform`, `faith_folk` (each −5 to +5); affects NPC dialogue, quest availability, monster encounter modifiers
5. **New nodes to add:** LB (Lübeck), DZ (Danzig), RG (Riga), BG (Bruges waypoint)
6. **Shattered Codex origin:** Add paragraph pointing to Transoxiana/Samarkand; Tamerlane's rise scattered the keepers westward
7. **Historical NPCs:** Black Prince, John Wycliffe, Murad I, Tamerlane — named characters the player can encounter
8. **All 6 vignettes from `Year1367AD.md`** map to QUEST_DB entries
9. **Node `LXVII67`** — The Jester's Crossroads; `faith_folk` easter egg; `GET /api/67` returns puzzle hint

### Six Arc Seeds

| Event | Design seed |
|-------|-------------|
| Battle of Nájera | Routier company near a node extracting protection; fight, hire, or expose who pays them |
| Tamerlane rising | Refugee scholar from Samarkand arrives carrying a scroll Tamerlane's agents want |
| Ottoman Balkans | Balkan noble negotiating secretly with an Ottoman envoy; expose/assist/steal the treaty |
| Hanseatic League | Hanseatic factor withholding grain as political lever; break the embargo |
| John Wycliffe | Friar carries vernacular pamphlet; deliver without bishop's men intercepting |
| Black Death aftermath | Abandoned node (1363 recurrence); clear undead, determine heir, decide who gets the land |

---

## §TTS — macOS Text-to-Speech Session Protocol

After every `git commit`:
```bash
git commit -m "message" && say "message"
```

When asking user to type "continue":
```bash
say "continue, continue, continue!"
```

Mid-loop after each PUT:
```bash
say "Fixed quest_id. Verified on disk." &
```

Run `say` blocking (no `&`) so each announcement completes before the next request.

---

## §AUDIT-02 — NPC/Quest Connection Gap (📋 INVESTIGATE)

**Finding 1:** ~985 quests have no `npc` field. Root cause: book-import scripts created quest stubs without populating `npc`. Before fixing, determine: do the book-arc nodes already have NPCs in BIRKA_NPC who should own these quests?

**Fix workflow when ready:**
```bash
./api.sh location LHR     # shows NPCs at that node
./api.sh list npc --node LHR
./api.sh list quest --node LHR --raw | jq '.[].id' | xargs -I{} ./api.sh put quest {} npc=yael
./api.sh audit --raw | jq '.errors | length'
```

**Finding 2:** 13 NPCs have no quests:
- Core Birka 6 (yael/brynn/quill/pachelbel/crov/auros) — deeply characterised; waiting for real quest arcs to be written
- Book-import stubs (ser_bardo, ser_taddeo, etc.) — quests exist but have no `npc` field pointing back; fix by wiring existing quests → NPC

---

## §BACKLOG — Open Items

### Tooling

- [ ] **§WORLDBUILDER-01** — Visual grid editor with canvas node map, exit bidirectional wiring, collision detection
- [ ] **§EDITOR-02 UI** — Mission Builder tab in worldbuilder.html (form-based arc insertion with Preview Chain + POST All)
- [ ] **§ARCH-01 Phases 2–5** — UQF migration arc-by-arc; remove closure pattern; export UQF from worldbuilder
- [ ] **§WALK-G extensions** — terrain-color dots, act filter, node creation in-context, compass rose (see §WALK-G above)
- [ ] **§WBAPI-01 phases 3–5** — full-array PATCH, worldbuilder write tab, standalone Node module
- [ ] **§EDITOR-01-D** — Token item manager (visual chain editor for inv.push/splice sequences)

### Game Content

- [ ] **§GR** — La Riva grief arc + Connie/Aldo/Vinnie arc + FR node + corruption chain CY→FR. See `project_grief_arc.md` in memory.
- [ ] **§DUNGEON-01** — Loop Heart choice room, Sacrifice Gates, Shifting Labyrinth, Scholar Workshop (Node SW), Mimic Meadows (Node MM)
- [ ] **§WISDOM-01 Keel thread close** — Baltic survey data arc at eastern Baltic node; the "after witnessing" arc
- [ ] **Covenant Keeper Ending** — all six grief arcs name their people in a final storyRender event. Depends on §GR complete.
- [ ] **§GR-D Froberger Entry 42** — blank page filled on second playthrough. Requires NG+ state tracking (currently unsupported).

### Design Decisions

- [ ] **Arc ID as first-class UQF field** — add `arc: 'quest_wis'` explicitly to quest objects; enables arc sorting without string-splitting heuristics
- [ ] **§FUTURE-01 Saul/Paul arc** — canonical placement decision: does Acts-fidelity register create tonal discontinuity? See thematic audit in git history.
- [ ] **§MBIT-02-E token/gate unification** — leaning toward keeping KEY_EVENTS items and mission bit tokens separate (different ontology). Decision pending.

*© 2026 Paul Richeson — MIT License.*
