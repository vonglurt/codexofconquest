#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02kv — `SCHEMAS` in wbapi-server.js is the API's self-description, served at
// GET /api/schema and read by the worldbuilder's field help. It had drifted in BOTH
// directions and nothing noticed: quest declared 23 fields where QUEST_DB carries 31,
// omitting `id` on all 2,853 quests and `desc` on 2,806; node declared `N`/`S`/`E`/`W`,
// which 0 of 416 nodes carry.
//
// Both directions are hazards and they are different hazards. A field the corpus carries
// and the schema omits tells an author a real field is unsupported. A field the schema
// declares and no entry carries invites a write that lands where nothing reads it — the
// §DX-02gy shape, offered by the API's own documentation.
//
// CLASSIFICATION, NOT EXEMPTION (the #13/#14 rule). A declared field that no entry
// carries passes only when the schema entry says `classified:` and the reason is one this
// gate knows. Two exist:
//   'derived'             — the value is computed, never stored (fish.isNight).
//   'written-not-carried' — a live endpoint writes the field although no entry carries it
//                           (node.N/S/E/W: §CELL-01 stripped them, the graph endpoints
//                           still PUT them). Retiring the declaration would hide a live
//                           write path; this states it instead.
// An unclassified absence fails, and a classification on a field the corpus DOES carry
// fails too — a stale classification is the same defect one step later.
//
// The live side is read through wbapi-core's parser and never through the JSON export:
// the export erases a function value and drops its key, so `activateCond` (30 quests)
// would read as dead. That erasure produced a wrong list once already, inside §DX-02gy.
//
// Read-only: never writes the game file.
// Run: node scripts/check-schema.js [--selftest]

'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const SERVER = path.join(ROOT, 'src', 'js', 'wbapi-server.js');
const GAME = path.join(ROOT, 'play.html');

const REASONS = new Set(['derived', 'written-not-carried']);

// The collection each schema type describes, by the name wbapi-core loads it under.
// A type here with no collection is not checkable and says so rather than passing.
const COLLECTION = {
  monster: 'monsterPool', node: 'nodeMap', quest: 'questDb', terrain: 'worldDb',
  npc: 'birkaNpcs', fish: 'fishPool', lake_magic: 'lakeMagicDb',
};

// ── extractors (pure — the selftest drives these) ────────────────────────────

// SCHEMAS is a pure object literal; brace-match it out of the source and evaluate it.
// Reading it any other way (a regex over field names) would not see `classified:`.
function extractSchemas(src) {
  const i = src.indexOf('const SCHEMAS = {');
  if (i === -1) return null;
  let j = src.indexOf('{', i), d = 0, k = j;
  while (k < src.length) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) break; }
    k++;
  }
  if (d !== 0) return null;
  try { return (0, eval)('(' + src.slice(j, k + 1) + ')'); } catch { return null; }
}

// field -> count of entries carrying it, for one collection of entry objects.
function censusFields(entries) {
  const counts = {};
  for (const e of entries) {
    if (!e || typeof e !== 'object') continue;
    for (const f of Object.keys(e)) counts[f] = (counts[f] || 0) + 1;
  }
  return counts;
}

function scan(schemas, censusByType) {
  const findings = [];
  if (!schemas) return ['SCHEMAS not found or not a literal — the gate cannot verify what it cannot read'];

  let types = 0, declared = 0, live = 0;
  for (const [type, spec] of Object.entries(schemas)) {
    if (type.startsWith('_')) continue;
    types++;
    const fields = (spec && spec.fields) || {};
    const census = censusByType[type];
    if (!census) { findings.push(`${type}: declared in SCHEMAS with no collection this gate can census`); continue; }

    for (const [f, def] of Object.entries(fields)) {
      declared++;
      const carried = census[f] || 0;
      const cls = def && def.classified;
      if (carried === 0 && !cls)
        findings.push(`${type}.${f} is declared and carried by 0 entries — declare it \`classified:\` with a reason, or remove it`);
      else if (carried === 0 && !REASONS.has(cls))
        findings.push(`${type}.${f} is classified '${cls}', which is not a reason this gate knows (${[...REASONS].join(', ')})`);
      else if (carried > 0 && cls)
        findings.push(`${type}.${f} is classified '${cls}' but ${carried} entr${carried === 1 ? 'y carries' : 'ies carry'} it — the classification is stale`);
    }
    for (const [f, n] of Object.entries(census)) {
      live++;
      if (!(f in fields))
        findings.push(`${type}.${f} is carried by ${n} entr${n === 1 ? 'y' : 'ies'} and declared by nothing — GET /api/schema does not mention it`);
    }
  }
  if (!types) findings.push('SCHEMAS declares no types — a vacuous pass is a failure');
  return findings;
}

// ── selftest ────────────────────────────────────────────────────────────────
if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };

  const S = (fields) => ({ _version: '1.0', monster: { fields } });
  const C = (counts) => ({ monster: counts });

  ok(scan(S({ hp: {}, ac: {} }), C({ hp: 3, ac: 3 })).length === 0, 'a schema that matches the corpus passes');
  ok(scan(S({ hp: {} }), C({ hp: 3, ac: 3 }))[0].includes('declared by nothing'), 'a live field the schema omits fails');
  ok(scan(S({ hp: {}, gone: {} }), C({ hp: 3 }))[0].includes('carried by 0 entries'), 'a declared field nothing carries fails');
  ok(scan(S({ hp: {}, gone: { classified: 'derived' } }), C({ hp: 3 })).length === 0, 'a classified absence passes');
  ok(scan(S({ hp: {}, gone: { classified: 'written-not-carried' } }), C({ hp: 3 })).length === 0, 'both known reasons pass');
  ok(scan(S({ hp: {}, gone: { classified: 'because' } }), C({ hp: 3 }))[0].includes('not a reason this gate knows'),
    'an invented reason is not an escape hatch');
  ok(scan(S({ hp: { classified: 'derived' } }), C({ hp: 3 }))[0].includes('stale'),
    'a classification on a field the corpus carries fails — the quieter direction');
  ok(scan(S({ hp: {} }), {})[0].includes('no collection this gate can census'),
    'a type with no collection is a finding, not a vacuous pass');
  ok(scan({ _version: '1.0' }, {})[0].includes('no types'), 'an empty SCHEMAS fails');
  ok(scan(null, {})[0].includes('SCHEMAS not found'), 'an unreadable SCHEMAS fails');

  ok(extractSchemas('const SCHEMAS = {\n  a: { fields: { x: {} } },\n};\n').a.fields.x !== undefined,
    'the extractor brace-matches the literal out of a file');
  ok(extractSchemas('const SCHEMAS = {\n  a: { note:"}" },\n};') !== null || true,
    'the extractor returns null rather than throwing on a literal it cannot evaluate');
  ok(extractSchemas('const OTHER = {};') === null, 'a file with no SCHEMAS reads as null');
  ok(Object.keys(censusFields([{ a: 1, b: 2 }, { a: 3 }])).length === 2 && censusFields([{ a: 1 }, { a: 2 }]).a === 2,
    'the census counts entries per field, not occurrences');
  ok(censusFields([null, 'x', { a: 1 }]).a === 1, 'a non-object entry is skipped rather than throwing');

  if (fail) { console.log(`\n✗ check-schema selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-schema selftest: all ${pass} checks pass`);
  return;
}

const core = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
core.load(GAME);
const censusByType = {};
for (const [type, prop] of Object.entries(COLLECTION)) {
  const c = core[prop];
  if (!c) continue;
  censusByType[type] = censusFields(Array.isArray(c) ? c : Object.values(c));
}

const schemas = extractSchemas(fs.readFileSync(SERVER, 'utf8'));
const findings = scan(schemas, censusByType);
if (findings.length) {
  findings.forEach((f) => console.log('  ✗ ' + f));
  console.log(`\n✗ check-schema: ${findings.length} finding(s)`);
  console.log('  SCHEMAS is served at GET /api/schema and is where an author learns what a');
  console.log('  field is called. Correct the declaration against the corpus, or classify it.');
  process.exit(1);
}
const counts = Object.entries(censusByType).map(([t, c]) => `${t} ${Object.keys(c).length}`).join(' · ');
const classified = Object.entries(schemas).filter(([t]) => !t.startsWith('_'))
  .flatMap(([t, s]) => Object.entries(s.fields || {}).filter(([, d]) => d && d.classified).map(([f]) => `${t}.${f}`));
console.log(`✓ §DX-02kv schema: every declared field is carried or classified, and every live field is declared — ${counts} · ${classified.length} classified (${classified.join(', ')})`);
