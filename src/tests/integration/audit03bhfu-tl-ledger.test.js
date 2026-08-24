// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
// §AUDIT-03bh-FU — quest_tl_01 completes on the harbor-board search its hint names.
// The search sets `tlManifestFound`; the quest's onComplete is the sole grantor of both
// The Harrow Manifest and `tlLedgerRead`, so the item is granted exactly once and every
// downstream reader of tlLedgerRead still sees a flag with a real writer.
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

async function loadAt(page, node, extra = {}) {
  await seedAndLoad(page, Object.assign({ currentCode: node, checkpointNode: node, visited: { [node]: true } }, extra));
  await dismissContinue(page);
}
const quests = page => page.evaluate(() => S_story.quests);
const manifests = page => page.evaluate(() =>
  (S_story.inventory || []).filter(i => i.name === 'The Harrow Manifest').length);

test.describe('§AUDIT-03bh-FU — Rennau: The Ledger can be finished', () => {

  test('completion is the search flag, and the onComplete flag_write is tlLedgerRead alone', async ({ page }) => {
    await loadAt(page, 'STN');
    const q = await page.evaluate(() => ({
      completion: QUEST_DB.quest_tl_01.completion,
      writes: QUEST_DB.quest_tl_01.onComplete.filter(b => b.kind === 'flag_write').flatMap(b => b.set || []),
    }));
    expect(q.completion.flags).toEqual(['tlManifestFound']);
    expect(q.writes).toContain('tlLedgerRead');
    expect(q.writes, 'the quest never writes the flag it waits on').not.toContain('tlManifestFound');
  });

  test('tl_01 activates at STN and does NOT complete in the render it activates', async ({ page }) => {
    await loadAt(page, 'STN');
    expect((await quests(page)).quest_tl_01).toBe('active');
    expect(await page.evaluate(() => !!S_story.tlLedgerRead), 'no payout for walking through the door').toBe(false);
    expect(await manifests(page)).toBe(0);
  });

  test('the Harbor Board search sets tlManifestFound and grants no item of its own', async ({ page }) => {
    await loadAt(page, 'STN');
    const btn = page.getByRole('button', { name: /Harbor Board/ });
    await expect(btn).toBeVisible();
    await btn.click();
    expect(await page.evaluate(() => !!S_story.tlManifestFound)).toBe(true);
    expect(await manifests(page), 'the search finds the record; the quest hands over the manifest').toBe(0);
  });

  test('with the search done, tl_01 completes and grants the manifest exactly once', async ({ page }) => {
    await loadAt(page, 'STN', { tlManifestFound: true, quests: { quest_tl_01: 'active' } });
    expect((await quests(page)).quest_tl_01).toBe('complete');
    expect(await page.evaluate(() => !!S_story.tlLedgerRead)).toBe(true);
    expect(await manifests(page), 'one grantor, one copy').toBe(1);
    await expect(page.getByRole('button', { name: /Harbor Board/ }), 'the search is spent').toHaveCount(0);
  });

  test('THE CASCADE: quest_tl_02 becomes listable once the ledger is read', async ({ page }) => {
    await loadAt(page, 'STN');
    expect(await page.evaluate(() => QuestRuntime.canActivate('quest_tl_02')),
      'unreachable while tl_01 can never finish').toBe(false);

    await loadAt(page, 'STN', { tlManifestFound: true, quests: { quest_tl_01: 'active' } });
    expect(await page.evaluate(() => QuestRuntime.canActivate('quest_tl_02')),
      'the Tilbury arc continues past its first step').toBe(true);
  });
});
