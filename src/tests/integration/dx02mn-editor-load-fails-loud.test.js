// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02mn — edit.html parses play.html with its own copies of core's parsers. A section
// that is present but unreadable is refused by name, as core refuses it (§DX-02fi), and
// never shown as an empty collection.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { openEditor } = require('./helpers');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const GOOD = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8');
const BROKEN = GOOD.replace('const QUEST_DB = {', 'const QUEST_DB = { @@@');
const file = (buffer) => ({ name: 'play.html', mimeType: 'text/html', buffer: Buffer.from(buffer) });

test.describe('§DX-02mn — the editor refuses an unreadable section by name', () => {
  test('the broken copy differs from play.html', () => {
    expect(BROKEN).not.toBe(GOOD);
  });

  test('a broken QUEST_DB opened from the welcome screen names itself and opens nothing', async ({ page }) => {
    await page.route('http://localhost:1367/api/ping', (route) => route.abort());
    await page.goto('/edit.html');
    await page.locator('#welcome-file-input').setInputFiles(file(BROKEN));
    await expect(page.locator('#wcard-browse-status')).toContainText('QUEST_DB is present in the source but does not parse');
    await expect(page.locator('#wcard-browse')).toHaveClass(/\berr\b/);
    await expect(page.locator('#welcome-screen')).toBeVisible();
    expect(await page.evaluate(() => WBAPI.loaded)).toBeFalsy();
    await expect(page.locator('#quest-count')).toHaveText('—');
  });

  test('a broken file dropped over a loaded world keeps that world and says why', async ({ page }) => {
    await openEditor(page);
    await page.evaluate((t) => loadFile(t), GOOD);
    const quests = await page.evaluate(() => Object.keys(WBAPI.questDb).length);
    expect(quests).toBeGreaterThan(2000);
    const r = await page.evaluate((t) => loadFile(t), BROKEN);
    expect(r).toContain('QUEST_DB is present in the source but does not parse');
    await expect(page.locator('#load-error')).toBeVisible();
    await expect(page.locator('#load-error')).toContainText('QUEST_DB');
    expect(await page.evaluate(() => Object.keys(WBAPI.questDb).length)).toBe(quests);
    await expect(page.locator('#quest-count')).toHaveText(`${quests} quests`);
    expect(await page.evaluate((t) => loadFile(t), GOOD)).toBeNull();
    await expect(page.locator('#load-error')).toBeHidden();
  });

  test('New World, whose sections are all empty literals, still opens', async ({ page }) => {
    await page.route('http://localhost:1367/api/ping', (route) => route.abort());
    await page.goto('/edit.html');
    await page.locator('#wcard-new').click();
    await expect(page.locator('#welcome-screen')).toBeHidden();
    expect(await page.evaluate(() => WBAPI.loaded)).toBe(true);
    await expect(page.locator('#quest-count')).toHaveText('0 quests');
    await expect(page.locator('#load-error')).toBeHidden();
  });
});
