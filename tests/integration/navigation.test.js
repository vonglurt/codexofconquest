'use strict';
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue, readStory, SEED_STATE } = require('./helpers.js');

// ── Navigation Integration Tests ─────────────────────────────────────────────
//
// Covers three concerns the user raised:
//   1. Walk — cellMove() updates player position and currentCode correctly
//   2. "Reweave" (graph connectivity) — _bfsGridPath finds a path between nodes
//      (the server-side reweave-all was deprecated in §CELL-06; BFS connectivity
//       is now the measure of map integrity)
//   3. Walk along a path — storyWaypoint() follows a BFS path step-by-step
//
// Grid reference (from NODE_COORDS in roll2hit-v3.html):
//   BOO  = r:47, c:223  (Yugurt Lake — seeded starting node in helpers.js)
//   LXF  = r:48, c:223  (Saelingsdals Ford — 1 step S of BOO)
//   ISL  = r:61, c:224  (Althing Ground — Iceland)
//   DBV  = r:62, c:224  (Ragusa — Harbor Quarter)
//   BK   = r:63, c:224  (Birka Shore)
//   LHR  = r:64, c:224  (City Streets — Birka, the canonical start node)
//
// ISL→DBV→BK→LHR is a clean 3-step S-corridor through named nodes,
// so storyWaypoint() can traverse it without triggering random encounters
// (encounters only fire in _enterEmptyCell, not in storyRender).

// ── 1 — Basic Walk ────────────────────────────────────────────────────────────

test.describe('Navigation — basic walk (cellMove)', () => {

  test.beforeEach(async ({ page }) => {
    await seedAndLoad(page);           // seeds currentCode:'BOO'
    await dismissContinue(page);       // storyRender(NODE_MAP['BOO']) sets playerR/C
  });

  test('player coords match BOO coords after load', async ({ page }) => {
    const [r, c] = await page.evaluate(() => [S_story.playerR, S_story.playerC]);
    // NODE_COORDS['BOO'] = {r:47, c:223}
    expect(r).toBe(47);
    expect(c).toBe(223);
  });

  test('cellMove(S) increments playerR by 1', async ({ page }) => {
    await page.evaluate(() => cellMove('S'));
    const [r, c] = await page.evaluate(() => [S_story.playerR, S_story.playerC]);
    expect(r).toBe(48);
    expect(c).toBe(223);
  });

  test('cellMove(S) from BOO lands on LXF (named node 1 step south)', async ({ page }) => {
    // LXF is at r:48,c:223 — exactly 1 cell south of BOO (r:47,c:223)
    await page.evaluate(() => cellMove('S'));
    const code = await readStory(page, 'currentCode');
    expect(code).toBe('LXF');
  });

  test('cellMove(N) from BOO moves to SEN (named node 1 step north)', async ({ page }) => {
    // SEN is at r:46,c:223 — exactly 1 cell north of BOO
    await page.evaluate(() => cellMove('N'));
    const code = await readStory(page, 'currentCode');
    expect(code).toBe('SEN');
  });

  test('cellMove updates log and hoursElapsed', async ({ page }) => {
    const hoursBefore = await readStory(page, 'hoursElapsed');
    const logBefore   = await page.evaluate(() => S_story.log.length);
    await page.evaluate(() => cellMove('S'));
    const hoursAfter  = await readStory(page, 'hoursElapsed');
    const logAfter    = await page.evaluate(() => S_story.log.length);
    expect(hoursAfter).toBe((hoursBefore || 0) + 1);
    expect(logAfter).toBe(logBefore + 1);
  });

});

// ── 2 — Reweave / Graph Connectivity ─────────────────────────────────────────
// Verifies the client-side BFS finds paths between nodes.
// (Server-side reweave-all was deprecated §CELL-06; this is the replacement.)

test.describe('Navigation — BFS graph connectivity (_bfsGridPath)', () => {

  test.beforeEach(async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
  });

  test('_bfsGridPath(BOO, LHR) returns a non-empty path', async ({ page }) => {
    const len = await page.evaluate(() => _bfsGridPath('BOO', 'LHR').length);
    expect(len).toBeGreaterThan(0);
  });

  test('last step of _bfsGridPath(BOO, LHR) is at LHR coords', async ({ page }) => {
    const { last, lhrCoord } = await page.evaluate(() => {
      const path = _bfsGridPath('BOO', 'LHR');
      return { last: path[path.length - 1], lhrCoord: NODE_COORDS['LHR'] };
    });
    expect(last.r).toBe(lhrCoord.r);
    expect(last.c).toBe(lhrCoord.c);
  });

  test('_bfsGridPath(ISL, LHR) is exactly 3 steps (S corridor)', async ({ page }) => {
    // ISL(61,224) → DBV(62,224) → BK(63,224) → LHR(64,224)
    const path = await page.evaluate(() => _bfsGridPath('ISL', 'LHR'));
    expect(path.length).toBe(3);
    // Each step is 1 row south in the same column
    for (let i = 0; i < path.length - 1; i++) {
      expect(path[i + 1].r - path[i].r).toBe(1);
      expect(path[i + 1].c - path[i].c).toBe(0);
    }
  });

  test('_bfsGridDir(ISL, LHR) returns S (direct south)', async ({ page }) => {
    const dir = await page.evaluate(() => _bfsGridDir('ISL', 'LHR'));
    expect(dir).toBe('S');
  });

  test('_bfsGridPath returns [] when destination has no coords', async ({ page }) => {
    // '__NO_SUCH_NODE__' has no entry in NODE_COORDS — should return empty
    const len = await page.evaluate(() => _bfsGridPath('BOO', '__NO_SUCH_NODE__').length);
    expect(len).toBe(0);
  });

  test('LHR is reachable from a spread of named nodes (graph connectivity)', async ({ page }) => {
    // Spot-check 20 spread nodes from across the map. Catches total disconnection
    // without running a full BFS sweep (which would timeout in-browser).
    const SAMPLE = ['BK','BKK','NAP','LXF','LGW','DAN','PER','ROT','ISL','DBV',
                    'MCRJN','ODD','FLM','CDG','NID','VS','SSJ','SKN','DAM','MGR'];
    const results = await page.evaluate(codes =>
      codes.map(c => ({ code: c, reachable: _bfsGridPath(c, 'LHR').length > 0 }))
    , SAMPLE);
    const unreachable = results.filter(r => !r.reachable).map(r => r.code);
    expect(unreachable).toEqual([]);
  });

});

// ── 3 — Walk Along a Path ─────────────────────────────────────────────────────
// Verifies storyWaypoint() follows the BFS path step by step.

test.describe('Navigation — path following (storyWaypoint)', () => {

  test('storyWaypoint walks ISL → LHR in exactly 3 steps', async ({ page }) => {
    // Seed at ISL so the 3-step S-corridor is clean (no empty cells, no battles)
    await seedAndLoad(page, { currentCode: 'ISL', playerR: 61, playerC: 224, visited: { ISL: true } });
    await dismissContinue(page);

    await page.evaluate(() => { S_story.waypoint = 'LHR'; });

    // Step 1: ISL → DBV
    await page.evaluate(() => storyWaypoint());
    const after1 = await readStory(page, 'currentCode');
    expect(after1).toBe('DBV');

    // Step 2: DBV → BK
    await page.evaluate(() => storyWaypoint());
    const after2 = await readStory(page, 'currentCode');
    expect(after2).toBe('BK');

    // Step 3: BK → LHR (movement complete; waypoint still set until acknowledged)
    await page.evaluate(() => storyWaypoint());
    const after3 = await readStory(page, 'currentCode');
    expect(after3).toBe('LHR');

    // Step 4: already at LHR — storyWaypoint() detects arrival, clears waypoint
    await page.evaluate(() => storyWaypoint());
    const wp = await readStory(page, 'waypoint');
    expect(wp).toBeNull();
  });

  test('storyWaypoint no-ops and shows message when no waypoint set', async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);

    // No waypoint set — storyWaypoint() falls through to storyQuestToggle()
    // which should not crash. Player should not move.
    const codeBefore = await readStory(page, 'currentCode');
    await page.evaluate(() => storyWaypoint());
    const codeAfter  = await readStory(page, 'currentCode');
    expect(codeAfter).toBe(codeBefore);
  });

  test('SMOKE — full path walk BOO → LHR via repeated storyWaypoint', async ({ page }) => {
    // Full end-to-end: seed at BOO, set waypoint to LHR, auto-step until arrived.
    // Max 40 steps handles the ~17-step corridor with room to spare.
    await seedAndLoad(page);
    await dismissContinue(page);

    await page.evaluate(() => { S_story.waypoint = 'LHR'; });

    for (let i = 0; i < 40; i++) {
      const cur = await readStory(page, 'currentCode');
      if (cur === 'LHR') break;
      // If we hit a node with a pre-battle overlay, stop — not expected on this path
      const prebattVisible = await page.locator('#story-prebatt-overlay').isVisible().catch(() => false);
      if (prebattVisible) break;
      await page.evaluate(() => storyWaypoint());
    }

    const finalCode = await readStory(page, 'currentCode');
    expect(finalCode).toBe('LHR');

    // Confirm playerR/playerC match LHR coords
    const [r, c] = await page.evaluate(() => [S_story.playerR, S_story.playerC]);
    expect(r).toBe(64);
    expect(c).toBe(224);
  });

});

// ── 4 — Empty cell parity §UNIFY-01 ─────────────────────────────────────────
//
// Verifies _enterEmptyCell now updates the same named DOM elements as storyRender:
//   #story-act-badge, #s-node-num, #s-node-name, #s-node-act, #story-text-box
//
// Before §UNIFY-01 those elements were left stale (showing the previous named
// node's data); story-text-box was populated via innerHTML with its own heading
// divs instead of using the shared header slots.
//
// Test grid: BOO = r:47, c:223.  East → (47,224) has no CELL_GRID entry → empty.
// (47,224) has two named neighbors: BOO/yugurt_lake (W) and LEA/midlands (S).
// Tie-breaking favors S (processed first) → inferred terrain is midlands
// → label:'Plains & Midlands', icon:'🌾'.

test.describe('Empty cell parity — _renderNodeShell discipline (§UNIFY-01)', () => {

  // Move East into an empty cell, suppressing the 15% encounter roll so the
  // battle overlay doesn't appear before we can read the header elements.
  async function stepIntoEmptyCell(page) {
    return page.evaluate(() => {
      const origRand = Math.random;
      Math.random = () => 1;   // 1 >= any encounter rate → no battle
      cellMove('E');            // BOO (47,223) → empty cell (47,224)
      Math.random = origRand;
    });
  }

  test.beforeEach(async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
  });

  test('#s-node-name shows terrain label after empty cell step', async ({ page }) => {
    await stepIntoEmptyCell(page);
    const name = await page.locator('#s-node-name').textContent();
    expect(name).toBe('Plains & Midlands');
  });

  test('#s-node-act shows row/col coordinates after empty cell step', async ({ page }) => {
    await stepIntoEmptyCell(page);
    const act = await page.locator('#s-node-act').textContent();
    expect(act).toBe('Row 47, Col 224');
  });

  test('#story-act-badge shows terrain name after empty cell step', async ({ page }) => {
    await stepIntoEmptyCell(page);
    const badge = await page.locator('#story-act-badge').textContent();
    expect(badge).toBe('— Plains & Midlands —');
  });

  test('#s-node-num shows terrain icon after empty cell step', async ({ page }) => {
    await stepIntoEmptyCell(page);
    const num = await page.locator('#s-node-num').textContent();
    expect(num).toBe('🌾');
  });

  test('#story-text-box shows stub text (not stale named-node prose)', async ({ page }) => {
    await stepIntoEmptyCell(page);
    const body = await page.locator('#story-text-box').textContent();
    expect(body).toBe('The path continues. No named location marks this ground.');
  });

});

// ── 5 — Exit link consistency §UNIFY-04 ──────────────────────────────────────
//
// Verifies _updateExitLinks() uses playerR/C (not currentCode) for position so
// exit buttons render identically on named nodes and empty cells.
//
// Before §UNIFY-04, _updateExitLinks derived position from currentCode's node
// coords as a fallback; after the fix it uses playerR/C directly and guards on
// both being zero.
//
// Grid: BOO(47,223) E→ empty(47,224). From the empty cell:
//   W → BOO(47,223) = named node    → exit-active (no exit-empty)
//   S → LEA(48,224) = named node    → exit-active (no exit-empty)
//   E → (47,225)    = empty cell    → exit-active exit-empty
//   N → (46,224)    = empty cell    → exit-active exit-empty
// Waypoint LHR(64,224): BFS from (47,224) → first step S → btn-S has dpad-wp.

test.describe('Exit link consistency — _updateExitLinks (§UNIFY-04)', () => {

  async function stepEast(page) {
    await page.evaluate(() => {
      const orig = Math.random; Math.random = () => 1;
      cellMove('E');   // BOO(47,223) → empty(47,224)
      Math.random = orig;
    });
  }

  test.beforeEach(async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
  });

  test('exit-W on empty cell has exit-active (BOO is a named neighbor)', async ({ page }) => {
    await stepEast(page);
    const cls = await page.locator('#exit-W').getAttribute('class');
    expect(cls).toContain('exit-active');
    expect(cls).not.toContain('exit-empty');
  });

  test('exit-E on empty cell has exit-active exit-empty (open terrain)', async ({ page }) => {
    await stepEast(page);
    const cls = await page.locator('#exit-E').getAttribute('class');
    expect(cls).toContain('exit-active');
    expect(cls).toContain('exit-empty');
  });

  test('exit-S on empty cell shows LEA label (named neighbor south)', async ({ page }) => {
    await stepEast(page);
    const text = await page.locator('#exit-S').textContent();
    // LEA = "Castle Lea — Sir Richard's Estate" but the label portion is what shows
    expect(text).toContain('Castle Lea');
  });

  test('waypoint tinting: btn-S has dpad-wp when waypoint=LHR from empty cell', async ({ page }) => {
    // Set waypoint before stepping, then verify the S button is tinted
    await page.evaluate(() => { S_story.waypoint = 'LHR'; });
    await stepEast(page);
    // BFS from (47,224) toward LHR(64,224) first steps S to LEA(48,224)
    const cls = await page.locator('#btn-S').getAttribute('class');
    expect(cls).toContain('dpad-wp');
  });

  test('waypoint tinting absent when no waypoint set', async ({ page }) => {
    await stepEast(page);
    const clsN = await page.locator('#btn-N').getAttribute('class');
    const clsS = await page.locator('#btn-S').getAttribute('class');
    const clsE = await page.locator('#btn-E').getAttribute('class');
    const clsW = await page.locator('#btn-W').getAttribute('class');
    for (const cls of [clsN, clsS, clsE, clsW]) {
      expect(cls || '').not.toContain('dpad-wp');
    }
  });

});

// ── 6 — _gameWarn channel §UNIFY-10 ─────────────────────────────────────────
//
// Verifies that _gameWarn(msg) adds class 'game-warn' to #story-move-msg
// (dim styling) while storyMsg() clears it (gold styling).
//
// Also verifies that the edge-of-world gate in cellMove routes through
// _gameWarn, giving gate blocks the dim visual treatment.

test.describe('_gameWarn channel (§UNIFY-10)', () => {

  test.beforeEach(async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
  });

  test('_gameWarn adds game-warn class to #story-move-msg', async ({ page }) => {
    await page.evaluate(() => _gameWarn('test gate message'));
    const cls = await page.locator('#story-move-msg').getAttribute('class');
    expect(cls).toContain('game-warn');
    const txt = await page.locator('#story-move-msg').textContent();
    expect(txt).toBe('test gate message');
  });

  test('storyMsg removes game-warn class set by a prior _gameWarn', async ({ page }) => {
    await page.evaluate(() => {
      _gameWarn('gate block');
      storyMsg('narrative event');
    });
    const cls = await page.locator('#story-move-msg').getAttribute('class');
    expect(cls || '').not.toContain('game-warn');
    const txt = await page.locator('#story-move-msg').textContent();
    expect(txt).toBe('narrative event');
  });

  test('cellMove at world edge fires _gameWarn (game-warn class applied)', async ({ page }) => {
    // BOO is at r:47 c:223. Move N repeatedly until we reach r:1 (boundary),
    // then one more N triggers the out-of-bounds gate.
    // Simpler: force playerR to 1 and move N.
    await page.evaluate(() => {
      S_story.playerR = 1;
      S_story.playerC = 100;
      const orig = Math.random; Math.random = () => 1;
      cellMove('N');  // would go to r:0 — out of bounds
      Math.random = orig;
    });
    const cls = await page.locator('#story-move-msg').getAttribute('class');
    expect(cls).toContain('game-warn');
    const txt = await page.locator('#story-move-msg').textContent();
    expect(txt).toBe('You reach the edge of the known world.');
  });

  test('normal cellMove clears game-warn class', async ({ page }) => {
    // First trigger a warn, then take a valid step — storyRender clears the msg.
    await page.evaluate(() => _gameWarn('stale warn'));
    await page.evaluate(() => {
      const orig = Math.random; Math.random = () => 1;
      cellMove('S');  // BOO → LXF (named node south)
      Math.random = orig;
    });
    // After arriving at LXF, storyRender runs and storyMsg is called at end,
    // clearing game-warn. The move-msg may be set by quest msgs or cleared.
    const cls = await page.locator('#story-move-msg').getAttribute('class');
    expect(cls || '').not.toContain('game-warn');
  });

});

// ── 7 — Status bar §UNIFY-03 ─────────────────────────────────────────────────
//
// Verifies storyUpdateStatus() is called AFTER storyCheckQuests() inside
// storyRender(), so quest completion rewards (gold, hp) are visible in the
// status bar on the same render cycle they are awarded.

test.describe('Status bar — storyUpdateStatus discipline (§UNIFY-03)', () => {

  test.beforeEach(async ({ page }) => {
    await seedAndLoad(page, { hp: 45, hpMax: 80, gold: 300 });
    await dismissContinue(page);
  });

  test('#s-hp shows seeded hp/hpMax after initial render', async ({ page }) => {
    const hp = await page.locator('#s-hp').textContent();
    expect(hp).toBe('45/80');
  });

  test('#s-gold shows seeded gold after initial render', async ({ page }) => {
    const gold = await page.locator('#s-gold').textContent();
    expect(gold).toBe('300gp');
  });

  test('gold mutation inside storyCheckQuests is visible in #s-gold on same storyRender', async ({ page }) => {
    // Patch storyCheckQuests to inject a gold mutation, then re-trigger storyRender.
    // Before §UNIFY-03 fix, storyUpdateStatus ran BEFORE storyCheckQuests so the
    // mutation would not appear until the next render cycle.
    const gold = await page.evaluate(() => {
      const orig = window.storyCheckQuests;
      window.storyCheckQuests = (node) => { S_story.gold += 100; return orig(node); };
      storyRender(NODE_MAP[S_story.currentCode]);
      window.storyCheckQuests = orig;
      return document.getElementById('s-gold').textContent;
    });
    expect(gold).toBe('400gp'); // 300 seeded + 100 injected
  });
});
