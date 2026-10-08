#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ad — `docs/design/quest.md` scored against `QUEST_DB`, both ways, over the population
// the register is meant to cover.
//
// The register's claim is only as good as its scope. QUEST_DB holds two kinds of id, and the
// split is written down here rather than inferred (a percentage heuristic cannot see a family
// that is entirely generated):
//   register population — hand-authored arcs: `quest_*`, the main line `mq_*`, the Birka side
//                         line `sq_*`; each is meant to have a row in quest.md
//   generated corpus    — the per-node five-act skill-check chains, `<node>[NN]_[NN_]actN` and
//                         `<node>_cNaN`, and Fishmonger's Row's `ams_NN_NN`; indexed by
//                         `./bin/api list quest --node`, not here
//   anything else       — a finding: a new shape needs a line in one list or the other
//
//   cited    — every quest-shaped token quest.md writes is a QUEST_DB id, or is listed in
//              NOT_A_QUEST_ID with what it is (a design-era alias beside its live id, a glob);
//              the register's two range spellings count as citations of every member QUEST_DB
//              holds: `quest_d0207_a1–a5` (a dash run over the trailing leg) and
//              `quest_guide_01/02/03/05` (a slash list of trailing legs)
//   missing  — the population ids quest.md never cites; the count is printed, and it may not
//              rise above UNREGISTERED_MAX — lower the constant as rows land
//
// Asserts only, never rewrites (§DX-02fx).
// Run: node scripts/check-questindex.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

const REGISTER = /^(?:quest|mq|sq)_/;
const GENERATED = [/^[a-z]{2,4}\d*_(?:\d+_)?act\d+$/, /^[a-z]{3}_c\d+a\d+$/, /^ams_\d+_\d+$/];
const UNREGISTERED_MAX = 0;

const NOT_A_QUEST_ID = {
  quest_cy_madness_gate: 'design name of quest_d0207_a1–a5 (§D02-07)',
  quest_mimic_colony: 'design name of quest_d0208_a1–a5 (§D02-08)',
  quest_inquisitor: 'design name of the quest_inquisitor_handshake/_questions/_final trio (§D02-02)',
  quest_prior_carrier: 'design name of the node-woven Prior Carrier beats (§D02-03)',
  quest_scholar_workshop: 'design name of quest_d0206_a1–a5 (§D02-06)',
  quest_scriptorium_approach: 'design name of quest_d0201_a1–a5 (§D02-01)',
  quest_void_maze: 'design name of quest_d0205_a1–a5 (§D02-05)',
  quest_void_flux: 'design name of quest_d0209_a1–a5 (§D02-09)',
  quest_memory_gate: 'design name of quest_d0204_a1–a5 (§D02-04)',
  quest_loop_heart: 'design name of quest_d0210_a1–a5 (§D02-10)',
  quest_ng_0: 'the `quest_ng_0*` glob over the Froberger set',
  quest_01: 'prose — the §CROWN-01 Whisper note means its first quest, not an id',
};

const TOKEN = /(?<![A-Za-z0-9_])([a-z][a-z0-9]*(?:_[a-z0-9]+)+)(?![A-Za-z0-9_])/g;
const DASH_RUN = /(?<![A-Za-z0-9_])([a-z][a-z0-9]*(?:_[a-z0-9]+)*_)([a-z]*)(\d+)[–-]\2(\d+)(?![A-Za-z0-9_])/g;
const SLASH_LIST = /(?<![A-Za-z0-9_])([a-z][a-z0-9]*(?:_[a-z0-9]+)*_)(\d+(?:\/\d+)+)(?![A-Za-z0-9_\/])/g;
function rangeMembers(line) {
  const out = [];
  for (const m of line.matchAll(DASH_RUN)) {
    const [, stem, leg, from, to] = m;
    const width = from.length;
    for (let n = Number(from); n <= Number(to); n++) out.push(stem + leg + String(n).padStart(width, '0'));
  }
  for (const m of line.matchAll(SLASH_LIST)) for (const n of m[2].split('/')) out.push(m[1] + n);
  return out;
}
const questShaped = (t) => REGISTER.test(t) || GENERATED.some((re) => re.test(t));

function audit({ ids, text, max = UNREGISTERED_MAX }) {
  const findings = [];
  const all = new Set(ids);
  const population = [], generated = [];
  for (const id of ids) {
    if (REGISTER.test(id)) population.push(id);
    else if (GENERATED.some((re) => re.test(id))) generated.push(id);
    else findings.push(`[shape] QUEST_DB id \`${id}\` is neither register population nor a generated shape — classify it in check-questindex.js`);
  }
  const cited = new Set();
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const id of rangeMembers(line)) if (all.has(id)) cited.add(id);
    for (const m of line.matchAll(TOKEN)) {
      const t = m[1];
      if (all.has(t)) { cited.add(t); continue; }
      if (!questShaped(t)) continue;
      if (t in NOT_A_QUEST_ID) continue;
      findings.push(`[cited] quest.md:${i + 1} names \`${t}\`, which is no QUEST_DB id — fix the id, or list it in NOT_A_QUEST_ID with what it is`);
    }
  });
  for (const t of Object.keys(NOT_A_QUEST_ID)) if (all.has(t)) findings.push(`[alias] NOT_A_QUEST_ID lists \`${t}\`, and QUEST_DB now holds that id — remove the entry`);
  const missing = population.filter((id) => !cited.has(id));
  if (missing.length > max)
    findings.push(`[missing] quest.md lacks ${missing.length} of ${population.length} register ids, above the ${max} it held — register the new ones (first: ${missing.slice(0, 5).join(', ')})`);
  return { findings, population: population.length, generated: generated.length, cited: population.filter((id) => cited.has(id)).length, missing: missing.length };
}

function world() {
  const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core'));
  W.load(path.join(ROOT, 'play.html'));
  return { ids: Object.keys(W.questDb), text: fs.readFileSync(path.join(ROOT, 'docs', 'design', 'quest.md'), 'utf8') };
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const MAX = 2;
  const ids = ['quest_a_01', 'quest_a_02', 'quest_d0207_a1', 'mq_1', 'sq_1', 'blq_01_act1', 'shk6_act1', 'hty01_act1', 'waw001_act1', 'ath_c1a1', 'ams_01_01'];
  const text = '| `quest_a_01` | "A" |\n| `mq_1` | main |\nprose about blq_01_act1 and `quest_d0207_a1–a5` *(design: quest_cy_madness_gate)*\n';
  const run = (o) => audit({ max: MAX, ids, text, ...o });
  const clean = run({});
  ok(clean.findings.length === 0, 'a register with resolvable ids and a listed alias is clean: ' + clean.findings.join('; '));
  ok(clean.population === 5 && clean.generated === 6 && clean.cited === 3 && clean.missing === 2, `counts: ${JSON.stringify(clean)}`);
  ok(run({ text: text + '\nsee `quest_a_09` too' }).findings.some((f) => f.startsWith('[cited] quest.md:5 names `quest_a_09`')), 'a cited id that resolves nowhere is named with its line');
  ok(run({ text: text + '\n*(design: quest_unlisted_alias)*' }).findings.some((f) => f.includes('`quest_unlisted_alias`')), 'an alias not in NOT_A_QUEST_ID is a finding');
  ok(run({ text: text + '\nflag `visbyUnderground`, node `merchant_ship`, bit `wis_page`, file `check_invariants`' }).findings.length === 0, 'snake_case tokens that are not quest-shaped are ignored');
  ok(run({ ids: [...ids, 'quest_cy_madness_gate'] }).findings.some((f) => f.startsWith('[alias]')), 'an alias QUEST_DB starts to hold is a finding');
  ok(run({ ids: [...ids, 'weird-shape'] }).findings.some((f) => f.startsWith('[shape]')), 'an id of no written-down shape is a finding');
  ok(run({ text: text + '\nblq_01_act1 shk6_act1 hty01_act1' }).findings.length === 0, 'generated ids may be cited or not — never a finding');
  const many = Array.from({ length: MAX + 3 }, (_, k) => `quest_z_${k}`);
  ok(run({ ids: [...ids, ...many] }).findings.some((f) => f.startsWith('[missing]') && f.includes(`${MAX + 5} of`)), 'the unregistered count above the ratchet is a finding that names the number');
  ok(run({ ids: [...ids, ...many.slice(0, MAX - 2)] }).findings.length === 0, 'the unregistered count at the ratchet is not a finding');
  ok(run({ text: text + '\n`quest_a_02` registered' }).missing === 1, 'a newly cited id lowers the unregistered count');
  const legs = [...ids, 'quest_d0207_a2', 'quest_d0207_a3', 'quest_d0207_a4', 'quest_d0207_a5', 'quest_a_03', 'quest_a_05'];
  const dash = run({ ids: legs, max: 4 });
  ok(dash.cited === 7 && !dash.findings.length, `a dash run cites every member QUEST_DB holds: ${JSON.stringify(dash)}`);
  ok(run({ ids: legs, max: 4, text: text + '\nsee `quest_a_01/03/05`' }).cited === 9, 'a slash list cites each listed leg');
  ok(run({ ids: legs, max: 4, text: text + '\nsee `quest_a_01/03/09`' }).findings.length === 0, 'a listed leg QUEST_DB lacks is not cited and not a finding');
  ok(run({ ids: legs, max: 4, text: text + '\nsee `quest_a_01/03/09`' }).cited === 8, 'a slash list over a missing leg still cites the legs that resolve');
  if (fail) { console.log(`\n✗ check-questindex selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-questindex selftest: all ${pass} checks pass`);
  return;
}

const r = audit(world());
if (r.findings.length) {
  console.error(`✗ check:questindex — ${r.findings.length} finding(s):\n`);
  r.findings.forEach((f) => console.error('  ' + f));
  process.exit(1);
}
console.log(`✓ check:questindex — quest.md cites ${r.cited} of ${r.population} register ids (${r.missing} unregistered, ratchet ${UNREGISTERED_MAX}); every cited quest-shaped token resolves; ${r.generated} generated ids exempt by shape`);
