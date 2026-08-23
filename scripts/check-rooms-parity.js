#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §NAV-01c — structural rooms-parity: assert the ROOMS:CORE block inlined in
// roll2hit-v3.html is byte-identical to the same block in rooms.js.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const START = '// ◆◆◆ ROOMS:CORE:START ◆◆◆';
const END = '// ◆◆◆ ROOMS:CORE:END ◆◆◆';

function core(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const a = src.indexOf(START), b = src.indexOf(END);
  if (a === -1 || b === -1 || b < a) throw new Error(`ROOMS:CORE sentinels not found in ${file}`);
  return src.slice(a, b + END.length);
}

const a = core('js/rooms.js');
const b = core('roll2hit-v3.html');
if (a === b) {
  console.log(`✓ rooms parity: ROOMS:CORE identical in rooms.js and roll2hit-v3.html (${a.length} bytes)`);
  process.exit(0);
}
console.error('✗ rooms parity FAILED: the inlined ROOMS:CORE block differs from rooms.js');
const la = a.split('\n'), lb = b.split('\n');
for (let i = 0; i < Math.max(la.length, lb.length); i++) {
  if (la[i] !== lb[i]) { console.error(`  first diff at line ${i + 1}:\n    rooms.js: ${JSON.stringify(la[i])}\n    html:     ${JSON.stringify(lb[i])}`); break; }
}
process.exit(1);
