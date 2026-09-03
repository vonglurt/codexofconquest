#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
// §VM-01-F — gate expression-AST differential. The gate evaluators (canActivate /
// canComplete) were refactored from two straight-line term loops into a compiled
// boolean tree — {all}/{any}/{not} combinators over the same ~14/~11 leaf terms,
// with a bare gate = implicit `all` over its terms. This check proves the refactor
// is semantically faithful by running the REAL kernel (require('./quest')) against
// an INDEPENDENT reference interpreter (re-implemented from the documented term
// semantics, not copied from the kernel) over:
//   (1) a hand-written truth table of AST algebra cases (all/any/not/nested/DeMorgan)
//       — kernel === expected === reference;
//   (2) every leaf term, activation + completion, with a passing + a failing state
//       — proves each extracted term still evaluates correctly;
//   (3) the quest_wm_01 migration — OLD {flagsAny, itemsMinAny} under an OLD reference
//       (with the deleted term) === NEW {any:[flagsAny, itemsAll]} under the kernel,
//       over an inventory/flag matrix (the single-use term is provably superseded).
// The full real-corpus differential over all ~2,850 live QUEST_DB gates runs in the
// browser (tests/integration/uqf-gate-ast.test.js) where QUEST_DB is a global — it
// is not node-requireable without the worldbuilder object pipeline. Design:
// lab-reports/lab-report-vm01f-gate-expression-ast.md.
const path = require('path');
const Q = require(path.join(__dirname, '..', 'js', 'quest.js'));

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error('  ✗ FAIL:', m); } };

// The kernel, evaluating one quest's gate against one state (a fresh runtime per
// call; getState returns the scratch state, getQuest returns the one quest).
function kernel(kind, gateObj, st) {
  const q = kind === 'complete' ? { id: 'q', completion: gateObj } : { id: 'q', gate: gateObj };
  const rt = Q.createQuestRuntime({ getState: () => st, effects: {
    getQuest: () => q,
    rng: () => { throw new Error('gate evaluation must never roll'); },   // §DX-02dw — the kernel requires rng; a gate walk has no business reaching it
  } });
  return kind === 'complete' ? rt.canComplete('q') : rt.canActivate('q');
}

// ── Independent reference interpreter (re-implemented, not copied) ────────────
const pathVal = (st, p) => p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), st);
const asCount = v => (typeof v === 'number') ? v : Array.isArray(v) ? v.length : (v && typeof v === 'object') ? Object.keys(v).length : 0;
const invExact = (st, name) => (st.inventory || []).filter(i => i.name === name).length;

function refActivationLeaf(g, st) {
  const need = [];
  if (g.flags)    need.push(g.flags.every(f => !!st[f]));
  if (g.flagsAny && g.flagsAny.length) need.push(g.flagsAny.some(f => !!st[f]));
  if (g.notFlags) need.push(!g.notFlags.some(f => !!st[f]));
  if (g.flagEquals) need.push(Object.keys(g.flagEquals).every(k => st[k] === g.flagEquals[k]));
  if (g.nodes)    need.push(g.nodes.every(n => !!(st.visited || st.visitedNodes || {})[n]));
  if (g.questsAttempted) need.push(g.questsAttempted.every(id => ((st.quests || {})[id] || '') !== ''));
  if (g.questsDone)      need.push(g.questsDone.every(id => { const s = (st.quests || {})[id]; return s === 'done' || s === 'complete'; }));
  if (g.favorMin) need.push(Object.keys(g.favorMin).every(n => ((st.npcFavorability || {})[n] || 0) >= g.favorMin[n]));
  if (g.battles)  need.push(g.battles.every(b => !!(st.defeatedBattles || {})[b]));
  if (g.notBattles) need.push(!g.notBattles.some(b => !!(st.defeatedBattles || {})[b]));
  if (g.shardsMin != null) need.push((st.shards || 0) >= g.shardsMin);
  if (g.restedAtMin) need.push(Object.keys(g.restedAtMin).every(nd => ((st.shortRestedAtNodes || {})[nd] || 0) >= g.restedAtMin[nd]));
  if (g.sleptAt)  need.push(g.sleptAt.every(nd => !!(st.sleptAtNodes || {})[nd]));
  if (g.flagsPath) need.push(g.flagsPath.every(p => !!pathVal(st, p)));
  if (g.countMin) need.push(g.countMin.every(c => asCount(pathVal(st, c.path)) >= c.min));
  if (g.dayMin != null || g.dayMax != null) { const d = st.day || 1; need.push((g.dayMin == null || d >= g.dayMin) && (g.dayMax == null || d < g.dayMax)); }
  return need.every(Boolean);
}
function refCompletionLeaf(g, st, opts = {}) {
  if (g.flags && !g.flags.every(f => !!st[f])) return false;
  const or = [];
  (g.flagsAny || []).forEach(f => or.push(!!st[f]));
  (g.battles || []).forEach(b => or.push(!!(st.defeatedBattles || {})[b]));
  (g.questsComplete || []).forEach(id => or.push((st.quests || {})[id] === 'complete'));
  (g.items || []).forEach(ci => or.push((st.inventory || []).some(iv => iv.name.includes(ci) || ci.includes(iv.name))));
  if (opts.withItemsMinAny) (g.itemsMinAny || []).forEach(e => or.push(invExact(st, e.name) >= (e.min || 1)));
  if (or.length && !or.some(Boolean)) return false;
  if (g.notFlags && g.notFlags.some(f => !!st[f])) return false;
  if (g.atNode != null && st.currentCode !== g.atNode) return false;
  if (g.flagsPath && !g.flagsPath.every(p => !!pathVal(st, p))) return false;
  if (g.countMin && !g.countMin.every(c => asCount(pathVal(st, c.path)) >= c.min)) return false;
  if (g.itemsAll && !g.itemsAll.every(e => { const nm = (typeof e === 'string') ? e : e.name, mn = (typeof e === 'string') ? 1 : (e.min || 1); return invExact(st, nm) >= mn; })) return false;
  return true;
}
function refEval(node, st, kind, opts) {
  if (node && node.all) return node.all.every(n => refEval(n, st, kind, opts));
  if (node && node.any) return node.any.some(n => refEval(n, st, kind, opts));
  if (node && node.not) return !refEval(node.not, st, kind, opts);
  return kind === 'complete' ? refCompletionLeaf(node, st, opts) : refActivationLeaf(node, st);
}

// ── (1) AST algebra — hand-written truth table, kernel === expected === ref ───
const A = { flags: ['a'] }, B = { flags: ['b'] }, C = { flags: ['c'] };
const S00 = {}, S10 = { a: true }, S01 = { b: true }, S11 = { a: true, b: true }, Sabc = { a: true, b: true, c: true };
const algebra = [
  ['bare = implicit all',          { flags: ['a', 'b'] }, S11, true],
  ['bare = implicit all (miss)',   { flags: ['a', 'b'] }, S10, false],
  ['any true',                     { any: [A, B] }, S10, true],
  ['any false',                    { any: [A, B] }, S00, false],
  ['all true',                     { all: [A, B] }, S11, true],
  ['all false',                    { all: [A, B] }, S10, false],
  ['not true→false',               { not: A }, S10, false],
  ['not false→true',               { not: A }, S00, true],
  ['nested all[any,not]',          { all: [{ any: [A, B] }, { not: C }] }, S10, true],
  ['nested all[any,not] blocked',  { all: [{ any: [A, B] }, { not: C }] }, Sabc, false],
  ['DeMorgan not(any)==all(not)',  { not: { any: [A, B] } }, S00, true],
  ['DeMorgan not(any) false',      { not: { any: [A, B] } }, S01, false],
  ['empty all = vacuous true',     { all: [] }, S00, true],
  ['empty any = vacuous false',    { any: [] }, S00, false],
];
for (const [name, gate, st, exp] of algebra) {
  const k = kernel('activate', gate, st), r = refEval(gate, st, 'activate');
  ok(k === exp && r === exp, `algebra "${name}": kernel=${k} ref=${r} expected=${exp}`);
}

// ── (2) Every leaf term, activation + completion, pass + fail vs the reference ─
const termCases = [
  // [kind, gate, passState, failState]
  ['activate', { flags: ['x'] }, { x: true }, { x: false }],
  ['activate', { flagsAny: ['x', 'y'] }, { y: true }, {}],
  ['activate', { notFlags: ['x'] }, {}, { x: true }],
  ['activate', { flagEquals: { role: 'fight' } }, { role: 'fight' }, { role: 'talk' }],
  ['activate', { nodes: ['LHR'] }, { visited: { LHR: 1 } }, {}],
  ['activate', { questsAttempted: ['q1'] }, { quests: { q1: 'active' } }, { quests: {} }],
  ['activate', { questsDone: ['q1'] }, { quests: { q1: 'done' } }, { quests: { q1: 'active' } }],
  ['activate', { favorMin: { npc: 2 } }, { npcFavorability: { npc: 3 } }, { npcFavorability: { npc: 1 } }],
  ['activate', { battles: ['b1'] }, { defeatedBattles: { b1: true } }, { defeatedBattles: {} }],
  ['activate', { notBattles: ['b1'] }, {}, { defeatedBattles: { b1: true } }],
  ['activate', { shardsMin: 3 }, { shards: 3 }, { shards: 2 }],
  ['activate', { restedAtMin: { LHR: 2 } }, { shortRestedAtNodes: { LHR: 2 } }, { shortRestedAtNodes: { LHR: 1 } }],
  ['activate', { sleptAt: ['LHR'] }, { sleptAtNodes: { LHR: true } }, {}],
  ['activate', { flagsPath: ['tour.pip'] }, { tour: { pip: true } }, { tour: {} }],
  ['activate', { countMin: [{ path: 'log', min: 2 }] }, { log: [1, 2] }, { log: [1] }],
  ['activate', { dayMin: 21, dayMax: 35 }, { day: 21 }, { day: 35 }],   // §BOARD-01-VOID-GATE — inclusive lo / exclusive hi
  ['activate', { dayMin: 42 }, { day: 42 }, { day: 41 }],               // open-ended upper bound
  ['complete', { flags: ['x'] }, { x: true }, {} ],
  ['complete', { flagsAny: ['x'] }, { x: true }, {}],
  ['complete', { battles: ['b1'] }, { defeatedBattles: { b1: true } }, {}],
  ['complete', { questsComplete: ['q1'] }, { quests: { q1: 'complete' } }, { quests: { q1: 'done' } }],
  ['complete', { items: ['Letter'] }, { inventory: [{ name: 'Sealed Letter' }] }, { inventory: [] }],
  ['complete', { notFlags: ['x'] }, {}, { x: true }],
  ['complete', { atNode: 'NUE' }, { currentCode: 'NUE' }, { currentCode: 'LHR' }],
  ['complete', { flagsPath: ['a.b'] }, { a: { b: true } }, { a: {} }],
  ['complete', { countMin: [{ path: 'wins', min: 3 }] }, { wins: 3 }, { wins: 2 }],
  ['complete', { itemsAll: [{ name: 'Seal', min: 3 }] }, { inventory: [{ name: 'Seal' }, { name: 'Seal' }, { name: 'Seal' }] }, { inventory: [{ name: 'Seal' }, { name: 'Seal' }] }],
];
for (const [kind, gate, passSt, failSt] of termCases) {
  const kp = kernel(kind, gate, passSt), rp = refEval(gate, passSt, kind);
  const kf = kernel(kind, gate, failSt), rf = refEval(gate, failSt, kind);
  ok(kp === true && rp === true, `term ${JSON.stringify(gate)} PASS: kernel=${kp} ref=${rp}`);
  ok(kf === false && rf === false, `term ${JSON.stringify(gate)} FAIL: kernel=${kf} ref=${rf}`);
}

// ── (3) quest_wm_01 migration: OLD (itemsMinAny) === NEW ({any}[itemsAll]) ─────
const OLD = { flagsAny: ['archiveLetterObtained'], itemsMinAny: [{ name: "Scholar Kings' Seal", min: 3 }] };
const NEW = { any: [{ flagsAny: ['archiveLetterObtained'] }, { itemsAll: [{ name: "Scholar Kings' Seal", min: 3 }] }] };
const seals = n => ({ inventory: Array.from({ length: n }, () => ({ name: "Scholar Kings' Seal" })) });
const matrix = [
  { ...seals(0) }, { ...seals(1) }, { ...seals(2) }, { ...seals(3) }, { ...seals(5) },
  { archiveLetterObtained: true, ...seals(0) }, { archiveLetterObtained: true, ...seals(3) },
  { archiveLetterObtained: false, ...seals(2) },
];
for (const st of matrix) {
  const oldVerdict = refEval(OLD, st, 'complete', { withItemsMinAny: true });   // OLD interpreter, deleted term restored
  const newVerdict = kernel('complete', NEW, st);                                // NEW kernel, migrated data
  ok(oldVerdict === newVerdict, `wm_01 migration @ ${JSON.stringify(st.inventory ? st.inventory.length + 'seals' : st)}${st.archiveLetterObtained ? '+letter' : ''}: old=${oldVerdict} new=${newVerdict}`);
}

if (fail) { console.error(`✗ gate-ast parity FAILED: ${fail} of ${pass + fail} assertions`); process.exit(1); }
console.log(`✓ gate-ast parity: ${pass} assertions — AST algebra, ${termCases.length} leaf terms, quest_wm_01 migration all agree with the reference interpreter`);
