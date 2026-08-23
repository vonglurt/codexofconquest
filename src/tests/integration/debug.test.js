// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
const { test, expect } = require('@playwright/test');
const { patchGameHtml } = require('./helpers.js');

test('debug — patched game script loads and storyFishing is accessible', async ({ page }) => {
  await patchGameHtml(page);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message.substring(0, 80)));
  await page.goto('/play.html');
  await page.waitForLoadState('networkidle');

  const ok = await page.evaluate(() => typeof storyFishing === 'function');
  console.log('storyFishing accessible:', ok, '| JS errors:', errors.slice(0,2));
  expect(ok).toBe(true);
  expect(errors.length).toBe(0);
});
