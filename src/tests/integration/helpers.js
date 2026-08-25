// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
const { expect } = require('@playwright/test');

// ── HTML patch ────────────────────────────────────────────────────────────────
// The orphaned junction blocks (originally lines 9864–33152) that caused
// "Missing initializer in const declaration" were removed from play.html
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
    localStorage.setItem('coc_autosave', JSON.stringify(s));
  }, state);
  await page.goto('/play.html');
}

/**
 * Dismiss the "Continue / New Game" modal and load the seeded save.
 *
 * storyEnter() is called automatically at the bottom of play.html, so
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

// ── Per-worker throwaway-server ports (§DX-02hq) ──────────────────────────────
// Four spec files spawn their own wbapi-server. Every one of them used a bare
// module constant for its port, which meant the file could only ever be run by
// ONE worker: worker 0 binds, and every other worker's spawn dies of EADDRINUSE
// with `stdio: 'ignore'` — unheard — after which its readiness poll succeeds
// anyway, against worker 0's server, and its tests race a stranger's state.
// §DX-02hm fixed that one file by hand; turning on `fullyParallel` made the same
// bug appear in the other three at once, so the port map lives HERE, in one
// place, where a new spawning spec can see what is already taken.
//
//   13900-14099  multiplayer-presence.test.js  (TWO ports per worker)
//   14100-14199  mesh-ledger-client.test.js
//   14200-14299  mesh-duel-client.test.js
//   14300-14399  dx02l-save-snapshots-cli.test.js
//
// Each block holds 100 workers. `TEST_PARALLEL_INDEX` is Playwright's 0-based
// worker slot: concurrent workers never collide, and sequential ones reuse a
// slot harmlessly because the previous server is dead before the slot is reused.
const PORT_BLOCKS = {
  presence: 13900,
  ledger: 14100,
  duel: 14200,
  snapshots: 14300,
};

// Returns `count` consecutive ports reserved for this worker inside `block`'s
// hundred. Also returns `worker` and `tag`, so callers can suffix any other
// shared resource - tmpdir cache files, on-disk fixtures - with the same index.
function workerPorts(block, count = 1) {
  const base = PORT_BLOCKS[block];
  if (base === undefined) throw new Error(`workerPorts: unknown block "${block}" - add it to PORT_BLOCKS`);
  const worker = Number(process.env.TEST_PARALLEL_INDEX || 0);
  if (worker * count + count > 100) throw new Error(`workerPorts: block "${block}" holds 100 ports, worker ${worker} needs ${count}`);
  const ports = [];
  for (let i = 0; i < count; i++) ports.push(base + worker * count + i);
  return { ports, worker, tag: `-${worker}` };
}

// `stdio: 'ignore'` means a spawn that dies takes its reason with it, and the
// readiness poll then times out naming a port instead of a cause. Attach this to
// every spawned child and pass the returned array into the timeout message.
function watchChildren(children) {
  const died = [];
  for (const [name, child] of Object.entries(children)) {
    if (!child) continue;
    child.on('exit', (code, sig) => died.push(`${name} exited early (code=${code}, signal=${sig})`));
    child.on('error', (e) => died.push(`${name} failed to spawn: ${e.message}`));
  }
  return died;
}


module.exports = {
  SEED_STATE,
  workerPorts,
  watchChildren,
  patchGameHtml,
  seedAndLoad,
  dismissContinue,
  openFishingModal,
  openFishingModalViaButton,
  castUntilFishRevealed,
  readStory,
};
