// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ar — WBAPI.quests.chain() reads declarative gates and bits, not only S_story.
// tokens in a quest's source, and the quest delete guard is fed by it.
//
// The chain is authoring metadata read by the WBAPI; edit.html carries a port of the
// same analyser, held equal to wbapi-core's by the last test (§DX-02mb).

const { test, expect } = require('@playwright/test');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const GAME = path.join(ROOT, 'play.html');

// Quests the editor's own parser does not load (§DX-02mc).
const EDITOR_UNPARSED = ['quest_sb_01', 'quest_sea_01'];

function freshWorld() {
  delete require.cache[require.resolve(path.join(ROOT, 'src', 'js', 'wbapi-core.js'))];
  const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
  W.load(GAME);
  return W;
}

test.describe('§DX-02ar — the declarative quest chain', () => {

  test('a mission_bit write links to the gate that reads it', () => {
    const W = freshWorld();
    expect(W._flagToQuests.wisPage1_masks.writes).toContain('quest_wis_01');
    expect(W.quests.chain('quest_wis_01').downstream).toContain('quest_wis_07');
    expect(W.quests.chain('quest_wis_07').upstream).toContain('quest_wis_01');
  });

  test('flag edges and sequence edges come from gate, completion and nested bits', () => {
    const W = freshWorld();
    W.questDb.__ar_a = { id: '__ar_a', schema: 'UQF-1.0', bits: [{ kind: 'skill_check', onPass: [],
      onFail: [{ kind: 'choice', options: [{ bits: [{ kind: 'flag_write', set: ['__arFlag'] }] }] }] }] };
    W.questDb.__ar_b = { id: '__ar_b', schema: 'UQF-1.0', gate: { any: [{ flags: ['__arFlag'] }] } };
    W.questDb.__ar_c = { id: '__ar_c', schema: 'UQF-1.0', completion: { questsDone: ['__ar_b'] },
      bits: [{ kind: 'unlock', quests: ['__ar_d'] }] };
    W.questDb.__ar_d = { id: '__ar_d', schema: 'UQF-1.0' };
    W._buildIndexes();
    expect(W.quests.chain('__ar_a').downstream).toEqual(['__ar_b']);
    expect(W.quests.chain('__ar_b').upstream).toEqual(['__ar_a']);
    expect(W.quests.chain('__ar_b').sequence).toEqual({ upstream: [], downstream: ['__ar_c'] });
    expect(W.quests.chain('__ar_c').sequence).toEqual({ upstream: ['__ar_b'], downstream: ['__ar_d'] });
    expect(W.quests.chain('__ar_d').sequence.upstream).toEqual(['__ar_c']);
  });

  test('the delete guard refuses a quest another quest names in questsDone', () => {
    const W = freshWorld();
    const gated = Object.keys(W.questDb).find(id => {
      const c = W.quests.chain(id);
      return c.sequence.downstream.length && !c.downstream.length;
    });
    expect(gated, 'a quest held only by a sequence edge').toBeTruthy();
    const r = W.quests.delete(gated);
    expect(r.ok).toBe(false);
    expect(r.blockedBy.downstream).toEqual(W.quests.chain(gated).sequence.downstream);
    expect(W.questDb[gated]).toBeTruthy();
  });

  test('edit.html builds the same chain and delete guard as wbapi-core for every quest', async ({ page }) => {
    const W = freshWorld();
    const norm = c => ({ up: [...c.upstream].sort(), dn: [...c.downstream].sort(),
      sUp: [...c.sequence.upstream].sort(), sDn: [...c.sequence.downstream].sort() });
    const core = {};
    for (const id of Object.keys(W.questDb))
      core[id] = { ...norm(W.quests.chain(id)), del: [...W._deps.quest(id).downstream].sort() };
    await page.goto('/edit.html');
    const ed = await page.evaluate(async () => {
      WBAPI.load(await (await fetch('/play.html')).text());
      const out = {};
      for (const id of Object.keys(WBAPI.questDb)) {
        const c = WBAPI.quests.chain(id);
        out[id] = { up: [...c.upstream].sort(), dn: [...c.downstream].sort(),
          sUp: [...c.sequence.upstream].sort(), sDn: [...c.sequence.downstream].sort(),
          del: [...WBAPI._deps.quest(id).downstream].sort() };
      }
      return out;
    });
    const unparsed = Object.keys(core).filter(id => !(id in ed));
    expect(unparsed.sort()).toEqual(EDITOR_UNPARSED);
    const seen = c => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v.filter(id => id in ed)]));
    const differ = Object.keys(ed).filter(id => JSON.stringify(seen(core[id])) !== JSON.stringify(ed[id]));
    expect(differ).toEqual([]);
  });
});
