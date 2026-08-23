// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §VM-01-G4d — the D3 concurrent menu + the two Class-E strays.
//
// CDG's `cq-boss-buttons` div was the census's one D3 surface: several verbs visible AT ONCE,
// none exclusive, the container persisting across renders (lab-report-vm01g4-per-verb.md §4).
// `choice` is exclusive by construction, so the menu becomes several NODE_VERBS entries sharing
// group 'cdg-boss-menu', rendered into ONE call-site-owned container — §9.1's own sketch. The
// Kenickie Black Market (a shop with its own state machine) and the NUE Lower Archive launcher
// are Class E and go to NODE_HOOKS by G2's verbatim method — the two blocks that fell between
// three slices (G2 deferred, G2b re-scoped, G3 did activation not UI) and are moved rather than
// dropped a fourth time. The la_riva_03 delivery shares the menu's container after the launcher,
// so it is a verb in its own group, dispatched after the hook (in-place rule).
//
// POSITIVE CONTROL: the registry/source tests fail at HEAD (the entries and hooks do not exist
// there). The Kenickie-shop and Lower-Archive behaviour tests pass BOTH ways by design — those
// blocks moved verbatim, and a test that only passes after the change could not prove that.
//
// Two behaviour deltas, asserted rather than left to be found:
//   · the kernel's combat handler opens the pre-battle overlay in the SAME beat as the click —
//     the inline handlers' 400ms setTimeout between the narrative line and the overlay is gone
//     (the line still lands, as the render prefix);
//   · the la_riva delivery message SURVIVES — the inline handler's storyMsg was immediately
//     followed by a bare storyRender whose tail overwrites #story-move-msg (§BOARD-01-FU6), so
//     on HEAD the player never read it. The recovered-narrative delta §VM-01-G4c named.
'use strict';
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { SEED_STATE, dismissContinue } = require('./helpers');

const HTML = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');

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

const clickVerb = (page, text) =>
  page.locator('#story-center button', { hasText: text }).first().evaluate(el => el.click());

const probe = page => page.evaluate(() => ({
  msg: (document.getElementById('story-move-msg') || {}).textContent || '',
  blocked: /msg-block/.test((document.getElementById('story-move-msg') || {}).className || ''),
  gold: S_story.gold,
  inv: (S_story.inventory || []).map(i => i.name),
  favor: JSON.parse(JSON.stringify(S_story.npcFavorability || {})),
  quests: JSON.parse(JSON.stringify(S_story.quests || {})),
  laRivaComplete: !!S_story.laRivaComplete,
  fishmongerRowRestored: !!S_story.fishmongerRowRestored,
  kenickieMarketUsed: !!S_story.kenickieMarketUsed,
}));

test.describe('§VM-01-G4d — registry + source shape', () => {
  test('the three boss verbs share one group, the delivery has its own, and combat bits carry the synthetic CQ_* codes', async ({ page }) => {
    await at(page, 'CDG');
    const r = await page.evaluate(() => NODE_VERBS
      .filter(v => (v.nodes || []).indexOf('CDG') !== -1)
      .map(v => ({ id: v.id, group: v.group, hasLabel: !!v.label,
                   combat: (Array.isArray(v.bits) ? v.bits : []).filter(b => b.kind === 'combat')
                     .map(b => ({ key: b.key, nodeCode: b.nodeCode })) })));
    expect(r.map(v => v.id)).toEqual(['cdg-boss-taz', 'cdg-boss-don', 'cdg-boss-king', 'cdg-la-riva-delivery']);
    expect(r.filter(v => v.group === 'cdg-boss-menu').map(v => v.id))
      .toEqual(['cdg-boss-taz', 'cdg-boss-don', 'cdg-boss-king']);
    expect(r.filter(v => v.id === 'cdg-la-riva-delivery')[0].group, 'the delivery dispatches AFTER the Kenickie hook, so it cannot share the bosses\' group').toBe('cdg-la-riva');
    expect(r.every(v => v.hasLabel), 'a D3 menu is concurrent BUTTONS — no label-less chain, no choice').toBe(true);
    // combat's optional nodeCode is the synthetic code each button always handed storyPreBattle
    expect(r.map(v => v.combat).flat()).toEqual([
      { key: 'taz_devil', nodeCode: 'CQ_TAZ' },
      { key: 'fat_cat_boss', nodeCode: 'CQ_BOSS' },
      { key: 'cat_king', nodeCode: 'CQ_KING' },
    ]);
  });

  test('the migrated blocks are gone from storyRender; the two Class-E strays dispatch as hooks in their place', async ({ page }) => {
    await page.goto('/index.html');
    const r = await page.evaluate(() => {
      const src = storyRender.toString();
      return {
        calls: ['cdg-kenickie-market', 'nue-lower-archive']
          .filter(id => src.indexOf("_runNodeHook('" + id + "'") === -1),
        // signature strings from each former inline body must no longer appear in storyRender
        residue: ['tazBtn', 'donBtn', 'kingBtn', 'KENICKIE_STOCK', 'deliverBtn', '_archWrap']
          .filter(sig => src.indexOf(sig) !== -1),
        hooks: NODE_HOOKS.filter(h => ['cdg-kenickie-market', 'nue-lower-archive'].indexOf(h.id) !== -1).length,
      };
    });
    expect(r.calls, 'every stray has its in-place dispatch call').toEqual([]);
    expect(r.residue, 'no former block body remains inline in storyRender').toEqual([]);
    expect(r.hooks).toBe(2);
  });
});

test.describe('§VM-01-G4d — the D3 concurrent menu at CDG', () => {
  test('two confrontations render AT ONCE, inside the shared container — concurrent, not exclusive', async ({ page }) => {
    await at(page, 'CDG', {
      quests: { quest_cat_04: 'active', quest_cat_05: 'active' },
      catKills: { fat_merchant_cat: 4 },
    });
    const r = await page.evaluate(() => {
      const cq = document.getElementById('cq-boss-buttons');
      const kids = cq ? [...cq.children] : [];
      return {
        exists: !!cq,
        // Later blocks insert afterend of the anchor too and stack ABOVE the menu (LIFO), exactly
        // as they did around the inline block — so the claim is sibling-of-the-anchor, not
        // immediate-next-sibling.
        insertedAfterAnchor: !!cq && (() => {
          const a = document.getElementById('story-text-box');
          return cq.parentNode === a.parentNode && !!(a.compareDocumentPosition(cq) & Node.DOCUMENT_POSITION_FOLLOWING);
        })(),
        labels: kids.map(k => k.textContent),
        tags: kids.map(k => k.tagName),
        // inside the container the flex gap owns the spacing — no per-button margin
        styles: kids.map(k => k.getAttribute('style') || ''),
        ids: kids.map(k => k.id),
      };
    });
    expect(r.exists).toBe(true);
    expect(r.insertedAfterAnchor, 'the same afterend insert the inline block used').toBe(true);
    expect(r.labels).toEqual(['🌀 Confront the Taz Devil — Furball Tornado', '💍 Confront Don Fluffissimo']);
    expect(r.tags).toEqual(['BUTTON', 'BUTTON']);
    expect(r.styles, 'the container\'s gap:6px owns the spacing, exactly as it always did').toEqual(['', '']);
    expect(r.ids).toEqual(['verb-cdg-boss-taz', 'verb-cdg-boss-don']);
  });

  test('an empty menu leaves the page untouched — no container is inserted', async ({ page }) => {
    await at(page, 'CDG', { quests: { quest_cat_01: 'active' } });
    // cat_01 offers no boss, no market (cat_05 not complete), no delivery — the div the inline
    // block only inserted `if (cqDiv.children.length > 0)` must be absent, not present-and-empty.
    await expect(page.locator('#cq-boss-buttons')).toHaveCount(0);
  });

  test('clicking a confrontation opens the pre-battle overlay for the synthetic node IN THE SAME BEAT, and the narrative lands', async ({ page }) => {
    await at(page, 'CDG', { quests: { quest_cat_04: 'active' } });
    await clickVerb(page, 'Confront the Taz Devil');
    const r = await page.evaluate(() => ({
      overlayVisible: document.getElementById('story-prebatt-overlay').classList.contains('visible'),
      preBattCode: _preBattNode && _preBattNode.code,
      preBattKey: _preBattNode && _preBattNode.battle && _preBattNode.battle.key,
      preBattLabel: _preBattNode && _preBattNode.battle && _preBattNode.battle.label,
      msg: (document.getElementById('story-move-msg') || {}).textContent || '',
    }));
    // The named delta: the inline handler waited 400ms between the line and the overlay; the
    // kernel's combat handler is synchronous, so the overlay is already up when the click returns.
    expect(r.overlayVisible).toBe(true);
    expect(r.preBattCode, 'the synthetic code, via combat.nodeCode').toBe('CQ_TAZ');
    expect(r.preBattKey).toBe('taz_devil');
    expect(r.preBattLabel).toBe('Taz Devil — Furball Tornado');
    expect(r.msg, 'the rumble line rides the render prefix and still reads when the overlay closes').toContain('I TOLD you this was a SITUATION');
  });

  test('a defeated boss\'s verb is gone — `when` reads the same flags the inline guards read', async ({ page }) => {
    await at(page, 'CDG', {
      quests: { quest_cat_04: 'active', quest_cat_06: 'active' },
      defeatedBattles: { CQ_TAZ: true },
    });
    await expect(page.locator('#verb-cdg-boss-taz')).toHaveCount(0);
    await expect(page.locator('#verb-cdg-boss-king')).toHaveCount(1);
  });
});

test.describe('§VM-01-G4d — Kenickie\'s Black Market (Class E, verbatim; passes at HEAD too)', () => {
  test('the launcher renders inside the container once cat_05 is complete, and opens the shop afterend of it', async ({ page }) => {
    await at(page, 'CDG', { gold: 100, quests: { quest_cat_05: 'complete' } });
    const before = await page.evaluate(() => {
      const cq = document.getElementById('cq-boss-buttons');
      return { inContainer: !!cq && [...cq.children].some(k => k.textContent.includes('Black Market')) };
    });
    expect(before.inContainer, 'the launcher is a child of the menu container, as it always was').toBe(true);
    await clickVerb(page, "Kenickie's Black Market");
    const r = await page.evaluate(() => {
      const shop = document.getElementById('kenickie-shop-div');
      return {
        shopAfterMenu: !!shop && shop.previousElementSibling === document.getElementById('cq-boss-buttons'),
        rows: shop ? shop.querySelectorAll('button').length : 0,   // 4 Buy + 1 Close
        goldLine: shop ? shop.textContent.includes('💰 Gold: 100gp') : false,
      };
    });
    expect(r.shopAfterMenu).toBe(true);
    expect(r.rows).toBe(5);
    expect(r.goldLine).toBe(true);
  });

  test('a buy without the gold refuses with the shake and spends nothing; with it, spends once and stocks the item', async ({ page }) => {
    await at(page, 'CDG', { gold: 20, quests: { quest_cat_05: 'complete' } });
    await clickVerb(page, "Kenickie's Black Market");
    // Live Shallows Minnow is 28gp; we hold 20
    await page.evaluate(() => {
      const shop = document.getElementById('kenickie-shop-div');
      const row = [...shop.children].find(c => c.textContent.includes('Live Shallows Minnow'));
      row.querySelector('button').click();
    });
    let r = await probe(page);
    expect(r.msg).toBe('💰 Not enough gold.');
    expect(r.blocked).toBe(true);
    expect(r.gold).toBe(20);
    // Sardine Pack is 18gp
    await page.evaluate(() => {
      const shop = document.getElementById('kenickie-shop-div');
      const row = [...shop.children].find(c => c.textContent.includes('Sardine Pack'));
      row.querySelector('button').click();
    });
    r = await probe(page);
    expect(r.gold).toBe(2);
    expect(r.inv).toContain('Sardine Pack');
    expect(r.kenickieMarketUsed).toBe(true);
    expect(r.msg).toContain('Good choice');
  });
});

test.describe('§VM-01-G4d — the la_riva_03 delivery, last child of the menu', () => {
  test('the delivery pays the whole chain once, completes the quest in the same beat, and the message SURVIVES', async ({ page }) => {
    await at(page, 'CDG', {
      gold: 50,
      quests: { quest_la_riva_03: 'active' },
      inventory: [{ name: 'Old Tuna Account Book', icon: '📒', type: 'quest_item', sell: 0 }],
    });
    await expect(page.locator('#verb-cdg-la-riva-delivery')).toHaveCount(1);
    await clickVerb(page, 'Give Kenickie the Account Book');
    const r = await probe(page);
    expect(r.inv, 'the book is consumed through item_remove').toEqual([]);
    expect(r.laRivaComplete).toBe(true);
    expect(r.fishmongerRowRestored).toBe(true);
    // set:3 — Dear Friend outright, the absolute level the inline handler wrote
    expect(r.favor.kenickie).toBe(3);
    expect(r.quests.quest_la_riva_03, 'completes in the same beat — flags:[laRivaComplete] is its whole completion gate').toBe('complete');
    // On HEAD the inline handler's storyMsg was destroyed by its own bare storyRender one line
    // later (§BOARD-01-FU6). As the chain's narrative it rides the render prefix and survives.
    expect(r.msg).toContain("I'll hold onto this");
    expect(r.msg).toContain('✓ Aldo: The Account Book');
    await expect(page.locator('#verb-cdg-la-riva-delivery')).toHaveCount(0);
  });

  test('menu order is preserved by construction: bosses, then launcher, then delivery', async ({ page }) => {
    await at(page, 'CDG', {
      quests: { quest_cat_06: 'active', quest_cat_05: 'complete', quest_la_riva_03: 'active' },
      inventory: [{ name: 'Old Tuna Account Book', icon: '📒', type: 'quest_item', sell: 0 }],
    });
    const kids = await page.evaluate(() =>
      [...document.getElementById('cq-boss-buttons').children].map(k => k.textContent));
    expect(kids).toEqual([
      '👑 Face The Cat-King',
      "🐟 Kenickie's Black Market",
      '📒 Give Kenickie the Account Book',
    ]);
  });
});

test.describe('§VM-01-G4d — the NUE Lower Archive launcher (Class E, verbatim; passes at HEAD too)', () => {
  test('the launcher renders when unlocked and opens the archive modal in its wrap', async ({ page }) => {
    await at(page, 'NUE', { wmLowerArchiveUnlocked: true });
    const wrap = page.locator('#wm-archive-wrap');
    await expect(wrap).toHaveCount(1);
    await clickVerb(page, 'Lower Archive');
    const r = await page.evaluate(() => ({
      sub: !!document.getElementById('wm-archive-sub'),
      launcherDisabled: [...document.querySelectorAll('#wm-archive-wrap button')]
        .some(b => b.textContent.includes('Lower Archive') && b.disabled),
    }));
    expect(r.sub, '_storyWmArchiveModal renders into the wrap').toBe(true);
    expect(r.launcherDisabled).toBe(true);
  });

  test('locked, nothing renders', async ({ page }) => {
    await at(page, 'NUE', {});
    await expect(page.locator('#wm-archive-wrap')).toHaveCount(0);
  });
});
