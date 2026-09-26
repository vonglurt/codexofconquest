// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ed — `_gateFlagSet` collects the flags of every leaf of an activation gate,
// including leaves under the {all} / {any} / {not} combinators `_compileGate` reads.
// A flag it misses is one `_takeMissionBit` will clear, un-witnessing a gate.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const GAME = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'play.html'), 'utf8');

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

function gateFlagSet(questDb) {
  const sandbox = { QUEST_DB: questDb };
  vm.createContext(sandbox);
  vm.runInContext('let _gateFlagCache = null;\n' + extractFn('_gateFlagSet') +
    '\nthis.out = [..._gateFlagSet()].sort();', sandbox);
  return sandbox.out;
}

test('§DX-02ed — a leaf gate still yields its three flag lists', () => {
  expect(gateFlagSet({
    a: { gate: { flags: ['f'], flagsAny: ['g'], notFlags: ['h'] } },
    b: {},
  })).toEqual(['f', 'g', 'h']);
});

test('§DX-02ed — flags nested under all / any / not are collected', () => {
  expect(gateFlagSet({
    a: { gate: { any: [{ flags: ['x'] }, { flagsAny: ['y'] }] } },
    b: { gate: { all: [{ not: { notFlags: ['z'] } }, { any: [{ flags: ['w'] }] }] } },
  })).toEqual(['w', 'x', 'y', 'z']);
});
