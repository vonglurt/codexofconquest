// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §AUDIT-03l — the node reference an author reads is GENERATED, and it cannot drift.
//
// Why this test exists: `maps.md`'s hand-maintained legend was the doc you consulted to
// write an `activateNode`, and 81 of its 92 rows named codes that no longer exist — in a
// coordinate space (26×16) the world had left behind. That table is the most likely source
// of `710bb75`, which put `activateNode:"SF"` on eight quests; the repair commit then
// guessed `SF → LCY` and two of them sat in the wrong city for two months (§AUDIT-03c).
//
// The fix was not to hand-remap 92 rows into a dead coordinate system — it was to generate
// the index from the live parse (`scripts/node-index.js`, `npm run nodes`) and quarantine
// the historical tables. These assertions lock that: the generated file matches the game,
// every code it names is real, and the two collision traps stay flagged.
//
// Pure-node (no browser): this is an authoring-surface + docs invariant.

const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const GAME = path.join(ROOT, 'play.html');
const INDEX = path.join(ROOT, 'docs', 'maps', 'node-index.md');
const GEN = path.join(ROOT, 'src', 'scripts', 'node-index.js');

function freshWorld() {
  delete require.cache[require.resolve(path.join(ROOT, 'src', 'js', 'wbapi-core.js'))];
  const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
  W.load(GAME);
  return W;
}
const readIndex = () => fs.readFileSync(INDEX, 'utf8');

test.describe('§AUDIT-03l — the generated node index', () => {
  test('the committed index is byte-identical to a fresh generation (check:walk gate #12)', () => {
    const fresh = execFileSync(process.execPath, [GEN, '--stdout'], { encoding: 'utf8' });
    expect(fresh).toBe(readIndex());
    // and the gate itself agrees
    expect(() => execFileSync(process.execPath, [GEN, '--check'], { encoding: 'utf8' })).not.toThrow();
  });

  test('it lists every live node exactly once, with the live num/terrain/label', () => {
    const W = freshWorld();
    const body = readIndex();
    const mainTable = body.slice(0, body.indexOf('## LEGACY CODE MAP'));   // the legacy map has its own `code | num |` shape
    const rows = new Map();
    for (const line of mainTable.split('\n')) {
      const m = line.match(/^\| `([A-Z][A-Z0-9_]*)` \| (\d+|—) \| `([a-z0-9_]*)` \|/);
      if (m) rows.set(m[1], { num: m[2], terrain: m[3] });
    }
    const live = Object.keys(W.nodeMap);
    expect(rows.size).toBe(live.length);
    for (const code of live) {
      const row = rows.get(code);
      expect(row, `${code} missing from the generated index`).toBeTruthy();
      expect(row.terrain).toBe(W.nodeMap[code].name || '');
      expect(row.num).toBe(Number.isFinite(W.nodeMap[code].num) ? String(W.nodeMap[code].num) : '—');
    }
  });

  test('every live code in the LEGACY CODE MAP resolves — and no legacy code is offered as live', () => {
    const W = freshWorld();
    const body = readIndex();
    const legacySection = body.slice(body.indexOf('## LEGACY CODE MAP'));
    const recovered = [...legacySection.matchAll(/^\| `([A-Z][A-Z0-9]*)` \| (\d+) \| \*\*`([A-Z][A-Z0-9_]*)`\*\* \|/gm)];
    expect(recovered.length).toBeGreaterThan(50);
    for (const [, legacyCode, num, liveCode] of recovered) {
      expect(W.nodeMap[liveCode], `LEGACY CODE MAP points at ${liveCode}, which is not a node`).toBeTruthy();
      // the num must be the LEGACY node's number, corroborating the match — never invented
      expect(W.nodeMap[liveCode].num, `${legacyCode} → ${liveCode} must be justified by Node # ${num}`).toBe(Number(num));
    }
    // A handful of codes survived the rename untouched (EF2 · LC1–LC4 · LCA · LSO), so
    // identity rows are legitimate — but most must be genuine renames, or the map is a no-op.
    expect(recovered.filter(([, l, , v]) => l !== v).length).toBeGreaterThan(recovered.length * 0.8);
  });

  test('the two code collisions stay flagged — a legacy code that IS a live key, for another node', () => {
    const W = freshWorld();
    const body = readIndex();
    // CI: Birka's streets historically (num 1 → LHR); the Chancery Court live (num 429).
    // BK: the Broken Tooth Tavern historically (num 25 → VBY); Birka Shore live (num 241).
    for (const [code, liveLabelFragment] of [['CI', 'Chancery'], ['BK', 'Birka Shore']]) {
      expect(W.nodeMap[code], `${code} should still exist live for this trap to be real`).toBeTruthy();
      expect(W.nodeMap[code].label).toContain(liveLabelFragment);
      const row = body.split('\n').find(l => l.startsWith(`| \`${code}\` |`) && l.includes('ALSO a live key'));
      expect(row, `${code}'s collision must be flagged in the LEGACY CODE MAP`).toBeTruthy();
    }
  });

  test('maps.md sends readers to the generated index, and marks its own tables historical', () => {
    const maps = fs.readFileSync(path.join(ROOT, 'docs/design/maps.md'), 'utf8');
    expect(maps).toContain('docs/maps/node-index.md');
    // every section that still carries 26×16-era codes or coordinates must say so
    for (const heading of ['## TINY MAP', '## FULL MAP', '## LEGEND', '## NODE NETWORK',
                           '## COORDINATE INDEX', '## SLEEP NODES']) {
      const line = maps.split('\n').find(l => l.startsWith(heading));
      expect(line, `${heading} not found`).toBeTruthy();
      expect(line, `${heading} must be marked HISTORICAL`).toContain('HISTORICAL');
    }
  });
});
