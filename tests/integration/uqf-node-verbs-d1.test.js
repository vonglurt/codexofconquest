// §VM-01-G4c — the D1 button verbs, and the first prices the player ever pays through `cost`.
//
// G4a built the driver + the `cost` leaf and moved nothing. G4b added `NODE_VERBS` and migrated
// the one D2 exclusive choice (Kern & Sable), which uses the label-LESS mode. This slice is the
// mode G4b built and never used: `label` + `bits` — one button, no alternative offered
// (lab-reports/lab-report-vm01g4-per-verb.md §4 "D1", §10 slice G4c).
//
// Four surfaces move — Sweelinck's S49 scene at NUE, Ori at STN, Yva at TRD, Brynn's firewood at
// TLL — and the Junction Vignette's [Help — 10gp] keeps its block and swaps its hand-written
// price for the leaf. That second one is the parent report's stated bar for `cost` not being
// single-use, and it is deliberately NOT a NODE_VERBS entry: its lines are drawn once per node
// by JUNCTION_VIGNETTES, so a re-render would replace them with "…has moved on".
//
// POSITIVE CONTROL: the registry/source tests fail at HEAD (the entries do not exist there). The
// junction tests pass BOTH ways by design — that surface is supposed to be byte-identical, and a
// test that only passes after the change could not have proved it.
//
// The one behaviour delta, asserted here rather than left to be found: the driver re-renders when
// a chain ends, so a quest whose completion the verb satisfies completes IN THE SAME BEAT instead
// of on the next arrival. It is paid exactly once either way — the payout is the quest's own
// onComplete (§VM-01-G3) — but the gold, the item and the ✓ line now land while the player is
// still looking at the verb they clicked.
'use strict';
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { SEED_STATE, dismissContinue } = require('./helpers');

const HTML = fs.readFileSync(path.join(__dirname, '..', '..', 'roll2hit-v3.html'), 'utf8');

async function at(page, code, overrides = {}) {
  const state = Object.assign({}, SEED_STATE, {
    currentCode: code, checkpointNode: code, visited: { [code]: true }, visitedCells: {},
    rngState: 424242, inventory: [], quests: {},
  }, overrides);
  await page.addInitScript(s => {
    localStorage.clear();
    localStorage.setItem('r2h_autosave', JSON.stringify(s));
  }, state);
  await page.goto('/roll2hit-v3.html');
  await dismissContinue(page);
}

// The journal modal can sit over the story column at an inn node, so drive the button the way
// the player's click reaches the handler rather than through hit-testing.
const clickVerb = (page, text) =>
  page.locator('#story-center button', { hasText: text }).first().evaluate(el => el.click());

const probe = page => page.evaluate(() => ({
  msg: (document.getElementById('story-move-msg') || {}).textContent || '',
  blocked: /msg-block/.test((document.getElementById('story-move-msg') || {}).className || ''),
  gold: S_story.gold,
  inv: (S_story.inventory || []).map(i => i.name),
  favor: JSON.parse(JSON.stringify(S_story.npcFavorability || {})),
  quests: JSON.parse(JSON.stringify(S_story.quests || {})),
  vsWeaponsFound: !!S_story.vsWeaponsFound,
  tlMissingShipSolved: !!S_story.tlMissingShipSolved,
  s49: !!S_story.s49SweelinckDelivered,
  firewood: !!S_story.brynnFirewoodDelivered,
}));

test.describe('§VM-01-G4c — the registry after the D1 migration', () => {
  test('the four D1 verbs are button verbs, and every entry belongs to a dispatched group', async ({ page }) => {
    await at(page, 'TRD');
    const r = await page.evaluate(() => NODE_VERBS.map(v => ({
      id: v.id, group: v.group, hasLabel: !!v.label,
      bitsKind: typeof v.bits, ambient: !!v.ambient,
    })));
    // §VM-01-G4d added the CDG label verbs (the D3 menu + the la_riva delivery); §VM-01-G-FU-a
    // added the §CROWN-01 dispatch verbs; §VM-01-G-FU-e added the §LXX smelt verb. This test
    // owns the G4c D1 set, uqf-node-verbs-d3.test.js owns the CDG tail,
    // uqf-node-verbs-crown.test.js the crown groups, uqf-node-lxx.test.js the lxx group.
    const d1 = r.filter(v => v.hasLabel && (v.group || '').indexOf('cdg-') !== 0
                          && (v.group || '').indexOf('crown-') !== 0
                          && (v.group || '').indexOf('lxx-') !== 0).map(v => v.id);
    expect(d1).toEqual(['nue-s49-sweelinck', 'stn-ori', 'trd-yva', 'tll-brynn-firewood']);
    expect(r.every(v => !!v.group), 'a group is what names a dispatch position').toBe(true);
    // `bits` may be an array or a fn(st) — the same string|fn shape `ambient` already had.
    expect(r.filter(v => v.id === 'trd-yva')[0].bitsKind).toBe('function');
    expect(r.filter(v => v.id === 'stn-ori')[0].bitsKind).toBe('object');
  });

  test('every group has exactly one call site, and every call site names a live group', async ({ page }) => {
    // An entry with no call site would render NOWHERE — the silent rot this whole track exists
    // to stop (§PLAY-01-G: birkaNpcs' five cards keyed to dead node codes, invisible for months).
    await at(page, 'TRD');
    const groups = await page.evaluate(() => [...new Set(NODE_VERBS.map(v => v.group))]);
    // §VM-01-G4d: a D3 call site passes its shared container as a 4th argument.
    const called = [...HTML.matchAll(/_renderNodeVerbs\(node, S_story, '([^']+)'(?:, \w+)?\)/g)].map(m => m[1]);
    expect(called.slice().sort()).toEqual(groups.slice().sort());
    expect(new Set(called).size, 'one call site per group').toBe(called.length);
  });

  test('the migrated blocks are gone from storyRender — no handler left behind', async () => {
    for (const gone of ['s49SqBtn', 'oriBtn', 'yvaBtn', '_fwBtn']) {
      expect(HTML.includes(gone), gone + ' should have left the file with its block').toBe(false);
    }
    // and the price the junction help used to compute by hand is the leaf now
    expect(HTML.includes("if ((S_story.gold || 0) < 10) { storyBlock('Not enough gold.'); return; }")).toBe(false);
    expect(HTML).toContain("_uqfRunChain([{ kind:'cost', gold:10");
  });

  test('a label-only verb IS its button — no wrapper, or the flex column stops stretching it', async ({ page }) => {
    // The migrated blocks inserted a BARE button afterend of #story-text-box, whose parent is a
    // flex column: a direct-child button is stretched full width, one inside a wrapper shrinks to
    // its text. A DOM diff cannot see that; the §7½ screenshot could, and did. So it is pinned.
    await at(page, 'STN', { quests: { quest_tl_03: 'active' } });
    const r = await page.evaluate(() => {
      const m = document.getElementById('verb-stn-ori');
      const anchor = document.getElementById('story-text-box');
      // the Harbor Board button at this node is still inline and is the control: the migrated
      // verb has to lay out exactly like the un-migrated bare button beside it.
      const board = [...document.querySelectorAll('button.inv-use-btn')].find(b => b.textContent.includes('Harbor Board'));
      return { tag: m.tagName, cls: m.className, parentIsAnchorParent: m.parentNode === anchor.parentNode,
               width: Math.round(m.getBoundingClientRect().width),
               boardWidth: Math.round(board.getBoundingClientRect().width),
               btnStyle: m.getAttribute('style') };
    });
    expect(r.tag).toBe('BUTTON');
    expect(r.cls).toBe('inv-use-btn');
    expect(r.parentIsAnchorParent, 'a direct sibling of the anchor, exactly as the bare button was').toBe(true);
    expect(r.width, 'stretched by the flex column, exactly like the un-migrated button beside it').toBe(r.boardWidth);
    expect(r.btnStyle.replace(/\s+/g, ''), "the site's own spacing, carried by btnStyle").toBe('margin-top:4px;');
  });
});

test.describe('§VM-01-G4c — `cost`, live, at Yva the broker (TRD)', () => {
  test('unaffordable refuses out loud and changes NOTHING — refuse-at-click, as designed', async ({ page }) => {
    await at(page, 'TRD', { gold: 9, quests: { quest_vs_02: 'active' } });
    await clickVerb(page, 'Find Yva');
    const r = await probe(page);
    expect(r.msg).toContain("You don't have 50gp");
    expect(r.gold, 'a refused price spends nothing').toBe(9);
    expect(r.vsWeaponsFound, 'and the rest of the chain never ran').toBe(false);
    expect(r.inv).toEqual([]);
    expect(r.quests.quest_vs_03, 'the unlock is downstream of the price').toBeUndefined();
    // the verb still renders — the game states what it wants rather than withholding the option
    await expect(page.locator('button#verb-trd-yva')).toHaveCount(1);
  });

  test('affordable spends once and pays the whole chain — gold, flag, favor, item, unlock', async ({ page }) => {
    await at(page, 'TRD', { gold: 500, quests: { quest_vs_02: 'active' } });
    await clickVerb(page, 'Find Yva');
    const r = await probe(page);
    expect(r.gold).toBe(450);
    expect(r.vsWeaponsFound).toBe(true);
    expect(r.inv.filter(n => n === 'Hollow Hands Seal'), 'granted through `reward`, exactly once').toHaveLength(1);
    // `set:1`, not `add:1` — _setNpcFavor takes an absolute level and only ever raises it
    expect(r.favor.yva).toBe(1);
    expect(r.quests.quest_vs_03).toBe('active');
    await expect(page.locator('#verb-trd-yva')).toHaveCount(0);
  });

  test('the narrative is assembled from state — the Harrow line only when the ship is solved', async ({ page }) => {
    await at(page, 'TRD', { gold: 500, quests: { quest_vs_02: 'active' } });
    await clickVerb(page, 'Find Yva');
    expect((await probe(page)).msg).not.toContain('Whatever got that ship wasn\'t them');

    await at(page, 'TRD', { gold: 500, quests: { quest_vs_02: 'active' }, tlMissingShipSolved: true });
    await clickVerb(page, 'Find Yva');
    expect((await probe(page)).msg).toContain('Whatever got that ship wasn\'t them');
  });

  test('a favor already at 2 is not lowered to 1 — _setNpcFavor only raises', async ({ page }) => {
    await at(page, 'TRD', { gold: 500, quests: { quest_vs_02: 'active' }, npcFavorability: { yva: 2 } });
    await clickVerb(page, 'Find Yva');
    expect((await probe(page)).favor.yva).toBe(2);
  });
});

test.describe('§VM-01-G4c — the three plain verbs', () => {
  test('Ori narrates and closes the missing-ship question; the quest pays out ONCE', async ({ page }) => {
    await at(page, 'STN', { gold: 500, quests: { quest_tl_03: 'active' } });
    await clickVerb(page, 'Speak with Ori');
    const r = await probe(page);
    expect(r.msg).toContain("I was on the Harrow. I'm the only one who came back.");
    expect(r.tlMissingShipSolved).toBe(true);
    // The named delta: the completion lands in the same beat now. §VM-01-G3 moved the payout into
    // the quest's own onComplete precisely so the verb could not double-pay — this pins that.
    expect(r.quests.quest_tl_03).toBe('complete');
    expect(r.gold, 'the 300gp reward, paid by quest_tl_03 exactly once').toBe(800);
    expect(r.inv.filter(n => n === "Ori's Account")).toHaveLength(1);
  });

  test("Sweelinck's S49 scene closes differently on NG+ — the chain is computed at click", async ({ page }) => {
    await at(page, 'NUE', { frobergerLastEntryRead: true });
    await clickVerb(page, 'You read the last entry');
    let r = await probe(page);
    expect(r.s49).toBe(true);
    expect(r.msg).toContain("I'll keep it here. You know where to find me when you're done.");

    await at(page, 'NUE', { frobergerLastEntryRead: true, ngPlusRun: 1 });
    await clickVerb(page, 'You read the last entry');
    r = await probe(page);
    expect(r.msg).toContain("Still here. Bring it back when you're done again.");
  });

  test("Brynn's firewood: the narrative survives, where the inline handler destroyed it", async ({ page }) => {
    // On HEAD the handler called storyMsg() and then storyCheckQuests(), whose own messages
    // OVERWROTE it — storyMsg sets textContent on a single slot. The driver buffers the chain's
    // narrative and hands it to storyRender as the PREFIX, so both survive, joined.
    await at(page, 'TLL', { npcFavorability: { brynn: 1 }, quests: { quest_brynn_firewood: 'active' } });
    await clickVerb(page, 'Help split the firewood');
    const r = await probe(page);
    expect(r.firewood).toBe(true);
    expect(r.msg).toContain('The cup is for you. She left it on the chopping block.');
    expect(r.msg).toContain('Brynn');
    await expect(page.locator('#verb-tll-brynn-firewood')).toHaveCount(0);
  });
});

test.describe('§VM-01-G4c — the Junction Vignette price, the second `cost` consumer', () => {
  // These pass at HEAD too, and that is the point: this surface is supposed to be byte-identical.
  test('unaffordable shakes the message line and leaves the vignette standing', async ({ page }) => {
    await at(page, 'WRO', { gold: 4 });
    await clickVerb(page, 'Help — 10gp');
    const r = await probe(page);
    expect(r.msg).toBe('Not enough gold.');
    expect(r.blocked, 'a refused price keeps the storyBlock shake the hand-written sites had').toBe(true);
    expect(r.gold).toBe(4);
    await expect(page.locator('#story-center button', { hasText: 'Help — 10gp' })).toHaveCount(1);
    // and the vignette is still on screen — a re-render here would replace it with "…has moved on"
    await expect(page.locator('#story-center')).toContainText("My employer hasn't paid me in three weeks");
  });

  test('affordable spends 10gp, speaks, retires the button, and does NOT re-render the vignette', async ({ page }) => {
    await at(page, 'WRO', { gold: 500 });
    await clickVerb(page, 'Help — 10gp');
    const r = await probe(page);
    expect(r.gold).toBe(490);
    expect(r.blocked).toBe(false);
    expect(r.msg).toContain('Tessie');
    await expect(page.locator('#story-center button', { hasText: 'Help — 10gp' })).toHaveCount(0);
    await expect(page.locator('#story-center')).toContainText("My employer hasn't paid me in three weeks");
  });
});
