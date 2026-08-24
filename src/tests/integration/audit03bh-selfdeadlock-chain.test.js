// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
// §AUDIT-03bh — a quest whose onComplete sets the flag its own completion waits on can
// never complete. The Muffat → Signal → Antecedent chain carried the shape three deep,
// stranding four quests. Each completion is now the act its own hint names — arrival at
// its waypoint (`atNode`) — leaving the onComplete flag_write as the flag's sole writer.
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
const flag = (page, f) => page.evaluate(n => S_story[n], f);

test.describe('§AUDIT-03bh — the self-deadlocked chain completes', () => {

  test('the four repaired completions are atNode, not the flag their own onComplete sets', async ({ page }) => {
    await loadAt(page, 'LCY');
    const shape = await page.evaluate(() => ['quest_muffat_02', 'quest_muffat_03', 'quest_signal_01']
      .map(id => ({ id, completion: QUEST_DB[id].completion,
        writes: QUEST_DB[id].onComplete.filter(b => b.kind === 'flag_write').flatMap(b => b.set || []) })));
    for (const s of shape) {
      expect(s.completion.atNode, s.id + ' completes on arrival at its waypoint').toBeTruthy();
      expect(s.completion.flags, s.id + ' no longer waits on a flag').toBeUndefined();
      expect(s.writes.length, s.id + ' still writes its flag for downstream gates').toBeGreaterThan(0);
    }
  });

  test('muffat_02 activates at LCY and completes at DUS, setting muffatManifestRead', async ({ page }) => {
    await loadAt(page, 'LCY', { muffatBerthReached: true });
    expect((await quests(page)).quest_muffat_02).toBe('active');
    expect(await flag(page, 'muffatManifestRead'), 'not completable at the node it activates on').toBeFalsy();

    await loadAt(page, 'DUS', { muffatBerthReached: true, quests: { quest_muffat_02: 'active' } });
    expect((await quests(page)).quest_muffat_02).toBe('complete');
    expect(await flag(page, 'muffatManifestRead')).toBe(true);
  });

  test('muffat_03 completes at SVO, setting station7LogRead', async ({ page }) => {
    await loadAt(page, 'SVO', { muffatManifestRead: true, quests: { quest_muffat_03: 'active' } });
    expect((await quests(page)).quest_muffat_03).toBe('complete');
    expect(await flag(page, 'station7LogRead')).toBe(true);
  });

  test('signal_01 completes at HKG, setting suppressorLogRead', async ({ page }) => {
    await loadAt(page, 'HKG', { station7LogRead: true, quests: { quest_signal_01: 'active' } });
    expect((await quests(page)).quest_signal_01).toBe('complete');
    expect(await flag(page, 'suppressorLogRead')).toBe(true);
  });

  test('THE CASCADE: quest_antecedent_01 becomes listable once the chain has run', async ({ page }) => {
    await loadAt(page, 'LCY');
    expect(await page.evaluate(() => QuestRuntime.canActivate('quest_antecedent_01')),
      'unreachable before the chain').toBe(false);

    await loadAt(page, 'HKG', { station7LogRead: true, quests: { quest_signal_01: 'active' } });
    expect(await page.evaluate(() => QuestRuntime.canActivate('quest_antecedent_01')),
      'listable after signal_01 completes — the four stranded quests are reachable').toBe(true);
  });
});
