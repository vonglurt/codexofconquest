// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ic — there is one milepoints/ directory and it is build/milepoints/.
//
// Why this test exists. The server half of the tooling (wbapi-server.js, wb.js,
// say.sh, sayd.sh) resolved build/milepoints/; the monitor half
// (monitor-snapshots.py, archive-snapshots.sh) resolved a second milepoints/ at
// the repo root. Both directories existed and both held live data, so the patch
// chain and the archive sweeper were not necessarily reading the same chain.
//
// The sharp end was not tidiness. Three of the monitor's four constants named
// files that NOTHING WROTE: SAY_LOG against say.sh's build/milepoints/say.log,
// SERVER_LOG against wbapi-server.js's build/milepoints/wbapi-server.log, and
// SAY_LOCK_FILE — carrying the comment "shared with sayd.sh" — against a lock
// sayd.sh opens somewhere else entirely, so the mutual exclusion it exists for
// never happened. A path constant fails silently: the file simply stays empty.
//
// The durable assertion is the last one: no shipped source may resolve a
// root-level milepoints/ as a write target. archive-snapshots.sh is allowed to
// READ one, because a host that predates this change still has snapshots there
// and stranding them would be a worse bug than the one being fixed.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

test.describe('§DX-02ic — one milepoints root', () => {
  test('the monitor and the say daemon lock the same file', () => {
    const monitor = read('src/bin/monitor-snapshots.py');
    const sayd = read('src/bin/sayd.sh');
    expect(monitor).toContain('SAY_LOCK_FILE = MILEPOINTS / "say.lock"');
    expect(monitor).toContain('MILEPOINTS  = ROOT / "build" / "milepoints"');
    expect(sayd).toContain('LOCK_FILE="$ROOT/build/milepoints/say.lock"');
  });

  test('the monitor tails the logs that are actually written', () => {
    const monitor = read('src/bin/monitor-snapshots.py');
    expect(monitor, 'say.log is the one say.sh appends to').toContain('SAY_LOG     = MILEPOINTS / "say.log"');
    expect(read('src/bin/say.sh')).toContain('LOG="$ROOT/build/milepoints/say.log"');
    expect(monitor).toContain('SERVER_LOG  = MILEPOINTS / "wbapi-server.log"');
    expect(read('src/js/wbapi-server.js')).toContain("'build', 'milepoints', 'wbapi-server.log'");
  });

  test('the sweeper writes under build/ and still drains a legacy root dir', () => {
    const sweeper = read('src/bin/archive-snapshots.sh');
    expect(sweeper).toContain('MILEPOINTS="$ROOT_DIR/build/milepoints"');
    expect(sweeper, 'a pre-change host strands nothing').toContain('LEGACY_MILEPOINTS="$ROOT_DIR/milepoints"');
    expect(sweeper, 'three source dirs means whole-path sort is not chronological')
      .toContain("awk -F/ '{print $NF\"\\t\"$0}'");
  });

  test('no shipped source resolves a root-level milepoints/ as a write target', () => {
    const files = [
      'src/bin/monitor-snapshots.py', 'src/bin/say.sh', 'src/bin/sayd.sh',
      'src/js/wbapi-server.js', 'src/api/wb.js',
    ];
    for (const f of files) {
      const offenders = read(f).split('\n')
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => /ROOT[^\n]*["'/]milepoints/.test(line) && !/build/.test(line));
      expect(offenders.map((o) => `${f}:${o.n}`), `${f} resolves milepoints/ only under build/`).toEqual([]);
    }
  });
});
