'use strict';
// §STATE-INIT regression: a fresh load (no autosave) followed by a move must not crash.
// Before the fix, storyEnter() rendered the story panel using the stale partial S_story
// literal (no visitedCells), so cellMove threw "Cannot set properties of undefined".
const { test, expect } = require('@playwright/test');

test('fresh load: S_story carries the full default shape before any entry flow', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/roll2hit-v3.html');
  await page.locator('#story-panel').waitFor({ state: 'visible' });
  // These fields lived only in _S_DEFAULTS(), not the seed literal — assert they exist.
  const shape = await page.evaluate(() => ({
    visitedCells: S_story.visitedCells,
    playerR: S_story.playerR,
    playerC: S_story.playerC,
    hasCareerStats: !!S_story.careerStats,
  }));
  expect(typeof shape.visitedCells).toBe('object');
  expect(shape.visitedCells).not.toBeNull();
  expect(typeof shape.playerR).toBe('number');
  expect(typeof shape.playerC).toBe('number');
  expect(shape.hasCareerStats).toBe(true);
});

test('fresh load: moving via cellMove records the cell and throws nothing', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/roll2hit-v3.html');
  await page.locator('#story-panel').waitFor({ state: 'visible' });

  // Exercise the exact crash path from the bug report (cellMove → visitedCells write).
  const result = await page.evaluate(() => {
    const before = { r: S_story.playerR, c: S_story.playerC };
    cellMove('E');
    cellMove('S');
    return { before, count: Object.keys(S_story.visitedCells || {}).length };
  });

  expect(errors, 'no uncaught page errors during movement').toEqual([]);
  expect(result.count).toBeGreaterThan(0);
});
