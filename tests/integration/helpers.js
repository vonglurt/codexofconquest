// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
'use strict';
const { expect } = require('@playwright/test');

// ── HTML patch ────────────────────────────────────────────────────────────────
// The orphaned junction blocks (originally lines 9864–33152) that caused
// "Missing initializer in const declaration" were removed from roll2hit-v3.html
// directly on 2026-06-12. patchGameHtml is now a no-op kept for API stability.
async function patchGameHtml(page) { // eslint-disable-line no-unused-vars
  // no-op: HTML syntax was repaired in source
}

// ── Seed State ────────────────────────────────────────────────────────────────
// Canonical starting state for fishing integration tests.
// currentCode:'BOO' = Yugurt Lake (isFishingLake:true).
// Ability scores chosen to give luckMod +2 and DEX mod +2:
//   geometric mean(16,14,14,12,12,10) ≈ 13.3 → luck=14 → luckMod=+2
//   DEX 14 → mod +2 → good cast rolls, fast catch convergence.
const SEED_STATE = {
  active: true,
  currentCode: 'BOO',
  checkpointNode: 'BOO',
  hp: 80, hpMax: 80,
  gold: 500,
  xp: 0,
  day: 1,
  level: 5,
  shards: 0,
  voidPressure: 0,
  atkBonus: 3,
  acBonus: 0,
  shortRests: 3,
  abilityScores: { str: 16, dex: 14, con: 14, int: 12, wis: 12, cha: 10 },
  inventory: [
    { name: 'Fishing Rod', icon: '🎣', type: 'weapon', atkBonus: 1,
      dmgDie: 4, dmgCount: 1, dmgFlat: 0, sell: 10, desc: 'Standard rod.' }
  ],
  fishingCatchLog: [],
  fishingQuestFlags: {},
  tackleboxZoneUnlocks: { shore: true, reeds: false, deep: false },
  defeatedBattles: {},
  quests: {},
  knowledge: [],
  visited: { BOO: true },
  log: [],
  journalRead: {},
  npcFavorability: {},
  npcVisitCounts: {},
  sleptAtNodes: {},
  shortRestedAtNodes: {},
  countedMissedInns: {},
  missedSleeps: 0,
  battleDis: 0,
  dropsCollected: 0,
  pendingBattle: null,
  battleTurn: 'player',
  battleRound: 1,
  usedMainAttack: false,
  usedBonusAction: false,
  usedRealAttack: false,
  surpriseAdvantage: false,
  conditionRoundsLeft: 0,
  spellAdvantageReady: false,
  equippedShield: null,
  equippedWeapon: null,
  equippedMainWeapon: null,
  storyDeathSaves: { successes: 0, failures: 0, active: false },
  shieldTier: null,
  levelUpLog: [],
  tattoos: [],
  corpsesQuests: [],
  surgeCharges: 0,
  indomitableCharges: 0,
  waypoint: null,
  lastCorridorCells: [],
  lastExitDir: null,
  lastExitCode: null,
  pitTrainingWins: 0,
  slStalksWon: 0,
  visitedCells: {},
  hoursElapsed: 0,
  hoursSinceSlept: 0,
  playerR: 0,
  playerC: 0,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Inject seed state into localStorage before the page initializes, then navigate.
 * Merges `overrides` on top of SEED_STATE so individual tests can customize.
 * Also applies the HTML syntax patch before the page loads.
 */
async function seedAndLoad(page, overrides = {}) {
  const state = Object.assign({}, SEED_STATE, overrides);
  await patchGameHtml(page);
  await page.addInitScript(s => {
    localStorage.clear();
    localStorage.setItem('r2h_autosave', JSON.stringify(s));
  }, state);
  await page.goto('/roll2hit-v3.html');
}

/**
 * Dismiss the "Continue / New Game" modal and load the seeded save.
 *
 * storyEnter() is called automatically at the bottom of roll2hit-v3.html, so
 * the continue modal is already visible when the page finishes loading — no
 * need to click #story-mode-btn first.
 * Clicking #btn-continue-load calls storyLoadContinue() → storyLoadSave() →
 * storyRender(), which sets S_story from localStorage and syncs playerR/C.
 */
async function dismissContinue(page) {
  await page.locator('#story-continue-modal').waitFor({ state: 'visible' });
  await page.locator('#btn-continue-load').click();
  await expect(page.locator('#story-continue-modal')).not.toHaveClass(/visible/);
}

/**
 * Open the fishing modal directly via the game function.
 * Skips clicking through the node UI card — use for stage isolation tests.
 * The game's storyFishing() is a top-level function on window.
 */
async function openFishingModal(page) {
  await page.evaluate(() => window.storyFishing());
  await expect(page.locator('#story-fishing-modal')).toHaveClass(/visible/);
}

/**
 * Open fishing modal via the "Fish" button rendered in the BOO node panel.
 * Use this for the full-path smoke test — it exercises the real UI trigger.
 */
async function openFishingModalViaButton(page) {
  const fishBtn = page.locator('button.btn-hunt').filter({ hasText: 'Fish' });
  await fishBtn.waitFor({ state: 'visible' });
  await fishBtn.click();
  await expect(page.locator('#story-fishing-modal')).toHaveClass(/visible/);
}

/**
 * Cast repeatedly until a fish is revealed or maxCasts is exhausted.
 *
 * State machine:
 *   castBtn "🎣 Cast Line" → click → either:
 *     MISS: castBtn hidden, recastBtn "Cast Again" → click recast → loop
 *     HIT:  castBtn "⚔ Fight [fish]!", recastBtn "🪣 Throw Back" → return true
 *
 * Randomness is live — with luckMod+2 and DEX mod+2, P(hit per cast) ≈ 85%.
 * 25 casts gives P(at least one hit) > 99.99%.
 */
async function castUntilFishRevealed(page, maxCasts = 25) {
  const castBtn   = page.locator('#btn-fishing-cast');
  const recastBtn = page.locator('#btn-fishing-recast');

  for (let i = 0; i < maxCasts; i++) {
    // Check for a hit first (castBtn text changes to "⚔ Fight...")
    const castText = await castBtn.textContent().catch(() => '');
    if (castText.includes('Fight')) return true;

    const castVisible   = await castBtn.isVisible();
    const recastVisible = await recastBtn.isVisible();

    if (castVisible) {
      await castBtn.click(); // "🎣 Cast Line"
    } else if (recastVisible) {
      await recastBtn.click(); // "Cast Again" after miss
    }

    // Re-check for hit after the click
    const newText = await castBtn.textContent().catch(() => '');
    if (newText.includes('Fight')) return true;
  }
  return false;
}

/**
 * Read S_story from the page JS context.
 * Optionally pass a dot-path string to read a nested field (e.g. 'fishingCatchLog').
 */
async function readStory(page, field) {
  if (field) {
    return page.evaluate(f => {
      const parts = f.split('.');
      // eslint-disable-next-line no-undef
      let v = S_story;
      for (const p of parts) v = v && v[p];
      return v;
    }, field);
  }
  // eslint-disable-next-line no-undef
  return page.evaluate(() => S_story);
}

module.exports = {
  SEED_STATE,
  patchGameHtml,
  seedAndLoad,
  dismissContinue,
  openFishingModal,
  openFishingModalViaButton,
  castUntilFishRevealed,
  readStory,
};
