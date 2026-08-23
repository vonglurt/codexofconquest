#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §WALK-2 / §WALK-4 — structural walk-parity: assert the MOVER:CORE block inlined
// in roll2hit-v3.html is byte-identical to the same block in mover.js.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const START = '// ◆◆◆ MOVER:CORE:START ◆◆◆';
const END = '// ◆◆◆ MOVER:CORE:END ◆◆◆';

function core(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const a = src.indexOf(START), b = src.indexOf(END);
  if (a === -1 || b === -1 || b < a) throw new Error(`MOVER:CORE sentinels not found in ${file}`);
  return src.slice(a, b + END.length);
}

const a = core('js/mover.js');
const b = core('roll2hit-v3.html');
if (a === b) {
  console.log(`✓ mover parity: MOVER:CORE identical in mover.js and roll2hit-v3.html (${a.length} bytes)`);
  process.exit(0);
}
console.error('✗ mover parity FAILED: the inlined MOVER:CORE block differs from mover.js');
const la = a.split('\n'), lb = b.split('\n');
for (let i = 0; i < Math.max(la.length, lb.length); i++) {
  if (la[i] !== lb[i]) { console.error(`  first diff at line ${i + 1}:\n    mover.js: ${JSON.stringify(la[i])}\n    html:     ${JSON.stringify(lb[i])}`); break; }
}
process.exit(1);
