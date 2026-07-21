// §BOARD-01 — The Warrant's Board: rumor/bounty discovery.
// Drives the REAL pure selector (_boardBounties) and the REAL acceptance path
// (_acceptBounty → first live `unlock` opcode). Design: lab-reports/lab-report-warrants-board.md.
const { test, expect } = require('@playwright/test');

const NEWGAME = { str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
const ALLOWED = ['side', 'skill_check', 'craft', 'combat', 'hunt', 'delivery', 'escort', 'dialogue'];

test.describe('§BOARD-01 — The Warrant\'s Board', () => {
  test('host gating + deterministic slate per (node, gameDay)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      const inn = NODE_MAP.TLL;   // sleep:true → board host
      const city = NODE_MAP.LHR;  // sleep:false, no board flag → not a host
      S_story.gameDay = 0;
      const a = _boardBounties(inn, 4).map(b => b.id);
      const b = _boardBounties(inn, 4).map(b => b.id);   // same call, same day → identical
      const nonHost = _boardBounties(city, 4).length;
      S_story.gameDay = 7;
      const c = _boardBounties(inn, 4).map(b => b.id);
      return { a, b, c, nonHost };
    });
    expect(r.nonHost).toBe(0);              // non-rest node hosts no board
    expect(r.a.length).toBeGreaterThan(0);  // the world has postable bounties on a fresh game
    expect(r.a.length).toBeLessThanOrEqual(4);
    expect(r.b).toEqual(r.a);               // deterministic within a (node, day)
    // (r.c may differ — rotation across days — but must not throw / stay ≤ limit)
    expect(r.c.length).toBeLessThanOrEqual(4);
  });

  test('every posted bounty is legal: UQF, allowlisted type, real distant dest, gate-satisfied, not started', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((allowed) => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      const inn = NODE_MAP.TLL;
      const bounties = _boardBounties(inn, 20);   // grab a wide slate
      return bounties.map(b => {
        const q = QUEST_DB[b.id];
        return {
          id: b.id,
          uqf: q.schema === 'UQF-1.0',
          typeOk: allowed.includes(q.type),
          notEpicMain: q.type !== 'epic' && q.type !== 'main',
          destExists: !!NODE_MAP[b.destCode],
          destElsewhere: b.destCode !== 'TLL',
          notStarted: !(S_story.quests || {})[b.id],
          canActivate: QuestRuntime.canActivate(b.id),
          activateCondOk: !q.activateCond || q.activateCond() === true,
        };
      });
    }, ALLOWED);
    expect(r.length).toBeGreaterThan(0);
    for (const b of r) {
      expect(b.uqf, b.id).toBe(true);
      expect(b.typeOk, b.id).toBe(true);
      expect(b.notEpicMain, b.id).toBe(true);
      expect(b.destExists, b.id).toBe(true);
      expect(b.destElsewhere, b.id).toBe(true);
      expect(b.notStarted, b.id).toBe(true);
      expect(b.canActivate, b.id).toBe(true);
      expect(b.activateCondOk, b.id).toBe(true);
    }
  });

  test('selection is pure — mutates no S_story field', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      const before = JSON.stringify(S_story);
      _boardBounties(NODE_MAP.TLL, 4);
      _boardBounties(NODE_MAP.TLL, 4);
      const after = JSON.stringify(S_story);
      return { equal: before === after };
    });
    expect(r.equal).toBe(true);
  });

  test('accepting a bounty fires the first live `unlock`; idempotent; no double-add on arrival', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      const bounties = _boardBounties(NODE_MAP.TLL, 4);
      const b = bounties[0];
      const q = QUEST_DB[b.id];
      const title = q.title;

      _acceptBounty(b.id);
      const statusAfterAccept = (S_story.quests || {})[b.id];

      // idempotent: a second accept is a no-op and must not throw
      let threw = false;
      try { _acceptBounty(b.id); } catch (e) { threw = true; }
      const statusAfterSecond = (S_story.quests || {})[b.id];

      // simulate arriving at the destination node — must NOT re-announce/duplicate
      S_story.currentCode = b.destCode;
      const msgs = storyCheckQuests(NODE_MAP[b.destCode]);
      const reAnnounced = msgs.includes('📋 ' + title);
      const stillPresent = !!(S_story.quests || {})[b.id];

      return { statusAfterAccept, statusAfterSecond, threw, reAnnounced, stillPresent };
    });
    expect(r.statusAfterAccept).toBe('active');   // unlock set it active from afar
    expect(r.threw).toBe(false);
    expect(r.statusAfterSecond).toBe('active');   // idempotent — no reset
    expect(r.reAnnounced).toBe(false);            // arrival did not double-add it
    expect(r.stillPresent).toBe(true);
  });

  test('board renders as a section at a rest node and posts Take buttons', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      // Render the inn node directly (board host) and inspect the DOM the player sees.
      S_story.currentCode = 'TLL';
      storyRender(NODE_MAP.TLL);
      const sec = document.getElementById('story-board-section');
      const hd = sec ? sec.querySelector('.story-section-hd') : null;
      const takeButtons = sec ? sec.querySelectorAll('.story-section-card .story-card-btn') : [];
      const lbls = sec ? Array.from(sec.querySelectorAll('.story-card-lbl')).map(e => e.textContent) : [];
      return {
        present: !!sec,
        header: hd ? hd.textContent : null,
        buttonCount: takeButtons.length,
        allBounty: lbls.length > 0 && lbls.every(l => l === 'BOUNTY'),
      };
    });
    expect(r.present).toBe(true);
    expect(r.header).toContain("Warrant");
    expect(r.buttonCount).toBeGreaterThan(0);
    expect(r.allBounty).toBe(true);
  });
});
