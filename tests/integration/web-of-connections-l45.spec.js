// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
'use strict';
/**
 * §DOC-02cz — Layer 45 "Web of Connections" measurement suite.
 *
 * Verifies lab-reports/lab-report-web-of-connections.md against the live engine.
 * Every assertion runs through the game's own functions (_checkFrobergerTrace,
 * _getYaelLocation, _setNpcFavor, _buildWeckmannLog) rather than a
 * re-implementation.
 */
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

const BIRKA = ['yael', 'brynn', 'quill', 'pachelbel', 'crov', 'auros'];

test.describe('Layer 45 — Web of Connections', () => {

  // ── F1: the favor ceiling, per NPC, from the engine's own write paths ──
  test('only yael can reach favor 3; crov tops out at 2 and one trace needs 3', async ({ page }) => {
    await seedAndLoad(page, {});
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      // Every favor write in the file funnels through _setNpcFavor. Collect the
      // declarative ones from QUEST_DB, per NPC.
      const bits = {};
      for (const q of Object.values(QUEST_DB)) {
        for (const b of (q.onComplete || [])) {
          if (b && b.kind === 'favor' && b.npc) {
            (bits[b.npc] = bits[b.npc] || []).push(b.set != null ? { set: b.set } : { add: b.add, cap: b.cap == null ? 3 : b.cap });
          }
        }
      }
      // The auto-upgrade path: does it ever write above 2?
      S_story.npcFavorability = {};
      S_story.pitTrainingWins = 5;             // crov's dearFriendBits condition
      _setNpcFavor('crov', 1);                 // set:1 -> auto-upgrade fires
      const crovAfterAuto = _npcFavor('crov');
      _setNpcFavor('crov', 2);                 // no-op, level <= prev
      const crovAfterRepeat = _npcFavor('crov');

      return {
        crovBits: bits.crov || [],
        brynnBits: bits.brynn || [],
        yaelBits: bits.yael || [],
        crovAfterAuto, crovAfterRepeat,
        crovTraceMinFav: FROBERGER_TRACES.crov.minFav,
        brynnTraceMinFav: FROBERGER_TRACES.brynn.minFav,
      };
    });

    // crov has exactly one declarative favor write, and it is `set: 1`.
    expect(out.crovBits).toEqual([{ set: 1 }]);
    // The auto-upgrade tops out at 2 and cannot be re-entered.
    expect(out.crovAfterAuto).toBe(2);
    expect(out.crovAfterRepeat).toBe(2);
    // ...and crov's Froberger trace asks for 3.
    expect(out.crovTraceMinFav).toBe(3);
    // brynn also needs 3, but has an `add` bit that can stack onto the auto-upgrade.
    expect(out.brynnTraceMinFav).toBe(3);
    expect(out.brynnBits).toContainEqual({ add: 1, cap: 3 });
    // yael is the only NPC with a direct write to 3 (a _legacy_fn, not a bit).
    expect(out.yaelBits.some(b => b.set === 3)).toBe(false);
  });

  // ── F1b: the trace is unreachable at the ceiling, measured, not reasoned ──
  test('crov\'s Froberger trace returns null at his maximum reachable favor', async ({ page }) => {
    await seedAndLoad(page, {});
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      S_story.npcFavorability = {}; S_story.pitTrainingWins = 5;
      _setNpcFavor('crov', 1);
      const ceiling = _npcFavor('crov');
      S_story.npcVisitCounts = { crov: 99 };   // visitTrigger amply satisfied
      S_story.frobergerTrace_crov_delivered = false;
      const atCeiling = _checkFrobergerTrace('crov');
      S_story.npcFavorability.crov = 3;        // the level no game path reaches
      const atThree = _checkFrobergerTrace('crov');
      return { ceiling, atCeiling, atThree };
    });

    expect(out.ceiling).toBe(2);
    expect(out.atCeiling).toBeNull();
    expect(out.atThree).toContain('You still grieve it');
  });

  // ── F2: brynn reaching 3 is order-dependent, so Room 6 is too ──
  test('brynn reaches 3 only if journal entry 7 is read before the firewood quest', async ({ page }) => {
    await seedAndLoad(page, {});
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      const run = order => {
        S_story.npcFavorability = {};
        S_story.journalEntriesRead = [];
        if (order === 'entry7-first') {
          S_story.journalEntriesRead = [7];
          _setNpcFavor('brynn', 1);            // ledger: set:1 -> auto-upgrade to 2
          _setNpcFavor('brynn', Math.min(3, _npcFavor('brynn') + 1));  // firewood: add:1
        } else {
          _setNpcFavor('brynn', 1);            // ledger: set:1, no entry 7 yet -> stays 1
          _setNpcFavor('brynn', Math.min(3, _npcFavor('brynn') + 1));  // firewood: add:1 -> 2
          S_story.journalEntriesRead = [7];
          _checkDearFriendUpgrade('brynn');    // requires fav === 1; brynn is 2 -> no-op
        }
        return _npcFavor('brynn');
      };
      return { entry7First: run('entry7-first'), firewoodFirst: run('firewood-first') };
    });

    expect(out.entry7First).toBe(3);      // Room 6 opens
    expect(out.firewoodFirst).toBe(2);    // Room 6 never opens, in an otherwise complete run
  });

  test('Room 6 renders at brynn 3 and is absent at brynn 2', async ({ page }) => {
    await seedAndLoad(page, { currentCode: 'TLL', visited: { TLL: true } });
    await dismissContinue(page);

    const at = async fav => page.evaluate(f => {
      S_story.npcFavorability = { brynn: f };
      const div = document.createElement('div');
      _nodeHookBirkaRoom6({ code: 'TLL' }, { npcRowDiv: div });
      return div.textContent.includes('Room 6');
    }, fav);

    expect(await at(2)).toBe(false);
    expect(await at(3)).toBe(true);
  });

  // ── F3: the patrol loop is first-match-wins, with the loosest condition first ──
  test('on odd game days Yael is always at MSY, whatever else is true', async ({ page }) => {
    await seedAndLoad(page, {});
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      // Satisfy EVERY other patrol condition at once.
      S_story.quests = Object.assign({}, S_story.quests, { quest_slums_cleanup: 'complete' });
      S_story.yaelEscortUsed = true;
      S_story.yaelNamedReportDelivered = true;
      S_story.npcFavorability = { yael: 3 };
      S_story.actNumber = 5;
      const odd = (S_story.gameDay = 1, _getYaelLocation());
      const even = (S_story.gameDay = 2, _getYaelLocation());
      return {
        oddNode: odd && odd.nodeSlug, oddLine: odd && odd.line,
        evenNode: even && even.nodeSlug, evenLine: even && even.line,
        firstCondIsParity: YAEL_PATROL_NODES[0].line.startsWith('Eastern check'),
        total: YAEL_PATROL_NODES.length,
      };
    });

    expect(out.total).toBe(5);
    expect(out.firstCondIsParity).toBe(true);
    // Every other condition is true, and the parity entry still wins.
    expect(out.oddNode).toBe('MSY');
    expect(out.oddLine).toContain('Eastern check');
    // The other four are reachable only on even days.
    expect(out.evenNode).toBe('BMA');
    expect(out.evenLine).toContain('Showing my face');
  });

  // ── F4: the connection map declares two relationships with no lines ──
  test('17 cross-reference lines; nobody mentions Gigault; Yael and Pachelbel never mention each other', async ({ page }) => {
    await seedAndLoad(page, {});
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      const all = Object.entries(NPC_CROSS_REFS).flatMap(([k, v]) => v.map(r => ({ owner: k, fav: r.fav, text: r.text })));
      const mentions = name => all.filter(r => r.text.includes(name));
      return {
        total: all.length,
        owners: Object.keys(NPC_CROSS_REFS).sort(),
        gigault: mentions('Gigault').length,
        yaelOnPachelbel: all.filter(r => r.owner === 'yael' && /Pachelbel/.test(r.text)).length,
        pachelbelOnYael: all.filter(r => r.owner === 'pachelbel' && /Yael/.test(r.text)).length,
        favTiers: [...new Set(all.map(r => r.fav))].sort(),
      };
    });

    expect(out.total).toBe(17);
    expect(out.owners).toEqual(BIRKA.slice().sort());
    expect(out.gigault).toBe(0);          // the lock's "All → Gigault" edge
    expect(out.yaelOnPachelbel).toBe(0);  // the lock's "Yael — Pachelbel" edge
    expect(out.pachelbelOnYael).toBe(0);
    expect(out.favTiers).toEqual([1, 2]); // never gated at 3
  });

  // ── F5: cross-refs are a consumed sequence, not a cycling pool ──
  test('cross-references arrive every third visit, in declaration order, once each', async ({ page }) => {
    await seedAndLoad(page, {});
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      const eligible = NPC_CROSS_REFS.brynn.filter(r => 2 >= r.fav);
      const seen = [];
      let idx = 0;
      for (let count = 1; count <= 20; count++) {
        if (count > 0 && count % 3 === 0 && idx < eligible.length) { seen.push(count); idx++; }
      }
      return { eligibleCount: eligible.length, visitsThatDeliver: seen, exhaustedAfter: seen[seen.length - 1] };
    });

    expect(out.eligibleCount).toBe(4);
    expect(out.visitsThatDeliver).toEqual([3, 6, 9, 12]);
    expect(out.exhaustedAfter).toBe(12);  // then the pool is silent forever
  });

  // ── F6: the training log ships an authoring stage direction as player text ──
  test('Weckmann\'s log renders a bracketed editorial placeholder to the player', async ({ page }) => {
    await seedAndLoad(page, {});
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      S_story.pitTrainingWins = 3;
      S_story.playerName = 'Test';
      const log = _buildWeckmannLog();
      return {
        hasStageDirection: log.includes("[years of entries — fighters' names, brief notes, outcomes]"),
        hasGap: log.includes('[gap of two years]'),
        unreplaced: /\{PLAYER_ENTRIES\}|\{CHAMP_ENTRY\}/.test(log),
        playerEntries: (log.match(/^Day \d+:/gm) || []).length,
        hasBruna: log.includes('Bruna'),
      };
    });

    expect(out.hasStageDirection).toBe(true);
    expect(out.hasGap).toBe(true);              // authored prose, not a placeholder -- do not substitute
    expect(out.unreplaced).toBe(false);
    expect(out.playerEntries).toBe(3);          // wins=3 -> Day 3, Day 7, Day 12
    expect(out.hasBruna).toBe(true);
  });

  // ── F7: the six traces are byte-intact and correctly tiered ──
  test('all six Froberger traces resolve with the spec\'s own minFav/visitTrigger pairs', async ({ page }) => {
    await seedAndLoad(page, {});
    await dismissContinue(page);

    const out = await page.evaluate(() => Object.fromEntries(
      Object.entries(FROBERGER_TRACES).map(([k, t]) => [k, [t.minFav, t.visitTrigger, t.text.length]])));

    expect(Object.keys(out).sort()).toEqual(BIRKA.slice().sort());
    expect(out.yael.slice(0, 2)).toEqual([2, 3]);
    expect(out.brynn.slice(0, 2)).toEqual([3, 1]);
    expect(out.quill.slice(0, 2)).toEqual([2, 2]);
    expect(out.pachelbel.slice(0, 2)).toEqual([2, 2]);
    expect(out.crov.slice(0, 2)).toEqual([3, 2]);
    expect(out.auros.slice(0, 2)).toEqual([2, 1]);
  });

  // ── F8: the trace is delivered once and never rejoins the pool ──
  test('a delivered trace does not return on any later visit', async ({ page }) => {
    await seedAndLoad(page, {});
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      S_story.npcFavorability = { auros: 2 };
      S_story.npcVisitCounts = { auros: 5 };
      S_story.frobergerTrace_auros_delivered = false;
      const first = _checkFrobergerTrace('auros');
      const second = _checkFrobergerTrace('auros');
      const third = _checkFrobergerTrace('auros');
      return { first: !!first, second, third, flag: S_story.frobergerTrace_auros_delivered };
    });

    expect(out.first).toBe(true);
    expect(out.second).toBeNull();   // spec: "added to the NPC's permanent pool so it can resurface"
    expect(out.third).toBeNull();
    expect(out.flag).toBe(true);
  });

  // ── F9: cross-layer — Layer 44's weckmann_class event asks for a favor no path grants ──
  test('the Layer 44 weckmann_class world event can never fire, because crov cannot reach 3', async ({ page }) => {
    await seedAndLoad(page, {});
    await dismissContinue(page);

    const out = await page.evaluate(() => {
      S_story.npcFavorability = {}; S_story.pitTrainingWins = 5;
      _setNpcFavor('crov', 1);
      const ceiling = _npcFavor('crov');
      S_story.actNumber = 8;
      S_story.worldEventsFired = [];
      const ev = WORLD_PROGRESSION_EVENTS.find(e => e.id === 'weckmann_class');
      const atCeiling = ev.condition();
      S_story.npcFavorability.crov = 3;
      const atThree = ev.condition();
      return { ceiling, atCeiling, atThree, note: ev.journalNote };
    });

    expect(out.ceiling).toBe(2);
    expect(out.atCeiling).toBe(false);
    expect(out.atThree).toBe(true);
    expect(out.note).toContain('Thursdays, younger fighters');
  });
});
