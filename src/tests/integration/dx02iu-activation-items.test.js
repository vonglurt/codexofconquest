// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02iu — the activation gate had no item term, and the completion gate had two.
//
// The six quests §DX-02dy left on `gate:{_legacyFn:true}` were one class: they ask what
// the player is carrying, and `_matchActivationLeaf` could not ask that. `itemsAll` is
// ported from the completion leaf — the SAME name, the same exact matcher, the same
// AND position. The fuzzy `items` term is deliberately NOT ported: it sits in an
// OR-group on the completion side, so one name would carry two meanings.
//
// The migration narrows fuzzy matching to exact. That narrowing is proved harmless
// against the game's whole item-name universe, and asserted as a deliberate choice
// where it does differ.

const { test, expect } = require('@playwright/test');
const { seedAndLoad } = require('./helpers.js');

const NEWGAME = { str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

const GATES = {
  quest_muffat_01:     { itemsAll: ['Trade Seal (Shard #1)'] },
  quest_road_damascus: { itemsAll: ['Three Jerusalem Warrants'] },
  quest_wm_05:         { flags: ['wmLowerArchiveUnlocked'], itemsAll: ['Y. Gurt Field Survey'] },
  quest_tour_01:       { itemsAll: ['Fishing Rod'] },
  quest_fish_01:       { itemsAll: ['Fishing Rod'], countMin: [{ path: 'fishingCatchLog', min: 1 }] },
  quest_guide_01:      { itemsAll: ['Fishing Rod'] },
};

test.describe('§DX-02iu — activation can ask what the player is carrying', () => {

  test('the escape hatch is empty and the six carry data gates', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(({ GATES }) => ({
      hatch: Object.values(QUEST_DB).filter(q => q.gate && q.gate._legacyFn).map(q => q.id),
      gates: Object.fromEntries(Object.keys(GATES).map(id => [id, QUEST_DB[id].gate])),
      conds: Object.keys(GATES).filter(id => QUEST_DB[id].activateCond),
    }), { GATES });
    expect(r.hatch).toEqual([]);
    expect(r.conds).toEqual([]);
    for (const id of Object.keys(GATES)) expect(r.gates[id], id).toEqual(GATES[id]);
  });

  test('itemsAll is exact, AND-position, and counts copies', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      const at = (inv, flag) => {
        S_story.inventory = inv.map(name => ({ name }));
        S_story.wmLowerArchiveUnlocked = !!flag;
        S_story.fishingCatchLog = [1];
        return {
          tour: QuestRuntime.canActivate('quest_tour_01'),
          wm: QuestRuntime.canActivate('quest_wm_05'),
        };
      };
      return {
        empty: at([]),
        exact: at(['Fishing Rod']),
        upgrade: at(['River Rod +1']),          // a DIFFERENT item, not a longer name
        wmItemOnly: at(['Y. Gurt Field Survey'], false),
        wmBoth: at(['Y. Gurt Field Survey'], true),
      };
    });
    expect(r.empty.tour).toBe(false);
    expect(r.exact.tour).toBe(true);
    expect(r.upgrade.tour, 'an upgrade rod is a different item, not a rod that matches').toBe(false);
    // AND-position: the flag half and the item half must BOTH hold.
    expect(r.wmItemOnly.wm).toBe(false);
    expect(r.wmBoth.wm).toBe(true);
  });

  test('every gate fires exactly where its closure did, over the real item universe', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      // Rebuild the closures the gates replaced, and re-derive the item universe from
      // the shipped data rather than restating a list that would rot.
      const CLOSURES = {
        quest_muffat_01:     inv => inv.some(i => i.name.includes('Trade Seal') || 'Trade Seal'.includes(i.name.split(' (')[0])),
        quest_road_damascus: inv => inv.some(i => i.name === 'Three Jerusalem Warrants'),
        quest_wm_05:         inv => !!S_story.wmLowerArchiveUnlocked && inv.some(i => i.name === 'Y. Gurt Field Survey'),
        quest_tour_01:       inv => inv.some(i => (i.name || '').toLowerCase().includes('fishing rod')),
        quest_fish_01:       inv => inv.some(i => (i.name || '').toLowerCase().includes('fishing rod')) && (S_story.fishingCatchLog || []).length > 0,
        quest_guide_01:      inv => inv.some(i => (i.name || '').toLowerCase().includes('fishing rod')),
      };
      // The item universe, walked out of the shipped data: node loot as the engine
      // splits it, plus every `name` reachable inside a quest's bit tree (grants sit
      // in nested onPass / onFail / onComplete arrays, not just the top level).
      const U = new Set();
      const walk = (v, d) => {
        if (!v || d > 8) return;
        if (Array.isArray(v)) return v.forEach(x => walk(x, d + 1));
        if (typeof v !== 'object') return;
        if (typeof v.name === 'string') U.add(v.name);
        for (const k in v) if (k !== 'fn') walk(v[k], d + 1);
      };
      for (const n of Object.values(NODE_MAP))
        if (n.loot && !/^VICTORY|^Portal Key/.test(n.loot)) n.loot.split(' · ').forEach(x => U.add(x.trim()));
      for (const q of Object.values(QUEST_DB)) {
        walk(q.bits, 0); walk(q.onComplete, 0); walk(q.itemChain, 0);
        for (const nm of ((q.completion || {}).items || [])) U.add(nm);
        for (const nm of ((q.completion || {}).itemsAll || [])) U.add(typeof nm === 'string' ? nm : nm.name);
      }
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.wmLowerArchiveUnlocked = true; S_story.fishingCatchLog = [1];
      const names = [...U].filter(Boolean);
      const bad = [];
      for (const name of names) {
        S_story.inventory = [{ name }];
        for (const id of Object.keys(CLOSURES)) {
          const want = CLOSURES[id](S_story.inventory);
          const got = QuestRuntime.canActivate(id);
          if (want !== got) bad.push({ id, name, want, got });
        }
      }
      return { n: names.length, bad, names };
    });
    expect(r.n).toBeGreaterThan(100);            // the universe was actually built
    // the four names these gates name must be IN it, or the sweep proves nothing
    for (const nm of ['Fishing Rod', 'Trade Seal (Shard #1)', 'Three Jerusalem Warrants', 'Y. Gurt Field Survey'])
      expect(r.names, nm).toContain(nm);
    expect(r.bad, 'exact matching must agree with the closures on every real item name').toEqual([]);
  });

  test('the narrowing from fuzzy to exact is deliberate, and only reaches names the game never mints', async ({ page }) => {
    await seedAndLoad(page);
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      const holds = name => { S_story.inventory = [{ name }]; return QuestRuntime.canActivate('quest_tour_01'); };
      const seal = name => { S_story.inventory = [{ name }]; return QuestRuntime.canActivate('quest_muffat_01'); };
      const minted = new Set();
      for (const n of Object.values(NODE_MAP))
        if (n.loot && !/^VICTORY|^Portal Key/.test(n.loot)) n.loot.split(' · ').forEach(x => minted.add(x.trim()));
      return {
        realRod: holds('Fishing Rod'),
        hypotheticalRod: holds('Old Fishing Rod'),
        realSeal: seal('Trade Seal (Shard #1)'),
        bareSeal: seal('Trade Seal'),
        // …and neither hypothetical is an item the world actually mints.
        hypotheticalsExist: ['Old Fishing Rod', 'Trade Seal'].filter(n => minted.has(n)),
      };
    });
    expect(r.realRod).toBe(true);
    expect(r.realSeal).toBe(true);
    // The closures would have matched these; the exact term does not, on purpose.
    expect(r.hypotheticalRod).toBe(false);
    expect(r.bareSeal).toBe(false);
    expect(r.hypotheticalsExist, 'if the world ever mints one of these, this gate must be revisited').toEqual([]);
  });
});
