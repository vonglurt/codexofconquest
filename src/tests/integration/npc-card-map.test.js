// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §NPC-01 — The Derivable NPC Card Map (promotes §POT-R2). See lab-reports/lab-report-npc-card-map.md.
//
// §NPC-01-A guards that _renderNpcCard renders a "lean" BIRKA_NPC_PROFILES entry — one that carries
// only {key,name,occupation,node} and NO per-tier greeting object (the ~194 non-Birka NPCs) — WITHOUT
// throwing. Before the fix, staticProfile was undefined for a lean profile and `staticProfile.greeting`
// threw a TypeError, so widening the render map to any lean NPC would have crashed the card. The fix
// omits the greeting line when absent; name/occupation/quote/worldTruth still render, and rich profiles
// keep byte-identical HTML.
const { test, expect } = require('@playwright/test');
const { seedAndLoad, dismissContinue } = require('./helpers');

test.describe('§NPC-01-A — lean profiles render without the staticProfile.greeting crash', () => {
  test('every sampled lean profile builds a card and shows its name; rich profiles keep their greeting', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await page.goto('/play.html');

    const r = await page.evaluate(() => {
      const out = { threw: [], nameMissing: [] };
      const isRich = p => !!(p && p.neutral && p.neutral.greeting);
      const keys = Object.keys(BIRKA_NPC_PROFILES);
      out.richCount = keys.filter(k => isRich(BIRKA_NPC_PROFILES[k])).length;
      out.leanCount = keys.filter(k => !isRich(BIRKA_NPC_PROFILES[k])).length;

      // Render a broad sample of lean profiles that also have a dialogue (dlg non-null → passes the
      // early-returns and reaches the greeting line that used to crash).
      const sample = keys.filter(k => !isRich(BIRKA_NPC_PROFILES[k]) && NPC_DIALOGUES[k]).slice(0, 30);
      out.sampleSize = sample.length;
      for (const k of sample) {
        const box = document.createElement('div');
        try { _renderNpcCard(k, box); }
        catch (e) { out.threw.push(k + ': ' + String(e)); continue; }
        if (!box.textContent.includes(BIRKA_NPC_PROFILES[k].name)) out.nameMissing.push(k);
      }

      // Regression: a rich profile (yael, fresh → neutral tier) still renders its authored greeting.
      const rbox = document.createElement('div');
      _renderNpcCard('yael', rbox);
      out.richGreetingShown = rbox.textContent.includes(BIRKA_NPC_PROFILES['yael'].neutral.greeting);
      return out;
    });

    expect(r.leanCount, 'there are many lean profiles to guard').toBeGreaterThan(100);
    expect(r.richCount, 'the Birka rich profiles still exist').toBeGreaterThan(0);
    expect(r.sampleSize, 'sampled lean profiles that have a dialogue').toBeGreaterThan(0);
    expect(r.threw, 'no lean profile throws in _renderNpcCard').toEqual([]);
    expect(r.nameMissing, 'every lean card shows its NPC name').toEqual([]);
    expect(r.richGreetingShown, 'rich profile still shows its authored greeting (byte-identical path)').toBe(true);
    expect(pageErrors).toEqual([]);
  });
});

test.describe('§NPC-01-B — render map derived from BIRKA_NPC_PROFILES.node', () => {
  test('derivation inverts profiles, covers many real nodes (0 dead), is wired into storyRender, and preserves the curated literal', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await page.goto('/play.html');

    const r = await page.evaluate(() => {
      const m = _deriveNpcRenderMap();
      const nodes = Object.keys(m);
      const distinctKeys = new Set();
      nodes.forEach(n => m[n].forEach(k => distinctKeys.add(k)));

      // spot check: a lean profile (ser_bardo) derives to its own .node
      const serBardoNode = BIRKA_NPC_PROFILES['ser_bardo'] && BIRKA_NPC_PROFILES['ser_bardo'].node;
      const serBardoDerived = !!(serBardoNode && m[serBardoNode] && m[serBardoNode].includes('ser_bardo'));

      // the render path actually falls back to the derived map
      const src = storyRender.toString();
      const wired = /_deriveNpcRenderMap\(\)/.test(src);

      // parity anchor: the curated `birkaNpcs` literal is still present and LHR stays a curated key
      // (so the literal wins for it), while ser_bardo's node is NOT a curated key (so derivation applies)
      const litDecl = src.slice(src.indexOf('const birkaNpcs ='));
      const litLine = litDecl.slice(0, litDecl.indexOf('\n'));
      const lhrCurated = /[,{]\s*LHR:\[/.test(litLine);
      const serBardoNodeCurated = new RegExp('[,{]\\s*' + serBardoNode + ':\\[').test(litLine);

      return {
        nodeCount: nodes.length,
        deadNodes: nodes.filter(n => !NODE_MAP[n]),
        distinctKeyCount: distinctKeys.size,
        renderableNodes: nodes.filter(n => m[n].some(k => NPC_DIALOGUES[k])).length,
        // Many derived nodes omitted an explicit `code:` field in source — so the render lookup had
        // to key on the node key (currentCode), not node.code, or they rendered nothing. §AUDIT-03e
        // retired that hazard at the source (code is backfilled from the key at load), so the check
        // is now: those same nodes are the backfilled set, and node.code resolves to the key there.
        backfilledDerivedNodes: nodes.filter(n => NODE_CODE_BACKFILLED.has(n)).length,
        derivedCodesAllResolve: nodes.every(n => NODE_MAP[n].code === n),
        serBardoWasCodeless: NODE_CODE_BACKFILLED.has(serBardoNode),
        serBardoNode, serBardoDerived, wired, lhrCurated, serBardoNodeCurated,
      };
    });

    expect(r.wired, 'storyRender falls back to _deriveNpcRenderMap()').toBe(true);
    expect(r.nodeCount, 'derived map covers many real nodes').toBeGreaterThan(100);
    expect(r.deadNodes, 'no derived node code is absent from NODE_MAP').toEqual([]);
    expect(r.distinctKeyCount, 'derives ~all authored profiles').toBeGreaterThan(190);
    expect(r.serBardoDerived, `ser_bardo derives to its node ${r.serBardoNode}`).toBe(true);
    expect(r.renderableNodes, 'many nodes now yield a renderable NPC (has both profile and dialogue)').toBeGreaterThan(100);
    expect(r.lhrCurated, 'LHR stays a curated literal key — parity anchor, literal wins').toBe(true);
    expect(r.serBardoNodeCurated, "ser_bardo's node is NOT curated, so derivation applies there").toBe(false);
    expect(r.backfilledDerivedNodes, 'many derived nodes were code-less in source — the §NPC-01-B hazard').toBeGreaterThan(50);
    expect(r.serBardoWasCodeless, `${r.serBardoNode} is one such node (the end-to-end regression case)`).toBe(true);
    expect(r.derivedCodesAllResolve, '§AUDIT-03e: node.code now resolves to the key at every derived node').toBe(true);
    expect(pageErrors).toEqual([]);
  });

  test('end-to-end: storyRender shows a derived NPC card at a non-curated node (was blank before §NPC-01)', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    // ser_bardo lives at PSAGLD, which is NOT a curated birkaNpcs key — before §NPC-01 this node
    // rendered no NPC card at all. Load the game standing on it and assert the real card row.
    const node = 'PSAGLD';
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true } });
    await dismissContinue(page);
    await expect(page.locator('#story-npc-cards-row')).toContainText('Ser Bardo Albizzi');
    expect(pageErrors).toEqual([]);
  });
});

// §NPC-01-C — render dlg.meta.enemy at Friendly (fav>=1), mirroring the worldTruth footer at
// Dear Friend (fav>=2). The relationship deepens from "what they're up against" (⚔, Friendly) to
// "what they know" (✦, Dear Friend). Folds in §POT-C2: 202 authored villain sketches that nothing
// read. Tier-gated + data-driven — not a yael special case.
test.describe('§NPC-01-C — meta.enemy footer at Friendly (folds in §POT-C2)', () => {
  test('enemy reveals at Friendly, worldTruth stays Dear-Friend-only, and enemy sits above worldTruth', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await page.goto('/play.html');

    const r = await page.evaluate(() => {
      const key = 'yael';
      const meta = NPC_DIALOGUES[key].meta;
      const enemy = meta.enemy, worldTruth = meta.worldTruth;

      const render = fav => {
        S_story.npcFavorability = { [key]: fav };
        S_story.actNumber = 1;            // avoid Act-III / Act-8 one-time injections (meta preserved either way)
        S_story.yaelOnboardingSeen = true; // take the normal tier pool, not the onboarding early-return
        const box = document.createElement('div');
        _renderNpcCard(key, box);
        return box;
      };

      const impartial = render(0).textContent;
      const friendlyBox = render(1);
      const dearBox = render(2);

      // DOM order on the Dear Friend card: the enemy footer (leaf div, "⚔ …") must precede the
      // worldTruth footer (leaf div, "✦ …"), so the card reads friendly-reveal → dear-friend-reveal.
      const footers = [...dearBox.querySelectorAll('div')].map(d => d.textContent);
      const enemyIdx = footers.findIndex(t => t.startsWith('⚔ '));
      const wtIdx = footers.findIndex(t => t.startsWith('✦ '));

      return {
        enemy,
        impartialHasEnemy: impartial.includes('⚔ ' + enemy),
        friendlyHasEnemy: friendlyBox.textContent.includes('⚔ ' + enemy),
        friendlyHasWorldTruth: friendlyBox.textContent.includes('✦ ' + worldTruth),
        dearHasEnemy: dearBox.textContent.includes('⚔ ' + enemy),
        dearHasWorldTruth: dearBox.textContent.includes('✦ ' + worldTruth),
        enemyBeforeWorldTruth: enemyIdx >= 0 && wtIdx >= 0 && enemyIdx < wtIdx,
      };
    });

    expect(r.enemy, 'yael has an authored enemy line').toBeTruthy();
    expect(r.impartialHasEnemy, 'Impartial (fav<1) does NOT reveal the enemy line').toBe(false);
    expect(r.friendlyHasEnemy, 'Friendly (fav>=1) reveals the enemy line').toBe(true);
    expect(r.friendlyHasWorldTruth, 'Friendly does NOT yet reveal the Dear-Friend worldTruth').toBe(false);
    expect(r.dearHasEnemy, 'Dear Friend still shows the enemy line').toBe(true);
    expect(r.dearHasWorldTruth, 'Dear Friend reveals the worldTruth line').toBe(true);
    expect(r.enemyBeforeWorldTruth, 'enemy footer sits above worldTruth on the card').toBe(true);
    expect(pageErrors).toEqual([]);
  });

  test('data-driven: every sampled Friendly NPC with meta.enemy renders the ⚔ footer (not a yael special case)', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await page.goto('/play.html');

    const r = await page.evaluate(() => {
      // NPCs that have BOTH a profile (else _renderNpcCard early-returns) and an authored enemy line.
      const keys = Object.keys(NPC_DIALOGUES)
        .filter(k => BIRKA_NPC_PROFILES[k] && NPC_DIALOGUES[k].meta && NPC_DIALOGUES[k].meta.enemy)
        .slice(0, 20);
      const missing = [], threw = [];
      for (const k of keys) {
        S_story.npcFavorability = { [k]: 1 };
        S_story.actNumber = 1;
        const box = document.createElement('div');
        try { _renderNpcCard(k, box); } catch (e) { threw.push(k + ': ' + String(e)); continue; }
        if (!box.textContent.includes('⚔ ' + NPC_DIALOGUES[k].meta.enemy)) missing.push(k);
      }
      return { sweepSize: keys.length, missing, threw };
    });

    expect(r.sweepSize, 'sampled NPCs with a profile + authored enemy line').toBeGreaterThan(10);
    expect(r.threw, 'no card throws rendering the enemy footer at Friendly').toEqual([]);
    expect(r.missing, 'every sampled Friendly NPC shows its ⚔ enemy footer').toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});

// §NPC-01-SF2 — NPCs wired into birkaNpcs (or the derived map) but with NO BIRKA_NPC_PROFILES entry
// used to hit `if(!p) return` in _renderNpcCard and render an EMPTY card (silently vanish). The fix
// synthesizes a lean profile from the dialogue meta (name/occupation), so they now render name +
// occupation + quote + the tier-gated ⚔/✦ footers. 9 such NPCs are actually wired (jimmy/sandy_cat/
// kenickie→CQ, isolde_voss/benedikt_rasp→SQ, rennau→STN, vonn→TL, solvak→VS, yva→GC).
test.describe('§NPC-01-SF2 — profile-less, dialogue-only NPCs render from dlg.meta instead of vanishing', () => {
  test('every dialogue-only NPC (no profile) renders name+occupation, and the ⚔ footer still fires at Friendly', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await page.goto('/play.html');

    const r = await page.evaluate(() => {
      // The premise: dialogue entries with meta.name but NO BIRKA_NPC_PROFILES entry.
      const orphans = Object.keys(NPC_DIALOGUES)
        .filter(k => !BIRKA_NPC_PROFILES[k] && NPC_DIALOGUES[k].meta && NPC_DIALOGUES[k].meta.name);
      const empty = [], nameMissing = [], occMissing = [], threw = [];
      for (const k of orphans) {
        const meta = NPC_DIALOGUES[k].meta;
        S_story.npcFavorability = { [k]: 0 };
        S_story.actNumber = 1;
        const box = document.createElement('div');
        try { _renderNpcCard(k, box); } catch (e) { threw.push(k + ': ' + String(e)); continue; }
        if (!box.textContent.trim()) { empty.push(k); continue; }      // the pre-fix bug: nothing rendered
        if (!box.textContent.includes(meta.name)) nameMissing.push(k);
        if (meta.occupation && !box.textContent.includes(meta.occupation)) occMissing.push(k);
      }

      // A profile-less NPC that also carries an enemy line (jimmy) shows the ⚔ footer at Friendly —
      // proving the §NPC-01-C footer logic reaches the synthesized-profile path too.
      let jimmyFriendlyEnemy = null;
      const jm = NPC_DIALOGUES['jimmy'];
      if (jm && !BIRKA_NPC_PROFILES['jimmy'] && jm.meta && jm.meta.enemy) {
        S_story.npcFavorability = { jimmy: 1 };
        S_story.actNumber = 1;
        const box = document.createElement('div');
        _renderNpcCard('jimmy', box);
        jimmyFriendlyEnemy = box.textContent.includes('⚔ ' + jm.meta.enemy);
      }

      return { orphanCount: orphans.length, empty, nameMissing, occMissing, threw, jimmyFriendlyEnemy };
    });

    expect(r.orphanCount, 'there are dialogue-only NPCs to guard (no profile, has meta.name)').toBeGreaterThan(5);
    expect(r.threw, 'no dialogue-only NPC throws in _renderNpcCard').toEqual([]);
    expect(r.empty, 'no dialogue-only NPC renders an empty card anymore (the SF2 bug)').toEqual([]);
    expect(r.nameMissing, 'every dialogue-only card shows its meta.name').toEqual([]);
    expect(r.occMissing, 'every dialogue-only card shows its meta.occupation').toEqual([]);
    expect(r.jimmyFriendlyEnemy, "jimmy (profile-less) shows the ⚔ enemy footer at Friendly").toBe(true);
    expect(pageErrors).toEqual([]);
  });

  test('end-to-end: a profile-less NPC (solvak) shows a card at its REAL wired node VS (was blank before SF2)', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    // solvak has NO BIRKA_NPC_PROFILES entry and is wired into birkaNpcs at VS (shown while
    // !vsDebtSettled, the fresh-state default). VS is a real NODE_MAP node — before SF2 the card
    // early-returned on !p and rendered nothing. Load the game standing on VS and assert the live row.
    const node = 'VS';
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true } });
    await dismissContinue(page);
    await expect(page.locator('#story-npc-cards-row')).toContainText('Debt Agent Solvak');
    expect(pageErrors).toEqual([]);
  });
});

// §NPC-01-SF5 — the_fisherman is SSJ's designated mentor (Yael signposts him; SSJ node text says he
// is "always here in the morning") and has a rich BIRKA_NPC_PROFILES entry that would derive a card
// at SSJ — but SSJ is a CURATED birkaNpcs key, and the literal-wins rule shadowed the derived map.
// The old `_ssjNpcs = emmerMet ? ['emmer'] : []` never listed him, so the mentor rendered no card
// (and NO card at all in fresh state, before Emmer is met). The fix lists him unconditionally.
test.describe('§NPC-01-SF5 — the Fisherman renders unconditionally at SSJ (was shadowed by the curated literal)', () => {
  test('fresh state (emmerMet=false): the Fisherman card shows at SSJ, Emmer does not yet', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    const node = 'SSJ';
    // SEED_STATE leaves emmerMet unset (falsey) → the old code rendered zero cards at SSJ.
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true } });
    await dismissContinue(page);
    const row = page.locator('#story-npc-cards-row');
    await expect(row).toContainText('The Fisherman');       // was absent before SF5 (empty _ssjNpcs)
    await expect(row).not.toContainText('Emmer Finch');     // Emmer is still state-gated on emmerMet
    expect(pageErrors).toEqual([]);
  });

  test('after meeting Emmer (emmerMet=true): both cards show, Fisherman first', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    const node = 'SSJ';
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true }, emmerMet: true });
    await dismissContinue(page);
    const row = page.locator('#story-npc-cards-row');
    await expect(row).toContainText('The Fisherman');
    await expect(row).toContainText('Emmer Finch');
    // order matches the curated literal ['the_fisherman','emmer'] — mentor first, apprentice second.
    const order = await row.evaluate(el => {
      const t = el.textContent;
      return t.indexOf('The Fisherman') < t.indexOf('Emmer Finch');
    });
    expect(order, 'the Fisherman card precedes Emmer on the SSJ row').toBe(true);
    expect(pageErrors).toEqual([]);
  });
});

// §NPC-01-SF6 — MERGE the derived map on top of a curated node instead of letting the literal fully
// shadow it (the SF5 root cause, generalized). A BIRKA_NPC_PROFILES profile whose .node points at a
// curated node (long_john_silver_sen@TL, archivus_sweelinck / ulrich_von_gessert@NUE) previously
// rendered NOWHERE. Now those "homeless" profiles are appended after the curated list — while the
// conditionally-hidden curated NPCs (connie_tuna before connieMet, pier before pierFalkWarm, vonn
// before tlLedgerRead) are NEVER un-gated by the always-on derived map: the curated block's maximal
// key set (_curatedGoverned) is excluded from the additions. Net effect: +3 previously-homeless
// cards, zero un-gating, curated nodes whose derived list == their governed keys stay byte-identical.
test.describe('§NPC-01-SF6 — homeless derived profiles at curated nodes are un-shadowed, without un-gating', () => {
  test('NUE (fresh): the two homeless profiles now render; the state-gated curated NPC (pier) does NOT', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    const node = 'NUE';
    // fresh state: pierFalkWarm unset → pier stays gated; gret is the unconditional curated NPC.
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true } });
    await dismissContinue(page);
    const row = page.locator('#story-npc-cards-row');
    await expect(row).toContainText('Gret Orrens');                 // curated (unconditional) — unchanged
    await expect(row).toContainText('Archivus Ptolemy Sweelinck');  // SF6: was homeless (profile.node=NUE, shadowed)
    await expect(row).toContainText('Ulrich von Gessert');          // SF6: was homeless
    await expect(row).not.toContainText('Pier Falk');               // regression guard: still state-gated on pierFalkWarm
    expect(pageErrors).toEqual([]);
  });

  test('TL (fresh): the homeless profile (Long John Silver) renders; the gated curated NPC (vonn) does NOT', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    const node = 'TL';
    // tlLedgerRead unset → the curated list is [] (vonn gated); only the SF6 addition should show.
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true } });
    await dismissContinue(page);
    const row = page.locator('#story-npc-cards-row');
    await expect(row).toContainText('Long John Silver');            // SF6: was homeless (profile.node=TL, shadowed)
    await expect(row).not.toContainText('Adjutant Vonn');           // regression guard: vonn gated on tlLedgerRead
    expect(pageErrors).toEqual([]);
  });

  test('AMS (fresh): the always-on derived map does NOT un-gate the conditionally-hidden curated NPCs', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    const node = 'AMS';
    // connie_tuna/aldo_sardino have profiles with .node=AMS (so they ARE in the derived map) but are
    // state-gated in the curated literal. A naive "curated ∪ derived" union would wrongly show them on
    // fresh state; _curatedGoverned excludes them. THIS is the core regression this increment prevents.
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true } });
    await dismissContinue(page);
    const row = page.locator('#story-npc-cards-row');
    await expect(row).not.toContainText('Connie Tuna');
    await expect(row).not.toContainText('Aldo Sardino');
    expect(pageErrors).toEqual([]);
  });

  test('AMS (connieMet=true): the curated gating still works — Connie appears when her flag is set', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    const node = 'AMS';
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true }, connieMet: true });
    await dismissContinue(page);
    await expect(page.locator('#story-npc-cards-row')).toContainText('Connie Tuna');
    expect(pageErrors).toEqual([]);
  });

  test('parity: LHR (curated == derived) gains no additions — exactly one card', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    const node = 'LHR';
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true } });
    await dismissContinue(page);
    const row = page.locator('#story-npc-cards-row');
    await expect(row).toContainText('Yael');
    const cardCount = await row.evaluate(el => el.querySelectorAll('.npc-card-chip').length);
    expect(cardCount, 'LHR still renders exactly the one curated card (yael) — derived adds nothing').toBe(1);
    expect(pageErrors).toEqual([]);
  });
});

// §NPC-01-D — a Talk action on the NPC card raises favor toward Friendly (fav 1) ONLY, so the ⚔ enemy
// footer becomes reachable by talking while Dear Friend (fav 2, the ✦ worldTruth footer) stays quest/
// personal-act earned — preserving the §NPC-01-C reveal. Cost model B (user pick): accumulate once per
// game-day (TALK_TO_FRIENDLY talks on distinct S_story.day values), no day burned. See
// lab-reports/lab-report-npc-01-d-talk-verb.md.
test.describe('§NPC-01-D — talk verb: reach Friendly (⚔) by talking, Dear Friend (✦) stays quest-earned', () => {
  test('button shows only at Impartial; N distinct-day talks reach Friendly and light the ⚔ footer; never exceeds fav 1', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await page.goto('/play.html');

    const r = await page.evaluate(() => {
      // A renderable NPC that has BOTH an enemy (⚔, Friendly) and a worldTruth (✦, Dear Friend) line,
      // so we can assert the ⚔ becomes reachable while the ✦ stays hidden. Exclude yael (onboarding
      // special-case + dearFriendBits auto-upgrade path) to keep the ceiling assertion clean.
      const key = Object.keys(NPC_DIALOGUES).find(k =>
        k !== 'yael' && NPC_DIALOGUES[k].meta && NPC_DIALOGUES[k].meta.enemy && NPC_DIALOGUES[k].meta.worldTruth
        && (BIRKA_NPC_PROFILES[k] || NPC_DIALOGUES[k].meta.name));
      const meta = NPC_DIALOGUES[key].meta;
      const TTF = TALK_TO_FRIENDLY;

      // fresh relationship state
      S_story.npcFavorability = {}; S_story.npcTalk = {}; S_story.day = 1; S_story.actNumber = 1;
      const render = () => { const b = document.createElement('div'); _renderNpcCard(key, b); return b; };

      // Impartial: Talk button present, ⚔ hidden
      const box0 = render();
      const buttonAtImpartial = !!box0.querySelector('.npc-talk-btn');
      const enemyAtImpartial  = box0.textContent.includes('⚔ ' + meta.enemy);

      // Cadence guard: two talks on the SAME day advance the counter only once
      _talkToNpc(key);                             // day 1 → count 1
      const afterTalk1  = (S_story.npcTalk[key] || {}).count;
      _talkToNpc(key);                             // day 1 again → blocked
      const afterSameDay = (S_story.npcTalk[key] || {}).count;

      // Progression: talk on distinct days up to the threshold → Friendly
      for (let d = 2; d <= TTF; d++) { S_story.day = d; _talkToNpc(key); }
      const favWhenReached = _npcFavor(key);
      const box1 = render();
      const buttonAtFriendly    = !!box1.querySelector('.npc-talk-btn');
      const enemyAtFriendly     = box1.textContent.includes('⚔ ' + meta.enemy);
      const worldTruthAtFriendly = box1.textContent.includes('✦ ' + meta.worldTruth);

      // Ceiling: keep talking on further days → favor NEVER climbs above 1 (Dear Friend is deed-earned)
      for (let d = TTF + 1; d <= TTF + 3; d++) { S_story.day = d; _talkToNpc(key); }
      const favAfterMoreTalk = _npcFavor(key);
      const box2 = render();
      const worldTruthStillHidden = !box2.textContent.includes('✦ ' + meta.worldTruth);

      return { key, TTF, buttonAtImpartial, enemyAtImpartial, afterTalk1, afterSameDay,
        favWhenReached, buttonAtFriendly, enemyAtFriendly, worldTruthAtFriendly,
        favAfterMoreTalk, worldTruthStillHidden };
    });

    expect(r.TTF, 'TALK_TO_FRIENDLY is a positive threshold').toBeGreaterThan(0);
    expect(r.buttonAtImpartial, 'Talk button renders while Impartial (fav 0)').toBe(true);
    expect(r.enemyAtImpartial, 'the ⚔ enemy footer is hidden at Impartial').toBe(false);
    expect(r.afterTalk1, 'first talk advances the counter to 1').toBe(1);
    expect(r.afterSameDay, 'a second talk the same game-day does NOT advance (cadence guard)').toBe(1);
    expect(r.favWhenReached, `${r.TTF} distinct-day talks reach Friendly (fav 1)`).toBe(1);
    expect(r.buttonAtFriendly, 'Talk button retires once Friendly (the ⚔ footer is the reward)').toBe(false);
    expect(r.enemyAtFriendly, 'the ⚔ enemy footer is now reachable by talking').toBe(true);
    expect(r.worldTruthAtFriendly, 'the ✦ worldTruth footer stays hidden — talk never reaches Dear Friend').toBe(false);
    expect(r.favAfterMoreTalk, 'talking further NEVER raises favor above 1 (Dear Friend is deed-earned)').toBe(1);
    expect(r.worldTruthStillHidden, 'the ✦ footer stays hidden no matter how much you talk').toBe(true);
    expect(pageErrors).toEqual([]);
  });

  test('end-to-end: clicking the live Talk button on a rendered card advances progress via _talkToNpc + storyRender', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    // ser_bardo@PSAGLD renders fresh at fav 0 (§NPC-01-B end-to-end case) → the Talk button is present.
    const node = 'PSAGLD';
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true } });
    await dismissContinue(page);
    const row = page.locator('#story-npc-cards-row');
    await expect(row).toContainText('Ser Bardo Albizzi');
    const talkBtn = row.locator('.npc-talk-btn').first();
    await expect(talkBtn).toBeVisible();               // button is live in the real card row
    await talkBtn.click();                              // click → _talkToNpc + storyRender re-render
    await expect(row.locator('.npc-talk-btn').first()).toContainText('1/' + await page.evaluate(() => TALK_TO_FRIENDLY));
    expect(pageErrors).toEqual([]);
  });
});

// §NPC-01-SF4 — the last three dead birkaNpcs codes (CQ/SQ/GC — never in NODE_MAP) remapped to the
// nodes their arcs actually render at, each proved by the arc's own render gate AND by the NPCs' own
// NPC_DIALOGUES meta.node: CQ→CDG (Layer 44 Ally Cat Arc; Jimmy is CDG's NODE_MAP npc), SQ→NUE
// (Layer 51 Weimar Scholar Gate; merged into the existing curated NUE entry), GC→TRD (Layer 55's
// Yva paid-info scene). All state-gating preserved verbatim — this is a pure key remap.
test.describe('§NPC-01-SF4 — dead codes CQ/SQ/GC remapped to CDG/NUE/TRD (cards render in live play)', () => {
  test('CDG (fresh): Jimmy renders at the Cat Quarter; Sandy/Kenickie stay quest-gated', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    const node = 'CDG';
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true } });
    await dismissContinue(page);
    const row = page.locator('#story-npc-cards-row');
    await expect(row).toContainText('Jimmy "Two-Tails" Carbonara'); // was wired to dead CQ → rendered nowhere
    await expect(row).not.toContainText('Sandy "Scratchpad" Mewlino'); // gated on quest_cat_02 complete
    await expect(row).not.toContainText('Kenickie Clawnickie Mancuso'); // gated on quest_cat_05 complete
    expect(pageErrors).toEqual([]);
  });

  test('CDG (cat quests complete): Sandy and Kenickie join Jimmy — gating preserved verbatim', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    const node = 'CDG';
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true },
      quests: { quest_cat_02: 'complete', quest_cat_05: 'complete' } });
    await dismissContinue(page);
    const row = page.locator('#story-npc-cards-row');
    await expect(row).toContainText('Jimmy "Two-Tails" Carbonara');
    await expect(row).toContainText('Sandy "Scratchpad" Mewlino');
    await expect(row).toContainText('Kenickie Clawnickie Mancuso');
    expect(pageErrors).toEqual([]);
  });

  test('NUE (fresh): Isolde joins the merged curated entry; Benedikt stays gated on wmArchiveComplete', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    const node = 'NUE';
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true } });
    await dismissContinue(page);
    const row = page.locator('#story-npc-cards-row');
    await expect(row).toContainText('Gret Orrens');            // pre-existing curated NUE NPC — unchanged
    await expect(row).toContainText('Archivist Isolde Voss');  // was wired to dead SQ → rendered nowhere
    await expect(row).not.toContainText('Benedikt Rasp');      // gated on wmArchiveComplete
    expect(pageErrors).toEqual([]);
  });

  test('NUE (wmArchiveComplete): Benedikt appears — SQ gating preserved verbatim', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    const node = 'NUE';
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true },
      wmArchiveComplete: true });
    await dismissContinue(page);
    const row = page.locator('#story-npc-cards-row');
    await expect(row).toContainText('Archivist Isolde Voss');
    await expect(row).toContainText('Benedikt Rasp');
    expect(pageErrors).toEqual([]);
  });

  test('TRD: Yva renders only inside her window (vsDebtProbed && !vsWeaponsFound)', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    const node = 'TRD';
    // fresh: vsDebtProbed unset → no Yva card
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true } });
    await dismissContinue(page);
    await expect(page.locator('#story-npc-cards-row')).not.toContainText('Goblin broker');
    // inside the window: vsDebtProbed=true, vsWeaponsFound unset → Yva renders (was wired to dead GC)
    await seedAndLoad(page, { currentCode: node, checkpointNode: node, visited: { [node]: true },
      vsDebtProbed: true });
    await dismissContinue(page);
    await expect(page.locator('#story-npc-cards-row')).toContainText('Goblin broker');
    expect(pageErrors).toEqual([]);
  });

  test('source guard: no dead CQ/SQ/GC keys remain in the birkaNpcs literal', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const src = storyRender.toString();
      const litDecl = src.slice(src.indexOf('const birkaNpcs ='), src.indexOf('_npcNodeKey'));
      return {
        deadKeys: ['CQ', 'SQ', 'GC'].filter(k => new RegExp('[,{\\n]\\s*' + k + ':').test(litDecl)),
        cdgCurated: /[,{]\s*CDG:/.test(litDecl),
        trdCurated: /[,{\n]\s*TRD:/.test(litDecl),
      };
    });
    expect(r.deadKeys, 'no dead node code is a birkaNpcs key anymore').toEqual([]);
    expect(r.cdgCurated, 'CDG carries the remapped cat-cluster entry').toBe(true);
    expect(r.trdCurated, 'TRD carries the remapped Yva entry').toBe(true);
  });
});
