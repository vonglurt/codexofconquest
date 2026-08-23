// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02k — WBAPI.save() must be told where to write.
//
// Why this test exists. `save(outputPath)` used to fall back to
// `this.getStampedName()`, which returns a BARE FILENAME —
// `play-YYYYMMDD-HHMMSS.html`. `fs.writeFileSync` resolves a bare name
// against the PROCESS CWD, so every argless caller dropped a ~5.4 MB copy of the
// whole game wherever it happened to be running, and nothing ever removed it.
//
// The row that filed this assumed the argless callers were stray scripts. They
// were not: the SERVER's own per-write path was argless. `saveAndRestart` and
// `saveAndVerify` ran `WBAPI.save()` → dated snapshot in the CWD →
// `copyFileSync(snapshot, GAME_FILE)` → snapshot left behind, once per successful
// PUT/POST/DELETE, forever. The snapshot was never a backup of the pre-write
// state — it holds the NEW text; its only job was to be the byte source of the
// copy. Three of them (16 MB) were sitting in the repo root when this was found,
// invisible because `play-2*.html` is gitignored.
//
// So the destination is now always explicit:
//   save(dest)      — write exactly there
//   saveStamped()   — dated backup BESIDE THE SOURCE FILE (POST /api/save, the CLI)
//   saveGameFile()  — server-only: temp beside the game file + atomic rename
//
// The durable assertion is the last one in this file: no argless `WBAPI.save()`
// may reappear in the shipped code. That is the shape of the bug, and it is
// invisible in behaviour — the write succeeds, the game is correct, and the only
// symptom is a file you were not told about, in a directory nobody named.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const GAME = path.join(ROOT, 'play.html');
const STAMPED = /^play-\d{8}-\d{6}\.html$/;

function freshWorld(file) {
  delete require.cache[require.resolve(path.join(ROOT, 'src', 'js', 'wbapi-core.js'))];
  const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
  W.load(file || GAME);
  return W;
}

const stampedIn = dir => fs.readdirSync(dir).filter(f => STAMPED.test(f));

test.describe('§DX-02k — save() requires a destination', () => {

  test('argless save() refuses, and writes nothing anywhere', () => {
    const W = freshWorld();

    const rootBefore = stampedIn(ROOT);
    const cwdBefore  = stampedIn(process.cwd());

    const r = W.save();
    expect(r.ok).toBe(false);
    // The error has to name the alternative, or the next author just passes
    // getStampedName() back in and re-creates the CWD-relative write.
    expect(r.error).toMatch(/requires a destination/i);
    expect(r.error).toMatch(/saveStamped/);

    expect(stampedIn(ROOT)).toEqual(rootBefore);
    expect(stampedIn(process.cwd())).toEqual(cwdBefore);
  });

  // The actual defect: the destination followed the process, not the file.
  test('saveStamped() lands beside the SOURCE FILE, not the CWD', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-dx02k-'));
    const src = path.join(dir, 'play.html');
    fs.copyFileSync(GAME, src);
    try {
      const rootBefore = stampedIn(ROOT);
      const cwdBefore  = stampedIn(process.cwd());

      const W = freshWorld(src);
      const r = W.saveStamped();
      expect(r.ok, r.error).toBe(true);

      // it went where the source lives …
      expect(path.dirname(r.path)).toBe(path.resolve(dir));
      expect(STAMPED.test(path.basename(r.path))).toBe(true);
      expect(fs.readFileSync(r.path, 'utf8')).toBe(fs.readFileSync(src, 'utf8'));

      // … and nowhere near where the process happens to be running
      expect(stampedIn(ROOT)).toEqual(rootBefore);
      expect(stampedIn(process.cwd())).toEqual(cwdBefore);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('save(dest) still round-trips an edit through disk', () => {
    const tmp = path.join(os.tmpdir(), `coc-dx02k-rt-${process.pid}.html`);
    fs.copyFileSync(GAME, tmp);
    try {
      const W = freshWorld(tmp);
      const wrote = W.editField('node', 'LHR', 'label', 'Birka (§DX-02k probe)');
      expect(wrote.ok, wrote.error).toBe(true);
      expect(W.save(tmp).ok).toBe(true);

      const W2 = freshWorld(tmp);
      expect(W2.nodeMap.LHR.label).toBe('Birka (§DX-02k probe)');
    } finally {
      fs.rmSync(tmp, { force: true });
    }
  });

  test('a source with no loaded text is still refused before the path check', () => {
    const W = freshWorld();
    const keep = W._rawSrc;
    W._rawSrc = '';
    try {
      expect(W.save(path.join(os.tmpdir(), 'coc-dx02k-never.html')).ok).toBe(false);
      expect(W.saveStamped().ok).toBe(false);
      expect(fs.existsSync(path.join(os.tmpdir(), 'coc-dx02k-never.html'))).toBe(false);
    } finally {
      W._rawSrc = keep;
    }
  });

  // ── The inverse assertion — the one that keeps this fixed ──────────────────
  test('no shipped code calls WBAPI.save() with no destination', () => {
    const files = [
      path.join(ROOT, 'src', 'js', 'wbapi-server.js'),
      path.join(ROOT, 'src', 'js', 'wbapi-core.js'),
      path.join(ROOT, 'src', 'tools', 'wbapi-cli.js'),
    ];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8')
        // strip line comments so this file's own explanatory prose (and the
        // server's) does not read as a call site
        .split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');
      const hits = src.match(/WBAPI\.save\(\s*\)/g) || [];
      expect(hits, `${path.basename(f)} calls WBAPI.save() with no destination`).toEqual([]);
    }
  });

  test("the server's per-write path renames a temp instead of stamping", () => {
    const src = fs.readFileSync(path.join(ROOT, 'src', 'js', 'wbapi-server.js'), 'utf8');

    // the helper exists, writes a temp beside the game file, and renames it in
    const helper = src.slice(src.indexOf('function saveGameFile()'));
    expect(helper.indexOf('function saveGameFile()')).toBe(0);
    const body = helper.slice(0, helper.indexOf('\n}\n') + 3);
    expect(body).toMatch(/\$\{GAME_FILE\}\.tmp-/);
    expect(body).toMatch(/fs\.renameSync/);

    // and both per-write entry points go through it
    for (const fn of ['saveAndRestart', 'saveAndVerify']) {
      const start = src.indexOf(`function ${fn}(`);
      expect(start, `${fn} not found`).toBeGreaterThan(-1);
      expect(src.slice(start, start + 1200)).toMatch(/saveGameFile\(\)/);
    }
  });
});
