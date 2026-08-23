<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->

# CODEX OF CONQUEST — a single-file adventure RPG

The entire game — combat engine, world map, NPC dialogue, quest system, save
system, hundreds of monsters, dozens of terrains, and 8 acts of story — lives
inside one HTML file. No server, no build step, no install. Open it and play.

> A dying courier presses a bloodstained map into your hand and says one word:
> *"Sweelinck."* Seven scholar-kings each carried one Shard of the Codex into
> hiding before they died, and the seals that bind the Void are weakening. The
> Void is not a fog of consuming darkness. It is a conqueror — it advances where
> the defenders are thin. You have a sword, a coin purse, and forty-nine days.

---

## Quick start — just play

Open **`index.html`** in any modern browser (Chrome, Firefox, Safari,
Edge) with JavaScript enabled.

- **Double-click** the file, or drag it onto a browser window, or `File → Open`.
- Everything runs locally. Save state lives in the browser's `localStorage` —
  nothing is uploaded anywhere.
- The file is self-contained: you can email it, drop it on a USB stick, or serve
  it from any static host.

> `worldbuilder.html` is the **authoring tool** (a visual editor for the world
> data). The game does **not** need it — it's only used when building content.

---

## What this project is

`index.html` is the single source of truth: a ~37,000-line HTML file that
*is* the game. Everything else in this repository exists to **author, document,
test, and host** that one file:

- **Docs** keep a two-way sync with the HTML — every data structure has a home
  document, every doc entry traces back to a line in the HTML.
- **The WBAPI server** (`wbapi-server.js`) is an optional local REST API that
  reads the HTML and writes edits back in place, so content can be authored via
  `worldbuilder.html` / `./api.sh` instead of editing 37k lines by hand.
- **Tests** (`tests/`, `scripts/`) guard the world's invariants.

If you only want to play, you never need any of that — just open the HTML.

---

## Running it as a project

### 1. Play locally (no tooling)

Open `index.html` in a browser. Done.

### 2. Host it (share it with others)

Because the game is a single static file, any static file server works:

```bash
# Python (already on macOS/Linux) — serves the current directory at :8000
python3 -m http.server 8000
# then visit http://localhost:8000/index.html

# …or Node's one-liner static server
npx serve .
```

To publish on the web, upload `index.html` to any static host (GitHub
Pages, Netlify, an S3 bucket, a plain nginx/Apache directory). No backend
required. Rename it to `index.html` if you want it served at the site root.

### 3. Run the authoring / API server (content editing)

The World Builder API server lets you edit the game's data programmatically and
through `worldbuilder.html`. You need **Node.js**.

```bash
# Install Node (macOS, via Homebrew — https://brew.sh)
brew install node

# Install dev dependencies (Playwright for tests, Anthropic SDK)
npm install

# Start the WBAPI server on http://localhost:1367
./wbapi-toggle.sh start        # start | stop | restart | status | fg
#   (equivalently: npm start  →  node wbapi-server.js)

# Talk to it from the CLI
./api.sh ping
./api.sh help
./api.sh list node

# Author visually: open worldbuilder.html in a browser while the server runs
```

The server reads and rewrites `index.html` in place. See
**[CONTRIBUTING.md](CONTRIBUTING.md)** for the API-first authoring workflow and
the WBAPI hazards to know before editing, and **`docs/api/`** for the full API
reference.

### Tests

```bash
npm test                # Playwright integration suite
npm run check:walk      # world-invariant CI gates (mover/terrain/roads/rooms)
npm run test:mud        # MUD server-protocol harness
```

> ⚠️ Stop the WBAPI server before running Playwright suites
> (`./wbapi-toggle.sh stop`) — see the Test-Run Rules in
> [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Repository layout

```
index.html        ← THE GAME (single file — open this to play)
worldbuilder.html       ← visual authoring tool (needs the WBAPI server)

# Launch / ops scripts (root)
api.sh                  ← WBAPI CLI wrapper  (→ api/wb.js)
wbapi-toggle.sh         ← start/stop/restart the WBAPI server
say.sh · sayd.sh        ← narration helpers
monitor-snapshots.py · watch-snapshots.sh · archive-snapshots.sh
                        ← snapshot pipeline + server keepalive (root-anchored)

# WBAPI server bundle (Node — must stay at root together)
wbapi-server.js         ← the REST API server (reads/writes the HTML)
wbapi-core.js  mover.js  rooms.js  duel.js  mesh.js   ← required modules
roads-pins.json  walk-geo-gazetteer.json  peers.txt   ← data the server reads
package.json  node_modules/

# Core documentation (kept in two-way sync with the HTML)
index.md                ← master index + cross-reference table (start here)
world.md  story.md  mechanics.md  monsters.md  maps.md  quest.md
prompt.md               ← operating directive: how to build/add content (read before contributing)
CONTRIBUTING.md         ← development policies & directives
BACKLOG.md              ← outstanding work / to-do list
plan-archive.md         ← archived completed work

# Folders
docs/                   ← reference docs: spec/ story/ api/ mechanics/ notes/
lab-reports/            ← design lab reports (one per major arc/system)
importers/              ← ⚠️ archaic one-shot content importers (historical)
tools/                  ← standalone dev/CLI utilities
sources/                ← narrative source texts
1367-sources/           ← imported source-book material
scripts/                ← invariant/CI check scripts (npm run check:*)
tests/                  ← Playwright integration + MUD harness
api/                    ← wb.js (the WBAPI CLI implementation)
maps/ · milepoints/ · ledger/   ← map assets, snapshots/logs, economy ledger
```

---

## Documentation system

This repo maintains a **two-way sync** between `index.html` and the
markdown docs: every data structure in the HTML has a home document, and every
documented item traces back to a line in the HTML.

| Doc | Contents |
|-----|----------|
| **`index.md`** | Master index, cross-reference table, doc-health badge — **read this first** |
| `world.md` | NODE_MAP, WORLD_DB, NPC profiles, quest IDs |
| `story.md` | All nodes, acts, narrative flow, branching |
| `mechanics.md` | Combat engine, XP table, conditions, economy, save format, multiplayer |
| `monsters.md` | MONSTER_POOL entries + terrain coverage |
| `maps.md` | Grid layout, road net, room layer, node network |
| `quest.md` | Quest catalogue (UQF format) |
| `prompt.md` | **Operating directive** — how to take a BACKLOG item from spec to shipped content (work loop · API · inserting pattern · invariants). Read before contributing. |
| `CONTRIBUTING.md` | How to work in this repo — API-first, cell-first, free-movement, test rules, lab-report policy |
| `BACKLOG.md` | Outstanding / planned work |

Deeper reference lives under **`docs/`** (`spec/`, `story/`, `api/`,
`mechanics/`, `notes/`), and **`lab-reports/`** captures design decisions and
implementation findings per major arc or system. See `index.md` for the full
list.

---

## Player guide

### Enter Story Mode

Open the game and click **Story Mode**. You arrive in Birka — a city on the edge
of something wrong. The Void is rising. You have 49 days.

### Moving through the world

The world is a MUD-style coordinate grid. Each press of **N / E / S / W** moves
you one cell. Named locations appear when your cell matches a known node; between
them you walk through open terrain. The world is freely traversable — quests
never block a road.

| Command | Action |
|---------|--------|
| **N / E / S / W** | Move one grid cell |
| **Wait** | Rest at your location (costs time) |
| **Hunt** | Enter the wilderness to find an encounter |

Move toward quest markers, talk to everyone, and read what NPCs say — their
dialogue changes as your relationship with them grows. Click a distant map tile
to auto-travel there.

### Combat

Encounters (or choosing **Hunt**) start combat automatically. Roll initiative,
then take turns: **Attack**, **Dodge**, **Use Item**, or **Flee**. A natural
**20** crits (double damage dice); a **1** fumbles. At 0 HP you make **death
saving throws** — three successes stabilize, three failures end the run (and drop
your loose loot as a recoverable corpse where you fell).

### Leveling & NPCs

Defeating monsters earns XP toward Fighter Champion features (Action Surge,
Second Wind, crit improvements). The cap is **Level 20**. Raising an NPC's
favorability unlocks new dialogue, story context, and the best ending. The
ending notices what you *shared*, not just what you killed.

### Saving

The game autosaves to `localStorage` after every meaningful action. Use
**Export Save** to back up a run and **Import Save** to restore it.

---

## License

MIT. Fork it. Extend it. Write Level 21. See [LICENSE](LICENSE) for full text.

---
*© 2026 Paul Richeson — MIT License.*

---

## Author

**Paul Richeson** — sole copyright holder; see [LICENSE](LICENSE).

Built across 1,472 commits between 2026-05-24 and 2026-08-23. Much of the drafting
was done by Anthropic's Claude models, engaged as a contracted service and working
under the author's direction — a sub-contractor relationship that carries no
independent authorship claim. See
[CONTRIBUTING.md](CONTRIBUTING.md#authorship-and-ai-contribution).

## A note on names

The game file was called `roll2hit-v3.html` for most of its history and is now
`index.html`, so that a static host serves it at the root URL. The project was
called *Roll2Hit* before it was called *Codex of Conquest*.

The `lab-reports/` and `plan-archive.md` are **history documents** — they are
annotated, never rewritten (§DX-02c / §AUDIT-03m), so they still name the file
and the project as they were called at the time. That is deliberate.
