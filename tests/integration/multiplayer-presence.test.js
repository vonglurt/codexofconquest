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
let server;

test.beforeAll(async () => {
  server = spawn(process.execPath, ['wbapi-server.js'], {
    env: { ...process.env, PORT: String(MP_PORT) },
    stdio: 'ignore',
  });
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://localhost:${MP_PORT}/api/ping`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`throwaway wbapi-server did not answer on :${MP_PORT}`);
});
test.afterAll(() => { if (server) { try { server.kill('SIGTERM'); } catch {} } });

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
