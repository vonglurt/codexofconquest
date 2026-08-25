// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02hd — the operator log tells the truth for both MONSTER_DROPS shapes.
//
// Why this test exists: MONSTER_DROPS carries two shapes — 386 single trophy
// objects and 13 weighted tables (arrays: void_shaman, rabid_dog and 11
// farmyard/urban animals). Both drop readers formatted with
// `${drop.icon} ${drop.name} · ${drop.sell}gp`, which an array has none of, so
// `GET /api/monster/void_shaman/drop` logged `undefined  ·  0gp` while returning
// a correct JSON body. It is the cosmetic end of the same one-shape blindness
// that produced §DX-02ha's false measurement and §DX-02hc's silent corruption.
//
// The assertions pin: (1) the array branch names the size and the entries;
// (2) the object branch is unchanged; (3) BOTH call sites — the /drop route and
// the `get monster` entity summary — go through the shared formatter, so a third
// reader cannot be added with the old inline template.
//
// Pure-node: the helper is lifted out of the server source text and evaluated,
// so no server is started and play.html is never touched.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'src', 'js', 'wbapi-server.js'), 'utf8');

function loadHelper() {
  const start = SERVER.indexOf('function dropLogLine(drop) {');
  expect(start, 'dropLogLine must exist in wbapi-server.js').toBeGreaterThan(-1);
  const end = SERVER.indexOf('\n}\n', start) + 3;
  // eslint-disable-next-line no-new-func
  return new Function(SERVER.slice(start, end) + '\nreturn dropLogLine;')();
}

test('§DX-02hd — a weighted table logs its size and its entries, not undefined', () => {
  const dropLogLine = loadHelper();
  const line = dropLogLine([
    { icon: '🧪', name: 'Void Ichor Vial', sell: 22, weight: 4 },
    { icon: '🔷', name: 'Warden Sigil Shard', sell: 30, weight: 3 },
  ]);
  expect(line).not.toContain('undefined');
  expect(line).toContain('×2');
  expect(line).toContain('Void Ichor Vial');
  expect(line).toContain('Warden Sigil Shard');
});

test('§DX-02hd — a single trophy still logs icon, name and sell price', () => {
  const dropLogLine = loadHelper();
  expect(dropLogLine({ icon: '🌀', name: 'Furball Crown', sell: 18 }))
    .toBe('🌀  Furball Crown  ·  18gp');
});

test('§DX-02hd — a trophy missing icon/sell degrades without printing undefined', () => {
  const dropLogLine = loadHelper();
  const line = dropLogLine({ name: 'Plain Pelt' });
  expect(line).not.toContain('undefined');
  expect(line).toContain('Plain Pelt');
  expect(line).toContain('0gp');
});

test('§DX-02hd — both drop readers format through the shared helper', () => {
  expect(SERVER).toContain("logRow('drop', dropLogLine(drop));");
  expect(SERVER).toContain("' ·  drop: '+dropLogLine(drop)");
  // The one-shape template survives in exactly one place — inside dropLogLine's
  // object branch — and nowhere else, so no reader can format a drop on its own.
  const tmpl = "`${drop.icon||''}  ${drop.name}  ·  ${drop.sell||0}gp`";
  expect(SERVER.split(tmpl).length - 1).toBe(1);
  expect(SERVER).not.toContain("' ·  drop: '+drop.name:");
});
