#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02gv — walks `battle.key` and the monster pools against each other, in BOTH
// directions. Direction 1 (a battle naming no monster) is §DX-02fy: the opponent load
// at `storyCommitBattle` is guarded and the battle is not, so a missed key silently
// refights the previous monster. Direction 2 (a monster no battle names) is §DX-02gv:
// a fully statted deadly-tier entry with a priced drop that nothing can reach.
//
// Direction 2 walks `deadly` ONLY, and that is deliberate (§DX-02gx). `deadly` means
// SET-PIECE: a 187+ HP statblock is authored for one fight, so nothing naming it is a
// defect. The other tiers are a BESTIARY — `monsters.md` catalogues them by category as
// a library, and a library is allowed to outrun the map, so an unplaced entry there is
// the normal state, not a finding. The gate does not walk them and does not imply it
// has. `--census` prints the reachability of every tier when you want the number.
// Read-only: never writes the game file.
// Run: node scripts/check-battlepools.js [--selftest] [--census]

'use strict';
const fs = require('fs');
const path = require('path');
const GAME = path.join(__dirname, '..', '..', 'play.html');

// A deadly monster is REACHABLE when a node battle names it, an encounter pool lists it
// (`P.<key>` inside a `WORLD_DB` terrain row), a node's `bossKey` selects it, or engine code mentions
// the key anywhere outside its own MONSTER_POOL row and MONSTER_DROPS row.
// Entries here are known-unreachable and owned by an open row; an entry that becomes
// reachable is a stale exemption and fails, the same rule as SYNTHETIC_BATTLE_CODES.
const UNREACHABLE_DEADLY = {
  dragon_of_fyresdal: '§DX-02gw',
  slyzard_matriarch: '§DX-02gw',
};

// A battle key with no monster behind it. `_bruhns` is by design — the final battle is
// loaded through the `_isFinalBoss` leg of `storyCommitBattle`, which reads
// BOSS_COMMANDER_AUROS and never consults the key. The rest are owned by an open row.
const UNRESOLVED_BATTLE_KEYS = {
  _bruhns: 'by design — the _isFinalBoss leg loads BOSS_COMMANDER_AUROS, not the key',
};

// Pool rows are single-quoted by hand and double-quoted by `./bin/api post monster`; read both.
// One index, read by both the gate and `--census`, so the census can never drift from the
// rule the gate enforces.
function indexSource(src) {
  const poolKeys = new Set();
  const tiers = new Map();
  for (const m of src.matchAll(/^ {2}(\w+):\s*\{\s*key:["'](\w+)["'],[^}]*?tier:["'](\w+)["']/gm)) {
    poolKeys.add(m[2]);
    tiers.set(m[2], m[3]);
  }
  for (const m of src.matchAll(/^ {2}(\w+):\s*\{\s*key:["'](\w+)["']/gm)) poolKeys.add(m[2]);

  const battleKeys = new Map();
  for (const m of src.matchAll(/battle\s*:\s*\{[^}]*?["']?key["']?\s*:\s*["'](\w+)["']/g)) {
    if (!battleKeys.has(m[1])) battleKeys.set(m[1], src.slice(0, m.index).split('\n').length);
  }

  const poolMembers = new Set([...src.matchAll(/P\.(\w+)/g)].map(m => m[1]));
  const bossKeys = new Set([...src.matchAll(/bossKey\s*:\s*["'](\w+)["']/g)].map(m => m[1]));
  return { poolKeys, tiers, battleKeys, poolMembers, bossKeys };
}

// Its own two table rows are the definition, not a reference — hence `> 3`.
function isReachable(src, idx, key) {
  const mentions = (src.match(new RegExp('\\b' + key + '\\b', 'g')) || []).length;
  return idx.battleKeys.has(key) || idx.poolMembers.has(key) || idx.bossKeys.has(key) || mentions > 3;
}

function scan(src) {
  const findings = [];
  const idx = indexSource(src);
  const { poolKeys, tiers, battleKeys } = idx;

  // ── Direction 1: every battle key resolves in a pool ──────────────────────
  for (const [key, line] of battleKeys) {
    const resolves = poolKeys.has(key);
    const owned = UNRESOLVED_BATTLE_KEYS[key];
    if (!resolves && !owned) {
      findings.push(`[battlekey] battle key '${key}' at line ${line} resolves in neither MONSTER_POOL nor EPIC_BOSS_POOL — the opponent load is guarded, so this battle refights the previous monster`);
    }
    if (resolves && owned) {
      findings.push(`[battlekey] '${key}' is exempted as unresolved (${owned}) but now resolves in a pool — retire the exemption`);
    }
  }
  for (const key of Object.keys(UNRESOLVED_BATTLE_KEYS)) {
    if (!battleKeys.has(key)) {
      findings.push(`[battlekey] '${key}' is exempted as an unresolved battle key (${UNRESOLVED_BATTLE_KEYS[key]}) but no battle names it — retire the exemption`);
    }
  }

  // ── Direction 2: every deadly (= set-piece) monster is reachable ──────────
  // Other tiers are a bestiary and are NOT walked — see the header, and `--census`.
  for (const [key, tier] of tiers) {
    if (tier !== 'deadly') continue;
    const reachable = isReachable(src, idx, key);
    const owned = UNREACHABLE_DEADLY[key];
    if (!reachable && !owned) {
      findings.push(`[deadly] deadly-tier monster '${key}' is named by no battle, no encounter pool and no bossKey — it is statted, priced and unfightable`);
    }
    if (reachable && owned) {
      findings.push(`[deadly] '${key}' is exempted as unreachable (${owned}) but is now reachable — retire the exemption`);
    }
  }
  for (const key of Object.keys(UNREACHABLE_DEADLY)) {
    if (!tiers.has(key)) {
      findings.push(`[deadly] '${key}' is exempted as an unreachable deadly monster (${UNREACHABLE_DEADLY[key]}) but is not a deadly-tier pool entry — retire the exemption`);
    }
  }

  return findings;
}

// Two kinds of exemption, and they are different promises: a row-owned one names the
// open row that will retire it (`§…`), a by-design one never retires.
function exemptionSummary() {
  const values = [...Object.values(UNREACHABLE_DEADLY), ...Object.values(UNRESOLVED_BATTLE_KEYS)];
  const owned = values.filter(v => /^§/.test(v)).length;
  const design = values.length - owned;
  const parts = [];
  if (owned) parts.push(`${owned} exemption${owned === 1 ? '' : 's'} owned by an open row`);
  if (design) parts.push(`${design} by design`);
  return parts.length ? ` (${parts.join(' · ')})` : '';
}

// The number direction 2 deliberately does not assert. Prints every tier so the bestiary's
// unplaced entries are one command away instead of a figure in a doc that rots (§DX-02gx).
function census(src) {
  const idx = indexSource(src);
  const rows = new Map();
  for (const [key, tier] of idx.tiers) {
    if (!rows.has(tier)) rows.set(tier, { total: 0, unreachable: [] });
    const r = rows.get(tier);
    r.total++;
    if (!isReachable(src, idx, key)) r.unreachable.push(key);
  }
  return rows;
}

if (process.argv.includes('--selftest')) {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
  const base = [
    "const MONSTER_POOL = {",
    "  void_walker:  { key:'void_walker',  name:'Void Walker',  ac:15, hp:97, tier:'hard' },",
    "  reachable_x:  { key:'reachable_x',  name:'Reachable',    ac:20, hp:210, tier:'deadly' },",
    "};",
    "const T = { pit: { monsters:[ P.reachable_x ] } };",
  ].join('\n');
  const real = f => !f.includes('retire the exemption');   // the synthetic source has none of them
  ok(scan(base + "\n  X:{ battle:{label:'L', key:'void_walker', count:1} },").filter(real).length === 0,
    'clean source produces no findings');
  ok(scan(base + "\n  X:{ battle:{label:'L', key:'no_such_thing', count:1} },")
    .some(f => f.startsWith('[battlekey]')), 'a battle key with no monster is caught');
  const orphan = base.replace("  reachable_x:", "  orphan_x:").replace("key:'reachable_x'", "key:'orphan_x'")
    .replace('P.reachable_x', 'P.void_walker');
  ok(scan(orphan).some(f => f.startsWith('[deadly]')), 'a deadly monster no battle or pool names is caught');
  ok(scan(base).filter(f => f.includes('retire the exemption')).length === Object.keys(UNREACHABLE_DEADLY).length + Object.keys(UNRESOLVED_BATTLE_KEYS).length,
    'every exemption absent from the source is reported stale');
  const apiWritten = [
    "const MONSTER_POOL = {",
    '  api_mob: { key:"api_mob", name:"API Mob", ac:13, hp:72, tier:"medium" },',
    "};",
  ].join('\n');
  ok(scan(apiWritten + "\n  X:{ battle:{label:'L', key:'api_mob', count:1} },")
    .filter(real).length === 0, 'a double-quoted (API-written) pool row resolves a battle key');
  const censusBase = [
    "const MONSTER_POOL = {",
    "  t_mob:  { key:'t_mob',  name:'T', ac:10, hp:5,   tier:'trivial' },",
    "  h_mob:  { key:'h_mob',  name:'H', ac:15, hp:97,  tier:'hard' },",
    "  d_seen: { key:'d_seen', name:'D', ac:20, hp:210, tier:'deadly' },",
    "};",
    "const T = { pit: { monsters:[ P.d_seen ] } };",
  ].join('\n');
  const c = census(censusBase);
  ok([...c.keys()].sort().join(',') === 'deadly,hard,trivial'
    && c.get('deadly').unreachable.length === 0 && c.get('hard').unreachable.length === 1
    && c.get('trivial').unreachable.length === 1 && c.get('hard').total === 1,
    'the census covers EVERY tier, not just the one direction 2 walks');
  ok(scan(censusBase).filter(real).some(f => f.startsWith('[deadly]')) === false,
    'a census-visible unreachable at a non-deadly tier is NOT a gate failure');

  const summary = exemptionSummary();
  const owned = [...Object.values(UNREACHABLE_DEADLY), ...Object.values(UNRESOLVED_BATTLE_KEYS)]
    .filter(v => /^§/.test(v)).length;
  const design = Object.keys(UNREACHABLE_DEADLY).length + Object.keys(UNRESOLVED_BATTLE_KEYS).length - owned;
  ok(!design || /\d+ by design/.test(summary),
    'a by-design exemption is not counted as owned by an open row');
  ok(!owned || summary.includes(`${owned} exemption${owned === 1 ? '' : 's'} owned by an open row`),
    'row-owned exemptions are counted separately and named as such');
  if (fail) { console.log(`\n✗ check-battlepools selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-battlepools selftest: all ${pass} checks pass`);
  process.exit(0);
}

if (process.argv.includes('--census')) {
  const rows = census(fs.readFileSync(GAME, 'utf8'));
  const order = ['trivial', 'easy', 'medium', 'hard', 'deadly'];
  const tiers = [...rows.keys()].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  let total = 0, unreachable = 0;
  console.log('MONSTER_POOL reachability by tier — a battle key, a `P.<key>` pool membership,');
  console.log('a node bossKey, or any mention beyond its own pool + drop rows.\n');
  console.log('  tier      unreachable / total');
  for (const t of tiers) {
    const r = rows.get(t);
    total += r.total; unreachable += r.unreachable.length;
    console.log(`  ${t.padEnd(9)} ${String(r.unreachable.length).padStart(5)} / ${String(r.total).padEnd(4)}`
      + (r.unreachable.length ? '  ' + r.unreachable.slice(0, 6).join(', ')
         + (r.unreachable.length > 6 ? `, … +${r.unreachable.length - 6}` : '') : ''));
  }
  console.log(`\n  ${unreachable} of ${total} unreachable.`);
  console.log('  Only `deadly` is a gate failure — the rest are a bestiary (see the header comment).');
  process.exit(0);
}

const findings = scan(fs.readFileSync(GAME, 'utf8'));
if (findings.length) {
  findings.forEach(f => console.log('  ✗ ' + f));
  console.log(`\n✗ check-battlepools: ${findings.length} finding(s)`);
  process.exit(1);
}
console.log('✓ §DX-02gv battle pools: every battle key resolves, every deadly monster is reachable'
  + exemptionSummary());
