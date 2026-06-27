'use strict';
const { test, expect } = require('@playwright/test');

// ── §WBAPI-01 ph4-FU — CRUD tab array-field editing ───────────────────────────
//
// The CRUD tab edited scalar fields only. ph4-FU adds completeItems /
// targetMonsterKeys / killGoals to the quest form so existing quests' array
// fields are editable. On save these go out as real arrays in the PUT body,
// where the server's ph3 dispatch routes them to editStructuredField (a
// source-level patch that persists through save()).
//
// The new client logic is the array codecs (arrToText / textToArr) and their
// integration into collectFormData. Server-level array persistence is already
// covered by scripts/check-array-patch.js (ph3). These tests exercise the real
// codecs via the window.__crudTest hook plus a DOM round-trip through the form.

test.describe('CRUD array fields (§WBAPI-01 ph4-FU)', () => {
  test('codecs round-trip csv and objlines arrays', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const r = await page.evaluate(() => {
      const { arrToText, textToArr } = window.__crudTest;
      return {
        csvText:  arrToText('csv', ['Trophy Pelt', 'Bounty Token']),
        csvBack:  textToArr('csv', 'Trophy Pelt, Bounty Token'),
        objText:  arrToText('objlines', [
          { key: 'stray_alley_cat', need: 5, label: 'Stray' },
          { key: 'fluffy_cat', need: 3, label: 'Fluffy' },
        ]),
        objBack:  textToArr('objlines', 'stray_alley_cat:5:Stray\nfluffy_cat:3:Fluffy'),
        objDefaults: textToArr('objlines', 'beefy_tom'),   // need→1, label→key
        emptyText: arrToText('csv', undefined),            // non-array → ''
      };
    });
    expect(r.csvText).toBe('Trophy Pelt, Bounty Token');
    expect(r.csvBack).toEqual(['Trophy Pelt', 'Bounty Token']);
    expect(r.objText).toBe('stray_alley_cat:5:Stray\nfluffy_cat:3:Fluffy');
    expect(r.objBack).toEqual([
      { key: 'stray_alley_cat', need: 5, label: 'Stray' },
      { key: 'fluffy_cat', need: 3, label: 'Fluffy' },
    ]);
    expect(r.objDefaults).toEqual([{ key: 'beefy_tom', need: 1, label: 'beefy_tom' }]);
    expect(r.emptyText).toBe('');
  });

  // ── §EDITOR-01-D — itemchain codec via the CRUD __crudTest hook ─────────────
  test('codecs round-trip the itemchain grammar (all four action kinds)', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const chain = [
      { action: 'grant', name: 'Pip Bead', icon: '🪵', type: 'misc', sell: 1, desc: "O'Brien's gift" },
      { action: 'take', name: "Smalt's Trust", all: true },
      { action: 'grantBit', flag: 'harmonyChainComplete', label: 'Harmony Chain' },
      { action: 'takeBit', flag: 'harmonyChainComplete' },
    ];
    const r = await page.evaluate((chain) => {
      const { arrToText, textToArr } = window.__crudTest;
      const text = arrToText('itemchain', chain);
      return { text, back: textToArr('itemchain', text), bare: textToArr('itemchain', 'grant | Bare Item') };
    }, chain);
    expect(r.text).toBe(
      "grant | Pip Bead | 🪵 | misc | 1 | O'Brien's gift\n" +
      "take | Smalt's Trust | all\n" +
      'grantBit | harmonyChainComplete | Harmony Chain\n' +
      'takeBit | harmonyChainComplete');
    expect(r.back).toEqual(chain);                                  // round-trip identity
    expect(r.bare).toEqual([{ action: 'grant', name: 'Bare Item' }]); // optional fields omitted
  });

  test('quest CRUD form renders array inputs and collectFormData emits arrays', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.evaluate(() => window.switchTab('crud'));
    // Select the quest type, then open a blank "+ New" form (no server needed).
    await page.click('.crud-type-btn[data-ctype="quest"]');
    await page.click('#btn-crud-new');

    // The three array fields render with the expected control types.
    await expect(page.locator('#crud-field-completeItems')).toHaveCount(1);
    await expect(page.locator('#crud-field-targetMonsterKeys')).toHaveCount(1);
    expect(await page.locator('#crud-field-killGoals').evaluate(el => el.tagName)).toBe('TEXTAREA');
    expect(await page.locator('#crud-field-itemChain').evaluate(el => el.tagName)).toBe('TEXTAREA');

    // Fill scalar + array fields, then collect — arrays must come out parsed.
    await page.fill('#crud-field-id', 'quest_test_crud_hunt');
    await page.fill('#crud-field-title', 'CRUD Hunt');
    await page.fill('#crud-field-completeItems', 'Trophy Pelt, Bounty Token');
    await page.fill('#crud-field-targetMonsterKeys', 'stray_alley_cat, fluffy_cat');
    await page.fill('#crud-field-killGoals', 'stray_alley_cat:5:Stray\nfluffy_cat:3:Fluffy');
    await page.fill('#crud-field-itemChain', 'grant | Pip Bead | 🪵 | misc | 1 | A token\ntakeBit | someFlag');

    const body = await page.evaluate(() => window.__crudTest.collectFormData());
    expect(body.completeItems).toEqual(['Trophy Pelt', 'Bounty Token']);
    expect(body.targetMonsterKeys).toEqual(['stray_alley_cat', 'fluffy_cat']);
    expect(body.killGoals).toEqual([
      { key: 'stray_alley_cat', need: 5, label: 'Stray' },
      { key: 'fluffy_cat', need: 3, label: 'Fluffy' },
    ]);
    expect(body.itemChain).toEqual([
      { action: 'grant', name: 'Pip Bead', icon: '🪵', type: 'misc', sell: 1, desc: 'A token' },
      { action: 'takeBit', flag: 'someFlag' },
    ]);
    // Empty array fields are omitted (consistent with empty scalars).
    expect('waypointNode' in body).toBe(false);
  });
});
