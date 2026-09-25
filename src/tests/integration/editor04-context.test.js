// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §EDITOR-04 increments 1–2 — GET /api/context and `./bin/api context`: a node's or an
// arc's questline in one answer, with the three authoring traps named.
//
// The flag answers are checked against check:questgraph's own verdict, since the
// context query reuses its scanners: a gate flag nothing writes must be the same flag
// both report. The route and the CLI run against a THROWAWAY server on a scratch copy.

const { test, expect } = require('@playwright/test');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const GAME = path.join(ROOT, 'play.html');
const { workerPorts, watchChildren } = require('./helpers');
const [PORT] = workerPorts('context').ports;
const BASE = `http://localhost:${PORT}`;

let server, dir;

function world() {
  const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
  W.load(GAME);
  return W;
}
const { questContext } = require(path.join(ROOT, 'src', 'js', 'quest-context.js'));

function cli(...args) {
  return execFileSync(process.execPath, [path.join(ROOT, 'src', 'api', 'wb.js'), ...args, '--server', BASE],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

test.beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-editor04-'));
  const scratch = path.join(dir, 'play.html');
  fs.copyFileSync(GAME, scratch);
  server = spawn(process.execPath, [path.join(ROOT, 'src', 'js', 'wbapi-server.js')], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), CODEXOFCONQUEST_FILE: scratch,
      PEERS_CACHE_FILE: path.join(dir, 'peers.json') },
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

test.describe('§EDITOR-04 — the questline context query', () => {
  test('the unwritten-flag census over every node is check:questgraph\'s written-by-nothing set', () => {
    const W = world();
    const QG = require(path.join(ROOT, 'src', 'scripts', 'check-questgraph.js'));
    const seen = new Set();
    for (const code of Object.keys(W.nodeMap))
      for (const u of questContext(W, { node: code }).flags.unwritten) seen.add(u.flag);
    expect([...seen].sort()).toEqual(Object.keys(QG.KNOWN_UNWRITTEN_FLAG).sort());
  });

  test('cell primacy reproduces the §AUDIT-03x baseline: 416 nodes, 244 cells, 172 non-primary', () => {
    const W = world();
    const { cellOf } = require(path.join(ROOT, 'src', 'js', 'quest-context.js'));
    const cells = new Set(); let nonPrimary = 0;
    for (const code of Object.keys(W.nodeMap)) {
      const c = cellOf(W, code); cells.add(`${c.r},${c.c}`); if (!c.isPrimary) nonPrimary++;
    }
    expect([Object.keys(W.nodeMap).length, cells.size, nonPrimary]).toEqual([416, 244, 172]);
  });

  test('GET /api/context/LHR returns the node, its questline and its gate reads', async () => {
    const W = world();
    const r = await (await fetch(`${BASE}/api/context/LHR`)).json();
    expect(r.ok).toBe(true);
    expect(r.node.code).toBe('LHR');
    expect(r.node.cell.isPrimary).toBe(true);
    const expected = new Set([...(W._questsByNode.LHR || []), ...(W._questsByWaypoint.LHR || [])]);
    expect(r.quests.map(q => q.id).sort()).toEqual([...expected].sort());
    for (const q of r.quests) for (const f of q.gateFlags) expect(r.flags.reads[f], f).toContain(q.id);
    expect(r.npcs.map(n => n.key)).toContain('yael');
  });

  test('a non-primary node is reported as a trap, and names the primary it is hidden behind', async () => {
    const r = await (await fetch(`${BASE}/api/context/ATH`)).json();
    expect(r.node.cell.isPrimary).toBe(false);
    expect(r.node.cell.primary).toBe('SEA');
    expect(r.traps.unstandable).toBe(1);
  });

  test('the arc scope, and the two refusals', async () => {
    const W = world();
    const arc = await (await fetch(`${BASE}/api/context?arc=quest_kg`)).json();
    expect(arc.quests.map(q => q.id).sort()).toEqual([...W._questArcs.quest_kg].sort());
    expect(arc.node).toBeNull();
    expect((await fetch(`${BASE}/api/context/NOPE`)).status).toBe(404);
    expect((await fetch(`${BASE}/api/context`)).status).toBe(400);
  });

  test('./bin/api context answers from the same route', () => {
    const out = cli('context', 'ATH');
    expect(out).toMatch(/context ATH .*quests/);
    expect(out).toMatch(/traps: unstandable 1/);
    const json = JSON.parse(cli('context', '--arc', 'quest_kg', '--raw'));
    expect(json.scope).toEqual({ arc: 'quest_kg' });
  });
});
