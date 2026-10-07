// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02lz — ledger sync and trade relay are gated on the universe (engine + map), not the
// whole world, so two servers whose quests differ can trade. A mint stays bounded by the
// receiver's own checks (§MESH-03e-FU), not by the two worlds being identical.

const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { workerPorts, watchChildren } = require('./helpers');

const ROOT = path.resolve(__dirname, '..', '..', '..');

test.describe('§DX-02lz — servers whose content differs trade', () => {
  test.describe.configure({ mode: 'serial' });
  const [PA, PB] = workerPorts('diverge', 2).ports;
  const url = (p) => `http://localhost:${p}`;
  const post = async (port, p, body) => (await fetch(url(port) + '/api' + p, { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
  const get = async (port, p) => (await fetch(url(port) + '/api' + p)).json();
  const until = async (fn, ms = 8000) => {
    for (const end = Date.now() + ms; Date.now() < end; await new Promise((r) => setTimeout(r, 120))) if (await fn()) return true;
    return false;
  };
  const children = {};
  let dir, manA, manB;

  const boot = (name, port, src, env = {}) => {
    const d = path.join(dir, name);
    fs.mkdirSync(d);
    fs.writeFileSync(path.join(d, 'play.html'), src);
    children[name] = spawn(process.execPath, [path.join(ROOT, 'src', 'js', 'wbapi-server.js')], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(port), CODEXOFCONQUEST_FILE: path.join(d, 'play.html'),
        PACKS_DIR: path.join(d, 'packs'), MESH_KEY_FILE: path.join(d, 'key.pem'), SERVER_ID_FILE: path.join(d, 'server-id'),
        PEERS_CACHE_FILE: path.join(d, 'peers.json'), MESH_ACL_FILE: path.join(d, 'acl.json'), LEDGER_DIR: path.join(d, 'ledger'),
        ADVERTISE_ADDR: `localhost:${port}`, MESH_GOSSIP_MS: '120', ...env },
      stdio: 'ignore',
    });
  };

  test.beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-dx02lz-'));
    const src = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8');
    const other = src.replace('sdq_05_act1: { id:"sdq_05_act1", ', 'sdq_05_act1: { id:"sdq_05_act1", rumor:"Only this server tells it.", ');
    expect(other).not.toBe(src);
    boot('a', PA, src);
    boot('b', PB, other, { MESH_PEERS: `localhost:${PA}` });
    const died = watchChildren(children);
    for (const port of [PA, PB])
      if (!await until(async () => { try { return (await fetch(`${url(port)}/api/ping`)).ok; } catch { return false; } }, 20000))
        throw new Error(`throwaway wbapi-server did not answer on :${port}` + (died.length ? ` — ${died.join('; ')}` : ''));
    manA = await get(PA, '/manifest');
    manB = await get(PB, '/manifest');
  });

  test.afterAll(() => {
    for (const c of Object.values(children)) { try { c.kill('SIGTERM'); } catch {} }
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  test('the two share a universe and differ in content', () => {
    expect(manB.universeHash).toBe(manA.universeHash);
    expect(manB.worldHash).not.toBe(manA.worldHash);
    expect(manB.contentHash).not.toBe(manA.contentHash);
  });

  test('ledger sync answers a same-universe server, and still refuses another universe', async () => {
    const id = { serverId: '0f'.repeat(16), proto: manB.proto, engineVer: manB.engineVer, vv: {} };
    const same = await fetch(url(PA) + '/api/ledger/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...id, worldHash: manB.worldHash, universeHash: manB.universeHash }) });
    expect(same.status).toBe(200);
    const other = await fetch(url(PA) + '/api/ledger/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...id, worldHash: 'deadbeefdeadbeef', universeHash: 'deadbeefdeadbeef' }) });
    expect(other.status).toBe(409);
    expect((await other.json()).want.universeHash).toBe(manA.universeHash);
  });

  test('a base-content item minted on one changes hands with a player on the other, and both ledgers hold it', async () => {
    const gil = await post(PA, '/session/start', { name: 'Gil', seed: 77, playerKey: 'ab12'.repeat(8) });
    const ben = await post(PB, '/session/start', { name: 'Ben', seed: 99, playerKey: 'ef56'.repeat(8) });
    const sword = await post(PA, '/ledger/mint', { sessionId: gil.sessionId, item: { key: 'sword', name: 'Sword' } });
    const shield = await post(PB, '/ledger/mint', { sessionId: ben.sessionId, item: { key: 'shield', name: 'Shield' } });
    expect(sword.mintKey && shield.mintKey).toBeTruthy();
    expect(await until(async () => (await get(PB, `/ledger/owner?mintId=${sword.mintKey}`)).owner === gil.ledgerPid),
      'the mint on A replicates to B').toBe(true);
    await post(PB, '/session/pos', { sessionId: ben.sessionId, r: gil.r, c: gil.c });
    expect(await until(async () => ((await post(PA, '/session/pos', { sessionId: gil.sessionId, r: gil.r, c: gil.c })).players || [])
      .some((q) => q.ledgerPid === ben.ledgerPid))).toBe(true);
    const offer = await post(PA, '/trade/propose', { sessionId: gil.sessionId, to: ben.ledgerPid, give: [sword.mintKey], want: [shield.mintKey] });
    expect(offer.ok, JSON.stringify(offer)).toBe(true);
    expect(offer.remote).toBe(true);
    const done = await post(PB, '/trade/accept', { tradeId: offer.tradeId, sessionId: ben.sessionId });
    expect(done.ok, JSON.stringify(done)).toBe(true);
    for (const port of [PA, PB])
      expect(await until(async () => (await get(port, `/ledger/owner?mintId=${sword.mintKey}`)).owner === ben.ledgerPid
        && (await get(port, `/ledger/owner?mintId=${shield.mintKey}`)).owner === gil.ledgerPid), `ownership on :${port}`).toBe(true);
  });

  test('§DX-02mp — a push names its sender and is gated as a pull is', async () => {
    const as = (man, serverId) => ({ serverId, proto: man.proto, engineVer: man.engineVer, worldHash: man.worldHash, universeHash: man.universeHash });
    const cal = await post(PB, '/session/start', { name: 'Cal', seed: 11, playerKey: '9a8b'.repeat(8) });
    await post(PB, '/ledger/mint', { sessionId: cal.sessionId, item: { key: 'lantern', name: 'Lantern' } });
    const pulled = await post(PB, '/ledger/sync', { ...as(manA, '0d'.repeat(16)), vv: {} });
    expect(pulled.events.length).toBeGreaterThan(0);
    const push = async (body) => { const r = await fetch(url(PA) + '/api/ledger/ingest', { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { status: r.status, ...(await r.json()) }; };
    expect((await push({ events: pulled.events })).status).toBe(409);
    expect((await push({ ...as(manB, 'fe'.repeat(16)), universeHash: 'deadbeefdeadbeef', worldHash: 'deadbeefdeadbeef', events: pulled.events })).status).toBe(409);
    const acl = path.join(dir, 'a', 'acl.json');
    fs.writeFileSync(acl, JSON.stringify({ blockServerIds: ['fe'.repeat(16)] }));
    const denied = await push({ ...as(manB, 'fe'.repeat(16)), events: pulled.events });
    fs.rmSync(acl);
    expect(denied.status).toBe(403);
    const ok = await push({ ...as(manB, 'fe'.repeat(16)), events: pulled.events });
    expect(ok.status).toBe(200);
    expect(ok.rejected).toEqual([]);
    expect(ok.accepted + ok.dup).toBe(pulled.events.length);
  });
});
