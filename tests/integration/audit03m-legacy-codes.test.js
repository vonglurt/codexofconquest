// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
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
    expect(L.classify('docs/story/story-flowchart.md')).toBe('SWEEP');   // §AUDIT-03m-FU promoted the last 7
    expect(L.classify('docs/notes/a-doc-nobody-has-classified.md')).toBe('UNCLASSIFIED');
    // PENDING is empty but must remain a live class — the next doc to grow legacy codes
    // lands there (reported, not an instant red gate), exactly as these seven did.
    expect(Array.isArray(L.PENDING)).toBe(true);
    expect(L.PENDING).toEqual([]);
  });

  // ---- §AUDIT-03m-FU: the residual classes the first sweep could not see ---------
  //
  // The first sweep annotated what `nodeContextLine` could see — a LINE test, and the
  // right shape for a report. But the commonest way a story doc names a place puts no
  // node word on the line at all: "Write Entry 42 at CI". `story-arc-ngplus.md` was
  // left with ELEVEN such codes after being "swept" of eight, and `world.md`/`story.md`
  // sat GATE-GREEN carrying 35 between them. These are the cues that close that gap.
  test('a place cue makes an ambiguous code a node, with no node word on the line', () => {
    const mustCatch = [
      ['a preposition of place', 'Write Entry 42 at CI. Only activated if the prior run finished.'],
      ['on X visit',             'Rendered on CO visit when the letter has not been found.'],
      ['motion toward',          'The player walks to CY and the neon is loud.'],
      ['a trailing place-noun',  'The MT tunnel opens once both investigation lines converge.'],
      ['a trailing "site"',      '| `vaCI` | boolean | `false` | CI site investigated |'],
      ['a sole parenthetical',   '#### Brynn Clerambault — Innkeeper (IN)'],
      ['a slash-separated run',  'The `[INVESTIGATE]` button appears at CI/SL/DF/MT when unlocked.'],
      ['a code column heading',  '### Q56 — EB | Wreck of the Unbroken'],
    ];
    for (const [why, line] of mustCatch) {
      expect(scan(line).length, `MISSED: ${why} — ${line}`).toBeGreaterThan(0);
    }
    // the slash run must catch EVERY member, not just the first — that was the bug
    expect(scan('The button appears at CI/SL/DF/MT when unlocked.').map(h => h.code).sort())
      .toEqual(['CI', 'DF', 'MT', 'SL']);
  });

  test('the FU cues do not fire on the senses that are not nodes', () => {
    const mustIgnore = [
      // `CI` is continuous integration all over this repo's own build prose. The
      // discriminator is the LINE's vocabulary, not the preposition: narrowing it to
      // "at CI" let "the player walks to CI" through, which a negative control caught.
      ['CI as continuous integration',  'Inc 4 — TTL-prune assertion + CI job + doc-sync (FINAL)'],
      ['CI wired into a workflow',      'Wired into CI as a separate `mud` job in walk-invariants.yml'],
      ['CI beside an npm script',       '`npm run check:arraypatch` (13 checks, in CI)'],
      // `SW` is Murky Swamp and it is also south-west. §AUDIT-03p hit the same collision
      // in the engine. A compass token sits in a RUN of compass tokens; a node never does.
      ['SW in a compass run',           'All N, S, E, W, SW, spire, and portal direction fields were stripped'],
      ['SW in a backticked compass run', '0 of 416 nodes carries `N`/`S`/`E`/`W`/`SW`/`spire`/`portal`'],
      // A code that is one side of a STATED MAPPING is the sentence's subject. Rewriting
      // the left side makes it claim the opposite of what the author wrote.
      ['a remap record',                'The dead-code remap moved **CQ→CDG** and **GC→TRD** to real nodes.'],
      ['a code run inside one span on an explanatory line',
                                        "The doc's old `TL/RD/IS/WM/IN` were the retired 26×16 names."],
    ];
    for (const [why, line] of mustIgnore) {
      expect(scan(line), `FALSE POSITIVE: ${why} — ${line}`).toEqual([]);
    }
  });

  test('the sweep is corroborated by the ENGINE, not just by the legacy map', () => {
    // The §AUDIT-03m lesson, and the reason this row re-read every claim it annotated:
    // annotating a WRONG node code launders it into a confident-looking live one.
    // world.md's Act VIII Homecoming table named four wrong places; `birkaNpcs` settles it.
    const html = fs.readFileSync(path.join(ROOT, 'roll2hit-v3.html'), 'utf8');
    const roster = html.match(/const birkaNpcs = \{[^}]*\}/);
    expect(roster, 'birkaNpcs is the authority on where these NPCs stand').not.toBeNull();
    for (const [npc, node] of [['yael', 'LHR'], ['brynn', 'TLL'], ['quill', 'MHQ'], ['pachelbel', 'LLA']]) {
      expect(roster[0], `${npc} must be rostered at ${node}`).toMatch(new RegExp(`${node}:\\['?${npc}`));
    }
    const world = fs.readFileSync(path.join(ROOT, 'world.md'), 'utf8');
    for (const [npc, node] of [['Quill', 'MHQ'], ['Pachelbel', 'LLA'], ['Weckmann', 'HKG'], ['Auros', 'HKG']]) {
      expect(world, `world.md's Homecoming row for ${npc} must name ${node}`)
        .toContain(`| ${npc} (\`${node}\``);
    }
    // `SH` was never a NODE_MAP key at all (the §AUDIT-03p born-dead class), so a tool
    // driven by the LEGACY CODE MAP is blind to it — it has to be caught by reading.
    expect(world).not.toMatch(/Tell Pachelbel at SH/);
  });

  // ---- §AUDIT-03q: the codes NEITHER registry can see ---------------------------
  //
  // Phase 1 is driven by the LEGACY CODE MAP — codes that WERE nodes and were renamed.
  // A code that was never a node at all resolves in neither registry, so phase 1 is
  // blind to it BY CONSTRUCTION: `world.md`'s "Tell Pachelbel at SH" had to be caught by
  // reading, and a second one ("at `LLA` or SH") survived that read. Phase 2 is the
  // instrument for that class, and its classification is explicit for the third time in
  // this gate family, for the third time for the same reason: a percentage heuristic is
  // blind to a token that is *always* jargon (`NG` fires 47 times and is never a node).
  const live = L.loadLiveCodes(fs.readFileSync(path.join(ROOT, 'docs', 'maps', 'node-index.md'), 'utf8'));
  const scanU = (text) => L.scanUnknown(text, live, map);

  test('no swept doc carries a born-dead node code, and every firing token is classified', () => {
    const bare = [], unclassified = [];
    for (const rel of L.SWEEP) {
      for (const h of scanU(fs.readFileSync(path.join(ROOT, rel), 'utf8'))) {
        if (L.BORN_DEAD.has(h.code)) bare.push(`${rel}:${h.line} ${h.code}`);
        else if (!L.NOT_A_NODE_CODE.has(h.code)) unclassified.push(`${rel}:${h.line} ${h.code}  ${h.text.slice(0, 60)}`);
      }
    }
    expect(bare, 'a bare born-dead code names a node that never existed').toEqual([]);
    expect(unclassified, 'classify it in BORN_DEAD or NOT_A_NODE_CODE').toEqual([]);
    // every classification carries a REASON — the #13/#14 house style, so the next
    // reader can tell a decision from a silencer.
    for (const [code, why] of [...L.BORN_DEAD, ...L.NOT_A_NODE_CODE]) {
      expect(why.length, `${code} is classified without a reason`).toBeGreaterThan(6);
    }
  });

  test('phase 2 catches the born-dead shapes, including the one beside a code it CAN see', () => {
    const mustCatch = [
      ['a place preposition',  'Tell Pachelbel at SH — she recognizes the forwarding route.'],
      // the finding that opened this row: no node word on the line, and the preposition
      // belongs to the code the tool already resolves. A sentence that has put a live
      // code in backticks is talking about places, and the token beside it is one too.
      ['beside a live node code', 'Player asks Pachelbel at `LLA` or SH about the lute.'],
      ['a trailing place-noun', 'The PH node opens once both lines converge.'],
      ['a sole parenthetical',  '#### The Sunken Hold (MH)'],
      // a token nobody has classified fails the gate rather than passing silently
      ['an unclassified codeish token', 'The courier waits at ZQ, the old crossing.'],
    ];
    for (const [why, line] of mustCatch) {
      expect(scanU(line).length, `MISSED: ${why} — ${line}`).toBeGreaterThan(0);
    }
  });

  test('phase 2 asks a human about nothing that is merely jargon', () => {
    // What a human must act on is a hit that is NOT already classified. Two different
    // mechanisms produce that silence, and the difference matters: the detector never
    // fires at all on the last two lines, while `NG`/`AC`/`HP`/`DM` DO fire and are
    // silenced by the classification table. Asserting only "no hits" would hide which
    // one is doing the work — and a table that silences everything is a deleted gate.
    const actionable = (line) => scanU(line).filter(h => !L.NOT_A_NODE_CODE.has(h.code));
    const mustNotAsk = [
      ['New Game Plus',        'Perks persist through NG+ at the `LLA` node.'],
      ['a Roman act numeral',  'The Road Companion appears in Act IV at the `LHR` node.'],
      ['a stat block',         'Monster stats: AC 15, HP 65, ATK +6 at the `TLL` node.'],
      ['the DM',               "> **DM note:** the cluster has no Codex Shard at the `HKG` node."],
      ['an arc identifier',    'The arc ships as Q-TL-01 at the `LLA` node.'],
      ['a live node code',     'The player arrives at LLA and the bar is loud.'],
      ['the born-dead note itself', 'Four keys (`SH`, `PH`, `MH`, `WM`) were never `NODE_MAP` keys — the retired 26×16 era.'],
    ];
    for (const [why, line] of mustNotAsk) {
      expect(actionable(line), `FALSE POSITIVE: ${why} — ${line}`).toEqual([]);
    }
    // the two silences, named
    expect(scanU('Perks persist through NG+ at the `LLA` node.').map(h => h.code), 'NG fires and is silenced by the TABLE').toEqual(['NG']);
    expect(scanU('The player arrives at LLA and the bar is loud.'), 'a live code never fires at all').toEqual([]);
    expect(scanU('Four keys (`SH`, `PH`, `MH`, `WM`) were never `NODE_MAP` keys — the retired 26×16 era.'),
      'an explanatory line about the class never fires').toEqual([]);
  });

  test('the two-letter limit is deliberate, and is stated rather than discovered', () => {
    // Phase 2 hunts the shape of the retired code space: exactly two letters. All eleven
    // tokens this row was filed to classify are two letters. Widening to three admits a
    // technical doc's whole acronym vocabulary (`NPC` alone fires 151 times) for no
    // measured gain — and every extra token is human classification work, not machine
    // work. The cost is real and is asserted here so nobody reads silence as coverage:
    // a THREE-letter code written from memory is not caught.
    expect(scanU('The courier waits at ZQ, the old crossing.').length).toBeGreaterThan(0);
    expect(scanU('The courier waits at ZQX, the old crossing.')).toEqual([]);
    // and the classification tables only ever speak about two-letter tokens
    for (const code of [...L.BORN_DEAD.keys(), ...L.NOT_A_NODE_CODE.keys()]) {
      expect(code, `${code} is not a two-letter token`).toMatch(/^[A-Z]{2}$/);
    }
  });

  test('the born-dead fix is corroborated by the engine, not by the legacy map', () => {
    // `SH` resolves in neither registry, so nothing mechanical can say what it meant.
    // The engine can: the lute handover is keyed to the NPC, and `birkaNpcs` says where
    // he stands. Annotating `SH` to a guessed node is exactly the laundering §AUDIT-03m-FU
    // found four times in the Homecoming table.
    const html = fs.readFileSync(path.join(ROOT, 'roll2hit-v3.html'), 'utf8');
    expect(html, "the lute is handed over from Pachelbel's card, not at a node")
      .toMatch(/key === 'pachelbel'[\s\S]{0,200}Quill's Lute/);
    expect(html.match(/const birkaNpcs = \{[^}]*\}/)[0]).toMatch(/LLA:\['?pachelbel/);
    const world = fs.readFileSync(path.join(ROOT, 'world.md'), 'utf8');
    expect(world, 'Beat 1 must name the node Pachelbel actually stands at')
      .toMatch(/\*\*Beat 1:\*\* Player asks Pachelbel at `LLA`/);
    expect(world, 'and must not still offer the born-dead alternative').not.toMatch(/at `LLA` or SH/);
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
