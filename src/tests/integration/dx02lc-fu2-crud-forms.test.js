// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02lc-FU2 — the worldbuilder's CRUD forms offered npc `role`/`desc`, which no NPC carries,
// and a monster tier `boss`, which is not a tier. The create routes refuse all three, so a
// form may offer only what its create writes.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const html = fs.readFileSync(path.join(ROOT, 'edit.html'), 'utf8');

function formFields(type) {
  const at = html.indexOf(`\n    ${type}: {\n      cols:`);
  expect(at, `CRUD_TYPES.${type}`).toBeGreaterThan(-1);
  const from = html.indexOf('fields: [', at);
  const block = html.slice(from, html.indexOf('\n      ],', from));
  return [...block.matchAll(/\{ key:'(\w+)'/g)].map(m => m[1]);
}

test('§DX-02lc-FU2 — the npc and monster forms offer only fields their create writes', () => {
  const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
  W.load(path.join(ROOT, 'play.html'));
  const npcCarried = new Set(Object.values(W.birkaNpcs).flatMap(n => Object.keys(n)));
  expect(formFields('npc').filter(f => !npcCarried.has(f))).toEqual([]);
  const monsterWrites = new Set(['key', 'name', ...W.monsters.STATS, 'tier', 'voidTainted']);
  expect(formFields('monster').filter(f => !monsterWrites.has(f))).toEqual([]);
});

test('§DX-02lc-FU2 — every tier list in the worldbuilder is the five tiers the game has', () => {
  const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
  expect(html).toContain(`const TIER_ORDER = ${JSON.stringify(W.monsters.TIERS).replace(/"/g, "'")};`);
  expect(html).not.toMatch(/'boss'\]/);
  expect(html).not.toMatch(/\['trivial','easy','medium','hard'(,'boss')?\]/);
});
