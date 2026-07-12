// §PLAY-01-A The Courier's Map — goal legibility smoke test.
// Fresh game: the opening frame appears + the persistent objective chip surfaces
// the win condition (7 shards · Lv 20 · Day 49) and the seven symbols darken as
// Shards return. Display-only; no page errors.
const { test, expect } = require('@playwright/test');

test.describe('§PLAY-01-A — The Courier\'s Map (goal legibility)', () => {
  test('opening frame + persistent objective chip; symbols darken as shards return', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await page.goto('/roll2hit-v3.html');

    const r = await page.evaluate(() => {
      const out = {};
      const scores = { str:10, dex:8, con:8, int:8, wis:8, cha:8 };
      // Fresh game — this presses Froberger's map into the player's hand.
      storyNewGame(scores);

      // (B) opening frame appears and states the goal in the courier's voice
      const modal = document.getElementById('story-courier-modal');
      out.frameVisible = modal.classList.contains('visible');
      const goalTxt = document.getElementById('courier-goals').textContent;
      out.frameStatesGoal = ['7 Codex Shards', 'Level 20', 'Commander Auros', 'Day 49']
        .every(s => goalTxt.includes(s));
      out.seenFlag = S_story.courierMapSeen === true;

      // dismiss with the button
      document.getElementById('btn-courier-begin').click();
      out.frameDismissed = !modal.classList.contains('visible');

      // (A) persistent objective chip — day 1, level 1, 0 shards
      const shards = () => document.querySelectorAll('#obj-shards .obj-shard');
      const full = () => [...shards()].filter(s => !s.classList.contains('empty')).length;
      out.shardCount = shards().length;                 // always 7 symbols
      out.fullAtStart = full();                          // 0 collected
      out.lvlText = document.getElementById('obj-lvl').textContent.replace(/\s+/g, ' ').trim();
      out.dayText = document.getElementById('obj-day').textContent.replace(/\s+/g, ' ').trim();

      // symbols darken as shards return
      S_story.shards = 3; storyUpdateStatus();
      out.fullAt3 = full();
      S_story.shards = 7; storyUpdateStatus();
      out.fullAt7 = full();

      // day threshold colouring agrees with the sidebar (danger at >= 42)
      S_story.day = 45; storyUpdateStatus();
      out.dayDanger = document.getElementById('obj-day').className.includes('danger');
      // level goal hit turns gold
      S_story.level = 20; storyUpdateStatus();
      out.lvlHit = document.getElementById('obj-lvl').className.includes('hit');
      return out;
    });

    expect(r.frameVisible).toBe(true);
    expect(r.frameStatesGoal).toBe(true);
    expect(r.seenFlag).toBe(true);
    expect(r.frameDismissed).toBe(true);
    expect(r.shardCount).toBe(7);
    expect(r.fullAtStart).toBe(0);
    expect(r.lvlText).toBe('⭐ Lv 1/20');
    expect(r.dayText).toBe('☀ Day 1/49');
    expect(r.fullAt3).toBe(3);
    expect(r.fullAt7).toBe(7);
    expect(r.dayDanger).toBe(true);
    expect(r.lvlHit).toBe(true);
    expect(pageErrors).toEqual([]);
  });
});
