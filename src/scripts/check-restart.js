#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02kq — asserts the documented restart returns, and that its success report is true.
//
// `resume.md` §2.5 makes "restart the server before any write session" a hard rule, so
// `run.sh restart` and `run.sh stop && run.sh server` are the instruments that rule
// depends on. §DX-02km paid two 120 s deadlines against them and reported two server
// processes left behind; neither reproduced. What did reproduce is worse and quieter:
// `run.sh server` printed "API server → :1367" and exited 0 when the server had never
// come up, so the restart's success report was not evidence of a restart.
//
// Asserted here, rather than observed once:
//   • the chained pair and `restart` each return inside DEADLINE_MS,
//   • each leaves exactly ONE server process — counted by `run.sh procs`, which walks
//     the process table through procmatch.sh. Never `ps aux | grep -c wbapi-server`:
//     that pattern matches the measuring command's own argv, and reported 1 with zero
//     servers running while this row was being ground out.
//   • a start that never answers exits NON-ZERO, names the port, and leaves none.
//
// Launches run with NO_TERM=1, so this is headless and opens no Terminal windows. The
// osascript branch of `in_term` is therefore not covered here; its own failure mode —
// a blocked Automation consent dialog — is bounded by `alarm` in run.sh instead.
//
// NOT a `check:walk` gate: it spawns a server and binds :1367, and the chain's whole
// invariant is that every gate is a pure concurrent read. Named in GATE_EXEMPT.
// Run: node scripts/check-restart.js [--selftest]

'use strict';
const { spawnSync, execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DEADLINE_MS = Number(process.env.RESTART_DEADLINE_MS || 20_000);

// Pure: turns one observed invocation into a finding string, or null when it is fine.
// `want` is { code: 'zero'|'nonzero', procs: <number>, says: <string|null> }.
function verdict(label, obs, want) {
  if (obs.timedOut) return `[hang] ${label} — no result after ${obs.ms} ms (deadline ${DEADLINE_MS} ms); killed`;
  const zero = obs.code === 0;
  if (want.code === 'zero' && !zero) return `[red] ${label} — expected exit 0, got ${obs.code}: ${obs.out.trim().slice(0, 200)}`;
  if (want.code === 'nonzero' && zero) return `[lying-success] ${label} — exited 0 but the server never answered; the success report is not evidence`;
  if (!Number.isFinite(obs.procs)) return `[instrument] ${label} — \`run.sh procs\` did not answer a number: ${JSON.stringify(String(obs.procsRaw).slice(0, 120))}`;
  if (obs.procs !== want.procs) return `[procs] ${label} — expected ${want.procs} server process(es), found ${obs.procs}`;
  if (want.says && !obs.out.includes(want.says)) return `[silent] ${label} — output never names ${JSON.stringify(want.says)}: ${obs.out.trim().slice(0, 200)}`;
  return null;
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const obs = (o) => Object.assign({ code: 0, ms: 900, out: '', procs: 1, timedOut: false }, o);
  const green = { code: 'zero', procs: 1, says: null };

  ok(verdict('x', obs({}), green) === null, 'a clean 1-process start is not a finding');
  ok((verdict('x', obs({ timedOut: true, ms: 20_000 }), green) || '').startsWith('[hang]'),
    'the 120 s hang the row was filed for is caught as [hang]');
  ok((verdict('x', obs({ procs: 2 }), green) || '').startsWith('[procs]'),
    'the two-server symptom the row claims is caught as [procs]');
  ok((verdict('x', obs({ procs: 0 }), green) || '').startsWith('[procs]'),
    'a chained restart that leaves NO server is caught too — the race the drain closes');
  ok((verdict('x', obs({ code: 1 }), green) || '').startsWith('[red]'),
    'a non-zero exit on the green path is caught');
  // The defect actually measured at HEAD before this row: exit 0 with nothing running.
  ok((verdict('x', obs({ code: 0, procs: 0 }), { code: 'nonzero', procs: 0, says: null }) || '')
    .startsWith('[lying-success]'), 'exit 0 from a start that never answered is caught');
  ok(verdict('x', obs({ code: 1, procs: 0, out: 'did not answer on :1367' }),
    { code: 'nonzero', procs: 0, says: ':1367' }) === null, 'a red start that names the port is clean');
  ok((verdict('x', obs({ procs: NaN, procsRaw: './run.sh server | monitor | ...' }), green) || '')
    .startsWith('[instrument]'), 'a procs verb that answers prose instead of a count is caught');
  ok((verdict('x', obs({ code: 1, procs: 0, out: 'nope' }),
    { code: 'nonzero', procs: 0, says: ':1367' }) || '').startsWith('[silent]'),
    'a red start that does not say why is still a finding');

  if (fail) { console.log(`\n✗ check-restart selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-restart selftest: all ${pass} checks pass`);
  return;
}

const sh = (cmd, extraEnv) => {
  const started = Date.now();
  const r = spawnSync('bash', ['-c', cmd], {
    cwd: ROOT, encoding: 'utf8', timeout: DEADLINE_MS, killSignal: 'SIGKILL',
    env: Object.assign({}, process.env, { NO_TERM: '1' }, extraEnv || {}),
  });
  return {
    code: r.status, ms: Date.now() - started,
    out: (r.stdout || '') + (r.stderr || ''),
    timedOut: r.signal === 'SIGKILL' || r.error !== undefined && r.status === null,
  };
};
const procs = () => execFileSync('bash', [path.join(ROOT, 'run.sh'), 'procs'],
  { cwd: ROOT, encoding: 'utf8' }).trim();
const observe = (cmd, extraEnv) => {
  const o = sh(cmd, extraEnv);
  o.procsRaw = procs();
  o.procs = /^\d+$/.test(o.procsRaw) ? Number(o.procsRaw) : NaN;
  return o;
};

const wasUp = spawnSync('bash', ['-c', 'curl -sf http://localhost:1367/api/ping'],
  { cwd: ROOT, encoding: 'utf8' }).status === 0;

const findings = [];
const check = (label, cmd, want, extraEnv) => {
  const f = verdict(label, observe(cmd, extraEnv), want);
  if (f) findings.push(f);
};

try {
  for (let i = 1; i <= 3; i++) {
    check(`chained pair, trial ${i}`, './run.sh stop && ./run.sh server',
      { code: 'zero', procs: 1, says: ':1367' });
  }
  for (let i = 1; i <= 2; i++) {
    check(`run.sh restart, trial ${i}`, './run.sh restart',
      { code: 'zero', procs: 1, says: 'restarted' });
  }
  check('start that never answers', './run.sh stop >/dev/null && ./run.sh server',
    { code: 'nonzero', procs: 0, says: ':1367' },
    { WBAPI_START_CMD: 'true', WBAPI_SETTLE_TIMEOUT: '2' });
} finally {
  if (wasUp) sh('./run.sh server >/dev/null 2>&1 || true');
  else sh('./run.sh stop >/dev/null 2>&1 || true');
}

if (findings.length) {
  console.log(`✗ check-restart: ${findings.length} finding(s)`);
  for (const f of findings) console.log(`  ${f}`);
  process.exitCode = 1;
} else {
  console.log(`✓ check-restart: 6 invocations — chained pair ×3, restart ×2, failed start ×1 — each returned inside ${DEADLINE_MS} ms with the process count asserted`);
}
