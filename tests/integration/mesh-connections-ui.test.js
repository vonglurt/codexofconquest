// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
'use strict';
const { test, expect } = require('@playwright/test');

// ── §MESH-02f — Map-Tab Connection Center, hermetic client rung ──────────────
//
// Committed distillation of the (b)–(e) scratch smokes (design:
// lab-reports/lab-report-mesh02-connections-ui.md). Everything runs against
// window.__mesh02 server-free hooks behind a route firewall installed BEFORE
// page.goto (§NAV-01g rule): :1367 — and every other host — aborts, so a live
// dev server can never leak in; two fixture hosts serve server-list files.
// Pinned here: sub-tab switching (click wiring + msubSwitch hook),
// mpParseServerList txt/JSON/garbage, the client blacklist (match matrix,
// _mpRenderServerRows row-filter on a pane container, mpJoin refusal), and D4
// auto-fetch gating (_mdHostApproved + pane-open auto-load fires for
// whitelisted hosts only). Server half: mud-harness [R]; live two-server
// verification: the (b)–(e) ship records in plan.md.

const CORS = { 'access-control-allow-origin': '*' };

// Requests the firewall aborted for the D4 never-fetched assertion.
let deniedFetches;

async function loadHermetic(page) {
  deniedFetches = 0;
  await page.route('**/*', (route) => {
    const u = route.request().url();
    // the static game file (and any asset) from the Playwright webServer
    if (u.startsWith('http://localhost:7654/')) return route.continue();
    if (u === 'http://allowed.example/list.txt')
      return route.fulfill({ headers: CORS, contentType: 'text/plain',
        body: '# my servers\nstub1:1401\nstub1:1401   # duplicate line\nnot a server line\n' });
    if (u === 'http://denied.example/list.txt') { deniedFetches++; return route.abort(); }
    if (u === 'http://manual.example/list.json')
      return route.fulfill({ headers: CORS, contentType: 'application/json',
        body: JSON.stringify(['stub2:1402', { addr: 'stub3:1403', name: 'Named Stub' }, 'garbage entry']) });
    return route.abort();   // :1367 and everything else — hermetic
  });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.goto('/index.html');
  await page.waitForFunction(() => typeof window.__mesh02 === 'object');
  return pageErrors;
}

test.describe('§MESH-02f — connection-center UI (hermetic, :1367 route-blocked)', () => {

  test('sub-tab shell: 6 tabs / 6 panes, map default-active, click + hook switching both ways', async ({ page }) => {
    const pageErrors = await loadHermetic(page);
    const r = await page.evaluate(() => {
      const out = {};
      const tabs = [...document.querySelectorAll('#map-subtab-bar .map-subtab')];
      const panes = [...document.querySelectorAll('#sheet-map .map-subpane')];
      out.tabIds = tabs.map((t) => t.dataset.msub).join(',');
      out.paneIds = panes.map((p) => p.id).join(',');
      const active = () => ({
        pane: panes.filter((p) => p.classList.contains('msub-active')).map((p) => p.id).join(','),
        tab: tabs.filter((t) => t.classList.contains('msub-active')).map((t) => t.dataset.msub).join(','),
      });
      out.boot = active();
      // real click wiring (DOM click — the sheet may be off-screen headless)
      tabs.find((t) => t.dataset.msub === 'msub-lists').click();
      out.clicked = active();
      // hook switching back
      window.__mesh02.msubSwitch('msub-map');
      out.hooked = active();
      return out;
    });
    // §MP-MAPTABS: World + Full map tabs inserted between Local(map) and Multiplayer(connect)
    expect(r.tabIds).toBe('msub-map,msub-world,msub-full,msub-connect,msub-discover,msub-lists');
    expect(r.paneIds).toBe('msub-map,msub-world,msub-full,msub-connect,msub-discover,msub-lists');
    expect(r.boot).toEqual({ pane: 'msub-map', tab: 'msub-map' });
    expect(r.clicked).toEqual({ pane: 'msub-lists', tab: 'msub-lists' });
    expect(r.hooked).toEqual({ pane: 'msub-map', tab: 'msub-map' });
    expect(pageErrors).toEqual([]);
  });

  test('mpParseServerList: txt — comments stripped, deduped, addr/url/magnet classified', async ({ page }) => {
    await loadHermetic(page);
    const p = await page.evaluate(() => window.__mesh02.mpParseServerList(
      '# comment line\nhost1:1401\nhost1:1401\nhttp://tracker.example/\nr2h:?p=x&wh=y&tr=http://t.example\nnot!valid\nhost2:1402  # trailing comment\n'));
    expect(p.length).toBe(4);
    expect(p[0].addr).toBe('host1:1401');
    expect(p[1].url).toBe('http://tracker.example');
    expect(p[2].magnet).toBeTruthy();
    expect(p[3].addr).toBe('host2:1402');
  });

  test('mpParseServerList: JSON strings + {addr,name} objects; garbage/bad JSON/empty → []', async ({ page }) => {
    await loadHermetic(page);
    const p = await page.evaluate(() => ({
      json: window.__mesh02.mpParseServerList('["a:1401", {"addr":"b:1402","name":"Bee"}, "r2h:?tr=http://t.example", 42, "junk"]'),
      badJson: window.__mesh02.mpParseServerList('[not json'),
      garbage: window.__mesh02.mpParseServerList('total nonsense\nnothing here'),
      empty: window.__mesh02.mpParseServerList(''),
    }));
    expect(p.json.length).toBe(3);
    expect(p.json[0].addr).toBe('a:1401');
    expect(p.json[1].name).toBe('Bee');
    expect(p.json[2].magnet).toBeTruthy();
    expect(p.badJson).toEqual([]);
    expect(p.garbage).toEqual([]);
    expect(p.empty).toEqual([]);
  });

  test('_mpBlacklisted matrix: addr, url-form, bare host, serverId, worldHash hit; clean row passes', async ({ page }) => {
    await loadHermetic(page);
    const m = await page.evaluate(() => {
      window.__mesh02._mpSaveList('mpBlacklist', ['evil:1666', 'barehost', 'srvid42', 'hashdead']);
      const f = window.__mesh02._mpBlacklisted;
      return { addr: f('evil:1666'), url: f('http://evil:1666/'), host: f({ addr: 'barehost:9999' }),
        sid: f({ addr: 'ok:1', serverId: 'srvid42' }), wh: f({ addr: 'ok:1', worldHash: 'hashdead' }),
        clean: f({ addr: 'good:1367', serverId: 'nice', worldHash: 'livehash' }) };
    });
    expect(m.addr).toBeTruthy();
    expect(m.url).toBeTruthy();
    expect(m.host).toBeTruthy();
    expect(m.sid).toBeTruthy();
    expect(m.wh).toBeTruthy();
    expect(m.clean).toBeFalsy();
  });

  test('blacklist row-filter: _mpRenderServerRows hides addr- and serverId-blacklisted rows', async ({ page }) => {
    await loadHermetic(page);
    const r = await page.evaluate(() => {
      window.__mesh02._mpSaveList('mpBlacklist', ['evil:1666', 'srvid42']);
      window.__mesh02.msubSwitch('msub-discover');
      _mpRenderServerRows([
        { addr: 'good:1367', name: 'Good', playerCount: 0 },
        { addr: 'evil:1666', name: 'Evil', playerCount: 0 },
        { addr: 'ok2:1370', name: 'Sneaky', serverId: 'srvid42', playerCount: 0 },
      ], 'md-server-rows');
      const t = document.getElementById('md-server-rows').textContent;
      return { n: document.querySelectorAll('#md-server-rows .mp-srv-row').length,
        good: t.includes('good:1367'), evil: t.includes('evil'), sneaky: t.includes('Sneaky') };
    });
    expect(r.n).toBe(1);
    expect(r.good).toBe(true);
    expect(r.evil).toBe(false);
    expect(r.sneaky).toBe(false);
  });

  test('mpJoin refuses a blacklisted target: no mpServer write, MP stays off', async ({ page }) => {
    await loadHermetic(page);
    const r = await page.evaluate(() => {
      window.__mesh02._mpSaveList('mpBlacklist', ['evil:1666']);
      localStorage.removeItem('mpServer');
      mpJoin('evil:1666');
      return { server: localStorage.getItem('mpServer'), on: MP.on };
    });
    expect(r.server).toBeNull();
    expect(r.on).toBe(false);
  });

  test('D4 _mdHostApproved: hostname and host:port whitelist matching', async ({ page }) => {
    await loadHermetic(page);
    const a = await page.evaluate(() => {
      window.__mesh02._mpSaveList('mpWhitelist', ['allowed.example', 'porty.example:1450']);
      const f = window.__mesh02._mdHostApproved;
      return { byHost: f('http://allowed.example/list.txt'), byHostPort: f('http://porty.example:1450/x.txt'),
        wrongPort: f('http://porty.example:9999/x.txt'), unlisted: f('http://denied.example/list.txt'),
        badUrl: f('not a url') };
    });
    expect(a.byHost).toBeTruthy();
    expect(a.byHostPort).toBeTruthy();
    expect(a.wrongPort).toBeFalsy();
    expect(a.unlisted).toBeFalsy();
    expect(a.badUrl).toBeFalsy();
  });

  test('D4 auto-load on pane open: whitelisted auto source loads; non-whitelisted auto is NEVER fetched (⚠ row)', async ({ page }) => {
    const pageErrors = await loadHermetic(page);
    await page.evaluate(() => {
      window.__mesh02._mpSaveList('mpWhitelist', ['allowed.example']);
      window.__mesh02._mpSaveList('mpListSources', [
        { url: 'http://allowed.example/list.txt', auto: true },
        { url: 'http://denied.example/list.txt', auto: true },   // auto but NOT whitelisted
      ]);
      document.getElementById('md-server-rows').innerHTML = '';
      window.__mesh02.msubSwitch('msub-map');
      window.__mesh02.msubSwitch('msub-discover');   // pane open fires _mdOnOpen
    });
    await page.waitForFunction(() =>
      document.getElementById('md-server-rows').querySelectorAll('.mp-srv-row').length > 0);
    const r = await page.evaluate(() => ({
      note: document.getElementById('md-note').textContent,
      row: document.getElementById('md-server-rows').textContent,
      rowCount: document.getElementById('md-server-rows').querySelectorAll('.mp-srv-row').length,
      warn: document.getElementById('md-source-rows').innerHTML.includes('⚠'),
    }));
    expect(r.rowCount).toBe(1);
    expect(r.row).toContain('stub1:1401');
    expect(r.note).toContain('auto source');
    expect(r.warn).toBe(true);            // the denied auto source is flagged, not fetched
    expect(deniedFetches).toBe(0);        // D4: never fetched
    expect(pageErrors).toEqual([]);
  });
});
