// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
/**
 * §DX-02fb — `crov`'s favor ceiling, and the two constructs that ask for 3.
 *
 * `_setNpcFavor` is monotonic (`if (level <= prev) return;`), so a level is only
 * ever reached by a bit or a call that names it. Both auto-upgrade paths write a
 * hardcoded 2, which makes 3 reachable only from quest data. `FROBERGER_TRACES.crov`
 * (`minFav:3`) and Layer 44's `weckmann_class` world event (`_npcFavor('crov') >= 3`)
 * both read above that line.
 *
 * The two pit quests share one counter and complete in a fixed order:
 * `quest_pit_debut` at `pitTrainingWins >= 1`, `quest_pit_training` at `>= 3`.
 * Because the grant sits on the later quest and is an `add` clamped to the cap,
 * every reachable prior level (0 from a clean run, 1 from the drunk fight or three
 * Talk actions, 2 from the auto-upgrade) lands on exactly 3.
 */
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

// Both pit quests active, at the Neon Undercity, with the trace's visit count met.
const PIT_SEED = {
  currentCode: 'HKG',
  visited: { HKG: true },
  quests: { quest_pit_debut: 'active', quest_pit_training: 'active' },
  pitTrainingWins: 0,
  npcFavorability: {},
  npcVisitCounts: { crov: 2 },
  actNumber: 8,
};

// Run the real completion driver at HKG after setting the shared win counter.
const winsTo = (n) => {
  S_story.pitTrainingWins = n;
  storyCheckQuests(NODE_MAP.HKG);
};

test.describe('§DX-02fb — crov reaches Dear-Friend+3, and both readers above it fire', () => {

  test('crov has exactly one declarative favor write and one direct call', async ({ page }) => {
    await seedAndLoad(page, PIT_SEED);
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      const bits = [];
      for (const id in QUEST_DB) {
        for (const b of (QUEST_DB[id].onComplete || [])) {
          if (b && b.kind === 'favor' && b.npc === 'crov') bits.push({ id, set: b.set, add: b.add, cap: b.cap });
        }
      }
      return { bits, cap: BIT_CONTRACTS.favor.optional.includes('cap') };
    });

    // The `set:1` on quest_pit_training is the ledger entry; the `add` is what
    // carries it past the hardcoded 2 the auto-upgrade writes.
    expect(out.bits).toEqual([
      { id: 'quest_pit_training', set: 1, add: undefined, cap: undefined },
      { id: 'quest_pit_training', set: undefined, add: 2, cap: undefined },
    ]);
    expect(out.cap).toBe(true);
  });

  test('a clean run through both pit quests lands crov on 3', async ({ page }) => {
    await seedAndLoad(page, PIT_SEED);
    await dismissContinue(page);

    const out = await page.evaluate(([fn]) => {
      const wins = eval('(' + fn + ')');
      S_story.npcFavorability = {};
      S_story.quests = { quest_pit_debut: 'active', quest_pit_training: 'active' };
      S_story.pitTrainingWins = 0;
      const atZero = _npcFavor('crov');
      wins(1);
      const afterDebut = { fav: _npcFavor('crov'), debut: S_story.quests.quest_pit_debut,
                           training: S_story.quests.quest_pit_training };
      wins(3);
      return { atZero, afterDebut, fav: _npcFavor('crov'),
               training: S_story.quests.quest_pit_training };
    }, [winsTo.toString()]);

    expect(out.atZero).toBe(0);
    // The debut completes first and carries no favor bit — the ledger is still empty.
    expect(out.afterDebut).toEqual({ fav: 0, debut: 'complete', training: 'active' });
    expect(out.training).toBe('complete');
    expect(out.fav).toBe(3);
  });

  test('the drunk fight first still lands on 3 — the grant is order-independent', async ({ page }) => {
    await seedAndLoad(page, PIT_SEED);
    await dismissContinue(page);

    const out = await page.evaluate(([fn]) => {
      const wins = eval('(' + fn + ')');
      const run = (pre) => {
        S_story.npcFavorability = {};
        S_story.quests = { quest_pit_debut: 'active', quest_pit_training: 'active' };
        S_story.pitTrainingWins = 0;
        if (pre != null) S_story.npcFavorability.crov = pre;
        wins(1);
        wins(3);
        return _npcFavor('crov');
      };
      // 0 = clean · 1 = the drunk fight or three Talk actions · 2 = the auto-upgrade.
      return { from0: run(null), from1: run(1), from2: run(2), from3: run(3) };
    }, [winsTo.toString()]);

    expect(out).toEqual({ from0: 3, from1: 3, from2: 3, from3: 3 });
  });

  test('the Froberger trace and the weckmann_class event both come alive', async ({ page }) => {
    await seedAndLoad(page, PIT_SEED);
    await dismissContinue(page);

    const out = await page.evaluate(([fn]) => {
      const wins = eval('(' + fn + ')');
      S_story.npcFavorability = {};
      S_story.quests = { quest_pit_debut: 'active', quest_pit_training: 'active' };
      S_story.pitTrainingWins = 0;
      S_story.npcVisitCounts = { crov: 2 };
      S_story.actNumber = 8;
      const ev = WORLD_PROGRESSION_EVENTS.find(e => e.id === 'weckmann_class');
      const traceBefore = _checkFrobergerTrace('crov');
      const eventBefore = ev.condition();
      wins(1); wins(3);
      return {
        traceBefore, eventBefore,
        trace: _checkFrobergerTrace('crov'),
        event: ev.condition(),
        minFav: FROBERGER_TRACES.crov.minFav,
      };
    }, [winsTo.toString()]);

    expect(out.minFav).toBe(3);
    expect(out.traceBefore).toBeNull();
    expect(out.eventBefore).toBe(false);
    expect(out.event).toBe(true);
    expect(out.trace).toContain("You still grieve it, don't you.");
  });

  test('every other minFav:3 reader is unaffected by the crov grant', async ({ page }) => {
    await seedAndLoad(page, PIT_SEED);
    await dismissContinue(page);

    const out = await page.evaluate(([fn]) => {
      const wins = eval('(' + fn + ')');
      S_story.npcFavorability = {};
      S_story.quests = { quest_pit_debut: 'active', quest_pit_training: 'active' };
      S_story.pitTrainingWins = 0;
      wins(1); wins(3);
      return { ledger: { ...S_story.npcFavorability }, friends: _lubeckFriends() };
    }, [winsTo.toString()]);

    // The grant names one NPC; nothing else in the ledger moves.
    expect(out.ledger).toEqual({ crov: 3 });
    expect(out.friends).toBe(1);
  });
});
