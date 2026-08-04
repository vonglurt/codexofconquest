// SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com
// §AUDIT-03m — the live docs stop speaking 26×16.
//
// Why this test exists: §AUDIT-03l generated the node reference and quarantined `maps.md`'s
// legend tables, but left the *running prose* alone — "north of SL", "(Nodes CI, IN, TV…)",
// "at the CO node". Those codes name nodes that no longer exist under those names, and two
// of them are worse than dead: `CI` and `BK` both resolve to a DIFFERENT live node, so a
// "does this code exist?" check passes while the sentence is still wrong.
//
// The sweep could not be a token replace — that is how `AT`/`IS`/`SE`/`CA` become nonsense
// inside English sentences, and how a design ID (`Q-TL-01`) gets mangled into a node. So the
// detector is context-driven with an EXPLICIT ambiguous-code list, and the assertions below
// come in two halves:
//
//   1. the gate      — the swept docs carry no bare legacy code
//   2. the controls  — the detector still catches every shape it must, and still ignores
//                      every shape it must not. Without (2), a detector narrowed into
//                      uselessness and a deleted detector look identical in a green run.
//                      (§DX-02l-FU learned this the hard way on a doc assertion.)
//
// Pure-node (no browser): this is a docs invariant.

const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const TOOL = path.join(ROOT, 'scripts', 'legacy-codes.js');
const L = require(TOOL);

const map = L.loadLegacyMap(fs.readFileSync(path.join(ROOT, 'docs', 'maps', 'node-index.md'), 'utf8'));
const re = L.codeRe(map);
const scan = (text) => L.scanFile(text, map, re);

test.describe('§AUDIT-03m — legacy node codes in doc prose', () => {
  test('the swept docs carry no bare legacy code (check:walk gate #16)', () => {
    for (const rel of L.SWEEP) {
      const hits = scan(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
      expect(hits.map(h => `${rel}:${h.line} ${h.code}`), `${rel} still speaks 26×16`).toEqual([]);
    }
    expect(() => execFileSync(process.execPath, [TOOL, '--check'], { encoding: 'utf8' })).not.toThrow();
  });

  // ---- positive control: the shapes that MUST still be caught -------------------
  //
  // Note the deliberate recall limit this pins: an AMBIGUOUS code (`DC`, `IS`, `CI`, …) is
  // flagged only on a line that talks about nodes. That is the price of not mangling English,
  // and it is a choice, not an accident — so it is asserted rather than left to be discovered.
  test('the detector still catches every legacy-code shape it exists to find', () => {
    const mustCatch = [
      ['a heading listing a run of codes', '### Act I — Birka Starting Area (Nodes CI, IN, TV, BA)'],
      ['a direction sentence',             'Three nodes north of SL at grid row R03.'],
      ['an explicit node reference',       'The player begins in Birka. Node CI is the starting node.'],
      ['an arrow edge list',               '**Connections:** N→SL · E→IN · S→CR'],
      ['a table cell',                     '| Yael | CI | City watch patrol | reward 80gp |'],
      ['a bare code on an explanatory line — only BACKTICKED codes are exempt there',
                                           'The historical arc ran from node CI to the docks.'],
      ['an unambiguous code needs no node cue at all', 'The wreck lies far out past EF.'],
    ];
    for (const [why, line] of mustCatch) {
      expect(scan(line).length, `MISSED: ${why} — ${line}`).toBeGreaterThan(0);
    }
  });

  // ---- negative control: the shapes that MUST NOT be flagged --------------------
  test('the detector ignores jargon, identifiers, annotations and code', () => {
    const mustIgnore = [
      ['a difficulty class',        '- **[SKILL CHECK]** CHA DC 10 to persuade the guard.'],
      ['a DC in a sentence',        'Bait search DC reduced by LuckMod (floor 4).'],
      ['the Epic Battleground abbreviation', 'MILEPOINT B — EB engagement audit across all 20 EB codes'],
      ['a design ID',               'Q-TL-01 and Q-FR-02 are quest identifiers, not node codes.'],
      ['an already-annotated code', 'The player begins at `LHR` (historical `CI`), the starting node.'],
      ['a dense-form legend',       '### Act I (Nodes `LHR`, `TLL`)  *(historical: `CI`=`LHR` · `IN`=`TLL`)*'],
      ['a backticked code on an explanatory line', 'The historical junctions `J1`…`J7` were deleted by §WALK-1.'],
      ['a table header row',        '| Quest ID | Node | Check | DC | Pass Flag |\n|---|---|---|---|---|'],
      ['ordinary English',          'It is a long road, and the caravan is late.'],
    ];
    for (const [why, line] of mustIgnore) {
      expect(scan(line), `FALSE POSITIVE: ${why} — ${line}`).toEqual([]);
    }
  });

  test('a fenced block is code, and is never rewritten as prose', () => {
    const doc = ['Node CI is the start.', '```', 'MILEPOINT A  Player at node CO with defeatedBattles set', '```', 'after'].join('\n');
    const hits = scan(doc);
    expect(hits.map(h => h.code)).toEqual(['CI']);   // the fenced CO is untouched
  });

  // ---- the annotation itself ----------------------------------------------------
  test('annotation preserves the old code, and never nests backticks', () => {
    const sparse = 'Connects south to CY (Undercity) via Crypt Key gate.';
    const outS = L.annotateLine(sparse, scan(sparse), map);
    expect(outS).toContain('`HKG` (historical `CY`)');
    expect(outS).not.toMatch(/``[A-Z]/);

    // an already-backticked code is replaced INCLUDING its backticks
    const ticked = 'They were keyed to `J2` and `J3`, the junction stubs.';
    const outT = L.annotateLine(ticked, scan(ticked), map);
    expect(outT).not.toMatch(/``[A-Z]/);

    // 3+ codes collapse to live codes plus ONE trailing key
    const dense = '### Act I — Birka (Nodes CI, IN, TV)';
    const outD = L.annotateLine(dense, scan(dense), map);
    expect(outD).toContain('`LHR`, `TLL`, `MHQ`');
    expect(outD).toMatch(/\*\(historical: `CI`=`LHR` · `IN`=`TLL` · `TV`=`MHQ`\)\*$/);
    expect(scan(outD), 'an annotated line must not re-flag').toEqual([]);
  });

  test('every doc carrying legacy codes is classified — an unlisted one fails the gate', () => {
    // The §AUDIT-03j/n house style: classification is explicit, because a heuristic is
    // blind to a doc that is *entirely* legacy-coded.
    expect(L.classify('world.md')).toBe('SWEEP');
    expect(L.classify('lab-reports/lab-report-ally-cat.md')).toBe('HISTORY');
    expect(L.classify('plan-archive.md')).toBe('HISTORY');
    expect(L.classify('docs/story/story-flowchart.md')).toBe('PENDING');
    expect(L.classify('docs/notes/a-doc-nobody-has-classified.md')).toBe('UNCLASSIFIED');
  });

  test('history is annotated, never rewritten — the tool refuses to write one', () => {
    let err = null;
    try {
      execFileSync(process.execPath, [TOOL, '--annotate', 'plan-archive.md', '--write'], { encoding: 'utf8', stdio: 'pipe' });
    } catch (e) { err = e; }
    expect(err, 'the tool must refuse to rewrite a HISTORY doc').not.toBeNull();
    expect(String(err.stderr)).toMatch(/refusing/);
  });
});
