// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
/**
 * §DX-02cy — the kill-counter WRITER.
 *
 * `S_story.monsterKills` / `catKills` / `frCatKillCount` are written in exactly
 * one place: the battle-win handler `_storyBattleVictory()`. Every existing test
 * of these counters plants a value and proves a reader honours it; none of them
 * proves the value ever arrives. This suite drives a real victory and asserts
 * the counter moved.
 *
 * The identity half of a combat pair lives on `S.enemy` (`loadWorldMonster` sets
 * `S.enemy.key`); `S.opp` carries the mutable fight state (hp, condition, adv)
 * and declares no `key`. A counter site reading `S.opp.key` therefore reads
 * `undefined` and its guard is false — asserted structurally below so the shape
 * cannot come back.
 */
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

// Drive one real battle victory against `monsterKey` at `nodeCode`.
const winBattle = (nodeCode, monsterKey) => {
  const m = MONSTER_POOL[monsterKey];
  if (!m) throw new Error('no MONSTER_POOL entry: ' + monsterKey);
  loadWorldMonster(m);
  S.opp.hp = 0;
  S_story.pendingBattle = { nodeCode, name: m.name, label: m.name };
  _storyBattleVictory();
};

test.describe('§DX-02cy — the battle-win handler writes the kill counters', () => {

  test('S.opp declares no key, and no site reads one', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'SPB', visited: { SPB: true } });
    await dismissContinue(page);

    const out = await page.evaluate(() => ({
      oppFields: Object.keys(S.opp).sort(),
      oppHasKey: Object.prototype.hasOwnProperty.call(S.opp, 'key'),
      enemyHasKey: Object.prototype.hasOwnProperty.call(S.enemy, 'key'),
    }));

    expect(out.oppHasKey).toBe(false);
    expect(out.enemyHasKey).toBe(true);
    expect(out.oppFields).toEqual(['adv', 'cond', 'condition', 'dmgMod', 'hp', 'maxHp', 'tier']);

    // S.opp carries no key, so that spelling can only ever read undefined.
    const src = await page.evaluate(() => document.documentElement.outerHTML);
    expect(src.match(/S\.opp\.key/g) || []).toHaveLength(0);
  });

  test('a real victory increments monsterKills for the monster that was fought', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'SPB', visited: { SPB: true } });
    await dismissContinue(page);

    const out = await page.evaluate(([fn]) => {
      const win = eval('(' + fn + ')');
      S_story.monsterKills = {};
      const before = { ...S_story.monsterKills };
      win('SPB', 'sparring_droid');
      const afterOne = { ...S_story.monsterKills };
      win('SPB', 'sparring_droid');
      win('SPB', 'sparring_droid');
      return { before, afterOne, after: { ...S_story.monsterKills }, enemyKey: S.enemy.key };
    }, [winBattle.toString()]);

    expect(out.before).toEqual({});
    expect(out.afterOne).toEqual({ sparring_droid: 1 });
    expect(out.after).toEqual({ sparring_droid: 3 });
    expect(out.enemyKey).toBe('sparring_droid');
  });

  test('three real victories complete quest_kg_01 — writer and reader meet', async ({ page }) => {
    await seedAndLoad(page, {
      currentCode: 'SPB', visited: { SPB: true },
      quests: { quest_kg_01: 'active' }, monsterKills: {},
    });
    await dismissContinue(page);

    const out = await page.evaluate(([fn]) => {
      const win = eval('(' + fn + ')');
      S_story.quests = { quest_kg_01: 'active' };
      S_story.monsterKills = {};
      const atZero = QuestRuntime.canComplete('quest_kg_01');
      win('SPB', 'sparring_droid');
      win('SPB', 'sparring_droid');
      const atTwo = QuestRuntime.canComplete('quest_kg_01');
      win('SPB', 'sparring_droid');
      return { atZero, atTwo, atThree: QuestRuntime.canComplete('quest_kg_01'),
               kills: S_story.monsterKills.sparring_droid };
    }, [winBattle.toString()]);

    expect(out.atZero).toBe(false);
    expect(out.atTwo).toBe(false);
    expect(out.atThree).toBe(true);
    expect(out.kills).toBe(3);
  });

  test('a cat kill increments catKills as well as monsterKills', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'CQ', visited: { CQ: true } });
    await dismissContinue(page);

    const out = await page.evaluate(([fn]) => {
      const win = eval('(' + fn + ')');
      S_story.monsterKills = {}; S_story.catKills = {};
      win('CQ', 'fluffy_cat');
      win('CQ', 'beefy_tom');
      win('CQ', 'sparring_droid');
      return { monsterKills: { ...S_story.monsterKills }, catKills: { ...S_story.catKills } };
    }, [winBattle.toString()]);

    expect(out.monsterKills).toEqual({ fluffy_cat: 1, beefy_tom: 1, sparring_droid: 1 });
    // The whitelist is eight cat keys; the droid is not one of them.
    expect(out.catKills).toEqual({ fluffy_cat: 1, beefy_tom: 1 });
  });

  test('five corrupted_cat kills at AMS grant Vincenzo\'s Net for quest_la_riva_02', async ({ page }) => {
    await seedAndLoad(page, {
      currentCode: 'AMS', visited: { AMS: true },
      quests: { quest_la_riva_02: 'active' }, inventory: [],
    });
    await dismissContinue(page);

    const out = await page.evaluate(([fn]) => {
      const win = eval('(' + fn + ')');
      S_story.quests = { quest_la_riva_02: 'active' };
      S_story.inventory = [];
      S_story.frCatKillCount = 0;
      const counts = [];
      const hasNet = () => S_story.inventory.some(i => i.name === "Vincenzo's Net");
      for (let i = 0; i < 4; i++) { win('AMS', 'corrupted_cat'); counts.push(S_story.frCatKillCount); }
      const netAtFour = hasNet();
      win('AMS', 'corrupted_cat');
      // The node is what scopes this counter: the same kill elsewhere must not count.
      win('LHR', 'corrupted_cat');
      return { counts, netAtFour, netAtFive: hasNet(), finalCount: S_story.frCatKillCount };
    }, [winBattle.toString()]);

    expect(out.counts).toEqual([1, 2, 3, 4]);
    expect(out.netAtFour).toBe(false);
    expect(out.netAtFive).toBe(true);
    expect(out.finalCount).toBe(5);
  });
});
