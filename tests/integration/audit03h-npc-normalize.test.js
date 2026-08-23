// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §AUDIT-03h — the 10 display-name `npc` values normalized to real registry keys.
//
// `ea02faf`-era authoring wrote the NPC's *display name* ("Emmer Finch") into `quest.npc`
// instead of the registry key (`emmer`), so those 10 quests resolved in NO registry and
// advise-warned forever. This locks the normalized state, the derivations behind it, and
// the fact that the tolerated-unresolvable list is now empty.
//
// Pure-node (no browser): `quest.npc` is authoring metadata — the game client has ZERO
// quest-level `.npc` reads (§AUDIT-03b) — so this locks the WBAPI/authoring surface.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const GAME = path.join(ROOT, 'index.html');

function freshWorld() {
  delete require.cache[require.resolve(path.join(ROOT, 'js', 'wbapi-core.js'))];
  const W = require(path.join(ROOT, 'js', 'wbapi-core.js'));
  W.load(GAME);
  return W;
}

// The shipped mapping. Each key is derived from the corpus, not chosen by taste — see the
// per-family justifications asserted below and the derivation table in quest.md.
const NORMALIZED = {
  quest_guide_01: 'emmer',
  quest_guide_02: 'emmer',
  quest_guide_03: 'emmer',
  quest_guide_04: 'emmer',          // "Bog Mudwhistle" — see the tour-opponent test below
  quest_guide_05: 'emmer',
  quest_guide_06: 'the_fisherman',
  quest_scar_01: 'gret',
  quest_scar_02: 'pier',
  quest_scar_03: 'gret',
  quest_scar_04: 'gret',
};

test.describe('§AUDIT-03h — display-name npc values normalized', () => {

  test('all 10 quests carry their derived registry key, and every key resolves', () => {
    const W = freshWorld();
    for (const [id, key] of Object.entries(NORMALIZED)) {
      expect(W.questDb[id], `${id} exists`).toBeTruthy();
      expect(W.questDb[id].npc, `${id}.npc`).toBe(key);
      expect(W.npcKeyOk(key), `${key} is in the WBAPI vocabulary`).toBe(true);
    }
  });

  test('no quest anywhere in the corpus holds an unresolvable npc value', () => {
    const W = freshWorld();
    const bad = Object.entries(W.questDb)
      .filter(([, q]) => q && q.npc && !W.npcKeyOk(q.npc))
      .map(([id, q]) => `${id}=${q.npc}`);
    expect(bad.sort()).toEqual([]);      // the §AUDIT-03b pin, now empty
    // …and the specific display-name shape (capitals / spaces) can never come back.
    const displayNames = Object.entries(W.questDb)
      .filter(([, q]) => q && typeof q.npc === 'string' && /[A-Z ]/.test(q.npc))
      .map(([id, q]) => `${id}=${q.npc}`);
    expect(displayNames.sort()).toEqual([]);
  });

  test('the derivations are corroborated by the corpus, not by taste', () => {
    const W = freshWorld();

    // 1. `emmer` / `gret` / `pier` are BIRKA_NPC profiles at the arcs' own nodes,
    //    and the arcs' own favor bits already spend those exact keys.
    expect(W.birkaNpcs.emmer.node).toBe('SSJ');   // the quest_guide_* arc's activateNode
    expect(W.birkaNpcs.gret.node).toBe('NUE');    // the quest_scar_* arc's activateNode
    expect(W.birkaNpcs.pier.node).toBe('NUE');
    const favorKeys = new Set(
      [...W._rawSrc.matchAll(/kind:\s*'favor',\s*npc:\s*["']([^"']+)/g)].map(m => m[1]));
    expect(favorKeys.has('emmer')).toBe(true);    // quest_guide_06 onComplete
    expect(favorKeys.has('gret')).toBe(true);     // quest_scar_04  onComplete

    // 2. `the_fisherman` is both an NPC_DIALOGUES key and SSJ's own inline npc,
    //    which normalizes to the identical slug — one character, one key.
    expect(W.npcDialogues.the_fisherman).toBeTruthy();
    expect(String(W.nodeMap.SSJ.npc).toLowerCase().replace(/\s/g, '_')).toBe('the_fisherman');

    // 3. Bog Mudwhistle is a Yugurt-tournament OPPONENT (NPC_TOUR_OPPONENTS key `bog`),
    //    not an NPC in any of the four registries — so quest_guide_04 cannot be anchored
    //    to him. The corpus precedent is unambiguous: the sibling tournament quests are
    //    each titled after an opponent (quest_tour_03 is literally "Bog's Terms") and
    //    every one of them anchors to `emmer`.
    expect(W.npcKeyOk('bog')).toBe(false);
    expect(W.npcKeyOk('bog_mudwhistle')).toBe(false);
    expect(/key:'bog',\s*name:'Bog Mudwhistle'/.test(W._rawSrc)).toBe(true);
    const tour = Object.entries(W.questDb).filter(([id]) => /^quest_tour_\d+$/.test(id));
    expect(tour.length).toBeGreaterThan(2);
    for (const [id, q] of tour) expect(q.npc, `${id} anchors to the arc's apprentice`).toBe('emmer');
  });

  test('negative control — a re-planted display name is caught', () => {
    const W = freshWorld();
    expect(W.npcKeyOk('Emmer Finch')).toBe(false);
    expect(W.npcKeyOk('Gret Orrens')).toBe(false);
    W.questDb.quest_guide_01.npc = 'Emmer Finch';        // in-memory only; never saved
    const bad = Object.entries(W.questDb)
      .filter(([, q]) => q && q.npc && !W.npcKeyOk(q.npc))
      .map(([id]) => id);
    expect(bad).toEqual(['quest_guide_01']);             // so the guard above is not vacuous
  });

  test('source guard — no display-name npc literal survives in QUEST_DB', () => {
    const W = freshWorld();
    const src = fs.readFileSync(GAME, 'utf8');
    // Scope to the quest section: a display name in a `npc:` field is only wrong HERE.
    // (NODE_MAP's inline `npc:'The Fisherman'` is registry 2 and legitimately a display name.)
    const start = src.indexOf('WORLDBUILDER:QUEST_DB:START');
    const end = src.indexOf('WORLDBUILDER:QUEST_DB:END');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const questSrc = src.slice(start, end);
    const offenders = [...questSrc.matchAll(/\bnpc:\s*["']([^"']*[A-Z ][^"']*)["']/g)].map(m => m[1]);
    expect([...new Set(offenders)].sort()).toEqual([]);

    // The display names themselves stay everywhere else — they are prose, `disposition`
    // quotes, tournament-opponent rows and profile `name:` fields.
    expect(src.includes('Bog Mudwhistle')).toBe(true);
    expect(src.includes('Gret Orrens')).toBe(true);
    // …including SSJ's inline `npc:'The Fisherman'`, which is registry 2 and is precisely
    // what makes the key `the_fisherman` resolvable. Normalizing it would be the bug.
    expect(W.nodeMap.SSJ.npc).toBe('The Fisherman');
  });

});
