#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com
// §AUDIT-03n — every NPC reference in the engine must resolve in the npc vocabulary.
//
// The npc-key mirror of §AUDIT-03j's check:noderegs. Same defect class, other dimension:
// a dozen engine registries are KEYED by npc key, and nothing checked them, so entries
// keyed to a name the favor ledger never writes simply never fire — silently, because a
// lookup that misses just renders nothing.
//
//   NPC_EPILOGUES · NPC_NG_PLUS_GREETINGS · NPC_ACT_THREE_LINES · NPC_CROSS_REFS
//   SWEELINCK_NAMING_LINES · ROUGH_WHISKEY_REACTIONS · FROBERGER_TRACES
//        21 entries keyed to the profiles' SURNAMES — 'couperin' (= quill),
//        'weckmann' (= crov), 'bruhns' (= auros). The ledger spends the profile keys.
//   the epilogue `npcOrder`   named the same three surnames, so the victory screen
//        rendered the STRANGER epilogue for Quill, Weckmann and Bruhns at any favor
//        (its sibling npcOrder at the town-crier site already used the real keys —
//        the two lists disagreeing was the tell).
//   _npcFavor('bruhns')  5 live gate sites — a whole fav-gated CO scene, the
//        Weckmann/Auros joint conversation, the S29 theory line, the Froberger
//        cross-item beat, and the "Show Auros the undercity survey" delivery button
//        for an item the player can actually be carrying.
//
// THE BLIND SPOT THIS GATE IS BUILT TO AVOID (inherited from gate #13). "Flag any table
// where most keys look like npc keys" cannot see a table that is ENTIRELY dead. So
// classification is EXPLICIT: every top-level all-lowercase-keyed object literal must be
// listed in NPC_KEYED, VOCAB_SOURCE, or NOT_NPC_KEYED with a reason, and an unlisted one
// FAILS. A new registry cannot slip in dead, and an old one cannot decay into invisibility.
//
// Phases:
//   1. registries     — every key of each NPC_KEYED table (and nested path) resolves
//   2. classification — no unclassified all-lowercase top-level object literal
//   3. favor          — every _npcFavor('x') / npcFavorability['x'] literal resolves
//   4. order          — every element of an `npcOrder` array literal resolves
//
// NOT covered here on purpose: npc-VALUED string fields (`npc:'…'`). Quest anchors are
// pinned by tests/integration/audit03h-npc-normalize.test.js, and NODE_MAP's inline `npc`
// is SUPPOSED to be a display name ('The Fisherman') — normalizing that would be the bug,
// since it is what makes the key resolve (§AUDIT-03h).
//
// Usage:  node scripts/check-npcregs.js            # audit, exit 1 on findings
//         node scripts/check-npcregs.js --selftest # prove each phase catches a plant
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'roll2hit-v3.html');
const WBAPI = require(path.join(ROOT, 'js', 'wbapi-core.js'));

// ── classification ────────────────────────────────────────────────────────────
// Top-level object literals whose KEYS are npc keys. Every key must resolve.
const NPC_KEYED = [
  'ACT8_FAREWELL_BEATS',     // npc → Act VIII farewell modal beat
  'NPC_VOID_PRESSURE_LINES', // npc → line at fav>=2 && voidPressure>=6
  'SWEELINCK_NAMING_LINES',  // npc → covenant-ceremony witness line
  'NPC_EPILOGUES',           // npc → fav-gated victory-screen epilogue
  'NPC_NG_PLUS_GREETINGS',   // npc → first NG+ greeting
  'NPC_NG_MEMORY_LINES',     // npc → second NG+ visit memory line
  'ROUGH_WHISKEY_REACTIONS', // npc → reaction while carrying rough whiskey
  'NPC_FAREWELLS',           // npc → { <from>_to_<to> route lines, default }
  'NPC_ACT_THREE_LINES',     // npc → one-time Act III line
  'NPC_ROMANCE_PREAMBLES',   // npc → romance-layer preamble
  'NPC_ROMANCE_VIGNETTES',   // npc → romance-layer vignette
  'FROBERGER_TRACES',        // npc → "Froberger passed through" memory
  'NPC_CROSS_REFS',          // npc → cross-reference lines about other NPCs
];
// Nested npc-keyed groups, addressed by path.
const NPC_KEYED_PATHS = [
  ['TOWN_CRIER_LINES', 'npcs'],  // crier ambience keyed by the NPC it is about
];
// The registries that DEFINE the vocabulary — checking them against themselves is vacuous.
const VOCAB_SOURCE = {
  NPC_DIALOGUES:      'registry 3 of npcKeyVocab() — it defines the keys',
  BIRKA_NPC_PROFILES: 'registry 1 of npcKeyVocab() — it defines the keys',
};
// All-lowercase keys that are NOT npc keys. Each needs a reason, so the list cannot
// quietly become a dumping ground for a registry someone did not want to fix.
const NOT_NPC_KEYED = {
  ENEMY_DB:                'monster keys — the SRD stat-block table',
  MONSTER_POOL:            'monster keys',
  MONSTER_DROPS:           'monster keys — trophy drops, nested inside MONSTER_POOL',
  EPIC_BOSS_POOL:          'monster keys — the epic boss stat blocks',
  CONDITION_ADV:           'condition names (prone/restrained/blinded/…)',
  QUEST_DB:                'quest ids',
  POTION_TIERS:            'potion tier names (minor/healing/greater/superior)',
  STARTER_DAGGER:          'item FIELDS (name/icon/type/sell), not a keyed table',
  EB_STORY_ITEMS:          'item keys — Epic Battleground story rewards',
  LAKE_MAGIC_DB:           'lake-magic entry ids (lake_mag_01…)',
  CORELLI_ITEMS:           'item keys — Corelli\'s stock',
  BAIT_TABLES:             'fishing spot names (bank/reeds/shallows)',
  FISH_GOLD_VALUES:        'fish size names (small/medium/large/…)',
  TOUR_TITLES:             'NPC_TOUR_OPPONENTS keys — the tournament cast, a 5th registry '
                         + 'outside npcKeyVocab() by design (§AUDIT-03i)',
  FROBERGER_MEMORIAL_TEXT: 'memorial variant names (base/yael_friendly/dear_friend/post_cipher)',
  FROBERGER_EPILOGUE:      'journal-state names (covenant/imperfect/efficient/cursed)',
  TOWN_CRIER_LINES:        'tier names (critical/tension/quests/npcs/acts) — its `npcs` '
                         + 'sub-table IS npc-keyed and is checked via NPC_KEYED_PATHS',
  _DEFEAT_COPY:            'defeat-cause names (time/void)',
  _ML_KEYS:                'monster-level curve keys (black/white)',
  _WORLD_SPAN:             'rows/cols — the world span',
};

const LOWERKEY = /^[a-z][a-z0-9_'-]*$/;

// ── helpers ───────────────────────────────────────────────────────────────────
// The body of a top-level `const NAME = {` … `};`, brace-matched with the shared
// comment/string-aware scanner (a private scanner would drift — §AUDIT-03f).
function topLevelObjects(src) {
  const out = new Map();
  const declRe = /^const ([A-Za-z_$][A-Za-z0-9_$]*) = \{/gm;
  let m;
  while ((m = declRe.exec(src))) {
    const openIdx = m.index + m[0].length - 1;
    const tail = src.slice(openIdx);
    let depth = 0, endRel = -1;
    for (const t of WBAPI._scanTokens(tail)) {
      if (t.open) { depth++; continue; }
      if (t.close) { depth--; if (depth === 0) { endRel = t.index; break; } }
    }
    if (endRel < 0) continue;
    out.set(m[1], {
      body: tail.slice(0, endRel + 1),
      line: src.slice(0, m.index).split('\n').length,
    });
  }
  return out;
}

// The body of a `key: {` … `}` nested one level inside `body`.
function nestedObject(body, key) {
  const m = body.match(new RegExp(`(^|[{,])\\s*${key}\\s*:\\s*\\{`, 'm'));
  if (!m) return null;
  const openIdx = m.index + m[0].length - 1;
  const tail = body.slice(openIdx);
  let depth = 0, endRel = -1;
  for (const t of WBAPI._scanTokens(tail)) {
    if (t.open) { depth++; continue; }
    if (t.close) { depth--; if (depth === 0) { endRel = t.index; break; } }
  }
  return endRel < 0 ? null : tail.slice(0, endRel + 1);
}

function lineOf(src, idx) { return src.slice(0, idx).split('\n').length; }

// ── the audit ─────────────────────────────────────────────────────────────────
function audit(src, vocab) {
  const findings = [];
  const objs = topLevelObjects(src);

  // 1. registries
  for (const name of NPC_KEYED) {
    const o = objs.get(name);
    if (!o) { findings.push(`[registry] ${name} — declared in NPC_KEYED but not found in the file`); continue; }
    for (const k of WBAPI._sectionTopKeys(o.body)) {
      if (!vocab.has(k)) findings.push(`[registry] ${name} (line ${o.line}) key '${k}' resolves in no NPC registry`);
    }
  }
  for (const [name, sub] of NPC_KEYED_PATHS) {
    const o = objs.get(name);
    if (!o) { findings.push(`[registry] ${name} — declared in NPC_KEYED_PATHS but not found in the file`); continue; }
    const body = nestedObject(o.body, sub);
    if (!body) { findings.push(`[registry] ${name}.${sub} — nested table not found`); continue; }
    for (const k of WBAPI._sectionTopKeys(body)) {
      if (!vocab.has(k)) findings.push(`[registry] ${name}.${sub} (line ${o.line}) key '${k}' resolves in no NPC registry`);
    }
  }

  // 2. classification — an unlisted all-lowercase table is a finding, not a silence
  for (const [name, o] of objs) {
    if (NPC_KEYED.includes(name) || VOCAB_SOURCE[name] || NOT_NPC_KEYED[name]) continue;
    if (NPC_KEYED_PATHS.some(([n]) => n === name)) continue;
    const keys = WBAPI._sectionTopKeys(o.body);
    if (keys.length < 2) continue;
    if (!keys.every(k => LOWERKEY.test(k))) continue;   // mixed/upper keys → not an npc table
    findings.push(`[classify] ${name} (line ${o.line}) has all-lowercase keys (${keys.slice(0, 6).join(',')}…) `
      + 'but is in none of NPC_KEYED / VOCAB_SOURCE / NOT_NPC_KEYED — classify it in scripts/check-npcregs.js');
  }

  // 3. favor — the gate sites. This is the phase that catches a dead key in live logic.
  const favRes = [
    /_npcFavor\(\s*'([a-z][a-z0-9_]*)'\s*\)/g,
    /npcFavorability\s*\[\s*'([a-z][a-z0-9_]*)'\s*\]/g,
  ];
  for (const re of favRes) {
    let m;
    while ((m = re.exec(src))) {
      if (!vocab.has(m[1])) findings.push(`[favor] ${m[0]} at line ${lineOf(src, m.index)} names an NPC that resolves in no registry`);
    }
  }

  // 4. order — the epilogue/crier walk lists
  const orderRe = /npcOrder\s*=\s*\[([^\]]*)\]/g;
  let om;
  while ((om = orderRe.exec(src))) {
    for (const q of om[1].match(/'([a-z][a-z0-9_]*)'/g) || []) {
      const key = q.slice(1, -1);
      if (!vocab.has(key)) findings.push(`[order] npcOrder at line ${lineOf(src, om.index)} names '${key}', which resolves in no NPC registry`);
    }
  }
  return findings;
}

// ── selftest — each phase must catch a planted defect ─────────────────────────
function selftest(src, vocab) {
  const plants = [
    ['registry', src.replace('const NPC_EPILOGUES = {', 'const NPC_EPILOGUES = {\n  couperin: { 0: "planted" },')],
    ['classify', src.replace('const _ML_KEYS = {', 'const PLANTED_TABLE = { alpha:1, beta:2 };\nconst _ML_KEYS = {')],
    ['favor',    src.replace("_npcFavor('auros')", "_npcFavor('bruhns')")],
    ['order',    src.replace("const npcOrder = ['yael','brynn','quill','pachelbel','crov','auros'];",
                             "const npcOrder = ['yael','brynn','couperin','pachelbel','crov','auros'];")],
  ];
  let ok = true;
  for (const [phase, planted] of plants) {
    if (planted === src) { console.error(`✗ selftest[${phase}] — the plant did not apply (anchor moved)`); ok = false; continue; }
    const hits = audit(planted, vocab).filter(f => f.startsWith(`[${phase}]`));
    if (!hits.length) { console.error(`✗ selftest[${phase}] — planted defect NOT caught`); ok = false; }
    else console.log(`✓ selftest[${phase}] — caught: ${hits[0]}`);
  }
  return ok;
}

// ── main ──────────────────────────────────────────────────────────────────────
const src = fs.readFileSync(HTML, 'utf8');
WBAPI.load(HTML);
const vocab = WBAPI.npcKeyVocab();

if (process.argv.includes('--selftest')) {
  process.exit(selftest(src, vocab) ? 0 : 1);
}

const findings = audit(src, vocab);
if (findings.length) {
  console.error(`✗ check:npcregs — ${findings.length} NPC reference(s) resolve in no registry:\n`);
  findings.forEach(f => console.error('  ' + f));
  console.error('\n  The favor ledger spends PROFILE keys, not display names or surnames:');
  console.error('  quill = Bard Tomas Couperin · crov = Pit Master Weckmann · auros = Cmdr Bruhns.');
  console.error('  The vocabulary is the 4 registries in WBAPI.npcKeyVocab() (§AUDIT-03b);');
  console.error('  the key is NOT the name slugified (§AUDIT-03h).');
  process.exit(1);
}
console.log(`✓ check:npcregs — ${NPC_KEYED.length} npc-keyed registries, ${NPC_KEYED_PATHS.length} nested table(s), `
  + `plus every _npcFavor()/npcFavorability[] literal and npcOrder entry resolve against ${vocab.size} live NPC keys`);
