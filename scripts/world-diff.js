#!/usr/bin/env node
'use strict';
// world-diff.js — §MESH-01d3 modification-set inspector.
//
//   node scripts/world-diff.js <mine.html> <theirs.html>
//
// Compares two Roll2Hit world files the way the mesh does: per data collection
// (the 8 manifest parts) plus ENGINE_VER, then hashes everything OUTSIDE the
// data spans. A downloaded world is someone else's CODE — if this prints the
// CODE DIFFERS block, review every non-data change by hand before opening it.
//
// Exit codes: 0 identical · 1 data differs (code identical) · 2 CODE differs.
// rawSpan/sha16 mirror wbapi-server.js (kept standalone so this runs with no deps).
const fs = require('fs');
const crypto = require('crypto');

const PARTS = ['NODE_MAP', 'NODE_COORDS', 'SEA_RUNS', 'SEA_LANES', 'ROAD_RUNS', 'QUEST_DB', 'MONSTER_POOL', 'WORLD_DB'];
const sha16 = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

function rawSpan(src, name) {
  const m = new RegExp(`(?:const|let|var)\\s+${name}\\s*=\\s*`).exec(src);
  if (!m) return null;
  let i = m.index + m[0].length;
  while (i < src.length && !'{[('.includes(src[i])) {
    if (src[i] === '\n' || src[i] === ';') return null;
    i++;
  }
  if (i >= src.length) return null;
  const open = src[i], close = { '{': '}', '[': ']', '(': ')' }[open];
  let depth = 0, inStr = null, j = i;
  while (j < src.length) {
    const c = src[j];
    if (inStr) {
      if (c === '\\' && inStr !== '`') { j += 2; continue; }
      if (c === inStr) inStr = null;
    } else if (c === '/' && src[j + 1] === '/') { while (j < src.length && src[j] !== '\n') j++; continue; }
    else if (c === '/' && src[j + 1] === '*') { j += 2; while (j < src.length && !(src[j] === '*' && src[j + 1] === '/')) j++; j += 2; continue; }
    else {
      if (c === '"' || c === "'" || c === '`') inStr = c;
      else if (c === open) depth++;
      else if (c === close) { depth--; if (depth === 0) return src.slice(m.index, j + 1); }
    }
    j++;
  }
  return null;
}

// Approximate entry keys for a collection span — good enough for an added/
// removed report (a deep semantic diff is not this tool's job).
function keysOf(name, span) {
  if (!span) return new Set();
  if (name === 'QUEST_DB' || name === 'MONSTER_POOL')
    return new Set([...span.matchAll(/\b(?:id|key)\s*:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]));
  return new Set([...span.matchAll(/^\s{1,6}(['"]?)([A-Za-z0-9_ ]+)\1\s*:\s*[{[]/gm)].map((m) => m[2]));
}
const engineVerOf = (src) => (src.match(/const\s+ENGINE_VER\s*=\s*['"]([^'"]+)['"]/) || [])[1] || 'unversioned';

const [, , fileA, fileB] = process.argv;
if (!fileA || !fileB) {
  console.error('usage: node scripts/world-diff.js <mine.html> <theirs.html>');
  process.exit(64);
}
const A = fs.readFileSync(fileA, 'utf8');
const B = fs.readFileSync(fileB, 'utf8');

console.log(`\nworld-diff — §MESH-01d3 modification-set inspector`);
console.log(`  A (yours):  ${fileA}  (${A.length.toLocaleString()} B, ${engineVerOf(A)})`);
console.log(`  B (theirs): ${fileB}  (${B.length.toLocaleString()} B, ${engineVerOf(B)})\n`);

let dataDiffers = false;
let codeA = A, codeB = B;
for (const name of PARTS) {
  const sa = rawSpan(A, name), sb = rawSpan(B, name);
  if (sa) codeA = codeA.replace(sa, `[DATA:${name}]`);
  if (sb) codeB = codeB.replace(sb, `[DATA:${name}]`);
  if (!sa || !sb) { console.log(`  ⛔ ${name.padEnd(13)} MISSING in ${!sa ? 'A' : 'B'}`); dataDiffers = true; continue; }
  if (sha16(sa) === sha16(sb)) { console.log(`  ✅ ${name.padEnd(13)} identical (${sha16(sa)})`); continue; }
  dataDiffers = true;
  const ka = keysOf(name, sa), kb = keysOf(name, sb);
  const added = [...kb].filter((k) => !ka.has(k));
  const removed = [...ka].filter((k) => !kb.has(k));
  console.log(`  🔶 ${name.padEnd(13)} DIFFERS — ${added.length} added, ${removed.length} removed` +
    `${!added.length && !removed.length ? ' (same entries, contents edited)' : ''}`);
  if (added.length) console.log(`       + ${added.slice(0, 12).join(', ')}${added.length > 12 ? ` … +${added.length - 12} more` : ''}`);
  if (removed.length) console.log(`       - ${removed.slice(0, 12).join(', ')}${removed.length > 12 ? ` … +${removed.length - 12} more` : ''}`);
}

const evDiff = engineVerOf(A) !== engineVerOf(B);
if (evDiff) { console.log(`  🔶 ENGINE_VER differs: ${engineVerOf(A)} vs ${engineVerOf(B)}`); dataDiffers = true; }

const codeDiffers = sha16(codeA) !== sha16(codeB);
if (codeDiffers) {
  console.log(`\n  ${'⚠'.repeat(30)}`);
  console.log('  ⚠  CODE DIFFERS OUTSIDE THE DATA COLLECTIONS.');
  console.log('  ⚠  This file is not just a mod — its JAVASCRIPT is different from yours.');
  console.log('  ⚠  Do NOT open it in a browser until you have reviewed every change:');
  console.log(`  ⚠     git diff --no-index "${fileA}" "${fileB}" | less`);
  console.log('  ⚠  It is MIT-licensed; attribution carries. Inspect. Be responsible.');
  console.log(`  ${'⚠'.repeat(30)}\n`);
} else {
  console.log(`\n  ✅ engine code identical outside the data collections${dataDiffers ? ' — this is a pure data/content mod' : ''}.\n`);
}
process.exit(codeDiffers ? 2 : dataDiffers ? 1 : 0);
