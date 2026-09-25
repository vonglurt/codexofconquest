#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ig — a button that writes a quest's completion flag must not pay when the quest
// pays too.
//
// The §SPARK-01-FU / §LXX-01-FU / §DX-02ai class: a storyRender / NODE_HOOKS / NODE_VERBS
// block sets `S_story.<flag> = true` and credits XP or gold inline, and a quest whose
// `completion.flags` names that flag also pays on completion. The player is paid twice
// and usually told once. It was found by hand three times; this scans for it.
//
// Button side: every `S_story.<flag> = true` outside QUEST_DB and QUEST:CORE, with the
// innermost `{…}` block that holds it — the click handler, the `if (pb.nodeCode …)` arm.
// A function-sized unit pairs a flag with unrelated battle XP further down; the block is
// the unit an author writes a button in. It pays if it credits `S_story.xp|gold` upward
// (`+=`, or `= (S_story.x||0) + …`); a debit is a price, not a payment.
// Quest side: a `{kind:'reward'}` bit with xp or gold anywhere in bits/onComplete, or
// `xpAward` on a side quest (the engine's one reader). A bare numeric `reward` is NOT a
// payment — the engine documents it as display-only, with no consumer.
//
// Run: node scripts/check-doublepay.js [--selftest]
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const WBAPI = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));

// Each surviving double payment, named with the row that owns its repair.
const KNOWN_DOUBLE_PAY = {
  'pipMet→quest_spark_02': '§DX-02lh',
};

// Comments and string/template bodies blanked to spaces, so braces and patterns see code.
function mask(src) {
  let o = '', i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') { o += ' '; i++; } continue; }
    if (c === '/' && d === '*') { while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { o += src[i] === '\n' ? '\n' : ' '; i++; } o += '  '; i += 2; continue; }
    if (c === "'" || c === '"' || c === '`') {
      const q = c; o += q; i++;
      while (i < n && src[i] !== q) { if (src[i] === '\\') { o += '  '; i += 2; continue; } o += src[i] === '\n' ? '\n' : ' '; i++; }
      o += q; i++; continue;
    }
    o += c; i++;
  }
  return o;
}

const PAY = /S_story\.(xp|gold)\s*(?:\+=|=\s*\(\s*S_story\.\1\s*\|\|\s*0\s*\)\s*\+)/;

function questPays(q) {
  const walk = bits => (bits || []).some(b => b && (
    (b.kind === 'reward' && (b.xp || b.gold)) || walk(b.onPass) || walk(b.onFail) || (b.options || []).some(o => walk(o && o.bits))));
  return walk(q.bits) || walk(Array.isArray(q.onComplete) ? q.onComplete : []) || (q.type === 'side' && q.xpAward > 0);
}

function scan(html, questDb) {
  const m = mask(html);
  const excluded = [['// ◆◆◆ WORLDBUILDER:QUEST_DB:START', '// ◆◆◆ WORLDBUILDER:QUEST_DB:END'], ['// ◆◆◆ QUEST:CORE:START', '// ◆◆◆ QUEST:CORE:END']]
    .map(([a, b]) => [html.indexOf(a), html.indexOf(b)]).filter(([a, b]) => a >= 0 && b > a);
  const blocks = [];
  { const st = []; for (let i = 0; i < m.length; i++) { if (m[i] === '{') st.push(i); else if (m[i] === '}' && st.length) blocks.push([st.pop(), i]); } }
  const completesOn = {};
  for (const [id, q] of Object.entries(questDb)) for (const f of ((q.completion || {}).flags || [])) (completesOn[f] = completesOn[f] || []).push(id);
  const pairs = [];
  const re = /S_story\.([A-Za-z_]\w*)\s*=\s*true\b/g;
  let x;
  while ((x = re.exec(m))) {
    if (excluded.some(([a, b]) => x.index > a && x.index < b)) continue;
    const flag = x[1];
    if (!completesOn[flag]) continue;
    let inner = null;
    for (const bl of blocks) if (bl[0] < x.index && x.index < bl[1] && (!inner || bl[1] - bl[0] < inner[1] - inner[0])) inner = bl;
    const buttonPays = !!inner && PAY.test(m.slice(inner[0], inner[1]));
    const line = html.slice(0, x.index).split('\n').length;
    for (const id of completesOn[flag]) pairs.push({ key: `${flag}→${id}`, flag, id, line, buttonPays, questPays: questPays(questDb[id]) });
  }
  return pairs;
}

function verdict(pairs) {
  const both = pairs.filter(p => p.buttonPays && p.questPays);
  const findings = both.filter(p => !KNOWN_DOUBLE_PAY[p.key]).map(p =>
    `line ${p.line}: the block that sets S_story.${p.flag} credits XP/gold, and ${p.id} completes on ${p.flag} and pays too — the player is paid twice`);
  for (const k of Object.keys(KNOWN_DOUBLE_PAY)) if (!both.some(p => p.key === k)) findings.push(`[stale-known] ${k} (${KNOWN_DOUBLE_PAY[k]}) no longer pays twice — drop it from KNOWN_DOUBLE_PAY`);
  return { both, findings };
}

WBAPI.load(path.join(ROOT, 'play.html'));
const HTML = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8');

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', msg); } };
  const db = {
    q_pay:   { type: 'side', completion: { flags: ['a'] }, onComplete: [{ kind: 'reward', xp: 100 }] },
    q_free:  { type: 'side', completion: { flags: ['b'] }, onComplete: [{ kind: 'narrative', msg: 'm' }] },
    q_disp:  { type: 'side', completion: { flags: ['c'] }, reward: 600 },
    q_award: { type: 'side', completion: { flags: ['d'] }, xpAward: 50 },
  };
  const src = [
    "btn.addEventListener('click', () => { S_story.a = true; S_story.xp = (S_story.xp||0) + 100; });",
    "btn.addEventListener('click', () => { S_story.b = true; S_story.gold += 40; });",
    "btn.addEventListener('click', () => { S_story.c = true; S_story.gold += 600; });",
    "function big() { if (x) { S_story.d = true; } S_story.xp += 999; }",
    "btn.addEventListener('click', () => { S_story.a = true; S_story.gold -= 200; });",
    "// S_story.a = true; S_story.xp += 1;",
  ].join('\n');
  const p = scan(src, db);
  const both = p.filter(q => q.buttonPays && q.questPays).map(q => q.key + '@' + q.line);
  ok(both.length === 1 && both[0] === 'a→q_pay@1', `a button and a reward bit on one flag is the double pay (${both})`);
  ok(p.some(q => q.key === 'b→q_free' && q.buttonPays && !q.questPays), 'a button paying for a quest that does not is clean');
  ok(p.some(q => q.key === 'c→q_disp' && !q.questPays), 'a bare numeric reward is display-only, not a payment');
  ok(p.some(q => q.key === 'd→q_award' && !q.buttonPays), 'a credit outside the innermost block of the write is not the button paying');
  ok(p.some(q => q.line === 5 && !q.buttonPays), 'a debit is a price, not a payment');
  ok(!p.some(q => q.line === 6), 'a commented-out write is not a write');
  ok(verdict(scan(HTML, WBAPI.questDb)).findings.length === 0, 'the live file carries no unowned double pay');
  if (fail) { console.log(`\n✗ check-doublepay selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-doublepay selftest: all ${pass} checks pass`);
  return;
}

const pairs = scan(HTML, WBAPI.questDb);
const { both, findings } = verdict(pairs);
if (findings.length) {
  console.error(`✗ check:doublepay — ${findings.length} finding(s):\n`);
  findings.forEach(f => console.error('  ' + f));
  console.error('\n  Pay on one side only: delete the inline credit and let the quest pay (§DX-02ai), or');
  console.error('  name the pair in KNOWN_DOUBLE_PAY with the row that owns its repair.');
  process.exit(1);
}
console.log(`✓ check:doublepay — ${pairs.length} button→quest pairs on a completion flag; `
  + `${pairs.filter(p => p.buttonPays).length} pay at the button, ${pairs.filter(p => p.questPays).length} at the quest, `
  + `${both.length} at both, all named in KNOWN_DOUBLE_PAY`);
