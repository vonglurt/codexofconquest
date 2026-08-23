#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
/* §ARCH-01 Wave 2 — bulk legacy→UQF skill_check migrator.
 *
 * Surgically rewrites the `quest_*: { ... }` literals in index.html for a
 * given allowlist of quest ids (by explicit ids or --prefix). DETERMINISTIC and
 * SAFE-BY-CONSTRUCTION: it never re-serializes narrative strings — it only
 *   (a) deletes the scalar legacy check fields (checkStat/checkSkill/checkLabel/
 *       checkAbility/checkDC/checkPassFlag/checkFailFlag/bitLabel/xpAward/goldAward),
 *   (b) deletes activateCond ONLY when it is the trivial `() => !!S_story.<flag>`
 *       shape (decomposed to gate.flags); any other activateCond is KEPT verbatim
 *       and the quest gets gate:{_legacyFn:true} so canActivate stays permissive
 *       and the legacy closure remains load-bearing at the activation site,
 *   (c) inserts `schema:"UQF-1.0", gate:{…}, bits:[{ skill_check … }],` right
 *       after the `type:"skill_check",` token.
 * Every other field (title/desc/hint/passText/failText/npc/activateNode/
 * waypointNode/retryable/retryGateDays/disposition/vignetteText/…) is left
 * byte-for-byte untouched.
 *
 * Resolution parity (vs _rollCeremonia): onPass = [mission_bit{flag:checkPassFlag}
 * (label omitted ⇒ _grantMissionBit→_flagToLabel, exactly as legacy with
 * bitLabel===undefined), then reward{xp}/reward{gold} when present]; onFail = []
 * (the legacy non-retryable fail path — status:'failed' — is reproduced by
 * _resolveQuestUQF itself; no legacy quest in scope carries checkFailFlag).
 *
 * Usage:
 *   node scripts/uqf-bulk-migrate.js --prefix hav_           # migrate a family
 *   node scripts/uqf-bulk-migrate.js id1,id2,id3             # explicit ids
 *   node scripts/uqf-bulk-migrate.js --prefix hav_ --dry     # report only
 */
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'index.html');

// ── arg parsing ──────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const dry = argv.includes('--dry');
let prefix = null, explicitIds = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--prefix') prefix = argv[++i];
  else if (argv[i] === '--dry') { /* handled */ }
  else if (!argv[i].startsWith('--')) explicitIds = argv[i].split(',').map(s => s.trim()).filter(Boolean);
}
if (!prefix && !explicitIds) { console.error('need --prefix <p> or a comma id list'); process.exit(2); }

let src = fs.readFileSync(FILE, 'utf8');

// ── comment/string-aware matching-brace scan ───────────────────────────────
// Given the index of the '{' that opens a quest literal, return the index just
// past its matching '}'. Tracks // and /* */ comments and ' " ` strings so
// braces inside them don't perturb the depth count.
function matchBrace(s, open) {
  let depth = 0, i = open;
  let inS = null, inLine = false, inBlock = false;
  for (; i < s.length; i++) {
    const c = s[i], n = s[i + 1];
    if (inLine) { if (c === '\n') inLine = false; continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i++; } continue; }
    if (inS) {
      if (c === '\\') { i++; continue; }
      if (c === inS) inS = null;
      continue;
    }
    if (c === '/' && n === '/') { inLine = true; i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inS = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i + 1; }
  }
  throw new Error('unbalanced braces from ' + open);
}

// Locate a top-level `  <id>: {` declaration (2-space indent inside QUEST_DB).
function findLiteral(s, id) {
  const re = new RegExp('\\n  ' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s*\\{');
  const m = re.exec(s);
  if (!m) return null;
  const brace = s.indexOf('{', m.index);
  const end = matchBrace(s, brace);
  return { start: m.index + 1, braceOpen: brace, end, text: s.slice(m.index + 1, end) };
}

// Read a scalar string/number field value from a literal body.
function readStr(body, key) {
  const m = new RegExp(key + ':\\s*"((?:[^"\\\\]|\\\\.)*)"').exec(body)
        || new RegExp(key + ":\\s*'((?:[^'\\\\]|\\\\.)*)'").exec(body);
  return m ? m[1] : null;
}
function readNum(body, key) {
  const m = new RegExp(key + ':\\s*(-?\\d+(?:\\.\\d+)?)').exec(body);
  return m ? Number(m[1]) : null;
}

// Delete a scalar `key:value` field (string or number) plus one adjoining comma.
function delScalar(body, key) {
  return body
    .replace(new RegExp(',\\s*' + key + ':\\s*"(?:[^"\\\\]|\\\\.)*"'), '')
    .replace(new RegExp(',\\s*' + key + ":\\s*'(?:[^'\\\\]|\\\\.)*'"), '')
    .replace(new RegExp(',\\s*' + key + ':\\s*-?\\d+(?:\\.\\d+)?'), '')
    // leading-position fallback (key right after the brace)
    .replace(new RegExp(key + ':\\s*"(?:[^"\\\\]|\\\\.)*",\\s*'), '')
    .replace(new RegExp(key + ":\\s*'(?:[^'\\\\]|\\\\.)*',\\s*"), '')
    .replace(new RegExp(key + ':\\s*-?\\d+(?:\\.\\d+)?,\\s*'), '');
}

// Match the trivial `() => !!S_story.<flag>` activateCond → its flag, else null.
// The optional `"?` around the arrow body also matches the STRING-literal form
// `activateCond:"() => !!S_story.X"` — a data-generation bug present in ~36
// auto-generated quests that carry activateCond TWICE (the real function form
// plus a dead string copy; JS last-key-wins makes the parsed value the string,
// so the legacy activation site `q.activateCond()` THROWS at runtime). Either
// form yields the same intended flag. The lookahead `(?=[,}])` requires the flag
// to be the COMPLETE arrow body so a compound `() => …X && …` is not misread.
function trivialGateFlag(body) {
  const m = /activateCond:\s*"?\(\)\s*=>\s*!!\s*S_story\.([A-Za-z0-9_$]+)"?\s*(?=[,}])/.exec(body);
  return m ? m[1] : null;
}
function hasActivateCond(body) { return /(?:^|[,{\s])activateCond:/.test(body); }

const targets = [];
{
  // Enumerate ids by scanning for `  <id>: { id:"<id>", type:"skill_check"` lines.
  const re = /\n  ([A-Za-z0-9_]+):\s*\{\s*id:\s*["']([A-Za-z0-9_]+)["'],\s*type:\s*["']skill_check["']/g;
  let m;
  while ((m = re.exec(src))) {
    const id = m[1];
    if (explicitIds ? explicitIds.includes(id) : id.startsWith(prefix)) targets.push(id);
  }
}
if (!targets.length) { console.error('no skill_check targets matched'); process.exit(1); }

// §SKILLFIX-02 (user-approved 2026-06-29): ~176 legacy skill_checks put a D&D
// SKILL NAME (or a full ability word) in checkStat instead of one of the 6
// ability abbreviations. The legacy resolver read abilityScores[checkStat] →
// undefined → +0 ability mod (a latent bug; §SKILLFIX-01 did not reach these).
// The UQF skill_check contract REQUIRES stat ∈ {STR,DEX,CON,INT,WIS,CHA}, so we
// map the skill to its governing ability (D&D 5e standard) and keep the skill
// name in `skill` (display + proficiency). This is a deliberate BEHAVIOR CHANGE
// — the check now rolls ability-mod + proficiency, the intended D&D behavior.
const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const ABILITY_WORD = { STRENGTH:'STR', DEXTERITY:'DEX', CONSTITUTION:'CON', INTELLIGENCE:'INT', WISDOM:'WIS', CHARISMA:'CHA' };
const SKILL_TO_ABILITY = {
  ATHLETICS:'STR',
  ACROBATICS:'DEX', 'SLEIGHT OF HAND':'DEX', STEALTH:'DEX',
  ARCANA:'INT', HISTORY:'INT', INVESTIGATION:'INT', NATURE:'INT', RELIGION:'INT',
  'ANIMAL HANDLING':'WIS', INSIGHT:'WIS', MEDICINE:'WIS', PERCEPTION:'WIS', SURVIVAL:'WIS',
  DECEPTION:'CHA', INTIMIDATION:'CHA', PERFORMANCE:'CHA', PERSUASION:'CHA',
  COURAGE:'CHA', PRESENCE:'CHA',   // homebrew stats → CHA (user-approved)
};

let migrated = 0, skipped = 0, keptLegacyGate = 0, skillMapped = 0;
const report = [];

for (const id of targets) {
  const lit = findLiteral(src, id);
  if (!lit) { console.error('LITERAL NOT FOUND:', id); process.exit(1); }
  let body = lit.text;
  if (/schema:\s*["']UQF-1\.0["']/.test(body)) { skipped++; continue; }

  const rawStat = readStr(body, 'checkAbility') || readStr(body, 'checkStat') || '';
  const statU = rawStat.toUpperCase();
  let skill = readStr(body, 'checkLabel') || readStr(body, 'checkSkill') || null;
  let stat;
  if (ABILITIES.includes(statU)) {
    stat = statU;                                  // already an ability abbrev
  } else if (ABILITY_WORD[statU]) {
    stat = ABILITY_WORD[statU];                    // full ability word → abbrev, not a skill
  } else if (SKILL_TO_ABILITY[statU]) {            // §SKILLFIX-02: skill → governing ability
    stat = SKILL_TO_ABILITY[statU];
    if (!skill) skill = rawStat;                   // preserve original skill name (display + proficiency)
    skillMapped++;
  } else {
    stat = '';                                     // triggers the not-well-formed guard below
  }
  const dc    = readNum(body, 'checkDC');
  const passFlag = readStr(body, 'checkPassFlag');
  const bitLabel = readStr(body, 'bitLabel');
  const failFlag = readStr(body, 'checkFailFlag');
  const xp    = readNum(body, 'xpAward');
  const gold  = readNum(body, 'goldAward');

  if (!stat && rawStat) { console.error('UNMAPPED checkStat (not an ability or known D&D skill — extend SKILL_TO_ABILITY):', id, JSON.stringify(rawStat)); process.exit(1); }
  if (!stat || typeof dc !== 'number') { console.error('NOT WELL-FORMED (no stat/dc):', id); process.exit(1); }
  if (failFlag) { console.error('checkFailFlag present — out of Wave-2 scope:', id); process.exit(1); }

  // gate
  const gFlag = trivialGateFlag(body);
  let gate, decomposed = false, legacyGate = false;
  if (gFlag) { gate = `{ flags:['${gFlag}'] }`; decomposed = true; }
  else if (hasActivateCond(body)) { gate = '{ _legacyFn:true }'; legacyGate = true; keptLegacyGate++; }
  else { gate = '{}'; }

  // bits
  const onPass = [];
  onPass.push(passFlag
    ? (bitLabel ? `{ kind:'mission_bit', flag:'${passFlag}', label:'${bitLabel.replace(/'/g, "\\'")}' }`
                : `{ kind:'mission_bit', flag:'${passFlag}' }`)
    : null);
  const rewardParts = [];
  if (xp)   rewardParts.push('xp:' + xp);
  if (gold) rewardParts.push('gold:' + gold);
  if (rewardParts.length) onPass.push(`{ kind:'reward', ${rewardParts.join(', ')} }`);
  const onPassStr = onPass.filter(Boolean).join(', ');
  const skillField = skill ? ` skill:'${skill.replace(/'/g, "\\'")}',` : '';
  const bits = `bits:[{ kind:'skill_check', stat:'${stat}',${skillField} dc:${dc}, onPass:[${onPassStr}], onFail:[] }],`;

  // remove consumed legacy fields
  for (const k of ['checkStat','checkSkill','checkLabel','checkAbility','checkDC','checkPassFlag','checkFailFlag','bitLabel','xpAward','goldAward']) {
    body = delScalar(body, k);
  }
  // Remove the trivial activateCond(s) together with their leading comma. The /g
  // flag + optional `"?` strips BOTH the function form and any dead string-copy
  // duplicate (see trivialGateFlag) in one pass; whatever follows (another field's
  // comma, or the closing brace) is left intact. Post-condition below asserts none
  // survived, so a decomposed quest can never ship a dangling (throwing) activateCond.
  if (decomposed) {
    body = body.replace(/,\s*activateCond:\s*"?\(\)\s*=>\s*!!\s*S_story\.[A-Za-z0-9_$]+"?/g, '');
    if (/activateCond\s*:/.test(body)) { console.error('RESIDUAL activateCond after decompose:', id, '\n', body.slice(0, 400)); process.exit(1); }
  }

  // insert schema + gate + bits right after `type:"skill_check",`
  body = body.replace(/(type:\s*["']skill_check["'],)/, `$1 schema:'UQF-1.0', gate:${gate}, ${bits}`);

  src = src.slice(0, lit.start) + body + src.slice(lit.end);
  migrated++;
  report.push({ id, stat, skill, dc, passFlag, xp, gold, gate: gate.replace(/\s+/g, ' '), legacyGate });
}

if (dry) {
  console.log(JSON.stringify({ targets: targets.length, migrated, skipped, keptLegacyGate, report }, null, 2));
} else {
  fs.writeFileSync(FILE, src);
  console.log(`migrated ${migrated}, skipped(already UQF) ${skipped}, kept-legacy-gate ${keptLegacyGate}, skill→ability mapped ${skillMapped}, targets ${targets.length}`);
}
