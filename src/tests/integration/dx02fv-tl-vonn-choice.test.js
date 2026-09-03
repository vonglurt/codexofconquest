// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02fv — TL Vonn, the `choice` opcode's second consumer surface.
//
// `lab-report-vm01g4-per-verb.md` §9.3 named this beat "the one true multi-step case — the
// pilot for `choice`" and then routed it to a slice that never came, so nineteen days and
// eleven slices after the opcode got its host end it still had one consumer: the two
// dus-kern-sable entries at DUS. One consumer is not evidence that a grammar works.
//
// The beat is a two-step at a bare button: Vonn answers, and the answer is what you decide
// against. It rides in the choice's PROMPT rather than a narrative bit ahead of it, because
// narrative buffers into the driver's message join and would land after the pick.

const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers.js');

const AT_TL = { currentCode: 'TL', checkpointNode: 'TL', visited: {}, rngState: 424242 };

async function atTL(page, ov = {}) {
  await seedAndLoad(page, Object.assign({}, AT_TL, ov));
  await dismissContinue(page);
}

test.describe('§DX-02fv — the Vonn manifest beat is data', () => {

  test('`choice` has two consumer surfaces now, not one', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      const bitsOf = (v) => typeof v.bits === 'function' ? [] : (v.bits || []);
      const holders = NODE_VERBS.filter(v => bitsOf(v).some(b => b.kind === 'choice'));
      return {
        entries: holders.map(v => v.id).sort(),
        groups: [...new Set(holders.map(v => v.group))].sort(),
      };
    });
    expect(r.groups).toEqual(['dus-kern-sable', 'tl-vonn']);
    expect(r.entries).toEqual(['dus-kern-sable-first', 'dus-kern-sable-followup', 'tl-vonn-manifest']);
  });

  test('the button appears only with the ledger read and the quest active', async ({ page }) => {
    await atTL(page, { tlLedgerRead: false, quests: { quest_tl_02: 'active' } });
    const gate = await page.evaluate(() => {
      const v = NODE_VERBS.find(x => x.id === 'tl-vonn-manifest');
      const st = (o) => !!v.when(Object.assign({ quests: {} }, o));
      return {
        neither: st({}),
        ledgerOnly: st({ tlLedgerRead: true }),
        questOnly: st({ quests: { quest_tl_02: 'active' } }),
        both: st({ tlLedgerRead: true, quests: { quest_tl_02: 'active' } }),
        done: st({ tlLedgerRead: true, quests: { quest_tl_02: 'done' } }),
        // the beat guards on its OWN outcome, because the chain ends in a re-render that
        // draws verbs before storyCheckQuests marks the quest complete
        decided: st({ tlLedgerRead: true, quests: { quest_tl_02: 'active' }, tlEmbargoChallenged: true }),
      };
    });
    expect(gate).toEqual({ neither: false, ledgerOnly: false, questOnly: false, both: true, done: false, decided: false });
    await expect(page.locator('#verb-tl-vonn-manifest')).toHaveCount(0);
  });

  test('reporting the manifest pays 150gp and records the challenge', async ({ page }) => {
    await atTL(page, { tlLedgerRead: true, quests: { quest_tl_02: 'active' }, gold: 40 });
    await expect(page.locator('#verb-tl-vonn-manifest')).toHaveText('⚖️ Speak with Adjutant Vonn.');
    await page.locator('#verb-tl-vonn-manifest').click();

    // Vonn's answer is the prompt, so it is on screen WHILE the options are.
    await expect(page.locator('#verb-tl-vonn-manifest')).toContainText('Emergency Trade Protocol 7');
    await expect(page.locator('#verb-tl-vonn-manifest')).toContainText('It will be noted.');
    await expect(page.locator('#verb-tl-vonn-manifest button')).toHaveCount(2);
    // nothing is written on the way in
    expect(await page.evaluate(() => [S_story.gold, !!S_story.tlEmbargoChallenged])).toEqual([40, false]);

    await page.locator('#verb-tl-vonn-manifest button', { hasText: 'Report to Birka contacts' }).click();

    const after = await page.evaluate(() => ({
      gold: S_story.gold,
      challenged: !!S_story.tlEmbargoChallenged,
      dismissed: !!S_story.tlEmbargoDismissed,
      panelGone: !document.getElementById('verb-tl-vonn-manifest'),
      msg: (document.getElementById('story-move-msg') || {}).textContent || '',
      saved: JSON.parse(localStorage.getItem('coc_autosave') || '{}').tlEmbargoChallenged,
    }));
    expect(after.gold).toBe(190);
    expect(after.challenged).toBe(true);
    expect(after.dismissed, 'the branch not picked never runs').toBe(false);
    expect(after.panelGone, 'the beat does not redraw itself into the same render').toBe(true);
    expect(after.msg).toContain('+150gp');
    expect(after.saved, "storyRender's terminal storyAutoSave persists it").toBe(true);
  });

  test('leaving it writes the other flag, costs nothing, and pays nothing', async ({ page }) => {
    await atTL(page, { tlLedgerRead: true, quests: { quest_tl_02: 'active' }, gold: 40 });
    await page.locator('#verb-tl-vonn-manifest').click();
    await page.locator('#verb-tl-vonn-manifest button', { hasText: 'Leave it' }).click();
    const after = await page.evaluate(() => ({
      gold: S_story.gold,
      challenged: !!S_story.tlEmbargoChallenged,
      dismissed: !!S_story.tlEmbargoDismissed,
      msg: (document.getElementById('story-move-msg') || {}).textContent || '',
    }));
    expect(after.gold).toBe(40);
    expect(after.challenged).toBe(false);
    expect(after.dismissed).toBe(true);
    expect(after.msg).toContain('The harbor stays closed.');
  });

  test('walking away mid-choice writes nothing — the pick is where state is applied', async ({ page }) => {
    await atTL(page, { tlLedgerRead: true, quests: { quest_tl_02: 'active' }, gold: 40 });
    await page.locator('#verb-tl-vonn-manifest').click();
    await expect(page.locator('#verb-tl-vonn-manifest button')).toHaveCount(2);
    const after = await page.evaluate(() => {
      storyRender(NODE_MAP[S_story.currentCode]);
      return { gold: S_story.gold, challenged: !!S_story.tlEmbargoChallenged, dismissed: !!S_story.tlEmbargoDismissed };
    });
    expect(after).toEqual({ gold: 40, challenged: false, dismissed: false });
  });
});
