// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02fd — YAEL_PATROL_NODES is read first-match-wins, so its declaration order
// decides which of Yael's five field lines a player can ever see.
//
// Why this test exists. Four of the five conditions are PERMANENT LATCHES —
// quest_slums_cleanup complete, yaelEscortUsed, favor+act, yaelNamedReportDelivered.
// Once one sets it never clears. Under first-match-wins that makes the highest-ranked
// condition which can ever be true the ONLY line the player will ever see, and every
// entry below it is dead content from that moment on.
//
// The fifth condition is gameDay parity: it depends on nothing and is true half the
// time. Declared FIRST, as it was, it took every odd day outright and starved the other
// four into an even-day-only rotation that then collapsed to whichever latch set first.
//
// So two properties are pinned here, and they are properties, not a transcription of
// today's table: the parity entry is LAST, and the latching entries run newest arc beat
// first, so the line advances with the story instead of freezing at the earliest one.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const GAME = path.join(__dirname, '..', '..', '..', 'play.html');

function patrolEntries() {
  const src = fs.readFileSync(GAME, 'utf8');
  const start = src.indexOf('const YAEL_PATROL_NODES = [');
  expect(start, 'YAEL_PATROL_NODES is declared').toBeGreaterThan(-1);
  const end = src.indexOf('\n];', start);
  expect(end, 'the declaration is terminated').toBeGreaterThan(start);
  return src.slice(start, end).split('\n')
    .filter((l) => l.includes('condition:'))
    .map((l) => {
      const node = /nodeSlug:'([A-Z]+)'/.exec(l);
      return { node: node && node[1], src: l };
    });
}

test.describe('§DX-02fd — Yael patrol declaration order', () => {
  test('five entries, and the day-parity fallback is declared last', () => {
    const rows = patrolEntries();
    expect(rows).toHaveLength(5);
    const parity = rows.filter((r) => r.src.includes('gameDay'));
    expect(parity, 'exactly one entry is the unconditional day-parity fallback').toHaveLength(1);
    expect(rows.indexOf(parity[0]), 'the parity entry is last — it depends on nothing and would take every odd day')
      .toBe(rows.length - 1);
  });

  test('the latching entries run newest arc beat first', () => {
    const rows = patrolEntries().slice(0, -1);
    const order = ['yaelNamedReportDelivered', "_npcFavor('yael') >= 3", 'yaelEscortUsed', 'quest_slums_cleanup'];
    order.forEach((needle, i) => {
      expect(rows[i].src, `entry ${i + 1} is gated on ${needle}`).toContain(needle);
    });
  });

  test('every entry above the fallback is a latch, which is WHY the order matters', () => {
    const rows = patrolEntries().slice(0, -1);
    for (const r of rows) {
      expect(r.src, 'a latching condition reads saved story state, never the clock')
        .not.toContain('gameDay');
    }
  });

  test('the patrol never removes Yael from her home node', () => {
    const src = fs.readFileSync(GAME, 'utf8');
    const start = src.indexOf('function _nodeHookBirkaYaelPatrolLine(');
    expect(start).toBeGreaterThan(-1);
    const body = src.slice(start, src.indexOf('\nfunction ', start + 10));
    expect(body, 'the hook is scoped away from LHR').toContain("node.code !== 'LHR'");
    // _nodeHookBirkaYaelNamedReport fires AT LHR, so suppressing the home card while
    // _getYaelLocation() matches would make Layer 74 unreachable once any latch sets.
    expect(body, 'the hook only appends a row').toContain('appendChild');
    expect(body, 'the hook removes nothing').not.toContain('remove()');
  });
});
