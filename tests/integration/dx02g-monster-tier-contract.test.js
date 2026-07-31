// SPDX-License-Identifier: MIT — Copyright (c) 2026 paul@roll2hit.com
// §DX-02g — a monster's `tier` is one of five values, and every tier-keyed engine
// map covers all five.
//
// Why this test exists: `void_shaman` ("The Warden") shipped with `tier:'rare'` and
// `void_rat_swarm` with `tier:'low'` — two values the engine has no entry for. The row
// that filed this called it an authoring-surface defect ("invisible in the worldbuilder
// picker"). It was not. `tier` is read by four live surfaces, and EVERY one of them
// degrades SILENTLY on an unknown value, because every one falls back:
//
//   _voidEnrage(tier)      → `[tier] || {atk:1,dmg:1,die:0}`  — The Warden matches
//                            _VOID_ENEMY_RE, so its §PLAY-01-B low-HP press ran at the
//                            TRIVIAL magnitude (+1/+1) instead of hard's (+3/+3).
//   _storyRollInit         → `tierMod[eTier] ?? 0`            — initiative +0, not +3.
//   _weightedMonsterPick   → `WEIGHTS[m.tier] || 10`          — weight 10 flat. Cells
//                            adjacent to TBS infer terrain `epic_goblin_cave`, whose
//                            roster holds void_shaman, so a sealed Act-5 guardian drew
//                            as a random encounter at 2.5× a `hard` monster's weight
//                            at low notoriety.
//   the threat badges      → `{…}[tier] || tier.toUpperCase()` plus a `threat-<tier>`
//                            CSS class — rendered the word RARE with NO styling rule.
//
// So the first half below pins the DATA (all pool entries on-contract), and the second
// half pins the INVERSE — that no tier-keyed map ships partial. A map missing a tier is
// how this defect stayed invisible for as long as it did: nothing throws, it just falls
// back to a wrong-but-plausible number.
//
// The two corrected values are derived, not tasted (§DX-02g ship record):
//   void_shaman  → hard.  Its two EXACT stat-block twins (AC15/HP65/atk6) are Bandit
//                  Captain and Pirate Captain, both `hard`; user-confirmed 2026-07-31.
//   void_rat_swarm → easy. 6 of its 8 nearest stat-neighbours are `easy`; its exact
//                  AC/HP/atk twin is Jackalwere, `easy`.
//
// Mostly pure-node (no browser); one browser probe pins the player-visible badge.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { seedAndLoad, dismissContinue } = require('./helpers');

const ROOT = path.resolve(__dirname, '..', '..');
const GAME = path.join(ROOT, 'roll2hit-v3.html');

// The contract. Five values, in threat order — the same list TIER_ORDER ships.
const TIERS = ['trivial', 'easy', 'medium', 'hard', 'deadly'];

function freshWorld() {
  delete require.cache[require.resolve(path.join(ROOT, 'js', 'wbapi-core.js'))];
  const W = require(path.join(ROOT, 'js', 'wbapi-core.js'));
  W.load(GAME);
  return W;
}

// Pull one source region by a distinctive anchor, so the scan can't silently match
// a same-named symbol somewhere else in a 37k-line file.
function region(src, anchor, span) {
  const i = src.indexOf(anchor);
  expect(i, `anchor not found (re-grep it — line anchors drift): ${anchor}`).toBeGreaterThan(-1);
  return src.slice(i, i + span);
}

// Every tier-keyed map in the engine, by the anchor that identifies it and the span
// its literal occupies. Each must mention all five contract tiers as a key.
const TIER_KEYED_SITES = [
  { anchor: "const TIER_ORDER  = ['trivial'",                    span: 400,  what: 'populateTerrainEnemies TIER_ORDER + TIER_LABELS' },
  { anchor: 'const XP_BY_TIER =',                                span: 120,  what: 'XP_BY_TIER' },
  { anchor: 'const tierMod = {',                                 span: 120,  what: '_storyRollInit initiative modifier' },
  { anchor: 'function _voidEnrage(tier)',                        span: 500,  what: '_voidEnrage press magnitude' },
  { anchor: 'function _fleeChance(tier)',                        span: 200,  what: '_fleeChance' },
  { anchor: 'const tierColors = {',                              span: 200,  what: 'fishing reveal tier colors' },
  { anchor: "const tLbl = {trivial:",                            span: 200,  what: 'battle-accordion threat label' },
  { anchor: "const tLabel = { trivial:",                         span: 200,  what: 'pre-battle threat label' },
];

test.describe('§DX-02g — the monster tier contract', () => {

  test('every MONSTER_POOL entry carries a contract tier', () => {
    const W = freshWorld();
    const all = W.monsters.all();
    expect(all.length).toBeGreaterThan(390);          // 398 live at ship time

    const offContract = all
      .filter(m => !TIERS.includes(m.tier))
      .map(m => `${m.key}: ${JSON.stringify(m.tier)}`);
    expect(offContract, 'off-contract tiers fall back silently in 4 engine maps').toEqual([]);
  });

  test('every EPIC_BOSS_POOL entry carries a contract tier', () => {
    const src = fs.readFileSync(GAME, 'utf8');
    const block = region(src, 'const EPIC_BOSS_POOL = {', 40000);
    const end = block.indexOf('\n};');
    expect(end).toBeGreaterThan(0);
    const tiers = [...block.slice(0, end).matchAll(/tier:\s*['"]([a-z_]+)['"]/g)].map(m => m[1]);
    expect(tiers.length).toBeGreaterThan(15);          // 20 live at ship time
    expect([...new Set(tiers)].filter(t => !TIERS.includes(t))).toEqual([]);
  });

  test('the two corrected monsters hold their derived tiers', () => {
    const W = freshWorld();
    const warden = W.monsters.all().find(m => m.key === 'void_shaman');
    const swarm  = W.monsters.all().find(m => m.key === 'void_rat_swarm');

    // Guard the derivation, not just the value: if someone restats them, the tier
    // is re-derivable from the stat block that justified it.
    expect(warden).toMatchObject({ ac: 15, hp: 65, atk: 6, dmgDie: 6, dmgCount: 2, dmgFlat: 4, tier: 'hard' });
    expect(swarm).toMatchObject({ ac: 12, hp: 18, atk: 4, dmgDie: 4, dmgCount: 2, dmgFlat: 0, tier: 'easy' });
  });

  test('NEGATIVE CONTROL — a re-planted off-contract tier is caught', () => {
    // The check is only worth having if it fails on the real historical defect.
    const src = fs.readFileSync(GAME, 'utf8');
    const replanted = src.replace(
      /(void_shaman:\s*\{[^}]*?tier:\s*)["']hard["']/,
      '$1"rare"');
    expect(replanted, 'the replant must actually change the source').not.toBe(src);

    const tiers = [...replanted.matchAll(/void_shaman:\s*\{[^}]*?tier:\s*["']([a-z_]+)["']/g)].map(m => m[1]);
    expect(tiers).toContain('rare');
    expect(tiers.filter(t => !TIERS.includes(t))).toEqual(['rare']);   // i.e. the scan sees it
  });

  test('no tier-keyed engine map ships partial — all five tiers, every site', () => {
    const src = fs.readFileSync(GAME, 'utf8');
    const gaps = [];
    for (const site of TIER_KEYED_SITES) {
      const text = region(src, site.anchor, site.span);
      for (const t of TIERS) {
        if (!new RegExp(`(^|[^a-z_])${t}\\s*:`).test(text)) gaps.push(`${site.what} is missing '${t}'`);
      }
    }
    expect(gaps, 'a missing tier does not throw — it falls back to a wrong-but-plausible value').toEqual([]);
  });

  test('the notoriety weight tables and the threat CSS cover all five tiers', () => {
    const src = fs.readFileSync(GAME, 'utf8');

    // Six weight rows, one per notoriety band — each must weight every tier.
    const weights = region(src, 'function _notorietyWeights', 900);
    const rows = [...weights.matchAll(/\{\s*trivial:[^}]*\}/g)].map(m => m[0]);
    expect(rows.length).toBe(6);
    for (const row of rows) {
      for (const t of TIERS) expect(row, `weight row missing ${t}`).toMatch(new RegExp(`${t}\\s*:`));
    }

    // The badge's colour comes from a `threat-<tier>` class, not from JS — an
    // unknown tier renders the word with no styling rule at all.
    for (const t of TIERS) expect(src, `.threat-${t} CSS rule missing`).toContain(`.threat-${t}`);
  });

  test('PLAYER-VISIBLE — The Warden pre-battle badge reads HARD and is styled', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'TBS', checkpointNode: 'TBS', visited: { TBS: true } });
    await dismissContinue(page);

    // NB: the engine's top-level `const`s live in the global LEXICAL scope, so they
    // resolve as bare identifiers but are NOT properties of `window`.
    const badge = await page.evaluate(() => {
      const node = NODE_MAP['TBS'];                        // eslint-disable-line no-undef
      storyPreBattle({ ...node, code: 'MT_WARDEN',         // eslint-disable-line no-undef
        battle: { label: 'The Warden', key: 'void_shaman', count: 1 } });
      const el = document.querySelector('#prebatt-threat .threat-tier');
      return el ? { text: el.textContent.trim(), cls: el.className } : null;
    });

    expect(badge).not.toBeNull();
    expect(badge.text).toBe('HARD');            // was the unstyled literal 'RARE'
    expect(badge.cls).toContain('threat-hard');
  });

  test('PLAYER-VISIBLE — the Void press now scales to the real tier', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'TBS', checkpointNode: 'TBS', visited: { TBS: true } });
    await dismissContinue(page);

    const press = await page.evaluate(() => ({
      /* eslint-disable no-undef */
      hard:    _voidEnrage(MONSTER_POOL['void_shaman'].tier),
      unknown: _voidEnrage('rare'),             // what it used to resolve to
      /* eslint-enable no-undef */
    }));

    expect(press.hard).toEqual({ atk: 3, dmg: 3, die: 0 });
    expect(press.unknown).toEqual({ atk: 1, dmg: 1, die: 0 });   // the silent fallback
  });

});
