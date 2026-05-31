#!/usr/bin/env node
// split-sources.js
// Reads .txt files >200k, collapses single linebreaks, splits into 200k chunks.
// Naming: CODE-title.part1of3.txt

'use strict';

const fs   = require('fs');
const path = require('path');

const DIR   = process.argv[2] || path.resolve(__dirname);
const CHUNK = 200_000;

// ── text normaliser ──────────────────────────────────────────────────────────
// Rules (applied in order):
//   1. \n[ \t]+\n  →  \n\n   (blank-looking line = paragraph break)
//   2. \n that is NOT part of a \n\n pair  →  single space
function collapseLines(text) {
  // Step 0: normalize CRLF → LF (Gutenberg files use \r\n)
  text = text.replace(/\r\n/g, '\n');
  // Step 1: normalize whitespace-only lines to empty lines
  text = text.replace(/\n[ \t]+\n/g, '\n\n');
  // Step 2: collapse lone newlines — negative look-behind and look-ahead for \n
  text = text.replace(/(?<!\n)\n(?!\n)/g, ' ');
  return text;
}

// ── chunk boundary finder ────────────────────────────────────────────────────
// Returns array of [start, end) byte offsets in buf, ~CHUNK bytes each.
// Breaks at the nearest preceding space or newline so words stay whole.
function findBoundaries(buf) {
  const bounds = [];
  let pos = 0;
  while (pos < buf.length) {
    let end = Math.min(pos + CHUNK, buf.length);
    if (end < buf.length) {
      // walk back to nearest whitespace
      let scan = end;
      while (scan > pos && buf[scan] !== 0x20 && buf[scan] !== 0x0a) scan--;
      if (scan > pos) end = scan;
    }
    bounds.push([pos, end]);
    // skip leading whitespace at start of next chunk
    pos = end;
    while (pos < buf.length && (buf[pos] === 0x20 || buf[pos] === 0x0a)) pos++;
  }
  return bounds;
}

// ── main ─────────────────────────────────────────────────────────────────────
const files = fs.readdirSync(DIR)
  .filter(f => /^[A-Z]{2,4}-[^.]+\.txt$/.test(f))   // original source files only
  .sort();

let total_split = 0;

for (const filename of files) {
  const filepath = path.join(DIR, filename);
  const stat = fs.statSync(filepath);
  if (stat.size <= CHUNK) continue;

  const base = filename.replace(/\.txt$/, '');
  process.stdout.write(`${filename} (${(stat.size / 1024).toFixed(0)} KB) → `);

  const raw  = fs.readFileSync(filepath, 'utf8');
  const text = collapseLines(raw);
  const buf  = Buffer.from(text, 'utf8');

  const bounds     = findBoundaries(buf);
  const totalParts = bounds.length;

  for (let i = 0; i < bounds.length; i++) {
    const partNum = i + 1;
    const [start, end] = bounds[i];

    const headerLines = [
      partNum === 1
        ? `[${base}  —  part ${partNum} of ${totalParts}]`
        : `[${base}  —  part ${partNum} of ${totalParts}, continuation of part ${partNum - 1}]`,
      '='.repeat(60),
      '',
      '',
    ];
    const header = Buffer.from(headerLines.join('\n'), 'utf8');
    const chunk  = buf.slice(start, end);

    const outName = `${base}.part${partNum}of${totalParts}.txt`;
    fs.writeFileSync(path.join(DIR, outName), Buffer.concat([header, chunk]));
  }

  console.log(`${totalParts} parts`);
  total_split++;
}

console.log(`\nDone. ${total_split} files split.`);
