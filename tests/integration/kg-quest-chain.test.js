'use strict';
const { test, expect } = require('@playwright/test');

// ── §KG Increment 3 — St. Petersburg → Moscow corridor quest chain ────────────
//
// 11 UQF-1.0 side quests anchored to the five Inc-2 NPCs, plus the ONE new
// mechanic: a generic per-monster `monsterKills` counter (battle-win handler),
// read by the cull/duel quests' `completion.countMin` dotted paths.
//
// These tests drive the REAL runtime in-page (QuestRuntime.canActivate /
// canComplete over the live QUEST_DB) — no mocks — so they prove the locked
// design table actually resolves:
//   • existence + schema + npc-key resolution (the audit rule),
//   • the W→E gate sequence unlocks in order (mission LISTING, never movement),
//   • monsterKills increments feed countMin completion,
//   • delivery (itemsAll + atNode) and skill_check shapes are well-formed.
// Design/lock: lab-reports/lab-report-kg-corridor-quest-chain.md

const CHAIN = ['quest_kg_01','quest_kg_02','quest_kg_03','quest_kg_04','quest_kg_05','quest_kg_06','quest_kg_07','quest_kg_08','quest_kg_09','quest_kg_10','quest_kg_11'];

// LOCKED npc keys (lab report §2) — hyphens survive slugification (whitespace-only replace).
const NPC = {
  quest_kg_01:'recruiter_volkov',            quest_kg_02:'recruiter_volkov',
  quest_kg_03:'commissar-instructor_roshkova', quest_kg_04:'commissar-instructor_roshkova',
  quest_kg_05:'pit-master_grimka',           quest_kg_06:'pit-master_grimka', quest_kg_07:'pit-master_grimka',
  quest_kg_08:'technician_iosif',            quest_kg_09:'technician_iosif',
  quest_kg_10:'quartermaster_lena',          quest_kg_11:'quartermaster_lena',
};

test.describe('§KG Increment 3 — corridor quest chain', () => {

  test('all 11 quests exist as UQF-1.0 with npc keys that resolve to their giver node', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const rows = await page.evaluate((chain) => {
      const slug = s => (s || '').toLowerCase().replace(/\s/g, '_');
      return chain.map(id => {
        const q = QUEST_DB[id];
        if (!q) return { id, exists: false };
        const node = NODE_MAP[q.activateNode];
        return {
          id, exists: true, schema: q.schema, npc: q.npc,
          activateNode: q.activateNode,
          npcResolves: !!node && slug(node.npc) === q.npc, // the wbapi-core advise rule
        };
      });
    }, CHAIN);
    for (const r of rows) {
      expect(r.exists, `${r.id} exists`).toBe(true);
      expect(r.schema, `${r.id} schema`).toBe('UQF-1.0');
      expect(r.npc, `${r.id} npc key`).toBe(NPC[r.id]);
      expect(r.npcResolves, `${r.id} npc "${r.npc}" resolves at ${r.activateNode}`).toBe(true);
    }
  });

  test('the new generic monsterKills counter is in _S_DEFAULTS and feeds countMin completion', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const defaults = _S_DEFAULTS();
      const out = { hasDefault: Object.prototype.hasOwnProperty.call(defaults, 'monsterKills'),
                    defaultIsEmptyObj: JSON.stringify(defaults.monsterKills) === '{}' };
      // kg_01 cull: 3 sparring_droid kills → complete; 2 → not.
      S_story.monsterKills = { sparring_droid: 3 };
      out.cullAt3 = QuestRuntime.canComplete('quest_kg_01');
      S_story.monsterKills = { sparring_droid: 2 };
      out.cullAt2 = QuestRuntime.canComplete('quest_kg_01');
      // kg_06 dual-key cull: needs BOTH gladiator_bot>=3 AND zavod_sparbot>=3.
      S_story.monsterKills = { gladiator_bot: 3, zavod_sparbot: 2 };
      out.dualPartial = QuestRuntime.canComplete('quest_kg_06');
      S_story.monsterKills = { gladiator_bot: 3, zavod_sparbot: 3 };
      out.dualFull = QuestRuntime.canComplete('quest_kg_06');
      return out;
    });
    expect(r.hasDefault).toBe(true);
    expect(r.defaultIsEmptyObj).toBe(true);
    expect(r.cullAt3).toBe(true);
    expect(r.cullAt2).toBe(false);
    expect(r.dualPartial).toBe(false);
    expect(r.dualFull).toBe(true);
  });

  test('gate sequence unlocks the chain W→E in order (listing only)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const steps = await page.evaluate(() => {
      const can = id => QuestRuntime.canActivate(id);
      S_story.quests = S_story.quests || {};
      const s = {};
      // Fresh: only kg_01 (gate {}) is offered; kg_02 waits on kgEnlisted.
      s.fresh_kg01 = can('quest_kg_01');
      s.fresh_kg02 = can('quest_kg_02');
      S_story.kgEnlisted = true;            s.after_enlist_kg02 = can('quest_kg_02');
      S_story.kgManifestDelivered = true;   s.after_manifest_kg03 = can('quest_kg_03');
      S_story.quests['quest_kg_03'] = 'done'; s.after_kg03done_kg04 = can('quest_kg_04');
      S_story.kgFormsPassed = true;         s.after_forms_kg05 = can('quest_kg_05');
      S_story.quests['quest_kg_05'] = 'done'; s.after_kg05done_kg06 = can('quest_kg_06');
      S_story.quests['quest_kg_06'] = 'done'; s.after_kg06done_kg07 = can('quest_kg_07');
      S_story.kgCoreDelivered = true;       s.after_core_kg08 = can('quest_kg_08');
      S_story.quests['quest_kg_08'] = 'done'; s.after_kg08done_kg09 = can('quest_kg_09');
      S_story.kgSimCleared = true;          s.after_sim_kg10 = can('quest_kg_10');
      S_story.quests['quest_kg_10'] = 'done'; s.after_kg10done_kg11 = can('quest_kg_11');
      return s;
    });
    expect(steps.fresh_kg01).toBe(true);
    expect(steps.fresh_kg02).toBe(false);
    expect(steps.after_enlist_kg02).toBe(true);
    expect(steps.after_manifest_kg03).toBe(true);
    expect(steps.after_kg03done_kg04).toBe(true);
    expect(steps.after_forms_kg05).toBe(true);
    expect(steps.after_kg05done_kg06).toBe(true);
    expect(steps.after_kg06done_kg07).toBe(true);
    expect(steps.after_core_kg08).toBe(true);
    expect(steps.after_kg08done_kg09).toBe(true);
    expect(steps.after_sim_kg10).toBe(true);
    expect(steps.after_kg10done_kg11).toBe(true);
  });

  test('delivery completes only at the destination node; skill_check quests are well-formed', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const out = {};
      // kg_02 delivery: manifest in bag, but completion only fires while standing at KMS.
      S_story.inventory = [{ name: 'Sealed Recruit Manifest' }];
      S_story.currentCode = 'SPB'; out.deliverAtWrong = QuestRuntime.canComplete('quest_kg_02');
      S_story.currentCode = 'KMS'; out.deliverAtRight = QuestRuntime.canComplete('quest_kg_02');
      S_story.inventory = []; S_story.currentCode = 'KMS';
      out.deliverNoItem = QuestRuntime.canComplete('quest_kg_02');
      // skill_check bit shape (kg_04 WIS/Insight DC10, kg_11 INT/Investigation DC12).
      const scOf = id => (QUEST_DB[id].bits || []).find(b => b.kind === 'skill_check');
      const sc04 = scOf('quest_kg_04'), sc11 = scOf('quest_kg_11');
      out.kg04 = { type: QUEST_DB.quest_kg_04.type, retryable: QUEST_DB.quest_kg_04.retryable,
                   stat: sc04 && sc04.stat, skill: sc04 && sc04.skill, dc: sc04 && sc04.dc,
                   setsFlag: !!(sc04 && sc04.onPass || []).find(b => b.kind === 'mission_bit' && b.flag === 'kgFormsPassed') };
      out.kg11 = { type: QUEST_DB.quest_kg_11.type, retryable: QUEST_DB.quest_kg_11.retryable,
                   stat: sc11 && sc11.stat, skill: sc11 && sc11.skill, dc: sc11 && sc11.dc,
                   setsFlag: !!(sc11 && sc11.onPass || []).find(b => b.kind === 'mission_bit' && b.flag === 'kgCorridorCleared') };
      return out;
    });
    expect(r.deliverAtWrong).toBe(false);
    expect(r.deliverAtRight).toBe(true);
    expect(r.deliverNoItem).toBe(false);
    expect(r.kg04).toEqual({ type: 'skill_check', retryable: true, stat: 'WIS', skill: 'Insight', dc: 10, setsFlag: true });
    expect(r.kg11).toEqual({ type: 'skill_check', retryable: true, stat: 'INT', skill: 'Investigation', dc: 12, setsFlag: true });
  });
});
