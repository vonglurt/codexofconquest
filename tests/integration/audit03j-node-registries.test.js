// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §AUDIT-03j — the ENGINE-side node references resolve too, not just the quest corpus.
//
// Why this test exists: §AUDIT-03c locked `activateNode`/`waypointNode` in QUEST_DB, but
// a dozen registries in the engine's own JS are keyed by node code and nothing checked
// them. They were written in the retired 26×16 codes and quietly stopped firing when the
// world moved to airport codes — 42 dead references across five registries:
//
//   NODE_NPC_KEYS       21 of 26 rows → favor map-tinting and farewells worked at LHR only
//   NPC_FAREWELLS       all 12 route keys → only each NPC's `default` line could fire
//   JUNCTION_VIGNETTES  7 of 8, keyed to the J2–J7/RD stubs §WALK deleted
//   CORELLI_APPEARANCES stop 2 of 5 at the removed `RD` node
//   NPC_DIALOGUE        `MS_SPARK` — Brannick the Rat Catcher had never rendered
//
// A missed lookup renders nothing, so every one of these failed silently for months.
// `check:noderegs` (gate #13) is the durable fence; this file pins the specific repairs
// and, crucially, the two BEHAVIOURAL claims the repair rests on — that removing the 20
// inert EB placeholder rows changed no colour, and that both SEN speakers now reach the
// player.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const GAME = path.join(ROOT, 'roll2hit-v3.html');

function freshWorld() {
  delete require.cache[require.resolve(path.join(ROOT, 'js', 'wbapi-core.js'))];
  const W = require(path.join(ROOT, 'js', 'wbapi-core.js'));
  W.load(GAME);
  return W;
}
const src = () => fs.readFileSync(GAME, 'utf8');

// Legacy code → live code, per docs/maps/node-index.md's LEGACY CODE MAP. Each of these
// was a NODE_NPC_KEYS / NPC_FAREWELLS / JUNCTION_VIGNETTES key before this row.
const DEAD_CODES = ['IN', 'TV', 'BA', 'CY', 'SQ', 'EH', 'ES', 'EW', 'EB', 'EI', 'EA',
                    'EC', 'EL', 'EM', 'EE', 'EV', 'EJ', 'ER', 'EK', 'EP', 'EG',
                    'LJU', 'SPU', 'TGD', 'TOS', 'MMX', 'ANC', 'LDE'];

test.describe('§AUDIT-03j — engine node registries resolve', () => {
  test('the 28 legacy codes are still not NODE_MAP keys (the remap was a rename, not a build)', () => {
    const W = freshWorld();
    const keys = new Set(Object.keys(W.nodeMap));
    // `EB` and `EA`-style codes must stay absent: if one is ever created as a real node,
    // these registries would silently start resolving to the WRONG place.
    const revived = DEAD_CODES.filter(c => keys.has(c));
    expect(revived, `legacy codes that became live nodes: ${revived.join(',')}`).toEqual([]);
  });

  test('NODE_NPC_KEYS resolves on BOTH columns — node code and favor key', () => {
    const W = freshWorld();
    const live = new Set(Object.keys(W.nodeMap));
    const body = src().slice(src().indexOf('const NODE_NPC_KEYS'), src().indexOf('const NPC_FAREWELLS'));
    const rows = [...body.matchAll(/([A-Z][A-Z0-9_]{0,5})\s*:\s*'([a-z_0-9]+)'/g)].map(m => [m[1], m[2]]);

    expect(rows.length).toBe(5);
    for (const [code, npc] of rows) {
      expect(live.has(code), `${code} is not a NODE_MAP key`).toBe(true);
      // the npc key must be a real profile — 'couperin'/'weckmann'/'crane' were surnames
      // and stubs that the favor ledger never spends
      expect(W.birkaNpcs[npc], `${code}:'${npc}' is not a BIRKA_NPC profile key`).toBeTruthy();
      expect(W.birkaNpcs[npc].node, `${code}:'${npc}' — profile lives elsewhere`).toBe(code);
    }
    expect(rows.map(r => r.join(':')).sort())
      .toEqual(['HKG:crov', 'LHR:yael', 'LLA:pachelbel', 'MHQ:quill', 'TLL:brynn']);
  });

  test('removing the 20 EB placeholder rows is a no-op — the colour comes from ebReturnDone', () => {
    // The claim that made deletion safe: `_npcFavor('eh_npc')` was always 0, so the rows
    // could never tint anything, and EB nodes are coloured by a separate live branch.
    const s = src();
    expect(s).not.toMatch(/'e[a-z]_npc'/);           // no placeholder key survives
    const fn = s.slice(s.indexOf('function _getNodeMapColor'), s.indexOf('function _getFarewell'));
    expect(fn).toContain('ebReturnDone');             // the branch that actually tints EB nodes
    expect(fn).toContain('NODE_NPC_KEYS[nodeSlug]');
    // and a missing key must degrade to the same value the dead key produced
    expect(fn).toMatch(/npcKey \? _npcFavor\(npcKey\) : 0/);
  });

  test('every NPC_FAREWELLS owner is a favor-capable profile and every route resolves', () => {
    const W = freshWorld();
    const live = new Set(Object.keys(W.nodeMap));
    const s = src();
    const body = s.slice(s.indexOf('const NPC_FAREWELLS'), s.indexOf('const NPC_ACT_THREE_LINES'));

    const owners = [...body.matchAll(/^ {2}([a-z_0-9]+): \{/gm)].map(m => m[1]);
    expect(owners).toEqual(['yael', 'brynn', 'quill', 'pachelbel', 'crov', 'auros']);
    owners.forEach(o => expect(W.birkaNpcs[o], `${o} is not a profile key`).toBeTruthy());

    const routes = [...body.matchAll(/^ {4}([A-Z][A-Z0-9]{0,5})_to_([A-Z][A-Z0-9]{0,5})\s*:/gm)];
    expect(routes.length).toBe(12);
    for (const r of routes) {
      expect(live.has(r[1]), `${r[1]} dead`).toBe(true);
      expect(live.has(r[2]), `${r[2]} dead`).toBe(true);
    }
    // the route mechanism only works because currentCode advances on node ARRIVAL, so a
    // route pair need not be cell-adjacent — none of these 12 is
    expect(body).toContain('LHR_to_TLL');            // Yael on Brynn, who is at TLL
    expect(body).toContain('TLL_to_MHQ');            // Brynn on Quill, who is at MHQ
  });

  test('the 8 junction vignettes sit on live road nodes, none doubled up', () => {
    const W = freshWorld();
    const s = src();
    const body = s.slice(s.indexOf('const JUNCTION_VIGNETTES'), s.indexOf('const COMPANION_LINES'));
    const keys = [...body.matchAll(/^ {2}([A-Z][A-Z0-9_]{0,5}): \{ npc:/gm)].map(m => m[1]);
    expect(keys.sort()).toEqual(['ADN', 'BLW', 'BNX', 'DAR', 'J13', 'OKD', 'PCR', 'WRO']);
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of keys) expect(W.nodeMap[k], `${k} missing`).toBeTruthy();
  });

  test("Corelli's five stops are five distinct live nodes, in ascending act order", () => {
    const W = freshWorld();
    const s = src();
    // CORELLI_ITEMS is declared BEFORE this table, so slice to the array's own `\n];`
    const start = s.indexOf('const CORELLI_APPEARANCES');
    const body = s.slice(start, s.indexOf('\n];', start));
    const stops = [...body.matchAll(/nodeCode:'([A-Z0-9]+)', actMin:(\d+), index:(\d+)/g)]
      .map(m => ({ code: m[1], actMin: +m[2], index: +m[3] }));
    expect(stops.length).toBe(5);
    expect(stops.map(x => x.code)).toEqual(['LCY', 'WRO', 'BK', 'NUE', 'TLL']);
    stops.forEach(x => expect(W.nodeMap[x.code], `${x.code} missing`).toBeTruthy());
    expect(stops.map(x => x.index)).toEqual([1, 2, 3, 4, 5]);
    // ascending gate — a stop the player can never satisfy in order is the same dead end
    for (let i = 1; i < stops.length; i++) expect(stops[i].actMin).toBeGreaterThan(stops[i - 1].actMin);
  });

  test('MS_SPARK is gone and both Tilbury Star speakers reach the player', () => {
    const s = src();
    expect(s).not.toContain('MS_SPARK:');
    const sen = s.slice(s.indexOf('  SEN: { name:'), s.indexOf('§LIX–§LXI'));
    expect(sen).toContain('Brannick, Rat Catcher');
    expect(sen).toContain('Something\\\'s off in the hold');       // the pre-discovery line survives
    expect(sen).toContain('Weather\\\'s holding');                  // the captain still owns the base state
    expect(sen).toContain('_senHoldSpeaker()');
    // both render paths must honour the fns, or the modal shows the string "undefined"
    const modal = s.slice(s.indexOf('function storyShowNpc'), s.indexOf('function storyShowNpc') + 700);
    expect(modal).toContain('d.quoteFn ? d.quoteFn() : d.quote');
    expect(modal).toContain('d.nameFn ? d.nameFn() : d.name');
    expect(s).toContain('_npcDial.nameFn ? _npcDial.nameFn() : _npcDial.name');
  });

  test('the SEN speaker predicate switches on the spark arc and nothing else', async () => {
    const s = src();
    // anchor on the exact declaration — `NPC_DIALOGUES` (plural) is a different,
    // earlier registry and slicing to it yields an empty string
    const fn = s.slice(s.indexOf('function _senHoldSpeaker'), s.indexOf('const NPC_DIALOGUE = {'));
    expect(fn).toContain('quest_spark_03');
    // rebuild the predicate in isolation and drive it through its four states
    const make = state => {
      const S_story = state;
      // eslint-disable-next-line no-new-func
      return new Function('S_story', fn + '\nreturn _senHoldSpeaker();')(S_story);
    };
    expect(make({ quests: {} })).toBe(false);                                    // captain
    expect(make({ quests: { quest_spark_03: 'active' } })).toBe(true);           // Brannick, opener
    expect(make({ quests: {}, bioluminescentParasiteFound: true })).toBe(true);  // Brannick, mid
    expect(make({ quests: {}, whodunitSolved: true })).toBe(true);               // Brannick, resolved
    expect(make({ quests: { quest_spark_03: 'available' } })).toBe(false);       // not merely offered
  });
});
