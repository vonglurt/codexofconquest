// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
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
// Current geo facts used below (from NODE_COORDS in index.html):
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

    // §NAV-01c: the shell renders the room layer — deterministic prose + signage
    // from describeCell (derived in-page so assertions survive prose re-tuning).
    const shell = await page.evaluate(() => {
      const room = describeCell(_roomWorld(), { r: 9, c: 197 });
      const expectedBody = room.prose +
        (room.signposts.length ? '\n\n' + room.signposts.map(s => '🪧 ' + s).join('\n') : '');
      return {
        name: document.getElementById('s-node-name').textContent,
        act: document.getElementById('s-node-act').textContent,
        badge: document.getElementById('story-act-badge').textContent,
        body: document.getElementById('story-text-box').textContent,
        room, expectedBody,
      };
    });
    expect(shell.body).toBe(shell.expectedBody);
    expect(shell.room.prose.length).toBeGreaterThan(20);
    expect(shell.name).toBe(shell.room.title);
    expect(shell.act).toBe(shell.room.sub);
    expect(shell.badge).toBe('— ' + shell.room.title + ' —');
  });
});

// ── §NAV-01c — room layer (describeCell) ─────────────────────────────────────

test.describe('§NAV-01c room layer (describeCell)', () => {
  test.beforeEach(async ({ page }) => {
    await seedAndLoad(page, seedAt(LHR));
    await dismissContinue(page);
  });

  test('describeCell is deterministic — two calls return identical rooms', async ({ page }) => {
    const [a, b] = await page.evaluate(() => [
      describeCell(_roomWorld(), { r: 9, c: 197 }),
      describeCell(_roomWorld(), { r: 9, c: 197 }),
    ]);
    expect(a).toEqual(b);
  });

  test('a road cell describes the highway; road exits carry "toward X (n)" signage', async ({ page }) => {
    const road = await page.evaluate(() => {
      const key = [...ROAD_CELLS][0];
      const [r, c] = key.split(',').map(Number);
      const room = describeCell(_roomWorld(), { r, c });
      return { key, room, isRoadProse: /road|highway|flagstone/i.test(room.prose) };
    });
    expect(road.room.terrain).toBe('road');
    expect(road.isRoadProse).toBe(true);
    for (const e of road.room.exits) {
      expect(['node', 'road', 'lane', 'terrain', 'blocked']).toContain(e.kind);
      if ((e.kind === 'road' || e.kind === 'lane') && e.steps != null) {
        expect(e.hint).toMatch(/^toward .+ \(\d+\)$/);
      }
    }
  });

  test('an empty cell near a city names its landmark in the header + a signpost', async ({ page }) => {
    const room = await page.evaluate(() => describeCell(_roomWorld(), { r: 9, c: 197 }));
    expect(room.landmarks.length).toBeGreaterThan(0);
    expect(room.landmarks[0].steps).toBeGreaterThanOrEqual(1);
    expect(room.sub).toMatch(/^Near .+ · 9,197$/);
    expect(room.signposts.length).toBeGreaterThan(0);
  });

  test('rooms differ across cells (no more identical wilderness)', async ({ page }) => {
    const [p1, p2] = await page.evaluate(() => {
      const a = describeCell(_roomWorld(), { r: 9, c: 197 });
      const b = describeCell(_roomWorld(), { r: 15, c: 194 });
      return [a.prose + '|' + a.sub, b.prose + '|' + b.sub];
    });
    expect(p1).not.toBe(p2);
  });
});

// ── §NAV-01 verify — the real movement buttons drive the player ──────────────

test.describe('§NAV-01 D-pad buttons move the player', () => {
  test.beforeEach(async ({ page }) => {
    await seedAndLoad(page, seedAt(LHR));
    await dismissContinue(page);
  });

  test('clicking #btn-E moves one cell east onto BMA and re-renders', async ({ page }) => {
    await page.evaluate(() => { window.__rr = Math.random; Math.random = () => 1; });
    await page.click('#btn-E');
    await page.evaluate(() => { Math.random = window.__rr; });
    const s = await page.evaluate(() => ({
      r: S_story.playerR, c: S_story.playerC, code: S_story.currentCode,
      name: document.getElementById('s-node-name').textContent,
    }));
    expect(s.r).toBe(10); expect(s.c).toBe(198); expect(s.code).toBe('BMA');
    expect(s.name.length).toBeGreaterThan(0);
  });

  test('clicking #btn-N steps into open terrain and the room text changes', async ({ page }) => {
    const before = await page.evaluate(() => document.getElementById('story-text-box').textContent);
    await page.evaluate(() => { window.__rr = Math.random; Math.random = () => 1; });
    await page.click('#btn-N');
    await page.evaluate(() => { Math.random = window.__rr; });
    const after = await page.evaluate(() => ({
      r: S_story.playerR, c: S_story.playerC,
      body: document.getElementById('story-text-box').textContent,
    }));
    expect(after.r).toBe(9); expect(after.c).toBe(197);
    expect(after.body).not.toBe(before);
    expect(after.body.length).toBeGreaterThan(20);
  });

  test('blocked direction (S into sea) disables the D-pad button and its exit line', async ({ page }) => {
    // _updateExitLinks disables impossible moves outright — the button cannot
    // even be clicked (and the kernel would refuse the step anyway).
    const s = await page.evaluate(() => ({
      disabled: document.getElementById('btn-S').disabled,
      exitLine: document.getElementById('exit-S').textContent,
      r: S_story.playerR, c: S_story.playerC,
    }));
    expect(s.disabled).toBe(true);
    expect(s.exitLine).toContain('(none)');
    expect(s.r).toBe(10); expect(s.c).toBe(197);
  });

  test('map tab renders 15×21 terrain-painted window + full-world canvas (§NAV-01e)', async ({ page }) => {
    const m = await page.evaluate(() => {
      storyMapToggle();
      const cells = [...document.querySelectorAll('#map-grid .mc')];
      const painted = cells.filter(el => el.style.background && el.style.background !== '').length;
      // §MP-MAPTABS: the full-world canvas now lives in its own 🛰 Full sub-tab,
      // painted on tab activation (not under the Local grid). Switch to it first.
      msubSwitch('msub-full');
      const cv = document.getElementById('full-map-canvas');
      const px = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      let nonZero = 0;
      for (let i = 0; i < px.length; i += 4) if (px[i] || px[i + 1] || px[i + 2]) nonZero++;
      return { total: cells.length, painted, canvasPainted: nonZero, innIcon: _mapIcon('TLL') };
    });
    expect(m.total).toBe(15 * 21);                    // bigger window
    expect(m.painted).toBeGreaterThan(m.total / 2);   // terrain base layer
    expect(m.canvasPainted).toBeGreaterThan(10000);   // full-world canvas drawn
    expect(m.innIcon).toBe('🛏');                     // amenity icons live
  });

  test('GLOBE panel paints the entire world and tracks empty-cell steps (§NAV-01e)', async ({ page }) => {
    const painted = await page.evaluate(() => {
      const cv = document.getElementById('globe-map-canvas');
      const px = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      let n = 0;
      for (let i = 0; i < px.length; i += 4) if (px[i] || px[i + 1] || px[i + 2]) n++;
      return n;
    });
    expect(painted).toBeGreaterThan(5000);   // whole-world terrain layer drawn on load
    // step into wilderness — the player marker (red) must move with you
    const marker = await page.evaluate(() => {
      const cv = document.getElementById('globe-map-canvas');
      const at = (r, c) => {
        const d = cv.getContext('2d').getImageData((c - 140) * 2, r * 2, 1, 1).data;
        return d[0] > 200 && d[1] < 120;   // red-ish player pixel
      };
      const before = at(9, 197);
      const o = Math.random; Math.random = () => 1; cellMove('N'); Math.random = o;
      return { before, after: at(9, 197) };
    });
    expect(marker.before).toBe(false);
    expect(marker.after).toBe(true);
  });

  test('local minimap paints terrain colours like the world map (§NAV-01e)', async ({ page }) => {
    const mm = await page.evaluate(() => {
      _renderMiniMap();
      const cells = [...document.querySelectorAll('#mini-map-grid .mmc')];
      const painted = cells.filter(el => el.style.background && el.style.background !== '').length;
      const fogged = cells.filter(el => el.classList.contains('mmc-fog-cell') || el.classList.contains('mmc-partial')).length;
      return { total: cells.length, painted, fogged };
    });
    expect(mm.total).toBe(11 * 17);
    expect(mm.fogged).toBe(0);                        // fog classes retired (§NAV-01e)
    expect(mm.painted).toBeGreaterThan(mm.total / 2); // terrain base layer present
  });
});

// ── §NAV-01e remainder — wayfinding UI (exits signage · waypoint ★ · distance) ─

test.describe('§NAV-01e wayfinding UI', () => {
  test('empty-neighbour exit lines carry room signage, never flat "open terrain"', async ({ page }) => {
    await seedAndLoad(page, seedAt(LHR));
    await dismissContinue(page);
    // LHR N → (9,197) is empty land: the line must name the terrain (or a
    // road/lane with destination hint) from the same describeCell data the
    // room text uses — the flat "open terrain" placeholder is retired.
    const s = await page.evaluate(() => {
      _updateExitLinks();
      const room = describeCell(_roomWorld(), _playerPos());
      return { line: document.getElementById('exit-N').textContent, exitN: room.exits.find(x => x.dir === 'N') };
    });
    expect(s.line).not.toContain('open terrain');
    if (s.exitN.kind === 'road' || s.exitN.kind === 'lane') {
      expect(s.line).toContain(s.exitN.label);          // "road — toward X (n)"
      if (s.exitN.hint) expect(s.line).toContain(s.exitN.hint);
    } else {
      expect(s.line).toContain(s.exitN.label);          // terrain label, e.g. "City Streets"
    }
  });

  test('road-adjacent cell renders "road — toward X (n)" in the exit line', async ({ page }) => {
    await seedAndLoad(page, seedAt(LHR));
    await dismissContinue(page);
    const s = await page.evaluate(() => {
      // Stand on a road cell whose E/W neighbour is another empty road cell —
      // consecutive run cells guarantee one exists.
      const DELTAS = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };
      for (const key of ROAD_CELLS) {
        const [r, c] = key.split(',').map(Number);
        for (const d of ['N', 'S', 'E', 'W']) {
          const nr = r + DELTAS[d][0], nc = c + DELTAS[d][1];
          if (ROAD_CELLS.has(`${nr},${nc}`) && !cellCode(`${nr},${nc}`)) {
            S_story.playerR = r; S_story.playerC = c;
            _updateExitLinks();
            return { dir: d, line: document.getElementById('exit-' + d).textContent };
          }
        }
      }
      return null;
    });
    expect(s).not.toBeNull();
    expect(s.line).toMatch(/road/);
    expect(s.line).toMatch(/toward .+ \(\d+\)|an unmarked stretch/);
  });

  test('waypoint renders ★ on the local minimap and gold on the globe canvas', async ({ page }) => {
    await seedAndLoad(page, seedAt(NUE));
    await dismissContinue(page);
    const s = await page.evaluate(() => {
      S_story.waypoint = 'MUC';                        // 1 step S — inside the 11×17 window
      _renderMiniMap();
      _renderGlobeMap();
      const star = [...document.querySelectorAll('#mini-map-grid .mmc')].find(el => el.textContent === '★');
      const co = NODE_COORDS.MUC;
      const px = document.getElementById('globe-map-canvas')
        .getContext('2d').getImageData((co.c - 140) * 2, co.r * 2, 1, 1).data;
      return { hasStar: !!star, starTitle: star && star.title, px: [...px] };
    });
    expect(s.hasStar).toBe(true);
    expect(s.starTitle).toContain('Waypoint');
    // gold #ffd700 at the waypoint cell (drawn under the player, who is 1 cell away)
    expect(s.px[0]).toBeGreaterThan(200);
    expect(s.px[1]).toBeGreaterThan(150);
    expect(s.px[2]).toBeLessThan(100);
  });

  test('no waypoint → no ★ on the minimap', async ({ page }) => {
    await seedAndLoad(page, seedAt(NUE));
    await dismissContinue(page);
    const hasStar = await page.evaluate(() => {
      S_story.waypoint = null;
      _renderMiniMap();
      return [...document.querySelectorAll('#mini-map-grid .mmc')].some(el => el.textContent === '★');
    });
    expect(hasStar).toBe(false);
  });

  test('_wpDistTag renders "(n steps, bearing)" — BFS length + wrap-safe compass', async ({ page }) => {
    await seedAndLoad(page, seedAt(NUE));
    await dismissContinue(page);
    const s = await page.evaluate(() => ({
      oneStep: _wpDistTag('MUC'),     // NUE → MUC: 1 step due south
      far: _wpDistTag('LHR'),         // NUE (20,191) → LHR (10,197): north-east
      noCoords: _wpDistTag('NOPE'),   // unknown node → empty
      self: _wpDistTag('NUE'),        // standing on it → empty
    }));
    expect(s.oneStep).toMatch(/\(1 step, S\)/);
    expect(s.far).toMatch(/\(\d+ steps, NE\)/);
    expect(s.noCoords).toBe('');
    expect(s.self).toBe('');
  });

  test('quest journal Navigate button carries the distance readout', async ({ page }) => {
    await seedAndLoad(page, seedAt(NUE));
    await dismissContinue(page);
    const s = await page.evaluate(() => {
      // Give one active quest a waypoint and render the journal.
      const q = Object.values(QUEST_DB).find(x => x && x.activateNode === 'LHR' && x.waypointNode);
      const anyQ = q || Object.values(QUEST_DB).find(x => x && x.waypointNode && x.waypointNode !== 'NUE');
      if (!anyQ) return null;
      S_story.activeQuests = [anyQ.id];
      S_story.completedQuests = [];
      storyRenderQuests();
      const btn = [...document.querySelectorAll('.quest-set-wp-btn')].find(b => /Navigate|Waypoint/.test(b.textContent));
      return btn ? btn.textContent : null;
    });
    expect(s).not.toBeNull();
    expect(s).toMatch(/\(\d+ steps?, [NSEW]{1,2}\)/);
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

// ── 6b — Auto-travel (§NAV-01d) ──────────────────────────────────────────────
//
// Ground truth (current geo): NUE (20,191) → MGR (18,192) is 3 steps; every
// shortest route passes (18,191) or (19,192), both EMPTY cells, so a
// rate-1 encounter override is guaranteed to fire mid-route. LHR (10,197) is
// ~16 steps away — far enough that an interrupt always lands mid-journey.
// Math.random is pinned to 0.999999 (not 1: array picks index len-1, in
// bounds) so no step ever rolls an encounter unless the test forces rates.

test.describe('Navigation — auto-travel (§NAV-01d)', () => {
  test.beforeEach(async ({ page }) => {
    await seedAndLoad(page, seedAt(NUE));
    await dismissContinue(page);
  });

  test('WP click travels NUE → MGR (3 cells) and clears the waypoint on arrival', async ({ page }) => {
    await page.evaluate(() => {
      Math.random = () => 0.999999;
      S_story.waypoint = 'MGR';
      _updateWaypointBtn();
    });
    await page.click('#btn-waypoint');           // plain click = start travel loop
    await page.waitForFunction(() => S_story.waypoint === null, null, { timeout: 15000 });
    const done = await page.evaluate(() => ({
      active: _travelActive(),
      code: S_story.currentCode,
      r: S_story.playerR, c: S_story.playerC,
    }));
    expect(done.active).toBe(false);
    expect(done.code).toBe('MGR');
    expect([done.r, done.c]).toEqual([18, 192]);
  });

  test('a wilderness encounter halts auto-travel before the battle fires', async ({ page }) => {
    await page.evaluate(() => {
      Math.random = () => 0;                     // every empty-cell step rolls an encounter
      Object.keys(TERRAIN_ENCOUNTER_RATE).forEach(k => { TERRAIN_ENCOUNTER_RATE[k] = 1; });
      S_story.waypoint = 'LHR';
      _travelStart();
    });
    await page.waitForFunction(() => S_story.pendingBattle !== null, null, { timeout: 10000 });
    expect(await page.evaluate(() => _travelActive())).toBe(false);
    expect(await readStory(page, 'waypoint')).toBe('LHR');   // journey unfinished
  });

  test('any keypress halts auto-travel (waypoint kept)', async ({ page }) => {
    await page.evaluate(() => {
      Math.random = () => 0.999999;
      S_story.waypoint = 'LHR';                  // ~16 steps: interrupt lands mid-journey
      _travelStart();
    });
    expect(await page.evaluate(() => _travelActive())).toBe(true);
    await page.keyboard.press('ArrowUp');
    expect(await page.evaluate(() => _travelActive())).toBe(false);
    expect(await readStory(page, 'waypoint')).toBe('LHR');   // halt ≠ cancel waypoint
  });

  test('Shift+WP takes a single step (old behavior), no travel loop', async ({ page }) => {
    await page.evaluate(() => { Math.random = () => 0.999999; S_story.waypoint = 'MUC'; });
    await page.click('#btn-waypoint', { modifiers: ['Shift'] });
    expect(await page.evaluate(() => _travelActive())).toBe(false);
    expect(await readStory(page, 'currentCode')).toBe('MUC'); // exactly one step S
  });

  test('quest "Navigate →" (storySetWaypoint) starts travel and arrives', async ({ page }) => {
    await page.evaluate(() => { Math.random = () => 0.999999; storySetWaypoint('MGR'); });
    expect(await page.evaluate(() => _travelActive())).toBe(true);
    await page.waitForFunction(() => S_story.waypoint === null, null, { timeout: 15000 });
    expect(await readStory(page, 'currentCode')).toBe('MGR');
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
