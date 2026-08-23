<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# Changelog

Notable changes to Codex of Conquest. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); this project does not use
semantic versioning for the game itself — the engine version string lives in
`play.html` as `ENGINE_VER`.

## [1.0.0] — 2026-08-23 — first public release

The project became public. It had been developed privately since 2026-05-24
across 1,471 commits.

### Renamed
- The game is **Codex of Conquest**, formerly *Roll2Hit*. `roll2hit-v3.html` →
  `play.html`; `worldbuilder.html` → `edit.html`; the domain `roll2hit.com` →
  `CodexOfConquest.com` throughout. Applied to every tracked file, history
  documents included — 518 occurrences across 155 files.
- `index.html` is now a landing page describing the project, not the game.

### Added
- `Makefile` + `run.sh` + `bin/` shortcuts as the single way to start things:
  `make run play edit wbapi monitor check test install purge stop status`.
- `src/server/start-wbapi.sh`, which prints the node binary, working directory,
  entry file, `node_modules` path and port before launching.
- A connection notice in `edit.html`: opened over `file://` the browser blocks
  the reads and writes the editor needs, and it now says so instead of failing
  quietly.
- `SECURITY.md`, `CHANGELOG.md`, `.editorconfig`, issue and pull-request
  templates.

### Changed
- Repository restructured: root holds only the three HTML entry points, the
  build/run files and the docs of record. Implementation lives in `src/`,
  documentation in `docs/`, generated and runtime output in `build/`, and
  unpublished working material in `vendor/`.
- The node project (`package.json`, `package-lock.json`, `node_modules/`) moved
  into `src/` — the deepest placement where `src/tests`, `src/js`, `src/api` and
  `src/scripts` all still resolve. See `src/NODE.md`.
- One canonical MIT notice on every publishable file. Copyright is held solely
  by Paul Richeson; AI contributions were a contracted service performed under
  the author's direction, recorded in `CONTRIBUTING.md` and in the git history.

### Removed
- 684 MB purged from git history: generated snapshots and logs, an imported book
  corpus, committed `node_modules`, and 36 one-off HTML backups. No `.md` of the
  project's own documentation was touched — all 126 lab reports and the full
  backlog history remain.

### Fixed
- The documentation anchor resolver capped symbols at 80 characters, silently
  skipping longer ones. Raised to 100, which surfaced four anchors that had been
  dead since they were written and never once checked.
- CI referenced fifteen paths that no longer existed and would have failed on the
  first push.
