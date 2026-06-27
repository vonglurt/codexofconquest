'use strict';
const { test, expect } = require('@playwright/test');

// ── §EDITOR-01-D-FU(a) — visual itemChain step-list editor ────────────────────
//
// buildChainEditor(host, {initial, onChange}) is a FACTORY: each call returns an
// independent instance ({el, getSteps, setSteps, addStep}) so the Quest Creator
// and CRUD form can each mount their own. getSteps() is byte-identical to
// parseItemChainText output, plus the grant.once superset the text grammar can't
// express. Reorder via ▲/▼ (canonical) + native drag (additive).
//
// Inc 2 exercises the factory head-lessly via page.evaluate — no form wiring yet.

test.describe('itemChain chain editor — buildChainEditor (§EDITOR-01-D-FU a)', () => {
  test('setSteps → getSteps round-trips all four kinds', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const out = await page.evaluate(() => {
      const initial = [
        { action: 'grant', name: 'Pip Bead', icon: '🪵', type: 'misc', sell: 1, desc: 'a token' },
        { action: 'grant', name: 'Cursed Ring', once: false },               // once superset
        { action: 'take', name: "Smalt's Trust", all: true },
        { action: 'grantBit', flag: 'harmonyChainComplete', label: 'Harmony Chain' },
        { action: 'takeBit', flag: 'harmonyChainComplete' },
      ];
      const ed = window.buildChainEditor(null, { initial });
      return { steps: ed.getSteps(), rowCount: ed.el.querySelectorAll('.chain-row').length };
    });
    expect(out.rowCount).toBe(5);
    expect(out.steps).toEqual([
      { action: 'grant', name: 'Pip Bead', icon: '🪵', type: 'misc', sell: 1, desc: 'a token' },
      { action: 'grant', name: 'Cursed Ring', once: false },
      { action: 'take', name: "Smalt's Trust", all: true },
      { action: 'grantBit', flag: 'harmonyChainComplete', label: 'Harmony Chain' },
      { action: 'takeBit', flag: 'harmonyChainComplete' },
    ]);
  });

  test('grant.once: default (checked) omits once; toggled off emits once:false', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const out = await page.evaluate(() => {
      const ed = window.buildChainEditor(null, { initial: [{ action: 'grant', name: 'A' }] });
      const before = ed.getSteps();                       // default checked → no `once`
      const cb = ed.el.querySelector('.chain-row [data-cf="once"]');
      cb.checked = false; cb.dispatchEvent(new Event('change'));
      const after = ed.getSteps();                         // unchecked → once:false
      return { before, after };
    });
    expect('once' in out.before[0]).toBe(false);
    expect(out.after[0]).toEqual({ action: 'grant', name: 'A', once: false });
  });

  test('▲/▼ reorder swaps adjacent rows', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const out = await page.evaluate(() => {
      const ed = window.buildChainEditor(null, { initial: [
        { action: 'grantBit', flag: 'one' },
        { action: 'grantBit', flag: 'two' },
        { action: 'grantBit', flag: 'three' },
      ] });
      const rows = () => [...ed.el.querySelectorAll('.chain-row')];
      // move row #3 ("three") up one → [one, three, two]
      rows()[2].querySelector('.chain-up').click();
      const afterUp = ed.getSteps().map(s => s.flag);
      // move row #1 ("one") down one → [three, one, two]
      rows()[0].querySelector('.chain-dn').click();
      const afterDn = ed.getSteps().map(s => s.flag);
      return { afterUp, afterDn };
    });
    expect(out.afterUp).toEqual(['one', 'three', 'two']);
    expect(out.afterDn).toEqual(['three', 'one', 'two']);
  });

  test('rows with a blank required field are dropped from getSteps', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const out = await page.evaluate(() => {
      const ed = window.buildChainEditor(null, {});
      ed.addStep({ action: 'grant', name: '' });          // blank name → dropped
      ed.addStep({ action: 'grant', name: 'Keep' });
      ed.addStep({ action: 'grantBit', flag: '' });       // blank flag → dropped
      return ed.getSteps();
    });
    expect(out).toEqual([{ action: 'grant', name: 'Keep' }]);
  });

  test('codec parity: getSteps() ≡ parseItemChainText for the equivalent text', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const out = await page.evaluate(() => {
      const text = [
        'grant | Pip Bead | 🪵 | misc | 1 | a token',
        'take | Trust | all',
        'grantBit | done | Done',
        'takeBit | done',
      ].join('\n');
      const parsed = window.parseItemChainText(text);
      const ed = window.buildChainEditor(null, { initial: parsed });
      return { parsed, fromWidget: ed.getSteps() };
    });
    // The widget is a strict superset: with no `once` toggled, it reproduces the codec exactly.
    expect(out.fromWidget).toEqual(out.parsed);
  });

  test('factory returns independent instances (no shared singleton state)', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    const out = await page.evaluate(() => {
      const a = window.buildChainEditor(null, { initial: [{ action: 'grantBit', flag: 'aaa' }] });
      const b = window.buildChainEditor(null, { initial: [{ action: 'grantBit', flag: 'bbb' }] });
      a.addStep({ action: 'takeBit', flag: 'extra' });    // mutate A only
      return { a: a.getSteps(), b: b.getSteps() };
    });
    expect(out.a).toEqual([{ action: 'grantBit', flag: 'aaa' }, { action: 'takeBit', flag: 'extra' }]);
    expect(out.b).toEqual([{ action: 'grantBit', flag: 'bbb' }]);   // unaffected
  });
});
