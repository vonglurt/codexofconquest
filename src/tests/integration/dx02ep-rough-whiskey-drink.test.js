// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
const { test, expect } = require('@playwright/test');

// ── §DX-02ep — the Rough Whiskey is drunk from the inventory ──
//
// ROUGH_WHISKEY_REACTIONS holds eighteen lines, six NPCs by three favor tiers, and they
// play only while roughWhiskeyActive is set: until the next rest or battle victory. The
// Drink button opens that window anywhere. Walking into the HKG pit fight drunk is the
// drunk fight, whether the bottle was drunk there or before.

const drinkBtn = () => [...document.querySelectorAll('#inv-list .inv-item')]
  .find(d => d.querySelector('.inv-name').textContent.startsWith('Rough Whiskey'))
  ?.querySelector('.inv-use-btn') || null;

test.describe('§DX-02ep Rough Whiskey', () => {

  test('Drink opens the reaction window for all eighteen lines; rest closes it', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate((drinkSrc) => {
      const drinkBtn = eval(drinkSrc);
      S_story.gold = 20;
      S_story.roughWhiskeyActive = false;
      storyBuyWhiskey(); storyBuyWhiskey();
      storyRenderInventory();
      const section = (() => {
        let hd = null;
        for (const el of document.getElementById('inv-list').children) {
          if (el.classList.contains('inv-section-hd')) hd = el.textContent;
          else if (el.querySelector?.('.inv-name')?.textContent.startsWith('Rough Whiskey')) return hd;
        }
      })();
      const before = drinkBtn().textContent;
      const lines = [];
      for (const key of Object.keys(ROUGH_WHISKEY_REACTIONS))
        for (const fav of [0, 1, 2]) {
          S_story.npcFavorability = { [key]: fav };
          lines.push(_checkRoughWhiskeyReaction(key));
        }
      drinkBtn().click();
      const active = S_story.roughWhiskeyActive;
      const bottles = S_story.inventory.filter(i => i.name === 'Rough Whiskey').length;
      const after = drinkBtn();
      const heard = new Set();
      for (const key of Object.keys(ROUGH_WHISKEY_REACTIONS))
        for (const fav of [0, 1, 2]) {
          S_story.npcFavorability = { [key]: fav };
          heard.add(_checkRoughWhiskeyReaction(key));
        }
      const authored = new Set(Object.values(ROUGH_WHISKEY_REACTIONS).flatMap(Object.values));
      S_story.currentCode = 'TLL';
      document.getElementById('btn-sleep-confirm').dataset.node = 'TLL';
      try { storyConfirmSleep(); } catch (e) {}
      return { section, before, soberLines: lines.filter(Boolean).length, active, bottles,
               afterText: after?.textContent, afterDisabled: after?.disabled,
               heard: [...heard].filter(l => authored.has(l)).length, authored: authored.size,
               afterRest: S_story.roughWhiskeyActive };
    }, `(${drinkBtn})`);
    expect(r.section).toContain('Consumables');
    expect(r.before).toBe('🥃 Drink');
    expect(r.soberLines).toBe(0);
    expect(r.active).toBe(true);
    expect(r.bottles).toBe(1);
    expect(r.afterText).toBe('🥃 In effect');
    expect(r.afterDisabled).toBe(true);
    expect(r.authored).toBe(18);
    expect(r.heard).toBe(18);
    expect(r.afterRest).toBe(false);
  });

  test('the HKG pit fight is the drunk fight whether the bottle was drunk there or before', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const base = JSON.stringify(S_story);
      const run = drunkFirst => {
        S_story = JSON.parse(base);
        S_story.roughWhiskeyUsed = false;
        S_story.roughWhiskeyActive = drunkFirst;
        S_story.inventory = (S_story.inventory || []).filter(i => i.name !== 'Rough Whiskey');
        for (let n = 0; n < 2; n++) S_story.inventory.push({ name: 'Rough Whiskey', icon: '🥃', type: 'consumable_misc', sell: 2 });
        S_story.pendingBattle = { nodeCode: 'HKG', name: 'Pit Fighter', label: 'Neon Undercity' };
        _showBattleOverlay();
        return { drunkFight: S_story._drunkFight, used: S_story.roughWhiskeyUsed, active: S_story.roughWhiskeyActive,
                 bottles: S_story.inventory.filter(i => i.name === 'Rough Whiskey').length };
      };
      return { atPit: run(false), before: run(true) };
    });
    expect(r.atPit).toEqual({ drunkFight: true, used: true, active: true, bottles: 1 });
    expect(r.before).toEqual({ drunkFight: true, used: true, active: true, bottles: 2 });
  });

});
