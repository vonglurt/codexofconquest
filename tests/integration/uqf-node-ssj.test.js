// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §VM-01-G-FU-f — the SSJ tournament (Yugurt Cabin, §XLV): the census's ONE Class-E bespoke
// UI — an accordion state machine over NPC_TOUR_OPPONENTS rendered as a _mkSection into
// #story-info-row between the Rest and World sections — moved to NODE_HOOKS verbatim (G2's
// method; line-multiset 124/124, zero unmatched). The ctx is the three storyRender section
// surfaces the block already used, destructured under their own names so the body is
// byte-verbatim: { row, _mkSection, _mkCard }.
//
// This is the family's THIRD zero-delta no-op (after G-FU-b hunt and G-FU-c alch): the
// 16-combo golden is 16/16 byte-identical incl. 7 click combos, and all 16 §7½ story-column
// PNGs are byte-identical. So every behaviour test here passes BOTH ways by design — only the
// registry/source tests fail at HEAD (the G-FU-b rule: a no-op's behaviour tests must not
// depend on the change, or the no-op claim is false).
//
// Left as measured (not this slice's to change): _tourRoll draws Math.random(), not the seeded
// stream — a §DX-02m site (unseeded RNG into persisted state: gold, yugurtTourBeat).
'use strict';
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { SEED_STATE, dismissContinue } = require('./helpers');

const HTML = fs.readFileSync(path.join(__dirname, '..', '..', 'roll2hit-v3.html'), 'utf8');

const ROD = { name: 'Fishing Rod', icon: '🎣', type: 'weapon', atkBonus: 1, dmgDie: 4, dmgCount: 1, dmgFlat: 0, sell: 10, desc: 'Standard rod.' };

async function at(page, overrides = {}) {
  const state = Object.assign({}, SEED_STATE, {
    currentCode: 'SSJ', checkpointNode: 'SSJ', visited: { SSJ: true }, visitedCells: {},
    rngState: 424242, inventory: [ROD], quests: {},
  }, overrides);
  await page.addInitScript(s => {
    localStorage.clear();
    localStorage.setItem('r2h_autosave', JSON.stringify(s));
  }, state);
  // Stub armed on demand (NOT at load — load-time randomness must stay real so the arrival
  // render is the game's own): __armRand() replaces Math.random with a cycling fixed sequence.
  await page.addInitScript(() => {
    window.__armRand = seq => { let i = 0; Math.random = () => seq[(i++) % seq.length]; };
  });
  await page.goto('/roll2hit-v3.html');
  await dismissContinue(page);
}

const tourSection = page => page.evaluate(() => {
  const secs = Array.from(document.querySelectorAll('#story-info-row .story-section'));
  const idx = secs.findIndex(s => (s.querySelector('.story-section-hd') || {}).textContent === '🏆 Tournament');
  if (idx === -1) return null;
  const sec = secs[idx];
  return {
    idx,
    heads: secs.map(s => (s.querySelector('.story-section-hd') || {}).textContent),
    cards: Array.from(sec.querySelectorAll('.story-section-card')).map(c => ({
      main: (c.querySelector('.story-card-main') || {}).textContent || '',
      hint: (c.querySelector('.story-card-hint') || {}).textContent || '',
      done: c.classList.contains('story-card-done'),
      btn: (c.querySelector('.story-card-btn') || {}).textContent || null,
    })),
    badge: (Array.from(sec.querySelectorAll('div')).find(d => d.children.length === 0 && d.textContent.startsWith('🏆 Your title:')) || {}).textContent || null,
    accordion: sec.querySelector('.npc-talk-accordion') ? {
      quote: (sec.querySelector('.npc-talk-quote') || {}).textContent || '',
      castBtn: (Array.from(sec.querySelectorAll('button')).find(b => b.textContent.includes('Cast') || b.textContent.includes('Need')) || {}).textContent || null,
      castDisabled: (Array.from(sec.querySelectorAll('button')).find(b => b.textContent.includes('Cast') || b.textContent.includes('Need')) || {}).disabled || false,
      text: sec.querySelector('.npc-talk-accordion').textContent,
    } : null,
  };
});

const clickChallenge = (page, opp) => page.evaluate(o => {
  const sec = Array.from(document.querySelectorAll('#story-info-row .story-section'))
    .find(s => (s.querySelector('.story-section-hd') || {}).textContent === '🏆 Tournament');
  const card = Array.from(sec.querySelectorAll('.story-section-card'))
    .find(c => (c.querySelector('.story-card-main') || {}).textContent.includes(o));
  card.querySelector('.story-card-btn').click();
}, opp);

const clickCast = page => page.evaluate(() => {
  const sec = Array.from(document.querySelectorAll('#story-info-row .story-section'))
    .find(s => (s.querySelector('.story-section-hd') || {}).textContent === '🏆 Tournament');
  Array.from(sec.querySelectorAll('button')).find(b => b.textContent.includes('Cast')).click();
});

// ── Registry + source shape (these fail at HEAD) ────────────────────────────────────────────

test.describe('§VM-01-G-FU-f — registry + source shape', () => {
  test('ssj-tournament sits in the registry after the §LXX run with a callable fn', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const idx = NODE_HOOKS.findIndex(h => h.id === 'ssj-tournament');
      const prev = idx > 0 ? NODE_HOOKS[idx - 1].id : null;
      const h = idx === -1 ? null : NODE_HOOKS[idx];
      return {
        found: idx !== -1,
        prev,
        nodes: h ? (h.nodes || []).join(',') : null,
        fnIsFunction: h ? typeof h.fn === 'function' : false,
        anchor: h ? h.anchor : 'missing',
      };
    });
    expect(r.found).toBe(true);
    expect(r.prev, 'ordered by former source position: the SSJ block sat below the §LXX stack').toBe('lxx-dsj-eels');
    expect(r.nodes).toBe('SSJ');
    expect(r.fnIsFunction).toBe(true);
    expect(r.anchor).toBe(undefined);
  });

  test('storyRender dispatches in place with the three section surfaces as ctx', async ({ page }) => {
    // Source-shape assertion: the dispatch call carries { row, _mkSection, _mkCard } — the
    // storyRender-local DOM builders the verbatim body already names — and the hook fn is
    // defined exactly once at module level.
    const dispatches = HTML.match(/_runNodeHook\('ssj-tournament', node, \{ row, _mkSection, _mkCard \}\);/g) || [];
    const defs = HTML.match(/function _nodeHookSsjTournament\(node, \{ row, _mkSection, _mkCard \}\) \{/g) || [];
    expect(dispatches.length, 'exactly one in-place dispatch').toBe(1);
    expect(defs.length, 'exactly one module-level hook fn').toBe(1);
  });

  test('the inline block left storyRender: the accordion machine lives only in the hook fn', async ({ page }) => {
    // NPC_TOUR_OPPONENTS.forEach is the block's spine; after the move it must appear exactly
    // once in the file, inside _nodeHookSsjTournament (on HEAD it sits inline in storyRender).
    const spine = HTML.match(/NPC_TOUR_OPPONENTS\.forEach/g) || [];
    expect(spine.length).toBe(1);
    const fnStart = HTML.indexOf('function _nodeHookSsjTournament');
    const fnEnd = HTML.indexOf('const NODE_HOOKS = [');
    const spineAt = HTML.indexOf('NPC_TOUR_OPPONENTS.forEach');
    expect(fnStart, 'hook fn exists').toBeGreaterThan(-1);
    expect(spineAt > fnStart && spineAt < fnEnd, 'the spine sits inside the hook fn body').toBe(true);
  });
});

// ── Behaviour (green BOTH ways — the block moved verbatim) ──────────────────────────────────

test.describe('§VM-01-G-FU-f — tournament behaviour (verbatim)', () => {
  test('no rod → no Tournament section; rod → six challenge cards between Rest and World', async ({ page }) => {
    await at(page, { inventory: [] });
    expect(await tourSection(page)).toBe(null);

    await at(page);
    const t = await tourSection(page);
    expect(t).not.toBe(null);
    expect(t.cards.map(c => c.main)).toEqual(['Pip', 'Renard Castwell', 'Bog Mudwhistle', 'Vera Hookline', 'Dirk Troutslap', 'The Fisherman']);
    expect(t.cards.every(c => c.btn === 'Challenge')).toBe(true);
    // section order: the hook dispatches in place, so Tournament still sits between Rest and World
    expect(t.heads[t.idx - 1]).toBe('🛌 Rest');
    expect(t.heads[t.idx + 1]).toBe('🌐 World');
  });

  test('title badge + beaten opponents render as done cards', async ({ page }) => {
    await at(page, { yugurtTourTitle: 'Lake Apprentice', yugurtTourBeat: { pip: true } });
    const t = await tourSection(page);
    expect(t.badge).toBe('🏆 Your title: Lake Apprentice');
    expect(t.cards[0]).toEqual({ main: 'Pip', hint: 'The Kid', done: true, btn: null });
    expect(t.cards.filter(c => !c.done).length).toBe(5);
  });

  test('Challenge opens the accordion (quote, bare-hook label, stake); a second click closes it', async ({ page }) => {
    await at(page);
    await clickChallenge(page, 'Pip');
    let t = await tourSection(page);
    expect(t.accordion).not.toBe(null);
    expect(t.accordion.quote).toContain('I have been practicing');
    expect(t.accordion.text).toContain('🪝 Bare Hook (−3)');
    expect(t.accordion.castBtn).toBe('🎣 Cast — stake 50gp');
    expect(t.accordion.castDisabled).toBe(false);
    await clickChallenge(page, 'Pip');
    await page.waitForTimeout(320);
    t = await tourSection(page);
    expect(t.accordion, 'accordion removed after the close animation').toBe(null);
  });

  test('refuse-at-render: below the stake the cast button is visible and disabled, naming the price', async ({ page }) => {
    await at(page, { gold: 10 });
    await clickChallenge(page, 'Pip');
    const t = await tourSection(page);
    expect(t.accordion.castBtn).toBe('💰 Need 50gp to enter');
    expect(t.accordion.castDisabled).toBe(true);
  });

  test('a win pays the stake ONCE, sets the beat + title, and the engine is the sole quest completer', async ({ page }) => {
    await at(page, { quests: { quest_tour_01: 'active' } });
    await clickChallenge(page, 'Pip');
    await page.evaluate(() => window.__armRand([0.99, 0.5, 0.05, 0.5])); // player d20=20, npc d20=1
    await clickCast(page);
    await page.waitForTimeout(700); // the win path re-renders after 500ms
    const r = await page.evaluate(() => ({
      gold: S_story.gold, beat: S_story.yugurtTourBeat, title: S_story.yugurtTourTitle,
      tour01: S_story.quests['quest_tour_01'], tour02: S_story.quests['quest_tour_02'],
    }));
    expect(r.gold, 'stake 50 paid exactly once on top of SEED gold 500 (quest xpAward carries no gold)').toBe(550);
    expect(r.beat).toEqual({ pip: true });
    expect(r.title).toBe('Lake Apprentice');
    expect(r.tour01, 'storyCheckQuests completed the active act (§ARCH-01 W8c: no inline second completion path)').toBe('complete');
    expect(r.tour02, 'the chain activated the next act').toBe('active');
    const t = await tourSection(page);
    expect(t.cards[0].done, 'the re-render shows Pip as beaten').toBe(true);
  });

  test('a loss deducts the stake and re-arms the cast button', async ({ page }) => {
    await at(page);
    await clickChallenge(page, 'Pip');
    await page.evaluate(() => window.__armRand([0.05, 0.5, 0.99, 0.5])); // player d20=1, npc d20=20
    await clickCast(page);
    await page.waitForTimeout(200);
    const r = await page.evaluate(() => ({ gold: S_story.gold, beat: S_story.yugurtTourBeat || {} }));
    expect(r.gold).toBe(450);
    expect(r.beat).toEqual({});
    const t = await tourSection(page);
    expect(t.accordion.castBtn).toBe('🎣 Cast again — 50gp');
    expect(t.accordion.text).toContain('YOU LOSE');
  });

  test('Walk away closes the accordion and restores the Challenge button', async ({ page }) => {
    await at(page);
    await clickChallenge(page, 'Pip');
    await page.evaluate(() => {
      const sec = Array.from(document.querySelectorAll('#story-info-row .story-section'))
        .find(s => (s.querySelector('.story-section-hd') || {}).textContent === '🏆 Tournament');
      Array.from(sec.querySelectorAll('.battle-retreat-link')).find(x => x.textContent.includes('Walk away')).click();
    });
    await page.waitForTimeout(320);
    const t = await tourSection(page);
    expect(t.accordion).toBe(null);
    expect(t.cards[0].btn).toBe('Challenge');
  });
});
