// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §AUDIT-03ad — the §WISDOM-01 arc advertised a DC the engine never rolled, and
// staged its keystone last while claiming the fragments were independent.
//
// Two defects in one block, born together at `e339aeb` and live for 76 days.
//
//   1. Roen's portfolio string enumerates all six Ardley fragments, and its other
//      FIVE entries are exact against the shipped bits — W1 WIS 13, W2 WIS 12,
//      W3 INT 11, W4 INT 12, W5 WIS 12. Then it says "W6 here (WIS 14 or combat)"
//      and `quest_wis_06` shipped `type:'side'` with `bits:[]`: the accept button
//      granted the flag, a Shadow Shard and +350 XP with no d20 anywhere in the
//      block. A string that is correct five times before it lies once is the most
//      credible kind of wrong, which is what made this worth a pin.
//   2. The quest gates on `visbyUnderground` — so it lists the moment the player
//      descends — but the buttons it points at rendered only behind
//      `_allFive && !_p6`. The arc's own design thesis is that the laws are
//      independent and can be taken in any order; that was true of W1–W5 and
//      silently false of W6, the one the report calls the rhetorical keystone.
//
// Both closed the way the row preferred: W6 is a real `skill_check` quest resolved
// through `_resolveQuestUQF` like its five siblings, and the shadow choice renders
// whenever W6 is unheld. This pins the property the string asserts — every DC named
// in the portfolio is a DC the engine rolls.

const { test, expect } = require('@playwright/test');

const PORTFOLIO_DCS = [
  ['quest_wis_01', 'WIS', 13],
  ['quest_wis_02', 'WIS', 12],
  ['quest_wis_03', 'INT', 11],
  ['quest_wis_04', 'INT', 12],
  ['quest_wis_05', 'WIS', 12],
  ['quest_wis_06', 'WIS', 14],
];

test.describe('§AUDIT-03ad — every DC the portfolio names is a DC the engine rolls', () => {

  test('all six fragments are skill_check quests whose bit matches the advertised stat and DC', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate((ids) => ids.map(([id]) => {
      const q = QUEST_DB[id];
      const sc = (q.bits || []).find(b => b.kind === 'skill_check');
      return { id, type: q.type, valid: validateQuest(q).valid, stat: sc && sc.stat, dc: sc && sc.dc };
    }), PORTFOLIO_DCS);
    for (const [id, stat, dc] of PORTFOLIO_DCS) {
      const got = r.find(x => x.id === id);
      expect(got, id).toMatchObject({ type: 'skill_check', valid: true, stat, dc });
    }
  });

  test('the portfolio string states exactly those six DCs', async ({ page }) => {
    await page.goto('/play.html');
    const said = await page.evaluate(() => {
      S_story.active = true;
      S_story.personalLegendComplete = true;
      S_story.wisHookReceived = true;
      S_story.wisPage6_shadow = true;   // the tally branch
      storyRender(NODE_MAP['VS']);
      return document.getElementById('story-wis-vs').textContent;
    });
    for (const dc of [13, 12, 11, 12, 12, 14]) expect(said).toContain(String(dc));
    expect(said).toContain('W6 here (WIS 14 or combat)');
  });

  test('W6 renders out of order — the fragments are independent, as the arc says', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      S_story.active = true;
      S_story.personalLegendComplete = true;
      S_story.wisHookReceived = true;
      for (const f of ['wisPage1_masks','wisPage2_aggression','wisPage3_thumbscrew','wisPage4_sight','wisPage5_form','wisPage6_shadow'])
        S_story[f] = false;
      storyRender(NODE_MAP['VS']);
      const div = document.getElementById('story-wis-vs');
      return { buttons: [...div.querySelectorAll('button')].map(b => b.textContent), text: div.textContent };
    });
    expect(r.buttons.some(b => b.includes('Accept the reflection'))).toBe(true);
    expect(r.buttons.some(b => b.includes('fight the shadow construct'))).toBe(true);
    expect(r.text).toContain('0 of the five scattered sections found');
    expect(r.text).toContain('DC 14');
  });

  test('accepting rolls the check — a pass grants the flag, the shard and the XP', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      S_story.active = true;
      S_story.personalLegendComplete = true;
      S_story.wisHookReceived = true;
      S_story.wisPage6_shadow = false;
      // The stream is seeded, not stubbed, so +11 against DC 14 still misses on a
      // natural 1 or 2. Pin the die: this is a test of the PASS payload, not the dice.
      QuestRuntime._rollSkill = () => ({ d20:20, mod:5, prof:6, total:31, iodineBonus:0, lmAll:0 });
      S_story.xp = 0; S_story.inventory = []; S_story.knowledge = [];
      S_story.quests = { quest_wis_06: 'active' };
      _resolveQuestUQF('quest_wis_06');
      return {
        flag: S_story.wisPage6_shadow,
        xp: S_story.xp,
        shard: S_story.inventory.some(i => i.name === 'Shadow Shard'),
        knowledge: S_story.knowledge.some(k => k.startsWith('Ardley W6')),
        state: S_story.quests.quest_wis_06,
        card: document.getElementById('story-hcard-container').textContent,
      };
    });
    expect(r.flag).toBe(true);
    expect(r.xp).toBe(350);
    expect(r.shard).toBe(true);
    expect(r.knowledge).toBe(true);
    expect(r.state).toBe('done');
    // The roll is visible, and it is the roll the string advertises.
    expect(r.card).toContain('vs DC 14');
    expect(r.card).toContain('PASS');
  });

  test('a failed accept leaves the fight route open — the quest is not marked failed', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      S_story.active = true;
      S_story.personalLegendComplete = true;
      S_story.wisHookReceived = true;
      S_story.wisPage6_shadow = false;
      QuestRuntime._rollSkill = () => ({ d20:1, mod:-5, prof:2, total:-2, iodineBonus:0, lmAll:0 });
      S_story.xp = 0; S_story.inventory = []; S_story.knowledge = [];
      S_story.quests = { quest_wis_06: 'active' };
      _resolveQuestUQF('quest_wis_06');
      return { flag: S_story.wisPage6_shadow, shard: S_story.inventory.length,
               state: S_story.quests.quest_wis_06, retryable: QUEST_DB.quest_wis_06.retryable };
    });
    expect(r.flag).toBe(false);
    expect(r.shard).toBe(0);
    // Not 'failed' — the construct in the mirror room is still standing, and
    // `completion.battles:['VS_SHADOW']` must still be able to close this quest.
    expect(r.state).not.toBe('failed');
    expect(r.retryable).toBe(true);
  });

  test('the fight route still completes it, unrolled', async ({ page }) => {
    await page.goto('/play.html');
    const c = await page.evaluate(() => {
      const q = QUEST_DB.quest_wis_06;
      return { any: q.completion.flagsAny, battles: q.completion.battles };
    });
    expect(c.any).toEqual(['wisPage6_shadow']);
    expect(c.battles).toEqual(['VS_SHADOW']);
  });
});
