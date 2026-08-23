<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Roll2Hit Developer Environment

## Overview

Roll2Hit is a single-file D&D 5e combat and world-exploration assistant.
The entire game — monsters, quests, NPCs, nodes, world map, terrain, loot
tables, fish pools, dialogue trees — lives in one HTML file: `play.html`.
At 210 MB it is simultaneously a playable web application, a database, and a
version-controlled document.

The developer environment described here is built around three ideas:

1. **The HTML file is the truth.** There is no separate database, no migration
   system, no build step. Every data and code change is a mutation of that one
   file. The tooling must make those mutations safe, auditable, and reversible.

2. **Change sets, not commits.** Git commits are for shipping features. Inside
   a working session — tuning monster stats, wiring a quest chain, adding NPC
   dialogue — dozens of small edits happen that are too granular for commits but
   too important to lose. Snapshots capture each meaningful save as a unified
   diff (`.patch` file), creating a session-level change log separate from the
   git history.

3. **The monitor is the control panel.** One script, `monitor-snapshots.py`,
   starts the environment, manages the server lifetime, watches for new
   snapshots, displays diffs, and gives the developer keyboard control over the
   running server — all in a single terminal window.

---

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│  play.html  (210 MB — game state + UI in one file)     │
└────────────────────────────┬──────────────────────────────────┘
                             │  read / write
                    ┌────────▼────────┐
                    │  wbapi-server.js │  REST API  :1367
                    │  wbapi-core.js   │  parser / index
                    └────────┬────────┘
                             │  HTTP
          ┌──────────────────┼──────────────────┐
          │                  │                  │
   ./api.sh CLI        worldbuilder.html    monitor-snapshots.py
   (src/api/wb.js)         (browser GUI)        (TUI + keepalive)
```

### play.html

The game file embeds structured data as JavaScript object literals inside
`<script>` tags, parsed at runtime by the browser and at edit-time by
`wbapi-core.js`. Key data blocks:

- `MONSTER_POOL` — 216+ monsters with stats, loot tables, terrain affinities
- `WORLD_DB` — 40+ terrain types with encounter tables
- `NODE_MAP` — 20 000+ geographic nodes with connections
- `QUEST_DB` — 2 200+ quests with dependency chains and flag logic
- `BIRKA_NPC` / `NPC_DIALOGUES` — named characters with dialogue trees
- `ITEM_DB`, `FISH_DB`, `LAKE_MAGIC`, `D100_TABLE` — supplementary tables

### wbapi-server.js

A local Node.js HTTP server (port 1367) that exposes the game file as a REST
API. It loads the full HTML into memory, maintains in-memory indexes, and
serialises edits back to disk via `POST /api/save`. Key properties:

- **Self-contained.** No external database. State lives in the HTML.
- **Hot-reload.** `fs.watch` detects external edits and reloads automatically.
- **Single-instance.** Port 1367 wins: if a second instance tries to start it
  detects `EADDRINUSE`, logs the conflict to `milepoints/wbapi-server.error`,
  and exits with code 0 (not 67) so the restart loop does not spin.
- **Restart protocol.** `POST /api/restart` saves state, exits with code 67,
  and `wbapi-toggle.sh`'s restart loop relaunches cleanly.

### wbapi-core.js

The parsing library used by both the server (runtime) and tooling (offline).
Exports `WBAPI.load(file)` which extracts and indexes all data blocks.

---

## The Snapshot System — Change Sets

### Why snapshots instead of more git commits

Git is the right tool for shipping a feature or fixing a bug. It is the wrong
tool for recording "I raised the goblin's HP from 7 to 9 and added a loot
entry" at 2 AM. Those micro-edits clutter the history, make code review noisy,
and discourage iteration.

Snapshots solve this by recording every meaningful save as a **change set** —
a unified diff between the previous save and the current one — without touching
the git index. The developer can save freely, the session history is preserved,
and git commits are reserved for intentional milestones.

### How it works

When you save the game file, copy it with a timestamp:

```bash
cp play.html roll2hit-v3-$(date +%Y%m%d-%H%M%S).html
# …or ask the server for one:
./api.sh save                  # dated backup beside the game file, then overwrite + reload
./api.sh snapshots             # what is sitting there right now (they are gitignored)
./api.sh snapshots --sweep     # delete the ones this patch chain already holds
```

> **§DX-02k (2026-08-03) — snapshots are produced on request, not as a side effect.**
> This deliberate `cp` is, and always was, the documented input to the patch store.
> Until §DX-02k the WBAPI server *also* stamped a full ~5.4 MB snapshot into its
> working directory on **every successful PUT/POST/DELETE** and never removed it,
> which turned a curated session history into per-keystroke noise (6 orphans /
> ~32 MB were in the repo root when it was found — invisible, since the pattern is
> gitignored). The per-write persist now writes a temp beside the game file and
> renames it into place; `POST /api/save` remains the on-demand snapshot surface.
> **§DX-02l (2026-08-03)** gave that surface its `./api.sh` wrapper (it had none —
> verifying it needed raw `curl`), plus `./api.sh snapshots` to *see* the dated
> files at all. The sweep there deliberately refuses a snapshot this chain has
> never patched: `archive-snapshots.sh` records a delta before it removes a file,
> so an unarchived snapshot is the only copy of that state (`--force` discards it).

`monitor-snapshots.py` detects the new file, waits until all file handles
close (`lsof`), then:

1. Computes a unified diff against the previous snapshot.
2. Writes `milepoints/patches/YYYYMMDD-HHMMSS.patch` — the change set.
3. Advances `milepoints/patches/_last.html` — the baseline for the next diff.
4. Deletes the timestamped copy (it has been absorbed into the patch store).

### Patch store layout

```
milepoints/patches/
  _base.html.gz                      ← first snapshot, gzip-compressed
  _last.html                         ← baseline for next diff
  _last.name                         ← filename of _last.html
  roll2hit-v3-YYYYMMDD-HHMMSS.patch  ← unified diff: prev → this
  roll2hit-v3-YYYYMMDD-HHMMSS.patch.log  ← say.log + server log sidecar
```

Each `.patch` file is a standard unified diff. You can replay any session by
applying patches in sequence with `patch -p0`. The sidecar `.patch.log`
captures voice output and server events that occurred between saves, anchoring
the patch in the context of what was happening at the time.

### Data changes vs code changes

Both live in the same file, so both appear in the same patch. A typical session
patch contains a mix of:

- **Data edits** — changed field values in `MONSTER_POOL`, `QUEST_DB`, etc.
- **Logic edits** — updated JavaScript in quest activation conditions or
  combat formulas.
- **UI edits** — HTML/CSS changes to the game interface.

The diff viewer in the TUI colours them the same way (`+` green, `-` red) and
the developer decides which sessions are worth promoting to a git commit.

---

## monitor-snapshots.py — The Control Panel

Running `python3 monitor-snapshots.py` does everything:

1. Checks whether the WBAPI server is running on port 1367.
2. If not, opens a new macOS Terminal window running the server.
3. Starts the curses TUI in the current terminal.
4. Spawns a background worker that watches for new snapshot files.
5. Spawns a keepalive thread that polls the server every 3 s.

### TUI layout

```
┌─ Monitor-Snapshots ──────────────────────── paulr@sdf.org ─┐
│ ⏱ 00:12:34   7 patched   watching…                                     │
│ ● server pid 41203                                                      │
│ ← roll2hit-v3-20260610-144000.html                                      │
│ → roll2hit-v3-20260610-145312.html                                      │
│ ────────────────────────────────────────────────────────────────────── │
│  @@ -1823,7 +1823,7 @@                                                  │
│ - hp: 7,                                                                │
│ + hp: 9,                                                                │
│                                                                         │
│ ↑↓ · PgUp/Dn · r restart · k kill · dbl-click read · q quit            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Keyboard reference

| Key | Action |
|-----|--------|
| `↑` `↓` | Scroll diff one line |
| `PgUp` `PgDn` | Scroll diff one page |
| `r` | Restart server — tries `POST /api/restart` first (graceful, state saved); falls back to kill if unresponsive |
| `k` | Kill server process; keepalive respawns it |
| `q` / `Esc` | Quit TUI + send graceful `POST /api/restart` to the server (no force kill) |
| Double-click green line | Read the line aloud (text-to-speech, random voice) |
| Single click | Stop speaking |

### Server status bar

The second line of the TUI shows live server state:

- `● server pid 41203` — green, server running
- `○ server DOWN  respawning…` — red, keepalive is attempting a restart
- `○ server DOWN  run: ./wbapi-toggle.sh fg` — red, auto-spawn exhausted; start manually

### Keepalive behaviour

The keepalive thread enforces a **15-second spawn cooldown** after any Terminal
window is opened. This prevents the monitor from opening a second window while
the server is still loading the 210 MB file. After two failed spawn attempts the
keepalive stops trying and displays the manual start command in the status bar.

---

## Server Lifecycle

### wbapi-toggle.sh

The server manager. Understands `start`, `stop`, `restart`, `status`, `fg`,
and `toggle` (default).

```bash
./wbapi-toggle.sh fg        # foreground, verbose, restart on exit 67
./wbapi-toggle.sh start     # background daemon
./wbapi-toggle.sh restart   # stop + start
./wbapi-toggle.sh status    # show PID and port
```

The **restart loop** inside `_run_loop` relaunches the server whenever it exits
with code 67. Any other exit code breaks the loop. `EADDRINUSE` specifically
exits with 0, which stops the loop cleanly without spawning duplicates.

### Memory

The game file is 210 MB. Parsing it with the Anthropic SDK loaded exceeds
Node's default V8 heap limit (~1.5 GB). The toggle script starts node with:

```bash
node --max-old-space-size=4096 wbapi-server.js
```

### Error reporting

On any startup failure the server writes `milepoints/wbapi-server.error`:

| Condition | Exit code | Error file written |
|-----------|-----------|-------------------|
| Port already in use | 0 (clean) | Yes — conflict message |
| `server.listen` failure | 1 | Yes — error + stack |
| Uncaught exception (crash) | 67 (restart) | Yes — crash + stack |
| Unhandled rejection (crash) | 67 (restart) | Yes — crash + stack |
| Clean startup | — | File deleted |

The error file is cleared on every successful `server.listen` so its presence
alone indicates a problem.

---

## Runtime Mode Config

The server's verbosity is controlled by a persistent config file,
`milepoints/wbapi-config.json`, changeable at runtime without restarting:

```bash
./api.sh mode           # show current mode
./api.sh mode fast      # quiet — minimal output
./api.sh mode debug     # verbose — request/response bodies
./api.sh mode trace     # verbose + full algorithm trace (default)
```

| Mode | VERBOSE | TRACE | Console = Log file |
|------|---------|-------|--------------------|
| fast | false | false | No — LOGIC/REQUEST levels are file-only |
| debug | true | false | Yes — all levels go to both |
| trace | true | true | Yes — all levels go to both |

The default mode is **trace**. In debug and trace modes the console and log
file receive identical output, making it straightforward to tail the log file
and see exactly what the terminal shows.

Env vars `WBAPI_VERBOSE=1` and `WBAPI_TRACE=1` override the config file on
startup, useful for one-off testing without changing the persistent setting.

---

## api.sh CLI

`api.sh` delegates to `src/api/wb.js`, a Node.js CLI client that handles nonces,
retry/backoff, and pipe-safe JSON output. Common commands:

```bash
./api.sh ping                          # health check
./api.sh mode trace                    # set logging mode
./api.sh get node HKG                  # fetch a node (HKG = Neon Undercity; the old `CY` code is dead — §AUDIT-03l)
./api.sh put quest quest_wis_01 hp=12  # patch a field
./api.sh list npc --q egil             # search by name
./api.sh audit                         # integrity scan
./api.sh reachability                  # read-only connectivity check (reweave retired §WALK-3)
./api.sh save                          # flush memory to disk
./api.sh restart                       # graceful restart
```

---

## macOS Developer Environment

The environment is designed for a single developer on macOS running everything
locally.

### Terminal layout

`python3 monitor-snapshots.py` produces two windows:

- **Current terminal** — Monitor-Snapshots TUI (snapshot diffs, server status,
  keyboard control).
- **New Terminal window** — WBAPI server in foreground mode, log scrolling live.

The server window is opened via `osascript` (AppleScript). On first run macOS
may require Automation permission:

> System Settings → Privacy & Security → Automation
> Enable Terminal (or Python) to control Terminal.app.

If permission has not been granted the monitor prints instructions before
launching the TUI, then starts anyway with the server shown as DOWN. The
developer can start the server manually in a separate tab
(`./wbapi-toggle.sh fg`) and the keepalive will detect it within 3 seconds.

### Ports and processes

| Port / process | Purpose |
|----------------|---------|
| `:1367` | WBAPI server (Node.js) |
| `wbapi-server.js` | Server process, managed by wbapi-toggle.sh |
| `monitor-snapshots.py` | TUI + keepalive + snapshot worker |

### Log files

| File | Contents |
|------|----------|
| `milepoints/wbapi-server.log` | All server events (requests, loads, errors) |
| `milepoints/wbapi-server.error` | Last startup failure (deleted on clean start) |
| `milepoints/say.log` | Text-to-speech utterances |
| `milepoints/npc-speak.log` | NPC dialogue spoken via `./api.sh speak` |
| `milepoints/patches/` | Snapshot diffs (change sets) |

---

## Design Intentions

**Keep the file canonical.** Every feature is built to read and write the HTML
file, not to replace it. The game can always be opened in a browser with no
server. The tooling is additive.

**Make small saves cheap.** The snapshot system removes the cost of saving
frequently. Developers should save after every meaningful change, not batch
edits into "a good commit." The patch store is the granular history; git is the
curated history.

**The monitor is always running.** It is not a tool you launch for specific
tasks. It is the ambient environment — always watching, always ready to show
what changed, always keeping the server alive. Closing it sends a graceful
restart to the server so state is preserved.

**Verbose by default.** The default mode is `trace`. New developers (and Claude)
should see everything the server is doing. Speed can be traded for silence with
`./api.sh mode fast` when the trace output becomes noise.

**Fail loudly, recover quietly.** Startup failures write an error file and log
to stderr. Runtime crashes exit with code 67 and the toggle script relaunches
automatically. The developer sees what went wrong; the environment heals itself.
