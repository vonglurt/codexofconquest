// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02ee — `retryGateDays: 0` could not mean what it says, and `=null` could not remove it.
//
// The retry cooldown is decided in one place: `S_story.day < att.lastDay +
// (q.retryGateDays || 1)`. `0` is falsy, so `(0 || 1)` is `1` — writing
// `retryGateDays: 0` was byte-for-byte equivalent to omitting the field, and 42
// quests carried a one-day cooldown their authors had written `0` to remove.
// The call was (b): delete the field from all 42 and keep the coercion, so the
// data says what the engine does and the field keeps exactly one meaning.
//
// Removing them exposed the second defect. `null clears a field` is what
// `./bin/api help` promises, and it held for QUOTED values only — a numeric or
// boolean field matched neither strip pattern, so a PUT of `=null` returned
// `field "x" not found on "y" or strip failed` on a field plainly present.
// `removeStringField` now takes a second pass over unquoted scalars.
//
// Pure-node (no browser): an authoring-surface invariant plus a corpus census.
// Every write runs against an in-memory copy — `play.html` is never written.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8');

function freshWorld(src) {
  delete require.cache[require.resolve(path.join(ROOT, 'src', 'js', 'wbapi-core.js'))];
  const W = require(path.join(ROOT, 'src', 'js', 'wbapi-core.js'));
  W.load(src || SRC);
  return W;
}

// The operator-visible truth: parse back what the writer produced.
const roundTrip = (W) => freshWorld(W._rawSrc);

test.describe('§DX-02ee — the corpus census', () => {

  test('no quest carries retryGateDays: 0', () => {
    const W = freshWorld();
    const zeros = Object.entries(W.questDb).filter(([, q]) => q.retryGateDays === 0);
    expect(zeros.map(([k]) => k)).toEqual([]);
  });

  test('the deliberate one-day gates survive', () => {
    const W = freshWorld();
    const ones = Object.values(W.questDb).filter((q) => q.retryGateDays === 1);
    expect(ones.length).toBe(21);
  });

  test('the engine still coerces, so the field keeps one meaning', () => {
    expect(SRC).toContain('retryGateDays || 1');
    expect(SRC).not.toContain('retryGateDays ?? 1');
  });
});

test.describe('§DX-02ee — =null clears an unquoted scalar', () => {

  test('a numeric field is removed and the removal survives a re-parse', () => {
    const W = freshWorld();
    const [key] = Object.entries(W.questDb).find(([, q]) => q.retryGateDays === 1);
    const before = JSON.parse(JSON.stringify(W.questDb[key]));

    const r = W.editField('quest', key, 'retryGateDays', null);
    expect(r.ok).toBe(true);
    expect(r.removed).toBe(true);

    const after = roundTrip(W).questDb[key];
    expect('retryGateDays' in after).toBe(false);

    // Exactly one key moved. A strip that swallowed a neighbour would land here.
    delete before.retryGateDays;
    expect(after).toEqual(before);
  });

  test('a boolean field is removed the same way', () => {
    const W = freshWorld();
    const [key] = Object.entries(W.questDb).find(([, q]) => typeof q.retryable === 'boolean');
    const before = JSON.parse(JSON.stringify(W.questDb[key]));

    expect(W.editField('quest', key, 'retryable', null).ok).toBe(true);

    const after = roundTrip(W).questDb[key];
    expect('retryable' in after).toBe(false);
    delete before.retryable;
    expect(after).toEqual(before);
  });

  test('a quoted field still clears — the first pass is not shadowed', () => {
    const W = freshWorld();
    const [key] = Object.entries(W.questDb).find(([, q]) => typeof q.hint === 'string' && q.hint);
    expect(W.editField('quest', key, 'hint', null).ok).toBe(true);
    expect('hint' in roundTrip(W).questDb[key]).toBe(false);
  });

  test('an absent field is still refused rather than half-matched', () => {
    const W = freshWorld();
    const [key] = Object.entries(W.questDb).find(([, q]) => !('retryGateDays' in q));
    const r = W.editField('quest', key, 'retryGateDays', null);
    expect(r.ok).toBe(false);
  });

  test('a structured field is left to editStructuredField, not half-removed', () => {
    const W = freshWorld();
    const [key] = Object.entries(W.questDb).find(([, q]) => Array.isArray(q.bits) && q.bits.length);
    const before = JSON.parse(JSON.stringify(W.questDb[key]));

    const r = W.editField('quest', key, 'bits', null);
    expect(r.ok).toBe(false);
    expect(roundTrip(W).questDb[key]).toEqual(before);
  });
});
