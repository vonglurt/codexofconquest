#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com
// §VM-01-D — structural quest-parity: assert the QUEST:CORE block inlined in
// roll2hit-v3.html is byte-identical to the same block in js/quest.js. The quest
// VM (opcode table + gate evaluators + bit-chain executor) is a host-injected
// kernel; this is the fourth parity fence beside mover/rooms/duel.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const START = '// ◆◆◆ QUEST:CORE:START ◆◆◆';
const END = '// ◆◆◆ QUEST:CORE:END ◆◆◆';

function core(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const a = src.indexOf(START), b = src.indexOf(END);
  if (a === -1 || b === -1 || b < a) throw new Error(`QUEST:CORE sentinels not found in ${file}`);
  return src.slice(a, b + END.length);
}

const a = core('js/quest.js');
const b = core('roll2hit-v3.html');
if (a === b) {
  console.log(`✓ quest parity: QUEST:CORE identical in quest.js and roll2hit-v3.html (${a.length} bytes)`);
  process.exit(0);
}
console.error('✗ quest parity FAILED: the inlined QUEST:CORE block differs from quest.js');
const la = a.split('\n'), lb = b.split('\n');
for (let i = 0; i < Math.max(la.length, lb.length); i++) {
  if (la[i] !== lb[i]) { console.error(`  first diff at line ${i + 1}:\n    quest.js: ${JSON.stringify(la[i])}\n    html:     ${JSON.stringify(lb[i])}`); break; }
}
process.exit(1);
