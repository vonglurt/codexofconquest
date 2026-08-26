// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §SIMLEAK-01 — the simulator's weapon panel and the equipped story weapon are one
// state, and the panel was the half that could win.
//
// `_syncStoryWeaponInto` wrote `w.die`, `w.count` and `w.flatMod` onto the state
// object and left the four controls that display them untouched. `syncWeaponFromUI`
// is wired to `input` on every weapon field, so the next keystroke anywhere in the
// panel rewrote `S.weapon.count` and `S.weapon.flatMod` from whatever the stale
// inputs still showed — the equipped weapon silently became the simulator's. The
// panel is reachable while a story battle is up: `main-body` is displayed for the
// overlay and `_storyFleeClean` hides it again on the way out.
//
// `S.weapon.prof` was never written by the sync at all, so whether a story swing
// added the proficiency bonus was decided by a checkbox in the simulator.
//
// The contract: after a sync, every control in the weapon panel shows the equipped
// weapon, and a round trip back through `syncWeaponFromUI` is therefore a no-op.

const { test, expect } = require('@playwright/test');
const { seedAndLoad } = require('./helpers.js');

const MAUL   = { name:'Maul', icon:'🔨', type:'weapon', die:6, count:2, magicBonus:3, sell:105 };
const DAGGERISH = { name:'Rapier', icon:'🤺', type:'weapon', die:8, count:1, magicBonus:0, sell:60, finesse:true };

async function equipAndOpen(page, weapon) {
  return page.evaluate((weapon) => {
    S_story.abilityScores = { str:16, dex:12, con:14, int:10, wis:12, cha:8 };
    S_story.level = 5;
    S_story.equippedMainWeapon = weapon;
    S_story.pendingBattle = { nodeCode:'BOO', key:'goblin' };
    S_story.active = true;
    // Leave the panel showing something else entirely, the way a session that used
    // the standalone simulator first would.
    document.getElementById('weapon-count').value   = '7';
    document.getElementById('weapon-flatmod').value = '-4';
    document.getElementById('weapon-prof').checked  = false;
    syncWeaponFromUI();

    try { _showBattleOverlay(); } catch (e) {}

    const activeDie = document.querySelector('#weapon-die-sel .die-opt.active');
    const shown = {
      count:   Number(document.getElementById('weapon-count').value),
      flatMod: Number(document.getElementById('weapon-flatmod').value),
      prof:    document.getElementById('weapon-prof').checked,
      die:     activeDie ? Number(activeDie.dataset.die) : null,
    };
    const synced = { count: S.weapon.count, flatMod: S.weapon.flatMod, prof: S.weapon.prof, die: S.weapon.die };

    // The clobber: any input event in the panel re-runs syncWeaponFromUI.
    document.getElementById('weapon-flatmod').dispatchEvent(new Event('input', { bubbles: true }));
    const after = { count: S.weapon.count, flatMod: S.weapon.flatMod, prof: S.weapon.prof, die: S.weapon.die };

    return { shown, synced, after };
  }, weapon);
}

test.describe('§SIMLEAK-01 — the weapon panel mirrors the equipped weapon', () => {

  for (const w of [MAUL, DAGGERISH]) {
    test(`${w.name} — the panel shows what the sync wrote`, async ({ page }) => {
      await seedAndLoad(page);
      const r = await equipAndOpen(page, w);
      expect(r.synced).toEqual({ count: w.count, flatMod: w.magicBonus, prof: true, die: w.die });
      expect(r.shown).toEqual(r.synced);
    });

    test(`${w.name} — a keystroke in the panel cannot rewrite the equipped weapon`, async ({ page }) => {
      await seedAndLoad(page);
      const r = await equipAndOpen(page, w);
      expect(r.after).toEqual(r.synced);
    });
  }
});
