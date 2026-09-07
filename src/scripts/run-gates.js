#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// The `check:walk` gate chain: every gate gets a deadline, and gates run concurrently.
//
// Gates are spawned as `sh -c '<the raw package.json script>'` with stdout on a PIPE —
// never through `npm run`, and never onto a regular file or /dev/null. That is not
// cosmetic: `process.exit()` on Node v26.6.0 can deadlock in `uv_thread_join` during
// platform disposal, after the gate's ✓ has printed, and the odds shift sharply with
// how stdout is connected (§DX-02fz). The gate scripts no longer call `process.exit(0)`,
// and the per-gate deadline below is the backstop if one ever hangs again.
// Every gate is a pure read over play.html — no gate opens a socket, spawns a server, or
// writes. Two consequences this runner depends on: they are safe to run at the same time,
// and any gate still running after the deadline is hung, not slow.
//
// A gate is a child `sh -c` over its script string in package.json, so gate definitions
// stay in one place and keep their exact semantics, `--selftest && real-run` pairs
// included. Output is buffered per gate and printed in chain order whatever order they
// finish in, so a red gate reads the same as it does when run alone.
//
// Exit 0 only if every gate exits 0. A gate past its deadline is killed and named.
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SRC = path.resolve(__dirname, '..');
const PKG = JSON.parse(fs.readFileSync(path.join(SRC, 'package.json'), 'utf8'));

// The chain, in order. Named here rather than parsed out of an `&&` string, so the order
// is a fact of this file and not of a string nothing validates.
const GATES = [
  'check:invariants', 'check:dupkeys', 'check:parity', 'check:behaviour',
  'check:terrain', 'check:roads', 'check:roomsparity', 'check:questparity',
  'check:gateast', 'check:rng', 'check:questgraph', 'check:nodeindex',
  'check:noderegs', 'check:npcregs', 'check:anchors', 'check:legacycodes',
  'check:battlepools', 'check:arraypatch',
  'check:spdx', 'check:backlogcounts', 'check:condprices',
  'check:docpointers', 'check:duelparity', 'check:itemchain',
  'check:laddermigration', 'check:worlddiff',
];

// A gate named here is deliberately outside the chain; the value is the reason it is.
const GATE_EXEMPT = {};

const gateScripts = (pkg) => Object.keys(pkg.scripts || {})
  .filter((k) => k.startsWith('check:') && k !== 'check:walk' && k !== 'check:walk:serial');

const unchained = (pkg, gates, exempt) =>
  gateScripts(pkg).filter((k) => !gates.includes(k) && !(k in exempt));

const serialChain = (pkg) => String((pkg.scripts || {})['check:walk:serial'] || '')
  .split('&&').map((s) => s.trim().replace(/^npm run /, '')).filter(Boolean);

const argv = process.argv.slice(2);
const argOf = (flag, dflt) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : dflt;
};
const TIMEOUT_MS = Number(argOf('--timeout', process.env.GATE_TIMEOUT_MS || 120_000));
const JOBS = Math.max(1, Number(argOf('--jobs',
  process.env.GATE_JOBS || Math.min(6, Math.max(1, os.cpus().length - 2)))));
const SELFTEST = argv.includes('--selftest');

const fmt = (ms) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`);

function runGate(name, script, timeoutMs) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn('sh', ['-c', script], { cwd: SRC, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    const done = (r) => { clearTimeout(timer); resolve(r); };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ name, out, ms: Date.now() - started, code: null, timedOut: true });
    }, timeoutMs);
    child.on('error', (err) => done({ name, out: out + String(err && err.message), ms: Date.now() - started, code: 1, timedOut: false }));
    child.on('close', (code) => done({ name, out, ms: Date.now() - started, code, timedOut: false }));
  });
}

async function runAll(gates) {
  const results = new Array(gates.length);
  let next = 0;
  const worker = async () => {
    while (next < gates.length) {
      const i = next++;
      results[i] = await runGate(gates[i].name, gates[i].script, TIMEOUT_MS);
    }
  };
  await Promise.all(Array.from({ length: Math.min(JOBS, gates.length) }, worker));
  return results;
}

async function selftest() {
  const checks = [];
  const started = Date.now();
  const hung = await runGate('planted:hang', 'sleep 30', 1500);
  const elapsed = Date.now() - started;
  checks.push(['planted-hang-caught', hung.timedOut === true && elapsed < 10_000]);
  const red = await runGate('planted:red', 'exit 3', 5000);
  checks.push(['planted-failure-still-red', red.timedOut === false && red.code === 3]);
  const green = await runGate('planted:green', 'true', 5000);
  checks.push(['planted-pass-still-green', green.timedOut === false && green.code === 0]);
  const out = await runGate('planted:output', 'echo marker-9f3c', 5000);
  checks.push(['output-survives-buffering', out.out.includes('marker-9f3c')]);
  const planted = { scripts: { 'check:planted': 'true', 'check:walk': 'x', 'check:walk:serial': 'y' } };
  checks.push(['unchained-gate-caught', unchained(planted, [], {}).join(',') === 'check:planted']);
  checks.push(['exemption-honoured', unchained(planted, [], { 'check:planted': 'why' }).length === 0]);
  checks.push(['serial-chain-parsed',
    serialChain({ scripts: { 'check:walk:serial': 'npm run check:a && npm run check:b' } })
      .join(' ') === 'check:a check:b']);
  console.log('selftest ' + checks.map(([k, v]) => `${k}=${v}`).join(' ') + ` (hang caught in ${fmt(elapsed)})`);
  if (checks.some(([, v]) => !v)) { console.error('✗ run-gates selftest failed'); process.exit(1); }
  console.log('');
}

(async () => {
  if (SELFTEST) await selftest();

  const orphans = unchained(PKG, GATES, GATE_EXEMPT);
  if (orphans.length) {
    console.error(`✗ run-gates: ${orphans.length} check:* script(s) in package.json are in neither GATES nor GATE_EXEMPT:`);
    for (const name of orphans) console.error(`    ${name}`);
    console.error('  A gate outside the chain is run by nobody. Add it to GATES (and to');
    console.error('  check:walk:serial, in the same order), or name it in GATE_EXEMPT with its reason.');
    process.exit(1);
  }
  const serial = serialChain(PKG);
  if (serial.join(' ') !== GATES.join(' ')) {
    console.error('✗ run-gates: check:walk:serial does not mirror GATES.');
    console.error(`    GATES  : ${GATES.join(' ')}`);
    console.error(`    serial : ${serial.join(' ')}`);
    process.exit(1);
  }

  const gates = GATES.map((name) => {
    const script = PKG.scripts[name];
    if (!script) { console.error(`✗ run-gates: package.json has no script "${name}"`); process.exit(1); }
    return { name, script };
  });

  const wall = Date.now();
  const results = await runAll(gates);
  const totalWall = Date.now() - wall;

  for (const r of results) {
    process.stdout.write(r.out);
    if (r.timedOut) {
      console.error(`\n✗ ${r.name} — no result after ${fmt(r.ms)} (deadline ${fmt(TIMEOUT_MS)}); killed.`);
      console.error('  A gate is a pure read over play.html and finishes in seconds. Past the');
      console.error('  deadline it is hung, not slow — re-run it alone to see where it stops:');
      console.error(`      npm run ${r.name} --prefix src`);
      console.error('  Raise the deadline only to confirm that: --timeout <ms> / GATE_TIMEOUT_MS.');
    }
  }

  const failed = results.filter((r) => r.timedOut || r.code !== 0);
  const cpu = results.reduce((a, r) => a + r.ms, 0);
  const slowest = results.slice().sort((a, b) => b.ms - a.ms).slice(0, 3)
    .map((r) => `${r.name} ${fmt(r.ms)}`).join(' · ');

  console.log(`\n${failed.length ? '✗' : '✓'} ${results.length - failed.length}/${results.length} gates green · wall ${fmt(totalWall)} (${fmt(cpu)} of work) · jobs ${JOBS} · slowest: ${slowest}`);
  if (failed.length) {
    console.error(`  red: ${failed.map((r) => r.name + (r.timedOut ? ' (deadline)' : '')).join(', ')}`);
    process.exit(1);
  }
})();
