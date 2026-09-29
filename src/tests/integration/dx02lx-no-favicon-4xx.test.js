// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02lx — the game page loads with no 4xx, whether a static host or a WBAPI
// server serves it; a browser asks every origin for /favicon.ico otherwise.
const { test, expect } = require('@playwright/test');

for (const url of ['/play.html', 'http://localhost:1367/api/source']) {
  test(`loading ${url} draws no 4xx`, async ({ page }) => {
    const bad = [];
    page.on('response', r => { if (r.status() >= 400 && r.status() < 500) bad.push(`${r.status()} ${r.url()}`); });
    page.on('console', m => { if (m.type() === 'error' && /\b4\d\d\b/.test(m.text())) bad.push(`${m.text()} ${m.location().url}`); });
    await page.addInitScript(() => localStorage.clear());
    await page.goto(url);
    await page.locator('#story-panel').waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    expect(bad).toEqual([]);
  });
}
