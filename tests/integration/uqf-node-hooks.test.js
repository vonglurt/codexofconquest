// §VM-01-G2 — NODE_HOOKS: registered per-node render hooks (Class E bespoke UIs).
// Guards the migration of 7 former storyRender blocks (Void Archaeology, Void Shaman Warden,
// Corelli Merchant, Codex Core Chamber, La Riva row, Scholar Workshop, Mimic Meadows) into
// verbatim module-level hook functions + the ordered NODE_HOOKS registry, dispatched IN PLACE
// so LIFO stacking on story-text-box is preserved by construction (proven a byte-identical
// no-op at ship time by a 14-combo golden-DOM diff — see BACKLOG §VM-01-G G2 ship record).
'use strict';
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

async function renderAt(page, code, ov = {}) {
  await seedAndLoad(page, Object.assign({ currentCode: code, checkpointNode: code,
    visited: {}, rngState: 424242 }, ov));
  await dismissContinue(page);
}

test.describe('§VM-01-G2 — NODE_HOOKS registry + in-place dispatch', () => {
  test('registry integrity: the 7 G2 entries lead the registry, unique ids, callable fns, dispatch reaches the fn', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // §VM-01-G2b appended 29 npc-row hooks after these; this test owns the G2 head of the
      // registry (the story-text-box-anchored ones), uqf-npc-row-hooks.test.js owns the tail.
      const g2 = NODE_HOOKS.filter(h => h.anchor !== 'npc-row');
      const ids = g2.map(h => h.id);
      return {
        count: g2.length,
        ids,
        uniqueIds: new Set(NODE_HOOKS.map(h => h.id)).size === NODE_HOOKS.length ? g2.length : -1,
        allFns: NODE_HOOKS.every(h => typeof h.fn === 'function'),
        leadsRegistry: NODE_HOOKS.slice(0, 7).every(h => h.anchor !== 'npc-row'),
        // dispatch finds by id; an unknown id is a silent no-op (returns undefined)
        unknownIsNoop: _runNodeHook('no-such-hook', NODE_MAP['LHR']) === undefined,
      };
    });
    expect(r.count).toBe(7);
    expect(r.uniqueIds, 'ids are unique across the WHOLE registry, G2 + G2b').toBe(7);
    expect(r.allFns).toBe(true);
    expect(r.leadsRegistry, 'registry stays ordered by former source position: G2 blocks precede the G2b npc-row block').toBe(true);
    expect(r.ids).toEqual(['void-archaeology', 'void-shaman-warden', 'corelli-merchant',
      'codex-core-chamber', 'la-riva-row', 'scholar-workshop', 'mimic-meadows']);
    expect(r.unknownIsNoop).toBe(true);
  });

  test('hooks still render their live surfaces (one probe per extracted block)', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));

    await renderAt(page, 'LIM', { tribbleCount: 6 });
    await expect(page.locator('#mm-panel')).toContainText('Fuzzy Tribbles in pack: 6');

    // (fresh SZG renders no panel: the node's own loot auto-grants the Prototype Wand on
    // arrival, gating the wand button off — so probe the scholarWorkshopComplete row instead)
    await renderAt(page, 'SZG', { scholarWorkshopComplete: true });
    await expect(page.locator('#wk-panel')).toContainText('The Workshop yielded its secrets');

    await renderAt(page, 'AMS', { quests: { quest_la_riva_01: 'complete', quest_la_riva_02: 'active' },
      connieMet: true, frCatKillCount: 2 });
    await expect(page.locator('#fr-quest-div')).toContainText('Clear Corrupted Cats (2/5)');

    await renderAt(page, 'LCY', { actNumber: 2 });
    await expect(page.locator('#corelli-encounter-btn')).toContainText('Traveling Merchant');

    await renderAt(page, 'TLS', { shards: 6 });
    await expect(page.locator('body')).toContainText('The Codex Core Chamber');
    expect(await page.evaluate(() => S_story.codexCoreEntered), 'chamber once-flag still fires').toBe(true);

    await renderAt(page, 'GVA', { vsShamanKnown: true, vaLastWardVisited: true });
    await expect(page.getByText('⚔️ Fight the Warden.')).toBeVisible();
    expect(await page.evaluate(() => S_story.quests['quest_vs_warden']), 'warden quest still auto-activates').toBe('active');

    expect(pageErrors).toEqual([]);
  });

  test('LIFO order vs inline neighbors: at ZRH the inline Secret Gate (later source) stacks above the extracted Investigate button', async ({ page }) => {
    await renderAt(page, 'ZRH', { ngPlusRun: 1, wmFirstResearcherKnown: true, entry42Written: true });
    const r = await page.evaluate(() => {
      const sibs = [];
      let el = document.getElementById('story-text-box').nextElementSibling;
      while (el && sibs.length < 30) { sibs.push({ id: el.id || null, text: el.textContent.slice(0, 40) }); el = el.nextElementSibling; }
      return {
        iGate: sibs.findIndex(s => s.id === 'secret-gate-panel'),
        iInvestigate: sibs.findIndex(s => s.text.indexOf('Investigate.') !== -1),
      };
    });
    expect(r.iGate, 'inline Secret Gate panel present').toBeGreaterThanOrEqual(0);
    expect(r.iInvestigate, 'extracted Investigate button present').toBeGreaterThanOrEqual(0);
    expect(r.iGate < r.iInvestigate, 'in-place dispatch preserves original LIFO stacking').toBe(true);
  });

  test('source guard: the 7 block bodies are gone from storyRender; dispatch calls sit in their place', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const src = storyRender.toString();
      return {
        calls: ['void-archaeology', 'void-shaman-warden', 'corelli-merchant', 'codex-core-chamber',
          'la-riva-row', 'scholar-workshop', 'mimic-meadows']
          .filter(id => src.indexOf("_runNodeHook('" + id + "'") === -1),
        // signature strings from each former inline body must no longer appear in storyRender
        residue: ['_checkCorelliAppearance(', 'The Codex Core Chamber', "Vincenzo's Net",
          'Prototype Wand', 'Fuzzy Tribbles', 'Fight the Warden', 'ANTECEDENT CONTAINMENT']
          .filter(sig => src.indexOf(sig) !== -1),
      };
    });
    expect(r.calls, 'every hook has its in-place dispatch call').toEqual([]);
    expect(r.residue, 'no former block body remains inline in storyRender').toEqual([]);
  });
});
