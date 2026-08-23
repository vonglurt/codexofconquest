// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/integration',

  // Serve the project root so index.html is at http://localhost:7654/index.html
  // Port 7654 avoids collision with the WBAPI server on 1367.
  webServer: {
    command: 'npx --yes serve . --listen tcp://localhost:7654',
    url: 'http://localhost:7654',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },

  use: {
    baseURL: 'http://localhost:7654',
    headless: true,
    // Give DOM updates time to settle after synchronous JS runs
    actionTimeout: 8_000,
  },

  // One retry allows for the rare case where all 25+ casts miss (astronomically unlikely)
  retries: 1,

  // Single browser — Chromium matches what players actually use
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Per-test timeout: fishing smoke test can take several seconds of DOM interaction
  timeout: 45_000,

  reporter: [['list'], ['html', { open: 'never' }]],
});
