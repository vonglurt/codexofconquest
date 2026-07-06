'use strict';
const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { seedAndLoad, dismissContinue } = require('./helpers');

// ── §MESH-01i slice 2b — client ledger rung ──────────────────────────────────
//
// The client half of the no-dupe economy ledger (server half: slice 1 + 2a,
// gated by mud-harness [I]/[I2]). These cases pin: the durable playerKey
// (generated ONCE, 32 hex, save-persisted — lab report §6.4), mint stamping at
// acquisition-while-connected (offline/SP acquisitions must stay untouched —
// the SP-byte-identical invariant), the tradeable-inventory filter, the
// trade_completed inventory mirror, and the presence-strip trade button rules.
// Pure page-context evaluation with _mpFetch stubbed — no server; the live
// endpoint round-trips are gated by mud-harness [I2] I12.

test.describe('§MESH-01i slice 2b — client ledger rung', () => {

  test('_mpPlayerKey: generates 32 lowercase hex ONCE, persists in S_story, replaces a malformed key', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      delete S_story.playerKey;
      const k1 = _mpPlayerKey();
      out.shape = /^[0-9a-f]{32}$/.test(k1);
      out.stored = S_story.playerKey === k1;
      out.stable = _mpPlayerKey() === k1;      // second call never regenerates
      S_story.playerKey = 'NOT-A-KEY';         // corrupt save → regenerate
      const k2 = _mpPlayerKey();
      out.replaced = /^[0-9a-f]{32}$/.test(k2) && k2 !== 'NOT-A-KEY';
      delete S_story.playerKey;
      return out;
    });
    expect(r.shape).toBe(true);
    expect(r.stored).toBe(true);
    expect(r.stable).toBe(true);
    expect(r.replaced).toBe(true);
  });

  test('mpMintStamp: stamps the SAME object via the mint response; never fires offline, on skip types, or twice', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(async () => {
      const out = {};
      const calls = [];
      const origFetch = _mpFetch;
      window._mpFetch = async (path, body) => { calls.push({ path, body }); return { ok: true, mintId: ['aa'.repeat(16), 7], mintKey: 'aa:7' }; };

      // Offline → hard no-op (SP byte-identical: the item object is untouched).
      MP.on = false; MP.session = null;
      const spItem = { name: 'Swamp Kelp', type: 'craft' };
      mpMintStamp(spItem);
      await Promise.resolve();
      out.offlineCalls = calls.length;
      out.offlineClean = !('mintId' in spItem) && !('mintKey' in spItem);

      // Connected → fires once, stamps mintId/mintKey onto the same reference.
      MP.on = true; MP.session = 'sess1';
      const item = { name: 'Poison Extract Flask', type: 'lake_magic' };
      S_story.inventory = S_story.inventory || [];
      S_story.inventory.push(item);
      mpMintStamp(item);
      await new Promise(res => setTimeout(res, 0));
      out.minted = item.mintKey === 'aa:7' && Array.isArray(item.mintId);
      out.sameRef = S_story.inventory[S_story.inventory.length - 1].mintKey === 'aa:7';
      out.mintBody = calls.length === 1 && calls[0].body.item.key === 'poison_extract_flask' && calls[0].body.item.qty === 1;

      // Already minted → never re-mints; progression types never mint.
      mpMintStamp(item);
      mpMintStamp({ name: 'Crimson Warrant (Shard #4)', type: 'shard' });
      mpMintStamp({ name: "Froberger's Last Note", type: 'key_item' });
      mpMintStamp({ name: 'Watch Token', type: 'mission_bit' });
      await new Promise(res => setTimeout(res, 0));
      out.noExtraCalls = calls.length === 1;

      window._mpFetch = origFetch;
      MP.on = false; MP.session = null;
      S_story.inventory.pop();
      return out;
    });
    expect(r.offlineCalls).toBe(0);
    expect(r.offlineClean).toBe(true);
    expect(r.minted).toBe(true);
    expect(r.sameRef).toBe(true);
    expect(r.mintBody).toBe(true);
    expect(r.noExtraCalls).toBe(true);
  });

  test('_mpTradeableInv: only minted, non-progression items are offered', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const saved = S_story.inventory;
      S_story.inventory = [
        { name: 'Minted Flask', type: 'lake_magic', mintKey: 'aa:1' },
        { name: 'Unminted Sword', type: 'mainweapon' },                       // no lineage → not tradeable
        { name: 'Minted Shard', type: 'shard', mintKey: 'aa:2' },             // progression → excluded even if stamped
        { name: 'Minted Kelp', type: 'craft', mintKey: 'aa:3' },
      ];
      const names = _mpTradeableInv().map(i => i.name);
      S_story.inventory = saved;
      return names;
    });
    expect(r).toEqual(['Minted Flask', 'Minted Kelp']);
  });

  test('_mpTradeApply: removes what I gave by mintKey, adds what I received with the ledger-resolved name', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(async () => {
      const out = {};
      const saved = S_story.inventory;
      const origFetch = _mpFetch;
      window._mpFetch = async (path) => {
        if (/ledger\/owner/.test(path)) return { ok: true, item: { key: 'yugurt_s_eye', name: "Yugurt's Eye", qty: 1 } };
        return { ok: false };
      };
      MP.ledgerPid = 'aaaaaaaa:11111111';
      S_story.inventory = [{ name: 'Minted Flask', type: 'lake_magic', mintKey: 'bb:1' }];
      const evt = { kind: 'trade', body: { transfers: [
        { mintId: ['bb'.repeat(16), 1], from: 'aaaaaaaa:11111111', to: 'cccccccc:22222222', priorEventHash: 'x' },
        { mintId: ['bb'.repeat(16), 2], from: 'cccccccc:22222222', to: 'aaaaaaaa:11111111', priorEventHash: 'y' },
      ] } };
      // mintKey in transfers derives from mintId[0]:mintId[1] — align the held item.
      S_story.inventory[0].mintKey = 'bb'.repeat(16) + ':1';
      await _mpTradeApply(evt);
      out.gaveRemoved = !S_story.inventory.some(i => i.name === 'Minted Flask');
      const got = S_story.inventory.find(i => i.name === "Yugurt's Eye");
      out.gotAdded = !!got && got.mintKey === 'bb'.repeat(16) + ':2' && got.code === 'trade';
      // A transfer between two OTHER parties never touches my inventory.
      const count = S_story.inventory.length;
      await _mpTradeApply({ kind: 'trade', body: { transfers: [
        { mintId: ['dd'.repeat(16), 9], from: 'eeeeeeee:1', to: 'ffffffff:2', priorEventHash: 'z' },
      ] } });
      out.bystander = S_story.inventory.length === count;
      window._mpFetch = origFetch;
      MP.ledgerPid = null;
      S_story.inventory = saved;
      return out;
    });
    expect(r.gaveRemoved).toBe(true);
    expect(r.gotAdded).toBe(true);
    expect(r.bystander).toBe(true);
  });

  test('_mpRenderPresence: ⇄ only for players WITH a ledgerPid — never sentries or SSE-only arrivals', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      MP.on = true;
      MP.players = [
        { pid: 'aa:1', ledgerPid: 'aa:p1', name: 'Trader', kind: 'player' },
        { pid: 'aa:2', name: 'JustArrived', kind: 'player' },                 // SSE-only: no ledgerPid yet
        { pid: 'aa:3', ledgerPid: 'aa:p3', name: 'Watchpost', kind: 'sentry' },
      ];
      _mpRenderPresence();
      const html = document.getElementById('mp-presence').innerHTML;
      out.buttons = (html.match(/mp-trade-btn/g) || []).length;   // exactly one: Trader
      out.names = ['Trader', 'JustArrived', 'Watchpost'].every(n => html.includes(n));
      MP.on = false; MP.players = [];
      _mpRenderPresence();
      out.cleared = document.getElementById('mp-presence').textContent === '';
      return out;
    });
    expect(r.buttons).toBe(1);
    expect(r.names).toBe(true);
    expect(r.cleared).toBe(true);
  });

  test('disconnect clears the trade identity and any open trade modal', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      MP.on = true; MP.ledgerPid = 'aa:11'; MP.trade = { dir: 'out', to: 'bb:22' };
      document.getElementById('mp-trade-modal').classList.add('visible');
      mpDisconnect();
      return {
        pid: MP.ledgerPid, trade: MP.trade,
        modalClosed: !document.getElementById('mp-trade-modal').classList.contains('visible'),
      };
    });
    expect(r.pid).toBe(null);
    expect(r.trade).toBe(null);
    expect(r.modalClosed).toBe(true);
  });
});

// ── End-to-end: two REAL clients trade over a throwaway server ───────────────
// The whole slice-2b flow through the actual UI: connect (playerKey generated
// + durable ledgerPid), mint, ⇄ button, propose (want-side), SSE-driven
// incoming modal, accept, and the co-signed event mirrored into BOTH
// inventories. Mirrors the multiplayer-presence two-browser pattern.
const MP_PORT = 13893;
let server, ledgerDir;

test.describe('§MESH-01i slice 2b — end-to-end trade (two real clients)', () => {
  test.beforeAll(async () => {
    ledgerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'r2h-ledger-e2e-'));
    server = spawn(process.execPath, ['wbapi-server.js'], {
      env: { ...process.env, PORT: String(MP_PORT), MESH_SERVER_ID: 'e'.repeat(32),
        LEDGER_DIR: ledgerDir, PEERS_CACHE_FILE: path.join(ledgerDir, 'peers-cache.json') },
      stdio: 'ignore',
    });
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch(`http://localhost:${MP_PORT}/api/ping`)).ok) return; } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(`throwaway wbapi-server did not answer on :${MP_PORT}`);
  });
  test.afterAll(() => { if (server) { try { server.kill('SIGTERM'); } catch {} } });

  async function loadPlayer(browser, name) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await seedAndLoad(page, { playerName: name, currentCode: 'LHR', checkpointNode: 'LHR', visited: { LHR: true } });
    await dismissContinue(page);
    await page.evaluate((port) => localStorage.setItem('mpServer', `http://localhost:${port}`), MP_PORT);
    return { ctx, page };
  }

  test('connect → durable identity → mint → propose → accept → both inventories updated', async ({ browser }) => {
    const a = await loadPlayer(browser, 'Trina');   // owns the item
    const b = await loadPlayer(browser, 'Ugo');     // asks for it

    // Trina connects: the save gains a playerKey and the session a durable pid.
    await a.page.click('#mp-toggle');
    await expect(a.page.locator('#mp-status')).toContainText('🟢 Trina');
    const idA = await a.page.evaluate(() => ({ key: S_story.playerKey, pid: MP.ledgerPid }));
    expect(idA.key).toMatch(/^[0-9a-f]{32}$/);
    expect(idA.pid).toMatch(/^[0-9a-f]{8}:[0-9a-f]{8}$/);

    // Trina acquires a flask while connected → minted + stamped + 🔗-worthy.
    await a.page.evaluate(() => {
      const it = { name: 'Poison Extract Flask', icon: '🧪', type: 'lake_magic', sell: 0 };
      S_story.inventory.push(it);
      mpMintStamp(it);
    });
    await a.page.waitForFunction(() => !!S_story.inventory.find(i => i.name === 'Poison Extract Flask' && i.mintKey));

    // Ugo connects at the same cell; his co-present roster carries Trina's
    // ledgerPid (from the pos beacon), so the ⇄ button renders for her.
    await b.page.click('#mp-toggle');
    await expect(b.page.locator('#mp-status')).toContainText('🟢 Ugo');
    await expect(b.page.locator('#mp-presence')).toContainText('Trina');
    await b.page.click('#mp-presence .mp-trade-btn');

    // Ugo asks for the flask (want side lists Trina's minted items by name).
    await expect(b.page.locator('#mp-trade-modal')).toBeVisible();
    const wantRow = b.page.locator('#mp-trade-want input[data-side="want"]');
    await expect(b.page.locator('#mp-trade-want')).toContainText('Poison Extract Flask');
    await wantRow.check();
    await b.page.click('#mp-trade-primary');

    // Trina's incoming modal opens over SSE; she accepts.
    await expect(a.page.locator('#mp-trade-modal')).toBeVisible();
    await expect(a.page.locator('#mp-trade-give')).toContainText('Poison Extract Flask');
    await a.page.click('#mp-trade-primary');

    // trade_completed mirrors the ONE co-signed event into both inventories.
    await a.page.waitForFunction(() => !S_story.inventory.some(i => i.name === 'Poison Extract Flask'));
    await b.page.waitForFunction(() => S_story.inventory.some(i => i.name === 'Poison Extract Flask' && i.mintKey));
    expect(await a.page.evaluate(() => !!MP.trade)).toBe(false);
    expect(await b.page.evaluate(() => !!MP.trade)).toBe(false);
    await expect(a.page.locator('#mp-trade-modal')).toBeHidden();
    await expect(b.page.locator('#mp-trade-modal')).toBeHidden();

    // The ledger agrees: the flask resolves to Ugo's durable pid.
    const owner = await (await fetch(`http://localhost:${MP_PORT}/api/ledger/owned?pid=${await b.page.evaluate(() => MP.ledgerPid)}`)).json();
    expect(owner.items.some(t => t.item && t.item.name === 'Poison Extract Flask')).toBe(true);

    await a.ctx.close();
    await b.ctx.close();
  });
});
