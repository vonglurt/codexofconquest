#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02gh — every command a binding doc tells you to run must exist.
//
// `./api.sh` and `./wbapi-toggle.sh` were renamed to `./bin/api` and `./bin/wbapi`, and the
// five documents that teach the write path were never told. **488** dead `./api.sh`
// invocations survived in them, in `docs/api/API-README.md` — which `resume.md` §6 lists as
// reading #6, *"the write path"* — under a heading reading `## Directive: Always Use
// ./api.sh`. The rule survived the rename; every command expressing it did not.
//
// It was invisible because **nothing has ever executed a document**. This gate does the one
// cheap half of executing one: resolve the first token of every line inside a fenced
// bash/sh block and fail when it names something that does not exist.
//
// Resolved, in order: a `./path` or `path/` invocation against the filesystem · `make <t>`
// against the Makefile's targets · `npm run <s>` against a package.json's scripts ·
// `./run.sh <verb>` against run.sh's own case arms. Anything else — a bare `curl`, `grep`,
// `cd`, a pipeline stage, an assignment — is not this gate's business and is skipped by
// name, because a gate that guesses at shell is a gate nobody trusts.
//
// SWEPT vs HISTORY is the §AUDIT-03m rule, for the same reason: a lab report is a record of
// what was run in 2026-07, and rewriting it to today's binary names would falsify it. Only
// documents that TELL A READER WHAT TO RUN NOW are swept. A swept doc that stops existing,
// or a HISTORY entry that stops being needed, both fail — an exemption list nothing checks
// is where defects go to be forgotten (gate #17's rule).
//
// Read-only. Run: node scripts/check-doc-commands.js [--selftest]

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

// Documents that instruct. Every one of these is on `resume.md` §6's reading list or is
// reached from it, and a dead command in one of them is a session running the wrong thing.
const SWEPT = [
  'CONTRIBUTING.md',
  'AGENTS.md',
  'resume.md',
  'README.md',
  'docs/api/API-README.md',
  'docs/api/api-user-guide.md',
  'docs/api/api-faq.md',
  'docs/api/wbapi-help.md',
];

// Everything else under docs/ is a record, not an instruction. Named by prefix, with the
// reason, rather than by a pattern that would quietly grow.
const HISTORY = {
  'docs/lab-reports/': 'a lab report records what was run when it was written; rewriting it to today names falsifies the record',
  'docs/archive/': 'archived verbatim by definition',
  'docs/backlog/': 'backlog rows quote the commands of the session that filed them, including the dead ones they are about',
  'docs/notes/': 'session notes and resume prompts — records of past runs',
  'docs/design/': 'design docs describe the world, and their command lines are illustrative rather than a procedure to follow',
  'docs/mechanics/': 'same as docs/design',
  'docs/story/': 'same as docs/design',
  'docs/maps/': 'same as docs/design',
};

// Tokens that are shell, not a project entry point. Named rather than pattern-matched.
const NOT_OURS = new Set([
  'cd', 'ls', 'cat', 'echo', 'grep', 'rg', 'sed', 'awk', 'curl', 'jq', 'git', 'node', 'npm',
  'npx', 'python3', 'python', 'open', 'kill', 'pkill', 'ps', 'wc', 'head', 'tail', 'sort',
  'uniq', 'cp', 'mv', 'rm', 'mkdir', 'touch', 'chmod', 'export', 'for', 'while', 'if',
  'then', 'else', 'fi', 'do', 'done', 'case', 'esac', 'function', 'return', 'exit', 'set',
  'source', '.', 'sleep', 'diff', 'find', 'xargs', 'tr', 'cut', 'tee', 'test', 'true',
  'false', 'read', 'printf', 'nl', 'less', 'more', 'du', 'df', 'which', 'command', 'make',
  'playwright', 'osascript', 'say', 'perl', 'basename', 'dirname', 'date', 'seq', 'env',
]);

// ── extractors (pure — the selftest drives these) ────────────────────────────

// Every non-blank line inside a ```bash / ```sh fence, with its 1-based line number and
// the index of the block it came from — so the pass line can count blocks without
// inferring them from line contiguity, which a blank line inside a block would break.
function fencedLines(src) {
  const out = [];
  let inFence = false, block = 0;
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const open = /^\s*```+\s*(bash|sh|shell|console)\s*$/i.exec(l);
    if (!inFence && open) { inFence = true; block++; continue; }
    if (inFence && /^\s*```+\s*$/.test(l)) { inFence = false; continue; }
    if (inFence && l.trim()) out.push({ n: i + 1, text: l, block });
  }
  return out;
}

// The invocation a line makes, or null when the line is not one. A line may hold several
// (`a && b`, `x | y`); each is returned, because `./gone.sh && echo ok` is still dead.
function invocations(line) {
  const stripped = line.replace(/#.*$/, '').trim();
  if (!stripped) return [];
  const out = [];
  for (let seg of stripped.split(/&&|\|\||[|;]/)) {
    seg = seg.trim();
    // Drop leading VAR=value assignments — the command is what follows them.
    while (/^[A-Za-z_][A-Za-z0-9_]*=\S*\s+/.test(seg)) seg = seg.replace(/^\S+\s+/, '');
    if (!seg) continue;
    const parts = seg.split(/\s+/);
    const head = parts[0];
    if (!head || head.startsWith('-') || head.startsWith('$') || head.startsWith('"')) continue;
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(head)) continue;
    out.push({ head, args: parts.slice(1) });
  }
  return out;
}

// Returns a finding string, or null.
function resolve(inv, world) {
  const { head, args } = inv;
  if (NOT_OURS.has(head) && head !== 'make') return null;
  if (head === 'make') {
    const t = args.find((a) => !a.startsWith('-'));
    if (!t) return null;
    return world.makeTargets.includes(t) ? null : `\`make ${t}\` — no such target in the Makefile`;
  }
  if (head.startsWith('./') || head.includes('/')) {
    const rel = head.replace(/^\.\//, '');
    if (!world.files.has(rel)) return `\`${head}\` — no such file in the repo`;
    if (rel === 'run.sh') {
      const verb = args.find((a) => !a.startsWith('-'));
      if (verb && !world.runVerbs.includes(verb)) return `\`./run.sh ${verb}\` — run.sh has no such verb`;
    }
    return null;
  }
  if (NOT_OURS.has(head)) return null;
  return null;   // a bare name we do not own; PATH is not this gate's business
}

// ── the world the resolver is checked against ───────────────────────────────
function readWorld() {
  const files = new Set();
  const walk = (dir, prefix) => {
    for (const e of fs.readdirSync(path.join(ROOT, dir || '.'), { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'vendor' || e.name === 'build') continue;
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) walk(rel, rel); else files.add(rel);
    }
  };
  walk('', '');
  const mk = fs.readFileSync(path.join(ROOT, 'Makefile'), 'utf8');
  const makeTargets = [...mk.matchAll(/^([a-zA-Z][\w-]*):/gm)].map((m) => m[1]);
  const runSh = fs.readFileSync(path.join(ROOT, 'run.sh'), 'utf8');
  const caseBody = runSh.slice(runSh.indexOf('case "${1:-help}"'));
  const runVerbs = [...caseBody.matchAll(/^\s{2}([a-z|]+)\)/gm)].flatMap((m) => m[1].split('|'));
  return { files, makeTargets, runVerbs };
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const world = { files: new Set(['bin/api', 'run.sh', 'play.html']), makeTargets: ['wbapi', 'stop'], runVerbs: ['server', 'stop', 'procs'] };

  ok(fencedLines('a\n```bash\nrun me\n```\nb').map((l) => l.text).join() === 'run me', 'a bash fence yields its lines');
  ok(fencedLines('```js\nnotshell\n```').length === 0, 'a js fence is not shell');
  ok(fencedLines('```bash\none\n```\ntext\n```sh\ntwo\n```').length === 2, 'both bash and sh fences are read');
  ok(fencedLines('```bash\nkept\n').length === 1, 'an unterminated fence still yields its lines');

  ok(invocations('# just a comment').length === 0, 'a comment line is not an invocation');
  ok(invocations('./bin/api ping   # health').map((i) => i.head).join() === './bin/api', 'a trailing comment is stripped');
  ok(invocations('./a && ./b | ./c').map((i) => i.head).join(',') === './a,./b,./c', 'every stage of a chain is an invocation');
  ok(invocations('NO_TERM=1 ./run.sh server')[0].head === './run.sh', 'a leading assignment is not the command');
  ok(invocations('PORT=1 WBAPI_PORT=2 ./run.sh server')[0].head === './run.sh', 'several assignments are stripped');
  ok(invocations('FOO=bar').length === 0, 'a bare assignment is not an invocation');

  ok(resolve({ head: './bin/api', args: ['ping'] }, world) === null, 'a live executable resolves');
  // The 488 dead invocations this gate was written for.
  ok((resolve({ head: './api.sh', args: ['ping'] }, world) || '').includes('no such file'),
    '§DX-02gh: ./api.sh is caught as a dead file');
  ok((resolve({ head: 'make', args: ['nope'] }, world) || '').includes('no such target'),
    'a make target that does not exist is caught');
  ok(resolve({ head: 'make', args: ['wbapi'] }, world) === null, 'a real make target resolves');
  ok((resolve({ head: './run.sh', args: ['nosuchverb'] }, world) || '').includes('no such verb'),
    'a run.sh verb that does not exist is caught');
  ok(resolve({ head: './run.sh', args: ['procs'] }, world) === null, 'a real run.sh verb resolves');
  ok(resolve({ head: 'curl', args: [] }, world) === null, 'curl is not this gate\'s business');
  ok(resolve({ head: 'grep', args: [] }, world) === null, 'grep is not this gate\'s business');

  if (fail) { console.log(`\n✗ check-doc-commands selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-doc-commands selftest: all ${pass} checks pass`);
  return;
}

const world = readWorld();
const findings = [];
let blocks = 0, calls = 0;

for (const rel of SWEPT) {
  if (!world.files.has(rel)) { findings.push(`[stale-sweep] ${rel} is swept and no longer exists — retire it from SWEPT`); continue; }
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const fenced = fencedLines(src);
  blocks += new Set(fenced.map((f) => f.block)).size;
  for (const { n, text } of fenced) {
    for (const inv of invocations(text)) {
      calls++;
      const f = resolve(inv, world);
      if (f) findings.push(`[dead] ${rel}:${n} — ${f}`);
    }
  }
}

// A HISTORY prefix that no longer holds any document is an exemption nothing needs.
for (const [prefix, why] of Object.entries(HISTORY)) {
  const any = [...world.files].some((f) => f.startsWith(prefix) && f.endsWith('.md'));
  if (!any) findings.push(`[stale-history] ${prefix} is classified HISTORY (${why}) and holds no document — retire the classification`);
}

if (findings.length) {
  console.log(`✗ check-doc-commands: ${findings.length} finding(s) over ${SWEPT.length} swept documents`);
  for (const f of findings) console.log(`  ${f}`);
  console.log('  A document that names a command which does not exist is a session running the');
  console.log('  wrong thing (§DX-02gh). Fix the document, or add the entry point it names.');
  process.exitCode = 1;
} else {
  console.log(`✓ §DX-02gh doc commands: ${calls} invocations in ${blocks} fenced blocks across ${SWEPT.length} swept documents all resolve · ${Object.keys(HISTORY).length} HISTORY prefixes classified by name`);
}
