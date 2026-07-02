'use strict';
// §MESH-01a — two-browser presence smoke: the REAL client flow end-to-end.
// Spawns a throwaway wbapi-server (never the dev :1367), loads the game in two
// isolated browser contexts, connects both via the 🌐 toggle, and asserts:
// co-presence ("Also here:"), exactly-once chat via SSE, and player_left on
// departure. Multiplayer stays strictly opt-in — a page that never clicks 🌐
// is asserted to keep MP off.
const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const { seedAndLoad, dismissContinue } = require('./helpers');

const MP_PORT = 13891;
const TRK_PORT = 13892;   // §MESH-01-FU 2: tracker for the join-by-magnet flow
let server, tracker;

const TMP = require('os').tmpdir();
test.beforeAll(async () => {
  tracker = spawn(process.execPath, ['wbapi-server.js', '--tracker-mode'], {
    env: { ...process.env, PORT: String(TRK_PORT), MESH_SERVER_ID: 'b'.repeat(32),
      PEERS_CACHE_FILE: `${TMP}/r2h-presence-trk-cache.json` },
    stdio: 'ignore',
  });
  server = spawn(process.execPath, ['wbapi-server.js'], {
    env: { ...process.env, PORT: String(MP_PORT), MESH_SERVER_ID: 'a'.repeat(32),
      TRACKER_URL: `http://localhost:${TRK_PORT}`, MESH_ANNOUNCE_MS: '200',
      SERVER_NAME: 'Hub Alpha', PEERS_CACHE_FILE: `${TMP}/r2h-presence-srv-cache.json` },
    stdio: 'ignore',
  });
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://localhost:${MP_PORT}/api/ping`);
      const t = await fetch(`http://localhost:${TRK_PORT}/api/ping`);
      if (r.ok && t.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`throwaway wbapi-server/tracker did not answer on :${MP_PORT}/:${TRK_PORT}`);
});
test.afterAll(() => {
  for (const p of [server, tracker]) if (p) { try { p.kill('SIGTERM'); } catch {} }
});

// Load a seeded game at the LHR hub and point its MP module at the throwaway
// server. mpServer is read from localStorage at CONNECT time (mpToggle), so
// setting it post-load avoids fighting seedAndLoad's localStorage.clear().
async function loadPlayer(browser, name) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await seedAndLoad(page, { playerName: name, currentCode: 'LHR', checkpointNode: 'LHR', visited: { LHR: true } });
  await dismissContinue(page);
  await page.evaluate((port) => localStorage.setItem('mpServer', `http://localhost:${port}`), MP_PORT);
  return { ctx, page };
}

test.describe('§MESH-01a — multiplayer presence (two real clients)', () => {
  test('connect, co-presence, chat, departure — full flow', async ({ browser }) => {
    const a = await loadPlayer(browser, 'Aldona');
    const b = await loadPlayer(browser, 'Borys');

    // A connects alone — status green, no one else here.
    await a.page.click('#mp-toggle');
    await expect(a.page.locator('#mp-status')).toContainText('🟢 Aldona');
    await expect(a.page.locator('#mp-presence')).toHaveText('');

    // B connects at the same cell — B's pos response lists Aldona; A learns of
    // Borys via the session/start announce over SSE.
    await b.page.click('#mp-toggle');
    await expect(b.page.locator('#mp-status')).toContainText('🟢 Borys');
    await expect(b.page.locator('#mp-presence')).toContainText('Aldona');
    await expect(a.page.locator('#mp-presence')).toContainText('Borys');

    // Chat: B says a line; BOTH clients render it exactly once through SSE
    // (sender included — §WALK-5 exactly-once broadcast).
    await b.page.fill('#mp-chat-input', 'ahoy from the hub');
    await b.page.press('#mp-chat-input', 'Enter');
    await expect(a.page.locator('#story-move-msg')).toContainText('💬 Borys: ahoy from the hub');
    await expect(b.page.locator('#story-move-msg')).toContainText('💬 Borys: ahoy from the hub');

    // A steps east (named cell BMA) — the beacon fires player_left at the hub,
    // so Borys's "Also here" empties; Aldona's shows no one at BMA.
    await a.page.click('#btn-E');
    await expect(b.page.locator('#mp-presence')).not.toContainText('Aldona');
    await expect(a.page.locator('#mp-presence')).not.toContainText('Borys');

    // Disconnect A — status returns to off, chat input hides.
    await a.page.click('#mp-toggle');
    await expect(a.page.locator('#mp-status')).toHaveText('off');
    await expect(a.page.locator('#mp-chat-input')).toBeHidden();

    await a.ctx.close();
    await b.ctx.close();
  });

  test('server browser: Shift+🌐, paste magnet, resolve via tracker, join (§MESH-01-FU 2)', async ({ browser }) => {
    // Wait until the tracker has the game server's announce record.
    const man = await (await fetch(`http://localhost:${MP_PORT}/api/manifest`)).json();
    for (let i = 0; i < 50; i++) {
      const t = await (await fetch(`http://localhost:${TRK_PORT}/api/tracker/peers?wh=${man.worldHash}`)).json();
      if (t.count >= 1) break;
      await new Promise((r) => setTimeout(r, 200));
    }

    const d = await loadPlayer(browser, 'Runa');
    // Point mpServer somewhere dead so the Join click has to rewrite it.
    await d.page.evaluate(() => localStorage.setItem('mpServer', 'http://localhost:9'));

    // Shift+🌐 opens the browser WITHOUT creating any MP state (still opt-in).
    await d.page.click('#mp-toggle', { modifiers: ['Shift'] });
    await expect(d.page.locator('#mp-browser-modal')).toBeVisible();
    expect(await d.page.evaluate(() => ({ on: MP.on, session: MP.session }))).toEqual({ on: false, session: null });

    // Paste the magnet (as copied from the Mesh tab) and resolve via the tracker.
    const magnet = `r2h:?p=${man.proto}&ev=${encodeURIComponent(man.engineVer)}&wh=${man.worldHash}&tr=http://localhost:${TRK_PORT}`;
    await d.page.fill('#mp-magnet-input', magnet);
    await d.page.click('#mp-browser-resolve');
    const row = d.page.locator('.mp-srv-row');
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('Hub Alpha');                                  // server name
    await expect(row).toContainText(`Roll2Hit-${man.worldHash.slice(0, 5)}`);      // world tag
    await expect(row.locator('[id^=mp-srv-ping]')).toHaveText(/\d+ ms/);           // real ping

    // Join: rewrites mpServer to the tracker-resolved addr and connects.
    await row.locator('button.mp-srv-join').click();
    await expect(d.page.locator('#mp-status')).toContainText('🟢 Runa');
    expect(await d.page.evaluate(() => localStorage.getItem('mpServer')))
      .toBe(`http://localhost:${MP_PORT}`);
    await d.ctx.close();
  });

  test('multiplayer is strictly opt-in — no MP state without the 🌐 click', async ({ browser }) => {
    const c = await loadPlayer(browser, 'Cezar');
    await expect(c.page.locator('#mp-status')).toHaveText('off');
    await expect(c.page.locator('#mp-chat-input')).toBeHidden();
    // top-level `const MP` lives in the global lexical scope, not on window
    const mpState = await c.page.evaluate(() => ({ on: MP.on, session: MP.session }));
    expect(mpState).toEqual({ on: false, session: null });
    await c.ctx.close();
  });
});
