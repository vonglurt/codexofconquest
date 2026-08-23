// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
// §AUDIT-03c — no quest may name a node that does not exist, and the three dead
// author-shorthand codes of `710bb75` stay dead.
//
// Why this test exists: commit `710bb75` ("Fix 8 activateNode errors: SF→LCY,
// CQ→CDG, FR→AMS") remapped eight quests off three codes — `SF`, `CQ`, `FR` —
// that were never `NODE_MAP` keys. Two of those remaps were WRONG (`SF` is the
// Storefront = `STN`, not `LCY`; caught and fixed two months later by §VM-01-G3),
// and the audit that produced them only ever looked at `activateNode` — the
// sibling `waypointNode` field was never checked at all. Nothing in CI asserted
// either field resolves, so a dangling node reference could be introduced, shipped,
// and "fixed" to the wrong city without a single red.
//
// Pure-node (no browser): these are authoring-corpus invariants, so they lock the
// same WBAPI parse `./api.sh audit` and the :1367 server read.

const { test, expect } = require('@playwright/test');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const GAME = path.join(ROOT, 'index.html');

function freshWorld() {
  delete require.cache[require.resolve(path.join(ROOT, 'js', 'wbapi-core.js'))];
  const W = require(path.join(ROOT, 'js', 'wbapi-core.js'));
  W.load(GAME);
  return W;
}

// The three codes 710bb75 remapped away from. None was ever a NODE_MAP key; each
// was author shorthand for a node that exists under a different code.
const DEAD_CODES = { SF: 'STN', CQ: 'CDG', FR: 'AMS' };

// The audited set, with the target each quest was re-derived to (§AUDIT-03c, the
// §NPC-01-SF4 method: the quest's own prose + waypointNode + the node hook/panel
// that renders its buttons). `null` activateNode = staged by code, not by arrival.
const AUDITED = {
  quest_tl_01:      { activateNode: 'STN',  waypointNode: 'STN' },  // NOT LCY — SF = the Map Shop
  quest_tl_03:      { activateNode: 'STN',  waypointNode: 'STN' },
  quest_cat_05:     { activateNode: 'CDG',  waypointNode: 'CDG' },
  quest_cat_06:     { activateNode: 'CDG',  waypointNode: 'CDG' },
  quest_cat_void:   { activateNode: 'CDG',  waypointNode: 'CDG' },
  quest_la_riva_01: { activateNode: null,   waypointNode: 'AMS' },  // Kenickie sends you east
  quest_la_riva_02: { activateNode: null,   waypointNode: 'AMS' },  // Connie, at the Row
  quest_la_riva_03: { activateNode: null,   waypointNode: 'CDG' },  // Aldo gives, Kenickie receives
};

test.describe('§AUDIT-03c — quest node references resolve', () => {
  test('every activateNode and waypointNode names a real NODE_MAP entry', () => {
    const W = freshWorld();
    const keys = new Set(Object.keys(W.nodeMap));
    expect(keys.size).toBeGreaterThan(400);

    const bad = [];
    for (const [id, q] of Object.entries(W.questDb)) {
      for (const field of ['activateNode', 'waypointNode']) {
        const v = q[field];
        if (v === null || v === undefined || v === '') continue;   // legitimately unset
        if (typeof v !== 'string' || !keys.has(v)) bad.push(`${id}.${field} = ${JSON.stringify(v)}`);
      }
    }
    expect(bad, `quest node references with no NODE_MAP entry:\n  ${bad.join('\n  ')}`).toEqual([]);
  });

  test('the three dead author-shorthand codes stay dead — and their real nodes are the live ones', () => {
    const W = freshWorld();
    for (const [dead, real] of Object.entries(DEAD_CODES)) {
      expect(W.nodeMap[dead], `${dead} must not be a NODE_MAP key`).toBeUndefined();
      expect(W.nodeMap[real], `${real} (the node ${dead} meant) must exist`).toBeTruthy();
      const refs = Object.entries(W.questDb)
        .filter(([, q]) => q.activateNode === dead || q.waypointNode === dead)
        .map(([id]) => id);
      expect(refs, `quests still pointing at the dead code ${dead}`).toEqual([]);
    }
    // The identifications the audit rests on, pinned by the nodes' own labels.
    expect(W.nodeMap.STN.label).toBe('The Map Shop');
    expect(W.nodeMap.CDG.label).toBe('The Cat Quarter');
    expect(W.nodeMap.AMS.label).toBe("Fishmonger's Row");
  });

  test('the eight quests 710bb75 remapped hold their re-derived targets', () => {
    const W = freshWorld();
    for (const [id, want] of Object.entries(AUDITED)) {
      const q = W.questDb[id];
      expect(q, `${id} missing from the corpus`).toBeTruthy();
      expect(q.activateNode ?? null, `${id}.activateNode`).toBe(want.activateNode);
      expect(q.waypointNode, `${id}.waypointNode`).toBe(want.waypointNode);
    }
  });

  test('quest_cat_06 is anchored to the profile key `jimmy`, not the CDG inline-name slug', () => {
    const W = freshWorld();
    // Jimmy "Two-Tails" Carbonara reaches npcKeyVocab() twice: as the NPC_DIALOGUES
    // profile key `jimmy` (registry 3) and as CDG's inline npc string normalized to
    // `jimmy_two-tails` (registry 2). §AUDIT-03b anchored cat_06 to the slug while its
    // three siblings took the profile — one arc, one character, two index headings.
    // Was: the slug still resolves, so this is §AUDIT-03k and not a broken key. §AUDIT-03k
    // shipped 2026-08-04 and the slug now resolves TO the profile — it is an alias, out of
    // the vocabulary on purpose, so a quest still carrying it advise-warns.
    expect(W.npcKeyOk('jimmy_two-tails'), 'the slug should no longer validate alongside the profile').toBe(false);
    expect(W.npcCanonicalKey('jimmy_two-tails')).toBe('jimmy');
    expect(W.npcDialogues.jimmy.meta.name).toContain('Two-Tails');
    for (const id of ['quest_cat_02', 'quest_cat_04', 'quest_cat_06']) {
      expect(W.questDb[id].npc, `${id} must use the profile key`).toBe('jimmy');
    }
    expect(Object.entries(W.questDb).filter(([, q]) => q.npc === 'jimmy_two-tails').map(([id]) => id)).toEqual([]);
  });
});
