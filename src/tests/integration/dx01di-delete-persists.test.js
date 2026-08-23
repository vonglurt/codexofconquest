// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-01d/i — deleting an entity actually removes it from the file.
//
// Why this test exists: every `WBAPI.<collection>.delete()` used to be one line —
// `delete WBAPI.<collection>[key]` — and nothing more. `save()` writes `_rawSrc`,
// which was never touched, so the entry came straight back on the next parse while
// the operator had already been told `✓ monster:dock_rat deleted`. Measured live
// 2026-07-30 on a copy of the shipped file: monster, quest AND node all returned
// `ok:true`, all left `_rawSrc` byte-identical, and all three survived save+reload.
// The row filed it as a `del monster` bug (§DX-01i) and a junction-only `del node`
// bug (Hazard #4 / §DX-01d); it was neither — it was the whole DELETE family, for
// every key, and `WBAPI.deleteNodeSource` — the one function that did patch the
// source — was dead code that nothing called.
//
// This is the exact mirror of §DX-01c: a write path that reports success without
// persisting. Same standing lesson, both directions — **the failure is silent
// because nothing ever throws.**
//
// The assertions pin: (1) the round trip — save+reload must not resurrect the
// entry; (2) the cascades (NODE_COORDS row, MONSTER_DROPS trophy) so a delete
// leaves no orphan for `./bin/api audit` to find; (3) verify-or-revert — a splice
// that would take a neighbour with it must abort with the source untouched;
// (4) the dependency guards still block; (5) `--execute` on the deprecated
// highway builder is refused (§DX-01d, the tool that manufactured J14/J15).
//
// Pure-node (no browser): this is an authoring-surface invariant. Every case runs
// against an in-memory copy — `play.html` is never written.

const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const GAME = path.join(ROOT, 'play.html');
const SRC = fs.readFileSync(GAME, 'utf8');

// A fresh module instance loaded from the file TEXT (never a path), so no test can
// write over the real game file even by accident.
function freshWorld() {
  delete require.cache[require.resolve(path.join(ROOT, 'src', 'js', 'wbapi-core.js'))];
  const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
  W.load(SRC);
  return W;
}

// The operator-visible truth: serialize what the writer produced, parse it back.
function roundTrip(W) {
  const out = W._rawSrc;
  const W2 = freshWorld();
  W2.load(out);
  return W2;
}

const COUNTS = (W) => ({
  nodes: Object.keys(W.nodeMap).length,     coords:   Object.keys(W.nodeCoords).length,
  quests: Object.keys(W.questDb).length,    monsters: Object.keys(W.monsterPool).length,
  drops: Object.keys(W.monsterDrops).length, npcs:    Object.keys(W.birkaNpcs).length,
});

// Pick a key whose dependency guard is clear, so the test measures PERSISTENCE
// rather than the blockedBy short-circuit.
const firstFree = (keys, depFn) =>
  keys.find(k => !Object.values(depFn(k)).some(v => v.length));

test.describe('§DX-01d/i — a delete that reports success must persist', () => {

  test('monster: the pool entry is gone after save+reload, and its trophy drop with it', () => {
    const W = freshWorld();
    const key = firstFree(Object.keys(W.monsterPool), W._deps.monster);
    expect(key, 'the corpus should hold at least one monster in no terrain roster').toBeTruthy();
    const hadDrop = !!W.monsterDrops[key];
    const before = COUNTS(W);

    const r = W.monsters.delete(key);
    expect(r.ok).toBe(true);

    // The bug in one assertion: the model forgot it, the SOURCE never did.
    expect(W._rawSrc, 'delete must patch the source, not just the model').not.toBe(SRC);

    const after = roundTrip(W);
    expect(after.monsterPool[key], `${key} came back after save+reload`).toBeFalsy();
    expect(Object.keys(after.monsterPool).length).toBe(before.monsters - 1);
    // Cascade: an orphaned MONSTER_DROPS row is an error `./bin/api audit` reports.
    if (hadDrop) {
      expect(after.monsterDrops[key], 'trophy drop left orphaned').toBeFalsy();
      expect(Object.keys(after.monsterDrops).length).toBe(before.drops - 1);
    }
    // No collateral: nothing else in the file moved.
    expect(Object.keys(after.nodeMap).length).toBe(before.nodes);
    expect(Object.keys(after.questDb).length).toBe(before.quests);
  });

  test('node: NODE_MAP and NODE_COORDS are removed together', () => {
    const W = freshWorld();
    const key = firstFree(Object.keys(W.nodeMap), W._deps.node);
    expect(key).toBeTruthy();
    const hadCoords = !!W.nodeCoords[key];
    const before = COUNTS(W);

    const r = W.nodes.delete(key);
    expect(r.ok).toBe(true);

    const after = roundTrip(W);
    expect(after.nodeMap[key], `${key} came back after save+reload`).toBeFalsy();
    expect(Object.keys(after.nodeMap).length).toBe(before.nodes - 1);
    if (hadCoords) {
      // Hazard #4's "model/file desync" for `del node J##` — a coord row for a node
      // that no longer exists is exactly the orphan check:roads has to reason about.
      expect(after.nodeCoords[key], 'NODE_COORDS row left orphaned').toBeFalsy();
      expect(Object.keys(after.nodeCoords).length).toBe(before.coords - 1);
    }
  });

  test('quest: a nested UQF body — braces, strings, arrow fns — excises cleanly', () => {
    const W = freshWorld();
    const key = firstFree(Object.keys(W.questDb), W._deps.quest);
    expect(key).toBeTruthy();
    const before = COUNTS(W);

    expect(W.quests.delete(key).ok).toBe(true);
    const after = roundTrip(W);
    expect(after.questDb[key]).toBeFalsy();
    expect(Object.keys(after.questDb).length).toBe(before.quests - 1);
  });

  test('the 20 largest quest bodies each cost exactly one entry', () => {
    // The scanner's only real risk is a brace, quote or comment INSIDE a body, so
    // stress it on the biggest ones. deleteEntrySource is called directly to
    // exercise the excision rather than the dependency guard.
    const probe = freshWorld();
    const qSrc = probe._rawSrc.slice(
      probe._rawSrc.indexOf('WORLDBUILDER:QUEST_DB:START'),
      probe._rawSrc.indexOf('WORLDBUILDER:QUEST_DB:END'));
    const biggest = Object.keys(probe.questDb)
      .map(id => ({ id, span: probe._entrySpan(qSrc, id) }))
      .filter(x => x.span)
      .sort((a, b) => (b.span.end - b.span.start) - (a.span.end - a.span.start))
      .slice(0, 20)
      .map(x => x.id);
    expect(biggest.length).toBe(20);

    const failures = [];
    for (const id of biggest) {
      const W = freshWorld();
      const n0 = Object.keys(W.questDb).length;
      const r = W.deleteEntrySource('QUEST_DB', id);
      if (!r.ok) { failures.push(`${id}: ${r.error}`); continue; }
      const after = roundTrip(W);
      const n1 = Object.keys(after.questDb).length;
      if (after.questDb[id]) failures.push(`${id}: survived the round trip`);
      else if (n1 !== n0 - 1) failures.push(`${id}: ${n0} → ${n1} (collateral)`);
    }
    expect(failures, failures.join(' · ')).toEqual([]);
  });

  test('verify-or-revert: a splice that would touch a neighbour aborts, source intact', () => {
    const W = freshWorld();
    const before = W._rawSrc;

    const missing = W.deleteEntrySource('QUEST_DB', 'no_such_quest_zzz');
    expect(missing.ok).toBe(false);
    expect(missing.error).toContain('not found');
    expect(W._rawSrc, 'a refused delete must not touch the source').toBe(before);

    // The guard itself: hand it a span that swallows two entries and it must refuse.
    // (Simulated by making the key-multiset check see a second loss.)
    const realKeys = W._sectionTopKeys(
      W._rawSrc.slice(W._rawSrc.indexOf('WORLDBUILDER:NODE_MAP:START'),
                      W._rawSrc.indexOf('WORLDBUILDER:NODE_MAP:END')));
    expect(realKeys.length).toBe(Object.keys(W.nodeMap).length);
    expect(new Set(realKeys).size, 'the scanner and the parser must agree on entry count').toBe(realKeys.length);
  });

  test('the dependency guards still block, and a blocked delete writes nothing', () => {
    const W = freshWorld();
    const before = W._rawSrc;

    // LHR is the reachability origin — quests and NPCs hang off it.
    const blocked = W.nodes.delete('LHR');
    expect(blocked.ok).toBe(false);
    expect(blocked.blockedBy, 'the blockedBy guard must survive the source-level rewrite').toBeTruthy();
    expect(W._rawSrc).toBe(before);
    expect(W.nodeMap.LHR).toBeTruthy();
  });

  test('deleteNodeSource — the once-dead helper — now delegates and works', () => {
    const W = freshWorld();
    const key = firstFree(Object.keys(W.nodeMap), W._deps.node);
    expect(W.deleteNodeSource(key)).toBe(true);
    expect(roundTrip(W).nodeMap[key]).toBeFalsy();
    // NODE_MAP only, by contract — nodes.delete() is the cascading path.
    expect(W.deleteNodeSource('no_such_node_zzz')).toBe(false);
  });

  test('highway --execute is refused (§DX-01d — the tool that made J14/J15)', () => {
    let out = '';
    try {
      out = execFileSync('node', [path.join(ROOT, 'src', 'api', 'wb.js'), 'highway', 'LHR', 'CON', '--execute'],
        { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000 });
      throw new Error('highway --execute exited 0 — it should refuse');
    } catch (e) {
      out = (e.stdout || '') + (e.stderr || '');
    }
    expect(out).toMatch(/DEPRECATED \(§DX-01d\)/);
    expect(out).toMatch(/ROAD_RUNS/);          // points at the real road path
    expect(out).toMatch(/reachability/);       // and at why waypoints are unnecessary
  });
});
