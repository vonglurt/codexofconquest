// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02dc — two near-twin selectors ten lines apart, one of them retired.
//
// `.info-chip.corpse-chip` carried four rules — two in the dark theme, two in the
// light-theme block. Nothing applied the class. §DEATH-01 correctly built an
// ID-based chip beside them (`#corpse-chip`, resolved by `_renderCorpseChip()`
// through `getElementById`), because the location card is not an info-chip row —
// and then its own commit message claimed it "Wires the long-dead `.corpse-chip`
// CSS", which it did not. The tombstone was left standing next to its look-alike.
//
// Correction to the row that filed this: the class was NOT born dead. It was
// applied as `c.className = 'info-chip corpse-chip'` on the REMAINS chips at the
// initial commit and removed by `dc2ecf5` (§DESIGN-02) — the same commit the row
// credits with creating the rules. Retired, not stillborn.
//
// No existing gate can see this shape: every dead-symbol census in the repo scans
// JS identifiers, and a CSS class selector is invisible to all of them. That is
// filed separately as §CSS-CENSUS. This test is the interim pin.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'play.html'), 'utf8');

test.describe('§DX-02dc — the retired selector is gone and the live chip is untouched', () => {

  test('no rule declares .info-chip.corpse-chip, and nothing applies the class', () => {
    expect(SRC).not.toContain('.info-chip.corpse-chip');
    expect(SRC).not.toContain('info-chip corpse-chip');
  });

  test('the ID-based chip that replaced it is intact', () => {
    expect(SRC).toContain('#corpse-chip {');
    expect(SRC).toContain('<div id="corpse-chip"');
  });

  test('the chip styles from #corpse-chip and renders through getElementById', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const el = document.getElementById('corpse-chip');
      el.style.display = '';
      const cs = getComputedStyle(el);
      return { exists: !!el, classes: el.className,
               // The #corpse-chip rule sets a border; a chip with no rule behind it
               // would fall back to the initial `none`.
               borderStyle: cs.borderStyle };
    });
    expect(r.exists).toBe(true);
    expect(r.classes).toBe('');
    expect(r.borderStyle).not.toBe('none');
  });
});
