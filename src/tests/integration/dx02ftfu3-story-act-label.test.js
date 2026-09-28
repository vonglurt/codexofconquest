// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ft-FU3 — the campaign act (storyAct) is on screen: a sidebar row beside the Day,
// while the act badge keeps naming the region underfoot.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const GAME = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'play.html'), 'utf8');

function label(storyAct) {
  const start = GAME.indexOf('function _storyActLabel()');
  const src = GAME.slice(start, GAME.indexOf('\n}\n', start) + 2);
  const o = { S_story: { storyAct } };
  vm.createContext(o);
  return vm.runInContext(src + '\n_storyActLabel();', o);
}

test('§DX-02ft-FU3 — the label names the campaign act, I to VIII, and a save without the field reads Act I', () => {
  expect([1, 2, 3, 4, 5, 6, 7, 8].map(label)).toEqual(['Act I', 'Act II', 'Act III', 'Act IV', 'Act V', 'Act VI', 'Act VII', 'Act VIII']);
  expect(label(undefined)).toBe('Act I');
});

test('§DX-02ft-FU3 — the sidebar carries the row and every status refresh writes it; the badge still reads node.act', () => {
  expect(GAME).toContain('id="s-story-act"');
  expect(GAME).toContain("document.getElementById('s-story-act').textContent = _storyActLabel();");
  expect(GAME).toContain("document.getElementById('story-act-badge').textContent = '— ' + ACT_NAMES[node.act] + ' —';");
});
