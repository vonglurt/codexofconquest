// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ll — every node in VENDOR_NODES names the NPC its shop card shows.
//
// The card reads `'🛒 Vendor: ' + (node.npc || 'Merchant')`. When the 26×16 codes were
// remapped, four of the five vendors moved to their live nodes and `BK` did not: it had
// become Birka Shore, which carries no npc, so Warlord Mordus's shop opened on a beach as
// "Merchant" while his own node, `VBY`, had none.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const GAME = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'play.html'), 'utf8');

function vendorNodes() {
  const m = GAME.match(/const VENDOR_NODES = new Set\(\[([^\]]*)\]\)/);
  return [...m[1].matchAll(/'([A-Z0-9]+)'/g)].map((x) => x[1]);
}

function nodeLine(code) {
  const start = GAME.indexOf('WORLDBUILDER:NODE_MAP:START');
  const end = GAME.indexOf('WORLDBUILDER:NODE_MAP:END');
  const m = GAME.slice(start, end).match(new RegExp(`^\\s*${code}:\\s*\\{\\s*num:[^\\n]*`, 'm'));
  return m && m[0];
}

test('§DX-02ll — each vendor node exists and names its vendor', () => {
  const codes = vendorNodes();
  expect(codes.length).toBe(5);
  for (const code of codes) {
    const line = nodeLine(code);
    expect(line, `${code} is not a NODE_MAP key`).toBeTruthy();
    expect(line, `${code} has no npc, so its shop card reads "Merchant"`).toMatch(/\bnpc:\s*['"][^'"]+['"]/);
  }
});

test('§DX-02ll — Warlord Mordus keeps shop at his own node', () => {
  expect(vendorNodes()).toContain('VBY');
  expect(nodeLine('VBY')).toMatch(/npc:\s*['"]Warlord Kael Mordus['"]/);
});
