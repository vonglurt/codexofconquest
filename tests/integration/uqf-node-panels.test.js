// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §VM-01-G1 — NODE_PANELS: the data-driven flavor/arrival panel table.
// Guards the migration of 12 former per-node special-case blocks out of storyRender into
// NODE_PANELS + _renderNodePanels (proven a byte-identical no-op at ship time by a 24-combo
// golden-DOM diff — see BACKLOG §VM-01-G G1 ship record). These tests pin the behavior that
// proof relied on: gating, once-flags, LIFO insertion order against inline neighbors, text
// variants, and the source-level guarantee that the old inline blocks are gone.
'use strict';
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

async function renderAt(page, code, ov = {}) {
  await seedAndLoad(page, Object.assign({ currentCode: code, checkpointNode: code,
    visited: {}, rngState: 424242 }, ov));
  await dismissContinue(page);
  return page.evaluate(() => {
    const sibs = [];
    let el = document.getElementById('story-text-box').nextElementSibling;
    while (el && el.id !== 'story-info-row') {
      sibs.push({ id: el.id || null, text: el.textContent.slice(0, 120) });
      el = el.nextElementSibling;
    }
    return sibs;
  });
}

test.describe('§VM-01-G1 — NODE_PANELS renders the migrated panels', () => {
  test('Class B once-flag: KS conversion fires on first DAM render, sets saulConverted, gone on re-render', async ({ page }) => {
    const sibs = await renderAt(page, 'DAM');
    expect(sibs.some(s => s.id === 'story-ks-conversion')).toBe(true);
    const r = await page.evaluate(() => {
      const converted = S_story.saulConverted;
      storyRender(NODE_MAP[S_story.currentCode]);
      return { converted, secondRenderHasPanel: !!document.getElementById('story-ks-conversion') };
    });
    expect(r.converted, 'once-flag written during first render').toBe(true);
    expect(r.secondRenderHasPanel, 'panel does not recreate once the flag is set').toBe(false);
  });

  test('LIFO order vs inline neighbors: TLS at L20 stacks memory-gate above Quest -1 above Sweelinck variant', async ({ page }) => {
    const sibs = await renderAt(page, 'TLS', { level: 20 });
    const iGate = sibs.findIndex(s => s.id === 'memory-gate-panel');
    const iQ1 = sibs.findIndex(s => s.text.startsWith('🔓  You are Level 20.'));
    const iSw = sibs.findIndex(s => s.id === 'story-sweelinck-variant');
    expect(iGate, 'inline memory-gate panel present').toBeGreaterThanOrEqual(0);
    expect(iQ1, 'migrated Quest -1 door present').toBeGreaterThanOrEqual(0);
    expect(iSw, 'migrated Sweelinck variant present').toBeGreaterThanOrEqual(0);
    expect(iGate < iQ1 && iQ1 < iSw, 'original LIFO stacking preserved (later source = higher)').toBe(true);
  });

  test('text variants: LCA betrayal count and MLA harmony suffix', async ({ page }) => {
    const lca = await renderAt(page, 'LCA', { betrayalThought: true, betrayalWord: true });
    expect(lca.some(s => s.id === 'story-lca-close'), 'LCA close panel renders').toBe(true);
    const lcaFull = await page.evaluate(() => document.getElementById('story-lca-close').textContent);
    expect(lcaFull).toContain('held your position at 1 of the courts');
    const mla = await renderAt(page, 'MLA', { harmonyChainComplete: true });
    const mlaPanel = mla.find(s => s.id === 'story-ml-snake');
    expect(mlaPanel, 'Malta snake panel renders').toBeTruthy();
    const full = await page.evaluate(() => document.getElementById('story-ml-snake').textContent);
    expect(full).toContain('It moves the same way every time.');
  });

  test('negative gates: IST approach panel present when undefeated, absent when defeated', async ({ page }) => {
    const fresh = await renderAt(page, 'IST');
    expect(fresh.some(s => s.text.includes('Library of the Drowned'))).toBe(true);
    const done = await renderAt(page, 'IST', { defeatedBattles: { IST: true } });
    expect(done.some(s => s.text.includes('Library of the Drowned'))).toBe(false);
  });

  test('source guard: old inline blocks are gone from storyRender; NODE_PANELS holds them; BK stays inline', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      const src = storyRender.toString();
      return {
        migratedIdsInline: ['story-ks-conversion', 'story-ao-namechange', 'story-lt-stoning',
          'story-lso-trigger', 'story-lca-close', 'story-ml-snake', 'story-ci-tagline']
          .filter(id => src.includes(id)),
        panelCount: NODE_PANELS.length,
        rendererWired: src.includes('_renderNodePanels(node, S_story)'),
        // BK approach panel must stay inline: Corelli's button precedes it and can co-fire at BK.
        bkStillInline: src.includes('Void Fracture Maze'),
        lsoPanelInTable: NODE_PANELS.some(p => p.id === 'story-lso-trigger'),
      };
    });
    expect(r.migratedIdsInline, 'no migrated panel id remains in storyRender source').toEqual([]);
    expect(r.panelCount).toBeGreaterThanOrEqual(12);
    expect(r.rendererWired).toBe(true);
    expect(r.bkStillInline).toBe(true);
    expect(r.lsoPanelInTable).toBe(true);
  });

  test('§VM-01-G1-FIX — the §SIREN-01 teaser renders at LSO (was dead code LJ3) and gates off after the fog resolves', async ({ page }) => {
    const fresh = await renderAt(page, 'LSO');
    expect(fresh.some(s => s.id === 'story-lso-trigger'), 'teaser renders at the Fog Bank pre-quest').toBe(true);
    const resolved = await renderAt(page, 'LSO', { charmResisted: true });
    expect(resolved.some(s => s.id === 'story-lso-trigger'), 'teaser gone once charmResisted').toBe(false);
    const failed = await renderAt(page, 'LSO', { seaOverseerMet: true });
    expect(failed.some(s => s.id === 'story-lso-trigger'), 'teaser gone once seaOverseerMet').toBe(false);
    await page.evaluate(() => {
      if (NODE_PANELS.some(p => (p.nodes || []).includes('LJ3'))) throw new Error('dead LJ3 key still present');
    });
  });

  test('§VM-01-G1-FIX — the §LXII AO name-change notice shows once on first post-commission arrival (was dead via visited timing)', async ({ page }) => {
    const plain = await renderAt(page, 'HTY');
    expect(plain.some(s => s.id === 'story-ao-namechange'), 'no notice pre-commission').toBe(false);
    const post = await renderAt(page, 'HTY', { commissionReceived: true });
    expect(post.some(s => s.id === 'story-ao-namechange'), 'notice on first post-commission arrival').toBe(true);
    const r = await page.evaluate(() => {
      const seen = S_story.aoNameNoticeSeen;
      storyRender(NODE_MAP[S_story.currentCode]);
      return { seen, secondRenderHasPanel: !!document.getElementById('story-ao-namechange') };
    });
    expect(r.seen, 'once-flag written').toBe(true);
    expect(r.secondRenderHasPanel, 'notice does not repeat').toBe(false);
  });
});
