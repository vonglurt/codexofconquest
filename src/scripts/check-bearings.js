#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ki — a compass bearing written in node prose is a navigation instruction, and
// until this gate nothing read one. §CELL-01 retired the `N/E/S/W` node pointers and
// positions became `{r,c}` through `CELL_GRID`, so the only remaining place in the file
// where a direction is stated to the player is authored English. `check:noderegs` scans
// comparison literals and `check:legacycodes` scans `*.md`; an authored string is
// §AUDIT-03s's blind spot, and `BMA.text` sat inside it saying the road NORTH went to a
// place twelve rows SOUTH.
//
// WHAT IS A CHECKABLE CLAIM. Three shapes put a bearing beside a place name and only two
// of them assert anything about where that place is:
//
//   DIRECTIVE  "The road south goes to the Unbanked Quarter."   bearing = the way there
//   LOCATIVE   "A trading city on the Rhine north of Worms."    bearing = where THIS is,
//              so the assertion is the OPPOSITE octant
//   FEATURE    "Damascus's southern gate" · "the east wall of   bearing belongs to a
//              the Neon Undercity" · "the eastern run"          feature OF that place
//
// FEATURE is excluded by construction rather than exempted one by one: it carries no
// inter-node claim at all, so a verdict on it would be noise with a number attached, and
// a list of eleven named exemptions would read as eleven tolerated defects. The corpus
// is 11 FEATURE pairs against 10 asserted ones — unexcluded, it would be the majority.
//
// A name matched as a MODIFIER of some other feature is not a reference to the node:
// "the alleys north of the Birka market" names no node, because the Birka market is not
// one — `NODE_MAP` has four markets and none of them is in Birka.
//
// A bearing binds to the nearest name with NO OTHER BEARING BETWEEN THEM. `SEA.text`
// sweeps four quadrants in one sentence, and without that rule every bearing in it pairs
// with every place in it.
//
// TOLERANCE. A bearing is satisfied by its own octant or either neighbour (N accepts
// NE and NW), because prose names a heading and the grid names a cell. Two nodes in the
// same cell assert nothing and are reported UNDEFINED, not failed.
//
// Run: node scripts/check-bearings.js [--selftest]
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const WBAPI = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));

const BEARINGS = {
  north: 'N', northern: 'N', northward: 'N',
  south: 'S', southern: 'S', southward: 'S',
  east: 'E', eastern: 'E', eastward: 'E',
  west: 'W', western: 'W', westward: 'W',
  northeast: 'NE', northeastern: 'NE', northwest: 'NW', northwestern: 'NW',
  southeast: 'SE', southeastern: 'SE', southwest: 'SW', southwestern: 'SW',
};
const BEARING_RE = new RegExp('\\b(' + Object.keys(BEARINGS).join('|') + ')\\b', 'gi');

// Octant → the octants that satisfy it. One neighbour either side.
const AGREE = {
  N: ['N', 'NE', 'NW'], S: ['S', 'SE', 'SW'], E: ['E', 'NE', 'SE'], W: ['W', 'NW', 'SW'],
  NE: ['NE', 'N', 'E'], NW: ['NW', 'N', 'W'], SE: ['SE', 'S', 'E'], SW: ['SW', 'S', 'W'],
};
const OPPOSITE = { N: 'S', S: 'N', E: 'W', W: 'E', NE: 'SW', SW: 'NE', NW: 'SE', SE: 'NW' };

// A place name directly before one of these is qualifying it, not being pointed at.
const MODIFIER_NOUNS = new RegExp('^\\s+(market|gate|wall|road|coast|quarter|district|' +
  'shore|harbor|harbour|run|side|end|bank|approach|tower|hall|street|square|docks?|' +
  'lane|path|crossing|bridge|ford|pass|valley|hill|ridge|river|lake|sea|star)\\b');

// A bearing directly before one of these is describing a feature, not a heading.
const FEATURE_NOUNS = new RegExp('^\\s+(wall|gate|coast|run|side|end|shore|harbor|harbour|' +
  'bank|approach|face|quarter|district|half|sector|edge|window|corner|tower|room|door|' +
  'wing|aisle|stair|arch|slope|ridge|rim)\\b');

// Label words too generic to identify a node on their own.
const GENERIC = new Set(['the', 'open water', 'approach', 'harbor', 'harbour', 'market',
  'shore', 'road', 'gate', 'court', 'quarter', 'city', 'village', 'inn', 'hall',
  'passage', 'crown', 'mire', 'arabia']);

// A bearing kept in the corpus against the grid. The value is why it stays.
const EXEMPT = {};

function buildNameIndex(nodeMap) {
  const index = new Map();
  const add = (name, code) => {
    const k = String(name || '').trim();
    if (k.length < 4 || GENERIC.has(k.toLowerCase())) return;
    if (!index.has(k)) index.set(k, new Set());
    index.get(k).add(code);
  };
  for (const [code, node] of Object.entries(nodeMap)) {
    const label = node.label || '';
    if (!label) continue;
    add(label, code);
    for (const seg of label.split(/\s*—\s*/)) {
      add(seg, code);
      add(seg.replace(/^The\s+/, ''), code);
    }
  }
  return index;
}

function octant(from, to, coords) {
  const a = coords[from], b = coords[to];
  if (!a || !b) return null;
  const dr = b.r - a.r, dc = b.c - a.c;          // N is r-1 (__MOVER_DELTAS)
  const cells = Math.max(Math.abs(dr), Math.abs(dc));
  if (!cells) return { oct: null, dr, dc, cells: 0 };
  const deg = (Math.atan2(-dr, dc) * 180 / Math.PI + 360) % 360;   // 0 = E, 90 = N
  const oct = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'][Math.round(deg / 45) % 8];
  return { oct, dr, dc, cells };
}

function classify(sentence, bearing, name) {
  const afterName = sentence.slice(name.at + name.text.length);
  const afterBearing = sentence.slice(bearing.at + bearing.text.length);
  if (name.at < bearing.at && /^'s\b|^s'\b/.test(afterName)) return 'FEATURE';
  if (FEATURE_NOUNS.test(afterBearing)) return 'FEATURE';
  if (name.at > bearing.at && /^\s+(of|from)\b/.test(afterBearing)) return 'LOCATIVE';
  return 'DIRECTIVE';
}

function pairs(nodeMap, coords) {
  const index = buildNameIndex(nodeMap);
  const names = [...index.keys()].sort((a, b) => b.length - a.length);
  const found = [];
  for (const [code, node] of Object.entries(nodeMap)) {
    for (const sentence of String(node.text || '').split(/(?<=[.!?])\s+/)) {
      BEARING_RE.lastIndex = 0;
      const bearings = [...sentence.matchAll(BEARING_RE)]
        .map(m => ({ text: m[1], at: m.index, oct: BEARINGS[m[1].toLowerCase()] }));
      if (!bearings.length) continue;
      const places = [];
      for (const name of names) {
        const re = new RegExp('\\b' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
        const m = re.exec(sentence);
        if (!m) continue;
        if (MODIFIER_NOUNS.test(sentence.slice(m.index + name.length))) continue;
        const codes = [...index.get(name)].filter(c => c !== code);
        if (!codes.length) continue;
        if (places.some(p => p.text.includes(name) && Math.abs(p.at - m.index) < p.text.length)) continue;
        places.push({ text: name, at: m.index, codes });
      }
      if (!places.length) continue;
      for (const b of bearings) {
        const reachable = places.filter(p => {
          const lo = Math.min(b.at + b.text.length, p.at + p.text.length);
          const hi = Math.max(b.at, p.at);
          if (hi <= lo) return true;
          BEARING_RE.lastIndex = 0;
          return !BEARING_RE.test(sentence.slice(lo, hi));
        });
        if (!reachable.length) continue;
        const near = reachable.reduce((best, p) =>
          Math.abs(p.at - b.at) < Math.abs(best.at - b.at) ? p : best);
        const kind = classify(sentence, b, near);
        const want = kind === 'LOCATIVE' ? OPPOSITE[b.oct] : b.oct;
        const candidates = near.codes.map(c => ({ code: c, geo: octant(code, c, coords) }))
          .filter(x => x.geo);
        found.push({ from: code, sentence: sentence.trim(), kind, want,
          said: b.oct, place: near.text, candidates });
      }
    }
  }
  return found;
}

function audit(nodeMap, coords, exempt = EXEMPT) {
  const asserted = pairs(nodeMap, coords).filter(p => p.kind !== 'FEATURE');
  const findings = [], undefinedPairs = [], exempted = [];
  for (const p of asserted) {
    const key = `${p.from}:${p.said}:${p.place}`;
    const live = p.candidates.filter(c => c.geo.cells > 0);
    if (!live.length) { undefinedPairs.push(p); continue; }
    if (live.some(c => AGREE[p.want].includes(c.geo.oct))) continue;
    if (key in exempt) { exempted.push({ ...p, why: exempt[key] }); continue; }
    findings.push({ ...p, key, live });
  }
  return { asserted, findings, undefinedPairs, exempted };
}

module.exports = { buildNameIndex, octant, classify, pairs, audit, BEARINGS, AGREE, EXEMPT };

if (require.main === module) {
  if (process.argv.includes('--selftest')) {
    let pass = 0, fail = 0;
    const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL:', m); } };
    const coords = { A: { r: 10, c: 10 }, N: { r: 2, c: 10 }, S: { r: 18, c: 10 },
      E: { r: 10, c: 18 }, W: { r: 10, c: 2 }, Z: { r: 10, c: 10 } };
    const mk = t => ({
      A: { code: 'A', label: 'Origin Field', text: t },
      N: { code: 'N', label: 'Northgate', text: '' }, S: { code: 'S', label: 'Southmere', text: '' },
      E: { code: 'E', label: 'Eastwick', text: '' }, W: { code: 'W', label: 'Westford', text: '' },
      Z: { code: 'Z', label: 'Samecell Priory', text: '' },
    });
    const run = t => audit(mk(t), coords);

    ok(octant('A', 'N', coords).oct === 'N', 'N is r-1: a lower row is north');
    ok(octant('A', 'S', coords).oct === 'S', 'a higher row is south');
    ok(octant('A', 'E', coords).oct === 'E', 'a higher column is east');
    ok(octant('A', 'Z', coords).cells === 0, 'the same cell is zero cells away');

    ok(run('The road north goes to Northgate.').findings.length === 0,
      'a DIRECTIVE bearing that matches the grid passes');
    ok(run('The road north goes to Southmere.').findings.length === 1,
      'a DIRECTIVE bearing pointing the wrong way is caught');
    ok(run('The road north goes to Southmere.').findings[0].want === 'N',
      'a DIRECTIVE finding wants the octant the prose said');
    ok(run('A hamlet north of Southmere.').findings.length === 0,
      'a LOCATIVE bearing is satisfied by the OPPOSITE octant');
    ok(run('A hamlet north of Northgate.').findings.length === 1,
      'a LOCATIVE bearing read as a DIRECTIVE one would pass — it is caught');
    ok(run('A hamlet north of Northgate.').findings[0].want === 'S',
      'a LOCATIVE finding wants the opposite of what the prose said');
    ok(run('Southmere\'s northern gate is shut.').asserted.length === 0,
      'a possessive FEATURE bearing asserts nothing and is excluded');
    ok(run('The north wall of Southmere is shut.').asserted.length === 0,
      'a FEATURE noun after the bearing excludes the pair');
    ok(run('The alleys north of the Northgate market are narrow.').asserted.length === 0,
      'a name used as a MODIFIER of another feature is not a reference to the node');
    ok(run('The road north goes to Samecell Priory.').findings.length === 0 &&
       run('The road north goes to Samecell Priory.').undefinedPairs.length === 1,
      'two nodes in one cell assert nothing and are reported UNDEFINED');
    ok(run('Water north toward Northgate, water south toward Southmere.').findings.length === 0,
      'a bearing binds past no other bearing, so a two-quadrant sweep scores both correctly');
    ok(run('Water north toward Northgate, water south toward Eastwick.').findings.length === 1,
      'and the wrong half of a sweep is still caught alone');
    ok(run('The road northeast goes to Northgate.').findings.length === 0,
      'an octant is satisfied by either neighbour — NE accepts N');
    ok(run('The road northeast goes to Westford.').findings.length === 1,
      'but not by the opposite side of the compass');
    ok(audit(mk('The road north goes to Southmere.'), coords, { 'A:N:Southmere': 'plant' })
      .findings.length === 0, 'a finding named in EXEMPT is exempted, not failed');
    ok(audit(mk('The road north goes to Southmere.'), coords, { 'A:N:Southmere': 'plant' })
      .exempted.length === 1, 'and it is still reported, with its reason');

    if (fail) { console.log(`\n✗ check-bearings selftest: ${fail} FAILED, ${pass} passed`); process.exit(1); }
    console.log(`✓ check-bearings selftest: all ${pass} checks pass`);
  } else {
    WBAPI.load(path.join(ROOT, 'play.html'));
    const { asserted, findings, undefinedPairs, exempted } = audit(WBAPI.nodeMap, WBAPI.nodeCoords);
    for (const f of findings) {
      console.log(`  ✗ ${f.from} says ${f.said} to ${f.place} — the grid says ` +
        f.live.map(c => `${c.code} ${c.geo.oct} (${c.geo.cells} cells, dr ${c.geo.dr}, dc ${c.geo.dc})`).join(' / '));
      console.log(`      "${f.sentence}"`);
      console.log(`      exempt as '${f.key}' with a reason, or correct the bearing.`);
    }
    for (const e of exempted) console.log(`  · exempt ${e.from}:${e.said}:${e.place} — ${e.why}`);
    if (findings.length) {
      console.log(`\n✗ check-bearings: ${findings.length} prose bearing(s) contradicted by the grid`);
      process.exit(1);
    }
    console.log(`✓ §DX-02ki prose bearings: ${asserted.length} asserted bearing→node pairs agree with ` +
      `NODE_COORDS · ${undefinedPairs.length} undefined (same cell) · ${exempted.length} exempt by name`);
  }
}
