#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
// ═══════════════════════════════════════════════════════════════════════════
// check-questgraph.js — §VM-01-E: the soft-lock prover (dynamic effect-prober +
// reachability walker). The return on §ARCH-01 that "has never been collected":
// a 2,850-quest DB you can PROVE is finishable is an asset; one you can't is a
// liability.
//
// Design: lab-reports/lab-report-vm01e-softlock-prover.md — Option A (locked by
// the user): port the one nondeterministic bit (done — quest_1367_f_plague's
// coin-flip is now a seeded CON save), then analyse the graph with a DYNAMIC
// effect-prober rather than a static parser. C (scratch-state env) + D (headless
// requireable kernel) are exactly the seams this needs — it is "doubly-unblocked
// by C+D".
//
// WHAT IT DOES over the live QUEST_DB (parsed headlessly via the worldbuilder
// pipeline; the kernel via require('../js/quest.js')):
//   1. WRITE-SET per quest — a tree-walk over its bit chain (bits + onComplete),
//      unioning BOTH branches of every skill_check/choice (any branch is
//      reachable). Declarative bits expose their write-set structurally;
//      _legacy_fn bits are PROBED: the real closure source is executed against a
//      scratch state and the state diff IS the write-set. Each closure is probed
//      twice per seed — a divergent diff means residual nondeterminism (the
//      Math.random detector). After the plague port this MUST be zero.
//   2. READ-SET per gate — a recursive walk of the {all}/{any}/{not} activation +
//      completion trees, collecting every flag / quest / battle / resource a gate
//      predicates on.
//   3. REACHABILITY — a monotone fixpoint from the start state: a quest joins the
//      reachable set when its activation gate's required reads are all in the
//      accumulated write-pool (resources/counters treated as monotonically
//      accumulable — the BACKLOG's "bound it" for favorMin/shardsMin). A quest
//      whose gate requires a flag NOTHING writes is a DEFINITE soft-lock.
//   4. CROSS-REF — flags READ by a gate but WRITTEN by nothing (soft-lock / typo)
//      and flags WRITTEN by a bit but READ by no gate (dead write / typo): the
//      "written-by-nothing / read-by-nothing" detector §VM-01-C deferred here.
//
// §VM-01-E-FU (the write-set completion pass): the write-set tree-walk in (1) only
// sees flags a QUEST bit sets, so the cross-ref + reachability over-reported every
// gate flag that NON-quest code provides (a combat kill sets hornedSharkSlain, an
// arrival sets dunfallAccessed, an NPC missionBit grant, a readable-doc registry).
// scanFlagWrites() now scans the WHOLE file for flag-write forms and folds the
// result into both pools (see its comment). The 114 "written-by-nothing" collapsed
// to 48 — all genuine: the bulk-imported waw/crl/nwi/mla arcs whose act/chapter
// gates read a flag the prior step never writes (a systemic naming mismatch:
// gates say `waw001a2`, acts write `waw001Act2Passed`), plus voidFluxCleared +
// innDeparted (documented-but-unimplemented mechanics). Unreachable 202 → ~53 the
// same way. Fixing that quest CONTENT is a separate triage pass (BACKLOG §VM-01-E).
//
// EXIT: hard-fails (1) ONLY on residual nondeterminism in quest data — the sound,
// binary invariant the plague port established. The reachability + cross-ref
// output is a REVIEW report (printed with counts): over 2,851 quests many reads
// are satisfied by non-quest game code and many writes are read by render code,
// so those are informational, not a gate. `--selftest` validates the analyser
// against a synthetic graph and is the CI-wired mode (check:walk).
//
// USAGE:  node src/scripts/check-questgraph.js            # real-corpus report
//         node src/scripts/check-questgraph.js --selftest # analyser self-test (CI)
//         node src/scripts/check-questgraph.js --json      # machine-readable report
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const Q = require(path.join(__dirname, '..', 'js', 'quest.js'));

// ── string/comment-aware brace matcher (mirrors wbapi-core extractObj) ───────
function matchBrace(src, openIdx) {
  let depth = 0, i = openIdx, s = null, lc = false, bc = false;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (lc) { if (c === '\n') lc = false; continue; }
    if (bc) { if (c === '*' && n === '/') { bc = false; i++; } continue; }
    if (s) { if (c === '\\') { i++; continue; } if (c === s) s = null; continue; }
    if (c === '/' && n === '/') { lc = true; i++; continue; }
    if (c === '/' && n === '*') { bc = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { s = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

// ── extract each _legacy_fn closure SOURCE from the raw QUEST_DB region, keyed
//    by (questId, ordinal) so the prober can run the REAL closure (removeFns
//    strips fn to null in the parsed data). ────────────────────────────────────
function extractLegacyClosures(html) {
  const dbStart = html.indexOf('const QUEST_DB = {');
  const braceOpen = html.indexOf('{', dbStart);
  const dbEnd = matchBrace(html, braceOpen);
  const region = html.slice(braceOpen, dbEnd + 1), base = braceOpen;
  // quest id anchors (nearest preceding id: is the enclosing quest)
  const ids = []; let m;
  const idRe = /\bid:\s*['"]([a-zA-Z0-9_]+)['"]/g;
  while ((m = idRe.exec(region))) ids.push({ off: m.index, id: m[1] });
  const qidFor = off => { let b = null; for (const it of ids) { if (it.off <= off) b = it; else break; } return b ? b.id : '?'; };
  const bitRe = /kind:\s*['"]_legacy_fn['"]/g;
  const byQuest = {};
  while ((m = bitRe.exec(region))) {
    const fnIdx = region.indexOf('fn:', m.index);
    if (fnIdx < 0 || fnIdx - m.index > 40) continue;
    const after = region.slice(fnIdx);
    const a = after.match(/^fn:\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*/);
    let src;
    if (a) {
      const bs = fnIdx + a[0].length;
      if (region[bs] === '{') src = after.slice(a[0].length, matchBrace(region, bs) - fnIdx + 1);
      else {
        // bare/paren expression body — read to bit close at paren/bracket depth 0
        let i = bs, dp = 0, db = 0, st = null;
        for (; i < region.length; i++) { const c = region[i];
          if (st) { if (c === '\\') { i++; continue; } if (c === st) st = null; continue; }
          if (c === '"' || c === "'" || c === '`') { st = c; continue; }
          if (c === '(') dp++; else if (c === ')') dp--; else if (c === '[') db++; else if (c === ']') db--;
          else if (c === '}' && dp <= 0 && db <= 0) break; }
        src = '{ ' + region.slice(bs, i).trim() + ' }';
      }
      const sig = after.match(/^fn:\s*(\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/)[1];
      const params = sig.replace(/[()]/g, '').split(',').map(s => s.trim()).filter(Boolean);
      const qid = qidFor(fnIdx);
      (byQuest[qid] = byQuest[qid] || []).push({ params, body: src });
    }
  }
  return byQuest;
}

// ── the dynamic prober's host sandbox — the small, bounded free-variable set the
//    124 closures reference (audit §2). Deterministic host helpers so their own
//    writes land on the scratch state; storyMsg is a no-op sink. ───────────────
function makeSandbox(state) {
  const npcFavor = k => (state.npcFavorability || {})[k] || 0;
  const storyMsg = () => {};
  const _innKindness = n => {
    state.innmotherKindness = (state.innmotherKindness || 0) + n;
    if (state.innmotherKindness >= 5 && !state.freeBookingUnlocked) {
      state.freeBookingUnlocked = true;
      state.inventory = state.inventory || [];
      state.inventory.push({ name: "Innmother's Key" });
      state.innmotherKeyGiven = true;
    }
  };
  const _addCroneMark = () => { state.croneMarks = (state.croneMarks || 0) + 1; _innKindness(1); };
  const _setNpcFavor = (k, lvl) => { state.npcFavorability = state.npcFavorability || {}; if (lvl > npcFavor(k)) state.npcFavorability[k] = lvl; };
  const _checkDearFriendUpgrade = () => {};   // reads flags, may bump favor — modelled as no-op write-wise (upgrade is a host nicety)
  return {
    names:  ['S_story', 'storyMsg', '_innKindness', '_addCroneMark', '_setNpcFavor', '_checkDearFriendUpgrade', '_npcFavor', 'FISHING_GUIDE_TEXT', 'BIRKA_NPC_PROFILES'],
    values: [ state,    storyMsg,   _innKindness,   _addCroneMark,   _setNpcFavor,   _checkDearFriendUpgrade,   npcFavor,    '',                   {} ],
  };
}

// Probe ONE legacy closure against a seed state; return the set of state keys it
// wrote (top-level + nested one level, e.g. abilityScores.wis, quests[x]) plus a
// serialized signature for the determinism compare. Throws are caught by caller.
function probeClosure(clo, seed) {
  const state = JSON.parse(JSON.stringify(seed));
  const before = JSON.stringify(state);
  const sb = makeSandbox(state);
  // Build: (…sandbox names…, ctx) => ( <closure> )(state-as-first-arg-if-it-takes-one, ctx)
  const fn = new Function(...sb.names, 'return (' + fnSource(clo) + ')');
  const closure = fn(...sb.values);
  const ctx = { state, pushMsg: () => {} };
  // call with the params the closure declared: (S[, ctx]) — zero-arg closures read the global S_story we injected
  if (clo.params.length === 0) closure();
  else if (clo.params.length === 1) closure(state);
  else closure(state, ctx);
  const after = JSON.stringify(state);
  const writes = diffKeys(JSON.parse(before), state);
  return { writes, changed: before !== after, sig: after };
}
function fnSource(clo) {
  const p = clo.params.length ? '(' + clo.params.join(',') + ')' : '()';
  return p + ' => ' + clo.body;
}
// keys that changed value between two objects, one level of nesting for object fields
function diffKeys(a, b) {
  const out = new Set();
  const walk = (x, y, prefix) => {
    const keys = new Set([...Object.keys(x || {}), ...Object.keys(y || {})]);
    for (const k of keys) {
      const xv = (x || {})[k], yv = (y || {})[k];
      if (JSON.stringify(xv) === JSON.stringify(yv)) continue;
      if (yv && typeof yv === 'object' && xv && typeof xv === 'object' && !Array.isArray(yv) && prefix.split('.').length < 2) walk(xv, yv, prefix ? prefix + '.' + k : k);
      else out.add(prefix ? prefix + '.' + k : k);
    }
  };
  walk(a, b, '');
  return out;
}

// ── the write-set tree-walk. Returns { flags:Set, quests:Set } unioning BOTH
//    branches of skill_check/choice (any branch is reachable). legacy closures
//    are PROBED N times per seed; a divergent state signature = nondeterminism.
const PROBES = 12;   // per seed: enough that a 50/50 coin is ~certainly caught (P(miss) < 2^-11)
function questWrites(quest, legacyClosures, ndSink, errSink, seeds) {
  const flags = new Set(), quests = new Set();
  let legacyIdx = 0;
  const chain = [...(quest.bits || []), ...(Array.isArray(quest.onComplete) ? quest.onComplete : [])];
  const walk = bits => {
    for (const bit of bits || []) {
      switch (bit.kind) {
        case 'flag_write':  (bit.set || []).forEach(f => flags.add(f)); (bit.clear || []).forEach(f => flags.add(f)); break;
        case 'mission_bit': if (bit.flag) flags.add(bit.flag); break;
        case 'unlock':      (bit.quests || []).forEach(qq => quests.add(qq)); break;
        case 'skill_check': walk(bit.onPass || []); walk(bit.onFail || []); break;   // BOTH branches reachable
        case 'choice':      (bit.options || []).forEach(o => walk(o.bits || [])); break;
        case 'reward': case 'combat': case 'narrative': case 'item_remove': case 'item_check': case 'favor': break;
        case '_legacy_fn': {
          const clos = (legacyClosures[quest.id] || [])[legacyIdx++];
          if (!clos) break;
          const keys = new Set(); const sigs = new Set(); let threw = null;
          for (const seed of seeds) {
            for (let i = 0; i < PROBES; i++) {
              try { const r = probeClosure(clos, seed); r.writes.forEach(k => keys.add(k)); sigs.add(seedTag(seed) + '|' + r.sig); }
              catch (e) { threw = e.message; break; }
            }
            if (threw) break;
          }
          keys.forEach(k => { if (/^quests\./.test(k)) quests.add(k.split('.')[1]); else flags.add(k.split('.')[0]); });
          // Genuine nondeterminism = same seed, >1 distinct signature. sigs are tagged by
          // seed, so a per-seed divergence shows as 2 tags sharing a seedTag prefix.
          const perSeed = {};
          for (const s of sigs) { const t = s.split('|')[0]; perSeed[t] = (perSeed[t] || 0) + 1; }
          const nd = Object.values(perSeed).some(c => c > 1);
          if (nd) ndSink.push({ quest: quest.id, keys: [...keys], body: clos.body.slice(0, 70) });
          else if (threw) errSink.push({ quest: quest.id, error: threw, body: clos.body.slice(0, 70) });
          break;
        }
      }
    }
  };
  walk(chain);
  return { flags, quests };
}

// ── the read-set: recurse {all}/{any}/{not}, collect gate-predicated flags. ────
function gateReads(node, out) {
  if (!node || typeof node !== 'object') return out;
  if (node.all) { node.all.forEach(n => gateReads(n, out)); return out; }
  if (node.any) { node.any.forEach(n => gateReads(n, out)); return out; }
  if (node.not) { gateReads(node.not, out); return out; }
  const add = arr => (arr || []).forEach(f => out.flags.add(f));
  add(node.flags); add(node.flagsAny); add(node.notFlags);
  if (node.flagEquals) Object.keys(node.flagEquals).forEach(k => out.flags.add(k));
  (node.questsAttempted || []).forEach(q => out.quests.add(q));
  (node.questsDone || []).forEach(q => out.quests.add(q));
  (node.questsComplete || []).forEach(q => out.quests.add(q));
  if (node.favorMin) Object.keys(node.favorMin).forEach(k => out.resources.add('favor:' + k));
  if (node.shardsMin != null) out.resources.add('shards');
  if (node.restedAtMin) out.resources.add('rested');
  (node.battles || []).forEach(b => out.battles.add(b));
  (node.notBattles || []).forEach(b => out.battles.add(b));
  (node.sleptAt || []).forEach(n => out.resources.add('slept:' + n));
  (node.nodes || []).forEach(n => out.resources.add('node:' + n));
  (node.flagsPath || []).forEach(p => out.flags.add(p.split('.')[0]));
  (node.countMin || []).forEach(c => out.resources.add('count:' + c.path.split('.')[0]));
  return out;
}

// A realistic empty state so probed closures don't throw on absent scaffolding
// (inventory/quests/etc. the game always initialises). Two seeds — minimal and
// startFlags-true — over-approximate `if (flag)` branch writes.
function scaffold(trueFlags) {
  const s = { inventory: [], quests: {}, knowledge: [], npcFavorability: {}, abilityScores: {},
    defeatedBattles: {}, visited: {}, visitedNodes: {}, sleptAtNodes: {}, shortRestedAtNodes: {},
    fishingCatchLog: [], journalEntriesRead: [], hp: 20, xp: 0, gold: 0, shards: 0 };
  (trueFlags || []).forEach(f => { s[f] = true; });
  return s;
}
function seedTag(seed) { return Object.keys(seed).filter(k => seed[k] === true).length + 'f'; }

// gate-tree satisfiability against a monotone pool of {flags, quests}. Mirrors
// _compileGate: all→every · any→some · not→satisfiable (absence is achievable);
// a leaf needs its AND flags in pool, ANY of flagsAny in pool, its quest-deps in
// the reachable-quests pool; resources/battles/nodes are monotone-satisfiable.
function gateSat(node, pool) {
  if (!node || typeof node !== 'object') return true;
  if (node.all) return node.all.every(n => gateSat(n, pool));
  if (node.any) return node.any.some(n => gateSat(n, pool));
  if (node.not) return true;
  if (node.flags && !node.flags.every(f => pool.flags.has(f))) return false;
  if (node.flagsAny && node.flagsAny.length && !node.flagsAny.some(f => pool.flags.has(f))) return false;
  if (node.flagEquals && !Object.keys(node.flagEquals).every(k => pool.flags.has(k))) return false;
  if (node.questsDone && !node.questsDone.every(q => pool.quests.has(q))) return false;
  if (node.questsComplete && !node.questsComplete.every(q => pool.quests.has(q))) return false;
  if (node.questsAttempted && !node.questsAttempted.every(q => pool.quests.has(q))) return false;
  if (node.flagsPath && !node.flagsPath.every(p => pool.flags.has(p.split('.')[0]))) return false;
  return true;   // notFlags / battles / notBattles / shardsMin / nodes / sleptAt / restedAtMin / countMin / dayMin·dayMax — monotone-satisfiable (the clock always reaches the window)
}

// ── HOST-CODE flag-write scan (§VM-01-E-FU). The write-set tree-walk above only
//    sees flags a QUEST bit sets; a gate flag is equally satisfiable if NON-quest
//    code sets it — a combat kill (`S_story.hornedSharkSlain = true`), a node
//    arrival (`S_story.dunfallAccessed`), a fishing catch, a Town-Crier event, an
//    NPC `missionBit:` grant (→ `_grantMissionBit` → `S_story[flag]=true`), a
//    readable-doc registry written by computed key (`S_story[doc.key]=`). Without
//    this the cross-ref over-reported 114 "written-by-nothing" gate reads, ~58% of
//    them false. This is a deliberately BROAD textual over-approximation: a flag
//    written by ANY of these forms ANYWHERE is treated as satisfiable. It can only
//    ever SHRINK the candidate list (never invent a soft-lock), so it trades a
//    little masking-risk for a report whose survivors are high-confidence genuine.
//    It also back-stops the 2 quests parseSanitized drops (quest_sea_01/_sb_01):
//    their authored `flag_write set:[…]` writes are caught textually here even
//    though the object never reaches `db`.
function scanFlagWrites(html) {
  const out = new Set();
  let m;
  const single = [
    /S_story\.([A-Za-z_][A-Za-z0-9_]*)\s*=(?![=>])/g,                        // S_story.flag = …
    /S_story\.([A-Za-z_][A-Za-z0-9_]*)\[[^\]]*\]\s*=(?![=>])/g,              // S_story.container[x] = …
    /S_story\[\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]\s*\]\s*=(?![=>])/g,        // S_story['flag'] = …
    /missionBit:\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g,                       // NPC/data mission-bit grant
    /_grantMissionBit\(\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g,                // direct grant call
    /\b(?:flag|key|flagBought):\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g,        // record fields consumed by S_story[rec.flag|key|flagBought]=
  ];
  for (const re of single) while ((m = re.exec(html))) out.add(m[1]);
  // flag_write bit literals — set:[…] / clear:[…] — a real write wherever it sits.
  const arr = /\b(?:set|clear):\s*\[([^\]]*)\]/g;
  while ((m = arr.exec(html))) { let s; const sr = /['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g; while ((s = sr.exec(m[1]))) out.add(s[1]); }
  return out;
}


// ── §AUDIT-03bh — the self-deadlock phase. ────────────────────────────────────
// QuestRuntime completes a quest when completion.flags are all true, so a
// flag_write in that same quest's onComplete can only ever run AFTER the flag is
// already true. The write is inert residue when some other quest or host code
// provides the flag, and FATAL when nothing else does: the quest can never
// complete, and everything gated behind the flag is stranded.
function selfDeadlocks(db, html, extrSection) {
  const questBody = extrSection(html, 'QUEST_DB');
  const outside = html.split(questBody).join('\n');
  // Deliberately NARROWER than scanFlagWrites: that scanner over-approximates on
  // purpose (a larger write pool keeps `unreachable` sound), and it counts
  // `flag:'X'` — which is how the textVariants / conditionals tables READ a flag.
  // Over-approximating here would hide a fatal, so this phase matches only forms
  // that actually assign.
  const hostOnly = new Set();
  for (const re of [
    /S_story\.([A-Za-z_][A-Za-z0-9_]*)\s*=(?![=>])/g,
    /S_story\[\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]\s*\]\s*=(?![=>])/g,
    /_grantMissionBit\(\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g,
    /missionBit:\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g,
  ]) { let m; while ((m = re.exec(outside))) hostOnly.add(m[1]); }
  { const arr = /\b(?:set|clear):\s*\[([^\]]*)\]/g; let m;
    while ((m = arr.exec(outside))) { let x; const sr = /['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g;
      while ((x = sr.exec(m[1]))) hostOnly.add(x[1]); } }
  const ownWrites = id => {
    const out = new Set();
    for (const b of (Array.isArray(db[id].onComplete) ? db[id].onComplete : []))
      if (b && b.kind === 'flag_write') (b.set || []).forEach(f => out.add(f));
    return out;
  };
  const otherQuestWriters = flag => Object.keys(db).filter(id => {
    const q = db[id], seen = new Set();
    const walk = bits => { for (const b of bits || []) {
      if (!b) continue;
      if (b.kind === 'flag_write') (b.set || []).forEach(f => seen.add(f));
      else if (b.kind === 'mission_bit' && b.flag) seen.add(b.flag);
      else if (b.kind === 'skill_check') { walk(b.onPass); walk(b.onFail); }
      else if (b.kind === 'choice') (b.options || []).forEach(o => walk(o.bits));
    } };
    walk(q.bits); walk(Array.isArray(q.onComplete) ? q.onComplete : []);
    return seen.has(flag);
  });
  const fatal = [], inert = [];
  for (const id of Object.keys(db)) {
    const q = db[id];
    const cf = (q.completion && Array.isArray(q.completion.flags)) ? q.completion.flags : [];
    if (!cf.length) continue;
    const own = ownWrites(id);
    for (const flag of cf) {
      if (!own.has(flag)) continue;
      const others = otherQuestWriters(flag).filter(x => x !== id);
      const byHost = hostOnly.has(flag);
      if (others.length || byHost) inert.push({ quest: id, flag, by: others.length ? ('quest ' + others.join(',')) : 'host code' });
      else fatal.push({ quest: id, flag });
    }
  }
  return { fatal, inert };
}

// Each surviving self-deadlock, named with the backlog row that owns its repair.
// A quest belongs here only while its fix needs an authoring change no completion
// term expresses; anything not listed fails the gate.
const KNOWN_SELF_DEADLOCK = {
  quest_wm_04: '\u00A7AUDIT-03au',
  quest_tl_01: '\u00A7AUDIT-03bh-FU',
};

// ── the analyser: pure over (db, startFlags, legacyClosures, hostWrites). ──────
// hostWrites (a Set of flag names written by non-quest code) is folded into BOTH
// the written-flag pool (cross-ref) AND the reachability start pool — a gate flag
// a combat kill / arrival / NPC grant provides is satisfiable in play. Folding it
// into reachability keeps the "unreachable" verdict SOUND: a strictly larger pool
// can only mark MORE quests reachable, so anything still unreachable is unreachable
// under any resource plan. readByNothing stays quest-only (dead quest writes).
function analyse(db, startFlags, legacyClosures, hostWrites) {
  const ids = Object.keys(db);
  const host = hostWrites || new Set();
  const seeds = [ scaffold([]), scaffold(startFlags) ];   // minimal + permissive
  const ND = [], ERR = [];
  const writeOf = {}, activationReads = {};
  const writtenFlags = new Set([...(startFlags || []), ...host]), readFlags = new Set();
  for (const id of ids) {
    const q = db[id];
    const w = questWrites(q, legacyClosures, ND, ERR, seeds);
    writeOf[id] = w;
    w.flags.forEach(f => writtenFlags.add(f));
    const aR = gateReads(q.gate, { flags: new Set(), quests: new Set(), battles: new Set(), resources: new Set() });
    const cR = gateReads(q.completion, { flags: new Set(), quests: new Set(), battles: new Set(), resources: new Set() });
    activationReads[id] = aR;
    aR.flags.forEach(f => readFlags.add(f)); cR.flags.forEach(f => readFlags.add(f));
  }
  // reachability fixpoint (monotone; gate TREE satisfiability, not flat flags)
  const pool = { flags: new Set([...(startFlags || []), ...host]), quests: new Set() };
  const reachable = new Set();
  let grew = true;
  while (grew) {
    grew = false;
    for (const id of ids) {
      if (reachable.has(id)) continue;
      if (gateSat(db[id].gate, pool)) {
        reachable.add(id); pool.quests.add(id);
        writeOf[id].flags.forEach(f => pool.flags.add(f));
        writeOf[id].quests.forEach(qq => pool.quests.add(qq));   // unlock'd quests become reachable too
        grew = true;
      }
    }
  }
  const unreachable = ids.filter(id => !reachable.has(id));
  const writtenByNothing = [...readFlags].filter(f => !writtenFlags.has(f)).sort();
  const questWritten = new Set(); for (const id of ids) writeOf[id].flags.forEach(f => questWritten.add(f));
  const readByNothing = [...questWritten].filter(f => !readFlags.has(f)).sort();
  return { ids, ND, ERR, unreachable, writtenByNothing, readByNothing, reachableCount: reachable.size };
}

// ═══════════════════════════════════════════════════════════════════════════
// SELF-TEST — validate the analyser against a synthetic graph (CI mode).
// ═══════════════════════════════════════════════════════════════════════════
function selftest() {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.error('  ✗ FAIL:', m); } };
  const db = {
    qA: { id: 'qA', gate: {},                    bits: [{ kind: 'flag_write', set: ['fA'] }] },
    qB: { id: 'qB', gate: { flags: ['fA'] },     bits: [{ kind: 'flag_write', set: ['fB'] }] },
    qC: { id: 'qC', gate: { flags: ['neverWritten'] }, bits: [{ kind: 'reward', xp: 1 }] },
    qD: { id: 'qD', gate: {},                    bits: [{ kind: 'flag_write', set: ['deadFlag'] }] },
    qE: { id: 'qE', gate: {},                    bits: [{ kind: '_legacy_fn', fn: null }] },  // deterministic closure below
    qF: { id: 'qF', gate: {},                    bits: [{ kind: '_legacy_fn', fn: null }] },  // nondeterministic closure below
    qG: { id: 'qG', gate: { all: [{ flags: ['fA'] }, { any: [{ flags: ['fB'] }, { flags: ['fZ'] }] }] }, bits: [] },  // reachable: fA∧(fB∨fZ), fB reachable
    qH: { id: 'qH', gate: { flags: ['hostFlag'] }, bits: [] },   // §VM-01-E-FU: gate met only by NON-quest code
  };
  const legacy = {
    qE: [{ params: [], body: '{ S_story.detFlag = true; }' }],
    qF: [{ params: [], body: '{ if (Math.random() > 0.5) S_story.ndFlag = true; }' }],
  };
  // §VM-01-E-FU: hostFlag is provided by non-quest code; neverWritten is not — the
  // host-write set must rescue the former without masking the latter.
  const host = new Set(['hostFlag']);
  const r = analyse(db, [], legacy, host);
  ok(r.unreachable.includes('qC'), 'qC (gate needs neverWritten) is unreachable');
  ok(!r.unreachable.includes('qB'), 'qB reachable via qA writing fA');
  ok(!r.unreachable.includes('qG'), 'qG reachable: fA (qA) ∧ fB (qB)');
  ok(r.writtenByNothing.includes('neverWritten'), 'neverWritten flagged written-by-nothing (soft-lock)');
  ok(r.readByNothing.includes('deadFlag'), 'deadFlag flagged read-by-nothing (dead write)');
  ok(r.ND.some(x => x.quest === 'qF'), 'qF nondeterministic closure detected');
  ok(!r.ND.some(x => x.quest === 'qE'), 'qE deterministic closure NOT flagged');
  // §VM-01-E-FU host-write filtering: a host-provided gate flag is NOT a soft-lock,
  // its reader IS reachable, and a genuinely-unwritten flag is still surfaced.
  ok(!r.writtenByNothing.includes('hostFlag'), 'hostFlag NOT written-by-nothing (host code provides it)');
  ok(!r.unreachable.includes('qH'), 'qH reachable via host-written hostFlag');
  ok(r.writtenByNothing.includes('neverWritten') && !r.writtenByNothing.includes('hostFlag'), 'host-write set shrinks candidates without masking a real soft-lock');
  // scanFlagWrites recognises every write form it is responsible for
  const scanned = scanFlagWrites([
    'S_story.direct = true;', 'S_story.container[node.code] = 1;', "S_story['bracket'] = 2;",
    "npc: { missionBit: 'mbFlag' }", "_grantMissionBit('grantFlag')",
    "{ kind:'flag_write', set:['setFlag','setFlag2'], clear:['clrFlag'] }",
    "WM_DOCS = [{ key: 'keyFlag' }]", "{ flag: 'evtFlag' }", "{ flagBought: 'shopFlag' }",
  ].join('\n'));
  ['direct', 'container', 'bracket', 'mbFlag', 'grantFlag', 'setFlag', 'setFlag2', 'clrFlag', 'keyFlag', 'evtFlag', 'shopFlag']
    .forEach(f => ok(scanned.has(f), 'scanFlagWrites captures ' + f));
  console.log(`\ncheck:questgraph selftest — ${pass} passed, ${fail} failed`);
  if (fail) { process.exit(1); }
  console.log('  ✓ analyser correct on the synthetic graph (reachability · cross-ref · nondeterminism detector)');
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
function startFlagsFromDefaults(html) {
  // parse the _S_DEFAULTS() literal for keys initialised truthy — the start state.
  const i = html.indexOf('_S_DEFAULTS');
  const braceOpen = html.indexOf('{', html.indexOf('return', i));
  if (braceOpen < 0) return [];
  const src = html.slice(braceOpen, matchBrace(html, braceOpen) + 1);
  const flags = [];
  const re = /(\w+)\s*:\s*true\b/g; let m;
  while ((m = re.exec(src))) flags.push(m[1]);
  return flags;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--selftest')) return void selftest();

  const htmlPath = path.join(__dirname, '..', '..', 'play.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const CORE = require(path.join(__dirname, '..', 'js', 'wbapi-core.js'))._parse;
  const db = CORE.parseSanitized(CORE.extrSection(html, 'QUEST_DB'), 'QUEST_DB');
  const legacy = extractLegacyClosures(html);
  const startFlags = startFlagsFromDefaults(html);
  const hostWrites = scanFlagWrites(html);
  const r = analyse(db, startFlags, legacy, hostWrites);
  const dl = selfDeadlocks(db, html, CORE.extrSection);
  const dlUnexpected = dl.fatal.filter(x => !KNOWN_SELF_DEADLOCK[x.quest]);

  const report = {
    quests: r.ids.length,
    reachable: r.reachableCount,
    unreachable: r.unreachable.length,
    nondeterministic: r.ND.length,
    unprobeable: r.ERR.length,
    hostWrittenFlags: hostWrites.size,
    writtenByNothing: r.writtenByNothing.length,
    readByNothing: r.readByNothing.length,
    selfDeadlockFatal: dl.fatal.length,
    selfDeadlockInert: dl.inert.length,
  };
  if (args.includes('--json')) { console.log(JSON.stringify({ ...report, ND: r.ND, ERR: r.ERR, unreachable: r.unreachable, writtenByNothing: r.writtenByNothing, readByNothing: r.readByNothing, selfDeadlockFatal: dl.fatal, selfDeadlockInert: dl.inert }, null, 2)); return; }

  console.log('§VM-01-E — quest-graph soft-lock report');
  console.log('  quests analysed        :', report.quests);
  console.log('  host flag-writers found:', report.hostWrittenFlags, '(non-quest code that sets a gate flag — combat/arrival/fishing/NPC-grant/readable; folded into the write + reach pools, §VM-01-E-FU)');
  console.log('  reachable (monotone)   :', report.reachable);
  console.log('  unreachable candidates :', report.unreachable, '(activation gate needs a flag/quest NO reachable quest AND no host code provides — genuine after §VM-01-E-FU)');
  console.log('  written-by-nothing     :', report.writtenByNothing, '(gate reads it, NOTHING — quest bit or host code — writes it: real soft-lock / typo)');
  console.log('  read-by-nothing        :', report.readByNothing, '(quest bit writes it, no gate reads it — dead-write / typo candidates; still quest-scoped, host reads not subtracted)');
  console.log('  prober-gaps (threw)    :', report.unprobeable, r.ERR.length ? '(closure referenced host state the sandbox does not model — prober limitation, NOT a game defect)' : '✓');
  console.log('  residual nondeterminism:', report.nondeterministic, r.ND.length ? '' : '✓ (the plague coin-flip was the last one; QUEST_DB is now static-analysable)');
  if (r.ND.length) { console.log('\n  ✗ NONDETERMINISTIC quest-data closures (same seed → divergent write-set):');
    r.ND.forEach(x => console.log('     -', x.quest, 'nondet writes', (x.keys || []).join(','), '·', x.body)); }
  if (r.ERR.length) { console.log('\n  ⚠ prober-gaps (unprobeable — reported, not fatal):');
    r.ERR.forEach(x => console.log('     -', x.quest, 'THREW:', x.error, '·', x.body)); }
  if (r.writtenByNothing.length) {
    // group the genuine survivors by family prefix (waw001a2 → waw, crl002Complete → crl) so
    // a systemic naming-mismatch arc reads as one finding, not N scattered flags.
    const fam = {};
    for (const f of r.writtenByNothing) { const k = (f.match(/^([a-z]+)/) || [null, f])[1]; (fam[k] = fam[k] || []).push(f); }
    console.log('\n  written-by-nothing — genuine candidates by family:');
    Object.keys(fam).sort().forEach(k => console.log('     ·', (k + ' ×' + fam[k].length).padEnd(10), fam[k].join(', ')));
  }

  console.log('\n  self-deadlock (completion.flags ∩ own onComplete flag_write):');
  console.log('     fatal (no other writer):', dl.fatal.length, dlUnexpected.length ? '' : '✓ (each one accounted for)');
  dl.fatal.forEach(x => console.log('     ✗', x.quest, '/', x.flag,
    KNOWN_SELF_DEADLOCK[x.quest] ? '— known, owned by ' + KNOWN_SELF_DEADLOCK[x.quest] : '— UNACCOUNTED: this quest can never complete'));
  console.log('     inert (flag has an independent writer):', dl.inert.length, '— each classified, not tolerated by threshold:');
  dl.inert.forEach(x => console.log('       ·', (x.quest + ' / ' + x.flag).padEnd(46), 'written by', x.by));
  if (dlUnexpected.length) {
    console.error('\ncheck:questgraph FAILED — ' + dlUnexpected.length + ' quest(s) wait on a flag only their own onComplete sets, with no other writer: they can never complete (§AUDIT-03bh).');
    process.exit(1);
  }

  // Hard invariant: zero residual NONDETERMINISM in quest data (Option A's binary
  // gate). Prober-gaps (ERR) are a limitation of the sandbox, not a game defect —
  // reported, never fatal.
  if (r.ND.length) { console.error('\ncheck:questgraph FAILED — quest data still contains a nondeterministic effect (see above).'); process.exit(1); }
  console.log('\ncheck:questgraph OK — no residual nondeterminism in quest data (the §VM-01-E blocker is cleared).');
}

main();
