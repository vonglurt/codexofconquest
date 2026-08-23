'use strict';
/**
 * §DOC-02cy — Layer 44 "Living World" measurement suite.
 *
 * Written to VERIFY lab-reports/lab-report-living-world.md against the live
 * engine, not to fence a feature. Every assertion runs through the game's own
 * functions (_getFarewell, _getNodeMapColor, _getGigaultState, ...) rather than
 * a re-implementation, so a change to the engine breaks the test rather than
 * silently invalidating the report.
 */
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

test.describe('Layer 44 — Living World', () => {

  // ── F1: the world-progression note is written into the movement trail ──
  test('world-progression notes land in S_story.log, which has no text reader', async ({ page }) => {
    await seedAndLoad(page, {
      currentCode: 'LHR', visited: { LHR: true },
      actNumber: 3, bruhnsDepthsReported: true, worldEventsFired: [], log: ['TLL', 'MHQ'],
    });
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      S_story.actNumber = 3;
      S_story.bruhnsDepthsReported = true;
      S_story.worldEventsFired = [];
      S_story.log = ['TLL', 'MHQ'];
      _checkWorldProgressionEvents();
      return {
        log: S_story.log,
        fired: S_story.worldEventsFired,
        objectEntries: S_story.log.filter(e => typeof e === 'object').length,
        stringEntries: S_story.log.filter(e => typeof e === 'string').length,
      };
    });

    expect(out.fired).toContain('auros_report');
    // The note is unshifted into the SAME array that storyMove() push()es node
    // codes onto and shift()s at 20 entries.
    expect(out.objectEntries).toBe(1);
    expect(out.stringEntries).toBe(2);
    expect(out.log[0].text).toContain("Auros's name on the cover page");

    // ...and nothing renders it: the .journal-entry.world rule matches nothing.
    const styled = await page.locator('.journal-entry.world').count();
    expect(styled).toBe(0);
    const anyJournalEntry = await page.locator('.journal-entry').count();
    expect(anyJournalEntry).toBe(0);
  });

  // ── F2: Auros has farewells and no node to say them from ──
  test('auros farewells are unreachable; NODE_NPC_KEYS has no auros row', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'HKG', visited: { HKG: true } });
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      // Max favor for every canonical NPC.
      S_story.npcFavorability = { yael:3, brynn:3, quill:3, pachelbel:3, crov:3, auros:3 };
      const owners = Object.values(NODE_NPC_KEYS);
      // Every node code in NODE_MAP, as a departure point, to every other.
      const codes = Object.keys(NODE_MAP);
      const reachable = new Set();
      for (const from of codes) for (const to of codes) {
        const f = _getFarewell(from, to);
        if (f) reachable.add(f);
      }
      const aurosLines = Object.values(NPC_FAREWELLS.auros);
      return {
        owners,
        aurosInOwners: owners.includes('auros'),
        aurosLinesReachable: aurosLines.filter(l => reachable.has(l)).length,
        aurosLineCount: aurosLines.length,
        totalReachable: reachable.size,
      };
    });

    expect(out.owners.sort()).toEqual(['brynn', 'crov', 'pachelbel', 'quill', 'yael']);
    expect(out.aurosInOwners).toBe(false);
    expect(out.aurosLineCount).toBe(2);
    expect(out.aurosLinesReachable).toBe(0);   // ← the finding
    expect(out.totalReachable).toBe(16);       // 11 routes + 5 defaults
  });

  // ── F3: farewells and Brynn's tasks open one favor tier below spec ──
  test('farewell threshold is fav >= 1 (Quest-Active), not the spec\'s fav >= 2', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'LHR', visited: { LHR: true } });
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      const at = f => { S_story.npcFavorability = { yael: f }; return _getFarewell('LHR', 'TLL'); };
      return { fav0: at(0), fav1: at(1), fav2: at(2) };
    });
    expect(out.fav0).toBeNull();
    expect(out.fav1).toContain("Brynn's fine");  // spec said this needs Friendly (2)
    expect(out.fav2).toContain("Brynn's fine");
  });

  // ── F4: the ledger does not balance, and can be pushed into surplus ──
  test('Brynn ledger: printed lines sum to +138 while the balance reads -8; max reachable is +1', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'TLL', visited: { TLL: true }, gold: 500 });
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      S_story.npcFavorability = { brynn: 3 };
      S_story.brynLedgerBalance = -8;
      S_story.brynThirdStepFixed = false;
      S_story.brynFirewoodBrought = false;
      S_story.brynPantryRestocked = false;
      const deltas = BRYNN_MAINTENANCE_TASKS.map(t => { t.action(); return S_story.brynLedgerBalance; });
      // The itemized figures the panel prints, as authored. The Repairs line is
      // the only one the player can move (-4 when the third step is fixed).
      const printedBase  = 235 + 84 - 45 - 112 - 24;
      const printedFixed = 235 + 84 - 45 - 112 - (24 - 4);
      return { deltas, finalBalance: S_story.brynLedgerBalance,
               printedBase, printedFixed, taskCount: BRYNN_MAINTENANCE_TASKS.length };
    });

    expect(out.taskCount).toBe(3);
    expect(out.deltas).toEqual([-4, -2, 1]);
    expect(out.finalBalance).toBe(1);   // spec: "can be brought to zero but not into surplus"
    // ...and the printed lines never summed to -8 either: they sum to a healthy
    // surplus, in both states, and always have.
    expect(out.printedBase).toBe(138);
    expect(out.printedFixed).toBe(142);
  });

  // ── F5: 19 of 20 EB returns carry a receipt; 5 authored Birka receipts are dead ──
  test('quiet return receipts: INV has none, and the 5 Birka keys cannot be looked up', async ({ page }) => {
    await seedAndLoad(page, {});
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      const ebCodes = Object.values(QUEST_DB)
        .filter(q => q.id && /_return$/.test(q.id) && q.completion && q.completion.flagsPath)
        .map(q => String(q.completion.flagsPath[0]).split('.')[1])
        .filter(Boolean);
      const keys = Object.keys(QUIET_RETURN_RECEIPTS);
      return {
        ebCount: new Set(ebCodes).size,
        missing: [...new Set(ebCodes)].filter(c => !keys.includes(c)),
        nonEbKeys: keys.filter(k => !ebCodes.includes(k)),
      };
    });

    expect(out.ebCount).toBe(20);
    expect(out.missing).toEqual(['INV']);        // Shepherd Rona returns to silence
    expect(out.nonEbKeys.sort()).toEqual(
      ['auros_depths', 'crov_pit', 'deacon_redd', 'quill_debt', 'yael_ghetto']);
  });

  // ── F6: the warmth gradient and the stall cycle do work ──
  test('map warmth tiers and the Gigault stall cycle behave as designed', async ({ page }) => {
    await seedAndLoad(page, { visited: { LHR: true } });
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      S_story.visited = { LHR: true };
      S_story.ebReturnDone = { PRN: true };
      const tier = f => { S_story.npcFavorability = { yael: f }; return _getNodeMapColor('LHR'); };
      const stall = d => { S_story.gameDay = d; return _getGigaultState(); };
      return {
        unvisited: _getNodeMapColor('ZZZ'),
        fav0: tier(0), fav1: tier(1), fav2: tier(2), fav3: tier(3),
        ebGlow: (S_story.visited.PRN = true, _getNodeMapColor('PRN')),
        stalls: [stall(0), stall(1), stall(2), stall(3)],
      };
    });

    expect(out.unvisited).toBe('#222');
    expect(out.fav0).toBe('#555');
    expect(out.fav1).toBe('#5a4a3a');
    expect(out.fav2).toBe('#6a5a3a');
    expect(out.fav3).toBe('#8a6a3a');
    expect(out.ebGlow).toBe('#3a7a5a');
    expect(out.stalls[0]).toContain('blocking your view');
    expect(out.stalls[1]).toContain('Back at ninth bell');
    expect(out.stalls[2]).toContain('Tomorrow');
    expect(out.stalls[3]).toBe(out.stalls[0]);   // 3-day cycle
  });

  // ── F7: the ending map renders, at the timings the spec asked for ──
  test('final map renders 129 cells and holds for the specified beats', async ({ page }) => {
    await seedAndLoad(page, { visited: { LHR: true, TLL: true, PRN: true } });
    await dismissContinue(page);

    await page.evaluate(() => {
      S_story.visited = { LHR: true, TLL: true, PRN: true };
      S_story.npcFavorability = { yael: 3, brynn: 2 };
      S_story.ebReturnDone = { PRN: true };
      _renderFinalMap();
    });

    await expect(page.locator('#final-map-overlay')).toBeVisible();
    const cells = await page.locator('.final-map-cell').count();
    expect(cells).toBe(129);

    const colors = await page.evaluate(() => {
      const pick = t => {
        const c = [...document.querySelectorAll('.final-map-cell')].find(x => x.title === t);
        return c && c.style.background;
      };
      return { yael: pick(NODE_MAP.LHR.name), warm3: _getNodeMapColor('LHR') };
    });
    expect(colors.warm3).toBe('#8a6a3a');

    await page.waitForTimeout(3600);
    await expect(page.locator('#final-map-caption')).toBeVisible();
    await page.screenshot({ path: 'test-results/l44-final-map.png' });
  });

  // ── F9: the closing image is not full-screen, because the caption code says so ──
  test('final map overlay loses position:fixed to an inline style from Layer 66b', async ({ page }) => {
    await seedAndLoad(page, { visited: { LHR: true } });
    await dismissContinue(page);

    const before = await page.evaluate(() =>
      getComputedStyle(document.getElementById('final-map-overlay')).position);
    expect(before).toBe('fixed');            // what the stylesheet asks for

    const after = await page.evaluate(() => {
      S_story.visited = { LHR: true };
      _renderFinalMap();
      const o = document.getElementById('final-map-overlay');
      const r = o.getBoundingClientRect();
      return { position: getComputedStyle(o).position, inline: o.style.position,
               top: Math.round(r.top), coversViewport: Math.round(r.top) === 0 };
    });

    // _renderFinalMap() writes `overlay.style.position = 'relative'` so its
    // absolutely-positioned caption has a containing block -- but `fixed`
    // already provided one. The overlay drops into normal flow and the game's
    // closing image renders BELOW the UI chrome instead of over it.
    expect(after.inline).toBe('relative');
    expect(after.position).toBe('relative');
    expect(after.coversViewport).toBe(false);
    expect(after.top).toBeGreaterThan(200);
  });

  // ── F8: the Act III weight is live ──
  test('Act III adds body.act-three, which desaturates NPC cards', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'LHR', visited: { LHR: true }, actNumber: 3 });
    await dismissContinue(page);
    const out = await page.evaluate(() => {
      S_story.actNumber = 3;
      S_story.actThreeWeightApplied = false;
      _applyActThreeWeight();
      return { cls: document.body.className.includes('act-three'),
               lines: Object.keys(NPC_ACT_THREE_LINES) };
    });
    expect(out.cls).toBe(true);
    expect(out.lines.sort()).toEqual(['auros','brynn','crov','pachelbel','quill','yael']);
  });
});
