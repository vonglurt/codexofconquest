// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02do — the two player-typed strings in the story UI must read back exactly as typed:
// Entry 42 in the journal, and the Defiant Fields secret in the epilogue.
'use strict';
const { test, expect } = require('@playwright/test');
const { SEED_STATE, dismissContinue } = require('./helpers');

const TYPED = '<b>x</b> & y\nline two';

async function at(page, overrides) {
  const state = Object.assign({}, SEED_STATE, {
    currentCode: 'TLL', checkpointNode: 'TLL', visited: { TLL: true }, visitedCells: {},
    rngState: 424242, inventory: [], quests: {},
  }, overrides);
  await page.addInitScript(s => {
    localStorage.clear();
    localStorage.setItem('coc_autosave', JSON.stringify(s));
  }, state);
  await page.goto('/play.html');
  await dismissContinue(page);
}

test.describe('§DX-02do — what the player typed is what the page shows', () => {
  test('Entry 42 renders its angle brackets and ampersand as text, and keeps its line break', async ({ page }) => {
    await at(page, { entry42Written: true, entry42Text: TYPED, journalEntriesRead: [] });
    const r = await page.evaluate(() => {
      storyJournalToggle();
      const body = document.querySelector('#jov-entry-list .jov-entry:last-child .jov-entry-text');
      return { bold: body.querySelector('b') !== null, breaks: body.querySelectorAll('br').length, text: body.textContent };
    });
    expect(r.bold, 'no element materialised from the typed text').toBe(false);
    expect(r.breaks, 'the newline is still a line break').toBe(1);
    expect(r.text).toBe('<b>x</b> & yline two');
  });

  test('the recorded secret is escaped before it joins the epilogue markup', async ({ page }) => {
    await at(page, { _voidTollSecret: '<i>truth</i> & so' });
    const line = await page.evaluate(() => {
      _curseScore = () => 0;
      return _buildEpilogueScroll().find(l => l.includes('void rune'));
    });
    expect(line).toContain('&lt;i&gt;truth&lt;/i&gt; &amp; so');
    expect(line).not.toContain('<i>');
  });
});
