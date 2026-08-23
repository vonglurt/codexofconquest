#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §MESH-01j — structural duel-parity: assert the DUEL:CORE block inlined in
// index.html is byte-identical to the same block in duel.js (the
// mover.js / rooms.js precedent). A duel outcome must replay identically on
// client, server, and any third-party verifier.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const START = '// ◆◆◆ DUEL:CORE:START ◆◆◆';
const END = '// ◆◆◆ DUEL:CORE:END ◆◆◆';

function core(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const a = src.indexOf(START), b = src.indexOf(END);
  if (a === -1 || b === -1 || b < a) throw new Error(`DUEL:CORE sentinels not found in ${file}`);
  return src.slice(a, b + END.length);
}

const a = core('js/duel.js');
const b = core('index.html');
if (a === b) {
  console.log(`✓ duel parity: DUEL:CORE identical in duel.js and index.html (${a.length} bytes)`);
  process.exit(0);
}
console.error('✗ duel parity FAILED: the inlined DUEL:CORE block differs from duel.js');
const la = a.split('\n'), lb = b.split('\n');
for (let i = 0; i < Math.max(la.length, lb.length); i++) {
  if (la[i] !== lb[i]) { console.error(`  first diff at line ${i + 1}:\n    duel.js: ${JSON.stringify(la[i])}\n    html:    ${JSON.stringify(lb[i])}`); break; }
}
process.exit(1);
