// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §VM-01-G-FU-c — the §ALCHEMY-01/§WISDOM-01 (Roen arc) stack: six panel blocks to NODE_HOOKS
// verbatim (G2's method) and the two button-less 2-state panels (PDL oracle, MLA stone) to
// NODE_PANELS. The plan's "staged verbs + the second `choice` consumer" corrected by measurement
// the same way G-FU-a's WG0 and G-FU-b's BN/LD were: EVERY button in this stack — including the
// VS shadow accept-vs-fight pair, which has genuine D2 `choice` semantics — lives INSIDE its
// .sweelinck-variant chrome, and a `choice` verb's surface is _uqfRunVerb's bare div mount, so
// the whole stack stays hooks until the G4c-FU ask-2 panel-chrome question is answered.
// This slice ships ZERO verbs and says so.
//
// POSITIVE CONTROL: the registry/source tests fail at HEAD. Every behaviour test passes BOTH
// ways by design — the whole stack moved verbatim (37-combo golden: 37/37 byte-identical incl.
// bboxes and click outcomes, self-stability 37/37), and a behaviour test that only passed after
// the change would disprove the no-op claim (G2's honest shape).
'use strict';
const { test, expect } = require('@playwright/test');
const { SEED_STATE, dismissContinue } = require('./helpers');

async function at(page, code, overrides = {}) {
  const state = Object.assign({}, SEED_STATE, {
    currentCode: code, checkpointNode: code, visited: { [code]: true }, visitedCells: {},
    rngState: 424242, inventory: [], quests: {},
  }, overrides);
  await page.addInitScript(s => {
    localStorage.clear();
    localStorage.setItem('r2h_autosave', JSON.stringify(s));
  }, state);
  await page.goto('/index.html');
  await dismissContinue(page);
}

// the Roen chain flags, cumulative — the same ladder the golden capture used
const CH6 = { roenMet: true, roenMidlandsWisdom: true, roenAtSea: true, roenOracleRead: true,
              roenMaltaCrisis: true, roenAlchemistMet: true };
const LEG = Object.assign({}, CH6, { personalLegendComplete: true });
const P5  = { wisPage1_masks: true, wisPage2_aggression: true, wisPage3_thumbscrew: true,
              wisPage4_sight: true, wisPage5_form: true };

const clickIn = (page, panelId, text) =>
  page.locator('#' + panelId + ' button', { hasText: text }).first().evaluate(el => el.click());

test.describe('§VM-01-G-FU-c — registry + source shape', () => {
  test('the six alch/wisdom hooks sit as a contiguous registry run with callable fns', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      // §VM-01-G-FU-d appended the harbor hooks after these (their stack sits below the alch
      // region in source order), so the pin is the contiguous run, no longer the tail — the
      // registry-tail pin this file shipped with was exactly the shape its own slice's hunt-pin
      // adjustment warned about (pin the contiguous run, never the tail).
      const first = NODE_HOOKS.findIndex(h => h.id === 'alch-kir-dream');
      const tail = first === -1 ? [] : NODE_HOOKS.slice(first, first + 6);
      return {
        ids: tail.map(h => h.id),
        nodes: tail.map(h => (h.nodes || []).join(',')),
        fns: tail.every(h => typeof h.fn === 'function'),
        anchors: tail.every(h => h.anchor === undefined),
      };
    });
    expect(r.ids).toEqual(['alch-kir-dream', 'alch-man-noon', 'alch-sen-ship',
      'alch-ath-stoic', 'wis-vs-underground', 'wis-vs-hub']);
    expect(r.nodes).toEqual(['KIR', 'MAN', 'SEN', 'ATH', 'VS', 'VS']);
    expect(r.fns).toBe(true);
    expect(r.anchors, 'story-text-box-anchored, not npc-row').toBe(true);
  });

  test('the four alch panels sit in NODE_PANELS: per-state entries share one DOM id with exclusive whens', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      const is = NODE_PANELS.filter(p => p.id === 'story-alch-is');
      const ml = NODE_PANELS.filter(p => p.id === 'story-alch-ml');
      const excl = (pair, states) => states.every(s => pair.filter(p => p.when(s)).length <= 1);
      // the MLA stacking property: story-ml-snake must sit EARLIER in the table than the alch
      // entries so the inline order (alch panel above the snake panel) survives table order
      const iSnake = NODE_PANELS.findIndex(p => p.id === 'story-ml-snake');
      const iMl = NODE_PANELS.findIndex(p => p.id === 'story-alch-ml');
      return {
        is: is.length, ml: ml.length,
        isNodes: is.every(p => p.nodes.join(',') === 'PDL'),
        mlNodes: ml.every(p => p.nodes.join(',') === 'MLA'),
        isExclusive: excl(is, [{}, { roenAtSea: true }, { roenAtSea: true, roenOracleRead: true }]),
        mlExclusive: excl(ml, [{}, { roenOracleRead: true }, { roenOracleRead: true, roenMaltaCrisis: true }]),
        snakeBeforeMl: iSnake !== -1 && iMl !== -1 && iSnake < iMl,
      };
    });
    expect(r.is, 'PDL oracle panel: one entry per chrome state').toBe(2);
    expect(r.ml, 'MLA stone panel: one entry per chrome state').toBe(2);
    expect(r.isNodes).toBe(true);
    expect(r.mlNodes).toBe(true);
    expect(r.isExclusive).toBe(true);
    expect(r.mlExclusive).toBe(true);
    expect(r.snakeBeforeMl, 'table order preserves the inline LIFO (alch above snake)').toBe(true);
  });

  test('the eight block bodies are gone from storyRender; dispatch calls sit in their place', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      const src = storyRender.toString();
      return {
        calls: ['alch-kir-dream', 'alch-man-noon', 'alch-sen-ship', 'alch-ath-stoic',
                'wis-vs-underground', 'wis-vs-hub']
          .filter(id => src.indexOf("_runNodeHook('" + id + "'") === -1),
        // signature locals from each former inline body must no longer appear in storyRender
        residue: ['_alchHLOld', '_alchMIOld', '_alchMSOld', '_alchISOld', '_alchMLOld',
                  '_alchAEOld', '_vsUgOld', '_wisVsOld', '_wisIntroBtn', '_ugBtn', '_bindBtn',
                  '_acceptBtn', '_shadowBtn', '_hookBtn']
          .filter(sig => src.indexOf(sig) !== -1),
      };
    });
    expect(r.calls, 'every alch/wisdom hook has its in-place dispatch call').toEqual([]);
    expect(r.residue, 'no former block body remains inline in storyRender').toEqual([]);
  });
});

test.describe('§VM-01-G-FU-c — §ALCHEMY-01 Roen chain (KIR/MAN/SEN/PDL/MLA/ATH) behaves as the blocks did', () => {
  test('KIR fresh: the crossroads intro renders with its button INSIDE; joining pays +50 XP, grants the slip, and the mid state renders nothing', async ({ page }) => {
    await at(page, 'KIR');
    const before = await page.evaluate(() => {
      const p = document.getElementById('story-alch-hl');
      return { text: p ? p.textContent : '', btnInside: !!(p && p.querySelector('button')) };
    });
    expect(before.text).toContain('a man with a shepherd\'s staff and a smooth stone in his hand');
    expect(before.btnInside, 'the button lives INSIDE the panel — the shape that keeps this a hook').toBe(true);
    await clickIn(page, 'story-alch-hl', 'Let Roen travel with you');
    const after = await page.evaluate(() => ({
      xp: S_story.xp, met: !!S_story.roenMet,
      slip: (S_story.inventory || []).some(i => i.name === "Shepherd's Fortune Slip"),
      panel: !!document.getElementById('story-alch-hl'),
    }));
    expect(after.xp).toBe(50);
    expect(after.met).toBe(true);
    expect(after.slip).toBe(true);
    expect(after.panel, 'roenMet renders nothing at KIR — the silent middle of the arc').toBe(false);
  });

  test('KIR stone drop: personalLegendComplete, +400gp +500 XP, the Loch Gold Flake, the knowledge entry', async ({ page }) => {
    await at(page, 'KIR', CH6);
    await expect(page.locator('#story-alch-hl')).toContainText('I think I need to put it in the water');
    const gold0 = await page.evaluate(() => S_story.gold);
    await clickIn(page, 'story-alch-hl', 'Watch Roen drop the stone into the loch');
    const r = await page.evaluate(() => ({
      xp: S_story.xp, gold: S_story.gold, legend: !!S_story.personalLegendComplete,
      flake: (S_story.inventory || []).some(i => i.name === 'Loch Gold Flake'),
      know: (S_story.knowledge || []).some(k => k.indexOf('Personal Legend') === 0),
    }));
    expect(r.xp).toBe(500);
    expect(r.gold).toBe(gold0 + 400);
    expect(r.legend).toBe(true);
    expect(r.flake).toBe(true);
    expect(r.know).toBe(true);
  });

  test('KIR aftermath: the legend/wis/mature states multiplex exactly as the else-chain did', async ({ page }) => {
    await at(page, 'KIR', LEG);
    const legend = await page.evaluate(() => {
      const p = document.getElementById('story-alch-hl');
      return { text: p.textContent, chrome: p.style.borderLeftColor, btn: !!p.querySelector('button') };
    });
    expect(legend.text).toContain('he is not watching the water');
    expect(legend.chrome).toBe('rgb(138, 122, 42)');
    expect(legend.btn, 'the Ardley intro button lives inside the panel').toBe(true);
    await at(page, 'KIR', Object.assign({}, LEG, { wisHookReceived: true }));
    await expect(page.locator('#story-alch-hl')).toContainText('He will be at Visby when you need him');
    await at(page, 'KIR', Object.assign({}, LEG, { wisHookReceived: true, personalLegendMature: true }));
    const mature = await page.evaluate(() => {
      const p = document.getElementById('story-alch-hl');
      return { text: p.textContent, chrome: p.style.borderLeftColor, btn: !!p.querySelector('button') };
    });
    expect(mature.text).toContain('Roen sits at the loch on Tuesdays');
    expect(mature.chrome).toBe('rgb(42, 74, 42)');
    expect(mature.btn, 'the done state offers no button').toBe(false);
  });

  test('MAN and SEN: each beat pays its XP once and advances the chain flag', async ({ page }) => {
    await at(page, 'MAN', { roenMet: true });
    await expect(page.locator('#story-alch-mi')).toContainText('watching his shadow disappear under his feet');
    await clickIn(page, 'story-alch-mi', 'Discuss the shadow with Roen');
    let r = await page.evaluate(() => ({ xp: S_story.xp, flag: !!S_story.roenMidlandsWisdom,
      panel: !!document.getElementById('story-alch-mi') }));
    expect(r.xp).toBe(150);
    expect(r.flag).toBe(true);
    expect(r.panel, 'the beat does not survive its own re-render').toBe(false);
    await at(page, 'SEN', { roenMet: true, roenMidlandsWisdom: true });
    await expect(page.locator('#story-alch-ms')).toContainText('First time at sea');
    await clickIn(page, 'story-alch-ms', 'Stand at the rail with Roen');
    r = await page.evaluate(() => ({ xp: S_story.xp, flag: !!S_story.roenAtSea }));
    expect(r.xp).toBe(200);
    expect(r.flag).toBe(true);
  });

  test('PDL: the oracle panel gates on roenAtSea and swaps chrome once the reading lands', async ({ page }) => {
    await at(page, 'PDL', { roenMet: true, roenMidlandsWisdom: true });
    await expect(page.locator('#story-alch-is')).toHaveCount(0);
    await at(page, 'PDL', { roenMet: true, roenMidlandsWisdom: true, roenAtSea: true });
    const fresh = await page.evaluate(() => {
      const p = document.getElementById('story-alch-is');
      return { text: p.textContent, chrome: p.style.borderLeftColor, btn: !!p.querySelector('button') };
    });
    expect(fresh.text).toContain('CHA Persuasion DC 11');
    expect(fresh.chrome).toBe('rgb(58, 42, 90)');
    expect(fresh.btn, 'button-less — the shape that let this one move to NODE_PANELS').toBe(false);
    await at(page, 'PDL', { roenMet: true, roenMidlandsWisdom: true, roenAtSea: true, roenOracleRead: true });
    const done = await page.evaluate(() => {
      const p = document.getElementById('story-alch-is');
      return { text: p.textContent, chrome: p.style.borderLeftColor };
    });
    expect(done.text).toContain('She was describing the backyard');
    expect(done.chrome).toBe('rgb(42, 90, 58)');
  });

  test('MLA: the stone panel stacks ABOVE the snake once-panel — the co-render order the table preserves', async ({ page }) => {
    await at(page, 'MLA', { roenMet: true, roenMidlandsWisdom: true, roenAtSea: true, roenOracleRead: true });
    const r = await page.evaluate(() => {
      const sibs = [];
      let el = document.getElementById('story-text-box').nextElementSibling;
      while (el && sibs.length < 20) { sibs.push(el.id || ''); el = el.nextElementSibling; }
      return { iMl: sibs.indexOf('story-alch-ml'), iSnake: sibs.indexOf('story-ml-snake'),
               text: (document.getElementById('story-alch-ml') || {}).textContent || '' };
    });
    expect(r.iMl, 'stone panel present').toBeGreaterThanOrEqual(0);
    expect(r.iSnake, 'the snake once-panel co-renders on first arrival').toBeGreaterThanOrEqual(0);
    expect(r.iMl < r.iSnake, 'alch panel above the snake panel, exactly as the inline order had it').toBe(true);
    expect(r.text).toContain('WIS Insight DC 12');
    await at(page, 'MLA', { roenMet: true, roenMidlandsWisdom: true, roenAtSea: true,
      roenOracleRead: true, roenMaltaCrisis: true, maltaSnakeEvent: true });
    await expect(page.locator('#story-alch-ml')).toContainText('Always do your best');
  });

  test('ATH: giving the slip consumes it, pays +250 XP, and sets roenAlchemistMet', async ({ page }) => {
    await at(page, 'ATH', Object.assign({ inventory: [{ name: "Shepherd's Fortune Slip", icon: '📜', type: 'misc', sell: 0 }] },
      { roenMet: true, roenMidlandsWisdom: true, roenAtSea: true, roenOracleRead: true, roenMaltaCrisis: true }));
    await expect(page.locator('#story-alch-ae')).toContainText('You\'ve been carrying gold for forty years');
    await clickIn(page, 'story-alch-ae', 'Let Roen give the fortune slip to the old man');
    const r = await page.evaluate(() => ({
      xp: S_story.xp, met: !!S_story.roenAlchemistMet,
      slip: (S_story.inventory || []).some(i => i.name === "Shepherd's Fortune Slip"),
    }));
    expect(r.xp).toBe(250);
    expect(r.met).toBe(true);
    expect(r.slip, 'the slip is consumed').toBe(false);
  });
});

test.describe('§VM-01-G-FU-c — §WISDOM-01 manuscript hub (VS) behaves as the blocks did', () => {
  test('VS underground: the descent sets visbyUnderground; the hub co-renders ABOVE it (in-place LIFO)', async ({ page }) => {
    await at(page, 'VS', Object.assign({}, LEG, { wisHookReceived: true }));
    const r = await page.evaluate(() => {
      const sibs = [];
      let el = document.getElementById('story-text-box').nextElementSibling;
      while (el && sibs.length < 20) { sibs.push(el.id || ''); el = el.nextElementSibling; }
      return { iHub: sibs.indexOf('story-wis-vs'), iUg: sibs.indexOf('story-vs-underground') };
    });
    expect(r.iHub, 'hub panel present').toBeGreaterThanOrEqual(0);
    expect(r.iUg, 'underground panel present').toBeGreaterThanOrEqual(0);
    expect(r.iHub < r.iUg, 'the hub (later source position) stacks above the underground panel').toBe(true);
    await clickIn(page, 'story-vs-underground', 'Descend to the lower archive level');
    const after = await page.evaluate(() => ({
      ug: !!S_story.visbyUnderground, panel: !!document.getElementById('story-vs-underground'),
    }));
    expect(after.ug).toBe(true);
    expect(after.panel, 'the descended state renders no underground panel').toBe(false);
  });

  test('VS hook: helping Roen pays +100 XP once and grants the Pages portfolio', async ({ page }) => {
    await at(page, 'VS', LEG);
    await expect(page.locator('#story-wis-vs')).toContainText('a battered portfolio');
    await clickIn(page, 'story-wis-vs', 'Help Roen collect Ardley');
    const r = await page.evaluate(() => ({
      xp: S_story.xp, hook: !!S_story.wisHookReceived,
      pages: (S_story.inventory || []).some(i => i.name === 'Pages of the Ardley Manuscript'),
    }));
    expect(r.xp).toBe(100);
    expect(r.hook).toBe(true);
    expect(r.pages).toBe(true);
  });

  test('VS shadow: the accept-vs-fight pair renders BOTH buttons inside the hub chrome — real D2 semantics, ask-2-blocked surface', async ({ page }) => {
    await at(page, 'VS', Object.assign({}, LEG, { wisHookReceived: true, visbyUnderground: true }, P5));
    const r = await page.evaluate(() => {
      const p = document.getElementById('story-wis-vs');
      const btns = Array.from(p.querySelectorAll('button')).map(b => b.textContent);
      return { text: p.textContent, btns, cls: p.className };
    });
    expect(r.text).toContain('Two paths: accept what it reflects, or fight what you find');
    expect(r.btns.length, 'exactly the two exclusive options').toBe(2);
    expect(r.btns[0]).toContain('Accept the reflection');
    expect(r.btns[1]).toContain('Descend and fight the shadow construct');
    expect(r.cls, 'the options live INSIDE .sweelinck-variant chrome — the shape that keeps this a hook, not the second `choice` consumer').toBe('sweelinck-variant');
  });

  test('VS accept: +350 XP, the Shadow Shard, wisPage6_shadow, the knowledge entry', async ({ page }) => {
    await at(page, 'VS', Object.assign({}, LEG, { wisHookReceived: true, visbyUnderground: true }, P5));
    await clickIn(page, 'story-wis-vs', 'Accept the reflection');
    const r = await page.evaluate(() => ({
      xp: S_story.xp, p6: !!S_story.wisPage6_shadow,
      shard: (S_story.inventory || []).some(i => i.name === 'Shadow Shard'),
      know: (S_story.knowledge || []).some(k => k.indexOf('Ardley W6') === 0),
    }));
    expect(r.xp).toBe(350);
    expect(r.p6).toBe(true);
    expect(r.shard).toBe(true);
    expect(r.know).toBe(true);
  });

  test('VS fight: the staged 400ms pre-battle fires under the synthetic VS_SHADOW code; the latch banks the win as W6', async ({ page }) => {
    await at(page, 'VS', Object.assign({}, LEG, { wisHookReceived: true, visbyUnderground: true }, P5));
    await clickIn(page, 'story-wis-vs', 'Descend and fight the shadow construct');
    await page.waitForTimeout(600); // the hook keeps the block's own staged beat verbatim
    const r = await page.evaluate(() => ({
      overlay: document.getElementById('story-prebatt-overlay').classList.contains('visible'),
      code: _preBattNode && _preBattNode.code,
      key: _preBattNode && _preBattNode.battle && _preBattNode.battle.key,
    }));
    expect(r.overlay).toBe(true);
    expect(r.code, 'the synthetic defeatedBattles key').toBe('VS_SHADOW');
    expect(r.key).toBe('shadow');
    // the latch: a won VS_SHADOW flips wisPage6_shadow at the next render, from ANY node's render
    await at(page, 'VS', Object.assign({}, LEG, { wisHookReceived: true, visbyUnderground: true,
      defeatedBattles: { VS_SHADOW: true } }, P5));
    const latched = await page.evaluate(() => ({
      p6: !!S_story.wisPage6_shadow,
      bind: !!document.querySelector('#story-wis-vs button'),
      text: document.getElementById('story-wis-vs').textContent,
    }));
    expect(latched.p6, 'the defeatedBattles→wisPage6 latch ran during the render').toBe(true);
    expect(latched.bind).toBe(true);
    expect(latched.text).toContain('Shall we bind it?');
  });

  test('VS bind: consumes the Pages, grants Ardley\'s Complete Laws, +400gp +600 XP, then the mature state renders button-less', async ({ page }) => {
    await at(page, 'VS', Object.assign({}, LEG, { wisHookReceived: true, visbyUnderground: true,
      wisPage6_shadow: true, inventory: [{ name: 'Pages of the Ardley Manuscript', icon: '📖', type: 'misc', sell: 0 }] }, P5));
    const gold0 = await page.evaluate(() => S_story.gold);
    await clickIn(page, 'story-wis-vs', 'Bind Ardley');
    const r = await page.evaluate(() => ({
      xp: S_story.xp, gold: S_story.gold, mature: !!S_story.personalLegendMature,
      laws: (S_story.inventory || []).some(i => i.name === "Ardley's Complete Laws"),
      pages: (S_story.inventory || []).some(i => i.name === 'Pages of the Ardley Manuscript'),
      btn: !!document.querySelector('#story-wis-vs button'),
      text: (document.getElementById('story-wis-vs') || {}).textContent || '',
    }));
    expect(r.xp).toBe(600);
    expect(r.gold).toBe(gold0 + 400);
    expect(r.mature).toBe(true);
    expect(r.laws).toBe(true);
    expect(r.pages, 'the portfolio is consumed by the binding').toBe(false);
    expect(r.btn, 'the mature state offers no button').toBe(false);
    expect(r.text).toContain('They are a pair of glasses');
  });
});
