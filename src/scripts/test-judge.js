#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02jd — judge the run, not the selection.
//
// Playwright launches a browser only for a test that takes the `page` fixture, so on a
// host without one the browser-free third of the suite still runs and reports while the
// rest fail `browserType.launch`. Read as a whole, such a run is "1,080 failed" and the
// two real reds inside it are invisible (§DX-02js). This wrapper runs `npm test` with the
// JSON reporter beside the list reporter, then sorts every unexpected test into one of
// two bins: TAKEN BY THE BROWSER, when every error it recorded is a `browserType.launch`,
// or REAL, otherwise. The exit code follows REAL alone; TAKEN is printed, never hidden,
// and a run where the browser took everything is reported as no verdict at all.
//
// Run: npm run test:judge --prefix src [-- <playwright args>]   ·   --selftest
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SRC = path.join(__dirname, '..');
const JSON_OUT = path.join(SRC, '..', 'build', 'test-results', 'judge.json');
const LAUNCH = /browserType\.launch/;

function tests(report) {
  const out = [];
  const walk = (suite, file) => {
    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) out.push({ file: spec.file || file, line: spec.line, title: spec.title, status: t.status, results: t.results || [] });
    }
    for (const s of suite.suites || []) walk(s, s.file || file);
  };
  for (const s of report.suites || []) walk(s, s.file);
  return out;
}

function errorsOf(result) {
  const list = (result.errors && result.errors.length) ? result.errors : (result.error ? [result.error] : []);
  return list.map(e => String(e.message || e.value || e));
}

function judge(report) {
  const all = tests(report);
  const v = { passed: 0, flaky: 0, skipped: 0, taken: 0, real: [], total: all.length };
  for (const t of all) {
    if (t.status === 'expected') v.passed++;
    else if (t.status === 'flaky') v.flaky++;
    else if (t.status === 'skipped') v.skipped++;
    else {
      const errs = t.results.flatMap(errorsOf);
      if (errs.length && errs.every(m => LAUNCH.test(m))) v.taken++;
      else v.real.push(`${t.file}:${t.line} › ${t.title}`);
    }
  }
  v.exit = v.real.length ? 1 : (v.total && v.taken === v.total - v.skipped ? 2 : 0);
  return v;
}

function print(v) {
  console.log(`\ntest-judge: ${v.passed} passed · ${v.real.length} REAL failure(s) · ${v.taken} taken by the browser (browserType.launch) · ${v.flaky} flaky · ${v.skipped} skipped · ${v.total} declared`);
  for (const r of v.real) console.log(`  ✗ ${r}`);
  if (v.exit === 2) console.log('  ⚠ the browser took every test that could run — this is NO VERDICT, not a green: §DX-02ir if the host has no browser, §DX-02js if the run was not from src/');
  else if (v.taken) console.log(`  ⚠ ${v.taken} test(s) were not checked — they need a browser this host did not launch (§DX-02ir)`);
  console.log(v.exit === 1 ? '✗ test-judge: real failures' : v.exit === 2 ? '✗ test-judge: no verdict' : '✓ test-judge: no real failure');
}

function selftest() {
  const T = (status, ...msgs) => ({ title: 't', line: 1, status, results: msgs.map(m => ({ errors: m === null ? [] : [{ message: m }] })) });
  const R = (...ts) => ({ suites: [{ file: 'f.test.js', specs: ts.map(t => ({ file: 'f.test.js', line: t.line, title: t.title, tests: [t] })) }] });
  const L = 'Error: browserType.launch: Failed to launch chromium because executable doesn\'t exist';
  const A = 'Error: expect(received).toBe(expected)';
  const cases = [
    ['all green', R(T('expected', null), T('expected', null)), { exit: 0, real: 0, taken: 0, passed: 2 }],
    ['launch only is no verdict', R(T('unexpected', L), T('unexpected', L)), { exit: 2, real: 0, taken: 2 }],
    ['launch beside green is a warning, exit 0', R(T('expected', null), T('unexpected', L)), { exit: 0, real: 0, taken: 1 }],
    ['an assertion is real', R(T('expected', null), T('unexpected', A)), { exit: 1, real: 1, taken: 0 }],
    ['real and taken are counted apart', R(T('unexpected', A), T('unexpected', L), T('expected', null)), { exit: 1, real: 1, taken: 1 }],
    ['a retry that failed for a real reason is real', R(T('unexpected', L, A)), { exit: 1, real: 1, taken: 0 }],
    ['a failure with no recorded error is real', R(T('unexpected', null)), { exit: 1, real: 1, taken: 0 }],
    ['flaky and skipped are neither', R(T('flaky', A, null), T('skipped')), { exit: 0, real: 0, taken: 0, flaky: 1, skipped: 1 }],
    ['nested suites are walked', { suites: [{ file: 'a.js', suites: [{ specs: [{ line: 3, title: 'x', tests: [T('unexpected', A)] }] }] }] }, { exit: 1, real: 1 }],
    ['an empty report is no verdict', { suites: [] }, { exit: 0, real: 0, total: 0 }],
  ];
  let fail = 0;
  for (const [name, report, want] of cases) {
    const v = judge(report);
    const got = { exit: v.exit, real: v.real.length, taken: v.taken, passed: v.passed, flaky: v.flaky, skipped: v.skipped, total: v.total };
    const bad = Object.keys(want).filter(k => got[k] !== want[k]);
    if (bad.length) { fail++; console.log(`  ✗ ${name}: ${bad.map(k => `${k} ${got[k]}≠${want[k]}`).join(', ')}`); }
  }
  if (fail) { console.log(`✗ test-judge selftest: ${fail} FAILED, ${cases.length - fail} passed`); process.exitCode = 1; return; }
  console.log(`✓ test-judge selftest: all ${cases.length} checks pass`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--selftest')) return selftest();
  fs.mkdirSync(path.dirname(JSON_OUT), { recursive: true });
  fs.rmSync(JSON_OUT, { force: true });
  const run = spawnSync('npm', ['test', '--', '--reporter=list,json', ...args], {
    cwd: SRC, stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: JSON_OUT },
  });
  if (!fs.existsSync(JSON_OUT)) {
    console.log(`✗ test-judge: no report at ${path.relative(process.cwd(), JSON_OUT)} — the suite did not run (npm test exit ${run.status})`);
    process.exitCode = 2; return;
  }
  const v = judge(JSON.parse(fs.readFileSync(JSON_OUT, 'utf8')));
  print(v);
  process.exitCode = v.exit;
}

main();
