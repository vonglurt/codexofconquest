// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §MESH-03f-FU — a private message is encrypted by the sender to the recipient's
// published key, relayed across the mesh as ciphertext, and opened only by the
// recipient; a tampered envelope is refused at each hop and a replay is refused.
// This file plays the page's part with Node's crypto; the page's own half is the
// row's next increment.

const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { workerPorts, watchChildren } = require('./helpers');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SECRET = 'meet me at the Weimar gate at dusk';
const canonical = (v) => v === null || typeof v !== 'object' ? JSON.stringify(v)
  : Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']'
  : '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
const b64u = (b) => Buffer.from(b).toString('base64url');

const player = () => {
  const sk = crypto.generateKeyPairSync('ed25519');
  const xk = crypto.generateKeyPairSync('x25519');
  const { kty, crv, x } = sk.publicKey.export({ format: 'jwk' });
  const xj = xk.publicKey.export({ format: 'jwk' });
  const sign = (m) => crypto.sign(null, Buffer.from(m), sk.privateKey).toString('base64url');
  return { pub: { kty, crv, x }, xpub: { kty: xj.kty, crv: xj.crv, x: xj.x }, xpriv: xk.privateKey, sign,
    xsig: sign(`codex-xpub-v1\nx25519:${xj.x}`) };
};
const dmKey = (priv, pubX, from, to) => Buffer.from(crypto.hkdfSync('sha256',
  crypto.diffieHellman({ privateKey: priv, publicKey: crypto.createPublicKey({ key: { kty: 'OKP', crv: 'X25519', x: pubX }, format: 'jwk' }) }),
  Buffer.alloc(0), Buffer.from(`codex-dm-v1\n${from}\n${to}`), 32));
const seal = (sender, from, to, xpubId, text, ts = Date.now()) => {
  const eph = crypto.generateKeyPairSync('x25519');
  const key = dmKey(eph.privateKey, xpubId.slice('x25519:'.length), from, to);
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update(text, 'utf8'), c.final(), c.getAuthTag()]);
  const env = { v: 1, to, from, ts, epk: 'x25519:' + eph.publicKey.export({ format: 'jwk' }).x, iv: b64u(iv), ct: b64u(ct) };
  return { ...env, sig: sender.sign('codex-dm-v1\n' + canonical(env)) };
};
const open_ = (recipient, env) => {
  const key = dmKey(recipient.xpriv, env.epk.slice('x25519:'.length), env.from, env.to);
  const raw = Buffer.from(env.ct, 'base64url');
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(env.iv, 'base64url'));
  d.setAuthTag(raw.subarray(raw.length - 16));
  return Buffer.concat([d.update(raw.subarray(0, raw.length - 16)), d.final()]).toString('utf8');
};

test.describe('§MESH-03f-FU — end-to-end private messages across two servers', () => {
  test.describe.configure({ mode: 'serial' });
  const [PA, PB] = workerPorts('dm', 2).ports;
  const A = `http://localhost:${PA}`, B = `http://localhost:${PB}`;
  const children = {}, out = { a: '', b: '' };
  let dir, alice, bob, aliceS, bobS, inbox = [], sse;

  const post = async (base, p, body) => {
    const r = await fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: r.status, ...(await r.json().catch(() => ({}))) };
  };
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
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    for (const st of [children[name].stdout, children[name].stderr]) st.on('data', (c) => { out[name] += c; });
  };
  const start = async (base, name, p, withX = true) => {
    const n = await post(base, '/api/session/nonce', {});
    return post(base, '/api/session/start', { name, pub: p.pub, nonce: n.nonce, sig: p.sign(`codex-session-v1\n${n.serverId}\n${n.nonce}`),
      ...(withX ? { xpub: p.xpub, xsig: p.xsig } : {}) });
  };

  test.beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-mesh03f-dm-'));
    boot('a', PA, {});
    boot('b', PB, { MESH_PEERS: `localhost:${PA}` });
    const died = watchChildren(children);
    const up = await until(async () => (await fetch(A + '/api/ping')).ok && (await fetch(B + '/api/ping')).ok);
    if (!up) throw new Error('throwaway servers did not answer' + (died.length ? ` — ${died.join('; ')}` : ''));
    alice = player(); bob = player();
    aliceS = await start(A, 'Alice', alice);
    bobS = await start(B, 'Bob', bob);
    const ac = new AbortController();
    const resp = await fetch(`${B}/api/session/events?sessionId=${bobS.sessionId}`, { signal: ac.signal });
    const reader = resp.body.getReader();
    (async () => {
      let buf = '';
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += Buffer.from(value).toString('utf8');
          let i;
          while ((i = buf.indexOf('\n\n')) >= 0) {
            const block = buf.slice(0, i); buf = buf.slice(i + 2);
            const ev = /^event: (.*)$/m.exec(block), data = /^data: (.*)$/m.exec(block);
            if (ev && ev[1] === 'dm' && data) inbox.push(JSON.parse(data[1]));
          }
        }
      } catch {}
    })();
    sse = ac;
  });

  test.afterAll(() => {
    if (sse) sse.abort();
    for (const c of Object.values(children)) { try { c.kill('SIGTERM'); } catch {} }
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  test('a keyed start publishes a signed message key, and a peer finds it in the roster', async () => {
    expect(aliceS.status).toBe(201);
    expect(bobS.status).toBe(201);
    let k;
    expect(await until(async () => { k = await (await fetch(`${A}/api/session/dmkey?pid=${bobS.ledgerPid}`)).json(); return k.ok; })).toBe(true);
    expect(k.xpub).toBe('x25519:' + bob.xpub.x);
    expect(crypto.verify(null, Buffer.from(`codex-xpub-v1\n${k.xpub}`),
      crypto.createPublicKey({ key: bob.pub, format: 'jwk' }), Buffer.from(k.xsig, 'base64url'))).toBe(true);

    const badX = await post(A, '/api/session/nonce', {});
    const refused = await post(A, '/api/session/start', { name: 'Forged', pub: alice.pub, nonce: badX.nonce,
      sig: alice.sign(`codex-session-v1\n${badX.serverId}\n${badX.nonce}`), xpub: bob.xpub, xsig: 'AAAA' });
    expect(refused.status).toBe(400);
  });

  test('Alice on A messages Bob on B; only Bob opens it, and neither server saw the words', async () => {
    const k = await (await fetch(`${A}/api/session/dmkey?pid=${bobS.ledgerPid}`)).json();
    const env = seal(alice, aliceS.ledgerPid, bobS.ledgerPid, k.xpub, SECRET);
    const sent = await post(A, '/api/session/dm', { sessionId: aliceS.sessionId, env });
    expect(sent.status, sent.error).toBe(200);
    expect(sent.remote).toBe(true);
    expect(await until(async () => inbox.length === 1)).toBe(true);
    const got = inbox[0];
    expect(got.fromName).toBe('Alice');
    const { sig, ...signed } = got.env;
    expect(crypto.verify(null, Buffer.from('codex-dm-v1\n' + canonical(signed)),
      crypto.createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: got.fromPub.slice('ed25519:'.length) }, format: 'jwk' }),
      Buffer.from(sig, 'base64url'))).toBe(true);
    expect(open_(bob, got.env)).toBe(SECRET);
    expect(() => open_(player(), got.env)).toThrow();

    const replay = await post(A, '/api/session/dm', { sessionId: aliceS.sessionId, env });
    expect(replay.status).toBe(409);

    for (const base of [A, B]) {
      const hist = await (await fetch(`${base}/api/session/chat?limit=200`)).json();
      expect(JSON.stringify(hist)).not.toContain('Weimar gate');
    }
    expect(out.a + out.b).not.toContain('Weimar gate');
    expect(out.a + out.b).toContain(env.ct.length + ' ch ciphertext');
  });

  test('a tampered envelope is refused by the sender\'s server and by the recipient\'s', async () => {
    const k = await (await fetch(`${A}/api/session/dmkey?pid=${bobS.ledgerPid}`)).json();
    const env = seal(alice, aliceS.ledgerPid, bobS.ledgerPid, k.xpub, 'second');
    const flip = { ...env, ct: (env.ct[0] === 'A' ? 'B' : 'A') + env.ct.slice(1) };
    const atA = await post(A, '/api/session/dm', { sessionId: aliceS.sessionId, env: flip });
    expect(atA.status).toBe(401);
    expect(atA.error).toContain('does not verify');

    const aId = (await (await fetch(`${A}/api/manifest`)).json()).serverId;
    const hop = { serverId: aId, addr: `localhost:${PA}`, env, fromPub: 'ed25519:' + alice.pub.x, fromName: 'Alice', pub: 'x', sig: 'y' };
    const forgedHop = await post(B, '/api/mesh/dm', hop);
    expect(forgedHop.status).toBe(401);
    expect(inbox.length).toBe(1);
  });

  test('a stranger cannot send as Alice, a keyless session cannot send, an absent player is reported', async () => {
    const k = await (await fetch(`${A}/api/session/dmkey?pid=${bobS.ledgerPid}`)).json();
    const mallory = player();
    const asAlice = await post(A, '/api/session/dm', { sessionId: aliceS.sessionId, env: seal(mallory, aliceS.ledgerPid, bobS.ledgerPid, k.xpub, 'x') });
    expect(asAlice.status).toBe(401);
    const plain = await post(A, '/api/session/start', { name: 'Plain', playerKey: crypto.randomBytes(16).toString('hex') });
    const keyless = await post(A, '/api/session/dm', { sessionId: plain.sessionId, env: seal(alice, aliceS.ledgerPid, bobS.ledgerPid, k.xpub, 'x') });
    expect(keyless.status).toBe(401);
    const absent = await post(A, '/api/session/dm', { sessionId: aliceS.sessionId,
      env: seal(alice, aliceS.ledgerPid, aliceS.ledgerPid.split(':')[0] + ':0badc0de', k.xpub, 'x') });
    expect(absent.status).toBe(404);
    expect(absent.error).toContain('nothing is stored');
  });
});
