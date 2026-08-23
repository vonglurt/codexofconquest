// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
'use strict';
const { test, expect } = require('@playwright/test');
const {
  seedAndLoad,
  dismissContinue,
  openFishingModal,
  openFishingModalViaButton,
  castUntilFishRevealed,
  readStory,
} = require('./helpers.js');

// ── Fishing Integration Tests — Yugurt Lake (BOO) ──────────────────────────
//
// All tests inject a known S_story state via localStorage before page load.
// Math.random() is NOT mocked — randomness is live.
// Stage tests use openFishingModal() (direct JS call) for isolation speed.
// The main smoke test uses openFishingModalViaButton() to exercise the full path.

test.describe('Fishing — Yugurt Lake (BOO)', () => {

  test.beforeEach(async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
  });

  // ── Stage 1: Modal opens ──────────────────────────────────────────────────

  test('1 — modal opens at BOO via storyFishing()', async ({ page }) => {
    await openFishingModal(page);
    await expect(page.locator('#story-fishing-modal')).toHaveClass(/visible/);
    await expect(page.locator('#fishing-card-hd')).toContainText('Yugurt Lake');
  });

  // ── Stage 2: Fish button in node panel ───────────────────────────────────

  test('2 — Fish button rendered at BOO node opens modal', async ({ page }) => {
    await openFishingModalViaButton(page);
    await expect(page.locator('#story-fishing-modal')).toHaveClass(/visible/);
  });

  // ── Stage 3: Find Bait panel ──────────────────────────────────────────────

  test('3 — Find Bait button reveals bait search panel', async ({ page }) => {
    await openFishingModal(page);
    await page.locator('#btn-fishing-findbait').click();
    await expect(page.locator('#fishing-bait-search')).toBeVisible();
    // Panel shows a zone-specific title with Survival DC
    const panelText = await page.locator('#fishing-bait-search').textContent();
    expect(panelText).toMatch(/Survival/i);
  });

  // ── Stage 4: Cast produces roll result ───────────────────────────────────

  test('4 — Cast Line shows roll result with DEX and Catch lines', async ({ page }) => {
    await openFishingModal(page);
    await page.locator('#btn-fishing-cast').click();
    const rollEl = page.locator('#fishing-roll-result');
    await expect(rollEl).toBeVisible();
    const rollText = await rollEl.textContent();
    expect(rollText).toMatch(/DEX/i);
    expect(rollText).toMatch(/Catch/i);
  });

  // ── Stage 5: Hit path is reachable ───────────────────────────────────────
  // Randomness allowed. With luckMod+2 and DEX mod+2, P(hit/cast) ≈ 85%.
  // 25 casts → P(at least one hit) > 99.99%.

  test('5 — fish is revealed within 25 casts', async ({ page }) => {
    await openFishingModal(page);
    const caught = await castUntilFishRevealed(page, 25);
    expect(caught).toBe(true);
    await expect(page.locator('#fishing-fish-reveal')).toBeVisible();
    // Fight button appears on the same castBtn element
    const fightText = await page.locator('#btn-fishing-cast').textContent();
    expect(fightText).toContain('Fight');
  });

  // ── Stage 6: Throw Back resets to cast state ─────────────────────────────

  test('6 — Throw Back resets modal to Cast Line state', async ({ page }) => {
    await openFishingModal(page);
    const caught = await castUntilFishRevealed(page, 30);
    expect(caught).toBe(true);

    // "🪣 Throw Back" is the recastBtn after a hit
    const recastBtn = page.locator('#btn-fishing-recast');
    await expect(recastBtn).toBeVisible();
    await recastBtn.click();

    // Fish reveal and roll result should be hidden after throw back
    await expect(page.locator('#fishing-fish-reveal')).toBeHidden();
    await expect(page.locator('#fishing-roll-result')).toBeHidden();
    // Cast button restored to "🎣 Cast Line"
    const castText = await page.locator('#btn-fishing-cast').textContent();
    expect(castText).toContain('Cast Line');
  });

  // ── Stage 7: Abandon closes modal ────────────────────────────────────────

  test('7 — Leave Lake closes the fishing modal', async ({ page }) => {
    await openFishingModal(page);
    await page.locator('#btn-fishing-abandon').click();
    await expect(page.locator('#story-fishing-modal')).not.toHaveClass(/visible/);
  });

  // ── Zone unlock: reeds unlocks after first catch ──────────────────────────

  test('8 — reeds zone chip becomes active after one catch in catchLog', async ({ page }) => {
    // Seed with one prior catch so zone unlock logic fires when Find Bait is clicked
    const priorCatch = { size: 'small', rarity: 'common', fish_key: 'fish_01', gold: 2 };
    await page.evaluate(c => {
      // eslint-disable-next-line no-undef
      S_story.fishingCatchLog = [c];
    }, priorCatch);

    await openFishingModal(page);
    // Zone buttons are created inside findBaitBtn.onclick — must click to trigger unlock check
    await page.locator('#btn-fishing-findbait').click();
    await expect(page.locator('#fishing-bait-search')).toBeVisible();

    // "The Reeds 🌿" button should be enabled now (catch log has one entry)
    const reedsBtn = page.locator('#fishing-bait-search button').filter({ hasText: /reeds/i });
    await expect(reedsBtn).not.toBeDisabled();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // MAIN TEST LINE — Full happy path smoke test
  //
  // Exercises the complete fishing sequence:
  //   seed state → node render → Fish button → cast loop → fish caught →
  //   Fight clicked → catchLog updated → questFlag set → modal closed
  // ────────────────────────────────────────────────────────────────────────────

  test('SMOKE — full fishing path: cast to catch, fight button updates state', async ({ page }) => {
    // Full path: use the real UI Fish button, not the direct JS call
    await openFishingModalViaButton(page);

    // Cast until a fish is revealed — live randomness, max 40 attempts
    const caught = await castUntilFishRevealed(page, 40);
    expect(caught).toBe(true, 'Expected a fish to be revealed within 40 casts');

    // Snapshot current catchLog length before committing the fight
    const logBefore = await readStory(page, 'fishingCatchLog').then(l => (l || []).length);

    // The castBtn is now "⚔ Fight [fish]!" — clicking it updates state then starts combat
    await page.locator('#btn-fishing-cast').click();

    // Modal should close immediately (storyFishing click handler removes .visible)
    await expect(page.locator('#story-fishing-modal')).not.toHaveClass(/visible/);

    // catchLog is updated inside the onclick before combat starts
    const logAfter  = await readStory(page, 'fishingCatchLog').then(l => (l || []).length);
    expect(logAfter).toBeGreaterThan(logBefore);

    // Quest flag q01 set on first fight — drives "The Fool's First Cast" chain
    const q01 = await readStory(page, 'fishingQuestFlags').then(f => (f || {}).q01);
    expect(q01).toBe(true);

    // Catch entry has expected shape
    const lastCatch = await readStory(page, 'fishingCatchLog').then(l => (l || [])[0]);
    expect(lastCatch).toMatchObject({
      size: expect.stringMatching(/^(small|medium|large|very_large|legendary)$/),
      rarity: expect.stringMatching(/^(common|rare|enchanted|golden|legendary)$/),
      fish_key: expect.stringMatching(/^fish_\d{2}$|^common_fish$/),
    });
  });

});
