// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §VM-01-G-FU-f2 — the TLS final-battle framing moves from three hand-copied engine
// predicates to ONE node field read by ONE helper.
//
// The census (§VM-01-G-FU-f, lab-report §11) measured the predicate
//   `(node|waypointNode) === 'TLS' && (S_story.level||1) >= 20 && (S_story.shards||0) >= 7`
// hand-copied at THREE sites — the encounter card and BOTH quest-list Fight buttons —
// three copies of one rule that must never disagree. The user's design call (2026-08-06):
// a node field, the §VM-01-G3 `onActivate` precedent (per-node data driving an engine
// seam, not grammar growth). TLS now authors `finalBattle:{minLevel:20,minShards:7}`
// and all three sites read `_finalBattleReady(code)`.
//
// The other two f2 asks were answered STAY (INN pricing until a second inn wants it;
// patrol ordered-visit — the §5 rule says don't grow a grammar shape for one site).
//
// Red-on-HEAD: the source/data/helper tests (1–3). Green BOTH ways: the behaviour
// tests (4–5) — the framing is byte-identical to the hand-copied original, so a
// behaviour test that only passed after the change would disprove the no-op.
'use strict';
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

const GAME = path.join(__dirname, '..', '..', 'play.html');

test.describe('§VM-01-G-FU-f2 — finalBattle node field', () => {

  test('source: the hand-copied TLS predicate is gone — one helper, three call sites', () => {
    const src = fs.readFileSync(GAME, 'utf8');
    // the old triplicated rule must not survive anywhere
    const handCopied = src.match(/===\s*'TLS'\s*&&\s*\(S_story\.level\|\|1\)\s*>=\s*20/g) || [];
    expect(handCopied, 'no hand-copied TLS threshold predicate remains').toHaveLength(0);
    // exactly one definition…
    const defs = src.match(/function _finalBattleReady\(/g) || [];
    expect(defs, 'the helper is defined exactly once').toHaveLength(1);
    // …read at the three former sites (definition + ≥3 calls)
    const refs = src.match(/_finalBattleReady\(/g) || [];
    expect(refs.length, 'definition + the three former sites').toBeGreaterThanOrEqual(4);
  });

  test('data: TLS authors finalBattle{minLevel:20,minShards:7}; every author\'s shape is numeric', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const authors = Object.keys(NODE_MAP).filter(c => NODE_MAP[c].finalBattle);
      return {
        authors,
        tls: NODE_MAP.TLS.finalBattle || null,
        shapesOk: authors.every(c =>
          typeof NODE_MAP[c].finalBattle.minLevel === 'number'
          && typeof NODE_MAP[c].finalBattle.minShards === 'number'),
      };
    });
    expect(r.authors, 'TLS is an author').toContain('TLS');
    expect(r.tls, 'the thresholds the three sites used to hand-copy').toEqual({ minLevel: 20, minShards: 7 });
    expect(r.shapesOk, 'every finalBattle author carries numeric minLevel/minShards').toBe(true);
  });

  test('helper: thresholds are AND-ed; a node without the field is always false', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const at = (level, shards, code) => {
        S_story.level = level; S_story.shards = shards;
        return _finalBattleReady(code);
      };
      return {
        below_level: at(19, 7, 'TLS'),
        below_shards: at(20, 6, 'TLS'),
        at_thresholds: at(20, 7, 'TLS'),
        above: at(25, 9, 'TLS'),
        non_author: at(25, 9, 'LHR'),
        unknown_code: at(25, 9, 'NOPE'),
        no_code: at(25, 9, undefined),
      };
    });
    expect(r.below_level, 'level 19 / shards 7 → not final').toBe(false);
    expect(r.below_shards, 'level 20 / shards 6 → not final').toBe(false);
    expect(r.at_thresholds, 'level 20 / shards 7 → final').toBe(true);
    expect(r.above, 'above both thresholds → final').toBe(true);
    expect(r.non_author, 'a live node without the field is never final').toBe(false);
    expect(r.unknown_code, 'an unknown code is never final').toBe(false);
    expect(r.no_code, 'no code is never final').toBe(false);
  });

  test('behaviour (green both ways): below thresholds the TLS encounter card is the plain Fight', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await seedAndLoad(page, {
      currentCode: 'TLS', checkpointNode: 'TLS', visited: { TLS: true },
      level: 20, shards: 6, hp: 200, hpMax: 200,
    });
    await dismissContinue(page);
    const card = await page.evaluate(() => {
      const sec = Array.from(document.querySelectorAll('#story-info-row .story-section'))
        .find(s => (s.querySelector('.story-section-hd') || {}).textContent === '⚔ Encounter');
      if (!sec) return null;
      const c = sec.querySelector('.story-section-card');
      return {
        main: (c.querySelector('.story-card-main') || {}).textContent || '',
        btn: (c.querySelector('.story-card-btn') || {}).textContent || null,
      };
    });
    expect(card, 'the encounter section renders at TLS').not.toBeNull();
    expect(card.main, 'one shard short → the ordinary battle label').toBe('Void Walker ×7 → Void Warlord');
    expect(card.btn, 'one shard short → the ordinary Fight button').toBe('Fight');
    expect(pageErrors).toEqual([]);
  });

  test('behaviour (green both ways): at 20/7 the card and the quest-list button both frame the final battle', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await seedAndLoad(page, {
      currentCode: 'TLS', checkpointNode: 'TLS', visited: { TLS: true },
      level: 20, shards: 7, hp: 200, hpMax: 200,
      quests: { mq_7: 'active' },   // waypointNode:'TLS' — the quest-list Fight-button site
    });
    await dismissContinue(page);
    const r = await page.evaluate(() => {
      const secs = Array.from(document.querySelectorAll('#story-info-row .story-section'));
      const enc = secs.find(s => (s.querySelector('.story-section-hd') || {}).textContent === '⚔ Encounter');
      const encCard = enc && enc.querySelector('.story-section-card');
      const questCard = Array.from(document.querySelectorAll('#story-info-row .story-section-card'))
        .find(c => ((c.querySelector('.story-card-main') || {}).textContent || '').includes('The Reckoning'));
      return {
        encMain: encCard ? (encCard.querySelector('.story-card-main') || {}).textContent : null,
        encBtn: encCard ? ((encCard.querySelector('.story-card-btn') || {}).textContent || null) : null,
        questBtn: questCard ? ((questCard.querySelector('.story-card-btn') || {}).textContent || null) : null,
      };
    });
    expect(r.encMain, 'the encounter card renames itself').toBe('⚔ THE FINAL BATTLE — Commander Bruhns');
    expect(r.encBtn, 'the encounter button becomes the final fight').toBe('🔥 FINAL FIGHT');
    expect(r.questBtn, "mq_7's Fight-Now button becomes the final fight").toBe('🔥 Final Fight');
    expect(pageErrors).toEqual([]);
  });
});
