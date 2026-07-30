// SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com
// §DX-01c — `post monster` writes a real monster, into the real section.
//
// Why this test exists: for as long as the route existed, WBAPI Hazard #2 said
// "`api.sh post monster` is BROKEN — do NOT use it", so all 391 monsters in the game
// were hand-authored by direct HTML edit — a standing exception to the API-first
// invariant. Two defects were stacked:
//
//   1. WRONG SECTION. `insertBeforeSectionClose` took "the last `};` before the
//      section's END anchor". MONSTER_POOL is the one section that NESTS another —
//      MONSTER_DROPS:END sits immediately *before* MONSTER_POOL:END — so that brace
//      belongs to the trophy-drops map. Every created monster was spliced in there.
//      It never threw, because the destination was a real object.
//   2. WRONG SCHEMA. The serializer wrote {name, ac, hp, atk, dmg, xp, tier} — no
//      `key`, no dmgDie/dmgCount/dmgFlat (so the monster had no damage at all), and
//      `tier` through Number(), i.e. `tier:NaN` for every one of the five string tiers.
//
// The assertions below pin both, plus the trap itself: a naive last-`};`-before-END
// search must still resolve INSIDE MONSTER_DROPS, so a future refactor that reverts
// to it fails here rather than in the trophy map.
//
// Pure-node (no browser): this is an authoring-surface invariant.

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

// A well-formed body in the live contract.
const DOCK_RAT = { name:'Dock Rat', ac:11, hp:6, atk:2, dmgDie:4, dmgCount:1, dmgFlat:0, tier:'trivial' };

const idxOf = (src, anchor) => src.indexOf(`// ◆◆◆ WORLDBUILDER:${anchor} ◆◆◆`);

test.describe('§DX-01c — creating a monster through the API', () => {

  test('the entry lands inside MONSTER_POOL, not the trophy-drops map', () => {
    const W = freshWorld();
    const r = W.monsters.create('dock_rat', DOCK_RAT);
    expect(r.ok, JSON.stringify(r)).toBe(true);

    const src = W._rawSrc;
    const at = src.indexOf('  dock_rat: {');
    expect(at, 'the serialized line is in the source').toBeGreaterThan(-1);

    // MONSTER_POOL:START … [our line] … MONSTER_DROPS:START … MONSTER_DROPS:END … MONSTER_POOL:END
    const poolStart  = idxOf(src, 'MONSTER_POOL:START');
    const dropsStart = idxOf(src, 'MONSTER_DROPS:START');
    expect(at).toBeGreaterThan(poolStart);
    expect(at, 'the line must come BEFORE the drops section begins').toBeLessThan(dropsStart);
  });

  test('the trap is pinned: a naive last-};-before-END still points into MONSTER_DROPS', () => {
    const src = fs.readFileSync(GAME, 'utf8');
    const poolEnd    = idxOf(src, 'MONSTER_POOL:END');
    const dropsStart = idxOf(src, 'MONSTER_DROPS:START');

    // The old helper's arithmetic, verbatim — it resolves inside the drops map.
    const naive = src.lastIndexOf('\n};', poolEnd);
    expect(naive, 'the old search lands after MONSTER_DROPS:START — i.e. in the wrong object').toBeGreaterThan(dropsStart);

    // The fixed locator lands before it, on MONSTER_POOL's own brace.
    const W = freshWorld();
    const fixed = W._sectionCloseIdx(src, 'MONSTER_POOL');
    expect(fixed).toBeGreaterThan(-1);
    expect(fixed).toBeLessThan(dropsStart);
    expect(fixed).not.toBe(naive);
  });

  test('every section without a nested section is unaffected by the fix', () => {
    const src = fs.readFileSync(GAME, 'utf8');
    const W = freshWorld();
    for (const s of ['WORLD_DB', 'NODE_MAP', 'QUEST_DB', 'BIRKA_NPC', 'MONSTER_DROPS', 'NPC_DIALOGUES']) {
      const naive = src.lastIndexOf('\n};', idxOf(src, `${s}:END`));
      expect(W._sectionCloseIdx(src, s), `${s} close is unchanged`).toBe(naive);
    }
  });

  test('the created monster round-trips through a fresh parse with all 9 fields', () => {
    const W = freshWorld();
    expect(W.monsters.create('dock_rat', DOCK_RAT).ok).toBe(true);

    // Re-parse the mutated source exactly as a server restart would.
    const W2 = freshWorld();
    W2.load(W._rawSrc);
    const m = W2.monsterPool.dock_rat;
    expect(m, 'the new monster survives a re-parse').toBeTruthy();
    expect(m).toMatchObject({ key:'dock_rat', ...DOCK_RAT });
    expect(m.tier).toBe('trivial');            // a STRING — the old writer produced NaN
    expect(Number.isNaN(m.tier)).toBe(false);
    expect(m.key).toBe('dock_rat');            // §AUDIT-03e: a keyless entry loses identity
    expect(m.dmg).toBeUndefined();             // retired field never written
    expect(m.xp).toBeUndefined();

    // …and it did not disturb the drops map it used to be written into.
    const before = freshWorld();
    expect(Object.keys(W2.monsterDrops).length).toBe(Object.keys(before.monsterDrops).length);
    expect(W2.monsterDrops.dock_rat).toBeUndefined();
    expect(Object.keys(W2.monsterPool).length).toBe(Object.keys(before.monsterPool).length + 1);
  });

  test('the serialized line matches the shape of the 391 hand-authored entries', () => {
    const W = freshWorld();
    const line = W.monsters.serialize('dock_rat', DOCK_RAT).trim();
    expect(line).toBe(
      `dock_rat: { key:"dock_rat", name:"Dock Rat", ac:11, hp:6, atk:2, dmgDie:4, dmgCount:1, dmgFlat:0, tier:"trivial" },`
    );
    // Field ORDER matches the live corpus, so a diff of the section stays readable.
    const fields = [...line.matchAll(/([a-zA-Z]+):/g)].map(m => m[1]).slice(1);
    expect(fields).toEqual(['key','name','ac','hp','atk','dmgDie','dmgCount','dmgFlat','tier']);
  });

  test('bad input fails loudly and writes NOTHING', () => {
    const W = freshWorld();
    const srcBefore = W._rawSrc;

    const cases = [
      [{ ...DOCK_RAT, dmgDie:undefined },        /dmgDie is required/],
      [{ ...DOCK_RAT, tier:1 },                  /tier must be one of/],
      [{ ...DOCK_RAT, tier:'legendary' },        /tier must be one of/],
      [{ ...DOCK_RAT, dmg:6 },                   /"dmg" is not a MONSTER_POOL field/],
      [{ ...DOCK_RAT, xp:10 },                   /"xp" is not a MONSTER_POOL field/],
      [{ ...DOCK_RAT, name:undefined },          /name is required/],
      [{ ...DOCK_RAT, ac:'tough' },              /ac must be a number/],
    ];
    for (const [body, re] of cases) {
      const r = W.monsters.create('bad_mob', body);
      expect(r.ok, `expected rejection for ${JSON.stringify(body)}`).toBe(false);
      expect(r.errors.join(' | ')).toMatch(re);
    }
    // The old failure mode was a half-formed entry written anyway.
    expect(W._rawSrc).toBe(srcBefore);
    expect(W.monsterPool.bad_mob).toBeUndefined();

    // A non-snake_case key is refused too (matches the npc-create rule).
    expect(W.monsters.create('Dock Rat', DOCK_RAT).ok).toBe(false);
    // …and an existing key is a conflict, not an overwrite.
    expect(W.monsters.create('void_wolf', DOCK_RAT)).toMatchObject({ ok:false });
  });

  test('the live corpus still satisfies the contract the writer now enforces', () => {
    const W = freshWorld();
    const entries = Object.entries(W.monsterPool);
    expect(entries.length).toBeGreaterThan(380);
    const keyless = entries.filter(([k, m]) => m.key !== k);
    expect(keyless.map(([k]) => k), 'every entry carries its own key').toEqual([]);
    const noDamage = entries.filter(([, m]) => !Number.isFinite(m.dmgDie) || !Number.isFinite(m.dmgCount) || !Number.isFinite(m.dmgFlat));
    expect(noDamage.map(([k]) => k), 'every entry has full damage fields').toEqual([]);
    const nanTier = entries.filter(([, m]) => typeof m.tier !== 'string');
    expect(nanTier.map(([k]) => k), 'no entry carries a numeric/NaN tier').toEqual([]);
  });
});
