// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §VM-01-A — Give the VM a `yield`: execBits → coroutine.
// Drives the REAL generator execBits + the REAL driver (_uqfPump / _uqfRunToCompletion)
// and the REAL, now-implemented `choice` handler end-to-end. The keystone of the §VM-01
// track: proves the VM can suspend for an answer and resume — while staying a byte-for-byte
// no-op on every plain (non-suspending) chain. Design: lab-reports/lab-report-vm01a-execbits-coroutine.md.
const { test, expect } = require('@playwright/test');

const NEWGAME = { str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

test.describe('§VM-01-A — the quest VM coroutine', () => {
  // 1. Suspend-and-resume: a real `choice` bit yields an ask, applies NOTHING on the way
  //    in, and applies ONLY the chosen option's bits after the pick.
  test('choice suspends with an ask, and only the picked branch applies (after the pick)', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate((NG) => {
      storyNewGame(NG);
      delete S_story.optA_taken; delete S_story.optB_taken;
      const bit = { kind: 'choice', prompt: 'Pick a door', options: [
        { label: 'Left',  bits: [{ kind: 'flag_write', set: ['optA_taken'] }] },
        { label: 'Right', bits: [{ kind: 'flag_write', set: ['optB_taken'] }] },
      ] };
      const gen = QuestRuntime.execBits([bit], {});
      const ask = _uqfPump(gen);                       // pump until the choice suspends
      const onEntry = { optA: !!S_story.optA_taken, optB: !!S_story.optB_taken, parked: !!_uqfPending };
      const done = _uqfPump(gen, 1);                   // resume with index 1 (Right)
      const onResume = { optA: !!S_story.optA_taken, optB: !!S_story.optB_taken, cleared: _uqfPending === null };
      return { ask, onEntry, done, onResume };
    }, NEWGAME);

    // suspends with the ask envelope (labels only — the author never couples to presentation)
    expect(r.ask).toEqual({ ask: 'choice', prompt: 'Pick a door', options: ['Left', 'Right'] });
    // nothing applied on the way IN — this is what makes a tab-close mid-choice safe (§6.3)
    expect(r.onEntry.optA).toBe(false);
    expect(r.onEntry.optB).toBe(false);
    expect(r.onEntry.parked).toBe(true);               // the live generator is parked in the module slot
    // resume completes the chain and applies ONLY option 1's bits
    expect(r.done).toBe(null);
    expect(r.onResume.optA).toBe(false);
    expect(r.onResume.optB).toBe(true);
    expect(r.onResume.cleared).toBe(true);             // slot released once the chain finishes
  });

  // 2. The migration shim throws on an unanswered ask — this is exactly why the five
  //    synchronous call sites stay no-ops: none of their chains contains a choice today,
  //    so runToCompletion never throws in production.
  test('_uqfRunToCompletion throws on an unresolved ask', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate((NG) => {
      storyNewGame(NG);
      const bit = { kind: 'choice', prompt: 'x', options: [
        { label: 'A', bits: [] }, { label: 'B', bits: [] },
      ] };
      let threw = false, msg = '';
      try { _uqfRunToCompletion(QuestRuntime.execBits([bit], {})); }
      catch (e) { threw = true; msg = String((e && e.message) || e); }
      return { threw, msg };
    }, NEWGAME);
    expect(r.threw).toBe(true);
    expect(r.msg).toContain('[UQF] runToCompletion hit an unresolved ask');
  });

  // 3. Plain chains are a NO-OP under the change: identical side effects AND message order
  //    to the old straight-line loop (the whole regression guarantee, in miniature).
  test('a plain flag_write + reward + narrative chain is byte-identical through the shim', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate((NG) => {
      storyNewGame(NG);
      delete S_story.goldenFlag;
      const msgs = [];
      const xpBefore = S_story.xp || 0, goldBefore = S_story.gold || 0;
      const chain = [
        { kind: 'flag_write', set: ['goldenFlag'] },
        { kind: 'reward', xp: 150, gold: 50 },
        { kind: 'narrative', msg: 'hello world' },
      ];
      _uqfRunToCompletion(QuestRuntime.execBits(chain, { pushMsg: m => msgs.push(m) }));
      return {
        flag: !!S_story.goldenFlag,
        xpDelta: (S_story.xp || 0) - xpBefore,
        goldDelta: (S_story.gold || 0) - goldBefore,
        msgs,
        pending: _uqfPending,
      };
    }, NEWGAME);
    expect(r.flag).toBe(true);
    expect(r.xpDelta).toBe(150);
    expect(r.goldDelta).toBe(50);
    expect(r.msgs).toEqual(['hello world']);           // ctx.pushMsg order preserved
    expect(r.pending).toBe(null);                       // a plain chain never parks a generator
  });

  // 4. §6.3 invariant — a save taken MID-SUSPENSION cannot capture the coroutine. The
  //    in-flight generator lives only in the module slot _uqfPending, never in S_story,
  //    so JSON.stringify(S_story) round-trips clean with no generator anywhere.
  test('autosave taken mid-choice never serializes the suspended generator', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate((NG) => {
      storyNewGame(NG);
      const bit = { kind: 'choice', prompt: 'p', options: [
        { label: 'A', bits: [{ kind: 'flag_write', set: ['aFlag'] }] },
        { label: 'B', bits: [{ kind: 'flag_write', set: ['bFlag'] }] },
      ] };
      const gen = QuestRuntime.execBits([bit], {});
      _uqfPump(gen);                                     // suspend mid-choice
      const parked = !!_uqfPending && typeof _uqfPending.gen.next === 'function';
      storyAutoSave();                                   // the REAL autosave, taken mid-suspension
      const raw = localStorage.getItem('r2h_autosave');
      let roundTrips = false, hasPending = false, hasGen = false;
      try {
        const parsed = JSON.parse(raw);
        roundTrips = true;
        hasPending = Object.prototype.hasOwnProperty.call(parsed, '_uqfPending');
        hasGen = raw.includes('[object Generator]');
      } catch (e) {}
      return { parked, roundTrips, hasPending, hasGen };
    }, NEWGAME);
    expect(r.parked).toBe(true);                         // a genuine suspended generator was parked
    expect(r.roundTrips).toBe(true);                     // the save is still valid JSON
    expect(r.hasPending).toBe(false);                    // _uqfPending is NOT in S_story
    expect(r.hasGen).toBe(false);                        // no generator serialized anywhere
  });

  // 5. Bonus (parent-report claim retired): item_check's ctx._itemCheck was write-only
  //    because the language had no branch. Now a `choice` can be resumed FROM it — the
  //    predicate is finally consumable to drive a decision.
  test('item_check result is consumable to drive a choice branch', async ({ page }) => {
    await page.goto('/index.html');
    const drive = await page.evaluate((NG) => {
      function run(hasKeyInv) {
        storyNewGame(NG);
        S_story.inventory = hasKeyInv ? [{ name: 'Brass Key' }] : [];
        delete S_story.doorOpened; delete S_story.doorLeft;
        const ctx = {};
        const gen = QuestRuntime.execBits([
          { kind: 'item_check', name: 'Brass Key', count: 1 },
          { kind: 'choice', prompt: 'The door is locked.', options: [
            { label: 'Unlock it', bits: [{ kind: 'flag_write', set: ['doorOpened'] }] },
            { label: 'Walk away', bits: [{ kind: 'flag_write', set: ['doorLeft'] }] },
          ] },
        ], ctx);
        _uqfPump(gen);                                   // runs item_check, then suspends at the choice
        const predicate = ctx._itemCheck === true;       // ← the value written by the FIRST bit, now observable downstream
        _uqfPump(gen, predicate ? 0 : 1);                // resume: branch chosen BY the item_check result
        return { predicate, doorOpened: !!S_story.doorOpened, doorLeft: !!S_story.doorLeft };
      }
      return { withKey: run(true), withoutKey: run(false) };
    }, NEWGAME);
    // has the key → predicate true → Unlock branch taken
    expect(drive.withKey.predicate).toBe(true);
    expect(drive.withKey.doorOpened).toBe(true);
    expect(drive.withKey.doorLeft).toBe(false);
    // no key → predicate false → Walk-away branch taken
    expect(drive.withoutKey.predicate).toBe(false);
    expect(drive.withoutKey.doorOpened).toBe(false);
    expect(drive.withoutKey.doorLeft).toBe(true);
  });
});
