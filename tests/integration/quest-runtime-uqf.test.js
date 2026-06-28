'use strict';
const { test, expect } = require('@playwright/test');

// ── §ARCH-01 Phase 1 — UQF runtime (inert) ───────────────────────────────────
//
// Phase 1 only DEFINES the Universal Quest Format engine; nothing in the live
// game calls it yet. These tests prove (a) the engine's pure pieces work —
// validateQuest contracts, adaptLegacyQuest shape, the declarative canActivate
// gate, and an executed bit chain mutating S_story exactly like the legacy
// path — and (b) that loading the engine changed no game behavior (the legacy
// skill-check resolver _rollCeremonia is still the only thing wired in).

test.describe('UQF runtime — Phase 1 inert engine (§ARCH-01)', () => {
  test('the engine is defined and exposed, schema = UQF-1.0', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => ({
      schema:    QuestRuntime.SCHEMA_VERSION,
      onWindow:  typeof window.QuestRuntime === 'object' && typeof window.validateQuest === 'function',
      hasGate:   typeof QuestRuntime.canActivate === 'function',
      hasExec:   typeof QuestRuntime.execBits === 'function',
      kinds:     Object.keys(QuestRuntime.HANDLERS).sort().join(','),
    }));
    expect(r.schema).toBe('UQF-1.0');
    expect(r.onWindow).toBe(true);
    expect(r.hasGate).toBe(true);
    expect(r.hasExec).toBe(true);
    // Every bit kind in the registry has a handler.
    expect(r.kinds).toBe('_legacy_fn,choice,combat,flag_write,item_check,item_remove,mission_bit,narrative,reward,skill_check,unlock');
  });

  test('validateQuest enforces bit contracts', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const good = { schema:'UQF-1.0', id:'q_test', bits:[
        { kind:'skill_check', stat:'WIS', dc:13, onPass:[{ kind:'flag_write', set:['fooDone'] }] },
        { kind:'reward', xp:150, gold:50, knowledge:'A fact.' },
      ]};
      const noBits  = { schema:'UQF-1.0', id:'q_empty', bits:[] };
      const badKind = { schema:'UQF-1.0', id:'q_bad', bits:[{ kind:'teleport', x:1 }] };
      const badSC   = { schema:'UQF-1.0', id:'q_sc', bits:[{ kind:'skill_check', stat:'ZZ', dc:'high' }] };
      const noSchema= { id:'q_ns', bits:[{ kind:'reward', xp:1 }] };
      return {
        good:   validateQuest(good),
        noBits: validateQuest(noBits),
        badKind:validateQuest(badKind),
        badSC:  validateQuest(badSC),
        noSchema:validateQuest(noSchema),
      };
    });
    expect(r.good.valid).toBe(true);
    expect(r.good.errors).toEqual([]);
    expect(r.noBits.valid).toBe(false);
    expect(r.noBits.errors).toContain('No mission bits defined');
    expect(r.badKind.valid).toBe(false);
    expect(r.badKind.errors.some(e => /Unknown bit kind: teleport/.test(e))).toBe(true);
    expect(r.badSC.valid).toBe(false);                    // bad stat + non-number dc + no onPass/onFail
    expect(r.noSchema.valid).toBe(false);
    expect(r.noSchema.errors).toContain('Missing schema version');
  });

  test('adaptLegacyQuest wraps a real legacy skill_check without parsing its closures', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // quest_wis_01-style legacy entry: skill_check with checkAbility + closures.
      const legacy = { id:'quest_demo', type:'skill_check', title:'Demo',
        activateNode:'DK', activateCond:()=>true,
        checkAbility:'wis', checkLabel:'Insight', checkDC:13,
        onPass:(S)=>{ S.demoPassed = true; }, onFail:(S)=>{}, retryable:false };
      const a = adaptLegacyQuest('quest_demo', legacy);
      return {
        schema: a.schema, id: a.id, arc: a.arc,
        gateLegacy: typeof a.gate._legacyFn === 'function',
        bitKind: a.bits[0].kind, stat: a.bits[0].stat, dc: a.bits[0].dc,
        onPassWrapped: a.bits[0].onPass[0].kind,           // _legacy_fn — closure preserved verbatim
        sourcePreserved: a._source === legacy,
        // already-UQF passes through untouched
        passthrough: adaptLegacyQuest('x', { schema:'UQF-1.0', id:'x' }).schema,
      };
    });
    expect(r.schema).toBe('0.legacy');
    expect(r.arc).toBe('quest_demo');
    expect(r.gateLegacy).toBe(true);
    expect(r.bitKind).toBe('skill_check');
    expect(r.stat).toBe('WIS');                            // uppercased from checkAbility:'wis'
    expect(r.dc).toBe(13);
    expect(r.onPassWrapped).toBe('_legacy_fn');
    expect(r.sourcePreserved).toBe(true);
    expect(r.passthrough).toBe('UQF-1.0');
  });

  test('canActivate evaluates a declarative gate against S_story flags', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      // Inject a throwaway UQF quest into QUEST_DB (test-only; not played).
      QUEST_DB.__gatetest = { id:'__gatetest', schema:'UQF-1.0',
        gate:{ flags:['needA'], notFlags:['blockB'] }, bits:[{ kind:'narrative', msg:'x' }] };
      const snap = () => QuestRuntime.canActivate('__gatetest');
      S_story.needA = false; S_story.blockB = false; const a = snap();   // missing required flag
      S_story.needA = true;                          const b = snap();   // gate satisfied
      S_story.blockB = true;                         const c = snap();   // blocked by notFlags
      delete QUEST_DB.__gatetest;
      return { a, b, c };
    });
    expect(r.a).toBe(false);
    expect(r.b).toBe(true);
    expect(r.c).toBe(false);
  });

  test('execBits runs a chain that mutates S_story exactly like a quest reward', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.xp = 0; S_story.gold = 100; S_story.inventory = []; S_story.knowledge = []; delete S_story.chainFlag;
      QuestRuntime.execBits([
        { kind:'flag_write', set:['chainFlag'] },
        { kind:'reward', xp:50, gold:25, items:[{ name:'Test Token', icon:'📦', sell:0, type:'token' }], knowledge:'Learned a thing.' },
      ], {});
      return {
        flag: S_story.chainFlag, xp: S_story.xp, gold: S_story.gold,
        invName: (S_story.inventory[0]||{}).name, know: S_story.knowledge[0],
      };
    });
    expect(r.flag).toBe(true);
    expect(r.xp).toBe(50);
    expect(r.gold).toBe(125);
    expect(r.invName).toBe('Test Token');
    expect(r.know).toBe('Learned a thing.');
  });

  test('the engine is inert — the live legacy skill-check path is unchanged', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => ({
      // legacy resolver still present and still the wired path
      legacyResolver: typeof _rollCeremonia === 'function',
      // QuestRuntime.run was the old stub name; the engine no longer auto-runs anything
      noAutoRun: !('run' in QuestRuntime) || typeof QuestRuntime.run !== 'function',
    }));
    expect(r.legacyResolver).toBe(true);
    // run() was a stub; its removal (or inertness) confirms no new auto-execution wired in.
    expect(r.noAutoRun).toBe(true);
  });
});

// ── §ARCH-01 Phase 2 — dual-path dispatch (engine now drives UQF quests) ──────
//
// Phase 2 wires the engine into the live quest path: _rollCeremonia (the real
// skill-check button entry) delegates to QuestRuntime when a quest carries
// schema:'UQF-1.0', the quest panel renders a Roll card for such quests, and
// storyCheckQuests honors the declarative gate on activation. Every legacy
// quest stays byte-for-byte on the old closure path. We use DC 1 (always pass)
// / DC 99 (always fail) to make the d20 roll deterministic.

test.describe('UQF dual-path dispatch — Phase 2 (§ARCH-01)', () => {
  // Each test seeds a clean, minimal S_story, injects throwaway quests, drives
  // the REAL entry points, then deletes the synthetic quests.

  test('_rollCeremonia routes a passing UQF skill_check through the engine', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests = {};
      S_story.abilityScores = { str:10, dex:10, con:10, int:10, wis:14, cha:10 };
      S_story.level = 1; S_story.xp = 0; S_story.gold = 0; S_story.day = 1;
      S_story.inventory = []; S_story.knowledge = [];
      QUEST_DB.__uqf_pass = { id:'__uqf_pass', schema:'UQF-1.0', title:'UQF Pass Demo',
        activateNode:'DK', retryable:false, bits:[
          { kind:'skill_check', stat:'WIS', skill:'Insight', dc:1,
            onPass:[
              { kind:'flag_write', set:['uqfPassFlag'] },
              { kind:'reward', xp:100, gold:40, items:[{ name:'UQF Token', icon:'📦', sell:0, type:'token' }], knowledge:'UQF works.' },
              { kind:'narrative', msg:'UQF pass narrative.' },
            ],
            onFail:[{ kind:'narrative', msg:'UQF fail narrative.' }] }] };
      S_story.quests.__uqf_pass = 'active';
      _rollCeremonia('__uqf_pass');                       // the real skill-check button entry
      const out = {
        status: S_story.quests.__uqf_pass,
        flag: S_story.uqfPassFlag, xp: S_story.xp, gold: S_story.gold,
        item: (S_story.inventory.find(i => i.name === 'UQF Token') || {}).name,
        know: S_story.knowledge.includes('UQF works.'),
      };
      delete QUEST_DB.__uqf_pass;
      return out;
    });
    expect(r.status).toBe('done');
    expect(r.flag).toBe(true);
    expect(r.xp).toBe(100);
    expect(r.gold).toBe(40);
    expect(r.item).toBe('UQF Token');
    expect(r.know).toBe(true);
  });

  test('_rollCeremonia routes a failing UQF skill_check: non-retryable → failed, retryable → stays', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const mk = (id, retryable) => ({ id, schema:'UQF-1.0', title:id, activateNode:'DK', retryable, bits:[
        { kind:'skill_check', stat:'WIS', dc:99,           // unreachable DC → always fail
          onPass:[{ kind:'narrative', msg:'never' }],
          onFail:[{ kind:'flag_write', set:['uqfFailFlag'] }, { kind:'narrative', msg:'failed' }] }] });
      S_story.quests = {}; S_story.abilityScores = { wis:14 }; S_story.level = 1; S_story.day = 1;
      S_story.inventory = []; delete S_story.uqfFailFlag; delete S_story.skillCheckAttempts;
      QUEST_DB.__uqf_fail = mk('__uqf_fail', false);
      QUEST_DB.__uqf_retry = mk('__uqf_retry', true);
      S_story.quests.__uqf_fail = 'active'; S_story.quests.__uqf_retry = 'active';
      _rollCeremonia('__uqf_fail');
      _rollCeremonia('__uqf_retry');
      const out = {
        failStatus: S_story.quests.__uqf_fail,
        retryStatus: S_story.quests.__uqf_retry,
        onFailRan: S_story.uqfFailFlag,
        attemptLogged: !!(S_story.skillCheckAttempts || {}).__uqf_retry,
      };
      delete QUEST_DB.__uqf_fail; delete QUEST_DB.__uqf_retry;
      return out;
    });
    expect(r.failStatus).toBe('failed');
    expect(r.retryStatus).toBe('active');     // retryable failures don't lock the quest
    expect(r.onFailRan).toBe(true);
    expect(r.attemptLogged).toBe(true);
  });

  test('a legacy skill_check still resolves on the legacy path (checkPassFlag granted)', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests = {}; S_story.abilityScores = { wis:14 }; S_story.level = 1; S_story.xp = 0; S_story.day = 1;
      S_story.inventory = []; delete S_story.__legacyDone;
      // No schema field → must take the legacy branch of _rollCeremonia.
      QUEST_DB.__legacy = { id:'__legacy', type:'skill_check', title:'Legacy Demo', activateNode:'DK',
        checkAbility:'wis', checkLabel:'Insight', checkDC:1, checkPassFlag:'__legacyDone',
        xpAward:10, passText:'legacy pass', failText:'legacy fail', retryable:false };
      S_story.quests.__legacy = 'active';
      _rollCeremonia('__legacy');
      const out = {
        status: S_story.quests.__legacy,
        legacyFlag: S_story.__legacyDone,        // set only by the legacy checkPassFlag path
        xp: S_story.xp,                          // legacy xpAward path
      };
      delete QUEST_DB.__legacy;
      return out;
    });
    expect(r.status).toBe('done');
    expect(r.legacyFlag).toBe(true);    // proves the legacy branch ran, not the UQF one
    expect(r.xp).toBe(10);
  });

  test('the quest panel renders a Roll Ceremonia card for a UQF skill_check', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const html = await page.evaluate(() => {
      S_story.quests = {}; S_story.abilityScores = { wis:14 }; S_story.level = 1;
      QUEST_DB.__uqf_panel = { id:'__uqf_panel', schema:'UQF-1.0', title:'Panel Demo', activateNode:'DK',
        hint:'A test vignette.', bits:[{ kind:'skill_check', stat:'WIS', skill:'Insight', dc:13, onPass:[], onFail:[] }] };
      S_story.quests.__uqf_panel = 'active';
      storyRender(NODE_MAP[S_story.currentCode]);
      const out = (document.getElementById('story-content') || document.body).innerHTML;
      delete QUEST_DB.__uqf_panel;
      return out;
    });
    expect(html).toContain('Panel Demo');                       // the UQF quest title
    expect(html).toContain('Roll Ceremonia — Insight DC 13');   // a working roll button, DC from the bit
  });

  test('storyCheckQuests honors a UQF declarative gate on activation', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests = {}; delete S_story.gateOpen;
      QUEST_DB.__uqf_gate = { id:'__uqf_gate', schema:'UQF-1.0', title:'Gate Demo',
        activateNode:'DK', gate:{ flags:['gateOpen'] }, bits:[{ kind:'narrative', msg:'x' }] };
      const node = { code:'DK' };
      storyCheckQuests(node);                       // gate flag unset → must NOT activate
      const before = S_story.quests.__uqf_gate;
      S_story.gateOpen = true;
      storyCheckQuests(node);                       // gate satisfied → activates
      const after = S_story.quests.__uqf_gate;
      delete QUEST_DB.__uqf_gate;
      return { before, after };
    });
    expect(r.before).toBeUndefined();   // declarative gate blocked activation
    expect(r.after).toBe('active');     // opened once the flag was set
  });
});

// ── §ARCH-01 Phase 3 — first real arc migration: §WISDOM-01 quest_wis_01 ──────
//
// quest_wis_01 ("Mask Check") is migrated from the legacy skill_check closure
// format to UQF v1.0. These tests prove byte-level behavior parity with the
// legacy resolver: the gate gates activation, a pass grants the wisPage1_masks
// flag AND its mission-bit inventory token (exactly as legacy
// _grantMissionBit(checkPassFlag) did) plus +150gp / +250xp / the W1 knowledge
// entry, and a non-retryable fail locks the quest.

test.describe('§WISDOM-01 migrated to UQF — quest_wis_01 (§ARCH-01 Phase 3)', () => {
  test('the quest is now UQF and still validates', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      const q = QUEST_DB.quest_wis_01;
      return { schema: q.schema, hasGate: !!(q.gate && q.gate.flags), bitKind: q.bits[0].kind,
               valid: validateQuest(q).valid, errors: validateQuest(q).errors };
    });
    expect(r.schema).toBe('UQF-1.0');
    expect(r.hasGate).toBe(true);
    expect(r.bitKind).toBe('skill_check');
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  test('activation honors the wisHookReceived gate at LCY', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests = {}; delete S_story.wisHookReceived;
      storyCheckQuests({ code:'LCY' });                 // hook not yet received → no activate
      const before = S_story.quests.quest_wis_01;
      S_story.wisHookReceived = true;
      storyCheckQuests({ code:'LCY' });                 // hook received → activates
      return { before, after: S_story.quests.quest_wis_01 };
    });
    expect(r.before).toBeUndefined();
    expect(r.after).toBe('active');
  });

  test('a PASS grants the flag + mission-bit token + 150gp/250xp + W1 knowledge', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      S_story.quests = { quest_wis_01:'active' };
      S_story.abilityScores = { wis:40 };               // huge mod ⇒ DC 13 always passes
      S_story.level = 20; S_story.xp = 1000000; S_story.gold = 500; S_story.day = 1;
      S_story.inventory = []; S_story.knowledge = [];
      delete S_story.wisPage1_masks;
      _rollCeremonia('quest_wis_01');                   // the real roll-button entry
      return {
        status: S_story.quests.quest_wis_01,
        flag: S_story.wisPage1_masks,
        token: !!S_story.inventory.find(i => i.flagRef === 'wisPage1_masks' && i.type === 'mission_bit'),
        gold: S_story.gold, xp: S_story.xp,
        knowledge: S_story.knowledge.some(k => k.startsWith('Ardley W1 — The Mask')),
      };
    });
    expect(r.status).toBe('done');
    expect(r.flag).toBe(true);
    expect(r.token).toBe(true);          // mission-bit token preserved from legacy _grantMissionBit
    expect(r.gold).toBe(650);            // +150
    expect(r.xp).toBe(1000250);          // +250
    expect(r.knowledge).toBe(true);
  });

  test('a non-retryable FAIL locks the quest and grants nothing', async ({ page }) => {
    await page.goto('/roll2hit-v3.html');
    const r = await page.evaluate(() => {
      QUEST_DB.quest_wis_01.bits[0].dc = 99;            // force fail (fresh page each test)
      S_story.quests = { quest_wis_01:'active' };
      S_story.abilityScores = { wis:14 }; S_story.level = 1; S_story.xp = 0; S_story.gold = 0; S_story.day = 1;
      S_story.inventory = []; S_story.knowledge = []; delete S_story.wisPage1_masks;
      _rollCeremonia('quest_wis_01');
      return {
        status: S_story.quests.quest_wis_01,
        flag: !!S_story.wisPage1_masks,
        token: !!S_story.inventory.find(i => i.flagRef === 'wisPage1_masks'),
        gold: S_story.gold, xp: S_story.xp,
      };
    });
    expect(r.status).toBe('failed');     // retryable:false ⇒ locked
    expect(r.flag).toBe(false);
    expect(r.token).toBe(false);
    expect(r.gold).toBe(0);
    expect(r.xp).toBe(0);
  });
});
