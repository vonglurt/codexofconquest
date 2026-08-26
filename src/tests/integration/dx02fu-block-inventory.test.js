// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §DX-02fu — the §VM-01-G-FU-f ship record said "THE BLOCK INVENTORY IS COMPLETE".
// Measured at HEAD it was 44 of 47: three bare `node.code ===` blocks remained below
// the migration front in `storyRender`.
//
// One is the HW1 `whisperSaintSeen` latch, deliberate and documented inline — it has
// nothing to render, so no vocabulary claims it. The other two were censused and then
// dropped by the slice plan's arc partition, each falling between two slices:
//
//   · NWI — the §SPARK-01 Warmth Eel panel. Named FIRST in the §11 census table's
//     multi-state row, and then G-FU-b took KSU/ALF, G-FU-c took PDL/MLA, G-FU-d took
//     SEN and G-FU-e took DA2/DA3. Nobody took NWI.
//   · HKG — Layer 41's "Void Below" descend chip, an `info-chip battle-chip` inserted
//     into the engine's own chip row.
//
// Both were shapes the shipped vocabulary already expressed. The value of closing this
// is an honest inventory claim, so what this pins is the CLAIM, not the two blocks:
// the only bare node-code render gate left below the front is the documented latch.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'play.html'), 'utf8');

test.describe('§DX-02fu — the inventory claim is true now', () => {

  test('the two migrated blocks left storyRender and live in their vocabulary', () => {
    // NWI's panel is gone from the render path entirely — its four states are data now,
    // and `story-ow-eel` survives only as the NODE_PANELS id.
    expect(SRC).not.toContain("if (node.code === 'NWI')");
    const eelIds = [...SRC.matchAll(/story-ow-eel/g)].length;
    expect(eelIds).toBe(4);

    // The descend gate exists exactly once, and that once is inside the hook body.
    // A sibling HKG block (S6's joint Weckmann/Auros line) opens with the identical
    // favour gate, so the chip's own quest condition is what identifies it.
    const gate = "S_story.quests['quest_void_below'] === 'active'\n      && !S_story.defeatedBattles['CY_VOID']";
    expect([...SRC.matchAll(new RegExp(gate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))].length).toBe(1);
    const hookStart = SRC.indexOf('function _nodeHookHkgVoidBelow');
    const hookEnd = SRC.indexOf('const NODE_HOOKS = [');
    expect(hookStart).toBeGreaterThan(0);
    expect(SRC.indexOf(gate)).toBeGreaterThan(hookStart);
    expect(SRC.indexOf(gate)).toBeLessThan(hookEnd);
  });

  test('both are registered in a vocabulary, not re-hidden', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => ({
      eelPanels: NODE_PANELS.filter(p => p.id === 'story-ow-eel').length,
      eelNodes: [...new Set(NODE_PANELS.filter(p => p.id === 'story-ow-eel').flatMap(p => p.nodes))],
      hook: NODE_HOOKS.find(h => h.id === 'hkg-void-below') ? true : false,
      hookNodes: (NODE_HOOKS.find(h => h.id === 'hkg-void-below') || {}).nodes,
    }));
    // Four states, four entries — `css` is a string, and each state paints differently.
    expect(r.eelPanels).toBe(4);
    expect(r.eelNodes).toEqual(['NWI']);
    expect(r.hook).toBe(true);
    expect(r.hookNodes).toEqual(['HKG']);
  });

  test('the four eel states are mutually exclusive and total — exactly one always matches', async ({ page }) => {
    await page.goto('/play.html');
    const counts = await page.evaluate(() => {
      const panels = NODE_PANELS.filter(p => p.id === 'story-ow-eel');
      const out = [];
      // All eight combinations of the three flags the source if/else-if chain read.
      for (const escorted of [false, true]) for (const found of [false, true]) for (const noticed of [false, true]) {
        const st = { warmthEelEscorted: escorted, warmthEelFound: found, seaStrangenessNoticed: noticed };
        out.push(panels.filter(p => p.when(st)).length);
      }
      return out;
    });
    expect(counts).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
  });

  test('each state renders the text the inline block rendered', async ({ page }) => {
    await page.goto('/play.html');
    const seen = await page.evaluate(() => {
      const pick = (st) => {
        const p = NODE_PANELS.filter(x => x.id === 'story-ow-eel').find(x => x.when(st));
        return { text: p.text, css: p.css };
      };
      return {
        escorted: pick({ warmthEelEscorted: true }),
        found:    pick({ warmthEelFound: true }),
        noticed:  pick({ seaStrangenessNoticed: true }),
        none:     pick({}),
      };
    });
    expect(seen.escorted.text).toContain('The eel is gone south');
    expect(seen.escorted.css).toContain('#2a5a2a');
    expect(seen.found.text).toContain('WIS Nature DC 14');
    expect(seen.found.css).toContain('#2a3a6a');
    expect(seen.noticed.text).toContain('INT Investigation DC 13');
    expect(seen.noticed.css).toContain('#3a3a2a');
    expect(seen.none.text).toContain('The water here is absolutely still');
    expect(seen.none.css).toContain('#3a2a2a');
  });

  test('the descend chip still builds, and still only under its four conditions', async ({ page }) => {
    await page.goto('/play.html');
    const r = await page.evaluate(() => {
      const node = { code:'HKG', label:'Depths' };
      const make = () => { const d = document.createElement('div'); document.body.appendChild(d); return d; };
      const run = (st) => {
        Object.assign(S_story, st);
        const row = make();
        _runNodeHook('hkg-void-below', node, { row });
        return row.querySelectorAll('.battle-chip').length;
      };
      const base = { npcFavorability: { crov: 2, auros: 2 }, quests: { quest_void_below: 'active' }, defeatedBattles: {} };
      return {
        all:        run(base),
        noQuest:    run({ ...base, quests: {} }),
        alreadyWon: run({ ...base, defeatedBattles: { CY_VOID: true } }),
        noFavor:    run({ ...base, npcFavorability: { crov: 0, auros: 2 } }),
      };
    });
    expect(r).toEqual({ all: 1, noQuest: 0, alreadyWon: 0, noFavor: 0 });
  });

  test('the only bare node-code render gate left below the front is the documented HW1 latch', () => {
    const front = SRC.indexOf("_runNodeHook('hkg-void-below'");
    expect(front).toBeGreaterThan(0);
    const tail = SRC.slice(front);
    // `storyRender`'s own remaining comparisons; the sleep/quest-waypoint reads below
    // are not render gates and are excluded by name.
    const gates = [...tail.matchAll(/if \(node\.code === '(\w+)'/g)].map(m => m[1]).filter(c => c !== 'INN');
    expect(gates).toEqual(['HW1']);
  });
});
