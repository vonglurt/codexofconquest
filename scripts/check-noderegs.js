#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §AUDIT-03j — every node reference in the engine must resolve in NODE_MAP.
//
// Why this exists: `NODE_MAP` is the only authority on which places exist, but a dozen
// engine-side registries are KEYED by node code, and nothing ever checked them. When the
// world moved off the 26×16 two-letter codes, those registries were left behind and
// simply stopped firing — silently, because a lookup that misses just renders nothing:
//
//   NODE_NPC_KEYS      21 of 26 rows named a node that does not exist → favor tinting
//                      and farewells worked at LHR alone
//   NPC_FAREWELLS      all 12 `<from>_to_<to>` route keys dead → only `default` fired
//   JUNCTION_VIGNETTES 7 of 8 keyed to the J2–J7/RD stubs §WALK deleted
//   CORELLI_APPEARANCES stop 2 of 5 at a removed node
//   NPC_DIALOGUE       `MS_SPARK` — a legacy code, so Brannick never spoke
//
// THE BLIND SPOT THIS GATE IS BUILT TO AVOID. The obvious design — "flag any registry
// where most keys look like node codes, then check the rest" — cannot see a registry
// that is ENTIRELY dead, which is exactly what NODE_NPC_KEYS and JUNCTION_VIGNETTES had
// become (1 of 8 resolving reads as "not a node-keyed table"). So classification here is
// EXPLICIT: every codeish top-level registry must be listed in NODE_KEYED or in
// NOT_NODE_KEYED with a reason, and an unlisted one FAILS. A new registry cannot slip in
// dead, and an old one cannot decay into invisibility.
//
// THE SECOND BLIND SPOT (§AUDIT-03p, 2026-08-04). Phases 1–2 read only TOP-LEVEL `const`
// declarations, so a registry declared INSIDE a function was invisible to both of them —
// it could neither fail nor be forced into the classification. `_voidFlavorLine`'s local
// `CLUSTER` had sat that way since cc562f5 with 11 of its 16 keys dead, so the Void's
// "first crack" line never rendered at eleven of the sixteen places it was authored for.
// Phase 5 applies the same explicit classification to indented `const/let/var NAME = {`
// literals whose keys are all codeish: LOCAL_NODE_KEYED or NOT_NODE_KEYED, never silence.
//
// Phases:
//   1. registries  — every key of each NODE_KEYED table resolves in NODE_MAP
//   2. classification — no unclassified codeish top-level object literal
//   3. fields      — every `nodeCode:`/`node:`/`activateNode:`/… string literal resolves
//   4. routes      — every `<CODE>_to_<CODE>` composite key resolves on both sides
//   5. locals      — the same two rules for function-local codeish object literals
//   6. comparisons + battle codes (§VM-01-G-FU, 2026-08-05) — the shape phases 1–5 never
//      scanned: a `node.code === 'XX'` comparison literal, and the synthetic
//      defeatedBattles-ledger codes (`code:'WG0_TRIAL'` spreads, `defeatedBattles['…']`
//      guards, `battles:[…]` completion gates, `nodeCode ===` overlay guards). The
//      §VM-01-G triage measured 116 comparison literals and 20 synthetic battle codes
//      with NO fence — all live today only because the content is young; `birkaNpcs`
//      proves what happens to unfenced code-keyed logic when the world moves. Every
//      literal must resolve in NODE_MAP or be classified in SYNTHETIC_BATTLE_CODES.
//      STATED LIMIT: the scan is textual — a comparison through an alias
//      (`const c = node.code; c === 'XX'`) is not caught. Comment-aware by construction
//      (two of the corpus hits are prose in comments — the §AUDIT-03f lesson).
//
// Usage:  node scripts/check-noderegs.js            # audit, exit 1 on findings
//         node scripts/check-noderegs.js --selftest # prove each phase catches a plant
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const WBAPI = require(path.join(ROOT, 'js', 'wbapi-core.js'));

// ── classification ────────────────────────────────────────────────────────────
// Top-level object literals whose KEYS are node codes. Every key must resolve.
const NODE_KEYED = [
  'NODE_MAP',            // the authority itself (keys are the node codes)
  'NODE_COORDS',         // node → live cell
  'NPC_DIALOGUE',        // node → the one speaker at that place (§FL7)
  'EB_NPC_DIALOGUE',     // Epic Battleground node → contract giver
  'EB_NG_PLUS_LINES',    // Epic Battleground node → NG+ memory line
  'JUNCTION_VIGNETTES',  // road node → roadside scene
  'NODE_NPC_KEYS',       // node → primary NPC key (map tint + farewell)
  'JOURNAL_ENTRIES',     // node → Froberger quote (dead code, still node-keyed)
  'INN_DREAMS',          // sleep node → dream text
  'NIGHT_AMBIENT',       // node → after-dark ambient paragraph
];
// Function-local object literals whose KEYS are node codes (§AUDIT-03p). Same rule as
// NODE_KEYED — every key must resolve — but declared inside a function, where phases 1–2
// could not see them.
const LOCAL_NODE_KEYED = [
  'CLUSTER',    // _voidFlavorLine — node → Void-pressure flavor cluster
  '_vaSites',   // the §VA arc's site list
  'birkaNpcs',  // node → the Birka-era NPC rendered on arrival
];
// Codeish keys that are NOT node codes. Each needs a reason, so that the list cannot
// quietly become a dumping ground for a registry someone did not want to fix.
// (Shared by phases 2 and 5 — a name is classified once, wherever it is declared.)
const NOT_NODE_KEYED = {
  GEO_PROJ:        'ROWS/COLS — the geo projection\'s dimensions',
  __MOVER_DELTAS:  'N/S/E/W — compass deltas (MOVER:CORE)',
  __ROOM_DIRS:     'N/S/E/W — compass order (ROOMS:CORE)',
  __ROOM_DIRWORD:  'N/S/E/W — compass words (ROOMS:CORE)',
  _MAP_OPP:        'N/S/E/W — opposite-direction table',
  ARROWS:          'N/S/E/W — compass glyphs (local, map + room renderers)',
  DELTAS:          'N/S/E/W — compass deltas (local, map + room renderers)',
};
// String fields anywhere in the file whose value is a node code.
const NODE_FIELDS = ['nodeCode', 'node', 'nodeSlug', 'npcNode', 'activateNode',
                     'waypointNode', 'checkpointNode', 'atNode'];
// §VM-01-G4d: a `combat` bit's `nodeCode` may carry a SYNTHETIC battle code — the kernel
// spreads the LIVE node and overrides only `code`, so the value is a defeatedBattles ledger
// key, not a place (CDG's three boss confrontations). §VM-01-G-FU widened the fence to the
// other shapes those codes live in (`code:` spreads, `defeatedBattles[…]` guards,
// `battles:` gates, `nodeCode ===` overlay guards — phase 6), and the list grew 3 → 20:
// the engine-region Class-F stack mints one per staged fight. Explicit classification in
// the NODE_KEYED/NOT_NODE_KEYED house style: an UNLISTED synthetic code still fails, and
// the `nodeCode:` FIELD exemption applies to `nodeCode:` ONLY — a synthetic code in
// `activateNode`/`waypointNode`/… is a real defect (asserted by the selftest).
const SYNTHETIC_BATTLE_CODES = {
  CQ_TAZ:      '§VM-01-G4d — CDG boss menu, Taz confrontation',
  CQ_BOSS:     '§VM-01-G4d — CDG boss menu, Don confrontation',
  CQ_KING:     '§VM-01-G4d — CDG boss menu, Cat-King confrontation',
  MT_WARDEN:   'Layer 56 — Void Shaman Warden (hook launch + overlay guard)',
  CY_VOID:     'Layer 41 — Void Below descend at HKG',
  WG0_TRIAL:   '§CROWN-01 — Sea Serpent gate trial at WG0',
  HW1_KELPIE:  '§CROWN-01 — Kelpie dispatch at HW1',
  HW1_WITCH:   '§CROWN-01 — Sea Witch commission at HW1',
  HG1_MUDCRAB: '§CROWN-01 — Mudcrab dispatch at HG1',
  HG1_OCTOPUS: '§CROWN-01 — Giant Octopus commission at HG1',
  HN1_SPAWN:   '§CROWN-01 — Sea Spawn dispatch at HN1',
  HN1_DEMON:   '§CROWN-01 — Sea Demon commission at HN1',
  INN_EEL:     '§CROWN-01 — Giant Eel inn commission at INN',
  HCA_BOSS:    '§CROWN-01 — the Leviathan arc boss at HCA',
  MS_BILGE:    '§WHODUNIT-01 — Sea Spawn ×2 bilge fight at SEN',
  SB_PRIVATEER:'§NAVAL-01 — the Intercept privateer fight at GCI',
  BN_NIGHTHAG: '§HUNT-02 — Night Hag relay-post fight at BNX',
  LD_DROWNERS: '§HUNT-01 — Drowner ×3 den fight at VAW',
  VS_SHADOW:   '§WISDOM-01 — the mirror-construct fight at VS',
  DSJ_EELS:    '§LXX — Giant Eel ×2 kelp-channel fight at DSJ',
};
// Objects whose KEYS are `<from>_to_<to>` node pairs.
const ROUTE_KEYED = ['NPC_FAREWELLS'];

const CODEISH = /^[A-Z][A-Z0-9_]{0,5}$/;

// ── helpers ───────────────────────────────────────────────────────────────────
// The body of a top-level `const NAME = {` … `};`, brace-matched with the shared
// comment/string-aware scanner (a private scanner would drift — §AUDIT-03f).
function objectBody(src, openIdx) {
  const tail = src.slice(openIdx);
  let depth = 0;
  for (const t of WBAPI._scanTokens(tail)) {
    if (t.open) { depth++; continue; }
    if (t.close) { depth--; if (depth === 0) return tail.slice(0, t.index + 1); }
  }
  return null;
}

function topLevelObjects(src) {
  const out = new Map();
  const declRe = /^const ([A-Za-z_$][A-Za-z0-9_$]*) = \{/gm;
  let m;
  while ((m = declRe.exec(src))) {
    const body = objectBody(src, m.index + m[0].length - 1);
    if (body === null) continue;
    out.set(m[1], { body, line: src.slice(0, m.index).split('\n').length });
  }
  return out;
}

// Function-local declarations — the same shape, but INDENTED (that indent is the whole
// difference, and it is why phases 1–2 never saw `CLUSTER`). A name can appear more than
// once (two renderers each declare their own `ARROWS`), so this returns a list, not a map.
function localObjects(src) {
  const out = [];
  const declRe = /^[ \t]+(?:const|let|var) ([A-Za-z_$][A-Za-z0-9_$]*) = \{/gm;
  let m;
  while ((m = declRe.exec(src))) {
    const body = objectBody(src, m.index + m[0].length - 1);
    if (body === null) continue;
    out.push({ name: m[1], body, line: src.slice(0, m.index).split('\n').length });
  }
  return out;
}

function lineOf(src, idx) { return src.slice(0, idx).split('\n').length; }

// Comments → spaces (newlines kept, so line numbers survive; strings preserved — the
// literals phase 6 scans ARE strings). Two of the phase-6 corpus hits are prose inside
// comments (`node.code === 'XX'` in the NODE_PANELS header, `defeatedBattles['CF']` in
// the Pit Championship note) — a scanner without this is the §AUDIT-03f defect again.
function stripComments(src) {
  let out = '', i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    if (ch === '/' && src[i + 1] === '/') {
      let j = src.indexOf('\n', i); if (j < 0) j = n;
      out += ' '.repeat(j - i); i = j; continue;
    }
    if (ch === '/' && src[i + 1] === '*') {
      let j = src.indexOf('*/', i); j = j < 0 ? n : j + 2;
      out += src.slice(i, j).replace(/[^\n]/g, ' '); i = j; continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      const q = ch; let j = i + 1;
      while (j < n && src[j] !== q) { if (src[j] === '\\') j++; j++; }
      j++; out += src.slice(i, j); i = j; continue;
    }
    out += ch; i++;
  }
  return out;
}

// ── the audit ─────────────────────────────────────────────────────────────────
function audit(src, live) {
  const findings = [];
  const objs = topLevelObjects(src);

  // 1. registries
  for (const name of NODE_KEYED) {
    const o = objs.get(name);
    if (!o) { findings.push(`[registry] ${name} — declared in NODE_KEYED but not found in the file`); continue; }
    const keys = WBAPI._sectionTopKeys(o.body);
    for (const k of keys) {
      if (!live.has(k)) findings.push(`[registry] ${name} (line ${o.line}) key '${k}' is not a NODE_MAP key`);
    }
  }

  // 2. classification — an unlisted codeish table is a finding, not a silence
  for (const [name, o] of objs) {
    if (NODE_KEYED.includes(name) || NOT_NODE_KEYED[name] || ROUTE_KEYED.includes(name)) continue;
    const keys = WBAPI._sectionTopKeys(o.body);
    if (keys.length < 2) continue;
    const codeish = keys.filter(k => CODEISH.test(k));
    if (codeish.length !== keys.length) continue;   // mixed keys → not a node table
    findings.push(`[classify] ${name} (line ${o.line}) has all-codeish keys (${keys.slice(0, 6).join(',')}…) `
      + 'but is in neither NODE_KEYED nor NOT_NODE_KEYED — classify it in scripts/check-noderegs.js');
  }

  // 3. fields
  for (const f of NODE_FIELDS) {
    const re = new RegExp(`\\b${f}\\s*:\\s*'([A-Z][A-Z0-9_]{0,5})'`, 'g');
    let m;
    while ((m = re.exec(src))) {
      if (f === 'nodeCode' && SYNTHETIC_BATTLE_CODES[m[1]]) continue;   // §VM-01-G4d
      if (!live.has(m[1])) findings.push(`[field] ${f}:'${m[1]}' at line ${lineOf(src, m.index)} is not a NODE_MAP key`);
    }
  }

  // 4. routes
  for (const name of ROUTE_KEYED) {
    const o = objs.get(name);
    if (!o) { findings.push(`[route] ${name} — declared in ROUTE_KEYED but not found in the file`); continue; }
    const re = /\b([A-Z][A-Z0-9]{0,5})_to_([A-Z][A-Z0-9]{0,5})\s*:/g;
    let m;
    while ((m = re.exec(o.body))) {
      for (const code of [m[1], m[2]]) {
        if (!live.has(code)) findings.push(`[route] ${name} key '${m[0].slice(0, -1).trim()}' names '${code}', not a NODE_MAP key`);
      }
    }
  }

  // 5. locals — function-local registries, same two rules (resolve + classify explicitly)
  const seenLocal = new Set();
  for (const o of localObjects(src)) {
    let keys;
    try { keys = WBAPI._sectionTopKeys(o.body); } catch (_) { continue; }
    if (LOCAL_NODE_KEYED.includes(o.name)) {
      seenLocal.add(o.name);
      for (const k of keys) {
        if (!live.has(k)) findings.push(`[local] ${o.name} (line ${o.line}) key '${k}' is not a NODE_MAP key`);
      }
      continue;
    }
    if (NOT_NODE_KEYED[o.name] || NODE_KEYED.includes(o.name) || ROUTE_KEYED.includes(o.name)) continue;
    if (keys.length < 2) continue;
    if (keys.some(k => !CODEISH.test(k))) continue;   // mixed keys → not a node table
    findings.push(`[local] ${o.name} (line ${o.line}) has all-codeish keys (${keys.slice(0, 6).join(',')}…) `
      + 'but is in neither LOCAL_NODE_KEYED nor NOT_NODE_KEYED — classify it in scripts/check-noderegs.js');
  }
  for (const name of LOCAL_NODE_KEYED) {
    if (!seenLocal.has(name)) findings.push(`[local] ${name} — declared in LOCAL_NODE_KEYED but not found as a function-local literal`);
  }

  // 6. comparisons + battle codes (§VM-01-G-FU) — comment-stripped, then four textual
  //    shapes. A literal resolves in NODE_MAP or is a classified synthetic battle code;
  //    anything else is dead code waiting to be discovered by a player not seeing it.
  const bare = stripComments(src);
  const CODE_LIT = "['\"]([A-Z][A-Z0-9_]{0,15})['\"]";
  const cmpShapes = [
    ['cmp',        new RegExp('\\bnode\\.code\\s*===\\s*' + CODE_LIT, 'g')],
    ['cmp',        new RegExp('\\bnodeCode\\s*===\\s*' + CODE_LIT, 'g')],
    ['battlecode', new RegExp('defeatedBattles[^\\[\\n]{0,8}\\[\\s*' + CODE_LIT + '\\s*\\]', 'g')],
    ['battlecode', new RegExp('\\bcode\\s*:\\s*' + CODE_LIT, 'g')],
  ];
  for (const [tag, re] of cmpShapes) {
    let m;
    while ((m = re.exec(bare))) {
      if (live.has(m[1]) || SYNTHETIC_BATTLE_CODES[m[1]]) continue;
      findings.push(`[${tag}] '${m[1]}' at line ${lineOf(bare, m.index)} resolves in neither NODE_MAP nor SYNTHETIC_BATTLE_CODES`);
    }
  }
  { // battles: completion-gate arrays — same rule, member by member
    const re = /\bbattles\s*:\s*\[([^\]]*)\]/g;
    let m;
    while ((m = re.exec(bare))) {
      let mm; const r2 = new RegExp(CODE_LIT, 'g');
      while ((mm = r2.exec(m[1]))) {
        if (live.has(mm[1]) || SYNTHETIC_BATTLE_CODES[mm[1]]) continue;
        findings.push(`[battlecode] battles-gate '${mm[1]}' at line ${lineOf(bare, m.index)} resolves in neither NODE_MAP nor SYNTHETIC_BATTLE_CODES`);
      }
    }
  }
  // …and the classification stays honest in the other direction: a listed synthetic
  // battle code the file no longer mentions is a stale entry, same as a NODE_KEYED
  // registry that stopped existing.
  for (const code of Object.keys(SYNTHETIC_BATTLE_CODES)) {
    if (!bare.includes(`'${code}'`) && !bare.includes(`"${code}"`)) {
      findings.push(`[battlecode] '${code}' is classified in SYNTHETIC_BATTLE_CODES but occurs nowhere in the file — retire the entry`);
    }
  }
  return findings;
}

// ── selftest — each phase must catch a planted defect ─────────────────────────
function selftest(src, live) {
  const plants = [
    ['registry', src.replace('const NIGHT_AMBIENT = {', 'const NIGHT_AMBIENT = {\n  ZZQ: "planted",')],
    ['classify', src.replace('const GEO_PROJ = {', 'const PLANTED_TABLE = { AAA:1, BBB:2 };\nconst GEO_PROJ = {')],
    ['field',    src.replace("nodeCode:'WRO'", "nodeCode:'ZZQ'")],
    // §VM-01-G4d — the synthetic-battle-code exemption is nodeCode-ONLY: the same code in
    // any other node field is a real defect and must still be caught.
    ['field',    src.replace("nodeCode:'WRO'", "activateNode:'CQ_TAZ'"), 'field/synthetic-scope'],
    ['route',    src.replace('LHR_to_TLL:', 'ZZQ_to_TLL:')],
    // §AUDIT-03p — both halves of phase 5: a dead key in a classified local table, and an
    // unclassified one. The second plant is the defect that hid `CLUSTER` for months.
    ['local',    src.replace('  const CLUSTER = {\n', '  const CLUSTER = {\n    ZZQ:\'birka\',\n'), 'local/deadkey'],
    ['local',    src.replace('  const CLUSTER = {', '  const PLANTED_LOCAL = { AAA:1, BBB:2 };\n  const CLUSTER = {'), 'local/classify'],
    // §VM-01-G-FU — phase 6, both halves: a dead comparison literal, and an UNLISTED
    // synthetic battle code (the classification must be explicit, not a wildcard).
    ['cmp',        src.replace("node.code === 'SSJ'", "node.code === 'ZZQ'"), 'cmp/deadcode'],
    ['battlecode', src.replace("code:'WG0_TRIAL'", "code:'ZZ_TRIAL'"), 'battlecode/unlisted'],
    // the inverse rule: a classified synthetic the file stops mentioning is a stale entry
    // (every DSJ_EELS site swapped to a LIVE code, so ONLY the staleness rule can fire)
    ['battlecode', src.split("'DSJ_EELS'").join("'TLS'"), 'battlecode/stale-entry'],
  ];
  let ok = true;
  for (const [phase, planted, label] of plants) {
    const name = label || phase;
    if (planted === src) { console.error(`✗ selftest[${name}] — the plant did not apply (anchor moved)`); ok = false; continue; }
    const hits = audit(planted, live).filter(f => f.startsWith(`[${phase}]`));
    if (!hits.length) { console.error(`✗ selftest[${name}] — planted defect NOT caught`); ok = false; }
    else console.log(`✓ selftest[${name}] — caught: ${hits[0]}`);
  }
  // §VM-01-G-FU — the phase-6 NEGATIVE control: the same dead literal inside a COMMENT
  // must NOT fire. Two real comments in the corpus carry exactly this shape; a scanner
  // that flags them is the §AUDIT-03f defect wearing a gate's badge.
  {
    const planted = src.replace('function storyRender', "// planted prose: node.code === 'ZZQ' and defeatedBattles['ZZ_PLANT'] in a comment\nfunction storyRender");
    if (planted === src) { console.error('✗ selftest[cmp/comment-immunity] — the plant did not apply (anchor moved)'); ok = false; }
    else {
      const hits = audit(planted, live).filter(f => f.includes('ZZQ') || f.includes('ZZ_PLANT'));
      if (hits.length) { console.error(`✗ selftest[cmp/comment-immunity] — a comment fired the gate: ${hits[0]}`); ok = false; }
      else console.log('✓ selftest[cmp/comment-immunity] — a dead literal in a comment is prose, not a finding');
    }
  }
  return ok;
}

// ── main ──────────────────────────────────────────────────────────────────────
const src = fs.readFileSync(HTML, 'utf8');
WBAPI.load(HTML);
const live = new Set(Object.keys(WBAPI.nodeMap));

if (process.argv.includes('--selftest')) {
  process.exit(selftest(src, live) ? 0 : 1);
}

const findings = audit(src, live);
if (findings.length) {
  console.error(`✗ check:noderegs — ${findings.length} node reference(s) do not resolve in NODE_MAP:\n`);
  findings.forEach(f => console.error('  ' + f));
  console.error('\n  Look codes up in docs/maps/node-index.md (`npm run nodes`) — it carries the live');
  console.error('  table AND a LEGACY CODE MAP for the retired 26×16 names. Never read a node code');
  console.error('  off a hand-maintained table (§AUDIT-03l).');
  process.exit(1);
}
console.log(`✓ check:noderegs — ${NODE_KEYED.length} node-keyed registries, ${LOCAL_NODE_KEYED.length} function-local ones, `
  + `${NODE_FIELDS.length} node fields, ${ROUTE_KEYED.length} route table(s), comparison literals and `
  + `${Object.keys(SYNTHETIC_BATTLE_CODES).length} classified battle codes all resolve against ${live.size} live nodes`);
