<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson -->
# src/importers/ — Historical content importers ⚠️ ARCHAIC

One-shot Python scripts that POSTed narrative content (books, node maps, NPC
dialogue) into the WBAPI server (`localhost:1367`) during the original build-out.

**These are archaic and out of date.** Every source has long since been imported
and now lives directly in `roll2hit-v3.html` (the single source of truth). The
scripts likely no longer run against the current server/schema and are kept for
reference only — each `.py` carries an ⚠️ ARCHAIC banner at the top.

- `import_*.py` — per-source importers (one per airport-code hub / book).
- `data/*.json` — the JSON payloads a few of them consumed.

Import history and the source-book pipeline live in `../BACKLOG.md`,
`../plan-archive.md`, and `../1367-sources/`.
