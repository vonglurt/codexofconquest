// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ft — `S_story.storyAct` is campaign progress: one act per shard held, Act VIII with
// the seventh. It replaced `actNumber`, the act of the tile under the player, which every
// act-gated beat had read as progress and which no Birka node could raise above 1.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const GAME = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'play.html'), 'utf8');
const core = require('../../js/wbapi-core.js');

function extractFn(name) {
  const start = GAME.indexOf('function ' + name + '(');
  let i = GAME.indexOf('{', start), depth = 0, quote = null;
  for (; i < GAME.length; i++) {
    const ch = GAME[i];
    if (quote) { if (ch === quote && GAME[i - 1] !== '\\') quote = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return GAME.slice(start, i + 1);
  }
  throw new Error('unterminated: ' + name);
}

function advance(state) {
  const sandbox = { S_story: { ...state } };
  vm.createContext(sandbox);
  vm.runInContext(extractFn('_advanceStoryAct') + '\n_advanceStoryAct();', sandbox);
  return sandbox.S_story.storyAct;
}

const code = GAME.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');

test('§DX-02ft — each shard held opens the next act, and the seventh opens Act VIII', () => {
  expect([0, 1, 2, 3, 4, 5, 6, 7].map(shards => advance({ shards }))).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
});

test('§DX-02ft — the act never falls, and a save without the field derives it from its shards', () => {
  expect(advance({ shards: 2, storyAct: 5 })).toBe(5);
  expect(advance({ shards: 4 })).toBe(5);
  expect(advance({})).toBe(1);
});

test('§DX-02ft — the shard nodes agree: shard #k lies in act k+1, and the final battle wants all seven', () => {
  const { nodeMap } = core.load(path.resolve(__dirname, '..', '..', '..', 'play.html'));
  const byShard = {};
  for (const n of Object.values(nodeMap)) {
    const m = (n.loot || '').match(/Shard #(\d)/);
    if (m) byShard[m[1]] = n.act;
  }
  expect([1, 2, 3, 4, 5].map(k => byShard[k])).toEqual([2, 3, 4, 5, 6]);
  expect(nodeMap.TLS.act).toBe(8);
  expect(nodeMap.TLS.finalBattle.minShards).toBe(7);
});

test('§DX-02ft — the act advances where shards are gained and where saves are restored', () => {
  expect(extractFn('storyCollectLoot')).toMatch(/S_story\.shards = Math\.min\(7, S_story\.shards \+ 1\);\s*_advanceStoryAct\(\);/);
  expect(extractFn('storyLoadSave')).toContain('_advanceStoryAct();');
  expect(extractFn('storyCheckContinue')).toContain('_advanceStoryAct();');
});

test('§DX-02ft — no engine code reads actNumber, and the Act VIII farewell reads storyAct', () => {
  expect(code).not.toMatch(/S_story\.actNumber/);
  expect(extractFn('_renderNpcCard')).toContain('(S_story.storyAct || 1) === 8');
});
