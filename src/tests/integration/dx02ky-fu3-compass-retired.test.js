// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ky-FU3 — the map audit, its fix route, the layout solver, the data cleanup and the
// junction audit stop reading a node's N/S/E/W fields, which §CELL-01 stripped from every
// node. With no links the solver lined 415 of 416 places up as orphans, and applying its
// proposal would have overwritten the map. Runs against a THROWAWAY server.

const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const GAME = path.join(ROOT, 'play.html');
const { workerPorts, watchChildren, testLedgerDir } = require('./helpers');
const [PORT] = workerPorts('compass').ports;
const BASE = `http://localhost:${PORT}`;

const LINK_CHECKS = ['diagonal_exit', 'max_connections', 'bidirectional', 'dangling_link',
  'direction_sign', 'long_link', 'alignment', 'axis_distance', 'corner_misalign'];

let server, dir;

test.beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-dx02ky-fu3-'));
  const scratch = path.join(dir, 'play.html');
  fs.copyFileSync(GAME, scratch);
  server = spawn(process.execPath, [path.join(ROOT, 'src', 'js', 'wbapi-server.js')], {
    cwd: ROOT,
    env: { ...process.env, LEDGER_DIR: testLedgerDir(), PORT: String(PORT), CODEXOFCONQUEST_FILE: scratch,
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

test('§DX-02ky-FU3 — the map audit carries only checks that can fire on a cell map', async () => {
  const d = await (await fetch(`${BASE}/api/audit/map`)).json();
  expect(d.ok).toBe(true);
  const items = [...d.errors, ...d.warnings, ...d.suggestions];
  for (const i of items) expect(LINK_CHECKS, `${i.check} ${i.code}`).not.toContain(i.check);
  for (const i of items) expect(i.moveSuggestion, `${i.check} ${i.code}`).toBeUndefined();
  expect(d.summary.linkFields).toBe(0);
  expect(d).not.toHaveProperty('blockedEdges');
  expect(d.summary).not.toHaveProperty('structurallySatisfied');
  const text = await (await fetch(`${BASE}/api/audit/map?format=text`)).text();
  expect(text).toContain('MAP CONFORMITY REPORT');
  expect(text).not.toMatch(/BLOCKED EDGES|CORNER NODE|NOT MEASURED/);
});

test('§DX-02ky-FU3 — the map fix and the layout solver are retired, and say what replaced them', async () => {
  const solve = await fetch(`${BASE}/api/layout/solve`);
  const sb = await solve.json();
  expect(solve.status, `placed ${sb.placed} · orphans ${sb.orphans}`).toBe(410);
  expect(sb.error).toMatch(/cell/);
  const fix = await fetch(`${BASE}/api/audit/map/fix`, { method: 'POST', body: '{}' });
  const fb = await fix.json();
  expect(fix.status, JSON.stringify(fb).slice(0, 200)).toBe(410);
  expect(fb.error).toMatch(/cell/);
});

test('§DX-02ky-FU3 — the data cleanup and the junction audit report no link-shaped counts', async () => {
  const clean = await (await fetch(`${BASE}/api/audit/data/clean?dryRun=true`, { method: 'POST', body: '{}' })).json();
  expect(clean.dryRun).toBe(true);
  expect(clean).toHaveProperty('orphanCoords');
  expect(clean).not.toHaveProperty('danglingExits');
  const ja = await (await fetch(`${BASE}/api/graph/junction-audit`)).json();
  expect(ja.ok).toBe(true);
  expect(ja.nukePreview).toHaveProperty('safeToDelete');
  for (const k of ['straightStitch', 'lShapedDeferred', 'deadEndDelete'])
    expect(ja.nukePreview).not.toHaveProperty(k);
});
