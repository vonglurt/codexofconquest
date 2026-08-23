// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §DX-01e — a doc anchor names a SYMBOL; the line number is a refreshable hint.
//
// The defect: the docs pointed into index.html with bare line numbers, and every
// HTML edit shifted them with nothing to notice. Measured when this row opened: of 14
// sampled anchors NINE pointed at unrelated code, and all 10 in CONTRIBUTING.md were
// stale (`21556` for BIT_CONTRACTS had drifted 283 lines; `27685` for the client
// encounter roll, 559). A rotted anchor reads as authoritative and sends the next
// session to the wrong place.
//
// The convention that retires it: `symbol@1234` — the symbol is the pointer, the number
// is a cached hint `npm run anchors:fix` refreshes mechanically. Same lesson §DX-02e and
// §DX-02f both landed on: pin the property, never the generated coordinate.
//
// `check:anchors` (check:walk gate #15) is the durable fence — it FAILS on a dead symbol
// and only WARNS on a drifted number, because failing on drift would re-create the
// per-increment tax this row exists to remove. This file pins that split, the migrated
// docs, and the round trip.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, 'scripts', 'resolve-anchors.js');
const GAME = path.join(ROOT, 'index.html');

const ANCHOR_RE = /`([^`\n]{1,80}?)@(\d{2,6})`/g;
// The legacy form both rows retire: a bare backticked 4–5 digit line number.
const LEGACY_RE = /`(\d{4,5})`/g;
// The live docs migrated in this increment — every anchor in them must resolve.
const MIGRATED = ['CONTRIBUTING.md', 'BACKLOG.md', 'mechanics.md',
                  'BACKLOG-1-playable-truth.md', 'BACKLOG-2-engine-systems.md',
                  'BACKLOG-3-content-narrative.md', 'BACKLOG-4-world-navigation.md',
                  'BACKLOG-5-platform-tooling.md', 'BACKLOG-6-verification-docs.md',
                  path.join('docs', 'mechanics', 'mechanics-combat.md')];
// §DX-01e-FU — potential.md is the live SEED INBOX: its anchors are read to build FROM,
// so a rotted one sends a future session to build against the wrong code. It was the last
// live doc still on the bare form (36 anchors; 35 of them pointed somewhere else by the
// time they were measured). Everything still bare after this is HISTORY — plan-archive.md
// and the lab reports — which is annotated, never rewritten (§DX-02c/§AUDIT-03m).
const SEED_INBOX = 'potential.md';

function run(args) {
  // stdout AND stderr — the gate warns on stderr and reports findings there too.
  const r = spawnSync('node', [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

function anchorsIn(file) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const out = [];
  let m; ANCHOR_RE.lastIndex = 0;
  while ((m = ANCHOR_RE.exec(text))) out.push({ sym: m[1], line: Number(m[2]) });
  return out;
}

test('§DX-01e — the gate is green, and its selftest proves each phase catches a plant', () => {
  const self = run(['--selftest']);
  expect(self.code).toBe(0);
  for (const phase of ['dead', 'stale', 'fresh', 'fix', 'boundary', 'placeholder', 'qualified'])
    expect(self.out).toContain(`✓ selftest[${phase}]`);

  const audit = run([]);
  expect(audit.code).toBe(0);
  expect(audit.out).toContain('✓ check:anchors');
});

test('§DX-01e — every anchor in the migrated docs resolves at its cached line', () => {
  const lines = fs.readFileSync(GAME, 'utf8').split('\n');
  const total = [];
  for (const file of MIGRATED) {
    for (const a of anchorsIn(file)) {
      // `symbol@1234` is the documented placeholder the docs use to SHOW the convention.
      if (/^(?:symbol|sym|path\/to\/file\.js:symbol)$/.test(a.sym)) continue;
      total.push(a);
      // A file-qualified anchor (`js/x.js:sym@N`) is covered by the gate; this test
      // pins the game-file ones, which are the class that rotted.
      if (/^[\w./-]+\.(?:js|mjs|html|md):/.test(a.sym)) continue;
      expect(lines[a.line - 1], `${file}: \`${a.sym}@${a.line}\``).toContain(a.sym);
    }
  }
  // The migration moved every bare anchor out of the OPEN rows; if this count collapses,
  // someone reverted the convention rather than extending it.
  expect(total.length).toBeGreaterThanOrEqual(45);
});

test('§DX-01e — a dead symbol FAILS the gate; a merely drifted number does not', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dx01e-'));
  const doc = path.join(ROOT, `dx01e-probe-${path.basename(tmp)}.md`);
  try {
    // drifted-but-resolvable → warns, exit 0
    fs.writeFileSync(doc, 'probe `const WORLD_DB@11` here\n');
    let r = run([]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/stale line hint/);

    // symbol absent from the HTML → exit 1, and the finding names the anchor
    fs.writeFileSync(doc, 'probe `_thisSymbolWasRenamedAway@11` here\n');
    r = run([]);
    expect(r.code).toBe(1);
    expect(r.out).toContain('_thisSymbolWasRenamedAway');

    // a rename that EXTENDS the old identifier is still dead — substring alone would
    // have let `XP_BY_TIER` → `XP_BY_TIER_RETIRED` slip through silently.
    fs.writeFileSync(doc, 'probe `const WORLD_D@11` here\n');
    r = run([]);
    expect(r.code).toBe(1);
    expect(r.out).toContain('const WORLD_D');

    // --fix repairs the hint in place and leaves the doc otherwise byte-identical
    fs.writeFileSync(doc, 'probe `const WORLD_DB@11` here\n');
    expect(run(['--fix']).code).toBe(0);
    const fixed = fs.readFileSync(doc, 'utf8');
    const real = fs.readFileSync(GAME, 'utf8').split('\n').findIndex(l => l.includes('const WORLD_DB')) + 1;
    expect(fixed).toBe(`probe \`const WORLD_DB@${real}\` here\n`);
  } finally {
    fs.rmSync(doc, { force: true });
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('§DX-01e-FU — the seed inbox carries no bare anchors, and every symbol it names resolves', () => {
  const text = fs.readFileSync(path.join(ROOT, SEED_INBOX), 'utf8');

  // The gate fails on a DEAD symbol, but it is silent about a bare `31732` — that form
  // resolves to nothing to check. So the only thing standing between potential.md and a
  // slow slide back to line numbers is this assertion.
  LEGACY_RE.lastIndex = 0;
  expect(text.match(LEGACY_RE) || [], `${SEED_INBOX} regressed to bare line anchors`).toEqual([]);

  const lines = fs.readFileSync(GAME, 'utf8').split('\n');
  const anchors = anchorsIn(SEED_INBOX)
    .filter(a => !/^(?:symbol|sym|path\/to\/file\.js:symbol)$/.test(a.sym));
  // 36 bare anchors migrated, plus the `item_check` handler named while correcting the
  // dead-opcode count. A collapse here means someone stripped the anchors instead.
  expect(anchors.length).toBeGreaterThanOrEqual(36);
  for (const a of anchors)
    expect(lines[a.line - 1], `${SEED_INBOX}: \`${a.sym}@${a.line}\``).toContain(a.sym);
});

test('§DX-01e — lookup mode answers where a symbol lives now, and refuses to invent one', () => {
  // §DX-02i — was `const XP_BY_TIER`, a constant nothing read; deleting it would have
  // broken this fixture. `const EFFORT_XP_PCT` is a live §XP-01 dial with exactly one
  // occurrence, so the lookup still has a single unambiguous answer to resolve to.
  const hit = run(['const EFFORT_XP_PCT']);
  expect(hit.code).toBe(0);
  expect(hit.out).toMatch(/`const EFFORT_XP_PCT@\d+`/);

  const miss = run(['_definitelyNotInTheGameFile']);
  expect(miss.code).toBe(1);
  expect(miss.out).toContain('does not occur');
});
