// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/integration',

  // §DX-02hq — tests inside a file run CONCURRENTLY, not one after another.
  //
  // Playwright parallelises FILES, not tests, so a 303-test file is a single serial
  // chain and becomes the whole suite's critical path: at `c99f4e2`,
  // quest-runtime-uqf.test.js alone was 5.4m of a 7.4m wall. Turning this on took
  // the suite 7.4m -> 5.6m, and that file 5.4m -> 1.8m. It is safe because the
  // specs take their own `{ page }` fixture per test; the four that spawn a
  // throwaway wbapi-server get a port per worker from `helpers.js`'s PORT_BLOCKS,
  // because `beforeAll` runs once PER WORKER under this setting.
  //
  // §DX-02ht tested the theory that this setting causes the `worldbuilder-*`
  // UI-timing flakes, and DISPROVED it: with `fullyParallel: false` the same suite
  // returned `1031 passed, 2 flaky` (crud-arrays:136, mission-builder:336) — worse,
  // not better. Those specs are load-sensitive either way, so the setting stays and
  // the family carries traces instead. A spec that genuinely needs ordering opts out
  // with `test.describe.configure({ mode: 'default' })`.
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

    // §DX-02ht — evidence for a flake, without paying for it on every run.
    //
    // The problem is real: with `retries: 1` and no trace, a test that fails once
    // and passes its retry reports `1 flaky`, EXIT=0, and NOTHING on disk. That is
    // how §DX-02hb accumulated five sightings across three sessions and zero
    // diagnoses. But promoting `retain-on-failure` suite-wide was MEASURED and
    // rejected: 5.6m -> 7.1m (+27%), which gives back most of what §DX-02hq won.
    // Trimming the trace does not help — `{snapshots:false, sources:false}` also
    // measured 7.1m, so the cost is the tracer running at all, not what it keeps.
    // There is no CI to absorb that: no workflow runs this suite, so the only
    // runner is a developer who runs it after every change.
    //
    // So: OFF by default, ON for the files that have actually flaked (each carries
    // its own `test.use({ trace: 'retain-on-failure' })`), and one command away for
    // anything else — `TRACE=1 npm test --prefix src` turns it on suite-wide, which
    // is what to run the moment a NEW file reports `1 flaky`.
    trace: process.env.TRACE ? 'retain-on-failure' : 'off',
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
