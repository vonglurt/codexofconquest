// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §AUDIT-03b — quest.npc anchoring: the corpus state, the 4-registry vocabulary,
// and the depth-aware field patcher that made the corpus fix land correctly.
//
// Pure-node (no browser): quest.npc is authoring metadata — the game client has ZERO
// quest-level `.npc` reads — so this locks the WBAPI/authoring surface, not gameplay.

const { test, expect } = require('@playwright/test');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const GAME = path.join(ROOT, 'index.html');

function freshWorld() {
  // wbapi-core is a singleton; delete the require cache so each test loads clean.
  delete require.cache[require.resolve(path.join(ROOT, 'js', 'wbapi-core.js'))];
  const W = require(path.join(ROOT, 'js', 'wbapi-core.js'));
  W.load(GAME);
  return W;
}

test.describe('§AUDIT-03b — quest npc anchoring', () => {

  test('the ea02faf bulk mis-stamp is gone — only the 7 genuine Silver quests remain', () => {
    const W = freshWorld();
    const stamped = Object.keys(W.questDb)
      .filter(id => W.questDb[id] && W.questDb[id].npc === 'long_john_silver_sen')
      .sort();
    // Every scene in these seven is built on Silver ("Silver's speech", "Silver nods").
    expect(stamped).toEqual([
      'sen_c1a2', 'sen_c1a3', 'sen_c4a1', 'sen_c4a2', 'sen_c4a3', 'sen_c7a1', 'sen_c7a2',
    ]);
  });

  test('every re-anchored quest carries a key the WBAPI vocabulary accepts', () => {
    const W = freshWorld();
    const bad = Object.entries(W.questDb)
      .filter(([, q]) => q && q.npc && !W.npcKeyOk(q.npc))
      .map(([id, q]) => `${id}=${q.npc}`);
    // The 10 legacy un-normalized values (display names like "Emmer Finch" rather than
    // `emmer`) were normalized by §AUDIT-03h — the tolerated list is now EMPTY, so any
    // unresolvable stamp at all is a regression. Derivations: audit03h-npc-normalize.test.js.
    expect(bad.sort()).toEqual([]);
  });

  test('npcKeyOk accepts all four registries and rejects a bogus key', () => {
    const W = freshWorld();
    expect(Object.keys(W.ebNpcDialogue).length).toBe(20);       // EB_NPC_DIALOGUE parsed
    expect(W.npcKeyOk('long_john_silver_sen')).toBe(true);      // 1. BIRKA_NPC
    expect(W.npcKeyOk('captain_vera_keel')).toBe(true);         // 2. NODE_MAP inline npc
    expect(W.npcKeyOk('benedikt_rasp')).toBe(true);             // 3. NPC_DIALOGUES
    expect(W.npcKeyOk('woodcutter_bram')).toBe(true);           // 4. EB_NPC_DIALOGUE giver
    expect(W.npcKeyOk('definitely_not_an_npc')).toBe(false);
    expect(W.npcKeyOk(null)).toBe(true);                        // absent key = not a violation
  });

  test('editField patches the entry\'s OWN field, never a nested one of the same name', () => {
    const W = freshWorld();
    // quest_vs_01 declares a top-level `npc:` AND a nested `{ kind:'favor', npc:'solvak' }`.
    // Before the depth-aware patcher the nested one won, so the write silently no-op'd.
    const before = [...W._rawSrc.matchAll(/kind:'favor', *npc:\s*["']([^"']+)/g)].map(m => m[1]);
    const r = W.editField('quest', 'quest_vs_01', 'npc', 'yva');
    expect(r.ok).toBe(true);
    expect(r.inserted).toBeFalsy();                    // patched in place, not appended
    expect(W.questDb.quest_vs_01.npc).toBe('yva');
    const after = [...W._rawSrc.matchAll(/kind:'favor', *npc:\s*["']([^"']+)/g)].map(m => m[1]);
    expect(after).toEqual(before);                     // no favor bit was collaterally rewritten
  });

});
