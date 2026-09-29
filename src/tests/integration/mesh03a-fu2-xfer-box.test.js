// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §MESH-03a-FU2 — the 🔑 hand-over code box is a readable box, not an unstyled strip.
const { test, expect } = require('@playwright/test');

test('the hand-over code box shows the request code at a readable size', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/play.html');
  await page.locator('#story-panel').waitFor({ state: 'visible' });
  await page.evaluate(() => { switchSheet('sheet-map'); msubSwitch('msub-lists'); });
  await page.evaluate(() => mlTransfer('request'));
  const box = await page.evaluate(() => {
    const el = document.getElementById('ml-xfer-code');
    const r = el.getBoundingClientRect();
    return { h: r.height, w: r.width, code: el.value, bg: getComputedStyle(el).backgroundColor };
  });
  expect(box.code).toMatch(/^codex-req1\./);
  expect(box.h).toBeGreaterThanOrEqual(48);
  expect(box.w).toBeGreaterThanOrEqual(200);
  expect(box.bg).not.toBe('rgb(255, 255, 255)');
});
