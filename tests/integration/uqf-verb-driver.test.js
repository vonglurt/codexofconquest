// §VM-01-G4a — the host end of the choice seam + the `cost` leaf.
//
// Two halves of one slice, both proven here:
//
//  1. THE DRIVER. Inc A built the suspending half of the coroutine (the execBits generator,
//     the *choice handler, the _uqfPump slot) and never built the half that RENDERS an ask
//     and resumes with the answer — `renderChoiceBlock` occurs 0 times in roll2hit-v3.html
//     and 0 times in js/quest.js; it has never existed as code. Every live execBits entry
//     point wraps in _uqfRunToCompletion, which THROWS on an ask, so before this slice a
//     `choice` bit in any chain could only throw. _uqfRunVerb/_uqfRenderAsk are that missing
//     half (lab-reports/lab-report-vm01g4-per-verb.md §3, §9.2).
//
//  2. THE `cost` LEAF, on the REFUSE-AT-CLICK contract (user design call 2026-08-04, §12 of
//     the same report): the verb always renders, and an unaffordable price refuses out loud
//     instead of the option quietly disappearing. That is what all six hand-written gold
//     sites do today, so the leaf is a no-op against shipped behaviour rather than a UX
//     change. `cost` therefore never contributes to a verb's `when`.
//
// No content moved in this slice — G4b (Kern & Sable) is the first content consumer.
'use strict';
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

const NEWGAME = { str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

// Run a bit chain through the REAL kernel with a message-collecting ctx, and report both the
// state it wrote and the halt/refuse flags the chain set. Mirrors how the host driver builds
// its ctx (fresh per run — which is what makes the kernel's sticky _halt flag safe).
async function runChain(page, bits, st) {
  await page.goto('/roll2hit-v3.html');
  return page.evaluate(({ NG, bits, st }) => {
    storyNewGame(NG);
    Object.assign(S_story, st);
    const msgs = [];
    const ctx = { pushMsg: m => msgs.push(m) };
    _uqfRunToCompletion(QuestRuntime.execBits(bits, ctx));
    return { msgs, halted: !!ctx._halt, refused: !!ctx._refused,
             gold: S_story.gold, surge: S_story.surgeCharges,
             paid: !!S_story.costPaidFlag, after: !!S_story.afterCostFlag };
  }, { NG: NEWGAME, bits, st });
}

test.describe('§VM-01-G4a — the cost leaf (refuse at click)', () => {
  test('affordable: spends the gold and the rest of the chain runs', async ({ page }) => {
    const r = await runChain(page, [
      { kind: 'cost', gold: 50, refuse: "💰 You don't have 50gp." },
      { kind: 'flag_write', set: ['costPaidFlag'] },
    ], { gold: 100, costPaidFlag: false, afterCostFlag: false });
    expect(r.gold).toBe(50);
    expect(r.paid, 'the bits after a paid cost still run').toBe(true);
    expect(r.halted).toBe(false);
    expect(r.refused).toBe(false);
    expect(r.msgs, 'a paid price says nothing — only a refusal speaks').toEqual([]);
  });

  test('unaffordable: refuses out loud, fails the chain, and spends NOTHING', async ({ page }) => {
    const r = await runChain(page, [
      { kind: 'cost', gold: 50, refuse: "💰 You don't have 50gp." },
      { kind: 'flag_write', set: ['costPaidFlag'] },
    ], { gold: 10, costPaidFlag: false, afterCostFlag: false });
    expect(r.gold, 'a refused price never part-pays').toBe(10);
    expect(r.paid, 'the bits after a refused cost do NOT run').toBe(false);
    expect(r.halted).toBe(true);
    expect(r.refused).toBe(true);
    // The refusal is the whole point of the design call: the game states its price.
    expect(r.msgs).toEqual(["💰 You don't have 50gp."]);
  });

  test('a mixed price is TESTED before either currency is SPENT (no part-pay)', async ({ page }) => {
    const r = await runChain(page, [
      { kind: 'cost', gold: 20, resource: 'surgeCharges', count: 1, refuse: 'Not enough.' },
      { kind: 'flag_write', set: ['costPaidFlag'] },
    ], { gold: 100, surgeCharges: 0, costPaidFlag: false, afterCostFlag: false });
    expect(r.gold, 'gold is affordable but the resource is not — so NOTHING is spent').toBe(100);
    expect(r.surge).toBe(0);
    expect(r.refused).toBe(true);
    expect(r.paid).toBe(false);
  });

  test('a class resource is a currency too (surgeCharges, count-aware)', async ({ page }) => {
    const r = await runChain(page, [
      { kind: 'cost', resource: 'surgeCharges', count: 2 },
      { kind: 'flag_write', set: ['costPaidFlag'] },
    ], { surgeCharges: 3, gold: 0, costPaidFlag: false, afterCostFlag: false });
    expect(r.surge).toBe(1);
    expect(r.paid).toBe(true);
    expect(r.halted).toBe(false);
  });

  test('a halt inside a choice option aborts the WHOLE chain, not just that branch', async ({ page }) => {
    // ctx is shared with the nested execBits a choice option runs, and the kernel deliberately
    // never clears _halt — otherwise the outer bits would run on after an unpaid price.
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((NG) => {
      storyNewGame(NG);
      Object.assign(S_story, { gold: 5, costPaidFlag: false, afterCostFlag: false });
      const ctx = { pushMsg: () => {} };
      const gen = QuestRuntime.execBits([
        { kind: 'choice', prompt: 'Pay?', options: [
          { label: 'Pay', bits: [{ kind: 'cost', gold: 50, refuse: 'no' },
                                 { kind: 'flag_write', set: ['costPaidFlag'] }] },
          { label: 'Leave', bits: [] } ] },
        { kind: 'flag_write', set: ['afterCostFlag'] },
      ], ctx);
      _uqfPump(gen);
      _uqfPump(gen, 0);
      return { paid: !!S_story.costPaidFlag, after: !!S_story.afterCostFlag, gold: S_story.gold };
    }, NEWGAME);
    expect(r.paid, "the option's own later bits are skipped").toBe(false);
    expect(r.after, 'and so are the bits after the choice — the chain failed, not the branch').toBe(false);
    expect(r.gold).toBe(5);
  });

  test('the contract is registered and validates (a cost with no currency is rejected)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const mk = bit => QuestRuntime.validateQuest({ id: 'x', schema: 'UQF-1.0', bits: [bit] });
      return {
        gold:   mk({ kind: 'cost', gold: 50 }).valid,
        res:    mk({ kind: 'cost', resource: 'surgeCharges' }).valid,
        empty:  mk({ kind: 'cost' }).valid,
        zero:   mk({ kind: 'cost', gold: 0 }).valid,
        neg:    mk({ kind: 'cost', gold: -50 }).valid,
      };
    });
    expect(r.gold).toBe(true);
    expect(r.res).toBe(true);
    expect(r.empty, 'a price with no currency is not a price').toBe(false);
    expect(r.zero).toBe(false);
    // The sign trap this leaf exists to close: `reward` with gold:-50 "works" arithmetically
    // with no affordability test and the word *reward* on a price. `cost` takes the magnitude.
    expect(r.neg, 'a cost is stated as a positive magnitude').toBe(false);
  });

  test('a chain with no cost is untouched — no halt, every bit runs', async ({ page }) => {
    const r = await runChain(page, [
      { kind: 'reward', gold: 25 },
      { kind: 'flag_write', set: ['costPaidFlag'] },
      { kind: 'flag_write', set: ['afterCostFlag'] },
    ], { gold: 100, costPaidFlag: false, afterCostFlag: false });
    expect(r.gold).toBe(125);
    expect(r.paid).toBe(true);
    expect(r.after).toBe(true);
    expect(r.halted).toBe(false);
  });
});

test.describe('§VM-01-G4a — the host choice driver', () => {
  async function atLHR(page, ov = {}) {
    await seedAndLoad(page, Object.assign({ currentCode: 'LHR', checkpointNode: 'LHR',
      visited: {}, rngState: 424242 }, ov));
    await dismissContinue(page);
  }

  test('a verb that suspends renders its options as buttons; the pick applies ONLY that branch', async ({ page }) => {
    await atLHR(page, { gold: 100 });
    await page.evaluate(() => {
      delete S_story.verbLeft; delete S_story.verbRight;
      const mount = document.createElement('div');
      mount.id = 'g4a-probe';
      document.getElementById('story-text-box').insertAdjacentElement('afterend', mount);
      _uqfRunVerb({ id: 'probe', bits: [
        { kind: 'choice', prompt: 'Which door?', options: [
          { label: 'Left door',  bits: [{ kind: 'flag_write', set: ['verbLeft'] }] },
          { label: 'Right door', bits: [{ kind: 'flag_write', set: ['verbRight'] },
                                        { kind: 'narrative', msg: 'The right door opens.' }] },
        ] },
      ] }, mount);
    });

    // the ask is on screen — prompt + one button per option, and the generator is parked
    await expect(page.locator('#g4a-probe')).toContainText('Which door?');
    await expect(page.locator('#g4a-probe button')).toHaveCount(2);
    expect(await page.evaluate(() => !!_uqfPending), 'the live generator is parked in the slot').toBe(true);
    // nothing has been applied on the way IN
    expect(await page.evaluate(() => [!!S_story.verbLeft, !!S_story.verbRight])).toEqual([false, false]);

    await page.locator('#g4a-probe button', { hasText: 'Right door' }).click();

    const after = await page.evaluate(() => ({
      left: !!S_story.verbLeft, right: !!S_story.verbRight,
      cleared: _uqfPending === null, gone: !document.getElementById('g4a-probe'),
      msg: (document.getElementById('story-move-msg') || {}).textContent || '',
    }));
    expect(after.left, 'the branch not picked never runs').toBe(false);
    expect(after.right).toBe(true);
    expect(after.cleared, 'the slot is released when the chain ends').toBe(true);
    expect(after.gone, 'the panel is removed and the node re-rendered').toBe(true);
    // narrative rides ctx.pushMsg into storyRender's prefix — storyRender's tail storyMsg
    // would otherwise overwrite #story-move-msg (§BOARD-01-FU6).
    expect(after.msg).toContain('The right door opens.');
  });

  test('a plain (non-suspending) verb runs straight through and re-renders — no panel', async ({ page }) => {
    await atLHR(page, { gold: 100 });
    const r = await page.evaluate(() => {
      delete S_story.verbPlain;
      const mount = document.createElement('div');
      mount.id = 'g4a-plain';
      document.getElementById('story-text-box').insertAdjacentElement('afterend', mount);
      const ctx = _uqfRunVerb({ id: 'plain', bits: [
        { kind: 'cost', gold: 50, refuse: "💰 You don't have 50gp." },
        { kind: 'flag_write', set: ['verbPlain'] },
      ] }, mount);
      return { flag: !!S_story.verbPlain, gold: S_story.gold, refused: !!ctx._refused,
               gone: !document.getElementById('g4a-plain'), parked: !!_uqfPending };
    });
    expect(r.flag).toBe(true);
    expect(r.gold).toBe(50);
    expect(r.refused).toBe(false);
    expect(r.gone).toBe(true);
    expect(r.parked).toBe(false);
  });

  test('refuse-at-click: the verb RUNS when unaffordable and says the price (it is not withheld)', async ({ page }) => {
    // This is the design call in one assertion. Gating at render would mean the verb never
    // runs at all; refuse-at-click means it runs, refuses, and spends nothing.
    await atLHR(page, { gold: 10 });
    const r = await page.evaluate(() => {
      delete S_story.verbPriced;
      const mount = document.createElement('div');
      mount.id = 'g4a-priced';
      document.getElementById('story-text-box').insertAdjacentElement('afterend', mount);
      const ctx = _uqfRunVerb({ id: 'priced', bits: [
        { kind: 'cost', gold: 50, refuse: "💰 You don't have 50gp." },
        { kind: 'flag_write', set: ['verbPriced'] },
      ] }, mount);
      return { refused: !!ctx._refused, flag: !!S_story.verbPriced, gold: S_story.gold,
               msg: (document.getElementById('story-move-msg') || {}).textContent || '' };
    });
    expect(r.refused).toBe(true);
    expect(r.flag).toBe(false);
    expect(r.gold).toBe(10);
    expect(r.msg, 'the refusal reaches the player').toContain("You don't have 50gp");
  });

  test('storyRender abandons a pending choice, and the stale button is inert', async ({ page }) => {
    // Inc A's single module slot assumed "a choice resolves within one interaction turn"; a
    // NODE choice can sit across a render. Abandoning writes nothing, because `choice` applies
    // the picked option's bits only AFTER the pick.
    await atLHR(page, { gold: 100 });
    const r = await page.evaluate(() => {
      delete S_story.abandonedFlag;
      const mount = document.createElement('div');
      mount.id = 'g4a-abandon';
      document.getElementById('story-text-box').insertAdjacentElement('afterend', mount);
      _uqfRunVerb({ id: 'abandon', bits: [
        { kind: 'choice', prompt: 'Stay?', options: [
          { label: 'Yes', bits: [{ kind: 'flag_write', set: ['abandonedFlag'] }] },
          { label: 'No',  bits: [] } ] },
      ] }, mount);
      const parked = !!_uqfPending;
      const btn = mount.querySelector('button');          // keep a handle to the doomed button
      storyRender(NODE_MAP[S_story.currentCode]);          // the player did something else
      const dropped = _uqfPending === null;
      const swept = !document.getElementById('g4a-abandon');
      btn.click();                                        // a stale click on the detached panel
      return { parked, dropped, swept, wrote: !!S_story.abandonedFlag };
    });
    expect(r.parked).toBe(true);
    expect(r.dropped, 'storyRender drops the suspended generator').toBe(true);
    expect(r.swept, "the sweep takes the panel's DOM with it").toBe(true);
    expect(r.wrote, 'a stale option button is inert — it can never resume a dropped chain').toBe(false);
  });

  test('the scope fence is unchanged: a choice inside skill_check onPass still throws', async ({ page }) => {
    // G4a builds the driver for VERBS. It deliberately does not widen skill_check, which keeps
    // the kernel's own synchronous _questRunToCompletion so a require('./quest') server needs
    // no host driver.
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((NG) => {
      storyNewGame(NG);
      let threw = false, msg = '';
      try {
        _uqfRunToCompletion(QuestRuntime.execBits([{ kind: 'skill_check', stat: 'STR', dc: 1,
          onPass: [{ kind: 'choice', prompt: 'x', options: [{ label: 'A', bits: [] }, { label: 'B', bits: [] }] }],
          onFail: [{ kind: 'choice', prompt: 'x', options: [{ label: 'A', bits: [] }, { label: 'B', bits: [] }] }] }], {}));
      } catch (e) { threw = true; msg = String((e && e.message) || e); }
      return { threw, msg };
    }, NEWGAME);
    expect(r.threw).toBe(true);
    expect(r.msg).toContain('runToCompletion hit an unresolved ask');
  });
});
