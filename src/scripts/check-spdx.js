#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02hs — asserts the licence header is the FIRST thing in every source file.
//
// Twice now an editing pass has prepended a bare `require`/`import` above the SPDX
// line. In `mud-harness.mjs` (§DX-02hi fault 3) that was a hard SyntaxError above a
// shebang and left a CI job red for 72 commits; in `multiplayer-presence.test.js`
// (§DX-02hn) CommonJS swallowed it and NOTHING saw it for two days. Identical cause,
// wildly different blast radius — and the silent one is the one that hides, which is
// why this is a gate and not a habit.
//
// The rule: SPDX-License-Identifier is on line 1, or on line 2 when line 1 is a
// shebang. Read-only. Run: node scripts/check-spdx.js [--selftest]

'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const EXTS = new Set(['.js', '.mjs', '.cjs', '.sh']);

// Vendored and generated trees carry someone else's headers, or none.
const SKIP = [/^vendor\//, /^node_modules\//, /^build\//];

// A file that is exempt names the reason here, and an exemption that stops being
// needed FAILS — the same stale-exemption rule as check-battlepools.
const EXEMPT = {};

// Returns a finding string, or null when the file is fine.
function inspect(rel, src) {
  const lines = src.split('\n');
  if (!src.trim()) return null;                       // an empty file has nothing to license
  const hasShebang = lines[0].startsWith('#!');
  const want = hasShebang ? 1 : 0;
  const at = lines.findIndex((l) => l.includes('SPDX-License-Identifier'));
  if (at === -1) return `[missing] ${rel} — no SPDX-License-Identifier anywhere`;
  if (at !== want) {
    return `[displaced] ${rel}:${at + 1} — SPDX-License-Identifier should be on line ${want + 1}`
      + `${hasShebang ? ' (line 1 is a shebang)' : ''}, and line ${want + 1} is: ${JSON.stringify(lines[want].slice(0, 60))}`;
  }
  return null;
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const H = '// SPDX-License-Identifier: MIT';

  ok(inspect('a.js', `${H}\n'use strict';\n`) === null, 'header on line 1 is clean');
  ok(inspect('a.mjs', `#!/usr/bin/env node\n${H}\nimport x from 'y';\n`) === null,
    'header on line 2 under a shebang is clean');

  // The two real sightings, reproduced.
  const hn = inspect('a.js', `const path = require('path');\n${H}\n'use strict';\n`);
  ok(hn && hn.startsWith('[displaced]'), '§DX-02hn: a require prepended above the header is caught');
  ok(hn && hn.includes('require'), 'the finding quotes the line that displaced it');
  const hi = inspect('a.mjs', `import fs from 'fs';\n#!/usr/bin/env node\n${H}\n`);
  ok(hi && hi.startsWith('[displaced]'), '§DX-02hi: an import above a shebang is caught');

  ok((inspect('a.js', "'use strict';\nconst x = 1;\n") || '').startsWith('[missing]'),
    'a file with no header at all is caught');
  ok(inspect('a.js', '\n\n') === null, 'an empty file is not a finding');
  // A header on line 2 with no shebang is still displaced — the §DX-02hn shape exactly.
  ok((inspect('a.js', `\n${H}\n`) || '').startsWith('[displaced]'),
    'a blank first line still displaces the header');

  if (fail) { console.log(`\n✗ check-spdx selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-spdx selftest: all ${pass} checks pass`);
  process.exit(0);
}

const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter(Boolean)
  .filter((f) => EXTS.has(path.extname(f)))
  .filter((f) => !SKIP.some((re) => re.test(f)));

const findings = [];
for (const rel of tracked) {
  if (EXEMPT[rel]) continue;
  let src;
  try { src = fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch { continue; }
  const f = inspect(rel, src);
  if (f) findings.push(f);
}
for (const rel of Object.keys(EXEMPT)) {
  if (!tracked.includes(rel)) findings.push(`[stale-exemption] ${rel} is exempt and no longer tracked — retire the exemption`);
}

if (findings.length) {
  console.log(`✗ check:spdx — ${findings.length} file(s) do not carry the licence header first:`);
  for (const f of findings) console.log('   ', f);
  console.log('\n  SPDX-License-Identifier belongs on line 1 (line 2 under a shebang).');
  process.exit(1);
}
console.log(`✓ check:spdx — all ${tracked.length} tracked source file(s) carry SPDX-License-Identifier first`);
