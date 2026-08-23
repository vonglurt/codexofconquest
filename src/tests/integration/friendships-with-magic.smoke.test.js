// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §PLAY-01-D Friendships With Magic — signpost the magic path through a person.
// Yael's turn-one onboarding monologue (yael.impartial[0], the line shown on the
// FIRST meeting) must personally point the player to the Fisherman / Yugurt Lake as
// the source of the edge — the magic vector reaches the player through a person, not
// a lamppost coupon or a throwaway stat-grind aside. Dialogue-only; no page errors.
const { test, expect } = require('@playwright/test');

test.describe('§PLAY-01-D — Friendships With Magic (magic-path signpost)', () => {
  test('Yael\'s first-meeting line signposts the Fisherman / Yugurt Lake / free rod', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await page.goto('/play.html');

    const r = await page.evaluate(() => {
      const out = {};
      const line = NPC_DIALOGUES.yael.impartial[0];

      // (a) the old throwaway phrasing is gone
      out.noOldPhrasing = !/fishing dock/i.test(line) && !/slow river/i.test(line);
      // (b) it now names the lake, the person, and the free rod — the magic vector, transmitted
      out.namesYugurt = /Yugurt/.test(line);
      out.namesFisherman = /Fisherman/.test(line);
      out.namesFree = /\bfree\b/.test(line);
      // still in-voice / part of the onboarding thread (Dexterity kept)
      out.keepsOnboarding = /Dexterity/.test(line);

      // (c) it is GUARANTEED to be the line delivered on the FIRST meeting — even though the
      // Slums quest is auto-active (which would otherwise shadow impartial[0] with questActive).
      const scores = { str:10, dex:8, con:8, int:8, wis:8, cha:8 };
      storyNewGame(scores);
      out.slumsAutoActive = S_story.quests['quest_slums_cleanup'] === 'active';  // the shadow condition
      // storyNewGame's own LHR render already delivered the monologue → flag set (the real delivery)
      out.deliveredOnNewGame = S_story.yaelOnboardingSeen === true;
      // reset to simulate a clean first meeting and drive the one-time delivery directly
      S_story.yaelOnboardingSeen = false; S_story.npcVisitCounts = {};
      const first = _getNPCDialogue('yael');
      out.firstVisitIsMonologue = first.quote === NPC_DIALOGUES.yael.impartial[0];
      out.firstVisitSignposts = /Yugurt/.test(first.quote) && /Fisherman/.test(first.quote);
      out.seenFlagSet = S_story.yaelOnboardingSeen === true;
      // (d) it fires exactly ONCE — the second meeting no longer forces the monologue
      const second = _getNPCDialogue('yael');
      out.secondVisitNotMonologue = second.quote !== NPC_DIALOGUES.yael.impartial[0];

      // no other NPC's first line accidentally carries the signpost (no cross-contamination)
      out.brynnClean = !/Yugurt/.test((NPC_DIALOGUES.brynn?.impartial?.[0]) || '');
      return out;
    });

    expect(r.noOldPhrasing).toBe(true);
    expect(r.namesYugurt).toBe(true);
    expect(r.namesFisherman).toBe(true);
    expect(r.namesFree).toBe(true);
    expect(r.keepsOnboarding).toBe(true);
    expect(r.slumsAutoActive).toBe(true);
    expect(r.deliveredOnNewGame).toBe(true);
    expect(r.firstVisitIsMonologue).toBe(true);
    expect(r.firstVisitSignposts).toBe(true);
    expect(r.seenFlagSet).toBe(true);
    expect(r.secondVisitNotMonologue).toBe(true);
    expect(r.brynnClean).toBe(true);
    expect(pageErrors).toEqual([]);
  });
});
