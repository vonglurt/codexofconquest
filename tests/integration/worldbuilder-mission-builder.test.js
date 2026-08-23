// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
const { test, expect } = require('@playwright/test');

// ── §EDITOR-02 / §EDITOR-03 W8b — Mission Builder: pure UQF arc compiler ──────
//
// buildArcQuests(arcDraft) turns an authoring draft into final quest objects,
// auto-generating the chain flags so step k+1 gates on step k's completion.
// It is a pure function (no I/O, no DOM) exposed on window for the Inc 3 tab UI
// and these tests. We exercise it head-lessly via page.evaluate — no server.
//
// Locked behavior (§EDITOR-03 W8b — UQF-1.0 emit; supersedes the legacy shapes
// in lab-report-editor02-mission-builder.md §4):
//  - ids are <arcId>_<n> (1-based); q.arc = arcLabel; every quest carries
//    schema:'UQF-1.0' and a gate object
//  - auto-gated step k reads the resolved predecessor's producer flag via
//    gate:{flags:[<flag>]} — NEVER an activateCond source string (the old
//    '(s)=>s.flag' strings were dead/crashing at runtime: storyCheckQuests
//    calls activateCond() with no argument)
//  - skill_check producer flag = <arcId>_<n>_passed (or the step's
//    checkPassFlag override), written by an onPass flag_write bit inside the
//    skill_check bit; no root check*/xpAward fields (swept in W8a)
//  - non-skill producer flag = grantBit|<arcId>_<n>_done, appended ONLY when a
//    downstream auto step consumes it (no stray token on the last/unread step)
//  - side steps get a declarative completion gate: items → completion.items,
//    killGoals → completion.countMin over catKills.<key> (+ derived
//    targetMonsterKeys for journal progress), neither → completion.atNode
//    (arrival beat) so the chain always advances
//  - gateMode 'manual' passes activateCond through verbatim (author-owned JS);
//    'none' emits gate:{}

test.describe('Mission Builder — buildArcQuests compiler (§EDITOR-02/-03)', () => {
  test('3-step skill_check arc: seq ids + gate.flags wiring + UQF bits', async ({ page }) => {
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
    expect(qs.every(q => q.schema === 'UQF-1.0')).toBe(true);
    // the roll spec lives in the skill_check bit — no root check* residue
    expect(qs[0].bits).toHaveLength(1);
    expect(qs[0].bits[0].kind).toBe('skill_check');
    expect(qs[0].bits[0].stat).toBe('cha');
    expect(qs[0].bits[0].skill).toBe('persuasion');
    expect(qs[0].bits[0].dc).toBe(12);
    expect('checkStat' in qs[0]).toBe(false);
    expect('checkDC' in qs[0]).toBe(false);
    expect('checkPassFlag' in qs[0]).toBe(false);
    // producer flags ride the onPass flag_write bit
    expect(qs[0].bits[0].onPass).toEqual([{ kind: 'flag_write', set: ['quest_yael_1_passed'] }]);
    expect(qs[1].bits[0].onPass).toEqual([{ kind: 'flag_write', set: ['quest_yael_2_passed'] }]);
    // chain wiring: step 1 ungated; 2/3 read the previous pass flag via gate.flags
    expect(qs[0].gate).toEqual({});
    expect(qs[1].gate).toEqual({ flags: ['quest_yael_1_passed'] });
    expect(qs[2].gate).toEqual({ flags: ['quest_yael_2_passed'] });
    // no activateCond source strings anywhere
    expect(qs.some(q => 'activateCond' in q)).toBe(false);
  });

  test('mixed arc: side step gets completion.items + a consumed grantBit producer flag', async ({ page }) => {
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
    expect(qs[2].gate).toEqual({ flags: ['quest_mix_2_done'] });
    // step 2 still gates on step 1's pass flag, and its items become the completion gate
    expect(qs[1].gate).toEqual({ flags: ['quest_mix_1_passed'] });
    expect(qs[1].completion).toEqual({ items: ['Old Key'] });
    expect('completeItems' in qs[1]).toBe(false);
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
    expect(qs[1].completion).toEqual({ items: ['Trophy'] });
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
    expect(qs[1].gate).toEqual({ flags: ['quest_ic_1_done'] });
  });

  test('side step with no authored terms completes on arrival (completion.atNode)', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const qs = await page.evaluate(() => window.buildArcQuests({
      arcId: 'quest_beat', activateNode: 'BMA',
      steps: [
        { type: 'side', title: 'Narrative beat' },
        { type: 'side', title: 'Kill quota', killGoals: 'beefy_tom:3:Beefy Tom\nstray_alley_cat:5' },
      ],
    }));
    // no items/kills → arrival beat at the activate node
    expect(qs[0].completion).toEqual({ atNode: 'BMA' });
    // killGoals → journal fields + a countMin completion over catKills
    expect(qs[1].killGoals).toEqual([
      { key: 'beefy_tom', need: 3, label: 'Beefy Tom' },
      { key: 'stray_alley_cat', need: 5, label: 'stray_alley_cat' },
    ]);
    expect(qs[1].targetMonsterKeys).toEqual(['beefy_tom', 'stray_alley_cat']);
    expect(qs[1].completion).toEqual({ countMin: [
      { path: 'catKills.beefy_tom', min: 3 },
      { path: 'catKills.stray_alley_cat', min: 5 },
    ] });
  });

  test('skill_check defaults: unauthored stat/DC → WIS 12; xpAward → onPass reward bit', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const qs = await page.evaluate(() => window.buildArcQuests({
      arcId: 'quest_dflt', activateNode: 'BMA',
      steps: [{ type: 'skill_check', title: 'Bare roll', xpAward: '250' }],
    }));
    expect(qs[0].bits[0].stat).toBe('wis');
    expect(qs[0].bits[0].dc).toBe(12);
    expect(qs[0].bits[0].onPass).toEqual([
      { kind: 'flag_write', set: ['quest_dflt_1_passed'] },
      { kind: 'reward', xp: 250 },
    ]);
    expect('xpAward' in qs[0]).toBe(false);
  });

  test('gateMode manual passes activateCond through; none emits gate:{}', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const qs = await page.evaluate(() => window.buildArcQuests({
      arcId: 'quest_gate', activateNode: 'BMA',
      steps: [
        { type: 'skill_check', title: 'A', checkStat: 'cha', checkDC: 10 },
        { type: 'skill_check', title: 'B', checkStat: 'cha', checkDC: 12, gateMode: 'manual', activateCond: '()=>!!S_story.somethingElse && !!S_story.q1' },
        { type: 'skill_check', title: 'C', checkStat: 'cha', checkDC: 14, gateMode: 'none' },
      ],
    }));
    expect(qs[1].activateCond).toBe('()=>!!S_story.somethingElse && !!S_story.q1');   // untouched
    expect(qs[1].gate).toEqual({});                                    // manual → no declarative gate
    expect('activateCond' in qs[2]).toBe(false);                       // suppressed
    expect(qs[2].gate).toEqual({});
    // explicit checkPassFlag override is respected as the producer flag
    const qs2 = await page.evaluate(() => window.buildArcQuests({
      arcId: 'quest_pf', activateNode: 'BMA',
      steps: [
        { type: 'skill_check', title: 'A', checkStat: 'cha', checkDC: 10, checkPassFlag: 'customFlag' },
        { type: 'skill_check', title: 'B', checkStat: 'cha', checkDC: 12 },
      ],
    }));
    expect(qs2[0].bits[0].onPass).toEqual([{ kind: 'flag_write', set: ['customFlag'] }]);
    expect(qs2[1].gate).toEqual({ flags: ['customFlag'] });
  });

  // ── §EDITOR-02-FU — branching: a step forks off an arbitrary EARLIER step ──
  test('branching: gateAfter forks two steps off the same predecessor', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const qs = await page.evaluate(() => window.buildArcQuests({
      arcId: 'quest_branch', activateNode: 'BMA',
      steps: [
        { type: 'side', title: 'Root' },                       // _1 — fork point
        { type: 'side', title: 'Branch X' },                   // _2 — gates on prev (_1)
        { type: 'side', title: 'Branch Y', gateAfter: '1' },   // _3 — forks back to _1
      ],
    }));
    // Both branches read step 1's producer flag.
    expect(qs[1].gate).toEqual({ flags: ['quest_branch_1_done'] });
    expect(qs[2].gate).toEqual({ flags: ['quest_branch_1_done'] });
    // Step 1 is consumed by two downstream steps → exactly one grantBit producer.
    expect(qs[0].itemChain).toEqual([{ action: 'grantBit', flag: 'quest_branch_1_done' }]);
    // The two leaf branches are terminal → no stray producer token.
    expect('itemChain' in qs[1]).toBe(false);
    expect('itemChain' in qs[2]).toBe(false);
  });

  test('branching: blank / forward / out-of-range gateAfter falls back to previous', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const qs = await page.evaluate(() => window.buildArcQuests({
      arcId: 'quest_fb', activateNode: 'BMA',
      steps: [
        { type: 'side', title: 'A' },
        { type: 'side', title: 'B', gateAfter: '9' },   // out of range → prev (_1)
        { type: 'side', title: 'C', gateAfter: '5' },   // forward/oob → prev (_2)
      ],
    }));
    expect(qs[1].gate).toEqual({ flags: ['quest_fb_1_done'] });
    expect(qs[2].gate).toEqual({ flags: ['quest_fb_2_done'] });
    // Linear fallback chain: each non-leaf gets its producer grantBit.
    expect(qs[0].itemChain).toEqual([{ action: 'grantBit', flag: 'quest_fb_1_done' }]);
    expect(qs[1].itemChain).toEqual([{ action: 'grantBit', flag: 'quest_fb_2_done' }]);
    expect('itemChain' in qs[2]).toBe(false);
  });

  // ── Inc 3 — the tab UI: fill a 2-step arc, Build Chain, inspect the preview ──
  test('Mission tab: Build Chain renders the resolved chain + connector flag', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.evaluate(() => (window.switchTab('mission'), document.getElementById('welcome-screen').classList.add('hidden')));
    // Arc header + the seeded step #1 (defaults to type "side").
    await page.fill('#mb-arcId', 'quest_demo');
    await page.fill('#mb-arcLabel', 'Demo arc');
    await page.fill('#mb-node', 'BMA');
    await page.fill('#mb-steps .mb-step:nth-child(1) .mb-title', 'Fetch the key');
    // Add step #2 as a skill_check that auto-gates on step #1.
    await page.click('#mb-add');
    await page.selectOption('#mb-steps .mb-step:nth-child(2) .mb-type', 'skill_check');
    await page.fill('#mb-steps .mb-step:nth-child(2) .mb-title', 'Open the door');
    await page.fill('#mb-steps .mb-step:nth-child(2) .mb-dc', '13');

    // Collected draft mirrors the DOM.
    const draft = await page.evaluate(() => window.__mbCollectDraft());
    expect(draft.arcId).toBe('quest_demo');
    expect(draft.steps).toHaveLength(2);
    expect(draft.steps[1].type).toBe('skill_check');

    await page.click('#mb-build');
    // Two chain-link rows, one connector that names step 1's producer flag.
    await expect(page.locator('#mb-preview .chain-link')).toHaveCount(2);
    await expect(page.locator('#mb-preview')).toContainText('quest_demo_1');
    await expect(page.locator('#mb-preview')).toContainText('quest_demo_2');
    await expect(page.locator('#mb-preview')).toContainText('reads');
    await expect(page.locator('#mb-preview')).toContainText('quest_demo_1_done');

    // Compiled output is retrievable; step 2 auto-gates on step 1's done flag.
    const compiled = await page.evaluate(() => window.__mbCompiled());
    expect(compiled[1].gate).toEqual({ flags: ['quest_demo_1_done'] });
    expect(compiled[1].schema).toBe('UQF-1.0');
    // The POST All button exists (its enable/disable wiring lands in Inc 4).
    await expect(page.locator('#mb-post')).toHaveCount(1);
  });

  test('Mission tab: removing a step renumbers the rows', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.evaluate(() => (window.switchTab('mission'), document.getElementById('welcome-screen').classList.add('hidden')));
    await page.click('#mb-add');               // now 2 steps (1 seeded + 1)
    await page.click('#mb-add');               // 3 steps
    await expect(page.locator('#mb-steps .mb-step')).toHaveCount(3);
    await page.click('#mb-steps .mb-step:nth-child(2) .mb-rm');
    await expect(page.locator('#mb-steps .mb-step')).toHaveCount(2);
    // Numbers re-sequence 1..2.
    expect(await page.locator('#mb-steps .mb-step:nth-child(2) .mb-num').textContent()).toBe('#2');
  });

  test('Mission tab: ▲/▼ reorders steps + re-wires the compiled chain order (§EDITOR-02-FU)', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.evaluate(() => (window.switchTab('mission'), document.getElementById('welcome-screen').classList.add('hidden')));
    await page.fill('#mb-arcId', 'quest_ord');
    await page.fill('#mb-steps .mb-step:nth-child(1) .mb-title', 'Alpha');
    await page.click('#mb-add');
    await page.fill('#mb-steps .mb-step:nth-child(2) .mb-title', 'Beta');
    // Move step 2 (Beta) up → Beta becomes #1, Alpha #2.
    await page.click('#mb-steps .mb-step:nth-child(2) .mb-up');
    expect(await page.locator('#mb-steps .mb-step:nth-child(1) .mb-title').inputValue()).toBe('Beta');
    expect(await page.locator('#mb-steps .mb-step:nth-child(2) .mb-title').inputValue()).toBe('Alpha');
    // Numbers re-sequence with the new order.
    expect(await page.locator('#mb-steps .mb-step:nth-child(1) .mb-num').textContent()).toBe('#1');
    expect(await page.locator('#mb-steps .mb-step:nth-child(2) .mb-num').textContent()).toBe('#2');
    // Build → seq ids + titles follow the reordered DOM (position-numbered).
    await page.click('#mb-build');
    const compiled = await page.evaluate(() => window.__mbCompiled());
    expect(compiled.map(q => q.id)).toEqual(['quest_ord_1', 'quest_ord_2']);
    expect(compiled.map(q => q.title)).toEqual(['Beta', 'Alpha']);
    // ▲ on the top row is a no-op (no previous sibling).
    await page.click('#mb-steps .mb-step:nth-child(1) .mb-up');
    expect(await page.locator('#mb-steps .mb-step:nth-child(1) .mb-title').inputValue()).toBe('Beta');
  });

  test('Mission tab: "after #" picker forks a step off an earlier one (§EDITOR-02-FU)', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.evaluate(() => (window.switchTab('mission'), document.getElementById('welcome-screen').classList.add('hidden')));
    await page.fill('#mb-arcId', 'quest_ui');
    await page.fill('#mb-steps .mb-step:nth-child(1) .mb-title', 'Root');
    await page.click('#mb-add');
    await page.fill('#mb-steps .mb-step:nth-child(2) .mb-title', 'Branch X');
    await page.click('#mb-add');
    await page.fill('#mb-steps .mb-step:nth-child(3) .mb-title', 'Branch Y');
    // The after-# picker is visible for auto-gated steps; fork step 3 back to step 1.
    await expect(page.locator('#mb-steps .mb-step:nth-child(3) .mb-after')).toBeVisible();
    await page.fill('#mb-steps .mb-step:nth-child(3) .mb-after', '1');
    // Switching that step's gate to manual hides the picker.
    await page.selectOption('#mb-steps .mb-step:nth-child(2) .mb-gate', 'manual');
    await expect(page.locator('#mb-steps .mb-step:nth-child(2) .mb-after')).toBeHidden();
    await expect(page.locator('#mb-steps .mb-step:nth-child(2) .mb-cond')).toBeVisible();
    await page.selectOption('#mb-steps .mb-step:nth-child(2) .mb-gate', 'auto');
    await page.click('#mb-build');
    const compiled = await page.evaluate(() => window.__mbCompiled());
    expect(compiled[1].gate).toEqual({ flags: ['quest_ui_1_done'] });   // step 2 → prev (step 1)
    expect(compiled[2].gate).toEqual({ flags: ['quest_ui_1_done'] });   // step 3 forked → step 1
  });

  // ── Inc 4 — POST All wiring: sequential create, skip-existing, stop-on-error ──
  // We mock WBAPI.quests.create so the flow is exercised without a server or real
  // world mutation, and seed WBAPI.questDb to drive the already-posted skip.
  async function mbBuildTwoStep(page) {
    await page.evaluate(() => (window.switchTab('mission'), document.getElementById('welcome-screen').classList.add('hidden')));
    await page.fill('#mb-arcId', 'quest_post');
    await page.fill('#mb-arcLabel', 'Post arc');
    await page.fill('#mb-node', 'BMA');
    await page.fill('#mb-steps .mb-step:nth-child(1) .mb-title', 'Step one');
    await page.click('#mb-add');
    await page.selectOption('#mb-steps .mb-step:nth-child(2) .mb-type', 'skill_check');
    await page.fill('#mb-steps .mb-step:nth-child(2) .mb-title', 'Step two');
    await page.fill('#mb-steps .mb-step:nth-child(2) .mb-dc', '13');
    await page.click('#mb-build');
    // Compiled chain is ready for POST All to consume.
    const compiled = await page.evaluate(() => window.__mbCompiled());
    expect(compiled.map(q => q.id)).toEqual(['quest_post_1', 'quest_post_2']);
  }

  test('POST All: creates each step in arc order, then reports done', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await mbBuildTwoStep(page);
    const out = await page.evaluate(async () => {
      // Pretend a world is loaded; mock create to record calls + always succeed.
      WBAPI.loaded = true; WBAPI.questDb = {}; window.renderQuestList = () => {};
      const calls = [];
      WBAPI.quests.create = async (q) => { calls.push(q.id); WBAPI.questDb[q.id] = q; return { ok: true, id: q.id }; };
      await window.__mbPostAll();
      return { calls, html: document.getElementById('mb-result').innerHTML };
    });
    // Both steps posted, in order.
    expect(out.calls).toEqual(['quest_post_1', 'quest_post_2']);
    expect(out.html).toContain('quest_post_1');
    expect(out.html).toContain('quest_post_2');
    expect(out.html).toContain('posted');
    expect(out.html).toContain('Done — 2 posted');
    await expect(page.locator('#mb-result')).toBeVisible();
  });

  test('POST All: skips already-existing ids and stops on the first real error', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await mbBuildTwoStep(page);
    const out = await page.evaluate(async () => {
      WBAPI.loaded = true; window.renderQuestList = () => {};
      // Step 1 already exists → skipped (never reaches create). Step 2 errors → stop.
      WBAPI.questDb = { quest_post_1: { id: 'quest_post_1' } };
      const calls = [];
      WBAPI.quests.create = async (q) => {
        calls.push(q.id);
        return { ok: false, error: 'World-logic check failed', errors: ['node "BMA" does not exist'] };
      };
      await window.__mbPostAll();
      return { calls, html: document.getElementById('mb-result').innerHTML };
    });
    // create called ONLY for the non-existing step 2.
    expect(out.calls).toEqual(['quest_post_2']);
    expect(out.html).toContain('skipped (already exists)');
    expect(out.html).toContain('node "BMA" does not exist');
    expect(out.html).toContain('Stopped at step 2');
    // No "Done" summary on a failed run.
    expect(out.html).not.toContain('Done —');
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
