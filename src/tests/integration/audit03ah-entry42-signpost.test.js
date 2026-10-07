// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
const { test, expect } = require('@playwright/test');

// ── §AUDIT-03ah — the Entry 42 page says what it is waiting for ──
//
// On a qualifying NG+ arrival at LHR the Entry 42 panel needs three of the Birka six at
// favor >= 2. Below that the page renders as a signpost naming the requirement and the
// count, with nothing to write in; at three it is the writable page.

test.describe('§AUDIT-03ah Entry 42 at LHR', () => {

  test('two Dear Friends see the signpost, three see the page', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const base = JSON.stringify(S_story);
      const arrive = (dear, ng = 1) => {
        S_story = JSON.parse(base);
        S_story.ngPlusRun = ng;
        S_story.priorQuestMinusOne = true;
        S_story.entry42Written = false;
        S_story.npcFavorability = {};
        ['yael', 'brynn', 'quill', 'pachelbel', 'crov', 'auros'].slice(0, dear)
          .forEach(k => { S_story.npcFavorability[k] = 2; });
        S_story.currentCode = 'LHR';
        storyRender(NODE_MAP.LHR);
        const el = document.getElementById('story-entry42-prompt');
        return { shown: !!el, text: el ? el.textContent : '',
                 writable: !!document.getElementById('entry42-write-btn') };
      };
      const out = { two: arrive(2), three: arrive(3), firstRun: arrive(2, 0) };
      S_story = JSON.parse(base);
      return out;
    });
    expect(r.two.shown).toBe(true);
    expect(r.two.writable).toBe(false);
    expect(r.two.text).toContain('Dear Friend');
    expect(r.two.text).toContain('You have 2.');
    expect(r.three.shown).toBe(true);
    expect(r.three.writable).toBe(true);
    expect(r.firstRun.shown).toBe(false);
  });

});
