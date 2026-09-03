// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02cl — the ❗ map marker reads _questNodes(), a per-session Set; a quest injected into
// QUEST_DB at runtime must reach the marker on the next arrival without a reload, through the
// same size guard _questsByNodeRevalidate() already runs once per storyRender (§DX-02ea).
'use strict';
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

const HTML = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'play.html'), 'utf8');

test.describe('§DX-02cl — the quest-node marker index shares the arrival size guard', () => {
  test('a quest injected at runtime shows ❗ at its activateNode after the next render', async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
    const r = await page.evaluate(() => {
      const code = Object.keys(NODE_MAP).find(k => k !== S_story.currentCode && _mapIcon(k) === '·');
      const before = { icon: _mapIcon(code), inSet: _questNodes().has(code), byNode: _questsByNode(code).length };
      QUEST_DB.dx02cl_probe = { id: 'dx02cl_probe', type: 'side', title: 'probe', desc: '', hint: '',
        passText: '', failText: '', activateNode: code, waypointNode: code, gate: {}, completion: {}, bits: [], onComplete: [] };
      storyRender(NODE_MAP[S_story.currentCode]);
      const after = { icon: _mapIcon(code), inSet: _questNodes().has(code), byNode: _questsByNode(code).length };
      return { code, before, after };
    });
    expect(r.code).toBeTruthy();
    expect(r.before).toEqual({ icon: '·', inSet: false, byNode: 0 });
    expect(r.after.byNode, 'the sibling index sees the injected quest').toBe(1);
    expect(r.after.inSet, 'the marker Set sees it through the same guard').toBe(true);
    expect(r.after.icon).toBe('❗');
  });

  test('a render with no QUEST_DB change keeps the cached Set (one rebuild, not one per render)', async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
    const same = await page.evaluate(() => {
      const a = _questNodes();
      storyRender(NODE_MAP[S_story.currentCode]);
      return a === _questNodes();
    });
    expect(same).toBe(true);
  });

  test('the invalidation lives in _questsByNodeRevalidate, not in a second guard', () => {
    const region = HTML.slice(HTML.indexOf('let _questNodeSet = null;'), HTML.indexOf('function _questsByNode(nodeCode)'));
    const body = region.slice(region.indexOf('function _questsByNodeRevalidate()'));
    expect(body).toMatch(/_questNodeSet = null/);
    expect((region.match(/Object\.keys\(QUEST_DB\)\.length/g) || []).length, 'one size guard serves both indexes').toBe(1);
  });
});
