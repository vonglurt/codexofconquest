// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §AUDIT-03k — one character, one key.
//
// The defect one level up from §AUDIT-03j/n. There the key resolved NOWHERE; here it
// resolves to a SECOND heading for someone who already has one. A node's inline `npc` is
// supposed to be a display name (§AUDIT-03h), so slugifying it mints a rival key for the
// person standing at that node: `city_guard_captain` held 5 quests while `yael` — the same
// woman, named in LHR's own node text — held 17, and `_questsByNpc` indexed her twice. The
// delete guard, `./api.sh location`, and every quest-count surface saw one half at a time.
//
// Nothing in the GAME reads `quest.npc` (it is authoring metadata), which is exactly why
// this rotted quietly for months: the split is invisible from the player's side and only
// ever wrong on the authoring side.
//
// The repair is three-part and each part is pinned below:
//   1. WBAPI.NPC_ALIASES  — the 7 display-name slugs, each collapsing to a profile key
//   2. normalize on write — editField (PUT/batch) and the create path both canonicalize
//   3. check:npcregs #5   — no `npc:` value may be an alias, and a NEW collision must be
//                           classified by a human rather than resolved by a heuristic
//
// The alias slugs are deliberately NOT in npcKeyVocab(): a quest still carrying one must
// advise-warn, not validate alongside the real key.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const GAME = path.join(ROOT, 'roll2hit-v3.html');

function freshWorld() {
  delete require.cache[require.resolve(path.join(ROOT, 'js', 'wbapi-core.js'))];
  const W = require(path.join(ROOT, 'js', 'wbapi-core.js'));
  W.load(GAME);
  return W;
}
const src = () => fs.readFileSync(GAME, 'utf8');

test.describe('§AUDIT-03k — one character, one npc key', () => {

  test('every alias is a live inline display name, resolves to a live profile key, and is NOT itself in the vocabulary', () => {
    const W = freshWorld();
    const vocab = W.npcKeyVocab();
    const inline = new Set(Object.values(W.nodeMap).filter(n => n && n.npc)
      .map(n => String(n.npc).toLowerCase().replace(/\s/g, '_')));

    const aliases = Object.entries(W.NPC_ALIASES);
    expect(aliases.length, 'the alias map emptied out').toBeGreaterThan(0);
    for (const [slug, target] of aliases) {
      expect(inline.has(slug), `${slug} is no longer any node's inline npc — the row is stale`).toBe(true);
      expect(vocab.has(target), `${slug} → ${target}, which resolves in no registry`).toBe(true);
      expect(vocab.has(slug), `${slug} still validates alongside ${target}`).toBe(false);
      expect(W.npcCanonicalKey(slug)).toBe(target);
    }
    // Identity for a key that is not an alias — the resolver must not be a rewriter.
    expect(W.npcCanonicalKey('yael')).toBe('yael');
    expect(W.npcCanonicalKey('the_fisherman')).toBe('the_fisherman');
  });

  test('no authored `npc:` value is an alias, and Yael is one person again', () => {
    const W = freshWorld();
    const text = src();
    for (const slug of Object.keys(W.NPC_ALIASES)) {
      expect(text, `npc:"${slug}" is still authored somewhere`).not.toMatch(
        new RegExp(`\\bnpc\\s*:\\s*["']${slug.replace(/[-]/g, '\\-')}["']`));
    }
    // The split that opened the row: 17 + 5, now indexed under one heading.
    expect((W._questsByNpc['city_guard_captain'] || []).length).toBe(0);
    expect((W._questsByNpc['yael'] || []).length).toBe(22);
    // The five that moved — the Froberger NG+ set, the Jullean scene, the courier release.
    for (const id of ['quest_ng_01', 'quest_ng_02', 'quest_ng_03', 'quest_sir_jullean', 'quest_courier_release'])
      expect(W.questDb[id].npc, `${id} anchor`).toBe('yael');
    // LHR's DISPLAY name is untouched — normalizing that would be the §AUDIT-03h bug.
    expect(W.nodeMap.LHR.npc).toBe('City Guard Captain');
  });

  test('editField normalizes a quest anchor on write, and only a quest anchor', () => {
    const W = freshWorld();
    // The write path is the fence that stops the split re-forming one quest at a time.
    const r = W.editField('quest', 'quest_courier_release', 'npc', 'city_guard_captain');
    expect(r.ok).toBe(true);
    expect(r.value).toBe('yael');
    expect(r.aliased).toEqual({ from: 'city_guard_captain', to: 'yael' });
    expect(W.questDb['quest_courier_release'].npc).toBe('yael');
    // …and it reaches the SOURCE, not just the model (§DX-02h's lesson).
    expect(W._rawSrc).not.toContain('npc:"city_guard_captain"');

    // A node's inline npc must survive untouched: it is a display name by design.
    const rn = W.editField('node', 'LHR', 'npc', 'City Guard Captain');
    expect(rn.ok).toBe(true);
    expect(rn.aliased).toBeUndefined();
    expect(W.nodeMap.LHR.npc).toBe('City Guard Captain');
    // In-memory only — nothing was saved; the on-disk file is untouched by this test.
    expect(src()).toContain('npc:"yael"');
  });

  test('check:npcregs phase 5 catches both shapes — an aliased anchor and an unclassified collision', () => {
    // Run the gate's own selftest: it plants a defect per phase and requires each to
    // produce a finding the clean corpus does not. `alias` appears twice — the authored
    // anchor (source plant) and a new colliding display name (model plant).
    const out = execFileSync('node', [path.join(ROOT, 'scripts', 'check-npcregs.js'), '--selftest'],
      { cwd: ROOT, encoding: 'utf8' });
    const alias = out.split('\n').filter(l => l.startsWith('✓ selftest[alias]'));
    expect(alias.length, out).toBe(2);
    expect(alias[0]).toContain('city_guard_captain');
    expect(alias[1]).toContain('classify it');
  });

  test('the gate is green on the live corpus', () => {
    const out = execFileSync('node', [path.join(ROOT, 'scripts', 'check-npcregs.js')],
      { cwd: ROOT, encoding: 'utf8' });
    expect(out).toContain('✓ check:npcregs');
    expect(out).toContain('display-name aliases collapse to their profile key');
  });

  test('ship_captain stays a separate person — a role collision is not an identity', () => {
    const W = freshWorld();
    // SEN is the Tilbury Star; captain_smollett_sen captains the Hispaniola at HMS. The
    // occupation matches exactly, which is why the gate classifies explicitly instead of
    // letting a heuristic merge them.
    expect(W.NPC_ALIASES['ship_captain']).toBeUndefined();
    expect(W.npcCanonicalKey('ship_captain')).toBe('ship_captain');
    expect(W.birkaNpcs['captain_smollett_sen'].node).toBe('HMS');
    expect(W.nodeMap.SEN.npc).toBe('Ship Captain');
    expect((W._questsByNpc['ship_captain'] || []).length).toBeGreaterThan(0);
    // …and the classification is recorded where the gate reads it, with a reason.
    const gate = fs.readFileSync(path.join(ROOT, 'scripts', 'check-npcregs.js'), 'utf8');
    expect(gate).toMatch(/NOT_AN_ALIAS = \{[\s\S]*ship_captain:/);
  });
});
