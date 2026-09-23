#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02le — a `cache_control` breakpoint below the model's minimum cacheable prefix is
// accepted, answers `ok`, and caches nothing: no error, no warning, only
// `cache_creation_input_tokens: 0` in a usage block nobody reads. That is how the
// NPC-speak system block carried one from June until §DX-02ak (`05bb436`) deleted it —
// 20 logged calls, every one writing and reading 0 — while two lab reports priced a roadmap
// on the saving. A deletion with a comment is a fix for today; this is the fence for the
// next edit that puts it back.
//
// THE RULE. Every `cache_control` PROPERTY in server-side source must carry a declaration
// within the eight lines above it:
//
//     // prompt-cache: <model id> prefix >= <N> tokens
//
// naming the model the prefix was measured for, and a measured prefix at or above that
// model's floor in FLOORS. Undeclared, an unknown model, or a prefix under the floor all
// fail. The word in a comment is not a property — §DX-02ak's own comment records the
// floor and says `cache_control`, and a gate that went red on it would be deleted, not
// obeyed — so comments are stripped before the property is looked for.
//
// THE FLOOR IS PER MODEL, AND NOT MONOTONIC. The NPC-speak endpoint takes `?model=`, so
// the default is not the only model a request can name. Haiku 4.5 needs 4096 tokens;
// Opus 5 and the Fable models need 512, which the largest NPC blocks (~694) would clear.
// A declaration therefore names one model, and a breakpoint that is only worth having on
// some of the models a route accepts has to say which.
//
// Read-only. Run: node scripts/check-prompt-cache.js [--selftest]

'use strict';
const fs = require('fs');
const path = require('path');
const SRC = path.resolve(__dirname, '..');

// Minimum cacheable prefix, in tokens, from the prompt-caching API reference (2026-09-23).
// A model missing here fails rather than passing: a floor nobody looked up is the defect.
const FLOORS = {
  'claude-opus-5': 512, 'claude-opus-5-5': 512,
  'claude-fable-5': 512, 'claude-fable-5-1': 512,
  'claude-opus-4-8': 1024, 'claude-sonnet-5': 1024, 'claude-sonnet-4-6': 1024,
  'claude-sonnet-4-5': 1024,
  'claude-opus-4-7': 2048,
  'claude-opus-4-6': 4096, 'claude-opus-4-5': 4096,
  'claude-haiku-4-5': 4096, 'claude-haiku-4-5-20251001': 4096,
};

// Server-side source only. `scripts/` is the gates, whose fixtures quote the property.
const DIRS = ['js', 'api', 'server', 'tools', 'importers', 'bin'];
const LOOKBACK = 8;

// Comments out, line structure kept, so a finding's line number is the file's.
// `//` counts only after whitespace or punctuation, which keeps `https://` intact.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[\s;,{}()])\/\/.*$/gm, '$1');
}

function scan(src, file) {
  const findings = [];
  const raw = src.split('\n');
  const code = stripComments(src).split('\n');
  code.forEach((line, i) => {
    if (!/\bcache_control\s*:/.test(line)) return;
    const at = `${file}:${i + 1}`;
    const decl = raw.slice(Math.max(0, i - LOOKBACK), i + 1).map((l) =>
      l.match(/prompt-cache:\s*([a-z0-9.-]+)\s+prefix\s*>=\s*(\d+)\s*tokens/)).filter(Boolean).pop();
    if (!decl) {
      findings.push(`${at} sets cache_control with no '// prompt-cache: <model> prefix >= <N> tokens' above it — below the floor it caches nothing and says nothing (§DX-02ak)`);
      return;
    }
    const [, model, n] = decl;
    if (!(model in FLOORS)) {
      findings.push(`${at} declares model '${model}', which has no floor in FLOORS — look it up and add it`);
    } else if (Number(n) < FLOORS[model]) {
      findings.push(`${at} declares a ${n}-token prefix for ${model}, whose minimum is ${FLOORS[model]} — this breakpoint cannot fire`);
    }
  });
  return findings;
}

function sources() {
  const out = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(c|m)?js$/.test(e.name)) out.push(p);
    }
  };
  DIRS.forEach((d) => walk(path.join(SRC, d)));
  return out;
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (cond, label) => { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + label); } };
  const block = (above, prop = "cache_control: { type: 'ephemeral' }") =>
    [...above, `  system: [{ type: 'text', text: s, ${prop} }],`].join('\n');

  ok(scan(block([]), 'f').some((f) => f.includes('no \'// prompt-cache')),
    'the shape §DX-02ak deleted — undeclared, on the default Haiku route — fails');
  ok(scan(block(['// No cache_control: Haiku 4.5 floor is 4096.']).replace(/, cache_control[^}]*}/, ''), 'f').length === 0,
    'the word in a comment is not a property — the shipped comment passes');
  ok(scan('/* cache_control: { type: "ephemeral" } */\nconst x = 1;', 'f').length === 0,
    'a block comment is not a property either');
  ok(scan(block(['// prompt-cache: claude-haiku-4-5 prefix >= 5000 tokens']), 'f').length === 0,
    'declared above the floor passes');
  ok(scan(block(['// prompt-cache: claude-haiku-4-5-20251001 prefix >= 694 tokens']), 'f').some((f) => f.includes('minimum is 4096')),
    'the largest NPC block declared against Haiku 4.5 fails');
  ok(scan(block(['// prompt-cache: claude-opus-5 prefix >= 694 tokens']), 'f').length === 0,
    'the same 694 tokens against Opus 5 (floor 512) passes — the floor is per model');
  ok(scan(block(['// prompt-cache: claude-imaginary-9 prefix >= 99999 tokens']), 'f').some((f) => f.includes('no floor')),
    'an unknown model fails rather than passing');
  ok(scan(block(['// prompt-cache: claude-opus-5 prefix >= 9000 tokens', ...Array(LOOKBACK).fill('x();')]), 'f').some((f) => f.includes('no \'// prompt-cache')),
    'a declaration further than the lookback does not count');
  ok(scan("const u = 'https://api.example/x'; const o = { cache_control: 1 };", 'f').length === 1,
    'a URL on the line does not hide the property behind a fake comment');
  ok(scan(block([]), 'a/b.js')[0].startsWith('a/b.js:1 '),
    'a finding names the file and line');

  if (fail) { console.log(`\n✗ check-prompt-cache selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-prompt-cache selftest: all ${pass} checks pass`);
  return;
}

const files = sources();
const findings = files.flatMap((f) => scan(fs.readFileSync(f, 'utf8'), path.relative(SRC, f)));
if (findings.length) {
  findings.forEach((f) => console.log('  ✗ ' + f));
  console.log(`\n✗ check-prompt-cache: ${findings.length} finding(s)`);
  process.exit(1);
}
console.log(`✓ §DX-02le prompt cache: ${files.length} server-side files, every cache_control is declared above its model's floor (${Object.keys(FLOORS).length} models known)`);
