#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
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
// §AUDIT-03k added phase 5 — the same defect one level up: not a key that resolves
// nowhere, but a key that resolves to a SECOND heading for someone who already has one.
// A node's inline `npc` is a display name, so slugifying it mints a rival key for the
// person standing there — `city_guard_captain` held 5 quests while `yael`, named in LHR's
// own node text, held 17. The alias map lives in wbapi-core (WBAPI.NPC_ALIASES).
//
// Phases:
//   1. registries     — every key of each NPC_KEYED table (and nested path) resolves
//   2. classification — no unclassified all-lowercase top-level object literal
//   3. favor          — every _npcFavor('x') / npcFavorability['x'] literal resolves
//   4. order          — every element of an `npcOrder` array literal resolves
//   5. aliases        — no `npc:` slug is an alias, and every alias-shaped collision
//                       between an inline display name and a profile is classified
//   6. ceremony       — every NPC the corpus can raise to the Covenant Ceremony's own
//                       threshold has a line there to be named with (§GR-FU2)
//   7. gates          — no favor threshold is above the favor the corpus can write, so
//                       no branch waits on a level nobody can reach (§AUDIT-03ar)
//   8. announced      — a `favor` bit whose entry announces a tier in prose writes that
//                       tier. Correct as data, wrong as intent (§AUDIT-03ar)
//   9. spoken         — a favor key resolves to a NAME, not merely into the vocabulary,
//                       and the promotion path still goes through the one resolver and
//                       still takes the run's message sink (§DX-02gc)
//
// NOT covered here on purpose: whether an npc-VALUED string field RESOLVES. Quest anchors
// are pinned by tests/integration/audit03h-npc-normalize.test.js, and NODE_MAP's inline
// `npc` is SUPPOSED to be a display name ('The Fisherman') — normalizing that would be the
// bug, since it is what makes the key resolve (§AUDIT-03h). Phase 5 checks only that a
// lowercase `npc:` value is the CANONICAL key for its character, never that it exists.
//
// Usage:  node src/scripts/check-npcregs.js            # audit, exit 1 on findings
//         node src/scripts/check-npcregs.js --selftest # prove each phase catches a plant
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const HTML = path.join(ROOT, 'play.html');
const WBAPI = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));

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
  'DEAR_FRIEND_BITS',        // npc → the second personal act that grants the Dear-Friend step
  'MISSION_ACT_BITS',        // npc → the ending-scorer label for that act's mission bit
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

// §AUDIT-03k — an inline display name that COLLIDES with a profile's identity but is a
// different character. Each needs a reason, for the same reason NOT_NPC_KEYED does: the
// alternative is a heuristic quietly deciding two people are one.
const NOT_AN_ALIAS = {
  ship_captain: 'SEN is the Tilbury Star; captain_smollett_sen captains the Hispaniola at '
              + 'HMS — the occupation matches, the character does not',
};

// §GR-FU2 — the Covenant Ceremony names by favor, so its table is not a curated cast: it
// is a function of the favor ledger. A key the corpus can raise to the threshold that the
// ceremony deliberately does not name needs a reason here, for the same reason
// NOT_NPC_KEYED does — a silence and an oversight are otherwise the same text.
const CEREMONY_TABLE = 'SWEELINCK_NAMING_LINES';
const CEREMONY_EXEMPT = {};

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

// §GR-FU2 — the ceremony's threshold, read out of the builder rather than restated here:
// _buildSweelinckNamingSequence emits states[N] at `fav >= N`, and the lowest N it tests is
// the favor at which a missing table entry becomes a person the ending cannot name.
function ceremonyThreshold(src) {
  const m = src.match(/function _buildSweelinckNamingSequence\(\)\s*\{([\s\S]*?)\n\}/);
  if (!m) return null;
  const tiers = [...m[1].matchAll(/fav >= (\d+)/g)].map(x => Number(x[1]));
  return tiers.length ? Math.min(...tiers) : null;
}

// The highest favor the corpus can put each NPC at. `set` is a level the ledger raises to,
// `add` stacks on whatever a `set` already reached (bounded by the bit's own `cap`), a
// literal _setNpcFavor(key, N) is a `set` written in code rather than in a bit, and a
// DEAR_FRIEND_BITS entry is one further step on top of the result.
function favorCeiling(src, objs) {
  const cap = Number((src.match(/const NPC_FAVOR_CAP = (\d+)/) || [])[1] || 3);
  const set = new Map(), add = new Map();
  const raise = (m, k, v) => m.set(k, Math.max(m.get(k) || 0, v));
  const bitRe = /kind:\s*["']favor["']\s*,\s*npc:\s*["']([a-z][a-z0-9_]*)["']\s*,\s*(set|add)\s*:\s*(\d+)(?:\s*,\s*cap\s*:\s*(\d+))?/g;
  let m;
  while ((m = bitRe.exec(src))) {
    const [, key, op, n, bitCap] = m;
    if (op === 'set') raise(set, key, Number(n));
    else add.set(key, Math.min(bitCap == null ? cap : Number(bitCap), (add.get(key) || 0) + Number(n)));
  }
  const callRe = /_setNpcFavor\(\s*'([a-z][a-z0-9_]*)'\s*,\s*(\d+)\s*\)/g;
  while ((m = callRe.exec(src))) raise(set, m[1], Number(m[2]));
  const dfb = objs.get('DEAR_FRIEND_BITS');
  const step = new Set(dfb ? WBAPI._sectionTopKeys(dfb.body) : []);
  const out = new Map();
  for (const k of new Set([...set.keys(), ...add.keys()])) {
    const base = Math.min(cap, (set.get(k) || 0) + (add.get(k) || 0));
    out.set(k, Math.min(cap, base >= 1 && step.has(k) ? base + 1 : base));
  }
  return out;
}

// §AUDIT-03k — the identity of every NPC that has one, from the two registries that carry
// name/occupation/node metadata (BIRKA_NPC's lean profiles + NPC_DIALOGUES' meta block).
// The body of `function NAME(` … `}` at column 0 — enough to ask what a function reads.
function functionBody(src, name) {
  const i = src.indexOf(`function ${name}(`);
  if (i < 0) return null;
  let depth = 0;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}' && --depth === 0) return src.slice(i, k + 1);
  }
  return null;
}

function npcIdentities() {
  const out = {};
  const add = (k, m) => {
    if (!m) return;
    const e = out[k] || (out[k] = { name:'', occupation:'', node:'' });
    e.name = e.name || m.name || ''; e.occupation = e.occupation || m.occupation || ''; e.node = e.node || m.node || '';
  };
  for (const [k, p] of Object.entries(WBAPI.birkaNpcs || {})) add(k, p);
  for (const [k, p] of Object.entries(WBAPI.npcDialogues || {})) add(k, (p && p.meta) || p);
  return out;
}
// The distinct inline `npc` display names, with the nodes that carry them.
function inlineNpcSlugs() {
  const out = new Map();
  for (const [code, n] of Object.entries(WBAPI.nodeMap || {})) {
    if (!n || !n.npc) continue;
    const slug = String(n.npc).toLowerCase().replace(/\s/g, '_');
    if (!out.has(slug)) out.set(slug, { raw:n.npc, codes:[] });
    out.get(slug).codes.push(code);
  }
  return out;
}
// Does this display name describe a character who already has a profile? Two tells, both
// conservative: the slug's words are a subset of the profile's NAME ("Commander Bruhns" ⊂
// "Commander Seraphine Bruhns"), or the slug IS the profile's occupation ("City Guard
// Captain" ≡ yael's "city guard captain"). Deliberately NOT node-agreement — a shared node
// is where two DIFFERENT people stand, and requiring it would have hidden `ship_captain`.
function aliasCandidates(identities, inline) {
  const toks = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  const known = new Set([...Object.keys(WBAPI.birkaNpcs || {}), ...Object.keys(WBAPI.npcDialogues || {})]);
  const out = [];
  for (const [slug, it] of inline) {
    if (known.has(slug)) continue;                    // already a profile/dialogue key in its own right
    const st = toks(it.raw);
    const hits = [];
    for (const [k, p] of Object.entries(identities)) {
      const nt = toks(p.name); if (!nt.length) continue;
      if (st.every(w => nt.includes(w)) || (p.occupation && toks(p.occupation).join(' ') === st.join(' '))) hits.push(k);
    }
    if (hits.length) out.push({ slug, codes:it.codes, hits });
  }
  return out;
}

// §AUDIT-03ar — the tier each favor level is called in player-facing prose. The corpus
// announces a promotion by hand in a sibling `narrative` bit, which it took up while
// _setNpcFavor's own message was still overwritten in the same render; §DX-02gc closed the
// overwrite, and the hand-written sentences stay because they say more than the tier line
// does. Either way the prose is a second, human statement of what the bit was meant to
// write — and the two can disagree.
const FAVOR_TIER_NAMES = { 1: 'Friendly', 2: 'Dear Friend', 3: 'Dear Friend' };

// The QUEST_DB / hook entry a source index sits in: back to the nearest `  name: {` at the
// entry indent, forward to the next one. Announcement and bit are paired at entry level
// because that is the unit an author writes them in.
function enclosingEntry(src, idx) {
  const head = src.lastIndexOf('\n  ', idx);
  let start = 0;
  const decl = /^  [A-Za-z_$][\w$]*\s*:\s*\{/;
  for (let i = head; i > 0; i = src.lastIndexOf('\n  ', i - 1)) {
    const line = src.slice(i + 1, src.indexOf('\n', i + 1));
    if (decl.test(line)) { start = i + 1; break; }
  }
  let end = src.length;
  for (let i = src.indexOf('\n  ', idx); i > 0; i = src.indexOf('\n  ', i + 1)) {
    const line = src.slice(i + 1, src.indexOf('\n', i + 1));
    if (decl.test(line)) { end = i; break; }
  }
  return src.slice(start, end);
}

// ── the audit ─────────────────────────────────────────────────────────────────
function audit(src, vocab, model) {
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

  // 5. aliases — one character, one key (§AUDIT-03k)
  const ALIASES = WBAPI.NPC_ALIASES;
  //   (a) every authored `npc:` slug is the canonical key. A lowercase value is a KEY
  //       (a quest anchor or a favor bit); a display name like 'City Guard Captain' has
  //       capitals and never matches, which is the point — it is allowed to stay.
  const npcValRe = /\bnpc\s*:\s*["']([a-z][a-z0-9_'-]*)["']/g;
  let vm;
  while ((vm = npcValRe.exec(src))) {
    const k = vm[1];
    if (ALIASES[k]) findings.push(`[alias] npc:'${k}' at line ${lineOf(src, vm.index)} is a display-name alias of '${ALIASES[k]}' — `
      + 'anchor it to the profile key, or the same person is indexed twice');
  }
  //   (b) the map itself must stay true to the world it describes.
  const identities = model.identities, inline = model.inline;
  for (const [slug, target] of Object.entries(ALIASES)) {
    if (!inline.has(slug)) findings.push(`[alias] NPC_ALIASES.'${slug}' is no longer any node's inline npc — drop the row (wbapi-core.js)`);
    if (!vocab.has(target)) findings.push(`[alias] NPC_ALIASES.'${slug}' → '${target}', which resolves in no NPC registry`);
  }
  //   (c) explicit classification, the gate-#13/#14 rule: a NEW display name that collides
  //       with an existing profile must be resolved by a human, not by a heuristic.
  for (const c of aliasCandidates(identities, inline)) {
    if (ALIASES[c.slug] || NOT_AN_ALIAS[c.slug]) continue;
    findings.push(`[alias] node ${c.codes.join('/')} inline npc '${c.slug}' matches the identity of `
      + `${c.hits.join(' / ')} but is in neither WBAPI.NPC_ALIASES nor NOT_AN_ALIAS — classify it`);
  }

  // 6. ceremony — the ending names by favor (§GR-FU2). The table is a function of the
  //    ledger, so a person the ledger raises and the table omits is silence at the payoff.
  const ceilings = favorCeiling(src, objs);
  const thr = ceremonyThreshold(src);
  const cer = objs.get(CEREMONY_TABLE);
  if (thr == null) findings.push('[ceremony] _buildSweelinckNamingSequence tests no `fav >= N` tier — '
    + 'the ceremony threshold can no longer be read from the builder');
  else if (!cer) findings.push(`[ceremony] ${CEREMONY_TABLE} — named as the ceremony table but not found in the file`);
  else {
    const named = new Set(WBAPI._sectionTopKeys(cer.body));
    for (const [k, v] of ceilings) {
      if (v < thr || named.has(k) || CEREMONY_EXEMPT[k]) continue;
      findings.push(`[ceremony] the corpus raises '${k}' to favor ${v} and ${CEREMONY_TABLE} (line ${cer.line}) `
        + `has no entry for them — the ceremony names at fav >= ${thr}, so this one is helped and never named`);
    }
  }

  // 7. gates — the other direction of the same arithmetic (§AUDIT-03ar). A threshold above
  //    what any writer can reach is not a strict gate; it is content with no door.
  const gate = (k, need, where) => {
    const c = ceilings.get(k) || 0;
    if (need > c) findings.push(`[gates] ${where} needs favor ${need} and nothing in the corpus can raise `
      + `'${k}' past ${c} — the branch behind it can never run`);
  };
  const cmpRe = /_npcFavor\(\s*'([a-z][a-z0-9_]*)'\s*\)\s*(>=|>|===|==)\s*(\d+)/g;
  let cm;
  while ((cm = cmpRe.exec(src))) {
    gate(cm[1], cm[2] === '>' ? Number(cm[3]) + 1 : Number(cm[3]), `${cm[0]} at line ${lineOf(src, cm.index)}`);
  }
  const favMinRe = /favorMin\s*:\s*\{([^}]*)\}/g;
  let fm;
  while ((fm = favMinRe.exec(src))) {
    for (const pair of fm[1].matchAll(/([a-z][a-z0-9_]*)\s*:\s*(\d+)/g)) {
      gate(pair[1], Number(pair[2]), `favorMin:{ ${pair[1]}:${pair[2]} } at line ${lineOf(src, fm.index)}`);
    }
  }

  // 8. announced — the bit and the sentence beside it must name the same tier (§AUDIT-03ar).
  const names = model.identities;
  const bitRe = /kind:\s*["']favor["']\s*,\s*npc:\s*["']([a-z][a-z0-9_]*)["']\s*,\s*set\s*:\s*(\d+)/g;
  let bm;
  while ((bm = bitRe.exec(src))) {
    const key = bm[1], level = Number(bm[2]);
    const entry = enclosingEntry(src, bm.index);
    const idName = String((names[key] || {}).name || '').toLowerCase();
    for (const a of entry.matchAll(/([A-Z][A-Za-z'’-]*) is (Friendly|Dear Friend)\b/g)) {
      if (!idName.split(/[^a-z']+/).includes(a[1].toLowerCase())) continue;   // said about someone else
      if (a[2] !== FAVOR_TIER_NAMES[level]) findings.push(`[announced] line ${lineOf(src, bm.index)} writes `
        + `${key} set:${level} (${FAVOR_TIER_NAMES[level] || 'no tier'}) and its own entry tells the player `
        + `"${a[0]}" — the write is correct as data and wrong as intent`);
    }
  }
  // 9. spoken — §DX-02gc. Phase 3 asks whether a favor key RESOLVES; a key can resolve
  //    into the vocabulary and still have no display name, and then the promotion line
  //    speaks the database slug at the player. The resolver is `_npcDisplayName`, and the
  //    registries it reads are lifted from its own body rather than restated here: if it
  //    grows a third table, this phase says so instead of quietly asserting the old chain.
  const RESOLVER = '_npcDisplayName';
  const resolver = functionBody(src, RESOLVER);
  if (!resolver) {
    findings.push(`[spoken] ${RESOLVER} is not in the file — the favor path has no single name resolver, `
      + 'so every speaking site is free to invent its own (§DX-02gc)');
  } else {
    const reads = [...new Set([...resolver.matchAll(/([A-Z][A-Z0-9_]*)\s*\[\s*key\s*\]/g)].map(m => m[1]))].sort();
    const modelled = ['BIRKA_NPC_PROFILES', 'NPC_DIALOGUES'];   // what npcIdentities() merges
    const unmodelled = reads.filter(r => !modelled.includes(r));
    if (unmodelled.length) findings.push(`[spoken] ${RESOLVER} reads ${unmodelled.join(', ')}, which this gate's `
      + 'identity model does not — teach npcIdentities() the same table or the phase asserts the wrong chain');
    for (const m of modelled) {
      if (!reads.includes(m)) findings.push(`[spoken] ${RESOLVER} no longer reads ${m}, and npcIdentities() still does `
        + '— the gate would pass keys the game can no longer name');
    }
  }
  // The speaking sites must ask the resolver, not a registry. A direct profile read here is
  // exactly the defect: it is right for the nine Birka keys and wrong for everyone else.
  for (const fn of ['_setNpcFavor', '_checkDearFriendUpgrade']) {
    const body = functionBody(src, fn);
    if (!body) { findings.push(`[spoken] ${fn} is not in the file`); continue; }
    if (/BIRKA_NPC_PROFILES\s*\[/.test(body)) findings.push(`[spoken] ${fn} reads BIRKA_NPC_PROFILES directly — `
      + `the name it speaks must come from ${RESOLVER}, or a dialogue-only NPC is announced by their key`);
    if (!body.includes(RESOLVER)) findings.push(`[spoken] ${fn} does not call ${RESOLVER}`);
  }
  // And the line must survive the render that follows it: the promotion carries the run's
  // message sink from the grammar down, or storyCheckQuests' caller overwrites it.
  const favHandler = /favor\((bit)(?:,\s*(ctx))?\)\s*\{([\s\S]{0,600}?)\n      \},/.exec(src);
  if (!favHandler) findings.push('[spoken] the QUEST:CORE `favor` handler could not be read — this phase cannot check the message seam');
  else if (!favHandler[2] || !/E\.setFavor\([^)]*,\s*say\s*\)/.test(favHandler[3])) {
    findings.push('[spoken] the `favor` handler does not pass the run\'s message sink to E.setFavor — a tier line '
      + 'emitted from a completion is overwritten in the same synchronous render (§DX-02gc)');
  }
  // Every key a favor write can name must have a name to speak.
  const spokenKeys = new Set();
  for (const m of src.matchAll(/kind:\s*["']favor["'][^}]*?npc:\s*["']([a-z][a-z0-9_]*)["']/g)) spokenKeys.add(m[1]);
  for (const m of src.matchAll(/_setNpcFavor\(\s*'([a-z][a-z0-9_]*)'/g)) spokenKeys.add(m[1]);
  for (const k of [...spokenKeys].sort()) {
    const nm = String((model.identities[k] || {}).name || '');
    if (!nm) findings.push(`[spoken] a favor write names '${k}', and no registry gives them a display name — `
      + `the promotion line would read "🤝 ${k} looks at you differently now."`);
  }

  return findings;
}

// ── selftest — each phase must catch a planted defect ─────────────────────────
function selftest(src, vocab, model) {
  // §AUDIT-03k — the classification plant is a MODEL plant, not a source plant: a new
  // node whose display name collides with a live profile is exactly the case the phase
  // exists to stop, and it cannot be expressed by editing text the parser already read.
  const collide = {
    identities: model.identities,
    inline: new Map([...model.inline, ['pit_master', { raw:'Pit Master', codes:['ZZZ'] }]]),
  };
  const plants = [
    ['registry', src.replace('const NPC_EPILOGUES = {', 'const NPC_EPILOGUES = {\n  couperin: { 0: "planted" },'), model],
    ['classify', src.replace('const _ML_KEYS = {', 'const PLANTED_TABLE = { alpha:1, beta:2 };\nconst _ML_KEYS = {'), model],
    ['favor',    src.replace("_npcFavor('auros')", "_npcFavor('bruhns')"), model],
    ['order',    src.replace("const npcOrder = ['yael','brynn','quill','pachelbel','crov','auros'];",
                             "const npcOrder = ['yael','brynn','couperin','pachelbel','crov','auros'];"), model],
    ['alias',    src.replace('npc:"yael"', 'npc:"city_guard_captain"'), model],
    ['alias',    src, collide],
    ['ceremony', src.replace(`{ kind:'favor', npc:"solvak", set:1 }`, `{ kind:'favor', npc:"solvak", set:2 }`), model],
    ['gates',    src.replace(`_npcFavor('brynn') >= 3`, `_npcFavor('quill') >= 3`), model],
    ['gates',    src.replace('favorMin:{ yael:3 }', 'favorMin:{ yva:3 }'), model],
    ['announced', src.replace(`{kind:'favor',npc:'benedikt_rasp',set:2}`, `{kind:'favor',npc:'benedikt_rasp',set:1}`), model],
    // §DX-02gc — the four ways the promotion line goes back to speaking a slug, or to a
    // channel that is cleared before it is painted.
    ['spoken', src.replace(`{ kind:'favor', npc:"solvak", set:1 }`, `{ kind:'favor', npc:"no_such_person", set:1 }`), model],
    ['spoken', src.replace('const d = NPC_DIALOGUES[key];', 'const d = null;'), model],
    ['spoken', src.replace("  const n = _npcDisplayName(key);", "  const n = (BIRKA_NPC_PROFILES[key] || {}).name || key;"), model],
    ['spoken', src.replace('      favor(bit, ctx) {', '      favor(bit) {'), model],
  ];
  // Findings are compared against the UNPLANTED baseline, so a plant is only "caught" if
  // it produced a finding that was not already there — otherwise a corpus that is already
  // dirty in that phase would make every plant look caught.
  const baseline = new Set(audit(src, vocab, model));
  let ok = true;
  for (const [phase, planted, m] of plants) {
    if (planted === src && m === model) { console.error(`✗ selftest[${phase}] — the plant did not apply (anchor moved)`); ok = false; continue; }
    const hits = audit(planted, vocab, m).filter(f => f.startsWith(`[${phase}]`) && !baseline.has(f));
    if (!hits.length) { console.error(`✗ selftest[${phase}] — planted defect NOT caught`); ok = false; }
    else console.log(`✓ selftest[${phase}] — caught: ${hits[0]}`);
  }
  return ok;
}

// ── main ──────────────────────────────────────────────────────────────────────
const src = fs.readFileSync(HTML, 'utf8');
WBAPI.load(HTML);
const vocab = WBAPI.npcKeyVocab();
const model = { identities: npcIdentities(), inline: inlineNpcSlugs() };

if (process.argv.includes('--selftest')) {
  process.exit(selftest(src, vocab, model) ? 0 : 1);
}

const findings = audit(src, vocab, model);
if (findings.length) {
  console.error(`✗ check:npcregs — ${findings.length} NPC reference(s) resolve in no registry:\n`);
  findings.forEach(f => console.error('  ' + f));
  console.error('\n  The favor ledger spends PROFILE keys, not display names or surnames:');
  console.error('  quill = Bard Tomas Couperin · crov = Pit Master Weckmann · auros = Cmdr Bruhns.');
  console.error('  The vocabulary is the 4 registries in WBAPI.npcKeyVocab() (§AUDIT-03b);');
  console.error('  the key is NOT the name slugified (§AUDIT-03h).');
  console.error('  An [alias] finding is the other shape: the key resolves, but to a SECOND');
  console.error('  heading for someone who already has one — see WBAPI.NPC_ALIASES (§AUDIT-03k).');
  process.exit(1);
}
console.log(`✓ check:npcregs — ${NPC_KEYED.length} npc-keyed registries, ${NPC_KEYED_PATHS.length} nested table(s), `
  + `plus every _npcFavor()/npcFavorability[] literal and npcOrder entry resolve against ${vocab.size} live NPC keys; `
  + `${Object.keys(WBAPI.NPC_ALIASES).length} display-name aliases collapse to their profile key and no npc: value is one; `
  + `every NPC the corpus raises to fav >= ${ceremonyThreshold(src)} has a line in ${CEREMONY_TABLE}, `
  + 'and no favor threshold in the file is above the favor its NPC can be written to, '
  + 'and every favor bit writes the tier its own entry announces to the player, and every favor write '
  + 'names someone the game can put a display name to, through the one resolver, into the run\'s message stream');
