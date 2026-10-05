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
const { workerPorts, watchChildren, testLedgerDir } = require('./helpers');
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

test.describe('§EDITOR-04 — the questline context query', () => {
  test('the unwritten-flag census over every node is check:questgraph\'s written-by-nothing set', () => {
    const W = world();
    const QG = require(path.join(ROOT, 'src', 'scripts', 'check-questgraph.js'));
    const seen = new Set();
    for (const code of Object.keys(W.nodeMap))
      for (const u of questContext(W, { node: code }).flags.unwritten) seen.add(u.flag);
    expect([...seen].sort()).toEqual(Object.keys(QG.KNOWN_UNWRITTEN_FLAG).sort());
  });

  test('cell primacy reproduces the §AUDIT-03x baseline: 419 nodes, 253 cells, 166 non-primary', () => {
    const W = world();
    const { cellOf } = require(path.join(ROOT, 'src', 'js', 'quest-context.js'));
    const cells = new Set(); let nonPrimary = 0;
    for (const code of Object.keys(W.nodeMap)) {
      const c = cellOf(W, code); cells.add(`${c.r},${c.c}`); if (!c.isPrimary) nonPrimary++;
    }
    // §SIREN-01-FU: 416/244/172 until the Littoral arc got nine cells of its own (three new nodes, six moved)
    expect([Object.keys(W.nodeMap).length, cells.size, nonPrimary]).toEqual([419, 253, 166]);
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

test.describe('§EDITOR-04 increment 3 — the wizard\'s Prove step', () => {
  const { proveDraft } = require(path.join(ROOT, 'src', 'js', 'quest-context.js'));
  const arc = () => [
    { id: 'quest_zzw_1', type: 'side', title: 'one', activateNode: 'LHR', gate: {}, completion: { atNode: 'LHR' },
      itemChain: [{ action: 'grantBit', flag: 'quest_zzw_1_done', label: 'one' }] },
    { id: 'quest_zzw_2', type: 'side', title: 'two', activateNode: 'LHR', gate: { flags: ['quest_zzw_1_done'] }, completion: { atNode: 'LHR' } },
  ];

  test('a chained draft whose first step writes the second\'s gate proves clean', () => {
    expect(proveDraft(world(), arc())).toEqual({ ok: true, count: 0, traps: [] });
  });

  test('each trap is caught by kind: existing id, unstandable node, unwritten gate, self-deadlock', () => {
    const W = world();
    const kinds = (drafts) => proveDraft(W, drafts).traps.map(t => t.kind);
    const [one, two] = arc();
    expect(kinds([{ ...one, id: 'mq_1' }, two])).toEqual(['exists']);
    expect(kinds([{ ...one, activateNode: 'ATH' }, two])).toEqual(['unstandable']);
    expect(kinds([one, { ...two, gate: { flags: ['zzw_nothing_writes_this'] } }])).toEqual(['unwritten-gate']);
    expect(kinds([one, { ...two, completion: { flags: ['zzw_self'] }, onComplete: [{ kind: 'flag_write', set: ['zzw_self'] }] }]))
      .toEqual(['self-deadlock']);
    expect(kinds([{ ...one, itemChain: [] }, two])).toEqual(['unwritten-gate']);
  });

  test('POST /api/context/prove answers what proveDraft answers, and refuses an empty body', async () => {
    const post = (body) => fetch(`${BASE}/api/context/prove`, { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const bad = [{ ...arc()[0], activateNode: 'ATH' }, arc()[1]];
    expect(await (await post({ quests: bad })).json()).toEqual(proveDraft(world(), bad));
    expect((await post({})).status).toBe(400);
  });

  test('the Mission tab is the wizard: Locate and Prove are wired, and a trap holds POST All', () => {
    const html = fs.readFileSync(path.join(ROOT, 'edit.html'), 'utf8');
    expect(html).toContain('⛓ Mission Wizard');
    expect(html).toContain("MB('mb-locate-btn').addEventListener('click', mbLocate);");
    expect(html).toContain('if (!anyError) mbProve(quests);');
    expect(html).toMatch(/if \(mbTraps\)\s+\{ mbShowResult/);
    expect(html).toContain("MB('mb-post').disabled = mbTraps > 0;");
  });
});
