// §VM-01-G4b — NODE_VERBS, and the first `choice` bit ever executed in this game.
//
// G4a built the host end of the coroutine (`_uqfRunVerb`/`_uqfRenderAsk`) and moved zero content.
// This is its first consumer: Kern & Sable at DUS — 76 inline lines, three options then two,
// no cost, no combat, no free text, one node — the cleanest exclusive choice in the file
// (lab-reports/lab-report-vm01g4-per-verb.md §4 "D2", §10 slice G4b).
//
// What the migration has to prove is not that the buttons still exist. It is that the SEMANTICS
// the hand-written click handlers had are now properties of the VM:
//   · nothing is written on the way IN to a choice — only the picked option's bits apply,
//   · the branch not picked never runs,
//   · the token is granted through `reward`, once, on either path that reaches it.
//
// POSITIVE CONTROL: all 10 fail at HEAD — `NODE_VERBS` does not exist there, and the surface's
// DOM identity changed with it (`hm-kern-sable` → `verb-dus-kern-sable-*`). So this file is the
// contract for the AFTER state and cannot also be the before/after equivalence proof. That proof
// is a separate golden-DOM diff of all four DUS states against HEAD, recorded in the ship record:
// text and button labels byte-identical, and the only deltas are the mount's id, a `data-uqf-option`
// attribute, a redundant wrapper div + <em> dropped from an already-italic `.npc-ambient`, and the
// empty 8px spacer the inline block left behind in the "listened and walked away" state.
'use strict';
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

async function atDUS(page, flags = {}) {
  await seedAndLoad(page, Object.assign({
    currentCode: 'DUS', checkpointNode: 'DUS', visited: { DUS: true }, visitedCells: {},
    rngState: 424242, nexusQuestSeen: false, nexusQ01Active: false, nexusQ02Complete: false,
    creativeLiteracyToken: false, inventory: [],
  }, flags));
  await dismissContinue(page);
}

const flags = page => page.evaluate(() => ({
  seen: !!S_story.nexusQuestSeen, q01: !!S_story.nexusQ01Active, q02: !!S_story.nexusQ02Complete,
  token: !!S_story.creativeLiteracyToken,
  tokens: (S_story.inventory || []).filter(i => i.name === 'Creative Literacy Token').length,
  msg: (document.getElementById('story-move-msg') || {}).textContent || '',
}));

test.describe('§VM-01-G4b — the NODE_VERBS registry', () => {
  test('the registry exists, holds the three DUS states in source order, and the inline block is gone', async ({ page }) => {
    await atDUS(page);
    const r = await page.evaluate(() => ({
      ids: NODE_VERBS.map(v => v.id),
      dus: NODE_VERBS.filter(v => (v.nodes || []).indexOf('DUS') > -1).map(v => v.id),
      hasRenderer: typeof _renderNodeVerbs === 'function',
      // the two surfaces that offer a decision are `choice` bits — not three one-option verbs
      choiceKinds: NODE_VERBS.filter(v => v.group === 'dus-kern-sable' && v.bits).map(v => v.bits[0].kind),
      optionCounts: NODE_VERBS.filter(v => v.group === 'dus-kern-sable' && v.bits).map(v => v.bits[0].options.length),
    }));
    expect(r.hasRenderer).toBe(true);
    expect(r.dus).toEqual(['dus-kern-sable-first', 'dus-kern-sable-followup', 'dus-kern-sable-after']);
    // G4b shipped the pilot alone; §VM-01-G4c added the D1 button verbs after it, so the DUS trio
    // is now the HEAD of the table rather than the whole of it.
    expect(r.ids.slice(0, 3)).toEqual(r.dus);
    expect(r.choiceKinds, 'an exclusive surface is a `choice` bit, not a stack of verbs').toEqual(['choice', 'choice']);
    expect(r.optionCounts, 'three options on the first meeting, two on the follow-up').toEqual([3, 2]);
  });

  test("the three `when`s are mutually exclusive — exactly one surface renders in every reachable state", async ({ page }) => {
    await atDUS(page);
    const r = await page.evaluate(() => {
      const states = [
        { nexusQuestSeen: false, nexusQ01Active: false, nexusQ02Complete: false },
        { nexusQuestSeen: true,  nexusQ01Active: false, nexusQ02Complete: false },
        { nexusQuestSeen: true,  nexusQ01Active: true,  nexusQ02Complete: false },
        { nexusQuestSeen: true,  nexusQ01Active: true,  nexusQ02Complete: true },
        { nexusQuestSeen: true,  nexusQ01Active: false, nexusQ02Complete: true },
      ];
      return states.map(st => NODE_VERBS.filter(v => !v.when || v.when(st)).length);
    });
    // The "listened and walked away" state is the one that offers nothing — the inline block
    // rendered an empty 8px spacer div there; the registry renders nothing at all.
    expect(r).toEqual([1, 0, 1, 1, 1]);
  });

  test('the surface is dispatched IN PLACE — it is still the first dynamic sibling at DUS', async ({ page }) => {
    await atDUS(page);
    const r = await page.evaluate(() => {
      const sibs = [];
      let el = document.getElementById('story-text-box').nextElementSibling;
      while (el) { sibs.push(el.id || el.tagName); el = el.nextElementSibling; }
      return { sibs };
    });
    // The migrated block was the LAST insert at DUS and therefore the topmost sibling; it still
    // is, because _renderNodeVerbs is called at the source position the block occupied. Nothing
    // else co-fires here — Corelli's five appearance nodes exclude DUS, DUS is not in birkaNpcs
    // and not a junction vignette — which is what makes this a one-element list.
    expect(r.sibs).toEqual(['verb-dus-kern-sable-first']);
  });

  test('a label-less verb whose chain does not suspend is REFUSED, not run at render', async ({ page }) => {
    // The contract that keeps "the chain is the surface" safe: a chain that does not park on a
    // choice would apply its side effects on every single render of the node.
    await atDUS(page);
    const r = await page.evaluate(() => {
      const warned = [];
      const orig = console.warn; console.warn = (...a) => warned.push(a.join(' '));
      delete S_story.badVerbRan;
      NODE_VERBS.push({ id: 'tmp-bad', nodes: ['DUS'],
        bits: [{ kind: 'flag_write', set: ['badVerbRan'] }] });
      try { _renderNodeVerbs(NODE_MAP.DUS, S_story); } finally {
        NODE_VERBS.pop(); console.warn = orig;
      }
      return { ran: !!S_story.badVerbRan, warned: warned.join(' | '),
               mounted: !!document.getElementById('verb-tmp-bad') };
    });
    expect(r.ran, 'a non-suspending chain never runs at render time').toBe(false);
    expect(r.warned).toContain('label-less verb whose chain does not suspend');
    expect(r.mounted, 'and its mount is not left behind').toBe(false);
  });
});

test.describe('§VM-01-G4b — Kern & Sable, driven by the VM', () => {
  test('the first meeting offers three options and writes NOTHING before the pick', async ({ page }) => {
    await atDUS(page);
    await expect(page.locator('#verb-dus-kern-sable-first')).toContainText('Two figures at the Frequency Row counter');
    await expect(page.locator('#verb-dus-kern-sable-first button')).toHaveCount(3);
    const before = await flags(page);
    expect([before.seen, before.q01, before.q02, before.token]).toEqual([false, false, false, false]);
    expect(await page.evaluate(() => !!_uqfPending), 'the generator is parked on the ask').toBe(true);
  });

  test('👂 Stay quiet — sets only nexusQuestSeen, speaks, and leaves nothing on screen', async ({ page }) => {
    await atDUS(page);
    await page.locator('#verb-dus-kern-sable-first button', { hasText: 'Stay quiet' }).click();
    const r = await flags(page);
    expect([r.seen, r.q01, r.q02], 'the branches not picked never ran').toEqual([true, false, false]);
    expect(r.msg).toContain('They are having a great time. You say nothing. You keep walking.');
    await expect(page.locator('#verb-dus-kern-sable-first')).toHaveCount(0);
    await expect(page.locator('#verb-dus-kern-sable-followup')).toHaveCount(0);
    await expect(page.locator('#verb-dus-kern-sable-after')).toHaveCount(0);
  });

  test('❓ What are you building — opens Q-NEXUS-01, and the follow-up surface is up in the same beat', async ({ page }) => {
    // The one behaviour delta of the migration, asserted rather than left to be noticed: the
    // driver re-renders the node when a chain completes, so the two-option follow-up appears
    // immediately instead of on the next arrival. The fiction supports it — they are still at
    // the counter, waiting — and it is why the pilot ships alone and gets eyeballed (§7½).
    await atDUS(page);
    await page.locator('#verb-dus-kern-sable-first button', { hasText: 'What exactly are you building' }).click();
    const r = await flags(page);
    expect([r.seen, r.q01, r.q02]).toEqual([true, true, false]);
    expect(r.msg).toContain('They both look at you, waiting.');
    expect(r.tokens, 'no token on this branch').toBe(0);
    await expect(page.locator('#verb-dus-kern-sable-followup button')).toHaveCount(2);
  });

  test('⚠ That book is a warning — completes Q-NEXUS-02, mints the token once, shows the aftermath', async ({ page }) => {
    await atDUS(page);
    await page.locator('#verb-dus-kern-sable-first button', { hasText: 'That book is a warning' }).click();
    const r = await flags(page);
    expect([r.seen, r.q01, r.q02]).toEqual([true, false, true]);
    expect(r.token).toBe(true);
    expect(r.tokens, 'the item is granted through `reward`, exactly once').toBe(1);
    expect(r.msg).toContain('We should probably not build the Torment Nexus.');
    expect(r.msg).toContain('Creative Literacy Token added to inventory');
    await expect(page.locator('#verb-dus-kern-sable-after'))
      .toContainText('The notebook is closed. The FUTURE PROOF sticker is on the floor.');
    await expect(page.locator('#verb-dus-kern-sable-after button'), 'the aftermath offers nothing to do').toHaveCount(0);
  });

  test('the follow-up: 🤐 Say nothing changes no flag; 📖 Explain completes and mints the token', async ({ page }) => {
    await atDUS(page, { nexusQuestSeen: true, nexusQ01Active: true });
    await page.locator('#verb-dus-kern-sable-followup button', { hasText: 'Say nothing' }).click();
    let r = await flags(page);
    expect([r.seen, r.q01, r.q02], 'saying nothing is a real option that costs nothing').toEqual([true, true, false]);
    expect(r.msg).toContain('You say nothing. They return to the notes.');

    await page.locator('#verb-dus-kern-sable-followup button', { hasText: 'Explain what a warning is' }).click();
    r = await flags(page);
    expect([r.q02, r.token]).toEqual([true, true]);
    expect(r.tokens).toBe(1);
    expect(r.msg).toContain('Kern closes the notebook. Sable drops the FUTURE PROOF sticker on the floor.');
    await expect(page.locator('#verb-dus-kern-sable-after')).toHaveCount(1);
  });

  test('an abandoned choice writes nothing — the panel survives no render, and its button is inert', async ({ page }) => {
    // G4a's abandonment rule, now proved on real content instead of a probe: a NODE choice can
    // sit on screen across a render, and abandoning it is safe precisely because `choice`
    // applies the picked option's bits only AFTER the pick.
    await atDUS(page);
    const r = await page.evaluate(() => {
      const btn = document.querySelector('#verb-dus-kern-sable-first button');
      storyRender(NODE_MAP[S_story.currentCode]);        // the player did something else
      btn.click();                                       // stale click on the detached panel
      return { seen: !!S_story.nexusQuestSeen, parked: !!_uqfPending };
    });
    expect(r.seen, 'a stale option button can never resume a dropped chain').toBe(false);
    // the fresh render re-offered the same choice and parked a NEW generator
    expect(r.parked).toBe(true);
    await expect(page.locator('#verb-dus-kern-sable-first button')).toHaveCount(3);
  });
});
