'use strict';
const { test, expect } = require('@playwright/test');

// ── §EDITOR-02 — Mission Builder: pure arc compiler ───────────────────────────
//
// buildArcQuests(arcDraft) turns an authoring draft into final quest objects,
// auto-generating the chain flags so step k+1 gates on step k's completion.
// It is a pure function (no I/O, no DOM) exposed on window for the Inc 3 tab UI
// and these tests. We exercise it head-lessly via page.evaluate — no server.
//
// Locked behavior (lab-report-editor02-mission-builder.md §4):
//  - ids are <arcId>_<n> (1-based); q.arc = arcLabel
//  - auto-gated step k reads the PREVIOUS step's producer flag via an arrow-fn
//    SOURCE string  (s)=>s.<flag>  — never a bare identifier (save-abort guard)
//  - skill_check producer flag = checkPassFlag (auto <arcId>_<n>_passed), always set
//  - non-skill producer flag = grantBit|<arcId>_<n>_done, appended ONLY when a
//    downstream auto step consumes it (no stray token on the last/unread step)
//  - gateMode 'manual' passes activateCond through; 'none' emits no activateCond

test.describe('Mission Builder — buildArcQuests compiler (§EDITOR-02)', () => {
  test('3-step skill_check arc: seq ids + arrow-fn activateCond wiring', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const qs = await page.evaluate(() => window.buildArcQuests({
      arcId: 'quest_yael', arcLabel: 'Yael romance', activateNode: 'BRK',
      steps: [
        { type: 'skill_check', title: 'Step One', checkStat: 'cha', checkSkill: 'persuasion', checkDC: 12 },
        { type: 'skill_check', title: 'Step Two', checkStat: 'cha', checkSkill: 'persuasion', checkDC: 14 },
        { type: 'skill_check', title: 'Step Three', checkStat: 'cha', checkSkill: 'persuasion', checkDC: 16 },
      ],
    }));
    expect(qs.map(q => q.id)).toEqual(['quest_yael_1', 'quest_yael_2', 'quest_yael_3']);
    expect(qs.every(q => q.arc === 'Yael romance')).toBe(true);
    expect(qs.every(q => q.activateNode === 'BRK')).toBe(true);
    // producer flags
    expect(qs[0].checkPassFlag).toBe('quest_yael_1_passed');
    expect(qs[1].checkPassFlag).toBe('quest_yael_2_passed');
    // chain wiring: step 1 ungated; 2/3 read the previous pass flag as arrow-fn source
    expect('activateCond' in qs[0]).toBe(false);
    expect(qs[1].activateCond).toBe('(s)=>s.quest_yael_1_passed');
    expect(qs[2].activateCond).toBe('(s)=>s.quest_yael_2_passed');
    // every emitted activateCond is an arrow fn, NOT a bare identifier
    for (const q of qs) if (q.activateCond) expect(q.activateCond).toMatch(/^\(s\)\s*=>\s*s\./);
    // scalars round-trip as numbers
    expect(qs[0].checkDC).toBe(12);
  });

  test('mixed arc: non-skill step emits a consumed grantBit producer flag', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const qs = await page.evaluate(() => window.buildArcQuests({
      arcId: 'quest_mix', activateNode: 'BMA',
      steps: [
        { type: 'skill_check', title: 'Talk', checkStat: 'cha', checkDC: 10 },
        { type: 'side', title: 'Fetch', completeItems: 'Old Key' },   // step 2: consumed by step 3
        { type: 'skill_check', title: 'Open', checkStat: 'int', checkDC: 13 },
      ],
    }));
    // step 2 (side) gets a grantBit producer flag because step 3 (auto) reads it
    expect(qs[1].itemChain).toEqual([{ action: 'grantBit', flag: 'quest_mix_2_done' }]);
    // step 3 auto-gates on step 2's done flag (not a _passed flag — step 2 is non-skill)
    expect(qs[2].activateCond).toBe('(s)=>s.quest_mix_2_done');
    // step 2 still gates on step 1's pass flag, and keeps its side fields
    expect(qs[1].activateCond).toBe('(s)=>s.quest_mix_1_passed');
    expect(qs[1].completeItems).toEqual(['Old Key']);
  });

  test('trailing non-skill step gets NO stray grantBit (nobody reads it)', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const qs = await page.evaluate(() => window.buildArcQuests({
      arcId: 'quest_tail', activateNode: 'BMA',
      steps: [
        { type: 'skill_check', title: 'A', checkStat: 'wis', checkDC: 11 },
        { type: 'side', title: 'B (last)', completeItems: 'Trophy' },   // last → unconsumed
      ],
    }));
    // authored itemChain is empty and no producer grantBit is injected
    expect('itemChain' in qs[1]).toBe(false);
    expect(qs[1].completeItems).toEqual(['Trophy']);
  });

  test('non-skill producer grantBit merges with an authored itemChain', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const qs = await page.evaluate(() => window.buildArcQuests({
      arcId: 'quest_ic', activateNode: 'BMA',
      steps: [
        { type: 'side', title: 'Give', itemChain: 'grant | Pip Bead | 🪵' },
        { type: 'skill_check', title: 'Check', checkStat: 'int', checkDC: 12 },
      ],
    }));
    // authored grant kept, producer grantBit appended (step 2 consumes it)
    expect(qs[0].itemChain).toEqual([
      { action: 'grant', name: 'Pip Bead', icon: '🪵' },
      { action: 'grantBit', flag: 'quest_ic_1_done' },
    ]);
    expect(qs[1].activateCond).toBe('(s)=>s.quest_ic_1_done');
  });

  test('gateMode manual passes activateCond through; none emits nothing', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const qs = await page.evaluate(() => window.buildArcQuests({
      arcId: 'quest_gate', activateNode: 'BMA',
      steps: [
        { type: 'skill_check', title: 'A', checkStat: 'cha', checkDC: 10 },
        { type: 'skill_check', title: 'B', checkStat: 'cha', checkDC: 12, gateMode: 'manual', activateCond: '(s)=>s.somethingElse && s.q1' },
        { type: 'skill_check', title: 'C', checkStat: 'cha', checkDC: 14, gateMode: 'none' },
      ],
    }));
    expect(qs[1].activateCond).toBe('(s)=>s.somethingElse && s.q1');   // untouched
    expect('activateCond' in qs[2]).toBe(false);                       // suppressed
    // explicit checkPassFlag override is respected as the producer flag
    const qs2 = await page.evaluate(() => window.buildArcQuests({
      arcId: 'quest_pf', activateNode: 'BMA',
      steps: [
        { type: 'skill_check', title: 'A', checkStat: 'cha', checkDC: 10, checkPassFlag: 'customFlag' },
        { type: 'skill_check', title: 'B', checkStat: 'cha', checkDC: 12 },
      ],
    }));
    expect(qs2[0].checkPassFlag).toBe('customFlag');
    expect(qs2[1].activateCond).toBe('(s)=>s.customFlag');
  });

  test('empty / malformed drafts compile to an empty array (no throw)', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const r = await page.evaluate(() => ({
      none:  window.buildArcQuests(),
      empty: window.buildArcQuests({ arcId: 'q', steps: [] }),
      bad:   window.buildArcQuests({ arcId: 'q', steps: null }),
    }));
    expect(r.none).toEqual([]);
    expect(r.empty).toEqual([]);
    expect(r.bad).toEqual([]);
  });
});
