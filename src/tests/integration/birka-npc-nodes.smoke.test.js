// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §PLAY-01-G Friendships With Magic follow-up — the Birka NPC cards must render at
// REAL nodes. Before this fix the birkaNpcs render map keyed five start-city NPCs to
// dead pre-§WALK sublocation codes (CI/IN/TV/BA/CY) that have no NODE_MAP entry, so
// their cards rendered nowhere. §PLAY-01-D remapped CI→LHR (yael); this pass remaps
// the four siblings by each NPC's own quest activateNode:
//   IN→TLL (brynn / "The First Inn")   TV→MHQ (quill / "Birka Tavern")
//   BA→LLA (pachelbel / "The Rough Bar")   CY→HKG (crov + auros / "Neon Undercity")
const { test, expect } = require('@playwright/test');

// npcKey → the node its card must now render at, and the quest whose activateNode proves it.
const MAP = [
  { npc: 'yael',      node: 'LHR', quest: 'quest_slums_cleanup' },     // §PLAY-01-D (regression guard)
  { npc: 'brynn',     node: 'TLL', quest: 'quest_brynn_firewood' },
  { npc: 'quill',     node: 'MHQ', quest: 'quest_couperin_lute' },
  { npc: 'pachelbel', node: 'LLA', quest: 'quest_pachelbel_shipment' },
  { npc: 'crov',      node: 'HKG', quest: 'quest_pit_training' },
  { npc: 'auros',     node: 'HKG', quest: 'quest_void_below' },
];
const DEAD_CODES = ['CI', 'IN', 'TV', 'BA', 'CY']; // must no longer be birkaNpcs keys

test.describe('§PLAY-01-G — Birka NPC cards render at real nodes', () => {
  test('every start-city NPC is keyed to a real node that matches its quest activateNode', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await page.goto('/play.html');

    const r = await page.evaluate(({ MAP, DEAD_CODES }) => {
      const out = { perNpc: {}, deadKeysGone: {}, cardName: {} };

      // The render map is a local literal inside storyRender — read it from the function source
      // so we assert the ACTUAL routing table the game uses, not a re-derivation.
      const src = storyRender.toString();
      const decl = src.slice(src.indexOf('const birkaNpcs ='));
      const literal = decl.slice(0, decl.indexOf('\n')); // the single-line object literal

      for (const { npc, node, quest } of MAP) {
        const keyedToNode = new RegExp(node + ":\\[[^\\]]*'" + npc + "'").test(literal);
        const nodeExists  = !!NODE_MAP[node];
        const q           = QUEST_DB[quest];
        const activateOk  = !!q && q.activateNode === node;   // the data that justified the remap
        const dialogueOk  = !!(NPC_DIALOGUES[npc] && NPC_DIALOGUES[npc].meta && NPC_DIALOGUES[npc].meta.name);
        out.perNpc[npc] = { keyedToNode, nodeExists, activateOk, dialogueOk, activateNode: q && q.activateNode };

        // the card actually builds and carries the NPC's display name
        const box = document.createElement('div');
        try { _renderNpcCard(npc, box); } catch (e) { out.cardName[npc] = 'THREW: ' + e; continue; }
        out.cardName[npc] = box.textContent.includes(NPC_DIALOGUES[npc].meta.name);
      }

      // none of the dead pre-§WALK codes survive as a birkaNpcs render key
      for (const code of DEAD_CODES) out.deadKeysGone[code] = !new RegExp('[,{]\\s*' + code + ':\\[').test(literal);

      return out;
    }, { MAP, DEAD_CODES });

    for (const { npc, node } of MAP) {
      const p = r.perNpc[npc];
      expect(p.keyedToNode, `${npc} keyed to ${node} in birkaNpcs`).toBe(true);
      expect(p.nodeExists, `${node} exists in NODE_MAP`).toBe(true);
      expect(p.activateOk, `${npc}'s quest activateNode is ${node} (got ${p.activateNode})`).toBe(true);
      expect(p.dialogueOk, `${npc} has NPC_DIALOGUES meta.name`).toBe(true);
      expect(r.cardName[npc], `${npc}'s card builds and shows its name`).toBe(true);
    }
    for (const code of DEAD_CODES) {
      expect(r.deadKeysGone[code], `dead code ${code} no longer a birkaNpcs key`).toBe(true);
    }
    expect(pageErrors).toEqual([]);
  });
});
