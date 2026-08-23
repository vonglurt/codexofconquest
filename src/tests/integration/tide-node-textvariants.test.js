// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §TIDE-01-A — the world visibly changes after events, on the shipped `textVariants` rail.
//
// node.textVariants:[{flag,text}] is a generic, idle renderer (storyRender ~30864): the first
// variant whose S_story flag is truthy REPLACES node.text. It shipped with §GR but had exactly
// ONE consumer (AMS / fishmongerRowRestored). §TIDE-01-A adds a second: HKG (Neon Undercity)
// gains a variant keyed on `cyMaintenanceDecoded` (set by quest_d0207_a4, "The Cipher"), so once
// the player decodes that a Scholar King built the Undercity three centuries ago, the node re-reads
// with the 1367-vs-neon anachronism diegetically accounted for. Pure authoring — zero engine code.
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

// phrases unique to each version (both texts contain "cold", so key on non-overlapping strings)
const BASE_ONLY    = 'neon strips casting everything'; // only in the authored base node.text
const VARIANT_ONLY = 'resonance channels';             // only in the cyMaintenanceDecoded variant

test.describe('§TIDE-01-A — HKG node text swaps to the anachronism-accounted variant once cyMaintenanceDecoded', () => {
  test('fresh state (flag unset): the base Neon Undercity text renders, not the variant', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    const node = 'HKG';
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true } });
    await dismissContinue(page);
    const box = page.locator('#story-text-box');
    await expect(box).toContainText(BASE_ONLY);
    await expect(box).not.toContainText(VARIANT_ONLY);
    expect(pageErrors).toEqual([]);
  });

  test('after cyMaintenanceDecoded: the variant text replaces the base', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    const node = 'HKG';
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true }, cyMaintenanceDecoded: true });
    await dismissContinue(page);
    const box = page.locator('#story-text-box');
    await expect(box).toContainText(VARIANT_ONLY);
    await expect(box).not.toContainText(BASE_ONLY);
    expect(pageErrors).toEqual([]);
  });

  test('regression: the first consumer (AMS / fishmongerRowRestored) still swaps — the rail is generic, not HKG-special', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    const node = 'AMS';
    // base AMS text says "still visible in the way the brick fell"; the restored variant says "one stall, new boards".
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true }, fishmongerRowRestored: true });
    await dismissContinue(page);
    await expect(page.locator('#story-text-box')).toContainText('one stall, new boards over old brick');
    expect(pageErrors).toEqual([]);
  });
});
