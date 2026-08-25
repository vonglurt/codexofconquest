// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/integration',

  // §DX-02hq — tests inside a file run CONCURRENTLY, not one after another.
  // Default Playwright parallelises files only, so a 303-test file is a single
  // serial chain and becomes the whole suite's critical path: measured at
  // `c99f4e2`, quest-runtime-uqf.test.js alone was 5.4m of a 7.4m wall. Every
  // test here takes its own `{ page }` fixture, so there is nothing to share.
  // The four specs that spawn a throwaway wbapi-server get a port per worker
  // from `helpers.js`'s PORT_BLOCKS — without that, `beforeAll` running once
  // per worker makes them fight over one port. A spec that genuinely needs
  // ordering opts out with `test.describe.configure({ mode: 'default' })`.
  fullyParallel: true,

  // §DX-02hq — worker count is deliberately LEFT AT THE DEFAULT (half the cores).
  // Raising it was measured and rejected: with `fullyParallel` on, the full suite
  // was 333s at the default and 329s at `workers: '100%'` — inside the noise,
  // because this machine's cores are not equal (4 performance + 4 efficiency) and
  // the run is already CPU-saturated. What the extra workers DID buy was a flake:
  // `worldbuilder-crud-arrays.test.js:173` timed out clicking a visible, stable,
  // scrolled-into-view element. Oversubscription costs UI-timing stability and
  // returns nothing, so the default stands.

  // Generated output belongs in build/, not beside the source.
  outputDir: '../build/test-results',

  // Serve the project root so play.html is at http://localhost:7654/play.html
  // Port 7654 avoids collision with the WBAPI server on 1367.
  // Two servers. The static host serves the repo root; the WBAPI server is
  // required by the editor's CRUD tests, which click through a UI that stays
  // behind the welcome overlay until a world has loaded. Without it those four
  // tests fail on a bare checkout for reasons that look nothing like the cause.
  webServer: [
    {
      command: 'npx --yes serve .. --listen tcp://localhost:7654',
      url: 'http://localhost:7654',
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
    },
    {
      command: 'node js/wbapi-server.js',
      url: 'http://localhost:1367/api/ping',
      reuseExistingServer: true,
      timeout: 20_000,
    },
  ],

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

  reporter: [['list'], ['html', { open: 'never', outputFolder: '../build/playwright-report' }]],
});
