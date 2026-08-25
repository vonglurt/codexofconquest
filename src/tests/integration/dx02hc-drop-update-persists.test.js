// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02hc — updating a monster's trophy drop actually reaches the file.
//
// Why this test exists: `PUT /api/monster/:key/drop` was two lines —
// `Object.assign(WBAPI.monsterDrops[key], body)` — and nothing more. `save()`
// writes `_rawSrc`, which was never touched, so the edit was gone on the next
// parse while the operator had already been told `ok:true`. Measured live
// 2026-08-25 on the shipped file: `./bin/api drop taz_devil sell=19 --update`
// returned `ok:true` with `sell:19`, disk still read `sell:18`, and the
// documented escape hatch — `POST /api/save` — left play.html byte-identical.
//
// This is the third member of the family §DX-01c (create) and §DX-01d/i (delete)
// already closed: a write path that reports success without persisting. Same
// standing lesson all three times — the failure is silent because nothing throws.
//
// The second defect on the same route: MONSTER_DROPS carries TWO shapes. 386 keys
// are one object `{icon,name,sell}`; 13 are a weighted array of
// `{icon,name,sell,weight}` — `battKillEvent` reads both via `Array.isArray`.
// `Object.assign` onto an array sets `.name`/`.sell` as NON-INDEX properties:
// invisible to `JSON.stringify`, invisible to the weighted picker, read by
// nothing. A flat update cannot address a table, so the route now refuses.
//
// Pure-node (no browser): an authoring-surface invariant. Every case runs against
// an in-memory copy — `play.html` is never written.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const GAME = path.join(ROOT, 'play.html');
const SRC = fs.readFileSync(GAME, 'utf8');

function freshWorld() {
  delete require.cache[require.resolve(path.join(ROOT, 'src', 'js', 'wbapi-core.js'))];
  const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
  W.load(SRC);
  return W;
}

// The operator-visible truth: serialize what the writer produced, parse it back.
function roundTrip(W) {
  const W2 = freshWorld();
  W2.load(W._rawSrc);
  return W2;
}

const dropLiteral = (key, d) =>
  `  ${key}: { icon:${JSON.stringify(d.icon || '📦')}, name:${JSON.stringify(d.name)}, sell:${Number(d.sell || 0)} },\n`;

test.describe('§DX-02hc — MONSTER_DROPS updates persist, and tables are not flattened', () => {

  test('the two shapes both exist, and the engine reads both', () => {
    const W = freshWorld();
    const entries = Object.entries(W.monsterDrops);
    const arrays = entries.filter(([, d]) => Array.isArray(d));
    const objects = entries.filter(([, d]) => !Array.isArray(d));

    expect(arrays.length).toBeGreaterThan(0);
    expect(objects.length).toBeGreaterThan(0);
    expect(arrays.map(([k]) => k)).toContain('void_shaman');

    // Every array entry is a weighted table, not an accident of parsing.
    for (const [key, table] of arrays) {
      expect(table.length, `${key} table is empty`).toBeGreaterThan(0);
      for (const row of table) expect(row, `${key} row lacks a name`).toHaveProperty('name');
    }

    // The engine's reader branches on exactly this.
    expect(SRC).toContain('Array.isArray(_rawDrop) ? _pickDrop(_rawDrop) : _rawDrop');
  });

  test('an object-form drop update survives save + reload', () => {
    const W = freshWorld();
    const key = Object.keys(W.monsterDrops).find(k => !Array.isArray(W.monsterDrops[k]));
    const before = { ...W.monsterDrops[key] };
    const after = { ...before, sell: Number(before.sell || 0) + 7 };

    const rep = W.replaceEntrySource('MONSTER_DROPS', key, dropLiteral(key, after));
    expect(rep.ok, rep.error).toBe(true);

    // The round trip is the assertion: re-parse the text the writer produced.
    const W2 = roundTrip(W);
    expect(W2.monsterDrops[key].sell).toBe(after.sell);
    expect(W2.monsterDrops[key].sell).not.toBe(before.sell);
    expect(W2.monsterDrops[key].name).toBe(before.name);
  });

  test('replaceEntrySource touches exactly one entry and no neighbour', () => {
    const W = freshWorld();
    const key = Object.keys(W.monsterDrops).find(k => !Array.isArray(W.monsterDrops[k]));
    const keysBefore = Object.keys(W.monsterDrops);
    const countBefore = keysBefore.length;

    const d = W.monsterDrops[key];
    W.replaceEntrySource('MONSTER_DROPS', key, dropLiteral(key, { ...d, sell: 3 }));

    const W2 = roundTrip(W);
    expect(Object.keys(W2.monsterDrops)).toHaveLength(countBefore);
    expect(Object.keys(W2.monsterDrops)).toEqual(keysBefore);
    // The array-form tables are untouched by an unrelated object-form edit.
    expect(Array.isArray(W2.monsterDrops.void_shaman)).toBe(true);
    expect(W2.monsterDrops.void_shaman).toHaveLength(W.monsterDrops.void_shaman.length);
  });

  test('verify-or-revert: a replacement that would rename the key is refused, source untouched', () => {
    const W = freshWorld();
    const key = Object.keys(W.monsterDrops).find(k => !Array.isArray(W.monsterDrops[k]));
    const src = W._rawSrc;

    const rep = W.replaceEntrySource('MONSTER_DROPS', key, dropLiteral(key + '_typo', { name: 'X', sell: 1 }));
    expect(rep.ok).toBe(false);
    expect(rep.error).toMatch(/key set/);
    expect(W._rawSrc).toBe(src);
  });

  test('a flat update cannot address a weighted table — Object.assign would corrupt it', () => {
    const W = freshWorld();
    const table = W.monsterDrops.void_shaman;
    expect(Array.isArray(table)).toBe(true);

    // The old route's body, reproduced: the write lands nowhere a reader looks.
    const probe = JSON.parse(JSON.stringify(table));
    Object.assign(probe, { name: 'ZZZ-probe', sell: 1 });
    expect(JSON.parse(JSON.stringify(probe))).toEqual(JSON.parse(JSON.stringify(table)));
    expect(probe.map(e => e.name)).not.toContain('ZZZ-probe');

    // Which is why the route refuses instead.
    const route = fs.readFileSync(path.join(ROOT, 'src', 'js', 'wbapi-server.js'), 'utf8');
    expect(route).toContain('is a weighted table of ${existing.length} entries');
  });

  test('the PUT route writes at source level and auto-saves', () => {
    const route = fs.readFileSync(path.join(ROOT, 'src', 'js', 'wbapi-server.js'), 'utf8');
    const put = route.slice(route.indexOf('// PUT /api/monster/:key/drop'));
    const body = put.slice(0, put.indexOf('// PUT /api/npc/'));

    expect(body).toContain("WBAPI.replaceEntrySource('MONSTER_DROPS'");
    expect(body).toContain('saveAndRestart');
    // The in-memory-only assignment that made the write silent is gone.
    expect(body).not.toContain('Object.assign(WBAPI.monsterDrops[key], body)');
  });
});
