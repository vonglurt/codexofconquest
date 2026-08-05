'use strict';
// §VM-01-G3 — Class-C migration: the legacy storyRender quest-activation blocks (NG+/WM/TL/VS/cat)
// are now real `gate:` + `activateNode` quest data driven by storyCheckQuests, with a new
// `onActivate` field for announcement semantics (absent → '📋 title' strip line · null → silent ·
// {msg, delayMs} → the arc's bespoke delayed narration). Also pins the two node revivals
// (NODE_MAP.VS/TL gained their missing `code` fields — the whole VS arc and the TL Vonn path
// were dead) and the board's in-sequence promise over the newly-real gates.
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

async function loadAt(page, node, extra = {}) {
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await seedAndLoad(page, Object.assign({ currentCode: node, checkpointNode: node, visited: { [node]: true } }, extra));
  await dismissContinue(page);
  return pageErrors;
}
const quests = page => page.evaluate(() => S_story.quests);

test.describe('§VM-01-G3 — declarative per-arc quest activation', () => {

  test('cat arc stages: fresh CDG offers ONLY cat_01, with Jimmy\'s bespoke onActivate narration', async ({ page }) => {
    const errs = await loadAt(page, 'CDG');
    await page.waitForTimeout(800); // Jimmy's delayed onActivate (500ms)
    const q = await quests(page);
    expect(q.quest_cat_01).toBe('active');
    for (const id of ['quest_cat_02', 'quest_cat_03', 'quest_cat_04', 'quest_cat_05', 'quest_cat_06', 'quest_cat_void'])
      expect(q[id], id + ' must not pre-activate').toBeUndefined();
    await expect(page.locator('#story-move-msg')).toContainText('Listen. LISTEN.');
    expect(errs).toEqual([]);
  });

  test('cat chain links: 01→02, 02→{03,05,void} (Sandy speaks once for the trio), 03→04, 04+05→06', async ({ page }) => {
    await loadAt(page, 'CDG', { quests: { quest_cat_01: 'complete' } });
    let q = await quests(page);
    expect(q.quest_cat_02).toBe('active');
    expect(q.quest_cat_03).toBeUndefined();

    await loadAt(page, 'CDG', { quests: { quest_cat_01: 'complete', quest_cat_02: 'complete' } });
    await page.waitForTimeout(900);
    q = await quests(page);
    expect(q.quest_cat_03).toBe('active');
    expect(q.quest_cat_05).toBe('active');
    expect(q.quest_cat_void).toBe('active');
    expect(q.quest_cat_04).toBeUndefined();
    expect(q.quest_cat_06).toBeUndefined();
    await expect(page.locator('#story-move-msg')).toContainText('Sandy "Scratchpad" Mewlino');

    await loadAt(page, 'CDG', { quests: { quest_cat_01: 'complete', quest_cat_02: 'complete', quest_cat_03: 'complete', quest_cat_05: 'active', quest_cat_void: 'active' } });
    q = await quests(page);
    expect(q.quest_cat_04).toBe('active');   // silent link (onActivate:null)
    expect(q.quest_cat_06).toBeUndefined();  // needs 04 AND 05 complete

    await loadAt(page, 'CDG', { quests: { quest_cat_01: 'complete', quest_cat_02: 'complete', quest_cat_03: 'complete', quest_cat_04: 'complete', quest_cat_05: 'complete', quest_cat_void: 'active' } });
    await page.waitForTimeout(800);
    q = await quests(page);
    expect(q.quest_cat_06).toBe('active');
    await expect(page.locator('#story-move-msg')).toContainText('Tommy No-Ears DeVito');
  });

  test('NG+ remembrance: gated on ngPlusRun (+ priorQuestMinusOne for ng_02), silent, board-exempt', async ({ page }) => {
    await loadAt(page, 'LHR');
    let q = await quests(page);
    for (const id of ['quest_ng_01', 'quest_ng_02', 'quest_ng_03']) expect(q[id], id + ' on a first run').toBeUndefined();

    await loadAt(page, 'LHR', { ngPlusRun: 1 });
    q = await quests(page);
    expect(q.quest_ng_01).toBe('active');
    expect(q.quest_ng_03).toBe('active');
    expect(q.quest_ng_02).toBeUndefined();

    const r = await page.evaluate(() => {
      S_story.priorQuestMinusOne = true;
      delete S_story.quests.quest_ng_02;
      storyRender(NODE_MAP[S_story.currentCode]);
      // boardExempt: even with every gate satisfied, the remembrance set never posts as a bounty
      const host = Object.values(NODE_MAP).find(n => _boardHost(n) && (n.code || '') !== 'LHR');
      return { ng02: S_story.quests.quest_ng_02,
               postable: ['quest_ng_01', 'quest_ng_02', 'quest_ng_03'].map(id => _bountyPostable(QUEST_DB[id], host)) };
    });
    expect(r.ng02).toBe('active');
    expect(r.postable).toEqual([false, false, false]);
  });

  test('WM arc: NUE offers wm_01 with Isolde\'s line; wm_02/03/04 gate on the arc\'s own milestones', async ({ page }) => {
    await loadAt(page, 'NUE');
    await page.waitForTimeout(800);
    let q = await quests(page);
    expect(q.quest_wm_01).toBe('active');
    for (const id of ['quest_wm_02', 'quest_wm_03', 'quest_wm_04']) expect(q[id]).toBeUndefined();
    await expect(page.locator('#story-move-msg')).toContainText('Everyone who comes here lately is asking about Froberger');

    await loadAt(page, 'NUE', { quests: { quest_wm_01: 'complete' }, wmArchiveComplete: true });
    q = await quests(page);
    expect(q.quest_wm_02).toBe('active');
    expect(q.quest_wm_03).toBe('active');
    expect(q.quest_wm_04).toBeUndefined();

    // (wmBenediktCircleComplete is ALSO wm_03's completion flag, so seeding it both activates
    // wm_04 and completes wm_03 in the same pass — the arc's own forward motion, not a bug.)
    await loadAt(page, 'NUE', { quests: { quest_wm_01: 'complete' }, wmArchiveComplete: true, wmBenediktCircleComplete: true });
    q = await quests(page);
    expect(q.quest_wm_03).toBe('complete');
    expect(q.quest_wm_04).toBe('active');
  });

  test('VS revival: the arc is alive for the first time — vs_01 activates (silently), vs_02/03/warden stay gated, Solvak\'s button renders', async ({ page }) => {
    const errs = await loadAt(page, 'VS');
    const q = await quests(page);
    expect(q.quest_vs_01).toBe('active');          // was dead: NODE_MAP.VS had no `code` field
    expect(q.quest_vs_02).toBeUndefined();          // gate: vsDebtProbed
    expect(q.quest_vs_03).toBeUndefined();          // gate: vsWeaponsFound
    expect(q.quest_vs_warden).toBeUndefined();      // hook-driven; deduped back to activateNode:null
    const btns = await page.evaluate(() => Array.from(document.querySelectorAll('.inv-use-btn')).map(b => b.textContent));
    expect(btns.some(t => t.includes('Speak with Solvak')), 'Solvak button renders for the first time ever').toBe(true);
    expect(btns.some(t => t.includes('Deliver the Hollow Hands Seal')), 'pay button stays gated').toBe(false);
    expect(errs).toEqual([]);
  });

  test('TL arc: tl_01 activates silently at STN; the revived TL node renders Vonn; tl_03 completes via its own chain (no double-pay)', async ({ page }) => {
    await loadAt(page, 'STN');
    let q = await quests(page);
    expect(q.quest_tl_01).toBe('active');
    const strip = await page.locator('#story-move-msg').textContent();
    expect(strip.includes('Rennau: The Ledger'), 'tl_01 activation is silent (onActivate:null)').toBe(false);

    // The TL node was dead (no `code` field) — Vonn's button, tl_02's only completion path, now renders
    await loadAt(page, 'TL', { tlLedgerRead: true, quests: { quest_tl_01: 'complete', quest_tl_02: 'active' } });
    const vonn = await page.evaluate(() => Array.from(document.querySelectorAll('.inv-use-btn')).map(b => b.textContent));
    expect(vonn.some(t => t.includes('Speak with Adjutant Vonn')), 'Vonn renders for the first time ever').toBe(true);

    // Ori pays out through quest_tl_03's onComplete exactly once (the button's direct grants are gone).
    // §VM-01-G4c: Ori is a NODE_VERBS entry now, and the verb driver RE-RENDERS when its chain ends,
    // so the completion loop runs on the click itself rather than on the next render. That is a
    // timing change, not a payout change — this test's property is "exactly once, from the quest
    // chain", so it is asserted against a second render instead of against the click.
    const r = await page.evaluate(async () => {
      S_story.tlLedgerRead = true;
      S_story.quests = { quest_tl_01: 'complete', quest_tl_02: 'complete', quest_tl_03: 'active' };
      S_story.currentCode = 'STN';
      storyRender(NODE_MAP.STN);
      const ori = Array.from(document.querySelectorAll('.inv-use-btn')).find(b => b.textContent.includes('Speak with Ori'));
      if (!ori) return { oriShown: false };
      const goldBefore = S_story.gold;
      ori.click();
      const goldAfterClick = S_story.gold;
      storyRender(NODE_MAP.STN);              // a further render must add nothing
      return { oriShown: true, flag: S_story.tlMissingShipSolved,
               paidOnClick: goldAfterClick === goldBefore + 300,
               status: S_story.quests.quest_tl_03,
               paidOnce: S_story.gold === goldBefore + 300,
               account: S_story.inventory.filter(i => i.name === "Ori's Account").length };
    });
    expect(r.oriShown).toBe(true);
    expect(r.flag).toBe(true);
    expect(r.paidOnClick, 'the completion beat lands in the same beat as the verb (§VM-01-G4c)').toBe(true);
    expect(r.status).toBe('complete');
    expect(r.paidOnce, '+300gp exactly once, from the quest chain — a further render adds nothing').toBe(true);
    expect(r.account).toBe(1);
  });

  test('the board keeps its in-sequence promise: chain heads post, later chapters do not (until earned)', async ({ page }) => {
    await loadAt(page, 'BOO');
    const r = await page.evaluate(() => {
      const host = Object.values(NODE_MAP).find(n => _boardHost(n) && !['STN', 'NUE', 'VS', 'CDG'].includes(n.code || ''));
      const p = id => _bountyPostable(QUEST_DB[id], host);
      const fresh = { heads: ['quest_tl_01', 'quest_cat_01', 'quest_wm_01', 'quest_vs_01'].map(p),
                      chapters: ['quest_tl_02', 'quest_tl_03', 'quest_cat_02', 'quest_cat_06', 'quest_vs_02', 'quest_vs_03'].map(p) };
      S_story.tlLedgerRead = true;            // earn chapter 2 the arc's way
      const tl02Earned = p('quest_tl_02');
      return { fresh, tl02Earned };
    });
    expect(r.fresh.heads).toEqual([true, true, true, true]);
    expect(r.fresh.chapters).toEqual([false, false, false, false, false, false]);
    expect(r.tl02Earned).toBe(true);
  });

  test('source guard: storyRender carries no legacy activation writes for the migrated set; onActivate corpus is exactly the migrated 18', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const src = storyRender.toString();
      const writes = ['quest_ng_01', 'quest_ng_02', 'quest_ng_03', 'quest_wm_01', 'quest_wm_02', 'quest_wm_03', 'quest_wm_04',
        'quest_tl_01', 'quest_tl_02', 'quest_cat_01', 'quest_cat_02', 'quest_cat_03', 'quest_cat_04', 'quest_cat_05',
        'quest_cat_06', 'quest_cat_void', 'quest_vs_01'].filter(id => new RegExp("quests\\['" + id + "'\\] = 'active'").test(src));
      const carriers = Object.values(QUEST_DB).filter(q => q && 'onActivate' in q).map(q => q.id).sort();
      const invalid = carriers.filter(id => !validateQuest(QUEST_DB[id]).valid);
      return { writes, carriers, invalid };
    });
    expect(r.writes, 'no storyRender stanza still force-activates a migrated quest').toEqual([]);
    expect(r.carriers).toEqual(['quest_cat_01', 'quest_cat_02', 'quest_cat_03', 'quest_cat_04', 'quest_cat_05', 'quest_cat_06',
      'quest_cat_void', 'quest_ng_01', 'quest_ng_02', 'quest_ng_03', 'quest_tl_01', 'quest_tl_02', 'quest_tl_03',
      'quest_vs_01', 'quest_vs_02', 'quest_vs_03', 'quest_wm_01', 'quest_wm_02', 'quest_wm_03', 'quest_wm_04']);
    expect(r.invalid).toEqual([]);
  });
});
