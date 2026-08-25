// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
/**
 * §AUDIT-03bi — Quest −1 has an in-game writer.
 *
 * `S_story.questMinusOne` gates the Entry 42 chain and, through it, the fifth
 * ending. Its only writer used to be a line of JavaScript the disclosure panel
 * PRINTS for the player to retype into a browser console — a deliberate act
 * (Layer 49 §XIV) that had become the root of a content tree.
 *
 * The Convergence win at TLS is now a second writer. The console line is
 * untouched: both paths set the same flag, and neither replaces the other.
 */
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

const winBattleAt = (nodeCode, monsterKey) => {
  const m = MONSTER_POOL[monsterKey];
  if (!m) throw new Error('no MONSTER_POOL entry: ' + monsterKey);
  loadWorldMonster(m);
  S.opp.hp = 0;
  S_story.pendingBattle = { nodeCode, name: m.name, label: m.name };
  _storyBattleVictory();
  return S_story.questMinusOne;
};

test.describe('§AUDIT-03bi — the Convergence win marks Quest −1', () => {

  test('the flag starts false and the disclosure panel still prints the console line', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'TLS', visited: { TLS: true }, level: 20 });
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      const panel = NODE_PANELS.find(p => (p.nodes || []).includes('TLS')
        && typeof p.text === 'string' && p.text.includes('Level 21 is undefined'));
      return {
        flag: S_story.questMinusOne,
        declared: Object.prototype.hasOwnProperty.call(_S_DEFAULTS(), 'questMinusOne'),
        panelFound: !!panel,
        consoleLine: !!panel && panel.text.includes('S_story.questMinusOne = true; storyAutoSave();'),
        gatedOnFlag: !!panel && panel.when({ level: 20, questMinusOne: true }) === false,
      };
    });

    expect(out.declared).toBe(true);
    expect(out.flag).toBe(false);
    expect(out.panelFound).toBe(true);
    expect(out.consoleLine).toBe(true);
    expect(out.gatedOnFlag).toBe(true);
  });

  test('functional: winning at TLS at level 20 sets questMinusOne with no console', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'TLS', visited: { TLS: true }, level: 20 });
    await dismissContinue(page);

    const flag = await page.evaluate(([node, key]) => {
      const m = MONSTER_POOL[key];
      loadWorldMonster(m);
      S.opp.hp = 0;
      S_story.pendingBattle = { nodeCode: node, name: m.name, label: m.name };
      _storyBattleVictory();
      return S_story.questMinusOne;
    }, ['TLS', 'void_walker']);

    expect(flag).toBe(true);
  });

  test('negative: level 19 at TLS does not set it — the panel precondition is preserved', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'TLS', visited: { TLS: true }, level: 19 });
    await dismissContinue(page);

    const flag = await page.evaluate(([node, key]) => {
      const m = MONSTER_POOL[key];
      loadWorldMonster(m);
      S.opp.hp = 0;
      S_story.pendingBattle = { nodeCode: node, name: m.name, label: m.name };
      _storyBattleVictory();
      return S_story.questMinusOne;
    }, ['TLS', 'void_walker']);

    expect(flag).toBe(false);
  });

  test('negative: level 20 at another battle node does not set it', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'TLS', visited: { TLS: true }, level: 20 });
    await dismissContinue(page);

    const flag = await page.evaluate(([node, key]) => {
      const m = MONSTER_POOL[key];
      loadWorldMonster(m);
      S.opp.hp = 0;
      S_story.pendingBattle = { nodeCode: node, name: m.name, label: m.name };
      _storyBattleVictory();
      return S_story.questMinusOne;
    }, ['CY_VOID', 'void_walker']);

    expect(flag).toBe(false);
  });

  test('source fence: exactly two writers, and only one of them is a string literal', async () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.join(__dirname, '../../../play.html'), 'utf8');

    const assignments = src.split('\n')
      .map((line, n) => ({ n: n + 1, line }))
      .filter(o => /S_story\.questMinusOne\s*=\s*true/.test(o.line));

    expect(assignments).toHaveLength(2);

    const quoted = assignments.filter(o => /^\s*'/.test(o.line));
    const executable = assignments.filter(o => !/^\s*'/.test(o.line));

    expect(quoted).toHaveLength(1);
    expect(quoted[0].line).toContain('storyAutoSave();');
    expect(executable).toHaveLength(1);
    expect(src.split('\n')[executable[0].n - 2]).toContain("pb.nodeCode === 'TLS'");
  });
});
