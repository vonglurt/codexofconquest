// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
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
  worldName: 'CodexOfConquest', worldTag: 'CodexOfConquest-feedf',
  acl: { mode: 'open', file: 'mesh-acl.json' }, localPlayers: 2,
  reachability: { bind: '127.0.0.1', advertise: 'localhost:1367', warnings: [
    'bind is loopback (127.0.0.1) — remote machines cannot reach this server. Start with --bind 0.0.0.0 (or BIND_ADDR=0.0.0.0).',
  ] },
  trackerUrls: ['http://tracker.example:1368'],
  trackerGroups: [{ engineVer: 'r2h-3.104.0', worldHash: 'feedfacefeedface', worldTag: 'Roll2Hit-feedf', servers: 3, players: 7 }],
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
    await page.goto('/edit.html');
    await page.click('.nav-tab[data-tab="mesh"]');
    await expect(page.locator('#tab-mesh')).toHaveClass(/active/);
    // no WBAPI behind the static test server → offline fallback line
    await expect(page.locator('#mesh-identity')).toContainText('unreachable');

    await page.evaluate((d) => window.__meshTest.renderMeshStatus(d), FIXTURE);
    await expect(page.locator('#mesh-identity')).toContainText('a1b2c3d4');
    await expect(page.locator('#mesh-identity')).toContainText('feedfacefeedface');
    // §MESH-01-FU 1: reachability warnings surface on the identity strip
    await expect(page.locator('#mesh-identity')).toContainText('⚠ bind is loopback');
    // §MESH-01-FU 2: world tag on the identity strip + per world group
    await expect(page.locator('#mesh-identity')).toContainText('🌍 CodexOfConquest-feedf');
    await expect(page.locator('#mesh-trackers')).toContainText('Roll2Hit-feedf');
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

  test('⬇ world sits behind the BIG WARNING modal (§MESH-01d3)', async ({ page }) => {
    await page.goto('/edit.html');
    await page.click('.nav-tab[data-tab="mesh"]');
    await page.evaluate((d) => window.__meshTest.renderMeshStatus(d), FIXTURE);
    // magnet link lands on the identity strip (assert before the 2s offline
    // poll overwrites the strip — this static test host has no WBAPI behind it)
    await expect(page.locator('#mesh-identity')).toContainText('copy magnet');
    // live peer row carries the download button; dead peer does not
    await expect(page.locator('#mesh-peers button')).toHaveCount(1);
    await page.click('#mesh-peers button');
    const modal = page.locator('#mesh-dl-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("SOMEONE ELSE'S CODE");
    await expect(modal).toContainText('MIT-licensed');
    await expect(modal).toContainText('world-diff.js');
    await expect(modal).toContainText('localhost:2367');
    await page.click('#mesh-dl-modal button:has-text("Cancel")');
    await expect(modal).toBeHidden();
  });

  test('server browser renders tracker rows: name · world tag · players · ping (§MESH-01-FU 2)', async ({ page }) => {
    await page.goto('/edit.html');
    await page.click('.nav-tab[data-tab="mesh"]');
    await page.evaluate(() => window.__meshTest.renderServerBrowser([
      { serverId: 'aa', addr: 'localhost:59999', name: 'Hub Alpha', worldTag: 'NextWorldMod-131ea',
        worldHash: '131eabc131eabc00', playerCount: 3 },
      { serverId: 'bb', addr: 'not a valid addr <script>', name: 'evil', playerCount: 0 },
    ], 'feedfacefeedface'));
    const box = page.locator('#mesh-browser');
    await expect(box).toContainText('Hub Alpha');
    await expect(box).toContainText('NextWorldMod-131ea');   // the easy world handle
    await expect(box).toContainText('👥 3');
    await expect(box).toContainText('different world');       // hash ≠ own worldHash
    await expect(box).toContainText('unreachable');           // ping to a dead port fails
    await expect(box).not.toContainText('evil');               // malformed addr rows dropped
  });

  test('empty status renders friendly placeholders (no peers / no packets)', async ({ page }) => {
    await page.goto('/edit.html');
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
