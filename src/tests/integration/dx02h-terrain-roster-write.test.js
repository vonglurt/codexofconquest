// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02h/§DX-02i — the WORLD_DB terrain roster: its write path round-trips, its
// shape stays stat blocks, and no voidTainted monster is authored-but-unreachable.
//
// Why this test exists. Three separate silent-failure classes met on this one field:
//
// 1. PUT /api/terrain reported success and persisted NOTHING. It set
//    WBAPI.worldDb[k][field] in memory and returned ok:true without ever calling
//    save() — Hazard #5 (§DX-01d/i) in a fifth write path. Worse than the delete
//    bug it mirrors: GET read the phantom edit back for the rest of the process's
//    life, so the read path CORROBORATED the lie. `editField`'s sectionMap simply
//    had no `terrain` entry, so WORLD_DB had no source-level writer at all.
//
// 2. WORLD_DB is the one collection whose array field holds CODE IDENTIFIERS —
//    `monsters:[ P.giant_rat, … ]`, not JSON. Routing it through the generic
//    editStructuredField would emit ["giant_rat"], which re-parses to a string
//    array. Nothing throws (_buildIndexes maps strings fine), but the GAME reads
//    WORLD_DB[t].monsters as stat blocks: _monsterLevel would score every entry 1
//    and _weightedMonsterPick would weight on `undefined`. §DX-01c's "a write into
//    a real-but-wrong object never throws", in a third dimension.
//
// 3. `void_rat_swarm` was authored content nothing could reach — a MONSTER_POOL
//    entry and a trophy drop, in no roster, on no node.battle, in no quest. Its
//    voidTainted twin `void_wolf` had the identical dead shape, which the row that
//    filed it did not know (it claimed the swarm was unique in this).
//
// The third assertion is the inverse one, and it is the durable half: a roster that
// re-parses to strings instead of stat blocks is invisible to every other gate.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const GAME = path.join(ROOT, 'play.html');

function freshWorld(file) {
  delete require.cache[require.resolve(path.join(ROOT, 'src', 'js', 'wbapi-core.js'))];
  const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
  W.load(file || GAME);
  return W;
}

test.describe('§DX-02h — the terrain roster write path', () => {

  // The acceptance test for a write path is a ROUND TRIP: save, re-parse, assert the
  // change survived (CONTRIBUTING Hazard #5). Nothing throws when it does not.
  test('a roster write survives save() and re-parses from disk', () => {
    const tmp = path.join(os.tmpdir(), `coc-dx02h-${process.pid}.html`);
    fs.copyFileSync(GAME, tmp);
    try {
      const W = freshWorld(tmp);
      const before = (W._terrainToMonsters.crypt || []).slice();
      expect(before.length).toBeGreaterThan(0);

      const wrote = W.editTerrainRoster('crypt', [...before, 'giant_rat']);
      expect(wrote.ok, wrote.error).toBe(true);
      // save(tmp) writes IN PLACE. §DX-02k: the argless form is now REFUSED — it
      // used to stamp a dated 5.4 MB snapshot into the process CWD (which read as
      // "the repo root" only because that is where the server runs).
      const saved = W.save(tmp);
      expect(saved.ok).toBe(true);

      // Re-parse from disk — the only proof that counts.
      const W2 = freshWorld(tmp);
      expect(W2._terrainToMonsters.crypt).toEqual([...before, 'giant_rat']);
      // and the write disturbed nothing else
      expect(Object.keys(W2.worldDb).length).toBe(Object.keys(W.worldDb).length);
      expect(Object.keys(W2.nodeMap).length).toBe(Object.keys(W.nodeMap).length);
      expect(Object.keys(W2.questDb).length).toBe(Object.keys(W.questDb).length);
    } finally {
      fs.existsSync(tmp) && fs.unlinkSync(tmp);
    }
  });

  test('a bad roster is refused with the source untouched', () => {
    const tmp = path.join(os.tmpdir(), `coc-dx02h-neg-${process.pid}.html`);
    fs.copyFileSync(GAME, tmp);
    try {
      const W = freshWorld(tmp);
      const sha = fs.readFileSync(tmp, 'utf8');

      const unknown = W.editTerrainRoster('crypt', ['skeleton', 'no_such_monster']);
      expect(unknown.ok).toBe(false);
      expect(unknown.error).toContain('source NOT modified');

      const notArray = W.editTerrainRoster('crypt', 'skeleton');
      expect(notArray.ok).toBe(false);

      const noTerrain = W.editTerrainRoster('no_such_terrain', ['skeleton']);
      expect(noTerrain.ok).toBe(false);

      // The roster must never go through the string-field writer: patchStringField
      // finds no quoted value, and insertStringField would then ADD a SECOND
      // `monsters:` key — the last-key-wins rot §AUDIT-03a's gate #11 exists to catch.
      const viaEditField = W.editField('terrain', 'crypt', 'monsters', ['skeleton']);
      expect(viaEditField.ok).toBe(false);
      expect(viaEditField.error).toContain('editTerrainRoster');

      expect(W.save(tmp).ok).toBe(true);
      expect(fs.readFileSync(tmp, 'utf8')).toBe(sha);   // nothing was written
    } finally {
      fs.existsSync(tmp) && fs.unlinkSync(tmp);
    }
  });

  // The inverse assertion. A roster written as JSON strings parses without error and
  // is invisible to every other gate — but the encounter picker reads `.ac`/`.hp` off
  // each entry, so the whole terrain would silently draw at level 1 on undefined stats.
  test('every terrain roster entry parses to a stat block, not a bare key string', () => {
    const W = freshWorld();
    const broken = [];
    for (const [tk, terrain] of Object.entries(W.worldDb)) {
      for (const m of (terrain.monsters || [])) {
        if (typeof m !== 'object' || m === null || typeof m.ac !== 'number' || typeof m.hp !== 'number')
          broken.push(`${tk} → ${JSON.stringify(m)}`);
      }
    }
    expect(broken, 'a roster written as JSON strings drives _monsterLevel to 1 for the whole terrain').toEqual([]);
  });

  test('label and icon edits reach the source, not just the in-memory model', () => {
    const tmp = path.join(os.tmpdir(), `coc-dx02h-str-${process.pid}.html`);
    fs.copyFileSync(GAME, tmp);
    try {
      const W = freshWorld(tmp);
      expect(W.editField('terrain', 'crypt', 'label', 'Crypt (round trip)').ok).toBe(true);
      expect(W.save(tmp).ok).toBe(true);
      expect(freshWorld(tmp).worldDb.crypt.label).toBe('Crypt (round trip)');
    } finally {
      fs.existsSync(tmp) && fs.unlinkSync(tmp);
    }
  });

  test('no voidTainted monster is authored-but-unreachable', () => {
    const W = freshWorld();
    const tainted = Object.entries(W.monsterPool)
      .filter(([, m]) => m.voidTainted).map(([k]) => k);
    expect(tainted.length).toBeGreaterThanOrEqual(2);   // void_rat_swarm, void_wolf
    const orphans = tainted.filter(k => !(W._monsterToTerrains[k] || []).length);
    expect(orphans, 'a pool entry in no roster can never appear in play').toEqual([]);
    // Both landed in `sewers` — its one node is SFT "Visby Sewers", act 5, and Visby is
    // where VOID_TIDE_EVENTS[21] sights the first Void Walker.
    expect(W._terrainToMonsters.sewers).toContain('void_rat_swarm');
    expect(W._terrainToMonsters.sewers).toContain('void_wolf');
  });
});

test.describe('§DX-02i — the retired XP_BY_TIER table', () => {

  test('XP_BY_TIER is gone and the shipped model is AC x maxHP', () => {
    const src = fs.readFileSync(GAME, 'utf8');
    // Only the retirement note may name it — never a live declaration.
    expect(/^\s*const\s+XP_BY_TIER\s*=/m.test(src),
      'a tier→XP table read by nothing is one grep from being adopted').toBe(false);
    expect(src).toContain('(S.enemy.ac || 10) * (S.opp.maxHp || 10)');
  });
});
