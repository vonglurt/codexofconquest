// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ao — the editor's detail views can show where each value lives: a JS path that
// evaluates to the shown value in the running game, its data type, and its source line.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { openEditor } = require('./helpers');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const LINES = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8').split('\n');

test('dev-metadata chips name a path the game resolves to the shown value', async ({ page, context }) => {
  await openEditor(page);
  const chips = await page.evaluate(async () => {
    loadFile(await (await fetch('/play.html')).text());
    const mk = Object.keys(WBAPI.monsterPool).find((k) => WBAPI.monsterPool[k].ac > 0);
    renderMonsterDetail(WBAPI.monsters.get(mk));
    const hidden = getComputedStyle(document.querySelector('#md-body .dev-meta')).display;
    document.getElementById('btn-dev-meta').click();
    const read = (root) => [...root.querySelectorAll('.dev-meta')].map((el) => ({
      path: el.querySelector('.dev-path').textContent, type: el.querySelector('.dev-type').textContent,
      line: el.querySelector('.dev-line').textContent, key: el.dataset.key, shown: el.parentElement.querySelector('input,select,textarea')?.value,
      visible: getComputedStyle(el).display !== 'none' }));
    const monster = read(document.getElementById('md-body'));
    selectQuest(Object.keys(WBAPI.questDb).find((k) => WBAPI.questDb[k].title));
    const quest = read(document.getElementById('quest-detail-area'));
    const code = Object.keys(WBAPI.nodeMap).find((k) => WBAPI.nodeMap[k].label);
    renderNodeDetail(code);
    const node = read(document.getElementById('nd-body'));
    renderNpcDetail({ ...WBAPI.birkaNpcs.yael, key: 'yael' });
    const npc = read(document.getElementById('npc-detail-area'));
    return { hidden, monster, quest, node, npc };
  });
  expect(chips.hidden).toBe('none');
  for (const view of ['monster', 'quest', 'node', 'npc']) expect(chips[view].length, view).toBeGreaterThan(0);

  const all = [...chips.monster, ...chips.quest, ...chips.node, ...chips.npc];
  expect(all.every((c) => c.visible)).toBe(true);
  const ac = chips.monster.find((c) => c.path.endsWith('.ac'));
  expect(ac.type).toBe('number');

  const game = await context.newPage();
  await game.goto('/play.html');
  const values = await game.evaluate((paths) => paths.map((p) => {
    try { return { ok: true, v: (0, eval)(p) }; } catch (e) { return { ok: false, e: e.message }; }
  }), all.map((c) => c.path));
  all.forEach((c, i) => {
    expect(values[i].ok, `${c.path}: ${values[i].e}`).toBe(true);
    if (c.shown !== undefined && c.type !== 'absent') expect(String(values[i].v), c.path).toBe(c.shown);
    const n = Number(c.line.replace('play.html:', ''));
    expect(LINES[n - 1], `${c.path} → ${c.line}`).toMatch(new RegExp(`^\\s*['"]?${c.key}['"]?\\s*:`));
  });
});
