// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02al — the NPC-speak system prompt carries what the character believes and whom
// they oppose, joined from NPC_DIALOGUES[key].meta onto the BIRKA_NPC_PROFILES voice, and
// emits each line only where it is authored.
//
// Pure-node (no browser): `/api/npc/{id}/speak` builds its system block with
// WBAPI.npcSpeakSystem, so the prompt is asserted without a network call or an API key.

const { test, expect } = require('@playwright/test');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const GAME = path.join(ROOT, 'play.html');

function freshWorld() {
  delete require.cache[require.resolve(path.join(ROOT, 'src', 'js', 'wbapi-core.js'))];
  const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
  W.load(GAME);
  return W;
}

const BELIEF = 'What you believe about the world:';
const ENEMY  = 'Who you set yourself against:';

test.describe('§DX-02al — NPC-speak prompt joins NPC_DIALOGUES meta', () => {
  test('the_fisherman carries both meta lines, verbatim from the registry', () => {
    const W = freshWorld();
    const meta = W.npcDialogues.the_fisherman.meta;
    const { text } = W.npcSpeakSystem('the_fisherman', 'neutral');
    expect(text).toContain(`${BELIEF} ${meta.worldTruth}`);
    expect(text).toContain(`${ENEMY} ${meta.enemy}`);
  });

  test('emmer has worldTruth and no enemy, so exactly one meta line', () => {
    const W = freshWorld();
    expect(W.npcDialogues.emmer.meta.enemy).toBeUndefined();
    const { text } = W.npcSpeakSystem('emmer', 'dearFriend');
    expect(text).toContain(BELIEF);
    expect(text).not.toContain(ENEMY);
  });

  test('every speaking profile: no undefined interpolation, one line per authored field', () => {
    const W = freshWorld();
    const keys = Object.keys(W.birkaNpcs);
    expect(keys.length).toBeGreaterThan(0);
    for (const k of keys) {
      const meta = (W.npcDialogues[k] || {}).meta || {};
      const { text } = W.npcSpeakSystem(k, 'neutral');
      expect(text, k).not.toMatch(/\bundefined\b|\bnull\b/);
      expect(text.includes(BELIEF), k).toBe(!!meta.worldTruth);
      expect(text.includes(ENEMY), k).toBe(!!meta.enemy);
    }
  });

  test('an unknown key builds no prompt', () => {
    const W = freshWorld();
    expect(W.npcSpeakSystem('no_such_person', 'neutral')).toBeNull();
  });
});
