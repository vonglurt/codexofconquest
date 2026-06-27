'use strict';
const { test, expect } = require('@playwright/test');

// ── §WBAPI-01 ph4 — Quest Creator array-field support ─────────────────────────
//
// The ✏ Editor tab (§EDITOR-01) gained targetMonsterKeys + killGoals inputs
// (it already had completeItems). These feed edBuildQuestObj → Export JS / POST.
// Export JS is fully client-side (no server), so we fill the form, click
// ◇ Export JS, and assert the generated QUEST_DB entry serializes all three
// array fields correctly (killGoals as an object array).

test.describe('Quest Creator — array fields (§WBAPI-01 ph4)', () => {
  test('Export JS serializes completeItems, targetMonsterKeys, and killGoals', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.evaluate(() => window.switchTab('editor'));

    // Fill the side-quest form including the two new array fields.
    await page.evaluate(() => {
      const set = (id, v) => { const el = document.getElementById(id); el.value = v; };
      set('ed-id', 'quest_test_hunt');
      set('ed-type', 'side');
      document.getElementById('ed-type').dispatchEvent(new Event('change'));
      set('ed-title', 'Test Hunt');
      set('ed-completeItems', 'Trophy Pelt, Bounty Token');
      set('ed-targetMonsterKeys', 'stray_alley_cat, fluffy_cat');
      set('ed-killGoals', 'stray_alley_cat:5:Stray\nfluffy_cat:3:Fluffy');
    });
    await page.click('#ed-btn-export');

    const out = await page.inputValue('#ed-export-out');
    expect(out).toContain('completeItems:["Trophy Pelt","Bounty Token"]');
    expect(out).toContain('targetMonsterKeys:["stray_alley_cat","fluffy_cat"]');
    expect(out).toContain('killGoals:[{key:"stray_alley_cat",need:5,label:"Stray"},{key:"fluffy_cat",need:3,label:"Fluffy"}]');
  });

  test('killGoals label defaults to key, need defaults to 1 when omitted', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.evaluate(() => window.switchTab('editor'));
    await page.evaluate(() => {
      const set = (id, v) => { const el = document.getElementById(id); el.value = v; };
      set('ed-id', 'quest_test_hunt2');
      set('ed-type', 'side');
      document.getElementById('ed-type').dispatchEvent(new Event('change'));
      set('ed-killGoals', 'beefy_tom');          // no need, no label
    });
    await page.click('#ed-btn-export');
    const out = await page.inputValue('#ed-export-out');
    expect(out).toContain('killGoals:[{key:"beefy_tom",need:1,label:"beefy_tom"}]');
  });
});
