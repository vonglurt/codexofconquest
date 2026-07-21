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

  test('§BOARD-01-FU1 — honest reward preview: side xpAward fallback + skill_check onPass reward, never the dead q.reward', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      // quest_scar_04: type:'side', pays via the LIVE top-level xpAward (granted at
      // storyCheckQuests 29400); carries a DEAD display-only reward:500 (no engine
      // consumer, see ~13762) and NO reward bit — so it must fall back to ⭐xpAward.
      const sq = QUEST_DB['quest_scar_04'];
      // quest_scar_01: type:'skill_check' — its reward bit is nested in bits[].onPass,
      // which the pre-FU1 scan missed entirely (returned '').
      const scq = QUEST_DB['quest_scar_01'];
      return {
        sideStr: _boardReward(sq),
        sideXp: sq.xpAward,
        sideDeadReward: sq.reward,
        skillStr: _boardReward(scq),
      };
    });
    // Side quest: shows the ⭐xp actually granted, and NEVER invents the dead gold.
    expect(r.sideStr).toContain('⭐');
    expect(r.sideStr).toContain(String(r.sideXp));                       // 350 — the real payout
    expect(r.sideStr).not.toContain(String(r.sideDeadReward) + ' g');   // 500 g — must not appear
    // skill_check: the nested onPass reward now surfaces (was blank before FU1).
    expect(r.skillStr.length).toBeGreaterThan(0);
    expect(r.skillStr).toContain('⭐');
  });

  test('§BOARD-01-FU2 — accepting a bounty auto-sets the waypoint to its destination (route only, no move)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.currentCode = 'TLL';
      S_story.waypoint = null;
      const posBefore = S_story.currentCode;
      const b = _boardBounties(NODE_MAP.TLL, 4)[0];
      _acceptBounty(b.id);
      const toast = (document.getElementById('story-move-msg') || {}).textContent || '';
      return { destCode: b.destCode, waypoint: S_story.waypoint, posBefore, posAfter: S_story.currentCode, toast };
    });
    expect(r.waypoint).toBe(r.destCode);          // arrows point at the card's own destination
    expect(r.posAfter).toBe(r.posBefore);         // invariant: highlight only — no move, no jump travel (§CELL-13)
    expect(r.toast).toContain('Bounty accepted');
    expect(r.toast).toContain('waypoint set');    // toast tells the player (never silent)
  });

  test('§BOARD-01-FU3 — distance-labeled slate: each shown card carries a leg count from the live player position', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.gameDay = 0;
      const shown = _boardBounties(NODE_MAP.TLL, 4);
      // Truth reference: recompute legs independently the same way the render does.
      const rows = shown.map(b => ({
        legs: b.legs, legStr: b.legStr,
        truth: _roadGridPath(null, b.destCode).length,
        hasCoords: !!NODE_COORDS[b.destCode],
      }));
      return { count: shown.length, rows };
    });
    expect(r.count).toBeGreaterThan(0);
    for (const row of r.rows) {
      expect(row.legs).toBe(row.truth);                       // label matches the real road-weighted BFS
      if (row.truth > 0) {
        expect(row.legStr).toBe('~' + row.truth + (row.truth === 1 ? ' leg' : ' legs'));
      } else {
        expect(row.legStr).toBe('');                          // no coords / here ⇒ label omitted (never "~0 legs")
      }
    }
  });

  test('§BOARD-01-FU4 — Yael\'s onboarding signposts the Warrant\'s Board (the mechanic is discoverable)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const line = NPC_DIALOGUES.yael.impartial[0];
      // The onboarding monologue must NAME the board and place it (any inn/rest node),
      // not just leave LHR's "notices flutter on the board" flavor with no pointer.
      const namesBoard = /Warrant's Board/.test(line);
      const placesIt = /(inn|rest node)/i.test(line);
      // It must still be the GUARANTEED first-meeting delivery so the signpost actually reaches
      // the player (the §PLAY-01-D one-time delivery; Slums quest would otherwise shadow it).
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.yaelOnboardingSeen = false; S_story.npcVisitCounts = {};
      const first = _getNPCDialogue('yael');
      return {
        namesBoard,
        placesIt,
        firstVisitCarriesSignpost: /Warrant's Board/.test(first.quote),
        // preserved: the §PLAY-01-D magic-path signpost still rides the same line
        keepsMagicSignpost: /Yugurt/.test(line) && /Fisherman/.test(line),
      };
    });
    expect(r.namesBoard).toBe(true);
    expect(r.placesIt).toBe(true);
    expect(r.firstVisitCarriesSignpost).toBe(true);
    expect(r.keepsMagicSignpost).toBe(true);
  });

  test('§BOARD-01-FU5 — synthesized rumor derives from destination terrain; authored q.rumor still wins; deterministic', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.gameDay = 0;
      const shown = _boardBounties(NODE_MAP.TLL, 4);
      // (a) every card carries a non-flat, world-flavored line naming its destination place
      const rows = shown.map(b => {
        const dest = NODE_MAP[b.destCode];
        const terr = (dest && WORLD_DB[dest.name] && WORLD_DB[dest.name].label) || b.destShort;
        return {
          line: b.rumorLine,
          notFlat: b.rumorLine !== 'Posted by the Crimson Warrant.',
          mentionsPlace: b.rumorLine.includes(terr),
          authored: !!b.rumor,
        };
      });
      // (b) deterministic within a (node, gameDay)
      const again = _boardBounties(NODE_MAP.TLL, 4).map(b => b.rumorLine);
      const stable = again.length === shown.length && again.every((l, i) => l === shown[i].rumorLine);
      // (c) an authored q.rumor passes through verbatim (renderer prefers it)
      const target = shown[0].id;
      QUEST_DB[target].rumor = 'The fence in the underground has a name now.';
      const authored = _boardBounties(NODE_MAP.TLL, 4).find(b => b.id === target);
      const authoredWins = !!authored && authored.rumorLine === 'The fence in the underground has a name now.';
      QUEST_DB[target].rumor = null;   // restore
      return { rows, stable, authoredWins };
    });
    expect(r.rows.length).toBeGreaterThan(0);
    for (const row of r.rows) {
      expect(row.notFlat).toBe(true);
      if (!row.authored) expect(row.mentionsPlace).toBe(true);   // synthesized line names the terrain/place
    }
    expect(r.stable).toBe(true);
    expect(r.authoredWins).toBe(true);
  });
});
