#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ga-FU — a doc anchor into a data section names the entry, never a literal from one of
// its structured fields (§DX-02ga). The write path re-serializes a whole field literal with
// `serializeJsLiteral`, so an anchor quoting the authored spacing dies on the next unrelated
// write to that entry while `check:anchors` stays green until then.
//
// The gate simulates that write by span: for each anchor hit that falls inside a structured
// field literal of QUEST_DB, NODE_MAP, BIRKA_NPC, MONSTER_POOL or NPC_DIALOGUE, the literals on
// those lines are replaced by their canonical form and the symbol is looked for again. An
// anchor fails when every one of its hits dies. Literals holding a function or a comment are
// left alone, because the write path refuses them.
//
// Usage:  node src/scripts/check-anchor-literals.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');
const W = require('../js/wbapi-core.js');
const { docFiles, resolve, ANCHOR_RE, HTML } = require('./resolve-anchors.js');

const SECTIONS = { QUEST_DB: 'questDb', NODE_MAP: 'nodeMap', BIRKA_NPC: 'birkaNpcs', MONSTER_POOL: 'monsterPool', NPC_DIALOGUE: 'npcDialogue' };

function literalSpans(src) {
  const { extrSection, findEntryBounds, entryFieldLiterals, serializeJsLiteral } = W._parse;
  const spans = [];
  for (const [name, colName] of Object.entries(SECTIONS)) {
    const marker = `// ◆◆◆ WORLDBUILDER:${name}:START ◆◆◆`;
    const sec = extrSection(src, name);
    const col = W[colName];
    if (!sec || !col) continue;
    const rawStart = src.indexOf(marker) + marker.length;
    const abs = rawStart + (src.slice(rawStart).length - src.slice(rawStart).trimStart().length);
    let off = 0;
    for (const key of Object.keys(col)) {
      let base = off, bnd = findEntryBounds(sec.slice(off), key);
      if (!bnd) { base = 0; bnd = findEntryBounds(sec, key); }
      if (!bnd) continue;
      const entry = sec.slice(base, base + bnd.bodyEnd + 1);
      const fields = entryFieldLiterals(entry, key);
      if (!fields) continue;
      if (base === off) off = base + bnd.bodyEnd;
      const body = entry.slice(bnd.openEnd, bnd.bodyEnd);
      let from = 0;
      for (const [field, text] of Object.entries(fields)) {
        const at = body.indexOf(text, from);
        if (at < 0) continue;
        from = at + text.length;
        const v = col[key] && col[key][field];
        if (!v || typeof v !== 'object') continue;
        if (/=>|\bfunction\b|\/\/|\/\*/.test(text)) continue;
        const canon = serializeJsLiteral(v);
        if (canon === null || canon === text) continue;
        const start = abs + base + bnd.openEnd + at;
        spans.push({ start, end: start + text.length, canon, where: `${name}.${key}.${field}` });
      }
    }
  }
  return spans;
}

function findings(src, anchors) {
  const lineStart = [0];
  for (let i = 0; i < src.length; i++) if (src.charCodeAt(i) === 10) lineStart.push(i + 1);
  const lineOf = (off) => { let lo = 0, hi = lineStart.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (lineStart[m] <= off) lo = m; else hi = m - 1; } return lo + 1; };
  const byLine = new Map();
  for (const s of literalSpans(src)) {
    s.l0 = lineOf(s.start); s.l1 = lineOf(s.end);
    for (let l = s.l0; l <= s.l1; l++) (byLine.get(l) || byLine.set(l, []).get(l)).push(s);
  }
  const out = [];
  for (const a of anchors) {
    const dies = (line) => {
      const spans = byLine.get(line);
      if (!spans) return false;
      const l0 = Math.min(...spans.map((s) => s.l0)), l1 = Math.max(...spans.map((s) => s.l1));
      const all = [...new Set([].concat(...Array.from({ length: l1 - l0 + 1 }, (_, i) => byLine.get(l0 + i) || [])))];
      const r0 = lineStart[l0 - 1], r1 = l1 < lineStart.length ? lineStart[l1] - 1 : src.length;
      let text = src.slice(r0, r1);
      for (const s of all.filter((x) => x.start >= r0 && x.end <= r1).sort((x, y) => y.start - x.start))
        text = text.slice(0, s.start - r0) + s.canon + text.slice(s.end - r0);
      return !text.includes(a.sym) ? spans.map((s) => s.where) : false;
    };
    const verdicts = a.hits.map(dies);
    if (a.hits.length && verdicts.every(Boolean)) out.push({ ...a, fields: [...new Set([].concat(...verdicts))] });
  }
  return out;
}

// Only an anchor whose symbol occurs on a line holding a rewritable literal can fail, so the
// full resolve runs on those candidates alone.
function anchorsInto(docs, lines, src) {
  const spanLines = new Set();
  const { literalLines } = anchorsInto;
  for (const l of literalLines(src)) spanLines.add(lines[l - 1]);
  const hay = [...spanLines].join('\n');
  const out = [];
  for (const { file, text } of docs) {
    const docLines = text.split('\n');
    for (let i = 0; i < docLines.length; i++) {
      ANCHOR_RE.lastIndex = 0;
      let m;
      while ((m = ANCHOR_RE.exec(docLines[i]))) {
        let sym = m[1];
        if (sym.startsWith('play.html:')) sym = sym.slice('play.html:'.length);
        else if (/^[\w./-]+\.(?:js|mjs|cjs|html|md|py|sh|json|yml):/.test(sym)) continue;
        if (!hay.includes(sym)) continue;
        out.push({ file, docLine: i + 1, sym, cached: Number(m[2]), hits: resolve(lines, sym) });
      }
    }
  }
  return out;
}
anchorsInto.literalLines = (src) => {
  const lineStart = [0];
  for (let i = 0; i < src.length; i++) if (src.charCodeAt(i) === 10) lineStart.push(i + 1);
  const lineOf = (off) => { let lo = 0, hi = lineStart.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (lineStart[m] <= off) lo = m; else hi = m - 1; } return lo + 1; };
  const out = [];
  for (const s of literalSpans(src)) for (let l = lineOf(s.start); l <= lineOf(s.end); l++) out.push(l);
  return out;
};

function main() {
  const t0 = Date.now();
  const src = fs.readFileSync(HTML, 'utf8');
  W.load(HTML);
  const lines = src.split('\n');
  const rel = (f) => path.relative(path.resolve(__dirname, '..', '..'), f);

  if (process.argv.includes('--selftest')) {
    const plant = (sym) => [{ file: '/selftest.md', text: `\`${sym}@11089\`` }];
    const red = findings(src, anchorsInto(plant("completion:{ flags:['entry42Written'] }"), lines, src));
    const green = findings(src, anchorsInto(plant("quest_ng_02: { id:'quest_ng_02'"), lines, src));
    const ok = red.length === 1 && green.length === 0;
    console.log(ok ? '✓ check-anchor-literals selftest: a planted field-literal anchor is caught, an entry-key anchor is not'
      : `✗ check-anchor-literals selftest: literal plant ${red.length} finding(s) (want 1), entry-key plant ${green.length} (want 0)`);
    process.exit(ok ? 0 : 1);
  }

  const docs = docFiles().map((f) => ({ file: f, text: fs.readFileSync(f, 'utf8') }));
  const anchors = anchorsInto(docs, lines, src);
  const bad = findings(src, anchors);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (bad.length) {
    console.error(`✗ check:anchorliterals — ${bad.length} anchor(s) quote a structured field literal the write path will re-serialize:\n`);
    for (const a of bad) console.error(`    ${rel(a.file)}:${a.docLine}  \`${a.sym}@${a.cached}\`  — inside ${a.fields.join(', ')}`);
    console.error('\n  Name the entry instead (its key line, e.g. `quest_x: {`), as §DX-02ga decided. The next');
    console.error('  `./bin/api put` to that entry rewrites the literal in canonical form and the anchor dies.');
    process.exit(1);
  }
  console.log(`✓ check:anchorliterals — ${anchors.length} anchor(s) touch a line holding a rewritable field literal, and each survives the rewrite (${secs}s)`);
}

if (require.main === module) main();
module.exports = { literalSpans, findings };
