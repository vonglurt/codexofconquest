// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02et — Layer 44's world-progression notes had a writer and no reader.
//
// All six were unshifted into `S_story.log`, which is the movement breadcrumb array: six
// consumers read it as node-code strings, three minimap renders and the ending map among
// them, and nothing anywhere read `.text` off it. The design's own `.journal-entry.world`
// rule matched zero elements at every point in a run.
//
// The call was (b) of two, on the design's own words — "the player may miss these entirely
// if they don't check the journal. They will miss them." A storyMsg would make them
// unmissable announcements, which is the opposite of the restraint the subsystem is built
// on. So: their own array, and a panel the player opens by choice.

const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers.js');

test.describe('§DX-02et — the world notes have a reader', () => {

  test('a note lands in worldLog and never in the breadcrumb trail', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      S_story.log = ['LHR', 'TLL'];
      S_story.worldLog = [];
      S_story.day = 7;
      _pushWorldNote('A courier delivered something to BA. Pachelbel signed for it.');
      return {
        trail: S_story.log.slice(),
        world: S_story.worldLog.slice(),
        allStrings: S_story.log.every(e => typeof e === 'string'),
      };
    });
    expect(r.trail).toEqual(['LHR', 'TLL']);
    expect(r.allStrings, 'the trail is node codes and only node codes').toBe(true);
    expect(r.world).toEqual([{ text: 'A courier delivered something to BA. Pachelbel signed for it.', day: 7 }]);
  });

  test('every authored journalNote reaches worldLog when its event fires', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      const authored = WORLD_PROGRESSION_EVENTS.filter(e => e.journalNote).map(e => e.journalNote);
      S_story.worldLog = [];
      S_story.log = ['LHR'];
      // fire every event by hand, the way the milestone check would
      for (const ev of WORLD_PROGRESSION_EVENTS) if (ev.journalNote) _pushWorldNote(ev.journalNote);
      return { authored, logged: S_story.worldLog.map(n => n.text), trail: S_story.log.slice() };
    });
    expect(r.authored.length).toBeGreaterThan(0);
    // newest-first, so the array is the authored order reversed
    expect(r.logged).toEqual(r.authored.slice().reverse());
    expect(r.trail).toEqual(['LHR']);
  });

  test('the panel renders them under the design\'s own stranded CSS class', async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
    const before = await page.evaluate(() => document.querySelectorAll('.journal-entry').length);
    expect(before, 'nothing applies the class until there is a note').toBe(0);

    await page.evaluate(() => {
      S_story.day = 12;
      _pushWorldNote('Structural assessment submitted — Auros\'s name on the cover page.');
      S_story.day = 19;
      _pushWorldNote('The guard on the corner — Nivers. Eleven years.');
      storyRenderInventory();
    });
    const rows = page.locator('.journal-entry.world');
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toHaveText('Day 19 — The guard on the corner — Nivers. Eleven years.');
    await expect(rows.nth(1)).toContainText('Structural assessment submitted');
    await expect(page.locator('#inv-list')).toContainText('🌍 The World Without You');
  });

  test('the notes are passive — nothing speaks them into the message line', async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
    const r = await page.evaluate(() => {
      const el = document.getElementById('story-move-msg');
      const before = el ? el.textContent : '';
      _pushWorldNote('A letter arrived for Brynn at the inn. The seal is from the Heartwood district.');
      return { before, after: el ? el.textContent : '' };
    });
    expect(r.after).toBe(r.before);
  });

  test('a save that predates the split has its notes recovered, not dropped', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      // the shape a legacy save carries: the note inside the node-code trail
      S_story.log = [{ type:'world', text:'City records show a new internal affairs submission.', day: 5 }, 'LHR', 'TLL'];
      delete S_story.worldLog;
      _splitWorldNotesFromTrail();
      return { trail: S_story.log.slice(), world: S_story.worldLog.slice() };
    });
    expect(r.trail).toEqual(['LHR', 'TLL']);
    expect(r.world).toEqual([{ text: 'City records show a new internal affairs submission.', day: 5 }]);
  });

  test('the migration is idempotent and leaves a clean trail alone', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      S_story.log = ['LHR', 'TLL'];
      S_story.worldLog = [{ text: 'kept', day: 2 }];
      _splitWorldNotesFromTrail();
      _splitWorldNotesFromTrail();
      return { trail: S_story.log.slice(), world: S_story.worldLog.slice() };
    });
    expect(r.trail).toEqual(['LHR', 'TLL']);
    expect(r.world).toEqual([{ text: 'kept', day: 2 }]);
  });
});
