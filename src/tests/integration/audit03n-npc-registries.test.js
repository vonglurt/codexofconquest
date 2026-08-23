// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §AUDIT-03n — the ENGINE-side NPC references resolve too, not just the node ones.
//
// The npc-key twin of §AUDIT-03j. Seven engine registries were keyed to the profiles'
// SURNAMES — 'couperin' / 'weckmann' / 'bruhns' — which the favor ledger never writes:
//
//   SWEELINCK_NAMING_LINES · NPC_EPILOGUES · NPC_NG_PLUS_GREETINGS
//   ROUGH_WHISKEY_REACTIONS · NPC_ACT_THREE_LINES · FROBERGER_TRACES · NPC_CROSS_REFS
//
// 21 authored entries unreachable, plus SIX live code references the row never named: the
// epilogue's own `npcOrder`, and five `_npcFavor('bruhns')` gate sites (the §XXXVII CO
// scene, the Weckmann/Auros joint conversation, the S29 theory line, the Froberger
// cross-item beat, and the "Show Auros the undercity survey" delivery button).
//
// The sharpest consequence was in the ENDING: the epilogue builder read
// npcFavorability['couperin'|'weckmann'|'bruhns'], always 0, so the victory screen showed
// the STRANGER epilogue for Quill, Weckmann and Bruhns no matter how close you got.
// The two behaviour tests below are the ones that actually prove the repair.
//
// `check:npcregs` (check:walk gate #14) is the durable fence; this file pins the specific
// repairs and the behaviour they buy.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { SEED_STATE, seedAndLoad, dismissContinue } = require('./helpers');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const GAME = path.join(ROOT, 'play.html');

function freshWorld() {
  delete require.cache[require.resolve(path.join(ROOT, 'src', 'js', 'wbapi-core.js'))];
  const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
  W.load(GAME);
  return W;
}
const src = () => fs.readFileSync(GAME, 'utf8');

// The surnames that keyed these tables. `quill` = Bard Tomas Couperin, `crov` = Pit Master
// Weckmann, `auros` = Cmdr Seraphine Bruhns — the profile keys the ledger actually spends.
const SURNAMES = ['couperin', 'weckmann', 'bruhns'];
// The seven repaired registries, and the six keys each must now carry.
const REPAIRED = ['SWEELINCK_NAMING_LINES', 'NPC_EPILOGUES', 'NPC_NG_PLUS_GREETINGS',
                  'ROUGH_WHISKEY_REACTIONS', 'NPC_ACT_THREE_LINES', 'FROBERGER_TRACES',
                  'NPC_CROSS_REFS'];
const CANON = ['yael', 'brynn', 'quill', 'pachelbel', 'crov', 'auros'];

// Depth-1 keys of a top-level `const NAME = {` … `};`, via the shared comment/string-aware
// scanner (a private scanner would drift — §AUDIT-03f).
function topKeys(W, s, name) {
  const m = s.match(new RegExp(`^const ${name} = \\{`, 'm'));
  if (!m) return null;
  const open = s.indexOf(m[0]) + m[0].length - 1;
  const tail = s.slice(open);
  let depth = 0, end = -1;
  for (const t of W._scanTokens(tail)) {
    if (t.open) { depth++; continue; }
    if (t.close) { depth--; if (depth === 0) { end = t.index; break; } }
  }
  return end < 0 ? null : W._sectionTopKeys(tail.slice(0, end + 1));
}

test.describe('§AUDIT-03n — engine NPC registries resolve', () => {

  test('the three surnames are keys in NO registry, and no live code names them', () => {
    const W = freshWorld();
    const vocab = W.npcKeyVocab();
    // They must stay unresolvable: if a profile is ever created under a surname, these
    // registries would silently start resolving to a SECOND heading for one character
    // (the §AUDIT-03k split), which is not the repair.
    for (const s of SURNAMES) expect(vocab.has(s), `${s} became a live NPC key`).toBe(false);

    const text = src();
    // Only comments and DOM ids may still contain the words. Assert on code shapes.
    for (const s of SURNAMES) {
      expect(text, `${s} still keys a registry entry`).not.toMatch(new RegExp(`^\\s*${s}\\s*:`, 'm'));
      expect(text, `${s} still gates live logic`).not.toContain(`_npcFavor('${s}')`);
      expect(text, `${s} still read from the favor ledger`).not.toContain(`npcFavorability['${s}']`);
    }
  });

  test('all seven repaired registries carry exactly the six canonical profile keys', () => {
    const W = freshWorld();
    const s = src();
    for (const name of REPAIRED) {
      const keys = topKeys(W, s, name);
      expect(keys, `${name} not found`).not.toBeNull();
      expect(keys.slice().sort(), `${name} keys`).toEqual(CANON.slice().sort());
    }
  });

  test('every npc-keyed registry key resolves in the 4-registry vocabulary', () => {
    const W = freshWorld();
    const vocab = W.npcKeyVocab();
    const s = src();
    // The full NPC_KEYED list that gate #14 enforces — pinned here so the two cannot drift.
    const NPC_KEYED = ['ACT8_FAREWELL_BEATS', 'NPC_VOID_PRESSURE_LINES', 'NPC_NG_MEMORY_LINES',
                       'NPC_FAREWELLS', 'NPC_ROMANCE_PREAMBLES', 'NPC_ROMANCE_VIGNETTES',
                       ...REPAIRED];
    const dead = [];
    for (const name of NPC_KEYED) {
      const keys = topKeys(W, s, name);
      expect(keys, `${name} not found`).not.toBeNull();
      for (const k of keys) if (!vocab.has(k)) dead.push(`${name}.${k}`);
    }
    expect(dead, `dead registry keys: ${dead.join(', ')}`).toEqual([]);
    // Negative control — the check is not vacuous.
    expect(vocab.has('couperin')).toBe(false);
    expect(vocab.has('quill')).toBe(true);
  });

  test('the two npcOrder walk-lists agree, and both name only live keys', () => {
    const W = freshWorld();
    const vocab = W.npcKeyVocab();
    const orders = [...src().matchAll(/npcOrder\s*=\s*\[([^\]]*)\]/g)]
      .map(m => (m[1].match(/'([a-z_]+)'/g) || []).map(q => q.slice(1, -1)));
    // The disagreement between these two lists was the tell that one of them was wrong.
    expect(orders.length).toBe(2);
    expect(orders[0].slice().sort()).toEqual(orders[1].slice().sort());
    for (const list of orders) for (const k of list) expect(vocab.has(k), `${k} in an npcOrder`).toBe(true);
  });

  // ── behaviour: the ending is the reason this row mattered ────────────────────
  test('the epilogue renders the earned variant for Quill/Weckmann/Bruhns, not the stranger one', async ({ page }) => {
    await seedAndLoad(page, { ...SEED_STATE, currentCode: 'LHR', checkpointNode: 'LHR' });
    await dismissContinue(page);

    const at = fav => page.evaluate(f => {
      S_story.npcFavorability = { yael: f, brynn: f, quill: f, pachelbel: f, crov: f, auros: f };
      // Clear the Cursed-Seal-Echo early return (`!missionComplete && curseScore >= 15`),
      // which replaces the whole scroll and would make this test vacuous: a fresh save has
      // 20 EB contracts never started = curse 20. All 20 returned scores -5.
      S_story.ebReturnDone = {};
      _EB_CODES.forEach(c => { S_story.ebReturnDone[c] = true; });   // eslint-disable-line no-undef
      return _buildEpilogueScroll();          // eslint-disable-line no-undef
    }, fav);

    const stranger = await at(0);
    const dear     = await at(3);

    // At favor 0 the three read as strangers — the state the ending was STUCK in.
    expect(stranger.join('\n')).toContain('Quill is still in debt');
    expect(stranger.join('\n')).toContain('Weckmann is still running the pit');
    expect(stranger.join('\n')).toContain('Auros submitted another report');

    // At favor 3 they must not. Before this row every one of these was unreachable.
    const dearText = dear.join('\n');
    expect(dearText).not.toContain('Quill is still in debt');
    expect(dearText).not.toContain('Weckmann is still running the pit');
    expect(dearText).not.toContain('Auros submitted another report');
    expect(dearText).toContain('He plays the song every Friday');
    expect(dearText).toContain('started a second class on Thursdays');
    expect(dearText).toContain('She submitted it jointly with a Scholar King archivist');
  });

  test('the Weckmann/Auros joint conversation at HKG can fire — it ANDed a live key with a dead one', async ({ page }) => {
    const msgs = [];
    page.on('console', m => msgs.push(m.text()));
    await seedAndLoad(page, { ...SEED_STATE, currentCode: 'HKG', checkpointNode: 'HKG' });
    await dismissContinue(page);

    // S6 requires crov >= 1 AND auros >= 1. `auros` was spelled `bruhns`, so the whole
    // condition was unsatisfiable regardless of how the player played.
    const line = await page.evaluate(async () => {
      S_story.npcFavorability = { crov: 1, auros: 1 };
      S_story.s6JointDelivered = false;
      const seen = [];
      const realMsg = window.storyMsg;
      window.storyMsg = t => { seen.push(t); return realMsg ? realMsg(t) : undefined; };
      storyRender(NODE_MAP['HKG']);           // eslint-disable-line no-undef
      await new Promise(r => setTimeout(r, 700));   // the line is emitted on a 400ms defer
      window.storyMsg = realMsg;
      return { seen, delivered: !!S_story.s6JointDelivered };
    });

    expect(line.delivered, 'the S6 joint-conversation guard never fired').toBe(true);
    expect(line.seen.join('\n')).toMatch(/Weckmann and Auros are talking|You arrive mid-conversation/);
  });
});
