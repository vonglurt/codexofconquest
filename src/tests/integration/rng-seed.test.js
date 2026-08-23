// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §VM-01-B — One stream, two machines: seed the client RNG.
// Proves the client's game-state rolls now draw a seeded mulberry32 stream backed by
// a persisted S_story.rngState — so a save fully determines future encounter/skill/loot
// rolls (bug-repro from a save, replayable traces, server-verifiable rolls). Cross-source
// byte parity vs the server seededNext is guarded separately by scripts/check-rng-parity.js.
// Design: lab-reports/lab-report-vm01b-client-rng-seed.md.
const { test, expect } = require('@playwright/test');

const NEWGAME = { str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

// The reference mulberry32 — the SAME four lines as server seededNext / client
// _seededNext. Used only to prove the game's stream advances exactly as expected.
const MULBERRY = `function _ref(s0){ let st=s0|0; return function(){ let t=(st=(st+0x6D2B79F5)|0); t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }`;

test.describe('§VM-01-B — the seeded client RNG', () => {
  // 1. Replayability: the stream is a pure function of rngState. Restoring a save's
  //    seed reproduces the exact roll sequence — the whole deliverable.
  test('the stream is a pure function of S_story.rngState (fix the seed → identical sequence)', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate((NG) => {
      storyNewGame(NG);
      const draw = (n) => { const out = []; for (let i = 0; i < n; i++) out.push(_seededNext()); return out; };
      S_story.rngState = 0x1234ABCD; const a = draw(64);
      S_story.rngState = 0x1234ABCD; const b = draw(64);
      // a different seed must diverge (guards against an accidental constant stream)
      S_story.rngState = 0x0BADF00D; const c = draw(64);
      return { same: a.join(',') === b.join(','), diff: a.join(',') !== c.join(','), sample: a.slice(0, 3) };
    }, NEWGAME);
    expect(r.same).toBe(true);   // same seed → same sequence
    expect(r.diff).toBe(true);   // different seed → different sequence
    expect(r.sample.every(v => v >= 0 && v < 1)).toBe(true);
  });

  // 2. Persistence round-trip through the REAL autosave/load: rngState rides the save,
  //    and load resumes the stream EXACTLY (no re-bootstrap — the saved seed is non-zero).
  test('rngState persists through storyAutoSave/storyLoadSave and the stream resumes exactly', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(([NG, MULB]) => {
      eval(MULB);                                    // defines _ref (reference mulberry32)
      storyNewGame(NG);
      for (let i = 0; i < 5; i++) _seededNext();      // advance off the unseeded sentinel
      const R = S_story.rngState;                     // live state after some draws
      const expectedNext = _ref(R)();                 // what the NEXT draw must be, from R
      storyAutoSave();
      const savedRng = JSON.parse(localStorage.getItem('r2h_autosave')).rngState;
      S_story.rngState = 999999;                      // dirty the live cell
      const loaded = storyLoadSave('r2h_autosave');   // the REAL load path (defaults-in-the-middle)
      const restored = S_story.rngState;
      const actualNext = _seededNext();               // must continue from R, not re-bootstrap
      return { R, savedRng, restored, expectedNext, actualNext, loaded, isInt: Number.isInteger(R) };
    }, [NEWGAME, MULBERRY]);
    expect(r.loaded).toBe(true);
    expect(r.isInt).toBe(true);
    expect(r.savedRng).toBe(r.R);          // the seed rode the save verbatim
    expect(r.restored).toBe(r.R);          // load restored it
    expect(r.actualNext).toBe(r.expectedNext);   // stream resumed EXACTLY (no re-seed)
  });

  // 3. Old-save migration (§6.2): a save written before §VM-01-B has no rngState. The
  //    defaults-in-the-middle merge supplies the 0 sentinel; the first draw lazily
  //    bootstraps a non-zero seed. No version bump, no backfill, no exception.
  test('a pre-§VM-01-B save (no rngState) loads and lazily bootstraps a non-zero seed', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate((NG) => {
      storyNewGame(NG);
      // Build a legacy save snapshot, then STRIP rngState to mimic a pre-feature save.
      const legacy = JSON.parse(JSON.stringify(S_story));
      delete legacy.rngState;
      localStorage.setItem('r2h_autosave', JSON.stringify(legacy));
      // Wipe the live cell so we can prove the load path, not a leftover, seeds it.
      S_story.rngState = 12345;
      const loaded = storyLoadSave('r2h_autosave');
      const afterLoad = S_story.rngState;             // should be the _S_DEFAULTS sentinel (0)
      let threw = false; let firstDraw = null;
      try { firstDraw = _seededNext(); } catch (e) { threw = true; }
      const afterDraw = S_story.rngState;
      return { loaded, hadRng: 'rngState' in legacy, afterLoad, threw, firstDraw, afterDraw };
    }, NEWGAME);
    expect(r.loaded).toBe(true);
    expect(r.hadRng).toBe(false);          // the legacy save genuinely lacked the field
    expect(r.afterLoad).toBe(0);           // defaults-in-the-middle gave it the unseeded sentinel
    expect(r.threw).toBe(false);           // no crash on a seedless save
    expect(r.firstDraw).toBeGreaterThanOrEqual(0);
    expect(r.firstDraw).toBeLessThan(1);
    expect(Number.isInteger(r.afterDraw)).toBe(true);
    expect(r.afterDraw).not.toBe(0);       // lazily bootstrapped to a real seed
  });

  // 4. Range integrity: the converted sites keep their exact ranges — the substitution
  //    changed the SOURCE of randomness, never a distribution.
  test('_seededNext stays in [0,1); derived d20 is 1..20 and d100 is 0..99', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate((NG) => {
      storyNewGame(NG);
      S_story.rngState = 777;
      let minR = 1, maxR = 0, badD20 = 0, badD100 = 0;
      for (let i = 0; i < 5000; i++) {
        const v = _seededNext();
        if (v < minR) minR = v; if (v > maxR) maxR = v;
        const d20 = Math.ceil(_seededNext() * 20);              // as in _rollSkill (21902)
        if (d20 < 1 || d20 > 20) badD20++;
        const d100 = Math.min(99, Math.floor(_seededNext() * 100)); // as in _rollD100Loot (24033)
        if (d100 < 0 || d100 > 99) badD100++;
      }
      return { minR, maxR, badD20, badD100 };
    }, NEWGAME);
    expect(r.minR).toBeGreaterThanOrEqual(0);
    expect(r.maxR).toBeLessThan(1);
    expect(r.badD20).toBe(0);
    expect(r.badD100).toBe(0);
  });

  // 5. Game-facing proof: QuestRuntime._rollSkill's d20 is now seeded — fixing the seed
  //    reproduces the roll (and thus the pass/fail routing). "Pure roll" is finally honest.
  test('QuestRuntime._rollSkill is reproducible from the seed', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate((NG) => {
      storyNewGame(NG);
      S_story.rngState = 0xC0FFEE; const first  = [0, 1, 2].map(() => QuestRuntime._rollSkill('str').d20);
      S_story.rngState = 0xC0FFEE; const second = [0, 1, 2].map(() => QuestRuntime._rollSkill('str').d20);
      return { first, second, inRange: first.every(d => d >= 1 && d <= 20) };
    }, NEWGAME);
    expect(r.inRange).toBe(true);
    expect(r.second).toEqual(r.first);   // same seed → same d20 sequence
  });
});
