// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
/**
 * §DX-02gd — the item vocabulary has one description field per surface, and
 * `description` is not one of them.
 *
 * `storyRenderInventory` reads `item.desc` for every tooltip surface and
 * `it.readText` for the 📖 Read button. Nothing in the file reads
 * `.description`, so any string authored under that key resolves to an empty
 * tooltip or to the `(No text found.)` literal.
 *
 * The assertions are the fence: a source census that no item literal spells the
 * key `description`, a runtime check that `_applyItemChain`'s allow-list drops
 * it, and a per-item check that every authored string reaches the surface its
 * own `type` reads.
 */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

const PLAY_HTML = path.join(__dirname, '..', '..', '..', 'play.html');

// Items whose authored string is prose the player reads: `type:'readable'`
// renders through `readText`. Everything else renders through `desc`.
const READABLES = ["The Constructor's Log", 'The Harrow Manifest', "Ori's Account"];

test.describe('§DX-02gd — one description key per item surface', () => {

  test('no item literal in play.html spells the key `description`', () => {
    const src = fs.readFileSync(PLAY_HTML, 'utf8');
    const lines = src.split('\n');
    const hits = [];
    lines.forEach((line, i) => {
      const n = (line.match(/description:/g) || []).length;
      for (let k = 0; k < n; k++) hits.push({ line: i + 1, text: line });
    });
    // The only survivors are the word inside two quest `hint` strings.
    expect(hits.map(h => h.line)).toHaveLength(2);
    hits.forEach(h => expect(h.text).toContain('hint:'));
  });

  test('nothing reads `.description`, so nothing may write it', () => {
    const src = fs.readFileSync(PLAY_HTML, 'utf8');
    expect(src.match(/\.description\b/g) || []).toHaveLength(0);
  });

  test('_applyItemChain drops `description` and passes `desc` through', async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
    const out = await page.evaluate(() => {
      S_story.inventory = [];
      _applyItemChain({ itemChain: [{ action: 'grant', name: 'Vocab Probe', icon: '📦',
        type: 'misc', sell: 0, desc: 'live key', description: 'dead key' }] });
      const it = S_story.inventory[0];
      return { desc: it.desc, hasDescription: 'description' in it };
    });
    expect(out.desc).toBe('live key');
    expect(out.hasDescription).toBe(false);
  });

  test('every declarative grant reaches the surface its type reads', async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
    const out = await page.evaluate((readables) => {
      S_story.inventory = [];
      ['quest_wm_02', 'quest_wm_03', 'quest_wm_04', 'quest_va_02']
        .forEach(id => _applyItemChain(QUEST_DB[id]));
      // The reward ladder spreads the whole literal — Old Tuna Account Book.
      const reward = (QUEST_DB.quest_la_riva_02.onComplete || []).find(b => b.kind === 'reward');
      (reward.items || []).forEach(i => S_story.inventory.push({ ...i }));
      return S_story.inventory.map(i => ({
        name: i.name,
        surface: readables.includes(i.name) ? (i.readText || '') : (i.desc || ''),
        hasDescription: 'description' in i,
      }));
    }, READABLES);

    expect(out.map(i => i.name)).toEqual([
      "Froberger's Field Notes", "Scholar Kings' History", "Benedikt's Annotated Copy",
      "The Constructor's Log", 'Antecedent Seal', 'Old Tuna Account Book',
    ]);
    out.forEach(i => {
      expect(i.hasDescription, i.name).toBe(false);
      expect(i.surface.length, i.name).toBeGreaterThan(0);
    });
  });

  test('the two runtime-built readables carry their prose in readText', async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
    const out = await page.evaluate(() => {
      S_story.inventory = [];
      const run = id => (QUEST_DB[id].onComplete || [])
        .filter(b => b.kind === '_legacy_fn').forEach(b => b.fn(S_story));
      run('quest_tl_01');   // The Harrow Manifest
      run('quest_tl_03');   // Ori's Account
      return S_story.inventory.map(i => ({
        name: i.name, readText: i.readText || '', hasDescription: 'description' in i,
      }));
    });
    expect(out.map(i => i.name)).toEqual(['The Harrow Manifest', "Ori's Account"]);
    out.forEach(i => {
      expect(i.hasDescription, i.name).toBe(false);
      expect(i.readText.length, i.name).toBeGreaterThan(0);
    });
  });

  test("the annotation append lands on Benedikt's readable surface", async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
    const out = await page.evaluate(() => {
      S_story.inventory = [];
      _applyItemChain(QUEST_DB.quest_wm_04);
      const before = S_story.inventory[0].desc;
      (QUEST_DB.quest_va_04.onComplete || [])
        .filter(b => b.kind === '_legacy_fn').forEach(b => b.fn(S_story));
      return { before, after: S_story.inventory[0].desc };
    });
    expect(out.before.length).toBeGreaterThan(0);
    expect(out.after).toContain('The fourth link held.');
    expect(out.after.length).toBeGreaterThan(out.before.length);
  });

  test('the inventory row carries its item desc as a tooltip', async ({ page }) => {
    await seedAndLoad(page);
    await dismissContinue(page);
    const rows = await page.evaluate(() => {
      S_story.inventory = [];
      S_story.knowledge = [];
      ['quest_wm_02', 'quest_wm_03', 'quest_wm_04', 'quest_va_02']
        .forEach(id => _applyItemChain(QUEST_DB[id]));
      storyRenderInventory();
      return Array.from(document.querySelectorAll('#inv-list .inv-item')).map(el => ({
        name: (el.querySelector('.inv-name') || {}).textContent || '',
        title: el.getAttribute('title') || '',
      }));
    });
    const tomes = rows.filter(r => /Field Notes|Kings' History|Annotated Copy|Antecedent Seal/.test(r.name));
    expect(tomes).toHaveLength(4);
    tomes.forEach(r => expect(r.title.length, r.name).toBeGreaterThan(0));
  });

});
