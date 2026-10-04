// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §MESH-03b — a quest may cross servers only as pure data. Browser-free: the predicate and
// the census run against the live play.html through wbapi-core.

const { test, expect } = require('@playwright/test');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { workerPorts, watchChildren, testLedgerDir } = require('./helpers');

const ROOT = path.resolve(__dirname, '..', '..', '..');

const WB = require('../../js/wbapi-core.js');
WB.load(path.join(ROOT, 'play.html'));

const base = () => WB.shareUniverse();
const clean = () => {
  const key = Object.keys(WB.questDb).find(k => WB.shareable('quest', k).shareable);
  return JSON.parse(JSON.stringify(WB.entryWithFns('quest', key).entry));
};

test.describe('§MESH-03b — shareable quests', () => {
  test('the census marks local-only exactly the quests that carry a function', () => {
    const c = WB.shareableCensus();
    const withFns = Object.keys(WB.questDb).filter(k => WB.entryWithFns('quest', k).fnCount > 0);
    expect(withFns.length).toBeGreaterThan(0);
    expect(c.total).toBe(Object.keys(WB.questDb).length);
    expect(c.localOnly.map(q => q.key).sort()).toEqual(withFns.sort());
    expect(c.shareable).toBe(c.total - withFns.length);
  });

  test('a function value fails at any depth, marked or raw', () => {
    const top = { ...clean(), activateCond: { __fn: '() => true' } };
    expect(WB.questShareable(top, base())).toContain('function value at activateCond');

    const nested = clean();
    nested.onComplete = [{ kind: 'narrative', msg: { __fn: '() => "hi"' } }];
    expect(WB.questShareable(nested, base())).toContain('function value at onComplete[0].msg');

    const raw = { ...clean(), passText: () => 'hi' };
    expect(WB.questShareable(raw, base())).toContain('function value at passText');
  });

  test('a bit outside the authorable contracts fails, even with no function in it', () => {
    const q = clean();
    q.onComplete = [{ kind: '_legacy_fn', fn: null }, { kind: 'teleport', to: 'LHR' }, { kind: 'reward' }];
    const why = WB.questShareable(q, base());
    expect(why).toContain('onComplete[0]: bit kind "_legacy_fn" is not shareable');
    expect(why).toContain('onComplete[1]: bit kind "teleport" is not shareable');
    expect(why).toContain('onComplete[2]: reward fails its contract');
  });

  test('a key the universe cannot resolve fails until the pack supplies it', () => {
    const q = clean();
    q.onComplete = [{ kind: 'combat', key: 'wyrm_of_nowhere', label: 'The Wyrm' },
                    { kind: 'unlock', quests: ['constructor'] }];
    const why = WB.questShareable(q, base());
    expect(why).toContain('onComplete[0].key: unknown monster "wyrm_of_nowhere"');
    expect(why).toContain('onComplete[1].quests[0]: unknown quest "constructor"');

    const pack = { monsters: { wyrm_of_nowhere: {} }, quests: { constructor: {} } };
    expect(WB.questShareable(q, WB.shareUniverse(pack))).toEqual([]);
  });

  test('references inside nested gates and completions are resolved too', () => {
    const q = { ...clean(), gate: { any: [{ questsDone: ['quest_nope'] }, { not: { favorMin: { nobody_here: 1 } } }] },
                completion: { atNode: 'ZZZ' } };
    const why = WB.questShareable(q, base());
    expect(why).toContain('gate.questsDone: unknown quest "quest_nope"');
    expect(why).toContain('gate.favorMin: unknown npc "nobody_here"');
    expect(why).toContain('completion.atNode: unknown node "ZZZ"');
  });
});

test.describe('§MESH-03b — ./bin/api shareable against a throwaway server', () => {
  const [PORT] = workerPorts('shareable').ports;
  const BASE = `http://localhost:${PORT}`;
  let server, dir;
  const cli = (...args) => spawnSync(process.execPath, [path.join(ROOT, 'src', 'api', 'wb.js'), ...args, '--server', BASE],
    { cwd: ROOT, encoding: 'utf8' });

  test.beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-mesh03b-'));
    fs.copyFileSync(path.join(ROOT, 'play.html'), path.join(dir, 'play.html'));
    server = spawn(process.execPath, [path.join(ROOT, 'src', 'js', 'wbapi-server.js')], {
      cwd: ROOT,
      env: { ...process.env, LEDGER_DIR: testLedgerDir(), PORT: String(PORT), CODEXOFCONQUEST_FILE: path.join(dir, 'play.html'),
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

  test('the count, a shareable quest and a local-only quest', () => {
    const c = WB.shareableCensus();
    const count = cli('shareable', 'quest');
    expect(count.status).toBe(0);
    expect(count.stdout).toContain(`${c.shareable}/${c.total} quests shareable`);

    const good = Object.keys(WB.questDb).find(k => !c.localOnly.some(q => q.key === k));
    const yes = cli('shareable', 'quest', good);
    expect(yes.status).toBe(0);
    expect(yes.stdout).toContain(`${good} is shareable`);

    const bad = c.localOnly[0];
    const no = cli('shareable', 'quest', bad.key);
    expect(no.status).toBe(1);
    expect(no.stderr).toContain(`${bad.key} is local-only`);
    expect(no.stderr).toContain(bad.reasons[0]);
  });
});
