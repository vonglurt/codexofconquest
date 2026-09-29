// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §MESH-03f (4) — a session that proved a player key must sign each ledger action
// with it, numbered and timestamped, so the session id alone cannot mint, trade or
// duel, and a captured request cannot be replayed. Keyless sessions are unchanged.

const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { workerPorts, watchChildren } = require('./helpers');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const canonical = (v) => v === null || typeof v !== 'object' ? JSON.stringify(v)
  : Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']'
  : '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
const edPair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const { kty, crv, x } = publicKey.export({ format: 'jwk' });
  return { pub: { kty, crv, x }, sign: (m) => crypto.sign(null, Buffer.from(m), privateKey).toString('base64url') };
};

test.describe('§MESH-03f — signed, numbered ledger actions', () => {
  test.describe.configure({ mode: 'serial' });
  const [PORT] = workerPorts('actions').ports;
  const A = `http://localhost:${PORT}`;
  let child, dir, serverId, pair, sessionId;

  const post = async (p, body) => {
    const r = await fetch(A + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: r.status, ...(await r.json()) };
  };
  const act = (key, route, body, seq, ts = Date.now()) => ({ ...body, act: { seq, ts,
    sig: key.sign(`codex-action-v1\n${serverId}\n${route}\n${body.sessionId}\n${seq}\n${ts}\n${canonical(body)}`) } });
  const item = (n) => ({ key: `mesh03f_act_${n}`, name: `Mesh03f Act ${n}` });

  test.beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-mesh03f-act-'));
    fs.copyFileSync(path.join(ROOT, 'play.html'), path.join(dir, 'play.html'));
    child = spawn(process.execPath, [path.join(ROOT, 'src', 'js', 'wbapi-server.js')], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(PORT), CODEXOFCONQUEST_FILE: path.join(dir, 'play.html'),
        PACKS_DIR: path.join(dir, 'packs'), MESH_KEY_FILE: path.join(dir, 'key.pem'), SERVER_ID_FILE: path.join(dir, 'server-id'),
        PEERS_CACHE_FILE: path.join(dir, 'peers.json'), MESH_ACL_FILE: path.join(dir, 'acl.json'), LEDGER_DIR: path.join(dir, 'ledger') },
      stdio: 'ignore',
    });
    const died = watchChildren({ child });
    let up = false;
    for (let i = 0; i < 200 && !up; i++) {
      try { up = (await fetch(A + '/api/ping')).ok; } catch {}
      if (!up) await new Promise((r) => setTimeout(r, 100));
    }
    if (!up) throw new Error(`throwaway server did not answer on :${PORT}` + (died.length ? ` — ${died.join('; ')}` : ''));
    pair = edPair();
    const n = await post('/api/session/nonce', {});
    serverId = n.serverId;
    const s = await post('/api/session/start', { name: 'Signer', pub: pair.pub, nonce: n.nonce,
      sig: pair.sign(`codex-session-v1\n${serverId}\n${n.nonce}`) });
    sessionId = s.sessionId;
  });

  test.afterAll(() => {
    if (child) { try { child.kill('SIGTERM'); } catch {} }
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  test('a keyed session\'s unsigned mint is refused; a signed one lands; the same request again is a replay', async () => {
    const bare = await post('/api/ledger/mint', { sessionId, item: item(0) });
    expect(bare.status).toBe(401);
    expect(bare.reason).toBe('action-sig');

    const signed = act(pair, 'ledger/mint', { sessionId, item: item(1) }, 1);
    expect((await post('/api/ledger/mint', signed)).status).toBe(201);
    const replay = await post('/api/ledger/mint', signed);
    expect(replay.status).toBe(409);
    expect(replay.error).toContain('replayed');
  });

  test('out-of-order seqs inside the window land; a stranger\'s key, a stale timestamp and a reroute do not', async () => {
    expect((await post('/api/ledger/mint', act(pair, 'ledger/mint', { sessionId, item: item(3) }, 3))).status).toBe(201);
    expect((await post('/api/ledger/mint', act(pair, 'ledger/mint', { sessionId, item: item(2) }, 2))).status).toBe(201);

    const forged = await post('/api/ledger/mint', act(edPair(), 'ledger/mint', { sessionId, item: item(4) }, 4));
    expect(forged.status).toBe(401);
    expect(forged.error).toContain('does not verify');
    const stale = await post('/api/ledger/mint', act(pair, 'ledger/mint', { sessionId, item: item(5) }, 5, Date.now() - 120000));
    expect(stale.error).toContain('window');
    const rerouted = await post('/api/trade/cancel', act(pair, 'ledger/mint', { sessionId, tradeId: 'x' }, 6));
    expect(rerouted.status).toBe(401);
  });

  test('a keyless session is unchanged', async () => {
    const s = await post('/api/session/start', { name: 'Plain', playerKey: crypto.randomBytes(16).toString('hex') });
    expect((await post('/api/ledger/mint', { sessionId: s.sessionId, item: item(9) })).status).toBe(201);
  });

  test('the browser signs its actions, parallel ones included', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(async (base) => {
      MP.base = base;
      S_story.playerKey = '';
      const start = await _mpStart({ name: 'Browser' });
      const mint = (n) => _mpFetch('/api/ledger/mint', { sessionId: start.sessionId, item: { key: 'mesh03f_b' + n, name: 'B' + n } });
      const all = await Promise.all([1, 2, 3, 4, 5].map(mint));
      const raw = await (await fetch(base + '/api/ledger/mint', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: start.sessionId, item: { key: 'mesh03f_raw', name: 'Raw' } }) })).json();
      return { ok: all.map((m) => m.ok), seq: MP.act.seq, raw };
    }, A);
    expect(r.ok).toEqual([true, true, true, true, true]);
    expect(r.seq).toBe(5);
    expect(r.raw.reason).toBe('action-sig');
  });
});
