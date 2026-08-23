// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
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

  // ── §BOARD-01-FU6 — `unlock` as a reward bit: geography-jumping referral chains ──
  // Completing a Warrant bounty appends a referral (narrative + unlock) to its onComplete
  // that posts a follow-on bounty at a DISTANT node. This is the file's first QUEST-authored
  // `unlock` (Inc B was the first live call site; this is the first content author). Drives
  // the REAL onComplete chains through the REAL execBits, exactly as storyCheckQuests does.
  test('§BOARD-01-FU6 — completing a bounty refers you onward (unlock in onComplete) across distant nodes', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // The authored referral chains (source → next). Terminus quests carry NO unlock.
      const CHAINS = {
        math:   ['quest_math_01', 'quest_math_02', 'quest_math_03', 'quest_math_04', 'quest_math_05'],
        rennau: ['quest_tl_01', 'quest_tl_02', 'quest_tl_03'],
      };
      const out = { edges: [], termini: [], missing: [] };
      for (const ids of Object.values(CHAINS)) for (const id of ids) if (!QUEST_DB[id]) out.missing.push(id);

      for (const ids of Object.values(CHAINS)) {
        for (let i = 0; i < ids.length - 1; i++) {
          const src = ids[i], dst = ids[i + 1];
          storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
          S_story.gameDay = 0;
          const qsrc = QUEST_DB[src], qdst = QUEST_DB[dst];
          const beforeDst = (S_story.quests || {})[dst] || null;
          const dstNodeExists  = !!NODE_MAP[qdst.activateNode];
          // fire the source's completion chain exactly as storyCheckQuests (29394) does — the
          // source is marked complete FIRST, as the completion loop does before running onComplete
          S_story.quests[src] = 'complete';
          const msgs = [];
          _uqfRunToCompletion(QuestRuntime.execBits(qsrc.onComplete, { questId: src, pushMsg: m => msgs.push(m) }));
          // §VM-01-G3 — legitimacy is IN-SEQUENCE AT REFERRAL TIME: the source's completion
          // (status + its flag writes) is what satisfies the target's gate. The old check ran
          // canActivate on a FRESH game, which only ever passed because the rennau gates were
          // vacuous — the same hole that let the board post chapter 2 before chapter 1.
          const dstCanActivate = QuestRuntime.canActivate(dst);
          const afterDst = (S_story.quests || {})[dst] || null;
          // idempotency: a second fire must not throw and must leave the target 'active'
          _uqfRunToCompletion(QuestRuntime.execBits(qsrc.onComplete, { questId: src, pushMsg: () => {} }));
          const afterTwice = (S_story.quests || {})[dst] || null;
          out.edges.push({
            src, dst,
            srcHasOnCompleteArr: Array.isArray(qsrc.onComplete),
            beforeDstUnset: !beforeDst,
            dstCanActivate, dstNodeExists,
            unlockedActive: afterDst === 'active',
            idempotent: afterTwice === 'active',
            geoJump: qsrc.activateNode !== qdst.activateNode,
            referralLine: msgs.some(m => /Warrant's Board/.test(m)),
          });
        }
        // terminus: the last quest must NOT unlock anything (no cycle / no runaway chain)
        const last = ids[ids.length - 1];
        const oc = QUEST_DB[last].onComplete;
        out.termini.push({ id: last, hasUnlock: Array.isArray(oc) && oc.some(b => b && b.kind === 'unlock') });
      }
      return out;
    });
    expect(r.missing).toEqual([]);
    expect(r.edges.length).toBe(6);   // math: 4 edges + rennau: 2 edges
    for (const e of r.edges) {
      const tag = e.src + '→' + e.dst;
      expect(e.srcHasOnCompleteArr, e.src).toBe(true);
      expect(e.beforeDstUnset, e.dst).toBe(true);        // target not pre-active on a fresh game
      expect(e.dstCanActivate, e.dst).toBe(true);        // force-activating a legitimately-gated bounty
      expect(e.dstNodeExists, e.dst).toBe(true);         // ...at a real node (never a broken referral)
      expect(e.unlockedActive, tag).toBe(true);          // the unlock posted the follow-on
      expect(e.idempotent, tag).toBe(true);              // second completion is a safe no-op
      expect(e.geoJump, tag).toBe(true);                 // distinct (distant) destination node
      expect(e.referralLine, tag).toBe(true);            // a characterful referral line printed
    }
    for (const t of r.termini) expect(t.hasUnlock, t.id).toBe(false);   // chains terminate — no cycle
  });

  // ── §BOARD-01-FU6 (1367 chronicle) — a CROSS-REGION referral sweep ──────────────
  // Six standalone 1367 bounties (Spain → England → France → Baltic → Balkans → East)
  // linked purely by Warrant reputation — the network reads as a faction, not a sub-arc.
  // These are skill_check/combat quests: they carry NO `completion` gate, so they complete
  // via _resolveQuestUQF (onPass), NOT storyCheckQuests (onComplete). The referral therefore
  // lives in the skill_check bit's onPass — you are referred onward only when you SUCCEED.
  const CHRONICLE = ['quest_1367_a_najera', 'quest_1367_e_wycliffe', 'quest_1367_f_plague', 'quest_1367_d_hansa', 'quest_1367_c_ottoman', 'quest_1367_b_tamerlane'];

  test('§BOARD-01-FU6 (1367 chronicle) — completing a bounty refers you onward via onPass unlock, across distant regions', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((CHAIN) => {
      const out = { edges: [], missing: [], terminus: null };
      for (const id of CHAIN) if (!QUEST_DB[id]) out.missing.push(id);
      const scOf = q => (q.bits || []).find(b => b.kind === 'skill_check');
      for (let i = 0; i < CHAIN.length - 1; i++) {
        const src = CHAIN[i], dst = CHAIN[i + 1];
        storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
        S_story.gameDay = 0;
        const qsrc = QUEST_DB[src], qdst = QUEST_DB[dst];
        const beforeDst = (S_story.quests || {})[dst] || null;
        const dstCanActivate = QuestRuntime.canActivate(dst);   // referral target is a legitimate, in-sequence bounty
        const dstNodeExists = !!NODE_MAP[qdst.activateNode];
        // fire the source's onPass exactly as _resolveQuestUQF (6823) does on a passing roll
        const msgs = [];
        _uqfRunToCompletion(QuestRuntime.execBits(scOf(qsrc).onPass, { questId: src, pushMsg: m => msgs.push(m) }));
        const afterDst = (S_story.quests || {})[dst] || null;
        // idempotency: a second pass must not throw and must leave the target 'active'
        _uqfRunToCompletion(QuestRuntime.execBits(scOf(qsrc).onPass, { questId: src, pushMsg: () => {} }));
        const afterTwice = (S_story.quests || {})[dst] || null;
        out.edges.push({
          src, dst,
          onPassIsArr: Array.isArray(scOf(qsrc).onPass),
          beforeDstUnset: !beforeDst,
          dstCanActivate, dstNodeExists,
          unlockedActive: afterDst === 'active',
          idempotent: afterTwice === 'active',
          geoJump: qsrc.activateNode !== qdst.activateNode,     // genuinely distant destination
          referralLine: msgs.some(m => /Warrant's Board/.test(m)),
        });
      }
      // terminus: b_tamerlane closes the chronicle — a narrative but NO onward unlock (no cycle)
      const last = CHAIN[CHAIN.length - 1];
      const lastOnPass = scOf(QUEST_DB[last]).onPass;
      out.terminus = {
        id: last,
        hasUnlock: lastOnPass.some(b => b && b.kind === 'unlock'),
        hasClosingNarrative: lastOnPass.some(b => b && b.kind === 'narrative' && /1367/.test(b.msg || '')),
      };
      return out;
    }, CHRONICLE);
    expect(r.missing).toEqual([]);
    expect(r.edges.length).toBe(5);   // six quests, five referral edges
    for (const e of r.edges) {
      const tag = e.src + '→' + e.dst;
      expect(e.onPassIsArr, e.src).toBe(true);
      expect(e.beforeDstUnset, e.dst).toBe(true);
      expect(e.dstCanActivate, e.dst).toBe(true);
      expect(e.dstNodeExists, e.dst).toBe(true);
      expect(e.unlockedActive, tag).toBe(true);   // onPass unlock posted the follow-on
      expect(e.idempotent, tag).toBe(true);        // second pass is a safe no-op
      expect(e.geoJump, tag).toBe(true);           // distinct (distant) destination region
      expect(e.referralLine, tag).toBe(true);      // a characterful Warrant referral line printed
    }
    expect(r.terminus.hasUnlock, r.terminus.id).toBe(false);          // chronicle terminates
    expect(r.terminus.hasClosingNarrative, r.terminus.id).toBe(true); // ...but still gets a capstone
  });

  // Engine fix (rides with FU6): an onPass narrative bit must reach the player. Before this,
  // _resolveQuestUQF wrote it via storyMsg, then its own storyRender tail overwrote
  // #story-move-msg — so the line flashed and vanished (why no quest had ever used one).
  // Now onPass narratives are collected and passed as storyRender's prefix; this drives the
  // REAL resolve path (_rollCeremonia → _resolveQuestUQF) with a forced pass and reads the DOM.
  test('§BOARD-01-FU6 (1367 chronicle) — onPass referral narrative survives storyRender into #story-move-msg', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      const src = 'quest_1367_a_najera', dst = 'quest_1367_e_wycliffe';
      const q = QUEST_DB[src];
      const sc = q.bits.find(b => b.kind === 'skill_check');
      S_story.currentCode = q.activateNode;   // stand at the source node
      S_story.quests[src] = 'active';
      const savedDc = sc.dc; sc.dc = -100;    // force a deterministic PASS (no flaky d20)
      _rollCeremonia(src);                     // REAL resolve path → _resolveQuestUQF
      sc.dc = savedDc;                         // restore the real DC
      const moveMsg = (document.getElementById('story-move-msg') || {}).textContent || '';
      return {
        questDone: S_story.quests[src] === 'done',
        dstActive: S_story.quests[dst] === 'active',
        referralVisible: /Warrant's Board/.test(moveMsg) && moveMsg.indexOf('🖋️') > -1,
      };
    });
    expect(r.questDone).toBe(true);       // the pass marked it done
    expect(r.dstActive).toBe(true);       // onPass unlock posted the follow-on bounty
    expect(r.referralVisible).toBe(true); // ENGINE FIX: the referral reached the player (not clobbered)
  });

  // ── §BOARD-01-FU6 (branch) — the network's FIRST FORK ──────────────────────────
  // Every prior referral was a LINE (one completion → one onward bounty). This is the one
  // topology the network lacked: a FORK — one completion posts TWO onward bounties via a
  // SINGLE two-target `unlock` (the opcode's first multi-quest author). Brynn's recovered
  // ledger has two open entries pointing two ways: the scholar's revoked record (Isolde @NUE)
  // and the collector's live debt (Solvak @VS). Now that the Warrant trusts you (FU7), it lets
  // you CHOOSE which thread to pull. Drives the REAL onComplete chain through the REAL execBits,
  // exactly as storyCheckQuests (29404) fires a completed side quest's onComplete.
  test('§BOARD-01-FU6 (branch) — one completion forks to TWO onward bounties across distinct distant nodes', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const SRC = 'quest_brynn_ledger';
      const FORKS = ['quest_wm_01', 'quest_vs_01'];
      const out = { missing: [] };
      for (const id of [SRC, ...FORKS]) if (!QUEST_DB[id]) out.missing.push(id);

      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.gameDay = 0;
      const qsrc = QUEST_DB[SRC];

      // the fork is a SINGLE unlock bit carrying BOTH targets — the branch primitive
      // (unlock(bit) at 21787 iterates bit.quests, so one bit posts many)
      const unlockBits = (qsrc.onComplete || []).filter(b => b && b.kind === 'unlock');
      out.srcHasOnCompleteArr = Array.isArray(qsrc.onComplete);
      out.singleUnlockBit = unlockBits.length === 1;
      out.forkArity = unlockBits.length === 1 ? (unlockBits[0].quests || []).length : 0;
      out.forkTargets = unlockBits.length === 1 ? unlockBits[0].quests.slice() : [];

      // pre-state: neither fork is active on a fresh game; both are legitimate in-sequence bounties
      out.forks = FORKS.map(dst => {
        const qdst = QUEST_DB[dst];
        return {
          dst,
          beforeUnset: !(S_story.quests || {})[dst],
          canActivate: QuestRuntime.canActivate(dst),
          nodeExists: !!NODE_MAP[qdst.activateNode],
          geoJumpFromSrc: qsrc.activateNode !== qdst.activateNode,
        };
      });
      out.forksDistinct = QUEST_DB[FORKS[0]].activateNode !== QUEST_DB[FORKS[1]].activateNode;

      // fire the source's completion exactly as storyCheckQuests (29404) does on a completed side quest
      const msgs = [];
      _uqfRunToCompletion(QuestRuntime.execBits(qsrc.onComplete, { questId: SRC, pushMsg: m => msgs.push(m) }));
      out.bothActive = FORKS.every(dst => (S_story.quests || {})[dst] === 'active');
      // ONE referral line names BOTH leads and the board (the fork reads as a single choice)
      out.referralNamesBoth = msgs.some(m => /Warrant's Board/.test(m) && /Isolde/.test(m) && /Solvak/.test(m));

      // idempotency: a second completion leaves BOTH 'active' and does not throw
      let threw = false;
      try { _uqfRunToCompletion(QuestRuntime.execBits(qsrc.onComplete, { questId: SRC, pushMsg: () => {} })); } catch (e) { threw = true; }
      out.idempotent = !threw && FORKS.every(dst => (S_story.quests || {})[dst] === 'active');

      // leaves terminate: neither fork points onward with its own unlock (no runaway / no cycle back)
      out.leavesTerminate = FORKS.every(dst => {
        const oc = QUEST_DB[dst].onComplete;
        return !(Array.isArray(oc) && oc.some(b => b && b.kind === 'unlock'));
      });
      return out;
    });
    expect(r.missing).toEqual([]);
    expect(r.srcHasOnCompleteArr).toBe(true);
    expect(r.singleUnlockBit).toBe(true);      // the fork is ONE unlock bit...
    expect(r.forkArity).toBe(2);               // ...carrying TWO targets (the branch primitive)
    expect(r.forkTargets).toEqual(['quest_wm_01', 'quest_vs_01']);
    for (const f of r.forks) {
      expect(f.beforeUnset, f.dst).toBe(true);        // target not pre-active on a fresh game
      expect(f.canActivate, f.dst).toBe(true);        // force-activating a legitimately-gated bounty
      expect(f.nodeExists, f.dst).toBe(true);         // ...at a real node (never a broken referral)
      expect(f.geoJumpFromSrc, f.dst).toBe(true);     // each lead is a genuine geography jump
    }
    expect(r.forksDistinct).toBe(true);        // the two leads diverge to DIFFERENT distant nodes
    expect(r.bothActive).toBe(true);           // one completion posted BOTH onward bounties
    expect(r.referralNamesBoth).toBe(true);    // a single referral line names both leads + the board
    expect(r.idempotent).toBe(true);           // re-completion is a safe no-op for both
    expect(r.leavesTerminate).toBe(true);      // the fork's leaves don't chain onward (no cycle)
  });

  // ── §BOARD-01-FU6 (convergence) — the network's FIRST CONFLUENCE ────────────────
  // The fork proved one→two; this proves two→one — the topology that makes the referral
  // network a true GRAPH (a node with in-degree 2). Two distant Birka cases — Pachelbel's
  // Sealed Scholar Box (@LLA) and Quill's Cipher Scrap (@MHQ) — both yield an unreadable
  // broker's mark, so both unlock the SAME target: Yva the Broker (quest_vs_02 @VS), the fence
  // who canonically "knows what the mark means". Each edge is a single-target unlock in the
  // source's onComplete; the idempotent handler (~21801) makes the two edges order-independent.
  test('§BOARD-01-FU6 (convergence) — two distant sources unlock ONE shared target; order-independent; no cycle', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const SRCS = ['quest_pachelbel_shipment', 'quest_couperin_lute'];
      const TARGET = 'quest_vs_02';
      const out = { missing: [] };
      for (const id of [...SRCS, TARGET]) if (!QUEST_DB[id]) out.missing.push(id);

      const unlockBitsOf = (q) => (q.onComplete || []).filter(b => b && b.kind === 'unlock');

      // each source carries exactly ONE unlock bit, whose single target is the shared node
      out.sources = SRCS.map(id => {
        const q = QUEST_DB[id];
        const ub = unlockBitsOf(q);
        return {
          id, node: q.activateNode,
          hasOnCompleteArr: Array.isArray(q.onComplete),
          oneUnlockBit: ub.length === 1,
          targetsShared: ub.length === 1 && ub[0].quests && ub[0].quests.length === 1 && ub[0].quests[0] === TARGET,
        };
      });
      // in-degree 2: BOTH sources point at the one target
      out.inDegreeTwo = SRCS.every(id => unlockBitsOf(QUEST_DB[id]).some(b => (b.quests || []).includes(TARGET)));
      // sources are genuinely distant from the target AND from each other (a real confluence, not a local trio)
      const tNode = QUEST_DB[TARGET].activateNode;
      out.targetNodeExists = !!NODE_MAP[tNode] && tNode !== 'TLL';
      out.geoDistinct = new Set([QUEST_DB[SRCS[0]].activateNode, QUEST_DB[SRCS[1]].activateNode, tNode]).size === 3;

      // §VM-01-G3 — the target now carries a REAL gate (vsDebtProbed), so on a fresh game it
      // does NOT canActivate: the convergence referral's force-unlock is the sanctioned
      // cross-arc introduction, and the board itself can no longer post the chapter early.
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      out.targetUnsetFresh = !(S_story.quests || {})[TARGET];
      out.targetCanActivate = QuestRuntime.canActivate(TARGET);

      // (1) EACH source independently posts the target on its own fresh game
      out.eachPostsAlone = SRCS.map(src => {
        storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
        const msgs = [];
        _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[src].onComplete, { questId: src, pushMsg: m => msgs.push(m) }));
        return {
          src,
          posted: (S_story.quests || {})[TARGET] === 'active',
          // the referral names the shared broker (Yva) + the board — both roads read as one destination
          referralNamesBrokerAndBoard: msgs.some(m => /Warrant's Board/.test(m) && /Yva/.test(m)),
        };
      });

      // (2) CONVERGENCE / order-independence: fire A then B on ONE game — B is a safe no-op,
      //     target stays 'active', nothing throws (the defining in-degree-2 safety property)
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      let threw = false;
      try {
        _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[SRCS[0]].onComplete, { questId: SRCS[0], pushMsg: () => {} }));
        const afterFirst = (S_story.quests || {})[TARGET];
        _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[SRCS[1]].onComplete, { questId: SRCS[1], pushMsg: () => {} }));
        const afterSecond = (S_story.quests || {})[TARGET];
        out.afterFirst = afterFirst; out.afterSecond = afterSecond;
      } catch (e) { threw = true; }
      out.convergeThrew = threw;

      // (3) reverse order gives the same result (truly commutative)
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[SRCS[1]].onComplete, { questId: SRCS[1], pushMsg: () => {} }));
      _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[SRCS[0]].onComplete, { questId: SRCS[0], pushMsg: () => {} }));
      out.reverseSameActive = (S_story.quests || {})[TARGET] === 'active';

      // through-node (FU6 through-flow): the merge target now CONTINUES — it carries exactly one
      // onward unlock to quest_vs_03 (so it is both a merge target AND a source: a general DAG node)
      const tgtUnlocks = unlockBitsOf(QUEST_DB[TARGET]);
      out.mergeContinues = tgtUnlocks.length === 1 && (tgtUnlocks[0].quests || []).length === 1 && tgtUnlocks[0].quests[0] === 'quest_vs_03';
      // no cycle: the onward leaf terminates and never points back at the confluence or its sources
      const leafUnlocks = unlockBitsOf(QUEST_DB['quest_vs_03']).flatMap(b => b.quests || []);
      out.acyclic = leafUnlocks.length === 0 && !leafUnlocks.includes(TARGET) && !SRCS.some(s => leafUnlocks.includes(s));
      return out;
    });
    expect(r.missing).toEqual([]);
    for (const s of r.sources) {
      expect(s.hasOnCompleteArr, s.id).toBe(true);
      expect(s.oneUnlockBit, s.id).toBe(true);          // each edge is a single-target unlock...
      expect(s.targetsShared, s.id).toBe(true);         // ...at the ONE shared confluence node
    }
    expect(r.inDegreeTwo).toBe(true);                   // the defining property: two edges into one target
    expect(r.targetNodeExists).toBe(true);
    expect(r.geoDistinct).toBe(true);                   // both sources + target are three distinct distant nodes
    expect(r.targetUnsetFresh).toBe(true);
    expect(r.targetCanActivate).toBe(false);  // §VM-01-G3 — the real gate holds fresh; unlock is the sanctioned bypass
    for (const e of r.eachPostsAlone) {
      expect(e.posted, e.src).toBe(true);               // each source ALONE posts the shared bounty
      expect(e.referralNamesBrokerAndBoard, e.src).toBe(true);
    }
    expect(r.afterFirst).toBe('active');                // first completion posts it
    expect(r.afterSecond).toBe('active');               // second completion is a safe no-op (stays active)
    expect(r.convergeThrew).toBe(false);                // ...and never throws
    expect(r.reverseSameActive).toBe(true);             // commutative: B-then-A ≡ A-then-B
    expect(r.mergeContinues).toBe(true);                // the confluence is a THROUGH-node (out-degree 1 → vs_03)
    expect(r.acyclic).toBe(true);                       // ...and the onward leaf terminates — no cycle back
  });

  // ── §BOARD-01-FU6 (through-flow) — a merge node that CONTINUES (the graph is a full DAG) ──────
  // The convergence made quest_vs_02 a merge (in-degree 2). This proves it is ALSO a source: the
  // full flow source → Yva → Mordus runs end-to-end. Referral flow passes THROUGH the confluence,
  // not just into a sink — the topological statement that the referral network is a general DAG.
  test('§BOARD-01-FU6 (through-flow) — source → merge → onward leaf runs end-to-end and terminates', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const SRC = 'quest_pachelbel_shipment';   // either convergence source works; use one
      const MERGE = 'quest_vs_02';               // in-degree 2 (convergence) AND out-degree 1 (here)
      const LEAF = 'quest_vs_03';
      const out = { missing: [] };
      for (const id of [SRC, MERGE, LEAF]) if (!QUEST_DB[id]) out.missing.push(id);

      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      out.leafUnsetFresh = !(S_story.quests || {})[LEAF];
      out.mergeCanActivate = QuestRuntime.canActivate(MERGE);
      out.leafCanActivate = QuestRuntime.canActivate(LEAF);

      // hop 1: completing the SOURCE posts the MERGE (convergence edge) — but NOT the leaf yet
      _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[SRC].onComplete, { questId: SRC, pushMsg: () => {} }));
      out.mergeActiveAfterSrc = (S_story.quests || {})[MERGE] === 'active';
      out.leafStillUnsetAfterSrc = !(S_story.quests || {})[LEAF];   // the onward hop waits for the merge to COMPLETE

      // hop 2: completing the MERGE posts the LEAF (the through/onward edge)
      const msgs = [];
      _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[MERGE].onComplete, { questId: MERGE, pushMsg: m => msgs.push(m) }));
      out.leafActiveAfterMerge = (S_story.quests || {})[LEAF] === 'active';
      out.onwardReferralLine = msgs.some(m => /Warrant's Board/.test(m) && /Mordus/.test(m));

      // idempotent + terminal
      _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[MERGE].onComplete, { questId: MERGE, pushMsg: () => {} }));
      out.leafStillActive = (S_story.quests || {})[LEAF] === 'active';
      out.leafHasNoUnlock = !(QUEST_DB[LEAF].onComplete || []).some(b => b && b.kind === 'unlock');
      out.geoJumpSrcToMerge = QUEST_DB[SRC].activateNode !== QUEST_DB[MERGE].activateNode;
      return out;
    });
    expect(r.missing).toEqual([]);
    expect(r.leafUnsetFresh).toBe(true);
    // §VM-01-G3 — merge (vs_02) and leaf (vs_03) now carry real gates (vsDebtProbed /
    // vsWeaponsFound), so neither canActivate on a fresh game: the unlock hops below are
    // the sanctioned in-sequence path, and the board can no longer post either chapter early.
    expect(r.mergeCanActivate).toBe(false);
    expect(r.leafCanActivate).toBe(false);
    expect(r.mergeActiveAfterSrc).toBe(true);      // convergence edge posts the merge
    expect(r.leafStillUnsetAfterSrc).toBe(true);   // ...but the onward hop waits for the merge to COMPLETE
    expect(r.leafActiveAfterMerge).toBe(true);     // the merge, once done, refers onward (through-node)
    expect(r.onwardReferralLine).toBe(true);       // a characterful onward line names Mordus + the board
    expect(r.leafStillActive).toBe(true);          // idempotent
    expect(r.leafHasNoUnlock).toBe(true);          // the onward leaf terminates — full DAG, no cycle
    expect(r.geoJumpSrcToMerge).toBe(true);        // the convergence hop still jumps geography (LLA → VS)
  });

  // ── §BOARD-01-FU6 (diamond) — the network's last missing shape: a GEO-SPANNING DIAMOND ──────
  // Line, onPass-chronicle, fork, convergence, and through-flow all existed; the untried shape was a
  // DIAMOND — a single source that SPLITS to two distant paths that then RECONVERGE on a shared
  // capstone (split-then-merge across four distinct nodes). It composes FU6's fork primitive (the
  // apex: one two-target unlock) with its convergence primitive (the base: two edges into one leaf).
  // Honest bridging (not a forced theme): the Warrant trades in CLOSED CROSSINGS — waters and roads a
  // predator has shut that officialdom explains away. The lake case (quest_hunt_01 @HFT: the Guild's
  // "spirit" vs the Elder Fisherwoman's drag marks) forks to two more of the same shape — the highland
  // loch's kelpie (sq_2 @KIR) and the relay road's denied hag (quest_hunt2_01 @WRO) — and both run down
  // to the harbor closed the same way and reopened (quest_df_01 @DNF, the terminal capstone; its own
  // hint canonically makes it the kelpie arm's aftermath). Drives the REAL onComplete chains through
  // the REAL execBits, exactly as storyCheckQuests (29440) fires a completed side quest's onComplete.
  test('§BOARD-01-FU6 (diamond) — one source splits to two distant paths that reconverge on a shared capstone', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const SRC = 'quest_hunt_01';                       // apex (the fork)
      const ARMS = ['sq_2', 'quest_hunt2_01'];           // the two divergent paths (@KIR, @WRO)
      const CAP = 'quest_df_01';                         // shared capstone (the merge, terminal @DNF)
      const out = { missing: [] };
      for (const id of [SRC, ...ARMS, CAP]) if (!QUEST_DB[id]) out.missing.push(id);

      const unlockBitsOf = (q) => (q.onComplete || []).filter(b => b && b.kind === 'unlock');

      // geo-spanning: four DISTINCT, real, distant nodes (source, two arms, capstone)
      const nodes = [SRC, ...ARMS, CAP].map(id => QUEST_DB[id].activateNode);
      out.fourDistinctNodes = new Set(nodes).size === 4;
      out.allNodesReal = nodes.every(n => !!NODE_MAP[n]);

      // ── apex: a SINGLE two-target unlock (the fork primitive) to the two arms ──
      const apexUnlocks = unlockBitsOf(QUEST_DB[SRC]);
      out.apexSingleBit = apexUnlocks.length === 1;
      out.apexTargets = apexUnlocks.length === 1 ? apexUnlocks[0].quests.slice().sort() : [];

      // ── base: EACH arm carries a single-target unlock to the SAME capstone (convergence) ──
      out.arms = ARMS.map(id => {
        const ub = unlockBitsOf(QUEST_DB[id]);
        return { id, node: QUEST_DB[id].activateNode, oneBit: ub.length === 1,
          toCapstone: ub.length === 1 && ub[0].quests.length === 1 && ub[0].quests[0] === CAP };
      });
      out.capInDegreeTwo = ARMS.every(id => unlockBitsOf(QUEST_DB[id]).some(b => (b.quests || []).includes(CAP)));
      out.capIsLeaf = unlockBitsOf(QUEST_DB[CAP]).length === 0;   // terminal — no onward unlock, no cycle

      // ── fresh-game legitimacy: every downstream bounty is in-sequence + not pre-started ──
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.gameDay = 0;
      out.freshLegit = [...ARMS, CAP].map(id => ({ id,
        unset: !(S_story.quests || {})[id], canActivate: QuestRuntime.canActivate(id) }));

      // ── the fork fires: completing the source posts BOTH arms; ONE line names both leads + board ──
      const forkMsgs = [];
      _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[SRC].onComplete, { questId: SRC, pushMsg: m => forkMsgs.push(m) }));
      out.bothArmsPosted = ARMS.every(id => (S_story.quests || {})[id] === 'active');
      out.capStillUnsetAfterFork = !(S_story.quests || {})[CAP];   // the base waits for an arm to COMPLETE
      out.forkNamesBothLeads = forkMsgs.some(m => /Warrant's Board/.test(m) && /kelpie/i.test(m) && /relay road/i.test(m));

      // ── LEFT path end-to-end (fresh): source → kelpie (sq_2) → harbor (capstone) ──
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[SRC].onComplete, { questId: SRC, pushMsg: () => {} }));
      const leftMsgs = [];
      _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB['sq_2'].onComplete, { questId: 'sq_2', pushMsg: m => leftMsgs.push(m) }));
      out.leftReachesCap = (S_story.quests || {})[CAP] === 'active';
      out.leftReferralLine = leftMsgs.some(m => /Warrant's Board/.test(m) && /Dunfall/.test(m));

      // ── RIGHT path end-to-end (fresh): source → road (hunt2_01) → harbor (capstone) ──
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[SRC].onComplete, { questId: SRC, pushMsg: () => {} }));
      const rightMsgs = [];
      _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB['quest_hunt2_01'].onComplete, { questId: 'quest_hunt2_01', pushMsg: m => rightMsgs.push(m) }));
      out.rightReachesCap = (S_story.quests || {})[CAP] === 'active';
      out.rightReferralLine = rightMsgs.some(m => /Warrant's Board/.test(m) && /Dunfall/.test(m));

      // ── the MERGE is order-independent: fire both arms on one game; the second is a safe no-op ──
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[SRC].onComplete, { questId: SRC, pushMsg: () => {} }));
      let threw = false;
      try {
        _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[ARMS[0]].onComplete, { questId: ARMS[0], pushMsg: () => {} }));
        const afterFirst = (S_story.quests || {})[CAP];
        _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[ARMS[1]].onComplete, { questId: ARMS[1], pushMsg: () => {} }));
        out.mergeAfterFirst = afterFirst;
        out.mergeAfterSecond = (S_story.quests || {})[CAP];
      } catch (e) { threw = true; }
      out.mergeThrew = threw;

      // reverse arm order → identical result (commutative merge, the in-degree-2 safety property)
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[SRC].onComplete, { questId: SRC, pushMsg: () => {} }));
      _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[ARMS[1]].onComplete, { questId: ARMS[1], pushMsg: () => {} }));
      _uqfRunToCompletion(QuestRuntime.execBits(QUEST_DB[ARMS[0]].onComplete, { questId: ARMS[0], pushMsg: () => {} }));
      out.reverseSameCap = (S_story.quests || {})[CAP] === 'active';
      return out;
    });
    expect(r.missing).toEqual([]);
    expect(r.fourDistinctNodes).toBe(true);       // geo-spanning: four distinct nodes (HFT/KIR/WRO/DNF)
    expect(r.allNodesReal).toBe(true);
    expect(r.apexSingleBit).toBe(true);           // the split is ONE two-target unlock (fork primitive)...
    expect(r.apexTargets).toEqual(['quest_hunt2_01', 'sq_2']);
    for (const a of r.arms) {
      expect(a.oneBit, a.id).toBe(true);           // ...and each arm is a single-target unlock...
      expect(a.toCapstone, a.id).toBe(true);       // ...to the ONE shared capstone (convergence)
    }
    expect(r.capInDegreeTwo).toBe(true);          // the base is a confluence (in-degree 2)
    expect(r.capIsLeaf).toBe(true);               // the capstone terminates — no cycle
    for (const f of r.freshLegit) {
      expect(f.unset, f.id).toBe(true);            // no downstream bounty pre-started on a fresh game
      expect(f.canActivate, f.id).toBe(true);      // ...each is a legitimate in-sequence unlock
    }
    expect(r.bothArmsPosted).toBe(true);          // one completion (the apex) posts BOTH arms
    expect(r.capStillUnsetAfterFork).toBe(true);  // ...the capstone waits for an arm to COMPLETE
    expect(r.forkNamesBothLeads).toBe(true);      // a single referral line names both leads + the board
    expect(r.leftReachesCap).toBe(true);          // left path source→kelpie→harbor runs end-to-end
    expect(r.leftReferralLine).toBe(true);
    expect(r.rightReachesCap).toBe(true);         // right path source→road→harbor runs end-to-end
    expect(r.rightReferralLine).toBe(true);
    expect(r.mergeAfterFirst).toBe('active');     // first arm posts the capstone
    expect(r.mergeAfterSecond).toBe('active');    // second arm is a safe no-op (stays active)
    expect(r.mergeThrew).toBe(false);             // ...and never throws
    expect(r.reverseSameCap).toBe(true);          // commutative merge — order-independent
  });

  // ── §BOARD-01-FU7 — Warrant standing (reputation): the board becomes progression ──
  // Completing a board-ACCEPTED bounty raises S_story.warrantStanding; tiers gate the
  // board's QUALITY (slate size + a reward-ceiling for premium jobs), never a step.
  // Design: lab-reports/lab-report-warrant-standing.md.
  test('§BOARD-01-FU7 — _creditWarrant accrues only on tagged bounties, is idempotent, announces on rank-up', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      const out = {};
      // untagged (organic) completion → no bump, no announcement
      S_story.warrantStanding = 0; S_story.warrantAccepted = {};
      out.untaggedLine = _creditWarrant('quest_not_from_board');
      out.untaggedStanding = S_story.warrantStanding;
      // tagged bounty → +1, tag flips to the 'credited' idempotency sentinel
      S_story.warrantAccepted = { quest_x: true };
      out.line1 = _creditWarrant('quest_x');        // 0→1: still 'Unknown' ⇒ no announcement
      out.afterFirst = S_story.warrantStanding;
      out.tagAfter = S_story.warrantAccepted.quest_x;
      // second call on the same id → safe no-op (must not double-credit)
      out.line2 = _creditWarrant('quest_x');
      out.afterSecond = S_story.warrantStanding;
      // crossing a tier boundary (2→3 = enters 'Marked') announces
      S_story.warrantStanding = 2; S_story.warrantAccepted = { quest_y: true };
      out.rankUpLine = _creditWarrant('quest_y');
      out.rankUpStanding = S_story.warrantStanding;
      return out;
    });
    expect(r.untaggedLine).toBe('');
    expect(r.untaggedStanding).toBe(0);            // organic discovery never counts
    expect(r.afterFirst).toBe(1);
    expect(r.tagAfter).toBe('credited');
    expect(r.line1).toBe('');                      // 0→1 stays within 'Unknown'
    expect(r.line2).toBe('');                      // idempotent
    expect(r.afterSecond).toBe(1);                 // ...standing unchanged on the re-run
    expect(r.rankUpStanding).toBe(3);
    expect(r.rankUpLine).toContain('Marked');      // a rank-up announces the new standing
    expect(r.rankUpLine).toContain('Warrant');
  });

  test('§BOARD-01-FU7 — _acceptBounty tags Warrant work; completing it at the REAL onPass site accrues standing', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      // A board-postable skill_check bounty (chronicle head): canActivate on a fresh game,
      // completes via _resolveQuestUQF (onPass) — the harder of the two credit sites.
      const id = 'quest_1367_a_najera';
      _acceptBounty(id);
      const tagged = S_story.warrantAccepted[id] === true;
      const standingBefore = S_story.warrantStanding;
      const q = QUEST_DB[id];
      const sc = q.bits.find(b => b.kind === 'skill_check');
      S_story.currentCode = q.activateNode;    // stand at the source node
      const savedDc = sc.dc; sc.dc = -100;     // force a deterministic PASS
      _rollCeremonia(id);                       // REAL resolve path → _resolveQuestUQF (onPass)
      sc.dc = savedDc;
      return {
        tagged, standingBefore,
        standingAfter: S_story.warrantStanding,
        tagAfter: S_story.warrantAccepted[id],
        questDone: S_story.quests[id] === 'done',
      };
    });
    expect(r.tagged).toBe(true);           // accept tagged it as Warrant work
    expect(r.standingBefore).toBe(0);
    expect(r.questDone).toBe(true);        // the pass completed it
    expect(r.standingAfter).toBe(1);       // ...and standing accrued at the onPass site (not just in a unit)
    expect(r.tagAfter).toBe('credited');   // idempotency sentinel set
  });

  test('§BOARD-01-FU7 — standing gates slate SIZE + a reward CEILING (premium jobs), never emptying a newcomer board', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.gameDay = 0;
      const inn = NODE_MAP.TLL;
      const tier0 = _warrantTier(0), tierMax = _warrantTier(999);
      // slate size grows with standing (no explicit limit ⇒ the tier drives it)
      S_story.warrantStanding = 0;   const n0 = _boardBounties(inn).length;
      S_story.warrantStanding = 7;   const n7 = _boardBounties(inn).length;
      S_story.warrantStanding = 20;  const n20 = _boardBounties(inn).length;
      // reward ceiling: inspect the CANDIDATE POOL (huge limit so the slice can't hide it)
      const maxXpAt = (standing) => {
        S_story.warrantStanding = standing;
        return _boardBounties(inn, 500).reduce((m, b) => Math.max(m, _boardRewardXp(QUEST_DB[b.id])), 0);
      };
      return {
        n0, n7, n20, slate0: tier0.slate, slateMax: tierMax.slate, cap0: tier0.rewardCap,
        tier0Name: tier0.name, tierMaxName: tierMax.name,
        maxXp0: maxXpAt(0), maxXpMax: maxXpAt(20),
      };
    });
    expect(r.tier0Name).toBe('Unknown');
    expect(r.tierMaxName).toBe("Warrant's Own");
    expect(r.n0).toBeGreaterThan(0);              // NON-EMPTY guard — a newcomer's board still has cards
    expect(r.n0).toBeLessThanOrEqual(r.slate0);   // ...capped at the tier-0 slate (4)
    expect(r.n7).toBeGreaterThanOrEqual(r.n0);    // monotone: the slate widens (or holds) as standing climbs
    expect(r.n20).toBeGreaterThanOrEqual(r.n7);
    expect(r.n20).toBe(r.slateMax);               // top rank shows the full 7-card slate
    expect(r.n20).toBeGreaterThan(r.n0);          // ...strictly wider than a newcomer's board
    expect(r.maxXp0).toBeLessThanOrEqual(r.cap0); // tier-0 pool carries NO premium bounty (ceiling holds)
    expect(r.maxXpMax).toBeGreaterThan(r.cap0);   // ...but the top rank surfaces the Warrant's premium work
  });

  test('§BOARD-01-FU7 — crediting standing never moves the player (gates quality, not a step)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.currentCode = 'TLL'; S_story.playerR = 5; S_story.playerC = 9;
      S_story.warrantAccepted = { quest_x: true };
      const before = { c: S_story.currentCode, r: S_story.playerR, col: S_story.playerC };
      _creditWarrant('quest_x');
      const after = { c: S_story.currentCode, r: S_story.playerR, col: S_story.playerC };
      return { before, after };
    });
    expect(r.after).toEqual(r.before);   // no move, no jump travel — standing gates listing only (§CELL-13)
  });

  // ── §BOARD-01-FU8 — Void-tide bounties: the board tied to the doom clock ──────────
  // Three clock-gated Warrant hunts (real UQF combat quests) surface as a pinned ⚠️ VOID
  // posting, one at a time, inside disjoint day windows (21→35→42). Threat (DC) and reward
  // (xp + Warrant standing) escalate with the tide. Design: lab-report-void-tide-bounties.md.
  const VOID_IDS = ['quest_void_tide_21', 'quest_void_tide_35', 'quest_void_tide_42'];

  test('§BOARD-01-FU8 — dormant before day 21; the pin appears and escalates in-window; bypasses slate + ceiling', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((VOID_IDS) => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      S_story.gameDay = 0;
      const inn = NODE_MAP.TLL;
      // §BOARD-01-VOID-GATE — canActivate now reads the gate:{dayMin,dayMax} window, so capture it
      // AT pin-time (while S_story.day is in-window); a later day would correctly close the gate.
      const pinAt = (day) => { S_story.day = day; const vf = _voidFeatured(inn); return vf && { ...vf, _canAct: QuestRuntime.canActivate(vf.id) }; };
      const all = VOID_IDS.map(id => !!QUEST_DB[id]);          // all three quests exist
      // day 1 (fresh): no Void tide is live — the pin is dormant, board is all normal BOUNTY cards
      S_story.day = 1;
      const dormant = _voidFeatured(inn);
      const cardsDay1 = _boardBounties(inn).map(b => ({ void: !!b.void }));
      // in-window pins, one per tide
      const p21 = pinAt(21), p35 = pinAt(35), p42 = pinAt(42);
      const info = (p) => p && {
        id: p.id, isVoid: p.void === true, standing: p.voidStanding,
        rewardStr: p.rewardStr, rewardXp: _boardRewardXp(QUEST_DB[p.id]),
        destOk: !!NODE_MAP[p.destCode] && p.destCode !== 'TLL',
        canActivate: p._canAct,
      };
      // ceiling bypass: at standing 0 (Unknown, cap 250) the day-42 pin (320xp) still shows
      S_story.warrantStanding = 0; S_story.day = 42;
      const board42 = _boardBounties(inn);   // no explicit limit ⇒ tier slate (4) + the pinned extra
      return {
        all, dormant, day1AnyVoid: cardsDay1.some(c => c.void),
        i21: info(p21), i35: info(p35), i42: info(p42),
        pinnedFirstIsVoid: board42[0] && board42[0].void === true,
        pinnedId42: board42[0] && board42[0].id,
      };
    }, VOID_IDS);
    expect(r.all).toEqual([true, true, true]);
    expect(r.dormant).toBeNull();                 // no pin before the first Void tide
    expect(r.day1AnyVoid).toBe(false);            // ...and no Void card on a fresh board
    // each tide pins its mapped quest, flagged void, at a real distant node, canActivate
    expect(r.i21.id).toBe('quest_void_tide_21'); expect(r.i21.isVoid).toBe(true); expect(r.i21.destOk).toBe(true); expect(r.i21.canActivate).toBe(true);
    expect(r.i35.id).toBe('quest_void_tide_35');
    expect(r.i42.id).toBe('quest_void_tide_42');
    // reward escalates (xp) and standing escalates with the clock
    expect(r.i21.rewardXp).toBe(150); expect(r.i35.rewardXp).toBe(220); expect(r.i42.rewardXp).toBe(320);
    expect(r.i21.standing).toBe(2);   expect(r.i35.standing).toBe(3);   expect(r.i42.standing).toBe(4);
    expect(r.i21.rewardStr).toContain('⭐');    // honest reward preview (never fake gold)
    // ceiling bypass: the premium day-42 hunt is pinned first even for an Unknown-standing player
    expect(r.pinnedFirstIsVoid).toBe(true);
    expect(r.pinnedId42).toBe('quest_void_tide_42');
  });

  test('§BOARD-01-FU8 — closing window / missable: each hunt is live only in its own window, and never rotates into the normal pool', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate((VOID_IDS) => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      const inn = NODE_MAP.TLL;
      // §BOARD-01-VOID-GATE — the day-window GATES are the single source of truth (they gate BOTH
      // arrival and the pin): QuestRuntime.canActivate reads gate:{dayMin,dayMax} against S_story.day
      const condAt = (day) => { S_story.day = day; return VOID_IDS.map(id => QuestRuntime.canActivate(id)); };
      const w20 = condAt(20), w21 = condAt(21), w34 = condAt(34), w35 = condAt(35), w41 = condAt(41), w42 = condAt(42), w49 = condAt(49);
      const pinIdAt = (day) => { S_story.day = day; const vf = _voidFeatured(inn); return vf && vf.id; };
      // at day 35 the day-21 hunt is gone: not pinned, and its own gate refuses it (arrival would too)
      const day35Pin = pinIdAt(35);
      S_story.day = 35;
      const q21GoneAt35 = !QuestRuntime.canActivate('quest_void_tide_21');
      // excluded from the normal rotation pool: past every window, a huge slate never lists a Void id as a NORMAL card
      S_story.day = 42; S_story.warrantStanding = 20;
      const wide = _boardBounties(inn, 500);
      const normalVoidLeak = wide.filter(b => !b.void).filter(b => VOID_IDS.includes(b.id));
      const voidCards = wide.filter(b => b.void).map(b => b.id);
      return { w20, w21, w34, w35, w41, w42, w49, day35Pin, q21GoneAt35, normalVoidLeakIds: normalVoidLeak.map(b => b.id), voidCards };
    }, VOID_IDS);
    // windows: [21,35) / [35,42) / [42,∞) — disjoint, continuous 21→49
    expect(r.w20).toEqual([false, false, false]);   // before the first tide: nothing
    expect(r.w21).toEqual([true, false, false]);
    expect(r.w34).toEqual([true, false, false]);
    expect(r.w35).toEqual([false, true, false]);     // handoff: 21 closes exactly as 35 opens
    expect(r.w41).toEqual([false, true, false]);
    expect(r.w42).toEqual([false, false, true]);     // handoff: 35 closes exactly as 42 opens
    expect(r.w49).toEqual([false, false, true]);
    expect(r.day35Pin).toBe('quest_void_tide_35');   // day 35 pins the current tide, not the missed one
    expect(r.q21GoneAt35).toBe(true);                // the day-21 hunt is truly missable
    expect(r.normalVoidLeakIds).toEqual([]);         // Void quests NEVER appear as a normal rotation card
    expect(r.voidCards).toEqual(['quest_void_tide_42']);  // ...only ever as the single pinned card
  });

  test('§BOARD-01-FU8 — completing a Void hunt accrues the ESCALATED standing at the real onPass site; selection stays pure', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      storyNewGame({ str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
      const inn = NODE_MAP.TLL;
      S_story.gameDay = 0; S_story.day = 42;
      // purity: a live-tide selection mutates no S_story field
      const before = JSON.stringify(S_story);
      _boardBounties(inn); _voidFeatured(inn);
      const pure = JSON.stringify(S_story) === before;
      // accept the pinned Void hunt from the board, then complete it at the REAL resolve path
      const pin = _boardBounties(inn)[0];             // the pinned day-42 hunt
      _acceptBounty(pin.id);
      const tagged = S_story.warrantAccepted[pin.id] === true;
      const standingBefore = S_story.warrantStanding;
      const q = QUEST_DB[pin.id];
      const sc = q.bits.find(b => b.kind === 'skill_check');
      // §DX-02f: stand on the quest node at the cell the ENGINE says that node occupies.
      // Hardcoding (5,9) here made currentCode and playerR/C disagree — a state no step can
      // produce — so storyRender's §CELL-03 sync (31618) "moved" the player by correcting the
      // coords, and this test read that as a warp. Pin the property, not a coordinate (§DX-02e).
      S_story.currentCode = q.activateNode;
      S_story.playerR = NODE_COORDS[q.activateNode].r;
      S_story.playerC = NODE_COORDS[q.activateNode].c;
      const posBefore = { c: S_story.currentCode, r: S_story.playerR, col: S_story.playerC };
      const savedDc = sc.dc; sc.dc = -100;            // force a deterministic PASS
      _rollCeremonia(pin.id);                          // REAL resolve → _resolveQuestUQF (onPass) → _creditWarrant
      sc.dc = savedDc;
      const posAfter = { c: S_story.currentCode, r: S_story.playerR, col: S_story.playerC };
      // idempotency: a second credit must not double-apply
      const standingAfterOne = S_story.warrantStanding;
      _creditWarrant(pin.id);
      return {
        pure, pinId: pin.id, pinIsVoid: pin.void === true, tagged, standingBefore,
        standingAfterOne, standingAfterTwice: S_story.warrantStanding,
        tagAfter: S_story.warrantAccepted[pin.id], questDone: S_story.quests[pin.id] === 'done',
        posBefore, posAfter,
      };
    });
    expect(r.pure).toBe(true);                     // pure selection even with a live tide + pin
    expect(r.pinId).toBe('quest_void_tide_42');
    expect(r.pinIsVoid).toBe(true);
    expect(r.tagged).toBe(true);                   // accept tagged it as Warrant work
    expect(r.standingBefore).toBe(0);
    expect(r.questDone).toBe(true);                // the forced pass completed it
    expect(r.standingAfterOne).toBe(4);            // ESCALATED bonus (+4 for the day-42 hunt), not the flat +1
    expect(r.tagAfter).toBe('credited');
    expect(r.standingAfterTwice).toBe(4);          // idempotent — no double-credit
    expect(r.posAfter).toEqual(r.posBefore);       // completing/crediting never moves the player
  });

  // ── §BOARD-01 Inc C — authored rumors on the referral-network anchors ────────
  // The FU6 topology quests (diamond / convergence+through-flow / fork / the three
  // referral lines) are the board's signature multi-step jobs, so each carries a
  // bespoke Crimson-Warrant q.rumor rather than the FU5 terrain-synthesized fallback.
  // This guards against accidental loss (a serializer bug, a bad PUT) WITHOUT pinning
  // exact wording: it asserts each anchor still has a non-empty authored rumor and that
  // the render path (_boardRumorLine) prefers it verbatim over the synthesized line.
  test('§BOARD-01 Inc C — referral-network anchors carry authored rumors the board surfaces verbatim', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const ANCHORS = [
        'quest_hunt_01', 'sq_2', 'quest_hunt2_01', 'quest_df_01',                          // diamond (closed crossings)
        'quest_pachelbel_shipment', 'quest_couperin_lute', 'quest_vs_02', 'quest_vs_03',   // convergence + through-flow
        'quest_brynn_ledger', 'quest_wm_01', 'quest_vs_01',                                // fork (Brynn's ledger)
        'quest_math_01', 'quest_math_02', 'quest_math_03', 'quest_math_04', 'quest_math_05', // Mathematician's Road
        'quest_tl_01', 'quest_tl_02', 'quest_tl_03',                                       // Rennau's Harrow
        'quest_1367_a_najera', 'quest_1367_e_wycliffe', 'quest_1367_f_plague',
        'quest_1367_d_hansa', 'quest_1367_c_ottoman', 'quest_1367_b_tamerlane',            // the 1367 chronicle
      ];
      return ANCHORS.map(id => {
        const q = QUEST_DB[id];
        const rumor = q && q.rumor;
        const authored = typeof rumor === 'string' && rumor.trim().length > 0;
        // render path prefers the authored hook verbatim (never the flat/synth fallback)
        const line = _boardRumorLine({ rumor, destTerrain: 'Nowhere', destShort: 'Nowhere', _k: 0 });
        return {
          id,
          exists: !!q,
          authored,
          verbatim: authored && line === rumor,
          noVoidMark: authored && rumor.indexOf('⚠') === -1,   // ⚠ is reserved for FU8 Void-tide pins
        };
      });
    });
    expect(r.length).toBe(25);
    for (const row of r) {
      expect(row.exists).toBe(true);      // the anchor quest still exists
      expect(row.authored).toBe(true);    // …and still carries a bespoke hook (not lost to a serializer/PUT bug)
      expect(row.verbatim).toBe(true);    // _boardRumorLine surfaces the authored rumor verbatim over the synth line
      expect(row.noVoidMark).toBe(true);  // ordinary bounties never wear the Void ⚠ label (that is FU8-only)
    }
  });
});
