#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
// §WBAPI-01 ph3 — full structured-field PATCH guard.
// Verifies WBAPI.editStructuredField serializes array/object/number values to
// codebase-style JS literals, patches _rawSrc at SOURCE level (so they survive
// save()), round-trips through a reload, inserts absent fields, rejects live
// function values, and refuses a write that would delete a comment from the
// entry unless the caller accepts the loss. Pure: loads play.html read-only into a
// detached WBAPI instance and round-trips via load(text) — never writes the file.
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
const QSEC = () => WBAPI._parse.extrSection(WBAPI._rawSrc, 'QUEST_DB');
const commentsOn = (sec, id) => Object.values(WBAPI._parse.fieldsWithComments(sec, id)).reduce((a, b) => a + b, 0);
const fnPath = (() => {
  const sec = QSEC();
  for (const id of Object.keys(q)) for (const f of ['bits','onComplete','onPass','onFail'])
    if (Array.isArray(q[id][f]) && q[id][f].some(b => b && b.kind === '_legacy_fn')
        && !commentsOn(sec, id)) return { id, f };
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

// [4e] §DX-02ix — a comment inside a field's value is deleted by the same whole-literal
// replacement that carries the closures, and JSON has no term to carry one back, so there
// is no escape to offer: the write is refused unless the caller accepts the loss. The
// corpus half is a PROPERTY, not a pinned count — every comment-bearing field in QUEST_DB
// must refuse a verbatim rewrite, so the assertion cannot rot as the corpus is edited.
WBAPI.load(GAME);
const beforeSweep = WBAPI._rawSrc;
const census = (() => {
  const sec = QSEC(); const out = [];
  for (const id of Object.keys(q)) {
    const m = WBAPI._parse.fieldsWithComments(sec, id);
    for (const f of Object.keys(m)) if (q[id][f] && typeof q[id][f] === 'object') out.push({ id, f, n: m[f] });
  }
  return out;
})();
ok(census.length > 0, 'QUEST_DB carries at least one comment inside a structured field value');
let unrefused = null, unnamed = null;
for (const c of census) {
  const e = WBAPI.entryWithFns('quest', c.id);
  if (!e.ok) { unrefused = `${c.id}.${c.f} (entryWithFns: ${e.error})`; break; }
  const rr = WBAPI.editStructuredField('quest', c.id, c.f, e.entry[c.f]);
  if (rr.ok) { unrefused = `${c.id}.${c.f}`; break; }
  if (!/comment\(s\)/.test(rr.error || '')) { unnamed = `${c.id}.${c.f} — ${rr.error}`; break; }
}
ok(unrefused === null, `every comment-bearing field refuses a verbatim rewrite (${census.length} fields, ${census.reduce((a, c) => a + c.n, 0)} comments): ` + (unrefused || ''));
ok(unnamed === null, 'and the refusal says it is comments it would delete: ' + (unnamed || ''));
ok(WBAPI._rawSrc === beforeSweep, 'no refused write touched the source');

const cm = census[0];
const cmEntry = WBAPI.entryWithFns('quest', cm.id);
const cmBefore = commentsOn(QSEC(), cm.id);
r = WBAPI.editStructuredField('quest', cm.id, cm.f, cmEntry.entry[cm.f], { dropComments:true });
ok(r.ok && r.droppedComments === cm.n, `the acknowledged write reports the comments it deleted (${cm.id}.${cm.f}): ` + (r.error || `reported ${r.droppedComments}, expected ${cm.n}`));
ok(commentsOn(QSEC(), cm.id) === cmBefore - cm.n, 'and deletes exactly those, no more');
ok(legacyBits(WBAPI._rawSrc) === legacyBits(beforeSweep), 'the acknowledged write still keeps every closure');

// [4f] §AUDIT-03av — the substitution path, which exists because [4e] leaves only one
// escape and it is destructive. A comment-bearing structured field is the fixture: the
// phrase must move, every comment must stay, and the entry must round-trip from source.
WBAPI.load(GAME);
const subFix = (() => {
  const sec = QSEC();
  for (const c of census) {
    const v = JSON.stringify(q[c.id][c.f] || '');
    const m = /"([A-Za-z][A-Za-z ]{11,40})"/.exec(v.replace(/\\[nu]/g, ' '));
    if (m && (QSEC().match(new RegExp(m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length >= 1) return { ...c, phrase: m[1] };
  }
  return null;
})();
ok(!!subFix, 'a comment-bearing structured field carries a substitutable phrase');
if (subFix) {
  const cBefore = commentsOn(QSEC(), subFix.id);
  const fnBefore = legacyBits(WBAPI._rawSrc);
  r = WBAPI.substituteText('quest', subFix.id, subFix.phrase, 'SUBSTITUTED PHRASE');
  ok(r.ok && r.count >= 1, `substitution succeeds where the field write is refused (${subFix.id}.${subFix.f}): ` + (r.error || ''));
  ok(commentsOn(QSEC(), subFix.id) === cBefore, 'and every comment in the entry survives it');
  ok(legacyBits(WBAPI._rawSrc) === fnBefore, 'and every closure survives it');
  const patched = WBAPI._rawSrc;
  WBAPI.load(patched);
  ok(JSON.stringify(WBAPI.questDb[subFix.id]).includes('SUBSTITUTED PHRASE'), 'the substitution round-trips from source');
  ok(!JSON.stringify(WBAPI.questDb[subFix.id]).includes(subFix.phrase), 'and the old phrase is gone from the entry');
}

// A match that is not authored text refuses the whole write — comments, keys and code are
// out of reach by construction, so a phrase that occurs in both cannot be half-applied.
WBAPI.load(GAME);
const srcBeforeSub = WBAPI._rawSrc;
const cmtFix = (() => {
  const sec = QSEC();
  for (const c of census) {
    const b = WBAPI._parse.findEntryBounds(sec, c.id);
    if (!b) continue;
    const m = /\/\/[ \t]*([A-Za-z][A-Za-z ]{9,30})/.exec(sec.slice(b.openEnd, b.bodyEnd));
    if (m) return { id: c.id, phrase: m[1].trim() };
  }
  return null;
})();
ok(!!cmtFix, 'a comment-only phrase exists to prove the refusal');
if (cmtFix) {
  r = WBAPI.substituteText('quest', cmtFix.id, cmtFix.phrase, 'X');
  ok(!r.ok && /outside a string value/.test(r.error || ''), 'a comment-only match refuses, naming why: ' + (r.error || 'it was ACCEPTED'));
}
r = WBAPI.substituteText('quest', Object.keys(q)[0], 'a phrase this corpus does not hold', 'X');
ok(!r.ok, 'an absent phrase is a reported failure, never a silent no-op');
r = WBAPI.substituteText('quest', subFix ? subFix.id : Object.keys(q)[0], subFix ? subFix.phrase : 'x', 'a back\\slash');
ok(!r.ok && /escaping/.test(r.error || ''), 'a replacement needing an escape is refused rather than written half-quoted: ' + (r.error || 'it was ACCEPTED'));
ok(WBAPI._rawSrc === srcBeforeSub, 'no refused substitution touched the source');

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
console.log(`✓ §WBAPI-01 ph3 structured-field PATCH: all ${pass} checks pass (array/object/number round-trip + insert + fn-reject + {__fn:…} closure round-trip + drop refusal + comment-loss refusal across the corpus + substitution round-trip and its three refusals + expression-field removal)`);
