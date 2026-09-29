// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §MESH-03a (player half) — a session start proves a key pair: a signature over a
// single-use nonce, verified against the presented public key. A legacy playerKey
// is bound to the first key that signs for it, and from then on the bare string is
// refused. The browser's pair is non-extractable, kept in IndexedDB per character,
// and a transfer certificate chain from the bound key moves a character to a new one.

const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { workerPorts, watchChildren } = require('./helpers');

const ROOT = path.resolve(__dirname, '..', '..', '..');

const edPair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const { kty, crv, x } = publicKey.export({ format: 'jwk' });
  return { pub: { kty, crv, x }, sign: (m) => crypto.sign(null, Buffer.from(m), privateKey).toString('base64url') };
};
const p256Pair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const { kty, crv, x, y } = publicKey.export({ format: 'jwk' });
  return { pub: { kty, crv, x, y },
    sign: (m) => crypto.sign('sha256', Buffer.from(m), { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url') };
};
const sha8 = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 8);

test.describe('§MESH-03a — player keys prove the session start', () => {
  test.describe.configure({ mode: 'serial' });
  const [PA, PR] = workerPorts('playerkeys', 2).ports;
  const A = `http://localhost:${PA}`;
  const R = `http://localhost:${PR}`;
  const children = {};
  let dir;

  const boot = (name, port, env = {}) => {
    const d = path.join(dir, name);
    fs.mkdirSync(d);
    fs.copyFileSync(path.join(ROOT, 'play.html'), path.join(d, 'play.html'));
    children[name] = spawn(process.execPath, [path.join(ROOT, 'src', 'js', 'wbapi-server.js')], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(port), CODEXOFCONQUEST_FILE: path.join(d, 'play.html'),
        PACKS_DIR: path.join(d, 'packs'), MESH_KEY_FILE: path.join(d, 'key.pem'), SERVER_ID_FILE: path.join(d, 'server-id'),
        PEERS_CACHE_FILE: path.join(d, 'peers.json'), MESH_ACL_FILE: path.join(d, 'acl.json'),
        LEDGER_DIR: path.join(d, 'ledger'), ...env },
      stdio: 'ignore',
    });
  };
  const post = async (base, p, body) => (await fetch(base + p, { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
  const signedStart = async (base, pair, extra = {}) => {
    const n = await post(base, '/api/session/nonce', {});
    return { n, r: await post(base, '/api/session/start',
      { name: 'Keyed', pub: pair.pub, nonce: n.nonce, sig: pair.sign(`codex-session-v1\n${n.serverId}\n${n.nonce}`), ...extra }) };
  };

  test.beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-mesh03a-'));
    boot('a', PA);
    boot('r', PR, { MESH_REQUIRE_PLAYER_SIG: '1' });
    const died = watchChildren(children);
    for (const base of [A, R]) {
      let up = false;
      for (let i = 0; i < 200 && !up; i++) {
        try { up = (await fetch(base + '/api/ping')).ok; } catch {}
        if (!up) await new Promise((r) => setTimeout(r, 100));
      }
      if (!up) throw new Error(`throwaway server ${base} did not answer` + (died.length ? ` — ${died.join('; ')}` : ''));
    }
  });

  test.afterAll(() => {
    for (const c of Object.values(children)) { try { c.kill('SIGTERM'); } catch {} }
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  test('an Ed25519 or P-256 signature over a fresh nonce starts a keyed session; the id is the key\'s hash', async () => {
    for (const pair of [edPair(), p256Pair()]) {
      const { n, r } = await signedStart(A, pair);
      expect(r.ok).toBe(true);
      const pubId = pair.pub.kty === 'OKP' ? `ed25519:${pair.pub.x}` : `p256:${pair.pub.x}.${pair.pub.y}`;
      expect(r.ledgerPid).toBe(`${n.serverId.slice(0, 8)}:${sha8(pubId)}`);
    }
  });

  test('a replayed nonce, and a signature by a different key, are refused', async () => {
    const pair = edPair();
    const n = await post(A, '/api/session/nonce', {});
    const body = { name: 'Keyed', pub: pair.pub, nonce: n.nonce, sig: pair.sign(`codex-session-v1\n${n.serverId}\n${n.nonce}`) };
    expect((await post(A, '/api/session/start', body)).ok).toBe(true);
    const replay = await post(A, '/api/session/start', body);
    expect(replay.ok).toBe(false);
    expect(replay.error).toContain('nonce unknown, used or expired');

    const n2 = await post(A, '/api/session/nonce', {});
    const forged = await post(A, '/api/session/start', { name: 'Keyed', pub: pair.pub, nonce: n2.nonce,
      sig: edPair().sign(`codex-session-v1\n${n2.serverId}\n${n2.nonce}`) });
    expect(forged.ok).toBe(false);
    expect(forged.error).toContain('does not verify');
  });

  test('a legacy playerKey keeps its id when a key binds it, and afterwards the bare string is refused', async () => {
    const playerKey = crypto.randomBytes(16).toString('hex');
    const bare = await post(A, '/api/session/start', { name: 'Old', playerKey });
    expect(bare.ok).toBe(true);
    const pair = edPair();
    const { r: bound } = await signedStart(A, pair, { playerKey });
    expect(bound.ok).toBe(true);
    expect(bound.ledgerPid).toBe(bare.ledgerPid);

    const again = await post(A, '/api/session/start', { name: 'Thief', playerKey });
    expect(again.ok).toBe(false);
    expect(again.error).toContain('is bound to a key');
    const { r: other } = await signedStart(A, edPair(), { playerKey });
    expect(other.ok).toBe(false);
    expect(other.error).toContain('bound to a different key');
    const { r: owner } = await signedStart(A, pair, { playerKey });
    expect(owner.ledgerPid).toBe(bare.ledgerPid);
  });

  test('MESH_REQUIRE_PLAYER_SIG refuses a bare playerKey and still accepts a signed start', async () => {
    const bare = await post(R, '/api/session/start', { name: 'Old', playerKey: crypto.randomBytes(16).toString('hex') });
    expect(bare.ok).toBe(false);
    expect(bare.error).toContain('MESH_REQUIRE_PLAYER_SIG');
    expect((await signedStart(R, edPair())).r.ok).toBe(true);
  });

  test('a transfer chain signed by the bound key hands the character to a new key, on a server that saw only the first', async () => {
    const playerKey = crypto.randomBytes(16).toString('hex');
    const h = crypto.createHash('sha256').update(playerKey).digest('hex');
    const pubId = (p) => p.kty === 'OKP' ? `ed25519:${p.x}` : `p256:${p.x}.${p.y}`;
    const cert = (from, to) => ({ from: from.pub, to: to.pub, sig: from.sign(`codex-transfer-v1\n${h}\n${pubId(to.pub)}`) });
    const [a, b, c] = [edPair(), p256Pair(), edPair()];
    const { r: first } = await signedStart(A, a, { playerKey });
    expect(first.ok).toBe(true);

    const { r: forged } = await signedStart(A, c, { playerKey, transfers: [cert(c, c)] });
    expect(forged.error).toContain('bound to a different key');
    const { r: moved } = await signedStart(A, c, { playerKey, transfers: [cert(a, b), cert(b, c)] });
    expect(moved.ok).toBe(true);
    expect(moved.ledgerPid).toBe(first.ledgerPid);
    const { r: old } = await signedStart(A, a, { playerKey });
    expect(old.error).toContain('bound to a different key');
  });

  test('two browsers: the old one authorizes, the new one accepts, and connects as the same character', async ({ browser }) => {
    const ctxOld = await browser.newContext(), ctxNew = await browser.newContext();
    const [pOld, pNew] = [await ctxOld.newPage(), await ctxNew.newPage()];
    try {
      for (const pg of [pOld, pNew]) await pg.goto('/play.html');
      const playerKey = crypto.randomBytes(16).toString('hex');
      const setup = ({ base, key }) => { MP.base = base; S_story.playerKey = key; S_story.keyTransfers = []; };
      await pOld.evaluate(setup, { base: A, key: playerKey });
      await pNew.evaluate(setup, { base: A, key: playerKey });
      const bound = await pOld.evaluate(() => _mpStart({ name: 'Old' }));
      expect(bound.ok).toBe(true);
      const refused = await pNew.evaluate(() => _mpStart({ name: 'New' }));
      expect(refused.error).toContain('bound to a different key');

      const reqCode = await pNew.evaluate(async () => { await mlTransfer('request'); return document.getElementById('ml-xfer-code').value; });
      expect(reqCode).toMatch(/^codex-req1\./);
      expect((await pNew.evaluate((c) => mpTransferAuthorize(c), reqCode)).error).toContain('came from this browser');
      const certCode = await pOld.evaluate(async (c) => {
        document.getElementById('ml-xfer-code').value = c; await mlTransfer('authorize');
        return document.getElementById('ml-xfer-code').value;
      }, reqCode);
      expect(certCode).toMatch(/^codex-xfer1\./);
      const accepted = await pNew.evaluate(async (c) => {
        document.getElementById('ml-xfer-code').value = c; await mlTransfer('accept');
        return { note: document.getElementById('ml-xfer-note').textContent, links: S_story.keyTransfers.length };
      }, certCode);
      expect(accepted.note).toContain('Accepted');
      expect(accepted.links).toBe(1);
      const joined = await pNew.evaluate(() => _mpStart({ name: 'New' }));
      expect(joined.ok).toBe(true);
      expect(joined.ledgerPid).toBe(bound.ledgerPid);

      const other = await pOld.evaluate(async (c) => {
        S_story.playerKey = 'f'.repeat(32);
        return mpTransferAuthorize(c);
      }, reqCode);
      expect(other.error).toContain('different character');
    } finally { await ctxOld.close(); await ctxNew.close(); }
  });

  test('the browser signs with a non-extractable key kept per character, and the same key across reloads', async ({ page }) => {
    await page.goto('/play.html');
    const first = await page.evaluate(async (base) => {
      MP.base = base;
      S_story.playerKey = '';
      const id = await _mpIdentity();
      const r = await _mpStart({ name: 'Browser' });
      return { handle: id.handle, alg: id.alg, pub: id.pub, extractable: id.privateKey.extractable, r };
    }, A);
    expect(first.alg).toBe('Ed25519');
    expect(first.extractable).toBe(false);
    expect(first.r.ok).toBe(true);
    expect(first.r.ledgerPid.split(':')[1]).toBe(sha8(first.handle));

    await page.reload();
    const second = await page.evaluate(async ({ base, handle }) => {
      MP.base = base;
      S_story.playerKey = handle;
      const id = await _mpIdentity();
      const signed = await _mpStart({ name: 'Browser' });
      const bare = await _mpFetch('/api/session/start', { name: 'Browser', playerKey: handle });
      return { pub: id.pub, signed, bare };
    }, { base: A, handle: first.handle });
    expect(second.pub).toEqual(first.pub);
    expect(second.signed.ledgerPid).toBe(first.r.ledgerPid);
    expect(second.bare.ok).toBe(false);

    const fresh = await page.evaluate(async () => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      return (await _mpIdentity()).pub;
    });
    expect(fresh).not.toEqual(first.pub);
  });
});
