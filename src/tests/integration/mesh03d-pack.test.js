// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §MESH-03d — a content pack is signed by its author and addressed by the hash of what
// was signed. Browser-free: pack.js directly, then ./bin/api pack against a throwaway server.

const { test, expect } = require('@playwright/test');
const { spawn, spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { workerPorts, watchChildren } = require('./helpers');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SPKI = Buffer.from('302a300506032b6570032100', 'hex');
const canonical = (v) => v === null || typeof v !== 'object' ? JSON.stringify(v)
  : Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']'
  : '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
const verify = (buf, pub, sig) => {
  try {
    const key = crypto.createPublicKey({ key: Buffer.concat([SPKI, Buffer.from(pub, 'base64')]), format: 'der', type: 'spki' });
    return crypto.verify(null, buf, key, Buffer.from(sig, 'base64'));
  } catch { return false; }
};
const keypair = () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  const pub = publicKey.export({ format: 'der', type: 'spki' }).subarray(SPKI.length).toString('base64');
  return { pub, sign: (buf) => crypto.sign(null, buf, privateKey).toString('base64') };
};
const packsWith = (k) => require('../../js/pack.js')({ canonical, sign: k.sign, verify, pub: () => k.pub });

test.describe('§MESH-03d — pack format', () => {
  const k = keypair();
  const P = packsWith(k);
  const fresh = () => P.makePack({ base: 'c0', quests: { q1: { id: 'q1', title: 'A task' } }, monsters: {} });

  test('an intact pack verifies against its id', () => {
    const { id, pack } = fresh();
    expect(id).toMatch(P.PACK_ID);
    expect(pack.author).toBe(k.pub);
    expect(P.verifyPack(pack, id)).toBeNull();
    expect(P.packId(JSON.parse(JSON.stringify(pack)))).toBe(id);
  });

  test('an altered pack fails the hash, and re-hashing it fails the signature', () => {
    const { id, pack } = fresh();
    const altered = { ...pack, quests: { q1: { id: 'q1', title: 'A different task' } } };
    expect(P.verifyPack(altered, id)).toBe('bad-id');
    expect(P.verifyPack(altered, P.packId(altered))).toBe('bad-sig');
    const resigned = { ...altered, author: keypair().pub };
    expect(P.verifyPack(resigned, P.packId(resigned))).toBe('bad-sig');
  });

  test('an unsigned or malformed pack is refused', () => {
    const { pack } = fresh();
    const { sig, ...bare } = pack;
    expect(P.verifyPack(bare, P.packId(bare))).toBe('unsigned');
    expect(P.verifyPack({ ...pack, format: 'coc-pack/0' })).toBe('format');
    expect(P.verifyPack({ ...pack, monsters: null })).toBe('format');
  });

  test('monsterRefs reads kill goals and combat bits at any depth', () => {
    expect(P.monsterRefs({
      killGoals: [{ key: 'wolf' }],
      bits: [{ kind: 'skill_check', onFail: [{ kind: 'combat', key: 'bear', label: 'Bear' }] }],
      onComplete: [{ kind: 'choice', options: [{ label: 'x', bits: [{ kind: 'combat', key: 'wolf', label: 'W' }] }] }],
    }).sort()).toEqual(['bear', 'wolf']);
  });
});

test.describe('§MESH-03d — ./bin/api pack against a throwaway server', () => {
  const WB = require('../../js/wbapi-core.js');
  WB.load(path.join(ROOT, 'play.html'));
  const [PORT] = workerPorts('pack').ports;
  const BASE = `http://localhost:${PORT}`;
  let server, dir;
  const cli = (...args) => spawnSync(process.execPath, [path.join(ROOT, 'src', 'api', 'wb.js'), ...args, '--server', BASE],
    { cwd: ROOT, encoding: 'utf8' });

  test.beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-mesh03d-'));
    fs.copyFileSync(path.join(ROOT, 'play.html'), path.join(dir, 'play.html'));
    server = spawn(process.execPath, [path.join(ROOT, 'src', 'js', 'wbapi-server.js')], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(PORT), CODEXOFCONQUEST_FILE: path.join(dir, 'play.html'),
        PACKS_DIR: path.join(dir, 'packs'), MESH_KEY_FILE: path.join(dir, 'key.pem'),
        SERVER_ID_FILE: path.join(dir, 'server-id'),
        PEERS_CACHE_FILE: path.join(dir, 'peers.json'), MESH_ACL_FILE: path.join(dir, 'acl.json') },
      stdio: 'ignore',
    });
    const died = watchChildren({ server });
    for (let i = 0; i < 150; i++) {
      try { if ((await fetch(`${BASE}/api/ping`)).ok) return; } catch {}
      await new Promise(r => setTimeout(r, 100));
    }
    throw new Error(`throwaway wbapi-server did not answer on :${PORT}` + (died.length ? ` — ${died.join('; ')}` : ''));
  });

  test.afterAll(() => {
    if (server) { try { server.kill('SIGTERM'); } catch {} }
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  test('create signs a pack of a shareable quest and its monsters; any server can serve it intact', async () => {
    const qid = Object.keys(WB.questDb).find((k) => (WB.questDb[k].killGoals || []).length && WB.shareable('quest', k).shareable);
    const made = cli('pack', 'create', qid);
    expect(made.status).toBe(0);
    const id = (made.stdout.match(/pack ([0-9a-f]{64})/) || [])[1];
    expect(id).toBeTruthy();

    const man = await (await fetch(`${BASE}/api/manifest`)).json();
    const got = await (await fetch(`${BASE}/api/pack/${id}`)).json();
    const { pack } = got;
    const P = packsWith({ pub: man.pub, sign: () => '' });
    expect(P.verifyPack(pack, id)).toBeNull();
    expect(pack.author).toBe(man.pub);
    expect(pack.base).toBe(man.contentHash);
    expect(Object.keys(pack.quests)).toEqual([qid]);
    expect(Object.keys(pack.monsters).sort()).toEqual([...new Set(WB.questDb[qid].killGoals.map((g) => g.key))].sort());
    expect(pack.quests[qid]).toEqual(WB.entryWithFns('quest', qid).entry);

    const list = await (await fetch(`${BASE}/api/pack`)).json();
    expect(list.packs.map((p) => p.id)).toContain(id);
  });

  test('create refuses a quest that is not shareable, and names why', () => {
    const local = WB.shareableCensus().localOnly[0];
    const r = cli('pack', 'create', local.key);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('not shareable');
    expect(r.stderr).toContain(`${local.key}: ${local.reasons[0]}`);
  });
});
