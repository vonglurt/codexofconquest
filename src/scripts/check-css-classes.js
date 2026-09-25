#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §CSS-CENSUS — a class selector in play.html's <style> that nothing applies, and a class
// the code applies that nothing styles or reads.
//
// Every other dead-symbol gate walks JS identifiers, so a CSS class was invisible to all
// of them (§DX-02dc deleted `.info-chip.corpse-chip` by hand). Two directions:
//
//   DEAD        declared in <style>, and its name appears nowhere else in the file as a
//               whole token, and no class-building prefix covers it. The application side
//               is collected LOOSELY on purpose — a token anywhere, plus any `x-` literal
//               that ends at a quote or a `${`, which builds `x-<anything>`
//               (`'threat-' + tier`). Under-collecting applications would report live CSS,
//               which is worse than no gate.
//   UNDECLARED  applied through `class=`, `className`, or `classList.add/toggle/replace`,
//               and neither declared in <style> nor read back as a hook (`classList.contains`,
//               `querySelector*`/`closest`/`matches` selectors, `getElementsByClassName`) in
//               play.html or src/tests. That style silently does nothing. Tokens joined to
//               an interpolation are prefixes, not classes, and are skipped.
//
// Both tables are ratchets: an entry that stops being a finding fails as stale.
// Asserts only, never rewrites (§DX-02fx).
// Run: node scripts/check-css-classes.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

// Declared and applied by nothing at 2026-09-25. Deleting the rules is §CSS-CENSUS-FU.
const KNOWN_DEAD = new Set(`
  cfg-grid3 chip-label chips-section-lbl cond-afford-hint cond-cost cond-item-row cs-feature
  current-pos dpad-center-spacer ds-die final-battle-chip fish-chip froberger-journal-attr
  froberger-journal-entry glow-crit inn-chip inn-slept inv-item-sell inv-sep loot-chip
  loot-collected map-cell mc-fog-icon mmc-current mmc-empty-visited mmc-fog mmc-fog-cell
  mmc-icon mmc-node mmc-partial nav-section-hd npc-chip path-active q-name qc-obj
  qc-status-active qc-status-done qc-status-failed qc-title quest-card rest-chip
  rest-chip-empty rest-chip-used sbo-btn-flash sleep-field sleep-field-lbl sleep-field-val
  story-nav-section-lbl vendor-chip vendor-item-cost vendor-section-hd vendor-sell-btn
  wmc-empty-visited
`.trim().split(/\s+/));

// Applied and neither styled nor read. Each names why it may stay.
const KNOWN_UNDECLARED = {
  'mc-junction': 'the minimap marks junction cells and no rule draws them — §CSS-CENSUS-FU',
  'norm': "the adv badge's markup default; the render replaces it and the stylesheet keys on show-norm — §CSS-CENSUS-FU",
  'shield-item': 'inventory rows for shields; no rule styles them — §CSS-CENSUS-FU',
};

const TOKEN = /^-?[A-Za-z_][\w-]*$/;

function splitStyle(src) {
  const a = src.indexOf('<style>'), b = src.indexOf('</style>');
  if (a === -1 || b === -1) return null;
  return { css: src.slice(a + 7, b), rest: src.slice(0, a) + src.slice(b + 8) };
}

function declaredClasses(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = new Set();
  let sel = '';
  for (const ch of css) {
    if (ch === '{') {
      if (!/^\s*@/.test(sel)) {
        const s = sel.replace(/\[[^\]]*\]/g, '');
        for (const m of s.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) out.add(m[1]);
      }
      sel = '';
    } else if (ch === '}' || ch === ';') sel = '';
    else sel += ch;
  }
  return out;
}

// One line for quotes, any span for a template: an apostrophe in prose must not re-pair every
// quote after it.
const LITERAL = /'((?:\\.|[^'\\\n])*)'|"((?:\\.|[^"\\\n])*)"|`((?:\\.|[^`\\])*)`/g;
const body = m => m[1] ?? m[2] ?? m[3];

// Every token that could be a class name somewhere in the code or markup, and every
// literal `x-` prefix that ends where an interpolation or a concatenation takes over.
function looseApplications(rest) {
  const tokens = new Set(rest.split(/[^\w-]+/).filter(t => TOKEN.test(t))), prefixes = new Set();
  for (const m of rest.matchAll(LITERAL)) {
    for (const p of body(m).matchAll(/(?:^|[^\w-])([A-Za-z_][\w]*(?:-\w+)*-)(?=$|\$\{)/g))
      if (p[1].length >= 3) prefixes.add(p[1]);
  }
  return { tokens, prefixes };
}

// A class value ends at the first quote or `+`: `class="quest-badge ' + t + '"` sits inside a
// JS string and names only `quest-badge`. A token cut off mid-word is a prefix, not a class.
function classTokens(value) {
  const cut = value.search(/['"`+]/);
  let v = cut === -1 ? value : value.slice(0, cut);
  if (cut !== -1 && !/\s$/.test(v)) v = v.replace(/\S+$/, '');
  return v.replace(/\S*\$\{[^}]*\}\S*/g, ' ').split(/\s+/).filter(t => TOKEN.test(t));
}

function strictApplications(rest) {
  const out = new Set();
  for (const m of rest.matchAll(/\bclass(?:Name)?\s*\+?=\s*(['"`])([^'"`\n]*)(.?)/g))
    for (const t of classTokens(m[3] === m[1] ? m[2] : m[2] + '+')) out.add(t);
  for (const m of rest.matchAll(/classList\.(add|replace)\(([^)]*)\)/g))
    for (const s of m[2].matchAll(LITERAL)) {
      if (/[=!]==?\s*$/.test(m[2].slice(0, s.index))) continue;
      for (const t of classTokens(body(s))) out.add(t);
    }
  for (const m of rest.matchAll(/classList\.toggle\(\s*(['"`])([\w-]+)\1/g)) out.add(m[2]);
  return out;
}

function hookReads(text) {
  const out = new Set();
  for (const m of text.matchAll(/classList\.contains\(\s*(['"`])([\w-]+)\1/g)) out.add(m[2]);
  for (const m of text.matchAll(/getElementsByClassName\(\s*(['"`])([^'"`]+)\1/g))
    for (const t of m[2].split(/\s+/)) out.add(t);
  for (const m of text.matchAll(/(?:querySelector(?:All)?|closest|matches|locator|\$\$?)\(\s*(['"`])([^'"`\n]*)\1/g))
    for (const c of m[2].matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) out.add(c[1]);
  return out;
}

function census(src, readers, known = { dead: KNOWN_DEAD, undeclared: KNOWN_UNDECLARED }) {
  const parts = splitStyle(src);
  if (!parts) return { findings: ['no <style>…</style> block — the gate cannot read what it has to check'] };
  const declared = declaredClasses(parts.css);
  const { tokens, prefixes } = looseApplications(parts.rest);
  const isApplied = c => tokens.has(c) || [...prefixes].some(p => c.startsWith(p));
  const dead = [...declared].filter(c => !isApplied(c)).sort();
  const hooks = hookReads(parts.rest + '\n' + readers);
  const undeclared = [...strictApplications(parts.rest)].filter(c => !declared.has(c) && !hooks.has(c)).sort();

  const findings = [];
  for (const c of dead) if (!known.dead.has(c)) findings.push(`[dead] .${c} is declared in <style> and nothing applies it`);
  for (const c of known.dead) if (!dead.includes(c)) findings.push(`[stale-known] .${c} is no longer dead — drop it from KNOWN_DEAD`);
  for (const c of undeclared) if (!(c in known.undeclared)) findings.push(`[undeclared] "${c}" is applied, and nothing styles it or reads it back`);
  for (const c of Object.keys(known.undeclared)) if (!undeclared.includes(c)) findings.push(`[stale-known] "${c}" is styled or read now — drop it from KNOWN_UNDECLARED`);
  return { findings, declared, dead, undeclared };
}

function readers() {
  const dir = path.join(ROOT, 'src', 'tests');
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(?:js|mjs)$/.test(e.name)) out.push(fs.readFileSync(p, 'utf8'));
    }
  })(dir);
  return out.join('\n');
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const none = { dead: new Set(), undeclared: {} };
  const page = (css, body) => `<html><style>${css}</style><body>${body}</body></html>`;

  let r = census(page('.live{} .ghost{}', '<div class="live"></div>'), '', none);
  ok(r.dead.join() === 'ghost', 'a planted declared-and-unapplied selector is DEAD; the applied one is not');
  r = census(page('.a.b:hover{} @media (max-width:1px){ .c{} }', `<i class="a b c"></i>`), '', none);
  ok(r.declared.has('a') && r.declared.has('b') && r.declared.has('c') && !r.dead.length,
    'compound selectors and selectors inside @media are declared');
  r = census(page('.open{}', `<script>el.classList.toggle(on ? 'open' : 'shut');</script>`), '', none);
  ok(!r.dead.length, 'a classList.toggle behind a ternary is an application');
  r = census(page('.threat-deadly{} .threat-easy{}', `<script>h = '<b class="threat-' + t + '">';</script>`), '', none);
  ok(!r.dead.length, "a class assembled by concatenation ('threat-' + t) is live");
  r = census(page('.tier-3{}', '<script>h = `<b class="tier-${n}">`;</script>'), '', none);
  ok(!r.dead.length && !r.undeclared.length, 'a template-built class is live, and its prefix is not an undeclared class');
  r = census(page('.x{}', '<b class="x"></b><script>el.className = "x nostyle";</script>'), '', none);
  ok(r.undeclared.join() === 'nostyle', 'a planted applied-and-unstyled class is UNDECLARED');
  r = census(page('.threat-tier{} .threat-hard{}', `<script>h = '<b class="threat-tier threat-' + t + '">';</script>`), '', none);
  ok(!r.undeclared.length, "a class string closed by the JS quote ends in a prefix, not a class named 'threat-'");
  r = census(page('.on-a{} .on-b{}', `<script>b.classList.add(v === 'a' ? 'on-a' : 'on-b');</script>`), '', none);
  ok(!r.undeclared.length, 'a literal compared inside classList.add() is a value, not a class');
  r = census(page('.x{}', `<b class="x hook"></b><script>el.closest('.hook')</script>`), '', none);
  ok(!r.undeclared.length, 'a class read back by closest() is a hook, not an undeclared style');
  r = census(page('.x{}', '<b class="x probe"></b>'), `page.locator('.probe')`, none);
  ok(!r.undeclared.length, 'a class a test reads back is a hook');
  r = census(page('.x{} .gone{}', '<b class="x"></b>'), '', { dead: new Set(['gone']), undeclared: {} });
  ok(!r.findings.length, 'a KNOWN_DEAD entry that is still dead passes');
  r = census(page('.x{} .gone{}', '<b class="x gone"></b>'), '', { dead: new Set(['gone']), undeclared: {} });
  ok(r.findings.some(f => f.startsWith('[stale-known] .gone')), 'a KNOWN_DEAD entry that became live fails as stale');
  r = census(page('.x{}', '<b class="x"></b>'), '', { dead: new Set(), undeclared: { odd: 'why' } });
  ok(r.findings.some(f => f.includes('"odd"')), 'a KNOWN_UNDECLARED entry that is no longer applied fails as stale');
  r = census('<html>no style</html>', '', none);
  ok(r.findings.length === 1, 'a file with no <style> block fails rather than passing vacuously');

  if (fail) { console.log(`\n✗ check-css-classes selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-css-classes selftest: all ${pass} checks pass`);
  return;
}

const r = census(fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8'), readers());
if (r.findings.length) {
  r.findings.forEach(f => console.log('  ✗ ' + f));
  console.log(`\n✗ check-css-classes: ${r.findings.length} finding(s)`);
  console.log('  A dead selector: delete the rule. An undeclared class: style it, or name why it');
  console.log('  stays in KNOWN_UNDECLARED. A stale-known entry: drop it from its table.');
  process.exit(1);
}
console.log(`✓ §CSS-CENSUS check:cssclasses — ${r.declared.size} classes declared in play.html's <style>; `
  + `${r.dead.length} dead and ${r.undeclared.length} applied-but-unstyled, all named in KNOWN_DEAD / KNOWN_UNDECLARED`);
