// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02y — the AC formula no longer names a field nothing can write.
//
// `S_story.acBonus` was declared twice, read exactly once — the `(S_story.acBonus
// || 0)` term inside `_calcPlayerAc()` — and assigned nowhere in the file, at HEAD
// and at the earliest surviving build alike. Born dead, not retired. Layer 18
// specified +1 AC at L5, +1 at L8 and +2 at L10; none of it was ever built, so the
// term contributed 0 to a number the player reads off the character sheet.
//
// This is the INVERSE of the write-only dead-constant class: a live consumer with a
// broken dependency, which a gate scoped to *unread* fields walks straight past.
// Closed by deletion (option (a)) rather than by wiring — nothing in the shipped
// design grants AC by level, and an absent field is the honest form of that.
//
// What this pins is the shape, not the number: AC is base + shield + lake magic,
// and no fourth term may reappear by accident.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8');
const { seedAndLoad } = require('./helpers.js');

test.describe('§DX-02y — S_story.acBonus is gone, and AC is unchanged', () => {

  test('the field is named nowhere in the file', () => {
    expect(SRC).not.toContain('S_story.acBonus');
    // `acBonus` survives as a SHIELD-ITEM field — that one has writers and readers.
    expect(SRC).toContain('equippedShield.acBonus');
  });

  test('_calcPlayerAc has exactly three terms', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => ({
      hasField: 'acBonus' in S_story,
      ac: _calcPlayerAc(),
      base: S.char.baseAc || S.char.ac || 10,
      shield: S_story.equippedShield ? (S_story.equippedShield.acBonus || 0) : 0,
      lake: _lakeMagicBonuses().ac,
    }));
    expect(r.hasField).toBe(false);
    expect(r.ac).toBe(r.base + r.shield + r.lake);
  });

  test('an equipped shield still moves AC by exactly its own acBonus', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      const before = _calcPlayerAc();
      S_story.equippedShield = { name: 'Kite Shield', icon: '🛡', acBonus: 2, tier: 'kite_shield' };
      return { before, after: _calcPlayerAc() };
    });
    expect(r.after - r.before).toBe(2);
  });

  test('a stray acBonus left on S_story by a hand-edited save changes nothing', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      const before = _calcPlayerAc();
      S_story.acBonus = 99;
      return { before, after: _calcPlayerAc() };
    });
    expect(r.after).toBe(r.before);
  });
});
