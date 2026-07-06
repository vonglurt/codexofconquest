#!/usr/bin/env node
'use strict';
// §WBAPI-01 ph3 — full structured-field PATCH guard.
// Verifies WBAPI.editStructuredField serializes array/object/number values to
// codebase-style JS literals, patches _rawSrc at SOURCE level (so they survive
// save()), round-trips through a reload, inserts absent fields, and rejects
// function values. Pure: loads roll2hit-v3.html read-only into a detached WBAPI
// instance and round-trips via load(text) — never writes the file.
// Lab report: lab-reports/lab-report-wbapi01-ph3-array-patch.md

const path = require('path');
const WBAPI = require(path.join(__dirname, '..', 'wbapi-core'));
const GAME = path.join(__dirname, '..', 'roll2hit-v3.html');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ✗ FAIL:', m); } };

WBAPI.load(GAME);
const q = WBAPI.questDb;
// §ARCH-01 repoint (2026-07-06): this guard originally rode `completeItems` —
// W7d/W8a swept that legacy field from QUEST_DB entirely, so the string-array
// cases now ride `targetMonsterKeys` (two different quests so the edits don't
// collide). The machinery under test is unchanged.
const findQ = (field) => Object.keys(q).filter(id => Array.isArray(q[id][field]) && q[id][field].length);
const [qTM1, qTM2] = findQ('targetMonsterKeys');
const [qKG] = findQ('killGoals');

// [1] edits succeed via the structured path
let r = WBAPI.editStructuredField('quest', qTM1, 'targetMonsterKeys', ['New Item A', "O'Brien's Token", 'multi\nline']);
ok(r.ok && r.strategy === 'editStructuredField', 'string array (escape-heavy) edit: ' + (r.error || ''));
r = WBAPI.editStructuredField('quest', qKG, 'killGoals', [{ key: 'test_mob', need: 7, label: "O'Test" }, { key: 'm2', need: 1, label: 'Two' }]);
ok(r.ok, 'killGoals (object array) edit: ' + (r.error || ''));
r = WBAPI.editStructuredField('quest', qTM2, 'targetMonsterKeys', ['alpha', 'beta']);
ok(r.ok, 'plain string array edit: ' + (r.error || ''));

// [2] _rawSrc patched at source level (single-quoted, escaped, unquoted obj keys)
ok(WBAPI._rawSrc.includes("targetMonsterKeys:['New Item A','O\\'Brien\\'s Token','multi\\nline']"), 'escape-heavy literal in _rawSrc');
ok(WBAPI._rawSrc.includes("killGoals:[{key:'test_mob',need:7,label:'O\\'Test'},{key:'m2',need:1,label:'Two'}]"), 'killGoals literal in _rawSrc');

// [3] round-trip: reload the patched source, re-read parsed values
WBAPI.load(WBAPI._rawSrc);
ok(JSON.stringify(WBAPI.questDb[qTM1].targetMonsterKeys) === JSON.stringify(['New Item A', "O'Brien's Token", 'multi\nline']), 'escape-heavy string array round-trips');
ok(JSON.stringify(WBAPI.questDb[qKG].killGoals) === JSON.stringify([{ key: 'test_mob', need: 7, label: "O'Test" }, { key: 'm2', need: 1, label: 'Two' }]), 'killGoals round-trips');
ok(JSON.stringify(WBAPI.questDb[qTM2].targetMonsterKeys) === JSON.stringify(['alpha', 'beta']), 'plain string array round-trips');

// [4] function-valued field rejected (not §DATA-01 territory)
r = WBAPI.editStructuredField('quest', qTM1, 'completeFn', function () { return true; });
ok(!r.ok, 'function value rejected');

// [5] insert absent array field
WBAPI.load(GAME);
const qNoTM = Object.keys(q).find(id => !q[id].targetMonsterKeys);
r = WBAPI.editStructuredField('quest', qNoTM, 'targetMonsterKeys', ['inserted_key']);
ok(r.ok && r.inserted, 'inserted absent array field');
WBAPI.load(WBAPI._rawSrc);
ok(JSON.stringify(WBAPI.questDb[qNoTM].targetMonsterKeys) === JSON.stringify(['inserted_key']), 'inserted field round-trips');

// [6] number scalar persists via the structured path
WBAPI.load(GAME);
const anyQ = Object.keys(q)[0];
r = WBAPI.editStructuredField('quest', anyQ, 'reward', 999);
ok(r.ok, 'number edit');
WBAPI.load(WBAPI._rawSrc);
ok(WBAPI.questDb[anyQ].reward === 999, 'number round-trips');

if (fail) { console.log(`\n✗ check-array-patch: ${fail} FAILED, ${pass} passed`); process.exit(1); }
console.log(`✓ §WBAPI-01 ph3 structured-field PATCH: all ${pass} checks pass (array/object/number round-trip + insert + fn-reject)`);
