// §NPC-01 — The Derivable NPC Card Map (promotes §POT-R2). See lab-reports/lab-report-npc-card-map.md.
//
// §NPC-01-A guards that _renderNpcCard renders a "lean" BIRKA_NPC_PROFILES entry — one that carries
// only {key,name,occupation,node} and NO per-tier greeting object (the ~194 non-Birka NPCs) — WITHOUT
// throwing. Before the fix, staticProfile was undefined for a lean profile and `staticProfile.greeting`
// threw a TypeError, so widening the render map to any lean NPC would have crashed the card. The fix
// omits the greeting line when absent; name/occupation/quote/worldTruth still render, and rich profiles
// keep byte-identical HTML.
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

test.describe('§NPC-01-A — lean profiles render without the staticProfile.greeting crash', () => {
  test('every sampled lean profile builds a card and shows its name; rich profiles keep their greeting', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await page.goto('/roll2hit-v3.html');

    const r = await page.evaluate(() => {
      const out = { threw: [], nameMissing: [] };
      const isRich = p => !!(p && p.neutral && p.neutral.greeting);
      const keys = Object.keys(BIRKA_NPC_PROFILES);
      out.richCount = keys.filter(k => isRich(BIRKA_NPC_PROFILES[k])).length;
      out.leanCount = keys.filter(k => !isRich(BIRKA_NPC_PROFILES[k])).length;

      // Render a broad sample of lean profiles that also have a dialogue (dlg non-null → passes the
      // early-returns and reaches the greeting line that used to crash).
      const sample = keys.filter(k => !isRich(BIRKA_NPC_PROFILES[k]) && NPC_DIALOGUES[k]).slice(0, 30);
      out.sampleSize = sample.length;
      for (const k of sample) {
        const box = document.createElement('div');
        try { _renderNpcCard(k, box); }
        catch (e) { out.threw.push(k + ': ' + String(e)); continue; }
        if (!box.textContent.includes(BIRKA_NPC_PROFILES[k].name)) out.nameMissing.push(k);
      }

      // Regression: a rich profile (yael, fresh → neutral tier) still renders its authored greeting.
      const rbox = document.createElement('div');
      _renderNpcCard('yael', rbox);
      out.richGreetingShown = rbox.textContent.includes(BIRKA_NPC_PROFILES['yael'].neutral.greeting);
      return out;
    });

    expect(r.leanCount, 'there are many lean profiles to guard').toBeGreaterThan(100);
    expect(r.richCount, 'the Birka rich profiles still exist').toBeGreaterThan(0);
    expect(r.sampleSize, 'sampled lean profiles that have a dialogue').toBeGreaterThan(0);
    expect(r.threw, 'no lean profile throws in _renderNpcCard').toEqual([]);
    expect(r.nameMissing, 'every lean card shows its NPC name').toEqual([]);
    expect(r.richGreetingShown, 'rich profile still shows its authored greeting (byte-identical path)').toBe(true);
    expect(pageErrors).toEqual([]);
  });
});

test.describe('§NPC-01-B — render map derived from BIRKA_NPC_PROFILES.node', () => {
  test('derivation inverts profiles, covers many real nodes (0 dead), is wired into storyRender, and preserves the curated literal', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await page.goto('/roll2hit-v3.html');

    const r = await page.evaluate(() => {
      const m = _deriveNpcRenderMap();
      const nodes = Object.keys(m);
      const distinctKeys = new Set();
      nodes.forEach(n => m[n].forEach(k => distinctKeys.add(k)));

      // spot check: a lean profile (ser_bardo) derives to its own .node
      const serBardoNode = BIRKA_NPC_PROFILES['ser_bardo'] && BIRKA_NPC_PROFILES['ser_bardo'].node;
      const serBardoDerived = !!(serBardoNode && m[serBardoNode] && m[serBardoNode].includes('ser_bardo'));

      // the render path actually falls back to the derived map
      const src = storyRender.toString();
      const wired = /_deriveNpcRenderMap\(\)/.test(src);

      // parity anchor: the curated `birkaNpcs` literal is still present and LHR stays a curated key
      // (so the literal wins for it), while ser_bardo's node is NOT a curated key (so derivation applies)
      const litDecl = src.slice(src.indexOf('const birkaNpcs ='));
      const litLine = litDecl.slice(0, litDecl.indexOf('\n'));
      const lhrCurated = /[,{]\s*LHR:\[/.test(litLine);
      const serBardoNodeCurated = new RegExp('[,{]\\s*' + serBardoNode + ':\\[').test(litLine);

      return {
        nodeCount: nodes.length,
        deadNodes: nodes.filter(n => !NODE_MAP[n]),
        distinctKeyCount: distinctKeys.size,
        renderableNodes: nodes.filter(n => m[n].some(k => NPC_DIALOGUES[k])).length,
        // many derived nodes omit an explicit NODE_MAP[key].code field — so the render lookup MUST key
        // on the node key (currentCode), not node.code, or these render nothing. Guards the §NPC-01-B fix.
        codelessDerivedNodes: nodes.filter(n => NODE_MAP[n] && !NODE_MAP[n].code).length,
        serBardoHasCodeField: !!(NODE_MAP[serBardoNode] && NODE_MAP[serBardoNode].code),
        serBardoNode, serBardoDerived, wired, lhrCurated, serBardoNodeCurated,
      };
    });

    expect(r.wired, 'storyRender falls back to _deriveNpcRenderMap()').toBe(true);
    expect(r.nodeCount, 'derived map covers many real nodes').toBeGreaterThan(100);
    expect(r.deadNodes, 'no derived node code is absent from NODE_MAP').toEqual([]);
    expect(r.distinctKeyCount, 'derives ~all authored profiles').toBeGreaterThan(190);
    expect(r.serBardoDerived, `ser_bardo derives to its node ${r.serBardoNode}`).toBe(true);
    expect(r.renderableNodes, 'many nodes now yield a renderable NPC (has both profile and dialogue)').toBeGreaterThan(100);
    expect(r.lhrCurated, 'LHR stays a curated literal key — parity anchor, literal wins').toBe(true);
    expect(r.serBardoNodeCurated, "ser_bardo's node is NOT curated, so derivation applies there").toBe(false);
    expect(r.codelessDerivedNodes, 'many derived nodes omit node.code → lookup must key on currentCode').toBeGreaterThan(50);
    expect(r.serBardoHasCodeField, 'PSAGLD is one such code-less node (the end-to-end regression case)').toBe(false);
    expect(pageErrors).toEqual([]);
  });

  test('end-to-end: storyRender shows a derived NPC card at a non-curated node (was blank before §NPC-01)', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    // ser_bardo lives at PSAGLD, which is NOT a curated birkaNpcs key — before §NPC-01 this node
    // rendered no NPC card at all. Load the game standing on it and assert the real card row.
    const node = 'PSAGLD';
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true } });
    await dismissContinue(page);
    await expect(page.locator('#story-npc-cards-row')).toContainText('Ser Bardo Albizzi');
    expect(pageErrors).toEqual([]);
  });
});
