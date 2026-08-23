// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { seedAndLoad, dismissContinue } = require('./helpers');

// ── §MESH-01j — client duel rung ─────────────────────────────────────────────
//
// The client half of consensual PvP duels (server half + protocol: mud-harness
// [O]; kernel parity: npm run check:duelparity). These cases pin: the inlined
// DUEL:CORE kernel (sha256, bounds, deterministic run), the derivable
// _duelStatBlock (always within DUEL.checkBounds — the server would reject it
// otherwise), the presence-strip ⚔ rules (same-origin players only, never
// sentries/remotes), the pvp:off opt-out, and the no-stakes invariant (a duel
// never mutates S_story). The full two-browser handshake is the E2E below.

test.describe('§MESH-01j — client duel rung', () => {

  test('DUEL:CORE kernel is inlined: sha256, canonical, deterministic run', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const out = {};
      out.hasKernel = typeof DUEL === 'object' && typeof DUEL.run === 'function';
      // FIPS-180 test vector — the pure-JS sha256 must be the real thing.
      out.sha = DUEL.sha256('abc') === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
      const A = { pid: 'x:1', level: 3, hp: 44, ac: 15, atkBonus: 5, dmgDie: 8, dmgFlat: 3, abilityScores: { str: 16, dex: 12, con: 14, int: 10, wis: 12, cha: 8 } };
      const B = { pid: 'y:2', level: 3, hp: 40, ac: 14, atkBonus: 6, dmgDie: 6, dmgFlat: 2, abilityScores: { str: 14, dex: 14, con: 12, int: 10, wis: 10, cha: 10 } };
      const seed = DUEL.seedOf('a'.repeat(32), 'b'.repeat(32), 'c'.repeat(32));
      const r1 = DUEL.run(A, B, seed), r2 = DUEL.run(A, B, seed);
      out.deterministic = JSON.stringify(r1) === JSON.stringify(r2);
      out.winnerIsPid = [A.pid, B.pid].includes(r1.winner);
      out.bounds = DUEL.checkBounds(A) === null && DUEL.checkBounds({ ...A, level: 21 }) !== null;
      return out;
    });
    expect(r.hasKernel).toBe(true);
    expect(r.sha).toBe(true);
    expect(r.deterministic).toBe(true);
    expect(r.winnerIsPid).toBe(true);
    expect(r.bounds).toBe(true);
  });

  test('_duelStatBlock: derived from the live save and ALWAYS within DUEL.checkBounds', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const out = {};
      const sb1 = _duelStatBlock();
      out.ok1 = DUEL.checkBounds(sb1) === null;
      // Even a save with wild values clamps into legal range (the server would
      // reject an out-of-bounds block at reveal — the client must never send one).
      const saved = { level: S_story.level, hpMax: S_story.hpMax, atkBonus: S_story.atkBonus };
      S_story.level = 99; S_story.hpMax = 9999; S_story.atkBonus = 50;
      const sb2 = _duelStatBlock();
      out.ok2 = DUEL.checkBounds(sb2) === null;
      Object.assign(S_story, saved);
      return out;
    });
    expect(r.ok1).toBe(true);
    expect(r.ok2).toBe(true);
  });

  test('_mpRenderPresence: ⚔ only for SAME-origin players with a ledgerPid — never remotes or sentries', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const out = {};
      MP.on = true;
      MP.players = [
        { pid: 'aa:1', ledgerPid: 'aa:p1', name: 'Duelist', kind: 'player' },
        { pid: 'bb:2', ledgerPid: 'bb:p2', name: 'FarFriend', server: 'bb000000' },   // cross-origin: ⇄ yes, ⚔ no
        { pid: 'aa:3', ledgerPid: 'aa:p3', name: 'Watchpost', kind: 'sentry' },
      ];
      _mpRenderPresence();
      const html = document.getElementById('mp-presence').innerHTML;
      out.duelBtns = (html.match(/mp-duel-btn/g) || []).length;    // exactly one: Duelist
      out.tradeBtns = (html.match(/mp-trade-btn/g) || []).length;  // two: Duelist + FarFriend
      MP.on = false; MP.players = [];
      _mpRenderPresence();
      return out;
    });
    expect(r.duelBtns).toBe(1);
    expect(r.tradeBtns).toBe(2);
  });

  test('pvp opt-out: toggle persists in the save; disconnect clears duel state + modal', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const out = {};
      mpDuelPvpToggle(true);
      out.off = S_story.pvpOff === true;
      mpDuelPvpToggle(false);
      out.on = S_story.pvpOff === false;
      MP.on = true; MP.duel = { duelId: 'x'.repeat(32) };
      document.getElementById('mp-duel-modal').classList.add('visible');
      mpDisconnect();
      out.cleared = MP.duel === null;
      out.modalClosed = !document.getElementById('mp-duel-modal').classList.contains('visible');
      return out;
    });
    expect(r.off).toBe(true);
    expect(r.on).toBe(true);
    expect(r.cleared).toBe(true);
    expect(r.modalClosed).toBe(true);
  });
});

// ── End-to-end: two REAL clients duel over a throwaway server ────────────────
// The whole rung through the actual UI: ⚔ challenge, SSE-driven incoming
// modal, Accept (= commit), auto commit/reveal, DUEL:CORE playback with the
// "Replay verified ✓" line on BOTH screens, one VICTORY + one DEFEAT, and the
// no-stakes invariant (neither save changes).
const DUEL_PORT = 13896;
let duelServer, duelDir;

test.describe('§MESH-01j — end-to-end duel (two real clients)', () => {
  test.beforeAll(async () => {
    duelDir = fs.mkdtempSync(path.join(os.tmpdir(), 'r2h-duel-e2e-'));
    duelServer = spawn(process.execPath, ['src/js/wbapi-server.js'], {
      env: { ...process.env, PORT: String(DUEL_PORT), MESH_SERVER_ID: 'd'.repeat(32),
        LEDGER_DIR: duelDir, PEERS_CACHE_FILE: path.join(duelDir, 'peers-cache.json') },
      stdio: 'ignore',
    });
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch(`http://localhost:${DUEL_PORT}/api/ping`)).ok) return; } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(`throwaway wbapi-server did not answer on :${DUEL_PORT}`);
  });
  test.afterAll(() => { if (duelServer) { try { duelServer.kill('SIGTERM'); } catch {} } });

  async function loadPlayer(browser, name) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await seedAndLoad(page, { playerName: name, currentCode: 'LHR', checkpointNode: 'LHR', visited: { LHR: true } });
    await dismissContinue(page);
    await page.evaluate((port) => localStorage.setItem('mpServer', `http://localhost:${port}`), DUEL_PORT);
    return { ctx, page };
  }

  test('⚔ challenge → accept → commit-reveal → verified playback on both screens, saves untouched', async ({ browser }) => {
    const a = await loadPlayer(browser, 'Vera');    // challenger
    const b = await loadPlayer(browser, 'Wilbur');  // challenged

    await a.page.click('#mp-toggle');
    await expect(a.page.locator('#mp-status')).toContainText('🟢 Vera');
    await b.page.click('#mp-toggle');
    await expect(b.page.locator('#mp-status')).toContainText('🟢 Wilbur');

    const snapA = await a.page.evaluate(() => JSON.stringify({ hp: S_story.hp, gold: S_story.gold, xp: S_story.xp, inv: (S_story.inventory || []).length }));
    const snapB = await b.page.evaluate(() => JSON.stringify({ hp: S_story.hp, gold: S_story.gold, xp: S_story.xp, inv: (S_story.inventory || []).length }));

    // Vera sees Wilbur with a ⚔ button (nudge a beacon per poll round).
    await expect.poll(async () => a.page.evaluate(async () => {
      await mpBeacon();
      return MP.players.some(p => p.ledgerPid && !p.server && p.name === 'Wilbur');
    }), { timeout: 15000 }).toBe(true);
    await a.page.click('#mp-presence .mp-duel-btn');
    await expect(a.page.locator('#mp-duel-modal')).toBeVisible();
    await expect(a.page.locator('#mp-duel-title')).toContainText('CHALLENGE SENT');

    // Wilbur's incoming modal over SSE; Accept = consent + commit; the rest of
    // the commit-reveal handshake is SSE-driven with no further clicks.
    await expect(b.page.locator('#mp-duel-modal')).toBeVisible({ timeout: 15000 });
    await expect(b.page.locator('#mp-duel-title')).toContainText('CHALLENGED');
    await b.page.click('#mp-duel-primary');

    // Both screens play the SAME pure-kernel transcript and verify the verdict.
    await expect(a.page.locator('#mp-duel-log')).toContainText('Replay verified ✓', { timeout: 20000 });
    await expect(b.page.locator('#mp-duel-log')).toContainText('Replay verified ✓', { timeout: 20000 });
    const titleA = await a.page.locator('#mp-duel-title').textContent();
    const titleB = await b.page.locator('#mp-duel-title').textContent();
    expect([titleA, titleB].filter(t => t.includes('VICTORY')).length).toBe(1);
    expect([titleA, titleB].filter(t => t.includes('DEFEAT')).length).toBe(1);

    // No stakes in v1: NOTHING about either save changed.
    expect(await a.page.evaluate(() => JSON.stringify({ hp: S_story.hp, gold: S_story.gold, xp: S_story.xp, inv: (S_story.inventory || []).length }))).toBe(snapA);
    expect(await b.page.evaluate(() => JSON.stringify({ hp: S_story.hp, gold: S_story.gold, xp: S_story.xp, inv: (S_story.inventory || []).length }))).toBe(snapB);

    // The outcome is on the ledger: one duel event in BOTH players' chains.
    const pidA = await a.page.evaluate(() => MP.ledgerPid);
    const pidB = await b.page.evaluate(() => MP.ledgerPid);
    for (const pid of [pidA, pidB]) {
      const chain = await (await fetch(`http://localhost:${DUEL_PORT}/api/ledger/chain?pid=${pid}`)).json();
      expect(chain.events.some(e => e.kind === 'duel' && [pidA, pidB].includes(e.body.winner))).toBe(true);
    }

    await a.ctx.close();
    await b.ctx.close();
  });
});
