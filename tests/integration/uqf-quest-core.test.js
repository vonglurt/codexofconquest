// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §VM-01-D — QUEST:CORE, the fourth kernel (host-injected).
// The quest VM (opcode table + gate evaluators + bit-chain executor) is extracted
// into js/quest.js behind createQuestRuntime({getState, effects}) and inlined
// BYTE-IDENTICALLY into roll2hit-v3.html (scripts/check-quest-parity.js). Because
// the kernel names no global (S_story/QUEST_DB/NODE_MAP/storyX all arrive through
// the two params), it runs HEADLESS in Node — the engine the server "could not run."
// Most tests here need no browser: they require the kernel directly. One browser
// test confirms the live factory-built QuestRuntime is a no-op on S_story. Design:
// lab-reports/lab-report-vm01d-quest-core-parity.md.
const { test, expect } = require('@playwright/test');
const path = require('path');
const Q = require(path.join(__dirname, '..', '..', 'js', 'quest.js'));

// A fresh runtime over a scratch state + recording stub effects (no DOM, no host).
function makeRuntime(overrides = {}) {
  const rec = { minted: [], battled: [], msgs: [], favored: [], leveled: 0 };
  const state = { quests: {}, inventory: [], xp: 0, gold: 0, abilityScores: { wis: 16, str: 10 }, level: 3, ...(overrides.state || {}) };
  const rt = Q.createQuestRuntime({
    getState: () => state,
    effects: {
      getQuest: id => (overrides.quests || {})[id],
      getNode: code => ({ label: 'Node ' + code, code }),
      rng: overrides.rng || (() => 0.99),
      lakeMagic: () => ({}),
      checkLevelUp: () => { rec.leveled++; },
      mint: it => rec.minted.push(it.name),
      preBattle: n => rec.battled.push(n.battle.key),
      msg: t => rec.msgs.push(t),
      grantMissionBit: (f, l, st) => { if (st) st[f] = true; },
      setFavor: (npc, lv) => rec.favored.push([npc, lv]),
      getFavor: () => 0,
    },
  });
  return { rt, state, rec };
}
// Drive a plain (non-suspending) chain to completion.
function run(rt, bits, ctx) {
  const gen = rt.execBits(bits, ctx);
  let s = gen.next();
  while (!s.done) { if (s.value && s.value.ask) throw new Error('unexpected ask'); s = gen.next(); }
}

test.describe('§VM-01-D — QUEST:CORE runs headless in Node', () => {
  // 1. The kernel loads and validates quests with NO browser, NO host — pure.
  test('createQuestRuntime + validateQuest work under bare require() (the structural win)', () => {
    expect(typeof Q.createQuestRuntime).toBe('function');
    const { rt } = makeRuntime();
    expect(rt.SCHEMA_VERSION).toBe('UQF-1.0');
    expect(rt.validateQuest({ schema: 'UQF-1.0', id: 'x', bits: [{ kind: 'reward', xp: 5 }] }).valid).toBe(true);
    const bad = rt.validateQuest({ schema: 'UQF-1.0', id: 'x', bits: [{ kind: 'nope' }] });
    expect(bad.valid).toBe(false);
    expect(bad.errors.join(' ')).toContain('Unknown bit kind: nope');
  });

  // 2. Gates evaluate against the INJECTED state (getState), not a global.
  test('canActivate / canComplete read the injected state', () => {
    const { rt, state } = makeRuntime({
      quests: { q1: { gate: { flags: ['seen'] } }, q2: { completion: { atNode: 'LHR' } } },
    });
    expect(rt.canActivate('q1')).toBe(false);
    state.seen = true;
    expect(rt.canActivate('q1')).toBe(true);
    expect(rt.canComplete('q2')).toBe(false);
    state.currentCode = 'LHR';
    expect(rt.canComplete('q2')).toBe(true);
  });

  // 3. execBits runs the full effect surface against the scratch state; every host
  //    effect goes through the injected stubs (proving the seam, not a global).
  test('execBits drives every handler through ctx.state + injected effects', () => {
    const { rt, state, rec } = makeRuntime();
    run(rt, [
      { kind: 'reward', xp: 10, gold: 5, items: [{ name: 'Torch' }], knowledge: 'k1' },
      { kind: 'flag_write', set: ['done1'], clear: ['tmp'] },
      { kind: 'unlock', quests: ['q9'] },
      { kind: 'combat', key: 'orc', label: 'Orc' },
      { kind: 'mission_bit', flag: 'mb1' },
      { kind: 'narrative', msg: 'hello' },
      { kind: 'favor', npc: 'yael', set: 2 },
      { kind: 'item_remove', name: 'Torch' },
    ], {});
    expect(state.xp).toBe(10);
    expect(state.gold).toBe(5);
    expect(state.knowledge).toEqual(['k1']);
    expect(state.done1).toBe(true);
    expect(state.quests.q9).toBe('active');
    expect(state.mb1).toBe(true);
    expect(rec.leveled).toBe(1);          // reward xp → injected checkLevelUp
    expect(rec.minted).toEqual(['Torch']); // reward items → injected mint
    expect(rec.battled).toEqual(['orc']);  // combat → injected preBattle
    expect(rec.msgs).toEqual(['hello']);   // narrative → injected msg
    expect(rec.favored).toEqual([['yael', 2]]);
    expect(state.inventory.some(i => i.name === 'Torch')).toBe(false); // item_remove
  });

  // 4. skill_check rolls the INJECTED rng and routes onPass/onFail deterministically.
  test('skill_check routes via the injected rng (no Math.random, no host)', () => {
    // rng 0.99 → d20 = ceil(0.99*20) = 20; wis16 (+3) + prof(lvl3 → +2) = total 25.
    const passRt = makeRuntime({ rng: () => 0.99 });
    run(passRt.rt, [{ kind: 'skill_check', stat: 'WIS', dc: 20,
      onPass: [{ kind: 'flag_write', set: ['passed'] }], onFail: [{ kind: 'flag_write', set: ['failed'] }] }], {});
    expect(passRt.state.passed).toBe(true);
    expect(passRt.state.failed).toBeUndefined();
    // rng ~0 → d20 = ceil(0.001*20) = 1; total 6 < dc 20 → onFail.
    const failRt = makeRuntime({ rng: () => 0.001 });
    run(failRt.rt, [{ kind: 'skill_check', stat: 'WIS', dc: 20,
      onPass: [{ kind: 'flag_write', set: ['passed'] }], onFail: [{ kind: 'flag_write', set: ['failed'] }] }], {});
    expect(failRt.state.failed).toBe(true);
    expect(failRt.state.passed).toBeUndefined();
  });

  // 5. Scratch isolation (the C seam, headless): a chain run against an explicit
  //    { state } leaves the runtime's own live state untouched.
  test('an explicit { state } is isolated from the runtime state', () => {
    const { rt, state } = makeRuntime();
    const scratch = { quests: {}, inventory: [] };
    run(rt, [{ kind: 'unlock', quests: ['scr'] }, { kind: 'flag_write', set: ['scrFlag'] }], { state: scratch });
    expect(scratch.quests.scr).toBe('active');
    expect(scratch.scrFlag).toBe(true);
    expect(state.quests.scr).toBeUndefined();  // live state pristine
    expect('scrFlag' in state).toBe(false);
  });

  // 6. The §VM-01-A choice coroutine suspends + resumes headless — only the picked
  //    branch applies, and only after the pick.
  test('a choice suspends and resumes under bare require()', () => {
    const { rt } = makeRuntime();
    const scratch = {};
    const gen = rt.execBits([{ kind: 'choice', prompt: 'Door?', options: [
      { label: 'Left',  bits: [{ kind: 'flag_write', set: ['optA'] }] },
      { label: 'Right', bits: [{ kind: 'flag_write', set: ['optB'] }] },
    ] }], { state: scratch });
    const step1 = gen.next();                 // runs to the yield
    expect(step1.done).toBe(false);
    expect(step1.value.ask).toBe('choice');
    expect(step1.value.options).toEqual(['Left', 'Right']);
    expect('optA' in scratch).toBe(false);    // nothing applied before the pick
    let step2 = gen.next(0);                   // pick "Left"
    while (!step2.done) step2 = gen.next();
    expect(scratch.optA).toBe(true);
    expect('optB' in scratch).toBe(false);     // unpicked branch never ran
  });
});

test.describe('§VM-01-D — the live factory-built QuestRuntime is a no-op', () => {
  const NEWGAME = { str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
  // 7. In the browser, window.QuestRuntime (now built by createQuestRuntime over the
  //    live S_story + host effects) drives a chain exactly as the pre-D literal did.
  test('window.QuestRuntime mutates the live S_story through the injected host seam', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((NG) => {
      storyNewGame(NG);
      S_story.quests = S_story.quests || {};
      delete S_story.qcLiveFlag;
      _uqfRunToCompletion(QuestRuntime.execBits([
        { kind: 'flag_write', set: ['qcLiveFlag'] },
        { kind: 'reward', xp: 7, items: [{ name: 'QC Token' }] },
        { kind: 'unlock', quests: ['qc_live_q'] },
      ], { questId: 't', pushMsg: () => {} }));
      return {
        flag: S_story.qcLiveFlag === true,
        xp: S_story.xp,
        quest: (S_story.quests || {}).qc_live_q,
        hasItem: (S_story.inventory || []).some(i => i.name === 'QC Token'),
        factory: typeof createQuestRuntime === 'function',   // the factory is in scope
      };
    }, NEWGAME);
    expect(r.flag).toBe(true);
    expect(r.xp).toBeGreaterThanOrEqual(7);
    expect(r.quest).toBe('active');
    expect(r.hasItem).toBe(true);
    expect(r.factory).toBe(true);
  });
});
