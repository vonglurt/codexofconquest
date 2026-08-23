// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §VM-01-G-FU-a — the §CROWN-01 stack: seven combat-dispatch verbs (the G4d shape verbatim),
// two panel-with-embedded-button hooks (WG0 gate trial, HCA Leviathan — G2's verbatim method,
// staying hooks until the G4c-FU ask-2 chrome question is answered), two NODE_PANELS once-panels
// (Glut's Gift, the Crone Mark conversion) — and the two defects the migration could not move
// verbatim without laundering:
//
//   FIX 1 — the Glut's Gift block was DEAD since it shipped: its once-guard was !visited['HG1'],
//   and storyCollectLoot flips visited[code] earlier in the same render (the §VM-01-G1-FIX AO
//   class). The jar was never granted — while HG1's own node text says "She gives you the jar as
//   you arrive." The panel's guard is now !glut_gift_held && !glutGiftReturned.
//
//   FIX 2 — quest_glut_06 ("The Open Hand") completes on flags:['glutGiftReturned'], and the only
//   writer of that flag was its own onComplete — a circular completion that could never fire. The
//   missing piece was a return SURFACE; the hg1-gift-return verb is that writer, and the quest's
//   own completion pipeline (onComplete + passText) does everything else.
//
// POSITIVE CONTROL: the registry/source/fix tests fail at HEAD. The WG0/HCA/latch tests pass
// BOTH ways by design — those blocks moved verbatim, and a test that only passes after the
// change could not prove that (G2b's honest shape).
'use strict';
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { SEED_STATE, dismissContinue } = require('./helpers');

const HTML = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'play.html'), 'utf8');

async function at(page, code, overrides = {}) {
  const state = Object.assign({}, SEED_STATE, {
    currentCode: code, checkpointNode: code, visited: { [code]: true }, visitedCells: {},
    rngState: 424242, inventory: [], quests: {},
  }, overrides);
  await page.addInitScript(s => {
    localStorage.clear();
    localStorage.setItem('r2h_autosave', JSON.stringify(s));
  }, state);
  await page.goto('/play.html');
  await dismissContinue(page);
}

const clickVerb = (page, text) =>
  page.locator('#story-center button', { hasText: text }).first().evaluate(el => el.click());

test.describe('§VM-01-G-FU-a — registry + source shape', () => {
  test('the seven combat verbs and the return verb sit in four crown groups with synthetic battle codes', async ({ page }) => {
    await at(page, 'HW1');
    const r = await page.evaluate(() => NODE_VERBS
      .filter(v => (v.group || '').indexOf('crown-') === 0)
      .map(v => ({ id: v.id, group: v.group, hasLabel: !!v.label,
                   combat: (Array.isArray(v.bits) ? v.bits : []).filter(b => b.kind === 'combat')
                     .map(b => ({ key: b.key, nodeCode: b.nodeCode })) })));
    expect(r.map(v => v.id)).toEqual([
      'hw1-kelpie', 'hw1-witch', 'hg1-mudcrab', 'hg1-octopus', 'hg1-gift-return',
      'hn1-spawn', 'hn1-demon', 'inn-eel']);
    expect(r.map(v => v.group)).toEqual([
      'crown-hw1', 'crown-hw1', 'crown-hg1', 'crown-hg1', 'crown-hg1',
      'crown-hn1', 'crown-hn1', 'crown-inn']);
    expect(r.every(v => v.hasLabel), 'all crown verbs are button verbs — no label-less chain').toBe(true);
    expect(r.map(v => v.combat).flat()).toEqual([
      { key: 'kelpie', nodeCode: 'HW1_KELPIE' },
      { key: 'sea_witch', nodeCode: 'HW1_WITCH' },
      { key: 'mudcrab', nodeCode: 'HG1_MUDCRAB' },
      { key: 'giant_octopus', nodeCode: 'HG1_OCTOPUS' },
      { key: 'sea_spawn', nodeCode: 'HN1_SPAWN' },
      { key: 'sea_demon', nodeCode: 'HN1_DEMON' },
      { key: 'giant_eel', nodeCode: 'INN_EEL' },
    ]);
  });

  test('the migrated blocks are gone from storyRender; hooks and panels dispatch in their place', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const src = storyRender.toString();
      return {
        calls: ['wg0-gate-trial', 'hca-leviathan']
          .filter(id => src.indexOf("_runNodeHook('" + id + "'") === -1),
        verbCalls: ['crown-hw1', 'crown-hg1', 'crown-hn1', 'crown-inn']
          .filter(g => src.indexOf("_renderNodeVerbs(node, S_story, '" + g + "'") === -1),
        // signature locals from each former inline body must no longer appear in storyRender
        residue: ['_kBtn', '_wBtn', '_mBtn', '_oBtn', '_spBtn', '_dBtn', '_eBtn',
                  '_wg0Div', '_levDiv', '_iodBtn', '_hg1Div', '_hcaDiv']
          .filter(sig => src.indexOf(sig) !== -1),
        hooks: NODE_HOOKS.filter(h => ['wg0-gate-trial', 'hca-leviathan'].indexOf(h.id) !== -1).length,
        panels: NODE_PANELS.filter(p => ['story-hg1-gift', 'story-hca-marks'].indexOf(p.id) !== -1).length,
        // the latch is NOT a surface and deliberately stays inline
        latch: src.indexOf('whisperSaintSeen') !== -1,
      };
    });
    expect(r.calls, 'every hook has its in-place dispatch call').toEqual([]);
    expect(r.verbCalls, 'every crown group has its in-place dispatch call').toEqual([]);
    expect(r.residue, 'no former block body remains inline in storyRender').toEqual([]);
    expect(r.hooks).toBe(2);
    expect(r.panels).toBe(2);
    expect(r.latch).toBe(true);
  });
});

test.describe('§VM-01-G-FU-a — FIX 1: the Glut\'s Gift panel is alive again', () => {
  test('first arrival at HG1 renders the gift panel, grants the jar, and lists The Open Hand', async ({ page }) => {
    await at(page, 'HG1');
    const r = await page.evaluate(() => ({
      panel: (document.getElementById('story-hg1-gift') || {}).textContent || '',
      inv: (S_story.inventory || []).map(i => i.name),
      held: !!S_story.glut_gift_held,
      glut06: (S_story.quests || {}).quest_glut_06,
    }));
    // On HEAD this block's !visited['HG1'] guard is always false by the time it runs — the panel
    // never rendered and the jar was never granted, while the node text promised it.
    expect(r.panel).toContain('Glut presses the jar into your hand');
    expect(r.inv).toContain("Glut's Gift");
    expect(r.held).toBe(true);
    expect(r.glut06, 'gate flags:[glut_gift_held] lists in the same arrival\'s end-of-render pass').toBe('active');
  });

  test('the gift does not re-fire: held → no panel; returned → no panel and no second jar', async ({ page }) => {
    await at(page, 'HG1', { glut_gift_held: true });
    await expect(page.locator('#story-hg1-gift')).toHaveCount(0);
    await at(page, 'HG1', { glutGiftReturned: true });
    const r = await page.evaluate(() => ({
      panel: !!document.getElementById('story-hg1-gift'),
      inv: (S_story.inventory || []).map(i => i.name),
    }));
    expect(r.panel, 'glutGiftReturned is the durable guard — the pair cannot re-fire after the return').toBe(false);
    expect(r.inv).toEqual([]);
  });
});

test.describe('§VM-01-G-FU-a — FIX 2: The Open Hand completes through the return verb', () => {
  test('the return verb writes glutGiftReturned and the quest\'s own pipeline does the rest, exactly once', async ({ page }) => {
    await at(page, 'HG1', {
      glut_gift_held: true,
      quests: { quest_glut_06: 'active' },
      inventory: [{ name: "Glut's Gift", icon: '🍯', sell: 0, drop: false }],
      innmotherKindness: 1,
    });
    await expect(page.locator('#verb-hg1-gift-return')).toHaveCount(1);
    await clickVerb(page, "Return Glut's Gift");
    const r = await page.evaluate(() => ({
      quest: (S_story.quests || {}).quest_glut_06,
      inv: (S_story.inventory || []).map(i => i.name),
      returned: !!S_story.glutGiftReturned,
      held: !!S_story.glut_gift_held,
      crown: !!S_story.glutCrownComplete,
      kindness: S_story.innmotherKindness || 0,
      msg: (document.getElementById('story-move-msg') || {}).textContent || '',
    }));
    expect(r.quest, 'completion flags:[glutGiftReturned] fires in the driver\'s post-chain render').toBe('complete');
    expect(r.inv, 'onComplete\'s item_remove consumes the jar').toEqual([]);
    expect(r.returned).toBe(true);
    expect(r.held, 'onComplete clears glut_gift_held in the same write').toBe(false);
    expect(r.crown).toBe(true);
    expect(r.kindness, '_innKindness(1) banks exactly once').toBe(2);
    expect(r.msg).toContain('✓ The Open Hand');
    expect(r.msg).toContain('the returning is the gift');
    await expect(page.locator('#verb-hg1-gift-return')).toHaveCount(0);
  });
});

test.describe('§VM-01-G-FU-a — the combat verbs behave as the blocks did', () => {
  test('clicking the Kelpie opens the pre-battle overlay for the synthetic code IN THE SAME BEAT, and the narrative lands', async ({ page }) => {
    await at(page, 'HW1', { quests: { quest_whisper_kelpie: 'active' } });
    await clickVerb(page, 'Track the Kelpie');
    // No waitForTimeout: on HEAD the inline handler waited 400ms before storyPreBattle, so a
    // same-beat probe is red there — the G4d named delta, inherited.
    const r = await page.evaluate(() => ({
      overlayVisible: document.getElementById('story-prebatt-overlay').classList.contains('visible'),
      code: _preBattNode && _preBattNode.code,
      key: _preBattNode && _preBattNode.battle && _preBattNode.battle.key,
      label: _preBattNode && _preBattNode.battle && _preBattNode.battle.label,
      msg: (document.getElementById('story-move-msg') || {}).textContent || '',
    }));
    expect(r.overlayVisible).toBe(true);
    expect(r.code, 'the synthetic defeatedBattles key, via combat.nodeCode').toBe('HW1_KELPIE');
    expect(r.key).toBe('kelpie');
    expect(r.label).toBe('Kelpie — The East Shallows');
    expect(r.msg).toContain('The east shallows');
  });

  test('a fought dispatch is gone — `when` reads the same quest + defeatedBattles guards', async ({ page }) => {
    await at(page, 'HN1', {
      quests: { quest_wane_spawn: 'active', quest_wane_demon: 'active' },
      defeatedBattles: { HN1_SPAWN: true },
    });
    await expect(page.locator('#verb-hn1-spawn')).toHaveCount(0);
    await expect(page.locator('#verb-hn1-demon')).toHaveCount(1);
  });
});

test.describe('§VM-01-G-FU-a — verbatim hooks and the marks panel (pass at HEAD too)', () => {
  test('WG0: the trial panel renders with its button inside, and is gone once the serpent falls', async ({ page }) => {
    await at(page, 'WG0');
    const r = await page.evaluate(() => {
      const p = document.getElementById('story-wg0-trial');
      return { text: p ? p.textContent : '', btnInside: !!(p && p.querySelector('button')) };
    });
    expect(r.text).toContain('The flooded crossing');
    expect(r.btnInside, 'the button lives INSIDE the panel — the shape that keeps this a hook').toBe(true);
    await at(page, 'WG0', { defeatedBattles: { WG0_TRIAL: true } });
    await expect(page.locator('#story-wg0-trial')).toHaveCount(0);
  });

  test('HCA: the iodine interlock is untouched — face disabled until the charged salt burns for +5', async ({ page }) => {
    await at(page, 'HCA', { inventory: [{ name: 'Charged Iodine Salt', icon: '⚡', sell: 0 }] });
    const before = await page.evaluate(() => {
      const p = document.getElementById('story-hca-leviathan');
      const btns = p ? [...p.querySelectorAll('button')] : [];
      return { face: btns.find(b => b.textContent.includes('Face the Leviathan')).disabled,
               iod: btns.find(b => b.textContent.includes('Burn Charged')).disabled };
    });
    expect(before.face, 'a held salt MUST burn before the fight — the authored interlock').toBe(true);
    expect(before.iod).toBe(false);
    await clickVerb(page, 'Burn Charged Iodine Salt');
    const after = await page.evaluate(() => ({
      face: [...document.querySelectorAll('#story-hca-leviathan button')]
        .find(b => b.textContent.includes('Face the Leviathan')).disabled,
      buff: S_story.iodineBuffActive, bonus: S_story.iodineBuffBonus,
      inv: (S_story.inventory || []).map(i => i.name),
    }));
    expect(after.face).toBe(false);
    expect(after.buff).toBe(true);
    expect(after.bonus, 'the NUMERIC write no opcode can express — why this block is a hook, not verbs').toBe(5);
    expect(after.inv).toEqual([]);
  });

  test('HCA: the marks conversion banks once at the right tier and never re-fires', async ({ page }) => {
    await at(page, 'HCA', { defeatedBattles: { HCA_BOSS: true }, croneMarks: 10 });
    const r = await page.evaluate(() => ({
      text: (document.getElementById('story-hca-marks') || {}).textContent || '',
      wis: (S_story.abilityScores || {}).wis,
      knowledge: (S_story.knowledge || []).length,
      banked: !!S_story.croneMarksBanked,
    }));
    expect(r.text).toContain('Ten marks. The attention was sufficient.');
    expect(r.wis, 'WIS 12 → 13, once').toBe(13);
    expect(r.knowledge).toBe(1);
    expect(r.banked).toBe(true);
    await at(page, 'HCA', { defeatedBattles: { HCA_BOSS: true }, croneMarks: 10, croneMarksBanked: true });
    const again = await page.evaluate(() => ({
      panel: !!document.getElementById('story-hca-marks'),
      wis: (S_story.abilityScores || {}).wis,
    }));
    expect(again.panel).toBe(false);
    expect(again.wis, 'banked → no second WIS').toBe(12);
  });

  test('the HW1 saint latch still fires — quest_whisper_01 attempted flips whisperSaintSeen on arrival', async ({ page }) => {
    await at(page, 'HW1', { quests: { quest_whisper_01: 'failed' } });
    expect(await page.evaluate(() => !!S_story.whisperSaintSeen)).toBe(true);
  });
});
