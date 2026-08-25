#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02gv — walks `battle.key` and the monster pools against each other, in BOTH
// directions. Direction 1 (a battle naming no monster) is §DX-02fy: the opponent load
// at `storyCommitBattle` is guarded and the battle is not, so a missed key silently
// refights the previous monster. Direction 2 (a monster no battle names) is §DX-02gv:
// a fully statted deadly-tier entry with a priced drop that nothing can reach.
// Read-only: never writes the game file. Run: node scripts/check-battlepools.js [--selftest]

'use strict';
const fs = require('fs');
const path = require('path');
const GAME = path.join(__dirname, '..', '..', 'play.html');

// A deadly monster is REACHABLE when a node battle names it, an encounter pool lists it
// (`P.<key>` inside TERRAIN_POOLS), a node's `bossKey` selects it, or engine code mentions
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
  desert_wanderer: '§DX-02fy',
};

function scan(src) {
  const findings = [];

  const poolKeys = new Set();
  const tiers = new Map();
  for (const m of src.matchAll(/^ {2}(\w+):\s*\{\s*key:'(\w+)',[^}]*?tier:'(\w+)'/gm)) {
    poolKeys.add(m[2]);
    tiers.set(m[2], m[3]);
  }
  for (const m of src.matchAll(/^ {2}(\w+):\s*\{\s*key:'(\w+)'/gm)) poolKeys.add(m[2]);

  const battleKeys = new Map();
  for (const m of src.matchAll(/battle\s*:\s*\{[^}]*?["']?key["']?\s*:\s*["'](\w+)["']/g)) {
    if (!battleKeys.has(m[1])) battleKeys.set(m[1], src.slice(0, m.index).split('\n').length);
  }

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

  // ── Direction 2: every deadly monster is reachable ────────────────────────
  const poolMembers = new Set([...src.matchAll(/P\.(\w+)/g)].map(m => m[1]));
  const bossKeys = new Set([...src.matchAll(/bossKey\s*:\s*["'](\w+)["']/g)].map(m => m[1]));

  for (const [key, tier] of tiers) {
    if (tier !== 'deadly') continue;
    // Its own two table rows are the definition, not a reference.
    const mentions = (src.match(new RegExp('\\b' + key + '\\b', 'g')) || []).length;
    const reachable = battleKeys.has(key) || poolMembers.has(key) || bossKeys.has(key) || mentions > 3;
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
  if (fail) { console.log(`\n✗ check-battlepools selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
  console.log(`✓ check-battlepools selftest: all ${pass} checks pass`);
  process.exit(0);
}

const findings = scan(fs.readFileSync(GAME, 'utf8'));
if (findings.length) {
  findings.forEach(f => console.log('  ✗ ' + f));
  console.log(`\n✗ check-battlepools: ${findings.length} finding(s)`);
  process.exit(1);
}
console.log('✓ §DX-02gv battle pools: every battle key resolves, every deadly monster is reachable'
  + ` (${Object.keys(UNREACHABLE_DEADLY).length + Object.keys(UNRESOLVED_BATTLE_KEYS).length} exemptions, each owned by an open row)`);
