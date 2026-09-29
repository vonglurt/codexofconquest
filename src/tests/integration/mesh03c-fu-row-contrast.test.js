// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §MESH-03c-FU — a server row is readable wherever it renders: the map sheet's
// Connect and Discover panes (cream) as well as the Shift+🌐 modal (dark).
const { test, expect } = require('@playwright/test');

test('server-row text and badges meet 4.5:1 against the row in every container', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/play.html');
  await page.locator('#story-panel').waitFor({ state: 'visible' });
  const out = await page.evaluate(() => {
    switchSheet('sheet-map');
    const lum = (rgb) => {
      const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(v => {
        v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const bgOf = (el) => {
      for (let e = el; e; e = e.parentElement) {
        const c = getComputedStyle(e).backgroundColor;
        if (c && !/rgba\(.*,\s*0\)$/.test(c) && c !== 'transparent') return c;
      }
      return 'rgb(255, 255, 255)';
    };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const res = {};
    for (const [pane, cont] of [['msub-connect', 'mc-server-rows'], ['msub-discover', 'md-server-rows'], [null, 'mp-server-rows']]) {
      if (pane) msubSwitch(pane);
      const el = document.getElementById(cont);
      el.innerHTML = _mpServerRowHtml({ addr: 'localhost:1379', name: 'n', worldTag: 'CodexOfConquest-387e8', playerCount: 0, engineVer: 'other~x' }, 0, cont + '-ping-');
      const row = el.firstElementChild;
      row.querySelector('[id$="-world-0"]').innerHTML =
        _mpWorldBadge({ universeHash: 'u', contentHash: 'a' }, { universeHash: 'u', contentHash: 'b' }) +
        _mpWorldBadge({ universeHash: 'v' }, { universeHash: 'u' });
      const worst = [...row.querySelectorAll('b, span')].filter(s => s.textContent.trim())
        .map(s => ({ t: s.textContent.trim().slice(0, 30), r: ratio(getComputedStyle(s).color, bgOf(s)) }))
        .sort((p, q) => p.r - q.r)[0];
      res[cont] = worst;
    }
    return res;
  });
  for (const [cont, w] of Object.entries(out)) expect(w.r, `${cont}: "${w.t}"`).toBeGreaterThanOrEqual(4.5);
});
