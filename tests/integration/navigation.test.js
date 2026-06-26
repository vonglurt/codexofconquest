'use strict';
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue, readStory } = require('./helpers.js');

// ── Navigation Integration Tests (rebuilt §WALK-4 Inc 3) ─────────────────────
//
// The previous version hardcoded pre-§WALK-1.5 coords/adjacencies (BOO 47,223;
// BOO→LXF→SEN corridor) and a since-removed `hoursElapsed += 1` on movement, plus
// `_gameWarn` (deleted). This rebuild ground-truths every fixture against the
// CURRENT geo and the post-§TIMELESS-01 timeless-movement model.
//
// Current geo facts used below (from NODE_COORDS in roll2hit-v3.html):
//   LHR = {r:10, c:197}  City Streets — Birka (canonical start; primary at its cell)
//     • E → BMA (10,198) named (Birka Slums)
//     • N → (9,197) empty land (inferred terrain 'city')
//     • S → (11,197) SEA — blocked
//   NUE = {r:20, c:191}  single-occupant cell
//   MUC = {r:21, c:191}  single-occupant cell, 1 step S of NUE
//
// Seeds override the helpers' default (currentCode:'BOO', the fishing-lake seed).

const LHR = { code: 'LHR', r: 10, c: 197 };
const NUE = { code: 'NUE', r: 20, c: 191 };
const MUC = { code: 'MUC', r: 21, c: 191 };

const seedAt = (n, extra = {}) => ({ currentCode: n.code, playerR: n.r, playerC: n.c, visited: { [n.code]: true }, ...extra });

// Suppress the per-step terrain encounter roll (Math.random >= rate → no battle)
// so empty-cell renders settle before assertions.
async function moveNoEncounter(page, dir) {
  await page.evaluate(d => { const o = Math.random; Math.random = () => 1; cellMove(d); Math.random = o; }, dir);
}

// ── 1 — One-cell movement ────────────────────────────────────────────────────

test.describe('Navigation — one-cell movement (cellMove)', () => {
  test.beforeEach(async ({ page }) => {
    await seedAndLoad(page, seedAt(LHR));
    await dismissContinue(page);
  });

  test('player coords match LHR after load', async ({ page }) => {
    const [r, c] = await page.evaluate(() => [S_story.playerR, S_story.playerC]);
    expect(r).toBe(LHR.r);
    expect(c).toBe(LHR.c);
  });

  test('cellMove(E) steps exactly one cell east onto BMA (named node)', async ({ page }) => {
    await moveNoEncounter(page, 'E');
    const [r, c, code] = await page.evaluate(() => [S_story.playerR, S_story.playerC, S_story.currentCode]);
    expect(r).toBe(LHR.r);          // row unchanged
    expect(c).toBe(LHR.c + 1);      // one cell east
    expect(code).toBe('BMA');       // named node at (10,198)
  });

  test('cellMove(N) steps one cell north into open terrain (currentCode unchanged)', async ({ page }) => {
    await moveNoEncounter(page, 'N');
    const [r, c, code] = await page.evaluate(() => [S_story.playerR, S_story.playerC, S_story.currentCode]);
    expect(r).toBe(LHR.r - 1);      // one cell north
    expect(c).toBe(LHR.c);
    // empty cells do not change currentCode — it still points at the last named node
    expect(code).toBe('LHR');
  });
});

// ── 2 — Timeless movement (§TIMELESS-01 regression lock) ─────────────────────

test.describe('Navigation — movement is timeless (§TIMELESS-01)', () => {
  test('a sequence of moves never advances hoursElapsed', async ({ page }) => {
    await seedAndLoad(page, seedAt(LHR));
    await dismissContinue(page);
    const before = await readStory(page, 'hoursElapsed');
    await moveNoEncounter(page, 'E');   // LHR → BMA (named)
    await moveNoEncounter(page, 'W');   // BMA → LHR
    await moveNoEncounter(page, 'N');   // LHR → empty (9,197)
    await moveNoEncounter(page, 'S');   // empty → LHR
    const after = await readStory(page, 'hoursElapsed');
    expect(after).toBe(before || 0);
  });
});

// ── 3 — Empty-cell render shell (§UNIFY-01; guards the §MATH-01 regression) ───
//
// §MATH-01 reintroduced a write to the non-existent #story-content in
// _enterEmptyCell, throwing "Cannot set properties of null" on every empty-cell
// step. §WALK-4 Inc 3 restored the shared-shell render; these lock it.

test.describe('Empty-cell render shell (_enterEmptyCell)', () => {
  test.beforeEach(async ({ page }) => {
    await seedAndLoad(page, seedAt(LHR));
    await dismissContinue(page);
  });

  test('stepping into an empty cell does not throw and renders the shell', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(e.message));
    await moveNoEncounter(page, 'N');   // LHR → empty (9,197)
    expect(pageErrors).toEqual([]);

    // The shell reuses the named-node slots. Body is the constant stub; the
    // header reflects the cell coords + inferred terrain (derived in-page so the
    // assertion survives terrain re-tuning).
    const shell = await page.evaluate(() => {
      const terrain = _inferTerrain(9, 197);
      const label = (WORLD_DB[terrain] || WORLD_DB.midlands).label;
      return {
        name: document.getElementById('s-node-name').textContent,
        act: document.getElementById('s-node-act').textContent,
        badge: document.getElementById('story-act-badge').textContent,
        body: document.getElementById('story-text-box').textContent,
        expectLabel: label,
      };
    });
    expect(shell.body).toBe('The path continues. No named location marks this ground.');
    expect(shell.act).toBe('Row 9, Col 197');
    expect(shell.name).toBe(shell.expectLabel);
    expect(shell.badge).toBe('— ' + shell.expectLabel + ' —');
  });
});

// ── 4 — Sea-block gate (§WALK-1.5 terrain field) ─────────────────────────────

test.describe('Navigation — sea-blocked move (§WALK-1.5)', () => {
  test('cellMove into a sea cell is refused and shows a block message', async ({ page }) => {
    await seedAndLoad(page, seedAt(LHR));
    await dismissContinue(page);
    // LHR S → (11,197) is sea.
    const before = await page.evaluate(() => [S_story.playerR, S_story.playerC, S_story.currentCode]);
    await page.evaluate(() => cellMove('S'));
    const after = await page.evaluate(() => [S_story.playerR, S_story.playerC, S_story.currentCode]);
    expect(after).toEqual(before);   // did not move
    const cls = await page.locator('#story-move-msg').getAttribute('class');
    expect(cls || '').toContain('msg-block');
  });

  // Positive counterpart: a carved sea-lane cell is walkable and renders as ocean.
  // BMA (10,198) has a SEA_LANES cell directly S at (11,198) — step onto it.
  test('a carved sea-lane cell is walkable and renders as ocean', async ({ page }) => {
    await seedAndLoad(page, seedAt({ code: 'BMA', r: 10, c: 198 }));
    await dismissContinue(page);
    // The lane cell itself renders as ocean (vs the surrounding impassable sea).
    const laneTerr = await page.evaluate(() => _inferTerrain(11, 198));
    expect(laneTerr).toBe('ocean');
    await moveNoEncounter(page, 'S');
    const [r, c] = await page.evaluate(() => [S_story.playerR, S_story.playerC]);
    expect([r, c]).toEqual([11, 198]);   // walked onto the lane, not blocked
  });
});

// ── 5 — BFS connectivity (_bfsGridPath / _bfsGridDir) ────────────────────────

test.describe('Navigation — grid BFS connectivity', () => {
  test.beforeEach(async ({ page }) => {
    await seedAndLoad(page, seedAt(NUE));
    await dismissContinue(page);
  });

  test('_bfsGridDir(NUE, MUC) returns S (one step south)', async ({ page }) => {
    const dir = await page.evaluate(() => _bfsGridDir('NUE', 'MUC'));
    expect(dir).toBe('S');
  });

  test('_bfsGridPath(NUE, MUC) is one step ending at MUC coords', async ({ page }) => {
    const { path, mucCoord } = await page.evaluate(() => ({
      path: _bfsGridPath('NUE', 'MUC'), mucCoord: NODE_COORDS['MUC'],
    }));
    expect(path.length).toBe(1);
    expect(path[path.length - 1].r).toBe(mucCoord.r);
    expect(path[path.length - 1].c).toBe(mucCoord.c);
  });

  test('_bfsGridPath returns [] for a destination with no coords', async ({ page }) => {
    const len = await page.evaluate(() => _bfsGridPath('NUE', '__NO_SUCH_NODE__').length);
    expect(len).toBe(0);
  });

  test('LHR is reachable from a spread of named nodes (no disconnection)', async ({ page }) => {
    // The invariant suite proves full reachability offline (409/409); this spot-
    // checks 15 deterministic samples through the in-browser BFS.
    const unreachable = await page.evaluate(() => {
      const codes = Object.keys(NODE_COORDS).filter(c => c !== 'LHR');
      const sample = [];
      for (let i = 0; i < codes.length; i += Math.floor(codes.length / 15)) sample.push(codes[i]);
      return sample.filter(c => _bfsGridPath(c, 'LHR').length === 0);
    });
    expect(unreachable).toEqual([]);
  });
});

// ── 6 — Waypoint path-following (storyWaypoint) ──────────────────────────────

test.describe('Navigation — waypoint follow (storyWaypoint)', () => {
  test('storyWaypoint walks NUE → MUC then clears the waypoint on arrival', async ({ page }) => {
    await seedAndLoad(page, seedAt(NUE));
    await dismissContinue(page);
    await page.evaluate(() => { S_story.waypoint = 'MUC'; });

    // Step NUE → MUC (one cell south; both single-occupant cells)
    await page.evaluate(() => storyWaypoint());
    expect(await readStory(page, 'currentCode')).toBe('MUC');

    // Now at the waypoint — next call announces arrival and clears it
    await page.evaluate(() => storyWaypoint());
    expect(await readStory(page, 'waypoint')).toBeNull();
  });

  test('storyWaypoint no-ops (no move) when no waypoint is set', async ({ page }) => {
    await seedAndLoad(page, seedAt(NUE));
    await dismissContinue(page);
    const before = await readStory(page, 'currentCode');
    await page.evaluate(() => storyWaypoint());
    expect(await readStory(page, 'currentCode')).toBe(before);
  });
});

// ── 7 — Status bar render (storyUpdateStatus) ────────────────────────────────
// storyUpdateStatus() reflects S_story into the HUD on each render.
// (The old §UNIFY-03 gold-mutation test was dropped: storyRender no longer calls
// storyCheckQuests — that ordering concern is obsolete in the current engine.)

test.describe('Status bar — storyUpdateStatus render', () => {
  test('#s-hp and #s-gold show seeded values after initial render', async ({ page }) => {
    await seedAndLoad(page, seedAt(LHR, { hp: 45, hpMax: 80, gold: 300 }));
    await dismissContinue(page);
    expect(await page.locator('#s-hp').textContent()).toBe('45/80');
    expect(await page.locator('#s-gold').textContent()).toBe('300gp');
  });
});
