// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
'use strict';
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue, readStory, SEED_STATE } = require('./helpers.js');

// ── §UNIFY-09 — Autosave guarantee ───────────────────────────────────────────
//
// Audit finding: ~70 storySave() call sites split into two categories:
//   - ~3 canonical entry-point saves at the end of storyRender, _enterEmptyCell,
//     and combat resolution — already in place.
//   - ~67 per-action saves in event handlers (shop, documents, quests, fishing,
//     etc.) — these are correct; those actions mutate S_story outside the three
//     entry points and the browser could close before the next navigation.
//
// The "consolidate to 3 entry points" target was revised: the per-action saves
// are load-bearing, not redundant. These tests verify the baseline guarantee:
// both entry-point saves and per-action saves actually write to localStorage.
//
// Note on reload tests: seedAndLoad() uses page.addInitScript(), which re-runs
// on every navigation and would overwrite the autosaved state. Reload tests
// instead go to a fresh page from context (no initScript registered), set
// localStorage manually, then verify the load path reads it back correctly.

// Helper: navigate to page, inject state via localStorage (no addInitScript),
// then reload so storyEnter() sees the save. Reload-safe — no initScript.
async function seedAndLoadViaStorage(page, overrides = {}) {
  const state = Object.assign({}, SEED_STATE, overrides);
  await page.goto('/roll2hit-v3.html');   // initial load to establish correct origin
  await page.evaluate(s => {
    localStorage.clear();
    localStorage.setItem('r2h_autosave', JSON.stringify(s));
  }, state);
  await page.reload();                    // reload picks up seed from localStorage
}

test.describe('Autosave guarantee (§UNIFY-09)', () => {

  // ── 1. Entry-point save: cellMove triggers storyRender → storyAutoSave ──────

  test('cellMove writes mutated gold to localStorage', async ({ page }) => {
    // Seed at LHR (10,197); E → BMA (10,198) is a one-cell named move (current geo).
    await seedAndLoad(page, { currentCode: 'LHR', playerR: 10, playerC: 197, visited: { LHR: true }, gold: 500 });
    await dismissContinue(page);

    await page.evaluate(() => {
      S_story.gold = 999;
      const orig = Math.random;
      Math.random = () => 1;   // suppress encounter roll
      cellMove('E');           // LHR → BMA; storyRender calls storyAutoSave
      Math.random = orig;
    });

    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('r2h_autosave');
      return raw ? JSON.parse(raw) : null;
    });
    expect(saved).not.toBeNull();
    expect(saved.gold).toBe(999);
    expect(saved.currentCode).toBe('BMA');
  });

  // ── 2. Per-action save: direct storyAutoSave() writes to localStorage ───────

  test('direct storyAutoSave() writes state to localStorage', async ({ page }) => {
    await seedAndLoad(page, { gold: 500 });
    await dismissContinue(page);

    await page.evaluate(() => {
      S_story.gold = 777;
      storyAutoSave();   // the per-action save pattern used by event handlers
    });

    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('r2h_autosave');
      return raw ? JSON.parse(raw) : null;
    });
    expect(saved).not.toBeNull();
    expect(saved.gold).toBe(777);
  });

  // ── 3. Full reload cycle: storyLoadSave reads back what storyAutoSave wrote ─
  //
  // Uses seedAndLoadViaStorage so no addInitScript conflicts with the reload.

  test('storyAutoSave → page reload → storyLoadSave restores gold', async ({ page }) => {
    await seedAndLoadViaStorage(page, { gold: 500 });
    await dismissContinue(page);

    // Mutate and save
    await page.evaluate(() => {
      S_story.gold = 888;
      storyAutoSave();
    });

    // Reload — no initScript registered, so localStorage survives intact
    await page.reload();
    await dismissContinue(page);

    const goldAfter = await readStory(page, 'gold');
    expect(goldAfter).toBe(888);
  });

  test('cellMove save survives page reload (full round-trip)', async ({ page }) => {
    // Seed at LHR; E → BMA is a one-cell named move (current geo).
    await seedAndLoadViaStorage(page, { currentCode: 'LHR', playerR: 10, playerC: 197, visited: { LHR: true } });
    await dismissContinue(page);

    await page.evaluate(() => {
      S_story.gold = 555;
      const orig = Math.random;
      Math.random = () => 1;
      cellMove('E');   // LHR → BMA; storyRender calls storyAutoSave
      Math.random = orig;
    });

    await page.reload();
    await dismissContinue(page);

    const goldAfter = await readStory(page, 'gold');
    expect(goldAfter).toBe(555);

    const codeAfter = await readStory(page, 'currentCode');
    expect(codeAfter).toBe('BMA');
  });

});
