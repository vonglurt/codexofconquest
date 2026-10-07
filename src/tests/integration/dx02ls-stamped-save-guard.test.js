// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ls — POST /api/save copies a stamped save over the game file and reloads it.
// A destroyed section must be refused, not loaded as an empty collection with a 200:
// the reload throws naming it (§DX-02fi) under §DX-02fj's guard. No API write can
// break a section, so a preload wraps saveStamped to break QUEST_DB in the stamped
// file while a flag file exists, and the real route is driven against a scratch copy.

const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { workerPorts, watchChildren } = require('./helpers');

const ROOT = path.resolve(__dirname, '..', '..', '..');

test.describe('§DX-02ls — the stamped save is guarded', () => {
  test.describe.configure({ mode: 'serial' });
  const [PORT] = workerPorts('stamped').ports;
  const BASE = `http://localhost:${PORT}`;
  let dir, server, game, flag;

  test.beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-dx02ls-'));
    game = path.join(dir, 'play.html');
    flag = path.join(dir, 'corrupt-next-save');
    fs.copyFileSync(path.join(ROOT, 'play.html'), game);
    const preload = path.join(dir, 'break-stamped.js');
    fs.writeFileSync(preload, `
      const fs = require('fs');
      const W = require(${JSON.stringify(path.join(ROOT, 'src', 'js', 'wbapi-core.js'))});
      const saveStamped = W.saveStamped;
      W.saveStamped = function (...args) {
        const r = saveStamped.apply(this, args);
        if (r.ok && fs.existsSync(${JSON.stringify(flag)})) {
          const t = fs.readFileSync(r.path, 'utf8');
          fs.writeFileSync(r.path, t.replace('const QUEST_DB = {', 'const QUEST_DB = { @@@'));
        }
        return r;
      };`);
    server = spawn(process.execPath, ['-r', preload, path.join(ROOT, 'src', 'js', 'wbapi-server.js')], {
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

  const questCount = async () => (await (await fetch(`${BASE}/api/list/ids/quest`)).json()).count;

  test('an intact save passes', async () => {
    const quests = await questCount();
    expect(quests).toBeGreaterThan(2000);
    const r = await fetch(`${BASE}/api/save`, { method: 'POST' });
    expect(r.status).toBe(200);
    expect(await questCount()).toBe(quests);
  });

  test('a save that destroys a section is refused, and the game file is put back byte for byte', async () => {
    const before = fs.readFileSync(game, 'utf8');
    const quests = await questCount();
    fs.writeFileSync(flag, '');
    const r = await fetch(`${BASE}/api/save`, { method: 'POST' });
    fs.rmSync(flag);
    expect(r.status).toBe(500);
    const body = await r.json();
    expect(body.error).toContain('QUEST_DB is present in the source but does not parse');
    expect(body.backup).toMatch(/-\d{8}-\d{6}/);
    expect(fs.readFileSync(game, 'utf8')).toBe(before);
    expect(await questCount()).toBe(quests);
  });
});
