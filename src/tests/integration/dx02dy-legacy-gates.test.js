// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02dy — gates are data, except where they are not.
//
// §VM-01-E rests its whole method on §VM-01-F having made gates data — "a normal
// model-checking problem now that gates are data". `gate:{_legacyFn:true}` is the
// escape hatch out of that claim: `check-questgraph.js`'s gateSat recognises the
// declarative terms and then returns true, so such a gate is unconditionally
// satisfiable and the prover cannot see the condition at all.
//
// Fourteen quests carried it. Six were `() => true` — the hatch holding a tautology —
// and two were counter comparisons the grammar already expresses with `countMin`.
// All eight are migrated here. The remaining six were item-possession conditions the
// activation leaf had no term for; §DX-02iu ported `itemsAll` and closed them, so the
// last case below asserts the hatch is empty rather than naming survivors.

const { test, expect } = require('@playwright/test');
const { seedAndLoad } = require('./helpers.js');

const NEWGAME = { str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

const MIGRATED = [
  'quest_lame_lystra', 'quest_areopagus', 'quest_ephesus_riot',
  'quest_shipwreck_melta', 'quest_courier_release', 'quest_crypt_survey',
  'quest_inn_06', 'quest_lxvii67',
];

test.describe('§DX-02dy — the escape hatch shrinks, and nothing moves behind it', () => {

  test('the migrated eight carry a data gate and no closure', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(({ MIGRATED }) => MIGRATED.map(id => ({
      id,
      gate: QUEST_DB[id].gate,
      legacy: !!(QUEST_DB[id].gate || {})._legacyFn,
      hasCond: !!QUEST_DB[id].activateCond,
    })), { MIGRATED });
    for (const q of r) {
      expect(q.legacy, `${q.id} still on the escape hatch`).toBe(false);
      // The corpus invariant: a quest declares its activation ONE way, never both.
      expect(q.hasCond, `${q.id} carries both a data gate and a closure`).toBe(false);
    }
    expect(r.find(q => q.id === 'quest_inn_06').gate)
      .toEqual({ countMin: [{ path: 'innmotherKindness', min: 5 }] });
    expect(r.find(q => q.id === 'quest_lxvii67').gate)
      .toEqual({ countMin: [{ path: 'faith_folk', min: 1 }] });
  });

  test('no quest in the corpus declares its activation twice', async ({ page }) => {
    await seedAndLoad(page);
    const both = await page.evaluate(() => Object.values(QUEST_DB)
      .filter(q => q.activateCond && q.gate && !q.gate._legacyFn && Object.keys(q.gate).length)
      .map(q => q.id));
    expect(both).toEqual([]);
  });

  test('the two counter gates fire exactly where their closures did', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      const out = [];
      for (const [id, field, min] of [['quest_inn_06', 'innmotherKindness', 5], ['quest_lxvii67', 'faith_folk', 1]]) {
        for (const v of [undefined, -3, 0, min - 1, min, min + 2]) {
          storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
          if (v === undefined) delete S_story[field]; else S_story[field] = v;
          // the closure the gate replaces, evaluated here as the reference
          const expected = ((S_story[field] || 0) >= min);
          out.push({ id, field, v: String(v), got: QuestRuntime.canActivate(id), expected });
        }
      }
      return out;
    });
    expect(r.length).toBe(12);
    for (const c of r) expect(c.got, `${c.id} @ ${c.field}=${c.v}`).toBe(c.expected);
  });

  test('the six tautology gates activate unconditionally, as they always did', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      const ids = ['quest_lame_lystra', 'quest_areopagus', 'quest_ephesus_riot',
                   'quest_shipwreck_melta', 'quest_courier_release', 'quest_crypt_survey'];
      // An EMPTY gate is held at a backfilled node when the quest has no completion —
      // the reason `gate:{}` is not a free substitution. None of the six sits on one.
      return ids.map(id => ({ id, can: QuestRuntime.canActivate(id),
                              backfilled: NODE_CODE_BACKFILLED.has(QUEST_DB[id].activateNode) }));
    });
    for (const q of r) {
      expect(q.can, `${q.id}`).toBe(true);
      expect(q.backfilled, `${q.id} sits on a backfilled node — gate:{} would hold it`).toBe(false);
    }
  });

  test('nothing is left on the hatch (§DX-02iu closed the last six)', async ({ page }) => {
    await seedAndLoad(page);
    const left = await page.evaluate(() => Object.values(QUEST_DB)
      .filter(q => q.gate && q.gate._legacyFn).map(q => q.id).sort());
    expect(left).toEqual([]);
  });
});
