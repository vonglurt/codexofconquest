#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §VM-01-B — server↔client seeded-PRNG PARITY guard (CI-gated).
//
// The client rolls encounters / skill checks / loot from a seeded mulberry32
// stream (_seededNext, roll2hit-v3.html) so a save fully determines future rolls
// and a single roll is server-verifiable. The server rolls the same encounter
// from seededNext (js/wbapi-server.js). Two mulberry32s in two files silently
// drift the day someone "tidies" one of them — a divergence no gameplay test
// would catch, only a save-repro or a desynced MP roll days later.
//
// This guard runs the REAL source on each side (extracted + eval'd in a sandbox,
// the same way check-*-parity.js replays the kernel — no replicas):
//   P1  STREAM parity   — _seededNext(seed) must equal seededNext(seed) byte-for-
//                         byte over many draws, for a spread of seeds.
//   P2  DETERMINISM     — same seed twice on the client → identical sequence
//                         (the stream is a pure function of rngState).
//   P3  DUEL cross-check — __duelRng (DUEL:CORE, the third mulberry32) must agree
//                         too, so all three streams in the tree stay one algorithm.
//   P4  FIELD presence  — rngState must be declared in _S_DEFAULTS() (§STATE-INIT
//                         authoritative shape) so the field can't be dropped.
//
// Exit 0 if all hold; exit 1 (with the first divergent seed + draw index) on any drift.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GAME = fs.readFileSync(path.join(ROOT, 'roll2hit-v3.html'), 'utf8');
const SERVER = fs.readFileSync(path.join(ROOT, 'js', 'wbapi-server.js'), 'utf8');

const fails = [];

// Extract a named `function NAME(…){…}` by brace-counting (same helper shape as
// scripts/check-terrain-parity.js). Template-literal `${…}` interpolations are
// brace-balanced, so a naive counter still finds the true close.
function extractFn(srcText, name) {
  const start = srcText.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`could not find function ${name}`);
  const braceStart = srcText.indexOf('{', start);
  let depth = 0;
  for (let i = braceStart; i < srcText.length; i++) {
    if (srcText[i] === '{') depth++;
    else if (srcText[i] === '}' && --depth === 0) return srcText.slice(start, i + 1);
  }
  throw new Error(`unterminated function ${name}`);
}

// ── build the two (three) real generators in a sandbox ────────────────────────
// _seededNext() reads/writes the module-scope `S_story` binding (direct eval
// closes over it, exactly as check-terrain-parity's _inferTerrain closes over
// SEA_LANES/NODE_MAP). Reassigning S_story before each run is visible to the closure.
let S_story = {};
let clientNext, serverNext, duelRngFactory;
try { clientNext = eval('(' + extractFn(GAME, '_seededNext') + ')'); }
catch (e) { fails.push('extract: client _seededNext — ' + e.message); }
try { serverNext = eval('(' + extractFn(SERVER, 'seededNext') + ')'); }
catch (e) { fails.push('extract: server seededNext — ' + e.message); }
try { duelRngFactory = eval('(' + extractFn(GAME, '__duelRng') + ')'); }
catch (e) { fails.push('extract: client __duelRng — ' + e.message); }

// Seeds: small, large, high-bit-set, and values that go negative under `| 0`.
const SEEDS = [1, 2, 7, 42, 1000, 65535, 0x6D2B79F5, 0x7FFFFFFF, 0x80000000, 0xFFFFFFFF, 123456789, 4013];
const DRAWS = 500;

// ── P1 — stream parity (client _seededNext == server seededNext) ──────────────
let p1checked = 0;
if (clientNext && serverNext) {
  for (const seed of SEEDS) {
    S_story = { rngState: seed >>> 0 || 1 };   // non-zero so the lazy bootstrap never fires
    const s = { rngState: seed >>> 0 || 1 };
    for (let i = 0; i < DRAWS; i++) {
      const a = clientNext(), b = serverNext(s);
      p1checked++;
      if (a !== b) { fails.push(`P1: stream diverges at seed=${seed} draw#${i} — client=${a} server=${b}`); break; }
    }
  }
}

// ── P2 — determinism (same seed twice on client → identical sequence) ─────────
if (clientNext) {
  const seed = 0x1234ABCD;
  S_story = { rngState: seed }; const first = Array.from({ length: DRAWS }, () => clientNext());
  S_story = { rngState: seed }; const again = Array.from({ length: DRAWS }, () => clientNext());
  if (first.join(',') !== again.join(',')) fails.push('P2: client stream is NOT a pure function of rngState (same seed → different sequence)');
}

// ── P3 — DUEL __duelRng agrees (third mulberry32, same algorithm) ─────────────
let p3checked = 0;
if (clientNext && duelRngFactory) {
  for (const seed of SEEDS) {
    const s0 = seed >>> 0 || 1;
    S_story = { rngState: s0 };
    const duel = duelRngFactory(s0);       // returns a closure over its own `a = seed`
    for (let i = 0; i < DRAWS; i++) {
      const a = clientNext(), d = duel();
      p3checked++;
      if (a !== d) { fails.push(`P3: __duelRng diverges from _seededNext at seed=${seed} draw#${i} — seeded=${a} duel=${d}`); break; }
    }
  }
}

// ── P4 — rngState declared in _S_DEFAULTS() (authoritative shape, §STATE-INIT) ─
// _S_DEFAULTS is an arrow (`const _S_DEFAULTS = () => ({…})`), so extractFn's
// `function NAME(` won't match — assert on the source region instead.
{
  const m = GAME.match(/const\s+_S_DEFAULTS\s*=\s*\(\)\s*=>\s*\(\{[\s\S]*?\n\}\);/);
  const body = m ? m[0] : '';
  if (!body) fails.push('P4: could not locate _S_DEFAULTS() literal');
  else if (!/\brngState\s*:/.test(body)) fails.push('P4: rngState is not declared in _S_DEFAULTS() — the seeded stream cell would be undefined on a fresh state');
}

// ── report ────────────────────────────────────────────────────────────────────
console.log('§VM-01-B server↔client seeded-PRNG parity');
console.log(`  P1  stream draws checked = ${p1checked} over ${SEEDS.length} seeds  (client==server: ${!fails.some(f => f.startsWith('P1:'))})`);
console.log(`  P2  determinism (same seed → same sequence): ${!fails.some(f => f.startsWith('P2:'))}`);
console.log(`  P3  __duelRng draws checked = ${p3checked}  (duel==seeded: ${!fails.some(f => f.startsWith('P3:'))})`);
console.log(`  P4  rngState in _S_DEFAULTS(): ${!fails.some(f => f.startsWith('P4:'))}`);

if (fails.length) {
  console.error('\n✗ RNG PARITY VIOLATIONS:');
  for (const f of fails) console.error('   ✗ ' + f);
  process.exit(1);
}
console.log('\n✓ client _seededNext is byte-identical to server seededNext (and DUEL __duelRng) — one stream, replayable from a save');
process.exit(0);
