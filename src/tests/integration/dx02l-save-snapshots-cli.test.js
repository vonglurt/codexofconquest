// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02l — the dated-backup surface is reachable from ./api.sh.
//
// Why this test exists. `POST /api/save` — the one surface that stamps a dated
// snapshot on purpose (§DX-02k) — had no `./api.sh` wrapper, so verifying it
// needed a raw `curl -XPOST http://localhost:1367/api/save`. prompt.md §3 says
// authoring never falls back to raw curl: *"if `./api.sh` lacks a command you
// need, add the endpoint + a named `./api.sh` wrapper."* Here the endpoint
// existed and the wrapper did not — the same gap read from the other end, and
// the author-facing guide had been printing the curl line for it.
//
// The snapshots half is the other thing §DX-02k left: the dated files are
// gitignored, so nothing in the repo will ever mention them (six, ~32 MB, had
// accumulated invisibly). `./api.sh snapshots` is now the only thing that will
// tell you they are there, and the sweep will not throw away a snapshot the
// milepoints/patches chain has never seen — archive-snapshots.sh patches each
// file and THEN removes it, so an unarchived snapshot is the only copy of that
// state. `--force` is the deliberate discard.
//
// Everything here runs against a THROWAWAY server on a scratch copy of the game
// file, because the sweep deletes files: it must never be pointed at the repo.
// That is also the assertion that matters most — the snapshot surface can only
// ever name a file with an exact `-YYYYMMDD-HHMMSS` stamp, so no decoy beside
// the game file (least of all the game file itself) is reachable by it.

const { test, expect } = require('@playwright/test');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const GAME = path.join(ROOT, 'play.html');
const PORT = 13897;
const BASE = `http://localhost:${PORT}`;
const STAMPED = /^roll2hit-v3-\d{8}-\d{6}\.html$/;

// A name the real patch chain already knows — `milepoints/patches/<stem>.patch`
// exists — so `archived:true` can be exercised without writing into the repo.
const ARCHIVED_NAME = 'roll2hit-v3-20260709-034151.html';

let server, dir, scratch;

const stampedIn = d => fs.readdirSync(d).filter(f => STAMPED.test(f));

function cli(...args) {
  return execFileSync(process.execPath, [path.join(ROOT, 'src', 'api', 'wb.js'), ...args, '--server', BASE],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

test.beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r2h-dx02l-'));
  scratch = path.join(dir, 'play.html');
  fs.copyFileSync(GAME, scratch);
  server = spawn(process.execPath, ['src/js/wbapi-server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), ROLL2HIT_FILE: scratch,
      PEERS_CACHE_FILE: path.join(dir, 'peers.json') },
    stdio: 'ignore',
  });
  for (let i = 0; i < 150; i++) {
    try { if ((await fetch(`${BASE}/api/ping`)).ok) return; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error(`throwaway wbapi-server did not answer on :${PORT}`);
});

test.afterAll(() => {
  if (server) { try { server.kill('SIGTERM'); } catch {} }
  if (dir) fs.rmSync(dir, { recursive: true, force: true });
});

test.beforeEach(() => {
  for (const f of stampedIn(dir)) fs.rmSync(path.join(dir, f), { force: true });
});

test.describe('§DX-02l — ./api.sh save + ./api.sh snapshots', () => {

  // The row's core ask: the surface exists in the CLI at all.
  test('save is a known command and reports both paths', () => {
    const rootBefore = stampedIn(ROOT);

    const out = cli('save');
    expect(out).not.toMatch(/Unknown command/);
    expect(out).toMatch(/primary\s+.*roll2hit-v3\.html/);
    expect(out).toMatch(/backup\s+.*roll2hit-v3-\d{8}-\d{6}\.html/);

    // …and the backup landed beside the SCRATCH game file, not in the repo
    // and not in the CWD the CLI happened to run from (§DX-02k).
    expect(stampedIn(dir)).toHaveLength(1);
    expect(stampedIn(ROOT)).toEqual(rootBefore);
  });

  test('snapshots lists what save left, with its size', () => {
    cli('save');
    const listed = cli('snapshots');
    const name = stampedIn(dir)[0];
    expect(listed).toMatch(/1 snapshot\(s\) in/);
    expect(listed).toContain(dir);
    expect(listed).toContain(name);
    expect(listed).toMatch(/unarchived/);

    const json = JSON.parse(cli('snapshots', '--raw'));
    expect(json.count).toBe(1);
    expect(json.snapshots[0].bytes).toBe(fs.statSync(path.join(dir, name)).size);
    expect(json.snapshots[0].archived).toBe(false);
  });

  // The safety property: disposal keeps history by default. archive-snapshots.sh
  // turns each snapshot into a patch and then removes it, so a snapshot the chain
  // has never seen is unrecorded state — deleting it is a discard, not a sweep.
  test('sweep keeps a snapshot the patch chain has never seen', () => {
    cli('save');
    const name = stampedIn(dir)[0];

    const out = cli('snapshots', '--sweep');
    expect(out).toMatch(/deleted 0/);
    expect(out).toContain('kept');
    expect(out).toMatch(/archive-snapshots\.sh/);
    expect(fs.existsSync(path.join(dir, name))).toBe(true);
  });

  test('sweep deletes one the chain already holds, and --force discards the rest', () => {
    cli('save');
    const fresh = stampedIn(dir)[0];
    fs.copyFileSync(path.join(dir, fresh), path.join(dir, ARCHIVED_NAME));
    expect(fs.existsSync(path.join(ROOT, 'build', 'milepoints', 'patches',
      `${path.basename(ARCHIVED_NAME, '.html')}.patch`))).toBe(true);

    const swept = JSON.parse(cli('snapshots', '--sweep', '--raw'));
    expect(swept.deleted).toEqual([ARCHIVED_NAME]);
    expect(swept.freedBytes).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(dir, ARCHIVED_NAME))).toBe(false);
    expect(fs.existsSync(path.join(dir, fresh))).toBe(true);

    const forced = JSON.parse(cli('snapshots', '--sweep', '--force', '--raw'));
    expect(forced.forced).toBe(true);
    expect(forced.deleted).toEqual([fresh]);
    expect(stampedIn(dir)).toEqual([]);
  });

  // Destructive route, same guard as every other one.
  test('DELETE /api/snapshots refuses without a nonce, and deletes nothing', async () => {
    cli('save');
    const before = stampedIn(dir);
    expect(before).toHaveLength(1);

    const r = await fetch(`${BASE}/api/snapshots?force=true`, { method: 'DELETE' });
    expect(r.status).toBe(403);
    expect((await r.json()).error).toMatch(/nonce/i);
    expect(stampedIn(dir)).toEqual(before);

    // and a nonce issued for something else does not open it either
    const n = await (await fetch(`${BASE}/api/nonce`, { method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'node', id: 'LHR' }) })).json();
    const r2 = await fetch(`${BASE}/api/snapshots?force=true`,
      { method: 'DELETE', headers: { 'X-Nonce': n.nonce } });
    expect(r2.status).toBe(403);
    expect(stampedIn(dir)).toEqual(before);
  });

  // ── The durable assertion — what the sweep is allowed to name ──────────────
  // A stamped filename is the whole guard between "delete the backups" and
  // "delete the game". Decoys that merely start with the same stem must be
  // invisible to it, and a forced sweep is the strongest form of the question.
  test('only exact -YYYYMMDD-HHMMSS files are reachable; the game file never is', () => {
    const decoys = ['roll2hit-v3-notes.html', 'roll2hit-v3-2026.html',
                    'roll2hit-v3-20260709.html', 'roll2hit-v3-20260709-0341.html',
                    'roll2hit-v3-20260709-034151.htm', 'roll2hit-v3-20260709-034151.html.bak'];
    for (const d of decoys) fs.writeFileSync(path.join(dir, d), 'decoy');
    cli('save');
    const real = stampedIn(dir);
    expect(real).toHaveLength(1);

    const listed = JSON.parse(cli('snapshots', '--raw'));
    expect(listed.snapshots.map(s => s.name)).toEqual(real);

    const swept = JSON.parse(cli('snapshots', '--sweep', '--force', '--raw'));
    expect(swept.deleted).toEqual(real);
    for (const d of decoys) expect(fs.existsSync(path.join(dir, d))).toBe(true);
    expect(fs.existsSync(scratch)).toBe(true);
    expect(fs.readFileSync(scratch, 'utf8').length).toBeGreaterThan(1000000);

    for (const d of decoys) fs.rmSync(path.join(dir, d), { force: true });
  });

  // The row itself: an endpoint whose only documented client is `curl` is the
  // defect. The author-facing guide must reach it the way authors are told to.
  //
  // §DX-02l-FU — the first form of this assertion was line-level (`curl` AND
  // `/api/save` anywhere on one line) and it went red on PROSE ABOUT THIS VERY
  // DEFECT: CONTRIBUTING Hazard #7 and prompt.md §7, both written to record it,
  // name `POST /api/save` and raw `curl` in the same sentence. A doc only
  // *tells* you to curl in the shapes an author can copy and run — a line in a
  // fenced block, an inline code span holding the whole command, or a line that
  // simply starts with `curl`. A sentence naming both tokens is history.
  // The regex must serve the prose; the repo has already paid once for a doc
  // bent to a checker (§AUDIT-03l).
  const curlInstructions = (src, endpointRe) => {
    const out = [];
    let fenced = false;
    src.split('\n').forEach((line, i) => {
      if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; return; }
      const runnable = fenced ? [line] : [
        ...[...line.matchAll(/`([^`]+)`/g)].map(m => m[1]),
        ...(/^\s*(?:[-*>]\s*)*\$?\s*curl\b/.test(line) ? [line] : []),
      ];
      if (runnable.some(cmd => /\bcurl\b/.test(cmd) && endpointRe.test(cmd)))
        out.push(`${i + 1}: ${line.trim()}`);
    });
    return out;
  };

  test('no author-facing doc reaches /api/save with raw curl', () => {
    const SURFACE = /\/api\/(save|snapshots)\b/;   // both wrappers now exist
    for (const rel of ['docs/api/api-user-guide.md', 'docs/api/API-README.md',
                       'docs/design/prompt.md', 'CONTRIBUTING.md']) {
      const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      expect(curlInstructions(src, SURFACE),
        `${rel} still tells authors to curl the dated-backup surface`).toEqual([]);
    }
  });

  // The positive control the narrowing needs: proving the detector still SEES
  // the defect it was written for, in each shape a doc can commit it, without
  // touching a real file. Without this, narrowing an assertion is
  // indistinguishable from deleting it.
  test('the narrowed detector still catches every runnable curl shape', () => {
    const SURFACE = /\/api\/(save|snapshots)\b/;
    const instructions = [
      '```bash\ncurl -s -XPOST http://localhost:1367/api/save | jq\n```',
      'Take a backup with `curl -XPOST http://localhost:1367/api/save`.',
      'curl -s -XPOST http://localhost:1367/api/save',
      '- curl -XDELETE http://localhost:1367/api/snapshots?force=true',
    ];
    for (const doc of instructions)
      expect(curlInstructions(doc, SURFACE), `missed: ${doc}`).not.toEqual([]);

    const prose = [
      'verifying §DX-02k needed raw `curl` — `POST /api/save` had no wrapper.',
      '`dx02l-save-snapshots-cli.test.js` — *"no doc reaches `/api/save` with raw curl"*.',
      'Use `./api.sh save`, never curl.',
      '```bash\ncurl -s http://localhost:1367/api/ping\n```',
    ];
    for (const doc of prose)
      expect(curlInstructions(doc, SURFACE), `false positive: ${doc}`).toEqual([]);
  });
});
