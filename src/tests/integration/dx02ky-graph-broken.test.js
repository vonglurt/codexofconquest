// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ky — GET /api/graph/broken reports the cell-model census `./bin/api broken` prints:
// a node whose grid cell touches no occupied neighbour cell. It walked the N/S/E/W fields
// §CELL-01 stripped and answered `broken: 0`. Route and CLI run against a THROWAWAY server.

const { test, expect } = require('@playwright/test');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const GAME = path.join(ROOT, 'play.html');
const { workerPorts, watchChildren } = require('./helpers');
const [PORT] = workerPorts('graph').ports;
const BASE = `http://localhost:${PORT}`;

let server, dir;

test.beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-dx02ky-'));
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

function isolatedOffline() {
  const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
  W.load(GAME);
  const cg = {};
  for (const code of Object.keys(W.nodeMap)) {
    const p = W.nodeCoords[code];
    if (p && cg[`${p.r},${p.c}`] === undefined) cg[`${p.r},${p.c}`] = code;
  }
  return Object.entries(cg).filter(([k]) => {
    const [r, c] = k.split(',').map(Number);
    return ![[-1, 0], [1, 0], [0, 1], [0, -1]].some(([dr, dc]) => cg[`${r + dr},${c + dc}`]);
  }).map(([, code]) => code).sort();
}

test('§DX-02ky — the route, the heatmap and the file agree on the isolated cells, and there are some', async () => {
  const broken = await (await fetch(`${BASE}/api/graph/broken`)).json();
  const heat = await (await fetch(`${BASE}/api/grid/heatmap`)).json();
  const offline = isolatedOffline();
  expect(broken.ok).toBe(true);
  expect(broken.broken).toBe(broken.cells.length);
  expect(broken.cells.map(c => c.code).sort()).toEqual(heat.cells.filter(c => c.heat === 0).map(c => c.code).sort());
  expect(broken.cells.map(c => c.code).sort()).toEqual(offline);
  expect(broken.broken).toBeGreaterThan(0);
});

test('§DX-02ky — ./bin/api broken prints the count the route returns', async () => {
  const broken = await (await fetch(`${BASE}/api/graph/broken`)).json();
  const out = execFileSync(process.execPath, [path.join(ROOT, 'src', 'api', 'wb.js'), 'broken', '--server', BASE],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  expect(out).toContain(`${broken.broken} isolated cell(s)`);
});

test('§DX-02ky — the edge-model parameters are named as ignored, not silently honoured', async () => {
  const r = await (await fetch(`${BASE}/api/graph/broken?maxGap=4&root=BK`)).json();
  expect(r.retiredParams).toEqual(['maxGap', 'root']);
  expect(r).not.toHaveProperty('edges');
});
