// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02fi — a data section whose text is present but cannot be read must stop the load,
// naming the section, instead of loading as an empty collection: 2,853 quests used to
// become 0 with `loaded: true`. Server start and /api/reload refuse; the world already
// loaded stays. Browser-free: a broken copy and two throwaway servers.

const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { workerPorts, watchChildren } = require('./helpers');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8');
const BREAKS = {
  QUEST_DB: (s) => s.replace('quest_signal_01: { id:', 'quest_signal_01: { id:: '),
  NODE_MAP: (s) => s.replace(/(const NODE_MAP = \{[^\n]*\n)/, '$1  ,,\n'),
  MONSTER_POOL: (s) => s.replace(/(const MONSTER_POOL = \{)/, '$1 ]'),
};

test.describe('§DX-02fi — a section that cannot be read fails the load', () => {
  test.describe.configure({ mode: 'serial' });
  const [PS, PR] = workerPorts('failloud', 2).ports;
  const children = {};
  let dir;

  const boot = (name, port, file) => {
    children[name] = spawn(process.execPath, [path.join(ROOT, 'src', 'js', 'wbapi-server.js')], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(port), CODEXOFCONQUEST_FILE: file,
        PACKS_DIR: path.join(dir, name + '-packs'), MESH_KEY_FILE: path.join(dir, name + '-key.pem'),
        SERVER_ID_FILE: path.join(dir, name + '-id'), PEERS_CACHE_FILE: path.join(dir, name + '-peers.json'),
        MESH_ACL_FILE: path.join(dir, name + '-acl.json'), LEDGER_DIR: path.join(dir, name + '-ledger') },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    children[name].stdout.on('data', (d) => { out += d; });
    children[name].stderr.on('data', (d) => { out += d; });
    return () => out;
  };
  const up = async (port) => {
    for (let i = 0; i < 200; i++) {
      try { if ((await fetch(`http://localhost:${port}/api/ping`)).ok) return true; } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  };

  test.beforeAll(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-dx02fi-')); });
  test.afterAll(() => {
    for (const c of Object.values(children)) { try { c.kill('SIGTERM'); } catch {} }
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  test('load() names the broken section and keeps the world it had', () => {
    const core = require('../../js/wbapi-core.js');
    core.load(SRC);
    const quests = Object.keys(core.questDb).length;
    expect(quests).toBeGreaterThan(1000);
    for (const [name, brk] of Object.entries(BREAKS)) {
      const broken = brk(SRC);
      expect(broken, `${name} break must change the file`).not.toBe(SRC);
      expect(() => core.load(broken), name).toThrow(new RegExp(`^${name} is present in the source`));
      expect(Object.keys(core.questDb).length).toBe(quests);
    }
    expect(() => core.load(SRC.replace(/const NPC_DIALOGUE = \{[\s\S]*?\n\};/, 'const NPC_DIALOGUE = {};'))).not.toThrow();
  });

  test('a server refuses to start on a file with a broken section', async () => {
    const file = path.join(dir, 'broken.html');
    fs.writeFileSync(file, BREAKS.QUEST_DB(SRC));
    const out = boot('start', PS, file);
    const code = await new Promise((r) => children.start.once('exit', r));
    expect(code).not.toBe(0);
    expect(out()).toContain('QUEST_DB is present in the source but does not parse');
  });

  test('/api/reload onto a broken file answers 500 and keeps serving the world it had', async () => {
    const file = path.join(dir, 'live.html');
    fs.writeFileSync(file, SRC);
    boot('reload', PR, file);
    const died = watchChildren({ reload: children.reload });
    expect(await up(PR), died.join('; ')).toBe(true);
    const ping = async () => (await fetch(`http://localhost:${PR}/api/ping`)).json();
    const before = await ping();
    expect(before.quests).toBeGreaterThan(1000);
    fs.writeFileSync(file, BREAKS.QUEST_DB(SRC));
    const r = await fetch(`http://localhost:${PR}/api/reload`, { method: 'POST' });
    expect(r.status).toBe(500);
    expect((await r.json()).error).toContain('QUEST_DB is present in the source');
    const after = await ping();
    expect(after).toMatchObject({ loaded: true, quests: before.quests, nodes: before.nodes, monsters: before.monsters });
  });
});
