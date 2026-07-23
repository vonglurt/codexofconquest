// §NPC-01 — The Derivable NPC Card Map (promotes §POT-R2). See lab-reports/lab-report-npc-card-map.md.
//
// §NPC-01-A guards that _renderNpcCard renders a "lean" BIRKA_NPC_PROFILES entry — one that carries
// only {key,name,occupation,node} and NO per-tier greeting object (the ~194 non-Birka NPCs) — WITHOUT
// throwing. Before the fix, staticProfile was undefined for a lean profile and `staticProfile.greeting`
// threw a TypeError, so widening the render map to any lean NPC would have crashed the card. The fix
// omits the greeting line when absent; name/occupation/quote/worldTruth still render, and rich profiles
// keep byte-identical HTML.
const { test, expect } = require('@playwright/test');

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
