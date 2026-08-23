// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §VM-01-E — Prove the world is finishable: the soft-lock prover.
// The audit found the whole "arbitrary code defeats static analysis" blocker was
// ONE bit: quest_1367_f_plague's onFail rolled `Math.random() > 0.5` to set
// plague_exposed — a mis-implementation of the CON DC 13 save its own failText
// (and the plague_exposed default-decl) document. Inc E ports it to a nested
// seeded skill_check, leaving QUEST_DB with zero nondeterministic effects, and
// ships scripts/check-questgraph.js (a dynamic effect-prober + reachability
// walker). These tests assert (1) the port, (2) the standing guard that no
// _legacy_fn in QUEST_DB carries Math.random, (3) the roll is now reproducible
// from a seed (no longer a coin-flip). Design:
// lab-reports/lab-report-vm01e-softlock-prover.md.
const { test, expect } = require('@playwright/test');

const NEWGAME = { str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

test.describe('§VM-01-E — the soft-lock prover', () => {
  // 1. The port: the plague onFail is now a nested CON DC 13 skill_check whose own
  //    onFail sets plague_exposed — the mechanic the fiction always promised.
  test('quest_1367_f_plague onFail is a seeded CON DC 13 save, not a coin-flip', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      const q = QUEST_DB['quest_1367_f_plague'];
      const outer = q.bits[0];                     // the STR DC 12 clear
      const onFail = outer.onFail || [];
      const save  = onFail[0];                      // the ported CON save
      const inner = (save.onFail || [])[0];         // its own onFail: gain plague_exposed
      return {
        outerKind: outer.kind, outerStat: outer.stat,
        saveKind: save && save.kind, saveStat: save && save.stat, saveDc: save && save.dc,
        innerKind: inner && inner.kind, innerSet: inner && (inner.set || []).join(','),
        anyRandomInChain: JSON.stringify(q, (k, v) => typeof v === 'function' ? v.toString() : v).includes('Math.random'),
      };
    });
    expect(r.outerKind).toBe('skill_check');
    expect(r.saveKind).toBe('skill_check');
    expect(r.saveStat).toBe('CON');
    expect(r.saveDc).toBe(13);
    expect(r.innerKind).toBe('flag_write');
    expect(r.innerSet).toBe('plague_exposed');
    expect(r.anyRandomInChain).toBe(false);
  });

  // 2. THE STANDING GUARD: no _legacy_fn anywhere in QUEST_DB carries Math.random.
  //    The CONTRIBUTING Host/Script Separation rule ("game-state randomness must
  //    come from the seeded stream") made executable — and the reason §VM-01-E's
  //    static reachability analysis can now see through the whole DB.
  test('no _legacy_fn in QUEST_DB contains Math.random (the blocker cannot return)', async ({ page }) => {
    await page.goto('/index.html');
    const offenders = await page.evaluate(() => {
      const bad = [];
      const walk = (bits, qid) => {
        for (const b of bits || []) {
          if (!b || typeof b !== 'object') continue;
          if (b.kind === '_legacy_fn' && typeof b.fn === 'function' && /Math\.random/.test(b.fn.toString())) bad.push(qid);
          walk(b.onPass, qid); walk(b.onFail, qid);
          (b.options || []).forEach(o => walk(o.bits, qid));
        }
      };
      for (const id in QUEST_DB) {
        const q = QUEST_DB[id];
        walk(q.bits, id);
        if (Array.isArray(q.onComplete)) walk(q.onComplete, id);
      }
      return bad;
    });
    expect(offenders).toEqual([]);
  });

  // 3. Reproducible-from-seed: the same rngState → byte-identical outcome across two
  //    runs of the ported onFail chain (a coin-flip could not do this). Proves the
  //    §VM-01-B seeded stream now determines the plague outcome from the save.
  test('the ported save resolves identically from a fixed seed (deterministic)', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate((NG) => {
      const onFail = QUEST_DB['quest_1367_f_plague'].bits[0].onFail;
      const run = (seed) => {
        storyNewGame(NG);
        S_story.rngState = seed;               // fix the seeded stream
        const scratch = { rngState: seed, quests: {}, inventory: [], abilityScores: { con: 6 } };
        // skill_check rolls the live sheet+stream (host-fence), writes flags to ctx.state
        _uqfRunToCompletion(QuestRuntime.execBits(onFail, { state: scratch, questId: 'plague', pushMsg: () => {} }));
        return { exposed: scratch.plague_exposed === true, dump: JSON.stringify(scratch) };
      };
      const a = run(123456), b = run(123456), c = run(123456);
      return { a, b, c, allEqual: a.dump === b.dump && b.dump === c.dump };
    }, NEWGAME);
    expect(r.allEqual).toBe(true);   // three same-seed runs, identical scratch state
  });
});
