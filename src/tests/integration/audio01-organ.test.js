// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §AUDIO-01 — the organ extracted from src/sources/5thOrgan.html into the game, run against a
// fake AudioContext. Pins its registration (§DX-02am), the canon's releases and the loop seam
// (§DX-02an), and the three stops storyRender sets from the run.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const GAME = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'play.html'), 'utf8');
const BLOCK = GAME.slice(GAME.indexOf('const ORGAN_MOTIF = ['), GAME.indexOf("document.addEventListener('pointerdown', function _organResume"));

function fakeCtx() {
  const param = (value) => ({ value, setValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {} });
  const node = (extra) => ({ connect() {}, disconnect() {}, ...extra });
  return {
    currentTime: 0, state: 'running', destination: {},
    createGain: () => node({ gain: param(1) }),
    createBiquadFilter: () => node({ type: '', frequency: param(0), Q: param(0) }),
    createOscillator: () => node({ type: '', frequency: param(0), start() {}, stop() {} }),
  };
}

function organ(block = BLOCK, story = {}) {
  const o = { S_story: story, setTimeout: () => 0, clearTimeout() {}, window: {}, __ctx: fakeCtx(), __log: [] };
  vm.createContext(o);
  vm.runInContext(block + '\n_organCtx = __ctx; _organOut = __ctx.createGain();', o);
  o.run = (expr) => vm.runInContext(expr, o);
  return o;
}

// Play one pass at its own event times and record [track, start, length] for every voice
// released. The expected lengths pair each note-on with the next note-off of its own track.
function durations(o, roundOff) {
  o.run(`ORGAN.roundOff = ${roundOff};
    const __shut = _organShut;
    _organShut = (slot, when) => { if (slot.active) __log.push([slot.track, slot.startTime, when - slot.startTime]); __shut(slot, when); };
    for (const ev of _organBuildSeq().events)
      ev.on ? _organNoteOn(ev.midi, ev.vel, ev.track, ev.t) : _organNoteOff(ev.midi, ev.track, ev.t);`);
  const events = o.run('_organBuildSeq().events');
  const want = [];
  events.forEach((ev, i) => {
    if (!ev.on) return;
    const off = events.slice(i + 1).find(e => !e.on && e.track === ev.track && e.midi === ev.midi);
    want.push([ev.track, ev.t, off.t - ev.t]);
  });
  const key = (a) => a.map(([t, s, d]) => `${t}|${s.toFixed(6)}|${d.toFixed(6)}`).sort();
  return { got: key(o.__log), want: key(want) };
}

test('§DX-02am — the default registration is a Principal: harmonic n sounds at 1/n', () => {
  const o = organ();
  for (const n of [1, 2, 3, 4, 5, 6]) expect(o.run(`_organHarmAmp(${n})`)).toBeCloseTo(1 / n, 2);
});

test('§DX-02an(b) — at every round offset, each canon voice sounds for exactly its own note', () => {
  for (let ro = 1; ro <= 56; ro++) {
    const { got, want } = durations(organ(), ro);
    expect(got, `roundOff ${ro}`).toEqual(want);
  }
});

test('§DX-02an(b) — the check bites: releasing by pitch alone deforms the canon at colliding offsets', () => {
  const planted = BLOCK.replace('v.midi === midi && v.track === track &&', 'v.midi === midi &&');
  expect(planted).not.toBe(BLOCK);
  const bad = [];
  for (let ro = 1; ro <= 56; ro++) {
    const { got, want } = durations(organ(planted), ro);
    if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(ro);
  }
  expect(bad.length).toBeGreaterThan(0);
  expect(bad).not.toContain(14);
});

test('§DX-02an(a) — a tempo change lands on the loop seam: the pass advances by what it played', () => {
  const o = organ();
  const before = o.run(`({ events: _organEvents, span: _organSpan } = _organBuildSeq()); _organStart = 0;
    _organIdx = _organEvents.length; ({ span: _organSpan, last: _organEvents[_organEvents.length - 1].t })`);
  const after = o.run(`ORGAN.bpm = 144; _organNextPass();
    ({ start: _organStart, span: _organSpan, last: _organEvents[_organEvents.length - 1].t, idx: _organIdx })`);
  expect(after.start).toBeCloseTo(before.span, 9);
  expect(after.span).toBeCloseTo(before.span / 2, 9);
  expect(after.last).toBeCloseTo(before.last / 2, 9);
  expect(after.idx).toBe(0);
});

test('§AUDIO-01 — the stops follow the run: void deepens the falloff, the act opens the top, the clock closes the filter', () => {
  const stops = (story) => organ(BLOCK, story).run('_organSetStops(); [ORGAN.falloffDB, ORGAN.drawbars[5], ORGAN.cutHz]');
  expect(stops({ voidPressure: 0, storyAct: 1, day: 1 })).toEqual([6, 0.25, 5000]);
  expect(stops({ voidPressure: 10, storyAct: 8, day: 49 })).toEqual([12, 1, 800]);
});

test('§AUDIO-01 — storyRender sets the stops after the loot, and the sidebar carries the toggle', () => {
  expect(GAME).toMatch(/const lootMsg {2}= storyCollectLoot\(node\);\s*_organSetStops\(\);/);
  expect(GAME).toContain('id="s-organ" onclick="_organToggle()"');
});
