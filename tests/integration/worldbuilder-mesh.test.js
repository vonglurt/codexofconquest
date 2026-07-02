'use strict';
const { test, expect } = require('@playwright/test');

// ── §MESH-01 UI — 🌐 Mesh tab: trackers, peers, remote players, packet log ────
// The tab is a pure read-only view of GET /api/mesh/status. These tests are
// server-free: the render fn is exposed at window.__meshTest.renderMeshStatus
// and fed a fixture; the live poll path is only asserted for its offline
// fallback (no WBAPI server behind the static test host).

const FIXTURE = {
  ok: true, trackerMode: false, serverId: 'a1b2c3d4', addr: 'localhost:1367',
  proto: 1, engineVer: 'r2h-3.104.0', worldHash: 'feedfacefeedface',
  acl: { mode: 'open', file: 'mesh-acl.json' }, localPlayers: 2,
  trackerUrls: ['http://tracker.example:1368'],
  trackerGroups: [{ engineVer: 'r2h-3.104.0', worldHash: 'feedfacefeedface', servers: 3, players: 7 }],
  peers: [
    { addr: 'localhost:2367', serverId: 'beefbeef', live: true, lastSeenMs: 900, lastErr: null },
    { addr: '10.0.0.9:1367', serverId: null, live: false, lastSeenMs: null, lastErr: 'unreachable' },
  ],
  remotePlayers: [{ name: 'Borys', r: 10, c: 198, server: 'beefbeef' }],
  traffic: [
    { ts: 1700000000000, dir: 'out', kind: 'gossip', peer: 'localhost:2367', ok: true, note: '⇄ 3 ev · snap 1 · 2 px' },
    { ts: 1700000001000, dir: 'in', kind: 'gossip', peer: 'localhost:2367', ok: false, note: 'refused: incompatible (r2h-9/deadbeef)' },
  ],
};

test.describe('🌐 Mesh tab (§MESH-01 UI)', () => {
  test('tab activates and renders a full status fixture', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.click('.nav-tab[data-tab="mesh"]');
    await expect(page.locator('#tab-mesh')).toHaveClass(/active/);
    // no WBAPI behind the static test server → offline fallback line
    await expect(page.locator('#mesh-identity')).toContainText('unreachable');

    await page.evaluate((d) => window.__meshTest.renderMeshStatus(d), FIXTURE);
    await expect(page.locator('#mesh-identity')).toContainText('a1b2c3d4');
    await expect(page.locator('#mesh-identity')).toContainText('feedfacefeedface');
    await expect(page.locator('#mesh-trackers')).toContainText('http://tracker.example:1368');
    await expect(page.locator('#mesh-trackers')).toContainText('3 server(s), 7 player(s)');
    await expect(page.locator('#mesh-peers')).toContainText('localhost:2367');
    await expect(page.locator('#mesh-peers')).toContainText('unreachable');
    await expect(page.locator('#mesh-remotes')).toContainText('Borys');
    await expect(page.locator('#mesh-remotes')).toContainText('(10,198)');
    const pkts = page.locator('#mesh-traffic > div');
    await expect(pkts).toHaveCount(2);
    await expect(pkts.nth(0)).toContainText('➡ out');
    await expect(pkts.nth(0)).toContainText('✅');
    await expect(pkts.nth(1)).toContainText('⬅ in');
    await expect(pkts.nth(1)).toContainText('refused: incompatible');
  });

  test('empty status renders friendly placeholders (no peers / no packets)', async ({ page }) => {
    await page.goto('/worldbuilder.html');
    await page.click('.nav-tab[data-tab="mesh"]');
    await page.evaluate(() => window.__meshTest.renderMeshStatus({
      ok: true, trackerMode: false, serverId: 'a1b2c3d4', addr: 'localhost:1367',
      proto: 1, engineVer: 'r2h-3.104.0', worldHash: 'feedfacefeedface',
      acl: { mode: 'open' }, localPlayers: 0, trackerUrls: [], trackerGroups: [],
      peers: [], remotePlayers: [], traffic: [],
    }));
    await expect(page.locator('#mesh-trackers')).toContainText('no tracker configured');
    await expect(page.locator('#mesh-peers')).toContainText('no peers yet');
    await expect(page.locator('#mesh-remotes')).toContainText('no remote players');
    await expect(page.locator('#mesh-traffic')).toContainText('no packets yet');
  });
});
