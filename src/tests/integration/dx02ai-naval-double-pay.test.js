// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ai — a storyRender button that writes the flag a quest completes on must not also pay
// what the quest pays. The XP delta across ONE click is the measurement, not the toast text.
'use strict';
const { test, expect } = require('@playwright/test');
const { SEED_STATE, dismissContinue } = require('./helpers');

async function at(page, code, overrides = {}) {
  const state = Object.assign({}, SEED_STATE, {
    currentCode: code, checkpointNode: code, visited: { [code]: true }, visitedCells: {},
    rngState: 424242, inventory: [], quests: {}, level: 1, xp: 0,
  }, overrides);
  await page.addInitScript(s => {
    localStorage.clear();
    localStorage.setItem('coc_autosave', JSON.stringify(s));
  }, state);
  await page.goto('/play.html');
  await dismissContinue(page);
}

const clickAndMeasure = (page, panelId, text, questId) => page.evaluate(([pid, t, qid]) => {
  const before = { xp: S_story.xp || 0, gold: S_story.gold || 0, status: S_story.quests[qid] };
  const btn = [...document.querySelectorAll('#' + pid + ' button')].find(b => b.textContent.includes(t));
  btn.click();
  return { before, after: { xp: S_story.xp || 0, gold: S_story.gold || 0, status: S_story.quests[qid] } };
}, [panelId, text, questId]);

test.describe('§DX-02ai — one click, one payment', () => {
  test('MME hull repair: the quest pays its 200 XP once, the button pays only the 200 gp', async ({ page }) => {
    await at(page, 'MME', { saltwickAccessed: true, gold: 500 });
    const r = await clickAndMeasure(page, 'story-sk-hull', 'Commission hull repair', 'quest_sk_hull');
    expect(r.before.status, 'the quest is active on arrival').toBe('active');
    expect(r.after.status, 'the same click completes it').toBe('complete');
    expect(r.after.gold - r.before.gold).toBe(-200);
    expect(r.after.xp - r.before.xp, 'XP paid exactly once, by the quest').toBe(200);
  });

  test('DNF Fehn confrontation: the button pays 400 gp / 400 XP and the quest pays nothing more', async ({ page }) => {
    await at(page, 'DNF', { dunfallAccessed: true, brimFound: true, gold: 0 });
    const r = await clickAndMeasure(page, 'story-spark2-df', 'Confront Commissioner Fehn', 'quest_spark2_05');
    expect(r.before.status).toBe('active');
    expect(r.after.status).toBe('complete');
    expect(r.after.gold - r.before.gold).toBe(400);
    expect(r.after.xp - r.before.xp).toBe(400);
  });
});
