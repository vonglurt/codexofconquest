// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §MESH-03f — a server can listen with TLS, a peer that advertises https:// is dialed
// over it, and a request body past the cap is refused with 413 before it is read.
// Browser-free: two throwaway servers and a self-signed certificate.

const { test, expect } = require('@playwright/test');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const https = require('https');
const os = require('os');
const path = require('path');
const { workerPorts, watchChildren } = require('./helpers');

const ROOT = path.resolve(__dirname, '..', '..', '..');

test.describe('§MESH-03f — TLS between peers, and the body cap', () => {
  test.describe.configure({ mode: 'serial' });
  const [PA, PB] = workerPorts('tls', 2).ports;
  const children = {};
  let dir, ca;

  const boot = (name, port, env) => {
    const d = path.join(dir, name);
    fs.mkdirSync(d);
    fs.copyFileSync(path.join(ROOT, 'play.html'), path.join(d, 'play.html'));
    children[name] = spawn(process.execPath, [path.join(ROOT, 'src', 'js', 'wbapi-server.js')], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(port), CODEXOFCONQUEST_FILE: path.join(d, 'play.html'),
        PACKS_DIR: path.join(d, 'packs'), MESH_KEY_FILE: path.join(d, 'key.pem'), SERVER_ID_FILE: path.join(d, 'server-id'),
        PEERS_CACHE_FILE: path.join(d, 'peers.json'), MESH_ACL_FILE: path.join(d, 'acl.json'),
        LEDGER_DIR: path.join(d, 'ledger'), MESH_GOSSIP_MS: '300', ...env },
      stdio: 'ignore',
    });
  };
  const getTls = (port, p) => new Promise((resolve, reject) => {
    https.get({ host: 'localhost', port, path: p, ca }, (res) => {
      let raw = ''; res.on('data', (c) => { raw += c; }); res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    }).on('error', reject);
  });
  const until = async (fn) => {
    for (let i = 0; i < 200; i++) { try { if (await fn()) return true; } catch {} await new Promise((r) => setTimeout(r, 100)); }
    return false;
  };

  test.beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-mesh03f-'));
    const made = spawnSync('openssl', ['req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1', '-nodes',
      '-keyout', path.join(dir, 'tls-key.pem'), '-out', path.join(dir, 'tls-cert.pem'), '-days', '1',
      '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost'], { encoding: 'utf8' });
    if (made.status !== 0) throw new Error(`openssl could not make a test certificate: ${made.stderr}`);
    ca = fs.readFileSync(path.join(dir, 'tls-cert.pem'));
    boot('a', PA, { TLS_CERT: path.join(dir, 'tls-cert.pem'), TLS_KEY: path.join(dir, 'tls-key.pem'), ADVERTISE_ADDR: `https://localhost:${PA}` });
    boot('b', PB, { ADVERTISE_ADDR: `localhost:${PB}`, MESH_PEERS: `https://localhost:${PA}`,
      NODE_EXTRA_CA_CERTS: path.join(dir, 'tls-cert.pem') });
    const died = watchChildren(children);
    const up = await until(async () => (await getTls(PA, '/api/ping')).status === 200)
      && await until(async () => (await fetch(`http://localhost:${PB}/api/ping`)).ok);
    if (!up) throw new Error('throwaway servers did not answer' + (died.length ? ` — ${died.join('; ')}` : ''));
  });

  test.afterAll(() => {
    for (const c of Object.values(children)) { try { c.kill('SIGTERM'); } catch {} }
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  test('a TLS server answers only over TLS, and a peer that advertises https:// is gossiped with over it', async () => {
    await expect(fetch(`http://localhost:${PA}/api/ping`)).rejects.toThrow();
    const status = async (url) => (await (await fetch(url)).json());
    expect(await until(async () => {
      const peer = (await status(`http://localhost:${PB}/api/mesh/status`)).peers.find((p) => p.addr === `https://localhost:${PA}`);
      return peer && peer.live && !peer.lastErr;
    })).toBe(true);
    expect(await until(async () => {
      const r = await getTls(PA, '/api/mesh/status');
      const peer = JSON.parse(r.body).peers.find((p) => p.addr === `localhost:${PB}`);
      return peer && peer.live;
    })).toBe(true);
  });

  test('a body past the cap is refused with 413 unread, and the server carries on', async () => {
    const r = await fetch(`http://localhost:${PB}/api/mesh/gossip`, { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pad: 'x'.repeat(2 * 1024 * 1024) }) });
    expect(r.status).toBe(413);
    expect((await r.json()).error).toContain('exceeds the 1048576-byte limit');
    expect((await fetch(`http://localhost:${PB}/api/ping`)).ok).toBe(true);
  });
});
