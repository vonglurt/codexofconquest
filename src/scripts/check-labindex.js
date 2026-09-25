#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-01j — two pages list the lab reports: `docs/design/index.md`'s Lab Report Index (an
// annotated row per report) and `index.html`'s #labs section (a link per report, grouped
// under counted headings). Every file in `docs/lab-reports/*.md` must appear in both, every
// report either page cites must exist, and every count the landing page prints — the
// heading, the watermark, each group's badge — must equal what it counts.
// Asserts only, never rewrites (§DX-02fx).
// Run: node scripts/check-labindex.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

function indexSection(md) {
  const L = md.split('\n');
  const a = L.findIndex((l) => /^## Lab Report Index\b/.test(l));
  if (a < 0) return null;
  const b = L.findIndex((l, i) => i > a && /^## /.test(l));
  return L.slice(a, b < 0 ? L.length : b).join('\n');
}

const cited = (text, re) => new Set([...text.matchAll(re)].map((m) => m[1]));
const MD_CITE = /docs\/lab-reports\/([A-Za-z0-9._-]+\.md)/g;
const MD_ARCHIVE = /docs\/archive\/([A-Za-z0-9._-]+\.md)/g;
const HTML_CITE = /\/docs\/lab-reports\/([A-Za-z0-9._-]+\.md)/g;

function labsSection(html) {
  const a = html.indexOf('<section id="labs"');
  if (a < 0) return null;
  const b = html.indexOf('</section>', a);
  return html.slice(a, b < 0 ? html.length : b);
}

function htmlCounts(labs) {
  const out = { heading: null, ghost: null, groups: [] };
  const h = /<h2>(\d+) write-ups/.exec(labs);
  if (h) out.heading = Number(h[1]);
  const g = /class="ghost">(\d+)</.exec(labs);
  if (g) out.ghost = Number(g[1]);
  const parts = labs.split(/<h3 class="lab-h">/).slice(1);
  for (const p of parts) {
    const m = /^([^<]*)<span class="cnt">(\d+)<\/span>/.exec(p);
    if (!m) continue;
    out.groups.push({ name: m[1].replace(/&amp;/g, '&'), claimed: Number(m[2]), actual: cited(p, HTML_CITE).size });
  }
  return out;
}

function scan({ disk, md, html, archive }) {
  const findings = [];
  const sec = indexSection(md);
  if (sec === null) return ['index.md has no "## Lab Report Index" section'];
  const labs = labsSection(html);
  if (labs === null) return ['index.html has no <section id="labs">'];
  const onDisk = new Set(disk);
  const inMd = cited(sec, MD_CITE);
  const inHtml = cited(labs, HTML_CITE);
  for (const f of disk) {
    if (!inMd.has(f)) findings.push(`[index.md] ${f} is on disk and has no row in the Lab Report Index`);
    if (!inHtml.has(f)) findings.push(`[index.html] ${f} is on disk and has no link in #labs`);
  }
  for (const f of inMd) if (!onDisk.has(f)) findings.push(`[index.md] cites docs/lab-reports/${f}, which is not on disk`);
  for (const f of inHtml) if (!onDisk.has(f)) findings.push(`[index.html] links docs/lab-reports/${f}, which is not on disk`);
  for (const f of cited(sec, MD_ARCHIVE)) if (!archive.includes(f)) findings.push(`[index.md] cites docs/archive/${f}, which is not on disk`);
  const c = htmlCounts(labs);
  const n = disk.length;
  if (c.heading === null) findings.push('[index.html] the #labs heading no longer reads "<N> write-ups"');
  else if (c.heading !== n) findings.push(`[index.html] the #labs heading says ${c.heading} write-ups, the disk has ${n}`);
  if (c.ghost !== null && c.ghost !== n) findings.push(`[index.html] the #labs watermark says ${c.ghost}, the disk has ${n}`);
  for (const g of c.groups) {
    if (g.claimed !== g.actual) findings.push(`[index.html] "${g.name}" badge says ${g.claimed}, the group links ${g.actual}`);
  }
  const sum = c.groups.reduce((s, g) => s + g.actual, 0);
  if (sum !== inHtml.size) findings.push(`[index.html] the groups link ${sum} reports in total, ${inHtml.size} distinct — one is listed twice`);
  return findings;
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (cond, m) => { if (cond) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const md = (files) => ['# x', '## Lab Report Index', '', '| File | Topic |', '|---|---|',
    ...files.map((f) => `| \`docs/lab-reports/${f}\` | t |`), '| `docs/archive/old.md` | t |', '', '## Reverse Lookup',
    '| `docs/lab-reports/outside.md` | not in the section |'].join('\n');
  const li = (f) => `<li><a href="https://x/blob/main/docs/lab-reports/${f}">n</a><a class="raw" href="https://x/main/docs/lab-reports/${f}">raw</a></li>`;
  const html = (groups, n = 2, ghost = n) => `<section id="labs"><span class="ghost">${ghost}</span><h2>${n} write-ups, each measured</h2>`
    + groups.map(([name, cnt, fs_]) => `<h3 class="lab-h">${name}<span class="cnt">${cnt}</span></h3><ul>${fs_.map(li).join('')}</ul>`).join('')
    + '</section><section>' + li('elsewhere.md') + '</section>';
  const base = { disk: ['a.md', 'b.md'], md: md(['a.md', 'b.md']), html: html([['Arch &amp; Engine', 1, ['a.md']], ['Other', 1, ['b.md']]]), archive: ['old.md'] };
  ok(scan(base).length === 0, 'two pages that list the disk exactly, with true counts, are clean');
  ok(scan({ ...base, disk: ['a.md', 'b.md', 'c.md'] }).filter((f) => f.includes('c.md')).length === 2,
    'a new report on disk is named once per page that is missing it');
  ok(scan({ ...base, md: md(['a.md', 'b.md', 'gone.md']) }).some((f) => f.includes('gone.md, which is not on disk')),
    'an index row for a deleted report is caught');
  ok(scan({ ...base, archive: [] }).some((f) => f.includes('docs/archive/old.md')), 'an archive citation that is not on disk is caught');
  ok(scan({ ...base, md: md(['a.md']) }).some((f) => f.includes('[index.md] b.md')), 'a report missing from index.md alone is caught');
  ok(scan(base).every((f) => !f.includes('outside.md')) && scan(base).every((f) => !f.includes('elsewhere.md')),
    'citations outside the two sections are not read');
  ok(scan({ ...base, html: html([['Arch', 2, ['a.md']], ['Other', 1, ['b.md']]]) }).some((f) => f.includes('"Arch" badge says 2, the group links 1')),
    'a group badge that disagrees with its links is caught');
  ok(scan({ ...base, html: html([['Arch', 1, ['a.md']], ['Other', 1, ['b.md']]], 3, 2) }).some((f) => f.includes('heading says 3')),
    'a heading count that disagrees with the disk is caught');
  ok(scan({ ...base, html: html([['Arch', 1, ['a.md']], ['Other', 1, ['b.md']]], 2, 114) }).some((f) => f.includes('watermark says 114')),
    'a watermark count that disagrees with the disk is caught');
  ok(scan({ ...base, html: html([['Arch', 1, ['a.md']], ['Other', 2, ['a.md', 'b.md']]]) }).some((f) => f.includes('listed twice')),
    'a report listed in two groups is caught');
  ok(scan({ ...base, md: '# no section' })[0].includes('no "## Lab Report Index"'), 'a renamed index section is a finding, not a pass');
  if (fail) { console.log(`\n✗ check-labindex selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-labindex selftest: all ${pass} checks pass`);
  return;
}

const mdFiles = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith('.md') && fs.statSync(path.join(dir, f)).isFile());
const disk = mdFiles(path.join(ROOT, 'docs', 'lab-reports'));
const findings = scan({
  disk,
  md: fs.readFileSync(path.join(ROOT, 'docs', 'design', 'index.md'), 'utf8'),
  html: fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'),
  archive: mdFiles(path.join(ROOT, 'docs', 'archive')),
});
if (findings.length) {
  findings.forEach((f) => console.log('  ✗ ' + f));
  console.log(`\n✗ check-labindex: ${findings.length} finding(s)`);
  console.log('  A new lab report needs a row in docs/design/index.md\'s Lab Report Index and a link in');
  console.log('  index.html\'s #labs, under a group whose count badge is raised with it.');
  process.exit(1);
}
console.log(`✓ §DX-01j lab report index: all ${disk.length} reports on disk are listed in index.md and index.html, `
  + 'nothing either page cites is missing, and every count the landing page prints is true');
