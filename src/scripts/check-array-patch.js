#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
// §WBAPI-01 ph3 — full structured-field PATCH guard.
// Verifies WBAPI.editStructuredField serializes array/object/number values to
// codebase-style JS literals, patches _rawSrc at SOURCE level (so they survive
// save()), round-trips through a reload, inserts absent fields, and rejects
// function values. Pure: loads play.html read-only into a detached WBAPI
// instance and round-trips via load(text) — never writes the file.
// Lab report: lab-reports/lab-report-wbapi01-ph3-array-patch.md

const path = require('path');
const WBAPI = require(path.join(__dirname, '..', 'js', 'wbapi-core'));
const GAME = path.join(__dirname, '..', '..', 'play.html');

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

// [4] a LIVE function value is rejected — it cannot be serialized, only escaped
r = WBAPI.editStructuredField('quest', qTM1, 'completeFn', function () { return true; });
ok(!r.ok, 'live function value rejected');
ok(/__fn/.test(r.error || ''), 'the rejection names the escape that would work');

// [4b] §DX-02iv — the closure round trip. A field holding a `_legacy_fn` body is read
// with markers, written back, and RE-READ FROM DISK: the closure must survive
// byte-identically and still parse as a function.
WBAPI.load(GAME);
const fnPath = (() => {
  for (const id of Object.keys(q)) for (const f of ['bits','onComplete','onPass','onFail'])
    if (Array.isArray(q[id][f]) && q[id][f].some(b => b && b.kind === '_legacy_fn')) return { id, f };
  return null;
})();
ok(!!fnPath, 'a quest carrying a _legacy_fn bit exists to exercise the round trip');
const marked = WBAPI.entryWithFns('quest', fnPath.id);
ok(marked.ok && marked.fnCount > 0, 'entryWithFns returns the entry with function markers: ' + (marked.error || ''));
const bit = marked.entry[fnPath.f].find(b => b && b.kind === '_legacy_fn');
ok(bit && bit.fn && typeof bit.fn.__fn === 'string' && /=>|function/.test(bit.fn.__fn),
   'the _legacy_fn body arrives as {__fn:<source>} rather than null');

const legacyBits = src => (src.match(/kind:\s*['"]_legacy_fn['"]/g) || []).length;
const bitsBefore = legacyBits(WBAPI._rawSrc);
r = WBAPI.editStructuredField('quest', fnPath.id, fnPath.f, marked.entry[fnPath.f]);
ok(r.ok, 'a bits array carrying {__fn:…} writes: ' + (r.error || ''));
ok(legacyBits(WBAPI._rawSrc) === bitsBefore, 'no _legacy_fn bit is lost by the write');
const patchedSrc = WBAPI._rawSrc;
WBAPI.load(patchedSrc);
const back = WBAPI.entryWithFns('quest', fnPath.id);
const bitBack = back.ok && back.entry[fnPath.f].find(b => b && b.kind === '_legacy_fn');
ok(bitBack && bitBack.fn.__fn === bit.fn.__fn, 'the closure survives the reload byte-identically');
ok((() => { try { return typeof new Function('return (' + bitBack.fn.__fn + ')')() === 'function'; }
            catch (e) { return false; } })(), 'the reloaded closure still parses as a function');

// [4c] a caller who reads the field the ordinary way holds `fn:null`; writing that back
// is a refusal, not an ok:true that leaves a `_legacy_fn` bit running nothing.
WBAPI.load(GAME);
r = WBAPI.editStructuredField('quest', fnPath.id, fnPath.f, JSON.parse(JSON.stringify(q[fnPath.id][fnPath.f])));
ok(!r.ok, 'writing a function-bearing field back without the escape is refused');
ok(/function value/.test(r.error || ''), 'the refusal counts the closures it would have dropped');
ok(legacyBits(WBAPI._rawSrc) === bitsBefore, 'the refused write left the source alone');

// [4d] the escape is checked, not trusted: text that is not a function expression fails
r = WBAPI.editStructuredField('quest', fnPath.id, fnPath.f, [{ kind:'_legacy_fn', fn:{ __fn:'(1+1)' } }]);
ok(!r.ok && /not a function expression/.test(r.error || ''), 'a non-function {__fn:…} is rejected');
r = WBAPI.editStructuredField('quest', fnPath.id, fnPath.f, [{ kind:'_legacy_fn', fn:{ __fn:'S => { syntax(' } }]);
ok(!r.ok, 'an unparseable {__fn:…} is rejected');

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

// [7] §DX-02dy — REMOVAL of an expression-valued field, the half of the null-clear
// path removeStringField does not cover: it matches quoted values and bare scalars,
// removeExprField scans a balanced, quote-aware expression.
WBAPI.load(GAME);
// The fixture is selected by asking the source what it holds. A parsed marker naming
// the same class is a migration front and can empty out; a field whose value IS an
// arrow function is what this check needs, and it can only be seen before the strip.
const qCond = Object.keys(WBAPI.questDb).find(id => {
  const e = WBAPI.entryWithFns('quest', id);
  return e.ok && e.entry.activateCond && typeof e.entry.activateCond.__fn === 'string';
});
ok(!!qCond, 'a quest carrying an arrow-function activateCond exists to exercise removal');
const srcHadCond = new RegExp(`${qCond}:[\\s\\S]{0,4000}?activateCond:`).test(WBAPI._rawSrc);
ok(srcHadCond, 'the fixture quest carries activateCond in source');
const siblingsBefore = JSON.stringify({ ...WBAPI.questDb[qCond], activateCond:undefined });
r = WBAPI.editField('quest', qCond, 'activateCond', null);
ok(r.ok && r.removed, 'arrow-function field removed: ' + (r.error || ''));
const before = Object.keys(WBAPI.questDb).length;
WBAPI.load(WBAPI._rawSrc);
ok(Object.keys(WBAPI.questDb).length === before, 'section still parses to the same quest count after removal');
ok(!WBAPI.questDb[qCond].activateCond, 'removal round-trips from source');
ok(JSON.stringify({ ...WBAPI.questDb[qCond], activateCond:undefined }) === siblingsBefore,
   'every other field of the entry survives intact around the hole');
// removing an absent field is a reported failure, never a silent no-op (§DX-02gy's class)
WBAPI.load(GAME);
r = WBAPI.editField('quest', qCond, 'noSuchFieldAtAll', null);
ok(!r.ok, 'removing an absent field reports failure');

if (fail) { console.log(`\n✗ check-array-patch: ${fail} FAILED, ${pass} passed`); process.exit(1); }
console.log(`✓ §WBAPI-01 ph3 structured-field PATCH: all ${pass} checks pass (array/object/number round-trip + insert + fn-reject + {__fn:…} closure round-trip + drop refusal + expression-field removal)`);
