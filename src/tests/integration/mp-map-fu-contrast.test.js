// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §MP-MAP-FU — every visible line of text in the map sheet's Multiplayer, Discover
// and Lists panes reads at WCAG AA (4.5:1) against what is actually behind it,
// translucent backgrounds composited over the cream sheet.
const { test, expect } = require('@playwright/test');

test('the Multiplayer, Discover and Lists panes meet 4.5:1 on every visible text node', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/play.html');
  await page.locator('#story-panel').waitFor({ state: 'visible' });
  const bad = await page.evaluate(() => {
    const rgba = (s) => { const m = s.match(/[\d.]+/g).map(Number); return [m[0], m[1], m[2], m.length > 3 ? m[3] : 1]; };
    const over = (top, under) => [0, 1, 2].map((i) => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
    const behind = (el) => {
      const layers = [];
      for (let e = el; e; e = e.parentElement) {
        const c = rgba(getComputedStyle(e).backgroundColor);
        if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
      }
      let acc = [255, 255, 255, 1];
      for (const l of layers.reverse()) acc = over(l, acc);
      return acc;
    };
    const lum = (c) => 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
    const ch = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    switchSheet('sheet-map');
    const out = [];
    for (const pane of ['msub-connect', 'msub-discover', 'msub-lists']) {
      msubSwitch(pane);
      if (pane === 'msub-connect') { _mpRenderMapPresence(); _mpMapChatRender(); }
      const w = document.createTreeWalker(document.getElementById(pane), NodeFilter.SHOW_TEXT);
      for (let t; (t = w.nextNode());) {
        const el = t.parentElement;
        if (!t.textContent.trim() || !el.offsetParent || el.closest('input, textarea, select')) continue;
        const bg = behind(el), fg = over(rgba(getComputedStyle(el).color), bg);
        const r = ratio(fg, bg);
        if (r < 4.5) out.push(`${pane} ${r.toFixed(2)} "${t.textContent.trim().slice(0, 40)}"`);
      }
    }
    return out;
  });
  expect(bad, bad.join('\n')).toEqual([]);
});
