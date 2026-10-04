// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02me — the Wizard's node, monster and quest bodies are shapes the server writes. The
// review block's ./bin/api lines carry the same bodies Create posts, so they are run against
// a scratch copy and the three entities are read back off disk.
const { test, expect } = require('@playwright/test');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { workerPorts, watchChildren } = require('./helpers');

const ROOT = path.resolve(__dirname, '..', '..', '..');

test.describe('§DX-02me — the Wizard writes what the server accepts', () => {
  const [PORT] = workerPorts('wizard').ports;
  const BASE = `http://localhost:${PORT}`;
  let dir, server, game;

  test.beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-dx02me-'));
    game = path.join(dir, 'play.html');
    fs.copyFileSync(path.join(ROOT, 'play.html'), game);
    server = spawn(process.execPath, [path.join(ROOT, 'src', 'js', 'wbapi-server.js')], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(PORT), CODEXOFCONQUEST_FILE: game, LEDGER_DIR: path.join(dir, 'ledger'),
        PACKS_DIR: path.join(dir, 'packs'), MESH_KEY_FILE: path.join(dir, 'key.pem'), SERVER_ID_FILE: path.join(dir, 'server-id'),
        PEERS_CACHE_FILE: path.join(dir, 'peers.json'), MESH_ACL_FILE: path.join(dir, 'acl.json') },
      stdio: 'ignore',
    });
    const died = watchChildren({ server });
    for (let i = 0; i < 150; i++) {
      try { if ((await fetch(`${BASE}/api/ping`)).ok) return; } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(`throwaway wbapi-server did not answer on :${PORT}` + (died.length ? ` — ${died.join('; ')}` : ''));
  });

  test.afterAll(() => {
    if (server) { try { server.kill('SIGTERM'); } catch {} }
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  test('node, monster and quest from the review block land on disk', async ({ page }) => {
    const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
    W.load(game);
    const terrain = Object.keys(W.worldDb)[0];
    await page.goto('/edit.html');
    const text = await page.evaluate(async (terrain) => {
      const set = (id, v) => { document.getElementById(id).value = v; };
      set('wiz-loc-existing', 'ZZWZ'); await window.wizLookupNode();
      set('wiz-mon-existing', 'zz_wz_rat'); await window.wizLookupMonster();
      set('wiz-node-code', 'ZZWZ'); set('wiz-node-label', 'Wizard Probe'); set('wiz-node-act', '2');
      set('wiz-node-terrain', terrain); set('wiz-node-desc', 'A probe place.');
      set('wiz-mon-key', 'zz_wz_rat'); set('wiz-mon-name', 'Probe Rat'); set('wiz-mon-dmg', '4'); set('wiz-mon-tier', 'easy');
      set('wiz-bit-key', 'zzWzToken'); set('wiz-bit-label', 'Probe Token');
      set('wiz-quest-id', 'zz_wz_quest'); set('wiz-quest-title', "The Probe's Errand");
      set('wiz-quest-start', 'A probe begins.'); set('wiz-quest-pass', 'It passed.'); set('wiz-quest-fail', 'It failed.');
      window.wizStep(6);
      return document.getElementById('wiz-curl-block').textContent;
    }, terrain);
    const lines = text.match(/\.\/bin\/api post [^\n]*/g) || [];
    expect(lines.map((l) => l.split(' ')[2])).toEqual(['node', 'monster', 'quest']);
    for (const line of lines) {
      const out = execFileSync('sh', ['-c', `${line} --server ${BASE} </dev/null`], { cwd: ROOT }).toString();
      expect(out, line).not.toMatch(/"ok":\s*false|Unknown|unknownFields/);
    }

    W.load(game);
    expect(W.nodeMap.ZZWZ).toMatchObject({ label: 'Wizard Probe', act: 2, name: terrain, text: 'A probe place.' });
    expect(W.monsterPool.zz_wz_rat).toMatchObject({ name: 'Probe Rat', dmgDie: 4, dmgCount: 1, dmgFlat: 0, tier: 'easy' });
    expect(W.questDb.zz_wz_quest).toMatchObject({ title: "The Probe's Errand", activateNode: 'ZZWZ', desc: 'A probe begins.',
      passText: 'It passed.', failText: 'It failed.', completion: { atNode: 'ZZWZ' },
      bits: [{ kind: 'mission_bit', flag: 'zzWzToken', label: 'Probe Token' }] });
  });
});
