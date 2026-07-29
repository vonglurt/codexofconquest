// SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com
// §AUDIT-03g — every quest carries an `npc` anchor, and the 68 that had none are
// anchored by DERIVATION, not by a bulk default.
//
// Why this test exists: `./api.sh audit` raises an ERROR for a quest with no `npc`
// field. That error is what provoked the `ea02faf` bulk-default (203 quests stamped
// `long_john_silver_sen`) that §AUDIT-03b spent a whole session undoing. This locks
// the *coverage* invariant so the error can never come back — and pins the derivation
// evidence for each family so a future sweep cannot quietly re-flatten them.
//
// Pure-node (no browser): quest.npc is authoring metadata — the game client has ZERO
// quest-level `.npc` reads (§AUDIT-03b) — so this locks the WBAPI/authoring surface.

const { test, expect } = require('@playwright/test');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const GAME = path.join(ROOT, 'roll2hit-v3.html');

function freshWorld() {
  delete require.cache[require.resolve(path.join(ROOT, 'js', 'wbapi-core.js'))];
  const W = require(path.join(ROOT, 'js', 'wbapi-core.js'));
  W.load(GAME);
  return W;
}

// The 68 quests §AUDIT-03g anchored, grouped by the evidence that decided each key.
const ANCHORED = {
  // §D02 Epic-Battleground approach arcs inherit their battleground's giver —
  // the same key the arc's own quest_e?_primary / _return quests already carry.
  captain_selene_draketide: [                       // Abyssal Scriptorium (RAI) — cf. quest_ea_primary
    'quest_d0201_a1', 'quest_d0201_a2', 'quest_d0201_a3', 'quest_d0201_a4', 'quest_d0201_a5',
    'quest_d0209_a1', 'quest_d0209_a2', 'quest_d0209_a3', 'quest_d0209_a4', 'quest_d0209_a5',
  ],
  warlord_kael_mordus: [                            // Void Shaman's Sanctum (BK) — cf. quest_eg_primary
    'quest_d0205_a1', 'quest_d0205_a2', 'quest_d0205_a3', 'quest_d0205_a4', 'quest_d0205_a5',
  ],
  // Commander Seraphine Bruhns — profile key `auros`, NODE_MAP inline npc of both HKG
  // and TLS, and the named figure of the Workshop schematics + the Warrant thread.
  auros: [
    'quest_d0207_a1', 'quest_d0207_a2', 'quest_d0207_a3', 'quest_d0207_a4', 'quest_d0207_a5',
    'quest_d0204_a1', 'quest_d0204_a2', 'quest_d0204_a3', 'quest_d0204_a4', 'quest_d0204_a5',
    'quest_d0210_a1', 'quest_d0210_a2', 'quest_d0210_a3', 'quest_d0210_a4', 'quest_d0210_a5',
    'quest_d0206_a1', 'quest_d0206_a2', 'quest_d0206_a3', 'quest_d0206_a4', 'quest_d0206_a5',
    'quest_void_below', 'quest_void_tide_21', 'quest_void_tide_35', 'quest_void_tide_42',
  ],
  // The Shattered-Codex archivist: the Inquisitor construct, the clr_01 finale's
  // "archivist at Weimar", and the one §D02 arc whose presiding character (the Mother
  // Mimic) has no registry entry at all — provisional, tracked as §AUDIT-03i.
  archivus_sweelinck: [
    'quest_d0208_a1', 'quest_d0208_a2', 'quest_d0208_a3', 'quest_d0208_a4', 'quest_d0208_a5',
    'quest_inquisitor_handshake', 'quest_inquisitor_questions', 'quest_inquisitor_final',
    'clr_01_act5',
  ],
  watcher_gvw:           ['clr_01_act3', 'clr_01_act4'],          // chain-mates act1/act2
  johannes_von_weisheit: ['quest_math_01', 'quest_math_02', 'quest_math_03',
                          'quest_math_04', 'quest_math_05'],      // the Math Station speaks in-arc
  yael: ['quest_ceremonia_yael_01', 'quest_ceremonia_yael_02', 'quest_ceremonia_yael_03',
         'quest_ceremonia_yael_04', 'quest_ceremonia_yael_05',
         'quest_slums_cleanup', 'quest_city_watch_patrol', 'quest_crypt_survey'],
  city_guard_captain:    ['quest_courier_release', 'quest_sir_jullean'],  // LHR inline npc
  brynn:                 ['quest_brynn_firewood', 'quest_brynn_ledger'],  // TLL inline npc
  crov:                  ['quest_pit_debut'],                             // cf. quest_pit_training
};

test.describe('§AUDIT-03g — npc anchor coverage', () => {

  test('every quest in the corpus carries an npc anchor', () => {
    const W = freshWorld();
    const orphans = Object.keys(W.questDb).filter(id => !W.questDb[id].npc);
    expect(orphans).toEqual([]);                       // ./api.sh audit errors = 0
    expect(Object.keys(W.questDb).length).toBe(2853);  // and nothing was lost re-anchoring
  });

  test('the 68 re-anchored quests hold exactly their derived keys', () => {
    const W = freshWorld();
    const wrong = [];
    let count = 0;
    for (const [npc, ids] of Object.entries(ANCHORED))
      for (const id of ids) {
        count++;
        const got = W.questDb[id] && W.questDb[id].npc;
        if (got !== npc) wrong.push(`${id}: expected ${npc}, got ${got}`);
      }
    expect(count).toBe(68);
    expect(wrong).toEqual([]);
  });

  test('every derived key resolves in the 4-registry vocabulary', () => {
    const W = freshWorld();
    const unresolved = Object.keys(ANCHORED).filter(npc => !W.npcKeyOk(npc));
    expect(unresolved).toEqual([]);                    // none of the 68 will advise-warn
  });

  test('the §D02 approach arcs match their battleground\'s own giver', () => {
    const W = freshWorld();
    // The derivation, re-asserted from the live corpus rather than hard-coded: the EB
    // primary/return quests at a node define that battleground's giver, and the §D02
    // approach arc that activates at the same node inherits it.
    expect(W.questDb.quest_ea_primary.activateNode).toBe('RAI');
    expect(W.questDb.quest_d0201_a1.activateNode).toBe('RAI');
    expect(W.questDb.quest_d0201_a1.npc).toBe(W.questDb.quest_ea_primary.npc);
    expect(W.questDb.quest_d0209_a1.npc).toBe(W.questDb.quest_ea_primary.npc);

    expect(W.questDb.quest_eg_primary.activateNode).toBe('BK');
    expect(W.questDb.quest_d0205_a1.activateNode).toBe('BK');
    expect(W.questDb.quest_d0205_a1.npc).toBe(W.questDb.quest_eg_primary.npc);

    // Chain coherence: clr_01 acts 3–4 carry acts 1–2's anchor.
    expect(W.questDb.clr_01_act3.npc).toBe(W.questDb.clr_01_act1.npc);
    expect(W.questDb.clr_01_act4.npc).toBe(W.questDb.clr_01_act2.npc);
  });

});
