// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02cn — a New Game inherited the previous character's economy identity.
//
// §STATE-INIT made `_S_DEFAULTS()` the single source of truth for a fresh `S_story`,
// precisely because a drifted seed literal had left fields undefined and crashed the
// first move. Two mesh fields skipped that contract: `playerKey`, minted once by
// `_mpPlayerKey()` and — in its own comment — "kept in the save file like any other
// S_story field", and `pvpOff`.
//
// The consequence is the OPPOSITE of the usual undefined-field crash, and worse.
// `storyNewGame` resets with `Object.assign(S_story, _S_DEFAULTS())` on the LIVE
// object rather than replacing the binding, so a field absent from the defaults shape
// is never overwritten and SURVIVES a New Game. A fresh character kept the previous
// character's `playerKey`, resolved to the same `player8 = sha256(playerKey).slice(0,8)`
// on the server, and inherited the old character's hash-chained item ledger — the exact
// provenance guarantee the no-dupe ledger exists to provide. `_mpPlayerKey()`'s regex
// self-heals a MISSING key and has nothing to say about a STALE one.
//
// NG+ is the other direction and is deliberately not the same call: it is the same
// player continuing, so the key is preserved through the explicit `saved*` locals
// beside npcFavorability and pitPerks. Wiping it there would hand a continuing player
// a brand-new economy identity, which is the same break the other way round.

const { test, expect } = require('@playwright/test');

test.describe('§DX-02cn — the ledger credential obeys the defaults contract', () => {

  test('both fields are declared in _S_DEFAULTS()', async ({ page }) => {
    await page.goto('/play.html');
    const d = await page.evaluate(() => {
      const def = _S_DEFAULTS();
      return { hasKey: 'playerKey' in def, key: def.playerKey,
               hasPvp: 'pvpOff' in def, pvp: def.pvpOff };
    });
    expect(d).toEqual({ hasKey: true, key: '', hasPvp: true, pvp: false });
  });

  test('a New Game clears a minted playerKey — the new character is a new bearer', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const minted = _mpPlayerKey();
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      return { minted, after: S_story.playerKey };
    });
    expect(r.minted).toMatch(/^[0-9a-f]{32}$/);
    expect(r.after).toBe('');
  });

  test('a New Game clears pvpOff back to the shipped default', async ({ page }) => {
    await page.goto('/play.html');
    const after = await page.evaluate(() => {
      S_story.pvpOff = true;
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      return S_story.pvpOff;
    });
    // `false` is byte-for-byte what every reader saw from the old `!!undefined`.
    expect(after).toBe(false);
  });

  test('a minted key is a fresh one, not the old one re-minted', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const first = _mpPlayerKey();
      storyNewGame({ str:10, dex:8, con:8, int:8, wis:8, cha:8 });
      const second = _mpPlayerKey();
      return { first, second };
    });
    expect(r.second).toMatch(/^[0-9a-f]{32}$/);
    expect(r.second).not.toBe(r.first);
  });

  test('NG+ preserves the key — the same player keeps their chain', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      S_story.active = true;
      const minted = _mpPlayerKey();
      storyNewGamePlus();
      return { minted, after: S_story.playerKey, run: S_story.ngPlusRun };
    });
    expect(r.after).toBe(r.minted);
    expect(r.run).toBe(1);
  });
});
