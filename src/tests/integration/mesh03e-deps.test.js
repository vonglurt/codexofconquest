// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §MESH-03e — a ledger event on pack content names the pack, and a server without
// that pack applied holds the event durably instead of dropping it, fetches the pack,
// says why it is waiting, and admits the event once the pack lands at restart.
// Browser-free: a tracker and two throwaway servers.

const { test, expect } = require('@playwright/test');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { workerPorts, watchChildren } = require('./helpers');

const ROOT = path.resolve(__dirname, '..', '..', '..');

test.describe('§MESH-03e — events on pack content wait for the pack', () => {
  test.describe.configure({ mode: 'serial' });
  const WB = require('../../js/wbapi-core.js');
  WB.load(path.join(ROOT, 'play.html'));
  const [PT, PA, PB] = workerPorts('deps', 3).ports;
  const url = (p) => `http://localhost:${p}`;
  const children = {};
  let dir;
  const cli = (port, ...args) => spawnSync(process.execPath, [path.join(ROOT, 'src', 'api', 'wb.js'), ...args, '--server', url(port)],
    { cwd: ROOT, encoding: 'utf8', input: '' });
  const post = async (port, p, body) => (await fetch(url(port) + p, { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
  const get = async (port, p) => (await fetch(url(port) + p)).json();
  const push = async (port, events) => {
    const m = await get(port, '/api/manifest');
    return post(port, '/api/ledger/ingest', { serverId: 'fe'.repeat(16), proto: m.proto, engineVer: m.engineVer,
      worldHash: m.worldHash, universeHash: m.universeHash, events });
  };
  const waitUp = async (port) => {
    for (let i = 0; i < 200; i++) {
      try { if ((await fetch(`${url(port)}/api/ping`)).ok) return true; } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  };
  const boot = (name, port, env) => {
    const d = path.join(dir, name);
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d);
      fs.copyFileSync(path.join(ROOT, 'play.html'), path.join(d, 'play.html'));
    }
    children[name] = spawn(process.execPath, [path.join(ROOT, 'src', 'js', 'wbapi-server.js')], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(port), CODEXOFCONQUEST_FILE: path.join(d, 'play.html'),
        PACKS_DIR: path.join(d, 'packs'), MESH_KEY_FILE: path.join(d, 'key.pem'), SERVER_ID_FILE: path.join(d, 'server-id'),
        PEERS_CACHE_FILE: path.join(d, 'peers.json'), MESH_ACL_FILE: path.join(d, 'acl.json'),
        TRACKER_CACHE_FILE: path.join(d, 'tracker-cache.json'), LEDGER_DIR: path.join(d, 'ledger'),
        ADVERTISE_ADDR: `localhost:${port}`, ...env },
      stdio: 'ignore',
    });
  };
  const qid = Object.keys(WB.questDb).find((k) => WB.shareable('quest', k).shareable && Array.isArray(WB.questDb[k].bits));
  const RELIC = { key: 'mesh03e_held_relic', name: 'Mesh03e Held Relic' };
  let packId, relicMint, plainMint, tradeEvt, beforeMint, plainRun;

  test.beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-mesh03e-'));
    boot('tracker', PT, { TRACKER_MODE: '1' });
    boot('a', PA, { TRACKER_URL: url(PT) });
    boot('b', PB, { TRACKER_URL: url(PT), MINT_RATE_PER_HOUR: '2' });
    const died = watchChildren(children);
    for (const port of [PT, PA, PB])
      if (!await waitUp(port)) throw new Error(`throwaway wbapi-server did not answer on :${port}` + (died.length ? ` — ${died.join('; ')}` : ''));
  });

  test.afterAll(() => {
    for (const c of Object.values(children)) { try { c.kill('SIGTERM'); } catch {} }
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  test('on the author, a mint of an item only its pack grants names the pack; a base item and its trade name none', async () => {
    const bits = [...WB.entryWithFns('quest', qid).entry.bits,
      { kind: 'reward', items: [{ name: RELIC.name, icon: '🔹', type: 'craft', sell: 1 }] }];
    const put = await fetch(`${url(PA)}/api/quest/${encodeURIComponent(qid)}`, { method: 'PUT',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bits }) });
    expect(put.status).toBe(200);
    const made = cli(PA, 'pack', 'create', qid);
    packId = (made.stdout.match(/pack ([0-9a-f]{64})/) || [])[1];
    expect(packId).toBeTruthy();

    const s1 = await post(PA, '/api/session/start', { name: 'Ada', playerKey: 'ab'.repeat(16) });
    const s2 = await post(PA, '/api/session/start', { name: 'Bo', playerKey: 'cd'.repeat(16) });
    const before = await post(PA, '/api/ledger/mint', { sessionId: s1.sessionId, item: RELIC });
    expect(before.event.body.deps).toBeUndefined();
    beforeMint = before.event;

    expect(cli(PA, 'pack', 'publish', packId).status).toBe(0);
    const uncited = await post(PA, '/api/ledger/mint', { sessionId: s1.sessionId, item: RELIC });
    expect(uncited).toMatchObject({ ok: false, reason: 'uncited', deps: [packId] });
    relicMint = (await post(PA, '/api/ledger/mint', { sessionId: s1.sessionId, item: RELIC, quest: qid })).event;
    expect(relicMint.body.deps).toEqual([packId]);
    expect(relicMint.body.cite).toEqual({ quest: qid });
    expect((await post(PA, '/api/ledger/mint', { sessionId: s1.sessionId, item: RELIC, quest: qid })).reason).toBe('over-reward');
    expect((await post(PA, '/api/ledger/mint', { sessionId: s2.sessionId, item: RELIC, quest: qid })).ok).toBe(true);
    plainMint = (await post(PA, '/api/ledger/mint', { sessionId: s1.sessionId, item: { key: 'mesh03e_plain', name: 'Mesh03e Plain' } })).event;
    expect(plainMint.body.deps).toBeUndefined();

    const prop = await post(PA, '/api/trade/propose', { sessionId: s1.sessionId, to: s2.ledgerPid, give: [relicMint.body.mintId] });
    expect(prop.ok).toBe(true);
    const acc = await post(PA, '/api/trade/accept', { sessionId: s2.sessionId, tradeId: prop.tradeId });
    expect(acc.ok).toBe(true);
    tradeEvt = acc.event;
    expect(tradeEvt.body.deps).toEqual([packId]);
  });

  test('B holds what depends on the pack, admits the rest, fetches the pack and says it is not accepted', async () => {
    const r = await push(PB, [plainMint, relicMint, tradeEvt]);
    expect(r).toMatchObject({ ok: true, accepted: 1, held: 2, rejected: [] });
    expect((await get(PB, `/api/ledger/owner?mintId=${plainMint.body.mintId.join(':')}`)).minted).toBe(true);
    expect((await get(PB, `/api/ledger/owner?mintId=${relicMint.body.mintId.join(':')}`)).minted).toBe(false);

    await expect.poll(async () => (await get(PB, '/api/ledger/held')).held.map((h) => h.deps[0].state).join(','),
      { timeout: 15000 }).toBe('not accepted,not accepted');
    expect(fs.existsSync(path.join(dir, 'b', 'packs', packId + '.json'))).toBe(true);
    expect((await push(PB, [relicMint])).dup).toBe(1);
    expect((await get(PB, '/api/ledger/status')).held).toBe(2);
  });

  test('accepted, the pack lands at restart and the held events are admitted, the trade included', async () => {
    expect(cli(PB, 'pack', 'accept', packId).status).toBe(0);
    expect((await get(PB, '/api/ledger/held')).held[0].deps[0].state).toBe('accepted, applies at the next restart');

    await new Promise((r) => { children.b.once('exit', r); children.b.kill('SIGTERM'); });
    boot('b', PB, { TRACKER_URL: url(PT), MINT_RATE_PER_HOUR: '2' });
    expect(await waitUp(PB)).toBe(true);
    await expect.poll(async () => (await get(PB, '/api/ledger/held')).held.length, { timeout: 30000 }).toBe(0);
    const owner = await get(PB, `/api/ledger/owner?mintId=${relicMint.body.mintId.join(':')}`);
    expect(owner.minted).toBe(true);
    expect(owner.owner).toBe(tradeEvt.body.parties[1]);
    expect(owner.hops).toBe(1);
  });

  test('§MESH-03e-FU — with the pack applied, a receiver refuses a pack item minted without a cite, whatever its deps say', async () => {
    expect(beforeMint.body.deps).toBeUndefined();
    const r = await push(PB, [beforeMint]);
    expect(r.accepted).toBe(0);
    expect(r.rejected).toEqual([{ hash: beforeMint.hash, reason: 'uncited' }]);
  });

  test('§MESH-03e-FU — base items: a receiver caps one origin minting one key per hour', async () => {
    const s3 = await post(PA, '/api/session/start', { name: 'Cy', playerKey: 'ef'.repeat(16) });
    plainRun = [];
    for (let i = 0; i < 3; i++)
      plainRun.push((await post(PA, '/api/ledger/mint', { sessionId: s3.sessionId, item: { key: 'mesh03efu_rate', name: 'Mesh03efu Rate' } })).event);
    const r = await push(PB, plainRun);
    expect(r.accepted).toBe(2);
    expect(r.rejected).toEqual([{ hash: plainRun[2].hash, reason: 'mint-rate' }]);
  });
});
