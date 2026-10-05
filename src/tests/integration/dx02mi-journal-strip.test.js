// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
const { test, expect } = require('@playwright/test');

// ── §DX-02mi — a journal find joins the arrival strip instead of replacing it ──
//
// storyRender shows one strip per arrival: loot, activations, quest lines. The journal
// check ran after it and called storyMsg itself, so on the first visit to 24 of the 31
// journal nodes that announce their entry in the strip, everything else that arrival
// said was replaced, Shard finds included. Each node is rendered twice from the same
// state: with its entry unread (the first visit) and with it already read (what the
// arrival says without the journal). The first must carry all of the second.

test.describe('§DX-02mi journal find and the arrival strip', () => {

  test('every strip-announced journal node keeps its arrival messages on the first visit', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const base = JSON.stringify(S_story);
      const out = [];
      for (const e of FROBERGER_JOURNAL) {
        if (e.readAloud || !NODE_MAP[e.nodeCode]) continue;
        const strip = read => {
          S_story = JSON.parse(base);
          S_story.journalEntriesRead = read ? [e.entryNum] : [];
          S_story.currentCode = e.nodeCode;
          storyRender(NODE_MAP[e.nodeCode]);
          return document.getElementById('story-move-msg').textContent;
        };
        const first = strip(false), later = strip(true);
        out.push({ code: e.nodeCode, keeps: first.includes(later.trim()),
                   found: first.includes('Entry ' + e.entryNum + ' found'), said: !!later.trim() });
      }
      S_story = JSON.parse(base);
      return out;
    });
    expect(r.length).toBe(31);
    expect(r.filter(x => x.said).length).toBeGreaterThanOrEqual(24);
    expect(r.filter(x => !x.keeps).map(x => x.code)).toEqual([]);
    expect(r.filter(x => !x.found).map(x => x.code)).toEqual([]);
  });

});
