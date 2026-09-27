// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §GR-FU3 — Dear Friend+ (favor 3) for auros and pachelbel: a DEAR_FRIEND_PLUS_BITS act,
// granted once by _checkDearFriendUpgrade beside the Dear-Friend step, so the tier their
// ceremony and epilogue lines were written for can be reached.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const GAME = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'play.html'), 'utf8');

function slice(startMarker) {
  const start = GAME.indexOf(startMarker);
  let i = GAME.indexOf('{', start), depth = 0, quote = null;
  for (; i < GAME.length; i++) {
    const ch = GAME[i];
    if (quote) { if (ch === quote && GAME[i - 1] !== '\\') quote = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return GAME.slice(start, i + 1);
  }
  throw new Error('unterminated: ' + startMarker);
}

function run(state, keys) {
  const said = [];
  const sandbox = { S_story: { quests: {}, npcFavorability: {}, ...state }, said };
  vm.createContext(sandbox);
  vm.runInContext([
    slice('const DEAR_FRIEND_BITS = {') + ';',
    slice('const DEAR_FRIEND_PLUS_BITS = {') + ';',
    'const NPC_FAVOR_CAP = 3;',
    'function _npcFavor(k) { return S_story.npcFavorability[k] || 0; }',
    'function _npcDisplayName(k) { return k; }',
    'function storyMsg(m) { said.push(m); }',
    slice('function _checkDearFriendUpgrade('),
    ...keys.map(k => `_checkDearFriendUpgrade('${k}');`),
  ].join('\n'), sandbox);
  return { fav: sandbox.S_story.npcFavorability, st: sandbox.S_story, said };
}

test('§GR-FU3 — auros steps from Dear Friend to 3 on the undercity survey, once', () => {
  const r = run({ npcFavorability: { auros: 2 }, undercitySurveyDelivered: true }, ['auros', 'auros']);
  expect(r.fav.auros).toBe(3);
  expect(r.st.dearFriendPlusGranted).toEqual({ auros: true });
  expect(r.said).toEqual(['💛 auros counts you among the few.']);
});

test('§GR-FU3 — pachelbel takes both steps in one check when both acts are done', () => {
  const r = run({ npcFavorability: { pachelbel: 1 }, raisonToolsUsed: true,
    quests: { quest_pachelbel_shipment: 'complete' } }, ['pachelbel']);
  expect(r.fav.pachelbel).toBe(3);
  expect(r.said).toHaveLength(2);
});

test('§GR-FU3 — no act, no step; and a granted step never repeats after favor is restored', () => {
  expect(run({ npcFavorability: { auros: 2 } }, ['auros']).fav.auros).toBe(2);
  const r = run({ npcFavorability: { auros: 2 }, undercitySurveyDelivered: true,
    dearFriendPlusGranted: { auros: true } }, ['auros']);
  expect(r.fav.auros).toBe(2);
});

test('§GR-FU3 — the step is checked where each act is recorded, and New Game+ keeps the record', () => {
  expect(GAME).toMatch(/S_story\.raisonToolsUsed = true;\s*_checkDearFriendUpgrade\('pachelbel'\);/);
  expect(GAME).toMatch(/S_story\.undercitySurveyDelivered = true;\s*_checkDearFriendUpgrade\('auros'\);/);
  expect(GAME).toContain('S_story.dearFriendPlusGranted = savedDearFriendPlus;');
});
