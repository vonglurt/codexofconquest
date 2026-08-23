#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
/**
 * §AUDIT-03m — find (and annotate) 26x16-era node codes still living in doc prose.
 *
 * §AUDIT-03l generated `docs/maps/node-index.md` (the live node reference) and
 * quarantined `maps.md`'s legend tables. What it deliberately did NOT touch is the
 * running prose: `"N of CI"`, `"east of DS"`, `"(Nodes CI, IN, TV, …)"`. Those codes
 * name nodes that no longer exist under those names, and two of them — `CI` and `BK` —
 * resolve to a DIFFERENT live node, so "does this code exist?" passes while the
 * sentence is still wrong.
 *
 * This tool does three things:
 *   report   (default)  — per-file counts of legacy-code references in prose
 *   --annotate <file>   — rewrite `CI` -> `` `LHR` (historical `CI`) `` in SWEEP files
 *   --check             — the gate: a SWEEP file must carry no bare legacy code
 *
 * Two rules it exists to enforce, both learned the hard way:
 *   1. A blind token replace turns `AT`/`IS`/`SE`/`CA` into nonsense inside English
 *      sentences, and design IDs (`Q-TL-01`, §XIX) are identifiers, not node codes.
 *      So a token counts only inside a NODE CONTEXT (see nodeContextLine), and the
 *      ambiguous codes are classified EXPLICITLY, never by a percentage heuristic
 *      (the §AUDIT-03j/n gate house style — a wholly-ambiguous code is invisible to
 *      a ratio).
 *   2. History is annotated, never rewritten (§DX-02c / §AUDIT-03n precedent). Lab
 *      reports, plan-archive.md and BACKLOG.md record what was true when written.
 *      Every doc is classified SWEEP or HISTORY below, and an UNCLASSIFIED file is
 *      reported as such rather than silently skipped.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'docs/maps/node-index.md');

// ---------------------------------------------------------------- legacy map

/** Parse the LEGACY CODE MAP out of the generated node index (gate #12 keeps it live). */
function loadLegacyMap(indexText) {
  const map = new Map();
  const start = indexText.indexOf('## LEGACY CODE MAP');
  if (start < 0) throw new Error('LEGACY CODE MAP section missing from docs/maps/node-index.md');
  const sec = indexText.slice(start);
  const cut = sec.indexOf('Unresolved —');
  const recovered = cut < 0 ? sec : sec.slice(0, cut);
  const unresolved = cut < 0 ? '' : sec.slice(cut);
  for (const m of recovered.matchAll(/^\|\s*`([A-Z][A-Z0-9]{1,3})`\s*\|\s*(\d+)\s*\|\s*\*\*`([A-Z0-9]{2,4})`\*\*\s*\|\s*([^|]*?)\s*\|/gm)) {
    if (m[1] === m[3]) continue;            // code survived the rename — nothing to annotate
    map.set(m[1], { live: m[3], num: m[2], label: m[4].trim(), resolved: true });
  }
  for (const m of unresolved.matchAll(/^\|\s*`([A-Z][A-Z0-9]{1,3})`\s*\|\s*(\d+)\s*\|/gm)) {
    map.set(m[1], { live: null, num: m[2], label: '', resolved: false });
  }
  return map;
}

// ------------------------------------------------------- explicit file classes

/**
 * SWEEP — live authoring/reference docs. A reader takes these as current, so a bare
 *   legacy code here is a live trap. These are annotated and gate-fenced.
 * HISTORY — records of what was true when written (lab reports, archives, the backlog's
 *   own ship records, and the quarantined tables in maps.md). Annotate, don't rewrite.
 */
const SWEEP = [
  'docs/design/world.md',
  'docs/design/story.md',
  'docs/notes/docs-dev-environment.md',
  // §AUDIT-03m-FU (2026-08-04) — the last seven PENDING docs, swept and promoted.
  'docs/story/story-arc-coastal.md',
  'docs/story/story-arc-investigation.md',
  'docs/story/story-arc-ngplus.md',
  'docs/story/story-arc-npc-dialogues.md',
  'docs/story/story-arc-epic-battlegrounds.md',
  'docs/story/story-flowchart.md',
  'docs/notes/docs-node-network.md',
];

/**
 * PENDING — live docs measured but not yet read hit-by-hit. Reported with counts on
 * every run and NOT gate-fenced, because a gate that fails on work nobody has done yet
 * is just a red light you learn to ignore. Move a file to SWEEP when it is swept.
 *
 * EMPTY since §AUDIT-03m-FU (2026-08-04): every live doc is now gate-fenced. The list
 * stays because it is the correct landing place for the NEXT doc that grows legacy
 * codes — a new doc is reported, not silently ignored, and not instantly a red gate.
 */
const PENDING = [];

const HISTORY_DIRS = ['lab-reports/', 'archive/', 'docs/spec/', 'vendor/', 'milepoints/', 'maps/', 'docs/backlog/'];
const HISTORY_FILES = [
  'docs/backlog/plan-archive.md', 'docs/backlog/BACKLOG.md', 'docs/design/maps.md', 'docs/maps/node-index.md',
  'docs/notes/backlog-cleanup-plan.html', 'docs/design/potential.md', 'CONTRIBUTING.md', 'docs/design/prompt.md',
  'docs/design/index.md', 'docs/design/quest.md', 'docs/design/mechanics.md', 'docs/design/monsters.md', 'README.md',
  'docs/mechanics/mechanics-combat.md', 'docs/mechanics/mechanics-economy.md',
  'docs/api/api-faq.md', 'docs/api/api-user-guide.md', 'docs/api/API-README.md',
  'docs/api/wbapi-help.md', 'docs/README.md', 'docs/notes/brainstorm-one-liners.md',
  'docs/notes/Year1367AD.md', 'docs/notes/ux-first-battles.md', 'maps/README.md',
  'docs/api/api-data-audit.md',        // importer tracker; its `CI` is a source-book code
  'docs/notes/cell-resume-prompts.md', // self-declared "Historical archive (do not act on verbatim)"

];

function classify(rel) {
  if (SWEEP.includes(rel)) return 'SWEEP';
  if (PENDING.includes(rel)) return 'PENDING';
  if (HISTORY_FILES.includes(rel)) return 'HISTORY';
  if (HISTORY_DIRS.some(d => rel.startsWith(d))) return 'HISTORY';
  return 'UNCLASSIFIED';
}

// ------------------------------------------------------------- the detector

/**
 * Codes that are also ordinary English or game jargon. A hit on one of these counts
 * only when the LINE is a node context (below). Classified by hand, from reading the
 * corpus — `DC` is a difficulty class 435 times, `EB` is "Epic Battleground" far more
 * often than it is the Wreck of the Unbroken.
 */
const AMBIGUOUS = new Set([
  'DC', 'EB', 'IS', 'AT', 'CO', 'ST', 'ML', 'SC', 'CA', 'MI', 'PL', 'AR', 'HC', 'OP',
  'SE', 'BE', 'IN', 'CR', 'BA', 'SW', 'FL', 'KR', 'AE', 'MS', 'DE', 'GA', 'KT', 'JU',
  'DS', 'HS', 'OC', 'VC', 'MC', 'PC', 'GC', 'AL', 'DK', 'MQ', 'SF', 'HL', 'FO', 'BQ',
  'SQ', 'OU', 'MT', 'YL', 'YC', 'BK', 'CI', 'CY', 'TV', 'SL', 'DF', 'HM', 'GL', 'RD',
]);

/**
 * Two codes are jargon far more often than they are nodes — `DC` is a difficulty class
 * (435 corpus hits) and `EB` abbreviates "Epic Battleground" (163). A whole-line node
 * context is not enough for these: they need a cue in the words immediately before them.
 */
const STRICT_LOCAL = new Set(['DC', 'EB']);
const LOCAL_CUE = /(?:nodes?\s+(?:[A-Z0-9]{2,4}[,·\s]+)*|\|\s*|[→←]\s*)$/i;

/**
 * A line that is TALKING ABOUT the legacy codes — a legend, a historical banner, a note
 * explaining what a deleted junction was. Rewriting one would corrupt the very sentence
 * that records the mapping: the §DX-02l-FU defect, in the other direction.
 *
 * But "the line says the word historical" is too coarse an exemption on its own — it
 * would excuse a bare `CI` sitting in an otherwise ordinary sentence. So on an
 * explanatory line only a BACKTICKED code is treated as explained; a bare one is still
 * the trap this tool exists to find.
 */
const EXPLANATORY_LINE = /retired 26|26×16|legacy|historical|dead[- ]code|remap(?:ped|ping|s)?\b|pre-§WALK|LEGACY CODE MAP/i;

/**
 * `CQ→CDG` — the code is one side of a STATED MAPPING, so the sentence already
 * explains it; rewriting the left side yields `` `CDG` (historical `CQ`)→CDG ``,
 * which claims the opposite of what the author wrote. §AUDIT-03m-FU: found on
 * `story-arc-npc-dialogues.md:45`, the §NPC-01-SF4 remap record — a HISTORY-shaped
 * paragraph living inside a live doc, which is the normal case, not the odd one.
 */
const statesMapping = (line, i, len) =>
  /^\s*(?:→|->)\s*[A-Z][A-Z0-9]{1,3}\b/.test(line.slice(i + len)) ||
  /[A-Z][A-Z0-9]{1,3}\s*(?:→|->)\s*$/.test(line.slice(Math.max(0, i - 8), i));
const inBackticks = (line, i, len) => line[i - 1] === '`' && line[i + len] === '`';

/**
 * Is this index inside ANY inline code span on the line? Not the same test as
 * inBackticks, which asks whether the code is a span all by itself.
 *
 * §AUDIT-03m-FU, found by dropping the `/` guard: world.md explains a remap with
 * *"the doc's old `TL/RD/IS/WM/IN` were the retired 26×16 names"*. Those five codes
 * are the sentence's SUBJECT — rewriting them to live codes would make it claim the
 * opposite of what it says. On an explanatory line, a code anywhere inside a span is
 * already labelled as historical by the prose around it. (§DX-02l-FU, same lesson in
 * the other direction: the checker serves the prose, never the reverse.)
 */
function inCodeSpan(line, i) {
  let open = -1;
  for (let k = 0; k < line.length; k++) {
    if (line[k] !== '`') continue;
    if (open < 0) open = k;
    else { if (i > open && i < k) return true; open = -1; }
  }
  return false;
}

/** Does this LINE talk about nodes at all? */
function nodeContextLine(line, codes) {
  if (/`?(?:NODE_MAP|NODE_COORDS|activateNode|waypointNode|CELL_GRID)`?/.test(line)) return true;
  if (/\bnodes?\b/i.test(line)) return true;
  if (/[→←↑↓]|-->|->/.test(line)) return true;
  if (/\bR\d{2},\s*C\d{2}\b/.test(line)) return true;              // legacy grid refs
  if (/\b(?:north|south|east|west)\b/i.test(line) && codes.length) return true;
  // a table cell whose ENTIRE content is a code is a code column: `| Yael | CI | watch |`
  if (codes.some(c => new RegExp('\\|\\s*' + c + '\\s*\\|').test(line))) return true;
  return codes.length >= 2;                                       // a run of codes IS the context
}

/**
 * A PLACE CUE — the words immediately before a code that make it a location and
 * nothing else: "at CI", "on CO visit", "arrives at DK", "the SQ node".
 *
 * §AUDIT-03m-FU: nodeContextLine is a LINE test, and it is the right shape for a
 * report (it is what keeps `IS`/`AT`/`CO` from firing inside English sentences).
 * But the commonest way a story doc names a place — *"Write Entry 42 at CI"* — puts
 * no node word anywhere on the line, so those hits were invisible: `story-arc-ngplus`
 * carried ELEVEN such codes on lines the line test skipped while the eight it could
 * see were annotated. A doc could therefore be swept, pass the gate, and still read
 * `at CO` throughout. The cue is deliberately LOCAL and closed-class: a preposition
 * of place (or the word "node") in the two tokens before the code. "the player finds
 * CO letter" still needs a human — see the §AUDIT-03m-FU residual pass.
 */
const PLACE_CUE = /\b(?:at|in|on|to|from|near|into|onto|toward|towards|through|via|between|node|nodes|reaches|reached|arrives?|arriving|visits?|visiting)\s+(?:the\s+)?$/i;

/**
 * `CI` is ALSO continuous integration, and this repo writes about its own build
 * constantly — *"wired into CI as a job"*, *"Inc 2 CI gate"*, *"(13 checks, in CI)"*.
 * The weak prepositions (`in`/`into`/`to`) read both ways; `at` does not — nobody
 * writes *"at CI"* about a pipeline. Same shape as STRICT_LOCAL: a code that is
 * jargon elsewhere gets a narrower cue, classified by hand rather than by a ratio.
 */
const JARGON_ONLY = new Set(['CI']);
const CI_BUILD_LINE = /\b(?:CI[\/-]CD|workflow|\.github|runs-on|pipeline|npm (?:run|ci|test)|check:[a-z]+|job|gate|actions\/|Playwright|harness|invariants)\b/i;

/**
 * The cue can also come AFTER the code, when the code modifies a place-noun:
 * *"the MT tunnel"*, *"CI site investigated"*, *"On first SF visit"*, *"CO outro"*.
 * A closed, hand-read noun list — the §AUDIT-03j/n house style — not a part-of-speech
 * guess. §AUDIT-03m-FU: these were the single largest residual class left by the
 * first sweep (14 in `story-arc-investigation.md` alone).
 */
const TRAILING_CUE = /^\s+(?:node|nodes|site|sites|tunnel|pass|visit|visits|arrival|outro|letter|screen|entry|ending|crossroads|quarter|render|renders|boundary|cell|stone|corridor|approach)\b/i;

/**
 * A code that is the WHOLE parenthetical — *"Innkeeper (IN)"*, *"the docks (DK)"*.
 * Nothing else is ever written that way in this corpus; it is how these docs label
 * a heading with the place it belongs to.
 */
const soleParenthetical = (line, i, len) => line[i - 1] === '(' && line[i + len] === ')';

/**
 * `SW` is Murky Swamp AND it is south-west; `SE` is Visby Sewers AND south-east.
 * §AUDIT-03p hit the same collision in the engine (its phase 5 classifies two
 * "compass" tables separately from the node ones). In prose the tell is unmistakable:
 * a compass token sits in a RUN of compass tokens — *"All N, S, E, W, SW, spire and
 * portal fields were stripped"*. A node code never does. Caught when the sweep of
 * `docs-node-network.md` rewrote exactly that sentence into a swamp.
 */
const COMPASS_CODES = new Set(['SW', 'SE']);
const COMPASS_RUN_BEFORE = /\b(?:N|S|E|W|NE|NW|SE|SW)`?\s*[,/|]\s*`?$/;
const COMPASS_RUN_AFTER = /^`?\s*[,/|]\s*`?(?:N|S|E|W|NE|NW|SE|SW)\b/;

/**
 * §AUDIT-03m-FU: `/` used to be a boundary the lookbehind REFUSED, on the theory that
 * a slash meant a path. Measured, it does not: all 218 slash-preceded hits in the
 * corpus are node RUNS — `at CI/SL/DF/WM/MT`, `VENDOR_NODES: BA/MQ/SF/IS/BK`,
 * `Pip (DK/MQ)`. The guard was silently eating the densest node lists in the repo,
 * annotating the first code of a run and leaving the rest bare. A trailing `-`/word
 * char still blocks a real path segment (`docs/DK-notes`).
 */
const codeRe = (map) =>
  new RegExp('(?<![A-Za-z0-9_\\-§])(' + [...map.keys()].join('|') + ')(?![A-Za-z0-9_\\-])', 'g');

/** Already annotated? `LHR` (historical `CI`) must not be re-flagged. */
function annotatedAt(line, idx) {
  const before = line.slice(Math.max(0, idx - 24), idx);
  return /historical\s+`?$/.test(before) || /\(historical\s+`?$/.test(before);
}

/** A markdown table HEADER row — its cells are column names (`| … | DC | Pass Flag |`). */
function isTableHeader(lines, i) {
  return /^\s*\|/.test(lines[i] || '') && /^\s*\|?[\s:|-]{3,}$/.test(lines[i + 1] || '');
}

/**
 * The one prose walker both phases use. A fenced block is code, a table header row is
 * column names, and neither is prose to annotate — measure that in ONE place so the
 * gate and the writer can never disagree about what a line is (§DX-01d's lesson: one
 * shared scanner for the gate and the writer, or they drift).
 */
function eachProseLine(text, cb) {
  const lines = text.split('\n');
  let fenced = false;
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) { fenced = !fenced; return; }
    if (fenced) return;                 // a fenced block is code — never prose to annotate
    if (isTableHeader(lines, i)) return;
    cb(line, i);
  });
}

/** The local cues that make a token a PLACE, independent of the rest of the line. */
function localCue(line, i, len) {
  const before = line.slice(Math.max(0, i - 40), i);
  const after = line.slice(i + len);
  // A code that ENDS a dash- or pipe-delimited field and is followed by a column
  // separator is a code column: `### Q56 — EB | Wreck of the Unbroken`. Distinct
  // from nodeContextLine's `| CI |`, which needs the code alone in the cell.
  const codeColumn = /^\s*\|/.test(after) && /(?:[—–|-]|^)\s*$/.test(before);
  return PLACE_CUE.test(before) || TRAILING_CUE.test(after) ||
         soleParenthetical(line, i, len) || codeColumn;
}

function scanFile(text, map, re) {
  const out = [];
  eachProseLine(text, (line, i) => {
    const explanatory = EXPLANATORY_LINE.test(line);
    re.lastIndex = 0;
    const raw = [...line.matchAll(re)];
    if (!raw.length) return;
    const ctx = nodeContextLine(line, raw.map(m => m[1]));
    for (const m of raw) {
      const code = m[1];
      if (annotatedAt(line, m.index)) continue;
      if (explanatory && (inBackticks(line, m.index, code.length) || inCodeSpan(line, m.index) || statesMapping(line, m.index, code.length))) continue;
      const before = line.slice(Math.max(0, m.index - 40), m.index);
      const after = line.slice(m.index + code.length);
      if (COMPASS_CODES.has(code) && (COMPASS_RUN_BEFORE.test(before) || COMPASS_RUN_AFTER.test(after))) continue;
      // `CI` is continuous integration wherever the LINE is about the build. That is
      // a property of the sentence, not of the preposition in front of the token:
      // narrowing it to "at CI" instead let "the player walks to CI" through, which a
      // negative control caught before this shipped.
      if (JARGON_ONLY.has(code) && CI_BUILD_LINE.test(line)) continue;
      const cued = localCue(line, m.index, code.length);
      if (AMBIGUOUS.has(code) && !ctx && !cued) continue;
      // `EB`/`DC` are jargon far more often than nodes, so a leading cue is required —
      // but a code column reads the other way round: `### Q56 — EB | Wreck of the Unbroken`.
      if (STRICT_LOCAL.has(code) && !LOCAL_CUE.test(before) && !/^\s*\|/.test(after)) continue;
      out.push({ line: i + 1, col: m.index, code, live: map.get(code).live, text: line.trim() });
    }
  });
  return out;
}

// ------------------------------------------------- phase 2: the BORN-DEAD class
//
// §AUDIT-03q. Phase 1 is driven by the LEGACY CODE MAP, which records codes that WERE
// nodes and were renamed. It therefore has nothing to say about a code that was never a
// node at all — §AUDIT-03p found four of those in the engine (`SH`/`PH`/`MH`/`WM` matched
// no `NODE_MAP` key at the commit that authored them: written from memory, born dead).
// Such a code resolves in NEITHER registry, so phase 1 is blind to it BY CONSTRUCTION,
// and `world.md`'s *"Tell Pachelbel at SH"* had to be caught by reading.
//
// The class also catches a second shape the same way round: a real historical code the
// `maps.md` legend never listed, so `npm run nodes` never put it in the LEGACY CODE MAP.
// Both fail the same test — *the token looks like a node code and resolves nowhere* —
// and the classification below is what tells them apart.

/**
 * THE DELIBERATE LIMIT, stated because a silent one reads as coverage: phase 2 looks at
 * exactly-two-letter tokens. That is the shape of the retired 26×16 code space, which is
 * the era a born-dead code is written in — all eleven tokens this row was filed to
 * classify (`SH` `PH` `MH` `SK` `SB` `AO` `LT` `HR` `KS` `DR` `TS`) are two letters.
 * Widening to three lets in the whole acronym vocabulary of a technical doc (`NPC` 151×,
 * `DOM`, `ATK`, `HTML`) for no measured gain, and every extra token is human classification
 * work, not machine work. A three-letter code written from memory is NOT caught here.
 */
const UNKNOWN_TOKEN = /(?<![A-Za-z0-9_\-§])([A-Z]{2})(?![A-Za-z0-9_\-])/g;

/**
 * Tokens that ARE node codes and resolve nowhere — the born-dead class itself. Listed so
 * the report can name them and so a BARE one still fails the gate: these are precisely the
 * references a reader would follow to a node that never existed.
 */
const BORN_DEAD = new Map([
  ['SH', 'never a `NODE_MAP` key at any commit (§AUDIT-03p). `world.md` used it for Pachelbel, who stands at `LLA` (`birkaNpcs`).'],
  ['PH', 'never a `NODE_MAP` key — a `_voidFlavorLine` CLUSTER key written from memory, dropped rather than guessed (§AUDIT-03p).'],
  ['MH', 'never a `NODE_MAP` key — same CLUSTER, same origin, also dropped (§AUDIT-03p).'],
]);

/**
 * Tokens that merely LOOK like a 26×16 code in a node-ish sentence. Explicit, with a
 * reason each — the #13/#14/#16 house style, for the third time and for the same reason:
 * a percentage heuristic is blind to a token that is *always* jargon. 23 tokens fire in
 * the swept corpus; 20 of them are these.
 */
const NOT_A_NODE_CODE = new Map([
  ['NG', 'New Game Plus — always written `NG+`'],
  ['HP', 'hit points'],
  ['AC', 'armor class'],
  ['XP', 'experience points'],
  ['DM', 'dungeon master ("DM note:", "at the DM\'s discretion")'],
  ['II', 'Roman act numeral (Act II)'],
  ['IV', 'Roman act numeral (Act IV)'],
  ['VI', 'Roman act numeral (Act VI)'],
  ['ID', 'identifier — the `| Quest ID |` column header'],
  ['UI', 'user interface'],
  ['NO', 'the word NO — Neon Undercity signage: "NO COIN · NO TRUST · NO THANKS"'],
  ['OR', 'the word OR — "Win OR Pass presented"'],
  ['WA', 'the `.WA` (warning) field of an `EB_NPC_DIALOGUE` Q-code, e.g. `Q52.WA`'],
  ['WP', 'the WP (waypoint) button — §NAV-01d/e auto-travel'],
  ['NE', 'compass north-east — `(n steps, NE)` readouts'],
  ['SP', 'single-player (the SP client, opposite the MUD server)'],
  ['MP', 'multiplayer'],
  ['TC', 'Town Crier — the `TC_*` line consts'],
  ['GB', 'gigabytes — the V8 heap limit'],
  ['FR', 'a real pre-airport code (Fishmonger\'s Row → `AMS`) that the `maps.md` legend never listed, so `npm run nodes` never put it in the LEGACY CODE MAP; every live-doc use states the mapping'],
]);

/** Every live `NODE_MAP` code, from the generated index's main table (codes run 2–6 chars). */
function loadLiveCodes(indexText) {
  const live = new Set();
  const end = indexText.indexOf('## LEGACY CODE MAP');
  for (const m of indexText.slice(0, end < 0 ? undefined : end)
    .matchAll(/^\|\s*`([A-Z][A-Z0-9]{1,5})`\s*\|\s*(?:\d+|—)\s*\|\s*`/gm)) live.add(m[1]);
  return live;
}

/**
 * A line that NAMES a node — `at `LLA` or SH about the lute`. Neither the line test nor a
 * local cue sees that `SH`: no node word anywhere on the line, and the preposition belongs
 * to `LLA`, not to `SH`. But a sentence that has already put a live code in backticks is
 * talking about places, and a second codeish token on it is a place too. This is the
 * §AUDIT-03m-FU lesson one turn further: the instrument keeps missing the code that sits
 * NEXT TO the one it can see.
 */
const namesLiveNode = (line, live) =>
  [...line.matchAll(/`([A-Z][A-Z0-9]{1,5})`/g)].some(m => live.has(m[1]));

/** Codeish tokens that resolve in NEITHER registry, in a node context. */
function scanUnknown(text, live, map) {
  const out = [];
  eachProseLine(text, (line, i) => {
    UNKNOWN_TOKEN.lastIndex = 0;
    const raw = [...line.matchAll(UNKNOWN_TOKEN)].filter(m => !live.has(m[1]) && !map.has(m[1]));
    if (!raw.length) return;
    const explanatory = EXPLANATORY_LINE.test(line);
    const ctx = namesLiveNode(line, live) || nodeContextLine(line, raw.map(m => m[1]));
    for (const m of raw) {
      const code = m[1];
      if (annotatedAt(line, m.index)) continue;
      // Same exemption as phase 1, and the same reason: on a line that EXPLAINS the
      // legacy codes, a backticked one is the sentence's subject. `story.md`'s §AUDIT-03p
      // note names `SH`/`PH`/`MH` precisely to record that they were never nodes.
      if (explanatory && (inBackticks(line, m.index, code.length) || inCodeSpan(line, m.index) || statesMapping(line, m.index, code.length))) continue;
      if (!ctx && !localCue(line, m.index, code.length)) continue;
      out.push({ line: i + 1, col: m.index, code, text: line.trim() });
    }
  });
  return out;
}

// ------------------------------------------------------------------ walking

function walkDocs(dir, acc = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const rel = path.relative(ROOT, p);
    if (/(^|\/)(node_modules|\.git|test-results|playwright-report|coverage)(\/|$)/.test(rel)) continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walkDocs(p, acc);
    else if (f.endsWith('.md')) acc.push(rel);
  }
  return acc;
}

// -------------------------------------------------------------- annotation

/**
 * Two forms, because one form cannot serve both cases:
 *   1–2 codes on a line  ->  inline:  `LHR` (historical `CI`)
 *     Keeps the old code where a reader of an old note needs it.
 *   3+ codes on a line   ->  live codes + ONE trailing legend
 *     `### Act I — Birka (Nodes `LHR`, `TLL`, `MHQ`)  *(historical: CI=LHR · IN=TLL …)*`
 *     Ten interleaved parentheticals is not an annotation, it is a wall. A run of codes
 *     is a list, and a list gets one key.
 * An unresolved code (a deleted junction stub) is marked as the dead reference it is.
 */
const DENSE_LINE = 3;

function annotateLine(line, hits, map) {
  let out = line;
  const dense = hits.length >= DENSE_LINE;
  const legend = [];
  for (const h of [...hits].sort((a, b) => b.col - a.col)) {
    const info = map.get(h.code);
    let rep;
    if (!info.resolved) rep = '`' + h.code + '` (historical — no live node)';
    else if (dense) { rep = '`' + info.live + '`'; legend.unshift('`' + h.code + '`=`' + info.live + '`'); }
    else rep = '`' + info.live + '` (historical `' + h.code + '`)';
    // An already-backticked code is replaced INCLUDING its backticks — nesting them
    // produces ``J2` (historical …)`, which renders as neither code nor prose.
    const ticked = inBackticks(out, h.col, h.code.length);
    const from = ticked ? h.col - 1 : h.col;
    const to = ticked ? h.col + h.code.length + 1 : h.col + h.code.length;
    out = out.slice(0, from) + rep + out.slice(to);
  }
  if (legend.length) {
    const seen = new Set(), uniq = legend.filter(l => !seen.has(l) && seen.add(l));
    out = out.replace(/\s+$/, '') + '  *(historical: ' + uniq.join(' · ') + ')*';
  }
  return out;
}

function annotateFile(rel, map, re, write) {
  const abs = path.join(ROOT, rel);
  const lines = fs.readFileSync(abs, 'utf8').split('\n');
  const hits = scanFile(lines.join('\n'), map, re);
  const byLine = new Map();
  for (const h of hits) {
    if (!byLine.has(h.line)) byLine.set(h.line, []);
    byLine.get(h.line).push(h);
  }
  for (const [ln, hs] of byLine) lines[ln - 1] = annotateLine(lines[ln - 1], hs, map);
  const text = lines.join('\n');
  if (write) fs.writeFileSync(abs, text);
  return { changed: byLine.size, hits: hits.length, text };
}

// ------------------------------------------------------------------- main

/**
 * Phase 2 over the swept docs. Returns the two failure shapes separately, because they
 * ask different things of a human: a BARE born-dead reference is a live trap to fix by
 * hand, an UNCLASSIFIED token is a token nobody has decided about yet.
 */
function runPhase2(indexText, map) {
  const live = loadLiveCodes(indexText);
  const bare = [], unclassified = [], counts = new Map();
  for (const rel of SWEEP) {
    for (const h of scanUnknown(fs.readFileSync(path.join(ROOT, rel), 'utf8'), live, map)) {
      counts.set(h.code, (counts.get(h.code) || 0) + 1);
      if (BORN_DEAD.has(h.code)) bare.push({ ...h, rel });
      else if (!NOT_A_NODE_CODE.has(h.code)) unclassified.push({ ...h, rel });
    }
  }
  return { live, bare, unclassified, counts };
}

function main() {
  const args = process.argv.slice(2);
  const indexText = fs.readFileSync(INDEX, 'utf8');
  const map = loadLegacyMap(indexText);
  const re = codeRe(map);

  if (args[0] === '--annotate') {
    const target = args[1];
    if (!target) { console.error('usage: legacy-codes.js --annotate <file> [--write]'); process.exit(2); }
    if (!['SWEEP', 'PENDING'].includes(classify(target))) {
      console.error(`refusing: ${target} is ${classify(target)} — history is annotated by hand, never rewritten`);
      process.exit(2);
    }
    const r = annotateFile(target, map, re, args.includes('--write'));
    console.log(`${target}: ${r.hits} references on ${r.changed} lines${args.includes('--write') ? ' — written' : ' (dry run)'}`);
    return;
  }

  const files = walkDocs(ROOT);
  const rows = [];
  let unclassified = [];
  for (const rel of files) {
    const cls = classify(rel);
    const hits = scanFile(fs.readFileSync(path.join(ROOT, rel), 'utf8'), map, re);
    if (!hits.length) continue;
    if (cls === 'UNCLASSIFIED') unclassified.push(rel);
    rows.push({ rel, cls, n: hits.length, hits });
  }

  if (args[0] === '--check') {
    const bad = rows.filter(r => r.cls === 'SWEEP');
    if (unclassified.length) {
      console.error('check:legacycodes FAIL — unclassified doc(s) carry legacy node codes:');
      for (const u of unclassified) console.error('  ' + u + '  (add to SWEEP or HISTORY in scripts/legacy-codes.js)');
    }
    if (bad.length) {
      console.error('check:legacycodes FAIL — bare legacy node codes in SWEEP docs:');
      for (const r of bad) {
        console.error(`  ${r.rel} — ${r.n}`);
        for (const h of r.hits.slice(0, 8)) console.error(`    :${h.line} ${h.code} -> ${h.live || '(no live node)'}  ${h.text.slice(0, 90)}`);
      }
    }
    // phase 2 (§AUDIT-03q) — the codes NEITHER registry can see
    const p2 = runPhase2(indexText, map);
    if (p2.bare.length) {
      console.error('check:legacycodes FAIL — BORN-DEAD node codes in SWEEP docs (they name a node that never existed):');
      for (const h of p2.bare) console.error(`  ${h.rel}:${h.line} ${h.code} — ${BORN_DEAD.get(h.code)}\n    ${h.text.slice(0, 110)}`);
    }
    if (p2.unclassified.length) {
      console.error('check:legacycodes FAIL — unclassified codeish token(s) that resolve in NEITHER registry:');
      for (const h of p2.unclassified) console.error(`  ${h.rel}:${h.line} ${h.code}  ${h.text.slice(0, 100)}\n    (classify it in BORN_DEAD or NOT_A_NODE_CODE in scripts/legacy-codes.js)`);
    }
    if (bad.length || unclassified.length || p2.bare.length || p2.unclassified.length) process.exit(1);
    const pend = rows.filter(r => r.cls === 'PENDING');
    for (const r of pend) console.log(`  … PENDING ${r.rel} — ${r.n} (live doc, not yet swept — §AUDIT-03m)`);
    console.log(`check:legacycodes OK — ${SWEEP.length} swept doc(s) carry no bare legacy code` +
      (pend.length ? `; ${pend.reduce((a, r) => a + r.n, 0)} references remain in ${pend.length} pending live doc(s)` : '') +
      `\n  phase 2 (§AUDIT-03q) — ${p2.counts.size} two-letter token(s) resolve in neither registry across the swept docs, all classified` +
      ` (tables: ${BORN_DEAD.size} born-dead, ${NOT_A_NODE_CODE.size} not node codes)`);
    return;
  }

  rows.sort((a, b) => b.n - a.n);
  let sweep = 0, hist = 0;
  for (const r of rows) { if (r.cls === 'SWEEP' || r.cls === 'PENDING') sweep += r.n; else hist += r.n; }
  console.log(`legacy node-code references in prose — ${sweep} still in live docs (SWEEP+PENDING), ${hist} in HISTORY docs (annotate, never rewrite)\n`);
  for (const r of rows) {
    const counts = {};
    for (const h of r.hits) counts[h.code] = (counts[h.code] || 0) + 1;
    console.log(String(r.n).padStart(5) + '  ' + r.cls.padEnd(12) + r.rel + '  ' +
      Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0] + ':' + e[1]).join(' '));
  }
  if (unclassified.length) {
    console.log('\nUNCLASSIFIED (add to SWEEP or HISTORY):');
    for (const u of unclassified) console.log('  ' + u);
  }

  const p2 = runPhase2(indexText, map);
  console.log(`\nphase 2 (§AUDIT-03q) — two-letter tokens in the ${SWEEP.length} swept docs that resolve in NEITHER registry:`);
  for (const [code, n] of [...p2.counts].sort((a, b) => b[1] - a[1])) {
    const why = BORN_DEAD.has(code) ? 'BORN-DEAD — ' + BORN_DEAD.get(code)
      : NOT_A_NODE_CODE.has(code) ? 'not a node code — ' + NOT_A_NODE_CODE.get(code)
      : '⚠️ UNCLASSIFIED';
    console.log('  ' + code.padEnd(4) + String(n).padStart(4) + '  ' + why);
  }
  if (p2.bare.length) {
    console.log('\n  bare born-dead reference(s) — a reader would follow these to a node that never existed:');
    for (const h of p2.bare) console.log(`    ${h.rel}:${h.line} ${h.code}  ${h.text.slice(0, 100)}`);
  }
}

if (require.main === module) main();
module.exports = {
  loadLegacyMap, loadLiveCodes, classify, scanFile, scanUnknown, codeRe, annotateLine,
  SWEEP, PENDING, AMBIGUOUS, BORN_DEAD, NOT_A_NODE_CODE,
};
