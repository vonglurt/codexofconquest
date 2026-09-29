// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §MESH-03f-FU — the page's half: two browsers on two servers. Each keeps an ECDH
// key beside its signing key in IndexedDB and publishes it at the signed start;
// ✉ on a player seals a private line to it, and only the other browser opens it.

const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { workerPorts, watchChildren } = require('./helpers');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SECRET = 'the ferryman takes silver, not gold';

test.describe('§MESH-03f-FU — private messages between two browsers on two servers', () => {
  test.describe.configure({ mode: 'serial' });
  const [PA, PB] = workerPorts('dmpage', 2).ports;
  const A = `http://localhost:${PA}`, B = `http://localhost:${PB}`;
  const children = {};
  let dir, ctxA, ctxB, pa, pb, alicePid, bobPid;

  const until = async (fn, n = 200) => {
    for (let i = 0; i < n; i++) { try { if (await fn()) return true; } catch {} await new Promise((r) => setTimeout(r, 100)); }
    return false;
  };
  const boot = (name, port, env) => {
    const d = path.join(dir, name);
    fs.mkdirSync(d);
    fs.copyFileSync(path.join(ROOT, 'play.html'), path.join(d, 'play.html'));
    children[name] = spawn(process.execPath, [path.join(ROOT, 'src', 'js', 'wbapi-server.js')], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(port), CODEXOFCONQUEST_FILE: path.join(d, 'play.html'),
        PACKS_DIR: path.join(d, 'packs'), MESH_KEY_FILE: path.join(d, 'key.pem'), SERVER_ID_FILE: path.join(d, 'server-id'),
        PEERS_CACHE_FILE: path.join(d, 'peers.json'), MESH_ACL_FILE: path.join(d, 'acl.json'),
        LEDGER_DIR: path.join(d, 'ledger'), MESH_GOSSIP_MS: '300', ADVERTISE_ADDR: `localhost:${port}`, ...env },
      stdio: 'ignore',
    });
  };
  const connect = (page, base, name) => page.evaluate(async ({ base, name }) => {
    MP.base = base;
    S_story.playerKey = '';
    const start = await _mpStart({ name });
    Object.assign(MP, { session: start.sessionId, pid: start.pid, ledgerPid: start.ledgerPid, name, on: true });
    _mpOpenStream();
    MP.es.addEventListener('dm', (ev) => (window.__dms = window.__dms || []).push(JSON.parse(ev.data)));
    return { ok: start.ok, ledgerPid: start.ledgerPid, xalg: MP.act && MP.act.id.xalg };
  }, { base, name });

  test.beforeAll(async ({ browser }) => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-mesh03f-dmpage-'));
    boot('a', PA, {});
    boot('b', PB, { MESH_PEERS: `localhost:${PA}` });
    const died = watchChildren(children);
    const up = await until(async () => (await fetch(A + '/api/ping')).ok && (await fetch(B + '/api/ping')).ok);
    if (!up) throw new Error('throwaway servers did not answer' + (died.length ? ` — ${died.join('; ')}` : ''));
    ctxA = await browser.newContext(); ctxB = await browser.newContext();
    pa = await ctxA.newPage(); pb = await ctxB.newPage();
    for (const p of [pa, pb]) {
      await p.addInitScript(() => localStorage.clear());
      await p.goto('/play.html');
      await p.locator('#story-panel').waitFor({ state: 'visible' });
    }
    const a = await connect(pa, A, 'Alice'), b = await connect(pb, B, 'Bob');
    expect(a.ok && b.ok).toBe(true);
    alicePid = a.ledgerPid; bobPid = b.ledgerPid;
    expect(await until(async () => (await (await fetch(`${A}/api/session/dmkey?pid=${bobPid}`)).json()).ok)).toBe(true);
  });

  test.afterAll(async () => {
    for (const c of [ctxA, ctxB]) if (c) await c.close().catch(() => {});
    for (const c of Object.values(children)) { try { c.kill('SIGTERM'); } catch {} }
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  test('the signed start published an ECDH key from IndexedDB, and it survives a reload of the identity', async () => {
    const k = await (await fetch(`${A}/api/session/dmkey?pid=${bobPid}`)).json();
    expect(k.xpub).toMatch(/^x25519:/);
    const again = await pb.evaluate(async () => { _mpIdentity.cache = null; const id = await _mpIdentity(); return _mpXpubId(id.xpub); });
    expect(again).toBe(k.xpub);
  });

  test('Alice presses ✉ beside Bob and types; only Bob\'s browser opens it', async () => {
    await pa.evaluate(({ bobPid }) => {
      MP.players = [{ pid: 'remote:bob', name: 'Bob', ledgerPid: bobPid, server: 'b' }];
      _mpRenderPresence();
      document.getElementById('mp-chat-input').style.display = 'inline-block';
    }, { bobPid });
    await pa.locator('#mp-presence button[title="Send a private message"]').evaluate((b) => b.click());
    expect(await pa.locator('#mp-chat-input').getAttribute('placeholder')).toContain('private to Bob');
    await pa.locator('#mp-chat-input').evaluate((el, t) => { el.value = t; }, SECRET);
    await pa.locator('#mp-chat-input').evaluate((el) => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })));

    expect(await until(() => pb.evaluate((s) => MP.chat.some((e) => e.scope === 'dm' && e.msg === s && e.name === '✉ Alice'), SECRET))).toBe(true);
    const sent = await pa.evaluate((s) => MP.chat.find((e) => e.scope === 'dm' && e.msg === s), SECRET);
    expect(sent.name).toBe('✉ → Bob');
    expect(await pa.locator('#mp-chat-input').getAttribute('placeholder')).not.toContain('private');

    const raw = await pb.evaluate(() => window.__dms[window.__dms.length - 1]);
    expect(JSON.stringify(raw)).not.toContain('ferryman');
    expect(raw.env.from).toBe(alicePid);
    expect(await pa.evaluate((d) => _mpDmOpen(d), raw)).toBeNull();
  });

  test('a tampered envelope does not open, and a forged sender key is dropped', async () => {
    const r = await pb.evaluate(async () => {
      const d = window.__dms[window.__dms.length - 1];
      const flip = (s) => (s[0] === 'A' ? 'B' : 'A') + s.slice(1);
      return {
        good: await _mpDmOpen(d),
        ct: await _mpDmOpen({ ...d, env: { ...d.env, ct: flip(d.env.ct) } }),
        from: await _mpDmOpen({ ...d, fromPub: 'ed25519:' + flip(d.fromPub.slice(8)) }),
      };
    });
    expect(r.good).toBe(SECRET);
    expect(r.ct).toBeNull();
    expect(r.from).toBeNull();
  });

  test('a browser without X25519 or Ed25519 falls back to P-256 for both keys, and still opens its mail', async ({ browser }) => {
    const ctx = await browser.newContext();
    const pc = await ctx.newPage();
    await pc.addInitScript(() => {
      localStorage.clear();
      const gen = crypto.subtle.generateKey.bind(crypto.subtle);
      crypto.subtle.generateKey = (alg, ...rest) => (/^(X25519|Ed25519)$/.test(alg && alg.name) ? Promise.reject(new Error('not here')) : gen(alg, ...rest));
    });
    await pc.goto('/play.html');
    await pc.locator('#story-panel').waitFor({ state: 'visible' });
    const c = await connect(pc, A, 'Carol');
    expect(c.xalg).toBe('P-256');
    const r = await pc.evaluate(async ({ me }) => mpDmSend({ ledgerPid: me, name: 'Carol' }, 'note to self'), { me: c.ledgerPid });
    expect(r.ok, r.error).toBe(true);
    expect(await until(() => pc.evaluate(() => MP.chat.some((e) => e.name === '✉ Carol' && e.msg === 'note to self')))).toBe(true);
    await ctx.close();
  });

  test('§MESH-03f-FU2 — Bob in another cell on B is in Alice\'s world list with his ledgerPid, and ✉ in the map pane reaches him', async () => {
    const post = async (base, p, body) => (await fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
    const bobSess = await pb.evaluate(() => MP.session), aliceSess = await pa.evaluate(() => MP.session);
    const here = await post(A, '/api/session/pos', { sessionId: aliceSess, r: 64, c: 224 });
    let moved = null;
    for (const [dr, dc] of [[0, 3], [3, 0], [-3, 0], [0, -3], [5, 5], [-5, -5]]) {
      const r = await post(B, '/api/session/pos', { sessionId: bobSess, r: here.r + dr, c: here.c + dc });
      if (r.ok) { moved = r; break; }
    }
    expect(moved, 'Bob found no land cell near the hub').not.toBeNull();
    let bob;
    expect(await until(async () => {
      const look = await post(A, '/api/session/pos', { sessionId: aliceSess, r: here.r, c: here.c });
      bob = (look.world || []).find((p) => p.name === 'Bob');
      return bob && bob.r === moved.r && bob.c === moved.c;
    })).toBe(true);
    expect(bob.ledgerPid).toBe(bobPid);

    expect(await until(() => pa.evaluate(({ bobPid, r, c }) => Object.values(MP.remotes).some((p) => p.ledgerPid === bobPid && p.r === r && p.c === c),
      { bobPid, r: moved.r, c: moved.c }))).toBe(true);
    await pa.evaluate(() => { MP.players = []; _mpRenderMapPresence(); });
    const btn = pa.locator('#mp-map-presence button', { hasText: '✉ Bob' });
    await expect(btn).toHaveCount(1);
    await btn.evaluate((b) => b.click());
    await pa.locator('#mp-map-chat-input').evaluate((el) => { el.value = 'across the map'; el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); });
    expect(await until(() => pb.evaluate(() => MP.chat.some((e) => e.scope === 'dm' && e.msg === 'across the map')))).toBe(true);
  });

  test('Bob answers through mpDmSend, and Alice\'s browser opens the reply', async () => {
    const r = await pb.evaluate(({ alicePid }) => mpDmSend({ ledgerPid: alicePid, name: 'Alice' }, 'silver it is'), { alicePid });
    expect(r.ok, r.error).toBe(true);
    expect(await until(() => pa.evaluate(() => MP.chat.some((e) => e.scope === 'dm' && e.msg === 'silver it is')))).toBe(true);
  });
});
