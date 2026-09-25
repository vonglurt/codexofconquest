// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
// quest-context.js — §EDITOR-04 increment 1: a questline's neighbourhood in one answer.
//
// Given a node code or an arc, returns the quests in scope, the people anchored there,
// every flag those quests read and write, which read flags nothing in the file writes,
// the self-deadlocks among them, and the node's cell primacy. Flag reads come from the
// declarative gate grammar and writer detection from check:questgraph's own scanners,
// so this answer and the CI gate cannot disagree about what is reachable.

const QG = require('../scripts/check-questgraph.js');

function bitWrites(bits, out) {
  for (const b of bits || []) {
    if (!b || typeof b !== 'object') continue;
    if (b.kind === 'flag_write') (b.set || []).forEach(f => out.add(f));
    else if (b.kind === 'mission_bit' && b.flag) out.add(b.flag);
    else if (b.kind === 'skill_check') { bitWrites(b.onPass, out); bitWrites(b.onFail, out); }
    else if (b.kind === 'choice') (b.options || []).forEach(o => bitWrites(o.bits, out));
  }
  return out;
}

const emptyReads = () => ({ flags: new Set(), quests: new Set(), battles: new Set(), resources: new Set() });

// First-wins, in NODE_MAP key order: the primary is CELL_GRID[key][0] on the client.
function cellOf(W, code) {
  const at = W.nodeCoords[code] || W.nodeMap[code] || {};
  if (at.r == null || at.c == null) return null;
  const key = `${at.r},${at.c}`;
  const here = Object.keys(W.nodeMap).filter(k => {
    const p = W.nodeCoords[k] || W.nodeMap[k] || {};
    return p.r != null && p.c != null && `${p.r},${p.c}` === key;
  });
  return { r: at.r, c: at.c, primary: here[0], isPrimary: here[0] === code, sharedWith: here.filter(k => k !== code) };
}

// The file-wide facts every scope needs, computed once per loaded source text.
let _cacheSrc = null, _cache = null;
function worldFacts(W) {
  const html = W._rawSrc || '';
  if (html === _cacheSrc && _cache) return _cache;
  const written = new Set([...QG.scanFlagWrites(html), ...QG.startFlagsFromDefaults(html)]);
  for (const q of Object.values(W.questDb)) {
    bitWrites(q.bits, written);
    bitWrites(Array.isArray(q.onComplete) ? q.onComplete : [], written);
  }
  const dl = QG.selfDeadlocks(W.questDb, html, W._parse.extrSection);
  _cacheSrc = html;
  _cache = { written, deadlocks: [...dl.fatal.map(d => ({ ...d, fatal: true })), ...dl.inert.map(d => ({ ...d, fatal: false }))] };
  return _cache;
}

function questScope(W, scope) {
  if (scope.node) {
    const code = W._findKey(W.nodeMap, scope.node);
    if (!code) return { error: `node "${scope.node}" not found` };
    const ids = new Set([...(W._questsByNode[code] || []), ...(W._questsByWaypoint[code] || [])]);
    return { code, ids: [...ids] };
  }
  if (scope.arc) {
    const ids = W._questArcs[scope.arc];
    if (!ids) return { error: `arc "${scope.arc}" not found` };
    return { ids: [...ids] };
  }
  return { error: 'a node code or an arc is required' };
}

function questContext(W, scope) {
  const sc = questScope(W, scope);
  if (sc.error) return { ok: false, error: sc.error };
  const facts = worldFacts(W);
  const inScope = new Set(sc.ids);

  const reads = new Map(), writes = new Map(), npcKeys = new Set();
  const note = (map, flag, id) => { if (!map.has(flag)) map.set(flag, []); map.get(flag).push(id); };
  const quests = sc.ids.sort().map(id => {
    const q = W.questDb[id] || {};
    const gate = QG.gateReads(q.gate, emptyReads());
    const completion = QG.gateReads(q.completion, emptyReads());
    const w = bitWrites(q.bits, new Set());
    bitWrites(Array.isArray(q.onComplete) ? q.onComplete : [], w);
    gate.flags.forEach(f => note(reads, f, id));
    completion.flags.forEach(f => note(reads, f, id));
    w.forEach(f => note(writes, f, id));
    if (q.npc) npcKeys.add(W.npcCanonicalKey(q.npc));
    return {
      id, title: q.title || null, type: q.type || null,
      activateNode: q.activateNode || null, waypointNode: q.waypointNode || null, npc: q.npc || null,
      gateFlags: [...gate.flags].sort(), gateQuests: [...gate.quests].sort(),
      completionFlags: [...completion.flags].sort(), writes: [...w].sort(),
    };
  });

  const unwritten = [...reads.keys()].filter(f => !facts.written.has(f)).sort().map(f => ({
    flag: f, readBy: reads.get(f), knownAs: QG.KNOWN_UNWRITTEN_FLAG[f] || null,
  }));
  const deadlocks = facts.deadlocks.filter(d => inScope.has(d.quest))
    .map(d => ({ ...d, knownAs: QG.KNOWN_SELF_DEADLOCK[d.quest] || null }));

  let node = null;
  if (sc.code) {
    const n = W.nodeMap[sc.code];
    if (n.npc) npcKeys.add(W.npcCanonicalKey(String(n.npc).toLowerCase().replace(/\s/g, '_')));
    node = { code: sc.code, label: n.label || null, npc: n.npc || null, cell: cellOf(W, sc.code) };
  }
  const npcs = [...npcKeys].sort().map(k => {
    const p = W.birkaNpcs[k] || ((W.npcDialogues[k] || {}).meta) || {};
    return { key: k, name: p.name || null, node: p.node || null, known: W.npcKeyOk(k), quests: (W._questsByNpc[k] || []).length };
  });

  const objectMap = m => Object.fromEntries([...m.keys()].sort().map(k => [k, m.get(k)]));
  const traps = {
    unstandable: node && node.cell && !node.cell.isPrimary ? 1 : 0,
    unwrittenFlags: unwritten.length,
    fatalDeadlocks: deadlocks.filter(d => d.fatal).length,
  };
  return {
    ok: true,
    scope: sc.code ? { node: sc.code } : { arc: scope.arc },
    node, quests, npcs,
    flags: { reads: objectMap(reads), writes: objectMap(writes), unwritten },
    deadlocks, traps,
  };
}

module.exports = { questContext, bitWrites, cellOf };
