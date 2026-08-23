#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// archive-removable.js — one-pass "mark → move" doc archiver (doc-simplification tooling).
//
// Mark any block in a markdown doc as removable:
//
//   <!-- REMOVABLE id="some-slug" note="short pointer text left behind" -->
//   ...block to archive (any number of lines)...
//   <!-- /REMOVABLE -->
//
// Then run:
//   node src/scripts/archive-removable.js <source.md> <archive.md> --dry   # preview
//   node src/scripts/archive-removable.js <source.md> <archive.md>         # apply
//
// Each marked block is appended VERBATIM to the archive file (under a dated
// "Removable items archived from <source>" section, one "### <id>" heading per
// block) and replaced in the source with a one-line pointer quote. Markers are
// consumed by the move, so a second run is a no-op.
const fs = require('fs');

const [, , srcPath, archPath, flag] = process.argv;
if (!srcPath || !archPath) {
  console.error('usage: node src/scripts/archive-removable.js <source.md> <archive.md> [--dry]');
  process.exit(2);
}
const dry = flag === '--dry';
const today = new Date().toISOString().slice(0, 10);

const src = fs.readFileSync(srcPath, 'utf8');
const re = /[ \t]*<!--\s*REMOVABLE\s+id="([^"]+)"(?:\s+note="([^"]*)")?\s*-->\r?\n([\s\S]*?)\r?\n[ \t]*<!--\s*\/REMOVABLE\s*-->[ \t]*\r?\n?/g;

const moved = [];
const out = src.replace(re, (_, id, note, body) => {
  moved.push({ id, note: note || '', body });
  return `> *«${id}» archived to ${archPath} (${today}).${note ? ' ' + note : ''}*\n`;
});

// A start marker without its end marker (or vice versa) means a mismarked block
// — refuse to write rather than silently half-move it.
const leftover = out.match(/<!--\s*\/?REMOVABLE/g);
if (leftover) {
  console.error(`ERROR: ${leftover.length} unmatched REMOVABLE marker(s) remain — fix the markers; nothing written.`);
  process.exit(1);
}
if (!moved.length) {
  console.log('no REMOVABLE blocks found — nothing to do');
  process.exit(0);
}
for (const m of moved) {
  console.log(`${dry ? '[dry] would move' : 'moving'}  ${m.id}  (${m.body.split('\n').length} lines)`);
}
if (dry) process.exit(0);

let arch = `\n---\n\n## Removable items archived from ${srcPath} (${today})\n\n`;
arch += `> Moved by \`src/scripts/archive-removable.js\`; each block is verbatim. A pointer quote remains at the original location.\n\n`;
for (const m of moved) arch += `### ${m.id}\n\n${m.body}\n\n`;

fs.appendFileSync(archPath, arch);
fs.writeFileSync(srcPath, out);
console.log(`moved ${moved.length} block(s) → ${archPath}; ${srcPath} rewritten`);
